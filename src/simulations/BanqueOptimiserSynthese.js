
// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EXERCICES « OPTIMISER UNE SYNTHÈSE » (Terminale STL — SPCL,
//  thème « Chimie et développement durable », partie « Synthèses chimiques »)
//  Format identique à src/simulations/AtelierSituationsBanque.js : exercices
//  à étapes, QCM + saisies numériques, une aide par étape, nombres tirés au
//  hasard, aucune dépendance à React.
//
//  Cohérence assurée avec la simulation OptimiserSynthese.jsx (même fichier
//  cible) : K0 = 0,023 min⁻¹, vitesse doublant tous les 10 °C, catalyseur
//  ×4, K = 4 pour l'estérification, x_éq(r=1) = 2/3, x_éq(anhydride) = 0,98,
//  élimination d'eau → x_éq + 0,30 (plafonné à 0,97), HORIZON = 120 min.
//  Vérifier ce fichier avec scripts/verifier-enonces.mjs.
//
//  ⚠️ INTÉGRATION (à la charge de Claude) :
//   • domaine « Optimiser une synthèse » à déclarer dans src/chapitres.js
//     (champ domaines du chapitre TSTL « Synthèses chimiques ») — le test
//     chapitres.test.mjs exige qu'un thème d'exercices figure dans un chapitre ;
//   • soit fusionner dans AtelierSituationsBanque.js, soit poser ce fichier à
//     côté et le brancher dans l'atelier « Comprendre une situation » ;
//   • vérifier les codes d'accès (convention SAPPn / ANAn / VALn) et la
//     cohérence avec le domaine déclaré.
//  Capacités du BO couvertes (mot pour mot dans la simulation) :
//   • « Identifier les facteurs permettant d'accélérer une réaction :
//     changement de température, de concentration, utilisation d'un catalyseur. »
//   • « Identifier les facteurs permettant d'optimiser le rendement :
//     changement de réactif, excès d'un réactif, élimination d'un produit. »
//   • « Déterminer le rendement d'une synthèse en une ou plusieurs étapes. »
//   • « Comparer des protocoles de synthèse et choisir le plus performant en
//     termes de rendement, de coût et de respect de l'environnement. »
//  Contenus entièrement réinventés (confiserie, laboratoire d'arômes,
//  données fictives plausibles) : rien de reconnaissable, rien de mot pour mot.
// ═══════════════════════════════════════════════════════════════════════════

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const nb = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

const DOM = 'Optimiser une synthèse';

// Mêmes lois que le modèle pur de la simulation (valeurs identiques).
const K0 = 0.023;                                    // min⁻¹ à 40 °C, sans catalyseur
const kDe = t => K0 * Math.pow(2, (t - 40) / 10);    // la vitesse double tous les 10 °C
const xeqR = r => (2 / 3) * ((1 + r) - Math.sqrt(r * r - r + 1));  // K = 4
const t12De = k => Math.log(2) / k;

