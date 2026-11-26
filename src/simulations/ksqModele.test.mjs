import assert from 'node:assert/strict';
import * as M from './ksqModele.js';
const proche = (a, b, t = 1e-6, m = '') => assert.ok(Math.abs(a - b) <= t * Math.abs(b), `${m} ${a} vs ${b}`);
// solubilité : retrouver Ks à partir de s
for (const k of M.ORDRE_SELS) {
  const s = M.SELS[k], c = M.concSat(s);
  proche(M.qr(s, c.cation, c.anion), s.Ks, 1e-9, k);
  assert.equal(M.verdict(M.qr(s, c.cation, c.anion), s.Ks), 'sature');
}
// valeurs de référence
proche(M.solubilite(M.SELS.CuI), Math.sqrt(1.27e-12), 1e-9);
proche(M.solubilite(M.SELS.CaF2), Math.cbrt(4.0e-11 / 4), 1e-9);
proche(M.solubilite(M.SELS.Ag2CO3), Math.cbrt(8.1e-12 / 4), 1e-9);
// piège : Ks plus petit mais solubilité plus grande (CaF2 / SrCO3)
assert.ok(M.SELS.CaF2.Ks < M.SELS.SrCO3.Ks);
assert.equal(M.plusSoluble(M.SELS.CaF2, M.SELS.SrCO3).id, 'CaF2');
// verdicts
assert.equal(M.verdict(2e-9, 7e-10), 'precipite');
assert.equal(M.verdict(1e-10, 7e-10), 'dissout');
// mélange
const m = M.apresMelange(1e-3, 10, 2e-3, 30); proche(m.c1, 2.5e-4); proche(m.c2, 1.5e-3);
// précipitation : à l'état final Qr = Ks et les quantités sont conservées
for (const k of M.ORDRE_SELS) {
  const s = M.SELS[k]; const c1 = 1e-3, c2 = 5e-3, p = M.precipitation(s, c1, c2);
  if (M.qr(s, c1, c2) > s.Ks) { proche(M.qr(s, p.cCat, p.cAn), s.Ks, 1e-4, k); assert.ok(p.x > 0 && p.cCat >= 0 && p.cAn >= 0); } else assert.equal(p.x, 0);
}
// ion commun : la solubilité diminue
for (const k of M.ORDRE_SELS) { const s = M.SELS[k]; assert.ok(M.solubiliteIonCommun(s, 0.01) < M.solubilite(s), k); proche(M.solubiliteIonCommun(s, 0, 'anion'), M.solubilite(s), 1e-6, k); }
// Ks identiques à ceux annoncés (source unique)
assert.equal(M.SELS.AgI.Ks, 1.5e-16); assert.equal(M.SELS.SrCO3.Ks, 7e-10); assert.equal(M.SELS.CaF2.Ks, 4.0e-11); assert.equal(M.SELS.Ag2CO3.Ks, 8.1e-12);
assert.equal(M.sci(4.0e-11, 1), '4,0×10⁻¹¹'); assert.equal(M.sci(9.999e-5, 2), '1,00×10⁻⁴');
console.log('ksqModele : OK');
// Défis : 600 tirages
for (let i = 0; i < 600; i++) {
  const d = M.tirageDefiPrecip(); assert.ok(d, 'tirage précipité');
  const lr = Math.abs(Math.log10(d.q / d.Ks)); assert.ok(lr >= 0.45 && lr <= 4.01);
  assert.equal(M.diagQr(d, d.q * 1.09).ok, true); assert.equal(M.diagQr(d, d.q * 1.3).ok, false);
  if (Math.abs(d.qSansDilution - d.q) > 0.2 * d.q) assert.match(M.diagQr(d, d.qSansDilution).msg, /dilu/);
  const k = M.tirageDefiKs(); const sel = M.SELS[k.sel]; assert.ok(k.Ks / sel.Ks > 0.2 && k.Ks / sel.Ks < 4);
  assert.equal(M.diagKs(k, k.Ks * 1.02).ok, true); assert.equal(M.diagKs(k, k.Ks * 3).ok, false);
}
// plusieurs tirages doivent donner des verdicts différents
const vs = new Set(Array.from({ length: 80 }, () => M.tirageDefiPrecip().verdict)); assert.ok(vs.has('precipite') && vs.has('dissout'));
console.log('défis : OK');
