// Modèle de la simulation 144 : stéréoisomères (énantiomères, diastéréoisomères, isomérie Z/E), TSTL, PCM · Structure spatiale.
// S'appuie sur le modèle de la simulation 137 (graphe, règles CIP, dessin de Cram) sans le modifier.
// Hypothèses (affichées à l'élève) : molécules sans cycle, sans composé méso (deux carbones asymétriques de substituants différents), règles CIP limitées au programme,
// deux carbones asymétriques voisins (4 stéréoisomères au plus), alcènes à une seule double liaison C=C.
import * as C from './chiraliteModele.js';

export const ZED = C.graphe;
const MOL = o => ({ ...o, g: C.graphe(o.smiles) });

// ---------- molécules à deux carbones asymétriques voisins ----------
const THR = C.parId('threonine'), ISO = C.parId('isoleucine');
export const CHLOROHYDROXY = MOL({ id: 'chlorohydroxy', nom: 'acide 2-chloro-3-hydroxybutanoïque', semi: 'CH₃–CH(OH)–CHCl–COOH', smiles: 'CC(O)C(Cl)C(=O)O', centres: [3, 1],
  groupes: { 4: 'Cl', 5: 'COOH', 0: 'CH₃', 2: 'OH' }, chaine: { gauche: 5, c1: 3, c2: 1, droite: 0 }, nomsCentres: ['C2', 'C3'], numeros: [2, 3], etiqCentre: { 1: 'CH(OH)CH₃', 3: 'CHClCOOH' } });
export const AMINOCHLORO = MOL({ id: 'aminochloro', nom: 'acide 2-amino-3-chlorobutanoïque', semi: 'CH₃–CHCl–CH(NH₂)–COOH', smiles: 'CC(Cl)C(N)C(=O)O', centres: [3, 1],
  groupes: { 4: 'NH₂', 5: 'COOH', 0: 'CH₃', 2: 'Cl' }, chaine: { gauche: 5, c1: 3, c2: 1, droite: 0 }, nomsCentres: ['C2', 'C3'], numeros: [2, 3], etiqCentre: { 1: 'CHClCH₃', 3: 'CH(NH₂)COOH' } });
export const POOL2 = [CHLOROHYDROXY, AMINOCHLORO, THR, ISO];
// Deux carbones asymétriques identiquement substitués : (R,S) et (S,R) sont la même molécule (composé méso, achirale) → 3 stéréoisomères seulement
export const DIBROMOBUTANE = MOL({ id: 'dibromobutane', nom: '2,3-dibromobutane', semi: 'CH₃–CHBr–CHBr–CH₃', smiles: 'CC(Br)C(Br)C', centres: [1, 3],
  groupes: { 0: 'CH₃', 2: 'Br', 4: 'Br', 5: 'CH₃' }, chaine: { gauche: 0, c1: 1, c2: 3, droite: 5 }, nomsCentres: ['C2', 'C3'], numeros: [2, 3], etiqCentre: { 1: 'CHBrCH₃', 3: 'CHBrCH₃' } });
export const cleMeso = desc => (desc[0] === desc[1] ? desc.join('') : 'RS');            // (R,S) et (S,R) : une seule molécule
export const stereoisomeresMeso = m => { const vus = new Map(); stereoisomeres(m).forEach(s => { const k = cleMeso(s.desc); if (!vus.has(k)) vus.set(k, { ...s, cle: k, meso: k === 'RS' }); }); return [...vus.values()]; };
export const relationMeso = (d1, d2) => (cleMeso(d1) === cleMeso(d2) ? 'identiques' : (d1[0] === d1[1] && d2[0] === d2[1] ? 'enantiomeres' : 'diastereoisomeres'));

export const parId2 = id => POOL2.find(m => m.id === id);

// ---------- les 4 stéréoisomères d'une molécule à deux carbones asymétriques ----------
const FLIPS = [[false, false], [false, true], [true, false], [true, true]];
export const stereoisomeres = m => FLIPS.map(flips => { const affs = C.affChaine(m, flips), desc = C.descripteurs(m, affs); return { flips, affs, desc, id: desc.join('') }; });
export const nomDesc = (m, desc) => `(${m.numeros[0]}${desc[0]},${m.numeros[1]}${desc[1]})`;
export const sOfDesc = (m, desc) => stereoisomeres(m).find(s => s.desc.join('') === desc.join(''));
export const miroirDe = s => s.flips.map(f => !f);        // image miroir : les deux carbones sont inversés
// relation entre deux stéréoisomères (descripteurs) : 'identiques' | 'enantiomeres' | 'diastereoisomeres'
export function relation(d1, d2) {
  const egaux = d1.map((x, i) => x === d2[i]);
  if (egaux.every(Boolean)) return 'identiques';
  if (egaux.every(e => !e)) return 'enantiomeres';
  return 'diastereoisomeres';
}
export const LIBELLE_REL = { identiques: 'identiques (même molécule)', enantiomeres: 'énantiomères', diastereoisomeres: 'diastéréoisomères' };
// dénombrements pour n carbones asymétriques (sans composé méso)
export const nbStereo = n => 2 ** n;
export const nbCouples = n => 2 ** (n - 1);
export const nbDiastereo = n => 2 ** n - 2;

