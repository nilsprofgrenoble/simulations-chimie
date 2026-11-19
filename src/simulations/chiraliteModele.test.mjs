// Test du modèle « chiralité et configuration R/S » : node src/simulations/chiraliteModele.test.mjs
import assert from 'node:assert';
import * as M from './chiraliteModele.js';

let nTests = 0;
const ok = (c, msg) => { nTests++; assert(c, msg); };
const egal = (a, b, msg) => { nTests++; assert.deepStrictEqual(a, b, msg); };

// ───────── 1. Graphes : formules brutes et écriture semi-développée cohérentes avec le SMILES ─────────
const compter = g => { const c = {}; g.el.forEach(e => { c[e] = (c[e] || 0) + 1; }); return c; };
const FORMULES = { lactique: { C: 3, H: 6, O: 3 }, chloropropanoique: { C: 3, H: 5, Cl: 1, O: 2 }, bromochloroethane: { C: 2, H: 4, Br: 1, Cl: 1 }, bcfm: { C: 1, H: 1, Br: 1, Cl: 1, F: 1 },
  methylhexane: { C: 7, H: 16 }, serine: { C: 3, H: 7, N: 1, O: 3 }, cysteine: { C: 3, H: 7, N: 1, O: 2, S: 1 }, hydroxybutanal: { C: 4, H: 8, O: 2 }, aminopropanol: { C: 3, H: 9, N: 1, O: 1 },
  bromochloropropane: { C: 3, H: 6, Br: 1, Cl: 1 }, glyceraldehyde: { C: 3, H: 6, O: 3 }, malique: { C: 4, H: 6, O: 5 }, aminobutanoique: { C: 4, H: 9, N: 1, O: 2 },
  threonine: { C: 4, H: 9, N: 1, O: 3 }, isoleucine: { C: 6, H: 13, N: 1, O: 2 }, propan2ol: { C: 3, H: 8, O: 1 }, glycine: { C: 2, H: 5, N: 1, O: 2 }, chloropentane: { C: 5, H: 11, Cl: 1 },
  chloromethylpropanoique: { C: 4, H: 7, Cl: 1, O: 2 }, ethanol: { C: 2, H: 6, O: 1 }, glycolique: { C: 2, H: 4, O: 3 } };
for (const m of M.CATALOGUE) {
  egal(compter(m.g), FORMULES[m.id], `formule brute de ${m.id}`);
  egal(M.compositionEtiquette(m.semi.replace(/–/g, '')), compter(m.g), `écriture semi-développée de ${m.id} : ${m.semi}`);
  // chaque carbone a exactement 4 liaisons (H compris), O 2, N 3, halogène 1
  m.g.el.forEach((e, i) => { const v = m.g.voisins[i].reduce((s, x) => s + x.ordre, 0); ok(v === { C: 4, N: 3, O: 2, S: 2, H: 1, Cl: 1, Br: 1, F: 1, I: 1 }[e], `valence de l'atome ${i} (${e}) dans ${m.id}`); });
}
ok(M.CATALOGUE.length >= 20, 'catalogue assez riche');
// Molécules interdites (documents de la séquence d'origine) : aucune ne doit figurer dans le catalogue
const INTERDITES = ['butan-2-ol', 'aminochlorométhanol', '1-bromo-1,2-dichloro-2-iodoéthane', '3-chlorobutan-2-ol', 'glucose', 'mannose', 'galactose', 'tartrique', 'thalidomide', 'limonène', 'menthol', 'aspartame', 'citral', 'néral', '3-méthylpent-2-ène'];
for (const m of M.CATALOGUE) INTERDITES.forEach(x => ok(!m.nom.toLowerCase().includes(x), `${m.id} : molécule interdite ${x}`));
const SMILES_INTERDIT = ['CCC(O)C'];   // butan-2-ol : CH3-CH2-CH(OH)-CH3
for (const m of M.CATALOGUE) ok(!SMILES_INTERDIT.includes(m.smiles), `${m.id} : SMILES interdit`);

