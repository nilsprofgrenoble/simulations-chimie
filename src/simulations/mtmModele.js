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
export const BASES = {
  beige: cv(l => 0.30 + 0.15 * sig(l, 560, 40)),
  gris: cv(() => 0.40),
  brun: cv(l => 0.55 - 0.25 * sig(l, 500, 40)),
};
export const NOMS_BASES = { beige: 'Beige', gris: 'Gris moyen', brun: 'Brun clair' };
/** Amplitude maximale de δ pour s = 1 (réflectance), choisie par base pour que l'écart sous la lampe A soit d'environ 4 à 5 unités de ΔE*ab. */
export const AMPLITUDES = { beige: 0.12, gris: 0.12, brun: 0.17 };
// Le deuxième échantillon E2 est un pigment à courbe LISSE : un fond de 0,05, une marche (bord d'absorption) et deux bosses, c'est-à-dire
// R2 = 0,05 + c1·marche(λ) + c2·bosse1(λ) + c3·bosse2(λ). Les trois coefficients sont calculés pour que X, Y, Z sous D65 soient EXACTEMENT ceux de E1 (système 3 × 3).
// Une paire métamère impose au moins trois croisements des courbes (δ = R2 − R1 est orthogonal aux trois fonctions colorimétriques pondérées par D65) :
// on retient donc, parmi les formes lisses possibles, celles qui se croisent exactement trois fois et qui séparent le plus les deux échantillons sous A.
const croisements = d => { let n = 0, prec = 0; for (const x of d) { if (Math.abs(x) < 2e-4) continue; const sg = Math.sign(x); if (prec && sg !== prec) n++; prec = sg; } return n; };
/** Nombre d'extrema locaux d'une courbe (une courbe de pigment lisse en a peu). */
const extrema = v => { let n = 0; for (let i = 1; i < v.length - 1; i++) if ((v[i] - v[i - 1]) * (v[i + 1] - v[i]) < -1e-9) n++; return n; };
/** Forme δ (max |δ| = 1) de la paire associée à une courbe de base, et ses caractéristiques. */
function chercherDelta(r1, AMPLITUDE) {
  const FOND = 0.05, cibleXYZ = A65.map(r => r.reduce((s, x, i) => s + x * (r1[i] - FOND), 0));
  let meilleur = null;
  for (let c = 420; c <= 660; c += 20) for (const w of [14, 22, 34]) for (let m = 430; m <= 650; m += 20) for (const v of [45, 65]) for (let m2 = m + 80; m2 <= 650; m2 += 20) for (const v2 of [45, 65]) {
    const U = [cv(l => sig(l, c, w)), cv(l => bosse(l, m, v)), cv(l => bosse(l, m2, v2))];
    const Mx = A65.map(r => U.map(u => r.reduce((s, x, i) => s + x * u[i], 0))), det = Mx[0][0] * (Mx[1][1] * Mx[2][2] - Mx[1][2] * Mx[2][1]) - Mx[0][1] * (Mx[1][0] * Mx[2][2] - Mx[1][2] * Mx[2][0]) + Mx[0][2] * (Mx[1][0] * Mx[2][1] - Mx[1][1] * Mx[2][0]);
    if (Math.abs(det) < 1e-4 * Mx.flat().reduce((s, x) => s + Math.abs(x), 0) ** 3 / 27) continue;
    const co = inv3(Mx).map(r => r.reduce((s, v3, j) => s + v3 * cibleXYZ[j], 0));
    if (co.some(x => x < 0.02)) continue; // chaque pigment ajoute de la réflectance (coefficients positifs)
    const r2 = r1.map((_, i) => FOND + co[0] * U[0][i] + co[1] * U[1][i] + co[2] * U[2][i]), dl = r2.map((x, i) => x - r1[i]), mx = Math.max(...dl.map(Math.abs));
    if (mx < 0.03 || mx > 0.6 || croisements(dl) !== 3) continue;
    const d = dl.map(x => x / mx), lo = r1.map((x, i) => x + 2.5 * AMPLITUDE * d[i]);
    if ([0.5, 1, 1.5, 2, 2.5].some(f => extrema(r1.map((x, i) => x + f * AMPLITUDE * d[i])) > 3)) continue;
    if (Math.min(...lo) < 0.03 || Math.max(...lo) > 0.95) continue;
    const r2s = r1.map((x, i) => x + AMPLITUDE * d[i]), e = (ecartSous(r1, r2s, 'A') + 0.5 * ecartSous(r1, r2s, 'F2')) / 1.5;
    if (!meilleur || e > meilleur.e) meilleur = { e, d, c, w, m, v, m2, v2 };
  }
  return meilleur;
}
export const DELTAS = Object.fromEntries(Object.entries(BASES).map(([id, r]) => [id, chercherDelta(r, AMPLITUDES[id])]));
/** Deuxième échantillon : même couleur que `base` sous D65 pour tout s, de plus en plus différent sous les autres lampes quand s augmente (s = 1 : écart de référence). */
export const paire = (base = 'beige', s = 1) => ({ r1: BASES[base], r2: BASES[base].map((x, i) => x + s * AMPLITUDES[base] * DELTAS[base].d[i]) });
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
