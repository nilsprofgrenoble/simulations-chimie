// Recalculs de l'audit SIM64 (réfraction). Usage : node audit/scripts/recalc-SIM64.mjs
import { MILIEUX, milieu, refraction, angleLimite, mesurerI2, pente, pecheur, lire } from '../../src/simulations/optiqueModele.js';
const RAD = Math.PI / 180, sin = x => Math.sin(x * RAD);
const INCONNUS = [1.33, 1.36, 1.40, 1.47, 1.52], ANG = []; for (let a = 0; a <= 85; a += 5) ANG.push(a);
const r2 = x => Math.round(x * 100) / 100;
function combos(arr, k) { const out = []; (function f(s, c) { if (c.length === k) { out.push(c); return; } for (let i = s; i < arr.length; i++) f(i + 1, [...c, arr[i]]); })(0, []); return out; }
// ---- A. défi « indice » : tolérance 0,03 sur n ; mesures au demi-degré
console.log('A. DÉFI INDICE (|réponse − n| ≤ 0,03 ; i₂ lu au demi-degré)');
const A1 = ANG.filter(a => a > 0);
for (const n of INCONNUS) {
  const pt = a => [sin(mesurerI2(n, a)), sin(a)];
  const unique = A1.map(a => { const [x, y] = pt(a); return { a, err: y / x - n }; });
  const mauvaisU = unique.filter(u => Math.abs(u.err) > 0.03).map(u => `${u.a}° (${(u.err >= 0 ? '+' : '') + u.err.toFixed(3)})`);
  let nb = 0, ech = 0, nbM = 0, pireS = 0, pireM = 0;
  for (const k of [3, 4, 5]) for (const c of combos(A1, k)) { ech++;
    const s = r2(pente(c.map(pt))), m = r2(c.reduce((t, a) => { const [x, y] = pt(a); return t + y / x; }, 0) / c.length);
    if (Math.abs(s - n) > 0.03 + 1e-9) nb++; if (Math.abs(m - n) > 0.03 + 1e-9) nbM++; pireS = Math.max(pireS, Math.abs(s - n)); pireM = Math.max(pireM, Math.abs(m - n)); }
  console.log(`  n=${n} : mesure unique refusée pour i₁ = ${mauvaisU.join(', ') || 'aucun'} | pente (3-5 pts) refusée ${nb}/${ech} (pire écart ${pireS.toFixed(3)}) | moyenne des rapports refusée ${nbM}/${ech} (pire ${pireM.toFixed(3)})`);
}
// jeux « raisonnables » : angles espacés entre 20° et 80°
for (const n of INCONNUS) { const ok = [[20, 40, 60], [30, 45, 60], [30, 50, 70], [20, 30, 40, 50, 60, 70, 80], [10, 20, 30, 40, 50]].map(c => { const pt = a => [sin(mesurerI2(n, a)), sin(a)]; return `${c.join('/')}→${r2(pente(c.map(pt))).toFixed(2)}`; }); console.log(`  n=${n} jeux usuels : ${ok.join(' ; ')}`); }
// ---- B. étape « compare » : l'eau sucrée a-t-elle une pente plus grande que l'eau ?
console.log('B. ÉTAPE « compare » : pente(eau sucrée) > pente(eau) pour 3 angles chacun ?');
let tot = 0, inv = 0, egal = 0; const A3 = combos(A1.filter(a => a >= 10), 3);
for (const ce of A3) for (const cs of A3) { tot++; const pe = r2(pente(ce.map(a => [sin(mesurerI2(1.33, a)), sin(a)]))), ps = r2(pente(cs.map(a => [sin(mesurerI2(1.36, a)), sin(a)]))); if (ps < pe) inv++; else if (ps === pe) egal++; }
console.log(`  couples de triplets : ${tot} ; pente affichée sucrée < eau : ${inv} (${(100 * inv / tot).toFixed(1)} %) ; égales à 0,01 : ${egal} (${(100 * egal / tot).toFixed(1)} %)`);
// mêmes angles pour les deux liquides
let inv2 = 0, eg2 = 0, tot2 = 0; for (const c of A3) { tot2++; const pe = r2(pente(c.map(a => [sin(mesurerI2(1.33, a)), sin(a)]))), ps = r2(pente(c.map(a => [sin(mesurerI2(1.36, a)), sin(a)]))); if (ps < pe) inv2++; else if (ps === pe) eg2++; }
console.log(`  mêmes 3 angles : ${tot2} cas ; sucrée < eau : ${inv2} ; égales : ${eg2}`);
// ---- C. défi « calcul » : tolérance relative 2 % sur i₂ ; arrondis intermédiaires de l'élève
console.log('C. DÉFI CALCUL (proche(x, i₂, 0,02))');
const PAIRES = [['air', 'eau'], ['air', 'plexi'], ['air', 'diamant'], ['eau', 'plexi'], ['eau', 'diamant'], ['glycerol', 'diamant'], ['plexi', 'air'], ['eau', 'air'], ['plexi', 'eau'], ['diamant', 'plexi']];
const sig = (x, k) => Number(x.toPrecision(k)), asin = s => Math.asin(Math.min(1, s)) / RAD;
let nTir = 0, nCas = 0, refus = [];
for (const [a, b] of PAIRES) for (const i1 of [20, 25, 30, 40, 45, 50, 60]) { const n1 = milieu(a).n, n2 = milieu(b).n, i2 = refraction(n1, n2, i1); if (i2 == null) { nTir++; continue; } nCas++;
  for (const k of [2, 3]) { // l'élève arrondit sin i₁ puis le rapport à k chiffres significatifs
    const s1 = sig(sin(i1), k), q = sig(n1 * s1 / n2, k), x = asin(q), rel = Math.abs(x - i2) / i2;
    if (rel > 0.02) refus.push(`${a}→${b} i₁=${i1}° : vrai ${i2.toFixed(1)}° ; arrondi ${k} CS donne ${x.toFixed(1)}° (${(100 * rel).toFixed(1)} %)`); } }