// ───────── 2. Étiquettes des groupes = composition réelle de la branche ─────────
for (const m of M.CATALOGUE) for (const c of m.centres) {
  const noms = [];
  m.g.voisins[c].forEach(({ j }) => {
    const etiq = M.etiquette(m, c, j);
    noms.push(etiq);
    egal(M.compositionEtiquette(etiq), M.compositionBranche(m.g, c, j), `${m.id} : étiquette « ${etiq} » du voisin ${j} de l'atome ${c}`);
  });
  ok(noms.length === 4, `${m.id} : 4 voisins autour de l'atome ${c}`);
}

// ───────── 3. Priorités CIP (rangs attendus écrits à la main, avec les règles du cours) ─────────
const ATTENDU = {
  lactique: { 1: ['OH', 'COOH', 'CH₃', 'H'] }, chloropropanoique: { 1: ['Cl', 'COOH', 'CH₃', 'H'] }, bromochloroethane: { 1: ['Br', 'Cl', 'CH₃', 'H'] }, bcfm: { 0: ['Br', 'Cl', 'F', 'H'] },
  methylhexane: { 2: ['CH₂CH₂CH₃', 'CH₂CH₃', 'CH₃', 'H'] }, serine: { 2: ['NH₂', 'COOH', 'CH₂OH', 'H'] }, cysteine: { 2: ['NH₂', 'CH₂SH', 'COOH', 'H'] },
  hydroxybutanal: { 2: ['OH', 'CHO', 'CH₂CH₃', 'H'] }, aminopropanol: { 1: ['NH₂', 'CH₂OH', 'CH₃', 'H'] }, bromochloropropane: { 1: ['Br', 'CH₂Cl', 'CH₃', 'H'] },
  glyceraldehyde: { 2: ['OH', 'CHO', 'CH₂OH', 'H'] }, malique: { 3: ['OH', 'COOH', 'CH₂COOH', 'H'] }, aminobutanoique: { 2: ['NH₂', 'COOH', 'CH₂CH₃', 'H'] },
  threonine: { 3: ['NH₂', 'COOH', 'CH(OH)CH₃', 'H'], 1: ['OH', 'CH(NH₂)COOH', 'CH₃', 'H'] },
  isoleucine: { 4: ['NH₂', 'COOH', 'CH(CH₃)CH₂CH₃', 'H'], 2: ['CH(NH₂)COOH', 'CH₂CH₃', 'CH₃', 'H'] },
};
for (const m of M.CATALOGUE) for (const c of m.centres) {
  const cl = M.classementCIP(m.g, c);
  if (ATTENDU[m.id]) {
    ok(cl.distincts, `${m.id} atome ${c} : 4 substituants distincts`);
    egal(cl.ordre.map(x => M.etiquette(m, c, x.j)), ATTENDU[m.id][c], `priorités CIP de ${m.id} (atome ${c})`);
    ok(M.estAsymetrique(m.g, c), `${m.id} : carbone asymétrique`);
  } else ok(!cl.distincts && !M.estAsymetrique(m.g, c), `${m.id} : le carbone central ne doit pas être asymétrique`);
}
// chiralité : 15 molécules chirales, 6 non chirales
egal(M.CATALOGUE.filter(M.estChirale).map(m => m.id).sort(), Object.keys(ATTENDU).sort(), 'liste des molécules chirales');
egal(M.ACHIRALES.map(m => m.id).sort(), ['chloromethylpropanoique', 'chloropentane', 'ethanol', 'glycine', 'glycolique', 'propan2ol'], 'molécules non chirales');
egal(M.centresAsym(M.parId('threonine')).length, 2, 'thréonine : 2 carbones asymétriques');
egal(M.centresAsym(M.parId('isoleucine')).length, 2, 'isoleucine : 2 carbones asymétriques');
for (const m of M.CHIRALES_1) egal(M.centresAsym(m).length, 1, `${m.id} : un seul carbone asymétrique`);
// les carbones asymétriques trouvés automatiquement sont exactement ceux déclarés
for (const m of M.CATALOGUE) egal(M.carbonesAsymetriques(m.g).sort(), M.centresAsym(m).sort(), `${m.id} : recherche automatique des carbones asymétriques`);

