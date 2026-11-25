// ═══════════════════════════════════════════════════════════════════════════
//  EXERCICES DE REMÉDIATION AJOUTÉS (lot 2, BTS Métiers de la chimie) : capacités du référentiel qui n'avaient pas d'exercice.
//  Chapitres : bts-mecanismes, bts-cinetique, bts-solubilite, bts-films, bts-rheologie, bts-tensioactifs, bts-plans.
//  Trois listes, branchées dans les banques existantes :
//   • BTSB_ANA  → PREVOIR (AtelierAnalyserBanque.js)       « prévoir sans calculer »
//   • BTSB_VAL  → PLAUSIBLES (AtelierValiderBanque.js)      « ça paraît plausible ? »
//   • BTSB_SIT  → SITUATIONS (AtelierSituationsBanque.js)   « comprendre une situation » (S'APP)
//  Chaque QCM : une seule bonne réponse, options de longueur comparable (la bonne n'est jamais la plus longue),
//  explication de chaque option. Questions qualitatives, adossées à une capacité exigible du référentiel BTS MC (S6 et S7).
// ═══════════════════════════════════════════════════════════════════════════
import { presenter } from './presenter.js';

const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = (o) => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });
const tire = (t) => t[Math.floor(Math.random() * t.length)];
const nb = (x, d = 0) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

const D_TR = 'Types de réaction et transposition (BTS)';
const D_SN = 'Substitution ou élimination (BTS)';
const D_CIN = 'Contrôle cinétique et thermodynamique (BTS)';
const D_FOR = 'Formulation';
const D_SEC = 'Séchage';
const D_RHE = 'Rhéologie';
const D_TENS = 'Tensioactifs : de la structure à la CMC';
const D_DISP = 'Mouiller, disperser, stabiliser une suspension';
const D_PLANS = 'Plans';

