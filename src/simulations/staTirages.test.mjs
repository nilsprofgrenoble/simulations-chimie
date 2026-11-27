// Tirages des exercices « sta- » (simulation 319) : valeurs finies, pièges hors tolérance, réponses distinctes (2 000 tirages).
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  for (const id of ['sta-electrons', 'sta-donneurs']) {
    const fam = R.FAMILLES.find(f => f.id === id); ok(fam, id + ' famille présente');
    for (let t = 0; t < 2000; t++) {
      const e = fam.gen();
      ok(e.questions.length >= 2, id + ' au moins 2 questions');
      for (const q of e.questions) {
        ok(Number.isFinite(q.vrai), id + ' vrai fini');
        for (const [pv] of q.pieges) ok(Math.abs(pv - q.vrai) > 1e-9 && (q.vrai === 0 || Math.abs(pv - q.vrai) / Math.abs(q.vrai) > 1.2 * q.tolRel), `${id} piège ${pv} trop proche de ${q.vrai} : ${e.intro}`);
        ok(!/_/.test(txt(q.expl)) && !/_/.test(txt(q.q)), id + ' sans _');
      }
      ok(!/_|\^/.test(e.intro), id + ' intro propre');
      const v = e.questions.map(q => q.vrai); ok(new Set(v.map(x => x.toPrecision(6))).size === v.length, id + ' réponses distinctes ' + v);
    }
  }
  console.log(`staTirages OK (${n} vérifications)`);
} finally { await srv.close(); }
