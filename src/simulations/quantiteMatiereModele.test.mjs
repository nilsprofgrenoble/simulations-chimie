// Tests du modèle « quantité de matière » (sim 152) : node src/simulations/quantiteMatiereModele.test.mjs
import * as M from './quantiteMatiereModele.js';
let ko = 0;
const proche = (nom, x, ref, tol) => { const ok = Math.abs(x - ref) <= tol; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref} (± ${tol})`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const Mm = id => M.masseMolaire(M.espece(id));
// calculs faits à part (à la main, avec H 1,0 ; C 12,0 ; N 14,0 ; O 16,0 ; Na 23,0 ; Cl 35,5 ; Ca 40,1 ; S 32,1 ; P 31,0)
proche('M(H2O)', Mm('eau'), 18.0, 1e-9);
proche('M(glucose) = 6×12 + 12×1 + 6×16', Mm('glucose'), 180.0, 1e-9);
proche('M(saccharose) = 144 + 22 + 176', Mm('saccharose'), 342.0, 1e-9);
proche('M(vitamine C) = 72 + 8 + 96', Mm('vitc'), 176.0, 1e-9);
proche('M(éthanol) = 24 + 6 + 16', Mm('ethanol'), 46.0, 1e-9);
proche('M(NaCl)', Mm('nacl'), 58.5, 1e-9);
proche('M(CaCl2) = 40,1 + 71,0', Mm('cacl2'), 111.1, 1e-9);
proche('M(CaCO3) = 40,1 + 12 + 48', Mm('caco3'), 100.1, 1e-9);
proche('M(NaHCO3) = 23 + 1 + 12 + 48', Mm('nahco3'), 84.0, 1e-9);
proche('M(paracétamol) = 96 + 9 + 14 + 32', Mm('paracetamol'), 151.0, 1e-9);
proche('M(O2)', Mm('o2'), 32.0, 1e-9);
proche('M(CO2)', Mm('co2'), 44.0, 1e-9);
proche('M(C4H10) = 48 + 10', Mm('c4h10'), 58.0, 1e-9);
proche('M(SO4 2-) = 32,1 + 64', Mm('so42-'), 96.1, 1e-9);
proche('M(PO4 3-) = 31 + 64', Mm('po43-'), 95.0, 1e-9);
proche('M(NH4+)', Mm('nh4+'), 18.0, 1e-9);
vrai('formule texte glucose', M.formuleTexte(M.espece('glucose')) === 'C₆H₁₂O₆');
vrai('formule texte sulfate', M.formuleTexte(M.espece('so42-')) === 'SO₄²⁻');
vrai('formule texte ammonium', M.formuleTexte(M.espece('nh4+')) === 'NH₄⁺');
vrai('formule texte hélium (pas d’indice 1)', M.formuleTexte(M.espece('he')) === 'He');
proche('N pour 0,50 mol = 3,01e23', M.nombreEntites(0.5), 3.01e23, 1e19);
proche('n = 90,0 / 180,0', M.quantiteMasse(90, 180), 0.5, 1e-12);
proche('n vitamine C : 0,500 g / 176,0 = 2,8409e-3', M.quantiteMasse(0.5, 176), 2.84091e-3, 1e-8);
proche('m = 0,250 × 180,0 = 45,0', M.masseDe(0.25, 180), 45.0, 1e-9);
proche('n gaz : 0,600 L / 24,0', M.quantiteGaz(0.6, 24.0), 0.025, 1e-12);
// éthanol : m = 0,79 × 20,0 = 15,8 g ; n = 15,8 / 46,0 = 0,343478
proche('n éthanol 20,0 mL', M.quantiteLiquide(0.79, 20, 46), 0.343478, 1e-6);
// eau 18 g / 18,0 = 1,00 mol ; éthanol 23,0 / 46,0 = 0,500 mol (le mélange de l’étape finale)
proche('n eau du mélange', M.quantiteMasse(18.0, 18.0), 1.0, 1e-12);
proche('n éthanol du mélange', M.quantiteMasse(23.0, 46.0), 0.5, 1e-12);
// volume molaire du gaz parfait : 22,414 L/mol à 0 °C et 1013,25 hPa ; ici 1013 hPa : 22,42 ; 20 °C : 24,05 ; 25 °C : 24,47
proche('Vm(0 °C, 1013 hPa) ≈ 22,4', M.volumeMolaireGP(0, 1013), 22.42, 0.02);
proche('Vm(20 °C, 1013 hPa) ≈ 24,05', M.volumeMolaireGP(20, 1013), 24.06, 0.03);
proche('Vm(25 °C, 1013 hPa) ≈ 24,5', M.volumeMolaireGP(25, 1013), 24.47, 0.03);
vrai('Vm croît avec T', M.volumeMolaireGP(50, 1013) > M.volumeMolaireGP(20, 1013));
vrai('Vm diminue quand P augmente', M.volumeMolaireGP(20, 1100) < M.volumeMolaireGP(20, 900));
vrai('valeurs usuelles cohérentes avec le modèle à 4 % près', [0, 20, 25].every(t => Math.abs(M.VM_USUEL[t] / M.volumeMolaireGP(t, 1013) - 1) < 0.04));
// défis : 2 000 tirages, valeurs finies, tolérance 1 % compatible avec l’arrondi à 3 chiffres significatifs
let pire = 0, bon = true;
for (let i = 0; i < 2000; i++) {
  for (const d of [M.tirerDefiSolide(), M.tirerDefiGaz()]) {
    if (!(isFinite(d.vrai) && d.vrai > 0)) bon = false;
    pire = Math.max(pire, Math.abs(M.arrondiCS(d.vrai, 3) / d.vrai - 1));
  }
}
vrai('défis : valeurs finies et positives', bon);
let butane0 = false; for (let i = 0; i < 3000; i++) { const d = M.tirerDefiGaz(); if (!M.gazPossible(d.e, d.theta)) butane0 = true; }
vrai('défi gaz : jamais de butane à 0 °C', !butane0);
vrai('l’hélium est dans les gaz du défi', M.DEFI_GAZ.some(e => e.id === 'he'));
vrai(`défis : pire écart d’arrondi à 3 CS = ${(100 * pire).toFixed(2)} % < 1 %`, pire < 0.01);
// double check indépendant du défi gaz : 750 mL de CO2 à 20 °C : n = 0,750/24,0 = 0,03125 mol ; m = 1,375 g
proche('masse de 750 mL de CO2 à 20 °C', 0.75 / 24.0 * 44.0, 1.375, 1e-9);
if (ko) { console.log(`${ko} test(s) en échec`); process.exit(1); } else console.log('Tous les tests passent.');
