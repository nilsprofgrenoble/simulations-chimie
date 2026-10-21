// ═══════════════════════════════════════════════════════════════════════════
//  SIM 75 — RMN DU PROTON : modèle (bibliothèque de molécules, multiplets du premier ordre, intégration)
//  Chaque molécule est décrite à la main : groupes de protons équivalents (n, δ en ppm), liens de couplage (J en Hz, vicinal 3J).
//  Un multiplet est construit raie par raie (règle des n+1, triangle de Pascal) ; la forme de raie est lorentzienne.
//  Approximation du premier ordre : valable si l'écart de fréquence entre deux signaux couplés est très supérieur à J (≥ 10 J).
// ═══════════════════════════════════════════════════════════════════════════

export const NU0 = [60, 90, 300, 400, 600];     // fréquences de résonance du proton du TMS (MHz) proposées
export const LW = 0.8, LW_LABILE = 6, LW_TMS = 0.6;   // demi-largeurs à mi-hauteur des raies (Hz)

const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
const TOL_J = 0.4;   // deux constantes J qui diffèrent de moins de 0,4 Hz sont confondues

// couplages [{ n, J }] → couplages regroupés par valeur de J
export function fusion(coupl) {
  const g = [];
  coupl.forEach(c => { const t = g.find(x => Math.abs(x.J - c.J) < TOL_J); if (t) t.n += c.n; else g.push({ n: c.n, J: c.J }); });
  return g;
}
// raies d'un signal centré en 0 : [{ x (Hz), I }] avec ΣI = 1
export function raies(coupl) {
  let L = [{ x: 0, I: 1 }];
  fusion(coupl).forEach(({ n, J }) => {
    const suite = [];
    L.forEach(r => { for (let k = 0; k <= n; k++) suite.push({ x: r.x + (k - n / 2) * J, I: r.I * binom(n, k) }); });
    L = suite;
  });
  const fus = [];
  L.sort((a, b) => a.x - b.x).forEach(r => { const d = fus[fus.length - 1]; if (d && Math.abs(d.x - r.x) < 0.05) d.I += r.I; else fus.push({ ...r }); });
  const S = fus.reduce((s, r) => s + r.I, 0);
  return fus.map(r => ({ x: r.x, I: r.I / S }));
}
const NOMS = ['s', 'd', 't', 'q', 'quint', 'sext', 'sept', 'oct', 'non'];
export function nomMult(coupl) {
  const m = fusion(coupl);
  if (!m.length) return 's';
  if (m.length === 1) return NOMS[Math.min(m[0].n, 8)];
  if (m.length === 2 && m[0].n === 1 && m[1].n === 1) return 'dd';
  return 'm';
}
export const NOM_COMPLET = { s: 'singulet', d: 'doublet', t: 'triplet', q: 'quadruplet', quint: 'quintuplet', sext: 'sextuplet', sept: 'septuplet', dd: 'doublet dédoublé', m: 'multiplet' };

