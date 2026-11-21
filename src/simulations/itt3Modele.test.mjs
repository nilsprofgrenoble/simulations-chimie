// Tests du modèle 3ITT : node src/simulations/itt3Modele.test.mjs
import { DONNEES_3ITT, PARAMS_3ITT, simule3ITT, serieModele, etaRef, regenPct, tempsRegen, pente, verdictRegeneration, tirerPeintureMystere, INSTANTS_DEFI } from './itt3Modele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} : ${a} ≠ ${b} (±${tol})`);

// Mesures réelles : valeurs du corrigé de Nils
const A = DONNEES_3ITT.A, B = DONNEES_3ITT.B;
proche(etaRef(A), 16210, 5, 'ηref A'); proche(etaRef(B), 24613, 5, 'ηref B');
proche(regenPct(A, 80), 85, 1, 'M1 A'); proche(regenPct(B, 80), 91, 1, 'M1 B');
proche(tempsRegen(A, 25), 8, 0.6, 't25 A'); proche(tempsRegen(A, 50), 13.5, 0.6, 't50 A');
proche(tempsRegen(B, 25), 9, 0.6, 't25 B'); proche(tempsRegen(B, 50), 14, 0.8, 't50 B');
ok(pente(A, 7.6, 26.7) > 0 && pente(B, 7.6, 26.7) > pente(A, 7.6, 26.7), 'pente B > pente A');

// Modèle : allure cohérente avec les mesures
for (const k of ['A', 'B']) {
  const s = serieModele(PARAMS_3ITT[k], { pas: 0.5 });
  const m = DONNEES_3ITT[k];
  proche(etaRef(s) / etaRef(m), 1, 0.12, `ηref modèle ${k}`);
  proche(regenPct(s, 80), regenPct(m, 80), 6, `M1 modèle ${k}`);
  proche(tempsRegen(s, 50), tempsRegen(m, 50), 4, `t50 modèle ${k}`);
  // η chute à l'intervalle 2 puis remonte
  const e2 = s.find((q) => q[0] === 39.5)[1];
  ok(e2 < 0.12 * etaRef(s), `η chute à γ̇ fort (${k}) : ${e2}`);
}
// λ borné
simule3ITT(PARAMS_3ITT.A).forEach((q) => ok(q.lam >= 0 && q.lam <= 1, 'λ ∈ [0,1]'));

// Défi : types équilibrés, corrigés cohérents avec les valeurs affichées
const cpt = { rapide: 0, equilibree: 0, lente: 0 };
let pire = 0;
for (let i = 0; i < 3000; i++) {
  const f = tirerPeintureMystere();
  cpt[f.type]++;
  ok(f.t50 != null && f.t50 > 0, `t50 défini (${f.type})`);
  ok(f.verdict === f.type, `verdict ${f.verdict} ≠ type ${f.type} (t50 = ${f.t50})`);
  ok(f.m1 > 0 && f.m1 < 110, 'M1 plausible : ' + f.m1);
  ok(f.table.length === INSTANTS_DEFI.length && f.table.every((x, j) => j === 0 || x[1] >= f.table[j - 1][1] - 1), 'η croissante dans l’intervalle 3');
  pire = Math.max(pire, Math.abs(f.t50 - f.t50));
}
ok(Math.min(...Object.values(cpt)) > 800, 'types équilibrés : ' + JSON.stringify(cpt));
ok(verdictRegeneration(null) === 'lente' && verdictRegeneration(5) === 'rapide' && verdictRegeneration(30) === 'equilibree' && verdictRegeneration(31) === 'lente', 'seuils du verdict');
console.log(`OK : ${n} vérifications, types`, JSON.stringify(cpt));
