// Lit la liste des simulations dans src/App.jsx (tableau SIMULATIONS) sans exécuter l'application : { id, label, niveau }.
// Même principe que scripts/cartes.mjs. Utilisé par vite.config.js (pages statiques, plan du site) et par src/slugs.test.mjs.
import { readFileSync } from 'node:fs'

export function lireSimulations(source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')) {
  const debut = source.indexOf('const SIMULATIONS = [')
  const fin = source.indexOf('SIMULATIONS.forEach(', debut)
  if (debut < 0 || fin < 0) throw new Error('Tableau SIMULATIONS introuvable dans src/App.jsx')
  const bloc = source.slice(debut, fin)
  return [...bloc.matchAll(/\{\s*id:\s*(\d+),\s*label:\s*"([^"]+)"([^}]*?)\}/g)].map(m => ({
    id: Number(m[1]), label: m[2], niveau: (m[3].match(/niveau:\s*"(\w+)"/) || [])[1] || '',
  }))
}
