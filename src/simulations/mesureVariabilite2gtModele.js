// ====================================================
//  Modèle de la simulation « Mesure : variabilité, histogramme, moyenne et écart-type » (2GT, thème « Mesure et incertitudes »).
//  Modèle pur (sans React), testé par mesureVariabilite2gtModele.test.mjs.
//  Une série de mesures indépendantes d'un même mesurande : valeur de référence + dispersion propre à l'instrument et au protocole.
//  HYPOTHÈSES (affichées dans le panneau d'hypothèses de la simulation) :
//    • mesures indépendantes du même mesurande, faites dans les mêmes conditions (aucune dérive) ; une dérive est simulable en exploration ;
//    • dispersion à peu près symétrique autour de la valeur de référence : les séries simulées sont tirées au hasard avec un générateur centré
//      (tirage de Box-Muller), sans que la loi normale soit présentée à l'élève ni démontrée ;
//    • pas d'erreur systématique : les valeurs sont centrées sur la valeur de référence (un instrument déréglé décalerait toutes les valeurs) ;
//    • l'écart-type décrit la largeur de la série ; ce n'est PAS l'erreur sur la moyenne (incertitude-type : simulation suivante) ;
//    • écart-type de tableur ou de calculatrice : formule avec N − 1 (fonction ÉCART.TYPE) ; en 2GT on l'exploite sans le démontrer ;
//    • valeurs fictives : dispersions choisies pour la lisibilité (ordres de grandeur réalistes, pas des mesures réelles).
//  Pas de type A / B, pas d'incertitude-type, pas de loi normale ici (hors programme de ce parcours).
// ====================================================

export const NB = ' ';                                   // espace insécable

