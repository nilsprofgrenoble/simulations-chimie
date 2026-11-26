import * as M from './conductimetrieTstlModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// V_E : 20,0 mL × 0,040 mol/L / 0,050 mol/L = 16,0 mL
ok(proche(M.volumeEquivalent(0.040), 16), 'VE');
const base = { cation: 'Na', cA: 0.040 };
// départ, volume constant 200 mL : [Na⁺] = [Cl⁻] = 0,80 mmol/200 mL = 4,0 mol/m³ → (5,0 + 7,6) × 4,0 = 50,4 mS/m
ok(Math.abs(M.sigma({ ...base, VB: 0 }) - 50.4) < 1e-6, 'σ initial ' + M.sigma({ ...base, VB: 0 }));
// à l'équivalence : Na⁺ et NO₃⁻ à 4,0 mol/m³ → (5,0 + 7,1) × 4,0 = 48,4 mS/m (non nulle : le solide ne conduit pas, mais NaNO₃ oui)
ok(Math.abs(M.sigma({ ...base, VB: 16 }) - 48.4) < 1e-6, 'σ équivalence ' + M.sigma({ ...base, VB: 16 }));
// après : à 24 mL, Ag⁺ en excès : n(Ag⁺) = 0,05×8 = 0,40 mmol → 2,0 mol/m³ ; NO₃⁻ = 1,2 mmol → 6,0 ; Na⁺ 4,0 → 5,0×4,0 + 7,1×6,0 + 6,2×2,0 = 75,0
ok(Math.abs(M.sigma({ ...base, VB: 24 }) - 75.0) < 1e-6, 'σ à 24 mL ' + M.sigma({ ...base, VB: 24 }));
// pentes : avant (7,1 − 7,6) × 0,25 = −0,125 ; après (6,2 + 7,1) × 0,25 = 3,325 mS/m par mL (volume 200 mL)
ok(proche(M.penteAvant(), -0.125) && proche(M.penteApres(), 3.325), 'pentes théoriques');
ok(proche(M.pente(base, 8), -0.125, 1e-3) && proche(M.pente(base, 20), 3.325, 1e-3), 'pentes du modèle');
// quantités
const q = M.quantites({ cA: 0.040, VB: 8 }); ok(proche(q.nReagi, 0.4) && proche(q.nCl, 0.4) && proche(q.nAgExces, 0) && proche(q.nPrec, 0.4), 'quantités avant');
const q2 = M.quantites({ cA: 0.040, VB: 24 }); ok(proche(q2.nReagi, 0.8) && proche(q2.nCl, 0) && proche(q2.nAgExces, 0.4), 'quantités après');
// conservation : Cl⁻ initial = Cl⁻ restant + AgCl formé ; Ag⁺ versé = Ag⁺ restant + AgCl formé ; électroneutralité
for (const cA of M.CONC_A) for (const cation of ['Na', 'K']) for (const eau of M.EAU) for (const dilution of [false, true]) for (let VB = 0; VB <= 25; VB += 0.5) {
  const { q: qq, c } = M.composition({ cation, cA, VB, eau, dilution });
  ok(proche(qq.nCl0, qq.nCl + qq.nPrec) && proche(qq.nAg, qq.nAgExces + qq.nPrec), 'conservation');
  ok(Math.abs((c[cation] + c.Ag) - (c.Cl + c.NO3)) < 1e-9 * Math.max(1, c.NO3), `charge ${cation} ${cA} ${eau} ${VB}`);
  ok(Object.values(c).every(x => isFinite(x) && x >= 0), 'positif');
  ok(!(qq.nCl > 1e-12 && qq.nAgExces > 1e-12), 'Ag⁺ et Cl⁻ ne coexistent pas');
}
// forme : décroissante légère (ou quasi plate) avant V_E, croissante nettement après ; minimum en V_E ; σ(V_E) > 0
for (const cA of M.CONC_A) {
  const VE = M.volumeEquivalent(cA), pts = M.courbe({ cation: 'Na', cA }, 25, 0.25), imin = pts.reduce((m, p, i) => (p.sigma < pts[m].sigma ? i : m), 0);
  ok(Math.abs(pts[imin].VB - VE) <= 0.25 + 1e-9, `minimum en V_E ${cA}`); ok(pts[imin].sigma > 10, 'σ(V_E) non nulle');
}
// avec K⁺ : λ(K⁺) = 7,4 > λ(Na⁺) : la pente avant ne dépend pas du cation (K⁺ ou Na⁺ restent en solution, ils ne varient pas)
ok(proche(M.pente({ cation: 'K', cA: 0.04 }, 8), M.pente(base, 8), 1e-6), 'pente avant indépendante du cation');
// deux droites sur points mesurés sans dilution : V_E retrouvé exactement
for (const cA of M.CONC_A) {
  const VE = M.volumeEquivalent(cA), d = M.deuxDroites(M.pointsMesures({ cation: 'Na', cA }), VE);
  ok(Math.abs(d.VEmod - VE) < 1e-6, `intersection ${cA} : ${d.VEmod} / ${VE}`);
}
// défi 1 : points avec dilution et bruit ; la méthode des deux droites donne V_E à ±0,5 mL près → c_A à 5 % près sur 400 tirages
let pire = 0;
for (let i = 0; i < 400; i++) {
  const t = M.tirageDefiConc(), d = M.deuxDroites(t.pts, t.VE), cEst = M.CB * d.VEmod / t.VA, e = Math.abs(cEst - t.cA) / t.cA; pire = Math.max(pire, e);
  ok(t.VE + 2 < 25 - 1 && t.VE - 2 > 2, 'V_E dans la burette avec points de chaque côté');
}
ok(pire < 0.06, 'défi 1 : pire écart relatif de c_A ' + pire);
console.log('défi 1 : pire écart relatif', pire.toFixed(4));
// défi 2 : V_B à plus de 2 mL de V_E, σ défini
for (let i = 0; i < 400; i++) { const t = M.tirageDefiSigma(); ok(Math.abs(t.VB - t.VE) >= 2 - 1e-9 && t.VB > 0 && t.VB <= 25 && t.sigma > 0, 'tirage défi 2'); }
// masse de sel : 0,040 mol/L × 58,5 g/mol = 2,34 g/L
ok(proche(M.concentrationMassique(0.040), 2.34), 'g/L');
console.log(`conductimetrieTstlModele : ${n} contrôles OK`);
