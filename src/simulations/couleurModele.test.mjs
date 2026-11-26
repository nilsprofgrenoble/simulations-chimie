import * as C from './couleurModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const pres = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m} : ${a} ≠ ${b} (± ${e})`);
// blanc D65 : Lab = (100, 0, 0), chromaticité du blanc de référence
const w = C.blancDe('D65'), lw = C.lab(w); pres(lw.L, 100, 1e-6, 'L blanc'); pres(lw.a, 0, 1e-6, 'a blanc'); pres(lw.b, 0, 1e-6, 'b blanc');
pres(C.BLANC_XY.x, 0.3127, 0.001, 'x blanc D65'); pres(C.BLANC_XY.y, 0.3290, 0.001, 'y blanc D65');
const wa = C.xyY(C.blancDe('A')); pres(wa.x, 0.4476, 0.001, 'x A'); pres(wa.y, 0.4074, 0.001, 'y A');
// aller-retour Lab ↔ XYZ
for (const l of [{ L: 50, a: 20, b: -30 }, { L: 10, a: -5, b: 8 }, { L: 90, a: 0, b: 60 }, { L: 4, a: 1, b: 1 }]) {
  const r = C.lab(C.xyzDeLab(l)); pres(r.L, l.L, 1e-6, 'L'); pres(r.a, l.a, 1e-6, 'a'); pres(r.b, l.b, 1e-6, 'b');
}
// sRGB : gris neutre L* = 50 → 119 ; rouge sRGB (53,24 ; 80,09 ; 67,20) → (255, 0, 0)
const g = C.srgb(C.xyzDeLab({ L: 50, a: 0, b: 0 })); pres(g.r, 119, 1, 'gris r'); pres(g.g, 119, 1, 'gris g'); pres(g.b, 119, 1, 'gris b');
const r = C.srgb(C.xyzDeLab({ L: 53.24, a: 80.09, b: 67.2 })); pres(r.r, 255, 2, 'rouge r'); pres(r.g, 0, 3, 'rouge g'); pres(r.b, 0, 3, 'rouge b');
// cylindriques
const c = C.lch({ L: 50, a: -24, b: 32 }); pres(c.C, 40, 1e-9, 'C*'); pres(c.h, 126.8699, 1e-3, 'h');
const rt = C.labDeLch(c); pres(rt.a, -24, 1e-9, 'a retour'); pres(rt.b, 32, 1e-9, 'b retour');
// écarts
pres(C.deltaE76({ L: 50, a: 15, b: -20 }, { L: 51, a: 13, b: -18 }), 3, 1e-9, 'ΔE 1,2,2');
const ec = C.ecartCylindrique({ L: 50, a: 30, b: 0 }, { L: 50, a: 20, b: 0 }); pres(ec.dC, 10, 1e-9, 'ΔC pur'); pres(ec.dH, 0, 1e-9, 'ΔH nul');
const eh = C.ecartCylindrique({ L: 50, a: 0, b: 20 }, { L: 50, a: 20, b: 0 }); pres(eh.dC, 0, 1e-9, 'ΔC nul'); pres(eh.dH, Math.hypot(20, 20), 1e-9, 'ΔH pur'); ok(eh.dh > 0, 'sens h');
// CMC : à saturation nulle, SL = 0,040975 L/(1+0,01765 L) ; ΔL = 2 · SL → CMC(2:1) = 1 ; ΔC = SC → 1
const SL50 = 0.040975 * 50 / (1 + 0.01765 * 50); pres(C.deltaCMC({ L: 50 + 2 * SL50, a: 0, b: 0 }, { L: 50, a: 0, b: 0 }), 1, 1e-9, 'CMC lum');
pres(C.deltaCMC({ L: 50, a: 0.638, b: 0 }, { L: 50, a: 0, b: 0 }), 1, 1e-9, 'CMC chroma');
pres(C.deltaCMC({ L: 40, a: 10, b: -30 }, { L: 40, a: 10, b: -30 }), 0, 1e-12, 'CMC nul');
// tolérance non sphérique : même ΔE*ab, direction C* ou h
const ref = { L: 50, a: 30, b: -40 }, rc = C.lch(ref);
const dirC = C.labDeLch({ L: 50, C: rc.C + 3, h: rc.h }), dirH = C.labDeLch({ L: 50, C: rc.C, h: rc.h + 3 * 180 / Math.PI / rc.C });
pres(C.deltaE76(dirC, ref), 3, 1e-9, 'ΔE C'); pres(C.deltaE76(dirH, ref), 3, 0.01, 'ΔE h');
ok(C.deltaCMC(dirC, ref) < C.deltaCMC(dirH, ref), 'CMC tolère plus en chroma qu’en teinte');
// lieu spectral
const p520 = C.pointLieu(520); pres(p520.x, 0.0743, 5e-4, 'x 520'); pres(p520.y, 0.8338, 5e-4, 'y 520');
const p580 = C.pointLieu(580); pres(p580.x, 0.5125, 5e-4, 'x 580');
// lecture d'un point : dominante, pureté, complémentaire
for (const lam of [450, 480, 520, 550, 580, 600, 640]) for (const p of [0.3, 0.6, 0.9]) {
  const P = C.pointDeDominante(lam, p), l = C.lireChromaticite(P.x, P.y);
  pres(l.dominante, lam, 0.6, `dominante ${lam}/${p}`); pres(l.purete, p, 1e-6, `pureté ${lam}/${p}`);
}
// complémentaires : le blanc est sur le segment entre les deux lumières
for (const lam of [480, 580, 620]) { const L = C.pointLieu(lam), l = C.lireChromaticite(L.x, L.y), Q = C.pointLieu(l.complementaire); const W = C.BLANC_XY;
  pres((L.x - W.x) * (Q.y - W.y) - (L.y - W.y) * (Q.x - W.x), 0, 2e-3, `alignement ${lam}`); ok((L.x - W.x) * (Q.x - W.x) + (L.y - W.y) * (Q.y - W.y) < 0, `côtés opposés ${lam}`); }
