// ====================================================
//  MODÈLE DE LA SIMULATION 199 « IMAGE RÉELLE ET GRANDISSEMENT AVEC UNE LENTILLE CONVERGENTE » (2GT, « Ondes et signaux », lumière et image).
//  Fichier sans React, testé par imageLentille2gtModele.test.mjs.
//
//  Coordonnées en cm : x le long de l'axe optique (sens de la lumière), origine au centre optique O de la lentille ; y vers le haut.
//  Objet réel AB, perpendiculaire à l'axe : A = (−d, 0), B = (−d, h). Foyer objet F = (−f, 0), foyer image F′ = (f, 0), f = f′ distance focale.
//
//  CONSTRUCTION : le modèle NE DESSINE RIEN À LA MAIN. Les trois rayons particuliers issus de B sont des droites calculées :
//   R1 : parallèle à l'axe jusqu'à la lentille, puis droite passant par F′ ;
//   R2 : droite B–O, non déviée ;
//   R3 : droite passant par F (donc B–F) jusqu'à la lentille, puis parallèle à l'axe.
//  Le point image B′ est l'INTERSECTION de R1 et R2 après la lentille ; le test node vérifie que R3 passe exactement par ce point,
//  que A′B′ / AB = OA′ / OA (Thalès) et que les valeurs sont celles du cours de 1re (relation de conjugaison, utilisée UNIQUEMENT pour vérifier ici).
//  Aucune relation de conjugaison n'est affichée à l'élève de 2GT.
//
//  HYPOTHÈSES (affichées dans le panneau « Hypothèses de travail ») : lentille mince, rayons proches de l'axe (approximation de Gauss),
//  objet plan perpendiculaire à l'axe, lumière d'une seule couleur, schéma à l'échelle (même échelle en longueur et en hauteur).
// ====================================================

export const NB = '\u00A0';
export const H_OBJ = 2;            // hauteur AB de l'objet (cm)
export const F_PARCOURS = 4;       // distance focale f′ du parcours guidé (cm)
export const LENS_H = 5;           // demi-hauteur de la lentille représentée (cm) : un rayon qui arriverait plus haut ne la traverserait pas
export const X_MAX = 14.5;         // limite du schéma, de part et d'autre de O (cm)
export const Y_MAX = 5.6;          // limite du schéma en hauteur (cm)
export const EPS = 1e-9;

// ---------- affichage (notation française) ----------
export const arrondiSig = (x, n) => (x === 0 || !isFinite(x) ? x : Number(x.toPrecision(n)));
export const nombreFR = (x, d = 1) => (isFinite(x) ? x.toFixed(d).replace('.', ',').replace('-', '−') : '—');
export const cmFR = (x, d = 1) => `${nombreFR(x, d)}${NB}cm`;
export const cmAuto = x => cmFR(x, Math.abs(x - Math.round(x)) < 1e-9 ? 0 : 1);   // 12 cm, 6 cm, 1,5 cm

// ---------- droites ----------
// Une droite = point p + direction u. Ordonnée à l'abscisse x (u[0] ≠ 0).
export const ordonnee = (r, x) => r.p[1] + (r.u[1] / r.u[0]) * (x - r.p[0]);
// Intersection de deux droites (null si parallèles)
export function intersection(r, s) {
  const det = r.u[0] * s.u[1] - r.u[1] * s.u[0];
  if (Math.abs(det) < EPS) return null;
  const t = ((s.p[0] - r.p[0]) * s.u[1] - (s.p[1] - r.p[1]) * s.u[0]) / det;
  return [r.p[0] + t * r.u[0], r.p[1] + t * r.u[1]];
}

export const NOM_RAYON = { 1: 'rayon parallèle à l’axe', 2: 'rayon qui passe par O', 3: 'rayon qui passe par F' };
export const COULEUR_RAYON = { 1: '#0072b2', 2: '#d55e00', 3: '#7c3aed' };    // bleu, orange, violet : les mêmes dans les cartes et dans les scènes (convention de la sim 115)
export const COUL = { objet: '#0f172a', image: '#15803d', lentille: '#0369a1', foyer: '#0369a1', axe: '#64748b', ecran: '#94a3b8' };

// d = distance objet–lentille OA (cm), f = distance focale image f′ (cm), h = hauteur AB (cm)
export function construction(d, f = F_PARCOURS, h = H_OBJ) {
  const B = [-d, h];
  // R1 : arrive à la hauteur de B, ressort par F′
  const r1 = { id: 1, avant: [B, [0, h]], yL: h, apres: { p: [0, h], u: [f, -h] } };
  // R2 : droite B–O
  const r2 = { id: 2, avant: [B, [0, 0]], yL: 0, apres: { p: [0, 0], u: [d, -h] } };
  // R3 : droite passant par F ; elle ressort parallèle à l'axe (inexistante si d = f : la droite BF est alors parallèle à la lentille)
  const proche = Math.abs(d - f) < 1e-6;
  const y3 = proche ? null : -h * f / (d - f);                 // hauteur sur la lentille de la droite B–F
  const r3 = proche ? null : { id: 3, avant: [B, [0, y3]], yL: y3, apres: { p: [0, y3], u: [1, 0] } };
  // image : intersection de R1 et R2 après la lentille
  let image = null, nature = 'reelle';
  if (proche) nature = 'infini';
  else {
    const Bp = intersection(r1.apres, r2.apres);
    if (Bp && Bp[0] > 0) image = { A: [Bp[0], 0], B: Bp, OAp: Bp[0], hImg: -Bp[1], gamma: -Bp[1] / h, renversee: Bp[1] < 0 };
    else nature = 'virtuelle';                                // objet entre O et F : les rayons divergent, pas d'image réelle (au-delà du parcours)
  }
  return { d, f, h, O: [0, 0], F: [-f, 0], Fp: [f, 0], A: [-d, 0], B, rayons: [r1, r2, r3].filter(Boolean), r1, r2, r3, image, nature };
}
export const rayonDe = (c, id) => c.rayons.find(r => r.id === id) || null;
export const traversent = c => c.rayons.filter(r => Math.abs(r.yL) <= LENS_H - 0.2);      // rayons qui atteignent vraiment la lentille représentée

