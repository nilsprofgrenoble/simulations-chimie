// Exercices de calcul (REA) de la sim 314 « ICP : pourquoi un plasma ? » : tirage pur, testé par icpExos.test.mjs.
//  • tirageIcp : écart d'énergie d'une raie (eV), facteur de dilution pour entrer dans une plage de mesure, concentration par étalonnage (signal proportionnel)
import { RAIES, energieEV } from './icpModele.js';
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const arr = (x, k) => Number(Number(x).toFixed(k));
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };

export function tirageIcp(tire) {
  const e = tire(RAIES), lam = arr(e.lam, 1), E = energieEV(lam);
  const C = tire([120, 250, 400, 800, 1500]), lim = tire([5, 10]), f = C / lim;
  const cEt = tire([1, 2, 5]), IEt = tire([4000, 8000, 20000]), r = tire([0.3, 0.5, 1.5, 2.5, 4]), I = Math.round(IEt * r), c = cEt * I / IEt;
  const intro = `On dose le ${e.nom} (${e.s}) par spectrométrie d’émission à plasma d’argon (ICP). Sa raie atomique est à ${d(lam, 1)}${NB}nm. Constante : h·c = 1240${NB}eV·nm.`;
  const q1 = { id: 'ic0', type: 'num', unite: 'eV', vrai: E, tolRel: 0.03, csMin: 3,
    q: 'Calculez l’écart d’énergie entre les deux niveaux de la transition, en eV (3 chiffres significatifs).',
    aide: 'E(eV) = frac(1240|λ(nm)).',
    pieges: [[lam / 1240, 'Vous avez divisé λ par h·c : il faut diviser h·c par λ.'], [E * 1000, 'Il y a une erreur d’une puissance de 10 sur le résultat.'], [E * 1.602e-19, 'Cette valeur est en joules ; l’énoncé demande des eV.']],
    expl: `E = frac(h·c|λ) = 1240 / ${d(lam, 1)} ≈ ${d(E, 2)}${NB}eV. Plus cet écart est grand, plus il faut un milieu chaud (plasma) pour exciter assez d’atomes.` };
  const q2 = { id: 'ic1', type: 'num', unite: '', vrai: f, tolRel: 0.05, csMin: 2,
    q: `Un échantillon contient ${C}${NB}mg/L de ${e.nom}. L’absorption atomique n’est linéaire que jusqu’à ${lim}${NB}mg/L. Par quel facteur minimal faut-il diluer l’échantillon avant la mesure ?`,
    aide: 'Facteur de dilution = concentration de l’échantillon / concentration finale souhaitée.',
    pieges: [[lim / C, 'Vous avez inversé le rapport : le facteur de dilution est supérieur à 1.'], [f * 10, 'Il y a une erreur d’une puissance de 10 sur le résultat.'], [C - lim, 'Un facteur de dilution est un rapport de concentrations, pas une différence.']],
    expl: `Facteur = ${C} / ${lim} = ${d(f, 0)} : on dilue ${d(f, 0)} fois pour tomber dans la plage linéaire. (En ICP, la plage va jusqu’à plusieurs centaines de mg/L : souvent aucune dilution n’est nécessaire.)` };
  const q3 = { id: 'ic2', type: 'num', unite: 'mg/L', vrai: c, tolRel: 0.05, csMin: 2,
    q: `En ICP, un étalon à ${d(cEt, 1)}${NB}mg/L donne ${IEt}${NB}coups/s à la raie. L’échantillon donne ${I}${NB}coups/s. Calculez sa concentration, en mg/L (2 chiffres significatifs).`,
    aide: 'Le signal est proportionnel à la concentration (blanc déjà soustrait) : la droite d’étalonnage passe par l’origine.',
    pieges: [[cEt * IEt / I, 'Vous avez inversé le rapport des signaux : c = frac(c(étalon) × I(échantillon)|I(étalon)).'], [c * 10, 'Il y a une erreur d’une puissance de 10 sur le résultat.'], [cEt + (I - IEt) / 1000, 'La droite passe par l’origine : on ne soustrait ni n’additionne les signaux.']],
    expl: `c = ${d(cEt, 1)} × ${I} / ${IEt} ≈ ${d(c, 2)}${NB}mg/L (hypothèse : signal proportionnel à c sur toute la plage, mêmes conditions pour l’étalon et l’échantillon).` };
  const qs = [q1, q2, q3]; qs.forEach(filtrePieges);
  return { intro, questions: qs, retenir: ['E(eV) = frac(1240|λ(nm)) : l’écart d’énergie d’une raie atomique.', 'Facteur de dilution = concentration de l’échantillon / concentration visée dans la plage de mesure.', 'Signal ∝ c : c = frac(c(étalon) × I(échantillon)|I(étalon)).'] };
}
