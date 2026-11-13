// Titre, description, adresse et données structurées d'une simulation pour les moteurs de recherche.
// Source UNIQUE : utilisée à la fois par App.jsx (mise à jour de l'onglet en cours de navigation) et par vite.config.js (balises écrites en dur
// dans la page statique de chaque simulation). Les deux ne peuvent donc pas diverger.
import { DESCRIPTIONS } from './descriptions.js'
import { cheminSimulation } from './slugs.js'

export const NOM_SITE = 'Paillasse virtuelle'
export const ADRESSE_SITE = 'https://paillasse-virtuelle.fr/'
export const TITRE_ACCUEIL = `${NOM_SITE} — simulations de chimie et de physique (lycée, BTS)`
export const DESCRIPTION_ACCUEIL = 'Simulations interactives de chimie et de physique pour la Première, la Terminale STL et le BTS Métiers de la chimie : parcours guidés, exploration libre, défis et exercices par compétence.'
const NIVEAUX = { '2GT': 'Seconde', '1G': 'Première', TSTL: 'Terminale STL', BTS: 'BTS Métiers de la chimie' }

// Description coupée à la fin d'une phrase (ou d'une virgule) vers 155 caractères
export const resume = t => {
  if (!t || t.length <= 155) return t || ''
  const c = t.slice(0, 155)
  const p = Math.max(c.lastIndexOf('. '), c.lastIndexOf(', '))
  return (p > 70 ? c.slice(0, p) : c.slice(0, c.lastIndexOf(' '))) + '…'
}

// s : { id, label, niveau }. Retourne tout ce qu'il faut pour les balises d'une page de simulation.
export function referencementSimulation(s) {
  const niv = NIVEAUX[s.niveau]
  const titre = `${s.label} — ${NOM_SITE}`
  const description = `${niv ? `${niv} : ` : ''}${resume(DESCRIPTIONS[s.label]) || `${s.label}, simulation interactive avec parcours guidé, exploration libre et défi.`}`
  const adresse = ADRESSE_SITE + cheminSimulation(s.id, s.label, '')   // base vide : ADRESSE_SITE contient déjà le chemin de base
  const donnees = {
    '@context': 'https://schema.org', '@type': 'LearningResource', name: s.label, description, url: adresse,
    inLanguage: 'fr', learningResourceType: 'simulation interactive', interactivityType: 'active', isAccessibleForFree: true,
    ...(niv ? { educationalLevel: niv } : {}), author: { '@type': 'Person', name: 'Nils Aronssohn' },
    isPartOf: { '@type': 'WebSite', name: NOM_SITE, url: ADRESSE_SITE },
  }
  return { titre, description, adresse, donnees, texteLong: DESCRIPTIONS[s.label] || '' }
}
