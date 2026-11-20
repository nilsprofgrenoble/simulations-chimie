// ====================================================
//  GÉOMÉTRIE DU MONTAGE À REFLUX de la simulation 204 « Synthèse d'une espèce naturelle : montage à reflux et CCM » (2GT).
//  Fichier sans React, testé par syntheseReflux2gtGeometrie.test.mjs : le schéma (SyntheseReflux2gtScenes.jsx) est DESSINÉ À PARTIR de ces coordonnées,
//  jamais « à la main » : les points d'attache des légendes sont sur les pièces qu'elles nomment, aucune étiquette ne chevauche une autre ni le matériel,
//  l'eau entre par le BAS du réfrigérant et sort par le HAUT, le haut du tube intérieur est ouvert à l'air (sauf défaut simulé), les vapeurs montent et les gouttes retombent.
//  Schéma non à l'échelle (annoncé dans la simulation) : viewBox de 480 de large, légendes de 19 unités (≥ 18, lisibles à 390 px).
// ====================================================

export const VB = { w: 480, h: 460 };
export const FS = 19;             // taille des légendes (unités du viewBox)
export const LH = 22;             // interligne
export const CARAC = 0.56;        // largeur moyenne d'un caractère en gras = CARAC × FS (estimation prudente, vérifiée au navigateur)

export const CX = 235;            // axe du ballon et du réfrigérant
export const GEO = {
  potence: { x: 28, y0: 36, y1: 428, base: { x: 8, y: 428, w: 92, h: 12 }, sol: 440 },
  ballon: { cx: CX, cy: 322, r: 50, colG: 218, colD: 252, colY: 214, niveau: 326 },       // sphère + col ; niveau : ordonnée de la surface du mélange
  chauffe: { cx: CX, cy: 322, r: 60, boite: { x: 193, y: 382, w: 84, h: 58 }, bouton: { cx: CX, cy: 410, r: 11 } },
  refrig: { jaq: { x: 211, y: 44, w: 48, h: 132 }, tube: { x: 224, y: 20, w: 22, h: 216 }, yHaut: 62, yBas: 158, xTuyauFin: 330 },  // tube : du haut ouvert (y = 20) au pied dans le col (y = 236)
  pinceBallon: { y: 250, x0: 210, x1: 260 },        // pince sur le col du ballon
  pinceRefrig: { y: 100, x0: 205, x1: 265 },        // pince sur la gaine du réfrigérant
  pierre: [[218, 356], [236, 361], [252, 354]],     // grains de pierre ponce
};
// Hauteurs de la surface du mélange et sommet du ballon : cohérents avec la sphère (test)
export const sphereY = (x, g = GEO.ballon) => g.cy - Math.sqrt(g.r * g.r - (x - g.cx) ** 2);

// ---------- pièces nommées (formes simples pour les tests de recouvrement et de point d'attache) ----------
// { type: 'rect', x, y, w, h } ou { type: 'cercle', cx, cy, r } ; une pièce peut être posée ou non (la pièce « refrigerant » regroupe réfrigérant, tuyaux et pince du réfrigérant)
const R = (x, y, w, h) => ({ type: 'rect', x, y, w, h });
const C = (cx, cy, r) => ({ type: 'cercle', cx, cy, r });
export const FORMES = {
  support: [R(GEO.potence.x - 3, GEO.potence.y0, 6, GEO.potence.y1 - GEO.potence.y0), R(GEO.potence.base.x, GEO.potence.base.y, GEO.potence.base.w, GEO.potence.base.h)],
  chauffe: [C(GEO.chauffe.cx, GEO.chauffe.cy, GEO.chauffe.r), R(GEO.chauffe.boite.x, GEO.chauffe.boite.y, GEO.chauffe.boite.w, GEO.chauffe.boite.h)],
  ballon: [C(GEO.ballon.cx, GEO.ballon.cy, GEO.ballon.r), R(GEO.ballon.colG, GEO.ballon.colY, GEO.ballon.colD - GEO.ballon.colG, 60)],
  pince: [R(GEO.pinceBallon.x0, GEO.pinceBallon.y - 6, GEO.pinceBallon.x1 - GEO.pinceBallon.x0, 12)],
  refrigerant: [R(GEO.refrig.jaq.x, GEO.refrig.jaq.y, GEO.refrig.jaq.w, GEO.refrig.jaq.h), R(GEO.refrig.tube.x, GEO.refrig.tube.y, GEO.refrig.tube.w, GEO.refrig.tube.h)],
  tuyauHaut: [R(259, GEO.refrig.yHaut - 5, GEO.refrig.xTuyauFin - 259, 10)],
  tuyauBas: [R(259, GEO.refrig.yBas - 5, GEO.refrig.xTuyauFin - 259, 10)],
  melange: [R(GEO.ballon.cx - 49, GEO.ballon.niveau, 98, 44)],
  pierre: GEO.pierre.map(([x, y]) => C(x, y, 6)),
  tubeHaut: [R(GEO.refrig.tube.x, GEO.refrig.tube.y, GEO.refrig.tube.w, 6)],
  vapeurs: [R(238, 120, 4, 86)],
  gouttes: [R(225, 188, 8, 24)],
};
// Distance d'un point à une forme (0 si le point est dedans ou sur le bord)
export function distance(p, f) {
  if (f.type === 'cercle') return Math.max(0, Math.abs(Math.hypot(p[0] - f.cx, p[1] - f.cy) - f.r));
  const dx = Math.max(f.x - p[0], 0, p[0] - (f.x + f.w)), dy = Math.max(f.y - p[1], 0, p[1] - (f.y + f.h));
  return Math.hypot(dx, dy);
}
export const distancePiece = (p, id) => Math.min(...FORMES[id].map(f => distance(p, f)));

