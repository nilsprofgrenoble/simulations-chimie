// Envoi du résultat d'un jeu au classement (élèves connectés uniquement ; un visiteur ou un enseignant n'envoie rien).
// Sécurisé côté serveur : jeuDebut() note l'heure de début de la partie ; jeuScore() n'est accepté que si la durée réelle
// (horloge du serveur) est compatible avec le résultat, et le serveur recalcule les étoiles d'« Urgence au labo ».
import { getSession, estEleve, rest } from '../serveur';

const appel = async (fonction, corps) => {
  try {
    if (!estEleve(getSession())) return;
    await rest(`rpc/${fonction}`, { method: 'POST', corps });
  } catch { /* le jeu fonctionne sans le classement */ }
};

export const jeuDebut = (jeu, niveau) => appel('jeu_debut', { p_jeu: jeu, p_niveau: niveau });
export const jeuScore = (jeu, niveau, etoiles, secondes = 0) =>
  appel('jeu_score', { p_jeu: jeu, p_niveau: niveau, p_etoiles: Math.round(etoiles), p_secondes: Math.round(secondes) });
