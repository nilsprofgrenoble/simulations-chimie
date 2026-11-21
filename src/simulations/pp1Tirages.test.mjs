// Tirages des exercices « pp1- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM et les défis.
// Usage : node src/simulations/pp1Tirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = await srv.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const V = await srv.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const Q = await srv.ssrLoadModule('/src/simulations/ppQcm.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/premierPrincipeModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'pp1-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.').replace('−', '-').replace('+', ''));
  const r2 = x => Number(x.toPrecision(2));
  const prop = (T, re, k = 1) => { const m = T.match(re); ok(!!m, `motif ${re} absent de « ${T} »`); return num(m[k]); };
  let pire = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    const Q1 = prop(T[0], /Q = ([+−-]\d+) J/), W1 = prop(T[0], /W = ([+−-]\d+) J/);
    ok(Math.abs(Q1 + W1 - e.questions[0].vrai) < 1e-9 && Math.abs(Q1 + W1) >= 700, `q1 : ${T[0]}`);
    const m2 = prop(T[1], /de ([\d,]+) kg/), c2 = prop(T[1], /c = ([\d]+) J/), Ti2 = prop(T[1], /passe de (\d+) °C/), Tf2 = prop(T[1], /à (\d+) °C, sans/);
    ok(Math.abs(m2 * c2 * (Tf2 - Ti2) / 1000 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai, `q2 : ${T[1]}`);
    const g3 = prop(T[2], /m = (\d+) g/), c3 = prop(T[2], /c = (\d+) J/);
    ok(Math.abs(g3 / 1000 * c3 - e.questions[2].vrai) < 1e-9 * e.questions[2].vrai, `q3 : ${T[2]}`);
    const P4 = prop(T[3], /P = (\d+) W/), t4 = prop(T[3], /pendant ([\d,]+) min/), m4 = prop(T[3], /à ([\d,]+) kg/), c4 = prop(T[3], /c = (\d+) J/), Ti4 = prop(T[3], /initialement à (\d+) °C/);
    ok(Math.abs(Ti4 + P4 * t4 * 60 / (m4 * c4) - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q4 : ${T[3]}`);
    const P5 = prop(T[4], /P = (\d+) W/), m5 = prop(T[4], /chauffer ([\d,]+) kg/), c5 = prop(T[4], /c = (\d+) J/), Ti5 = prop(T[4], /de (\d+) °C à/), Tf5 = prop(T[4], /à (\d+) °C \?/);
    ok(Math.abs(m5 * c5 * (Tf5 - Ti5) / P5 / 60 - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai, `q5 : ${T[4]}`);
    for (const q of e.questions) {
      ok(q.pieges.every(([v]) => Math.abs(v - q.vrai) > 1.5 * q.tolRel * Math.abs(q.vrai)), 'piège hors tolérance');
      // pire cas d'arrondi : réponse arrondie à 2 chiffres significatifs doit être acceptée
      pire = Math.max(pire, Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai)); ok(Math.abs(r2(q.vrai) - q.vrai) <= q.tolRel * Math.abs(q.vrai), `arrondi 2 CS refusé : ${q.vrai} (${q.tolRel})`);
    }
    // chaîne de calculs : C arrondi à 2 CS (q4, q5)
    for (const [mm, cc, k] of [[m4, c4, 3], [m5, c5, 4]]) ok(Math.abs(r2(mm * cc) - mm * cc) / (mm * cc) <= 0.03, `arrondi de C q${k + 1}`);
    const Cr = r2(m4 * c4), Tr = Ti4 + P4 * t4 * 60 / Cr; ok(Math.abs(Tr - e.questions[3].vrai) <= e.questions[3].tolRel * e.questions[3].vrai, 'q4 : C arrondi accepté');
    const tr = r2(m5 * c5) * (Tf5 - Ti5) / P5 / 60; ok(Math.abs(r2(tr) - e.questions[4].vrai) <= e.questions[4].tolRel * e.questions[4].vrai, 'q5 : chaîne arrondie acceptée');
  }
  // QCM : longueur des options (rendu) ; parcours, ANA et VAL
  const longueur = o => o.length;
  for (const [id, q] of Object.entries(Q.QCM_PARCOURS)) { const L = q.options.map(longueur); ok(Math.max(...L) <= 1.9 * Math.min(...L) + 10, `QCM parcours ${id} : options déséquilibrées (${L})`); }
  for (const it of A.BANQUE_ANALYSER_PROVISOIRE || A.BANQUE || A.ITEMS || []) { if (!/^pp1-/.test(it.id)) continue; const L = it.options.map(o => o[0].length); ok(Math.max(...L) <= 2 * Math.min(...L) + 10, `ANA ${it.id} : options déséquilibrées (${L})`); ok(it.options.filter(o => o[1]).length === 1, 'une seule bonne réponse'); }
  // modèle : tirages de défis
  for (let k = 0; k < 3000; k++) {
    const a = M.tirageChauffer(); ok(Math.abs(r2(a.rep1) - a.rep1) / a.rep1 <= 0.03 && a.rep3 <= 90, 'défi chauffer');
    const b = M.tirageBilan(); ok(Math.abs(r2(b.C) - b.C) / b.C <= 0.03, 'défi bilan : C arrondi');
    // pire cas : C arrondi à 2 CS puis ΔT et Q′ calculés, tolérance 8 %
    ok(Math.abs(b.rep1 / r2(b.C) - b.rep2) <= 0.08 * Math.abs(b.rep2) && Math.abs(r2(b.C) * (b.Tc - b.Ti) / 1000 - b.rep3) <= 0.08 * b.rep3, 'défi bilan : chaîne arrondie acceptée');
    ok(Math.abs(a.rep2 * 1000 / r2(a.rep1) + a.Ti - a.rep3) <= 0.08 * a.rep3, 'défi chauffer : chaîne arrondie acceptée');
  }
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs : ${(100 * pire).toFixed(1)} %`);
} finally { await srv.close(); }
