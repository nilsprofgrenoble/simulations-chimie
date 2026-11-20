// ====================================================
//  Modèle de la simulation 210 : stratégie de synthèse multi-étapes, protection / déprotection, synthèse écoresponsable (TG spé PC).
//  Capacités visées (jamais affichées) : élaborer une séquence réactionnelle à partir d'une banque de réactions ; identifier des réactions
//  d'oxydo-réduction, acide-base, de substitution, d'addition, d'élimination ; identifier des étapes de protection / déprotection et justifier
//  leur intérêt ; discuter l'impact environnemental d'une synthèse à l'aide de données fournies.
//  Modèle : chaque molécule est un graphe (atomes + liaisons + coordonnées du dessin) ; la formule brute est CALCULÉE depuis le graphe
//  (valence : C 4, O 2, Br 1, O⁻ 1), ce qui permet de vérifier par programme la conservation des atomes de chaque réaction de la banque.
//  Les rendements d'étape et les données de la partie écoresponsable sont FOURNIS (fictifs mais plausibles) : ils ne sont pas des mesures.
//  Test : strModele.test.mjs.
// ====================================================

const C30 = Math.cos(Math.PI / 6);
// zigzag : sommet k de la chaîne (k pair en bas, k impair en haut) ; sub(k) : position d'un substituant porté par le sommet k, sur la bissectrice extérieure
const z = k => [k * C30, k % 2 ? 0.5 : 0];
const sub = k => [k * C30, k % 2 ? 1.5 : -1];
const R5 = 0.8507; // rayon du pentagone régulier de côté 1

// atomes : [élément, [x, y], charge?] ; liaisons : [i, j, ordre]
const mol = (id, nom, groupes, atomes, liaisons) => ({ id, nom, groupes, atomes: atomes.map(([e, p, q]) => ({ e, x: p[0], y: p[1], q: q || 0 })), liaisons });

