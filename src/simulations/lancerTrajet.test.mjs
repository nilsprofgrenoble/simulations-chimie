import { trajet, G } from './lancerTrajet.js';
import { OBJETS } from './lancerChuteModele.js';
let n = 0, ko = 0; const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 12) console.log('ÉCHEC', m); } };
for (const o of OBJETS) for (const v0 of [5, 8, 10, 12, 15, 20]) for (const frott of [false, true]) for (const off of [0, 3]) {
  const r = trajet({ obj: o.id, v0, frott, off }), id = `${o.id} ${v0} ${frott} ${off}`, fr = r.frames, f0 = fr[0], fl = fr[fr.length - 1];
  ok(Math.abs(f0.z) < 1e-9 && Math.abs(f0.v - v0) < 1e-9, 'début ' + id);
  ok(fl.z < 1e-6 && fl.v < 0, 'retour ' + id);
  ok(Math.abs(f0.Em - r.Em0) < 1e-9, 'Em0 ' + id);
  let prec = Infinity, zm = 0;
  for (const q of fr) { ok(q.Epp >= -1e-9, 'Epp ' + id); ok(q.Em <= prec + 1e-5 * r.Em0, 'Em ' + id); prec = q.Em; zm = Math.max(zm, q.z); if (!frott) ok(Math.abs(q.Em - r.Em0) < 1e-4 * r.Em0, 'Em cst ' + id); }
  ok(Math.abs(zm - r.hMax) < 0.01 * Math.max(r.hMax, 1) + 0.03, 'hMax ' + id);
  if (!frott) ok(Math.abs(r.hMax - v0 * v0 / (2 * G)) < 1e-3, 'h sans frott ' + id);
  else ok(r.hMax <= v0 * v0 / (2 * G) + 1e-6 && r.vRetour < v0, 'frott ' + id);
}
console.log(`lancerTrajet : ${n} vérifications, ${ko} échec(s)`); if (ko) process.exit(1);
