// Sphère des couleurs (représentation SCHÉMATIQUE de l'espace L*a*b*, comme les manuels) : L* de 0 (pôle bas, noir) à 100 (pôle haut, blanc),
// rayon R en a* et b* à l'équateur (L* = 50). Les couleurs réelles d'un écran forment un solide irrégulier : la sphère sert de repère, pas de limite physique.
import { srgbAffichable } from './couleurModele.js';

export const R = 60;
/** Rayon du disque de coupe à la luminosité L (section de la sphère). */
export const rayonDisque = L => R * Math.sqrt(Math.max(0, 1 - ((L - 50) / 50) ** 2));
const css = c => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
/** Maillage de la sphère : nf tranches de latitude, nt méridiens ; chaque sommet porte sa couleur (approchée si hors écran). */
export function maillage(nf = 24, nt = 48) {
  const x = [], y = [], z = [], col = [], I = [], J = [], K = [];
  for (let i = 0; i <= nf; i++) for (let j = 0; j < nt; j++) {
    const f = Math.PI * i / nf, t = 2 * Math.PI * j / nt, a = R * Math.sin(f) * Math.cos(t), b = R * Math.sin(f) * Math.sin(t), L = 50 + 50 * Math.cos(f);
    x.push(a); y.push(b); z.push(L); col.push(css(srgbAffichable({ L, a, b })));
  }
  const id = (i, j) => i * nt + (j % nt);
  for (let i = 0; i < nf; i++) for (let j = 0; j < nt; j++) { I.push(id(i, j), id(i, j + 1)); J.push(id(i + 1, j), id(i + 1, j)); K.push(id(i, j + 1), id(i + 1, j + 1)); }
  return { x, y, z, col, I, J, K };
}
