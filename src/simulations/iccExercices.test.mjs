// Contrôle des exercices « Incertitudes-types composées et comparaison à une valeur de référence » (sim 185) : node src/simulations/iccExercices.test.mjs
//  1. famille REA icc-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits,
//     on compare à la réponse attendue (0,5 %) et à la correction, on mesure le pire écart d'un élève qui garde 3 ou 4 chiffres significatifs puis arrondit à 2 (la tolérance de 5 % doit l'accepter) ;
//     les pièges restent hors de la tolérance (au moins 8 %) et il en reste au moins 2 par question ; aucun « _ » brut dans le texte affiché.
//  2. QCM (parcours, ANA, VAL, libellés des S'APP) : la bonne réponse n'est jamais la plus longue.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './iccQcm.js';

const serveur = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'icc-calcul'); assert.ok(fam, 'famille icc-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/−/g, '-');
  const num = s => Number(String(s).replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 220)} »`); return m; };
  const sig = (x, k) => Number(Number(x).toPrecision(k));
  const dernier = (t, u) => { const re = new RegExp(`(-?[\\d ]+(?:,\\d+)?) ${u}`, 'g'); let m, last; while ((m = re.exec(t))) last = m[1].replace(/ /g, ''); return num(last); };
  const pire = [0, 0, 0, 0]; let minPieges = 9;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions;
    for (const q of ex.questions) {
      assert.equal(q.tolRel, 0.05, `${q.id} : tolérance`);
      assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges`); minPieges = Math.min(minPieges, q.pieges.length);
      for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) >= 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const brut = texte(q.q) + ' ' + texte(q.expl); assert.ok(!/_/.test(brut), `${q.id} : souligné brut : ${brut.slice(0, 120)}`);
    }
    // q1 : différence de deux pesées
    let t = texte(q1.q);
    const a1 = num(exact(/u\(m₁\) = ([\d,]+) g/, t, 'u1')[1]), b1 = num(exact(/u\(m₂\) = ([\d,]+) g/, t, 'u2')[1]);
    let v = Math.sqrt(a1 * a1 + b1 * b1); assert.ok(rel(v, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${v}`);
    let c = texte(q1.expl);
    assert.ok(rel(num(exact(/= ([\d,]+) g, pour/, c, 'u(m) corrigé')[1]), v) < 0.04, `q1 expl : ${c}`);
    for (const k of [3, 4]) pire[0] = Math.max(pire[0], rel(sig(Math.sqrt(sig(a1 * a1, k) + sig(b1 * b1, k)), 2), v));
    // q2 : R = U/I
    t = texte(q2.q);
    const m2 = exact(/U = ([\d,]+) V avec u\(U\) = ([\d,]+) V et I = ([\d,]+) mA avec u\(I\) = ([\d,]+) mA/, t, 'q2'), [U, uU, I, uI] = m2.slice(1).map(num);
    const R = 1000 * U / I; v = R * Math.sqrt((uU / U) ** 2 + (uI / I) ** 2); assert.ok(rel(v, q2.vrai) < 0.005, `q2 : attendu ${q2.vrai}, texte donne ${v}`);
    c = texte(q2.expl); assert.ok(rel(dernier(c, 'Ω'), v) < 0.04, `q2 expl : ${c}`);
    for (const k of [3, 4]) { const r = sig(1000 * U / I, k), re = sig(Math.sqrt(sig((uU / U) ** 2, k) + sig((uI / I) ** 2, k)), k); pire[1] = Math.max(pire[1], rel(sig(r * re, 2), v)); }
    // q3 : cylindre
    t = texte(q3.q);
    const m3 = exact(/m = ([\d,]+) g \(u\(m\) = ([\d,]+) g\), diamètre d = ([\d,]+) cm \(u\(d\) = ([\d,]+) cm\) et hauteur h = ([\d,]+) cm \(u\(h\) = ([\d,]+) cm\)/, t, 'q3'), [m, um, dd, ud, h, uh] = m3.slice(1).map(num);
    const G = 4 * m / (Math.PI * dd * dd * h); v = G * Math.sqrt((um / m) ** 2 + (2 * ud / dd) ** 2 + (uh / h) ** 2); assert.ok(rel(v, q3.vrai) < 0.005, `q3 : attendu ${q3.vrai}, texte donne ${v}`);
    c = texte(q3.expl); assert.ok(rel(dernier(c, 'g/cm³'), v) < 0.04, `q3 expl : ${c}`);
    for (const k of [3, 4]) { const r = sig(G, k), re = sig(Math.sqrt(sig((um / m) ** 2, k) + sig((2 * ud / dd) ** 2, k) + sig((uh / h) ** 2, k)), k); pire[2] = Math.max(pire[2], rel(sig(r * re, 2), v)); }
    // q4 : quotient z
    t = texte(q4.q);
    const m4 = exact(/il trouve ([\d,]+) ± ([\d,]+) \S+ \(.*? est ([\d,]+) \S+, supposée/, t, 'q4'), [x, u4, ref] = m4.slice(1).map(num);
    v = Math.abs(x - ref) / u4; assert.ok(rel(v, q4.vrai) < 0.005, `q4 : attendu ${q4.vrai}, texte donne ${v}`);
    c = texte(q4.expl); assert.ok(Math.abs(num(exact(/= (\d+,\d+), (?:inférieur|supérieur)/, c, 'z corrigé')[1]) - v) < 0.006 + 1e-9, `q4 expl : ${c}`);
    pire[3] = Math.max(pire[3], rel(sig(v, 2), v));
  }
  for (const [k, p] of pire.entries()) assert.ok(p < 0.05, `question ${k + 1} : pire écart d'arrondi ${p} ≥ 5 %`);

  // ---------- QCM : longueurs des options (texte rendu) ----------
  const verifQcm = (nom, l, bonne) => { const b = l[bonne]; assert.ok(b < Math.max(...l), `${nom} : la bonne réponse est la plus longue (${l.join(' ')})`); };
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { assert.ok(q.options.length >= 3, k); verifQcm('parcours ' + k, q.options.map(o => o.length), q.bonne); }
  const tousAna = Object.values(ana).flat().filter(x => x && typeof x === 'object' && /^icc-ana/.test(x.id || ''));
  const tousVal = Object.values(val).flat().filter(x => x && typeof x === 'object' && /^icc-val/.test(x.id || ''));
  assert.equal(tousAna.length, 3, 'ANA'); assert.equal(tousVal.length, 2, 'VAL');
  for (const it of [...tousAna, ...tousVal]) { const l = it.options.map(o => o[0].length), bi = it.options.findIndex(o => o[1]); assert.ok(bi >= 0, it.id); verifQcm(it.id, l, bi); }
  const sapp = don.ENONCES.filter(e => /^icc-sapp/.test(e.id)); assert.equal(sapp.length, 2);
  let n4 = 0;
  for (const e of sapp) for (let i = 0; i < 300; i++) { const g = e.gen(); for (let q = 0; q < (e.questions || 2); q++) { let b; try { b = e.build(g, q); } catch (err) { break; } if (!b || !b.cherche) break; const l = [b.cherche.bonne, ...b.cherche.faux].map(x => x.length); verifQcm(`${e.id}.${q}`, l, 0); n4++; } }
  console.log(`iccExercices : REA OK (pires écarts d'arrondi : ${pire.map(p => (100 * p).toFixed(2) + ' %').join(', ')} ; pièges restants au minimum ${minPieges}) ; QCM : parcours, ${tousAna.length} ANA, ${tousVal.length} VAL, ${n4} libellés S'APP vérifiés`);
} finally { await serveur.close(); }
