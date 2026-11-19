import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./tamponTstlModele";
import { QCM } from "./tamponTstlQcm";
import { SceneTampon, SceneChoix, GrapheAjout, SvgResiste, SvgMecanisme, SvgDilution, SvgLimite, SvgDomaine, SvgChoixPrepa } from "./TamponTstlSchemas";

const SIM_ID = 141, CLE_GUIDE = 'tampon-tstl-guide-v1';
declarerDefis(SIM_ID, [['prep', 'Préparer un tampon de pH donné'], ['ajout', 'Le pH d’un tampon après un ajout']]);

// ====================================================
//  SIM 141 — SOLUTION TAMPON : CHOISIR LE COUPLE ET LE PRÉPARER (TSTL, enseignement PCM, séquence 2 « Réactions acido-basiques »).
//  Une seule idée : un tampon est un mélange d'un acide faible et de sa base conjuguée dont le pH reste voisin du pKa malgré de petits ajouts d'acide ou de base et la dilution.
//  Notions : couple acide/base, réaction quasi totale des ions H₃O⁺ (ou HO⁻) sur la base (ou l'acide), pH = pKa + log, domaine pKa ± 1, choix du couple avec des valeurs tabulées,
//  préparation par mélange de volumes de solutions de même concentration.
//  Aucune espèce, valeur ni situation des documents du Moodle : couples propres à la simulation (benzoïque, propanoïque, hypochloreux, phénol), pH visé et volumes inventés.
//  Capacités visées (jamais affichées à l'élève) : choisir le couple adapté à la préparation d'une solution tampon avec des valeurs tabulées ; exploiter pH = pKa + log ; bilan de matière.
//  Complément de la simulation 131 (Terminale générale, tampon avec pH exact) : ici, simplifiée, centrée sur le choix du couple et la préparation.
//  Modèle : tamponTstlModele.js. Schémas : TamponTstlSchemas.jsx. QCM : tamponTstlQcm.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d' };
const PRESET = { couple: 'prop', vA: 50, nAcide: 0, nBase: 0, ve: 0 };
const P = M.PARCOURS, K = M.COUPLES[P.couple].pKa, CP = M.COUPLES[P.couple], CC = M.COUPLES[P.coupleCible];
const eAcide = M.etat({ coupleId: P.couple, vA: P.vA, nAcide: P.nAjout });
const pHeau1 = M.pHAcideFort(P.nAjout, M.volumeTotal({ nAcide: P.nAjout }));
const rCible = M.rapportDepuisPH(P.cible, CC.pKa), vBaseCible = M.volumeBase(rCible), vAcideCible = M.volumeAcide(rCible);
const rAcide2 = M.arrondiCS(eAcide.r, 2);

// ---------- formules (MathML) ----------
const FpH = <Formule><mi>pH</mi><mo>=</mo><mi>pKa</mi><mo>+</mo><mi>log</mi><mfrac><mrow><mi>n</mi><mo>(</mo><msup><mi mathvariant="normal">A</mi><mo>−</mo></msup><mo>)</mo></mrow><mrow><mi>n</mi><mo>(</mo><mi mathvariant="normal">AH</mi><mo>)</mo></mrow></mfrac></Formule>;
const F10 = <FormuleEnLigne><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo><mi>pKa</mi></mrow></msup></FormuleEnLigne>;
const FRapport = <FormuleEnLigne><mfrac><mrow><mi>n</mi><mo>(</mo><msup><mi mathvariant="normal">A</mi><mo>−</mo></msup><mo>)</mo></mrow><mrow><mi>n</mi><mo>(</mo><mi mathvariant="normal">AH</mi><mo>)</mo></mrow></mfrac></FormuleEnLigne>;

