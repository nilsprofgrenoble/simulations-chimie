// ====================================================
//  Animations de la simulation 241 : une scène par réaction de la banque (G1 à G7), décrite par des données pures.
//  Chaque atome a une position de départ p0 et d'arrivée p1 (unités de liaison, y vers le haut) ; chaque liaison a un ordre de départ o0 et d'arrivée o1.
//  etatAu(scene, t) donne l'image à l'instant t ∈ [0, 1] ; verifierScene(scene) (chcScenes.test.mjs) contrôle par le graphe que
//  l'image t = 0 est celle des réactifs et l'image t = 1 celle des produits de la banque (formule brute, squelette, nombre de liaisons C–C).
//  Atome : { k, e, p0, p1, mv, label, side, vis, tag, debut, fin }
//    debut : 'react' (réactif organique de la carte) | 'ion' (réactif minéral) ; fin : 'prod' | 'ion' | 'gone'
//    side  : côté du voisin qui porte l'atome ('L', 'R', 'D', 'U') pour écrire OH / HO ; label : texte ou [[t, texte], …]
//    vis   : [entrée0, entrée1, sortie0, sortie1] (fondus) ; tag : charge entourée { txt, vis }
// ====================================================
import { MOLS, brute, squelette, formuleTexte } from './chcModele.js';

const A = (k, e, p0, p1, o = {}) => ({ k, e, p0, p1: p1 || p0, debut: 'react', fin: 'prod', ...o });
const B = (a, b, o0, o1, w, hi) => ({ a, b, o0, o1, w: w || [0.45, 0.7], hi });
const MV = [0.05, 0.55];
export const lisse = x => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
const fen = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : lisse((t - a) / (b - a)));

