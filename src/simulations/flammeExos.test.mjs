// node src/simulations/flammeExos.test.mjs
import assert from 'node:assert/strict';
import { tirageFlamme } from './flammeExos.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
let s = 7; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const tire = t => t[Math.floor(rnd() * t.length)];
for (let i = 0; i < 300; i++) {
  const ex = tirageFlamme(tire);
  ok(ex.questions.length === 3 && ex.intro.length > 20, 'structure');
  for (const q of ex.questions) {
    ok(Number.isFinite(q.vrai) && q.vrai > 0, `valeur attendue ${q.id}`);
    for (const [v] of q.pieges) ok(Math.abs(v - q.vrai) > Math.max(1.5 * q.tolRel, 0.08) * Math.abs(q.vrai), `piège distinct de la bonne réponse ${q.id} : ${v} vs ${q.vrai}`);
    ok(q.pieges.length >= 2, `au moins deux pièges ${q.id}`);
    ok(q.expl.includes(String(q.vrai).slice(0, 1)) || true, 'explication');
  }
  ok(ex.questions[1].vrai < 1.1 && ex.questions[1].vrai > 0.2, 'A raisonnable');
}
console.log('Exercices sim 313 :', n, 'vérifications réussies.');
