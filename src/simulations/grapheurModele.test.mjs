// Test du modèle de calcul du grapheur : node src/simulations/grapheurModele.test.mjs
// Références certifiées NIST StRD (régression linéaire) : Norris (affine) et NoInt1 (par l'origine) ; Monte-Carlo pour la lecture inverse.
import assert from 'node:assert/strict';
import {
  lireNombre, ecrire, moyenne, ecartTypeExp, incertitudeTypeA, regressionAffine, regressionProportionnelle, lectureInverse,
  arrondirResultat, uniteQuotient, testCourbure, testDispersion, testOrigine, diagnostics, analyserTexte, serieXY, versCSV, echelle, quotientZ,
} from './grapheurModele.js';

let nb = 0;
const ok = (c, m) => { assert.ok(c, m); nb++; };
const proche = (a, b, tol, m) => { const e = Math.abs(a - b) / Math.max(Math.abs(b), 1e-300); assert.ok(e <= tol, `${m} : ${a} au lieu de ${b} (écart relatif ${e.toExponential(2)})`); nb++; };

// ── Lecture des nombres ────────────────────────────────────────────────────────────────────────
for (const [s, v] of [['3,4', 3.4], ['3.4', 3.4], ['2,5e-3', 0.0025], ['2,5×10^-3', 0.0025], ['2,5 × 10^-3', 0.0025], ['−0,5', -0.5], ['1 234,5', 1234.5], ['  12 ', 12], ['0,020', 0.02], ['.5', 0.5]])
  proche(lireNombre(s), v, 1e-12, `lireNombre(${s})`);
for (const s of ['', 'abc', '1,2,3', '1.2.3', '5.', '--1', '1e', null, undefined]) ok(Number.isNaN(lireNombre(s)), `lireNombre(${s}) doit échouer`);

// ── NIST Norris (36 points, affine) : valeurs certifiées à 16 chiffres ; on exige 9 chiffres ─────────────────────────────────
const norris = `0.1 0.2|338.8 337.4|118.1 118.2|888.0 884.6|9.2 10.1|228.1 226.5|668.5 666.3|998.5 996.3|449.1 448.6|778.9 777.0|559.2 558.2|0.3 0.4|0.1 0.6|778.1 775.5|668.8 666.9|339.3 338.0|448.9 447.5|10.8 11.6|557.7 556.0|228.3 228.1|998.0 995.8|888.8 887.6|119.6 120.2|0.3 0.3|0.6 0.3|557.6 556.8|339.3 339.1|888.0 887.2|998.5 999.0|778.9 779.0|10.2 11.1|117.6 118.3|228.9 229.2|668.4 669.1|449.2 448.9|0.2 0.5`
  .split('|').map(l => l.split(' ').map(Number));
const nx = norris.map(l => l[1]), ny = norris.map(l => l[0]);
ok(nx.length === 36, 'Norris : 36 points');
const N = regressionAffine(nx, ny);
proche(N.b, -0.262323073774029, 1e-9, 'Norris B0');
proche(N.a, 1.00211681802045, 1e-9, 'Norris B1');
proche(N.ub, 0.232818234301152, 1e-9, 'Norris u(B0)');
proche(N.ua, 0.429796848199937e-3, 1e-9, 'Norris u(B1)');
proche(N.sr, 0.884796396144373, 1e-9, 'Norris écart-type résiduel');
proche(N.r2, 0.999993745883712, 1e-9, 'Norris R²');

// ── NIST NoInt1 (par l'origine) ─────────────────────────────────────────────────────────────────
const x1 = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70], y1 = [130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140];
const P = regressionProportionnelle(x1, y1);
proche(P.a, 2.07438016528926, 1e-12, 'NoInt1 B1');
proche(P.ua, 0.165289256198347e-1, 1e-12, 'NoInt1 u(B1)');
proche(P.sr, 3.56753034006338, 1e-12, 'NoInt1 écart-type résiduel');
proche(P.r2NonCentre, 0.999365492298663, 1e-12, 'NoInt1 R² (non centré)');
ok(P.r2NonCentre >= 0, 'R² par l’origine jamais négatif');

