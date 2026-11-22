// Logique du bouton « Un problème ? » (sans composant React) : motifs, ouverture depuis le pied de page, contexte joint au signalement.
import { modeSimCourant } from './suivi';

export const MOTIFS = [
  ['reponse', 'Une réponse attendue me paraît fausse'],
  ['enonce', 'Je ne comprends pas l’énoncé ou la consigne'],
  ['bug', 'Ça ne marche pas ou l’affichage est cassé'],
  ['texte', 'Une faute, un texte ou un schéma peu clair'],
  ['autre', 'Autre chose'],
];
export const NOMS_MODES = { guide: 'Parcours guidé', explore: 'Exploration libre', defi: 'Défi' };

export const ouvrirSignalement = () => window.dispatchEvent(new Event('signaler-probleme'));

// Contexte lu dans la page au moment de l'ouverture
export function contexteActuel(activeId, titre) {
  const lire = sel => Array.from(document.querySelectorAll(sel));
  const mode = modeSimCourant();
  const etape = mode === 'guide' ? lire('[data-etape-parcours]')[0]?.getAttribute('data-etape-parcours') || null : null;
  const codes = [...new Set(lire('[data-code-exo]').map(e => (e.textContent || '').trim()).filter(Boolean))].slice(0, 3);
  const tactile = window.matchMedia?.('(pointer: coarse)').matches;
  return {
    page: `${window.location.pathname}${window.location.search}`.slice(0, 400),
    sim_id: activeId > 0 ? activeId : null,
    sim_titre: activeId > 0 ? (titre || null) : null,
    mode: mode || null,
    etape,
    code_exo: codes.length ? codes.join(' ').slice(0, 40) : null,
    appareil: `${tactile ? 'tactile' : 'souris'} ${window.innerWidth}×${window.innerHeight} ${navigator.userAgent}`.slice(0, 200),
  };
}
