import assert from 'node:assert/strict';
import * as D from './dissolutionModele.js';

const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// neutralité et équations
for (const s of D.SELS) assert.ok(D.neutre(s), `${s.f} non neutre`);
assert.equal(D.equation(D.selDe('nacl')), 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)');
assert.equal(D.equation(D.selDe('mgcl2')), 'MgCl₂(s) → Mg²⁺(aq) + 2 Cl⁻(aq)');
assert.equal(D.equation(D.selDe('alcl3')), 'AlCl₃(s) → Al³⁺(aq) + 3 Cl⁻(aq)');
assert.equal(D.equation(D.selDe('na2so4')), 'Na₂SO₄(s) → 2 Na⁺(aq) + SO₄²⁻(aq)');
assert.equal(D.equation(D.selDe('feno33')), 'Fe(NO₃)₃(s) → Fe³⁺(aq) + 3 NO₃⁻(aq)');
assert.ok(!D.SELS.some(s => D.equation(s).includes('H₂O')), 'l’eau ne s’écrit pas');
// masses molaires (g/mol, arrondies au dixième)
const M = { nacl: 58.5, kcl: 74.6, cacl2: 111.1, mgcl2: 95.3, alcl3: 133.5, na2so4: 142.1, cuso4: 159.6, feno33: 241.8 };
for (const [id, v] of Object.entries(M)) assert.ok(proche(D.masseMolaire(D.selDe(id)), v, 1e-6), `M ${id}`);
// concentrations effectives
assert.ok(proche(D.concAnion(D.selDe('mgcl2'), 0.1), 0.2) && proche(D.concCation(D.selDe('mgcl2'), 0.1), 0.1));
assert.ok(proche(D.concCation(D.selDe('na2so4'), 0.04), 0.08) && proche(D.concAnion(D.selDe('na2so4'), 0.04), 0.04));
assert.ok(proche(D.concAnion(D.selDe('feno33'), 0.05), 0.15));
// parcours : CaCl2, 2,22 g dans 250,0 mL
const n = D.quantite(2.22, 111.1), c = D.concApportee(n, 0.25);
assert.ok(proche(n, 0.019982, 1e-4) && proche(c, 0.079928, 1e-4) && proche(D.concAnion(D.selDe('cacl2'), c), 0.159856, 1e-4));
// tirages : réponse cohérente, limites de concentration
for (let i = 0; i < 3000; i++) {
  const d = D.tirerDefiIon();
  assert.ok(proche(d.vrai, d.nu * d.m / d.M / (d.V / 1000)));
  assert.ok(d.m >= 0.2 && d.m <= 150, `masse ${d.m} ${d.s.f}`);
  assert.ok(d.vrai <= 1.51, 'concentration effective ≤ 1,5 mol/L');
  const e = D.tirerDefiMasse();
  assert.ok(proche(D.concIon(e.nu, D.concApportee(D.quantite(e.vrai, e.M), e.V / 1000)), e.cible, 1e-9));
  assert.ok(e.vrai >= 0.2 && e.vrai <= 150);
}
console.log('dissolutionModele : tous les tests passent');