// ----- générateur pseudo-aléatoire reproductible (mulberry32) et tirage centré (Box-Muller) -----
export function generateur(graine) {
  let a = (graine * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function gaussien(alea) {
  let u = 0; while (u === 0) u = alea();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * alea());
}
// arrondi à la résolution de l'instrument (évite les erreurs de virgule flottante)
export const arrondiA = (x, res) => Number((Math.round(x / res + 1e-9) * res).toFixed(8));

// ----- statistiques -----
export const somme = v => v.reduce((s, x) => s + x, 0);
export const moyenne = v => somme(v) / v.length;
// écart-type de tableur/calculatrice (ÉCART.TYPE, diviseur N − 1)
export function ecartType(v) {
  if (v.length < 2) return NaN;
  const m = moyenne(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / (v.length - 1));
}
export const minimum = v => Math.min(...v);
export const maximum = v => Math.max(...v);

// ----- situations : mesurande, deux configurations (instrument ou protocole) -----
// sigma : dispersion d'une mesure ; res : résolution des valeurs lues ; classe, K : classes de l'histogramme (largeur, nombre) ; dec : décimales des valeurs
export const SITUATIONS = {
  chute: { id: 'chute', nom: 'Durée de chute d’une bille', mesurande: 'la durée de chute d’une bille lâchée de 1,80 m de haut', sym: 't', unite: 's', ref: 0.606, dec: 2, accent: 'Chronométrer',
    configs: [
      { id: 'main', nom: 'chronomètre à main', court: 'à la main', sigma: 0.05, res: 0.01, classe: 0.04, K: 12, dec: 2, genre: 'instrument' },
      { id: 'cellules', nom: 'deux cellules photoélectriques et un chronomètre électronique', court: 'avec des cellules', sigma: 0.004, res: 0.001, classe: 0.004, K: 12, dec: 3, genre: 'instrument' },
    ] },
  gouttes: { id: 'gouttes', nom: 'Durée entre deux gouttes', mesurande: 'la durée entre deux gouttes d’un robinet qui goutte régulièrement', sym: 't', unite: 's', ref: 1.2, dec: 2, accent: 'Chronométrer',
    configs: [
      { id: 'un', nom: 'un seul intervalle chronométré', court: 'un intervalle', sigma: 0.06, res: 0.01, classe: 0.05, K: 10, dec: 2, genre: 'protocole' },
      { id: 'dix', nom: '10 intervalles chronométrés d’un coup, résultat divisé par 10', court: '10 intervalles ÷ 10', sigma: 0.006, res: 0.001, classe: 0.005, K: 10, dec: 3, genre: 'protocole' },
    ] },
  crayon: { id: 'crayon', nom: 'Longueur d’un crayon', mesurande: 'la longueur d’un crayon', sym: 'L', unite: 'mm', ref: 174, dec: 0, accent: 'Mesurer',
    configs: [
      { id: 'regle', nom: 'règle graduée en millimètres', court: 'à la règle', sigma: 0.6, res: 1, classe: 1, K: 9, dec: 0, genre: 'instrument' },
      { id: 'pied', nom: 'pied à coulisse', court: 'au pied à coulisse', sigma: 0.12, res: 0.1, classe: 0.1, K: 11, dec: 1, genre: 'instrument' },
    ] },
  eau: { id: 'eau', nom: 'Masse d’eau délivrée', mesurande: 'la masse d’eau délivrée quand on prélève 20 mL', sym: 'm', unite: 'g', ref: 20.0, dec: 2, accent: 'Peser',
    configs: [
      { id: 'eprouvette', nom: 'éprouvette graduée de 25 mL', court: 'avec une éprouvette', sigma: 0.35, res: 0.01, classe: 0.25, K: 10, dec: 2, genre: 'instrument' },
      { id: 'pipette', nom: 'pipette jaugée de 20 mL', court: 'avec une pipette jaugée', sigma: 0.03, res: 0.01, classe: 0.02, K: 12, dec: 2, genre: 'instrument' },
    ] },
};
export const IDS_SITUATIONS = ['chute', 'gouttes', 'crayon', 'eau'];
export const NB_MESURES = [5, 10, 20, 50, 100];
export const configDe = (sit, id) => SITUATIONS[sit].configs.find(c => c.id === id) || SITUATIONS[sit].configs[0];

// début (multiple de la largeur de classe) d'un histogramme de K classes centré sur la valeur de référence
// Si la largeur de classe est égale à la résolution de l'instrument (valeurs lues sur une grille), les barres sont centrées sur les valeurs lues (K impair) : la barre du milieu est centrée sur la référence.
export function debutClasses(ref, classe, K, res = null) {
  if (res !== null && Math.abs(classe - res) < 1e-12) return Number((ref - K * classe / 2).toFixed(8));
  const d = Math.floor((ref - K / 2 * classe) / classe + 1e-9) * classe; return Number(d.toFixed(8));
}

// ----- tirage d'une série -----
// derive : décalage total (en nombre de σ) du mesurande entre la première et la dernière mesure (0 = mesures indépendantes sans dérive)
export function tirerSerie(sit, idConfig, n, graine, derive = 0) {
  const S = SITUATIONS[sit], c = configDe(sit, idConfig), alea = generateur(graine), out = [];
  for (let i = 0; i < n; i++) {
    const d = n > 1 ? derive * c.sigma * (i / (n - 1) - 0.5) : 0;
    out.push(arrondiA(S.ref + d + c.sigma * gaussien(alea), c.res));
  }
  return out;
}
// Série tirée avec tous les points dans les classes affichées (on relance le tirage sinon)
export function tirerSerieAffichable(sit, idConfig, n, graine, derive = 0) {
  const S = SITUATIONS[sit], c = configDe(sit, idConfig), a = debutClasses(S.ref, c.classe, c.K, c.res), b = a + c.K * c.classe;
  let v = null;
  for (let k = 0; k < 60; k++) { v = tirerSerie(sit, idConfig, n, graine + 7919 * k, derive); if (v.every(x => x >= a - 1e-9 && x < b - 1e-9)) return { valeurs: v, graine: graine + 7919 * k }; }
  return { valeurs: v.map(x => Math.min(Math.max(x, a), b - c.res)), graine };
}
// Série « standardisée » : moyenne et écart-type voulus (à l'arrondi près), pente = dérive totale en unités de la série
export function serieStandard(n, moy, s, res, graine, pente = 0) {
  const alea = generateur(graine), z = Array.from({ length: n }, () => gaussien(alea)), m = moyenne(z), sd = ecartType(z);
  return z.map((x, i) => arrondiA(moy + s * (x - m) / sd + pente * (n > 1 ? i / (n - 1) - 0.5 : 0), res));
}

// ----- histogramme -----
// Classes [a ; b[ : une valeur égale à la borne de droite est rangée dans la classe suivante.
export function histogramme(valeurs, debut, largeur, K) {
  const classes = Array.from({ length: K }, (_, i) => ({ a: Number((debut + i * largeur).toFixed(8)), b: Number((debut + (i + 1) * largeur).toFixed(8)), n: 0 }));
  let hors = 0;
  for (const x of valeurs) { const i = Math.floor((x - debut) / largeur + 1e-9); if (i < 0 || i >= K) hors++; else classes[i].n++; }
  return { classes, hors, nMax: Math.max(...classes.map(c => c.n)) };
}
export const effectifClasse = (valeurs, a, b) => valeurs.filter(x => x >= a - 1e-9 && x < b - 1e-9).length;

// ----- écriture des nombres (virgule française) -----
export const nbf = (x, d) => Number(x).toFixed(d).replace('.', ',');
export function nbSig(x, cs = 2) {      // nombre avec cs chiffres significatifs, écriture décimale (0,051 ; 1,2 ; 0,60)
  if (!isFinite(x) || x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x))), d = Math.max(0, cs - 1 - e);
  return Number(x).toFixed(Math.min(d, 8)).replace('.', ',');
}
export const decimalesDe = res => { for (let d = 0; d < 8; d++) if (Math.abs(res * 10 ** d - Math.round(res * 10 ** d)) < 1e-9) return d; return 8; };
// Moyenne affichée : une décimale de plus que les valeurs lues ; écart-type : 2 chiffres significatifs
export const moyenneTexte = (v, res) => nbf(moyenne(v), decimalesDe(res) + 1);
export const ecartTypeTexte = v => nbSig(ecartType(v), 2);
export const avecUnite = (txt, u) => `${txt}${NB}${u}`;
export const decimalesAxe = classe => Math.max(decimalesDe(classe), 0);
export const lisible = (x, d) => nbf(x, d);

