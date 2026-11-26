// Test du modèle 3D de l'E2 : node src/simulations/e23dModele.test.mjs
import assert from 'node:assert';
import { etat } from './e23dModele.js';
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(...a), sub = (a, b) => a.map((x, i) => x - b[i]);
const e0 = etat(0);
// départ : H et Br anti-périplanaires (dihédre 180°) : H en +y, Br en −y
ok(Math.abs(dot(e0.dirH, e0.dirBr.map(Number)) - (-(8 / 9) - 1 / 9)) < 1e-9, 'H et Br de part et d’autre');
ok(e0.dirH[1] > 0.9 && e0.dirBr[1] < -0.9 && Math.abs(e0.dirH[2]) < 1e-9 && Math.abs(e0.dirBr[2]) < 1e-9, 'H en haut, Br en bas dans le même plan que la liaison C–C');
// départ : carbones tétraédriques (angle H–C–R = 109,47°, cos = −1/3 avec la direction C–C ... entre deux substituants : −1/3)
const cb = e0.dirsB, ds = [e0.dirH, ...cb];
for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) ok(Math.abs(dot(ds[i], ds[j]) + 1 / 3) < 1e-9, 'tétraèdre sur Cβ');
// fin : alcène plan, R dans le plan (x, z) ; la base a pris H ; Br est parti
const e1 = etat(1);
for (const v of [...e1.dirsB, ...e1.dirsC]) ok(Math.abs(v[1]) < 1e-9, 'R dans le plan de l’alcène');
ok(Math.abs(dot(e1.dirsB[0], [1, 0, 0]) + 0.5) < 1e-9 && Math.abs(dot(e1.dirsC[0], [1, 0, 0]) - 0.5) < 1e-9, 'angles de 120°');
ok(Math.abs(len(sub(e1.base, e1.H)) - 1.0) < 1e-9, 'liaison base–H de 1,0 à la fin');
ok(len(sub(e1.br, e1.ca)) > 3.5, 'Br parti');
ok(e1.opCH === 0 && e1.opBr === 0 && e1.opBH === 1 && e1.opPi === 1, 'liaisons en fin de réaction');
// les liaisons C–R gardent une longueur constante, la double liaison est visible dès que f > 0
for (let i = 0; i <= 50; i++) { const e = etat(i / 50); for (const [r, c] of [[e.rb[0], e.cb], [e.rb[1], e.cb], [e.rc[0], e.ca], [e.rc[1], e.ca]]) ok(Math.abs(len(sub(r, c)) - 1.5) < 1e-9, 'liaison C–R constante'); }
// la base ne traverse jamais le carbone
for (let i = 0; i <= 50; i++) { const e = etat(i / 50); ok(len(sub(e.base, e.cb)) > 1.5, 'la base reste loin de Cβ'); }
console.log(`e23dModele : ${n} vérifications OK`);
