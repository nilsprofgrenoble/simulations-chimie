// Contrôle des exercices « Facteurs cinétiques, catalyse et choix d’un capteur » (sim 187) : node src/simulations/facteursCinExercices.test.mjs
//  1. famille REA cin-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits,
//     on compare à la réponse attendue (0,5 %) et à la correction, on mesure le pire écart d'un élève qui garde 3 ou 4 chiffres significatifs puis arrondit à 2 (la tolérance de 5 % doit l'accepter) ;
//     les pièges restent hors de la tolérance (au moins 8 %) et il en reste au moins 2 par question ; aucun « _ » brut dans le texte affiché.
//  2. QCM (parcours, ANA, VAL, libellés des S'APP) : la bonne réponse n'est jamais la plus longue ; S'APP : chaque donnée non utile a sa raison.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './facteursCinQcm.js';

const serveur = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'cin-calcul'); assert.ok(fam, 'famille cin-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/−/g, '-');
  const num = s => Number(String(s).replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 260)} »`); return m; };
  const sig = (x, k) => Number(Number(x).toPrecision(k));
  const pire = [0, 0, 0, 0]; let minPieges = 9;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions;
    assert.equal(ex.questions.length, 4);
    for (const q of ex.questions) {
      assert.equal(q.tolRel, 0.05, `${q.id} : tolérance`);
      assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges`); minPieges = Math.min(minPieges, q.pieges.length);
      for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) >= 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const brut = texte(q.q) + ' ' + texte(q.expl); assert.ok(!/_|÷|NaN|undefined/.test(brut), `${q.id} : texte suspect : ${brut.slice(0, 160)}`);
    }
    // q1 : température
    let t = texte(q1.q);
    const m1 = exact(/à (\d+) °C : son temps de demi-réaction vaut t½ = (\d+) min.*à (\d+) °C \(en min/, t, 'q1'), [T1, tA, T2] = m1.slice(1).map(num);
    let v = tA / Math.pow(2, (T2 - T1) / 10); assert.ok(rel(v, q1.vrai) < 1e-9, `q1 : attendu ${q1.vrai}, texte donne ${v}`);
    let c = texte(q1.expl); assert.ok(rel(num(exact(/= (\d+(?:,\d+)?) min\./, c, 'q1 corrigé')[1]), v) < 0.05, `q1 expl : ${c}`);
    pire[0] = Math.max(pire[0], rel(sig(v, 2), v));
    // q2 : concentration
    t = texte(q2.q);
    const m2 = exact(/est à (\d,\d+) mol·L⁻¹ : t½ = (\d+) min.*à (\d,\d+) mol·L⁻¹ \(même/, t, 'q2'), [c1, tB, c2] = m2.slice(1).map(num);
    v = tB * c1 / c2; assert.ok(rel(v, q2.vrai) < 1e-9, `q2 : attendu ${q2.vrai}, texte donne ${v}`);
    c = texte(q2.expl); assert.ok(rel(num(exact(/= (\d+(?:,\d+)?) min\./, c, 'q2 corrigé')[1]), v) < 0.05, `q2 expl : ${c}`);
    pire[1] = Math.max(pire[1], rel(sig(v, 2), v));
    // q3 : catalyseur, conversion
    t = texte(q3.q);
    const m3 = exact(/t½ = (\d+) min\. Avec un catalyseur, on mesure t½ = (\d+) s/, t, 'q3'), [a3, b3] = m3.slice(1).map(num);
    v = a3 * 60 / b3; assert.ok(rel(v, q3.vrai) < 1e-9, `q3 : attendu ${q3.vrai}, texte donne ${v}`);
    c = texte(q3.expl); assert.ok(rel(num(exact(/= (\d+(?:,\d+)?) :/, c, 'q3 corrigé')[1]), v) < 0.05, `q3 expl : ${c}`);
    pire[2] = Math.max(pire[2], rel(sig(v, 2), v));
    // q4 : concentration après n t½
    t = texte(q4.q);
    const m4 = exact(/concentration initiale (\d,\d+) mol·L⁻¹ et un temps de demi-réaction t½ = (\d+) min.*à la date t = (\d+) min/, t, 'q4'), [c0, th, tt] = m4.slice(1).map(num);
    assert.ok(Number.isInteger(tt / th), 'q4 : t / t½ non entier'); v = c0 / Math.pow(2, tt / th); assert.ok(rel(v, q4.vrai) < 1e-9, `q4 : attendu ${q4.vrai}, texte donne ${v}`);
    c = texte(q4.expl); assert.ok(rel(num(exact(/= (\d+(?:,\d+)?) mol·L⁻¹\./, c, 'q4 corrigé')[1]), v) < 0.05, `q4 expl : ${c}`);
    pire[3] = Math.max(pire[3], rel(sig(v, 2), v));
  }
  for (const [k, p] of pire.entries()) assert.ok(p < 0.05, `question ${k + 1} : pire écart d'arrondi ${p} ≥ 5 %`);

  // ---------- QCM : longueurs des options (texte rendu) ----------
  const verifQcm = (nom, l, bonne) => { const b = l[bonne]; assert.ok(b < Math.max(...l), `${nom} : la bonne réponse est la plus longue (${l.join(' ')})`); };
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { assert.ok(q.options.length >= 3, k); const lp = q.options.map(o => o.length); verifQcm('parcours ' + k, lp, q.bonne); assert.ok(lp[q.bonne] > Math.min(...lp), `parcours ${k} : la bonne réponse est la plus courte (${lp.join(' ')})`); }
  const tousAna = Object.values(ana).flat().filter(x => x && typeof x === 'object' && /^cin-ana/.test(x.id || ''));
  const tousVal = Object.values(val).flat().filter(x => x && typeof x === 'object' && /^cin-val/.test(x.id || ''));
  assert.equal(tousAna.length, 3, 'ANA'); assert.equal(tousVal.length, 2, 'VAL');
  for (const it of [...tousAna, ...tousVal]) { const l = it.options.map(o => o[0].length), bi = it.options.findIndex(o => o[1]); assert.ok(bi >= 0, it.id); verifQcm(it.id, l, bi); }
  for (const it of [...tousAna, ...tousVal]) assert.ok(!/÷/.test(JSON.stringify(it)), `${it.id} : « ÷ » dans le texte affiché`);
  const sapp = don.ENONCES.filter(e => /^cin-sapp/.test(e.id)); assert.equal(sapp.length, 2);
  let n4 = 0;
  for (const e of sapp) for (let i = 0; i < 300; i++) {
    const g = e.gen();
    for (let q = 0; q < 2; q++) {
      const b = e.build(g, q); assert.ok(b && b.cherche, `${e.id} q${q}`);
      const l = [b.cherche.bonne, ...b.cherche.faux].map(x => x.length); verifQcm(`${e.id}.${q}`, l, 0); n4++;
      const ids = Object.keys(b.tokens), cites = new Set(b.texte.filter(x => x && x.t).map(x => x.t));
      for (const id of cites) { assert.ok(b.utiles.includes(id) || b.raisons[id], `${e.id}.${q} : donnée ${id} sans raison`); }
      for (const id of b.utiles) assert.ok(cites.has(id), `${e.id}.${q} : donnée utile ${id} absente de l’énoncé`);
      assert.ok(!/÷/.test(JSON.stringify(b)), `${e.id}.${q} : « ÷ » dans le texte affiché`);
      assert.ok(isFinite(b.solution.val), `${e.id}.${q} : solution`);
      for (const tk of Object.values(b.tokens)) assert.ok(!/_|NaN|undefined/.test(tk.aff), `${e.id}.${q} : ${tk.aff}`);
      void ids;
    }
  }
  // sapp température : t2 cohérent avec la règle ×2 par 10 °C
  for (let i = 0; i < 200; i++) { const g = sapp[0].gen(); assert.ok(Math.abs(g.t1 / g.t2 - Math.pow(2, g.dT / 10)) < 1e-9, 'sapp température : rapport incohérent'); }
  console.log(`facteursCinExercices : REA OK (pires écarts d'arrondi : ${pire.map(p => (100 * p).toFixed(2) + ' %').join(', ')} ; pièges restants au minimum ${minPieges}) ; QCM : parcours, ${tousAna.length} ANA, ${tousVal.length} VAL, ${n4} libellés S'APP vérifiés`);
} finally { await serveur.close(); }
