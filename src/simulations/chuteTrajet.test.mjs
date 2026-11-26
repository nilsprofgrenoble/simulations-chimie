import { trajet, G } from './chuteTrajet.js';
import { vitesseSans, vitesseAvec } from './rampeModele.js';
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('ÉCHEC', m); } };
for (const m of [1, 2, 5, 10]) for (const h of [2, 5, 8, 10]) for (const s of [0.25, 0.4, 0.6, 0.85]) for (const f of [0, 1, 3, 8]) {
  const tr = trajet({ m, h, s, f }), F = tr.frames, L = h / s, id = `${m},${h},${s},${f}`;
  ok(F.length > 0 && F.every(q => isFinite(q.x) && isFinite(q.z) && isFinite(q.v) && q.z >= -1e-9), 'finies ' + id);
  if (tr.issue === 'immobile') { ok(m * G * s <= f + 1e-9, 'immobile ' + id); continue; }
  const vm = f === 0 ? vitesseSans(h) : vitesseAvec({ m, h, L, f });
  ok(Math.abs(tr.vBas - vm) < 1e-6 * vm + 1e-9, 'vitesse en bas ' + id + ' ' + tr.vBas + ' ' + vm);
  if (f === 0) for (const q of F) ok(Math.abs(q.Em - m * G * h) < 1e-6 * m * G * h, 'Em constante ' + id);
  else for (let i = 1; i < F.length; i++) ok(F[i].Em <= F[i - 1].Em + 1e-9, 'Em décroît ' + id);
  if (tr.issue === 'arret') ok(F[F.length - 1].Em < 1e-6, 'Em finale nulle ' + id);
  ok(Math.abs(tr.dissBas - f * L) < 1e-6 * (f * L + 1), 'dissipée = f × L ' + id);
  for (let i = 1; i < F.length; i++) ok(F[i].t >= F[i - 1].t, 'temps ' + id);
}
console.log(`chuteTrajet : ${n} vérifications, ${bad} échec(s)`);
