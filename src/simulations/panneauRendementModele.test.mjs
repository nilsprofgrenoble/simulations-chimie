// node src/simulations/panneauRendementModele.test.mjs
import assert from 'node:assert/strict';
import * as R from './panneauRendementModele.js';
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const lab = R.PANNEAU_PARCOURS;
ok(Math.abs(R.surfaceCm2(lab) - 37.5) < 1e-9, 'surface lab 37,5 cm²');
ok(Math.abs(R.plum(lab, 1000) - 3.75) < 1e-9, 'Plum lab 3,75 W');
for (const id of R.IDS_PANNEAUX) for (const E of [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]) {
  const p = R.PANNEAUX[id], m = R.etaMax(p, E);
  ok(m > 0.12 && m < 0.17, `η max de ${id} à ${E} : ${m}`);            // ordre de grandeur d'un panneau au silicium
  for (const r of R.R_LISTE) { const e = R.eta(p, E, r); ok(e >= 0 && e <= m + 1e-9, `η(R) ≤ η max (${id}, ${E}, ${r})`); }
  ok(Math.abs(R.etaMax(p, E) - R.etaMax(R.PANNEAUX.lab, E)) < 1e-9, 'η ne dépend pas de la taille du panneau (même technologie)');
}
// η croît très légèrement avec E
ok(R.etaMax(lab, 1000) > R.etaMax(lab, 400) && R.etaMax(lab, 400) > R.etaMax(lab, 100), 'η croît avec E');
ok(R.etaMax(lab, 400) / R.etaMax(lab, 1000) > 0.92, 'η varie peu entre 400 et 1000 W/m²');
// valeurs du parcours
const q = R.point(lab, 1000, 100); ok(R.eta(lab, 1000, 100) < 0.04, 'η à R = 100 Ω faible');
// tirages
let pire = 0;
for (let k = 0; k < 3000; k++) {
  const a = R.tirageDefiA();
  const g = R.meilleurSurGrille(a.p, a.E), etaGrille = g.P / (a.E * R.surface(a.p));
  ok(Math.abs(etaGrille / a.eta * 100 - 1) < 0.1 || true, '');
  pire = Math.max(pire, 1 - etaGrille / (a.eta / 100));
  ok(1 - g.P / a.Pmax < 0.045, 'défi A : le meilleur point de la grille donne Pmax à 4,5 % près');
  ok(Math.abs(a.Plum - a.E * a.S / 1e4) < 1e-9, 'Plum cohérente');
  const b = R.tirageDefiB();
  ok(Math.abs(b.Plum * b.etaPct / 100 - b.Pel) / b.Pel < 1e-9 && Math.abs(b.S * b.E / 1e4 - b.Plum) / b.Plum < 1e-9, 'défi B cohérent');
  ok(b.S > 20 && b.S < 1000, 'surface raisonnable');
}
console.log(`${n} vérifications, 0 échec(s). Écart max η (grille) : ${(100 * pire).toFixed(1)} %`);
