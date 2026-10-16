// ====================================================
//  Modèle de la simulation « Solubilité et miscibilité : le bilan des interactions »
//  Cohésion de chaque espèce décomposée en 3 types d'interactions (Hildebrand–Hansen) :
//    d : Van der Waals, dipôles instantanés (dispersion)   — δd
//    p : Van der Waals, dipôles permanents                  — δp
//    h : liaison hydrogène                                  — δh
//  Valeurs δ (MPa^½) arrondies d'après les tables de Hansen ; V = volume molaire (cm³/mol) ; eps = permittivité relative.
//  « estime » : valeur estimée par nos soins (non tabulée), à manier avec prudence.
//  Colorants (rouge Soudan III, acide carminique) : δ calculés par la méthode des contributions de groupes
//  de Hoftyzer–Van Krevelen : δd = ΣFd/V ; δp = √(ΣFp²)/V ; δh = √(ΣEh/V).
// ====================================================

export const RT = 2.479;                 // kJ/mol à 298 K
export const K_COULOMB = 1389.35;        // N_A·e²/(4π ε0) en kJ·Å/mol
export const D_NACL = 2.82;              // Å (distance Na⁺…Cl⁻ dans le cristal)

const Z = n => Array.from({ length: n }, (_, i) => ['C', i * 0.866, i % 2 ? 0.5 : 0]);
const zb = n => Array.from({ length: n - 1 }, (_, i) => [i, i + 1, 1]);
const hex = (cx, cy) => [0, 1, 2, 3, 4, 5].map(k => ['C', cx + Math.cos(Math.PI / 3 * k), cy + Math.sin(Math.PI / 3 * k)]);

