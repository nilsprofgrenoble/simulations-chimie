// ====================================================
//  Modèle de la simulation 220 « Charge d'un tensioactif selon le pH » (BTS MDC, Formulation › tensioactifs)
//  Une tête de tensioactif porte 0, 1 ou 2 groupes qui peuvent être chargés :
//   • 'fixe'  : charge permanente (sulfate −, ammonium quaternaire +) ;
//   • 'acide' : groupe –COOH / –COO⁻ ; charge − quand il a perdu H⁺ ; fraction ionisée α = 1 / (1 + 10^(pKa − pH)) ;
//   • 'base'  : groupe –NH₃⁺ ou –NH₂⁺– ; charge + tant qu'il porte H⁺ ; fraction protonée β = 1 / (1 + 10^(pH − pKa)).
//  On suit deux grandeurs par molécule : nPlus (nombre de charges +) et nMoins (nombre de charges −), entre 0 et 2 ;
//  la charge nette vaut nPlus − nMoins. La famille se lit sur les DEUX grandeurs, pas sur la charge nette seule.
//  Les pKa sont des ORDRES DE GRANDEUR arrondis (voir le panneau d'hypothèses de la simulation) :
//   palmitate de sodium (acide gras RCOOH en solution diluée) ≈ 4,8 — en agrégats (micelles, vésicules) le pKa apparent est plus élevé, de 6 à 9 selon les études : non modélisé ;
//   dodécylammonium (alkylammonium primaire) ≈ 10,6 ; bétaïne, groupe carboxylate ≈ 2 ; N-dodécyl-β-alanine : carboxyle ≈ 3,6, amine ≈ 10,2 (ordres de grandeur de la β-alanine).
// ====================================================

export const PH_MIN = 0, PH_MAX = 14;
const SEUIL = 0.15;           // en dessous, une charge est considérée comme absente (affichage, classification)

// groupes : { type, pKa?, q?, forme: [forme acide, forme basique] }
export const ESPECES = [
  { id: 'sds', nom: 'SDS (dodécylsulfate de sodium)', court: 'SDS', famille: 'anionique', sous: 'sulfate', formule: 'R–OSO₃⁻ Na⁺',
    groupes: [{ type: 'fixe', q: -1, texte: 'OSO₃⁻' }] },
  { id: 'savon', nom: 'palmitate de sodium (savon)', court: 'palmitate de sodium', famille: 'anionique', sous: 'carboxylate', formule: 'C₁₅H₃₁–COO⁻ Na⁺',
    groupes: [{ type: 'acide', pKa: 4.8, formes: ['COOH', 'COO⁻'] }] },
  { id: 'ctab', nom: 'CTAB (bromure de cétyltriméthylammonium)', court: 'CTAB', famille: 'cationique', sous: 'ammonium quaternaire', formule: 'R–N⁺(CH₃)₃ Br⁻',
    groupes: [{ type: 'fixe', q: 1, texte: 'N⁺(CH₃)₃' }] },
  { id: 'amine', nom: 'chlorure de dodécylammonium', court: 'dodécylammonium', famille: 'cationique', sous: 'ammonium primaire', formule: 'C₁₂H₂₅–NH₃⁺ Cl⁻',
    groupes: [{ type: 'base', pKa: 10.6, formes: ['NH₃⁺', 'NH₂'] }] },
  { id: 'betaine', nom: 'N-dodécylbétaïne', court: 'dodécylbétaïne', famille: 'amphotère', sous: 'bétaïne', formule: 'R–N⁺(CH₃)₂–CH₂–COO⁻',
    groupes: [{ type: 'fixe', q: 1, texte: 'N⁺(CH₃)₂' }, { type: 'acide', pKa: 2.0, formes: ['COOH', 'COO⁻'] }] },
  { id: 'alanine', nom: 'N-dodécyl-β-alanine', court: 'dodécyl-β-alanine', famille: 'amphotère', sous: 'amino-acide', formule: 'R–NH₂⁺–CH₂CH₂–COO⁻',
    groupes: [{ type: 'base', pKa: 10.2, formes: ['NH₂⁺', 'NH'] }, { type: 'acide', pKa: 3.6, formes: ['COOH', 'COO⁻'] }] },
  { id: 'age', nom: 'dodécanol éthoxylé (alcool gras polyéthoxylé)', court: 'dodécanol éthoxylé', famille: 'non ionique', sous: 'polyéther', formule: 'R–(OCH₂CH₂)ₙ–OH',
    groupes: [] },
  { id: 'sorbitane', nom: 'monolaurate de sorbitane', court: 'monolaurate de sorbitane', famille: 'non ionique', sous: 'polyol', formule: 'R–COO–sorbitane (OH multiples)',
    groupes: [] },
];
// Écritures de la formule non dissoute, de la plus lisible à la plus trompeuse : ion seul, ion avec son contre-ion, formule condensée du sel (charges non écrites).
// R = longue chaîne carbonée (queue hydrophobe). `contre` = contre-ion (sans queue, sans rôle dans la famille). Amphotères et non ioniques : pas de contre-ion.
const ECRITURES = {
  sds: { ecritures: ['R–OSO₃⁻', 'R–OSO₃⁻ Na⁺', 'R–OSO₃Na'], contre: 'Na⁺' },
  savon: { ecritures: ['R–COO⁻', 'R–COO⁻ Na⁺', 'R–COONa'], contre: 'Na⁺' },
  ctab: { ecritures: ['R–N⁺(CH₃)₃', 'R–N⁺(CH₃)₃ Br⁻', 'R–N(CH₃)₃Br'], contre: 'Br⁻' },
  amine: { ecritures: ['R–NH₃⁺', 'R–NH₃⁺ Cl⁻', 'R–NH₃Cl'], contre: 'Cl⁻' },
  betaine: { ecritures: ['R–N⁺(CH₃)₂–CH₂–COO⁻'], contre: null },
  alanine: { ecritures: ['R–NH₂⁺–CH₂CH₂–COO⁻'], contre: null },
  age: { ecritures: ['R–(OCH₂CH₂)ₙ–OH'], contre: null },
  sorbitane: { ecritures: ['R–COO–sorbitane (plusieurs OH)'], contre: null },
};
ESPECES.forEach(e => Object.assign(e, ECRITURES[e.id]));
export const espece = id => ESPECES.find(e => e.id === id);

