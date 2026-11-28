// Exercices de remédiation AJOUTÉS pour les chapitres de Terminale spécialité « tg-images-photons », « tg-circuit-rc », « tg-gaz-parfait » et « tg-bilans-energie »
// (capacités du programme qui n'avaient aucun exercice). Branchés dans AtelierAnalyserBanque.js (PREVOIR, RELATIONS, HYPOTHESES),
// AtelierValiderBanque.js (PLAUSIBLES) et AtelierDonneesBanque.js (ENONCES). Les schémas sont décrits dans SchemasTGPhysiqueB.jsx.
// Préfixes d'identifiants : lun- (lunette), pho- (photons), rc-, gpf-, pp1-, thm-, tht- (modes de transfert), ter- (bilan de la Terre).
import { presenter } from './presenter.js';

export const DOM_PHOTONS = 'Photons : effet photoélectrique et cellule photovoltaïque';
export const DOM_TRANSFERTS = 'Transferts thermiques et bilan de la Terre (TG)';
const DOM_LUN = 'Lunette afocale : schéma, faisceau et grossissement';
const DOM_RC = 'Circuit RC : charge et décharge d’un condensateur';
const DOM_GPF = 'Gaz parfait : équation d’état et limites du modèle';
const DOM_PP1 = 'Premier principe : énergie interne, transferts et bilan d’énergie';
const DOM_THM = 'Loi de Newton et thermostat : température d’un système au cours du temps';

const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });
const tire = t => t[Math.floor(Math.random() * t.length)];
const nb = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

