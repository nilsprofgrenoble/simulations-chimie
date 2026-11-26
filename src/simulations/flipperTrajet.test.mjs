import { trajet, G, X_PIED } from './flipperTrajet.js';
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('ÉCHEC', m); } };
const near = (a, b, e = 0.02) => Math.abs(a - b) <= e * Math.max(Math.abs(b), 1e-9) + 1e-9;
for (const m of [0.05, 0.08, 0.15]) for (const h of [0.2, 0.5, 0.8, 1.4]) for (const deg of [15, 30, 45, 60]) for (const f of [0, 0.03, 0.08, 0.3]) for (const v0 of [0, 1, 2.5, 4, 5.5, 8]) {
  const tr = trajet({ m, h, deg, f, v0 }), F = tr.frames, id = `${m},${h},${deg},${f},${v0}`;
  ok(F.every(q => q.x > 0.1) && F.length > 0 && F.every(q => isFinite(q.x) && isFinite(q.z) && isFinite(q.v) && q.z >= -1e-9), 'valeurs finies ' + id);
  if (v0 === 0) continue;
  const vmin = Math.sqrt(2 * G * h + 2 * f * (h / Math.sin(deg * Math.PI / 180)) / m);
  if (v0 > vmin * 1.001) ok(tr.issue === 'sommet', 'atteint ' + id); else if (v0 < vmin * 0.999) ok(tr.issue !== 'sommet', 'n’atteint pas ' + id);
  if (f === 0) for (const q of F) if (q.ph !== 'E' && q.ph !== 'R') ok(near(q.Em, tr.E0, 1e-6), 'Em constante ' + id);
  for (let i = 1; i < F.length; i++) { ok(F[i].t >= F[i - 1].t, 'temps croissant ' + id); if (f > 0 && F[i].ph !== 'R' && F[i - 1].ph !== 'R') ok(F[i].Em <= F[i - 1].Em + 1e-6, 'Em décroît ' + id); }
  if (tr.issue === 'sommet') { ok(near(tr.vTop, Math.sqrt(v0 * v0 - 2 * G * h - 2 * f * tr.L / m), 1e-6), 'vTop ' + id); ok(tr.xLand >= X_PIED, 'atterrit ' + id); }
  if (tr.issue === 'redescend' || tr.issue === 'bloquee') ok(near(tr.hMax, (v0 * v0) / (2 * (G + f / (m * Math.sin(deg * Math.PI / 180)))), 1e-6), 'hMax ' + id);
}
console.log(`flipperTrajet : ${n} vérifications, ${bad} échec(s)`);
