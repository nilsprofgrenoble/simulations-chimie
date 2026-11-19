import * as M from './rcModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// τ = R C : kΩ × µF = ms (Ω·F = s)
ok(proche(M.tau(4.7, 22), 103.4) && proche(M.tau(10, 10), 100), 'τ');
ok(Math.abs(4700 * 22e-6 - 0.1034) < 1e-12, 'Ω × F = s : 4 700 Ω × 22 µF = 0,1034 s');
// valeurs remarquables
ok(proche(M.fraction('charge', 1), 0.63212, 1e-4) && proche(M.fraction('decharge', 1), 0.36788, 1e-4), '63 % et 37 %');
ok(M.fraction('charge', 5) > 0.993 && M.fraction('charge', 5) < 0.994, '5 τ : 99,3 %');
ok(M.fraction('decharge', 5) > 0.0067 && M.fraction('decharge', 5) < 0.0068, '5 τ décharge : 0,67 %');
ok(proche(M.fraction('charge', 2), 0.86466, 1e-4) && proche(M.fraction('charge', 3), 0.95021, 1e-4), '2 τ, 3 τ');
// conditions initiales et finales
ok(M.uC('charge', 0, 6, 100) === 0 && M.uC('decharge', 0, 6, 100) === 6 && M.uC('charge', 1e9, 6, 100) === 6 && M.uC('decharge', 1e9, 6, 100) === 0, 'u(0), u(∞)');
ok(proche(M.intensite('charge', 0, 6, 4.7, 103.4), 6 / 4.7) && M.intensite('decharge', 0, 6, 4.7, 103.4) < 0, 'i(0) = E/R, signe en décharge');
ok(Math.abs(M.intensite('charge', 1e9, 6, 4.7, 100)) < 1e-12, 'i(∞) = 0');
// équation différentielle vérifiée (différences finies) pour toute la plage des menus
for (const R of M.R_MENU) for (const C of M.C_MENU) for (const E of M.E_MENU) for (const type of ['charge', 'decharge']) for (const k of [0.01, 0.3, 1, 2.5, 5]) {
  const t = k * M.tau(R, C), T = M.tau(R, C), r = M.residuEquation(type, t, E, R, C, T * 1e-4);
  ok(Math.abs(r) < 1e-6 * E, `équation RC du/dt + u = E : ${type} R=${R} C=${C} k=${k} r=${r}`);
  // i = C du/dt (mA = µF × V/ms) ; loi des mailles E = R i + u (charge)
  const h = T * 1e-5, du = (M.uC(type, t + h, E, T) - M.uC(type, t - h, E, T)) / (2 * h);
  ok(proche(M.intensite(type, t, E, R, T), C * du, 1e-5), 'i = C du/dt');
  ok(proche(R * M.intensite(type, t, E, R, T) + M.uC(type, t, E, T), type === 'charge' ? E : 0, 1e-9), 'loi des mailles');
}
// tangente à l'origine : coupe l'asymptote à t = τ
ok(proche(M.penteOrigine('charge', 6, 100) * 100, 6) && proche(M.penteOrigine('decharge', 6, 100) * 100, -6), 'tangente : coupe l’asymptote à τ');
// défi 1 : 20 000 acquisitions ; le premier passage par 63 % (ou 37 %) donne τ à moins de 15 %
let pire = 0, tauMin = 1e9, tauMax = 0;
for (let i = 0; i < 20000; i++) {
  const d = M.tirageAcquisition();
  ok(d.tau >= 0.5 && d.tau <= 600 && d.tmax / d.tau >= 4.5 && d.tmax / d.tau <= 8, 'plage');
  const t1 = M.lecturePremierPassage(d), e = Math.abs(t1 - d.tau) / d.tau; pire = Math.max(pire, e);
  ok(e <= M.TOL_TAU, `défi 1 faisable : ${d.type} τ=${d.tau} lecture ${t1} (${(e * 100).toFixed(1)} %)`);
  tauMin = Math.min(tauMin, d.tau); tauMax = Math.max(tauMax, d.tau);
}
// défi 2 : la réponse arrondie à 2 chiffres significatifs est acceptée à 6 % ; τ affiché est 'propre' (2 chiffres significatifs)
let pire2 = 0, pireQ = 0;
for (let i = 0; i < 20000; i++) {
  const d = M.tirageRC(), r2 = Number(d.vrai.toPrecision(2)), e = Math.abs(r2 - d.vrai) / d.vrai; pire2 = Math.max(pire2, e);
  ok(e <= 0.06 && Number(d.tauAff.toPrecision(2)) === d.tauAff, 'défi 2 arrondi');
  // question 2 : q = C × E, C arrondie à 2 CS avant de calculer ; un élève qui garde 3 CS ou 2 CS reste à moins de 8 %
  { const Cv = d.cherche === 'C' ? d.vrai : d.C; ok(Math.abs(d.qVrai - d.Cq * d.E) < 1e-9 && Math.abs(Number(Cv.toPrecision(3)) * d.E - d.qVrai) / d.qVrai <= 0.08 && Math.abs(Cv * d.E - d.qVrai) / d.qVrai <= 0.08, 'défi 2 : q = C E dans la marge de 8 %'); pireQ = Math.max(pireQ, Math.abs(Cv * d.E - d.qVrai) / d.qVrai); }
  const brut = d.cherche === 'C' ? d.C : d.R; ok(Math.abs(d.vrai - brut) / brut < 0.06, 'τ arrondi à 2 CS reste cohérent avec la valeur de départ (≤ 6 %)');
}
console.log(`${n} contrôles OK ; pire écart défi 1 ${(pire * 100).toFixed(1)} % (τ de ${tauMin} à ${tauMax} ms) ; pire arrondi défi 2 ${(pire2 * 100).toFixed(2)} % ; pire écart sur q ${(pireQ * 100).toFixed(2)} %`);
{ const d = M.acquisitionGuide(), t1 = M.lecturePremierPassage(d); ok(Math.abs(t1 - d.tau) / d.tau <= M.TOL_TAU, `acquisition du parcours faisable : lecture ${t1} pour τ = ${d.tau}`); console.log(`  acquisition du parcours : premier passage à 63 % à ${t1.toFixed(2)} ms pour τ = ${d.tau} ms`); }
