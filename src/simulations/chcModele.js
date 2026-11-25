// ====================================================
//  Modèle de la simulation 241 : modifier la chaîne carbonée (TG spé PC, « Élaborer des stratégies en synthèse organique »).
//  Capacités visées (jamais affichées) : élaborer une séquence réactionnelle de synthèse d'une espèce à partir d'une banque de réactions ;
//  identifier des réactions d'oxydo-réduction, de substitution, d'addition ; mettre en œuvre (ici : analyser) une synthèse qui modifie une chaîne carbonée.
//  Modèle : chaque molécule est un graphe (atomes, liaisons, coordonnées du dessin) ; formule brute et squelette carboné (nombre de C, ramification,
//  plus longue chaîne) sont CALCULÉS depuis le graphe (valence : C 4, O 2, N 3, Br 1, Mg 2), ce qui permet de vérifier par programme la conservation des atomes
//  de chaque bilan de la banque et l'effet de chaque réaction sur le squelette. Rendements d'étape : données FOURNIES (fictives, plausibles), pas des mesures.
//  Pas de mécanisme (flèches courbes : sim 186), pas de stéréochimie. Test : chcModele.test.mjs.
// ====================================================

// atomes : [élément, [x, y]] ; liaisons : [i, j, ordre] ; coordonnées en unités de liaison (y vers le haut)
const mol = (id, nom, groupes, atomes, liaisons) => ({ id, nom, groupes, atomes: atomes.map(([e, p]) => ({ e, x: p[0], y: p[1] })), liaisons });
const C30 = 0.866;
const z = k => [k * C30, k % 2 ? 0.5 : 0];

export const MOLS = {
  BrEt: mol('BrEt', 'bromoéthane', ['halogénoalcane'], [['C', z(0)], ['C', z(1)], ['Br', z(2)]], [[0, 1, 1], [1, 2, 1]]),
  PrCN: mol('PrCN', 'propanenitrile', ['nitrile'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['N', [2.598, -0.5]]], [[0, 1, 1], [1, 2, 1], [2, 3, 3]]),
  PrNH2: mol('PrNH2', 'propan-1-amine', ['amine'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['N', z(3)]], [[0, 1, 1], [1, 2, 1], [2, 3, 1]]),
  EtMgBr: mol('EtMgBr', 'bromure d’éthylmagnésium', ['organomagnésien'], [['C', z(0)], ['C', z(1)], ['Mg', z(2)], ['Br', [2.598, -0.5]]], [[0, 1, 1], [1, 2, 1], [2, 3, 1]]),
  Ald: mol('Ald', 'éthanal', ['aldéhyde'], [['C', z(0)], ['C', z(1)], ['O', [0.866, 1.5]]], [[0, 1, 1], [1, 2, 2]]),
  Pone: mol('Pone', 'propanone', ['cétone'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['O', [0.866, 1.5]]], [[0, 1, 1], [1, 2, 1], [1, 3, 2]]),
  Bu2ol: mol('Bu2ol', 'butan-2-ol', ['alcool secondaire'], [['C', [0, 0]], ['C', [0.866, 0.5]], ['C', [0.866, 1.5]], ['C', [1.732, 2]], ['O', [0, 2]]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [2, 4, 1]]),
  MBu2ol: mol('MBu2ol', '2-méthylbutan-2-ol', ['alcool tertiaire'], [['C', [0, 0]], ['C', [0.866, 0.5]], ['C', [0.866, 1.5]], ['C', [1.866, 1.5]], ['C', [-0.134, 1.5]], ['O', [0.866, 2.5]]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1]]),
  Bu2one: mol('Bu2one', 'butan-2-one', ['cétone'], [['C', [0, 0]], ['C', [0.866, 0.5]], ['C', [0.866, 1.5]], ['C', [1.732, 2]], ['O', [0, 2]]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [2, 4, 2]]),
  But2ene: mol('But2ene', 'but-2-ène', ['alcène'], [['C', z(0)], ['C', z(1)], ['C', z(2)], ['C', z(3)]], [[0, 1, 1], [1, 2, 2], [2, 3, 1]]),
  AcEt: mol('AcEt', 'acide éthanoïque', ['acide carboxylique'], [['C', z(0)], ['C', z(1)], ['O', z(2)], ['O', [0.866, 1.5]]], [[0, 1, 1], [1, 2, 1], [1, 3, 2]]),
};
export const MOLS_BANQUE = ['BrEt', 'PrCN', 'PrNH2', 'EtMgBr', 'Bu2ol', 'MBu2ol', 'Bu2one', 'But2ene', 'AcEt'];
export const NOM_PARTENAIRE = { Ald: 'éthanal', Pone: 'propanone' };

