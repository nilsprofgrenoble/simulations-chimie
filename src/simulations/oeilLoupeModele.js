// ====================================================
//  Modèle de l'œil emmétrope (« œil réduit ») et de la loupe (TSTL, Ondes : « Des ondes pour observer »).
//  Œil réduit : cristallin + cornée = une lentille mince convergente de distance focale f′ variable (accommodation) ;
//  rétine = écran plan fixe, à L = 17 mm derrière le cristallin. L'œil voit net quand l'image se forme sur la rétine.
//  Œil au repos : f′ = L (l'image d'un objet à l'infini est sur la rétine). Œil qui accommode : f′ diminue.
//  Grandeurs algébriques (axe orienté dans le sens de la lumière, origine au centre optique) : 1/OA′ − 1/OA = 1/f′.
//  Diamètre apparent θ d'un objet AB vu à la distance D : tan θ = AB / D, soit θ ≈ AB / D (petits angles, radian).
//  Loupe : lentille convergente ; objet dans le plan focal objet ⇒ image à l'infini ; G = θ′ / θ = dm / f′ avec dm = 25 cm.
//  Hypothèses : lentille mince, approximation de Gauss, lumière monochromatique, œil réduit emmétrope (pas de défaut de vision),
//  distance minimale de vision distincte dm = 25 cm, pouvoir séparateur de l'œil ε ≈ 3×10⁻⁴ rad (environ 1′, ordre de grandeur).
// ====================================================
import { image as imageLentille } from './lentilleMinceModele.js';

export const L_OEIL = 17.0;          // distance cristallin–rétine (mm)
export const DM_CM = 25;             // distance minimale de vision distincte (cm)
export const EPS = 3e-4;             // pouvoir séparateur de l'œil (rad), ordre de grandeur
export const TOL_RETINE = 0.1;       // l'image est jugée nette sur la rétine à ± 0,1 mm près (mm)
export const FE_MIN = 15.0, FE_MAX = 17.5;      // plage du curseur de la distance focale du cristallin (mm)
export const D_MIN = 25, D_MAX = 300;           // distance œil–objet réglable (cm)
export const AB_OEIL = 20;           // hauteur de l'objet observé à l'œil nu (mm)
export const AB_LOUPE = 0.5;         // hauteur de l'objet observé à la loupe (cm)
export const FL_MIN = 2, FL_MAX = 10, DL_MIN = 1, DL_MAX = 12;   // loupe : focale et position de l'objet (cm)

// ---------- œil ----------
// Distance focale (mm) du cristallin pour voir net un objet à D (mm) ; D = Infinity : œil au repos.
export const focaleOeil = D => (isFinite(D) ? 1 / (1 / L_OEIL + 1 / D) : L_OEIL);
// Position OA′ (mm) de l'image donnée par le cristallin de focale f′ (mm) d'un objet situé à D (mm) devant lui (D > f′).
export const positionImageOeil = (D, f) => (isFinite(D) ? (D * f) / (D - f) : f);
export const grandissementOeil = (D, f) => (isFinite(D) ? positionImageOeil(D, f) / -D : 0);
export const netteRetine = (D, f) => Math.abs(positionImageOeil(D, f) - L_OEIL) <= TOL_RETINE;
// Taille de la tache sur la rétine (mm) pour une pupille de diamètre dp (mm) : rayons marginaux issus d'un point de l'axe
export const tacheRetine = (D, f, dp = 4) => { const p = positionImageOeil(D, f); return dp * Math.abs(L_OEIL - p) / p; };
// Hauteur algébrique de l'image sur la rétine (mm) d'un objet de hauteur AB (mm)
export const hauteurRetine = (D, f, AB = AB_OEIL) => grandissementOeil(D, f) * AB;

// ---------- diamètre apparent ----------
export const diametreApparent = (AB, D) => Math.atan(AB / D);       // exact (rad), AB et D dans la même unité
export const diametreApproche = (AB, D) => AB / D;                  // petits angles (rad)
export const separes = theta => theta >= EPS;                       // deux détails sont vus séparés si θ ≥ ε

// ---------- loupe (cm) ----------
// d = distance objet–loupe (cm, d > 0), f = focale de la loupe (cm)
export const imageLoupe = (d, f) => imageLentille(d, f);
export const thetaPrime = (AB, d) => Math.atan(AB / d);              // œil collé à la loupe : θ′ = angle sous lequel on voit B depuis O
export const thetaNu = AB => Math.atan(AB / DM_CM);                  // objet observé à l'œil nu à 25 cm
export const grossissement = f => DM_CM / f;                         // grossissement commercial G = dm / f′
export const grossissementPosition = d => DM_CM / d;                 // loupe, œil contre la loupe, objet à d (cm) : G = dm / d (= dm / f′ si d = f′)
export const imageALInfini = (d, f) => Math.abs(d - f) <= 0.15;      // l'objet est dans le plan focal objet (à 0,15 cm près)
// L'œil (contre la loupe) peut-il voir net l'image virtuelle ? Il faut |OA′| ≥ dm. Retourne null (trop près), 0 (à l'infini) ou la focale (mm) du cristallin.
export function accommodationPourImage(d, f) {
  const im = imageLoupe(d, f);
  if (!isFinite(im.OAp)) return L_OEIL;
  if (im.OAp > 0) return null;                          // image réelle : l'œil ne la voit pas à travers la loupe
  const D = -im.OAp * 10;                               // mm
  return D < DM_CM * 10 - 1e-9 ? null : focaleOeil(D);
}
// Rayons issus de B (hauteur AB) : R1 parallèle à l'axe puis par F′ ; R2 par O ; R3 par F (si d ≠ f). Coordonnées en cm.
export function rayonsLoupe(d, f, AB = AB_LOUPE) {
  const r1 = { avant: [[-d, AB], [0, AB]], dir: [f, -AB] };
  const r2 = { avant: [[-d, AB], [0, 0]], dir: [d, -AB] };
  const y3 = Math.abs(d - f) < 1e-9 ? null : (AB * f) / (f - d);
  const r3 = y3 == null ? null : { avant: [[-d, AB], [0, y3]], dir: [1, 0] };
  return { r1, r2, r3, y3 };
}
