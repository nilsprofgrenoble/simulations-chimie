// Tirages des exercices « mes2gt-var- » : relit le texte AFFICHÉ, refait le calcul, vérifie que la bonne réponse est acceptée par verifier(),
// qu'aucun piège ni aucune valeur recopiée de l'énoncé n'est accepté, qu'aucune valeur n'est non finie ; options de QCM (ANA, VAL) ; S'APP.
// Usage : node src/simulations/mesureVariabilite2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const fam = R.FAMILLES.find(f => f.id === 'mes2gt-var-calcul');
  ok(fam && fam.domaine === 'Variabilité de la mesure (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s\u00a0\u202f\u2009]/g, '').replace(',', '.'));
  const liste = s => s.split(' ; ').map(num);
  const fr = (x, cs) => Number(x.toPrecision(cs)).toLocaleString('fr-FR', { useGrouping: false, maximumSignificantDigits: cs });
  const moy = v => v.reduce((a, b) => a + b, 0) / v.length;
  let pireTol = 0; const vus = new Set();
  for (let t = 0; t < 5000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f\u2009]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷|undefined|NaN/.test(s) && !/ \/ /.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ », « undefined » ni « / »');
    // 1 : moyenne
    const m1 = T[0].match(/^Six (.*?) \(en (\S+)\) : (.*?)\. Quelle est la moyenne/); ok(m1, T[0]);
    const v1 = liste(m1[3]); ok(v1.length === 6 && Math.abs(moy(v1) - e.questions[0].vrai) < 1e-9, `q1 : ${T[0]}`);
    ok(Math.min(...v1) < e.questions[0].vrai && Math.max(...v1) > e.questions[0].vrai, 'q1 : la moyenne est comprise entre le minimum et le maximum');
    for (const x of v1) ok(!R.verifier(e.questions[0], fr(x, 3)).ok && !R.verifier(e.questions[0], String(x).replace('.', ',')).ok, `q1 : une valeur recopiée de la liste est acceptée (${x} pour ${e.questions[0].vrai})`);
    // 2 : effectif d'une classe
    const m2 = T[1].match(/^Quatorze (.*?) \(en (\S+)\) : (.*?)\. On range.*largeur ([\d,]+) .*de ([\d,]+) .*à ([\d,]+) .* \(borne/); ok(m2, T[1]);
    const v2 = liste(m2[3]), a = num(m2[5]), b = num(m2[6]);
    ok(v2.length === 14 && Math.abs(b - a - num(m2[4])) < 1e-9, 'q2 : largeur de classe');
    ok(v2.filter(x => x >= a - 1e-9 && x < b - 1e-9).length === e.questions[1].vrai, `q2 : ${T[1]}`);
    ok(v2.every(x => Math.abs((x - a) / (b - a) - Math.round((x - a) / (b - a))) > 1e-6), 'q2 : aucune valeur sur une borne');
    // 3 : N intervalles
    const m3 = T[2].match(/chronomètre (\d+) intervalles d’un coup : le chronomètre indique ([\d,]+) s/); ok(m3, T[2]);
    ok(Math.abs(num(m3[2]) / +m3[1] - e.questions[2].vrai) < 1e-9, `q3 : ${T[2]}`);
    ok(!R.verifier(e.questions[2], '1,2').ok, 'q3 : la valeur 1,2 s est acceptée');
    // 4 : rapport
    const m4 = T[3].match(/\(écart-type ([\d,]+) \S+\) et .*?\(écart-type ([\d,]+) /); ok(m4, T[3]);
    ok(Math.abs(num(m4[1]) / num(m4[2]) - e.questions[3].vrai) < 1e-9 && num(m4[1]) > num(m4[2]), `q4 : ${T[3]}`);
    // 5 : valeur manquante
    const m5 = T[4].match(/est ([\d,]+) \S+\. Quatre des valeurs sont : (.*?) \(en/); ok(m5, T[4]);
    const v5 = liste(m5[2]); ok(v5.length === 4 && Math.abs(5 * num(m5[1]) - v5.reduce((x, y) => x + y, 0) - e.questions[4].vrai) < 1e-9, `q5 : ${T[4]}`);
    ok(e.questions[4].vrai > 0, 'q5 : valeur positive');
    // acceptation, pièges, tolérances
    for (const q of e.questions) {
      ok(Number.isFinite(q.vrai) && q.vrai > 0, 'vrai fini'); vus.add(q.id);
      for (const cs of [2, 3, 4]) { const r = R.verifier(q, fr(q.vrai, cs)); ok(r.ok || (q.csMin && cs < q.csMin), `bonne réponse refusée (${q.id}) : ${fr(q.vrai, cs)} ${r.msg}`); }
      ok(R.verifier(q, fr(q.vrai, 3)).ok, `bonne réponse à 3 chiffres refusée : ${q.id} ${q.vrai}`);
      ok(R.verifier(q, fr(q.vrai, 2)).ok || q.csMin > 2 || q.id === 'k1', `bonne réponse arrondie à 2 chiffres refusée : ${q.id} ${q.vrai}`);
      for (const [x] of q.pieges) { ok(Number.isFinite(x), `piège non fini (${q.id})`); ok(!R.verifier(q, fr(x, 3)).ok, `piège accepté (${q.id}) : ${x} pour ${q.vrai}`); }
      pireTol = Math.max(pireTol, q.tolRel ?? 0.006);
    }
  }
  console.log(`REA : 5000 tirages vérifiés (tolérance max ${(pireTol * 100).toFixed(2)} %, ${vus.size} questions)`);
  // QCM ANA et VAL : la bonne réponse n'est jamais la plus longue
  const anas = A.PREVOIR.filter(x => x.id.startsWith('mes2gt-var-')), vals = V.PLAUSIBLES.filter(x => x.id.startsWith('mes2gt-var-'));
  ok(anas.length >= 4 && vals.length >= 4, `ANA ${anas.length}, VAL ${vals.length}`);
  const rangs = [];
  for (const it of [...anas, ...vals]) {
    ok(it.domaine === 'Variabilité de la mesure (2GT)', `${it.id} : domaine`);
    ok(it.options.filter(o => o[1]).length === 1 && it.options.every(o => o[2] && o[2].length > 15), `${it.id} : une bonne réponse et des explications`);
    const L = it.options.map(o => o[0].length), b = it.options.findIndex(o => o[1]);
    ok(L[b] < Math.max(...L), `${it.id} : la bonne réponse est la plus longue (${L})`);
    rangs.push([...L].sort((x, y) => x - y).indexOf(L[b]));
    ok(!/exposant|mantisse|logarithme/i.test(JSON.stringify(it)), `${it.id} : mot interdit`);
  }
  ok(rangs.some(r => r > 0) && rangs.some(r => r === 0 || r > 0), 'longueur de la bonne réponse variée');
  console.log(`ANA ${anas.length}, VAL ${vals.length} : options contrôlées (rangs de longueur de la bonne réponse : ${rangs.join(' ')})`);
  // S'APP
  const saps = D.ENONCES.filter(e => e.id.startsWith('mes2gt-var-'));
  ok(saps.length === 2, 'deux S’APP');
  for (const e of saps) for (let q = 0; q < e.noms.length; q++) for (let k = 0; k < 400; k++) {
    const { b } = D.nouvelEnonce(e.id, q), dansTexte = b.texte.filter(x => typeof x !== 'string').map(x => x.t);
    ok(Number.isFinite(b.solution.val) && b.solution.val > 0, `${e.id}.${q} : solution finie`);
    for (const u of b.utiles) ok(b.tokens[u] && dansTexte.includes(u), `${e.id}.${q} : utile ${u} absent du texte`);
    for (const t of dansTexte) ok(b.utiles.includes(t) || b.raisons[t], `${e.id}.${q} : pas de raison pour ${t}`);
    ok(b.cherche.faux.length >= 3, 'cherche');
    const txtS = b.texte.map(x => typeof x === 'string' ? x : b.tokens[x.t].aff).join('');
    ok(!/undefined|NaN|_|\^/.test(txtS), `${e.id}.${q} : texte ${txtS}`);
    if (e.id.endsWith('moyenne')) { const vals = ['t1', 't2', 't3', 't4', 't5'].map(i => b.tokens[i].use.val), m = vals.reduce((x, y) => x + y, 0) / 5; ok(q === 0 ? Math.abs(b.solution.val - m) < 1e-9 : Math.abs(b.solution.val - (Math.max(...vals) - m)) < 1e-9, `${e.id}.${q} : solution`); }
  }
  console.log('S’APP : 2 énoncés × 2 questions × 400 tirages vérifiés');
  console.log(`OK : ${n} contrôles`);
} finally { await srv.close(); }
