// QCM du parcours guidé de la simulation 160 « Couleurs ». Fichier sans React : la longueur des options est contrôlée par un
// script (la bonne réponse n'est jamais la plus longue). Toutes les options suivent le patron « réponse : justification » ;
// les mauvaises réponses sont de vraies erreurs d'élèves (mélange de peintures, couleur absorbée prise pour la couleur vue,
// « un objet garde sa couleur sous toutes les lumières », filtre qui « ajoute » sa couleur…).
// bonne : indice de la bonne réponse dans options (l'ordre d'affichage est mélangé par la carte du parcours).
export const QCM = {
  oeil: {
    q: "Comment l’œil distingue-t-il des milliers de couleurs avec seulement trois types de cônes ?",
    options: ["un cône existe pour chaque couleur que l’on peut voir, il y en a des milliers de types","les bâtonnets fabriquent les couleurs que les trois types de cônes ne détectent pas","la pupille se déforme pour ne laisser entrer qu’une seule couleur à la fois","le cerveau combine les signaux, plus ou moins forts, des trois types de cônes"], bonne: 3,
    expl: "Chaque type de cône envoie au cerveau un signal d’autant plus fort qu’il reçoit de lumière dans « sa » zone du spectre. Le cerveau combine les trois signaux : c’est la trichromie. Les bâtonnets, eux, ne distinguent pas les couleurs.",
    indice: "Trois types de cônes seulement : il faut donc que la couleur vienne de la façon dont leurs trois signaux se combinent." },
  rv: {
    q: "Dans la zone où les deux disques se superposent, de quelle couleur est la lumière ?",
    options: ["marron : les deux couleurs se mélangent comme deux peintures sur une palette","jaune : les cônes sensibles au rouge et au vert sont stimulés ensemble","noir : chaque lampe retire de la lumière à l’autre lampe sur l’écran","blanc : la zone commune reçoit toutes les couleurs que l’œil peut voir"], bonne: 1,
    expl: "Les lumières s’additionnent : la zone commune envoie à la fois du rouge et du vert. Les cônes « rouge » et « vert » sont stimulés, pas les « bleu » : on perçoit du jaune. Pour deux peintures, on ne ferait pas la même prévision : ce n’est pas le même modèle.",
    indice: "Dans la zone commune, quelles lumières arrivent à l’œil ? Quels cônes sont alors stimulés, et lesquels restent au repos ?" },
  pixels: {
    q: "Quels sous-pixels sont allumés dans une zone de l’écran qui affiche du jaune ?",
    options: ["les sous-pixels rouges et verts, tandis que les bleus restent éteints","les sous-pixels jaunes, qui s’ajoutent aux autres sous-pixels","les sous-pixels bleus seuls, puisque le jaune est complémentaire du bleu","les trois sortes de sous-pixels, car le jaune est une couleur très claire"], bonne: 0,
    expl: "Les écrans n’ont que trois sortes de sous-pixels. Pour afficher du jaune, on allume le rouge et le vert, et on éteint le bleu : l’œil, trop loin pour distinguer les sous-pixels, perçoit la somme. Allumer les trois donnerait du blanc.",
    indice: "Reprends l’étape des deux lampes : quelle somme de deux lumières primaires donne du jaune ?" },
  superpose: {
    q: "Une lumière blanche traverse un filtre jaune, puis un filtre cyan. De quelle couleur est la lumière qui sort ?",
    options: ["blanche : les lumières jaune et cyan s’ajoutent comme avec deux lampes","noire : un filtre jaune et un filtre cyan absorbent toute la lumière","cyan : le second filtre impose sa couleur à toute la lumière reçue","verte : le vert est la seule radiation laissée par les deux filtres"], bonne: 3,
    expl: "Le filtre jaune laisse passer le rouge et le vert, le filtre cyan laisse passer le vert et le bleu. Le vert est la seule radiation transmise par les deux : la lumière qui sort est verte. Les filtres retirent des radiations, ils n’en ajoutent pas.",
    indice: "Écris les radiations (rouge, vert, bleu) que laisse passer chaque filtre : lesquelles passent à travers les deux ?" },
  modele: {
    q: "Dans quelle situation le modèle de la synthèse soustractive convient-il ?",
    options: ["trois projecteurs colorés dirigés ensemble vers le même écran blanc","des encres cyan, magenta et jaune déposées sur du papier blanc","les trois LED rouge, verte et bleue d’un panneau lumineux","deux lampes colorées dont les faisceaux se superposent sur un mur"], bonne: 1,
    expl: "Les encres déposées sur du papier blanc absorbent une partie de la lumière blanche : on retire des radiations, c’est la synthèse soustractive (imprimante, quadrichromie CMJN). Projecteurs, LED et lampes émettent de la lumière que l’on additionne.",
    indice: "Demande-toi si les couleurs se forment en ajoutant des lumières émises, ou en retirant des radiations à une lumière blanche." },
  opaque: {
    q: "Quelles radiations la tomate absorbe-t-elle ?",
    options: ["le vert et le bleu : un objet rouge diffuse le rouge, pas le reste","le rouge seul : c’est la couleur de l’objet, donc celle absorbée","aucune : la tomate fabrique elle-même la lumière rouge que l’on voit","toutes : un objet opaque garde toute la lumière qu’il reçoit pour lui"], bonne: 0,
    expl: "La lumière blanche contient du rouge, du vert et du bleu. La tomate paraît rouge parce qu’elle diffuse le rouge vers l’œil : elle absorbe donc le vert et le bleu, c’est-à-dire la couleur complémentaire du rouge, le cyan (dans le modèle idéal à trois bandes). Elle ne produit pas sa propre lumière.",
    indice: "Seule la lumière diffusée arrive à l’œil. Quelle radiation arrive à l’œil quand on voit un objet rouge ? Les autres ont été absorbées." },
  coloree: {
    q: "De quelle couleur le citron paraît-il sous une lumière rouge ?",
    options: ["jaune : un citron garde sa couleur, quelle que soit la lumière qui l’éclaire","orange : le jaune du citron se mêle au rouge de la lampe allumée","rouge : le citron diffuse le rouge, seule radiation que la lampe envoie","noir : le citron absorbe toute la lumière rouge que la lampe lui envoie"], bonne: 2,
    expl: "La lampe n’envoie que du rouge. Le citron diffuse le rouge (et le vert), donc il renvoie le rouge reçu : il paraît rouge. Il n’y a aucun vert ni bleu dans la lumière reçue, donc rien d’autre à diffuser. La couleur d’un objet dépend de la lumière qui l’éclaire.",
    indice: "La lumière diffusée ne contient que des radiations reçues. Parmi les radiations reçues, lesquelles le citron diffuse-t-il ?" },
  verre: {
    q: "Que voit-on derrière le verre rouge, quand il est éclairé par la lampe verte ?",
    options: ["du noir : le verre absorbe le vert, aucune lumière ne le traverse","du vert : une lumière verte traverse n’importe quel verre transparent","du jaune : le vert de la lampe s’ajoute au rouge propre du verre","du rouge : le verre donne sa couleur à toute lumière qui le traverse"], bonne: 0,
    expl: "Un verre rouge ne transmet que le rouge. La lampe n’envoie que du vert : il est absorbé, rien ne ressort du verre. On ne voit que du noir. Un verre coloré ne fabrique pas de lumière : il ne peut que transmettre une partie de celle qu’il reçoit.",
    indice: "Un verre ne transmet que certaines radiations. Le vert de la lampe fait-il partie de celles que le verre rouge laisse passer ?" },
  ballon: {
    q: "Avec laquelle de ces lampes le ballon paraît-il noir ?",
    options: ["une lampe rouge : le ballon n’est pas rouge, il absorbe donc le rouge","une lampe magenta : on ne distingue pas un objet magenta sous du magenta","une lampe verte : le ballon absorbe le vert et n’a rien à diffuser","une lampe bleue : le bleu est la couleur complémentaire du magenta"], bonne: 2,
    expl: "Le ballon paraît magenta en lumière blanche : il diffuse le rouge et le bleu, et absorbe le vert. Sous une lampe qui n’envoie que du vert, tout est absorbé : il ne renvoie aucune lumière et paraît noir. Sous une lampe magenta (rouge + bleu), il diffuse tout : il paraît magenta. La complémentaire du magenta est le vert, pas le bleu.",
    indice: "Cherche la lampe dont la lumière ne contient que la radiation absorbée par le ballon." },
};