const pw = x => Math.pow(10, x);
export const fracIonisee = (pKa, pH) => 1 / (1 + pw(pKa - pH));      // groupe acide : fraction sous forme COO⁻
export const fracProtonee = (pKa, pH) => 1 / (1 + pw(pH - pKa));     // groupe basique : fraction sous forme NH⁺

// état d'un groupe à un pH : charge moyenne signée (−1…+1) et forme dominante
export function etatGroupe(g, pH) {
  if (g.type === 'fixe') return { q: g.q, frac: 1, forme: g.texte };
  if (g.type === 'acide') { const a = fracIonisee(g.pKa, pH); return { q: -a, frac: a, forme: a >= 0.5 ? g.formes[1] : g.formes[0] }; }
  const b = fracProtonee(g.pKa, pH); return { q: b, frac: b, forme: b >= 0.5 ? g.formes[0] : g.formes[1] };
}
export function charges(e, pH) {
  let nPlus = 0, nMoins = 0;
  for (const g of e.groupes) { const s = etatGroupe(g, pH); if (s.q > 0) nPlus += s.q; else nMoins -= s.q; }
  return { nPlus, nMoins, nette: nPlus - nMoins };
}
// signe d'une charge (avec seuil) : '+', '−' ou '0'
export const signe = q => (q > SEUIL ? '+' : q < -SEUIL ? '−' : '0');
export const coexistent = (e, pH) => { const c = charges(e, pH); return c.nPlus > SEUIL && c.nMoins > SEUIL; };
const GRILLE = Array.from({ length: 281 }, (_, k) => k * 0.05);

