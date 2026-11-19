// ====================================================
//  Modèle de la simulation « Quantité de matière : masse molaire, volume molaire » (1G spé PC, sim 152).
//  Modèle pur (sans React), testé par quantiteMatiereModele.test.mjs.
//  Hypothèses : masses molaires atomiques arrondies au dixième ; N_A = 6,02 × 10²³ mol⁻¹ ; masse des électrons négligée pour les ions ;
//  gaz : le volume molaire est le même pour tous les gaz à T et P données (modèle du gaz parfait, V_m = R·T/P).
// ====================================================

export const NA = 6.02e23;                        // mol⁻¹ (valeur arrondie de 6,02214076 × 10²³)
export const R_GP = 8.314;                        // J·mol⁻¹·K⁻¹ (constante des gaz parfaits, exploration seulement)
export const P_ATM = 1013;                        // hPa

// Masses molaires atomiques (g/mol), arrondies au dixième comme dans un tableau périodique de lycée
export const MM_ATOME = { H: 1.0, He: 4.0, C: 12.0, N: 14.0, O: 16.0, Na: 23.0, Mg: 24.3, P: 31.0, S: 32.1, Cl: 35.5, K: 39.1, Ca: 40.1, Fe: 55.8, Cu: 63.5, Zn: 65.4 };

export const COULEUR_ATOME = { H: '#94a3b8', He: '#a78bfa', C: '#334155', N: '#2563eb', O: '#dc2626', Na: '#a855f7', Mg: '#16a34a', P: '#ea580c', S: '#ca8a04', Cl: '#15803d', K: '#7c3aed', Ca: '#0d9488', Fe: '#9a3412', Cu: '#c2410c', Zn: '#64748b' };
// Espèces : f = formule (liste ordonnée [symbole, nombre]) ; etat : s, l, g (corps purs) ou ion ; rho : masse volumique (g/mL) des liquides ; charge : pour les ions
export const ESPECES = [
  // solides
  { id: 'cu', nom: 'cuivre', f: [['Cu', 1]], etat: 's' },
  { id: 'fe', nom: 'fer', f: [['Fe', 1]], etat: 's' },
  { id: 'mg', nom: 'magnésium', f: [['Mg', 1]], etat: 's' },
  { id: 'nacl', nom: 'chlorure de sodium (sel de cuisine)', f: [['Na', 1], ['Cl', 1]], etat: 's' },
  { id: 'cacl2', nom: 'chlorure de calcium', f: [['Ca', 1], ['Cl', 2]], etat: 's' },
  { id: 'caco3', nom: 'carbonate de calcium (calcaire)', f: [['Ca', 1], ['C', 1], ['O', 3]], etat: 's' },
  { id: 'nahco3', nom: 'hydrogénocarbonate de sodium', f: [['Na', 1], ['H', 1], ['C', 1], ['O', 3]], etat: 's' },
  { id: 'glucose', nom: 'glucose', f: [['C', 6], ['H', 12], ['O', 6]], etat: 's' },
  { id: 'saccharose', nom: 'saccharose (sucre de table)', f: [['C', 12], ['H', 22], ['O', 11]], etat: 's' },
  { id: 'vitc', nom: 'acide ascorbique (vitamine C)', f: [['C', 6], ['H', 8], ['O', 6]], etat: 's' },
  { id: 'paracetamol', nom: 'paracétamol', f: [['C', 8], ['H', 9], ['N', 1], ['O', 2]], etat: 's' },
  // liquides
  { id: 'eau', nom: 'eau', f: [['H', 2], ['O', 1]], etat: 'l', rho: 1.00 },
  { id: 'ethanol', nom: 'éthanol', f: [['C', 2], ['H', 6], ['O', 1]], etat: 'l', rho: 0.79 },
  { id: 'acetone', nom: 'acétone', f: [['C', 3], ['H', 6], ['O', 1]], etat: 'l', rho: 0.79 },
  { id: 'cyclohexane', nom: 'cyclohexane', f: [['C', 6], ['H', 12]], etat: 'l', rho: 0.78 },
  { id: 'acideEthanoique', nom: 'acide éthanoïque', f: [['C', 2], ['H', 4], ['O', 2]], etat: 'l', rho: 1.05 },
  // gaz
  { id: 'h2', nom: 'dihydrogène', f: [['H', 2]], etat: 'g' },
  { id: 'he', nom: 'hélium', f: [['He', 1]], etat: 'g' },
  { id: 'ch4', nom: 'méthane', f: [['C', 1], ['H', 4]], etat: 'g' },
  { id: 'nh3', nom: 'ammoniac', f: [['N', 1], ['H', 3]], etat: 'g' },
  { id: 'n2', nom: 'diazote', f: [['N', 2]], etat: 'g' },
  { id: 'o2', nom: 'dioxygène', f: [['O', 2]], etat: 'g' },
  { id: 'co2', nom: 'dioxyde de carbone', f: [['C', 1], ['O', 2]], etat: 'g' },
  { id: 'c4h10', nom: 'butane', f: [['C', 4], ['H', 10]], etat: 'g' },
  { id: 'cl2', nom: 'dichlore', f: [['Cl', 2]], etat: 'g' },
  // ions (masse des électrons négligée)
  { id: 'na+', nom: 'ion sodium', f: [['Na', 1]], etat: 'ion', charge: 1 },
  { id: 'cl-', nom: 'ion chlorure', f: [['Cl', 1]], etat: 'ion', charge: -1 },
  { id: 'nh4+', nom: 'ion ammonium', f: [['N', 1], ['H', 4]], etat: 'ion', charge: 1 },
  { id: 'no3-', nom: 'ion nitrate', f: [['N', 1], ['O', 3]], etat: 'ion', charge: -1 },
  { id: 'so42-', nom: 'ion sulfate', f: [['S', 1], ['O', 4]], etat: 'ion', charge: -2 },
  { id: 'po43-', nom: 'ion phosphate', f: [['P', 1], ['O', 4]], etat: 'ion', charge: -3 },
];
export const espece = id => ESPECES.find(e => e.id === id);
export const parEtat = etat => ESPECES.filter(e => e.etat === etat);

