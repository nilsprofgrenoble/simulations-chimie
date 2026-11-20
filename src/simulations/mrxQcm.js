// QCM du parcours guidé de la simulation 186 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue ; l'affichage mélange l'ordre des choix). Chaque explication traite les mauvaises réponses.
export const QCM = {
  sites: {
    q: 'Dans la liaison C–Br, quel atome porte la charge partielle δ+ ?',
    options: ['le carbone, car il est moins électronégatif que le brome', 'le brome, car son noyau est plus gros que celui du carbone', 'aucun : le doublet de liaison est partagé de façon égale', 'les deux, car la liaison est covalente et non ionique'],
    bonne: 0,
    indice: 'Dans une liaison, l’atome le plus électronégatif attire davantage le doublet : il prend la charge partielle δ−, l’autre prend δ+.',
    expl: 'Br (2,96) est plus électronégatif que C (2,55) : il attire le doublet de la liaison, donc Br est δ− et C est δ+. Ce n’est pas la taille de l’atome qui décide, mais l’électronégativité. Les électronégativités sont différentes, donc le doublet n’est pas partagé également : la liaison est polarisée. Deux charges partielles de même signe sont impossibles dans une liaison neutre : l’une est δ+, l’autre δ−.',
  },
  sens: {
    q: 'Pourquoi la flèche issue de la liaison C–Br pointe-t-elle vers le brome ?',
    options: ['le doublet de la liaison reste sur Br, l’atome le plus électronégatif', 'le brome possède des doublets non liants qu’il donne au carbone', 'le carbone doit garder tous les électrons de la liaison pour former O–C', 'une flèche courbe suit toujours le sens de déplacement des atomes'],
    bonne: 0,
    indice: 'Quand une liaison polarisée se rompt, son doublet va sur l’atome qui l’attirait déjà le plus. Et le carbone ne peut pas avoir cinq liaisons.',
    expl: 'La liaison C–Br se rompt parce que le carbone vient de former une liaison avec O : il ne peut pas en avoir cinq. Son doublet va sur Br, plus électronégatif, qui devient Br⁻ avec quatre doublets non liants. Ce n’est pas Br qui donne un doublet au carbone : dans cet acte, le donneur est HO⁻. Le carbone ne garde pas ces électrons : ils passent sur Br. Une flèche courbe suit des électrons, pas des atomes.',
  },
  prep: {
    q: 'Dans l’acte 1, une espèce apporte le doublet qui formera la nouvelle liaison C–H. Laquelle ?',
    options: ['C₂H₄, dont la liaison double est riche en électrons', 'H₃O⁺, dont l’oxygène porte un doublet non liant', 'H₃O⁺, dont l’hydrogène est δ+ et attire les électrons', 'C₂H₄, parce que c’est la plus grosse des deux espèces'],
    bonne: 0,
    indice: 'Le donneur de doublet est riche en électrons ; l’accepteur est pauvre en électrons (charge +, δ+). Regarde les polarisations δ sur le schéma.',
    expl: 'La liaison double C=C de C₂H₄ est riche en électrons : l’un de ses doublets (liaison π) va former la liaison C–H. H₃O⁺ est l’accepteur : son hydrogène est δ+, il est pauvre en électrons. Le doublet non liant de l’oxygène de H₃O⁺ ne se déplace pas dans cet acte. La taille d’une espèce ne décide pas du sens de déplacement des électrons.',
  },
  inter: {
    q: 'Quelles espèces sont des intermédiaires réactionnels dans ce mécanisme ?',
    options: ['C₂H₅⁺ et C₂H₅OH₂⁺', 'H₃O⁺ et H₂O', 'C₂H₄ et C₂H₅OH', 'H₃O⁺, C₂H₅⁺ et C₂H₅OH₂⁺'],
    bonne: 0,
    indice: 'Cherche les espèces qui sont produits d’un acte puis réactifs d’un acte suivant, et qui ne figurent ni au début ni à la fin du mécanisme.',
    expl: 'C₂H₅⁺ est formé à l’acte 1 puis consommé à l’acte 2 ; C₂H₅OH₂⁺ est formé à l’acte 2 puis consommé à l’acte 3 : ce sont des intermédiaires, absents du bilan. H₃O⁺ est présent dès le départ (consommé à l’acte 1, régénéré à l’acte 3) : c’est le catalyseur. H₂O est un réactif : consommée aux actes 2 et 3, formée une seule fois. C₂H₄ et C₂H₅OH sont le réactif de départ et le produit final. Une charge + ne suffit pas à faire un intermédiaire : il faut être formé puis consommé.',
  },
  cata: {
    q: 'Quelle espèce est le catalyseur de l’hydratation ?',
    options: ['H₃O⁺', 'H₂O', 'C₂H₅⁺', 'C₂H₄'],
    bonne: 0,
    indice: 'Un catalyseur est consommé par un acte, puis reformé par un acte suivant : on le retrouve intact à la fin.',
    expl: 'H₃O⁺ est consommé à l’acte 1 puis reformé à l’acte 3 : il est présent au départ et à la fin, donc absent du bilan. C’est la définition d’un catalyseur. H₂O est un réactif : il est consommé aux actes 2 et 3 et formé une seule fois. C₂H₅⁺ est formé avant d’être consommé : c’est un intermédiaire. C₂H₄ est un réactif consommé définitivement.',
  },
  bilan: {
    q: 'Quelle est l’équation de la réaction modélisée par ce mécanisme ?',
    options: ['C₂H₄ + H₂O → C₂H₅OH', 'C₂H₄ → C₂H₅OH', 'C₂H₄ + H₂O + H₃O⁺ → C₂H₅OH', 'C₂H₄ + H₃O⁺ → C₂H₅OH₂⁺'],
    bonne: 0,
    indice: 'Additionne les trois actes (tous les réactifs d’un côté, tous les produits de l’autre), puis simplifie ce qui figure des deux côtés. Vérifie les atomes et la charge.',
    expl: 'En additionnant les trois actes, C₂H₅⁺, C₂H₅OH₂⁺ et H₃O⁺ figurent des deux côtés et disparaissent ; H₂O est consommée deux fois et formée une fois : il en reste une. Bilan : C₂H₄ + H₂O → C₂H₅OH. C₂H₄ → C₂H₅OH oublie l’eau : les atomes ne sont pas conservés. C₂H₄ + H₂O + H₃O⁺ → C₂H₅OH laisse le catalyseur à gauche : H₃O⁺ est régénéré, il n’est pas consommé au bilan (et la charge n’est pas conservée). C₂H₄ + H₃O⁺ → C₂H₅OH₂⁺ n’est que la somme des actes 1 et 2 : C₂H₅OH₂⁺ est un intermédiaire, consommé à l’acte 3.',
  },
  chemin: {
    q: 'Sans catalyseur, l’eau ne s’additionne presque pas à l’éthène. Qu’apporte H₃O⁺ ?',
    options: ['un autre chemin, plus rapide, sans changer l’équation de la réaction', 'un déplacement de l’équilibre vers l’éthanol, donc un meilleur rendement', 'une énergie supplémentaire fournie à l’éthène pour qu’il réagisse vite', 'un réactif de plus, qui est consommé au cours de la transformation'],
    bonne: 0,
    indice: 'Compare l’équation bilan avec et sans catalyseur. Un catalyseur est-il consommé au final ?',
    expl: 'Le catalyseur ouvre un autre mécanisme (ici trois actes) qui conduit plus vite aux mêmes produits : le bilan C₂H₄ + H₂O → C₂H₅OH est inchangé. Il ne déplace pas l’état d’équilibre : il accélère les deux sens. Il ne fournit pas d’énergie : il change le chemin. Il n’est pas un réactif : il est régénéré, donc absent du bilan.',
  },
  freq: {
    q: 'On augmente la concentration de B sans changer la température. Que devient le nombre de chocs entre A et B par seconde ?',
    options: ['il augmente : les rencontres entre A et B sont plus fréquentes', 'il diminue : les entités B se gênent les unes les autres dans la boîte', 'il ne change pas : seule la température modifie les chocs', 'il augmente, mais seulement si l’énergie des entités change'],
    bonne: 0,
    indice: 'Compare les compteurs « chocs par seconde » pour une concentration faible et pour une concentration élevée de B, à la même température.',
    expl: 'Plus il y a d’entités B dans la même boîte, plus une entité A en rencontre : les chocs sont plus fréquents. Les entités B ne se « gênent » pas dans ce modèle. La température n’est pas le seul facteur : la concentration change aussi la fréquence des rencontres. Et la fréquence des chocs augmente même à énergie inchangée.',
  },
  effic: {
    q: 'On augmente la température sans changer les concentrations. Pourquoi l’acte est-il plus rapide ?',
    options: ['les chocs sont plus fréquents et plus souvent assez énergétiques', 'il y a plus d’entités dans la boîte, donc plus de chocs entre A et B', 'les entités s’orientent mieux l’une par rapport à l’autre', 'le seuil d’énergie nécessaire pour réagir diminue'],
    bonne: 0,
    indice: 'Regarde les deux compteurs quand tu changes la température : le nombre total de chocs, et la proportion de chocs efficaces.',
    expl: 'Quand la température augmente, l’agitation est plus grande : les entités se rencontrent plus souvent, et une proportion plus grande de chocs dépasse l’énergie nécessaire. Le nombre d’entités ne change pas : seule leur agitation augmente. L’orientation reste aléatoire : la température ne l’améliore pas. Le seuil d’énergie dépend de la transformation (et du mécanisme, par exemple avec un catalyseur), pas de la température.',
  },
};

// ---- défi « flèches » : question sur le donneur (options construites par le modèle) ----
export const INDICES_DEFI = {
  actes: 'Compte les équations du mécanisme : chacune décrit un acte élémentaire.',
  inter: 'Un intermédiaire est produit par un acte puis consommé par un acte suivant ; il n’est ni réactif ni produit du bilan.',
  cata: 'Un catalyseur est consommé puis régénéré : présent au départ et à la fin, absent du bilan.',
  bilan: 'Additionne les actes, puis simplifie ce qui est des deux côtés. Vérifie les atomes et la charge.',
  fleches: 'Une flèche part d’un doublet non liant ou d’une liaison et arrive sur un atome pauvre en électrons (δ+, charge +, lacune) ou plus électronégatif.',
  role: 'Le donneur est l’espèce qui apporte le doublet servant à former la nouvelle liaison : celle qui possède un doublet non liant, ou une liaison riche en électrons (liaison double).',
};
