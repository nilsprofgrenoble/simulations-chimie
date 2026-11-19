// Test du modèle « CO₂ dissous » (sim 142) : node src/simulations/co2DissousModele.test.mjs
import * as M from './co2DissousModele.js';

let n = 0, bad = 0;
const ok = (c, msg) => { n++; if (!c) { bad++; console.log('ÉCHEC :', msg); } };
const proche = (x, y, tol) => Math.abs(x - y) <= tol;

// répartition : somme 1, positivité, égalités aux pKa, prédominance
for (let pH = 0; pH <= 14.001; pH += 0.05) {
  const [a0, a1, a2] = M.repartition(pH);
  ok(proche(a0 + a1 + a2, 1, 1e-12) && a0 >= 0 && a1 >= 0 && a2 >= 0, `somme des fractions à pH ${pH}`);
  const e = M.especePredominante(pH), max = Math.max(a0, a1, a2), idx = [a0, a1, a2].indexOf(max);
  if (Math.abs(pH - M.PKA1) > 1e-6 && Math.abs(pH - M.PKA2) > 1e-6) ok(['CO2', 'HCO3', 'CO3'][idx] === e || Math.abs(pH - 8.325) < 0.2 || max < 0.55, `prédominance à pH ${pH} : ${e} / ${idx}`);
}
ok(proche(M.repartition(M.PKA1)[0], M.repartition(M.PKA1)[1], 0.01), 'à pH = pKa1, [CO₂] ≈ [HCO₃⁻] (écart dû à CO₃²⁻ négligeable)');
ok(proche(M.repartition(M.PKA2)[1], M.repartition(M.PKA2)[2], 0.01), 'à pH = pKa2, [HCO₃⁻] ≈ [CO₃²⁻]');
ok(M.repartition(2)[0] > 0.999 && M.repartition(12)[2] > 0.98, 'extrêmes : CO₂ à pH 2 ; CO₃²⁻ à pH 12');

// loi de Henry : proportionnalité en P, décroissance avec la température
for (const T of M.TEMPS) for (const P of M.PRESSIONS) {
  ok(proche(M.concCO2(2 * P, T), 2 * M.concCO2(P, T), 1e-12), `Henry proportionnelle T ${T} P ${P}`);
}
for (let i = 1; i < M.TEMPS.length; i++) ok(M.A_T[M.TEMPS[i]] < M.A_T[M.TEMPS[i - 1]], 'a(T) décroissante');

// eau pure : pH exact et formule du cours (écart < 0,01 pour toutes les situations), pH décroissant avec P, 0,5 unité par décade
for (const T of M.TEMPS) {
  let prec = 99;
  for (const P of [0.04, 0.1, 0.4, 1, 4, 10, 20, 100, 300]) {
    const e = M.eauPure(P, T);
    ok(proche(e.pH, e.pHFormule, 0.01), `écart exact / formule T ${T} P ${P} : ${e.pH} / ${e.pHFormule}`);
    ok(e.pH < 7 && e.pH < prec, `pH acide et décroissant en P (T ${T} P ${P})`); prec = e.pH;
    ok(proche(e.hco3 * 1e-3, 10 ** -e.pH, 0.01 * 10 ** -e.pH + 2e-8), `[HCO₃⁻] ≈ [H₃O⁺] T ${T} P ${P}`);
    ok(e.co3 < 1e-3 * e.hco3 + 1e-6, `CO₃²⁻ négligeable T ${T} P ${P}`);
  }
  ok(proche(M.pHEau(10 * 4, T) - M.pHEau(4, T), -0.5, 0.01), `0,5 unité par décade T ${T}`);
  ok(proche(M.pHEau(100 * 0.4, T) - M.pHEau(0.4, T), -1, 0.01), `1 unité pour ×100 T ${T}`);
}

