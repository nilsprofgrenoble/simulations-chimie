// Test du modèle de la simulation 139 : pH = pKa + log, prédominance, indicateur coloré, Beer-Lambert. Exécution : node src/simulations/predoTstlModele.test.mjs
import * as M from './predoTstlModele.js';
let nb = 0, ko = 0;
const verifie = (cond, msg) => { nb++; if (!cond) { ko++; if (ko < 15) console.log('ÉCHEC :', msg); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// Relations de base
for (const id of M.ORDRE) for (let pH = 0; pH <= 14.001; pH += 0.1) {
  const c = M.COUPLES[id], e = M.etat(id, pH, 0.02);
  verifie(proche(e.A + e.AH, 0.02), `conservation ${id} pH ${pH}`);
  verifie(proche(pH, M.pHDepuisRapport(c.pKa, e.r), 1e-9), `pH=pKa+log ${id} ${pH}`);
  verifie(proche(c.pKa, M.pKaDepuisRapport(pH, e.r), 1e-9), `pKa ${id} ${pH}`);
  verifie(proche(e.r, e.A / e.AH, 1e-5), `rapport ${id} ${pH}`);
  verifie((pH < c.pKa - 1e-9) === (e.AH > e.A) || Math.abs(pH - c.pKa) < 1e-9, `prédominance ${id} ${pH}`);
  verifie(e.pred === (Math.abs(pH - c.pKa) < 1e-9 ? 'egal' : pH < c.pKa ? 'acide' : 'base'), `pred ${id} ${pH}`);
  // Ka cohérent : [A⁻]·10^(−pH)/[AH] = Ka
  verifie(proche(e.A * 10 ** -pH / e.AH, 10 ** -c.pKa, 1e-5), `Ka ${id} ${pH}`);
}
// pH = pKa : concentrations égales ; ± 1 : rapport 10 et 1/10 ; ± 2 : 100 et 1/100
for (const id of M.ORDRE) { const k = M.COUPLES[id].pKa;
  verifie(proche(M.rapport(k, k), 1), 'égal'); verifie(proche(M.rapport(k + 1, k), 10), '+1'); verifie(proche(M.rapport(k - 1, k), 0.1), '−1');
  verifie(proche(M.rapport(k + 2, k), 100), '+2'); verifie(proche(M.rapport(k - 2, k), 0.01), '−2'); }

// Parcours guidé : valeurs écrites dans les énoncés
const P = M.PARCOURS, k = M.COUPLES[P.couple].pKa;
verifie(proche(P.pHInf, k - 2, 1e-9) && P.pHSup > k + 2, 'pH prédictions');
verifie(proche(P.pHRatio, k + 1, 1e-9), 'pH ratio = pKa + 1');
verifie(proche(M.rapport(P.pHRatio, k), 10, 1e-9), 'rapport 10');
const eR = M.etat(P.couple, P.pHRatio, P.C); verifie(proche(M.arrondiCS(eR.A, 2), 1.8e-2, 1e-9) && proche(M.arrondiCS(eR.AH, 2), 1.8e-3, 1e-9), `concentrations pH ratio ${eR.A} ${eR.AH}`);
const eL = M.etat(P.couple, P.pHRel, P.C); verifie(proche(M.arrondiCS(eL.A, 2), 4.0e-3, 1e-9) && proche(M.arrondiCS(eL.AH, 2), 1.6e-2, 1e-9), `concentrations pH rel ${eL.A} ${eL.AH}`);
// pH tiré des concentrations arrondies de l'énoncé : à 2 % près (0,09)
verifie(Math.abs(M.pHDepuisRapport(k, 4.0e-3 / 1.6e-2) - P.pHRel) < 0.02, 'pH rel avec valeurs arrondies');
const eV = M.etat(P.couple, P.pHInv, P.C); verifie(proche(M.arrondiCS(eV.r, 2), 20, 0.03), `rapport inverse ${eV.r}`);
// indicateur : absorbance au pH de mesure, pKa retrouvé à 2 % avec les valeurs affichées
const eI = M.etat('ind', P.indPHMes, M.IND.C), Ak = eI.abs, Ind = Ak / (M.IND.eps * M.IND.l), HInd = M.IND.C - Ind;
verifie(Math.abs(M.pKaDepuisRapport(P.indPHMes, Ind / HInd) - 5.4) < 0.054, `pKa indicateur retrouvé ${M.pKaDepuisRapport(P.indPHMes, Ind / HInd)} (A = ${Ak})`);
verifie(Ak > 0.2 && Ak < M.IND.eps * M.IND.l * M.IND.C, 'absorbance dans la plage');
const eD = M.etat('ind', P.indPHMes, P.indDil); const AD = Math.round(M.absorbance(M.IND.eps, M.IND.l, eD.A) * 1000) / 1000;
verifie(Math.abs(AD / Ak - P.indDil / M.IND.C) < 0.02, 'absorbance de la solution diluée');
// teinte : jaune à pH très acide, violet à pH très basique
verifie(M.couleurIndicateur(0).toLowerCase() === M.TEINTE_ACIDE && M.couleurIndicateur(1).toLowerCase() === M.TEINTE_BASE, 'teintes extrêmes');

// Défis aléatoires : 40 000 tirages
let nbR = 0, nbI = 0;
for (let i = 0; i < 20000; i++) {
  const t = M.tirageRatio(), c = M.COUPLES[t.coupleId];
  verifie(t.pH > 0.5 && t.pH < 13.5 && Math.abs(t.pH - c.pKa) >= 0.5 - 1e-9 && Math.abs(t.pH - c.pKa) <= 1.8 + 1e-9, 'écart pH défi 1');
  verifie(proche(t.A + t.AH, t.C), 'conservation défi 1'); verifie(M.arrondiCS(t.A, 2) > 0 && M.arrondiCS(t.AH, 2) > 0, 'positives'); nbR++;
  const u = M.tirageIndicateur();
  const Ind2 = u.abs / (u.eps * u.l), r2 = Ind2 / (u.C - Ind2), pKa2 = M.pKaDepuisRapport(u.pH, r2);
  verifie(u.abs > 0 && u.abs < u.Amax && u.Amax >= 0.2, `absorbance défi 2 ${u.abs} / ${u.Amax}`);
  verifie(Math.abs(pKa2 - u.pKa) / u.pKa < 0.02, `pKa défi 2 : ${pKa2} vs ${u.pKa} (A=${u.abs}, Amax=${u.Amax})`); nbI++;
}
console.log(`${nb} vérifications, ${ko} échec(s).  (défis : ${nbR} + ${nbI} tirages)`);
if (ko) process.exit(1);