// ──────────────────────────────────────────────── ANA : prévoir sans calculer ────────────────────────────────────────────────
export const BTSB_ANA = [
  // ── Mécanismes : type de réaction ──
  { id: 'tr-ana-transposition', domaine: D_TR, titre: 'Un H qui change de carbone : quel type de réaction ?',
    enonce: 'Dans le carbocation CH₃–CH⁺–CH(CH₃)₂, un atome H du carbone voisin migre avec son doublet vers le carbone chargé et donne CH₃–CH₂–C⁺(CH₃)₂. Aucun atome n’est ajouté ni perdu.',
    q: 'De quel type de réaction s’agit-il ?', options: [
      V('Une transposition : un H migre sur le carbone voisin', 'La formule du cation ne change pas : seule la position de l’atome H (et donc de la charge) change. C’est une transposition (migration 1,2 d’un hydrure).'),
      F('Une réaction acide-base : un H⁺ est transféré à une base', 'Il n’y a pas de base ici : l’hydrogène migre avec son doublet à l’intérieur du même ion, et non sous forme de H⁺ vers une autre espèce.'),
      F('Une élimination : un H est perdu et une double liaison se forme', 'Aucune double liaison ne se forme et aucun atome n’est perdu : la charge change simplement de carbone.'),
      F('Une substitution : un H est remplacé par un autre groupe', 'Aucun groupe extérieur n’intervient : l’atome qui bouge appartient déjà à l’ion.'),
    ] },
  { id: 'tr-ana-e1-acidebase', domaine: D_TR, titre: 'La dernière étape d’une élimination E1',
    enonce: 'Dans une élimination E1, le carbocation (CH₃)₃C⁺ cède un H⁺ à une molécule d’eau : on obtient (CH₃)₂C=CH₂ et H₃O⁺.',
    q: 'Comment qualifier cette étape élémentaire, prise isolément ?', options: [
      V('Un transfert de H⁺ vers une base (H₂O) : une réaction acide-base', 'Le carbocation joue le rôle d’acide (il cède H⁺) et l’eau celui de base. Ce transfert crée la double liaison : avec l’étape qui forme le carbocation, l’ensemble est une élimination.'),
      F('Une substitution : l’eau remplace un groupe sur le carbone chargé', 'Ce serait le cas si l’eau attaquait le carbone C⁺ (SN1). Ici elle arrache un H⁺ : aucune liaison C–O ne se forme.'),
      F('Une transposition : un H migre vers le carbone chargé', 'Le H ne migre pas dans le cation : il le quitte, capté par l’eau.'),
      F('Une insertion : l’eau s’intercale dans une liaison C–H', 'L’eau ne s’intercale dans aucune liaison : elle capte seulement un H⁺.'),
    ] },
  // ── Mécanismes : étape lente et loi de vitesse ──
  { id: 'sn-ana-etape-lente', domaine: D_SN, titre: 'Doubler le nucléophile : la vitesse change-t-elle ?',
    enonce: 'Un halogénoalcane tertiaire réagit selon un mécanisme SN1 en deux étapes : rupture lente de C–Br (formation du carbocation), puis attaque rapide du nucléophile. On double la concentration du nucléophile, le reste étant inchangé.',
    q: 'Quel effet attend-on sur la vitesse globale de la réaction ?', options: [
      V('Aucun effet notable : le nucléophile agit après l’étape lente', 'La vitesse globale est fixée par l’étape lente, qui ne fait intervenir que le substrat : v = k·[RBr]. Le nucléophile agit ensuite, dans une étape rapide.'),
      F('La vitesse est doublée, car il y a deux fois plus de nucléophile', 'Ce serait vrai pour un mécanisme en une seule étape (SN2). Ici, l’étape lente ne contient pas le nucléophile.'),
      F('La vitesse est divisée par deux, car le nucléophile ralentit la rupture de C–Br', 'Le nucléophile n’intervient pas dans la rupture de C–Br : il ne peut ni l’accélérer ni la ralentir.'),
      F('La vitesse est multipliée par quatre, car les deux étapes sont accélérées', 'Seule l’étape lente fixe la vitesse globale, et elle ne dépend pas du nucléophile.'),
    ] },
  // ── Cinétique : diène conjugué, conditions ──
  { id: 'cinet-ana-non-conjugue', domaine: D_CIN, titre: 'Un diène non conjugué : pas de produit 1,4',
    enonce: 'Dans l’hexa-1,5-diène CH₂=CH–CH₂–CH₂–CH=CH₂, deux CH₂ séparent les deux doubles liaisons. H⁺ se fixe sur un CH₂ terminal et donne le carbocation secondaire CH₃–CH⁺–CH₂–CH₂–CH=CH₂.',
    q: 'Pourquoi n’obtient-on pas, comme avec le buta-1,3-diène, un produit d’addition 1,4 issu d’un carbocation délocalisé ?', options: [
      V('La charge ne peut pas se délocaliser : la double liaison est trop loin', 'Pour délocaliser la charge, il faut une double liaison directement voisine du carbone chargé (carbocation allylique). Ici deux CH₂ les séparent : la charge reste sur le carbone secondaire et Br⁻ s’y fixe.'),
      F('HBr ne s’additionne que sur un diène conjugué, jamais sur un diène isolé', 'HBr s’additionne sur n’importe quelle double liaison C=C. Ce qui manque ici, c’est la délocalisation de la charge.'),
      F('Le carbocation formé est primaire, donc trop instable pour être délocalisé', 'Le carbocation est secondaire. Et la stabilité n’est pas en cause : sans double liaison voisine, il n’y a pas de mésomérie possible.'),
      F('Le produit 1,4 se forme bien, mais il est instable et se décompose aussitôt', 'Aucun produit 1,4 ne peut se former : il faudrait une charge sur un carbone éloigné, qui n’existe pas ici.'),
    ] },
  { id: 'cinet-ana-froid-long', domaine: D_CIN, titre: 'À −78 °C, mais pendant deux jours',
    enonce: 'On fait réagir le buta-1,3-diène avec HBr à −78 °C et on laisse le mélange deux jours au lieu de quelques minutes. À cette température, la barrière inverse du produit 1,2 (environ 90 kJ·mol⁻¹) reste infranchissable.',
    q: 'Quel est le produit majoritaire ?', options: [
      V('Le produit 1,2 : sans retour possible, les vitesses fixent la composition', 'À −78 °C, le produit 1,2 ne peut pas se retransformer, même après deux jours : le contrôle reste cinétique et le produit formé le plus vite domine.'),
      F('Le produit 1,4 : après une longue durée, l’équilibre est toujours atteint', 'La durée ne suffit pas : l’équilibre n’est atteint que si les produits peuvent se retransformer, ce que la température trop basse interdit.'),
      F('Un mélange à parts égales, car deux jours égalisent les proportions', 'Rien n’égalise les proportions : sans retour, elles restent celles de la formation.'),
      F('Le produit 1,4, car il est plus stable que le produit 1,2 et la durée est longue', 'La stabilité ne décide de la composition que si l’équilibre est atteint, donc si le retour est possible.'),
    ] },
  // ── Solubilité : volatilité des solvants ──
  { id: 'for-solv-ana-pinceau', domaine: D_FOR, titre: 'Un solvant lourd dans une peinture au pinceau',
    enonce: 'Une peinture glycéro (en phase solvant), appliquée au pinceau, sèche en surface trop vite : on voit des traces de reprise. Le formulateur remplace une partie du solvant léger par un solvant lourd, peu volatil.',
    q: 'Quel effet attendre ?', options: [
      V('Le film reste ouvert plus longtemps : meilleur tendu, mais séchage plus lent', 'Un solvant lourd s’évapore lentement : la peinture reste fluide plus longtemps, ce qui laisse le temps de lisser les traces. En contrepartie, le film durcit plus tard.'),
      F('Le séchage est plus rapide, car un solvant lourd bout à plus haute température', 'Une température d’ébullition élevée traduit une faible volatilité : le solvant lourd s’évapore plus lentement, pas plus vite.'),
      F('Aucun effet : seule l’épaisseur du film fixe la durée avant séchage', 'L’épaisseur joue, mais la vitesse d’évaporation des solvants compte aussi : c’est ce qu’on change en choisissant un solvant plus lourd.'),
    ] },
  { id: 'for-solv-ana-sechage-melange', domaine: D_FOR, titre: 'Que reste-t-il dans le film pendant le séchage ?',
    enonce: 'Un vernis contient à parts égales un solvant léger (indice d’évaporation 5) et un solvant lourd (indice 0,2). Il sèche à l’air ; on néglige les interactions entre les deux solvants.',
    q: 'Comment évolue la composition du solvant restant dans le film ?', options: [
      V('Elle s’enrichit en solvant lourd, car le solvant léger part en premier', 'Le solvant léger s’évapore bien plus vite : au bout d’un moment, il en reste peu et le solvant lourd domine. Le film finit de durcir lentement, quand il s’en va à son tour.'),
      F('Elle reste à parts égales, car les deux solvants s’évaporent ensemble', 'Les deux solvants ne s’évaporent pas à la même vitesse : leurs indices d’évaporation diffèrent d’un facteur 25.'),
      F('Elle s’enrichit en solvant léger, car le solvant lourd part en premier', 'C’est l’inverse : un indice d’évaporation élevé signifie que le solvant part plus vite.'),
    ] },
  // ── Films : séchage physique ou chimique ──
  { id: 'sec-ana-mode-nitro', domaine: D_SEC, titre: 'Un vernis qui durcit sans réagir',
    enonce: 'Un vernis contient une résine nitrocellulosique déjà formée, dissoute dans un mélange de solvants. Appliqué en couche mince, il durcit en quelques dizaines de minutes à l’air ambiant.',
    q: 'Quel est son mode de séchage ?', options: [
      V('Physique : le solvant s’évapore et la résine reste déposée', 'La résine est déjà un polymère : il suffit que le solvant s’évapore pour obtenir un film. Aucune réaction chimique n’est nécessaire.'),
      F('Chimique par oxydation : le dioxygène de l’air réticule la résine', 'Ce séchage concerne les huiles et les résines alkydes (doubles liaisons et siccatif), pas une nitrocellulose.'),
      F('Chimique par réaction entre deux composants mélangés avant l’emploi', 'Ce serait un vernis bicomposant (époxy, polyuréthane). Ici, il n’y a qu’un seul composant.'),
      F('Photochimique : un rayonnement UV déclenche la réaction', 'La description ne mentionne ni photoinitiateur ni lampe UV.'),
    ] },
  { id: 'sec-ana-choix-pu', domaine: D_SEC, titre: 'Pourquoi choisir un vernis bicomposant ?',
    enonce: 'Un parquet très sollicité (frottements, produits ménagers) doit être protégé. Le formulateur hésite entre un vernis acrylique en dispersion aqueuse (séchage physique) et un vernis polyuréthane bicomposant (séchage chimique).',
    q: 'Quel argument justifie le bicomposant ?', options: [
      V('Le film réticulé est un réseau, plus résistant aux solvants et à l’abrasion', 'La réaction entre les deux composants relie les chaînes entre elles : le film ne se redissout pas et résiste mieux aux agressions qu’un film de particules simplement fusionnées.'),
      F('Il sèche sans aucune évaporation de solvant, donc il est toujours plus rapide', 'De nombreux bicomposants contiennent des solvants, et la rapidité n’est pas l’argument qui compte ici : c’est la résistance du film.'),
      F('Il se mélange à l’eau de nettoyage, ce qui le rend plus facile à entretenir', 'Un film résistant est au contraire peu sensible à l’eau et aux produits ménagers.'),
    ] },
  { id: 'sec-ana-durcisseur-exces', domaine: D_SEC, titre: 'Deux fois trop de durcisseur',
    enonce: 'Un vernis époxy bicomposant se prépare avec une quantité de durcisseur amine calculée à partir des poids équivalents. Un opérateur en verse par erreur deux fois plus que prévu.',
    q: 'Que risque-t-on d’obtenir ?', options: [
      V('Un film mou ou collant : des amines restent sans époxy à qui réagir', 'Le durcisseur est un réactif, pas un catalyseur : au-delà de la stœchiométrie, les amines en excès ne trouvent plus de groupes époxy. Le réseau est incomplet et le film reste mou ou collant.'),
      F('Un film plus dur, car davantage de durcisseur réticule davantage', 'La réticulation est limitée par le réactif en défaut (ici l’époxy) : l’excès d’amine ne crée pas de liaisons supplémentaires.'),
      F('Un film identique, car le durcisseur n’est qu’un catalyseur', 'Le durcisseur est consommé par la réaction : la stœchiométrie compte, il ne s’agit pas d’un catalyseur.'),
      F('Un film aussi résistant, mais séchant plus vite grâce à l’excès d’amine', 'L’excès ne renforce pas le film : il l’affaiblit, et le séchage n’en devient pas plus complet.'),
    ] },
  // ── Rhéologie ──
  { id: 'rheo-ana-bentonite', domaine: D_RHE, titre: 'Un gel d’argile qui se fluidifie sous agitation',
    enonce: 'Une bentonite (argile) gonflée dans l’eau forme un gel : au repos, il tient dans un pot renversé ; il coule quand on l’agite vigoureusement, puis se reprend en quelques minutes.',
    q: 'Quelle explication est la plus juste ?', options: [
      V('Le cisaillement détruit le réseau de particules, qui se reforme au repos', 'Les plaquettes d’argile forment un réseau d’interactions : l’agitation le détruit (la viscosité baisse), le repos le reconstitue peu à peu. C’est un comportement pseudoplastique et thixotrope.'),
      F('L’agitation dissout l’argile dans l’eau, qui se reforme ensuite en cristaux', 'L’argile ne se dissout pas : elle reste en suspension sous forme de particules.'),
      F('Le gel est newtonien : sa viscosité baisse seulement parce que l’eau chauffe', 'Un fluide newtonien a une viscosité indépendante du gradient. Ici, c’est le cisaillement qui agit, pas un échauffement.'),
    ] },
  { id: 'rheo-ana-choix-heur', domaine: D_RHE, titre: 'Épaissir sans dégrader le nivellement',
    enonce: 'Un formulateur veut une peinture dont la viscosité varie peu avec le gradient de vitesse, pour garder un bon nivellement et limiter les éclaboussures au rouleau. Il hésite entre trois additifs rhéologiques.',
    q: 'Lequel privilégier ?', options: [
      V('Un polyuréthane associatif de type HEUR, au profil quasi newtonien', 'Un HEUR donne une viscosité peu dépendante du gradient : bon nivellement et peu d’éclaboussures.'),
      F('Un ASE (alcali-gonflable) seul, très fortement pseudoplastique, à bas gradient', 'Un ASE apporte surtout de la viscosité à bas gradient avec une forte rhéofluidification, au détriment du nivellement : ce n’est pas le profil recherché.'),
      F('Une argile gélifiante (bentonite), à fort seuil d’écoulement et fortement thixotrope', 'Une argile donne un réseau à seuil, très rigide au repos et très rhéofluidifiant : l’inverse d’une viscosité peu dépendante du gradient.'),
    ] },
  { id: 'rheo-ana-flow-point', domaine: D_RHE, titre: 'Le flow point d’une pâte pigmentaire',
    enonce: 'On ajoute peu à peu du liquide à une poudre de pigment jusqu’à ce que la pâte coule : c’est le « flow point ». On refait l’essai avec le même pigment, en présence d’un dispersant efficace.',
    q: 'Comment évolue la quantité de liquide nécessaire pour atteindre le flow point ?', options: [
      V('Elle diminue : des particules séparées emprisonnent moins de liquide', 'Les amas de particules floculées retiennent du liquide qui ne sert pas à faire couler la pâte. Un dispersant sépare les particules : moins de liquide suffit, on peut donc charger davantage de pigment.'),
      F('Elle augmente : le dispersant absorbe et retient une partie du liquide ajouté', 'Un dispersant s’adsorbe sur les particules ; il ne retient pas de liquide et ne s’oppose pas à l’écoulement.'),
      F('Elle ne change pas : le flow point ne dépend que de la nature du pigment', 'Il dépend aussi de l’état d’agglomération des particules, que le dispersant modifie.'),
    ] },
  // ── Tensioactifs : mousses ──
  { id: 'mou-ana-role', domaine: D_TENS, titre: 'Pourquoi l’eau savonneuse mousse-t-elle ?',
    enonce: 'Si l’on agite de l’eau pure, les bulles éclatent aussitôt. Avec de l’eau additionnée d’un tensioactif, on obtient une mousse qui tient plusieurs minutes.',
    q: 'Quel est le rôle du tensioactif dans le film de liquide qui sépare deux bulles ?', options: [
      V('Il s’adsorbe aux deux interfaces air-eau et stabilise le film liquide', 'Les molécules se placent à la surface (tête dans l’eau, chaîne vers l’air) : elles abaissent la tension superficielle et ralentissent l’amincissement du film, donc l’éclatement des bulles.'),
      F('Il remplit les bulles d’un gaz plus léger que l’air, qui les fait remonter', 'Le gaz est l’air emprisonné pendant l’agitation : le tensioactif n’en produit pas.'),
      F('Il augmente la tension superficielle de l’eau, ce qui resserre chaque bulle', 'C’est l’inverse : il l’abaisse, ce qui facilite la création de surface et stabilise les films.'),
    ] },
  { id: 'mou-ana-antimousse', domaine: D_TENS, titre: 'Que fait un agent antimousse ?',
    enonce: 'Une peinture en phase aqueuse mousse à la fabrication. On y ajoute une très faible quantité d’un antimousse : une huile silicone, très peu soluble dans l’eau et de faible tension superficielle.',
    q: 'Quel est son mode d’action ?', options: [
      V('Il s’étale sur le film des bulles, l’amincit localement et le rompt', 'Peu soluble et de faible tension superficielle, il s’étale à la surface des films de mousse : ils s’amincissent jusqu’à la rupture.'),
      F('Il forme des micelles qui piègent le tensioactif et font éclater les bulles', 'Des micelles n’éclatent pas les bulles ; et l’antimousse est précisément peu soluble : il ne se dissout pas en micelles.'),
      F('Il augmente fortement la viscosité de l’eau et retient les bulles à l’intérieur', 'Retenir les bulles ferait persister la mousse : ce n’est pas ce que l’on cherche.'),
    ] },
  // ── Mouillage ──
  { id: 'disp-ana-angle', domaine: D_DISP, titre: 'Lire un angle de raccordement',
    enonce: 'On dépose une goutte d’eau sur trois supports. Sur le support 1, elle s’étale complètement (θ = 0°) ; sur le support 2, elle forme un angle de raccordement θ = 40° ; sur le support 3, elle reste presque sphérique (θ = 120°).',
    q: 'Comment classer ces trois situations ?', options: [
      V('1 : mouillage total ; 2 : mouillage partiel ; 3 : non-mouillage', 'Plus l’angle est petit, mieux le liquide s’étale : 0° est un mouillage total, 40° un mouillage partiel, et au-delà de 90° la goutte perle (non-mouillage).'),
      F('1 : non-mouillage ; 2 : mouillage partiel ; 3 : mouillage total', 'C’est inversé : un petit angle traduit un liquide qui s’étale, un grand angle une goutte qui perle.'),
      F('1 : mouillage partiel ; 2 : mouillage total ; 3 : non-mouillage', 'L’étalement complet (θ = 0°) est le mouillage total ; θ = 40° est un mouillage partiel.'),
      F('1, 2 et 3 : mouillage total, puisque la goutte reste en contact avec le support', 'Un simple contact ne suffit pas : c’est la valeur de l’angle qui distingue mouillage total, partiel et non-mouillage.'),
    ] },
  { id: 'disp-ana-zisman', domaine: D_DISP, titre: 'Quel liquide mouille totalement un plastique ?',
    ...presenter({ contexte: 'Un plastique a une tension critique de Zisman γc = 31 mN·m⁻¹ : un liquide l’étale complètement si sa tension superficielle est inférieure à γc.',
      liste: [['Eau pure', '72 mN·m⁻¹'], ['Éthanol', '22 mN·m⁻¹'], ['Eau additionnée d’un agent mouillant', '29 mN·m⁻¹']] }),
    q: 'Quels liquides mouillent totalement ce plastique ?', options: [
      V('L’éthanol et l’eau additionnée d’agent mouillant', 'Leurs tensions superficielles (22 et 29 mN·m⁻¹) sont inférieures à γc = 31 mN·m⁻¹ : ils s’étalent complètement.'),
      F('Seulement l’eau pure, car elle est la plus riche en liaisons hydrogène', 'Avec 72 mN·m⁻¹, l’eau pure est très au-dessus de γc : plus la tension superficielle est élevée, moins le liquide s’étale.'),
      F('L’eau pure et l’éthanol, mais pas l’eau additionnée d’agent mouillant', 'L’eau pure (72 mN·m⁻¹) dépasse γc, et l’eau avec agent mouillant (29 mN·m⁻¹) est en dessous : c’est l’inverse.'),
      F('Aucun des trois : un liquide ne peut jamais mouiller totalement un plastique', 'Un liquide de tension superficielle assez basse mouille totalement un plastique, c’est ce que fait l’éthanol ici.'),
    ] },
  // ── Plans d'expériences : courbes isoréponses ──
  { id: 'pmel-iso-resserrees', domaine: D_PLANS, titre: 'Des courbes isoréponses resserrées',
    enonce: 'Sur le diagramme ternaire d’un plan de mélange, on trace les courbes isoréponses de la fermeté d’un rouge à lèvres, de 10 g en 10 g. Dans une zone, ces courbes sont très rapprochées ; dans une autre, elles sont très espacées.',
    q: 'Que signifie une zone où les courbes sont très rapprochées ?', options: [
      V('La fermeté varie vite : un petit écart de formule la change beaucoup', 'Entre deux courbes voisines, la réponse change de 10 g. Si elles sont proches, un petit déplacement dans le diagramme suffit à la modifier : la zone est sensible aux écarts de fabrication.'),
      F('La fermeté est presque constante dans cette zone, car les courbes sont voisines', 'C’est l’inverse : une réponse presque constante donnerait des courbes très espacées.'),
      F('Le modèle est plus précis dans cette zone que dans le reste du domaine d’étude', 'L’écart entre les courbes dit comment la réponse varie, pas la précision du modèle.'),
    ] },
  { id: 'pfac-iso-fenetre', domaine: D_PLANS, titre: 'Choisir des conditions entre deux courbes isoréponses',
    enonce: 'Sur la carte des courbes isoréponses du modèle de viscosité d’un flan (recette et température, en variables codées de −1 à +1), le cahier des charges demande une viscosité comprise entre 2 000 et 2 500 mPa·s. Les courbes 2 000 et 2 500 sont tracées.',
    q: 'Quelles conditions conviennent ?', options: [
      V('Toutes celles comprises entre les courbes 2 000 et 2 500, dans le domaine', 'La fenêtre est une bande : toute condition dont la réponse prévue est entre les deux valeurs convient. On choisit ensuite dans cette bande selon d’autres critères (coût, durée…).'),
      F('Seulement celles situées sur la courbe 2 250, qui est la valeur centrale', 'La courbe 2 250 est un cas particulier de la bande : les autres conditions de la bande respectent aussi le cahier des charges.'),
      F('Seulement celles situées exactement sur la courbe 2 000 ou sur la courbe 2 500', 'Les bords de la fenêtre conviennent, mais l’intérieur de la bande aussi : le cahier des charges demande un intervalle, pas deux valeurs.'),
      F('Celles situées au-delà de la courbe 2 500, car la viscosité y est plus sûre', 'Au-delà de 2 500 mPa·s, la viscosité dépasse la limite haute du cahier des charges : ces conditions ne conviennent pas.'),
    ] },
];

