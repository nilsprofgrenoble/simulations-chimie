// ====================================================
//  Modèle de la simulation « Solubilité et miscibilité : le bilan des interactions »
//  Cohésion de chaque espèce décomposée en 3 types d'interactions (Hildebrand–Hansen) :
//    d : Van der Waals, dipôles instantanés (dispersion)   — δd
//    p : Van der Waals, dipôles permanents                  — δp
//    h : liaison hydrogène                                  — δh
//  Valeurs δ (MPa^½) arrondies d'après les tables de Hansen ; V = volume molaire (cm³/mol) ; eps = permittivité relative.
//  « estime » : valeur estimée par nos soins (non tabulée), à manier avec prudence.
// ====================================================

export const RT = 2.479;                 // kJ/mol à 298 K
export const K_COULOMB = 1389.35;        // N_A·e²/(4π ε0) en kJ·Å/mol
export const D_NACL = 2.82;              // Å (distance Na⁺…Cl⁻ dans le cristal)

const Z = n => Array.from({ length: n }, (_, i) => ['C', i * 0.866, i % 2 ? 0.5 : 0]);
const zb = n => Array.from({ length: n - 1 }, (_, i) => [i, i + 1, 1]);
const hex = (cx, cy) => [0, 1, 2, 3, 4, 5].map(k => ['C', cx + Math.cos(Math.PI / 3 * k), cy + Math.sin(Math.PI / 3 * k)]);

