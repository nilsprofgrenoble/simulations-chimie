// ====================================================
//  Modèle de la « paillasse libre » du TP chalcone : l'élève fait ses choix, on en déduit masse, rendement,
//  pH des eaux de lavage, CCM et température de fusion. Modèle QUALITATIF et illustratif (paramètres annoncés dans
//  le panneau d'hypothèses) : il sert à rencontrer à l'écran les erreurs classiques du TP.
// ====================================================
import { bilan, M_ANIS, M_ACET } from './syntheseModele.js';
import { distance, fusion } from './ccmModele.js';

export const PARAM = {
  conversion: 0.90,        // fraction du réactif limitant réellement transformée en chalcone
  restantExces: 0.30,      // fraction du réactif en excès qui reste dans le solide brut
  naoh0: 0.60,             // g de soude dans le brut
  facteurLavage: 0.10,     // chaque lavage divise la soude restante par 10
  eau0: 2.4,               // g d'eau dans le solide avant séchage
  perteLavage: 0.01,       // fraction de chalcone perdue par lavage (eau glacée)
  decroissanceEau: 0.288,  // min⁻¹ : eau(t) = eau0·exp(−k·t)
  solChaud: 0.25,          // g de chalcone par mL d'éthanol chaud
  solFroid: 0.02,          // g de chalcone par mL d'éthanol froid
  elimination: 0.95,       // fraction des impuretés solubles éliminées par une recristallisation correcte
  eliminationPartielle: 0.30,
  Vmin: m => m / 0.25,     // volume minimal d'éthanol pour dissoudre la chalcone à chaud (mL)
  seuilEau: 0.02,          // g : en dessous, deux pesées successives sont égales à 0,01 g près
  seuilTache: 0.004,       // fraction massique d'un réactif visible en CCM
};
// pH de l'eau de lavage après n lavages (soude 0,05 mol/L au départ, divisée par 10 à chaque lavage)
export const phLavage = n => 14 + Math.log10(0.05 * Math.pow(PARAM.facteurLavage, n));

export function simuler({ m1, m2, nLav = 3, tSec = 20, vEtOH = 0 }) {
  const P = PARAM, b = bilan({ m1, m2 });
  const mChal0 = P.conversion * b.mth * Math.pow(1 - P.perteLavage, nLav);
  let exces = { nom: null, m: 0 };
  if (b.limitant === 'anisaldehyde') exces = { nom: 'acetophenone', m: b.n2f * M_ACET * P.restantExces };
  else if (b.limitant === 'acetophenone') exces = { nom: 'anisaldehyde', m: b.n1f * M_ANIS * P.restantExces };
  const naoh = P.naoh0 * Math.pow(P.facteurLavage, nLav);
  const eau = P.eau0 * Math.exp(-P.decroissanceEau * tSec);
  const recris = vEtOH > 0, Vmin = P.Vmin(mChal0);
  const complete = recris && vEtOH >= Vmin;
  const el = !recris ? 0 : (complete ? P.elimination : P.eliminationPartielle);
  const perteRecris = recris ? Math.min(0.95 * mChal0, P.solFroid * vEtOH) : 0;
  const chal = mChal0 - perteRecris;
  const mExces = exces.m * (1 - el), mNaoh = naoh * (1 - el);
  const imp = mExces + mNaoh + eau, m = chal + imp;
  const impPct = 100 * imp / m;
  const diag = [];
  if (b.limitant !== 'les deux') diag.push('exces');
  if (naoh > 0.01 * P.naoh0 * 0.1 && phLavage(nLav) > 10) diag.push('soude');
  if (eau > P.seuilEau) diag.push('humide');
  if (m / b.mth > 1) diag.push('rdt100');
  if (recris && !complete) diag.push('peuDeSolvant');
  if (recris && vEtOH > 3 * Vmin) diag.push('tropDeSolvant');
  if (!recris && (mExces / m > P.seuilTache)) diag.push('recristalliser');
  if (!diag.some(d => ['soude', 'humide', 'exces', 'rdt100', 'peuDeSolvant', 'tropDeSolvant', 'recristalliser'].includes(d))) diag.push('ok');
  const taches = [['chalcone', 1]];
  if (exces.nom && mExces / m > P.seuilTache) taches.push([exces.nom, Math.min(1, 25 * mExces / m)]);
  return { b, m, chal, imp, impPct, mExces, mNaoh, eau, exces, Vmin, complete, recris, perteRecris, rApp: m / b.mth, rVrai: chal / b.mth,
    ph: phLavage(nLav), fusion: fusion(impPct), taches, diag };
}
export function plaqueTP(res, { front = 6.0, e = 0.5 } = {}) {
  const voie = nom => [{ nom, d: distance(nom, front, e), k: 1 }];
  return { front, e, voies: [
    { etiquette: 'produit', taches: res.taches.map(([n, k]) => ({ nom: n, d: distance(n, front, e), k })) },
    { etiquette: 'chalcone', taches: voie('chalcone') }, { etiquette: 'anisaldéhyde', taches: voie('anisaldehyde') }, { etiquette: 'acétophénone', taches: voie('acetophenone') },
  ] };
}
// scénarios d'erreurs classiques (réglages de départ)
export const SCENARIOS = {
  reussi: { nom: 'TP réussi', p: { m1: 3.40, m2: 3.35, nLav: 3, tSec: 20, vEtOH: 30 } },
  sechage: { nom: 'Séchage trop court', p: { m1: 3.40, m2: 3.35, nLav: 3, tSec: 3, vEtOH: 30 } },
  soude: { nom: 'Lavage oublié', p: { m1: 3.40, m2: 3.35, nLav: 0, tSec: 20, vEtOH: 30 } },
  exces: { nom: 'Réactif en excès', p: { m1: 4.20, m2: 3.00, nLav: 3, tSec: 20, vEtOH: 0 } },
  solvant: { nom: 'Trop d’éthanol', p: { m1: 3.40, m2: 3.35, nLav: 3, tSec: 20, vEtOH: 120 } },
};