// ───────────── ANA : prévoir sans calculer ─────────────
export const TGPB_ANA = [
  // ── Lunette afocale ──
  { id: 'lun-ana-identifier', domaine: DOM_LUN, titre: 'Quelle lentille pour l’objectif ?',
    ...presenter({ contexte: 'On veut construire une lunette astronomique afocale qui grossit, avec deux lentilles minces convergentes.', liste: [['Lentille L₁', 'distance focale 800 mm'], ['Lentille L₂', 'distance focale 40 mm']] }),
    q: 'Quel rôle donner à chaque lentille ?', options: [
      V('L₁ est l’objectif, L₂ est l’oculaire', 'Le grossissement G est le rapport de la distance focale de l’objectif à celle de l’oculaire : pour G > 1, l’objectif est la lentille de plus grande distance focale (L₁), tournée vers l’astre. G = 800 ÷ 40 = 20.'),
      F('L₂ est l’objectif, L₁ est l’oculaire', 'On trouverait G = 40 ÷ 800 = 0,05 : l’angle sous lequel on voit l’astre serait divisé par 20, la lunette ne grossirait pas.'),
      F('les deux rôles sont interchangeables : G reste le même', 'G est le rapport de f′_obj à f′_oc : échanger les lentilles inverse ce rapport, et donc G.'),
      F('l’objectif est la lentille la plus proche de l’œil', 'C’est l’oculaire qui est près de l’œil ; l’objectif est tourné vers l’astre observé.'),
    ] },
  { id: 'lun-ana-image-intermediaire', domaine: DOM_LUN, titre: 'Un objectif de plus grande focale',
    ...presenter({ schema: { type: 'lunetteTG', montre: { ocu: true, noms: true }, apres: { montre: { ocu: true, noms: true, incl: true, plan: true, image: true, foyers: 1 } } },
      contexte: 'Une lunette afocale vise une étoile hors de l’axe, vue sous un petit angle θ. L’objectif forme dans son plan focal image une image intermédiaire A₁B₁ ; l’oculaire la regarde ensuite.',
      suite: 'On remplace l’objectif par un autre, de distance focale deux fois plus grande (même angle θ, même oculaire).' }),
    q: 'Que devient la taille de l’image intermédiaire A₁B₁ ?', options: [
      V('elle est multipliée par 2', 'Pour un petit angle θ, A₁B₁ = f′_obj × θ : à θ fixé, la taille de l’image intermédiaire est proportionnelle à la distance focale de l’objectif.'),
      F('elle est divisée par 2', 'C’est l’inverse : un objectif de plus grande distance focale forme une image plus grande, car A₁B₁ = f′_obj × θ.'),
      F('elle ne change pas, car elle ne dépend que de l’angle θ', 'A₁B₁ dépend aussi de f′_obj : A₁B₁ = f′_obj × θ. À θ égal, l’image se forme plus loin de l’objectif et elle est plus grande.'),
      F('elle est multipliée par 4', 'A₁B₁ est proportionnelle à f′_obj (et non à son carré) : doubler f′_obj double A₁B₁.'),
    ] },
  // ── Effet photoélectrique ──
  { id: 'pho-ana-seuil', domaine: DOM_PHOTONS, titre: 'Ultraviolet faible, rouge intense',
    ...presenter({ schema: { type: 'photoTG' },
      contexte: 'Une plaque de zinc, éclairée par une lumière ultraviolette même très peu intense, éjecte des électrons. Éclairée par une lumière rouge très intense, elle n’en éjecte aucun.' }),
    q: 'Quelle interprétation retient le modèle particulaire de la lumière ?', options: [
      V('un photon UV a assez d’énergie pour extraire un électron, un photon rouge non', 'Un électron absorbe un seul photon, qui lui cède toute son énergie hν. Si hν est inférieure au travail d’extraction W, aucun électron ne sort, quel que soit le nombre de photons.'),
      F('la lumière rouge est si intense qu’elle empêche les électrons de sortir', 'Une plus grande intensité signifie plus de photons, pas un obstacle : le problème est l’énergie de chaque photon, trop faible.'),
      F('la lumière rouge transporte moins d’énergie au total, donc elle arrache moins d’électrons', 'C’est l’énergie d’un seul photon qui compte, pas l’énergie totale : les photons rouges, même très nombreux, ne s’additionnent pas sur un même électron.'),
      F('l’ultraviolet chauffe la plaque, ce qui libère les électrons', 'L’effet photoélectrique n’est pas un effet thermique : il se produit même avec une lumière très peu intense, dès que hν dépasse W.'),
    ] },
  { id: 'pho-ana-intensite', domaine: DOM_PHOTONS, titre: 'On double l’intensité lumineuse',
    ...presenter({ schema: { type: 'photoTG' },
      contexte: 'Une plaque métallique éjecte des électrons sous une lumière de fréquence ν, supérieure à la fréquence seuil.', suite: 'On double l’intensité de la lumière, sans changer sa fréquence.' }),
    q: 'Que deviennent le nombre d’électrons éjectés par seconde et leur énergie cinétique maximale ?', options: [
      V('le nombre double ; l’énergie cinétique maximale reste la même', 'L’intensité est proportionnelle au nombre de photons par seconde : deux fois plus de photons éjectent deux fois plus d’électrons. L’énergie d’un photon, hν, est inchangée, donc E_c,max = hν − W aussi.'),
      F('le nombre ne change pas ; l’énergie cinétique maximale double', 'Doubler l’intensité ne change pas l’énergie hν de chaque photon, donc pas E_c,max ; en revanche il y a plus de photons, donc plus d’électrons.'),
      F('le nombre et l’énergie cinétique maximale doublent', 'E_c,max = hν − W ne dépend que de la fréquence (et du métal), pas de l’intensité.'),
      F('rien ne change tant que la fréquence est la même', 'Le nombre d’électrons éjectés par seconde est proportionnel au nombre de photons reçus : il double.'),
    ] },
  { id: 'pho-ana-frequence', domaine: DOM_PHOTONS, titre: 'De la lumière bleue à la lumière violette',
    ...presenter({ schema: { type: 'photoTG' },
      contexte: 'Une plaque métallique est éclairée par une lumière bleue qui éjecte des électrons. On la remplace par une lumière violette (fréquence plus grande), de même intensité.' }),
    q: 'Que devient l’énergie cinétique maximale des électrons éjectés ?', options: [
      V('elle augmente : E_c,max = hν − W avec ν plus grande', 'Le bilan d’énergie d’un photon absorbé s’écrit hν = W + E_c,max. Avec un ν plus grand et un même métal (même W), E_c,max est plus grande, et elle augmente linéairement avec ν.'),
      F('elle ne change pas, car W ne change pas', 'W ne change pas, mais hν augmente : E_c,max = hν − W augmente.'),
      F('elle diminue, car la lumière violette est plus absorbée', 'L’énergie du photon augmente avec la fréquence : l’énergie disponible pour l’électron éjecté augmente aussi.'),
      F('elle augmente seulement si l’intensité augmente', 'E_c,max ne dépend pas de l’intensité mais de la fréquence : un photon de plus grande fréquence cède plus d’énergie à l’électron.'),
    ] },
  { id: 'pho-ana-applications', domaine: DOM_PHOTONS, titre: 'Cellule photovoltaïque et DEL',
    ...presenter({ contexte: 'Une cellule photovoltaïque et une diode électroluminescente (DEL) mettent toutes deux en jeu une interaction entre la lumière et la matière, mais en sens inverse.' }),
    q: 'Quelle description est correcte ?', options: [
      V('cellule : absorbe des photons et fournit un courant ; DEL : émet des photons', 'La cellule photovoltaïque convertit de l’énergie lumineuse en énergie électrique (absorption de photons). La DEL fait l’inverse : de l’énergie électrique est convertie en photons émis.'),
      F('cellule : émission de photons ; DEL : absorption de photons', 'C’est inversé : une cellule photovoltaïque absorbe de la lumière, une DEL en émet.'),
      F('les deux absorbent des photons pour produire un courant', 'Seule la cellule photovoltaïque absorbe des photons pour produire un courant ; la DEL en émet quand elle est traversée par un courant.'),
      F('les deux émettent des photons quand un courant les traverse, comme des lampes', 'Une cellule photovoltaïque n’émet pas de lumière : elle fournit un courant quand elle est éclairée.'),
    ] },
  // ── Circuit RC ──
  { id: 'rc-ana-comportement', domaine: DOM_RC, titre: 'Reconnaître un comportement capacitif',
    ...presenter({ contexte: 'Un dipôle a un comportement capacitif quand des charges de signes opposés s’accumulent sur deux surfaces conductrices placées en regard, séparées par un isolant.' }),
    q: 'Dans quelle situation observe-t-on ce comportement ?', options: [
      V('deux plaques en regard, séparées par de l’air, reliées à une pile', 'La pile apporte des charges positives sur une plaque et négatives sur l’autre : elles s’accumulent sans traverser l’air isolant. C’est le modèle du condensateur.'),
      F('un fil de cuivre parcouru par un courant continu qui circule en permanence', 'Les charges traversent le fil en circulant : il n’y a aucune accumulation de charges.'),
      F('un résistor traversé par un courant continu, qui s’échauffe', 'Dans un résistor, les charges circulent et dissipent de l’énergie par effet Joule ; elles ne s’accumulent pas sur des surfaces en regard.'),
      F('une lampe à incandescence allumée, traversée par un courant', 'Une lampe est traversée par un courant ; ses bornes ne portent pas de charges opposées accumulées sur des surfaces isolées l’une de l’autre.'),
    ] },
  { id: 'rc-ana-charge-tension', domaine: DOM_RC, titre: 'On double la tension aux bornes',
    ...presenter({ contexte: 'Un condensateur de capacité C est chargé sous une tension u. On le charge ensuite sous une tension deux fois plus grande, sans le changer.' }),
    q: 'Que deviennent la charge q d’une armature et la capacité C ?', options: [
      V('q double ; C ne change pas', 'q = C × u : à C fixée, q est proportionnelle à u. La capacité dépend de la construction du condensateur (surfaces, distance, isolant), pas de la tension appliquée.'),
      F('q ne change pas ; C double', 'C est une propriété du condensateur : elle ne change pas avec la tension. C’est la charge q = C × u qui double.'),
      F('q et C doublent', 'Seule q double : C est fixée par la géométrie et l’isolant du condensateur.'),
      F('q double ; C est divisée par 2', 'C ne varie pas du tout : si C était divisée par 2, q = C × u resterait constante.'),
    ] },
  { id: 'rc-ana-decharge-capacite', domaine: DOM_RC, titre: 'Décharger un condensateur plus gros',
    ...presenter({ schema: { type: 'rcSerie', generateur: false, signes: true, uC: true, i: true },
      contexte: 'Un condensateur de capacité C, chargé sous la tension E, est déchargé à travers un résistor de résistance R. On refait l’expérience avec un condensateur de capacité 2C, chargé sous la même tension E, et le même résistor.' }),
    q: 'Que deviennent le temps caractéristique τ et la tension initiale u_C(0) ?', options: [
      V('τ double ; u_C(0) = E ne change pas', 'τ = R × C est proportionnel à C : il double, la décharge est deux fois plus lente. La tension initiale est celle de la charge précédente, E.'),
      F('τ est divisé par 2 ; u_C(0) = E', 'Un condensateur plus gros stocke plus de charge à évacuer à travers le même R : la décharge est plus lente, τ = R × C augmente.'),
      F('τ ne change pas, car il ne dépend que de R ; u_C(0) = E', 'τ = R × C dépend aussi de C : il double.'),
      F('τ double ; u_C(0) = 2E', 'La tension initiale vaut E dans les deux cas (même tension de charge) : c’est la charge q = C × E qui double.'),
    ] },
  { id: 'rc-ana-capteur-niveau', domaine: DOM_RC, titre: 'Un capteur capacitif de niveau',
    ...presenter({ schema: { type: 'condoTG', cas: 'niveau' },
      contexte: 'Deux électrodes verticales sont plongées dans un réservoir contenant un liquide isolant. La capacité entre les électrodes dépend de la hauteur de liquide qui les sépare : elle est plus grande avec du liquide qu’avec de l’air entre elles.' }),
    q: 'Comment ce capteur renseigne-t-il sur le niveau du liquide ?', options: [
      V('on mesure la capacité, qui varie avec la hauteur de liquide (étalonnage)', 'Plus le liquide monte entre les électrodes, plus la capacité change : on mesure C (par exemple par la durée de charge d’un circuit RC) et on en déduit la hauteur.'),
      F('on mesure la pression exercée par le liquide sur les électrodes', 'Ce capteur ne mesure pas une pression : il détecte la variation de capacité due à la présence du liquide.'),
      F('le liquide devient conducteur et fait circuler un courant continu entre les électrodes', 'Le liquide est isolant : aucun courant ne circule dans le condensateur en régime stationnaire.'),
      F('on mesure la masse de liquide avec les électrodes', 'Les électrodes ne pèsent pas le liquide : seule la capacité du dispositif dépend du niveau.'),
    ] },
  { id: 'rc-ana-capteur-tau', domaine: DOM_RC, titre: 'Un capteur d’humidité dans un circuit RC',
    ...presenter({ schema: { type: 'rcSerie', generateur: true, uC: true, i: true },
      contexte: 'La capacité d’un capteur d’humidité capacitif augmente quand l’air devient plus humide. On le place en série avec un résistor de résistance R et on charge l’ensemble avec une source de tension constante ; on mesure le temps caractéristique τ de la charge.' }),
    q: 'L’air devient plus humide. Que devient τ ?', options: [
      V('τ augmente : C augmente et τ = R × C, la charge ralentit', 'Le circuit se charge plus lentement quand C est plus grande. Mesurer τ donne donc C, puis le taux d’humidité.'),
      F('τ diminue : plus d’humidité facilite la circulation du courant', 'L’humidité agit sur la capacité C du capteur, et τ = R × C augmente avec C.'),
      F('τ ne change pas, car τ ne dépend que de R', 'τ = R × C dépend aussi de C, et c’est justement C qui porte l’information sur l’humidité.'),
      F('τ ne change pas, mais la tension finale augmente', 'La tension finale est la tension E de la source, quelle que soit C. Seul τ change.'),
    ] },
  // ── Gaz parfait ──
  { id: 'gpf-ana-micro-pression', domaine: DOM_GPF, titre: 'Pourquoi la pression augmente quand on chauffe',
    ...presenter({ schema: { type: 'gazTG', cas: 'bouteille' },
      contexte: 'Une bouteille rigide et fermée contient un gaz. On le chauffe, sans en ajouter ni en retirer ; la pression mesurée par le manomètre augmente.' }),
    q: 'Quelle explication à l’échelle microscopique est correcte ?', options: [
      V('les molécules vont plus vite : plus de chocs, et plus forts, sur les parois', 'La pression macroscopique est due aux chocs des molécules sur les parois. Chauffer augmente l’agitation, donc la vitesse des molécules : la force exercée par unité de surface augmente.'),
      F('il y a plus de molécules dans la bouteille, donc plus de chocs sur les parois', 'La bouteille est fermée et on n’ajoute rien : le nombre de molécules ne change pas.'),
      F('les molécules grossissent et occupent davantage de place dans la bouteille', 'Les molécules ne changent pas de taille ; dans le modèle du gaz parfait, leur volume est de toute façon négligé.'),
      F('les molécules s’attirent plus fortement entre elles et pressent les parois', 'Les interactions entre molécules sont négligées dans le modèle du gaz parfait ; elles ne sont pas à l’origine de la pression.'),
    ] },
  { id: 'gpf-ana-micro-temperature', domaine: DOM_GPF, titre: 'Deux ballons à des températures différentes',
    ...presenter({ contexte: 'Deux récipients rigides identiques contiennent le même nombre de molécules du même gaz. Le récipient B est à une température plus élevée que le récipient A.' }),
    q: 'Comment se comparent la pression et l’agitation des molécules ?', options: [
      V('la pression est plus grande dans B ; les molécules y sont plus agitées', 'La température est une mesure macroscopique de l’agitation des molécules. À volume et quantité de matière fixés, P est proportionnelle à T : plus d’agitation, plus de chocs sur les parois, plus de pression.'),
      F('la pression est la même ; les molécules de B sont plus agitées', 'À V et n fixés, P × V = n × R × T donne une pression plus grande pour une température plus grande.'),
      F('la pression est plus grande dans B ; les molécules y sont moins agitées', 'La température plus élevée correspond à une agitation plus grande, pas plus faible.'),
      F('la pression est plus faible dans B ; les molécules y sont plus agitées', 'Plus d’agitation signifie plus de chocs sur les parois, donc une pression plus grande.'),
    ] },
  { id: 'gpf-ana-limites-volume', domaine: DOM_GPF, titre: 'Comprimer un gaz de plus en plus',
    ...presenter({ schema: { type: 'gazTG', cas: 'piston' },
      contexte: 'À température constante, le modèle du gaz parfait donne P × V = constante : si on augmente la pression sans limite, le volume du gaz tendrait vers zéro.' }),
    q: 'Pourquoi cette prévision est-elle irréaliste ?', options: [
      V('les molécules ont un volume propre : on ne peut pas les comprimer sans limite', 'Le modèle du gaz parfait néglige le volume des molécules et leurs interactions. À très haute pression, ces deux effets deviennent importants et le modèle n’est plus valable.'),
      F('la température augmente forcément pendant la compression', 'La compression est faite à température constante par hypothèse ; la limite du modèle est ailleurs : le volume propre des molécules.'),
      F('la quantité de matière de gaz diminue pendant la compression', 'Dans le piston, la quantité de matière reste constante : ce n’est pas la cause.'),
      F('le gaz parfait ne s’applique qu’en dessous de 1 bar, sans exception, ce qui l’exclut ici', 'Le modèle décrit bien beaucoup de gaz jusqu’à quelques bars (voire davantage) : il n’y a pas de seuil universel à 1 bar, mais il échoue à très haute pression.'),
    ] },
  { id: 'gpf-ana-limites-liquefaction', domaine: DOM_GPF, titre: 'Quand le gaz se liquéfie',
    ...presenter({ contexte: 'On comprime lentement du dioxyde de carbone à 20 °C. Vers 57 bar, des gouttes de liquide apparaissent.' }),
    q: 'Que dire du modèle du gaz parfait à cet instant ?', options: [
      V('il ne décrit plus le système : un gaz parfait ne se liquéfie jamais', 'Sans interactions entre molécules, il n’y aurait aucune cohésion et donc aucun liquide. L’apparition d’un liquide montre que les interactions ne sont plus négligeables : le modèle ne s’applique plus.'),
      F('il reste valable : P × V = n × R × T s’applique aux gaz comme aux liquides', 'L’équation d’état du gaz parfait ne vaut que pour un gaz où les interactions et le volume des molécules sont négligeables.'),
      F('il reste valable : T est exprimée en kelvins', 'Exprimer T en kelvins est nécessaire, pas suffisant : la validité du modèle dépend de l’état du gaz.'),
      F('il prévoit la liquéfaction à 57 bar', 'Le modèle du gaz parfait ne prévoit aucune liquéfaction, quelle que soit la pression.'),
    ] },
  // ── Premier principe ──
  { id: 'pp1-ana-contributions', domaine: DOM_PP1, titre: 'Un glaçon qui fond à 0 °C',
    ...presenter({ contexte: 'Un glaçon à 0 °C reçoit un transfert thermique et fond entièrement, en restant à 0 °C pendant toute la fusion.' }),
    q: 'Que devient l’énergie interne de l’eau, et pourquoi la température ne change-t-elle pas ?', options: [
      V('U augmente : l’énergie modifie les interactions entre molécules, pas leur agitation', 'L’énergie interne regroupe l’énergie cinétique microscopique (agitation, liée à T) et l’énergie potentielle d’interaction. Pendant la fusion, l’apport d’énergie rompt des liaisons : l’énergie potentielle augmente, l’agitation (donc T) reste la même.'),
      F('U reste constante, car la température ne change pas', 'U ne dépend pas que de T : l’énergie potentielle d’interaction augmente pendant la fusion, donc U augmente.'),
      F('U diminue, car le glaçon se transforme en liquide', 'Le glaçon reçoit de l’énergie : son énergie interne augmente.'),
      F('U augmente parce que l’agitation des molécules augmente, mais le thermomètre ne la détecte pas', 'L’agitation est liée à la température : si T est constante, l’énergie cinétique microscopique l’est aussi.'),
    ] },
  { id: 'pp1-ana-gaz-contribution', domaine: DOM_PP1, titre: 'Chauffer un gaz parfait à volume constant',
    ...presenter({ schema: { type: 'gazTG', cas: 'bouteille' },
      contexte: 'Un gaz parfait enfermé dans une bouteille rigide est chauffé : il reçoit un transfert thermique et aucun travail.' }),
    q: 'Quelle contribution microscopique à l’énergie interne varie ?', options: [
      V('seule l’énergie cinétique microscopique (agitation) augmente', 'Dans un gaz parfait, les molécules n’interagissent pas : il n’y a pas d’énergie potentielle d’interaction. U est la somme des énergies cinétiques microscopiques, qui augmente avec T.'),
      F('seule l’énergie potentielle d’interaction augmente', 'Les interactions sont négligées dans le modèle du gaz parfait : cette contribution est nulle.'),
      F('l’énergie cinétique microscopique et l’énergie potentielle d’interaction augmentent', 'Un gaz parfait n’a pas d’énergie potentielle d’interaction : seule l’agitation compte.'),
      F('aucune : le travail est nul, donc U est constante', 'Le transfert thermique reçu change U : ΔU = W + Q = Q ≠ 0, et l’agitation augmente.'),
    ] },
  { id: 'pp1-ana-distinguer', domaine: DOM_PP1, titre: 'Les termes d’un bilan d’énergie',
    ...presenter({ contexte: 'Un gaz enfermé dans un cylindre est comprimé par un piston ; il est en même temps chauffé par une plaque. On écrit le bilan d’énergie du gaz : ΔU = W + Q.' }),
    q: 'Quelle lecture de cette relation est correcte ?', options: [
      V('ΔU est la variation d’énergie du système ; W et Q sont des transferts', 'Le premier membre porte sur le système (ce qu’il gagne ou perd) ; W (travail du piston) et Q (transfert thermique de la plaque) sont des énergies échangées avec l’extérieur.'),
      F('W est la variation d’énergie du système ; ΔU et Q sont des transferts d’énergie', 'ΔU est la variation d’énergie interne du gaz, grandeur d’état du système ; W est un transfert d’énergie par travail.'),
      F('Q est la variation d’énergie du système ; ΔU et W sont des transferts', 'Q est un transfert thermique entre le système et l’extérieur, pas une variation d’énergie du système.'),
      F('les trois termes sont des transferts d’énergie', 'Seuls W et Q sont des transferts. ΔU est la variation de l’énergie interne du système.'),
    ] },
  // ── Modes de transfert thermique ──
  { id: 'tht-ana-modes', domaine: DOM_TRANSFERTS, titre: 'Conduction, convection ou rayonnement ?',
    ...presenter({ contexte: 'Trois situations :', liste: [['(1)', 'la poignée métallique d’une casserole chauffe, alors que seul le fond est sur le feu'], ['(2)', 'l’air chaud monte au-dessus d’un radiateur'], ['(3)', 'le Soleil chauffe la Terre à travers l’espace vide']] }),
    q: 'Quel mode de transfert thermique domine dans chaque situation ?', options: [
      V('(1) conduction ; (2) convection ; (3) rayonnement', 'Conduction : transfert de proche en proche dans un solide. Convection : déplacement de matière (air chaud qui monte). Rayonnement : transfert par ondes électromagnétiques, possible dans le vide.'),
      F('(1) convection ; (2) conduction ; (3) rayonnement', 'Dans la poignée solide, la matière ne se déplace pas : c’est de la conduction. L’air qui monte est un déplacement de matière : convection.'),
      F('(1) conduction ; (2) rayonnement ; (3) convection', 'Dans le vide il n’y a pas de matière à déplacer : le transfert du Soleil à la Terre est du rayonnement, et non de la convection.'),
      F('(1) rayonnement ; (2) convection ; (3) conduction', 'La conduction et la convection ont besoin de matière : elles ne peuvent pas transférer l’énergie du Soleil à travers le vide.'),
    ] },
  { id: 'tht-ana-thermos', domaine: DOM_TRANSFERTS, titre: 'Pourquoi une bouteille isolante isole',
    ...presenter({ schema: { type: 'thermoTG', cas: 'thermos' },
      contexte: 'Une bouteille isolante est faite d’une double paroi, avec du vide entre les deux parois, dont les surfaces intérieures sont argentées.' }),
    q: 'Quels modes de transfert thermique le vide entre les parois supprime-t-il ?', options: [
      V('conduction et convection, qui ont besoin de matière', 'Entre les parois il n’y a presque pas de matière : ni propagation de proche en proche, ni déplacement de matière. L’argenture, elle, limite le rayonnement, que le vide ne bloque pas.'),
      F('le rayonnement, car il ne se propage que dans la matière', 'Le rayonnement se propage dans le vide : c’est pourquoi les surfaces sont argentées (elles réfléchissent le rayonnement).'),
      F('la conduction seulement, mais pas la convection', 'Le vide supprime aussi la convection, qui nécessite un fluide en mouvement.'),
      F('aucun mode : le vide ne gêne pas les transferts d’énergie', 'Au contraire, sans matière, conduction et convection sont supprimées.'),
    ] },
  // ── Terre ──
  { id: 'ter-ana-albedo', domaine: DOM_TRANSFERTS, titre: 'Moins de glace, moins d’albédo',
    ...presenter({ schema: { type: 'terreTG' },
      contexte: 'On modélise la Terre sans atmosphère. Elle réfléchit une fraction A du rayonnement solaire (l’albédo), absorbe le reste et émet un rayonnement infrarouge. À l’équilibre, la puissance absorbée est égale à la puissance émise (loi de Stefan-Boltzmann : puissance émise proportionnelle à T⁴).',
      suite: 'Une partie des glaces fond : l’albédo diminue.' }),
    q: 'Que devient la température d’équilibre ?', options: [
      V('elle augmente : plus d’énergie solaire absorbée, donc plus d’énergie à émettre', 'Puissance absorbée ∝ (1 − A) : elle augmente quand A diminue. À l’équilibre, la puissance émise (∝ T⁴) doit augmenter aussi, donc T augmente.'),
      F('elle diminue : une Terre plus sombre émet moins de rayonnement infrarouge', 'Une Terre moins réfléchissante absorbe plus d’énergie ; pour l’évacuer elle doit émettre davantage, donc T augmente.'),
      F('elle ne change pas : la température ne dépend que de la distance entre la Terre et le Soleil', 'T dépend aussi de la fraction de rayonnement absorbée, donc de l’albédo.'),
      F('on ne peut pas savoir sans connaître la valeur numérique de l’albédo', 'Le sens de variation se prévoit sans valeur : moins d’albédo, plus d’énergie absorbée, T plus grande.'),
    ] },
  { id: 'ter-ana-serre', domaine: DOM_TRANSFERTS, titre: 'Plus de gaz à effet de serre',
    ...presenter({ schema: { type: 'terreTG', serre: true },
      contexte: 'Les gaz à effet de serre (dioxyde de carbone, méthane, vapeur d’eau) laissent passer le rayonnement visible du Soleil, mais absorbent une partie du rayonnement infrarouge émis par la surface et en renvoient une partie vers elle.' }),
    q: 'Leur concentration augmente. Que devient la température moyenne de la surface ?', options: [
      V('elle augmente : plus d’infrarouge est renvoyé vers la surface, qui doit se réchauffer', 'L’atmosphère renvoie davantage d’énergie vers le sol. Pour que la puissance qui s’échappe vers l’espace reste égale à celle reçue du Soleil, la température de la surface augmente.'),
      F('elle diminue : plus d’énergie est renvoyée vers l’espace par l’atmosphère', 'Les gaz à effet de serre renvoient une partie de l’infrarouge vers la surface, pas seulement vers l’espace : le résultat est un réchauffement.'),
      F('elle ne change pas : l’énergie reçue du Soleil reste la même, donc la température aussi', 'L’énergie reçue du Soleil est la même, mais l’atmosphère modifie la façon dont l’énergie quitte la Terre, donc la température d’équilibre.'),
      F('elle augmente, car ces gaz émettent davantage de lumière visible vers le sol', 'Ils absorbent et réémettent surtout de l’infrarouge, pas de la lumière visible.'),
    ] },
  { id: 'ter-ana-planetes', domaine: DOM_TRANSFERTS, titre: 'Mars et Vénus : laquelle est la plus froide ?',
    ...presenter({ contexte: 'On calcule la température d’équilibre de deux planètes sans atmosphère avec le même modèle : puissance absorbée par m² = frac((1 − A) × S₀|4) ; puissance émise = σ × T⁴. Mars reçoit S₀ = 586 W·m⁻² et a pour albédo A = 0,25. Vénus, plus proche du Soleil, reçoit S₀ = 2601 W·m⁻² mais son albédo est A = 0,77.' }),
    q: 'Quelle planète a la température d’équilibre la plus basse ?', options: [
      V('Mars : elle reçoit beaucoup moins de puissance du Soleil', 'P_abs vaut environ 110 W·m⁻² pour Mars et 150 W·m⁻² pour Vénus : Vénus absorbe plus malgré son albédo élevé, donc sa température d’équilibre (227 K) est plus haute que celle de Mars (210 K).'),
      F('Vénus : son albédo élevé réfléchit presque tout le rayonnement', 'L’albédo réduit la puissance absorbée, mais Vénus reçoit 4,4 fois plus de puissance : elle en absorbe encore 23 %, soit environ 150 W·m⁻², contre 110 pour Mars.'),
      F('Aucune : l’albédo compense exactement la distance au Soleil', 'Les puissances absorbées valent environ 110 et 150 W·m⁻² : elles ne sont pas égales, donc les températures non plus.'),
      F('On ne peut pas savoir sans connaître le rayon de chaque planète', 'Le rayon se simplifie dans le bilan (disque π R² éclairé, sphère 4 π R² qui émet) : il n’intervient pas.'),
    ] },
  { id: 'cel-ana-seuil', domaine: DOM_PHOTONS, titre: 'Quelle lumière une cellule en silicium ne convertit-elle pas ?',
    ...presenter({ contexte: 'Une cellule photovoltaïque en silicium a pour énergie seuil 1,12 eV : un photon n’est absorbé que si son énergie est au moins égale à cette valeur. On l’éclaire successivement avec quatre lumières monochromatiques de même puissance.' }),
    q: 'Laquelle de ces lumières ne produit aucun courant ?', options: [
      V('un infrarouge de 1400 nm', 'Son énergie est h × c divisé par λ ≈ 0,89 eV, inférieure à 1,12 eV : ses photons ne sont pas absorbés, même en grand nombre.'),
      F('un rouge de longueur d’onde 700 nm, de même puissance', 'Son énergie vaut environ 1,77 eV, supérieure à 1,12 eV : ces photons sont absorbés et libèrent des électrons.'),
      F('un vert de longueur d’onde 550 nm', 'Son énergie vaut environ 2,25 eV, supérieure au seuil : ces photons sont absorbés.'),
      F('un bleu de longueur d’onde 450 nm, de même puissance', 'Son énergie vaut environ 2,76 eV, supérieure au seuil : ces photons sont absorbés (l’excédent est perdu en chaleur).'),
    ] },
  { id: 'cel-ana-exces', domaine: DOM_PHOTONS, titre: 'Photon bleu ou photon rouge : lequel chauffe le plus la cellule ?',
    ...presenter({ contexte: 'Une cellule en silicium (énergie seuil 1,12 eV) absorbe un photon bleu d’énergie 2,8 eV, puis un photon rouge d’énergie 1,8 eV. Chaque photon absorbé libère un seul électron.' }),
    q: 'Que peut-on dire de l’énergie perdue en chaleur par chaque photon ?', options: [
      V('le photon bleu en perd davantage : son énergie dépasse plus le seuil', 'L’énergie utile est limitée au seuil (1,12 eV) : l’excédent vaut 1,68 eV pour le bleu contre 0,68 eV pour le rouge, et il chauffe la cellule.'),
      F('le photon rouge en perd davantage, car il est moins énergétique', 'Un photon moins énergétique a moins d’énergie à perdre : son excédent par rapport au seuil est plus petit.'),
      F('aucun des deux n’en perd : toute l’énergie absorbée devient électrique', 'Chaque photon libère un seul électron, qui n’emporte que l’énergie du seuil ; le reste chauffe la cellule.'),
      F('les deux en perdent autant, car ils libèrent chacun un électron', 'Les excédents d’énergie diffèrent : 1,68 eV pour le bleu, 0,68 eV pour le rouge.'),
    ] },
  { id: 'cel-ana-chaleur', domaine: DOM_PHOTONS, titre: 'Une cellule chauffe au soleil',
    ...presenter({ contexte: 'Un module photovoltaïque de rendement 20 % est exposé au plein Soleil. En touchant sa surface, on constate qu’elle est nettement plus chaude que l’air ambiant.' }),
    q: 'Comment l’expliquer ?', options: [
      V('les 80 % non convertis en électricité se retrouvent en chaleur', 'Le rendement η = frac(P_él|P_reçue) vaut 0,20 : les pertes valent 80 % de la puissance reçue, essentiellement sous forme de chaleur.'),
      F('le courant électrique produit chauffe la surface, car il circule dedans', 'La chaleur dégagée par le courant est faible ; la cause principale est la lumière absorbée qui n’est pas convertie en électricité.'),
      F('le module stocke la chaleur du Soleil comme une batterie', 'Un module photovoltaïque ne stocke pas l’énergie : il la convertit immédiatement ou la perd.'),
      F('le module a un rendement supérieur à 100 % : il crée de l’énergie', 'Un rendement est toujours inférieur à 100 % : un module ne peut pas fournir plus d’énergie qu’il n’en reçoit.'),
    ] },
  { id: 'phe-ana-metaux', domaine: DOM_PHOTONS, titre: 'Une lumière jaune sur deux métaux',
    ...presenter({ contexte: 'Un photon de lumière jaune transporte une énergie h ν d’environ 2,1 eV. On éclaire successivement une plaque de césium (travail d’extraction W = 2,0 eV) et une plaque de zinc (W = 4,3 eV).' }),
    q: 'Que se passe-t-il ?', options: [
      V('des électrons sont éjectés du césium seulement', 'Pour le césium, h ν = 2,1 eV dépasse W = 2,0 eV : des électrons sortent, avec E_c,max = 0,1 eV. Pour le zinc, h ν est inférieure à W = 4,3 eV : aucun électron, même si la lumière est très intense.'),
      F('des électrons sont éjectés du zinc seulement, car il est plus dur à ioniser', 'Un travail d’extraction plus grand rend l’éjection plus difficile, pas plus facile : il faut des photons plus énergétiques.'),
      F('des électrons sont éjectés des deux métaux, mais plus vite du zinc', 'L’énergie du photon (2,1 eV) est inférieure au travail d’extraction du zinc (4,3 eV) : aucun électron n’en sort.'),
      F('aucun électron n’est éjecté, la lumière visible n’ayant jamais assez d’énergie', 'Cela dépend du métal : le césium a un travail d’extraction faible (2,0 eV), inférieur à l’énergie d’un photon jaune.'),
    ] },
  { id: 'phe-ana-droite', domaine: DOM_PHOTONS, titre: 'Deux métaux, deux droites',
    ...presenter({ contexte: 'On trace l’énergie cinétique maximale E_c,max des électrons éjectés en fonction de la fréquence ν de la lumière, pour deux métaux : A (travail d’extraction W = 2,0 eV) et B (W = 4,3 eV).' }),
    q: 'Comment sont les deux droites ?', options: [
      V('parallèles, celle de A démarrant à plus basse fréquence', 'E_c,max = h ν − W : la pente vaut h pour tous les métaux (droites parallèles). La droite quitte l’axe quand h ν = W, donc pour une fréquence plus petite avec A (W plus petit).'),
      F('parallèles, celle de B quittant l’axe des fréquences la première', 'Le seuil ν₀ = W divisé par h est plus petit quand W est plus petit : c’est la droite de A qui commence en premier.'),
      F('de pentes différentes : la pente dépend du travail d’extraction', 'La pente est la constante de Planck h, la même pour tous les métaux ; W décale seulement la droite.'),
      F('confondues : la droite ne dépend pas du métal', 'W intervient dans E_c,max = h ν − W : la droite est décalée vers les grandes fréquences quand W augmente.'),
    ] },
  { id: 'phe-ana-cellule', domaine: DOM_PHOTONS, titre: 'Une cellule photoélectrique éclairée moitié moins',
    ...presenter({ contexte: 'Une cellule photoélectrique est éclairée par une lumière de fréquence supérieure à la fréquence seuil de sa photocathode ; un courant circule dans le circuit. On diminue de moitié le nombre de photons envoyés par seconde, sans changer la fréquence.' }),
    q: 'Que devient le courant ?', options: [
      V('il est divisé par deux : deux fois moins d’électrons par seconde', 'Chaque photon absorbé éjecte au plus un électron : deux fois moins de photons éjectent deux fois moins d’électrons par seconde, donc le courant est divisé par deux (si tous les électrons sont collectés).'),
      F('il ne change pas : il ne dépend que de la fréquence', 'La fréquence détermine l’énergie des électrons, pas leur nombre : le nombre d’électrons par seconde est proportionnel au nombre de photons.'),
      F('il s’annule, car il n’y a plus assez de photons pour dépasser le seuil', 'Le seuil porte sur l’énergie de chaque photon (fréquence), pas sur leur nombre : un seul photon suffit à éjecter un électron.'),
      F('il est divisé par quatre, car l’énergie reçue est divisée par deux', 'Le courant est proportionnel au nombre d’électrons éjectés, donc au nombre de photons : il est divisé par deux, pas par quatre.'),
    ] },
];

