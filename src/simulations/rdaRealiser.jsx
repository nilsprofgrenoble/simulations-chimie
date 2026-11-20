// Famille REA « rda-calcul » (sim 184 : radioactivité, diagramme (N, Z) et équations de désintégration, TG).
// Toutes les réponses sont des entiers EXACTS (tolRel = 0) ; les données viennent de rdaModele.js (noyaux réels, mode principal vérifié).
// Les nombres sont écrits en décimales fixes / entiers (pas de chiffres significatifs à arrondir). Test : rdaExercices.test.mjs.
import * as M from './rdaModele';

const tire = t => t[Math.floor(Math.random() * t.length)];
const dec = x => String(x).replace('-', '−');
const nomN = n => `${M.nomEl(n[0])} ${n[0] + n[1]}`;
const dN = n => <>{/^[aeiouyhéèâîô]/i.test(M.nomEl(n[0])) ? 'd’' : 'de '}<b>{nomN(n)}</b></>;
const azTxt = n => `A = ${n[0] + n[1]}, Z = ${n[0]}`;
const PART = {
  a: { txt: 'une particule α (A = 4, Z = 2)', court: 'α' },
  'b-': { txt: 'un électron (A = 0, Z = −1)', court: 'β⁻' },
  'b+': { txt: 'un positon (A = 0, Z = +1)', court: 'β⁺' },
};
const fils = d => ({ A: d.fils[0] + d.fils[1], Z: d.fils[0], s: M.sym(d.fils[0]) });
const eqCorrige = d => M.equationTexte(M.noyauAZ(d.pere), fils(d), d.mode);
// chaînes de désintégration réelles se terminant par un noyau stable de plomb
const CHAINES = [
  { dep: [90, 142], arr: [82, 126], nA: 6, nB: 4 },    // thorium 232 → plomb 208
  { dep: [92, 143], arr: [82, 125], nA: 7, nB: 4 },    // uranium 235 → plomb 207
  { dep: [92, 146], arr: [82, 124], nA: 8, nB: 6 },    // uranium 238 → plomb 206
];

