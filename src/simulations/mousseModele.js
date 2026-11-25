// Modèle de la simulation 226 « Mousses : former, stabiliser, détruire » (BTS MDC, Formulation).
// Capacités visées (jamais affichées à l'élève) : « Expliquer le mode d'action d'un tensioactif dans une mousse » ; « Mettre en œuvre un protocole expérimental pour déterminer le pouvoir moussant d'un mélange » ;
// « Mettre en œuvre un contrôle de stabilité d'une mousse » ; « Expliquer le mode d'action des agents antimousse ».
// Fil rouge : un liquide vaisselle (on veut de la mousse à la main), et l'antimousse qui la supprime quand elle gêne.
// Modèle QUALITATIF : moussabilité (hauteur initiale H0) et stabilité (demi-vie t½) sont des produits de facteurs simples ; les ordres de grandeur s'inspirent de mesures de type Ross-Miles et Bikerman.

export const TENSIOACTIFS = [
  { id: 'sds', nom: 'dodécylsulfate de sodium (SDS)', court: 'SDS', cmc: 8.2, M: 18, th: 6, sdur: 0.5 },
  { id: 'sles', nom: 'laureth sulfate de sodium (SDS éthoxylé)', court: 'laureth sulfate', cmc: 3, M: 17, th: 13, sdur: 0.2 },
];
export const tensio = id => TENSIOACTIFS.find(t => t.id === id);
export const GAZ = [
  { id: 'air', nom: 'air', f: 1 },
  { id: 'n2', nom: 'diazote (peu soluble dans l’eau)', f: 1.6 },
  { id: 'co2', nom: 'dioxyde de carbone (plus soluble)', f: 0.6 },
];
export const gaz = id => GAZ.find(g => g.id === id);

export const M_SDS = 288.4;       // g/mol
export const CMC_SDS = 8.2;       // mmol/L
export const H_SPEC = 12;         // cm : spécification illustrative d'un liquide vaisselle (moussabilité)
export const TH_SPEC = 8;         // min : spécification illustrative (stabilité)
export const H_PLATEAU_MAX = 3;   // cm : mousse « supprimée » (hauteur du plateau de Bikerman)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// État : t (tensioactif), c (concentration en CMC), r (fraction de dodécanol, 0..0.2), v (viscosité relative 0..1), ca (Ca²⁺, mmol/L), g (gaz), d (antimousse, % de la formule)
export const fForm = c => (c <= 0 ? 0 : c / (c + 0.3));     // moussabilité en fonction de c/CMC
export const fStab = c => (c <= 0 ? 0 : c / (c + 1));        // stabilité en fonction de c/CMC
export const durete = (T, ca) => 1 / (1 + T.sdur * Math.max(0, ca));
export const antiForm = d => 1 / (1 + 6 * Math.max(0, d));
export const antiStab = d => 1 / (1 + 60 * Math.max(0, d));

export const H0 = e => { const T = tensio(e.t); return T.M * fForm(e.c) * durete(T, e.ca) * antiForm(e.d); };              // cm
export const demiVie = e => { const T = tensio(e.t); return T.th * fStab(e.c) * durete(T, e.ca) * (1 + 10 * clamp(e.r, 0, 0.2)) * (1 + clamp(e.v)) * gaz(e.g).f * antiStab(e.d); };   // min
export const delaiRM = e => Math.min(2, 0.25 * demiVie(e));                  // min : la hauteur reste constante avant de décroître (Ross-Miles)
// Ross-Miles : hauteur de mousse après t minutes
export const hauteurRM = (e, t) => { const h0 = H0(e), th = demiVie(e), td = delaiRM(e); return t <= td ? h0 : h0 * Math.pow(2, -(t - td) / th); };
// Bikerman : débit de gaz constant, la hauteur tend vers un plateau
export const tauB = e => demiVie(e) / Math.LN2;
export const debitFormation = e => 0.15 * H0(e);                              // cm/min
export const plateauB = e => debitFormation(e) * tauB(e);                     // cm
export const hauteurB = (e, t, tStop = Infinity) => { const tau = tauB(e), hp = plateauB(e); const h = tt => hp * (1 - Math.exp(-tt / tau)); return t <= tStop ? h(t) : h(tStop) * Math.exp(-(t - tStop) / tau); };

// Dosage : masse de tensioactif pour une solution de concentration c (en CMC) dans un volume V (mL)
export const masseTensio = (cCMC, cmc_mM, Mmol, V_mL) => (cCMC * cmc_mM * 1e-3 * Mmol * V_mL * 1e-3);   // g

// ---------- Défis ----------
const choix = (L, r) => L[Math.floor(r() * L.length) % L.length];
export function tirageMasse(r = Math.random) {
  const k = choix([4, 5, 6, 8, 10], r), V = choix([200, 250, 500, 1000], r);
  return { k, V, vrai: masseTensio(k, CMC_SDS, M_SDS, V) };
}
export const CAS = ['concentration', 'durete', 'cohesion', 'aucune'];
export const CAUSES = {
  concentration: 'concentration en tensioactif trop faible : il n’y a pas assez de micelles pour renouveler les interfaces',
  durete: 'eau dure : les ions Ca²⁺ affaiblissent le tensioactif anionique',
  cohesion: 'couche de tensioactif peu cohésive : la mousse se forme mais vieillit vite',
  aucune: 'aucune lacune : la formulation respecte les deux spécifications',
};
export const REMEDES = {
  concentration: 'augmenter la concentration à 5 à 10 fois la CMC',
  durete: 'ajouter un séquestrant (ou adoucir l’eau)',
  cohesion: 'ajouter un supermoussant (dodécanol) ou passer au laureth sulfate',
  aucune: 'ne rien changer',
};
export function etatDuCas(cas, r = Math.random) {
  const u = (a, b) => a + (b - a) * r();
  const arrondi = (x, p) => Math.round(x / p) * p;
  const e = { t: 'sds', c: arrondi(u(5, 8), 0.5), r: 0, v: 0, ca: 0, g: 'air', d: 0 };
  if (cas === 'concentration') { e.t = choix(['sds', 'sles'], r); e.c = arrondi(u(0.2, 0.5), 0.1); }
  if (cas === 'durete') e.ca = arrondi(u(2.5, 4), 0.5);
  if (cas === 'aucune') { if (r() < 0.5) e.t = 'sles'; else e.r = 0.1; }
  return e;
}
export function tirageDiagnostic(r = Math.random) {
  const cas = choix(CAS, r), etat = etatDuCas(cas, r);
  return { cas, etat, h0: H0(etat), th: demiVie(etat) };
}
