// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EXERCICES « SUBSTITUTION OU ÉLIMINATION » (BTS Métiers de la chimie)
//  Même format que AtelierSituationsBanque.js. Valeurs issues de snModele.js (ordres de grandeur annoncés).
//  Compétences visées (mécanismes en chimie organique) :
//   • Prévoir le mécanisme dominant selon la classe du substrat et la nature du réactif   → sn-meca
//   • Relier mécanisme, nombre d'étapes et loi de vitesse (ordre 1 ou 2)                  → sn-ordre
//   • Prévoir la stéréochimie du produit (inversion ou racémique)                         → sn-stereo
//   • Choisir les conditions pour obtenir l'alcène ou le produit de substitution          → sn-conditions
//   • Lire un profil d'énergie (état de transition, intermédiaire, barrière)              → sn-profil
// ═══════════════════════════════════════════════════════════════════════════
import { SUBSTRATS, REACTIFS, MECA, proportions, barriere, profil } from './snModele.js';

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Substitution ou élimination (BTS)';
const COMBOS = [];
for (const s of Object.keys(SUBSTRATS)) for (const r of Object.keys(REACTIFS)) for (const c of [false, true]) if (proportions(s, r, c).reaction) COMBOS.push([s, r, c]);
const POURQUOI = { SN2: 'substrat peu encombré et bon nucléophile : attaque par l\'arrière, en une étape',
  E2: 'base forte (ou encombrée) qui arrache un H en une étape, ou substrat trop encombré pour la SN2',
  SN1: 'carbocation stable formé dans l\'étape lente, puis attaque du solvant nucléophile, sans base forte',
  E1: 'carbocation stable formé dans l\'étape lente, puis perte de H⁺ vers le solvant' };

