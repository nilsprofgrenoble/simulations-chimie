// Tirages de la simulation 303 (UV-visible) : des photons de longueur d'onde λ traversent une solution ; chacun est absorbé avec la probabilité 1 − 10^(−A(λ)),
// A(λ) étant l'absorbance de la solution (bande gaussienne du modèle de la simulation, concentration réglée pour que A vaille `amax` au maximum). Le spectre se construit
// en comptant, case par case (5 nm), les photons transmis et envoyés : A estimée = −log10(transmis / envoyés). Fonctions pures, testées par chromoTirages.test.mjs.
// Hypothèses : photons indépendants, une seule absorption par photon, pas de diffusion ni de fluorescence, détecteur parfait, loi de Beer-Lambert (A proportionnelle à ε·l·c).
import { gauss, largeur, LAM_MIN, LAM_MAX, VIS_MIN, VIS_MAX, couleurAbsorbee } from './chromoModele.js';

export const PAS = 5, NBINS = (LAM_MAX - LAM_MIN) / PAS, MAX_PHOTONS = 30000, HC = 1243;
export const indice = l => Math.min(NBINS - 1, Math.max(0, Math.floor((l - LAM_MIN) / PAS)));
export const centre = i => LAM_MIN + (i + 0.5) * PAS;
export const absorbanceA = (l, p) => p.amax * gauss(l, p.lam0, largeur(p.lam0));
export const transmittance = (l, p) => 10 ** -absorbanceA(l, p);
export const domaine = l => (l < VIS_MIN ? 'UV' : l <= VIS_MAX ? 'visible' : 'proche infrarouge');
export const energieEV = l => HC / l;
export function photon(p, rnd) {
  const lam = p.mode === 'choisi' ? p.lamChoisi : LAM_MIN + (LAM_MAX - LAM_MIN) * rnd();
  return { lam, absorbe: rnd() >= transmittance(lam, p) };
}
export const sigDe = p => `${p.lam0}|${p.amax}|${p.mode}`;
export const etatVide = sig => ({ sig, nEnv: 0, nAbs: 0, env: new Array(NBINS).fill(0), tr: new Array(NBINS).fill(0), dernier: null, lot: 1, lotRes: null });
export function lancer(etat, p, k, rnd) {
  const e = { ...(etat.sig === sigDe(p) ? etat : etatVide(sigDe(p))) }; const base = { nEnv: e.nEnv, nAbs: e.nAbs };
  e.env = e.env.slice(); e.tr = e.tr.slice(); e.lot = k;
  for (let j = 0; j < k && e.nEnv < MAX_PHOTONS; j++) {
    const ph = photon(p, rnd), i = indice(ph.lam);
    e.nEnv++; e.env[i]++; if (ph.absorbe) e.nAbs++; else e.tr[i]++;
    e.dernier = ph;
  }
  e.lotRes = { n: e.nEnv - base.nEnv, abs: e.nAbs - base.nAbs };
  return e;
}
// Absorbance estimée dans une case (plafonnée à 2,3 quand aucun photon n'est transmis), ou null si aucun photon envoyé
export const AMAX_AFF = 2.3;
export const absorbanceEstimee = (etat, i) => (etat.env[i] > 0 ? Math.min(AMAX_AFF, -Math.log10(Math.max(etat.tr[i], 0.5) / etat.env[i])) : null);
export const transmittanceCase = (p, i) => { let a = 0; for (let j = 0; j < 5; j++) a += transmittance(LAM_MIN + (i + (j + 0.5) / 5) * PAS, p); return a / 5; };
export const absorbanceCase = (p, i) => Math.min(AMAX_AFF, -Math.log10(transmittanceCase(p, i)));
export const probaTransmis = p => { if (p.mode === 'choisi') return transmittance(p.lamChoisi, p); let a = 0; for (let i = 0; i < NBINS; i++) a += transmittanceCase(p, i); return a / NBINS; };
export const scenario = d => (!d ? -1 : d.absorbe ? 1 : 0);
export const scenarioVisible = (d, p) => (d && p >= 0.4 ? scenario(d) : -1);
export function evenementDemo(sc, p) {
  if (sc === 1) return { lam: p.lam0, absorbe: true };
  const l = p.lam0 + 220 <= LAM_MAX ? p.lam0 + 220 : p.lam0 - 220;
  return { lam: Math.max(LAM_MIN + 5, l), absorbe: false };
}
const f0 = v => String(Math.round(v)), f1 = v => v.toFixed(1).replace('.', ',');
const descr = l => (l >= VIS_MIN && l <= VIS_MAX ? `visible, couleur ${couleurAbsorbee(l)}` : domaine(l));
export function legendePhase(d, p) {
  if (!d) return 'Cliquez sur « 1 photon » : un photon va traverser la solution.';
  if (p < 0.4) return `1. Un photon de longueur d’onde ${f0(d.lam)} nm (${descr(d.lam)}) part de la lampe et arrive sur la solution. Son énergie : ${f1(energieEV(d.lam))} eV.`;
  if (d.absorbe) return p < 0.8 ? '2. Il est absorbé : son énergie est celle d’une transition électronique de la molécule (un électron passe à un niveau d’énergie plus élevé).' : '3. Le photon a disparu : rien n’arrive au détecteur (aucun coup).';
  return p < 0.8 ? '2. Cette énergie ne correspond à aucune transition de la molécule : le photon traverse la solution.' : '3. Le photon arrive au détecteur : un coup est compté.';
}
export const texteEvenement = d => (!d ? 'aucun photon envoyé' : d.absorbe ? `photon de ${f0(d.lam)} nm absorbé : rien n’arrive au détecteur` : `photon de ${f0(d.lam)} nm transmis : un coup au détecteur`);

const ARC = [[380, '#7c3aed'], [440, '#2563eb'], [490, '#06b6d4'], [530, '#22c55e'], [580, '#eab308'], [620, '#f97316'], [700, '#dc2626'], [780, '#7f1d1d']];
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
// couleur de trait d'un photon : couleur du spectre visible ; UV (invisible) en violet foncé, proche IR en brun
export function couleurOnde(l) {
  if (l < 380) return '#4c1d95';
  if (l > 780) return '#7f1d1d';
  let i = 1; while (i < ARC.length - 1 && l > ARC[i][0]) i++;
  const [l0, c0] = ARC[i - 1], [l1, c1] = ARC[i], u = (l - l0) / (l1 - l0), a = hex(c0), b = hex(c1);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * u)).join(',')})`;
}