export const ESPECES = {
  eau: { nom: 'eau', formule: 'H₂O', famille: 'liq', dd: 15.5, dp: 16.0, dh: 42.3, V: 18.0, eps: 78.4,
    dev: true, atoms: [['O', 0, 0], ['H', -0.633, -0.49], ['H', 0.633, -0.49]], bonds: [[0, 1, 1], [0, 2, 1]] },
  methanol: { nom: 'méthanol', formule: 'CH₃OH', famille: 'liq', dd: 15.1, dp: 12.3, dh: 22.3, V: 40.7, eps: 32.7,
    dev: true, atoms: [['C', 0, 0], ['O', 1, 0], ['H', 1.4, -0.693], ['H', -0.8, 0], ['H', 0, 0.8], ['H', 0, -0.8]],
    bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1]] },
  ethanol: { nom: 'éthanol', formule: 'C₂H₅OH', famille: 'liq', dd: 15.8, dp: 8.8, dh: 19.4, V: 58.5, eps: 24.5,
    dev: true, atoms: [['C', 0, 0], ['C', 1, 0], ['O', 2, 0], ['H', 2.4, -0.693], ['H', -0.8, 0], ['H', 0, 0.8], ['H', 0, -0.8], ['H', 1, 0.8], ['H', 1, -0.8]],
    bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]] },
  propanol: { nom: 'propan-1-ol', formule: 'C₃H₇OH', famille: 'liq', dd: 16.0, dp: 6.8, dh: 17.4, V: 75.2, eps: 20.3,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['O', 2.6, 0.5], ['H', 3.46, 0]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]] },
  butanol: { nom: 'butan-1-ol', formule: 'C₄H₉OH', famille: 'liq', dd: 16.0, dp: 5.7, dh: 15.8, V: 91.5, eps: 17.5,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['C', 2.6, 0.5], ['O', 3.46, 0], ['H', 4.33, 0.5]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1]] },
  pentanol: { nom: 'pentan-1-ol', formule: 'C₅H₁₁OH', famille: 'liq', dd: 15.9, dp: 5.9, dh: 13.9, V: 108.6, eps: 13.9,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['C', 2.6, 0.5], ['C', 3.46, 0], ['O', 4.33, 0.5], ['H', 5.2, 0]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1]] },
  octanol: { nom: 'octan-1-ol', formule: 'C₈H₁₇OH', famille: 'liq', dd: 17.0, dp: 3.3, dh: 11.9, V: 157.7, eps: 10.3,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['C', 2.6, 0.5], ['C', 3.46, 0], ['C', 4.33, 0.5], ['C', 5.2, 0], ['C', 6.06, 0.5], ['O', 6.93, 0], ['H', 7.79, 0.5]],
    bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [7, 8, 1], [8, 9, 1]] },
  glycerol: { nom: 'glycérol', formule: 'C₃H₈O₃', famille: 'liq', dd: 17.4, dp: 12.1, dh: 29.3, V: 73.3, eps: 42.5,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['O', -0.87, 0.5], ['H', -1.73, 0], ['O', 0.87, 1.5], ['H', 1.73, 2.0], ['O', 2.6, 0.5], ['H', 3.46, 0]],
    bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [3, 4, 1], [1, 5, 1], [5, 6, 1], [2, 7, 1], [7, 8, 1]] },
  acetone: { nom: 'acétone', formule: 'C₃H₆O', famille: 'liq', dd: 15.5, dp: 10.4, dh: 7.0, V: 74.0, eps: 20.7,
    dev: true, atoms: [['C', 0, 0], ['O', 0, 1], ['C', -0.866, -0.5], ['C', 0.866, -0.5],
      ['H', -1.266, 0.193], ['H', -1.559, -0.9], ['H', -0.466, -1.193], ['H', 1.266, 0.193], ['H', 1.559, -0.9], ['H', 0.466, -1.193]],
    bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [2, 4, 1], [2, 5, 1], [2, 6, 1], [3, 7, 1], [3, 8, 1], [3, 9, 1]] },
  ether: { nom: 'éther diéthylique', formule: 'C₄H₁₀O', famille: 'liq', dd: 14.5, dp: 2.9, dh: 5.1, V: 104.8, eps: 4.3,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['O', 1.73, 0], ['C', 2.6, 0.5], ['C', 3.46, 0]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]] },
  acetate: { nom: "acétate d'éthyle", formule: 'C₄H₈O₂', famille: 'liq', dd: 15.8, dp: 5.3, dh: 7.2, V: 98.5, eps: 6.0,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['O', 0.87, 1.5], ['O', 1.73, 0], ['C', 2.6, 0.5], ['C', 3.46, 0]], bonds: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1], [4, 5, 1]] },
  dcm: { nom: 'dichlorométhane', formule: 'CH₂Cl₂', famille: 'liq', dd: 17.0, dp: 7.3, dh: 7.1, V: 63.9, eps: 8.9,
    dev: true, atoms: [['C', 0, 0], ['Cl', -0.85, -0.85], ['Cl', 0.85, -0.85], ['H', -0.57, 0.57], ['H', 0.57, 0.57]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  ccl4: { nom: 'tétrachlorométhane', formule: 'CCl₄', famille: 'liq', dd: 17.8, dp: 0.0, dh: 0.6, V: 97.1, eps: 2.2,
    dev: true, atoms: [['C', 0, 0], ['Cl', 0, 1.15], ['Cl', 0, -1.15], ['Cl', 1.15, 0], ['Cl', -1.15, 0]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  hexane: { nom: 'hexane', formule: 'C₆H₁₄', famille: 'liq', dd: 14.9, dp: 0.0, dh: 0.0, V: 131.6, eps: 1.9,
    atoms: Z(6), bonds: zb(6) },
  cyclohexane: { nom: 'cyclohexane', formule: 'C₆H₁₂', famille: 'liq', dd: 16.8, dp: 0.0, dh: 0.2, V: 108.7, eps: 2.0,
    atoms: hex(0, 0), bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 0, 1]] },
  toluene: { nom: 'toluène', formule: 'C₇H₈', famille: 'liq', dd: 18.0, dp: 1.4, dh: 2.0, V: 106.8, eps: 2.4,
    atoms: [...hex(0, 0), ['C', 2, 0]], bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [0, 6, 1]] },
  huile: { nom: 'huile de colza (triglycéride)', formule: 'triglycéride', famille: 'liq', estime: true, dd: 16.2, dp: 3.5, dh: 4.5, V: 970, eps: 3.1,
    note: "Formule simplifiée : R = longue chaîne carbonée (≈ 17 C). Valeurs δ estimées.",
    atoms: [['C', 0, 0], ['C', 0.866, 0.5], ['C', 1.732, 0],
      ['O', 0, -1], ['C', -0.866, -1.5], ['O', -1.732, -1], ['R', -0.866, -2.5],
      ['O', 0.866, 1.5], ['C', 0.866, 2.5], ['O', 1.732, 3], ['R', 0, 3],
      ['O', 1.732, -1], ['C', 2.598, -1.5], ['O', 3.464, -1], ['R', 2.598, -2.5]],
    bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [3, 4, 1], [4, 5, 2], [4, 6, 1], [1, 7, 1], [7, 8, 1], [8, 9, 2], [8, 10, 1], [2, 11, 1], [11, 12, 1], [12, 13, 2], [12, 14, 1]] },
  naphtalene: { nom: 'naphtalène (solide)', formule: 'C₁₀H₈', famille: 'mol', dd: 19.2, dp: 2.0, dh: 5.9, V: 123, eps: 2.5,
    atoms: [['C', 0, 1], ['C', -0.87, 0.5], ['C', -0.87, -0.5], ['C', 0, -1], ['C', 0.87, -0.5], ['C', 0.87, 0.5], ['C', 1.73, 1], ['C', 1.73, -1], ['C', 2.6, -0.5], ['C', 2.6, 0.5]],
    bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [5, 6, 1], [6, 9, 2], [9, 8, 1], [8, 7, 2], [7, 4, 1]] },
  diiode: { nom: 'diiode (solide)', formule: 'I₂', famille: 'mol', estime: true, dd: 28.0, dp: 0.0, dh: 0.0, V: 59, eps: 1,
    note: "δ du diiode estimé à partir de sa paramètre de solubilité de Hildebrand (≈ 29 MPa^½).",
    dev: true, atoms: [['I', 0, 0], ['I', 1.5, 0]], bonds: [[0, 1, 1]] },
  nacl: { nom: 'chlorure de sodium (solide ionique)', formule: 'NaCl', famille: 'ion', V: 27, eps: 1, atoms: [], bonds: [] },
};

