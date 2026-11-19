// Tests du modèle de la simulation 161 (Mesure et incertitudes). Lancer : node src/simulations/mesureModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './mesureModele.js';

const proche = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t, `${a} ≠ ${b}`);

// graine : reproductible
assert.deepEqual(M.tirerSerie(M.SITUATIONS.chrono, 10, 42), M.tirerSerie(M.SITUATIONS.chrono, 10, 42));
assert.notDeepEqual(M.tirerSerie(M.SITUATIONS.chrono, 10, 42), M.tirerSerie(M.SITUATIONS.chrono, 10, 43));

// statistiques
proche(M.moyenne(M.SERIE_COURTE), 14.25);
proche(M.ecartType(M.SERIE_COURTE), 0.09874, 1e-4);
proche(M.incertitudeA(0.099, 5), 0.04427, 1e-4);
proche(M.incertitudeA(0.10, 16), M.incertitudeA(0.10, 4) / 2);          // N × 4 : u / 2
proche(M.incertitudeB(6), 3.4641, 1e-4);
proche(M.demiLargeur(147, 159), 6);
assert.ok(Number.isNaN(M.ecartType([3])));

// la série d'histogramme : 20 valeurs, moyenne voisine de la référence
assert.equal(M.SERIE_HISTO.length, 20);
assert.ok(Math.abs(M.moyenne(M.SERIE_HISTO) - 14.26) < 0.01);
assert.ok(Math.abs(M.ecartType(M.SERIE_HISTO) - 0.10) < 0.005);      // même s que la série courte (≈ 0,10 s)

// arrondi de l'incertitude : 1 chiffre significatif (2 si le premier est 1), par excès
assert.equal(M.arrondiU(3.4641), 4);
assert.equal(M.arrondiU(0.0443), 0.05);
assert.equal(M.arrondiU(0.06), 0.06);                                     // pas de faux arrondi par excès (virgule flottante)
assert.equal(M.arrondiU(0.0142), 0.015);
assert.equal(M.arrondiU(0.0196), 0.020);
assert.equal(M.arrondiU(0.31), 0.4);
assert.equal(M.arrondiU(12.3), 13);
assert.equal(M.arrondiU(0.1), 0.1);
assert.equal(M.arrondiU(1.04), 1.1);
assert.equal(M.arrondiU(95), 100);
assert.equal(M.arrondiU(0.95), 1);
assert.equal(M.decimalesDe(0.0443), 2);
assert.equal(M.decimalesDe(0.0142), 3);
assert.equal(M.decimalesDe(3.4641), 0);
assert.equal(M.arrondiMoyenne(14.2536, 0.0443), 14.25);
assert.equal(M.arrondiMoyenne(153, 3.4641), 153);
assert.equal(M.resultat(153, 3.4641, 'mm').texte, '153 ± 4 mm');
assert.equal(M.resultat(14.2536, 0.0443, 's').texte, '14,25 ± 0,05 s');
assert.equal(M.resultat(20.0049, 0.00157, 'g').u, 0.0016);               // u = 0,00157 → 2 chiffres (premier chiffre 1), par excès

// double arrondi : u brute 0,0196 → 0,020 écrit avec 3 décimales, valeur au même rang
assert.equal(M.resultat(14.2546, 0.0196, 's').texte, '14,255\u00a0±\u00a00,020\u00a0s');
assert.equal(M.resultat(0.0996 * 0 + 14.2546, 0.0996, 's').texte, '14,25\u00a0±\u00a00,10\u00a0s');

// u nulle : pas de NaN dans la comparaison
assert.equal(M.comparer(50, 0, 50).niveau, 'indetermine');
assert.ok(M.tirerSerie(M.SITUATIONS.eprouvette, 3, 1).length === 3);
for (let g = 1; g <= 3000; g++) assert.ok(M.tirerDefiA(g).s > 0, `défi A graine ${g} : s nul`);

// comparaison qualitative
assert.equal(M.comparer(153, 4, 150).niveau, 'compatible');
assert.equal(M.comparer(14.25, 0.05, 14.0).niveau, 'ecart');
assert.equal(M.comparer(14.25, 0.1, 14.1).niveau, 'limite');

// histogramme : somme des classes = N, aucune mesure hors domaine pour les situations avec ou sans biais
for (const id of M.IDS_SITUATIONS) {
  const sit = M.SITUATIONS[id];
  for (const biais of [false, true]) for (const N of M.NB_MESURES) for (let g = 1; g <= 40; g++) {
    const v = M.tirerSerie(sit, N, g * 977, biais), h = M.histogramme(sit, v);
    assert.equal(h.hors + h.classes.reduce((s, c) => s + c.n, 0), N);
    assert.equal(h.hors, 0, `${id} biais=${biais} N=${N} graine=${g} : mesure hors du domaine`);
  }
}
// l'écart-type d'une grande série est proche de sigma (loi normale) et la moyenne de ref (+ biais)
for (const id of M.IDS_SITUATIONS) {
  const sit = M.SITUATIONS[id], v = M.tirerSerie(sit, 4000, 5, true);
  assert.ok(Math.abs(M.ecartType(v) / Math.sqrt(sit.sigma ** 2 + sit.res ** 2 / 12) - 1) < 0.06, `${id} s`);   // l’arrondi à la résolution ajoute res²/12
  assert.ok(Math.abs(M.moyenne(v) - (sit.ref + sit.biais)) < 0.1 * sit.sigma + sit.res, `${id} moyenne`);
}
// type B et type A du même ordre de grandeur (situations choisies)
for (const id of M.IDS_SITUATIONS) { const sit = M.SITUATIONS[id], r = M.incertitudeB(sit.a) / sit.sigma; assert.ok(r > 0.6 && r < 1.6, `${id} uB/sigma ${r}`); }

// deux séries du parcours : la A a un écart-type nettement plus petit
{ const d = M.deuxSeries(); assert.ok(d.sA < d.sB / 3, `${d.sA} ${d.sB}`); assert.ok(Math.abs(M.moyenne(d.A) - M.moyenne(d.B)) < 0.1); }

// défis : reproductibles, réponse atteignable
for (let g = 1; g <= 200; g++) {
  const a = M.tirerDefiA(g), b = M.tirerDefiB(g);
  assert.ok(a.u > 0 && isFinite(a.u)); assert.deepEqual(a.valeurs, M.tirerDefiA(g).valeurs);
  proche(b.vrai, M.incertitudeB((b.max - b.min) / 2)); assert.ok(b.a >= 4 && b.a <= 10);
  // pire cas d'un arrondi à 2 chiffres significatifs de s avant division : écart relatif < 5 %
  const s2 = Number(a.s.toPrecision(2)); assert.ok(Math.abs(s2 / Math.sqrt(a.N) - a.u) / a.u < 0.05);
}
console.log('mesureModele : tous les tests passent');
