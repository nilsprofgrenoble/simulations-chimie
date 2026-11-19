// Contrôle des exercices « Spectroscopie infrarouge, données tabulées » (sim 170) : node src/simulations/irTabExercices.test.mjs
//  1. famille REA irt-calcul : on RELIT le TEXTE AFFICHÉ sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits, on compare à la réponse attendue
//     (et à la correction affichée) ; pièges hors de la zone de tolérance ; comptage des lignes indépendant de l'arrondi de l'élève (pire cas d'arrondi).
//  2. S'APP irt-sapp-bande : solutions refaites.
//  3. QCM (parcours, ANA, VAL) : la bonne réponse n'est jamais la plus longue, et rarement la plus courte (longueurs du texte rendu).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './irTabQcm.js';
import * as M from './irTabModele.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'irt-calcul'); assert.ok(fam, 'famille irt-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/&#x27;/g, '’').replace(/\s+/g, ' ');
  const num = s => Number(String(s).replace(',', '.').replace(/ /g, ''));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 200)} »`); return m; };
  const LIGNES = [[1735, 1750], [1705, 1740], [1700, 1725], [1650, 1700], [1625, 1685]];
  const compte = s => LIGNES.filter(([a, b]) => s >= a && s <= b).length;

  assert.ok(rea.IRT_LAM.length >= 8, `IRT_LAM : ${rea.IRT_LAM.length} valeurs`);
  const comptes = new Set(rea.IRT_LAM.map(l => compte(1e4 / l)));
  assert.ok(comptes.has(1) && comptes.has(2), `les deux réponses 1 et 2 doivent être possibles : ${[...comptes]}`);
  let n = 0;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3] = ex.questions; n++;
    // q1 : σ = 10⁴ / λ
    let t = texte(q1.q); const l1 = num(exact(/longueur d’onde ([\d,]+) µm/, t, 'λ1')[1]);
    assert.ok(rel(1e4 / l1, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${1e4 / l1}`);
    let c = texte(q1.expl); assert.ok(c.includes(`${l1.toFixed(2).replace('.', ',')} × 10⁻⁴ cm`), `q1 expl : ${c}`);
    assert.ok(c.includes(`= ${Math.round(q1.vrai)} cm⁻¹`), `q1 expl résultat : ${c}`); assert.ok(!/\d \d{3}/.test(c), `q1 expl : séparateur dans un nombre à 4 chiffres : ${c}`);
    assert.ok(/\d,\d\d µm/.test(t), 'q1 : décimales perdues');
    // q2 : comptage des lignes, sur le texte affiché
    t = texte(q2.q); const l2 = num(exact(/lue à la longueur d’onde ([\d,]+) µm/, t, 'λ2')[1]);
    const bornes = [...t.matchAll(/(\d{4}) –\s?(\d{4})/g)].map(m => [Number(m[1]), Number(m[2])]);
    assert.deepEqual(bornes, LIGNES, `q2 : intervalles affichés ${JSON.stringify(bornes)}`);
    const s2 = 1e4 / l2;
    for (const sArr of [s2, Number(s2.toPrecision(3)), Math.round(s2), Number(s2.toPrecision(4))]) assert.equal(compte(sArr), q2.vrai, `q2 : arrondi ${sArr} (λ = ${l2}) change le comptage`);
    assert.ok(q2.vrai >= 1);
    c = texte(q2.expl); assert.ok(c.includes(`, soit ${q2.vrai}.`), `q2 expl : ${c}`);
    for (const [v] of q2.pieges) assert.notEqual(v, q2.vrai);
    // q3 : deux bandes en µm, combien dans 1705–1740 cm⁻¹ ?
    t = texte(q3.q); const ls = [...t.matchAll(/([\d,]+) µm/g)].map(m => num(m[1])); assert.equal(ls.length, 2, `q3 : λ lues ${ls}`);
    assert.ok(/1705 – 1740 cm⁻¹/.test(t), `q3 intervalle : ${t}`);
    const dans = ls.filter(l => { for (const sArr of [1e4 / l, Number((1e4 / l).toPrecision(3)), Math.round(1e4 / l)]) { assert.ok(Math.abs(sArr - 1705) > 8 && Math.abs(sArr - 1740) > 8, `q3 : ${l} trop près d'une borne`); } return 1e4 / l >= 1705 && 1e4 / l <= 1740; }).length;
    assert.equal(dans, q3.vrai, `q3 : attendu ${q3.vrai}, texte donne ${dans}`); assert.ok(q3.vrai >= 1);
    c = texte(q3.expl); assert.ok(c.includes(`Soit ${q3.vrai} bande`), `q3 expl : ${c}`); assert.ok(!/\d \d{3}/.test(c), `q3 expl séparateur : ${c}`);
    for (const l of ls) assert.ok(c.includes(`${l.toFixed(2).replace('.', ',')} µm donne σ = 1${l.toFixed(2).replace('.', ',')} × 10⁻⁴ = ${Math.round(1e4 / l)} cm⁻¹`), `q3 expl calcul : ${c}`);
    for (const [v] of q3.pieges) assert.notEqual(v, q3.vrai);
    for (const q of [q1, q2, q3]) { const a = texte(q.aide), r = texte(q.expl); assert.ok(!/÷/.test(a + r), `÷ résiduel : ${a} ${r}`); }
    // pièges : tous hors de la tolérance (5 %) × 1,5 et distincts de la bonne réponse
    for (const q of [q1]) for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.075, `piège ${v} trop proche de ${q.vrai}`);
    assert.ok(q1.pieges.length === 3, 'pièges conservés');
    // chiffres significatifs : la réponse arrondie à 3 chiffres reste juste à 5 % (pire cas d'arrondi ≈ 0,5 %)
    assert.ok(rel(Number(q1.vrai.toPrecision(3)), q1.vrai) < 0.01);
  }
  console.log(`REA irt-calcul : ${n} tirages relus sur le texte affiché ; ${rea.IRT_LAM.length} longueurs d'onde pour le comptage (réponses ${[...comptes].join(' et ')})`);

  // --- S'APP : solutions refaites
  const sapp = don.ENONCES.find(e => e.id === 'irt-sapp-bande'); assert.ok(sapp);
  for (let i = 0; i < 2000; i++) {
    const p = sapp.gen();
    const b0 = sapp.build(p, 0), b1 = sapp.build(p, 1);
    assert.ok(rel(b0.solution.val, 1e4 / p.lam) < 1e-9 && b0.solution.u === 'cm⁻¹');
    assert.equal(b1.solution.val, 100 - p.T);
    for (const b of [b0, b1]) { const cites = new Set(b.texte.filter(x => x && x.t).map(x => x.t)); assert.deepEqual([...cites].sort(), Object.keys(b.tokens).sort(), 'chaque donnée est citée'); }
    for (const b of [b0, b1]) { const L = [b.cherche.bonne, ...b.cherche.faux].map(x => [...x].length); assert.ok(L[0] < Math.max(...L), `S'APP cherche : bonne la plus longue ${L}`); assert.ok(L[0] > Math.min(...L), `S'APP cherche : bonne la plus courte ${L}`); }
    assert.deepEqual(b0.utiles, ['lam']); assert.deepEqual(b1.utiles, ['T']);
    for (const k of Object.keys(b0.tokens)) if (!b0.utiles.includes(k)) assert.ok(b0.raisons[k], `raison manquante ${k}`);
    for (const k of Object.keys(b1.tokens)) if (!b1.utiles.includes(k)) assert.ok(b1.raisons[k], `raison manquante ${k}`);
  }
  console.log('S’APP irt-sapp-bande : solutions refaites sur 2 000 tirages');

  // --- longueurs des QCM
  const rendu = t => String(t).replace(/frac\(([^|]*)\|([^)]*)\)/g, '$1/$2').replace(/_/g, '');
  const verifLongueurs = (id, textes, bonne) => {
    const L = textes.map(x => [...rendu(x)].length), b = L[bonne];
    assert.ok(b < Math.max(...L), `${id} : la bonne réponse est la plus longue (${L.join(', ')})`);
    return b === Math.min(...L);
  };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifLongueurs(`parcours ${k}`, q.options, q.bonne)) courtes++; }
  for (const it of ana.PREVOIR.filter(x => x.id.startsWith('irt-'))) { total++; if (verifLongueurs(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1]))) courtes++; }
  for (const it of val.PLAUSIBLES.filter(x => x.id.startsWith('irt-'))) { total++; if (verifLongueurs(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1]))) courtes++; }
  console.log(`QCM : ${total} questions, bonne réponse jamais la plus longue ; la plus courte dans ${courtes} cas`);
  assert.ok(courtes <= Math.floor(total / 3), 'la bonne réponse est trop souvent la plus courte');
} finally { await serveur.close(); }
console.log('irTabExercices : tous les contrôles passent');
