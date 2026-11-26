// ====================================================
//  MODÈLE « DOSAGE PAR ÉTALONNAGE CONDUCTIMÉTRIQUE : CONCEVOIR LE PROTOCOLE » (sim 258, TSTL SPCL) — 25 °C.
//  Réutilise SANS le modifier le modèle de la sim 136 (condEtalonnageModele.js : λ, cellules, σ, G, droite d'étalonnage par moindres carrés).
//  Ajouts propres à la version TSTL :
//   - préparation de la gamme d'étalons par dilution d'une solution mère : c = c0 × Vp / Vf (conservation de la quantité de matière) ;
//   - dilution de la solution à doser : c(S) = F × c(S′), avec F = Vf / Vp ; la solution diluée S′ doit être dans le domaine de validité (c ≤ 10 mmol/L)
//     ET dans la gamme des étalons (entre le plus petit et le plus grand) ;
//   - effet de la température (hypothèse annoncée : σ varie d'environ 2 % par °C, valeur usuelle pour une solution ionique ; la droite est étalonnée à 25 °C).
//  Hypothèses de travail (rappelées dans la simulation) : voir la sim 136 (λ arrondis, Kohlrausch valable pour c ≤ 10 mmol/L, facteur empirique d'interaction
//  hors programme et jamais affiché, conductimètre idéal à 3 chiffres significatifs, même cellule, même soluté et même température pour l'étalonnage et la mesure).
// ====================================================
import * as B from './condEtalonnageModele.js';

export const { C_DOMAINE, K_GUIDE, SOLUTES, ORDRE_SOLUTES, CELLULES, ORDRE_CELLULES, sommeLambda, kDe, aff3, gAffichee, pente, dansDomaine, penteTheorique, concentrationLue } = B;

export const SOL = 'nano3';                 // soluté du parcours guidé : nitrate de sodium (Na⁺ + NO₃⁻)
export const CELLULE_GUIDE = 'A';           // S = 2,0 cm², L = 1,6 cm → k = 80 m⁻¹
export const C_MERE = 100;                  // mmol/L : solution mère étalon S₀ du parcours (1,00×10⁻¹ mol/L)
export const V_FIOLE = 100;                 // mL : fiole jaugée des étalons du parcours
export const VP_GUIDE = [2, 4, 6, 8, 10];   // mL de solution mère prélevés pour les cinq étalons du parcours → 2, 4, 6, 8, 10 mmol/L
export const C_S = 236;                     // mmol/L : concentration réelle de la solution à doser S du parcours (2,36×10⁻¹ mol/L), inconnue de l'élève
export const C_S_INDIC = 0.2;               // mol/L : ordre de grandeur donné à l'élève (« de l'ordre de 0,2 mol/L »)
export const F_BON = 50;                    // facteur de dilution adapté (5,00 mL → 250,0 mL) : c(S′) = 4,72 mmol/L
export const OPTIONS_DILUTION = [          // les trois protocoles proposés à l'étape « choisir la dilution »
  { id: 'a', vp: 10.0, vf: 100.0, F: 10 },
  { id: 'b', vp: 5.00, vf: 250.0, F: 50 },
  { id: 'c', vp: 1.00, vf: 500.0, F: 500 },
];
export const T_ETALONNAGE = 25;             // °C
export const COEF_T = 0.02;                 // variation relative de σ par °C (hypothèse)

// ---------- dilution ----------
export const concEtalon = (vp, vf = V_FIOLE, c0 = C_MERE) => c0 * vp / vf;      // mmol/L
export const facteur = (vp, vf) => vf / vp;
export const cDilue = (cS, F) => cS / F;                                         // mmol/L
export const cInitiale = (cD, F) => cD * F;                                      // mmol/L
export const facteurT = T => 1 + COEF_T * (T - T_ETALONNAGE);
// position de la solution diluée par rapport à la gamme et au domaine de validité
export function situation(c, cMin, cMax) {
  if (c > C_DOMAINE + 1e-9) return 'hors-domaine';
  if (c > cMax + 1e-9) return 'au-dessus';
  if (c < cMin - 1e-9) return 'en-dessous';
  return 'dans';
}