export const SCENES = {
  G1: {
    reactions: 'G1', titre: 'G1 : le carbone de CN⁻ vient se lier à la chaîne',
    atomes: [
      A('c0', 'C', [0, 0]), A('c1', 'C', [0.866, 0.5]),
      A('br', 'Br', [1.732, 0], [3.4, 2.0], { mv: [0.1, 0.5], label: 'Br', fin: 'ion', tag: { txt: '−', vis: [0.3, 0.5, 1.1, 1.2] } }),
      A('cc', 'C', [3.3, -1.3], [1.732, 0], { mv: [0.4, 0.85], debut: 'ion', tag: { txt: '−', vis: [0, 0, 0.45, 0.6] } }),
      A('nn', 'N', [4.166, -1.8], [2.598, -0.5], { mv: [0.4, 0.85], label: 'N', debut: 'ion' }),
    ],
    liaisons: [B('c0', 'c1', 1, 1), B('c1', 'br', 1, 0, [0.15, 0.4], 'rompue'), B('c1', 'cc', 0, 1, [0.62, 0.85], 'nouvelle'), B('cc', 'nn', 3, 3)],
    cle: { txt: 'nouvelle liaison C–C', x: 0.0, y: -1.45, ancre: 'start', apres: 0.78 },
    phases: ['Avant : le bromoéthane (2 atomes de carbone) et un ion cyanure CN⁻ (1 atome de carbone).', 'Le carbone de CN⁻ prend la place de l’atome Br : une liaison C–C se forme.', 'Après : le propanenitrile compte 3 atomes de carbone ; Br est parti sous forme d’ion bromure Br⁻.'],
    phasesNeutres: ['Avant : le bromoéthane et un ion cyanure CN⁻.', 'L’ion cyanure vient se placer à la place de l’atome Br.', 'Après : un nouveau composé ; Br est parti sous forme d’ion bromure Br⁻.'],
    reactifs: ['BrEt'], produits: [['PrCN', 1]],
    resume: 'Animation : un ion cyanure arrive sur le bromoéthane, son atome de carbone se lie à la chaîne à la place de l’atome de brome, qui part en ion bromure.',
  },
  G2: {
    reactions: 'G2', titre: 'G2 : la triple liaison C≡N devient une liaison simple',
    atomes: [
      A('c0', 'C', [0, 0]), A('c1', 'C', [0.866, 0.5]), A('c2', 'C', [1.732, 0]),
      A('nn', 'N', [2.598, -0.5], [2.598, 0.5], { mv: [0.35, 0.65], label: [[0, 'N'], [0.55, 'NH₂']], side: 'L' }),
      A('h', 'chip', [1.7, 2.1], [1.7, 2.1], { label: '4 [H]', debut: 'ion', fin: 'gone', vis: [0.1, 0.3, 0.7, 0.85] }),
    ],
    liaisons: [B('c0', 'c1', 1, 1), B('c1', 'c2', 1, 1), B('c2', 'nn', 3, 1, [0.4, 0.65], 'change')],
    cle: { txt: 'C≡N devient C–N', x: 1.0, y: -1.05, ancre: 'start', apres: 0.78 },
    phases: ['Avant : un nitrile, avec la triple liaison C≡N.', 'LiAlH₄ apporte de l’hydrogène [H] : la triple liaison devient une liaison simple.', 'Après : une amine –CH₂–NH₂ ; 3 atomes de carbone avant comme après : le squelette est inchangé.'],
    phasesNeutres: ['Avant : un nitrile.', 'LiAlH₄ apporte de l’hydrogène [H].', 'Après : une amine.'],
    reactifs: ['PrCN'], produits: [['PrNH2', 1]],
    resume: 'Animation : de l’hydrogène [H] est apporté au propanenitrile, la triple liaison C≡N devient simple et le groupe NH₂ apparaît ; la chaîne de 3 atomes de carbone ne change pas.',
  },
  G3: {
    reactions: 'G3', titre: 'G3 : le magnésium s’insère entre le carbone et le brome',
    atomes: [
      A('c0', 'C', [0, 0]), A('c1', 'C', [0.866, 0.5]),
      A('br', 'Br', [1.732, 0], [2.598, -0.5], { mv: [0.05, 0.45], label: 'Br' }),
      A('mg', 'Mg', [3.6, 1.6], [1.732, 0], { mv: [0.25, 0.7], label: 'Mg', debut: 'ion' }),
    ],
    liaisons: [B('c0', 'c1', 1, 1), B('c1', 'br', 1, 0, [0.1, 0.35], 'rompue'), B('c1', 'mg', 0, 1, [0.6, 0.78], 'change'), B('mg', 'br', 0, 1, [0.65, 0.82])],
    cle: { txt: 'C–Br devient C–Mg', x: 0.7, y: -1.25, ancre: 'start', apres: 0.8 },
    phases: ['Avant : le bromoéthane et le magnésium (dans l’éther anhydre).', 'Le magnésium s’insère : la liaison C–Br est remplacée par C–Mg et Mg–Br.', 'Après : un organomagnésien ; toujours 2 atomes de carbone. Le carbone lié à Mg est prêt à se lier à un autre carbone.'],
    phasesNeutres: ['Avant : le bromoéthane et le magnésium (éther anhydre).', 'Le magnésium s’insère à la place de l’atome Br.', 'Après : un organomagnésien.'],
    reactifs: ['BrEt'], produits: [['EtMgBr', 1]],
    resume: 'Animation : l’atome de brome s’écarte, le magnésium s’insère entre le carbone et le brome ; on obtient le bromure d’éthylmagnésium, toujours à 2 atomes de carbone.',
  },
  G4: {
    reactions: 'G4', titre: 'G4 : le carbone de l’organomagnésien se lie au carbone du C=O',
    atomes: [
      A('c0', 'C', [0, 0]), A('c1', 'C', [0.866, 0.5]),
      A('mg', 'Mg', [1.732, 0], [1.732, 0], { label: 'Mg', fin: 'ion', vis: [0, 0, 0.84, 0.96], tag: { txt: '+', vis: [0.64, 0.74, 0.84, 0.92] } }),
      A('br', 'Br', [2.598, -0.5], [2.598, -0.5], { label: 'Br', fin: 'ion', vis: [0, 0, 0.84, 0.96] }),
      A('ca', 'C', [4.066, 1.5], [0.866, 1.5], { mv: [0.08, 0.5], debut: 'react2' }),
      A('c3', 'C', [4.932, 2.0], [1.732, 2.0], { mv: [0.08, 0.5], debut: 'react2' }),
      A('o', 'O', [3.2, 2.0], [0, 2.0], { mv: [0.08, 0.5], label: [[0, 'O'], [0.8, 'OH']], side: 'R', debut: 'react2', tag: { txt: '−', vis: [0.62, 0.72, 0.8, 0.88] } }),
      A('w', 'chip', [1.1, 3.6], [1.1, 3.6], { label: 'H₂O, H⁺', debut: 'ion', fin: 'gone', vis: [0.74, 0.82, 0.92, 0.99] }),
    ],
    liaisons: [B('c0', 'c1', 1, 1), B('c1', 'mg', 1, 0, [0.58, 0.72], 'rompue'), B('mg', 'br', 1, 1), B('ca', 'c3', 1, 1), B('ca', 'o', 2, 1, [0.52, 0.66]), B('c1', 'ca', 0, 1, [0.5, 0.66], 'nouvelle')],
    cle: { txt: 'nouvelle liaison C–C', x: 1.4, y: 1.0, ancre: 'start', apres: 0.8 },
    phases: ['Avant : l’organomagnésien (2 atomes de carbone) et l’éthanal (2 atomes de carbone).', 'Le carbone lié à Mg se lie au carbone du groupe C=O : une liaison C–C se forme.', 'Après hydrolyse (eau acidifiée) : le butan-2-ol compte 4 atomes de carbone.'],
    phasesNeutres: ['Avant : l’organomagnésien et l’éthanal.', 'Les deux molécules se rapprochent et se lient.', 'Après hydrolyse (eau acidifiée) : un alcool.'],
    reactifs: ['EtMgBr', 'Ald'], produits: [['Bu2ol', 1]],
    resume: 'Animation : l’éthanal arrive sur l’organomagnésien, une liaison C–C se forme entre le carbone lié à Mg et le carbone du C=O ; après hydrolyse on obtient le butan-2-ol à 4 atomes de carbone.',
  },
  G5: {
    reactions: 'G5', titre: 'G5 : le carbone du C=O porte déjà deux groupes CH₃',
    atomes: [
      A('c0', 'C', [0, 0]), A('c1', 'C', [0.866, 0.5]),
      A('mg', 'Mg', [1.732, 0], [1.732, 0], { label: 'Mg', fin: 'ion', vis: [0, 0, 0.84, 0.96], tag: { txt: '+', vis: [0.64, 0.74, 0.84, 0.92] } }),
      A('br', 'Br', [2.598, -0.5], [2.598, -0.5], { label: 'Br', fin: 'ion', vis: [0, 0, 0.84, 0.96] }),
      A('ca', 'C', [4.066, 1.5], [0.866, 1.5], { mv: [0.08, 0.5], debut: 'react2' }),
      A('c3', 'C', [4.932, 1.0], [1.866, 1.5], { mv: [0.08, 0.5], debut: 'react2' }),
      A('c4', 'C', [3.2, 1.0], [-0.134, 1.5], { mv: [0.08, 0.5], debut: 'react2' }),
      A('o', 'O', [4.066, 2.5], [0.866, 2.5], { mv: [0.08, 0.5], label: [[0, 'O'], [0.8, 'OH']], side: 'D', debut: 'react2', tag: { txt: '−', vis: [0.62, 0.72, 0.8, 0.88] } }),
      A('w', 'chip', [3.1, 3.7], [1.7, 3.7], { label: 'H₂O, H⁺', debut: 'ion', fin: 'gone', vis: [0.74, 0.82, 0.92, 0.99], mv: [0.7, 0.85] }),
    ],
    liaisons: [B('c0', 'c1', 1, 1), B('c1', 'mg', 1, 0, [0.58, 0.72], 'rompue'), B('mg', 'br', 1, 1), B('ca', 'c3', 1, 1), B('ca', 'c4', 1, 1), B('ca', 'o', 2, 1, [0.52, 0.66]), B('c1', 'ca', 0, 1, [0.5, 0.66], 'nouvelle')],
    cle: { txt: 'nouvelle liaison C–C', x: 1.4, y: 0.98, ancre: 'start', apres: 0.8 },
    phases: ['Avant : l’organomagnésien (2 atomes de carbone) et la propanone (3 atomes de carbone).', 'Le carbone lié à Mg se lie au carbone du C=O, qui porte déjà deux groupes CH₃ : une liaison C–C se forme.', 'Après hydrolyse : 5 atomes de carbone, et un carbone lié à trois autres carbones : la chaîne est ramifiée.'],
    phasesNeutres: ['Avant : l’organomagnésien et la propanone.', 'Les deux molécules se rapprochent et se lient.', 'Après hydrolyse (eau acidifiée) : un alcool.'],
    reactifs: ['EtMgBr', 'Pone'], produits: [['MBu2ol', 1]],
    resume: 'Animation : la propanone arrive sur l’organomagnésien, une liaison C–C se forme avec le carbone du C=O ; après hydrolyse on obtient le 2-méthylbutan-2-ol, dont la chaîne est ramifiée.',
  },
  G6: {
    reactions: 'G6', titre: 'G6 : l’alcool secondaire devient une cétone',
    atomes: [
      A('c0', 'C', [0, 0]), A('c1', 'C', [0.866, 0.5]), A('c2', 'C', [0.866, 1.5]), A('c3', 'C', [1.732, 2.0]),
      A('o', 'O', [0, 2.0], [0, 2.0], { label: [[0, 'OH'], [0.55, 'O']], side: 'R' }),
      A('ox', 'chip', [-1.6, 0.6], [-1.6, 0.6], { label: '[O]', debut: 'ion', fin: 'gone', vis: [0.1, 0.3, 0.55, 0.75] }),
    ],
    liaisons: [B('c0', 'c1', 1, 1), B('c1', 'c2', 1, 1), B('c2', 'c3', 1, 1), B('c2', 'o', 1, 2, [0.45, 0.65], 'change')],
    cle: { txt: 'C–OH devient C=O', x: 1.25, y: 0.95, ancre: 'start', apres: 0.78 },
    phases: ['Avant : un alcool secondaire, 4 atomes de carbone.', 'L’oxydant retire deux atomes d’hydrogène : C–OH devient C=O.', 'Après : une cétone ; 4 atomes de carbone avant comme après : le squelette est inchangé.'],
    phasesNeutres: ['Avant : un alcool secondaire.', 'Un oxydant agit sur le groupe –OH.', 'Après : une cétone.'],
    reactifs: ['Bu2ol'], produits: [['Bu2one', 1]],
    resume: 'Animation : un oxydant agit sur le butan-2-ol, le groupe C–OH devient C=O ; la chaîne de 4 atomes de carbone ne change pas.',
  },
  G7: {
    reactions: 'G7', titre: 'G7 : la liaison C=C est coupée : la chaîne est raccourcie',
    atomes: [
      A('c0', 'C', [0, 0], [-1.3, 0], { mv: [0.3, 0.65] }), A('c1', 'C', [0.866, 0.5], [-0.434, 0.5], { mv: [0.3, 0.65] }),
      A('c2', 'C', [1.732, 0], [3.032, 0], { mv: [0.3, 0.65] }), A('c3', 'C', [2.598, 0.5], [3.898, 0.5], { mv: [0.3, 0.65] }),
      A('ox', 'chip', [1.7, 3.5], [1.7, 3.5], { label: '4 [O]', debut: 'ion', fin: 'gone', vis: [0.05, 0.2, 0.3, 0.42] }),
      A('o1', 'O', [-0.434, 2.8], [-0.434, 1.5], { mv: [0.35, 0.75], label: 'O', debut: 'ion', vis: [0.15, 0.3, 2, 2] }),
      A('o2', 'O', [0.5, -2.0], [0.432, 0], { mv: [0.35, 0.75], label: [[0, 'O'], [0.78, 'OH']], side: 'L', debut: 'ion', vis: [0.15, 0.3, 2, 2] }),
      A('o3', 'O', [3.032, -2.8], [3.032, -1.0], { mv: [0.35, 0.75], label: 'O', debut: 'ion', vis: [0.15, 0.3, 2, 2] }),
      A('o4', 'O', [2.166, 2.6], [2.166, 0.5], { mv: [0.35, 0.75], label: [[0, 'O'], [0.78, 'OH']], side: 'R', debut: 'ion', vis: [0.15, 0.3, 2, 2] }),
    ],
    liaisons: [B('c0', 'c1', 1, 1), B('c1', 'c2', 2, 0, [0.4, 0.6], 'rompue'), B('c2', 'c3', 1, 1),
      B('c1', 'o1', 0, 2, [0.62, 0.8]), B('c1', 'o2', 0, 1, [0.62, 0.8]), B('c2', 'o3', 0, 2, [0.62, 0.8]), B('c2', 'o4', 0, 1, [0.62, 0.8])],
    cle: { txt: 'liaison C=C coupée', x: 1.65, y: -1.95, ancre: 'middle', apres: 0.8 },
    phases: ['Avant : le but-2-ène (4 atomes de carbone), avec une double liaison C=C au milieu.', 'L’oxydant coupe la liaison C=C et fixe des atomes d’oxygène sur chacun des deux carbones.', 'Après : deux molécules d’acide éthanoïque, de 2 atomes de carbone chacune : la chaîne est raccourcie.'],
    phasesNeutres: ['Avant : le but-2-ène, avec une double liaison C=C.', 'L’oxydant agit sur la double liaison C=C.', 'Après : un acide carboxylique, formé deux fois.'],
    reactifs: ['But2ene'], produits: [['AcEt', 2]],
    resume: 'Animation : l’oxydant coupe la double liaison C=C du but-2-ène et fixe des atomes d’oxygène ; on obtient deux molécules d’acide éthanoïque de 2 atomes de carbone chacune.',
  },
};

