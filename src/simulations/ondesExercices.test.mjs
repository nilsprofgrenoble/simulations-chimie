// Vérifie les nombres cités dans les exercices du thème « Ondes » (diffraction, Young, réseau) : node src/simulations/ondesExercices.test.mjs
import assert from 'node:assert/strict';
const pres = (x, y, tol = 0.01) => assert.ok(Math.abs(x - y) <= tol * Math.abs(y), `${x} ≠ ${y}`);
const nm = 1e-9, um = 1e-6;
// diffraction : L = 2λD/a
pres(2 * 532 * nm * 2.5 / 0.030, 8.87e-5, 0.01);                       // fil : a = 89 µm
pres(2 * 532 * 2.5 / 0.030, 8.87e4, 0.01);                              // sans conversion des nm : 8,9×10⁴
pres(2 * 650 * nm * 2.0 / (100 * um), 0.026, 0.01);                     // fente 100 µm : L = 2,6 cm
pres(2 * 650 * nm * 2 / 0.040, 65 * um, 0.01); pres(650 * nm * 2 / 0.040, 32.5 * um, 0.01);   // relation a = 2λD/L
pres(2 * 650 * nm * 3 / 0.052, 75 * um, 0.01); pres(0.052 / 6, 8.67e-3, 0.01);                 // problème du fil : 75 µm, θ = 8,7×10⁻³
pres(650 * nm * 3 / 0.052, 37.5 * um, 0.01); pres(4 * 650 * nm * 3 / 0.052, 150 * um, 0.01);   // pièges 37,5 et 150 µm
pres(405 / 650, 0.62, 0.01); pres((405 / 650) ** 2, 0.39, 0.02); pres(650 / 405, 1.6, 0.01);    // λ : 0,6 ; 0,4 ; 1,6
pres(2 / 30, 0.067, 0.01); assert.ok(2 / 1 === 2);                      // cuve : λ/a = 0,07 et 2
assert.ok(Math.abs(Math.atan(2 / 30) * 180 / Math.PI - 3.8) < 0.1);     // ≈ 4°
// Young : i = λD/l
pres(532 * nm * 2.5 / (4.4e-3), 3.0e-4, 0.02);                          // l = 0,30 mm
pres(532 * nm * 2.0 / 0.5e-3, 2.1e-3, 0.02); pres(532 * nm * 2.0 / 0.50, 2.1e-6, 0.02);        // 2,1 mm ; 2,1 µm
pres(0.1e-3 / 2.1e-6, 47.6, 0.01);                                      // 2,1 µm : ≈ 50 fois plus petit que 0,1 mm
pres(650 / 532, 1.22, 0.01); pres((650 / 532) ** 2, 1.49, 0.01);
// réseau : sin θk = kλ/a
pres(3 * 650 * nm / (2 * um), 0.975, 0.001); pres(4 * 650 * nm / (2 * um), 1.3, 0.001);        // ordres 3 et 4
assert.equal(Math.ceil(2e-6 / 650e-9) - 1, 3);                           // ordre max 3 : 7 taches
pres(Math.asin(0.975) * 180 / Math.PI, 77.2, 0.01);
const th = 15.4 * Math.PI / 180;
pres(Math.sin(th), 0.2656, 0.001); pres(2e-6 * Math.sin(th), 531 * nm, 0.01);                   // λ = 531 nm
pres(2e-6 * Math.tan(th), 551 * nm, 0.01); pres(2e-6 / Math.sin(th), 7.5e-6, 0.01); pres(2e-6 * Math.cos(th), 1.93e-6, 0.01);
pres(532 * nm / Math.sin(th), 2.0e-6, 0.01);                            // pas = 2,0 µm = 500 traits/mm
pres(1 / 2.0e-6, 5.0e5, 0.001);                                         // par mètre
// laser vert : erreur de 3 cm sur D
{ const a = 2.0e-6, lam = 532 * nm, x = 1.0 * Math.tan(Math.asin(lam / a));
  const lamFaux = a * Math.sin(Math.atan(x / 0.97)); pres(lamFaux, 547 * nm, 0.005);
  assert.ok(lamFaux > 545 * nm - 5 * nm && lamFaux - lam > 12 * nm && lamFaux - lam < 18 * nm, 'erreur de D : +15 nm environ'); }
assert.ok(Math.abs(Math.hypot(6, 8) - 10) < 1e-9);
// COMPATIBLES : seuils
assert.ok(3 <= 2 * 2 && 13 > 2 * 5 && 12 <= 20);
console.log('ondesExercices : tous les nombres cités sont vérifiés');
