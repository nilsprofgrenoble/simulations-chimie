// Tirages des exercices « biot- » (simulation 318) : valeurs finies, pièges hors tolérance, pas de deux questions à réponse identique, cohérence avec l'énoncé (3 000 tirages).
// Usage : node src/simulations/biotTirages.test.mjs   (charge la banque .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-'));
  const vus = {};
  for (const id of ['biot-alpha', 'biot-ee']) {
    const fam = R.FAMILLES.find(f => f.id === id); ok(fam, id + ' famille présente');
    for (let t = 0; t < 3000; t++) {
      const e = fam.gen(); vus[id] = (vus[id] || 0) + 1;
      ok(e.questions.length === 3, id + ' 3 questions');
      const T = e.questions.map(q => txt(q.q)), I = e.intro;
      ok(!/_|\^|\//.test(I.replace(/g\/mL/g, '').replace(/·dm⁻¹·g⁻¹·mL/g, '')), id + ' intro sans _ ^ : ' + I);
      for (const q of e.questions) {
        ok(Number.isFinite(q.vrai) && Math.abs(q.vrai) > 0, id + ' vrai fini');
        for (const [pv] of q.pieges) ok(Math.abs(pv - q.vrai) / Math.abs(q.vrai) > 1.2 * q.tolRel, `${id} piège ${pv} trop proche de ${q.vrai}`);
        ok(!/_/.test(txt(q.expl)), id + ' expl sans _');
      }
      const v = e.questions.map(q => q.vrai); ok(new Set(v.map(x => x.toPrecision(6))).size === 3, id + ' réponses distinctes ' + v);
      if (id === 'biot-alpha') {
        const A = num(I.match(/\[α\] = \+(\d+)/)[1]), C = num(I.match(/C = ([\d,]+)/)[1]), Lc = num(I.match(/longueur (\d+)/)[1]);
        ok(Math.abs(v[0] - A * Lc / 10 * C) < 1e-9, 'alpha ' + I); ok(Math.abs(v[1] - v[0] / 2) < 1e-9, 'dilution');
        const a2 = num(T[2].match(/α = \+([\d,]+)/)[1]); ok(Math.abs(v[2] - a2 / (A * Lc / 10)) / v[2] < 0.01, 'C retrouvée ' + T[2] + ' ' + v[2]);
      } else {
        const m = I.match(/contient (\d+)\s%\sde l’énantiomère\s(\(.\))\set\s(\d+)\s%/), a = num(m[1]), b = num(m[3]);
        ok(Math.abs(v[0] - Math.abs(a - b)) < 1e-9, 'e.e.'); ok(Math.abs(v[2] - Math.min(a, b) / 100 * num(I.match(/C = ([\d,]+)/)[1])) < 1e-9, 'minoritaire');
        ok(Math.abs(Math.abs(v[1]) - v[0] / 100 * Math.abs(v[1]) / (v[0] / 100)) < 1e-9, 'signe'); ok(v[1] > 0 === (a > b === (m[2] === '(+)')), 'signe de α');
      }
    }
  }
  console.log(`biotTirages OK (${n} vérifications)`);
} finally { await srv.close(); }
