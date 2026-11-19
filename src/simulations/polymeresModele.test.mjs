// Test du modèle « familles fonctionnelles et polymères » : node src/simulations/polymeresModele.test.mjs
import * as M from './polymeresModele.js';
let n = 0;
const ok = (c, msg) => { if (!c) { console.error('ÉCHEC :', msg); process.exit(1); } n++; };
const IND = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
// compteur d'atomes d'une formule semi-développée écrite à la main / par le modèle (parenthèses, indices Unicode)
function comptePar(s) {
  const pile = [{}]; let i = 0;
  const ajoute = (o, e, k) => { o[e] = (o[e] || 0) + k; };
  while (i < s.length) {
    const ch = s[i];
    if (ch === '–') { i++; continue; }
    if (ch === '(') { pile.push({}); i++; continue; }
    if (ch === ')') { const o = pile.pop(); i++; let k = 0; while (IND[s[i]] !== undefined) { k = k * 10 + IND[s[i]]; i++; } k = k || 1; for (const e in o) ajoute(pile[pile.length - 1], e, o[e] * k); continue; }
    let el = ch; i++;
    if (/[a-z]/.test(s[i] || '')) { el += s[i]; i++; }
    let k = 0; while (IND[s[i]] !== undefined) { k = k * 10 + IND[s[i]]; i++; }
    ajoute(pile[pile.length - 1], el, k || 1);
  }
  return pile[0];
}
const egal = (a, b) => { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].every(k => (a[k] || 0) === (b[k] || 0)); };

for (const m of M.MOLECULES) {
  ok(M.valide(m), `valence : ${m.nom}`);
  // aucun carbone à 5 liaisons, aucun H négatif ; chaque atome a la bonne valence
  m.atoms.forEach((a, i) => { const h = M.nbH(m, i); ok(h >= 0, `${m.nom} : atome ${i} (${a.el}) valence dépassée`); if (!['C', 'N', 'O'].includes(a.el)) ok(h === 0, `${m.nom} : ${a.el} doit faire 1 liaison`); });
  // formule brute calculée = formule lue sur la semi-développée (deux chemins de calcul)
  ok(egal(M.compte(m), comptePar(m.sd)), `${m.nom} : brute ${m.brute} ≠ semi-développée ${m.sd}`);
  // pas de chevauchement de deux atomes
  for (let i = 0; i < m.atoms.length; i++) for (let j = i + 1; j < m.atoms.length; j++) ok(Math.hypot(m.atoms[i].x - m.atoms[j].x, m.atoms[i].y - m.atoms[j].y) > 0.9, `${m.nom} : atomes ${i} et ${j} superposés`);
  // famille déclarée = groupe repéré sur le dessin ; nom écrit = nom calculé à partir du dessin
  const g = M.groupes(m);
  ok(g.length === 1 && g[0].fam === m.famille, `${m.nom} : groupe repéré ${JSON.stringify(g.map(x => x.fam))} ≠ ${m.famille}`);
  if (M.NOUVELLES.includes(m.famille)) ok(M.nomDepuisGraphe(m) === m.nom, `${m.nom} : nom calculé « ${M.nomDepuisGraphe(m)} »`);
  // un nom ne se répète pas ; pas d'indice « _ » ni de « ÷ »
  ok(M.MOLECULES.filter(x => x.nom === m.nom).length === 1, `nom en double ${m.nom}`);
  ok(!/_|÷|\^/.test(m.nom + m.sd + m.brute), `caractère interdit ${m.nom}`);
}
// formules brutes de référence (écrites à la main)
const REF = { 'éthanoate de méthyle': 'C₃H₆O₂', 'éthanoate d’éthyle': 'C₄H₈O₂', 'méthanoate de méthyle': 'C₂H₄O₂', 'propanoate de méthyle': 'C₄H₈O₂', 'butanoate d’éthyle': 'C₆H₁₂O₂',
  'éthanamine': 'C₂H₇N', 'N-méthylméthanamine': 'C₂H₇N', 'N,N-diméthylméthanamine': 'C₃H₉N', 'propan-2-amine': 'C₃H₉N', 'N-méthyléthanamine': 'C₃H₉N',
  'éthanamide': 'C₂H₅NO', 'méthanamide': 'CH₃NO', 'N-méthyléthanamide': 'C₃H₇NO', 'N,N-diméthyléthanamide': 'C₄H₉NO', 'propanamide': 'C₃H₇NO',
  'chlorométhane': 'CH₃Cl', 'bromoéthane': 'C₂H₅Br', '2-chloropropane': 'C₃H₇Cl', '1-bromobutane': 'C₄H₉Br', 'acide éthanoïque': 'C₂H₄O₂', 'propanone': 'C₃H₆O', 'propanal': 'C₃H₆O', 'propan-2-ol': 'C₃H₈O' };
