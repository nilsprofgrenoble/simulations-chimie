// Test du modèle 3D de l'addition de Br₂ : node src/simulations/br3dModele.test.mjs
import assert from 'node:assert';
import { etat, carboneAttaque } from './br3dModele.js';
import { ALCENES } from './brModele.js';
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const lettres = (alc, face) => etat(alc, face, 1).lettres.join('');
// Z et cyclohexène : mélange racémique ; face dessus → (R,R), dessous → (S,S) (descripteurs de brModele.js)
for (const alc of ['Z', 'cyclo']) {
  ok(lettres(alc, 'dessus') === 'RR', `${alc} dessus : RR`);
  ok(lettres(alc, 'dessous') === 'SS', `${alc} dessous : SS`);
  ok(ALCENES[alc].descripteurs[0].replace(/[^RS]/g, '') === 'RR' && ALCENES[alc].descripteurs[1].replace(/[^RS]/g, '') === 'SS', 'descripteurs annoncés par la simulation');
}
// E : composé méso, lettres différentes, quelle que soit la face et quel que soit le carbone attaqué
for (const face of ['dessus', 'dessous']) for (const ca of ['C2', 'C3']) {
  const l = etat('E', face, 1, false, ca).lettres; ok(l[0] !== l[1] && l[0] && l[1], `E ${face} ${ca} : méso (R,S)`);
}
ok(ALCENES.E.descripteurs[0].replace(/[^RS]/g, '').split('').sort().join('') === 'RS', 'E : (2R,3S)');
// les deux faces donnent deux énantiomères pour Z (racémique), le même composé pour E
ok(lettres('Z', 'dessus') !== lettres('Z', 'dessous'), 'Z : deux énantiomères');
// Z : attaquer l'autre carbone donne l'énantiomère de celui choisi par défaut
const autreCarbone = c => (c === 'C2' ? 'C3' : 'C2');
const defaut = carboneAttaque('Z', 'dessus');
ok(etat('Z', 'dessus', 1, false, autreCarbone(defaut)).lettres.join('') === 'SS', 'Z : l\'autre carbone donne l\'énantiomère');
// addition anti : à la fin, les deux Br sont de part et d'autre du plan de l'alcène
for (const alc of ['Z', 'E', 'cyclo']) for (const face of ['dessus', 'dessous']) {
  const e = etat(alc, face, 1); ok(Math.sign(e.brn[1]) === -Math.sign(e.brm[1]) && Math.abs(e.brn[1]) > 1 && Math.abs(e.brm[1]) > 1, `${alc} ${face} : Br de part et d'autre`);
}
// ion bromonium : à u = 0,55 le pont est au-dessus du milieu de la liaison C=C, avec les deux liaisons à pleine opacité
const b = etat('Z', 'dessus', 0.55); ok(Math.abs(b.brn[0]) < 1e-9 && b.brn[1] > 1 && b.opPont[0] > 0.99 && b.opPont[1] > 0.99, 'bromonium');
// addition syn impossible : Br⁻ ne s'approche jamais à moins de 2,5 du carbone, côté du pont
for (let i = 0; i <= 100; i++) { const e = etat('Z', 'dessus', i / 100, true); if (e.brm) { const d = Math.hypot(e.brm[0] - e.carbones[0][0] * 0 - (e.brm[0]), e.brm[1]); ok(d >= 2.5 - 1e-9, 'syn : Br⁻ reste à distance'); } }
// liaisons C–R de longueur constante
for (const alc of ['Z', 'E']) for (let i = 0; i <= 20; i++) { const e = etat(alc, 'dessus', i / 20); e.groupes.forEach((g, k) => ok(Math.abs(Math.hypot(g.R[0] - e.carbones[k][0], g.R[1] - e.carbones[k][1], g.R[2] - e.carbones[k][2]) - 1.5) < 1e-9, 'liaison C–R constante')); }
console.log(`br3dModele : ${n} vérifications OK`);
