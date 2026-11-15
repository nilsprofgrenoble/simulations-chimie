// Tests du modèle « radioactivité : décroissance, demi-vie, activité, datation » (sim 123) : node src/simulations/radioactiviteModele.test.mjs
import * as M from './radioactiviteModele.js';

let ko = 0;
const proche = (nom, x, ref, tol) => { const ok = Math.abs(x - ref) <= tol; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref} (± ${tol})`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };

const P = M.params(M.N0_DEFAUT, M.TH_DEFAUT);   // 4,0e7 noyaux, t½ = 8,0 j

// ---- calculs faits à part : λ = ln 2 / 8,0 = 0,0866434 j⁻¹ = 1,002820e-6 s⁻¹ ; A0 = λ·N0 = 40,1128 Bq
proche('λ (j⁻¹)', M.lambda(P), 0.0866434, 1e-6);
proche('λ (s⁻¹)', M.lambdaS(P), 1.002820e-6, 1e-11);
proche('A0 = λ·N0 (Bq)', M.activite(P, 0), 40.1128, 1e-3);
proche('N(t½) = N0/2', M.N(P, 8), 2.0e7, 1e-3);
proche('N(16 j) = N0/4', M.N(P, 16), 1.0e7, 1e-3);
proche('N(24 j) = N0/8', M.N(P, 24), 5.0e6, 1e-3);
// N(20 j) = 4e7 × 2^(−2,5) = 4e7 × 0,1767767 = 7,07107e6
proche('N(20 j)', M.N(P, 20), 7.071068e6, 1);
proche('A(16 j) = A0/4', M.activite(P, 16), 10.0282, 1e-3);
proche('A(24 j) = A0/8', M.activite(P, 24), 5.01410, 1e-3);
// toutes les demi-vies durent t½ (propriété de l'exponentielle)
for (const n of [1, 2, 3, 4]) proche(`durée de la demi-vie n°${n}`, M.dureeNiveau(P, n), 8.0, 1e-9);
proche('instant où N = N0/8', M.tempsPour(P, M.N0_DEFAUT / 8), 24.0, 1e-9);
// la tangente en t a pour pente −A : v de la 122 = activité (unité de temps : jour)
const tg = M.tangente(P, 8);
proche('−dN/dt à 8 j (noyaux par jour) = λ·N', tg.v, 0.0866434 * 2.0e7, 1);
proche('A en Bq = (−dN/dt) / 86 400', tg.v / M.JOUR_S, M.activite(P, 8), 1e-9);

// ---- datation : t½ du carbone 14 = 5730 ans ; fraction 25 % → 2 t½ ; 12,5 % → 3 t½ ; 60 % → 5730 × ln(1/0,6)/ln 2 = 4222,5
proche('âge pour 50 %', M.ageDepuisFraction(5730, 0.5), 5730, 1e-6);
proche('âge pour 25 %', M.ageDepuisFraction(5730, 0.25), 11460, 1e-6);
proche('âge pour 12,5 %', M.ageDepuisFraction(5730, 0.125), 17190, 1e-6);
// ln(1/0,6) = 0,5108256 ; ÷ ln 2 = 0,7369656 ; × 5730 = 4222,81
proche('âge pour 60 %', M.ageDepuisFraction(5730, 0.60), 4222.81, 0.05);
proche('fraction à 4 000 ans', M.fractionDepuisAge(5730, 4000), Math.pow(2, -4000 / 5730), 1e-12);
proche('aller-retour âge ↔ fraction', M.ageDepuisFraction(5730, M.fractionDepuisAge(5730, 3210)), 3210, 1e-6);

// ---- hasard : moyenne et dispersion du nombre de noyaux restants à t = t½ (calculs : moyenne = n/2, écart-type = √(n/4))
for (const [n, essais] of [[100, 2000], [10000, 400]]) {
  const v = Array.from({ length: essais }, (_, i) => M.restantsApres(n, 8, 8, 1000 + i));
  const m = v.reduce((s, x) => s + x, 0) / essais, s = Math.sqrt(v.reduce((q, x) => q + (x - m) ** 2, 0) / (essais - 1));
  proche(`N=${n} : moyenne des restants`, m, n / 2, 4 * Math.sqrt(n / 4) / Math.sqrt(essais) + 0.5);
  proche(`N=${n} : écart-type des restants`, s, Math.sqrt(n / 4), 0.07 * Math.sqrt(n / 4));
  proche(`N=${n} : écart-type théorique`, M.ecartTypeRestants(n, 8, 8), Math.sqrt(n / 4), 1e-9);
}
// variante par instants individuels : même loi
{ const inst = M.instantsDeces(100000, 8, 5), moitie = M.restantsA(inst, 8) / 1e5;
  proche('100 000 noyaux : fraction restante à t½', moitie, 0.5, 0.006);
  proche('100 000 noyaux : fraction restante à 2 t½', M.restantsA(inst, 16) / 1e5, 0.25, 0.006); }

// ---- comptage (Poisson) : moyenne et écart-type du nombre compté, pour une moyenne faible (Knuth) et élevée (normale)
for (const moy of [4, 25, 400]) {
  const r = M.prng(77 + moy), v = Array.from({ length: 20000 }, () => M.poisson(moy, r));
  const m = v.reduce((s, x) => s + x, 0) / v.length, s = Math.sqrt(v.reduce((q, x) => q + (x - m) ** 2, 0) / (v.length - 1));
  proche(`Poisson ${moy} : moyenne`, m, moy, 0.03 * Math.sqrt(moy) + 0.02);
  proche(`Poisson ${moy} : écart-type`, s, Math.sqrt(moy), 0.04 * Math.sqrt(moy));
}
proche('incertitude relative 1/√n (n = 400)', M.incertitudeRelative(400), 0.05, 1e-12);
proche('incertitude sur A (n = 400, Δt = 10 s)', M.incertitudeActivite(400, 10), 2.0, 1e-12);

// ---- série d'activité et ajustement : on retrouve t½ avec quelques % d'écart (t½ = 8,0 j, Δt = 10 s : 400 désintégrations à t = 0)
{ const pts = M.serieActivite(P, 10, 3, 2, 40), aj = M.ajustementLnActivite(pts);
  vrai('série : 21 points', pts.length === 21);
  proche('série : A exacte à t = 0 (Bq)', pts[0].a, 40.1128, 1e-3);
  proche('ajustement : t½ retrouvée (j)', aj.th, 8.0, 0.8); }
// sur beaucoup de graines : l'ajustement reste dans ± 15 % de t½ (comptage de 10 s : pire cas observé ≈ 13 %)
{ let pire = 0; for (let g = 1; g <= 500; g++) { const aj = M.ajustementLnActivite(M.serieActivite(P, 10, g, 2, 40)); pire = Math.max(pire, Math.abs(aj.th / 8 - 1)); }
  proche('500 séries : plus grand écart relatif sur t½ (ajustement)', pire, 0.0, 0.15); }

console.log(ko ? `\n${ko} test(s) en échec` : '\nTous les tests passent');
process.exit(ko ? 1 : 0);