// ====================================================
//  Séries du parcours guidé (valeurs fixées : l'élève peut tout recalculer)
// ====================================================
// étape 1 : 8 durées de chute chronométrées à la main
export const CHUTE_8 = [0.58, 0.64, 0.61, 0.55, 0.66, 0.60, 0.63, 0.57];
// étape 2 : 20 durées de chute (classes de 0,04 s à partir de 0,48 s)
export const CHUTE_20 = [0.50, 0.53, 0.55, 0.57, 0.58, 0.59, 0.59, 0.61, 0.61, 0.62, 0.62, 0.63, 0.63, 0.65, 0.65, 0.66, 0.67, 0.69, 0.71, 0.73];
export const HISTO_CHUTE = { debut: 0.44, largeur: 0.04, K: 9 };
// étape 3 : 12 durées entre deux gouttes (classes de 0,05 s à partir de 1,10 s)
export const GOUTTES_12 = [1.23, 1.17, 1.26, 1.21, 1.29, 1.19, 1.22, 1.14, 1.24, 1.20, 1.18, 1.31];
export const HISTO_GOUTTES = { debut: 1.10, largeur: 0.05, K: 5 };
// étape 4 : 5 longueurs (exemple) et 6 masses (question)
export const CRAYON_5 = [174, 175, 173, 174, 175];
export const EAU_6 = [20.31, 19.87, 20.46, 19.92, 19.75, 20.25];
// étapes 5 à 6 : séries à moyenne et écart-type fixés (durées entre gouttes, chronomètre électronique, résolution 0,001 s)
export const SERIES_DISP = {
  A: serieStandard(24, 1.2, 0.03, 0.001, 11), B: serieStandard(24, 1.2, 0.07, 0.001, 12),                                  // étape 5 : étroite et large
  E: serieStandard(24, 1.2, 0.03, 0.001, 13), F: serieStandard(24, 1.2, 0.06, 0.001, 14),                                  // exemple de l'étape 6
  S1: serieStandard(24, 1.2, 0.02, 0.001, 21), S2: serieStandard(24, 1.2, 0.05, 0.001, 22), S3: serieStandard(24, 1.2, 0.09, 0.001, 23),   // étape 6
};
export const HISTO_DISP = { debut: 0.96, largeur: 0.04, K: 12 };       // axe commun 0,96 s à 1,44 s
// étape 7 : crayon à la règle et au pied à coulisse, 20 mesures chacun
export const CRAYON_REGLE = tirerSerie('crayon', 'regle', 20, 31).slice();
export const CRAYON_PIED = tirerSerie('crayon', 'pied', 20, 32).slice();
// étape 8 : gouttes, un intervalle et dix intervalles, 20 mesures chacun
export const GOUTTES_UN = tirerSerie('gouttes', 'un', 20, 41).slice();
export const GOUTTES_DIX = tirerSerie('gouttes', 'dix', 20, 42).slice();
// étape 9 : deux séries notées dans l'ordre : A sans tendance, B qui dérive
export const ORDRE_A = serieStandard(20, 1.2, 0.04, 0.01, 30);
export const ORDRE_B = serieStandard(20, 1.2, 0.025, 0.01, 52, 0.17);
// étape 10 : même situation, 5 mesures puis 50 mesures
export const NOMBRE_5 = tirerSerie('chute', 'main', 5, 60);
export const NOMBRE_50 = tirerSerie('chute', 'main', 50, 62);

