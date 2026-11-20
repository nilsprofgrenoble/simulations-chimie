// Contrôle scientifique de la simulation 187 (facteurs cinétiques, catalyse, choix d'un capteur) : node src/simulations/facteursCinModele.test.mjs
//  1. chaque équation (transformations et situations) conserve les atomes et la charge, formules analysées par programme ;
//  2. le capteur qui « convient » suit la règle du programme (espèce colorée, ions, H₃O⁺/HO⁻, gaz) à partir des espèces ;
//  3. le modèle : t½ divisé par 2 pour +10 °C, proportionnel à 1/c(excès), divisé par le facteur du catalyseur ; c(t½) = moitié ; durées plausibles ;
//  4. les tirages des défis : propriétés des paires d'expériences, aucun paramètre absent de la transformation, effets cohérents.
import assert from 'node:assert/strict';
import * as M from './facteursCinModele.js';

// 1. équations
const toutes = [...Object.values(M.REACTIONS).map(r => [r.id, r.especes]), ...Object.values(M.SITUATIONS).map(s => ['sit:' + s.id, s.especes])];
for (const [id, especes] of toutes) {
  const b = M.bilanEquation(especes);
  assert.deepEqual(b.reactif.atomes, b.produit.atomes, `${id} : atomes non conservés ${JSON.stringify(b)}`);
  assert.equal(b.reactif.charge, b.produit.charge, `${id} : charge non conservée`);
  console.log('ok équation', id, ':', M.equationTexte(especes));
}
// formules : vérifications ponctuelles de l'analyseur
assert.deepEqual(M.analyserFormule('(CH₃)₃C–Cl').atomes, { C: 4, H: 9, Cl: 1 });
assert.deepEqual(M.analyserFormule('CH₃COOC₂H₅').atomes, { C: 4, H: 8, O: 2 });
assert.deepEqual(M.analyserFormule('S₂O₈²⁻'), { atomes: { S: 2, O: 8 }, charge: -2, dernier: 'O' });
assert.equal(M.analyserFormule('H₃O⁺').charge, 1);

// 2. règle des capteurs
const derive = e => ({
  couleur: e.some(x => ['mol', 'ion'].includes(x.type) && x.couleur !== 'incolore'),
  gaz: e.some(x => x.type === 'gaz'),
  ions: e.some(x => x.type === 'ion'),
  acidobase: e.some(x => ['H₃O⁺', 'HO⁻'].includes(x.f)),
});
for (const s of Object.values(M.SITUATIONS)) {
  const d = derive(s.especes);
  if (s.id === 'violet') { d.ions = false; d.acidobase = false; }     // HO⁻ en très large excès : la quantité d'ions et le pH ne varient pas (hypothèse écrite dans la situation)
  assert.deepEqual(d, s.props, `situation ${s.id} : propriétés déclarées ${JSON.stringify(s.props)} ≠ dérivées ${JSON.stringify(d)}`);
  for (const c of M.ORDRE_CAPTEURS) {
    assert.ok(s.capteurs[c], `situation ${s.id} : capteur ${c} sans raison`);
    assert.equal(s.capteurs[c][0], !!M.regleCapteur(s.props, c), `situation ${s.id}, capteur ${c} : ne suit pas la règle`);
    assert.ok(s.capteurs[c][1].length > 20, `raison trop courte (${s.id}/${c})`);
  }
  assert.ok(M.capteursValides(s).length >= 1);
}
// transformations du simulateur : la règle s'applique aux capteurs proposés (le conductimètre n'est pas proposé pour le peroxodisulfate)
const propsPers = { couleur: true, gaz: false, ions: false, acidobase: false };
for (const R of Object.values(M.REACTIONS)) {
  assert.ok(R.suivi.cMax > 0 && R.t12ref > 0 && R.horizon > R.t12ref / 10);
  for (const c of R.proposes) assert.ok(R.capteurs[c], `${R.id} : capteur ${c} proposé sans raison`);
  assert.ok(R.proposes.some(c => R.capteurs[c][0]), `${R.id} : aucun capteur ne convient`);
  const props = R.id === 'persulfate' ? propsPers : M.SITUATIONS[R.id].props;
  for (const c of R.proposes) assert.equal(R.capteurs[c][0], !!M.regleCapteur(props, c), `${R.id}/${c}`);
}
assert.ok(!M.REACTIONS.persulfate.proposes.includes('conduct'));
// le suivi doit porter sur une espèce de l'équation, du bon côté
for (const R of Object.values(M.REACTIONS)) {
  const e = R.especes.find(x => x.f === R.suivi.f); assert.ok(e, `${R.id} : espèce suivie absente`);
  assert.equal(e.role, R.suivi.sens === 'reactif' ? 'reactif' : 'produit');
  if (R.exces) { const x = R.especes.find(y => y.f === R.exces.f); assert.ok(x && x.role === 'reactif', `${R.id} : excès`); assert.ok(R.exces.valeurs.length === 5 && R.exces.iRef === 2); }
}