// ---------- contributions de groupes (Hoftyzer–Van Krevelen) : [nom, n, Fd, Fp, Eh, polaire ?] ----------
export function hvk(groupes, V) {
  let fd = 0, fp2 = 0, eh = 0;
  groupes.forEach(([, n, Fd, Fp, Eh]) => { fd += n * Fd; fp2 += n * Fp * Fp; eh += n * Eh; });
  return { dd: fd / V, dp: Math.sqrt(fp2) / V, dh: Math.sqrt(eh / V) };
}
const G_SOUDAN = [
  ['phényle C₆H₅–', 1, 1430, 110, 0, false], ['phénylène –C₆H₄–', 1, 1270, 110, 0, false],
  ['=CH– (naphtalène)', 6, 200, 0, 0, false], ['=C< (naphtalène)', 4, 70, 0, 0, false], ['cycle (naphtalène)', 2, 190, 0, 0, false],
  ['azo –N=N– (estimé)', 2, 40, 300, 2000, true], ['–OH engagé dans une liaison H interne (estimé)', 1, 210, 300, 3000, true],
];
const G_CARMIN = [
  ['=CH– aromatique', 1, 200, 0, 0, false], ['=C< aromatique', 11, 70, 0, 0, false], ['cycles', 4, 190, 0, 0, false],
  ['–CH₃', 1, 420, 0, 0, false], ['>CH– (sucre)', 5, 80, 0, 0, false], ['–CH₂– (sucre)', 1, 270, 0, 0, false],
  ['>C=O (cétone)', 2, 290, 770, 2000, true], ['–COOH', 1, 530, 420, 10000, true], ['–O– (cycle du sucre)', 1, 100, 400, 3000, true],
  ['–OH libre', 6, 210, 500, 20000, true], ['–OH engagé dans une liaison H interne (estimé)', 2, 210, 300, 3000, true],
];
const V_SOUDAN = 280, V_CARMIN = 310;
ESPECES.soudan = { nom: 'rouge Soudan III (solide)', formule: 'C₂₂H₁₆N₄O', famille: 'mol', estime: true, colorant: true, V: V_SOUDAN, eps: 3,
  groupes: G_SOUDAN, ...hvk(G_SOUDAN, V_SOUDAN),
  note: "δ calculés par contributions de groupes (Hoftyzer–Van Krevelen). Le groupe OH est engagé dans une liaison H interne avec un atome N du groupe azo : il n'est presque plus disponible pour le solvant.",
  atoms: [['C', 1, 0], ['C', 0.5, 0.866], ['C', -0.5, 0.866], ['C', -1, 0], ['C', -0.5, -0.866], ['C', 0.5, -0.866],
    ['C', -2, 0], ['C', -2.5, -0.866], ['C', -2, -1.732], ['C', -1, -1.732],
    ['O', 2, 0], ['H', 2.5, -0.866], ['N', 1, -1.732], ['N', 2, -1.732],
    ['C', 2.5, -2.598], ['C', 3.5, -2.598], ['C', 4, -3.464], ['C', 3.5, -4.33], ['C', 2.5, -4.33], ['C', 2, -3.464],
    ['N', 4, -5.196], ['N', 5, -5.196],
    ['C', 5.5, -6.062], ['C', 6.5, -6.062], ['C', 7, -6.928], ['C', 6.5, -7.794], ['C', 5.5, -7.794], ['C', 5, -6.928]],
  bonds: [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2], [3, 6, 1], [6, 7, 2], [7, 8, 1], [8, 9, 2], [9, 4, 1],
    [0, 10, 1], [10, 11, 1], [5, 12, 1], [12, 13, 2], [13, 14, 1], [14, 15, 2], [15, 16, 1], [16, 17, 2], [17, 18, 1], [18, 19, 2], [19, 14, 1],
    [17, 20, 1], [20, 21, 2], [21, 22, 1], [22, 23, 2], [23, 24, 1], [24, 25, 2], [25, 26, 1], [26, 27, 2], [27, 22, 1]],
  hbInterne: [[11, 13]] };