// le complémentaire d'un vert (520 nm) n'est pas une lumière monochromatique : c'est un pourpre
const l520 = C.lireChromaticite(C.pointLieu(520).x, C.pointLieu(520).y); ok(l520.complementaire == null && l520.oppose.pourpre, 'complémentaire du vert = pourpre');
// pourpre : un point entre le blanc et la droite des pourpres
const pu = C.lireChromaticite(0.40, 0.15); ok(pu.pourpre && pu.dominante == null && pu.complementaire > 490 && pu.complementaire < 570, 'pourpre');
ok(C.lireChromaticite(C.BLANC_XY.x, C.BLANC_XY.y).blanc, 'blanc');
// gamut sRGB
ok(C.dansTriangle(C.BLANC_XY, C.PRIMAIRES_SRGB), 'blanc dans gamut'); ok(!C.dansTriangle(C.pointLieu(520), C.PRIMAIRES_SRGB), '520 hors gamut'); ok(!C.dansTriangle(C.pointLieu(480), C.PRIMAIRES_SRGB), '480 hors gamut');
// réflectance : objet blanc parfait sous A = blanc de A ; objet gris moyen → Y = 50
const gris = new Array(C.NB).fill(0.5); pres(C.xyz(gris, 'A').Y, 50, 1e-9, 'gris 50 %'); pres(C.lab(C.xyz(gris, 'A'), C.blancDe('A')).a, 0, 1e-9, 'gris neutre sous A');
console.log(`couleurModele : ${n} vérifications OK`);
// pourpres : la complémentaire lue sur le point construit est celle demandée ; le point est entre le blanc et la droite des pourpres
for (const lc of [500, 520, 540, 560]) for (const p of [0.3, 0.6, 0.9]) {
  const P = C.pointPourpre(lc, p), l = C.lireChromaticite(P.x, P.y);
  ok(l.pourpre && l.dominante == null, `pourpre ${lc}/${p}`); pres(l.complementaire, lc, 0.6, `complémentaire ${lc}/${p}`); pres(l.purete, p, 1e-6, `pureté pourpre ${lc}/${p}`); ok(C.dansDiagramme(P.x, P.y), `pourpre dans le diagramme ${lc}`);
}
// mélange : segment, barycentre
const m = C.melange(C.pointLieu(620), C.pointLieu(530), 0.5); pres(m.x, (0.6915 + 0.1547) / 2, 2e-3, 'x mélange rouge + vert'); pres(m.y, (0.3083 + 0.8059) / 2, 2e-3, 'y mélange rouge + vert');
ok(C.lireChromaticite(m.x, m.y).dominante > 560 && C.lireChromaticite(m.x, m.y).dominante < 580, 'rouge + vert à parts égales = jaune-vert');
// intérieur du diagramme
ok(C.dansDiagramme(0.3127, 0.329) && !C.dansDiagramme(0.7, 0.8) && !C.dansDiagramme(0.1, 0.05) && C.dansDiagramme(0.5, 0.4), 'dansDiagramme');
console.log(`couleurModele (suite) : ${n} vérifications OK`);
