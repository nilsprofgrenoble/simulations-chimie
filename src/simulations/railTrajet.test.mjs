import { trajet, PTS } from './railTrajet.js';
import { bilan } from './poidsTrajetModele.js';
let n = 0, ko = 0; const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 12) console.log('ÉCHEC', m); } };
for (const m of [1, 2, 3, 5]) for (const a of PTS) for (const b of PTS) for (const frott of [false, true]) {
  const r = trajet({ m, dep: a.id, arr: b.id, frott }), id = `${m} ${a.id}${b.id} ${frott}`;
  if (a.id === b.id) { ok(!r.ok && r.tFin === 0, 'vide ' + id); continue; }
  const bl = bilan({ m, dep: a.id, arr: b.id, frott }), f = r.frames[r.frames.length - 1];
  ok(Math.abs(f.Wp - bl.Wp) < 1e-3, 'Wp ' + id); ok(Math.abs(f.Wr - bl.Wr) < 2e-2, 'Wr ' + id); ok(Math.abs(f.Wt - bl.somme) < 2e-2, 'Σ ' + id);
  ok(Math.abs(f.x - b.x) < 1e-6 && Math.abs(r.frames[0].x - a.x) < 1e-9, 'extrémités ' + id);
  for (let i = 1; i < r.frames.length; i++) ok(r.frames[i].s >= r.frames[i - 1].s && (frott ? r.frames[i].Wr <= r.frames[i - 1].Wr + 1e-12 : true), 'monotone ' + id);
}
console.log(`railTrajet : ${n} vérifications, ${ko} échec(s)`); if (ko) process.exit(1);
