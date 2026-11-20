// Test du modèle de la simulation 177 (satellites et lois de Kepler). Usage : node src/simulations/satellitesModele.test.mjs
import * as M from './satellitesModele.js';
import assert from 'node:assert/strict';
let n = 0;
const proche = (a, b, tol, msg) => { n++; assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b} (tol ${tol})`); };
const T = M.ASTRES.terre;

// satellite à 800 km : valeurs de l'énoncé du parcours
const r800 = T.R + 800e3;
proche(M.acceleration(T.M, r800), 7.74, 0.005, 'a à 800 km');
proche(M.vitesse(T.M, r800), 7451, 0.003, 'v à 800 km');
proche(M.periode(T.M, r800), 6046, 0.003, 'T à 800 km');
// cohérence : v²/r = a ; T = 2π√(r³/GM) ; T²/r³ = 4π²/GM
for (const [nom, orbs] of Object.entries(M.ORBITES)) for (const o of orbs) {
  const A = M.ASTRES[nom];
  proche(M.vitesse(A.M, o.r) ** 2 / o.r, M.acceleration(A.M, o.r), 1e-12, `a = v²/r (${nom} ${o.id})`);
  proche(M.periode(A.M, o.r), 2 * Math.PI * Math.sqrt(o.r ** 3 / (M.G * A.M)), 1e-12, `T (${nom} ${o.id})`);
  proche(M.rapportKepler(M.periode(A.M, o.r), o.r), M.constanteKepler(A.M), 1e-12, `3e loi (${nom} ${o.id})`);
  proche(M.masseDepuis(o.r, M.periode(A.M, o.r)), A.M, 1e-12, `masse (${nom} ${o.id})`);
  proche(M.rayonDepuis(A.M, M.periode(A.M, o.r)), o.r, 1e-12, `rayon (${nom} ${o.id})`);
}
// indépendance vis-à-vis de la masse du satellite : rien dans les formules ne dépend de m (vérification de signature)
assert.equal(M.acceleration.length, 2); assert.equal(M.vitesse.length, 2); assert.equal(M.periode.length, 2); n += 3;

// géostationnaire : altitude ≈ 3,6×10⁴ km, vitesse ≈ 3,07 km/s, période = jour sidéral
const geo = M.orbiteStationnaire(T);
proche(geo.h, 3.58e7, 0.005, 'altitude géostationnaire'); assert.ok(geo.h > 3.5e7 && geo.h < 3.7e7); n++;
proche(M.periode(T.M, geo.r), T.Trot, 1e-9, 'T géostationnaire');
proche(M.vitesse(T.M, geo.r), 3070, 0.01, 'v géostationnaire');
const mars = M.orbiteStationnaire(M.ASTRES.mars), jup = M.orbiteStationnaire(M.ASTRES.jupiter);
proche(mars.h, 1.70e7, 0.01, 'orbite stationnaire de Mars'); proche(jup.h, 8.9e7, 0.01, 'orbite stationnaire de Jupiter');
// ordres de grandeur réalistes des orbites proposées (périodes connues, tolérance 1 %, Lune 1 %)
const Tj = (astre, id) => M.periode(M.ASTRES[astre].M, M.ORBITES[astre].find(o => o.id === id).r) / M.JOUR;
proche(Tj('terre', 'lune'), 27.32, 0.01, 'Lune'); proche(Tj('mars', 'phobos'), 0.319, 0.01, 'Phobos'); proche(Tj('mars', 'deimos'), 1.263, 0.01, 'Deimos');
proche(Tj('jupiter', 'io'), 1.769, 0.01, 'Io'); proche(Tj('jupiter', 'callisto'), 16.69, 0.01, 'Callisto');
proche(Tj('soleil', 'terre'), 365.26, 0.01, 'Terre autour du Soleil'); proche(Tj('soleil', 'jupiter'), 4332.6, 0.01, 'Jupiter autour du Soleil');
proche(M.periode(T.M, T.R + 400e3) / 60, 92.6, 0.01, 'station spatiale (≈ 93 min)');

// données publiées : T²/a³ constant à 1 % près (Jupiter) et à 1 % (Soleil)
const ratio = (d) => M.rapportKepler(d.T * M.JOUR, d.a * 1e3);
const rJ = M.LUNES_JUPITER.map(ratio), rS = M.PLANETES.map(ratio);
for (const r of rJ) proche(r, rJ[0], 0.005, 'T²/a³ lunes de Jupiter');
for (const r of rS) proche(r, rS[2], 0.01, 'T²/a³ planètes');
proche(rJ[1], 3.114e-16, 0.002, 'ratio Europe'); proche(M.masseDepuis(671100e3, 3.551 * M.JOUR), 1.90e27, 0.01, 'masse de Jupiter d’après Europe');
proche(M.masseDepuis(149.6e9, 365.26 * M.JOUR), 1.99e30, 0.01, 'masse du Soleil d’après la Terre');

// loi des aires : mêmes durées → mêmes aires (intégration numérique), aire totale = 1 ; v_p/v_a = (1+e)/(1−e) ; v r = constante aux apsides
for (const e of [0, 0.3, 0.6, 0.8]) {
  proche(M.aireBalayee(e, 0, 1), 1, 1e-4, `aire totale e=${e}`);
  const d = 1 / 12;
  const A1 = M.aireBalayee(e, 0, d), A2 = M.aireBalayee(e, 0.5 - d / 2, 0.5 + d / 2), A3 = M.aireBalayee(e, 0.2, 0.2 + d);
  proche(A2, d, 2e-4, `aire autour de l'aphélie e=${e}`); proche(A3, d, 2e-4, `aire e=${e} (0,2)`); proche(A1, d, 2e-4, `aire autour du périhélie e=${e}`);
  const p = M.positionEllipse(e, 0), a = M.positionEllipse(e, 0.5);
  proche(p.r, 1 - e, 1e-6, 'r périhélie'); proche(a.r, 1 + e, 2e-4, 'r aphélie');
  proche(p.v / a.v, M.rapportVitesses(e), 2e-4, `v_p/v_a e=${e}`);
  proche(p.v * p.r, a.v * a.r, 2e-4, `v·r aux apsides e=${e}`);
}
// la distance parcourue pendant la même durée est très différente (e = 0,6)
const dist = (e, f1, f2) => { const o = M.ellipse(e); let L = 0; for (let i = Math.round(f1 * o.N); i < Math.round(f2 * o.N); i++) L += Math.hypot(o.X[i + 1] - o.X[i], o.Y[i + 1] - o.Y[i]); return L; };
assert.ok(dist(0.6, 0, 1 / 12) > 3 * dist(0.6, 0.5 - 1 / 24, 0.5 + 1 / 24) * 0.99); n++;
// affichages
assert.equal(M.duree(6046), '101 min'); assert.equal(M.entier(35800), '35 800'); assert.equal(M.sci(3.982e14), '3,98 × 10¹⁴'); n += 3;
console.log(`OK satellitesModele : ${n} contrôles`);

