// Test du modèle 3D « syn ou anti » : node src/simulations/addition3dModele.test.mjs
import assert from 'node:assert';
import { etat, lettres, cisTrans, bilan } from './addition3dModele.js';
import { RES, REACTIFS } from './seleModele.js';
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const cles = Object.keys(RES);
for (const k of cles) {
  const [alc, re] = k.split('|'), X = RES[k];
  const b1 = bilan(alc, re, 'dessus'), b2 = bilan(alc, re, 'dessous');
  if (X.type === 'sans') { ok(b1.desc === null && /aucun/.test(b1.texte), `${k} : pas de stéréochimie`); continue; }
  if (alc === 'cyc') { ok(b1.texte === b2.texte && X.desc[0] === b1.texte, `${k} : ${b1.texte} attendu ${X.desc[0]}`); continue; }
  // les descripteurs lus sur la géométrie sont ceux du tableau de la simulation ; les deux faces donnent les deux énantiomères (racémique) ou la même molécule (méso)
  const attendus = X.desc.map(d => d.replace(/[(),23]/g, ''));        // « RR », « SS » ou « RS »
  const norm = d => (d === 'SR' ? 'RS' : d);
  ok(attendus.map(norm).includes(norm(b1.desc)) && attendus.map(norm).includes(norm(b2.desc)), `${k} : ${b1.desc} / ${b2.desc} dans ${attendus}`);
  if (X.resultat === 'racémique') ok(b1.desc !== b2.desc && b1.desc[0] === b1.desc[1], `${k} : deux énantiomères`);
  else ok(norm(b1.desc) === 'RS' && norm(b2.desc) === 'RS', `${k} : composé méso`);
}
// groupes ajoutés : anti = de part et d'autre du plan, syn = du même côté ; les substituants fuient le groupe ajouté
for (const alc of ['Z', 'E', 'cyc']) for (const re of Object.keys(REACTIFS)) for (const face of ['dessus', 'dessous']) {
  const e = etat(alc, re, face, 1);
  ok(REACTIFS[re].mode === 'syn' ? e.X[0][1] * e.X[1][1] > 0 : e.X[0][1] * e.X[1][1] < 0, `${alc}|${re}|${face} : syn / anti`);
  [0, 1].forEach(k => { ok(e.subs[k].a[1] * e.X[k][1] < 0 && e.subs[k].b[1] * e.X[k][1] < 0, 'substituants du côté opposé au groupe ajouté'); });
  ok(e.atomes.length >= 2, 'atomes');
  const e0 = etat(alc, re, face, 0);
  ok(e0.subs.every(s => s.a[1] === 0 && s.b[1] === 0), `${alc}|${re} : alcène plan au départ`);
  // z : Z et cyclique ont les deux substituants « a » du même côté, E de côtés opposés
  ok((e0.subs[0].a[2] * e0.subs[1].a[2] > 0) === (alc !== 'E'), `${alc} : géométrie Z / E`);
  for (let i = 0; i <= 20; i++) { const ee = etat(alc, re, face, i / 20); ok(ee.atomes.every(a => a.p.every(Number.isFinite)), 'positions finies'); }
}
ok(lettres(etat('Z', 'Br2', 'dessus', 1)).join('') !== lettres(etat('Z', 'Br2', 'dessous', 1)).join(''), 'faces opposées : énantiomères');
ok(cisTrans(etat('cyc', 'H2', 'dessus', 1)) === 'cis' && cisTrans(etat('cyc', 'Br2', 'dessus', 1)) === 'trans', 'cis / trans');
console.log(`addition3dModele : ${n} vérifications OK`);