// espèces simples des bilans (formules fournies : atomes et charge)
export const ESPECES = {
  eau: { nom: 'eau', formule: 'H₂O', atomes: { H: 2, O: 1 }, charge: 0 },
  CN: { nom: 'ion cyanure', formule: 'CN⁻', atomes: { C: 1, N: 1 }, charge: -1 },
  Br: { nom: 'ion bromure', formule: 'Br⁻', atomes: { Br: 1 }, charge: -1 },
  Mg: { nom: 'magnésium', formule: 'Mg', atomes: { Mg: 1 }, charge: 0 },
  MgOHBr: { nom: 'sel de magnésium (bilan simplifié)', formule: 'Mg(OH)Br', atomes: { Mg: 1, O: 1, H: 1, Br: 1 }, charge: 0, simplifie: true },
  ox: { nom: 'oxydant (bilan simplifié : un atome d’oxygène « [O] »)', formule: '[O]', atomes: { O: 1 }, charge: 0, simplifie: true },
  H2: { nom: 'réducteur (bilan simplifié : deux atomes d’hydrogène « 2 [H] »)', formule: '2 [H]', atomes: { H: 2 }, charge: 0, simplifie: true },
};

// ---------- formule brute et squelette, calculés depuis le graphe ----------
const VALENCE = { C: 4, O: 2, N: 3, Br: 1, Mg: 2 };
export const somme = (m, i) => m.liaisons.reduce((s, [a, b, o]) => s + (a === i || b === i ? o : 0), 0);
export const nbH = (m, i) => VALENCE[m.atomes[i].e] - somme(m, i);
export function brute(m) {
  const t = {};
  m.atomes.forEach((a, i) => { t[a.e] = (t[a.e] || 0) + 1; t.H = (t.H || 0) + nbH(m, i); });
  return { atomes: Object.fromEntries(Object.entries(t).filter(([, n]) => n > 0)), charge: 0 };
}
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const indice = n => (n === 1 ? '' : String(n).split('').map(c => SUBS[+c]).join(''));
export function formuleTexte(b) {
  const { atomes } = b, ordre = ['C', 'H', 'Br', 'Mg', 'N', 'O'];
  return ordre.filter(e => atomes[e]).map(e => e + indice(atomes[e])).join('') + (b.charge === -1 ? '⁻' : '');
}
export const formule = m => formuleTexte(brute(m));
export const valide = m => m.atomes.every((_, i) => nbH(m, i) >= 0);
export const especeDe = id => (MOLS[id] ? { ...brute(MOLS[id]), nom: MOLS[id].nom } : { atomes: ESPECES[id].atomes, charge: ESPECES[id].charge, nom: ESPECES[id].nom });
export const nomEspece = id => (MOLS[id] ? MOLS[id].nom : ESPECES[id].nom);
export const formuleEspece = id => (MOLS[id] ? formule(MOLS[id]) : ESPECES[id].formule);
export const masseMolaire = (atomes, M = { C: 12.0, H: 1.0, O: 16.0, N: 14.0, Br: 79.9, Mg: 24.3 }) => Object.entries(atomes).reduce((s, [e, n]) => s + n * M[e], 0);

// squelette carboné : atomes C et liaisons C–C
export function squelette(m) {
  const idx = m.atomes.map((a, i) => (a.e === 'C' ? i : -1)).filter(i => i >= 0);
  const voisinsC = {}; idx.forEach(i => { voisinsC[i] = []; });
  let nCC = 0;
  m.liaisons.forEach(([a, b]) => { if (m.atomes[a].e === 'C' && m.atomes[b].e === 'C') { voisinsC[a].push(b); voisinsC[b].push(a); nCC++; } });
  let longueur = 0;
  const dfs = (i, vus) => { longueur = Math.max(longueur, vus.size); for (const j of voisinsC[i]) if (!vus.has(j)) { vus.add(j); dfs(j, vus); vus.delete(j); } };
  idx.forEach(i => dfs(i, new Set([i])));
  const ramifie = idx.some(i => voisinsC[i].length >= 3);
  return { nC: idx.length, nCC, longueur, ramifie };
}
export const nbC = id => squelette(MOLS[id]).nC;
export const decritSquelette = id => { const s = squelette(MOLS[id]); return `${s.nC} atome${s.nC > 1 ? 's' : ''} de carbone, ${s.ramifie ? 'chaîne ramifiée' : 'chaîne non ramifiée'}`; };

