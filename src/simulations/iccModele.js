// Modèle de la simulation 185 « Incertitudes-types composées et comparaison à une valeur de référence » (TG spé PC). Sans React : testé par iccModele.test.mjs.
//
// HYPOTHÈSES DU MODÈLE (reprises à l'écran dans le panneau « Hypothèses de travail » et dans les corrigés) :
//  1. les grandeurs d'entrée sont INDÉPENDANTES (aucune erreur commune : sinon la formule de composition ne s'applique pas) ;
//  2. chaque grandeur d'entrée est supposée suivre une loi normale (écart-type u) ou une loi rectangulaire (demi-largeur √3·u, donc écart-type u) :
//     la loi change la forme de l'histogramme de G, pas la formule de composition ;
//  3. la formule de composition est une approximation LINÉAIRE de G autour des valeurs mesurées : valable quand les incertitudes relatives sont petites ;
//     la somme et la différence sont exactes (G linéaire) ; produit, quotient et puissances ne le sont qu'approximativement ;
//  4. le seuil « z < 2 » est une CONVENTION d'usage, pas une loi de la nature ; la valeur de référence est supposée connue sans incertitude ;
//  5. l'incertitude-type est assimilée à un écart-type ; pas d'intervalle de confiance élargi ici ;
//  6. un décalage systématique (instrument mal étalonné) n'est pas pris en compte : il ne se voit pas dans u.
// Conventions : u est arrondie PAR EXCÈS à 1 chiffre significatif (2 si le premier chiffre est 1), la valeur est arrondie à la même décimale
// (mêmes règles que la simulation 161, importées de mesureModele.js) ; z se calcule avec les valeurs NON arrondies (on n'arrondit qu'à l'écriture finale).
import { generateur, gaussien, arrondiU, decimalesDe, arrondiMoyenne, resultat, rangU } from './mesureModele.js';

export { arrondiU, decimalesDe, arrondiMoyenne, resultat, rangU, generateur };
export const SEUIL_Z = 2;                        // convention d'usage
export const N_CHOIX = [10, 100, 1000, 100000];  // nombres de tirages proposés
export const N_DEFAUT = 1000;

// ---------- composition des incertitudes-types (formules FOURNIES à l'élève) ----------
// somme ou différence : u(G) = √(u(x)² + u(y)² + …)
export const uSomme = us => Math.sqrt(us.reduce((s, u) => s + u * u, 0));
// produit ou quotient : (u(G)/G)² = Σ (|p| · u(x)/x)², p = exposant de la grandeur dans G
export const uRelProduit = termes => Math.sqrt(termes.reduce((s, t) => s + (Math.abs(t.exp) * t.u / t.val) ** 2, 0));

// ---------- situations ----------
// grandeurs : valeur mesurée, incertitude-type de départ, plage et pas du curseur d'incertitude (exploration) ; exp : exposant dans G (signe ignoré dans la formule)
export const SITUATIONS = {
  rho: {
    id: 'rho', nom: 'Masse volumique d’un cylindre', sym: 'ρ', unite: 'g/cm³', ref: 2.70, refNom: 'aluminium pur (valeur tabulée)',
    formuleTxt: 'ρ = frac(4 m|π d² h)',
    grandeurs: [
      { id: 'm', sym: 'm', nom: 'masse du cylindre', unite: 'g', val: 69.0, u: 0.042, dec: 1, pas: 0.002, umax: 3, exp: 1 },
      { id: 'd', sym: 'd', nom: 'diamètre', unite: 'cm', val: 2.00, u: 0.03, dec: 2, pas: 0.005, umax: 0.24, exp: 2 },
      { id: 'h', sym: 'h', nom: 'hauteur', unite: 'cm', val: 8.00, u: 0.03, dec: 2, pas: 0.005, umax: 1, exp: 1 },
    ],
    f: x => 4 * x.m / (Math.PI * x.d * x.d * x.h), dec: 2,
  },
  res: {
    id: 'res', nom: 'Résistance d’un conducteur ohmique', sym: 'R', unite: 'Ω', ref: 100.0, refNom: 'résistance étalon (valeur certifiée)',
    formuleTxt: 'R = frac(U|I)',
    grandeurs: [
      { id: 'U', sym: 'U', nom: 'tension', unite: 'V', val: 4.58, u: 0.03, dec: 2, pas: 0.005, umax: 1.2, exp: 1 },
      { id: 'I', sym: 'I', nom: 'intensité', unite: 'mA', val: 45.1, u: 0.6, dec: 1, pas: 0.1, umax: 6.8, exp: 1 },
    ],
    f: x => 1000 * x.U / x.I, dec: 1,
  },
};
export const IDS_SIT = ['rho', 'res'];
export const valsDe = sit => Object.fromEntries(sit.grandeurs.map(g => [g.id, { val: g.val, u: g.u }]));
export const valeursCentrales = (sit, vals) => Object.fromEntries(sit.grandeurs.map(g => [g.id, vals[g.id].val]));
export const G0 = (sit, vals = valsDe(sit)) => sit.f(valeursCentrales(sit, vals));
// incertitude relative de G par la formule (produit/quotient) et incertitude-type u(G)
export const uRelFormule = (sit, vals = valsDe(sit)) => uRelProduit(sit.grandeurs.map(g => ({ val: vals[g.id].val, u: vals[g.id].u, exp: g.exp })));
export const uFormule = (sit, vals = valsDe(sit)) => G0(sit, vals) * uRelFormule(sit, vals);
// contribution de chaque grandeur : incertitude relative pondérée |p|·u/x et part de la somme des carrés
export function contributions(sit, vals = valsDe(sit)) {
  const t = sit.grandeurs.map(g => ({ id: g.id, sym: g.sym, rel: Math.abs(g.exp) * vals[g.id].u / vals[g.id].val }));
  const s2 = t.reduce((s, c) => s + c.rel * c.rel, 0);
  return t.map(c => ({ ...c, part: c.rel * c.rel / s2 }));
}

