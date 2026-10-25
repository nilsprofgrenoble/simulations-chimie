// Cohérence des énoncés de l'atelier « Extraire les données » : node scripts/verifier-enonces.mjs
import { createServer } from 'vite'
import assert from 'node:assert/strict'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { ENONCES, nouvelEnonce } = await vite.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js')
  const { CHAPITRES } = await vite.ssrLoadModule('/src/chapitres.js')
  const domaines = new Set(CHAPITRES.flatMap(c => c.domaines))
  let n = 0
  for (const e of ENONCES) {
    assert.ok(domaines.has(e.domaine), `${e.id} : domaine « ${e.domaine} » absent de chapitres.js`)
    for (let q = 0; q < e.noms.length; q++) for (let k = 0; k < 20; k++) {
      const { b } = nouvelEnonce(e.id, q), id = `${e.id}.${q}`
      const dansTexte = b.texte.filter(x => typeof x !== 'string').map(x => x.t)
      if (e.id.endsWith('2')) assert.deepEqual([...new Set(dansTexte)].sort(), Object.keys(b.tokens).sort(), `${id} : données du texte ≠ données déclarées`)
      for (const u of b.utiles) assert.ok(b.tokens[u], `${id} : utile inconnu ${u}`)
      for (const t of dansTexte) if (!b.utiles.includes(t)) assert.ok(b.raisons?.[t], `${id} : pas de raison pour la donnée inutile ${t}`)
      assert.ok(b.cherche.faux.length >= 3 && Number.isFinite(b.solution.val), id)
      n++
    }
  }
  console.log(`OK : ${ENONCES.length} énoncés, ${n} tirages vérifiés`)
} finally { await vite.close() }
