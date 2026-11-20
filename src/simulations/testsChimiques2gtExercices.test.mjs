// Tirages des exercices « test2gt- » : bonne réponse acceptée par verifier(), aucun piège accepté, aucune valeur non finie ; options de QCM (REA, ANA, VAL) ; S'APP.
// Usage : node src/simulations/testsChimiques2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const fam = R.FAMILLES.find(f => f.id === 'test2gt-calcul');
  ok(fam && fam.domaine === 'Tests chimiques (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));
  let nbPieges = 0, plusCourtes = 0, nbQcm = 0, bonneLaPlusLongue = 0;
  const placesBonne = {};
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷|undefined|NaN/.test(s) && !/ \/ /.test(s)), `texte affiché : ${T.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        ok(q.bonne >= 0 && q.bonne < 4, `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length);
        ok(L[q.bonne] < Math.max(...L) || new Set(L).size === 1, `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
        if (L[q.bonne] <= Math.min(...L)) plusCourtes++; nbQcm++;
        placesBonne[q.id] = placesBonne[q.id] || new Set(); placesBonne[q.id].add(q.bonne);
        ok(!/undefined|NaN/.test(q.options.join('')), 'options');
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0 && Number.isInteger(q.vrai), `valeur non finie ou non entière ${q.id}`);
      ok(R.verifier(q, String(q.vrai)).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(!R.verifier(q, String(q.vrai + 1)).ok && !R.verifier(q, String(q.vrai - 1)).ok, `réponse voisine acceptée ${q.id}`);
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // refait les calculs à partir du texte affiché
    const n2 = num(T[2].match(/ces (\d) gaz/)[1]); ok(e.questions[2].vrai === n2 - 1, `q2 : ${T[2]}`);
    const m3 = num(T[3].match(/gaz de (\d) tubes/)[1]), n3 = num(T[3].match(/l’un de (\d) gaz possibles/)[1]), t3 = num(T[3].match(/dure (\d) min/)[1]);
    ok(e.questions[3].vrai === m3 * (n3 - 1) * t3, `q3 : ${T[3]}`);
    // q0 : les quatre options ont toutes un réactif et une observation
    ok(e.questions[0].options.every(o => / : /.test(o)), 'q0 : options réactif : observation');
    // q4 : la phrase de la bonne réponse cohérente avec les résultats des deux tests affichés
    const q4 = e.questions[4], bonne4 = q4.options[q4.bonne], eau = /de l’eau est positif|test de l’eau est positif/.test(T[4]), co2 = /dioxyde de carbone est positif/.test(T[4]);
    const attendu = eau && co2 ? 'eau et dioxyde de carbone détectés tous les deux' : eau ? 'eau détectée, pas de dioxyde de carbone détecté' : co2 ? 'dioxyde de carbone détecté, pas d’eau détectée' : 'ni eau ni dioxyde de carbone détectés';
    ok(bonne4 === attendu, `q4 : ${T[4]} -> ${bonne4}`);
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés ; QCM : bonne réponse la plus courte ${plusCourtes}/${nbQcm}`);
  ok(plusCourtes / nbQcm < 0.5, 'la bonne réponse est trop souvent la plus courte');
  for (const [id, s] of Object.entries(placesBonne)) ok(s.size === 4, `QCM ${id} : la bonne réponse change de place`);

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('test2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('test2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let pc = 0, total = 0;
  for (const x of [...ana, ...val]) {
    const o = x.options, L = o.map(p => p[0].length), b = o.findIndex(p => p[1]);
    ok(o.filter(p => p[1]).length === 1, `${x.id} : une seule bonne réponse`);
    ok(L[b] < Math.max(...L), `${x.id} : la bonne réponse est la plus longue ${L}`);
    total++; if (L[b] === Math.min(...L)) pc++;
    ok(o.every(p => p[2] && p[2].length > 20), `${x.id} : chaque option est expliquée`);
    ok(!/undefined|NaN|_|\^/.test(JSON.stringify(x)), `${x.id} : texte`);
    ok(!/\bions?\b/i.test(JSON.stringify(x)), `${x.id} : pas d’ion`);
  }
  console.log(`ANA ${ana.length}, VAL ${val.length} ; bonne réponse la plus courte : ${pc}/${total}`);
  ok(pc <= total / 2, 'la bonne réponse est trop souvent la plus courte');
  ok(val.some(x => x.plausible) && val.some(x => !x.plausible), 'VAL : des plausibles et des non plausibles');

  // S'APP
  const sapp = D.ENONCES.filter(x => x.id.startsWith('test2gt-'));
  ok(sapp.length === 2, 'S’APP : 2 énoncés');
  for (const x of sapp) for (let t = 0; t < 500; t++) {
    const p = x.gen();
    for (const q of [0, 1]) {
      const b = x.build(p, q);
      ok(b.utiles.every(u => b.tokens[u]) && b.utiles.length >= 2, `${x.id} : données utiles présentes`);
      ok(Object.keys(b.tokens).every(k => b.utiles.includes(k) || b.raisons[k]), `${x.id} : chaque donnée inutile a une raison`);
      ok(isFinite(b.solution.val) && b.solution.val > 0 && (x.id !== 'test2gt-sapp-poudre' || q === 0 || Number.isInteger(b.solution.val)), `${x.id} : solution finie (entière pour un nombre d’essais)`);
      ok(b.cherche.faux.length === 3 && b.cherche.bonne.length <= Math.max(...b.cherche.faux.map(f => f.length)), `${x.id} : la bonne grandeur cherchée est la plus longue : ${b.cherche.bonne}`);
    }
  }
  // solutions refaites à la main
  { const p = { n: 4, t: 3, m: 5, V: 50, th: 20 }; ok(sapp[0].build(p, 0).solution.val === 9 && sapp[0].build(p, 1).solution.val === 45, 'S’APP 1 : (4 − 1) × 3 = 9 min ; 5 × 9 = 45 min'); }
  { const p = { n: 6, m: 0.5, M: 20, V: 5, th: 20 }; ok(sapp[1].build(p, 0).solution.val === 3 && sapp[1].build(p, 1).solution.val === 40, 'S’APP 2 : 6 × 0,5 = 3 g ; 20 ÷ 0,5 = 40 essais'); }
  console.log(`${n} contrôles : tout est correct`);
} finally { await srv.close(); }
