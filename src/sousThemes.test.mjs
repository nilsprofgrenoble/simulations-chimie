// Tests des sous-thèmes d'un chapitre (données pures) : node src/sousThemes.test.mjs
import assert from 'node:assert/strict';
import { SOUS_THEMES, sousThemesDe, dansSousTheme, repartir } from './sousThemes.js';
import { prochainExercice } from './chapitre.js';
import { CHAPITRES } from './chapitres.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
// Les chapitres de SOUS_THEMES existent ; chaque sous-thème a un nom, une capacité et des références ; aucune référence en double
for (const [id, sts] of Object.entries(SOUS_THEMES)) {
  ok(CHAPITRES.some(c => c.id === id), `chapitre inconnu ${id}`);
  const refs = sts.flatMap(s => { ok(s.id && s.nom && s.capacite && s.refs.length, `sous-thème incomplet ${s.id}`); return s.refs; });
  ok(new Set(refs).size === refs.length, `référence en double dans ${id}`);
  ok(new Set(sts.map(s => s.id)).size === sts.length, `identifiant de sous-thème en double dans ${id}`);
}
ok(sousThemesDe('inconnu').length === 0, 'chapitre sans sous-thème');

// Appartenance : égalité, ou question d'un énoncé (suffixe « .q »), sans confondre deux énoncés dont l'un préfixe l'autre
const st = { refs: ['34:flu-debit', '37:prevoir:diametre'] };
ok(dansSousTheme('34:flu-debit.2', st), 'question d’un énoncé');
ok(dansSousTheme('37:prevoir:diametre', st), 'exercice exact');
ok(!dansSousTheme('34:flu-debit-bis.0', st), 'énoncé voisin non confondu');
ok(!dansSousTheme('37:prevoir:diametre2', st), 'exercice voisin non confondu');

// Répartition sur le chapitre « tstl-fluides » avec des exercices fictifs
const e = (cle, comp = 'ANA', niveau) => ({ cle, comp, niveau, titre: cle });
const exos = [e('34:flu-debit.0', "S'APP"), e('34:flu-debit.1', "S'APP"), e('37:prevoir:pertes'), e('77:plausible:flu-conv-debit', 'VAL', 1), e('37:prevoir:inconnu')];
const r = repartir(exos, 'tstl-fluides');
ok(r.themes.map(t => t.st.id).join() === 'debit,pertes', 'ordre du programme, sous-thèmes vides omis');
ok(r.themes[0].exos.length === 3, 'le sous-thème « débit » regroupe énoncé et VAL');
ok(r.autres.length === 1 && r.autres[0].cle === '37:prevoir:inconnu', 'exercice sans sous-thème conservé à part');
ok(repartir(exos, 'inconnu').themes.length === 0 && repartir(exos, 'inconnu').autres.length === 5, 'chapitre sans sous-thème : tout en « autres »');

// Prochain exercice d'un sous-thème : jamais réussi d'abord ; au hasard parmi ceux de même niveau
const L = [e('a', 'VAL', 1), e('b', 'VAL', 1), e('c', 'VAL', 2)];
const aucune = () => 0;
ok(prochainExercice(L, aucune).exo.cle === 'a', 'sans hasard : le premier du plus bas niveau');
ok(prochainExercice(L, aucune, () => 0.99).exo.cle === 'b', 'avec hasard : un des deux exercices de niveau 1');
ok(prochainExercice(L, aucune, () => 0).exo.cle === 'a', 'avec hasard : tirage minimal');
ok(prochainExercice(L, k => (k === 'a' ? 3 : 0), () => 0.99).exo.cle === 'b', 'un exercice réussi n’est pas reproposé');
ok(prochainExercice(L, () => 3, () => 0.5) === null, 'tout réussi à 3 étoiles : rien à conseiller');
console.log(`sousThemes : ${n} vérifications OK`);
