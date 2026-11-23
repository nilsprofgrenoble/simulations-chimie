// Titre, description, adresse et données structurées d'une simulation pour les moteurs de recherche.
// Source UNIQUE : utilisée à la fois par App.jsx (mise à jour de l'onglet en cours de navigation) et par vite.config.js (balises écrites en dur
// dans la page statique de chaque simulation). Les deux ne peuvent donc pas diverger.
import { DESCRIPTIONS } from './descriptions.js'
import { cheminSimulation } from './slugs.js'

export const NOM_SITE = 'Paillasse virtuelle'
export const ADRESSE_SITE = 'https://paillasse-virtuelle.fr/'
export const TITRE_ACCUEIL = `${NOM_SITE} — simulations de chimie et de physique (lycée, BTS, IUT)`
export const DESCRIPTION_ACCUEIL = 'Simulations interactives de chimie et de physique pour la Première, la Terminale STL et le post-bac (BTS Métiers de la chimie, IUT) : parcours guidés, exploration libre, défis et exercices par compétence.'
const NIVEAUX = { '2GT': 'Seconde', '1G': 'Première', TG: 'Terminale générale', TSTL: 'Terminale STL', BTS: 'BTS Métiers de la chimie (post-bac, utilisable en IUT)' }

// Description coupée à la fin d'une phrase (ou d'une virgule) vers 155 caractères
export const resume = (t, max = 155) => {
  if (!t || t.length <= max) return t || ''
  const c = t.slice(0, max)
  const p = Math.max(c.lastIndexOf('. '), c.lastIndexOf(', '))
  return (p > 70 ? c.slice(0, p) : c.slice(0, c.lastIndexOf(' '))) + '…'
}

// s : { id, label, niveau }. Retourne tout ce qu'il faut pour les balises d'une page de simulation.
export function referencementSimulation(s) {
  const niv = NIVEAUX[s.niveau]
  const suffixe = ` — ${NOM_SITE}`
  const titre = (s.label.length + suffixe.length < 120 ? s.label : s.label.slice(0, 118 - suffixe.length).replace(/[\s,:;]+\S*$/, '') + '…') + suffixe   // titre de page ≤ 119 caractères
  const prefixe = niv ? `${niv} : ` : ''
  const description = `${prefixe}${resume(DESCRIPTIONS[s.label], Math.min(155, 186 - prefixe.length)) || `${s.label}, simulation interactive avec parcours guidé, exploration libre et défi.`}`
  const adresse = ADRESSE_SITE + cheminSimulation(s.id, s.label, '')   // base vide : ADRESSE_SITE contient déjà le chemin de base
  const donnees = {
    '@context': 'https://schema.org', '@type': 'LearningResource', name: s.label, description, url: adresse,
    inLanguage: 'fr', learningResourceType: 'simulation interactive', interactivityType: 'active', isAccessibleForFree: true,
    ...(niv ? { educationalLevel: niv } : {}), author: { '@type': 'Person', name: 'Nils Aronssohn' },
    isPartOf: { '@type': 'WebSite', name: NOM_SITE, url: ADRESSE_SITE },
  }
  return { titre, description, adresse, donnees, texteLong: DESCRIPTIONS[s.label] || '' }
}
