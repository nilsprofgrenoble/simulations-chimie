// Tirages des exercices « son2gt-niv- » : relit le texte AFFICHÉ, refait le calcul, vérifie que la bonne réponse est acceptée par verifier(),
// qu'aucun piège n'est accepté, qu'aucune valeur n'est non finie ; longueur des options de QCM (ANA, VAL) ; S'APP.
// Usage : node src/simulations/niveauSonore2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const SN = await srv.ssrLoadModule('/src/simulations/niveauSonore2gtModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'son2gt-niv-calcul');
  ok(fam && fam.domaine === 'Niveau sonore (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));
  const fr = (x, cs) => Number(x.toPrecision(cs)).toLocaleString('fr-FR', { useGrouping: false, maximumSignificantDigits: cs });
  let pireTol = 0;
  for (let t = 0; t < 5000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷/.test(s) && !/ \/ /.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ » ni « / »');
    // 1 : écart de niveau
    const m1 = T[0].match(/affiche (\d+) dB près d’un son A.*et (\d+) dB près d’un son B/); ok(m1, T[0]);
    ok(+m1[2] - +m1[1] === e.questions[0].vrai && +m1[2] - +m1[1] >= 20, `q1 : ${T[0]}`);
    // 2 : facteur
    const m2 = T[1].match(/A \((\d+) dB\) et B \((\d+) dB\)/); ok(m2 && +m2[1] === +m1[1] && +m2[2] === +m1[2], `q2 : ${T[1]}`);
    ok(Math.abs(10 ** ((+m2[2] - +m2[1]) / 10) - e.questions[1].vrai) < 1e-6 * e.questions[1].vrai, 'q2 : facteur');
    // 3 : sources
    const m3 = T[2].match(/produit (\d+) dB.*place (\d+) machines/); ok(m3, T[2]);
    ok(Math.abs(+m3[1] + 3 * Math.log2(+m3[2]) - e.questions[2].vrai) < 1e-9, `q3 : ${T[2]}`);
    // 4 : durée repère
    const m4 = T[3].match(/à (\d+) dB, en minutes/); ok(m4, T[3]);
    ok(Math.abs(SN.dureeRepere(+m4[1]) - e.questions[3].vrai) < 1e-9, 'q4');
    const tabl = { 85: 480, 88: 240, 91: 120, 94: 60, 97: 30, 100: 15 }; ok(tabl[+m4[1]] === e.questions[3].vrai, 'q4 : tableau écrit dans l’énoncé');
    // 5 : rapport
    const m5 = T[4].match(/niveau est de (\d+) dB/); const mm = T[4].match(/Un élève passe (.*?) dans une salle.*durée repère est de (.*?)\. La durée/); ok(m5 && mm, T[4]);
    const dur = s => { const h = s.match(/(\d+) h(?: (\d+))?/); if (h) return +h[1] * 60 + (h[2] ? +h[2] : 0); return num(s.match(/([\d,]+) min/)[1]); };
    ok(Math.abs(dur(mm[1]) / dur(mm[2]) - e.questions[4].vrai) < 1e-9, `q5 : ${T[4]}`);
    ok(Math.abs(dur(mm[2]) - SN.dureeRepere(+m5[1])) < 1e-9, 'q5 : durée repère');
    // acceptation, pièges, tolérances
    for (const q of e.questions) {
      ok(Number.isFinite(q.vrai) && q.vrai > 0, 'vrai fini');
      for (const cs of [2, 3, 4]) { const r = R.verifier(q, fr(q.vrai, cs)); ok(r.ok || (q.csMin && cs < q.csMin), `bonne réponse refusée (${q.id}) : ${fr(q.vrai, cs)} ${r.msg}`); }
      ok(R.verifier(q, fr(q.vrai, 3)).ok, `bonne réponse à 3 chiffres refusée : ${q.id} ${q.vrai}`);
      for (const [x] of q.pieges) { ok(Number.isFinite(x), `piège non fini (${q.id})`); ok(!R.verifier(q, fr(x, 3)).ok, `piège accepté (${q.id}) : ${x} pour ${q.vrai}`); }
      pireTol = Math.max(pireTol, q.tolRel ?? 0.006);
    }
  }
  console.log(`REA : 5000 tirages vérifiés (tolérance max ${pireTol})`);
  // QCM ANA et VAL : la bonne réponse n'est jamais la plus longue
  const anas = A.PREVOIR.filter(x => x.id.startsWith('son2gt-niv-')), vals = V.PLAUSIBLES.filter(x => x.id.startsWith('son2gt-niv-'));
  ok(anas.length >= 4 && vals.length >= 4, `ANA ${anas.length}, VAL ${vals.length}`);
  for (const it of [...anas, ...vals]) {
    ok(it.domaine === 'Niveau sonore (2GT)', `${it.id} : domaine`);
    ok(it.options.filter(o => o[1]).length === 1 && it.options.every(o => o[2] && o[2].length > 15), `${it.id} : une bonne réponse et des explications`);
    const L = it.options.map(o => o[0].length), b = it.options.findIndex(o => o[1]);
    ok(L[b] < Math.max(...L), `${it.id} : la bonne réponse est la plus longue (${L})`);
  }
  console.log(`ANA ${anas.length}, VAL ${vals.length} : options contrôlées`);
  // S'APP
  const saps = D.ENONCES.filter(e => e.id.startsWith('son2gt-niv-'));
  ok(saps.length === 2, 'deux S’APP');
  for (const e of saps) for (let q = 0; q < e.noms.length; q++) for (let k = 0; k < 300; k++) {
    const { b } = D.nouvelEnonce(e.id, q), dansTexte = b.texte.filter(x => typeof x !== 'string').map(x => x.t);
    ok(Number.isFinite(b.solution.val) && b.solution.val > 0, `${e.id}.${q} : solution finie`);
    for (const u of b.utiles) ok(b.tokens[u] && dansTexte.includes(u), `${e.id}.${q} : utile ${u} absent du texte`);
    for (const t of dansTexte) ok(b.utiles.includes(t) || b.raisons[t], `${e.id}.${q} : pas de raison pour ${t}`);
    ok(b.cherche.faux.length >= 3, 'cherche');
    const txtS = b.texte.map(x => typeof x === 'string' ? x : b.tokens[x.t].aff).join('');
    ok(!/undefined|NaN|_|\^/.test(txtS), `${e.id}.${q} : texte ${txtS}`);
  }
  console.log('S’APP : 2 énoncés × 2 questions × 300 tirages vérifiés');
  console.log(`OK : ${n} contrôles`);
} finally { await srv.close(); }
