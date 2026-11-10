
// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EXERCICES « MACHINES THERMIQUES » (Terminale STL — Systèmes et procédés)
//  Format identique à src/simulations/AtelierSituationsBanque.js (atelier S'APP
//  « Comprendre une situation ») : exercices à étapes, QCM + saisies numériques,
//  une aide par étape, nombres tirés au hasard, aucune dépendance à React.
//
//  ⚠️ INTÉGRATION (à la charge de Claude) :
//   • domaine « Machines thermiques » à déclarer dans src/chapitres.js (champ
//     domaines du chapitre TSTL Systèmes et procédés) — le test chapitres.test.mjs
//     exige qu'un thème d'exercices figure dans un chapitre ;
//   • soit fusionner ces exercices dans AtelierSituationsBanque.js (si la banque
//     doit rester mono-domaine, voir son DOM), soit poser ce fichier à côté et le
//     brancher dans l'atelier ; les étapes de saisie visent aussi ANA/VAL : les
//     transposer dans les banques des autres ateliers si leurs formats diffèrent ;
//   • vérifier les codes d'accès (convention SAPPn / ANAn / VALn) et la cohérence
//     avec le domaine déclaré.
//  Contenus inspirés de la séquence académique « machines thermiques » mais
//  entièrement reformulés (bassin d'aquaculture, chambre froide de laboratoire,
//  données fictives plausibles) : rien de reconnaissable.
// ═══════════════════════════════════════════════════════════════════════════

// Aucune dépendance à presenter.js ici : exercices sans tableau bilan ni schéma Arduino. Pour un schéma ou un tableau, voir le format de AtelierSituationsBanque.js.

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const nb = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

const DOM = 'Machines thermiques';
const K = c => c + 273.15;

