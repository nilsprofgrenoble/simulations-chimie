// ====================================================
//  Modèle de la lunette afocale (TG spé PC, « Ondes et signaux », partie « Former des images »).
//  Objectif = lentille mince convergente (f′obj, grande), oculaire = lentille mince convergente (f′oc, petite).
//  Un point objet « à l'infini » hors de l'axe, vu sous l'angle θ, envoie un faisceau de rayons parallèles inclinés de θ : l'objectif en donne
//  l'image B1 dans son plan focal image, à la hauteur A1B1 = f′obj × tan θ ≈ f′obj × θ (petits angles, θ en radian ; A1 est sur l'axe).
//  Lunette afocale : le foyer image de l'objectif coïncide avec le foyer objet de l'oculaire, donc O1O2 = f′obj + f′oc ; le faisceau émergent est parallèle,
//  incliné de θ′ avec tan θ′ = A1B1 / f′oc ≈ θ′. Grossissement G = θ′ / θ = f′obj / f′oc (petits angles).
//  Hypothèses : lentilles minces, conditions de Gauss, petits angles (tan θ ≈ θ), lumière monochromatique, objet très éloigné, œil au repos non modélisé.
//  Dessin : tracé paraxial exact d'une lunette dont les focales sont dessinées dans le rapport G (plafonné à G_DESSIN_MAX pour rester lisible) et dont
//  tous les angles sont agrandis verticalement d'un facteur Q_VERT (une déformation verticale conserve les foyers, les plans focaux et le rapport des tangentes).
// ====================================================
export const OBJECTIFS = [300, 400, 700, 1000];     // f′obj possibles (mm)
export const OCULAIRES = [10, 25, 50, 100];         // f′oc possibles (mm)
export const THETAS = [0.2, 0.5, 1.0];              // angle θ de l'objet hors axe (degrés)
export const TOL_AFOCAL = 2;                         // mm : écart toléré à O1O2 = f′obj + f′oc (le curseur avance de 1 mm ; 1 mm ≈ 2 px à l'écran, d'où une tolérance de ±2 mm)
export const THETA_P_MAX = 0.35;                     // rad : au-delà, tan θ′ ≈ θ′ est à plus de 4 % près (approximation peu fiable)

export const rad = d => d * Math.PI / 180;
export const deg = r => r * 180 / Math.PI;

// ---------- grandeurs physiques (mm, degrés) ----------
export const dAfocal = (f1, f2) => f1 + f2;                       // O1O2 de la lunette afocale
export const ecart = (d, f1, f2) => d - f1 - f2;                  // écart à la lunette afocale (mm)
export const afocale = (d, f1, f2) => Math.abs(ecart(d, f1, f2)) <= TOL_AFOCAL;
export const natureFaisceau = (d, f1, f2) => (afocale(d, f1, f2) ? 'parallèle' : ecart(d, f1, f2) > 0 ? 'convergent' : 'divergent');
// petits angles (programme)
export const tailleImage = (f1, thetaDeg) => f1 * rad(thetaDeg);                  // A1B1 = f′obj × θ (mm)
export const thetaPrimeDeg = (f1, f2, thetaDeg) => deg(tailleImage(f1, thetaDeg) / f2);   // θ′ = A1B1 / f′oc
export const grossissement = (f1, f2) => f1 / f2;                                  // G = f′obj / f′oc
// valeurs « exactes » (avec les tangentes), pour discuter l'approximation des petits angles
export const tailleImageExacte = (f1, thetaDeg) => f1 * Math.tan(rad(thetaDeg));
export const thetaPrimeExacteDeg = (f1, f2, thetaDeg) => deg(Math.atan(tailleImageExacte(f1, thetaDeg) / f2));
export const grossissementExact = (f1, f2, thetaDeg) => thetaPrimeExacteDeg(f1, f2, thetaDeg) / thetaDeg;
export const petitsAnglesValables = (f1, f2, thetaDeg) => rad(thetaPrimeDeg(f1, f2, thetaDeg)) <= THETA_P_MAX;
export const ecartPetitsAngles = (f1, f2, thetaDeg) => Math.abs(grossissementExact(f1, f2, thetaDeg) - grossissement(f1, f2)) / grossissement(f1, f2);

// ---------- dessin ----------
export const L_DESSIN = 270;          // distance dessinée entre l'objectif et l'oculaire pour la lunette afocale (unités du viewBox)
export const G_DESSIN_MAX = 6;        // rapport maximal des focales dessinées
export const Q_VERT = 9;              // agrandissement vertical des angles
export const X1 = 62;                 // abscisse de l'objectif dans le dessin
export const H_OBJ = 60, H_OCU = 46;  // demi-hauteurs des lentilles dessinées
export const ED_MAX = 46;             // écart maximal dessiné (X1 + F1 + F2 + ED_MAX reste inférieur à 380 pour un cadre de 400)

