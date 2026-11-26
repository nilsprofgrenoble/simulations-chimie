// ====================================================
//  MODÈLE « CONSTANTE D'ÉQUILIBRE D'UN ACIDE FAIBLE PAR CONDUCTIMÉTRIE » (sim 256, niveau TSTL SPCL, chapitre « Conductivité et titrages conductimétriques »).
//  Un acide faible HA mis dans l'eau : HA + H₂O ⇌ A⁻ + H₃O⁺. La conductivité σ ne vient que de H₃O⁺ et A⁻ :
//    σ = (λ(H₃O⁺) + λ(A⁻)) × [H₃O⁺], avec [A⁻] = [H₃O⁺] = x (HO⁻ négligé), σ en mS·m⁻¹, λ en mS·m²·mol⁻¹, x en mol·m⁻³ (1 mol/L = 1000 mol·m⁻³).
//  Tableau d'avancement (en concentrations) : HA : c − x ; A⁻ : x ; H₃O⁺ : x. K = x² / (c − x) (c'est la constante d'acidité Ka du couple HA/A⁻).
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités ≈ concentrations ; HO⁻ négligé (la solution est acide : [HO⁻] < 10⁻¹⁰ mol/L) ;
//   - λ constants (valeurs à dilution infinie arrondies au centième ou au dixième, données du problème), valables pour une solution diluée (ions à moins de 10 mol·m⁻³) ;
//   - la « valeur tabulée » est Ka = 10^(−pKa) ; la mesure simulée est σ du modèle, avec un petit bruit optionnel (± 1 %) qui joue le rôle de l'incertitude de mesure.
//  Valeurs de données vérifiées : pKa(HCOOH) = 3,75 et pKa(C₂H₅COOH) = 4,87 (25 °C) ; λ(HCOO⁻) = 5,46 et λ(C₂H₅COO⁻) = 3,58 mS·m²·mol⁻¹ ;
//  λ(H₃O⁺) = 35,0 (valeur arrondie, comme la sim 135 TG ; la valeur à dilution infinie est 34,98).
// ====================================================
export const LAMBDA_H = 35.0;
export const ACIDES = {
  HCOOH:    { id: 'HCOOH',    nom: 'acide méthanoïque', f: 'HCOOH',    base: 'HCOO⁻',    lambdaA: 5.46, pKa: 3.75 },
  C2H5COOH: { id: 'C2H5COOH', nom: 'acide propanoïque', f: 'C₂H₅COOH', base: 'C₂H₅COO⁻', lambdaA: 3.58, pKa: 4.87 },
};
export const C_LISTE = [0.0030, 0.0060, 0.012, 0.025, 0.040];     // concentrations apportées (mol/L)
export const N_ENTITES = 60;                                        // nombre de molécules d'acide dessinées dans le bécher

export const Ka = a => 10 ** -ACIDES[a].pKa;
export const lambdaSomme = a => LAMBDA_H + ACIDES[a].lambdaA;

// équilibre exact : x = [H₃O⁺] (mol/L) solution de x² / (c − x) = K
export function equilibre(a, c) {
  const K = Ka(a), x = (-K + Math.sqrt(K * K + 4 * K * c)) / 2;
  return { K, x, HA: c - x, tau: x / c };
}
// conductivité (mS·m⁻¹)
export const sigma = (a, c) => lambdaSomme(a) * equilibre(a, c).x * 1000;
// de σ à [H₃O⁺] (mol/L)
export const xDepuisSigma = (a, s) => s / lambdaSomme(a) / 1000;
// constante calculée à partir de c et de x (mol/L)
export const Kcalcule = (c, x) => (c - x > 0 ? x * x / (c - x) : NaN);
export const arrondiCS = (x, n = 3) => Number(Number(x).toPrecision(n));

// bruit déterministe pour que la mesure soit reproductible à graine égale
const alea = graine => { let g = graine; return () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; }; };
export const BRUIT = 0.01;                                          // ± 1 % de σ
export function bruit(graine) { const r = alea(graine); r(); return 2 * r() - 1; }   // dans [−1 ; 1]
// σ mesurée, affichée à 3 chiffres significatifs ; graine = 0 : mesure sans bruit
export function sigmaMesuree(a, c, graine = 0) { return arrondiCS(sigma(a, c) * (1 + (graine ? BRUIT * bruit(graine) : 0)), 3); }

// nombre de paires d'ions dessinées pour N_ENTITES molécules d'acide introduites
export const nbPaires = (a, c) => Math.round(equilibre(a, c).tau * N_ENTITES);

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// défi 1 : K à partir de σ mesurée ; défi 2 : taux d'avancement final. σ affichée à 3 chiffres significatifs : la valeur attendue est calculée avec cette valeur affichée.
export function tirageDefi() {
  const acide = tire(Object.keys(ACIDES)), c = tire(C_LISTE), graine = 1 + Math.floor(Math.random() * 1e6);
  const sig = sigmaMesuree(acide, c, graine), x = xDepuisSigma(acide, sig);
  return { acide, c, graine, sigma: sig, x, K: Kcalcule(c, x), tau: x / c, Ktab: Ka(acide) };
}
