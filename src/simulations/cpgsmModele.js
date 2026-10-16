// ====================================================
//  MODÈLE DE LA SIMULATION CPG/SM (sim 55) — fonctions pures
//  Séparation : modèle de la CPG (cpgModele.js), sortie de colonne sous vide.
//  Détection : spectromètre de masse, ionisation électronique 70 eV, analyseur quadripolaire en mode balayage.
//  Spectres réels : MassBank (cpgsmSpectres.js). Le courant d'un ion m/z à l'instant t est la somme, pour chaque
//  composé, de (quantité qui sort de la colonne à t) × (part de cet ion dans son spectre), plus le bruit de fond.
//  Courant ionique total (TIC) : somme sur la plage de m/z balayée. Chromatogramme d'ion extrait (EIC) : un seul m/z.
//  Recherche en bibliothèque : produit scalaire pondéré (poids m/z × √intensité), facteur de concordance sur 999.
// ====================================================
import { analyse as analyseCPG, signal, temperature, PARAMS_DEFAUT as P_CPG, PAR_ID, PHASES, ecoulement } from './cpgModele.js';
import { SPECTRES } from './cpgsmSpectres.js';

export const IDS_SM = Object.keys(SPECTRES);
export const PARAMS_DEFAUT = { ...P_CPG, sortie: 'vide', gaz: 'He', mzMin: 29, mzMax: 200, retard: 0, panne: null };
export const MZ_MAX = 300;

// spectre d'un composé : fractions d'ions (somme = 1) indexées par m/z
const FRACTIONS = {};
for (const [id, s] of Object.entries(SPECTRES)) {
  const tot = s.pics.reduce((a, [, i]) => a + i, 0);
  FRACTIONS[id] = s.pics.map(([m, i]) => [m, i / tot]);
}
export const masseNominale = id => Math.round(PAR_ID[id].M);
export function picBase(id) { return SPECTRES[id].pics.reduce((b, q) => q[1] > b[1] ? q : b)[0]; }
export function ionMoleculaire(id) {               // m/z = masse nominale (isotopes majoritaires) et intensité relative
  const M = nominal(id), q = SPECTRES[id].pics.find(([m]) => m === M);
  return { mz: M, rel: q ? q[1] : 0 };
}
// masse nominale avec les isotopes les plus abondants (³⁵Cl pour les chlorés)
const nominal = id => ({ dcm: 84, chcl3: 118 })[id] ?? Math.round(PAR_ID[id].M);

// ---------- pannes ----------
export const PANNES = {
  air: { nom: 'Fuite d’air (raccord, joint)', symptome: 'fond très élevé à m/z 28 et 32 (rapport ≈ 4, celui de l’air), et 44 ; sensibilité plus faible',
    geste: 'Chercher la fuite (raccords de la ligne de transfert, écrou de colonne, joint de la chambre), resserrer ou changer la ferrule, puis contrôler à nouveau l’air et l’eau.' },
  filament: { nom: 'Filament de la source grillé', symptome: 'aucun signal, ni pic ni bruit de fond, alors que la séparation se déroule normalement',
    geste: 'Passer sur le second filament (s’il existe) ou remplacer le filament, puis refaire un réglage automatique (autotune).' },
  source: { nom: 'Source d’ions encrassée', symptome: 'sensibilité très faible et ions lourds affaiblis : les spectres se déforment, les facteurs de concordance baissent',
    geste: 'Nettoyer la source (procédure du constructeur), puis refaire un réglage automatique (autotune).' },
  ressuage: { nom: 'Ressuage de la colonne', symptome: 'fond qui monte avec la température, avec les ions de la phase stationnaire (siloxanes : m/z 73, 207, 281)',
    geste: 'Ne pas dépasser la température maximale de la colonne, vérifier l’absence d’air (qui dégrade la phase), conditionner ou remplacer la colonne.' },
};
const EFFETS = {
  air: { fond: 25, sens: 0.7 },
  filament: { eteint: true },
  source: { sens: 0.2, discr: 60 },
  ressuage: { ress: 12, dT: -80 },
};
const effets = p => (p.panne && EFFETS[p.panne]) || {};

// bruit de fond (unités : même échelle que les pics), en proportion de la hauteur de référence
const FOND_AIR = [[18, 1.0], [28, 0.25], [32, 0.06], [40, 0.004], [44, 0.02]];          // vide correct : surtout de l'eau
const AIR = [[28, 1.0], [32, 0.27], [40, 0.012], [44, 0.01], [14, 0.08], [16, 0.03]];
const SILOXANES = [[73, 0.35], [207, 1.0], [208, 0.2], [209, 0.1], [281, 0.35], [282, 0.08], [355, 0.1]];
const PEG = [[45, 1.0], [89, 0.35], [133, 0.15], [44, 0.3]];

