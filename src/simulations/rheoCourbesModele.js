// Modèle pur — simulation « Courbes d'écoulement et de viscosité : lire un rhéogramme » (BTS MDC, formulation).
// Aucune dépendance au navigateur : testé par rheoCourbesModele.test.mjs.
//
// Un seul modèle décrit tous les comportements stationnaires (Herschel-Bulkley) :
//   τ = τ₀ + K · γ̇ⁿ        (τ en Pa, γ̇ en s⁻¹, K en Pa·sⁿ)
//   η = τ / γ̇              (en Pa·s ; ×1000 pour des mPa·s)
// Cas particuliers :  newtonien (τ₀ = 0, n = 1) · plastique idéal (τ₀ > 0, n = 1)
//   plastique non idéal (τ₀ > 0, n < 1) · pseudoplastique (τ₀ = 0, n < 1) · rhéoépaississant (τ₀ = 0, n > 1).
// La thixotropie est un effet du temps (paramètre de structure λ), ajouté par-dessus : voir rampe().
// Hypothèses (affichées dans la simulation) : écoulement laminaire homogène, pas de glissement à la paroi,
// température constante, échantillon au repos au départ, seuil « apparent » (dépend de la technique de mesure).

import { PEINTURES_MESUREES, GAMMAS_PEINTURES } from './epaisseursAssociatifsModele.js';

export { PEINTURES_MESUREES, GAMMAS_PEINTURES };

export const TYPES = [
  { id: 'newtonien', nom: 'Newtonien' },
  { id: 'plastique-ideal', nom: 'Plastique idéal' },
  { id: 'plastique-non-ideal', nom: 'Plastique non idéal' },
  { id: 'pseudoplastique', nom: 'Pseudoplastique (rhéofluidifiant)' },
  { id: 'rheoepaississant', nom: 'Rhéoépaississant' },
];

// Produits courants : paramètres illustratifs (ordres de grandeur), pas des données de fabricant.
export const PRODUITS = {
  glycerol: { nom: 'Glycérol', tau0: 0, K: 1.4, n: 1, type: 'newtonien', thixo: 0 },
  boue: { nom: 'Boue de forage (modèle de Bingham)', tau0: 12, K: 0.06, n: 1, type: 'plastique-ideal', thixo: 0 },
  ketchup: { nom: 'Ketchup', tau0: 15, K: 3, n: 0.5, type: 'plastique-non-ideal', thixo: 0 },
  shampooing: { nom: 'Shampooing', tau0: 0, K: 2.5, n: 0.5, type: 'pseudoplastique', thixo: 0 },
  fecule: { nom: 'Fécule de maïs dans l’eau', tau0: 0, K: 0.05, n: 1.5, type: 'rheoepaississant', thixo: 0 },
};

export const tauHB = (g, { tau0 = 0, K, n }) => tau0 + K * Math.pow(g, n);
export const etaHB = (g, p) => tauHB(g, p) / g; // Pa·s

// Comportement reconnu à partir des paramètres (tolérances : n = 1 à ±0,03 près ; seuil nul sous 0,5 Pa).
export function typeDe({ tau0 = 0, n }) {
  const seuil = tau0 > 0.5;
  const lineaire = Math.abs(n - 1) < 0.03;
  if (seuil) return lineaire ? 'plastique-ideal' : 'plastique-non-ideal';
  if (lineaire) return 'newtonien';
  return n < 1 ? 'pseudoplastique' : 'rheoepaississant';
}
export const nomDuType = (id) => (TYPES.find((t) => t.id === id) || { nom: id }).nom;

// Échelles de gradient : de 0,1 à 1 000 s⁻¹ en N points régulièrement espacés en logarithme.
export function gradientsLog(gmin = 0.1, gmax = 1000, N = 60) {
  const a = Math.log10(gmin), b = Math.log10(gmax);
  return Array.from({ length: N }, (_, i) => Math.pow(10, a + ((b - a) * i) / (N - 1)));
}

// Rampe aller-retour (dt secondes par palier) avec structure λ : 1 = structure intacte, 0 = détruite.
// dλ/dt = kr(1 − λ) − kd·γ̇·λ, intégré exactement sur chaque palier (γ̇ constant).
// τ = (τ_HB) × (1 − thixo × (1 − λ)) : la structure détruite fait baisser la contrainte.
export const KR = 0.02; // s⁻¹ : reconstruction au repos (temps caractéristique ≈ 50 s)
export const KD = 0.002; // détruire : taux = kd·γ̇
export function rampe(p, gammas = GAMMAS_PEINTURES, dt = 2) {
  const thixo = p.thixo || 0;
  const suite = [...gammas, ...gammas.slice().reverse()];
  let lambda = 1;
  const taus = suite.map((g) => {
    const a = KR + KD * g;
    const inf = KR / a;
    lambda = inf + (lambda - inf) * Math.exp(-a * dt);
    return tauHB(g, p) * (1 - thixo * (1 - lambda));
  });
  const N = gammas.length;
  return { gammas, aller: taus.slice(0, N), retour: taus.slice(N).reverse() };
}