// ---------- image à l'instant t ----------
const libelleAu = (a, t) => {
  if (a.label === undefined) return null;
  if (typeof a.label === 'string') return [[a.label, 1]];
  // fondu enchaîné entre deux textes consécutifs (0,04 de durée)
  const L = a.label; let k = 0; for (let i = 0; i < L.length; i++) if (t >= L[i][0]) k = i;
  if (k > 0 && t < L[k][0] + 0.05) { const u = (t - L[k][0]) / 0.05; return [[L[k - 1][1], 1 - u], [L[k][1], u]]; }
  return [[L[k][1], 1]];
};
export function etatAu(scene, t) {
  const atomes = scene.atomes.map(a => {
    const [m0, m1] = a.mv || MV, u = lisse((t - m0) / (m1 - m0));
    const v = a.vis || [0, 0, 2, 2];
    const op = fen(t, v[0], v[1]) * (1 - fen(t, v[2], v[3]));
    const tag = a.tag ? fen(t, a.tag.vis[0], a.tag.vis[1]) * (1 - fen(t, a.tag.vis[2], a.tag.vis[3])) : 0;
    return { k: a.k, e: a.e, x: a.p0[0] + (a.p1[0] - a.p0[0]) * u, y: a.p0[1] + (a.p1[1] - a.p0[1]) * u, op, textes: libelleAu(a, t), side: a.side, tag: a.tag ? { txt: a.tag.txt, op: tag } : null };
  });
  const par = Object.fromEntries(atomes.map(a => [a.k, a]));
  const liaisons = scene.liaisons.map(b => {
    const s = fen(t, b.w[0], b.w[1]), n = Math.max(b.o0, b.o1), lignes = [];
    for (let i = 0; i < n; i++) lignes.push({ i, op: i < b.o0 && i < b.o1 ? 1 : i < b.o0 ? 1 - s : s });
    return { a: par[b.a], b: par[b.b], n, lignes, hi: b.hi, trans: s > 0.001 && s < 0.999, op: Math.min(par[b.a].op, par[b.b].op) };
  });
  return { atomes, liaisons };
}
export const phaseAu = (scene, t) => (t < 0.3 ? 0 : t < 0.72 ? 1 : 2);

