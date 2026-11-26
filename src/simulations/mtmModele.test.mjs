import * as M from './mtmModele.js';
import * as C from './couleurModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const pres = (a, b, t, m) => ok(Math.abs(a - b) <= t, `${m} : ${a} ≠ ${b} (± ${t})`);
// sources : normalisées à 100 à 560 nm ; produit source × réflectance
for (const id of M.SOURCES) { const s = M.spd(id); pres(s[18], 100, 1e-9, 'spd à 560 nm ' + id); ok(s.length === M.NB, 'longueur'); }
const r = M.renvoyee(M.OBJETS.rouge, 'D65'), s65 = M.spd('D65'); for (let i = 0; i < M.NB; i++) pres(r[i], s65[i] * M.OBJETS.rouge[i], 1e-9, 'produit ' + i);
// réflectances entre 0 et 1 ; blanc parfait = (100, 0, 0) sous chaque lampe (Lab avec le blanc de la lampe)
for (const [k, v] of Object.entries(M.OBJETS)) ok(v.every(x => x > 0 && x < 1), 'réflectance ' + k);
for (const id of M.SOURCES) { const l = M.labSous(new Array(M.NB).fill(1), id); pres(l.L, 100, 1e-6, 'L blanc'); pres(l.a, 0, 1e-6, 'a blanc'); pres(l.b, 0, 1e-6, 'b blanc'); }
// couleurs sous D65 : teintes attendues
const h = k => C.lch(M.labSous(M.OBJETS[k], 'D65')).h;
ok(h('bleu') > 250 && h('bleu') < 300, 'bleu'); ok(h('vert') > 110 && h('vert') < 170, 'vert'); ok(h('jaune') > 80 && h('jaune') < 110, 'jaune'); ok(h('rouge') > 25 && h('rouge') < 60, 'rouge');
// sans adaptation à l'écran : le blanc paraît plus chaud sous A que sous D65
const rgb = c => c.match(/\d+/g).map(Number); const bD = rgb(M.couleurSous(M.OBJETS.blanc, 'D65')), bA = rgb(M.couleurSous(M.OBJETS.blanc, 'A'));
ok(bA[0] > bA[2] + 80 && Math.abs(bD[0] - bD[2]) < 25, 'blanc sous A plus chaud');
// paires métamères : écart nul sous D65 quel que soit s et la base, croissant sous A et F2 avec s
for (const b of Object.keys(M.BASES)) {
  let prec = -1;
  for (const s of [0, 0.25, 0.5, 0.75, 1]) {
    const { r1, r2 } = M.paire(b, s); pres(M.ecartSous(r1, r2, 'D65'), 0, 1e-6, `ΔE D65 ${b} ${s}`);
    const e = M.ecartSous(r1, r2, 'A'); ok(e >= prec - 1e-9, 'croissant'); prec = e;
    ok(r2.every(x => x > 0.03 && x < 0.97), `réflectance 0,03–0,97 ${b} ${s}`);
    // mêmes X, Y, Z sous D65
    const a = C.xyz(r1, 'D65'), c = C.xyz(r2, 'D65'); pres(a.X, c.X, 1e-6, 'X'); pres(a.Y, c.Y, 1e-6, 'Y'); pres(a.Z, c.Z, 1e-6, 'Z');
  }
  const { r1, r2 } = M.paire(b, 1); ok(M.ecartSous(r1, r2, 'A') > 3.5 && M.ecartSous(r1, r2, 'F2') > 2, `métamérisme sensible ${b}`);
  // les courbes se croisent au moins 3 fois (condition nécessaire du métamérisme à trois grandeurs)
  let cr = 0; for (let i = 1; i < M.NB; i++) if ((r1[i] - r2[i]) * (r1[i - 1] - r2[i - 1]) < 0) cr++; ok(cr >= 3, `croisements ${b} : ${cr}`);
}
const P = M.PAIRE; ok(M.ecartSous(P.r1, P.r2, 'A') > 4 && M.ecartSous(P.r1, P.r2, 'A') < 6, 'paire du parcours sous A');
// tirages
let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const vus = { meta: 0, identiques: 0, differentes: 0 }, fams = {};
for (let k = 0; k < 600; k++) {
  const t = M.tirageMetamere(rnd); vus[t.cas]++;
  if (t.cas === 'meta') { ok(t.eD65 < 1e-6 && t.eA > 2.5, `meta ${t.eA}`); }
  if (t.cas === 'identiques') { ok(t.eD65 < 1e-9 && t.eA < 1e-9, 'identiques'); }
  if (t.cas === 'differentes') { ok(t.eD65 > 4 && t.eA > 4, `différentes ${t.eD65} ${t.eA}`); }
  const c = M.tirageCouleur(rnd); fams[c.famille] = (fams[c.famille] || 0) + 1;
  const l = C.lch(M.labSous(c.refl, 'D65'));
  if (c.famille === 'noir') ok(l.L < 30, 'noir'); if (c.famille === 'blanc') ok(l.L > 90 && l.C < 5, 'blanc');
  if (c.famille === 'bleu') ok(l.h > 250 && l.h < 300, 'bleu tiré'); if (c.famille === 'vert') ok(l.h > 110 && l.h < 170, 'vert tiré');
  if (c.famille === 'jaune') ok(l.h > 80 && l.h < 110, 'jaune tiré'); if (c.famille === 'rouge') ok(l.h > 25 && l.h < 60, 'rouge tiré');
}
ok(Object.values(vus).every(v => v > 120) && Object.keys(fams).length === 6, 'tirages variés');
console.log(`mtmModele : ${n} vérifications OK`);