export const EXERCICES = [
  // ── S1 : le mécanisme dominant ──
  {
    id: 'sn-meca', domaine: DOM, niveau: 2, titre: 'Prévoir le mécanisme dominant',
    construire: () => {
      const [s, r, c] = tire(COMBOS), q = proportions(s, r, c), S = SUBSTRATS[s], R = REACTIFS[r], dom = q.dominant;
      const autres = ['SN1', 'SN2', 'E1', 'E2'].filter(m => m !== dom);
      return {
        enonce: `Le ${S.nom} (halogénoalcane ${S.classe}) réagit avec ${R.nom} à ${c ? '80' : '25'} °C. ${R.court} est ${R.description}.`,
        etapes: [
          { id: 'cat', titre: 'Substitution ou élimination ?', q: 'Quelle transformation est majoritaire ?',
            aide: 'Substitution : on forme l\'alcool. Élimination : on forme l\'alcène.',
            o: [V(dom.startsWith('S') ? 'La substitution (alcool)' : 'L\'élimination (alcène)', `${R.court} avec un substrat ${S.classe} : ${POURQUOI[dom]}.`),
              F(dom.startsWith('S') ? 'L\'élimination (alcène)' : 'La substitution (alcool)', `Dans ces conditions, c'est l'autre transformation qui domine (${POURQUOI[dom]}).`),
              F('Aucune réaction', 'La réaction a lieu : le substrat réagit dans ces conditions.')] },
          { id: 'meca', titre: 'Le mécanisme', q: 'Quel est le mécanisme dominant ?',
            aide: 'Tertiaire : pas de SN2. Base forte : mécanisme bimoléculaire. Sans base forte : carbocation.',
            o: [V(`${dom} (${MECA[dom].long})`, `${dom} : ${POURQUOI[dom]}.`),
              F(`${autres[0]} (${MECA[autres[0]].long})`, `Ce n'est pas le mécanisme dominant : ${POURQUOI[dom]}.`),
              F(`${autres[1]} (${MECA[autres[1]].long})`, `Ce n'est pas le mécanisme dominant : ${POURQUOI[dom]}.`)] },
          { id: 'pct', titre: 'La proportion', q: 'Quel pourcentage environ de produit majoritaire attend-on (ordre de grandeur) ?',
            aide: 'Utilise la simulation « Substitution ou élimination » pour reproduire la situation.',
            type: 'saisie', champs: [{ id: 'pct', lib: 'Produit majoritaire', u: '%', vrai: Math.max(q.substitution, q.elimination), tol: 0.1 }],
            expl: `Ordre de grandeur : environ ${Math.max(q.substitution, q.elimination)} % de ${dom.startsWith('S') ? 'produit de substitution' : 'produit d\'élimination'} (valeur arrondie à 5 %).` },
        ],
        retenir: ['Primaire : SN2 (ou E2 avec une base encombrée). Tertiaire : pas de SN2 ; E2 avec une base forte, SN1/E1 sans base. Chauffer favorise l\'élimination.'],
      };
    },
  },

  // ── S2 : mécanisme, étapes, ordre ──
  {
    id: 'sn-ordre', domaine: DOM, niveau: 2, titre: 'Mécanisme, nombre d\'étapes et loi de vitesse',
    construire: () => {
      const m = tire(['SN1', 'SN2', 'E1', 'E2']), M = MECA[m], un = M.etapes === 1;
      const facteur = tire([2, 3, 4]);
      const attendu = M.ordre === 2 ? facteur : 1;
      return {
        enonce: `Une réaction d'un halogénoalcane RBr suit un mécanisme ${m} (${M.long}).`,
        etapes: [
          { id: 'et', titre: 'Le nombre d\'étapes', q: `Combien d'étapes élémentaires comporte le mécanisme ${m} ?`,
            aide: 'SN2 et E2 : état de transition unique. SN1 et E1 : intermédiaire (carbocation).',
            o: [V(un ? 'Une seule étape, avec un seul état de transition' : 'Deux étapes, avec un carbocation intermédiaire', un ? `${m} se déroule en une étape : le nucléophile ou la base attaque pendant que Br⁻ part.` : `${m} commence par la rupture de C–Br, qui donne le carbocation, puis une étape rapide.`),
              F(un ? 'Deux étapes, avec un carbocation intermédiaire' : 'Une seule étape, avec un seul état de transition', un ? 'Il n\'y a pas de carbocation dans ce mécanisme concerté.' : 'Ce mécanisme passe par un carbocation : il y a deux étapes.'),
              F('Trois étapes ou plus', 'Les mécanismes SN1, SN2, E1 et E2 comptent une ou deux étapes.')] },
          { id: 'ordre', titre: 'L\'ordre global', q: `Quel est l'ordre global de la loi de vitesse pour ${m} ?`,
            aide: 'La vitesse est celle de l\'étape lente (ou de l\'étape unique).',
            o: [V(`Ordre ${M.ordre} : ${M.loi}`, M.ordre === 2 ? 'Le substrat et le réactif (nucléophile ou base) interviennent dans l\'état de transition unique.' : 'L\'étape lente (rupture de C–Br) ne fait intervenir que le substrat.'),
              F(`Ordre ${3 - M.ordre}`, M.ordre === 2 ? 'Les deux réactifs participent à l\'étape unique : l\'ordre est 2.' : 'Le réactif n\'intervient qu\'après l\'étape lente : l\'ordre est 1.'),
              F('Ordre 0', 'La vitesse dépend de la concentration du substrat : l\'ordre n\'est pas nul.')] },
          { id: 'x', titre: 'Un changement de concentration', q: `On multiplie la concentration du réactif (nucléophile ou base) par ${facteur}, celle du substrat restant inchangée. Par quel facteur la vitesse est-elle multipliée ?`,
            aide: M.ordre === 2 ? 'v = k·[RBr]·[réactif] : la vitesse est proportionnelle à la concentration du réactif.' : 'v = k·[RBr] : la concentration du réactif n\'intervient pas.',
            type: 'saisie', champs: [{ id: 'x', lib: 'Facteur de variation de la vitesse', u: '', vrai: attendu, tol: 0.02 }],
            expl: M.ordre === 2 ? `v = k·[RBr]·[B] : multiplier [B] par ${facteur} multiplie v par ${facteur}.` : `v = k·[RBr] : [B] n'apparaît pas, la vitesse est inchangée (facteur 1).` },
        ],
        retenir: ['SN2 et E2 : une étape, ordre global 2 (v = k·[RBr]·[Nu]). SN1 et E1 : deux étapes, ordre 1 (v = k·[RBr]) car l\'étape lente ne fait intervenir que le substrat.'],
      };
    },
  },

  // ── S3 : stéréochimie ──
  {
    id: 'sn-stereo', domaine: DOM, niveau: 2, titre: 'Stéréochimie du produit : inversion ou racémique ?',
    construire: () => {
      const m = tire(['SN1', 'SN2']), conf = tire(['(R)', '(S)']), inv = conf === '(R)' ? '(S)' : '(R)';
      const sn1 = m === 'SN1';
      const cond = sn1 ? 'dans l\'eau et l\'éthanol, sans base ajoutée, ce qui favorise le carbocation' : 'par HO⁻ à température modérée avec un nucléophile fort, ce qui favorise une attaque en une étape';
      return {
        enonce: `On part du ${conf}-2-bromobutane, énantiomère pur. Il subit une substitution ${m} ${cond}. Le carbone lié à Br est le seul carbone asymétrique.`,
        etapes: [
          { id: 'geo', titre: 'L\'attaque du nucléophile', q: `Dans la ${m}, comment le nucléophile attaque-t-il le carbone ?`,
            aide: sn1 ? 'Le carbocation est plan.' : 'Le nucléophile approche du côté opposé à Br.',
            o: [V(sn1 ? 'Sur le carbocation plan, par l\'une ou l\'autre face' : 'Par l\'arrière, du côté opposé à Br', sn1 ? 'Le carbocation est plan : les deux faces sont équivalentes.' : 'En SN2, l\'attaque se fait par l\'arrière : l\'état de transition a Nu et Br alignés avec C.'),
              F(sn1 ? 'Par l\'arrière uniquement' : 'Sur un carbocation plan, par les deux faces', sn1 ? 'Il n\'y a pas de contrainte d\'attaque : le carbocation est plan.' : 'La SN2 n\'a pas de carbocation intermédiaire.'),
              F('Du même côté que Br', 'Le nucléophile se heurte au groupe partant : l\'attaque se fait par l\'arrière.')] },
          { id: 'prod', titre: 'Le produit', q: 'Quel est le produit (butan-2-ol) ?',
            aide: sn1 ? 'Deux faces d\'attaque possibles, de probabilité égale.' : 'L\'attaque par l\'arrière inverse la configuration (inversion de Walden).',
            o: [V(sn1 ? 'Un mélange racémique : 50 % de (R) et 50 % de (S)' : `Le ${inv}-butan-2-ol pur (inversion)`, sn1 ? 'Les deux faces du carbocation sont attaquées avec la même probabilité : racémique, sans activité optique.' : 'La SN2 se fait avec inversion de configuration.'),
              F(sn1 ? `Le ${inv}-butan-2-ol pur (inversion)` : 'Un mélange racémique', sn1 ? 'Une inversion pure demande une attaque par l\'arrière uniquement, ce qui ne se produit pas en SN1.' : 'Une attaque sur une seule face conduit à un seul énantiomère, pas à un racémique.'),
              F(`Le ${conf}-butan-2-ol pur (rétention)`, 'Ni la SN1 ni la SN2 ne conduisent à la rétention pure.')] },
          { id: 'ee', titre: 'L\'excès énantiomérique', q: 'Quel est l\'excès énantiomérique du produit ?',
            aide: 'ee = |%R − %S|. Un racémique : 50 % / 50 %. Un énantiomère pur : 100 % / 0 %.',
            type: 'saisie', champs: [{ id: 'ee', lib: 'ee', u: '%', vrai: sn1 ? 0 : 100, tol: 0.02 }],
            expl: sn1 ? 'ee = |50 − 50| = 0 % : le racémique n\'a pas de pouvoir rotatoire.' : 'ee = |0 − 100| = 100 % : le produit est un énantiomère pur.' },
        ],
        retenir: ['SN2 : attaque par l\'arrière, inversion de configuration. SN1 : carbocation plan, attaque sur les deux faces, mélange racémique.'],
      };
    },
  },

  // ── S4 : choisir les conditions ──
  {
    id: 'sn-conditions', domaine: DOM, niveau: 2, titre: 'Choisir les conditions pour obtenir l\'alcène ou le produit de substitution',
    construire: () => {
      const veutAlcene = Math.random() < 0.5, s = veutAlcene ? tire(['prim', 'sec']) : 'prim', S = SUBSTRATS[s];
      const bon = veutAlcene ? 'tBuO⁻ dans le tert-butanol, à 80 °C' : 'HO⁻ dans l\'éthanol, à 25 °C';
      const qBon = proportions(s, veutAlcene ? 'tBuO' : 'HO', veutAlcene);
      const mauvais1 = veutAlcene ? 'HO⁻ dans l\'éthanol, à 25 °C' : 'tBuO⁻ dans le tert-butanol, à 80 °C';
      return {
        enonce: `On dispose de ${S.nom} (halogénoalcane ${S.classe}). On souhaite obtenir ${veutAlcene ? 'l\'alcène (élimination)' : 'l\'alcool (substitution)'} le plus sélectivement possible.`,
        etapes: [
          { id: 'ch', titre: 'Le choix du réactif', q: 'Quelles conditions choisir ?',
            aide: veutAlcene ? 'Une base encombrée attaque un H plutôt qu\'un carbone ; la chaleur favorise l\'élimination.' : 'Un bon nucléophile attaque le carbone ; une température modérée limite l\'élimination.',
            o: [V(bon, veutAlcene ? 'Base forte et encombrée, température élevée : E2 très majoritaire.' : 'Bon nucléophile, température modérée : substitution favorisée (surtout avec un substrat primaire).'),
              F(mauvais1, veutAlcene ? 'HO⁻ est aussi un bon nucléophile : la substitution reste importante, surtout à basse température.' : 'tBuO⁻ est trop encombré : il arrache un H et forme surtout l\'alcène.'),
              F('Eau pure, à 25 °C', 'Sans base ni nucléophile fort, un substrat ' + S.classe + ' ne réagit pratiquement pas ou lentement.')] },
          { id: 'why', titre: 'L\'argument', q: veutAlcene ? 'Pourquoi chauffer favorise-t-il l\'élimination ?' : 'Pourquoi ne faut-il pas trop chauffer ?',
            aide: 'L\'élimination forme plus de molécules : le désordre augmente.',
            o: [V('L\'élimination s\'accompagne d\'une augmentation d\'entropie (ΔS > 0), donc −TΔS la favorise à haute température', 'ΔG = ΔH − TΔS : le terme −TΔS devient plus négatif quand T augmente, ce qui favorise l\'élimination.'),
              F('Parce que l\'élimination est exothermique', 'Ce n\'est pas l\'enthalpie qui explique l\'effet de la température ici, mais l\'entropie.'),
              F('Parce que la température change la polarité de C–Br', 'La polarité de la liaison ne dépend pas de la température de façon utile ici.')] },
          { id: 'p', titre: 'La sélectivité attendue', q: 'Quel pourcentage environ du produit visé peut-on espérer (ordre de grandeur) ?',
            aide: 'Utilise la simulation « Substitution ou élimination » pour lire la proportion.',
            type: 'saisie', champs: [{ id: 'p', lib: 'Produit visé', u: '%', vrai: veutAlcene ? qBon.elimination : qBon.substitution, tol: 0.1 }],
            expl: `Ordre de grandeur : environ ${veutAlcene ? qBon.elimination : qBon.substitution} % (valeur arrondie à 5 %).` },
        ],
        retenir: ['Pour favoriser l\'élimination : base forte et encombrée, température élevée. Pour favoriser la substitution : bon nucléophile peu basique, température modérée, substrat peu encombré.'],
      };
    },
  },

  // ── S5 : lire un profil ──
  {
    id: 'sn-profil', domaine: DOM, niveau: 2, titre: 'Lire un profil d\'énergie : SN2 ou SN1 ?',
    construire: () => {
      const m = tire(['SN2', 'SN1']), s = m === 'SN2' ? tire(['prim', 'sec']) : tire(['sec', 'tert']), re = m === 'SN2' ? 'HO' : 'H2O';
      const P = profil(m, s, re).pts, sn2 = m === 'SN2';
      const Ea = barriere(m, s, re);
      const noms = P.map(x => `${x[0]} ${x[1]} kJ·mol⁻¹`).join(' ; ');
      return {
        enonce: `Le profil d'énergie d'une réaction d'un halogénoalcane présente les points suivants : ${noms}. (Les énergies sont données par rapport aux réactifs, en ordre de grandeur.)`,
        etapes: [
          { id: 'et', titre: 'Les étapes', q: 'Combien d\'étapes élémentaires ce profil présente-t-il ?',
            aide: 'Comptez les états de transition (maxima) du profil.',
            o: [V(sn2 ? 'Une étape : un seul état de transition' : 'Deux étapes : deux états de transition et un intermédiaire', sn2 ? 'Un seul maximum : réaction concertée.' : 'Deux maxima séparés par un minimum (le carbocation).'),
              F(sn2 ? 'Deux étapes' : 'Une étape', sn2 ? 'Le profil ne présente qu\'un seul maximum.' : 'Le profil présente deux maxima et un intermédiaire.'),
              F('Trois étapes', 'Le profil ne présente pas trois maxima.')] },
          { id: 'ea', titre: 'L\'énergie d\'activation', q: sn2 ? 'Quelle est l\'énergie d\'activation de la réaction ?' : 'Quelle est l\'énergie d\'activation de l\'étape 1 (la plus lente) ?',
            aide: sn2 ? 'Énergie de l\'état de transition moins celle des réactifs.' : 'Énergie de ET₁ moins celle des réactifs.',
            type: 'saisie', champs: [{ id: 'ea', lib: 'E_a', u: 'kJ·mol⁻¹', vrai: Ea, tol: 0.02 }],
            expl: `E_a = ${P[1][1]} − 0 = ${Ea} kJ·mol⁻¹.` },
          { id: 'mec', titre: 'Le mécanisme', q: 'Quel mécanisme ce profil représente-t-il ?',
            aide: sn2 ? 'Une seule étape avec un nucléophile fort : SN2.' : 'Un carbocation intermédiaire et un nucléophile faible : SN1.',
            o: [V(sn2 ? 'SN2 (un seul état de transition, pas de carbocation)' : 'SN1 (carbocation intermédiaire)', sn2 ? 'Pas d\'intermédiaire : état de transition unique, loi de vitesse d\'ordre 2.' : 'Un intermédiaire à deux barrières : substitution monomoléculaire en deux étapes.'),
              F(sn2 ? 'SN1' : 'SN2', sn2 ? 'La SN1 passe par un carbocation, qui n\'apparaît pas sur ce profil.' : 'La SN2 n\'a pas de minimum intermédiaire.'),
              F('Aucun : ce n\'est pas une substitution', 'Le profil correspond à un mécanisme de substitution nucléophile.')] },
        ],
        retenir: ['Un seul maximum : SN2 ou E2 (une étape). Deux maxima séparés par un minimum : SN1 ou E1 (carbocation intermédiaire). La barrière d\'activation se lit entre les réactifs et le sommet.'],
      };
    },
  },
];
