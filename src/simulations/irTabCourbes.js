// Couleurs et courbes de la simulation 170 (fichier séparé : un fichier de composants n'exporte que des composants).
import * as M from './irTabModele';
export const COL = { bleu: '#0b4f94', rouge: '#b91c1c', vert: '#15803d', orange: '#c2410c', gris: '#475569', clair: '#cbd5e1', txt: '#0f172a' };
export const courbe = (mol, nom, style = 'plein', bruit = 0) => ({ nom, style, pts: M.spectre(mol, 4, bruit), mol });
