// src/simulations/epaisseursAssociatifsModele.test.mjs
// Exécution : node src/simulations/epaisseursAssociatifsModele.test.mjs
// Tests du modèle pur + de la banque d'exercices. Aucune dépendance externe.

import assert from 'node:assert/strict';
import {
  PARAMS, ZONES, lambdaStatio, pasLambda,
  etaStatioHASE, etaHEUR, etaASE, fractionIonisee,
  etaStatio, etaInstantane,
  simulerRappe, hysteresisMoyenne, simuler3ITT,
  construireScene, fractionsLiaisons, majLiaisons, mulberry32,
  tirerFicheTDS, etaStatioFiche, profilFiche, questionsDefi, arrondiSig, GAMMAS_MESURES,
} from './epaisseursAssociatifsModele.js';

let nVerifs = 0;
function ok(cond, msg) { nVerifs++; assert.ok(cond, msg); }
function procheVal(obtenu, attendu, tol, msg) {
  nVerifs++;
  assert.ok(Math.abs(obtenu - attendu) <= tol, `${msg} : obtenu ${obtenu}, attendu ${attendu} ± ${tol}`);
}

// ---------- 1. Valeurs calculées à la main ----------

// λ stationnaire HASE : k·τ = 0,00158 × 60 = 0,0948
// λ(1) = 1/(1+0,0948) = 0,9134 ; λ(100) = 1/10,48 = 0,09542
procheVal(lambdaStatio(1, PARAMS.hase), 0.9134, 1e-3, 'lambdaStatio(1)');
procheVal(lambdaStatio(100, PARAMS.hase), 0.09542, 1e-4, 'lambdaStatio(100)');

// η HASE régime permanent : η = 400 + 11600·λ
// η(1) = 400 + 11600 × 0,9134 = 10995,6 mPa·s (≈ 11 000, cf. Brookfield 9 000 à 10 rpm)
// η(100) = 400 + 11600/10,48 = 1506,9 mPa·s (≈ 1 500 à 100 rpm, TDS Thixol)
procheVal(etaStatioHASE(1), 10995.6, 5, 'etaStatioHASE(1)');
procheVal(etaStatioHASE(100), 1506.9, 2, 'etaStatioHASE(100)');
// Le rapport η(1 s⁻¹)/η(100 s⁻¹) ≈ 7,3 : profil fortement rhéofluidifiant.
ok(etaStatioHASE(1) / etaStatioHASE(100) > 5, 'ratio η(1)/η(100) > 5 (rhéofluidifiant)');

// Intégration exacte de λ : λ(t) = λss + (λ0-λss)·e^(-bt), b = 1/60 + 0,00158×100 = 0,174667
// λ(1 s, depuis λ0 = 1, γ̇ = 100) = 0,09542 + 0,90458 × e^(-0,174667) = 0,8551
procheVal(pasLambda(1, 100, 1, PARAMS.hase), 0.8551, 1e-3, 'pasLambda exact 1 s');
procheVal(pasLambda(1, 100, 1e6, PARAMS.hase), 0.09542, 1e-6, 'pasLambda convergent');
// Stabilité inconditionnelle : pas énorme ne diverge pas.
ok(pasLambda(0.5, 10000, 1e3, PARAMS.hase) >= 0 && pasLambda(0.5, 10000, 1e3, PARAMS.hase) <= 1, 'λ borné [0,1]');

// HEUR quasi newtonien : η(0,01) = 3200×(1-0,08×0,01/4000,01) = 3199,94
// η(10000) = 3200×(1-0,08×10000/14000) = 3017,1 -> variation 5,7 % < 8 %
procheVal(etaHEUR(0.01), 3199.94, 0.1, 'etaHEUR(0,01)');
procheVal(etaHEUR(10000), 3017.1, 0.5, 'etaHEUR(10000)');
ok(Math.abs(etaHEUR(10000) - etaHEUR(0.01)) / etaHEUR(0.01) < 0.08, 'HEUR quasi constant (< 8 %)');

// ASE : fraction ionisée à pH 3 = 1/(1+10^1,6) = 0,02451 (forme acide livrée, peu visqueuse)
// η(0,01 s⁻¹, pH 3) = 400 + 9000×0,02451×0,9999 = 620,5 mPa·s
// à pH 8,5 : 1/(1+10^-3,9) = 0,99987 -> η ≈ 9397,7 mPa·s (forme gonflée)
procheVal(fractionIonisee(3), 0.02451, 1e-4, 'fraction ionisée pH 3');
procheVal(etaASE(0.01, 3), 620.5, 1, 'etaASE pH 3');
procheVal(etaASE(0.01, 8.5), 9397.7, 3, 'etaASE pH 8,5');

