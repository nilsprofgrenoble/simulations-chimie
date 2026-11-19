// Contrôle des exercices « Deuxième loi de Newton » (sim 168) : node src/simulations/newtonExercices.test.mjs
//  1. famille REA nwt-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres
//     écrits, et on vérifie que la bonne réponse attendue est celle que trouve l'élève (tolérance 0,5 %), que la correction écrit ce même résultat avec les mêmes données,
//     et que l'erreur « poids seul » de la cabine reste un piège ciblé (plus de 8 % de la valeur exacte).
//  2. QCM (parcours, ANA, VAL) : la bonne réponse n'est jamais la plus longue, ni la plus courte dans tous les exercices (longueurs du texte rendu).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './newtonQcm.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'nwt-calcul'); assert.ok(fam, 'famille nwt-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/→/g, '').replace(/\s+/g, ' ');
  const num = s => Number(String(s).replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 160)} »`); return m; };
  // dernier nombre écrit avant l'unité dans la correction
  const dernier = (t, u) => { const re = new RegExp(`(-?[\\d ]+(?:,\\d+)?) ${u}`, 'g'); let m, last; while ((m = re.exec(t))) last = m[1].replace(/ /g, ''); return num(last); };

  let n = 0, poidsSeul = 0;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4] = ex.questions; n++;
    // --- q1 : ΣFx = T cos α − f, à partir des nombres affichés
    let t = texte(q1.q);
    const m1 = num(exact(/masse ([\d,]+) kg/, t, 'masse')[1]), T = num(exact(/tension ([\d,]+) N/, t, 'T')[1]), f = num(exact(/frottements valent ([\d,]+) N/, t, 'f')[1]);
    const al = /inclinée de (\d+)°/.exec(t) ? Number(/inclinée de (\d+)°/.exec(t)[1]) : 0;
    assert.ok(/horizontale/.test(t) || al > 0, 'direction du fil');
    const S = T * Math.cos(al * Math.PI / 180) - f;
    assert.ok(rel(S, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${S}`);
    let c = texte(q1.expl);
    assert.ok(c.includes(`${String(T).replace('.', ',')}`) || c.includes(`${T.toFixed(1).replace('.', ',')}`), `q1 expl sans T : ${c}`);
    assert.ok(rel(dernier(c, 'N'), S) < 0.005, `q1 expl : ${c}`);
    assert.ok(c.includes(`${T.toFixed(1).replace('.', ',')} × cos ${al}° − ${f.toFixed(1).replace('.', ',')}`), `q1 expl données : ${c}`);
    // --- q2 : ax = ΣFx / m
    t = texte(q2.q);
    const m2 = num(exact(/masse ([\d,]+) kg/, t, 'm2')[1]), S2 = num(exact(/= ([\d,]+) N\. Calculez/, t, 'ΣFx')[1]);
    assert.equal(m2, m1);
    assert.ok(rel(S2 / m2, q2.vrai) < 0.005, `q2 : attendu ${q2.vrai}, texte donne ${S2 / m2}`);
    assert.ok(rel(S2, S) < 0.01, `q2 : ΣFx affiché ${S2} ≠ ${S}`);
    c = texte(q2.expl); assert.ok(rel(dernier(c, 'm/s²'), S2 / m2) < 0.01, `q2 expl : ${c}`);
    // --- q3 : T = m (g + a)
    t = texte(q3.q);
    const mc = num(exact(/masse (\d+) kg/, t, 'mc')[1]), [, a1, a2, dt] = exact(/passe de ([\d,]+) m\/s à ([\d,]+) m\/s en ([\d,]+) s/, t, 'vitesses').map((x, k) => (k ? num(x) : x));
    const Tc = mc * (9.8 + (a2 - a1) / dt);
    assert.ok(rel(Tc, q3.vrai) < 0.005, `q3 : attendu ${q3.vrai}, texte donne ${Tc}`);
    c = texte(q3.expl);
    assert.ok(c.includes(`× (9,8 + ${((a2 - a1) / dt).toFixed(2).replace('.', ',')})`), `q3 expl doit écrire g = 9,8 : ${c}`);
    assert.ok(rel(dernier(c, 'N'), Tc) < 0.005, `q3 expl résultat : ${c}`);
    // le poids seul (T = P) doit rester un piège ciblé : plus de 8 % de la valeur exacte, donc conservé dans les pièges
    assert.ok(rel(mc * 9.8, Tc) > 0.08, `q3 : T = P à ${(100 * rel(mc * 9.8, Tc)).toFixed(1)} % de la valeur exacte`);
    assert.equal(q3.pieges.length, 3, 'q3 : trois pièges conservés'); poidsSeul++;
    // --- q4 : f = m g
    t = texte(q4.q); const mp = num(exact(/masse (\d+) kg/, t, 'mp')[1]);
    assert.ok(rel(mp * 9.8, q4.vrai) < 0.005); c = texte(q4.expl); assert.ok(rel(dernier(c, 'N'), mp * 9.8) < 0.005, `q4 expl : ${c}`);
    // aucune pièce de l'énoncé ne doit afficher un nombre arrondi à l'unité par erreur (anciens « 2 kg » pour 1,5 kg)
    for (const q of [q1, q2]) assert.ok(/\d,\d/.test(texte(q.q)), 'décimales perdues');
  }
  console.log(`REA nwt-calcul : ${n} tirages relus sur le texte affiché, ${poidsSeul} pièges « poids seul » conservés`);

  // --- longueurs des QCM : rendu = formules sans balises (vec(F) → 1 caractère, frac(a|b) → a/b)
  const rendu = t => String(t).replace(/vec\(([A-Za-zΔ]{1,2})\)/g, '$1').replace(/frac\(([^|]*)\|([^)]*)\)/g, '$1/$2').replace(/_/g, '');
  const verifLongueurs = (id, textes, bonne) => {
    const L = textes.map(x => [...rendu(x)].length), b = L[bonne];
    assert.ok(b < Math.max(...L), `${id} : la bonne réponse est la plus longue (${L.join(', ')})`);
    return b === Math.min(...L);
  };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifLongueurs(`parcours ${k}`, q.options, q.bonne)) courtes++; }
  for (const it of ana.PREVOIR.filter(x => x.id.startsWith('nwt-'))) { total++; if (verifLongueurs(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1]))) courtes++; }
  for (const it of val.PLAUSIBLES.filter(x => x.id.startsWith('nwt-'))) {
    total++; if (verifLongueurs(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1]))) courtes++;
  }
  console.log(`QCM : ${total} questions, bonne réponse jamais la plus longue ; la plus courte dans ${courtes} cas`);
  assert.ok(courtes <= Math.floor(total / 3), 'la bonne réponse est trop souvent la plus courte');
} finally { await serveur.close(); }
console.log('newtonExercices : tous les contrôles passent');
