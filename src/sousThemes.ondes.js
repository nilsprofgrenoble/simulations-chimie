// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres « tg-ondes » (Terminale spécialité) et « tstl-ondes » (TSTL SPCL · Ondes).
//  Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES.
//  Les exercices du thème « Ondes » (Doppler, réseau, son, échographie, diffraction et Young « Ondes ») figurent dans les deux chapitres :
//  chaque chapitre les range dans son propre sous-thème. Chaque exercice est dans UN seul sous-thème de chaque chapitre.
// ═══════════════════════════════════════════════════════════════════════════

// Références communes aux deux chapitres (thème « Ondes »)
const DIFF_ONDES = ['34:ondDiffraction', '37:probleme:ond-fil-diametre', '37:relation:ond-rel-diffraction-fil', '37:hypothese:ond-hyp-diffraction-fente',
  '37:prevoir:ond-diffraction-fente', '37:prevoir:ond-diffraction-longueur-onde', '37:prevoir:ond-diffraction-ecran-recule', '37:prevoir:ond-diffraction-situation',
  '77:plausible:ond-diff-nm-non-converti', '77:plausible:ond-diff-fente-ok', '77:plausible:ond-cuve-ouverture-ok', '77:compat:ond-fil-fabricant'];
const YOUNG_ONDES = ['34:ondYoung', '37:relation:ond-rel-young-fentes', '37:hypothese:ond-hyp-young-interfrange', '37:prevoir:ond-young-ecart-fentes', '37:prevoir:ond-young-couleur',
  '77:plausible:ond-young-interfrange-ok', '77:plausible:ond-young-mm-m', '77:compat:ond-young-deux-methodes'];
const ITF_ONDES = ['37:prevoir:ond-interferences-retard-entier', '37:prevoir:ond-interferences-retard-demi'];
const RESEAU = ['34:ondReseau', '37:relation:ond-rel-reseau-lambda', '37:hypothese:ond-hyp-reseau-formule', '37:prevoir:ond-reseau-pas-divise', '37:prevoir:ond-reseau-lumiere-blanche',
  '37:prevoir:ond-reseau-nombre-taches', '37:prevoir:ond-reseau-interet', '37:prevoir:ond-spectro-principe', '37:prevoir:ond-spectro-recouvrement',
  '77:plausible:ond-reseau-sinus-superieur-un', '77:plausible:ond-reseau-pas-ok', '77:plausible:ond-reseau-traits-par-mm', '77:plausible:ond-spectro-angle-ok', '77:compat:ond-reseau-laser-vert'];
const DOPPLER = ['34:dop-chariot', '34:dopg-laser', '37:hypothese:ond-hyp-doppler', '37:prevoir:dop-sens', '37:prevoir:dop-proportion', '37:prevoir:dop-duree',
  '37:prevoir:dopg-derriere', '37:prevoir:dopg-limite', '37:prevoir:dopg-lumiere', '77:plausible:dop-val-vitesse', '77:plausible:dopg-val-laser'];
const ECHO = ['34:ondEcho', '37:prevoir:ech-aller-retour', '37:prevoir:ech-frequence-resolution', '37:prevoir:ech-interface-gel', '37:prevoir:e2d-eventail',
  '37:prevoir:e2d-profondeur-apparente', '37:prevoir:e2d-frequence-profondeur', '77:plausible:ech-profondeur-sans-moitie', '77:plausible:e2d-frequence-double-profondeur'];