// Dispatch etaStatio cohérent avec etaInstantane en régime permanent.
for (const fam of ['ase', 'hase', 'heur']) {
  procheVal(etaStatio(fam, 10, { pH: 8.5 }), etaInstantane(fam, 10, fam === 'hase' ? lambdaStatio(10, PARAMS.hase) : 1, { pH: 8.5 }), 1e-9, `dispatch ${fam}`);
}

// ---------- 2. Sens de variation clés ----------

// Plus le gradient monte, plus η(HASE) baisse (le réseau casse).
let sensOk = true;
for (let g = 0.01; g < 1000; g *= 2) if (etaStatioHASE(g) <= etaStatioHASE(g * 2)) sensOk = false;
ok(sensOk, 'η HASE décroît avec γ̇');

// Plus le pH monte (vers 8-9), plus l'ASE gonfle et épaissit, jusqu'à saturation.
sensOk = true;
for (let pH = 3; pH < 10; pH += 0.5) if (etaASE(0.1, pH) > etaASE(0.1, pH + 0.5) + 1e-9) sensOk = false;
ok(sensOk, 'η ASE croît avec le pH');

// À haut gradient, HASE moins visqueux que HEUR ( réseau cassé vs liaisons tenues ).
ok(etaStatio('hase', 1000) < etaStatio('heur', 1000), 'à γ̇ = 1000 s⁻¹, η(HASE) < η(HEUR)');

// Zones de gradient : recouvrement des bandes du TP.
ok(ZONES.length === 4 && ZONES[0].min === 0.01 && ZONES[3].max === 10000, 'bandes de gradient 0,01-10 000');

// ---------- 3. Thixotropie : hystérésis et 3ITT ----------

// Rampe aller-retour HASE : la descente est SOUS la montée (liaisons cassées
// lentement reformées). Amplitude moyenne > 500 mPa·s avec nos constantes.
const rappeHASE = simulerRappe({ famille: 'hase' });
ok(rappeHASE.montee.length === 20 && rappeHASE.descente.length === 20, 'rampe 20+20 points');
ok(hysteresisMoyenne(rappeHASE) > 500, `hystérésis HASE > 500 mPa·s (obtenu : ${hysteresisMoyenne(rappeHASE).toFixed(0)})`);
const milieu = rappeHASE.montee[10];
const milieuDesc = rappeHASE.descente.find((d) => Math.abs(d.gamma - milieu.gamma) < 1e-9);
ok(milieuDesc.eta < milieu.eta, 'η(descente) < η(montée) au même γ̇ (thixotropie)');

// HEUR : pas de réseau -> aucune hystérésis (structure maintenue).
const rappeHEUR = simulerRappe({ famille: 'heur' });
ok(Math.abs(hysteresisMoyenne(rappeHEUR)) < 1, 'hystérésis HEUR ≈ 0');
const rappeASE = simulerRappe({ famille: 'ase' });
ok(Math.abs(hysteresisMoyenne(rappeASE)) < 1, 'hystérésis ASE ≈ 0');

// 3ITT HASE : régénération à 80 s ≈ 79 % (liaisons auto-associantes lentes à se reformer).
const ittHASE = simuler3ITT({ famille: 'hase' });
ok(ittHASE.regeneration > 70 && ittHASE.regeneration < 85,
  `régénération HASE 70-85 % (obtenu : ${ittHASE.regeneration.toFixed(1)})`);
// Un 3e palier plus court -> régénération plus faible (c'est bien le temps qui reconstruit le réseau).
const ittCourt = simuler3ITT({ famille: 'hase', phases: [{ gamma: 1, duree: 20 }, { gamma: 256, duree: 20 }, { gamma: 1, duree: 30 }] });
ok(ittCourt.regeneration < ittHASE.regeneration, 'palier de repos plus court -> régénération moindre');

// HEUR dose normale : 100 % (aucune dépendance au temps). Dose forte : < 100 %
// (le « pour aller plus loin » du TP : liaisons auto-associantes à haute concentration).
ok(simuler3ITT({ famille: 'heur' }).regeneration > 99.9, 'HEUR normal : pas de thixotropie');
ok(simuler3ITT({ famille: 'heur', doseForte: true }).regeneration < 100 && simuler3ITT({ famille: 'heur', doseForte: true }).regeneration > 90,
  'HEUR forte dose : thixotropie modérée');
