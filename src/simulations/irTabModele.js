// ====================================================
//  Modèle de la simulation 170 : spectroscopie infrarouge, exploitation de DONNÉES TABULÉES (Terminale générale).
//  Les spectres sont CONSTRUITS à partir de bandes (position, demi-largeur à mi-hauteur, profondeur) : ils sont illustratifs, jamais copiés d'un enregistrement.
//  Hypothèses : valeurs tabulées = intervalles typiques ; spectre simplifié (bandes principales, sans couplages ni harmoniques) ;
//  échantillon pur, en phase condensée (liquide : liaisons hydrogène, donc O–H et N–H « liés »).
//  On réutilise de la simulation 111 (sans la modifier) : relation σ = 1/λ et bornes de l'axe.
// ====================================================
import { nombreOnde, longueurOnde, SIGMA_MIN, SIGMA_MAX } from './irModele.js';
export { nombreOnde, longueurOnde, SIGMA_MIN, SIGMA_MAX };

// ---------- données tabulées : intervalles typiques (cm⁻¹) ----------
// id, liaison, groupe, σmin, σmax, intensité, allure
export const TABLE = [
  { id: 'oh_alcool', liaison: 'O–H', groupe: 'd’un alcool', min: 3200, max: 3700, inten: 'forte', allure: 'large' },
  { id: 'oh_acide', liaison: 'O–H', groupe: 'd’un acide carboxylique', min: 2500, max: 3200, inten: 'forte', allure: 'très large' },
  { id: 'nh', liaison: 'N–H', groupe: 'd’une amine ou d’un amide', min: 3100, max: 3500, inten: 'moyenne', allure: 'fine' },
  { id: 'ch_tet', liaison: 'C–H', groupe: 'd’un carbone saturé', min: 2850, max: 3000, inten: 'moyenne à forte', allure: 'fine' },
  { id: 'ch_trig', liaison: 'C–H', groupe: 'd’un carbone d’alcène (C=C)', min: 3000, max: 3100, inten: 'moyenne', allure: 'fine' },
  { id: 'ch_ald', liaison: 'C–H', groupe: 'd’un aldéhyde', min: 2700, max: 2900, inten: 'moyenne', allure: 'fine' },
  { id: 'co_ester', liaison: 'C=O', groupe: 'd’un ester', min: 1735, max: 1750, inten: 'forte', allure: 'fine' },
  { id: 'co_ald_cet', liaison: 'C=O', groupe: 'd’un aldéhyde ou d’une cétone', min: 1705, max: 1740, inten: 'forte', allure: 'fine' },
  { id: 'co_acide', liaison: 'C=O', groupe: 'd’un acide carboxylique', min: 1700, max: 1725, inten: 'forte', allure: 'fine' },
  { id: 'co_amide', liaison: 'C=O', groupe: 'd’un amide', min: 1650, max: 1700, inten: 'forte', allure: 'fine' },
  { id: 'cc', liaison: 'C=C', groupe: 'd’un alcène', min: 1625, max: 1685, inten: 'moyenne', allure: 'fine' },
];
export const LIGNE = Object.fromEntries(TABLE.map(r => [r.id, r]));
export const dansLigne = (id, s) => s >= LIGNE[id].min && s <= LIGNE[id].max;
// lignes du tableau qui contiennent le nombre d'onde s (exploration : le curseur donne la zone)
export const lignesContenant = s => TABLE.filter(r => s >= r.min && s <= r.max);
// seuil entre la zone des groupes caractéristiques et l'empreinte digitale
export const SEUIL_EMPREINTE = 1500;