// détails d'explication
const fl = M.fichePriorites(M.parId('lactique').g, 1);
egal(fl.map(x => x.voisins.join('')), ['H', 'OOO', 'HHH', ''], 'lactique : voisins de OH, COOH, CH₃, H (C=O compté deux fois)');
const fc = M.fichePriorites(M.parId('cysteine').g, 2);
egal(fc.map(x => x.voisins.join('')), ['HH', 'SHH', 'OOO', ''], 'cystéine : voisins de NH₂, CH₂SH, COOH, H');
const rc = M.raisonsPriorites(M.parId('cysteine').g, 2);
egal(rc[1], { de: 2, a: 3, couche: 2, ensA: ['S', 'H', 'H'], ensB: ['O', 'O', 'O'] }, 'cystéine : CH₂SH l’emporte sur COOH à la couche 2 (S avant O)');
const rl = M.raisonsPriorites(M.parId('lactique').g, 1);
egal(rl[0].couche, 1, 'lactique : OH / COOH décidé à la couche 1'); egal(rl[1], { de: 2, a: 3, couche: 2, ensA: ['O', 'O', 'O'], ensB: ['H', 'H', 'H'] }, 'lactique : COOH / CH₃ à la couche 2');
egal(M.raisonsPriorites(M.parId('methylhexane').g, 2)[0].couche, 3, '3-méthylhexane : propyle / éthyle décidé à la couche 3');

// ───────── 4. Vérité terrain : configurations connues, calculées sur des projections de FISCHER (indépendantes du dessin de Cram) ─────────
// Projection de Fischer : liaisons verticales vers l'arrière, horizontales vers l'observateur.
const s = 0.8, h = 0.6;
const FISCHER = { haut: [0, s, -h], bas: [0, -s, -h], gauche: [-s, 0, h], droite: [s, 0, h] };
function configFischer(m, c, placement) {          // placement : { haut:'COOH', ... } (étiquettes)
  const cl = M.classementCIP(m.g, c);
  const vec = x => FISCHER[Object.keys(placement).find(k => placement[k] === M.etiquette(m, c, x.j))];
  const [a, b, d] = cl.ordre.slice(0, 3).map(vec);
  return M.dot(a, M.cross(b, d)) < 0 ? 'R' : 'S';
}
const lm = id => M.parId(id);
egal(configFischer(lm('aminobutanoique'), 2, { haut: 'COOH', bas: 'CH₂CH₃', gauche: 'NH₂', droite: 'H' }), 'S', 'L-acide 2-aminobutanoïque = (S)');
egal(configFischer(lm('serine'), 2, { haut: 'COOH', bas: 'CH₂OH', gauche: 'NH₂', droite: 'H' }), 'S', 'L-sérine = (S)');
egal(configFischer(lm('cysteine'), 2, { haut: 'COOH', bas: 'CH₂SH', gauche: 'NH₂', droite: 'H' }), 'R', 'L-cystéine = (R) (S passe avant O)');
egal(configFischer(lm('glyceraldehyde'), 2, { haut: 'CHO', bas: 'CH₂OH', droite: 'OH', gauche: 'H' }), 'R', 'D-glycéraldéhyde = (R)');
egal(configFischer(lm('glyceraldehyde'), 2, { haut: 'CHO', bas: 'CH₂OH', gauche: 'OH', droite: 'H' }), 'S', 'L-glycéraldéhyde = (S)');
egal(configFischer(lm('lactique'), 1, { haut: 'COOH', bas: 'CH₃', gauche: 'OH', droite: 'H' }), 'S', 'acide L-lactique = (S)');
egal(configFischer(lm('malique'), 3, { haut: 'COOH', bas: 'CH₂COOH', gauche: 'OH', droite: 'H' }), 'S', 'acide L-malique = (S)');
egal([configFischer(lm('threonine'), 3, { haut: 'COOH', bas: 'CH(OH)CH₃', gauche: 'NH₂', droite: 'H' }), configFischer(lm('threonine'), 1, { haut: 'CH(NH₂)COOH', bas: 'CH₃', gauche: 'H', droite: 'OH' })], ['S', 'R'], 'L-thréonine = (2S,3R)');
egal([configFischer(lm('isoleucine'), 4, { haut: 'COOH', bas: 'CH(CH₃)CH₂CH₃', gauche: 'NH₂', droite: 'H' }), configFischer(lm('isoleucine'), 2, { haut: 'CH(NH₂)COOH', bas: 'CH₂CH₃', gauche: 'CH₃', droite: 'H' })], ['S', 'S'], 'L-isoleucine = (2S,3S) (CH₃ à gauche en C3)');