// ---------- alcènes ----------
// c : les deux carbones de la liaison C=C ; subs[k] : [j1, j2] substituants du carbone k classés par priorité décroissante (null si égaux)
function alcene(o) {
  const g = C.graphe(o.smiles); let c = null;
  g.voisins.forEach((vs, i) => vs.forEach(v => { if (v.ordre === 2 && i < v.j && g.el[i] === 'C' && g.el[v.j] === 'C') c = [i, v.j]; }));
  const subs = c.map((ck, k) => { const autres = g.voisins[ck].map(v => v.j).filter(j => j !== c[1 - k]); const [a, b] = autres, cmp = C.compareCIP(g, ck, a, b).signe; return cmp === 0 ? null : (cmp > 0 ? [a, b] : [b, a]); });
  return { ...o, g, c, subs, ze: subs.every(Boolean) };
}
export const etiqAlc = (m, j) => (m.g.el[j] === 'H' ? 'H' : m.groupes[j]);
export const ALCENES = [
  alcene({ id: 'but2ene', nom: 'but-2-ène', semi: 'CH₃–CH=CH–CH₃', smiles: 'CC=CC', groupes: { 0: 'CH₃', 3: 'CH₃' } }),
  alcene({ id: 'pent2ene', nom: 'pent-2-ène', semi: 'CH₃–CH=CH–CH₂CH₃', smiles: 'CC=CCC', groupes: { 0: 'CH₃', 3: 'CH₂CH₃' } }),
  alcene({ id: 'chloropropene', nom: '1-chloroprop-1-ène', semi: 'Cl–CH=CH–CH₃', smiles: 'ClC=CC', groupes: { 0: 'Cl', 3: 'CH₃' } }),
  alcene({ id: 'bromochloroethene', nom: '1-bromo-2-chloroéthène', semi: 'Br–CH=CH–Cl', smiles: 'BrC=CCl', groupes: { 0: 'Br', 3: 'Cl' } }),
  alcene({ id: 'butenoique', nom: 'acide but-2-énoïque', semi: 'CH₃–CH=CH–COOH', smiles: 'CC=CC(=O)O', groupes: { 0: 'CH₃', 3: 'COOH' } }),
  alcene({ id: 'chloropropenoique', nom: 'acide 3-chloroprop-2-énoïque', semi: 'Cl–CH=CH–COOH', smiles: 'ClC=CC(=O)O', groupes: { 0: 'Cl', 3: 'COOH' } }),
  alcene({ id: 'hex3ene', nom: 'hex-3-ène', semi: 'CH₃CH₂–CH=CH–CH₂CH₃', smiles: 'CCC=CCC', groupes: { 1: 'CH₂CH₃', 4: 'CH₂CH₃' } }),
  // pas d'isomérie Z/E : un carbone de la double liaison porte deux groupes identiques
  alcene({ id: 'propene', nom: 'propène', semi: 'CH₃–CH=CH₂', smiles: 'CC=C', groupes: { 0: 'CH₃' } }),
  alcene({ id: 'methylbutene', nom: '2-méthylbut-2-ène', semi: '(CH₃)₂C=CH–CH₃', smiles: 'CC=C(C)C', groupes: { 0: 'CH₃', 3: 'CH₃', 4: 'CH₃' } }),
  alcene({ id: 'dichloroethene', nom: '1,1-dichloroéthène', semi: 'Cl₂C=CH₂', smiles: 'ClC(Cl)=C', groupes: { 0: 'Cl', 2: 'Cl' } }),
];
export const ALC_ZE = ALCENES.filter(a => a.ze), ALC_SANS = ALCENES.filter(a => !a.ze);
export const parIdAlc = id => ALCENES.find(a => a.id === id);
// Une géométrie : haut = [bool, bool] : le substituant prioritaire de chaque carbone est-il vers le haut ?
export const geometrieZE = haut => (haut[0] === haut[1] ? 'Z' : 'E');
export const memeGeometrie = (h1, h2) => geometrieZE(h1) === geometrieZE(h2);
export const autreGeometrie = haut => [haut[0], !haut[1]];
// Substituants placés [haut, bas] du carbone k pour une géométrie
export function substituants(m, haut, k) { const [p, s] = m.subs[k]; return haut[k] ? { haut: p, bas: s } : { haut: s, bas: p }; }
// Dénombrements : un alcène Z/E a 2 stéréoisomères de géométrie
export const nbGeometries = m => (m.ze ? 2 : 1);

export const DEFIS = { ALC: ALC_ZE };
// ---------- tirages ----------
const choisir = (t, alea) => t[Math.min(t.length - 1, Math.floor(alea() * t.length))];
export function tirageRelation(alea = Math.random) {
  const m = choisir(POOL2, alea), st = stereoisomeres(m), a = choisir(st, alea); let b = choisir(st, alea);
  const rel = choisir(['enantiomeres', 'diastereoisomeres', 'identiques', 'diastereoisomeres'], alea);
  b = st.find(s => relation(a.desc, s.desc) === rel) ?? b;
  // la seconde représentation peut être dessinée dans une autre orientation : elle reste la même molécule
  return { type: 'relation', m, a, b, rel: relation(a.desc, b.desc), miroirB: alea() < 0.5, n: 3 + Math.min(2, Math.floor(alea() * 3)) };
}
export function tirageZE(alea = Math.random) {
  const m = choisir(ALC_ZE, alea), h1 = [alea() < 0.5, alea() < 0.5];
  const mode = choisir(['meme', 'autre', 'autre', 'tourne'], alea);
  const h2 = mode === 'autre' ? autreGeometrie(h1) : mode === 'meme' ? [...h1] : [!h1[0], !h1[1]];     // « tourne » : la molécule retournée dans le plan reste la même
  return { type: 'ze', m, h1, h2, rel: memeGeometrie(h1, h2) ? 'identiques' : 'diastereoisomeres' };
}
