// ====================================================
//  Modèle de la simulation « Mesure : incertitude-type, écriture du résultat et comparaison à une référence » (2GT, sim 194,
//  thème « Mesure et incertitudes »). Modèle pur (sans React), testé par mesureIncertitude2gtModele.test.mjs.
//
//  Capacités visées (jamais affichées à l'élève) : expliquer qualitativement la signification d'une incertitude-type et l'évaluer par une
//  approche statistique ; écrire, avec un nombre adapté de chiffres significatifs, le résultat d'une mesure ; comparer qualitativement un
//  résultat à une valeur de référence (compatible / non compatible).
//
//  HYPOTHÈSES DU MODÈLE (reprises à l'écran dans le panneau « Hypothèses de travail ») :
//   • les n mesures sont indépendantes, portent sur le même mesurande et sont faites dans les mêmes conditions ;
//   • la dispersion est à peu près symétrique autour d'une valeur centrale : la simulation tire les mesures selon une répartition « en cloche »
//     (loi normale, non étudiée en Seconde) : c'est un MODÈLE, pas une certitude ;
//   • la valeur lue est arrondie à la résolution de l'instrument ; toutes les valeurs, instruments et références sont FICTIFS ;
//   • l'instrument n'est pas biaisé, sauf si on active le « décalage » (erreur systématique) : u ne le détecte pas ;
//   • u = s ÷ √n est une règle d'usage DONNÉE (non démontrée en Seconde) ; s est l'écart-type expérimental (division par n − 1) ;
//   • convention d'écriture : u sur 1 chiffre significatif (2 si le premier est 1), arrondie par excès ; valeur au même rang décimal.
//     C'est celle de la simulation 161 (1G) : on garde les mêmes symboles (u, s) et les mêmes conventions ;
//   • comparaison QUALITATIVE : « compatible » si la référence est dans l'intervalle [valeur − u ; valeur + u], « pas compatible » si elle en est
//     nettement éloignée (plusieurs fois u) ; entre les deux, on ne tranche pas (cas limite, écarté des exercices et des défis).
// ====================================================
import { generateur, gaussien, arrondiA, moyenne, ecartType, rangU, arrondiU, arrondiMoyenne } from './mesureModele.js';

