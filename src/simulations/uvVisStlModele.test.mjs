// node src/simulations/uvVisStlModele.test.mjs
import assert from 'node:assert/strict';
import * as S from './uvVisStlModele.js';
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
ok(Math.abs(S.energieEv(427) - 2.9106) < 1e-3, 'E(427 nm) = 2,91 eV'); ok(Math.abs(S.energieJ(500) - 3.978e-19) < 1e-21, 'E(500 nm)');
ok(S.energieEv(250) > S.energieEv(600) && S.energieEv(600) > S.energieEv(5000 / 1), 'E décroît avec λ');
// parcours guidé : étalons croissants, dans le domaine de validité, échantillon dans la gamme
const G = S.GUIDE;
ok(G.pts.length === 5 && G.pts.every((p, i) => i === 0 || p.A > G.pts[i - 1].A), 'étalons croissants'); ok(G.pts[4].A < 1.2 && G.pts[0].A > 0.15, 'gamme des étalons');
ok(Math.abs(G.k - G.kAj) / G.k < 0.02, 'pente deux points ≈ pente ajustée'); ok(G.Ax > G.pts[0].A && G.Ax < G.pts[4].A, 'échantillon dans la gamme');
ok(G.AB > 0.3 && G.AB < 1.2, `A de la boisson bleue diluée (${G.AB})`); ok(G.kB > 0.05 && G.kB < 0.2, 'k bleu');
// défi : 4000 tirages
const vu = new Set(); let pireK = 0, pireArrondi = 0;
for (let i = 0; i < 4000; i++) {
  const d = S.tirageDefiEtalonnage(); vu.add(d.esp);
  ok(d.pts.length === 5 && d.pts.every((p, j) => j === 0 || p.A > d.pts[j - 1].A), 'étalons croissants'); ok(d.pts[4].A <= 1.2 && d.pts[0].A >= 0.12, `gamme ${d.pts[0].A}-${d.pts[4].A}`);
  ok(d.Ax > d.pts[0].A && d.Ax < d.pts[4].A, `échantillon hors gamme (${d.Ax})`); ok([1, 5, 10].includes(d.F), 'F');
  // un élève peut utiliser la pente entre le 1er et le dernier étalon, arrondie à 2 chiffres significatifs : il doit rester dans la tolérance de 8 %
  pireK = Math.max(pireK, Math.abs(d.kDeuxPoints - d.k) / d.k);
  const k2 = Number(d.kDeuxPoints.toPrecision(2)); pireArrondi = Math.max(pireArrondi, Math.abs(d.F * d.Ax / k2 - d.attendue) / d.attendue);
}
ok(vu.size === 6, 'toutes les espèces tirées'); ok(pireK < 0.03, `écart pente deux points / ajustée : ${(pireK * 100).toFixed(1)} %`); ok(pireArrondi < 0.075, `pire écart élève : ${(pireArrondi * 100).toFixed(1)} %`);
console.log(`uvVisStlModele : ${n} vérifications — OK (pire écart élève ${(pireArrondi * 100).toFixed(1)} %)`);
