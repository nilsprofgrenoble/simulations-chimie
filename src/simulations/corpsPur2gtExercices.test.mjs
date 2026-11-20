// Tirages des exercices « pur2gt- » : bonne réponse acceptée par verifier(), arrondi accepté, aucun piège accepté, aucune valeur non finie ; une valeur « recopiée » de l'énoncé refusée ;
// longueur des options de QCM (REA, ANA, VAL : la bonne réponse n'est jamais la plus longue) ; S'APP.
// Usage : node src/simulations/corpsPur2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const CPM = await srv.ssrLoadModule('/src/simulations/corpsPur2gtModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'pur2gt-calcul');
  ok(fam && fam.domaine === 'Corps purs et mélanges (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const arr2 = x => Number(x.toPrecision(2));
  let nbPieges = 0, nPur = 0, nMel = 0, nCompat = 0, nNon = 0, plusLongues = 0, nQcm = 0;
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|÷|undefined|NaN|\[object/.test(s)), `texte affiché : ${T.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        ok(q.bonne >= 0 && q.bonne < 4, `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length);
        nQcm++; if (L[q.bonne] === Math.max(...L) && new Set(L).size > 1) plusLongues++;
        ok(L[q.bonne] < Math.max(...L), `QCM ${q.id} : la bonne réponse est la plus longue : ${q.options}`);
        ok(!/undefined|NaN/.test(q.options.join('')), 'options');
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0, `valeur non finie ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(q.vrai).replace('.', ',')).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(arr2(q.vrai)).replace('.', ',')).ok || q.id === 'g2' || q.id === 'g5', `arrondi à 2 CS refusé ${q.id} : ${q.vrai}`);
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // q0 : série cohérente avec la bonne réponse (variation < 0,5 °C pour un corps pur ; > 0,5 °C pour un mélange)
    const s0 = T[0].match(/valeurs suivantes \(en °C\) : ([\d,\s;]+)\. Il s/)[1].split(';').map(x => Number(x.trim().replace(',', '.')));
    const bonne0 = e.questions[0].options[e.questions[0].bonne], etendue = Math.max(...s0) - Math.min(...s0);
    if (/^un corps pur : température constante/.test(bonne0)) { nPur++; ok(etendue < 0.5, `q0 pur : étendue ${etendue}`); } else { nMel++; ok(/^un mélange : la température monte/.test(bonne0) && etendue > 2, `q0 mélange : étendue ${etendue}`); }
    // q1 : au moins 4 valeurs du palier dans la série et vrai = valeur du palier
    const s1 = T[1].match(/\(en °C\) : ([\d,\s;]+)\. Quelle/)[1].split(';').map(x => Number(x.trim().replace(',', '.')));
    ok(s1.length === 8 && s1.filter(x => Math.abs(x - e.questions[1].vrai) <= 0.15).length >= 4, `q1 : palier dans la série ${s1} (vrai ${e.questions[1].vrai})`);
    // q2 : l'écart se refait à partir du texte
    const m2 = [...T[2].matchAll(/([\d]+(?:,\d+)?) °C/g)].map(m => Number(m[1].replace(',', '.')));
    ok(Math.abs(Math.abs(m2[0] - m2[1]) - e.questions[2].vrai) < 1e-6, `q2 : ${T[2]}`);
    ok(!R.verifier(e.questions[2], String(m2[0]).replace('.', ',')).ok && !R.verifier(e.questions[2], String(m2[1]).replace('.', ',')).ok, 'q2 : valeur recopiée acceptée');
    // q3 : la bonne réponse correspond à la règle « écart < précision »
    const m3 = [...T[3].matchAll(/([\d]+(?:,\d+)?) °C/g)].map(m => Number(m[1].replace(',', '.'))), ec3 = Math.abs(m3[1] - m3[2]), p3 = m3[0];
    const bonne3 = e.questions[3].options[e.questions[3].bonne];
    ok(Math.abs(ec3 - p3) > 0.2 * p3, `q3 : écart trop proche de la précision ${ec3} ${p3}`);
    ok((ec3 < p3) === /^compatible : l’écart/.test(bonne3) && (ec3 > p3) === /^pas compatible : l’écart/.test(bonne3), `q3 : ${T[3]} → ${bonne3}`);
    if (ec3 < p3) nCompat++; else nNon++;
    // q4 : un seul liquide compatible et c'est celui de la bonne réponse
    const m4 = [...T[4].matchAll(/([\d]+(?:,\d+)?) °C/g)].map(m => Number(m[1].replace(',', '.'))), lue4 = m4[0], p4 = m4[1];
    const compat4 = CPM.compatibles(lue4, p4);
    ok(compat4.length === 1 && CPM.CORPS[compat4[0]].Tvap === e.questions[4].vrai, `q4 : ${T[4]}`);
    ok(!R.verifier(e.questions[4], String(lue4).replace('.', ',')).ok, 'q4 : valeur lue recopiée acceptée');
    // q5 : zone
    const m5 = [...T[5].matchAll(/([\d]+(?:,\d+)?) °C/g)].map(m => Number(m[1].replace(',', '.')));
    ok(Math.abs(Math.abs(e.questions[5].vrai - m5[1]) - m5[0]) < 1e-6, `q5 : ${T[5]}`);
    ok(!R.verifier(e.questions[5], String(m5[1]).replace('.', ',')).ok, 'q5 : valeur lue recopiée acceptée');
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés ; q0 : ${nPur} corps purs et ${nMel} mélanges ; q3 : ${nCompat} compatibles et ${nNon} non ; ${nQcm} QCM (bonne réponse la plus longue : ${plusLongues})`);
  ok(nPur > 2000 && nMel > 2000 && nCompat > 2000 && nNon > 2000, 'équilibre des tirages');

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('pur2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('pur2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let plusCourtes = 0, total = 0;
  for (const x of [...ana, ...val]) {
    ok(x.domaine === 'Corps purs et mélanges (2GT)', `${x.id} : domaine`);
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
  const sapp = D.ENONCES.filter(x => x.id.startsWith('pur2gt-'));
  ok(sapp.length === 2, 'S’APP : 2 énoncés');
  for (const x of sapp) {
    ok(x.domaine === 'Corps purs et mélanges (2GT)', `${x.id} : domaine`);
    for (let t = 0; t < 500; t++) {
      const p = x.gen();
      for (const q of [0, 1]) {
        const b = x.build(p, q);
        ok(b.utiles.every(u => b.tokens[u]) && b.utiles.length >= 2, `${x.id} : données utiles présentes`);
        ok(Object.keys(b.tokens).every(k => b.utiles.includes(k) || b.raisons[k]), `${x.id} : chaque donnée inutile a une raison`);
        ok(isFinite(b.solution.val) && b.solution.val > 0, `${x.id} : solution finie ${b.solution.val}`);
        ok(b.cherche.faux.length === 3 && b.cherche.bonne.length < Math.max(...b.cherche.faux.map(f => f.length)), `${x.id} : la bonne grandeur cherchée est la plus longue : ${b.cherche.bonne}`);
        ok(!/undefined|NaN/.test(JSON.stringify(b)), `${x.id} : texte`);
      }
    }
  }
  console.log(`${n} contrôles : tout est correct`);
} finally { await srv.close(); }
