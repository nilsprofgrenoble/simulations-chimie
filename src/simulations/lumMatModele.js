// Modèle de la simulation 300 « Photons, niveaux d'énergie et domaines spectraux » (BTS MDC, Analyse).
// Constantes du cours : h = 6,63·10⁻³⁴ J·s ; c = 3,00·10⁸ m/s ; 1 eV = 1,60·10⁻¹⁹ J.
export const H = 6.63e-34, CL = 3.00e8, EV = 1.60e-19;
export const HC_EV_NM = H * CL / EV * 1e9;                 // ≈ 1243 eV·nm

export const energieJ = lamNm => H * CL / (lamNm * 1e-9);
export const energieEV = lamNm => energieJ(lamNm) / EV;
export const frequence = lamNm => CL / (lamNm * 1e-9);     // Hz
export const sigmaCm = lamNm => 1e7 / lamNm;               // cm⁻¹
export const lamDeSigma = sig => 1e7 / sig;                 // nm
export const lamDeEV = e => HC_EV_NM / e;                   // nm
export const eVDeSigma = sig => H * CL * sig * 100 / EV;    // sigma en cm⁻¹ → eV

/** Domaines spectraux (longueurs d'onde en nm) et nature de la transition associée. */
export const DOMAINES = [
  { id: 'x', nom: 'Rayons X', min: 0.01, max: 10, transition: 'électrons de cœur' },
  { id: 'uv', nom: 'Ultraviolet', min: 10, max: 400, transition: 'électronique' },
  { id: 'vis', nom: 'Visible', min: 400, max: 780, transition: 'électronique' },
  { id: 'pir', nom: 'Proche infrarouge', min: 780, max: 2500, transition: 'harmoniques de vibration' },
  { id: 'ir', nom: 'Infrarouge moyen', min: 2500, max: 20000, transition: 'vibrationnelle' },
  { id: 'fir', nom: 'IR lointain et micro-ondes', min: 20000, max: 1e8, transition: 'rotationnelle' },
];
export const domaineDe = lamNm => DOMAINES.find(d => lamNm >= d.min && lamNm < d.max) ?? DOMAINES[DOMAINES.length - 1];

/** Molécule schématique : écarts d'énergie typiques (eV). */
export const MOL = { el: 4.0, vib: 0.2, rot: 0.002 };
export const ordresGrandeur = {
  rot: { min: 1e-4, max: 1e-2, txt: '10⁻⁴ à 10⁻² eV', sigma: '1 à 100 cm⁻¹' },
  vib: { min: 0.06, max: 0.5, txt: '0,06 à 0,5 eV', sigma: '500 à 4000 cm⁻¹' },
  el: { min: 1, max: 10, txt: '1 à 10 eV', sigma: '10⁴ à 10⁵ cm⁻¹' },
};

/** Atome d'hydrogène : E_n = −13,6 / n² (eV). Raie n_i → n_f. */
export const niveauH = n => -13.6 / (n * n);
export const raieH = (ni, nf) => lamDeEV(Math.abs(niveauH(ni) - niveauH(nf)));
export const serieH = nf => (nf === 1 ? 'Lyman (UV)' : nf === 2 ? 'Balmer (visible)' : 'Paschen (IR)');

/** Absorbance et transmittance. */
export const absorbance = T => Math.log10(1 / T);
export const transmittance = A => 10 ** (-A);

/** Défis. */
export function tirageDefiIR(rnd) {
  const sigmas = [650, 1050, 1450, 1710, 2250, 2950, 3350];
  const sig = sigmas[Math.floor(rnd() * sigmas.length)];
  return { kind: 'ir', sigma: sig, lamUm: lamDeSigma(sig) / 1000, eV: eVDeSigma(sig) };
}
export function tirageDefiH(rnd) {
  const nf = [1, 2, 3][Math.floor(rnd() * 3)], ni = nf + 1 + Math.floor(rnd() * 3);
  return { kind: 'h', ni, nf, lamNm: raieH(ni, nf) };
}
