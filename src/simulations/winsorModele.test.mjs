import * as W from './winsorModele.js';
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad <= 15) console.log('ÉCHEC :', m); } };
for (let S = 1; S <= 12; S += 0.25) for (const a of [6, 10, 20, 29, 30, 50]) {
  const x = W.etat(S, a); ok(Math.abs(x.o + x.e + x.m - 1) < 1e-9, 'somme des volumes'); ok(x.o >= 0 && x.e >= 0 && x.m > 0, `volumes positifs S=${S} a=${a}`);
  if (a >= W.A_IV) ok(x.type === 'IV' && x.o === 0 && x.e === 0, 'Winsor IV : une seule phase');
  if (a < W.A_IV && x.type === 'I') ok(x.e === 0 && x.o > 0, 'Winsor I : pas d’eau en excès');
  if (a < W.A_IV && x.type === 'II') ok(x.o === 0 && x.e > 0, 'Winsor II : pas d’huile en excès');
  if (a < W.A_IV && x.type === 'III') ok(x.o > 0 && x.e > 0, 'Winsor III : deux excès');
}
// ordre des types le long de la salinité (a = 6 %) : I puis III puis II, une seule fois chacun
const ord = []; for (let S = 1; S <= 12; S += 0.1) { const t = W.etat(S).type; if (ord[ord.length - 1] !== t) ord.push(t); }
ok(ord.join('') === 'IIIIII', `ordre des types : ${ord}`);
// monotonie : l'excès d'eau ne diminue pas avec le sel, l'excès d'huile ne croît pas au-delà de l'optimum
let eP = -1, oP = 9; for (let S = 1; S <= 12; S += 0.1) { const x = W.etat(S); ok(x.e >= eP - 1e-9, 'excès d’eau croissant'); eP = x.e; if (S >= W.SAL_OPT) { ok(x.o <= oP + 1e-9, 'excès d’huile décroissant'); oP = x.o; } }
// optimum : les deux excès sont égaux à SAL_OPT
const x7 = W.etat(W.SAL_OPT); ok(Math.abs(x7.o - x7.e) < 1e-9 && x7.type === 'III', 'optimum à 7 %'); ok(W.estOptimum(7) && !W.estOptimum(5) && !W.estOptimum(9), 'estOptimum');
ok(Math.abs(W.masseSel(7) - 0.84) < 1e-9, 'masse de sel à 7 % pour 12 g d’eau : 0,84 g');
ok(W.flaconOptimum(7) === 7, 'flacon optimum = 7');
for (let i = 0; i < 3000; i++) { const t = W.tirageOptimum(); ok(t.vrai >= 3 && t.vrai <= 10, 'flacon optimum plausible'); ok(W.serie(t.opt)[t.vrai - 1].type === 'III', 'le flacon optimum est triphasique'); ok(t.vrai === Math.round(t.opt) || Math.abs(t.vrai - t.opt) < 0.8, `flacon ${t.vrai} proche de ${t.opt}`);
  const d = W.tirageDiagnostic(); ok(W.verifieDiagnostic(d, d.type, d.vrai), 'diagnostic juste'); ok(!W.verifieDiagnostic(d, d.type, d.vrai === 'ok' ? 'plus' : 'ok'), 'mauvaise action refusée'); }
ok(W.rapportR(3) === '< 1' && W.rapportR(7) === '≈ 1' && W.rapportR(10) === '> 1', 'R de Winsor');
console.log(bad ? `${bad} échec(s) sur ${n}` : `${n} vérifications OK`); process.exit(bad ? 1 : 0);