const arrondi1 = x => Math.round(x * 10 + 1e-9) / 10;
// masse molaire d'une espèce (g/mol) : somme des masses molaires atomiques × nombre d'atomes
export const masseMolaire = e => arrondi1(e.f.reduce((s, [a, k]) => s + k * MM_ATOME[a], 0));
// lignes du calcul : [symbole, nombre, masse molaire atomique, contribution]
export const lignesMasseMolaire = e => e.f.map(([a, k]) => [a, k, MM_ATOME[a], arrondi1(k * MM_ATOME[a])]);

// chaîne Unicode de la formule (pour les textes non JSX et les étiquettes SVG)
const IND = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const EXP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const indice = k => (k > 1 ? String(k).split('').map(c => IND[c]).join('') : '');
export const formuleTexte = e => {
  const base = e.f.map(([a, k]) => a + indice(k)).join('');
  if (!e.charge) return base;
  const n = Math.abs(e.charge);
  return base + (n > 1 ? String(n).split('').map(c => EXP[c]).join('') : '') + (e.charge > 0 ? '⁺' : '⁻');
};

// ---------- relations ----------
export const nombreEntites = n => n * NA;                // N = n × N_A
export const quantiteMasse = (m, M) => m / M;            // n = m / M
export const masseDe = (n, M) => n * M;                  // m = n × M
export const quantiteGaz = (V, Vm) => V / Vm;            // n = V / V_m  (V et V_m dans le même volume : L et L/mol)
export const quantiteLiquide = (rho, V, M) => rho * V / M;   // n = ρ·V / M  (ρ en g/mL, V en mL)

// Volume molaire (L/mol) dans les conditions des exercices : valeurs retenues dans les énoncés
export const VM_USUEL = { 0: 22.4, 20: 24.0, 25: 24.5 };
// Volume molaire (L/mol) du modèle du gaz parfait : V_m = R·T / P (exploration)
export const volumeMolaireGP = (thetaC, P_hPa) => R_GP * (thetaC + 273.15) / (P_hPa * 100) * 1000;

// ---------- défis (tirage aléatoire borné) ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
export const DEFI_SOLIDES = ['nacl', 'cacl2', 'caco3', 'nahco3', 'glucose', 'saccharose', 'vitc', 'paracetamol'].map(espece);
export const DEFI_GAZ = ['o2', 'n2', 'co2', 'ch4', 'nh3', 'c4h10', 'h2', 'he'].map(espece);
export function tirerDefiSolide() {
  const e = tire(DEFI_SOLIDES), n = tire([0.0250, 0.0500, 0.100, 0.150, 0.200, 0.250, 0.500]);
  return { type: 'solide', e, n, M: masseMolaire(e), vrai: n * masseMolaire(e) };
}
export function tirerDefiGaz() {
  const e = tire(DEFI_GAZ), theta = e.id === 'c4h10' ? tire([20, 25]) : tire([0, 20, 25]), V = tire([250, 400, 500, 600, 750, 800, 900]);
  const Vm = VM_USUEL[theta], M = masseMolaire(e);
  return { type: 'gaz', e, theta, V, Vm, M, n: V / 1000 / Vm, vrai: V / 1000 / Vm * M };
}
// le butane (température d'ébullition ≈ −1 °C sous 1013 hPa) est liquide à 0 °C : il n'est pas un gaz dans cette condition
export const gazPossible = (e, thetaC) => !(e.id === 'c4h10' && thetaC <= 0);
// arrondi à cs chiffres significatifs (pour l'affichage de la valeur attendue)
export const arrondiCS = (x, cs) => Number(Number(x).toPrecision(cs));
