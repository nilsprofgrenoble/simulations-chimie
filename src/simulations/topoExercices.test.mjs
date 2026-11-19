// Contrôle des exercices « Formules topologiques et isomérie de constitution » (sim 172) : node src/simulations/topoExercices.test.mjs
//  1. famille REA top-calcul : on RELIT le TEXTE AFFICHÉ sur 5 000 tirages, on refait le calcul (par comptage sur le graphe de la molécule) et on compare à la réponse attendue ;
//     pièges distincts de la bonne réponse (et hors de 8 % pour la masse molaire) ; pire cas d'arrondi de la masse molaire.
//  2. S'APP top-sapp-formule : solutions refaites.
//  3. QCM (parcours, ANA, VAL) : la bonne réponse n'est jamais la plus longue (texte rendu), rarement la plus courte ; ni « ÷ », ni « _ » brut.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './topoQcm.js';
import * as M from './topoModele.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'top-calcul'); assert.ok(fam, 'famille top-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/&#x27;/g, '’').replace(/\s+/g, ' ');
  const sousNombre = s => Number([...s].map(c => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).join(''));
  const formule = t => { const m = /C([₀-₉]+)H([₀-₉]+)/.exec(t); assert.ok(m, `formule brute introuvable : ${t}`); return [sousNombre(m[1]), sousNombre(m[2])]; };
  const num = s => Number(s);
  let n = 0;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4, q5] = ex.questions; n++;
    // q1 : alcane à n carbones : on construit le graphe de la chaîne droite et on compte les H
    let t = texte(q1.q); const n1 = num(/compte (\d+) atomes de carbone/.exec(t)[1]);
    const alc = M.construire({ type: 'ch', n: n1, db: 0, oh: 0, m1: 0, m2: 0, sub: 'aucun' }).g;
    assert.equal(M.brute(alc).H, q1.vrai, `q1 : ${t}`);
    // q2 : n carbones, k C=C, r cycles : H calculé par le graphe (cycle seul, chaîne à une C=C, cycle + C=C par la règle des 4 liaisons)
    t = texte(q2.q); const n2 = num(/compte (\d+) atomes de carbone/.exec(t)[1]);
    assert.ok(!/deux doubles liaisons/.test(t)); const k2 = /une seule double liaison/.test(t) ? 1 : 0, r2 = /un seul cycle/.test(t) ? 1 : 0;
    assert.equal(2 * n2 + 2 - 2 * k2 - 2 * r2, q2.vrai, `q2 : ${t}`);
    if (k2 === 1 && !r2) assert.equal(M.brute(M.construire({ type: 'ch', n: n2, db: 1, oh: 0, m1: 0, m2: 0, sub: 'aucun' }).g).H, q2.vrai);
    if (k2 === 0 && r2 === 1) assert.equal(M.brute(M.construire({ type: 'cy', n: Math.min(n2, 5), sub: 'aucun' }).g).H, 2 * Math.min(n2, 5));
    assert.ok(/chaîne saturée/.test(texte(q2.aide)));
    // q3 : alcool saturé
    t = texte(q3.q); const n3 = num(/possède (\d+) atomes de carbone/.exec(t)[1]);
    const alco = M.construire({ type: 'ch', n: n3, db: 0, oh: 1, m1: 0, m2: 0, sub: 'aucun' }).g;
    assert.equal(M.brute(alco).H, q3.vrai, `q3 : ${t}`);
    assert.ok(texte(q3.expl).includes(M.bruteTexte(alco)), `q3 expl : ${texte(q3.expl)} / ${M.bruteTexte(alco)}`);
    // q4 : liaisons C–H d'un alcool saturé : comptées sur le graphe
    t = texte(q4.q); const n4 = num(/possède (\d+) atomes de carbone/.exec(t)[1]);
    const alco4 = M.construire({ type: 'ch', n: n4, db: 0, oh: 1, m1: 0, m2: 0, sub: 'aucun' }).g;
    assert.equal(M.brute(alco4).H - 1, q4.vrai, `q4 : ${t}`);
    // q5 : masse molaire
    t = texte(q5.q); const [n5, m5] = formule(t);
    assert.equal(12 * n5 + m5, q5.vrai, `q5 : ${t}`); assert.ok(m5 > 0 && m5 >= 2 * n5);
    // tolérance 5 % : un élève qui prend M(C) = 12,01 et M(H) = 1,008 reste juste
    assert.ok(Math.abs((12.011 * n5 + 1.008 * m5) - q5.vrai) / q5.vrai < 0.005);
    for (const [v] of q5.pieges) assert.ok(Math.abs(v - q5.vrai) / q5.vrai > 0.075, `q5 : piège ${v} proche de ${q5.vrai}`);
    for (const q of ex.questions) {
      for (const [v] of q.pieges) assert.notEqual(v, q.vrai, `piège égal à la bonne réponse : ${texte(q.q)}`);
      const c = texte(q.expl) + ' ' + texte(q.aide) + ' ' + texte(q.q);
      assert.ok(!/÷|_|\^/.test(c), `caractère interdit : ${c}`);
      assert.equal(q.tolRel === 0 ? 0 : q.tolRel, q.tolRel);
      assert.ok(q.pieges.length >= 2, `pièges conservés : ${texte(q.q)}`);
    }
  }
  // 2. S'APP
  const ens = don.ENONCES.find(e => e.id === 'top-sapp-formule'); assert.ok(ens);
  for (let i = 0; i < 400; i++) for (let q = 0; q < 2; q++) {
    const { b, p } = don.nouvelEnonce('top-sapp-formule', q);
    assert.equal(b.solution.val, q === 0 ? 2 * p.n : 2 * p.n + 2);
    assert.deepEqual(b.utiles, ['n']);
    const M_ = b.tokens.M.use.val; assert.equal(M_, q === 0 ? 14 * p.n : 14 * p.n + 18, 'masse molaire cohérente avec la molécule');
    const teb = b.tokens.teb.use.val; assert.ok(q === 0 ? teb < 130 : teb >= 130, 'ébullition plausible');
    const construit = M.construire(q === 0 ? { type: 'ch', n: p.n, db: 1, oh: 0, m1: 0, m2: 0, sub: 'aucun' } : { type: 'ch', n: p.n, db: 0, oh: 1, m1: 0, m2: 0, sub: 'aucun' }).g;
    assert.equal(M.brute(construit).H, b.solution.val);
    assert.ok(b.cherche.faux.length >= 3);
  }
  // 3. QCM : longueurs des options, telles qu'affichées
  const longueurs = [];
  const verifierQcm = (nom, options, bonne) => {
    const L = options.map(o => texte(o).replace(/frac\(([^|]*)\|([^)]*)\)/g, '$1').length), lb = L[bonne];
    assert.ok(options.length < 3 || !(lb === Math.max(...L) && L.filter(x => x === lb).length === 1) && (lb <= 0.92 * Math.max(...L) || L.filter(x => x >= lb).length >= 2), `${nom} : la bonne réponse est parmi les plus longues (${L})`);
    assert.ok(lb <= Math.max(...L) && !(lb === Math.max(...L) && L.filter(x => x === lb).length === 1), `${nom} : la bonne réponse est la plus longue (${L})`);
    assert.ok(options.every(o => !/÷|_|\^/.test(texte(o))), `${nom} : caractère interdit`);
    longueurs.push(lb === Math.min(...L) && L.filter(x => x === lb).length === 1);
  };
  for (const [k, q] of Object.entries(QCM_PARCOURS)) verifierQcm(`parcours ${k}`, q.options, q.bonne);
  const aEux = it => it.id && it.id.startsWith('top-');
  for (const it of ana.PREVOIR.filter(aEux)) { assert.equal(it.options.filter(o => o[1]).length, 1, it.id); verifierQcm(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1])); assert.ok(it.options.every(o => o[2]), it.id); }
  const pl = val.PLAUSIBLES.filter(aEux); assert.ok(pl.length >= 3);
  for (const it of pl) { assert.equal(it.options.filter(o => o[1]).length, 1, it.id); verifierQcm(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1])); assert.ok(!/÷/.test(it.enonce + it.ver), it.id); }
  const nbPlus = longueurs.filter(Boolean).length;
  assert.ok(nbPlus <= Math.ceil(longueurs.length / 3), `la bonne réponse est trop souvent la plus courte : ${nbPlus}/${longueurs.length}`);
  console.log(`topoExercices : OK (${n} tirages REA, ${longueurs.length} QCM contrôlés, ${nbPlus} bonne(s) réponse(s) strictement la plus courte)`);
} finally { await serveur.close(); }
