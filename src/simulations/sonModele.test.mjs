// Test du modèle du son : node src/simulations/sonModele.test.mjs
import assert from 'node:assert';
import * as M from './sonModele.js';

const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);
const abs = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, `${msg} : ${a} ≠ ${b}`);
const cfg = (preset, f1 = 500, u0 = 0) => ({ preset, f1, a: M.PRESETS[preset].a.slice(), u0 });

// 1. Son pur : une composante, période 1/f1, valeur max = amplitude
const pur = cfg('pur');
assert.strictEqual(M.composantes(pur).length, 1);
proche(M.periodeMs(pur), 2, 1e-12, 'T = 2 ms à 500 Hz');
abs(M.valeur(M.composantes(pur), 0, 0), 1, 1e-12, 'u(0) = a');
abs(M.valeur(M.composantes(pur), 0, 0.002), 1, 1e-9, 'u(T) = u(0)');
abs(M.valeur(M.composantes(pur), 0, 0.001), -1, 1e-9, 'u(T/2) = −a');

// 2. Son périodique complexe : fréquences multiples du fondamental, même période que lui
const vio = cfg('violon');
const fs = M.composantes(vio).map(c => c.f);
assert.deepStrictEqual(fs, [500, 1000, 1500, 2000, 2500, 3000]);
const T = 0.002;
for (const t of [0.0003, 0.0007, 0.00123]) abs(M.valeur(M.composantes(vio), 0, t), M.valeur(M.composantes(vio), 0, t + T), 1e-9, 'périodicité du violon');
// la clarinette n’a que des harmoniques impairs
assert.deepStrictEqual(M.composantes(cfg('clarinette')).map(c => c.f), [500, 1500, 2500]);
// un fondamental faible ne change pas la période
proche(M.periodeMs(cfg('creux')), 2, 1e-12, 'période du son à fondamental faible');
for (const t of [0.0002, 0.0011]) abs(M.valeur(M.composantes(cfg('creux')), 0, t), M.valeur(M.composantes(cfg('creux')), 0, t + T), 1e-9, 'périodicité (fondamental faible)');
// les amplitudes relatives ne changent pas avec la hauteur : même timbre
assert.deepStrictEqual(M.composantes(cfg('violon', 1000)).map(c => c.a), M.composantes(vio).map(c => c.a));

// 3. Son non périodique : pas de période, fréquences non multiples
const np = cfg('nonper');
assert.strictEqual(M.periodeMs(np), null);
assert(!M.estPeriodique(np) && !M.estPeriodique(cfg('bruit')));
const fnp = M.composantes(np).map(c => c.f / 500);
assert(fnp.some(q => Math.abs(q - Math.round(q)) > 0.1), 'fréquences non multiples');
// aucun décalage de 1 à 20 ms ne ramène le signal sur lui-même (à 1 % de l’amplitude max près)
{ const u = M.echantillons(np, 40, 4000); let min = Infinity;
  for (let d = 200; d <= 2000; d++) { let e = 0; for (let i = 0; i + d <= 4000 && i < 1000; i++) e += (u[i] - u[i + d]) ** 2; min = Math.min(min, e / 1000); }
  assert(min > 0.01, `le son non périodique ne se répète pas (écart quadratique min ${min})`); }
// le bruit est reproductible et reste dans l’échelle d’affichage
const b1 = M.echantillons(cfg('bruit'), 20, 500), b2 = M.echantillons(cfg('bruit'), 20, 500);
assert.deepStrictEqual(Array.from(b1), Array.from(b2));
assert(Math.max(...b1.map(Math.abs)) < M.YMAX, 'bruit dans l’échelle');
// les timbres périodiques tiennent dans l’échelle verticale
for (const k of ['pur', 'creux', 'flute', 'clarinette', 'violon', 'nonper']) assert(M.PRESETS[k].a.reduce((s, x) => s + x, 0) < M.YMAX, `somme des amplitudes de ${k} sous l’échelle`);

// 4. Puissance moyenne ∝ amplitude² ; composante continue
proche(M.puissanceRelative(pur), 0.5, 1e-12, '⟨u²⟩ = a²/2');
proche(M.puissanceRelative({ ...pur, a: [0.5, 0, 0, 0, 0, 0] }) / M.puissanceRelative(pur), 0.25, 1e-12, 'amplitude ÷ 2 → puissance ÷ 4');
proche(M.puissanceRelative({ ...pur, a: [2, 0, 0, 0, 0, 0] }) / M.puissanceRelative(pur), 4, 1e-12, 'amplitude × 2 → puissance × 4');
proche(M.niveauRelatif(4, 1), 6.0206, 1e-4, '× 4 en puissance = + 6 dB');
proche(M.puissanceRelative(vio), 0.5 * (1 + 0.36 + 0.16 + 0.09 + 0.04 + 0.01), 1e-12, 'somme des a²/2');
// vérification numérique de ⟨u²⟩ (moyenne sur 10 périodes)
{ const u = M.echantillons(vio, 20, 20000); let m = 0; for (let i = 0; i < 20000; i++) m += u[i] ** 2; proche(m / 20000, M.puissanceRelative(vio), 2e-3, '⟨u²⟩ numérique'); }
// la composante continue décale la valeur moyenne mais n’ajoute aucune puissance acoustique
{ const c = cfg('pur', 500, 1); const u = M.echantillons(c, 20, 20000); let m = 0, q = 0; for (let i = 0; i < 20000; i++) { m += u[i]; q += (u[i] - 1) ** 2; }
  abs(m / 20000, 1, 2e-3, 'valeur moyenne = u0'); proche(q / 20000, M.puissanceRelative(c), 2e-3, '⟨(u − u0)²⟩ = puissance relative'); proche(M.puissanceRelative(c), M.puissanceRelative(pur), 1e-12, 'u0 sans effet sur la puissance acoustique'); }