// ──────────────────────────────────────────────── VAL : ça paraît plausible ? ────────────────────────────────────────────────
export const BTSB_VAL = [
  P({ id: 'tr-val-addition-substitution', domaine: D_TR, niveau: 2, titre: 'Hydratation d’un alcène : addition ou substitution ?', plausible: false,
    enonce: 'On étudie CH₃–CH=CH₂ + H₂O → CH₃–CH(OH)–CH₃, en milieu acide. Un élève écrit : « C’est une substitution, car un groupe OH apparaît dans le produit. »',
    reperes: [['Substitution', 'un groupe est remplacé par un autre sur le même atome'], ['Addition', 'des atomes se fixent sur une liaison multiple, qui devient simple']],
    ver: 'Aucun groupe n’est remplacé : H et OH se fixent de part et d’autre de la double liaison C=C, qui devient simple. C’est une addition (hydratation de l’alcène). Dans une substitution, un groupe partant disparaîtrait du réactif.',
    q2: 'Quelle observation montre l’erreur ?',
    options: [
      V('Rien n’est remplacé : H₂O se fixe sur C=C, qui devient simple', 'Les deux atomes de la molécule d’eau se fixent sur les deux carbones de la double liaison : c’est la définition d’une addition.'),
      F('L’alcool formé est secondaire, donc la réaction est forcément une addition', 'La classe de l’alcool ne détermine pas le type de réaction : c’est ce qui change dans les liaisons du réactif qui compte.'),
      F('Un acide est présent, donc la réaction est forcément une réaction acide-base', 'L’acide joue ici le rôle de catalyseur : le type de la réaction se juge sur la transformation de la molécule organique.'),
    ] }),
  P({ id: 'sn-val-sn2-ordre', domaine: D_SN, niveau: 2, titre: 'SN2 : une étape, donc ordre 1 ?', plausible: false,
    enonce: 'Pour la SN2 du 1-bromobutane avec HO⁻, un élève écrit : « La réaction se fait en une seule étape, donc la vitesse ne dépend que de la concentration en 1-bromobutane : v = k·[RBr]. »',
    reperes: [['SN2', 'une étape, un seul état de transition où le substrat et le nucléophile sont présents'], ['Loi de vitesse d’une étape unique', 'elle contient les concentrations des entités qui y participent']],
    ver: 'Dans une SN2, le nucléophile attaque pendant que Br⁻ part : HO⁻ participe à l’unique étape, donc [HO⁻] figure dans la loi de vitesse : v = k·[RBr]·[HO⁻], d’ordre global 2. L’ordre 1 est celui de la SN1, où l’étape lente ne contient que le substrat.',
    q2: 'Quelle est l’erreur de raisonnement ?',
    options: [
      V('Il oublie que HO⁻ participe à l’unique étape, donc [HO⁻] figure dans v', 'L’unique étape fait intervenir RBr et HO⁻ : les deux concentrations apparaissent dans la loi de vitesse.'),
      F('Il a raison pour la SN2, car c’est la SN1 qui est d’ordre global 2 et non la SN2', 'C’est l’inverse : en SN1, la vitesse ne dépend que du substrat (ordre 1) ; en SN2, elle dépend du substrat et du nucléophile (ordre 2).'),
      F('Il confond la vitesse de la réaction et le rendement de la substitution obtenue', 'L’énoncé parle bien de la vitesse. Le rendement n’est pas en cause dans son raisonnement.'),
    ] }),
  P({ id: 'cinet-val-stable-rapide', domaine: D_CIN, niveau: 2, titre: 'Le produit le plus stable est-il le plus rapide ?', plausible: false,
    ...presenter({ contexte: 'À partir du carbocation allylique (énergie 20 kJ·mol⁻¹, réactifs = 0), le profil d’énergie indique, pour chaque voie :',
      liste: [['Voie 1,2', 'barrière à franchir depuis le carbocation : 10 kJ·mol⁻¹ ; produit à −60 kJ·mol⁻¹'], ['Voie 1,4', 'barrière à franchir depuis le carbocation : 14 kJ·mol⁻¹ ; produit à −68 kJ·mol⁻¹']],
      suite: 'Un élève écrit : « Le produit 1,4 est le plus stable, donc c’est aussi le plus rapide à se former : à 0 °C et en quelques secondes, il domine. »' }),
    reperes: [['Produit cinétique', 'celui dont la barrière de formation est la plus basse'], ['Produit thermodynamique', 'celui dont l’énergie est la plus basse']],
    ver: 'La stabilité (énergie du produit) et la vitesse (hauteur de la barrière) sont deux notions distinctes. Ici, la barrière du produit 1,2 (10 kJ·mol⁻¹) est plus basse que celle du produit 1,4 (14 kJ·mol⁻¹) : à 0 °C et sur un temps court, aucun produit ne se retransforme et le plus rapide, le 1,2, domine. Le 1,4, plus stable, ne domine qu’à l’équilibre (température plus élevée, temps long).',
    q2: 'Quelle est l’erreur de raisonnement ?',
    options: [
      V('Il confond la stabilité du produit et la vitesse de sa formation', 'La stabilité se lit sur l’énergie du produit, la vitesse sur la barrière. Le produit le plus stable (1,4) n’est pas le plus rapide à se former (1,2).'),
      F('Il pense que le produit 1,4 est moins stable que le produit 1,2 sur ce profil', 'Non : sur le profil, le produit 1,4 est bien plus bas en énergie (−68 contre −60 kJ·mol⁻¹). Son constat de stabilité est exact.'),
      F('Il ignore que la barrière de formation du produit 1,4 est la plus basse des deux', 'C’est faux : la barrière du produit 1,2 (10 kJ·mol⁻¹) est inférieure à celle du produit 1,4 (14 kJ·mol⁻¹).'),
    ] }),
  P({ id: 'cinet-val-equilibre-egal', domaine: D_CIN, niveau: 2, titre: 'Réversible veut-il dire 50 % de chaque produit ?', plausible: false,
    enonce: 'À 60 °C, après plusieurs heures, les deux produits d’addition de HBr sur le buta-1,3-diène se retransforment l’un en l’autre par le carbocation. Le produit 1,4 est plus stable que le produit 1,2 de 8 kJ·mol⁻¹. Un élève écrit : « Comme la réaction est réversible, l’équilibre donne 50 % de chaque produit. »',
    reperes: [['À l’équilibre', 'la composition reflète les stabilités des produits'], ['Plus un produit est stable', 'plus sa proportion à l’équilibre est grande']],
    ver: 'Réversible ne veut pas dire à parts égales : à l’équilibre, la composition dépend de l’écart d’énergie entre les produits. Le produit 1,4, plus stable de 8 kJ·mol⁻¹, domine nettement ; seule une égalité d’énergie conduirait à 50 / 50.',
    q2: 'Quelle est l’erreur ?',
    options: [
      V('Il oublie que l’écart d’énergie fixe les proportions à l’équilibre', 'L’équilibre n’est pas un partage à parts égales : le produit le plus stable y est majoritaire, d’autant plus que l’écart d’énergie est grand.'),
      F('Il oublie que le retour 1,2 → 1,4 est impossible à 60 °C', 'L’énoncé indique au contraire que les produits se retransforment l’un en l’autre à cette température.'),
      F('Il a raison : à l’équilibre, les vitesses de retour sont égales, donc les quantités aussi', 'À l’équilibre, la vitesse de l’aller est égale à celle du retour pour chaque produit, mais cela n’impose pas des quantités égales : les constantes de vitesse diffèrent.'),
    ] }),
  P({ id: 'for-cov-val-eau', domaine: D_FOR, niveau: 1, titre: 'Taux de COV d’une peinture à l’eau', plausible: false,
    ...presenter({ contexte: 'Une peinture acrylique en phase aqueuse a la composition suivante pour 100 g :',
      liste: [['Eau', '45 g'], ['Liant acrylique (extrait sec)', '30 g'], ['Pigments et charges', '21 g'], ['Coalescent (éther de glycol, organique et volatil)', '3 g'], ['Additifs non volatils', '1 g']],
      suite: 'Un élève calcule le taux de COV (masse de composés organiques volatils pour 100 g de peinture) : (45 + 3) / 100 = 48 %.' }),
    reperes: [['COV', 'composés organiques volatils : solvants organiques, coalescents volatils…'], ['Peinture en phase aqueuse', 'taux de COV de l’ordre de quelques pour cent'], ['Peinture en phase solvant', 'taux de COV de plusieurs dizaines de pour cent']],
    ver: 'L’eau s’évapore mais n’est pas un composé organique : elle ne compte pas dans les COV. Seul le coalescent (3 g) en est un : 3 / 100 = 3 %, valeur courante pour une peinture en phase aqueuse. 48 % est une valeur de peinture en phase solvant.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Il a compté l’eau, qui s’évapore mais n’est pas organique', '(45 + 3) / 100 = 48 % : l’eau (45 g) a été comptée avec le coalescent. Elle n’est pas un composé organique.'),
      F('Il a oublié de compter le liant dans les COV', 'Le liant reste dans le film (extrait sec) : il ne s’évapore pas, donc il n’est pas un COV.'),
      F('Il a divisé par la masse d’eau au lieu de diviser par la masse totale', '(45 + 3) / 45 donnerait 107 % : ce n’est pas le résultat de l’élève.'),
    ] }),
  P({ id: 'sec-val-photo-ombre', domaine: D_SEC, niveau: 2, titre: 'Vernis UV dans les creux d’une pièce', plausible: false,
    enonce: 'Un vernis photoréticulable sèche en quelques secondes sous une lampe UV sur des panneaux plats. Un formulateur écrit : « Sur une pièce moulée très creuse, il séchera aussi vite partout, même dans les creux que la lampe n’éclaire pas, puisque c’est le même vernis. »',
    reperes: [['Photoréticulation', 'le photoinitiateur absorbe les UV et produit des espèces réactives qui déclenchent la réticulation'], ['Sans rayonnement', 'pas d’espèces réactives, donc pas de réticulation rapide']],
    ver: 'La réaction est déclenchée par le rayonnement : là où les UV n’arrivent pas, le photoinitiateur ne produit rien et le vernis reste liquide ou collant. C’est une limite classique du séchage UV sur les pièces de forme complexe.',
    q2: 'Quelle est l’erreur de raisonnement ?',
    options: [
      V('Il oublie que la réticulation n’a lieu que là où arrivent les UV', 'Le photoinitiateur ne s’active que sous rayonnement : dans les creux non éclairés, le vernis ne réticule pas.'),
      F('Il oublie que le vernis doit d’abord s’évaporer pour sécher', 'Beaucoup de vernis UV ne contiennent pas de solvant : le durcissement vient de la réaction, pas de l’évaporation.'),
      F('Il confond le temps de séchage et la quantité de vernis appliquée', 'La quantité joue sur l’épaisseur, mais l’erreur porte sur l’absence de lumière dans les creux.'),
    ] }),
  P({ id: 'sec-val-durcisseur-inverse', domaine: D_SEC, niveau: 2, titre: 'Quantité de durcisseur d’un époxy', plausible: false,
    ...presenter({ contexte: 'On prépare 100 g de résine époxy avec un durcisseur amine.',
      liste: [['Résine époxy', 'poids équivalent époxy PEE = 190 g·éq⁻¹'], ['Durcisseur', 'poids équivalent hydrogène actif PEH = 60 g·éq⁻¹']],
      suite: 'Un élève écrit : m(durcisseur) = 100 × PEE / PEH = 100 × 190 / 60 = 317 g de durcisseur pour 100 g de résine.' }),
    reperes: [['Stœchiométrie', '1 hydrogène actif de l’amine pour 1 groupe époxy'], ['Quantité usuelle', 'quelques dizaines de grammes de durcisseur pour 100 g de résine époxy']],
    ver: 'Il faut autant d’équivalents d’hydrogène actif que d’équivalents d’époxy : 100 / PEE = m / PEH, donc m = 100 × PEH / PEE = 100 × 60 / 190 ≈ 32 g. L’élève a inversé le rapport : 317 g de durcisseur pour 100 g de résine représenterait plus de trois fois la masse de résine, ce qui n’est pas usuel.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Il a inversé le rapport des poids équivalents', 'Il a calculé 100 × PEE / PEH = 317 au lieu de 100 × PEH / PEE ≈ 32 g.'),
      F('Il a oublié de convertir les grammes en kilogrammes', 'Les trois grandeurs (100 g, 190 g·éq⁻¹, 60 g·éq⁻¹) sont cohérentes entre elles : aucune conversion n’est nécessaire.'),
      F('Il a ajouté les deux poids équivalents avant de diviser', '100 × (190 + 60) / 60 donnerait 417 g : ce n’est pas le résultat de l’élève.'),
    ] }),
  P({ id: 'rheo-val-newtonien-sedim', domaine: D_RHE, niveau: 2, titre: 'Rendre une peinture newtonienne pour éviter la sédimentation ?', plausible: false,
    enonce: 'Une peinture sédimente en pot : les charges se déposent en quelques semaines, alors que la peinture est très fluide au rouleau. Un élève propose : « Il faut un additif qui la rende newtonienne, avec une viscosité constante pour tous les gradients. »',
    reperes: [['Sédimentation en pot', 'se joue à très bas gradient de vitesse (de l’ordre de 0,01 à 1 s⁻¹)'], ['Application au rouleau', 'gradient de 1 000 à 10 000 s⁻¹']],
    ver: 'Un fluide newtonien a la même viscosité à tous les gradients. Pour retenir les charges, il faudrait une viscosité élevée à bas gradient : elle serait alors aussi élevée au rouleau, et la peinture serait impossible à appliquer. Il faut au contraire une viscosité qui baisse quand le gradient augmente (pseudoplastique, voire à seuil).',
    q2: 'Quel est le défaut de la proposition ?',
    options: [
      V('Une viscosité constante interdit d’être épaisse au repos et fluide au rouleau', 'Épaisse au repos pour retenir les charges, fluide au rouleau pour s’appliquer : c’est une viscosité qui dépend du gradient, donc l’opposé d’un comportement newtonien.'),
      F('Un fluide newtonien n’a pas de viscosité mesurable avec un viscosimètre rotatif', 'Un fluide newtonien a une viscosité parfaitement définie et mesurable : c’est le cas de l’eau ou d’une huile.'),
      F('La vitesse de sédimentation ne dépend pas de la viscosité de la peinture au repos', 'Elle en dépend : une forte viscosité à bas gradient ralentit le dépôt des particules.'),
    ] }),
  P({ id: 'rheo-val-defloc-optimum', domaine: D_RHE, niveau: 2, titre: 'Lire une courbe de défloculation', plausible: false,
    ...presenter({ contexte: 'On mesure la viscosité d’une suspension de ciment pour plusieurs dosages en dispersant (courbe de défloculation) :',
      liste: [['Dosage 0 %', '12 000 mPa·s'], ['Dosage 0,2 %', '1 500 mPa·s'], ['Dosage 0,4 %', '400 mPa·s'], ['Dosage 0,6 %', '420 mPa·s'], ['Dosage 1,0 %', '900 mPa·s']],
      suite: 'Un élève écrit : « Le dosage optimal est 1,0 %, la plus forte dose, car c’est là que la suspension est la mieux dispersée. »' }),
    reperes: [['Courbe de défloculation', 'viscosité en fonction du dosage en dispersant'], ['Dosage optimal', 'celui qui donne la viscosité minimale (ou le début du palier)']],
    ver: 'La viscosité diminue jusqu’à 0,4 % puis remonte : à 1,0 %, elle est plus de deux fois supérieure au minimum (900 contre 400 mPa·s). Le dosage optimal est voisin de 0,4 %. Au-delà, l’excès de dispersant est inutile, coûteux, et peut même nuire (ici, la viscosité remonte).',
    q2: 'Quelle est l’erreur de raisonnement ?',
    options: [
      V('Il choisit la dose maximale au lieu du minimum de viscosité', 'La suspension est la mieux dispersée quand la viscosité est minimale, vers 0,4 %. Plus de dispersant n’est pas forcément mieux.'),
      F('Il a raison : un dispersant en excès ne peut pas augmenter la viscosité', 'Si : les mesures montrent une remontée de 400 à 900 mPa·s entre 0,4 % et 1,0 %. Un excès de dispersant peut dégrader la dispersion.'),
      F('Il aurait dû choisir 0,2 %, car c’est la première baisse importante de viscosité', 'À 0,2 %, la viscosité (1 500 mPa·s) est encore près de quatre fois supérieure au minimum (400 mPa·s).'),
    ] }),
  P({ id: 'mou-val-dose', domaine: D_TENS, niveau: 2, titre: 'Dix fois plus de tensioactif : dix fois plus de mousse ?', plausible: false,
    enonce: 'Pour un shampooing, la tension superficielle cesse de baisser à partir de la CMC, voisine de 8 mmol·L⁻¹. Le shampooing contient 20 mmol·L⁻¹ de tensioactif. Un formulateur écrit : « Si je passe à 200 mmol·L⁻¹, soit dix fois plus, j’aurai dix fois plus de mousse. »',
    reperes: [['Au-delà de la CMC', 'la concentration en monomères libres n’augmente plus : la tension superficielle est quasi constante'], ['Additifs supermoussants', 'ils augmentent et stabilisent la mousse (amides, bétaïnes…)']],
    ver: 'Au-delà de la CMC, la concentration en monomères libres, donc la tension superficielle, ne varie presque plus : le tensioactif ajouté forme des micelles. La mousse atteint un palier ; elle ne croît pas proportionnellement. Pour en obtenir davantage ou la stabiliser, on ajoute plutôt un additif supermoussant.',
    q2: 'Quelle est l’erreur de raisonnement ?',
    options: [
      V('Passé la CMC, le tensioactif en plus forme des micelles, pas plus de mousse', 'Les monomères libres ne sont plus plus nombreux : la tension superficielle ne baisse plus, et la mousse plafonne.'),
      F('La mousse diminue quand on augmente la concentration en tensioactif au-delà de la CMC', 'Elle ne diminue pas : elle atteint un palier, sans croître proportionnellement.'),
      F('Les micelles se transforment en bulles, ce qui multiplie encore la mousse', 'Une micelle n’est pas une bulle de gaz : elle ne contient pas d’air et ne forme pas de mousse.'),
    ] }),
  P({ id: 'disp-val-angle-grand', domaine: D_DISP, niveau: 2, titre: 'Un angle de raccordement de 110°', plausible: false,
    enonce: 'On mesure un angle de raccordement θ = 110° pour une goutte d’encre à l’eau sur un film plastique. Un élève conclut : « L’angle est grand, donc l’encre s’étale très bien : le mouillage est excellent. »',
    reperes: [['θ proche de 0°', 'mouillage total'], ['0° < θ < 90°', 'mouillage partiel'], ['θ > 90°', 'non-mouillage : la goutte perle']],
    ver: 'Plus l’angle est grand, moins le liquide mouille : au-delà de 90°, la goutte reste bombée et perle. Avec 110°, l’encre ne mouille pas le film. Il faut abaisser la tension superficielle de l’encre (agent mouillant) ou traiter la surface (corona, plasma).',
    q2: 'Quelle est l’erreur ?',
    options: [
      V('Il lit l’angle à l’envers : plus θ est grand, moins le liquide s’étale', 'Un liquide qui s’étale donne un petit angle de raccordement ; une goutte qui perle donne un grand angle.'),
      F('Il a raison : l’angle de raccordement mesure l’étalement, donc plus il est grand mieux c’est', 'Faux : un grand angle correspond à une goutte bombée, donc à un mauvais mouillage.'),
      F('Il confond l’angle de raccordement et la tension superficielle de l’encre', 'Ce sont deux grandeurs différentes : l’angle dépend du couple liquide–support. Son erreur porte sur le sens de lecture de l’angle.'),
    ] }),
  P({ id: 'pfac-iso-extrapolation', domaine: D_PLANS, niveau: 3, titre: 'Optimum lu hors du domaine d’étude', plausible: false,
    ...presenter({ contexte: 'Dans le plan 2² du flan (recette et température codées de −1 à +1), le modèle de la note du jury donne des courbes isoréponses, qu’un logiciel prolonge au-delà du domaine d’étude. Les niveaux de température sont 75 °C (−1) et 102 °C (+1).',
      suite: 'Un élève lit sur la carte que la note maximale est atteinte pour une température codée de +1,6, soit environ 110 °C, et recommande de travailler à cette température.' }),
    reperes: [['Domaine d’étude', 'niveaux codés de −1 à +1, soit de 75 °C à 102 °C'], ['Modèle', 'établi à partir d’essais réalisés uniquement dans ce domaine']],
    ver: 'Les essais n’ont été réalisés qu’entre 75 °C et 102 °C. À 110 °C, on extrapole : rien ne garantit que le modèle reste valable (le flan peut, par exemple, trop cuire). La température recommandée doit rester dans le domaine d’étude, ou être vérifiée par un essai de confirmation.',
    q2: 'Quelle est l’erreur de raisonnement ?',
    options: [
      V('Il utilise le modèle hors du domaine où les essais ont été faits', 'Le modèle n’est validé que là où l’on a mesuré. Au-delà, c’est une extrapolation, non garantie.'),
      F('Il se trompe de conversion : +1,6 ne correspond pas à 110 °C', 'Sa conversion est correcte : 88,5 + 1,6 × 13,5 ≈ 110 °C. L’erreur est ailleurs.'),
      F('Il oublie que la note maximale se trouve toujours au centre du domaine', 'Aucune règle ne place le maximum au centre : il peut être au bord du domaine ou à l’intérieur.'),
    ] }),
];

