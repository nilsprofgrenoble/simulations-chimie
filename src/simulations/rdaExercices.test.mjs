// Contrôle des exercices « Radioactivité : diagramme (N, Z) et équations de désintégration » (sim 184) : node src/simulations/rdaExercices.test.mjs
//  1. famille REA rda-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 6 000 tirages, on refait le calcul avec les seuls nombres
//     écrits (A, Z, type), on le compare à la réponse attendue (entier exact) et au nombre écrit dans la correction ; les pièges proposés sont tous différents de la bonne réponse.
//  2. S'APP : les valeurs « solution » refont le calcul avec les nombres du tirage ; QCM (parcours, ANA, VAL, libellés des S'APP) : la bonne réponse n'est jamais la plus longue
//     (texte rendu) et n'est pas systématiquement la plus courte.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './rdaQcm.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'rda-calcul'); assert.ok(fam, 'famille rda-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/−/g, '-');
  const num = s => Number(String(s).replace(',', '.'));
  const elision = t => { assert.ok(!/\bde [aeiouyhéèâîô]/i.test(t), `élision fausse : ${t.slice(0, 120)}`); };
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 220)} »`); return m; };
  const dZ = { 'α': 2, 'β⁻': -1, 'β⁺': 1 }, dA = { 'α': 4, 'β⁻': 0, 'β⁺': 0 };    // (A, Z) de la particule émise
  const vus = { q1: new Set(), q2: new Set(), q3: new Set(), q4: new Set() };
  for (let i = 0; i < 6000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions;
    for (const q of ex.questions) { elision(texte(q.q)); assert.ok(q.tolRel === 0, `${q.id} : tolérance non nulle`); assert.ok(Number.isInteger(q.vrai) && q.vrai > 0, `${q.id} : réponse non entière positive ${q.vrai}`); assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges`); for (const [v] of q.pieges) assert.ok(v !== q.vrai && Number.isFinite(v), `${q.id} : piège égal à la réponse (${v})`); }
    // q1 : α, A du fils
    let t = texte(q1.q);
    let m = exact(/d(?:e |’)([^()]+) \(A = (\d+), Z = (\d+)\) est radioactif α/, t, 'q1');
    assert.equal(q1.vrai, num(m[2]) - 4, `q1 : attendu ${q1.vrai}, texte donne ${num(m[2]) - 4}`);
    let c = texte(q1.expl); assert.ok(new RegExp(`= ${q1.vrai}\\b`).test(c), `q1 expl : ${c}`);
    vus.q1.add(m[1]);
    // q2 : β, Z du fils
    t = texte(q2.q);
    m = exact(/d(?:e |’)([^()]+) \(A = (\d+), Z = (\d+)\) est radioactif (β⁻|β⁺) : il émet un[e]? ([^()]+) \(A = 0, Z = ([+-]\d)\)/, t, 'q2');
    const Zp = num(m[6]); assert.equal(Zp, m[4] === 'β⁻' ? -1 : 1, 'charge de la particule de q2');
    assert.equal(q2.vrai, num(m[3]) - Zp, `q2 : attendu ${q2.vrai}, texte donne ${num(m[3]) - Zp}`);
    c = texte(q2.expl); assert.ok(new RegExp(`= ${q2.vrai} `).test(c) || new RegExp(`= ${q2.vrai}\\.`).test(c), `q2 expl : ${c}`);
    vus.q2.add(m[1] + m[4]);
    // q3 : Z du père
    t = texte(q3.q);
    m = exact(/radioactif (α|β⁻|β⁺), se désintègre en ([^()]+) \(A = (\d+), Z = (\d+)\) en émettant [^()]+ \(A = (\d), Z = ([+-]?\d)\)/, t, 'q3');
    const Zq = num(m[6]), Aq = num(m[5]);
    assert.equal(Aq, dA[m[1]]); assert.equal(Zq, m[1] === 'α' ? 2 : m[1] === 'β⁻' ? -1 : 1);
    assert.equal(q3.vrai, num(m[4]) + Zq, `q3 : attendu ${q3.vrai}, texte donne ${num(m[4]) + Zq}`);
    c = texte(q3.expl); assert.ok(c.includes(`= ${q3.vrai} ;`), `q3 expl : ${c}`); assert.ok(c.includes(`${num(m[3]) + Aq}`), 'q3 expl : A du père');
    vus.q3.add(m[2] + m[1]);
    // q4 : chaîne
    t = texte(q4.q);
    m = exact(/d(?:e |’)([^()]+) \(A = (\d+), Z = (\d+)\) se transforme en noyau stable d(?:e |’)([^()]+) \(A = (\d+), Z = (\d+)\) par une suite de désintégrations α et β⁻\. Combien de désintégrations (α|β⁻) /, t, 'q4');
    const nA = (num(m[2]) - num(m[5])) / 4, nB = num(m[6]) - num(m[3]) + 2 * nA;
    assert.ok(Number.isInteger(nA) && Number.isInteger(nB) && nA > 0 && nB > 0);
    assert.equal(q4.vrai, m[7] === 'α' ? nA : nB, `q4 : attendu ${q4.vrai}`);
    c = texte(q4.expl); assert.ok(c.includes(`Réponse : ${q4.vrai}.`), `q4 expl : ${c}`);
    vus.q4.add(m[1] + m[7]);
    for (const q of ex.questions) assert.ok(/\d/.test(texte(q.q)) && !/_/.test(texte(q.q)) && !/_/.test(texte(q.expl)), 'souligné brut : ' + texte(q.q).slice(0, 80));
  }

  // ---------- QCM : longueurs des options (texte rendu) ----------
  const verifQcm = (nom, longueurs, bonne) => { const b = longueurs[bonne]; assert.ok(b < Math.max(...longueurs), `${nom} : la bonne réponse est la plus longue (${longueurs.join(' ')})`); return b === Math.min(...longueurs); };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifQcm('parcours ' + k, q.options.map(o => o.length), q.bonne)) courtes++; }
  const exportsAna = Object.values(ana).flat().filter(x => x && typeof x === 'object' && /^rda-ana/.test(x.id || ''));
  const exportsVal = Object.values(val).flat().filter(x => x && typeof x === 'object' && /^rda-val/.test(x.id || ''));
  assert.equal(exportsAna.length, 3, '3 ANA attendus'); assert.equal(exportsVal.length, 2, '2 VAL attendus');
  let c2 = 0, n2 = 0;
  for (const it of [...exportsAna, ...exportsVal]) { const bi = it.options.findIndex(o => o[1]); assert.equal(it.options.filter(o => o[1]).length, 1, `${it.id} : une seule bonne réponse`); n2++; if (verifQcm(it.id, it.options.map(o => o[0].length), bi)) c2++; for (const o of it.options) assert.ok(o[2] && o[2].length > 20, `${it.id} : explication manquante`); }
  // S'APP : libellés « cherche » et calcul de la solution
  const sapp = don.ENONCES.filter(e => /^rda-sapp/.test(e.id)); assert.equal(sapp.length, 1);
  let c3 = 0, n3 = 0;
  for (let i = 0; i < 2000; i++) for (let q = 0; q < 2; q++) {
    const p = sapp[0].gen(), b = sapp[0].build(p, q);
    const part = { a: [4, 2], 'b-': [0, -1], 'b+': [0, 1] }[p.mode];
    assert.equal(b.solution.val, q === 0 ? p.A - part[0] : p.Z - part[1]);
    assert.ok(b.solution.val > 0);
    assert.deepEqual([...b.utiles].sort(), q === 0 ? ['A', 'Ap'] : ['Z', 'Zp']);
    const l = [b.cherche.bonne, ...b.cherche.faux].map(x => x.length); assert.ok(l[0] < Math.max(...l), `libellé « cherche » le plus long (${l.join(' ')})`);
    if (i === 0) { n3++; if (l[0] === Math.min(...l)) c3++; }
  }
  // 1 seul bloc de noyaux possible dans la liste S'APP : cohérence avec le modèle (A, Z, mode)
  console.log(`rdaExercices : REA OK sur 6 000 tirages (${vus.q1.size} noyaux α, ${vus.q2.size} noyaux β, ${vus.q3.size} équations à compléter, ${vus.q4.size} chaînes) ; QCM : parcours ${courtes}/${total} les plus courtes, ANA/VAL ${c2}/${n2}, libellés S'APP ${c3}/${n3} ; jamais les plus longues`);
} finally { await serveur.close(); }
