// ====================================================
//  Modèle de la simulation « Signal sonore : période, fréquence, hauteur et timbre » (2GT).
//  Modèle pur (sans React), testé par signalSonore2gtModele.test.mjs.
//  Un son est représenté par une tension périodique u(t) = A · w((t − dec) / T), où w est un motif de période 1 et de valeur maximale 1.
//  Relations : f = 1 / T (T en s, f en Hz) ; f (Hz) = 1000 / T (ms) ; f (kHz) = 1 / T (ms).
//  Hypothèses : signal supposé parfaitement périodique (un vrai son ne l'est qu'approximativement) ; formes « instruments » schématiques
//  (sommes de quelques harmoniques, sans attaque ni extinction) ; amplitude en volts schématique ; domaines audibles 20 Hz à 20 kHz
//  (valeurs approchées, variables selon la personne et l'âge). Pas de longueur d'onde, pas de niveau en dB (hors programme de ce parcours).
// ====================================================

export const NB = ' ';                                  // espace insécable
export const F_MIN_AUDIBLE = 20, F_MAX_AUDIBLE = 20000;       // Hz
export const F_LA = 440;                                      // Hz : le « la » du diapason
export const F_ECOUTE_MIN = 100, F_ECOUTE_MAX = 8000;         // Hz : plage jouée par le haut-parleur de la simulation

// ----- formes du signal -----
const DEUX_PI = 2 * Math.PI;
const somme = h => phi => h.reduce((s, a, i) => s + a * Math.sin(DEUX_PI * (i + 1) * phi), 0);
// Amplitudes des harmoniques (sin(2π k φ), k = 1, 2, 3…) des « instruments » (schématiques)
export const HARMONIQUES = {
  sinus: [1],
  flute: [1, 0.35, 0.12],
  clarinette: [1, 0, 0.5, 0, 0.3, 0, 0.15, 0, 0.09],
  violon: [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.12],
};
const BRUT = {
  sinus: phi => Math.sin(DEUX_PI * phi),
  triangle: phi => (2 / Math.PI) * Math.asin(Math.sin(DEUX_PI * phi)),
  carre: phi => (phi - Math.floor(phi) < 0.5 ? 1 : -1),
  flute: somme(HARMONIQUES.flute),
  clarinette: somme(HARMONIQUES.clarinette),
  violon: somme(HARMONIQUES.violon),
};
const crete = f => { let m = 0; for (let i = 0; i < 4000; i++) m = Math.max(m, Math.abs(f(i / 4000))); return m; };
const NORME = Object.fromEntries(Object.entries(BRUT).map(([k, f]) => [k, crete(f)]));
export const FORMES = [
  { id: 'sinus', nom: 'Sinus (son pur, comme un diapason)', groupe: 'Signaux simples', court: 'sinus' },
  { id: 'triangle', nom: 'Triangle', groupe: 'Signaux simples', court: 'triangle' },
  { id: 'carre', nom: 'Carré', groupe: 'Signaux simples', court: 'carré' },
  { id: 'flute', nom: 'Flûte (schématique)', groupe: 'Instruments (schématiques)', court: 'flûte' },
  { id: 'clarinette', nom: 'Clarinette (schématique)', groupe: 'Instruments (schématiques)', court: 'clarinette' },
  { id: 'violon', nom: 'Violon (schématique)', groupe: 'Instruments (schématiques)', court: 'violon' },
];
export const forme = id => FORMES.find(f => f.id === id);
// Motif de période 1, valeur maximale 1 (en valeur absolue)
export const motif = (id, phi) => BRUT[id](phi) / NORME[id];
// Tension (V) à l'instant t (même unité que T et dec) pour un signal d'amplitude A
export const tension = (id, A, T, t, dec = 0) => A * motif(id, (t - dec) / T);
// Premier sommet (valeur maximale) du motif sur [0 ; 1[ : sert à poser les repères « de sommet à sommet »
export const phaseSommet = id => { let imax = 0, m = -Infinity; for (let i = 0; i < 4000; i++) { const v = motif(id, i / 4000); if (v > m + 1e-12) { m = v; imax = i; } } return imax / 4000; };

