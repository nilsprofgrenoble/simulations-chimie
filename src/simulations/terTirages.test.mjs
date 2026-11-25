// Tirages des exercices « ter- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM et les défis.
// Usage : node src/simulations/terTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = await srv.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const V = await srv.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const Q = await srv.ssrLoadModule('/src/simulations/terAtmQcm.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/terreAtmModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'ter-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.').replace('−', '-').replace('+', ''));
  const r2 = x => Number(x.toPrecision(2));
  const prop = (T, re, k = 1) => { const m = T.match(re); ok(!!m, `motif ${re} absent de « ${T} »`); return num(m[k]); };
  const SG = 5.67e-8; let pire = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché');
    const S1 = prop(T[0], /S₀ = (\d+) W/), A1 = prop(T[0], /albédo est A = ([\d,]+)/);
    ok(Math.abs((1 - A1) * S1 / 4 - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    const th = prop(T[1], /θ = ([−\d]+) °C/);
    ok(Math.abs(SG * (th + 273) ** 4 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai, `q2 : ${T[1]}`);
    const P3 = prop(T[2], /Pabs = (\d+) W/);
    ok(Math.abs((P3 / SG) ** 0.25 - e.questions[2].vrai) < 1e-9 * e.questions[2].vrai, `q3 : ${T[2]}`);
    const S4 = prop(T[3], /S₀ = (\d+) W/), A4 = prop(T[3], /albédo A = ([\d,]+)/);
    ok(Math.abs(((1 - A4) * S4 / 4 / SG) ** 0.25 - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q4 : ${T[3]}`);
    const S5 = prop(T[4], /S₀ = (\d+) W/), T5 = prop(T[4], /équilibre T = (\d+) K/);
    ok(Math.abs(4 * SG * T5 ** 4 / S5 - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai, `q5 : ${T[4]}`);
    for (const q of e.questions) {
      ok(q.pieges.every(([v]) => Math.abs(v - q.vrai) > 1.5 * q.tolRel * Math.abs(q.vrai)), 'piège hors tolérance');
      pire = Math.max(pire, Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai)); if (q.csMin === 2) ok(Math.abs(r2(q.vrai) - q.vrai) <= q.tolRel * Math.abs(q.vrai), `arrondi 2 CS refusé : ${q.vrai}`);
    }
    // chaînes : P arrondie à 2 CS puis T (q4), tolérance 3 %
    ok(Math.abs((r2((1 - A4) * S4 / 4) / SG) ** 0.25 - e.questions[3].vrai) <= 0.03 * e.questions[3].vrai, 'q4 : chaîne arrondie acceptée');
  }
  const longueur = o => o.length;
  for (const [id, q] of Object.entries(Q.QCM_PARCOURS)) { const L = q.options.map(longueur); ok(Math.max(...L) <= 1.9 * Math.min(...L) + 15, `QCM parcours ${id} : déséquilibré (${L})`); ok(L[q.bonne] < Math.max(...L), `QCM parcours ${id} : la bonne réponse est la plus longue`); }
  for (const it of A.BANQUE_ANALYSER_PROVISOIRE || A.BANQUE || A.ITEMS || []) { if (!/^ter-/.test(it.id)) continue; const L = it.options.map(o => o[0].length); ok(Math.max(...L) <= 2 * Math.min(...L) + 15, `ANA ${it.id} : options déséquilibrées (${L})`); const b = it.options.findIndex(o => o[1]); ok(L[b] < Math.max(...L), `ANA ${it.id} : bonne réponse la plus longue`); }
  for (let k = 0; k < 3000; k++) {
    const a = M.tiragePlanete(); ok(Math.abs(r2(a.rep1) - a.rep1) / a.rep1 <= 0.03, 'défi planète : arrondi');
    const b = M.tirageAlbedo(); ok(Math.abs(1 - r2(b.rep1) / r2(b.rep2) - b.rep3) <= 0.03, 'défi albédo : chaîne arrondie acceptée');
  }
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs : ${(100 * pire).toFixed(1)} %`);
} finally { await srv.close(); }