// ---------- analyse ----------
export function analyse(p, ids) {
  const e = effets(p);
  const a = analyseCPG({ ...p, panne: null }, ids);       // séparation identique, détecteur différent
  const pics = a.pics.map(m => ({ ...m, spectre: FRACTIONS[m.id], abond: m.masse * 1000 * (e.sens ?? 1) }));
  const hRef = Math.max(...a.pics.map(m => m.masse * 1000 * hauteurNorm(m)), 1e-9);
  return { ...a, pics, hRef, eff: e, p };
}
const hauteurNorm = m => m.hauteur / m.aire;              // hauteur d'un pic d'aire 1
const forme = (m, t) => m.aire > 0 ? signal(m, t) / m.aire : 0;
// discrimination des ions lourds (source encrassée)
const discr = (e, mz) => e.discr ? Math.exp(-Math.max(0, mz - 40) / e.discr) : 1;

// courant de chaque ion à l'instant t : tableau creux { mz: intensité }
export function ions(an, t) {
  const { eff: e, p } = an;
  const out = {};
  if (e.eteint || t < p.retard) return out;
  an.pics.forEach(m => {
    const f = forme(m, t);
    if (f * m.abond < an.hRef * 1e-5) return;
    m.spectre.forEach(([mz, fr]) => { out[mz] = (out[mz] || 0) + m.abond * f * fr * discr(e, mz); });
  });
  fond(an, t).forEach(([mz, v]) => { out[mz] = (out[mz] || 0) + v; });
  return out;
}
export function fond(an, t) {
  const { eff: e, p } = an, h = an.hRef, res = [];
  if (e.eteint) return res;
  const k = 0.004 * h * (e.sens ?? 1);
  FOND_AIR.forEach(([mz, r]) => res.push([mz, k * r]));
  if (e.fond) AIR.forEach(([mz, r]) => res.push([mz, k * e.fond * r]));
  const T = temperature(p, t), tmax = PHASES[p.phase].tmax + (e.dT || 0);
  const ress = 0.03 * h * (e.ress || 1) * Math.exp((T - tmax) / 30);
  (p.phase === 'polaire' ? PEG : SILOXANES).forEach(([mz, r]) => res.push([mz, ress * r * discr(e, mz)]));
  // petit bruit électronique, déterministe
  const b = 0.0015 * h * (e.sens ?? 1) * (0.6 + 0.4 * Math.sin(t * 337.1));
  res.push([(Math.round(Math.abs(Math.sin(t * 91.3)) * 150) + 30), b]);
  return res;
}
export function tic(an, t) {
  const { mzMin, mzMax } = an.p;
  let s = 0;
  for (const [mz, v] of Object.entries(ions(an, t))) if (mz >= mzMin && mz <= mzMax) s += v;
  return s;
}
export const eic = (an, t, mz) => ions(an, t)[mz] || 0;

// spectre à l'instant t (éventuellement moins le fond pris à tFond), restreint à la plage balayée, normalisé à 100
export function spectreA(an, t, tFond = null) {
  const { mzMin, mzMax } = an.p;
  const a = ions(an, t), b = tFond != null ? ions(an, tFond) : {};
  const pk = [];
  for (const [k, v] of Object.entries(a)) { const mz = +k; if (mz < mzMin || mz > mzMax) continue; const x = v - (b[mz] || 0); if (x > 0) pk.push([mz, x]); }
  const mx = Math.max(...pk.map(q => q[1]), 0);
  if (!(mx > 0)) return [];
  return pk.map(([mz, x]) => [mz, 100 * x / mx]).filter(q => q[1] >= 0.5).sort((x, y) => x[0] - y[0]);
}

// ---------- recherche en bibliothèque ----------
function poids(pk, mzMin, mzMax) {
  const w = {};
  pk.forEach(([mz, i]) => { if (mz >= mzMin && mz <= mzMax && i > 0) w[mz] = mz * Math.sqrt(i); });
  return w;
}
export function concordance(pkA, pkB, mzMin = 1, mzMax = MZ_MAX) {
  const A = poids(pkA, mzMin, mzMax), B = poids(pkB, mzMin, mzMax);
  let ab = 0, aa = 0, bb = 0;
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) { const x = A[k] || 0, y = B[k] || 0; ab += x * y; aa += x * x; bb += y * y; }
  return aa > 0 && bb > 0 ? Math.round(999 * ab * ab / (aa * bb)) : 0;
}
export function rechercheBibliotheque(pk, mzMin, mzMax, n = 5) {
  if (!pk.length) return [];
  return IDS_SM.map(id => ({ id, mf: concordance(pk, SPECTRES[id].pics, mzMin, mzMax) })).sort((x, y) => y.mf - x.mf).slice(0, n);
}

// contrôle « air / eau » : fond à m/z 18, 28, 32, 44 avant l'injection (en % de m/z 18 d'un vide correct)
export function controleAirEau(an) {
  const f = {};
  fond(an, 0).forEach(([mz, v]) => { f[mz] = (f[mz] || 0) + v; });
  const r = mz => (f[mz] || 0) / (0.004 * an.hRef) * 100;
  return { m18: r(18), m28: r(28), m32: r(32), m44: r(44) };
}

export { PAR_ID, PHASES, temperature, ecoulement };
