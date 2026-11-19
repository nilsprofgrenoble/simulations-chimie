// ====================================================
//  MODÈLE « DOSAGE CONDUCTIMÉTRIQUE PAR ÉTALONNAGE : CONDUCTANCE, CONSTANTE DE CELLULE ET COURBE D'ÉTALONNAGE » (sim 136, niveau TG) — 25 °C.
//  Grandeurs : conductance G (en S ou mS), mesurée par le conductimètre ; conductivité σ (en S·m⁻¹ ou mS·m⁻¹), propre à la solution ;
//  constante de cellule k = L / S (en m⁻¹) : L = distance entre les plaques, S = surface d'une plaque. G = σ / k, donc σ = k × G.
//  Loi de Kohlrausch : σ = Σ λi × ci (λi en mS·m²·mol⁻¹, ci en mol·m⁻³ ; 1 mmol/L = 1 mol·m⁻³ ; σ en mS·m⁻¹).
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; les λi sont ceux de la simulation sur la conductimétrie (valeurs arrondies au dixième, constantes) ;
//   - solutions diluées : σ = Σ λ c est valable pour c < 10 mol·m⁻³ (1,0×10⁻² mol/L). Au-delà, les interactions entre ions font baisser σ ;
//     le modèle les représente par un facteur empirique (1 − 0,002 c), c en mmol/L : écart de 2 % à 10 mmol/L, de 10 % à 50 mmol/L, de 20 % à 100 mmol/L
//     (ordre de grandeur de NaCl en solution aqueuse ; loi empirique hors programme, jamais affichée) ;
//   - conductimètre idéal : il affiche G avec 3 chiffres significatifs, sans bruit de mesure ni dérive ;
//   - la même cellule, le même soluté et la même température pour l'étalonnage et la mesure ;
//   - la droite d'étalonnage G = a × c passe par l'origine (une solution sans soluté ne conduit pas) ; elle est calculée avec les points dont c ≤ 10 mmol/L
//     par la méthode des moindres carrés (somme des c × G divisée par la somme des c²).
// ====================================================
import { IONS } from './conductimetrieModele.js';

export const COEF_INTER = 0.002;          // par mmol/L
export const C_DOMAINE = 10;              // mmol/L : limite de validité annoncée pour σ = Σ λ c
export const K_GUIDE = 80;                // constante de la cellule du parcours guidé (m⁻¹)
export const C_INCONNUE = 5.0;            // concentration (mmol/L) de la solution diluée S′ du parcours guidé
export const FACTEUR_DILUTION = 20;       // S′ est obtenue en diluant S 20 fois (10,0 mL → 200,0 mL)
export const STD = [2, 4, 6, 8, 10];      // concentrations des étalons du parcours (mmol/L)
export const STD_ETENDUS = [20, 50, 100]; // étalons plus concentrés, hors domaine (mmol/L)
export const C_MENU = [1, 2, 4, 6, 8, 10, 20, 50, 100];   // concentrations proposées en exploration (mmol/L)

// ---------- solutés ----------
export const SOLUTES = {
  nacl:     { id: 'nacl',     nom: 'chlorure de sodium',   f: 'NaCl',     cat: 'Na',  an: 'Cl',  eq: 'NaCl → Na⁺ + Cl⁻' },
  nano3:    { id: 'nano3',    nom: 'nitrate de sodium',    f: 'NaNO₃',    cat: 'Na',  an: 'NO3', eq: 'NaNO₃ → Na⁺ + NO₃⁻' },
  ch3coona: { id: 'ch3coona', nom: 'éthanoate de sodium',  f: 'CH₃COONa', cat: 'Na',  an: 'AcO', eq: 'CH₃COONa → Na⁺ + CH₃COO⁻' },
  hcl:      { id: 'hcl',      nom: 'acide chlorhydrique',  f: 'HCl',      cat: 'H3O', an: 'Cl',  eq: 'HCl + H₂O → H₃O⁺ + Cl⁻' },
};
export const ORDRE_SOLUTES = ['nacl', 'nano3', 'ch3coona', 'hcl'];
export const sommeLambda = id => IONS[SOLUTES[id].cat].lambda + IONS[SOLUTES[id].an].lambda;   // mS·m²·mol⁻¹

// ---------- cellules : plaques de surface S (cm²) distantes de L (cm) ----------
export const CELLULES = {
  A: { id: 'A', nom: 'cellule A', S: 2.0, L: 1.6 },
  B: { id: 'B', nom: 'cellule B', S: 1.0, L: 1.0 },
  C: { id: 'C', nom: 'cellule C', S: 1.0, L: 1.5 },
  D: { id: 'D', nom: 'cellule D', S: 2.0, L: 1.0 },
};
export const ORDRE_CELLULES = ['A', 'B', 'C', 'D'];
export const kDe = cell => Math.round(10000 * cell.L / cell.S) / 100;      // L en cm, S en cm² → k en m⁻¹ (1 cm⁻¹ = 100 m⁻¹)

