// Tests du modèle « niveau sonore et dangers » 2GT : node src/simulations/niveauSonore2gtModele.test.mjs
import * as M from './niveauSonore2gtModele.js';
let ko = 0;
const proche = (nom, x, ref, tol) => { const ok = Math.abs(x - ref) <= tol; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };

// repères : valeurs de la table (calculs faits à la main : 480 / 2^k)
for (const [L, t] of M.DUREES) proche(`durée repère à ${L} dB = ${t} min`, M.dureeRepere(L), t, 1e-9);
vrai('sous 85 dB : pas de limite', M.dureeRepere(80) === Infinity);
vrai('100 dB : 15 min (OMS)', M.dureeRepere(100) === 15);
// la règle « +3 dB : durée ÷ 2 » est cohérente avec la règle « +3 dB : intensité × 2 » : dose = intensité × durée constante
vrai('+3 dB divise la durée repère par 2', Math.abs(M.dureeRepere(94) * 2 - M.dureeRepere(91)) < 1e-9);
// règles d'usage
vrai('+10 dB = × 10', M.facteurIntensite(10) === 10);
vrai('+20 dB = × 100', M.facteurIntensite(20) === 100);
vrai('+30 dB = × 1000', M.facteurIntensite(30) === 1000);
vrai('+40 dB = × 10 000', M.facteurIntensite(40) === 10000);
vrai('120 dB = mille milliards de fois le seuil', M.facteurIntensite(120) === 1e12);
vrai('deux sources : +3 dB', M.niveauApresDoublement(80) === 83);
vrai('quatre sources : +6 dB', M.niveauApresDoublement(80, 2) === 86);
// sonomètre fictif : référence 50 dB ; ×10 en amplitude = +20 dB ; deux sources = +3,01 dB ; distance ×2 = −6,02 dB
proche('référence', M.niveauSonometre(1, 1, 1), 50, 1e-9);
proche('amplitude × 10', M.niveauSonometre(10, 1, 1), 70, 1e-9);
proche('amplitude × 100', M.niveauSonometre(100, 1, 1), 90, 1e-9);
proche('2 sources', M.niveauSonometre(1, 1, 2), 53.01, 0.01);
proche('8 sources', M.niveauSonometre(1, 1, 8), 59.03, 0.01);
proche('distance × 2', M.niveauSonometre(1, 2, 1), 43.98, 0.01);
proche('distance 16 m', M.niveauSonometre(1, 16, 1), 25.92, 0.01);
// bornes de l'exploration : aucun niveau dangereux, aucun niveau négatif
{ let min = 1e9, max = -1e9;
  for (const a of [1, 2, 5, 10, 20, 50, 100]) for (const r of M.DISTANCES) for (const n of M.NB_SOURCES) { const L = M.niveauSonometre(a, r, n); min = Math.min(min, L); max = Math.max(max, L); }
  vrai(`bornes du sonomètre fictif : ${min.toFixed(1)} à ${max.toFixed(1)} dB (≥ 0 et < 120)`, min > 0 && max < 120); }
// verdicts
vrai('70 dB 8 h : sous', M.verdict(70, 480) === 'sous');
vrai('100 dB 10 min : dans', M.verdict(100, 10) === 'dans');
vrai('100 dB 2 h : au-dessus', M.verdict(100, 120) === 'au-dessus');
vrai('91 dB 2 h : dans (limite)', M.verdict(91, 120) === 'dans');
vrai('105 dB : hors repères, quelle que soit la durée', M.verdict(105, 1) === 'hors' && M.verdict(101, 1) === 'hors');
vrai('120 dB 1 min : danger', M.verdict(120, 1) === 'danger');
// formats
vrai('480 min → 8 h', M.formatDuree(480) === '8 h');
vrai('90 min → 1 h 30', M.formatDuree(90) === '1 h 30');
vrai('15 min', M.formatDuree(15) === '15 min');
vrai('7,5 min', M.formatDuree(7.5) === '7,5 min');
// niveaux typiques croissants et distincts
vrai('sons triés par niveau', M.SONS.every((s, i) => i === 0 || s.db > M.SONS[i - 1].db));
// défis : 5000 tirages
{ let pb = 0, nClasser = 0, nExpo = { sous: 0, dans: 0, 'au-dessus': 0 }, prec = null, precE = null;
  for (let i = 0; i < 5000; i++) {
    const d = M.tirerDefiClasser(prec); prec = d; nClasser++;
    const niv = d.sons.map(s => M.son(s).db); if (new Set(niv).size !== 4) pb++;
    const tri = [...d.sons].sort((a, b) => M.son(a).db - M.son(b).db); if (tri.join() !== d.ordre.join()) pb++;
    if (!Number.isFinite(d.facteur) || d.facteur < 100 || d.facteur > 1e6 || !Number.isInteger(d.facteur)) pb++;
    const e = M.tirerDefiExposition(precE); precE = e; nExpo[e.cas]++;
    if (M.verdict(e.L, e.t) !== e.cas) pb++;
    if (e.cas !== 'sous') { const r = e.t / e.D; if (!(r <= 0.6 || r >= 2)) pb++; }
  }
  vrai(`défis : ${nClasser} tirages « classer » et ${JSON.stringify(nExpo)} « exposition » sans cas limite`, pb === 0); }
console.log(ko ? `\n${ko} échec(s)` : '\nTous les tests passent.');
process.exit(ko ? 1 : 0);