// ---------- contrôle par le graphe : image t = 0 (réactifs) et t = 1 (produits) ----------
export function grapheDe(scene, fin) {
  const garde = fin ? (a => a.fin === 'prod') : (a => a.debut === 'react' || a.debut === 'react2');
  const ids = scene.atomes.filter(garde).map(a => a.k), pos = Object.fromEntries(ids.map((k, i) => [k, i]));
  const atomes = ids.map(k => { const a = scene.atomes.find(x => x.k === k); return { e: a.e, x: fin ? a.p1[0] : a.p0[0], y: fin ? a.p1[1] : a.p0[1] }; });
  const liaisons = scene.liaisons.filter(b => pos[b.a] !== undefined && pos[b.b] !== undefined && (fin ? b.o1 : b.o0) > 0).map(b => [pos[b.a], pos[b.b], fin ? b.o1 : b.o0]);
  return { atomes, liaisons };
}
export function resumeGraphe(g) {
  const m = { atomes: g.atomes, liaisons: g.liaisons };
  const b = brute(m), sq = squelette(m);
  return { formule: formuleTexte(b), brute: b.atomes, nC: sq.nC, nCC: sq.nCC };
}
export const sommeBrutes = lst => {
  const t = {}; lst.forEach(([id, n]) => { for (const [e, k] of Object.entries(brute(MOLS[id]).atomes)) t[e] = (t[e] || 0) + n * k; }); return t;
};