// ───────────── RELATIONS : choisir la bonne relation ─────────────
export const TGPB_REL = [
  { id: 'rc-rel-intensite', domaine: DOM_RC, titre: 'Intensité du courant et charge',
    ...presenter({ schema: { type: 'rcSerie', generateur: true, uC: false, i: true, armature: 'A' },
      contexte: 'Un condensateur se charge : la charge q de son armature A augmente au cours du temps. L’intensité i du courant est fléchée vers cette armature.', question: 'On cherche le lien entre i et q.' }),
    q: 'Quelle relation permet de répondre ?', options: [
      V('i = dq / dt', 'L’intensité est le débit de charges : la dérivée de q par rapport au temps. À intensité constante, q = i × Δt.'),
      F('i = frac(q × t|C)', 'Cette expression n’a pas la dimension d’une intensité : i est une charge par unité de temps, soit dq divisé par dt.'),
      F('i = frac(q|C)', 'frac(q|C) est une tension (u_C = frac(q|C)), pas une intensité.'),
      F('i = dt / dq', 'Le rapport est inversé : l’intensité est la variation de charge par unité de temps (dq / dt).'),
    ] },
  { id: 'rc-rel-equation', domaine: DOM_RC, titre: 'Équation différentielle de la charge',
    ...presenter({ schema: { type: 'rcSerie', generateur: true, uC: true, i: true },
      contexte: 'À t = 0, on ferme l’interrupteur : le condensateur de capacité C, initialement déchargé, est relié à une source idéale de tension E par un résistor de résistance R.', question: 'On cherche l’équation vérifiée par u_C(t).' }),
    q: 'Quelle équation différentielle convient ?', options: [
      V('R·C · du_C/dt + u_C = E', 'Loi des mailles : E = u_R + u_C, avec u_R = R × i et i = C × du_C/dt. On obtient E = R·C · du_C/dt + u_C.'),
      F('R·C · du_C/dt + u_C = −E', 'Le signe du second membre est faux : la loi des mailles s’écrit E = u_R + u_C avec E positive. Avec −E, la tension u_C deviendrait négative.'),
      F('R·C · du_C/dt + u_C = 0', 'C’est l’équation de la décharge (sans source). En charge, la source impose le second membre E.'),
      F('du_C/dt + RC·u_C = E', 'Les facteurs sont mal placés : le produit R·C multiplie la dérivée, et non u_C (sinon l’équation n’est pas homogène).'),
    ] },
  { id: 'thm-rel-equation', domaine: DOM_THM, titre: 'Équation différentielle du refroidissement',
    ...presenter({ schema: { type: 'thermoTG', cas: 'tasse' },
      contexte: 'Un café de capacité thermique C est à la température T(t) dans une pièce de température constante T_ext. Le flux thermique reçu par le café suit la loi de Newton : φ = h × S × (T_ext − T). Il n’y a aucun autre échange d’énergie.', question: 'On écrit le bilan d’énergie pour trouver l’équation vérifiée par T(t).' }),
    q: 'Quelle équation différentielle convient ?', options: [
      V('C · dT/dt = h × S × (T_ext − T)', 'Pendant une durée dt, la variation d’énergie interne (C × dT) est égale à l’énergie reçue (φ × dt). En divisant par dt, on obtient l’équation proposée, avec φ = h × S × (T_ext − T).'),
      F('C · dT/dt = −h × S × (T_ext − T)', 'Le signe est inversé : le café plus chaud que la pièce doit se refroidir (T diminue au cours du temps), et cette équation le ferait se réchauffer.'),
      F('dT/dt = h × S × (T_ext − T)', 'La capacité thermique C est oubliée : un système de grande capacité thermique varie plus lentement.'),
      F('C · dT/dt = h × S × T_ext', 'Le flux dépend de l’écart (T_ext − T) et non de T_ext seule : sinon il resterait non nul à l’équilibre.'),
    ] },
  { id: 'thm-rel-solution', domaine: DOM_THM, titre: 'Solution du refroidissement',
    ...presenter({ contexte: 'La température d’un café vérifie τ · dT/dt + T = T_ext, avec τ = frac(C|h × S), la température T_ext de la pièce étant constante. Le café est à T₀ à l’instant initial.', question: 'On cherche l’expression de T(t).' }),
    q: 'Quelle expression est la solution ?', options: [
      V('T(t) = T_ext + (T₀ − T_ext) · exp(−t/τ)', 'La solution générale de l’équation différentielle du refroidissement s’écrit T = T_ext + A · exp(−t sur τ). La condition T(0) = T₀ donne A = T₀ − T_ext, et T tend vers T_ext.'),
      F('T(t) = T₀ · exp(−t/τ)', 'Cette fonction tend vers 0, et non vers T_ext : elle ne vérifie pas l’équation (le second membre T_ext est oublié).'),
      F('T(t) = T_ext + (T₀ − T_ext) · (1 − exp(−t/τ))', 'À t = 0 on aurait T = T_ext et non T₀ : cette forme ne respecte pas la condition initiale.'),
      F('T(t) = T_ext − (T₀ − T_ext) · exp(−t/τ)', 'À t = 0 on trouverait 2·T_ext − T₀ au lieu de T₀ : le signe devant l’exponentielle est faux.'),
    ] },
];

