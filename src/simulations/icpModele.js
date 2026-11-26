// Modèle de la simulation 314 : spectrométrie d'émission à plasma d'argon (ICP). Fonctions pures, testées par icpModele.test.mjs.
// Ordres de grandeur arrondis, annoncés dans le panneau d'hypothèses.
import { HC, KB } from './flammeModele.js';
export const T_FLAMME = 2500, T_PLASMA = 6500, T_MIN = 2000, T_MAX = 9000;
// raies atomiques de résonance (nm) ; g : rapport g*/g0 (ordre de grandeur) ; Ei : énergie de première ionisation (eV) ; gi : facteur statistique de l'équilibre d'ionisation (ordre de grandeur)
export const RAIES = [
  { s: 'Zn', nom: 'zinc', lam: 213.9, g: 3, Ei: 9.39, gi: 4 }, { s: 'Cd', nom: 'cadmium', lam: 228.8, g: 3, Ei: 8.99, gi: 4 }, { s: 'Fe', nom: 'fer', lam: 248.3, g: 3, Ei: 7.90, gi: 2 },
  { s: 'Pb', nom: 'plomb', lam: 283.3, g: 3, Ei: 7.42, gi: 4 }, { s: 'Mg', nom: 'magnésium', lam: 285.2, g: 3, Ei: 7.65, gi: 4 }, { s: 'Cu', nom: 'cuivre', lam: 324.8, g: 2, Ei: 7.73, gi: 1 },
  { s: 'Ca', nom: 'calcium', lam: 422.7, g: 3, Ei: 6.11, gi: 4 }, { s: 'Na', nom: 'sodium', lam: 589.0, g: 3, Ei: 5.14, gi: 1 }, { s: 'K', nom: 'potassium', lam: 766.5, g: 3, Ei: 4.34, gi: 1 },
];
export const LAM_MIN = 200, LAM_MAX = 800, PAS = 2, NBINS = (LAM_MAX - LAM_MIN) / PAS;
export const raie = s => RAIES.find(r => r.s === s);
export const energieEV = lam => HC / lam;
export const indice = l => Math.min(NBINS - 1, Math.max(0, Math.floor((l - LAM_MIN) / PAS)));
export const centre = i => LAM_MIN + (i + 0.5) * PAS;
// proportion d'atomes libres excités : Boltzmann, bornée par f/(1+f) quand la population excitée n'est plus négligeable
export const fraction = (r, T) => { const f = r.g * Math.exp(-energieEV(r.lam) / (KB * T)); return f / (1 + f); };
export const pourDixMille = (r, T) => 1e4 * fraction(r, T);
// ionisation (équilibre de Saha, densité électronique 10²¹ m⁻³ dans le plasma, 10¹⁷ m⁻³ dans une flamme) : seuls les atomes neutres émettent la raie atomique
export const NE = T => (T < 4000 ? 1e17 : 1e21);
export const fractionNeutre = (r, T) => { const S = 2.415e21 * T ** 1.5 * r.gi * Math.exp(-r.Ei / (KB * T)); return 1 / (1 + S / NE(T)); };
// échantillon type : éléments à la même concentration (1 mg/L) ; poids d'une raie = c × atomes neutres × proportion excitée
export const ECH = ['Na', 'Ca', 'Mg', 'Cu', 'Fe', 'Zn'];
export const poidsRaie = (r, T) => fractionNeutre(r, T) * fraction(r, T);
export const poids = (T, liste = ECH) => liste.map(s => ({ s, w: poidsRaie(raie(s), T) }));
export const totalPoids = (T, liste = ECH) => poids(T, liste).reduce((a, x) => a + x.w, 0);
export const partRelative = (s, T, liste = ECH) => poidsRaie(raie(s), T) / totalPoids(T, liste);
// intensité relative d'une raie par rapport à celle du sodium à 2 500 K (référence 100)
export const intensiteRel = (s, T) => 100 * poidsRaie(raie(s), T) / poidsRaie(raie('Na'), T_FLAMME);
// tirage d'un photon détecté : élément choisi avec la probabilité de sa part d'intensité, longueur d'onde légèrement étalée (largeur 0,3 nm)
export function photon(T, rnd, liste = ECH) {
  const P = poids(T, liste), tot = P.reduce((a, x) => a + x.w, 0); let u = rnd() * tot, el = P[P.length - 1];
  for (const x of P) { if (u < x.w) { el = x; break; } u -= x.w; }
  const r = raie(el.s), g = Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  return { s: el.s, lam: r.lam + 0.3 * g };
}
export const etatVide = T => ({ T, n: 0, h: new Array(NBINS).fill(0), dernier: null, lot: 1, par: {} });
export const MAX_PHOTONS = 20000;
export function lancer(etat, T, k, rnd, liste = ECH) {
  const e = { ...(etat.T === T ? etat : etatVide(T)), h: (etat.T === T ? etat : etatVide(T)).h.slice(), par: { ...(etat.T === T ? etat.par : {}) } };
  e.lot = k;
  for (let j = 0; j < k && e.n < MAX_PHOTONS; j++) { const ph = photon(T, rnd, liste); e.n++; e.h[indice(ph.lam)]++; e.par[ph.s] = (e.par[ph.s] ?? 0) + 1; e.dernier = ph; }
  return e;
}
// gamme dynamique : signal ICP proportionnel à c sur plusieurs décades ; absorbance de la SAA (cuivre, flamme air-acétylène) linéaire jusqu'à environ 10 mg/L
export const signalICP = c => 1000 * c / (1 + c / 5000);
export const absorbanceSAA = c => 0.15 * 0.85 * c / (1 + c / 30);
export const plageICP = [0.001, 1000], plageSAA = [0.05, 10];
export const horsPlageSAA = c => c > plageSAA[1];
// dispersion par un réseau : sin θ = k·λ / a (ordre 1) ; réseau de 1200 traits/mm (a = 0,8333 µm), incidence normale → angle en degrés
export const angleReseau = lam => Math.asin(Math.min(1, lam * 1e-3 / 0.8333)) * 180 / Math.PI;
export function tirageDefiRaie(rnd) { const pick = a => a[Math.floor(rnd() * a.length)]; const r = pick(RAIES), autres = RAIES.filter(x => x.s !== r.s).sort(() => rnd() - 0.5).slice(0, 3); return { r, choix: [r, ...autres].sort(() => rnd() - 0.5) }; }
export function tirageDefiDosage(rnd) {
  const pick = a => a[Math.floor(rnd() * a.length)], r = pick(RAIES.filter(x => ['Zn', 'Cu', 'Fe', 'Mg', 'Pb', 'Cd'].includes(x.s)));
  const cEt = pick([0.5, 1, 2, 5, 10]), IEt = pick([2000, 5000, 10000, 20000]), cEch = +(cEt * pick([0.2, 0.3, 0.4, 0.6, 0.8, 1.5, 2.5])).toPrecision(2);
  return { r, cEt, IEt, I: Math.round(IEt * cEch / cEt), vrai: cEch };
}
