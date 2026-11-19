// Modèle de la simulation 161 « Mesure et incertitudes » (1G spé PC) : variabilité d'une mesure, histogramme, moyenne, écart-type,
// incertitude-type de type A (s/√N) et de type B (a/√3), écriture du résultat, comparaison qualitative à une référence.
// Sans React : testé par mesureModele.test.mjs.
//
// HYPOTHÈSES DU MODÈLE (reprises à l'écran dans le panneau « Hypothèses de travail ») :
//  • les N mesures sont indépendantes, du même mesurande, dans les mêmes conditions ;
//  • la dispersion est supposée symétrique autour d'une valeur centrale : la simulation la tire selon une loi normale (un MODÈLE, pas une certitude) ;
//  • la valeur lue est ensuite arrondie à la résolution de l'instrument (graduation, dernier chiffre affiché) ;
//  • un décalage systématique (instrument mal réglé) peut être ajouté : il n'est pas visible dans la dispersion ;
//  • type B : loi uniforme sur [x − a ; x + a], donc u = a / √3 (formule donnée, non démontrée en 1G).

// couleurs communes (scène, cartes, mesures)
export const COL = { bleu: '#0369a1', bleuClair: '#bae6fd', orange: '#b45309', orangeClair: '#fde68a', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', grisClair: '#e2e8f0', txt: '#0f172a' };

// ---------- générateur pseudo-aléatoire à graine (exercices et défis reproductibles) ----------
export function generateur(graine) {
  let a = (Math.floor(graine) >>> 0) + 0x6D2B79F5;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// tirage gaussien (Box-Muller) à partir d'un générateur uniforme
export function gaussien(alea) {
  let u = 0;
  while (u === 0) u = alea();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * alea());
}

// ---------- situations de mesure ----------
// ref : valeur de référence ; sigma : dispersion d'UNE mesure (instrument + protocole) ; res : résolution de lecture ; dec : décimales d'une mesure ;
// biais : décalage systématique proposé en exploration ; a : demi-largeur de l'intervalle de type B (donnée de l'instrument)
export const SITUATIONS = {
  chrono: { id: 'chrono', nom: 'Chronomètre à main', mesurande: 'durée de 10 oscillations d’un pendule', sym: 't', unite: 's',
    ref: 14.19, centre: 14.2, classe: 0.1, refTxt: 'valeur calculée avec la longueur du pendule (L = 0,500 m)', sigma: 0.12, res: 0.01, dec: 2, biais: 0.30, biaisTxt: 'chronomètre déréglé (retard de 0,30 s)',
    a: 0.20, aTxt: 'temps de réaction de l’opérateur estimé à ± 0,20 s' },
  focale: { id: 'focale', nom: 'Banc d’optique', mesurande: 'distance focale d’une lentille convergente (image la plus nette)', sym: 'f′', unite: 'mm',
    ref: 150, centre: 150, classe: 4, refTxt: 'valeur indiquée par le fabricant de la lentille', sigma: 3.5, res: 1, dec: 0, biais: 9, biaisTxt: 'règle du banc mal calée (décalage de 9 mm)',
    a: 6, aTxt: 'latitude de mise au point : l’image paraît nette sur un intervalle de ± 6 mm' },
  eprouvette: { id: 'eprouvette', nom: 'Éprouvette graduée de 100 mL', mesurande: 'volume d’eau versé dans l’éprouvette', sym: 'V', unite: 'mL',
    ref: 50.0, centre: 50.0, classe: 0.5, refTxt: 'volume prélevé avec une pipette jaugée de 50,0 mL', sigma: 0.35, res: 0.5, dec: 1, biais: 1.0, biaisTxt: 'lecture toujours faite trop haut (décalage de 1,0 mL)',
    a: 0.5, aTxt: 'lecture sur une graduation de 1 mL : ± 0,5 mL' },
  balance: { id: 'balance', nom: 'Balance au milligramme', mesurande: 'masse d’une masse marquée', sym: 'm', unite: 'g',
    ref: 20.000, centre: 20.000, classe: 0.002, refTxt: 'masse inscrite sur la masse marquée', sigma: 0.002, res: 0.001, dec: 3, biais: 0.006, biaisTxt: 'balance mal tarée (décalage de 6 mg)',
    a: 0.003, aTxt: 'précision donnée par le fabricant : ± 3 mg' },
};
export const IDS_SITUATIONS = ['chrono', 'focale', 'eprouvette', 'balance'];
export const NB_MESURES = [3, 5, 10, 20, 50, 100];

// arrondi à la résolution (évite les erreurs de virgule flottante)
export const arrondiA = (x, res) => Number((Math.round(x / res) * res).toFixed(8));

// ---------- tirage d'une série ----------
// sit : situation ; N : nombre de mesures ; graine ; biais : 0 ou 1 (décalage systématique)
export function tirerSerie(sit, N, graine, biais = false) {
  const alea = generateur(graine);
  const out = [];
  for (let i = 0; i < N; i++) out.push(arrondiA(sit.ref + (biais ? sit.biais : 0) + sit.sigma * gaussien(alea), sit.res));
  return out;
}

// ---------- statistiques ----------
export const moyenne = v => v.reduce((s, x) => s + x, 0) / v.length;
// écart-type expérimental (division par N − 1) : estime la dispersion d'UNE mesure
export function ecartType(v) {
  if (v.length < 2) return NaN;
  const m = moyenne(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / (v.length - 1));
}
// incertitude-type de type A sur la moyenne : u = s / √N
export const incertitudeA = (s, N) => s / Math.sqrt(N);
// incertitude-type de type B pour une loi uniforme de demi-largeur a : u = a / √3
export const incertitudeB = a => a / Math.sqrt(3);
// demi-largeur d'un intervalle [min ; max]
export const demiLargeur = (min, max) => (max - min) / 2;

// ---------- écriture du résultat ----------
// rang décimal (puissance de 10) du dernier chiffre conservé de l'incertitude : 1 chiffre significatif, 2 si le premier chiffre est 1 ;
// l'incertitude est arrondie PAR EXCÈS (convention de la simulation : on ne sous-estime pas l'incertitude)
export function rangU(u) {
  if (!(u > 0)) return 0;
  const e = Math.floor(Math.log10(u) + 1e-12);
  const premier = Math.floor(u / Math.pow(10, e) + 1e-9);
  return premier === 1 ? e - 1 : e;
}
export function arrondiU(u) {
  if (!(u > 0)) return 0;
  const p = rangU(u), f = Math.pow(10, p);
  return Number((Math.ceil(u / f - 1e-9) * f).toFixed(Math.max(0, -p) + 2));
}
// nombre décimales d'affichage (>= 0) correspondant au rang p
export const decimalesDe = u => Math.max(0, -rangU(u));     // rang de l'incertitude brute : 0,0196 s'écrit 0,020 (3 décimales), la valeur est arrondie au même rang
// moyenne arrondie à la même décimale que l'incertitude arrondie
export function arrondiMoyenne(m, u) {
  const p = rangU(u), f = Math.pow(10, p);
  return Number((Math.round(m / f) * f).toFixed(Math.max(0, -p) + 2));
}
const virgule = (x, d) => Number(x).toFixed(d).replace('.', ',').replace('-', '−');
export const fmt = virgule;
// résultat complet : { m, u, d, texte }
export function resultat(m, u, unite) {
  const ua = arrondiU(u), d = decimalesDe(u), ma = arrondiMoyenne(m, u);
  return { m: ma, u: ua, d, texte: `${virgule(ma, d)}\u00a0±\u00a0${virgule(ua, d)}\u00a0${unite}` };
}

// ---------- comparaison qualitative à une valeur de référence ----------
// rapport = |x̄ − référence| / u ; lecture qualitative (ordre de grandeur, pas un critère chiffré du programme de 1G)
export function comparer(m, u, ref) {
  if (!(u > 0)) return { rapport: NaN, niveau: 'indetermine' };      // u nulle (valeurs toutes identiques) : pas de comparaison possible
  const rapport = Math.abs(m - ref) / u;
  const niveau = rapport <= 1 ? 'compatible' : rapport >= 3 ? 'ecart' : 'limite';   // seuils indicatifs, propres à la simulation
  return { rapport, niveau };
}

// ---------- histogramme ----------
// Classes centrées sur centre + k × largeur (k de −K à +K), la classe k contient les valeurs de [centre + (k − ½)·w ; centre + (k + ½)·w[.
// Domaine fixe pour toutes les séries d'une même situation (pour pouvoir comparer deux histogrammes).
export const K_CLASSES = 8;
export const largeurClasse = sit => sit.classe;
export const decimalesClasse = (sit, w = sit.classe) => { for (let d = 0; d < 6; d++) if (Math.abs(w * Math.pow(10, d) - Math.round(w * Math.pow(10, d))) < 1e-9) return d; return 6; };
export function histogramme(sit, valeurs, w = sit.classe, K = K_CLASSES) {
  const c0 = sit.centre, classes = [];
  for (let k = -K; k <= K; k++) classes.push({ centre: Number((c0 + k * w).toFixed(8)), n: 0 });
  let hors = 0;
  valeurs.forEach(x => {
    const k = Math.floor((x - c0) / w + 0.5 + 1e-9);
    if (Math.abs(k) <= K) classes[k + K].n += 1; else hors += 1;
  });
  return { w, classes, hors, max: Math.max(...classes.map(c => c.n), 1) };
}

// ---------- séries du parcours guidé (valeurs fixées à la main, vérifiées par le test) ----------
export const SERIE_COURTE = [14.28, 14.11, 14.35, 14.19, 14.32];        // moyenne 14,25 s ; s ≈ 0,099 s
// 20 mesures de la durée de 10 oscillations (histogramme de l'étape 2) : même instrument, même opérateur, s voisin de celui de la série courte
export const SERIE_HISTO = [14.20, 14.25, 14.15, 14.30, 14.26, 14.13, 14.33, 14.36, 14.33, 14.32, 14.25, 14.18, 14.30, 14.14, 14.32, 14.47, 14.08, 14.19, 14.31, 14.38];   // moyenne 14,26 s, s ≈ 0,10 s

// deux séries de 20 mesures de même centre mais de dispersions très différentes (étape « Deux séries »), tirées avec une graine fixe
export function deuxSeries() {
  const sit = SITUATIONS.chrono, N = 20;
  const A = tirerSerie({ ...sit, sigma: 0.03 }, N, 7), B = tirerSerie({ ...sit, sigma: 0.20 }, N, 11);
  return { A, B, sA: ecartType(A), sB: ecartType(B) };
}

// ---------- défis ----------
// Défi A : série tirée, incertitude-type de type A de la moyenne
export function tirerDefiA(graine0) {
  // on écarte les tirages où toutes les valeurs sont identiques (s = 0 : u non significative)
  for (let g = graine0; g < graine0 + 50; g++) { const d = defiA(g); if (d.s > 0) return d; }
  return defiA(graine0 + 1000003);
}
function defiA(graine) {
  const alea = generateur(graine);
  const sit = SITUATIONS[IDS_SITUATIONS[Math.floor(alea() * IDS_SITUATIONS.length)]];
  const N = [6, 8, 10][Math.floor(alea() * 3)];
  const v = tirerSerie(sit, N, Math.floor(alea() * 1e9));
  const s = ecartType(v), u = incertitudeA(s, N), m = moyenne(v);
  return { type: 'A', graine, sit, N, valeurs: v, m, s, u, vrai: u };
}
// Défi B : intervalle de netteté / de lecture [min ; max], incertitude-type de type B
export function tirerDefiB(graine) {
  const alea = generateur(graine);
  const sit = SITUATIONS.focale;
  const demi = [4, 5, 6, 7, 8, 9, 10][Math.floor(alea() * 7)];
  const centre = sit.ref + Math.round((alea() - 0.5) * 20);
  const min = centre - demi, max = centre + demi;
  const a = demiLargeur(min, max);
  return { type: 'B', graine, sit, min, max, a, centre, vrai: incertitudeB(a) };
}

// nouveau défi (graine tirée au hasard, puis tout est reproductible)
export const tirerDefi = type => { const g = 1 + Math.floor(Math.random() * 1e6); return type === 'A' ? tirerDefiA(g) : tirerDefiB(g); };