// ---------- types et effets sur le squelette ----------
export const TYPES = ['oxydo-réduction', 'substitution', 'addition'];
export const EFFETS = {
  inchange: 'le squelette carboné est inchangé',
  allonge: 'le squelette carboné est allongé',
  allongeRamifie: 'le squelette carboné est allongé et ramifié',
  raccourci: 'le squelette carboné est raccourci',
};
// effet d'une réaction sur la molécule organique de départ, calculé depuis les graphes (squelette du produit principal comparé à celui du départ)
export function effetSquelette(depId, prodId) {
  const a = squelette(MOLS[depId]), b = squelette(MOLS[prodId]);
  if (b.nC < a.nC) return 'raccourci';
  if (b.nC > a.nC) return b.ramifie && !a.ramifie ? 'allongeRamifie' : 'allonge';
  return 'inchange';
}

// ---------- banque : 7 réactions ----------
// requiert : groupes caractéristiques ; apps : molécule de départ → { prod, eq } ; partenaire : réactif organique fourni par la banque (écrit sur la carte)
export const BANQUE = [
  { id: 'G1', nom: 'Action des ions cyanure sur un bromoalcane', type: 'substitution', requiert: ['halogénoalcane'], exemple: ['BrEt', 'PrCN'], rendement: 75,
    reactifs: 'ions cyanure CN⁻ (en solution dans l’éthanol)', conditions: 'chauffage à reflux',
    apps: { BrEt: { prod: ['PrCN'], eq: { r: [[1, 'BrEt'], [1, 'CN']], p: [[1, 'PrCN'], [1, 'Br']] } } } },
  { id: 'G2', nom: 'Réduction d’un nitrile', type: 'oxydo-réduction', requiert: ['nitrile'], exemple: ['PrCN', 'PrNH2'], rendement: 80,
    reactifs: 'LiAlH₄ (réducteur) dans l’éther anhydre, puis eau', conditions: 'température ambiante',
    apps: { PrCN: { prod: ['PrNH2'], eq: { r: [[1, 'PrCN'], [2, 'H2']], p: [[1, 'PrNH2']] } } } },
  { id: 'G3', nom: 'Formation d’un organomagnésien', type: 'oxydo-réduction', requiert: ['halogénoalcane'], exemple: ['BrEt', 'EtMgBr'], rendement: 85,
    reactifs: 'magnésium Mg (copeaux) dans l’éther anhydre', conditions: 'verrerie sèche, aucune trace d’eau',
    apps: { BrEt: { prod: ['EtMgBr'], eq: { r: [[1, 'BrEt'], [1, 'Mg']], p: [[1, 'EtMgBr']] } } } },
  { id: 'G4', nom: 'Organomagnésien et éthanal, puis hydrolyse', type: 'addition', requiert: ['organomagnésien'], exemple: ['EtMgBr', 'Bu2ol'], rendement: 70, partenaire: 'Ald',
    reactifs: 'éthanal dans l’éther anhydre, puis eau (acidifiée)', conditions: 'à froid, puis hydrolyse',
    apps: { EtMgBr: { prod: ['Bu2ol'], eq: { r: [[1, 'EtMgBr'], [1, 'Ald'], [1, 'eau']], p: [[1, 'Bu2ol'], [1, 'MgOHBr']] } } } },
  { id: 'G5', nom: 'Organomagnésien et propanone, puis hydrolyse', type: 'addition', requiert: ['organomagnésien'], exemple: ['EtMgBr', 'MBu2ol'], rendement: 65, partenaire: 'Pone',
    reactifs: 'propanone dans l’éther anhydre, puis eau (acidifiée)', conditions: 'à froid, puis hydrolyse',
    apps: { EtMgBr: { prod: ['MBu2ol'], eq: { r: [[1, 'EtMgBr'], [1, 'Pone'], [1, 'eau']], p: [[1, 'MBu2ol'], [1, 'MgOHBr']] } } } },
  { id: 'G6', nom: 'Oxydation d’un alcool secondaire', type: 'oxydo-réduction', requiert: ['alcool secondaire'], exemple: ['Bu2ol', 'Bu2one'], rendement: 85,
    reactifs: 'ions dichromate ou permanganate (oxydant) en milieu acide', conditions: 'chauffage doux',
    apps: { Bu2ol: { prod: ['Bu2one'], eq: { r: [[1, 'Bu2ol'], [1, 'ox']], p: [[1, 'Bu2one'], [1, 'eau']] } } },
    refus: { MBu2ol: 'Le 2-méthylbutan-2-ol est un alcool tertiaire : le carbone qui porte le groupe –OH n’a aucun atome H, il ne peut pas s’oxyder en cétone avec cet oxydant. La réaction ne se produit pas.' } },
  { id: 'G7', nom: 'Coupure oxydante d’un alcène', type: 'oxydo-réduction', requiert: ['alcène'], exemple: ['But2ene', 'AcEt'], rendement: 70,
    reactifs: 'ions permanganate (oxydant, en excès) en milieu acide', conditions: 'chauffage',
    apps: { But2ene: { prod: ['AcEt'], nbProduits: 2, eq: { r: [[1, 'But2ene'], [4, 'ox']], p: [[2, 'AcEt']] } } } },
];
export const reactionDe = id => BANQUE.find(r => r.id === id);
export const GROUPE_ART = { 'halogénoalcane': 'un bromoalcane', 'nitrile': 'un nitrile', 'amine': 'une amine', 'organomagnésien': 'un organomagnésien', 'aldéhyde': 'un aldéhyde',
  'cétone': 'une cétone', 'alcool secondaire': 'un alcool secondaire', 'alcool tertiaire': 'un alcool tertiaire', 'alcène': 'un alcène', 'acide carboxylique': 'un acide carboxylique' };
