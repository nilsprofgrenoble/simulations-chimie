import assert from 'node:assert/strict';
import * as M from './tcrModele.js';
import * as MAB from './mabModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const pres = (a, b, t, m) => { assert.ok(Math.abs(a - b) <= t, `${m} : ${a} ≠ ${b}`); n++; };

// équation de référence venue de la sim 294 : 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O
const r = MAB.reaction('MnO4m/Mn2p', 'O2/H2O2', 'acide');
ok(MAB.coefDe(r.final.reactifs, 'MnO4m') === M.COEF_B && MAB.coefDe(r.final.reactifs, 'H2O2') === M.COEF_A, 'coefficients 2 et 5 cohérents avec la sim 294');
ok(MAB.coefDe(r.final.reactifs, 'Hp') === 6 && MAB.coefDe(r.final.produits, 'H2O') === 8, '6 H⁺ et 8 H₂O');

// situation du parcours : V_E = 17,40 mL
const g = M.situation(M.SIT_GUIDE);
pres(g.cA, 0.0870, 1e-12, 'cA'); pres(g.nA, 0.870, 1e-12, 'nA'); pres(g.Veq, 17.40, 1e-9, 'Veq du parcours');
pres(M.c0Depuis(17.4, 0.02, 10, 10), 0.870, 1e-12, 'retour à c0');
pres(M.c0Depuis(17.4, 0.02, 10, 10) * M.M_H2O2, 29.58, 1e-9, 'titre massique ≈ 3 %');

// bilan de matière sur toute la burette, pour 3 000 situations
let nbV = 0;
for (let i = 0; i < 3000; i++) {
  const c0 = 0.5 + (i % 40) * 0.02, cB = [0.01, 0.02, 0.04][i % 3], VA = 5 + (i % 16), s = M.situation({ c0, dil: 10, VA, cB });
  for (const V of [0, 0.05, s.Veq / 2, s.Veq - 0.05, s.Veq, s.Veq + 0.05, s.Veq + 1]) {
    const e = M.etat(s, V);
    pres(e.nH2O2, s.nA - 2.5 * (e.nB - e.nExces), 1e-9, 'H₂O₂ restant');        // consommation de H₂O₂ = 5/2 de MnO₄⁻ consommé
    ok(e.nH2O2 >= 0 && e.nExces >= 0 && e.cMnO4 >= 0, 'quantités positives');
    ok(e.nH2O2 === 0 || e.nExces === 0, 'un seul réactif en excès');
    if (V < s.Veq - 1e-6) { ok(e.regime === 'avant' && e.cMnO4 === 0 && !e.visible, 'avant : incolore'); nbV++; }
    if (V > s.Veq + 0.1 - 1e-9 && s.Veq + V < 60) { ok(e.regime === 'apres' && e.visible, 'deux gouttes après : rose visible'); }
  }
  pres(M.etat(s, s.Veq).nH2O2, 0, 1e-9, 'à l’équivalence plus de H₂O₂');
  pres(M.etat(s, s.Veq).nExces, 0, 1e-9, 'à l’équivalence plus de MnO₄⁻');
}
// la teinte rose apparaît à moins d’une goutte après l’équivalence (parcours)
const dvVisible = (() => { for (let dv = 0; dv < 0.2; dv += 0.001) if (M.etat(g, g.Veq + dv).visible) return dv; return 9; })();
ok(dvVisible > 0 && dvVisible < M.V_GOUTTE, `visible après ${dvVisible.toFixed(3)} mL (moins d’une goutte)`);
ok(!M.etat(g, g.Veq).visible, 'à l’équivalence exacte : pas de teinte');

// couleurs : monotone du pâle vers le foncé
const lum = c => { const m = M.couleurMnO4(c).match(/\d+/g).map(Number); return m[0] * 0.3 + m[1] * 0.59 + m[2] * 0.11; };
ok(M.couleurMnO4(0) === 'rgb(248, 250, 252)' && M.couleurMnO4(1e-6) === 'rgb(248, 250, 252)', 'sous le seuil : incolore');
let prev = 1e9; for (const c of [2e-5, 1e-4, 5e-4, 1e-3, 5e-3, 0.02, 0.5]) { const l = lum(c); ok(l <= prev + 1e-9, `luminosité décroissante à ${c}`); prev = l; }
ok(M.motTeinte(0) === 'incolore' && M.motTeinte(3e-5) === 'rose pâle' && M.motTeinte(5e-4) === 'rose' && M.motTeinte(0.01) === 'violet', 'mots de teinte');

// défis
for (let i = 0; i < 2000; i++) {
  const d = M.tirageDefiDosage(); ok(d.s.Veq > 6 && d.s.Veq < 24.5, `V_E du défi dans la burette (${d.s.Veq.toFixed(2)})`);
  const c = M.tirageDefiCalcul(); ok(c.Ve >= 8 && c.Ve <= 22, 'Ve'); ok(c.c0 >= 0.4 && c.c0 <= 1.4, 'c0 plausible');
  pres(c.c0, M.c0Depuis(c.Ve, c.cB, c.VA, c.dil), 1e-12, 'c0 du défi calcul'); pres(c.tm, c.c0 * 34, 1e-9, 'titre massique');
  ok(Math.abs(c.Ve * 10 - Math.round(c.Ve * 10)) < 1e-9, 'Ve arrondi au dixième avant le calcul');
}
console.log(`tcrModele : ${n} vérifications, 0 échec`);