// ---------- mesures ----------
// conductance affichée (3 chiffres significatifs) pour un soluté, une concentration (mmol/L), une cellule k (m⁻¹) et une température (°C)
export const gMesure = (id, c, k, T = T_ETALONNAGE) => B.aff3(B.conductance(id, c, k) * facteurT(T));
export const pointsGamme = (id, k, concs) => concs.map(c => ({ c, G: gMesure(id, c, k), hors: !B.dansDomaine(c) }));
export const droiteDe = pts => B.pente(pts);                                    // mS par mmol/L, ou null

// ---------- parcours guidé ----------
export const K = B.kDe(B.CELLULES[CELLULE_GUIDE]);
export const ETALONS = VP_GUIDE.map(vp => concEtalon(vp));
export const PTS = pointsGamme(SOL, K, ETALONS);
export const A_GUIDE = droiteDe(PTS);
export const C_DIL = cDilue(C_S, F_BON);                                        // 4,72 mmol/L
export const G_DIL = gMesure(SOL, C_DIL, K);                                    // conductance de S′
export const C_DIL_LUE = G_DIL / A_GUIDE;                                       // lue sur la droite (mmol/L)
export const C_S_LUE = cInitiale(C_DIL_LUE, F_BON);                             // mmol/L
export const G_SANS_DILUTION = gMesure(SOL, C_S, K);                            // S non diluée : hors domaine, loin de la droite
export const C_SANS_DILUTION_LUE = G_SANS_DILUTION / A_GUIDE;                   // lecture (extrapolation) : fausse
export const T_CHAUD = 30;
export const G_DIL_CHAUD = gMesure(SOL, C_DIL, K, T_CHAUD);
export const C_DIL_LUE_CHAUD = G_DIL_CHAUD / A_GUIDE;

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// défi 1 : choisir la dilution. Concentration de S connue approximativement (en mol/L) ; on propose les facteurs de dilution usuels ; gamme 2 à 10 mmol/L.
export const FACTEURS_DEFI = [2, 5, 10, 20, 25, 50, 100, 200, 250, 500];
export function tirageDefiDilution() {
  const cS = tire([0.15, 0.24, 0.30, 0.45, 0.60, 0.80, 1.2, 1.5]);               // mol/L (ordre de grandeur indiqué sur l'étiquette)
  const bons = FACTEURS_DEFI.filter(F => situation(cS * 1000 / F, 2, 10) === 'dans');
  return { cS, bons };
}
// défi 2 : dosage complet. Les étalons sont préparés par dilution d'une solution mère (c0, Vf, volumes Vp) ; on mesure G ; S est diluée F fois.
export const GAMMES_DEFI = [
  { c0: 100, vf: 100, vps: [2, 4, 6, 8, 10] },
  { c0: 50, vf: 100, vps: [4, 8, 12, 16, 20] },
  { c0: 100, vf: 200, vps: [4, 8, 12, 16, 20] },
];
export const FACT_DEFI = [10, 20, 25, 50];
export function tirageDefiDosage() {
  const id = tire(['nacl', 'nano3', 'ch3coona']), k = tire([50, 80, 100, 150]), g = tire(GAMMES_DEFI), F = tire(FACT_DEFI), cd = tire([3.5, 4.5, 5.5, 6.5, 7.5]);
  const concs = g.vps.map(vp => concEtalon(vp, g.vf, g.c0)), pts = pointsGamme(id, k, concs), a = droiteDe(pts);
  const Gd = gMesure(id, cd, k);
  return { id, k, ...g, F, cd, concs, pts, a, Gd, cdLue: Gd / a, cS: cd * F / 1000 };    // cS en mol/L
}
