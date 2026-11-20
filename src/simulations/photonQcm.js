// QCM du parcours guidé de la simulation 164 « Lumière : domaines spectraux et énergie d'un photon ». Fichier sans React :
// la longueur des options et la position de la bonne réponse (après le mélange de CarteParcours) sont contrôlées par photonQcm.test.mjs.
// bonne : indice de la bonne réponse dans options (l'ordre d'affichage est mélangé par la carte du parcours, graine = indice d'étape).
// Les mauvaises réponses sont de vraies erreurs d'élèves : λ et ν variant dans le même sens, « micro » pris pour micro-ondes,
// énergie confondue avec longueur d'onde, photon pris pour une bille de matière, puissance confondue avec énergie d'un photon.
export const QCM = {
  onde: {
    q: "Deux ondes électromagnétiques se propagent dans le vide. La seconde a une fréquence deux fois plus grande que la première. Que peut-on dire de sa longueur d’onde ?",
    options: ["deux fois plus petite : la célérité c reste la même, λ = c ÷ ν", "deux fois plus grande : plus la fréquence monte, plus l’onde s’étale", "la même : toutes ces ondes ont la même célérité dans le vide", "impossible à dire : il faudrait connaître l’amplitude des deux ondes"], bonne: 0,
    expl: "Dans le vide, c ne change pas. Pendant une période T = 1 ÷ ν, l’onde avance de λ = c × T = c ÷ ν. Si ν double, T est divisée par 2 et λ aussi : fréquence et longueur d’onde varient en sens contraire.",
    indice: "Pendant une période, l’onde avance d’une longueur d’onde : λ = c × T, avec T = 1 ÷ ν." },
  domLambda: {
    q: "Une onde a une longueur d’onde λ = 2,5 µm. Dans quel domaine du spectre se trouve-t-elle ?",
    options: ["infrarouge : 2,5 µm se place entre les bornes 780 nm et 1 mm", "visible : 2,5 µm est tout proche des 400 à 780 nm de la lumière", "ultraviolet : 2,5 µm est plus petit que les 780 nm du rouge", "micro-ondes : le préfixe « micro » désigne les micro-ondes"], bonne: 0,
    expl: "2,5 µm = 2 500 nm. Cette valeur est plus grande que 780 nm (limite du rouge) et bien plus petite que 1 mm : c’est de l’infrarouge. Attention : 1 µm = 1 000 nm, donc 2,5 µm est plus grand que 780 nm.",
    indice: "Convertis en nanomètres (1 µm = 1 000 nm), puis compare aux bornes du tableau." },
  domNu: {
    q: "Une onde a une fréquence ν = 10 GHz (1 GHz = 10⁹ Hz). Dans quel domaine du spectre se trouve-t-elle ?",
    options: ["ondes radio : une fréquence élevée donne les plus grandes longueurs d’onde", "micro-ondes : 10 GHz se place entre 1 GHz et 300 GHz sur l’axe des fréquences", "infrarouge : 10 GHz = 10 × 10¹² Hz, soit 10 THz, fréquence des infrarouges", "visible : une fréquence en gigahertz est aussi élevée que celle de la lumière"], bonne: 1,
    expl: "Sur l’axe des fréquences, 10 GHz se place entre 1 GHz et 300 GHz, du côté des basses fréquences : c’est dans la bande des micro-ondes. (On vérifie : λ = c ÷ ν ≈ 3 cm, entre 1 mm et 30 cm.)",
    indice: "Repère 10 GHz sur l’axe des fréquences (1 GHz = 10⁹ Hz), puis lis le domaine sous le repère." },
  appli: {
    q: "Parmi ces applications, laquelle utilise des ondes de longueur d’onde plus grande que celles du wifi (2,4 GHz) ?",
    options: ["la radiographie : les rayons X traversent le corps, donc λ est grande", "la télécommande : l’infrarouge est invisible, donc λ est grande", "la lampe à bronzer : les UV sont très énergétiques, donc λ est grande", "la radio FM : 100 MHz est une fréquence bien plus basse que 2,4 GHz"], bonne: 3,
    expl: "λ = c ÷ ν : plus la fréquence est basse, plus la longueur d’onde est grande. La radio FM (≈ 100 MHz) a une fréquence 24 fois plus basse que le wifi (2,4 GHz) : sa longueur d’onde (≈ 3 m) est 24 fois plus grande que celle du wifi (≈ 12,5 cm). Les trois autres applications ont des longueurs d’onde bien plus petites.",
    indice: "Plus la fréquence est basse, plus la longueur d’onde est grande (λ = c ÷ ν). Classe d’abord les fréquences." },
  photon: {
    q: "Quelle affirmation sur les deux modèles de la lumière est correcte ?",
    options: ["un photon est un grain de matière, comme une très petite bille", "les deux modèles décrivent la même lumière et se complètent l’un l’autre", "le modèle des photons a remplacé le modèle ondulatoire, devenu faux", "le visible suit le modèle ondulatoire, les rayons X le modèle des photons"], bonne: 1,
    expl: "Un même rayonnement peut être décrit par une onde (λ, ν) ou par des photons (énergie E). Aucun des deux modèles n’est « le vrai » : chacun explique d’autres observations. Un photon n’est pas une bille de matière : c’est un modèle, un « grain » d’énergie.",
    indice: "Un même rayonnement, deux descriptions : demande-toi si l’une exclut l’autre." },
  compare: {
    q: "Dans quel ordre ces trois photons se classent-ils, du MOINS au PLUS énergétique ?",
    options: ["rayons X, lumière verte, radio FM : E augmente avec la longueur d’onde", "les trois sont égaux : seule la puissance de la source change", "radio FM, lumière verte, rayons X : E augmente avec la fréquence", "lumière verte, rayons X, radio FM : un émetteur radio est très puissant"], bonne: 2,
    expl: "E = h × ν : l’énergie d’un photon croît avec la fréquence. Radio FM : 1,00×10⁸ Hz ; lumière verte : 5,64×10¹⁴ Hz ; rayons X : 3,00×10¹⁸ Hz. L’ordre croissant est donc radio, visible, X. La puissance d’une source change le nombre de photons émis, pas l’énergie de chacun.",
    indice: "E = h × ν : pour comparer des énergies, compare les fréquences (ou les longueurs d’onde, en sens inverse)." },
};
// Étape (indice, base 0) de chaque QCM : sert à la graine du mélange des options dans CarteParcours.
export const ETAPE_QCM = { onde: 0, domLambda: 2, domNu: 3, appli: 4, photon: 8, compare: 11 };