ok(simuler3ITT({ famille: 'ase' }).regeneration > 99.9, 'ASE : pas de thixotropie');

// Points 3ITT : aucune valeur NaN, temps final = 120 s.
ok(ittHASE.points.every((p) => Number.isFinite(p.eta) && Number.isFinite(p.lambda)), '3ITT sans NaN');
procheVal(ittHASE.points[ittHASE.points.length - 1].t, 120, 0.1, 'durée totale 3ITT');

// ---------- 4. Scène moléculaire (layout déterministe, lisible en petit format) ----------

const sceneHASE = construireScene({ famille: 'hase' });
ok(sceneHASE.L === 900 && sceneHASE.H === 430, 'scène 900×430');
ok(sceneHASE.chaines.length === 3, '3 chaînes');
ok(sceneHASE.chaines.every((c) => c.points.length === 15), 'chaînes de 15 points');
const groupesHASE = sceneHASE.chaines.flatMap((c) => c.groupes);
ok(groupesHASE.length === 9, '9 groupes hydrophobes HASE');
ok(groupesHASE.filter((g) => g.type === 'crochet').length === 9, 'HASE du TP : 9 crochets, aucun gant');
ok(groupesHASE.filter((g) => g.type === 'gant').length === 0, 'HASE : pas de gant');
const sceneHEUR0 = construireScene({ famille: 'heur' });
ok(sceneHEUR0.chaines.flatMap((c) => c.groupes).every((g) => g.type === 'gant'), 'HEUR du TP : 9 gants');
ok(sceneHASE.particules.length === 4, '4 particules');
ok(sceneHASE.pairesAssoc.length === 0 && sceneHASE.pairesAuto.length === 0, 'HASE : ni gant-particule ni gant-gant');
ok(sceneHASE.pairesCrochet.length > 0, `paires crochet-crochet entre chaînes différentes (obtenu ${sceneHASE.pairesCrochet.length})`);
ok(sceneHASE.pairesCrochet.every((p) => p.a.y !== undefined && p.d < 200), 'portées < 200');
// Déterminisme : deux constructions donnent exactement la même scène, graine ignorée.
const sceneHASEbis = construireScene({ famille: 'hase', graine: 999 });
ok(JSON.stringify(sceneHASE) === JSON.stringify(sceneHASEbis), 'layout déterministe (la graine est ignorée)');
// Tous les points et particules tiennent dans le cadre (aucune chaîne coupée au bord).
for (const ch of sceneHASE.chaines) {
  for (const pt of ch.points) {
    ok(pt.x >= 0 && pt.x <= sceneHASE.L && pt.y >= 0 && pt.y <= sceneHASE.H, 'points dans le cadre');
  }
}
for (const p of sceneHASE.particules) {
  ok(p.x - p.r >= 0 && p.x + p.r <= sceneHASE.L && p.y - p.r >= 0 && p.y + p.r <= sceneHASE.H, `particule ${p.nom} dans le cadre`);
}
// Chaque particule est attrapable par au moins un gant (sinon elle ne sert à rien).
for (const p of sceneHASE.particules) {
  ok(sceneHEUR0.chaines.flatMap((c) => c.groupes).some((g) => g.type === 'gant' && Math.hypot(g.x - p.x, g.y - p.y) < 260), `particule ${p.nom} attrapable par un gant`);
}
// Toute paire candidate annoncée apparaît bien dans la scène (aucun élément fantôme).
for (const paire of sceneHEUR0.pairesAssoc) {
  ok(sceneHEUR0.particules.includes(paire.part), 'particule de la paire réellement dans la scène');
}

const sceneASE = construireScene({ famille: 'ase' });
ok(sceneASE.chaines.every((c) => c.groupes.length === 0), 'ASE : aucun groupe hydrophobe');
ok(majLiaisons(sceneASE).nAuto === 0 && majLiaisons(sceneASE).nAssoc === 0, 'ASE : aucune liaison');
// Une chaîne d'ASE neutralisée ondule nettement plus qu'une chaîne acide repliée.
const amplitudeOndulation = (scene) => {
  const y0s = [80, 200, 320];
  let max = 0;
  scene.chaines.forEach((c, ci) => c.points.forEach((pt) => { max = Math.max(max, Math.abs(pt.y - y0s[ci])); }));
  return max;
};
ok(amplitudeOndulation(construireScene({ famille: 'ase', gonflement: 1 })) > amplitudeOndulation(construireScene({ famille: 'ase', gonflement: 0.2 })) + 5,
  'ASE gonflée : chaînes nettement plus déployées que repliées');

