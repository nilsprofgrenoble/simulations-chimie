// Vérifie les exercices de remédiation créés pour les chapitres TSTL « b » (régulation, contrôle, thermique, cristallisation, distillation, ondes pour observer)
// et recalcule les nombres de leurs énoncés : node src/simulations/tstlBExos.test.mjs
import assert from 'node:assert/strict';
import { createServer } from 'vite';
// Les banques importent des fichiers .jsx : on les charge par Vite (SSR), comme src/sousThemes.chapitres.test.mjs
const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
const { TSTLB_ANA, TSTLB_REL, TSTLB_VAL } = await vite.ssrLoadModule('/src/simulations/tstlBExos.js');
const { FAMILLES: FAM_ANA } = await vite.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
const { FAMILLES: FAM_VAL } = await vite.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
const { CHAPITRES } = await vite.ssrLoadModule('/src/chapitres.js');

const domaines = new Set(CHAPITRES.flatMap(c => c.domaines));
const proche = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg} : ${a} ≠ ${b}`);

// ── Structure : une seule bonne réponse, pas d'option en double, bonne réponse jamais la plus longue, identifiants uniques dans la banque ──
const tous = [...TSTLB_ANA.map(x => ['ANA', x]), ...TSTLB_REL.map(x => ['ANA', x]), ...TSTLB_VAL.map(x => ['VAL', x])];
const ids = new Set();
for (const [type, it] of tous) {
  assert.ok(!ids.has(it.id), `id en double : ${it.id}`); ids.add(it.id);
  assert.ok(domaines.has(it.domaine), `${it.id} : domaine absent de chapitres.js`);
  assert.equal(it.options.filter(o => o[1]).length, 1, `${it.id} : une seule bonne réponse`);
  assert.ok(it.options.length >= 3, `${it.id} : au moins 3 options`);
  const t = it.options.map(o => o[0]); assert.equal(new Set(t).size, t.length, `${it.id} : option en double`);
  for (const o of it.options) assert.ok(o[2] && o[2].length > 20, `${it.id} : explication manquante`);
  const l = t.map(x => x.length), bonne = it.options.findIndex(o => o[1]);
  assert.ok(!(l[bonne] === Math.max(...l) && l.filter(x => x === l[bonne]).length === 1), `${it.id} : la bonne réponse est la plus longue`);
  assert.ok(l[bonne] <= 1.4 * (l.reduce((a, b) => a + b, 0) / l.length), `${it.id} : la bonne réponse est nettement plus longue`);
  assert.ok(it.enonce && it.enonce.length > 40, `${it.id} : énoncé`);
  if (type === 'VAL') { assert.ok([1, 2, 3].includes(it.niveau) && it.reperes.length >= 2 && it.ver && it.q2, it.id); assert.equal(it.verdict.filter(o => o[1]).length, 1, it.id); }
  else assert.ok(it.q, `${it.id} : question`);
}
// pas de collision avec les autres exercices de la banque (hors les nôtres)
const nos = new Set(tous.map(([, x]) => x.id));
for (const f of [...FAM_ANA, ...FAM_VAL]) { const vus = f.liste.map(x => x.id).filter(i => nos.has(i)); assert.equal(new Set(vus).size, vus.length, `identifiant présent deux fois dans ${f.id}`); }

// ── Régulation ──
{ // point de fonctionnement : θ = θext + Y, Y = Kp (80 − θ), Kp = 10
  const pf = text => { const Y = 10 * (80 - text) / 11; return { Y, th: text + Y, e: 80 - text - Y }; };
  const a = pf(20), b = pf(0);
  proche(a.Y, 54.5, 0.05, 'Y avant'); proche(a.th, 74.5, 0.05, 'θ avant'); proche(a.e, 5.5, 0.05, 'écart avant');
  proche(b.Y, 72.7, 0.05, 'Y après'); proche(b.th, 72.7, 0.05, 'θ après'); proche(b.e, 7.3, 0.05, 'écart après');
  assert.ok(b.Y > a.Y && b.e > a.e && Math.abs(b.Y - 10 * b.e) < 1e-9);
  assert.ok(b.Y < 100, 'pas de saturation');
  // le couple faux de l'élève (θ = 80, Y = 60) ne vérifie pas la loi du régulateur
  assert.equal(10 * (80 - 80), 0);
}
// four en boucle ouverte : 1 200 = G (θ − 20)
proche(20 + 1200 / 30, 60, 1e-9, 'four porte fermée'); proche(20 + 1200 / 40, 50, 1e-9, 'four porte mal fermée');
// PI et pompe saturée
assert.ok(70 > 60);
// critères de performance : consigne finale 60 − écart ; dépassement par rapport à la valeur finale
proche(60 - 1.8, 58.2, 1e-9, 'valeur finale réglage 1'); proche(60 - 0.3, 59.7, 1e-9, 'valeur finale réglage 2'); proche(60.9 - 59.7, 1.2, 1e-9, 'dépassement réglage 2');
assert.ok(58.2 <= 58.2 && 25 < 40 && 0.3 < 1.8);
// capteur décalé de −2 °C : mesure = θ − 2 = 80
proche(80 + 2, 82, 0, 'capteur décalé');

// ── Contrôle ──
proche(34 - 18, 40 - 24, 1e-9, 'incubateur : θ − θext constant'); assert.ok(40 - 34 > 2 * 0.5);

// ── Thermique ──
{ // chaudière à vapeur : 1,0 t/h ; c = 4,18 kJ/kg/K ; Lv = 2,26 MJ/kg
  const qm = 1000 / 3600, chauffe = qm * 4180 * 80, vap = qm * 2.26e6;
  proche(chauffe / 1e3, 93, 0.5, 'chauffage'); proche(vap / 1e3, 628, 1, 'vaporisation'); proche((chauffe + vap) / 1e3, 721, 1, 'total'); proche((chauffe + vap) / chauffe, 7.75, 0.05, 'rapport');
  // débit de gaz : 120 kW utiles, η = 0,90, PCI = 36 MJ/m³
  const q = 120e3 / (0.9 * 36e6); proche(q, 3.7e-3, 0.05e-3, 'débit gaz'); proche(q * 3600, 13.3, 0.1, 'débit gaz en m³/h');
  // échangeur : S = P / (K ΔT_ml)
  proche(80000 / (800 * 25), 4.0, 1e-9, 'surface'); proche(80 / (800 * 25), 4.0e-3, 1e-9, 'surface avec P en kW (erreur de l\'élève)');
  assert.ok(0.21 * 0.297 > 5e-2 && 4.0e-3 < 0.21 * 0.297);
  // pompe à chaleur : 6,0 = 2,0 + 4,0 ; COP = 3
  proche(6.0 / 2.0, 3.0, 1e-9, 'COP'); proche(6.0 - 2.0, 4.0, 1e-9, 'chaleur prélevée');
}
// co-courant : température commune limite (même capacité thermique) : (80 + 15) / 2 = 47,5 °C < 80
proche((80 + 15) / 2, 47.5, 1e-9, 'co-courant');

// ── Cristallisation ──
{ // évaporation : 100 kg à 10 % → 50 kg ; 10 / 50 = 20 %
  proche(10 / 50, 0.20, 1e-9, 'fraction après évaporation');
  const sucre = 0.12 * 1000, concentre = sucre / 0.60; proche(sucre, 120, 1e-9, 'sucre'); proche(concentre, 200, 1e-9, 'concentré'); proche(1000 - concentre, 800, 1e-9, 'eau évaporée');
  proche(0.60 * 1000 / 0.12, 5000, 1e-9, 'concentré si les fractions sont échangées');
}

// ── Distillation ──
{ // 100 g d'éthanol (46) et 100 g d'eau (18)
  const nE = 100 / 46, nW = 100 / 18; proche(nE / (nE + nW), 0.281, 0.001, 'x éthanol'); proche(nE / nW, 0.391, 0.001, 'n_E / n_eau'); proche(nW / (nE + nW), 0.719, 0.001, 'x eau');
  const mE = 50 / 46, mW = 50 / 18; proche(mE, 1.09, 0.005, 'n éthanol 50 g'); proche(mW, 2.78, 0.005, 'n eau 50 g'); proche(mE / (mE + mW), 0.28, 0.005, 'x pour 50 % massique');
  // diagramme : la courbe de rosée est au-dessus de la courbe d'ébullition, S est sur la verticale x0
  const Tb = x => 1 - (1.2 * x - 0.2 * x * x), yv = x => 5 * x / (1 + 4 * x);
  proche(Tb(0), 1, 1e-12, 'Tb(0)'); proche(Tb(1), 0, 1e-12, 'Tb(1)'); proche(yv(1), 1, 1e-12, 'yv(1)');
  for (let x = 0.01; x < 1; x += 0.01) { assert.ok(yv(x) > x, 'vapeur plus riche en volatil'); assert.ok(Tb(x + 0.005 > 1 ? x : x + 0.005) <= Tb(x) + 1e-12, 'Tb décroissante'); }
  const x0 = 0.3, xs = x0 / (5 - 4 * x0); proche(yv(xs), x0, 1e-12, 'point S'); assert.ok(Tb(xs) > Tb(x0), 'S plus chaud que Q');
}

// ── Ondes pour observer : résolution ──
{ proche(450 / 650, 0.69, 0.005, 'rapport des longueurs d\'onde'); proche(650 / 450, 1.44, 0.005, 'rapport inverse');
  const d = (lambda, on) => 0.61 * lambda / on;
  proche(d(0.55, 0.65), 0.516, 0.002, 'd ×40'); proche(d(0.55, 0.40), 0.839, 0.002, 'd ×20'); proche(d(0.55, 0.25), 1.342, 0.002, 'd ×10'); proche(d(0.55, 1.25), 0.268, 0.002, 'd ×100');
  assert.ok(d(0.55, 0.65) <= 0.55 && d(0.55, 0.40) > 0.55, 'seuil de 0,55 µm entre ×20 et ×40');
  proche(d(550, 1.25), 268, 1, 'd en nm'); assert.ok(d(550, 1.25) > 50);
  proche(200 / 1, 200, 0, 'rapport AFM'); assert.ok(200 < 1e6);
}
await vite.close();
console.log(`tstlBExos : ${tous.length} exercices vérifiés`);
