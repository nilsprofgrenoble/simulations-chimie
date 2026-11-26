import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, FormuleEnLigne, lireNombre } from "../commun";
import { Pic } from "../Pictos";
import * as C from "./couleurModele";
import * as M from "./xyyModele";
import { QCM } from "./xyyQcm";
import { SvgChroma, SvgCarteLire, SvgCarteCompl, SvgCarteBlanc, SvgCarteBilan } from "./XyySchemas";

const SIM_ID = 248, CLE_GUIDE = 'xyy-guide-v1';
declarerDefis(SIM_ID, [['dominante', 'Lire la longueur d’onde dominante d’une couleur'], ['nature', 'Pourpre ou lumière spectrale, et reproduction sur écran']]);

// ====================================================
//  SIM 248 — LE DIAGRAMME DE CHROMATICITÉ xy (BTS MDC, Formulation, « Aspect »)
//  Capacités visées (jamais affichées à l'élève) : repérer une couleur sur le diagramme de chromaticité ; en déduire longueur d'onde dominante, pureté
//  d'excitation et complémentaire ; situer le domaine de couleurs reproductible par un écran.
//  Modèle : couleurModele.js et xyyModele.js (CIE 1931, observateur 2°). Schémas : XyySchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const n0 = v => String(Math.round(v)).replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['locus', 'pourpres', 'blanc', 'dominante', 'purete', 'pourpre', 'gamut', 'lum', 'illum', 'illum2', 'bilan'];
const BASE = { lam: 550, w: 0.5, pur: 1, ill: 'D65' };
const DEPART = { locus: { lam: 550 }, pourpres: { w: 0.5 }, blanc: { pur: 1 }, gamut: { lam: 520 } };
const PB = C.pointDeDominante(480, 0.6), PILL = { D65: 'D65 (lumière du jour)', A: 'A (lampe à incandescence)', F2: 'F2 (tube fluorescent)' };
const VIOLET = C.pointLieu(400), ROUGE = C.pointLieu(700);
// Notation mathématique classique
const FormPurete = () => <><mi>p</mi><mo>=</mo><mfrac><mi>WP</mi><mi>WD</mi></mfrac></>;
const Pastille = ({ css, nom, hauteur = 44 }) => (<div style={{ flex: 1, minWidth: 0 }}><div aria-hidden="true" style={{ height: hauteur, borderRadius: 8, background: css, border: '1.5px solid #334155' }}/>{nom && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3, textAlign: 'center' }}>{nom}</div>}</div>);
const css = p => C.cssXYNormalise(p.x, p.y);
const court = (a, b, f = 0.8) => ({ x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) });   // droite tracée en partie : l'élève la prolonge

