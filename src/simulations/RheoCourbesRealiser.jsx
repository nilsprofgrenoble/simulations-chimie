// Famille REA (calculs) de la simulation 217 « Courbes d'écoulement et de viscosité : lire un rhéogramme » (BTS MDC).
// Préfixe d'identifiants : rhc- ; domaine « Rhéologie ». Branchée dans AtelierRealiserBanque.jsx (FAMILLES).
// Capacités : viscosité dynamique η = τ / γ̇ (conversions Pa·s / mPa·s), comparaison de viscosités à deux gradients,
// thixotropie (perte relative de viscosité entre aller et retour), viscosité cinématique ν = η / ρ.
// Les réponses sont calculées à partir des valeurs AFFICHÉES (donnée arrondie avant le calcul).

import { tauHB } from './rheoCourbesModele.js';

const NB = ' ';
const tire = (t) => t[Math.floor(Math.random() * t.length)];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
function nb(x, cs = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(cs));
  const e = Math.floor(Math.log10(Math.abs(r)));
  if (e < -3 || e > 5) return `${(r / Math.pow(10, e)).toFixed(cs - 1).replace('.', ',')}${NB}×${NB}10${sup(e)}`;
  const d = Math.max(0, cs - 1 - e);
  return r.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
}
const arr3 = (x) => Number(x.toPrecision(3));

// Produits à masse volumique connue (kg/m³) pour la viscosité cinématique : η en mPa·s à 20 °C, ordres de grandeur.
const LIQUIDES = [
  { nom: 'une huile de silicone', eta: 20, rho: 950 },
  { nom: 'une huile de tournesol', eta: 60, rho: 920 },
  { nom: 'un sirop', eta: 150, rho: 1300 },
  { nom: 'du glycérol', eta: 1400, rho: 1260 },
];

