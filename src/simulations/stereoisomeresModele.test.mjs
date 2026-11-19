import * as M from './stereoisomeresModele.js';
import * as C from './chiraliteModele.js';
let n = 0, ko = 0; const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 15) console.log('ÉCHEC', m); } };
for (const m of M.POOL2) {
  const st = M.stereoisomeres(m);
  ok(st.length === 4, `4 stéréoisomères ${m.id}`); ok(new Set(st.map(s => s.id)).size === 4, `descripteurs distincts ${m.id}`);
  ok(M.centresAsym ? true : true, 'x'); ok(C.centresAsym(m).length === 2, `2 C* ${m.id}`);
  for (const a of st) for (const b of st) {
    const r = M.relation(a.desc, b.desc), miroir = b.flips.every((f, i) => f === !a.flips[i]);
    ok((r === 'identiques') === (a.id === b.id), 'identiques'); ok((r === 'enantiomeres') === miroir, `énantiomères = miroir ${m.id} ${a.id} ${b.id}`);
    ok(M.relation(b.desc, a.desc) === r, 'symétrie');
    // l'énantiomère d'un stéréoisomère a tous ses descripteurs inversés
    if (r === 'enantiomeres') ok(a.desc.every((d, i) => d === C.inverse(b.desc[i])), 'inversion');
  }
  for (const a of st) { const rel = st.map(b => M.relation(a.desc, b.desc)); ok(rel.filter(x => x === 'enantiomeres').length === 1 && rel.filter(x => x === 'diastereoisomeres').length === 2 && rel.filter(x => x === 'identiques').length === 1, 'bilan des relations'); ok(M.sOfDesc(m, a.desc) === undefined ? false : true, 'sOfDesc'); }
  // le miroir d'un dessin inverse bien les deux configurations calculées
  for (const a of st) { const c = M.miroirDe(a); const b = st.find(s => s.flips.join() === c.join()); ok(M.relation(a.desc, b.desc) === 'enantiomeres', 'miroirDe'); }
  ok(M.nomDesc(m, ['R', 'S']).startsWith('(2R,3S)'), 'nomDesc');
}
for (const k of [1, 2, 3, 4, 5]) { ok(M.nbStereo(k) === 2 ** k, 'nb'); ok(M.nbCouples(k) * 2 === M.nbStereo(k), 'couples'); ok(M.nbDiastereo(k) + 2 === M.nbStereo(k), 'diast'); }
// alcènes : Z/E seulement si chaque carbone porte deux groupes différents
const attendu = { but2ene: true, pent2ene: true, chloropropene: true, bromochloroethene: true, butenoique: true, chloropropenoique: true, hex3ene: true, propene: false, methylbutene: false, dichloroethene: false };
for (const a of M.ALCENES) {
  ok(a.ze === attendu[a.id], `Z/E ${a.id}`); ok(a.c.length === 2, 'double liaison trouvée');
  for (let k = 0; k < 2; k++) if (a.subs[k]) {
    ok(a.subs[k].length === 2 && C.compareCIP(a.g, a.c[k], a.subs[k][0], a.subs[k][1]).signe > 0, `priorité ${a.id}`);
    ok(a.g.voisins[a.c[k]].length === 3, 'sp2 : 3 voisins'); a.subs[k].forEach(j => ok(M.etiqAlc(a, j) !== undefined, `étiquette ${a.id} ${j}`));
  }
}
// quatre géométries : Z si les prioritaires sont du même côté
for (const h of [[true, true], [false, false]]) ok(M.geometrieZE(h) === 'Z', 'Z'); for (const h of [[true, false], [false, true]]) ok(M.geometrieZE(h) === 'E', 'E');
for (const a of M.ALC_ZE) for (const h of [[true, true], [true, false], [false, true], [false, false]]) {
  const s0 = M.substituants(a, h, 0), s1 = M.substituants(a, h, 1); ok(s0.haut !== s0.bas && s1.haut !== s1.bas, 'subst'); ok(M.geometrieZE(M.autreGeometrie(h)) !== M.geometrieZE(h), 'autre');
  ok(M.memeGeometrie(h, [!h[0], !h[1]]), 'retourner la molécule dans le plan ne change pas la géométrie');
}
// Z-1-chloroprop-1-ène : Cl et CH3 du même côté
const cp = M.parIdAlc('chloropropene'); ok(M.etiqAlc(cp, cp.subs[0][0]) === 'Cl' && M.etiqAlc(cp, cp.subs[1][0]) === 'CH₃', 'priorités chloropropène');
const ca = M.parIdAlc('chloropropenoique'); ok(M.etiqAlc(ca, ca.subs[0][0]) === 'Cl' && M.etiqAlc(ca, ca.subs[1][0]) === 'COOH', 'priorités acide');
const bc = M.parIdAlc('bromochloroethene'); ok(M.etiqAlc(bc, bc.subs[0][0]) === 'Br' && M.etiqAlc(bc, bc.subs[1][0]) === 'Cl', 'Br > Cl');
for (let k = 0; k < 5000; k++) { const t = M.tirageRelation(), z = M.tirageZE(); ok(t.rel === M.relation(t.a.desc, t.b.desc) && t.n >= 3 && t.n <= 5, 'tirage relation'); ok(z.m.ze && (z.rel === 'identiques') === M.memeGeometrie(z.h1, z.h2), 'tirage ZE'); }
const rel = new Set(Array.from({ length: 400 }, () => M.tirageRelation().rel)); ok(rel.size === 3, 'les 3 relations sont tirées');
console.log(`${n} vérifications, ${ko} échec(s).`); process.exit(ko ? 1 : 0);