// 3. modèle
for (const R of Object.values(M.REACTIONS)) {
  const c0 = M.condRef(R.id);
  assert.ok(Math.abs(M.t12(R.id, c0) - R.t12ref) < 1e-9);
  assert.ok(Math.abs(M.t12(R.id, { ...c0, T: 30 }) - R.t12ref / 2) < 1e-9);
  assert.ok(Math.abs(M.t12(R.id, { ...c0, T: 40 }) - R.t12ref / 4) < 1e-9);
  assert.ok(Math.abs(M.t12(R.id, { ...c0, T: 10 }) - R.t12ref * 2) < 1e-9);
  if (R.exces) { const i = c0.iB; assert.ok(Math.abs(M.t12(R.id, { ...c0, iB: i + 1 }) - R.t12ref / 2) < 1e-9 && Math.abs(M.t12(R.id, { ...c0, iB: i - 1 }) - R.t12ref * 2) < 1e-9); }
  if (R.catalyseurs) for (const [k, f] of Object.entries(R.catalyseurs)) assert.ok(Math.abs(M.t12(R.id, { ...c0, cat: k }) - R.t12ref / f) < 1e-9);
  // c(t½) = moitié ; départ et limite
  const th = M.t12(R.id, c0), mid = R.suivi.cMax / 2;
  assert.ok(Math.abs(M.concSuivi(R.id, c0, th) - mid) < 1e-9);
  assert.ok(Math.abs(M.concSuivi(R.id, c0, 0) - M.concInit(R.id)) < 1e-12);
  let prev = M.concSuivi(R.id, c0, 0);
  for (let k = 1; k <= 200; k++) { const v = M.concSuivi(R.id, c0, R.horizon * k / 200); assert.ok(R.suivi.sens === 'reactif' ? v <= prev : v >= prev); prev = v; }
  // durées plausibles : de la seconde à quelques heures sur toutes les combinaisons proposées par les menus
  let tmin = Infinity, tmax = 0;
  for (const T of M.TEMPERATURES) for (let iB = 0; iB < (R.exces ? 5 : 1); iB++) for (const cat of ['aucun', ...(R.catalyseurs ? Object.keys(R.catalyseurs) : [])]) { const t = M.t12(R.id, { T, iB, cat }); tmin = Math.min(tmin, t); tmax = Math.max(tmax, t); }
  console.log(`ok ${R.id} : t½ de ${M.formatDuree(tmin)} à ${M.formatDuree(tmax)} (référence ${M.formatDuree(R.t12ref)}, fenêtre ${M.formatDuree(R.horizon)})`);
  assert.ok(tmin >= 1, `${R.id} : t½ minimal < 1 s`);
  assert.ok(tmax <= 5 * 24 * 3600, `${R.id} : t½ maximal > 5 jours`);
}
// séance de TP : la référence de chaque transformation est mesurable dans la fenêtre de temps affichée (sauf l'eau oxygénée SANS catalyseur, lente à dessein)
for (const R of Object.values(M.REACTIONS)) { const th = M.t12(R.id, M.condRef(R.id)); if (R.id !== 'h2o2') assert.ok(R.horizon / th >= 5, `${R.id} : fenêtre trop courte`); }
assert.ok(M.REACTIONS.h2o2.horizon / M.t12('h2o2', M.condRef('h2o2')) < 0.2, 'eau oxygénée sans catalyseur : lente à l’échelle du TP');
assert.ok(M.REACTIONS.h2o2.horizon / M.t12('h2o2', { ...M.condRef('h2o2'), cat: 'fe3' }) > 4, 'avec Fe³⁺ : mesurable dans la fenêtre');
// le catalyseur ne change pas l'état final (même plateau) : c∞ indépendant des conditions
for (const R of Object.values(M.REACTIONS)) for (const cat of ['aucun', ...(R.catalyseurs ? Object.keys(R.catalyseurs) : [])]) {
  const v = M.concSuivi(R.id, { ...M.condRef(R.id), cat, T: 50 }, 1e9); assert.ok(Math.abs(v - (R.suivi.sens === 'reactif' ? 0 : R.suivi.cMax)) < 1e-9);
}
// la catalase n'agit pas sur le peroxodisulfate (catalyseur spécifique), Fe³⁺ agit sur les deux
assert.equal(M.facteurCat('persulfate', 'catalase'), 1); assert.ok(M.facteurCat('persulfate', 'fe3') > 1); assert.ok(M.facteurCat('h2o2', 'catalase') > M.facteurCat('h2o2', 'fe3') && M.facteurCat('h2o2', 'fe3') > 1);

