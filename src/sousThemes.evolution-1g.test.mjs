// Vérifie que chaque exercice du chapitre 1g-evolution est dans un seul sous-thème, sans référence orpheline : node scripts/... (lancé via vite)
import { createServer } from 'vite';
import assert from 'node:assert/strict';
const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { default: ST } = await vite.ssrLoadModule('/src/sousThemes.evolution-1g.js');
  const { dansSousTheme } = await vite.ssrLoadModule('/src/sousThemes.js');
  const { tousLesExercices } = await vite.ssrLoadModule('/src/simulations/Entrainement.jsx');
  const { CHAPITRES } = await vite.ssrLoadModule('/src/chapitres.js');
  const ch = CHAPITRES.find(c => c.id === '1g-evolution'), sts = ST['1g-evolution'];
  const exos = tousLesExercices().filter(e => ch.domaines.includes(e.domaine));
  let n = 0;
  for (const e of exos) { const k = sts.filter(s => dansSousTheme(e.cle, s)); assert.equal(k.length, 1, `${e.cle} : ${k.length} sous-thèmes`); n++; }
  const cles = exos.map(e => e.cle);
  for (const s of sts) for (const r of s.refs) assert.ok(cles.some(c => c === r || c.startsWith(`${r}.`)), `référence orpheline ${r}`);
  const refs = sts.flatMap(s => s.refs); assert.equal(new Set(refs).size, refs.length, 'doublon');
  console.log(`${n} exercices classés ; ` + sts.map(s => `${s.id}=${exos.filter(e => dansSousTheme(e.cle, s)).length}`).join(' '));
} finally { await vite.close(); }
