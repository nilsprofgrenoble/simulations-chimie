import assert from 'node:assert/strict';
import * as M from './tensioactifsModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
// pentes ajustées plausibles (≈ 3,1 kJ/mol par CH2 non ionique ; ≈ 1,7 ionique)
ok(Math.abs(M.PARAM.maltoside.B - M.PARAM.sulfobetaine.B) < 1e-12, 'pente commune');
ok(M.PARAM.maltoside.B > 0.45 && M.PARAM.maltoside.B < 0.62, 'B non ionique ' + M.PARAM.maltoside.B);
ok(M.PARAM.sulfate.B > 0.24 && M.PARAM.sulfate.B < 0.36, 'B sulfate ' + M.PARAM.sulfate.B);
ok(M.kJParCH2('maltoside') > 2.5 && M.kJParCH2('maltoside') < 3.7, 'kJ/CH2');
// la CMC décroît avec n, hors domaine → null
for (const f of M.FAMILLES) { const [a, b] = f.dom; for (let k = a; k < b; k++) ok(M.cmc(f.id, k) > M.cmc(f.id, k + 1), f.id + k); ok(M.cmc(f.id, a - 1) === null && M.cmc(f.id, b + 1) === null && M.cmc(f.id, 10.5) === null); }
// erreur d'ajustement
let ls = [], mx = 0;
for (const p of M.POINTS) { const c = M.cmc(p.fam, p.n); if (c == null) continue; const r = Math.abs(Math.log10(c / Math.sqrt(p.lo * (p.hi ?? p.lo)))); ls.push(r); mx = Math.max(mx, r); }
console.log('écart moyen ×', (10 ** (ls.reduce((a, b) => a + b) / ls.length)).toFixed(2), ' max ×', (10 ** mx).toFixed(2));
ok(10 ** mx < 2.5, 'ajustement max');
// quelques valeurs
const t = (f, n) => M.cmc(f, n).toPrecision(3); console.log('DDM', t('maltoside', 12), 'SB3-12', t('sulfobetaine', 12), 'SDS', t('sulfate', 12), 'CTAB', t('ammonium', 16));
ok(M.ecartFacteur('sulfate', 12) < 1.5 && M.ecartFacteur('ammonium', 16) < 1.5);
// scène : surface pleine avant micelles, monomères libres = CMC au-delà
for (const x of [0.001, 0.01, 0.05, 0.3, 0.5, 0.9, 1, 3, 10]) { const s = M.etatScene(x); ok((x < 1) === (s.nMic === 0)); ok(s.libres <= 1 && s.libres === Math.min(x, 1)); }
ok(M.etatScene(0.5).nSurf === M.NS && M.etatScene(0.9).nMic === 0, 'surface pleine avant micelles');
ok(M.etatScene(0.001).nSurf === 0 && M.etatScene(0.05).nSurf < M.NS);
ok(M.etatScene(0.3).nSurf <= M.etatScene(0.5).nSurf);
ok(Math.abs(M.xDeCurseur(0) - 0.001) < 1e-9 && Math.abs(M.xDeCurseur(100) - 10) < 1e-6 && M.curseurDeX(M.xDeCurseur(60)) === 60);
console.log(n, 'vérifications OK');
ok(M.tensionRel(0.001) === 1 && M.tensionRel(1) === 0.5 && M.tensionRel(5) === 0.5 && M.tensionRel(0.1) > M.tensionRel(0.5));console.log('tension ok')
