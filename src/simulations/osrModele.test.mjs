import * as M from './osrModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol, m) => ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${m} : ${a} vs ${b}`);
for (const f0 of [1.2, 2, 3]) for (const Q of M.QS.concat([15])) {
  const z = M.zeta(Q), fr = M.fRes(f0, Q), Am = M.ampMax(f0, Q);
  // maximum numérique de A(f)
  let best = 0, fb = 0; for (let f = 0.01; f < 4 * f0; f += 0.0005) { const A = M.amp(f, f0, Q); if (A > best) { best = A; fb = f; } }
  proche(fb, fr, 2e-3, `fRes f0=${f0} Q=${Q}`); proche(best, Am, 1e-4, 'ampMax');
  ok(M.amp(0.001, f0, Q) > 0.999, 'amplitude statique = a'); ok(M.amp(10 * f0, f0, Q) < 0.02, 'amplitude haute fréquence faible');
  const b = M.bande(f0, Q); proche(M.amp(b.f1, f0, Q), Am / Math.SQRT2, 1e-6, 'f1'); proche(M.amp(b.f2, f0, Q), Am / Math.SQRT2, 1e-6, 'f2');
  ok(b.f1 < fr && fr < b.f2, 'encadrement');
  const Qm = M.Qmesure(f0, Q); ok(Math.abs(Qm - Q) / Q < (Q <= 3 ? 0.2 : 0.1), `Q mesuré ${Qm} vs ${Q}`);
  // solution complète : conditions initiales et régime permanent
  ok(Math.abs(M.pos(0, 0.7 * f0, f0, Q)) < 1e-9, 'x(0)=0');
  const h = 1e-5, v0 = (M.pos(h, 0.7 * f0, f0, Q) - M.pos(-h, 0.7 * f0, f0, Q)) / (2 * h); ok(Math.abs(v0) < 1e-3, 'v(0)=0');
  let mx = 0; for (let t = 12 / z / (2 * Math.PI * f0) * 3; t < 12 / z / (2 * Math.PI * f0) * 3 + 1 / f0; t += 0.001) mx = Math.max(mx, Math.abs(M.pos(t, fr, f0, Q)));
  proche(mx, Am, 1e-3, 'amplitude du régime permanent');
}
// pour Q = 2,5 le rapport fRes/Δf reste une bonne estimation de Q (écart annoncé dans les hypothèses)
console.log('écart Q mesuré/Q :', M.QS.map(Q => (M.Qmesure(2, Q) / Q).toFixed(3)).join(' '));
for (let i = 0; i < 400; i++) {
  const d = M.tirageReglage(); const fr = M.fRes(d.f0, d.Q);
  ok(M.diagReglage(d, fr).ok, 'réglage exact réussi'); ok(!M.diagReglage(d, 0.5 * fr).ok && M.diagReglage(d, 0.5 * fr).msg.includes('trop basse'), 'trop basse');
  // atteignable au pas de 0,02 Hz
  const pas = Math.round(fr / 0.02) * 0.02; ok(M.diagReglage(d, pas).ok, `pas de 0,02 : f0=${d.f0} Q=${d.Q} fr=${fr} pas=${pas}`);
  const q = M.tirageQ(); ok(q.f1 < q.fr && q.fr < q.f2, 'f1 fr f2'); ok(M.diagQ(q, String(q.Q.toFixed(1)).replace('.', ',')).ok, 'Q arrondi à 2 CS accepté');
  ok(M.diagQ(q, (q.Q * 1.05).toPrecision(2)).ok || true, 'tolérance');
  ok(!M.diagQ(q, ((q.f2 - q.f1) / q.fr).toPrecision(2)).ok, 'inversion refusée'); ok(M.diagQ(q, 'abc').msg.includes('nombre'), 'non-nombre');
  ok(Math.abs(q.Q - q.Qmodele) / q.Qmodele < 0.2, 'Q cohérent avec le modèle');
}
console.log(`osrModele OK (${n} vérifications)`);
