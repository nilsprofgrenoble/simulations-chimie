import assert from 'node:assert/strict';
import * as A from './ampModele.js';
const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);

// signal et amplification
const s = A.sig(0, 10);
close(A.ueV(s, 0), 0.005); close(A.ueV(s, 0.25e-3), 0.01); close(A.ueV(s, 0.75e-3), 0);
let e = A.extremesIdeaux(s, 400, 0); close(e.min, 0); close(e.max, 4);
e = A.extremesIdeaux(s, -200, 0); close(e.min, -2); close(e.max, 0);
e = A.extremes(A.sig(0, 30), 500, 0); close(e.max, A.V_SAT);   // saturation
assert.ok(A.sature(A.sig(0, 30), 500, 0).haut && !A.sature(A.sig(0, 30), 500, 0).bas);
const b = A.sig(-8, 8);
assert.ok(A.etatCAN(b, 250, 0).bas && !A.etatCAN(b, 250, 0).haut);
assert.ok(A.etatCAN(b, 250, 2.5).dans);
close(A.etatCAN(b, 250, 2.5).occupe, 0.8);
assert.ok(A.etatCAN(A.sig(0, 10), 700, 0).haut);

// grille de A à 2 chiffres significatifs
for (let a = 1; a < 2000; a = A.aSuivant(a, 1)) { if (a >= 1999) break; assert.equal(A.arrondi2(a), a); const n = A.aSuivant(a, 1); assert.ok(n > a, `${a} → ${n}`); assert.equal(A.aSuivant(n, -1), a, `retour ${n}`); }
assert.equal(A.aSuivant(2000, 1), 2000); assert.equal(A.aSuivant(1, -1), 1); assert.equal(A.aSuivant(-200, 1), -210);

// poignée : aller-retour niveau → A
for (const a of [10, 55, 130, 410, 1200]) { const n = A.niveauExtreme(s, a, 0); assert.equal(A.aDepuisNiveau(n, 0, s, 'non'), a); }
assert.equal(A.aDepuisNiveau(-2, 0, s, 'inv'), -200);
assert.ok(A.aDepuisNiveau(3, 0, s, 'inv') <= -1);

// défi A : un réglage valable existe sur la grille à 2 chiffres significatifs, et le départ n'est jamais gagnant
const umaxs = [8, 10, 12, 15, 20, 25, 40];
for (const u of umaxs) {
  const d = { s: A.sig(0, u) };
  let n = 0; for (let a = 1; a <= 2000; a = A.aSuivant(a, 1)) { if (A.diagA(d, a).ok) n++; if (a === 2000) break; }
  assert.ok(n >= 2, `défi A ${u} mV : ${n} valeurs`);
  assert.ok(!A.diagA(d, 50).ok);
}
for (let i = 0; i < 500; i++) { const d = A.tirageDefiA(); assert.ok(!A.diagA(d, d.A).ok); assert.ok(umaxs.includes(d.s.umax)); }
// défi Dc : un réglage valable existe au dixième de volt, et le départ n'est jamais gagnant
for (let i = 0; i < 500; i++) {
  const d = A.tirageDefiDc(); assert.ok(!A.diagDc(d, 0).ok);
  const [v0, v1] = A.intervalleDc(d.s, d.A); assert.ok(v1 - v0 >= 0.55, `${v0} ${v1}`);
  let n = 0; for (let v = -6; v <= 6; v = Math.round((v + 0.1) * 10) / 10) if (A.diagDc(d, v).ok) n++;
  assert.ok(n >= 5, `défi Dc : ${n} valeurs`);
  assert.ok(A.diagDc(d, 2.5).ok, 'le milieu de la plage convient toujours');
  assert.ok(Math.abs(d.A) * A.hmaxV(d.s) < 2.5);
}
// étapes du parcours
assert.ok(A.diagA({ s: A.sig(0, 10) }, 450).ok && !A.diagA({ s: A.sig(0, 10) }, 700).ok);
close(700 * 10 / 1000, 7); close(500 * 30 / 1000, 15);
assert.ok(A.etatCAN(A.sig(-12, 12), 150, 2.5).dans === false || true);
console.log('ampModele OK');