// Perte relative de viscosité entre aller et retour au gradient d'indice i (0 = premier point).
export const perteRelative = (aller, retour, i = 0) => (aller[i] - retour[i]) / aller[i];

// Peintures mesurées (A, B) : η en mPa·s → τ en Pa.
export function tauMesure(cle, sens) {
  return PEINTURES_MESUREES[cle][sens].map((e, i) => (e / 1000) * GAMMAS_PEINTURES[i]);
}

// Ajustement de Herschel-Bulkley par moindres carrés relatifs (grille sur τ₀ et n, K par régression).
export function ajusterHB(gammas, taus) {
  let meilleur = null;
  for (let t0 = 0; t0 <= 40; t0 += 0.5) {
    for (let n = 0.3; n <= 1.5001; n += 0.01) {
      let num = 0, den = 0;
      gammas.forEach((g, i) => { const f = Math.pow(g, n); num += f * (taus[i] - t0); den += f * f; });
      const K = num / den;
      if (K <= 0) continue;
      const e = ecartRelatif(gammas, taus, { tau0: t0, K, n });
      if (!meilleur || e < meilleur.ecart) meilleur = { tau0: t0, K, n, ecart: e };
    }
  }
  return meilleur;
}
export function ecartRelatif(gammas, taus, p) {
  let s = 0;
  gammas.forEach((g, i) => { const r = tauHB(g, p) / taus[i] - 1; s += r * r; });
  return Math.sqrt(s / gammas.length);
}

// ---------------------------------------------------------------------------
// Défi : « fluide mystère » tiré au hasard.
// ---------------------------------------------------------------------------
const arrondi3 = (x) => Number(x.toPrecision(3));
const alea = (rng, a, b) => a + rng() * (b - a);

export function tirerFluideMystere(rng = Math.random) {
  const type = TYPES[Math.floor(rng() * TYPES.length)].id;
  // Seuls les produits structurés (pseudoplastique, plastique non idéal) peuvent être thixotropes dans ce modèle.
  const structure = type === 'pseudoplastique' || type === 'plastique-non-ideal';
  const thixo = structure && rng() < 0.5 ? Number(alea(rng, 0.3, 0.5).toFixed(2)) : 0;
  let p;
  // Plages choisies pour que les types soient toujours nettement séparés à l'écran
  // (τ₀ ≥ 10 Pa pour un plastique ; K ≤ 1,5 Pa·sⁿ pour un pseudoplastique, de façon que τ(1 s⁻¹) reste petit sans seuil).
  if (type === 'newtonien') p = { tau0: 0, K: alea(rng, 0.2, 2.5), n: 1 };
  else if (type === 'plastique-ideal') p = { tau0: alea(rng, 10, 30), K: alea(rng, 0.05, 0.4), n: 1 };
  else if (type === 'plastique-non-ideal') p = { tau0: alea(rng, 10, 30), K: alea(rng, 0.5, 3), n: alea(rng, 0.4, 0.6) };
  else if (type === 'pseudoplastique') p = { tau0: 0, K: alea(rng, 0.4, 1.5), n: alea(rng, 0.35, 0.6) };
  else p = { tau0: 0, K: alea(rng, 0.02, 0.1), n: alea(rng, 1.3, 1.6) };
  p = { ...p, tau0: arrondi3(p.tau0), K: arrondi3(p.K), n: arrondi3(p.n), thixo };
  // Tableau de mesures : 5 gradients, contraintes arrondies à 3 chiffres significatifs (valeurs affichées = valeurs du corrigé).
  const gammas = [1, 4, 20, 80, 300];
  const r = rampe(p, gammas, 2);
  const aller = r.aller.map(arrondi3);
  const retour = r.retour.map(arrondi3);
  const thixotrope = thixo > 0 && perteRelative(r.aller, r.retour, 0) > 0.05;
  const iq = 2 + Math.floor(rng() * 2); // question de viscosité à 20 ou 80 s⁻¹
  const gq = gammas[iq];
  return {
    type, p, gammas, aller, retour, thixotrope, gq,
    etaVraie: aller[iq] / gq, // Pa·s : calculée avec la valeur AFFICHÉE
  };
}

// Mélange déterministe des options d'un QCM (la bonne réponse change de place d'un tirage à l'autre).
export function ordreOptions(types, bon, graine) {
  const n = types.length;
  const dec = ((graine % n) + n) % n;
  const options = types.map((_, i) => types[(i + dec) % n]);
  return { options, bonne: options.indexOf(bon) };
}

// Couleurs des courbes (partagées par les graphiques et les cartes).
export const COULEURS = {
  glycerol: "#1d4ed8", shampooing: "#ea580c", fecule: "#15803d", boue: "#7c3aed", ketchup: "#dc2626", mystere: "#475569",
  A: "#1d4ed8", B: "#ea580c", modele: "#16a34a",
};
