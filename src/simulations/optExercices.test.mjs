// Contrôle des exercices « Optimisation d'une étape de synthèse » (sim 189) : node src/simulations/optExercices.test.mjs
//  1. famille REA opt-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits,
//     on compare à la réponse attendue (0,5 %) et à l'expression de la correction, et on mesure le pire écart d'un élève qui arrondit son résultat à 2 chiffres significatifs
//     (la tolérance de 5 % doit l'accepter) ; les pièges restent hors de la tolérance (au moins 8 %), au moins 2 par question.
//  2. QCM (parcours, ANA, VAL, libellés des S'APP, options du défi) : la bonne réponse n'est jamais la plus longue (texte rendu) et n'est pas systématiquement la plus courte.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './optQcm.js';
import * as M from './optModele.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'opt-calcul'); assert.ok(fam, 'famille opt-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/−/g, '-');
  const num = s => Number(String(s).replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const sig = (x, k) => Number(Number(x).toPrecision(k));
  const quantites = t => [...t.matchAll(/(\d+,\d+) mol/g)].map(m => num(m[1]));
  const pire = [0, 0, 0, 0]; let minPieges = 9; const N = 5000;
  for (let i = 0; i < N; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions;
    for (const q of ex.questions) { assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges (${q.pieges.length})`); minPieges = Math.min(minPieges, q.pieges.length); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`); }
    // q1 : rendement
    let t = texte(q1.q), [a, b, o] = quantites(t); let eta = 100 * o / Math.min(a, b);
    assert.ok(rel(eta, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${eta}`); assert.ok(o < Math.min(a, b), 'ester isolé supérieur à n_max');
    let c = texte(q1.expl); assert.ok(rel(num(/= ([\d,]+) %/.exec(c)[1]), eta) < 0.01, `q1 expl : ${c}`);
    pire[0] = Math.max(pire[0], rel(sig(eta, 2), eta));
    // q2 : Qr
    t = texte(q2.q); const [A, B, E, W] = quantites(t), Qr = E * W / (A * B);
    assert.ok(rel(Qr, q2.vrai) < 0.005, `q2 : attendu ${q2.vrai}, texte donne ${Qr}`);
    c = texte(q2.expl); assert.ok(rel(num(/= (\d+,\d+), (?:inf|sup|ég)/.exec(c)[1]), Qr) < 0.05, `q2 expl : ${c}`);
    assert.ok((Qr < 4) === /direct/.test(c), 'sens d’évolution de la correction');
    pire[1] = Math.max(pire[1], rel(sig(sig(E * W, 3) / sig(A * B, 3), 2), Qr));
    // q3 : Qr juste après le retrait d'une partie de l'eau
    t = texte(q3.q); const [a3, , e3, , w3] = quantites(t), Q3 = e3 * (e3 - w3) / (a3 * a3);
    assert.ok(Math.abs(e3 / a3 - 2) < 1e-9, 'q3 : état initial non équilibré (nE = 2 nA)'); assert.ok(w3 <= e3 && w3 > 0); assert.ok(rel(Q3, q3.vrai) < 0.005, `q3 : attendu ${q3.vrai}, texte donne ${Q3}`);
    c = texte(q3.expl); assert.ok(rel(num(/= (\d+,\d+), (?:inf|sup|ég)/.exec(c)[1]), Q3) < 0.05, `q3 expl : ${c}`); assert.ok(Q3 < 4);
    pire[2] = Math.max(pire[2], rel(sig(Q3, 2), Q3));
    // q4 : Qr après ajout d'éthanol
    t = texte(q4.q); const [nA, , nE, , aj] = quantites(t), Q4 = nE * nE / (nA * (nA + aj));
    assert.ok(Math.abs(nE / nA - 2) < 1e-9, 'état initial non équilibré (nE = 2 nA)'); assert.ok(rel(Q4, q4.vrai) < 0.005, `q4 : attendu ${q4.vrai}, texte donne ${Q4}`);
    c = texte(q4.expl); assert.ok(rel(num(/= (\d+,\d+), (?:inf|sup|ég)/.exec(c)[1]), Q4) < 0.05, `q4 expl : ${c}`); assert.ok(Q4 < 4);
    pire[3] = Math.max(pire[3], rel(sig(Q4, 2), Q4));
    for (const q of ex.questions) { const tt = texte(q.q) + ' ' + texte(q.expl); assert.ok(!/[_÷^]/.test(tt), 'souligné, ÷ ou ^ brut : ' + tt.match(/.{0,40}[_÷^].{0,40}/)?.[0]); }
    // les données et les corrections ne contiennent aucun arrondi par nb() (décimales fixes) : pas de nombre sans virgule parmi les quantités
    assert.ok(/\d,\d\d/.test(texte(q1.q)));
  }
  for (const [k, p] of pire.entries()) assert.ok(p < 0.05, `question ${k + 1} : pire écart d'arrondi ${p} ≥ 5 %`);

  // ---------- QCM : longueurs des options (texte rendu) ----------
  const rangs = [];
  const verifQcm = (nom, longueurs, bonne) => { const b = longueurs[bonne]; assert.ok(b < Math.max(...longueurs), `${nom} : la bonne réponse est la plus longue (${longueurs.join(' ')})`); return b === Math.min(...longueurs); };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifQcm('parcours ' + k, q.options.map(o => texte(o).length), q.bonne)) courtes++; }
  const lesOpt = it => it.options.map(o => o[0].length), bonneIdx = it => it.options.findIndex(o => o[1]);
  const anaOpt = Object.values(ana).flat().filter(x => x && typeof x === 'object' && /^opt-ana/.test(x.id || '')), valOpt = Object.values(val).flat().filter(x => x && typeof x === 'object' && /^opt-val/.test(x.id || ''));
  assert.equal(anaOpt.length, 2); assert.equal(valOpt.length, 3);
  let c2 = 0, c3 = 0;
  for (const it of anaOpt) if (verifQcm(it.id, lesOpt(it), bonneIdx(it))) c2++;
  for (const it of valOpt) if (verifQcm(it.id, lesOpt(it), bonneIdx(it))) c3++;
  assert.ok(c3 <= 1, `VAL : la bonne réponse est la plus courte ${c3}/3 fois`); assert.ok(c2 <= 1, `ANA : la bonne réponse est la plus courte ${c2}/2 fois`);
  const sapp = don.ENONCES.filter(e => /^opt-sapp/.test(e.id)); assert.equal(sapp.length, 2);
  let c4 = 0, n4 = 0;
  for (const e of sapp) for (let q = 0; q < 2; q++) { for (let j = 0; j < 200; j++) { const b = e.build(e.gen(), q); assert.ok(b.utiles.every(u => b.tokens[u]), `${e.id}.${q} : donnée utile absente de l'énoncé`); const l = [b.cherche.bonne, ...b.cherche.faux].map(x => x.length); assert.ok(l[0] < Math.max(...l), `${e.id}.${q} : libellé « cherche » le plus long (${l.join(' ')})`); if (j === 0) { n4++; if (l[0] === Math.min(...l)) c4++; } } }
  // cohérence des données des S'APP
  const etas = new Set();
  for (let i = 0; i < 3000; i++) {
    const p = sapp[0].gen(); assert.ok(p.ob < Math.min(p.a, p.b) && Math.max(p.a, p.b) / Math.min(p.a, p.b) >= 1.25, 'S’APP rendement : ester isolé supérieur à n_max ou excès trop faible');
    const e = sapp[1].gen(), q0 = sapp[1].build(e, 0), q1 = sapp[1].build(e, 1);
    assert.ok(rel(M.qr(e.nA, e.nB, e.nE, e.nE), 4) < 0.03, 'S’APP excès : état initial non à l’équilibre (' + M.qr(e.nA, e.nB, e.nE, e.nE) + ')'); assert.ok(Math.abs(e.nA + e.nE - e.n) < 1e-9 && Math.abs(e.nB + e.nE - e.m) < 1e-9, 'bilan de matière');
    assert.ok(Math.abs(q0.solution.val - M.qr(e.nA, e.nB + e.aj, e.nE, e.nE)) < 1e-9 && q0.solution.val < 4); assert.ok(Math.abs(q1.solution.val - 100 * e.nE / e.n) < 1e-9); etas.add(q1.solution.val.toFixed(0));
  }
  assert.ok(etas.size >= 2, 'S’APP excès : la réponse « rendement avant l’ajout » ne varie pas (' + [...etas] + ')');
  // options du défi « protocole » : question 3 (rôle d'une opération) et question 2 (plus petit excès) : rang de longueur de la bonne réponse
  const optsOp = ['elle accélère la formation de l’ester sans changer la quantité obtenue à l’équilibre', 'elle augmente la quantité d’ester obtenue à l’équilibre', 'elle traite ou contrôle le produit, sans agir sur la vitesse ni sur le rendement', 'elle accélère la formation de l’ester et augmente aussi la quantité obtenue à l’équilibre'];
  const opts2 = ['rapport 1 : 1 (1 mol d’éthanol)', 'rapport 1 : 2 (2 mol d’éthanol)', 'rapport 1 : 3 (3 mol d’éthanol)', 'rapport 1 : 5 (5 mol d’éthanol)'];
  const cat = { v: 0, r: 1, n: 2 }, stat = { court: 0, long: 0, n: 0 }, comptes = { v: 0, r: 0, n: 0 }, lg = optsOp.map(o => o.length);
  for (let i = 0; i < 6000; i++) {
    const d = M.tirageDefiProtocole(); comptes[d.op[1]]++;
    assert.ok(lg[cat[d.op[1]]] < Math.max(...lg), `défi : la bonne réponse (${d.op[1]}) est la plus longue`); if (lg[cat[d.op[1]]] === Math.min(...lg)) stat.court++; stat.n++;
    const r = M.rapportMinimal(d.cible), l2 = opts2.map(o => o.length), b2 = M.RAPPORTS.indexOf(r); assert.ok(l2[b2] <= Math.max(...l2) && new Set(l2).size === 1, `défi excès : bonne réponse la plus longue (r=${r})`);
  }
  assert.ok(comptes.v > 0 && comptes.r > 0 && comptes.n > 0);
  assert.ok(stat.court < stat.n * 0.7, `défi : la bonne réponse est la plus courte trop souvent (${stat.court}/${stat.n})`);
  console.log(`optExercices : REA OK sur ${N} tirages (pires écarts d'un élève qui arrondit à 2 chiffres significatifs : ${pire.map(p => (100 * p).toFixed(2) + ' %').join(', ')} ; pièges restants au minimum ${minPieges}) ; QCM parcours : ${courtes}/${total} les plus courtes ; ANA : ${c2}/2 ; VAL : ${c3}/3 ; libellés S'APP : ${c4}/${n4} ; défi rôle d'une opération : bonne réponse la plus courte dans ${(100 * stat.court / stat.n).toFixed(0)} % des tirages`);
} finally { await serveur.close(); }
