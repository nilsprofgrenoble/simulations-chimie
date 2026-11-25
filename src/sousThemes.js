// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES D'UN CHAPITRE : sur la page d'un chapitre, l'élève ne voit plus une liste de 40 exercices mais quelques cartes (un sous-thème = une
//  capacité exigible du programme). Chaque carte ouvre le prochain exercice adapté ; les variations d'un sous-thème (S'APP, ANA, VAL) restent
//  en réserve : l'élève n'a pas à les choisir. La liste complète reste consultable (bloc replié, pour le professeur).
//  Données pures (sans React), testées par sousThemes.test.mjs. Un chapitre absent de SOUS_THEMES garde l'ancienne présentation (listes par compétence).
//  Références = clés de progression des exercices (voir tousLesExercices) : « 37:prevoir:diametre » (ANA), « 77:plausible:… » (VAL),
//  « 34:flu-debit » (S'APP : toutes les questions de l'énoncé), « 35:pompe » (graphique). Un exercice appartient à un seul sous-thème.
// ═══════════════════════════════════════════════════════════════════════════
import evolution1g from './sousThemes.evolution-1g.js';
import composition from './sousThemes.composition.js';
import etatFinal from './sousThemes.etat-final.js';
import signaux from './sousThemes.tstl-signaux.js';
import ondes from './sousThemes.ondes.js';
import st_1g_chimie from './sousThemes.1g-chimie.js';
import st_1g_meca_elec from './sousThemes.1g-meca-elec.js';
import st_1g_ondes from './sousThemes.1g-ondes.js';
import st_2gt_matiere from './sousThemes.2gt-matiere.js';
import st_2gt_physique_a from './sousThemes.2gt-physique-a.js';
import st_2gt_physique_b from './sousThemes.2gt-physique-b.js';
import st_bts_a from './sousThemes.bts-a.js';
import st_bts_b from './sousThemes.bts-b.js';
import st_tg_chimie from './sousThemes.tg-chimie.js';
import st_tg_physique_b from './sousThemes.tg-physique-b.js';
import st_tstl_a from './sousThemes.tstl-a.js';
import st_tstl_b from './sousThemes.tstl-b.js';

export const SOUS_THEMES = {
  ...evolution1g, ...composition, ...etatFinal, ...signaux, ...ondes,
  ...st_1g_chimie, ...st_1g_meca_elec, ...st_1g_ondes, ...st_2gt_matiere, ...st_2gt_physique_a, ...st_2gt_physique_b, ...st_bts_a, ...st_bts_b, ...st_tg_chimie, ...st_tg_physique_b, ...st_tstl_a, ...st_tstl_b,
  'tstl-fluides': [
    { id: 'debit', nom: 'Le débit d’un liquide', capacite: 'Relier débit massique, débit volumique et masse volumique ; changer d’unité.',
      refs: ['34:flu-debit', '77:plausible:flu-conv-debit', '77:compat:debit-2methodes'] },
    { id: 'conservation', nom: 'Vitesse et section d’une conduite', capacite: 'Relier débit, vitesse et section ; exploiter la conservation du débit.',
      refs: ['37:probleme:tuyau', '37:relation:retrecissement', '37:hypothese:conservation', '37:prevoir:diametre', '77:plausible:vitesse-eau', '34:flu-section', '34:conduite'] },
    { id: 'statique', nom: 'La pression dans un liquide au repos', capacite: 'Exploiter la pression, la force pressante et la loi de la statique des fluides.',
      refs: ['37:hypothese:statique', '37:hypothese:flu-hyp-vases', '37:relation:reservoir', '37:prevoir:hauteur', '77:plausible:pression-cuve', '77:plausible:pression-cuve-ok', '77:plausible:flu-tube-u-huile-ok', '34:reservoir'] },
    { id: 'mesure', nom: 'Mesurer une pression ou un niveau', capacite: 'Mesurer une pression ; estimer la hauteur de liquide dans un réservoir.',
      refs: ['37:probleme:niveau', '34:flu-statique', '35:manometre', '77:compat:rho-eau'] },
    { id: 'bernoulli', nom: 'Bernoulli et effet Venturi', capacite: 'Exploiter le théorème de Bernoulli ; expliquer l’effet Venturi.',
      refs: ['37:hypothese:bernoulli', '37:prevoir:cinetique', '37:prevoir:torricelli', '77:plausible:flu-venturi', '77:compat:flu-jet-torricelli'] },
    { id: 'pertes', nom: 'Les pertes de charge', capacite: 'Voir l’effet de la vitesse, de la longueur et de la section sur les pertes d’énergie.',
      refs: ['37:prevoir:pertes', '37:prevoir:pertes-longueur', '37:prevoir:pertes-diametre', '37:prevoir:pertes-vanne', '37:relation:pertes-bernoulli', '77:plausible:flu-pertes-conduite', '77:plausible:flu-pertes-conduite-ok'] },
    { id: 'pompe', nom: 'La pompe : puissance et rendement', capacite: 'Exploiter Bernoulli avec une pompe ; puissance utile, puissance absorbée, rendement.',
      refs: ['37:relation:pompe', '37:probleme:cuve', '77:plausible:p-hydraulique', '77:plausible:flu-pompe-hauteur-ok', '34:flu-pompe', '35:pompe'] },
  ],
};

export const sousThemesDe = chapId => SOUS_THEMES[chapId] || [];
// Une clé appartient à une référence si elle lui est égale ou si c'est une question de l'énoncé référencé (« 34:flu-debit.2 » pour « 34:flu-debit »)
export const dansSousTheme = (cle, st) => st.refs.some(r => cle === r || cle.startsWith(`${r}.`));

// Répartit les exercices d'un chapitre : { themes: [{ st, exos }] (dans l'ordre du programme, sous-thèmes vides omis), autres: exercices sans sous-thème }
export function repartir(exosChap, chapId) {
  const sts = sousThemesDe(chapId);
  const themes = sts.map(st => ({ st, exos: exosChap.filter(e => dansSousTheme(e.cle, st)) })).filter(t => t.exos.length);
  const classes = new Set(themes.flatMap(t => t.exos.map(e => e.cle)));
  return { themes, autres: exosChap.filter(e => !classes.has(e.cle)) };
}