export default {
  'tg-ondes': [
    { id: 'diffraction', nom: 'La diffraction d’une onde', capacite: 'Exploiter la relation θ = λ / a : relier l’angle caractéristique de diffraction, la longueur d’onde et la taille de l’ouverture, puis la largeur de la tache centrale.',
      refs: [...DIFF_ONDES, '34:dif-sapp-fente', '37:prevoir:dif-ana-fente', '37:prevoir:dif-ana-couleur', '37:prevoir:dif-ana-porte', '77:plausible:dif-val-degres', '77:plausible:dif-val-tache'] },
    { id: 'interferences', nom: 'Interférences : constructives ou destructives', capacite: 'Prévoir, à partir de la différence de chemin ou du retard, si deux ondes issues de sources en phase interfèrent de façon constructive ou destructive.',
      refs: [...ITF_ONDES, '34:itf-sapp-cuve', '34:itf-sapp-hp', '37:prevoir:itf-ana-source', '37:prevoir:itf-ana-casque', '77:plausible:itf-val-delta', '77:plausible:itf-val-silence'] },
    { id: 'young', nom: 'Les franges de Young', capacite: 'Exploiter l’interfrange i = λ·D / b d’un dispositif à deux fentes ou deux trous (b : distance entre les fentes).',
      refs: [...YOUNG_ONDES, '34:you-sapp-young', '37:prevoir:you-ana-trous', '37:prevoir:you-ana-couleur', '37:prevoir:you-ana-sombre', '77:plausible:you-val-unite', '77:plausible:you-val-pointe'] },
    { id: 'doppler', nom: 'L’effet Doppler', capacite: 'Exploiter le décalage Doppler δf = f_e·v / c pour déterminer une vitesse ; prévoir le sens du décalage de fréquence.',
      refs: DOPPLER },
    { id: 'niveau-sonore', nom: 'Intensité et niveau sonore', capacite: 'Relier l’intensité sonore et le niveau d’intensité L = 10 log (I / I₀) ; exploiter l’atténuation avec la distance et par absorption.',
      refs: ['34:isn-sapp-niveau', '37:relation:ond-rel-niveau-intensite', '37:prevoir:son-distance-niveau', '37:prevoir:son-sources-identiques', '37:prevoir:isn-ana-distance', '37:prevoir:isn-ana-facteur', '37:prevoir:isn-ana-champ-libre',
        '77:plausible:son-deux-sources-niveau', '77:plausible:isn-val-somme', '77:plausible:isn-val-niveau', '77:plausible:isn-val-distance'] },
    { id: 'reseau', nom: 'Pour aller plus loin : le réseau', capacite: 'Exploiter la formule des réseaux sin θ = k·λ / a pour mesurer une longueur d’onde ou prévoir les ordres observables (approfondissement).',
      refs: RESEAU },
    { id: 'son-ultrasons', nom: 'Pour aller plus loin : timbre et ultrasons', capacite: 'Distinguer hauteur et timbre d’un son ; exploiter un écho d’ultrasons (distance, résolution, absorption) (approfondissement).',
      refs: ['37:prevoir:son-hauteur-timbre', ...ECHO] },
  ],
  'tstl-ondes': [
    { id: 'diffraction', nom: 'La diffraction d’une onde', capacite: 'Prévoir comment la figure de diffraction change avec la longueur d’onde et la largeur de la fente ; déterminer une largeur à partir de la tache centrale.',
      refs: DIFF_ONDES },
    { id: 'interferences', nom: 'Interférences et franges de Young', capacite: 'Prévoir la nature d’une interférence à partir du retard entre deux ondes ; exploiter l’interfrange d’un dispositif à deux fentes.',
      refs: [...ITF_ONDES, ...YOUNG_ONDES] },
    { id: 'reseau', nom: 'Le réseau : mesurer une longueur d’onde', capacite: 'Exploiter la formule des réseaux sin θ = k·λ / a ; expliquer le principe du spectrophotomètre à réseau.',
      refs: RESEAU },
    { id: 'doppler', nom: 'L’effet Doppler', capacite: 'Exploiter le décalage Doppler δf = f_e·v / c pour déterminer une vitesse ; prévoir le sens du décalage de fréquence.',
      refs: DOPPLER },
    { id: 'son', nom: 'Le son : hauteur, timbre et niveau sonore', capacite: 'Distinguer hauteur et timbre ; relier l’intensité sonore au niveau en décibels et prévoir l’effet d’une distance ou d’une source de plus.',
      refs: ['37:relation:ond-rel-niveau-intensite', '37:prevoir:son-distance-niveau', '37:prevoir:son-sources-identiques', '37:prevoir:son-hauteur-timbre', '77:plausible:son-deux-sources-niveau'] },
    { id: 'echographie', nom: 'Ultrasons et échographie', capacite: 'Déterminer une distance à partir du retard d’un écho ; choisir la fréquence d’une sonde (résolution et absorption).',
      refs: ECHO },
  ],
};
