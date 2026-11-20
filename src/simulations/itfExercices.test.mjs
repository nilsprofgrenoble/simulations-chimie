// Contrôle des exercices et des défis « Interférences de deux ondes » (sim 183) : node src/simulations/itfExercices.test.mjs
//  1. famille REA itf-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits,
//     on compare à la réponse attendue (0,5 %), à la correction, et on mesure le pire écart d'un élève qui arrondit ses intermédiaires (la tolérance de 5 % doit l'accepter) ;
//     les pièges proposés restent hors de la tolérance (au moins 8 %) et il en reste au moins 2 par question.
//  2. QCM (parcours, ANA, VAL, libellés des S'APP) : la bonne réponse n'est jamais la plus longue (texte rendu), et n'est pas systématiquement la plus courte.
//  3. Défis : tirages réalistes, réponse attendue atteignable à la tolérance près par un élève qui arrondit à 2 chiffres significatifs.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './itfQcm.js';
import * as M from './itfModele.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const com = await serveur.ssrLoadModule('/src/commun.jsx');
  const fam = rea.FAMILLES.find(f => f.id === 'itf-calcul'); assert.ok(fam, 'famille itf-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/−/g, '-');
  const rendu = s => texte(com.avecIndices(s));
  const num = s => Number(String(s).replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 220)} »`); return m; };
  const sig = (x, k) => Number(Number(x).toPrecision(k));
  const pire = [0, 0, 0, 0]; let minPieges = 9;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions;
    for (const q of ex.questions) { assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges (${q.pieges.length})`); minPieges = Math.min(minPieges, q.pieges.length); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`); }
    // q1 : retard
    let t = texte(q1.q);
    const a1 = num(exact(/r₁ = ([\d,]+) cm/, t, 'r1')[1]), a2 = num(exact(/r₂ = ([\d,]+) cm/, t, 'r2')[1]);
    const tau = (a2 - a1) * 1e-2 / 0.40 * 1e3;
    assert.ok(rel(tau, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${tau}`);
    let c = texte(q1.expl); assert.ok(rel(num(exact(/= ([\d,]+) ms/, c, 'τ expl')[1]), tau) < 0.005, `q1 expl : ${c}`);
    for (const k of [3, 4]) pire[0] = Math.max(pire[0], rel(sig(sig(sig(a2 - a1, k) * 1e-2, k) / 0.40 * 1e3, 2), tau));
    // q2 : déphasage
    t = texte(q2.q);
    const dl = num(exact(/δ = ([\d,]+) cm/, t, 'δ')[1]), lam = num(exact(/λ = ([\d,]+) cm/, t, 'λ')[1]);
    const dphi = 2 * Math.PI * dl / lam;
    assert.ok(rel(dphi, q2.vrai) < 0.005, `q2 : attendu ${q2.vrai}, texte donne ${dphi}`);
    c = texte(q2.expl); assert.ok(rel(num(exact(/= ([\d,]+) rad/, c, 'Δφ expl')[1]), dphi) < 0.005, `q2 expl : ${c}`);
    for (const k of [3, 4]) pire[1] = Math.max(pire[1], rel(sig(2 * sig(Math.PI, k) * sig(dl / lam, k), 2), dphi));
    // q3 : nombre de lignes
    t = texte(q3.q);
    const s3 = num(exact(/s = (\d+) cm/, t, 's')[1]), l3 = num(exact(/λ = ([\d,]+) cm/, t, 'λ3')[1]);
    const n3 = (() => { let n = 0; for (let k = -40; k <= 40; k++) if (Math.abs(k * l3) < s3 - 1e-9) n++; return n; })();
    assert.equal(n3, q3.vrai, `q3 : attendu ${q3.vrai}, texte donne ${n3} (s = ${s3}, λ = ${l3})`);
    c = texte(q3.expl); assert.equal(num(exact(/= (\d+) lignes/, c, 'n expl')[1]), n3, `q3 expl : ${c}`);
    const r3 = s3 / l3, fr = r3 - Math.floor(r3); assert.ok(fr > 0.15 && fr < 0.85, `s/λ = ${r3} proche d'un entier`); assert.ok(q3.vrai <= 9);
    // q4 : n-ième point de silence
    t = texte(q4.q);
    const f4 = num(exact(/fréquence (\d+) Hz/, t, 'f4')[1]), n4 = num(exact(/du (\d)(?:ᵉʳ|ᵉ) point/, t, 'n4')[1]);
    const d4 = (n4 - 0.5) * 340 / f4;
    assert.ok(rel(d4, q4.vrai) < 0.005, `q4 : attendu ${q4.vrai}, texte donne ${d4}`);
    c = texte(q4.expl); assert.ok(rel(num(exact(/= ([\d,]+) m \(bien/, c.trim(), 'δ expl')[1]), d4) < 0.005, `q4 expl : ${c}`);
    const a4 = num(exact(/a = ([\d,]+) m/, t, 'a4')[1]); assert.ok(d4 < a4 && a4 - d4 < 1.2, `q4 : δ = ${d4} doit être inférieure à a = ${a4}`);
    for (const k of [3, 4]) pire[3] = Math.max(pire[3], rel(sig(sig(n4 - 0.5, k) * sig(340 / f4, k), 2), d4));
    for (const q of ex.questions) { assert.ok(!/÷/.test(rendu(q.aide)), 'aide avec ÷ : ' + q.aide); for (const [, m] of q.pieges) assert.ok(!/÷/.test(rendu(m)), 'piège avec ÷ : ' + m); }
    for (const q of ex.questions) assert.ok(/\d/.test(texte(q.q)) && !/_/.test(texte(q.q)) && !/_/.test(texte(q.expl)) && !/÷|\^/.test(texte(q.expl)), 'souligné, ÷ ou ^ brut : ' + texte(q.q).slice(0, 80) + ' // ' + texte(q.expl));
  }
  for (const [k, p] of pire.entries()) if (k !== 2) assert.ok(p < 0.05, `question ${k + 1} : pire écart d'arrondi ${p} ≥ 5 %`);
  // ---------- QCM : longueurs des options (texte rendu) ----------
  const verifQcm = (nom, opts, bonne) => { const l = opts.map(o => rendu(o)); const b = l[bonne].length; assert.ok(b < Math.max(...l.map(x => x.length)), `${nom} : la bonne réponse est la plus longue (${l.map(x => x.length).join(' ')})`); return b === Math.min(...l.map(x => x.length)); };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifQcm('parcours ' + k, q.options, q.bonne)) courtes++; const l = q.options.map(o => rendu(o).length); assert.ok(l[q.bonne] > Math.min(...l), `parcours ${k} : la bonne réponse est la plus courte`); }
  const exportsAna = Object.values(ana).flat().filter(x => x && typeof x === 'object' && /^itf-ana/.test(x.id || ''));
  const exportsVal = Object.values(val).flat().filter(x => x && typeof x === 'object' && /^itf-val/.test(x.id || ''));
  assert.equal(exportsAna.length, 2); assert.equal(exportsVal.length, 2);
  let c2 = 0; for (const it of [...exportsAna, ...exportsVal]) { total++; const bi = it.options.findIndex(o => o[1]); assert.ok(bi >= 0 && it.options.filter(o => o[1]).length === 1, it.id + ' : une seule bonne réponse'); if (verifQcm(it.id, it.options.map(o => o[0]), bi)) { courtes++; c2++; } for (const o of it.options) assert.ok(o[2] && o[2].length > 20, it.id + ' : explication manquante'); }
  const sapp = don.ENONCES.filter(e => /^itf-sapp/.test(e.id)); assert.equal(sapp.length, 2);
  for (const e of sapp) for (let q = 0; q < 2; q++) for (let n = 0; n < 200; n++) {
    const p = e.gen(), b = e.build(p, q); total++; if (verifQcm(`${e.id}.${q}`, [b.cherche.bonne, ...b.cherche.faux], 0)) courtes++;
    for (const id of b.utiles) assert.ok(b.tokens[id], `${e.id}.${q} : donnée utile ${id} absente`);
    const textes = b.texte.filter(x => x && x.t).map(x => x.t); for (const id of Object.keys(b.tokens)) assert.ok(textes.includes(id), `${e.id}.${q} : donnée ${id} non citée`);
    for (const id of Object.keys(b.tokens)) assert.ok(b.utiles.includes(id) || b.raisons[id], `${e.id}.${q} : donnée inutile ${id} sans raison`);
    if (e.id === 'itf-sapp-cuve') { assert.ok(p.r2 - p.r1 < p.s, `δ ≥ s : ${p.r2 - p.r1} ≥ ${p.s}`); assert.ok(p.r1 > p.s); }
    if (e.id === 'itf-sapp-hp') { assert.ok(p.d2 - p.d1 < p.a, `δ ≥ a : ${p.d2 - p.d1} ≥ ${p.a}`); const r = (p.d2 - p.d1) / (340 / p.f); assert.ok(Math.abs(r * 2 - Math.round(r * 2)) < 1e-6, `δ/λ = ${r} ni entier ni demi-entier`); }
  }
  console.log(`itfExercices : REA OK (pires écarts d'arrondi ${pire.map(p => (100 * p).toFixed(2) + ' %').join(', ')} ; pièges restants au minimum ${minPieges}) ; QCM : ${courtes}/${total} bonnes réponses les plus courtes, jamais les plus longues`);
  // ---------- défis ----------
  // les textes de correction des défis se rendent sans erreur et sans « frac( » résiduel (une notation coupée en plusieurs morceaux faisait boucler l'affichage)
  for (let i = 0; i < 300; i++) {
    const c = M.COUPLES_LIGNES[i % M.COUPLES_LIGNES.length], tl = M.tirageLambda();
    for (const s of [M.solutionLignes({ s: c.s, lam: c.lam }), M.solutionLambda(tl)]) { const r = rendu(s); assert.ok(!/frac\(/.test(r), 'frac( résiduel : ' + r); renderToStaticMarkup(com.avecIndices(s)); }
  }
  for (const c of M.COUPLES_LIGNES) { const r = c.s / c.lam; assert.ok(r > 1.2 && Math.abs(r - Math.round(r)) > 0.15); const n = M.nbConstructives(c.s, c.lam); let m = 0; for (let k = -40; k <= 40; k++) if (Math.abs(k * c.lam) < c.s - 1e-9) m++; assert.equal(n, m); }
  let pireD = 0, nD = 0; const kvus = new Set();
  for (let i = 0; i < 20000; i++) {
    const t = M.tirageLambda();
    assert.ok(t.r2 > t.r1 && t.delta >= 1.4 && t.delta < t.s, JSON.stringify(t)); assert.ok(Math.abs(t.r2 - t.r1 - t.delta) < 1e-9); kvus.add(t.k);
    assert.ok(t.vrai >= 0.9 && t.vrai <= 3.6, `λ attendu hors plage : ${t.vrai}`);
    pireD = Math.max(pireD, rel(sig(t.vrai, 2), t.vrai)); nD++;
    // un élève qui calcule δ = r₂ − r₁ puis λ = δ / (k + ½) avec les données affichées retrouve la valeur attendue
    assert.ok(rel(t.delta / (t.k + 0.5), t.vrai) < 1e-9);
  }
  assert.ok(pireD < 0.06, `pire arrondi à 2 chiffres significatifs : ${pireD}`); assert.deepEqual([...kvus].sort(), [0, 1, 2]);
  console.log(`défis : ${nD} tirages « retrouver λ » (pire écart d'arrondi à 2 chiffres significatifs ${(100 * pireD).toFixed(2)} % < 6 %), ${M.COUPLES_LIGNES.length} couples « compter les lignes »`);
} finally { await serveur.close(); }