export const defini = nom => (/^[aeiouyéèêâ]/i.test(nom) ? 'l’' : (/^propanone/.test(nom) ? 'la ' : 'le ')) + nom;
export const majuscule = t => t.charAt(0).toUpperCase() + t.slice(1);

// Applique une réaction à une molécule : { ok: true, produit, eq } ou { ok: false, raison }
export function appliquer(molId, reactionId) {
  const r = reactionDe(reactionId), m = MOLS[molId];
  if (!r) return { ok: false, raison: 'Choisissez une réaction de la banque.' };
  if (r.refus && r.refus[molId]) return { ok: false, raison: r.refus[molId] };
  if (!r.requiert.some(g => m.groupes.includes(g))) {
    const attendu = r.requiert.map(g => GROUPE_ART[g]).join(' ou ');
    const possede = m.groupes.length === 1 ? `est ${GROUPE_ART[m.groupes[0]]}` : `possède ${m.groupes.map(g => GROUPE_ART[g]).join(' et ')}`;
    return { ok: false, raison: `Cette réaction transforme ${attendu} ; ${defini(m.nom)} ${possede} : le groupe attendu est absent.` };
  }
  const a = r.apps[molId];
  if (!a) return { ok: false, raison: 'La banque ne donne pas de produit pour cette molécule : cas non traité ici.' };
  return { ok: true, produit: a.prod[0], eq: a.eq, nbProduits: a.nbProduits || 1, effet: effetSquelette(molId, a.prod[0]) };
}
export function derouler(depart, suite) {
  const pas = []; let courante = depart, echec = null;
  for (let k = 0; k < suite.length; k++) {
    if (!suite[k]) { echec = { k, raison: 'Choisissez une réaction pour cette étape.' }; break; }
    const res = appliquer(courante, suite[k]);
    if (!res.ok) { echec = { k, raison: res.raison }; break; }
    pas.push({ reaction: suite[k], de: courante, vers: res.produit, effet: res.effet, nbProduits: res.nbProduits });
    courante = res.produit;
  }
  const complet = !echec && pas.length === suite.length;
  const rend = pas.reduce((p, s) => p * reactionDe(s.reaction).rendement / 100, 1);
  return { pas, echec, finale: complet ? courante : null, derniere: courante, rendementGlobal: pas.length ? rend * 100 : null };
}
export function bilanSequence(depart, cible, suite) { const d = derouler(depart, suite); return { ...d, atteint: !d.echec && d.finale === cible }; }
export function sequences(depart, cible, n) {
  const sorties = [];
  const rec = (mol, suite) => {
    if (suite.length === n) { if (mol === cible) sorties.push([...suite]); return; }
    for (const r of BANQUE) { const res = appliquer(mol, r.id); if (res.ok) rec(res.produit, [...suite, r.id]); }
  };
  rec(depart, []);
  return sorties;
}
export function longueurMin(depart, cible, nMax = 4) {
  if (depart === cible) return 0;
  for (let n = 1; n <= nMax; n++) if (sequences(depart, cible, n).length) return n;
  return null;
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
export const texteBilan = eq => { const t = l => l.map(([c, id]) => `${c > 1 ? c + ' ' : ''}${formuleEspece(id)}`).join(' + '); return `${t(eq.r)} → ${t(eq.p)}`; };

// ---------- cas à construire (liste curatée) : n = nombre d'étapes de la plus courte séquence (vérifié par chcModele.test.mjs) ----------
export const CAS = [
  { depart: 'BrEt', cible: 'PrCN', n: 1 }, { depart: 'BrEt', cible: 'PrNH2', n: 2 }, { depart: 'BrEt', cible: 'Bu2ol', n: 2 },
  { depart: 'BrEt', cible: 'MBu2ol', n: 2 }, { depart: 'BrEt', cible: 'Bu2one', n: 3 }, { depart: 'EtMgBr', cible: 'Bu2one', n: 2 },
];
export const CAS_DEFI = CAS.filter(c => c.n >= 2);
export const tirageSequence = (rnd = Math.random) => CAS_DEFI[Math.floor(rnd() * CAS_DEFI.length)];

// ====================================================
//  Défi « analyse » : trois questions tirées (tirages purs, hasard injecté pour les tests)
//  Chaque question : { id, type: 'qcm' | 'num', q, options?, bonne?, vrai?, tol?, unite?, indice, pieges?, expl }
// ====================================================
const melange = (t, rnd) => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const qcmOptions = (liste, rnd) => { const m = melange(liste, rnd); return { options: m.map(([t]) => t), bonne: m.findIndex(([, b]) => b) }; };
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
// couples (réaction, molécule de départ) de la banque
export const COUPLES = BANQUE.map(r => ({ r: r.id, dep: r.exemple[0], prod: r.exemple[1] }));
const nbCDe = id => squelette(MOLS[id]).nC;
const phraseEffet = (c) => {
  const dep = nbCDe(c.dep), arr = nbCDe(c.prod), e = effetSquelette(c.dep, c.prod);
  if (e === 'inchange') return 'le squelette carboné est conservé : seul un groupe est transformé';
  if (e === 'raccourci') return `le squelette carboné est raccourci : de ${dep} à ${arr} atomes de carbone par molécule`;
  if (e === 'allongeRamifie') return `le squelette carboné est allongé de ${arr - dep} atomes de carbone et ramifié`;
  return `le squelette carboné est allongé de ${arr - dep} atome${arr - dep > 1 ? 's' : ''} de carbone, sans ramification`;
};
export const phraseEffetDe = phraseEffet;
export function tirageAnalyse(rnd = Math.random) {
  // Q1 : nombre d'atomes de carbone du produit organique principal de la réaction tirée
  const c1 = tire(COUPLES.filter(c => c.r !== 'G7' && c.r !== 'G6'), rnd), v1 = nbCDe(c1.prod);
  const part = reactionDe(c1.r).partenaire, nPart = part ? nbCDe(part) : 0, nDep = nbCDe(c1.dep);
  const q1 = { id: 'c1', type: 'num', unite: '', vrai: v1, tol: 0,
    q: `La réaction ${c1.r} (${reactionDe(c1.r).nom.toLowerCase()}) est appliquée à ${defini(MOLS[c1.dep].nom)} (${nDep} atomes de carbone${part ? `) avec ${defini(NOM_PARTENAIRE[part])} (${nPart} atomes de carbone` : ''}). Combien d’atomes de carbone compte le produit organique obtenu ?`,
    indice: part ? 'La liaison C–C qui se forme réunit les deux squelettes : comptez les atomes de carbone de chaque réactif organique, sans oublier ceux du groupe de l’organomagnésien.' : (c1.r === 'G1' ? 'Les ions cyanure CN⁻ apportent un atome de carbone au squelette ; l’atome de brome part sous forme d’ion bromure.' : 'Comparez les squelettes carbonés avant et après la réaction : le groupe change-t-il le nombre d’atomes de carbone ?'),
    pieges: [[nDep, 'Vous avez gardé le nombre d’atomes de carbone de la molécule de départ : ici le squelette a changé ou a reçu un autre réactif.'], [nDep + (part ? nPart - 1 : 0), 'Il manque un atome de carbone : comptez séparément les atomes de carbone de chaque réactif organique, puis additionnez-les.']].filter(([v]) => v !== v1),
    expl: part ? `Le produit réunit le squelette de ${defini(MOLS[c1.dep].nom)} (${nDep} atomes de carbone) et celui de ${defini(NOM_PARTENAIRE[part])} (${nPart}) : ${nDep} + ${nPart} = ${v1} atomes de carbone.` : (c1.r === 'G1' ? `Le groupe cyano apporte un atome de carbone : ${nDep} + 1 = ${v1} atomes de carbone.` : `Aucun atome de carbone n’est ajouté ni retiré : ${v1} atomes de carbone avant et après.`) };
  // Q2 : effet de la réaction tirée sur le squelette (QCM, le distracteur est l'effet d'une autre réaction)
  const choix2 = melange(COUPLES, rnd).filter(c => c.r !== c1.r)[0];
  const bonne2 = phraseEffet(choix2);
  const autres = [...new Set(COUPLES.filter(c => phraseEffet(c) !== bonne2).map(phraseEffet))];
  let dist = melange(autres, rnd).slice(0, 3);
  // la bonne réponse n'est jamais la plus longue : au besoin, un distracteur (faux pour toute la banque) plus long la remplace
  const DECOY = 'le squelette carboné est à la fois raccourci et ramifié, avec un atome de carbone lié à trois autres carbones';
  if (dist.every(t => t.length <= bonne2.length)) dist = [...dist.slice(0, 2), DECOY];
  const q2 = { id: 'c2', type: 'qcm', q: `Quel est l’effet de la réaction ${choix2.r} (${reactionDe(choix2.r).nom.toLowerCase()}) sur le squelette carboné de ${defini(MOLS[choix2.dep].nom)} ?`,
    ...qcmOptions([[bonne2, true], ...dist.map(t => [t, false])], rnd),
    indice: 'Comptez les atomes de carbone de la molécule organique avant et après (formules topologiques de la carte), et regardez si une liaison C–C apparaît ou disparaît.',
    expl: `${majuscule(bonne2)}.` };
  // Q3 : quelle réaction (en une étape) conduit de la molécule de départ à la cible ?
  const c3 = tire(COUPLES, rnd), bonne3 = majuscule(reactionDe(c3.r).nom);
  let autresR = melange(BANQUE.filter(r => r.id !== c3.r), rnd).slice(0, 3).map(r => [majuscule(r.nom), false]);
  // jamais la bonne réponse la plus longue : au besoin, un distracteur plus long (réaction hors banque) la remplace
  if (autresR.every(([t]) => t.length <= bonne3.length)) autresR = [...autresR.slice(0, 2), ['Hydrolyse d’un bromoalcane en milieu basique, en solution aqueuse', false]];
  const q3 = { id: 'c3', type: 'qcm', q: `Quelle réaction de la banque transforme ${defini(MOLS[c3.dep].nom)} en ${MOLS[c3.prod].nom}${reactionDe(c3.r).partenaire ? ` (avec ${defini(NOM_PARTENAIRE[reactionDe(c3.r).partenaire])} comme second réactif)` : ''} ?`,
    ...qcmOptions([[bonne3, true], ...autresR], rnd),
    indice: 'Cherchez la réaction dont le groupe de départ est celui de la molécule de départ, puis comparez le produit de la carte à la cible.',
    expl: `C’est la réaction ${c3.r} : elle part ${GROUPE_ART[MOLS[c3.dep].groupes[0]] ? 'd’' + GROUPE_ART[MOLS[c3.dep].groupes[0]] : 'de ce groupe'} et donne ${defini(MOLS[c3.prod].nom)}.` };
  const contr = t => (typeof t === 'string' ? t.replace(/(^|\s)à le /g, '$1au ').replace(/\bde le /g, 'du ').replace(/(^|\s)à la propanone/g, '$1à la propanone') : t);
  return { questions: [q1, q2, q3].map(q => ({ ...q, q: contr(q.q), expl: contr(q.expl), indice: contr(q.indice) })) };
}
