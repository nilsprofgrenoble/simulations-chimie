// Contrôle des exercices « Trous d'Young » (sim 182) : node src/simulations/youngExercices.test.mjs
//  1. famille REA you-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres
//     écrits et on le compare à la réponse attendue ; la correction écrit le même résultat ; la tolérance (≥ 5 %) couvre le pire arrondi à 2 chiffres significatifs ;
//     aucun piège n'est dans la tolérance de la bonne réponse ; aucun piège n'est infini ou nul.
//  2. S'APP (libellés « cherche »), ANA, VAL et QCM du parcours : la bonne réponse n'est jamais la plus longue (longueurs du texte rendu).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './youngQcm.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'you-calcul'); assert.ok(fam, 'famille you-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ');
  const num = s => Number(String(s).replace(',', '.'));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const exact = (re, t, nom) => { const m = re.exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 200)} »`); return m; };
  const sig2 = v => Number(v.toPrecision(2));
  const dernier = (t, u) => { const re = new RegExp(`(-?[\\d ]+(?:,\\d+)?) ${u}`, 'g'); let m, last; while ((m = re.exec(t))) last = m[1].replace(/ /g, ''); return num(last); };
  let n = 0, nbBr = 0, nbSb = 0, pirePiege = Infinity, pireArrondi = 0;
  for (let it = 0; it < 5000; it++) {
    const ex = fam.gen(), [q1, q2, q3, q4, q5] = ex.questions; n++;
    // q1 : δ = a x / D (nm)
    let t = texte(q1.q);
    const a1 = num(exact(/a = ([\d,]+) mm/, t, 'a')[1]), D1 = num(exact(/D = ([\d,]+) m/, t, 'D')[1]), x1 = num(exact(/x = ([\d,]+) mm/, t, 'x')[1]);
    assert.ok(rel(a1 * x1 / D1 * 1000, q1.vrai) < 0.005, `q1 : attendu ${q1.vrai}, texte donne ${a1 * x1 / D1 * 1000}`);
    let c = texte(q1.expl); assert.ok(rel(dernier(c, 'nm'), q1.vrai) < 0.005, `q1 expl : ${c}`);
    assert.ok(c.includes(`${a1.toFixed(2).replace('.', ',')} × 10⁻³ × ${x1.toFixed(1).replace('.', ',')} × 10⁻³`), `q1 expl données : ${c}`);
    // q2 : i = λ D / a (mm)
    t = texte(q2.q);
    const l2 = num(exact(/λ = (\d+) nm/, t, 'λ2')[1]), a2 = num(exact(/a = ([\d,]+) mm/, t, 'a2')[1]), D2 = num(exact(/D = ([\d,]+) m/, t, 'D2')[1]);
    assert.ok(rel(l2 * 1e-9 * D2 / (a2 * 1e-3) * 1e3, q2.vrai) < 0.005, `q2 : attendu ${q2.vrai}`);
    assert.ok(q2.vrai >= 1 && q2.vrai <= 8, `q2 : i hors de 1 à 8 mm (${q2.vrai})`);
    c = texte(q2.expl); assert.ok(rel(dernier(c, 'mm'), q2.vrai) < 0.005, `q2 expl : ${c}`);
    // q3 : a = λ D / i (valeur de i affichée)
    t = texte(q3.q);
    const l3 = num(exact(/λ = (\d+) nm/, t, 'λ3')[1]), D3 = num(exact(/D = ([\d,]+) m/, t, 'D3')[1]), i3 = num(exact(/i = ([\d,]+) mm/, t, 'i3')[1]);
    assert.ok(rel(l3 * 1e-9 * D3 / (i3 * 1e-3) * 1e3, q3.vrai) < 0.005, `q3 : attendu ${q3.vrai}`);
    assert.ok(q3.vrai >= 0.1 && q3.vrai <= 1.0, `q3 : a hors de 0,1 à 1 mm (${q3.vrai})`);
    c = texte(q3.expl); assert.ok(rel(dernier(c, 'mm'), q3.vrai) < 0.005, `q3 expl : ${c}`);
    // q4 : λ = (d / N) a / D (nm)
    t = texte(q4.q);
    const D4 = num(exact(/D = ([\d,]+) m/, t, 'D4')[1]), a4 = num(exact(/a = ([\d,]+) mm/, t, 'a4')[1]), d4 = num(exact(/d = ([\d,]+) mm/, t, 'd4')[1]), N4 = num(exact(/N = (\d+)/, t, 'N4')[1]);
    assert.ok(rel(d4 / N4 * a4 / D4 * 1000, q4.vrai) < 0.005, `q4 : attendu ${q4.vrai}`);
    assert.ok(q4.vrai >= 380 && q4.vrai <= 800, `q4 : λ hors du visible (${q4.vrai})`); assert.ok(d4 <= 38, `q4 : d hors de la fenêtre (${d4})`);
    c = texte(q4.expl); assert.ok(rel(dernier(c, 'nm'), q4.vrai) < 0.005, `q4 expl : ${c}`);
    // q5 : x = k i (brillante) ou (k + ½) i (sombre)
    t = texte(q5.q);
    const l5 = num(exact(/λ = (\d+) nm/, t, 'λ5')[1]), a5 = num(exact(/a = ([\d,]+) mm/, t, 'a5')[1]), D5 = num(exact(/D = ([\d,]+) m/, t, 'D5')[1]), bril = /brillante d’ordre k = (\d)/.exec(t), somb = /sombre d’ordre k = (\d)/.exec(t);
    assert.ok(bril || somb, 'q5 : nature de la frange');
    const i5 = l5 * 1e-9 * D5 / (a5 * 1e-3) * 1e3, x5 = bril ? Number(bril[1]) * i5 : (Number(somb[1]) + 0.5) * i5;
    assert.ok(rel(x5, q5.vrai) < 0.005, `q5 : attendu ${q5.vrai}, texte donne ${x5}`);
    if (bril) nbBr++; else nbSb++;
    assert.ok(x5 < 40, `q5 : hors de l'écran (${x5})`);
    c = texte(q5.expl); assert.ok(rel(dernier(c, 'mm'), q5.vrai) < 0.005, `q5 expl : ${c}`);
    // tolérance et pièges
    for (const q of ex.questions) {
      assert.ok(q.tolRel >= 0.05, `tolérance ${q.tolRel} < 5 %`);
      assert.ok(rel(sig2(q.vrai), q.vrai) <= q.tolRel, `pire arrondi à 2 chiffres significatifs hors tolérance : ${q.vrai}`);
      pireArrondi = Math.max(pireArrondi, rel(sig2(q.vrai), q.vrai));
      assert.ok(q.pieges.length >= 2, `trop peu de pièges conservés (${q.pieges.length}) pour ${q.id}`);
      for (const [v] of q.pieges) { assert.ok(isFinite(v) && v !== 0, 'piège infini ou nul'); const e = rel(v, q.vrai); pirePiege = Math.min(pirePiege, e); assert.ok(e > 1.5 * q.tolRel, `piège dans la tolérance : ${v} vs ${q.vrai}`); }
    }
  }
  console.log(`REA you-calcul : ${n} tirages relus sur le texte affiché (${nbBr} franges brillantes, ${nbSb} sombres) ; pire arrondi à 2 chiffres significatifs ${(100 * pireArrondi).toFixed(2)} % ; piège le plus proche à ${(100 * pirePiege).toFixed(1)} % de la bonne réponse`);

  // --- longueurs des QCM
  const rendu = t => String(t).replace(/vec\(([A-Za-zΔ]{1,2})\)/g, '$1').replace(/frac\(([^|]*)\|([^)]*)\)/g, '$1/$2').replace(/_/g, '');
  const verifLongueurs = (id, textes, bonne) => {
    const L = textes.map(x => [...rendu(x)].length), b = L[bonne];
    assert.ok(b < Math.max(...L), `${id} : la bonne réponse est la plus longue (${L.join(', ')})`);
    return b === Math.min(...L);
  };
  let courtes = 0, total = 0;
  for (const [k, q] of Object.entries(QCM_PARCOURS)) { total++; if (verifLongueurs(`parcours ${k}`, q.options, q.bonne)) courtes++; }
  for (const it of ana.PREVOIR.filter(x => x.id.startsWith('you-'))) { total++; if (verifLongueurs(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1]))) courtes++; }
  for (const it of val.PLAUSIBLES.filter(x => x.id.startsWith('you-'))) { total++; if (verifLongueurs(it.id, it.options.map(o => o[0]), it.options.findIndex(o => o[1]))) courtes++; }
  // S'APP : libellés de « cherche » (bonne réponse jamais la plus longue) pour les deux questions, sur 200 tirages
  for (let k = 0; k < 200; k++) for (const q of [0, 1]) {
    const e = don.nouvelEnonce('you-sapp-young', q), ch = e.b.cherche; if (k === 0) total++;
    const L = [ch.bonne, ...ch.faux].map(x => [...rendu(x)].length); assert.ok(L[0] < Math.max(...L), `S'APP you q${q} : la bonne réponse est la plus longue (${L.join(', ')})`);
    assert.ok(e.b.utiles.every(u => e.b.tokens[u]), 'S\'APP : donnée utile absente'); assert.ok(Object.keys(e.b.tokens).every(t => e.b.utiles.includes(t) || e.b.raisons[t]), 'S\'APP : donnée inutile sans raison');
    assert.ok(Math.abs(e.b.solution.val) > 0 && isFinite(e.b.solution.val));
    if (q === 1) { const iM = e.p.d / e.p.N; assert.ok(Math.abs(e.b.solution.val - e.p.lam * 1e-9 * e.p.D / (iM * 1e-3) * 1e3) < 1e-9 + 0.05 * e.b.solution.val); }
  }
  console.log(`QCM : ${total} questions, bonne réponse jamais la plus longue ; la plus courte dans ${courtes} cas`);
  assert.ok(courtes <= Math.floor(total / 2), 'la bonne réponse est trop souvent la plus courte');
} finally { await serveur.close(); }
console.log('youngExercices : tous les contrôles passent');