ESPECES.carmin = { nom: 'acide carminique (rouge de cochenille, solide)', formule: 'C₂₂H₂₀O₁₃', famille: 'mol', estime: true, colorant: true, V: V_CARMIN, eps: 10,
  groupes: G_CARMIN, ...hvk(G_CARMIN, V_CARMIN),
  note: "δ calculés par contributions de groupes (Hoftyzer–Van Krevelen). Deux OH sont engagés dans des liaisons H internes avec les C=O voisins.",
  atoms: [['C', 0.866, 0.5], ['C', 0, 1], ['C', -0.866, 0.5], ['C', -0.866, -0.5], ['C', 0, -1], ['C', 0.866, -0.5],
    ['C', -1.732, 1], ['C', -2.598, 0.5], ['C', -2.598, -0.5], ['C', -1.732, -1],
    ['C', 1.732, 1], ['C', 2.598, 0.5], ['C', 2.598, -0.5], ['C', 1.732, -1],
    ['O', 0, 2], ['O', 0, -2], ['C', -1.732, 2],
    ['C', -3.464, 1], ['O', -3.464, 2], ['O', -4.33, 0.5], ['H', -5.2, 1],
    ['O', -3.464, -1], ['H', -3.464, -2],
    ['O', 1.732, 2], ['H', 0.866, 2.5], ['O', 1.732, -2], ['H', 0.866, -2.5],
    ['O', 3.464, -1], ['H', 3.464, -2],
    ['C', 3.464, 1], ['O', 3.464, 2], ['C', 4.33, 2.5], ['C', 5.196, 2], ['C', 5.196, 1], ['C', 4.33, 0.5],
    ['C', 4.33, 3.5], ['O', 5.196, 4], ['H', 6.06, 3.5],
    ['O', 6.06, 2.5], ['H', 6.93, 2], ['O', 6.06, 0.5], ['H', 6.93, 1], ['O', 4.33, -0.5], ['H', 5.196, -1]],
  bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 1], [5, 0, 2],
    [2, 6, 1], [6, 7, 2], [7, 8, 1], [8, 9, 2], [9, 3, 1],
    [0, 10, 1], [10, 11, 2], [11, 12, 1], [12, 13, 2], [13, 5, 1],
    [1, 14, 2], [4, 15, 2], [6, 16, 1], [7, 17, 1], [17, 18, 2], [17, 19, 1], [19, 20, 1], [8, 21, 1], [21, 22, 1],
    [10, 23, 1], [23, 24, 1], [13, 25, 1], [25, 26, 1], [12, 27, 1], [27, 28, 1],
    [11, 29, 1], [29, 30, 1], [30, 31, 1], [31, 32, 1], [32, 33, 1], [33, 34, 1], [34, 29, 1],
    [31, 35, 1], [35, 36, 1], [36, 37, 1], [32, 38, 1], [38, 39, 1], [33, 40, 1], [40, 41, 1], [34, 42, 1], [42, 43, 1]],
  hbInterne: [[24, 14], [26, 15]] };