export const MOLS = {
  A: mol('A', 'éthène', ['alcène'], [['C', z(0)], ['C', z(1)]], [[0, 1, 2]]),
  B: mol('B', 'bromoéthane', ['halogénoalcane'], [['C', z(0)], ['C', z(1)], ['Br', z(2)]], [[0, 1, 1], [1, 2, 1]]),
  C: mol('C', 'éthanol', ['alcool primaire'], [['C', z(0)], ['C', z(1)], ['O', z(2)]], [[0, 1, 1], [1, 2, 1]]),
  D: mol('D', 'éthanal', ['aldéhyde'], [['C', z(0)], ['C', z(1)], ['O', z(2)]], [[0, 1, 1], [1, 2, 2]]),
  E: mol('E', 'acide éthanoïque', ['acide carboxylique'], [['C', z(0)], ['C', z(1)], ['O', z(2)], ['O', sub(1)]], [[0, 1, 1], [1, 2, 1], [1, 3, 2]]),
  F: mol('F', 'ion éthanoate', ['ion carboxylate'], [['C', z(0)], ['C', z(1)], ['O', z(2), -1], ['O', sub(1)]], [[0, 1, 1], [1, 2, 1], [1, 3, 2]]),
  G: mol('G', 'éthanoate d’éthyle', ['ester'], [['C', z(0)], ['C', z(1)], ['O', z(2)], ['C', z(3)], ['C', z(4)], ['O', sub(1)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [1, 5, 2]]),
  H: mol('H', 'propan-2-ol', ['alcool secondaire'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', sub(1)]], [[0, 1, 1], [1, 2, 1], [1, 3, 1]]),
  I: mol('I', 'propanone', ['cétone'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', sub(1)]], [[0, 1, 1], [1, 2, 1], [1, 3, 2]]),
  J: mol('J', 'propène', ['alcène'], [['C', z(0)], ['C', z(1)], ['C', z(2)]], [[0, 1, 2], [1, 2, 1]]),
  K: mol('K', 'propan-1-ol', ['alcool primaire'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', z(3)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1]]),
  L: mol('L', 'propanal', ['aldéhyde'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', z(3)]], [[0, 1, 1], [1, 2, 1], [2, 3, 2]]),
  M: mol('M', 'acide propanoïque', ['acide carboxylique'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', z(3)], ['O', sub(2)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [2, 4, 2]]),
  N: mol('N', 'propanoate d’éthyle', ['ester'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', z(3)], ['C', z(4)], ['C', z(5)], ['O', sub(2)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [2, 6, 2]]),
  O: mol('O', 'ion propanoate', ['ion carboxylate'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', z(3), -1], ['O', sub(2)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [2, 4, 2]]),
  // molécule polyfonctionnelle (protection / déprotection)
  Q: mol('Q', '4-oxopentanoate d’éthyle', ['cétone', 'ester'],
    [['C', z(0)], ['C', z(1)], ['C', z(2)], ['C', z(3)], ['C', z(4)], ['O', z(5)], ['C', z(6)], ['C', z(7)], ['O', sub(1)], ['O', sub(4)]],
    [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [1, 8, 2], [4, 9, 2]]),
  P: mol('P', '3-(2-méthyl-1,3-dioxolan-2-yl)propanoate d’éthyle', ['acétal', 'ester'],
    [['C', [0, 0.85]], ['O', [-0.809, 0.263]], ['C', [-0.5, -0.688]], ['C', [0.5, -0.688]], ['O', [0.809, 0.263]], ['C', [-0.866, 1.35]],
      ['C', [0.866, 1.35]], ['C', [1.732, 0.85]], ['C', [2.598, 1.35]], ['O', [3.464, 0.85]], ['C', [4.33, 1.35]], ['C', [5.196, 0.85]], ['O', [2.598, 2.35]]],
    [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 0, 1], [0, 5, 1], [0, 6, 1], [6, 7, 1], [7, 8, 1], [8, 9, 1], [9, 10, 1], [10, 11, 1], [8, 12, 2]]),
  W: mol('W', '3-(2-méthyl-1,3-dioxolan-2-yl)propan-1-ol', ['acétal', 'alcool primaire'],
    [['C', [0, 0.85]], ['O', [-0.809, 0.263]], ['C', [-0.5, -0.688]], ['C', [0.5, -0.688]], ['O', [0.809, 0.263]], ['C', [-0.866, 1.35]],
      ['C', [0.866, 1.35]], ['C', [1.732, 0.85]], ['C', [2.598, 1.35]], ['O', [3.464, 0.85]]],
    [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 0, 1], [0, 5, 1], [0, 6, 1], [6, 7, 1], [7, 8, 1], [8, 9, 1]]),
  T: mol('T', '5-hydroxypentan-2-one', ['cétone', 'alcool primaire'],
    [['C', z(0)], ['C', z(1)], ['C', z(2)], ['C', z(3)], ['C', z(4)], ['O', z(5)], ['O', sub(1)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [1, 6, 2]]),
  S: mol('S', '4-hydroxypentanoate d’éthyle', ['alcool secondaire', 'ester'],
    [['C', z(0)], ['C', z(1)], ['C', z(2)], ['C', z(3)], ['C', z(4)], ['O', z(5)], ['C', z(6)], ['C', z(7)], ['O', sub(1)], ['O', sub(4)]],
    [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [1, 8, 1], [4, 9, 2]]),
  U: mol('U', 'pentane-1,4-diol', ['alcool primaire', 'alcool secondaire'],
    [['C', z(0)], ['C', z(1)], ['C', z(2)], ['C', z(3)], ['C', z(4)], ['O', z(5)], ['O', sub(1)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [1, 6, 1]]),
  // réactif organique de la protection
  X: mol('X', 'éthane-1,2-diol', ['diol'], [['O', z(0)], ['C', z(1)], ['C', z(2)], ['O', z(3)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1]]),
};

// espèces simples des bilans (formules fournies : atomes et charge)
export const ESPECES = {
  eau: { nom: 'eau', formule: 'H₂O', atomes: { H: 2, O: 1 }, charge: 0 },
  HBr: { nom: 'bromure d’hydrogène', formule: 'HBr', atomes: { H: 1, Br: 1 }, charge: 0 },
  HO: { nom: 'ion hydroxyde', formule: 'HO⁻', atomes: { H: 1, O: 1 }, charge: -1 },
  Br: { nom: 'ion bromure', formule: 'Br⁻', atomes: { Br: 1 }, charge: -1 },
  ox: { nom: 'oxydant (bilan simplifié : un atome d’oxygène « [O] »)', formule: '[O]', atomes: { O: 1 }, charge: 0, simplifie: true },
  H2: { nom: 'réducteur (bilan simplifié : deux atomes d’hydrogène « 2 [H] »)', formule: '2 [H]', atomes: { H: 2 }, charge: 0, simplifie: true },
};

// ---------- formule brute calculée depuis le graphe ----------
const VALENCE = { C: 4, O: 2, Br: 1 };
const valenceAtome = a => VALENCE[a.e] + (a.e === 'O' ? a.q : 0);   // O⁻ : valence 1
export const somme = (m, i) => m.liaisons.reduce((s, [a, b, o]) => s + (a === i || b === i ? o : 0), 0);
export const nbH = (m, i) => valenceAtome(m.atomes[i]) - somme(m, i);
export function brute(m) {
  const t = { C: 0, H: 0, O: 0, Br: 0 }; let charge = 0;
  m.atomes.forEach((a, i) => { t[a.e]++; t.H += nbH(m, i); charge += a.q; });
  return { atomes: Object.fromEntries(Object.entries(t).filter(([, n]) => n > 0)), charge };
}
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const indice = n => (n === 1 ? '' : String(n).split('').map(c => SUBS[+c]).join(''));
export function formuleTexte(b) {
  const { atomes, charge } = b, ordre = ['C', 'H', 'Br', 'O'];
  const s = ordre.filter(e => atomes[e]).map(e => e + indice(atomes[e])).join('');
  return s + (charge === -1 ? '⁻' : charge === 1 ? '⁺' : '');
}
export const formule = m => formuleTexte(brute(m));
export const valide = m => m.atomes.every((_, i) => nbH(m, i) >= 0);
export const especeDe = id => (MOLS[id] ? { ...brute(MOLS[id]), nom: MOLS[id].nom } : { atomes: ESPECES[id].atomes, charge: ESPECES[id].charge, nom: ESPECES[id].nom });
export const nomEspece = id => (MOLS[id] ? MOLS[id].nom : ESPECES[id].nom);
export const formuleEspece = id => (MOLS[id] ? formule(MOLS[id]) : ESPECES[id].formule);

// ---------- types ----------
export const TYPES = ['oxydo-réduction', 'acide-base', 'substitution', 'addition', 'élimination'];

// ---------- banque générale : 9 réactions ----------
// requiert : groupes caractéristiques (un seul suffit) ; apps : molécule de départ → { prod: [produits], co: [co-produits ou réactifs associés], eq }
// eq : bilan { r: [[coefficient, espèce], …], p: [[coefficient, espèce], …] } (ou fournis), contrôlé par programme.
// rendement : donnée fournie (ordre de grandeur plausible, fictive) pour calculer un rendement global.
export const BANQUE_GENERALE = [
  { id: 'R1', nom: 'Oxydation ménagée d’un alcool primaire', type: 'oxydo-réduction', requiert: ['alcool primaire'], exemple: ['K', 'L'], rendement: 65,
    reactifs: 'ions dichromate (oxydant ménagé) en milieu acide, en quantité limitée', conditions: 'on distille l’aldéhyde au fur et à mesure de sa formation',
    apps: { C: { prod: ['D'], eq: { r: [[1, 'C'], [1, 'ox']], p: [[1, 'D'], [1, 'eau']] } }, K: { prod: ['L'], eq: { r: [[1, 'K'], [1, 'ox']], p: [[1, 'L'], [1, 'eau']] } } } },
  { id: 'R2', nom: 'Oxydation d’un aldéhyde', type: 'oxydo-réduction', requiert: ['aldéhyde'], exemple: ['D', 'E'], rendement: 90,
    reactifs: 'ions permanganate ou dichromate (oxydant) en milieu acide, en excès', conditions: 'chauffage à reflux',
    apps: { D: { prod: ['E'], eq: { r: [[1, 'D'], [1, 'ox']], p: [[1, 'E']] } }, L: { prod: ['M'], eq: { r: [[1, 'L'], [1, 'ox']], p: [[1, 'M']] } } } },
  { id: 'R3', nom: 'Oxydation d’un alcool secondaire', type: 'oxydo-réduction', requiert: ['alcool secondaire'], exemple: ['H', 'I'], rendement: 90,
    reactifs: 'ions permanganate ou dichromate (oxydant) en milieu acide', conditions: 'chauffage doux',
    apps: { H: { prod: ['I'], eq: { r: [[1, 'H'], [1, 'ox']], p: [[1, 'I'], [1, 'eau']] } } } },
  { id: 'R4', nom: 'Réduction d’un aldéhyde ou d’une cétone', type: 'oxydo-réduction', requiert: ['aldéhyde', 'cétone'], exemple: ['I', 'H'], rendement: 85,
    reactifs: 'NaBH₄ (borohydrure de sodium, réducteur) dans l’éthanol', conditions: 'température ambiante, puis ajout d’acide dilué',
    apps: { D: { prod: ['C'], eq: { r: [[1, 'D'], [1, 'H2']], p: [[1, 'C']] } }, L: { prod: ['K'], eq: { r: [[1, 'L'], [1, 'H2']], p: [[1, 'K']] } }, I: { prod: ['H'], eq: { r: [[1, 'I'], [1, 'H2']], p: [[1, 'H']] } } } },
  { id: 'R5', nom: 'Action d’une base sur un acide carboxylique', type: 'acide-base', requiert: ['acide carboxylique'], exemple: ['E', 'F'], rendement: 98,
    reactifs: 'ions hydroxyde HO⁻ (soude) en solution aqueuse', conditions: 'température ambiante',
    apps: { E: { prod: ['F'], eq: { r: [[1, 'E'], [1, 'HO']], p: [[1, 'F'], [1, 'eau']] } }, M: { prod: ['O'], eq: { r: [[1, 'M'], [1, 'HO']], p: [[1, 'O'], [1, 'eau']] } } } },
  { id: 'R6', nom: 'Estérification d’un acide carboxylique par l’éthanol', type: 'substitution', requiert: ['acide carboxylique'], exemple: ['E', 'G'], rendement: 67,
    reactifs: 'éthanol (disponible au laboratoire) et quelques gouttes d’acide sulfurique concentré (catalyseur)', conditions: 'chauffage à reflux',
    apps: { E: { prod: ['G'], eq: { r: [[1, 'E'], [1, 'C']], p: [[1, 'G'], [1, 'eau']] } }, M: { prod: ['N'], eq: { r: [[1, 'M'], [1, 'C']], p: [[1, 'N'], [1, 'eau']] } } } },
  { id: 'R7', nom: 'Action des ions hydroxyde sur un bromoalcane', type: 'substitution', requiert: ['halogénoalcane'], exemple: ['B', 'C'], rendement: 80,
    reactifs: 'ions hydroxyde HO⁻ en solution aqueuse', conditions: 'chauffage modéré',
    apps: { B: { prod: ['C'], eq: { r: [[1, 'B'], [1, 'HO']], p: [[1, 'C'], [1, 'Br']] } } } },
  { id: 'R8', nom: 'Action du bromure d’hydrogène sur un alcène', type: 'addition', requiert: ['alcène'], exemple: ['A', 'B'], rendement: 90,
    reactifs: 'bromure d’hydrogène HBr', conditions: 'température ambiante',
    apps: { A: { prod: ['B'], eq: { r: [[1, 'A'], [1, 'HBr']], p: [[1, 'B']] } } },
    refus: { J: 'Avec le propène (alcène dissymétrique), deux produits sont possibles et la banque ne dit pas lequel se forme : ce cas n’est pas traité ici.' } },
  { id: 'R9', nom: 'Chauffage d’un alcool avec l’acide sulfurique concentré', type: 'élimination', requiert: ['alcool primaire', 'alcool secondaire'], exemple: ['C', 'A'], rendement: 70,
    reactifs: 'acide sulfurique concentré (déshydratant)', conditions: 'chauffage vers 170 °C',
    apps: { C: { prod: ['A'], eq: { r: [[1, 'C']], p: [[1, 'A'], [1, 'eau']] } }, H: { prod: ['J'], eq: { r: [[1, 'H']], p: [[1, 'J'], [1, 'eau']] } }, K: { prod: ['J'], eq: { r: [[1, 'K']], p: [[1, 'J'], [1, 'eau']] } } } },
];

// ---------- banque de la molécule polyfonctionnelle : protection / déprotection ----------
export const BANQUE_PROTECTION = [
  { id: 'P1', nom: 'Réaction d’une cétone avec l’éthane-1,2-diol', requiert: ['cétone'], exemple: ['Q', 'P'], rendement: 85, role: 'protection',
    reactifs: 'éthane-1,2-diol et quelques cristaux d’acide (catalyseur), dans le toluène', conditions: 'chauffage à reflux, eau formée éliminée au fur et à mesure (Dean-Stark)',
    apps: { Q: { prod: ['P'], eq: { r: [[1, 'Q'], [1, 'X']], p: [[1, 'P'], [1, 'eau']] } } },
    refus: { T: 'La banque ne propose pas cette réaction sur la molécule T : elle ne sert pas ici.' } },
  { id: 'P2', nom: 'Réduction par NaBH₄', requiert: ['aldéhyde', 'cétone'], exemple: ['Q', 'S'], rendement: 90,
    reactifs: 'NaBH₄ (borohydrure de sodium) dans l’éthanol', conditions: 'température ambiante ; réduit les aldéhydes et les cétones, pas les esters',
    apps: { Q: { prod: ['S'], eq: { r: [[1, 'Q'], [1, 'H2']], p: [[1, 'S']] }, remarque: 'NaBH₄ réduit la cétone mais laisse l’ester intact : on obtient un alcool secondaire et le groupe ester est conservé.' },
      T: { prod: ['U'], eq: { r: [[1, 'T'], [1, 'H2']], p: [[1, 'U']] } } } },
  { id: 'P3', nom: 'Réduction par LiAlH₄', requiert: ['ester'], exemple: ['Q', 'U'], rendement: 85,
    reactifs: 'LiAlH₄ (hydrure de lithium et d’aluminium) dans l’éther anhydre, puis ajout d’eau', conditions: 'réduit les esters, mais aussi les aldéhydes et les cétones ; ne réagit pas avec un acétal',
    apps: { P: { prod: ['W'], co: ['C'], eq: { r: [[1, 'P'], [2, 'H2']], p: [[1, 'W'], [1, 'C']] } },
      Q: { prod: ['U'], co: ['C'], eq: { r: [[1, 'Q'], [3, 'H2']], p: [[1, 'U'], [1, 'C']] }, remarque: 'LiAlH₄ réduit ici les deux groupes : l’ester et la cétone.' },
      S: { prod: ['U'], co: ['C'], eq: { r: [[1, 'S'], [2, 'H2']], p: [[1, 'U'], [1, 'C']] } } } },
  { id: 'P4', nom: 'Hydrolyse d’un acétal en milieu acide', requiert: ['acétal'], exemple: ['P', 'Q'], rendement: 90, role: 'déprotection',
    reactifs: 'eau en grand excès et acide (H₃O⁺)', conditions: 'température ambiante',
    apps: { W: { prod: ['T'], co: ['X'], eq: { r: [[1, 'W'], [1, 'eau']], p: [[1, 'T'], [1, 'X']] } },
      P: { prod: ['Q'], co: ['X'], eq: { r: [[1, 'P'], [1, 'eau']], p: [[1, 'Q'], [1, 'X']] } } } },
];
export const BANQUES = { generale: BANQUE_GENERALE, protection: BANQUE_PROTECTION };

// ---------- moteur de séquence ----------
export const reactionDe = (banque, id) => banque.find(r => r.id === id);
export const GROUPE_ART = { 'alcène': 'un alcène', 'halogénoalcane': 'un bromoalcane', 'alcool primaire': 'un alcool primaire', 'alcool secondaire': 'un alcool secondaire', 'aldéhyde': 'un aldéhyde',
  'cétone': 'une cétone', 'acide carboxylique': 'un acide carboxylique', 'ion carboxylate': 'un ion carboxylate', 'ester': 'un ester', 'acétal': 'un acétal', 'diol': 'un diol' };
export const defini = nom => (/^[aeiouyéèêâ]/i.test(nom) ? 'l’' : 'le ') + nom;
export const majuscule = t => t.charAt(0).toUpperCase() + t.slice(1);
// Applique une réaction à une molécule : { ok: true, produit, co, remarque } ou { ok: false, raison }
export function appliquer(banque, molId, reactionId) {
  const r = reactionDe(banque, reactionId), m = MOLS[molId];
  if (!r) return { ok: false, raison: 'Choisissez une réaction de la banque.' };
  if (r.refus && r.refus[molId]) return { ok: false, raison: r.refus[molId] };
  if (!r.requiert.some(g => m.groupes.includes(g))) {
    const attendu = r.requiert.map(g => GROUPE_ART[g]).join(' ou ');
    const possede = m.groupes.length === 1 ? `est ${GROUPE_ART[m.groupes[0]]}` : `possède ${m.groupes.map(g => GROUPE_ART[g]).join(' et ')}`;
    return { ok: false, raison: `Cette réaction transforme ${attendu} ; ${defini(m.nom)} ${possede} : le groupe attendu est absent.` };
  }
  const a = r.apps[molId];
  if (!a) return { ok: false, raison: 'La banque ne donne pas de produit pour cette molécule : cas non traité ici.' };
  return { ok: true, produit: a.prod[0], co: a.co || [], remarque: a.remarque || null, eq: a.eq };
}
// Déroule une séquence (liste d'identifiants de réactions) depuis une molécule de départ : s'arrête à la première étape impossible.
export function derouler(banque, depart, suite) {
  const pas = []; let courante = depart, echec = null;
  for (let k = 0; k < suite.length; k++) {
    if (!suite[k]) { echec = { k, raison: 'Choisissez une réaction pour cette étape.' }; break; }
    const res = appliquer(banque, courante, suite[k]);
    if (!res.ok) { echec = { k, raison: res.raison }; break; }
    pas.push({ reaction: suite[k], de: courante, vers: res.produit, co: res.co, remarque: res.remarque });
    courante = res.produit;
  }
  const complet = !echec && pas.length === suite.length;
  const rend = pas.reduce((p, s) => p * reactionDe(banque, s.reaction).rendement / 100, 1);
  return { pas, echec, finale: complet ? courante : null, derniere: courante, rendementGlobal: pas.length ? rend * 100 : null };
}
export function bilanSequence(banque, depart, cible, suite) {
  const d = derouler(banque, depart, suite);
  const atteint = !d.echec && d.finale === cible;
  return { ...d, atteint };
}
// Toutes les séquences de longueur n (identifiants) qui mènent de depart à cible
export function sequences(banque, depart, cible, n) {
  const sorties = [];
  const rec = (mol, suite) => {
    if (suite.length === n) { if (mol === cible) sorties.push([...suite]); return; }
    for (const r of banque) { const res = appliquer(banque, mol, r.id); if (res.ok) rec(res.produit, [...suite, r.id]); }
  };
  rec(depart, []);
  return sorties;
}
export function longueurMin(banque, depart, cible, nMax = 4) {
  if (depart === cible) return 0;
  for (let n = 1; n <= nMax; n++) if (sequences(banque, depart, cible, n).length) return n;
  return null;
}
// Molécules accessibles depuis une molécule de départ en au plus nMax étapes
export function accessibles(banque, depart, nMax) {
  const vus = new Set([depart]); let front = [depart];
  for (let k = 0; k < nMax; k++) { const suivant = []; for (const m of front) for (const r of banque) { const res = appliquer(banque, m, r.id); if (res.ok && !vus.has(res.produit)) { vus.add(res.produit); suivant.push(res.produit); } } front = suivant; }
  return [...vus].filter(m => m !== depart);
}

// ---------- bilans : conservation des atomes et de la charge ----------
export function bilanAtomes(eq) {
  const cumul = cote => cote.reduce((t, [c, id]) => { const e = especeDe(id); for (const [a, n] of Object.entries(e.atomes)) t.atomes[a] = (t.atomes[a] || 0) + c * n; t.charge += c * e.charge; return t; }, { atomes: {}, charge: 0 });
  return { r: cumul(eq.r), p: cumul(eq.p) };
}
export function conserve(eq) {
  const { r, p } = bilanAtomes(eq);
  const els = new Set([...Object.keys(r.atomes), ...Object.keys(p.atomes)]);
  return r.charge === p.charge && [...els].every(e => (r.atomes[e] || 0) === (p.atomes[e] || 0));
}
// Texte d'un bilan (formules brutes)
export const texteBilan = eq => {
  const t = l => l.map(([c, id]) => `${c > 1 ? c + ' ' : ''}${formuleEspece(id)}`).join(' + ');
  return `${t(eq.r)} → ${t(eq.p)}`;
};

// ---------- cas à construire (liste curatée) ----------
// { depart, cible, n } : n = nombre d'étapes de la plus courte séquence (vérifié par strModele.test.mjs, ≤ 3)
export const CAS = [
  { depart: 'C', cible: 'E', n: 2 }, { depart: 'A', cible: 'C', n: 2 }, { depart: 'B', cible: 'D', n: 2 }, { depart: 'A', cible: 'D', n: 3 },
  { depart: 'C', cible: 'G', n: 3 }, { depart: 'D', cible: 'F', n: 2 }, { depart: 'I', cible: 'J', n: 2 }, { depart: 'K', cible: 'M', n: 2 },
  { depart: 'K', cible: 'N', n: 3 }, { depart: 'B', cible: 'E', n: 3 }, { depart: 'L', cible: 'N', n: 2 }, { depart: 'H', cible: 'I', n: 1 },
];
export const CAS_DEFI = CAS.filter(c => c.n >= 2);
export const CAS_PROTECTION = { depart: 'Q', cible: 'T', n: 3 };
// molécules proposées en exploration
export const MOLS_GENERALE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
export const MOLS_PROTECTION = ['Q', 'P', 'W', 'T', 'S', 'U'];

// ---------- synthèse écoresponsable : données FOURNIES (fictives mais plausibles) ----------
// Synthèse de l'éthanoate d'éthyle à partir de l'éthanol en deux étapes : oxydation en acide éthanoïque, puis estérification.
// dechets : masse de déchets produits à l'étape, en kg pour 1,0 kg d'ester obtenu ; danger : étiquette simple.
export const VOIES = {
  A: { nom: 'Voie A', etapes: [
    { nom: 'Oxydation de l’éthanol en acide éthanoïque', reactif: 'ions dichromate (chrome VI) en milieu acide sulfurique', solvant: 'eau', T: 100, duree: 2, eta: 85, dechets: 3.0, dechetsNature: 'sels de chrome(III)', danger: 'réactif toxique' },
    { nom: 'Estérification', reactif: 'acide sulfurique concentré (catalyseur dissous)', solvant: 'toluène', T: 110, duree: 5, eta: 67, dechets: 2.0, dechetsNature: 'toluène non recyclé et eaux acides', danger: 'solvant nocif et inflammable' }] },
  B: { nom: 'Voie B', etapes: [
    { nom: 'Oxydation de l’éthanol en acide éthanoïque', reactif: 'dioxygène de l’air et catalyseur biologique (fermentation)', solvant: 'eau', T: 30, duree: 24, eta: 90, dechets: 0.3, dechetsNature: 'biomasse', danger: 'aucun danger particulier' },
    { nom: 'Estérification', reactif: 'résine acide solide, récupérée et réutilisable', solvant: 'aucun', T: 70, duree: 4, eta: 72, dechets: 0.4, dechetsNature: 'éthanol en excès non récupéré', danger: 'inflammable (éthanol)' }] },
};
export const rendementGlobal = v => v.etapes.reduce((p, e) => p * e.eta / 100, 1) * 100;
export const dechetsTotal = v => v.etapes.reduce((s, e) => s + e.dechets, 0);
// Leviers d'amélioration (vocabulaire du programme) : réactif, solvant, énergie, sous-produits
export const LEVIERS = ['choix du réactif', 'choix du solvant', 'apport d’énergie (température, durée)', 'sous-produits et déchets'];

// ---------- tirages du défi (hasard injecté) ----------
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
export function tirageVoies(rnd = Math.random) {
  const A = tire([[80, 85, 88], [75, 82, 86], [78, 84, 90]], rnd), eA2 = tire([60, 65, 67, 70], rnd);
  const eB1 = tire([88, 90, 92, 95], rnd), eB2 = tire([72, 75, 78, 80], rnd);
  const dA = [tire([2.5, 3.0, 3.5, 4.0], rnd), tire([1.5, 2.0, 2.5], rnd)], dB = [tire([0.2, 0.3, 0.4], rnd), tire([0.3, 0.4, 0.5], rnd)];
  const copie = v => ({ ...v, etapes: v.etapes.map(e => ({ ...e })) });
  const a = copie(VOIES.A), b = copie(VOIES.B);
  a.etapes[0].eta = A[0]; a.etapes[1].eta = eA2; a.etapes[0].dechets = dA[0]; a.etapes[1].dechets = dA[1];
  b.etapes[0].eta = eB1; b.etapes[1].eta = eB2; b.etapes[0].dechets = dB[0]; b.etapes[1].dechets = dB[1];
  return { A: a, B: b, masse: tire([100, 200, 250, 400, 500], rnd) };
}
export const dechetsPour = (v, masseG) => dechetsTotal(v) * masseG;   // g de déchets pour masseG g d'ester (rapport kg/kg identique)

// ====================================================
//  Questions du défi « analyse » (tirages purs, testés par strModele.test.mjs) : protection ou voie écoresponsable
//  Chaque question : { id, type: 'qcm' | 'num', q, options?, bonne?, vrai?, tol?, unite?, indice, pieges?, expl }
// ====================================================
const melange = (t, rnd) => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const d1 = x => Number(x).toFixed(1).replace('.', ',');
const d0 = x => Number(x).toFixed(0);
// options [texte, estBonne] mélangées → { options, bonne }
const qcmOptions = (liste, rnd) => { const m = melange(liste, rnd); return { options: m.map(([t]) => t), bonne: m.findIndex(([, b]) => b) }; };
export const TEXTE_ETAPE_PROT = {
  P1: 'on chauffe la molécule avec de l’éthane-1,2-diol et un peu d’acide, en retirant l’eau formée',
  P3: 'on ajoute LiAlH₄ dans l’éther anhydre, puis de l’eau',
  P4: 'on ajoute un grand excès d’eau et un acide',
};
export function tirageProtection(rnd = Math.random) {
  const ordre = melange(['P1', 'P3', 'P4'], rnd), lettres = ['A', 'B', 'C'];
  const lettreDe = id => lettres[ordre.indexOf(id)];
  const demande = rnd() < 0.5 ? 'protection' : 'déprotection';
  const cible = demande === 'protection' ? 'P1' : 'P4';
  const q1 = { id: 'p1', type: 'qcm',
    q: `Une séquence de trois étapes transforme le 4-oxopentanoate d’éthyle en 5-hydroxypentan-2-one. Ses étapes, dans le désordre : ${ordre.map((id, k) => `(${lettres[k]}) ${TEXTE_ETAPE_PROT[id]}`).join(' ; ')}. Laquelle est l’étape de ${demande} ?`,
    ...qcmOptions([[`l’étape (${lettreDe(cible)})`, true], ...lettres.filter(l => l !== lettreDe(cible)).map(l => [`l’étape (${l})`, false]), ['aucune des trois', false]], rnd),
    indice: demande === 'protection' ? 'Une protection masque un groupe avant une étape qui l’aurait détruit : elle transforme la cétone en un groupe qui ne réagit pas avec LiAlH₄.' : 'Une déprotection rétablit à la fin le groupe qui avait été masqué : ici, elle redonne la cétone à partir de l’acétal.',
    expl: demande === 'protection' ? 'L’étape avec l’éthane-1,2-diol transforme la cétone en acétal : elle masque le groupe fragile avant la réduction. C’est la protection.' : 'L’étape avec un grand excès d’eau et un acide transforme l’acétal en cétone : elle rétablit le groupe masqué. C’est la déprotection.' };
  const q2 = { id: 'p2', type: 'qcm', q: 'Un élève supprime l’étape de protection et fait agir directement LiAlH₄ sur le 4-oxopentanoate d’éthyle. Quel est le produit principal ?',
    ...qcmOptions([['le pentane-1,4-diol : ester et cétone sont réduits', true], ['le 5-hydroxypentan-2-one, la cible', false], ['le 4-hydroxypentanoate d’éthyle, seule la cétone étant réduite', false], ['aucun : LiAlH₄ ne réagit pas', false]], rnd),
    indice: 'LiAlH₄ réduit les esters, mais aussi les aldéhydes et les cétones : quels groupes de la molécule de départ sont concernés ?',
    expl: 'Sans protection, LiAlH₄ réduit l’ester en alcool primaire et la cétone en alcool secondaire : on obtient le pentane-1,4-diol, qui n’est pas la cible. D’où l’intérêt de masquer la cétone avant cette étape.' };
  const q3 = { id: 'p3', type: 'qcm', q: 'Pourquoi ne pas remplacer LiAlH₄ par NaBH₄, réducteur plus doux, et se passer de protection ?',
    ...qcmOptions([['NaBH₄ réduit la cétone, pas l’ester : ce n’est pas ce qu’on veut', true], ['NaBH₄ est trop dangereux pour être utilisé couramment au laboratoire', false], ['NaBH₄ réduit l’ester, mais aussi l’acétal', false], ['NaBH₄ donne le même produit que LiAlH₄, mais plus lentement', false]], rnd),
    indice: 'On veut réduire l’ester en gardant la cétone. Que réduit NaBH₄ : l’ester, la cétone, les deux ? Relisez les conditions de la banque.',
    expl: 'NaBH₄ réduit les aldéhydes et les cétones mais pas les esters : il donnerait le 4-hydroxypentanoate d’éthyle (cétone réduite, ester conservé), l’inverse de ce qu’on cherche.' };
  return { kind: 'prot', questions: [q1, q2, q3], demande };
}
// Voies écoresponsables : trois questions sur des données tirées (les données affichées sont celles du corrigé)
export function tirageEco(rnd = Math.random) {
  const t = tirageVoies(rnd), gA = rendementGlobal(t.A), gB = rendementGlobal(t.B), dA = dechetsTotal(t.A);
  const voie = rnd() < 0.5 ? 'A' : 'B', g = voie === 'A' ? gA : gB, v = t[voie], M = t.masse;
  const etapeCible = rnd() < 0.5 ? 0 : 1;
  const q1 = { id: 'e1', type: 'num', unite: '%', vrai: g, tol: 0.05, affiche: x => d1(x),
    q: `Rendement global de la ${voie === 'A' ? 'voie A' : 'voie B'}, produit des rendements des deux étapes : η₁ = ${v.etapes[0].eta} % et η₂ = ${v.etapes[1].eta} % (en %).`,
    indice: 'Le rendement global est le produit des rendements des étapes, écrits sous forme de nombres compris entre 0 et 1 (85 % = 0,85).',
    pieges: [[(v.etapes[0].eta + v.etapes[1].eta) / 2, 'Vous avez fait la moyenne des deux rendements : les étapes s’enchaînent, on multiplie les rendements.'], [v.etapes[0].eta + v.etapes[1].eta, 'Vous avez additionné les rendements : un rendement global ne peut pas dépasser 100 %.'], [v.etapes[1].eta, 'Vous n’avez gardé que la dernière étape : la matière perdue à la première étape compte aussi.']].filter(([x]) => Math.abs(x - g) / g > 0.08),
    expl: `η global = ${v.etapes[0].eta / 100} × ${v.etapes[1].eta / 100} = ${(g / 100).toFixed(3).replace('.', ',')}, soit ${d1(g)} %.` };
  const gAm = dA * M;
  const q2 = { id: 'e2', type: 'num', unite: 'g', vrai: gAm, tol: 0.05, affiche: x => d0(x),
    q: `La voie A produit ${d1(t.A.etapes[0].dechets)} kg de déchets à l’étape 1 et ${d1(t.A.etapes[1].dechets)} kg à l’étape 2, pour 1,0 kg d’éthanoate d’éthyle obtenu. Quelle masse de déchets produit-elle pour obtenir ${M} g d’éthanoate d’éthyle (en g) ?`,
    indice: 'Additionnez les déchets des deux étapes (kg par kg de produit), puis multipliez par la masse de produit exprimée en kg.',
    pieges: [[dA * 1000, 'Cette masse correspond à 1 kg de produit : ici on en veut moins ; convertissez la masse de produit en kg.'], [t.A.etapes[0].dechets * M, 'Vous n’avez compté que les déchets de l’étape 1 : ajoutez ceux de l’étape 2.']],
    expl: `Déchets par kg de produit : ${d1(t.A.etapes[0].dechets)} + ${d1(t.A.etapes[1].dechets)} = ${d1(dA)} kg. Pour ${M} g = ${(M / 1000).toFixed(3).replace('.', ',')} kg de produit : ${d1(dA)} × ${(M / 1000).toFixed(3).replace('.', ',')} = ${(dA * M / 1000).toFixed(3).replace('.', ',')} kg, soit ${d0(gAm)} g.` };
  const q3 = etapeCible === 0
    ? { id: 'e3', type: 'qcm', q: 'Pour rendre l’étape 1 de la voie A (oxydation de l’éthanol par les ions dichromate) moins nocive pour l’environnement, quelle modification est la plus pertinente ?',
      ...qcmOptions([['remplacer le dichromate par l’air et un catalyseur, à 30 °C', true], ['garder le dichromate, mais chauffer moins longtemps pour réduire la durée', false], ['garder le dichromate et récupérer l’eau du milieu par distillation', false], ['remplacer l’eau par un solvant organique moins polaire, plus facile à recycler', false]], rnd),
      indice: 'Un bon choix de réactif réduit la toxicité et les déchets ; l’apport d’énergie dépend de la température et de la durée.',
      expl: 'L’air avec un catalyseur remplace un réactif toxique (chrome VI) qui laisse des sels de chrome, et permet de travailler à 30 °C. Les autres choix sont des compromis incomplets : chauffer moins longtemps économise un peu d’énergie mais garde le chrome VI et ses sels de chrome ; distiller l’eau consomme de l’énergie et ne supprime pas la toxicité ; un solvant organique ajoute un danger sans régler le problème du réactif.' }
    : { id: 'e3', type: 'qcm', q: 'Pour rendre l’étape 2 de la voie A (estérification dans le toluène avec l’acide sulfurique) moins nocive, quelle modification est la plus pertinente ?',
      ...qcmOptions([['un catalyseur solide réutilisable, sans solvant, à 70 °C', true], ['garder le toluène, mais le récupérer par distillation après la réaction', false], ['remplacer le toluène par un autre solvant organique moins volatil', false], ['garder l’acide sulfurique et chauffer à 130 °C pour raccourcir la durée', false]], rnd),
      indice: 'Regardez ensemble le solvant, le catalyseur (récupérable ou non) et la température.',
      expl: 'Un catalyseur solide se récupère et se réutilise, supprimer le solvant retire un solvant nocif et inflammable, et 70 °C demande moins d’énergie que 110 °C. Les autres choix sont des compromis incomplets : récupérer le toluène demande de l’énergie et laisse un solvant nocif ; un autre solvant organique garde un danger ; chauffer à 130 °C consomme plus d’énergie et garde un catalyseur non réutilisable.' };
  return { kind: 'eco', voies: t, masse: M, voie, questions: [q1, q2, q3] };
}

// tirages complets du défi (hasard injecté pour les tests)
export const tirageSequence = (rnd = Math.random) => CAS_DEFI[Math.floor(rnd() * CAS_DEFI.length)];
export const tirageAnalyse = (rnd = Math.random) => (rnd() < 0.5 ? tirageProtection(rnd) : tirageEco(rnd));
