// node src/simulations/frxModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './frxModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
for (const e of M.ELEMENTS) {
  ok(e.Kb > e.Ka && e.EK > e.Kb && M.niveauL(e) > 0 && M.niveauM(e) >= 0 && M.niveauM(e) < M.niveauL(e), `niveaux ${e.s}`);
  ok(Math.abs(M.moseley(e.Z) - e.Ka) / e.Ka < 0.02, `Moseley ${e.s} ${M.moseley(e.Z).toFixed(3)} vs ${e.Ka}`);
  ok(M.ionise(e, e.EK) && !M.ionise(e, e.EK - 0.01), 'seuil');
}
for (let i = 1; i < M.ELEMENTS.length; i++) ok(M.ELEMENTS[i].Ka > M.ELEMENTS[i - 1].Ka && M.ELEMENTS[i].Z > M.ELEMENTS[i - 1].Z, 'Ka croît avec Z');
const fe = M.element('Fe'); ok(Math.abs(M.niveauL(fe) - 0.708) < 1e-9 && Math.abs(fe.EK - M.niveauL(fe) - fe.Ka) < 1e-12, 'Fe : EL = 0,708 keV');
ok(Math.abs(M.lamNm(6.404) - 0.1941) < 1e-3 && Math.abs(M.lamNm(8.048) - 0.1544) < 1e-3, 'λ = hc/E');
// spectre : pic Kα au bon endroit, Kβ plus faible, fond sans pic
const comp = [{ s: 'Fe', w: 10 }]; const S = k => M.spectre(comp, k);
ok(S(6.404) > S(7.058) && S(7.058) > S(7.6) && S(6.404) > 2000, 'Fe : Kα > Kβ > fond');
ok(M.spectre(comp, 6.404, false) < 2400 * 1.001 && M.spectre(comp, 6.404, false) > 2399, 'hauteur nette du pic Kα');
// intensité proportionnelle à la teneur (sans fond)
for (const e of M.ELEMENTS) { const a = M.spectre([{ s: e.s, w: 2 }], e.Ka, false), b = M.spectre([{ s: e.s, w: 8 }], e.Ka, false); ok(Math.abs(b / a - 4) < 1e-6, `linéarité ${e.s}`); }
// échantillons : les raies des éléments présents sont séparées de plus de 3 écarts-types (résolues) pour Kα
for (const ech of Object.values(M.ECHANTILLONS)) { const l = ech.comp.map(c => M.element(c.s).Ka).sort((a, b) => a - b); for (let i = 1; i < l.length; i++) ok(l[i] - l[i - 1] > 3 * M.SIGMA, `${ech.nom} résolu`); }
ok(Math.abs(M.teneurDepuisEtalon(5, 1200, 1560) - 6.5) < 1e-12, 'étalonnage');
let r = 7; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
for (let i = 0; i < 2000; i++) {
  const d = M.tirageDefiElement(rnd); ok(d.choix.length === 4 && d.choix.filter(x => x.s === d.e.s).length === 1, 'défi élément');
  for (const a of d.choix) for (const b of d.choix) if (a !== b) ok(Math.abs(a.Ka - b.Ka) > 0.3, 'choix distincts');
  const q = M.tirageDefiDosage(rnd); ok(Math.abs(q.vrai - q.wEt * q.I / q.IEt) < 1e-12 && q.vrai >= 0.9 && q.vrai <= 15.5, 'défi dosage');
}
console.log(`frxModele : ${n} contrôles OK`);
