// Test du modèle de la sim 154 : chaque entité du programme a le bon schéma de Lewis (valeurs écrites à la main, indépendantes du code).
//   node src/simulations/lewisModele.test.mjs
import { ENTITES, entite, nT, nD, structureRef, verifier, enumerer, structureVide, memeSchema } from './lewisModele.js';
let ko = 0; const ok = (c, m) => { if (!c) { ko++; console.log('ÉCHEC', m); } };
// id : [nT, nD, liaisons (somme des ordres), doublets non liants par atome, charges par atome, lacunes]
const ATTENDU = {
  O2: [12, 6, 2, [2, 2], [0, 0], []], H2: [2, 1, 1, [0, 0], [0, 0], []], N2: [10, 5, 3, [1, 1], [0, 0], []],
  H2O: [8, 4, 2, [2, 0, 0], [0, 0, 0], []], CO2: [16, 8, 4, [0, 2, 2], [0, 0, 0], []], NH3: [8, 4, 3, [1, 0, 0, 0], [0, 0, 0, 0], []],
  CH4: [8, 4, 4, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], []], HCl: [8, 4, 1, [0, 3], [0, 0], []],
  Hp: [0, 0, 0, [0], [1], [0]], H3Op: [8, 4, 3, [1, 0, 0, 0], [1, 0, 0, 0], []], Nap: [0, 0, 0, [0], [1], []],
  NH4p: [8, 4, 4, [0, 0, 0, 0, 0], [1, 0, 0, 0, 0], []], Clm: [8, 4, 0, [4], [-1], []], HOm: [8, 4, 1, [0, 3], [0, -1], []], O2m: [8, 4, 0, [4], [-2], []],
  O3: [18, 9, 3, [1, 2, 3], [1, 0, -1], []], AlCl3: [24, 12, 3, [0, 3, 3, 3], [0, 0, 0, 0], [0]], HCN: [10, 5, 4, [0, 0, 1], [0, 0, 0], []],
};
for (const e of ENTITES) {
  const a = ATTENDU[e.id]; ok(!!a, `entité sans attendu ${e.id}`); if (!a) continue;
  const ref = structureRef(e), vr = verifier(e, ref);
  ok(nT(e) === a[0], `${e.id} nT ${nT(e)} ≠ ${a[0]}`); ok(nD(e) === a[1], `${e.id} nD`);
  ok(ref.liens.reduce((x, y) => x + y, 0) === a[2], `${e.id} liaisons`);
  // O₃ : le schéma retenu a le centre chargé + : on compare à l'un des deux équivalents
  const attLp = a[3], attCh = a[4];
  if (e.id === 'O3') { ok(JSON.stringify(ref.lp) === JSON.stringify([1, 2, 3]) && JSON.stringify(ref.ch) === JSON.stringify([1, 0, -1]), 'O3 réf'); }
  else { ok(JSON.stringify(ref.lp) === JSON.stringify(attLp), `${e.id} lp ${ref.lp}`); ok(JSON.stringify(ref.ch) === JSON.stringify(attCh), `${e.id} charges ${ref.ch}`); }
  ok(JSON.stringify(ref.lac.map((x, i) => x ? i : -1).filter(i => i >= 0)) === JSON.stringify(a[5]), `${e.id} lacunes`);
  ok(ref.ch.reduce((x, y) => x + y, 0) === e.q, `${e.id} somme des charges = charge de l'entité`);
  ok(vr.ok, `${e.id} : la référence est refusée : ${vr.messages.map(m => m.txt).join(' / ')}`);
  // unicité : toutes les structures « octet + minimum de charges » sont la référence (à l'échange près d'atomes identiques)
  const { retenues } = enumerer(e);
  ok(retenues.length >= 1 && retenues.every(s => memeSchema(e, s, ref) || e.id === 'O3'), `${e.id} : structure énumérée différente de la référence`);
  ok(retenues.every(s => verifier(e, s).ok || e.id === 'O3'), `${e.id} : une structure énumérée est refusée`);
  if (e.id === 'O3') ok(retenues.length === 2 && retenues.every(s => verifier(e, s).ok), 'O3 : deux écritures équivalentes à accepter');
}
// cas d'erreurs d'élèves : jamais acceptés, message précis
const co2 = entite('CO2'), nh4 = entite('NH4p'), hp = entite('Hp'), n2 = entite('N2'), h2o = entite('H2O');
const vide = structureVide(co2); ok(!verifier(co2, vide).ok, 'schéma vide accepté');
const faux1 = { ...structureRef(co2), liens: [0, 1, 3] , lp: [0, 3, 1], ch: [0, -1, 1] }; ok(!verifier(co2, faux1).ok, 'CO2 avec charges accepté (moins bon)');
const n2simple = { ...structureRef(n2), liens: [0, 2], lp: [1, 1] }; ok(!verifier(n2, n2simple).ok, 'N2 double liaison accepté');
const nh4sansCharge = structureRef(nh4); nh4sansCharge.ch = [0, 0, 0, 0, 0]; ok(!verifier(nh4, nh4sansCharge).ok, 'NH4+ sans charge accepté');
const hpSans = structureRef(hp); hpSans.lac = [false]; ok(!verifier(hp, hpSans).ok, 'H+ sans lacune accepté');
const eauInversee = structureRef(h2o); eauInversee.lp = [1, 0, 0]; ok(!verifier(h2o, eauInversee).ok, 'H2O avec un seul doublet accepté');
// l'élève qui oublie la charge de l'ion : n_T faux serait 9 pour NH4+ s'il oubliait de retirer l'électron
ok(nT(nh4) === 8 && nT(entite('HOm')) === 8 && nT(entite('O2m')) === 8, 'n_T des ions');
// messages : Na⁺ avec lacune (message dédié), diatomique, totaux de doublets cachés, indice « lacune » différé
const nap = entite('Nap'), alcl3 = entite('AlCl3');
const napLac = structureVide(nap); napLac.lac = [true];
const vNap = verifier(nap, napLac);
ok(!vNap.ok && vNap.messages.some(m => /couche externe est déjà pleine/.test(m.txt)) && !vNap.messages.some(m => /répartit mieux/.test(m.txt)), 'Na+ avec lacune : message dédié');
ok(verifier(nap, structureRef(nap)).ok, 'Na+ de référence accepté');
ok(/à l’autre atome/.test(verifier(entite('HCl'), structureVide(entite('HCl'))).messages[0].txt), 'diatomique : « l’autre atome »');
ok(/à l’atome central/.test(verifier(h2o, structureVide(h2o)).messages[0].txt), 'triatomique : « atome central »');
const unSeul = structureRef(co2); unSeul.lp = [0, 0, 0];
const mSans = verifier(co2, unSeul, { sansNombres: true }).messages.map(m => m.txt).join(' ');
ok(/Il reste des doublets à placer/.test(mSans) && !/\d+ doublets/.test(mSans), 'sansNombres : aucun chiffre de doublets');
const surplus = structureRef(co2); surplus.lp = [2, 3, 3];
ok(/trop de doublets/.test(verifier(co2, surplus, { sansNombres: true }).messages[0].txt), 'sansNombres : trop');
const alVide = structureRef(alcl3); alVide.lac = alVide.lac.map(() => false);
ok(/lacune électronique/.test(verifier(alcl3, alVide).messages.map(m => m.txt).join(' ')), 'AlCl3 : indice lacune par défaut');
ok(!/lacune électronique/.test(verifier(alcl3, alVide, { indiceLacune: false }).messages.map(m => m.txt).join(' ')), 'AlCl3 : indice lacune différé');
console.log(ko ? `${ko} échec(s)` : 'lewisModele : tout est correct');
process.exit(ko ? 1 : 0);
