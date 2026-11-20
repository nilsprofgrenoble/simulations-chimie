// Tirages des exercices « gpf- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP) et les défis.
// Usage : node src/simulations/gpfTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const Q = await srv.ssrLoadModule('/src/simulations/gpfQcm.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/gazParfaitModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'gpf-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-'));
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  const K = th => th + 273.15, Rg = 8.314;
  const prop = (T, re, k = 1) => { const m = T.match(re); ok(!!m, `motif ${re} absent de « ${T} »`); return num(m[k]); };
  let pireTol = 0, pireArr = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    // 1 : n = P V / (R T)
    let V1 = prop(T[0], /V = ([\d,]+) L/), P1 = prop(T[0], /P = ([\d,]+) bar/), th1 = prop(T[0], /θ = (\d+) °C/);
    ok(Math.abs(P1 * 1e5 * V1 * 1e-3 / (Rg * K(th1)) - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    // 2 : P = n R T / V (bar)
    const V2 = prop(T[1], /V = ([\d,]+) L/), n2 = prop(T[1], /n = ([\d,]+) mol/), th2 = prop(T[1], /θ = (\d+) °C/);
    ok(Math.abs(n2 * Rg * K(th2) / (V2 * 1e-3) / 1e5 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai && e.questions[1].vrai >= 0.5 && e.questions[1].vrai <= 10, `q2 : ${T[1]}`);
    // 3 : deux états
    const Pa = prop(T[2], /P1 = ([\d,]+) bar/), Va = prop(T[2], /V1 = ([\d,]+) L/), tha = prop(T[2], /θ1 = (\d+) °C/), Vb = prop(T[2], /V2 = ([\d,]+) L/), thb = prop(T[2], /θ2 = (\d+) °C/);
    ok(Math.abs(Pa * Va * K(thb) / (K(tha) * Vb) - e.questions[2].vrai) < 1e-9 * e.questions[2].vrai && Va !== Vb, `q3 : ${T[2]}`);
    // 4 : ρ = P M / (R T)
    const M4 = prop(T[3], /M = ([\d,]+) g·mol⁻¹/), P4 = prop(T[3], /P = ([\d,]+) bar/), th4 = prop(T[3], /θ = (\d+) °C/);
    ok(Math.abs(P4 * 1e5 * M4 * 1e-3 / (Rg * K(th4)) - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q4 : ${T[3]}`);
    // 5 : T2 = T1 P2 / P1 (volume constant)
    const th5 = prop(T[4], /θ1 = (\d+) °C/), Pc1 = prop(T[4], /P1 = ([\d,]+) bar/), Pc2 = prop(T[4], /P2 = ([\d,]+) bar/);
    ok(Math.abs(K(th5) * Pc2 / Pc1 - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai && Pc2 > Pc1, `q5 : ${T[4]}`);
    // pièges hors de 1,5 × tolérance ; arrondi à 2 chiffres significatifs accepté ; textes sans « ^ », « ÷ », « / »
    for (const q of e.questions) {
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 1.5 * q.tolRel && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai); pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance (${arr})`);
      ok(Math.abs(r3(q.vrai) - q.vrai) / Math.abs(q.vrai) <= q.tolRel, 'arrondi à 3 chiffres');
      ok(typeof q.aide === 'string' || txt(q.aide).length > 10, `${q.id} : aide`);
      ok(!/\^|÷|\//.test(txt(q.aide)), `${q.id} : aide « ${txt(q.aide)} »`);
      for (const [, msg] of q.pieges) ok(!/\^|÷|\//.test(msg), `${q.id} : piège « ${msg} »`);
      ok(!/_|\^|÷|\/(?!(L|g|s))/.test(txt(q.expl)), `${q.id} : expl « ${txt(q.expl)} »`);
      pireArr = Math.max(pireArr, arr);
    }
  }
  // S'APP : les deux variantes se construisent, les données utiles sont dans le texte, la solution est cohérente
  const sapp = D.ENONCES.find(x => x.id === 'gpf-sapp-ballon');
  ok(!!sapp, 'S\'APP présent');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      const attendu = q === 0 ? p.n * Rg * K(p.th) / (p.V * 1e-3) / 1e5 : p.P * 1e5 * p.g.M * 1e-3 / (Rg * K(p.th));
      ok(Math.abs(b.solution.val - attendu) < 1e-9 * attendu, 'S\'APP : solution');
      ok(b.cherche.bonne && b.cherche.faux.length === 3, 'S\'APP : grandeur cherchée');
      ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), 'S\'APP : raisons pour les seules données inutiles');
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); ok(inutiles.every(k => b.raisons[k]), 'S\'APP : chaque donnée inutile est expliquée');
      ok(b.texte.every(x => x && x.t ? b.tokens[x.t] : true), 'S\'APP : jeton cité mais absent');
      ok(!/_|\^|÷/.test(b.texte.map(x => typeof x === 'string' ? x : '').join('')), 'S\'APP : texte propre');
    }
  }
  // QCM : la bonne réponse n'est ni la plus longue ni la plus courte (texte rendu)
  const rendu = s => Q.texteRendu(s);
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options.map(rendu), v.bonne]);
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('gpf-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  const valListe = V.PLAUSIBLES.filter(y => y.id.startsWith('gpf-'));
  for (const x of valListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  ok(anaListe.length === 3 && valListe.length === 3, `ANA : 3 et VAL : 3 (${anaListe.length}, ${valListe.length})`);
  const mauvais = [];
  for (const [nom, opts, b] of lots) {
    const L = opts.map(o => o.length), max = Math.max(...L), min = Math.min(...L);
    if (!(L[b] < max)) mauvais.push(`${nom} : la bonne réponse est la plus longue (${L.join(', ')}, bonne = ${b})`);
    if (L[b] === min) mauvais.push(`${nom} : bonne réponse la plus courte (${L.join(', ')}, bonne = ${b})`);
    if (!(max - min <= 40 || max / min < 1.7)) mauvais.push(`${nom} : options déséquilibrées (${L.join(', ')})`);
    ok(opts.every(o => !/\^|÷/.test(o)), `${nom} : option sans « ^ » ni « ÷ »`);
  }
  for (const x of [...anaListe, ...valListe]) for (const o of x.options) { if (/ car /.test(o[0])) mauvais.push(`${x.id} : justification dans l’option « ${o[0]} »`); ok(!/\^|÷|\/(?!(L|g|s))/.test(o[2]), `${x.id} : retour « ${o[2]} »`); }
  for (const x of [...anaListe, ...valListe]) ok(x.options.length >= 3 && x.options.every(o => o[2] && o[2].length > 20), `${x.id} : un retour ciblé par option`);
  for (const q of [0, 1]) { const b = sapp.build(sapp.gen(), q), L = [b.cherche.bonne, ...b.cherche.faux].map(s => s.length); if (!(L[0] < Math.max(...L)) || L[0] === Math.min(...L)) mauvais.push(`S'APP q${q} : libellés ${L.join('/')}`); }
  // rang de la bonne réponse des QCM du parcours : le rendu mélange déjà l'ordre ; ici, tirage aléatoire du rang de longueur
  ok(mauvais.length === 0, '\n' + mauvais.join('\n'));
  // défis : tirages cohérents avec les données affichées, réponses atteignables à la tolérance près avec des arrondis à 2 chiffres significatifs
  for (let t = 0; t < 3000; t++) {
    const d = M.tirageEtat();
    ok(Math.abs(d.rep1 - d.n * Rg * K(d.th1) / (d.V * 1e-3) / 1e5) < 1e-9 * d.rep1 && Math.abs(d.rep2 - d.n * Rg * K(d.th2) / (d.V * 1e-3) / 1e5) < 1e-9 * d.rep2, 'défi état : P1, P2');
    ok(Math.abs(d.P3 * 1e5 * d.V * 1e-3 / (d.n * Rg) - d.rep3) < 1e-9 * d.rep3, 'défi état : T3');
    // chaîne : un élève qui arrondit P1 à 2 chiffres puis calcule P2 = P1 × T2 / T1 doit rester dans les 6 %
    ok(Math.abs(r2(d.rep1) * K(d.th2) / K(d.th1) - d.rep2) / d.rep2 <= 0.06, 'défi état : chaîne P1 → P2');
    for (const k of [1, 2, 3]) ok(Math.abs(r2(d[`rep${k}`]) - d[`rep${k}`]) / d[`rep${k}`] <= 0.06, `défi état : arrondi q${k}`);
    const b = M.tirageBouteille();
    ok(Math.abs(b.rep1 - b.P * 1e5 * b.V * 1e-3 / (Rg * K(b.th))) < 1e-9 * b.rep1 && Math.abs(b.rep2 - b.rep1 * b.gaz.M) < 1e-9 * b.rep2 && Math.abs(b.rep3 - b.P * b.V / 1.013) < 1e-9 * b.rep3, 'défi bouteille');
    ok(Math.abs(r2(b.rep1) * b.gaz.M - b.rep2) / b.rep2 <= 0.08, 'défi bouteille : chaîne n → m');
    for (const k of [1, 2, 3]) ok(Math.abs(r2(b[`rep${k}`]) - b[`rep${k}`]) / b[`rep${k}`] <= (k === 2 ? 0.08 : 0.06), `défi bouteille : arrondi q${k}`);
  }
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs ${(pireTol * 100).toFixed(2)} % ; ${lots.length} QCM contrôlés`);
} finally { await srv.close(); }
