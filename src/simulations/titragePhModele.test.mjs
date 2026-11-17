// Tests du modèle « titrage pH-métrique » (sim 119) : node src/simulations/titragePhModele.test.mjs
import * as M from './titragePhModele.js';

let ko = 0;
const proche = (nom, x, ref, tol) => { const ok = Math.abs(x - ref) <= tol; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref} (± ${tol})`); } else console.log(`✓ ${nom} : ${x.toFixed(4)}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };

const ETHA = { acide: 'etha', C0: 0.080, V0: 20.0, Cb: 0.100 };
const HCL = { ...ETHA, acide: 'hcl' };

// ---- volume équivalent et composition (calculs à la main : n0 = 0,080 × 20,0 = 1,60 mmol ; V_E = 1,60 / 0,100 = 16,0 mL)
proche('V_E', M.volumeEq(ETHA), 16.0, 1e-9);
let c = M.composition(ETHA, 4.0);
proche('n0', c.n0, 1.60, 1e-9); proche('n(HO⁻) versée à 4,0 mL', c.nB, 0.40, 1e-9); proche('n(AH) restant à 4,0 mL', c.nAH, 1.20, 1e-9);
proche('n(A⁻) à 4,0 mL', c.nA, 0.40, 1e-9); proche('n(HO⁻) restant à 4,0 mL', c.nOH, 0, 1e-9);
c = M.composition(ETHA, 22.0);
proche('n(HO⁻) versée à 22,0 mL', c.nB, 2.20, 1e-9); proche('n(HO⁻) en excès à 22,0 mL', c.nOH, 0.60, 1e-9); proche('n(A⁻) à 22,0 mL', c.nA, 1.60, 1e-9); proche('n(AH) à 22,0 mL', c.nAH, 0, 1e-9);
c = M.composition(ETHA, 16.0);
proche('n(AH) à l’équivalence', c.nAH, 0, 1e-9); proche('n(HO⁻) à l’équivalence', c.nOH, 0, 1e-9); proche('n(A⁻) à l’équivalence', c.nA, 1.60, 1e-9);
vrai('état avant', M.etatTitrage(ETHA, 10) === 'avant'); vrai('état équivalence', M.etatTitrage(ETHA, 16.0) === 'equivalence'); vrai('état après', M.etatTitrage(ETHA, 20) === 'apres');

// ---- pH : formules du cours en repère
proche('pH initial (½(pKa − log C))', M.pHa(ETHA, 0), 0.5 * (4.8 - Math.log10(0.080)), 0.03);       // 2,95
proche('pH à 4,0 mL (Henderson : 4,8 + log(0,40/1,20))', M.pHa(ETHA, 4.0), 4.8 + Math.log10(0.40 / 1.20), 0.03);   // 4,32
proche('pH à la demi-équivalence = pKa', M.pHa(ETHA, 8.0), 4.8, 0.03);
// pH à l'équivalence (acide faible) : base faible A⁻ de concentration 1,60 mmol / 36,0 mL = 0,04444 mol/L : pH = 7 + ½(pKa + log C)
const CE = 1.60 / 36.0;
proche('pH_E éthanoïque', M.pHEq(ETHA), 7 + 0.5 * (4.8 + Math.log10(CE)), 0.02);           // 8,72
proche('pH_E chlorhydrique', M.pHEq(HCL), 7.0, 1e-3);
proche('pH à 22,0 mL (excès de HO⁻ : [HO⁻] = 0,60 mmol / 42,0 mL)', M.pHa(ETHA, 22.0), 14 + Math.log10(0.60 / 42.0), 0.02);   // 12,15
proche('pH HCl à 4,0 mL ([H₃O⁺] = 1,20 mmol / 24,0 mL)', M.pHa(HCL, 4.0), -Math.log10(1.20 / 24.0), 0.01);       // 1,30
proche('log K éthanoïque', M.logKTitrage(ETHA), 9.2, 1e-9); proche('log K HCl', M.logKTitrage(HCL), 14, 1e-9);

// ---- repérage de l'équivalence par la dérivée
for (const [nom, p] of [['éthanoïque', ETHA], ['HCl', HCL]]) proche(`V_E par la dérivée (${nom})`, M.volumeEqDerivee(M.courbe(p)), 16.0, 0.1);
for (const C0 of [0.050, 0.065, 0.080, 0.095]) for (const acide of ['hcl', 'etha', 'benz']) {
  const p = { acide, C0, V0: 20.0, Cb: 0.100 };
  proche(`V_E dérivée ${acide} ${C0}`, M.volumeEqDerivee(M.courbe(p)), M.volumeEq(p), 0.1);
}

// ---- volumes de virage de l'indicateur (valeurs à la main : Henderson-Hasselbalch pour l'éthanoïque)
const BBT = M.INDICATEURS.find(i => i.id === 'bbt'), BTH = M.INDICATEURS.find(i => i.id === 'bth');
const frac = ph => { const r = 10 ** (ph - 4.8); return r / (1 + r); };      // fraction de HO⁻ versé / n0 : V = 16,0 × r / (1 + r)
const vir = M.virage(BBT, ETHA);
proche('BBT début du virage (pH 6,0)', vir.v1, 16.0 * frac(6.0), 0.05);        // 15,05 mL
proche('BBT fin du virage (pH 7,6)', vir.v2, 16.0 * frac(7.6), 0.05);          // 15,97 mL
vrai('BBT ne convient pas à l’éthanoïque', !M.convient(BBT, ETHA));
vrai('BBT convient à HCl', M.convient(BBT, HCL));
vrai('bleu de thymol convient à l’éthanoïque', M.convient(BTH, ETHA));
vrai('bleu de thymol : zone dans le saut (éthanoïque)', M.zoneDansSaut(BTH, ETHA));
vrai('BBT : zone pas dans le saut (éthanoïque)', !M.zoneDansSaut(BBT, ETHA));
const s = M.saut(ETHA);
proche('saut éthanoïque : pH à 0,99 V_E', s[0], 6.8, 0.03); proche('saut éthanoïque : pH à 1,01 V_E', s[1], 10.65, 0.05);

// ---- défi 2 : pour chaque scénario possible, au moins un indicateur « bon » et au moins deux « mauvais » (trois sauf pour l’acide fort)
let pire = 99;
for (const acide of ['hcl', 'benz', 'etha']) for (let k = 10; k <= 19; k++) {
  const p = { acide, C0: k * 0.005, V0: 20.0, Cb: 0.100 };
  const cl = M.INDICATEURS.map(i => M.classeIndicateur(i, p));
  const bons = cl.filter(x => x === 'bon').length, mauvais = cl.filter(x => x === 'mauvais').length;
  pire = Math.min(pire, bons);
  if (bons < 1 || mauvais < (acide === "hcl" ? 2 : 3)) { ko++; console.log(`✗ scénario ${acide} ${p.C0} : ${bons} bon(s), ${mauvais} mauvais`); }
  if (M.volumeEq(p) > 25) { ko++; console.log('✗ V_E > burette'); }
}
console.log(`✓ défi 2 : au moins ${pire} bon indicateur par scénario`);

// ---- tolérance du défi « concentration » : pire écart relatif dû à l'arrondi de V_E lu à 0,1 mL près (C_A ≥ 0,050 → V_E ≥ 10 mL)
console.log(`✓ pire écart relatif d'une lecture de V_E à ± 0,1 mL : ${(0.1 / 10 * 100).toFixed(1)} %`);

console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTous les tests passent.');
process.exit(ko ? 1 : 0);