const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
function Equation({ coupleId }) {
  const c = M.COUPLES[coupleId];
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>Couple acide/base {c.AH} / {c.A} : {c.nom}</div>
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.6 }} aria-label="Équation de la réaction de l’acide avec l’eau">
        <Esp>{c.AH}(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> ⇌ <Esp>{c.A}(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp>
      </div>
    </div>);
}
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ====================================================
export function SimulationTamponTstl() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('prep');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['eau', 'melange', 'reaction', 'rapport', 'phacide', 'base', 'dilution', 'limite', 'equimol', 'choix', 'prep', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée à chaque étape ----------
  const SC = {
    eau:      { eau: true, tampon: false, nAcide: 1, phEau: false, phT: false, barres: false },
    melange:  { eau: false, tampon: true, phEau: true, phT: false, barres: 'apres' },
    reaction: { eau: true, tampon: true, nAcide: 1, phEau: true, phT: false, barres: 'avant' },
    rapport:  { eau: true, tampon: true, nAcide: 1, phEau: true, phT: false, barres: 'avant' },
    phacide:  { eau: true, tampon: true, nAcide: 1, phEau: true, phT: false, barres: 'apres' },
    base:     { eau: true, tampon: true, nBase: 1, phEau: true, phT: false, barres: 'avant' },
    dilution: { eau: false, tampon: true, ve: P.veDilution, phEau: true, phT: false, barres: false },
    limite:   { eau: false, tampon: true, nAcide: P.nLimite, phEau: true, phT: false, barres: 'avant' },
    equimol:  { eau: false, tampon: true, phEau: true, phT: true, barres: 'apres' },
  };
  const choixEtape = ['choix', 'prep', 'bilan'].includes(idE);
  const sg = enGuide && !choixEtape ? SC[idE] : null;
  const coupleId = enGuide ? P.couple : ti.couple, vA = enGuide ? P.vA : ti.vA;
  const nAcide = enGuide ? (sg?.nAcide ?? 0) : ti.nAcide, nBase = enGuide ? (sg?.nBase ?? 0) : ti.nBase, ve = enGuide ? (sg?.ve ?? 0) : ti.ve;
  const c = M.COUPLES[coupleId], e = M.etat({ coupleId, vA, nAcide, nBase, ve }), eAvant = M.etat({ coupleId, vA });
  const barresMode = enGuide ? sg?.barres : 'apres', eb = barresMode === 'avant' ? eAvant : e;

  const ETAPES = [
    { id: 'eau', titre: 'Ajouter un acide à l’eau pure', focus: ['scene'],
      texte: <>Un bécher contient 100 mL d’eau pure, de pH égal à 7,0. On y verse 1,0 mL d’une solution d’acide fort : cela apporte <strong>1,0 mmol</strong> d’ions H₃O⁺ (1 mmol = 10⁻³ mol), totalement formés. Le volume total devient <strong>101 mL</strong>.</>,
      tache: { type: 'num', q: 'pH de l’eau après l’ajout (sans unité)', unite: '(sans unité)', vrai: pHeau1, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['[H₃O⁺] = frac(1,0 × 10⁻³ mol|0,101 L) = 9,9 × 10⁻³ mol·L⁻¹', 'pH = −log([H₃O⁺]) = −log(9,9 × 10⁻³) = 2,00.'],
        pieges: [[3.0, 'Vous avez pris 1,0 × 10⁻³ comme concentration : il faut diviser la quantité de matière par le volume total (0,101 L).'], [5.0, 'Le volume est à convertir : 101 mL = 0,101 L, pas 101 L.'], [7.0, 'L’ajout d’un acide fort ne laisse pas le pH de l’eau à 7 : les ions H₃O⁺ ajoutés font baisser le pH.']],
        expl: 'La concentration en ions H₃O⁺ est 9,9 × 10⁻³ mol·L⁻¹ : le pH de l’eau chute de 7,0 à 2,0, soit 5 unités, pour un tout petit ajout.', indice: 'pH = −log([H₃O⁺]) avec [H₃O⁺] = frac(n|V), n en mol (1,0 mmol = 1,0 × 10⁻³ mol) et V en litres (101 mL = 0,101 L).' } },
    { id: 'melange', titre: 'Un tampon : un acide faible et sa base conjuguée', focus: ['scene', 'mesures'],
      texte: <>Un <strong>tampon</strong> est un mélange d’un acide faible et de sa base conjuguée. On mélange <strong>50 mL</strong> d’une solution d’acide propanoïque C₂H₅COOH à 0,10 mol·L⁻¹ et <strong>50 mL</strong> d’une solution de propanoate de sodium (C₂H₅COO⁻, Na⁺) à 0,10 mol·L⁻¹ : il y a <strong>5,0 mmol</strong> de chaque forme du couple (pKa = {nbf(K, 1)}). Le pH de l’eau après l’ajout est maintenant affiché.</>,
      tache: { type: 'qcm', q: 'Quel est le pH de ce mélange équimolaire (5,0 mmol de chaque forme) ?', ...QCM.melange,
        expl: 'Avec autant de base que d’acide, le rapport frac(n(A⁻)|n(AH)) vaut 1 et log(1) = 0 : pH = pKa + 0 = 4,9.', indice: 'Utilisez pH = pKa + log(rapport) avec le rapport frac(n(A⁻)|n(AH)) de ce mélange : que vaut-il, et que vaut son logarithme ?' } },
    { id: 'reaction', titre: 'Ajouter un acide au tampon', focus: ['scene'],
      texte: <>On ajoute maintenant <strong>1,0 mmol</strong> d’ions H₃O⁺ (1,0 mL de la même solution d’acide fort) au tampon. Les ions H₃O⁺ réagissent sur une espèce du couple, avec une réaction <strong>quasi totale</strong> : les 1,0 mmol d’ions H₃O⁺ sont consommées.</>,
      tache: { type: 'qcm', q: 'Quelle espèce du couple consomme les ions H₃O⁺ ajoutés ?', ...QCM.reaction,
        expl: 'Les ions H₃O⁺ sont un acide : ils réagissent avec la base du couple, C₂H₅COO⁻, pour former l’acide C₂H₅COOH : H₃O⁺ + C₂H₅COO⁻ → C₂H₅COOH + H₂O.', indice: 'H₃O⁺ est un acide : avec quelle espèce du couple (acide ou base) un acide réagit-il ?' } },
    { id: 'rapport', titre: 'Le bilan de matière', focus: ['scene', 'mesures'],
      texte: <>Le tampon contenait 5,0 mmol de C₂H₅COO⁻ et 5,0 mmol de C₂H₅COOH. La réaction H₃O⁺ + C₂H₅COO⁻ → C₂H₅COOH + H₂O consomme 1,0 mmol de H₃O⁺ : elle consomme donc 1,0 mmol de C₂H₅COO⁻ et forme 1,0 mmol de C₂H₅COOH.</>,
      tache: { type: 'num', q: 'Rapport frac(n(C₂H₅COO⁻)|n(C₂H₅COOH)) après l’ajout (sans unité)', unite: '(sans unité)', vrai: eAcide.r, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['n(C₂H₅COO⁻) = 5,0 − 1,0 = 4,0 mmol et n(C₂H₅COOH) = 5,0 + 1,0 = 6,0 mmol.', 'Rapport = frac(4,0|6,0) = 0,67 (sans unité).'],
        pieges: [[1.0, 'C’est le rapport avant l’ajout : la base a diminué de 1,0 mmol et l’acide a augmenté de 1,0 mmol.'], [0.8, 'L’acide a aussi changé : il passe de 5,0 à 6,0 mmol, pas de 5,0 à 5,0.'], [5 / 6, 'La base passe de 5,0 à 4,0 mmol : elle a diminué de 1,0 mmol.'], [1.5, 'Le rapport est inversé : on demande la base sur l’acide, donc un nombre inférieur à 1 ici.']],
        expl: 'n(C₂H₅COO⁻) = 4,0 mmol et n(C₂H₅COOH) = 6,0 mmol : le rapport vaut 0,67.', indice: 'La base perd 1,0 mmol (elle réagit) et l’acide gagne 1,0 mmol (il se forme) : calculez les deux quantités puis leur quotient.' } },
    { id: 'phacide', titre: 'Le pH après l’ajout d’acide', focus: ['mesures'],
      texte: <>Après l’ajout : n(C₂H₅COO⁻) = 4,0 mmol et n(C₂H₅COOH) = 6,0 mmol, soit un rapport de <strong>{nbf(rAcide2, 2)}</strong>. Le volume se simplifie dans le rapport des concentrations : on utilise directement le rapport des quantités de matière. {FpH}Le pKa du couple vaut {nbf(K, 1)}.</>,
      tache: { type: 'num', q: 'pH du tampon après l’ajout', unite: '(sans unité)', vrai: M.pHFormule(K, eAcide.nA, eAcide.nAH), tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`rapport = frac(4,0|6,0) = ${nbf(eAcide.r, 2)}`, `pH = pKa + log(${nbf(eAcide.r, 2)}) = 4,9 − 0,18 = 4,72.`],
        pieges: [[K, 'Vous avez oublié le terme log : le pH n’est égal au pKa que si les deux quantités sont égales, ce qui n’est plus le cas.'], [K - eAcide.r, 'Il faut le logarithme décimal du rapport, pas le rapport lui-même.'], [K - Math.log10(eAcide.r), 'Le signe est inversé : le rapport est inférieur à 1, donc son logarithme est négatif et le pH est inférieur au pKa.']],
        expl: 'pH = 4,9 + log(0,67) = 4,72 : le pH du tampon n’a baissé que de 0,18 unité alors que celui de l’eau avait baissé de 5 unités.', indice: 'Calculez log(0,67) avec la touche log (le résultat est négatif car 0,67 < 1), puis ajoutez-le au pKa.' } },
    { id: 'base', titre: 'Ajouter une base au tampon', focus: ['scene'],
      retenirTitre: 'À RETENIR : UN TAMPON RÉSISTE',
      retenir: <>
        <SvgResiste/>
        <ul style={puces}>
          <li>Une solution <strong>tampon</strong> garde un pH <strong>voisin</strong> quand on lui ajoute de <strong>petites quantités</strong> d’acide fort ou de base forte.</li>
          <li>Exemple de la simulation : 1,0 mmol d’acide fort fait baisser de <strong>5 unités</strong> le pH de l’eau pure, et de <strong>0,2 unité</strong> celui du tampon.</li>
          <li>Moyen de s’en souvenir : <strong>« le tampon amortit les chocs de pH »</strong>.</li>
        </ul></>,
      texte: <>Autre expérience, sur un tampon équimolaire identique (5,0 mmol de chaque forme) : on ajoute cette fois <strong>1,0 mmol d’ions HO⁻</strong> (1,0 mL d’une solution de base forte). L’eau pure qui reçoit la même quantité de base passe à pH {nbf(M.pHEau({ nBase: 1 }), 1)}.</>,
      tache: { type: 'qcm', q: 'Que devient le pH du tampon ?', ...QCM.base,
        expl: 'Les ions HO⁻ sont consommés par l’acide du couple : HO⁻ + C₂H₅COOH → C₂H₅COO⁻ + H₂O. Le rapport passe de 1 à 1,5 : le pH monte de 0,18 unité environ.', indice: 'HO⁻ est une base : quelle espèce du couple la consomme ? Comparez le résultat à ce qui s’est passé pour l’ajout d’acide.' } },
    { id: 'dilution', titre: 'Diluer un tampon', focus: ['scene'],
      retenirTitre: 'À RETENIR : COMMENT AGIT LE TAMPON',
      retenir: <>
        <SvgMecanisme/>
        <ul style={puces}>
          <li>La <strong>base A⁻</strong> consomme les ions H₃O⁺ ajoutés ; l’<strong>acide AH</strong> consomme les ions HO⁻ ajoutés. Les deux réactions sont quasi totales.</li>
          <li>Exemple de la simulation : 1,0 mmol de H₃O⁺ transforme 1,0 mmol de C₂H₅COO⁻ en 1,0 mmol de C₂H₅COOH.</li>
          <li>Moyen de s’en souvenir : <strong>« la base répond à l’acide, l’acide répond à la base »</strong>.</li>
        </ul></>,
      texte: <>Retour au tampon équimolaire de départ (pKa = {nbf(K, 1)}). On ajoute <strong>900 mL d’eau pure</strong> : le tampon est dilué <strong>10 fois</strong> (les concentrations sont divisées par 10, les quantités de matière de C₂H₅COO⁻ et de C₂H₅COOH ne changent pas).</>,
      tache: { type: 'qcm', q: 'Que devient le pH du tampon dilué ?', ...QCM.dilution,
        expl: 'Les quantités n(A⁻) et n(AH) ne changent pas, donc le rapport vaut toujours 1 : pH = pKa + log(1) = 4,9. Le volume n’intervient pas dans ce rapport.', indice: 'Dans pH = pKa + log(frac(n(A⁻)|n(AH))), le rapport dépend-il du volume de la solution ?' } },
    { id: 'limite', titre: 'Les limites du tampon', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA DILUTION NE CHANGE PAS LE pH',
      retenir: <>
        <SvgDilution/>
        <ul style={puces}>
          <li>Le pH d’un tampon ne dépend que du <strong>rapport des quantités</strong> des deux formes : <strong>diluer</strong> ne change <strong>pas</strong> le pH.</li>
          <li>Exemple de la simulation : un tampon dilué 10 fois garde le pH du tampon de départ.</li>
          <li>Moyen de s’en souvenir : <strong>« le volume se simplifie »</strong>.</li>
        </ul></>,
      texte: <>On revient au tampon équimolaire non dilué : 5,0 mmol de C₂H₅COO⁻ et 5,0 mmol de C₂H₅COOH. Cette fois on ajoute une <strong>grande quantité</strong> d’acide fort : <strong>6,0 mmol</strong> d’ions H₃O⁺, c’est-à-dire plus que les 5,0 mmol de base disponibles.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il ?', ...QCM.limite,
        expl: 'Les 5,0 mmol de C₂H₅COO⁻ réagissent toutes avec 5,0 mmol de H₃O⁺ ; 1,0 mmol de H₃O⁺ reste en excès dans environ 106 mL : pH ≈ 2,0. Le tampon est épuisé : il n’a plus de base pour consommer l’acide.', indice: 'Comparez la quantité de H₃O⁺ ajoutée (6,0 mmol) à la quantité de base A⁻ disponible (5,0 mmol) : qu’arrive-t-il à ce qui dépasse ?' } },
    { id: 'equimol', titre: 'Quel tampon résiste le mieux ?', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : LES LIMITES DU TAMPON',
      retenir: <>
        <SvgLimite/>
        <ul style={puces}>
          <li>Un tampon ne résiste que tant qu’il reste de la base (pour un ajout d’acide) ou de l’acide (pour un ajout de base) : au-delà, il est <strong>épuisé</strong> et le pH change brutalement.</li>
          <li>Exemple de la simulation : pour un tampon de 4,0 mmol de chaque forme, 4,0 mmol d’acide ajouté épuisent la base.</li>
          <li>Moyen de s’en souvenir : <strong>« plus il y a de matière, plus le tampon dure »</strong>.</li>
        </ul></>,
      texte: <>On prépare des tampons du même couple, avec 10 mmol au total, mais en proportions différentes. On veut un tampon qui résiste aussi bien à un ajout d’<strong>acide</strong> qu’à un ajout de <strong>base</strong>, c’est-à-dire qui a de la matière en réserve pour les deux.</>,
      tache: { type: 'qcm', q: 'Quelle composition faut-il choisir ?', ...QCM.equimol,
        expl: 'Avec autant d’acide que de base, la réserve est la même dans les deux sens : le pouvoir tampon est maximal et le pH est égal au pKa. Un tampon est efficace pour un rapport entre 0,1 et 10, soit pH entre pKa − 1 et pKa + 1.', indice: 'Pour résister à un acide il faut de la base en réserve, pour résister à une base il faut de l’acide en réserve : quelle composition donne les deux réserves égales ?' } },
    { id: 'choix', titre: 'Choisir le couple', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA ZONE TAMPON',
      retenir: <>
        <SvgDomaine/>
        <ul style={puces}>
          <li>Un tampon est efficace pour <strong>pH = pKa ± 1</strong>, soit un rapport {FRapport} entre <strong>0,1 et 10</strong> ; le pouvoir tampon est <strong>maximal au pKa</strong>, mélange <strong>équimolaire</strong>.</li>
          <li>Exemple de la simulation : le couple de pKa 4,9 est un bon tampon de pH 3,9 à 5,9.</li>
          <li>Moyen de s’en souvenir : <strong>« pKa ± 1, c’est la zone tampon »</strong>.</li>
        </ul></>,
      texte: <>On veut préparer un tampon de pH <strong>{nbf(P.cible, 1)}</strong>. Les couples disponibles sont dessinés sur l’axe : pour chacun, la plage verte va de pKa − 1 à pKa + 1 et le trait noir marque le pKa. Les pKa sont donnés dans les légendes.</>,
      tache: { type: 'qcm', q: 'Quel couple choisir pour préparer un tampon de pH 7,8 ?', ...QCM.choix,
        expl: 'Le pH visé 7,8 est dans la plage de HClO / ClO⁻ (de 6,5 à 8,5) et proche de son pKa de 7,5. Les autres couples ont une plage qui ne contient pas 7,8.', indice: 'Cherchez le couple dont la plage pKa − 1 à pKa + 1 contient 7,8 : le pKa doit être proche du pH visé.' } },
    { id: 'prep', titre: 'Préparer le tampon', focus: ['scene'],
      texte: <>On prépare <strong>100 mL</strong> de tampon de pH {nbf(P.cible, 1)} avec le couple {CC.AH} / {CC.A} (pKa = {nbf(CC.pKa, 1)}), à partir d’une solution de {CC.AH} et d’une solution de {CC.A} (sel de sodium), <strong>toutes deux à 0,10 mol·L⁻¹</strong>. Avec des concentrations égales, le rapport des quantités est le rapport des volumes : r = frac(V_base|V_acide) = 10^(pH − pKa), avec V_base + V_acide = 100 mL.</>,
      tache: { type: 'num', q: 'Volume V_base de solution de ClO⁻ à mélanger (en mL)', unite: 'mL', vrai: vBaseCible, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => [`r = 10^(${nbf(P.cible, 1)} − ${nbf(CC.pKa, 1)}) = 10^(0,3) = ${nbf(rCible, 1)}`, `V_base = frac(100 × r|1 + r) = frac(100 × ${nbf(rCible, 1)}|1 + ${nbf(rCible, 1)}) ≈ ${nbf(vBaseCible, 0)} mL (et V_acide ≈ ${nbf(vAcideCible, 0)} mL).`],
        pieges: [[vAcideCible, 'C’est le volume de la solution d’acide : on demande celui de la base, la plus grande des deux car pH > pKa.'], [50, 'Deux volumes égaux donnent un rapport de 1, donc pH = pKa : ici le pH est supérieur au pKa.'], [100 * rCible, 'Le total ne peut pas dépasser 100 mL : V_base = frac(100 × r|1 + r).'], [rCible, 'Le rapport r est sans unité : il faut encore calculer V_base = frac(100 × r|1 + r).']],
        expl: `r = 10^(0,3) ≈ 2,0 : on mélange environ ${nbf(vBaseCible, 0)} mL de solution de ClO⁻ et ${nbf(vAcideCible, 0)} mL de solution de HClO.`, indice: 'Calculez d’abord r = 10^(pH − pKa) (touche 10ˣ), puis résolvez V_base = r × V_acide avec V_base + V_acide = 100 mL : V_base = frac(100 × r|1 + r).' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : CHOISIR ET PRÉPARER',
      retenir: <>
        <SvgChoixPrepa/>
        <ul style={puces}>
          <li>On choisit le couple dont le <strong>pKa est le plus proche du pH visé</strong> (à ± 1), puis on mélange acide et base conjuguée dans le rapport <strong>{F10}</strong>.</li>
          <li>Exemple de la simulation : pour 100 mL à pH 4,5 avec le couple de pKa 4,9, rapport 0,40 : 28,5 mL de base et 71,5 mL d’acide.</li>
          <li>Moyen de s’en souvenir : <strong>« pKa proche, puis rapport {F10}, volumes dans ce rapport »</strong>.</li>
        </ul></>,
      texte: <>Vous savez expliquer pourquoi un tampon résiste aux petits ajouts d’acide ou de base et à la dilution, calculer son pH avec pH = pKa + log, voir quand il est épuisé, choisir le couple d’après les pKa tabulés et préparer un tampon de pH donné. Explorez maintenant, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'prep' ? { ...M.tiragePrep(), reps: { vb: '', va: '' }, verifie: false } : { ...M.tirageAjout(), reps: { r: '', pH: '' }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const okPH = (x, vrai) => isFinite(x) && Math.abs(x - vrai) <= 0.04;
  const verifier = () => {
    if (defi.type === 'prep') {
      const vb = lireNombre(defi.reps.vb), va = lireNombre(defi.reps.va);
      const ok = isFinite(vb) && isFinite(va) && proche(vb, defi.vBase, 0.05) && proche(va, defi.vAcide, 0.05);
      setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok);
    } else {
      const r = lireNombre(defi.reps.r), ph = lireNombre(defi.reps.pH);
      const ok = isFinite(r) && proche(r, defi.r, 0.05) && okPH(ph, defi.pH);
      setDefi(d => ({ ...d, verifie: true, ok })); noterA(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('tp-verif')?.click()} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e2.target.value }, verifie: false }))} inputMode="decimal"
      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);
  const dc = defi ? M.COUPLES[defi.coupleId] : null;
  const fmtC = v => nbf(v, 2);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['prep', 'Préparer un tampon'], ['ajout', 'pH après un ajout']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'prep' ? 'Défi : préparer un tampon de pH donné' : 'Défi : le pH d’un tampon après un ajout'}</div>
      {defi.type === 'prep' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On veut préparer <strong>{defi.V} mL</strong> de tampon de pH <strong>{nbf(defi.pH, 1)}</strong> avec le couple {dc.AH} / {dc.A} (pKa = {nbf(dc.pKa, 1)}), à partir d’une solution de {dc.AH} et d’une solution de {dc.A} (sel de sodium), toutes deux à <strong>{fmtC(defi.C)}{NB}mol·L⁻¹</strong>. Calculez le volume de chaque solution à mélanger (2 chiffres significatifs).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>V({dc.A}) (mL) =</span>{champ('vb', 'Volume de la solution de base conjuguée', defi.ok || proche(lireNombre(defi.reps.vb), defi.vBase, 0.05))}
          <span>V({dc.AH}) (mL) =</span>{champ('va', 'Volume de la solution d’acide', defi.ok || proche(lireNombre(defi.reps.va), defi.vAcide, 0.05))}
        </div>
        <IndiceDefi cache={false}>Rapport r = V(base) divisé par V(acide) = 10<sup>pH − pKa</sup> (concentrations égales) ; V(base) + V(acide) = volume total, donc V(base) = V × r divisé par (1 + r) et V(acide) = V divisé par (1 + r).</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un tampon du couple {dc.AH} / {dc.A} (pKa = {nbf(dc.pKa, 1)}) contient <strong>{nbf(defi.nA, 1)} mmol</strong> de {dc.A} et <strong>{nbf(defi.nAH, 1)} mmol</strong> de {dc.AH}. On y ajoute <strong>{nbf(defi.x, 1)} mmol</strong> {defi.sens === 'acide' ? `d’ions H₃O⁺ (acide fort)` : `d’ions HO⁻ (base forte)`}. Calculez le rapport {avecIndices(`frac(n(${dc.A})|n(${dc.AH}))`)} après l’ajout (2 chiffres significatifs), puis le pH du tampon (2 décimales).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Rapport =</span>{champ('r', 'Rapport des quantités base sur acide après l’ajout', defi.ok || proche(lireNombre(defi.reps.r), defi.r, 0.05))}
          <span>pH =</span>{champ('pH', 'pH du tampon après l’ajout', defi.ok || okPH(lireNombre(defi.reps.pH), defi.pH))}
        </div>
        <IndiceDefi cache={false}>{defi.sens === 'acide' ? 'Les ions H₃O⁺ consomment la base : n(A⁻) diminue et n(AH) augmente de la quantité ajoutée.' : 'Les ions HO⁻ consomment l’acide : n(AH) diminue et n(A⁻) augmente de la quantité ajoutée.'} Puis pH = pKa + log {FRapport}.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="tp-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.type === 'prep'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `r = 10^(${nbf(defi.pH, 1)} − ${nbf(dc.pKa, 1)}) = ${nbf(M.arrondiCS(defi.r, 2), defi.r >= 10 ? 0 : 2)} ; V(${dc.A}) ≈ ${nbf(defi.vBase, 1)} mL et V(${dc.AH}) ≈ ${nbf(defi.vAcide, 1)} mL.`
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `n(${dc.A}) = ${nbf(defi.nA2, 1)} mmol et n(${dc.AH}) = ${nbf(defi.nAH2, 1)} mmol : rapport ≈ ${nbf(M.arrondiCS(defi.r, 2), defi.r >= 10 ? 0 : 2)} ; pH = ${nbf(dc.pKa, 1)} + log(${nbf(M.arrondiCS(defi.r, 2), 2)}) ≈ ${nbf(defi.pH, 2)}.`)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; les pKa sont des valeurs usuelles arrondies au dixième, données et non à retrouver.</li>
      <li><strong>Solutions mères de même concentration</strong> (0,10 mol·L⁻¹), mélangées pour faire 100 mL ; <strong>volumes additifs</strong> ; chaque ajout d’acide fort ou de base forte apporte 1,0 mmol dans 1,0 mL.</li>
      <li><strong>Réaction quasi totale</strong> des ions H₃O⁺ sur la base A⁻ (ou HO⁻ sur l’acide AH) : le bilan de matière donne les quantités restantes. Si l’ajout dépasse la quantité du réactif du tampon, il reste un excès d’acide ou de base fort : le tampon est épuisé.</li>
      <li><strong>Formule du cours pH = pKa + log</strong> {FRapport} : le volume se simplifie, donc la dilution ne change pas le pH. Elle est une très bonne approximation pour un rapport entre 0,1 et 10 et un tampon assez concentré ; la simulation affiche un pH calculé plus finement (autoprotolyse de l’eau et bilan de charge compris), qui diffère de la formule de moins de 0,05 unité dans ces conditions.</li>
      <li><strong>Dilution très forte</strong> : au-delà d’une dilution de l’ordre de 1 000 fois, la formule cesse de s’appliquer (l’eau de dilution compte) ; la simulation se limite à une dilution par 10.</li>
      <li><strong>Un seul couple</strong> par tampon ; le sel de la base conjuguée est supposé entièrement dissocié. Les couples proposés sont choisis pour que la formule soit fiable.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, réglages, mesures ----------
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const scene = (enGuide && choixEtape) ? (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Quel couple pour quel pH ?</div>
      <SceneChoix cible={P.cible}/>
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enGuide && idE === 'eau' ? 'Eau pure' : 'Eau pure et tampon'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Les deux béchers reçoivent les mêmes ajouts. Les barres montrent les quantités de matière des deux formes du couple dans le tampon.</div>}
      <SceneTampon coupleId={coupleId} vA={vA} nAcide={nAcide} nBase={nBase} ve={ve} eau={enGuide ? sg.eau : true} tampon={enGuide ? sg.tampon : true}
        phEau={enGuide ? sg.phEau : true} phTampon={enGuide ? sg.phT : true} barres={barresMode}/>
    </div>);
  const net = nBase - nAcide, tampOK = e.tampon;
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="tp-couple" style={libelle}>Couple acide/base du tampon</label>
      <select id="tp-couple" value={ti.couple} onChange={ev => setTi(s => ({ ...s, couple: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.ORDRE.map(id => <option key={id} value={id}>{M.COUPLES[id].AH} / {M.COUPLES[id].A} · pKa {nbf(M.COUPLES[id].pKa, 1)}</option>)}
      </select>
      <Curseur nom="Volume de base A⁻ (mL)" valeur={ti.vA} onChange={v => setTi(s => ({ ...s, vA: v }))} min={10} max={90} pas={5} decimales={0} couleur="#c2410c"/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '0 0 8px', lineHeight: 1.5 }}>Le reste des 100 mL est de la solution d’acide ; les deux solutions sont à 0,10 mol·L⁻¹.</div>
      <label htmlFor="tp-ac" style={libelle}>Acide fort ajouté (mmol)</label>
      <select id="tp-ac" value={ti.nAcide} onChange={ev => setTi(s => ({ ...s, nAcide: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {[0, 1, 2, 3, 4, 5, 6, 8].map(v => <option key={v} value={v}>{nbf(v, 1)}</option>)}
      </select>
      <label htmlFor="tp-ba" style={libelle}>Base forte ajoutée (mmol)</label>
      <select id="tp-ba" value={ti.nBase} onChange={ev => setTi(s => ({ ...s, nBase: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {[0, 1, 2, 3, 4, 5, 6, 8].map(v => <option key={v} value={v}>{nbf(v, 1)}</option>)}
      </select>
      <label htmlFor="tp-ve" style={libelle}>Eau pure ajoutée (mL)</label>
      <select id="tp-ve" value={ti.ve} onChange={ev => setTi(s => ({ ...s, ve: Number(ev.target.value) }))} style={selectStyle}>
        {[0, 100, 400, 900].map(v => <option key={v} value={v}>{v === 0 ? 'aucune' : `${v} mL (dilution par ${(100 + v) / 100})`}</option>)}
      </select>
    </div>);
  const montrerMesures = enExplore || (enGuide && deja('melange') && !['eau'].includes(idE));
  const mesuresChoix = enGuide && choixEtape;
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>pH des deux béchers, pKa du couple et quantités de matière du tampon.</div>}
      {mesuresChoix ? <>
        <LigneMesure nom="pH visé" valeur={nbf(P.cible, 1)} couleur="#b91c1c"/>
        {deja('prep') && <><LigneMesure nom="Concentration des deux solutions" valeur={`0,10${NB}mol·L⁻¹`}/><LigneMesure nom="Volume de tampon à préparer" valeur={`100${NB}mL`}/></>}
      </> : <>
        <LigneMesure nom="pKa du couple" valeur={nbf(c.pKa, 1)}/>
        {barresMode && <>
          <LigneMesure nom={`n(${c.AH})`} valeur={`${nbf(eb.nAH, 1)}${NB}mmol`} couleur={COL.bleu}/>
          <LigneMesure nom={`n(${c.A})`} valeur={`${nbf(eb.nA, 1)}${NB}mmol`} couleur={COL.orange}/>
        </>}
        {(enExplore || (['phacide', 'base', 'equimol'].includes(idE) && apres('rapport'))) && eb.formuleOk && <LigneMesure nom={`Rapport frac(n(${c.A})|n(${c.AH}))`} valeur={nbf(M.arrondiCS(eb.r, 2), eb.r >= 10 ? 0 : eb.r >= 1 ? 1 : 2)} couleur={COL.vert}/>}
        {(enExplore || (enGuide && sg.phT)) && <LigneMesure nom="pH du tampon" valeur={nbf(e.pH, 2)} couleur="#b91c1c"/>}
        {(enExplore || (enGuide && sg.eau && sg.phEau)) && <LigneMesure nom="pH de l’eau pure" valeur={nbf(e.pHEau, 2)} couleur="#0284c7"/>}
        {enExplore && e.pHFormule !== null && <LigneMesure nom="pH par la formule du cours" valeur={nbf(e.pHFormule, 2)}/>}
        {enExplore && <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, fontWeight: 700, color: tampOK ? '#15803d' : '#b45309' }}>{tampOK ? 'Le tampon est efficace : rapport entre 0,1 et 10.' : e.excesH > 0 || e.excesOH > 0 ? 'Tampon épuisé : un des deux réactifs a disparu.' : 'Hors de la zone tampon : rapport en dehors de 0,1 à 10.'}</div>}
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Ajoutez 1 mmol d’acide fort au tampon équimolaire, puis à l’eau pure : comparez les deux variations de pH.</li>
      <li>Ajoutez de plus en plus d’acide fort : à partir de quelle quantité le tampon est-il épuisé ? Que devient son pH ?</li>
      <li>Diluez le tampon par 10 : que devient son pH ? Et celui de l’eau pure ?</li>
      <li>Déplacez le curseur de composition vers 10 mL de base, puis 90 mL : comment varie la résistance à un ajout d’acide ? À un ajout de base ?</li>
      <li>Choisissez un autre couple : où se trouve le pH d’un tampon équimolaire par rapport à son pKa ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Tampon : acide faible AH et base conjuguée A⁻ ; pH voisin du pKa malgré de petits ajouts d’acide ou de base et la dilution</li>
        <li>H₃O⁺ + A⁻ → AH + H₂O ; HO⁻ + AH → A⁻ + H₂O (réactions quasi totales : bilan de matière)</li>
        <li>pH = pKa + log({FRapport}) : le volume se simplifie, la dilution ne change pas le pH</li>
        <li>Zone tampon : pH = pKa ± 1, rapport entre 0,1 et 10 ; pouvoir tampon maximal à pH = pKa (équimolaire)</li>
        <li>Choisir le couple : pKa le plus proche du pH visé ; préparer : rapport des volumes = {F10} (concentrations égales)</li>
      </ul>
    </ARetenir>);
  const resume = `${c.AH} / ${c.A} · ${nbf(vA, 0)} mL de base`;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tp-col { display: flex; flex-direction: column; gap: 12px; }
        .tp-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .tp-l1.cote .tp-carte { order: 2; } .tp-l1.cote .tp-main { order: 1; }
          .tp-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .tp-ex > * { grid-column: 1; }
          .tp-ex > .tp-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .tp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tp-in { animation: tp-fondu 0.35s ease-out; } @keyframes tp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Solution tampon : choisir le couple et la préparer</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>tampon</strong> est un mélange d’un acide faible et de sa base conjuguée : son <strong>pH reste voisin du pKa</strong> quand on ajoute un peu d’acide ou de base, ou quand on le dilue. On apprend à expliquer son action, à choisir le couple et à le préparer.</div>
      {!enExplore && <div className={`tp-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="tp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="tp-carte">{panneauHypo}</div>}
        <div className="tp-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'prep' ? suiviP : suiviA}/></div>}
          {enGuide && <div className="tp-col">
            {!choixEtape && idE !== 'eau' && <Equation coupleId={coupleId}/>}
            {scene && <div className="tp-in">{scene}</div>}
            {mesures && <div className="tp-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="tp-ex">
          <Equation coupleId={coupleId}/>
          {scene}
          <div className="tp-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre={`Graphique : pH selon la quantité ajoutée (${resume})`} ouvert={!!ouv.graphe} onBascule={() => bascule('graphe')}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Courbe orange : le tampon ; courbe bleue : l’eau pure. À gauche de zéro on ajoute de l’acide fort, à droite de la base forte. Le point rouge est la situation réglée (ajout net = base moins acide).</div>
          <GrapheAjout coupleId={coupleId} vA={vA} ve={ve} net={net}/>
        </Section>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
