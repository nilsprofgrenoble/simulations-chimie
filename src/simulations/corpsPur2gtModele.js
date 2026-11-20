// ====================================================
//  MODÈLE DE LA SIMULATION 196 « CORPS PUR OU MÉLANGE : TEMPÉRATURE DE CHANGEMENT D'ÉTAT » (2GT, partie « Description et caractérisation de la matière »).
//  Fichier sans React, testé par corpsPur2gtModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • pression atmosphérique normale : les valeurs de référence sont celles de la pression normale ;
//   • échantillon homogène (bien mélangé) et température uniforme ;
//   • chauffage régulier : la température monte de VITESSE °C par minute tant qu'il n'y a pas de changement d'état ;
//   • le thermomètre simulé a une précision donnée (± p) : la valeur lue est proche de la vraie température, à la précision près (on peut lire entre deux graduations) ; courbe idéale, sans bruit de mesure ;
//   • corps pur : palier de température exactement constant pendant tout le changement d'état (le rappel L = énergie massique est dans la simulation 195, pas refait ici) ;
//   • mélange : on suppose qu'il n'est PAS azéotrope. Un mélange particulier (azéotrope, par exemple eau + éthanol à environ 96 % d'éthanol en masse, qui bout vers 78 °C) peut bouillir à
//     température constante comme un corps pur : c'est hors programme, signalé en une ligne dans le panneau pour ne pas tromper ;
//   • les courbes des mélanges sont SCHÉMATIQUES : ordre de grandeur de la température au début de l'ébullition, montée un peu exagérée pour eau + éthanol ;
//   • la durée du palier (DUREE_PALIER) est fixée à 5 min pour tous les corps et la pente est la même : on ne trace que le début de l'ébullition (l'ébullition complète durerait beaucoup plus longtemps que la montée) ; la durée du palier ne sert pas à identifier un liquide ; les pentes sont schématiques (voir la simulation 195).
//
//  VALEURS DE RÉFÉRENCE (°C, pression normale ; arrondies à l'unité, sauf 6,5 °C) :
//   eau 0 et 100 ; éthanol −114 et 78 (78,4 selon NIST WebBook : 351,5 K, fusion 159 K) ; acétone −95 et 56 (56,05 ; −94,7) ;
//   cyclohexane 6,5 et 81 (80,7 ; 6,6 ou 6,5) ; sources croisées : tableau « Common Solvents Used in Organic Chemistry » (organicchemistrydata.org),
//   tableau « Properties of common solvents » (Reusch, Michigan State University) et NIST Chemistry WebBook pour l'éthanol.
//  Eau + éthanol, début d'ébullition : températures de bulle de l'équilibre liquide-vapeur à 1 atm, arrondies (ordres de grandeur, données de cours de génie chimique).
//  Eau salée : élévation ébullioscopique 100 + 0,2 × (% de sel en masse) pour 2 % à 15 % (≈ 102 °C à 10 %).
// ====================================================

export const NB = '\u00a0';

// ---------- corps purs de référence ----------
export const CORPS = {
  acetone: { id: 'acetone', nom: 'acétone', f: 'C₃H₆O', art: 'l’acétone', du: 'd’acétone', de: 'de l’acétone', Tfus: -95, Tvap: 56 },
  ethanol: { id: 'ethanol', nom: 'éthanol', f: 'C₂H₆O', art: 'l’éthanol', du: 'd’éthanol', de: 'de l’éthanol', Tfus: -114, Tvap: 78 },
  cyclohexane: { id: 'cyclohexane', nom: 'cyclohexane', f: 'C₆H₁₂', art: 'le cyclohexane', du: 'de cyclohexane', de: 'du cyclohexane', Tfus: 6.5, Tvap: 81 },
  eau: { id: 'eau', nom: 'eau', f: 'H₂O', art: 'l’eau', du: 'd’eau', de: 'de l’eau', Tfus: 0, Tvap: 100 },
};
export const LIQUIDES = ['acetone', 'ethanol', 'cyclohexane', 'eau'];      // par température d'ébullition croissante
export const corps = id => CORPS[id];
export const LISTE_CORPS = LIQUIDES.map(id => CORPS[id]);

// ---------- chauffage ----------
export const T0 = 20;            // température de départ (°C)
export const VITESSE = 6;        // montée de température sans changement d'état (°C par minute)
export const DUREE_PALIER = 5;   // durée de l'ébullition (min), fixée pour tous les échantillons

