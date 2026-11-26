// Jeux rattachés à des chapitres : ce que l'élève voit sur la page de son chapitre (carte « Jouer pour s'entraîner »).
// Module pur. La visibilité est décidée par jeuOuvert (jeuxVisibles.js) : tant qu'un jeu n'est pas ouvert à tous, seul l'administrateur voit la carte.
export const JEUX_CATALOGUE = {
  290: { nom: 'Laser Maze', icone: '🔦', couleur: '#0b4f94', savoir: 'Réflexion, réfraction, réflexion totale, dispersion de la lumière blanche',
    accroche: "Oriente miroirs, lame de verre et prisme pour envoyer le laser (rouge, vert, bleu ou lumière blanche) sur la cible. 8 niveaux." },
  291: { nom: 'Urgence au labo : dilutions', icone: '🧪', couleur: '#c2410c', savoir: 'Dilution, facteur de dilution, verrerie jaugée',
    accroche: "Un ballon s'emballe sous la paillasse : prépare vite les bonnes solutions avant qu'il n'explose. Calculatrice intégrée." },
};
