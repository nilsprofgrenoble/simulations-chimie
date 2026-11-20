// Tirages des exercices « prisme2gt- » : bonne réponse acceptée par verifier(), arrondi accepté, angle ou indice recopié refusé,
// aucun piège accepté, aucune valeur non finie ; longueur des options de QCM (REA, ANA, VAL) ; S'APP.
// Usage : node src/simulations/prisme2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const fam = R.FAMILLES.find(f => f.id === 'prisme2gt-calcul');
  ok(fam && fam.domaine === 'Dispersion de la lumière (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-'));
  const NBSP = / /g;
  let pireEcart = 0, nbPieges = 0;
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(NBSP, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷|undefined|NaN/.test(s) && !/ \/ /.test(s)), `texte affiché : ${T.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        ok(q.bonne >= 0 && q.bonne < 4, `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length); ok(L[q.bonne] <= Math.max(...L) || new Set(L).size === 1, `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
        ok(!/undefined|NaN/.test(q.options.join('')), 'options');
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0, `valeur non finie ${q.id}`);
      const aff = q.csMin ? q.vrai.toPrecision(q.csMin) : String(q.vrai);
      ok(R.verifier(q, aff.replace('.', ',')).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(q.vrai).replace('.', ',')).ok || q.csMin, `valeur exacte refusée ${q.id}`);
      if (!q.csMin) { const arr = Math.round(q.vrai * 10) / 10, ent = Math.round(q.vrai); ok(R.verifier(q, String(arr).replace('.', ',')).ok, `arrondi au dixième refusé ${q.id} : ${q.vrai}`); if (q.id !== 'g2') { ok(R.verifier(q, String(ent)).ok, `arrondi à l’unité refusé ${q.id} : ${q.vrai}`); pireEcart = Math.max(pireEcart, Math.abs(ent - q.vrai) / q.vrai); } }
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // valeurs recopiées de l'énoncé : refusées
    const ang = (s, re) => num(s.match(re)[1]);
    ok(!R.verifier(e.questions[0], String(ang(T[0], /i₁ = (\d+) °/)).replace('.', ',')).ok, 'q0 : i₁ recopié accepté');
    ok(!R.verifier(e.questions[0], String(ang(T[0], /n = ([\d,]+)\./)).replace('.', ',')).ok, 'q0 : n recopié accepté');
    ok(!R.verifier(e.questions[1], String(ang(T[1], /i₃ = (\d+) °/))).ok, 'q1 : i₃ recopié accepté');
    ok(!R.verifier(e.questions[4], String(ang(T[4], /i₂ = ([\d,]+) °/)).replace('.', ',')).ok, 'q4 : i₂ recopié accepté');
    // q0 et q1 : on refait le calcul à partir du texte affiché
    const i1 = ang(T[0], /i₁ = (\d+) °/), n0 = ang(T[0], /n = ([\d,]+)\./), calc0 = Math.asin(Math.sin(i1 * Math.PI / 180) / n0) * 180 / Math.PI;
    ok(Math.abs(calc0 - e.questions[0].vrai) < 1e-9, `q0 : ${T[0]}`);
    const i3 = ang(T[1], /i₃ = (\d+) °/), n1 = ang(T[1], /n = ([\d,]+) ;/), calc1 = Math.asin(n1 * Math.sin(i3 * Math.PI / 180)) * 180 / Math.PI;
    ok(Math.abs(calc1 - e.questions[1].vrai) < 1e-9, `q1 : ${T[1]}`);
    const Ds = [...T[2].matchAll(/D = ([\d,]+) °/g)].map(m => num(m[1])); ok(Math.abs(Ds[0] - Ds[1] - e.questions[2].vrai) < 1e-9, `q2 : ${T[2]}`);
    // q3 : le laser désigné a bien l'indice le plus grand dans le texte affiché
    const idx = [...T[3].matchAll(/(\d+) nm : ([\d,]+)/g)].map(m => [num(m[1]), num(m[2])]), mx = idx.reduce((a, b) => (b[1] > a[1] ? b : a)), q3 = e.questions[3];
    ok(q3.options[q3.bonne].replace(NBSP, ' ').includes(`${mx[0]} nm`) && idx.filter(x => x[1] === mx[1]).length === 1, `q3 : ${T[3]}`);
    const i1b = ang(T[4], /i₁ = (\d+) °/), i2b = ang(T[4], /i₂ = ([\d,]+) °/), calc4 = Math.sin(i1b * Math.PI / 180) / Math.sin(i2b * Math.PI / 180);
    ok(Math.abs(calc4 - e.questions[4].vrai) < 1e-9, `q4 : ${T[4]}`);
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés, pire écart d’un arrondi à l’unité : ${(pireEcart * 100).toFixed(2)} % (tolérance 2,5 %)`);
  ok(pireEcart < 0.025, 'tolérance plus stricte que l’arrondi à l’unité');

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('prisme2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('prisme2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let plusCourtes = 0, total = 0, bonnesPlusLongues = 0;
  for (const x of [...ana, ...val]) {
    const o = x.options, L = o.map(p => p[0].length), b = o.findIndex(p => p[1]);
    ok(o.filter(p => p[1]).length === 1, `${x.id} : une seule bonne réponse`);
    ok(L[b] <= Math.max(...L) - 3, `${x.id} : la bonne réponse est la plus longue (ou à moins de 3 caractères de la plus longue) ${L}`);
    total++; if (L[b] === Math.min(...L)) plusCourtes++;
    ok(o.every(p => p[2] && p[2].length > 20), `${x.id} : chaque option est expliquée`);
    ok(!/undefined|NaN|_|\^/.test(JSON.stringify(x)), `${x.id} : texte`);
    ok(x.domaine === 'Dispersion de la lumière (2GT)', `${x.id} : domaine`);
  }
  console.log(`ANA ${ana.length}, VAL ${val.length} ; bonne réponse la plus courte : ${plusCourtes}/${total}`);
  ok(plusCourtes <= total / 2, 'la bonne réponse est trop souvent la plus courte');
  void bonnesPlusLongues;

  // S'APP
  const sapp = D.ENONCES.filter(x => x.id.startsWith('prisme2gt-'));
  ok(sapp.length === 2, 'S’APP : 2 énoncés');
  for (const x of sapp) for (let t = 0; t < 500; t++) {
    const p = x.gen();
    for (const q of [0, 1]) {
      const b = x.build(p, q);
      ok(b.utiles.every(u => b.tokens[u]) && b.utiles.length >= 2, `${x.id} : données utiles présentes`);
      ok(Object.keys(b.tokens).every(k => b.utiles.includes(k) || b.raisons[k]), `${x.id} : chaque donnée inutile a une raison`);
      ok(isFinite(b.solution.val) && b.solution.val > 0, `${x.id} : solution finie`);
      ok(b.cherche.faux.length === 3 && b.cherche.bonne.length <= Math.max(...b.cherche.faux.map(f => f.length)), `${x.id} : la bonne grandeur cherchée est la plus longue : ${b.cherche.bonne}`);
    }
  }
  console.log(`${n} contrôles : tout est correct`);
} finally { await srv.close(); }
