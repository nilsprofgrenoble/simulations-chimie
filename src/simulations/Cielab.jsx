import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, Formule, FormuleEnLigne, lireNombre } from "../commun";
import { Pic } from "../Pictos";
import * as C from "./couleurModele";
import * as M from "./cielabModele";
import { QCM } from "./cielabQcm";
import { VueLab3D } from "./Cielab3D";
import { SvgLuminosite, SvgPastilles, SvgPlanAB, SvgCarteAB, SvgCarteCyl, SvgCarteEcart, SvgCarteTolerance } from "./CielabSchemas";

const SIM_ID = 247, CLE_GUIDE = 'cielab-guide-v1';
declarerDefis(SIM_ID, [['ecart', 'Calculer ΔE*ab et décider si le lot est conforme'], ['lecture', 'Décrire l’écart : luminosité et saturation']]);

// ====================================================
//  SIM 247 — COULEUR : L*, a*, b* ET ÉCART DE COULEUR (BTS MDC, Formulation, « Aspect » ; fil rouge : le contrôle d'un lot de peinture bleue)
//  Capacités visées (jamais affichées à l'élève) : établir un lien entre la couleur d'un objet et teinte, luminosité, saturation ;
//  évaluer un écart colorimétrique à partir de (L*, a*, b*) et (L*, C*, h) ; exploiter les résultats avec la tolérance du cahier des charges (tolérance CMC).
//  Modèle : couleurModele.js et cielabModele.js (CIELAB, observateur 2°, D65). Schémas : CielabSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const n0 = v => String(Math.round(v)).replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['lum', 'plan', 'cyl', 'h', 'sat', 'ecart', 'deltaE', 'cyl-ecart', 'tolerance', 'retouche', 'cmc', 'bilan'];
const DEPART = { lum: { L: 60, a: 0, b: 0 }, plan: { L: 60, a: 0, b: 0 }, cyl: { L: 60, a: -24, b: 32 }, h: { L: 60, a: 20, b: 15 }, sat: { L: 60, a: 7, b: -19 }, retouche: M.LOT0 };
const ETAT0 = { L: 60, a: 0, b: 0 };
const TOUS_LOT = ['ecart', 'deltaE', 'cyl-ecart', 'tolerance', 'retouche'];
const PRESETS = [{ id: 'bleu', nom: 'Bleu ardoise (cours)', lab: M.CIBLE }, { id: 'vert', nom: 'Vert prairie', lab: { L: 55, a: -40, b: 35 } }, { id: 'rouge', nom: 'Rouge brique', lab: { L: 42, a: 38, b: 28 } }, { id: 'jaune', nom: 'Jaune moutarde', lab: { L: 72, a: 8, b: 55 } }, { id: 'gris', nom: 'Gris moyen', lab: { L: 55, a: 0, b: 0 } }];
// Notation mathématique classique : L*, a*, b*, C*, ΔE*ab…
const Sx = ({ l }) => <msup><mi>{l}</mi><mo>*</mo></msup>;
const Dx = ({ l }) => <mrow><mi>Δ</mi><Sx l={l}/></mrow>;
const Car = ({ l }) => <msup><mrow><mo stretchy="false">(</mo><Sx l={l}/><mo stretchy="false">)</mo></mrow><mn>2</mn></msup>;
const DCar = ({ l }) => <msup><mrow><mo stretchy="false">(</mo><Dx l={l}/><mo stretchy="false">)</mo></mrow><mn>2</mn></msup>;
const Pa = ({ children }) => <msup><mrow><mo stretchy="false">(</mo>{children}<mo stretchy="false">)</mo></mrow><mn>2</mn></msup>;
const Sq = ({ n }) => <msup><mn>{n}</mn><mn>2</mn></msup>;
const FormC = () => <><Sx l="C"/><mo>=</mo><msqrt><Car l="a"/><mo>+</mo><Car l="b"/></msqrt></>;
const FormH = () => <><mi>h</mi><mo>=</mo><mi>arctan</mi><mo lspace="0.2em" rspace="0.2em">⁡</mo><mfrac><Sx l="b"/><Sx l="a"/></mfrac></>;
const DE = () => <msubsup><mi>ΔE</mi><mi>ab</mi><mo>*</mo></msubsup>;
const FormDE = () => <><DE/><mo>=</mo><msqrt><DCar l="L"/><mo>+</mo><DCar l="a"/><mo>+</mo><DCar l="b"/></msqrt></>;
const Dd = ({ t }) => <mrow><mi>Δ</mi><msub><mi>δ</mi><mi>{t}</mi></msub></mrow>;
const Pc = ({ children }) => <msup><mrow><mo stretchy="false">(</mo>{children}<mo stretchy="false">)</mo></mrow><mn>2</mn></msup>;
const FormRa = () => <><msup><mi>Ra</mi><mn>2</mn></msup><mo>=</mo><mn>4</mn><Pc><Dd t="d"/></Pc><mo>+</mo><Pc><Dd t="p"/></Pc><mo>+</mo><Pc><Dd t="h"/></Pc></>;
const FormDE2 = () => <><msup><mrow><mo stretchy="false">(</mo><DE/><mo stretchy="false">)</mo></mrow><mn>2</mn></msup><mo>=</mo><DCar l="L"/><mo>+</mo><DCar l="a"/><mo>+</mo><DCar l="b"/></>;
const Fr = ({ num, den }) => <msup><mrow><mo stretchy="false">(</mo><mfrac>{num}{den}</mfrac><mo stretchy="false">)</mo></mrow><mn>2</mn></msup>;
const FormCMC = () => <><msubsup><mi>ΔE</mi><mi>CMC</mi><mn>2</mn></msubsup><mo>=</mo><Fr num={<Dx l="L"/>} den={<mrow><mi>l</mi><msub><mi>S</mi><mi>L</mi></msub></mrow>}/><mo>+</mo><Fr num={<Dx l="C"/>} den={<mrow><mi>c</mi><msub><mi>S</mi><mi>C</mi></msub></mrow>}/><mo>+</mo><Fr num={<Dx l="H"/>} den={<msub><mi>S</mi><mi>H</mi></msub>}/></>;
const sg = v => (v >= 0 ? '+' : '−') + fr(Math.abs(v), 1).replace('-', '');