// Liaisons actives proportionnelles à λ (HASE) et maintenues (HEUR).
const liaisonsPleines = majLiaisons(sceneHASE, { gamma: 0.01, lambda: 1 });
ok(liaisonsPleines.nCrochet === liaisonsPleines.nCrochetTotal, 'λ=1 : toutes les liaisons crochet-crochet actives');
ok(liaisonsPleines.nAssoc === 0 && liaisonsPleines.nAuto === 0, 'HASE du TP : seules des liaisons crochet-crochet');
const liaisonsBasses = majLiaisons(sceneHASE, { gamma: 100, lambda: 0.1 });
ok(liaisonsBasses.nCrochet === Math.round(0.1 * liaisonsBasses.nCrochetTotal), 'λ=0,1 : 10 % des liaisons crochet');
ok(liaisonsBasses.nCrochet < liaisonsPleines.nCrochet, 'le cisaillement réduit le réseau');
ok(majLiaisons(sceneHASE, { gamma: 10000, lambda: 0 }).nCrochet === 0, 'λ=0 : plus aucune liaison');

const sceneHEUR = construireScene({ famille: 'heur' });
ok(sceneHEUR.pairesCrochet.length === 0, 'HEUR : aucun crochet');
ok(sceneHEUR.pairesAuto.length === 14, `HEUR : 14 paires gant-gant candidates (obtenu ${sceneHEUR.pairesAuto.length})`);
ok(sceneHEUR.pairesAssoc.length === 8, `HEUR : 8 paires gant-particule candidates (obtenu ${sceneHEUR.pairesAssoc.length})`);
const tenues = majLiaisons(sceneHEUR, { gamma: 10000 });
ok(tenues.nAssoc >= Math.round(0.9 * tenues.nAssocTotal), 'HEUR à 10 000 s⁻¹ : ≥ 90 % des liaisons gant-particule tenues');
ok(tenues.nAuto === 0, 'HEUR dose normale : pas de liaisons auto');
const tenuesForte = majLiaisons(sceneHEUR, { gamma: 10000, lambda: 1, doseForte: true });
ok(tenuesForte.nAuto > 0, 'HEUR dose forte : liaisons auto présentes');

// ---------- 5. Défi : 100 tirages aléatoires ----------

