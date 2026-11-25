// Vérifie, pour chaque chapitre doté de sous-thèmes : aucun exercice dans deux sous-thèmes, aucune référence orpheline,
// et (sauf exceptions assumées) aucun exercice sans sous-thème. Lancé : node src/sousThemes.chapitres.test.mjs
import { createServer } from 'vite';
import assert from 'node:assert/strict';
// Aucun exercice d'un chapitre ne reste sans sous-thème (les exercices hors programme du niveau sont écartés du chapitre par « hors » dans chapitres.js)
const AUTORISE_HORS_THEME = {};
const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { SOUS_THEMES, dansSousTheme } = await vite.ssrLoadModule('/src/sousThemes.js');
  const { tousLesExercices } = await vite.ssrLoadModule('/src/simulations/Entrainement.jsx');
  const { CHAPITRES } = await vite.ssrLoadModule('/src/chapitres.js');
  const { exosDuChapitre } = await vite.ssrLoadModule('/src/chapitre.js');
  const tous = tousLesExercices();
  for (const [id, sts] of Object.entries(SOUS_THEMES)) {
    const ch = CHAPITRES.find(c => c.id === id); assert.ok(ch, `chapitre inconnu ${id}`);
    const exos = exosDuChapitre(tous, ch);
    let sans = 0;
    for (const e of exos) {
      const k = sts.filter(s => dansSousTheme(e.cle, s)).length;
      assert.ok(k <= 1, `${id} : ${e.cle} dans ${k} sous-thèmes`);
      if (k === 0) sans++;
    }
    assert.ok(sans <= (AUTORISE_HORS_THEME[id] || 0), `${id} : ${sans} sans sous-thème : ` + exos.filter(e => !sts.some(s => dansSousTheme(e.cle, s))).map(e => e.cle).join(" "));
    const cles = tous.map(e => e.cle);
    for (const s of sts) for (const r of s.refs) assert.ok(cles.some(c => c === r || c.startsWith(`${r}.`)), `${id} : référence orpheline ${r}`);
    console.log(`${id} : ${exos.length} exercices, ${sans} hors sous-thème ; ` + sts.map(s => `${s.id}=${exos.filter(e => dansSousTheme(e.cle, s)).length}`).join(' '));
  }
} finally { await vite.close(); }
