// Contrôle des exercices « Diffraction d'une onde » (sim 181) : node src/simulations/difExercices.test.mjs
//  1. famille REA dif-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits,
//     on compare à la réponse attendue (0,5 %) et à la correction, et on mesure le pire écart d'un élève qui garde 3 chiffres significatifs puis arrondit à 2 (la tolérance de 6 % doit l'accepter) ;
//     les pièges proposés restent hors de la tolérance (au moins 8 %) et il en reste au moins 2 par question.
//  2. QCM (parcours, ANA, VAL, libellés des S'APP) : la bonne réponse n'est jamais la plus longue (texte rendu), et n'est pas systématiquement la plus courte.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './difQcm.js';

const serveur = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'dif-calcul'); assert.ok(fam, 'famille dif-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/−/g, '-');
  const num = s => Number(String(s).replace(/ /g, '').replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 220)} »`); return m; };
  const sig = (x, k) => Number(Number(x).toPrecision(k));
  // nombre écrit « 5,32 × 10⁻³ » ou « 0,0213 » ou « 21,3 » dans la correction : on lit le dernier nombre suivi de l'unité
  const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const lire = (t, u) => { const re = new RegExp(`(\\d[\\d ]*(?:,\\d+)?)(?: × 10(⁻?[${SUPS}]+))? ${u}`, 'g'); let m, last; while ((m = re.exec(t))) last = m; assert.ok(last, `pas de « ${u} » dans ${t}`);
    const e = last[2] ? Number(last[2].replace('⁻', '-').split('').map(c => (SUPS.includes(c) ? SUPS.indexOf(c) : c)).join('')) : 0; return num(last[1]) * 10 ** e; };
  const pire = [0, 0, 0, 0]; let minPieges = 9;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions;
    for (const q of ex.questions) { assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges (${q.pieges.length})`); minPieges = Math.min(minPieges, q.pieges.length); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`); assert.ok(q.tolRel >= 0.05, 'tolérance < 5 %'); }
    // q1 : θ = λ / a
    let t = texte(q1.q);
    const l1 = num(exact(/λ = (\d+) nm/, t, 'λ1')[1]), a1 = num(exact(/a = (\d+) µm/, t, 'a1')[1]), th1 = l1 * 1e-9 / (a1 * 1e-6);
    assert.ok(rel(th1, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${th1}`);
    let c = texte(q1.expl); assert.ok(rel(lire(c, 'rad'), th1) < 0.005, `q1 expl : ${c}`);
    for (const k of [3, 4]) pire[0] = Math.max(pire[0], rel(sig(sig(l1 * 1e-9, k) / sig(a1 * 1e-6, k), 2), th1));
    // q2 : L = 2 λ D / a
    t = texte(q2.q);
    const l2 = num(exact(/λ = (\d+) nm/, t, 'λ2')[1]), a2 = num(exact(/a = (\d+) µm/, t, 'a2')[1]), D2 = num(exact(/D = ([\d,]+) m/, t, 'D2')[1]), L2 = 2 * l2 * 1e-9 * D2 / (a2 * 1e-6) * 1e3;
    assert.ok(rel(L2, q2.vrai) < 0.005, `q2 : attendu ${q2.vrai}, texte donne ${L2}`);
    c = texte(q2.expl); assert.ok(rel(lire(c, 'mm'), L2) < 0.005, `q2 expl : ${c}`);
    for (const k of [3, 4]) pire[1] = Math.max(pire[1], rel(sig(sig(2 * sig(l2 * 1e-9, k) * D2 / sig(a2 * 1e-6, k), k) * 1e3, 2), L2));
    // q3 : a = 2 λ D / L
    t = texte(q3.q);
    const l3 = num(exact(/λ = (\d+) nm/, t, 'λ3')[1]), D3 = num(exact(/D = ([\d,]+) m/, t, 'D3')[1]), L3 = num(exact(/L = ([\d,]+) mm/, t, 'L3')[1]), a3 = 2 * l3 * 1e-9 * D3 / (L3 * 1e-3) * 1e6;
    assert.ok(rel(a3, q3.vrai) < 0.005, `q3 : attendu ${q3.vrai}, texte donne ${a3}`);
    c = texte(q3.expl); assert.ok(rel(lire(c, 'µm'), a3) < 0.005, `q3 expl : ${c}`);
    assert.ok(L3 >= 6 && L3 <= 80, `L3 = ${L3}`);
    for (const k of [3, 4]) pire[2] = Math.max(pire[2], rel(sig(sig(2 * sig(l3 * 1e-9, k) * D3, k) / sig(L3 * 1e-3, k) * 1e6, 2), a3));
    // q4 : λ = v / f, θ = λ / a
    t = texte(q4.q);
    const f4 = num(exact(/f = (\d+) Hz/, t, 'f4')[1]), a4 = num(exact(/a = ([\d,]+) m/, t, 'a4')[1]), lam4 = 340 / f4, th4 = lam4 / a4;
    assert.ok(rel(th4, q4.vrai) < 0.005, `q4 : attendu ${q4.vrai}, texte donne ${th4}`); assert.ok(th4 <= 0.3 + 1e-9 && Math.abs(Math.asin(th4) / th4 - 1) < 0.02, 'petit angle');
    c = texte(q4.expl); assert.ok(rel(lire(c, 'rad'), th4) < 0.005, `q4 expl : ${c}`);
    for (const k of [3, 4]) pire[3] = Math.max(pire[3], rel(sig(sig(340 / f4, k) / a4, 2), th4));
    for (const q of ex.questions) assert.ok(/\d/.test(texte(q.q)) && !/_/.test(texte(q.q)) && !/_/.test(texte(q.expl)) && !/÷/.test(texte(q.q) + texte(q.expl)), 'souligné ou ÷ brut : ' + texte(q.q).slice(0, 80) + ' // ' + texte(q.expl));
  }
  for (const [k, p] of pire.entries()) assert.ok(p < 0.06, `question ${k + 1} : pire écart d'arrondi ${p} ≥ 6 %`);
  // ---------- QCM : longueurs des options (texte rendu) ----------
  const verifQcm = (nom, opts, bonne) => { const l = opts.map(o => (typeof o === 'string' ? o : texte(o)).length); const b = l[bonne]; assert.ok(b < Math.max(...l), `${nom} : la bonne réponse est la plus longue (${l.join(' ')})`); return b === Math.min(...l); };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifQcm('parcours ' + k, q.options, q.bonne)) courtes++; }
  const exportsAna = Object.values(ana).flat().filter(x => x && typeof x === 'object' && /^dif-ana/.test(x.id || ''));
  const exportsVal = Object.values(val).flat().filter(x => x && typeof x === 'object' && /^dif-val/.test(x.id || ''));
  assert.equal(exportsAna.length, 3, `3 ANA attendus (${exportsAna.length})`); assert.equal(exportsVal.length, 2, `2 VAL attendus (${exportsVal.length})`);
  let c2 = 0, c3 = 0;
  for (const it of exportsAna) { const l = it.options.map(o => o[0].length), bi = it.options.findIndex(o => o[1]); assert.ok(l[bi] < Math.max(...l), `${it.id} : bonne réponse la plus longue (${l.join(' ')})`); if (l[bi] === Math.min(...l)) c2++; assert.ok(!/_/.test(JSON.stringify(it)) && !/÷/.test(JSON.stringify(it)), it.id); }
  for (const it of exportsVal) { const l = it.options.map(o => o[0].length), bi = it.options.findIndex(o => o[1]); assert.ok(l[bi] < Math.max(...l), `${it.id} : bonne réponse la plus longue (${l.join(' ')})`); if (l[bi] === Math.min(...l)) c3++; assert.ok(!/_/.test(JSON.stringify(it)) && !/÷/.test(JSON.stringify(it)), it.id); }
  const sapp = don.ENONCES.filter(e => /^dif-sapp/.test(e.id)); assert.equal(sapp.length, 1);
  let c4 = 0, n4 = 0;
  for (let i = 0; i < 400; i++) for (let q = 0; q < 2; q++) { const b = sapp[0].build(sapp[0].gen(), q), l = [b.cherche.bonne, ...b.cherche.faux].map(x => x.length); assert.ok(l[0] < Math.max(...l), `${sapp[0].id}.${q} : libellé « cherche » le plus long (${l.join(' ')})`); n4++; if (l[0] === Math.min(...l)) c4++; }
  // valeurs du S'APP : θ et L cohérents avec le modèle
  for (let i = 0; i < 500; i++) { const p = sapp[0].gen(); for (const q of [0, 1]) { const b = sapp[0].build(p, q); const exact = q === 0 ? p.lam * 1e-9 / (p.a * 1e-6) : 2 * p.lam * 1e-9 * p.D / (p.a * 1e-6) * 1e3; assert.ok(rel(b.solution.val, exact) < 1e-9, 'solution S\'APP'); } }
  console.log(`difExercices : REA OK (pires écarts d'un élève qui garde 3 chiffres significatifs puis arrondit à 2 : ${pire.map(p => (100 * p).toFixed(2) + ' %').join(', ')} ; pièges restants au minimum ${minPieges}) ; QCM parcours : ${courtes}/${total} bonnes réponses les plus courtes ; ANA : ${c2}/3 les plus courtes ; VAL : ${c3}/2 ; libellés S'APP : ${c4}/${n4}`);
} finally { await serveur.close(); }
