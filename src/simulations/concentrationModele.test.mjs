// Tests du modèle « concentration, dissolution, dilution » (sim 153) : node src/simulations/concentrationModele.test.mjs
import * as C from './concentrationModele.js';
let ko = 0;
const proche = (nom, x, ref, tolRel = 1e-9) => { const ok = Math.abs(x - ref) <= Math.abs(ref) * tolRel; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
// calculs faits à part
proche('c = 0,0500 mol / 0,2500 L = 0,200 mol/L', C.concentration(0.05, 0.25), 0.2);
proche('n = 0,100 mol/L × 0,0500 L = 5,00 mmol', C.quantite(0.1, 0.05), 0.005);
proche('c(sérum 9,0 g/L NaCl) = 9,0 / 58,5 = 0,1538', C.concDepuisMasse(9.0, 58.5), 0.153846, 1e-5);
proche('Cm = 0,100 × 58,5 = 5,85 g/L', C.concMasse(0.1, 58.5), 5.85);
proche('m = 0,100 × 0,2500 × 58,5 = 1,4625 g', C.masseAPeser(0.1, 0.25, 58.5), 1.4625);
proche('V0 = 0,050 × 100,0 / 0,50 = 10,0 mL', C.volumePreleve(0.5, 0.05, 100), 10);
proche('F = 0,40 / 0,010 = 40', C.facteurDilution(0.4, 0.01), 40);
proche('V0 = 200,0 / 40 = 5,00 mL', C.volumePreleve(0.4, 0.01, 200), 5);
proche('c_fille = 0,50 × 10,0 / 100,0', C.concFille(0.5, 10, 100), 0.05);
proche('M(NaCl)', C.masseMolaireSoluteDe(C.soluteDe('nacl')), 58.5);
proche('M(CaCl2)', C.masseMolaireSoluteDe(C.soluteDe('cacl2')), 111.1);
proche('M(vitamine C)', C.masseMolaireSoluteDe(C.soluteDe('vitc')), 176);
vrai('dilution 10× de 0,50 → 100,0 mL possible (pipette 10 mL)', C.dilutionsPossibles(0.5).some(d => d.F === 10 && d.V1 === 100));
vrai('dilution 40× de 0,400 → 200 mL possible (pipette 5 mL)', C.dilutionsPossibles(0.4).some(d => d.F === 40 && d.V1 === 200));
vrai('toute dilution possible a une pipette standard et V0 < V1', C.dilutionsPossibles().every(d => C.PIPETTES.includes(d.V0) && d.V0 < d.V1));
vrai('au moins 20 dilutions possibles', C.dilutionsPossibles().length >= 20);
// tirages : 5000 défis de chaque type
let nb = 0;
for (let i = 0; i < 5000; i++) {
  const d = C.tirerDefiSolide();
  const g = d.c * d.M;                                     // g/L
  if (g > 0.3 * d.s.solub + 1e-9 || d.vrai < 0.5 || !C.FIOLES.includes(d.V) && ![100, 250, 500, 1000].includes(d.V)) nb++;
  const e = C.tirerDefiDilution();
  if (e.c0 * e.M > 0.3 * e.s.solub + 1e-9 || e.V0 >= e.V1 || !C.PIPETTES.includes(e.V0) || !C.FIOLES.includes(e.V1) || Math.abs(e.vrai - e.V0) > 1e-9) nb++;
}
vrai('5000 défis de chaque type cohérents (solubilité, pipette standard, fiole standard)', nb === 0);
if (ko) { console.log(`${ko} échec(s)`); process.exit(1); } else console.log('OK');
