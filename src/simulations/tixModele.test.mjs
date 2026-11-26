import * as M from './tixModele.js';
let n = 0, ko = 0; const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 10) console.log('ÉCHEC', m); } };
const sg = M.situation(M.SIT_GUIDE);
ok(Math.abs(sg.Veq - 16) < 1e-9, 'Veq guidé 16 mL'); ok(Math.abs(sg.nA - 0.8) < 1e-9, 'nA 0,8 mmol'); ok(Math.abs(sg.cA - 0.04) < 1e-12, 'cA');
for (const acide of [true, false]) for (const peuKI of [false, true]) for (const c0 of [0.25, 0.4, 0.75]) for (const cB of [0.05, 0.1, 0.2]) for (const VA of [10, 20, 25]) {
  const s = M.situation({ c0, dil: 10, VA, cB, acide, peuKI });
  ok(s.nI2 >= 0 && s.nI2 <= s.nA + 1e-12, 'nI2 borné'); if (!acide) ok(s.nI2 === 0, 'sans acide pas de diiode');
  if (acide && !peuKI) ok(Math.abs(s.nI2 - s.nA) < 1e-12, 'iodure en excès : n(I2) = n(ClO-)');
  if (acide && peuKI && s.nA > 0.25) ok(Math.abs(s.nI2 - 0.25) < 1e-12, 'iodure limitant');
  let prec = Infinity;
  for (let V = 0; V <= 25 + 1e-9; V += 0.05) { const e = M.etat(s, V, true);
    ok(e.nI2 <= prec + 1e-12 && e.nI2 >= 0, 'nI2 décroît'); prec = e.nI2;
    ok(Math.abs(s.nI2 - e.nI2 - Math.min(e.nS / 2, s.nI2)) < 1e-9, 'bilan I2'); ok(isFinite(e.cI2), 'finite');
    if (s.nI2 > 0 && V < s.Veq - 0.06) ok(e.nI2 > 0, 'diiode restant avant équivalence'); }
  if (s.nI2 > 0 && s.Veq < 25) { const a = M.etat(s, s.Veq + 0.05, true), b = M.etat(s, s.Veq - 0.05, true); ok(!a.bleu, 'incolore après'); ok(b.bleu, 'bleu avant'); }
}
ok(M.motTeinte(0, true) === 'incolore', 'mot'); ok(/^rgb/.test(M.couleurIode(0.02, true)) && /^rgb/.test(M.couleurIode(0.02)), 'couleurs');
for (let i = 0; i < 2000; i++) { const d = M.tirageDefiDosage(); ok(d.s.Veq >= 7 && d.s.Veq <= 22, 'défi dosage V_E'); ok(Math.abs(M.c0Depuis(d.s.Veq, d.cB, d.VA, 10) - d.c0) < 1e-9, 'c0 retrouvée');
  const c = M.tirageDefiCalcul(); ok(c.c0 >= 0.2 && c.c0 <= 0.9, 'défi calcul c0'); ok(Math.abs(M.c0Depuis(c.Ve, c.cB, c.VA, c.dil) - c.c0) < 1e-9, 'c0 calcul'); }
console.log(`tixModele : ${n} vérifications, ${ko} échec(s)`);
