// Test du modèle de la lentille mince : node src/simulations/lentilleMinceModele.test.mjs
import assert from 'node:assert';
import * as M from './lentilleMinceModele.js';

const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-12), `${msg} : ${a} ≠ ${b}`);

// 1. Cas d'école avec f′ = 10 cm
let im = M.image(30, 10);
proche(im.OAp, 15, 1e-12, 'objet à 30 cm : OA′ = 15 cm'); proche(im.gamma, -0.5, 1e-12, 'γ = −0,5'); assert(im.nature === 'reelle' && !im.droite, 'image réelle renversée');
proche(M.image(20, 10).OAp, 20, 1e-12, 'objet à 2f′ : OA′ = 2f′'); proche(M.image(20, 10).gamma, -1, 1e-12, 'objet à 2f′ : γ = −1');
im = M.image(15, 10); proche(im.OAp, 30, 1e-12, 'objet à 15 cm : OA′ = 30 cm'); proche(im.gamma, -2, 1e-12, 'γ = −2'); proche(im.hImg, -4, 1e-12, 'A′B′ = −4 cm (AB = 2 cm)');
im = M.image(5, 10); proche(im.OAp, -10, 1e-12, 'objet à 5 cm : OA′ = −10 cm'); proche(im.gamma, 2, 1e-12, 'γ = +2'); assert(im.nature === 'virtuelle' && im.droite, 'image virtuelle droite');
assert(M.image(10, 10).nature === 'infini', 'objet en F : image à l\'infini');
proche(M.image(40, 15).OAp, 24, 1e-12, 'objet à 40 cm, f′ = 15 cm : OA′ = 24 cm');

// 2. La relation de conjugaison est bien vérifiée : 1/OA′ − 1/OA = 1/f′ et γ = OA′/OA, pour toutes les combinaisons du simulateur
for (let d = M.D_MIN; d <= M.D_MAX; d += 0.5) for (let f = M.F_MIN; f <= M.F_MAX; f += 0.5) {
  const i = M.image(d, f);
  if (i.nature === 'infini') continue;
  proche(1 / i.OAp - 1 / i.OA, 1 / f, 1e-9, `conjugaison d=${d} f=${f}`);
  proche(i.gamma, i.OAp / i.OA, 1e-9, 'γ = OA′/OA');
  // Thalès : γ = (d′ ... ) = −f′/(d − f′) pour d > f′ ; f′/(f′ − d) pour d < f′
  proche(i.gamma, d > f ? -f / (d - f) : f / (f - d), 1e-9, `γ = ±f′/|d − f′| d=${d} f=${f}`);
  assert((i.OAp > 0) === (d > f), 'image réelle si et seulement si d > f′');
  assert((i.gamma > 0) === (d < f), 'image droite si et seulement si d < f′');
}

// 3. Les trois rayons se coupent au sommet de l'image (image réelle comme virtuelle) : R1, R2 et R3 prolongés passent par B′
for (const [d, f] of [[30, 10], [15, 10], [20, 8], [5, 10], [8, 12], [25, 15]]) {
  const { r1, r2, r3 } = M.rayons(d, f), B = M.sommetImage(d, f);
  for (const [r, nom] of [[r1, 'R1'], [r2, 'R2'], [r3, 'R3']]) {
    const p = r.avant[1];
    proche(M.ordonnee(p, r.dir, B[0]), B[1], 1e-9, `${nom} passe par B′ (d=${d}, f=${f})`);
  }
  // R3 sort parallèle à l'axe, R1 coupe l'axe en F′, R2 passe par O
  assert(r3.dir[1] === 0, 'R3 horizontal après la lentille');
  assert(Math.abs(M.ordonnee(r1.avant[1], r1.dir, f)) < 1e-9, 'R1 passe par F′');
  assert(Math.abs(M.ordonnee(r2.avant[1], r2.dir, 0)) < 1e-9, 'R2 passe par O');
}

// 4. Focale déduite d'une mesure
proche(M.focaleDepuis(-30, 15), 10, 1e-12, 'f′ à partir de OA = −30 et OA′ = 15');
proche(M.focaleDepuis(-40, 24), 15, 1e-12, 'f′ à partir de OA = −40 et OA′ = 24');

// 5. Netteté : tolérance de 0,6 cm autour de OA′
assert(M.nette(30, 10, 15) && M.nette(30, 10, 15.5) && !M.nette(30, 10, 16) && !M.nette(5, 10, 10), 'netteté');

// 6. Défi « trouver f′ » : écart maximal sur f′ quand l'écran est placé à ± 0,6 cm de la position nette (sert à fixer la tolérance du défi)
let pire = 0, pireCas = null;
for (const d of [20, 24, 30]) for (const f of [6, 8, 10, 12, 15]) {
  if (d <= f) continue;
  const e = M.pireEcartFocale(d, f);
  if (e > pire) { pire = e; pireCas = [d, f]; }
}
console.log(`Défi « trouver f′ » : écart relatif maximal sur f′ = ${(pire * 100).toFixed(1)} % (d, f′ = ${pireCas}).`);
console.log('lentilleMinceModele : tests OK');