// 4. tirages
const comptes = { rid: {}, effets: {}, params: {} }; let minEcart = Infinity;
for (let i = 0; i < 20000; i++) {
  const d = M.tirageDefiFacteurs();
  const R = M.REACTIONS[d.rid], ok = M.parametres(d.rid);
  d.changes.forEach(c => assert.ok(ok.includes(c.param), `paramètre ${c.param} absent de ${d.rid}`));
  assert.notEqual(d.changes[0].param, d.changes[1].param);
  const [E1, E2, E3] = d.E;
  for (const E of d.E) { assert.ok(E.T >= 10 && E.T <= 50 && E.T % 5 === 0); if (R.exces) assert.ok(E.iB >= 0 && E.iB <= 4); assert.ok(E.cat === 'aucun' || R.catalyseurs[E.cat] !== undefined); }
  // (E1,E2) ne diffèrent que par le paramètre p ; (E2,E3) que par q ; (E1,E3) par deux paramètres
  const diff = (a, b) => ['T', 'iB', 'cat'].filter(k => a[k] !== b[k]);
  assert.equal(diff(E1, E2).length, 1); assert.equal(diff(E2, E3).length, 1); assert.equal(diff(E1, E3).length, 2);
  assert.ok(E2.cat === 'aucun' || E1.cat === 'aucun');
  // effets : changement de T, de c ou ajout de catalyseur : effet attendu
  d.changes.forEach((c, k) => {
    const r = d.ratios[k], eff = M.effetChangement(r);
    if (c.param === 'T') assert.equal(eff, c.vers > c.de ? 'rapide' : 'lente');
    if (c.param === 'c') assert.equal(eff, c.vers > c.de ? 'rapide' : 'lente');
    if (c.param === 'cat') assert.ok(eff === (d.rid === 'persulfate' && c.vers === 'catalase' ? 'aucun' : 'rapide'));
    comptes.effets[eff] = (comptes.effets[eff] || 0) + 1; comptes.params[c.param] = (comptes.params[c.param] || 0) + 1;
  });
  comptes.rid[d.rid] = (comptes.rid[d.rid] || 0) + 1;
  // sur le graphique, E1 et E3 doivent rester distinguables au moins une fois (sinon trois courbes superposées)
  const t = d.E.map(c => M.t12(d.rid, c)); minEcart = Math.min(minEcart, Math.min(Math.abs(Math.log(t[0] / t[1])), Math.abs(Math.log(t[1] / t[2]))) || Infinity);
  assert.ok(Math.min(...t) >= R.horizon / 60 && Math.max(...t) <= 4 * R.horizon, `courbe illisible (${d.rid} ${t.map(M.formatDuree)})`);
}
console.log('ok tirages facteurs', JSON.stringify(comptes), 'écart minimal (ln) hors « sans effet » :', minEcart.toFixed(2));
for (let i = 0; i < 2000; i++) {
  const d = M.tirageDefiCatalyseur(), tt = Object.fromEntries(d.experiences.map(e => [e.id, M.t12(d.rid, e.cond)])), tb = M.t12(d.rid, d.base);
  assert.ok(tt.fe3 < tb / 4 && tt.iodure < tb / 1.5 && Math.abs(tt.nitrate - tb) < 1e-9);
  assert.equal(d.experiences.length, 3);
  // seul le catalyseur est retrouvé intact ET accélère ; le réactif est consommé ; le spectateur n'accélère pas
  const rep = d.experiences.filter(e => e.apres === e.avant && M.t12(d.rid, e.cond) < tb);
  assert.equal(rep.length, 1); assert.equal(rep[0].vraiment, 'catalyseur');
  // la consommation de I⁻ annoncée correspond au modèle : 2 × c∞(I₂) × 100 mL
  const conso = 2 * M.REACTIONS.persulfate.suivi.cMax * 0.100; assert.ok(Math.abs(d.experiences.find(e => e.id === 'iodure').avant - d.experiences.find(e => e.id === 'iodure').apres - conso) < 1e-9);
}
console.log('ok tirages catalyseur');
console.log('TOUS LES CONTRÔLES DU MODÈLE PASSENT');