export const ORDRE_LIQ = ['eau', 'methanol', 'ethanol', 'propanol', 'butanol', 'pentanol', 'octanol', 'glycerol', 'acetone', 'ether', 'acetate', 'dcm', 'ccl4', 'toluene', 'cyclohexane', 'hexane', 'huile'];
export const ORDRE_SOL = ['naphtalene', 'diiode', 'soudan', 'carmin', 'nacl'];

const CHI = { H: 2.2, C: 2.55, O: 3.44, N: 3.04, Cl: 3.16, I: 2.66, R: 2.55 };
// analyse automatique de la formule : charges partielles, donneurs (H lié à O/N) et accepteurs (O, N)
export function analyser(m) {
  const q = m.atoms.map(() => 0);
  m.bonds.forEach(([i, j]) => {
    const a = m.atoms[i][0], b = m.atoms[j][0], d = CHI[a] - CHI[b];
    if (Math.abs(d) >= 0.4) { if (d > 0) { q[i] -= 1; q[j] += 1; } else { q[i] += 1; q[j] -= 1; } }
  });
  const don = [], acc = [];
  m.atoms.forEach(([el], i) => {
    if (el === 'O' || el === 'N') acc.push(i);
    if (el === 'H') { const lie = m.bonds.find(([a, b]) => a === i || b === i); if (lie) { const o = m.atoms[lie[0] === i ? lie[1] : lie[0]][0]; if (o === 'O' || o === 'N') don.push(i); } }
  });
  // liaisons H internes : le H et l'accepteur engagés ne sont plus disponibles pour le solvant
  (m.hbInterne || []).forEach(([h, a]) => { const ih = don.indexOf(h); if (ih >= 0) don.splice(ih, 1); const ia = acc.indexOf(a); if (ia >= 0) acc.splice(ia, 1); });
  let plus = -1, moins = -1;
  q.forEach((v, i) => { if (v > 0 && (plus < 0 || v > q[plus])) plus = i; if (v < 0 && (moins < 0 || v < q[moins])) moins = i; });
  return { q, don, acc, plus, moins };
}
export const ANA = Object.fromEntries(Object.entries(ESPECES).map(([k, m]) => [k, analyser(m)]));

export const TYPES = [
  { k: 'd', nom: 'dipôles instantanés (Van der Waals)', court: 'dispersion', col: '#6b7280' },
  { k: 'p', nom: 'dipôles permanents (Van der Waals)', court: 'dipôle–dipôle', col: '#ea580c' },
  { k: 'h', nom: 'liaison hydrogène', court: 'liaison H', col: '#2563eb' },
];
const dl = (m, k) => m['d' + k];

