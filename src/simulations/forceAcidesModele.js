// ====================================================
//  MODÈLE « FORCE DES ACIDES : Ka, Ke, pKa » (sim 129, niveau TG) — solutions aqueuses d'un acide AH de concentration apportée C, à 25 °C.
//  Réutilise acidesBasesModele.js (sim 85) SANS le modifier : pH « exact » par conservation de la charge (autoprotolyse comprise).
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C, Ke = 1,0·10⁻¹⁴ ; activités ≈ concentrations / c° (c° = 1 mol/L) : solutions diluées (C ≤ 0,10 mol/L) ;
//   - acide chlorhydrique : acide fort, transformation quasi-totale avec l'eau (HCl non détectable : [HCl] ≈ 0) ;
//   - les autres acides sont faibles : AH + H₂O ⇌ A⁻ + H₃O⁺, de constante Ka = [A⁻][H₃O⁺] / ([AH]·c°) à l'équilibre ;
//   - la formule du cours x² + Ka·x − Ka·C = 0 (x = [H₃O⁺]) néglige l'autoprotolyse de l'eau : valable tant que [HO⁻] ≪ [H₃O⁺] ;
//   - pKa : valeurs usuelles arrondies à 0,01 près ; pas de polyacide, pas de CO₂ dissous.
//  Unités : concentrations en mol/L ; Ka, Ke et τ sans unité.
// ====================================================
import { KE, pH as pHExact, concH, fractions } from './acidesBasesModele.js';

export { KE };

// ---------- les acides de la simulation ----------
export const ACIDES = {
  hcl:   { id: 'hcl',   fort: true,  nom: 'acide chlorhydrique', AH: 'HCl',      A: 'Cl⁻',      pKa: null },
  hcooh: { id: 'hcooh', fort: false, nom: 'acide méthanoïque',   AH: 'HCOOH',    A: 'HCOO⁻',    pKa: 3.75 },
  c6h5:  { id: 'c6h5',  fort: false, nom: 'acide benzoïque',     AH: 'C₆H₅COOH', A: 'C₆H₅COO⁻', pKa: 4.20 },
  ch3:   { id: 'ch3',   fort: false, nom: 'acide éthanoïque',    AH: 'CH₃COOH',  A: 'CH₃COO⁻',  pKa: 4.76 },
  nh4:   { id: 'nh4',   fort: false, nom: 'ion ammonium',        AH: 'NH₄⁺',     A: 'NH₃',      pKa: 9.20 },
};
export const ORDRE = ['hcl', 'hcooh', 'c6h5', 'ch3', 'nh4'];

export const kaDe = pKa => 10 ** -pKa;
export const pKaDe = Ka => -Math.log10(Ka);

// ---------- état final d'une solution de l'acide `ac` de concentration apportée C (mol/L) ----------
export function etat(ac, C) {
  if (ac.fort) {
    const pH = pHExact({ C: 0, pKas: [], ca: C }), h = concH(pH);
    return { pH, h, A: C, AH: 0, HO: KE / h, tau: 1, Ka: null, pKa: null, C };
  }
  const pH = pHExact({ C, pKas: [ac.pKa] }), h = concH(pH), f = fractions(h, [ac.pKa]);
  return { pH, h, A: C * f[1], AH: C * f[0], HO: KE / h, tau: f[1], Ka: kaDe(ac.pKa), pKa: ac.pKa, C };
}

// ---------- formules du cours ----------
export const pHFort = C => -Math.log10(C);                                   // acide fort : pH = −log C
export const hDepuisPH = pH => 10 ** -pH;                                    // [H₃O⁺] = 10^(−pH) (c° = 1 mol/L)
export const tauDepuisPH = (C, pH) => hDepuisPH(pH) / C;                     // τ = x_f / x_max = [H₃O⁺] / C
export const kaDepuisPH = (C, pH) => { const h = hDepuisPH(pH); return h * h / (C - h); };   // Ka = [H₃O⁺]² / (C − [H₃O⁺])
export const hQuadratique = (C, Ka) => (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2;        // racine positive de x² + Ka·x − Ka·C = 0
export const hApprox = (C, Ka) => Math.sqrt(Ka * C);                         // approximation x ≪ C (non utilisée comme réponse attendue)
export const hoDepuisPH = pH => KE / hDepuisPH(pH);                          // [HO⁻] = Ke / [H₃O⁺]
export const arrondiPH = pH => Math.round(pH * 100) / 100;                   // un pH-mètre affiche 2 décimales

// Nombre de « molécules d'acide » transformées sur 100 introduites (représentation du schéma), arrondi à l'unité
export const nbTransformees = tau => Math.round(100 * tau);

// ---------- défi « acide inconnu » : fort, ou faible de pKa tiré ----------
export const CONC_DEFI = [0.010, 0.020, 0.050, 0.10];
export const PKA_DEFI = [4.4, 4.6, 4.8, 5.0];
// Un pH-mètre donne 2 décimales : toutes les réponses attendues sont calculées à partir du pH AFFICHÉ
export function mesureDefi(fort, C, pKa) {
  const pH = arrondiPH(fort ? pHFort(C) : etat({ fort: false, pKa }, C).pH);
  return { fort, C, pKa, pH, ka: fort ? null : kaDepuisPH(C, pH) };
}
