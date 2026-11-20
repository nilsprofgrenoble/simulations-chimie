// Tirages des exercices « etat2gt- » : bonne réponse acceptée par verifier(), arrondi à 2 chiffres significatifs accepté, valeur de L recopiée refusée,
// aucun piège accepté, aucune valeur non finie ; longueur des options de QCM (REA, ANA, VAL) ; S'APP.
// Usage : node src/simulations/changementEtat2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const ETM = await srv.ssrLoadModule('/src/simulations/changementEtat2gtModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'etat2gt-calcul');
  ok(fam && fam.domaine === 'Changement d’état (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));
  const arr2 = x => Number(x.toPrecision(2));
  let pireEcart = 0, nbPieges = 0;
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|÷|undefined|NaN/.test(s) && !/ \/ /.test(s)), `texte affiché : ${T.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        ok(q.bonne >= 0 && q.bonne < 4, `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length); ok(L[q.bonne] <= Math.max(...L) || new Set(L).size === 1, `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
        ok(!/undefined|NaN/.test(q.options.join('')), 'options');
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0, `valeur non finie ${q.id}`);
      ok(R.verifier(q, String(q.vrai).replace('.', ',')).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(arr2(q.vrai)).replace('.', ',')).ok, `arrondi à 2 CS refusé ${q.id} : ${q.vrai} → ${arr2(q.vrai)}`);
      pireEcart = Math.max(pireEcart, Math.abs(arr2(q.vrai) - q.vrai) / q.vrai);
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // valeur de L recopiée du cours : refusée pour les questions qui donnent L
    const L1 = num(T[1].match(/L = ([\d\s,]+) kJ\/kg/)[1]); ok(!R.verifier(e.questions[1], String(L1).replace('.', ',')).ok, `q1 : L recopié accepté (${L1} pour ${e.questions[1].vrai})`);
    const L2 = num(T[2].match(/L = ([\d\s,]+) kJ\/kg/)[1]); ok(!R.verifier(e.questions[2], String(L2).replace('.', ',')).ok, 'q2 : L recopié accepté');
    const L3 = num(T[3].match(/L = ([\d\s,]+) kJ\/kg/)[1]); ok(!R.verifier(e.questions[3], String(L3).replace('.', ',')).ok, 'q3 : L recopié accepté');
    // q1 : refait le calcul à partir du texte affiché
    const m1 = num(T[1].match(/pour ([\d,]+) kg/)[1]); ok(Math.abs(m1 * L1 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai, `q1 : ${T[1]}`);
    // q3 : refait le calcul (grammes)
    const g3 = num(T[3].match(/pour ([\d\s]+) g /)[1]); ok(Math.abs(g3 / 1000 * L3 - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q3 : ${T[3]}`);
    // q5 : proportionnalité
    const mm = [...T[5].matchAll(/([\d,]+) kg/g)].map(m => num(m[1])), E5 = num(T[5].match(/échangent ([\d,\s]+) kJ/)[1]);
    ok(Math.abs(E5 * mm[1] / mm[0] - e.questions[4 + 1].vrai) < 1e-9 * e.questions[5].vrai, `q5 : ${T[5]}`);
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés, pire écart d’un arrondi à 2 CS : ${(pireEcart * 100).toFixed(2)} % (tolérance 6 %)`);
  ok(pireEcart < 0.06, 'tolérance plus stricte que l’arrondi à 2 CS');

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('etat2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('etat2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let plusCourtes = 0, total = 0;
  for (const x of [...ana, ...val]) {
    const o = x.options, L = o.map(p => p[0].length), b = o.findIndex(p => p[1]);
    ok(o.filter(p => p[1]).length === 1, `${x.id} : une seule bonne réponse`);
    ok(L[b] < Math.max(...L), `${x.id} : la bonne réponse est la plus longue ${L}`);
    total++; if (L[b] === Math.min(...L)) plusCourtes++;
    ok(o.every(p => p[2] && p[2].length > 20), `${x.id} : chaque option est expliquée`);
    ok(!/undefined|NaN|_|\^/.test(JSON.stringify(x)), `${x.id} : texte`);
  }
  console.log(`ANA ${ana.length}, VAL ${val.length} ; bonne réponse la plus courte : ${plusCourtes}/${total}`);
  ok(plusCourtes <= total / 2, 'la bonne réponse est trop souvent la plus courte');

  // S'APP
  const sapp = D.ENONCES.filter(x => x.id.startsWith('etat2gt-'));
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
