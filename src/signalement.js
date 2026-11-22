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

// État de la simulation : réglages et réponses saisis (curseurs, menus, cases, champs) et messages affichés (verdicts, erreurs).
// Jamais de mot de passe ni d'adresse email ; texte seulement, 3 000 caractères au plus.
export function etatActuel() {
  const nettoyer = t => (t || '').replace(/\s+/g, ' ').trim();
  const visible = el => el.getClientRects().length > 0 && !el.closest('[role="dialog"], header, nav, footer, [data-signaler]');
  const lignes = [];
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (!visible(el) || ['password', 'email', 'tel', 'hidden', 'file', 'search'].includes(el.type)) return;
    const nom = nettoyer(el.getAttribute('aria-label') || el.labels?.[0]?.textContent || el.closest('label')?.textContent || el.id || el.name || el.type).slice(0, 50);
    if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) lignes.push(`${nom} : coché`); return; }
    const v = el.tagName === 'SELECT' ? nettoyer(el.selectedOptions[0]?.textContent) : nettoyer(el.value);
    if (v) lignes.push(`${nom} : ${v.slice(0, 80)}`);
  });
  document.querySelectorAll('button[aria-pressed="true"]').forEach(el => { if (visible(el)) { const t = nettoyer(el.textContent); if (t) lignes.push(`Choisi : ${t.slice(0, 60)}`); } });
  document.querySelectorAll('[role="status"], [role="alert"]').forEach(el => { if (visible(el)) { const t = nettoyer(el.textContent); if (t) lignes.push(`Message affiché : ${t.slice(0, 300)}`); } });
  return [...new Set(lignes)].join('\n').slice(0, 3000) || null;
}

// Réduit une photo ou une capture : JPEG, 1 280 px au plus, moins de 350 Ko (le stockage refuse au-delà de 400 Ko).
export async function reduireImage(fichier) {
  const bmp = await createImageBitmap(fichier);
  const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
  for (const q of [0.8, 0.65, 0.5, 0.35]) {
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', q));
    if (blob && blob.size <= 350000) return blob;
  }
  throw new Error('Image trop lourde.');
}

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
    etat: etatActuel(),
    appareil: `${tactile ? 'tactile' : 'souris'} ${window.innerWidth}×${window.innerHeight} ${navigator.userAgent}`.slice(0, 200),
  };
}
