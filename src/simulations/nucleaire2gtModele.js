// ====================================================
//  MODÈLE DE LA SIMULATION 203 « TRANSFORMATION NUCLÉAIRE : ISOTOPES, SOLEIL ET CENTRALES » (2GT, partie « Modéliser une transformation nucléaire »).
//  Fichier sans React, testé par nucleaire2gtModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • tout est QUALITATIF : on identifie des isotopes, on reconnaît la nature d'une transformation (physique, chimique, nucléaire), on relie l'énergie du Soleil
//     et d'une centrale à des réactions nucléaires ; aucun calcul d'énergie, pas de relation masse-énergie, pas de chiffre à retenir ;
//   • les noyaux sont dessinés « à plat » : le NOMBRE de protons et de neutrons de chaque dessin est exact (nucleons() est testé), leur arrangement et leur taille sont schématiques ;
//   • les écritures de fusion et de fission sont données à LIRE : la conservation du nombre de nucléons A et du nombre de protons Z y est vérifiée par ce modèle
//     (bilan()), jamais à établir par l'élève (ni les désintégrations, au programme de Terminale) ;
//   • fusion : l'exemple écrit est celui du deutérium et du tritium (²H + ³H → ⁴He + n), plus simple que la chaîne de réactions du Soleil, qui transforme aussi
//     de l'hydrogène en hélium en plusieurs étapes ;
//   • fission : l'uranium 235 reçoit un neutron et se casse en deux noyaux plus petits en libérant des neutrons ; les deux couples écrits (strontium 94 + xénon 140, krypton 92 + baryum 141) sont deux
//     des nombreuses issues possibles de la fission ;
//   • classement des transformations : physique (mêmes molécules, autre rangement ou autre mélange : changement d'état, dissolution), chimique (molécules différentes, mêmes atomes, noyaux inchangés),
//     nucléaire (noyaux modifiés, l'élément change) ;
//   • déchets, sûreté, réaction en chaîne et désintégrations : seulement dans « Au-delà du parcours ».
// ====================================================

export const NB = ' ';

// ---------- éléments (symbole, nom) ----------
export const ELEMENTS = {
  0: ['n', 'neutron'], 1: ['H', 'hydrogène'], 2: ['He', 'hélium'], 3: ['Li', 'lithium'], 4: ['Be', 'béryllium'], 5: ['B', 'bore'], 6: ['C', 'carbone'], 7: ['N', 'azote'], 8: ['O', 'oxygène'],
  9: ['F', 'fluor'], 10: ['Ne', 'néon'], 11: ['Na', 'sodium'], 12: ['Mg', 'magnésium'], 13: ['Al', 'aluminium'], 14: ['Si', 'silicium'], 15: ['P', 'phosphore'], 16: ['S', 'soufre'],
  17: ['Cl', 'chlore'], 18: ['Ar', 'argon'], 36: ['Kr', 'krypton'], 38: ['Sr', 'strontium'], 54: ['Xe', 'xénon'], 56: ['Ba', 'baryum'], 90: ['Th', 'thorium'], 92: ['U', 'uranium'], 94: ['Pu', 'plutonium'],
};
export const sym = Z => ELEMENTS[Z][0];
export const nomEl = Z => ELEMENTS[Z][1];
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
const enSup = x => String(x).replace(/[0-9]/g, c => SUP[c]), enSub = x => String(x).replace(/[0-9]/g, c => SUB[c]);
// noyau : { Z, A }
export const noyau = (Z, A) => ({ Z, A });
export const symbole = n => `${enSup(n.A)}${enSub(n.Z)}${sym(n.Z)}`;                          // ¹²₆C (texte brut : aria-label, tests)
export const nomNoyau = n => (n.Z === 0 ? 'neutron' : `${nomEl(n.Z)} ${n.A}`);                   // carbone 12
export const cle = n => `${n.Z}-${n.A}`;
export const sontIsotopes = (a, b) => a.Z === b.Z && a.A !== b.A;