// ---------- processus aléatoire (Monte-Carlo) ----------
// Tire N valeurs de chaque grandeur d'entrée (loi 'normale' ou 'rect', écart-type u), calcule G à chaque tirage.
export function tirages(sit, vals, loi, N, graine) {
  const alea = generateur(graine), out = new Float64Array(N), ids = sit.grandeurs.map(g => g.id), x = {};
  const r3 = Math.sqrt(3);
  for (let i = 0; i < N; i++) {
    for (const id of ids) { const { val, u } = vals[id]; x[id] = loi === 'rect' ? val + u * r3 * (2 * alea() - 1) : val + u * gaussien(alea); }
    out[i] = sit.f(x);
  }
  return out;
}
export const moyenne = v => { let s = 0; for (let i = 0; i < v.length; i++) s += v[i]; return s / v.length; };
export function ecartType(v) {
  const m = moyenne(v); let s = 0;
  for (let i = 0; i < v.length; i++) s += (v[i] - m) ** 2;
  return Math.sqrt(s / (v.length - 1));
}
// histogramme sur un cadre fixé par la valeur calculée et l'incertitude de la formule : G0 ± 4,2·u(G) en 21 classes
export const NB_CLASSES = 21, DEMI_CADRE = 4.2;
export function histogramme(v, centre, u) {
  const lo = centre - DEMI_CADRE * u, w = 2 * DEMI_CADRE * u / NB_CLASSES, n = new Array(NB_CLASSES).fill(0);
  let hors = 0;
  for (let i = 0; i < v.length; i++) { const k = Math.floor((v[i] - lo) / w); if (k >= 0 && k < NB_CLASSES) n[k]++; else hors++; }
  return { lo, w, n, hors, max: Math.max(...n, 1) };
}

// ---------- comparaison à une référence ----------
export const zDe = (m, ref, u) => Math.abs(m - ref) / u;
export const compatible = z => z < SEUIL_Z;

// ---------- valeurs du parcours guidé (vérifiées par le test) ----------
export const PARCOURS = {
  m1: 12.4, m2: 81.4, uPesee: 0.03,           // pesée par différence : m = m2 − m1 = 69,0 g
  ruleU: 0.03,                                 // règle graduée au mm : demi-graduation 0,05 cm, u = a/√3 ≈ 0,03 cm
  pied: { u: 0.0014, d: 2.000 },               // pied à coulisse au 1/20 : a = 0,025 mm, u = a/√3 ≈ 0,0144 mm = 0,0014 cm
};
export function parcoursCas(amelioration) {
  const sit = SITUATIONS.rho, vals = valsDe(sit);
  if (amelioration) vals.d = { val: PARCOURS.pied.d, u: PARCOURS.pied.u };
  const G = G0(sit, vals), u = uFormule(sit, vals), z = zDe(G, sit.ref, u);
  return { sit, vals, G, u, z, ecrit: resultat(G, u, sit.unite) };
}

