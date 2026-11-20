// QCM du parcours guidé de la simulation « Tests chimiques : eau, dihydrogène, dioxygène, dioxyde de carbone » (sim 198, 2GT).
// Fichier sans React : la longueur des options est contrôlée par testsChimiques2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  un: {
    q: 'Laquelle de ces observations peut servir de test chimique ?',
    options: ['un dépôt apparu après un réactif', 'une balance qui affiche 12 g de liquide', 'un thermomètre qui affiche 20 °C dans la salle', 'une étiquette lue sur le flacon de liquide'], bonne: 0,
    expl: 'Un test chimique met un réactif au contact de l’échantillon et cherche un signe visible précis (couleur, trouble, dépôt, bruit…). Une masse ou une température sont des mesures physiques, pas des tests chimiques.',
    indice: 'Un test chimique utilise un réactif. Quelle observation vient d’un réactif ajouté ?' },
  eau: {
    q: 'Léa dépose quelques gouttes d’un liquide incolore sur la poudre blanche. Rien ne change : la poudre reste blanche. Quelle phrase est correcte ?',
    options: ['le test est négatif : aucune eau n’a été détectée', 'le test est positif : le liquide ne contient pas d’eau', 'le test est positif : la poudre blanche prouve la présence d’eau', 'le test est raté : la poudre devrait toujours changer de couleur'], bonne: 0,
    expl: 'Le test est positif quand l’observation attendue a lieu (ici, la poudre bleuit). La poudre est restée blanche : le test est négatif, aucune eau n’est détectée dans ce liquide.',
    indice: 'Le test de l’eau est positif quand la poudre devient bleue. Est-ce le cas ici ?' },
  co2: {
    q: 'On fait passer le gaz d’un tube A dans de l’eau de chaux : elle reste limpide. Quelle phrase est correcte ?',
    options: ['le test est négatif : pas de dioxyde de carbone détecté', 'le test est positif : le gaz est du diazote', 'le test est négatif, donc le gaz est forcément du dioxygène', 'le test est positif : l’eau de chaux est abîmée'], bonne: 0,
    expl: 'Le test est positif quand l’eau de chaux se trouble. Elle est restée limpide : le test est négatif, on n’a pas détecté de dioxyde de carbone. Cela ne dit pas de quel autre gaz il s’agit.',
    indice: 'L’eau de chaux se trouble avec le dioxyde de carbone. Est-ce le cas ici ?' },
  o2: {
    q: 'Une bûchette à point rouge plongée dans le gaz d’un tube B s’éteint aussitôt. Quelle phrase est correcte ?',
    options: ['le test est négatif : pas de dioxygène détecté', 'le test est positif : le gaz est du dioxyde de carbone', 'le test est négatif, donc le gaz est du dioxyde de carbone', 'le test est positif : la braise s’est éteinte'], bonne: 0,
    expl: 'Avec du dioxygène, la braise se rallume. Elle s’est éteinte : le test est négatif, on n’a pas détecté de dioxygène. On ne peut pas en déduire de quel autre gaz il s’agit.',
    indice: 'Que fait la braise quand le gaz est du dioxygène ? Est-ce le cas ici ?' },
  h2: {
    q: 'Après un « pop » dans un petit tube, de fines gouttelettes apparaissent sur la paroi. Quelle espèce s’est formée ?',
    options: ['de l’eau', 'du dioxyde de carbone', 'du diazote', 'du dioxygène seul'], bonne: 0,
    expl: 'Le dihydrogène réagit avec le dioxygène de l’air et forme de l’eau : ce sont les gouttelettes. On pourrait le vérifier avec la poudre blanche de sulfate de cuivre anhydre.',
    indice: 'Le dihydrogène brûle : pensez à la combustion, que l’on a étudiée avec les équations de réaction.' },
  lire: {
    q: 'Lisez le tableau du gaz B. À quel gaz correspondent ces résultats ?',
    options: ['le dioxyde de carbone', 'le dioxygène', 'le dihydrogène', 'l’air, un mélange de diazote et de dioxygène'], bonne: 0,
    expl: 'Pour le gaz B, seul le test de l’eau de chaux est positif : le gaz est le dioxyde de carbone. La braise s’éteint et la flamme ne donne pas de « pop » : les tests de O₂ et de H₂ sont négatifs.',
    indice: 'Cherchez le seul test positif du gaz B, puis le gaz que ce test met en évidence.' },
  negatif: {
    q: 'On plonge une braise dans un flacon rempli d’air : elle ne se rallume pas. Quelle phrase est juste ?',
    options: ['le test est négatif, l’air peut contenir du dioxygène', 'le test est négatif : l’air ne contient aucun dioxygène', 'le test est positif : la braise est restée rouge', 'le test est négatif : l’air est du dioxygène pur'], bonne: 0,
    expl: 'Un test négatif ne prouve pas l’absence de l’espèce : l’air contient environ un cinquième de dioxygène, trop peu pour rallumer la braise.',
    indice: 'Rappelez-vous la composition de l’air. Un test négatif prouve-t-il que l’espèce n’est pas là ?' },
  flamme: {
    q: 'Léo plonge une allumette enflammée dans un tube de gaz : la flamme s’éteint. Il écrit : « c’est du dioxyde de carbone ». Que penser de sa conclusion ?',
    options: ['elle n’est pas sûre : d’autres gaz éteignent aussi la flamme', 'elle est juste : seul ce gaz éteint une flamme', 'elle est juste : c’est le test officiel de ce gaz', 'elle est fausse : un gaz qui éteint une flamme est du dioxygène'], bonne: 0,
    expl: 'Une flamme s’éteint dans le dioxyde de carbone, mais aussi dans le diazote : ce n’est pas un test du dioxyde de carbone. Le vrai test est l’eau de chaux qui se trouble.',
    indice: 'Un test doit être propre à une seule espèce. Y a-t-il un seul gaz qui éteint une flamme ?' },
  melange: {
    q: 'Sous un flacon retourné, une bougie brûle. La poudre blanche bleuit sur la buée et l’eau de chaux se trouble. Que peut-on conclure ?',
    options: ['de l’eau et du dioxyde de carbone sont présents', 'un seul des deux tests peut être juste', 'le test de l’eau détecte aussi le dioxyde de carbone', 'le gaz du flacon est du dihydrogène'], bonne: 0,
    expl: 'Chaque test met en évidence son espèce. Les deux sont positifs : il y a de l’eau et du dioxyde de carbone. L’échantillon est un mélange, la combustion forme les deux.',
    indice: 'Chaque test regarde une seule espèce. Combien de tests sont positifs ?' },
};
