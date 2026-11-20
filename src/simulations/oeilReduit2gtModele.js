// ====================================================
//  MODÈLE DE LA SIMULATION 200 « L'ŒIL RÉDUIT : UNE LENTILLE ET UN ÉCRAN » (2GT, « Ondes et signaux », vision et image).
//  Fichier sans React, testé par oeilReduit2gtModele.test.mjs. Prépare la simulation TSTL 117 (mêmes noms : œil réduit, cristallin, rétine, accommodation)
//  et la simulation 1G 115 (OA, OA′, A′B′) sans anticiper la relation de conjugaison.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • œil réduit : une lentille mince convergente (cornée + cristallin, de centre optique O) et un écran fixe (la rétine) à L = 17 mm derrière elle ;
//   • lentille mince, rayons peu inclinés sur l'axe (objet petit ou éloigné), objet plan perpendiculaire à l'axe, lumière d'une seule couleur ;
//   • accommodation : seule la distance focale f′ du cristallin change (de 15,5 à 17,5 mm dans la simulation) ; au repos f′ = 17,0 mm ;
//   • pupille de 4 mm de diamètre ; les rayons « du bord de la pupille » passent à 2 mm de l'axe ;
//   • image jugée nette sur la rétine si le point image est à moins de 0,15 mm de la rétine (tache de moins de 0,04 mm, sous la taille d'une cellule de la rétine à l'échelle de ce modèle) ;
//   • valeurs arrondies d'un œil moyen : l'œil réel mesure environ 24 mm de long, la distance cristallin-rétine vaut environ 17 mm ;
//   • myopie et hypermétropie (exploration seulement) : distance lentille-rétine de 18 mm (œil trop long) ou de 16 mm (œil trop court).
//
//  Calcul interne (jamais affiché en 2GT) : position de l'image d'un objet à la distance D (mm) : OA′ = D × f′ ÷ (D − f′) ;
//  pente d'un rayon après la lentille : pente avant − (hauteur du point d'impact) ÷ f′ (lentille mince, rayons peu inclinés).
//  Les rayons du schéma sont CALCULÉS ici : ils se coupent exactement en B′ (test node, écart < 1e-9).
// ====================================================
import { arrondiSig, nombreFR as nombreFRBase, NB as NBase } from './changementEtat2gtModele.js';

export const NB = NBase;
export { arrondiSig };
export const nombreFR = nombreFRBase;
export const L_OEIL = 17;                    // distance lentille–rétine de l'œil normal (mm)
export const F_REPOS = 17.0;                 // distance focale du cristallin au repos (mm)
export const F_MIN = 15.5, F_MAX = 17.5;     // plage du curseur de focale (mm)
export const DP = 4;                         // diamètre de la pupille (mm)
export const TOL_NETTE = 0.15;               // l'image est nette si le point image est à moins de 0,15 mm de la rétine (mm)
export const DEFAUTS = {
  normal: { id: 'normal', nom: 'œil normal', L: 17 },
  myope: { id: 'myope', nom: 'œil myope (trop long)', L: 18 },
  hypermetrope: { id: 'hypermetrope', nom: 'œil hypermétrope (trop court)', L: 16 },
};

// ---------- objets et situations ----------
export const OBJETS = {
  arbre: { id: 'arbre', nom: 'un arbre', art: 'l’arbre', AB: 6000, hLabel: '6,0 m' },       // hauteur en mm
  bougie: { id: 'bougie', nom: 'une bougie', art: 'la bougie', AB: 40, hLabel: '4,0 cm' },
};
// Situations de l'exploration : distances D en mm ; la pente du rayon central (AB ÷ D) reste ≤ 0,16 (rayons peu inclinés)
export const SITUATIONS = [
  { id: 'arbre50', objet: 'arbre', D: 50000, nom: 'Arbre de 6,0 m à 50 m' },
  { id: 'arbre100', objet: 'arbre', D: 100000, nom: 'Arbre de 6,0 m à 100 m' },
  { id: 'arbre200', objet: 'arbre', D: 200000, nom: 'Arbre de 6,0 m à 200 m' },
  { id: 'bougie25', objet: 'bougie', D: 250, nom: 'Bougie de 4,0 cm à 25 cm' },
  { id: 'bougie40', objet: 'bougie', D: 400, nom: 'Bougie de 4,0 cm à 40 cm' },
  { id: 'bougie100', objet: 'bougie', D: 1000, nom: 'Bougie de 4,0 cm à 1,0 m' },
];
export const situation = id => SITUATIONS.find(s => s.id === id);
export const distanceTexte = Dmm => (Dmm >= 1000 ? `${nombreFR(Dmm / 1000)}${NB}m` : `${nombreFR(Dmm / 10)}${NB}cm`);

// ---------- optique de l'œil réduit (mm) ----------
export const positionImage = (D, f) => (D * f) / (D - f);                       // OA′ : distance lentille–point image (mm)
export const focaleNette = (D, L = L_OEIL) => 1 / (1 / L + 1 / D);               // focale qui donne l'image exactement sur la rétine
export const ecartRetine = (D, f, L = L_OEIL) => positionImage(D, f) - L;        // > 0 : l'image est derrière la rétine ; < 0 : devant
export const netteRetine = (D, f, L = L_OEIL) => Math.abs(ecartRetine(D, f, L)) <= TOL_NETTE;
export const tacheRetine = (D, f, L = L_OEIL, dp = DP) => (dp * Math.abs(L - positionImage(D, f))) / positionImage(D, f);   // diamètre de la tache (mm)
export const hauteurImage = (AB, D, L = L_OEIL) => (AB * L) / D;                 // Thalès : A′B′ = AB × OA′ ÷ OA, avec OA′ = L (image nette sur la rétine) ; AB et D dans la même unité
export const peutAccommoder = (D, L = L_OEIL) => { const f = focaleNette(D, L); return f >= F_MIN - 1e-9 && f <= F_MAX + 1e-9; };

