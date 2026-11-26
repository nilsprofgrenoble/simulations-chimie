// node src/simulations/icpModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './icpModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
let s = 99; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
ok(Math.abs(M.energieEV(213.9) - 5.797) < 0.01, 'énergie de la raie du zinc');
for (const r of M.RAIES) { ok(M.fraction(r, M.T_PLASMA) > 1e5 * 0 + M.fraction(r, M.T_FLAMME) * 10, `${r.s} : bien plus d'atomes excités dans le plasma`); ok(M.fraction(r, M.T_PLASMA) < 0.5, `${r.s} : le fondamental domine encore à 6 500 K`); }
ok(M.pourDixMille(M.raie('Zn'), M.T_FLAMME) < 1e-5, 'Zn : aucun atome excité dans la flamme');
ok(M.pourDixMille(M.raie('Zn'), M.T_PLASMA) > 0.3 && M.pourDixMille(M.raie('Zn'), M.T_PLASMA) < 5, 'Zn : quelques atomes sur 10 000 dans le plasma');
ok(M.pourDixMille(M.raie('Na'), M.T_FLAMME) > 1 && M.pourDixMille(M.raie('Na'), M.T_FLAMME) < 3, 'Na à 2500 K : environ 2 sur 10 000');
// dans la flamme, seul Na est visible ; dans le plasma, les éléments ont des intensités comparables (à moins de 3 décades)
ok(M.partRelative('Na', M.T_FLAMME) > 0.97, 'flamme : le sodium domine le spectre');
const parts = M.ECH.map(x => M.partRelative(x, M.T_PLASMA)); ok(parts.every(p => p > 0.02 && p < 0.5), 'plasma : toutes les raies sont visibles : ' + parts.map(p => p.toFixed(3)));
ok(Math.abs(parts.reduce((a, b) => a + b, 0) - 1) < 1e-9, 'parts normalisées');
ok(Math.abs(M.intensiteRel('Na', M.T_FLAMME) - 100) < 1e-9, 'référence 100');
ok(M.fractionNeutre(M.raie('Na'), M.T_PLASMA) < 0.02 && M.fractionNeutre(M.raie('Na'), M.T_FLAMME) > 0.8 && M.fractionNeutre(M.raie('Zn'), M.T_PLASMA) > 0.5, 'ionisation : Na ionisé dans le plasma, pas dans la flamme');
// tirages : fréquences observées
let e = M.lancer(M.etatVide(M.T_PLASMA), M.T_PLASMA, 20000, rnd);
ok(e.n === 20000 && e.h.reduce((a, b) => a + b, 0) === 20000, 'comptage');
for (const x of M.ECH) ok(Math.abs((e.par[x] ?? 0) / 20000 - M.partRelative(x, M.T_PLASMA)) < 0.015, 'fréquence de ' + x);
ok(M.lancer(e, M.T_FLAMME, 10, rnd).n === 10, 'changement de T : nouvel état');
ok(M.lancer(e, M.T_PLASMA, 100, rnd).n === M.MAX_PHOTONS, 'plafond');
let ef = M.lancer(M.etatVide(M.T_FLAMME), M.T_FLAMME, 5000, rnd); ok((ef.par.Na ?? 0) / 5000 > 0.95, 'flamme : presque tous les photons viennent du sodium');
// gamme dynamique
ok(Math.abs(M.signalICP(100) / M.signalICP(1) - 100) < 3 && Math.abs(M.signalICP(0.01) / M.signalICP(0.001) - 10) < 0.01, 'ICP linéaire sur plusieurs décades');
ok(M.absorbanceSAA(100) < 4 && M.absorbanceSAA(100) / M.absorbanceSAA(1) < 40 && M.absorbanceSAA(20) / M.absorbanceSAA(2) < 8.2 && M.absorbanceSAA(2) > 0.2, 'SAA : courbure et saturation');
ok(M.horsPlageSAA(50) && !M.horsPlageSAA(5), 'plage de la SAA');
ok(M.angleReseau(300) < M.angleReseau(600) && M.angleReseau(600) < M.angleReseau(800), 'dispersion du réseau croissante');
ok(Math.abs(M.angleReseau(589) - 44.9) < 0.5 && M.angleReseau(800) < 80 && M.angleReseau(200) > 10, 'angles du réseau 1200 traits/mm');
// défis
for (let i = 0; i < 50; i++) { const d = M.tirageDefiDosage(rnd); ok(Math.abs(d.cEt * d.I / d.IEt - d.vrai) < 0.05 * d.vrai + 0.01, 'défi dosage cohérent'); const r = M.tirageDefiRaie(rnd); ok(r.choix.length === 4 && new Set(r.choix.map(x => x.s)).size === 4 && r.choix.some(x => x.s === r.r.s), 'défi raie'); }
console.log('Sim 314 modèle :', n, 'vérifications réussies.');
