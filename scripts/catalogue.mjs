// Catalogue des ressources du site pour la remédiation (appli Trajectoire) : une ligne par simulation et par exercice.
//   node scripts/catalogue.mjs           → écrit public/catalogue.csv (publié sur https://paillasse-virtuelle.fr/catalogue.csv)
//   node scripts/catalogue.mjs --verifier → ne crée rien ; échoue si le fichier est périmé ou si un exercice n'a pas de chapitre
// Toutes les données viennent du code du site (App.jsx, chapitres.js, descriptions.js, Entrainement.jsx) : rien à tenir à jour à la main.
import { createServer } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const SITE = 'https://paillasse-virtuelle.fr/'
const SORTIE = new URL('../public/catalogue.csv', import.meta.url)
const verifier = process.argv.includes('--verifier')

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { CHAPITRES, chapitresDeSim, chapitresDuDomaine } = await vite.ssrLoadModule('/src/chapitres.js')
  const { DESCRIPTIONS } = await vite.ssrLoadModule('/src/descriptions.js')
  const { tousLesExercices } = await vite.ssrLoadModule('/src/simulations/Entrainement.jsx')

  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const sims = [...app.matchAll(/\{\s*id:\s*(\d+),\s*label:\s*"([^"]+)"[\s\S]{0,160}?niveau:\s*"([A-Z0-9]+)"/g)]
    .map(m => ({ id: Number(m[1]), label: m[2], niveau: m[3] })).filter(s => ![39, 40, 47, 79, 80, 81, 82].includes(s.id))  // pages de compte, à propos et jeux : sans intérêt pour la remédiation

  const COMP = { "S'APP": "S'approprier", ANA: 'Analyser', REA: 'Réaliser', VAL: 'Valider' }
  const NOM_NIVEAU = { COMP: 'Compétences' }
  const nettoie = s => String(s ?? '').replace(/\s+/g, ' ').replace(/^[^\p{L}\p{N}]+/u, '').trim()
  const noms = cs => cs.map(c => nettoie(c.label)).join(' | ')
  const niveaux = cs => [...new Set(cs.map(c => c.niveau))].join(' | ')
  const probleme = []

  const lignes = []
  for (const s of sims) {
    const cs = chapitresDeSim(s.id)
    lignes.push({ type: 'simulation', id: `sim${s.id}`, lien: `${SITE}?sim=${s.id}`, niveau: cs.length ? niveaux(cs) : (NOM_NIVEAU[s.niveau] || s.niveau), difficulte: '',
      chapitre: noms(cs), competence: '', theme: '', titre: s.label, description: DESCRIPTIONS[s.label] || '' })
  }
  for (const e of tousLesExercices()) {
    const cs = chapitresDuDomaine(e.domaine)
    const transversal = /transversal/i.test(e.domaine)
    if (!cs.length && !transversal) probleme.push(`${e.cle} : thème « ${e.domaine} » absent de chapitres.js`)
    lignes.push({ type: 'exercice', id: e.cle, lien: `${SITE}?sim=${e.atelier}&ex=${e.ex}`,
      niveau: transversal ? 'tous' : niveaux(cs), difficulte: e.niveau || '', chapitre: transversal ? 'tous chapitres' : noms(cs),
      competence: COMP[e.comp], theme: e.domaine, titre: e.titre, description: '' })
  }

  const COLS = ['type', 'id', 'lien', 'niveau', 'chapitre', 'competence', 'difficulte', 'theme', 'titre', 'description']
  const q = v => /[;"\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v)
  const csv = '﻿' + [COLS.join(';'), ...lignes.map(l => COLS.map(c => q(l[c] ?? '')).join(';'))].join('\n') + '\n'

  const nbSim = lignes.filter(l => l.type === 'simulation').length
  console.log(`${nbSim} simulations, ${lignes.length - nbSim} exercices.`)
  const sansDesc = lignes.filter(l => l.type === 'simulation' && !l.description).map(l => l.titre)
  if (sansDesc.length) console.log(`Sans description (${sansDesc.length}) : ${sansDesc.join(' ; ')}`)
  if (probleme.length) { console.error('PROBLÈME :\n' + probleme.join('\n')); process.exitCode = 1 }
  if (verifier) {
    if (!existsSync(SORTIE) || readFileSync(SORTIE, 'utf8') !== csv) { console.error('public/catalogue.csv est périmé : lancer « node scripts/catalogue.mjs ».'); process.exitCode = 1 }
  } else writeFileSync(SORTIE, csv)
} finally { await vite.close() }
