import { ALCENES, voies, proportions, classeCarbocation, alcene } from './regioModele.js';
const maj = id => proportions(alcene(id)).majeure;
const exp = { propene: ['2-bromopropane', 2], but1ene: ['2-bromobutane', 2], mpropene: ['2-bromo-2-méthylpropane', 3], mbut2ene: ['2-bromo-2-méthylbutane', 3] };
for (const a of ALCENES) {
  const m = maj(a.id), [nom, cl] = exp[a.id];
  if (m.produit !== nom || m.classe !== cl) throw new Error(`${a.id} : majoritaire ${m.produit} (classe ${m.classe})`);
  const p = proportions(a);
  if (Math.abs(p.A + p.B - 100) > 1e-9 || p.majeure.ET1 > p.mineure.ET1) throw new Error('proportions ' + a.id);
  for (const v of voies(a)) if (!v.produit) throw new Error('nom manquant ' + a.id);
}
if (classeCarbocation(alcene('propene'), 1) !== 1 || classeCarbocation(alcene('mbut2ene'), 2) !== 3) throw new Error('classes');
const p = proportions(alcene('propene'));
if (p.majeure.cle !== 'A' || p.ecart !== 15) throw new Error('propène : écart 15 kJ/mol attendu');
console.log('regio ok', ALCENES.map(a => `${a.nom}: ${proportions(a).majeure.produit} ${proportions(a).A.toFixed(2)}/${proportions(a).B.toFixed(2)}`).join(' | '));
