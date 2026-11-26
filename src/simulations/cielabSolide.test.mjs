import * as S from './cielabSolide.js';
import * as C from './couleurModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const pres = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m} : ${a} ≠ ${b} (± ${e})`);
const noir = S.rgbVersLab(0, 0, 0), blanc = S.rgbVersLab(255, 255, 255), rouge = S.rgbVersLab(255, 0, 0), bleu = S.rgbVersLab(0, 0, 255);
pres(noir.L, 0, 1e-6, 'noir : L* = 0'); pres(blanc.L, 100, 0.05, 'blanc : L* = 100'); ok(Math.abs(blanc.a) < 0.7 && Math.abs(blanc.b) < 0.7, 'blanc : a* et b* proches de 0');
pres(rouge.L, 53.2, 0.5, 'rouge sRGB : L* ≈ 53'); ok(rouge.a > 75 && rouge.b > 60, 'rouge : a* et b* positifs');
pres(bleu.L, 32.3, 0.5, 'bleu sRGB : L* ≈ 32'); ok(bleu.b < -90, 'bleu : b* très négatif');
// la surface est bien le bord du gamut : un peu à l'intérieur, la couleur est affichable ; un peu à l'extérieur, non
const m = S.surfaceSolide(12); ok(m.x.length === 6 * 13 * 13 && m.I.length === 6 * 12 * 12 * 2, 'taille du maillage');
for (let i = 0; i < m.x.length; i += 17) ok(m.z[i] >= -0.01 && m.z[i] <= 100.05, `L* dans [0, 100] (sommet ${i})`);
for (const th of [0, 40, 120, 200, 286, 330]) for (const L of [30, 50, 70]) {
  const r = S.rhoMax(L, th), c = Math.cos(th * Math.PI / 180), s = Math.sin(th * Math.PI / 180);
  ok(!C.srgb(C.xyzDeLab({ L, a: (r - 0.3) * c, b: (r - 0.3) * s })).hors && C.srgb(C.xyzDeLab({ L, a: (r + 0.5) * c, b: (r + 0.5) * s })).hors, `rhoMax(${L}, ${th}) est le bord du gamut`);
}
// quart ouvert : plus aucun triangle dans a* > 0, b* < 0, L* > L0 ; les autres sont conservés
const o = S.ouvrirQuart(m, 45); ok(o.I.length < m.I.length && o.I.length > m.I.length * 0.6, 'des triangles ont été retirés, pas tous');
for (let t = 0; t < o.I.length; t += 7) { const p = [o.I[t], o.J[t], o.K[t]]; const cx = (m.x[p[0]] + m.x[p[1]] + m.x[p[2]]) / 3, cy = (m.y[p[0]] + m.y[p[1]] + m.y[p[2]]) / 3, cz = (m.z[p[0]] + m.z[p[1]] + m.z[p[2]]) / 3; ok(!(cx > 0 && cy < 0 && cz > 45), 'aucun triangle restant dans le quart ouvert'); }
const dm = S.ouvrirDemi(m, 45); ok(dm.I.length < o.I.length && dm.I.length > m.I.length * 0.4, 'moitié avant retirée');
for (let t = 0; t < dm.I.length; t += 7) { const p = [dm.I[t], dm.J[t], dm.K[t]]; const cy = (m.y[p[0]] + m.y[p[1]] + m.y[p[2]]) / 3, cz = (m.z[p[0]] + m.z[p[1]] + m.z[p[2]]) / 3; ok(!(cy < 0 && cz > 45), 'aucun triangle restant dans la moitié avant ouverte'); }
const mb = S.moitieBasse(m, 45); ok(mb.I.length > 0 && mb.I.length < m.I.length, 'moitié basse partielle');
for (let t = 0; t < mb.I.length; t += 5) ok((m.z[mb.I[t]] + m.z[mb.J[t]] + m.z[mb.K[t]]) / 3 <= 45, 'rien au-dessus de L0');
// faces de coupe et disque
for (const f of [S.faceCoupe(270, 45), S.faceCoupe(0, 45)]) { ok(f.x.length === 21 * 17 && f.col.length === f.x.length, 'face de coupe : sommets et couleurs'); ok(Math.min(...f.z) === 45 && Math.max(...f.z) === 100, 'face de coupe : de L0 à 100'); }
const d = S.disqueCoupe(45); ok(d.z.every(v => v === 45) && d.x.length === 1 + 72 * 14, 'disque de coupe horizontal');
for (let k = 1; k < d.x.length; k += 11) ok(!C.srgb(C.xyzDeLab({ L: 45, a: d.x[k] * 0.999, b: d.y[k] * 0.999 })).hors, 'les points du disque sont dans le gamut');
// ellipses
const pos = S.positionsEllipses(45); ok(pos.length > 20 && pos.length <= 61 && pos[0].a === 0, 'positions des ellipses');
for (const p of pos) ok(!C.srgb(C.xyzDeLab({ L: 45, a: p.a, b: p.b })).hors, 'ellipse placée sur une couleur affichable');
const c = S.contoursEllipses(pos, 45, 1, 4, 45.3); ok(c.x.length === pos.length * 38 && c.x.filter(v => v === null).length === pos.length, 'contours des ellipses');
console.log(`cielabSolide : ${n} vérifications OK`);
