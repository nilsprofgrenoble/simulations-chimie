// QCM du parcours guidé de la simulation 183 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue ni la plus courte ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  sources: { options: ['synchrones : même fréquence, déphasage constant', 'de fréquences légèrement différentes l’une de l’autre', 'produites par deux générateurs indépendants', 'sans aucun lien de phase entre elles'], bonne: 0 },
  zones: { options: ['en opposition de phase : crête sur creux', 'en phase : crête sur crête', 'de fréquences différentes : elles se gênent', 'en phase, mais très affaiblies', 'absentes : aucune onde n’y arrive'], bonne: 0 },
  nature: { options: ['destructive : les deux signaux se compensent', 'constructive : les deux signaux s’ajoutent', 'intermédiaire : amplitude entre 0 et 2A, selon Δφ', 'impossible à dire sans connaître A'], bonne: 0 },
  etablir: { options: ['δ = (k + ½)λ, soit ½λ ; 1,5 λ ; 2,5 λ…', 'δ = (2k + 1)λ, soit λ ; 3λ ; 5λ ; 7λ…', 'δ = kλ, soit 0 ; λ ; 2λ…, comme la constructive', 'δ = frac(kλ|2), soit 0 ; ½λ ; λ ; 1,5 λ…'], bonne: 0 },
  lignes: { options: ['la différence de chemin δ = r₂ − r₁', 'la somme r₁ + r₂ des deux distances parcourues', 'la distance r₁ à la source S₁', 'le rapport frac(r₁|r₂) des deux distances'], bonne: 0 },
  effet: { options: ['on écarte les sources ou on augmente la fréquence f', 'on écarte les sources ou on diminue la fréquence', 'on rapproche les sources ou on augmente la fréquence', 'on rapproche les sources, on diminue la fréquence'], bonne: 0 },
  hp: { options: ['très faible : δ = 1,5 λ, donc interférence destructive', 'plus fort qu’avec un seul haut-parleur : δ ≠ 0', 'aussi fort qu’avec un seul haut-parleur, car δ est faible', 'nul : deux sons ne peuvent pas interférer'], bonne: 0 },
};
