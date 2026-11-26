// Test du schéma 2D de l'addition de Br₂ : node src/simulations/brMeca2d.test.mjs
import assert from 'node:assert';
import { plan2D, lettres2D } from './brMeca2dModele.js';
import { etat } from './br3dModele.js';
import { ALCENES } from './brModele.js';
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
for (const alc of ['Z', 'E', 'cyclo']) for (const face of ['dessus', 'dessous']) {
  const l3 = etat(alc, face, 1).lettres, p = plan2D(alc, face, l3);
  ok(p !== null, `${alc} ${face} : dessin trouvé`);
  ok(p.zC2 === -p.zC3, `${alc} ${face} : un Br en coin, l'autre en pointillés (addition anti)`);
  if (alc === 'E') ok(p.lettres[0] !== p.lettres[1], 'E : méso'); else ok(p.lettres.join('') === l3.join(''), `${alc} ${face} : mêmes lettres que la 3D`);
  const attendu = ALCENES[alc].descripteurs.map(d => d.replace(/[^RS]/g, '').split('').sort().join(''));
  ok(attendu.includes(p.lettres.slice().sort().join('')) || attendu.includes(p.lettres.join('')), `${alc} ${face} : descripteur annoncé par la simulation`);
}
// anti : deux Br du même côté de la feuille donneraient l'autre diastéréoisomère (syn)
ok(lettres2D('Z', 1, 1).join('') === 'SR' || lettres2D('Z', 1, 1).join('') === 'RS', 'Z syn : (R,S) méso, pas le produit de la simulation');
ok(lettres2D('E', 1, 1)[0] === lettres2D('E', 1, 1)[1], 'E syn : (R,R) ou (S,S)');
console.log(`brMeca2d : ${n} vérifications OK`);