export function genRDA() {
  const R = M.RESERVE;
  const garde = q => { q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && v !== q.vrai); };
  // 1. noyau fils d'une désintégration α : nombre de nucléons
  const d1 = tire(R.filter(r => r.mode === 'a')), A1 = M.A(d1.pere);
  const q1 = { id: 'rd0', type: 'num', q: <>Le noyau {dN(d1.pere)} ({azTxt(d1.pere)}) est radioactif <b>α</b>. Quel est le nombre de nucléons A du noyau fils ?</>, unite: '', vrai: A1 - 4, tolRel: 0, csMin: String(A1 - 4).length,
    aide: 'Conservation de A : A du père = A du fils + A de la particule α (A = 4, Z = 2).',
    pieges: [[A1, 'Vous avez gardé A du noyau père : la particule α emporte 4 nucléons, donc A diminue de 4.'], [A1 + 4, 'Vous avez ajouté 4 au lieu de le retrancher : le noyau fils est plus léger que le noyau père.'], [A1 - 2, 'Vous avez retranché 2 (le Z de la particule α) : c’est A de la particule, soit 4, qu’il faut retrancher.']],
    expl: <>A du fils = {A1} − 4 = <b>{A1 - 4}</b>. Équation : {eqCorrige(d1)}.</> };
  // 2. noyau fils d'une désintégration β : nombre de protons
  const d2 = tire(R.filter(r => r.mode !== 'a')), Z2 = d2.pere[0], Zf2 = d2.fils[0];
  const q2 = { id: 'rd1', type: 'num', q: <>Le noyau {dN(d2.pere)} ({azTxt(d2.pere)}) est radioactif <b>{PART[d2.mode].court}</b> : il émet {PART[d2.mode].txt}. Quel est le nombre de protons Z du noyau fils ?</>, unite: '', vrai: Zf2, tolRel: 0, csMin: String(Zf2).length,
    aide: 'Conservation de la charge : Z du père = Z du fils + Z de la particule émise (Z vaut −1 pour l’électron, +1 pour le positon).',
    pieges: [[Z2, 'Vous avez gardé Z du noyau père : dans une désintégration β, un neutron devient un proton (β⁻) ou un proton devient un neutron (β⁺), donc Z change de 1.'], [d2.mode === 'b-' ? Z2 - 1 : Z2 + 1, 'Le signe est inversé : avec Z du père = Z du fils + Z de la particule, un électron (−1) donne un fils plus chargé, un positon (+1) un fils moins chargé.'], [M.A(d2.pere), 'Vous avez donné A du noyau père, qui ne change pas : on demande Z du noyau fils.']],
    expl: <>Z du fils = {Z2} − ({dec(M.PARTICULES[d2.mode].Z)}) = <b>{Zf2}</b>. Équation : {eqCorrige(d2)}.</> };
  // 3. noyau père : nombre de protons, à partir du noyau fils et de la particule émise
  const d3 = tire(R), Zp3 = M.PARTICULES[d3.mode].Z, Z3 = d3.pere[0];
  const q3 = { id: 'rd2', type: 'num', q: <>Un noyau père X, radioactif <b>{PART[d3.mode].court}</b>, se désintègre en <b>{nomN(d3.fils)}</b> ({azTxt(d3.fils)}) en émettant {PART[d3.mode].txt}. Quel est le nombre de protons Z du noyau père X ?</>, unite: '', vrai: Z3, tolRel: 0, csMin: String(Z3).length,
    aide: 'Conservation de la charge : Z du père = Z du fils + Z de la particule émise.',
    pieges: [[d3.fils[0], 'Vous avez donné Z du noyau fils : il faut ajouter le Z de la particule émise (Z du père = Z du fils + Z de la particule).'], [d3.fils[0] - Zp3, 'Le signe est inversé : Z du père = Z du fils + Z de la particule, avec Z de la particule égal à ' + dec(Zp3) + '.'], [M.A(d3.pere), 'Vous avez donné A du noyau père : on demande son nombre de protons Z.']],
    expl: <>Z du père = {d3.fils[0]} + ({dec(Zp3)}) = <b>{Z3}</b> ; A du père = {M.A(d3.fils)} + {M.PARTICULES[d3.mode].A} = {M.A(d3.pere)}. Équation : {eqCorrige(d3)}.</> };
  // 4. chaîne : nombre de α ou de β⁻
  const ch = tire(CHAINES), dep = { A: ch.dep[0] + ch.dep[1], Z: ch.dep[0] }, arr = { A: ch.arr[0] + ch.arr[1], Z: ch.arr[0] }, cherche = tire(['a', 'b-']);
  const vrai4 = cherche === 'a' ? ch.nA : ch.nB, dA = dep.A - arr.A, dZ = dep.Z - arr.Z;
  const q4 = { id: 'rd3', type: 'num', q: <>Le noyau {dN(ch.dep)} ({azTxt(ch.dep)}) se transforme en noyau stable {dN(ch.arr)} ({azTxt(ch.arr)}) par une suite de désintégrations α et β⁻. Combien de désintégrations <b>{cherche === 'a' ? 'α' : 'β⁻'}</b> cette suite comporte-t-elle ?</>, unite: '', vrai: vrai4, tolRel: 0, csMin: String(vrai4).length,
    aide: 'Seules les désintégrations α changent A (de 4 à chaque fois) ; α baisse Z de 2, β⁻ augmente Z de 1.',
    pieges: cherche === 'a'
      ? [[dA, 'C’est la variation de A : chaque désintégration α retire 4 nucléons, il faut diviser par 4.'], [dA / 2, 'Vous avez divisé par 2 : chaque désintégration α retire 4 nucléons.'], [dZ, 'C’est la variation de Z : les β⁻ y contribuent aussi. Utilisez A, que seules les α modifient.']]
      : [[dZ, 'C’est la variation totale de Z : les α la font baisser aussi. Déduisez d’abord leur effet.'], [2 * ch.nA, 'C’est la baisse de Z due aux α : il reste à compenser par les β⁻ pour atteindre Z final.'], [ch.nA, 'C’est le nombre de α : on demande les β⁻.']],
    expl: <>Variation de A : {dep.A} − {arr.A} = {dA}, donc {dA} ÷ 4 = {ch.nA} désintégrations α. Z : {dep.Z} − 2 × {ch.nA} + (nombre de β⁻) = {arr.Z}, donc {arr.Z - dep.Z + 2 * ch.nA} désintégrations β⁻. {cherche === 'a' ? `Réponse : ${ch.nA}.` : `Réponse : ${ch.nB}.`}</> };
  [q1, q2, q3, q4].forEach(garde);
  return { intro: 'Radioactivité : écrire l’équation d’une désintégration (conservation de A et de Z) et compter les désintégrations d’une chaîne. Toutes les réponses sont des nombres entiers.', questions: [q1, q2, q3, q4],
    retenir: ['Conservation du nombre de nucléons : A du père = A du fils + A de la particule. Conservation de la charge : Z du père = Z du fils + Z de la particule.', 'α : particule ⁴₂He ; β⁻ : électron ⁰₋₁e ; β⁺ : positon ⁰₊₁e. Le neutrino ou l’antineutrino (A = 0, Z = 0) ne change aucun calcul.', 'α : A − 4 et Z − 2 ; β⁻ : Z + 1 ; β⁺ : Z − 1 (A inchangé pour β).', 'Dans une chaîne : nombre de α = variation de A divisée par 4 ; les β⁻ complètent la variation de Z.'] };
}
