// Petits outils de dessin partagés par les scènes et les cartes de la simulation « Synthèse additive et soustractive ».
import { LAMBDAS } from "./synthCouleurModele";

const K = { txt: '#0f172a' };
const NB = ' ';
export const pc = v => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}${NB}%`;
export const Tx = (x, y, s, o = {}) => <text x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" stroke={o.halo ?? 'none'} strokeWidth={o.halo ? 2.4 : 0} paintOrder="stroke" strokeLinejoin="round">{s}</text>;
export const aLambda = (arr, l) => arr[LAMBDAS.indexOf(l)] ?? 0;
export const CANAUX = [{ l: 450, nom: 'bleu', col: '#2563eb' }, { l: 540, nom: 'vert', col: '#16a34a' }, { l: 620, nom: 'rouge', col: '#dc2626' }];
export const COLX = [100, 195, 290];