// ---------- légendes ----------
// yc : ordonnée du centre de la légende ; x : bord de départ (start) ou d'arrivée (end) du texte ; ancre : point sur la pièce ; la ligne de rappel va du bord du texte à l'ancre
export const LEGENDES = {
  ballon: { lignes: ['ballon'], x: 306, a: 'start', yc: 282, ancre: [CX + 30, 282], piece: 'ballon' },
  chauffe: { lignes: ['chauffe-ballon'], x: 304, a: 'start', yc: 372, ancre: [CX + 33.2, 372], piece: 'chauffe' },
  refrigerant: { lignes: ['réfrigérant', 'à eau'], x: 284, a: 'start', yc: 110, ancre: [259, 110], piece: 'refrigerant' },
  sortie: { lignes: ['sortie d’eau'], x: 340, a: 'start', yc: 62, ancre: [322, 62], piece: 'tuyauHaut' },
  entree: { lignes: ['entrée d’eau'], x: 340, a: 'start', yc: 158, ancre: [322, 158], piece: 'tuyauBas' },
  support: { lignes: ['support'], x: 42, a: 'start', yc: 408, ancre: [31, 408], piece: 'support' },
  pince: { lignes: ['pince'], x: 204, a: 'end', yc: 228, ancre: [GEO.pinceBallon.x0 + 2, 247], piece: 'pince' },
  melange: { lignes: ['mélange', 'réactionnel'], x: 170, a: 'end', yc: 330, ancre: [205, 340], piece: 'melange' },
  pierre: { lignes: ['pierre ponce'], x: 170, a: 'end', yc: 380, ancre: [GEO.pierre[0][0] - 4.2, GEO.pierre[0][1] - 4.2], piece: 'pierre' },
  air: { lignes: ['ouvert à l’air'], x: 205, a: 'end', yc: 22, ancre: [GEO.refrig.tube.x, 24], piece: 'tubeHaut' },
  vapeurs: { lignes: ['vapeurs'], x: 205, a: 'end', yc: 150, ancre: [240, 150], piece: 'vapeurs' },
  gouttes: { lignes: ['gouttes'], x: 205, a: 'end', yc: 196, ancre: [226, 196], piece: 'gouttes' },
};
export const IDS_LEGENDES = Object.keys(LEGENDES);
export const TEXTE_LEGENDE = id => LEGENDES[id].lignes.join(' ');
export const largeurLigne = t => Math.ceil(t.length * CARAC * FS);
// Boîte englobante estimée d'une légende
export function boite(id) {
  const L = LEGENDES[id], w = Math.max(...L.lignes.map(largeurLigne)), n = L.lignes.length, h = n * LH;
  const x0 = L.a === 'start' ? L.x : L.x - w;
  return { x0, x1: x0 + w, y0: L.yc - h / 2, y1: L.yc + h / 2 };
}
// Baselines des lignes de texte d'une légende
export const baselines = id => { const L = LEGENDES[id], n = L.lignes.length; return L.lignes.map((_, i) => L.yc + (i - (n - 1) / 2) * LH + 6.5); };
// Point de départ de la ligne de rappel (côté du texte tourné vers la pièce)
export const departRappel = id => { const L = LEGENDES[id], b = boite(id); return [L.a === 'start' ? b.x0 - 3 : b.x1 + 3, L.yc]; };

// Légendes montrées selon les pièces présentes (jamais une légende pour une pièce absente)
export function legendesVisibles(montage, voulues) {
  const present = { ballon: montage.ballon, chauffe: montage.chauffe, support: montage.support, pince: montage.pince, refrigerant: montage.refrigerant, sortie: montage.refrigerant && montage.eau !== 'aucune',
    entree: montage.refrigerant && montage.eau !== 'aucune', melange: montage.ballon, pierre: montage.ballon && montage.pierre, air: montage.refrigerant && !montage.bouchon,
    vapeurs: montage.refrigerant && montage.marche, gouttes: montage.refrigerant && montage.marche };
  return voulues.filter(id => present[id]);
}
// Où se trouvent l'entrée et la sortie d'eau : avec « bas » (correct) l'entrée est au tuyau du bas ; avec « haut » c'est l'inverse
export const tuyaux = montage => (montage.eau === 'haut' ? { entree: 'haut', sortie: 'bas' } : { entree: 'bas', sortie: 'haut' });
export function ancreEntreeSortie(montage) {
  const t = tuyaux(montage), y = p => (p === 'haut' ? GEO.refrig.yHaut : GEO.refrig.yBas);
  return { entree: [322, y(t.entree)], sortie: [322, y(t.sortie)] };
}
// Pour les légendes « entrée » et « sortie » : ordonnée réelle selon le sens de l'eau
export function legendesAjustees(montage) {
  const a = ancreEntreeSortie(montage), L = { ...LEGENDES };
  L.entree = { ...L.entree, ancre: a.entree, yc: a.entree[1] };
  L.sortie = { ...L.sortie, ancre: a.sortie, yc: a.sortie[1] };
  return L;
}

// ---------- carte « À retenir » (viewBox 300) : le même dessin réduit ----------
export const CARTE = { w: 300, h: 362, s: 0.5, dx: 65, dy: 6 };     // transformation : x' = dx + s·x ; y' = dy + s·y
export const APPAREIL = { x0: 8, x1: 332, y0: 4, y1: 441 };      // cadre du matériel dans le viewBox du schéma (hors légendes)
export const versCarte = ([x, y]) => [CARTE.dx + CARTE.s * x, CARTE.dy + CARTE.s * y];