// ---------- isotopes connus (nombres justes ; stables ou naturels, sauf H-3, C-14, U-234/235/238, Be-10 qui sont radioactifs) ----------
export const ISOTOPES = {
  1: [1, 2, 3], 2: [3, 4], 3: [6, 7], 4: [9, 10], 5: [10, 11], 6: [12, 13, 14], 7: [14, 15], 8: [16, 17, 18], 9: [19], 10: [20, 21, 22], 11: [23], 12: [24, 25, 26], 13: [27],
  14: [28, 29, 30], 15: [31], 16: [32, 33, 34, 36], 17: [35, 37], 18: [36, 38, 40], 92: [234, 235, 238],
};
export const isotopesDe = Z => (ISOTOPES[Z] || []).map(A => noyau(Z, A));
export const Z_LISTE = Object.keys(ISOTOPES).map(Number);

// ---------- dessin d'un noyau : positions des nucléons (rayon d'un nucléon = 1) ----------
// Spirale de Vogel ; l'échelle est choisie pour que deux nucléons voisins se touchent presque (distance minimale 2,06) ; le nucléon i est un proton quand floor((i+1)·Z/A) > floor(i·Z/A)
// (exactement Z protons, répartis dans toute la spirale : protons et neutrons sont mélangés).
const DOR = 2.399963229728653;
export function nucleons(Z, A) {
  const pts = Array.from({ length: A }, (_, i) => ({ x: Math.sqrt(i + 0.5) * Math.cos(i * DOR), y: Math.sqrt(i + 0.5) * Math.sin(i * DOR) }));
  let dmin = Infinity;
  for (let i = 0; i < A; i++) for (let j = i + 1; j < A; j++) dmin = Math.min(dmin, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
  const k = A > 1 ? 2.06 / dmin : 1;
  const cx = pts.reduce((a, p) => a + p.x, 0) / A, cy = pts.reduce((a, p) => a + p.y, 0) / A;
  const res = pts.map((p, i) => ({ x: (p.x - cx) * k, y: (p.y - cy) * k, proton: Math.floor(((i + 1) * Z) / A) > Math.floor((i * Z) / A) }));
  const R = Math.max(...res.map(p => Math.hypot(p.x, p.y))) + 1;
  return { pts: res, R };
}
const _cache = new Map();
export const nucleonsC = (Z, A) => { const c = `${Z}-${A}`; if (!_cache.has(c)) _cache.set(c, nucleons(Z, A)); return _cache.get(c); };

// ---------- réactions nucléaires (à lire) ----------
// terme : { c: coefficient, Z, A }
const N0 = { Z: 0, A: 1 }, H2 = { Z: 1, A: 2 }, H3 = { Z: 1, A: 3 }, He4 = { Z: 2, A: 4 }, He3 = { Z: 2, A: 3 }, U235 = { Z: 92, A: 235 };
const t = (n, c = 1) => ({ c, Z: n.Z, A: n.A });
export const REACTIONS = {
  dt: { id: 'dt', type: 'fusion', gauche: [t(H2), t(H3)], droite: [t(He4), t(N0)], titre: 'fusion du deutérium et du tritium' },
  dd: { id: 'dd', type: 'fusion', gauche: [t(H2), t(H2)], droite: [t(He3), t(N0)], titre: 'fusion de deux noyaux de deutérium' },
  fissionSr: { id: 'fissionSr', type: 'fission', gauche: [t(U235), t(N0)], droite: [t({ Z: 38, A: 94 }), t({ Z: 54, A: 140 }), t(N0, 2)], titre: 'fission de l’uranium 235 (strontium 94 et xénon 140)' },
  fissionKr: { id: 'fissionKr', type: 'fission', gauche: [t(U235), t(N0)], droite: [t({ Z: 36, A: 92 }), t({ Z: 56, A: 141 }), t(N0, 3)], titre: 'fission de l’uranium 235 (krypton 92 et baryum 141)' },
};
const somme = (L, cle2) => L.reduce((a, x) => a + x.c * x[cle2], 0);
// bilan des nombres A et Z de chaque côté : le modèle VÉRIFIE la conservation, l'élève n'a jamais à l'établir
export const bilan = r => ({ A: [somme(r.gauche, 'A'), somme(r.droite, 'A')], Z: [somme(r.gauche, 'Z'), somme(r.droite, 'Z')], ok: somme(r.gauche, 'A') === somme(r.droite, 'A') && somme(r.gauche, 'Z') === somme(r.droite, 'Z') });
export const neutronsProduits = r => r.droite.filter(x => x.Z === 0 && x.A === 1).reduce((a, x) => a + x.c, 0);
export const neutronsConsommes = r => r.gauche.filter(x => x.Z === 0 && x.A === 1).reduce((a, x) => a + x.c, 0);
export const termeTexte = x => `${x.c > 1 ? `${x.c}${NB}` : ''}${symbole(x)}`;
export const reactionTexte = r => `${r.gauche.map(termeTexte).join(' + ')} → ${r.droite.map(termeTexte).join(' + ')}`;

// ---------- transformations chimiques et physiques (écritures à lire) ----------
// espèce : { f, atomes, q, etat } ; terme : { c, e }
const E = (f, atomes, etat, q = 0) => ({ f, atomes, etat, q });
export const ESP = {
  H2Ol: E('H₂O', { H: 2, O: 1 }, 'l'), H2Og: E('H₂O', { H: 2, O: 1 }, 'g'), CO2s: E('CO₂', { C: 1, O: 2 }, 's'), CO2g: E('CO₂', { C: 1, O: 2 }, 'g'), N2l: E('N₂', { N: 2 }, 'l'), N2g: E('N₂', { N: 2 }, 'g'),
  CH4: E('CH₄', { C: 1, H: 4 }, 'g'), O2: E('O₂', { O: 2 }, 'g'), Cs: E('C', { C: 1 }, 's'), Zn: E('Zn', { Zn: 1 }, 's'), Hp: E('H⁺', { H: 1 }, 'aq', 1), Zn2: E('Zn²⁺', { Zn: 1 }, 'aq', 2), H2: E('H₂', { H: 2 }, 'g'),
  CaCO3: E('CaCO₃', { Ca: 1, C: 1, O: 3 }, 's'), Ca2: E('Ca²⁺', { Ca: 1 }, 'aq', 2), Mg: E('Mg', { Mg: 1 }, 's'), MgO: E('MgO', { Mg: 1, O: 1 }, 's'),
};
const c = (e, n = 1) => ({ c: n, e: ESP[e] });
export const ECRITURES = {
  vapo: { gauche: [c('H2Ol')], droite: [c('H2Og')] },
  sublim: { gauche: [c('CO2s')], droite: [c('CO2g')] },
  vapoN2: { gauche: [c('N2l')], droite: [c('N2g')] },
  methane: { gauche: [c('CH4'), c('O2', 2)], droite: [c('CO2g'), c('H2Og', 2)] },
  carbone: { gauche: [c('Cs'), c('O2')], droite: [c('CO2g')] },
  zinc: { gauche: [c('Zn'), c('Hp', 2)], droite: [c('Zn2'), c('H2')] },
  calcaire: { gauche: [c('CaCO3'), c('Hp', 2)], droite: [c('Ca2'), c('CO2g'), c('H2Ol')] },
  magnesium: { gauche: [c('Mg', 2), c('O2')], droite: [c('MgO', 2)] },
};
const termeChim = x => `${x.c > 1 ? `${x.c}${NB}` : ''}${x.e.f}(${x.e.etat})`;
export const ecritureTexte = r => `${r.gauche.map(termeChim).join(' + ')} → ${r.droite.map(termeChim).join(' + ')}`;
export const bilanChimique = r => {
  const at = L => { const o = {}; for (const x of L) for (const [k, v] of Object.entries(x.e.atomes)) o[k] = (o[k] || 0) + x.c * v; return o; };
  const q = L => L.reduce((a, x) => a + x.c * x.e.q, 0);
  const g = at(r.gauche), d = at(r.droite), cles = new Set([...Object.keys(g), ...Object.keys(d)]);
  return { atomes: [g, d], charge: [q(r.gauche), q(r.droite)], ok: [...cles].every(k => g[k] === d[k]) && q(r.gauche) === q(r.droite) };
};
// physique : mêmes formules des deux côtés, seuls les états changent
export const estPhysique = r => r.gauche.length === 1 && r.droite.length === 1 && r.gauche[0].e.f === r.droite[0].e.f && r.gauche[0].e.etat !== r.droite[0].e.etat;

// ---------- les trois natures ----------
export const NATURES = [
  { id: 'physique', nom: 'physique', phrase: 'les molécules sont les mêmes, seul leur rangement ou leur mélange change' },
  { id: 'chimique', nom: 'chimique', phrase: 'les molécules changent, mais les atomes et leurs noyaux sont conservés' },
  { id: 'nucleaire', nom: 'nucléaire', phrase: 'les noyaux changent : un élément chimique devient un autre' },
];
export const nature = id => NATURES.find(n => n.id === id);
// Ce qui est conservé (molécules, atomes ou éléments, noyaux) selon la nature : poupées russes
export const CONSERVE = { physique: { molecules: true, atomes: true, noyaux: true }, chimique: { molecules: false, atomes: true, noyaux: true }, nucleaire: { molecules: false, atomes: false, noyaux: false } };

// Situations (défi 2, exercices) : description et/ou écriture
export const SITUATIONS = [
  { id: 'glacon', court: 'Un glaçon qui fond', nature: 'physique', texte: 'Un glaçon posé sur une table fond.', pourquoi: 'Les molécules d’eau sont les mêmes avant et après : seul leur rangement change (changement d’état).' },
  { id: 'buee', court: 'De la buée sur un miroir', nature: 'physique', texte: 'De la buée se dépose sur un miroir froid.', pourquoi: 'La vapeur d’eau devient de l’eau liquide : ce sont toujours des molécules H₂O, il s’agit d’un changement d’état.' },
  { id: 'sucre', court: 'Du sucre dans du thé', nature: 'physique', texte: 'Du sucre se dissout dans du thé chaud.', pourquoi: 'Les molécules de sucre restent les mêmes : elles se mêlent à l’eau. Aucune espèce nouvelle n’apparaît.' },
  { id: 'ebullition', court: 'L’eau qui bout', nature: 'physique', texte: 'L’eau d’une casserole bout.', ecriture: 'vapo', pourquoi: 'La formule H₂O est la même des deux côtés : seul l’état change (liquide vers gaz).' },
  { id: 'glaceSeche', court: 'La glace sèche', nature: 'physique', texte: 'La « glace sèche » (dioxyde de carbone solide) disparaît en laissant un gaz.', ecriture: 'sublim', pourquoi: 'La formule CO₂ est la même des deux côtés : seul l’état change (solide vers gaz).' },
  { id: 'azote', court: 'Le diazote liquide', nature: 'physique', texte: 'Du diazote liquide, très froid, se transforme en gaz.', ecriture: 'vapoN2', pourquoi: 'La formule N₂ est la même des deux côtés : seul l’état change.' },
  { id: 'gaziniere', court: 'Du méthane qui brûle', nature: 'chimique', texte: 'Du méthane brûle dans le brûleur d’une gazinière.', ecriture: 'methane', pourquoi: 'Des molécules (CH₄, O₂) disparaissent et d’autres apparaissent (CO₂, H₂O) ; les atomes C, H et O sont conservés.' },
  { id: 'carbone', court: 'Du carbone qui brûle', nature: 'chimique', texte: 'Du carbone brûle dans le dioxygène.', ecriture: 'carbone', pourquoi: 'Une nouvelle espèce, CO₂, se forme ; les atomes C et O sont conservés, leurs noyaux ne changent pas.' },
  { id: 'zinc', court: 'Le zinc dans l’acide', nature: 'chimique', texte: 'Du zinc plongé dans de l’acide chlorhydrique dégage des bulles de dihydrogène.', ecriture: 'zinc', pourquoi: 'De nouvelles espèces apparaissent (ions zinc, dihydrogène) ; les atomes Zn et H sont conservés.' },
  { id: 'rouille', court: 'Un clou qui rouille', nature: 'chimique', texte: 'Un clou de fer rouille à l’air humide.', pourquoi: 'Le fer et le dioxygène forment de nouvelles espèces (oxydes de fer) ; les atomes de fer et d’oxygène sont conservés.' },
  { id: 'calcaire', court: 'Le calcaire et le détartrant', nature: 'chimique', texte: 'Du vinaigre ou un détartrant fait mousser du calcaire.', ecriture: 'calcaire', pourquoi: 'Le calcaire réagit et du dioxyde de carbone se dégage : de nouvelles espèces apparaissent, les atomes sont conservés.' },
  { id: 'magnesium', court: 'Du magnésium qui brûle', nature: 'chimique', texte: 'Un ruban de magnésium brûle avec une flamme blanche éblouissante.', ecriture: 'magnesium', pourquoi: 'Du magnésium et du dioxygène donnent de l’oxyde de magnésium : nouvelle espèce, atomes conservés.' },
  { id: 'soleil', court: 'Le cœur du Soleil', nature: 'nucleaire', texte: 'Dans le cœur du Soleil, des noyaux d’hydrogène s’assemblent en noyaux d’hélium.', pourquoi: 'Des noyaux sont transformés en d’autres noyaux et l’hydrogène devient de l’hélium : c’est une fusion nucléaire.' },
  { id: 'centrale', court: 'Le réacteur d’une centrale', nature: 'nucleaire', texte: 'Dans le réacteur d’une centrale, un noyau d’uranium 235 reçoit un neutron et se casse en deux noyaux plus petits.', pourquoi: 'Le noyau d’uranium est cassé : les noyaux d’arrivée sont ceux d’autres éléments. C’est une fission nucléaire.' },
  { id: 'dt', court: 'Deutérium et tritium', nature: 'nucleaire', texte: 'Des chercheurs étudient l’assemblage de noyaux de deutérium et de tritium.', reaction: 'dt', pourquoi: 'Des noyaux d’hydrogène (isotopes) s’assemblent en un noyau d’hélium : les noyaux changent, c’est une fusion nucléaire.' },
  { id: 'fissionA', court: 'Fission : strontium et xénon', nature: 'nucleaire', texte: 'Une fission dans un réacteur est écrite ainsi.', reaction: 'fissionSr', pourquoi: 'Les noyaux de départ (uranium) ne sont pas ceux d’arrivée (strontium, xénon) : les noyaux changent, c’est nucléaire.' },
  { id: 'fissionB', court: 'Fission : krypton et baryum', nature: 'nucleaire', texte: 'Une autre fission possible est écrite ainsi.', reaction: 'fissionKr', pourquoi: 'L’uranium se casse en krypton et en baryum : les éléments changent, la transformation est nucléaire.' },
  { id: 'dd', court: 'Deux noyaux de deutérium', nature: 'nucleaire', texte: 'Deux noyaux de deutérium s’assemblent.', reaction: 'dd', pourquoi: 'Deux noyaux d’hydrogène forment un noyau d’hélium : les éléments changent, c’est nucléaire.' },
];
export const situation = id => SITUATIONS.find(s => s.id === id);
const tire = a => a[Math.floor(Math.random() * a.length)];
export const tirerSituation = (prec = null) => { let s; do { s = tire(SITUATIONS); } while (prec && s.id === prec.id); return s; };

// ---------- défi 1 : trouver les isotopes d'un noyau dans une liste ----------
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const PEUVENT = Z_LISTE.filter(Z => ISOTOPES[Z].length >= 2);
export function tirerDefiIsotopes(prec = null) {
  for (let essai = 0; essai < 200; essai++) {
    const Z = tire(PEUVENT), A = tire(ISOTOPES[Z]), cible = noyau(Z, A);
    const autres = isotopesDe(Z).filter(n => n.A !== A), nBons = Math.min(autres.length, tire([1, 2, 2, 3]));
    const bons = shuffle(autres).slice(0, nBons);
    // pièges : un noyau de MÊME A et d'un autre élément (quand il existe), puis des noyaux d'autres éléments
    const memeA = [];
    for (const Z2 of Z_LISTE) if (Z2 !== Z && ISOTOPES[Z2].includes(A) && Z2 <= 18) memeA.push(noyau(Z2, A));
    const pieges = [];
    if (memeA.length) pieges.push(tire(memeA));
    const autresEl = shuffle(Z_LISTE.filter(z => z !== Z && z <= 18));
    for (const Z2 of autresEl) { if (pieges.length >= 6 - nBons) break; const A2 = tire(ISOTOPES[Z2]); if (!pieges.some(p => cle(p) === cle(noyau(Z2, A2))) && A2 !== A) pieges.push(noyau(Z2, A2)); }
    if (pieges.length < 6 - nBons) continue;
    const cand = shuffle([...bons, ...pieges.slice(0, 6 - nBons)]);
    if (prec && prec.cible && cle(prec.cible) === cle(cible)) continue;
    return { cible, candidats: cand, bonnes: new Set(bons.map(cle)), choix: new Set(), verifie: false };
  }
  throw new Error('tirage impossible');
}
export function verifierIsotopes(d, choix) {
  const sel = new Set(choix), manquants = [...d.bonnes].filter(k => !sel.has(k)), intrus = [...sel].filter(k => !d.bonnes.has(k));
  return { ok: manquants.length === 0 && intrus.length === 0, manquants, intrus };
}

// ---------- chiffres : arrondi français ----------
export const nombreFR = x => String(x).replace('.', ',').replace(/\s/g, NB);
