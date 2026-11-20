// Tirages des exercices « noy2gt- » : bonne réponse acceptée par verifier(), arrondi accepté, aucun piège accepté, aucune valeur non finie ; une valeur « recopiée » de l'énoncé refusée ;
// longueur des options de QCM (REA, ANA, VAL : la bonne réponse n'est jamais strictement la plus longue) ; S'APP.
// Usage : node src/simulations/noyauAtome2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const NM = await srv.ssrLoadModule('/src/simulations/noyauAtome2gtModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'noy2gt-calcul');
  ok(fam && fam.domaine === 'Noyau de l’atome (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const arr2 = x => Number(x.toPrecision(2));
  const NBc = String.fromCharCode(160);
  let nbPieges = 0, nQcm = 0, plusLongues = 0; const vus = new Set();
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/ /g, ' '));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|÷|undefined|NaN|\[object/.test(s)), `texte affiché : ${T.join(' | ')}`);
    const brut = e.questions.map(q => txt(q.q));
    ok(brut.every(s => !/\d [°%]|\d (m|kg|C|mm|cm|km)\b/.test(s)), `espace ordinaire avant une unité : ${brut.join(' | ')}`);
    for (const q of e.questions) {
      const ex = txt(q.expl); ok(!/undefined|NaN|\[object|_/.test(ex) && !/\d (m|kg|C|mm|cm|km)\b/.test(ex), `explication ${q.id} : ${ex}`);
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes ${q.options}`);
        ok(q.bonne >= 0 && q.bonne < 4, `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length), autres = L.filter((_, i) => i !== q.bonne);
        nQcm++; if (L[q.bonne] > Math.max(...autres)) plusLongues++;
        ok(L[q.bonne] <= Math.max(...autres), `QCM ${q.id} : la bonne réponse est la plus longue : ${q.options}`);
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0, `valeur non finie ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(q.vrai).replace('.', ',')).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(arr2(q.vrai)).replace('.', ',')).ok || q.id === 'g0' || q.id === 'g1', `arrondi à 2 CS refusé ${q.id} : ${q.vrai}`);
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // q0 : la valeur recopiée de l'écriture (A ou Z) est refusée ; neutrons = A − Z
    const m0 = brut[0].match(/s’écrit ([⁰¹²³⁴⁵⁶⁷⁸⁹]+)([₀₁₂₃₄₅₆₇₈₉]+)([A-Z][a-z]?)/), nombre = s => Number([...s].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c) >= 0 ? '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c) : '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).join(''));
    ok(m0, `q0 : écriture lue : ${brut[0]}`);
    const A0 = nombre(m0[1]), Z0 = nombre(m0[2]), el0 = NM.elementDeSym(m0[3]);
    ok(el0 && el0.A === A0 && el0.Z === Z0, `q0 : noyau cohérent ${m0[0]}`);
    ok(e.questions[0].vrai === A0 - Z0 && A0 - Z0 !== Z0 && A0 - Z0 !== A0, 'q0 : neutrons ≠ A et ≠ Z');
    ok(!R.verifier(e.questions[0], String(A0)).ok && !R.verifier(e.questions[0], String(Z0)).ok, 'q0 : valeur recopiée acceptée');
    // q1 : A = protons + neutrons, texte cohérent
    const m1 = [...T[1].matchAll(/(\d+) (protons|neutrons)/g)].map(m => Number(m[1]));
    ok(m1.length === 2 && e.questions[1].vrai === m1[0] + m1[1] && !R.verifier(e.questions[1], String(m1[0])).ok && !R.verifier(e.questions[1], String(m1[1])).ok, `q1 : ${T[1]}`);
    // q2 : charge = protons × 1,60 ; la valeur recopiée (protons, neutrons) est refusée
    const m2 = [...T[2].matchAll(/(\d+) (protons|neutrons)/g)].map(m => Number(m[1]));
    ok(Math.abs(e.questions[2].vrai - m2[0] * 1.6) < 1e-9 && !R.verifier(e.questions[2], String(m2[0])).ok && !R.verifier(e.questions[2], '1,6').ok, `q2 : ${T[2]}`);
    // q3 : masse = A × 1,67 ÷ 10 ; A recopié refusé
    const m3 = Number(T[3].match(/contient (\d+) nucléons/)[1]);
    ok(Math.abs(e.questions[3].vrai - m3 * 0.167) < 1e-9 && !R.verifier(e.questions[3], String(m3)).ok && !R.verifier(e.questions[3], '1,67').ok, `q3 : ${T[3]}`);
    // q4 : taille du noyau = D ÷ 100 000 en mm ; D recopié refusé
    const D4 = Number(T[4].match(/mesure (\d+) m\./)[1]);
    ok(Math.abs(e.questions[4].vrai - D4 / 1e5 * 1000) < 1e-12 && !R.verifier(e.questions[4], String(D4)).ok && NM.RAPPORT_TAILLES === 1e5, `q4 : ${T[4]}`);
    vus.add(`${A0}-${D4}`);
    // q5 : la bonne option est l'écriture de l'élément (A en haut, Z en bas)
    const q5 = e.questions[5], b5 = q5.options[q5.bonne], m5 = b5.match(/^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)([₀₁₂₃₄₅₆₇₈₉]+)([A-Z][a-z]?)$/);
    const P5 = [...T[5].matchAll(/(\d+) (protons|neutrons)/g)].map(m => Number(m[1]));
    ok(m5 && nombre(m5[1]) === P5[0] + P5[1] && nombre(m5[2]) === P5[0] && NM.element(P5[0]).s === m5[3], `q5 : ${T[5]} → ${b5}`);
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés ; ${nQcm} QCM (bonne réponse strictement la plus longue : ${plusLongues}) ; ${vus.size} combinaisons vues`);
  ok(nQcm === 6000 && plusLongues === 0, 'QCM REA');
  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('noy2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('noy2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let plusCourtes = 0, total = 0;
  for (const x of [...ana, ...val]) {
    ok(x.domaine === 'Noyau de l’atome (2GT)', `${x.id} : domaine`);
    const o = x.options, L = o.map(p => p[0].length), b = o.findIndex(p => p[1]);
    ok(o.filter(p => p[1]).length === 1, `${x.id} : une seule bonne réponse`);
    ok(L[b] <= Math.max(...L.filter((_, i) => i !== b)), `${x.id} : la bonne réponse est la plus longue ${L}`);
    total++; if (L[b] < Math.min(...L.filter((_, i) => i !== b))) plusCourtes++;
    ok(o.every(p => p[2] && p[2].length > 20), `${x.id} : chaque option est expliquée`);
    ok(!/undefined|NaN|_|\^/.test(JSON.stringify(x).replace(/\\u00a0/g, '')), `${x.id} : texte`);
    const brut = JSON.stringify(x);
    ok(!/\d [°%]|\d (m|kg|C|mm|cm|km)\b/.test(brut.replace(/\\u00a0/g, NBc)), `${x.id} : espace ordinaire avant une unité`);
  }
  console.log(`ANA ${ana.length}, VAL ${val.length} ; bonne réponse strictement la plus courte : ${plusCourtes}/${total}`);
  ok(plusCourtes <= total / 2, 'la bonne réponse est trop souvent la plus courte');
  const plaus = val.filter(x => x.plausible).length; ok(plaus >= 1 && plaus < val.length, 'VAL : au moins un plausible et un non plausible');
  // S'APP
  const sapp = D.ENONCES.filter(x => x.id.startsWith('noy2gt-'));
  ok(sapp.length === 2, 'S’APP : 2 énoncés');
  for (const x of sapp) {
    ok(x.domaine === 'Noyau de l’atome (2GT)', `${x.id} : domaine`);
    for (let t = 0; t < 500; t++) {
      const p = x.gen();
      for (const q of [0, 1]) {
        const b = x.build(p, q);
        ok(b.utiles.every(u => b.tokens[u]) && b.utiles.length >= 2, `${x.id} : données utiles présentes`);
        ok(Object.keys(b.tokens).every(k => b.utiles.includes(k) || b.raisons[k]), `${x.id} : chaque donnée inutile a une raison`);
        ok(isFinite(b.solution.val) && b.solution.val > 0, `${x.id} : solution finie ${b.solution.val}`);
        ok(b.cherche.faux.length === 3 && b.cherche.bonne.length < Math.max(...b.cherche.faux.map(f => f.length)), `${x.id} : la bonne grandeur cherchée est la plus longue : ${b.cherche.bonne}`);
        ok(!/undefined|NaN/.test(JSON.stringify(b)), `${x.id} : texte`);
        ok(!/\d [°%]|\d (m|kg|C|mm|cm|km)\b/.test(JSON.stringify(b.tokens).replace(/\\u00a0/g, NBc)), `${x.id} : espace ordinaire avant une unité dans les données`);
      }
    }
  }
  console.log(`${n} contrôles : tout est correct`);
} finally { await srv.close(); }
