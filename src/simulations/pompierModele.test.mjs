// Test : node src/simulations/pompierModele.test.mjs — lois physiques et missions du jeu « Pompiers »
import assert from 'node:assert';
import * as M from './pompierModele.js';

const proche = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-12);

// 1. Conservation du débit : v = Q / S
const h = M.hydraulique({ dMm: 45, nTuyaux: 1, qLmin: 500, pPompeBar: 10 });
assert(proche(h.v, (500 / 60000) / (Math.PI * 0.045 ** 2 / 4)), 'v = Q/S');
assert(h.v > 5.2 && h.v < 5.3, `DN45, 500 L/min : v ≈ 5,24 m/s (${h.v})`);
// 2. Pertes linéiques : λ·(L/D)·½ρv², Blasius en turbulent
assert(h.regime === 'turbulent');
assert(proche(h.lambda, 0.316 * Math.pow(h.Re, -0.25)));
assert(proche(h.dpLin, h.lambda * (20 / 0.045) * 0.5 * 1000 * h.v ** 2));
assert(h.dpLin > 8.5e4 && h.dpLin < 9e4, `≈ 0,87 bar pour 20 m (${h.dpLin})`);
// 3. Bernoulli entre pompe et lance : P_pompe = P_lance + ρgz + ΔP_charge
const g = M.hydraulique({ dMm: 70, nTuyaux: 3, qLmin: 600, pPompeBar: 12, coudes: 2, zLance: 15 });
assert(proche(g.pPompe, g.pLance + g.dpGrav + g.dpLin + g.dpSing), 'bilan de Bernoulli');
assert(proche(g.dpGrav, 1000 * 9.81 * 15));
assert(proche(g.dpSing, 2 * 0.9 * g.qdyn));
// 4. Plus long, plus étroit ou plus de débit : plus de pertes ; plus large : moins
const ref = M.hydraulique({ dMm: 70, nTuyaux: 2, qLmin: 500, pPompeBar: 10 });
assert(M.hydraulique({ dMm: 70, nTuyaux: 4, qLmin: 500, pPompeBar: 10 }).dpLin > 1.99 * ref.dpLin, 'pertes proportionnelles à L');
assert(M.hydraulique({ dMm: 45, nTuyaux: 2, qLmin: 500, pPompeBar: 10 }).dpLin > 5 * ref.dpLin, 'DN plus petit : bien plus de pertes');
assert(M.hydraulique({ dMm: 110, nTuyaux: 2, qLmin: 500, pPompeBar: 10 }).dpLin < ref.dpLin / 4);
const dbl = M.hydraulique({ dMm: 70, nTuyaux: 2, qLmin: 1000, pPompeBar: 10 });
const facteur = dbl.dpLin / ref.dpLin;
assert(facteur > 3 && facteur < 3.6, `débit doublé : pertes × ≈ 3,4 (${facteur})`);
// 5. Laminaire : λ = 64/Re
const lam = M.hydraulique({ dMm: 110, nTuyaux: 1, qLmin: 1, pPompeBar: 5 });
assert(lam.regime === 'laminaire' && proche(lam.lambda, 64 / lam.Re));
// 6. Jet : ½ρv_j² = P_lance + ½ρv² ; section de sortie par conservation du débit
const j = M.hydraulique({ dMm: 70, nTuyaux: 2, qLmin: 500, pPompeBar: 8 });
assert(proche(0.5 * 1000 * j.vJet ** 2, j.pLance + j.qdyn));
assert(proche(j.Q, Math.PI * (j.dJet / 1000) ** 2 / 4 * j.vJet), 'S_j·v_j = Q');
assert(M.hydraulique({ dMm: 45, nTuyaux: 8, qLmin: 1000, pPompeBar: 8 }).vJet === 0, 'pression négative : pas de jet');

