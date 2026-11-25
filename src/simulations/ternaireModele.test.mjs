import * as T from './ternaireModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const A = T.composition(0.45, 0.10);
for (const type of ['I', 'II', 'III']) {
  for (let h = 0; h <= 1.0001; h += 0.025) for (let s = 0; s <= 1.0001 - h; s += 0.025) {
    const g = T.composition(h, s), a = T.analyser(type, g);
    ok(a.n >= 1 && a.n <= 3, `n ${type} ${h} ${s}`);
    const som = a.phases.reduce((x, p) => x + p.frac, 0); ok(Math.abs(som - 1) < 1e-6, `somme fractions ${type} ${h} ${s} ${som}`);
    for (const p of a.phases) { ok(p.frac > -1e-6, `fraction négative ${type} ${h} ${s}`); ok(Math.abs(p.comp.e + p.comp.h + p.comp.s - 1) < 1e-6 && p.comp.e > -1e-6 && p.comp.h > -1e-6 && p.comp.s > -1e-6, `comp ${type} ${h} ${s}`); }
    // règle du levier : retrouver la composition globale
    const rec = { e: 0, h: 0, s: 0 }; for (const p of a.phases) { rec.e += p.frac * p.comp.e; rec.h += p.frac * p.comp.h; rec.s += p.frac * p.comp.s; }
    ok(Math.abs(rec.e - g.e) < 1e-6 && Math.abs(rec.h - g.h) < 1e-6 && Math.abs(rec.s - g.s) < 1e-6, `levier ${type} h=${h} s=${s}`);
  }
}
// Mélange A du cours (45 % huile, 45 % eau, 10 % mélange actif)
const aI = T.analyser('I', A), aII = T.analyser('II', A), aIII = T.analyser('III', A);
ok(aI.n === 2 && aI.phases[0].id === 'huile' && aI.phases[1].nature === 'H/E', 'A en Winsor I');
ok(aII.n === 2 && aII.phases[0].id === 'eau' && aII.phases[1].nature === 'E/H', 'A en Winsor II');
ok(aIII.n === 3, 'A en Winsor III'); 
ok(Math.abs(aIII.phases[1].frac - 0.30) < 1e-6 && Math.abs(aIII.phases[0].frac - 0.35) < 1e-6, 'fractions Winsor III = 35/30/35');
const m = aI.phases[1].comp; console.log('Winsor I : phase micro', Math.round(m.e * 100), Math.round(m.h * 100), Math.round(m.s * 100), ' frac micro', aI.phases[1].frac.toFixed(2));
ok(m.e > 0.6 && m.e < 0.8 && m.h > 0.1 && m.h < 0.2 && m.s > 0.12 && m.s < 0.2, 'composition ME proche de ≈ 70/15/15');
// symétrie I / II
ok(Math.abs(aI.phases[1].comp.s - aII.phases[1].comp.s) < 1e-9 && Math.abs(aI.phases[1].comp.e - aII.phases[1].comp.h) < 1e-9, 'miroir I/II');
// seuil monophasique
for (const t of ['I', 'II', 'III']) { const s = T.seuilMonophasique(t); console.log('seuil', t, s.toFixed(3)); ok(s > 0.28 && s < 0.4, 'seuil ' + t); }
// ajout de mélange actif : le nombre de phases ne remonte jamais
for (const t of ['I', 'II', 'III']) { let prec = 9; for (let s = 0.05; s < 0.9; s += 0.01) { const nn = T.analyser(t, T.melangeA(s)).n; ok(nn <= prec || (t === 'III' && prec === 3), `monotone ${t} ${s}`); prec = Math.min(prec, nn); } }
// dilution
const d = T.dilutionHuile(0.7, 0.4); ok(Math.abs(d.e - 0.42) < 1e-9 && Math.abs(d.s - 0.18) < 1e-9 && Math.abs(d.e + d.h + d.s - 1) < 1e-9, 'dilution');
// tirages de défis
let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 300; i++) { const t = T.tirageLecture(rng); ok(['I', 'II', 'III'].includes(t.type) && t.a.n >= 1, 'tirage lecture'); const c = T.tirageCompo(rng); ok(c.a.n === 2 && c.vrai > 0 && c.vrai < 100, 'tirage compo'); }
const rep = {}; for (let i = 0; i < 400; i++) { const t = T.tirageLecture(rng); const k = t.type + t.a.n + T.excesDe(t.a); rep[k] = (rep[k] || 0) + 1; } console.log(rep);
console.log(n + ' vérifications OK');