// défis : faisabilité (réponse atteignable à partir des données affichées, au pire cas d'arrondi du résultat à 2 chiffres significatifs) et cohérence
{
  let m = 0;
  const arr2 = x => Number(x.toPrecision(2));
  for (let t = 0; t < 6000; t++) {
    const d = M.tirageKepler3(['T', 'r', 'M'][t % 3]);
    assert.ok(isFinite(d.vrai) && d.vrai > 0, 'vrai > 0');
    // la réponse recalculée à la main à partir des SEULES données affichées
    const Ts = d.Taff * (d.uT === 'min' ? 60 : d.uT === 'h' ? 3600 : 86400);
    if (d.cherche === 'T') assert.ok(Math.abs(M.periode(d.M, d.rAff) / (d.uRep === 'min' ? 60 : d.uRep === 'h' ? 3600 : 86400) - d.vrai) < 1e-9 * d.vrai);
    if (d.cherche === 'M') assert.ok(Math.abs(M.masseDepuis(d.rAff, Ts) / 10 ** d.kM - d.vrai) < 1e-9 * d.vrai);
    if (d.cherche === 'r') { const r = M.rayonDepuis(d.M, Ts); assert.ok(Math.abs((d.mode === 'h' ? (r - d.R) / 1e3 : r / (d.unite === '10³ km' ? 1e6 : 1e9)) - d.vrai) < 1e-9 * d.vrai); }
    assert.ok(Math.abs(arr2(d.vrai) - d.vrai) / d.vrai <= TOL(M.TOL_KEP3) , 'arrondi 2 CS dans la tolérance');
    if (d.cherche === 'r' && d.mode === 'h') { assert.ok(d.vrai > 100, `altitude trop faible ${d.vrai}`); }
    if (d.cherche === 'T') assert.ok(d.vrai >= 1 && d.vrai < 4e4, `T ${d.vrai} ${d.uRep}`);
    m++;
  }
  for (let t = 0; t < 200; t++) {
    const s = M.tirageStationnaire(); assert.ok(s.h > 1e4 && s.h < 1e5 && s.v > 1 && s.v < 40);
    const vv = 2 * Math.PI * (s.h * 1e3 + s.R) / s.Trot / 1e3; assert.ok(Math.abs(vv - s.v) < 1e-9 * s.v); m++;
  }
  function TOL(x) { return x; }
  n += m; console.log(`OK défis : ${m} tirages`);
}
