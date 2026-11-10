// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EXERCICES « CONTRÔLE CINÉTIQUE ET THERMODYNAMIQUE » (BTS Métiers de la chimie)
//  Même format que AtelierSituationsBanque.js. Les valeurs du modèle (énergies, facteur A) viennent de cinetModele.js,
//  comme dans la simulation « Contrôle cinétique ou thermodynamique : addition de HBr sur le buta-1,3-diène ».
//  Compétences visées (chimie organique, diènes conjugués, sélectivité) :
//   • Écrire les produits d'addition 1,2 et 1,4 d'un diène conjugué (carbocation allylique, mésomérie)  → cinet-diene
//   • Exploiter un profil d'énergie à deux voies : barrières, barrière inverse, stabilité des produits   → cinet-profil
//   • Distinguer contrôle cinétique et contrôle thermodynamique selon les conditions                    → cinet-conditions
//   • Prévoir qualitativement la composition à l'équilibre (stabilité des produits, température)         → cinet-equilibre
//   • Réversibilité : barrière inverse, température et durée                                             → cinet-arrhenius
// ═══════════════════════════════════════════════════════════════════════════
import { E } from './cinetModele.js';

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Contrôle cinétique et thermodynamique (BTS)';

export const EXERCICES = [
  // ── C1 : les deux produits d'un diène conjugué ──
  {
    id: 'cinet-diene', domaine: DOM, niveau: 2, titre: 'Les deux produits d\'addition sur un diène conjugué',
    construire: () => {
      const X = tire([['HBr', 'brom', 'Br'], ['HCl', 'chlor', 'Cl']]);
      return {
        enonce: `On fait réagir le buta-1,3-diène CH₂=CH–CH=CH₂ avec ${X[0]}. À l'étape 1, H⁺ se fixe sur le carbone C1 : on obtient le carbocation allylique CH₃–CH⁺–CH=CH₂ (numérotation du diène : C1 portant maintenant CH₃, charge + sur C2, double liaison C3=C4).`,
        etapes: [
          { id: 'meso', titre: 'La délocalisation de la charge', q: 'Sur quels carbones la charge + peut-elle se trouver (formes mésomères) ?',
            aide: 'Le doublet de la double liaison C3=C4 peut se déplacer vers C2⁺ en créant une nouvelle double liaison C2=C3.',
            o: [V('Sur C2 ou sur C4', 'CH₃–CH⁺–CH=CH₂ ↔ CH₃–CH=CH–CH₂⁺ : la charge est délocalisée sur C2 et C4.'),
              F('Seulement sur C2', 'La double liaison voisine permet de déplacer la charge sur C4 : la forme CH₃–CH=CH–CH₂⁺ existe aussi.'),
              F('Sur C1 ou sur C3', 'C1 est un groupe méthyle et C3 est au milieu du système conjugué : la charge ne s\'y place pas.')] },
          { id: 'p12', titre: 'L\'addition 1,2', q: `Quel est le produit si ${X[2]}⁻ se fixe sur C2 ?`,
            aide: `${X[2]} est lié à C2 ; la double liaison C3=C4 reste en place.`,
            o: [V(`Le 3-${X[1]}obut-1-ène CH₃–CH(${X[2]})–CH=CH₂`, `${X[2]} est sur C2, la double liaison reste C3=C4 (terminale) : c'est l'addition 1,2.`),
              F(`Le 1-${X[1]}obut-2-ène CH₃–CH=CH–CH₂${X[2]}`, `Ce produit correspond à une attaque sur C4 (addition 1,4), pas sur C2.`),
              F(`Le 2-${X[1]}obutane CH₃–CHBr–CH₂–CH₃`.replace('Br', X[2]), 'Ce produit serait saturé : il aurait fixé deux H, mais le diène n\'a fixé que H et ' + X[2] + '.')] },
          { id: 'p14', titre: 'L\'addition 1,4', q: `Quel est le produit si ${X[2]}⁻ se fixe sur C4 ?`,
            aide: `${X[2]} est lié à C4 ; la double liaison s'est déplacée entre C2 et C3.`,
            o: [V(`Le 1-${X[1]}obut-2-ène CH₃–CH=CH–CH₂${X[2]}`, `${X[2]} est sur C4 (extrémité), la double liaison se retrouve entre C2 et C3 : c'est l'addition 1,4.`),
              F(`Le 3-${X[1]}obut-1-ène CH₃–CH(${X[2]})–CH=CH₂`, `Ce produit correspond à une attaque sur C2 (addition 1,2).`),
              F(`Le 4-${X[1]}obut-1-ène`, 'Un 4-halogénobut-1-ène n\'aurait pas la bonne structure : H s\'est fixé sur C1 et le doublet de C3=C4 s\'est déplacé pour former la liaison C2=C3.')] },
        ],
        retenir: ['Un carbocation allylique est stabilisé par mésomérie : sa charge + est répartie sur deux carbones. Le nucléophile peut attaquer l\'un ou l\'autre : on obtient l\'addition 1,2 et l\'addition 1,4.'],
      };
    },
  },

  // ── C2 : lire un profil d'énergie ──
  {
    id: 'cinet-profil', domaine: DOM, niveau: 2, titre: 'Lire un profil à deux produits : barrières et stabilité',
    construire: () => {
      const Ec = tire([15, 20, 25]), a = tire([8, 10, 12]), b = a + tire([2, 3, 4]), P12 = tire([-55, -60, -65]), d = tire([5, 7, 9]), P14 = P12 - d;
      const ET2a = Ec + a, ET2b = Ec + b, inv12 = ET2a - P12, inv14 = ET2b - P14;
      return {
        enonce: `Le carbocation allylique (énergie ${Ec} kJ·mol⁻¹, réactifs = 0) peut donner deux produits. Pour la voie 1,2, le sommet de la barrière (ET₂) est à ${ET2a} kJ·mol⁻¹ et le produit à ${P12} kJ·mol⁻¹. Pour la voie 1,4, ET₂ est à ${ET2b} kJ·mol⁻¹ et le produit à ${P14} kJ·mol⁻¹.`,
        etapes: [
          { id: 'ea', titre: 'La barrière de formation', q: 'Quelle est l\'énergie d\'activation de la formation du produit 1,2 à partir du carbocation ?',
            aide: 'Énergie du sommet ET₂ de la voie 1,2 moins énergie du carbocation.',
            type: 'saisie', champs: [{ id: 'ea', lib: 'E_a (carbocation → 1,2)', u: 'kJ·mol⁻¹', vrai: a, tol: 0.02 }],
            expl: `E_a = ${ET2a} − ${Ec} = ${a} kJ·mol⁻¹.` },
          { id: 'cin', titre: 'Le produit cinétique', q: 'Quel produit se forme le plus vite à partir du carbocation ?',
            aide: 'Comparez les barrières de formation : la plus basse est franchie le plus facilement.',
            o: [V('Le produit 1,2', `Sa barrière (${a} kJ·mol⁻¹) est inférieure à celle du produit 1,4 (${b} kJ·mol⁻¹) : c'est le produit cinétique.`),
              F('Le produit 1,4', `Sa barrière (${b} kJ·mol⁻¹) est supérieure à celle du produit 1,2 (${a} kJ·mol⁻¹) : il se forme moins vite.`),
              F('Les deux à la même vitesse', 'Les deux barrières sont différentes : les vitesses le sont aussi.')] },
          { id: 'thermo', titre: 'Le produit thermodynamique', q: 'Quel produit est le plus stable ?',
            aide: 'Le produit le plus stable est celui dont l\'énergie est la plus basse.',
            o: [V('Le produit 1,4', `${P14} kJ·mol⁻¹ est inférieur à ${P12} kJ·mol⁻¹ : le produit 1,4 est le plus stable (produit thermodynamique).`),
              F('Le produit 1,2', `${P12} kJ·mol⁻¹ est supérieur à ${P14} kJ·mol⁻¹ : le produit 1,2 est moins stable.`),
              F('Ils ont la même stabilité', 'Leurs énergies sont différentes.')] },
          { id: 'inv', titre: 'La barrière inverse', q: 'Quelle énergie faut-il fournir au produit 1,4 pour qu\'il redevienne le carbocation ?',
            aide: 'Énergie du sommet ET₂ de la voie 1,4 moins énergie du produit 1,4.',
            type: 'saisie', champs: [{ id: 'inv', lib: 'Barrière inverse (1,4 → carbocation)', u: 'kJ·mol⁻¹', vrai: inv14, tol: 0.02 }],
            expl: `E = ${ET2b} − (${P14}) = ${inv14} kJ·mol⁻¹ (pour comparaison, celle du produit 1,2 vaut ${inv12} kJ·mol⁻¹ : la plus faible des deux, donc le produit 1,2 est le premier à se retransformer).` },
        ],
        retenir: ['Produit cinétique : barrière de formation la plus basse. Produit thermodynamique : énergie la plus basse. La barrière inverse (sommet − produit) mesure la facilité avec laquelle un produit se retransforme.'],
      };
    },
  },

  // ── C3 : contrôle cinétique ou thermodynamique selon les conditions ──
  {
    id: 'cinet-conditions', domaine: DOM, niveau: 2, titre: 'Contrôle cinétique ou thermodynamique ? Choisir les conditions',
    construire: () => {
      const cin = Math.random() < 0.5;
      const cond = cin ? tire(['à 0 °C, en arrêtant la réaction après quelques secondes', 'à −20 °C, en arrêtant la réaction après quelques secondes', 'à basse température, en travaillant rapidement'])
        : tire(['à 40 °C, en laissant le mélange réagir plusieurs heures', 'à 60 °C, en laissant le mélange réagir plusieurs heures', 'à chaud, en laissant réagir longtemps']);
      return {
        enonce: `On fait réagir le buta-1,3-diène avec HBr ${cond}. Le produit 1,2 se forme plus vite ; le produit 1,4 est plus stable ; chaque produit peut se retransformer en carbocation si la température est assez élevée.`,
        etapes: [
          { id: 'reg', titre: 'Le régime', q: 'Dans ces conditions, quel contrôle s\'applique ?',
            aide: 'Si les étapes sont irréversibles, la composition reflète les vitesses ; si elles sont réversibles, elle reflète les stabilités.',
            o: [V(cin ? 'Contrôle cinétique' : 'Contrôle thermodynamique', cin ? 'À basse température et sur un temps court, aucun produit ne se retransforme : la composition reflète les vitesses de formation.' : 'À température plus élevée et sur un temps long, les produits s\'interconvertissent via le carbocation : l\'équilibre est atteint.'),
              F(cin ? 'Contrôle thermodynamique' : 'Contrôle cinétique', cin ? 'L\'équilibre n\'a pas le temps de s\'établir à basse température et en peu de temps.' : 'Avec la température et la durée, les produits ont le temps de se retransformer : on n\'est plus sous contrôle cinétique.'),
              F('Ni l\'un ni l\'autre : la température n\'a aucun effet', 'La température et la durée déterminent si les étapes sont réversibles : elles changent la composition.')] },
          { id: 'maj', titre: 'Le produit majoritaire', q: 'Quel produit est majoritaire ?',
            aide: cin ? 'Sous contrôle cinétique, c\'est le produit qui se forme le plus vite.' : 'Sous contrôle thermodynamique, c\'est le produit le plus stable.',
            o: [V(cin ? 'Le produit 1,2' : 'Le produit 1,4', cin ? 'Sa barrière de formation est la plus basse : il est formé le plus vite.' : 'Il a l\'énergie la plus basse : il domine à l\'équilibre.'),
              F(cin ? 'Le produit 1,4' : 'Le produit 1,2', cin ? 'Il se forme moins vite et n\'a pas le temps de s\'accumuler.' : 'Il est moins stable : il se retransforme en carbocation puis en produit 1,4.'),
              F('Les deux en quantités égales', 'Les deux produits n\'ont ni la même vitesse de formation ni la même stabilité.')] },
          { id: 'rev', titre: 'La réversibilité', q: 'Que se passe-t-il pour le produit 1,2 dans ces conditions ?',
            aide: 'Comparez la température à celle qui permet de franchir la barrière inverse (environ 90 kJ·mol⁻¹).',
            o: [V(cin ? 'Il ne se retransforme pas : la barrière inverse est trop haute pour cette température' : 'Il se retransforme en carbocation, qui peut donner le produit 1,4 plus stable', cin ? 'À basse température, l\'énergie thermique est insuffisante pour franchir 90 kJ·mol⁻¹ : la réaction est irréversible.' : 'La température permet de franchir la barrière inverse : les produits s\'interconvertissent jusqu\'à l\'équilibre.'),
              F(cin ? 'Il se retransforme en carbocation, qui peut donner le produit 1,4 plus stable' : 'Il ne se retransforme pas : la barrière inverse est trop haute pour cette température', cin ? 'À basse température, ce retour n\'a pas lieu.' : 'À plus haute température et sur un temps long, le retour est possible.'),
              F('Il disparaît par évaporation', 'Rien dans le mécanisme ne conduit à une évaporation du produit.')] },
        ],
        retenir: ['Basse température et temps court : contrôle cinétique, le produit formé le plus vite domine. Température plus élevée et temps long : contrôle thermodynamique, le produit le plus stable domine.'],
      };
    },
  },

  // ── C4 : composition à l'équilibre (lecture qualitative du profil) ──
  {
    id: 'cinet-equilibre', domaine: DOM, niveau: 2, titre: 'Prévoir qualitativement la composition à l\'équilibre',
    construire: () => {
      const d = tire([4, 7, 12]), P12 = -60, P14 = P12 - d;
      return {
        enonce: `Sous contrôle thermodynamique, les deux produits s'interconvertissent via le carbocation et le mélange atteint l'équilibre. Le produit 1,2 est à ${P12} kJ·mol⁻¹ et le produit 1,4 à ${P14} kJ·mol⁻¹ (réactifs = 0).`,
        etapes: [
          { id: 'maj', titre: 'Le produit majoritaire', q: 'Quel produit est majoritaire à l\'équilibre ?',
            aide: 'À l\'équilibre, le produit le plus stable domine.',
            o: [V('Le produit 1,4', `Son énergie (${P14} kJ·mol⁻¹) est inférieure à celle du produit 1,2 (${P12} kJ·mol⁻¹) : c'est le plus stable.`),
              F('Le produit 1,2', `Il est moins stable (${P12} kJ·mol⁻¹) que le produit 1,4 (${P14} kJ·mol⁻¹).`),
              F('Les deux en quantités égales', 'Leurs énergies sont différentes : l\'équilibre favorise le plus stable.')] },
          { id: 'ecart', titre: 'L\'effet de l\'écart d\'énergie', q: `L'écart d'énergie entre les deux produits est de ${d} kJ·mol⁻¹. Si cet écart était plus grand, la proportion de produit 1,4 à l'équilibre serait …`,
            aide: 'Plus un produit est stable par rapport à l\'autre, plus il domine.',
            o: [V('plus élevée : le mélange serait plus sélectif', 'Un écart d\'énergie plus grand favorise davantage le produit le plus stable.'),
              F('plus faible', 'Un plus grand écart de stabilité accentue la domination du produit le plus stable.'),
              F('inchangée', 'La composition à l\'équilibre dépend de l\'écart d\'énergie.')] },
          { id: 'T', titre: 'L\'effet de la température', q: 'Si la température augmente, comment évolue la sélectivité à l\'équilibre (rapport des deux produits) ?',
            aide: 'L\'agitation thermique rend les deux produits plus comparables.',
            o: [V('Elle diminue légèrement : le mélange devient moins sélectif', 'À température plus élevée, l\'énergie thermique compense mieux l\'écart d\'énergie : les deux produits se rapprochent en proportion.'),
              F('Elle augmente nettement', 'Une température plus élevée ne rend pas l\'équilibre plus sélectif.'),
              F('Elle ne change pas', 'La composition à l\'équilibre dépend de la température.')] },
        ],
        retenir: ['À l\'équilibre, le produit le plus stable domine d\'autant plus que l\'écart d\'énergie est grand ; une température plus élevée rend le mélange un peu moins sélectif.'],
      };
    },
  },

  // ── C5 : réversibilité et barrière inverse (lecture qualitative du profil) ──
  {
    id: 'cinet-arrhenius', domaine: DOM, niveau: 2, titre: 'Le produit cinétique se retransforme-t-il ? (barrière inverse)',
    construire: () => {
      const froid = Math.random() < 0.5, inv12 = E.ET2a - E.P12, inv14 = E.ET2b - E.P14;
      return {
        enonce: `Pour revenir au carbocation, le produit 1,2 doit franchir une barrière inverse de ${inv12} kJ·mol⁻¹, et le produit 1,4 une barrière de ${inv14} kJ·mol⁻¹. On travaille ${froid ? 'à basse température (0 °C), sur une durée courte' : 'à température plus élevée (40 °C), sur plusieurs heures'}.`,
        etapes: [
          { id: 'qui', titre: 'Le premier à se retransformer', q: 'Quel produit se retransforme le plus facilement en carbocation ?',
            aide: 'La barrière inverse la plus faible est franchie le plus facilement.',
            o: [V('Le produit 1,2', `Sa barrière inverse (${inv12} kJ·mol⁻¹) est inférieure à celle du produit 1,4 (${inv14} kJ·mol⁻¹).`),
              F('Le produit 1,4', `Sa barrière inverse (${inv14} kJ·mol⁻¹) est plus haute : il est plus stable et se retransforme moins.`),
              F('Les deux de la même façon', 'Les deux barrières inverses sont différentes.')] },
          { id: 'rev', titre: 'La réversibilité', q: 'Dans ces conditions, la formation du produit 1,2 est-elle réversible ?',
            aide: 'À basse température et sur un temps court, peu de molécules franchissent une barrière haute.',
            o: [V(froid ? 'Non : la barrière inverse est trop haute pour cette température et cette durée' : 'Oui : la température et la durée permettent de franchir la barrière inverse', froid ? 'Peu de molécules franchissent environ 90 kJ·mol⁻¹ à basse température et en peu de temps : le produit cinétique reste.' : 'À 40 °C et sur plusieurs heures, le retour est possible : les produits s\'interconvertissent.'),
              F(froid ? 'Oui : la barrière inverse est franchie sans difficulté' : 'Non : la barrière inverse est trop haute', froid ? 'À basse température, le retour est négligeable.' : 'À cette température et sur ce temps, le retour a lieu.'),
              F('On ne peut pas conclure sans connaître le solvant', 'Le profil, la température et la durée suffisent pour conclure qualitativement.')] },
          { id: 'ctrl', titre: 'Le contrôle', q: 'Quel contrôle s\'applique ?',
            aide: 'Irréversible : cinétique. Réversible : thermodynamique.',
            o: [V(froid ? 'Contrôle cinétique : le produit formé le plus vite (1,2) domine' : 'Contrôle thermodynamique : le produit le plus stable (1,4) domine', froid ? 'La réaction est irréversible : la composition reflète les vitesses de formation.' : 'La réaction est réversible : la composition reflète les stabilités.'),
              F(froid ? 'Contrôle thermodynamique' : 'Contrôle cinétique', froid ? 'Il n\'y a pas de retour : l\'équilibre n\'est pas atteint.' : 'Les produits se retransforment : on atteint l\'équilibre.'),
              F('Aucun contrôle ne s\'applique', 'Les conditions déterminent toujours le régime.')] },
        ],
        retenir: ['Un produit cinétique se retransforme si la température et la durée permettent de franchir sa barrière inverse ; alors le produit le plus stable finit par dominer.'],
      };
    },
  },
];
