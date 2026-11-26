// node src/simulations/hookModes.test.mjs
import assert from 'node:assert/strict';
import * as H from './hookModes.js';
import * as M from './hookModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
// fréquence et ralenti
ok(Math.abs(M.nuHz(1715) - 5.145e13) < 1e10 && Math.abs(M.periodeFs(1715) - 19.44) < 0.05, 'ν et T de C=O');
for (const s of [500, 1000, 2950, 3620]) ok(Math.abs(M.ralenti(s) - 3e13) < 1e6 && Math.abs(M.fAnim(s) - s / 1000) < 1e-12, 'ralenti constant');
ok(M.fAnim(2000) > M.fAnim(1000), 'plus σ est grand, plus l’animation est rapide');
// centre de masse immobile dans chaque mode
for (const mol of Object.values(H.MOLS)) for (const md of mol.modes) { if (md.rot) continue;
  const d = H.deplacements(mol.id, md.id); for (const c of [0, 1]) ok(Math.abs(d.reduce((s, di, i) => s + mol.atomes[i].m * di[c], 0)) < 1e-12, `CM ${mol.id} ${md.id}`); }
// molécules neutres, centre de masse en 0 pour HCl
for (const mol of Object.values(H.MOLS)) ok(Math.abs(mol.atomes.reduce((s, a) => s + a.q, 0)) < 1e-12, `neutre ${mol.id}`);
const hcl = H.MOLS.HCl.atomes; ok(Math.abs(hcl.reduce((s, a) => s + a.m * a.x, 0)) < 1e-12, 'CM de HCl en 0');
// activité IR : la variation du moment dipolaire décide
ok(!H.actifIR('CO2', 'sym') && H.actifIR('CO2', 'antisym') && H.actifIR('CO2', 'def'), 'CO2');
ok(['sym', 'antisym', 'def'].every(m => H.actifIR('H2O', m)), 'H2O');
ok(H.actifIR('HCl', 'vib') && H.actifIR('HCl', 'rot'), 'HCl actif');
ok(!H.actifIR('N2', 'vib') && !H.actifIR('N2', 'rot'), 'N2 inactif');
// directions : antisym de CO2 selon x, déformation selon y, H2O symétrique selon y, antisymétrique selon x
const dp = (m, md) => H.variationDipole(m, md);
ok(Math.abs(dp('CO2', 'antisym')[1]) < 1e-12 && Math.abs(dp('CO2', 'def')[0]) < 1e-12, 'directions CO2');
ok(Math.abs(dp('H2O', 'sym')[0]) < 1e-12 && Math.abs(dp('H2O', 'antisym')[1]) < 1e-12, 'directions H2O');
// dipôle permanent : CO2 nul (molécule linéaire symétrique), H2O non nul selon l'axe
ok(Math.hypot(...H.dipolePermanent('CO2')) < 1e-12 && Math.hypot(...H.dipolePermanent('H2O')) > 0.3 && Math.abs(H.dipolePermanent('H2O')[0]) < 1e-12, 'dipôle permanent');
// spectres : une bande par mouvement actif, aucune bande pour le mode symétrique de CO2 ni pour N2
const bc = H.bandesMolecule('CO2'); ok(bc.length === 2 && M.transmittance(bc, 1388) > 0.99 && M.transmittance(bc, 2349) < 0.3 && M.transmittance(bc, 667) < 0.4, 'spectre CO2');
ok(H.bandesMolecule('H2O').length === 3 && H.bandesMolecule('HCl').length === 1 && H.bandesMolecule('N2').length === 0, 'nombre de bandes');
ok(M.transmittance(H.bandesMolecule('N2'), 2331) === 1, 'N2 sans bande');
// nombres d'onde dans l'ordre attendu : élongation > déformation ; rotation ≪ vibration ; raie de rotation 2B(J+1)
ok(H.mode('H2O', 'sym').sigma > H.mode('H2O', 'def').sigma && H.mode('CO2', 'antisym').sigma > H.mode('CO2', 'def').sigma, 'élongation > déformation');
ok(H.sigmaRaieRot(10.6, 4) === 106 && H.mode('HCl', 'rot').sigma === 106 && H.sigmaRaieRot(2.0, 4) === 20 && H.mode('N2', 'rot').sigma === 20, 'rotation');
ok(H.mode('HCl', 'rot').sigma < H.mode('HCl', 'vib').sigma / 20, 'rotation bien moins énergétique que la vibration');
// toutes les bandes tiennent dans le spectre tracé (500 à 4000 cm⁻¹) sauf la rotation
for (const mol of Object.values(H.MOLS)) for (const md of mol.modes) if (!md.rot) ok(md.sigma >= 500 && md.sigma <= 4000, `${mol.id} ${md.id}`);
console.log(`hookModes : ${n} contrôles OK`);
