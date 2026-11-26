// Test du modèle de la simulation 294 (équations d'oxydo-réduction en milieu acide ou basique). Lancer : node src/simulations/mabModele.test.mjs
import * as M from './mabModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const eg = (a, b, m) => ok(a === b, `${m} : obtenu « ${a} », attendu « ${b} »`);

// 1. Toutes les demi-équations : conservation des éléments et de la charge, en milieu acide et basique ; pas de H⁺ en milieu basique ni de HO⁻ en milieu acide
for (const id of Object.keys(M.COUPLES)) {
  const d = M.demiEquation(id);
  ok(M.equilibre(d.acide.gauche, d.acide.droite), `${id} acide non équilibrée`);
  ok(M.equilibre(d.basique.gauche, d.basique.droite), `${id} basique non équilibrée`);
  const tout = (m, e) => M.coefDe(m.gauche, e) + M.coefDe(m.droite, e);
  ok(tout(d.acide, 'OHm') === 0, `${id} : HO⁻ en milieu acide`);
  ok(tout(d.basique, 'Hp') === 0, `${id} : H⁺ en milieu basique`);
  ok(M.coefDe(d.acide.gauche, 'em') === d.n || M.coefDe(d.acide.droite, 'em') === -d.n, `${id} : électrons`);
  ok(d.n > 0, `${id} : n > 0`);
  // H₂O jamais des deux côtés
  for (const m of [d.acide, d.basique]) ok(!(M.coefDe(m.gauche, 'H2O') && M.coefDe(m.droite, 'H2O')), `${id} : H₂O des deux côtés`);
  // la dernière étape est la demi-équation finale en milieu basique
  const der = d.stades[d.stades.length - 1];
  eg(M.membre(der.gauche) + '=' + M.membre(der.droite), M.membre(d.basique.gauche) + '=' + M.membre(d.basique.droite), `${id} : dernier stade`);
  if (d.k) ok(d.stades.map(s => s.cle).join() === 'depart,element,oxygene,hydrogene,charges,ajoutHO,eau,simplifier', `${id} : stades ${d.stades.map(s => s.cle)}`);
  else ok(d.stades.length === 5, `${id} : stades sans H⁺`);
}

// 2. Demi-équations de référence
const ref = {
  'MnO4m/Mn2p': ['MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O', 'MnO₄⁻ + 4 H₂O + 5 e⁻ = Mn²⁺ + 8 HO⁻'],
  'Cr2O72m/Cr3p': ['Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ = 2 Cr³⁺ + 7 H₂O', 'Cr₂O₇²⁻ + 7 H₂O + 6 e⁻ = 2 Cr³⁺ + 14 HO⁻'],
  'H2O2/H2O': ['H₂O₂ + 2 H⁺ + 2 e⁻ = 2 H₂O', 'H₂O₂ + 2 e⁻ = 2 HO⁻'],
  'O2/H2O2': ['O₂ + 2 H⁺ + 2 e⁻ = H₂O₂', 'O₂ + 2 H₂O + 2 e⁻ = H₂O₂ + 2 HO⁻'],
  'Hp/H2': ['2 H⁺ + 2 e⁻ = H₂', '2 H₂O + 2 e⁻ = H₂ + 2 HO⁻'],
  'ClOm/Clm': ['ClO⁻ + 2 H⁺ + 2 e⁻ = Cl⁻ + H₂O', 'ClO⁻ + H₂O + 2 e⁻ = Cl⁻ + 2 HO⁻'],
  'RCOOm/RCHO': ['RCOO⁻ + 3 H⁺ + 2 e⁻ = RCHO + H₂O', 'RCOO⁻ + 2 H₂O + 2 e⁻ = RCHO + 3 HO⁻'],
  'AlOH4m/Al': ['[Al(OH)₄]⁻ + 4 H⁺ + 3 e⁻ = Al + 4 H₂O', '[Al(OH)₄]⁻ + 3 e⁻ = Al + 4 HO⁻'],
  'NO3m/NO': ['NO₃⁻ + 4 H⁺ + 3 e⁻ = NO + 2 H₂O', 'NO₃⁻ + 2 H₂O + 3 e⁻ = NO + 4 HO⁻'],
};
for (const [id, [a, b]] of Object.entries(ref)) { const d = M.demiEquation(id); eg(M.demiTxt(d, 'acide'), a, id + ' acide'); eg(M.demiTxt(d, 'basique'), b, id + ' basique'); }