// Cas calculé à la main (dessin de Cram) : A = priorité 1 (haut gauche), B = 2 (haut droite), W = 3 (coin plein), D = 4 (tirets) → horaire → R
{
  const m = lm('lactique'), aff = M.affDepuis(m, 1, { A: 'OH', B: 'COOH', W: 'CH₃', D: 'H' });
  egal(M.configuration(m.g, 1, aff), 'R', 'lactique, OH en haut à gauche, COOH en haut à droite, CH₃ en coin plein, H en tirets : R');
  egal(M.configuration(m.g, 1, M.echanger(aff, 'A', 'B')), 'S', 'l’échange de OH et COOH donne S');
}

// ───────── 5. Exhaustif : 24 dispositions × tous les carbones asymétriques × les deux orientations ─────────
let nCas = 0;
const compteur = { R: 0, S: 0 };
for (const m of M.CATALOGUE) for (const c of m.centres) {
  const asym = M.estAsymetrique(m.g, c);
  for (const orient of ['bas', 'haut']) for (const aff of M.toutesLesAff(m, c, orient)) {
    const r = M.configuration(m.g, c, aff);
    if (!asym) { egal(r, null, `${m.id} : pas de configuration pour un carbone non asymétrique`); continue; }
    nCas++; compteur[r]++;
    // (a) l'image miroir inverse R et S : trois façons indépendantes de la calculer
    egal(M.configurationMiroir(m.g, c, aff), M.inverse(r), `${m.id} : vecteurs réfléchis → configuration inverse`);
    egal(M.configuration(m.g, c, M.affMiroir(aff)), M.inverse(r), `${m.id} : échange de A et B → configuration inverse`);
    // (b) échanger deux emplacements quelconques inverse la configuration ; une permutation circulaire de trois la conserve
    for (const [e1, e2] of [['A', 'B'], ['A', 'W'], ['A', 'D'], ['B', 'W'], ['B', 'D'], ['W', 'D']]) egal(M.configuration(m.g, c, M.echanger(aff, e1, e2)), M.inverse(r), `${m.id} : transposition ${e1}${e2}`);
    const circ = { ...aff, A: aff.B, B: aff.W, W: aff.A };
    egal(M.configuration(m.g, c, circ), r, `${m.id} : permutation circulaire de trois groupes`);
    // (c) vue dans l'axe : le sens de rotation de 1 → 2 → 3 donne la même configuration
    egal(M.configurationParSens(m.g, c, aff), r, `${m.id} : sens de rotation dans l'axe`);
    egal(M.sensDansLAxe(m.g, c, aff), r === 'R' ? 'horaire' : 'antihoraire', `${m.id} : R = horaire`);
    // (d) caméra : au départ vue de face, à l'arrivée le substituant 4 est exactement derrière le carbone, le 1 en haut
    const base = M.baseVue(m.g, c, aff);
    const R0 = M.cameraA(m.g, c, aff, 0), R1 = M.cameraA(m.g, c, aff, 1);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) ok(Math.abs(R0[i][k] - (i === k ? 1 : 0)) < 1e-9, 'caméra initiale = identité');
    const proj = j => M.projeter(R1, M.vecteur3D(aff, j));
    const p4 = proj(base.ordre[3].j), p1 = proj(base.ordre[0].j);
    ok(Math.abs(p4[0]) < 1e-9 && Math.abs(p4[1]) < 1e-9 && p4[2] < -0.99, `${m.id} : substituant 4 derrière`);
    ok(Math.abs(p1[0]) < 1e-9 && p1[1] > 0.5, `${m.id} : substituant 1 en haut`);
    ok(base.ordre.slice(0, 3).every(x => proj(x.j)[2] > 0.3), `${m.id} : substituants 1, 2, 3 devant le carbone`);
    for (const t of [0.25, 0.5, 0.75]) { const Rt = M.cameraA(m.g, c, aff, t); ok(Rt.flat().every(Number.isFinite), 'caméra finie'); for (const j of base.ordre) ok(M.projeter(Rt, M.vecteur3D(aff, j.j)).every(Number.isFinite), 'projection finie'); }
    // la rotation conserve les longueurs
    const v = M.vecteur3D(aff, base.ordre[1].j), pv = M.projeter(M.cameraA(m.g, c, aff, 0.6), v);
    ok(Math.abs(Math.hypot(...pv) - Math.hypot(...v)) < 1e-9, 'rotation = isométrie');
  }
}
ok(nCas > 700, `assez de cas testés (${nCas})`);
ok(compteur.R === compteur.S, 'autant de R que de S sur l’ensemble des dispositions');