// échelle verticale : jamais d’écrêtage
assert.strictEqual(M.echelleY(M.echantillons(pur, 20, 200)), 3);
{ const g = M.echelleY(M.echantillons({ ...vio, u0: 1 }, 20, 4000)); assert(g >= 4 && g >= Math.max(...M.echantillons({ ...vio, u0: 1 }, 20, 4000).map(Math.abs)), 'violon + u0 = 1 tient dans l’échelle'); }
{ const tout = { ...vio, a: [1, 1, 1, 1, 1, 1] }; const u = M.echantillons(tout, 20, 4000); assert(M.echelleY(u) >= Math.max(...u.map(Math.abs)) && M.echelleY(u) <= 7, 'six amplitudes à 1 : échelle ±6'); }

// 5. Mesure de période
proche(M.periodeDepuisRepères(2, 8, 3), 2, 1e-12, 'T = d / n');
proche(M.frequenceDepuisPeriode(2), 500, 1e-12, 'f = 1 / T');
proche(M.incertitudeRelPeriode(0.05, 6) * 3 / 3, 0.05 * Math.SQRT2 / Math.sqrt(3) / 6, 1e-12, 'incertitude relative');
assert(M.incertitudeRelPeriode(0.05, 6) < M.incertitudeRelPeriode(0.05, 2), 'plusieurs périodes : incertitude relative plus faible');
assert.strictEqual(M.fmaxSpectre(3000), 5000);
assert.strictEqual(M.fmaxSpectre(500), 1000);
assert.strictEqual(M.fmaxSpectre(6000), 10000);
assert(M.fmaxSpectre(3000) > 3000);

// 6. Niveau d’intensité sonore (P = 1,0 mW, source ponctuelle isotrope)
proche(M.surfaceSphere(1), 12.566371, 1e-6, 'S = 4π r²');
proche(M.intensite(1e-3, 1), 7.9577e-5, 1e-4, 'I à 1 m');
proche(M.niveauSource(1e-3, 1), 79.007, 1e-4, 'L à 1 m ≈ 79,0 dB');
proche(M.niveauSource(1e-3, 2), 72.987, 1e-4, 'L à 2 m ≈ 73,0 dB');
abs(M.niveauSource(1e-3, 1) - M.niveauSource(1e-3, 2), 6.0206, 1e-3, '−6 dB par doublement de la distance');
abs(M.niveauSource(1e-3, 1, 2) - M.niveauSource(1e-3, 1), 3.0103, 1e-3, '+3 dB pour deux sources identiques');
abs(M.niveauSource(1e-3, 1, 10) - M.niveauSource(1e-3, 1), 10, 1e-9, '+10 dB pour dix sources');
abs(M.niveau(M.I0), 0, 1e-12, '0 dB à I0');
abs(M.niveau(1), 120, 1e-9, '1 W/m² = 120 dB');
abs(M.niveauAutreDistance(73, 4, 16), 73 - 12.0412, 1e-3, '× 4 la distance : − 12 dB');
abs(M.niveauAutreDistance(73, 16, 4), 73 + 12.0412, 1e-3, 'distance ÷ 4 : + 12 dB');
abs(M.niveauAutreSources(70, 2), 73.0103, 1e-3, '2 sources identiques');
// on n’additionne pas les niveaux
assert(Math.abs(M.niveauAutreSources(70, 2) - 140) > 60);

// 7. Défis : tirages cohérents (1000 tirages)
for (let k = 0; k < 1000; k++) {
  const f = M.nouveauDefiFreq(); assert(f.f1 >= 150 && f.f1 <= 900 && f.f1 % 10 === 0 && M.TIMBRES_INSTRUMENTS.includes(f.timbre));
  const t = M.nouveauDefiTimbre(), ref = t.ref;
  assert.strictEqual(t.cands.length, 3); assert.deepStrictEqual(t.cands.map(c => c.id), ['A', 'B', 'C']);
  const memeH = c => c.f === ref.f, memeT = c => c.timbre === ref.timbre;
  const bonnes = t.cands.filter(c => memeH(c) && !memeT(c));
  assert.strictEqual(bonnes.length, 1, 'une seule bonne réponse'); assert.strictEqual(bonnes[0].id, t.bonne);
  assert(t.cands.filter(c => c.id !== t.bonne).every(c => !memeH(c) && Number.isInteger(c.f)), 'les autres ont une autre hauteur, en Hz entiers');
  const n = M.nouveauDefiNiveau();
  assert(n.L1 >= 60 && n.L1 <= 86);
  if (n.variante === 'distance') { assert(n.r1 !== n.r2 && Number.isInteger(n.r1) && Number.isInteger(n.r2)); abs(n.vrai, n.L1 - 20 * Math.log10(n.r2 / n.r1), 1e-12, 'défi distance'); }
  else { assert(n.n >= 2); abs(n.vrai, n.L1 + 10 * Math.log10(n.n), 1e-12, 'défi sources'); }
}
console.log('sonModele : tous les tests passent');