export const ESPECES = {
  eau: { nom: 'eau', formule: 'H₂O', famille: 'liq', dd: 15.5, dp: 16.0, dh: 42.3, V: 18.0, eps: 78.4,
    atoms: [['O', 0, 0], ['H', -0.78, 0.6], ['H', 0.78, 0.6]], bonds: [[0, 1, 1], [0, 2, 1]] },
  methanol: { nom: 'méthanol', formule: 'CH₃OH', famille: 'liq', dd: 15.1, dp: 12.3, dh: 22.3, V: 40.7, eps: 32.7,
    atoms: [['C', 0, 0], ['O', 0.87, 0.5], ['H', 1.74, 0]], bonds: [[0, 1, 1], [1, 2, 1]] },
  ethanol: { nom: 'éthanol', formule: 'C₂H₅OH', famille: 'liq', dd: 15.8, dp: 8.8, dh: 19.4, V: 58.5, eps: 24.5,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['O', 1.73, 0], ['H', 2.6, 0.5]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1]] },
  propanol: { nom: 'propan-1-ol', formule: 'C₃H₇OH', famille: 'liq', dd: 16.0, dp: 6.8, dh: 17.4, V: 75.2, eps: 20.3,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['O', 2.6, 0.5], ['H', 3.46, 0]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]] },
  butanol: { nom: 'butan-1-ol', formule: 'C₄H₉OH', famille: 'liq', dd: 16.0, dp: 5.7, dh: 15.8, V: 91.5, eps: 17.5,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['C', 2.6, 0.5], ['O', 3.46, 0], ['H', 4.33, 0.5]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1]] },
  glycerol: { nom: 'glycérol', formule: 'C₃H₈O₃', famille: 'liq', dd: 17.4, dp: 12.1, dh: 29.3, V: 73.3, eps: 42.5,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['C', 1.73, 0], ['O', -0.87, 0.5], ['H', -1.73, 0], ['O', 0.87, 1.5], ['H', 1.73, 2.0], ['O', 2.6, 0.5], ['H', 3.46, 0]],
    bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [3, 4, 1], [1, 5, 1], [5, 6, 1], [2, 7, 1], [7, 8, 1]] },
  acetone: { nom: 'acétone', formule: 'C₃H₆O', famille: 'liq', dd: 15.5, dp: 10.4, dh: 7.0, V: 74.0, eps: 20.7,
    atoms: [['C', 0, 0], ['O', 0, 1], ['C', -0.87, -0.5], ['C', 0.87, -0.5]], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1]] },
  ether: { nom: 'éther diéthylique', formule: 'C₄H₁₀O', famille: 'liq', dd: 14.5, dp: 2.9, dh: 5.1, V: 104.8, eps: 4.3,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['O', 1.73, 0], ['C', 2.6, 0.5], ['C', 3.46, 0]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]] },
  acetate: { nom: "acétate d'éthyle", formule: 'C₄H₈O₂', famille: 'liq', dd: 15.8, dp: 5.3, dh: 7.2, V: 98.5, eps: 6.0,
    atoms: [['C', 0, 0], ['C', 0.87, 0.5], ['O', 0.87, 1.5], ['O', 1.73, 0], ['C', 2.6, 0.5], ['C', 3.46, 0]], bonds: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1], [4, 5, 1]] },
  dcm: { nom: 'dichlorométhane', formule: 'CH₂Cl₂', famille: 'liq', dd: 17.0, dp: 7.3, dh: 7.1, V: 63.9, eps: 8.9,
    atoms: [['C', 0, 0], ['Cl', -0.85, 0.6], ['Cl', 0.85, 0.6]], bonds: [[0, 1, 1], [0, 2, 1]] },
  ccl4: { nom: 'tétrachlorométhane', formule: 'CCl₄', famille: 'liq', dd: 17.8, dp: 0.0, dh: 0.6, V: 97.1, eps: 2.2,
    atoms: [['C', 0, 0], ['Cl', 0, 0.95], ['Cl', 0, -0.95], ['Cl', 0.95, 0], ['Cl', -0.95, 0]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  hexane: { nom: 'hexane', formule: 'C₆H₁₄', famille: 'liq', dd: 14.9, dp: 0.0, dh: 0.0, V: 131.6, eps: 1.9,
    atoms: Z(6), bonds: zb(6) },
  cyclohexane: { nom: 'cyclohexane', formule: 'C₆H₁₂', famille: 'liq', dd: 16.8, dp: 0.0, dh: 0.2, V: 108.7, eps: 2.0,
    atoms: hex(0, 0), bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 0, 1]] },
  toluene: { nom: 'toluène', formule: 'C₇H₈', famille: 'liq', dd: 18.0, dp: 1.4, dh: 2.0, V: 106.8, eps: 2.4,
    atoms: [...hex(0, 0), ['C', 2, 0]], bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [0, 6, 1]] },
  huile: { nom: 'huile de colza (triglycéride)', formule: 'triglycéride', famille: 'liq', estime: true, dd: 16.2, dp: 3.5, dh: 4.5, V: 970, eps: 3.1,
    note: "Formule simplifiée : R = longue chaîne carbonée (≈ 17 C). Valeurs δ estimées.",
    atoms: [['C', 0, 0], ['C', 0, 2.2], ['C', 0, 4.4],
      ['O', 0.9, 0], ['C', 1.8, 0], ['O', 1.8, 0.95], ['R', 2.8, 0],
      ['O', 0.9, 2.2], ['C', 1.8, 2.2], ['O', 1.8, 3.15], ['R', 2.8, 2.2],
      ['O', 0.9, 4.4], ['C', 1.8, 4.4], ['O', 1.8, 5.35], ['R', 2.8, 4.4]],
    bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [3, 4, 1], [4, 5, 2], [4, 6, 1], [1, 7, 1], [7, 8, 1], [8, 9, 2], [8, 10, 1], [2, 11, 1], [11, 12, 1], [12, 13, 2], [12, 14, 1]] },
  naphtalene: { nom: 'naphtalène (solide)', formule: 'C₁₀H₈', famille: 'mol', dd: 19.2, dp: 2.0, dh: 5.9, V: 123, eps: 2.5,
    atoms: [['C', 0, 1], ['C', -0.87, 0.5], ['C', -0.87, -0.5], ['C', 0, -1], ['C', 0.87, -0.5], ['C', 0.87, 0.5], ['C', 1.73, 1], ['C', 1.73, -1], ['C', 2.6, -0.5], ['C', 2.6, 0.5]],
    bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [5, 6, 1], [6, 9, 2], [9, 8, 1], [8, 7, 2], [7, 4, 1]] },
  diiode: { nom: 'diiode (solide)', formule: 'I₂', famille: 'mol', estime: true, dd: 28.0, dp: 0.0, dh: 0.0, V: 59, eps: 1,
    note: "δ du diiode estimé à partir de sa paramètre de solubilité de Hildebrand (≈ 29 MPa^½).",
    atoms: [['I', 0, 0], ['I', 1.5, 0]], bonds: [[0, 1, 1]] },
  nacl: { nom: 'chlorure de sodium (solide ionique)', formule: 'NaCl', famille: 'ion', V: 27, eps: 1, atoms: [], bonds: [] },
};
export const ORDRE_LIQ = ['eau', 'methanol', 'ethanol', 'propanol', 'butanol', 'glycerol', 'acetone', 'ether', 'acetate', 'dcm', 'ccl4', 'toluene', 'cyclohexane', 'hexane', 'huile'];
export const ORDRE_SOL = ['naphtalene', 'diiode', 'nacl'];

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
// et assez de sites (donneurs + accepteurs) par unité de volume pour qu'ils soient « à portée » : au moins 1 site pour 125 cm³/mol
// (dans l'huile, les quelques sites accepteurs sont dilués dans de longues chaînes carbonées).
export const DENSITE_SITES_MIN = 1 / 125;
const densite = k => (ANA[k].don.length + ANA[k].acc.length) / ESPECES[k].V;
export function complementaire(a, b) {
  const A = ANA[a], B = ANA[b];
  const comp = (A.don.length > 0 && B.acc.length > 0) || (B.don.length > 0 && A.acc.length > 0);
  return comp && densite(a) >= DENSITE_SITES_MIN && densite(b) >= DENSITE_SITES_MIN;
}
// énergie volumique de cohésion croisée (J/cm³ = MPa) pour un type donné
export function croise(a, b, k) {
  const A = ESPECES[a], B = ESPECES[b], da = dl(A, k), db = dl(B, k);
  if (k === 'h' && complementaire(a, b)) return (da * da + db * db) / 2;
  return da * db;
}

// seuils (calibrés sur la batterie de cas connus, cf. hypothèses)
export const SEUIL_LIQ = [25, 200];       // kJ par litre de mélange 50/50 en volume
export const SEUIL_SOL = [10, 40];        // kJ par mole de soluté
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
  return { kind: liquide ? 'liq' : 'mol', types, total, dom, classe: classe(total, liquide ? SEUIL_LIQ : SEUIL_SOL), comp: complementaire(solv, sol) };
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
  ['eau', 'nacl', 'ok'], ['methanol', 'nacl', 'lim'], ['ethanol', 'nacl', 'lim'], ['acetone', 'nacl', 'non'], ['hexane', 'nacl', 'non'], ['toluene', 'nacl', 'non'], ['huile', 'nacl', 'non'],
];
