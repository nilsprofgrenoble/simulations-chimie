// Contrôle des exercices et des QCM de la simulation 173 : node src/simulations/polymeresTirages.test.mjs
//  1. famille REA pol-calcul : 5 000 tirages, on RELIT le texte affiché, on refait le calcul avec les seuls nombres écrits, on compare à la réponse attendue ; pièges hors tolérance.
//  2. S'APP pol-sapp-pvc : solutions refaites.
//  3. QCM (parcours, ANA, VAL) : la bonne réponse n'est jamais la plus longue (longueurs du texte rendu) et n'est pas systématiquement la plus courte.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './polymeresQcm.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'pol-calcul'); assert.ok(fam, 'famille pol-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/&#x27;/g, '’').replace(/\s+/g, ' ');
  const num = s => Number(String(s).replace(',', '.').replace(/ /g, ''));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 250)} »`); return m; };
  const IND = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
  const brute = f => { const c = {}; for (const m of f.matchAll(/(Cl|C|H)([₀-₉]*)/g)) c[m[1]] = (c[m[1]] || 0) + (m[2] ? Number([...m[2]].map(x => IND[x]).join('')) : 1); return c; };
  const MOTIFS = { 'polyéthylène': 'C₂H₄', 'poly(chlorure de vinyle)': 'C₂H₃Cl', 'polypropylène': 'C₃H₆', 'polystyrène': 'C₈H₈' };
  const SEG = { 'poly(chlorure de vinyle)': '–CH₂–CHCl–CH₂–CHCl–CH₂–CHCl–', 'polypropylène': '–CH₂–CH(CH₃)–CH₂–CH(CH₃)–CH₂–CH(CH₃)–', 'polystyrène': '–CH₂–CH(C₆H₅)–CH₂–CH(C₆H₅)–CH₂–CH(C₆H₅)–' };
  const Mmot = b => 12 * (b.C || 0) + (b.H || 0) + 35.5 * (b.Cl || 0);
  let n = 0; const vus = new Set();
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions; n++;
    // q1 : motif lu sur un segment de trois motifs ; on retrouve le motif par le texte et on compte ses C
    let t = texte(q1.q); const nomS = Object.keys(SEG).find(k => t.includes(`segment de chaîne de ${k} :`)); assert.ok(nomS, `q1 nom : ${t}`);
    const segTxt = exact(/: (–[^ ]+–)\. Un même motif/, t, 'segment')[1]; assert.equal(segTxt, SEG[nomS], 'q1 : segment affiché ≠ attendu');
        const atomesSeg = SEG[nomS].split('–').filter(Boolean);                  // groupes successifs : CH₂, CHCl, CH₂, CHCl, ...
    assert.equal(atomesSeg.length, 6, 'q1 : 6 groupes de chaîne');
    assert.deepEqual(atomesSeg.slice(0, 2), atomesSeg.slice(2, 4)); assert.deepEqual(atomesSeg.slice(0, 2), atomesSeg.slice(4, 6), 'q1 : segment = 3 motifs identiques');
    const cMotif = atomesSeg.slice(0, 2).reduce((acc, g) => acc + (brute(g.replace(/\(([^)]+)\)/g, '$1')).C || 0), 0);
    assert.equal(cMotif, q1.vrai, `q1 : ${q1.vrai} ≠ ${cMotif} (${atomesSeg.slice(0, 2)})`); assert.ok(!/PE|polyéthylène/.test(t));
    assert.ok(/néglige les extrémités/.test(t), 'q1 : hypothèse des extrémités absente');
    // q2 : atomes de carbone = n × C du motif
    t = texte(q2.q); const nom1 = Object.keys(MOTIFS).find(k => t.includes(`Le ${k} a pour motif`)); assert.ok(nom1, `q2 nom : ${t}`);
    const b1 = brute(exact(/formule brute ([^)]+)\)/, t, 'brute1')[1]); assert.deepEqual(b1, brute(MOTIFS[nom1]), 'q2 : motif et brute différents');
    const N1 = num(exact(/n = ([\d ]+) motifs/, t, 'n1')[1]); assert.equal(N1 * b1.C, q2.vrai, `q2 : ${q2.vrai} ≠ ${N1 * b1.C}`);
    assert.ok(/néglige les extrémités/.test(t), 'q2 : hypothèse des extrémités absente');
    let c = texte(q2.expl); assert.ok(c.includes(`= ${String(q2.vrai).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} atomes de carbone`), `q2 expl : ${c}`);
    // q3 : M(chaîne) = n × M(motif)
    t = texte(q3.q); const M3 = num(exact(/masse molaire de ([\d,]+) g·mol⁻¹/, t, 'M3')[1]), N3 = num(exact(/n = ([\d ]+) motifs/, t, 'n3')[1]);
    assert.ok(rel(M3 * N3, q3.vrai) < 1e-9, `q3 : ${q3.vrai} ≠ ${M3 * N3}`);
    assert.ok(Object.values(MOTIFS).some(b => Mmot(brute(b)) === M3), `q3 : masse du motif ${M3} inconnue`);
    assert.ok(/^Pour aller plus loin/.test(t) && /néglige les extrémités/.test(t), 'q3 : mention « pour aller plus loin » ou hypothèse absente');
    // 2 chiffres significatifs : la réponse arrondie reste juste à 5 %
    assert.ok(rel(Number(q3.vrai.toPrecision(2)), q3.vrai) <= 0.05, 'q3 arrondi 2 CS hors tolérance');
    // q4 : n = M(chaîne) / M(motif)
    t = texte(q4.q); const Mm4 = num(exact(/masse molaire du motif ([\d,]+) g·mol⁻¹/, t, 'Mm4')[1]), Mc4 = num(exact(/moyenne de chaîne de ([\d ]+) g·mol⁻¹/, t, 'Mc4')[1]);
    assert.equal(Number.isInteger(Mc4 / Mm4), true, 'q4 : rapport non entier'); assert.equal(Mc4 / Mm4, q4.vrai);
    assert.ok(/^Pour aller plus loin/.test(t) && /néglige les extrémités/.test(t), 'q4 : mention ou hypothèse absente');
    assert.ok(rel(Number(q4.vrai.toPrecision(2)), q4.vrai) <= 0.05, 'q4 arrondi hors tolérance');
    assert.ok(!/g\/mol/.test(t + texte(q3.q) + texte(q3.expl)), 'unité g/mol : utiliser g·mol⁻¹');
    // pièges : hors tolérance (× 1,5, plancher 2 %), distincts, finis
    for (const q of [q1, q2, q3, q4]) {
      const seuil = Math.max(1.5 * q.tolRel, 0.02);
      for (const [v] of q.pieges) { assert.ok(isFinite(v) && rel(v, q.vrai) > seuil, `piège ${v} trop proche de ${q.vrai} (${q.id})`); }
      assert.ok(q.pieges.length >= 2, `${q.id} : trop peu de pièges (${q.pieges.length})`);
      assert.ok(!/÷|\^|_/.test(texte(q.q) + texte(q.aide) + texte(q.expl)), `caractère interdit ${q.id}`);
      vus.add(`${q.id}:${q.pieges.length}`);
    }
    assert.ok(q3.tolRel >= 0.05 && q4.tolRel >= 0.05, 'tolérances ≥ 5 %');
  }
  console.log(`REA pol-calcul : ${n} tirages relus sur le texte affiché`);

  // --- S'APP
  const sapp = don.ENONCES.find(e => e.id === 'pol-sapp-pvc'); assert.ok(sapp);
  for (let i = 0; i < 2000; i++) {
    const p = sapp.gen(), b0 = sapp.build(p, 0), b1 = sapp.build(p, 1);
    assert.equal(b0.solution.val, 2 * 12 + 3 * 1 + 35.5); assert.ok(!/g\/mol/.test(JSON.stringify([b0, b1])), 'S’APP : g·mol⁻¹ attendu'); assert.equal(b1.solution.val, p.n);
    assert.ok(Number.isInteger(p.n * 62.5), 'M entière');
    for (const b of [b0, b1]) { const cites = new Set(b.texte.filter(x => x && x.t).map(x => x.t)); assert.deepEqual([...cites].sort(), Object.keys(b.tokens).sort(), 'chaque donnée est citée'); for (const k of cites) if (!b.utiles.includes(k)) assert.ok(b.raisons[k], `raison manquante ${k}`); }
    for (const b of [b0, b1]) { const L = [b.cherche.bonne, ...b.cherche.faux].map(x => [...x].length); assert.ok(L[0] < Math.max(...L), `S'APP : bonne la plus longue ${L}`); }
  }
  console.log('S’APP pol-sapp-pvc : solutions refaites sur 2 000 tirages');

  // --- longueurs des QCM
  const rendu = t => String(t).replace(/frac\(([^|]*)\|([^)]*)\)/g, '$1/$2').replace(/_/g, '');
  const rangs = [];
  const verif = (nom, opts, bonne) => {
    const L = opts.map(o => [...rendu(o)].length), lb = L[bonne], mx = Math.max(...L), mn = Math.min(...L);
    assert.ok(lb < mx, `${nom} : la bonne réponse est la plus longue (${L})`);
    rangs.push({ nom, plusCourte: lb === mn });
  };
  for (const [id, q] of Object.entries(QCM_PARCOURS)) verif(`parcours ${id}`, q.options, q.bonne);
  for (const e of ana.PREVOIR.filter(x => /^pol-/.test(x.id))) verif(`ANA ${e.id}`, e.options.map(o => o[0]), e.options.findIndex(o => o[1]));
  for (const e of val.PLAUSIBLES.filter(x => /^pol-/.test(x.id))) verif(`VAL ${e.id}`, e.options.map(o => o[0]), e.options.findIndex(o => o[1]));
  const nbCourtes = rangs.filter(r => r.plusCourte).length;
  assert.ok(nbCourtes <= Math.ceil(rangs.length / 2), `la bonne réponse est la plus courte dans ${nbCourtes}/${rangs.length} QCM`);
  console.log(`QCM : ${rangs.length} questions, la bonne réponse n'est jamais la plus longue ; la plus courte dans ${nbCourtes}`);
  // pas de « _ » dans les titres d'exercices
  for (const t of [...ana.PREVOIR.filter(x => /^pol-/.test(x.id)).map(x => x.titre), ...val.PLAUSIBLES.filter(x => /^pol-/.test(x.id)).map(x => x.titre), sapp.titre, fam.titre]) assert.ok(!/_/.test(t), `« _ » dans le titre ${t}`);
  console.log('Titres sans « _ » : OK');
} finally { await serveur.close(); }
