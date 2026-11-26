import * as M from './tptModele.js';
let ko = 0, n = 0; const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 15) console.log('ÉCHEC', m); } };
const s = M.situation(M.SIT_GUIDE);
ok(Math.abs(s.Veq - 12.5) < 1e-9, 'Veq'); ok(Math.abs(M.E_INIT - 0.608) < 0.002, 'E initial ' + M.E_INIT);
const e0 = M.etat(s, 0), eh = M.etat(s, s.Veq / 2), eq = M.etat(s, s.Veq), e2 = M.etat(s, 2 * s.Veq);
ok(Math.abs(eh.E - 0.77) < 0.002, 'demi-équivalence ' + eh.E);
ok(Math.abs(eq.E - (0.77 + 1.44) / 2) < 0.003, 'équivalence ' + eq.E);
ok(Math.abs(e2.E - 1.44) < 0.003, 'double équivalence ' + e2.E);
ok(Math.abs(e0.U - (e0.E - 0.245)) < 1e-12, 'U');
// cohérence avec les formules usuelles loin de l'équivalence
for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) { const V = f * s.Veq, nb = s.cB * V + M.TRACE * s.nA, na = s.nA - s.cB * V, e = M.etat(s, V); ok(Math.abs(e.E - (0.77 + 0.06 * M.log10(nb / na))) < 0.0015, 'avant ' + f); }
for (const f of [1.1, 1.3, 1.6, 2]) { const V = f * s.Veq, c4 = s.cB * V - s.nA, c3 = s.nA, e = M.etat(s, V); ok(Math.abs(e.E - (1.44 + 0.06 * M.log10(c4 / c3))) < 0.003, 'après ' + f); }
// monotonie, bilans, bornes, sur de nombreuses situations
for (const E0A of [0.36, 0.45, 0.77, 1.0, 1.06]) for (const cA of [0.02, 0.05, 0.08]) for (const VA of [10, 20, 25]) for (const cB of [0.04, 0.08, 0.1]) {
  const sit = M.situation({ cA, VA, cB, E0A }); let prev = -9;
  for (let V = 0; V <= 25; V += 0.05) { const e = M.etat(sit, V);
    ok(isFinite(e.E) && e.E > 0 && e.E < 1.6, 'E fini'); ok(e.E >= prev - 1e-9, 'monotone ' + [E0A, cA, VA, cB, V].join(' ')); prev = e.E;
    ok(e.nRed >= 0 && e.nCe4 >= -1e-12 && e.nCe3 >= -1e-12, 'positifs');
    ok(Math.abs((e.nCe3 + e.nCe4) - sit.cB * V) < 1e-9 * Math.max(1, sit.cB * V), 'bilan cérium');
    ok(Math.abs((e.nRed + e.nOx) - sit.nA * (1 + M.TRACE)) < 1e-9, 'bilan fer'); }
  const pts = M.pointsTableur(sit), Vd = M.veqDerivee(pts);
  if (sit.Veq < 24) ok(Math.abs(Vd - sit.Veq) <= 0.12, `dérivée ${Vd} vs ${sit.Veq} (E0A ${E0A})`);
}
// défis
for (let k = 0; k < 3000; k++) { const d = M.tirageDefiDosage(); ok(d.s.Veq >= 7 && d.s.Veq <= 21, 'défi 1'); ok(Math.abs(M.veqDerivee(M.pointsTableur(d.s)) - d.s.Veq) <= 0.12, 'défi 1 dérivée');
  const g = M.tirageDefiE0(); const Vd = M.veqDerivee(g.pts); ok(Math.abs(Vd - g.Veq) <= 0.12, 'défi 2 dérivée'); const Eh = M.etat(g.s, Vd / 2).E; ok(Math.abs(Eh - g.E0A) <= 0.01, `défi 2 E° ${Eh} vs ${g.E0A}`); }
console.log(`tptModele : ${n} vérifications, ${ko} échec(s)`);
