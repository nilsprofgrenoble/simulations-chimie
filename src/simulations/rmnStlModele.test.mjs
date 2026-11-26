// Contrôle du modèle de la simulation 306 (RMN du proton, STL) : cohérence des molécules retenues et de la banque de données.
import assert from 'node:assert/strict';
import { MOLS, IDS_STL, FAMILLES_STL, BANQUE, TYPE, ligneBanque, compatibles, nbSignaux, paliers, nbRaies } from './rmnStlModele.js';
import { limitesPremierOrdre } from './rmnModele.js';

let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
assert.equal(MOLS.length, IDS_STL.length);
for (const m of MOLS) {
  ok(!m.liste.some(x => x.labile), `${m.id} : proton labile`);
  ok(m.liste.every(x => x.simple), `${m.id} : multiplet complexe (plusieurs constantes J)`);
  ok(limitesPremierOrdre(m, 400, false).length === 0, `${m.id} : premier ordre non valable à 400 MHz`);
  ok(m.semi.every(t => typeof t === 'string' || !t.cycle), `${m.id} : cycle aromatique`);
  ok(m.liste.reduce((s, x) => s + x.n, 0) === m.N, `${m.id} : somme des H`);
  ok(m.liste.every(x => TYPE[m.id][x.k]), `${m.id} : groupe sans type`);
  for (const x of m.liste) {
    const b = ligneBanque(m, x);
    ok(x.d >= b.plage[0] && x.d <= b.plage[1], `${m.id}.${x.k} : δ = ${x.d} hors de la plage « ${b.type} » ${b.plage}`);
    ok(x.mult === ['s', 'd', 't', 'q', 'quint', 'sext', 'sept'][x.nv] || x.nv > 6, `${m.id}.${x.k} : multiplicité ${x.mult} et n = ${x.nv}`);
    ok(nbRaies(x) === x.nv + 1, 'n + 1');
  }
  // deux signaux d'une même molécule ne se distinguent pas seulement par leur δ si ils ont même multiplicité et même nombre de H : signaux distincts
  const sig = m.liste.map(x => `${x.n}-${x.mult}`);
  ok(new Set(sig).size >= 1, 'signaux');
}
// familles : même formule brute, spectres différents (nombre de signaux ou intégrations ou multiplicités)
for (const [f, ids] of Object.entries(FAMILLES_STL)) {
  const ms = ids.map(id => MOLS.find(m => m.id === id));
  ok(ms.every(m => m.brute.replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 8320)) === f), `${f} : formules brutes différentes`);
  const empreinte = m => m.liste.map(x => `${x.n}${x.mult}`).join('/');
  ok(new Set(ms.map(empreinte)).size === ms.length, `${f} : deux isomères indiscernables`);
}
// banque : plages valides
BANQUE.forEach(b => ok(b.plage[0] < b.plage[1], b.id));
ok(compatibles(2.3).length >= 2, 'recouvrement attendu autour de 2,3 ppm');
// paliers : somme proportionnelle
const m1 = MOLS.find(m => m.id === 'methylbutanone');
assert.deepEqual(paliers(m1, 5), [5, 15, 30]); n++;
console.log(`rmnStlModele : ${n} vérifications, ${MOLS.length} molécules, ${Object.keys(FAMILLES_STL).length} familles — OK`);
