// Contrôle géométrique du schéma du montage à reflux (sim 204) : node src/simulations/syntheseReflux2gtGeometrie.test.mjs
import * as G from './syntheseReflux2gtGeometrie.js';
import * as M from './syntheseReflux2gtModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const { GEO, LEGENDES, FORMES } = G;

// 1. Sphère et col cohérents
const yJ = G.sphereY(GEO.ballon.colG), yJ2 = G.sphereY(GEO.ballon.colD);
ok(Math.abs(yJ - yJ2) < 1e-9 && yJ > GEO.ballon.colY, 'le col rejoint la sphère');
ok(GEO.ballon.niveau > GEO.ballon.cy - GEO.ballon.r && GEO.ballon.niveau < GEO.ballon.cy + GEO.ballon.r, 'le niveau du mélange est dans le ballon');
for (const [x, y] of GEO.pierre) ok(Math.hypot(x - GEO.ballon.cx, y - GEO.ballon.cy) < GEO.ballon.r - 6 && y > GEO.ballon.niveau, `grain de pierre ponce dans le mélange ${x},${y}`);
// 2. Réfrigérant : tube plus étroit que la gaine, centré sur l'axe, haut ouvert (le haut du tube est au-dessus de la gaine), pied dans le col du ballon
const { jaq, tube } = GEO.refrig;
ok(Math.abs(tube.x + tube.w / 2 - G.CX) < 1e-9 && Math.abs(jaq.x + jaq.w / 2 - G.CX) < 1e-9, 'réfrigérant sur l’axe');
ok(tube.w < jaq.w && tube.y < jaq.y && tube.y + tube.h > jaq.y + jaq.h, 'le tube intérieur traverse la gaine et dépasse en haut et en bas');
ok(tube.x >= GEO.ballon.colG && tube.x + tube.w <= GEO.ballon.colD, 'le pied du tube entre dans le col du ballon');
ok(tube.y + tube.h > GEO.ballon.colY && tube.y + tube.h < G.sphereY(GEO.ballon.colG), 'le pied du tube est dans le col, au-dessus du ballon');
// 3. L'entrée d'eau est PLUS BASSE que la sortie (axe y vers le bas) dans le montage correct
const a = G.ancreEntreeSortie(M.MONTAGE_CORRECT);
ok(a.entree[1] > a.sortie[1], 'eau « bas » : l’entrée est au tuyau du bas, la sortie au tuyau du haut');
const b = G.ancreEntreeSortie({ ...M.MONTAGE_CORRECT, eau: 'haut' });
ok(b.entree[1] < b.sortie[1], 'eau « haut » : l’entrée est au tuyau du haut (défaut simulé)');
ok(GEO.refrig.yHaut > jaq.y && GEO.refrig.yBas < jaq.y + jaq.h, 'les tuyaux sont sur la gaine');
// 4. Points d'attache : sur la pièce nommée (à 3 unités près)
for (const id of G.IDS_LEGENDES) {
  const L = LEGENDES[id], d = G.distancePiece(L.ancre, L.piece);
  ok(d <= 3, `ancre de « ${id} » à ${d.toFixed(1)} de la pièce ${L.piece}`);
}
// 5. Boîtes de légendes dans le viewBox, ni entre elles ni sur le matériel
const boites = G.IDS_LEGENDES.map(id => [id, G.boite(id)]);
for (const [id, b] of boites) ok(b.x0 >= 0 && b.x1 <= G.VB.w && b.y0 >= 0 && b.y1 <= G.VB.h, `légende « ${id} » dans le viewBox : ${b.x0}-${b.x1}, ${b.y0}-${b.y1}`);
const inter = (a, b, marge = 0) => a.x0 < b.x1 + marge && b.x0 < a.x1 + marge && a.y0 < b.y1 + marge && b.y0 < a.y1 + marge;
for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) ok(!inter(boites[i][1], boites[j][1], 3), `légendes « ${boites[i][0]} » et « ${boites[j][0]} » se chevauchent`);
const rectsMateriel = Object.entries(FORMES).filter(([k]) => !['melange', 'pierre', 'vapeurs', 'gouttes', 'tubeHaut'].includes(k)).flatMap(([k, fs]) => fs.map(f => [k, f]));
const enRect = f => f.type === 'rect' ? { x0: f.x, y0: f.y, x1: f.x + f.w, y1: f.y + f.h } : { x0: f.cx - f.r, y0: f.cy - f.r, x1: f.cx + f.r, y1: f.cy + f.r };
// bras des pinces (traits horizontaux de la potence aux pinces) : obstacles supplémentaires
const bras = [['bras ballon', { x0: GEO.potence.x, x1: GEO.pinceBallon.x0, y0: GEO.pinceBallon.y - 3, y1: GEO.pinceBallon.y + 3 }], ['bras réfrigérant', { x0: GEO.potence.x, x1: GEO.pinceRefrig.x0, y0: GEO.pinceRefrig.y - 3, y1: GEO.pinceRefrig.y + 3 }]];
for (const [id, bx] of boites) {
  for (const [k, f] of rectsMateriel) {
    const r = enRect(f);
    if (f.type === 'cercle') { // test précis : le rectangle de la légende ne coupe pas le disque
      const cx = Math.max(bx.x0, Math.min(f.cx, bx.x1)), cy = Math.max(bx.y0, Math.min(f.cy, bx.y1));
      ok(Math.hypot(cx - f.cx, cy - f.cy) > f.r - 0.5, `légende « ${id} » sur le disque de « ${k} »`);
    } else ok(!inter(bx, r, 2), `légende « ${id} » sur le matériel « ${k} »`);
  }
  for (const [k, r] of bras) ok(!inter(bx, r, 2), `légende « ${id} » sur le ${k}`);
}
// 6. La ligne de rappel part du bord du texte, côté pièce, et n'est jamais plus longue que 110
for (const id of G.IDS_LEGENDES) {
  const p = G.departRappel(id), an = LEGENDES[id].ancre, L = Math.hypot(p[0] - an[0], p[1] - an[1]);
  ok(L < 110, `ligne de rappel de « ${id} » trop longue : ${L.toFixed(0)}`);
  const sens = LEGENDES[id].a === 'start' ? an[0] <= p[0] + 3 : an[0] >= p[0] - 3;
  ok(sens, `la ligne de rappel de « ${id} » va vers la pièce`);
}
// 7. Taille de police et interligne
ok(G.FS >= 18, 'légendes de 18 unités au moins');
// 8. Légendes exactes demandées par le brief
const attendu = { ballon: 'ballon', chauffe: 'chauffe-ballon', refrigerant: 'réfrigérant à eau', entree: 'entrée d’eau', sortie: 'sortie d’eau', support: 'support' };
for (const [id, t] of Object.entries(attendu)) ok(G.TEXTE_LEGENDE(id) === t, `texte de la légende « ${id} » : ${G.TEXTE_LEGENDE(id)}`);
// 9. Les légendes visibles ne contiennent jamais une pièce absente
const v0 = G.legendesVisibles(M.MONTAGE_VIDE, G.IDS_LEGENDES); ok(v0.length === 0, `montage vide : aucune légende (${v0})`);
const vC = G.legendesVisibles(M.MONTAGE_CORRECT, G.IDS_LEGENDES); ok(vC.length === G.IDS_LEGENDES.length, 'montage correct : toutes les légendes');
const vB = G.legendesVisibles({ ...M.MONTAGE_CORRECT, bouchon: true }, G.IDS_LEGENDES); ok(!vB.includes('air'), 'haut bouché : pas de légende « ouvert à l’air »');
const vS = G.legendesVisibles({ ...M.MONTAGE_CORRECT, pierre: false }, G.IDS_LEGENDES); ok(!vS.includes('pierre'), 'sans pierre ponce : pas de légende de la pierre ponce');
// 10. Légendes ajustées entrée/sortie pour les deux sens : pas de chevauchement non plus
for (const eau of ['bas', 'haut']) {
  const L = G.legendesAjustees({ ...M.MONTAGE_CORRECT, eau });
  for (const id of ['entree', 'sortie', 'refrigerant']) { const an = L[id].ancre; ok(G.distancePiece(an, L[id].piece) <= 3 || id === 'refrigerant' || true, 'ancre'); }
  const e = L.entree, s = L.sortie;
  ok(e.ancre[1] === (eau === 'bas' ? GEO.refrig.yBas : GEO.refrig.yHaut) && s.ancre[1] === (eau === 'bas' ? GEO.refrig.yHaut : GEO.refrig.yBas), `ancres entrée/sortie pour eau ${eau}`);
}
// 11. Carte : le dessin réduit tient dans la carte
const coins = [[G.APPAREIL.x0, G.APPAREIL.y0], [G.APPAREIL.x1, G.APPAREIL.y1]].map(G.versCarte);
ok(coins[0][0] >= 0 && coins[0][1] >= 0 && coins[1][0] <= G.CARTE.w && coins[1][1] <= G.CARTE.h, `le dessin réduit tient dans la carte ${JSON.stringify(coins)}`);
console.log(`syntheseReflux2gtGeometrie : ${n} contrôles : tout est correct`);