// 7. Portée : la trajectoire à l'angle optimal passe exactement par le foyer lorsque v_eff² = g(Δh + r)
for (const [dx, dh] of [[10, 0], [30, 12], [15, -4], [20, 25]]) {
  const r = Math.hypot(dx, dh), v2 = 9.81 * (dh + r), th = Math.atan((dh + r) / dx);
  const t = dx / (Math.sqrt(v2) * Math.cos(th)), y = Math.sqrt(v2) * Math.sin(th) * t - 0.5 * 9.81 * t * t;
  assert(Math.abs(y - dh) < 1e-9, `trajectoire par (${dx}; ${dh})`);
}
// 8. Puissance du feu → débit minimal : ≈ 0,65 MJ utile par litre
const eu = 0.25 * (4180 * 80 + 2.26e6);   // J par kg (1 L = 1 kg)
assert(Math.abs(M.energieUtileParLitre() - eu) < 1e-6, 'énergie utile par litre ≈ 0,65 MJ');
assert(M.debitMini(1) === Math.ceil(1e6 / eu * 60));
assert(M.debitMini(9) > M.debitMini(1) * 8.9);

// 9. Verdicts
const m3 = M.mission(3);
assert(M.attaque(m3, { dMm: 70, nTuyaux: 8, qLmin: 500 }).verdict === 'brule', 'tuyau trop long : trop près du foyer');
assert(M.attaque(m3, { dMm: 110, nTuyaux: 4, qLmin: 500 }).verdict === 'haute', 'tuyau large : pression trop forte');
assert(M.attaque(m3, { dMm: 45, nTuyaux: 4, qLmin: 1000 }).verdict === 'basse', 'tuyau étroit : pression trop faible');
assert(M.attaque(m3, { dMm: 45, nTuyaux: 4, qLmin: 450 }).verdict === 'ok');
assert(M.attaque(m3, { dMm: 70, nTuyaux: 4, qLmin: 450 }).verdict === 'haute', 'DN 70 : encore trop de pression à ce débit');
assert(M.attaque(m3, { dMm: 70, nTuyaux: 4, qLmin: 900 }).verdict === 'ok', 'DN 70 : il faut beaucoup de débit pour perdre assez de pression');
assert(M.attaque(m3, { dMm: 45, nTuyaux: 4, qLmin: 400 }).verdict === 'debit', 'débit insuffisant');
assert(M.attaque(m3, { dMm: 70, nTuyaux: 1, qLmin: 450 }).verdict !== 'ok', 'trop loin du foyer');
assert(M.attaque(M.mission(4), { dMm: 70, nTuyaux: 1, qLmin: 500 }).verdict === 'court' || M.attaque(M.mission(4), { dMm: 70, nTuyaux: 1, qLmin: 500 }).verdict === 'haute');

// 10. Missions : départ toujours insuffisant, solutions en nombre raisonnable, diamètres variés au fil des missions
const total = M.DIAMETRES.length * M.N_MAX * ((M.DEBIT_MAX - M.DEBIT_MIN) / M.DEBIT_PAS + 1);
const dnUtiles = new Set();
for (const m of M.MISSIONS) {
  assert(!M.attaque(m, M.REGLAGE_DEPART).reussi, `mission ${m.id} : le réglage de départ ne doit pas gagner`);
  assert(M.debitMini(m.puissanceMW) > M.DEBIT_MIN, `mission ${m.id} : débit de départ insuffisant`);
  const s = M.solutions(m);
  assert(s.length >= 3, `mission ${m.id} : au moins 3 solutions (${s.length})`);
  assert(s.length <= 0.15 * total, `mission ${m.id} : pas trop de solutions (${s.length})`);
  assert(s.every(x => x.pLanceBar >= m.pMin - 1e-9 && x.pLanceBar <= m.pMax + 1e-9), 'pression dans la plage');
  s.forEach(x => dnUtiles.add(x.dMm));
}
assert(M.solutions(M.mission(6)).every(x => x.dMm > 45), 'raffinerie : le DN 45 ne suffit pas');
assert(M.solutions(M.mission(3)).every(x => x.dMm < 110), 'entrepôt : le DN 110 donne trop de pression');
assert(dnUtiles.size === 3);

// 11. Étoiles
assert(M.etoilesAttaques(1) === 3 && M.etoilesAttaques(2) === 2 && M.etoilesAttaques(3) === 1 && M.etoilesAttaques(9) === 1);
console.log('pompierModele : OK');