// ---------- molécules ----------
// bande = [σ (cm⁻¹), demi-largeur à mi-hauteur (cm⁻¹), profondeur (0-1), ligne du tableau ou null]
// profondeur : ≥ 0,75 forte ; 0,35–0,7 moyenne (« moyenne à forte » jusqu'à 1) ; en dessous de 0,35 faible (non utilisée pour une bande tabulée). Largeur : fine ≤ 40 ; large 120–250 ; très large ≥ 280.
export const MOLECULES = {
  ethanol: { nom: 'éthanol', fsd: 'CH₃–CH₂–OH', brute: 'C₂H₆O', bandes: [[3340, 160, 0.80, 'oh_alcool'], [2975, 30, 0.60, 'ch_tet'], [2890, 25, 0.40, 'ch_tet'], [1450, 30, 0.30, null], [1380, 22, 0.30, null], [1090, 25, 0.55, null], [1050, 22, 0.85, null]] },
  acide: { nom: 'acide éthanoïque', fsd: 'CH₃–COOH', brute: 'C₂H₄O₂', bandes: [[2900, 330, 0.70, 'oh_acide'], [2945, 28, 0.40, 'ch_tet'], [1710, 17, 0.92, 'co_acide'], [1410, 25, 0.50, null], [1290, 25, 0.70, null], [940, 60, 0.40, null]] },
  ester: { nom: 'éthanoate d’éthyle', fsd: 'CH₃–COO–CH₂–CH₃', brute: 'C₄H₈O₂', bandes: [[2985, 32, 0.45, 'ch_tet'], [1738, 17, 0.92, 'co_ester'], [1465, 25, 0.25, null], [1375, 22, 0.45, null], [1240, 26, 0.90, null], [1050, 25, 0.70, null]] },
  propanone: { nom: 'propanone', fsd: 'CH₃–CO–CH₃', brute: 'C₃H₆O', bandes: [[2970, 35, 0.40, 'ch_tet'], [1715, 17, 0.92, 'co_ald_cet'], [1420, 25, 0.35, null], [1365, 22, 0.55, null], [1220, 22, 0.60, null], [530, 25, 0.40, null]] },
  ethanal: { nom: 'éthanal', fsd: 'CH₃–CHO', brute: 'C₂H₄O', bandes: [[2985, 30, 0.40, 'ch_tet'], [2825, 18, 0.35, 'ch_ald'], [2725, 16, 0.35, 'ch_ald'], [1730, 17, 0.92, 'co_ald_cet'], [1400, 25, 0.30, null], [1350, 25, 0.30, null], [1120, 25, 0.30, null]] },
  ethylamine: { nom: 'éthylamine', fsd: 'CH₃–CH₂–NH₂', brute: 'C₂H₇N', bandes: [[3380, 16, 0.40, 'nh'], [3300, 16, 0.40, 'nh'], [2965, 32, 0.70, 'ch_tet'], [2875, 28, 0.55, 'ch_tet'], [1460, 25, 0.40, null], [1070, 30, 0.45, null], [800, 100, 0.40, null]] },
  cyclohexene: { nom: 'cyclohexène', fsd: 'cycle CH=CH–CH₂–CH₂–CH₂–CH₂', brute: 'C₆H₁₀', bandes: [[3025, 18, 0.40, 'ch_trig'], [2930, 35, 0.90, 'ch_tet'], [2860, 25, 0.60, 'ch_tet'], [1650, 16, 0.35, 'cc'], [1440, 22, 0.50, null], [720, 25, 0.70, null]] },
};
export const NOMS = Object.keys(MOLECULES);
export const aLigne = mol => mol.bandes.filter(b => b[3]);
// bandes lisibles dans la zone des groupes caractéristiques (au-dessus de 1500 cm⁻¹) : seules exploitées en Terminale
export const bandesExploitables = mol => mol.bandes.filter(b => b[3] && b[0] > SEUIL_EMPREINTE);

// ---------- spectre : transmittance T (%) ----------
const forme = (s, s0, w) => (w >= 60 ? Math.exp(-Math.LN2 * ((s - s0) / w) ** 2) : 1 / (1 + ((s - s0) / w) ** 2));
export function transmittance(mol, s, bruit = 0) {
  let a = 0; for (const [s0, w, d] of mol.bandes) a += d * forme(s, s0, w);
  const b = bruit ? bruit * Math.sin(s * 0.37 + 1.3) * Math.cos(s * 0.11) : 0;
  return Math.max(2, Math.min(99, 98 - 96 * Math.min(0.99, a) + b));
}
export function spectre(mol, pas = 4, bruit = 0) {
  const pts = []; for (let s = SIGMA_MAX; s >= SIGMA_MIN; s -= pas) pts.push([s, transmittance(mol, s, bruit)]);
  return pts;
}
// nombre d'onde du minimum local de transmittance autour d'une bande (pas de 1 cm⁻¹)
export function minimumBande(mol, s0, fenetre = 40) {
  let best = s0, bt = Infinity;
  for (let s = s0 - fenetre; s <= s0 + fenetre; s++) { const t = transmittance(mol, s); if (t < bt) { bt = t; best = s; } }
  return best;
}

