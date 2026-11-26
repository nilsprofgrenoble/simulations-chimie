import * as T from './freinageTrajet.js';
import * as M from './freinageModele.js';
let n = 0, ko = 0; const ok = (c, msg) => { n++; if (!c) { ko++; if (ko < 15) console.log('ÉCHEC', msg); } };
const proche = (a, b, e = 1e-6) => a === b || Math.abs(a - b) <= e * Math.max(1, Math.abs(a), Math.abs(b));
for (const m of [500, 1000, 2000, 5000]) for (const vkmh of [20, 30, 50, 72, 90, 110, 130]) for (const F of [2000, 4000, 8000, 16000]) for (const p of [-0.1, -0.05, 0, 0.05, 0.1]) for (const D of [10, 30, 60, 100, 250]) {
  const r = T.trajet({ m, vkmh, F, p, D }), id = `${m} ${vkmh} ${F} ${p} ${D}`, d = M.distanceArret({ m, v0: vkmh / 3.6, F, p });
  ok(proche(r.dArret, d), 'd ' + id);
  ok(r.choc === (d > D), 'choc ' + id);
  const f = r.frames[r.frames.length - 1], f0 = r.frames[0];
  ok(proche(f0.Em, r.Em0) && f0.x === 0, 'début ' + id);
  ok(proche(f.x, r.xFin, 1e-6), 'xFin ' + id);
  if (!r.choc) ok(f.v < 1e-6 && Math.abs(f.Ec) < 1e-3, 'arrêt ' + id);
  else ok(proche(f.v * f.v, (vkmh / 3.6) ** 2 - 2 * r.a * D, 1e-6), 'vitesse choc ' + id);
  let prec = Infinity;
  for (const q of r.frames) {
    ok(q.Epp >= -1e-6, 'Epp ' + id);
    ok(q.Em <= prec + 1e-6, 'Em décroît ' + id); prec = q.Em;
    ok(proche(q.Ec - q.WF - q.WP, r.Ec0, 1e-9), 'théorème Ec ' + id);
  }
  for (let i = 1; i < r.frames.length; i++) ok(r.frames[i].x >= r.frames[i - 1].x - 1e-9, 'x croît ' + id);
}
console.log(`freinageTrajet : ${n} vérifications, ${ko} échec(s)`); if (ko) process.exit(1);
