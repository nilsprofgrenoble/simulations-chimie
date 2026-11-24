import * as M from './sensEmulsionModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC : ' + m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// phases
ok(M.phaseContinue('H/E') === 'eau' && M.phaseDispersee('H/E') === 'huile', 'H/E : eau continue, huile dispersée');
ok(M.phaseContinue('E/H') === 'huile' && M.phaseDispersee('E/H') === 'eau', 'E/H : huile continue, eau dispersée');

// dilution : se disperse dans le liquide miscible avec la phase continue
ok(M.sedisperse('H/E', 'eau') && !M.sedisperse('H/E', 'huile'), 'dilution H/E');
ok(M.sedisperse('E/H', 'huile') && !M.sedisperse('E/H', 'eau'), 'dilution E/H');

// colorants
let c = M.coloration('H/E', 'RS+BM'); ok(c.fond === 'bleu' && c.gouttes === 'rouge', 'H/E avec les deux colorants : fond bleu, gouttes rouges');
c = M.coloration('E/H', 'RS+BM'); ok(c.fond === 'rouge' && c.gouttes === 'bleu', 'E/H avec les deux colorants : fond rouge, gouttes bleues');
c = M.coloration('H/E', 'RS'); ok(c.fond === null && c.gouttes === 'rouge', 'RS sur H/E : gouttes rouges, fond incolore');
c = M.coloration('E/H', 'RS'); ok(c.fond === 'rouge' && c.gouttes === null, 'RS sur E/H : fond rouge');
c = M.coloration('H/E', 'BM'); ok(c.fond === 'bleu' && c.gouttes === null, 'BM sur H/E : fond bleu');
c = M.coloration('E/H', 'BM'); ok(c.fond === null && c.gouttes === 'bleu', 'BM sur E/H : gouttes bleues');
for (const t of M.TYPES) for (const col of ['RS', 'BM', 'RS+BM']) { const x = M.coloration(t, col); ok(M.lireColoration(x.fond, x.gouttes) === t, `lecture du microscope ${t} ${col}`); }

// conductimétrie : 10 mmol/L de NaCl ≈ 1,3 mS/cm ; H/E déminéralisée ≈ quelques µS/cm ; E/H < 1 µS/cm
ok(proche(M.sigmaAqueuse(10), 1266), 'σ de 10 mmol/L NaCl');
const sHE = M.conductivite('H/E', 0.4, 10); ok(sHE > 600 && sHE < 900, 'H/E salée : quelques centaines de µS/cm à ~1 mS/cm : ' + sHE);
ok(M.conductivite('H/E', 0.4, 0) < 10 && M.conductivite('H/E', 0.4, 0) > 1, 'H/E déminéralisée : quelques µS/cm');
ok(M.conductivite('E/H', 0.3, 20) < 1, 'E/H : < 1 µS/cm');
ok(M.conductivite('H/E', 0.6, 10) < M.conductivite('H/E', 0.3, 10), 'σ décroît quand la fraction d’huile augmente');
ok(M.verdictConductivite(900) === 'H/E' && M.verdictConductivite(0.3) === 'E/H' && M.verdictConductivite(4) === null, 'verdicts de conductivité');

// viscosité : croît avec la fraction de phase dispersée, vaut η_continue à φ = 0
ok(proche(M.viscositeRelative(0), 1), 'η relative = 1 à φ = 0');
let prec = 1; for (let p = 0.05; p <= 0.70; p += 0.05) { const v = M.viscositeRelative(p); ok(v > prec, 'η croissante en φ à ' + p); prec = v; }
ok(M.viscositeRelative(0.55) > 8 && M.viscositeRelative(0.55) < 20, 'η relative à 0,55 : ordre de 10 : ' + M.viscositeRelative(0.55));
ok(M.viscositeRelative(0.9) === M.viscositeRelative(0.70) && M.horsModele(0.75) && !M.horsModele(0.7), 'borne du modèle');
// mayonnaise légère (H/E, 55 % d'huile) : de l'ordre de 0,05 Pa·s ; crème E/H à 30 % d'eau : ordre de 0,1 Pa·s
ok(M.viscosite('H/E', 0.55) > 0.03 && M.viscosite('H/E', 0.55) < 0.2, 'mayonnaise légère');
ok(M.viscosite('E/H', 0.30) > 0.1 && M.viscosite('E/H', 0.30) < 0.3, 'émulsion E/H à 30 % d’eau');

