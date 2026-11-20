// Tirages des exercices « ccm2gt- » : bonne réponse acceptée par verifier(), arrondi à 2 chiffres significatifs accepté, aucun piège accepté, aucune valeur non finie,
// valeurs recopiées de l'énoncé refusées, calculs refaits à partir du texte affiché ; longueur des options de QCM (REA, ANA, VAL) ; S'APP.
// Usage : node src/simulations/ccm2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const fam = R.FAMILLES.find(f => f.id === 'ccm2gt-calcul');
  ok(fam && fam.domaine === 'Chromatographie sur couche mince (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));
  const arr2 = x => Number(x.toPrecision(2));
  let pireEcart = 0, nbPieges = 0, qcmMem = 0, qcmDiff = 0;
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|÷|undefined|NaN/.test(s) && !/ \/ /.test(s)), `texte affiché : ${T.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        ok(q.bonne >= 0 && q.bonne < 4, `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length); ok(L[q.bonne] < Math.max(...L) || new Set(L).size === 1, `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
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
    const cm = s => [...s.matchAll(/([\d,]+) cm/g)].map(m => num(m[1]));
    const [d0, F0] = cm(T[0]); ok(Math.abs(d0 / F0 - e.questions[0].vrai) < 1e-9 && d0 < F0, `q0 : ${T[0]}`);
    ok(!R.verifier(e.questions[0], String(d0).replace('.', ',')).ok, 'q0 : distance recopiée acceptée');
    const rf1 = num(T[1].match(/Rf = ([\d,]+)/)[1]), F1 = cm(T[1])[0]; ok(Math.abs(rf1 * F1 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai && e.questions[1].vrai < F1, `q1 : ${T[1]}`);
    ok(!R.verifier(e.questions[1], String(F1).replace('.', ',')).ok && !R.verifier(e.questions[1], String(rf1).replace('.', ',')).ok, 'q1 : valeur recopiée acceptée');
    const mm = num(T[2].match(/à ([\d]+) mm/)[1]), F2 = cm(T[2])[0]; ok(Math.abs(mm / 10 / F2 - e.questions[2].vrai) < 1e-9 && mm / 10 < F2, `q2 : ${T[2]}`);
    ok(!R.verifier(e.questions[2], String(mm / F2).replace('.', ',')).ok, 'q2 : grandeur non convertie acceptée');
    const rf3 = num(T[3].match(/R_?f = ([\d,]+)/)?.[1] ?? T[3].match(/Rf = ([\d,]+)/)[1]), d3 = cm(T[3])[0]; ok(Math.abs(d3 / rf3 - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai && d3 < e.questions[3].vrai, `q3 : ${T[3]}`);
    ok(!R.verifier(e.questions[3], String(d3).replace('.', ',')).ok, 'q3 : distance recopiée acceptée');
    const [h4, h4b] = cm(T[4]); ok(Math.abs(Math.round((h4b - h4) * 10) - e.questions[4].vrai) < 1e-9, `q4 : ${T[4]}`);
    const [h5, h5b] = cm(T[5]), q5 = e.questions[5], bonne5 = q5.options[q5.bonne];
    if (Math.abs(h5 - h5b) < 0.05) { qcmMem++; ok(/peut-être la même espèce/.test(bonne5), `q5 : même hauteur → ${bonne5}`); } else { qcmDiff++; ok(/deux espèces différentes/.test(bonne5) && Math.abs(h5 - h5b) >= 0.49, `q5 : hauteurs différentes → ${bonne5}`); }
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés, pire écart d’un arrondi à 2 CS : ${(pireEcart * 100).toFixed(2)} % (tolérance 6 %) ; QCM : ${qcmMem} même hauteur, ${qcmDiff} hauteurs différentes`);
  ok(pireEcart < 0.06, 'tolérance plus stricte que l’arrondi à 2 CS');
  ok(qcmMem > 1000 && qcmDiff > 2000, 'q5 : les deux cas sont tirés');

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('ccm2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('ccm2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let plusCourtes = 0, total = 0;
  for (const x of [...ana, ...val]) {
    const o = x.options, L = o.map(p => p[0].length), b = o.findIndex(p => p[1]);
    ok(o.filter(p => p[1]).length === 1, `${x.id} : une seule bonne réponse`);
    ok(L[b] < Math.max(...L), `${x.id} : la bonne réponse est la plus longue ${L}`);
    total++; if (L[b] === Math.min(...L)) plusCourtes++;
    ok(o.every(p => p[2] && p[2].length > 20), `${x.id} : chaque option est expliquée`);
    ok(!/undefined|NaN|_|\^|<sub>/.test(JSON.stringify(x)), `${x.id} : texte`);
    ok(x.domaine === 'Chromatographie sur couche mince (2GT)', `${x.id} : domaine`);
  }
  console.log(`ANA ${ana.length}, VAL ${val.length} ; bonne réponse la plus courte : ${plusCourtes}/${total}`);
  ok(plusCourtes <= total / 2, 'la bonne réponse est trop souvent la plus courte');
  ok(val.some(x => x.plausible) && val.some(x => !x.plausible), 'VAL : des résultats plausibles et d’autres non');

  // S'APP
  const sapp = D.ENONCES.filter(x => x.id.startsWith('ccm2gt-'));
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
    if (x.id === 'ccm2gt-sapp-comparer') { const b = x.build(p, 0); ok(Math.abs(b.solution.val - Math.round(Math.abs(p.h2 - p.h1) * 10)) < 1e-6 && b.solution.val >= 3, 'comparer : écart ≥ 3 mm'); }
    if (x.id === 'ccm2gt-sapp-colorant') { ok(p.d < p.F && p.d / p.F > 0.1, `colorant : d < F ${p.d} ${p.F}`); }
  }
  console.log(`${n} contrôles : tout est correct`);
} finally { await srv.close(); }
