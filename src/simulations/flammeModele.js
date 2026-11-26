// Modèle de la simulation 313 : atomes dans une flamme, émission (SEF) et absorption (SAA). Fonctions pures, testées par flammeModele.test.mjs.
// Ordres de grandeur arrondis, annoncés dans le panneau d'hypothèses : aucune valeur n'est une donnée de référence d'appareil.
export const HC = 1239.84, KB = 8.617e-5;               // h·c en eV·nm ; constante de Boltzmann en eV/K
export const FLAMMES = [
  { id: 'propane', nom: 'air-propane', T: 2200, tC: 1900 },
  { id: 'acetylene', nom: 'air-acétylène', T: 2500, tC: 2200 },
  { id: 'protoxyde', nom: 'protoxyde d’azote-acétylène', T: 3000, tC: 2700 },
];
// lam : raie de résonance (nm) ; g : rapport g*/g0 des poids statistiques ; beta : fraction d'atomes libres pour [propane, air-acétylène, N₂O-acétylène] (valeurs illustratives, Ca et Mg sont réfractaires) ;
// k : absorbance par mg/L pour tous les atomes libres ; cmax : fin de la plage d'étalonnage (mg/L)
export const ELEMENTS = [
  { s: 'Na', nom: 'sodium', Z: 11, lam: 589.0, g: 3, beta: [0.90, 0.95, 0.99], k: 0.45, cmax: 5 },
  { s: 'Li', nom: 'lithium', Z: 3, lam: 670.8, g: 3, beta: [0.90, 0.95, 0.95], k: 0.15, cmax: 10 },
  { s: 'K', nom: 'potassium', Z: 19, lam: 766.5, g: 3, beta: [0.90, 0.95, 0.95], k: 0.11, cmax: 10 },
  { s: 'Ca', nom: 'calcium', Z: 20, lam: 422.7, g: 3, beta: [0.10, 0.35, 0.85], k: 0.09, cmax: 10 },
  { s: 'Cu', nom: 'cuivre', Z: 29, lam: 324.8, g: 2, beta: [0.50, 0.85, 0.90], k: 0.15, cmax: 10 },
  { s: 'Mg', nom: 'magnésium', Z: 12, lam: 285.2, g: 3, beta: [0.30, 0.60, 0.90], k: 1.2, cmax: 1 },
];
export const element = s => ELEMENTS.find(e => e.s === s);
export const flamme = id => FLAMMES.find(f => f.id === id);
export const iFlamme = id => FLAMMES.findIndex(f => f.id === id);
export const energieEV = lam => HC / lam;
export const beta = (el, fl) => el.beta[iFlamme(fl)];
// Fraction d'atomes libres excités thermiquement : loi de Boltzmann g*/g0 · exp(−E/kT)
export const fractionExcitee = (el, T) => el.g * Math.exp(-energieEV(el.lam) / (KB * T));
export const pourDixMille = (el, T) => 1e4 * fractionExcitee(el, T);
// Absorbance : proportionnelle à la concentration et aux atomes libres, avec une légère courbure aux fortes concentrations
export const absorbance = (el, fl, c) => el.k * beta(el, fl) * c / (1 + c / (3 * el.cmax));
export const transmittance = (el, fl, c) => 10 ** -absorbance(el, fl, c);
export const probaAbsorbe = (el, fl, c) => 1 - transmittance(el, fl, c);
// Intensité d'émission en unités arbitraires : 100 pour 1 mg/L de sodium dans la flamme air-acétylène ; autoabsorption aux fortes concentrations
const REF = beta(element('Na'), 'acetylene') * fractionExcitee(element('Na'), 2500);
export const emission = (el, fl, c) => 100 * c * beta(el, fl) * fractionExcitee(el, flamme(fl).T) / REF / (1 + c / (3 * el.cmax));
export const lectureCoul = lam => (lam < 380 ? 'ultraviolet (invisible)' : lam > 780 ? 'infrarouge (invisible)' : 'visible');
// Étalonnage : points (c, signal) d'une gamme, signal par la fonction demandée
export const gamme = (el, n = 5) => Array.from({ length: n }, (_, i) => +(el.cmax * (i + 1) / n).toFixed(2));
export const signal = (methode, el, fl, c) => (methode === 'absorption' ? absorbance(el, fl, c) : emission(el, fl, c));
// Concentration inverse à partir de la droite d'étalonnage passant par l'origine, calculée sur le premier point de la gamme
export const concDepuisDroite = (methode, el, fl, S) => { const c1 = el.cmax / 5, a = signal(methode, el, fl, c1) / c1; return S / a; };
// Instantané de N atomes libres : chacun est excité avec la probabilité de Boltzmann
export function instantane(el, T, N, rnd) { const f = fractionExcitee(el, T), ex = []; for (let i = 0; i < N; i++) if (rnd() < f) ex.push(i); return ex; }
// Étapes du trajet de l'échantillon dans la flamme
export const ETAPES_TRAJET = [
  { id: 'nebul', nom: 'Nébulisation', texte: 'La solution est aspirée et pulvérisée en fines gouttelettes (aérosol).' },
  { id: 'desolv', nom: 'Désolvatation', texte: 'Le solvant s’évapore : la goutte rétrécit et laisse un grain de sel solide.' },
  { id: 'vapo', nom: 'Vaporisation', texte: 'Le grain fond puis se vaporise : des molécules gazeuses (par exemple NaCl).' },
  { id: 'atomi', nom: 'Atomisation', texte: 'La chaleur casse les liaisons : atomes libres (Na et Cl), prêts à émettre ou à absorber.' },
];
export const etapeDe = p => Math.min(3, Math.floor(p * 4));
export function tirageDefiEtalonnage(rnd, methode) {
  const pick = a => a[Math.floor(rnd() * a.length)];
  const el = pick(methode === 'emission' ? ELEMENTS.filter(e => ['Na', 'Li', 'K'].includes(e.s)) : ELEMENTS.filter(e => ['Na', 'Cu', 'Mg', 'K'].includes(e.s)));
  const fl = 'acetylene', c1 = el.cmax / 5, S1 = signal(methode, el, fl, c1), cEch = +(el.cmax * (0.2 + 0.15 * Math.floor(rnd() * 4))).toFixed(2);
  return { kind: methode, el, fl, c1, S1: +S1.toPrecision(3), S: +(S1 * cEch / c1).toPrecision(3), vrai: cEch };
}
