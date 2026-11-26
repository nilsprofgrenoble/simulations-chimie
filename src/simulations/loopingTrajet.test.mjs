import { trajet, G } from './loopingTrajet.js';
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('ÉCHEC', m); } };
for (const m of [100, 200, 500]) for (const H of [6, 8, 10, 12, 15]) for (const R of [2, 3, 4, 5]) for (const f of [0, 20, 50, 100]) {
  const tr = trajet({ m, H, R, f }), F = tr.frames, id = `${m},${H},${R},${f}`;
  ok(F.length > 5 && F.every(q => isFinite(q.x) && isFinite(q.z) && isFinite(q.v)), 'finies ' + id);
  if (f === 0) {
    for (const q of F) ok(Math.abs(q.Em - m * G * H) < 1e-3 * m * G * H + 1, 'Em constante ' + id + ' ' + q.Em);
    if (H > 2.5 * R + 0.2) { ok(tr.issue === 'passe', 'passe ' + id); ok(Math.abs(tr.vTop - Math.sqrt(2 * G * (H - 2 * R))) < 0.05, 'vTop ' + id); }
    if (H < 2.5 * R - 0.2 && H > 2 * R + 0.2) ok(tr.issue === 'decroche', 'décroche ' + id + tr.issue);
    if (H < 2 * R - 0.2 && H > R) ok(tr.issue === 'recule' || tr.issue === 'decroche', 'ne passe pas ' + id + tr.issue);
  } else for (let i = 1; i < F.length; i++) if (F[i].ph !== 'vol') ok(F[i].Em <= F[i - 1].Em + 1e-3 * m * G * H, 'Em décroît ' + id);
  ok(F.every(q => q.z >= -0.05 && q.z <= H + 1e-3), 'altitude bornée ' + id);
  ok(F.every(q => q.ph !== 'loop' || isNaN(q.N) || q.N >= -1e-6 * m * G || tr.issue === 'decroche'), 'N≥0 ' + id);
}
console.log(`loopingTrajet : ${n} vérifications, ${bad} échec(s)`);