// Mélanges proposés (pourcentages en masse)
export const MELANGES = {
  'eau-ethanol': { id: 'eau-ethanol', nom: 'eau + éthanol', reglage: 'Part d’éthanol', unite: '%', min: 10, max: 70, pas: 5, defaut: 30 },
  'eau-sel': { id: 'eau-sel', nom: 'eau salée', reglage: 'Part de sel', unite: '%', min: 2, max: 15, pas: 1, defaut: 10 },
};
// Température de début d'ébullition de eau + éthanol (liquide à p % d'éthanol en masse), par interpolation
const TAB_EE = [[0, 100], [11, 89], [20, 86.2], [36, 83], [52, 81.2], [63, 80.3], [72, 79.5], [79, 79.2], [100, 78.3]];
const interp = (tab, x) => {
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return tab[tab.length - 1][1];
};
export const arrondi = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

// Profil de chauffage d'un échantillon : { type, Tdeb, Tfin, tDeb, tFin }
//  type 'pur' : id est un corps (acetone, ethanol, cyclohexane, eau) ; type 'melange' : id est 'eau-ethanol' ou 'eau-sel' et p le pourcentage.
export function profil(id, p = null) {
  let type, Tdeb, Tfin;
  if (CORPS[id]) { type = 'pur'; Tdeb = Tfin = CORPS[id].Tvap; }
  else if (id === 'eau-ethanol') { type = 'melange'; Tdeb = interp(TAB_EE, p); Tfin = Tdeb + 0.45 * (100 - Tdeb); }
  else if (id === 'eau-sel') { type = 'melange'; Tdeb = 100 + 0.2 * p; Tfin = Tdeb + 0.04 * p; }
  else throw new Error(`échantillon inconnu : ${id}`);
  const tDeb = (Tdeb - T0) / VITESSE;
  return { id, p, type, Tdeb, Tfin, tDeb, tFin: tDeb + DUREE_PALIER };
}
export const nomEchantillon = (id, p = null) => (CORPS[id] ? CORPS[id].nom : `${MELANGES[id].nom} (${p}${NB}% de ${id === 'eau-sel' ? 'sel' : 'éthanol'})`);
// Température (°C) à la date t (min), de 0 à la fin de l'ébullition
export function temperature(pr, t) {
  if (t <= pr.tDeb) return T0 + VITESSE * t;
  if (t >= pr.tFin) return pr.Tfin;
  return pr.Tdeb + (pr.Tfin - pr.Tdeb) * (t - pr.tDeb) / DUREE_PALIER;
}
export const courbe = (pr, pas = 0.25) => {
  const pts = [];
  for (let t = 0; t < pr.tFin - 1e-9; t += pas) pts.push([t, temperature(pr, t)]);
  pts.push([pr.tFin, pr.Tfin]);
  return pts;
};
// Pente moyenne pendant l'ébullition (°C par minute) : 0 pour un corps pur
export const penteEbullition = pr => (pr.Tfin - pr.Tdeb) / DUREE_PALIER;

// ---------- thermomètre simulé ----------
export const PRECISIONS = [0.1, 0.5, 1, 2];         // °C
export const lecture = (T, prec) => Math.round(T / prec) * prec;
export const decimales = prec => (prec < 1 ? 1 : 0);
// Écart et compatibilité : la valeur lue est compatible avec la référence si l'écart est STRICTEMENT inférieur à la précision du thermomètre (comparaison qualitative, programme de 2GT)
export const ecart = (lue, ref) => Math.abs(lue - ref);
export const compatible = (lue, ref, prec) => ecart(lue, ref) < prec - 1e-9;
export const compatibles = (lue, prec) => LIQUIDES.filter(id => compatible(lue, CORPS[id].Tvap, prec));

// ---------- affichage (notation française) ----------
export const nombreFR = (x, d = null) => {
  if (!isFinite(x)) return '—';
  const s = d == null ? Number(x.toPrecision(4)).toLocaleString('fr-FR', { maximumFractionDigits: 6 }) : x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return s.replace(/[\u202f\u00a0 ]/g, NB).replace('-', '−');
};
export const temp = (x, d = null) => `${nombreFR(x, d)}${NB}°C`;

