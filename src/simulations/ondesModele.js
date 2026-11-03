// ====================================================
//  Modèle commun aux simulations « Ondes » de Terminale STL : diffraction (sim 83), puis interférences et réseaux.
//  Hypothèses du modèle (reprises dans le panneau « Hypothèses de travail » de chaque simulation) :
//   • onde monochromatique et cohérente (laser, ou générateur unique dans la cuve) ;
//   • diffraction « à l’infini » (Fraunhofer) pour la lumière : écran à distance D très supérieure à la taille de l’objet ;
//   • objet diffractant idéal : fente infiniment haute, fil parfaitement cylindrique, trou parfaitement circulaire ;
//   • angles petits : θ ≈ λ/a et L = 2λD/a (fente ou fil) ; L = 2,44 λD/d (trou circulaire) ;
//   • cuve à ondes : modèle de Huygens-Fresnel en deux dimensions (somme d’ondelettes émises par l’ouverture), sans amortissement ni réflexion.
// ====================================================

export const RAD = Math.PI / 180;

// ---------- fonctions d’intensité (intensité relative, 1 au centre) ----------
export const sinc = x => (Math.abs(x) < 1e-8 ? 1 : Math.sin(x) / x);
// Fente (ou fil) de largeur a, éclairée par une onde de longueur d’onde λ : sinθ = x / √(x² + D²)
export const intFente = (a, lambda, sinT) => sinc(Math.PI * a * sinT / lambda) ** 2;

// Fonction de Bessel J1 (approximation de Numerical Recipes, erreur < 1e-7)
export function J1(x) {
  const ax = Math.abs(x);
  if (ax < 8) {
    const y = x * x;
    const a = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
    const b = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
    return a / b;
  }
  const z = 8 / ax, y = z * z, xx = ax - 2.356194491;
  const a1 = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
  const a2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
  const r = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a1 - z * Math.sin(xx) * a2);
  return x < 0 ? -r : r;
}
export const PREMIER_ZERO_J1 = 3.8317059702;              // 1,22 π : première extinction d’un trou circulaire
// Trou circulaire de diamètre d : (2 J1(v) / v)², v = π d sinθ / λ (disque d’Airy)
export const intTrou = (d, lambda, sinT) => { const v = Math.PI * d * sinT / lambda; return Math.abs(v) < 1e-8 ? 1 : (2 * J1(v) / v) ** 2; };

// Largeur de la tache centrale sur l’écran (distance entre les deux premières extinctions), formules « à petit angle » du programme
export const largeurFente = (a, lambda, D) => 2 * lambda * D / a;
export const largeurTrou = (d, lambda, D) => 2.44 * lambda * D / d;
// Largeur exacte (sans l’approximation des petits angles) : utile pour tester le domaine de validité
export const largeurFenteExacte = (a, lambda, D) => 2 * D * Math.tan(Math.asin(lambda / a));
// Demi-ouverture angulaire (rad) : θ = λ/a (petits angles) ; valeur exacte asin(λ/a), définie si λ ≤ a
export const thetaPetit = (a, lambda) => lambda / a;
export const thetaExact = (a, lambda) => (lambda <= a ? Math.asin(lambda / a) : Math.PI / 2);
// Retourne la largeur de la tache selon l’objet : 'fente' | 'fil' (même figure d’après le principe de Babinet) | 'trou'
export const largeurTache = (objet, a, lambda, D) => (objet === 'trou' ? largeurTrou(a, lambda, D) : largeurFente(a, lambda, D));
// Inversion : taille a de l’objet à partir de la largeur L mesurée
export const tailleDepuisL = (objet, L, lambda, D) => (objet === 'trou' ? 2.44 : 2) * lambda * D / L;
// Longueur d’onde à partir de a, L et D
export const lambdaDepuisL = (objet, a, L, D) => a * L / ((objet === 'trou' ? 2.44 : 2) * D);