// Lecture directe sur le dessin : n°4 en tirets → la lettre se lit telle quelle ; n°4 en coin plein → il faut l'inverser
for (const m of M.CHIRALES_1) for (const aff of M.toutesLesAff(m, m.centres[0])) {
  const c = m.centres[0], j4 = M.classementCIP(m.g, c).ordre[3].j, r = M.configuration(m.g, c, aff), ap = M.sensApparent(m.g, c, aff);
  if (aff.D === j4) egal(ap === 'horaire' ? 'R' : 'S', r, `${m.id} : n°4 en tirets, lecture directe`);
  if (aff.W === j4) egal(ap === 'horaire' ? 'S' : 'R', r, `${m.id} : n°4 en coin plein, lecture inversée`);
}
for (const m of M.CHIRALES_1) for (const conf of ['R', 'S']) for (const dernier of [null, 'D', 'W']) {
  const aff = M.affAvecConfig(m, m.centres[0], conf, { dernier });
  egal(M.configuration(m.g, m.centres[0], aff), conf, `${m.id} : disposition demandée ${conf}`);
  if (dernier) ok(aff[dernier] === M.classementCIP(m.g, m.centres[0]).ordre[3].j, `${m.id} : le n°4 est bien à l'emplacement ${dernier}`);
}
egal(M.raisonsPriorites(M.parId('methylhexane').g, 2)[1].couche, 2, '3-méthylhexane : éthyle / méthyle décidé à la couche 2');
// ───────── 6. Deux carbones asymétriques voisins ─────────
for (const m of M.DEUX_CENTRES) {
  const combos = [[false, false], [false, true], [true, false], [true, true]].map(f => M.descripteurs(m, M.affChaine(m, f)).join(''));
  egal([...combos].sort(), ['RR', 'RS', 'SR', 'SS'], `${m.id} : les 4 combinaisons de coin plein / tirets donnent RR, RS, SR, SS`);
  const [a, b] = [M.descripteurs(m, M.affChaine(m, [false, false])), M.descripteurs(m, M.affChaine(m, [true, true]))];
  egal(b, a.map(M.inverse), `${m.id} : l'image miroir (deux échanges) inverse les deux descripteurs`);
  M.affChaine(m, [false, false]).forEach(aff => ok(['A', 'B', 'W', 'D'].every(e => Number.isInteger(aff[e])), 'dispositions complètes'));
}
egal(M.descripteurs(lm('threonine'), M.affChaine(lm('threonine'), [false, false])).join(''), 'RS', 'thréonine : disposition par défaut (2R,3S)');

// ───────── 7. Cohérence du dessin ─────────
for (const o of ['bas', 'haut']) {
  const g = M.GEOM3D[o]; const vs = Object.values(g);
  for (let i = 0; i < 4; i++) for (let k = i + 1; k < 4; k++) ok(Math.abs(M.dot(vs[i], vs[k]) + 1 / 3) < 1e-9, `${o} : tétraèdre régulier`);
}
// ───────── 7 bis. Cohérence du dessin : emplacements, orientations ─────────
for (const o of ['bas', 'haut']) {
  const g = M.GEOM[o];
  ok(Math.abs(g.A[2]) < 1e-12 && Math.abs(g.B[2]) < 1e-12, `${o} : A et B dans le plan`);
  ok(g.W[2] > 0.5 && g.D[2] < -0.5, `${o} : coin plein devant, tirets derrière`);
  const vs = Object.values(g); for (let i = 0; i < 4; i++) for (let k = i + 1; k < 4; k++) { const ang = Math.acos(M.dot(vs[i], vs[k]) / (Math.hypot(...vs[i]) * Math.hypot(...vs[k]))) * 180 / Math.PI; ok(ang > 90 && ang < 130, `${o} : angle tétraédrique (${ang.toFixed(1)}°)`); }
}
console.log(`chiraliteModele : ${nTests} vérifications, ${nCas} cas (molécule × carbone × disposition) OK`);
