// Tirages des exercices « cel- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM et les défis.
// Usage : node src/simulations/celTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = await srv.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const Q = await srv.ssrLoadModule('/src/simulations/pvcQcm.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/pvcModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'cel-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-').replace('+', ''));
  const r2 = x => Number(x.toPrecision(2));
  const prop = (T, re, k = 1) => { const m = T.match(re); ok(!!m, `motif ${re} absent de « ${T} »`); return num(m[k]); };
  const H = 6.63e-34, C = 3.00e8, EV = 1.60e-19; let pire = 0, pireChaine = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : ' + T.join(' | '));
    const L1 = prop(T[0], /λ = (\d+) nm/);
    ok(Math.abs(H * C / (L1 * 1e-9) / EV - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    const g2 = prop(T[1], /seuil Eseuil = ([\d,]+) eV/);
    ok(Math.abs(H * C / (g2 * EV) * 1e9 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai, `q2 : ${T[1]}`);
    const S3 = prop(T[2], /S = ([\d,]+) m²/), E3 = prop(T[2], /E = (\d+) W/);
    ok(Math.abs(S3 * E3 - e.questions[2].vrai) < 1e-9 * e.questions[2].vrai, `q3 : ${T[2]}`);
    const S4 = prop(T[3], /S = ([\d,]+) m²/), E4 = prop(T[3], /E = (\d+) W/), U4 = prop(T[3], /U = ([\d,]+) V/), I4 = prop(T[3], /I = ([\d,]+) A/);
    ok(Math.abs(100 * U4 * I4 / (E4 * S4) - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q4 : ${T[3]}`);
    pireChaine = Math.max(pireChaine, Math.abs(100 * r2(U4 * I4) / r2(E4 * S4) / e.questions[3].vrai - 1));
    ok(Math.abs(100 * r2(U4 * I4) / r2(E4 * S4) - e.questions[3].vrai) <= e.questions[3].tolRel * e.questions[3].vrai, 'q4 : chaîne arrondie acceptée');
    const S5 = prop(T[4], /S = ([\d,]+) m²/), eta5 = prop(T[4], /η = (\d+) %/), E5 = prop(T[4], /E = (\d+) W/);
    ok(Math.abs(eta5 / 100 * E5 * S5 - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai, `q5 : ${T[4]}`);
    for (const q of e.questions) {
      ok(q.pieges.every(([v]) => Math.abs(v - q.vrai) > 1.5 * q.tolRel * Math.abs(q.vrai)), 'piège hors tolérance');
      pire = Math.max(pire, Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai)); ok(Math.abs(r2(q.vrai) - q.vrai) <= q.tolRel * Math.abs(q.vrai), `arrondi 2 CS refusé : ${q.vrai}`);
    }
  }
  const longueur = o => o.length;
  for (const [id, q] of Object.entries(Q.QCM_PARCOURS)) { const L = q.options.map(longueur); ok(Math.max(...L) <= 1.9 * Math.min(...L) + 15, `QCM parcours ${id} : déséquilibré (${L})`); ok(L[q.bonne] < Math.max(...L), `QCM parcours ${id} : la bonne réponse est la plus longue`); }
  const T = await srv.ssrLoadModule('/src/simulations/tgPhysiqueBExos.js');
  for (const it of T.TGPB_ANA.filter(i => /^cel-/.test(i.id))) { const L = it.options.map(o => o[0].length), b = it.options.findIndex(o => o[1]); ok(Math.max(...L) <= 2 * Math.min(...L) + 15, `ANA ${it.id} : options déséquilibrées (${L})`); ok(L[b] < Math.max(...L), `ANA ${it.id} : bonne réponse la plus longue`); }
  for (const it of T.TGPB_VAL.filter(i => /^cel-/.test(i.id))) { const L = it.options.map(o => o[0].length), b = it.options.findIndex(o => o[1]); ok(L[b] < Math.max(...L), `VAL ${it.id} : bonne réponse la plus longue`); }
  for (let k = 0; k < 3000; k++) {
    const a = M.tirageRendement(); ok(Math.abs(r2(a.rep1) - a.rep1) / a.rep1 <= 0.03 && Math.abs(100 * r2(a.U * a.I) / r2(a.rep1) - a.rep3) <= 0.08 * a.rep3, 'défi rendement : arrondis');
    const b = M.tirageSeuil(); ok(Math.abs(r2(b.rep2) - b.rep2) / b.rep2 <= 0.03 && Math.abs(M.lambdaMaxNm(b.gap) - b.rep2) < 1e-9, 'défi seuil : arrondis');
    // un élève qui arrondit E_seuil à 3 chiffres puis calcule λ_max reste dans la marge de 5 %
    const E1 = Number((b.gap * 1.60).toPrecision(3)) * 1e-19; ok(Math.abs(H * C / E1 * 1e9 - b.rep2) <= 0.05 * b.rep2, 'défi seuil : chaîne arrondie');
  }
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs : ${(100 * pire).toFixed(1)} % ; pire chaîne du rendement : ${(100 * pireChaine).toFixed(1)} %`);
} finally { await srv.close(); }