// ajout de phase : ajouter la phase dispersée épaissit, ajouter la phase continue dilue (et fluidifie)
for (const t of M.TYPES) {
  const e = M.etatInitial(t, 200, 80);
  const plus = M.ajouter(e, M.phaseDispersee(t), 40), moins = M.ajouter(e, M.phaseContinue(t), 40);
  ok(M.phi(plus) > M.phi(e) && M.viscosite(t, M.phi(plus)) > M.viscosite(t, M.phi(e)), `${t} : ajouter la phase dispersée épaissit`);
  ok(M.phi(moins) < M.phi(e) && M.viscosite(t, M.phi(moins)) < M.viscosite(t, M.phi(e)), `${t} : ajouter la phase continue fluidifie`);
  ok(plus.V === 240 && moins.V === 240 && plus.Vd === 120 && moins.Vd === 80, 'volumes après ajout');
}
// exemple chiffré : 200 mL dont 110 mL d'huile ; + 40 mL d'huile → 150/240 = 62,5 % ; + 40 mL d'eau → 110/240 = 45,8 %
const m = M.etatInitial('H/E', 200, 110);
ok(proche(M.phi(M.ajouter(m, 'huile', 40)), 150 / 240), 'φ après ajout d’huile'); ok(proche(M.phi(M.ajouter(m, 'eau', 40)), 110 / 240), 'φ après ajout d’eau');
// volume à ajouter
const x = M.volumeAAjouter(M.etatInitial('H/E', 200, 100), 0.65); ok(proche(x, 30 / 0.35), 'volume à ajouter'); ok(proche(M.phi(M.ajouter(M.etatInitial('H/E', 200, 100), 'huile', x)), 0.65), 'φ cible atteinte');

// tirages
let seed = 12345; const r = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const vus = new Set();
for (let i = 0; i < 400; i++) {
  const d = M.tirageSens(r); vus.add(d.type + d.scenario);
  ok(M.testsDecisifs(d).length >= 1, 'au moins un test décisif');
  ok(d.tests.dilution || d.scenario === 'sans-dilution', 'dilution présente sauf scénario sans-dilution');
  if (d.type === 'H/E' && d.scenario === 'conduction-faible') ok(M.verdictConductivite(d.sigma) === null, 'H/E déminéralisée : conductimétrie non concluante : ' + d.sigma);
  if (d.type === 'H/E' && d.scenario !== 'conduction-faible') ok(M.verdictConductivite(d.sigma) === 'H/E', 'H/E salée : conductivité forte');
  if (d.type === 'E/H') ok(d.sigma < 1, 'E/H : σ < 1');
  const t = M.tirageEpaissir(r);
  ok(t.x > 0 && t.phiCible <= 0.70 && t.phiCible > t.phi0, 'tirage épaissir valide'); ok(Number.isFinite(t.x) && t.x < 600, 'volume raisonnable ' + t.x);
  ok(proche(M.phi(M.ajouter(t.e, t.phase, t.x)), t.phiCible), 'cible atteinte');
}
ok(vus.size === 6, 'les six combinaisons sont tirées : ' + vus.size);

// QCM : ordre fixe, bonne réponse répartie, jamais la plus longue
try {
  const { QCM } = await import('./sensEmulsionQcm.js');
  const L = Object.values(QCM), places = [0, 0, 0, 0];
  for (const q of L) { ok(q.ordreFixe === true && q.options.length === 4 && q.bonne >= 0 && q.bonne < 4, 'qcm structure'); places[q.bonne]++; ok(q.options[q.bonne].length < Math.max(...q.options.map(o => o.length)), 'bonne réponse jamais la plus longue : ' + q.options[q.bonne]); }
  for (let i = 1; i < L.length; i++) ok(L[i].bonne !== L[i - 1].bonne, 'jamais la même place deux fois de suite (question ' + (i + 1) + ')');
  ok(Math.max(...places) - Math.min(...places) <= 1, 'places équilibrées : ' + places.join('/'));
} catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
console.log(`sensEmulsionModele : ${n} vérifications, OK`);