// ──────────────────────────────────────────────── S'APP : comprendre une situation ────────────────────────────────────────────────
// Format de AtelierSituationsBanque.js : { id, domaine, niveau, titre, construire }.
const HANSEN_POLY = { dD: 16.0, dP: 9.0, dH: 8.0, R0: 6.0 };
const SOLVANTS = [
  { nom: 'l’acétone', lib: 'Acétone', dD: 15.5, dP: 10.4, dH: 7.0, Teb: 56 },
  { nom: 'l’éthanol', lib: 'Éthanol', dD: 15.8, dP: 8.8, dH: 19.4, Teb: 78 },
  { nom: 'le toluène', lib: 'Toluène', dD: 18.0, dP: 1.4, dH: 2.0, Teb: 111 },
  { nom: 'l’acétate d’éthyle', lib: 'Acétate d’éthyle', dD: 15.8, dP: 5.3, dH: 7.2, Teb: 77 },
];
export const raHansen = (s) => Math.sqrt(4 * (s.dD - HANSEN_POLY.dD) ** 2 + (s.dP - HANSEN_POLY.dP) ** 2 + (s.dH - HANSEN_POLY.dH) ** 2);

const COV_FORMULES = [
  { article: 'une', produit: 'peinture glycéro', lignes: [['Résine alkyde', 38], ['White spirit', 30], ['Dioxyde de titane', 25], ['Siccatifs et additifs non volatils', 7]], cov: 30 },
  { article: 'une', produit: 'peinture acrylique en phase aqueuse', lignes: [['Eau', 42], ['Liant acrylique (extrait sec)', 30], ['Pigments et charges', 22], ['Éther de glycol (coalescent)', 4], ['Additifs non volatils', 2]], cov: 4 },
  { article: 'un', produit: 'vernis cellulosique', lignes: [['Nitrocellulose', 35], ['Xylène', 40], ['Acétate de butyle', 20], ['Plastifiant non volatil', 5]], cov: 60 },
];

