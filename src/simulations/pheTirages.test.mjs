// Tirages des exercices « phe- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, arrondi à 2 chiffres significatifs, équilibre des QCM, S'APP et défis.
// Usage : node src/simulations/pheTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const X = await srv.ssrLoadModule('/src/simulations/tgPhysiqueBExos.js');
  const Q = await srv.ssrLoadModule('/src/simulations/effetPhotoQcm.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/effetPhotoModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'phe-calcul');
  ok(!!fam, 'famille phe-calcul absente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-').replace('+', ''));
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  const prop = (T, re, k = 1) => { const m = T.match(re); ok(!!m, `motif ${re} absent de « ${T} »`); return num(m[k]); };
  const H = 6.63e-34, C = 3.00e8, EE = 1.60e-19; const eV = nm => H * C / (nm * 1e-9) / EE;
  let pire2 = 0, pire3 = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché');
    const rel = (a, b) => Math.abs(a - b) <= 1e-9 * Math.abs(b);
    ok(rel(eV(prop(T[0], /λ = (\d+) nm/)), e.questions[0].vrai), `q1 : ${T[0]}`);
    ok(rel(H * C / (prop(T[1], /E = ([\d,]+) eV/) * EE) * 1e9, e.questions[1].vrai), `q2 : ${T[1]}`);
    ok(rel(prop(T[2], /h ν = ([\d,]+) eV/) - prop(T[2], /W = ([\d,]+) eV/), e.questions[2].vrai), `q3 : ${T[2]}`);
    ok(rel(prop(T[3], /W = ([\d,]+) eV/) * EE / H / 1e14, e.questions[3].vrai), `q4 : ${T[3]}`);
    ok(rel(eV(prop(T[4], /λ = (\d+) nm/)) - prop(T[4], /W = ([\d,]+) eV/), e.questions[4].vrai), `q5 : ${T[4]}`);
    for (const q of e.questions) {
      ok(q.vrai > 0, 'valeur attendue positive');
      ok(q.pieges.every(([v]) => Math.abs(v - q.vrai) > 1.5 * q.tolRel * Math.abs(q.vrai)), 'piège hors tolérance');
      pire2 = Math.max(pire2, Math.abs(r2(q.vrai) - q.vrai) / q.vrai); pire3 = Math.max(pire3, Math.abs(r3(q.vrai) - q.vrai) / q.vrai);
      if (q.csMin === 2) ok(Math.abs(r2(q.vrai) - q.vrai) <= q.tolRel * q.vrai, `arrondi 2 CS refusé : ${q.vrai}`);
      if (q.csMin === 3) ok(Math.abs(r3(q.vrai) - q.vrai) <= q.tolRel * q.vrai, `arrondi 3 CS refusé : ${q.vrai}`);
    }
  }
  const eq = (L, b) => Math.max(...L) <= 2 * Math.min(...L) + 20 && L[b] < Math.max(...L);
  for (const [id, q] of Object.entries(Q.QCM_PARCOURS)) { const L = q.options.map(o => o.length); ok(eq(L, q.bonne), `QCM parcours ${id} : déséquilibré ou bonne réponse la plus longue (${L})`); }
  for (const it of X.TGPB_ANA.filter(i => /^phe-/.test(i.id))) { const L = it.options.map(o => o[0].length); ok(eq(L, it.options.findIndex(o => o[1])), `ANA ${it.id} : options (${L})`); ok(it.options.filter(o => o[1]).length === 1, `ANA ${it.id} : une seule bonne réponse`); }
  for (const it of X.TGPB_VAL.filter(i => /^phe-/.test(i.id))) { const L = it.options.map(o => o[0].length); ok(eq(L, it.options.findIndex(o => o[1])), `VAL ${it.id} : options (${L})`); ok(it.options.filter(o => o[1]).length === 1, `VAL ${it.id} : une seule bonne réponse`); }
  const sapp = X.TGPB_SAPP.find(s => s.id === 'phe-sapp-photon'); ok(!!sapp, 'SAPP absent');
  for (let k = 0; k < 500; k++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q); const E = eV(p.lam);
      ok(b.utiles.every(u => b.tokens[u]), 'utiles ⊂ tokens'); ok(Object.keys(b.raisons).every(u => b.tokens[u] && !b.utiles.includes(u)), 'raisons ⊂ inutiles');
      ok(Math.abs(b.solution.val - (q === 0 ? E : E - p.W)) < 1e-9, 'solution'); ok(b.solution.val > 0, 'solution positive');
      const inutiles = Object.keys(b.tokens).filter(u => !b.utiles.includes(u)); ok(inutiles.every(u => b.raisons[u]), `raison manquante (${inutiles})`);
    }
  }
  for (let k = 0; k < 3000; k++) {
    const a = M.tirageDirect(); const b = M.tirageInconnu();
    ok(a && b, 'tirages de défis');
  }
  console.log(`${n} contrôles OK ; pire arrondi : 2 CS ${(100 * pire2).toFixed(1)} %, 3 CS ${(100 * pire3).toFixed(1)} %`);
} finally { await srv.close(); }
