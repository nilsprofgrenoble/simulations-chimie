// Envoi du meilleur résultat d'un jeu au classement (élèves connectés uniquement ; un visiteur ou un enseignant n'envoie rien).
// Le serveur garde le meilleur résultat par jeu et par niveau (jamais un recul) et borne les valeurs.
import { getSession, estEleve, rest } from '../serveur';

export async function enregistrerJeu(jeu, niveau, etoiles, secondes = 0) {
  try {
    if (!estEleve(getSession())) return;
    const e = Math.max(1, Math.min(3, Math.round(etoiles)));
    const s = Math.max(0, Math.min(300, Math.round(secondes)));
    await rest('jeux_scores?on_conflict=user_id,jeu,niveau', {
      method: 'POST',
      corps: { jeu, niveau, etoiles: e, secondes: s },
      entetes: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  } catch { /* le jeu fonctionne sans le classement */ }
}
