// ═══════════════════════════════════════════════════════════════════════════
//  CLASSEMENT PUBLIC : logique pure (sans React ni réseau). Les scores sont calculés par le serveur
//  (fonction « classement_public », supabase/13-classement.sql) à partir des mêmes données que le carnet.
//  Seuls les élèves qui l'ont choisi apparaissent : pseudo (liste fixe de src/classe.js), établissement, classe et score.
// ═══════════════════════════════════════════════════════════════════════════

// Les lames (classements), dans l'ordre où on les fait défiler. « code » = clé renvoyée par le serveur.
export const LAMES = [
  { code: 'etoiles', titre: 'Étoiles', icone: '⭐', unite: ['étoile', 'étoiles'], couleur: '#b45309', fond: '#fef3c7',
    sous: 'Toutes les étoiles gagnées : 3 pour un exercice réussi du premier coup, 2 après une erreur, 1 sinon.' },
  { code: 'semaine', titre: 'Cette semaine', icone: '🔥', unite: ['exercice', 'exercices'], couleur: '#c2410c', fond: '#ffedd5',
    sous: 'Exercices et défis réussis depuis lundi. Le classement repart de zéro chaque lundi : tout le monde peut y entrer !' },
  { code: 'defis', titre: 'Défis', icone: '🎯', unite: ['défi', 'défis'], couleur: '#be185d', fond: '#fce7f3',
    sous: 'Nombre de défis de simulations réussis.' },
  { code: 'regularite', titre: 'Régularité', icone: '📅', unite: ['semaine', 'semaines'], couleur: '#0f766e', fond: '#ccfbf1',
    sous: 'Nombre de semaines différentes où l’élève a travaillé sur le site : travailler un peu, souvent, ça paie.' },
];

export const libelleScore = (lame, n) => `${n} ${n > 1 ? lame.unite[1] : lame.unite[0]}`;
export const medaille = rang => (rang === 1 ? '🥇' : rang === 2 ? '🥈' : rang === 3 ? '🥉' : null);

// Une ligne du classement est-elle celle de l'élève connecté ? moi = { adj, nom, classe, etab } (ou null)
export const estMoi = (ligne, moi) => !!moi && ligne.adj === moi.adj && ligne.nom === moi.nom && ligne.classe === moi.classe && ligne.etab === (moi.etab || '').trim();

// Lignes d'une lame, telles que renvoyées par le serveur (jamais plus de 30), tableau vide si rien
export const lignesDe = (donnees, code) => (Array.isArray(donnees?.lames?.[code]) ? donnees.lames[code] : []);

// Lundi de la semaine en cours, pour l'affichage (« depuis lundi 9 novembre »)
export const jourLundi = donnees => {
  const d = donnees?.lundi ? new Date(donnees.lundi) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
};
