
// ═══════════════════════════════════════════════════════════════════════════
//  SIMULATION « OPTIMISER UNE SYNTHÈSE » (Terminale STL — SPCL, thème
//  « Chimie et développement durable », partie « Synthèses chimiques »)
//  Fichier cible : src/simulations/OptimiserSynthese.jsx
//  Composant : SimulationOptimiserSynthese
//
//  Sujet : la synthèse du butanoate d'éthyle (arôme d'ananas) pour une usine
//  d'arômes alimentaires. Réaction lente, limitée par l'équilibre : le
//  modèle unique dx/dt = k·(x_eq − x)/x_eq relie cinétique (k) et rendement
//  (x_eq), ce qui est LE message du chapitre : accélérer (k) et optimiser
//  (x_eq) ne relèvent pas des mêmes leviers. Le catalyseur joue sur k mais
//  PAS sur x_eq (piège pédagogique central).
//
//  ⚠️ INTÉGRATION (à la charge de Claude) :
//   • SIM_ID libre (90 semble disponible : vérifier), App.jsx, chapitres.js
//     (chapitre TSTL « Synthèses chimiques » à créer ou rattacher au chapitre
//     existant adéquat — vérifier src/chapitres.js), descriptions.js,
//     titre unique (audit SEO).
//   • Test : MachinesThermiques-style, le modèle pur est exporté en bas
//     (kApparent, xEquilibre, tempsDemi, courbeAvancement, rendementGlobal,
//     coutProtocole, scoreVert). Tester en particulier : xEquilibre(1) = 2/3,
//     tempsDemi(0.023) = ln(2)/k ≈ 30,1 min, rendementGlobal([0.92,0.85,0.88])
//     ≈ 68,8 %.
//   • Les données chiffrées sont fictives mais plausibles (didactiques) ;
//     hypothèses affichées dans le panneau du même nom.
//
//  Sources d'inspiration : fiches de la collection CDD terminale (chap. 5),
//  utilisées pour la couverture pédagogique UNIQUEMENT. Contextes, réactions
//  et valeurs entièrement réinventés : rien de reconnaissable, rien de mot
//  pour mot. Capacités du BO citées mot pour mot dans les étapes.
// ═══════════════════════════════════════════════════════════════════════════

import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ORANGE_GUIDE, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";

const SIM_ID = 90;
declarerDefis(SIM_ID, [['principal', 'Optimiser une synthèse']]);

// ── Modèle pur (testable, aucune dépendance à React) ───────────────────────
// Réaction support (fictive mais réaliste) : acide butanoïque + éthanol ⇌
// butanoate d'éthyle + eau. Acide initialement seul considéré (1 mol pour 1 L
// de mélange, base de tous les calculs), alcool en rapport molaire r.

export const K_EQ = 4;                     // constante d'équilibre de l'estérification (hypothèse didactique)
export const K0 = 0.023;                   // /min, à 40 °C, sans catalyseur, facteur de concentration 1
export const FACTEUR_10DEG = 2;            // la vitesse double tous les 10 °C (hypothèse affichée)
export const FACTEUR_CATALYSEUR = 4;
export const FACTEUR_ANHYDRIDE = 20;       // dérivé plus réactif : réaction quasi totale et bien plus rapide
export const HORIZON = 120;                // durée d'un « batch » (min) : fenêtre d'observation

// k apparent (/min) : température (°C), catalyseur, facteur de concentration,
// réactif ('acide' ou 'anhydride').
export function kApparent({ t, catalyseur, fconc, reactif }) {
  let k = K0 * Math.pow(FACTEUR_10DEG, (t - 40) / 10);
  if (catalyseur) k *= FACTEUR_CATALYSEUR;
  k *= Math.max(0.5, Math.min(2, fconc));
  if (reactif === "anhydride") k *= FACTEUR_ANHYDRIDE;
  return k;
}

// Avancement à l'équilibre (rendement maximal si on attendait indéfiniment).
// acide + alcool (rapport r) : K = x²/((1−x)(r−x)) donne x_eq ;
// anhydride : réaction quasi totale ; eau éliminée au fur et à mesure :
// l'équilibre est déplacé, rendement quasi total (hypothèse affichée).
export function xEquilibre({ rapport, reactif, eauEliminee }) {
  if (reactif === "anhydride") return 0.98;
  const r = Math.max(1, Math.min(5, rapport));
  const x = (2 / 3) * ((1 + r) - Math.sqrt(r * r - r + 1));
  return eauEliminee ? Math.min(0.97, x + 0.30) : x;
}

// Temps de demi-réaction (min) : temps pour atteindre x_eq/2. Avec
// x(t) = x_eq(1 − e^(−k·t)), c'est ln(2)/k, indépendant de x_eq :
// cinétique et rendement sont déconnectés (message clé du chapitre).
export function tempsDemi(k) { return Math.log(2) / k; }

// Courbe d'avancement : solution exacte, échantillonnée pour l'affichage.
export function courbeAvancement(k, xeq, duree = HORIZON, n = 160) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (duree * i) / n;
    pts.push([t, xeq * (1 - Math.exp(-k * t))]);
  }
  return pts;
}

// Rendement global d'une synthèse en plusieurs étapes (produit des rendements).
export function rendementGlobal(rendements) {
  return rendements.reduce((a, b) => a * b, 1);
}

// Coût du protocole (€ fictifs par mol d'acide mise en jeu) et score chimie
// verte (0-100) : hypothèses simplifiées affichées, destinées à la
// comparaison qualitative des protocoles (capacité : « Comparer des
// protocoles de synthèse et choisir le plus performant en termes de
// rendement, de coût et de respect de l'environnement »).
export function coutProtocole({ t, catalyseur, rapport, reactif, eauEliminee }) {
  let c = 1.0;
  c += 0.15 * (rapport - 1);                       // excès d'alcool (le moins cher des deux)
  if (catalyseur) c += 0.10;                       // catalyseur acide
  c += 0.010 * Math.max(0, t - 20);                 // chauffage
  if (eauEliminee) c += 0.30;                      // montage de déshydratation
  if (reactif === "anhydride") c += 1.40;          // dérivé plus réactif, plus cher
  return Math.round(c * 100) / 100;
}
export function scoreVert({ t, rapport, reactif, eauEliminee }) {
  let s = 100;
  s -= 0.5 * Math.max(0, t - 20);                  // consommation énergétique du chauffage
  s -= 4 * (rapport - 1);                          // excès = séparation + traitement en aval
  if (reactif === "anhydride") s -= 15;            // réactif plus coûteux, sous-produit acide
  if (eauEliminee) s -= 5;                         // solvant entraîneur supplémentaire
  return Math.round(Math.max(0, s));
}

// Bilan complet d'un protocole (affichage exploration + défi).
export function bilanProtocole(p) {
  const k = kApparent(p);
  const xeq = xEquilibre(p);
  const pts = courbeAvancement(k, xeq);
  const xf = pts[pts.length - 1][1];
  return { k, xeq, t12: tempsDemi(k), xf, rendement: xf, cout: coutProtocole(p), vert: scoreVert(p) };
}

