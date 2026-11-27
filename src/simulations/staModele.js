// Modèle de la simulation 320 « Stabilité des intermédiaires et produit majoritaire » (terminale STL, SPCL, Chimie et développement durable, séquence 9).
// Un intermédiaire réactionnel carboné : un carbone lié à trois substituants parmi H, CH₃ (alkyle, donneur), Cl et C≡N (attracteurs).
//   carbocation : 3 liaisons, 6 électrons, AX₃E₀ → trigonal plan (120°) ; carbanion : 3 liaisons + 1 doublet, 8 électrons, AX₃E₁ → pyramidal (≈ 107°) ;
//   radical : 3 liaisons + 1 électron célibataire, 7 électrons, quasi plan.
// Stabilité : INDICE QUALITATIF (pas une énergie) : chaque donneur (CH₃) stabilise un carbocation et déstabilise un carbanion ; chaque attracteur (Cl, CN) fait l'inverse ;
// pour un radical seuls les alkyles comptent (effet plus faible), les attracteurs ne sont pas traités. Aucune valeur d'énergie n'est calculée.
import { ALCENES, voies, classeCarbocation } from './regioModele.js';
export const NB = ' ';
export const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
export const SUBS = { H: { sym: 'H', nom: 'hydrogène', role: 'neutre' }, Me: { sym: 'CH₃', nom: 'groupe méthyle', role: 'donneur' }, Cl: { sym: 'Cl', nom: 'chlore', role: 'attracteur' }, CN: { sym: 'C≡N', nom: 'groupe cyano', role: 'attracteur' } };
export const LISTE_SUBS = ['H', 'Me', 'Cl', 'CN'];
export const TYPES = {
  cation: { id: 'cation', nom: 'carbocation', court: 'carbocation', charge: 1, electrons: 6, doublet: 0, vsepr: 'AX₃E₀', forme: 'trigonale plane', angle: 120, signe: '+' },
  anion: { id: 'anion', nom: 'carbanion', court: 'carbanion', charge: -1, electrons: 8, doublet: 1, vsepr: 'AX₃E₁', forme: 'pyramidale (base triangulaire)', angle: 107, signe: '−' },
  radical: { id: 'radical', nom: 'radical', court: 'radical', charge: 0, electrons: 7, doublet: 0, vsepr: 'AX₃ + 1 électron célibataire', forme: 'plan, ou presque', angle: 120, signe: '•' },
};
export const LISTE_TYPES = ['cation', 'anion', 'radical'];
export const nbAlkyl = s => s.filter(x => x === 'Me').length;
export const nbAttr = s => s.filter(x => SUBS[x].role === 'attracteur').length;
export const NOM_CLASSE = ['méthyle', 'primaire (classe I)', 'secondaire (classe II)', 'tertiaire (classe III)'];
export const CLASSE_ROM = ['', 'I', 'II', 'III'];
export const classe = s => nbAlkyl(s);
// indice de stabilité (plus grand = plus stable)
export function indice(type, s) {
  const d = nbAlkyl(s), a = nbAttr(s);
  if (type === 'cation') return d - a;
  if (type === 'anion') return a - d;
  return 0.5 * d;
}
export const plusStable = (type, s1, s2) => { const a = indice(type, s1), b = indice(type, s2); return Math.abs(a - b) < 1e-9 ? 0 : a > b ? 1 : 2; };
export const nomIntermediaire = (type, s) => `${TYPES[type].court} (${s.map(x => SUBS[x].sym).join(', ')})`;
export const sym = s => s.map(x => SUBS[x].sym).join(', ');
// description d'un intermédiaire carboné (formule semi-développée)
export const formule = s => { const t = s.map(x => SUBS[x].sym); const c = t.map(x => (x.length > 1 ? `(${x})` : x)); return `C${c.join('')}`; };
// géométrie 3D (unités arbitraires) du carbone au centre : substituants et doublet/lobe ; pyr = 0 (plan) … 1 (pyramide complète)
export const pyramidalisation = type => (type === 'anion' ? 1 : type === 'radical' ? 0.12 : 0);
export function positions(pyr) {
  const h = -0.372 * pyr, r = Math.sqrt(1 - h * h);
  return [90, 210, 330].map(a => { const t = a * Math.PI / 180; return [r * Math.cos(t), h, r * Math.sin(t)]; });
}
export const angleHCH = pyr => { const p = positions(pyr), d = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; const n = Math.hypot(...p[0]); return Math.acos(d(p[0], p[1]) / (n * n)) * 180 / Math.PI; };

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = t.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cle = s => s.slice().sort().join(',');
// défi « classer » : 3 intermédiaires du même type ; un seul est strictement le plus stable
export function tirageClasser() {
  for (let k = 0; k < 500; k++) {
    const type = tire(['cation', 'anion', 'cation']), pool = type === 'cation' ? ['H', 'Me', 'Cl'] : ['H', 'Me', 'Cl', 'CN'];
    const cands = []; const vus = new Set();
    while (cands.length < 3) { const s = [tire(pool), tire(pool), tire(pool)]; if (vus.has(cle(s))) continue; vus.add(cle(s)); cands.push(s); }
    const v = cands.map(s => indice(type, s)), max = Math.max(...v);
    if (v.filter(x => x === max).length !== 1 || Math.max(...v) - Math.min(...v) < 1) continue;
    return { type, cands, bonne: v.indexOf(max), v };
  }
  return { type: 'cation', cands: [['H', 'H', 'Me'], ['Me', 'Me', 'H'], ['H', 'H', 'H']], bonne: 1, v: [1, 2, 0] };
}
export function diagClasser(d, choix) {
  if (choix == null) return { ok: false, msg: 'Choisissez l’intermédiaire que vous jugez le plus stable.' };
  if (choix === d.bonne) return { ok: true, msg: '' };
  const a = d.cands[choix], b = d.cands[d.bonne], t = d.type;
  const motif = t === 'cation' ? 'Les groupes alkyles (CH₃) donneurs stabilisent un carbocation, les atomes attracteurs (Cl) le déstabilisent.' : 'Pour un carbanion, c’est l’inverse : les groupes attracteurs stabilisent la charge −, les groupes alkyles donneurs la déstabilisent.';
  return { ok: false, msg: `Ce n’est pas le plus stable : ${nomIntermediaire(t, a)} a ${nbAlkyl(a)} donneur${nbAlkyl(a) > 1 ? 's' : ''} et ${nbAttr(a)} attracteur${nbAttr(a) > 1 ? 's' : ''}, alors que ${nomIntermediaire(t, b)} en a ${nbAlkyl(b)} et ${nbAttr(b)}. ${motif}` };
}
// défi « produit majoritaire » : addition de HBr sur un alcène dissymétrique (mécanisme fourni : le carbocation se forme en premier)
const ALC = ALCENES.filter(a => voies(a).length === 2 && voies(a)[0].classe !== voies(a)[1].classe);
export function tirageProduit() {
  const a = tire(ALC), [A, B] = voies(a), flip = Math.random() < 0.5, voie = flip ? [B, A] : [A, B];
  const maj = voie[0].classe > voie[1].classe ? voie[0] : voie[1];
  return { a, voies: voie, maj, classeMaj: maj.classe, produitMaj: maj.produit, options: melange(voie.map(v => v.produit)) };
}
export function diagProduit(d, cl, prod) {
  const okCl = cl === d.classeMaj, okPr = prod === d.produitMaj;
  if (okCl && okPr) return { ok: true, msg: '' };
  if (!okCl) return { ok: false, msg: `Le carbocation le plus stable est celui de classe ${CLASSE_ROM[d.classeMaj]} (${NOM_CLASSE[d.classeMaj].split(' ')[0]}) : le carbone chargé porte ${d.classeMaj} groupe${d.classeMaj > 1 ? 's' : ''} alkyle${d.classeMaj > 1 ? 's' : ''} donneur${d.classeMaj > 1 ? 's' : ''}.` };
  return { ok: false, msg: `La classe du carbocation est bonne, mais le produit majoritaire est celui qui vient du carbocation le plus stable : le brome se fixe sur le carbone chargé (${d.produitMaj}).` };
}
export { ALCENES, voies, classeCarbocation };
