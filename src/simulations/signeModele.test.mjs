import * as M from './signeModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC', m); } };
for (const W of M.W_VALEURS) for (const f of M.F_VALEURS) {
  const sb = M.somme('batterie', W, f), sbl = M.somme('bloc', W, f), sa = M.somme('air', W, f);
  ok(Math.abs(sb + sbl + sa) < 1e-9, `conservation globale W=${W} f=${f}`);   // l'énergie totale des trois systèmes est constante
  ok(Math.abs(sbl - (1 - f) * W) < 1e-9, 'ΔU bloc');
  ok(sb < 0 && sa >= 0 && sbl >= 0, 'signes');
  ok(M.sens(sbl) === (f === 1 ? 'constante' : 'augmente'), 'sens');
  ok(M.transferts('bloc', W, f).some(t => t.type === 'Q' && t.val <= 0), 'Q du bloc cédé');
}
ok(Math.abs(M.PARCOURS.dU - 500) < 1e-9 && Math.abs(M.PARCOURS.dT - 500 / (0.5 * 385)) < 1e-9, 'parcours');
for (let i = 0; i < 2000; i++) {
  const a = M.tirageDefiA(); ok(a.dU > 0 && a.dT > 0 && a.dT < 20, 'défi A');
  const b = M.tirageDefiB(); ok(b.somme > 0 && Math.abs(b.P * b.dt - b.Q) < 1e-9 && Number.isFinite(b.P), 'défi B');
}
console.log(ko ? `${ko} échec(s)` : `OK : ${n} vérifications, 0 échec.`);
process.exit(ko ? 1 : 0);
