// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EXERCICES « CONTRÔLE CINÉTIQUE ET THERMODYNAMIQUE » (BTS Métiers de la chimie)
//  Même format que AtelierSituationsBanque.js. Les valeurs du modèle (énergies, facteur A) viennent de cinetModele.js,
//  comme dans la simulation « Contrôle cinétique ou thermodynamique : addition de HBr sur le buta-1,3-diène ».
//  Compétences visées (chimie organique, diènes conjugués, sélectivité) :
//   • Écrire les produits d'addition 1,2 et 1,4 d'un diène conjugué (carbocation allylique, mésomérie)  → cinet-diene
//   • Exploiter un profil d'énergie à deux voies : barrières, barrière inverse, stabilité des produits   → cinet-profil
//   • Distinguer contrôle cinétique et contrôle thermodynamique selon les conditions                    → cinet-conditions
//   • Calculer la composition à l'équilibre : K = exp(ΔE / RT)                                          → cinet-equilibre
//   • Loi d'Arrhenius : constante de vitesse et demi-vie, réversibilité                                  → cinet-arrhenius
// ═══════════════════════════════════════════════════════════════════════════
import { E, A } from './cinetModele.js';

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const nb = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const DOM = 'Contrôle cinétique et thermodynamique (BTS)';
const R = 8.314;
const sci = x => { const e = Math.floor(Math.log10(x)); return `${nb(x / Math.pow(10, e), 2)} × 10${String(e).replace(/-/g, '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`; };

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

  // ── C4 : composition à l'équilibre ──
  {
    id: 'cinet-equilibre', domaine: DOM, niveau: 2, titre: 'Calculer la composition à l\'équilibre',
    construire: () => {
      const d = tire([4, 5, 6, 7, 8]), T = tire([293, 313, 333, 353]);
      const K = Math.exp(d * 1000 / (R * T)), p14 = 100 * K / (1 + K);
      return {
        enonce: `À l'équilibre (contrôle thermodynamique), le rapport des quantités des deux produits vaut [1,4] / [1,2] = exp[(E(1,2) − E(1,4)) / (R·T)]. Le produit 1,4 est plus stable que le produit 1,2 de ${d} kJ·mol⁻¹. La température est T = ${T} K ; R = 8,314 J·mol⁻¹·K⁻¹.`,
        etapes: [
          { id: 'K', titre: 'Le rapport à l\'équilibre', q: `Calculez [1,4] / [1,2] à ${T} K.`,
            aide: 'Convertissez ΔE en J·mol⁻¹ avant de diviser par R·T.',
            type: 'saisie', champs: [{ id: 'K', lib: '[1,4] / [1,2]', u: '', vrai: K, tol: 0.03 }],
            expl: `K = exp(${d} × 1000 / (8,314 × ${T})) = exp(${nb(d * 1000 / (R * T), 3)}) = ${nb(K, 1)}.` },
          { id: 'p', titre: 'Le pourcentage de produit 1,4', q: 'En déduire le pourcentage de produit 1,4 dans le mélange des deux produits.',
            aide: 'Si [1,4] / [1,2] = K, alors le produit 1,4 représente K / (1 + K) du mélange.',
            type: 'saisie', champs: [{ id: 'p', lib: 'Produit 1,4', u: '%', vrai: p14, tol: 0.015 }],
            expl: `%(1,4) = 100 × K / (1 + K) = 100 × ${nb(K, 1)} / ${nb(1 + K, 1)} = ${nb(p14, 1)} %.` },
          { id: 'T', titre: 'L\'effet de la température', q: 'Si la température augmente, comment évolue la proportion de produit 1,4 à l\'équilibre ?',
            aide: 'T est au dénominateur de l\'exposant : que devient le rapport quand T augmente ?',
            o: [V('Elle diminue légèrement : le mélange devient moins sélectif', 'ΔE / RT diminue quand T augmente : K se rapproche de 1, les deux produits deviennent plus comparables.'),
              F('Elle augmente : le mélange devient plus sélectif', 'Une température plus élevée réduit l\'écart de populations entre deux niveaux d\'énergie.'),
              F('Elle ne change pas', 'Le rapport dépend de T par exp(ΔE / RT).')] },
        ],
        retenir: ['À l\'équilibre, le rapport des deux produits suit la loi de Boltzmann : K = exp(ΔE / RT). Un petit écart d\'énergie (quelques kJ·mol⁻¹) suffit à favoriser nettement le plus stable.'],
      };
    },
  },

  // ── C5 : Arrhenius et réversibilité ──
  {
    id: 'cinet-arrhenius', domaine: DOM, niveau: 2, titre: 'Le produit cinétique se retransforme-t-il ? (loi d\'Arrhenius)',
    construire: () => {
      const T = tire([273, 293, 313, 333]), Ea = E.ET2a - E.P12;     // 90 kJ/mol : produit 1,2 → carbocation
      const k = A * Math.exp(-Ea * 1000 / (R * T)), t12 = Math.LN2 / k;     // demi-vie en s
      const th = t12 / 3600;
      const rev = t12 < 3600;
      return {
        enonce: `Le produit 1,2 peut se retransformer en carbocation en franchissant une barrière E_a = ${Ea} kJ·mol⁻¹. La constante de vitesse de ce retour vaut k = A·exp(−E_a / (R·T)), avec A = 1,0 × 10¹³ s⁻¹ et R = 8,314 J·mol⁻¹·K⁻¹. La température est T = ${T} K.`,
        etapes: [
          { id: 'k', titre: 'La constante de vitesse', q: `Calculez k à ${T} K (écrivez le nombre sans notation scientifique, par exemple 0,0012).`,
            aide: 'Convertissez E_a en J·mol⁻¹ : E_a = 90 000 J·mol⁻¹. L\'exponentielle donne un nombre très petit.',
            type: 'saisie', champs: [{ id: 'k', lib: 'k', u: 's⁻¹', vrai: k, tol: 0.06 }],
            expl: `k = 1,0 × 10¹³ × exp(−${Ea * 1000} / (8,314 × ${T})) = 1,0 × 10¹³ × exp(−${nb(Ea * 1000 / (R * T), 2)}) = ${sci(k)} s⁻¹.` },
          { id: 't', titre: 'La demi-vie', q: 'Pour une transformation d\'ordre 1, la demi-vie vaut t½ = ln 2 / k. Calculez t½ en heures.',
            aide: 't½ = 0,693 / k, en secondes ; puis divisez par 3 600 pour obtenir des heures.',
            type: 'saisie', champs: [{ id: 't', lib: 't½', u: 'h', vrai: th, tol: 0.06 }],
            expl: `t½ = 0,693 / ${sci(k)} = ${nb(t12, 1)} s = ${th < 0.01 ? sci(th) : nb(th, 3)} h.` },
          { id: 'c', titre: 'La conclusion', q: 'Pour une expérience de une heure à cette température, le produit 1,2 se retransforme-t-il de façon notable ?',
            aide: 'Comparez la demi-vie à la durée de l\'expérience (1 h).',
            o: [rev ? V('Oui : la demi-vie est très inférieure à 1 h, le retour est rapide (contrôle thermodynamique)', `t½ = ${nb(t12, 1)} s est très inférieure à 1 h : le produit 1,2 se retransforme en carbocation et l'équilibre s'établit.`) : F('Oui : la demi-vie est très inférieure à 1 h, le retour est rapide (contrôle thermodynamique)', `La demi-vie (${nb(th, 1)} h) n'est pas très inférieure à 1 h.`),
              !rev ? V('Non : la demi-vie dépasse 1 h, le retour est négligeable (contrôle cinétique)', `t½ = ${nb(th, 1)} h est supérieure à 1 h : le produit 1,2 reste en grande partie intact pendant l'expérience.`) : F('Non : la demi-vie dépasse 1 h, le retour est négligeable (contrôle cinétique)', `t½ = ${nb(t12, 1)} s est très courte devant 1 h : le retour a lieu.`),
              F('On ne peut pas conclure sans connaître le solvant', 'Dans ce modèle, k et t½ suffisent pour comparer au temps de l\'expérience.')] },
        ],
        retenir: ['Un produit cinétique se retransforme si sa demi-vie de retour est courte devant la durée de la réaction. La loi d\'Arrhenius montre que cette demi-vie chute très vite quand la température augmente.'],
      };
    },
  },
];
