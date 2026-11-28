import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, lireNombre, IndiceDefi, indicesProfond , Frac } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./tsolModele";
import { SvgSatCarte, SvgRefroidCarte, SvgEauRendementCarte, SvgSensCarte } from "./TsolSchemas";
import { SceneSolubilite } from "./TsolScene";
import { TsolExplore, exInitial, T_BALAYAGE, T_BAS, T_HAUT } from "./TsolExplore";
import { useEtroit, useLecture, StyleAnim } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
// SIM 312 — « Chaud, froid : solubilité, température et recristallisation » (terminale STL, SPCL, Chimie et développement durable : solubilité).
//  Une idée : la solubilité s dépend de la température ; une solution saturée refroidie (ou chauffée, selon le solide) dépose des cristaux, dont on calcule la masse, la masse d'eau minimale et le rendement.
//  Capacités visées (jamais affichées à l'élève) : exploiter une courbe de solubilité ; prévoir la saturation et la masse qui cristallise ; relier le sens de variation de s au caractère endothermique ou exothermique.
//  Hors périmètre : loi de Van't Hoff et calcul de Ks(T) ; sursaturation ; solutions non idéales. Modèle : tsolModele.js. Scène animée : TsolScene.jsx ; exploration : TsolExplore.jsx.
// ====================================================
const BLEU = '#0369a1';
const SO = M.SOLIDES, NH = SO.nh4cl, LI = SO.li2co3;
const nb = M.nbf, NB = M.NB;
const SIM_ID = 312, CLE_GUIDE = 'tsol-guide-v1';
declarerDefis(SIM_ID, [['cristal', 'Masse de cristaux au refroidissement'], ['eau', 'Masse d’eau minimale']]);
const IDS = ['courbe', 'lecture', 'saturee', 'chauffe', 'refroid', 'eaumin', 'rendement', 'decroit', 'endo', 'choix', 'protocole', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// valeurs utilisées dans le parcours (toutes annoncées dans le texte des étapes)
const S20 = M.sol(NH, 20), S40 = M.sol(NH, 40), S60 = M.sol(NH, 60), S80 = M.sol(NH, 80), S0 = M.sol(NH, 0);
const MASSE_NON_DISSOUTE = 40 - S20;                       // étape 3 : 2,8 g
const CRIST_5 = (S80 - S20) * 200 / 100;                  // étape 5 : 56,8 g
const EAU_6 = M.eauMin(NH, 50, 60);                       // étape 6 : 90,6 g
const ETA_7 = M.rendement(NH, 80, 0) * 100;               // étape 7 : 55 %
const TS_LI = M.tSat(LI, 1.2);                            // étape 8 : température d'apparition des premiers cristaux de Li2CO3
const LI_80 = M.etat(LI, 80, 1.2, 100);

// scène de chaque étape : graphe seul ou bécher + graphe
const SC = (so, extra) => ({ so, m: 40, mEau: 100, T0: 20, becher: true, regions: true, pointEtat: true, lecture: false, dir: null, ...extra });
const SCENES = {
  courbe: SC(NH, { becher: false, regions: false, pointEtat: false }),
  lecture: SC(NH, { becher: false, regions: false, pointEtat: false }),
  saturee: SC(NH, { lecture: false }),
  chauffe: SC(NH, { dir: 'chaud', T0: 20 }),
  refroid: SC(NH, { m: S80 * 2, mEau: 200, T0: 80, dir: 'froid' }),
  eaumin: SC(NH, { becher: false, regions: false, pointEtat: false, lecture: true, T0: 60 }),
  rendement: SC(NH, { becher: false, regions: false, pointEtat: false, lecture: true, T0: 80 }),
  decroit: SC(LI, { m: 1.2, mEau: 100, T0: 20, dir: 'chaud' }),
  endo: SC(LI, { m: 1.2, mEau: 100, T0: 20, becher: false, regions: true }),
  choix: SC(NH, { becher: false, regions: true, pointEtat: false, T0: 20 }),
  protocole: SC(NH, { m: S80 * 1, mEau: 100, T0: 80, dir: 'froid' }),
  bilan: SC(NH, { m: 50, mEau: 100, T0: 20 }),
};

// Scène du parcours guidé : T réglable par la poignée, ou balayage chauffer / refroidir
function SceneGuide({ sc, aria }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement(), phase = usePhase(0.8, anime);
  const L = useLecture(T_BALAYAGE, false), jeu = L.t > 0 || L.joue, [Tloc, setTloc] = useState(sc.T0), [touche, setTouche] = useState(false);
  const u = Math.min(1, L.t / T_BALAYAGE), Tbal = sc.dir === 'froid' ? T_HAUT - (T_HAUT - T_BAS) * u : T_BAS + (T_HAUT - T_BAS) * u;
  const T = jeu && sc.dir ? Tbal : Tloc;
  const regler = v => { L.reset(); setTouche(true); setTloc(v); };
  return (
    <div ref={boite} style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <SceneSolubilite solide={sc.so} m={sc.m} mEau={sc.mEau} T={T} setT={regler} etroit={etroit} touche={touche || jeu} svgRef={svgRef} aria={aria} phase={phase}
        dir={L.joue ? sc.dir : null} lecture={sc.lecture} pointEtat={sc.pointEtat} regions={sc.regions} becher={sc.becher}/>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        {sc.dir && <button type="button" onClick={L.joue ? () => L.setJoue(false) : L.demarrer} style={{ ...styleBouton(true, sc.dir === 'froid' ? BLEU : '#b45309'), minHeight: 44 }}>{L.joue ? '⏸ Pause' : L.fin ? '↻ Rejouer' : sc.dir === 'froid' ? '▶ Refroidir' : '▶ Chauffer'}</button>}
        <span style={{ fontSize: 13.5, color: KIT.txt2, flex: '1 1 200px', lineHeight: 1.45 }}>{sc.dir ? 'Faites glisser la poignée rouge sur l’axe des températures, ou lancez le balayage : regardez le bécher et le point sur la courbe.' : 'Faites glisser la poignée rouge sur l’axe des températures pour lire la courbe.'}</span>
      </div>
    </div>);
}

export function SimulationTsol() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('cristal');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ melange: false, graphe: false, essayer: false, retenir: false });
  const [ex, setEx] = useState(exInitial);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'courbe', titre: 'Combien de solide peut-on dissoudre ?',
      texte: <>Dans l’eau, un solide ne se dissout pas sans limite. La <strong>solubilité s</strong> est la masse maximale de soluté que l’on peut dissoudre dans 100{NB}g d’eau à une température T donnée : on l’exprime en g pour 100{NB}g d’eau. Quand cette limite est atteinte, la solution est <strong>saturée</strong>. La courbe ci-dessous donne s en fonction de la température T pour le chlorure d’ammonium NH₄Cl.</>,
      tache: { type: 'qcm', q: 'Comment la solubilité de NH₄Cl varie-t-elle quand la température augmente ?', options: ['elle diminue', 'elle ne change pas', 'elle augmente', 'elle augmente puis diminue'], bonne: 2,
        expl: 'La courbe monte de gauche à droite : plus l’eau est chaude, plus elle dissout de NH₄Cl.',
        indice: 'Regardez comment la courbe évolue quand on va vers la droite, vers les températures plus élevées.' } },
    { id: 'lecture', titre: 'Lire la solubilité sur la courbe',
      texte: <>Pour lire s à une température donnée, on place la poignée rouge à cette température sur l’axe horizontal, puis on lit la hauteur de la courbe sur l’axe vertical (en g pour 100{NB}g d’eau). Les traits de la grille sont espacés de 10{NB}g.</>,
      tache: { type: 'num', q: 'Lisez la solubilité de NH₄Cl à 60 °C (en g pour 100 g d’eau).', unite: 'g', vrai: S60, tol: 0.08, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['On place la poignée à 60 °C et on lit la hauteur de la courbe.', `On trouve environ ${nb(S60, 0)}${NB}g pour 100${NB}g d’eau (valeur de la table : ${nb(S60, 1)}${NB}g).`],
        pieges: [[60, 'Vous avez repris la température (60 °C) : il faut lire la hauteur de la courbe, sur l’axe vertical.']],
        expl: `À 60 °C, s ≈ ${nb(S60, 0)}${NB}g pour 100${NB}g d’eau.`, indice: 'Placez la poignée sur 60 °C, puis suivez horizontalement jusqu’à l’axe vertical : la graduation est entre 50 et 60.' } },
    { id: 'saturee', titre: 'Saturée ou non ?',
      texte: <>À 20{NB}°C, la solubilité de NH₄Cl est s = {nb(S20, 1)}{NB}g pour 100{NB}g d’eau. On introduit 40{NB}g de NH₄Cl dans 100{NB}g d’eau à 20{NB}°C. Le point du graphe se place à la hauteur 40{NB}g pour 100{NB}g d’eau : <strong>sous la courbe</strong>, tout se dissout ; <strong>au-dessus</strong>, la solution est saturée et le surplus reste en cristaux.</>,
      tache: { type: 'num', q: 'Quelle masse de NH₄Cl reste non dissoute (en g) ?', unite: 'g', vrai: MASSE_NON_DISSOUTE, tol: 0.05, affiche: v => nb(v, 1), cs: 2, carnet: false,
        calcul: () => ['L’eau dissout au plus s = 37,2 g de NH₄Cl pour 100 g d’eau à 20 °C.', `Masse non dissoute = 40 − 37,2 = ${nb(MASSE_NON_DISSOUTE, 1)}${NB}g.`],
        pieges: [[S20, 'Vous avez donné la masse dissoute : la masse non dissoute est ce qui dépasse, 40 − s.'], [40 + S20, 'Vous avez additionné : on soustrait la masse dissoute (37,2 g) à la masse introduite (40 g).']],
        expl: `40 − ${nb(S20, 1)} = ${nb(MASSE_NON_DISSOUTE, 1)}${NB}g de cristaux au fond du bécher.`, indice: 'La masse dissoute au maximum est s = 37,2 g (pour 100 g d’eau). On a introduit 40 g : que reste-t-il ?' } },
    { id: 'chauffe', titre: 'Chauffer le bécher',
      retenirTitre: 'À retenir : solubilité et saturation',
      retenir: <><SvgSatCarte/><ul style={ULS}>
        <li>La <strong>solubilité s</strong> est la masse maximale dissoute dans 100 g d’eau à la température T (g pour 100 g d’eau).</li>
        <li>Masse introduite inférieure à la limite : tout se dissout (solution non saturée). Supérieure : solution <strong>saturée</strong>, le surplus est un dépôt de cristaux.</li>
        <li>La limite dépend de la température : elle se lit sur la courbe s(T).</li></ul></>,
      texte: <>Le bécher précédent (100{NB}g d’eau et 40{NB}g de NH₄Cl) est maintenant chauffé de 20{NB}°C à 40{NB}°C. À 40{NB}°C, la solubilité de NH₄Cl est s = {nb(S40, 1)}{NB}g pour 100{NB}g d’eau. Lancez le balayage « Chauffer » et regardez les cristaux et le point d’état.</>,
      tache: { type: 'qcm', q: 'Que devient le contenu du bécher à 40 °C ?', options: ['il reste 2,8 g de cristaux, qui ne se dissolvent jamais', 'les cristaux se dissolvent : la solution est non saturée', 'la solution reste saturée avec davantage de cristaux', 'la masse de NH₄Cl augmente dans le bécher'], bonne: 1,
        expl: `À 40 °C, 100 g d’eau peuvent dissoudre jusqu’à ${nb(S40, 1)} g : 40 g de NH₄Cl se dissolvent entièrement. Le point d’état passe sous la courbe.`,
        indice: 'Comparez la masse introduite (40 g) à la solubilité à 40 °C (45,8 g pour 100 g d’eau).' } },
    { id: 'refroid', titre: 'Refroidir une solution saturée',
      texte: <>On prépare une solution saturée de NH₄Cl dans 200{NB}g d’eau à 80{NB}°C, puis on la laisse refroidir à 20{NB}°C. Solubilité de NH₄Cl : s(80{NB}°C) = {nb(S80, 1)}{NB}g et s(20{NB}°C) = {nb(S20, 1)}{NB}g pour 100{NB}g d’eau. Lancez « Refroidir » : le surplus cristallise.</>,
      tache: { type: 'num', q: 'Quelle masse de cristaux se dépose entre 80 °C et 20 °C (en g) ?', unite: 'g', vrai: CRIST_5, tol: 0.03, affiche: v => nb(v, 1), cs: 3, carnet: false,
        calcul: () => ['Masse dissoute à 80 °C : frac(65,6 × 200|100) = 131,2 g.', 'Masse qui reste dissoute à 20 °C : frac(37,2 × 200|100) = 74,4 g.', `Cristaux : 131,2 − 74,4 = ${nb(CRIST_5, 1)}${NB}g.`],
        pieges: [[S80 - S20, 'Vous avez calculé la masse pour 100 g d’eau : il y a ici 200 g d’eau, multipliez par frac(200|100) = 2.'], [S80 * 2, 'Vous avez donné la masse dissoute à 80 °C : les cristaux sont la différence avec ce qui reste dissous à 20 °C.'], [S20 * 2, 'Vous avez donné la masse qui reste dissoute à 20 °C : les cristaux sont la différence avec la masse dissoute à 80 °C.']],
        expl: `Cristaux = frac((${nb(S80, 1)} − ${nb(S20, 1)}) × 200|100) = ${nb(CRIST_5, 1)}${NB}g.`, indice: 'Masse de cristaux = frac((s(80 °C) − s(20 °C)) × m(eau)|100), avec m(eau) = 200 g.' } },
    { id: 'eaumin', titre: 'Le minimum d’eau',
      retenirTitre: 'À retenir : masse de cristaux au refroidissement',
      retenir: <><SvgRefroidCarte/><ul style={ULS}>
        <li>Solution saturée à T₁ refroidie à T₂ : <strong>m(cristaux) = <Frac haut={<>(s(T₁) − s(T₂)) × m(eau)</>} bas={<>100</>} /></strong>.</li>
        <li>La différence s(T₁) − s(T₂) est donnée pour 100 g d’eau : on multiplie par <Frac haut={<>m(eau)</>} bas={<>100</>} />.</li>
        <li>Plus l’écart entre les deux solubilités est grand, plus il se dépose de cristaux.</li></ul></>,
      texte: <>Pour purifier un solide par recristallisation, on le dissout à chaud dans le <strong>minimum d’eau</strong> : la solution est alors tout juste saturée. On veut dissoudre 50{NB}g de NH₄Cl à 60{NB}°C, où s = {nb(S60, 1)}{NB}g pour 100{NB}g d’eau.</>,
      tache: { type: 'num', q: 'Quelle masse d’eau minimale faut-il (en g) ?', unite: 'g', vrai: EAU_6, tol: 0.03, affiche: v => nb(v, 1), cs: 3, carnet: false,
        calcul: () => ['100 g d’eau dissolvent au plus 55,2 g de NH₄Cl à 60 °C.', `Pour 50 g : m(eau) = frac(100 × 50|55,2) = ${nb(EAU_6, 1)}${NB}g.`],
        pieges: [[50 * S60 / 100, 'Vous avez multiplié par s au lieu de diviser : plus s est grande, moins il faut d’eau.'], [50 / S60, 'Vous avez oublié le facteur 100 : s est donnée pour 100 g d’eau.']],
        expl: `m(eau) = frac(100 × 50|${nb(S60, 1)}) ≈ ${nb(EAU_6, 1)}${NB}g.`, indice: 'Règle de trois : 100 g d’eau dissolvent 55,2 g ; combien de grammes d’eau pour 50 g ?' } },
    { id: 'rendement', titre: 'Le rendement de la recristallisation',
      texte: <>Le <strong>rendement</strong> η est le rapport de la masse de cristaux récupérée à la masse de solide dissoute à chaud. On dissout du NH₄Cl dans le minimum d’eau à 80{NB}°C (s = {nb(S80, 1)}{NB}g pour 100{NB}g d’eau), puis on refroidit jusqu’à 0{NB}°C (s = {nb(S0, 1)}{NB}g pour 100{NB}g d’eau). La masse d’eau se simplifie dans le rapport.</>,
      tache: { type: 'num', q: 'Quel est le rendement théorique η (en %) ?', unite: '%', vrai: ETA_7, tol: 0.03, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['η = frac(s(80 °C) − s(0 °C)|s)(80 °C) = frac(65,6 − 29,4|65,6).', `η = ${nb(M.rendement(NH, 80, 0), 3)} soit environ ${nb(ETA_7, 0)}${NB}%.`],
        pieges: [[(S80 - S0) / S0 * 100, 'Vous avez divisé par la solubilité à froid : on divise par la masse dissoute à chaud, au départ.'], [M.rendement(NH, 80, 0), 'Exprimez le rendement en pourcentage : multipliez le rapport par 100.']],
        expl: `η = frac(${nb(S80, 1)} − ${nb(S0, 1)}|${nb(S80, 1)}) ≈ ${nb(ETA_7, 0)}${NB}%.`, indice: 'η = masse de cristaux divisée par la masse dissoute à chaud = frac(s(T₁) − s(T₂)|s)(T₁), puis ×100 pour un pourcentage.' } },
    { id: 'decroit', titre: 'Et si c’était l’inverse ?',
      retenirTitre: 'À retenir : eau minimale et rendement',
      retenir: <><SvgEauRendementCarte/><ul style={ULS}>
        <li><strong>m(eau) minimale = <Frac haut={<>100 × m(solide)</>} bas={<>s</>} />(T)</strong> : à chaud, s est grande, il faut peu d’eau.</li>
        <li><strong>η = <Frac haut={<>s(T₁) − s(T₂)</>} bas={<>s</>} />(T₁)</strong> : rendement théorique de la recristallisation (rapport de la masse de cristaux à la masse dissoute à chaud).</li>
        <li>On dissout à chaud dans le minimum d’eau, on cristallise à froid.</li></ul></>,
      texte: <>Le carbonate de lithium Li₂CO₃ se comporte autrement : sa solubilité <strong>diminue</strong> quand la température augmente (s = {nb(M.sol(LI, 20), 2)}{NB}g pour 100{NB}g d’eau à 20{NB}°C, {nb(M.sol(LI, 80), 2)}{NB}g à 80{NB}°C). On dissout 1,2{NB}g de Li₂CO₃ dans 100{NB}g d’eau à 20{NB}°C : la solution n’est pas saturée. Lancez « Chauffer ».</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il quand on chauffe cette solution jusqu’à 80 °C ?', options: ['elle reste non saturée : chauffer dissout toujours plus', 'des cristaux de Li₂CO₃ apparaissent', 'la solution se dilue', 'rien : la solubilité ne dépend pas de T'], bonne: 1,
        expl: `Quand T augmente, s diminue : à partir d’environ ${nb(TS_LI, 0)} °C, 1,2 g dépassent la limite et des cristaux se déposent. À 80 °C : ${nb(LI_80.cristaux, 2)} g de cristaux.`,
        indice: 'La limite s(T) descend quand on chauffe. À quelle température passe-t-elle sous 1,2 g pour 100 g d’eau ?' } },
    { id: 'endo', titre: 'Pourquoi la solubilité baisse-t-elle ?',
      texte: <>La dissolution d’un solide libère ou absorbe de la chaleur. Si elle <strong>absorbe</strong> de la chaleur (dissolution <strong>endothermique</strong>), chauffer la favorise : la solubilité augmente avec T (cas de NH₄Cl, dont la dissolution refroidit l’eau). Si elle <strong>libère</strong> de la chaleur (dissolution <strong>exothermique</strong>), chauffer la défavorise : la solubilité diminue avec T. Le produit de solubilité Ks suit le même sens que la solubilité.</>,
      tache: { type: 'qcm', q: 'La solubilité de Li₂CO₃ diminue quand T augmente. Sa dissolution est :', options: ['endothermique : elle absorbe de la chaleur', 'sans échange de chaleur', 'exothermique : elle libère de la chaleur', 'impossible à classer'], bonne: 2,
        expl: 'Chauffer défavorise la dissolution : c’est le signe d’une dissolution exothermique. Pour NH₄Cl, c’est l’inverse (endothermique).',
        indice: 'Chauffer revient à ajouter de la chaleur : le système réagit en consommant cette chaleur, donc en favorisant la transformation qui l’absorbe.' } },
    { id: 'choix', titre: 'Quel solide recristalliser par refroidissement ?',
      retenirTitre: 'À retenir : le sens de variation de s',
      retenir: <><SvgSensCarte/><ul style={ULS}>
        <li>Dissolution <strong>endothermique</strong> : s augmente avec T ; une solution saturée à chaud dépose des cristaux en refroidissant.</li>
        <li>Dissolution <strong>exothermique</strong> : s diminue avec T ; le dépôt se forme en chauffant.</li>
        <li>Ks varie dans le même sens que s.</li></ul></>,
      texte: <>On veut purifier un solide par recristallisation en refroidissant une solution saturée à chaud, comme avec NH₄Cl : s passe de {nb(S80, 1)}{NB}g à {nb(S20, 1)}{NB}g pour 100{NB}g d’eau entre 80{NB}°C et 20{NB}°C. Un solide dont la solubilité ne change presque pas avec T donnerait très peu de cristaux, et un solide dont la solubilité diminue avec T n’en donnerait pas du tout en refroidissant.</>,
      tache: { type: 'qcm', q: 'Quel solide convient le mieux à une recristallisation par refroidissement ?', options: ['un solide très soluble à chaud et peu à froid', 'un solide dont la solubilité est très faible', 'un solide dont la solubilité diminue avec T', 'un solide dont la solubilité ne dépend pas de T'], bonne: 0,
        expl: 'Il faut un grand écart s(T₁) − s(T₂) quand on refroidit : une solubilité qui augmente fortement avec T.',
        indice: 'La masse de cristaux est proportionnelle à s(T₁) − s(T₂) : cherchez le solide qui maximise cet écart à froid.' } },
    { id: 'protocole', titre: 'Le protocole de recristallisation',
      texte: <>Vous savez prévoir la masse de cristaux, l’eau minimale et le rendement. Reste à ranger les opérations d’une recristallisation de NH₄Cl impur : le solide contient des impuretés insolubles dans l’eau et d’autres, très solubles à froid.</>,
      tache: { type: 'qcm', q: 'Dans quel ordre procède-t-on ?', options: ['dissoudre dans beaucoup d’eau froide, chauffer, puis filtrer à froid les cristaux', 'dissoudre à chaud (peu d’eau), filtrer, refroidir, filtrer', 'chauffer jusqu’à évaporer toute l’eau, puis récupérer le solide sec', 'dissoudre à froid dans beaucoup d’eau, filtrer, puis refroidir encore'], bonne: 1,
        expl: 'On dissout à chaud (peu d’eau, solution saturée), on filtre à chaud pour retirer les insolubles, on refroidit pour faire cristalliser NH₄Cl, puis on filtre : les impuretés solubles restent dans l’eau.',
        indice: 'Le solide doit d’abord être dissous : à quelle température dissout-il le plus ? Ensuite, c’est le refroidissement qui provoque la cristallisation.' } },
    { id: 'bilan', titre: 'Le bilan',
      texte: <>Vous savez lire une courbe de solubilité, reconnaître une solution saturée, calculer la masse de cristaux déposée quand la température varie, la masse d’eau minimale et le rendement d’une recristallisation, et relier le sens de variation de s au caractère endothermique ou exothermique de la dissolution. En exploration, choisissez le solide, la masse d’eau et la masse de solide, puis faites varier la température. Les défis demandent de lire la courbe pour calculer une masse de cristaux ou une masse d’eau minimale.</>,
      tache: null },
  ];

  const nouveauDefi = type => setDefi({ type, ...(type === 'cristal' ? M.tirageDefiCristal() : M.tirageDefiEau()), rep: '', verifie: false, corr: false });
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défis ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const saisie = { font: 'inherit', fontSize: 16, padding: '8px 10px', minHeight: 44, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, width: '100%', boxSizing: 'border-box' };
  const verifier = () => {
    const x = lireNombre(defi.rep), dq = defi.type === 'cristal' ? M.diagCristal(defi, x) : M.diagEau(defi, x);
    setDefi(d => ({ ...d, verifie: true, ok: dq.ok, dq })); (defi.type === 'cristal' ? noterC : noterE)(dq.ok);
  };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const voletDefi = defi && (() => {
    const cr = defi.type === 'cristal';
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['cristal', 'Masse de cristaux'], ['eau', 'Masse d’eau minimale']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      {cr ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : les cristaux de NH₄Cl</div>
        <div style={{ ...lbl, marginBottom: 8 }}>On prépare une solution saturée de chlorure d’ammonium dans {defi.mEau}{NB}g d’eau à {defi.T1}{NB}°C, puis on la refroidit à {defi.T2}{NB}°C. <strong>Lisez</strong> les solubilités sur la courbe (poignée rouge, grille de 10{NB}g) et calculez la masse de cristaux qui se dépose, en g (tolérance de lecture 12{NB}%).</div>
        <label style={{ ...lbl, display: 'block' }}>Masse de cristaux (g)
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="masse de cristaux en grammes" style={{ ...saisie, marginTop: 2 }}/></label>
        <div style={{ height: 8 }}/>
        <IndiceDefi cache={false}>Lisez s({defi.T1}{NB}°C) et s({defi.T2}{NB}°C) sur la courbe : ce sont des masses pour 100 g d’eau. Cristaux = <Frac haut={<>(s(T₁) − s(T₂)) × m(eau)</>} bas={<>100</>} />.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : le minimum d’eau</div>
        <div style={{ ...lbl, marginBottom: 8 }}>On veut dissoudre {defi.m}{NB}g de chlorure d’ammonium à {defi.T}{NB}°C dans le minimum d’eau. <strong>Lisez</strong> la solubilité sur la courbe (poignée rouge, grille de 10{NB}g) et calculez la masse d’eau minimale, en g (tolérance de lecture 12{NB}%).</div>
        <label style={{ ...lbl, display: 'block' }}>Masse d’eau minimale (g)
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="masse d’eau minimale en grammes" style={{ ...saisie, marginTop: 2 }}/></label>
        <div style={{ height: 8 }}/>
        <IndiceDefi cache={false}>Lisez s({defi.T}{NB}°C) sur la courbe (g pour 100 g d’eau), puis m(eau) = <Frac haut={<>100 × m(solide)</>} bas={<>s</>} />.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} disabled={!defi.rep.trim()} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct : ${cr ? `environ ${nb(defi.vrai, 0)}${NB}g de cristaux` : `environ ${nb(defi.vrai, 0)}${NB}g d’eau`} (valeur calculée avec les solubilités exactes de la table).` : `✗ ${defi.dq.msg}`}
      </div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {cr ? <>
          <div>Lectures : s({defi.T1}{NB}°C) ≈ {nb(defi.s1, 1)}{NB}g et s({defi.T2}{NB}°C) ≈ {nb(defi.s2, 1)}{NB}g pour 100{NB}g d’eau.</div>
          <div>Cristaux = <Frac haut={<>({nb(defi.s1, 1)} − {nb(defi.s2, 1)}) × {defi.mEau}</>} bas={<>100</>} /> = <strong>{nb(defi.vrai, 1)}{NB}g</strong> (tolérance : de {nb(defi.vrai * 0.88, 0)} à {nb(defi.vrai * 1.12, 0)}{NB}g).</div></>
          : <>
          <div>Lecture : s({defi.T}{NB}°C) ≈ {nb(defi.s, 1)}{NB}g pour 100{NB}g d’eau.</div>
          <div>m(eau) = <Frac haut={<>100 × {defi.m}</>} bas={<>{nb(defi.s, 1)}</>} /> = <strong>{nb(defi.vrai, 1)}{NB}g</strong> (tolérance : de {nb(defi.vrai * 0.88, 0)} à {nb(defi.vrai * 1.12, 0)}{NB}g).</div></>}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Solubilité s</strong> : masse maximale de soluté dans 100 g d’eau, en g pour 100 g d’eau (et non pour 100 mL de solution), pression atmosphérique, eau pure.</li>
      <li><strong>Valeurs</strong> (g pour 100 g d’eau, à 0, 20, 40, 60, 80 et 100 °C) : NH₄Cl {NH.s.map(v => nb(v, 1)).join(' ; ')} ; Li₂CO₃ {LI.s.map(v => nb(v, 2)).join(' ; ')}. Sources : tables usuelles de solubilité dans l’eau (CRC Handbook, tableau « Solubility table » de Wikipédia), valeurs arrondies. D’autres tables donnent des valeurs légèrement différentes (de 1 à 3 %).</li>
      <li><strong>Interpolation</strong> : entre deux températures tabulées, s est supposée varier linéairement (écart inférieur à 1 % avec les tables à pas de 10 °C).</li>
      <li><strong>Équilibre</strong> : on suppose la cristallisation immédiate dès que la limite est dépassée (pas de sursaturation ; en pratique le dépôt peut tarder), et le solide pur, sans impuretés ni autre ion en solution.</li>
      <li><strong>Masses</strong> : 1 g d’eau pour 1 mL ; la masse d’eau est constante (pas d’évaporation). Les masses de cristaux sont théoriques : on ignore les pertes à la filtration et l’eau retenue.</li>
      <li><strong>Rendement</strong> : défini comme masse de cristaux divisée par la masse dissoute à chaud (rendement théorique de la recristallisation par variation de température).</li>
      <li><strong>Sens de variation</strong> : relation qualitative entre s(T) et le caractère endothermique ou exothermique de la dissolution ; aucun calcul de Ks(T) (loi de Van’t Hoff hors périmètre).</li>
      <li><strong>Lecture graphique</strong> : tolérance de 8 % au parcours et de 12 % aux défis ; résultats à 2 ou 3 chiffres significatifs.</li>
      <li><strong>Animation</strong> : nombre d’ions et de cristaux proportionnel aux masses dissoute et déposée (qualitatif) ; les couleurs sont schématiques.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec NH₄Cl, 100 g d’eau et 50 g de solide, déplacez la poignée : à quelle température apparaissent les premiers cristaux en refroidissant ?</li>
        <li>Doublez la masse d’eau (200 g) en gardant « 50 g pour 100 g d’eau » : la température de saturation change-t-elle ? Et la masse de cristaux à 20 °C ?</li>
        <li>Passez à Li₂CO₃ et chauffez : à quelle température le premier cristal apparaît-il ? Le point d’état monte-t-il ou descend-il par rapport à la courbe ?</li>
        <li>Lancez « Refroidir » avec 80 g pour 100 g d’eau : repérez les deux moments où le nombre de cristaux change le plus.</li>
        <li>Comparez la masse de cristaux obtenue avec NH₄Cl à 20 °C et à 0 °C : jusqu’où vaut-il la peine de refroidir ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Solubilité s : masse maximale dissoute dans 100 g d’eau à T ; au-delà, solution saturée et dépôt de cristaux.</li>
        <li>Cristaux = <Frac haut={<>(s(T₁) − s(T₂)) × m(eau)</>} bas={<>100</>} /> pour une solution saturée à T₁ portée à T₂.</li>
        <li>m(eau) minimale = <Frac haut={<>100 × m(solide)</>} bas={<>s</>} />(T) ; rendement η = <Frac haut={<>s(T₁) − s(T₂)</>} bas={<>s</>} />(T₁).</li>
        <li>Dissolution endothermique : s augmente avec T ; exothermique : s diminue avec T.</li>
      </ul>)}
    </Section>);

  // ---------- scène du parcours ----------
  const sc = enGuide ? SCENES[idE] : null;
  const ariaSc = sc ? `${sc.becher ? `Bécher contenant ${sc.mEau} g d’eau et ${nb(sc.m, 1)} g de ${sc.so.formule}, avec thermomètre. ` : ''}Graphe de la solubilité de ${sc.so.formule} en fonction de la température, avec une poignée rouge pour régler la température.` : '';
  const scDefi = defi ? { so: NH, m: 0, mEau: 100, T0: 50, becher: false, regions: false, pointEtat: false, lecture: false, dir: null } : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tsol-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tsol-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
        @media (max-width: 900px) { .tsol-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tsol-in { animation: tsol-fondu 0.35s ease-out; } @keyframes tsol-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chaud, froid : solubilité, température et recristallisation</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La <strong>solubilité</strong> d’un solide dépend de la <strong>température</strong> : en refroidissant (ou en chauffant) une solution saturée, des <strong>cristaux</strong> se déposent et on peut <strong>purifier</strong> le solide.</div>
      {!enExplore && <div className={`tsol-l1${(enGuide && sc) || (enDefi && scDefi) ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'cristal' ? suiviC : suiviE}/></div>}
          {enDefi && scDefi && <div key={`d${defi.type}${defi.mEau || defi.m}${defi.T1 || defi.T}`} style={{ marginTop: 10 }}><SceneGuide sc={scDefi} aria="Graphe de la solubilité du chlorure d’ammonium en fonction de la température, avec une poignée rouge pour lire la courbe."/></div>}
          {enGuide && sc && <div className="tsol-in" key={`s${idE}`}><SceneGuide sc={sc} aria={ariaSc}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <TsolExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv} menu={menu}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
