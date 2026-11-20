// Tirages des exercices « oeil2gt- » : bonne réponse acceptée par verifier(), arrondi à 2 chiffres significatifs accepté, valeur recopiée refusée,
// aucun piège accepté, aucune valeur non finie ; longueur des options de QCM (REA, ANA, VAL) ; S'APP.
// Usage : node src/simulations/oeilReduit2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const fam = R.FAMILLES.find(f => f.id === 'oeil2gt-calcul');
  ok(fam && fam.domaine === 'L’œil réduit (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));
  const arr2 = x => Number(x.toPrecision(2));
  let pireEcart = 0, nbPieges = 0, plusLongues = 0, nQcm = 0;
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|÷|undefined|NaN/.test(s.replace(/A′B′ ÷|OA′ ÷/g, '')) && !/ \/ /.test(s)), `texte affiché : ${T.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes`);
        ok(q.bonne >= 0 && q.bonne < 4 && !/undefined|NaN/.test(q.options.join('')), `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length); ok(L[q.bonne] < Math.max(...L), `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
        nQcm++; if (L[q.bonne] === Math.min(...L)) plusLongues++;
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0, `valeur non finie ${q.id}`);
      ok(R.verifier(q, String(q.vrai).replace('.', ',')).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(R.verifier(q, String(arr2(q.vrai)).replace('.', ',')).ok, `arrondi à 2 CS refusé ${q.id} : ${q.vrai} → ${arr2(q.vrai)}`);
      pireEcart = Math.max(pireEcart, Math.abs(arr2(q.vrai) - q.vrai) / q.vrai);
      for (const [v] of q.pieges || []) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v).replace('.', ',')).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
      ok(R.verifier(q, '0').ok === false, 'zéro refusé');
    }
    // refaire les calculs à partir du texte affiché
    const g = (s, re) => num(s.match(re)[1]);
    { const AB = g(T[0], /AB = ([\d,]+) m/), D0 = g(T[0], /OA = ([\d\s]+) m/); ok(Math.abs(AB * 17 / D0 - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q0 : ${T[0]}`);
      // valeurs recopiées refusées (AB, D0, 17)
      for (const v of [AB, D0, 17]) ok(!R.verifier(e.questions[0], String(v).replace('.', ',')).ok, `q0 : valeur recopiée acceptée ${v}`); }
    { const Ap = g(T[1], /A′B′ = ([\d,]+) mm/), D1 = g(T[1], /OA = ([\d\s]+) m/); ok(Math.abs(Ap * D1 / 17 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai, `q1 : ${T[1]}`);
      for (const v of [Ap, D1, 17]) ok(!R.verifier(e.questions[1], String(v).replace('.', ',')).ok, `q1 : valeur recopiée acceptée ${v}`); }
    { const AB = g(T[2], /AB = ([\d,]+) m/), Ap = g(T[2], /A′B′ = ([\d,]+) mm/); ok(Math.abs(AB * 17 / Ap - e.questions[2].vrai) < 1e-9 * e.questions[2].vrai, `q2 : ${T[2]}`);
      for (const v of [AB, Ap, 17]) ok(!R.verifier(e.questions[2], String(v).replace('.', ',')).ok, `q2 : valeur recopiée acceptée ${v}`); }
    { const m = [...T[3].matchAll(/(\d[\d\s]*) m(?![m\w])/g)].map(x => num(x[1])), Ap = g(T[3], /mesure ([\d,]+) mm/); ok(Math.abs(Ap * m[0] / m[1] - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q3 : ${T[3]}`);
      ok(!R.verifier(e.questions[3], String(Ap).replace('.', ',')).ok, 'q3 : Ap recopié accepté'); }
    // rayons peu inclinés : pente AB ÷ OA = A′B′ ÷ 17 ≤ 0,16, soit A′B′ ≤ 2,72 mm (2,75 mm avec l'arrondi des données)
    { const Ap = [e.questions[0].vrai, g(T[1], /A′B′ = ([\d,]+) mm/), g(T[2], /A′B′ = ([\d,]+) mm/), g(T[3], /mesure ([\d,]+) mm/)]; ok(Ap.every(v => v <= 2.75), `pente trop forte (A′B′ ≤ 2,72 mm) : ${Ap}`); }
    ok(!/situé[e]? /.test(T[0] + T[1]) || (/personne/.test(T[0]) ? /située/.test(T[0]) : true), 'accord situé / située');
    // q4 et q5 : cohérence de la réponse avec les données
    { const q = e.questions[4], proche = /derrière/.test(q.options[q.bonne]); const Dtxt = T[4].match(/à ([\d,]+) (m|cm)\b/); const Dmm = num(Dtxt[1]) * (Dtxt[2] === 'm' ? 1000 : 10); ok(proche === (Dmm <= 1000), `q4 : ${T[4]} → ${q.options[q.bonne]}`); }
    { const q = e.questions[5], d = [...T[5].matchAll(/(\d+) cm/g)].map(x => +x[1]); ok(/diminue/.test(q.options[q.bonne]) === (d[1] < d[0]), `q5 : ${T[5]} → ${q.options[q.bonne]}`); }
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés, pire écart d’un arrondi à 2 CS : ${(pireEcart * 100).toFixed(2)} % (tolérance 6 %) ; QCM : bonne réponse la plus courte ${plusLongues}/${nQcm}`);
  ok(pireEcart < 0.06, 'tolérance plus stricte que l’arrondi à 2 CS');

  // espaces insécables (code 160) : aucune espace simple entre un nombre et son unité, ni dans les milliers, dans les fichiers de la simulation et dans la famille REA
  {
    const { readFileSync } = await import('node:fs'), dir = fileURLToPath(new URL('.', import.meta.url));
    const unites = /\d (mm|cm|m|km|µm|nm|°C|°|%|kg|g|ms|min|s|h|mL|L)(?![\wéèêàùçœ’-])/, milliers = /(?<![\d.,])\d{1,3} \d{3}(?!\d)/, technique = /viewBox|points=|d="|x1=/;
    const sources = ['OeilReduit2gt.jsx', 'OeilReduit2gtScenes.jsx', 'oeilReduit2gtQcm.js', 'oeilReduit2gtExos.js', 'oeilReduit2gtModele.js'].map(f => [f, readFileSync(dir + f, 'utf8')]);
    const banque = readFileSync(dir + 'AtelierRealiserBanque.jsx', 'utf8'); sources.push(['AtelierRealiserBanque.jsx (œil réduit)', banque.slice(banque.indexOf('// ───────────── L’œil réduit (2GT)'), banque.indexOf('// ───────────── Changement d’état (2GT)'))]);
    for (const [f, t] of sources) t.split('\n').forEach((l0, i) => { if (/^\s*\/\//.test(l0)) return; const l = l0.replace(/\s\/\/ .*$/, ''); ok(!unites.test(l), `${f} l.${i + 1} : espace simple entre nombre et unité : ${l.trim().slice(0, 120)}`); if (!technique.test(l)) ok(!milliers.test(l), `${f} l.${i + 1} : espace simple dans un nombre : ${l.trim().slice(0, 120)}`); });
  }

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('oeil2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('oeil2gt-'));
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
  const sapp = D.ENONCES.filter(x => x.id.startsWith('oeil2gt-'));
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
