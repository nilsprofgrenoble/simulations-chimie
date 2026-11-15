// Tests du modèle « équilibre chimique » (sim 124) : node src/simulations/equilibreModele.test.mjs
import * as M from './equilibreModele.js';
let ko = 0;
const proche = (nom, x, ref, tol) => { const ok = Math.abs(x - ref) <= tol; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref} (± ${tol})`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const ac = M.SYSTEMES.ac, oh = M.SYSTEMES.oh;

// K arrondis cohérents avec les pKa : 10^(3,75 − 4,76) = 0,0977 ; 10^(14 − 4,76) = 1,738e9
proche('K(ac) arrondi vs pKa (écart relatif)', Math.abs(ac.K - 10 ** ac.logK) / ac.K, 0, 0.03);
proche('K(oh) arrondi vs pKa (écart relatif)', Math.abs(oh.K - 10 ** oh.logK) / oh.K, 0, 0.03);

// calcul fait à part : a = b = 0,10, c = d = 0 : x/(0,10 − x) = √0,10 = 0,316228 → x = 0,0316228/1,316228 = 0,0240253 ; τ = 0,240253
const S1 = { a: 0.10, b: 0.10, c: 0, d: 0 };
proche('xf (mélange 1)', M.avancementFinal(ac, S1), 0.0240253, 1e-6);
proche('τ (mélange 1)', M.tauFinal(ac, S1), 0.240253, 1e-5);
const F1 = M.etatFinal(ac, S1);
proche('[A] final (mélange 1)', F1.a, 0.0759747, 1e-6);
proche('Qr final = K (mélange 1)', M.qr(ac, F1), 0.10, 1e-9);

// mélange 2 de l'étape « Qr » : a = 0,20 ; b = 0,10 ; c = 0,10 ; d = 0,050 → Qr = 0,005/0,02 = 0,25 > K : sens inverse
// équation 0,9x² + 0,18x + 0,003 = 0 : x = (−0,18 + √(0,0324 − 0,0108)) / 1,8 = (−0,18 + 0,146969)/1,8 = −0,018351
const S2 = { a: 0.20, b: 0.10, c: 0.10, d: 0.050 };
proche('Qr initial (mélange 2)', M.qr(ac, S2), 0.25, 1e-12);
vrai('sens (mélange 2) = inverse', M.sens(ac, S2) === 'inverse');
proche('xf (mélange 2)', M.avancementFinal(ac, S2), -0.018351, 1e-5);
const F2 = M.etatFinal(ac, S2);
proche('[A] final (mélange 2)', F2.a, 0.218351, 1e-5);
proche('[C] final (mélange 2)', F2.c, 0.081649, 1e-5);
proche('Qr final = K (mélange 2)', M.qr(ac, F2), 0.10, 1e-9);

// indépendance de Qr final : plusieurs compositions initiales, même Qr final
for (const [a, b, c, d] of [[0.10, 0.10, 0, 0], [0.30, 0.10, 0, 0], [0.05, 0.05, 0.10, 0.10], [0.4, 0.02, 0.2, 0.1], [0, 0, 0.2, 0.2]]) {
  const Q = M.qr(ac, M.etatFinal(ac, { a, b, c, d }));
  proche(`Qr final pour (${a}, ${b}, ${c}, ${d})`, Q, 0.10, 1e-9);
}
// sens : Qr < K direct, Qr > K inverse, égal : équilibre
vrai('sens direct si pas de produit', M.sens(ac, { a: 0.1, b: 0.1, c: 0, d: 0 }) === 'direct');
vrai('sens inverse si pas de réactif', M.sens(ac, { a: 0, b: 0, c: 0.1, d: 0.1 }) === 'inverse');
vrai('équilibre (0,20 ; 0,10 ; 0,05 ; 0,04)', M.sens(ac, { a: 0.2, b: 0.1, c: 0.05, d: 0.04 }) === 'equilibre');

// système totale : a = b = 0,10 : Qr = c/(a·b) = K → y² = c/K avec c ≈ 0,10 : y = √(0,10/1,7e9) = 7,7e-6 mol/L ; τ = 0,99992
const T1 = { a: 0.10, b: 0.10, c: 0 };
const Ft = M.etatFinal(oh, T1);
proche('[A] final (totale)', Ft.a, 7.67e-6, 1e-7);
proche('τ (totale)', M.tauFinal(oh, T1), 0.999923, 1e-6);
vrai('totale', M.estTotale(M.tauFinal(oh, T1)));
vrai('non totale pour le mélange 1', !M.estTotale(M.tauFinal(ac, S1)));
proche('Qr final = K (totale)', M.qr(oh, Ft) / 1.7e9, 1, 1e-6);

console.log(ko ? `${ko} échec(s)` : 'Tous les tests passent.');
process.exit(ko ? 1 : 0);
