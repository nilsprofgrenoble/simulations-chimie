// Contrôle des sous-thèmes de « tg-ondes » et « tstl-ondes » : node src/sousThemes.ondes.test.mjs
// Chaque exercice d'un chapitre est dans UN seul sous-thème ; aucune référence orpheline ; pas de doublon.
import { createServer } from 'vite';
import assert from 'node:assert/strict';
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
try {
  const ST = (await vite.ssrLoadModule('/src/sousThemes.ondes.js')).default;
  const { dansSousTheme } = await vite.ssrLoadModule('/src/sousThemes.js');
  const { tousLesExercices } = await vite.ssrLoadModule('/src/simulations/Entrainement.jsx');
  const { CHAPITRES } = await vite.ssrLoadModule('/src/chapitres.js');
  const { exosDuChapitre } = await vite.ssrLoadModule('/src/chapitre.js');
  const tous = tousLesExercices();
  for (const [id, sts] of Object.entries(ST)) {
    const chap = CHAPITRES.find(c => c.id === id); ok(chap, `chapitre inconnu ${id}`);
    ok(sts.length >= 5 && sts.length <= 8, `${id} : 5 à 8 sous-thèmes`);
    ok(new Set(sts.map(s => s.id)).size === sts.length, `${id} : identifiant de sous-thème en double`);
    const refs = sts.flatMap(s => { ok(s.id && s.nom && s.capacite && s.refs.length, `sous-thème incomplet ${s.id}`); return s.refs; });
    ok(new Set(refs).size === refs.length, `${id} : référence en double ${refs.filter((r, i) => refs.indexOf(r) !== i)}`);
    const exos = exosDuChapitre(tous, [id].flatMap(() => chap.domaines)).length; // contrôle de sens uniquement
    const lesExos = tous.filter(e => e.comp !== 'REA' && chap.domaines.includes(e.domaine));
    ok(lesExos.length === exos, 'cohérence exosDuChapitre');
    // chaque exercice dans un seul sous-thème
    for (const e of lesExos) { const k = sts.filter(s => dansSousTheme(e.cle, s)); ok(k.length === 1, `${id} : ${e.cle} classé ${k.length} fois`); }
    // aucune référence orpheline
    for (const r of refs) ok(lesExos.some(e => dansSousTheme(e.cle, { refs: [r] })), `${id} : référence orpheline ${r}`);
    console.log(id, lesExos.length, 'exercices ;', sts.map(s => `${s.id}=${lesExos.filter(e => dansSousTheme(e.cle, s)).length}`).join(' '));
  }
  console.log(`sousThemes.ondes : ${n} vérifications OK`);
} finally { await vite.close(); process.exit(0); }
