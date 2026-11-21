// Test du modèle rhéologique (node src/simulations/rheoCourbesModele.test.mjs)
import assert from 'node:assert/strict';
import { PRODUITS, tauHB, etaHB, typeDe, rampe, perteRelative, tauMesure, ajusterHB, ecartRelatif, tirerFluideMystere, TYPES, GAMMAS_PEINTURES } from './rheoCourbesModele.js';

let nb = 0;
const ok = (c, m) => { assert.ok(c, m); nb++; };
const proche = (a, b, tol, m) => { assert.ok(Math.abs(a - b) <= Math.abs(b) * tol + 1e-12, `${m} : ${a} vs ${b}`); nb++; };

// 1) Cas limites : η = τ/γ̇ ; newtonien constant ; types reconnus pour chaque produit
proche(etaHB(2, { tau0: 0, K: 1.4, n: 1 }), 1.4, 1e-12, 'newtonien η = K');
proche(etaHB(300, { tau0: 0, K: 1.4, n: 1 }), 1.4, 1e-12, 'newtonien η indépendante de γ̇');
for (const [id, pr] of Object.entries(PRODUITS)) assert.equal(typeDe(pr), pr.type, id), nb++;
ok(etaHB(1, PRODUITS.shampooing) > etaHB(300, PRODUITS.shampooing), 'pseudoplastique : η décroît');
ok(etaHB(1, PRODUITS.fecule) < etaHB(300, PRODUITS.fecule), 'rhéoépaississant : η croît');
ok(etaHB(0.01, PRODUITS.boue) > 1000 * etaHB(300, PRODUITS.boue), 'plastique : η → ∞ quand γ̇ → 0');
// 2) τ(γ̇=0) : un plastique a une ordonnée à l'origine, pas un pseudoplastique
proche(tauHB(1e-9, PRODUITS.ketchup), 15, 1e-4, 'ordonnée à l’origine = τ₀');
ok(tauHB(1e-9, PRODUITS.shampooing) < 1e-3, 'pseudoplastique : τ → 0');

// 3) Thixotropie : sans effet si thixo = 0 ; retour sous l'aller si thixo > 0 ; l'aller reste inchangé au premier point
const r0 = rampe({ ...PRODUITS.shampooing, thixo: 0 });
r0.aller.forEach((t, i) => proche(t, r0.retour[i], 1e-12, 'pas de thixotropie : aller = retour'));
const r1 = rampe({ ...PRODUITS.shampooing, thixo: 0.5 });
proche(r1.aller[0], tauHB(1, PRODUITS.shampooing), 0.02, 'premier point de l’aller ≈ échantillon au repos');
r1.aller.forEach((t, i) => ok(r1.retour[i] <= t + 1e-12, 'thixotrope : retour ≤ aller'));
const perte = perteRelative(r1.aller, r1.retour, 0);
ok(perte > 0.1 && perte < 0.4, `perte à 1 s⁻¹ plausible (${perte.toFixed(3)})`);
console.log('perte relative à 1 s⁻¹ pour thixo = 0,5 :', perte.toFixed(3));

// 4) Peintures mesurées : η ×γ̇ retrouve les contraintes du fichier (A à 1 s⁻¹ : 18,29 Pa)
proche(tauMesure('A', 'aller')[0], 18.29, 0.005, 'τ A aller à 1 s⁻¹');
proche(tauMesure('B', 'aller')[9], 244.8, 0.005, 'τ B aller à 300 s⁻¹');
// 5) Ajustement : A ≈ sans seuil, B avec seuil ; K, n corrects sur données synthétiques
const sA = ajusterHB(GAMMAS_PEINTURES, tauMesure('A', 'aller'));
const sB = ajusterHB(GAMMAS_PEINTURES, tauMesure('B', 'aller'));
ok(sA.tau0 < 3, `A sans seuil net (τ₀ = ${sA.tau0})`);
ok(sB.tau0 > 8 && sB.tau0 < 20, `B : seuil apparent de l’ordre de 10 Pa (τ₀ = ${sB.tau0})`);
ok(sA.ecart < 0.05 && sB.ecart < 0.05, 'écart de l’ajustement < 5 %');
const synth = GAMMAS_PEINTURES.map((g) => tauHB(g, { tau0: 10, K: 4, n: 0.6 }));
const sy = ajusterHB(GAMMAS_PEINTURES, synth);
proche(sy.tau0, 10, 0.06, 'ajustement synthétique τ₀'); proche(sy.n, 0.6, 0.03, 'ajustement synthétique n');
console.log('A:', JSON.stringify(sA), '\nB:', JSON.stringify(sB));

// 6) Défi : 5 000 tirages, types nets, viscosité attendue cohérente avec le tableau affiché, thixotrope bien défini
const cpt = {};
for (let i = 0; i < 5000; i++) {
  const f = tirerFluideMystere();
  cpt[f.type] = (cpt[f.type] || 0) + 1;
  assert.equal(typeDe(f.p), f.type);
  // lisibilité : un plastique a τ(1 s⁻¹) ≥ 10 Pa ; un pseudoplastique a τ(1 s⁻¹) < 2 Pa
  if (f.type.startsWith('plastique')) assert.ok(f.aller[0] >= 9.5, 'plastique : seuil lisible');
  if (f.type === 'pseudoplastique') assert.ok(f.aller[0] < 2, 'pseudoplastique : τ(1) petit');
  if (f.type === 'newtonien') assert.ok(Math.abs(f.aller[4] / 300 - f.aller[0]) / f.aller[0] < 0.01, 'newtonien : η constante');
  assert.ok(f.etaVraie > 0 && isFinite(f.etaVraie));
  assert.equal(f.etaVraie, f.aller[f.gammas.indexOf(f.gq)] / f.gq);
  if (f.thixotrope) assert.ok(f.retour[0] < f.aller[0] * 0.95, 'thixotrope visible');
  else f.aller.forEach((a, k) => assert.ok(Math.abs(a - f.retour[k]) / a < 0.001, 'non thixotrope : aller = retour'));
}
TYPES.forEach((t) => assert.ok(cpt[t.id] > 700, `types équilibrés : ${t.id} ${cpt[t.id]}`));
nb += 5000;
console.log(`rheoCourbesModele : ${nb} vérifications OK`, cpt);
