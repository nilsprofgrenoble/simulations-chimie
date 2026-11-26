// Test du modèle des bases en 3D : node src/simulations/baseAtomes.test.mjs
import assert from 'node:assert';
import { atomesBase, L_OH, L_OTBU } from './baseAtomes.js';
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const len = v => Math.hypot(...v), sub = (a, b) => a.map((x, i) => x - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const O = [0, 2, 0], a = [0, 1, 0], p = [0, 0, 1], t = [0, -1, 0];       // la cible est dans la direction −a
const ang = (u, v) => Math.acos(dot(u, v) / len(u) / len(v)) * 180 / Math.PI;
for (let i = 0; i <= 20; i++) {
  const l = i / 20;
  for (const re of ['HO', 'H2O', 'tBuO']) {
    const m = atomesBase(re, O, a, p, l);
    for (const at of m.atomes) ok(Math.abs(len(sub(at.p, O)) - (re === 'tBuO' ? L_OTBU : L_OH)) < 1e-9, `${re} : longueur O–X constante`);
  }
}
// HO⁻ libre : O–H colinéaire avec la cible (H du côté opposé à la cible) ; H₂O libre : H–O–H = 104,5°
const ho = atomesBase('HO', O, a, p, 0);
ok(ang(sub(ho.atomes[0].p, O), t) > 179.99 && ho.charge === '−' && ho.nom === 'HO⁻', 'HO⁻ libre');
const w = atomesBase('H2O', O, a, p, 0);
ok(Math.abs(ang(sub(w.atomes[0].p, O), sub(w.atomes[1].p, O)) - 104.5) < 1e-6 && w.charge === null && w.nom === 'H₂O', 'H₂O libre : 104,5°');
// après arrachement de H : HO⁻ donne H₂O (H–O–H = 104,5° avec le H arraché en position −a) ; H₂O donne H₃O⁺ (charge +)
const apres = atomesBase('HO', O, a, p, 1);
ok(Math.abs(ang(sub(apres.atomes[0].p, O), t) - (180 - 75.5)) < 1e-6 && apres.charge === null && apres.nom === 'H₂O', 'HO⁻ → H₂O');
const h3o = atomesBase('H2O', O, a, p, 1);
ok(h3o.charge === '+' && h3o.nom === 'H₃O⁺' && h3o.atomes.length === 2, 'H₂O → H₃O⁺');
ok(atomesBase('tBuO', O, a, p, 1).nom === 'tBuOH' && atomesBase('tBuO', O, a, p, 0).charge === '−', 'tBuO⁻ → tBuOH');
// substitution : C–O–H ≈ 109° une fois HO⁻ lié au carbone
const sn = atomesBase('HO', O, a, p, 1, 71);
ok(Math.abs(ang(sub(sn.atomes[0].p, O), t) - 109) < 1e-6, 'R–O–H ≈ 109°');
console.log(`baseAtomes : ${n} vérifications OK`);