export const EXERCICES = [

  // ── E1 (S'APP, niveau 1) : comprendre la machine d'un bassin d'aquaculture ──
  {
    id: 'pac-bassin-situer', domaine: DOM, niveau: 1,
    titre: 'Une pompe à chaleur pour le bassin des truites',
    construire: () => {
      const tc = tire([20, 22, 24]);          // température de l'eau du bassin (°C, entière)
      const tf = tire([2, 5, 7, 9]);           // température de l'air extérieur (°C, entière)
      return {
        enonce: `Un élevage de truites maintient l'eau de ses bassins à ${nb(tc, 0)} °C. L'hiver, l'air extérieur est à ${nb(tf, 0)} °C. Une pompe à chaleur (PAC) chauffe cette eau : un fluide frigorigène y circule dans un circuit fermé et traverse quatre organes (évaporateur, compresseur, condenseur, détendeur).`,
        etapes: [
          { id: 'sources', titre: 'Les deux sources', q: `Identifier la source chaude et la source froide de cette PAC.`,
            aide: '« Chaude » et « froide » sont relatifs : comparez les deux températures.',
            o: [
              V(`Source chaude : l'eau du bassin à ${nb(tc, 0)} °C ; source froide : l'air extérieur à ${nb(tf, 0)} °C`, 'La source la plus chaude est l\'eau du bassin : c\'est elle que la machine chauffe.'),
              F(`Source chaude : l'air extérieur à ${nb(tf, 0)} °C ; source froide : l'eau du bassin à ${nb(tc, 0)} °C`, `L'air extérieur (${nb(tf, 0)} °C) est plus froid que l'eau du bassin (${nb(tc, 0)} °C) : la source chaude est l'eau du bassin.`),
              F('Les deux sources ont la même température', `Non : ${nb(tc, 0)} °C d'un côté, ${nb(tf, 0)} °C de l'autre.`),
            ] },
          { id: 'spontane', titre: 'Le sens spontané d\'un transfert thermique',
            q: 'Quel transfert thermique est spontané ?',
            aide: 'Déjà vu en première : sans rien faire, la chaleur passe du chaud vers le froid.',
            o: [
              V(`De l'eau du bassin (${nb(tc, 0)} °C) vers l'air extérieur (${nb(tf, 0)} °C)`, 'Le transfert spontané va de la source chaude vers la source froide : c\'est le second principe.'),
              F(`De l'air extérieur (${nb(tf, 0)} °C) vers l'eau du bassin (${nb(tc, 0)} °C)`, 'Ce transfert-là ne se fait pas spontanément : c\'est justement lui que la PAC doit forcer, grâce au travail du compresseur.'),
              F('Les deux sens sont spontanés', 'Non : le second principe fixe un sens unique au transfert spontané.'),
            ] },
          { id: 'cycle', titre: 'Pourquoi un fonctionnement cyclique ?',
            q: 'Que signifie « la machine fonctionne en cycle » ?',
            aide: 'Suivez le fluide : il traverse les quatre organes puis revient à son point de départ.',
            o: [
              V('Le fluide frigorigène revient à son état initial après chaque tour du circuit', 'À chaque tour, pression, température et état physique du fluide retrouvent leurs valeurs de départ : c\'est pour cela qu\'on peut écrire ΔU = 0 sur un cycle.'),
              F('La machine produit de l\'électricité en continu', 'Non : elle en consomme, dans le compresseur.'),
              F('Le circuit est ouvert sur le bassin', 'Non : le circuit du fluide est fermé et étanche ; l\'eau du bassin ne fait que céder/recevoir de l\'énergie thermique au travers des échangeurs.'),
            ] },
          { id: 'evap', titre: 'Le rôle de l\'évaporateur',
            q: `Que se passe-t-il dans l'évaporateur, au contact de l'air extérieur à ${nb(tf, 0)} °C ?`,
            aide: '« Évaporateur » vient de « s\'évaporer » : un changement d\'état, liquide → vapeur.',
            o: [
              V('Le fluide passe de l\'état liquide à l\'état vapeur en captant de l\'énergie à l\'air extérieur', 'Le changement d\'état liquide → vapeur capte de l\'énergie thermique : la machine « pompe » ainsi la chaleur de la source froide.'),
              F('Le fluide passe de l\'état vapeur à l\'état liquide en cédant de l\'énergie', 'C\'est le condenseur, côté source chaude, qui fait ça.'),
              F('Le fluide est comprimé par le compresseur', 'Non : la compression est l\'étape suivante, à la sortie de l\'évaporateur.'),
            ] },
        ],
        retenir: [`Une machine thermique réceptrice transfère de l'énergie de la source froide vers la source chaude, à contre-sens du transfert spontané, grâce au travail du compresseur. Sur un cycle, le fluide revient à son état initial.`],
      };
    },
  },

  // ── E2 (ANA + VAL, niveau 1) : bilan de la PAC, nombres tirés ──
  {
    id: 'pac-bilan', domaine: DOM, niveau: 1,
    titre: 'Bilan énergétique de la pompe à chaleur',
    construire: () => {
      const w = tire([1.5, 2.0, 2.5, 3.0]);            // kW, multiple de 0,5
      const qf = tire([10.5, 12.0, 13.5, 15.0]);       // kW, multiple de 0,5
      const qc = Math.round((qf + w) * 10) / 10;       // premier principe
      const cop = Math.round(qc / w * 10) / 10;
      return {
        enonce: `La PAC du bassin fonctionne en régime permanent. Sur un cycle du fluide frigorigène, le compresseur reçoit une puissance électrique W = ${nb(w, 1)} kW et le fluide capte une puissance thermique Q_f = ${nb(qf, 1)} kW à l'air extérieur.`,
        etapes: [
          { id: 'principe', titre: 'Le principe à utiliser', q: 'Quelle relation relie les transferts d\'énergie sur un cycle ?',
            aide: 'Sur un cycle, le fluide revient à son état initial : que vaut ΔU ?',
            o: [
              V('ΔU = W + Q_c + Q_f = 0, donc Q_c = Q_f + W (en valeurs positives)', 'L\'énergie interne ne change pas sur un cycle : tout ce que la machine reçoit, elle le redonne. En valeurs positives, l\'énergie cédée à la source chaude vient de la source froide ET du compresseur.'),
              F('ΔU = W + Q_c + Q_f = 0, donc Q_c = Q_f − W', 'Attention au sens : le compresseur s\'ajoute à l\'énergie pompée, il ne s\'en retranche pas.'),
              F('ΔU = W : l\'énergie reçue par le compresseur est stockée par le fluide', 'Sur un cycle, le fluide revient à son état initial : rien n\'est stocké.'),
            ] },
          { id: 'qc', titre: 'Calculer Q_c', q: `Calculez la puissance thermique Q_c cédée à l'eau du bassin.`,
            aide: `Q_c = Q_f + W, avec Q_f = ${nb(qf, 1)} kW et W = ${nb(w, 1)} kW.`,
            type: 'saisie', champs: [{ id: 'qc', lib: 'Q_c', u: 'kW', vrai: qc, tol: 0.02 }],
            expl: `Q_c = Q_f + W = ${nb(qf, 1)} + ${nb(w, 1)} = ${nb(qc, 1)} kW.` },
          { id: 'cop', titre: 'Calculer le COP', q: `Le fabricant définit le COP comme le rapport de la puissance thermique utile à la puissance électrique consommée. Calculez le COP de cette PAC.`,
            aide: `COP = Q_c / W, avec Q_c = ${nb(qc, 1)} kW et W = ${nb(w, 1)} kW.`,
            type: 'saisie', champs: [{ id: 'cop', lib: 'COP', u: '', vrai: cop, tol: 0.03 }],
            expl: `COP = Q_c / W = ${nb(qc, 1)} / ${nb(w, 1)} = ${nb(cop, 1)}. La machine restitue environ ${nb(cop, 0)} fois plus d'énergie thermique qu'elle ne consomme d'électricité.` },
          { id: 'signes', titre: 'La convention des signes', q: 'Avec la convention « énergie reçue par le fluide positive, cédée négative », quels sont les signes de W, Q_c et Q_f ?',
            aide: 'Le compresseur donne, le condenseur cède, l\'évaporateur capte.',
            o: [
              V('W > 0, Q_c < 0, Q_f > 0', 'Le fluide reçoit le travail du compresseur et l\'énergie de l\'air extérieur, et cède l\'énergie à l\'eau du bassin.'),
              F('W > 0, Q_c > 0, Q_f < 0', 'Q_c est l\'énergie cédée par le fluide à l\'eau du bassin : elle est négative pour le fluide.'),
              F('W < 0, Q_c > 0, Q_f > 0', 'Le fluide reçoit le travail W : W > 0.'),
            ] },
        ],
        retenir: [`Sur un cycle : ΔU = W + Q_c + Q_f = 0. Pour une PAC : COP = Q_c / W_elec, toujours supérieur à 1 quand la machine est utilement exploitée.`],
      };
    },
  },

  // ── E3 (ANA + VAL, niveau 2) : la chambre froide du laboratoire ──
  {
    id: 'frigo-chambre', domaine: DOM, niveau: 2,
    titre: 'La chambre froide du laboratoire',
    construire: () => {
      const tc = tire([19, 20, 21, 22]);        // laboratoire (°C)
      const tf = tire([2, 3, 4, 5]);            // chambre froide (°C)
      const cop = tire([3.2, 3.6, 4.0, 4.4]);   // COP « constructeur » (affiché = corrigé)
      const w = tire([0.8, 1.0, 1.2, 1.5]);     // kW
      const qf = Math.round(cop * w * 10) / 10; // énergie utile (kW)
      const qc = Math.round((qf + w) * 10) / 10;
      return {
        enonce: `Un laboratoire conserve des échantillons dans une chambre froide maintenue à ${nb(tf, 0)} °C, dans une pièce à ${nb(tc, 0)} °C. Le groupe froid qui l'équipe fonctionne comme une machine frigorifique : le fabricant annonce un COP (parfois noté EER) de ${nb(cop, 1)} et le compresseur consomme une puissance électrique W = ${nb(w, 1)} kW.`,
        etapes: [
          { id: 'utile', titre: 'L\'énergie utile', q: 'Quelle est l\'énergie utile de cette machine frigorifique ?',
            aide: 'On veut que la chambre reste froide : quelle source doit être refroidie ?',
            o: [
              V('L\'énergie thermique captée à l\'intérieur de la chambre froide (source froide)', 'L\'utilité est le froid : l\'énergie utile est Q_f, captée à la source froide.'),
              F('L\'énergie thermique cédée à la pièce du laboratoire (source chaude)', 'L\'énergie cédée à la pièce est un déchet thermique, pas l\'énergie utile : on veut refroidir la chambre.'),
              F('Le travail du compresseur', 'Le travail est ce qu\'on paie, pas ce qu\'on recherche.'),
            ] },
          { id: 'qf', titre: 'Calculer Q_f', q: `Calculez la puissance thermique Q_f captée dans la chambre froide.`,
            aide: `Pour une machine frigorifique : COP = Q_f / W, donc Q_f = COP × W (COP = ${nb(cop, 1)}, W = ${nb(w, 1)} kW).`,
            type: 'saisie', champs: [{ id: 'qf', lib: 'Q_f', u: 'kW', vrai: qf, tol: 0.03 }],
            expl: `Q_f = COP × W = ${nb(cop, 1)} × ${nb(w, 1)} = ${nb(qf, 1)} kW.` },
          { id: 'qc', titre: 'Calculer Q_c', q: `Calculez la puissance thermique Q_c cédée à la pièce du laboratoire.`,
            aide: `Premier principe sur un cycle : Q_c = Q_f + W, avec Q_f = ${nb(qf, 1)} kW et W = ${nb(w, 1)} kW.`,
            type: 'saisie', champs: [{ id: 'qc', lib: 'Q_c', u: 'kW', vrai: qc, tol: 0.02 }],
            expl: `Q_c = Q_f + W = ${nb(qf, 1)} + ${nb(w, 1)} = ${nb(qc, 1)} kW : la pièce du laboratoire reçoit plus que ce que le compresseur consomme.` },
          { id: 'val', titre: 'Valider une affirmation', q: `Un technicien affirme : « Le groupe froid rejette dans la pièce une puissance supérieure à celle qu'il consomme. » Est-ce exact ?`,
            aide: `Comparez Q_c = ${nb(qc, 1)} kW et W = ${nb(w, 1)} kW.`,
            o: [
              V(`Oui : Q_c = ${nb(qc, 1)} kW > W = ${nb(w, 1)} kW, car Q_c = Q_f + W`, 'L\'énergie rejetée à la source chaude est la somme de l\'énergie pompée et du travail consommé : elle dépasse toujours W.'),
              F('Non : la machine ne rejette que ce qu\'elle consomme', `Q_c ne vaut pas W : Q_c = Q_f + W = ${nb(qc, 1)} kW.`),
              F('On ne peut pas conclure sans connaître le fluide frigorigène', `Le bilan suffit : Q_c = Q_f + W.`),
            ] },
        ],
        retenir: [`Machine frigorifique : COP (ou EER) = Q_f / W_elec. Premier principe : Q_c = Q_f + W. L'énergie utile est côté source froide.`],
      };
    },
  },

  // ── E4 (ANA, niveau 2) : efficacité thermodynamique (kelvins !) ──
  {
    id: 'thermo-limite', domaine: DOM, niveau: 2,
    titre: 'La limite théorique : l\'efficacité thermodynamique',
    construire: () => {
      const tc = tire([22, 24, 26, 28]);               // source chaude (°C)
      const tf = tire([2, 5, 8, 11]);                   // source froide (°C)
      const maxPac = Math.round((K(tc) / (tc - tf)) * 10) / 10;
      const maxFrigo = Math.round((K(tf) / (tc - tf)) * 10) / 10;
      return {
        enonce: `On étudie deux machines fonctionnant entre une source chaude à ${nb(tc, 0)} °C et une source froide à ${nb(tf, 0)} °C : une PAC (elle chauffe la source chaude) et un groupe froid (il refroidit la source froide). Leur efficacité thermodynamique maximale se calcule avec les températures exprimées en kelvins.`,
        etapes: [
          { id: 'conv', titre: 'La conversion à ne pas rater', q: `Que valent T_c et T_f en kelvins ?`,
            aide: 'T(K) = T(°C) + 273,15, à faire avant tout calcul.',
            o: [
              V(`T_c = ${nb(K(tc), 2)} K et T_f = ${nb(K(tf), 2)} K`, `On ajoute 273,15 à chaque température. L'écart T_c − T_f = ${nb(tc - tf, 0)} K est le même qu'en °C, mais pas les températures elles-mêmes !`),
              F(`T_c = ${nb(tc, 0)} K et T_f = ${nb(tf, 0)} K`, 'Vous avez laissé les températures en °C : ajoutez 273,15 avant de calculer.'),
              F(`T_c = ${nb(tc + 273, 2)} K et T_f = ${nb(tf + 273, 2)} K`, `Presque : la conversion exacte est +273,15 (T_c = ${nb(K(tc), 2)} K, T_f = ${nb(K(tf), 2)} K).`),
            ] },
          { id: 'maxpac', titre: 'Efficacité maximale de la PAC', q: `Calculez l'efficacité thermodynamique maximale de la PAC : T_c/(T_c − T_f), en kelvins.`,
            aide: `T_c = ${nb(K(tc), 2)} K et l'écart T_c − T_f = ${nb(tc - tf, 0)} K.`,
            type: 'saisie', champs: [{ id: 'maxpac', lib: 'COP_max (PAC)', u: '', vrai: maxPac, tol: 0.03 }],
            expl: `COP_max = T_c/(T_c − T_f) = ${nb(K(tc), 2)}/${nb(tc - tf, 0)} ≈ ${nb(maxPac, 1)}.` },
          { id: 'maxfrigo', titre: 'Efficacité maximale du groupe froid', q: `Calculez l'efficacité thermodynamique maximale du groupe froid : T_f/(T_c − T_f), en kelvins.`,
            aide: `Même écart ${nb(tc - tf, 0)} K, mais c'est la température de la source froide qui compte cette fois : T_f = ${nb(K(tf), 2)} K.`,
            type: 'saisie', champs: [{ id: 'maxfrigo', lib: 'COP_max (frigo)', u: '', vrai: maxFrigo, tol: 0.03 }],
            expl: `COP_max = T_f/(T_c − T_f) = ${nb(K(tf), 2)}/${nb(tc - tf, 0)} ≈ ${nb(maxFrigo, 1)} : plus petit que celui de la PAC.` },
          { id: 'reel', titre: 'COP réel contre limite', q: 'Une de ces machines annonce un COP réel égal à sa limite théorique. Que faut-il en penser ?',
            aide: 'Une machine réelle a-t-elle des pertes (frottements, compresseur imparfait) ?',
            o: [
              V('C\'est impossible : le COP réel est toujours strictement inférieur à l\'efficacité thermodynamique maximale', 'La limite théorique suppose une machine parfaite : irréversibilités et pertes placent toujours le COP réel en dessous.'),
              F('C\'est normal pour une machine industrielle bien réglée', 'Même parfaitement réglée, une machine réelle subit des irréversibilités : elle n\'atteint jamais la limite.'),
              F('Cela dépend du fluide frigorigène utilisé', 'Quel que soit le fluide, la limite théorique ne peut pas être atteinte.'),
            ] },
        ],
        retenir: [`Efficacité thermodynamique maximale (kelvins) : T_c/(T_c − T_f) pour une PAC, T_f/(T_c − T_f) pour un groupe froid. Le COP réel est toujours strictement inférieur à cette limite.`],
      };
    },
  },

  // ── E5 (VAL, niveau 2) : distinguer COP et efficacité thermodynamique ──
  {
    id: 'pac-catalogue', domaine: DOM, niveau: 2,
    titre: 'Le catalogue du fabricant',
    construire: () => {
      const tc = tire([20, 22, 24]);            // eau chauffée (°C)
      const tf = tire([-2, 2, 5]);              // air extérieur (°C)
      const cop = tire([3.0, 3.5, 4.0, 4.5]);   // COP « constructeur » annoncé au catalogue
      const maxPac = Math.round((K(tc) / (tc - tf)) * 10) / 10;
      const eff = Math.round(cop / maxPac * 100) / 100;
      return {
        enonce: `Le catalogue d'un fabricant annonce, pour une PAC qui chauffe l'eau à ${nb(tc, 0)} °C en puisant l'énergie dans l'air extérieur à ${nb(tf, 0)} °C, un coefficient de performance (COP) de ${nb(cop, 1)}. L'efficacité thermodynamique maximale de cette machine, elle, se calcule à partir des températures des deux sources exprimées en kelvins.`,
        etapes: [
          { id: 'distinction', titre: 'Deux grandeurs à ne pas confondre', q: 'Comment distinguer le coefficient de performance de l\'efficacité thermodynamique maximale ?',
            aide: 'L\'une est annoncée par le fabricant pour sa machine réelle ; l\'autre se calcule à partir des seules températures.',
            o: [
              V('Le COP se mesure sur la machine réelle (rapport de l\'énergie utile à l\'énergie électrique consommée) ; l\'efficacité thermodynamique maximale est une limite théorique, calculée avec les températures en kelvins', 'Ce sont deux grandeurs distinctes : l\'une décrit la machine telle qu\'elle est, l\'autre la meilleure machine possible entre ces deux températures.'),
              F('Ce sont deux noms de la même grandeur', 'Non : le COP d\'une machine réelle est toujours strictement inférieur à l\'efficacité thermodynamique maximale.'),
              F('Le COP est la limite théorique et l\'efficacité thermodynamique est mesurée sur la machine', 'C\'est l\'inverse : le COP est la grandeur « constructeur », mesurée ; l\'efficacité thermodynamique maximale est la limite théorique.'),
            ] },
          { id: 'max', titre: 'La limite théorique', q: `Calculez l'efficacité thermodynamique maximale de cette PAC : T_c/(T_c − T_f), en kelvins.`,
            aide: `T_c = ${nb(K(tc), 2)} K et l'écart T_c − T_f = ${nb(tc - tf, 0)} K.`,
            type: 'saisie', champs: [{ id: 'max', lib: 'COP_max', u: '', vrai: maxPac, tol: 0.03 }],
            expl: `COP_max = T_c/(T_c − T_f) = ${nb(K(tc), 2)}/${nb(tc - tf, 0)} ≈ ${nb(maxPac, 1)}.` },
          { id: 'eff', titre: 'L\'efficacité thermodynamique réelle', q: `Le rapport du COP annoncé au COP maximum donne l'efficacité thermodynamique réelle de la machine (fraction de la limite théorique atteinte). Calculez-la.`,
            aide: `Efficacité réelle = COP/COP_max = ${nb(cop, 1)}/${nb(maxPac, 1)}.`,
            type: 'saisie', champs: [{ id: 'eff', lib: 'COP/COP_max', u: '', vrai: eff, tol: 0.05 }],
            expl: `COP/COP_max = ${nb(cop, 1)}/${nb(maxPac, 1)} ≈ ${nb(eff, 2)} : la machine réelle atteint environ ${nb(eff * 100, 0)} % de la limite théorique.` },
          { id: 'concurrent', titre: 'Le concurrent trop beau', q: `Un concurrent annonce une PAC fonctionnant entre les mêmes températures, avec un COP supérieur à cette limite théorique. Que faut-il en penser ?`,
            aide: `Comparez avec la limite que vous venez de calculer : ${nb(maxPac, 1)}.`,
            o: [
              V('C\'est impossible : soit les conditions d\'essai étaient différentes (autres températures), soit l\'annonce est erronée', 'Aucune machine réelle ne dépasse l\'efficacité thermodynamique maximale entre deux températures données. Cette limite permet de contrôler une annonce.'),
              F('C\'est possible pour une machine haut de gamme', 'Même excellente, une machine réelle reste strictement en dessous de la limite théorique.'),
              F('Cela prouve que la limite théorique est fausse', 'La limite théorique est un résultat général, valable pour toute machine fonctionnant entre ces deux températures.'),
            ] },
        ],
        retenir: [`COP et efficacité thermodynamique maximale sont deux grandeurs distinctes : le COP se mesure sur la machine réelle, l'efficacité maximale se calcule en kelvins. Leur rapport (efficacité thermodynamique réelle) est toujours strictement inférieur à 1.`],
      };
    },
  },
];

