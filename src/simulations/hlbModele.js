// Modèle de la simulation 223 « HLB requis et mélange d'émulsifiants » (BTS MDC, Formulation).
// Capacité visée (jamais affichée à l'élève) : évaluer la composition d'un mélange d'émulsifiants par la méthode du RHLB.
// Méthode de Griffin : HLB d'un mélange = moyenne des HLB pondérée par les MASSES ; RHLB d'une phase huileuse = moyenne des RHLB pondérée par les masses.
// Les valeurs tabulées sont des valeurs usuelles de la littérature (± 1 unité selon les sources) : ordres de grandeur annoncés dans les hypothèses.

export const EMULSIFIANTS = [
  { id: 'span85', nom: 'Span 85 (trioléate de sorbitane)', court: 'Span 85', famille: 'non ionique', hlb: 1.8 },
  { id: 'span80', nom: 'Span 80 (monooléate de sorbitane)', court: 'Span 80', famille: 'non ionique', hlb: 4.3 },
  { id: 'span60', nom: 'Span 60 (monostéarate de sorbitane)', court: 'Span 60', famille: 'non ionique', hlb: 4.7 },
  { id: 'span20', nom: 'Span 20 (monolaurate de sorbitane)', court: 'Span 20', famille: 'non ionique', hlb: 8.6 },
  { id: 'tween85', nom: 'Tween 85 (trioléate de sorbitane éthoxylé)', court: 'Tween 85', famille: 'non ionique', hlb: 11.0 },
  { id: 'tween60', nom: 'Tween 60 (monostéarate de sorbitane éthoxylé)', court: 'Tween 60', famille: 'non ionique', hlb: 14.9 },
  { id: 'tween80', nom: 'Tween 80 (monooléate de sorbitane éthoxylé)', court: 'Tween 80', famille: 'non ionique', hlb: 15.0 },
  { id: 'tween20', nom: 'Tween 20 (monolaurate de sorbitane éthoxylé)', court: 'Tween 20', famille: 'non ionique', hlb: 16.7 },
];
// RHLB : valeur requise pour une émulsion H/E (rhlbEH : valeur pour une émulsion E/H, quand elle est tabulée)
export const HUILES = [
  { id: 'vegetale', nom: 'huile végétale (soja, coton)', rhlb: 6 },
  { id: 'minerale', nom: 'huile minérale (paraffine liquide)', rhlb: 10, rhlbEH: 4 },
  { id: 'lanoline', nom: 'lanoline anhydre', rhlb: 12, rhlbEH: 8 },
  { id: 'ipm', nom: 'myristate d’isopropyle', rhlb: 11.5 },
  { id: 'cetylique', nom: 'alcool cétylique', rhlb: 15 },
  { id: 'stearique', nom: 'acide stéarique', rhlb: 15 },
];
export const emulsifiant = id => EMULSIFIANTS.find(e => e.id === id);
export const huile = id => HUILES.find(h => h.id === id);

// RHLB d'une phase huileuse : compo = [{ rhlb, m }] (masses dans une même unité)
export function rhlbMelange(compo) {
  const M = compo.reduce((s, c) => s + c.m, 0);
  return M > 0 ? compo.reduce((s, c) => s + c.rhlb * c.m, 0) / M : NaN;
}
// HLB d'un mélange de deux émulsifiants A et B ; xA = fraction massique de A dans le mélange d'émulsifiants
export const hlbMelange = (hlbA, hlbB, xA) => xA * hlbA + (1 - xA) * hlbB;
// Fraction massique de A pour obtenir la cible ; null si la cible est hors de [min, max] (impossible avec ces deux émulsifiants)
export function fractionA(hlbA, hlbB, cible) {
  if (hlbA === hlbB) return null;
  const x = (cible - hlbB) / (hlbA - hlbB);
  return x >= -1e-9 && x <= 1 + 1e-9 ? Math.min(1, Math.max(0, x)) : null;
}
// « Croix de Griffin » : parts de A et de B (sans normaliser) pour une cible entre les deux HLB, A le plus hydrophile : parts A = cible − HLB_B ; parts B = HLB_A − cible
export const croix = (hlbA, hlbB, cible) => ({ partsA: cible - hlbB, partsB: hlbA - cible });
export const masses = (xA, mTotal) => ({ mA: xA * mTotal, mB: (1 - xA) * mTotal });

