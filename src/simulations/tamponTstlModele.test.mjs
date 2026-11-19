// Test du modèle de la simulation 140 : solution tampon (choix du couple, préparation, ajouts, dilution). Exécution : node src/simulations/tamponTstlModele.test.mjs
import * as M from './tamponTstlModele.js';
let nb = 0, ko = 0;
const verifie = (cond, msg) => { nb++; if (!cond) { ko++; if (ko < 15) console.log('ÉCHEC :', msg); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// Conservation de la matière dans le bilan, sur toute la grille
for (const nA of [0, 1, 2.5, 5, 8]) for (const nAH of [0, 1, 2.5, 5, 8]) for (let a = 0; a <= 12; a += 0.5) for (let b = 0; b <= 12; b += 0.5) {
  const r = M.bilan({ nA, nAH, nAcide: a, nBase: b });
  verifie(proche(r.nA + r.nAH, nA + nAH), `conservation du couple ${nA} ${nAH} ${a} ${b}`);
  verifie(r.nA >= -1e-12 && r.nAH >= -1e-12 && r.excesH >= 0 && r.excesOH >= 0, `positivité ${nA} ${nAH} ${a} ${b}`);
  verifie(!(r.excesH > 0 && r.excesOH > 0), 'un seul excès');
  // H₃O⁺ en excès nets : consomment A⁻ ; HO⁻ nets : consomment AH
  const net = a - b;
  verifie(proche(r.nA, net >= 0 ? Math.max(0, nA - net) : nA + Math.min(-net, nAH)), `A⁻ restant ${nA} ${nAH} ${a} ${b}`);
  verifie(proche(r.excesH, Math.max(0, net - nA)) && proche(r.excesOH, Math.max(0, -net - nAH)), `excès ${nA} ${nAH} ${a} ${b}`);
}
// Préparation : volumes et rapport
for (const id of M.ORDRE) for (let pH = 0.5; pH <= 13.5; pH += 0.1) for (const V of [50, 100, 200]) {
  const k = M.COUPLES[id].pKa, r = M.rapportDepuisPH(pH, k), vb = M.volumeBase(r, V), va = M.volumeAcide(r, V);
  verifie(proche(vb + va, V, 1e-9), `volumes ${id} ${pH} ${V}`);
  verifie(proche(vb / va, r, 1e-9), `rapport de volumes ${id} ${pH}`);
  verifie(proche(M.pHFormule(k, vb, va), pH, 1e-9), `pH retrouvé ${id} ${pH}`);
}
// pH exact ≈ formule du cours dans le domaine tampon (couples assez concentrés) : écart < 0,06 unité de pH
let pire = 0;
for (const id of M.ORDRE) for (let vA = 10; vA <= 90; vA += 5) for (let a = 0; a <= 4; a += 0.5) for (const sens of ['acide', 'base']) {
  const e = M.etat({ coupleId: id, vA, nAcide: sens === 'acide' ? a : 0, nBase: sens === 'base' ? a : 0 });
  if (e.tampon) { const d = Math.abs(e.pH - e.pHFormule); if (d > pire) pire = d; verifie(d < 0.06, `exact vs formule ${id} vA=${vA} ${sens} ${a} : ${e.pH} / ${e.pHFormule}`); }
}
console.log('écart maximal exact / formule :', pire.toFixed(3));
// Dilution : le tampon garde son pH (couples ≥ pKa 4 : à 0,1 près) alors que l'eau pure reste à 7
for (const id of ['benz', 'prop', 'hclo']) for (const ve of [100, 400, 900]) {
  verifie(Math.abs(M.pHTampon({ coupleId: id, vA: 50, ve }) - M.pHTampon({ coupleId: id, vA: 50 })) < 0.1, `dilution ${id} ${ve}`);
}
verifie(proche(M.pHEau({ ve: 900 }), 7, 1e-6), 'eau diluée reste neutre');
// Résistance : l'ajout de 1,0 mmol d'acide fort modifie bien moins le pH du tampon que celui de l'eau
for (const id of M.ORDRE) for (let vA = 20; vA <= 80; vA += 10) {
  verifie(M.variationPH(id, vA) < 0.5, `variation tampon ${id} ${vA}`);
  verifie(M.pHEau({}) - M.pHEau({ nAcide: 1 }) > 4.9, 'eau');
}
// Pouvoir tampon maximal à vA = 50 (équimolaire) : la variation est minimale
for (const id of ['benz', 'prop', 'hclo']) { const v50 = M.variationPH(id, 50); for (let vA = 10; vA <= 90; vA += 10) verifie(M.variationPH(id, vA) >= v50 - 0.01, `minimum à 50 ${id} ${vA}`); }

// Parcours guidé : valeurs écrites dans les énoncés
const P = M.PARCOURS, k = M.COUPLES[P.couple].pKa, q = M.quantites(P.vA);
verifie(proche(q.nA, 5) && proche(q.nAH, 5), 'tampon équimolaire 5,0 / 5,0 mmol');
verifie(proche(M.pHEau({ nAcide: 1 }), 2.0, 5e-3), `eau + 1 mmol d'acide : ${M.pHEau({ nAcide: 1 })}`);
verifie(proche(M.volumeTotal({ nAcide: 1 }), 101), 'volume 101 mL');
const e1 = M.etat({ coupleId: P.couple, vA: P.vA, nAcide: 1 });
verifie(proche(e1.nA, 4) && proche(e1.nAH, 6) && proche(e1.r, 2 / 3, 1e-9), 'bilan acide : 4,0 / 6,0, rapport 0,67');
verifie(Math.abs(e1.pHFormule - 4.724) < 1e-3 && Math.abs(e1.pH - e1.pHFormule) < 0.02, `pH après acide ${e1.pHFormule} ${e1.pH}`);
const e2 = M.etat({ coupleId: P.couple, vA: P.vA, nBase: 1 });
verifie(proche(e2.nA, 6) && proche(e2.nAH, 4) && Math.abs(e2.pHFormule - 5.076) < 1e-3 && e2.pH > e1.pH, `pH après base ${e2.pHFormule}`);
verifie(e2.pH - M.pHTampon({ coupleId: P.couple, vA: P.vA }) > 0.1 && e2.pH - M.pHTampon({ coupleId: P.couple, vA: P.vA }) < 0.3, 'hausse de pH modérée avec la base');
const eD = M.etat({ coupleId: P.couple, vA: P.vA, ve: P.veDilution });
verifie(Math.abs(eD.pH - 4.9) < 0.02 && eD.tampon, `dilution par 10 : ${eD.pH}`);
const eL = M.etat({ coupleId: P.couple, vA: P.vA, nAcide: P.nLimite });
verifie(proche(eL.nA, 0) && proche(eL.nAH, 10) && proche(eL.excesH, 1) && !eL.tampon && eL.pH < 2.2 && eL.pH > 1.9, `limite : pH ${eL.pH}`);
verifie(Math.abs(eL.pH - M.pHAcideFort(1, 106)) < 0.03, 'pH limite ≈ −log(excès/V)');
// préparation du tampon de pH 7,8 avec HClO / ClO⁻
const rc = M.rapportDepuisPH(P.cible, M.COUPLES[P.coupleCible].pKa);
verifie(proche(rc, 1.995, 1e-3) && Math.abs(M.volumeBase(rc) - 66.6) < 0.1 && Math.abs(M.volumeAcide(rc) - 33.4) < 0.1, 'préparation à pH 7,8 : 67 mL / 33 mL');
verifie(M.ORDRE.filter(id => Math.abs(M.COUPLES[id].pKa - P.cible) <= 1).join() === 'hclo', 'un seul couple convient pour pH 7,8');
verifie(Math.abs(M.pHTampon({ coupleId: 'hclo', vA: M.volumeBase(rc) }) - 7.8) < 0.03, 'pH exact du tampon préparé');

// Défis : 40 000 tirages
let n = 0;
for (let i = 0; i < 20000; i++) {
  const t = M.tiragePrep(), c = M.COUPLES[t.coupleId];
  verifie(proche(t.vBase + t.vAcide, t.V, 1e-9) && t.vBase > 0 && t.vAcide > 0, 'prep volumes');
  verifie(Math.abs(M.pHFormule(c.pKa, t.vBase, t.vAcide) - t.pH) < 1e-9, 'prep pH');
  verifie(t.pH > 0.5 && t.pH < 13.5 && Math.abs(t.pH - c.pKa) <= 0.9 + 1e-9, 'prep pH dans le domaine');
  verifie(Math.abs(M.pHTampon({ coupleId: t.coupleId, vA: t.vBase * 100 / t.V }) - t.pH) < 0.06, `prep pH exact ${t.coupleId} ${t.pH}`);
  const a = M.tirageAjout();
  verifie(a.nA2 > 0.5 && a.nAH2 > 0.5 && M.dansDomaine(a.r), 'ajout domaine');
  verifie(Math.abs(a.pH - a.pH0) >= 0.15 - 1e-9, 'ajout variation visible');
  verifie(proche(a.nA2 + a.nAH2, a.nA + a.nAH), 'ajout conservation');
  verifie(a.sens === 'acide' ? a.pH < a.pH0 : a.pH > a.pH0, 'sens de la variation');
  n++;
}
console.log(`${nb} vérifications, ${ko} échec(s).  (défis : ${n} + ${n} tirages)`);
if (ko) process.exit(1);
