import { trajet, A_FROTT, G } from './formesTrajet.js';
let n = 0, ko = 0; const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 10) console.log('ÉCHEC', m); } };
const pr = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(a), Math.abs(b));
for (const m of [0.2, 0.5, 1, 2, 3]) {
  for (const H of [1, 1.5, 2, 3]) { const r = trajet({ sit: 'chute', m, H }), f = r.frames[r.frames.length - 1]; ok(pr(r.Etot0, m * G * H), 'E0'); ok(pr(f.Ec, r.Etot0, 1e-6) && f.Ep < 1e-6, 'fin chute'); for (const q of r.frames) ok(pr(q.Tot, r.Etot0, 1e-9) && q.Ec >= 0 && q.Ep >= -1e-9, 'tot chute'); }
  for (const v0 of [2, 3, 4, 5, 6]) { const r = trajet({ sit: 'glisse', m, v0 }), f = r.frames[r.frames.length - 1]; ok(f.v < 1e-9 && pr(f.U, r.Etot0, 1e-9), 'arrêt'); ok(pr(f.x, v0 * v0 / (2 * A_FROTT), 1e-9), 'distance'); for (const q of r.frames) ok(pr(q.Tot, r.Etot0, 1e-9) && q.U >= -1e-9, 'tot glisse'); }
}
for (const Q of [400, 800, 1200]) { const r = trajet({ sit: 'chauffe', Q }), f = r.frames[r.frames.length - 1]; ok(pr(f.U, Q) && pr(f.dT, Q / (0.2 * 4180)), 'chauffe'); }
console.log(`formesTrajet : ${n} vérifications, ${ko} échec(s)`); if (ko) process.exit(1);