// milieu de pH imposé : cohérence avec les fractions, solubilité apparente croissante avec le pH
for (const T of M.TEMPS) for (const P of M.PRESSIONS) {
  let prec = 0;
  for (const pH of [4, 6, 7, 7.5, 8, 8.5, 9, 10, 11, 12]) {
    const m = M.milieu(P, T, pH), [a0, a1, a2] = M.repartition(pH);
    ok(proche(m.c / m.ct, a0, 1e-9) && proche(m.hco3 / m.ct, a1, 1e-9) && proche(m.co3 / m.ct, a2, 1e-9), `fractions cohérentes P ${P} T ${T} pH ${pH}`);
    ok(m.solub >= 1 && m.solub > prec, `solubilité apparente croissante avec le pH (pH ${pH})`); prec = m.solub;
    ok(proche(m.c, M.concCO2(P, T), 1e-12), '[CO₂] fixée par la loi de Henry quel que soit le pH');
  }
}

// valeurs du parcours guidé
const PA = M.PARCOURS;
ok(proche(M.concCO2(PA.P1, PA.T), 6.6, 1e-9), `[CO₂] étape 1 : ${M.concCO2(PA.P1, PA.T)}`);
ok(proche(M.concCO2(PA.P3, PA.T), 19.8, 1e-9), 'tripler la pression triple [CO₂]');
ok(M.concCO2(PA.P1, PA.Tchaud) < M.concCO2(PA.P1, PA.T), 'chauffer fait diminuer [CO₂]');
ok(proche(M.pHFormule(M.concCO2(PA.P1, PA.T)), 4.27, 0.01), `pH formule étape 8 : ${M.pHFormule(M.concCO2(PA.P1, PA.T))}`);
const mm = M.milieu(PA.Pmilieu, PA.T, PA.pHmilieu);
ok(proche(mm.c, 0.132, 1e-9) && proche(mm.hco3, 5.9, 0.01) && proche(mm.co3, 0.0296, 0.0005) && proche(mm.ct, 6.06, 0.01) && proche(mm.solub, 45.9, 0.1), `milieu pH 8 : ${JSON.stringify(mm)}`);
ok(proche(M.pHFormule(M.concCO2(0.4, 25)), 5.11, 0.01) && proche(M.pHFormule(M.concCO2(0.4)) - M.pHFormule(M.concCO2(40)), 1, 0.001), 'étape 9 : 1 unité pour ×100');
ok(proche(M.rapportHCO3(PA.pHrapport), 4.47, 0.01), 'rapport à pH 7,0');
ok(proche(M.eauPure(PA.Pair).pH, 5.62, 0.02) && M.eauPure(PA.Pbouteille).pH > 3.5 && M.eauPure(PA.Pbouteille).pH < 3.8, `air ${M.eauPure(PA.Pair).pH}, bouteille ${M.eauPure(PA.Pbouteille).pH}`);
let prec = 0;
for (const pH of PA.milieux) { const s = M.milieu(PA.Pmilieu, PA.T, pH).solub; ok(s > prec, 'milieux du parcours classés par solubilité croissante'); prec = s; }

// défis : 20000 tirages chacun
let min = 1e9;
for (let i = 0; i < 20000; i++) {
  const t = M.tirageEau();
  ok(proche(t.c, t.a * t.P, 1e-9), 'défi eau : [CO₂] = a·P');
  ok(proche(t.pH, M.pHEau(t.P, t.T), 0.01), `défi eau : écart formule / exact ${t.pH} ${M.pHEau(t.P, t.T)}`);
  ok(t.pH > 3.5 && t.pH < 6.5 && t.c > 0.02, 'défi eau : valeurs raisonnables');
  const u = M.tirageMilieu();
  ok(u.hco3 > 0 && u.ct > u.hco3 && proche(u.solub, u.ct / u.c, 1e-9), 'défi milieu cohérent');
  min = Math.min(min, u.co3 / u.hco3);
}
console.log(`${n} vérifications, ${bad} échec(s).`);
if (bad) process.exit(1);