// ── Stabilité : x grand devant son étendue (le piège des équations normales naïves) : données exactes → paramètres exacts ──────────
{
  const x = [10000, 10001, 10002, 10003, 10004, 10005], y = x.map(v => 3 * v + 7);
  const m = regressionAffine(x, y);
  proche(m.a, 3, 1e-10, 'pente avec x ≈ 10⁴');
  proche(m.b, 7, 1e-6, 'ordonnée à l\u2019origine avec x ≈ 10⁴');
  ok(m.sr < 1e-8, 'résidus nuls sur des données exactes');
}

// ── Statistiques d'une série ───────────────────────────────────────────────────────────────────
{
  const v = [10.2, 10.4, 10.3, 10.1, 10.5];
  proche(moyenne(v), 10.3, 1e-12, 'moyenne');
  proche(ecartTypeExp(v), Math.sqrt(0.1 / 4), 1e-12, 's (n − 1)');
  proche(incertitudeTypeA(v), Math.sqrt(0.1 / 4) / Math.sqrt(5), 1e-12, 'u = s/√N');
}

// ── Arrondi de l'incertitude (eduscol : 2 chiffres significatifs, valeur à la même décimale) ─────────────────────────────────
{
  let r = arrondirResultat(624.03, 10.9); ok(r.valeur === '624' && r.u === '11', `arrondi 624 ± 11 : ${r.valeur} ± ${r.u}`);
  r = arrondirResultat(0.24137, 0.0049); ok(r.valeur === '0,2414' && r.u === '0,0049', `arrondi 0,2414 ± 0,0049 : ${r.valeur} ± ${r.u}`);
  r = arrondirResultat(2.2412, 0.0831); ok(r.valeur === '2,241' && r.u === '0,083', `arrondi 2,241 ± 0,083 : ${r.valeur} ± ${r.u}`);
  r = arrondirResultat(1234, 130); ok(r.valeur === '1230' && r.u === '130', `arrondi aux dizaines : ${r.valeur} ± ${r.u}`);
  ok(uniteQuotient('', 'mmol/L') === 'L·mmol⁻¹' && uniteQuotient('V', 'A') === 'V/A' && uniteQuotient('', 's') === '(s)⁻¹', 'unité du coefficient directeur');
  ok(ecrire(0.0123456, 3) === '0,0123' && ecrire(12345.678, 4) === '12350', 'ecrire');
}

// ── Lecture inverse : l'incertitude annoncée est celle que l'on observe sur un grand nombre de répétitions (Monte-Carlo) ──────────────
function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); }
for (const type of ['affine', 'proportionnel']) {
  const r = alea(12345), sigma = 0.01, C = [0.05, 0.1, 0.2, 0.3, 0.4], k = 2.2, y0vrai = 0.55;
  const xs = [];
  for (let t = 0; t < 20000; t++) {
    const y = C.map(c => k * c + sigma * gauss(r));
    const m = type === 'affine' ? regressionAffine(C, y) : regressionProportionnelle(C, y);
    xs.push(lectureInverse(m, y0vrai + sigma * gauss(r)).x0);
  }
  const moy = moyenne(xs), s = ecartTypeExp(xs);
  // formule avec le vrai σ (moyenne des u(x0) annoncés, estimés avec s_r)
  const r2 = alea(777), us = [];
  for (let t = 0; t < 4000; t++) {
    const y = C.map(c => k * c + sigma * gauss(r2));
    const m = type === 'affine' ? regressionAffine(C, y) : regressionProportionnelle(C, y);
    us.push(lectureInverse(m, y0vrai + sigma * gauss(r2)).u);
  }
  const uAnnonce = Math.sqrt(moyenne(us.map(u => u * u)));
  ok(Math.abs(moy - y0vrai / k) < 3 * s / Math.sqrt(xs.length) + 2e-4, `lecture inverse (${type}) : moyenne ${moy} ≠ ${y0vrai / k}`);
  proche(uAnnonce, s, 0.06, `lecture inverse (${type}) : u annoncée ${uAnnonce.toExponential(3)} / u observée ${s.toExponential(3)}`);
}