// ---------- variantes aléatoires (défis) : décalage de chaque bande dans son intervalle tabulé ----------
export function variante(mol, rng = Math.random) {
  const bandes = mol.bandes.map(([s, w, d, id]) => {
    let dec = Math.round((rng() * 2 - 1) * 8);
    if (id) { const L = LIGNE[id]; dec = Math.max(L.min + 3 - s, Math.min(L.max - 3 - s, dec)); }
    return [s + dec, w, d, id];
  });
  return { ...mol, bandes };
}

// ---------- classes « fortes » : ce qui distingue sans ambiguïté deux spectres dans la zone > 1500 cm⁻¹ ----------
// traits forts : O–H alcool, O–H acide, N–H, C=O (toute famille confondue : les intervalles se recouvrent), C=C
export function traitsForts(mol) {
  const t = new Set();
  for (const b of bandesExploitables(mol)) {
    if (b[3].startsWith('co_')) t.add('co'); else if (['oh_alcool', 'oh_acide', 'nh', 'cc'].includes(b[3])) t.add(b[3]);
  }
  return t;
}
export const memesTraits = (a, b) => { const x = traitsForts(a), y = traitsForts(b); return x.size === y.size && [...x].every(k => y.has(k)); };
// ensembles de 4 candidats dont deux quelconques se distinguent par un trait fort (jamais ester / cétone / aldéhyde ensemble)
export function ensemblesValides() {
  const res = [], n = NOMS.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) {
    const ens = [NOMS[a], NOMS[b], NOMS[c], NOMS[d]];
    if (ens.every((x, i) => ens.every((y, j) => i >= j || !memesTraits(MOLECULES[x], MOLECULES[y])))) res.push(ens);
  }
  return res;
}
export function tirageDefiIdentifier(rng = Math.random) {
  const sets = ensemblesValides(), cand = sets[Math.floor(rng() * sets.length)].slice();
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  const inconnu = cand[Math.floor(rng() * cand.length)];
  return { candidats: cand, inconnu, mol: variante(MOLECULES[inconnu], rng) };
}

// ---------- défi « associer chaque bande à une liaison » ----------
export const LIAISONS = [
  { id: 'oh_alcool', nom: 'O–H d’un alcool' }, { id: 'oh_acide', nom: 'O–H d’un acide carboxylique' }, { id: 'nh', nom: 'N–H' },
  { id: 'ch', nom: 'C–H' }, { id: 'co', nom: 'C=O' }, { id: 'cc', nom: 'C=C' },
];
const liaisonDe = id => (id.startsWith('ch_') ? 'ch' : id.startsWith('co_') ? 'co' : id);
// bande cible : indice dans mol.bandes (une seule bande par liaison : l'autre bande du doublet N–H n'est pas marquée)
const CIBLES = { ethanol: [0, 1], acide: [0, 2], ester: [0, 1], propanone: [0, 1], ethanal: [2, 3], ethylamine: [0, 2], cyclohexene: [1, 3] };
export function tirageDefiAssocier(rng = Math.random) {
  const cle = NOMS[Math.floor(rng() * NOMS.length)], mol = variante(MOLECULES[cle], rng);
  const idx = CIBLES[cle].slice();
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }   // l'ordre A, B, C ne suit pas l'ordre des σ
  const cibles = idx.map((k, i) => ({ lettre: 'ABC'[i], s: mol.bandes[k][0], id: mol.bandes[k][3], liaison: liaisonDe(mol.bandes[k][3]) }));
  return { cle, mol, cibles };
}
export const nomLiaison = id => LIAISONS.find(l => l.id === id).nom;

// ---------- exercices : conversion λ → σ et lignes du tableau compatibles ----------