export function genRheoCourbesBTS() {
  // Fluide pseudoplastique (éventuellement à seuil) du modèle de Herschel-Bulkley
  const p = { tau0: tire([0, 0, 8, 12]), K: tire([3, 5, 8, 12]), n: tire([0.45, 0.5, 0.55, 0.6]) };
  const ga = tire([2, 4, 10]);
  const gb = tire([80, 150, 300]);
  const ta = arr3(tauHB(ga, p));
  const tb = arr3(tauHB(gb, p));
  const etaA = (ta / ga) * 1000; // mPa·s
  const etaB = (tb / gb) * 1000;
  const rapport = etaA / etaB;
  const perte = tire([12, 18, 24, 30]);
  const tr = arr3(ta * (1 - perte / 100));
  const pertVraie = ((ta - tr) / ta) * 100;
  const L = tire(LIQUIDES);
  const nu = (L.eta / 1000 / L.rho) * 1e6; // mm²/s

  const intro = <>Un rhéomètre mesure la contrainte de cisaillement τ d’un produit (peinture, crème…) pour deux gradients de vitesse γ̇, puis on compare avec la viscosité d’autres liquides. Données : à <b>γ̇ = {nb(ga, 3)}{NB}s⁻¹</b>, <b>τ = {nb(ta, 3)}{NB}Pa</b> ; à <b>γ̇ = {nb(gb, 3)}{NB}s⁻¹</b>, <b>τ = {nb(tb, 3)}{NB}Pa</b>.</>;
  const q1 = { id: 'r0', type: 'num', q: <>{intro} Calculez la viscosité dynamique η du produit à γ̇ = {nb(ga, 3)}{NB}s⁻¹ (en mPa·s, 3 chiffres significatifs).</>, unite: 'mPa·s', vrai: etaA, tolRel: 0.01, csMin: 3,
    aide: 'η = τ / γ̇ donne des Pa·s (τ en Pa, γ̇ en s⁻¹) ; 1 Pa·s = 1 000 mPa·s.',
    pieges: [[etaA / 1000, 'Valeur en Pa·s : la réponse est demandée en mPa·s (× 1 000).'], [ga / ta * 1000, 'Vous avez divisé γ̇ par τ : la viscosité est τ divisée par γ̇.']],
    expl: <>η = τ / γ̇ = {nb(ta, 3)}{NB}Pa ÷ {nb(ga, 3)}{NB}s⁻¹ = {nb(etaA / 1000, 3)}{NB}Pa·s = <b>{nb(etaA, 3)}{NB}mPa·s</b>.</> };
  const q2 = { id: 'r1', type: 'num', q: <>Même calcul à γ̇ = {nb(gb, 3)}{NB}s⁻¹, avec τ = {nb(tb, 3)}{NB}Pa : viscosité dynamique η (en mPa·s, 3 chiffres significatifs).</>, unite: 'mPa·s', vrai: etaB, tolRel: 0.01, csMin: 3,
    aide: 'η = τ / γ̇, puis conversion de Pa·s en mPa·s (× 1 000).',
    pieges: [[etaB / 1000, 'Valeur en Pa·s : multipliez par 1 000 pour des mPa·s.'], [tb * 1000, 'Vous avez oublié de diviser par γ̇ : la viscosité est τ / γ̇.']],
    expl: <>η = {nb(tb, 3)}{NB}Pa ÷ {nb(gb, 3)}{NB}s⁻¹ = {nb(etaB / 1000, 4)}{NB}Pa·s = <b>{nb(etaB, 3)}{NB}mPa·s</b>.</> };
  const q3 = { id: 'r2', type: 'num', q: <>Les deux viscosités des questions précédentes sont η({nb(ga, 3)}{NB}s⁻¹) = {nb(etaA, 3)}{NB}mPa·s et η({nb(gb, 3)}{NB}s⁻¹) = {nb(etaB, 3)}{NB}mPa·s. Calculez le rapport η({nb(ga, 3)}{NB}s⁻¹) / η({nb(gb, 3)}{NB}s⁻¹) (sans unité, 3 chiffres significatifs). </>, unite: '(sans unité)', vrai: rapport, tolRel: 0.01, csMin: 3,
    aide: 'Divisez la viscosité au plus petit gradient par celle au plus grand gradient. Un rapport supérieur à 1 signifie que η diminue quand γ̇ augmente.',
    pieges: [[etaB / etaA, 'Vous avez inversé le rapport : il faut η au petit gradient divisée par η au grand gradient.'], [ta / tb, 'Vous avez comparé les contraintes, pas les viscosités : divisez chaque contrainte par son gradient avant de comparer.']],
    expl: <>Rapport = {nb(etaA, 3)} ÷ {nb(etaB, 3)} = <b>{nb(rapport, 3)}</b>. La viscosité diminue quand γ̇ augmente : le produit est rhéofluidifiant (pseudoplastique).</> };
  const q4 = { id: 'r3', type: 'num', q: <>Après la montée de γ̇, on le redescend. À γ̇ = {nb(ga, 3)}{NB}s⁻¹, la contrainte vaut τ = {nb(ta, 3)}{NB}Pa à la montée et <b>{nb(tr, 3)}{NB}Pa</b> à la descente. Calculez la perte relative de viscosité entre la montée et la descente (en %, 3 chiffres significatifs).</>, unite: '%', vrai: pertVraie, tolRel: 0.03, csMin: 2,
    aide: 'Au même γ̇, η est proportionnelle à τ : perte = (τ montée − τ descente) ÷ τ montée, à exprimer en pourcentage.',
    pieges: [[tr / ta * 100, 'C’est le rapport descente / montée. La perte est ce qui manque : 100 % moins cette valeur.'], [pertVraie / 100, 'Fraction : multipliez par 100 pour l’exprimer en %.']],
    expl: <>Perte = ({nb(ta, 3)} − {nb(tr, 3)}) ÷ {nb(ta, 3)} = <b>{nb(pertVraie, 3)}{NB}%</b> : la courbe retour est sous la courbe aller, le produit est thixotrope.</> };
  const q5 = { id: 'r4', type: 'num', q: <>Pour comparer avec {L.nom} : η = <b>{nb(L.eta, 3)}{NB}mPa·s</b> et masse volumique ρ = <b>{nb(L.rho, 3)}{NB}kg/m³</b>. Calculez sa viscosité cinématique ν = η / ρ (en mm²/s, 3 chiffres significatifs).</>, unite: 'mm²/s', vrai: nu, tolRel: 0.01, csMin: 3,
    aide: 'Convertissez η en Pa·s (1 mPa·s = 10⁻³ Pa·s), divisez par ρ en kg/m³ : le résultat est en m²/s ; 1 m²/s = 10⁶ mm²/s.',
    pieges: [[nu / 1e6, 'Valeur en m²/s : multipliez par 10⁶ pour obtenir des mm²/s.'], [L.eta / L.rho, 'Vous n’avez pas converti η en Pa·s : 1 mPa·s = 10⁻³ Pa·s.']],
    expl: <>ν = η / ρ = {nb(L.eta / 1000, 3)}{NB}Pa·s ÷ {nb(L.rho, 3)}{NB}kg/m³ = {nb(nu / 1e6, 3)}{NB}m²/s = <b>{nb(nu, 3)}{NB}mm²/s</b>.</> };
  [q1, q2, q3, q4, q5].forEach((q) => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && y > 0 && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return {
    intro: 'Rhéogramme : viscosité dynamique à partir de τ et γ̇, comparaison à deux gradients, perte de viscosité (thixotropie) et viscosité cinématique.',
    questions: [q1, q2, q3, q4, q5],
    retenir: ['η = τ / γ̇ : τ en Pa et γ̇ en s⁻¹ donnent η en Pa·s (1 Pa·s = 1 000 mPa·s).', 'Si η diminue quand γ̇ augmente, le produit est rhéofluidifiant (pseudoplastique) ; si la courbe retour passe sous la courbe aller, il est thixotrope.', 'Viscosité cinématique : ν = η / ρ, en m²/s (1 m²/s = 10⁶ mm²/s).'],
  };
}