// ───────────── HYPOTHÈSES d'un modèle ─────────────
export const TGPB_HYP = [
  { id: 'rc-hyp-modele', domaine: DOM_RC, titre: 'Charge d’un condensateur : hypothèses du modèle RC',
    ...presenter({ schema: { type: 'rcSerie', generateur: true, uC: true, i: true },
      contexte: 'On modélise la charge d’un condensateur par un circuit RC série : u_C(t) = E × (1 − exp(−t/τ)), avec τ = R × C.' }), options: [
      V('La source délivre une tension constante E (source idéale)', 'La loi des mailles E = u_R + u_C avec E constante conduit à une solution exponentielle.'),
      V('Le condensateur est idéal : sa capacité C est constante et il ne fuit pas', 'La relation q = C × u_C est supposée valable à tout instant, sans courant de fuite.'),
      V('Le condensateur est déchargé à l’instant initial : u_C(0) = 0', 'C’est la condition initiale qui donne la forme E × (1 − exp(−t/τ)).'),
      V('La résistance des fils et de l’interrupteur est négligeable devant R', 'Sinon la résistance totale du circuit ne serait pas R.'),
      F('L’intensité du courant est constante pendant la charge', 'i = frac(E − u_C|R) diminue au cours de la charge et tend vers 0.'),
      F('Des charges traversent l’isolant du condensateur', 'Les charges s’accumulent sur les armatures sans traverser l’isolant : c’est le principe du condensateur.'),
    ] },
  { id: 'gpf-hyp-modele', domaine: DOM_GPF, titre: 'Le modèle du gaz parfait : hypothèses',
    ...presenter({ contexte: 'On applique l’équation d’état P × V = n × R × T à un gaz.' }), options: [
      V('Les molécules sont assimilées à des points : volume propre négligeable', 'C’est ce qui permet de décrire tout le volume V comme disponible pour le mouvement des molécules.'),
      V('Les interactions entre molécules, en dehors des chocs, sont négligeables', 'Sinon la pression dépendrait aussi des forces d’attraction ou de répulsion entre molécules.'),
      V('Le mouvement des molécules est désordonné, sans direction privilégiée', 'La pression est alors la même sur toutes les parois : c’est l’agitation thermique.'),
      F('Les molécules restent immobiles dans le récipient, sans agitation', 'Le gaz est en agitation permanente : ce sont les chocs des molécules en mouvement sur les parois qui créent la pression.'),
      F('Le gaz est proche de son point de liquéfaction, à forte pression', 'Au contraire : près de la liquéfaction, les interactions entre molécules ne sont plus négligeables et le modèle échoue.'),
      F('La pression est indépendante de la température du gaz, à n et V fixés', 'L’équation d’état montre que P est proportionnelle à T à n et V fixés.'),
    ] },
  { id: 'thm-hyp-newton', domaine: DOM_THM, titre: 'Refroidissement de Newton : hypothèses',
    ...presenter({ schema: { type: 'thermoTG', cas: 'tasse' },
      contexte: 'On modélise le refroidissement d’un café par la loi de Newton : T(t) = T_ext + (T₀ − T_ext) × exp(−t/τ).' }), options: [
      V('La température du café est la même en tout point à chaque instant', 'On attribue une seule température T(t) au café : on néglige les écarts entre le centre et les bords.'),
      V('La température T_ext de la pièce est constante (thermostat)', 'C’est ce qui donne un second membre constant à l’équation différentielle.'),
      V('Le produit h × S est constant pendant le refroidissement', 'La loi de Newton φ = h × S × (T_ext − T) n’est utilisée qu’avec h × S constant.'),
      V('Le seul échange d’énergie est le transfert thermique avec la pièce (évaporation négligée)', 'Un autre échange (par exemple l’évaporation) modifierait le bilan d’énergie.'),
      F('Le flux thermique reste constant pendant le refroidissement', 'φ = h × S × (T_ext − T) diminue en valeur absolue quand T se rapproche de T_ext.'),
      F('La capacité thermique du café augmente quand il refroidit', 'C est supposée constante : c’est ce qui donne un τ constant.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const TGPB_VAL = [
  P({ id: 'pho-val-energie-photon', domaine: DOM_PHOTONS, niveau: 2, titre: 'Énergie d’un photon vert, calculée par un élève', plausible: false,
    ...presenter({ contexte: 'Un élève calcule l’énergie d’un photon de lumière verte, de longueur d’onde λ = 530 nm :', suite: '« E = frac(h·c|λ) = frac(6,63×10⁻³⁴ × 3,00×10⁸|530) = 3,8×10⁻²⁸ J ».' }),
    reperes: [['Énergie d’un photon visible', 'de l’ordre de 2 à 3 eV, soit environ 3×10⁻¹⁹ à 5×10⁻¹⁹ J'], ['Constantes', 'h = 6,63×10⁻³⁴ J·s ; c = 3,00×10⁸ m·s⁻¹'], ['Unité', 'λ doit être exprimée en mètres : 1 nm = 10⁻⁹ m']],
    ver: 'La longueur d’onde n’a pas été convertie en mètres : avec λ = 530×10⁻⁹ m, E = frac(1,989×10⁻²⁵|530×10⁻⁹) = 3,75×10⁻¹⁹ J, soit environ 2,3 eV. Une énergie de 10⁻²⁸ J serait 10⁹ fois trop faible pour un photon visible.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('λ a été utilisée en nm au lieu de m', 'Avec λ en mètres (530×10⁻⁹ m), E ≈ 3,75×10⁻¹⁹ J ≈ 2,3 eV : c’est un facteur 10⁹ d’écart.'),
      F('il fallait multiplier h·c par λ au lieu de diviser', 'On trouverait environ 10⁻³¹ J : encore plus absurde. E = frac(h·c|λ) est la bonne relation.'),
      F('la valeur de la constante de Planck est fausse', 'h = 6,63×10⁻³⁴ J·s est correcte : l’erreur de 10⁹ vient de l’unité de λ.'),
    ] }),
  P({ id: 'pho-val-ec-ok', domaine: DOM_PHOTONS, niveau: 1, titre: 'Électrons éjectés d’une plaque de sodium', plausible: true,
    ...presenter({ contexte: 'Une plaque de sodium (travail d’extraction W = 2,3 eV) est éclairée par une lumière de longueur d’onde 400 nm. Un élève annonce : « l’énergie cinétique maximale des électrons éjectés est E_c,max = 0,8 eV ».' }),
    reperes: [['Énergie d’un photon', 'E (en eV) ≈ 1 240 / λ (en nm)'], ['Bilan d’énergie', 'E_c,max = hν − W'], ['Condition', 'des électrons sont éjectés si hν > W']],
    ver: 'Le photon a une énergie hν ≈ 1 240 / 400 = 3,1 eV, supérieure à W = 2,3 eV : des électrons sont éjectés, avec E_c,max = 3,1 − 2,3 = 0,8 eV. L’annonce est cohérente.',
    q2: 'Que penser de cette annonce ?',
    options: [
      V('cohérente : hν ≈ 3,1 eV et 3,1 − 2,3 = 0,8 eV', 'Le photon cède son énergie à un électron, dont une partie (W) sert à l’extraire : il reste 0,8 eV sous forme d’énergie cinétique.'),
      F('incohérente : E_c,max devrait valoir l’énergie du photon, 3,1 eV', 'Une partie de l’énergie du photon sert à arracher l’électron du métal (travail d’extraction) : E_c,max = hν − W.'),
      F('incohérente : la lumière visible ne peut pas éjecter d’électrons', 'Cela dépend du métal : pour le sodium, W = 2,3 eV est inférieur à l’énergie des photons à 400 nm.'),
    ] }),
  P({ id: 'pho-val-rendement', domaine: DOM_PHOTONS, niveau: 2, titre: 'Rendement d’un panneau photovoltaïque', plausible: false,
    ...presenter({ contexte: 'Un panneau photovoltaïque reçoit une puissance lumineuse de 1 700 W et fournit une puissance électrique de 304 W. Un élève calcule :', suite: '« η = 1 700 / 304 = 5,6, soit un rendement de 560 % ».' }),
    reperes: [['Rendement', 'η = puissance utile / puissance reçue'], ['Un convertisseur réel', 'η est toujours inférieur à 1 (100 %)'], ['Panneaux du commerce', 'η de l’ordre de 15 à 22 %']],
    ver: 'Un rendement ne peut pas dépasser 100 % : l’élève a inversé le rapport. η = frac(304|1) 700 = 0,18, soit 18 %, valeur courante pour un panneau.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a divisé la puissance reçue par la puissance utile', 'η = frac(P_utile|P_reçue) = frac(304|1) 700 ≈ 18 %.'),
      F('il aurait dû convertir les watts en kilowatts', 'Les deux puissances sont en watts : l’unité se simplifie dans le rapport.'),
      F('rien : certains panneaux ont un rendement supérieur à 100 %', 'Aucun convertisseur ne fournit plus d’énergie qu’il n’en reçoit : le rendement reste inférieur à 100 %.'),
    ] }),
  P({ id: 'pho-val-rendement-ok', domaine: DOM_PHOTONS, niveau: 1, titre: 'Une cellule photovoltaïque de 1 m²', plausible: true,
    ...presenter({ contexte: 'Une cellule photovoltaïque de 1,0 m² est éclairée par un rayonnement de puissance surfacique 1 000 W·m⁻². Elle fournit 180 W. Un élève annonce : « η = 18 % ».' }),
    reperes: [['Puissance reçue', 'P_reçue = éclairement × surface'], ['Panneaux du commerce', 'η de l’ordre de 15 à 22 %'], ['Pertes', 'réflexion, photons d’énergie trop faible ou trop forte (chaleur)']],
    ver: 'P_reçue = 1 000 × 1,0 = 1 000 W et η = frac(180|1) 000 = 0,18 : 18 %, dans l’intervalle des panneaux du commerce.',
    q2: 'Que penser de cette annonce ?',
    options: [
      V('cohérente : frac(180|1) 000 = 18 %, valeur courante', 'Le calcul est correct et l’ordre de grandeur est celui des panneaux du commerce.'),
      F('incohérente : le rendement devrait être de 100 %, toute la lumière absorbée étant convertie', 'Une partie de la lumière est réfléchie, et une partie de l’énergie des photons est perdue en chaleur : η reste très inférieur à 100 %.'),
      F('incohérente : il fallait diviser 1 000 par 180', 'Le rendement est le rapport de la puissance utile à la puissance reçue (frac(180|1) 000), pas l’inverse.'),
    ] }),
  P({ id: 'rc-val-debit-charges', domaine: DOM_RC, niveau: 2, titre: 'Charge accumulée par un courant constant', plausible: false,
    ...presenter({ contexte: 'Un courant constant d’intensité 0,50 mA charge un condensateur pendant 4,0 s. Un élève calcule la charge accumulée :', suite: '« q = i × Δt = 0,50 × 4,0 = 2,0 C ».' }),
    reperes: [['Intensité et charge', 'à intensité constante, q = i × Δt (en C, avec i en A et Δt en s)'], ['Condensateur de TP', 'charge de l’ordre du µC au mC'], ['Préfixe', '1 mA = 10⁻³ A']],
    ver: 'L’intensité n’a pas été convertie en ampères : q = 0,50×10⁻³ × 4,0 = 2,0×10⁻³ C = 2,0 mC. Une charge de 2,0 C serait un million de fois plus grande qu’un condensateur de TP n’en stocke.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a gardé i en mA au lieu de la convertir en A', 'Avec i = 0,50×10⁻³ A, q = 2,0×10⁻³ C, soit 2,0 mC.'),
      F('il fallait diviser i par Δt', 'La relation q = i × Δt est correcte : une intensité est une charge par seconde.'),
      F('rien : 2,0 C est une charge usuelle pour un condensateur de TP', 'Les condensateurs de TP stockent de l’ordre du µC au mC ; 2,0 C est environ 1 000 fois trop.'),
    ] }),
  P({ id: 'rc-val-decharge', domaine: DOM_RC, niveau: 2, titre: 'Tension lue à t = τ en décharge', plausible: false,
    ...presenter({ contexte: 'Un condensateur de capacité 100 µF, chargé sous 6,0 V, se décharge dans un résistor de 10 kΩ (τ = 1,0 s). Un élève lit sur la courbe : « à t = 1,0 s, u_C = 3,8 V ».' }),
    reperes: [['Décharge', 'u_C = E × exp(−t/τ)'], ['À t = τ', 'il reste 37 % de E en décharge ; 63 % de E est atteint en charge'], ['Calcul', '0,37 × 6,0 V ≈ 2,2 V']],
    ver: 'En décharge, à t = τ, u_C = 6,0 × e⁻¹ ≈ 2,2 V. La valeur 3,8 V correspond à 63 % de E : c’est la lecture d’une courbe de charge, pas de décharge.',
    q2: 'Que penser de cette lecture ?',
    options: [
      V('incohérente : en décharge il reste 37 % de E, soit 2,2 V', 'Le 63 % est celui de la charge ; en décharge, la tension a diminué de 63 % et vaut encore 37 % de E.'),
      F('cohérente : à t = τ, u_C vaut bien 63 % de E, comme en charge', 'Les 63 % décrivent la charge, où u_C croît. En décharge, u_C décroît : il reste 37 % de E.'),
      F('incohérente : u_C devrait être nulle à t = τ', 'u_C tend vers 0 sans l’atteindre en un temps fini : à t = τ, il reste 37 % de E.'),
    ] }),
  P({ id: 'gpf-val-limites-co2', domaine: DOM_GPF, niveau: 3, titre: 'Dioxyde de carbone comprimé à 100 bar', plausible: false,
    ...presenter({ contexte: 'Une bouteille de 1,0 L contient du dioxyde de carbone (M = 44 g·mol⁻¹) à 20 °C sous 100 bar. Un élève applique l’équation d’état du gaz parfait :', suite: '« n = frac(P·V|R·T) = frac(1,0×10⁷ × 1,0×10⁻³|8,314 × 293) = 4,1 mol, donc une masse de 180 g de gaz ».' }),
    reperes: [['À 20 °C', 'le dioxyde de carbone se liquéfie à partir de 57 bar environ'], ['Dioxyde de carbone liquide', 'masse volumique de l’ordre de 0,8 g·mL⁻¹']],
    ver: 'Le calcul est juste dans le modèle, mais le modèle ne s’applique pas : à 100 bar et 20 °C, le dioxyde de carbone est liquide (environ 0,8 kg dans 1 L), pas un gaz parfait. La valeur de 180 g est donc fausse d’un facteur environ 5.',
    q2: 'Que penser de ce résultat ?',
    options: [
      V('peu fiable : le CO₂ est liquéfié à cette pression, le modèle ne s’applique plus', 'Les interactions entre molécules et leur volume propre ne sont plus négligeables : l’équation du gaz parfait sous-estime fortement la quantité de matière.'),
      F('fiable : le calcul est juste, les unités sont cohérentes (SI) et le modèle est classique', 'Le calcul numérique est juste, mais ce n’est pas le problème : le modèle utilisé n’est plus valable à 100 bar pour le dioxyde de carbone à 20 °C.'),
      F('faux : la pression n’a pas été convertie en pascals', 'La pression a bien été convertie (100 bar = 1,0×10⁷ Pa) : l’erreur est dans le choix du modèle.'),
    ] }),
  P({ id: 'pp1-val-fusion', domaine: DOM_PP1, niveau: 2, titre: 'Eau liquide et glace à 0 °C', plausible: false,
    ...presenter({ contexte: 'Un élève affirme : « 1,0 kg d’eau liquide à 0 °C et 1,0 kg de glace à 0 °C ont la même énergie interne, car la température est la même ».' }),
    reperes: [['Énergie interne', 'énergie cinétique microscopique + énergie potentielle d’interaction'], ['Fusion de la glace', 'environ 334 kJ pour 1,0 kg, à température constante'], ['Température', 'liée à l’agitation, pas aux interactions']],
    ver: 'Fondre 1,0 kg de glace à 0 °C demande environ 334 kJ sans changer la température : l’eau liquide à 0 °C a une énergie interne plus grande que la glace, par son énergie potentielle d’interaction.',
    q2: 'Que penser de cette affirmation ?',
    options: [
      V('fausse : à même T, l’eau liquide a plus d’énergie interne que la glace', 'U ne dépend pas que de T : la fusion apporte de l’énergie potentielle d’interaction, environ 334 kJ par kilogramme.'),
      F('vraie : l’énergie interne ne dépend que de la température', 'L’énergie interne a deux contributions microscopiques ; la température ne rend compte que de l’agitation.'),
      F('fausse : la glace a plus d’énergie interne car elle est plus ordonnée à 0 °C', 'Une glace plus ordonnée n’a pas plus d’énergie interne : c’est l’eau liquide, dont les interactions ont été modifiées par la fusion, qui possède le plus d’énergie interne.'),
    ] }),
  P({ id: 'tht-val-flux', domaine: DOM_TRANSFERTS, niveau: 2, titre: 'Flux thermique à travers un mur', plausible: false,
    ...presenter({ contexte: 'Un mur de résistance thermique R_th = 0,050 K·W⁻¹ sépare une pièce à 20 °C de l’extérieur à −5 °C. Un élève calcule le flux thermique :', suite: '« Φ = R_th × ΔT = 0,050 × 25 = 1,3 W ».' }),
    reperes: [['Relation', 'Φ = ΔT / R_th, avec R_th en K·W⁻¹'], ['Sens physique', 'plus R_th est grande, plus la paroi isole : le flux est plus faible'], ['Ordre de grandeur', 'le chauffage d’une pièce : quelques centaines de watts à quelques kW']],
    ver: 'Le flux est inversement proportionnel à la résistance thermique : Φ = ΔT / R_th = frac(25|0,050) = 500 W. Avec la multiplication, un mur plus isolant laisserait passer plus de chaleur, ce qui est absurde.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a multiplié par R_th au lieu de diviser', 'Φ = ΔT / R_th = 500 W : plus R_th est grande, plus le flux est petit.'),
      F('il aurait dû utiliser ΔT = 20 − 5 = 15 K', 'L’écart de températures est bien 20 − (−5) = 25 K : il faut soustraire en tenant compte du signe.'),
      F('il aurait dû convertir ΔT en kelvins par 25 + 273', 'Un écart de température a la même valeur en °C et en K : aucune conversion n’est nécessaire.'),
    ] }),
  P({ id: 'ter-val-temperature', domaine: DOM_TRANSFERTS, niveau: 2, titre: 'Température d’équilibre de la Terre sans atmosphère', plausible: false,
    ...presenter({ contexte: 'Pour une Terre sans atmosphère, la puissance absorbée par mètre carré de surface est frac((1 − A) × S₀|4) ; la puissance émise est σ × T⁴ (loi de Stefan-Boltzmann). Avec A = 0,30, S₀ = 1,36×10³ W·m⁻² et σ = 5,67×10⁻⁸ W·m⁻²·K⁻⁴, un élève écrit :', suite: '« T = racine quatrième de [frac((1 − A) × S₀|4σ)] = 255 °C ».' }),
    reperes: [['Température moyenne observée', 'environ 15 °C (288 K)'], ['Eau liquide', 'à 255 °C elle serait en vapeur (sous 1 bar)'], ['Conversion', 'T (K) = θ (°C) + 273']],
    ver: 'La loi de Stefan-Boltzmann donne T en kelvins : T ≈ 255 K, soit environ −18 °C. L’élève a donné l’unité °C au lieu de K. Ce résultat est inférieur à la température moyenne observée (15 °C) ; l’écart d’environ 33 K s’explique par l’effet de serre.',
    q2: 'Que penser de ce résultat ?',
    options: [
      V('invraisemblable : 255 est en kelvins, soit environ −18 °C', 'La formule donne T en kelvins. 255 K ≈ −18 °C : plus froid que la moyenne observée, à cause de l’absence d’effet de serre dans ce modèle.'),
      F('plausible : la Terre est chaude car elle est proche du Soleil', '255 °C est bien trop chaud : l’eau des océans serait vaporisée. La Terre est à 15 °C en moyenne.'),
      F('invraisemblable : il fallait diviser S₀ par 2 et non par 4', 'Le facteur 4 vient du rapport entre la surface interceptée (π R²) et la surface émettrice (4 π R²) : il est correct.'),
    ] }),
  P({ id: 'ter-val-quart', domaine: DOM_TRANSFERTS, niveau: 2, titre: 'Terre sans atmosphère : 360 K ?', plausible: false,
    ...presenter({ contexte: 'Pour la Terre sans atmosphère (S₀ = 1361 W·m⁻², albédo A = 0,30, σ = 5,67×10⁻⁸ W·m⁻²·K⁻⁴), un élève calcule :', suite: '« P_abs = (1 − A) × S₀ = 953 W·m⁻² ; σ × T⁴ = P_abs donc T = 360 K, soit 87 °C ».' }),
    reperes: [['Température moyenne observée de la Terre', 'environ 15 °C (288 K)'], ['Température d’ébullition de l’eau', '100 °C']],
    ver: 'Il manque la division par 4 : par mètre carré de surface, la puissance absorbée est (1 − A) × S₀ divisé par 4 ≈ 238 W·m⁻², d’où T ≈ 255 K, soit environ −18 °C. Un résultat de 87 °C serait supérieur à la température réelle, alors que ce modèle sans atmosphère donne une valeur plus basse.',
    q2: 'Que penser de ce résultat ?',
    options: [
      V('invraisemblable : le facteur 4 est oublié ; on trouve T ≈ 255 K', 'La Terre intercepte le rayonnement sur un disque (π R²) mais émet par toute sa sphère (4 π R²) : la puissance absorbée par m² est divisée par 4, d’où 255 K.'),
      F('plausible : la Terre est chaude car elle est proche du Soleil', '87 °C dépasse la température observée (15 °C), alors que le calcul sans atmosphère ignore l’effet de serre, qui ne peut que réchauffer : le résultat est trop élevé.'),
      F('invraisemblable : il faut ajouter 273 K au résultat', 'T est déjà en kelvins ; 273 sert seulement à convertir des °C en K.'),
    ] }),
  P({ id: 'ter-val-mars', domaine: DOM_TRANSFERTS, niveau: 2, titre: 'Température d’équilibre de Mars', plausible: true,
    ...presenter({ contexte: 'Pour Mars sans atmosphère (S₀ = 586 W·m⁻², albédo A = 0,25), un élève calcule :', suite: '« P_abs = frac((1 − 0,25) × 586|4) ≈ 110 W·m⁻² ; T = racine quatrième de frac(110|5,67×10⁻⁸) ≈ 210 K ».' }),
    reperes: [['Température moyenne observée sur Mars', 'environ 210 K (−63 °C)'], ['Atmosphère de Mars', 'très ténue : effet de serre faible'], ['Terre sans atmosphère', 'environ 255 K']],
    ver: 'P_abs = frac(0,75 × 586|4) ≈ 110 W·m⁻² ; T⁴ = frac(110|5,67×10⁻⁸) ≈ 1,9×10⁹ K⁴, d’où T ≈ 210 K. Ce résultat est proche de la température observée, ce qui est cohérent : l’atmosphère de Mars est trop ténue pour produire un effet de serre notable.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Cohérent : Mars a peu d’effet de serre, donc T calculée ≈ T observée', 'L’atmosphère de Mars est très ténue : peu d’infrarouge est renvoyé vers le sol, et la température observée (210 K) est proche de celle du calcul.'),
      F('Cohérent : le calcul redonne toujours la température observée, quelle que soit la planète', 'Pour la Terre, le calcul donne 255 K contre 288 K observés, et pour Vénus 227 K contre 737 K : l’effet de serre crée un écart d’autant plus grand que l’atmosphère est épaisse.'),
      F('Pas cohérent : il faut ajouter 33 K, l’écart de la Terre, à toute planète', 'L’écart de 33 K est propre à l’atmosphère terrestre ; il dépend de l’atmosphère de chaque planète et n’a aucune raison d’être le même sur Mars.'),
    ] }),
  P({ id: 'cel-val-longueur', domaine: DOM_PHOTONS, niveau: 2, titre: 'Longueur d’onde maximale du silicium : 1,1 mm ?', plausible: false,
    ...presenter({ contexte: 'Pour le silicium (énergie seuil 1,12 eV), un élève calcule λ_max = frac(h × c|E_seuil) :', suite: '« λ_max = frac(6,63×10⁻³⁴ × 3,00×10⁸|1,12 × 1,60×10⁻¹⁹) = 1,11×10⁻³ m, soit 1,1 mm ».' }),
    reperes: [['Longueurs d’onde du visible', 'de 400 à 800 nm environ'], ['Infrarouge proche', 'de 800 nm à quelques micromètres'], ['1 µm', '1000 nm = 10⁻⁶ m']],
    ver: 'Le calcul donne 1,11×10⁻⁶ m (et non 10⁻³ m) : c’est 1,11 µm, soit 1110 nm, dans l’infrarouge proche, juste après le visible. Un millimètre serait une onde bien plus longue que les micro-ondes, hors de propos pour une cellule.',
    q2: 'Que penser de ce résultat ?',
    options: [
      V('invraisemblable : on attend un micromètre (1110 nm)', 'Les photons absorbés par le silicium sont ceux du visible et de l’infrarouge proche : la limite est vers 1 µm, pas 1 mm.'),
      F('plausible : le silicium absorbe aussi les ondes radio, très longues', 'Les ondes radio ont une énergie bien trop faible : pour 1 mm, l’énergie du photon serait environ mille fois inférieure au seuil.'),
      F('plausible : 1,11×10⁻³ m correspond bien à 1110 nm', '1,11×10⁻³ m vaut 1,11 mm, soit 1 110 000 nm ; 1110 nm correspond à 1,11×10⁻⁶ m.'),
    ] }),
  P({ id: 'cel-val-rendement', domaine: DOM_PHOTONS, niveau: 2, titre: 'Rendement d’une cellule : 18 % ?', plausible: true,
    ...presenter({ contexte: 'Une cellule de surface 0,020 m² reçoit un éclairement de 1000 W·m⁻² et délivre U = 0,54 V avec I = 6,7 A. Un élève calcule :', suite: '« P_reçue = 1000 × 0,020 = 20 W ; P_él = 0,54 × 6,7 ≈ 3,6 W ; η = frac(3,6|20) = 0,18, soit 18 % ».' }),
    reperes: [['Rendement d’un module en silicium du commerce', 'environ 15 à 22 %'], ['Valeur maximale possible d’un rendement', 'inférieure à 100 %'], ['Éclairement du plein Soleil', 'environ 1000 W·m⁻²']],
    ver: 'P_reçue = 20 W, P_él = 0,54 × 6,7 = 3,6 W, η = frac(3,6|20) = 0,18 : le calcul est juste et le rendement est dans l’ordre de grandeur des cellules en silicium.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('plausible : P_él divisée par P_reçue donne 18 %', 'η = frac(P_él|P_reçue) (utile sur reçue) = frac(3,6|20) = 18 % : cohérent avec les rendements des modules en silicium.'),
      F('pas plausible : un rendement aussi bas montre une cellule défectueuse', 'Les modules en silicium convertissent seulement 15 à 22 % de la lumière reçue : 18 % est normal.'),
      F('pas plausible : il fallait diviser la puissance reçue par la puissance électrique', 'Le rendement compare ce qui est utile (électrique) à ce qui est reçu : P_él au numérateur.'),
    ] }),
  P({ id: 'cel-val-puissance', domaine: DOM_PHOTONS, niveau: 2, titre: 'Puissance reçue par une cellule : 40 000 W ?', plausible: false,
    ...presenter({ contexte: 'Une cellule de surface 0,020 m² est éclairée avec 800 W·m⁻². Un élève calcule :', suite: '« P_reçue = frac(E|S) = frac(800|0,020) = 40 000 W ».' }),
    reperes: [['Puissance d’une ampoule de salon', 'environ 10 à 100 W'], ['Éclairement du plein Soleil', 'environ 1000 W·m⁻²'], ['Surface de la cellule', '0,020 m² (200 cm²)']],
    ver: 'L’éclairement est une puissance par mètre carré : on multiplie par la surface. P_reçue = 800 × 0,020 = 16 W, ordre de grandeur d’une petite ampoule. 40 000 W est la puissance d’un grand moteur, impossible pour 200 cm² de lumière.',
    q2: 'Que penser de ce résultat ?',
    options: [
      V('invraisemblable : E × S donne 16 W', 'E est en W par mètre carré : pour une petite surface, la puissance reçue est petite, ici 800 × 0,020 = 16 W.'),
      F('plausible : le Soleil est très puissant', 'La puissance du Soleil est immense, mais une cellule de 200 cm² n’en reçoit qu’une toute petite part : 16 W.'),
      F('invraisemblable : il fallait ajouter E et S', 'Une puissance se calcule avec un produit (éclairement × surface), pas avec une somme.'),
    ] }),
  P({ id: 'phe-val-seuil-unite', domaine: DOM_PHOTONS, niveau: 2, titre: 'Fréquence seuil du potassium, calculée par un élève', plausible: false,
    ...presenter({ contexte: 'Le travail d’extraction du potassium est W = 2,3 eV. Un élève calcule la fréquence seuil avec h = 6,63×10⁻³⁴ J·s :', suite: '« ν₀ = W / h = frac(2,3|6,63×10⁻³⁴) = 3,5×10³³ Hz ».' }),
    reperes: [['Fréquences de la lumière visible', 'environ 4×10¹⁴ à 8×10¹⁴ Hz'], ['Conversion', '1 eV = 1,60×10⁻¹⁹ J'], ['Seuil d’un métal', 'ordre de grandeur de 10¹⁴ à 10¹⁵ Hz']],
    ver: 'Il faut convertir W en joules : W = 2,3 × 1,60×10⁻¹⁹ = 3,68×10⁻¹⁹ J, d’où ν₀ = 3,68×10⁻¹⁹ divisé par 6,63×10⁻³⁴ ≈ 5,5×10¹⁴ Hz. Un seuil de 10³³ Hz serait des milliards de fois au-dessus des fréquences du visible.',
    q2: 'Quelle erreur explique ce résultat ?',
    options: [
      V('W est resté en eV au lieu d’être converti en joules', 'Avec W en joules (3,68×10⁻¹⁹ J), on trouve ν₀ ≈ 5,5×10¹⁴ Hz, au bord du visible : c’est le seuil attendu pour le potassium.'),
      F('il fallait multiplier W par h au lieu de diviser', 'ν₀ = W divisé par h est la bonne relation (h ν₀ = W) ; la multiplication donnerait un résultat minuscule et sans unité de fréquence.'),
      F('la valeur de h est fausse : elle devrait être beaucoup plus petite', 'h = 6,63×10⁻³⁴ J·s est correcte : l’erreur vient de l’unité de W.'),
    ] }),
  P({ id: 'phe-val-ec-negative', domaine: DOM_PHOTONS, niveau: 2, titre: 'Une énergie cinétique négative', plausible: false,
    ...presenter({ contexte: 'Une lumière rouge de longueur d’onde 650 nm, dont les photons ont une énergie h ν ≈ 1,9 eV, éclaire du potassium (W = 2,3 eV). Un élève écrit :', suite: '« E_c,max = h ν − W = 1,9 − 2,3 = −0,4 eV : les électrons sont éjectés avec une énergie cinétique de −0,4 eV ».' }),
    reperes: [['Énergie cinétique', 'toujours positive ou nulle'], ['Condition d’éjection', 'h ν supérieure à W'], ['Photon rouge', 'environ 1,9 eV']],
    ver: 'Une énergie cinétique ne peut pas être négative. Le résultat négatif signifie que h ν est inférieure à W : le photon n’a pas assez d’énergie, aucun électron n’est éjecté (E_c,max n’a pas de sens physique ici).',
    q2: 'Que penser de cette conclusion ?',
    options: [
      V('invraisemblable : h ν est inférieure à W, aucun électron ne sort', 'La formule E_c,max = h ν − W ne s’applique que si h ν dépasse W ; un résultat négatif indique qu’il n’y a pas d’effet photoélectrique.'),
      F('plausible : les électrons sortent mais ils sont freinés par le métal', 'Une énergie cinétique est toujours positive ou nulle ; un électron qui n’a pas reçu W ne sort pas du métal.'),
      F('invraisemblable : il fallait ajouter W et non le retrancher', 'Le bilan est h ν = W + E_c,max : W se retranche. Le résultat négatif montre simplement que le photon est trop peu énergétique.'),
    ] }),
  P({ id: 'phe-val-cuivre-visible', domaine: DOM_PHOTONS, niveau: 1, titre: 'Lumière bleue sur une plaque de cuivre', plausible: false,
    ...presenter({ contexte: 'Un élève affirme : « une lampe à lumière bleue, de longueur d’onde 450 nm, éjecte des électrons d’une plaque de cuivre, dont le travail d’extraction est W = 4,7 eV ».' }),
    reperes: [['Énergie d’un photon', 'E (en eV) ≈ 1 240 divisé par λ (en nm)'], ['Condition d’éjection', 'h ν supérieure à W'], ['Travail d’extraction du cuivre', 'W = 4,7 eV']],
    ver: 'Un photon de 450 nm a une énergie h ν ≈ 1 240 / 450 ≈ 2,8 eV, inférieure à W = 4,7 eV : aucun électron n’est éjecté, même avec une lampe très intense. Il faudrait de l’ultraviolet (λ inférieure à environ 264 nm).',
    q2: 'Que penser de cette affirmation ?',
    options: [
      V('invraisemblable : 2,8 eV est inférieure à 4,7 eV', 'Les photons bleus n’ont pas assez d’énergie : l’intensité ne compense pas.'),
      F('plausible : il suffit que la lampe soit assez intense', 'L’intensité change le nombre de photons, pas leur énergie : sous le seuil, aucun photon ne peut éjecter d’électron.'),
      F('plausible : la lumière visible éjecte des électrons de tous les métaux', 'Le seuil dépend du métal : pour le cuivre (4,7 eV), il faut de l’ultraviolet.'),
    ] }),
  P({ id: 'phe-val-intensite-ok', domaine: DOM_PHOTONS, niveau: 1, titre: 'Du zinc sous ultraviolet, intensité triplée', plausible: true,
    ...presenter({ contexte: 'Du zinc (W = 4,3 eV) est éclairé par une lumière ultraviolette de longueur d’onde 200 nm : l’énergie cinétique maximale des électrons est E_c,max ≈ 1,9 eV. On triple l’intensité lumineuse sans changer la longueur d’onde. Un élève annonce : « le courant triple, et E_c,max reste égale à 1,9 eV ».' }),
    reperes: [['Énergie d’un photon', 'E (en eV) ≈ 1 240 divisé par λ (en nm)'], ['Bilan d’énergie', 'E_c,max = h ν − W'], ['Intensité', 'nombre de photons par seconde']],
    ver: 'Le photon de 200 nm a une énergie ≈ 6,2 eV : E_c,max = 6,2 − 4,3 = 1,9 eV. Tripler l’intensité triple le nombre de photons, donc le nombre d’électrons et le courant ; l’énergie de chaque photon est inchangée, donc E_c,max aussi. L’annonce est cohérente.',
    q2: 'Que penser de cette annonce ?',
    options: [
      V('cohérente : trois fois plus de photons, mais chacun a la même énergie', 'Le nombre d’électrons éjectés par seconde est proportionnel au nombre de photons ; E_c,max = h ν − W ne dépend pas de l’intensité.'),
      F('incohérente : E_c,max devrait aussi tripler', 'E_c,max ne dépend que de la fréquence et du métal : elle ne varie pas avec l’intensité.'),
      F('incohérente : le courant ne devrait pas changer, seule la fréquence compte', 'Le courant est proportionnel au nombre d’électrons éjectés par seconde, donc à l’intensité lumineuse.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tok = (aff, quoi, val, u) => ({ aff: aff.replace(/ /g, ' '), quoi, use: { val, u } });
const T = id => ({ t: id });
export const TGPB_SAPP = [
  {
    id: 'pho-sapp-panneau', domaine: DOM_PHOTONS, titre: 'Un panneau photovoltaïque', noms: ['Puissance lumineuse reçue', 'Rendement du panneau'],
    gen: () => { const [S, E, U, I] = tire([[1.7, 1000, 32, 9.5], [1.6, 1000, 30, 9.0], [1.9, 800, 34, 8.0], [1.7, 800, 32, 7.5]]); return { S, E, U, I, th: tire([25, 35, 45]), prix: tire([189, 239, 289]) }; },
    build: (p, q) => {
      const tokens = {
        S: tok(`${nb(p.S, 1)} m²`, 'Surface du panneau', p.S, 'm²'),
        E: tok(`${p.E} W·m⁻²`, 'Puissance lumineuse reçue par mètre carré (éclairement)', p.E, 'W·m⁻²'),
        U: tok(`${p.U} V`, 'Tension aux bornes du panneau', p.U, 'V'),
        I: tok(`${nb(p.I, 1)} A`, 'Intensité du courant fourni', p.I, 'A'),
        th: tok(`${p.th} °C`, 'Température du panneau', p.th, '°C'),
        prix: tok(`${p.prix} €`, 'Prix du panneau', p.prix, '€'),
      };
      const debut = ['Un panneau photovoltaïque de surface ', T('S'), ' est éclairé avec une puissance de ', T('E'), '. Il fournit à un récepteur une tension ', T('U'), ' et une intensité ', T('I'), '. Sa température est de ', T('th'), ' et il a coûté ', T('prix'), '. '];
      const raisons = { th: 'La température n’intervient pas dans le calcul : le rendement est un rapport de puissances.', prix: 'Le prix n’a aucun lien avec les grandeurs physiques du panneau.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la puissance lumineuse reçue par le panneau ?'], utiles: ['S', 'E'], raisons: { ...raisons, U: 'La tension concerne la puissance électrique fournie, pas la lumière reçue.', I: 'L’intensité concerne la puissance électrique fournie, pas la lumière reçue.' },
        cherche: { bonne: 'La puissance lumineuse reçue par le panneau (en W)', faux: ['La puissance électrique fournie par le panneau (en W)', 'Le rendement du panneau (en %)', 'L’énergie reçue en une heure (en kWh)'] },
        manque: null, solution: { txt: 'P_reçue = éclairement × surface', val: p.E * p.S, u: 'W' } };
      return { tokens, derivees: [{ id: 'Pr', nom: 'Puissance lumineuse reçue', expr: 'P_reçue = éclairement × surface', val: p.E * p.S, u: 'W' }, { id: 'Pe', nom: 'Puissance électrique fournie', expr: 'P_él = U × I', val: p.U * p.I, u: 'W' }],
        texte: [...debut, 'Quel est le rendement du panneau ?'], utiles: ['S', 'E', 'U', 'I'], raisons,
        cherche: { bonne: 'Le rendement η du panneau (en %)', faux: ['La puissance électrique fournie par le panneau (en W)', 'La puissance lumineuse reçue par le panneau (en W)', 'Les pertes sous forme de chaleur (en W)'] },
        manque: null, solution: { txt: 'η = frac(P_él|P_reçue) = frac(U × I|éclairement × surface)', val: 100 * p.U * p.I / (p.E * p.S), u: '%' } };
    },
  },
  {
    id: 'ter-sapp-bilan', domaine: DOM_TRANSFERTS, titre: 'La Terre sans atmosphère', noms: ['Puissance solaire absorbée par mètre carré', 'Température d’équilibre'],
    gen: () => ({ A: tire([0.29, 0.30, 0.31, 0.35]), S0: tire([1361, 1360, 1370]), R: 6371, d: 150 }),
    build: (p, q) => {
      const tokens = {
        S0: tok(`${p.S0} W·m⁻²`, 'Puissance solaire reçue par mètre carré face au Soleil', p.S0, 'W·m⁻²'),
        A: tok(`${nb(p.A, 2)}`, 'Albédo de la Terre (fraction du rayonnement réfléchie)', p.A, ''),
        sig: tok('5,67×10⁻⁸ W·m⁻²·K⁻⁴', 'Constante de Stefan-Boltzmann', 5.67e-8, 'W·m⁻²·K⁻⁴'),
        R: tok(`${p.R} km`, 'Rayon de la Terre', p.R, 'km'),
        d: tok(`${p.d} millions de km`, 'Distance Terre-Soleil', p.d, 'millions de km'),
      };
      const debut = ['On étudie la Terre sans atmosphère, de rayon ', T('R'), ', à ', T('d'), ' du Soleil. Face au Soleil, elle reçoit ', T('S0'), ' ; elle en réfléchit une fraction ', T('A'), ' (albédo). Elle émet un rayonnement de puissance σ·T⁴ par mètre carré de surface, avec σ = ', T('sig'), '. À l’équilibre, la puissance absorbée est égale à la puissance émise. '];
      const rr = 'Le rayon n’intervient pas : il se simplifie entre la surface qui intercepte le rayonnement (π R²) et la surface qui émet (4 π R²).';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle puissance solaire la Terre absorbe-t-elle en moyenne par mètre carré de sa surface ?'], utiles: ['S0', 'A'],
        raisons: { sig: 'La constante de Stefan-Boltzmann sert à calculer la puissance émise, pas celle qui est absorbée.', R: rr, d: 'La distance est déjà prise en compte dans la valeur donnée de la puissance reçue par mètre carré.' },
        cherche: { bonne: 'La puissance solaire absorbée par mètre carré de surface terrestre (en W·m⁻²)', faux: ['La puissance solaire réfléchie par mètre carré (en W·m⁻²)', 'La température d’équilibre de la Terre (en K)', 'La puissance totale absorbée par la Terre (en W)'] },
        manque: null, solution: { txt: 'P_abs = frac((1 − A) × S₀|4) (disque de surface π R² éclairé, sphère de surface 4 π R²)', val: (1 - p.A) * p.S0 / 4, u: 'W·m⁻²' } };
      const T4 = (1 - p.A) * p.S0 / 4 / 5.67e-8;
      return { tokens, derivees: [{ id: 'Pa', nom: 'Puissance absorbée par mètre carré', expr: 'P_abs = frac((1 − A) × S₀|4)', val: (1 - p.A) * p.S0 / 4, u: 'W·m⁻²' }],
        texte: [...debut, 'Quelle est la température d’équilibre de la Terre ?'], utiles: ['S0', 'A', 'sig'], raisons: { R: rr, d: 'La distance est déjà prise en compte dans la valeur donnée de la puissance reçue par mètre carré.' },
        cherche: { bonne: 'La température d’équilibre de la Terre (en K)', faux: ['La puissance solaire absorbée par mètre carré (en W·m⁻²)', 'La puissance solaire réfléchie par mètre carré (en W·m⁻²)', 'La puissance émise par la Terre entière (en W)'] },
        manque: null, solution: { txt: 'σ × T⁴ = frac((1 − A) × S₀|4), donc T = [frac((1 − A) × S₀|4σ)] à la puissance 1/4', val: Math.pow(T4, 0.25), u: 'K' } };
    },
  },
  {
    id: 'cel-sapp-seuil', domaine: DOM_PHOTONS, titre: 'Une cellule éclairée par une lampe', noms: ['Énergie d’un photon de la lampe', 'Longueur d’onde maximale absorbée'],
    gen: () => ({ gap: tire([1.12, 1.12, 1.4, 1.5]), L: tire([450, 520, 600, 650]), P: tire([20, 40, 60]), S: tire([0.010, 0.015, 0.020]) }),
    build: (p, q) => {
      const tokens = {
        gap: tok(`${nb(p.gap, 2)} eV`, 'Énergie seuil du semi-conducteur de la cellule', p.gap, 'eV'),
        L: tok(`${p.L} nm`, 'Longueur d’onde de la lumière de la lampe', p.L, 'nm'),
        h: tok('6,63×10⁻³⁴ J·s', 'Constante de Planck', 6.63e-34, 'J·s'),
        c: tok('3,00×10⁸ m·s⁻¹', 'Célérité de la lumière', 3.00e8, 'm·s⁻¹'),
        ev: tok('1,60×10⁻¹⁹ J', 'Valeur d’un électronvolt en joules', 1.60e-19, 'J'),
        P: tok(`${p.P} W`, 'Puissance électrique consommée par la lampe', p.P, 'W'),
        S: tok(`${nb(p.S, 3)} m²`, 'Surface de la cellule', p.S, 'm²'),
      };
      const debut = ['Une cellule photovoltaïque, de surface ', T('S'), ', a pour énergie seuil ', T('gap'), ' : un photon n’est absorbé que si son énergie est au moins égale à cette valeur. Elle est éclairée par une lampe qui consomme ', T('P'), ' et émet une lumière monochromatique de longueur d’onde ', T('L'), '. Données : h = ', T('h'), ' ; c = ', T('c'), ' ; 1 eV = ', T('ev'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est l’énergie d’un photon de la lumière de la lampe, en joules ?'], utiles: ['L', 'h', 'c'],
        raisons: { gap: 'L’énergie seuil sert à savoir si le photon est absorbé, pas à calculer son énergie.', ev: 'Le facteur de conversion ne servirait que pour exprimer l’énergie en eV ; ici elle est demandée en joules.', P: 'La puissance consommée par la lampe n’intervient pas dans l’énergie d’un seul photon.', S: 'La surface de la cellule n’intervient pas dans l’énergie d’un seul photon.' },
        cherche: { bonne: 'L’énergie d’un photon de la lumière de la lampe (en J)', faux: ['L’énergie seuil de la cellule (en J)', 'La puissance lumineuse reçue par la cellule (en W)', 'Le nombre de photons reçus par seconde'] },
        manque: null, solution: { txt: 'E_ph = frac(h × c|λ) (λ en mètres)', val: 6.63e-34 * 3.00e8 / (p.L * 1e-9), u: 'J' } };
      return { tokens, derivees: [{ id: 'Es', nom: 'Énergie seuil en joules', expr: 'E_seuil = énergie seuil en eV × 1,60×10⁻¹⁹', val: p.gap * 1.60e-19, u: 'J' }],
        texte: [...debut, 'Quelle est la longueur d’onde maximale d’un photon que la cellule peut absorber, en nanomètres ?'], utiles: ['gap', 'ev', 'h', 'c'],
        raisons: { L: 'La longueur d’onde de la lampe ne sert pas à trouver la limite de la cellule.', P: 'La puissance de la lampe n’intervient pas dans la longueur d’onde maximale.', S: 'La surface de la cellule n’intervient pas dans la longueur d’onde maximale.' },
        cherche: { bonne: 'La longueur d’onde maximale absorbée par la cellule (en nm)', faux: ['La longueur d’onde de la lumière de la lampe (en nm)', 'L’énergie d’un photon de la lampe (en eV)', 'La puissance reçue par la cellule (en W)'] },
        manque: null, solution: { txt: 'λ_max = frac(h × c|E_seuil) (en joules)', val: 6.63e-34 * 3.00e8 / (p.gap * 1.60e-19) * 1e9, u: 'nm' } };
    },
  },
  {
    id: 'phe-sapp-photon', domaine: DOM_PHOTONS, titre: 'Une plaque métallique éclairée', noms: ['Énergie d’un photon', 'Énergie cinétique maximale des électrons'],
    gen: () => { const [metal, W, lam] = tire([['calcium', 2.9, 250], ['calcium', 2.9, 300], ['calcium', 2.9, 320], ['zinc', 4.3, 200], ['zinc', 4.3, 220], ['zinc', 4.3, 240]]); return { metal, W, lam, S: tire([4, 6, 10]), P: tire([20, 50, 100]) }; },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de la lumière', p.lam, 'nm'),
        W: tok(`${nb(p.W, 1)} eV`, 'Travail d’extraction du métal', p.W, 'eV'),
        h: tok('6,63×10⁻³⁴ J·s', 'Constante de Planck', 6.63e-34, 'J·s'),
        c: tok('3,00×10⁸ m·s⁻¹', 'Célérité de la lumière dans le vide', 3.00e8, 'm·s⁻¹'),
        e: tok('1,60×10⁻¹⁹ J', 'Valeur d’un électronvolt', 1.60e-19, 'J'),
        S: tok(`${p.S} cm²`, 'Surface éclairée de la plaque', p.S, 'cm²'),
        P: tok(`${p.P} mW`, 'Puissance de la lampe', p.P, 'mW'),
      };
      const E = 6.63e-34 * 3.00e8 / (p.lam * 1e-9) / 1.60e-19;
      const debut = ['Une plaque de ', p.metal, ', de travail d’extraction ', T('W'), ', est éclairée sur une surface de ', T('S'), ' par une lampe de puissance ', T('P'), ' qui émet une lumière de longueur d’onde ', T('lam'), '. On donne la constante de Planck ', T('h'), ', la célérité de la lumière ', T('c'), ' et ', T('e'), ' pour un électronvolt. '];
      const rs = { S: 'La surface éclairée ne change ni l’énergie d’un photon ni celle des électrons éjectés : elle ne sert pas dans ce calcul.', P: 'La puissance de la lampe fixe le nombre de photons par seconde, pas l’énergie de chacun.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est l’énergie d’un photon de cette lumière ?'], utiles: ['lam', 'h', 'c', 'e'], raisons: { ...rs, W: 'Le travail d’extraction sert à calculer l’énergie cinétique des électrons, pas l’énergie du photon.' },
        cherche: { bonne: 'L’énergie d’un photon de cette lumière (en eV)', faux: ['L’énergie cinétique maximale des électrons éjectés (en eV)', 'Le nombre de photons envoyés par seconde', 'La fréquence seuil du métal (en Hz)'] },
        manque: null, solution: { txt: 'E = frac(h × c|λ), puis conversion en eV (division par 1,60×10⁻¹⁹ J)', val: E, u: 'eV' } };
      return { tokens, derivees: [{ id: 'Eph', nom: 'Énergie d’un photon', expr: 'E = frac(h × c|λ)', val: E, u: 'eV' }],
        texte: [...debut, 'Quelle est l’énergie cinétique maximale des électrons éjectés ?'], utiles: ['lam', 'h', 'c', 'e', 'W'], raisons: rs,
        cherche: { bonne: 'L’énergie cinétique maximale des électrons éjectés (en eV)', faux: ['L’énergie d’un photon de cette lumière (en eV)', 'La fréquence seuil du métal (en Hz)', 'Le nombre d’électrons éjectés par seconde'] },
        manque: null, solution: { txt: 'E_c,max = h ν − W, avec h ν = frac(h × c|λ) (en eV)', val: E - p.W, u: 'eV' } };
    },
  },
];