export { generateur, moyenne, ecartType, rangU, arrondiU, arrondiMoyenne };
const NB = ' ';
export const COL = { bleu: '#0369a1', bleuClair: '#bae6fd', orange: '#b45309', orangeClair: '#fde68a', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', grisClair: '#e2e8f0', txt: '#0f172a' };

// ---------- formats français ----------
export const fmt = (x, d) => Number(x).toFixed(Math.max(0, d)).replace('.', ',').replace('-', '−');
export const incertitudeA = (s, n) => s / Math.sqrt(n);            // u = s ÷ √n
// arrondi usuel de u au même rang (1 chiffre significatif, 2 si le premier est 1) : accepté en plus de l'arrondi par excès dans les défis
export function arrondiUUsuel(u) {
  if (!(u > 0)) return 0;
  const p = rangU(u), f = Math.pow(10, p);
  return Number((Math.round(u / f + 1e-9) * f).toFixed(Math.max(0, -p) + 2));
}
export const decimalesU = u => Math.max(0, -rangU(u));               // nombre de décimales à écrire (rang de u brute)
// résultat écrit : { m, u, d, texte } ; texte = « (7,50 ± 0,04) g »
export function ecrireResultat(m, u, unite) {
  const ua = arrondiU(u), d = decimalesU(u), ma = arrondiMoyenne(m, u);
  return { m: ma, u: ua, d, texte: `(${fmt(ma, d)}${NB}±${NB}${fmt(ua, d)})${NB}${unite}` };
}
// la valeur de référence est-elle dans l'intervalle [m − u ; m + u] ? (valeurs telles qu'affichées)
const EPS = 1e-9;
export const dansIntervalle = (m, u, ref) => Math.abs(m - ref) <= u + EPS;
// verdict QUALITATIF : 'compatible' (dans l'intervalle), 'non' (nettement éloignée : écart ≥ 3 u), 'limite' (entre les deux : on ne tranche pas)
export const SEUIL_LOIN = 3;
export function verdictCompat(m, u, ref) {
  const e = Math.abs(m - ref);
  if (e <= u + EPS) return 'compatible';
  return e >= SEUIL_LOIN * u - EPS ? 'non' : 'limite';
}

// ---------- situations de mesure (valeurs FICTIVES) ----------
// ref : valeur de référence ; instruments : dispersion (sigma) d'UNE mesure et résolution de lecture (res) ; biais : décalage systématique proposé
export const SITUATIONS = {
  piece: { id: 'piece', nom: 'Masse d’une pièce', mesurande: 'la masse d’une pièce de collection', sym: 'm', unite: 'g', ref: 7.50, refTxt: 'valeur indiquée par le fabricant : 7,50 g',
    instruments: [
      { id: 'dixieme', nom: 'balance au dixième de gramme', sigma: 0.10, res: 0.1, dec: 1 },
      { id: 'centi', nom: 'balance au centième de gramme', sigma: 0.03, res: 0.01, dec: 2 }],
    biais: 0.15, biaisTxt: 'balance dont le zéro est décalé (elle affiche 0,15 g de trop)' },
  chute: { id: 'chute', nom: 'Durée de chute', mesurande: 'la durée de chute d’une bille lâchée de 2,00 m', sym: 't', unite: 's', ref: 0.64, refTxt: 'valeur calculée par le professeur : 0,64 s',
    instruments: [
      { id: 'main', nom: 'chronomètre à main', sigma: 0.06, res: 0.01, dec: 2 },
      { id: 'capteur', nom: 'chronomètre avec capteurs de lumière', sigma: 0.012, res: 0.001, dec: 3 }],
    biais: 0.05, biaisTxt: 'chronomètre déclenché toujours trop tard (réflexe : 0,05 s de retard)' },
  concentration: { id: 'concentration', nom: 'Concentration d’une solution', mesurande: 'la concentration en masse d’une solution colorée', sym: 'c', unite: 'g/L', ref: 5.00, refTxt: 'valeur écrite sur l’étiquette : 5,00 g/L',
    instruments: [
      { id: 'oeil', nom: 'comparaison de teintes à l’œil', sigma: 0.25, res: 0.05, dec: 2 },
      { id: 'spectro', nom: 'spectrophotomètre', sigma: 0.05, res: 0.01, dec: 2 }],
    biais: 0.20, biaisTxt: 'solution de comparaison mal préparée (0,20 g/L de trop)' },
  longueur: { id: 'longueur', nom: 'Longueur d’une feuille', mesurande: 'la longueur d’une feuille de papier', sym: 'L', unite: 'cm', ref: 29.70, refTxt: 'valeur du format de la feuille : 29,70 cm',
    instruments: [
      { id: 'ruban', nom: 'mètre ruban souple', sigma: 0.25, res: 0.1, dec: 1 },
      { id: 'regle', nom: 'règle métallique', sigma: 0.06, res: 0.01, dec: 2 }],
    biais: 0.20, biaisTxt: 'règle dont le début de graduation est usé (0,20 cm de trop)' },
};
export const IDS_SITUATIONS = ['piece', 'chute', 'concentration', 'longueur'];
export const NB_MESURES = [3, 4, 9, 16, 25, 50, 100];

// ---------- tirage d'une série ----------
export function tirerSerie(sit, instr, n, graine, biais = false) {
  const alea = generateur(graine), out = [];
  for (let i = 0; i < n; i++) out.push(arrondiA(sit.ref + (biais ? sit.biais : 0) + instr.sigma * gaussien(alea), instr.res));
  return out;
}
// statistiques d'une série : moyenne, écart-type s (n − 1), incertitude-type u = s ÷ √n
export function stats(v) {
  const n = v.length, m = moyenne(v), s = n > 1 ? ecartType(v) : NaN;
  return { n, m, s, u: n > 1 ? incertitudeA(s, n) : NaN };
}

// ---------- données du parcours guidé (écrites à la main, vérifiées par le test) ----------
export const G = {
  moyenne: { valeurs: [7.52, 7.48, 7.50, 7.53, 7.47], m: 7.50, unite: 'g' },                          // étape 1 : somme 37,50 ; moyenne 7,50
  exMoyenne: { valeurs: [0.62, 0.66, 0.64, 0.64], m: 0.64, unite: 's' },                              // exemple résolu de l'étape 1
  intervalle: { m: 29.70, u: 0.05, unite: 'cm' },                                                     // étape 2 (question)
  exIntervalle: { m: 0.64, u: 0.02, unite: 's' },
  calcul: { s: 0.30, n: 9, u: 0.10, unite: 'g' },                                                      // étape 4 : u = 0,30 ÷ 3 = 0,10 g
  exCalcul: { s: 0.12, n: 4, u: 0.06, unite: 's' },
  nombre: { n0: 9, n1: 36 },                                                                          // étape 5 : u ÷ 2 ⇒ n × 4
  arrondi: { u: 0.0623, ua: 0.07, unite: 's' }, exArrondi: { u: 0.0347, ua: 0.04, unite: 'g' },       // étape 7
  resultat: { m: 12.3846, u: 0.0482, texte: '(12,38 ± 0,05) s' }, exResultat: { m: 7.5043, u: 0.0347, texte: '(7,50 ± 0,04) g' },   // étape 8
  compare: { m: 29.67, u: 0.05, ref: 29.70, unite: 'cm' }, exCompare: { m: 4.95, u: 0.05, ref: 5.20, unite: 'g/L' },                   // étape 9
};

// ---------- défis ----------
const tire = (L, alea = Math.random) => L[Math.floor(alea() * L.length)];
// Défi « écrire le résultat » : une série tirée ; l'élève reçoit n, la moyenne (avec 3 décimales de plus que la mesure) et s (3 chiffres
// significatifs) ; il calcule u = s ÷ √n, l'arrondit, puis arrondit la moyenne au même rang. Les données affichées servent au corrigé.
export function tirerDefiEcrire(prec = null, alea = Math.random) {
  for (let essai = 0; essai < 200; essai++) {
    const sit = SITUATIONS[tire(IDS_SITUATIONS, alea)], instr = tire(sit.instruments, alea), n = tire([4, 9, 16, 25], alea);
    const v = tirerSerie(sit, instr, n, 1 + Math.floor(alea() * 1e9));
    const st = stats(v);
    if (!(st.s > 0)) continue;
    const s = Number(st.s.toPrecision(3)), dm = instr.dec + 3, m = Number(st.m.toFixed(dm));
    const u = incertitudeA(s, n), p = rangU(u), f = Math.pow(10, p), frac = (m / f) % 1;
    if (Math.abs(frac - 0.5) < 0.08) continue;                        // moyenne trop près d'un « 5 » d'arrondi : on évite l'ambiguïté
    if (u > 0.5 * Math.abs(sit.ref) || u < 1e-4) continue;
    if (prec && prec.cle === `${sit.id}-${n}-${s}`) continue;
    const ua = arrondiU(u), uu = arrondiUUsuel(u), d = decimalesU(u), ma = arrondiMoyenne(m, u);
    return { cle: `${sit.id}-${n}-${s}`, sit, instr, n, m, s, dm, u, ua, uu, d, ma };
  }
  return null;
}
// Une réponse du défi : u accepté si égal à l'arrondi par excès OU à l'arrondi usuel (même rang) ; moyenne arrondie au même rang.
export function verifierEcrire(d, uTxt, mTxt, lire) {
  const u = lire(uTxt), m = lire(mTxt);
  // le nombre de décimales écrites fait partie du résultat : « 7,5 » n'est pas « 7,50 »
  const dec = t => { const x = String(t).trim().replace(',', '.'); const i = x.indexOf('.'); return i < 0 ? 0 : x.length - i - 1; };
  const valU = isFinite(u) && (Math.abs(u - d.ua) < 1e-9 || Math.abs(u - d.uu) < 1e-9);
  const valM = isFinite(m) && Math.abs(m - d.ma) < 1e-9;
  const okU = valU && dec(uTxt) === d.d, okM = valM && dec(mTxt) === d.d;
  return { okU, okM, ok: okU && okM, zeroU: valU && !okU, zeroM: valM && !okM };
}
// Défi « compatible ? » : un résultat (valeur ± u) et une valeur de référence ; cas limites écartés :
//   'compatible' : écart ≤ 0,8 u ; 'non' : écart ≥ 3,5 u (valeurs arrondies telles qu'affichées).
export function tirerDefiCompare(prec = null, alea = Math.random) {
  for (let essai = 0; essai < 300; essai++) {
    const sit = SITUATIONS[tire(IDS_SITUATIONS, alea)], instr = tire(sit.instruments, alea), n = tire([4, 9, 16, 25], alea);
    const cas = alea() < 0.5 ? 'compatible' : 'non';
    const u = arrondiU(incertitudeA(instr.sigma, n)), d = decimalesU(incertitudeA(instr.sigma, n));
    const k = cas === 'compatible' ? (alea() * 1.6 - 0.8) : (alea() < 0.5 ? -1 : 1) * (3.6 + alea() * 2.4);
    const m = Number((sit.ref + k * u).toFixed(d));
    const e = Math.abs(m - sit.ref);
    if (cas === 'compatible' ? e > 0.8 * u + EPS : e < 3.5 * u - EPS) continue;
    if (verdictCompat(m, u, sit.ref) !== (cas === 'compatible' ? 'compatible' : 'non')) continue;
    if (prec && prec.cle === `${sit.id}-${n}-${m}`) continue;
    return { cle: `${sit.id}-${n}-${m}`, sit, instr, n, m, u, d, cas, ecart: e };
  }
  return null;
}