// Intensité sur l’écran en (x, y) (m), écran à D (m)
export function intensiteEcran(objet, a, lambda, D, x, y = 0) {
  if (objet === 'trou') { const r = Math.hypot(x, y); return intTrou(a, lambda, r / Math.hypot(r, D)); }
  return intFente(a, lambda, x / Math.hypot(x, D));
}

// ---------- couleur d’une longueur d’onde (nm) ----------
export function rgbLambda(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 780) { r = 1; }
  let f = 1;
  if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40; else if (nm > 700) f = 0.3 + 0.7 * (780 - nm) / 80;
  return [r, g, b].map(c => Math.pow(Math.max(0, c) * f, 0.8));
}
export const nomCouleur = nm => nm < 450 ? 'violet' : nm < 495 ? 'bleu' : nm < 570 ? 'vert' : nm < 590 ? 'jaune' : nm < 620 ? 'orange' : 'rouge';

// ---------- incertitudes (méthode de type B, hypothèses explicites) ----------
// Chaque grandeur est connue à ± demi-étendue δ ; loi supposée rectangulaire : u = δ / √3. Les sources sont supposées indépendantes.
export const uB = demi => demi / Math.sqrt(3);
// Poids relatifs de L, D et λ dans l’incertitude relative de a = 2 λ D / L (ou 2,44 λ D / d)
export function incertitudeTaille({ a, L, D, lambda, dL, dD, dLambda }) {
  const uL = uB(dL), uD = uB(dD), uLa = uB(dLambda);
  const rL = uL / L, rD = uD / D, rLa = uLa / lambda;
  const rel = Math.sqrt(rL ** 2 + rD ** 2 + rLa ** 2);
  const part = [rL ** 2, rD ** 2, rLa ** 2].map(v => v / (rel ** 2 || 1));
  return { u: a * rel, rel, uL, uD, uLa, part };            // part : fractions de la variance (somme = 1) pour L, D et λ
}
// Compatibilité (critère du programme, 2 u) : |valeur mesurée − valeur de référence| ≤ 2 u
export const compatible = (mes, ref, u) => Math.abs(mes - ref) <= 2 * u;

// ---------- cuve à ondes : modèle de Huygens-Fresnel en deux dimensions ----------
// Onde plane de longueur d’onde λ qui arrive de la gauche sur un mur placé en x = 0, percé d’une ouverture de largeur a (centrée en y = 0).
// Pour x > 0 : amplitude complexe A(x, y) = Σ_j (Δy / √(λ r_j)) e^{i(k r_j − π/4)}, r_j = distance du point à la j-ième ondelette.
// Le champ instantané est Re(A e^{−iωt}). Valeur 1 (module) ≈ amplitude de l’onde incidente.
export function champCuve({ a, lambda, xs, ys, N = 40 }) {
  const k = 2 * Math.PI / lambda, dy = a / N, re = new Float32Array(xs.length * ys.length), im = new Float32Array(re.length);
  const src = Array.from({ length: N }, (_, j) => -a / 2 + (j + 0.5) * dy);
  let idx = 0;
  for (let jy = 0; jy < ys.length; jy++) for (let jx = 0; jx < xs.length; jx++, idx++) {
    const x = xs[jx], y = ys[jy];
    if (x <= 0) continue;
    let sr = 0, si = 0;
    for (let j = 0; j < N; j++) {
      const r = Math.hypot(x, y - src[j]), ph = k * r - Math.PI / 4, w = dy / Math.sqrt(lambda * r);
      sr += w * Math.cos(ph); si += w * Math.sin(ph);
    }
    re[idx] = sr; im[idx] = si;
  }
  return { re, im };
}
// Demi-ouverture de la zone éclairée (rad), pour l’affichage : θ = asin(λ/a) si λ < a
export const demiOuvertureCuve = (a, lambda) => thetaExact(a, lambda);
