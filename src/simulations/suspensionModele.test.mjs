import * as M from './suspensionModele.js';
import { QCM } from './suspensionQcm.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.log('ÉCHEC :', m); process.exitCode = 1; } };
const pr = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
for (const so of M.SOLIDES) {
  ok(Math.abs(M.zeta0(so.pie, so.pie)) < 1e-9, `ζ nul au PIE ${so.id}`);
  ok(M.zeta0(so.pie, so.pie - 3) > 0 && M.zeta0(so.pie, so.pie + 3) < 0, `signes ${so.id}`);
  ok(M.zeta0(so.pie, so.pie - 1) > M.zeta0(so.pie, so.pie - 0.5), `ζ croît quand on s'éloigne ${so.id}`);
  for (let pH = 0; pH <= 14; pH += 0.5) {
    let prev = null;
    for (const c of [0, 1e-4, 1e-3, 1e-2, 0.1, 0.5]) { const z = Math.abs(M.zeta({ solide: so.id, pH, c, sel: 'NaCl', disp: false })); if (prev != null) ok(z <= prev + 1e-9, `le sel n'augmente pas |ζ| ${so.id} ${pH} ${c}`); prev = z; }
    ok(Math.abs(M.zeta({ solide: so.id, pH, c: 0.01, sel: 'CaCl2', disp: false })) <= Math.abs(M.zeta({ solide: so.id, pH, c: 0.01, sel: 'NaCl', disp: false })) + 1e-9, 'CaCl₂ écrante plus que NaCl');
    const z = M.zeta({ solide: so.id, pH, c: 0, sel: 'NaCl', disp: false }); ok(Math.abs(z) <= 60 + 1e-9, 'plateau');
  }
  // près du PIE sans dispersant : floculée ; loin du PIE sans sel : stable
  ok(M.verdict(M.zeta({ solide: so.id, pH: so.pie, c: 0, disp: false })) === 'floculee', `floculée au PIE ${so.id}`);
  ok(M.verdict(M.zeta({ solide: so.id, pH: so.pie + (so.pie > 6 ? -3 : 3), c: 0.001, sel: 'NaCl', disp: false })) === 'stable', `stable loin du PIE ${so.id}`);
}
// dispersant : stabilise l'alumine au PIE (pH 8,5) mais pas à pH < 3 en environnement acide non ionisé ; ne détruit pas la stabilité à pH 10
ok(M.verdict(M.zeta({ solide: 'alumine', pH: 8.5, c: 0, disp: false })) === 'floculee', 'alumine PIE floculée');
ok(M.verdict(M.zeta({ solide: 'alumine', pH: 8.5, c: 0, disp: true })) === 'stable', 'alumine + dispersant stable au PIE');
ok(M.verdict(M.zeta({ solide: 'silice', pH: 2.5, c: 0, disp: true })) === 'floculee', 'dispersant non ionisé à pH 2,5 : silice floculée');
ok(Math.abs(M.alphaDisp(4.5) - 0.5) < 1e-9, 'α = 0,5 au pKa');
ok(Math.abs(M.longueurDebye(0.01) - 3.04) < 0.01 && Math.abs(M.longueurDebye(0.001) - 9.61) < 0.02, 'Debye');
ok(Math.abs(M.pieInterpole(8, 20, 9, -10) - 8 - 2 / 3) < 1e-9, 'interpolation');
// défis
let cas = { ph: 0, sel: 0, aucune: 0 };
for (let k = 0; k < 4000; k++) {
  const t = M.tiragePIE(pr);
  ok(t.za > 0 && t.zb < 0 && t.pHb > t.pHa, 'PIE encadré');
  ok(Math.abs(t.vrai - t.solide.pie) < 0.15, `interpolation proche du PIE vrai ${t.vrai} ${t.solide.pie}`);
  const d = M.tirageDiagnostic(pr); cas[d.cas]++;
  ok((d.cas === 'aucune') === (d.verdict === 'stable'), `cas ${d.cas} verdict ${d.verdict} ${d.solide.id} pH ${d.pH} c ${d.c} ${d.sel} ζ ${d.z}`);
  if (d.cas === 'ph') ok(d.verdict === 'floculee', `diag pH floculée ${d.z}`);
  if (d.cas === 'sel') ok(d.verdict !== 'stable' && Math.abs(d.pH - d.solide.pie) >= 2.4, `diag sel ${d.z}`);
}
ok(cas.ph > 1000 && cas.sel > 1000 && cas.aucune > 1000, 'équilibre des cas');
// QCM : structure, bonne réponse jamais la plus longue, places variées
let pos = [];
for (const [k, q] of Object.entries(QCM)) {
  const L = q.options.map(o => o.length), b = q.bonne;
  ok(q.options.length === 4 && L[b] < Math.max(...L), `QCM ${k} : bonne réponse la plus longue`); pos.push(b);
}
ok(pos.every((p, i) => i === 0 || p !== pos[i - 1]), 'places consécutives distinctes ' + pos);
ok([0, 1, 2, 3].every(p => pos.filter(x => x === p).length >= 1), 'toutes les places utilisées ' + pos);
console.log(`suspensionModele : ${n} vérifications, ${process.exitCode ? 'ÉCHEC' : 'OK'}`);
