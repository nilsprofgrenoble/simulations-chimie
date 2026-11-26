import * as M from './pilePcmModele.js';
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 8) console.log('ÉCHEC', m); } };
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// exemple du parcours : Cu²⁺ limitant, n(e⁻) = 2,0e-2 mol, Q = 1930 C, durée à 20 mA = 96 500 s
const e = M.etat(M.PARCOURS.g, M.PARCOURS.d, 0);
ok(e.plus === 'cu' && e.moins === 'zn', 'polarité Daniell'); ok(e.limitant === 'ion', 'Cu²⁺ limitant');
ok(near(e.neMax, 0.020), 'n(e-) 2,0e-2'); ok(near(e.Qmax, 1930), 'Q 1930 C'); ok(near(M.duree(e.Qmax, 20), 96500), 'durée 96 500 s');
ok(Math.abs(M.tensionLue(['zn', 'cu'], 'd') - 1.10) < 0.005 && M.tensionLue(['zn', 'cu'], 'g') < 0, 'signe du voltmètre');
for (const p of M.PILES) { const a = M.tensionLue(p, 'g'), b = M.tensionLue(p, 'd'); ok(near(a, -b) && a !== 0, 'signes opposés ' + p); }
// exploration : la charge croît, la tension reste ≥ 0, la pile usée ne fournit plus rien
for (const p of M.PILES) { let prev = -1; for (let f = 0; f <= 1.0001; f += 0.05) { const s = M.etatExplore(p, f); ok(s.Q >= prev - 1e-9 && s.e.U >= 0, 'monotone ' + p + f); prev = s.Q; } ok(M.etatExplore(p, 1).e.U === 0 || M.etatExplore(p, 1).e.use, 'usée'); }
for (let i = 0; i < 4000; i++) {
  const d = M.tirageDefiCapacite(); ok(d.Q > 0 && d.dureeH > 0 && isFinite(d.dureeH), 'défi capacité'); ok(near(d.Q, Math.min(d.neIon, d.neMet) * M.F), 'Q = min × F');
  ok(Math.max(d.neIon, d.neMet) / d.ne >= 1.3, 'limitant net'); ok(d.dureeH > 0.01 && d.dureeH < 400, 'durée plausible ' + d.dureeH);
  const p = M.tirageDefiPolarite(); ok(p.cotePlus !== p.coteMoins, 'pôles'); ok(p.lu !== 0 && (p.lu > 0) === (p.borneV === p.cotePlus), 'signe lu');
}
console.log(bad ? `${bad} échec(s) sur ${n}` : `OK : ${n} vérifications`); process.exit(bad ? 1 : 0);