// Un rayon est-il bien sur la lentille ?
export const surLentille = r => !!r && Math.abs(r.yL) <= LENS_H - 0.2;

// ---------- grandissement ----------
// Deux façons de le déterminer, qui donnent le même nombre : par les hauteurs (A′B′ ÷ AB) et par Thalès (OA′ ÷ OA)
export const grandissementHauteurs = c => (c.image ? c.image.hImg / c.h : NaN);
export const grandissementThales = c => (c.image ? c.image.OAp / c.d : NaN);

// ---------- tolérances de lecture sur le schéma (carreaux de 1 cm) ----------
export const TOL_LECTURE_DIST = 0.06;       // 6 % : un élève qui lit « à 0,5 cm près » est accepté pour 6 cm ou plus
export const TOL_DEFI = 0.06;

// zone de position de l'objet pour le parcours (qualitatif)
export const zoneObjet = (d, f) => {
  if (d < f - EPS) return 'entre';
  if (Math.abs(d - f) <= EPS) return 'foyer';
  if (d < 2 * f - EPS) return 'proche';          // entre f′ et 2f′ : image agrandie
  if (Math.abs(d - 2 * f) <= EPS) return 'deuxf';
  return 'loin';                                   // au-delà de 2f′ : image plus petite que l'objet
};

// Table des constructions (étape « objet de plus en plus loin »)
export const LIGNES_TABLE = [6, 8, 12, 20, 40];
export const ligneTable = (d, f = F_PARCOURS) => { const c = construction(d, f); return { d, OAp: c.image.OAp, hImg: c.image.hImg, gamma: c.image.gamma }; };

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi 1 « Lire la construction » : f′ et OA tirés ; la hauteur de l'objet est 2,0 cm ; on lit OA′ et A′B′ sur les carreaux
export const CONFIGS_DEFI_LIRE = [
  { f: 2, d: 3 }, { f: 2, d: 6 },
  { f: 3, d: 4.5 }, { f: 3, d: 6 }, { f: 3, d: 9 },
  { f: 4, d: 6 }, { f: 4, d: 8 }, { f: 4, d: 12 },
  { f: 5, d: 10 },
];
export function tirerDefiLire(prec = null) {
  let x;
  do { x = tire(CONFIGS_DEFI_LIRE); } while (prec && x.f === prec.f && x.d === prec.d);
  const c = construction(x.d, x.f);
  return { f: x.f, d: x.d, vraiOAp: c.image.OAp, vraiAB: c.image.hImg, gamma: c.image.gamma };
}
export const reponseDistanceJuste = (vrai, x) => isFinite(x) && Math.abs(x - vrai) <= Math.max(0.5, TOL_LECTURE_DIST * vrai);
export const reponseHauteurJuste = (vrai, x) => isFinite(x) && Math.abs(x - vrai) <= Math.max(0.5, 0.1 * vrai);

// Défi 2 « Calculer le grandissement et la taille de l'image » : par Thalès, A′B′ = AB × OA′ ÷ OA
export const AB_DEFI = [1.5, 2.0, 3.0, 4.0];
export const OA_DEFI = [12, 15, 20, 24, 30];
export const OAP_DEFI = [6, 8, 10, 12, 15, 18];
export function tirerDefiThales(prec = null) {
  let x;
  do {
    const AB = tire(AB_DEFI), OA = tire(OA_DEFI), OAp = tire(OAP_DEFI);
    const variante = tire(['gamma', 'hauteur', 'hauteur']);
    x = { AB, OA, OAp, variante };
    x.gamma = OAp / OA; x.hImg = AB * OAp / OA;
    x.vrai = variante === 'gamma' ? x.gamma : x.hImg;
    x.pieges = [x.AB, x.OA, x.OAp, x.OA / x.OAp, x.AB * x.OA / x.OAp, x.variante === 'gamma' ? x.hImg : x.gamma];
  } while ((prec && x.AB === prec.AB && x.OA === prec.OA && x.OAp === prec.OAp) || Math.abs(x.gamma - 1) < 0.02 || x.pieges.some(p => Math.abs(p - x.vrai) <= 1.5 * TOL_DEFI * x.vrai));
  return x;
}
export const reponseThalesJuste = (d, x) => isFinite(x) && Math.abs(x - d.vrai) <= TOL_DEFI * Math.abs(d.vrai);
