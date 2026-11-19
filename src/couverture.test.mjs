// Contrôle de src/couverture.js : `node src/couverture.test.mjs`
import { COUVERTURE, ETATS, bilan, couverturesDuNiveau } from './couverture.js';
import { CHAPITRES, NIVEAUX_CHAPITRES } from './chapitres.js';

let erreurs = 0;
const ko = m => { erreurs++; console.error('✗ ' + m); };
const niveaux = new Set(NIVEAUX_CHAPITRES.map(n => n.key));

for (const c of COUVERTURE) {
  if (!niveaux.has(c.niveau)) ko(`${c.id} : niveau inconnu « ${c.niveau} »`);
  if (!c.parties.length) ko(`${c.id} : aucune partie`);
  const vus = new Set();
  for (const p of c.parties) {
    const ou = `${c.id} / ${p.t}`;
    if (!(p.e in ETATS)) ko(`${ou} : état inconnu « ${p.e} »`);
    if (!p.t || !p.th) ko(`${ou} : intitulé ou thème manquant`);
    if (vus.has(p.t)) ko(`${ou} : intitulé en double`);
    vus.add(p.t);
    if (p.e === 'avenir' && p.chap) ko(`${ou} : une partie à venir ne doit pas avoir de chapitre`);
    if (p.e !== 'avenir') {
      const ch = CHAPITRES.find(x => x.id === p.chap);
      if (!ch) ko(`${ou} : chapitre « ${p.chap} » introuvable`);
      else if (ch.niveau !== c.niveau) ko(`${ou} : le chapitre « ${p.chap} » est de niveau ${ch.niveau}, pas ${c.niveau}`);
      else if (!ch.sims.length) ko(`${ou} : le chapitre « ${p.chap} » n'a aucune simulation`);
    }
    if (p.e === 'partiel' && !p.reste) ko(`${ou} : « en partie » sans précision de ce qui manque`);
    if (p.e !== 'partiel' && p.reste) ko(`${ou} : « reste » n'a de sens que pour « partiel »`);
  }
  const b = bilan(c.parties);
  if (b.ok + b.partiel + b.avenir !== b.n) ko(`${c.id} : le bilan ne tombe pas juste`);
  if (b.pourcent < 0 || b.pourcent > 100) ko(`${c.id} : pourcentage hors de 0-100`);
  if (Math.abs((b.fracOk + b.fracPartiel) * 100 - (c.parties.reduce((s, p) => s + ETATS[p.e], 0) / b.n) * 100) > 1e-9) ko(`${c.id} : les fractions de la barre ne correspondent pas au pourcentage`);
  console.log(`${c.id.padEnd(10)} ${String(b.pourcent).padStart(3)} %  (${b.ok} couvertes, ${b.partiel} en partie, ${b.avenir} à venir, sur ${b.n})`);
}

// Un chapitre existant doit apparaître dans au moins une partie (sinon la couverture l'ignore)
for (const n of ['2GT', '1G', 'TG', 'TSTL']) {
  const utilises = new Set(couverturesDuNiveau(n).flatMap(c => c.parties.map(p => p.chap)).filter(Boolean));
  for (const ch of CHAPITRES.filter(x => x.niveau === n)) if (!utilises.has(ch.id)) ko(`${n} : le chapitre « ${ch.id} » n'est rattaché à aucune partie du programme (couverture.js)`);
}

if (erreurs) { console.error(`\n${erreurs} erreur(s)`); process.exit(1); }
console.log('\nOK : couverture.js est cohérent.');