// Stabilité (qualitative, 0 à 1) d'une émulsion selon l'écart entre le HLB du mélange et le RHLB de l'huile : maximale quand ils sont égaux.
export const LARGEUR = 2.0;
export const stabilite = (hlb, rhlb) => Math.exp(-(((hlb - rhlb) / LARGEUR) ** 2));
// Rayon moyen illustratif des gouttes après préparation (µm) : fin quand HLB ≈ RHLB, plus gros sinon (0,8 à 6 µm)
export const rayonGouttes = (hlb, rhlb) => 0.8 + 5.2 * (1 - stabilite(hlb, rhlb));
export const verdictHLB = (hlb, rhlb, tol = 0.5) => (Math.abs(hlb - rhlb) <= tol ? 'adapte' : hlb < rhlb ? 'trop-lipophile' : 'trop-hydrophile');
// Domaines d'emploi usuels (Griffin) : repères qualitatifs
export const typeEmulsion = hlb => (hlb < 3 ? 'antimousse (hors émulsion)' : hlb < 7 ? 'émulsion E/H' : hlb < 8 ? 'zone intermédiaire (mouillant)' : hlb <= 18 ? 'émulsion H/E' : 'solubilisant');

// ---------- Défis ----------
const choix = (L, r) => L[Math.floor(r() * L.length) % L.length];
const arr1 = x => Math.round(x * 10) / 10;
// Défi « composition » : phase huileuse de deux huiles, deux émulsifiants encadrant le RHLB ; on demande le HLB du mélange visé puis la fraction massique de l'émulsifiant hydrophile
export function tirageComposition(r = Math.random) {
  for (let essai = 0; essai < 200; essai++) {
    const [h1, h2] = [choix(HUILES, r), choix(HUILES, r)];
    if (h1.id === h2.id) continue;
    const m1 = choix([30, 40, 50, 60, 70, 80], r), m2 = choix([10, 20, 30, 40, 50], r);
    const rhlb = arr1(rhlbMelange([{ rhlb: h1.rhlb, m: m1 }, { rhlb: h2.rhlb, m: m2 }]));
    const A = choix(EMULSIFIANTS.filter(e => e.hlb > rhlb + 1), r), B = choix(EMULSIFIANTS.filter(e => e.hlb < rhlb - 1), r);
    if (!A || !B) continue;
    const x = fractionA(A.hlb, B.hlb, rhlb);
    if (x == null || x < 0.1 || x > 0.9) continue;
    const mEmul = choix([4, 5, 6, 8, 10], r);
    return { h1, h2, m1, m2, rhlb, A, B, x, pctA: x * 100, mA: x * mEmul, mB: (1 - x) * mEmul, mEmul };
  }
  throw new Error('tirage impossible');
}
// Défi « diagnostic » : émulsion H/E d'une huile donnée, mélange utilisé (HLB trop faible ou trop élevé) : que faire ?
export function tirageDiagnosticHLB(r = Math.random) {
  const h = choix(HUILES, r), sens = choix([-1, 1], r);
  const ecart = choix([2, 3, 4], r) * sens, hlb = arr1(h.rhlb + ecart);
  if (hlb < 2 || hlb > 17) return tirageDiagnosticHLB(r);
  return { huile: h, hlb, rhlb: h.rhlb, verdict: verdictHLB(hlb, h.rhlb) };
}
export const REMEDE_HLB = { 'trop-lipophile': 'ajouter de l’émulsifiant plus hydrophile (HLB plus élevé)', 'trop-hydrophile': 'ajouter de l’émulsifiant plus lipophile (HLB plus faible)', adapte: 'rien : le HLB du mélange est adapté' };
