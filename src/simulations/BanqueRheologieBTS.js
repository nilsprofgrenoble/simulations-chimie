// Banque d'exercices « Rhéologie : épaississants associatifs ASE, HASE, HEUR » (BTS Métiers de la chimie, formulation).
// Format du site (voir AtelierSituationsBanque.js) : un exercice = { id, domaine, niveau, titre, construire }.
// Programme : « Propriétés rhéologiques : comment modifier les propriétés rhéologiques d'un produit ? »,
//   « additifs rhéologiques : épaississants », « identifier à partir de rhéogrammes les comportements rhéologiques ».
//   rheo-famille, rheo-gant-crochet, rheo-thixol, rheo-coapur, rheo-3itt, rheo-ase, rheo-architecture
// Les réponses numériques sont calculées par le modèle à partir des valeurs AFFICHÉES (donnée arrondie avant le calcul).
import {
  etaStatioHASE, etaASE, simuler3ITT, arrondiSig,
  tirerFicheTDS, profilFiche, GAMMAS_MESURES,
} from './epaisseursAssociatifsModele.js';

const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Rhéologie';
const nb = (x, d = 0) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const SANS_UNITE = '(sans unité)';

const aideFamilles = 'ASE = Alkali Swellable Emulsion (pas de modification hydrophobe) ; HASE = Hydrophobically modified ASE ; HEUR = Hydrophobically modified Ethoxylated URethane (polyuréthane).';
const aideGants = 'Relis la légende du TP : le gant attrape une balle (particule) ou un autre gant ; le crochet ne s’accroche qu’à un autre crochet.';

