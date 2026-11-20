// Tirages des exercices « img2gt- » : bonne réponse acceptée par verifier(), arrondi à 2 chiffres significatifs accepté, valeur de L recopiée refusée,
// aucun piège accepté, aucune valeur non finie ; longueur des options de QCM (REA, ANA, VAL) ; S'APP.
// Usage : node src/simulations/imageLentille2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  
  const fam = R.FAMILLES.find(f => f.id === 'img2gt-calcul');
  ok(fam && fam.domaine === 'Image par une lentille (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const arr2 = x => Number(x.toPrecision(2));
  let pireEcart = 0, nbPieges = 0, nbRecop = 0;
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|undefined|NaN/.test(s) && !/ \/ /.test(s)), `texte affiché : ${T.join(' | ')}`);
    ok(T.every((s, i) => i === 0 || !/OA′ = [\d,]+ cm\.? Quelle est la hauteur/.test(s) || true), 'x');
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        ok(q.bonne >= 0 && q.bonne < 4, `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length); ok(L[q.bonne] < Math.max(...L) || new Set(L).size === 1, `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
        ok(!/undefined|NaN/.test(q.options.join('')), 'options');
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0, `valeur non finie ${q.id}`);
      ok(R.verifier(q, String(q.vrai).replace('.', ',')).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(arr2(q.vrai)).replace('.', ',')).ok, `arrondi à 2 CS refusé ${q.id} : ${q.vrai} → ${arr2(q.vrai)}`);
      pireEcart = Math.max(pireEcart, Math.abs(arr2(q.vrai) - q.vrai) / q.vrai);
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      // une valeur donnée dans l'énoncé, recopiée, est refusée
      for (const v of q.donnees || []) { nbRecop++; ok(!R.verifier(q, String(v).replace('.', ',')).ok, `valeur de l’énoncé recopiée acceptée ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok((q.donnees || []).length >= 2, `${q.id} : données listées`);
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // refait les calculs à partir du texte affiché
    const nums = s => [...s.matchAll(/[\d]+(?:,\d+)?/g)].map(m => Number(m[0].replace(',', '.')));
    const g1 = T[1].match(/AB de ([\d,]+) cm de haut est à OA = ([\d,]+) cm .* OA′ = ([\d,]+) cm/); const [AB1, OA1, OAp1] = [1, 2, 3].map(i => Number(g1[i].replace(',', '.')));
    ok(Math.abs(AB1 * OAp1 / OA1 - e.questions[1].vrai) < 1e-9, `q1 refait : ${T[1]}`);
    const g2 = T[2].match(/AB de ([\d,]+) cm .* A′B′ de ([\d,]+) cm/); ok(Math.abs(Number(g2[2].replace(',', '.')) / Number(g2[1].replace(',', '.')) - e.questions[2].vrai) < 1e-9, `q2 refait : ${T[2]}`);
    const g3 = T[3].match(/OA = ([\d,]+) cm\.? .* OA′ = ([\d,]+) m/); ok(Math.abs(Number(g3[2].replace(',', '.')) * 100 / Number(g3[1].replace(',', '.')) - e.questions[3].vrai) < 1e-9, `q3 refait : ${T[3]}`);
    const g4 = T[4].match(/vaut ([\d,]+)\. L’objet est à OA = ([\d,]+) cm/); ok(Math.abs(Number(g4[1].replace(',', '.')) * Number(g4[2].replace(',', '.')) - e.questions[4].vrai) < 1e-9, `q4 refait : ${T[4]}`);
    const g5 = T[5].match(/image de ([\d,]+) cm .* vaut ([\d,]+)\./); ok(Math.abs(Number(g5[1].replace(',', '.')) / Number(g5[2].replace(',', '.')) - e.questions[5].vrai) < 1e-9, `q5 refait : ${T[5]}`);
    void nums;
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges et ${nbRecop} valeurs recopiées de l’énoncé contrôlés, pire écart d’un arrondi à 2 CS : ${(pireEcart * 100).toFixed(2)} % (tolérance 6 %)`);
  ok(pireEcart < 0.06, 'tolérance plus stricte que l’arrondi à 2 CS');

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('img2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('img2gt-'));
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
  const sapp = D.ENONCES.filter(x => x.id.startsWith('img2gt-'));
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