for (const [nom, b] of Object.entries(REF)) ok(M.molParNom(nom).brute === b, `${nom} : ${M.molParNom(nom).brute} ≠ ${b}`);
const SD = { 'éthanoate de méthyle': 'CH₃–CO–O–CH₃', 'propan-2-amine': 'CH₃–CH(NH₂)–CH₃', 'N-méthyléthanamide': 'CH₃–CO–NH–CH₃', 'N,N-diméthylméthanamine': 'CH₃–N(CH₃)–CH₃', 'méthanamide': 'HCO–NH₂', 'acide éthanoïque': 'CH₃–COOH', '2-chloropropane': 'CH₃–CHCl–CH₃', 'propanal': 'CH₃–CH₂–CHO', 'N,N-diméthyléthanamide': 'CH₃–CO–N(CH₃)–CH₃' };
for (const [nom, s] of Object.entries(SD)) ok(M.molParNom(nom).sd === s, `${nom} : sd ${M.molParNom(nom).sd} ≠ ${s}`);
// classes des amines
ok(M.classeAmine(M.molParNom('éthanamine'), 1) === 'primaire' && M.classeAmine(M.molParNom('N-méthyléthanamine'), 2) === 'secondaire' && M.classeAmine(M.molParNom('N,N-diméthylméthanamine'), 1) === 'tertiaire', 'classes');
// polymères : valence du segment (extrémités = liaisons ouvertes), brute du segment = k × motif
for (const p of M.POLYMERES) {
  const g = M.segmentPolymere(p.id, 3);
  g.atoms.forEach((a, i) => { const h = i < 6 ? M.hSegment(g, i) : M.nbH(g, i); ok(h >= 0, `${p.id} atome ${i}`); });
  const c = M.bruteSegment(g), mot = comptePar(p.brute);
  ok(c.C === 3 * mot.C && c.H === 3 * mot.H && c.Cl === 3 * (mot.Cl || 0), `${p.id} : segment ${JSON.stringify(c)} ≠ 3 × ${p.brute}`);
  ok(egal(comptePar(p.motif), mot), `${p.id} : motif ${p.motif} ≠ ${p.brute}`);
  ok(p.nC === mot.C, `${p.id} nC`);
  const mm = 12 * mot.C + 1 * mot.H + 35.5 * (mot.Cl || 0);
  ok(Math.abs(mm - M.masseMotif(p.id)) < 1e-9 && Math.abs(mm - p.M) < 1e-9, `${p.id} masse molaire du motif ${mm}`);
}
// nom calculé : cas particuliers
const nm = (...a) => M.nomDepuisGraphe(M.chaine(...a));
ok(nm(['C', 'C', 'O', 'C'], [[1, 'O', 2]]) === 'éthanoate de méthyle', 'nom éthanoate de méthyle');
console.log(`polymeresModele : ${n} contrôles réussis (${M.MOLECULES.length} molécules, ${M.POLYMERES.length} polymères).`);