// ---------- solution étalon de chlorure de potassium (valeurs usuelles à 25 °C, conductivité écrite sur le flacon) ----------
export const ETALONS_KCL = [
  { c: 1.00, cTxt: '1,00×10⁻³', sigma: 14.7 },
  { c: 10.0, cTxt: '1,00×10⁻²', sigma: 141 },
  { c: 100, cTxt: '1,00×10⁻¹', sigma: 1285 },
];
export const ETALON_GUIDE = ETALONS_KCL[1];

// ---------- conductivité, conductance, affichage ----------
export const facteurInter = c => 1 - COEF_INTER * c;                         // c en mmol/L
export const sigmaIdeale = (id, c) => sommeLambda(id) * c;                     // mS·m⁻¹ (loi de Kohlrausch)
export const sigmaSolution = (id, c) => sigmaIdeale(id, c) * facteurInter(c);  // mS·m⁻¹ (avec les interactions entre ions)
export const conductance = (id, c, k) => sigmaSolution(id, c) / k;           // mS (σ en mS·m⁻¹, k en m⁻¹)
export const aff3 = x => Number(Number(x).toPrecision(3));                    // le conductimètre affiche 3 chiffres significatifs
export const gAffichee = (id, c, k) => aff3(conductance(id, c, k));
export const gEtalon = (et, k) => aff3(et.sigma / k);                         // conductance affichée pour la solution étalon

// ---------- droite d'étalonnage G = a × c (moindres carrés, passe par l'origine, points dans le domaine de validité) ----------
export const dansDomaine = c => c <= C_DOMAINE + 1e-9;
export function pente(points) {
  const p = points.filter(q => dansDomaine(q.c));
  const den = p.reduce((s, q) => s + q.c * q.c, 0);
  return den > 0 ? p.reduce((s, q) => s + q.c * q.G, 0) / den : null;       // mS par mmol/L
}
export const concentrationLue = (G, a) => G / a;                              // mmol/L
export const penteTheorique = (id, k) => sommeLambda(id) / k;                 // mS par mmol/L : Σλ / k (σ = Σλ c, G = σ / k), sans interactions

// ---------- points de la courbe d'étalonnage du parcours ----------
export const pointsEtalonnage = (id, k, concs) => concs.map(c => ({ c, G: gAffichee(id, c, k), hors: !dansDomaine(c) }));

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
export const K_DEFI = [50, 60, 70, 80, 90, 100, 120, 150];                    // constantes de cellule tirées (m⁻¹) : valeurs rondes à 2 chiffres significatifs
// défi 1 : cellule étalonnée avec une solution de KCl, puis conductance d'une solution d'un sel ; on demande la concentration (mmol/L) avec la loi de Kohlrausch
export function tirageDefiCellule() {
  const k = tire(K_DEFI), et = tire(ETALONS_KCL), id = tire(['nacl', 'nano3', 'ch3coona']), c = tire([2, 3, 4, 5, 6, 7, 8]);
  const Get = gEtalon(et, k), GX = gAffichee(id, c, k);
  const kc = et.sigma / Get, sig = kc * GX, cCalc = sig / sommeLambda(id);
  return { k, et, id, c, Get, GX, kc, sig, cCalc };
}
// défi 2 : cinq étalons, conductance de la solution diluée, facteur de dilution ; on demande la concentration de la solution initiale (mol/L)
export const FACT_DEFI = [5, 10, 20, 25, 40, 50];
export function tirageDefiDosage() {
  const id = tire(['nacl', 'nano3', 'ch3coona']), k = tire([50, 80, 100, 150]), cd = tire([2.5, 3.5, 4.5, 5.5, 6.5, 7.5]), F = tire(FACT_DEFI);
  const pts = pointsEtalonnage(id, k, STD), Gd = gAffichee(id, cd, k), a = pente(pts);
  return { id, k, cd, F, pts, Gd, a, cdLue: Gd / a, cS: F * cd / 1000 };       // cS en mol/L
}

// ---------- dessin : ions (rayons symboliques non à l'échelle, signe dessiné dans le point) et nombre de points de la scène (qualitatif) ----------
export const IONS_DESSIN = {
  Na:  { f: 'Na⁺',  c: '#0369a1', s: 1,  r: 5.6 },
  K:   { f: 'K⁺',   c: '#0e7490', s: 1,  r: 6.6 },
  H3O: { f: 'H₃O⁺', c: '#b91c1c', s: 1,  r: 7.8 },
  Cl:  { f: 'Cl⁻',  c: '#15803d', s: -1, r: 8.6 },
  NO3: { f: 'NO₃⁻', c: '#15803d', s: -1, r: 8.6 },
  AcO: { f: 'CH₃COO⁻', c: '#15803d', s: -1, r: 8.6 },
};
export const nbPointsDe = c => Math.max(1, Math.min(22, Math.round(2.2 * Math.sqrt(c))));
