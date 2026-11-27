// Modèle de la simulation 318 « Pouvoir rotatoire, loi de Biot et excès énantiomérique » (terminale STL, SPCL, Chimie et développement durable, séquence 9).
// Un composé chiral en solution fait tourner le plan de polarisation d'une lumière polarisée : pouvoir rotatoire α (en degrés), mesuré au polarimètre.
// Loi de Biot : α = [α] × L × C, avec [α] le pouvoir rotatoire spécifique (°·dm⁻¹·g⁻¹·mL), L la longueur de la cuve (dm) et C la concentration massique (g/mL).
// Un mélange de deux énantiomères (+) et (−) de même [α] en valeur absolue : les pouvoirs rotatoires s'ajoutent (α = α₊ + α₋), avec α₊ = +|[α]|·L·C₊ et α₋ = −|[α]|·L·C₋.
// Excès énantiomérique : ee = |n₊ − n₋| / (n₊ + n₋) × 100 ; pour un mélange de fraction p de (+), ee = |2p − 1| × 100 et α = ee_algébrique × α(pur (+)).
import * as M from './filtreModele.js';

export const NB = M.NB, nbf = M.nbf;
// composés (valeurs indicatives arrondies : un énantiomère a [α] = +A, l'autre −A, dans les conditions de l'étude)
export const SUBS = {
  camphre: { id: 'camphre', nom: 'camphre', A: 44, M: 152 },
  menthol: { id: 'menthol', nom: 'menthol', A: 50, M: 156 },
  carvone: { id: 'carvone', nom: 'carvone', A: 60, M: 150 },
};
export const LISTE = ['camphre', 'menthol', 'carvone'];
export const L_PAS = 0.5, L_MIN = 0.5, L_MAX = 5;   // longueur de cuve (dm)
export const C_PAS = 0.01, C_MIN = 0.02, C_MAX = 0.3; // concentration (g/mL)

const r = (x, k) => Math.round(x * 10 ** k) / 10 ** k;
export const arrondiL = x => Math.min(L_MAX, Math.max(L_MIN, Math.round(x / L_PAS) * L_PAS));
export const arrondiC = x => r(Math.min(C_MAX, Math.max(C_MIN, Math.round(x / C_PAS) * C_PAS)), 2);
export const arrondiP = x => r(Math.min(1, Math.max(0, Math.round(x * 20) / 20)), 2);   // fraction de (+), au pas de 5 %