// ---------- rayons (CALCULÉS) ----------
// Origine en O, x le long de l'axe (mm), y vers le haut (mm). Objet AB : A = (−D, 0), B = (−D, AB).
// id : 'centre' (passe par O, point d'impact 0), 'haut' (bord haut de la pupille, +dp/2), 'bas' (bord bas, −dp/2).
export function rayons(AB, D, f, L = L_OEIL, dp = DP) {
  const OAp = positionImage(D, f);
  const un = (id, yl) => {
    const pIn = (yl - AB) / D;                 // pente avant la lentille : de B = (−D, AB) au point d'impact (0, yl)
    const pOut = pIn - yl / f;                 // lentille mince : déviation proportionnelle à la hauteur d'impact
    return { id, yl, pIn, pOut, yAvant: x => yl + pIn * x, yApres: x => yl + pOut * x, y: x => (x <= 0 ? yl + pIn * x : yl + pOut * x) };
  };
  return { OAp, B: [-D, AB], Bp: [OAp, -(AB * OAp) / D], liste: [un('centre', 0), un('haut', dp / 2), un('bas', -dp / 2)], L };
}
// Hauteur d'impact d'un rayon sur la rétine (mm) et position de la tache
export const impactRetine = (r, L = L_OEIL) => r.yApres(L);
// Rayon parallèle à l'axe (vérification géométrique) : sort en passant par F′ = (f, 0)
export const rayonParallele = (yl, f) => ({ yl, pOut: -yl / f, y: x => (x <= 0 ? yl : yl - (yl / f) * x) });

// ---------- affichage ----------
export const mm = (x, d = null) => `${nombreFR(x, d)}${NB}mm`;
export const nb1 = x => nombreFR(arrondiSig(x, 2));

// ---------- défis ----------
export const PENTE_MAX = 0.16;                    // rayons peu inclinés : AB ÷ OA ≤ 0,16 (hypothèse annoncée dans la simulation)
export const paraxial = (AB, D) => AB / D <= PENTE_MAX + 1e-9;   // AB et D dans la même unité
const tireDans = t => t[Math.floor(Math.random() * t.length)];
export const tolDefi = 0.06;
// Défi 1 : taille de l'image sur la rétine (Thalès). Variante 'image' : A′B′ en mm ; variante 'objet' : hauteur de l'objet en m.
const DEFI_OBJETS = [
  { nom: 'un arbre', art: 'l’arbre', AB: [4.0, 5.0, 6.0, 8.0, 10.0], D: [30, 40, 50, 60, 80, 100], unite: 'm' },
  { nom: 'un poteau', art: 'le poteau', AB: [3.0, 4.0, 5.0, 6.0], D: [20, 30, 40, 60], unite: 'm' },
  { nom: 'un immeuble', art: 'l’immeuble', AB: [12, 15, 20, 24, 30], D: [100, 150, 200, 300], unite: 'm' },
];
export const tirerDefiImage = (precedent = null) => {
  let d;
  do {
    const o = tireDans(DEFI_OBJETS), AB = tireDans(o.AB), D = tireDans(o.D), variante = tireDans(['image', 'image', 'objet']);
    if (!paraxial(AB, D)) continue;
    if (variante === 'image') d = { variante, nom: o.nom, art: o.art, AB, D, vrai: hauteurImage(AB * 1000, D * 1000) };       // mm
    else {
      const Ap = arrondiSig(hauteurImage(AB * 1000, D * 1000), 2);                                                          // donnée affichée = donnée du corrigé (mm)
      d = { variante, nom: o.nom, art: o.art, D, Ap, vrai: (Ap * D * 1000) / L_OEIL / 1000 };                               // hauteur en m
    }
  } while (!d || (precedent && d.nom === precedent.nom && d.AB === precedent.AB && d.D === precedent.D && d.Ap === precedent.Ap));
  return d;
};
export const reponseJusteImage = (d, x) => isFinite(x) && Math.abs(x - d.vrai) <= tolDefi * Math.abs(d.vrai);
// Défi 2 : image nette ou floue ? (œil au repos, f′ = 17,0 mm) ; distances choisies hors de la zone ambiguë (1,5 à 3 m)
export const DEFI_DISTANCES = [250, 300, 400, 600, 1000, 6000, 10000, 50000, 100000, 200000];       // mm
export const tirerSituationNette = (precedente = null) => {
  let s;
  do {
    const D = tireDans(DEFI_DISTANCES), o = D >= 37500 ? 'arbre' : 'bougie';
    s = { D, objet: o, nette: netteRetine(D, F_REPOS), fNette: focaleNette(D) };
  } while (precedente && s.D === precedente.D);
  return s;
};
export const verifierSituationNette = (s, rep) => ({ netteOk: rep.nette === (s.nette ? 'oui' : 'non'), actionOk: rep.action === (s.nette ? 'rien' : 'bomber') });