export function SimulationXyy() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState(() => ({ ...C.pointDeDominante(560, 0.6), triangle: true, ill: 'D65' }));
  const [ouv, setOuv] = useState({});
  const [suiviD, noterD] = useCompteurDefi(), [suiviN, noterN] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('dominante');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const pLieu = C.pointLieu(vie.lam), pPour = C.melange(VIOLET, ROUGE, vie.w);
  const lecLieu = M.lecture(pLieu.x, pLieu.y);
  const PL = M.PT_LECTURE, PQ = M.PT_POURPRE, D590 = C.pointLieu(590), C540 = C.pointLieu(540);

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'locus', titre: 'Le diagramme et sa courbe en cloche', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Le <strong>diagramme de chromaticité</strong> représente toutes les couleurs qu’un œil humain peut voir, <strong>sans tenir compte de leur clarté</strong>, par deux nombres <strong>x</strong> et <strong>y</strong>. Une lumière qui ne contient qu’<strong>une seule longueur d’onde</strong> (laser, lampe à vapeur) est dite <strong>monochromatique</strong>. Faites varier sa longueur d’onde avec le curseur et observez où se place le point.</>,
      tache: { type: 'qcm', q: 'Où se placent les lumières monochromatiques ?', ...QCM.locus,
        expl: 'Quand la longueur d’onde varie de 400 à 700 nm, le point décrit la courbe en cloche : c’est le lieu spectral. Ces couleurs sont les plus saturées que l’œil puisse voir.', indice: 'Déplacez le curseur de la longueur d’onde et regardez la trajectoire du point.' } },
    { id: 'pourpres', titre: 'La droite des pourpres', focus: ['scene', 'curseur'],
      texte: <>Le segment qui ferme le diagramme en bas, <strong>la droite des pourpres</strong>, relie les deux extrémités de la courbe : le <strong>violet (400 nm)</strong> et le <strong>rouge (700 nm)</strong>. Les couleurs qui s’y trouvent (magenta, pourpre) ne correspondent à <strong>aucune</strong> longueur d’onde. Le curseur déplace un point le long de cette droite, du violet au rouge.</>,
      tache: { type: 'qcm', q: 'Comment obtient-on une lumière de la couleur du magenta ?', ...QCM.pourpres,
        expl: 'Le magenta n’existe pas dans l’arc-en-ciel : on l’obtient en mélangeant deux lumières des extrémités du spectre, du rouge et du violet. Son point se place sur le segment qui les joint.', indice: 'Regardez le point : sur quel segment se déplace-t-il, et quelles couleurs sont à ses deux bouts ?' } },
    { id: 'blanc', titre: 'Le point blanc et la saturation', focus: ['scene', 'curseur'],
      texte: <>Au centre du diagramme se trouve le <strong>point blanc W</strong>, ici celui de la lumière du jour D65 (x = 0,313 ; y = 0,329). Plus une couleur est loin du blanc, plus elle est <strong>saturée</strong>. Le curseur règle la <strong>pureté</strong> d’une lumière bleue (480 nm) mélangée à de la lumière blanche : 100 % = lumière bleue seule, 0 % = blanc seul.</>,
      tache: { type: 'qcm', q: 'On ajoute de la lumière blanche à la lumière bleue. Le point…', ...QCM.blanc,
        expl: 'Un mélange de lumière bleue et de lumière blanche se place sur le segment qui joint le blanc au point bleu de la courbe. Plus on ajoute de blanc, plus on se rapproche de W : la couleur est plus pâle, moins saturée.', indice: 'Faites passer la pureté de 100 % à 0 % et regardez où va le point et comment change la couleur.' } },
    { id: 'dominante', titre: 'Longueur d’onde dominante', focus: ['scene'],
      texte: <>On décrit une couleur par sa <strong>longueur d’onde dominante</strong> : celle de la lumière monochromatique qui a la même teinte. Pour la trouver, on trace la droite qui part du <strong>blanc W</strong> et passe par le point <strong>P</strong> de la couleur, et on la prolonge jusqu’à la courbe (point D) : la graduation donne la longueur d’onde. La droite est déjà tracée en partie : prolongez-la à la règle ou à l’œil. La graduation est en nm (un trait tous les 10 nm).</>,
      tache: { type: 'num', q: 'Longueur d’onde dominante de la couleur P', unite: 'nm', vrai: 590, tol: 0.015, affiche: v => n0(v), cs: 3,
        calcul: () => ['On lit la graduation de la courbe à l’endroit où la droite W → P, prolongée, la rencontre.', 'Elle la rencontre entre les repères 580 et 600 nm, à mi-chemin : environ 590 nm (une teinte orangée).'],
        pieges: [[487, 'Vous avez lu de l’autre côté du blanc : c’est la longueur d’onde complémentaire. La dominante se lit du côté de P, en prolongeant la droite au-delà de P.']],
        expl: 'La droite W → P prolongée rencontre la courbe vers 590 nm : la dominante est environ 590 nm (orange).', indice: 'Suivez la droite depuis le blanc, au-delà du point P, jusqu’à la courbe, puis lisez la graduation, entre deux repères de 20 nm.' } },
    { id: 'purete', titre: 'La pureté d’excitation', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : lire un point du diagramme', retenir: <>
        <SvgCarteLire/>
        <ul style={puces}>
          <li>On trace la droite du blanc W au point P, puis on la prolonge jusqu’à la courbe en D.</li>
          <li>D donne la longueur d’onde dominante ; le rapport WP / WD donne la pureté.</li>
        </ul></>,
      texte: <>La couleur P a pour longueur d’onde dominante 590 nm (point D). Sa <strong>pureté d’excitation</strong> compare sa distance au blanc à celle de la lumière monochromatique : <strong>p = WP / WD</strong>, de 0 (blanc) à 1 (lumière monochromatique). Les distances, mesurées sur le diagramme, sont <strong>WP = 0,17</strong> et <strong>WD = 0,28</strong>.</>,
      tache: { type: 'num', q: 'Pureté d’excitation p de la couleur P', unite: '', vrai: 0.17 / 0.28, tol: 0.04, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['La pureté est le rapport de la distance WP du blanc au point P, à la distance WD du blanc à la courbe.', <><FormuleEnLigne><FormPurete/></FormuleEnLigne> soit <FormuleEnLigne><mi>p</mi><mo>=</mo><mfrac><mn>0,17</mn><mn>0,28</mn></mfrac><mo>≈</mo><mn>0,61</mn></FormuleEnLigne>.</>, 'C’est une couleur assez saturée (60 %) : la lumière monochromatique serait à 1.'],
        pieges: [[0.28 / 0.17, 'Vous avez divisé WD par WP : la pureté est inférieure à 1, c’est la plus petite distance divisée par la plus grande.'], [0.11, 'Vous avez soustrait les distances. La pureté est un rapport, WP divisé par WD.']],
        expl: 'p = WP / WD = 0,17 / 0,28 ≈ 0,61 : la couleur P est à peu près aux deux tiers du chemin du blanc vers la courbe.', indice: <>Divisez la distance du blanc au point par la distance du blanc à la courbe : <FormuleEnLigne><FormPurete/></FormuleEnLigne>.</> } },
    { id: 'pourpre', titre: 'Un pourpre : la longueur d’onde complémentaire', focus: ['scene'],
      retenirTitre: 'À retenir : pourpres et complémentaires', retenir: <>
        <SvgCarteCompl/>
        <ul style={puces}>
          <li>Deux longueurs d’onde complémentaires sont alignées avec le blanc, de part et d’autre.</li>
          <li>Pour un pourpre, on lit la longueur d’onde complémentaire de l’autre côté du blanc.</li>
        </ul></>,
      texte: <>Le point <strong>Q</strong> se trouve dans la zone des pourpres. Si l’on prolonge la droite W → Q <strong>au-delà de Q</strong>, elle rencontre la droite des pourpres, pas la courbe : il n’y a pas de longueur d’onde dominante. On utilise alors la <strong>longueur d’onde complémentaire</strong> : on prolonge la droite <strong>de l’autre côté du blanc</strong> (en pointillés, tracée en partie) jusqu’à la courbe.</>,
      tache: { type: 'num', q: 'Longueur d’onde complémentaire du pourpre Q', unite: 'nm', vrai: 540, tol: 0.015, affiche: v => n0(v), cs: 3,
        calcul: () => ['La droite Q → W, prolongée de l’autre côté du blanc, rencontre la courbe dans le vert.', 'La lecture de la graduation donne environ 540 nm.'],
        pieges: [],
        expl: 'La droite Q → W prolongée rencontre la courbe vers 540 nm : on dit que le pourpre Q a pour longueur d’onde complémentaire 540 nm.', indice: 'Partez de Q, passez par le blanc W, et continuez jusqu’à la courbe ; lisez la graduation à cet endroit.' } },
    { id: 'gamut', titre: 'Ce qu’un écran peut afficher', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Un écran affiche ses couleurs avec trois lumières, <strong>rouge, verte et bleue</strong> (les primaires de la norme sRGB), dont les points sont les sommets d’un <strong>triangle</strong> : il ne peut afficher que les couleurs situées à l’intérieur de ce triangle. Déplacez le curseur de longueur d’onde : le tableau de mesures indique si la couleur monochromatique correspondante est <strong>à l’intérieur du triangle</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi un écran ne peut-il pas afficher exactement la lumière verte d’un laser à 520 nm ?', ...QCM.gamut,
        expl: 'Un écran ne peut afficher que les couleurs situées à l’intérieur du triangle formé par ses trois primaires. Le vert à 520 nm est sur la courbe, hors du triangle : l’écran affiche un vert moins saturé.', indice: 'Placez le curseur à 520 nm et regardez si le point est dans le triangle ou en dehors.' } },
    { id: 'lum', titre: 'Ce que le diagramme ne dit pas : la clarté', focus: ['scene', 'mesures'],
      texte: <>Deux lumières ont <strong>le même point (x ; y)</strong> sur le diagramme, mais des <strong>luminances Y</strong> différentes : 25 pour l’une, 75 pour l’autre (échelle de 0 à 100). Comparez leurs couleurs.</>,
      tache: { type: 'qcm', q: 'Ces deux lumières diffèrent par…', ...QCM.lum,
        expl: 'x et y fixent la teinte et la saturation. Pour décrire complètement une couleur, il faut une troisième grandeur, la luminance Y (la clarté) : on note la couleur (x, y, Y).', indice: 'Les deux couleurs sont au même point du diagramme : qu’est-ce qui reste différent entre les pastilles ?' } },
    { id: 'illum', titre: 'Ce que le diagramme suppose : le blanc de référence', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Le point blanc W n’est pas universel : c’est la couleur d’un <strong>objet blanc</strong> éclairé par la source prise comme <strong>référence</strong>. Sous la lumière du jour <strong>D65</strong>, W = (0,313 ; 0,329). Sous une lampe à incandescence <strong>A</strong>, W = (0,448 ; 0,408), plus jaune-orangé. Le point P de coordonnées <strong>(0,470 ; 0,386)</strong> ne bouge pas : avec le blanc D65, sa dominante est 590 nm et sa pureté 0,60. Passez au blanc A et suivez la droite tracée de W vers P, prolongée jusqu’au bord du diagramme. Les deux pastilles montrent la couleur de P vue sous D65, et celle qu’un œil habitué à la lampe A perçoit (calcul d’adaptation approché).</>,
      tache: { type: 'qcm', q: 'On remplace le blanc D65 par celui de la lampe A, sans toucher à P. Que devient la lecture de P ?', ...QCM.illum,
        expl: 'P n’a pas changé, mais le blanc de référence si : avec la lampe A, W passe tout près de P. La droite W → P prolongée rejoint alors la droite des pourpres, donc P n’a plus de longueur d’onde dominante (on lit une complémentaire, environ 514 nm) et sa pureté tombe à 0,12. Une lumière orangée paraît à peu près blanche quand l’œil est habitué à l’éclairage d’une lampe à incandescence.', indice: 'Basculez entre D65 et A et regardez où se termine la droite qui part de W en passant par P : sur la courbe, ou sur la droite des pourpres ?' } },
    { id: 'illum2', titre: 'Un autre point, un autre effet', focus: ['scene', 'curseur'],
      retenirTitre: 'À retenir : le blanc de référence', retenir: <>
        <SvgCarteBlanc/>
        <ul style={puces}>
          <li>Le blanc W dépend de l’illuminant (D65, A, F2…).</li>
          <li>Un même point P donne une autre dominante et une autre pureté : il peut même devenir un pourpre.</li>
          <li>On indique donc toujours l’illuminant.</li>
        </ul></>,
      texte: <>Prenons un point bleu B de coordonnées <strong>(0,180 ; 0,211)</strong>. Avec le blanc D65, sa dominante est <strong>480 nm</strong> et sa pureté <strong>0,60</strong>. Basculez entre les blancs D65 et A et regardez ce qui bouge : le blanc W, la droite, le point où elle rejoint la courbe, la distance de W à B.</>,
      tache: { type: 'qcm', q: 'Que devient la lecture de B quand on passe du blanc D65 au blanc A ?', ...QCM.illum2,
        expl: 'Le blanc A s’est déplacé vers l’orange, donc loin de B, presque dans l’alignement W → B : la droite rejoint la courbe presque au même endroit (dominante ≈ 481 nm) mais la distance de W à B augmente, donc la pureté passe de 0,60 à environ 0,74. L’effet d’un changement de blanc dépend de la couleur : c’est pourquoi on précise toujours l’illuminant avec une dominante ou une pureté.', indice: 'Comparez la direction de la droite et la longueur du segment W → B sous D65 puis sous A : quelle grandeur est un rapport de distances ?' } },
    { id: 'bilan', titre: 'Le bilan : lire une couleur sur le diagramme', focus: [],
      retenirTitre: 'À retenir : le diagramme xy', retenir: <>
        <SvgCarteBilan/>
        <ul style={puces}>
          <li>Un point (x ; y) donne la teinte et la saturation, pas la clarté (Y).</li>
          <li>Droite du blanc au point, prolongée : longueur d’onde dominante et pureté.</li>
          <li>Un écran reproduit l’intérieur du triangle de ses trois primaires.</li>
          <li>Dominante et pureté dépendent du blanc de référence : on indique l’illuminant (D65, A…).</li>
        </ul></>,
      texte: <>Vous savez lire une couleur sur le diagramme (dominante, pureté, complémentaire), dire si un écran peut l’afficher et mesurer l’effet d’un changement de blanc de référence. En exploration, placez vos propres points et changez d’illuminant ; les défis testent la lecture des couleurs.</> },
  ];
  const IDS = ORDRE, etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => ({ ...BASE, ...(DEPART[IDS[ni]] ?? {}) }));
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE, pLum = { x: 0.45, y: 0.40 };
  const L480 = M.lumiere(480, vie.pur);
  const wG = M.blancIll(vie.ill), lG = M.lecture(PL.x, PL.y, wG), lB = M.lecture(PB.x, PB.y, wG), pPercuG = M.adapter(PL, wG, M.W);   // couleur de P perçue par un œil adapté au blanc choisi
  const sceneGuide = !enGuide ? null
    : sc === 'locus' ? <><div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Pastille css={css(pLieu)} nom={`${n0(vie.lam)} nm`} hauteur={30}/></div><SvgChroma pts={[{ ...pLieu, nom: '', col: '#0f172a', creux: true }]} blanc={false}/></>
    : sc === 'pourpres' ? <><div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Pastille css={css(pPour)} nom="couleur du point" hauteur={30}/></div><SvgChroma pourpres ticks={false} blanc={false}
        lignes={[{ a: VIOLET, b: ROUGE, col: '#a21caf', w: 4 }]} pts={[{ ...VIOLET, nom: 'violet 400 nm', col: '#4c1d95', dx: 12, dy: -6 }, { ...ROUGE, nom: 'rouge 700 nm', col: '#991b1b', dx: -10, dy: -10, anchor: 'end' }, { ...C.melange(VIOLET, ROUGE, vie.w), nom: '', col: '#0f172a', creux: true }]}/></>
    : sc === 'blanc' ? <><div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Pastille css={css(L480)} nom={`pureté ${n0(vie.pur * 100)} %`} hauteur={30}/></div><SvgChroma ticks={false} lignes={[{ a: M.W, b: C.pointLieu(480), col: '#0f172a', w: 1.8, dash: '5 4' }]}
        pts={[{ ...C.pointLieu(480), nom: '480 nm', col: '#1e3a8a', dx: -10, dy: 4, anchor: 'end', creux: true }, { ...L480, nom: '', col: '#0f172a' }]}/></>
    : sc === 'dominante' ? <SvgChroma lignes={[{ a: M.W, b: court(M.W, D590), col: '#0f172a', w: 2.2 }]} pts={[{ ...PL, nom: 'P', col: '#0f172a', dx: 11, dy: 18 }]}/>
    : sc === 'purete' ? <SvgChroma lignes={[{ a: M.W, b: PL, col: COL.orange, w: 4 }, { a: PL, b: D590, col: '#0f172a', w: 2, dash: '5 4' }]} pts={[{ ...PL, nom: 'P', col: '#0f172a', dx: 11, dy: 18 }, { ...D590, nom: 'D', col: COL.orange, dx: 10, dy: -8 }]} notes={[{ x: 0.40, y: 0.325, txt: 'WP', col: COL.orange }]}/>
    : sc === 'pourpre' ? <SvgChroma pourpres lignes={[{ a: M.W, b: PQ, col: '#0f172a', w: 2.2 }, { a: M.W, b: court(M.W, C540), col: '#0f172a', w: 2.2, dash: '6 4' }]} pts={[{ ...PQ, nom: 'Q', col: '#a21caf', dx: 11, dy: 18 }]}/>
    : sc === 'gamut' ? <SvgChroma triangle ticks={false} pts={[{ ...pLieu, nom: '', col: '#0f172a', creux: true }]}/>
    : sc === 'illum' ? <><div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Pastille css={css(PL)} nom="P vu sous D65" hauteur={30}/>{vie.ill !== 'D65' && <Pastille css={css(pPercuG)} nom={`P perçu, œil adapté à ${vie.ill}`} hauteur={30}/>}</div><SvgChroma ticks w={wG} nomBlanc={`W (${vie.ill})`} lignes={lG.frontiere ? [{ a: wG, b: lG.frontiere, col: '#0f172a', w: 2.2 }] : []} pts={[{ ...PL, nom: 'P', col: '#0f172a', dx: 11, dy: 18 }]}/></>
    : sc === 'illum2' ? <SvgChroma ticks w={wG} nomBlanc={`W (${vie.ill})`} lignes={lB.frontiere ? [{ a: wG, b: lB.frontiere, col: '#0f172a', w: 2.2 }] : []} pts={[{ ...PB, nom: 'B', col: '#0f172a', dx: -11, dy: 4, anchor: 'end' }]}/>
    : sc === 'lum' ? <><div style={{ display: 'flex', gap: 10, marginBottom: 8 }}><Pastille css={C.cssXY(pLum.x, pLum.y, 25)} nom="Y = 25" hauteur={54}/><Pastille css={C.cssXY(pLum.x, pLum.y, 75)} nom="Y = 75" hauteur={54}/></div><SvgChroma ticks={false} pts={[{ ...pLum, nom: 'les deux lumières', col: '#0f172a', creux: true, dx: 12, dy: -6 }]}/></>
    : null;
  const MES_GUIDE = {
    locus: [['Longueur d’onde', `${n0(vie.lam)} nm`], ['x', fr(pLieu.x, 3)], ['y', fr(pLieu.y, 3)]],
    purete: [['Longueur d’onde dominante de P', '590 nm'], ['WP', '0,17'], ['WD', '0,28']],
    gamut: [['Longueur d’onde', `${n0(vie.lam)} nm`], ['Dans le triangle de l’écran', lecLieu.dansEcran ? 'oui' : 'non']],
    lum: [['x ; y des deux lumières', '0,45 ; 0,40'], ['Luminance Y', '25 et 75']],
    illum: [['Blanc de référence', PILL[vie.ill]], ['x ; y du blanc W', `${fr(wG.x, 3)} ; ${fr(wG.y, 3)}`], ['x ; y du point P', '0,470 ; 0,386'], ...(vie.ill !== 'D65' ? [['x ; y perçus (œil adapté)', `${fr(pPercuG.x, 3)} ; ${fr(pPercuG.y, 3)}`]] : [])],
    illum2: [['Blanc de référence', PILL[vie.ill]], ['x ; y du blanc W', `${fr(wG.x, 3)} ; ${fr(wG.y, 3)}`], ['x ; y du point B', '0,180 ; 0,211']],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const setV = k => ev => setVie(s => ({ ...s, [k]: parseFloat(ev.target.value) }));
  const curseurGuide = enGuide && ['locus', 'pourpres', 'blanc', 'gamut', 'illum', 'illum2'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {(sc === 'locus' || sc === 'gamut') && curs('xy-gl', `Longueur d’onde : ${n0(vie.lam)} nm`, vie.lam, 400, 700, 5, setV('lam'), 'De 400 nm (violet) à 700 nm (rouge).')}
      {sc === 'pourpres' && curs('xy-gp', `Position sur la droite : ${n0(vie.w * 100)} %`, vie.w, 0, 1, 0.01, setV('w'), '0 % : extrémité violette ; 100 % : extrémité rouge.')}
      {sc === 'blanc' && curs('xy-gb', `Pureté de la lumière bleue : ${n0(vie.pur * 100)} %`, vie.pur, 0, 1, 0.01, setV('pur'), '100 % : lumière bleue seule ; 0 % : blanc.')}
      {(sc === 'illum' || sc === 'illum2') && <><div style={libelle}>Blanc de référence</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[['D65', '☀️ D65 : lumière du jour'], ['A', '💡 A : lampe à incandescence']].map(([id, l]) => <button key={id} onClick={() => setVie(v => ({ ...v, ill: id }))} aria-pressed={vie.ill === id} style={stylePetitBouton(vie.ill === id, '#7c3aed')}>{l}</button>)}</div></>}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'dominante' ? { kind, ...M.tirageDominante(Math.random), rep: '', verifie: false } : { kind, ...M.tirageNature(Math.random), repN: '', repR: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'dominante') { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.abs(a - defi.lam) <= defi.tolNm; noterD(ok); }
    else { ok = defi.repN === defi.nature && defi.repR === (defi.repro ? 'oui' : 'non'); noterN(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const maj = f => setDefi(d => ({ ...d, ...f, verifie: false }));
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['dominante', 'Longueur d’onde dominante'], ['nature', 'Nature et écran']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'dominante' ? 'Défi : quelle longueur d’onde dominante ?' : 'Défi : quelle nature, et reproductible sur écran ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>
        {defi.kind === 'dominante'
          ? <>Le point P est une couleur du diagramme ; la droite du blanc W vers P est tracée en partie : prolongez-la jusqu’à la courbe. Donnez la longueur d’onde dominante, à {defi.tolNm} nm près.</>
          : <>Le point P est une couleur du diagramme. Le triangle en pointillés est celui des trois primaires d’un écran. Dites si P est une lumière de longueur d’onde dominante ou un pourpre, et si l’écran peut l’afficher.</>}
      </div>
      <SvgChroma triangle={defi.kind === 'nature'} ticks={defi.kind === 'dominante'} blanc
        lignes={defi.kind === 'dominante' ? [{ a: M.W, b: court(M.W, C.pointLieu(defi.lam)), col: '#0f172a', w: 2.2 }] : []}
        pts={[{ ...defi.pt, nom: 'P', col: '#0f172a', dx: 11, dy: 18 }]}/>
      {defi.kind === 'dominante' && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><label htmlFor="xy-r">Longueur d’onde dominante (nm) = </label>
        <input id="xy-r" value={defi.rep} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('xy-verif')?.click()} onChange={ev => maj({ rep: ev.target.value })} style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/></div>}
      {defi.kind === 'nature' && <>
        {selecteur('xy-n', 'Nature de la couleur P', defi.repN, ev => maj({ repN: ev.target.value }), [{ id: 'spectrale', nom: 'Lumière de longueur d’onde dominante' }, { id: 'pourpre', nom: 'Pourpre (longueur d’onde complémentaire)' }], 'Choisir…')}
        {selecteur('xy-e', 'L’écran peut-il afficher P ?', defi.repR, ev => maj({ repR: ev.target.value }), [{ id: 'oui', nom: 'Oui, P est dans le triangle' }, { id: 'non', nom: 'Non, P est hors du triangle' }], 'Choisir…')}
      </>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'dominante'
        ? <>Suivez la droite du blanc W au-delà de P jusqu’à la courbe, puis lisez la graduation (un trait tous les 10 nm, un nombre tous les 20 nm).</>
        : <>Prolongez la droite W → P au-delà de P : atteint-elle la courbe ou la droite des pourpres ? Puis regardez si P est dans le triangle en pointillés.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="xy-verif" onClick={verifier} disabled={defi.kind === 'dominante' ? !defi.rep : !(defi.repN && defi.repR)} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'dominante' && <>La longueur d’onde dominante est {n0(defi.lam)} nm (à {defi.tolNm} nm près).</>}
        {defi.kind === 'nature' && <>P est {defi.nature === 'pourpre' ? 'un pourpre' : 'une lumière de longueur d’onde dominante'}, et {defi.repro ? 'l’écran peut l’afficher' : 'l’écran ne peut pas l’afficher'}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration : on place un point sur le diagramme ----------
  const wEx = M.blancIll(ex.ill), lx = M.lecture(ex.x, ex.y, wEx);
  const pPercu = M.adapter(ex, wEx, M.W);   // couleur correspondante : œil adapté à l'illuminant choisi, vue sur un écran dont le blanc est D65
  const placerPoint = (x, y) => {   // hors du diagramme : on ramène le point vers le blanc, jusqu'à la frontière
    let t = 1; if (!C.dansDiagramme(x, y)) { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (C.dansDiagramme(wEx.x + m * (x - wEx.x), wEx.y + m * (y - wEx.y))) lo = m; else hi = m; } t = lo * 0.995; }
    setEx(e => ({ ...e, x: wEx.x + t * (x - wEx.x), y: wEx.y + t * (y - wEx.y) }));
  };
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Placez un point</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Touchez ou glissez sur le diagramme (ou utilisez les flèches du clavier) : le point <strong>P</strong> se place où vous voulez et le tableau « Lecture du point » se met à jour. La droite part du blanc W, passe par P et rejoint la courbe en D.</div>
      {selecteur('xy-ill', 'Blanc de référence (illuminant)', ex.ill, ev => setEx(x => ({ ...x, ill: ev.target.value })), M.ILLUMS)}
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Le blanc W devient celui de l’illuminant choisi : le point P ne bouge pas, mais sa dominante, sa complémentaire et sa pureté sont relues par rapport à ce blanc. Le fond du diagramme reste celui de D65 ; au-dessus du diagramme, une seconde pastille montre la couleur de P perçue par un œil adapté à l’illuminant choisi.</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14, color: KIT.txt, minHeight: 42 }}><input type="checkbox" checked={ex.triangle} onChange={ev => setEx(x => ({ ...x, triangle: ev.target.checked }))} style={{ width: 20, height: 20 }}/>Afficher le triangle d’un écran (primaires sRGB)</label>
      <button onClick={() => setEx(x => ({ ...x, x: wEx.x + 0.002, y: wEx.y + 0.002 }))} style={styleBouton(false)}>Revenir au blanc</button>
    </div>);
  const planEx = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Diagramme de chromaticité</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Pastille css={css(ex)} nom={ex.ill === 'D65' ? 'couleur du point P (approchée)' : 'P vu sous D65'} hauteur={26}/>{ex.ill !== 'D65' && <Pastille css={css(pPercu)} nom={`P perçu, œil adapté à ${ex.ill}`} hauteur={26}/>}</div>
      <SvgChroma triangle={ex.triangle} w={wEx} nomBlanc={ex.ill === 'D65' ? 'W' : `W (${ex.ill})`} onPoint={placerPoint} onTouche={(dx, dy) => placerPoint(ex.x + dx, ex.y + dy)} label="Diagramme de chromaticité xy : touchez pour placer le point P"
        lignes={[...(lx.oppose ? [{ a: wEx, b: lx.oppose, col: '#0f172a', w: 1.8, dash: '6 4' }] : []), ...(lx.frontiere ? [{ a: wEx, b: lx.frontiere, col: '#0f172a', w: 2.2 }] : [])]}
        pts={[...(lx.frontiere && !lx.pourpre ? [{ x: lx.frontiere.x, y: lx.frontiere.y, nom: 'D', col: '#0f172a', creux: true, dx: 10, dy: -8 }] : []), ...(lx.oppose && !lx.oppose.pourpre ? [{ x: lx.oppose.x, y: lx.oppose.y, nom: 'C', col: '#0f172a', creux: true, dx: -10, dy: 14, anchor: 'end' }] : []), { x: ex.x, y: ex.y, nom: 'P', col: '#0f172a', dx: 11, dy: 18 }]}/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>P : votre point. Trait plein : de W vers la courbe, en passant par P (D = longueur d’onde dominante). Pointillés : de l’autre côté du blanc (C = longueur d’onde complémentaire). W : le blanc.</div>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Lecture du point</div>
      <LigneMesure nom="x ; y" valeur={`${fr(ex.x, 3)} ; ${fr(ex.y, 3)}`}/>
      <LigneMesure nom="Blanc de référence" valeur={`${ex.ill} : ${fr(wEx.x, 3)} ; ${fr(wEx.y, 3)}`}/>
      {ex.ill !== 'D65' && <LigneMesure nom={`x ; y perçus (œil adapté à ${ex.ill})`} valeur={`${fr(pPercu.x, 3)} ; ${fr(pPercu.y, 3)}`}/>}
      <LigneMesure nom="Longueur d’onde dominante" valeur={lx.blanc ? 'aucune (blanc)' : lx.pourpre ? 'aucune (pourpre)' : `${n0(lx.dominante)} nm`}/>
      <LigneMesure nom="Longueur d’onde complémentaire" valeur={lx.complementaire != null ? `${n0(lx.complementaire)} nm` : 'aucune'}/>
      <LigneMesure nom="Pureté d’excitation" valeur={fr(lx.purete, 2)}/>
      <LigneMesure nom="Affichable sur un écran sRGB" valeur={lx.dansEcran ? 'oui' : 'non'} couleur={lx.dansEcran ? COL.vert : COL.rouge}/>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Placez P près de la courbe, dans le vert, puis dans le rouge : que deviennent la dominante et la pureté ?</li>
      <li>Rapprochez P du blanc W : que devient la pureté ? Que devient la couleur de la pastille ?</li>
      <li>Placez P dans la zone des pourpres (près de la droite du bas) : que lit-on à la place de la dominante ?</li>
      <li>Cherchez des points que l’écran ne peut pas afficher. Dans quelle zone du diagramme se trouvent-ils ?</li>
      <li>Placez P dans l’orange, puis changez d’illuminant (D65, A, F2) : que deviennent la dominante et la pureté ? Pourquoi P devient-il parfois un pourpre ?</li>
      <li>Placez P sur la droite qui joint W à un point de la courbe, de part et d’autre de W : que remarquez-vous sur les deux longueurs d’onde lues ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>(x ; y) : teinte et saturation ; Y : clarté</li>
        <li>Lumières monochromatiques : sur la courbe ; pourpres : sur la droite qui la ferme</li>
        <li>Dominante : droite W → P prolongée jusqu’à la courbe ; pureté = WP / WD</li>
        <li>Complémentaires : alignées avec le blanc W</li>
        <li>Dominante et pureté dépendent du blanc de référence (illuminant)</li>
        <li>Écran : seulement l’intérieur du triangle des primaires</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Diagramme</strong> : CIE 1931, observateur standard 2° ; x = X / (X + Y + Z), y = Y / (X + Y + Z). La courbe est calculée à partir des fonctions colorimétriques de la CIE (pas de 5 nm, lecture interpolée entre points).</li>
      <li><strong>Point blanc</strong> : W = (0,313 ; 0,329), celui de l’illuminant D65 (lumière du jour). La longueur d’onde dominante et la pureté dépendent du blanc de référence choisi : l’exploration propose aussi A (lampe à incandescence : 0,448 ; 0,408) et F2 (tube fluorescent : 0,388 ; 0,393), calculés avec les tables de la CIE. Le point P garde ses coordonnées (x ; y) quand on change d’illuminant : la lecture (dominante, pureté) change. La pastille « perçue » applique l’adaptation chromatique de Bradford (modèle approché de l’adaptation de l’œil au blanc de l’illuminant, la luminance n’est pas représentée) ; la lecture sur le diagramme n’en dépend pas.</li>
      <li><strong>Lumières ajoutées</strong> : synthèse additive. Une lumière monochromatique ajoutée à du blanc, ou du violet à du rouge (droite des pourpres), a son point sur le segment qui joint les deux points, pondéré par la part de chaque lumière exprimée en X + Y + Z (pas en puissance).</li>
      <li><strong>Couleurs du fond</strong> : indicatives. Un écran ne sait pas afficher toutes les couleurs du diagramme ; en dehors de son triangle, la couleur dessinée est approchée (moins saturée). Seules les coordonnées font foi.</li>
      <li><strong>Écran</strong> : primaires de la norme sRGB (R : 0,64 ; 0,33, V : 0,30 ; 0,60, B : 0,15 ; 0,06). Les écrans réels, plus récents, ont parfois un triangle plus grand.</li>
      <li><strong>Hors modèle</strong> : la luminance Y (non représentée), les objets éclairés (voir la simulation sur l’illuminant et le métamérisme), les écarts de couleur (voir la simulation CIELAB) et l’adaptation de l’œil.</li>
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
        .xy-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .xy-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .xy-col { display: flex; flex-direction: column; gap: 12px; }
        .xy-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .xy-l1.cote .xy-carte { order: 2; } .xy-l1.cote .xy-main { order: 1; }
          .xy-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .xy-ex > * { grid-column: 1; }
          .xy-ex > .xy-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .xy-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .xy-in { animation: xy-fondu 0.35s ease-out; } @keyframes xy-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .xy-l1 *, .xy-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Le diagramme de chromaticité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le <strong>diagramme de chromaticité</strong> place toutes les couleurs visibles dans un plan (x ; y). On apprend à y <strong>lire</strong> la longueur d’onde dominante et la pureté d’une couleur, à voir l’effet du <strong>blanc de référence</strong> et ce qu’un <strong>écran</strong> peut afficher.</div>
      {enGuide && <div className="xy-l1 cote">
        <div className="xy-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="xy-main">
          <div className="xy-col">
            {sceneBloc && <div className="xy-in">{sceneBloc}</div>}
            {curseurGuide && <div className="xy-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="xy-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'dominante' ? suiviD : suiviN}/></div>}
      {enExplore && <>
        <div className="xy-ex">
          {planEx}
          <div className="xy-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