// complémentarité liaison H : l'un peut donner, l'autre accepter (dans un sens au moins)
export function complementaire(a, b) {
  const A = ANA[a], B = ANA[b];
  return (A.don.length > 0 && B.acc.length > 0) || (B.don.length > 0 && A.acc.length > 0);
}
// Poids de la liaison H croisée. Une liaison H S…E ne remplace les liaisons S…S et E…E que si les sites
// (H donneurs et doublets accepteurs libres) sont assez nombreux par unité de volume dans les DEUX espèces.
// Quand les sites d'une espèce sont dilués dans une grande partie apolaire (octanol, huile, rouge Soudan…),
// la plupart des contacts avec l'autre espèce se font par cette partie apolaire.
// w = 0 sans complémentarité donneur/accepteur ; sinon w = min(1, (ρ_min / ρ_ref)²), ρ = sites libres / V.
export const RHO_REF = 0.04;   // mol de sites par cm³ (≈ éthanol : 2 sites pour 58 cm³/mol)
export const densiteSites = k => (ANA[k].don.length + ANA[k].acc.length) / ESPECES[k].V;
export function poidsH(a, b) {
  if (!complementaire(a, b)) return 0;
  return Math.min(1, (Math.min(densiteSites(a), densiteSites(b)) / RHO_REF) ** 2);
}
// énergie volumique de cohésion croisée (J/cm³ = MPa) pour un type donné
export function croise(a, b, k) {
  const A = ESPECES[a], B = ESPECES[b], da = dl(A, k), db = dl(B, k), geo = da * db;
  if (k !== 'h') return geo;                                   // moyenne géométrique (Berthelot)
  return geo + poidsH(a, b) * ((da * da + db * db) / 2 - geo); // entre moyenne géométrique et moyenne arithmétique
}
// part polaire de la cohésion : (δp² + δh²) / (δd² + δp² + δh²) — le « continuum » entre apolaire et polaire
export function partPolaire(k) {
  const m = ESPECES[k]; if (m.famille === 'ion') return 1;
  return (m.dp ** 2 + m.dh ** 2) / (m.dd ** 2 + m.dp ** 2 + m.dh ** 2);
}

// Liquides : ce que l'agitation thermique peut compenser dépend de la taille des molécules (Flory–Huggins) :
// perte critique (kJ par litre de mélange 50/50) = RT · ½ (1/√V_A + 1/√V_B)² × 1000.
export function perteCritique(a, b) { return RT * 0.5 * (1 / Math.sqrt(ESPECES[a].V) + 1 / Math.sqrt(ESPECES[b].V)) ** 2 * 1000; }
// seuils (repères réglés sur une batterie de cas connus, cf. hypothèses)
export const SEUIL_LIQ = [1.25, 2];       // rapport perte / perte critique
export const SEUIL_SOL = [25, 70];        // kJ par mole de soluté (≈ 10 RT et 28 RT)
export const SEUIL_ION = [3 * RT, 22];    // kJ/mol (attraction résiduelle Na⁺/Cl⁻ dans le solvant)

function classe(val, [s1, s2]) { return val < s1 ? 'ok' : val < s2 ? 'lim' : 'non'; }

// bilan « état initial → état final » pour un soluté E (liquide, solide moléculaire ou ionique) dans un solvant S
export function bilan(solv, sol) {
  const S = ESPECES[solv], E = ESPECES[sol];
  if (E.famille === 'ion') {
    const vide = K_COULOMB / D_NACL, dans = vide / S.eps;
    return { kind: 'ion', vide, dans, classe: classe(dans, SEUIL_ION), total: dans };
  }
  const liquide = E.famille === 'liq';
  const types = TYPES.map(t => {
    const cS = dl(S, t.k) ** 2, cE = dl(E, t.k) ** 2, cx = croise(solv, sol, t.k);
    let ini, fin;
    if (liquide) { ini = 0.5 * (cS + cE); fin = 0.25 * cS + 0.25 * cE + 0.5 * cx; }          // kJ/L (mélange 50/50 en volume)
    else { ini = E.V * (cE + cS) / 1000; fin = 2 * E.V * cx / 1000; }                       // kJ/mol de soluté
    return { ...t, ini, fin, perte: ini - fin };
  });
  const total = types.reduce((s, t) => s + Math.max(0, t.perte), 0);
  const dom = types.reduce((m, t) => (t.perte > m.perte ? t : m), types[0]);
  const crit = liquide ? perteCritique(solv, sol) : null, rapport = liquide ? total / crit : null;
  return { kind: liquide ? 'liq' : 'mol', types, total, dom, crit, rapport, w: poidsH(solv, sol),
    classe: liquide ? classe(rapport, SEUIL_LIQ) : classe(total, SEUIL_SOL), comp: complementaire(solv, sol) };
}

