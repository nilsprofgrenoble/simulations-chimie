// Contrôle du modèle de la simulation 166 : node src/simulations/vecteursVAModele.test.mjs
import * as M from './vecteursVAModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// 1. Mouvements polynomiaux du 2e degré : les estimations v_i et a_i sont EXACTES (dérivée centrée d'un polynôme de degré 2)
for (const id of ['acc', 'frein', 'retour', 'unif', 'parabole', 'derive']) {
  const mv = M.MOUVEMENTS[id];
  for (const tau of mv.taus) {
    const P = M.chrono(mv, tau);
    for (let i = 1; i <= mv.N - 1; i++) { const v = M.vitesseApprochee(P, i, tau), e = M.vitesseExacte(mv, i * tau); ok(proche(v.x, e.x) && proche(v.y, e.y), `${id} τ=${tau} v_${i}`); }
    for (let i = 2; i <= mv.N - 2; i++) { const a = M.accelerationApprochee(P, i, tau), e = M.accelerationExacte(mv, i * tau); ok(proche(a.x, e.x) && proche(a.y, e.y), `${id} τ=${tau} a_${i}`); }
  }
}
// 2. Valeurs annoncées dans le parcours guidé (mouvement « acc », τ = 1,0 s)
{ const mv = M.MOUVEMENTS.acc, P = M.chrono(mv, 1);
  ok(P[3].x === 10.5 && P[5].x === 22.5, 'x3 et x5');
  ok(M.vitesseApprochee(P, 4, 1).x === 6, 'vx4 = 6,0 m/s');
  ok(M.vitesseApprochee(P, 3, 1).x === 5 && M.vitesseApprochee(P, 5, 1).x === 7, 'vx3 et vx5');
  ok(M.accelerationApprochee(P, 4, 1).x === 1, 'ax4 = 1,0 m/s²'); }
// frein : positions et signes ; retour : arrêt à t = 3 s au point M3 (v = 0, a = −2,0)
{ const mv = M.MOUVEMENTS.frein, P = M.chrono(mv, 1); ok(P[7].x === 38.5 && M.vitesseApprochee(P, 4, 1).x === 5 && M.accelerationApprochee(P, 4, 1).x === -1, 'frein'); }
{ const mv = M.MOUVEMENTS.retour, P = M.chrono(mv, 1); ok(P.map(p => p.x).join() === '0,5,8,9,8,5,0,-7,-16', 'retour ' + P.map(p => p.x)); ok(M.vitesseApprochee(P, 3, 1).x === 0 && M.accelerationApprochee(P, 3, 1).x === -2, 'retour M3'); }
{ const mv = M.MOUVEMENTS.derive, P = M.chrono(mv, 1); ok(P.map(p => p.x).join() === '0,3.5,10,19.5,32,47.5,66', 'derive ' + P.map(p => p.x)); ok(M.vitesseApprochee(P, 2, 1).x === 8 && M.accelerationApprochee(P, 3, 1).x === 3, 'derive : vx(2) = 8, ax = 3'); }
// 3. Oscillation : estimations approchées, écart relatif connu (sin(ωτ)/(ωτ) pour v, son carré pour a), qui croît avec τ
{ const mv = M.MOUVEMENTS.sinus; let prec = 0;
  for (const tau of [0.5, 1, 2]) { const P = M.chrono(mv, tau), w = Math.PI / 4; const ii = tau === 2 ? 2 : tau === 1 ? 1 : 3, v = M.vitesseApprochee(P, ii, tau).x, e = M.vitesseExacte(mv, ii * tau).x;
    const attendu = Math.sin(w * tau) / (w * tau); ok(proche(v / e, attendu, 1e-9), 'facteur v osc ' + tau); const ecart = 1 - v / e; ok(ecart > prec, 'écart croissant avec τ'); prec = ecart; } }
// 4. Échelles : flèches bornées, valeurs rondes
for (const id of M.ORDRE_MOUVEMENTS) { const mv = M.MOUVEMENTS[id]; for (const tau of mv.taus) { const P = M.chrono(mv, tau), E = M.echelles(mv, P, tau); ok(E.px > 0 && E.px <= 90 && E.echV > 0 && E.echA > 0 && isFinite(E.minEcart), `échelles ${id} ${tau}`); } }
ok(M.valeurRonde(3.7) === 2 && M.valeurRonde(6) === 5 && M.valeurRonde(0.8) === 0.5 && M.valeurRonde(1.3) === 1, 'valeurRonde');

// 5. Défi 1 : 60 000 tirages ; positions à 2 décimales ; v_k ≠ 0 ; a_k exact ; pire cas des tolérances si l'élève arrondit v à 2 chiffres significatifs
const sig2 = x => Number(Number(x).toPrecision(2));
let pire = 0, vus = { acc: 0, ral: 0, cst: 0 }, types = {};
for (let s = 0; s < 60000; s++) {
  const d = M.tirageDefiChrono();
  ok(d.pts.every(p => Math.abs(p.x * 100 - Math.round(p.x * 100)) < 1e-6), 'x à 2 décimales');
  ok(Math.abs(d.vk) > 0.2 && proche(d.ak, d.a, 1e-9), 'vk ≠ 0, ak = a');
  ok(d.k >= 2 && d.k <= 4, 'k'); ok(d.sens === 'acc' || d.sens === 'ral', 'sens ' + d.sens);
  vus[d.sens]++; types[d.type] = (types[d.type] || 0) + 1;
  // l'élève arrondit les deux vitesses à 2 CS avant de faire la différence
  const va = sig2(M.vitesseApprochee(d.pts, d.k + 1, d.tau).x), vb = sig2(M.vitesseApprochee(d.pts, d.k - 1, d.tau).x);
  const aEl = (va - vb) / (2 * d.tau); pire = Math.max(pire, Math.abs(aEl - d.ak) / Math.abs(d.ak));
  if (d.type === 'frein') ok(M.vitesseApprochee(d.pts, 5, d.tau).x > 0, 'frein : vitesse positive');
}
console.log('défi 1 : pire écart relatif avec v arrondie à 2 CS =', (100 * pire).toFixed(1), '% ; sens', JSON.stringify(vus), 'types', JSON.stringify(types));
// 6. Défi 2 : 60 000 tirages
let nbDefi2 = 0;
for (let s = 0; s < 60000; s++) {
  const d = M.tirageDefiDerive();
  ok(d.t0 > 0 && proche(d.a, 2 * d.A) && proche(d.t0 * 2 * d.A + d.B, 0, 1e-9), 'défi 2 : arrêt'); ok(Math.abs(d.a) >= 1 && Math.abs(d.t0 * 100 - Math.round(d.t0 * 100)) < 1e-9, 'valeurs'); ok(M.ecritX(d).includes('t²'), 'écriture'); nbDefi2++;
}
console.log('exemple x(t) =', M.ecritX({ A: -1.5, B: 7.5, C: 0 }), '|', M.ecritX({ A: 0.5, B: -1.5, C: 2 }));
console.log(`OK : ${n} contrôles, ${nbDefi2} tirages du défi 2`);
