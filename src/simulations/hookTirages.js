// Tirages de la simulation 304 (infrarouge) : des photons de nombre d'onde σ traversent l'échantillon ; chacun est absorbé avec la probabilité 1 − T(σ)
// (T = transmittance du spectre schématique) ou transmis jusqu'au détecteur. Le spectre se construit en comptant, case par case, transmis / envoyés.
// Fonctions pures (le hasard est fourni par `rnd`), testées par hookTirages.test.mjs.
// Hypothèses : photons envoyés un par un, sans interaction entre eux ; une seule absorption par photon ; pas de bruit du détecteur ni de diffusion ;
// la probabilité d'absorption suit directement la transmittance schématique ; cases de 25 cm⁻¹ de large.
import * as M from './hookModele.js';

export const SMIN = 500, SMAX = 4000, PAS = 25, NBINS = (SMAX - SMIN) / PAS, MAX_PHOTONS = 30000;
export const indice = s => Math.min(NBINS - 1, Math.max(0, Math.floor((s - SMIN) / PAS)));
export const centre = i => SMIN + (i + 0.5) * PAS;
// bande qui explique le mieux l'absorption à σ
export function bandeDe(mol, s) {
  let best = null, bv = -1;
  for (const b of mol.bandes) { const v = b.prof * Math.exp(-0.5 * ((s - b.sigma) / b.larg) ** 2); if (v > bv) { bv = v; best = b; } }
  return best;
}
export const nomBande = b => (b.lie ? M.liaison(b.lie).nom : 'zone d’empreinte');
export function photon(mol, params, rnd) {
  const sigma = params.mode === 'choisi' ? params.sigma : SMIN + (SMAX - SMIN) * rnd();
  const absorbe = rnd() >= M.transmittance(mol.bandes, sigma);
  return { sigma, absorbe, bande: absorbe ? bandeDe(mol, sigma) : null };
}
export const etatVide = () => ({ nEnv: 0, nAbs: 0, env: new Array(NBINS).fill(0), tr: new Array(NBINS).fill(0), dernier: null, lot: 1, lotRes: null });
export function lancer(etat, mol, params, k, rnd) {
  const e = { ...etat, env: etat.env.slice(), tr: etat.tr.slice(), lot: k };
  let a0 = e.nAbs;
  for (let j = 0; j < k && e.nEnv < MAX_PHOTONS; j++) {
    const p = photon(mol, params, rnd), i = indice(p.sigma);
    e.nEnv++; e.env[i]++; if (p.absorbe) e.nAbs++; else e.tr[i]++;
    e.dernier = p;
  }
  e.lotRes = { n: e.nEnv - etat.nEnv, abs: e.nAbs - etat.nAbs };
  void a0;
  return e;
}
// Transmittance estimée (%) dans une case, ou null si aucun photon envoyé ici
export const estimee = (etat, i) => (etat.env[i] > 0 ? 100 * etat.tr[i] / etat.env[i] : null);
// Transmittance moyenne prévue (%) sur une case de 25 cm⁻¹
export const prevue = (mol, i) => { let a = 0; for (let j = 0; j < 5; j++) a += M.transmittance(mol.bandes, SMIN + (i + (j + 0.5) / 5) * PAS); return 100 * a / 5; };
// Probabilité prévue qu'un photon soit transmis : σ choisi, ou σ tiré uniformément entre 500 et 4000 cm⁻¹
export const probaTransmis = (mol, params) => {
  if (params.mode === 'choisi') return M.transmittance(mol.bandes, params.sigma);
  let a = 0; for (let i = 0; i < NBINS; i++) a += prevue(mol, i) / 100; return a / NBINS;
};
export const scenario = d => (!d ? -1 : d.absorbe ? 1 : 0);
// Événement imposé pour la démonstration d'un scénario : 0 = transmis (σ de transmittance maximale), 1 = absorbé (bande la plus profonde)
export function evenementDemo(sc, mol) {
  if (sc === 1) { const b = mol.bandes.reduce((m, x) => (x.prof > m.prof ? x : m)); return { sigma: b.sigma, absorbe: true, bande: b }; }
  let best = SMIN, bt = -1; for (let s = 2000; s <= 2800; s += 10) { const t = M.transmittance(mol.bandes, s); if (t > bt) { bt = t; best = s; } }
  return { sigma: best, absorbe: false, bande: null };
}
export const scenarioVisible = (d, p) => (d && p >= 0.4 ? scenario(d) : -1);
const f0 = v => String(Math.round(v));
export function legendePhase(d, p) {
  if (!d) return 'Cliquez sur « 1 photon » : un photon infrarouge va traverser l’échantillon.';
  if (p < 0.4) return `1. Un photon de nombre d’onde σ = ${f0(d.sigma)} cm⁻¹ part de la source et arrive sur l’échantillon.`;
  if (d.absorbe) return p < 0.8 ? `2. Il est absorbé : sa fréquence est celle d’une vibration (${nomBande(d.bande)}), la liaison vibre davantage.` : '3. Le photon n’existe plus : rien n’arrive au détecteur (aucun coup).';
  return p < 0.8 ? '2. Aucune vibration de la molécule n’a cette fréquence : le photon traverse l’échantillon.' : '3. Le photon arrive au détecteur : un coup est compté.';
}
export function texteEvenement(d) {
  if (!d) return 'aucun photon envoyé';
  return d.absorbe ? `photon de ${f0(d.sigma)} cm⁻¹ absorbé (${nomBande(d.bande)}) : rien n’arrive au détecteur` : `photon de ${f0(d.sigma)} cm⁻¹ transmis : un coup au détecteur`;
}
