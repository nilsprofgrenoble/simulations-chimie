// ====================================================
//  Modèle de la simulation « Effet Doppler : mesurer une vitesse » (sim 114, Terminale STL).
//  Hypothèses du modèle (reprises dans le panneau « Hypothèses de travail » de la simulation) :
//   • onde sonore (ultrasons) qui se propage dans l’air à la célérité c, indépendante de la vitesse de l’émetteur (elle ne dépend que du milieu) ;
//   • mouvement rectiligne uniforme, sur la droite qui joint l’émetteur et le récepteur (une seule dimension) ;
//   • récepteur fixe dans le référentiel du laboratoire ; émetteur mobile (montage 1) ou plaque mobile qui renvoie l’onde (montage 2, écho) ;
//   • vitesse très inférieure à c : le décalage se calcule alors par δf = f_e·v/c (émetteur mobile) ou δf = 2·f_e·v/c (écho) ; la valeur exacte est donnée à côté pour juger l’approximation ;
//   • spectre obtenu par transformée de Fourier d’un enregistrement de durée T : pic de largeur ≈ 1/T (fonction sinc²) ;
//   • incertitudes de type B (loi rectangulaire, u = demi-étendue / √3), sources indépendantes.
// ====================================================

export const C_AIR = 340;                 // m/s : célérité du son dans l’air (valeur de la simulation, air vers 15 à 20 °C)
export const DC_AIR = 3;                  // m/s : demi-étendue sur c (température du laboratoire non contrôlée)
export const F_EMETTEURS = [25000, 40000];   // Hz : fréquences des émetteurs ultrasonores disponibles
export const SENS = { approche: 1, eloigne: -1 };

// ---------- émetteur mobile, récepteur fixe ----------
// sens = +1 : l’émetteur se rapproche du récepteur ; −1 : il s’en éloigne
export const frequenceRecue = (fe, v, c, sens) => fe * c / (c - sens * v);
export const decalageExact = (fe, v, c, sens) => Math.abs(frequenceRecue(fe, v, c, sens) - fe);
export const decalageApprox = (fe, v, c) => fe * v / c;                           // formule du programme, v ≪ c
export const vitesseDepuisDecalage = (df, fe, c) => c * df / fe;
// Longueurs d’onde reçues : λ = c / f. Pour un émetteur de vitesse β·c : devant λ(1 − β), derrière λ(1 + β)
export const lambdaAvant = (lambda, beta) => lambda * (1 - beta);
export const lambdaArriere = (lambda, beta) => lambda * (1 + beta);

// ---------- écho sur une plaque mobile (émetteur et récepteur fixes, côte à côte) ----------
// La plaque, mobile, reçoit d’abord une fréquence décalée (récepteur mobile), puis la renvoie comme une source mobile.
export const frequenceEcho = (fe, v, c, sens) => fe * (c + sens * v) / (c - sens * v);
export const decalageEchoExact = (fe, v, c, sens) => Math.abs(frequenceEcho(fe, v, c, sens) - fe);
export const decalageEchoApprox = (fe, v, c) => 2 * fe * v / c;
export const vitesseDepuisEcho = (df, fe, c) => c * df / (2 * fe);

// Écart relatif entre la formule approchée et la valeur exacte (pour discuter la validité de v ≪ c)
export const ecartApprox = (fe, v, c, sens, echo = false) => {
  const ex = echo ? decalageEchoExact(fe, v, c, sens) : decalageExact(fe, v, c, sens);
  const ap = echo ? decalageEchoApprox(fe, v, c) : decalageApprox(fe, v, c);
  return Math.abs(ap - ex) / ex;
};

// ---------- fronts d’onde (vue schématique) ----------
// Unités arbitraires : célérité c = 1, période d’émission T = 1, donc λ = 1. La source part de x0 à la vitesse β·c.
// Retourne les fronts émis avant l’instant t : centre (cx) et rayon (r). Le front n° k est émis à l’instant k·T.
export function fronts({ beta, t, x0 = 0, T = 1, c = 1 }) {
  const L = [];
  for (let k = 0; k * T <= t + 1e-12; k++) {
    const tk = k * T;
    L.push({ k, cx: x0 + beta * c * tk, r: c * (t - tk) });
  }
  return L;
}
// Position de la source à l’instant t
export const positionSource = ({ beta, t, x0 = 0, c = 1 }) => x0 + beta * c * t;

// ---------- spectre (transformée de Fourier d’un enregistrement de durée T) ----------
export const resolution = T => 1 / T;                                    // Hz : largeur du pic
const sinc = x => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
export const intensitePic = (f, fr, T) => sinc(Math.PI * (f - fr) * T) ** 2;
// Deux pics distants de δf sont séparés si δf dépasse leur largeur 1/T (critère de la simulation)
export const separes = (df, T) => df >= resolution(T);

// ---------- incertitudes (type B) ----------
export const uB = demi => demi / Math.sqrt(3);
// Pointé du sommet du pic au curseur : demi-étendue 0,5 Hz (pas du curseur : 1 Hz), ou le quart de la largeur du pic si elle est plus grande
export const demiPointe = T => Math.max(0.5, resolution(T) / 4);
// u(v)/v : u(δf) = √2·u(f) (f_e et f_r sont lues avec le même instrument, la même demi-étendue), u(c) = DC_AIR / √3 ; la relation est proportionnelle à δf et à c
export function incertitudeVitesse({ df, c = C_AIR, T = 1, dc = DC_AIR }) {
  const uf = uB(demiPointe(T)), udf = Math.SQRT2 * uf, uc = uB(dc);
  const rDf = udf / df, rC = uc / c;
  const rel = Math.hypot(rDf, rC);
  return { rel, rDf, rC, udf, uc, part: [rDf ** 2 / rel ** 2, rC ** 2 / rel ** 2] };      // part : fractions de la variance pour δf et c (somme = 1)
}
