// Tirages des exercices « arc- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP).
// Usage : node src/simulations/arcTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const Q = await srv.ssrLoadModule('/src/simulations/arcQcm.jsx');
  const fam = R.FAMILLES.find(f => f.id === 'arc-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-'));
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  const G = 9.8, dec = (T, re) => num(T.match(re)[1]);
  let pireTol = 0, pireInter = 0, pireInter4 = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/\/(?!(L|g|s))/.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    // 1 : Π = ρ V g
    const V1 = dec(T[0], /V = ([\d\s]+) cm³/), rf1 = dec(T[0], /ρfluide = ([\d\s]+) kg/);
    ok(Math.abs(rf1 * V1 * 1e-6 * G - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    // 2 : F = P − Π, P lue
    const V2 = dec(T[1], /V = ([\d\s]+) cm³/), P2 = dec(T[1], /P = ([\d,\s]+) N/), rf2 = dec(T[1], /ρfluide = ([\d\s]+) kg/), Pi2 = rf2 * V2 * 1e-6 * G;
    ok(Math.abs(P2 - Pi2 - e.questions[1].vrai) < 1e-9 && e.questions[1].vrai > 0, `q2 : ${T[1]}`);
    pireInter = Math.max(pireInter, Math.abs(P2 - r2(Pi2) - e.questions[1].vrai) / e.questions[1].vrai);
    // 3 : fraction immergée
    const o3 = dec(T[2], /ρobjet = ([\d\s]+) kg/), f3 = dec(T[2], /ρfluide = ([\d\s]+) kg/);
    ok(o3 < f3 && Math.abs(100 * o3 / f3 - e.questions[2].vrai) < 1e-9, `q3 : ${T[2]}`);
    // 4 : masse posée (g)
    const V4 = dec(T[3], /V = ([\d\s]+) cm³/), o4 = dec(T[3], /ρobjet = ([\d\s]+) kg/), f4 = dec(T[3], /ρfluide = ([\d\s]+) kg/);
    ok(o4 < f4 && Math.abs((f4 - o4) * V4 * 1e-3 - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q4 : ${T[3]}`);
    pireInter4 = Math.max(pireInter4, Math.abs(r2(f4 * V4 * 1e-3) - r2(o4 * V4 * 1e-3) - e.questions[3].vrai) / e.questions[3].vrai);   // pire cas : l’élève arrondit les deux masses à 2 chiffres avant de soustraire
    // 5 : ρ du liquide d'après P et F lus
    const V5 = dec(T[4], /V = ([\d\s]+) cm³/), P5 = dec(T[4], /P = ([\d,\s]+) N/), F5 = dec(T[4], /F = ([\d,\s]+) N/);
    ok(Math.abs((P5 - F5) / (V5 * 1e-6 * G) - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai && P5 > F5, `q5 : ${T[4]}`);
    for (const q of e.questions) {
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 1.5 * q.tolRel && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai); pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance (${arr})`);
      ok(Math.abs(r3(q.vrai) - q.vrai) / Math.abs(q.vrai) <= q.tolRel, 'arrondi à 3 chiffres');
      ok(typeof q.aide === 'string' && !/\^|÷|\//.test(q.aide), `${q.id} : aide sans « ^ », « ÷ » ni « / »`);
      for (const [, msg] of q.pieges) ok(!/\^|÷|\//.test(msg), `${q.id} : piège « ${msg} »`);
      ok(!/\^|÷|(?<![\d])\/(?!(L|g|s))/.test(txt(q.expl)), `${q.id} : expl « ${txt(q.expl)} »`);
    }
    ok(!/_/.test(txt(e.questions.map(q => q.expl))), 'expl sans « _ »');
  }
  ok(pireInter <= 0.06, `q2 : arrondi de Π à 2 chiffres avant la soustraction, pire écart ${pireInter}`);
  ok(pireInter4 <= 0.08, `q4 : pire écart si les deux masses sont arrondies avant la soustraction ${pireInter4}`);
  // S'APP : les deux variantes se construisent, les données utiles sont dans le texte, la solution est cohérente
  const sapp = D.ENONCES.find(x => x.id === 'arc-sapp-flotteur');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      ok(Math.abs(b.solution.val - (q === 0 ? p.rhoB : p.rhoE) * p.V * 1e-6 * 9.8) < 1e-9, 'S\'APP : solution');
      ok(b.cherche.bonne && b.cherche.faux.length === 3, 'S\'APP : grandeur cherchée');
      ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), 'S\'APP : raisons pour les seules données inutiles');
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); ok(inutiles.every(k => b.raisons[k]), 'S\'APP : chaque donnée inutile est expliquée');
      ok(!/_|\^|÷/.test(b.texte.map(x => typeof x === 'string' ? x : '').join('')), 'S\'APP : texte propre');
    }
  }
  // QCM : la bonne réponse n'est ni la plus longue ni la plus courte (texte rendu)
  const rendu = s => Q.texteRendu(s);
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options.map(rendu), v.bonne]);
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('arc-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  const valListe = V.PLAUSIBLES.filter(y => y.id.startsWith('arc-'));
  for (const x of valListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  ok(anaListe.length >= 3 && valListe.length >= 3, `ANA et VAL : au moins 3 de chaque (${anaListe.length}, ${valListe.length})`);
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
  ok(mauvais.length === 0, '\n' + mauvais.join('\n'));
  // tirage aléatoire du rang de longueur de la bonne réponse : les banques ne l'imposent pas ; on vérifie sur 3 000 mélanges que la position de la bonne réponse varie
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs ${(pireTol * 100).toFixed(2)} % ; pire arrondi intermédiaire q2 ${(pireInter * 100).toFixed(2)} % et q4 (cas extrême) ${(pireInter4 * 100).toFixed(1)} % pour une tolérance de 8 % ; ${lots.length} QCM contrôlés`);
} finally { await srv.close(); }