// ---------- bibliothèque ----------
// g(clé, n, δ, groupe, commentaire, labile)
const g = (n, d, desc, com, labile = false) => ({ n, d, desc, com, labile });
// liens : [a, b, J, nAB, nBA] ; nAB = nombre de H du groupe b couplés à chacun des H du groupe a (par défaut : tous), nBA = l'inverse
const DEFS = [
  { id: 'neopentyl', nom: '1-bromo-2,2-diméthylpropane', brute: 'C₅H₁₁Br', famille: 'C5H11Br',
    semi: [{ g: 'me', t: '(CH₃)₃' }, 'C', '–', { g: 'ch2', t: 'CH₂' }, 'Br'],
    groupes: { me: g(9, 1.05, 'CH₃ (×3)', 'Neuf H équivalents, loin de l’atome de brome : très blindés. Le carbone voisin est quaternaire (aucun H) : singulet.'),
      ch2: g(2, 3.30, 'CH₂Br', 'Le brome, électronégatif, appauvrit en électrons les H voisins : ils sont déblindés. Aucun H sur le carbone voisin : singulet.') }, liens: [] },
  { id: 'dibromopropane', nom: '1,3-dibromopropane', brute: 'C₃H₆Br₂', famille: 'C3H6Br2',
    semi: ['Br', '–', { g: 'ex', t: 'CH₂' }, '–', { g: 'ce', t: 'CH₂' }, '–', { g: 'ex', t: 'CH₂' }, '–', 'Br'],
    groupes: { ex: g(4, 3.52, 'CH₂Br (×2)', 'Lié au brome : déblindé. Couplé aux 2 H du CH₂ central : triplet.'),
      ce: g(2, 2.32, 'CH₂ central', 'Plus éloigné des atomes de brome : moins déblindé. Couplé aux 4 H des deux CH₂Br : quintuplet.') }, liens: [['ce', 'ex', 6.6]] },
  { id: 'dichloropropane13', nom: '1,3-dichloropropane', brute: 'C₃H₆Cl₂', famille: 'C3H6Cl2',
    semi: ['Cl', '–', { g: 'ex', t: 'CH₂' }, '–', { g: 'ce', t: 'CH₂' }, '–', { g: 'ex', t: 'CH₂' }, '–', 'Cl'],
    groupes: { ex: g(4, 3.72, 'CH₂Cl (×2)', 'Lié au chlore, très électronégatif : déblindé. Couplé aux 2 H du CH₂ central : triplet.'),
      ce: g(2, 2.22, 'CH₂ central', 'Moins déblindé. Couplé aux 4 H voisins : quintuplet.') }, liens: [['ce', 'ex', 6.4]] },
  { id: 'dichloropropane22', nom: '2,2-dichloropropane', brute: 'C₃H₆Cl₂', famille: 'C3H6Cl2',
    semi: [{ g: 'me', t: 'CH₃' }, '–', 'CCl₂', '–', { g: 'me', t: 'CH₃' }],
    groupes: { me: g(6, 2.15, 'CH₃ (×2)', 'Six H équivalents. Le carbone voisin ne porte aucun H : singulet. Déblindés par les deux chlores en position β.') }, liens: [] },
  { id: 'dichloropropane11', nom: '1,1-dichloropropane', brute: 'C₃H₆Cl₂', famille: 'C3H6Cl2',
    semi: [{ g: 'ch', t: 'CHCl₂' }, '–', { g: 'ch2', t: 'CH₂' }, '–', { g: 'me', t: 'CH₃' }],
    groupes: { ch: g(1, 5.75, 'CHCl₂', 'Deux chlores sur le même carbone : très déblindé. Couplé aux 2 H du CH₂ : triplet.'),
      ch2: g(2, 1.95, 'CH₂', 'Couplé au H du CHCl₂ et aux 3 H du CH₃, avec deux constantes J voisines : multiplet.'),
      me: g(3, 1.02, 'CH₃', 'Loin des chlores : blindé. Couplé aux 2 H du CH₂ : triplet.') }, liens: [['ch', 'ch2', 6.2], ['ch2', 'me', 7.4]] },
  { id: 'dichloroethane11', nom: '1,1-dichloroéthane', brute: 'C₂H₄Cl₂', famille: 'C2H4Cl2',
    semi: [{ g: 'ch', t: 'CHCl₂' }, '–', { g: 'me', t: 'CH₃' }],
    groupes: { ch: g(1, 5.90, 'CHCl₂', 'Deux chlores sur le même carbone : très déblindé. Couplé aux 3 H du CH₃ : quadruplet.'),
      me: g(3, 2.07, 'CH₃', 'Couplé à 1 H : doublet.') }, liens: [['ch', 'me', 6.0]] },
  { id: 'dichloroethane12', nom: '1,2-dichloroéthane', brute: 'C₂H₄Cl₂', famille: 'C2H4Cl2',
    semi: ['Cl', '–', { g: 'ch2', t: 'CH₂' }, '–', { g: 'ch2', t: 'CH₂' }, '–', 'Cl'],
    groupes: { ch2: g(4, 3.73, 'CH₂Cl (×2)', 'Quatre H équivalents (molécule symétrique) : un seul signal. Pas de couplage entre H équivalents : singulet.') }, liens: [] },
  { id: 'bromobutane', nom: '1-bromobutane', brute: 'C₄H₉Br', famille: 'C4H9Br',
    semi: [{ g: 'me', t: 'CH₃' }, '–', { g: 'c', t: 'CH₂' }, '–', { g: 'b', t: 'CH₂' }, '–', { g: 'br', t: 'CH₂' }, 'Br'],
    groupes: { br: g(2, 3.41, 'CH₂Br', 'Lié au brome : le plus déblindé. 2 H voisins : triplet.'),
      b: g(2, 1.85, 'CH₂ (β)', 'À côté du CH₂Br : un peu déblindé. 2 + 2 = 4 H voisins : quintuplet.'),
      c: g(2, 1.45, 'CH₂ (γ)', '2 + 3 = 5 H voisins : sextuplet.'),
      me: g(3, 0.93, 'CH₃', 'Le plus éloigné du brome : le plus blindé. 2 H voisins : triplet.') }, liens: [['br', 'b', 7.0], ['b', 'c', 7.0], ['c', 'me', 7.0]] },
  { id: 'ethoxyethane', nom: 'éthoxyéthane (éther diéthylique)', brute: 'C₄H₁₀O', famille: 'C4H10O',
    semi: [{ g: 'me', t: 'CH₃' }, '–', { g: 'ch2', t: 'CH₂' }, '–', 'O', '–', { g: 'ch2', t: 'CH₂' }, '–', { g: 'me', t: 'CH₃' }],
    groupes: { ch2: g(4, 3.47, 'CH₂O (×2)', 'Lié à l’oxygène : déblindé. Chaque H voit les 3 H d’un CH₃ : quadruplet.'),
      me: g(6, 1.21, 'CH₃ (×2)', 'Chaque H voit les 2 H d’un CH₂ : triplet.') }, liens: [['ch2', 'me', 7.0, 3, 2]] },
  { id: 'ethanol', nom: 'éthanol', brute: 'C₂H₆O', famille: 'C2H6O',
    semi: [{ g: 'me', t: 'CH₃' }, '–', { g: 'ch2', t: 'CH₂' }, '–', { g: 'oh', t: 'OH' }],
    groupes: { ch2: g(2, 3.69, 'CH₂O', 'Lié à l’oxygène : déblindé. Couplé aux 3 H du CH₃ : quadruplet (pas de couplage avec le H de OH).'),
      me: g(3, 1.22, 'CH₃', 'Couplé aux 2 H du CH₂ : triplet.'),
      oh: g(1, 2.6, 'OH', 'H labile : il s’échange rapidement avec les autres molécules, donc pas de couplage (singulet élargi). δ variable avec la concentration et le solvant. Disparaît avec D₂O.', true) },
    liens: [['ch2', 'me', 7.0]] },
  { id: 'acetateethyle', nom: 'éthanoate d’éthyle', brute: 'C₄H₈O₂', famille: 'C4H8O2',
    semi: [{ g: 'ac', t: 'CH₃' }, '–', 'CO', '–', 'O', '–', { g: 'och2', t: 'CH₂' }, '–', { g: 'me', t: 'CH₃' }],
    groupes: { och2: g(2, 4.12, 'OCH₂', 'Lié à l’oxygène de l’ester : très déblindé. 3 H voisins : quadruplet.'),
      ac: g(3, 2.05, 'CH₃CO', 'À côté du carbonyle : modérément déblindé. Aucun H voisin : singulet.'),
      me: g(3, 1.26, 'CH₃', '2 H voisins : triplet.') }, liens: [['och2', 'me', 7.1]] },
  { id: 'propanoatemethyle', nom: 'propanoate de méthyle', brute: 'C₄H₈O₂', famille: 'C4H8O2',
    semi: [{ g: 'me', t: 'CH₃' }, '–', { g: 'ch2', t: 'CH₂' }, '–', 'CO', '–', 'O', '–', { g: 'ome', t: 'CH₃' }],
    groupes: { ome: g(3, 3.67, 'OCH₃', 'Lié à l’oxygène de l’ester : déblindé. Aucun H voisin : singulet.'),
      ch2: g(2, 2.32, 'CH₂CO', 'À côté du carbonyle. 3 H voisins : quadruplet.'),
      me: g(3, 1.14, 'CH₃', '2 H voisins : triplet.') }, liens: [['ch2', 'me', 7.6]] },
  { id: 'butanoateethyle', nom: 'butanoate d’éthyle', brute: 'C₆H₁₂O₂', famille: 'C6H12O2',
    semi: [{ g: 'me1', t: 'CH₃' }, '–', { g: 'mid', t: 'CH₂' }, '–', { g: 'alpha', t: 'CH₂' }, '–', 'CO', '–', 'O', '–', { g: 'och2', t: 'CH₂' }, '–', { g: 'me2', t: 'CH₃' }],
    groupes: { och2: g(2, 4.12, 'OCH₂', 'Lié à l’oxygène : le plus déblindé. 3 H voisins : quadruplet.'),
      alpha: g(2, 2.28, 'CH₂CO', 'À côté du carbonyle. 2 H voisins : triplet.'),
      mid: g(2, 1.65, 'CH₂ central', '2 + 3 = 5 H voisins : sextuplet.'),
      me2: g(3, 1.26, 'CH₃ (éthyle)', '2 H voisins : triplet.'),
      me1: g(3, 0.95, 'CH₃ (butanoyle)', 'Le plus blindé. 2 H voisins : triplet.') }, liens: [['och2', 'me2', 7.1], ['me1', 'mid', 7.4], ['mid', 'alpha', 7.4]] },
  { id: 'dimethylpentanone', nom: '4,4-diméthylpentan-2-one', brute: 'C₇H₁₄O', famille: 'C7H14O',
    semi: [{ g: 'ac', t: 'CH₃' }, '–', 'CO', '–', { g: 'ch2', t: 'CH₂' }, '–', 'C', '–', { g: 'tbu', t: '(CH₃)₃' }],
    groupes: { ch2: g(2, 2.33, 'CH₂CO', 'À côté du carbonyle. Voisins : carbone C=O et carbone quaternaire, sans H : singulet.'),
      ac: g(3, 2.13, 'CH₃CO', 'À côté du carbonyle, sans H voisin : singulet.'),
      tbu: g(9, 1.02, '(CH₃)₃', 'Neuf H équivalents, loin du carbonyle : les plus blindés. Singulet.') }, liens: [] },
  { id: 'methylbutanone', nom: '3-méthylbutan-2-one', brute: 'C₅H₁₀O', famille: 'C5H10O',
    semi: [{ g: 'me2', t: '(CH₃)₂' }, { g: 'ch', t: 'CH' }, '–', 'CO', '–', { g: 'ac', t: 'CH₃' }],
    groupes: { ch: g(1, 2.58, 'CH', 'À côté du carbonyle. Couplé aux 6 H des deux CH₃ : septuplet.'),
      ac: g(3, 2.14, 'CH₃CO', 'À côté du carbonyle, sans H voisin : singulet.'),
      me2: g(6, 1.11, '(CH₃)₂', 'Six H équivalents. Couplés à 1 H : doublet.') }, liens: [['ch', 'me2', 6.9]] },
  { id: 'chloro2', nom: 'acide 2-chloropropanoïque', brute: 'C₃H₅ClO₂', famille: 'C3H5ClO2',
    semi: [{ g: 'me', t: 'CH₃' }, '–', { g: 'ch', t: 'CHCl' }, '–', { g: 'oh', t: 'COOH' }],
    groupes: { oh: g(1, 11.0, 'COOH', 'H d’acide carboxylique : très déblindé, labile (singulet élargi, disparaît avec D₂O).', true),
      ch: g(1, 4.45, 'CHCl', 'Lié au chlore et au groupe COOH : déblindé. 3 H voisins : quadruplet.'),
      me: g(3, 1.72, 'CH₃', '1 H voisin : doublet.') }, liens: [['ch', 'me', 7.0]] },
  { id: 'chloro3', nom: 'acide 3-chloropropanoïque', brute: 'C₃H₅ClO₂', famille: 'C3H5ClO2',
    semi: ['Cl', '–', { g: 'cl', t: 'CH₂' }, '–', { g: 'co', t: 'CH₂' }, '–', { g: 'oh', t: 'COOH' }],
    groupes: { oh: g(1, 11.0, 'COOH', 'H d’acide carboxylique : très déblindé, labile (singulet élargi, disparaît avec D₂O).', true),
      cl: g(2, 3.80, 'CH₂Cl', 'Lié au chlore : déblindé. 2 H voisins : triplet.'),
      co: g(2, 2.88, 'CH₂CO', 'À côté du groupe COOH. 2 H voisins : triplet.') }, liens: [['cl', 'co', 6.5]] },
  { id: 'propanal', nom: 'propanal', brute: 'C₃H₆O', famille: 'C3H6O',
    semi: [{ g: 'me', t: 'CH₃' }, '–', { g: 'ch2', t: 'CH₂' }, '–', { g: 'cho', t: 'CHO' }],
    groupes: { cho: g(1, 9.79, 'CHO', 'H d’aldéhyde : très déblindé (structure C=O). Faiblement couplé aux 2 H du CH₂ (J ≈ 1,5 Hz) : triplet très resserré.'),
      ch2: g(2, 2.46, 'CH₂', 'Couplé aux 3 H du CH₃ (J ≈ 7 Hz) et au H du CHO (J ≈ 1,5 Hz) : deux constantes différentes, multiplet.'),
      me: g(3, 1.12, 'CH₃', '2 H voisins : triplet.') }, liens: [['ch2', 'me', 7.3], ['ch2', 'cho', 1.5]] },
  { id: 'benzoateethyle', nom: 'benzoate d’éthyle', brute: 'C₉H₁₀O₂', famille: 'C9H10O2',
    semi: [{ cycle: { 0: 'p', 1: 'm', 2: 'o', 4: 'o', 5: 'm' } }, '–', 'CO', '–', 'O', '–', { g: 'och2', t: 'CH₂' }, '–', { g: 'me', t: 'CH₃' }],
    groupes: { o: g(2, 8.04, 'H ortho', 'Voisins du groupe ester attracteur : fortement déblindés. Couplés au H meta voisin : doublet.'),
      p: g(1, 7.54, 'H para', 'Couplé aux 2 H meta : triplet.'),
      m: g(2, 7.42, 'H meta', 'Couplé au H ortho et au H para voisins (même J) : triplet.'),
      och2: g(2, 4.38, 'OCH₂', 'Lié à l’oxygène de l’ester : déblindé. 3 H voisins : quadruplet.'),
      me: g(3, 1.40, 'CH₃', '2 H voisins : triplet.') }, liens: [['o', 'm', 7.7, 1, 1], ['m', 'p', 7.4, 1, 2], ['och2', 'me', 7.1]] },
  { id: 'nitrobenzoate', nom: '4-nitrobenzoate d’éthyle', brute: 'C₉H₉NO₄', famille: 'C9H9NO4',
    semi: ['O₂N', '–', { cycle: { 1: 'hn', 2: 'he', 4: 'he', 5: 'hn' } }, '–', 'CO', '–', 'O', '–', { g: 'och2', t: 'CH₂' }, '–', { g: 'me', t: 'CH₃' }],
    groupes: { hn: g(2, 8.29, 'H ortho à NO₂', 'Le groupe nitro est attracteur d’électrons (−M) : il appauvrit le cycle, surtout en ortho. Signal le plus déblindé. Doublet.'),
      he: g(2, 8.19, 'H ortho à CO₂Et', 'L’ester est aussi attracteur (−M). Doublet.'),
      och2: g(2, 4.42, 'OCH₂', 'Lié à l’oxygène de l’ester. Quadruplet.'),
      me: g(3, 1.42, 'CH₃', 'Triplet.') }, liens: [['hn', 'he', 8.8, 1, 1], ['och2', 'me', 7.1]] },
  { id: 'aminobenzoate', nom: '4-aminobenzoate d’éthyle', brute: 'C₉H₁₁NO₂', famille: 'C9H11NO2',
    semi: [{ g: 'nh2', t: 'NH₂' }, '–', { cycle: { 1: 'hn', 2: 'he', 4: 'he', 5: 'hn' } }, '–', 'CO', '–', 'O', '–', { g: 'och2', t: 'CH₂' }, '–', { g: 'me', t: 'CH₃' }],
    groupes: { he: g(2, 7.86, 'H ortho à CO₂Et', 'Ester attracteur (−M) : déblindés. Doublet.'),
      hn: g(2, 6.63, 'H ortho à NH₂', 'Le groupe amino est donneur d’électrons (+M) : il enrichit le cycle, surtout en ortho. Fortement blindés. Doublet.'),
      och2: g(2, 4.31, 'OCH₂', 'Lié à l’oxygène de l’ester. Quadruplet.'),
      nh2: g(2, 4.1, 'NH₂', 'H labile : singulet élargi, δ variable, disparaît avec D₂O.', true),
      me: g(3, 1.35, 'CH₃', 'Triplet.') }, liens: [['hn', 'he', 8.6, 1, 1], ['och2', 'me', 7.1]] },
];

