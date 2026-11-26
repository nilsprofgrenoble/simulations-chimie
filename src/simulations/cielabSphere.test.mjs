import * as S from './cielabSphere.js';
let n = 0; const ok = (c, m) => { if (!c) { console.error('ÉCHEC', m); process.exit(1); } n++; };
ok(Math.abs(S.rayonDisque(50) - S.R) < 1e-9, 'équateur'); ok(S.rayonDisque(0) === 0 && S.rayonDisque(100) === 0, 'pôles');
ok(Math.abs(S.rayonDisque(45) - S.R * Math.sqrt(1 - 0.01)) < 1e-9, 'L* 45');
const m = S.maillage(12, 24);
ok(m.x.length === 13 * 24 && m.col.length === m.x.length, 'sommets'); ok(m.I.length === 2 * 12 * 24, 'triangles');
for (let i = 0; i < m.x.length; i++) { ok(Math.abs((m.x[i] / S.R) ** 2 + (m.y[i] / S.R) ** 2 + ((m.z[i] - 50) / 50) ** 2 - 1) < 1e-9, 'sur la sphère'); ok(/^rgb\(\d+,\d+,\d+\)$/.test(m.col[i]), 'couleur'); }
ok(m.col[0] === 'rgb(255,255,255)', 'pôle haut blanc ' + m.col[0]);
for (const v of [...m.I, ...m.J, ...m.K]) ok(v >= 0 && v < m.x.length, 'indices');
console.log('cielabSphere : ' + n + ' vérifications OK');
