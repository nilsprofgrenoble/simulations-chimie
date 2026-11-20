// Tirages des exercices « ber- » (simulation 214) : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP),
// tolérances des défis face aux arrondis d'un élève (2 chiffres significatifs, intermédiaires arrondis).
// Usage : node src/simulations/berTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
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
  const Q = await srv.ssrLoadModule('/src/simulations/berQcm.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/berModele.js');
  const fam = R.FAMILLES.find(f => f.id === 'ber-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-'));
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  const S = d => Math.PI * (d / 1000) ** 2 / 4;
  let pireTol = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), T = e.questions.map(q => txt(q.q).replace(/[  ]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|÷|√/.test(s) && !/\//.test(s)), 'texte affiché : pas de « _ », « ^ », « ÷ », « √ » ni « / »');
    // 1 : Q = S v en L/min
    const v1 = num(T[0].match(/v = ([\d,]+) m/)[1]), d1 = num(T[0].match(/d = (\d+) mm/)[1]);
    ok(Math.abs(S(d1) * v1 * 60000 - e.questions[0].vrai) < 1e-9 * e.questions[0].vrai, `q1 : ${T[0]}`);
    // 2 : v_B = v_A (d_A/d_B)^2
    const dA2 = num(T[1].match(/diamètre (\d+) mm/)[1]), vA2 = num(T[1].match(/à ([\d,]+) m·s/)[1]), dB2 = num(T[1].match(/col de diamètre (\d+) mm/)[1]);
    ok(Math.abs(vA2 * (dA2 / dB2) ** 2 - e.questions[1].vrai) < 1e-9 * e.questions[1].vrai && e.questions[1].vrai <= 6 && dB2 < dA2, `q2 : ${T[1]}`);
    // 3 : P_A − P_B en kPa
    const vA3 = num(T[2].match(/vA = ([\d,]+) m/)[1]), vB3 = num(T[2].match(/vB = ([\d,]+) m/)[1]);
    ok(Math.abs(0.5 * 1000 * (vB3 ** 2 - vA3 ** 2) / 1000 - e.questions[2].vrai) < 1e-9 * e.questions[2].vrai && vB3 > vA3, `q3 : ${T[2]}`);
    // 4 : Torricelli
    const h4 = num(T[3].match(/h = ([\d,]+) m/)[1]);
    ok(Math.abs(Math.sqrt(2 * 9.81 * h4) - e.questions[3].vrai) < 1e-9 * e.questions[3].vrai, `q4 : ${T[3]}`);
    // 5 : Venturi, Δh en cm
    const dA5 = num(T[4].match(/dA = (\d+) mm/)[1]), vA5 = num(T[4].match(/vA = ([\d,]+) m/)[1]), dB5 = num(T[4].match(/dB = (\d+) mm/)[1]);
    const dh5 = 0.5 * 1000 * ((vA5 * (dA5 / dB5) ** 2) ** 2 - vA5 ** 2) / (1000 * 9.81) * 100;
    ok(Math.abs(dh5 - e.questions[4].vrai) < 1e-9 * e.questions[4].vrai && dh5 >= 3 && dh5 <= 120, `q5 : ${T[4]} (${dh5})`);
    ok(M.RHO === 1000 && M.G === 9.81, 'constantes du modèle');
    for (const q of e.questions) {
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 1.5 * q.tolRel && Math.abs(v - q.vrai) / Math.abs(q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = Math.abs(r2(q.vrai) - q.vrai) / Math.abs(q.vrai); pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance (${arr})`);
      ok(Math.abs(r3(q.vrai) - q.vrai) / Math.abs(q.vrai) <= q.tolRel, 'arrondi à 3 chiffres');
      ok(typeof q.aide === 'string' && !/\^|÷|\//.test(q.aide), `${q.id} : aide sans « ^ », « ÷ » ni « / »`);
      for (const [, msg] of q.pieges) ok(!/\^|÷|\//.test(msg), `${q.id} : piège « ${msg} »`);
      ok(!/_|\^|÷|√|\/(?!(L|g|s))/.test(txt(q.expl)), `${q.id} : expl « ${txt(q.expl)} »`);
    }
    // chaîne q3 : vitesses arrondies à 2 chiffres significatifs, résultat arrondi : reste dans la tolérance
    const dp = 0.5 * (r2(vB3) ** 2 - r2(vA3) ** 2); ok(Math.abs(r2(dp) - e.questions[2].vrai) / e.questions[2].vrai <= e.questions[2].tolRel, 'chaîne q3 (arrondis)');
    // chaîne q5 : v_B arrondie à 2 chiffres, puis Δh
    const vB5 = r2(vA5 * (dA5 / dB5) ** 2), dh5r = r2(0.5 * (vB5 ** 2 - vA5 ** 2) / 9.81 * 100);
    ok(Math.abs(dh5r - e.questions[4].vrai) / e.questions[4].vrai <= e.questions[4].tolRel, `chaîne q5 (arrondis) ${dh5r} / ${e.questions[4].vrai}`);
  }
  // S'APP
  const sapp = D.ENONCES.find(x => x.id === 'ber-sapp-venturi');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      const vB = p.vA * (p.dA / p.dB) ** 2;
      ok(Math.abs(b.solution.val - (q === 0 ? vB : 0.5 * (vB ** 2 - p.vA ** 2))) < 1e-9, 'S\'APP : solution');
      ok(vB <= 6, 'S\'APP : vitesse au col réaliste');
      ok(b.cherche.bonne && b.cherche.faux.length === 3, 'S\'APP : grandeur cherchée');
      ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), 'S\'APP : raisons pour les seules données inutiles');
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); ok(inutiles.every(k => b.raisons[k]), 'S\'APP : chaque donnée inutile est expliquée');
      ok(!/_|\^|÷/.test(b.texte.map(x => typeof x === 'string' ? x : '').join('')), 'S\'APP : texte propre');
    }
  }
  // QCM : la bonne réponse n'est ni la plus longue ni la plus courte
  const rendu = s => Q.texteRendu(s);
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options.map(rendu), v.bonne]);
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('ber-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  const valListe = V.PLAUSIBLES.filter(y => y.id.startsWith('ber-'));
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
  ok(mauvais.length === 0, '\n' + mauvais.join('\n'));
  // Défis : un élève qui arrondit à 2 chiffres significatifs (intermédiaires compris) doit être jugé juste ; les erreurs classiques non
  const TOL = { prevoir: [0.05, 0.06, 0.08], colonnes: [0.05, 0.06, 0.10] };   // à garder identique à EcoulementFluide.jsx
  const rel = (x, a) => Math.abs(x - a) / Math.abs(a);
  let pire = [0, 0, 0, 0, 0, 0];
  for (let t = 0; t < 5000; t++) {
    const d = M.tiragePrevoir(), Q_ = M.siDeLmin(d.q), g = M.G, rho = M.RHO;
    // trajet de l'élève : intermédiaires (S, v) gardés à 3 cs comme conseillé, résultats finals arrondis à 2 cs
    const SA = r3(M.aire(d.dA)), SB = r3(M.aire(d.dB)), vA = r3(Q_ / SA), vB = r3(Q_ / SB);
    const dpE = r2((0.5 * rho * (vB ** 2 - vA ** 2) + rho * g * d.dz) / 1000), pB = r2(d.PrA - dpE), vBf = r2(vB);
    pire[0] = Math.max(pire[0], rel(vBf, d.qVB)); pire[1] = Math.max(pire[1], rel(dpE, d.qDP)); pire[2] = Math.max(pire[2], rel(pB, d.qPB));
    ok(rel(vBf, d.qVB) <= TOL.prevoir[0] && rel(dpE, d.qDP) <= TOL.prevoir[1] && rel(pB, d.qPB) <= TOL.prevoir[2], `défi prévoir : arrondis hors tolérance ${JSON.stringify(d)} ${vB} ${dpE} ${pB}`);
    ok(d.qPB * 1000 >= 2500 && d.qPB > 0, 'défi prévoir : pression relative au col positive et mesurable');
    // erreurs classiques hors tolérance : P_B − P_atm pris égal à P_A − P_atm ; Δp oublié du ½ ; rapport des diamètres au lieu des sections
    ok(rel(d.PrA, d.qPB) > TOL.prevoir[2], 'défi prévoir : P_B = P_A accepté à tort');
    ok(rel(0.5 * d.qDP, d.qDP) > TOL.prevoir[1] && rel(d.vA * d.dA / d.dB, d.qVB) > TOL.prevoir[0], 'défi prévoir : pièges ½ et diamètres');
    const c = M.tirageColonnes(), SAc = r3(M.aire(c.dA)), vAc3 = r3(M.vADepuisDeltaP(RHO_(c), c.dA, c.dB)), vAc = r2(vAc3), qc = r2(M.lmin(vAc3 * SAc));
    function RHO_(x) { return M.RHO * M.G * x.dh; }
    const dpc = r2(M.RHO * M.G * c.dh / 1000);
    pire[3] = Math.max(pire[3], rel(dpc, c.qDP)); pire[4] = Math.max(pire[4], rel(vAc, c.qVA)); pire[5] = Math.max(pire[5], rel(qc, c.qQ));
    ok(rel(dpc, c.qDP) <= TOL.colonnes[0] && rel(vAc, c.qVA) <= TOL.colonnes[1] && rel(qc, c.qQ) <= TOL.colonnes[2], `défi colonnes : arrondis hors tolérance ${JSON.stringify(c)} ${dpc} ${vAc} ${qc}`);
    ok(c.dh >= 0.12 && c.hA > c.hB && c.hB >= 0.1, 'défi colonnes : colonnes cohérentes');
  }
  console.log(`${n} contrôles OK ; pire arrondi à 2 chiffres significatifs ${(pireTol * 100).toFixed(2)} % ; ${lots.length} QCM contrôlés ; défis, pires écarts relatifs (prévoir v, Δp, P ; colonnes Δp, v, Q) : ${pire.map(x => (x * 100).toFixed(1) + ' %').join(' / ')}`);
} finally { await srv.close(); }
