// QCM du parcours guidé de la simulation 165 « Niveaux d'énergie : absorption, émission et spectres de raies ». Fichier sans React :
// la longueur des options et la position de la bonne réponse (après le mélange de CarteParcours) sont contrôlées par nivQcm.test.mjs.
// Les mauvaises réponses sont de vraies erreurs d'élèves : « chaque atome émet une couleur », énergie d'un niveau confondue avec énergie du photon,
// « un photon plus énergétique que l'écart est forcément absorbé », une seule raie commune prise pour une identification.
export const QCM = {
  obs: {
    q: "Pourquoi le spectre de ce gaz ne montre-t-il que trois raies colorées et pas toutes les couleurs ?",
    options: ["Le gaz contient trois sortes d’atomes, qui émettent chacune une seule couleur.","Chaque atome ne peut émettre que des photons d’énergies bien précises.","Le gaz n’est pas assez chaud pour produire les autres couleurs de l’arc-en-ciel.","Le spectroscope ne laisse passer que trois couleurs prises au hasard."], bonne: 1,
    expl: "Tous les atomes du gaz sont identiques. S’ils pouvaient émettre n’importe quelle énergie, on verrait toutes les couleurs. On n’observe que quelques raies : l’atome ne possède que certaines énergies bien précises, appelées niveaux d’énergie, et il n’émet que des photons dont l’énergie correspond à un écart entre deux niveaux.",
    indice: "Un gaz pur contient un seul type d’atomes. Demande-toi ce qu’on verrait si ces atomes pouvaient émettre n’importe quelle énergie." },
  fond: {
    q: "Quel est l’état fondamental de l’atome X, et que signifie ce mot ?",
    options: ["E₀ : le niveau de plus basse énergie, où l’atome est le plus stable","E₃ : le niveau de plus haute énergie, où l’atome est le plus actif","E₁ : le premier niveau excité, à partir duquel l’atome émet de la lumière","E₀ : le niveau où l’atome ne possède aucune énergie du tout"], bonne: 0,
    expl: "L’état fondamental est le niveau de plus basse énergie : c’est l’état « normal » de l’atome, le plus stable. Ici E₀ = 0 eV est un choix de zéro pour l’énergie (comme choisir le sol pour mesurer des hauteurs) : l’atome a bien de l’énergie dans cet état. Les niveaux plus hauts sont les états excités.",
    indice: "Fondamental = le plus bas du diagramme. Le zéro de l’échelle est un choix de repère, pas « pas d’énergie »." },
  emi: {
    q: "Un atome X au niveau E₃ revient au niveau E₁ en émettant un photon. Quelle est l’énergie de ce photon ?",
    options: ["1,65 eV : c’est l’écart entre le niveau E₃ et le niveau E₁","3,55 eV : c’est l’énergie du niveau de départ E₃","5,45 eV : c’est la somme des énergies des deux niveaux","1,90 eV : c’est l’énergie du niveau d’arrivée E₁"], bonne: 0,
    expl: "L’énergie du photon émis est égale à la perte d’énergie de l’atome : ΔE = E₃ − E₁ = 3,55 − 1,90 = 1,65 eV. Ce n’est ni l’énergie d’un niveau, ni la somme des deux : l’énergie d’un niveau (celle de l’atome) et l’énergie d’un photon sont deux choses différentes.",
    indice: "Le photon emporte ce que l’atome perd : fais la différence entre le niveau de départ et le niveau d’arrivée." },
  spectre: {
    q: "Quelle transition de l’atome X donne la raie de plus petite longueur d’onde, la plus à gauche du spectre ?",
    options: ["E₃ → E₂ : c’est le plus petit écart d’énergie, donc la plus petite λ","E₃ → E₀ : c’est le plus grand écart d’énergie, donc la plus petite λ","E₁ → E₀ : c’est le niveau le plus bas, donc la plus petite λ","E₃ → E₁ : c’est le niveau de départ le plus haut, donc la plus petite λ"], bonne: 1,
    expl: "λ = h·c ÷ ΔE : plus l’écart d’énergie est grand, plus la longueur d’onde est petite. Le plus grand écart du diagramme est E₃ − E₀ = 3,55 eV, soit λ ≈ 350 nm (ultraviolet). E₃ → E₁ part aussi du niveau le plus haut, mais son écart n’est que de 1,65 eV.",
    indice: "λ et ΔE varient en sens contraire (λ = h·c ÷ ΔE). Cherche le plus GRAND écart entre deux niveaux." },
  refus: {
    q: "Un atome X au niveau fondamental reçoit un photon d’énergie 2,50 eV. Que se passe-t-il ?",
    options: ["Le photon n’est pas absorbé : aucun écart entre E₀ et un autre niveau ne vaut 2,50 eV.","Le photon est absorbé : 2,50 eV dépasse l’écart de 1,90 eV pour monter en E₁.","Le photon est absorbé en partie : l’atome prend 1,90 eV et le photon garde le reste.","Le photon est absorbé : 2,50 eV est proche de l’écart de 2,85 eV pour monter en E₂."], bonne: 0,
    expl: "Un photon est absorbé en entier ou pas du tout, et seulement si son énergie est EXACTEMENT égale à un écart entre le niveau de l’atome et un niveau plus haut. Depuis E₀, les écarts valent 1,90 eV, 2,85 eV et 3,55 eV : 2,50 eV n’en est aucun. Plus grand que 1,90 eV ne suffit pas ; plus proche de 2,85 eV non plus.",
    indice: "Liste les écarts d’énergie possibles depuis E₀ (E₁ − E₀, E₂ − E₀, E₃ − E₀) et compare-les à 2,50 eV : il faut une égalité." },
  ident: {
    q: "Quel atome est contenu dans le gaz inconnu, dont le spectre d’émission visible est montré ci-dessus ?",
    options: ["l’atome Y : ses deux raies visibles sont 478 nm et 654 nm","l’atome Z : ses raies sont dans la même zone, du violet au vert","l’atome X : il a lui aussi une raie visible à 654 nm, comme le gaz","on ne peut pas savoir : il faudrait connaître la température du gaz"], bonne: 0,
    expl: "Un atome se reconnaît à l’ensemble de ses raies, pas à une seule. L’atome Y a exactement deux raies visibles, 478 nm et 654 nm, comme le gaz inconnu. L’atome X a aussi une raie à 654 nm, mais il en a deux autres (436 nm et 753 nm) qui manquent ici. L’atome Z n’a aucune raie en commun.",
    indice: "Compare les listes de raies en entier : il faut les mêmes raies, ni plus ni moins. Une raie en commun ne suffit pas." },
  sodium: {
    q: "Dans une lampe à vapeur de sodium, l’atome revient du niveau à 2,10 eV au fondamental. Quelle couleur domine la lumière ?",
    options: ["jaune-orangé, de longueur d’onde voisine de 590 nm","rouge profond, de longueur d’onde voisine de 700 nm","bleu-violet, de longueur d’onde voisine de 450 nm","infrarouge, de longueur d’onde voisine de 1 200 nm"], bonne: 0,
    expl: "λ = h·c ÷ ΔE avec ΔE = 2,10 eV = 3,36 × 10⁻¹⁹ J : λ ≈ 592 nm. C’est du jaune-orangé. La valeur mesurée de la raie du sodium est 589 nm : l’écart vient pour moitié de l’arrondi de 2,10 eV (valeur réelle : 2,105 eV environ) et pour moitié des constantes arrondies. Une lampe qui n’émet presque que cette raie paraît jaune-orangée : on la reconnaît à l’éclairage de certaines routes.",
    indice: "Convertis 2,10 eV en joules (× 1,60 × 10⁻¹⁹), calcule λ = h·c ÷ ΔE puis cherche cette valeur dans les domaines du visible." },
};
// Étape (indice, base 0) de chaque QCM : sert à la graine du mélange des options dans CarteParcours.
export const ETAPE_QCM = { obs: 0, fond: 1, emi: 4, spectre: 6, refus: 8, ident: 9, sodium: 10 };