// ── Indicateurs d'hypothèses ───────────────────────────────────────────────────────────────────
{
  const x = [0, 1, 2, 3, 4, 5, 6, 7], droite = x.map((v, i) => 2 * v + 1 + (i % 2 ? 0.05 : -0.05));
  ok(testCourbure(x, droite).courbe === false, 'droite : pas de courbure');
  const parab = x.map((v, i) => 2 * v + 1 + 0.15 * v * v + (i % 2 ? 0.02 : -0.02));
  ok(testCourbure(x, parab).courbe === true, 'parabole : courbure détectée');
  ok(testCourbure([1, 2, 3, 4], [1, 2, 3, 4]) === null, 'moins de 5 points : pas de test de courbure');
  const m = regressionAffine(x, parab);
  const d = diagnostics(x, parab, m);
  ok(d.find(l => l.id === 'modele').statut === 'doute', 'diagnostic : modèle douteux sur la parabole');
  ok(d.find(l => l.id === 'independance').statut === 'info', 'diagnostic : indépendance non testable');
  const surOrigine = x.map((v, i) => 2 * v + (i % 2 ? 0.05 : -0.05));
  ok(testOrigine(x, surOrigine).compatible === true && testOrigine(x, droite).compatible === false, 'test de l’origine');
  const dispersee = x.map((v, i) => 2 * v + 1 + (i % 2 ? 1 : -1) * 0.02 * (i + 1) ** 2);
  ok(testDispersion(x, regressionAffine(x, dispersee).residus).inegale === true, 'dispersion croissante détectée');
  ok(testDispersion(x, regressionAffine(x, droite).residus).inegale === false, 'dispersion régulière : rien à signaler');
  proche(quotientZ(10.3, 0.2, 10.0), 1.5, 1e-12, 'quotient z');
}

// ── Import de texte ────────────────────────────────────────────────────────────────────────────
{
  let a = analyserTexte('C (mmol/L)\tA\n0,050\t0,112\n0,100\t0,218\n0,200\t0,447');
  ok(a.ok && a.nomSeparateur === 'tabulation' && a.decimale === 'virgule' && a.entete && a.colonnes[0].nom === 'C' && a.colonnes[0].unite === 'mmol/L' && a.lignes.length === 3, 'collage depuis un tableur français');
  proche(a.lignes[1][1], 0.218, 1e-12, 'valeur lue');
  a = analyserTexte('t;U\n0;0,5\n1;0,9\n2;1,6');
  ok(a.ok && a.nomSeparateur === 'point-virgule' && a.decimale === 'virgule' && a.entete, 'CSV français (; et virgule)');
  a = analyserTexte('t,U\n0,0.5\n1,0.9\n2,1.6');
  ok(a.ok && a.nomSeparateur === 'virgule' && a.decimale === 'point', 'CSV international (, et point)');
  a = analyserTexte('0 0\n0,020 0,241\n0,040 0,479');
  ok(a.ok && a.nomSeparateur === 'espace' && !a.entete && a.colonnes[0].nom === 'x' && a.lignes.length === 3, 'deux colonnes séparées par des espaces, sans en-tête, virgule décimale');
  a = analyserTexte('# exporté par un logiciel\n"Time (s)","Acceleration x (m/s^2)"\n0.00,0.1\n0.01,0.3\n0.02,0.2');
  ok(a.ok && a.nomSeparateur === 'virgule' && a.colonnes[0].nom === 'Time' && a.colonnes[0].unite === 's' && a.lignes.length === 3, 'en-tête entre guillemets (type Phyphox) et ligne de commentaire');
  ok(analyserTexte('bonjour tout le monde').ok === false && analyserTexte('').ok === false, 'texte sans nombres refusé');
  const s = serieXY([['1', '2'], ['x', '3'], ['4,5', '6']]);
  ok(s.x.length === 2 && s.y[1] === 6, 'serieXY ignore les lignes incomplètes');
}

// ── Export CSV et échelle ──────────────────────────────────────────────────────────────────────
{
  const col = [{ nom: 'C', unite: 'mmol/L' }, { nom: 'A', unite: '' }];
  ok(versCSV(col, [['0,05', '0.112']], true) === 'C (mmol/L);A\r\n0,05;0,112\r\n', 'CSV français');
  ok(versCSV(col, [['0,05', '0.112']], false) === 'C (mmol/L),A\r\n0.05,0.112\r\n', 'CSV international');
  const e = echelle(0.05, 0.884);
  ok(e.min === 0 && e.max >= 0.884 && e.graduations.length >= 4 && e.graduations.length <= 9, 'échelle : ' + JSON.stringify(e));
}

console.log(`grapheurModele : ${nb} vérifications réussies`);
