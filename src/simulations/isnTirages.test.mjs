// Tirages des exercices « isn- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP), absence de « _ », « ^ », « ÷ », « / ».
// Usage : node src/simulations/isnTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const Q = await srv.ssrLoadModule('/src/simulations/isnQcm.js');
  const M = await srv.ssrLoadModule('/src/simulations/isnModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'isn-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const supNum = s => Number([...s].map(c => c === '⁻' ? '-' : SUPS.indexOf(c)).join(''));
  const num = s => Number(String(s).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
  const sciDe = s => { const m = s.match(/(\d+,\d+)×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/); if (!m) return num(s.match(/\d+,\d+/)[0]); return num(m[1]) * Math.pow(10, supNum(m[2])); };
  const r2 = x => Number(x.toPrecision(2));
  const proche = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.abs(b);
  let pireTol = 0; const nPieges = [];
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    const expl = e.questions.map(q => txt(q.expl) + ' ' + txt(q.aide)).join(' ');
    ok(!/_|\^|÷/.test(expl.replace(/frac\([^)]*\)/g, '')), 'corrigés et aides sans « _ », « ^ », « ÷ » hors frac(…)');
    // 1 : I = P / S
    let P = sciDe(T[0].match(/P = ([^W]+) W/)[1]); const S = num(T[0].match(/S = ([\d,]+) m²/)[1]);
    ok(proche(P / S, e.questions[0].vrai), `q1 : ${T[0]}`);
    // 2 : L = 10 log (I / I0)
    const I2 = sciDe(T[1].match(/I = ([^W]+) W/)[1]);
    ok(proche(10 * Math.log10(I2 / 1e-12), e.questions[1].vrai, 1e-9), `q2 : ${T[1]}`);
    // 3 : I = I0 × 10^(L/10)
    const L3 = num(T[2].match(/L = (\d+) dB/)[1]);
    ok(proche(1e-12 * Math.pow(10, L3 / 10), e.questions[2].vrai), `q3 : ${T[2]}`);
    // 4 : niveau derrière une paroi
    P = sciDe(T[3].match(/P = ([^W]+) W/)[1]); const A4 = num(T[3].match(/A = (\d+) dB/)[1]), d4 = num(T[3].match(/d = (\d+) m/)[1]);
    ok(proche(10 * Math.log10(P / (4 * Math.PI * d4 * d4) / 1e-12) - A4, e.questions[3].vrai, 1e-9), `q4 : ${T[3]}`);
    ok(e.questions[3].vrai >= 10 && e.questions[3].vrai <= 75, 'q4 : niveau réaliste');
    // 5 : distance d'un niveau donné
    P = sciDe(T[4].match(/P = ([^W]+) W/)[1]); const L5 = num(T[4].match(/L = (\d+) dB/)[1]);
    ok(proche(Math.sqrt(P / (4 * Math.PI * 1e-12 * Math.pow(10, L5 / 10))), e.questions[4].vrai, 1e-9), `q5 : ${T[4]}`);
    ok(e.questions[4].vrai >= 2 && e.questions[4].vrai <= 1000, 'q5 : distance réaliste');
    for (const q of e.questions) {
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      nPieges.push(q.pieges.length);
      for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / Math.abs(q.vrai) > Math.max(1.5 * q.tolRel, 0.08), `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = Math.abs(r2(q.vrai) - q.vrai) / q.vrai; pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance`);
      ok(Math.abs(Number(q.vrai.toPrecision(3)) - q.vrai) / q.vrai <= q.tolRel, 'arrondi à 3 chiffres');
      // la vérification de la banque accepte la bonne réponse arrondie à 2 CS (et refuse chaque piège)
      ok(R.verifier(q, String(r2(q.vrai)).replace('.', ',')).ok || /e/.test(String(r2(q.vrai))), `${q.id} : bonne réponse refusée (${r2(q.vrai)})`);
      for (const [v] of q.pieges) ok(!R.verifier(q, String(v).replace('.', ',')).ok, `${q.id} : un piège est accepté`);
    }
  }
  // S'APP : les deux variantes se construisent, les données utiles sont dans le texte, la solution est cohérente
  const sapp = D.ENONCES.find(x => x.id === 'isn-sapp-niveau');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      ok(Math.abs(b.solution.val - (q === 0 ? M.niveauSource(p.P, p.d) : p.L1 - p.A)) < 1e-9, 'S\'APP : solution');
      ok(b.cherche.bonne && b.cherche.faux.length === 3, 'S\'APP : grandeur cherchée');
      ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), 'S\'APP : raisons pour les seules données inutiles');
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); ok(inutiles.every(k => b.raisons[k]), 'S\'APP : chaque donnée inutile est expliquée');
      ok(q === 1 || (b.solution.val > 20 && b.solution.val < 110), 'S\'APP q0 : niveau réaliste'); ok(q === 0 || b.solution.val >= 20, 'S\'APP q1 : niveau positif');
      ok(!/[_^÷]/.test(JSON.stringify(b.texte)) , 'S\'APP : texte sans « _ », « ^ », « ÷ »');
    }
  }
  // QCM : la bonne réponse n'est jamais la plus longue ni la plus courte
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options, v.bonne]);
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('isn-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => o[0]), x.options.findIndex(o => o[1])]);
  const valListe = V.PLAUSIBLES.filter(y => y.id.startsWith('isn-'));
  for (const x of valListe) lots.push([x.id, x.options.map(o => o[0]), x.options.findIndex(o => o[1])]);
  ok(anaListe.length === 3 && valListe.length === 3, 'ANA : 3 et VAL : 3');
  const mauvais = [];
  for (const [nom, opts, b] of lots) {
    const L = opts.map(o => o.length), max = Math.max(...L), min = Math.min(...L);
    if (!(L[b] < max)) mauvais.push(`${nom} : la bonne réponse est la plus longue (${L.join(', ')}, bonne = ${b})`);
    if (!(max - min <= 40 || max / min < 1.7)) mauvais.push(`${nom} : options déséquilibrées (${L.join(', ')})`);
    if (L[b] === min) mauvais.push(`${nom} : bonne réponse la plus courte (${L.join(', ')}, bonne = ${b})`);
  }
  for (const q of [0, 1]) { const b = sapp.build(sapp.gen(), q), L = [b.cherche.bonne, ...b.cherche.faux].map(s => s.length); if (!(L[0] < Math.max(...L)) || L[0] === Math.min(...L)) mauvais.push(`S'APP q${q} : libellés ${L.join('/')}`); }
  ok(mauvais.length === 0, '\n' + mauvais.join('\n'));
  // titres sans « _ » ; ANA et VAL sans « ÷ », « ^ »
  const titres = [...D.ENONCES.filter(x => x.id.startsWith('isn-')).map(x => x.titre), ...anaListe.map(x => x.titre), ...valListe.map(x => x.titre), fam.titre];
  ok(titres.every(s => !/_|÷/.test(s)), 'titres sans « _ »');
  const brut = JSON.stringify([anaListe, valListe]);
  ok(!/÷|\^/.test(brut), 'pas de « ÷ » ni « ^ » dans les ANA et VAL'); ok(!/frac\([^)]*_/.test(brut), 'pas de « _ » dans frac(…)');
  // domaine rattaché au chapitre
  const C = await srv.ssrLoadModule('/src/chapitres.js');
  ok(C.CHAPITRES.some(c => c.sims.includes(211) && c.domaines.includes(fam.domaine)), 'domaine rattaché au chapitre de la sim 211');
  console.log(`  ${lots.length} QCM contrôlés (parcours + ANA + VAL) ; pièges par question : min ${Math.min(...nPieges)}`);
  console.log(`OK isnTirages : ${n} contrôles ; pire arrondi à 2 chiffres : ${(pireTol * 100).toFixed(2)} %`);
} finally { await srv.close(); }