// 3. Équations de réaction de référence
const eqRef = {
  'cr-i': 'Cr₂O₇²⁻ + 6 I⁻ + 14 H⁺ → 2 Cr³⁺ + 3 I₂ + 7 H₂O', 'no3-cu': '2 NO₃⁻ + 3 Cu + 8 H⁺ → 2 NO + 3 Cu²⁺ + 4 H₂O',
  'h2o2-fe': 'H₂O₂ + 2 Fe²⁺ + 2 H⁺ → 2 H₂O + 2 Fe³⁺', 'mno4-h2o2': '2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O',
  'mno4-so3': '2 MnO₄⁻ + 3 SO₃²⁻ + H₂O → 2 MnO₂ + 3 SO₄²⁻ + 2 HO⁻', 'al-eau': '2 Al + 6 H₂O + 2 HO⁻ → 3 H₂ + 2 [Al(OH)₄]⁻',
  'clo-h2o2': 'ClO⁻ + H₂O₂ → Cl⁻ + O₂ + H₂O', 'rcho-ag': '2 Ag⁺ + RCHO + 3 HO⁻ → 2 Ag + RCOO⁻ + 2 H₂O', 'rcho-cu': '2 Cu²⁺ + RCHO + 5 HO⁻ → Cu₂O + RCOO⁻ + 3 H₂O',
};
for (const t of M.REACTIONS) {
  const r = M.reaction(t.ox, t.red, t.milieu);
  eg(M.equationTxt(r.final), eqRef[t.id], t.id);
  ok(M.equilibre(r.final.reactifs, r.final.produits), `${t.id} non équilibrée`);
  ok(M.equilibre(r.somme.reactifs, r.somme.produits), `${t.id} somme non équilibrée`);
  const tous = [...r.final.reactifs, ...r.final.produits];
  ok(tous.every(([i]) => i !== 'em'), `${t.id} : électrons dans le bilan`);
  ok(tous.reduce((g, [, c]) => { const f = (a, b) => (b ? f(b, a % b) : a); return f(g, c); }, 0) === 1 || r.facteur >= 1, `${t.id} : coefficients simplifiés`);
  ok(r.m1 * r.n1 === r.N && r.m2 * r.n2 === r.N, `${t.id} : ppcm des électrons`);
  const p = t.milieu === 'basique' ? 'Hp' : 'OHm';
  ok(tous.every(([i]) => i !== p), `${t.id} : ${p} présent en milieu ${t.milieu}`);
  ok(!(M.coefDe(r.final.reactifs, 'H2O') && M.coefDe(r.final.produits, 'H2O')), `${t.id} : H₂O des deux côtés`);
  ok(!(M.coefDe(r.final.reactifs, 'Hp') && M.coefDe(r.final.produits, 'Hp')) && !(M.coefDe(r.final.reactifs, 'OHm') && M.coefDe(r.final.produits, 'OHm')), `${t.id} : H⁺/HO⁻ des deux côtés`);
}
// les réactions acides existent aussi en basique et inversement (même méthode) : test de conservation sur toutes les paires
for (const a of Object.keys(M.COUPLES)) for (const b of Object.keys(M.COUPLES)) if (a !== b) for (const milieu of ['acide', 'basique']) {
  const r = M.reaction(a, b, milieu); ok(M.equilibre(r.final.reactifs, r.final.produits), `${a} + ${b} ${milieu}`);
}

// 4. Défis
for (let i = 0; i < 600; i++) {
  const d = M.tirageDefiDemi(); ok(d.coef >= 1 && Number.isInteger(d.coef), 'défi demi : coefficient');
  const m = d.milieu === 'basique' ? d.d.basique : d.d.acide; ok(M.coefDe(m.gauche, d.cible) + M.coefDe(m.droite, d.cible) === d.coef, 'défi demi : cohérence');
  const e = M.tirageDefiEq(); ok(e.coef >= 1 && M.equilibre(e.r.final.reactifs, e.r.final.produits), 'défi éq');
}
console.log(`mabModele : ${n} vérifications réussies`);
