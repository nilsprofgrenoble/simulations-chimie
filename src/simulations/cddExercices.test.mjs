// Vérifie les nombres cités dans les exercices « Acides et bases » et « Synthèse organique » : node src/simulations/cddExercices.test.mjs
import assert from 'node:assert/strict';
import * as m from './acidesBasesModele.js';
const pres = (x, y, tol = 0.01) => assert.ok(Math.abs(x - y) <= tol * Math.abs(y), `${x} ≠ ${y}`);
const abs = (x, y, tol = 0.01) => assert.ok(Math.abs(x - y) <= tol, `${x} ≠ ${y}`);
// dilution de l'acide éthanoïque
abs(m.pH({ C: 1e-2, pKas: [4.8] }), 3.41, 0.01); abs(m.tauAcide(1e-2, 4.8), 0.039, 0.0005);
abs(m.pH({ C: 1e-3, pKas: [4.8] }), 3.93, 0.01); abs(m.tauAcide(1e-3, 4.8), 0.118, 0.0005);
abs(m.pH({ C: 0, pKas: [], ca: 1e-2 }), 2.0, 0.01);
// tampon + 1 mmol HCl
abs(m.pHTampon({ nAH: 0.01, nA: 0.01, V: 0.1, pKa: 4.8 }), 4.8, 0.01);
abs(m.pHTampon({ nAH: 0.01, nA: 0.01, V: 0.1, pKa: 4.8, nAjout: -0.001 }), 4.71, 0.01);
abs(Math.log10(9 / 11), -0.087, 0.001);
// Henderson : pH 6,8, pKa 4,8
pres(10 ** 2, 100); abs(10 ** -6.8 / 10 ** -4.8, 0.01, 1e-9); abs(10 ** -6.8, 1.6e-7, 0.05e-7); abs(10 ** -4.8, 1.6e-5, 0.05e-5);
// équivalence acide faible
abs(m.phEquivalence({ C0: 0.1, V0: 0.02, pKas: [4.8], Cb: 0.1 }), 8.75, 0.05);
const [a, b] = [m.INDICATEURS.find(i => i.id === 'php'), m.INDICATEURS.find(i => i.id === 'bbt')];
assert.ok(m.convient(a, 8.75) && !m.convient(b, 8.75));
// acide citrique à pH 4,0
const f = m.fractions(1e-4, [3.1, 4.8, 6.4]); abs(f[1], 0.78, 0.01); assert.ok(f[1] > f[0] && f[1] > f[2]);
// estérification : K = 4, x(x+e0)... = K(a-x)(b-x)
const K = 4;
const eq = (a, b, e0 = 0, w0 = 0) => { let lo = 0, hi = Math.min(a, b); for (let i = 0; i < 200; i++) { const x = (lo + hi) / 2; if ((x + e0) * (x + w0) - K * (a - x) * (b - x) > 0) hi = x; else lo = x; } return lo; };
abs(eq(0.26, 0.26) / 0.26, 0.667, 0.001);
abs(eq(0.26, 0.78), 0.235, 0.001); abs(eq(0.26, 0.78) / 0.26, 0.90, 0.005);
abs(eq(0.26, 0.26, 0, 0.10), 0.159, 0.001); abs(eq(0.26, 0.26, 0, 0.10) / 0.26, 0.61, 0.005);
console.log('cddExercices : OK');
