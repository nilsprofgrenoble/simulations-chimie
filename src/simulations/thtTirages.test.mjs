// Tirages des exercices « tht- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM et les défis.
// Usage : node src/simulations/thtTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = await srv.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const V = await srv.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const Q = await srv.ssrLoadModule('/src/simulations/tthQcm.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/transfertsThermModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'tht-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.').replace('−', '-').replace('+', ''));
  const r2 = x => Number(x.toPrecision(2));
  const prop = (T, re, k = 1) => { const m = T.match(re); ok(!!m, `motif ${re} absent de « ${T} »`); return num(m[k]); };
  let pire = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché');
    const Q1 = prop(T[0], /Q = ([\d]+) kJ/), t1 = prop(T[0], /pendant (\d+) min/);
    ok(Math.abs(Q1 * 1000 / (t1 * 60) - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    const R2 = prop(T[1], /Rth = ([\d,]+) K/), Ti2 = prop(T[1], /à (\d+) °C et/), Te2 = prop(T[1], /extérieur à ([−\d]+) °C/);
    ok(Math.abs((Ti2 - Te2) / R2 - e.questions[1].vrai) <= 0.005 * e.questions[1].vrai, `q2 : ${T[1]}`);
    const p3 = prop(T[2], /φ = (\d+) W/), d3 = prop(T[2], /ΔT = (\d+) K/);
    ok(Math.abs(d3 / p3 - e.questions[2].vrai) < 1e-9, `q3 : ${T[2]}`);
    const p4 = prop(T[3], /φ = (\d+) W/), h4 = prop(T[3], /pendant (\d+) h/);
    ok(Math.abs(p4 * h4 / 1000 - e.questions[3].vrai) < 1e-9, `q4 : ${T[3]}`);
    const p5 = prop(T[4], /φ = (\d+) W/), a5 = prop(T[4], /ΔT = (\d+) K/), b5 = prop(T[4], /ΔT′ = (\d+) K/);
    ok(Math.abs(p5 * b5 / a5 - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai, `q5 : ${T[4]}`);
    for (const q of e.questions) {
      ok(q.pieges.every(([v]) => Math.abs(v - q.vrai) > 1.5 * q.tolRel * Math.abs(q.vrai)), 'piège hors tolérance');
      pire = Math.max(pire, Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai)); ok(Math.abs(r2(q.vrai) - q.vrai) <= q.tolRel * Math.abs(q.vrai), `arrondi 2 CS refusé : ${q.vrai}`);
    }
  }
  const longueur = o => o.length;
  for (const [id, q] of Object.entries(Q.QCM_PARCOURS)) { const L = q.options.map(longueur); ok(Math.max(...L) <= 1.9 * Math.min(...L) + 10, `QCM parcours ${id} : déséquilibré (${L})`); ok(q.options[q.bonne].length < Math.max(...L), `QCM parcours ${id} : la bonne réponse est la plus longue`); }
  for (const it of A.BANQUE_ANALYSER_PROVISOIRE || A.BANQUE || A.ITEMS || []) { if (!/^tht-/.test(it.id)) continue; const L = it.options.map(o => o[0].length); ok(Math.max(...L) <= 2 * Math.min(...L) + 15, `ANA ${it.id} : options déséquilibrées (${L})`); }
  for (let k = 0; k < 3000; k++) {
    const a = M.tirageParoi(); ok(Math.abs(a.rep1 * a.h * 3.6e3 / 3.6e6 - a.rep2) < 1e-9 * a.rep2 + 1e-12, 'défi paroi : énergie');
    ok(Math.abs(r2(a.rep1) - a.rep1) / a.rep1 <= 0.03 && Math.abs(a.dT / r2(a.rep1) - a.el.R) <= 0.06 * a.el.R, 'défi paroi : arrondi');
    ok(Math.abs(a.dT / a.phiC - a.rep3) < 1e-9, 'défi paroi : Rth');
    const b = M.tirageMesure(); ok(Math.abs(r2(b.rep1) - b.rep1) / b.rep1 <= 0.03, 'défi mesure : arrondi');
    ok(Math.abs(b.dT / r2(b.rep1) - b.rep2) <= 0.06 * b.rep2 && Math.abs(b.dT2 / (b.dT / r2(b.rep1)) - b.rep3) <= 0.06 * b.rep3, 'défi mesure : chaîne arrondie acceptée');
  }
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs : ${(100 * pire).toFixed(1)} %`);
} finally { await srv.close(); }
