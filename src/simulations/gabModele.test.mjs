import assert from 'node:assert/strict';
import * as G from './gabModele.js';
const prox = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);
// gains
prox(G.gainFiltre('bas', 1000, 1000), Math.SQRT1_2); prox(G.gainFiltre('haut', 1000, 1000), Math.SQRT1_2);
prox(G.gainFiltre('bande', 500, 100, 1000), G.gainFiltre('haut', 500, 100) * G.gainFiltre('bas', 500, 1000, 1000));
prox(G.gainFiltre('bas', 0, 100), 1); prox(G.gainFiltre('haut', 0, 100), 0); prox(G.gainFiltre('bande', 0, 100, 1000), 0); prox(G.gainFiltre('rej', 0, 100, 1000), 1);
for (const f of [10, 100, 1e3, 1e4, 1e5]) for (const t of ['bas', 'haut', 'bande', 'rej']) { const a = G.gainFiltre(t, f, 300, 5000); assert.ok(a >= 0 && a <= 1 + 1e-12, `${t} ${f} ${a}`); }
// triangle : valeur crête = amp quand n→∞ ; ici avec 9 harmoniques proche de amp
const tri = G.triangle(1000, 2); const crete = Math.max(...Array.from({ length: 2000 }, (_, i) => G.valeur(tri, i / 2000 / 1000)));
assert.ok(crete > 1.9 && crete <= 2.01, 'crête triangle ' + crete);
prox(tri[0].a, 8 * 2 / Math.PI ** 2); prox(tri[1].a, 8 * 2 / Math.PI ** 2 / 9);
// sortie
const so = G.sortie([G.raie(100, 2), G.raie(0, 1)], 'bas', 100); prox(so[0].a, 2 * Math.SQRT1_2); prox(so[1].a, 1);
prox(G.moyenne([G.raie(0, 1.5), G.raie(100, 2)]), 1.5);
// fenêtre
const w = G.fenetre([G.raie(50, 1), G.raie(5000, 1)]); prox(w.Tw, 0.012); assert.ok(w.n >= 300 && w.n <= 1400);
// défis « placer fc » : toujours réalisable, avec de la marge
let larg = 9, n = { bas: 0, haut: 0, bande: 0 };
for (let i = 0; i < 300; i++) {
  const d = G.tirageDefiFc(); n[d.type]++;
  const iv = G.intervalleFc(d.type, d.cahier);
  assert.ok(iv, `défi infaisable ${JSON.stringify(d.cahier)} ${d.type}`);
  if (G.nbCoupures(d.type) === 1) larg = Math.min(larg, Math.log10(iv.f1[1] / iv.f1[0]));
  assert.ok(d.cahier.parasites.every(f => f === 0 || (f >= 10 && f <= 1e5)), 'parasite hors axe');
  assert.ok(d.cahier.utiles.every(f => f >= 10 && f <= 1e5));
}
console.log('largeur minimale de l’intervalle (décades) :', larg.toFixed(2), n);
assert.ok(larg >= 0.25, 'intervalle trop étroit');
// diagnostic : une solution est acceptée, une mauvaise valeur donne un message
for (let i = 0; i < 100; i++) {
  const d = G.tirageDefiFc(), s = G.solutions(d.type, d.cahier)[0], r = G.diagFc(d, s[0], s[1]); assert.ok(r.ok);
  const mauvais = G.diagFc(d, d.type === 'haut' ? 1e5 : 10, d.type === 'bande' ? 10 : 1e5);
  assert.ok(!mauvais.ok && /A = \d/.test(mauvais.msg) && !/undefined|NaN/.test(mauvais.msg), mauvais.msg);
}
// types : tous les scénarios aboutissent à un message cohérent
for (let i = 0; i < 200; i++) { const d = G.tirageDefiType(); assert.ok(G.diagType(d, d.type).ok); for (const t of Object.keys(G.TYPES)) if (t !== d.type) { const r = G.diagType(d, t); assert.ok(!r.ok && !/undefined/.test(r.msg)); } }
console.log('gabModele OK');

{ // défi fc : la position de départ n'est jamais déjà gagnante, et un réglage valable existe
  let bad = 0;
  for (let i = 0; i < 3000; i++) { const d = G.tirageDefiFc(); if (G.diagFc(d, d.f1, d.f2).ok) bad++; const iv = G.intervalleFc(d.type, d.cahier); if (!iv) bad++; }
  console.log(bad === 0 ? 'OK départ non gagnant' : 'ÉCHEC départ gagnant: ' + bad); if (bad) process.exit(1);
}
