// Exercices de calcul (REA) du chapitre BTS « Spectroscopies IR et UV-visible » pour la sim 301 : tirage pur, testé par fluoExos.test.mjs.
//  • tirageStokes : énergies du photon absorbé et du photon de fluorescence, énergie perdue par relaxation vibrationnelle, part perdue
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const arr = (x, k) => Number(Number(x).toFixed(k));
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };
const K = 1243;                                    // E(eV) × λ(nm)

export function tirageStokes(tire) {
  const la = tire([300, 320, 350, 370, 400]), le = la + tire([60, 80, 100, 130, 160]);
  const Ea = K / la, Ee = K / le, Ear = arr(Ea, 3), Eer = arr(Ee, 3), dE = Ear - Eer, dEr = arr(dE, 3), part = dEr / Ear * 100;
  const intro = `Une molécule absorbe un photon de longueur d’onde ${la}${NB}nm puis fluoresce à ${le}${NB}nm. On utilise E(eV) × λ(nm) = ${K}.`;
  const q1 = { id: 'fl0', type: 'num', unite: 'eV', vrai: Ea, tolRel: 0.05, csMin: 2,
    q: `Calculez l’énergie du photon absorbé (${la}${NB}nm), en eV (3 chiffres significatifs).`,
    aide: 'E(eV) = 1243 / λ(nm).',
    pieges: [[K / (la * 1e-3), 'Vous avez converti la longueur d’onde en micromètres alors que la relation donnée utilise les nanomètres.'], [Ee, 'C’est l’énergie du photon émis : on demande celle du photon absorbé (λ plus petite, énergie plus grande).'], [la / K, 'Vous avez inversé la relation : E = 1243 / λ.']],
    expl: `E(abs) = ${K} / ${la} ≈ ${d(Ea, 2)}${NB}eV.` };
  const q2 = { id: 'fl1', type: 'num', unite: 'eV', vrai: Ee, tolRel: 0.05, csMin: 2,
    q: `Calculez l’énergie du photon de fluorescence (${le}${NB}nm), en eV (3 chiffres significatifs).`,
    aide: 'E(eV) = 1243 / λ(nm).',
    pieges: [[Ea, 'C’est l’énergie du photon absorbé : utilisez la longueur d’onde de l’émission.'], [le / K, 'Vous avez inversé la relation : E = 1243 / λ.']],
    expl: `E(émis) = ${K} / ${le} ≈ ${d(Ee, 2)}${NB}eV.` };
  const q3 = { id: 'fl2', type: 'num', unite: 'eV', vrai: dE, tolRel: 0.06, csMin: 2,
    q: `Avec E(abs) = ${d(Ear, 3)}${NB}eV et E(émis) = ${d(Eer, 3)}${NB}eV (valeurs données), quelle énergie est perdue par relaxation vibrationnelle avant l’émission ? (2 chiffres significatifs)`,
    aide: 'L’énergie perdue est la différence entre l’énergie du photon absorbé et celle du photon émis.',
    pieges: [[Ear + Eer, 'Vous avez additionné les deux énergies : l’énergie perdue est leur différence.'], [K / (le - la), 'Vous avez utilisé la différence des longueurs d’onde : il faut soustraire les énergies, pas les longueurs d’onde.'], [Eer, 'C’est l’énergie du photon émis, pas l’énergie perdue.']],
    expl: `Énergie perdue = ${d(Ear, 3)} − ${d(Eer, 3)} = ${d(dE, 3)}${NB}eV, cédée au milieu sous forme de chaleur.` };
  const q4 = { id: 'fl3', type: 'num', unite: '%', vrai: part, tolRel: 0.06, csMin: 2,
    q: `Avec E(abs) = ${d(Ear, 3)}${NB}eV et une énergie perdue de ${d(dEr, 3)}${NB}eV (valeurs données), quel pourcentage de l’énergie absorbée est perdu ? (2 chiffres significatifs)`,
    aide: 'Pourcentage = énergie perdue / énergie absorbée × 100.',
    pieges: [[100 - part, 'C’est le pourcentage d’énergie conservé par le photon émis : on demande la part perdue.'], [dEr / Eer * 100, 'Vous avez divisé par l’énergie du photon émis : la référence est l’énergie du photon absorbé.']],
    expl: `Part perdue = ${d(dEr, 3)} / ${d(Ear, 3)} × 100 ≈ ${d(part, 1)}${NB}%.` };
  const qs = [q1, q2, q3, q4]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['E(eV) × λ(nm) ≈ 1243 : plus λ est grande, moins le photon est énergétique.', 'La relaxation vibrationnelle (non radiative) fait perdre de l’énergie : le photon de fluorescence est moins énergétique que le photon absorbé.', 'Énergie perdue = E(abs) − E(émis).'] };
}
