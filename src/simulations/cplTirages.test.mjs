// Contrôle des exercices « cpl- » (sim 176) : node src/simulations/cplTirages.test.mjs
//  1. famille REA cpl-calcul : on RELIT le TEXTE AFFICHÉ (énoncé et correction rendus en HTML, balises retirées) sur 5 000 tirages, on refait le calcul avec les seuls nombres écrits
//     et on compare à la réponse attendue ; pièges hors tolérance (> 8 %) ; arrondi à 2 chiffres significatifs accepté ; aucun « _ », « ^ », « ÷ » ni « / » brut affiché.
//  2. S'APP : les deux variantes se construisent, les données utiles sont dans le texte.
//  3. QCM (parcours, ANA, VAL, libellés) : la bonne réponse n'est jamais la plus longue (ni toujours la plus courte).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { QCM_PARCOURS } from './cplQcm.js';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const fam = rea.FAMILLES.find(f => f.id === 'cpl-calcul'); assert.ok(fam, 'famille cpl-calcul absente');
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ');
  const SUPN = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  const exp = s => Number(s.replace('⁻', '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => SUPN[c]).replace(/^-?/, m => m).replace(/(?<=-?)(\d)/, '$1'));
  // lit « 3,5 × 10⁻¹⁵ » ou « 12,5 » : renvoie un nombre
  const nombre = (m, e) => { const x = Number(m.replace(',', '.')); if (e == null) return x; const sg = e.startsWith('⁻') ? -1 : 1; const d = [...e.replace('⁻', '')].map(c => SUPN[c]).join(''); return x * 10 ** (sg * Number(d)); };
  const SCI = '([\\d,]+)(?: × 10(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+))?';
  const lire = (re, t, nom) => { const m = new RegExp(re).exec(t); assert.ok(m, `${nom} introuvable dans « ${t.slice(0, 200)} »`); return m; };
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const r2 = x => Number(x.toPrecision(2));
  const E = 1.60e-19, L = 0.060, M = { 'électron': 9.11e-31, 'proton': 1.67e-27, 'ion sodium Na⁺': 3.82e-26 };
  let n = 0;
  for (let i = 0; i < 5000; i++) {
    const ex = fam.gen(), [q1, q2, q3, q4, q5] = ex.questions; n++;
    assert.equal(ex.questions.length, 5);
    for (const q of ex.questions) {
      const t = texte(q.q) + ' ' + texte(q.expl);
      assert.ok(!/_|\^|÷/.test(t), `caractère brut : ${t}`);
      assert.ok(q.tolRel >= 0.05, 'tolérance ≥ 5 %');
      assert.ok(rel(r2(q.vrai), q.vrai) <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance`);
      assert.ok(q.pieges.length >= 2, `${q.id} : au moins 2 pièges`);
      for (const [v] of q.pieges) assert.ok(isFinite(v) && rel(v, q.vrai) > 1.5 * q.tolRel, `${q.id} : piège ${v} proche de ${q.vrai}`);
    }
    // 1 : E = U / d
    let t = texte(q1.q); const d1 = Number(lire('distantes de ([\\d,]+) cm', t, 'd')[1].replace(',', '.')), U1 = Number(lire('tension (\\d+) V', t, 'U')[1]);
    assert.ok(rel(U1 / (d1 / 100), q1.vrai) < 1e-9, `q1 : ${t}`);
    let c = texte(q1.expl); assert.ok(c.includes(`${U1}`) && c.includes(`${(d1 / 100).toFixed(3).replace('.', ',')}`), `q1 expl : ${c}`);
    // 2 : a = |q| E / m
    t = texte(q2.q); const nom2 = lire('Un (électron|proton|ion sodium Na⁺)', t, 'particule')[1];
    const m2 = lire(`masse m = ${SCI} kg`, t, 'm'), E2 = lire(`E = ${SCI} V/m`, t, 'E');
    const mm = nombre(m2[1], m2[2]), EE = nombre(E2[1], E2[2]);
    assert.ok(rel(mm, M[nom2]) < 0.005, `masse affichée ${mm} ≠ ${M[nom2]}`);
    assert.ok(rel(E * EE / mm, q2.vrai) < 0.01, `q2 : ${t} → ${E * EE / mm} vs ${q2.vrai}`);
    c = texte(q2.expl); assert.ok(c.includes(E2[0].replace('E = ', '').replace(/ V\/m$/, '')) , `q2 expl : ${c}`);
    // 3 : déviation
    t = texte(q3.q); const d3 = Number(lire('d = ([\\d,]+) cm', t, 'd3')[1].replace(',', '.')), U3 = Number(lire('tension U = (\\d+) V', t, 'U3')[1]); const v3m = lire(`v₀ = ${SCI} m/s`, t, 'v3'), v3 = nombre(v3m[1], v3m[2]);
    const y3 = (E * U3 / (9.11e-31 * d3 / 100)) * L * L / (2 * v3 * v3) * 1000;
    assert.ok(rel(y3, q3.vrai) < 1e-9, `q3 : ${t}`); assert.ok(y3 < d3 * 5, 'la particule sort'); assert.ok(y3 >= 1);
    c = texte(q3.expl); assert.ok(c.includes(`${y3.toFixed(1).replace('.', ',')} mm`), `q3 expl : ${c}`);
    // 4 : vitesse après accélération
    t = texte(q4.q); const nom4 = lire('Un (électron|proton|ion sodium Na⁺)', t, 'p4')[1], m4 = lire(`masse m = ${SCI} kg`, t, 'm4'), U4 = Number(lire('U = (\\d+) V', t, 'U4')[1]);
    const mm4 = nombre(m4[1], m4[2]); assert.ok(rel(mm4, M[nom4]) < 0.005);
    const v4 = Math.sqrt(2 * E * U4 / mm4); assert.ok(rel(v4, q4.vrai) < 0.01, `q4 : ${t}`); assert.ok(v4 <= 0.1 * 3e8 + 1, `v4 non relativiste ${v4}`);
    // 5 : durée de traversée
    t = texte(q5.q); const v5m = lire(`v₀ = ${SCI} m/s`, t, 'v5'), v5 = nombre(v5m[1], v5m[2]);
    assert.ok(rel(L / v5 * 1e9, q5.vrai) < 1e-9, `q5 : ${t}`);
    c = texte(q5.expl); assert.ok(c.includes(`${(L / v5 * 1e9).toFixed(1).replace('.', ',')} ns`), `q5 expl : ${c}`);
  }
  // S'APP
  const sapp = don.ENONCES.find(x => x.id === 'cpl-sapp-particule'); assert.ok(sapp);
  for (let i = 0; i < 2000; i++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q);
      assert.ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), "S'APP : données utiles citées");
      const Ev = p.U / (p.d / 100); const att = q === 0 ? Ev : Math.abs(p.pa.z) * 1.60e-19 * Ev / p.pa.m; assert.ok(rel(b.solution.val, att) < 1e-9);
      assert.equal(b.cherche.faux.length, 3);
      const inutiles = Object.keys(b.tokens).filter(k => !b.utiles.includes(k)); assert.ok(inutiles.every(k => b.raisons[k] || (b.derivees || []).length), "S'APP : chaque donnée inutile expliquée");
      assert.ok(Object.keys(b.raisons).every(k => b.tokens[k] && !b.utiles.includes(k)), "S'APP : raisons pour les seules données inutiles");
    }
  }
  // QCM : bonne réponse ni la plus longue ni systématiquement la plus courte
  const rendu = s => String(s).replace(/frac\(([^|]*)\|([^)]*)\)/g, (_, a, b) => (a.length > b.length ? a : b)).replace(/vec\((\w+)\)/g, '$1').length;
  let courtes = 0, total = 0;
  const verifie = (nom, longs, bonne) => { const lb = longs[bonne]; assert.ok(longs.some((l, k) => k !== bonne && l >= lb), `${nom} : la bonne réponse est la plus longue (${longs})`); total++; if (longs.every((l, k) => k === bonne || l > lb)) courtes++; };
  for (const [k, q] of Object.entries(QCM_PARCOURS)) verifie(`parcours ${k}`, q.options.map(rendu), q.bonne);
  for (const ex of ana.PREVOIR.filter(e => /^cpl-/.test(e.id))) verifie(ex.id, ex.options.map(o => rendu(o[0])), ex.options.findIndex(o => o[1]));
  for (const ex of val.PLAUSIBLES.filter(e => /^cpl-/.test(e.id))) verifie(ex.id, ex.options.map(o => rendu(o[0])), ex.options.findIndex(o => o[1]));
  assert.ok(courtes < total / 2, `la bonne réponse est trop souvent la plus courte (${courtes}/${total})`);
  // S'APP : libellés des grandeurs cherchées (la bonne n'est pas la plus longue)
  for (const q of [0, 1]) { const b = sapp.build(sapp.gen(), q); const L2 = [b.cherche.bonne, ...b.cherche.faux].map(s => s.length); assert.ok(L2.slice(1).some(l => l >= L2[0]), `S'APP libellés : bonne la plus longue ${L2}`); }
  console.log(`OK : ${n} tirages REA relus, S'APP, ${total} QCM (bonne réponse la plus courte : ${courtes})`);
} finally { await serveur.close(); }
