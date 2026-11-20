import * as M from './thmModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// Données de départ du parcours : 0,20 kg de café, hS = 0,45 W/K
const C = M.capacite(0.20), hS = 0.45;
ok(proche(C, 836), 'C = 0,20 × 4180 = 836 J/K');
ok(proche(M.tauS(C, hS), 1857.78, 1e-5) && Math.abs(M.tauMin(C, hS) - 30.96) < 0.01, 'τ = 836 / 0,45 = 1858 s = 31 min');
ok(Math.abs(836 / 0.45 * 1 - 1857.78) < 0.01, 'J/K ÷ W/K = J/W = s');
ok(proche(M.flux(80, 20, 0.45), -27) && proche(M.flux(4, 20, 0.45), 7.2), 'φ = hS (T_ext − T) : −27 W puis +7,2 W');
ok(Math.abs(M.deltaT(-27, 30, 836) + 0.969) < 1e-3, 'ΔT sur 30 s = −0,97 K');
// solution : conditions initiales et limites, équation différentielle (bilan C dT/dt = hS (T_ext − T)) sur toute la plage des menus
const tau = M.tauMin(C, hS);
ok(proche(M.temperature(0, 80, 20, tau), 80) && Math.abs(M.temperature(1e6, 80, 20, tau) - 20) < 1e-9, 'T(0) = T_0, T(∞) = T_ext');
ok(Math.abs(M.temperature(tau, 80, 20, tau) - (20 + 60 * Math.exp(-1))) < 1e-9 && Math.abs(M.temperature(tau, 80, 20, tau) - 42.07) < 0.01, 'T(τ) = 42,1 °C');
ok(Math.abs(M.temperature(5 * tau, 80, 20, tau) - 20) / 60 < 0.0068, 'à 5 τ : moins de 1 % de l’écart');
ok(Math.abs(M.temperature(60, 4, 20, tau) - 17.69) < 0.01, 'liquide à 4 °C après 60 min : 17,7 °C');
ok(Math.abs(M.penteOrigine(80, 20, tau) + 1.938) < 1e-3 && Math.abs(M.penteOrigine(80, 20, tau) - M.derivee(0, 80, 20, tau)) < 1e-12, 'pente à l’origine −1,94 K/min');
// la tangente à l'origine coupe l'asymptote à t = τ
ok(Math.abs(80 + M.penteOrigine(80, 20, tau) * tau - 20) < 1e-9, 'tangente : coupe T_ext à t = τ');
for (const m of M.MASSES) for (const iso of M.ISOLATIONS) for (const T0 of M.T0_MENU) for (const Te of M.T_EXT_MENU) {
  if (T0 === Te) continue;
  const Cm = M.capacite(m), tm = M.tauMin(Cm, iso.hS);
  ok(tm >= 10 && tm <= 480, `τ plausible (${tm.toFixed(0)} min) pour m=${m} ${iso.id}`);
  for (const k of [0.01, 0.3, 1, 2.5, 5]) ok(Math.abs(M.residuEquation(k * tm, T0, Te, Cm, iso.hS)) < 1e-4 * iso.hS * Math.abs(T0 - Te), `équation : m=${m} ${iso.id} T0=${T0} Te=${Te} k=${k}`);
}
// temps pour atteindre une température (et cas impossible)
ok(Math.abs(M.temperature(M.tempsPour(35, 80, 20, tau), 80, 20, tau) - 35) < 1e-9 && Number.isNaN(M.tempsPour(15, 80, 20, tau)) && Number.isNaN(M.tempsPour(90, 80, 20, tau)), 'tempsPour');
ok(Math.abs(M.tempsPour(M.temperature(tau, 80, 20, tau), 80, 20, tau) - tau) < 1e-9, 'tempsPour(T(τ)) = τ');
// linéarisation : ln y = −t/τ
ok(Math.abs(M.lnEcart(M.temperature(2 * tau, 80, 20, tau), 80, 20) + 2) < 1e-9, 'ln y(2τ) = −2');
// plausibilité du café : 80 → 20 °C en une à deux heures environ (écart < 1 K après 4 τ = 2 h)
ok(M.temperature(4 * tau, 80, 20, tau) - 20 < 1.2, 'écart de 1 K après environ 2 h');
// acquisition du parcours : τ = 8,0 min ; la lecture à 63 % et l'ajustement de ln y redonnent τ à moins de 10 %
{ const a = M.acquisitionGuide(); ok(Math.abs(a.tau - 8) < 0.01 && a.pts.length === M.N_ECH, 'acquisition guide : τ = 8,0 min');
  const t1 = M.lecturePremierPassage(a); ok(Math.abs(t1 - a.tau) / a.tau <= M.TOL_TAU, `lecture du parcours faisable : ${t1}`);
  const f = M.ajustementLn(a); ok(Math.abs(-1 / f.b - a.tau) / a.tau < 0.1 && f.n >= 10, `ajustement : τ = ${-1 / f.b}`);
  console.log(`  acquisition du parcours : premier passage à 63 % à ${t1.toFixed(1)} min ; ajustement de ln y : τ = ${(-1 / f.b).toFixed(2)} min sur ${f.n} points (jusqu'à ${f.tmax} min)`); }
// défi 1 : 20 000 acquisitions, lecture à 63 % à moins de 15 % de τ
let pire = 0; for (let i = 0; i < 20000; i++) { const d = M.tirageAcquisition(); ok(d.tau >= 6 && d.tau <= 150 && d.tmax / d.tau >= 3 && d.tmax / d.tau <= 9, 'plage'); const e = Math.abs(M.lecturePremierPassage(d) - d.tau) / d.tau; pire = Math.max(pire, e); ok(e <= M.TOL_TAU, `défi 1 : ${d.type} τ=${d.tau} (${(e * 100).toFixed(1)} %)`); }
// défi 2 : 20 000 tirages, cohérence et tolérance d'un élève qui arrondit τ à 2 chiffres significatifs
const r2 = x => Number(x.toPrecision(2));
let pT = 0, pt = 0; for (let i = 0; i < 20000; i++) {
  const d = M.tirageCalcul();
  ok(Math.abs(d.qTau - d.C / d.hS / 60) < 1e-9 && d.Tc !== d.Text && Number.isFinite(d.qT_t) && d.qT_t > 0, 'tirage cohérent');
  ok(Math.abs(M.temperature(d.qT_t, d.T0, d.Text, d.tau) - d.Tc) < 1e-9, 'temps pour atteindre Tc');
  const tr = r2(d.tau), eT = Math.abs(M.temperature(d.t, d.T0, d.Text, tr) - d.qT) / Math.abs(d.qT), et = Math.abs(M.tempsPour(d.Tc, d.T0, d.Text, tr) - d.qT_t) / d.qT_t;
  pT = Math.max(pT, eT); pt = Math.max(pt, et);
}
console.log(`${n} contrôles OK ; pire écart défi 1 ${(pire * 100).toFixed(1)} % ; défi 2 avec τ arrondi à 2 CS : pire écart sur T ${(pT * 100).toFixed(2)} %, sur le temps ${(pt * 100).toFixed(2)} %`);
ok(pT <= 0.06 && pt <= 0.06, 'défi 2 : tolérance de 6 % tenable avec τ arrondi à 2 CS');