console.log(`  tirages possibles ${nCas} (${nTir} exclus pour réflexion totale) ; cas refusés avec arrondis intermédiaires : ${refus.length}`); refus.slice(0, 12).forEach(r => console.log('   ' + r));
// sens inverse / sin i2 donné à la place de i2 : reconnu ?
// ---- D. étapes numériques du guidé
console.log('D. ÉTAPES NUMÉRIQUES');
console.log('  indice : sin60/sin35 =', (sin(60) / sin(35)).toFixed(4), '(vrai 1,51, tol 2 % →', (1.51 * 0.98).toFixed(3), 'à', (1.51 * 1.02).toFixed(3) + ') ; avec sinus à 2 CS :', (0.87 / 0.57).toFixed(3));
console.log('  snell : asin(0,5/1,5) =', asin(0.5 / 1.5).toFixed(3), '(vrai 19,47, tol 2 % → ±', (19.47 * 0.02).toFixed(2) + ') ; avec sin i₂ = 0,33 :', asin(0.33).toFixed(2), ', 0,3 :', asin(0.3).toFixed(2));
console.log('  pièges : 60/35 =', (60 / 35).toFixed(3), '; sin35/sin60 =', (sin(35) / sin(60)).toFixed(3), '; asin(0,75) =', asin(0.75).toFixed(2), '; 30/1,5 = 20');
console.log('  sinus : i₂(30°, 1,51) =', refraction(1, 1.51, 30).toFixed(2), '→ lu', mesurerI2(1.51, 30), ' ; i₂(60°) =', refraction(1, 1.51, 60).toFixed(2), '→ lu', mesurerI2(1.51, 60), '; sin30/sin19,5 =', (0.5 / sin(19.5)).toFixed(3), ' ; sin60/sin35 =', (sin(60) / sin(35)).toFixed(3));
console.log('  rapproche : air→eau 50° :', refraction(1, 1.33, 50).toFixed(2), ' ; ecarte : plexi→air 25° :', refraction(1.51, 1, 25).toFixed(2), ' ; angle limite plexi→air', angleLimite(1.51, 1).toFixed(2), ', eau', angleLimite(1.33, 1).toFixed(2), ', diamant', angleLimite(2.42, 1).toFixed(2));
console.log('  snell (exemple) : air→eau 40° :', refraction(1, 1.33, 40).toFixed(2), ' ; fiche calcul : air→diamant 50° :', refraction(1, 2.42, 50).toFixed(2), 'sin i₂ =', (sin(50) / 2.42).toFixed(4), ' ; fiche totale 20° plexi→air :', refraction(1.51, 1, 20).toFixed(2));
// ---- E. pêcheur sur toute la plage des curseurs
console.log('E. PÊCHEUR (xf 220-420, d 40-150, h 60-150, xe = 80)');
let bad = 0, maxAim = 0, maxTw = 0, minRate = 1e9, maxRate = -1e9, sortie = 0, nan = 0;
for (let xf = 220; xf <= 420; xf += 10) for (let d = 40; d <= 150; d += 5) for (let h = 60; h <= 150; h += 5) { const r = pecheur({ xf, d, xe: 80, h }); if (![r.xp, r.aimX, r.tw, r.ta].every(Number.isFinite)) nan++; maxAim = Math.max(maxAim, r.aimX); maxTw = Math.max(maxTw, r.tw); minRate = Math.min(minRate, r.rate); maxRate = Math.max(maxRate, r.rate); if (r.aimX > 560 - 4) sortie++; const resid = Math.abs(Math.sin(r.ta * RAD) - 1.33 * Math.sin(r.tw * RAD)); if (resid > 1e-6) bad++; }
console.log(`  NaN ${nan} ; loi de Snell non vérifiée (résidu > 1e-6) : ${bad} ; angle max dans l'eau ${maxTw.toFixed(1)}° (limite ${angleLimite(1.33, 1).toFixed(1)}°) ; visée hors du cadre de 560 : ${sortie} cas, aimX max ${maxAim.toFixed(0)} ; écart visée−poisson de ${minRate.toFixed(0)} à ${maxRate.toFixed(0)} cm`);
const ex = pecheur({ xf: 340, d: 90, xe: 80, h: 110 }); console.log('  réglage de départ (340, 90, 110) :', JSON.stringify({ xp: +ex.xp.toFixed(1), aimX: +ex.aimX.toFixed(1), rate: +ex.rate.toFixed(1), tw: +ex.tw.toFixed(1), ta: +ex.ta.toFixed(1) }));
// ---- F. réponses arrondies au degré (aucune précision demandée dans l'énoncé) : refusées par la tolérance de 2 % ?
console.log('F. RÉPONSE ARRONDIE AU DEGRÉ (énoncé sans consigne de précision)');
const dec = (x, d) => Number(x.toFixed(d));
let tot3 = 0, ref0 = 0, ref1 = 0, ex0 = [];
for (const [a, b] of PAIRES) for (const i1 of [20, 25, 30, 40, 45, 50, 60]) { const i2 = refraction(milieu(a).n, milieu(b).n, i1); if (i2 == null) continue; tot3++;
  const r0 = dec(i2, 0), r1 = dec(i2, 1); if (Math.abs(r0 - i2) > 0.02 * i2) { ref0++; ex0.push(`${a}→${b} ${i1}° : ${i2.toFixed(2)}° (réponse ${r0}° refusée, marge ±${(0.02 * i2).toFixed(2)})`); } if (Math.abs(r1 - i2) > 0.02 * i2) ref1++; }
console.log(`  défi calcul : ${ref0}/${tot3} tirages où la réponse arrondie au degré est refusée ; arrondie au dixième : ${ref1}/${tot3}`); ex0.slice(0, 8).forEach(e => console.log('   ' + e));
const v = 19.4712; console.log(`  étape « snell » (vrai 19,47, marge ±${(0.02 * v).toFixed(2)}) : 19° ${Math.abs(19 - v) <= 0.02 * v ? 'accepté' : 'REFUSÉ'} ; 19,5° accepté ; 20° ${Math.abs(20 - v) <= 0.02 * v ? 'accepté' : 'REFUSÉ (message de piège « ne divise pas les angles »)'}`);