const positionsQ4 = new Set();
const positionsQ1 = new Set();
for (let i = 0; i < 100; i++) {
  const rng = mulberry32(1000 + i);
  const fiche = tirerFicheTDS(rng);
  const q = questionsDefi(fiche);
  ok(fiche.mesures.length === 2 && fiche.mesures.every((m) => Number.isFinite(m.eta) && m.eta > 0), `tirage ${i} : deux mesures finies`);
  // Donnée arrondie AVANT le calcul : le rapport attendu se refait avec les valeurs affichées.
  procheVal(fiche.rapportReponse, fiche.mesures[0].eta / fiche.mesures[1].eta, 1e-12, `tirage ${i} : rapport = valeurs affichées`);
  ok(fiche.mesures.every((m) => arrondiSig(m.eta, 3) === m.eta), `tirage ${i} : mesures à 3 chiffres significatifs`);
  ok(q.q1.bonne >= 0 && q.q1.bonne < q.q1.options.length, `tirage ${i} : bonne réponse q1 valide`);
  ok(q.q2.bonne >= 0 && q.q2.bonne < q.q2.options.length, `tirage ${i} : bonne réponse q2 valide`);
  ok(new Set(q.q1.options).size === 3 && new Set(q.q2.options).size === 3, `tirage ${i} : options q1 et q2 distinctes`);
  ok(new Set(q.q4.options).size === 4, `tirage ${i} : options q4 distinctes`);
  const attenduFam = { ase: 'Un ASE', hase: 'Un HASE', heur: 'Un HEUR' }[fiche.famille];
  ok(q.q1.options[q.q1.bonne] === attenduFam, `tirage ${i} : q1 bonne réponse désignée correctement`);
  const attendu = fiche.famille === 'ase'
    ? 'Aucune : pas de modification hydrophobe sur ce polymère'
    : 'Liaisons associatives avec les particules (fortes) et auto-associantes entre groupes (lâches)';
  ok(q.q4.options[q.q4.bonne] === attendu, `tirage ${i} : q4 bonne réponse désignée correctement`);
  positionsQ4.add(q.q4.bonne);
  positionsQ1.add(q.q1.bonne);
  // Cohérence profil/famille : un HEUR est newtonien, les autres rhéofluidifiants.
  if (fiche.famille === 'heur') ok(profilFiche(fiche) === 'Newtonien', `tirage ${i} : HEUR newtonien`);
  else ok(profilFiche(fiche) === 'Rhéofluidifiant (pseudoplastique)', `tirage ${i} : ${fiche.famille} rhéofluidifiant`);
  ok(q.q2.options[q.q2.bonne] === profilFiche(fiche), `tirage ${i} : q2 bonne réponse = profil calculé`);
  // Le tableau affiché permet de conclure : rapport ≈ 1 si newtonien, nettement > 1 sinon.
  if (profilFiche(fiche) === 'Newtonien') ok(Math.abs(fiche.rapportReponse - 1) < 0.05, `tirage ${i} : rapport ≈ 1 (newtonien)`);
  else ok(fiche.rapportReponse > 1.5, `tirage ${i} : rapport > 1,5 (rhéofluidifiant) : ${fiche.rapportReponse.toFixed(2)}`);
}
ok(positionsQ4.size >= 3, 'bonne réponse q4 à des positions variées');
ok(positionsQ1.size === 3, 'bonne réponse q1 à toutes les positions');
ok(GAMMAS_MESURES.length === 2 && GAMMAS_MESURES[0] === 1 && GAMMAS_MESURES[1] === 100, 'mesures aux gradients 1 et 100 s⁻¹');
// arrondiSig : valeurs calculées à la main. 10995,6 -> 11 000 ; 1506,9 -> 1 510 ; 620,3 -> 620.
procheVal(arrondiSig(10995.6, 3), 11000, 1e-9, 'arrondiSig 10995,6');
procheVal(arrondiSig(1506.9, 3), 1510, 1e-9, 'arrondiSig 1506,9');
procheVal(arrondiSig(620.3, 3), 620, 1e-9, 'arrondiSig 620,3');

// Découplage architecture/comportement : le profil se calcule sur la courbe du
// PRODUIT. Renommer la famille (l'architecture) ne doit rien changer.
const ficheHeur = { famille: 'heur', params: { etaBase: 3000 }, pH: 8.5 };
ok(profilFiche(ficheHeur) === 'Newtonien', 'produit à η constant : newtonien');
ok(profilFiche({ ...ficheHeur, famille: 'hase' }) === 'Newtonien',
  'le même produit étiqueté HASE reste newtonien (l’architecture ne décide pas du comportement)');
const ficheRheo = { famille: 'hase', params: { etaInf: 400, delta: 12000, gammaEtoile: 10 }, pH: 8.5 };
ok(profilFiche(ficheRheo) === 'Rhéofluidifiant (pseudoplastique)', 'produit à réseau cassable : rhéofluidifiant');
ok(profilFiche({ ...ficheRheo, famille: 'heur' }) === 'Rhéofluidifiant (pseudoplastique)',
  'le même produit étiqueté HEUR reste rhéofluidifiant');

// Fractions de liaisons pour le dessin
{
  const f1 = fractionsLiaisons('hase', { gamma: 0.1, lambda: 1 });
  const f2 = fractionsLiaisons('hase', { gamma: 2000, lambda: 0.01 });
  ok(f1.crochet === 1 && f2.crochet === 0.01 && f1.assoc === 0, 'HASE : crochets pilotés par λ, jamais de gant');
  const h1 = fractionsLiaisons('heur', { gamma: 0.1, lambda: 1 });
  const h2 = fractionsLiaisons('heur', { gamma: 10000, lambda: 1 });
  ok(h1.assoc > 0.99 && h2.assoc > 0.9 && h2.assoc < h1.assoc, 'HEUR : liaisons gant-particule quasi maintenues');
  ok(h1.auto === 0 && fractionsLiaisons('heur', { lambda: 0.5, doseForte: true }).auto === 0.5, 'HEUR : auto-associations seulement à dose forte');
  const a = fractionsLiaisons('ase');
  ok(a.crochet === 0 && a.assoc === 0 && a.auto === 0, 'ASE : aucune liaison');
}

console.log(`epaisseursAssociatifsModele.test.mjs : ${nVerifs} vérifications, 0 échec.`);