// ---------- défi : valeurs cachées tirées au hasard ----------
// Retourne { sit, type, vals (valeurs affichées et u), G, u, z, ref, refNom, ecrit, compat } avec les contraintes de faisabilité :
//  z loin du seuil (hors [1,4 ; 3,0]), rang d'arrondi de u non ambigu, incertitude relative entre 0,5 % et 6 %.
const METAUX = [['aluminium', 2.70], ['titane', 4.51], ['zinc', 7.14], ['fer', 7.87], ['cuivre', 8.96]];
const ETALONS = [47.0, 68.0, 100.0, 150.0, 220.0, 330.0, 470.0];
const arr = (x, d) => Number(x.toFixed(d));
const tire = (a, t) => t[Math.floor(a() * t.length)];
function margeArrondi(u) {            // u n'est pas à moins de 0,7 % (relatif) d'une frontière d'arrondi (par excès, au rang de l'incertitude) : l'écriture ne dépend pas des intermédiaires arrondis
  const p = rangU(u), f = Math.pow(10, p), q = u / f, frac = q - Math.floor(q + 1e-9), marge = 0.007 * q;
  return frac > marge && 1 - frac > marge;
}
export function tirageDefi(alea = Math.random) {
  for (let essai = 0; essai < 5000; essai++) {
    const type = alea() < 0.5 ? 'res' : 'rho', sit = SITUATIONS[type], compat = alea() < 0.5, signe = alea() < 0.5 ? -1 : 1;
    const zc = compat ? 0.2 + alea() * 1.0 : 3.2 + alea() * 2.5;
    let vals, ref, refNom;
    if (type === 'res') {
      ref = tire(alea, ETALONS); refNom = `résistance étalon de ${String(ref).replace('.', ',')}${' '}Ω`;
      const U = arr(3 + alea() * 6, 2), uU = tire(alea, [0.01, 0.02, 0.03, 0.05]), uI = tire(alea, [0.1, 0.2, 0.3, 0.5, 1.0]);
      let I = 1000 * U / ref;                           // première estimation de l'intensité
      const uRel0 = Math.sqrt((uU / U) ** 2 + (uI / I) ** 2), Rm = ref * (1 + signe * zc * uRel0);
      I = arr(1000 * U / Rm, 1);
      vals = { U: { val: U, u: uU }, I: { val: I, u: uI } };
    } else {
      const [nomM, rho] = tire(alea, METAUX); ref = rho; refNom = `${nomM} (valeur tabulée)`;
      const d = arr(1 + alea() * 2, 2), h = arr(4 + alea() * 6, 1), uc = tire(alea, [0.01, 0.02, 0.03, 0.05]), uh = tire(alea, [0.01, 0.02, 0.03, 0.05]), um = tire(alea, [0.03, 0.05, 0.1]);
      const V = Math.PI * d * d * h / 4;
      const uRel0 = Math.sqrt((um / (rho * V)) ** 2 + (2 * uc / d) ** 2 + (uh / h) ** 2), rhoM = rho * (1 + signe * zc * uRel0);
      vals = { m: { val: arr(rhoM * V, 1), u: um }, d: { val: d, u: uc }, h: { val: h, u: uh } };
    }
    const G = G0(sit, vals), u = uFormule(sit, vals), z = zDe(G, ref, u), rel = u / G;
    if (z > 1.4 && z < 3.0) continue;
    if (compat !== (z < SEUIL_Z)) continue;
    if (!(rel > 0.005 && rel < 0.06) || !margeArrondi(u)) continue;
    if (type === 'rho' && vals.m.val < 5) continue;
    const refEcrit = ref;
    return { sit, type, vals, G, u, z, ref: refEcrit, refNom, ecrit: resultat(G, u, sit.unite), compat: z < SEUIL_Z };
  }
  throw new Error('tirage du défi impossible');
}
// Tolérance sur z dans le défi : 10 % de la valeur attendue, avec un plancher de 0,12 (quand z est petit, l'arrondi du numérateur pèse lourd)
export const tolZ = z0 => Math.max(0.10 * z0, 0.12);
// Pire écart d'un élève qui garde 4 chiffres significatifs pour G et 3 pour u, rapporté à la tolérance (doit rester < 1)
export function pireEcartZ(d) {
  const z2 = zDe(Number(d.G.toPrecision(4)), d.ref, Number(d.u.toPrecision(3)));
  return Math.abs(z2 - d.z) / tolZ(d.z);
}

// ---------- programme Python affiché en exploration (jamais exécuté en ligne ; vérifié par iccModele.test.mjs avec python3) ----------
const FORMULES_PY = { rho: { nom: 'rho', expr: '4 * m / (np.pi * d**2 * h)', note: 'masse volumique en g/cm3' }, res: { nom: 'R', expr: '1000 * U / I', note: 'U en V, I en mA : R en ohms' } };
const nbPy = x => String(Number(Number(x).toPrecision(6)));
export function codePython(sit, vals, loi, N) {
  const F = FORMULES_PY[sit.id], L = ['import numpy as np', '', 'rng = np.random.default_rng()', `N = ${N}  # nombre de tirages`, ''];
  for (const g of sit.grandeurs) {
    const v = Number(vals[g.id].val).toFixed(Math.max(g.dec, 1)), u = nbPy(Number(vals[g.id].u.toPrecision(3)));
    if (loi === 'rect') { L.push(`a = np.sqrt(3) * ${u}  # demi-largeur : l'écart-type vaut a/√3 = u(${g.sym})`, `${g.id} = rng.uniform(${v} - a, ${v} + a, N)  # ${g.nom} en ${g.unite}`); }
    else L.push(`${g.id} = rng.normal(${v}, ${u}, N)  # ${g.nom} en ${g.unite} : valeur mesurée, u(${g.sym})`);
  }
  L.push('', `${F.nom} = ${F.expr}  # un calcul par tirage (${F.note})`, '', `print(${F.nom}.mean(), ${F.nom}.std(ddof=1))  # moyenne et écart-type des N valeurs`);
  return L.join('\n');
}
