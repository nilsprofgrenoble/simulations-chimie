import * as M from './instabiliteModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC : ' + m); process.exit(1); } };
const proche = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1e-12, Math.abs(b));

// Stokes
ok(proche(M.vitesseUmS(2, 80, 2), 0.3488, 1e-3), 'Stokes r=2 µm, Δρ=80, η=2 mPa·s : 0,349 µm/s : ' + M.vitesseUmS(2, 80, 2));
ok(proche(M.vitesseStokes(4, 80, 2) / M.vitesseStokes(2, 80, 2), 4), 'v ∝ r²');
ok(proche(M.vitesseStokes(2, 80, 4) / M.vitesseStokes(2, 80, 2), 0.5), 'v ∝ 1/η');
ok(M.vitesseStokes(2, -80, 2) < 0 && M.mouvement(-80) === 'sédimentation' && M.mouvement(80) === 'crémage', 'signe de Δρ');
ok(M.deltaRho('H/E', 920) === 80 && M.deltaRho('E/H', 920) === -80, 'Δρ H/E et E/H');
ok(proche(M.dureeStokes(10, 1, 80, 1) / 86400, 6.6, 0.02), 'r=1 µm, η=1 mPa·s, 10 cm : 6,6 jours : ' + M.dureeStokes(10, 1, 80, 1) / 86400);
const t0 = M.tirageStokes(() => 0.3); ok(t0.heures > 1 && t0.heures < 1000, 'durée raisonnable');

// population
const pop = M.population(40, 11);
ok(pop.length === 40, '40 gouttes');
ok(pop.every(d => d.r >= 1.2 && d.r <= 4.2 && d.x > 0 && d.x < M.CHAMP.W && d.y > 0 && d.y < M.CHAMP.H), 'gouttes dans le champ');
let chev = 0; for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++) if (Math.hypot(pop[i].x - pop[j].x, pop[i].y - pop[j].y) < pop[i].r + pop[j].r) chev++;
ok(chev === 0, 'aucun chevauchement initial : ' + chev);
const phi = pop.reduce((s, d) => s + Math.PI * d.r * d.r, 0) / (M.CHAMP.W * M.CHAMP.H); ok(phi > 0.2 && phi < 0.5, 'fraction d’aire ' + phi);
ok(JSON.stringify(M.population(40, 11)) === JSON.stringify(pop), 'déterministe');

// Ostwald : volume conservé, petites disparaissent, grosses grossissent, nombre décroît, aucune goutte ne se déplace
const a = M.aEffectif(2, 0), tr = M.trajOstwald(pop, a, 60);
const V0 = M.volumeTotal(pop);
for (const k of [10, 40, 100, 120]) ok(proche(tr[k].reduce((s, x) => s + x, 0), V0, 1e-6), 'volume conservé à k=' + k);
const e0 = M.etatOstwald(pop, tr, 0), e30 = M.etatOstwald(pop, tr, 30), e60 = M.etatOstwald(pop, tr, 60);
ok(e0.N === 40 && e30.N < 40 && e60.N <= e30.N, 'le nombre de gouttes décroît : ' + [e0.N, e30.N, e60.N]);
ok(e30.rc > e0.rc && e60.rc > e30.rc, 'le rayon moyen croît');
const iMin = pop.reduce((m, d, i) => (d.r < pop[m].r ? i : m), 0), iMax = pop.reduce((m, d, i) => (d.r > pop[m].r ? i : m), 0);
ok(tr[60][iMin] < pop[iMin].r ** 3 && tr[60][iMax] > pop[iMax].r ** 3, 'la plus petite rétrécit, la plus grosse grossit');
const sans = M.trajOstwald(pop, M.aEffectif(0, 0), 60); ok(M.etatOstwald(pop, sans, 60).N === 40, 'solubilité nulle : rien ne bouge');
ok(M.aEffectif(2, 0.3) < 0.15 * M.aEffectif(2, 0), 'huile insoluble : ralentit fortement');
ok(M.aEffectif(2, 0.15) < M.aEffectif(2, 0) && M.aEffectif(2, 0.15) > M.aEffectif(2, 0.3), 'effet progressif');
ok(M.etatOstwald(pop, tr, 30).items.every(d => pop.some(p => p.x === d.x && p.y === d.y)), 'les gouttes ne se déplacent pas');

// Coalescence : N décroît, volume conservé, deux gouttes qui fusionnent forment une goutte de volume somme
const Ec = M.evenements(pop, M.kCoal(0.4), 'coalescence');
ok(Ec.noeuds.length > 40, 'des fusions ont lieu');
let prev = 41; for (const t of [0, 5, 10, 20, 40, 60]) { const s = M.etatCoalescence(Ec, t); ok(s.N <= prev, 'N décroît'); prev = s.N;
  if (t >= 0) ok(proche(s.items.reduce((v, d) => v + d.r ** 3, 0), V0, 1e-6) || s.items.some(d => d.fusion), 'volume conservé (hors fusion en cours) à t=' + t); }