// bilan sur toute l'échelle de pH 0–14
export function bilan(e) {
  let sPlus = false, sMoins = false, deux = false, zero = false, nettePlus = false, netteMoins = false;
  for (const pH of GRILLE) {
    const c = charges(e, pH);
    if (c.nPlus > SEUIL) sPlus = true; if (c.nMoins > SEUIL) sMoins = true;
    if (c.nPlus > SEUIL && c.nMoins > SEUIL) deux = true;
    if (c.nette > SEUIL) nettePlus = true; if (c.nette < -SEUIL) netteMoins = true; if (Math.abs(c.nette) <= SEUIL) zero = true;
  }
  return { sPlus, sMoins, deux, zero, nettePlus, netteMoins };
}
// famille déduite de la structure (règle de la simulation) : aucune charge possible → non ionique ; une seule sorte → ionique ; deux sortes → amphotère
export function familleDeduite(e) {
  const b = bilan(e);
  if (!b.sPlus && !b.sMoins) return 'non ionique';
  if (b.sPlus && b.sMoins) return 'amphotère';
  return b.sMoins ? 'anionique' : 'cationique';
}
// pH où une charge donnée (+ ou −) a sa moitié de valeur : pKa du groupe concerné
export const pKaDe = (e, type) => e.groupes.find(g => g.type === type)?.pKa ?? null;
// point isoélectrique d'un amphotère à deux groupes acide et basique ionisables : (pKa1 + pKa2) / 2 (charge nette nulle)
export function pointIsoelectrique(e) {
  const a = pKaDe(e, 'acide'), b = pKaDe(e, 'base');
  return a != null && b != null ? (a + b) / 2 : null;
}
// plage de pH où les deux sortes de charges coexistent (≥ SEUIL des deux côtés), ou null
export function plageDeuxCharges(e) {
  const P = GRILLE.filter(pH => coexistent(e, pH));
  return P.length ? [P[0], P[P.length - 1]] : null;
}

// courbes pour le graphique : points (pH, nPlus, nMoins)
export function courbe(e, pas = 0.25) {
  const pts = []; for (let pH = PH_MIN; pH <= PH_MAX + 1e-9; pH += pas) { const c = charges(e, pH); pts.push({ pH, nPlus: c.nPlus, nMoins: c.nMoins, nette: c.nette }); }
  return pts;
}

// ---------- émulsion (scène des gouttes) : gouttes d'huile stabilisées par un tensioactif ionique ----------
// Sur la goutte, chaque tête porte la charge moyenne q ; les gouttes se repoussent si |charge nette par tête| est assez grande.
export const NTETES = 12;
export function etatGouttes(e, pH) {
  const c = charges(e, pH), q = c.nette;                    // charge nette moyenne par tête
  const nCharges = Math.round(Math.abs(q) * NTETES);
  const repulsion = Math.abs(q) >= 0.5 ? 'forte' : Math.abs(q) >= 0.15 ? 'faible' : 'nulle';
  return { q, signe: signe(q), nCharges, repulsion, stable: repulsion !== 'nulle' };
}

// ---------- défis ----------
const tire = (L, r = Math.random) => L[Math.floor(r() * L.length)];
// défi 1 : reconnaître la famille d'un tensioactif d'après ses courbes (paramètres tirés)
export function tirageFamille(r = Math.random) {
  const type = tire(['sds', 'savon', 'ctab', 'amine', 'betaine', 'alanine', 'age'], r);
  const base = espece(type);
  const jit = (v, L) => Math.max(1.5, v + tire(L, r));   // pKa lisibles sur l'échelle 0–14
  const groupes = base.groupes.map(g => g.type === 'fixe' ? { ...g } : { ...g, pKa: Math.min(12, jit(g.pKa, [-1, -0.5, 0, 0.5, 1])) });
  const e = { ...base, groupes };
  return { id: type, e, famille: familleDeduite(e) };
}
// défi 2 (prolongement hors référentiel) : fraction ionisée d'un acide faible à un pH donné
export function tirageFraction(r = Math.random) {
  const pKa = tire([4, 4.5, 5, 5.5], r), ecart = tire([-1.5, -1, -0.5, 0.5, 1, 1.5, 2], r), pH = pKa + ecart;   // 3 % à 99 % ionisé
  const vrai = fracIonisee(pKa, pH);
  return { pKa, pH, ecart, vrai, pct: 100 * vrai };
}
// défi 3 (prolongement) : point isoélectrique d'un amphotère
export function tirageIso(r = Math.random) {
  const a = tire([2.5, 3, 3.5, 4], r), b = tire([9, 9.5, 10, 10.5], r);
  return { pKaAcide: a, pKaBase: b, vrai: (a + b) / 2 };
}

// défi « famille d'après la formule » : une espèce et une de ses écritures tirées au hasard
export function tirageFormule(r = Math.random) {
  const id = tire(['sds', 'savon', 'ctab', 'amine', 'betaine', 'age'], r), e = espece(id);
  const k = Math.floor(r() * e.ecritures.length);
  return { id, e, k, ecriture: e.ecritures[k], famille: familleDeduite(e) };
}