export function SimulationCielab({ plotlyReady }) {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState(() => DEPART[ORDRE[Math.min(guide.etape ?? 0, ORDRE.length - 1)]] ?? (TOUS_LOT.includes(ORDRE[Math.min(guide.etape ?? 0, ORDRE.length - 1)]) ? M.LOT0 : ETAT0));
  const [ex, setEx] = useState({ cible: M.CIBLE, lot: M.LOT0, preset: 'bleu', echelle: 'large', autres: false, vue3d: 'proche', tolE: 1.5, tolC: 1 });
  const [ouv, setOuv] = useState({});
  const [suiviE, noterE] = useCompteurDefi(), [suiviL, noterL] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('ecart');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const ecV = C.ecartCylindrique(vie, M.CIBLE), eV = C.deltaE76(vie, M.CIBLE), lc = C.lch(vie);
  const lots = M.lotsTolerance(), cmcA = C.deltaCMC(lots.enC, M.CIBLE), cmcB = C.deltaCMC(lots.enH, M.CIBLE);
  const eLot = C.ecartCylindrique(M.LOT0, M.CIBLE), cLot = C.lch(M.LOT0).C;

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'lum', titre: 'La luminosité : L*', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Pour contrôler la couleur d’une peinture, on la mesure avec un <strong>spectrocolorimètre</strong>, qui donne trois nombres. Le premier est la <strong>luminosité L*</strong> : elle vaut <strong>0 pour le noir</strong> et <strong>100 pour le blanc parfait</strong>. Faites varier L* et observez l’échantillon gris. Le lot de peinture bleue à contrôler a L* = 35, alors que la teinte cible a L* = 45 (mêmes valeurs de a* et b*).</>,
      tache: { type: 'qcm', q: 'Par rapport à la cible, le lot est…', ...QCM.lum,
        expl: 'Plus L* est petit, plus la couleur est sombre : à L* = 35 le lot est plus foncé que la cible (L* = 45).', indice: 'Regardez la barre de gauche : en bas, L* = 0 (noir) ; en haut, L* = 100 (blanc).' } },
    { id: 'plan', titre: 'La teinte : a* et b*', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Les deux autres nombres, <strong>a*</strong> et <strong>b*</strong>, donnent la <strong>teinte</strong> et la vivacité de la couleur. Ils se lisent dans un plan : <strong>a*</strong> va du <strong>vert</strong> (valeurs négatives) au <strong>rouge</strong> (valeurs positives), <strong>b*</strong> va du <strong>bleu</strong> (négatives) au <strong>jaune</strong> (positives). Au centre, les couleurs sont grises. Déplacez le point avec les deux curseurs, puis répondez.</>,
      tache: { type: 'qcm', q: 'Un échantillon a a* = +40 et b* = +5. Sa teinte est plutôt…', ...QCM.plan,
        expl: 'a* = +40 est loin vers le côté rouge du plan, et b* = +5 est presque nul : la couleur est rouge (légèrement orangée).', indice: 'Cherchez d’abord de quel côté de l’axe a* se trouve +40, puis regardez si b* est grand ou petit.' } },
    { id: 'cyl', titre: 'Saturation et teinte : C* et h', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : les trois coordonnées', retenir: <>
        <SvgCarteAB/>
        <ul style={puces}>
          <li>L* : la luminosité, de 0 (noir) à 100 (blanc).</li>
          <li>a* et b* : la teinte, repérée dans un plan ; plus on s’éloigne du centre, plus la couleur est vive.</li>
        </ul></>,
      texte: <>On peut aussi repérer le point par sa <strong>distance au centre</strong>, notée <strong>C*</strong> (« chroma », c’est la <strong>saturation</strong> : 0 pour un gris, de plus en plus grand pour une couleur vive), et par l’<strong>angle h</strong> de sa direction, mesuré depuis l’axe +a* (c’est la <strong>teinte</strong>). Le point du schéma est un échantillon vert-jaune : <strong>a* = −24</strong> et <strong>b* = +32</strong>.</>,
      tache: { type: 'num', q: 'Saturation C* de cet échantillon', unite: '', vrai: 40, tol: 0.03, affiche: v => String(Math.round(v)), cs: 2,
        calcul: () => ['C* est la longueur du segment qui relie le centre au point : c’est l’hypoténuse d’un triangle de côtés |a*| = 24 et |b*| = 32.', <><FormuleEnLigne><FormC/></FormuleEnLigne> soit <FormuleEnLigne><Sx l="C"/><mo>=</mo><msqrt><Pa><mo>−</mo><mn>24</mn></Pa><mo>+</mo><Sq n="32"/></msqrt><mo>=</mo><msqrt><mn>1600</mn></msqrt><mo>=</mo><mn>40</mn></FormuleEnLigne>.</>],
        pieges: [[56, 'Vous avez additionné 24 et 32. La distance au centre est la racine de a*² + b*², pas la somme.'], [1600, 'Vous avez oublié la racine carrée : 1 600 est C*², pas C*.'], [8, 'Vous avez fait −24 + 32 : on ne peut pas additionner a* et b* directement, il faut les élever au carré.']],
        expl: 'C* = √(24² + 32²) = √1 600 = 40.', indice: <>La distance au centre se calcule avec le théorème de Pythagore : <FormuleEnLigne><FormC/></FormuleEnLigne>.</> } },
    { id: 'h', titre: 'L’angle de teinte h', focus: ['scene', 'mesures'],
      texte: <>L’angle <strong>h</strong> se mesure à partir de l’axe +a* (rouge), en tournant vers +b* (jaune) : 0° pour le rouge-magenta, 90° pour le jaune, 180° pour le vert, 270° pour le bleu. Voici un échantillon orangé : <strong>a* = +20</strong> et <strong>b* = +15</strong>. Avec votre calculatrice <strong>en degrés</strong>, calculez son angle h.</>,
      tache: { type: 'num', q: 'Angle de teinte h', unite: '°', vrai: Math.atan(15 / 20) * 180 / Math.PI, tol: 0.03, affiche: v => fr(v, 1), cs: 3,
        calcul: () => ['Dans le premier quadrant (a* et b* positifs), h est l’angle dont la tangente vaut b* / a*.', <><FormuleEnLigne><FormH/></FormuleEnLigne> soit <FormuleEnLigne><mi>h</mi><mo>=</mo><mi>arctan</mi><mo lspace="0.2em" rspace="0.2em">⁡</mo><mfrac><mn>15</mn><mn>20</mn></mfrac><mo>=</mo><mi>arctan</mi><mo lspace="0.2em" rspace="0.2em">⁡</mo><mn>0,75</mn><mo>≈</mo><mn>36,9</mn><mo>°</mo></FormuleEnLigne>.</>, 'Pour un point où a* est négatif, il faudrait ajouter 180° au résultat de la calculatrice.'],
        pieges: [[53.1, 'Vous avez calculé arctan(a* / b*). L’angle h se mesure depuis l’axe a*, donc la tangente est b* / a*.'], [0.64, 'Votre calculatrice est en radians : passez-la en degrés (0,64 rad ≈ 36,9°).'], [0.75, 'C’est le rapport b* / a*, pas l’angle : il faut en prendre l’arctangente.']],
        expl: 'h = arctan(15 / 20) = arctan(0,75) ≈ 36,9° : une teinte orangée, proche du rouge.', indice: <>La tangente de l’angle h vaut le rapport <FormuleEnLigne><mfrac><Sx l="b"/><Sx l="a"/></mfrac></FormuleEnLigne>.</> } },
    { id: 'sat', titre: 'Même teinte, plus de saturation', focus: ['scene', 'curseur', 'mesures'],
      retenirTitre: 'À retenir : C* et h', retenir: <>
        <SvgCarteCyl/>
        <ul style={puces}>
          <li>C* = distance au centre : la saturation. Un gris a C* = 0.</li>
          <li>h = angle de la direction : la teinte.</li>
        </ul></>,
      texte: <>Le curseur règle maintenant la <strong>saturation C*</strong> ; la luminosité L* et l’angle de teinte h restent fixes. Déplacez-le, puis répondez.</>,
      tache: { type: 'qcm', q: 'On augmente C* sans changer L* ni h. L’échantillon devient…', ...QCM.sat,
        expl: 'Quand le point s’éloigne du centre dans la même direction, la teinte (h) et la luminosité (L*) ne changent pas, mais la couleur est de plus en plus vive : elle est plus saturée.', indice: 'Regardez la couleur de l’échantillon et la position du point dans le plan quand vous éloignez le point du centre.' } },
    { id: 'ecart', titre: 'Comparer un lot à la cible', focus: ['scene', 'mesures'],
      texte: <>Revenons au contrôle de la peinture bleue. La <strong>cible</strong> du cahier des charges a pour coordonnées <strong>L* = 45, a* = 7, b* = −24</strong>. Le <strong>lot fabriqué</strong> a été mesuré : <strong>L* = 44, a* = 9, b* = −26</strong>. L’écart se calcule toujours <strong>lot − cible</strong>. Le plan, agrandi autour de la cible, montre les deux points.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire du lot par rapport à la cible ?', ...QCM.ecart,
        expl: 'ΔL* = 44 − 45 = −1 (plus foncé) ; Δa* = 9 − 7 = +2 (plus rouge) ; Δb* = −26 − (−24) = −2 (plus bleu, car b* diminue).', indice: 'Calculez les trois écarts lot − cible : un écart positif de L* veut dire plus clair, de a* plus rouge, de b* plus jaune.' } },
    { id: 'deltaE', titre: 'L’écart de couleur ΔE*ab', focus: ['scene'],
      texte: <>Pour résumer les trois écarts en <strong>un seul nombre</strong>, on calcule la distance entre les deux points dans l’espace L*a*b* : c’est l’<strong>écart de couleur ΔE*ab</strong>. Les trois écarts du lot sont ΔL* = −1, Δa* = +2 et Δb* = −2.</>,
      tache: { type: 'num', q: 'Écart de couleur ΔE*ab entre le lot et la cible', unite: '', vrai: 3, tol: 0.03, affiche: v => fr(v, 1), cs: 2,
        calcul: () => ['On applique la formule de la distance, comme pour C* mais avec trois coordonnées.', <><FormuleEnLigne><FormDE/></FormuleEnLigne> soit <FormuleEnLigne><DE/><mo>=</mo><msqrt><Pa><mo>−</mo><mn>1</mn></Pa><mo>+</mo><Sq n="2"/><mo>+</mo><Pa><mo>−</mo><mn>2</mn></Pa></msqrt><mo>=</mo><msqrt><mn>9</mn></msqrt><mo>=</mo><mn>3,0</mn></FormuleEnLigne>.</>],
        pieges: [[9, 'Vous n’avez pas pris la racine carrée : 9 est ΔE*ab².'], [5, 'Vous avez additionné les valeurs absolues (1 + 2 + 2). Il faut élever chaque écart au carré, additionner, puis prendre la racine.'], [-1, 'Vous avez donné ΔL*. Il faut combiner les trois écarts.']],
        expl: 'ΔE*ab = √((−1)² + 2² + (−2)²) = √9 = 3,0.', indice: <>Élevez chaque écart au carré, additionnez, puis prenez la racine : <FormuleEnLigne><FormDE/></FormuleEnLigne>.</> } },
    { id: 'cyl-ecart', titre: 'Décrire l’écart : ΔL*, ΔC*, ΔH*', focus: ['scene'],
      retenirTitre: 'À retenir : lire un écart de couleur', retenir: <>
        <SvgCarteEcart/>
        <Formule><FormDE/></Formule>
        <ul style={puces}>
          <li>ΔE*ab est un nombre positif : la distance entre le lot et la cible.</li>
          <li>ΔL*, ΔC*, ΔH* disent dans quel sens le lot s’écarte : plus clair ou plus foncé, plus saturé ou plus terne, teinte décalée.</li>
        </ul></>,
      texte: <>Les logiciels de contrôle donnent aussi l’écart sous forme <strong>cylindrique</strong> : <strong>ΔL*</strong> (luminosité), <strong>ΔC*</strong> (saturation) et <strong>ΔH*</strong> (teinte), pour dire dans quel sens le lot s’écarte. La cible a une saturation <strong>C* = 25</strong>. Calculez celle du lot (a* = 9, b* = −26), puis l’écart de saturation ΔC* = C*<sub>lot</sub> − C*<sub>cible</sub>.</>,
      tache: { type: 'num', q: 'Écart de saturation ΔC* (lot − cible)', unite: '', vrai: eLot.dC, tol: 0.06, affiche: v => fr(v, 1), cs: 2,
        calcul: () => [<>Saturation du lot : <FormuleEnLigne><Sx l="C"/><mo>=</mo><msqrt><Sq n="9"/><mo>+</mo><Pa><mo>−</mo><mn>26</mn></Pa></msqrt><mo>=</mo><msqrt><mn>757</mn></msqrt><mo>≈</mo><mn>{fr(cLot, 1)}</mn></FormuleEnLigne>.</>, `ΔC* = C* du lot − C* de la cible = ${fr(cLot, 1)} − 25 = ${sg(eLot.dC)}.`, 'ΔC* est positif : le lot est plus saturé que la cible.'],
        pieges: [[-eLot.dC, 'Vous avez soustrait dans l’autre sens. L’écart se calcule toujours lot − cible : positif = lot plus saturé.'], [26, 'Vous avez pris |b*| du lot. La saturation du lot est la racine de a*² + b*².'], [2, 'C’est Δa*. Il faut calculer la saturation C* du lot, puis la comparer à celle de la cible (25).']],
        expl: `C* du lot ≈ ${fr(cLot, 1)}, donc ΔC* ≈ ${sg(eLot.dC)} : le lot est un peu plus saturé que la cible.`, indice: <>Calculez d’abord <FormuleEnLigne><FormC/></FormuleEnLigne> pour le lot, puis soustrayez 25.</> } },
    { id: 'tolerance', titre: 'La tolérance du cahier des charges', focus: ['scene', 'mesures'],
      texte: <>Le cahier des charges fixe une <strong>tolérance</strong> : le lot est conforme si <strong>ΔE*ab ≤ 1,5</strong>. Pour comparaison, un écart d’environ 1 est à peu près le plus petit que l’œil perçoit quand on compare deux échantillons côte à côte.</>,
      tache: { type: 'qcm', q: 'Le lot (ΔE*ab = 3,0) est-il conforme ?', ...QCM.tolerance,
        expl: 'La tolérance porte sur ΔE*ab, l’écart global : 3,0 est supérieur à 1,5, le lot est refusé. On ne juge pas chaque coordonnée séparément.', indice: 'Comparez directement l’écart ΔE*ab du lot à la valeur maximale du cahier des charges.' } },
    { id: 'retouche', titre: 'Mettre à la teinte : retoucher le lot', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Le formulateur ajuste la formule : ajouter un peu de pigment ou de blanc modifie les trois coordonnées du lot. Réglez les curseurs pour <strong>ramener le lot dans la tolérance</strong> (ΔE*ab ≤ 1,5). Observez ce que chaque curseur fait à l’écart.</>,
      tache: { type: 'action', ok: eV <= M.TOL_ECART, consigne: 'Ramener ΔE*ab à 1,5 ou moins' } },
    { id: 'cmc', titre: 'Pourquoi la tolérance CMC ?', focus: ['scene', 'mesures'],
      texte: <>Deux autres lots, <strong>A</strong> et <strong>B</strong>, sont tous deux à <strong>ΔE*ab = 1,5</strong> de la cible (cercle violet) : A est décalé en saturation, B en teinte. Pourtant, l’œil juge A acceptable et B trop différent. La <strong>tolérance CMC</strong> en tient compte : sa zone (en vert) est une <strong>ellipse</strong> plutôt qu’un cercle. Le lot A est dedans, le lot B dehors.</>,
      tache: { type: 'qcm', q: 'Pourquoi la tolérance CMC accepte-t-elle A et refuse-t-elle B ?', ...QCM.cmc,
        expl: 'L’œil est plus sensible à un décalage de teinte qu’à un décalage de saturation : la tolérance CMC accepte plus d’écart dans le sens de la saturation (grand axe de l’ellipse) que dans celui de la teinte (petit axe).', indice: 'Comparez la forme du cercle et celle de l’ellipse : dans quelle direction chaque lot s’écarte-t-il, et quelle zone est la plus étroite ?' } },
    { id: 'bilan', titre: 'Le bilan : contrôler la couleur d’un lot', focus: [],
      retenirTitre: 'À retenir : une tolérance n’est pas une sphère', retenir: <>
        <SvgCarteTolerance/>
        <ul style={puces}>
          <li>ΔE*ab est la distance entre lot et cible ; le cahier des charges en fixe le maximum.</li>
          <li>Deux lots de même ΔE*ab ne sont pas équivalents : l’œil tolère moins d’écart de teinte que de saturation.</li>
          <li>La tolérance CMC remplace la sphère par une ellipsoïde ; l’écart se lit alors avec ΔL*, ΔC*, ΔH*.</li>
        </ul></>,
      texte: <>Vous savez lire L*, a*, b*, C* et h, calculer l’écart ΔE*ab entre un lot et la cible, décrire le sens de l’écart et le comparer à la tolérance du cahier des charges. En exploration, vous pouvez régler la cible, le lot et les tolérances, faire tourner l’espace L*a*b* en 3D et comparer ces formules à celles de la sphère de Hansen (même idée : une distance pondérée comparée à un rayon) ; les défis testent le calcul et la lecture des écarts.</> },
  ];
  const IDS = ORDRE, etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const departDe = id => DEPART[id] ?? (TOUS_LOT.includes(id) ? M.LOT0 : ETAT0);
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => departDe(IDS[ni]));
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE, pastille = lab => <div aria-hidden="true" style={{ height: 26, borderRadius: 6, background: C.cssDeLab(lab), border: '1.5px solid #334155', marginBottom: 6 }}/>;
  const zoomCible = demi => ({ centre: M.CIBLE, demi });
  const sceneGuide = !enGuide ? null
    : sc === 'lum' ? <SvgLuminosite lab={{ L: vie.L, a: 0, b: 0 }}/>
    : sc === 'plan' ? <>{pastille(vie)}<SvgPlanAB pts={[{ lab: vie, nom: '', col: '#0f172a' }]} lfond={60}/></>
    : ['cyl', 'h', 'sat'].includes(sc) ? <>{sc === 'sat' && pastille(vie)}<SvgPlanAB pts={[{ lab: vie, nom: '', col: '#0f172a', cyl: true }]} lfond={60}/></>
    : sc === 'cmc' ? <SvgPlanAB zoom={zoomCible(3.2)} pts={[{ lab: M.CIBLE, nom: 'Cible', col: '#0f172a' }, { lab: lots.enC, nom: 'A', col: COL.orange }, { lab: lots.enH, nom: 'B', col: COL.rouge }]} tol={{ cible: M.CIBLE, tolE: M.TOL_ECART, tolCMC: M.TOL_CMC }}/>
    : sc === 'bilan' ? null
    : <><SvgPastilles cible={M.CIBLE} lot={sc === 'retouche' ? vie : M.LOT0}/><SvgPlanAB zoom={zoomCible(sc === 'retouche' ? 8 : 5)} pts={[{ lab: M.CIBLE, nom: 'Cible', col: '#0f172a' }, { lab: sc === 'retouche' ? vie : M.LOT0, nom: 'Lot', col: COL.orange }]} tol={sc === 'retouche' || sc === 'tolerance' ? { cible: M.CIBLE, tolE: M.TOL_ECART, tolCMC: 0 } : null}/></>;
  const MES_GUIDE = {
    lum: [['Luminosité L*', n0(vie.L)]],
    plan: [['a*', n0(vie.a)], ['b*', n0(vie.b)]],
    cyl: [['a*', n0(vie.a)], ['b*', n0(vie.b)]],
    h: [['a*', n0(vie.a)], ['b*', n0(vie.b)]],
    sat: [['Saturation C*', fr(lc.C, 1)], ['Angle de teinte h', `${fr(lc.h, 1)} °`]],
    ecart: [['Cible', 'L* 45 · a* 7 · b* −24'], ['Lot', 'L* 44 · a* 9 · b* −26']],
    tolerance: [['ΔE*ab du lot', '3,0'], ['Tolérance du cahier des charges', '1,5']],
    retouche: [['ΔL*', sg(ecV.dL)], ['Δa*', sg(vie.a - M.CIBLE.a)], ['Δb*', sg(vie.b - M.CIBLE.b)], ['ΔE*ab', fr(eV, 1)], ['Tolérance', '1,5']],
    cmc: [['Lots A et B : ΔE*ab', '1,5 chacun'], ['Écart CMC du lot A', fr(cmcA, 1)], ['Écart CMC du lot B', fr(cmcB, 1)], ['Tolérance CMC', '1,0']],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && ['lum', 'plan', 'sat', 'retouche'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {sc === 'lum' && curs('cl-gl', `Luminosité L* : ${n0(vie.L)}`, vie.L, 0, 100, 1, ev => setVie(s => ({ ...s, L: parseInt(ev.target.value, 10) })), '0 : noir ; 100 : blanc.')}
      {sc === 'plan' && <>
        {curs('cl-ga', `a* : ${n0(vie.a)}`, vie.a, -60, 60, 1, ev => setVie(s => ({ ...s, a: parseInt(ev.target.value, 10) })), 'Du vert (négatif) au rouge (positif).')}
        {curs('cl-gb', `b* : ${n0(vie.b)}`, vie.b, -60, 60, 1, ev => setVie(s => ({ ...s, b: parseInt(ev.target.value, 10) })), 'Du bleu (négatif) au jaune (positif).')}
      </>}
      {sc === 'sat' && curs('cl-gc', `Saturation C* : ${fr(lc.C, 0)}`, Math.round(lc.C), 4, 60, 1, ev => setVie(s => C.labDeLch({ L: s.L, C: parseInt(ev.target.value, 10), h: C.lch(s).h })), 'Distance au centre ; L* et h ne changent pas.')}
      {sc === 'retouche' && <>
        {curs('cl-rl', `Lot, luminosité L* : ${fr(vie.L, 1)}`, vie.L, M.CIBLE.L - 8, M.CIBLE.L + 8, 0.5, ev => setVie(s => ({ ...s, L: parseFloat(ev.target.value) })), 'Plus clair ou plus foncé.')}
        {curs('cl-ra', `Lot, a* : ${fr(vie.a, 1)}`, vie.a, M.CIBLE.a - 8, M.CIBLE.a + 8, 0.5, ev => setVie(s => ({ ...s, a: parseFloat(ev.target.value) })), 'Plus vert ou plus rouge.')}
        {curs('cl-rb', `Lot, b* : ${fr(vie.b, 1)}`, vie.b, M.CIBLE.b - 8, M.CIBLE.b + 8, 0.5, ev => setVie(s => ({ ...s, b: parseFloat(ev.target.value) })), 'Plus bleu ou plus jaune.')}
        <button onClick={() => setVie(M.LOT0)} style={{ ...stylePetitBouton(false), marginTop: 8 }}><Pic n="refresh"/>Rétablir le lot de départ</button>
      </>}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'ecart' ? { kind, ...M.tirageEcart(Math.random), rep: '', verdict: '', verifie: false } : { kind, ...M.tirageLecture(Math.random), repL: '', repS: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'ecart') { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.abs(a - defi.vrai) <= 0.1 && defi.verdict === (defi.conforme ? 'oui' : 'non'); noterE(ok); }
    else { ok = defi.repL === defi.lum && defi.repS === defi.sat; noterL(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const maj = f => setDefi(d => ({ ...d, ...f, verifie: false }));
  const labTxt = l => `L* = ${n0(l.L)}, a* = ${n0(l.a)}, b* = ${n0(l.b)}`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ecart', 'Calculer ΔE*ab'], ['lecture', 'Décrire l’écart']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'ecart' ? 'Défi : le lot est-il conforme ?' : 'Défi : dans quel sens le lot s’écarte-t-il ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>
        {defi.kind === 'ecart'
          ? <>Cible : {labTxt(defi.cible)}. Lot : {labTxt(defi.lot)}. Le cahier des charges impose <strong>ΔE*ab ≤ {fr(defi.tol, 1)}</strong>. Calculez ΔE*ab (à 0,1 près) et indiquez si le lot est conforme.</>
          : <>Cible : {labTxt(defi.cible)}. Lot : {labTxt(defi.lot)}. Comparez le lot à la cible (écart lot − cible) : luminosité et saturation.</>}
      </div>
      <SvgPastilles cible={defi.cible} lot={defi.lot}/>
      {defi.kind === 'ecart' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><label htmlFor="cl-r">ΔE*ab = </label>
          <input id="cl-r" value={defi.rep} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('cl-verif')?.click()} onChange={ev => maj({ rep: ev.target.value })} style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/></div>
        {selecteur('cl-v', 'Le lot est-il conforme ?', defi.verdict, ev => maj({ verdict: ev.target.value }), [{ id: 'oui', nom: 'Oui, conforme' }, { id: 'non', nom: 'Non, hors tolérance' }], 'Choisir…')}
      </>}
      {defi.kind === 'lecture' && <>
        {selecteur('cl-l', 'Luminosité du lot', defi.repL, ev => maj({ repL: ev.target.value }), [{ id: 'plus clair', nom: 'Plus clair que la cible' }, { id: 'plus foncé', nom: 'Plus foncé que la cible' }, { id: 'identique', nom: 'Identique' }], 'Choisir…')}
        {selecteur('cl-s', 'Saturation du lot', defi.repS, ev => maj({ repS: ev.target.value }), [{ id: 'plus saturé', nom: 'Plus saturé que la cible' }, { id: 'plus terne', nom: 'Plus terne que la cible' }, { id: 'identique', nom: 'Identique' }], 'Choisir…')}
      </>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'ecart'
        ? <>Calculez les trois écarts lot − cible, puis <FormuleEnLigne><FormDE/></FormuleEnLigne>, et comparez à la tolérance.</>
        : <>ΔL* = L* lot − L* cible : positif, plus clair. Pour la saturation, calculez C* = √(a*² + b*²) pour la cible et pour le lot, puis comparez.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="cl-verif" onClick={verifier} disabled={defi.kind === 'ecart' ? !(defi.rep && defi.verdict) : !(defi.repL && defi.repS)} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'ecart' && <>ΔE*ab = {fr(defi.vrai, 1)} : {defi.conforme ? 'conforme' : 'hors tolérance'} (tolérance {fr(defi.tol, 1)}).</>}
        {defi.kind === 'lecture' && <>Le lot est {defi.lum} et {defi.sat} que la cible.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const ecX = C.ecartCylindrique(ex.lot, ex.cible), eX = C.deltaE76(ex.lot, ex.cible), cmcX = C.deltaCMC(ex.lot, ex.cible);
  const setLot = k => ev => setEx(x => ({ ...x, lot: { ...x.lot, [k]: parseFloat(ev.target.value) } }));
  const setCible = k => ev => setEx(x => ({ ...x, preset: 'perso', cible: { ...x.cible, [k]: parseFloat(ev.target.value) } }));
  const choisirPreset = ev => { const p = PRESETS.find(q => q.id === ev.target.value); if (p) setEx(x => ({ ...x, preset: p.id, cible: p.lab, lot: { L: p.lab.L - 1, a: p.lab.a + 2, b: p.lab.b - 2 } })); };
  const resume = l => `L* ${fr(l.L, 0)} · a* ${fr(l.a, 0)} · b* ${fr(l.b, 0)}`;
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {selecteur('cl-xp', 'Cible (teinte à reproduire)', ex.preset === 'perso' ? '' : ex.preset, choisirPreset, PRESETS, ex.preset === 'perso' ? 'Cible personnalisée' : null)}
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 2 }}>Choisir une cible place un lot proche, à 3 unités d’écart.</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '10px 0 0' }}>Le lot</div>
      {curs('cl-xl', `Luminosité L* : ${fr(ex.lot.L, 1)}`, ex.lot.L, Math.max(0, ex.cible.L - 6), Math.min(100, ex.cible.L + 6), 0.5, setLot('L'))}
      {curs('cl-xa', `a* : ${fr(ex.lot.a, 1)}`, ex.lot.a, ex.cible.a - 6, ex.cible.a + 6, 0.5, setLot('a'))}
      {curs('cl-xb', `b* : ${fr(ex.lot.b, 1)}`, ex.lot.b, ex.cible.b - 6, ex.cible.b + 6, 0.5, setLot('b'))}
      <Section titre={`Régler la cible (${resume(ex.cible)})`} ouvert={!!ouv.cible} onBascule={() => bascule('cible')}>
        {curs('cl-xcl', `Cible, L* : ${fr(ex.cible.L, 0)}`, ex.cible.L, 15, 95, 1, setCible('L'))}
        {curs('cl-xca', `Cible, a* : ${fr(ex.cible.a, 0)}`, ex.cible.a, -50, 50, 1, setCible('a'))}
        {curs('cl-xcb', `Cible, b* : ${fr(ex.cible.b, 0)}`, ex.cible.b, -50, 50, 1, setCible('b'))}
      </Section>
      <Section titre={`Tolérances (ΔE*ab ≤ ${fr(ex.tolE, 1)} ; CMC ≤ ${fr(ex.tolC, 1)})`} ouvert={!!ouv.tol} onBascule={() => bascule('tol')}>
        {curs('cl-xte', `Tolérance sur ΔE*ab : ${fr(ex.tolE, 1)}`, ex.tolE, 0.5, 4, 0.1, ev => setEx(x => ({ ...x, tolE: parseFloat(ev.target.value) })), 'Cercle violet sur le plan.')}
        {curs('cl-xtc', `Tolérance CMC(2:1) : ${fr(ex.tolC, 1)}`, ex.tolC, 0.5, 2.5, 0.1, ev => setEx(x => ({ ...x, tolC: parseFloat(ev.target.value) })), 'Ellipse verte sur le plan.')}
      </Section>
    </div>);
  const planLarge = ex.echelle === 'large';
  const planEx = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Cible et lot</div>
      <SvgPastilles cible={ex.cible} lot={ex.lot}/>
      <div style={{ marginTop: 8 }}>
        {selecteur('cl-xe', 'Échelle du plan a*b*', ex.echelle, ev => setEx(x => ({ ...x, echelle: ev.target.value })), [{ id: 'large', nom: 'Plan entier (±60)' }, { id: 'zoom', nom: 'Agrandi autour de la cible (±7)' }])}
      </div>
      {planLarge && <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: KIT.txt, margin: '8px 0 2px', minHeight: 32, cursor: 'pointer' }}>
        <input type="checkbox" checked={ex.autres} onChange={ev => setEx(x => ({ ...x, autres: ev.target.checked }))} style={{ width: 18, height: 18 }}/>Montrer d’autres ellipses CMC (agrandies ×{M.AGRANDI})</label>}
      <SvgPlanAB lfond={Math.round(ex.cible.L)} zoom={planLarge ? null : { centre: ex.cible, demi: 7 }} repere={planLarge}
        autres={planLarge && ex.autres ? { positions: M.POSITIONS_ELLIPSES, tolC: ex.tolC, k: M.AGRANDI } : null}
        pts={[{ lab: ex.cible, nom: 'Cible', col: '#0f172a' }, { lab: ex.lot, nom: 'Lot', col: COL.orange }]}
        tol={{ cible: ex.cible, tolE: ex.tolE, tolCMC: ex.tolC }}/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        Cercle violet : tolérance sur ΔE*ab. Ellipse verte : tolérance CMC (zone d’écarts acceptés autour de la cible). Fond : les couleurs de même luminosité L* que la cible ; les cercles blancs marquent la saturation C* = 20, 40 et 60. Dans le plan entier, la flèche C* indique le sens de la saturation (distance au centre) et l’arc h celui de la teinte (angle depuis +a*).
        {planLarge && ex.autres && <> Les autres ellipses CMC sont agrandies {M.AGRANDI} fois pour être visibles : près du gris elles sont presque rondes et petites ; plus la couleur est saturée, plus elles sont grandes et allongées vers l’extérieur (la saturation est tolérée plus que la teinte).</>}
        {planLarge && ' Les couleurs trop vives pour l’écran sont approchées.'}
      </div>
    </div>);
  const vue3D = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Vue 3D : l’espace L*a*b*</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginBottom: 6 }}>Faites tourner la vue avec la souris ou le doigt. Le plan coloré est celui de la luminosité L* de la cible ; la hauteur est L*. {ex.vue3d === 'proche' ? 'La sphère violette est la tolérance sur ΔE*ab, l’ellipsoïde vert la tolérance CMC : à la même valeur, l’ellipsoïde est étiré selon la saturation et la luminosité, et resserré selon la teinte.' : 'Les ellipsoïdes CMC sont agrandis ×' + M.AGRANDI + ' : ils changent de taille et d’orientation selon la couleur.'}</div>
      {selecteur('cl-x3', 'Échelle de la vue 3D', ex.vue3d, ev => setEx(x => ({ ...x, vue3d: ev.target.value })), [{ id: 'proche', nom: 'Autour de la cible (tailles réelles)' }, { id: 'entier', nom: 'Espace entier (ellipsoïdes agrandis)' }])}
      <div style={{ marginTop: 8 }}><VueLab3D plotlyReady={plotlyReady} cible={ex.cible} lot={ex.lot} tolE={ex.tolE} tolC={ex.tolC} mode={ex.vue3d}/></div>
    </div>);
  const parallele = (
    <Section titre="Parallèle avec Hansen : l’écart entre deux points" ouvert={ouv.hansen !== false} onBascule={() => setOuv(o => ({ ...o, hansen: o.hansen === false }))}>
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55, marginBottom: 8 }}>La simulation « Paramètres de solubilité de Hansen » et celle-ci reposent sur la <strong>même idée</strong> : un objet (un solvant, une couleur) est un point dans un espace à 3 coordonnées ; on mesure sa <strong>distance</strong> à une référence (un polymère, une cible) et on la compare à un <strong>rayon acceptable</strong>.</div>
      <div className="cl-par">
        <div style={{ border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 10px', background: 'white' }}>
          <div style={{ fontWeight: 700, color: '#6a4c93', fontSize: 14.5 }}>Hansen : solubilité</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: KIT.txt }}>Un point : (δ<sub>d</sub>, δ<sub>p</sub>, δ<sub>h</sub>)<br/>Distance au polymère :</div>
          <Formule><FormRa/></Formule>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: KIT.txt }}>Le facteur 4 est constant : il équivaut à tracer 2δ<sub>d</sub>, et le domaine de solubilité devient une <strong>sphère de rayon R<sub>0</sub></strong>.<br/>Verdict : <strong>RED = Ra / R<sub>0</sub> &lt; 1</strong>, le solvant dissout.<br/>R<sub>0</sub> est ajusté sur des essais de solubilité.</div>
        </div>
        <div style={{ border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 10px', background: 'white' }}>
          <div style={{ fontWeight: 700, color: '#0e7490', fontSize: 14.5 }}>Couleur : écart de teinte</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: KIT.txt }}>Un point : (L*, a*, b*)<br/>Distance à la cible :</div>
          <Formule><FormDE2/></Formule>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: KIT.txt }}>Sans pondération, le domaine acceptable est une <strong>sphère de rayon égal à la tolérance</strong>.<br/>Verdict : <strong>ΔE*ab / tolérance ≤ 1</strong>, le lot est conforme (comme RED &lt; 1).<br/>La tolérance vient du cahier des charges.</div>
        </div>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: KIT.txt, margin: '8px 0 2px' }}>Avec la tolérance <strong>CMC</strong>, on retrouve l’astuce du facteur 4 : on <strong>pondère chaque coordonnée</strong> pour que le domaine acceptable redevienne une sphère de rayon 1 :</div>
      <Formule><FormCMC/></Formule>
      <ul style={{ ...liste, fontSize: 13.5, marginTop: 2 }}>
        <li><strong>Pareil</strong> : on pondère les écarts, puis on compare une distance à un rayon. Dans les deux cas, la pondération vient d’observations (essais de solubilité, jugements visuels) et non d’une loi établie.</li>
        <li><strong>Différent</strong> : chez Hansen la pondération est la même partout (4, 1, 1). En CMC, S<sub>L</sub>, S<sub>C</sub> et S<sub>H</sub> dépendent de la couleur de la cible : c’est pourquoi les ellipses n’ont pas la même forme partout.</li>
        <li><strong>Différent</strong> : R<sub>0</sub> décrit une propriété du polymère ; la tolérance décrit une exigence du client.</li>
      </ul>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: KIT.txt, marginTop: 4 }}>Votre lot : ΔE*ab = <strong>{fr(eX, 2)}</strong> pour une tolérance de <strong>{fr(ex.tolE, 1)}</strong>, soit un rapport de <strong style={{ color: eX <= ex.tolE ? COL.vert : COL.rouge }}>{fr(eX / ex.tolE, 2)}</strong> : {eX <= ex.tolE ? 'à l’intérieur de la sphère, comme un solvant de RED inférieur à 1.' : 'à l’extérieur de la sphère, comme un solvant de RED supérieur à 1.'}</div>
    </Section>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les écarts lot − cible</div>
      <LigneMesure nom="ΔL* (luminosité)" valeur={sg(ecX.dL)}/>
      <LigneMesure nom="Δa* · Δb*" valeur={`${sg(ex.lot.a - ex.cible.a)} · ${sg(ex.lot.b - ex.cible.b)}`}/>
      <LigneMesure nom="ΔC* (saturation)" valeur={sg(ecX.dC)}/>
      <LigneMesure nom="ΔH* (teinte)" valeur={sg(ecX.dH)}/>
      <LigneMesure nom="ΔE*ab" valeur={fr(eX, 2)} couleur={eX <= ex.tolE ? COL.vert : COL.rouge}/>
      <LigneMesure nom="ΔE*ab ÷ tolérance (comme le RED)" valeur={fr(eX / ex.tolE, 2)} couleur={eX <= ex.tolE ? COL.vert : COL.rouge}/>
      <LigneMesure nom="Écart CMC(2:1)" valeur={fr(cmcX, 2)} couleur={cmcX <= ex.tolC ? COL.vert : COL.rouge}/>
      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>Verdict ΔE*ab : <strong>{eX <= ex.tolE ? 'conforme' : 'hors tolérance'}</strong> · verdict CMC : <strong>{cmcX <= ex.tolC ? 'conforme' : 'hors tolérance'}</strong></div>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Avec le lot de départ, déplacez seulement a* ou b* : quelle direction fait le plus monter ΔE*ab ?</li>
      <li>Trouvez deux lots de même ΔE*ab, l’un accepté par la tolérance CMC et l’autre refusé. Dans quelle direction s’écartent-ils ?</li>
      <li>Choisissez la cible grise : que vaut sa saturation ? Que devient l’ellipse CMC ?</li>
      <li>Réglez ΔL* seul : la tolérance CMC (2:1) tolère-t-elle plus ou moins d’écart de luminosité que de saturation ?</li>
      <li>Cochez « Montrer d’autres ellipses CMC » : où sont-elles les plus grandes ? Dans quelle direction sont-elles allongées ?</li>
      <li>Dans la vue 3D, tournez jusqu’à voir la sphère et l’ellipsoïde de profil : dans quelle direction l’ellipsoïde dépasse-t-il de la sphère ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>L* : luminosité (0 noir, 100 blanc) ; a* : vert → rouge ; b* : bleu → jaune</li>
        <li>C* = √(a*² + b*²) : saturation ; h = arctan(b*/a*) : teinte (angle depuis +a*)</li>
        <li>ΔE*ab = √(ΔL*² + Δa*² + Δb*²), toujours calculé lot − cible pour les signes</li>
        <li>Le cahier des charges fixe la tolérance maximale sur l’écart</li>
        <li>La tolérance CMC est une ellipsoïde : l’œil tolère moins d’écart de teinte que de saturation</li>
        <li>Comme chez Hansen : on pondère les écarts, puis on compare une distance à un rayon (RED = Ra / R<sub>0</sub>, ΔE*ab / tolérance)</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Espace de couleur</strong> : CIELAB (CIE 1976), observateur standard 2°, illuminant D65. ΔE*ab est la distance euclidienne dans l’espace L*a*b* ; ΔH* est défini par ΔE*ab² = ΔL*² + ΔC*² + ΔH*², signé selon le sens de variation de h.</li>
      <li><strong>Tolérance CMC(2:1)</strong> : formule de Clarke, McDonald et Rigg (1984) avec l = 2 et c = 1 (réglage usuel pour juger l’acceptabilité). Elle remplace la sphère de tolérance par une ellipsoïde dont les axes dépendent de la couleur de la cible.</li>
      <li><strong>Couleurs à l’écran</strong> : conversion en sRGB (blanc D65), sans calibrage de votre écran. Les couleurs de l’écran sont indicatives ; ce sont les nombres qui font foi. Une couleur trop vive pour l’écran est écrêtée (approchée) sur le fond du plan et dans la vue 3D.</li>
      <li><strong>Valeurs illustratives</strong> : cible, lots et tolérances (ΔE*ab ≤ 1,5 ; CMC ≤ 1,0) sont inventés pour l’exercice. Le cahier des charges réel fixe ses propres valeurs ; « environ 1 » comme plus petit écart perceptible est un ordre de grandeur, qui dépend de l’observateur et de la couleur.</li>
      <li><strong>Parallèle avec Hansen</strong> : c’est une analogie de méthode (distance pondérée comparée à un rayon), pas une équivalence physique : les grandeurs, les unités et l’origine des seuils sont différentes. La vue 3D à l’échelle de la cible garde les tailles réelles ; les ellipses et ellipsoïdes de l’espace entier sont agrandis ×4 pour être visibles, et dessinés à la luminosité L* de la cible.</li>
      <li><strong>Hors modèle</strong> : géométrie de mesure et brillance, changement d’illuminant (voir la simulation sur le métamérisme), autres formules d’écart (CIEDE2000), incertitude de l’appareil.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cl-par { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
        .cl-col { display: flex; flex-direction: column; gap: 12px; }
        .cl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .cl-l1.cote .cl-carte { order: 2; } .cl-l1.cote .cl-main { order: 1; }
          .cl-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .cl-ex > * { grid-column: 1; }
          .cl-ex > .cl-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .cl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cl-in { animation: cl-fondu 0.35s ease-out; } @keyframes cl-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .cl-l1 *, .cl-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Couleur : L*, a*, b* et écart de couleur</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un spectrocolorimètre exprime une couleur par trois nombres, <strong>L*</strong>, <strong>a*</strong> et <strong>b*</strong>. On apprend à les lire, à calculer l’<strong>écart de couleur</strong> entre un lot de peinture et sa teinte cible, et à le comparer à la <strong>tolérance</strong> du cahier des charges.</div>
      {enGuide && <div className="cl-l1 cote">
        <div className="cl-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="cl-main">
          <div className="cl-col">
            {sceneBloc && <div className="cl-in">{sceneBloc}</div>}
            {curseurGuide && <div className="cl-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="cl-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'ecart' ? suiviE : suiviL}/></div>}
      {enExplore && <>
        <div className="cl-ex">
          {planEx}
          <div className="cl-reg">{reglagesExplore}</div>
          {mesuresEx}
          {vue3D}
        </div>
        {parallele}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