// bornes du curseur de distance O1O2 : l'écart dessiné reste dans le cadre (même formule que la géométrie)
export const dMin = (f1, f2) => Math.round(f1 + 0.2 * f2);
export const dMax = (f1, f2) => { const Gd = Math.min(f1 / f2, G_DESSIN_MAX), F2 = L_DESSIN / (1 + Gd); return Math.round(f1 + f2 + Math.min(2.5 * f2 + 5, ED_MAX * f2 / F2)); };

// géométrie du dessin pour une lunette (f1, f2 en mm), une distance d (mm) et un angle θ (degrés)
export function geometrie(f1, f2, d, thetaDeg) {
  const G = f1 / f2, Gd = Math.min(G, G_DESSIN_MAX);
  const F1 = L_DESSIN * Gd / (1 + Gd), F2 = L_DESSIN / (1 + Gd);
  const e = ecart(d, f1, f2), ed = Math.max(-0.9 * F2, Math.min(ED_MAX, F2 * e / f2));   // l'écart est dessiné en proportion de f′oc (borné pour que le dessin reste dans le cadre)
  const S = Q_VERT * Math.tan(rad(thetaDeg));                        // pente dessinée des rayons issus du point hors axe
  return { G, Gd, plafonne: G > G_DESSIN_MAX + 1e-9, F1, F2, e, ed, D: F1 + F2 + ed, S };
}
// Rayon du faisceau issu du point hors axe (s0 = −S : il descend) ou de l'axe (s0 = 0), arrivant sur l'objectif à la hauteur h (repère mathématique, y vers le haut).
// Renvoie les points (x, y) du tracé jusqu'à x = xFin, avec x compté depuis l'objectif (x = 0).
export function rayon(g, h, horsAxe, xFin, avecOculaire = true) {
  const s0 = horsAxe ? -g.S : 0;
  const m1 = s0 - h / g.F1;
  const pts = [[-X1, h + s0 * -X1], [0, h]];
  if (!avecOculaire || xFin <= g.D) { pts.push([xFin, h + m1 * xFin]); return pts; }
  const y2 = h + m1 * g.D, m2 = m1 - y2 / g.F2;
  pts.push([g.D, y2], [xFin, y2 + m2 * (xFin - g.D)]);
  return pts;
}
export const pente2 = (g, h, horsAxe) => { const s0 = horsAxe ? -g.S : 0, m1 = s0 - h / g.F1, y2 = h + m1 * g.D; return m1 - y2 / g.F2; };

// ---------- défis ----------
// Fiches de lunettes du commerce : diamètre D de l'objectif / distance focale f′obj (mm), avec le choix d'oculaires livrés (mm)
export const FICHES = [{ D: 70, f: 700 }, { D: 80, f: 400 }, { D: 90, f: 1000 }, { D: 102, f: 900 }, { D: 60, f: 800 }];
export const OCULAIRES_FICHE = [10, 20, 25, 40];
export const TOL_G = 0.05;            // tolérance sur G (arrondi à 2 chiffres significatifs : écart d'au plus ~3 % pour ces valeurs)
export const TOL_F2 = 0.05;
export const tirageFiche = (alea = Math.random) => {
  const fi = FICHES[Math.floor(alea() * FICHES.length)], f2 = OCULAIRES_FICHE[Math.floor(alea() * OCULAIRES_FICHE.length)];
  return { D: fi.D, f1: fi.f, f2, G: grossissement(fi.f, f2) };
};
// (f′obj, f′oc) tels que G = f′obj / f′oc soit un entier (le défi donne G et f′obj, on cherche f′oc entier)
export const COUPLES_OCULAIRE = (() => {
  const c = [];
  [600, 700, 800, 900, 1000].forEach(f1 => [8, 10, 12, 15, 20, 25, 30, 40].forEach(f2 => { const G = f1 / f2; if (Number.isInteger(G) && G >= 15 && G <= 100 && Math.abs(G - f2) / f2 > 0.1) c.push({ f1, f2, G }); }));
  return c;
})();
export const tirageOculaire = (alea = Math.random) => COUPLES_OCULAIRE[Math.floor(alea() * COUPLES_OCULAIRE.length)];
// un G de défi est-il rendu à ≤ tol près par un arrondi à 2 chiffres significatifs ?
export const arrondi2cs = x => Number(Number(x).toPrecision(2));