export const EXERCICES = [
  {
    id: 'rheo-famille', domaine: DOM, niveau: 2, titre: 'Reconnaître un épaississant sur sa fiche technique',
    construire: (rng = Math.random) => {
      const fiche = tirerFicheTDS(rng);
      const fam = fiche.famille;
      const prof = profilFiche(fiche);
      const [m1, m2] = fiche.mesures;
      return {
        enonce: `Fiche technique d’un additif rhéologique, « ${fiche.nom} » : « ${fiche.extraits[0]} » « ${fiche.extraits[1]} » Mesures de viscosité en régime permanent (ci-dessous).`,
        tableau: { entetes: ['γ̇ (s⁻¹)', 'η (mPa·s)'], lignes: fiche.mesures.map((m) => [nb(m.gamma), nb(m.eta)]) },
        etapes: [
          { id: 'famille', titre: 'Famille', q: `À quelle famille appartient « ${fiche.nom} » ?`, aide: aideFamilles,
            o: [
              ['Un ASE', fam === 'ase', fam === 'ase'
                ? 'Exact : émulsion acrylique alcali-gonflable, sans modification hydrophobe.'
                : 'Ce polymère porte une modification hydrophobe ou un squelette polyuréthane : ce n’est pas un ASE.'],
              ['Un HASE', fam === 'hase', fam === 'hase'
                ? 'Exact : acrylique associatif, portant des modifications hydrophobes.'
                : 'La description ne correspond pas à un acrylique modifié hydrophobiquement.'],
              ['Un HEUR', fam === 'heur', fam === 'heur'
                ? 'Exact : polyuréthane éthoxylé modifié hydrophobiquement.'
                : 'La description ne correspond pas à un polyuréthane éthoxylé.'],
              F('Un épaississant cellulosique', 'Les cellulosiques (HEC…) ne sont ni alcali-gonflables ni modifiés hydrophobiquement.'),
            ] },
          { id: 'profil', titre: 'Profil rhéologique', q: 'Quel profil de viscosité η(γ̇) attendre en régime permanent ?',
            aide: 'Regarde le tableau : la viscosité change-t-elle quand γ̇ passe de 1 à 100 s⁻¹ ? Newtonien : η constante. Rhéofluidifiant : η diminue quand γ̇ augmente.',
            o: [
              ['Newtonien', prof === 'Newtonien', prof === 'Newtonien'
                ? 'Exact : la viscosité mesurée est la même aux deux gradients.'
                : 'Non : la viscosité varie nettement entre les deux gradients du tableau.'],
              ['Rhéofluidifiant (pseudoplastique)', prof !== 'Newtonien', prof !== 'Newtonien'
                ? (fam === 'ase'
                  ? 'Exact : η diminue quand γ̇ augmente (les chaînes gonflées s’orientent dans l’écoulement).'
                  : 'Exact : η diminue quand γ̇ augmente (le réseau de liaisons se défait).')
                : 'Non : la viscosité ne dépend quasiment pas du gradient.'],
              F('Rhéoépaississant (dilatant)', 'Les valeurs du tableau diminuent : ce n’est pas un produit dilatant.'),
            ] },
          { id: 'rapport', titre: 'Rapport de viscosités', q: 'Calculer le rapport η(1 s⁻¹) / η(100 s⁻¹) à partir du tableau.',
            aide: 'Divise la viscosité à 1 s⁻¹ par celle à 100 s⁻¹. Un rapport voisin de 1 signifie une viscosité qui ne dépend pas du gradient.',
            type: 'saisie',
            champs: [{ id: 'rapport', lib: 'η(1 s⁻¹) / η(100 s⁻¹)', u: SANS_UNITE, vrai: fiche.rapportReponse, tol: 0.05 }],
            expl: `${nb(m1.eta)} / ${nb(m2.eta)} = ${nb(fiche.rapportReponse, 2)}.` },
        ],
        retenir: [
          'ASE : pas de modification hydrophobe. HASE : squelette acrylique + greffons hydrophobes. HEUR : squelette polyuréthane + greffons hydrophobes.',
          'Le profil se lit sur les mesures du produit : un rapport η(1 s⁻¹) / η(100 s⁻¹) voisin de 1 donne un produit newtonien, un rapport grand un produit rhéofluidifiant.',
        ],
      };
    },
  },
  {
    id: 'rheo-gant-crochet', domaine: DOM, niveau: 2, titre: 'Gant ou crochet : les liaisons d’un épaississant associatif',
    construire: () => ({
      enonce: 'Un épaississant associatif est un polymère hydrosoluble portant des modifications hydrophobes. Dans la légende du TP, certaines sont dessinées comme des gants de baseball, d’autres comme des crochets.',
      etapes: [
        { id: 'associative', titre: 'Liaison gant-particule', q: 'Comment nomme-t-on la liaison entre un groupe hydrophobe de type gant et une particule de charge (TiO₂, CaCO₃) ?', aide: aideGants,
          o: [
            F('Une liaison covalente', 'Aucune liaison chimique n’est créée : c’est une interaction physique.'),
            F('Une liaison auto-associante', 'Ce nom désigne l’interaction entre deux modifications hydrophobes.'),
            V('Une liaison associative', 'Exact : comme un gant qui attrape une balle. Elle est forte et difficile à défaire.'),
            F('Une liaison hydrogène', 'Les liaisons hydrogène sont des interactions polaires, différentes des interactions hydrophobes.'),
          ] },
        { id: 'crochet', titre: 'Le crochet', q: 'Un groupe hydrophobe de type crochet peut-il interagir avec une particule de TiO₂ ?', aide: aideGants,
          o: [
            F('Oui, mais seulement à pH 8-9', 'Le pH ne change pas la nature des groupes hydrophobes.'),
            F('Oui : c’est une liaison associative', 'Seuls les gants lient une particule (liaison associative).'),
            V('Non : il ne s’associe qu’avec un autre groupe de même type', 'Exact : dans la convention du TP, les crochets ne s’attrapent qu’entre eux, jamais les particules.'),
            F('Non, il ne peut s’associer avec rien du tout', 'Il peut s’associer avec un autre crochet.'),
          ] },
        { id: 'force', titre: 'Résistance au cisaillement', q: 'Quelle liaison est la plus facile à défaire quand le gradient de vitesse augmente ?',
          aide: 'Relis la légende : liaisons lâches ou liaisons fortes ?',
          o: [
            F('Une liaison associative (gant-particule)', 'Elle est forte et difficile à défaire.'),
            F('Aucune ne cède : les liaisons sont permanentes', 'Toutes ces liaisons sont transitoires : c’est ce qui rend la viscosité réversible.'),
            V('Une liaison auto-associante (deux crochets, ou deux gants)', 'Exact : ces interactions sont lâches, elles cèdent au cisaillement.'),
            F('Les deux cèdent aussi facilement', 'La légende distingue des interactions lâches et des interactions fortes.'),
          ] },
      ],
      retenir: ['Liaison associative = hydrophobe-particule (forte). Liaison auto-associante = hydrophobe-hydrophobe (lâche).', 'Dans la convention du TP, le crochet ne touche jamais une particule.'],
    }),
  },
  {
    id: 'rheo-thixol', domaine: DOM, niveau: 2, titre: 'Thixol 53 L : la viscosité à bas gradient',
    construire: () => {
      const [g1, g2] = GAMMAS_MESURES;
      const e1 = arrondiSig(etaStatioHASE(g1), 3);
      const e2 = arrondiSig(etaStatioHASE(g2), 3);
      const r = e1 / e2;
      return {
        enonce: 'Le Thixol 53 L est un épaississant acrylique associatif (HASE). Sa fiche technique annonce un profil fortement pseudoplastique, qui empêche la sédimentation et l’affaissement sans nuire au nivellement. Viscosités simulées pour une peinture épaissie au Thixol 53 L (ordres de grandeur) :',
        tableau: { entetes: ['γ̇ (s⁻¹)', 'η (mPa·s)'], lignes: [[nb(g1), nb(e1)], [nb(g2), nb(e2)]] },
        etapes: [
          { id: 'zone', titre: 'Zone de gradient', q: 'La sédimentation des charges dans le pot se joue dans quelle bande de gradient de vitesse ?', aide: 'Classe les zones : pot, mur frais, mélange, application.',
            o: [
              F('Entre 0,1 et 3 s⁻¹', 'C’est la zone d’affaissement et de nivellement, après application.'),
              F('Entre 500 et 10 000 s⁻¹', 'C’est la zone d’application (pinceau, rouleau).'),
              V('Entre 0,01 et 0,1 s⁻¹', 'Exact : le pot est quasiment immobile, la charge sédimente si η est trop faible.'),
              F('Entre 10 et 100 s⁻¹', 'C’est la zone de mélange en manufacture.'),
            ] },
          { id: 'rapport', titre: 'Lire le rhéogramme', q: 'Calculer le rapport η(1 s⁻¹) / η(100 s⁻¹) du Thixol 53 L.',
            aide: 'Divise la viscosité à 1 s⁻¹ par celle à 100 s⁻¹ : plus le rapport est grand, plus le produit est rhéofluidifiant.',
            type: 'saisie',
            champs: [{ id: 'rapport', lib: 'η(1 s⁻¹) / η(100 s⁻¹)', u: SANS_UNITE, vrai: r, tol: 0.05 }],
            expl: `${nb(e1)} / ${nb(e2)} = ${nb(r, 1)} : la viscosité est divisée par environ ${nb(r, 0)} quand le gradient est multiplié par 100.` },
          { id: 'consequence', titre: 'Conséquence', q: 'Pourquoi le Thixol 53 L limite-t-il la sédimentation en pot ?', aide: 'Que devient le réseau de liaisons auto-associantes à très bas gradient ?',
            o: [
              F('Il gonfle au contact des charges et forme un gel permanent', 'Le gonflement par neutralisation concerne l’ASE ; notre HASE épaissit surtout par interactions hydrophobes.'),
              V('À bas gradient, le réseau est intact : la viscosité est forte et la charge ne descend pas', 'Exact : les liaisons hydrophobes lâches se reforment au repos et maintiennent une forte viscosité.'),
              F('Ses liaisons covalentes avec les charges bloquent leur descente', 'Aucune liaison covalente : les interactions hydrophobes sont transitoires.'),
              F('Il est plus dense que la peinture et remonte en surface', 'La sédimentation est un problème de viscosité, pas de densité de l’additif.'),
            ] },
        ],
        retenir: ['À bas gradient (en pot), le réseau hydrophobe du Thixol 53 L est reconstitué : η forte, pas de sédimentation ni d’affaissement.'],
      };
    },
  },
  {
    id: 'rheo-coapur', domaine: DOM, niveau: 2, titre: 'Coapur 3025 : l’application au rouleau',
    construire: () => ({
      enonce: 'Le Coapur 3025 est un épaississant polyuréthane (HEUR) non ionique : sa fiche annonce une rhéologie purement newtonienne, un excellent pouvoir garnissant et une excellente résistance aux éclaboussures, avec un nivellement amélioré.',
      etapes: [
        { id: 'profil', titre: 'Profil', q: 'Que devient la viscosité d’un système formulé au Coapur 3025 quand le gradient passe de 1 à 1 000 s⁻¹ ?', aide: 'Relis la première phrase de la fiche.',
          o: [
            F('Elle s’effondre d’un facteur 7', 'C’est le profil du Thixol 53 L, notre HASE, pas celui du Coapur.'),
            V('Elle reste quasiment constante', 'Exact : rhéologie quasi newtonienne, les liaisons gant-particule tiennent bon.'),
            F('Elle double', 'Le produit ne dilate pas au cisaillement.'),
            F('Elle dépend surtout du pH du milieu', 'Le Coapur est non ionique : insensible au pH, contrairement aux ASE.'),
          ] },
        { id: 'role', titre: 'Rôle au rouleau', q: 'Pourquoi associer un HEUR comme le Coapur 3025 dans une peinture appliquée au rouleau ?', aide: 'Au rouleau, on impose γ̇ ≈ 1 000-10 000 s⁻¹.',
          o: [
            F('Il empêche surtout la sédimentation en pot', 'C’est le rôle d’un épaississant actif à bas gradient, comme notre Thixol 53 L (HASE).'),
            F('Il remplace la résine de la peinture', 'Un additif rhéologique ne joue pas le rôle du liant.'),
            V('Il ajuste la viscosité aux hauts gradients : moins d’éclaboussures et un bon film', 'Exact : « spatter resistance » et pouvoir garnissant, selon sa fiche.'),
            F('Il rend la peinture thixotrope à dose normale', 'À dose normale, le Coapur n’apporte pas de thixotropie : sa structure ne dépend pas du gradient.'),
          ] },
        { id: 'combinaison', titre: 'Combinaison', q: 'Un formulateur veut à la fois une tenue en pot ET zéro éclaboussure au rouleau. Que recommandent les fiches ?', aide: 'Bas gradient : quel additif ? Haut gradient : quel autre ?',
          o: [
            F('Utiliser le Coapur 3025 seul, à forte dose', 'Le Coapur seul néglige la viscosité à bas gradient (sédimentation, affaissement).'),
            V('Combiner le Coapur 3025 avec un épaississant actif à bas gradient comme le Thixol 53 L', 'Exact : chaque additif couvre sa zone de gradient.'),
            F('Utiliser le Thixol 53 L seul, à forte dose', 'Le Thixol seul néglige le haut gradient (éclaboussures au rouleau).'),
            F('N’utiliser aucun épaississant', 'Sans épaississant, la peinture sédimente, affaisse et éclabousse.'),
          ] },
      ],
      retenir: ['Coapur 3025 (HEUR) : viscosité aux hauts gradients (application). Thixol 53 L (HASE) : viscosité aux bas gradients (pot, mur frais).', 'Une formulation combine souvent les deux.'],
    }),
  },
  {
    id: 'rheo-3itt', domaine: DOM, niveau: 2, titre: 'Thixotropie : le test en trois intervalles',
    construire: () => {
      const itt = simuler3ITT({ famille: 'hase' });
      const etaRef = Math.round(itt.etaRef);
      const etaFin = Math.round(itt.etaFinal);
      const reg = (etaFin / etaRef) * 100;
      return {
        enonce: `Test en trois intervalles sur une peinture épaissie au Thixol 53 L (HASE) : 20 s à γ̇ = 1 s⁻¹, puis 20 s à γ̇ = 256 s⁻¹, puis 80 s à nouveau à γ̇ = 1 s⁻¹. Mesures simulées : η juste avant le cisaillement = ${nb(etaRef)} mPa·s ; η à la fin du 3e intervalle (t = 120 s) = ${nb(etaFin)} mPa·s.`,
        etapes: [
          { id: 'regen', titre: 'Régénération', q: 'Calculer le pourcentage de régénération de la viscosité à la fin du test (η finale / η initiale × 100).', aide: 'Applique la définition avec les deux valeurs mesurées.',
            type: 'saisie', champs: [{ id: 'reg', lib: 'Régénération', u: '%', vrai: reg, tol: 0.05 }],
            expl: `(${nb(etaFin)} / ${nb(etaRef)}) × 100 = ${nb(reg, 1)} %.` },
          { id: 'pourquoi', titre: 'Interprétation', q: 'Pourquoi la viscosité ne retrouve-t-elle pas 100 % à la fin du test ?', aide: 'Que font les liaisons auto-associantes juste après le cisaillement ?',
            o: [
              F('L’eau s’est évaporée pendant le test', 'Le test dure 2 minutes : pas d’évaporation notable.'),
              F('Le polymère s’est dégradé chimiquement', 'Aucune réaction chimique : les liaisons sont physiques et réversibles.'),
              V('Les liaisons auto-associantes se reforment lentement : le réseau n’est pas encore reconstruit', 'Exact : cassées au cisaillement, elles mettent du temps (de l’ordre de la minute) à se réassocier.'),
              F('Le rhéomètre s’est décalé de zéro', 'Le test impose γ̇ et mesure η : c’est le comportement de la peinture, pas un artefact.'),
            ] },
          { id: 'heur', titre: 'Et le Coapur ?', q: 'Ce même test sur une peinture épaissie au Coapur 3025 (HEUR, dose normale) donnerait :', aide: 'La structure du Coapur à dose normale dépend-elle du gradient ?',
            o: [
              F('Une régénération de l’ordre de 80 %', 'Ce serait le comportement d’un réseau auto-associé lent, comme le Thixol.'),
              V('Une régénération quasi immédiate : la structure ne dépend pas du gradient', 'Exact : liaisons gant-particule tenues, η constante, pas de thixotropie.'),
              F('Une viscosité finale plus grande que l’initiale', 'Le Coapur n’est pas antithixotrope.'),
              F('Aucune mesure exploitable', 'Le test fonctionne sur tout fluide.'),
            ] },
        ],
        retenir: ['Thixotropie = viscosité qui met du temps à revenir après un cisaillement.', 'Thixol 53 L (HASE) : régénération partielle après 80 s. Coapur 3025 (HEUR, dose normale) : pas thixotrope. Le comportement suit les liaisons réelles, lâches et lentes ou tenues, pas le sigle.'],
      };
    },
  },
  {
    id: 'rheo-ase', domaine: DOM, niveau: 2, titre: 'L’ASE et le pH : gonfler pour épaissir',
    construire: (rng = Math.random) => {
      const pH = Math.round((8 + rng()) * 10) / 10;
      const eA = arrondiSig(etaASE(0.1, 3), 3);
      const eB = arrondiSig(etaASE(0.1, pH), 3);
      const r = eB / eA;
      return {
        enonce: 'Un ASE est un copolymère acrylique (acide méthacrylique + acrylate d’éthyle) sans modification hydrophobe. Il est livré à pH 3 : la chaîne est protonée, repliée sur elle-même, peu visqueuse. Après neutralisation vers pH 8-9, les groupes acides deviennent carboxylates : la chaîne se déploie et le polymère gonfle. Viscosités simulées à γ̇ = 0,1 s⁻¹ :',
        tableau: { entetes: ['pH', 'η (mPa·s)'], lignes: [[nb(3, 1), nb(eA)], [nb(pH, 1), nb(eB)]] },
        etapes: [
          { id: 'ph', titre: 'pH d’emploi', q: 'Dans quelle bande de pH un ASE développe-t-il son pouvoir épaississant ?', aide: 'Pense à la neutralisation des acides méthacryliques.',
            o: [
              F('À pH 3, sa forme de livraison', 'À pH 3, la chaîne est protonée et repliée.'),
              V('Entre 8 et 9 : la chaîne est neutralisée et gonflée', 'Exact : livré à pH 3, l’ASE épaissit une fois neutralisé.'),
              F('À n’importe quel pH : il est insensible au pH', 'C’est le HEUR non ionique qui est insensible au pH.'),
              F('Uniquement à pH supérieur à 11', 'Inutile et néfaste pour une peinture : la neutralisation est complète bien avant.'),
            ] },
          { id: 'rapport', titre: 'Effet de la neutralisation', q: `De quel facteur la viscosité est-elle multipliée en passant de pH 3,0 à pH ${nb(pH, 1)} ? Calculer η(pH ${nb(pH, 1)}) / η(pH 3,0).`,
            aide: 'Divise la viscosité à pH neutralisé par la viscosité à pH 3.',
            type: 'saisie', champs: [{ id: 'rapport', lib: `η(pH ${nb(pH, 1)}) / η(pH 3,0)`, u: SANS_UNITE, vrai: r, tol: 0.05 }],
            expl: `${nb(eB)} / ${nb(eA)} = ${nb(r, 1)} : le gonflement de la chaîne multiplie la viscosité par environ ${nb(r, 0)}.` },
          { id: 'liaisons', titre: 'Liaisons', q: 'Quelles liaisons cet ASE peut-il former dans une peinture chargée en TiO₂ ?', aide: 'Cherche la modification hydrophobe sur sa chaîne.',
            o: [
              F('Des liaisons associatives avec les particules', 'Il faudrait des greffons hydrophobes : ce serait un HASE.'),
              V('Aucune : pas de modification hydrophobe', 'Exact : l’ASE épaissit par gonflement de chaîne, pas par associations hydrophobes.'),
              F('Des liaisons auto-associantes entre chaînes', 'Sans greffons hydrophobes, pas d’auto-association.'),
              F('Des liaisons covalentes avec le TiO₂', 'Aucune réaction de greffage en pot de peinture.'),
            ] },
        ],
        retenir: ['ASE : épaississant acrylique alcali-gonflable, actif une fois neutralisé (pH 8-9), sans modification hydrophobe donc sans liaisons associatives.'],
      };
    },
  },
  {
    id: 'rheo-architecture', domaine: DOM, niveau: 2, titre: 'Architecture ou comportement ?',
    construire: () => ({
      enonce: 'Sur un forum de formulation, un stagiaire écrit : « Prends un HEUR, il sera forcément newtonien ; prends un HASE, il sera forcément thixotrope. » Son tuteur répond : « Pas si vite… »',
      etapes: [
        { id: 'sigle', titre: 'Le sigle', q: 'Que désigne réellement le sigle « HASE » ou « HEUR » ?', aide: aideFamilles,
          o: [
            F('Un comportement rhéologique imposé au produit', 'Si c’était vrai, tous les produits d’une même famille se comporteraient de la même façon : les fournisseurs proposent pourtant des profils variés dans une même famille.'),
            V('Une architecture : squelette du polymère et greffage des motifs hydrophobes', 'Exact : le sigle décrit une structure chimique (acrylique alcali-gonflable modifié, ou polyuréthane éthoxylé modifié), pas un comportement.'),
            F('Une marque commerciale déposée', 'Ce sont des familles chimiques génériques, pas des marques.'),
            F('La zone de gradient où le produit travaille', 'La zone de travail dépend du comportement du produit, pas de son sigle.'),
          ] },
        { id: 'qui', titre: 'Qui décide du comportement ?', q: 'Qu’est-ce qui détermine réellement le profil rhéologique d’un épaississant associatif ?', aide: 'Pense à ce qui est greffé sur la chaîne, et à sa densité.',
          o: [
            F('Le sigle de la famille (ASE, HASE ou HEUR)', 'C’est l’idée reçue : le sigle décrit une architecture, pas un comportement.'),
            V('La nature, la densité et l’agencement des groupes greffés sur la chaîne', 'Exact : des gants bien répartis qui adsorbent sur les charges donnent des liaisons tenues (viscosité quasi constante) ; des auto-associations lâches dominantes donnent rhéofluidification et thixotropie.'),
            F('La seule masse molaire du polymère', 'La masse compte, mais ne suffit pas : elle agit avec la nature et la densité des greffons.'),
            F('Uniquement la quantité d’eau de la peinture', 'L’eau est le milieu : elle ne fixe pas à elle seule les liaisons que l’épaississant peut former.'),
          ] },
        { id: 'contrexemple', titre: 'Le tuteur a-t-il raison ?', q: 'Un sigle suffit-il à prédire le profil rhéologique d’un épaississant ?', aide: 'Relis ce que le mot « forcément » suppose, et ce que la fiche technique d’un produit mesure.',
          o: [
            F('Oui : les sigles imposent les profils', 'C’est précisément l’idée reçue à démonter : le sigle décrit une architecture.'),
            V('Non : selon la chimie du greffage, des produits d’une même famille ont des profils différents', 'Exact : notre Thixol 53 L (HASE) est pseudoplastique thixotrope et notre Coapur 3025 (HEUR) quasi newtonien, mais des produits d’une même famille couvrent des profils variés. Il faut lire la fiche du produit.'),
            F('Oui, mais seulement à dose très forte', 'La dose change l’intensité du comportement, pas la logique : le sigle ne suffit pas.'),
            F('La question n’a pas de sens : HASE et HEUR sont identiques', 'Les squelettes diffèrent (acrylique modifié contre polyuréthane éthoxylé), mais aucun des deux n’impose un profil.'),
          ] },
      ],
      retenir: ['« HASE » et « HEUR » désignent des architectures (squelette + greffons), pas des comportements.', 'Le profil vient des fonctions chimiques effectivement portées : on le lit sur la fiche technique du produit.'],
    }),
  },
];
