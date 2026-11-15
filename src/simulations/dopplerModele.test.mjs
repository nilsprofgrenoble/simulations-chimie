// Vérifie le modèle de la simulation « Effet Doppler » : node src/simulations/dopplerModele.test.mjs
import assert from 'node:assert/strict';
import * as D from './dopplerModele.js';

const proche = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= Math.abs(b) * tol + 1e-12, `${msg} : ${a} ≠ ${b}`);

// ── émetteur mobile : valeurs de référence calculées à la main ──
// fe = 40 000 Hz, v = 0,50 m/s, c = 340 m/s : f_r = 40 000 × 340 / 339,5 = 40 058,9 Hz
proche(D.frequenceRecue(40000, 0.5, 340, 1), 40058.909, 1e-7, 'f_r rapprochement');
proche(D.frequenceRecue(40000, 0.5, 340, -1), 40000 * 340 / 340.5, 1e-12, 'f_r éloignement'); proche(40000 * 340 / 340.5, 39941.263, 1e-7, 'valeur de référence éloignement');
assert.ok(D.frequenceRecue(40000, 0.5, 340, 1) > 40000 && D.frequenceRecue(40000, 0.5, 340, -1) < 40000, 'sens du décalage');
proche(D.decalageApprox(40000, 0.5, 340), 58.8235, 1e-6, 'δf approché');
proche(D.decalageExact(40000, 0.5, 340, 1), 58.909, 1e-4, 'δf exact rapprochement');
// approximation : écart relatif ≈ v/c ≈ 0,15 % ; elle surestime ou sous-estime selon le sens
assert.ok(D.ecartApprox(40000, 0.5, 340, 1) < 0.002 && D.ecartApprox(40000, 0.5, 340, -1) < 0.002, 'approximation valable pour v ≪ c');
assert.ok(D.ecartApprox(40000, 100, 340, 1) > 0.2, 'approximation fausse pour v ~ c/3 (100 m/s)');
// aller-retour : v = c δf / fe
proche(D.vitesseDepuisDecalage(D.decalageApprox(40000, 0.37, 340), 40000, 340), 0.37, 1e-12, 'inversion');
// proportionnalité à v et à fe
proche(D.decalageApprox(40000, 1.0, 340) / D.decalageApprox(40000, 0.5, 340), 2, 1e-12, 'δf ∝ v');
proche(D.decalageApprox(40000, 0.5, 340) / D.decalageApprox(25000, 0.5, 340), 1.6, 1e-12, 'δf ∝ fe');

// ── écho : plaque mobile ──
proche(D.frequenceEcho(40000, 0.5, 340, 1), 40000 * 340.5 / 339.5, 1e-12, 'f_r écho rapprochement');
proche(D.frequenceEcho(40000, 0.5, 340, -1), 40000 * 339.5 / 340.5, 1e-12, 'f_r écho éloignement');
proche(D.decalageEchoApprox(40000, 0.5, 340), 117.647, 1e-5, 'δf écho approché = 2 fe v / c');
assert.ok(Math.abs(D.decalageEchoApprox(40000, 0.5, 340) / D.decalageApprox(40000, 0.5, 340) - 2) < 1e-12, 'écho = 2 × source mobile');
assert.ok(D.ecartApprox(40000, 0.5, 340, 1, true) < 0.002, 'écho : approximation valable');
proche(D.vitesseDepuisEcho(D.decalageEchoApprox(40000, 0.37, 340), 40000, 340), 0.37, 1e-12, 'inversion écho');

