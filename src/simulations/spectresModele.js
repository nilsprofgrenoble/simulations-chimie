// ====================================================
//  Modèle de la sim 66 (spectres d'émission) — 2GT, « Ondes et signaux ».
//  Corps chaud = corps noir (loi de Planck), spectre normalisé ; lampes à décharge = raies relevées sur le spectromètre du TP.
//  Hypothèses : voir la liste affichée dans la simulation.
// ====================================================
export { fr } from './forcesModele.js';

const C2 = 1.4388e-2;                       // m·K (hc/k)
export const WIEN = 2.898e6;                // nm·K : λmax × T = constante
export const K0 = 273;                      // °C → K (arrondi du programme)
export const planck = (nm, T) => { const l = nm * 1e-9; return 1 / (Math.pow(l, 5) * (Math.exp(C2 / (l * T)) - 1)); };
export const lambdaMax = Tc => WIEN / (Tc + K0);                 // nm
export const tempDepuisLmax = nm => WIEN / nm - K0;              // °C
// courbe d'intensité relative (0–1) entre xmin et xmax (nm), normalisée à son maximum sur [200 ; 1000]
export function courbeCorps(Tc, xmin = 200, xmax = 1000, pas = 5) {
  const T = Tc + K0; let m = 0; for (let x = 200; x <= 1000; x += 5) m = Math.max(m, planck(x, T));
  const pts = []; for (let x = xmin; x <= xmax; x += pas) pts.push([x, planck(x, T) / m]);
  return pts;
}
export const intensiteCorps = (nm, Tc) => { const T = Tc + K0; let m = 0; for (let x = 200; x <= 1000; x += 5) m = Math.max(m, planck(x, T)); return planck(nm, T) / m; };

// longueur d'onde → couleur écran (algorithme de Bruton), [r,g,b] 0–255 ; hors visible : gris
export function rgbLambda(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else if (nm <= 780) { r = 1; }
  else return [120, 120, 130];
  if (nm < 380) return [120, 120, 130];
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
  return [r, g, b].map(v => Math.round(255 * Math.pow(v * f, 0.8)));
}
export const css = ([r, g, b]) => `rgb(${r},${g},${b})`;

// couleur perçue d'un corps chaud : mélange des radiations visibles pondérées par l'intensité ; luminosité faible vers 500 °C
const REPERES = [[500, [90, 0, 0]], [1000, [200, 30, 0]], [2000, [255, 90, 20]], [3000, [255, 130, 40]], [4500, [255, 190, 90]], [5700, [255, 225, 140]],
  [7000, [255, 245, 225]], [8000, [255, 255, 255]], [9000, [225, 235, 255]], [10000, [170, 200, 255]], [12000, [140, 175, 255]]];
export function couleurCorps(Tc) {
  if (Tc < 500) return { rgb: [40, 40, 45], nom: 'aucune lumière visible', vis: 0 };
  let i = 0; while (i < REPERES.length - 2 && Tc > REPERES[i + 1][0]) i++;
  const [t0, c0] = REPERES[i], [t1, c1] = REPERES[i + 1], u = Math.max(0, Math.min(1, (Tc - t0) / (t1 - t0)));
  return { rgb: c0.map((v, k) => Math.round(v + u * (c1[k] - v))), nom: nomCouleur(Tc), vis: 1 };
}
// classes du cours (Betelgeuse 3000 °C rouge, Soleil 5700 °C jaune, Sirius 8000 °C blanche, Rigel 10000 °C bleue)
export function nomCouleur(Tc) {
  if (Tc < 500) return 'aucune lumière visible';
  if (Tc < 1500) return 'rouge sombre';
  if (Tc < 4000) return 'rouge-orangé';
  if (Tc < 7000) return 'jaune';
  if (Tc < 9000) return 'blanche';
  return 'bleue';
}
export const ETOILES = [
  { id: 'betel', nom: 'Bételgeuse', T: 3000 }, { id: 'soleil', nom: 'le Soleil', T: 5700 },
  { id: 'sirius', nom: 'Sirius', T: 8000 }, { id: 'rigel', nom: 'Rigel', T: 10000 },
];

// lampes à décharge : raies relevées sur les spectrogrammes du TP (nm), intensités relatives approximatives
export const GAZ = [
  { id: 'helium', nom: 'Hélium', raies: [[389.7, 0.15], [447.9, 0.2], [502, 0.3], [588, 1], [667, 0.5], [707.5, 0.35]], etiq: [389.7, 447.9, 502, 667, 707.5] },
  { id: 'sodium', nom: 'Sodium', raies: [[589.3, 1]], etiq: [589.3] },
  { id: 'cadmium', nom: 'Cadmium', raies: [[362.5, 0.15], [468, 0.6], [480, 1], [508, 0.85], [643, 0.5]], etiq: [362.5, 468, 480, 508, 643] },
  { id: 'mercure', nom: 'Mercure', raies: [[346, 0.2], [404.7, 0.5], [435.8, 0.8], [546.1, 1], [577, 0.45], [579, 0.5]], etiq: [346, 404.7, 435.8, 546.1] },
  { id: 'neon', nom: 'Néon', raies: [[585, 0.25], [593, 0.3], [603, 0.25], [609, 0.3], [615, 0.55], [621, 0.3], [626, 0.4], [633, 0.3], [640, 1], [650, 0.35], [660, 0.25], [667, 0.3], [692, 0.3], [704, 0.5], [717, 0.2]], etiq: [615, 640, 704] },
  { id: 'zinc', nom: 'Zinc', raies: [[467.8, 0.8], [472.4, 0.85], [480.7, 1], [636.6, 0.45]], etiq: [467.8, 472.4, 480.7, 636.6] },
];
export const gaz = id => GAZ.find(g => g.id === id);
export function couleurLampe(g) {
  let R = 0, G = 0, B = 0;
  for (const [x, w] of g.raies) { if (x < 400) continue; const c = rgbLambda(x); R += w * c[0]; G += w * c[1]; B += w * c[2]; }
  const m = Math.max(R, G, B) || 1; return [R / m, G / m, B / m].map(v => Math.round(255 * v));
}
// raie visible la plus proche d'une longueur d'onde (nm) à tol près
export function raieProche(g, nm, tol = 4) {
  let best = null; for (const [x] of g.raies) if (Math.abs(x - nm) <= tol && (best == null || Math.abs(x - nm) < Math.abs(best - nm))) best = x; return best;
}

// vue depuis la Terre (classes du cours) ou depuis l'espace : l'atmosphère diffuse surtout le bleu, donc elle « rougit » la lumière.
// Modèle simplifié : depuis l'espace, la couleur correspond à une température apparente plus élevée d'environ 1500 °C (moins pour les étoiles froides).
export const DECALAGE_ATM = T => 1500 * Math.min(1, T / 5700);
export function couleurVue(Tc, terre) { const Te = terre ? Tc : Tc + DECALAGE_ATM(Tc); return { rgb: couleurCorps(Te).rgb, nom: nomCouleur(Te) }; }
// transmission de l'atmosphère (diffusion de Rayleigh, masse d'air 2, soit un astre à 30° au-dessus de l'horizon)
export const transmission = nm => Math.exp(-2 * 0.0088 * Math.pow(nm / 1000, -4.05));
export function courbeCorpsTerre(Tc, xmin = 200, xmax = 1000, pas = 5) { return courbeCorps(Tc, xmin, xmax, pas).map(([x, v]) => [x, v * transmission(x)]); }
