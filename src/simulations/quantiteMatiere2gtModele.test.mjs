// Tests du modèle « quantité de matière » 2GT (sim 178) : node src/simulations/quantiteMatiere2gtModele.test.mjs
import * as M from './quantiteMatiere2gtModele.js';
let ko = 0;
const proche = (nom, x, ref, tolRel) => { const ok = Math.abs(x - ref) <= Math.abs(ref) * tolRel; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const E = M.entite;
// calculs faits à part, à la main
proche('m(H2O) = 2 × 1,67e-27 + 2,66e-26 = 2,994e-26 → 2,99e-26', M.masseEntite(E('h2o')), 2.99e-26, 1e-9);
proche('m(O2) = 2 × 2,66e-26', M.masseEntite(E('o2')), 5.32e-26, 1e-9);
proche('m(N2) = 2 × 2,33e-26', M.masseEntite(E('n2')), 4.66e-26, 1e-9);
proche('m(CO2) = 1,99e-26 + 5,32e-26', M.masseEntite(E('co2')), 7.31e-26, 1e-9);
proche('m(CH4) = 1,99e-26 + 6,68e-27 = 2,658e-26 → 2,66e-26', M.masseEntite(E('ch4')), 2.66e-26, 1e-9);
proche('m(NH3) = 2,33e-26 + 5,01e-27 = 2,831e-26 → 2,83e-26', M.masseEntite(E('nh3')), 2.83e-26, 1e-9);
proche('m(éthanol) = 3,98e-26 + 1,002e-26 + 2,66e-26 = 7,642e-26 → 7,64e-26', M.masseEntite(E('ethanol')), 7.64e-26, 1e-9);
proche('m(glucose) = 1,194e-25 + 2,004e-26 + 1,596e-25 = 2,9904e-25 → 2,99e-25', M.masseEntite(E('glucose')), 2.99e-25, 1e-9);
proche('m(Na+) = m(Na) (électron négligé)', M.masseEntite(E('na+')), 3.82e-26, 1e-9);
vrai('formule texte eau', M.formuleTexte(E('h2o')) === 'H₂O');
vrai('formule texte glucose', M.formuleTexte(E('glucose')) === 'C₆H₁₂O₆');
vrai('formule texte ion sodium', M.formuleTexte(E('na+')) === 'Na⁺');
vrai('formule texte ion chlorure', M.formuleTexte(E('cl-')) === 'Cl⁻');
vrai('formule texte cuivre (pas d’indice 1)', M.formuleTexte(E('cu')) === 'Cu');
// comptage par la masse : 45 g de coquillettes de 0,50 g → 90 ; 1,2 kg de lentilles de 0,050 g → 24 000
proche('N coquillettes = 45 / 0,50', M.nombreDepuisMasse(45, 0.50), 90, 1e-12);
proche('N lentilles = 1200 / 0,050', M.nombreDepuisMasse(1200, 0.050), 24000, 1e-12);
// mole
proche('N pour 0,50 mol', M.nombreDepuisQuantite(0.5), 3.01e23, 1e-12);
proche('N pour 2,0 mol = 12,04e23', M.nombreDepuisQuantite(2), 1.204e24, 1e-12);
proche('n pour 1,806e24 entités = 3,00 mol', M.quantiteDepuisNombre(1.806e24), 3.0, 1e-12);
// échantillon : 0,50 g d'aluminium : N = 5,0e-4 / 4,48e-26 = 1,116e22 ; n = 1,854e-2
const al = M.chaine(E('al'), 0.50);
proche('N atomes Al dans 0,50 g', al.N, 1.1161e22, 1e-3);
proche('n Al dans 0,50 g', al.n, 1.8541e-2, 1e-3);
// 0,050 g d'eau : N = 5,0e-5 / 2,99e-26 = 1,672e21 ; n = 2,778e-3
const eau = M.chaine(E('h2o'), 0.050);
proche('N molécules d’eau dans 0,050 g', eau.N, 1.6722e21, 1e-3);
proche('n eau dans 0,050 g', eau.n, 2.7778e-3, 1e-3);
// pas vers la 1G : une mole d'eau pèse ≈ 18 g ; une mole d'aluminium ≈ 27 g
proche('une mole de molécules d’eau ≈ 18,0 g', M.masseUneMole(E('h2o')), 18.0, 1e-2);
proche('une mole d’atomes d’aluminium ≈ 27 g', M.masseUneMole(E('al')), 27.0, 1e-2);
// écriture des nombres (espaces insécables remplacés par des espaces pour la comparaison)
const plat = t => t.replace(/\u00a0/g, ' ');
vrai('entier : espace insécable', M.entier(24000).includes('\u00a0'));
vrai('sci : espaces insécables', M.sci(6.02e23).split('\u00a0').length === 3);
vrai('sci 6,02e23', plat(M.sci(6.02e23)) === '6,02 × 10²³');
vrai('sci 1,204e24', plat(M.sci(1.204e24)) === '1,20 × 10²⁴');
vrai('sci 2,99e-26', plat(M.sci(2.99e-26)) === '2,99 × 10⁻²⁶');
vrai('sci arrondi 9,996e5 → 1,00e6', plat(M.sci(9.996e5)) === '1,00 × 10⁶');
vrai('nb 0,0185', M.nb(1.854e-2) === '0,0185');
vrai('nb 24000', M.nb(24000, 2) === '24000');
vrai('entier 24 000', plat(M.entier(24000)) === '24 000');
// défis : cohérence sur de nombreux tirages
for (let i = 0; i < 2000; i++) {
  const d = M.tirerDefiBalance();
  const lu = d.enKg ? d.valeur * 1000 : d.valeur;
  if (Math.abs(lu / d.o.m - d.N) > 1e-6 || d.N !== d.vrai || !Number.isInteger(d.N)) { ko++; console.log('✗ défi balance incohérent', d); break; }
  if (d.totG < 5 || d.totG > 5000) { ko++; console.log('✗ défi balance : masse hors bornes', d); break; }
}
for (let i = 0; i < 2000; i++) {
  const d = M.tirerDefiEchantillon();
  const n = (d.m / 1000) / M.masseEntite(d.e) / M.NA;
  if (Math.abs(n - d.vrai) > 1e-12 * n || !(d.n >= 0.003 && d.n <= 5)) { ko++; console.log('✗ défi échantillon incohérent', d); break; }
}
console.log(ko ? `${ko} ÉCHEC(S)` : 'Tous les tests passent.');
process.exit(ko ? 1 : 0);
