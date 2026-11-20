import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { EN_RECOLTE, EN_CONSULT } from "../fiches";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./pressionModele";
import { QCM } from "./pressionQcm";
import { SceneSeringue, SceneTrois, SceneParoi, SceneCanette, Graphe, SceneAvantApres } from "./pressionScenes";
import { SvgChocs, SvgPlusChocs, SvgForcePressante, SvgMariotte, SvgUtiliser, SvgCanetteCarte } from "./pressionSchemas";

const SIM_ID = 162, CLE_GUIDE = 'fluide-pression-mariotte-1g-guide-v1';
declarerDefis(SIM_ID, [['force', 'Quelle force pressante, ou quelle pression ?'], ['mariotte', 'Quelle pression finale, ou quel volume final ?']]);

// ====================================================
//  SIM 162 — FLUIDE AU REPOS : PRESSION, FORCE PRESSANTE ET LOI DE MARIOTTE (1G spé PC, thème « Mouvement et interactions »,
//  partie « Modélisation macroscopique d'un fluide au repos »). La statique des fluides (loi fondamentale) est traitée dans la simulation 163.
//  Parcours (13 étapes) : fluide, entités et chocs, effet de la température, effet du volume, direction de la force pressante, F = P·S,
//  mesures pas à pas, lecture du tableau, produit P·V, test de la loi, utiliser la loi, canette, bilan. Le modèle est dans pressionModele.js (testé).
//  Capacités visées (jamais affichées à l'élève) : expliquer qualitativement le lien entre grandeurs macroscopiques (pression, température) et
//  comportement microscopique ; exploiter F = P·S (force pressante perpendiculaire à la surface) ; utiliser et tester la loi de Mariotte ;
//  mesurer une pression dans un gaz avec un capteur.
//  La température reste qualitative dans le parcours guidé ; la dépendance quantitative en T (exploration) est balisée « au-delà du programme ».
// ====================================================

