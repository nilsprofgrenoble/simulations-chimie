// Tirages des exercices « thm- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP).
// Usage : node src/simulations/thmTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const Q = await srv.ssrLoadModule('/src/simulations/thmQcm.jsx');
  const fam = R.FAMILLES.find(f => f.id === 'thm-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.').replace('−', '-'));
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  let pireTol = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    // 1 : τ = m c / (h S), en minutes
    let m = num(T[0].match(/m = ([\d,]+) kg/)[1]), hS = num(T[0].match(/vaut ([\d,]+) W/)[1]);
    ok(Math.abs(m * 4180 / hS / 60 - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    // 2 : φ = h S (T_ext − T)
    hS = num(T[1].match(/vaut ([\d,]+) W/)[1]); const T2 = num(T[1].match(/T = (\d+) °C/)[1]), Te2 = num(T[1].match(/Text = (\d+) °C/)[1]);
    ok(Math.abs(hS * (Te2 - T2) - e.questions[1].vrai) < 1e-9 * Math.abs(e.questions[1].vrai) && T2 !== Te2, `q2 : ${T[1]}`);
    // 3 : ΔT = φ Δt / C
    const C3 = num(T[2].match(/C = (\d+) J/)[1]), phi3 = num(T[2].match(/φ = (−?\d+) W/)[1]), dt3 = num(T[2].match(/Δt = (\d+) s/)[1]);
    ok(Math.abs(phi3 * dt3 / C3 - e.questions[2].vrai) < 1e-9 * Math.abs(e.questions[2].vrai), `q3 : ${T[2]}`);
    // 4 : T(t)
    const T04 = num(T[3].match(/T0 = (\d+) °C/)[1]), Te4 = num(T[3].match(/Text = (\d+) °C/)[1]), tau4 = num(T[3].match(/τ = (\d+) min/)[1]), t4 = num(T[3].match(/t = (\d+) min/)[1]);
    ok(Math.abs(Te4 + (T04 - Te4) * Math.exp(-t4 / tau4) - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q4 : ${T[3]}`);
    ok(t4 / tau4 >= 0.3 && t4 / tau4 <= 2.5, `q4 : t/τ réaliste (${t4 / tau4})`);
    // 5 : durée pour atteindre Tc
    const T05 = num(T[4].match(/T0 = (\d+) °C/)[1]), Te5 = num(T[4].match(/Text = (\d+) °C/)[1]), tau5 = num(T[4].match(/τ = (\d+) min/)[1]), Tc5 = num(T[4].match(/atteint (\d+) °C/)[1]);
    const r5 = (Tc5 - Te5) / (T05 - Te5);
    ok(r5 > 0 && r5 < 1 && Math.abs(tau5 * Math.log(1 / r5) - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai, `q5 : ${T[4]}`);
    // pièges hors de 1,5 × tolérance ; arrondi à 2 chiffres significatifs accepté ; chaînes
    for (const q of e.questions) {
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 1.5 * q.tolRel && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai); pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance (${arr})`);
      ok(Math.abs(r3(q.vrai) - q.vrai) / Math.abs(q.vrai) <= q.tolRel, 'arrondi à 3 chiffres');
      ok(typeof q.aide === 'string' && !/\^|÷|\//.test(q.aide), `${q.id} : aide sans « _ », « ^ », « ÷ » ni « / »`);
      for (const [, msg] of q.pieges) ok(!/\^|÷|\//.test(msg), `${q.id} : piège « ${msg} »`);
      ok(!/_|\^|÷|\/(?!(L|g|s))/.test(txt(q.expl)), `${q.id} : expl « ${txt(q.expl)} »`);
    }
    ok(e.questions[0].vrai >= 5 && e.questions[0].vrai <= 300, 'τ réaliste');
  }
  // S'APP : les deux variantes se construisent, les données utiles sont dans le texte, la solution est cohérente
  const sapp = D.ENONCES.find(x => x.id === 'thm-sapp-tasse');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      ok(Math.abs(b.solution.val - (q === 0 ? p.m * 4180 / p.hS / 60 : p.hS * (p.Te - p.T0))) < 1e-9, 'S\'APP : solution');
      ok(b.cherche.bonne && b.cherche.faux.length === 3, 'S\'APP : grandeur cherchée');
      ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), 'S\'APP : raisons pour les seules données inutiles');
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); ok(inutiles.every(k => b.raisons[k]), 'S\'APP : chaque donnée inutile est expliquée');
      ok(!/_|\^|÷/.test(b.texte.map(x => typeof x === 'string' ? x : '').join('')), 'S\'APP : texte propre');
    }
  }
  // QCM : la bonne réponse n'est ni la plus longue ni la plus courte (texte rendu, indices ; une fraction compte pour ses deux parties)
  const rendu = s => Q.texteRendu(s);
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options.map(rendu), v.bonne]);
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('thm-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  const valListe = V.PLAUSIBLES.filter(y => y.id.startsWith('thm-'));
  for (const x of valListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  ok(anaListe.length >= 3 && valListe.length >= 3, 'ANA : 3 et VAL : 3');
  const mauvais = [];
  for (const [nom, opts, b] of lots) {
    const L = opts.map(o => o.length), max = Math.max(...L), min = Math.min(...L);
    if (!(L[b] < max)) mauvais.push(`${nom} : la bonne réponse est la plus longue (${L.join(', ')}, bonne = ${b})`);
    if (L[b] === min) mauvais.push(`${nom} : bonne réponse la plus courte (${L.join(', ')}, bonne = ${b})`);
    if (!(max - min <= 40 || max / min < 1.7)) mauvais.push(`${nom} : options déséquilibrées (${L.join(', ')})`);
    ok(opts.every(o => !/\^|÷/.test(o)), `${nom} : option sans « ^ » ni « ÷ »`);
  }
  // les justifications (retours) ne sont pas dans les libellés : aucun « car » dans les options
  for (const x of [...anaListe, ...valListe]) for (const o of x.options) { if (/ car /.test(o[0])) mauvais.push(`${x.id} : justification dans l’option « ${o[0]} »`); ok(!/\^|÷|\/(?!(L|g|s))/.test(o[2]), `${x.id} : retour « ${o[2]} »`); }
  for (const x of [...anaListe, ...valListe]) ok(x.options.length >= 3 && x.options.every(o => o[2] && o[2].length > 20), `${x.id} : un retour ciblé par option`);
  // libellés « cherche » des S'APP
  for (const q of [0, 1]) { const b = sapp.build(sapp.gen(), q), L = [b.cherche.bonne, ...b.cherche.faux].map(s => s.length); if (!(L[0] < Math.max(...L)) || L[0] === Math.min(...L)) mauvais.push(`S'APP q${q} : libellés ${L.join('/')}`); }
  ok(mauvais.length === 0, '\n' + mauvais.join('\n'));
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs ${(pireTol * 100).toFixed(2)} % ; ${lots.length} QCM contrôlés`);
} finally { await srv.close(); }
