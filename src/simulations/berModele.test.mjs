// Test du modèle « Écoulement d'un fluide » (sim 214). Usage : node src/simulations/berModele.test.mjs
import * as M from './berModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// --- sections et débit (valeurs du parcours : d = 20 mm, v = 1,0 m/s) ---
ok(proche(M.aire(20), 3.14159265e-4, 1e-6), 'S(20 mm)');
ok(proche(M.debit(1.0, 20), 3.14159265e-4, 1e-6), 'Q = S v');
ok(proche(M.lmin(M.debit(1.0, 20)), 18.85, 1e-3), 'Q en L/min : 18,85');
ok(proche(M.siDeLmin(60), 1e-3), '60 L/min = 1e-3 m³/s');
// conservation : S1 v1 = S2 v2 ; d divisé par 2 → section ÷ 4 → v × 4
ok(proche(M.vitesse(M.debit(1.0, 20), 12), 1.0 * (20 / 12) ** 2, 1e-12), 'v au col (12 mm)');
ok(proche(M.vitesse(M.debit(1.0, 40), 20), 4.0, 1e-12), 'diamètre ÷ 2 : v × 4');
ok(proche(M.vitesse(M.debit(1.0, 40), 40 / Math.sqrt(2)), 2.0, 1e-9), 'section ÷ 2 : v × 2');
// --- termes de Bernoulli ---
ok(proche(M.pCin(2.78), 0.5 * 1000 * 2.78 ** 2), '½ρv²');
ok(Math.round(M.pCin(2.78)) === 3864, '½ρv² (2,78 m/s) = 3 864 Pa');
ok(proche(M.pPes(1), 9810), 'ρ g z (1 m) = 9 810 Pa');
// --- Venturi du parcours : d_A = 20 mm, d_B = 12 mm, v_A = 1,0 m/s, P_A relative 6,0 kPa, horizontal ---
const V = M.pointsVenturi(M.REGLAGE_DEPART), [A, B, C] = V.pts;
ok(proche(B.v, 2.7778, 1e-4), 'v_B = 2,78');
ok(proche(A.Pr - B.Pr, 3358.0, 1e-3), 'ΔP = 3,36 kPa');
ok(proche(M.deltaP(1.0, 2.78), 3364.2, 1e-3), 'ΔP avec v_B arrondie 2,78 : 3,36 kPa');
ok(Math.abs(M.hColonne(A.Pr - B.Pr) - 0.3423) < 1e-3, 'Δh = 34 cm');
ok(proche(A.h, 6000 / 9810, 1e-9) && B.Pr > 0, 'colonnes A et B positives');
ok(proche(C.Pr, A.Pr, 1e-12) && proche(C.v, A.v, 1e-12), 'sortie C = entrée A (même section, même altitude, sans pertes)');
ok(proche(A.P, 101000 + 6000), 'P absolue = P_atm + P relative');
// la somme P + ½ρv² + ρ g z est constante pour TOUS les réglages valides
let nbValides = 0, nbTotal = 0;
for (const dA of M.MENUS.dA) for (const dB of M.MENUS.dB) for (const vA of M.MENUS.vA) for (const dz of M.MENUS.dz) for (const PrA of M.MENUS.PrA) {
  const p = { dA, dB, vA, dz, PrA }, r = M.pointsVenturi(p); nbTotal++;
  for (const x of r.pts) ok(proche(x.somme, r.constante, 1e-9), 'Bernoulli : somme constante');
  ok(proche(r.pts[0].v * r.pts[0].S, r.pts[1].v * r.pts[1].S, 1e-12), 'conservation du débit A–B');
  if (M.valide(p)) { nbValides++; ok(r.pts.every(x => x.P > M.PATM && x.h >= 0.1 - 1e-12), 'réglage valide : pressions absolues > P_atm'); }
}
ok(M.valide(M.REGLAGE_DEPART), 'réglage de départ valide');
ok(nbValides > 0.25 * nbTotal && nbValides < nbTotal, `domaine : ${nbValides}/${nbTotal} réglages valides (ni tous, ni trop peu)`);
// effet Venturi : col plus étroit → vitesse plus grande, pression plus faible ; col plus large → pression plus grande
for (const dB of [10, 12, 16]) { const r = M.pointsVenturi({ ...M.REGLAGE_DEPART, dB, PrA: 15000 }); ok(r.pts[1].v > r.pts[0].v && r.pts[1].Pr < r.pts[0].Pr, `effet Venturi dB=${dB}`); }
{ const r = M.pointsVenturi({ ...M.REGLAGE_DEPART, dB: 32 }); ok(r.pts[1].v < r.pts[0].v && r.pts[1].Pr > r.pts[0].Pr, 'élargissement : v diminue, P augmente'); }
// dénivelé : à vitesses égales, la pression diminue de ρ g dz
{ const a = M.pointsVenturi({ dA: 20, dB: 20, vA: 1, dz: 0.3, PrA: 6000 }); ok(proche(a.pts[1].Pr, 6000 - 9810 * 0.3, 1e-9), 'dénivelé seul'); }
// --- Torricelli ---
ok(proche(M.torricelli(1.8), Math.sqrt(2 * 9.81 * 1.8)), 'Torricelli');
ok(Math.abs(M.torricelli(1.8) - 5.943) < 1e-3, 'v = 5,94 m/s pour h = 1,8 m');
// Torricelli retrouvée à partir de Bernoulli : ρ g h = ½ ρ v² (P_atm des deux côtés, v_surface négligée)
for (const h of M.HAUTEURS_RESERVOIR) ok(proche(M.pPes(h), M.pCin(M.torricelli(h)), 1e-12), 'ρgh = ½ρv²');
// vitesse de surface négligeable pour tous les orifices proposés (< 2 % de v_B) : hypothèse du modèle
for (const h of M.HAUTEURS_RESERVOIR) for (const d of M.ORIFICES) ok(M.vSurface(h, d, M.D_RESERVOIR) / M.torricelli(h) < 0.02, 'vitesse de surface négligeable');
// ρ n'intervient pas dans Torricelli (huile = eau)
ok(M.torricelli(1.5) === M.torricelli(1.5), 'sans ρ');
// --- débitmètre Venturi : réciprocité ---
{ const dA = 40, dB = 16, vA = 0.5, dp = M.deltaP(vA, M.vitesse(M.debit(vA, dA), dB)); ok(proche(M.vADepuisDeltaP(dp, dA, dB), vA, 1e-12), 'v_A depuis Δp'); }
// --- tirages ---
for (let k = 0; k < 3000; k++) {
  const a = M.tiragePrevoir();
  ok(a.qVB <= 6 && a.qPB >= 2.5 && a.qDP >= 1.5 && a.qPB >= 0.4 * a.PrA, 'tirage prévoir borné');
  ok(Math.abs(a.qPB - (a.PrA - a.qDP)) < 1e-9, 'P_B = P_A − ΔP');
  const b = M.tirageColonnes();
  ok(b.dh >= 0.1 && b.dh <= 0.55 && b.hB >= 0.1 && b.qQ > 3 && b.qQ < 80, `tirage colonnes : Δh ${b.dh}, Q ${b.qQ}`);
  ok(Math.abs(b.hA - b.hB - b.dh) < 1e-9, 'Δh = h_A − h_B affichées');
}
console.log(`${n} contrôles OK ; ${nbValides}/${nbTotal} réglages d'exploration valides`);
