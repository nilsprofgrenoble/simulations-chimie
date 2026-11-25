import * as M from './hlbModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t;
// RHLB d'un mélange d'huiles : 80 g huile minérale (10) + 20 g alcool cétylique (15) = 11
ok(proche(M.rhlbMelange([{ rhlb: 10, m: 80 }, { rhlb: 15, m: 20 }]), 11), 'RHLB 11');
ok(proche(M.rhlbMelange([{ rhlb: 6, m: 1 }]), 6), 'une seule huile');
// HLB d'un mélange : 40 % Span 80 + 60 % Tween 80 = 10,72
ok(proche(M.hlbMelange(15, 4.3, 0.6), 0.6 * 15 + 0.4 * 4.3), 'mélange');
ok(proche(M.hlbMelange(15, 4.3, 1), 15) && proche(M.hlbMelange(15, 4.3, 0), 4.3), 'bornes');
// Fraction pour RHLB 11 avec Tween 80 / Span 80 : (11 − 4,3)/(15 − 4,3) = 0,626
const x = M.fractionA(15, 4.3, 11); ok(proche(x, 6.7 / 10.7), 'fractionA'); ok(proche(M.hlbMelange(15, 4.3, x), 11), 'aller-retour');
ok(M.fractionA(4.7, 4.3, 11) === null, 'cible hors de l’intervalle'); ok(M.fractionA(5, 5, 5) === null, 'mêmes HLB');
const c = M.croix(15, 4.3, 11); ok(proche(c.partsA, 6.7) && proche(c.partsB, 4), 'croix de Griffin'); ok(proche(c.partsA / (c.partsA + c.partsB), x), 'croix = fraction');
// masses
const m = M.masses(x, 5); ok(proche(m.mA + m.mB, 5), 'masses somme');
// stabilité : maximale à l'égalité, symétrique, décroît
ok(proche(M.stabilite(10, 10), 1), 'max'); ok(proche(M.stabilite(8, 10), M.stabilite(12, 10)), 'symétrie'); ok(M.stabilite(6, 10) < M.stabilite(8, 10), 'décroît');
ok(M.rayonGouttes(10, 10) < M.rayonGouttes(7, 10) && M.rayonGouttes(7, 10) < M.rayonGouttes(2, 10), 'rayon croît avec l’écart'); ok(M.rayonGouttes(10, 10) >= 0.8 && M.rayonGouttes(-20, 10) <= 6.01, 'bornes rayon');
ok(M.verdictHLB(7, 10) === 'trop-lipophile' && M.verdictHLB(13, 10) === 'trop-hydrophile' && M.verdictHLB(10.3, 10) === 'adapte', 'verdict');
// tables : valeurs plausibles, ids uniques, tri
ok(new Set(M.EMULSIFIANTS.map(e => e.id)).size === M.EMULSIFIANTS.length, 'ids émulsifiants'); ok(M.EMULSIFIANTS.every((e, i, L) => !i || L[i - 1].hlb <= e.hlb), 'émulsifiants triés');
ok(M.HUILES.every(h => h.rhlb > 0 && h.rhlb < 20), 'RHLB plausibles'); ok(M.huile('minerale').rhlbEH === 4, 'E/H minérale');
ok(M.emulsifiant('tween80').hlb === 15 && M.emulsifiant('span80').hlb === 4.3, 'valeurs usuelles');
// tirages
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
for (let k = 0; k < 3000; k++) {
  const t = M.tirageComposition(rnd);
  ok(t.A.hlb > t.rhlb && t.B.hlb < t.rhlb, 'émulsifiants encadrent le RHLB'); ok(t.x >= 0.1 && t.x <= 0.9, 'fraction réalisable');
  ok(proche(M.hlbMelange(t.A.hlb, t.B.hlb, t.x), t.rhlb, 1e-9), 'cible atteinte'); ok(proche(t.mA + t.mB, t.mEmul, 1e-9), 'masses'); ok(t.pctA > 10 && t.pctA < 90, 'pourcentage');
  const d = M.tirageDiagnosticHLB(rnd); ok(d.verdict !== 'adapte' && d.hlb >= 2 && d.hlb <= 17, 'diagnostic valide');
}
// QCM
try {
  const { QCM } = await import('./hlbQcm.js');
  const L = Object.values(QCM), places = [0, 0, 0, 0];
  for (const q of L) { ok(q.ordreFixe === true && q.options.length === 4 && q.bonne >= 0 && q.bonne < 4, 'qcm structure'); places[q.bonne]++; ok(q.options[q.bonne].length < Math.max(...q.options.map(o => o.length)), 'bonne réponse jamais la plus longue : ' + q.options[q.bonne]); }
  for (let i = 1; i < L.length; i++) ok(L[i].bonne !== L[i - 1].bonne, 'jamais la même place deux fois de suite (question ' + (i + 1) + ')');
  ok(Math.max(...places) - Math.min(...places) <= 1, 'places équilibrées : ' + places.join('/'));
} catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
console.log(`hlbModele : ${n} vérifications, OK`);