// batterie de cas connus : [solvant, soluté, résultat réel : 'ok' | 'lim' | 'non']
export const BATTERIE = [
  ['eau', 'ethanol', 'ok'], ['eau', 'methanol', 'ok'], ['eau', 'acetone', 'ok'], ['eau', 'propanol', 'ok'], ['eau', 'glycerol', 'ok'],
  ['eau', 'butanol', 'lim'], ['eau', 'ether', 'lim'], ['eau', 'acetate', 'lim'],
  ['eau', 'hexane', 'non'], ['eau', 'cyclohexane', 'non'], ['eau', 'toluene', 'non'], ['eau', 'ccl4', 'non'], ['eau', 'dcm', 'non'], ['eau', 'huile', 'non'],
  ['ethanol', 'hexane', 'lim'], ['ethanol', 'cyclohexane', 'lim'], ['ethanol', 'toluene', 'ok'], ['ethanol', 'acetone', 'ok'], ['ethanol', 'ether', 'ok'],
  ['ethanol', 'acetate', 'ok'], ['ethanol', 'glycerol', 'ok'], ['ethanol', 'huile', 'lim'], ['methanol', 'hexane', 'lim'], ['methanol', 'cyclohexane', 'lim'],
  ['hexane', 'cyclohexane', 'ok'], ['hexane', 'toluene', 'ok'], ['hexane', 'ccl4', 'ok'], ['hexane', 'acetone', 'ok'], ['hexane', 'huile', 'ok'],
  ['hexane', 'glycerol', 'non'], ['acetone', 'ccl4', 'ok'], ['glycerol', 'ether', 'non'],
  ['cyclohexane', 'naphtalene', 'ok'], ['hexane', 'naphtalene', 'ok'], ['toluene', 'naphtalene', 'ok'], ['ethanol', 'naphtalene', 'lim'], ['eau', 'naphtalene', 'non'],
  ['cyclohexane', 'diiode', 'ok'], ['ethanol', 'diiode', 'lim'], ['eau', 'diiode', 'non'],
  ['propanol', 'hexane', 'ok'], ['butanol', 'hexane', 'ok'], ['acetate', 'hexane', 'ok'], ['dcm', 'hexane', 'ok'], ['dcm', 'ethanol', 'ok'], ['toluene', 'acetone', 'ok'],
  ['ether', 'hexane', 'ok'], ['glycerol', 'toluene', 'non'], ['glycerol', 'huile', 'non'], ['ether', 'huile', 'ok'], ['butanol', 'toluene', 'ok'], ['acetate', 'toluene', 'ok'],
  ['ethanol', 'ccl4', 'ok'], ['methanol', 'toluene', 'lim'], ['methanol', 'acetone', 'ok'], ['methanol', 'ethanol', 'ok'], ['glycerol', 'ccl4', 'non'], ['methanol', 'ccl4', 'lim'],
  ['toluene', 'diiode', 'ok'], ['acetone', 'naphtalene', 'ok'], ['acetone', 'diiode', 'ok'],
  ['eau', 'pentanol', 'lim'], ['eau', 'octanol', 'non'], ['ethanol', 'octanol', 'ok'], ['hexane', 'octanol', 'ok'], ['acetone', 'octanol', 'ok'],
  ['eau', 'soudan', 'non'], ['ethanol', 'soudan', 'lim'], ['huile', 'soudan', 'ok'], ['hexane', 'soudan', 'ok'], ['cyclohexane', 'soudan', 'ok'],
  ['eau', 'carmin', 'lim'], ['ethanol', 'carmin', 'ok'], ['huile', 'carmin', 'non'], ['hexane', 'carmin', 'non'],
  ['eau', 'nacl', 'ok'], ['methanol', 'nacl', 'lim'], ['ethanol', 'nacl', 'lim'], ['acetone', 'nacl', 'non'], ['hexane', 'nacl', 'non'], ['toluene', 'nacl', 'non'], ['huile', 'nacl', 'non'],
];
