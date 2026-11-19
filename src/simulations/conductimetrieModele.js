// ====================================================
//  MODÈLE « CONDUCTIMÉTRIE : CONDUCTIVITÉ D'UNE SOLUTION ET TITRAGE CONDUCTIMÉTRIQUE » (sim 135, niveau TG) — 25 °C, cellule étalonnée.
//  Loi de Kohlrausch : σ = Σ λi × [Xi], avec λi en mS·m²·mol⁻¹, [Xi] en mol·m⁻³ (1 mol/L = 1000 mol·m⁻³ ; 1 mmol/L = 1 mol·m⁻³) et σ en mS·m⁻¹.
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités ≈ concentrations ; solutions diluées (c < 10 mol·m⁻³, soit 1,0×10⁻² mol/L) : domaine de validité de la loi de Kohlrausch ;
//   - les λi sont constants (valeurs à dilution infinie arrondies au dixième, données du problème) ;
//   - volumes additifs : le volume total vaut Vinit + V_B ; la dilution est prise en compte ;
//   - titrage d'un acide par la soude (c_B = 0,100 mol/L) ; réaction support H₃O⁺ + HO⁻ → 2 H₂O (acide fort) ou CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O (acide faible) ;
//   - la composition de la solution est calculée exactement (conservation de la charge, pKA de l'acide éthanoïque = 4,8, Ke = 10⁻¹⁴) : H₃O⁺ et HO⁻ sont comptés, ce qui arrondit un peu la courbe au voisinage de l'équivalence ;
//   - dans le parcours, la transformation de titrage est considérée comme totale (programme), ce qui donne les quantités de matière des exercices ;
//   - conductimètre idéal : il affiche directement σ ; pas de bruit de mesure.
// ====================================================
export const KE = 1e-14;
export const CB = 0.100;       // concentration de la soude (mol/L)
export const VA0 = 20.0;       // prise d'essai d'acide (mL)
export const V_INIT = 200;     // volume de la solution avant le premier ajout de soude (prise d'essai + eau), en mL
export const V_BURETTE = 20;   // volume maximal versé (mL)

// ions : λ en mS·m²·mol⁻¹ (valeurs à 25 °C arrondies au dixième : données)
export const IONS = {
  H3O: { id: 'H3O', f: 'H₃O⁺', lambda: 35.0, couleur: '#dc2626', z: 1 },
  HO:  { id: 'HO',  f: 'HO⁻',  lambda: 19.9, couleur: '#7c3aed', z: -1 },
  Na:  { id: 'Na',  f: 'Na⁺',  lambda: 5.0,  couleur: '#0369a1', z: 1 },
  Cl:  { id: 'Cl',  f: 'Cl⁻',  lambda: 7.6,  couleur: '#15803d', z: -1 },
  NO3: { id: 'NO3', f: 'NO₃⁻', lambda: 7.1,  couleur: '#15803d', z: -1 },
  AcO: { id: 'AcO', f: 'CH₃COO⁻', lambda: 4.1, couleur: '#15803d', z: -1 },
};
export const ANALYTES = {
  hcl:  { id: 'hcl',  nom: 'acide chlorhydrique', formule: 'HCl',     anion: 'Cl',  fort: true },
  hno3: { id: 'hno3', nom: 'acide nitrique',      formule: 'HNO₃',    anion: 'NO3', fort: true },
  eth:  { id: 'eth',  nom: 'acide éthanoïque',    formule: 'CH₃COOH', anion: 'AcO', fort: false, pKa: 4.8 },
};
export const ORDRE_ANALYTES = ['hcl', 'hno3', 'eth'];
export const CONC_A = [0.020, 0.030, 0.040, 0.050, 0.060];      // concentrations d'acide proposées (mol/L)
export const EAU = [0, 80, 180, 480];                           // eau ajoutée avant le titrage (mL) : V_INIT = VA0 + eau

// ---------- conductivité d'un jeu d'ions (concentrations en mol/m³ = mmol/L) ----------
export const kohlrausch = c => Object.entries(c).reduce((s, [k, v]) => s + (IONS[k] ? IONS[k].lambda * v : 0), 0);   // mS/m
// conductivité d'un sel ou d'un acide fort totalement dissocié, de concentration c (mol/L) : cation + anion
export const sigmaSel = (cation, anion, c) => (IONS[cation].lambda + IONS[anion].lambda) * c * 1000;