export const BTSB_SIT = [
  {
    id: 'for-hansen-sapp-donnees', domaine: D_FOR, niveau: 2, titre: 'Hansen : quelles données pour savoir si un solvant dissout un polymère ?',
    construire: () => {
      const s = tire(SOLVANTS), ra = raHansen(s), red = ra / HANSEN_POLY.R0, dedans = red < 1;
      const lig = (nom, o) => [nom, nb(o.dD, 1), nb(o.dP, 1), nb(o.dH, 1), o.Teb != null ? `${o.Teb} °C` : '—'];
      return {
        enonce: `On veut savoir si ${s.nom} dissout un polymère, de rayon de solubilité R₀ = ${nb(HANSEN_POLY.R0, 1)} MPa^½. La distance de Hansen est Ra² = 4 (ΔδD)² + (ΔδP)² + (ΔδH)², où Δ désigne l’écart entre le solvant et le polymère. Paramètres en MPa^½ :`,
        tableau: { entetes: ['Substance', 'δD', 'δP', 'δH', 'T d’ébullition'], lignes: [lig('Polymère', HANSEN_POLY), lig(s.lib, s)] },
        etapes: [
          { id: 'quoi', titre: 'Ce qu’il faut déterminer', q: 'Pour savoir si le solvant dissout le polymère, que faut-il comparer ?',
            aide: 'Le polymère est représenté par une sphère de solubilité, de centre ses paramètres et de rayon R₀.',
            o: [V('La distance Ra entre le solvant et le centre de la sphère, à comparer à R₀', 'Un solvant dissout le polymère s’il est dans la sphère de solubilité, donc si sa distance Ra au centre est inférieure à R₀ (RED = Ra / R₀ < 1).'),
              F('Les températures d’ébullition du solvant et du polymère, qui renseignent sur leur volatilité', 'La température d’ébullition renseigne sur la volatilité, pas sur la solubilité.'),
              F('La moyenne des trois paramètres du solvant, qu’on compare au rayon R₀ de la sphère', 'Les trois paramètres décrivent trois types d’interactions : on ne les moyenne pas, on mesure la distance au polymère.')] },
          { id: 'donnees', titre: 'Les données utiles', q: 'Quelles données du tableau faut-il utiliser ?',
            aide: 'Ra mesure l’écart entre deux jeux de paramètres. Quelles colonnes servent à le calculer ?',
            o: [V('δD, δP et δH du polymère et du solvant, et le rayon R₀', 'Ra se calcule à partir des trois écarts de paramètres ; R₀ sert à conclure.'),
              F('δD, δP et δH du solvant, et sa température d’ébullition', 'La température d’ébullition ne figure pas dans Ra, et il manque les paramètres du polymère.'),
              F('Seulement δH du solvant et du polymère, car la liaison hydrogène domine', 'Les trois paramètres interviennent dans Ra : on ne peut pas en ignorer deux.')] },
          { id: 'ra', titre: 'La distance Ra', q: 'Calculer Ra.', aide: 'Calcule 4 (ΔδD)² + (ΔδP)² + (ΔδH)², puis prends la racine carrée.',
            type: 'saisie', champs: [{ id: 'ra', lib: 'Ra', u: 'MPa^½', vrai: ra, tol: 0.05 }],
            expl: `Ra² = 4 × (${nb(s.dD - HANSEN_POLY.dD, 1)})² + (${nb(s.dP - HANSEN_POLY.dP, 1)})² + (${nb(s.dH - HANSEN_POLY.dH, 1)})² = ${nb(ra * ra, 1)}, donc Ra ≈ ${nb(ra, 1)} MPa^½.` },
          { id: 'concl', titre: 'La conclusion', q: 'Que conclure avec ce résultat ?', aide: 'Compare Ra à R₀ : RED = Ra / R₀.',
            o: [V(dedans ? 'Le solvant est dans la sphère (RED < 1) : bon solvant probable' : 'Le solvant est hors de la sphère (RED > 1) : mauvais solvant probable', `RED = ${nb(ra, 1)} / ${nb(HANSEN_POLY.R0, 1)} ≈ ${nb(red, 2)}, ${dedans ? 'inférieur' : 'supérieur'} à 1.`),
              F(dedans ? 'Le solvant est hors de la sphère (RED > 1) : mauvais solvant probable' : 'Le solvant est dans la sphère (RED < 1) : bon solvant probable', `C’est l’inverse : RED ≈ ${nb(red, 2)}.`),
              F('On ne peut rien conclure sans connaître la température d’utilisation du solvant', 'Le critère RED < 1 suffit pour conclure à l’échelle de ce modèle.')] },
        ],
        retenir: ['Pour décider si un solvant dissout un polymère : calculer la distance de Hansen Ra entre leurs jeux (δD, δP, δH), puis RED = Ra / R₀. RED < 1 : le solvant est dans la sphère de solubilité.'],
      };
    },
  },
  {
    id: 'for-cov-sapp-formule', domaine: D_FOR, niveau: 2, titre: 'Taux de COV d’un produit formulé : quels constituants compter ?',
    construire: () => {
      const f = tire(COV_FORMULES);
      return {
        enonce: `Voici la composition d’${f.article === 'une' ? 'une' : 'un'} ${f.produit}, pour 100 g de produit. On cherche son taux de COV (composés organiques volatils), en grammes de COV pour 100 g de produit.`,
        tableau: { entetes: ['Constituant', 'Masse (g)'], lignes: f.lignes.map(([n, m]) => [n, nb(m)]) },
        etapes: [
          { id: 'qui', titre: 'Les constituants à compter', q: 'Quels constituants comptent dans le taux de COV ?', aide: 'COV : composé organique volatil. Les deux mots comptent : organique, et volatil (il s’évapore).',
            o: [V('Les composés organiques qui s’évaporent : solvants, coalescents volatils', 'Un COV est à la fois organique et volatil.'),
              F('Tout ce qui s’évapore pendant le séchage, y compris l’eau contenue dans le produit', 'L’eau s’évapore mais n’est pas un composé organique : elle ne compte pas.'),
              F('Tous les composés organiques du produit, y compris la résine ou le liant', 'La résine et le liant sont organiques mais non volatils : ils restent dans le film.')] },
          { id: 'calc', titre: 'Le taux de COV', q: 'Calculer la masse de COV pour 100 g de produit.', aide: 'Additionne les masses des seuls constituants organiques et volatils.',
            type: 'saisie', champs: [{ id: 'cov', lib: 'Taux de COV', u: 'g pour 100 g', vrai: f.cov, tol: 0.05 }],
            expl: `Seuls les constituants organiques et volatils comptent : ${f.cov} g pour 100 g de produit, soit ${f.cov} % en masse.` },
        ],
        retenir: ['Le taux de COV compte les composés organiques volatils (solvants organiques, coalescents) : ni l’eau, qui s’évapore sans être organique, ni la résine ou le liant, organiques mais non volatils.'],
      };
    },
  },
  {
    id: 'sec-sapp-durcisseur', domaine: D_SEC, niveau: 2, titre: 'Vernis époxy bicomposant : quelle masse de durcisseur ?',
    construire: () => {
      const pee = tire([180, 190, 210]), peh = tire([50, 60, 80]), M = tire([200, 250, 500]), m = M * peh / pee;
      const visc = tire(['0,8', '1,2', '1,5']), pot = tire([30, 40, 60]);
      return {
        enonce: `Un vernis époxy bicomposant associe une résine époxy et un durcisseur amine. On prépare ${M} g de résine. Données des fiches techniques : résine, poids équivalent époxy PEE = ${pee} g·éq⁻¹ ; durcisseur, poids équivalent hydrogène actif PEH = ${peh} g·éq⁻¹, viscosité ${visc} Pa·s, durée pratique d’utilisation du mélange ${pot} min.`,
        etapes: [
          { id: 'regle', titre: 'La règle de dosage', q: 'Quelle condition fixe la quantité de durcisseur ?', aide: 'Chaque groupe époxy doit trouver un hydrogène actif de l’amine pour réagir.',
            o: [V('Autant d’équivalents d’hydrogène actif que d’équivalents d’époxy', 'La réaction consomme un hydrogène actif par groupe époxy : la stœchiométrie fixe la masse de durcisseur.'),
              F('Autant de masse de durcisseur que de masse de résine', 'Les poids équivalents sont différents : à masses égales, on n’a pas le même nombre d’équivalents.'),
              F('Un faible pourcentage de la masse de résine, comme pour un catalyseur', 'Le durcisseur est un réactif consommé, pas un catalyseur : sa quantité est stœchiométrique.')] },
          { id: 'donnees', titre: 'Les données utiles', q: 'Quelles données utiliser pour calculer la masse de durcisseur ?', aide: 'Cherche ce qui sert à compter les équivalents de chaque composant.',
            o: [V('PEE, PEH et la masse de résine', 'Les poids équivalents donnent le nombre d’équivalents de chaque composant ; la masse de résine fixe la quantité à traiter.'),
              F('PEE, PEH et la viscosité du durcisseur', 'La viscosité sert à la mise en œuvre, pas au dosage stœchiométrique.'),
              F('PEH, la masse de résine et la durée pratique d’utilisation', 'Il manque PEE, et la durée pratique d’utilisation ne joue pas dans le dosage.')] },
          { id: 'masse', titre: 'La masse de durcisseur', q: 'Calculer la masse de durcisseur à peser.', aide: 'Nombre d’équivalents d’époxy = masse de résine / PEE. La masse de durcisseur = ce nombre × PEH.',
            type: 'saisie', champs: [{ id: 'm', lib: 'Masse de durcisseur', u: 'g', vrai: m, tol: 0.05 }],
            expl: `${M} / ${pee} = ${nb(M / pee, 3)} éq d’époxy ; m(durcisseur) = ${nb(M / pee, 3)} × ${peh} ≈ ${nb(m, 1)} g.` },
        ],
        retenir: ['Dosage d’un bicomposant : autant d’équivalents de durcisseur que de résine. m(durcisseur) = m(résine) × PEH / PEE.'],
      };
    },
  },
];