// ----- relations -----
export const frequenceHz = Tms => 1000 / Tms;                 // T en ms → f en Hz
export const periodeMs = fHz => 1000 / fHz;                   // f en Hz → T en ms
export const secondesDepuisMs = ms => ms / 1000;
export const frequenceDepuisSecondes = Ts => 1 / Ts;          // T en s → f en Hz
export const periodeDepuisMotifs = (dureeMs, N) => dureeMs / N;
export function domaine(fHz) { return fHz < F_MIN_AUDIBLE ? 'infrason' : fHz > F_MAX_AUDIBLE ? 'ultrason' : 'audible'; }
export const NOM_DOMAINE = { infrason: 'infrason (inaudible)', audible: 'son audible', ultrason: 'ultrason (inaudible)' };
// Comparaison qualitative avec le « la » du diapason
export function compareLa(fHz) {
  const r = fHz / F_LA;
  if (r > 0.97 && r < 1.03) return 'à peu près la même hauteur que le « la »';
  return r < 1 ? 'plus grave que le « la »' : 'plus aigu que le « la »';
}
export const jouable = fHz => fHz >= F_ECOUTE_MIN && fHz <= F_ECOUTE_MAX;

// ----- échelles de l'écran -----
export const BASES = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];      // base de temps possibles (ms par carreau), 10 carreaux à l'écran
export const PERIODES = [0.025, 0.04, 0.05, 0.08, 0.1, 0.125, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.25, 2, 2.5, 4, 5, 8, 10, 20, 25, 40, 50, 100, 200];   // ms
// Plus petite base de temps qui montre au moins 2,5 motifs à l'écran
export const baseAuto = Tms => BASES.find(b => 10 * b >= 2.5 * Tms - 1e-12) ?? BASES[BASES.length - 1];

// ----- écriture des nombres (virgule française, espaces insécables) -----
export const nbc = (x, cs = 3) => (x === 0 ? '0' : String(Number(Number(x).toPrecision(cs))).replace('.', ','));
export const nbf = (x, d) => Number(x).toFixed(d).replace('.', ',');
export const entier = x => Math.round(x).toLocaleString('fr-FR').replace(/[\u00a0\u202f\u2009]/g, NB);
// Nombre lisible sans notation scientifique : 0,004 ; 250 ; 40 000
export function nbLisible(x, cs = 3) {
  if (!isFinite(x)) return '—';
  const r = Number(Number(x).toPrecision(cs));
  if (Math.abs(r) >= 1000) return entier(r);
  const d = r === 0 ? 0 : Math.max(0, cs - 1 - Math.floor(Math.log10(Math.abs(r))));
  return r.toFixed(Math.min(d, 6)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '').replace('.', ',');
}
// Fréquence affichée : « 250 Hz » ou « 2,5 kHz »
export const fTexte = fHz => (fHz >= 1000 ? `${nbLisible(fHz / 1000, 3)}${NB}kHz` : `${nbLisible(fHz, 3)}${NB}Hz`);

// ----- défis (tirages bornés) -----
const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi « lire T puis calculer f » : la période est un nombre entier de carreaux (2, 4 ou 5), lisible sans ambiguïté
export function tirerDefiLire(prec) {
  for (let essai = 0; essai < 200; essai++) {
    const base = tire([0.1, 0.2, 0.5, 1, 2, 5]), k = tire([2, 4, 5]), T = Number((base * k).toPrecision(6));
    if (prec && prec.base === base && prec.k === k) continue;
    const f = Number((1000 / T).toPrecision(6));
    return { forme: tire(['sinus', 'triangle', 'carre']), base, k, T, f, A: tire([0.4, 0.6, 0.8, 1.0]), dec: Number((T * tire([0, 0.1, 0.2, 0.3, 0.4])).toPrecision(6)), vrai: T };
  }
  return { forme: 'sinus', base: 1, k: 4, T: 4, f: 250, A: 0.8, dec: 0, vrai: 4 };
}
// Défi « régler un signal pour une fréquence donnée » : T cible multiple de 0,05 ms (pas du curseur)
export const CIBLES_F = [100, 125, 200, 250, 400, 500, 800, 1000, 1250, 2000];
export const T_DEPART = 6, T_MIN = 0.2, T_MAX = 12, T_PAS = 0.05;
export function tirerDefiRegler(prec) {
  for (let essai = 0; essai < 200; essai++) {
    const f = tire(CIBLES_F);
    if (prec && prec.f === f) continue;
    return { f, Tvrai: Number((1000 / f).toPrecision(6)) };
  }
  return { f: 250, Tvrai: 4 };
}
export const toleranceRegler = 0.05;
export const ecartRelatif = (fObtenue, fCible) => (fObtenue - fCible) / fCible;