// ── Contexte (fictif) affiché à l'élève ─────────────────────────────────────
const CONTEXTE =
  "Une usine d'arômes alimentaires produit le butanoate d'éthyle, l'ester qui donne " +
  "son arôme à l'ananas de certaines confiseries. La synthèse se fait à partir " +
  "d'acide butanoïque et d'éthanol : la réaction est lente et, pire, elle " +
  "s'arrête avant d'être totale. Le service production vous missionne : " +
  "fabriquer plus, plus vite, sans ruiner le budget ni la planète.";

// ── Hypothèses de travail ──────────────────────────────────────────────────
const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
    <li><strong>Modèle d'ordre 1</strong> : la loi d'évolution de l'avancement est fournie, x(t) = x<sub>éq</sub>(1 − e<sup>−k·t</sup>) ; l'influence de la dilution est simplifiée (facteur multiplicatif sur k).</li>
    <li><strong>Température</strong> : la vitesse double tous les 10 °C dans la plage étudiée (règle simplifiée d'Arrhenius).</li>
    <li><strong>Équilibre</strong> : constante K = 4 (hypothèse didactique classique pour une estérification) ; l'élimination de l'eau et l'anhydride donnent des rendements « quasi totaux » (0,97 et 0,98).</li>
    <li><strong>Coût et chimie verte</strong> : unités fictives, destinées à comparer les protocoles entre eux, pas à un prix réel.</li>
    <li><strong>Données fictives plausibles</strong> : contextes et valeurs inventés pour la simulation, calibrés sur des ordres de grandeur réalistes.</li>
  </ul>
);

// ── Parcours guidé : 14 étapes ────────────────────────────────────────────
// G = protocole de référence du parcours (fixe, affiché dans l'énoncé).
const G = { t: 40, catalyseur: false, fconc: 1, rapport: 1, reactif: "acide", eauEliminee: false };