ok(M.etatCoalescence(Ec, 0).N === 40, 'N(0) = 40');
const sFin = M.etatCoalescence(Ec, 60); ok(sFin.rc > M.rayonMoyen(pop), 'les gouttes grossissent');
const Ec2 = M.evenements(pop, M.kCoal(1), 'coalescence'); ok(M.etatCoalescence(Ec2, 60).N === 40, 'couverture totale : aucune fusion');
const Ec3 = M.evenements(pop, M.kCoal(0.9), 'coalescence'); ok(M.etatCoalescence(Ec3, 30).N > M.etatCoalescence(Ec, 30).N, 'plus de tensioactif : moins de fusions');
// N/8 → rayon ×2 (volume conservé)
ok(proche(Math.cbrt(8), 2), 'N ÷ 8 : rayon × 2');

// Floculation : le nombre d'amas décroît, la taille des gouttes ne change pas, pas de chevauchement final
const Ef = M.evenements(pop, M.kFloc(0.3), 'floculation');
const f0 = M.etatFloculation(Ef, 0), f20 = M.etatFloculation(Ef, 20), f60 = M.etatFloculation(Ef, 60);
ok(f0.N === 40 && f20.N < 40 && f60.N <= f20.N, 'amas : ' + [f0.N, f20.N, f60.N]);
ok(f60.items.every((d, i) => d.r === pop[i].r), 'les gouttes gardent leur taille');
let ch = 0; for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++) if (Math.hypot(f60.items[i].x - f60.items[j].x, f60.items[i].y - f60.items[j].y) < (pop[i].r + pop[j].r) * 0.99) ch++;
ok(ch === 0, 'amas sans chevauchement : ' + ch);
ok(f60.enAmas > 0.3, 'une grande part en amas');
ok(M.etatFloculation(M.evenements(pop, M.kFloc(1), 'floculation'), 60).N === 40, 'répulsion totale : pas d’amas');
ok(M.REVERSIBLE.floculation && !M.REVERSIBLE.coalescence, 'floculation réversible, coalescence non');

// histogramme
const h = M.histogramme(pop.map(d => d)); ok(h.reduce((a, b) => a + b, 0) === 40, 'histogramme : 40 gouttes');

// crémage
const C = M.cremage(pop, 10, 80, 1);
ok(C.monte && C.gouttes.length === 40, 'crémage : ça monte');
ok(M.fractionArrivee(C, 0) === 0 && M.fractionArrivee(C, 1000) === 1, 'toutes finissent en haut');
const C2 = M.cremage(pop, 10, 80, 100); ok(M.fractionArrivee(C2, 5) < M.fractionArrivee(C, 5), 'phase continue épaissie : plus lent');
const C3 = M.cremage(pop, 10, -80, 1); ok(!C3.monte, 'E/H : sédimentation');
ok(C.gouttes.every(g => { const p = M.positionCremage(C, g, 1000, 0.02); return p.arrive; }), 'arrivée');

// aspect macro
ok(M.aspectMacro('coalescence', { N: 40 }, 40, 2.4).couche === 0 && M.aspectMacro('coalescence', { N: 5 }, 40, 2.4).couche > 0.1, 'couche d’huile libre');
ok(M.aspectMacro('floculation', { enAmas: 0.6 }, 40, 2.4).grain === 0.6, 'grain');

// défi diagnostic
for (const ph of M.PHENOMENES) { const d = M.tirageDiagnostic(() => 0, { phen: ph }); ok(d.observations.length === 3 && d.remede.length > 10, 'diagnostic ' + ph); }

// QCM : ordre fixe, bonne réponse répartie, jamais la plus longue
{
  const { QCM } = await import('./instabiliteQcm.js');
  const L = Object.values(QCM), places = [0, 0, 0, 0];
  for (const q of L) { ok(q.ordreFixe === true && q.options.length === 4 && q.bonne >= 0 && q.bonne < 4, 'qcm structure'); places[q.bonne]++; ok(q.options[q.bonne].length < Math.max(...q.options.map(o => o.length)), 'bonne réponse jamais la plus longue : ' + q.options[q.bonne]); }
  for (let i = 1; i < L.length; i++) ok(L[i].bonne !== L[i - 1].bonne, 'jamais la même place deux fois de suite (question ' + (i + 1) + ')');
  ok(Math.max(...places) - Math.min(...places) <= 1, 'places équilibrées : ' + places.join('/'));
}
console.log(`instabiliteModele : ${n} vérifications, OK`);