const LETTRES = 'abcdefghij';
function construire(d) {
  const liste = Object.entries(d.groupes).map(([k, v]) => ({ k, ...v })).sort((a, b) => b.d - a.d);
  liste.forEach((x, i) => { x.lettre = LETTRES[i]; x.coupl = []; });
  const par = Object.fromEntries(liste.map(x => [x.k, x]));
  d.liens.forEach(([a, b, J, nab, nba]) => { const A = par[a], B = par[b]; A.coupl.push({ n: nab ?? B.n, J, avec: B.lettre }); B.coupl.push({ n: nba ?? A.n, J, avec: A.lettre }); });
  liste.forEach(x => { const m = fusion(x.coupl); x.mult = nomMult(x.coupl); x.nv = m.reduce((s, c) => s + c.n, 0); x.simple = m.length <= 1; x.J = m.length === 1 ? m[0].J : null; x.lignes = raies(x.coupl); x.lw = x.labile ? LW_LABILE : LW; });
  const N = liste.reduce((s, x) => s + x.n, 0);
  return { ...d, liste, par, N };
}
export const MOLECULES = DEFS.map(construire);
export const MOL = Object.fromEntries(MOLECULES.map(m => [m.id, m]));
export const FAMILLES = {};
MOLECULES.forEach(m => { (FAMILLES[m.famille] = FAMILLES[m.famille] || []).push(m.id); });
export const plat = m => m.semi.map(t => (typeof t === 'string' ? t : t.cycle ? 'C₆H₄' : t.t)).join('');

