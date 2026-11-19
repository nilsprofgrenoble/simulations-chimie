import * as M from './lunetteTGModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// valeurs du parcours : lunette d'étude 300/50, θ = 0,50°
ok(proche(M.dAfocal(300, 50), 350) && proche(M.dAfocal(900, 40), 940) && proche(M.dAfocal(700, 25), 725), 'O1O2 = f′obj + f′oc');
ok(proche(M.grossissement(300, 50), 6) && proche(M.grossissement(700, 10), 70) && proche(M.grossissement(700, 25), 28), 'G = f′obj/f′oc');
ok(Math.abs(M.tailleImage(300, 0.5) - 2.618) < 1e-3, 'A1B1 = 2,6 mm');
ok(Math.abs(M.thetaPrimeDeg(300, 50, 0.5) - 3.0) < 1e-9, "θ′ = G θ = 3,0°");
// θ′ = G θ en petits angles, pour toutes les combinaisons
M.OBJECTIFS.forEach(f1 => M.OCULAIRES.forEach(f2 => M.THETAS.forEach(t => ok(proche(M.thetaPrimeDeg(f1, f2, t), M.grossissement(f1, f2) * t), 'θ′ = Gθ'))));
// approximation des petits angles : écart faible pour les petits angles, élevé quand θ′ est grand
ok(M.ecartPetitsAngles(300, 50, 0.5) < 0.005, 'petits angles : 300/50 à 0,5°');
ok(M.ecartPetitsAngles(700, 10, 1.0) > 0.2 && !M.petitsAnglesValables(700, 10, 1.0), 'petits angles : 700/10 à 1° hors domaine');
ok(M.petitsAnglesValables(700, 25, 0.5) && M.petitsAnglesValables(1000, 10, 0.2), 'domaine de validité');
// afocale : O1O2 = f′obj + f′oc, faisceau parallèle, nature du faisceau
ok(M.afocale(450, 400, 50) && M.afocale(452, 400, 50) && M.afocale(448, 400, 50) && !M.afocale(453, 400, 50) && !M.afocale(447, 400, 50), 'afocale à 2 mm près');
{ const lim = (f1, f2) => { const g = M.geometrie(f1, f2, M.dMax(f1, f2), 0.5); return M.X1 + g.D; }; ok([[300, 50], [700, 10], [1000, 10], [400, 100], [300, 100]].every(([a, b]) => lim(a, b) <= 380), 'dessin dans le cadre à dMax'); }
ok(M.natureFaisceau(450, 400, 50) === 'parallèle' && M.natureFaisceau(480, 400, 50) === 'convergent' && M.natureFaisceau(430, 400, 50) === 'divergent', 'nature du faisceau');
// tracé : lunette afocale → tous les rayons du faisceau émergent sont parallèles, de pente Gd·S ; l'image intermédiaire est dans le plan focal image
for (const [f1, f2] of [[300, 50], [700, 25], [1000, 10], [200, 100], [400, 100]]) for (const t of M.THETAS) {
  const g = M.geometrie(f1, f2, M.dAfocal(f1, f2), t);
  ok(proche(g.F1 + g.F2, M.L_DESSIN) && proche(g.F1 / g.F2, g.Gd), 'focales dessinées');
  ok(g.plafonne === (f1 / f2 > M.G_DESSIN_MAX), 'plafond');
  const pentes = [-M.H_OBJ, 0, M.H_OBJ].map(h => M.pente2(g, h, true));
  ok(pentes.every(p => proche(p, g.Gd * g.S, 1e-9)), 'faisceau émergent parallèle, pente Gd·S');
  [-M.H_OBJ, 0, M.H_OBJ].forEach(h => { const r = M.rayon(g, h, true, 300, false), y = r[2][1]; ok(proche(M.rayon(g, h, true, g.F1, false)[2][1], -g.S * g.F1, 1e-9) && Number.isFinite(y), 'B1 dans le plan focal image, hauteur S·F1'); });
  // faisceau parallèle à l'axe (sur l'axe) : converge en F′ (y = 0 à x = F1)
  [-M.H_OBJ, M.H_OBJ].forEach(h => ok(Math.abs(M.rayon(g, h, false, g.F1, false)[2][1]) < 1e-9, 'axe : convergence en F′'));
  // le rayon passant par B1 et O2 est parallèle aux rayons émergents
  ok(proche((g.S * g.F1) / g.F2, g.Gd * g.S), 'tan θ′ dessiné = Gd tan θ dessiné');
}
// hors afocale : e > 0 → convergent ; e < 0 → divergent (pente du faisceau émergent)
{ const g = M.geometrie(400, 50, 480, 0.5); ok(M.pente2(g, M.H_OBJ, true) > M.pente2(g, -M.H_OBJ, true), 'convergent'); const g2 = M.geometrie(400, 50, 430, 0.5); ok(M.pente2(g2, M.H_OBJ, true) < M.pente2(g2, -M.H_OBJ, true), 'divergent'); }
// défis : fiches, oculaires
for (let k = 0; k < 5000; k++) {
  const t = M.tirageFiche(); const G = t.f1 / t.f2, a = M.arrondi2cs(G);
  ok(Math.abs(a - G) / G <= M.TOL_G, 'G arrondi à 2 chiffres significatifs accepté');
  ok(Number.isFinite(t.G) && t.G >= 10, 'G de la fiche');
  const o = M.tirageOculaire(); ok(Number.isInteger(o.f2) && proche(o.f1 / o.f2, o.G) && Number.isInteger(o.G), 'défi oculaire');
  // faisabilité du réglage : le curseur (pas 1 mm, entiers) atteint exactement f′obj + f′oc
  ok(Number.isInteger(M.dAfocal(t.f1, t.f2)), 'O1O2 entier');
}
// pires cas d'arrondi de G à 2 chiffres significatifs sur toutes les fiches
let pire = 0; M.FICHES.forEach(fi => M.OCULAIRES_FICHE.forEach(f2 => { const G = fi.f / f2; pire = Math.max(pire, Math.abs(M.arrondi2cs(G) - G) / G); }));
ok(pire <= 0.05, 'pire arrondi ' + pire);
// un défi « oculaire » : la bonne réponse est acceptée, f′obj/G... et un piège (inverse) n'est jamais accepté
M.COUPLES_OCULAIRE.forEach(o => { const inv = o.G / o.f1; ok(Math.abs(inv - o.f2) / o.f2 > M.TOL_F2 && Math.abs(o.G * o.f1 - o.f2) / o.f2 > M.TOL_F2 && Math.abs(o.G - o.f2) / o.f2 > M.TOL_F2, 'pièges hors tolérance'); });
console.log(`lunetteTGModele : ${n} vérifications OK (pire arrondi 2 cs : ${(pire * 100).toFixed(1)} %)`);