const NB = '\u00a0';
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtInt = x => Math.round(x).toLocaleString('fr-FR').replace(/\u202f/g, NB);
// produit P × V : 3 chiffres significatifs (pas de fausse précision)
const fmtPV = x => fmtInt(Number(Number(x).toPrecision(3)));
const sciF = (x, cs = 3) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => (c === '-' ? '⁻' : SUP[c])).join('')}`; };
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- formules (MathML) ----------
const FF = <Formule><mi>F</mi><mo>=</mo><mi>P</mi><mo>×</mo><mi>S</mi></Formule>;
const FPV = <Formule><mi>P</mi><mo>×</mo><mi>V</mi><mo>=</mo><mtext>constante</mtext></Formule>;
const FP2 = <Formule><msub><mi>P</mi><mn>2</mn></msub><mo>=</mo><msub><mi>P</mi><mn>1</mn></msub><mo>×</mo><mfrac><msub><mi>V</mi><mn>1</mn></msub><msub><mi>V</mi><mn>2</mn></msub></mfrac></Formule>;

const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{indicesProfond(t)}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);

// Carte « À retenir » repliée par défaut sous 900 px (elle repousserait la question) ; toujours dépliée sur ordinateur,
// dans la récolte des fiches (« Mes fiches ») et dans les contrôles automatiques.
function Repliable({ children }) {
  const grand = typeof window !== 'undefined' && (window.innerWidth >= 900 || !!window.__PARCOURS_TEST__);
  const dispense = EN_RECOLTE || EN_CONSULT || grand;
  const [ouvert, setOuvert] = useState(() => dispense);
  if (ouvert) return <>{indicesProfond(children)}{!dispense && <button type="button" onClick={() => setOuvert(false)} style={{ ...stylePetitBouton(false, '#475569'), marginTop: 6 }}>Replier la carte</button>}</>;
  return <button type="button" onClick={() => setOuvert(true)} style={{ ...styleBouton(false, '#0369a1'), width: '100%', textAlign: 'left', minHeight: 40, margin: '4px 0' }}>Afficher la carte « À retenir » : schéma et points ▾</button>;
}

// plafond « arrondi » d'un axe : 1, 2, 2,5, 5 × 10^k
const plafond = v => { const e = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1e-9)))); for (const k of [1, 2, 2.5, 4, 5, 8, 10]) if (k * e >= v) return k * e; return 10 * e; };
const graduations = (max, n = 4) => Array.from({ length: n + 1 }, (_, i) => max * i / n);

// ====================================================
export function SimulationPressionMariotte() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviM, noterM] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {}, mes: [] });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('force');
  const [graine, setGraine] = useState(() => 1 + Math.floor(Math.random() * 1e6));
  const [hypoOuv, setHypoOuv] = useState(false), [fige, setFige] = useState(false);
  // réglages du parcours guidé : température (étape 3), volume (étapes 4 et 7 à 9)
  const [thG, setThG] = useState(20), [vG, setVG] = useState(60);
  // exploration
  const [ex, setEx] = useState({ V: 60, theta: 20, N: 30, Vt: 0, S: 6, graphe: 'PV', ouv: {}, mes: [] });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['fluide', 'chocs', 'temperature', 'volume', 'direction', 'fnum', 'mesures', 'proportion', 'produit', 'tester', 'utiliser', 'reel', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant
  const mesGuide = guide.mes || [];
  const VOLS = [60, 40, 30, 20], mesuresOk = VOLS.every(v => mesGuide.includes(v));
  const P20 = M.pressionMesuree({ V: 20 });
  const noterMesure = () => setGuide(g => ((g.mes || []).includes(vG) ? g : { ...g, mes: [...(g.mes || []), vG] }));
  const lignes = [...mesGuide].sort((a, b) => b - a).map(V => ({ V, P: M.pressionMesuree({ V }) }));

  const ETAPES = [
    { id: 'fluide', titre: 'Trois systèmes à classer', focus: ['scene'],
      texte: <>Un <strong>fluide</strong> est un milieu qui n’a pas de forme propre : il peut s’écouler et prend la forme de son récipient. Dans cette simulation, on étudie des fluides <strong>au repos</strong>, enfermés dans un récipient. Voici trois systèmes.</>,
      tache: { type: 'qcm', ...QCM.fluide } },
    { id: 'chocs', titre: 'Les entités d’un gaz', focus: ['scene'],
      texte: <>Dans un gaz, les <strong>entités</strong> (ici des molécules, points bleus) sont très espacées et en <strong>agitation permanente</strong> : elles se déplacent dans tous les sens, et rebondissent sur les parois et les unes sur les autres. Le gaz de cette seringue est relié à un capteur de pression : plus l’aiguille est à droite, plus la pression est forte.</>,
      tache: { type: 'qcm', ...QCM.chocs } },
    { id: 'temperature', titre: 'Chauffer un gaz enfermé', focus: ['scene', 'reglage'],
      retenirTitre: 'À retenir : un gaz et ses chocs',
      retenir: <Repliable key="c1">
        <SvgChocs/>
        <ul style={liste}>
          <li><strong>Un fluide (liquide ou gaz) n’a pas de forme propre.</strong> Dans un gaz, les entités sont en agitation permanente et <strong>frappent les parois</strong> : l’ensemble des chocs pousse la paroi, c’est l’origine de la pression.</li>
          <li>Exemple de la simulation : le gaz de la seringue pousse sur le tube et sur le piston, dans toutes les directions.</li>
          <li><strong>Idée fausse</strong> : « la pression d’un gaz vient de son poids ». <strong>Vrai</strong> : elle vient des chocs, et elle s’exerce aussi sur les parois du haut et des côtés.</li>
          <li>Schéma simplifié : une seringue contient en réalité de l’ordre de 10²¹ entités, bien plus petites et plus rapides.</li>
        </ul></Repliable>,
      texte: <>Le piston est maintenant <strong>bloqué</strong> : le volume du gaz ne peut plus changer. Chauffez le gaz en réglant sa température avec le curseur, et observez les entités, leurs chocs sur les parois (traits orange) et l’aiguille du capteur.</>,
      tache: { type: 'qcm', ...QCM.temperature } },
    { id: 'volume', titre: 'Comprimer un gaz', focus: ['scene', 'reglage'],
      texte: <>Le piston est libéré. On maintient la <strong>température constante</strong> (20{NB}°C) et on ne laisse ni entrer ni sortir de gaz. Poussez le piston avec le curseur de volume, et observez les entités et l’aiguille.</>,
      tache: { type: 'qcm', ...QCM.volume } },
    { id: 'direction', titre: 'Une paroi inclinée', focus: ['scene'],
      retenirTitre: 'À retenir : plus de chocs, plus de pression',
      retenir: <Repliable key="c2">
        <SvgPlusChocs/>
        <ul style={liste}>
          <li><strong>Chauffer (volume constant)</strong> : agitation plus grande, chocs plus fréquents et plus violents, donc P augmente.</li>
          <li><strong>Comprimer (température constante)</strong> : les mêmes entités dans un volume plus petit, chocs plus fréquents, donc P augmente.</li>
          <li>Moyen de s’en souvenir : « plus chaud ou plus serré, plus de pression ».</li>
          <li><strong>Idée fausse</strong> : « comprimer fait aller les entités plus vite ». <strong>Vrai</strong> : à température constante leur agitation ne change pas, elles sont seulement plus serrées.</li>
        </ul></Repliable>,
      texte: <>Un gaz est enfermé dans un récipient dont une paroi est inclinée. Les entités la heurtent de tous côtés, et l’ensemble de leurs chocs pousse la paroi. Cette action du gaz sur la paroi est modélisée par une <strong>force pressante</strong>, notée vec(F).</>,
      tache: { type: 'qcm', ...QCM.direction } },
    { id: 'fnum', titre: 'Une force à calculer', focus: ['scene'],
      texte: <>La <strong>pression</strong> P d’un fluide se mesure en <strong>pascal</strong> (Pa) : 1{NB}Pa = 1{NB}N/m². Attention, la pression n’est pas une force : c’est la force pressante exercée sur chaque mètre carré de paroi. Pour une surface plane S dont tous les points subissent la même pression, la force pressante a pour norme :{FF}avec P en Pa, S en m² et F en N. L’air de la seringue est à <strong>P = 2,0{NB}bar</strong> (1{NB}bar = 10⁵{NB}Pa). La face du piston a pour surface <strong>S = 6,0{NB}cm²</strong> (1{NB}cm² = 10⁻⁴{NB}m²). Calculez la norme de la force pressante exercée par le gaz sur le piston.</>,
      tache: { type: 'num', q: 'Norme de la force pressante sur le piston', carnet: 'F sur le piston (2,0 bar ; 6,0 cm²)', unite: 'N', vrai: 120, tol: 0.02, affiche: v => nbf(v, 0),
        calcul: () => ['P = 2,0 bar = 2,0 × 10⁵ Pa (1 bar = 10⁵ Pa). S = 6,0 cm² = 6,0 × 10⁻⁴ m² (1 cm² = 10⁻⁴ m²). Hypothèse : surface plane, pression uniforme.', 'F = P × S = 2,0 × 10⁵ Pa × 6,0 × 10⁻⁴ m² = 1,2 × 10² N = 120 N. La force est perpendiculaire à la face du piston, dirigée du gaz vers le piston.'],
        pieges: [[1.2e6, 'La surface est restée en cm² : S = 6,0 cm² = 6,0 × 10⁻⁴ m². Pour F en N, il faut S en m² et P en Pa.'], [1.2e-3, 'La pression est restée en bar : 2,0 bar = 2,0 × 10⁵ Pa. Pour F en N, il faut P en Pa et S en m².'], [1.2e4, 'Attention : 1 cm² = 10⁻⁴ m² (et non 10⁻² m²), car on passe d’une longueur au carré.'], [12, 'Ni P ni S n’ont été convertis : il faut P en Pa et S en m².'], [3.3e8, 'On multiplie P et S, on ne les divise pas : F = P × S.']],
        expl: 'F = P × S = 2,0 × 10⁵ × 6,0 × 10⁻⁴ = 120 N : le gaz pousse le piston avec une force de 120 N, perpendiculaire à sa face.', indice: 'Convertissez d’abord : 1 bar = 10⁵ Pa et 1 cm² = 10⁻⁴ m². Puis F = P × S.' } },
    { id: 'mesures', titre: 'Mesurer la pression pour plusieurs volumes', focus: ['scene', 'reglage'],
      retenirTitre: 'À retenir : la force pressante',
      retenir: <Repliable key="c3">
        <SvgForcePressante/>
        {FF}
        <ul style={liste}>
          <li><strong>vec(F) est perpendiculaire à la surface, dirigée du fluide vers la paroi</strong> ; sa norme est F = P × S (P en Pa, S en m², F en N).</li>
          <li>Conversions : 1{NB}bar = 10⁵{NB}Pa ; 1{NB}hPa = 100{NB}Pa ; 1{NB}cm² = 10⁻⁴{NB}m².</li>
          <li>Exemple : la pression atmosphérique (1013{NB}hPa) sur 1{NB}cm² donne F ≈ 10{NB}N, comme le poids d’une masse d’environ 1{NB}kg.</li>
          <li><strong>Piège</strong> : la pression n’est pas une force. Pour passer de P à F, il faut multiplier par une surface exprimée en m².</li>
        </ul></Repliable>,
      texte: <>On enregistre la pression pour plusieurs volumes. Hypothèses (rappelées dans le panneau « Hypothèses de travail » sous la scène) : le gaz reste à <strong>température constante</strong> (20{NB}°C), sans fuite, à pression modérée (quelques bar au plus) ; on néglige le volume du tuyau et du capteur, ainsi que les frottements du piston ; la pression de l’air extérieur est d’environ 1013{NB}hPa. Placez le curseur sur le volume voulu, puis cliquez sur « Noter la mesure » : le capteur indique la pression en hectopascals (1{NB}hPa = 100{NB}Pa).</>,
      tache: { type: 'action', ok: mesuresOk, consigne: 'Notez la mesure pour V = 60 mL, 40 mL, 30 mL et 20 mL.', attente: mesuresOk ? null : `À noter : ${VOLS.map(v => `${mesGuide.includes(v) ? '●' : '○'} ${v} mL`).join('   ')}` } },
    { id: 'proportion', titre: 'Comparer deux mesures', focus: ['tableau', 'graphe'],
      texte: <>Voici vos mesures, aussi placées sur un graphe : la pression P en fonction du volume V. Regardez comment P varie quand V diminue.</>,
      tache: { type: 'qcm', ...QCM.proportion } },
    { id: 'produit', titre: 'Un produit à calculer', focus: ['tableau'],
      texte: <>La pression est multipliée par 2 quand le volume est divisé par 2 : on peut penser à un produit. Pour la mesure à V = 20{NB}mL, le capteur indique <strong>P = {fmtInt(P20)}{NB}hPa</strong>. Calculez le produit P × V, en hPa·mL (gardez ces unités).</>,
      tache: { type: 'num', q: 'Produit P × V pour la mesure à 20 mL', carnet: 'P × V à 20 mL', unite: 'hPa·mL', vrai: P20 * 20, tol: 0.01, affiche: v => fmtPV(v),
        calcul: () => [`P = ${fmtInt(P20)} hPa et V = 20 mL : on garde ces unités.`, `P × V = ${fmtInt(P20)} × 20 = ${fmtInt(P20 * 20)} ≈ ${fmtPV(P20 * 20)} hPa·mL (3 chiffres significatifs).`],
        pieges: [[P20 / 20, 'On multiplie P et V, on ne les divise pas : P × V.'], [P20 + 20, 'On multiplie P par V, on ne les additionne pas.']],
        expl: `P × V = ${fmtInt(P20)} × 20 ≈ ${fmtPV(P20 * 20)} hPa·mL.`, indice: 'P × V : multipliez le nombre de hPa par le nombre de mL.' } },
    { id: 'tester', titre: 'Tester la loi', focus: ['tableau', 'graphe'],
      texte: <>Le tableau donne maintenant le produit P × V pour chaque mesure. Aucune mesure n’est parfaite : la lecture du volume et la précision du capteur donnent environ <strong>2 % à 3 %</strong> d’incertitude sur chaque produit (estimation propre à cette simulation). La courbe bleue correspond à un produit P × V exactement constant, égal à la moyenne de vos produits.</>,
      tache: { type: 'qcm', ...QCM.tester } },
    { id: 'utiliser', titre: 'Prévoir une pression', focus: ['scene'],
      retenirTitre: 'À retenir : la loi de Mariotte',
      retenir: <Repliable key="c4">
        <SvgMariotte/>
        {FPV}
        <ul style={liste}>
          <li><strong>À température constante et pour une quantité de gaz constante, P × V = constante</strong> : si V est divisé par 2, P est multipliée par 2.</li>
          <li>Exemple de la simulation : 1011{NB}hPa × 60{NB}mL ≈ 2028{NB}hPa × 30{NB}mL ≈ 6,1 × 10⁴{NB}hPa·mL.</li>
          <li><strong>Tester la loi</strong> : calculer P × V pour chaque mesure ; si les produits sont égaux aux incertitudes près, les mesures sont compatibles avec la loi.</li>
          <li><strong>Idée fausse</strong> : « P et V sont proportionnelles ». <strong>Vrai</strong> : quand l’une augmente, l’autre diminue ; c’est leur produit qui est constant.</li>
        </ul></Repliable>,
      texte: <>Les mesures sont compatibles avec <strong>P × V = constante</strong> (loi de Mariotte), pour une quantité de gaz et une température constantes. On bouche une seringue qui contient <strong>V₁ = 60{NB}mL</strong> d’air à <strong>P₁ = 1,5{NB}bar</strong>, puis on pousse le piston jusqu’à <strong>V₂ = 25{NB}mL</strong>. Hypothèses : température constante, pas de fuite, volume du tuyau négligé. Quelle est la pression finale P₂ ?</>,
      tache: { type: 'num', q: 'Pression finale P₂, en bar', carnet: 'P₂ après compression (60 → 25 mL)', unite: 'bar', vrai: 3.6, tol: 0.03, cs: 2, affiche: v => nbf(v, 1),
        calcul: () => ['Loi de Mariotte : P₁ × V₁ = P₂ × V₂ (température et quantité de gaz constantes). Les volumes restent en mL, la pression en bar : pas de conversion.', 'P₂ = P₁ × V₁ / V₂ = 1,5 bar × 60 mL ÷ 25 mL = 3,6 bar (2 chiffres significatifs, comme les données).'],
        pieges: [[0.625, 'Le rapport est inversé : P₂ = P₁ × V₁ / V₂. Quand on comprime, la pression augmente.'], [36.5, 'On ne soustrait pas les volumes : c’est le produit P × V qui est constant.'], [3600, 'On multiplie P₁ par V₁ puis on divise par V₂ : P₂ = P₁ × V₁ / V₂.']],
        expl: 'P₂ = P₁ × V₁ / V₂ = 1,5 × 60 / 25 = 3,6 bar : le volume est divisé par 2,4, donc la pression est multipliée par 2,4.', indice: 'P₁ × V₁ = P₂ × V₂ : isolez P₂. Les unités de volume se simplifient, gardez des bar.' } },
    { id: 'reel', titre: 'La canette', focus: ['scene'],
      retenirTitre: 'À retenir : utiliser la loi',
      retenir: <Repliable key="c5">
        <SvgUtiliser/>
        {FP2}
        <ul style={liste}>
          <li><strong>On connaît P₁, V₁ et V₂ : P₂ = P₁ × V₁ / V₂.</strong> Même unité pour V₁ et V₂, même unité pour P₁ et P₂ : aucune conversion n’est nécessaire.</li>
          <li>Exemple : 50{NB}mL à 1,0{NB}bar poussés à 25{NB}mL donnent P₂ = 1,0 × 50 / 25 = 2,0{NB}bar.</li>
          <li><strong>Vérifier le sens</strong> : si le volume diminue, la pression doit augmenter. Un rapport inversé donne une pression plus faible : c’est faux.</li>
          <li>Hypothèses à écrire : température constante, pas de fuite de gaz.</li>
        </ul></Repliable>,
      texte: <>On chauffe un peu d’eau au fond d’une canette ouverte jusqu’à ébullition, puis on retourne vivement la canette dans de l’eau froide. La vapeur d’eau qui remplissait la canette se condense en quelques instants en un peu d’eau liquide. La canette s’écrase.</>,
      tache: { type: 'qcm', ...QCM.reel } },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      retenirTitre: 'À retenir : deux pressions, une force résultante',
      retenir: <Repliable key="c6">
        <SvgCanetteCarte/>
        <ul style={liste}>
          <li><strong>Le fluide qui pousse le plus fort l’emporte</strong> : la paroi cède du côté de la plus faible pression.</li>
          <li>Exemple de la simulation : dans la canette, la vapeur condensée a laissé très peu de gaz ; l’air extérieur (environ 1013{NB}hPa) l’écrase.</li>
          <li><strong>Idée fausse</strong> : « l’air extérieur est aspiré dans la canette ». <strong>Vrai</strong> : rien n’aspire, c’est l’air extérieur qui pousse.</li>
          <li><strong>Limite</strong> : ici la quantité de gaz change (condensation), la loi de Mariotte ne s’applique pas.</li>
        </ul></Repliable>,
      texte: <>Dans un gaz, la <strong>pression</strong> vient des chocs des entités sur les parois : elle augmente quand on chauffe ou quand on comprime. La <strong>force pressante</strong> vec(F) est perpendiculaire à la surface, dirigée vers la paroi, de norme F = P × S. À température et quantité de gaz constantes, <strong>P × V = constante</strong> (loi de Mariotte). Vous pouvez maintenant explorer librement, relever un défi ou faire des exercices.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, g = graine + 1) => {
    setGraine(g); const rng = M.rngGraine(g);
    setDefi({ ...(type === 'force' ? M.tirerDefiForce(rng) : M.tirerDefiMariotte(rng)), reps: {}, verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, 0.02);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'force' ? noterF : noterM)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('fl-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const pDefi = d => (d.uP === 'bar' ? nbf(d.P, 1) : fmtInt(d.P));
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['force', 'Force pressante et pression'], ['mariotte', 'Loi de Mariotte']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'force' ? (defi.variante === 'force' ? 'Défi : quelle est la force pressante ?' : 'Défi : quelle est la pression du gaz ?') : (defi.variante === 'P2' ? 'Défi : quelle est la pression finale ?' : 'Défi : quel est le volume final ?')}</div>
      {defi.type === 'force' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>{defi.variante === 'force'
          ? <>Le piston d’une seringue a une surface <strong>S = {nbf(defi.S, 1)}{NB}cm²</strong>. Le gaz enfermé est à la pression <strong>P = {pDefi(defi)}{NB}{defi.uP}</strong>. Quelle est la norme de la force pressante exercée par le gaz sur le piston ? Donnez le résultat en newtons avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</>
          : <>Un gaz enfermé exerce sur un piston de surface <strong>S = {nbf(defi.S, 1)}{NB}cm²</strong> une force pressante de norme <strong>F = {nbf(defi.F, defi.F % 1 === 0 ? 0 : 1)}{NB}N</strong>. Quelle est la pression du gaz ? Donnez le résultat en hectopascals (hPa) avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</>}</div>
        {champ(defi.variante === 'force' ? 'Norme de la force' : 'Pression du gaz', defi.unite)}
        <IndiceDefi cache={false}>{defi.variante === 'force'
          ? <>La norme est F = P × S, avec P en pascals et S en mètres carrés. Conversions : 1 bar = 10⁵ Pa, 1 hPa = 100 Pa, 1 cm² = 10⁻⁴ m².</>
          : <>Isolez P dans F = P × S : P = F / S, avec F en newtons et S en m² (1 cm² = 10⁻⁴ m²). Le résultat est en pascals : 1 hPa = 100 Pa.</>}</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>{defi.variante === 'P2'
          ? <>Une seringue bouchée contient <strong>V₁ = {defi.V1}{NB}mL</strong> d’air à <strong>P₁ = {nbf(defi.P1, 1)}{NB}bar</strong>. On déplace le piston jusqu’à <strong>V₂ = {defi.V2}{NB}mL</strong>, sans changer la température ni la quantité d’air. Quelle est la pression finale P₂ ? Donnez le résultat en bar avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</>
          : <>Une seringue bouchée contient <strong>V₁ = {defi.V1}{NB}mL</strong> d’air à <strong>P₁ = {nbf(defi.P1, 1)}{NB}bar</strong>. On déplace le piston jusqu’à ce que la pression atteigne <strong>P₂ = {nbf(defi.P2, Math.round(defi.P2 * 100) % 10 === 0 ? 1 : 2)}{NB}bar</strong>, sans changer la température ni la quantité d’air. Quel est alors le volume V₂ ? Donnez le résultat en mL avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</>}</div>
        {champ(defi.variante === 'P2' ? 'Pression finale' : 'Volume final', defi.unite)}
        <IndiceDefi cache={false}>À température et quantité de gaz constantes, P₁ × V₁ = P₂ × V₂. {defi.variante === 'P2' ? 'Isolez P₂ : P₂ = P₁ × V₁ / V₂.' : 'Isolez V₂ : V₂ = P₁ × V₁ / P₂.'} Aucune conversion n’est nécessaire si les deux pressions sont en bar. Vérifiez le sens : si le volume diminue, la pression augmente.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="fl-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'force'
          ? (defi.variante === 'force' ? `✓ Correct. F = P × S = ${sciF(defi.vrai, 3)} N (marge acceptée : ± 2 %).` : `✓ Correct. P = F / S = ${sciF(defi.vrai, 3)} hPa (marge acceptée : ± 2 %).`)
          : (defi.variante === 'P2' ? `✓ Correct. P₂ = P₁ × V₁ / V₂ = ${nbf(defi.vrai, 2)} bar (marge acceptée : ± 2 %).` : `✓ Correct. V₂ = P₁ × V₁ / P₂ = ${nbf(defi.vrai, 1)} mL (marge acceptée : ± 2 %).`))
          : defi.type === 'force' ? '✗ Vérifiez les conversions : P en pascals, S en m², F en newtons (1 bar = 10⁵ Pa, 1 hPa = 100 Pa, 1 cm² = 10⁻⁴ m²).'
            : '✗ Vérifiez : P₁ × V₁ = P₂ × V₂, et le sens : volume plus petit, pression plus grande.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Gaz enfermé</strong> : la quantité de gaz ne change pas (pas de fuite, aucun gaz ajouté), sauf quand l’exploration vous laisse la modifier.</li>
      <li><strong>Loi de Mariotte</strong> : P × V = constante est valable à <strong>température constante</strong> et pour une <strong>quantité de gaz constante</strong>, avec un gaz à pression modérée (quelques bar au plus : on se limite à cette plage). Ce n’est pas une loi exacte à toute pression : c’est le comportement d’un gaz modèle.</li>
      <li><strong>Force pressante</strong> : F = P × S suppose une <strong>surface plane</strong> et une pression <strong>uniforme</strong> ; la force est perpendiculaire à la surface, dirigée du fluide vers la paroi. La pression n’est pas une force.</li>
      <li><strong>Seringue</strong> : on néglige les frottements du piston et le volume du tuyau et du capteur (réglable en exploration). Les mesures simulées ont un écart aléatoire reproductible (± 0,5 % au plus), plus petit que l’incertitude de 2 % à 3 % que l’on attribue à une vraie mesure.</li>
      <li><strong>Température</strong> : le parcours reste qualitatif (plus chaud, plus de pression). En exploration, le calcul de P avec la température suit un modèle de gaz (P augmente avec la température absolue) : c’est <strong>au-delà des capacités exigibles</strong>.</li>
      <li><strong>Schémas</strong> : les entités sont dessinées bien moins nombreuses, plus grosses et plus lentes qu’en réalité (une seringue en contient de l’ordre de 10²¹, qui se déplacent à plusieurs centaines de m/s). Les flèches de force ne sont pas à l’échelle sur les schémas des cartes.</li>
      <li><strong>Chiffres significatifs</strong> : un résultat n’a pas plus de chiffres significatifs que la donnée la moins précise ; les calculs intermédiaires gardent un chiffre de plus. Pression atmosphérique usuelle : environ 1013 hPa (1,013 × 10⁵ Pa).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ PARCOURS GUIDÉ : tableau, graphe, scènes ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const prods = lignes.map(l => l.P * l.V), moyP = prods.length ? prods.reduce((a, b) => a + b, 0) / prods.length : 0;
  const montrerProduit = fait('produit');
  const tableau = (lig, avecProduit) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14, textAlign: 'center' }}>
        <thead><tr style={{ color: KIT.txt2 }}>
          <th style={{ padding: '4px 6px', borderBottom: `2px solid ${KIT.bord}` }}>V (mL)</th>
          <th style={{ padding: '4px 6px', borderBottom: `2px solid ${KIT.bord}` }}>P (hPa)</th>
          {avecProduit && <th style={{ padding: '4px 6px', borderBottom: `2px solid ${KIT.bord}` }}>P × V (hPa·mL)</th>}
        </tr></thead>
        <tbody>{lig.map(l => <tr key={l.V}>
          <td style={{ padding: '4px 6px', borderBottom: `1px dashed ${KIT.bord}` }}>{l.V}</td>
          <td style={{ padding: '4px 6px', borderBottom: `1px dashed ${KIT.bord}`, fontWeight: 700 }}>{fmtInt(l.P)}</td>
          {avecProduit && <td style={{ padding: '4px 6px', borderBottom: `1px dashed ${KIT.bord}`, fontWeight: 700, color: COL.orange }}>{fmtPV(l.P * l.V)}</td>}
        </tr>)}</tbody>
      </table>
      {!lig.length && <div style={{ fontSize: 13.5, color: KIT.txt2, padding: '6px 2px' }}>Le tableau est vide : notez une première mesure.</div>}
    </div>);
  const grapheGuide = (avecCourbe) => (
    <Graphe xMax={70} yMax={4000} xTicks={[0, 20, 40, 60]} yTicks={[0, 1000, 2000, 3000, 4000]} xLabel="V (mL)" yLabel="P (hPa)"
      points={lignes.map(l => ({ x: l.V, y: l.P }))} courbe={avecCourbe && moyP ? (v => moyP / v) : null} courbeMin={14}
      aria={`Graphe de la pression en hectopascals en fonction du volume en millilitres : ${lignes.length} mesures${avecCourbe ? ', avec la courbe d’un produit P fois V constant' : ''}.`}/>);
  const reglageV = (min, max, pas) => (
    <div className="fl-in">{boite('Réglage du volume', <Curseur nom="Volume de gaz V" valeur={vG} onChange={setVG} min={min} max={max} pas={pas} unite="mL" decimales={0} couleur={COL.bleu}/>, cadre('reglage'))}</div>);
  const sceneGuide = (() => {
    switch (idE) {
      case 'fluide': return boite('Trois systèmes', <SceneTrois/>, cadre('scene'));
      case 'chocs': return boite('Un gaz dans une seringue',
        <><SceneSeringue V={40} N={30} theta={20} capteur={{ type: 'cadran', niveau: M.niveauCadran(M.pression({ V: 40 }), 4500) }} fige={fige} titre="Gaz enfermé dans une seringue, relié à un capteur"/>
          {aide('Schéma simplifié : une vraie seringue contient environ 10²¹ entités, bien plus petites et plus rapides. Le cadran du capteur n’a pas de graduation : il montre seulement si la pression est plus ou moins forte.')}</>, cadre('scene'));
      case 'temperature': return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {boite('Gaz à volume constant',
          <SceneSeringue V={30} N={30} theta={thG} bloque chocs thermo capteur={{ type: 'cadran', niveau: M.niveauCadran(M.pression({ V: 30, thetaC: thG }), 3000) }} fige={fige} titre="Seringue à piston bloqué, gaz chauffé"/>, cadre('scene'))}
        <div className="fl-in">{boite('Réglage de la température', <Curseur nom="Température du gaz" valeur={thG} onChange={setThG} min={0} max={100} pas={5} unite="°C" decimales={0} couleur={COL.orange}/>, cadre('reglage'))}</div>
      </div>);
      case 'volume': return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {boite('Gaz à température constante',
          <SceneSeringue V={vG} N={30} theta={20} chocs thermo capteur={{ type: 'cadran', niveau: M.niveauCadran(M.pression({ V: vG }), 4500) }} fige={fige} titre="Seringue à température constante, volume réglable"/>, cadre('scene'))}
        {reglageV(15, 60, 5)}
      </div>);
      case 'direction': return boite('Un gaz et une paroi inclinée', <SceneParoi montrer={fait('direction')}/>, cadre('scene'));
      case 'fnum': return boite('Le gaz et le piston',
        <><SceneSeringue V={30} N={30} theta={20} capteur={{ type: 'nombre', valeur: '2,0', unite: 'bar' }} surface={`S = 6,0${NB}cm²`} fleches={fait('fnum') ? { gaz: 64 } : null} grand fige={fige} titre="Seringue, pression 2,0 bar, piston de surface 6,0 cm²"/>
          {fait('fnum') && <div style={{ marginTop: 6 }}>{donnee('Force pressante F = P × S', `120${NB}N`, COL.orange)}</div>}
          <div style={{ marginTop: 6 }}>{donnee('Pression P', `2,0${NB}bar = 2,0${NB}×${NB}10⁵${NB}Pa`)}{donnee('Surface du piston S', `6,0${NB}cm² = 6,0${NB}×${NB}10⁻⁴${NB}m²`)}</div>
          {aide('Seule la force du gaz sur le piston est représentée : l’air extérieur et la main exercent d’autres forces.')}</>, cadre('scene'));
      case 'mesures': case 'proportion': case 'produit': case 'tester': return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {boite('La seringue et le capteur',
          <SceneSeringue V={vG} N={30} theta={20} thermo capteur={{ type: 'nombre', valeur: fmtInt(M.pressionMesuree({ V: vG })).replace(NB, ''), unite: 'hPa' }} fige={fige} titre="Seringue à 20 °C reliée à un capteur de pression"/>, cadre('scene'))}
        {reglageV(20, 60, 10)}
        {idE === 'mesures' && <div className="fl-in">{boite('Mesures', <>
          <button onClick={noterMesure} style={styleBouton(true, '#15803d')}>Noter la mesure</button>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Chaque clic ajoute au tableau le volume et la pression affichés. Les volumes à noter : 60, 40, 30 et 20 mL.</div></>)}</div>}
        <div className="fl-in" style={{ ...cadre('tableau') }}>{boite('Tableau des mesures', <>{tableau(lignes, montrerProduit)}
          {idE === 'mesures' && mesGuide.length > 0 && <button onClick={() => setGuide(g => ({ ...g, mes: [] }))} style={{ ...stylePetitBouton(false, '#64748b'), marginTop: 6 }}>Effacer le tableau</button>}</>)}</div>
        {idE !== 'mesures' && <div className="fl-in" style={cadre('graphe')}>{boite('Graphe P en fonction de V', grapheGuide(apres('produit')))}</div>}
      </div>);
      case 'utiliser': {
        const ok = fait('utiliser');
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {boite('Une seringue bouchée',
            <><SceneSeringue V={25} N={30} theta={20} thermo capteur={{ type: 'nombre', valeur: ok ? '3,6' : '?', unite: 'bar' }} fige={fige} titre="Seringue bouchée, piston poussé jusqu’à 25 mL"/>
              <div style={{ marginTop: 6 }}>{donnee('État initial : V₁', `60${NB}mL`)}{donnee('État initial : P₁', `1,5${NB}bar`)}{donnee('État final : V₂', `25${NB}mL`)}{ok && donnee('État final : P₂', `3,6${NB}bar`, COL.orange)}</div></>, cadre('scene'))}
          <Section titre="Vos mesures (rappel)" ouvert={!!ex.ouv.rappel} onBascule={() => setE({ ouv: { ...ex.ouv, rappel: !ex.ouv.rappel } })}>{tableau(lignes, true)}<div style={{ marginTop: 8 }}>{grapheGuide(true)}</div></Section>
        </div>);
      }
      case 'reel': return boite('Une canette dans l’eau froide', <SceneCanette ecrasee montrer={fait('reel')}/>, cadre('scene'));
      case 'bilan': return boite('Deux pressions de part et d’autre d’une paroi', <SceneCanette ecrasee montrer/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const cond = { V: ex.V, thetaC: ex.theta, n: ex.N / 30, Vt: ex.Vt };
  const Pex = M.pressionMesuree(cond), Pvrai = M.pression(cond), fo = M.forcesPiston(Pvrai, ex.S);
  // échelle commune à toutes les flèches : la plus grande force fait 84 unités (aucune saturation)
  const Fgrand = Math.max(fo.Fgaz, fo.Fair, Math.abs(fo.Fmain), 1e-9), Lf = F => Math.max(4, Math.abs(F) * 84 / Fgrand);
  const flechesEx = { gaz: Lf(fo.Fgaz), air: Lf(fo.Fair), main: Math.abs(fo.Fmain) > 2 ? Math.sign(fo.Fmain) * Lf(fo.Fmain) : null };
  const noterEx = () => setEx(s => ({ ...s, mes: [...s.mes, { V: s.V, P: Pex, th: s.theta, N: s.N, Vt: s.Vt, k: s.mes.length }].slice(-14) }));
  const pointsEx = ex.mes.map(m => ({ V: m.V, P: m.P, Vt: m.Vt }));
  const g = ex.graphe;
  const grapheEx = (() => {
    if (g === 'PV') {
      const yMax = plafond(Math.max(4000, ...pointsEx.map(p => p.P), Pvrai) * 1.05);
      return <Graphe xMax={70} yMax={yMax} xTicks={[0, 20, 40, 60]} yTicks={graduations(yMax)} xLabel="V (mL)" yLabel="P (hPa)" points={pointsEx.map(p => ({ x: p.V, y: p.P }))}
        courbe={v => M.pression({ ...cond, V: v })} courbeMin={Math.max(8, 2)} aria={`Graphe de la pression en fonction du volume : ${pointsEx.length} mesures notées et courbe des réglages actuels.`}/>;
    }
    if (g === 'PxV') {
      const yMax = plafond(Math.max(80000, ...pointsEx.map(p => p.P * p.V)) * 1.05);
      return <Graphe xMax={70} yMax={yMax} xTicks={[0, 20, 40, 60]} yTicks={graduations(yMax)} xLabel="V (mL)" yLabel="P × V (hPa·mL)" gauche={92} points={pointsEx.map(p => ({ x: p.V, y: p.P * p.V }))}
        courbe={v => M.pression({ ...cond, V: v }) * v} courbeMin={8} aria={`Graphe du produit P fois V en fonction du volume : ${pointsEx.length} mesures notées.`}/>;
    }
    const yMax = plafond(Math.max(4000, ...pointsEx.map(p => p.P), Pvrai) * 1.05);
    return <Graphe xMax={110} yMax={yMax} xTicks={[0, 25, 50, 75, 100]} yTicks={graduations(yMax)} xLabel="1000 / V (mL⁻¹)" yLabel="P (hPa)" points={pointsEx.map(p => ({ x: 1000 / p.V, y: p.P }))}
      courbe={x => M.pression({ ...cond, V: 1000 / x })} courbeMin={9} aria={`Graphe de la pression en fonction de l’inverse du volume : ${pointsEx.length} mesures notées.`}/>;
  })();
  const resumeReglages = `V = ${ex.V} mL · ${ex.theta} °C · ${ex.N} entités${ex.Vt ? ` · tuyau ${ex.Vt} mL` : ''}`;
  const exReglages = (<>
    <Curseur nom="Volume de gaz V" valeur={ex.V} onChange={v => setE({ V: v })} min={10} max={60} pas={1} unite="mL" decimales={0} couleur={COL.bleu}/>
    {aide('Poussez le piston : la pression change. Le cadran est remplacé par un affichage numérique en hPa (1 hPa = 100 Pa).')}
    <Section titre={`Gaz : ${resumeReglages}`} ouvert={!!ex.ouv.gaz} onBascule={() => ouvrir('gaz')}>
      <Curseur nom="Température du gaz" valeur={ex.theta} onChange={v => setE({ theta: v })} min={0} max={100} pas={5} unite="°C" decimales={0} couleur={COL.orange}/>
      <Curseur nom="Nombre d’entités de gaz (quantité de gaz)" valeur={ex.N} onChange={v => setE({ N: v })} min={15} max={45} pas={1} unite="" decimales={0} couleur={COL.violet}/>
      {aide('La loi de Mariotte suppose la même température et la même quantité de gaz : changez-les pour voir pourquoi. Au-delà des capacités exigibles : P augmente avec la température absolue.')}
    </Section>
    <Section titre={`Piston : surface S = ${nbf(ex.S, 1)} cm²`} ouvert={!!ex.ouv.piston} onBascule={() => ouvrir('piston')}>
      {etiquette('Surface du piston', <select value={ex.S} onChange={x => setE({ S: Number(x.target.value) })} style={sel}>{[2, 4, 6, 8, 10].map(s => <option key={s} value={s}>{nbf(s, 1)} cm²</option>)}</select>)}
      {aide('Les flèches du schéma montrent vec(F)_gaz (rouge), vec(F)_air (bleu) et la force de la main pour tenir le piston (orange) : leurs longueurs sont proportionnelles aux forces, avec une échelle commune qui s’adapte à la plus grande force (une même longueur ne représente donc pas toujours la même valeur).')}
    </Section>
    <Section titre={`Volume du tuyau et du capteur : ${ex.Vt} mL`} ouvert={!!ex.ouv.tuyau} onBascule={() => ouvrir('tuyau')}>
      <Curseur nom="Volume du tuyau et du capteur" valeur={ex.Vt} onChange={v => setE({ Vt: v })} min={0} max={6} pas={1} unite="mL" decimales={0} couleur={COL.gris}/>
      {aide('Pour aller plus loin : le gaz occupe aussi le tuyau. Si on l’oublie, P × V (V lu sur la seringue) n’est plus constant ; c’est P × (V + volume du tuyau) qui l’est.')}
    </Section>
  </>);
  const exScene = (<>
    <SceneSeringue V={ex.V} N={ex.N} theta={ex.theta} thermo chocs capteur={{ type: 'nombre', valeur: fmtInt(Pex).replace(NB, ''), unite: 'hPa' }} surface={`S = ${nbf(ex.S, 1)}${NB}cm²`} fleches={flechesEx} fige={fige} titre="Seringue fermée : forces sur le piston"/>
    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => setFige(f => !f)} aria-pressed={fige} style={stylePetitBouton(fige, '#334155')}>{fige ? '▶ Animer les entités' : '⏸ Figer les entités'}</button>
    </div></>);
  const exMesures = (<>
    {donnee('Pression P (capteur)', `${fmtInt(Pex)}${NB}hPa`, COL.orange)}
    {donnee('Pression P en pascals', `${sciF(M.hPa_Pa(Pex), 3)}${NB}Pa`)}
    {donnee('Produit P × V', `${fmtPV(Pex * ex.V)}${NB}hPa·mL`, COL.violet)}
    {ex.Vt > 0 && donnee('Produit P × (V + tuyau)', `${fmtPV(Pex * (ex.V + ex.Vt))}${NB}hPa·mL`, COL.vert)}
    {donnee('Force du gaz sur le piston, F = P × S', `${nbf(fo.Fgaz, fo.Fgaz < 100 ? 1 : 0)}${NB}N`, COL.rouge)}
    {donnee('Force de l’air extérieur (1013 hPa)', `${nbf(fo.Fair, fo.Fair < 100 ? 1 : 0)}${NB}N`, COL.bleu)}
    {donnee('Force à exercer à la main', Math.abs(fo.Fmain) < 0.5 ? `0${NB}N` : `${nbf(Math.abs(fo.Fmain), Math.abs(fo.Fmain) < 100 ? 1 : 0)}${NB}N (${fo.Fmain > 0 ? 'pousser' : 'tirer'})`, COL.orange)}
    {aide('Piston en équilibre, frottements négligés : la main complète la différence entre la force du gaz et celle de l’air extérieur.')}
  </>);
  const exGraphe = (<>
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
      {etiquette('Graphe', <select value={ex.graphe} onChange={x => setE({ graphe: x.target.value })} style={sel}>
        <option value="PV">P en fonction de V</option><option value="PxV">Produit P × V en fonction de V</option><option value="PinvV">P en fonction de 1 / V</option></select>)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={noterEx} style={styleBouton(true, '#15803d')}>Noter la mesure</button>
        {ex.mes.length > 0 && <button onClick={() => setE({ mes: [] })} style={styleBouton(false, '#64748b')}>Effacer</button>}
      </div>
    </div>
    {aide('Chaque mesure notée est un point. La courbe bleue montre ce que prévoit le modèle pour les réglages actuels. Pour tester la loi de Mariotte, ne changez ni la température ni la quantité de gaz entre deux mesures.')}
    {grapheEx}
    {ex.mes.length > 0 && <div style={{ marginTop: 8 }}>{tableau([...ex.mes].sort((a, b) => b.V - a.V).map(m => ({ V: m.V, P: m.P })), true)}</div>}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Réglez V = 60 mL puis 30 mL : que devient la pression ? Et le produit P × V ?</li>
      <li>Notez plusieurs mesures à 20 °C, avec la même quantité de gaz : les points suivent-ils la courbe bleue ? Choisissez le graphe « P en fonction de 1 / V » : quelle forme ont les points ?</li>
      <li>Chauffez le gaz à 80 °C sans toucher au volume, puis notez une mesure : le produit P × V est-il resté le même ? Pourquoi la loi de Mariotte ne s’applique-t-elle plus ?</li>
      <li>Ajoutez des entités (quantité de gaz) à volume constant : que devient la pression ?</li>
      <li>Choisissez une surface de piston plus grande, à la même pression : que devient la force du gaz ? Et la pression ?</li>
      <li>Réglez le volume du tuyau à 4 mL, notez des mesures et comparez P × V et P × (V + tuyau).</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>pression : chocs des entités sur la paroi ; P en Pa (1 hPa = 100 Pa, 1 bar = 10⁵ Pa)</li>
        <li>vec(F) ⟂ surface, du fluide vers la paroi ; F = P × S (S en m² : 1 cm² = 10⁻⁴ m²)</li>
        <li>température et quantité de gaz constantes : P × V = constante, donc P₂ = P₁ × V₁ / V₂</li>
        <li>on teste la loi en calculant P × V pour plusieurs mesures : égalité aux incertitudes près</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  const sceneDefi = defi && (defi.type === 'force'
    ? <SceneSeringue V={30} N={30} theta={20} capteur={{ type: 'nombre', valeur: defi.variante === 'force' ? pDefi(defi) : '?', unite: defi.variante === 'force' ? defi.uP : 'hPa' }} surface={`S = ${nbf(defi.S, 1)}${NB}cm²`} fige={fige} titre="Seringue : pression et surface du piston"/>
    : <SceneAvantApres V1={defi.V1} V2={defi.V2} P1={`${nbf(defi.P1, 1)} bar`} P2={defi.variante === 'P2' ? 'P₂ = ?' : `${nbf(defi.P2, Math.round(defi.P2 * 100) % 10 === 0 ? 1 : 2)} bar`} un="bar" />);
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .fl-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .fl-l1.cote .fl-carte { order: 2; } .fl-l1.cote .fl-main { order: 1; }
          .fl-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .fl-ex > .fl-ex-scene { grid-column: 1; grid-row: 1; } .fl-ex > .fl-ex-reglages { grid-column: 2; grid-row: 1 / span 3; } .fl-ex > .fl-ex-mesures { grid-column: 1; grid-row: 2; } .fl-ex > .fl-ex-graphe { grid-column: 1; grid-row: 3; } }
        @media (max-width: 900px) { .fl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fl-in { animation: fl-fondu 0.35s ease-out; } @keyframes fl-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Fluide au repos : pression, force pressante et loi de Mariotte</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un gaz enfermé pousse sur ses parois : c’est la <strong>pression</strong> (en pascal), qui vient des chocs des entités. Elle donne une <strong>force pressante</strong> de norme <em>F</em> = <em>P</em> × <em>S</em>, perpendiculaire à la surface. À température et quantité de gaz constantes, <strong>P × V = constante</strong> (loi de Mariotte).</div>
      {enExplore ? <>
        <div className="fl-ex">
          <div className="fl-ex-scene">{boite('Seringue, capteur et forces', exScene)}</div>
          <div className="fl-ex-reglages">{boite('Réglages', exReglages)}</div>
          <div className="fl-ex-mesures">{boite('Mesures et calculs', exMesures)}</div>
          <div className="fl-ex-graphe">{boite('Tester la loi : graphe et tableau', exGraphe)}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`fl-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="fl-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="fl-carte fl-hypo-defi">{panneauHypo}</div> : null}
          <div className="fl-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'force' ? suiviF : suiviM}/></div>}
            {enDefi && defi && <div className="fl-in">{boite(defi.type === 'force' ? 'Le piston et le gaz' : 'Avant et après', sceneDefi)}</div>}
            {enGuide && <div className="fl-in" key={idE}>{sceneGuide}</div>}
            {enGuide && (idE === 'chocs' || idE === 'temperature' || idE === 'volume' || idE === 'fnum') && <div style={{ marginTop: 8 }}><button onClick={() => setFige(f => !f)} aria-pressed={fige} style={stylePetitBouton(fige, '#334155')}>{fige ? '▶ Animer les entités' : '⏸ Figer les entités'}</button></div>}
          </div>
        </div>
        {enGuide && apres('fnum') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