// groupes visibles (D₂O efface les H labiles)
export const visibles = (m, d2o) => m.liste.filter(x => !(d2o && x.labile));

// ---------- tracé ----------
// hauteur de référence : le plus haut sommet d'un signal de la molécule (résolution infinie)
const hautRaie = (x, nu0, x0, I, n, w) => n * I * (1 / Math.PI) * w / (((x - x0) * nu0) ** 2 + w * w);
export function yRef(m) { return Math.max(...m.liste.map(x => x.n * Math.max(...x.lignes.map(r => r.I)) / (Math.PI * x.lw))); }
const PTS = [-80, -30, -12, -6, -3, -1.5, 0, 1.5, 3, 6, 12, 30, 80];
// courbe totale : { xs, ys, int (cumul d'intégration normalisé 0..1 de la gauche vers la droite) }
export function spectre(m, nu0, d2o, xmin, xmax) {
  const gs = visibles(m, d2o), tms = { d: 0, lignes: [{ x: 0, I: 1 }], n: 0.25 * yRef(m) * Math.PI * LW_TMS, lw: LW_TMS, tms: true };
  const tous = [...gs.map(x => ({ d: x.d, lignes: x.lignes, n: x.n, lw: x.lw })), tms];
  const xs = new Set([xmin, xmax]);
  tous.forEach(x => x.lignes.forEach(r => PTS.forEach(k => { const v = x.d + r.x / nu0 + k * x.lw / nu0; if (v >= xmin && v <= xmax) xs.add(v); })));
  const X = [...xs].sort((a, b) => b - a), Ntot = gs.reduce((s, x) => s + x.n, 0) || 1;
  const ys = X.map(x => tous.reduce((s, g2) => s + g2.lignes.reduce((t, r) => t + hautRaie(x, nu0, g2.d + r.x / nu0, r.I, g2.n, g2.lw), 0), 0));
  const cum = X.map(x => gs.reduce((s, g2) => s + g2.n * g2.lignes.reduce((t, r) => t + r.I * (0.5 - Math.atan(((x - (g2.d + r.x / nu0)) * nu0) / g2.lw) / Math.PI), 0), 0) / Ntot);
  return { xs: X, ys, cum, Ntot };
}
// contribution d'un seul groupe (pour la mise en évidence)
export function courbeGroupe(x, nu0, xmin, xmax) {
  const xs = new Set([xmin, xmax]);
  x.lignes.forEach(r => PTS.forEach(k => { const v = x.d + r.x / nu0 + k * x.lw / nu0; if (v >= xmin && v <= xmax) xs.add(v); }));
  const X = [...xs].sort((a, b) => b - a);
  return { xs: X, ys: X.map(v => x.lignes.reduce((t, r) => t + hautRaie(v, nu0, x.d + r.x / nu0, r.I, x.n, x.lw), 0)) };
}
// courbe d'un multiplet en fonction de l'écart au centre (Hz)
export function courbeZoom(x, demi, nb = 500) {
  const X = Array.from({ length: nb + 1 }, (_, i) => -demi + 2 * demi * i / nb);
  return { xs: X, ys: X.map(f => x.lignes.reduce((t, r) => t + (x.n * r.I / Math.PI) * x.lw / ((f - r.x) ** 2 + x.lw ** 2), 0)) };
}
// vérification du premier ordre : couples de signaux couplés dont l'écart de fréquence est inférieur à 10 J
export function limitesPremierOrdre(m, nu0, d2o) {
  const out = [];
  visibles(m, d2o).forEach(x => x.coupl.forEach(c => {
    const y = m.liste.find(z => z.lettre === c.avec);
    if (!y || y.labile || x.lettre > y.lettre) return;
    const dnu = Math.abs(x.d - y.d) * nu0, r = dnu / c.J;
    if (r < 10) out.push({ a: x.lettre, b: y.lettre, dnu, J: c.J, r });
  }));
  return out;
}
export const hauteurMm = (n, k) => Math.round(n * k * 10) / 10;
