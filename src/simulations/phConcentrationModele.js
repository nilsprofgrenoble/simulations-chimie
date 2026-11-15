// ====================================================
//  MODÈLE « pH ET CONCENTRATION EN IONS OXONIUM » (sim 121, niveau TG) — solutions d'acide chlorhydrique à 25 °C
//  Relation du programme : pH = −log([H₃O⁺] / c°), avec c° = 1 mol·L⁻¹ ; réciproque [H₃O⁺] = c° × 10^(−pH).
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités assimilées aux concentrations (solutions diluées, C ≤ 0,1 mol/L) ;
//   - HCl est un acide fort : la réaction avec l'eau est totale, donc [H₃O⁺] = C (concentration apportée) dans le modèle du cours ;
//   - le « pH-mètre » de la simulation donne le pH CALCULÉ en tenant compte de l'autoprotolyse de l'eau (acidesBasesModele.js, inchangé) :
//     la relation du cours pH = −log C n'en tient pas compte, d'où un écart qui n'est négligeable que pour C ≳ 10⁻⁶ mol/L ;
//   - dilutions parfaites (pipette jaugée, fiole jaugée, volumes additifs), pH-mètre idéal (étalonné, sans dérive), pas de CO₂ dissous.
//  Le modèle de la simulation 85 (acidesBasesModele.js) est réutilisé SANS modification.
// ====================================================
import * as A from './acidesBasesModele.js';

export { KE } from './acidesBasesModele.js';

export const C_STD = 1;                 // c° = 1 mol·L⁻¹
export const FACTEUR = 10;              // facteur de dilution de la série (programme : dilutions successives d'un facteur 10)
export const K_MAX = 8;                 // nombre maximal de dilutions successives proposé

// ---------- relation du programme et sa réciproque ----------
export const pHDeConc = h => -Math.log10(h / C_STD);
export const concDePH = ph => C_STD * 10 ** (-ph);

// ---------- pH « mesuré » : calcul complet (conservation de la charge, autoprotolyse de l'eau comprise), puis lecture au centième ----------
export const pHExact = C => A.pH({ ca: C });
export const arrondi = (x, d) => Number(x.toFixed(d));
export const pHMesure = C => arrondi(pHExact(C), 2);

// ---------- dilutions successives ----------
export const concApres = (C0, k, F = FACTEUR) => C0 / F ** k;
// Effet d'une dilution d'un facteur F sur le pH : pH_final = pH_initial + log F
export const pHApresDilution = (pH0, F) => pH0 + Math.log10(F);

// Série S0 … Sk : concentrations, pH donné par la relation, pH « lu » et écart
export function serie(C0, k, F = FACTEUR) {
  const lignes = [];
  for (let i = 0; i <= k; i++) {
    const C = concApres(C0, i, F), calc = pHDeConc(C), mes = pHMesure(C);
    lignes.push({ k: i, C, moinsLog: calc, pHCalc: calc, pHMes: mes, ecart: mes - calc });
  }
  return lignes;
}

// Domaine de validité de pH = −log C pour un acide fort : écart entre le pH « complet » et la relation inférieur à une tolérance
export const ecartRelation = C => pHExact(C) - pHDeConc(C);
export const relationValable = (C, tol = 0.01) => Math.abs(ecartRelation(C)) < tol;

// Une solution d'acide a un pH inférieur à 7 (25 °C) : la relation donnerait un pH > 7 pour C < 10⁻⁷ mol/L, ce qui est impossible
export const pHImpossible = C => pHDeConc(C) > 7;