// ====================================================
//  Défis (tirages bornés)
// ====================================================
const tire = t => t[Math.floor(Math.random() * t.length)];
export const toleranceRapport = 0.1;
// Défi « comparer deux séries » : deux séries de 20 mesures du même mesurande, l'une par configuration ; l'ordre A/B est tiré au hasard
export function tirerDefiComparer(prec) {
  for (let essai = 0; essai < 200; essai++) {
    const sit = tire(IDS_SITUATIONS), inverse = Math.random() < 0.5, graine = 1 + Math.floor(Math.random() * 1e6);
    if (prec && prec.sit === sit && prec.inverse === inverse && prec.graine === graine) continue;
    const S = SITUATIONS[sit], cLarge = S.configs[0], cEtroite = S.configs[1];
    const large = tirerSerieAffichable(sit, cLarge.id, 20, graine).valeurs, etroite = tirerSerie(sit, cEtroite.id, 20, graine + 1);
    const sL = ecartType(large), sE = ecartType(etroite);
    if (sL / sE < 2.5) continue;
    // A et B : la série large est A si inverse = faux
    const A = inverse ? etroite : large, B = inverse ? large : etroite;
    const sA = ecartType(A), sB = ecartType(B);
    return { sit, graine, inverse, A, B, sA, sB, largeEstA: !inverse, rapport: Math.max(sA, sB) / Math.min(sA, sB), cLarge, cEtroite };
  }
  return null;
}
// Défi « estimer à partir d'un histogramme » : 40 mesures ; l'élève lit la valeur centrale et choisit parmi trois écarts-types
export function tirerDefiEstimer(prec) {
  for (let essai = 0; essai < 200; essai++) {
    const sit = tire(IDS_SITUATIONS), cfg = tire(SITUATIONS[sit].configs), graine = 1 + Math.floor(Math.random() * 1e6);
    if (prec && prec.sit === sit && prec.cfg === cfg.id && prec.graine === graine) continue;
    const S = SITUATIONS[sit], { valeurs } = tirerSerieAffichable(sit, cfg.id, 40, graine);
    const m = moyenne(valeurs), s = ecartType(valeurs), a = debutClasses(S.ref, cfg.classe, cfg.K, cfg.res);
    // trois propositions : moitié, valeur de la série, double (arrondies à 2 chiffres significatifs)
    const base = [s / 2, s, s * 2].map(x => Number(x.toPrecision(2)));
    if (new Set(base).size < 3) continue;
    // la règle « largeur de la zone occupée ÷ 4 » doit désigner la bonne proposition (sinon on retire une autre série)
    const largeur = (maximum(valeurs) - minimum(valeurs) + cfg.res) / 4, proches = base.map(c => Math.abs(Math.log(largeur / c)));
    if (proches.indexOf(Math.min(...proches)) !== 1) continue;
    const ordre = [0, 1, 2].sort(() => Math.random() - 0.5), choix = ordre.map(i => base[i]), bonne = ordre.indexOf(1);
    return { sit, cfg: cfg.id, graine, valeurs, m, s, choix, bonne, debut: a, classe: cfg.classe, K: cfg.K, tolMoyenne: cfg.classe };
  }
  return null;
}