// ---------- exemples du quotidien (tri) ----------
//  cat : 'pur' | 'homogene' | 'heterogene'
export const CATEGORIES = [['pur', 'corps pur'], ['homogene', 'mélange homogène'], ['heterogene', 'mélange hétérogène']];
export const NOM_CAT = { pur: 'corps pur', homogene: 'mélange homogène', heterogene: 'mélange hétérogène' };
export const EXEMPLES = {
  or: { id: 'or', nom: 'un lingot d’or pur', cat: 'pur', pourquoi: 'Il ne contient qu’une seule espèce chimique : l’or.' },
  oxygene: { id: 'oxygene', nom: 'le dioxygène d’une bouteille médicale', cat: 'pur', pourquoi: 'Une seule espèce chimique : le dioxygène O₂.' },
  eauDistillee: { id: 'eauDistillee', nom: 'l’eau distillée', cat: 'pur', pourquoi: 'Elle ne contient que de l’eau, sans sels dissous.' },
  robinet: { id: 'robinet', nom: 'l’eau du robinet', cat: 'homogene', pourquoi: 'On ne voit qu’un liquide, mais il contient de l’eau et des sels minéraux dissous : plusieurs espèces chimiques.' },
  minerale: { id: 'minerale', nom: 'l’eau minérale plate', cat: 'homogene', pourquoi: 'On ne voit qu’un liquide, mais l’eau contient des sels minéraux dissous : c’est un mélange.' },
  air: { id: 'air', nom: 'l’air', cat: 'homogene', pourquoi: 'Un seul gaz à l’œil nu, mais du diazote, du dioxygène et d’autres gaz mélangés.' },
  vinaigrette: { id: 'vinaigrette', nom: 'une vinaigrette', cat: 'heterogene', pourquoi: 'On voit l’huile et le vinaigre séparés : plusieurs matières visibles.' },
  jusPulpe: { id: 'jusPulpe', nom: 'un jus d’orange avec pulpe', cat: 'heterogene', pourquoi: 'On voit des morceaux de pulpe dans le liquide : plusieurs matières visibles.' },
  sable: { id: 'sable', nom: 'de l’eau avec du sable', cat: 'heterogene', pourquoi: 'On voit les grains de sable dans l’eau : plusieurs matières visibles.' },
  sirop: { id: 'sirop', nom: 'du sirop de menthe dilué dans l’eau', cat: 'homogene', pourquoi: 'On ne voit qu’un liquide coloré, mais il contient de l’eau, du sucre et des arômes.' },
  bijou: { id: 'bijou', nom: 'un bijou en or 18 carats', cat: 'homogene', pourquoi: 'C’est un alliage : de l’or mélangé à d’autres métaux, sans qu’on distingue les constituants.' },
};
export const exemple = id => EXEMPLES[id];
export const TRI = ['robinet', 'or', 'vinaigrette', 'air', 'oxygene', 'sable'];     // étape de tri : 2 corps purs, 2 mélanges homogènes, 2 hétérogènes

// ---------- défis ----------
const tireDans = t => t[Math.floor(Math.random() * t.length)];
// Défi 1 : « corps pur ou mélange ? » depuis une courbe. Les cas limites sont exclus : un mélange (eau + éthanol de 20 % à 60 %) monte d'au moins 1 °C par minute, un corps pur reste plat.
export const tirerDefiPur = (precedent = null) => {
  let d;
  do {
    if (Math.random() < 0.5) { const id = tireDans(LIQUIDES); d = { id, p: null, pur: true }; }
    else d = { id: 'eau-ethanol', p: tireDans([20, 25, 30, 35, 40, 45, 50, 55, 60]), pur: false };
  } while (precedent && precedent.id === d.id && precedent.p === d.p);
  d.pr = profil(d.id, d.p);
  return d;
};
export const reponseJustePur = (d, rep) => rep === (d.pur ? 'pur' : 'melange');

// Défi 2 : « quel est ce liquide ? » : la valeur lue est proche de la référence d'un seul liquide (écart ≤ 0,6 × précision) ; les autres références sont à plus d'une précision.
//  Tolérance affichée = précision du thermomètre (jamais plus stricte).
const DECALAGES = [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6];
export const tirerDefiLiquide = (precedent = null) => {
  let d;
  do {
    const id = tireDans(LIQUIDES), prec = tireDans([0.5, 1, 1, 2]), ref = CORPS[id].Tvap;
    const lue = arrondi(ref + tireDans(DECALAGES) * prec, 1);
    const cs = compatibles(lue, prec);
    if (cs.length !== 1 || cs[0] !== id) continue;                    // cas limite (deux liquides compatibles) exclu
    // aucun écart n'est égal à la précision (« inférieur » strict sans ambiguïté)
    if (LIQUIDES.some(x => Math.abs(ecart(lue, CORPS[x].Tvap) - prec) < 0.15)) continue;
    d = { id, prec, lue, pr: profil(id) };
  } while (!d || (precedent && precedent.id === d.id && precedent.lue === d.lue && precedent.prec === d.prec));
  return d;
};
export const reponseJusteLiquide = (d, rep) => rep === d.id;

// Profil d'un liquide pur dont le palier est lu à la température T (défi « quel est ce liquide ? »)
export const profilPalier = T => { const tDeb = (T - T0) / VITESSE; return { id: 'inconnu', p: null, type: 'pur', Tdeb: T, Tfin: T, tDeb, tFin: tDeb + DUREE_PALIER }; };
