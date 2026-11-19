// Tirages des exercices « rc- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP).
// Usage : node src/simulations/rcTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = await srv.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const V = await srv.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const D = await srv.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const Q = await srv.ssrLoadModule('/src/simulations/rcQcm.jsx');
  const fam = R.FAMILLES.find(f => f.id === 'rc-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/\s| /g, '').replace(',', '.'));
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  let pireTol = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    // 1 : τ = R C (ms)
    let Rv = num(T[0].match(/R = ([\d,]+) kΩ/)[1]), Cv = num(T[0].match(/C = ([\d,]+) µF/)[1]);
    ok(Math.abs(Rv * Cv - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    // 2 : C = τ / R
    const tau2 = num(T[1].match(/τ = ([\d,]+) ms/)[1]); Rv = num(T[1].match(/R = ([\d,]+) kΩ/)[1]);
    ok(Math.abs(tau2 / Rv - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai, `q2 : ${T[1]}`);
    // 3 : i(0) = E / R (mA)
    Rv = num(T[2].match(/R = ([\d,]+) kΩ/)[1]); const E3 = num(T[2].match(/E = (\d+) V/)[1]);
    ok(Math.abs(E3 / Rv - e.questions[2].vrai) < 1e-9 * e.questions[2].vrai, `q3 : ${T[2]}`);
    // 4 : charge ou décharge à t = n τ
    const E4 = num(T[3].match(/E = (\d+) V/)[1]), n4 = num(T[3].match(/t = (\d) τ/)[1]), charge = /est chargé sous/.test(T[3]);
    ok(charge !== /est déchargé/.test(T[3]), 'q4 : charge XOR décharge');
    const u4 = charge ? E4 * (1 - Math.exp(-n4)) : E4 * Math.exp(-n4);
    ok(Math.abs(u4 - e.questions[3].vrai) < 1e-9 * u4, `q4 : ${T[3]}`);
    // 5 : durée 5 τ (s)
    Rv = num(T[4].match(/R = ([\d,]+) kΩ/)[1]); Cv = num(T[4].match(/C = ([\d,]+) µF/)[1]);
    ok(Math.abs(5 * Rv * Cv / 1000 - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai, `q5 : ${T[4]}`);
    // pièges hors de 1,5 × tolérance ; arrondi à 2 chiffres significatifs accepté ; chaînes
    for (const q of e.questions) {
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / q.vrai > 1.5 * q.tolRel, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = Math.abs(r2(q.vrai) - q.vrai) / q.vrai; pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance`);
      ok(Math.abs(r3(q.vrai) - q.vrai) / q.vrai <= q.tolRel, 'arrondi à 3 chiffres');
    }
    // données de menus : les valeurs affichées sont réalistes (τ de 0,1 ms à 10 s)
    ok(e.questions[0].vrai >= 0.4 && e.questions[0].vrai <= 5000, 'τ réaliste');
  }
  // S'APP : les deux variantes se construisent, les données utiles sont dans le texte, la solution est cohérente
  const sapp = D.ENONCES.find(x => x.id === 'rc-sapp-circuit');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      ok(Math.abs(b.solution.val - (q === 0 ? p.R * p.C : p.E / p.R)) < 1e-9, 'S\'APP : solution');
      ok(b.cherche.bonne && b.cherche.faux.length === 3, 'S\'APP : grandeur cherchée');
      ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), 'S\'APP : raisons pour les seules données inutiles');
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); ok(inutiles.every(k => b.raisons[k]), 'S\'APP : chaque donnée inutile est expliquée');
    }
  }
  // QCM : la bonne réponse n'est jamais la plus longue ; elle n'est pas systématiquement la plus courte (texte rendu, indices et fractions aplatis)
  const rendu = s => Q.texteRendu(s);
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options.map(rendu), v.bonne]);
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('rc-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  for (const x of V.PLAUSIBLES.filter(y => y.id.startsWith('rc-'))) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  ok(anaListe.length === 3 && V.PLAUSIBLES.filter(y => y.id.startsWith('rc-')).length === 3, 'ANA : 3 et VAL : 3');
  const mauvais = [];
  for (const [nom, opts, b] of lots) {
    const L = opts.map(o => o.length), max = Math.max(...L), min = Math.min(...L);
    if (!(L[b] < max)) mauvais.push(`${nom} : la bonne réponse est la plus longue (${L.join(', ')}, bonne = ${b})`);
    if (!(max - min <= 40 || max / min < 1.7)) mauvais.push(`${nom} : options déséquilibrées (${L.join(', ')})`);
    if (L[b] === min) mauvais.push(`${nom} : bonne réponse la plus courte (${L.join(', ')}, bonne = ${b})`);
  }
  // libellés « cherche » des S'APP
  for (const q of [0, 1]) { const b = sapp.build(sapp.gen(), q), L = [b.cherche.bonne, ...b.cherche.faux].map(s => s.length); if (!(L[0] < Math.max(...L)) || L[0] === Math.min(...L)) mauvais.push(`S'APP q${q} : libellés ${L.join('/')}`); }
  ok(mauvais.length === 0, '\n' + mauvais.join('\n'));
  // aucun « _ » brut dans les titres d'exercices ; pas de « ÷ »
  const titres = [...D.ENONCES.filter(x => x.id.startsWith('rc-')).map(x => x.titre), ...anaListe.map(x => x.titre), ...V.PLAUSIBLES.filter(y => y.id.startsWith('rc-')).map(x => x.titre), fam.titre];
  ok(titres.every(s => !/_|÷/.test(s)), 'titres sans « _ »');
  const brut = JSON.stringify([anaListe, V.PLAUSIBLES.filter(y => y.id.startsWith('rc-'))]);
  ok(!/÷|\^/.test(brut), 'pas de « ÷ » ni « ^ » dans les ANA et VAL');
  console.log(`  ${lots.length} QCM contrôlés (parcours + ANA + VAL)`);
  console.log(`OK rcTirages : ${n} contrôles ; pire arrondi à 2 chiffres : ${(pireTol * 100).toFixed(2)} %`);
} finally { await srv.close(); }
