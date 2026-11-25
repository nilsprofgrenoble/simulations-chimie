// Vérifie le classement des exercices du chapitre « tg-etat-final » : node src/sousThemes.etat-final.test.mjs (lancé via vite pour lire les banques .jsx)
import { createServer } from 'vite';
import assert from 'node:assert/strict';
const vite = await createServer({ root: process.cwd(), logLevel: 'error', server: { middlewareMode: true, hmr: false } });
try {
  const def = (await import('./sousThemes.etat-final.js')).default['tg-etat-final'];
  const { tousLesExercices } = await vite.ssrLoadModule('/src/simulations/Entrainement.jsx');
  const { CHAPITRES } = await vite.ssrLoadModule('/src/chapitres.js');
  const ch = CHAPITRES.find(c => c.id === 'tg-etat-final');
  const exos = tousLesExercices().filter(e => ch.domaines.includes(e.domaine));
  const dans = (cle, st) => st.refs.some(r => cle === r || cle.startsWith(`${r}.`));
  assert.ok(def.length >= 5 && def.length <= 8, 'entre 5 et 8 sous-thèmes');
  for (const st of def) assert.ok(st.id && st.nom && st.capacite && st.refs.length, `incomplet ${st.id}`);
  const tous = def.flatMap(s => s.refs); assert.equal(new Set(tous).size, tous.length, 'référence en double');
  for (const e of exos) assert.equal(def.filter(st => dans(e.cle, st)).length, 1, `${e.cle} : classé ${def.filter(st => dans(e.cle, st)).length} fois`);
  for (const r of tous) assert.ok(exos.some(e => e.cle === r || e.cle.startsWith(`${r}.`)), `référence orpheline ${r}`);
  console.log(`tg-etat-final : ${exos.length} exercices, ${def.length} sous-thèmes`);
  for (const st of def) console.log(' ', st.id, exos.filter(e => dans(e.cle, st)).length);
} finally { await vite.close(); }
