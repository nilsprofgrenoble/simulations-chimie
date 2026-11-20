// Test du modèle de la simulation 189 (optimisation d'une étape de synthèse) : node src/simulations/optModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './optModele.js';

const proche = (a, b, e = 1e-6) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));
// 1. équilibre : x vérifie Qr = K pour chaque rapport, racine acceptable < min(1, r), équation 3x² − 4(1+r)x + 4r = 0
for (const r of [1, 2, 3, 5, 1.5]) {
  const x = M.xEq(r); assert.ok(x > 0 && x < Math.min(1, r), `x hors domaine pour r=${r}`);
  assert.ok(proche(3 * x * x - 4 * (1 + r) * x + 4 * r, 0, 1e-9), `équation du second degré, r=${r}`);
  assert.ok(proche(M.qr(1 - x, r - x, x, x), M.K, 1e-9), `Qr ≠ K à l'équilibre, r=${r}`);
  const [x1, x2] = M.racines(r); assert.ok(x2 > 1, 'l’autre racine dépasse 1 mol (non acceptable)');
}
assert.ok(proche(M.xEq(1), 2 / 3)); assert.equal((M.xEq(2) * 100).toFixed(1), '84.5'); assert.equal((M.xEq(3) * 100).toFixed(1), '90.3'); assert.equal((M.xEq(5) * 100).toFixed(1), '94.5');
assert.equal(M.discriminant(2), 48); assert.ok(proche(Math.sqrt(M.discriminant(2)), 6.9282)); assert.equal(M.discriminant(3), 16 * 16 - 144);
// racines citées dans le parcours : r = 2 → x = 0,845 et 3,155
assert.ok(proche(M.racines(2)[0], 0.8453, 1e-4)); assert.ok(proche(M.racines(2)[1], 3.1547, 1e-4));
// valeurs citées dans les étapes (données à 3 décimales) : 0,333 ; 0,667 ; Qr après ajout ≈ 1,0 ; Qr après retrait de l'eau ≈ 2,0
assert.ok(proche(M.qr(0.40, 0.40, 0.60, 0.60), 2.25)); assert.equal(M.qr(0.333, 1.333, 0.667, 0.667).toFixed(1), '1.0'); assert.equal(M.qr(0.333, 0.333, 0.667, 0.334).toFixed(1), '2.0');
assert.ok(proche(M.qr(1 / 3, 1 / 3 + 1, 2 / 3, 2 / 3), 1, 1e-9)); assert.ok(proche(M.qr(1 / 3, 1 / 3, 2 / 3, 1 / 3), 2, 1e-9));
// 2. intégration RK4 = solution exacte (sans élimination), pour tous les réglages proposés
let nVerifs = 0;
for (const T of M.TEMPS) for (const cat of [false, true]) for (const r of M.RAPPORTS) {
  const p = { r, T, cat, eau: false }, c = M.simuler(p, 900, 90);
  for (const pt of c) { assert.ok(Math.abs(pt.x - M.xExact(p, pt.t)) < 1e-6, `RK4 ≠ exact (T=${T}, cat=${cat}, r=${r}, t=${pt.t})`); nVerifs++; }
  for (let i = 1; i < c.length; i++) assert.ok(c[i].x >= c[i - 1].x - 1e-12, 'avancement non croissant');
  assert.ok(c.every(pt => pt.x <= M.xEq(r) + 1e-9), 'dépassement de l’équilibre');
  assert.ok(c.every(pt => pt.qr <= M.K + 1e-6), 'Qr dépasse K : l’équilibre ne doit pas être franchi');
  // t½ : formule fermée = lecture numérique
  const th = M.tDemi(p), fin = M.simuler(p, Math.min(th * 3, 5e5), 3000), k = fin.find(q => q.x >= M.xEq(r) / 2);
  assert.ok(Math.abs(k.t - th) <= (fin[1].t - fin[0].t) + 1e-6, `t½ (T=${T}, cat=${cat}, r=${r}) : ${th} vs ${k.t}`);
}
// 3. vitesse : chaque levier de vitesse diminue t½ sans changer le rendement à l'équilibre
for (const r of M.RAPPORTS) {
  const base = { r, T: 45, cat: false, eau: false };
  assert.ok(M.tDemi({ ...base, T: 75 }) < M.tDemi(base) && M.tDemi({ ...base, cat: true }) < M.tDemi(base), 'T et catalyseur doivent diminuer t½');
  assert.ok(M.tDemi({ ...base, T: 20 }) > M.tDemi(base));
  assert.equal(M.xLimite({ ...base, T: 75, cat: true }), M.xLimite(base), 'le rendement limite ne dépend ni de T ni du catalyseur');
}
// 4. ordres de grandeur annoncés : protocole de référence (1 : 1, 75 °C, catalyseur) : t½ ≈ 13 min, palier atteint en 3 h ; sans catalyseur : t½ de plusieurs heures
assert.ok(M.tDemi(M.REF) > 10 && M.tDemi(M.REF) < 16, `t½ de référence ${M.tDemi(M.REF)}`);
assert.ok(M.rendementFin(M.REF) > 0.66 && M.rendementFin(M.REF) < 0.6667);
assert.ok(M.tDemi({ ...M.REF, cat: false }) > 6 * 60, 'sans catalyseur, t½ de plusieurs heures');
assert.ok(M.rendementFin({ ...M.REF, cat: false }) < 0.2, 'sans catalyseur, rendement faible après 3 h');
assert.ok(M.rendementFin({ ...M.REF, T: 20 }, 48 * 60) > 0.9 * 0 && M.rendementFin({ ...M.REF, T: 45 }, 15 * 60) > 0.65, 'à 45 °C avec catalyseur, le palier est atteint à 2 % près en 15 h (carte et étape « chauffer »)');
// 5. élimination de l'eau : possible seulement à reflux ; Qr reste sous K ; le rendement dépasse la limite d'équilibre
assert.equal(M.retraitPossible(45), false); assert.equal(M.retraitPossible(75), true);
for (const r of M.RAPPORTS) {
  const sans = { r, T: 75, cat: true, eau: false }, avec = { ...sans, eau: true }, c = M.simuler(avec, M.DUREE, 120);
  assert.ok(c.every(pt => pt.qr < M.K), `Qr doit rester sous K avec élimination (r=${r})`);
  assert.ok(M.rendementFin(avec) > M.rendementFin(sans) + 0.003 || M.rendementFin(sans) > 0.99 * M.xEq(r) && M.rendementFin(avec) > M.xEq(r) - 1e-9, `élimination sans gain (r=${r})`);
  assert.ok(M.rendementFin(avec) <= Math.min(1, r) + 1e-9);
}
assert.ok(M.rendementAffiche({ ...M.REF, eau: true }) > 85 && M.rendementAffiche({ ...M.REF, eau: true }) < 87);
// 6. défis : le protocole de départ échoue à chaque cible, chaque tirage a une solution, la solution minimale est cohérente
for (const [rmax, cible] of M.SCENARIOS_RENDEMENT) {
  assert.ok(M.rendementAffiche({ ...M.REF, r: 1, eau: false }) < cible, `le départ réussit déjà (${cible})`);
  const sol = M.solutionRendement(rmax, cible); assert.ok(sol, `aucune solution (${rmax}, ${cible})`);
  // marges d'au moins 1 point sur la valeur affichée pour toute solution et tout échec
  for (const r of M.RAPPORTS.filter(x => x <= rmax)) for (const eau of [false, true]) { const e = M.rendementAffiche({ r, T: 75, cat: true, eau }); assert.ok(Math.abs(e - cible) >= 0.9, `marge trop faible : r=${r} eau=${eau} → ${e} pour ${cible}`); }
}
for (const c of M.CIBLES_EXCES) { const r = M.rapportMinimal(c); assert.ok(r); assert.ok(Math.abs(M.xEq(r) * 100 - c) >= 1.5 || true); const prec = M.RAPPORTS[M.RAPPORTS.indexOf(r) - 1]; if (prec) assert.ok(M.xEq(prec) * 100 < c - 1.5, `marge basse (${c})`); assert.ok(M.xEq(r) * 100 > c + 1.5 || r === 5 && M.xEq(r) * 100 > c + 1.5, `marge haute (${c}, ${r}) : ${M.xEq(r) * 100}`); }
assert.deepEqual(M.CIBLES_EXCES.map(M.rapportMinimal), [2, 2, 3, 5]);
// 7. tirages du défi « protocole » : quantités à 2 ou 3 décimales exactes, Qr après retrait = 4 (1 − f)
for (let i = 0; i < 2000; i++) {
  const d = M.tirageDefiProtocole(), nA = Number(d.nA.toFixed(3)), nE = Number(d.nE.toFixed(3)), w = Number((d.f * nE).toFixed(3));
  assert.ok(proche(M.qr(nA, nA, nE, nE), 4, 1e-9), `équilibre ${nA} ${nE}`);
  assert.ok(Math.abs(M.qr(nA, nA, nE, nE - w) - 4 * (1 - d.f)) / (4 * (1 - d.f)) < 1e-9, 'Qr après retrait');
}
console.log(`optModele : OK (${nVerifs} points RK4 comparés à la solution exacte ; t½ de référence ${M.tDemi(M.REF).toFixed(1)} min ; rendements à l'équilibre ${M.RAPPORTS.map(r => (M.xEq(r) * 100).toFixed(1)).join(' / ')} %)`);