// ---------- loi de Biot ----------
export const alphaPur = (sub, L, C) => sub.A * L * C;                    // α de l'énantiomère (+) pur
export const alphaMel = (sub, L, C, p) => sub.A * L * C * (2 * p - 1);   // α d'un mélange de fraction p de (+)
export const eeDe = p => Math.abs(2 * p - 1) * 100;                      // excès énantiomérique (%)
export const majoritaire = p => (p > 0.5 + 1e-9 ? '+' : p < 0.5 - 1e-9 ? '−' : null);
export const cDepuisAlpha = (alpha, A, L) => alpha / (A * L);            // concentration (g/mL) d'un énantiomère pur
export const eeDepuisAlpha = (alpha, alphaP) => Math.abs(alpha) / Math.abs(alphaP) * 100;
export const pDepuisEE = (ee, signe) => (signe > 0 ? 0.5 + ee / 200 : 0.5 - ee / 200);   // fraction de (+) pour un ee donné (signe = énantiomère en excès)
export const sensDe = alpha => (alpha > 1e-9 ? 'dextrogyre' : alpha < -1e-9 ? 'lévogyre' : 'inactif');
export const fmtDeg = (a, k = 1) => (Math.abs(a) < 0.5 * 10 ** -k ? nbf(0, k) : (a > 0 ? '+' : '') + nbf(a, k));

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// défi 1 : retrouver la concentration d'une solution d'un énantiomère pur à partir de α lu sur le polarimètre
export function tirageDefiC() {
  for (let k = 0; k < 300; k++) {
    const sub = SUBS[tire(LISTE)], L = tire([1, 2, 2.5]), C = tire([0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25]), signe = tire([1, -1]);
    const alpha = r(signe * alphaPur(sub, L, C), 2);
    if (Math.abs(alpha) >= 1.5 && Math.abs(alpha) <= 40) return { sub, L, signe, alpha, vrai: cDepuisAlpha(Math.abs(alpha), sub.A, L), C };
  }
  return null;
}
// défi 2 : excès énantiomérique d'un mélange à partir de α (même cuve, même concentration totale)
export function tirageDefiEE() {
  for (let k = 0; k < 300; k++) {
    const sub = SUBS[tire(LISTE)], L = tire([1, 2, 2.5]), C = tire([0.06, 0.08, 0.1, 0.12, 0.15, 0.2]), signe = tire([1, -1]);
    const p = tire([0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9]), pp = signe > 0 ? p : 1 - p;
    const alpha = r(alphaMel(sub, L, C, pp), 2), alphaP = r(alphaPur(sub, L, C), 2);
    if (Math.abs(alpha) >= 0.8) return { sub, L, C, p: pp, signe, alpha, alphaP, vrai: eeDepuisAlpha(alpha, alphaP), ee: eeDe(pp) };
  }
  return null;
}
const TOL = 0.05;
const eg = (a, b, t = TOL) => Math.abs(a - b) <= t * Math.abs(b) + 1e-12;
export function diagC(d, v) {
  if (!Number.isFinite(v)) return { ok: false, msg: 'Saisissez un nombre (la concentration en g/mL, avec une virgule ou un point).' };
  if (eg(v, d.vrai)) return { ok: true, msg: '' };
  if (v < 0) return { ok: false, msg: 'Une concentration est toujours positive : α et [α] ont ici le même signe, leur quotient est positif.' };
  if (eg(v, d.vrai / 10, 0.1)) return { ok: false, msg: `Votre valeur est 10 fois trop petite : avez-vous utilisé la longueur de la cuve en centimètres (${d.L * 10}) au lieu de la convertir en décimètres (${nbf(d.L, 1)} dm) ?` };
  if (eg(v, d.vrai * 10, 0.1)) return { ok: false, msg: 'Votre valeur est 10 fois trop grande : la longueur L doit être exprimée en décimètres, pas en centimètres.' };
  const calc = `C = α ÷ ([α] × L) = ${nbf(Math.abs(d.alpha), 2)} ÷ (${d.sub.A} × ${nbf(d.L, 1)})`;
  return { ok: false, msg: `Votre valeur (${nbf(v, 3)} g/mL) est trop ${v > d.vrai ? 'grande' : 'petite'}. Refaites le calcul avec la loi de Biot : ${calc}, en prenant la valeur absolue de α.` };
}
export function diagEE(d, v) {
  if (!Number.isFinite(v)) return { ok: false, msg: 'Saisissez un nombre (l’excès énantiomérique en %).' };
  if (v > 0 && eg(v, d.vrai)) return { ok: true, msg: '' };
  if (v < 0) return { ok: false, msg: 'Un excès énantiomérique est toujours positif (c’est une valeur absolue) : le signe de α indique seulement quel énantiomère est en excès.' };
  if (v > 100) return { ok: false, msg: 'Un excès énantiomérique ne peut pas dépasser 100 % : il vaut 100 % pour un énantiomère pur.' };
  if (v > 0 && v <= 1 + 1e-9 && eg(v * 100, d.vrai)) return { ok: false, msg: 'Votre valeur est une fraction : l’excès énantiomérique demandé s’exprime en pourcentage (multipliez par 100).' };
  return { ok: false, msg: `Votre valeur (${nbf(v, 0)} %) est trop ${v > d.vrai ? 'grande' : 'petite'}. Comparez α mesuré à α de l’énantiomère pur : ee = |α| ÷ |α pur| × 100.` };
}
