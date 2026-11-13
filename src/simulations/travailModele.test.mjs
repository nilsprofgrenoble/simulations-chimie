// Test du modèle « Travail d'une force et énergie cinétique » : node src/simulations/travailModele.test.mjs
import assert from 'node:assert';
import * as M from './travailModele.js';

const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);

// 1. Énergie cinétique : 2,0 kg à 3,0 m/s → 9,0 J ; ×2 sur la masse → ×2 ; ×2 sur la vitesse → ×4
proche(M.ecin(2, 3), 9, 1e-12, 'Ec = ½ m v²');
proche(M.ecin(4, 3), 2 * M.ecin(2, 3), 1e-12, 'Ec proportionnelle à m');
proche(M.ecin(2, 6), 4 * M.ecin(2, 3), 1e-12, 'Ec proportionnelle à v²');
proche(M.vitesseDepuisEc(2, 9), 3, 1e-12, 'v depuis Ec');

// 2. Travail d'une force constante : cas particuliers 0°, 180°, 90°, 60°
proche(M.travailForce(10, 2, 0), 20, 1e-12, 'θ = 0° : travail moteur');
proche(M.travailForce(5, 2, 180), -10, 1e-12, 'θ = 180° : travail résistant');
assert(Math.abs(M.travailForce(10, 2, 90)) < 1e-12, 'θ = 90° : travail nul');
proche(M.travailForce(10, 2, 60), 10, 1e-12, 'θ = 60°');

// 3. Chariot : le théorème de l'énergie cinétique est vérifié (ΔEc = W) tant que le chariot ne s'arrête pas
const c1 = M.chariot({ m: 2, F: 10, theta: 0, AB: 2, vA: 0 });
proche(c1.W, 20, 1e-12, 'chariot : W'); proche(c1.dEc, c1.W, 1e-12, 'chariot : ΔEc = W'); proche(c1.vB, Math.sqrt(20), 1e-12, 'chariot : vB = √(2W/m)');
const c2 = M.chariot({ m: 2, F: 5, theta: 180, AB: 2, vA: 4 });
proche(c2.EcA, 16, 1e-12, 'Ec(A)'); proche(c2.W, -10, 1e-12, 'W résistant'); proche(c2.EcB, 6, 1e-12, 'Ec(B)'); proche(c2.vB, Math.sqrt(6), 1e-12, 'vB');
const c3 = M.chariot({ m: 2, F: 10, theta: 90, AB: 2, vA: 4 });
proche(c3.vB, 4, 1e-12, 'force perpendiculaire : la vitesse ne change pas'); assert(Math.abs(c3.dEc) < 1e-12);
const c4 = M.chariot({ m: 2, F: 10, theta: 180, AB: 2, vA: 4 });                       // 16 J d'énergie, 20 J de travail résistant : arrêt avant B
assert(c4.arrete && c4.vB === 0, 'le chariot s’arrête avant B'); proche(c4.distArret, 1.6, 1e-12, 'distance d’arrêt = Ec(A)/F');

// 4. Plan incliné sans frottement : ΣW = W(P) = ΔEc (valeurs exactes du modèle)
const base = { m: 0.2, alpha: 15, L: 1, sE: 0.2 };
const p0 = M.plan(base);
proche(p0.h, Math.sin(15 * M.RAD), 1e-12, 'dénivelé');
proche(p0.Wp, 0.2 * 9.8 * Math.sin(15 * M.RAD), 1e-12, 'W(P) = m g (zE − zF)');
proche(p0.dEc, p0.sommeW, 1e-9, 'théorème de l’Ec sans frottement');
// 5. Avec frottement : ΔEc = W(P) + W(f)
const p1 = M.plan({ ...base, f: 0.2 });
proche(p1.Wf, -0.2, 1e-12, 'W(f) = −f L'); proche(p1.dEc, p1.Wp + p1.Wf, 1e-9, 'théorème de l’Ec avec frottement');
assert(p1.vF < p0.vF, 'le frottement ralentit le mobile');
// frottement trop fort : le mobile ne descend pas
assert(!M.plan({ ...base, f: 1 }).descend, 'f > m g sin α : le mobile reste immobile');

// 6. Barrière lumineuse : l/Δt est la moyenne des vitesses aux bords de la languette, très proche de la vitesse au centre
const b = M.barriere({ a: p0.a, s: 1.2, l: 0.01 });
proche(b.vMes, b.vVraie, 1e-4, 'barrière : l/Δt ≈ vitesse au centre (languette de 1 cm)');
assert(b.vMes <= b.vVraie, 'la moyenne des vitesses ne dépasse pas la vitesse efficace');
proche(b.dt, 0.01 / b.vMes, 1e-12, 'Δt = l / v');
// une languette de 10 cm donne un écart bien plus grand, et toujours par défaut
const b10 = M.barriere({ a: p0.a, s: 1.2, l: 0.1 });
assert(Math.abs(b10.vMes / b10.vVraie - 1) > 10 * Math.abs(b.vMes / b.vVraie - 1), 'écart plus grand avec une languette plus large');

// 7. Mesure complète : ΔEc mesuré compatible avec ΣW à 1 % près pour la languette de 1 cm
const mes = M.mesurePlan({ ...base, f: 0.2 });
proche(mes.dEcMes, mes.sommeW, 0.01, 'mesure : ΔEc ≈ ΣW');
// 8. Frottement déduit d'une mesure
proche(M.frottementDeduit({ m: 0.2, alpha: 15, L: 1, dEc: mes.dEcMes }), 0.2, 0.03, 'frottement retrouvé');
// 9. Ordres de grandeur affichés dans la simulation
assert(mes.dtF > 0.002 && mes.dtF < 0.02, 'Δt de l’ordre de la milliseconde à la dizaine de ms');
console.log('travailModele : tous les tests passent');
