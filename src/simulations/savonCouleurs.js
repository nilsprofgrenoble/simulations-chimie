// Couleurs et générateur pseudo-aléatoire de la simulation 158 (Savons et amphiphilie). Bleu = tête polaire, orange = chaîne apolaire.
import { COUL } from "./tensioactifsCouleurs";

export const C = { tete: COUL.tete, queue: COUL.queue, eau: '#bae6fd', eauPale: '#e0f2fe', huile: '#fde68a', huileBord: '#d97706', encre: '#0f172a', gris: '#475569', clair: '#cbd5e1', vert: '#15803d', rouge: '#b91c1c' };

// générateur pseudo-aléatoire à graine : mêmes dessins à chaque affichage
export function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
