// node src/simulations/hookModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './hookModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(Math.abs(M.masseReduite(12, 1) - 12 / 13) < 1e-12 && Math.abs(M.masseReduite(12, 16) - 192 / 28) < 1e-12);
// Hooke retrouve les nombres d'onde tabulés à ±8 % (ordre de grandeur)
for (const l of M.LIAISONS) { const s = M.sigmaLiaison(l); ok(Math.abs(s - l.tab) / l.tab < 0.08, `${l.id} ${s.toFixed(0)} vs ${l.tab}`); }
ok(Math.abs(M.sigmaLiaison(M.liaison('CO2')) - 1725) < 10, 'C=O');
// ordres : k croissant → σ croissant à μ égal ; masse croissante → σ décroissant
ok(M.sigmaHooke(960, 6) > M.sigmaHooke(450, 6) && M.sigmaHooke(1560, 6) > M.sigmaHooke(960, 6));
ok(Math.abs(M.sigmaHooke(500, 1) / M.sigmaHooke(500, 2) - Math.SQRT2) < 1e-9, 'facteur √2');
ok(M.sigmaLiaison(M.liaison('CH')) > M.sigmaLiaison(M.liaison('CC1')) * 2, 'H léger → σ élevé');
ok(M.sigmaLiaison(M.liaison('CC3')) > M.sigmaLiaison(M.liaison('CC2')) && M.sigmaLiaison(M.liaison('CC2')) > M.sigmaLiaison(M.liaison('CC1')));
ok(Math.abs(M.lamUm(2000) - 5) < 1e-12);
ok(M.sigmaDeMuKg(1200, 1.14e-26) > 1700 && M.sigmaDeMuKg(1200, 1.14e-26) < 1750);
// spectres : creux aux bandes
for (const m of Object.values(M.MOLECULES)) for (const b of m.bandes) ok(M.transmittance(m.bandes, b.sigma) < 1 - 0.3 * b.prof, m.nom);
ok(M.transmittance(M.bandesEthanol(1), 3340) < M.transmittance(M.bandesEthanol(0), 3340), 'lié plus absorbant à 3340');
let r = 1; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
for (let i = 0; i < 3000; i++) {
  const h = M.tirageDefiHooke(rnd); ok(h.sigma > 900 && h.sigma < 4000);
  const b = M.tirageDefiBande(rnd); ok(b.choix.length === 4 && b.choix.some(c => c.id === b.l.id) && new Set(b.choix.map(c => c.id)).size === 4, 'choix');
  for (const c of b.choix) if (c.id !== b.l.id) ok(Math.abs(c.tab - b.sigma) > 100, 'ambigu ' + c.id + ' ' + b.sigma);
}
console.log('Modèle sim 304 :', n, 'vérifications réussies.');
