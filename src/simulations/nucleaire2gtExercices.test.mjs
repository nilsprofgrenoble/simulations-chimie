// Tirages des exercices « nuc2gt- » : bonne réponse acceptée, pièges refusés, QCM équilibrés, ANA, VAL, S'APP, espaces insécables.
// Usage : node src/simulations/nucleaire2gtExercices.test.mjs   (charge les banques .jsx via Vite en mode SSR)
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
  const fam = R.FAMILLES.find(f => f.id === 'nuc2gt-calcul');
  ok(fam && fam.domaine === 'Transformation nucléaire (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  let nbPieges = 0, plusCourtes = 0, nQcm = 0;
  for (let t = 0; t < 6000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|undefined|NaN|\[object/.test(s)), `texte affiché : ${T.join(' | ')}`);
    for (const q of e.questions) {
      if (q.type === 'qcm') {
        ok(q.options.length === 4 && new Set(q.options).size === 4, `QCM ${q.id} : 4 options distinctes ${q.options}`);
        ok(q.bonne >= 0 && q.bonne < 4 && !/undefined|NaN/.test(q.options.join('')), `QCM ${q.id} : bonne`);
        const L = q.options.map(o => o.length); ok(L[q.bonne] < Math.max(...L), `QCM ${q.id} : bonne réponse la plus longue ${q.options}`);
        nQcm++; if (L[q.bonne] === Math.min(...L)) plusCourtes++;
        continue;
      }
      ok(isFinite(q.vrai) && q.vrai > 0 && Number.isInteger(q.vrai), `valeur non entière ${q.id}`);
      ok(R.verifier(q, String(q.vrai)).ok, `bonne réponse refusée ${q.id} : ${q.vrai}`);
      ok(!R.verifier(q, String(q.vrai + 1)).ok && !R.verifier(q, '0').ok, `réponse voisine acceptée ${q.id}`);
      for (const [v] of q.pieges) { nbPieges++; ok(isFinite(v) && !R.verifier(q, String(v)).ok, `piège accepté ${q.id} : ${v} (vrai ${q.vrai})`); }
    }
    // refaire les calculs à partir du texte affiché
    const dec = (u, tab) => Number([...u].map(c => String(tab.indexOf(c))).join('')), SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
    const noy = s => [...s.matchAll(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)([₀₁₂₃₄₅₆₇₈₉]+)([A-Z][a-z]?)/g)].map(m => ({ A: dec(m[1], SUP), Z: dec(m[2], SUB), X: m[3] }));
    { const q = e.questions[0], [cible] = noy(T[0].split('Lequel')[0]); const bon = noy(q.options[q.bonne])[0]; ok(bon.Z === cible.Z && bon.A !== cible.A, `q0 : ${T[0]} → ${q.options[q.bonne]}`);
      q.options.forEach((o, i) => { if (i !== q.bonne) { const f = noy(o)[0]; ok(!(f.Z === cible.Z && f.A !== cible.A), `q0 : plusieurs isotopes ${o}`); } }); }
    { const q = e.questions[1], l = noy(T[1].split('Combien')[0]), cible = noy(T[1].split('isotopes du noyau')[1])[0]; const k = l.filter(x => x.Z === cible.Z && x.A !== cible.A).length; ok(k === q.vrai && l.length === 6, `q1 : ${T[1]} → ${q.vrai}`); }
    { const q = e.questions[2], t = T[2].match(/s’écrit : (.*)\. Quelle/)[1]; const nuc = /[⁰¹²³⁴⁵⁶⁷⁸⁹]+[₀₁₂₃₄₅₆₇₈₉]+/.test(t), phys = /\((s|l|g)\)/.test(t) && !/\+/.test(t); const nat = q.options[q.bonne].split(' ')[0];
      ok(nuc ? nat === 'nucléaire' : (nat === 'physique') === phys, `q2 : ${T[2]} → ${nat}`); }
    { const q = e.questions[3], t = T[3].match(/s’écrit : (.*)\. Combien/)[1], [g] = t.split('→'); const tot = [...g.matchAll(/(\d+\s)?([⁰¹²³⁴⁵⁶⁷⁸⁹]+)[₀₁₂₃₄₅₆₇₈₉]+[A-Za-z]+/g)].reduce((a, m) => a + (m[1] ? +m[1] : 1) * dec(m[2], SUP), 0); ok(tot === q.vrai, `q3 : ${T[3]} → ${q.vrai}`); }
    { const q = e.questions[4], t = T[4].match(/s’écrit : (.*)\. Combien/)[1], k = /(\d)\s+¹₀n\s*$/.exec(t.trim()); ok(k && +k[1] === q.vrai, `q4 : ${T[4]}`); }
    { const q = e.questions[5], soleil = /Soleil/.test(T[5]); ok(q.options[q.bonne].startsWith(soleil ? 'une fusion' : 'une fission'), `q5 : ${T[5]}`); }
  }
  console.log(`REA : 6 000 tirages, ${nbPieges} pièges contrôlés ; QCM : bonne réponse la plus courte ${plusCourtes}/${nQcm}`);
  ok(plusCourtes < nQcm * 0.55, 'la bonne réponse est trop souvent la plus courte');

  // espaces insécables : aucune espace simple entre un nombre et son unité, ni dans les milliers
  {
    const { readFileSync } = await import('node:fs'), dir = fileURLToPath(new URL('.', import.meta.url));
    const unites = /\d (mm|cm|m|km|µm|nm|°C|°|%|kg|g|ms|min|s|h|mL|L)(?![\wéèêàùçœ’-])/, milliers = /(?<![\d.,])\d{1,3} \d{3}(?!\d)/, technique = /viewBox|points=|d="|x1=/;
    const sources = ['Nucleaire2gt.jsx', 'Nucleaire2gtScenes.jsx', 'Nucleaire2gtFiches.jsx', 'nucleaire2gtQcm.js', 'nucleaire2gtExos.js', 'nucleaire2gtModele.js', 'nucleaire2gtDispo.js'].map(f => [f, readFileSync(dir + f, 'utf8')]);
    const banque = readFileSync(dir + 'AtelierRealiserBanque.jsx', 'utf8'); sources.push(['AtelierRealiserBanque.jsx (nucléaire)', banque.slice(banque.indexOf('// ───────────── Transformation nucléaire (2GT)'), banque.indexOf('// ───────────── Image par une lentille (2GT)'))]);
    for (const [f, t] of sources) t.split('\n').forEach((l0, i) => { if (/^\s*\/\//.test(l0)) return; const l = l0.replace(/\s\/\/ .*$/, ''); ok(!unites.test(l), `${f} l.${i + 1} : espace simple entre nombre et unité : ${l.trim().slice(0, 140)}`); ok(technique.test(l) || !milliers.test(l), `${f} l.${i + 1} : milliers : ${l.trim().slice(0, 140)}`); });
  }

  // ANA et VAL
  const ana = A.PREVOIR.filter(x => x.id.startsWith('nuc2gt-')), val = V.PLAUSIBLES.filter(x => x.id.startsWith('nuc2gt-'));
  ok(ana.length >= 4 && ana.length <= 6, `ANA : ${ana.length} exercices`); ok(val.length >= 4 && val.length <= 5, `VAL : ${val.length} exercices`);
  let pc = 0, total = 0;
  for (const x of [...ana, ...val]) {
    const o = x.options, L = o.map(p => p[0].length), b = o.findIndex(p => p[1]);
    ok(o.filter(p => p[1]).length === 1, `${x.id} : une seule bonne réponse`);
    ok(L[b] < Math.max(...L), `${x.id} : la bonne réponse est la plus longue ${L}`);
    total++; if (L[b] === Math.min(...L)) pc++;
    ok(o.every(p => p[2] && p[2].length > 20), `${x.id} : chaque option est expliquée`);
    ok(!/undefined|NaN|_|\^/.test(JSON.stringify(x)), `${x.id} : texte`);
  }
  console.log(`ANA ${ana.length}, VAL ${val.length} ; bonne réponse la plus courte : ${pc}/${total}`);
  ok(pc <= total / 2, 'la bonne réponse est trop souvent la plus courte');

  // S'APP
  const sapp = D.ENONCES.filter(x => x.id.startsWith('nuc2gt-'));
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
