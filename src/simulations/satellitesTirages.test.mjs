// Tirages des exercices « kep- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP).
// Usage : node src/simulations/satellitesTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const Q = await srv.ssrLoadModule('/src/simulations/satellitesQcm.jsx');
  const K = await srv.ssrLoadModule('/src/simulations/satellitesModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'kep-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const SUPN = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  const num = s => Number(String(s).replace(/[\s ]/g, '').replace(',', '.'));
  const sci = s => { const m = s.match(/([\d,]+)\s*×\s*10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/); const e = [...m[2]].filter(c => c !== '⁻').reduce((a, c) => a * 10 + SUPN[c], 0) * (m[2].includes('⁻') ? -1 : 1); return num(m[1]) * Math.pow(10, e); };
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  const G = K.G, rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  let pireTol = 0; const vus = { terre: 0, mars: 0, jupiter: 0 }, satV = new Set();
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    // 1 : a = G M / (R + h)²
    const h1 = num(T[0].match(/h = ([\d\s]+)\s*km/)[1]); ok(rel(K.acceleration(5.97e24, 6.37e6 + h1 * 1e3), e.questions[0].vrai) < 1e-9, `q1 : ${T[0]}`);
    // 2 : v = √(G M / r) autour de Mars
    const M2 = sci(T[1].match(/M = ([\d,]+\s×\s10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\s*kg/)[1]), r2k = num(T[1].match(/r = ([\d\s]+)\s*km/)[1]);
    ok(rel(Math.sqrt(G * M2 / (r2k * 1e3)) / 1e3, e.questions[1].vrai) < 1e-9, `q2 : ${T[1]}`);
    // 3 : T d'un satellite de Jupiter
    const M3 = sci(T[2].match(/M = ([\d,]+\s×\s10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\s*kg/)[1]), rj = num(T[2].match(/r = ([\d\s]+)×\s10³\s*km/)[1]);
    ok(rel(2 * Math.PI * Math.sqrt(Math.pow(rj * 1e6, 3) / (G * M3)) / 86400, e.questions[2].vrai) < 1e-9, `q3 : ${T[2]}`);
    // 4 : masse d'après r et T affichés
    const r4 = num(T[3].match(/r = ([\d\s]+)\s*km/)[1]), T4 = num(T[3].match(/T = ([\d,]+)\s*jours/)[1]);
    ok(rel(4 * Math.PI ** 2 * Math.pow(r4 * 1e3, 3) / (G * Math.pow(T4 * 86400, 2)) / 1e23, e.questions[3].vrai) < 1e-9, `q4 : ${T[3]}`);
    satV.add(`${r4}`);
    // 5 : altitude de l'orbite stationnaire
    const M5 = sci(T[4].match(/M = ([\d,]+\s×\s10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\s*kg/)[1]), R5 = num(T[4].match(/R = ([\d\s]+)\s*km/)[1]), T5 = num(T[4].match(/T = ([\d\s]+)\s*s/)[1]);
    ok(rel((Math.cbrt(G * M5 * T5 * T5 / (4 * Math.PI ** 2)) - R5 * 1e3) / 1e3, e.questions[4].vrai) < 1e-9, `q5 : ${T[4]}`);
    vus[/Terre/.test(T[4]) ? 'terre' : /Mars/.test(T[4]) ? 'mars' : 'jupiter']++;
    // pièges hors de 1,5 × tolérance ; arrondi à 2 (ou 3) chiffres significatifs accepté
    for (const q of e.questions) {
      const cs = q.csMin === 3 ? r3 : r2;
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      for (const [v] of q.pieges) ok(isFinite(v) && rel(v, q.vrai) > 1.5 * q.tolRel, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = rel(cs(q.vrai), q.vrai); pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi hors tolérance`);
      ok(rel(r3(q.vrai), q.vrai) <= q.tolRel, 'arrondi à 3 chiffres');
    }
    // données réalistes
    ok(e.questions[0].vrai > 0.1 && e.questions[0].vrai < 10, 'a réaliste'); ok(e.questions[1].vrai > 0.5 && e.questions[1].vrai < 5, 'v autour de Mars'); ok(e.questions[2].vrai > 1 && e.questions[2].vrai < 20, 'T de lune de Jupiter');
    ok(e.questions[3].vrai > 3 && e.questions[3].vrai < 10, `M planète ${e.questions[3].vrai}`); ok(e.questions[4].vrai > 1e4 && e.questions[4].vrai < 1e5, 'h stationnaire');
  }
  ok(Object.values(vus).every(c => c > 500) && satV.size === 2, `variété des tirages ${JSON.stringify(vus)}`);
  // S'APP : les deux variantes se construisent, les données utiles sont dans le texte, la solution est cohérente
  const sapp = D.ENONCES.find(x => x.id === 'kep-sapp-satellite');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      const r = 6.37e6 + p.h * 1e3, Tm = Math.round(K.periode(5.97e24, r) / 60);
      ok(Math.abs(b.solution.val - (q === 0 ? K.periode(5.97e24, r) / 60 : 2 * Math.PI * r / (Tm * 60) / 1000)) < 1e-9, 'S\'APP : solution');
      ok(b.solution.val > 0.5 && b.solution.val < 200, `S'APP : valeur réaliste ${b.solution.val}`);
      ok(b.cherche.bonne && b.cherche.faux.length === 3, 'S\'APP : grandeur cherchée');
      ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), 'S\'APP : raisons pour les seules données inutiles');
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); ok(inutiles.every(k => b.raisons[k]), 'S\'APP : chaque donnée inutile est expliquée');
    }
  }
  // QCM : la bonne réponse n'est jamais la plus longue ; elle n'est pas systématiquement la plus courte (texte rendu, indices et fractions aplatis)
  const rendu = s => Q.texteRendu(s);
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options.map(rendu), v.bonne]);
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('kep-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  const valListe = V.PLAUSIBLES.filter(y => y.id.startsWith('kep-'));
  for (const x of valListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  ok(anaListe.length >= 3 && valListe.length >= 2, 'ANA : 3 et VAL : 2');
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
  const titres = [...D.ENONCES.filter(x => x.id.startsWith('kep-')).map(x => x.titre), ...anaListe.map(x => x.titre), ...valListe.map(x => x.titre), fam.titre];
  ok(titres.every(s => !/_|÷/.test(s)), 'titres sans « _ »');
  const brut = JSON.stringify([anaListe, valListe]);
  ok(!/÷|\^/.test(brut), 'pas de « ÷ » ni « ^ » dans les ANA et VAL');
  console.log(`  ${lots.length} QCM contrôlés (parcours + ANA + VAL)`);
  console.log(`OK satellitesTirages : ${n} contrôles ; pire arrondi à 2 ou 3 chiffres : ${(pireTol * 100).toFixed(2)} %`);
} finally { await srv.close(); }
