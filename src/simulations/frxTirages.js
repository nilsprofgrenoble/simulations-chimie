// Tirages de la simulation 302 : chaque atome irradié est un événement au hasard (touché ou non, ionisé en K ou non, photon X ou électron Auger) ;
// chaque photon X détecté ajoute un coup au spectre. Fonctions pures (le hasard est fourni par `rnd`), testées par frxTirages.test.mjs.
// Hypothèses : seuls les atomes de l'élément étudié (proportion w/100) peuvent être ionisés ; probabilité d'ionisation K de 0,6 pour un photon d'énergie ≥ E_K ;
// rendement de fluorescence K de l'élément (tabulé, `om`) ; sinon effet Auger (aucun photon X) ; Kβ/Kα selon ratioKb ; pics élargis par la résolution du détecteur (SIGMA).
import { ratioKb, SIGMA } from './frxModele.js';

export const P_ION = 0.6;
export const MAX_ATOMES = 20000;
export const XMAX = 12, PAS = 0.1, NBINS = Math.round(XMAX / PAS);
const normale = rnd => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
export const indice = E => { const i = Math.floor(E / PAS); return i >= 0 && i < NBINS ? i : -1; };
export const centre = i => (i + 0.5) * PAS;

// Un atome irradié : w = proportion d'atomes de l'élément (% en nombre, schématique : assimilée à la teneur)
export function atome(el, E, w, rnd) {
  if (rnd() >= w / 100) return { cible: false };
  if (E < el.EK || rnd() >= P_ION) return { cible: true, ion: false };
  if (rnd() >= el.om) return { cible: true, ion: true, voie: 'auger' };
  const r = ratioKb(el), kb = rnd() < r / (1 + r);
  return { cible: true, ion: true, voie: kb ? 'kb' : 'ka', Edet: (kb ? el.Kb : el.Ka) + SIGMA * normale(rnd) };
}
export const etatVide = () => ({ nEnv: 0, nCible: 0, nAutre: 0, nPasIon: 0, nIon: 0, nKa: 0, nKb: 0, nAuger: 0, h: new Array(NBINS).fill(0), dernier: null, lot: 1 });
export function lancer(etat, el, params, k, rnd) {
  const e = { ...etat, h: etat.h.slice(), lot: k };
  for (let j = 0; j < k && e.nEnv < MAX_ATOMES; j++) {
    const a = atome(el, params.E, params.w, rnd); e.nEnv++;
    if (a.cible) e.nCible++; else e.nAutre++;
    if (a.cible && !a.ion) e.nPasIon++;
    if (a.ion) e.nIon++;
    if (a.voie === 'auger') e.nAuger++;
    if (a.voie === 'ka' || a.voie === 'kb') { if (a.voie === 'ka') e.nKa++; else e.nKb++; const i = indice(a.Edet); if (i >= 0) e.h[i]++; }
    e.dernier = a;
  }
  e.lotRes = { n: e.nEnv - etat.nEnv, ion: e.nIon - etat.nIon, ka: e.nKa - etat.nKa, kb: e.nKb - etat.nKb, auger: e.nAuger - etat.nAuger };
  return e;
}
// Comptes attendus par case (pour la courbe de comparaison) : nEnv atomes irradiés
export function attendu(el, params, etat) {
  const out = new Array(NBINS).fill(0);
  if (params.E < el.EK) return out;
  const nRad = etat.nEnv * (params.w / 100) * P_ION * el.om, r = ratioKb(el), pKb = r / (1 + r);
  const dens = (E, c) => Math.exp(-0.5 * ((E - c) / SIGMA) ** 2) / (SIGMA * Math.sqrt(2 * Math.PI));
  for (let i = 0; i < NBINS; i++) { const E = centre(i); out[i] = nRad * ((1 - pKb) * dens(E, el.Ka) + pKb * dens(E, el.Kb)) * PAS; }
  return out;
}
// Probabilités des cinq scénarios possibles pour un photon X : [autre atome, pas d'électron K éjecté, Kα, Kβ, Auger]
export function probas(el, params) {
  const t = params.w / 100, pi = params.E >= el.EK ? P_ION : 0, r = ratioKb(el), rad = t * pi * el.om;
  return [1 - t, t * (1 - pi), rad / (1 + r), rad * r / (1 + r), t * pi * (1 - el.om)];
}
export const scenario = d => (!d ? -1 : !d.cible ? 0 : !d.ion ? 1 : d.voie === 'ka' ? 2 : d.voie === 'kb' ? 3 : 4);
export const partRadiative = el => el.om;
const NB = ' ';
export function texteAtome(d, el, E) {
  if (!d) return 'aucun atome irradié';
  if (!d.cible) return 'photon X sur un atome d’un autre élément : pas de raie de ' + el.nom;
  if (!d.ion) return E < el.EK ? 'photon X d’énergie inférieure au seuil K : aucun électron K éjecté' : 'photon X non absorbé par un électron K : aucun électron K éjecté';
  if (d.voie === 'auger') return 'électron K éjecté, lacune comblée sans photon X (effet Auger : l’énergie éjecte un autre électron)';
  return `électron K éjecté, ${d.voie === 'ka' ? 'un électron L' : 'un électron M'} comble la lacune : photon ${d.voie === 'ka' ? 'Kα' : 'Kβ'} détecté à ${String(d.Edet.toFixed(2)).replace('.', ',')}${NB}keV`;
}

// Légende numérotée qui suit l'animation de l'atome (p : progression de 0 à 1)
export function legendePhase(d, p) {
  if (!d) return 'Cliquez sur « 1 atome » : un photon X va frapper un atome.';
  if (!d.cible) return p < 0.9 ? 'Le photon X traverse l’échantillon sans toucher d’atome de l’élément étudié.' : 'Aucun atome de l’élément touché : rien n’est émis.';
  if (!d.ion) return p < 0.9 ? 'Le photon X passe près de l’atome mais n’éjecte aucun électron K.' : 'Aucun électron K éjecté : aucune raie.';
  if (p < 0.25) return '1. Le photon X arrive sur l’atome.';
  if (p < 0.5) return '2. Il éjecte un électron K : il reste une lacune (cercle pointillé).';
  if (p < 0.75) return d.voie === 'kb' ? '3. Un électron M saute dans la lacune K.' : '3. Un électron L saute dans la lacune K.';
  if (d.voie === 'auger') return '4. L’énergie libérée éjecte un autre électron (effet Auger) : aucun photon X.';
  return `4. L’atome émet un photon X : raie ${d.voie === 'ka' ? 'Kα' : 'Kβ'} (c’est ce photon que détecte l’appareil).`;
}
// Événement imposé pour la démonstration d'un scénario (aucun tirage, aucun comptage)
export const evenementDemo = (sc, el) => [{ cible: false }, { cible: true, ion: false }, { cible: true, ion: true, voie: 'ka', Edet: el.Ka }, { cible: true, ion: true, voie: 'kb', Edet: el.Kb }, { cible: true, ion: true, voie: 'auger' }][sc];
// Scénario « allumé » dans l'encart : il s'allume quand l'animation permet de le reconnaître (Kα ou Kβ à l'étape 3, Auger à l'étape 4)
export const scenarioVisible = (d, p) => { const sc = scenario(d); return sc < 0 ? -1 : sc <= 1 ? (p > 0 ? sc : -1) : sc <= 3 ? (p >= 0.5 ? sc : -1) : (p >= 0.75 ? sc : -1); };
