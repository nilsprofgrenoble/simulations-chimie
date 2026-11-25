// Sous-thèmes du chapitre « Prévoir l'état final d'un système, siège d'une transformation chimique » (Terminale spécialité).
// Même structure que SOUS_THEMES (src/sousThemes.js) : à intégrer par fusion. Un exercice appartient à un seul sous-thème.
export default {
  'tg-etat-final': [
    { id: 'qr-k', nom: 'Qr, K et le sens d’évolution', capacite: 'Calculer le quotient de réaction, le comparer à la constante d’équilibre K pour prévoir le sens d’évolution ; déterminer K d’une réaction acide-base à partir des pK_A.',
      refs: ['34:equ-sapp-qr.0', '34:equ-sapp-etat', '37:prevoir:equ-ana-sens', '37:prevoir:equ-ana-ajout', '37:prevoir:equ-ana-qr-final', '37:prevoir:etf-k-pka', '77:plausible:equ-val-qr', '77:plausible:equ-val-sens', '77:plausible:etf-val-k-pka', '36:equ-calcul'] },
    { id: 'taux', nom: 'État final et taux d’avancement', capacite: 'Calculer et interpréter le taux d’avancement final ; distinguer une transformation totale d’une transformation non totale.',
      refs: ['34:equ-sapp-qr.1', '37:prevoir:equ-ana-non-totale', '37:prevoir:equ-ana-tau', '77:plausible:equ-val-tau'] },
    { id: 'acides', nom: 'Force d’un acide ou d’une base : K_A et pK_A', capacite: 'Relier le pH, la constante d’acidité K_A et le pK_A à la force d’un acide ou d’une base dans l’eau ; utiliser le produit ionique de l’eau.',
      refs: ['34:fab-sapp-ka', '34:fab-sapp-compar', '37:prevoir:fab-ana-fort-faible', '37:prevoir:fab-ana-comparer', '37:prevoir:fab-ana-dilution', '37:prevoir:fab-ana-equation', '37:prevoir:fab-ana-ke', '37:prevoir:etf-bases-force', '77:plausible:fab-val-fort', '77:plausible:fab-val-ka', '77:plausible:fab-val-impossible', '77:plausible:fab-val-pka', '77:plausible:etf-val-bases', '36:fab-calcul'] },
    { id: 'predominance', nom: 'Prédominance et distribution', capacite: 'Exploiter un diagramme de prédominance ou de distribution d’un couple acide-base ; choisir un indicateur coloré.',
      refs: ['34:pdi-sapp-couple', '34:pdi-sapp-indic', '37:prevoir:pdi-ana-predominance', '37:prevoir:pdi-ana-distribution', '37:prevoir:pdi-ana-croisement', '37:prevoir:pdi-ana-indicateur', '77:plausible:pdi-val-fraction', '77:plausible:pdi-val-croisement', '77:plausible:pdi-val-indicateur', '77:plausible:pdi-val-ammonium', '36:pdi-calcul'] },
    { id: 'tampon', nom: 'Les solutions tampon', capacite: 'Expliquer le rôle d’une solution tampon, la reconnaître, prévoir l’effet d’un ajout d’acide ou de base et préparer un tampon de pH donné.',
      refs: ['34:tmp-sapp-ajout', '34:tmp-sapp-prepa', '37:prevoir:tmp-ana-propriete', '37:prevoir:tmp-ana-composition', '37:prevoir:tmp-ana-reaction', '37:prevoir:tmp-ana-dilution', '77:plausible:tmp-val-neutre', '77:plausible:tmp-val-dilution', '77:plausible:tmp-val-limite', '77:plausible:tmp-val-ammoniacal', '36:tmp-calcul'] },
    { id: 'aminoacides', nom: 'Les acides α-aminés', capacite: 'Identifier la forme (cation, zwitterion, anion) d’un acide α-aminé selon le pH à l’aide de ses pK_A.',
      refs: ['34:aam-sapp-cation', '34:aam-sapp-anion', '37:prevoir:aam-ana-forme', '37:prevoir:aam-ana-domaine', '37:prevoir:aam-ana-amphotere', '37:prevoir:aam-ana-distribution', '77:plausible:aam-val-ordre', '77:plausible:aam-val-neutre', '77:plausible:aam-val-rapport', '77:plausible:aam-val-sang', '36:aam-calcul'] },
    { id: 'piles', nom: 'Les piles : fonctionnement et capacité', capacite: 'Décrire une pile (pôles, sens des électrons, pont salin) et déterminer sa capacité électrique et sa durée de fonctionnement.',
      refs: ['34:pil-sapp-capacite', '34:pil-sapp-duree', '37:prevoir:pil-ana-pont', '37:prevoir:pil-ana-polarite', '37:prevoir:pil-ana-volume', '37:prevoir:pil-ana-electrons', '77:plausible:pil-val-pont', '77:plausible:pil-val-facteur2', '77:plausible:pil-val-duree', '77:plausible:pil-val-tension', '36:pil-calcul'] },
    { id: 'electrolyse', nom: 'L’électrolyse : une évolution forcée', capacite: 'Interpréter une évolution forcée ; relier charge, quantité de matière et masse déposée ; durée d’une recharge.',
      refs: ['34:ely-sapp-zingage', '34:ely-sapp-recharge', '37:prevoir:ely-ana-tension', '37:prevoir:ely-ana-noms', '37:prevoir:ely-ana-intensite', '37:prevoir:ely-ana-qr', '77:plausible:ely-val-facteur2', '77:plausible:ely-val-duree', '77:plausible:ely-val-spontane', '77:plausible:ely-val-minutes', '36:ely-calcul'] },
  ],
};
