// Simulation « Éclairage, réflectance et métamérisme » (BTS MDC, Aspect). Modèle : couleurModele.js (CIE 1931 2°, illuminants D65, A, F2 au pas de 10 nm).
// Les courbes de réflectance sont des courbes ILLUSTRATIVES (pigments imaginaires), pas des mesures.
import * as C from './couleurModele.js';
import { LAMBDA, ILLUMINANTS } from './couleurDonnees.js';

export const NB = LAMBDA.length, SOURCES = ['D65', 'A', 'F2'];
export const NOMS_SOURCES = { D65: 'Lumière du jour (D65)', A: 'Lampe à incandescence (A)', F2: 'Tube fluorescent blanc (F2)' };
const sig = (l, c, w) => 1 / (1 + Math.exp(-(l - c) / w));
const bosse = (l, c, w) => Math.exp(-(((l - c) / w) ** 2));
const cv = f => LAMBDA.map(f);
export const fam = {
  blanc: (niv = 0.9) => cv(() => niv),
  noir: (niv = 0.04) => cv(() => niv),
  bleu: (d = 0) => cv(l => 0.05 + 0.5 * (1 - sig(l, 510 + d, 18))),
  vert: (d = 0) => cv(l => 0.05 + 0.45 * bosse(l, 540 + d, 45)),
  jaune: (d = 0) => cv(l => 0.06 + 0.85 * sig(l, 505 + d, 12)),
  rouge: (d = 0) => cv(l => 0.05 + 0.85 * sig(l, 590 + d, 12)),
};
export const OBJETS = { blanc: fam.blanc(), noir: fam.noir(), bleu: fam.bleu(), vert: fam.vert(), jaune: fam.jaune(), rouge: fam.rouge() };
export const NOMS_OBJETS = { blanc: 'Blanc', noir: 'Noir', bleu: 'Bleu', vert: 'Vert', jaune: 'Jaune', rouge: 'Rouge' };
/** Source (distribution spectrale relative, 100 à 560 nm) */
export const spd = id => ILLUMINANTS[id].map(v => v / ILLUMINANTS[id][LAMBDA.indexOf(560)] * 100);
/** Lumière renvoyée : source × réflectance, longueur d'onde par longueur d'onde. */
export const renvoyee = (refl, id) => spd(id).map((v, i) => v * refl[i]);
export const labSous = (refl, id) => C.lab(C.xyz(refl, id), C.blancDe(id));
export const ecartSous = (r1, r2, id) => C.deltaE76(labSous(r1, id), labSous(r2, id));
export const couleurSous = (refl, id) => C.cssObjet(refl, id);

// ---------- paires métamères : R2 = R1 + s·δ, δ dans le noyau de la matrice (x̄, ȳ, z̄) × D65 ----------
import { XBAR, YBAR, ZBAR } from './couleurDonnees.js';
const A65 = [XBAR, YBAR, ZBAR].map(t => t.map((v, i) => v * ILLUMINANTS.D65[i]));
function inv3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m, det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [[(e * i - f * h), (c * h - b * i), (b * f - c * e)], [(f * g - d * i), (a * i - c * g), (c * d - a * f)], [(d * h - e * g), (b * g - a * h), (a * e - b * d)]].map(r => r.map(v => v / det));
}
/** Retire d'un vecteur sa partie « visible » : ce qui reste ne change ni X, ni Y, ni Z sous D65. */
function noyau(v) {
  const G = A65.map(r => A65.map(q => r.reduce((s, x, i) => s + x * q[i], 0))), Gi = inv3(G), Av = A65.map(r => r.reduce((s, x, i) => s + x * v[i], 0));
  const coef = Gi.map(r => r.reduce((s, x, j) => s + x * Av[j], 0));
  return v.map((x, i) => x - A65.reduce((s, r, j) => s + coef[j] * r[i], 0));
}
const norme = v => { const m = Math.max(...v.map(Math.abs)); return v.map(x => x / m); };
export const BASES = {
  beige: cv(l => 0.30 + 0.15 * sig(l, 560, 40)),
  gris: cv(() => 0.40),
  brun: cv(l => 0.55 - 0.25 * sig(l, 500, 40)),
};
export const NOMS_BASES = { beige: 'Beige', gris: 'Gris moyen', brun: 'Brun clair' };
export const AMPLITUDE = 0.10;
/** Forme δ (max |δ| = 1) choisie parmi des sinusoïdes de périodes différentes : celle qui sépare le plus les deux échantillons sous la lampe A. */
export const DELTA = (() => {
  let meilleur = null;
  for (const P of [80, 100, 120, 150, 200, 260]) for (const ph of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
    const d = norme(noyau(cv(l => Math.cos(2 * Math.PI * (l - 380) / P + ph)))), r1 = BASES.beige, r2 = r1.map((x, i) => x + AMPLITUDE * d[i]);
    if (Math.min(...r2) < 0.03 || Math.max(...r2) > 0.97) continue;
    const e = ecartSous(r1, r2, 'A') + 0.5 * ecartSous(r1, r2, 'F2');
    if (!meilleur || e > meilleur.e) meilleur = { e, d, P, ph };
  }
  return meilleur.d;
})();
/** Deuxième échantillon : même couleur que `base` sous D65 pour tout s, de plus en plus différent sous les autres lampes quand s augmente. */
export const paire = (base = 'beige', s = 1) => ({ r1: BASES[base], r2: BASES[base].map((x, i) => x + s * AMPLITUDE * DELTA[i]) });
export const PAIRE = paire('beige', 1);

// ---------- défis ----------
const choix = (rnd, t) => t[Math.floor(rnd() * t.length)];
export const FAMILLES = ['bleu', 'vert', 'jaune', 'rouge', 'blanc', 'noir'];
/** Défi « courbe de réflectance → couleur de l'objet sous la lumière du jour ». */
export function tirageCouleur(rnd) {
  const famille = choix(rnd, FAMILLES), d = (rnd() - 0.5) * 30, niv = 0.85 + rnd() * 0.08, nivN = 0.02 + rnd() * 0.02;
  const refl = famille === 'blanc' ? fam.blanc(niv) : famille === 'noir' ? fam.noir(nivN) : fam[famille](d);
  return { famille, refl };
}
/** Défi « métamères ou non » : deux courbes, écarts ΔE*ab sous D65 et sous A. */
export function tirageMetamere(rnd) {
  const cas = choix(rnd, ['meta', 'identiques', 'differentes']);
  const base = choix(rnd, Object.keys(BASES));
  let r1 = BASES[base], r2;
  if (cas === 'meta') r2 = paire(base, 0.8 + rnd() * 0.2).r2;
  else if (cas === 'identiques') r2 = r1.slice();
  else { r1 = BASES[base]; r2 = r1.map(x => x * (0.7 + rnd() * 0.1)); }
  return { cas, r1, r2, eD65: ecartSous(r1, r2, 'D65'), eA: ecartSous(r1, r2, 'A') };
}