export const EXERCICES = [

  // ── E1 (S'APP, niveau 1) : s'approprier la situation de l'usine d'arômes ──
  {
    id: 'ester-confiserie-situer', domaine: DOM, niveau: 1,
    titre: 'L\'arôme ananas d\'une confiserie',
    construire: () => {
      const masse = tire([12, 15, 18]);              // tonnes d'arôme commandées par an (fictif)
      return {
        enonce: `Une usine d'arômes alimentaires fabrique le butanoate d'éthyle, l'ester qui donne son arôme d'ananas à une gamme de confiseries. Le service production en livre ${nb(masse, 0)} tonnes par an. La synthèse part de l'acide butanoïque et d'éthanol : au retour d'un essai en laboratoire, le technicien note « réaction lente, rendement décevant ». Vous devez comprendre pourquoi avant de proposer des améliorations.`,
        etapes: [
          { id: 'famille', titre: 'La famille de la réaction', q: 'L\'acide butanoïque réagit avec l\'éthanol. À quelle famille de réactions appartient cette transformation ?',
            aide: 'Un acide carboxylique + un alcool : regardez les produits attendus.',
            o: [
              V('Une estérification : l\'acide carboxylique et l\'alcool forment un ester et de l\'eau', 'Acide carboxylique + alcool → ester + eau : c\'est la définition de l\'estérification.'),
              F('Une combustion : l\'alcool brûle au contact de l\'acide', 'Aucune combustion ici : pas de dioxygène réactif, et l\'eau formée par l\'estérification n\'est pas une « flamme ».'),
              F('Une réaction acide-base : l\'acide cède un proton à l\'alcool', 'Une réaction acide-base serait rapide et totale : or l\'essai montre une réaction lente et limitée.'),
            ] },
          { id: 'equation', titre: 'L\'équation de la réaction', q: 'Quelle est l\'équation correcte de cette synthèse ?',
            aide: 'Les réactifs : acide butanoïque et éthanol. Les produits : le butanoate d\'éthyle et... l\'autre petite molécule formée.',
            o: [
              V('acide butanoïque + éthanol ⇌ butanoate d\'éthyle + eau', 'C\'est l\'équation de l\'estérification : deux flèches, car la réaction est renversable.'),
              F('acide butanoïque + éthanol → butanoate d\'éthyle + dihydrogène', 'Aucun dihydrogène formé : le second produit est l\'eau.'),
              F('butanoate d\'éthyle + eau → acide butanoïque + éthanol, sens unique', 'C\'est le sens inverse, et l\'estérification est renversable : les deux sens coexistent.'),
            ] },
          { id: 'renversable', titre: 'Ce que signifie « renversable »', q: 'Pourquoi le rendement d\'une estérification plafonne-t-il, même en attendant très longtemps ?',
            aide: 'Deux flèches dans l\'équation : que se passe-t-il une fois qu\'il y a assez de produits ?',
            o: [
              V('La réaction inverse (hydrolyse de l\'ester) se produit aussi : à l\'équilibre, les deux sens se compensent et la composition se fige', 'L\'équilibre dynamique : ester et eau re-forment acide et alcool ; à l\'équilibre, vitesses des deux sens égales, plus rien ne change en apparence.'),
              F('Les réactifs s\'épuisent physiquement : ils « usent » leur capacité à réagir', 'Les réactifs ne s\'usent pas : ils sont toujours là, régénérés en permanence par le sens inverse.'),
              F('L\'ester formé bloque la réaction en empoisonnant le milieu', 'Aucun empoisonnement : la limite vient du sens inverse, pas d\'une inhibition.'),
            ] },
          { id: 'donnees', titre: 'Les deux problèmes distincts', q: 'Le technicien parle de « réaction lente » et de « rendement décevant ». Ces deux griefs relèvent-ils du même levier ?',
            aide: 'Lente = combien de temps pour obtenir le produit ; rendement = combien on peut en obtenir au maximum.',
            o: [
              V('Non : la lenteur relève de la cinétique (vitesse), le rendement de l\'état final (équilibre). Les leviers ne sont pas les mêmes', 'C\'est LE message du chapitre : accélérer (température, concentration, catalyseur) et optimiser le rendement (excès, élimination d\'eau, autre réactif) sont deux problèmes distincts.'),
              F('Oui : chauffer règle les deux problèmes à la fois', 'Chauffer accélère, mais le rendement maximal dépend de l\'équilibre : il faut d\'autres leviers pour l\'améliorer.'),
              F('Oui : il suffit d\'attendre plus longtemps pour tout obtenir', 'Attendre n\'aide plus une fois l\'équilibre atteint : la composition est figée.'),
            ] },
        ],
        retenir: [`L'estérification acide carboxylique + alcool ⇌ ester + eau est lente et limitée par l'équilibre. La lenteur (cinétique) et le plafond de rendement (équilibre) sont deux problèmes distincts, avec des leviers distincts.`],
      };
    },
  },

  // ── E2 (ANA, niveau 1) : temps de demi-réaction et facteur température ──
  {
    id: 'synthese-temps-demi', domaine: DOM, niveau: 1,
    titre: 'Chronométrer un essai en laboratoire',
    construire: () => {
      const t = tire([40, 50, 60]);                  // température de l'essai (°C)
      const k = kDe(t);                              // constante de vitesse (/min)
      const t12 = t12De(k);                          // temps de demi-réaction (min)
      const t2 = t + 10;
      const k2 = kDe(t2);
      return {
        enonce: `Le modèle de la simulation de laboratoire donne la loi d'avancement x(t) = x_éq·(1 − e^(−k·t)), avec k = ${nb(k, 3)} min⁻¹ pour un essai à ${nb(t, 0)} °C sans catalyseur. Dans la plage étudiée, la vitesse double tous les 10 °C. Le temps de demi-réaction t_(1/2) est la durée nécessaire pour atteindre la moitié de l'avancement final.`,
        etapes: [
          { id: 'definition', titre: 'Ce que mesure t_(1/2)', q: 'Que représente exactement le temps de demi-réaction t_(1/2) ?',
            aide: '« Demi-réaction » : la moitié de... quoi ?',
            o: [
              V(`La durée nécessaire pour atteindre la moitié de l'avancement final x_éq`, 't_(1/2) correspond à x = x_éq/2 : c\'est l\'indicateur de durée utilisé pour planifier un essai.'),
              F('La moitié de la température de l\'essai', 'Aucun rapport avec la température.'),
              F('Le temps au bout duquel la moitié du récipient a réagi de façon visible', 'On ne regarde pas le récipient mais l\'avancement : la moitié de l\'avancement final.'),
            ] },
          { id: 't12', titre: 'Calculer t_(1/2)', q: `Calculez le temps de demi-réaction t_(1/2) de cet essai (en minutes).`,
            aide: `Avec x(t) = x_éq(1 − e^(−k·t)), résolvez x_éq/2 = x_éq(1 − e^(−k·t)) : t_(1/2) = ln(2)/k, avec k = ${nb(k, 3)} min⁻¹.`,
            type: 'saisie', champs: [{ id: 't12', lib: 't_(1/2)', u: 'min', vrai: t12, tol: 0.03 }],
            expl: `t_(1/2) = ln(2)/k = 0,693/${nb(k, 3)} ≈ ${nb(t12, 1)} min. On remarque qu'il ne dépend PAS de x_éq : cinétique et rendement sont déconnectés.` },
          { id: 'double', titre: 'Dix degrés de plus', q: `On refait l'essai à ${nb(t2, 0)} °C. Par quel facteur la constante de vitesse est-elle multipliée ?`,
            aide: `Règle simplifiée affichée : la vitesse double tous les 10 °C.`,
            type: 'saisie', champs: [{ id: 'fact', lib: 'facteur', u: '', vrai: 2, tol: 0.01 }],
            expl: `De ${nb(t, 0)} °C à ${nb(t2, 0)} °C : +10 °C, donc k ×2. La nouvelle constante vaut k = ${nb(k2, 3)} min⁻¹, et le nouveau temps de demi-réaction ${nb(t12De(k2), 1)} min : deux fois plus court.` },
          { id: 'temporaire', titre: 'Chauffer change-t-il le plafond ?', q: `À ${nb(t2, 0)} °C, l'essai atteint l'équilibre plus vite. Le rendement maximal x_éq a-t-il changé ?`,
            aide: 'La température joue sur la vitesse (k) ; le plafond, lui, est imposé par l\'équilibre.',
            o: [
              V('Non : x_éq ne dépend pas de la température dans ce modèle ; on atteint le même plafond, seulement plus vite', 'Chauffer accélère ; le plafond reste fixé par la constante d\'équilibre K. Le vérifier dans la simulation : bouger le curseur T déplace t_(1/2), pas le trait orange.'),
              F('Oui : chauffer détruit l\'équilibre et rend la réaction totale', 'L\'équilibre n\'est pas détruit ; la réaction reste renversable.'),
              F('Oui : x_éq double comme la vitesse', 'Aucune raison : la vitesse double, pas le plafond.'),
            ] },
        ],
        retenir: [`t_(1/2) = ln(2)/k ne dépend pas de x_éq. Chauffer (comme le catalyseur) réduit t_(1/2) mais ne déplace pas le plafond x_éq : cinétique et rendement sont deux problèmes distincts.`],
      };
    },
  },

  // ── E3 (ANA, niveau 1) : rendement d'une synthèse, puis en plusieurs étapes ──
  {
    id: 'synthese-rendement', domaine: DOM, niveau: 1,
    titre: 'Rendement d\'un batch, puis de la chaîne',
    construire: () => {
      const nmax = tire([0.50, 1.0, 2.0]);           // mol d'acide mises en jeu (= n_max d'ester si totale)
      const xeq = 2 / 3;
      const nobt = Math.round(xeq * nmax * 1000) / 1000;  // ester isolé à l'équilibre, mélange équimolaire
      const r1 = tire([0.92, 0.90, 0.88]);
      const r2 = tire([0.85, 0.80, 0.78]);
      const r3 = tire([0.88, 0.75, 0.70]);
      const rg = Math.round(r1 * r2 * r3 * 1000) / 1000;
      return {
        enonce: `Le batch d'essai part de ${nb(nmax, 2)} mol d'acide butanoïque en mélange équimolaire avec l'éthanol. À l'équilibre (x_éq = 2/3), on isole ${nb(nobt, 2)} mol de butanoate d'éthyle. En aval, la purification et la formulation enchaînent trois opérations de rendements ${nb(r1 * 100, 0)} %, ${nb(r2 * 100, 0)} % et ${nb(r3 * 100, 0)} %.`,
        etapes: [
          { id: 'defr', titre: 'La définition du rendement', q: 'Comment définit-on le rendement d\'une synthèse ?',
            aide: 'Comparez ce qu\'on a obtenu à ce qu\'on obtiendrait si la réaction était totale.',
            o: [
              V('R = n_obtenu / n_max, où n_max correspond à la réaction totale (réactif limitant entièrement consommé)', 'Le rendement rapporte l\'obtenu au maximal théorique, calculé sur le réactif limitant.'),
              F('R = n_obtenu / n_total de réactifs introduits', 'Non : on divise par la quantité maximale de produit attendue, pas par le total de réactifs versés.'),
              F('R = n_max / n_obtenu', 'C\'est l\'inverse : le rendement serait alors supérieur à 1...'),
            ] },
          { id: 'calcul', titre: 'Rendement du batch', q: `Calculez le rendement R du batch (en pourcentage).`,
            aide: `n_max = ${nb(nmax, 2)} mol (réaction totale), n_obtenu = ${nb(nobt, 2)} mol.`,
            type: 'saisie', champs: [{ id: 'r', lib: 'R', u: '%', vrai: (nobt / nmax) * 100, tol: 0.02 }],
            expl: `R = ${nb(nobt, 2)}/${nb(nmax, 2)} = ${nb(nobt / nmax, 2)} ≈ ${nb(nobt / nmax * 100, 0)} % : l'équilibre plafonne le batch, quel que soit le volume de matière.` },
          { id: 'global', titre: 'Rendement de la chaîne', q: `Calculez le rendement global de la chaîne (batch + purification + formulation).`,
            aide: `Les rendements d'étapes se multiplient : R_global = ${nb(r1, 2)} × ${nb(r2, 2)} × ${nb(r3, 2)}.`,
            type: 'saisie', champs: [{ id: 'rg', lib: 'R_global', u: '%', vrai: rg * 100, tol: 0.03 }],
            expl: `R_global = ${nb(r1 * 100, 0)} % × ${nb(r2 * 100, 0)} % × ${nb(r3 * 100, 0)} % ≈ ${nb(rg * 100, 0)} %. Chaque étape mange une partie de ce qui reste : c'est pour ça qu'on optimise chaque maillon.` },
          { id: 'lecture', titre: 'Lire un rendement global', q: `Le rendement global (${nb(rg * 100, 0)} %) est plus petit que chacun des trois rendements d'étapes. Est-ce normal ?`,
            aide: `Comparez ${nb(rg, 2)} avec ${nb(r1, 2)}, ${nb(r2, 2)}, ${nb(r3, 2)}.`,
            o: [
              V('Oui : le rendement global est le produit des rendements, donc toujours inférieur ou égal à chacun d\'eux', 'Multiplier des nombres inférieurs à 1 donne un résultat plus petit que chacun : les pertes se cumulent d\'étape en étape.'),
              F('Non : les rendements devraient s\'additionner', 'On additionne des quantités, jamais des rendements ; ici c\'est le produit qui compte.'),
              F('Non : une erreur de calcul est probable', `Pas d'erreur : ${nb(r1, 2)} × ${nb(r2, 2)} × ${nb(r3, 2)} ≈ ${nb(rg, 2)}.`),
            ] },
        ],
        retenir: [`R = n_obtenu/n_max (pourcentage). Pour une synthèse en plusieurs étapes, le rendement global est le produit des rendements : toujours inférieur ou égal à chaque rendement d'étape.`],
      };
    },
  },

  // ── E4 (ANA + VAL, niveau 2) : le piège du catalyseur ──
  {
    id: 'synthese-catalyseur-piege', domaine: DOM, niveau: 2,
    titre: 'Le catalyseur trop beau',
    construire: () => {
      const t = tire([40, 50]);
      const k = kDe(t);
      const kc = k * 4;
      return {
        enonce: `Un fournisseur propose un catalyseur acide « révolutionnaire » pour l'essai à ${nb(t, 0)} °C (k = ${nb(k, 3)} min⁻¹ sans artifice). Avec le catalyseur, la constante de vitesse est multipliée par 4 : k = ${nb(kc, 3)} min⁻¹. La plaquette publicitaire annonce : « réaction totale garantie, rendement 100 % ».`,
        etapes: [
          { id: 't12', titre: 'L\'effet réel sur la durée', q: `Calculez le nouveau temps de demi-réaction t_(1/2) avec le catalyseur (en minutes).`,
            aide: `t_(1/2) = ln(2)/k avec k = ${nb(kc, 3)} min⁻¹.`,
            type: 'saisie', champs: [{ id: 't12', lib: 't_(1/2)', u: 'min', vrai: t12De(kc), tol: 0.03 }],
            expl: `t_(1/2) = ln(2)/${nb(kc, 3)} ≈ ${nb(t12De(kc), 1)} min, contre ${nb(t12De(k), 1)} min sans catalyseur : quatre fois plus rapide.` },
          { id: 'def', titre: 'La définition d\'un catalyseur', q: 'Quelle est la définition correcte d\'un catalyseur ?',
            aide: 'Suivez sa quantité au début et à la fin de la réaction.',
            o: [
              V('Une espèce qui accélère une réaction ; elle est consommée puis régénérée, sa quantité est la même au début et à la fin', 'C\'est la définition exigible : le catalyseur ouvre un chemin réactionnel de moindre énergie d\'activation, sans être consommé globalement.'),
              F('Un réactif qui apporte de l\'énergie à la réaction et disparaît en fin de réaction', 'Un réactif disparaissant n\'est pas un catalyseur ; et le catalyseur n\'apporte pas d\'énergie.'),
              F('Une espèce qui déplace l\'équilibre pour rendre la réaction totale', 'Le catalyseur ne déplace PAS l\'équilibre : il accélère les deux sens à la fois.'),
            ] },
          { id: 'profil', titre: 'Ce que montre le profil énergétique', q: 'Sur le profil réactionnel, comment le catalyseur agit-il ?',
            aide: 'Pensez au col à franchir entre réactifs et produits.',
            o: [
              V('Il abaisse l\'énergie d\'activation (le col) : réactifs et produits restent au même niveau', 'Le col est plus bas, donc plus de chocs efficaces ; l\'état final est inchangé, donc l\'équilibre aussi.'),
              F('Il abaisse le niveau d\'énergie des produits, ce qui rend la réaction totale', 'Le niveau des produits ne change pas : c\'est lui qui fixe l\'équilibre.'),
              F('Il fournit l\'énergie manquante aux réactifs pour tous les faire réagir', 'Le catalyseur ne fournit aucune énergie.'),
            ] },
          { id: 'pub', titre: 'Valider l\'annonce du fournisseur', q: `La plaquette annonce « rendement 100 % ». Que faut-il en penser ?`,
            aide: `Le plafond à ${nb(t, 0)} °C, mélange équimolaire, reste x_éq = 2/3 : le catalyseur a-t-il déplacé ce plafond ?`,
            o: [
              V('L\'annonce est fausse : le catalyseur accélère l\'atteinte de l\'équilibre mais ne le déplace pas ; le rendement plafonne toujours à 67 %', 'k ×4 mais x_éq inchangé : on atteint le même plafond, quatre fois plus vite. C\'est le piège classique du chapitre.'),
              F('L\'annonce est juste : accélérer la réaction finit par la rendre totale', 'Accélérer ne change rien au plafond : une fois l\'équilibre atteint, la composition est figée.'),
              F('L\'annonce est juste si on attend suffisamment longtemps', 'Même en attendant un temps infini : l\'équilibre plafonne le rendement à 67 %.'),
            ] },
        ],
        retenir: [`Le catalyseur multiplie k (ici ×4) et abaisse l'énergie d'activation sur le profil, mais ne change ni le niveau relatif réactifs/produits ni l'état d'équilibre : x_éq ne bouge pas. « Plus vite » n'est pas « plus de produit ».`],
      };
    },
  },

  // ── E5 (ANA, niveau 2) : optimiser x_éq (excès, élimination d'eau, réactif) ──
  {
    id: 'synthese-optimiser-xeq', domaine: DOM, niveau: 2,
    titre: 'Relèver le plafond',
    construire: () => {
      const r = tire([2, 3]);                        // excès d'éthanol tiré
      const x1 = 2 / 3, xr = xeqR(r);
      return {
        enonce: `Toujours plafonné à x_éq = ${nb(x1, 2)} (soit ${nb(x1 * 100, 0)} %) en mélange équimolaire, le service production étudie trois voies : (a) mettre l'éthanol en excès (rapport r = ${nb(r, 0)} mol d'éthanol pour 1 mol d'acide), (b) éliminer l'eau au fur et à mesure de sa formation (montage de déshydratation), (c) remplacer l'acide par son anhydride, plus réactif. Avec la constante K = 4, l'excès d'éthanol porte l'équilibre à x_éq = ${nb(xr, 2)}.`,
        etapes: [
          { id: 'principe', titre: 'Pourquoi l\'excès fonctionne', q: `Pourquoi l'excès d'éthanol déplace-t-il l'équilibre vers l'ester ?`,
            aide: `À l'équilibre, le sens direct consomme un peu d'éthanol... qui est très abondant. Écrivez la conservation : il reste ${nb(r - xr, 2)} mol d'éthanol pour ${nb(1 - xr, 2)} mol d'acide.`,
            o: [
              V('L\'équilibre relie les quantités : plus d\'éthanol présent favorise le sens direct, qui consomme l\'éthanol, et limite le sens inverse', `Un excès de réactif déplace l'état d'équilibre dans le sens qui le consomme : ici x_éq monte à ${nb(xr, 2)}.`),
              F('L\'éthanol en excès catalyse la réaction', 'L\'éthanol est un réactif, pas un catalyseur ; et un catalyseur ne déplacerait pas l\'équilibre de toute façon.'),
              F('L\'excès chauffe le milieu par réaction exothermique', 'Le déplacement vient de la composition, pas d\'un effet thermique.'),
            ] },
          { id: 'gain', titre: 'Le nouveau plafond', q: `Calculez le gain de rendement maximal apporté par l'excès (en points de pourcentage, par rapport au mélange équimolaire).`,
            aide: `De x_éq = ${nb(x1, 2)} à x_éq = ${nb(xr, 2)}.`,
            type: 'saisie', champs: [{ id: 'gain', lib: 'gain', u: 'pts', vrai: (xr - x1) * 100, tol: 0.05 }],
            expl: `Gain = (${nb(xr, 2)} − ${nb(x1, 2)}) × 100 ≈ ${nb((xr - x1) * 100, 0)} points : ${nb(xr * 100, 0)} % de rendement maximal contre ${nb(x1 * 100, 0)} %.` },
          { id: 'eau', titre: 'Éliminer l\'eau', q: 'Le montage de déshydratation élimine l\'eau dès sa formation. Pourquoi le rendement monte-t-il ?',
            aide: 'Le sens inverse (ester + eau → réactifs) a besoin d\'un de ses réactifs...',
            o: [
              V('Privé d\'eau, le sens inverse est étouffé : l\'équilibre glisse vers l\'ester, jusqu\'à un rendement quasi total', 'Retirer un produit déplace l\'équilibre dans le sens qui le reforme : x_éq grimpe ici vers 0,97.'),
              F('L\'eau refroidirait le milieu ; sans elle, la température monte', 'Le montage déplace un équilibre, il ne change pas la température.'),
              F('L\'eau emporte l\'ester avec elle', 'Non : l\'entraîneur élimine l\'eau, pas l\'ester, qui reste dans le milieu réactionnel.'),
            ] },
          { id: 'anhydride', titre: 'Changer de réactif', q: 'La voie (c) remplace l\'acide par son anhydride. Qu\'est-ce qui change ?',
            aide: 'L\'anhydride d\'acide est un dérivé plus réactif de l\'acide : comparez la réaction et son avancement maximal.',
            o: [
              V('La nouvelle réaction (anhydride + éthanol) est quasi totale ET bien plus rapide : rendement quasi total, sans équilibre gênant', 'Changer de réactif change la réaction elle-même : x_éq = 0,98 et k ×20 dans le modèle. C\'est le levier le plus radical... mais le réactif coûte plus cher.'),
              F('C\'est la même réaction, juste mieux mélangée', 'Non : la nature chimique du réactif change, donc la réaction change.'),
              F('L\'anhydride joue le rôle de catalyseur', 'L\'anhydride est consommé : c\'est un réactif, pas un catalyseur.'),
            ] },
        ],
        retenir: [`Trois leviers déplacent le plafond : l'excès d'un réactif (x_éq monte à ${nb(xr, 2)} pour r = ${nb(r, 0)}), l'élimination d'un produit (rendement quasi total), le changement de réactif (anhydride : quasi total et plus rapide).`],
      };
    },
  },

  // ── E6 (VAL, niveau 2) : comparer des protocoles (rendement, coût, chimie verte) ──
  {
    id: 'synthese-comparer-protocoles', domaine: DOM, niveau: 2,
    titre: 'Le choix du service production',
    construire: () => {
      const r = tire([2, 3]);
      const xA = xeqR(r);                            // protocole A : excès d'éthanol
      const xB = 0.98;                               // protocole B : anhydride
      const cA = 1 + 0.15 * (r - 1);                 // coût A (unités fictives, même loi que la simulation)
      const cB = 1 + 1.40;                           // coût B
      const vA = 100 - 4 * (r - 1);                  // chimie verte A
      const vB = 100 - 15;                           // chimie verte B
      return {
        enonce: `Deux protocoles sont en balance pour le prochain batch. Protocole A : acide butanoïque + éthanol en excès (r = ${nb(r, 0)}), sans autre artifice ; rendement maximal ${nb(xA, 2)}, coût ${nb(cA, 2)} unités fictives par mol, score chimie verte ${nb(vA, 0)}/100. Protocole B : anhydride d'acide + éthanol ; rendement quasi total (${nb(xB, 2)}), coût ${nb(cB, 2)} unités, score chimie verte ${nb(vB, 0)}/100 (réactif plus cher, sous-produit acide à traiter).`,
        etapes: [
          { id: 'crit', titre: 'Un protocole « meilleur » selon quel critère ?', q: 'Que signifie comparer des protocoles « en termes de rendement, de coût et de respect de l\'environnement » ?',
            aide: 'Trois indicateurs dans l\'énoncé : rendement maximal, coût, score chimie verte.',
            o: [
              V('Peser ensemble trois critères : l\'efficacité (rendement), l\'économie (coût) et l\'impact (chimie verte) ; le meilleur protocole est un compromis', 'Comparer et choisir, ce n\'est pas seulement calculer. Un protocole peut gagner sur un critère et perdre sur les autres.'),
              F('Choisir uniquement le rendement le plus élevé', 'Le rendement seul ignore le budget et l\'impact : le protocole B gagne en rendement mais coûte plus cher et marque moins bien côté environnement.'),
              F('Choisir le moins cher, le rendement s\'ajustera tout seul', 'Le rendement ne s\'ajuste pas tout seul : c\'est un plafond d\'équilibre.'),
            ] },
          { id: 'tableau', titre: 'Lire le comparatif', q: 'Quel protocole a le meilleur score chimie verte, et pourquoi ?',
            aide: `Comparez ${nb(vA, 0)} et ${nb(vB, 0)}.`,
            o: [
              V(`Le protocole A (${nb(vA, 0)}/100) : l'excès d'éthanol pénalise moins que le réactif cher et le sous-produit acide du protocole B`, 'L\'excès reste un réactif banal, peu coûteux à séparer ; l\'anhydride génère un sous-produit acide à traiter.'),
              F(`Le protocole B (${nb(vB, 0)}/100) : rendement plus élevé = forcément plus vert`, 'Un rendement élevé ne suffit pas : le cycle de vie du réactif compte aussi (sous-produit, sécurité, coût).'),
              F('Les deux scores sont identiques', `Non : ${nb(vA, 0)} contre ${nb(vB, 0)}.`),
            ] },
          { id: 'choix', titre: 'Valider la recommandation', q: `Le service production tranche : « Pour la gamme alimentaire, on retient le protocole A : rendement ${nb(xA * 100, 0)} % suffisant, coût maîtrisé (${nb(cA, 2)}), impact réduit. » Ce choix est-il cohérent avec les critères ?`,
            aide: 'Reprenez les trois critères un par un pour A et B.',
            o: [
              V('Oui : A sacrifie un peu de rendement mais gagne sur le coût et l\'impact ; c\'est un compromis assumé et argumenté', 'Le protocole B maximise le rendement mais perd sur deux critères : le choix de A est cohérent pour une gamme alimentaire à gros volume.'),
              F('Non : B est meilleur partout, A est irrationnel', `B n'est pas meilleur partout : coût ${nb(cB, 2)} contre ${nb(cA, 2)}, chimie verte ${nb(vB, 0)} contre ${nb(vA, 0)}.`),
              F('Non : le rendement est le seul critère recevable', 'Le rendement n\'est qu\'un des trois critères à peser.'),
            ] },
          { id: 'controle', titre: 'Un troisième fournisseur', q: `Un troisième fournisseur annonce « rendement 100 %, coût ${nb(cA - 0.2, 2)}, chimie verte ${nb(vA + 5, 0)}/100 » avec la même réaction acide + éthanol, sans élimination d'eau. Que faites-vous ?`,
            aide: `Quel est le plafond théorique pour acide + éthanol sans élimination d'eau ?`,
            o: [
              V('Je contrôle : le rendement maximal de cette réaction plafonne à 67-95 % selon l\'excès, jamais 100 % ; l\'annonce est impossible, je demande les conditions exactes', 'Aucun protocole acide + éthanol sans élimination d\'eau ne dépasse le plafond d\'équilibre : contrôler une annonce avec le modèle, c\'est la démarche de validation attendue.'),
              F('Je commande : les chiffres parlent d\'eux-mêmes', 'Des chiffres trop beaux doivent précisément alerter.'),
              F('Je commande en petite quantité pour tester', 'Mieux vaut d\'abord comparer l\'annonce au plafond théorique : elle est impossible en l\'état.'),
            ] },
        ],
        retenir: [`Choisir un protocole, c'est peser rendement, coût et impact (chimie verte) ensemble : le gagnant est un compromis argumenté. Toute annonce doit être contrôlée contre le plafond d'équilibre théorique.`],
      };
    },
  },
];
