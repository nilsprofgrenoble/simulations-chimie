// Tests du modèle « CCM » 2GT (sim 197) : node src/simulations/ccm2gtModele.test.mjs
import * as M from './ccm2gtModele.js';
let ko = 0;
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
vrai('NB est l’espace insécable U+00A0', M.NB === ' ' && M.NB.charCodeAt(0) === 160);
vrai('nombreFR : virgule et NB', M.nombreFR(2260) === `2${M.NB}260` && M.nombreFR(0.7, 2) === '0,70');
// Rf : calculs à la main
vrai('Rf = 4,2 ÷ 6,0 = 0,70', Math.abs(M.rf(42, 60) - 0.7) < 1e-12);
vrai('Rf = 2,1 ÷ 6,0 = 0,35', Math.abs(M.rf(21, 60) - 0.35) < 1e-12);
vrai('rfFR(12, 60) = 0,20', M.rfFR(12, 60) === '0,20');
vrai('cmFR(42) = 4,2 cm', M.cmFR(42) === `4,2${M.NB}cm`);
vrai('distance proportionnelle au front : 5,0 cm → 3,5 cm', Math.abs(M.dist('jaune', 1, 50) - 35) < 1e-9);
// séparation des espèces : au moins 5 mm entre deux espèces d'une même situation, sauf la paire voulue (vanilline / éthylvanilline, éluant 1)
for (const S of M.LISTE_SITUATIONS) for (const el of [1, 2]) {
  const ids = [...new Set([...S.refs, ...(S.inconnue ? [S.inconnue] : []), ...S.echantillons.flatMap(e => e.especes)])];
  const d = ids.map(i => [i, M.dist(i, el)]).sort((a, b) => a[1] - b[1]);
  for (let k = 1; k < d.length; k++) {
    const ecart = d[k][1] - d[k - 1][1], paire = [d[k][0], d[k - 1][0]].sort().join() === 'eth,van';
    if (paire && el === 1) vrai(`${S.id}/éluant ${el} : vanilline et éthylvanilline indiscernables (${ecart.toFixed(1)} mm)`, ecart <= M.TOL_LECTURE);
    else vrai(`${S.id}/éluant ${el} : ${d[k - 1][0]}–${d[k][0]} écart ${ecart.toFixed(1)} mm ≥ 5`, ecart >= 5);
  }
  vrai(`${S.id}/éluant ${el} : toutes les taches entre 5 mm et 55 mm`, d.every(x => x[1] >= 5 && x[1] <= 55));
}
vrai('vanilline et éthylvanilline : une seule tache avec l’éluant 1', M.nbTaches(['van', 'eth'], 1) === 1);
vrai('vanilline et éthylvanilline : deux taches avec l’éluant 2', M.nbTaches(['van', 'eth'], 2) === 2);
vrai('extrait brut : trois taches', M.nbTaches(['van', 'x', 'y'], 1) === 3 && M.nbTaches(['van', 'x', 'y'], 2) === 3);
vrai('corps pur probable / mélange', M.verdictPurete(1) === 'corps pur probable' && M.verdictPurete(2) === 'mélange');
vrai('alignement : enrobage orange avec jaune et rouge, pas avec orangé', M.alignee(['jaune', 'rouge'], 'jaune', 1) && M.alignee(['jaune', 'rouge'], 'rouge', 1) && !M.alignee(['jaune', 'rouge'], 'orange', 1) && !M.alignee(['jaune', 'rouge'], 'bleu', 1));
vrai('identité : vanilline/vanilline probable', M.verdictIdentite('van', 'van') === 'probable');
vrai('identité : éthylvanilline vs vanilline : diff, séparée par l’éluant 2 seulement', M.verdictIdentite('eth', 'van') === 'diff' && M.eluantsQuiSeparent('eth', 'van').join() === '2');
vrai('identité : Z vs vanilline : diff avec les deux éluants', M.verdictIdentite('z', 'van') === 'diff' && M.eluantsQuiSeparent('z', 'van').join() === '1,2');
// voies
const v = M.voies('arome', { ech1: 'synthB', ech2: 'natPur', refs: ['van'], co: 'e2' });
vrai('voies : échantillons, co-dépôt, référence', v.length === 4 && v[2].type === 'co' && v[2].especes.length === 2);
// défis : 20 000 tirages
let nC = 0, nI = 0, bonnes = { probable: 0, diff: 0 };
for (let i = 0; i < 20000; i++) {
  const d = M.tirerDefiComposition();
  const S = M.SITUATIONS[d.sit];
  if (!d || d.refs.length < 1 || d.especes.length < 1 || d.especes.length > 3 + (d.inconnue ? 0 : 0) + 1) { vrai('défi composition mal formé', false); break; }
  if (!M.reponseJusteComposition(d, { refs: [...d.refs].reverse(), inconnue: d.inconnue })) { vrai('bonne réponse refusée', false); break; }
  if (M.reponseJusteComposition(d, { refs: d.refs, inconnue: !d.inconnue })) { vrai('inconnue ignorée', false); break; }
  const autre = S.refs.find(r => !d.refs.includes(r));
  if (autre && M.reponseJusteComposition(d, { refs: [...d.refs, autre], inconnue: d.inconnue })) { vrai('référence en trop acceptée', false); break; }
  // tous les écarts entre taches du défi sont lisibles
  if (M.taches(d.especes, d.eluant).length !== d.especes.length) { vrai('taches confondues dans le défi', false); break; }
  nC++;
  const e = M.tirerDefiIdentite();
  if (!M.reponseJusteIdentite(e, e.bonne) || M.reponseJusteIdentite(e, e.bonne === 'probable' ? 'diff' : 'probable')) { vrai('défi identité', false); break; }
  bonnes[e.bonne]++; nI++;
}
vrai(`20 000 tirages de défis cohérents (${nC} compo, ${nI} identité ; probable ${bonnes.probable}, diff ${bonnes.diff})`, nC === 20000 && nI === 20000 && bonnes.probable > 8000 && bonnes.diff > 8000);
console.log(ko ? `${ko} ÉCHEC(S)` : 'tout est vrai');
process.exit(ko ? 1 : 0);
