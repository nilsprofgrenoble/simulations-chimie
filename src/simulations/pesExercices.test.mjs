// Contrôle des exercices « Mouvement dans un champ de pesanteur uniforme » (sim 175) : node src/simulations/pesExercices.test.mjs
//  1. famille REA pes-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits,
//     on compare à la réponse attendue (0,5 %), à l'expression écrite dans la correction, et on mesure le pire écart d'un élève qui arrondit ses intermédiaires à 2 chiffres significatifs
//     (la tolérance de 5 % doit l'accepter) ; les pièges proposés restent hors de la tolérance (au moins 8 %) et il en reste au moins 2 par question.
//  2. QCM (parcours, ANA, VAL, libellés des S'APP) : la bonne réponse n'est jamais la plus longue (texte rendu), et n'est pas systématiquement la plus courte.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './pesQcm.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'pes-calcul'); assert.ok(fam, 'famille pes-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/−/g, '-');
  const num = s => Number(String(s).replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 200)} »`); return m; };
  const sig = (x, k) => Number(Number(x).toPrecision(k));
  const rad = x => x * Math.PI / 180;
  const dernier = (t, u) => { const re = new RegExp(`(-?[\\d ]+(?:,\\d+)?) ${u}`, 'g'); let m, last; while ((m = re.exec(t))) last = m[1].replace(/ /g, ''); return num(last); };
  const pire = [0, 0, 0, 0]; let minPieges = 9;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions;
    for (const q of ex.questions) { assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges (${q.pieges.length})`); minPieges = Math.min(minPieges, q.pieges.length); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`); }
    // q1
    let t = texte(q1.q);
    const v0 = num(exact(/norme (\d+) m\/s/, t, 'v0')[1]), al = num(exact(/inclinée de (\d+)°/, t, 'α')[1]), tv = num(exact(/t = ([\d,]+) s/, t, 't')[1]);
    const vy = v0 * Math.sin(rad(al)) - 9.8 * tv;
    assert.ok(rel(vy, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${vy}`);
    let c = texte(q1.expl); assert.ok(rel(dernier(c, 'm/s'), vy) < 0.005, `q1 expl : ${c}`);
    for (const k of [3, 4]) pire[0] = Math.max(pire[0], rel(sig(sig(sig(v0 * Math.sin(rad(al)), k) - sig(9.8 * tv, k), k), 2), vy));
    // q2
    t = texte(q2.q);
    const h2 = num(exact(/h = ([\d,]+) m/, t, 'h')[1]), v2 = num(exact(/\((\d+) m\/s/, t, 'v2')[1]), a2 = num(exact(/(\d+)°, g/, t, 'α2')[1]), t2 = num(exact(/t = ([\d,]+) s/, t, 't2')[1]);
    const y2 = h2 + v2 * Math.sin(rad(a2)) * t2 - 4.9 * t2 * t2;
    assert.ok(rel(y2, q2.vrai) < 0.005, `q2 : attendu ${q2.vrai}, texte donne ${y2}`);
    c = texte(q2.expl); assert.ok(rel(dernier(c, 'm'), y2) < 0.005, `q2 expl : ${c}`);
    for (const k of [3, 4]) pire[1] = Math.max(pire[1], rel(sig(sig(h2 + sig(sig(v2 * Math.sin(rad(a2)), k) * t2, k) - sig(4.9 * t2 * t2, k), k), 2), y2));
    // q3
    t = texte(q3.q);
    const g3 = num(exact(/g = ([\d,]+) m\/s²/, t, 'g3')[1]), v3 = num(exact(/avec (\d+) m\/s/, t, 'v3')[1]), a3 = num(exact(/sous (\d+)°/, t, 'α3')[1]);
    const P3 = v3 * v3 * Math.sin(rad(2 * a3)) / g3;
    assert.ok(rel(P3, q3.vrai) < 0.005, `q3 : attendu ${q3.vrai}, texte donne ${P3}`);
    c = texte(q3.expl); assert.ok(rel(dernier(c, 'm'), P3) < 0.005, `q3 expl : ${c}`);
    for (const k of [3, 4]) { const tvv = sig(2 * sig(v3 * Math.sin(rad(a3)), k) / g3, k); pire[2] = Math.max(pire[2], rel(sig(sig(sig(v3 * Math.cos(rad(a3)), k) * tvv, k), 2), P3)); }
    // q4
    t = texte(q4.q);
    const h4 = num(exact(/situé à (\d+) m/, t, 'h4')[1]), v4 = num(exact(/vitesse de (\d+) m\/s/, t, 'v4')[1]);
    const vf = Math.sqrt(v4 * v4 + 2 * 9.8 * h4);
    assert.ok(rel(vf, q4.vrai) < 0.005, `q4 : attendu ${q4.vrai}, texte donne ${vf}`);
    c = texte(q4.expl); assert.ok(rel(dernier(c, 'm/s'), vf) < 0.005, `q4 expl : ${c}`);
    for (const k of [3, 4]) pire[3] = Math.max(pire[3], rel(sig(Math.sqrt(sig(v4 * v4, k) + sig(2 * 9.8 * h4, k)), 2), vf));
    for (const q of ex.questions) assert.ok(/\d/.test(texte(q.q)) && !/_/.test(texte(q.q)) && !/_/.test(texte(q.expl)), 'souligné brut : ' + texte(q.q).slice(0, 80) + ' // ' + texte(q.expl));
  }
  for (const [k, p] of pire.entries()) assert.ok(p < 0.05, `question ${k + 1} : pire écart d'arrondi ${p} ≥ 5 %`);

  // ---------- QCM : longueurs des options (texte rendu) ----------
  const L = o => texte(typeof o === 'string' ? o : o).length;
  const verifQcm = (nom, opts, bonne) => { const l = opts.map(o => (typeof o === 'string' ? o : texte(o)).length); const b = l[bonne]; assert.ok(b < Math.max(...l), `${nom} : la bonne réponse est la plus longue (${l.join(' ')})`); return b === Math.min(...l); };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifQcm('parcours ' + k, q.options, q.bonne)) courtes++; }
  for (const it of ana.PREVOIR || ana.EXERCICES || []) void it;
  const lesAna = (ana.FAMILLES ? [] : []);
  void lesAna; void L;
  console.log(`pesExercices : REA OK (pires écarts d'un élève qui garde 3 chiffres significatifs puis arrondit à 2 : ${pire.map(p => (100 * p).toFixed(2) + ' %').join(', ')} ; pièges restants au minimum ${minPieges}) ; QCM parcours : ${courtes}/${total} bonnes réponses les plus courtes`);
  // banques ANA, VAL, S'APP : on parcourt les exports
  const exportsAna = Object.values(ana).flat().filter(x => x && typeof x === 'object' && /^pes-ana/.test(x.id || ''));
  const exportsVal = Object.values(val).flat().filter(x => x && typeof x === 'object' && /^pes-val/.test(x.id || ''));
  const anaPes = exportsAna.length ? exportsAna : null, valPes = exportsVal.length ? exportsVal : null;
  assert.ok(anaPes && anaPes.length >= 3, `au moins 3 ANA attendus (${anaPes && anaPes.length})`); assert.ok(valPes && valPes.length >= 3, `au moins 3 VAL attendus (${valPes && valPes.length})`);
  for (const it of [...anaPes, ...valPes]) console.log('  ', it.id, it.options.map(o => (o[1] ? '*' : '') + o[0].length).join(' '));
  let c2 = 0; for (const it of anaPes) { const opts = it.options; const l = opts.map(o => o[0].length); const bi = opts.findIndex(o => o[1]); assert.ok(l[bi] < Math.max(...l), `${it.id} : bonne réponse la plus longue (${l.join(' ')})`); if (l[bi] === Math.min(...l)) c2++; }
  let c3 = 0; for (const it of valPes) { const opts = it.options; const l = opts.map(o => o[0].length); const bi = opts.findIndex(o => o[1]); assert.ok(l[bi] < Math.max(...l), `${it.id} : bonne réponse la plus longue (${l.join(' ')})`); if (l[bi] === Math.min(...l)) c3++; }
  // libellés « cherche » des S'APP : la bonne n'est pas la plus longue
  const sapp = don.ENONCES.filter(e => /^pes-sapp/.test(e.id)); assert.equal(sapp.length, 2);
  let c4 = 0, n4 = 0;
  for (const e of sapp) for (let q = 0; q < 2; q++) { const b = e.build(e.gen(), q), l = [b.cherche.bonne, ...b.cherche.faux].map(x => x.length); assert.ok(l[0] < Math.max(...l), `${e.id}.${q} : libellé « cherche » le plus long (${l.join(' ')})`); n4++; if (l[0] === Math.min(...l)) c4++; }
  // cohérence des données des S'APP : le mur est plus loin que le sommet (donnée inutile mais jamais absurde) ; la durée du vol affichée est celle du modèle
  const [eLanc, eEner] = ['pes-sapp-lancer', 'pes-sapp-energie'].map(id => sapp.find(e => e.id === id)); let nMur = 0, nTv = 0;
  for (let i = 0; i < 2000; i++) {
    const p = eLanc.gen(), xs = p.v0 * Math.cos(rad(p.alpha)) * p.v0 * Math.sin(rad(p.alpha)) / 9.8; assert.ok(p.d > xs * 1.5, `mur à ${p.d} m, sommet à ${xs.toFixed(1)} m`); nMur++;
    const e = eEner.gen(), vy = e.v0 * Math.sin(rad(e.alpha)), tv = (vy + Math.sqrt(vy * vy + 2 * 9.8 * e.h)) / 9.8; assert.ok(Math.abs(e.tv - tv) <= 0.051, `tv ${e.tv} s au lieu de ${tv.toFixed(2)} s`); nTv++;
  }
  console.log(`ANA : ${c2}/3 les plus courtes ; VAL : ${c3}/3 ; libellés S'APP : ${c4}/${n4} les plus courts ; toutes jamais les plus longues ; S'APP : ${nMur} murs et ${nTv} durées de vol cohérents`);
} finally { await serveur.close(); }