// ---------- composition exacte de la solution après ajout de V_B mL de soude ----------
// Conservation de la charge : [H₃O⁺] + [Na⁺] = [HO⁻] + [A⁻], avec [A⁻] = C α (α = 1 pour un acide fort, KA / (KA + [H₃O⁺]) pour l'acide éthanoïque).
export function composition({ analyte = 'hcl', cA, VA = VA0, VB, cB = CB, Vinit = V_INIT }) {
  const an = ANALYTES[analyte], Vt = Vinit + VB;
  const Ctot = cA * VA / Vt, Na = cB * VB / Vt;
  const Ka = an.fort ? 0 : 10 ** -an.pKa, alpha = h => (an.fort ? 1 : Ka / (Ka + h));
  const f = pH => { const h = 10 ** -pH; return h + Na - KE / h - Ctot * alpha(h); };    // décroît quand le pH croît
  let lo = 0, hi = 14;
  for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  const pH = (lo + hi) / 2, h = 10 ** -pH, al = alpha(h);
  const c = { H3O: 1000 * h, HO: 1000 * KE / h, Na: 1000 * Na, [an.anion]: 1000 * Ctot * al };
  return { Vt, pH, c, acide: 1000 * Ctot * (1 - al) };          // concentrations en mol/m³ (= mmol/L)
}
export const sigmaTitrage = p => kohlrausch(composition(p).c);

export const volumeEquivalent = (cA, VA = VA0, cB = CB) => Math.round(1e6 * cA * VA / cB) / 1e6;     // mL
// courbe σ = f(V_B) de 0 à V_B max
export function courbe(p, vmax = V_BURETTE, pas = 0.25) {
  const pts = [];
  for (let i = 0; i <= Math.round(vmax / pas); i++) { const VB = i * pas; pts.push({ VB, sigma: sigmaTitrage({ ...p, VB }) }); }
  return pts;
}
// pente locale (mS·m⁻¹ par mL)
export const pente = (p, VB) => { const e = 0.05, a = Math.max(0, VB - e), b = VB + e; return (sigmaTitrage({ ...p, VB: b }) - sigmaTitrage({ ...p, VB: a })) / (b - a); };

// ---------- quantités de matière dans l'hypothèse « transformation totale » (programme), en mmol ----------
export function quantites({ analyte = 'hcl', cA, VA = VA0, VB, cB = CB }) {
  const an = ANALYTES[analyte], nA = cA * VA, nB = cB * VB, nHO = Math.max(nB - nA, 0);
  return { nA, nB, VE: nA / cB, nHO, nNa: nB, nAnion: an.fort ? nA : Math.min(nA, nB), nH: an.fort ? Math.max(nA - nB, 0) : 0, nAcide: an.fort ? 0 : Math.max(nA - nB, 0) };
}
// conductivité calculée avec les quantités « transformation totale » (acide fort) : Σ λi ni / V total × 1000 (mS/m)
export function sigmaTotale({ analyte = 'hcl', cA, VA = VA0, VB, cB = CB, Vinit = V_INIT }) {
  const q = quantites({ analyte, cA, VA, VB, cB }), an = ANALYTES[analyte], Vt = Vinit + VB;
  return 1000 * (IONS.H3O.lambda * q.nH + IONS.HO.lambda * q.nHO + IONS.Na.lambda * q.nNa + IONS[an.anion].lambda * q.nAnion) / Vt;
}

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const arr1 = x => Math.round(x * 10) / 10;
export const CONC_DEFI = [0.040, 0.045, 0.050, 0.055, 0.060];
// défi 1 : acide inconnu (nature et concentration tirées) titré par la soude ; 21 points mesurés tous les 1 mL ; on demande c_A
export function tirageDefiConc() {
  const analyte = tire(ORDRE_ANALYTES), cA = tire(CONC_DEFI);
  const pts = []; for (let VB = 0; VB <= V_BURETTE; VB++) pts.push({ VB, sigma: arr1(sigmaTitrage({ analyte, cA, VB })) });
  return { analyte, cA, VA: VA0, VE: volumeEquivalent(cA), pts };
}
// défi 2 : acide fort + V_B (à au moins 2 mL de l'équivalence) ; on demande σ (mS/m) à 2 ou 3 chiffres significatifs
export function tirageDefiSigma() {
  const analyte = tire(['hcl', 'hno3']), cA = tire([0.030, 0.040, 0.050, 0.060]), VE = volumeEquivalent(cA);
  const VB = tire([-4, -3, -2, 2, 3, 4]) + VE;
  const sigma = sigmaTitrage({ analyte, cA, VB });
  return { analyte, cA, VA: VA0, VB, VE, sigma, sigmaTot: sigmaTotale({ analyte, cA, VB }) };
}