function etapesGuide() {
  const g = bilanProtocole(G);   // t½ = 30,1 min ; x_eq = 0,67 ; rendement à 120 min = 0,63
  return [
    { titre: "La mission", texte: <>La réaction d'estérification est <strong>lente</strong> et <strong>limitée par l'équilibre</strong> : à 40 °C, sans artifice, elle ne donne jamais plus de {fmt(g.xeq * 100, 0)} % d'ester en un temps raisonnable. Le service production veut mieux. </>,
      tache: { type: 'qcm', q: 'Que cherche-t-on à améliorer en priorité pour une synthèse industrielle ?', consigne: 'Choisissez la réponse la plus complète.',
        options: ['La vitesse de la réaction uniquement', 'Le rendement de la synthèse uniquement', 'À la fois la vitesse, le rendement, le coût et l\'impact environnemental'],
        bonne: 2, indice: 'La chimie industrielle n\'a jamais un seul objectif : le meilleur protocole est un compromis (rendement, durée, coût, environnement).',
        expl: <>Fabriquer <em>vite</em>, <em>beaucoup</em>, <em>proprement</em> et <em>pas cher</em> : ces quatre objectifs ne s'obtiennent pas toujours avec les mêmes réglages. C'est tout l'enjeu du chapitre.</> } },

    { titre: "Suivre une transformation dans le temps", texte: <>Pour piloter la synthèse, on suit l'avancement x(t) : la quantité d'ester formé. La <strong>vitesse</strong> est la pente de cette courbe. Réinvestissement de Première : vitesse volumique et temps de demi-réaction.</>,
      tache: { type: 'qcm', q: 'Sur la courbe x(t), comment évolue la vitesse de la réaction au cours du temps ?',
        options: ['Elle augmente : la réaction s\'emballe', 'Elle diminue : les réactifs se consument et se font plus rares', 'Elle reste constante : la réaction avance toujours au même rythme'],
        bonne: 1, indice: 'Regardez la pente de la courbe en début, milieu et fin de réaction.',
        expl: <>La courbe démarre fort puis s'aplatit : la vitesse décroît au fur et à mesure que les réactifs sont consommés, jusqu'à s'annuler à l'équilibre.</> } },

    { titre: "Le temps de demi-réaction", texte: <>Le <strong>temps de demi-réaction</strong> t<sub>1/2</sub> est la durée nécessaire pour atteindre la moitié de l'avancement final. C'est l'indicateur de durée utilisé par les industriels pour planifier un « batch ».</>,
      tache: { type: 'num', q: `Protocole de référence : à 40 °C, sans catalyseur, la constante de vitesse vaut k = ${fmt(g.k, 3)} min⁻¹. Calculez le temps de demi-réaction t_1/2 = ln(2)/k (en minutes).`, unite: 'min', vrai: g.t12, tol: 0.02, cs: 2, detail: true,
        calcul: () => [`t_1/2 = ln(2)/k.`, `Application : t_1/2 = 0,693/${fmt(g.k, 3)} = ${fmt(g.t12, 1)} min.`],
        pieges: [[1 / g.k, 'Vous avez divisé par ln(2) au lieu de multiplier par ln(2) : pour un modèle d\'ordre 1, t_1/2 = ln(2)/k.']],
        indice: 'Avec k en min⁻¹, ln(2)/k est en minutes. Gardez deux chiffres significatifs.' } },

    { titre: "Facteur cinétique n° 1 : la température", texte: <>Premier levier : <strong>chauffer</strong>. Dans la plage étudiée, la règle simplifiée est : la vitesse double tous les 10 °C. En laboratoire, chauffer à reflux permet d'accélérer sans perdre de matière.</>,
      tache: { type: 'num', q: `On chauffe maintenant à 60 °C (au lieu de 40 °C), autres conditions identiques. Par quel facteur la constante de vitesse est-elle multipliée ?`, unite: '', vrai: 4, tol: 0.02, cs: 1, detail: true,
        calcul: () => [`Facteur = 2^(ΔT/10 °C) avec ΔT = 60 − 40 = 20 °C.`, `Facteur = 2² = 4.`],
        pieges: [[2, 'Vous avez compté un seul palier de 10 °C : de 40 à 60 °C, il y en a deux.']],
        indice: 'Combien de paliers de 10 °C séparent 40 °C de 60 °C ?' } },

    { titre: "Pourquoi ça marche : les chocs efficaces", texte: <>À l'échelle microscopique, une transformation résulte de <strong>chocs efficaces</strong> entre réactifs : suffisamment énergétiques et bien orientés. Chauffer augmente l'agitation, donc l'énergie des chocs. Passez à l'écran Exploration pour voir la vue microscopique.</>,
      tache: { type: 'qcm', q: 'Pourquoi une élévation de température accélère-t-elle la réaction ?',
        options: ['Les molécules deviennent plus nombreuses', 'Les chocs entre réactifs sont plus fréquents ET plus énergétiques', 'La constante d\'équilibre augmente beaucoup'],
        bonne: 1, indice: 'La température est une mesure de l\'agitation thermique : que devient le mouvement des entités ?',
        expl: <>Plus chaud = plus d'agitation = plus de chocs par seconde, et surtout des chocs qui dépassent plus souvent l'énergie d'activation. Attention : la température peut aussi déplacer l'équilibre, mais ici l'estérification est traitée athermique.</> } },

    { titre: "Facteur cinétique n° 2 : la concentration", texte: <>Deuxième levier : la <strong>concentration</strong> des réactifs. Plus les entités sont proches les unes des autres, plus les rencontres sont fréquentes.</>,
      tache: { type: 'qcm', q: 'On dilue le mélange réactionnel avec du solvant. Que devient la vitesse de réaction ?',
        options: ['Elle augmente : il y a plus de liquide', 'Elle diminue : les entités réactives sont moins nombreuses par litre, les chocs se raréfient', 'Elle ne change pas : la quantité de matière est la même'],
        bonne: 1, indice: 'La vitesse dépend du nombre de rencontres par unité de temps et de volume.',
        expl: <>Diluer écarte les réactifs : moins de chocs par litre et par seconde, réaction plus lente. À l'inverse, travailler concentré accélère (et diminue la quantité de solvant à traiter : bon point pour la chimie verte).</> } },

    { titre: "Facteur cinétique n° 3 : le catalyseur", texte: <>Troisième levier : le <strong>catalyseur</strong> (ici, un acide). Définition : une espèce qui accélère une réaction ; elle est consommée puis régénérée, sa quantité est la même au début et à la fin.</>,
      tache: { type: 'num', q: `Avec le catalyseur, k est multipliée par 4 : elle vaut maintenant ${fmt(4 * g.k, 3)} min⁻¹. Calculez le nouveau temps de demi-réaction (en minutes).`, unite: 'min', vrai: g.t12 / 4, tol: 0.02, cs: 2, detail: true,
        calcul: () => [`t_1/2 = ln(2)/k = 0,693/${fmt(4 * g.k, 3)}.`, `t_1/2 = ${fmt(g.t12 / 4, 1)} min : le catalyseur a divisé la durée par 4.`],
        pieges: [[g.t12 * 4, 'Vous avez multiplié au lieu de diviser : si k augmente, t_1/2 diminue.']],
        indice: 't_1/2 et k varient en sens inverse.' } },

    { titre: "Catalyse homogène ou hétérogène", texte: <>Le catalyseur peut être dans la même phase que les réactifs (catalyse <strong>homogène</strong>, ici l'acide dissous) ou dans une phase différente (catalyse <strong>hétérogène</strong>, par exemple une résine solide). C'est la définition exigible.</>,
      tache: { type: 'qcm', q: 'Un solide catalytique est plongé dans la solution réactionnelle. De quel type de catalyse s\'agit-il ?',
        options: ['Homogène : tout est mélangé dans le même récipient', 'Hétérogène : le catalyseur solide et les réactifs liquides sont dans des phases différentes', 'Ce n\'est pas une catalyse : un solide ne peut pas catalyser'],
        bonne: 1, indice: 'Le critère est la phase (état physique), pas le récipient.',
        expl: <>Catalyse hétérogène : le catalyseur solide agit à sa surface. Bonus industriel : on le récupère par simple filtration (réutilisable, moins de déchets).</> } },

    { titre: "L'énergie d'activation", texte: <>Sur le <strong>profil réactionnel</strong> (énergie potentielle du système en fonction de l'avancement), le réactif doit franchir un col : l'<strong>énergie d'activation</strong>. Plus ce col est haut, plus la réaction est lente. Les produits sont plus bas que les réactifs : K = 4 &gt; 1, l'équilibre est favorisé dans le sens direct, sans être total. Le catalyseur ouvre un chemin avec un col plus bas : c'est ainsi qu'il accélère, sans rien apporter à l'état final.</>,
      tache: { type: 'qcm', q: 'Que modifie un catalyseur sur le profil réactionnel ?',
        options: ['Il abaisse l\'énergie d\'activation, la difference d\'énergie entre réactifs et produits est inchangée', 'Il abaisse l\'énergie des produits : la réaction devient plus favorable', 'Il apporte de l\'énergie thermique au système'],
        bonne: 0, indice: 'Comparez les deux profils : le point de départ et le point d\'arrivée, puis la hauteur du col.',
        expl: <>Le catalyseur abaisse le col (énergie d'activation) : plus de chocs le franchissent, la réaction est plus rapide. Mais les états initial et final ne bougent pas : l'état d'équilibre, lui, ne change pas.</> } },

    { titre: "Le piège du chapitre", texte: <>Question redoutée en évaluation : le catalyseur accélère la réaction... mais change-t-il le rendement final ? Réfléchissez avant de répondre : que devient l'équilibre ?</>,
      tache: { type: 'qcm', q: 'On ajoute le catalyseur à la synthèse de référence. Que devient le rendement maximal (avancement à l\'équilibre) ?',
        options: ['Il augmente : la réaction va plus loin puisqu\'elle est plus rapide', 'Il ne change pas : le catalyseur agit sur la vitesse, pas sur l\'état d\'équilibre', 'Il diminue : le catalyseur est consommé par la réaction'],
        bonne: 1, indice: 'Le catalyseur est régénéré : il ne peut pas « consommer » du rendement. Sur le profil réactionnel, quels points n\'ont pas bougé ?',
        expl: <>LE piège du chapitre : le catalyseur fait gagner du <em>temps</em>, jamais du <em>rendement</em>. Accélérer (constante de vitesse k) et optimiser (avancement à l'équilibre) sont deux problèmes distincts, avec deux familles de leviers.</> } },

    { titre: "Le rendement d'une synthèse", texte: <>Le <strong>rendement</strong> compare ce qu'on obtient (n<sub>obtenu</sub>) à ce qu'on obtiendrait si la réaction était totale (n<sub>max</sub>) : R = n<sub>obtenu</sub>/n<sub>max</sub> × 100. </>,
      tache: { type: 'num', q: `Un essai fournit ${fmt(0.62, 2)} mol d'ester alors qu'on en espérait au maximum ${fmt(1.00, 2)} mol. Calculez le rendement (en %).`, unite: '%', vrai: 62, tol: 0.02, cs: 2, detail: true,
        calcul: () => [`R = n_obtenu/n_max × 100.`, `R = ${fmt(0.62, 2)}/${fmt(1.00, 2)} × 100 = ${fmt(62, 0)} %.`],
        pieges: [[100 / 0.62, 'Vous avez inversé le rapport : le rendement est obtenu/max, pas l\'inverse.']],
        indice: 'Le rendement est toujours inférieur ou égal à 100 %.' } },

    { titre: "Rendement d'une synthèse en plusieurs étapes", texte: <>Une synthèse industrielle enchaîne rarement une seule réaction. Les pertes se multiplient d'étape en étape : le rendement global est le <strong>produit</strong> des rendements de chaque étape.</>,
      tache: { type: 'num', q: `Une synthèse comporte trois étapes de rendements 92 %, 85 % et 88 %. Calculez le rendement global (en %).`, unite: '%', vrai: 68.8, tol: 0.02, cs: 2, detail: true,
        calcul: () => [`R_global = R₁ × R₂ × R₃ (les rendements en décimaux).`, `R_global = 0,92 × 0,85 × 0,88 = ${fmt(0.6878 * 100, 1)} %.`],
        pieges: [[88.3, 'Vous avez fait la moyenne des rendements : les pertes se multiplient, elles ne s\'additionnent pas.']],
        indice: 'Convertissez en décimaux et multipliez : 0,92 × 0,85 × 0,88.' } },

    { titre: "Pourquoi 67 % et pas 100 % ?", texte: <>L'estérification est <strong>renversable</strong> : à l'équilibre, il reste des réactifs. Ici, avec un mélange équimolaire, l'avancement à l'équilibre vaut x<sub>éq</sub> = 2/3, soit 67 % : le rendement plafonne. </>,
      tache: { type: 'num', q: `On utilise maintenant un excès d'éthanol : rapport molaire alcool/acide r = 5. L'avancement à l'équilibre devient x_eq = (2/3) × (6 − √21) ≈ ${fmt(0.945, 3)}. Quel rendement maximal (en %) peut-on espérer ?`, unite: '%', vrai: 94.5, tol: 0.02, cs: 2, detail: true,
        calcul: () => [`Avec un excès d'un réactif, l'équilibre est déplacé dans le sens direct.`, `R_max = x_eq × 100 = ${fmt(94.5, 1)} %.`],
        pieges: [[67, 'Vous avez répondu le rendement du mélange équimolaire : l\'excès d\'éthanol déplace l\'équilibre vers l\'ester.']],
        indice: 'L\'acide reste le réactif limitant : le rendement maximal est x_eq × 100.' } },

    { titre: "Chimie verte : choisir le protocole", texte: <>Trois voies possibles : (a) excès d'éthanol (réactif bon marché), (b) élimination de l'eau au fur et à mesure (montage de déshydratation), (c) anhydride d'acide, dérivé plus réactif, quasi total mais plus cher et plus « chargé » côté sécurité. </>,
      tache: { type: 'qcm', q: 'Cahier des charges : rendement supérieur à 90 %, temps de demi-réaction inférieur à 10 min, coût minimal. Quel protocole retenez-vous ?',
        options: ['Excès d\'éthanol seul : rendement 95 %, mais t½ ≈ 30 min : trop lent', 'Anhydride d\'acide à chaud avec catalyseur : quasi total, très rapide, mais coût et impact plus élevés', 'Mélange équimolaire à froid sans catalyseur : le moins cher, mais 67 % et trop lent'],
        bonne: 1, indice: 'Croisez les trois critères du cahier des charges avec les bilans de chaque protocole : aucun n\'est parfait, il faut prioriser.',
        expl: <>Le cahier des charges impose la vitesse ET le rendement : seul l'anhydride les réunit. Si la contrainte environnementale devenait dominante, on chercherait un compromis différent : comparer des protocoles, c'est arbitrer, pas appliquer une recette.</> } },
  ];
}

// ── Défi (tirage propre) ───────────────────────────────────────────────────
// Tirage : température de départ, présence du catalyseur, cible de production.
function tirerDefi() {
  const t0 = [20, 30, 40][Math.floor(Math.random() * 3)];
  const cible = Math.round((0.70 + Math.random() * 0.20) * 100) / 100;  // mol d'ester visées
  const k0 = kApparent({ t: t0, catalyseur: false, fconc: 1, reactif: "acide" });
  return { t0, cible, k0 };
}
function defi() {
  const d = tirerDefi();
  const gagnant = bilanProtocole({ t: 60, catalyseur: true, fconc: 1, rapport: 5, reactif: "acide", eauEliminee: false });
  const mEster = Math.round(gagnant.xeq * 116 * 10) / 10;
  return {
    t0: d.t0, verifie: false, reps: {},
    consigne: `Le service production commande un essai à ${d.t0} °C, sans catalyseur (k = ${fmt(d.k0, 3)} min⁻¹, avancement à l'équilibre x_éq = ${fmt(2 / 3, 2)} mol pour 1,0 mol d'acide). Répondez aux cinq questions ; l'écran Exploration peut vous aider.`,
    rappels: 'Rappels : t_1/2 = ln(2)/k ; la vitesse double tous les 10 °C ; catalyseur : k ×4, x_éq inchangé ; rendement = n_obtenu/n_max × 100. Donnez 2 chiffres significatifs.',
    Q: [
      { id: 'q1', type: 'num', unite: 'min', vrai: tempsDemi(d.k0), tol: 0.03,
        q: `Temps de demi-réaction de l'essai à ${d.t0} °C : t_1/2 = ln(2)/k.`,
        detail: 't_1/2 = ln(2)/k.' },
      { id: 'q2', type: 'num', unite: '', vrai: 4, tol: 0.02,
        q: `On chauffe à ${d.t0 + 20} °C : par quel facteur la constante de vitesse k est-elle multipliée ?`,
        detail: '+20 °C = deux fois +10 °C, donc 2 × 2 = 4.' },
      { id: 'q3', type: 'num', unite: '%', vrai: 67, tol: 0.02,
        q: "Rendement maximal de l'essai (mélange équimolaire), en % ?",
        detail: "x_éq = 2/3 mol pour 1 mol au maximum, soit 67 %." },
      { id: 'q4', type: 'num', unite: 'g', vrai: mEster, tol: 0.03,
        q: `Le protocole « gagnant » (60 °C, catalyseur, excès r = 5) atteint x_éq ≈ ${fmt(gagnant.xeq, 2)} mol. Quelle masse d'ester (M = 116 g/mol) obtient-on pour 1,0 mol d'acide, la réaction étant menée à son terme ?`,
        detail: 'm = x_éq × M.' },
      { id: 'q5', type: 'qcm', bonne: 1,
        q: "Vrai ou faux : ajouter le catalyseur à ce protocole augmenterait le rendement maximal.",
        options: ['Vrai : le catalyseur pousse la réaction plus loin', "Faux : le catalyseur agit sur la vitesse, pas sur l'équilibre"],
        detail: "Le catalyseur accélère l'atteinte de l'équilibre sans le déplacer." },
    ],
  };
}
const INDICE_Q = {
  q1: "Formule : t_1/2 = ln(2)/k, avec k en min⁻¹ : le résultat est en minutes.",
  q2: "Chaque tranche de 10 °C multiplie la vitesse par 2. Combien de tranches dans +20 °C ?",
  q3: "Rendement = quantité obtenue / quantité maximale. Que vaut x_éq pour un mélange équimolaire ?",
  q4: "Masse = quantité de matière × masse molaire. La quantité d'ester vaut x_éq.",
  q5: "Le catalyseur modifie-t-il l'état final d'équilibre, ou seulement le chemin pour y arriver ?",
};

// ── Petits composants d'affichage ─────────────────────────────────────────
// Vue microscopique animée : moteur validé numériquement (novembre 2026).
// Mouvement brownien individuel (chaque entité a sa vitesse, direction qui
// dérive en continu) + cinétique calée sur le modèle macroscopique : la dérive
// nette suit dx/dt = k·(x_éq − x) (accumulateurs fractionnaires : la barre
// rejoint le « rendement à 120 min » du bilan à 1-3 points près pour tout
// protocole). Près du plateau, un ÉCHANGE égal dans les deux sens (Poisson)
// s'y superpose : équilibre DYNAMIQUE, le compteur fluctue légèrement autour
// de x_éq (±1 molécule, bruit √N) et les éclairs orange/bleu alternent.
// ⚠️ Ne pas « simplifier » en tirant les réactions à chaque frame de contact :
// ça détruit le calage sur x_éq et la boîte dépasse le plateau (bug corrigé).
const W_MICRO = 320, H_MICRO = 180;
const COULEURS_MICRO = { A: "#8b5cf6", B: "#3b82f6", C: "#22c55e", D: "#94a3b8" };
const RAYONS_MICRO = { A: 5, B: 5, C: 6, D: 3.5 };

// Tirage de Poisson (algorithme de Knuth) : bruit statistique de l'échange à
// l'équilibre. C'est lui qui fait respirer le compteur autour du plateau,
// comme dans une vraie boîte (fluctuation en √N).
function poissonMicro(l) {
  if (l <= 0) return 0;
  const L = Math.exp(-l); let n = 0, p = 1;
  do { n++; p *= Math.random(); } while (p > L);
  return n - 1;
}

function VueMicroscopique({ expl, b }) {
  const refCanvas = useRef(null);
  const refHUD = useRef({});
  const [tourne, setTourne] = useState(false);
  const sim = useRef(null);
  const rafRef = useRef(null);
  const dernierT = useRef(0);
  const tourneRef = useRef(false);
  const explRef = useRef(expl); explRef.current = expl;
  const bRef = useRef(b); bRef.current = b;
  const signature = [expl.t, expl.rapport, expl.fconc, expl.catalyseur, expl.eauEliminee, expl.reactif].join("|");

  const init = () => {
    const p = explRef.current;
    // Population doublée (60 paires de base) : la fluctuation relative à l'équilibre
    // diminue en 1/√N ; le rythme d'échange reste calé sur 30 paires (voir unPas).
    // nB plafonné à 150 pour rester lisible avec un gros excès (r ≤ 5, f ≤ 2).
    const nA = Math.max(12, Math.round(60 * p.fconc));
    const nB = Math.max(12, Math.min(150, Math.round(60 * p.fconc * (p.reactif === "anhydride" ? 1 : p.rapport))));
    const v0 = 40 * Math.pow(2, (p.t - 40) / 22);   // agitation de base, doublée tous les 22 °C
    const particules = [];
    const ajout = type => particules.push({
      type, x: 14 + Math.random() * (W_MICRO - 28), y: 14 + Math.random() * (H_MICRO - 28),
      vx: (Math.random() * 2 - 1) * v0, vy: (Math.random() * 2 - 1) * v0, r: RAYONS_MICRO[type]
    });
    for (let i = 0; i < nA; i++) ajout("A");
    for (let i = 0; i < nB; i++) ajout("B");
    sim.current = { particules, eclairs: [], tSim: 0, accF: 0, accR: 0, micLisse: 0 };
    dessine();
  };

  const unPas = (dt) => {
    const s2 = sim.current; if (!s2) return;
    const p = explRef.current, bil = bRef.current;
    const vScale = Math.pow(2, (p.t - 40) / 22);
    for (const q of s2.particules) {
      q.x += q.vx * dt * vScale; q.y += q.vy * dt * vScale;
      if (q.x < q.r) { q.x = q.r; q.vx = Math.abs(q.vx); }
      if (q.x > W_MICRO - q.r) { q.x = W_MICRO - q.r; q.vx = -Math.abs(q.vx); }
      if (q.y < q.r) { q.y = q.r; q.vy = Math.abs(q.vy); }
      if (q.y > H_MICRO - q.r) { q.y = H_MICRO - q.r; q.vy = -Math.abs(q.vy); }
      const a = (Math.random() - 0.5) * 2.4 * dt;   // brownien : la direction dérive
      const c = Math.cos(a), si = Math.sin(a);
      const vx = q.vx * c - q.vy * si, vy = q.vx * si + q.vy * c;
      q.vx = vx; q.vy = vy;
    }
    const compte = t => s2.particules.reduce((n, q) => n + (q.type === t ? 1 : 0), 0);
    const nA = compte("A"), nB = compte("B"), nC = compte("C"), nD = compte("D");
    const n0 = Math.max(12, Math.round(60 * p.fconc));
    // Équilibre DYNAMIQUE : près du plateau, les deux sens continuent à rythmes
    // égaux (échange poissonnien) : les éclairs orange/bleu alternent et le
    // compteur fluctue légèrement autour de x_éq. Loin de l'équilibre, seule
    // la dérive nette calée sur dx/dt = k·(x_éq − x) subsiste (loi validée).
    const xNow = nC / n0;
    const deficit = bil.xeq - xNow;
    const lamNet = 12 * bil.k * Math.abs(deficit) * n0;    // 12 min simulées par seconde
    const sEq = Math.max(0, 1 - Math.abs(deficit) / 0.12); // l'échange n'est actif que près du plateau
    // Rythme d'échange calé sur une POPULATION DE RÉFÉRENCE (30 paires), pas sur n0 :
    // même fréquence d'éclairs quelle que soit la taille de la boîte, mais chaque
    // éclair pèse 1/n0 : doubler la population divise la fluctuation sans éteindre
    // l'équilibre dynamique.
    const lamEx = 6.5 * bil.k * 30 * bil.xeq * (1 - bil.xeq) * sEq; // rythme d'échange de chaque sens
    const lamF = (deficit > 0 ? lamNet : 0) + lamEx;
    const lamR = (deficit < 0 ? lamNet : 0) + lamEx;
    const fac = Math.min(1, 90 / Math.max(1e-9, lamF + lamR)); // anti-stroboscopique, rapport conservé
    const lNF = (deficit > 0 ? lamNet * fac : 0), lNR = (deficit < 0 ? lamNet * fac : 0);
    const lEF = Math.max(0, lamF * fac - lNF), lER = Math.max(0, lamR * fac - lNR);
    // débit net lissé (accumulateurs) : trajectoire reproductible, plateau exact
    s2.accF += lNF * dt; let nF = Math.floor(s2.accF); s2.accF -= nF;
    s2.accR += lNR * dt; let nR = Math.floor(s2.accR); s2.accR -= nR;
    nF += poissonMicro(lEF * dt); nR += poissonMicro(lER * dt);
    // couples en contact, pour placer les éclairs sur de vrais chocs
    const AB = [], CD = [];
    for (let i2 = 0; i2 < s2.particules.length; i2++) {
      for (let j2 = i2 + 1; j2 < s2.particules.length; j2++) {
        const u = s2.particules[i2], v = s2.particules[j2];
        const fwd = (u.type === "A" && v.type === "B") || (u.type === "B" && v.type === "A");
        const rev = (u.type === "C" && v.type === "D") || (u.type === "D" && v.type === "C");
        if ((fwd || rev) && Math.hypot(u.x - v.x, u.y - v.y) < u.r + v.r) (fwd ? AB : CD).push([u, v]);
      }
    }
    const tire = (arr, t1, t2) => {
      while (arr.length) {
        const paire = arr[(Math.random() * arr.length) | 0];
        if (paire[0].type !== null && paire[1].type !== null) return paire;
        arr.splice(arr.indexOf(paire), 1);
      }
      const p1 = s2.particules.filter(q => q.type === t1), p2 = s2.particules.filter(q => q.type === t2);
      if (!p1.length || !p2.length) return null;
      let best = [p1[0], p2[0]], bd = 1e9;
      for (const u of p1) for (const v of p2) {
        const d = Math.hypot(u.x - v.x, u.y - v.y);
        if (d < bd) { bd = d; best = [u, v]; }
      }
      return best;
    };
    const spawn = (t1, t2, mx, my) => {
      s2.particules.push({ type: t1, x: mx, y: my, vx: (Math.random() - .5) * 80 * vScale, vy: (Math.random() - .5) * 80 * vScale, r: RAYONS_MICRO[t1] });
      s2.particules.push({ type: t2, x: mx, y: my, vx: (Math.random() - .5) * 80 * vScale, vy: (Math.random() - .5) * 80 * vScale, r: RAYONS_MICRO[t2] });
    };
    for (let k2 = 0; k2 < nF + nR; k2++) {
      const fwd = k2 < nF;
      const paire = fwd ? tire(AB, "A", "B") : tire(CD, "C", "D");
      if (!paire) continue;
      const [u, v] = paire;
      u.type = v.type = null;
      const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
      if (fwd) { spawn("C", "D", mx, my); s2.eclairs.push({ x: mx, y: my, coul: "#f59e0b", age: 0 }); }
      else { spawn("A", "B", mx, my); s2.eclairs.push({ x: mx, y: my, coul: "#0ea5e9", age: 0 }); }
    }
    s2.particules = s2.particules.filter(q => q.type !== null);
    // élimination de l'eau : les molécules D sont entraînées, le sens inverse s'étouffe
    if (p.eauEliminee) {
      for (const q of s2.particules) if (q.type === "D" && Math.random() < 0.90 * dt) {
        s2.eclairs.push({ x: q.x, y: q.y, coul: "#94a3b8", age: 0 });
        q.type = null;
      }
      s2.particules = s2.particules.filter(q => q.type !== null);
    }
    for (const e of s2.eclairs) e.age += dt;
    s2.eclairs = s2.eclairs.filter(e => e.age < 0.5);
    s2.tSim += dt * 12;
  };

  const dessine = () => {
    const s2 = sim.current; if (!s2) return;
    const cv = refCanvas.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const bil = bRef.current;
    const nA0 = Math.max(12, Math.round(60 * explRef.current.fconc));
    const nC = s2.particules.filter(q => q.type === "C").length;
    const nA = s2.particules.filter(q => q.type === "A").length;
    const nD = s2.particules.filter(q => q.type === "D").length;
    const pct = Math.min(100, (nC / nA0) * 100);
    s2.micLisse += (pct - s2.micLisse) * 0.06;
    ctx.clearRect(0, 0, W_MICRO, H_MICRO);
    for (const q of s2.particules) {
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7);
      ctx.fillStyle = COULEURS_MICRO[q.type]; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 8px system-ui";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (q.type !== "D") ctx.fillText(q.type, q.x, q.y + 0.5);
    }
    for (const e of s2.eclairs) {
      ctx.strokeStyle = e.coul; ctx.lineWidth = 2; ctx.globalAlpha = 1 - e.age / 0.5;
      ctx.beginPath();
      ctx.moveTo(e.x - 3, e.y - 8); ctx.lineTo(e.x + 1, e.y - 2); ctx.lineTo(e.x - 1, e.y - 2);
      ctx.lineTo(e.x + 3, e.y - 12); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const h = refHUD.current;
    if (h.temps) h.temps.textContent = fmt(s2.tSim, 0) + (s2.tSim >= HORIZON ? " (protocole achevé)" : "");
    if (h.a) h.a.textContent = nA;
    if (h.c) h.c.textContent = nC;
    if (h.d) h.d.textContent = nD;
    if (h.barre) h.barre.style.width = s2.micLisse + "%";
    if (h.trait) h.trait.style.left = (bil.xeq * 100) + "%";
  };

  const boucle = (ts) => {
    if (!tourneRef.current) return;
    const dt = Math.min(0.05, (ts - dernierT.current) / 1000 || 0.016);
    dernierT.current = ts;
    unPas(dt); dessine();
    rafRef.current = requestAnimationFrame(boucle);
  };

  // une condition opératoire change => la boîte est réinitialisée
  useEffect(() => { tourneRef.current = false; setTourne(false); init(); },
    [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    tourneRef.current = tourne;
    if (tourne) { dernierT.current = performance.now(); rafRef.current = requestAnimationFrame(boucle); }
    else if (rafRef.current) cancelAnimationFrame(rafRef.current);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tourne]); // eslint-disable-line react-hooks/exhaustive-deps

  const legende = [["A", "acide carboxylique"], ["B", "éthanol"], ["C", "ester"], ["D", "eau"]];
  return (<div>
    <div style={{ fontSize: 12, color: KIT.txt2, marginBottom: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
      {legende.map(([t, lib]) => (<span key={t}>
        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: COULEURS_MICRO[t], marginRight: 3, verticalAlign: -1 }} />
        {t} {lib}</span>))}
    </div>
    <div style={{ position: "relative" }}>
      <canvas ref={refCanvas} width={W_MICRO} height={H_MICRO}
        style={{ width: "100%", maxWidth: 420, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10 }} />
      <button style={{ ...stylePetitBouton(false), position: "absolute", top: 8, right: 8 }}
        onClick={() => setTourne(t => !t)}>{tourne ? "⏸ Pause" : "▶ Lancer"}</button>
      <button style={{ ...stylePetitBouton(false), position: "absolute", top: 8, right: 86 }}
        onClick={() => { tourneRef.current = false; setTourne(false); init(); }}>↺</button>
    </div>
    <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: KIT.txt, marginTop: 4, flexWrap: "wrap" }}>
      <span>t = <strong ref={el => { refHUD.current.temps = el; }}>0</strong> min (simulées, protocole : 120 min)</span>
      <span>A restants : <strong ref={el => { refHUD.current.a = el; }}></strong></span>
      <span>ester formé : <strong ref={el => { refHUD.current.c = el; }}></strong></span>
      <span>eau : <strong ref={el => { refHUD.current.d = el; }}></strong></span>
    </div>
    <div style={{ height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "visible", position: "relative", marginTop: 4 }}>
      <div ref={el => { refHUD.current.barre = el; }} style={{ height: "100%", background: "#22c55e", width: 0, borderRadius: 6, transition: "width .2s" }} />
      <div ref={el => { refHUD.current.trait = el; }} title="plateau théorique x_éq"
        style={{ position: "absolute", top: -2, bottom: -2, width: 2, background: "#f59e0b", transition: "left .35s ease" }} />
    </div>
  </div>);
}

// Profil réactionnel avec et sans catalyseur (énergie d'activation).
// Profil type SPCL Montpellier : les niveaux des réactifs et des produits sont
// matérialisés par des SEGMENTS HORIZONTAUX ; la courbe part du segment des
// réactifs, franchit le col (état de transition) et redescend sur le segment
// des produits, plus bas. Ea : du niveau des réactifs au col ;
// ΔE : écart entre les deux segments (réaction exothermique).
function ProfilReactionnel({ catalyseur }) {
  return (<svg viewBox="0 0 330 175" style={{ width: "100%", maxWidth: 440 }}>
    <text x="28" y="12" fontSize="9.5" fill="#64748b">énergie potentielle</text>
    <line x1="22" y1="145" x2="322" y2="145" stroke="#94a3b8" strokeWidth="1.5" />
    <text x="215" y="161" fontSize="9.5" fill="#64748b" textAnchor="middle">avancement de la réaction</text>
    <line x1="40" y1="105" x2="85" y2="105" stroke="#334155" strokeWidth="2" />
    <text x="62" y="120" fontSize="9" fill="#64748b" textAnchor="middle">réactifs</text>
    <line x1="235" y1="125" x2="280" y2="125" stroke="#334155" strokeWidth="2" />
    <text x="257" y="140" fontSize="9" fill="#64748b" textAnchor="middle">produits</text>
    <path d="M 85 105 Q 165 0 235 125" fill="none" stroke="#dc2626" strokeWidth="2.5" />
    <path d="M 85 105 Q 165 42 235 125" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="6 5" opacity="0.9" />
    <text x="325" y="30" fontSize="10" fill="#dc2626" fontWeight="700" textAnchor="end">sans catalyseur</text>
    <text x="325" y="44" fontSize="10" fill="#16a34a" fontWeight="700" textAnchor="end">avec catalyseur</text>
    <text x="163" y="22" fontSize="9.5" fill="#334155" textAnchor="middle">état de transition</text>
    <line x1="163" y1="26" x2="163" y2="53" stroke="#334155" strokeWidth="1" />
    <line x1="34" y1="57.5" x2="163" y2="57.5" stroke="#cbd5e1" strokeDasharray="3 3" />
    <line x1="34" y1="105" x2="34" y2="61" stroke="#b45309" strokeWidth="1.5" />
    <path d="M 34 58 l -3.5 6 h 7 z" fill="#b45309" />
    <text x="40" y="88" fontSize="10" fill="#b45309" fontWeight="700">E<tspan dy="3" fontSize="7">a</tspan></text>
    <line x1="85" y1="105" x2="295" y2="105" stroke="#cbd5e1" strokeDasharray="3 3" />
    <line x1="280" y1="125" x2="295" y2="125" stroke="#cbd5e1" strokeDasharray="3 3" />
    <line x1="295" y1="105" x2="295" y2="125" stroke="#334155" strokeWidth="1.2" />
    <path d="M 295 102 l -3 5 h 6 z" fill="#334155" />
    <path d="M 295 128 l -3 -5 h 6 z" fill="#334155" />
    <text x="303" y="118" fontSize="9" fill="#334155" fontWeight="700">ΔE</text>
  </svg>);
}

// ── Écran Exploration ─────────────────────────────────────────────────────
const M = { t: [20, 80, 5], rapport: [1, 5, 0.5], fconc: [0.5, 2, 0.25] };

function EcranExploration({ expl, maj }) {
  const b = bilanProtocole(expl);
  const [vue, setVue] = useState("micro");
  const rang = (nom, val, lib, unit, min, max, pas, aide) => (
    <div key={nom} style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, color: KIT.txt, display: "flex", justifyContent: "space-between" }}>
        <span>{avecIndices(lib)}</span><strong>{fmt(val, pas < 1 ? 2 : 0)} {unit}</strong>
      </div>
      <input type="range" min={min} max={max} step={pas} value={val}
        style={{ width: "100%" }} onChange={e => maj({ [nom]: +e.target.value }) } />
      <div style={{ fontSize: 11, color: KIT.txt2 }}>{aide}</div>
    </div>
  );
  return (<div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
    <div style={{ flex: "1 1 300px", minWidth: 280 }}>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Conditions opératoires</div>
        {rang("t", expl.t, "Température T", "°C", M.t[0], M.t[1], M.t[2], "Vitesse ×2 tous les 10 °C (règle simplifiée).")}
        {rang("rapport", expl.rapport, "Excès d'éthanol (rapport molaire r)", "", M.rapport[0], M.rapport[1], M.rapport[2], "Réactif bon marché : déplace l'équilibre, donc le rendement… mais pas la vitesse.")}
        {rang("fconc", expl.fconc, "Concentration (facteur)", "", M.fconc[0], M.fconc[1], M.fconc[2], "Diluer ralentit (moins de chocs par litre).")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          <button style={stylePetitBouton(expl.catalyseur, KIT.accent)}
            onClick={() => maj({ catalyseur: !expl.catalyseur })}>Catalyseur {expl.catalyseur ? "ON" : "OFF"}</button>
          <button style={stylePetitBouton(expl.eauEliminee, KIT.accent)}
            onClick={() => maj({ eauEliminee: !expl.eauEliminee })}>Éliminer l'eau {expl.eauEliminee ? "ON" : "OFF"}</button>
          <button style={stylePetitBouton(expl.reactif === "anhydride", KIT.accent)}
            onClick={() => maj({ reactif: expl.reactif === "anhydride" ? "acide" : "anhydride" })}>
            {expl.reactif === "anhydride" ? "Anhydride" : "Acide + éthanol"}</button>
        </div>
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Bilan du protocole</div>
        <LigneMesure nom="t½ (min)" valeur={fmt(b.t12, 1)} couleur={ORANGE_GUIDE} />
        <LigneMesure nom="xéq (rendement maximal)" valeur={fmt(b.xeq * 100, 0) + " %"} couleur={ORANGE_GUIDE} />
        <LigneMesure nom="Rendement à 120 min" valeur={fmt(b.rendement * 100, 0) + " %"} couleur={ORANGE_GUIDE} />
        <LigneMesure nom="Coût (u.)" valeur={fmt(b.cout, 2)} couleur={KIT.txt2} />
        <LigneMesure nom="Chimie verte (0-100)" valeur={fmt(b.vert, 0)} couleur={KIT.txt2} />
        {expl.catalyseur && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
          Catalyseur actif : k ×4… mais x<sub>éq</sub> n'a pas bougé. Vérifiez pourquoi dans « Profil réactionnel ».</div>}
      </div>
    </div>
    <div style={{ flex: "1 1 340px", minWidth: 300 }}>
      <div style={styleBoite}>
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          {[["micro", "Microscopique"], ["courbe", "Courbe x(t)"], ["profil", "Profil énergétique"]].map(([v, l]) => (
            <button key={v} style={stylePetitBouton(vue === v, KIT.accent)}
              onClick={() => setVue(v)}>{l}</button>
          ))}
        </div>
        {vue === "micro" && <>
          <VueMicroscopique expl={expl} b={b} />
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
            Mouvement brownien : chaque entité a sa propre vitesse, et ça s'agite plus quand on chauffe.{" "}
            <b>Éclair orange</b> = choc efficace (A + B donnent ester + eau) ; <b>éclair bleu</b> = sens inverse :
            c'est lui qui explique le plateau. Sur le plateau, les deux sens continuent à rythmes égaux :
            les éclairs alternent et la barre fluctue légèrement autour du trait orange (x<sub>éq</sub>),
            c'est l'équilibre dynamique, tout se compense sans se figer.
            « Éliminer l'eau » : les molécules d'eau disparaissent une à une, le sens inverse s'étouffe et l'équilibre glisse vers l'ester.</div>
        </>}
        {vue === "courbe" && <>
          <CourbeAvancement pts={courbeAvancement(b.k, b.xeq)} xeq={b.xeq} />
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
            La courbe s'aplatit vers x<sub>éq</sub> : le catalyseur et la température l'accélèrent,
            seuls l'excès, l'élimination d'eau et l'anhydride relèvent le plateau.</div>
        </>}
        {vue === "profil" && <>
          <ProfilReactionnel catalyseur={expl.catalyseur} />
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
            Les niveaux des réactifs et des produits sont matérialisés par des segments horizontaux : les produits plus bas
            (ΔE &lt; 0), ce qui favorise le sens direct. Ici l'écart est faible (l'estérification est presque athermique) : l'équilibre n'est pas total, et c'est la constante K qui le fixe, pas ΔE. Ea est la flèche du
            niveau des réactifs au sommet du col (état de transition). Le catalyseur abaisse uniquement ce col : les deux
            segments ne bougent pas, donc l'état d'équilibre ne change pas.</div>
        </>}
      </div>
    </div>
  </div>);
}

function CourbeAvancement({ pts, xeq }) {
  const W = 340, H = 200, m = 36;
  const x = t => m + (t / HORIZON) * (W - 2 * m);
  const y = v => H - m - v * (H - 2 * m);
  const p = pts.map(([t, v]) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (<svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420 }}>
    <line x1={m} y1={H - m} x2={W - m / 2} y2={H - m} stroke="#94a3b8" />
    <line x1={m} y1={H - m} x2={m} y2={m / 2} stroke="#94a3b8" />
    <line x1={m} y1={y(xeq)} x2={W - m / 2} y2={y(xeq)} stroke="#f59e0b" strokeDasharray="5 4" />
    <text x={W - m} y={y(xeq) - 5} fontSize="10" textAnchor="end" fill="#b45309">x<tspan dy="3" fontSize="7">éq</tspan><tspan dy="-3"> = {fmt(xeq, 2)}</tspan></text>
    <polyline points={p} fill="none" stroke={KIT.accent} strokeWidth="2.5" />
    <text x={W - m} y={H - m + 14} fontSize="10" textAnchor="middle" fill="#64748b">t (min)</text>
    <text x={m - 6} y={m + 4} fontSize="10" fill="#64748b" transform={`rotate(-90 ${m - 12} ${H / 2})`}>x (mol)</text>
  </svg>);
}

// ── Composant principal ────────────────────────────────────────────────────
export function SimulationOptimiserSynthese() {
  const [mode, setMode] = useState(() => modeOuverture('os-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('os-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [expl, setExpl] = useState({ t: 40, catalyseur: false, fconc: 1, rapport: 1, reactif: "acide", eauEliminee: false });
  const majExpl = (champs) => setExpl(e => ({ ...e, ...champs }));
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const etapes = etapesGuide();
  const finParcours = guide.etape >= etapes.length;
  const juste = q => q.type === 'num'
    ? proche(lireNombre(df.reps[q.id] ?? ''), q.vrai, q.tol)
    : df.reps[q.id] === q.bonne;
  const nbJustes = df.Q.filter(juste).length;

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
        {avecIndices(df.consigne)}
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>{avecIndices(df.rappels)}</div>
      </div>
      {df.Q.map((q, k) => {
        const ok = juste(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${df.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
            <IndiceDefi cache={df.verifie && ok}>{avecIndices(INDICE_Q[q.id])}</IndiceDefi>
            {q.type === 'qcm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: i } }))}
                    style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${df.reps[q.id] === i ? '#0284c7' : KIT.bord}`,
                      background: df.reps[q.id] === i ? '#e0f2fe' : 'white', color: KIT.txt }}>{o}</button>
                ))}
                {df.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={df.reps[q.id] || ''} placeholder="?" aria-label={`Réponse au défi ${k + 1}`}
                  onChange={e => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: e.target.value } }))}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130 }} />
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.unite}</span>
                {df.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            )}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>
              {q.type === 'num' ? <>Réponse attendue : <strong>{fmt(q.vrai, q.vrai < 10 ? 1 : 0)} {q.unite}</strong> — </> : null}{avecIndices(q.detail)}</div>}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { noterDefi(df.Q.every(juste)); setDf(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => setDf(defi())} style={styleBouton(false)}><Pic n="refresh" />Nouvelles données</button>
        {df.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{nbJustes} / {df.Q.length} réponses justes</span>}
      </div>
    </div>
  );

  return (<div style={cardStyle}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
      <h2 style={{ margin: 0, fontSize: 21 }}>Optimiser une synthèse</h2>
      <BoutonsModes mode={mode} setMode={setMode} />
    </div>
    {mode === "guide" && <>
      <Section titre="La mission" ouvert={true} onBascule={() => {}}>{CONTEXTE}</Section>
      <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />
      {finParcours && <ARetenir titre="À RETENIR">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Trois <strong>facteurs cinétiques</strong> : température, concentration des réactifs, catalyseur. Ils agissent sur la constante de vitesse k, donc sur le temps de demi-réaction t<sub>1/2</sub> = ln(2)/k.</li>
          <li>À l'échelle microscopique : la réaction nécessite des <strong>chocs efficaces</strong> (énergétiques et bien orientés) ; le catalyseur abaisse l'énergie d'activation.</li>
          <li><strong>Le catalyseur n'augmente pas le rendement</strong> : il accélère, l'état d'équilibre ne change pas.</li>
          <li>Le rendement se pilote par <strong>l'équilibre</strong> : excès d'un réactif, élimination d'un produit, dérivé plus réactif.</li>
          <li>Rendement multi-étapes : <strong>produit</strong> des rendements ; chimie verte : choisir le protocole le plus performant (rendement, coût, environnement).</li>
        </ul>
      </ARetenir>}
    </>}
    {mode === "explore" && <EcranExploration expl={expl} maj={majExpl} />}
    {mode === "defi" && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
    {mode !== "guide" && <div style={{ ...styleBoite, marginTop: 12 }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>}
  </div>);
}