// ── fronts d’onde : espacement sur l’axe devant et derrière ──
for (const beta of [0.1, 0.3, 0.5]) {
  const F = D.fronts({ beta, t: 8.2 });
  const devant = F.map(f => f.cx + f.r).filter(x => x > D.positionSource({ beta, t: 8.2 }));
  const derriere = F.map(f => f.cx - f.r);
  // fronts consécutifs : k et k+1 (les plus récents d’abord) → espacement
  const dv = [...devant].sort((a, b) => a - b), dr = [...derriere].sort((a, b) => b - a);
  proche(dv[1] - dv[0], 1 - beta, 1e-9, `λ avant β = ${beta}`);
  proche(dr[0] - dr[1], 1 + beta, 1e-9, `λ arrière β = ${beta}`);
  proche(D.lambdaAvant(1, beta), 1 - beta, 1e-12, 'lambdaAvant');
  proche(D.lambdaArriere(1, beta), 1 + beta, 1e-12, 'lambdaArriere');
}
// source immobile : fronts concentriques, espacés de λ
{ const F = D.fronts({ beta: 0, t: 3.5 }); assert.ok(F.every(f => f.cx === 0), 'centres confondus'); assert.equal(F.length, 4); proche(F[0].r - F[1].r, 1, 1e-12, 'espacement λ'); }
// fréquence reçue = c / λ_reçue (cohérence avec la formule exacte)
{ const beta = 0.25; proche(1 / D.lambdaAvant(1, beta), D.frequenceRecue(1, beta, 1, 1), 1e-12, 'f = c/λ devant'); proche(1 / D.lambdaArriere(1, beta), D.frequenceRecue(1, beta, 1, -1), 1e-12, 'f = c/λ derrière'); }

// ── spectre ──
assert.equal(D.intensitePic(40000, 40000, 1), 1, 'pic de hauteur 1');
assert.ok(D.intensitePic(40001, 40000, 1) < 1e-20, 'premier zéro à 1/T');
assert.equal(D.resolution(0.5), 2); assert.equal(D.resolution(2), 0.5);
assert.ok(D.separes(5.9, 0.5) && !D.separes(1.2, 0.5) && D.separes(1.2, 2), 'résolution 1/T');

// ── incertitudes ──
{
  const df = D.decalageApprox(40000, 0.5, 340);                          // 58,8 Hz
  const inc = D.incertitudeVitesse({ df, T: 1 });
  proche(inc.udf, Math.SQRT2 * 0.5 / Math.sqrt(3), 1e-12, 'u(δf)');
  proche(inc.uc, 3 / Math.sqrt(3), 1e-12, 'u(c)');
  proche(inc.rel, Math.hypot(inc.udf / df, inc.uc / 340), 1e-12, 'composition quadratique');
  proche(inc.part[0] + inc.part[1], 1, 1e-12, 'poids : somme = 1');
  assert.ok(inc.rel > 0.005 && inc.rel < 0.009, `u(v)/v ≈ 0,7 % : ${inc.rel}`);
  const pt = D.incertitudeVitesse({ df: D.decalageApprox(40000, 0.1, 340), T: 0.5 });   // petit décalage, pic large
  assert.ok(pt.rel > inc.rel && pt.part[0] > 0.5, 'petit décalage : la lecture domine');
}
assert.equal(D.demiPointe(1), 0.5); assert.equal(D.demiPointe(0.5), 0.5); assert.equal(D.demiPointe(0.25), 1);

// récepteur au passage : sur l'axe, loin devant / loin derrière on retrouve 1/(1∓β) ; à l'écart, le rapport est plus doux
{
  const beta = 0.4;
  assert.ok(Math.abs(D.rapportAuPassage({ beta, xs: 0, xr: 50, d: 0 }) - 1 / (1 - beta)) < 1e-9);
  assert.ok(Math.abs(D.rapportAuPassage({ beta, xs: 50, xr: 0, d: 0 }) - 1 / (1 + beta)) < 1e-9);
  const r0 = D.rapportAuPassage({ beta, xs: 2.9, xr: 2.9, d: 1.2 });
  assert.ok(r0 > 1 && r0 < 1.3);                  // quand la source est à hauteur du récepteur, on entend encore le son émis un peu plus tôt (source alors en approche) : plus aigu que la note émise
  assert.ok(Math.abs(D.rapportAuPassagePresent({ beta, xs: 2.9, xr: 2.9, d: 1.2 }) - 1) < 1e-12);   // l'approximation donnerait exactement 1
  // erreur de l'approximation « position présente » : grande à β = 0,4, négligeable à β = 0,03
  const ecart = b => Math.abs(D.rapportAuPassage({ beta: b, xs: 1.5, xr: 2.9, d: 1.2 }) / D.rapportAuPassagePresent({ beta: b, xs: 1.5, xr: 2.9, d: 1.2 }) - 1);
  assert.ok(ecart(0.4) > 0.05 && ecart(0.03) < 0.01);
}
console.log('dopplerModele : tous les tests passent');
