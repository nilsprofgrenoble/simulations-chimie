// Tirages des exercices « mes2gt-inc- » : relit le texte AFFICHÉ, refait le calcul, vérifie que la bonne réponse est acceptée par verifier(),
// qu'aucun piège n'est accepté, qu'une valeur « recopiée » (non arrondie) est refusée, qu'aucune valeur n'est non finie ; QCM ANA/VAL ; S'APP.
// Usage : node src/simulations/mesureIncertitude2gtExercices.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const MI = await srv.ssrLoadModule('/src/simulations/mesureIncertitude2gtModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'mes2gt-inc-calcul');
  ok(fam && fam.domaine === 'Incertitude-type et résultat (2GT)', 'famille REA présente');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));
  const fr = (x, cs) => Number(x.toPrecision(cs)).toLocaleString('fr-FR', { useGrouping: false, maximumSignificantDigits: cs });
  const decs = s => (String(s).split(',')[1] || '').length;
  let nQ = 0, nPremier1 = 0;
  for (let t = 0; t < 5000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 6 && T.every(s => !/_|\^|÷ ?$/.test(s) && !/ \/ /.test(s)), 'texte affiché : pas de « _ », « ^ » ni « / »');
    const [q1, q2, q3, q4, q5, q6] = e.questions;
    // q1 : moyenne des 5 valeurs lues dans l'énoncé
    const vals = T[0].match(/sont : (.*?)\. Quelle/)[1].split(' ; ').map(num); ok(vals.length === 5, T[0]);
    const moy = vals.reduce((a, b) => a + b, 0) / 5; ok(Math.abs(moy - q1.vrai) < 1e-9, `q1 : ${T[0]}`);
    // « recopier » une des mesures ne passe pas (sauf si elle est dans la tolérance : alors le piège est retiré)
    for (const v of vals) { const r = R.verifier(q1, String(v).replace('.', ',')); if (Math.abs(v - q1.vrai) > q1.tolRel * q1.vrai * 1.01) ok(!r.ok, `q1 : une mesure acceptée comme moyenne ${v} ${q1.vrai}`); }
    // q2 : u = s ÷ √n
    const m2 = T[1].match(/(\d+) mesures.*s = ([\d,]+)/); ok(m2, T[1]);
    ok(Math.abs(num(m2[2]) / Math.sqrt(+m2[1]) - q2.vrai) < 1e-9 * q2.vrai, `q2 : ${T[1]}`);
    // q3 : arrondi de u
    const m3 = T[2].match(/u = ([\d,]+)/); const u3 = num(m3[1]);
    ok(Math.abs(MI.arrondiU(u3) - q3.vrai) < 1e-12, `q3 : ${T[2]}`);
    ok(u3 <= q3.vrai + 1e-12, 'q3 : arrondi vers le haut');
    // q4 : arrondi de la moyenne au rang de u
    const m4 = T[3].match(/moyenne d’une série est ([\d,]+).*u = ([\d,]+)/); ok(m4, T[3]);
    ok(Math.abs(MI.arrondiMoyenne(num(m4[1]), num(m4[2])) - q4.vrai) < 1e-9 || /* u arrondie donne le même rang que u brute */ Math.abs(Math.round(num(m4[1]) / Math.pow(10, -decs(m4[2]))) / Math.pow(10, decs(m4[2])) - q4.vrai) < 1e-9, `q4 : ${T[3]}`);
    // q5 : n × k²
    const m5 = T[4].match(/(\d+) mesures.*(\d+) fois plus petite/); ok(m5 && Number(m5[1]) * Number(m5[2]) ** 2 === q5.vrai, `q5 : ${T[4]}`);
    // q6 : qcm
    ok(q6.options.length === 3 && q6.bonne >= 0 && q6.bonne < 3, 'q6 : options');
    const m6 = T[5].match(/= \(([\d,]+) ± ([\d,]+)\) (.*?)\. .*?: ([\d,]+) /);
    // acceptation et pièges (les questions num)
    for (const q of [q1, q2, q3, q4, q5]) {
      nQ++;
      ok(Number.isFinite(q.vrai) && q.vrai > 0, 'vrai fini');
      if (q.csExact) { const bonne = q.vrai.toFixed(decs(MI.fmt(q.vrai, 0)) || 0); }
      const formats = q.csExact ? [MI.fmt(q.vrai, Math.max(0, q.csExact - (Math.floor(Math.log10(q.vrai)) + 1)))] : (q.tolRel === 0 ? [String(q.vrai)] : [fr(q.vrai, 3), fr(q.vrai, 4), fr(q.vrai, 2)]);
      for (const f of formats) {
        const r = R.verifier(q, f);
        if (q.csExact) ok(r.ok, `bonne réponse refusée (${q.id}) : « ${f} » pour ${q.vrai} (csExact ${q.csExact}) : ${r.msg}`);
        else if (!(q.csMin && /* arrondis plus grossiers que la donnée : refus normal */ nbCSdeTexte(f) < q.csMin)) ok(r.ok, `bonne réponse refusée (${q.id}) : ${f} pour ${q.vrai} : ${r.msg}`);
      }
      for (const [x] of q.pieges) { ok(Number.isFinite(x), `piège non fini (${q.id})`); const r = R.verifier(q, String(x).replace('.', ',')); ok(!r.ok, `piège accepté (${q.id}) : ${x} pour ${q.vrai}`); }
    }
    // une valeur non arrondie (u brute, moyenne brute) est refusée en q3 et q4
    ok(!R.verifier(q3, String(u3).replace('.', ',')).ok || Math.abs(u3 - q3.vrai) < 1e-12, 'q3 : u brute acceptée');
    ok(!R.verifier(q4, m4[1]).ok || Math.abs(num(m4[1]) - q4.vrai) < 1e-12 && nbCSdeTexte(m4[1]) === q4.csExact, 'q4 : moyenne brute acceptée');
    if (q3.csExact === 2) nPremier1++;
  }
  function nbCSdeTexte(s) { const t = String(s).replace(',', '.').replace(/^-/, '').replace('.', '').replace(/^0+/, ''); return t.length; }
  console.log(`REA : 5000 tirages vérifiés (${nQ} questions numériques, dont ${nPremier1} u commençant par 1)`);
  // QCM ANA et VAL : la bonne réponse n'est jamais la plus longue
  const anas = A.PREVOIR.filter(x => x.id.startsWith('mes2gt-inc-')), vals = V.PLAUSIBLES.filter(x => x.id.startsWith('mes2gt-inc-'));
  ok(anas.length >= 4 && vals.length >= 4, `ANA ${anas.length}, VAL ${vals.length}`);
  for (const it of [...anas, ...vals]) {
    ok(it.domaine === 'Incertitude-type et résultat (2GT)', `${it.id} : domaine`);
    ok(it.options.filter(o => o[1]).length === 1 && it.options.every(o => o[2] && o[2].length > 15), `${it.id} : une bonne réponse et des explications`);
    const L = it.options.map(o => o[0].length), b = it.options.findIndex(o => o[1]);
    ok(L[b] < Math.max(...L), `${it.id} : la bonne réponse est la plus longue (${L})`);
    ok(!/_|\^/.test(JSON.stringify(it)), `${it.id} : caractères « _ » ou « ^ »`);
  }
  // la bonne réponse n'est pas toujours à la même place ni toujours la plus courte
  const bs = [...anas, ...vals].map(it => { const L = it.options.map(o => o[0].length), b = it.options.findIndex(o => o[1]); return L[b] === Math.min(...L); });
  ok(bs.some(x => !x), 'la bonne réponse n’est pas toujours la plus courte');
  console.log(`ANA ${anas.length}, VAL ${vals.length} : options contrôlées`);
  // S'APP
  const saps = D.ENONCES.filter(e => e.id.startsWith('mes2gt-inc-'));
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
