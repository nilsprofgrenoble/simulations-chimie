// Tirages des exercices « syn2gt- » : bonne réponse acceptée, arrondi à 2 chiffres significatifs accepté, aucun piège accepté, valeurs recopiées refusées,
// calculs refaits à partir du texte affiché ; longueur des options de QCM (REA, ANA, VAL) ; S'APP.
// Usage : node src/simulations/syntheseReflux2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
const DOM = 'Synthèse et reflux (2GT)';
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = await srv.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const V = await srv.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const D = await srv.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = R.FAMILLES.find(f => f.id === 'syn2gt-calcul');
  ok(fam && fam.domaine === DOM, 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));
  const arr2 = x => Number(x.toPrecision(2));
  const RHO = { 'd’acide éthanoïque': 1.05, 'd’alcool isoamylique': 0.81, 'd’acétate d’isoamyle': 0.88 };
  let pireEcart = 0, nbPieges = 0, qcm = { acide: 0, eau: 0 };
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T0 = e.questions.map(q => txt(q.q)), T = T0.map(s => s.replace(/\u00a0/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷|undefined|NaN/.test(s) && !/ \/ /.test(s)), `texte affiché : ${T.join(' | ')}`);
    // espace insécable avant chaque unité
    ok(T0.every(s => !/\d (mL|g|L|h|min|g\/mL|L\/min)(?![\wéè])/.test(s)), `espace ordinaire avant une unité : ${T0.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        const L = q.options.map(o => o.length); ok(L[q.bonne] < Math.max(...L), `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0, `valeur non finie ${q.id}`);
      ok(R.verifier(q, String(q.vrai).replace('.', ',')).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(arr2(q.vrai)).replace('.', ',')).ok, `arrondi à 2 CS refusé ${q.id} : ${q.vrai} → ${arr2(q.vrai)}`);
      pireEcart = Math.max(pireEcart, Math.abs(arr2(q.vrai) - q.vrai) / q.vrai);
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // calculs refaits à partir du texte affiché
    const [q0, q1, q2, q3, q4] = e.questions;
    const liq = s => Object.keys(RHO).find(k => s.includes(k));
    const V0 = num(T[0].match(/mesure ([\d,]+) mL/)[1]); ok(Math.abs(RHO[liq(T[0])] * V0 - q0.vrai) < 1e-9 && T[0].includes(String(RHO[liq(T[0])]).replace('.', ',')), `q0 : ${T[0]}`);
    ok(!R.verifier(q0, String(V0).replace('.', ',')).ok, 'q0 : volume recopié accepté');
    const m1 = num(T[1].match(/il faut ([\d,]+) g/)[1]); ok(Math.abs(m1 / RHO[liq(T[1])] - q1.vrai) < 1e-9 * q1.vrai, `q1 : ${T[1]}`);
    ok(!R.verifier(q1, String(m1).replace('.', ',')).ok, 'q1 : masse recopiée acceptée');
    const [Va2, Vb2] = [num(T[2].match(/introduire ([\d,]+) mL/)[1]), num(T[2].match(/et ([\d,]+) mL d’acide/)[1])]; ok(Math.abs(2 * (Va2 + Vb2) - q2.vrai) < 1e-9, `q2 : ${T[2]}`);
    ok(!R.verifier(q2, String(Va2 + Vb2).replace('.', ',')).ok && !R.verifier(q2, String(Va2).replace('.', ',')).ok, 'q2 : volume du mélange recopié accepté');
    const [V3, m3] = [num(T[3].match(/mesure ([\d,]+) mL/)[1]), num(T[3].match(/indique ([\d,]+) g/)[1])]; ok(Math.abs(m3 / V3 - q3.vrai) < 1e-9 && q3.vrai > 0.7 && q3.vrai < 1.1, `q3 : ${T[3]}`);
    const m4 = num(T[4].match(/masse de ([\d,]+) g/)[1]), b4 = q4.options[q4.bonne], r4 = { 'l’acide éthanoïque': 1.05, 'l’alcool isoamylique': 0.81, 'le dichlorométhane': 1.33 }[b4]; ok(r4 && Math.abs(m4 / 20 - r4) < 0.0026, `q4 : ${T[4]} → ${b4}`);
    qcm[b4 === 'le dichlorométhane' ? 'eau' : 'acide']++;
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés, pire écart d’un arrondi à 2 CS : ${(pireEcart * 100).toFixed(2)} % (tolérance 6 %) ; QCM : ${qcm.acide} acide, ${qcm.eau} eau`);
  ok(pireEcart < 0.06, 'tolérance plus stricte que l’arrondi à 2 CS');
  ok(qcm.acide > 2000 && qcm.eau > 1000, 'q4 : les cas sont tirés');

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('syn2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('syn2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let plusCourtes = 0, total = 0;
  for (const x of [...ana, ...val]) {
    const o = x.options, L = o.map(p => p[0].length), b = o.findIndex(p => p[1]);
    ok(o.filter(p => p[1]).length === 1, `${x.id} : une seule bonne réponse`);
    ok(L[b] < Math.max(...L), `${x.id} : la bonne réponse est la plus longue ${L}`);
    total++; if (L[b] === Math.min(...L)) plusCourtes++;
    ok(o.every(p => p[2] && p[2].length > 20), `${x.id} : chaque option est expliquée`);
    ok(!/undefined|NaN|_|\^|<sub>/.test(JSON.stringify(x)), `${x.id} : texte`);
    ok(x.domaine === DOM, `${x.id} : domaine`);
    ok(!/\d (°C|mL|g|L|h|min|mm|cm)(?![\wéè])/.test(JSON.stringify(x)), `${x.id} : espace ordinaire avant une unité`);
  }
  console.log(`ANA ${ana.length}, VAL ${val.length} ; bonne réponse la plus courte : ${plusCourtes}/${total}`);
  ok(plusCourtes <= total / 2, 'la bonne réponse est trop souvent la plus courte');
  ok(val.some(x => x.plausible) && val.some(x => !x.plausible), 'VAL : des résultats plausibles et d’autres non');

  // S'APP
  const sapp = D.ENONCES.filter(x => x.id.startsWith('syn2gt-'));
  ok(sapp.length === 2, 'S’APP : 2 énoncés');
  for (const x of sapp) for (let t = 0; t < 500; t++) {
    const p = x.gen();
    for (const q of [0, 1]) {
      const b = x.build(p, q);
      ok(b.utiles.every(u => b.tokens[u]) && b.utiles.length >= 2, `${x.id} : données utiles présentes`);
      ok(Object.keys(b.tokens).every(k => b.utiles.includes(k) || b.raisons[k]), `${x.id} : chaque donnée inutile a une raison`);
      ok(isFinite(b.solution.val) && b.solution.val > 0, `${x.id} : solution finie`);
      ok(b.cherche.faux.length === 3 && b.cherche.bonne.length <= Math.max(...b.cherche.faux.map(f => f.length)), `${x.id} : la bonne grandeur cherchée est la plus longue : ${b.cherche.bonne}`);
      ok(Object.values(b.tokens).every(k => !/\d [a-z°]/i.test(k.txt || k.t || '') ), `${x.id} : espace insécable`);
    }
  }
  console.log(`${n} contrôles : tout est correct`);
} finally { await srv.close(); }
