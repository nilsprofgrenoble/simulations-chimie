// Test du modèle « gaz parfait » (sim 215) : node src/simulations/gazParfaitModele.test.mjs
import * as M from './gazParfaitModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.abs(b);
// équation d'état et aller-retour
ok(M.R === 8.314, 'R fournie'); ok(proche(M.kelvin(20), 293.15) && proche(M.celsius(300), 26.85), 'conversions K');
for (const [nn, th, Vl] of [[1, 20, 24], [0.5, 27, 10], [2, 100, 5]]) {
  const T = M.kelvin(th), V = M.L_m3(Vl), P = M.pression(nn, T, V);
  ok(proche(M.quantite(P, V, T), nn) && proche(M.volume(nn, T, P), V) && proche(M.temperature(P, V, nn), T), 'aller-retour PV = nRT');
}
// 1 mol à 20 °C sous 1,013 bar : ≈ 24 L (volume molaire usuel)
ok(proche(M.m3_L(M.volume(1, M.kelvin(20), M.bar_Pa(1.013))), 24.0, 0.005), 'volume molaire 20 °C : 24,0 L');
// air à 20 °C sous 1,013 bar : ρ ≈ 1,2 kg·m⁻³
const rhoAir = M.masseVolumique(M.bar_Pa(1.013), 0.0290, M.kelvin(20)); ok(rhoAir > 1.19 && rhoAir < 1.22, `ρ air = ${rhoAir}`);
ok(proche(M.masseVolumique(M.bar_Pa(1), 0.044, M.kelvin(25)), 1.7746, 0.001), 'ρ CO₂ 25 °C, 1,00 bar');
// vitesse quadratique du diazote à 300 K : ≈ 517 m·s⁻¹
const vq = M.vitesseQuadratique(300, 0.028); ok(vq > 515 && vq < 519, `vq N₂ = ${vq}`);
ok(M.vitesseQuadratique(600, 0.028) / vq > 1.41 && M.vitesseQuadratique(600, 0.028) / vq < 1.42, 'vq ∝ √T');
// transformations à n constant
ok(proche(M.pressionEtat2(1.5, 4.0, 290.15, 2.0, 350.15), 1.5 * 4 * 350.15 / (290.15 * 2)), 'P2');
{ const T1 = 300, V1 = 0.01, P1 = M.pression(1, T1, V1), V2 = 0.004, T2 = 450, P2 = M.pression(1, T2, V2);
  ok(proche(M.pressionEtat2(P1, V1, T1, V2, T2), P2) && proche(M.volumeEtat2(P1, V1, T1, P2, T2), V2) && proche(M.temperatureEtat2(P1, V1, T1, P2, V2), T2), 'états 1 et 2 cohérents avec PV = nRT'); }
// qualitatif : T double à V constant → P double ; V divisé par 2 à T constante → P double
ok(proche(M.pression(1, 600, 0.01) / M.pression(1, 300, 0.01), 2), 'T×2 → P×2'); ok(proche(M.pression(1, 300, 0.005) / M.pression(1, 300, 0.01), 2), 'V/2 → P×2');
// animation : nombre de molécules croissant avec n, vitesse croissante avec T, décroissante avec M
ok(M.nbMolecules(0.25) < M.nbMolecules(1) && M.nbMolecules(1) < M.nbMolecules(2) && M.nbMolecules(2) <= 32 && M.nbMolecules(0.1) >= 8, 'nbMolecules');
ok(M.vitesseRelative(600, 28) > M.vitesseRelative(300, 28) && M.vitesseRelative(300, 4) > M.vitesseRelative(300, 44) && proche(M.vitesseRelative(300, 28), 1), 'vitesse relative');
// gaz réel : constantes critiques du CO₂, limite de gaz parfait, règle des aires, palier de liquéfaction
ok(M.Tc > 300 && M.Tc < 308 && M.Pc > 7.2e6 && M.Pc < 7.6e6, `Tc = ${M.Tc}, Pc = ${M.Pc}`);
for (const T of [350, 500]) for (const V of [0.5, 1, 5]) ok(Math.abs(M.ecartRelatif(1, T, V * 1e-3 * 100)) < 0.1, 'à grand volume, gaz réel ≈ gaz parfait');
ok(Math.abs(M.ecartRelatif(1, 293.15, 0.1)) < 0.03, 'à 100 L, écart < 3 %');
{ const T = 293.15, s = M.volumesSaturation(T), Ps = M.pressionSaturation(T);
  ok(s && s.liquide < s.gaz && Ps > 5.0e6 && Ps < 7.2e6, `Psat(293 K) = ${Ps / 1e5} bar`);
  ok(s.liquide > 6e-5 && s.liquide < 1.2e-4 && s.gaz > 1.6e-4 && s.gaz < 3e-4, `volumes de saturation ${s.liquide} ${s.gaz}`);
  // palier : pression constante entre liquide et gaz ; aire de Maxwell nulle (intégrale numérique de la courbe vdW)
  const a = M.pressionReelle(1, T, (s.liquide + s.gaz) / 2), b = M.pressionReelle(1, T, s.liquide * 1.3);
  ok(proche(a, Ps, 1e-9) && proche(b, Ps, 1e-9), 'palier');
  const t = T / M.Tc, vl = s.liquide / M.Vc, vg = s.gaz / M.Vc; let I = 0; const N = 20000, h = (vg - vl) / N;
  for (let k = 0; k < N; k++) { const v = vl + (k + 0.5) * h; I += (8 * t / (3 * v - 1) - 3 / (v * v) - Ps / M.Pc) * h; }
  ok(Math.abs(I) < 1e-4, `aire de Maxwell ${I}`);
  ok(M.pressionReelle(1, T, s.gaz * 1.5) < Ps && M.pressionReelle(1, T, s.liquide * 0.8) > Ps, 'hors palier : gaz sous Psat, liquide au-dessus');
  // à haute pression (petit volume) le gaz parfait surestime P et à volume intermédiaire la valeur parfaite est plus grande
  ok(M.pression(1, T, 0.5e-3) > M.pressionReelle(1, T, 0.5e-3), 'à 0,50 L, P parfait > P réel'); }
ok(M.volumesSaturation(320) === null, 'pas de palier au-dessus de Tc');
// à haute température et petit volume, volume propre : P réel > P parfait
ok(M.pressionReelle(1, 500, 0.06e-3) > M.pression(1, 500, 0.06e-3), 'volume propre : P réel > P parfait à très petit volume');
// tirages
for (let k = 0; k < 3000; k++) {
  const d = M.tirageEtat(); ok(d.rep1 >= 0.8 && d.rep2 <= 15 && d.rep3 >= 330 && d.rep3 <= 800 && d.P3 > d.rep1, 'tirage état');
  const b = M.tirageBouteille(); ok(b.rep1 >= 0.5 && b.rep2 >= 5 && b.rep3 > b.V && b.rep3 < 400, 'tirage bouteille');
}
console.log(`${n} contrôles OK`);
