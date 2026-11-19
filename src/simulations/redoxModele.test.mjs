// Tests du modèle d'oxydo-réduction (sim 156). Lancer : node src/simulations/redoxModele.test.mjs
import * as M from './redoxModele.js';
let ko = 0;
const ok = (c, m) => { if (!c) { ko++; console.log('ÉCHEC :', m); } };
const eq = (a, b, m) => ok(a === b, `${m} : obtenu « ${a} », attendu « ${b} »`);

// demi-équations (méthode en quatre temps)
const dem = (ox, red) => M.demiTxt(M.demiEquation(ox, red));
eq(dem('Cu2p', 'Cu'), 'Cu²⁺ + 2 e⁻ = Cu', 'Cu2+/Cu');
eq(dem('Agp', 'Ag'), 'Ag⁺ + e⁻ = Ag', 'Ag+/Ag');
eq(dem('Fe3p', 'Fe2p'), 'Fe³⁺ + e⁻ = Fe²⁺', 'Fe3+/Fe2+');
eq(dem('Al3p', 'Al'), 'Al³⁺ + 3 e⁻ = Al', 'Al3+/Al');
eq(dem('I2', 'Im'), 'I₂ + 2 e⁻ = 2 I⁻', 'I2/I-');
eq(dem('Hp', 'H2'), '2 H⁺ + 2 e⁻ = H₂', 'H+/H2');
eq(dem('MnO4m', 'Mn2p'), 'MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O', 'MnO4-/Mn2+');
eq(dem('Cr2O72m', 'Cr3p'), 'Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ = 2 Cr³⁺ + 7 H₂O', 'Cr2O7/Cr3+');
eq(dem('O2', 'H2O2'), 'O₂ + 2 H⁺ + 2 e⁻ = H₂O₂', 'O2/H2O2');

// équations de réaction
const R = (c1, c2) => M.equationTxt(M.equilibrer(c1, c2));
eq(R('Cu2p/Cu', 'Fe2p/Fe'), 'Fe(s) + Cu²⁺(aq) → Fe²⁺(aq) + Cu(s)', 'Fe + Cu2+');
eq(R('Ag+/Ag', 'Cu2p/Cu'), 'Cu(s) + 2 Ag⁺(aq) → Cu²⁺(aq) + 2 Ag(s)', 'Cu + Ag+');
eq(R('Ag+/Ag', 'Zn2p/Zn'), 'Zn(s) + 2 Ag⁺(aq) → Zn²⁺(aq) + 2 Ag(s)', 'Zn + Ag+');
eq(R('Cu2p/Cu', 'Al3p/Al'), '2 Al(s) + 3 Cu²⁺(aq) → 2 Al³⁺(aq) + 3 Cu(s)', 'Al + Cu2+');
eq(R('Fe3p/Fe2p', 'I2/Im'), '2 I⁻(aq) + 2 Fe³⁺(aq) → I₂(aq) + 2 Fe²⁺(aq)', 'Fe3+ + I-');
eq(R('Fe3p/Fe2p', 'Fe2p/Fe'), 'Fe(s) + 2 Fe³⁺(aq) → 3 Fe²⁺(aq)', 'Fe + Fe3+');
eq(R('Hp/H2', 'Al3p/Al'), '2 Al(s) + 6 H⁺(aq) → 2 Al³⁺(aq) + 3 H₂(g)', 'Al + H+');
eq(R('MnO4m/Mn2p', 'Fe3p/Fe2p'), '5 Fe²⁺(aq) + MnO₄⁻(aq) + 8 H⁺(aq) → 5 Fe³⁺(aq) + Mn²⁺(aq) + 4 H₂O(l)', 'MnO4- + Fe2+');
eq(R('Cr2O72m/Cr3p', 'Fe3p/Fe2p'), '6 Fe²⁺(aq) + Cr₂O₇²⁻(aq) + 14 H⁺(aq) → 6 Fe³⁺(aq) + 2 Cr³⁺(aq) + 7 H₂O(l)', 'Cr2O7 + Fe2+');

// toute transformation proposée : demi-équations OK, équation conservée (éléments et charge), plus petits entiers, électrons absents
for (const t of M.TRANSFORMATIONS) {
  const r = M.equationDe(t), b = M.bilan(r);
  ok(b.ok, `${t.id} : équation non conservée`);
  ok(M.verifierEquation(r, r).juste, `${t.id} : verifierEquation(ref, ref) devrait être juste`);
  ok(![...r.reactifs, ...r.produits].some(([id]) => id === 'em'), `${t.id} : électrons dans l'équation`);
  ok(r.m1 * r.n1 === r.m2 * r.n2, `${t.id} : électrons échangés différents`);
  ok(M.COUPLES[t.couple2][1] === r.reactifs[0][0], `${t.id} : le réducteur doit être le premier réactif`);
  if (t.plaque) ok(t.plaque === M.COUPLES[t.couple2][1] || t.id === 'fe-fe3', `${t.id} : plaque incohérente`);
  if (t.depot) ok(t.depot === M.COUPLES[t.couple1][1], `${t.id} : dépôt incohérent`);
}

// vérification d'équations fausses
const faux1 = { reactifs: [['Cu', 1], ['Agp', 1]], produits: [['Cu2p', 1], ['Ag', 1]] };
const v1 = M.verifierEquation(faux1);
ok(!v1.juste && !v1.charge && v1.manque.length === 0, 'Cu + Ag+ : charge non conservée seulement');
const faux2 = { reactifs: [['Cu', 1], ['Agp', 2]], produits: [['Cu2p', 1], ['Ag', 1]] };
const v2 = M.verifierEquation(faux2);
ok(!v2.juste && v2.manque.includes('Ag'), 'Ag non conservé');
const v3 = M.verifierEquation({ reactifs: [['Cu', 2], ['Agp', 4]], produits: [['Cu2p', 2], ['Ag', 4]] });
ok(v3.ok && !v3.plusPetits && !v3.juste, 'multiple de la bonne équation : conservée mais pas les plus petits entiers');
ok(!M.verifierEquation({ reactifs: [['Cu', 0], ['Agp', 2]], produits: [['Cu2p', 1], ['Ag', 2]] }).juste, 'coefficient nul refusé');

// espèces
eq(M.texte('MnO4m', true), 'MnO₄⁻(aq)', 'texte MnO4-');
eq(M.texte('Cr2O72m'), 'Cr₂O₇²⁻', 'texte Cr2O7');
eq(M.coupleTxt('I2/Im'), 'I₂/I⁻', 'texte couple');
console.log(ko ? `${ko} échec(s)` : 'redoxModele : tous les tests passent');
process.exit(ko ? 1 : 0);
