// Modèle de la simulation 302 « Fluorescence X : de la lacune à la raie de l'élément ». Fonctions pures, testées par frxModele.test.mjs.
// Hypothèses : valeurs tabulées arrondies (keV) ; Kα = E_K − E_L et Kβ = E_K − E_M ; sensibilités et rendements schématiques ;
// intensité nette (fond soustrait) proportionnelle à la teneur, sans effet de matrice ; seules les raies K sont traitées.
export const HC = 1.243;                                   // h·c en keV·nm
// Z, énergie du seuil K (liaison de l'électron K), raies Kα et Kβ (keV), sensibilité (coups/s par % massique), rendement de fluorescence K (schématique)
const E = (s, nom, Z, EK, Ka, Kb, sens, om) => ({ s, nom, Z, EK, Ka, Kb, sens, om });
export const ELEMENTS = [
  E('Al', 'aluminium', 13, 1.560, 1.487, 1.557, 15, 0.04), E('Si', 'silicium', 14, 1.839, 1.740, 1.836, 25, 0.05), E('S', 'soufre', 16, 2.472, 2.307, 2.464, 45, 0.08),
  E('Ca', 'calcium', 20, 4.038, 3.692, 4.013, 120, 0.17), E('Ti', 'titane', 22, 4.966, 4.511, 4.932, 160, 0.22), E('Cr', 'chrome', 24, 5.989, 5.415, 5.947, 200, 0.28),
  E('Mn', 'manganèse', 25, 6.539, 5.899, 6.490, 220, 0.31), E('Fe', 'fer', 26, 7.112, 6.404, 7.058, 240, 0.34), E('Ni', 'nickel', 28, 8.333, 7.478, 8.265, 270, 0.41),
  E('Cu', 'cuivre', 29, 8.979, 8.048, 8.905, 290, 0.44), E('Zn', 'zinc', 30, 9.659, 8.639, 9.572, 300, 0.48),
];
export const element = s => ELEMENTS.find(e => e.s === s);
export const niveauL = e => e.EK - e.Ka;                    // énergie de liaison du niveau L (keV)
export const niveauM = e => e.EK - e.Kb;                    // énergie de liaison du niveau M (keV)
export const lamNm = keV => HC / keV;                       // longueur d'onde (nm) d'un photon X
export const moseley = Z => 0.0102 * (Z - 1) ** 2;          // Kα ≈ (3/4)·13,6 eV·(Z − 1)², en keV
export const ionise = (e, keV) => keV >= e.EK;              // un photon X éjecte un électron K s'il atteint l'énergie de liaison K
export const ratioKb = e => (e.Z >= 20 ? 0.15 : 0.03);      // rapport schématique d'intensité Kβ / Kα
export const SIGMA = 0.07;                                  // écart-type des pics (keV) : résolution d'un détecteur à dispersion d'énergie
export const fond = keV => 6 + 28 * Math.exp(-keV / 4);    // fond continu (coups/s), schématique
export const intensite = (e, w) => e.sens * w;               // intensité nette de la raie Kα (coups/s) pour une teneur w (% massique)
const gauss = (x, c, s) => Math.exp(-0.5 * ((x - c) / s) ** 2);
// composition : liste { s, w } ; renvoie le nombre de coups/s à l'énergie keV
export const spectre = (comp, keV, avecFond = true) => (avecFond ? fond(keV) : 0) + comp.reduce((a, { s, w }) => { const e = element(s), I = intensite(e, w); return a + I * gauss(keV, e.Ka, SIGMA) + I * ratioKb(e) * gauss(keV, e.Kb, SIGMA); }, 0);
export const ECHANTILLONS = {
  laiton: { nom: 'Laiton (alliage cuivre-zinc)', comp: [{ s: 'Cu', w: 63 }, { s: 'Zn', w: 37 }] },
  inox: { nom: 'Acier inoxydable', comp: [{ s: 'Fe', w: 70 }, { s: 'Cr', w: 18 }, { s: 'Ni', w: 10 }, { s: 'Mn', w: 2 }] },
  ciment: { nom: 'Ciment (oxygène non détecté)', comp: [{ s: 'Ca', w: 45 }, { s: 'Si', w: 10 }, { s: 'Al', w: 3 }, { s: 'Fe', w: 3 }, { s: 'S', w: 1 }] },
};
// Étalonnage : droite I = sens·w passant par l'origine
export const teneurDepuisEtalon = (wEt, IEt, I) => wEt * I / IEt;
// Défis
const ELEM_DEFI = ['Ca', 'Ti', 'Cr', 'Mn', 'Fe', 'Ni', 'Cu', 'Zn'];
export const tirageDefiElement = rnd => {
  const e = element(ELEM_DEFI[Math.floor(rnd() * ELEM_DEFI.length)]);
  const autres = ELEM_DEFI.map(element).filter(x => x.s !== e.s && Math.abs(x.Ka - e.Ka) > 0.5 && Math.abs(x.Ka - e.Ka) < 2.5);
  const opts = []; while (opts.length < 3 && autres.length) opts.push(autres.splice(Math.floor(rnd() * autres.length), 1)[0]);
  return { kind: 'element', e, choix: [...opts, e].sort((a, b) => a.Z - b.Z) };
};
export const tirageDefiDosage = rnd => {
  const e = element(['Cr', 'Fe', 'Ni', 'Cu', 'Zn'][Math.floor(rnd() * 5)]), wEt = [2, 5, 10][Math.floor(rnd() * 3)], wEch = Math.round((1 + rnd() * 14) * 2) / 2;
  const IEt = Math.round(intensite(e, wEt)), I = Math.round(intensite(e, wEch));
  return { kind: 'dosage', e, wEt, IEt, I, vrai: teneurDepuisEtalon(wEt, IEt, I) };
};
