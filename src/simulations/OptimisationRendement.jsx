import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./optModele";
import { QCM_PARCOURS as Q } from "./optQcm";
import { GrapheEssais, SvgCarteRendement, SvgCarteMemePalier, SvgCarteQrK, SvgCarteExces, SvgCarteBilan } from "./optSchemas";
import { COL } from "./optOutils";
import { MontageBloc, MontageGuide } from "./optMontage";
import { useGouttes, PALIERS_CHAUFFE, MSG_RETOUR } from "./optMontageModele";

const SIM_ID = 189, CLE_GUIDE = 'optimisation-rendement-tg-guide-v2';
declarerDefis(SIM_ID, [['rendement', 'Atteindre le rendement visé'], ['protocole', 'Analyser un protocole']]);

// ====================================================
//  SIM 189 — OPTIMISER UNE ÉTAPE DE SYNTHÈSE : VITESSE ET RENDEMENT (TG spé PC, « Élaborer des stratégies en synthèse organique »).
//  Support : estérification acide éthanoïque + éthanol ⇌ éthanoate d'éthyle + eau, K = 4 (valeur de la simulation).
//  Capacités visées (jamais affichées à l'élève) : identifier, dans un protocole, les opérations réalisées pour optimiser la vitesse de formation d'un produit ;
//  justifier l'augmentation du rendement par un excès d'un réactif ou par l'élimination d'un produit (interprétation par Qr < K).
//  Modèle : optModele.js (test : optModele.test.mjs). Pas de coût ni de chimie verte (autres lots), pas de Le Chatelier formel.
// ====================================================

const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const IDS = ['limite', 'rendement', 'protocole', 'palier', 'qr', 'eqr1', 'ajout', 'sens', 'rapports', 'retrait', 'variante', 'bilan'];
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const Nmax = () => <>n<sub>max</sub></>;
const Q_R = 'Qr = frac(n(ester) × n(eau)|n(acide) × n(éthanol))';
const ETH = 'éthanol';
const PROTO_A = [
  'Dans un ballon, introduire 0,50 mol d’acide éthanoïque et 1,00 mol d’éthanol.',
  'Ajouter quelques gouttes d’acide sulfurique concentré.',
  'Ajouter quelques grains de pierre ponce.',
  'Chauffer à reflux pendant 1 h.',
  'Refroidir, puis laver la phase organique avec une solution d’hydrogénocarbonate de sodium, puis avec de l’eau.',
  'Sécher la phase organique sur du sulfate de magnésium anhydre, puis filtrer.',
  'Identifier l’ester obtenu (indice de réfraction ou spectre infrarouge).',
];
const PROTO_B = [
  'Introduire dans un ballon 0,50 mol d’acide éthanoïque, 0,50 mol d’éthanol, du cyclohexane et quelques gouttes d’acide sulfurique concentré.',
  'Adapter au ballon un montage de Dean-Stark surmonté d’un réfrigérant.',
  'Chauffer à reflux : l’eau formée est entraînée par le cyclohexane et recueillie dans le tube gradué.',
  'Arrêter le chauffage quand le volume d’eau recueilli ne varie plus.',
  'Refroidir, laver, sécher, puis distiller.',
];
const REF = M.REF;

// ---------- petits composants d'écran ----------
const Equation = () => (
  <div style={{ marginBottom: 8, textAlign: 'center' }}>
    <div style={{ fontSize: 17, fontWeight: 700, color: KIT.txt, lineHeight: 1.7 }}>
      <span style={{ whiteSpace: 'nowrap' }}>CH₃COOH + CH₃CH₂OH</span>{' '}<span style={{ whiteSpace: 'nowrap' }}>⇌ CH₃COOCH₂CH₃ + H₂O</span></div>
    <div style={{ fontSize: 13.5, color: KIT.txt2 }}>acide éthanoïque + éthanol ⇌ éthanoate d’éthyle (l’ester) + eau</div>
  </div>);
const Protocole = ({ lignes, titre }) => (
  <div>
    <div style={{ fontSize: 14.5, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>
    <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14.5, lineHeight: 1.55, color: KIT.txt }}>{lignes.map((l, i) => <li key={i} style={{ marginBottom: 4 }}>{l}</li>)}</ol>
  </div>);
const tdS = { border: `1px solid ${KIT.bord}`, padding: '5px 6px', textAlign: 'center', fontSize: 14, color: KIT.txt };
const thS = { ...tdS, fontWeight: 700, background: '#f1f5f9' };
const Tab = ({ lignes, premiere = '' }) => (
  <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 440, margin: '0 auto' }}>
    <thead><tr><th style={{ ...thS, textAlign: 'left' }}>{premiere}</th>{['acide', ETH, 'ester', 'eau'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
    <tbody>{lignes.map((l, i) => <tr key={i}><td style={{ ...tdS, textAlign: 'left', fontWeight: 600 }}>{l.nom}</td>{l.v.map((v, k) => <td key={k} style={tdS}>{v}</td>)}</tr>)}</tbody>
  </table>);
const X = <i>x</i>;
const TabRendements = () => (
  <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 440, margin: '0 auto' }}>
    <thead><tr><th style={{ ...thS, textAlign: 'left' }}>Éthanol pour 1,00 mol d’acide</th><th style={thS}>Rendement à l’équilibre</th></tr></thead>
    <tbody>{M.RAPPORTS.map(r => <tr key={r}><td style={{ ...tdS, textAlign: 'left' }}>{nbf(r, 2)}{NB}mol</td><td style={tdS}>{nbf(M.xEq(r) * 100, 1)}{NB}%</td></tr>)}</tbody>
  </table>);
const sceneNote = { fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 4 };

// ====================================================
export function SimulationOptimisationRendement() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviR, noterR] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('rendement');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reg: true, aff: false, mes: false, essayer: false, retenir: false });
  const [goutte, lancerGo] = useGouttes(), [msgRetour, setMsgRetour] = useState(null);
  const [ex, setEx] = useState({ ...REF, horizon: M.DUREE, mode: 'n', comp: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const pE = { r: ex.r, T: ex.T, cat: ex.cat, eau: ex.eau && M.retraitPossible(ex.T) };
  const setE = f => { if (f.T !== undefined && f.T < M.T_REFLUX && ex.eau && ex.T >= M.T_REFLUX) setMsgRetour(MSG_RETOUR); else if (f.eau !== undefined || f.T >= M.T_REFLUX) setMsgRetour(null); if (f.r !== undefined && f.r > ex.r) lancerGo('eth'); if (f.cat === true && !ex.cat) lancerGo('cat'); setEx(s => { const n = { ...s, ...f }; if (!M.retraitPossible(n.T)) n.eau = false; return n; }); };
  const cE = M.simuler(pE, M.DUREE, 60), finE = cE[cE.length - 1], tdE = pE.eau ? null : M.tDemi(pE);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'limite', titre: 'Une transformation lente et limitée',
      texte: <>On mélange 1,00{NB}mol d’acide éthanoïque et 1,00{NB}mol d’éthanol, avec quelques gouttes d’acide sulfurique concentré (catalyseur), et on chauffe à reflux (75{NB}°C). La courbe donne la quantité d’ester formé pendant 3{NB}h. Le trait en pointillés <Nmax/> marque la quantité qu’on obtiendrait si la transformation était totale.</>,
      tache: { type: 'qcm', q: 'Au bout d’une heure environ, la quantité d’ester ne varie presque plus, alors que le ballon contient encore de l’acide et de l’éthanol. Que peut-on en conclure ?', ...Q.limite,
        expl: 'La transformation est limitée : un équilibre s’établit, où l’ester se forme aussi vite qu’il est détruit par la réaction inverse ; réactifs et produits coexistent. Ce n’est pas un manque de catalyseur (il n’est pas consommé : il accélère les deux sens, il ne détruit pas l’ester), et ce n’est pas un problème de lenteur : la courbe est plate, attendre plus longtemps ne changerait plus rien.',
        indice: 'Observez la courbe : est-elle encore en train de monter ? Que dit ce palier sur la composition du ballon ?' } },
    { id: 'rendement', titre: 'Le rendement d’une synthèse',
      texte: <>Un essai de synthèse part de 0,60{NB}mol d’acide éthanoïque et de 0,80{NB}mol d’éthanol. À la fin, on isole 0,45{NB}mol d’ester. Le <strong>rendement</strong> compare la quantité obtenue à la quantité maximale <Nmax/> qu’on aurait si la transformation était totale.</>,
      tache: { type: 'num', carnet: false, q: 'Rendement de cet essai (en %)', unite: '%', vrai: 75, tol: 0.03, affiche: v => nbf(v, 0),
        calcul: () => ['Les coefficients de l’équation sont tous égaux à 1 : 1 mol d’acide réagit avec 1 mol d’éthanol. Le réactif limitant est celui dont la quantité est la plus faible : l’acide (0,60 mol contre 0,80 mol).', 'n_max = 0,60 mol d’ester, donc η = frac(0,45|0,60) × 100 = 75 %.'],
        pieges: [[56.25, 'Vous avez divisé par la quantité d’éthanol : n_max se calcule avec le réactif limitant, celui dont la quantité est la plus faible.'], [32.1, 'Vous avez divisé par la somme des quantités de réactifs : n_max correspond au seul réactif limitant.'], [0.75, 'Un rendement s’exprime en pourcentage : multipliez par 100.']],
        expl: 'Le réactif limitant est l’acide (0,60 mol) : n_max = 0,60 mol, donc η = frac(0,45|0,60) × 100 = 75 %.',
        indice: 'Cherchez d’abord le réactif limitant : la réaction consomme autant d’acide que d’éthanol. Rendement = quantité obtenue divisée par quantité maximale, multipliée par 100.' } },
    { id: 'protocole', titre: 'Lire un protocole : ce qui accélère',
      retenirTitre: 'Rendement d’une synthèse', retenir: <>
        <SvgCarteRendement/>
        <Formule><mi>η</mi><mo>=</mo><mfrac><msub><mi>n</mi><mtext>obtenue</mtext></msub><msub><mi>n</mi><mtext>max</mtext></msub></mfrac></Formule>
        <ul style={UL}>
          <li><strong><Nmax/> est fixée par le réactif limitant</strong> : celui dont la quantité est la plus faible (coefficients égaux à 1).</li>
          <li>Transformation <strong>limitée</strong> : le palier reste sous <Nmax/>, des réactifs subsistent à l’équilibre.</li>
          <li>Moyen de s’en souvenir : <strong>« obtenu sur maximal »</strong>. Idée fausse : « le rendement est limité parce que la réaction s’arrête faute de réactif ». Vrai : elle s’arrête à l’équilibre.</li>
        </ul></>,
      texte: <>Voici un protocole (simplifié) de synthèse de l’éthanoate d’éthyle. Certaines opérations servent à former l’ester <strong>plus vite</strong> ; d’autres agissent sur la quantité obtenue, ou traitent le produit après la transformation.</>,
      tache: { type: 'qcm', q: 'Quelles opérations accélèrent la formation de l’ester ?', ...Q.protocole,
        expl: 'L’acide sulfurique concentré est le catalyseur (ligne 2) et le chauffage à reflux élève la température sans perdre de matière (ligne 4) : ces deux opérations accélèrent la formation de l’ester. La ligne 1 fixe les quantités de réactifs (leur effet sur le rendement vient plus loin) ; la pierre ponce (ligne 3) régularise l’ébullition ; les lignes 5 à 7 traitent le mélange après la transformation : séparation, purification et identification.',
        indice: 'Rappelez-vous les facteurs cinétiques : la température, la concentration des réactifs, le catalyseur. Quelles lignes font intervenir la température ou un catalyseur ?' } },
    { id: 'palier', titre: 'Chauffer : plus vite, mais pas plus loin',
      texte: <>Deux essais identiques (1,00{NB}mol d’acide, 1,00{NB}mol d’éthanol, catalyseur) ne diffèrent que par la température : 75{NB}°C (trait plein) et 45{NB}°C (tirets). Les deux courbes sont suivies pendant 15{NB}h.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire des paliers vers lesquels tendent les deux courbes ?', ...Q.palier,
        expl: 'Les deux courbes tendent vers le même palier : la température modifie la vitesse à laquelle l’équilibre est atteint, pas la composition de l’état final : pour cette estérification, K varie très peu avec la température (réaction quasi athermique) ; pour d’autres réactions, changer la température change K. L’essai à 45 °C est plus lent mais rejoint le même palier ; « plus rapide » ne veut pas dire « plus haut ».',
        indice: 'Comparez la hauteur vers laquelle chaque courbe semble se diriger, pas la durée qu’elle met pour y arriver.' } },
    { id: 'qr', titre: 'Le quotient de réaction Qr',
      retenirTitre: 'Plus vite, mais le même palier', retenir: <>
        <SvgCarteMemePalier/>
        <ul style={UL}>
          <li>Température plus élevée, catalyseur, concentrations plus fortes : <strong>le temps de demi-réaction diminue</strong>, le palier ne bouge pas.</li>
          <li>Exemple de la simulation : à 45 °C comme à 75 °C, la courbe rejoint le même palier ; seule la durée change. Cela vaut pour cette estérification : K y varie très peu avec la température (réaction quasi athermique) ; pour d’autres réactions, changer la température change K.</li>
          <li>Moyen de s’en souvenir : <strong>« accélérer, c’est arriver plus tôt, pas plus haut »</strong>. Idée fausse : « un catalyseur augmente le rendement ». Vrai : il fait gagner du temps.</li>
        </ul></>,
      texte: <>Pour savoir si un mélange peut encore évoluer, on compare son quotient de réaction Qr à la constante d’équilibre K. Les coefficients de l’équation étant tous égaux à 1, le volume se simplifie :{' '}{avecIndices(Q_R)} Pour cette estérification, la simulation prend K = 4 (ordre de grandeur réel). Un mélange en cours de transformation contient 0,40{NB}mol d’acide, 0,40{NB}mol d’éthanol, 0,60{NB}mol d’ester et 0,60{NB}mol d’eau.</>,
      tache: { type: 'num', carnet: false, q: 'Quotient de réaction Qr de ce mélange', unite: '', vrai: 2.25, tol: 0.04, affiche: v => nbf(v, 2),
        calcul: () => ['Produits (ester et eau) au numérateur, réactifs (acide et éthanol) au dénominateur :', 'Qr = frac(0,60 × 0,60|0,40 × 0,40) = frac(0,36|0,16) = 2,25.'],
        pieges: [[0.444, 'Le rapport est inversé : les produits sont au numérateur, les réactifs au dénominateur.'], [1.5, 'Vous avez additionné les quantités : Qr multiplie les quantités des produits d’une part, des réactifs d’autre part.'], [0.5625, 'Vous avez calculé le rapport de Qr à K : Qr est le quotient lui-même.']],
        expl: 'Qr = frac(0,60 × 0,60|0,40 × 0,40) = frac(0,36|0,16) = 2,25.',
        indice: 'Multipliez les quantités de matière des produits (ester et eau), puis celles des réactifs (acide et éthanol), et faites le quotient.' } },
    { id: 'eqr1', titre: 'L’état d’équilibre pour 1 mol et 1 mol',
      retenirTitre: 'Qr compare à K', retenir: <>
        <SvgCarteQrK/>
        <ul style={UL}>
          <li><strong>Qr &lt; K</strong> : le système évolue dans le sens direct (plus de produits) ; <strong>Qr &gt; K</strong> : sens inverse ; <strong>Qr = K</strong> : équilibre.</li>
          <li>Exemple de la simulation : K = 4 ; au départ (ni ester ni eau) Qr = 0, bien au-dessous de K.</li>
          <li>Moyen de s’en souvenir : <strong>« Qr va vers K »</strong>. Idée fausse : « à l’équilibre, plus rien ne se passe ». Vrai : les deux sens se compensent.</li>
        </ul></>,
      texte: <>À l’équilibre, Qr = K = 4. On part de 1,00{NB}mol d’acide et de 1,00{NB}mol d’éthanol, sans ester ni eau. Appelons <i>x</i> (en mol) l’avancement à l’équilibre : n(acide) = n(éthanol) = 1,00 − <i>x</i> et n(ester) = n(eau) = <i>x</i>.</>,
      tache: { type: 'num', carnet: false, q: 'Rendement η à l’équilibre (en %)', unite: '%', vrai: M.xEq(1) * 100, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['À l’équilibre : frac(x²|(1,00 − x)²) = 4. En prenant la racine carrée des deux membres : frac(x|1,00 − x) = 2.', 'x = 2 × (1,00 − x), donc 3x = 2,00 et x = 0,667 mol.', 'Le réactif limitant est l’acide (1,00 mol) : η = frac(0,667|1,00) × 100 = 66,7 %.'],
        pieges: [[50, 'Qr = K impose un rapport de x sur (1,00 − x) égal à 2, et non à 1 : ce n’est pas la moitié de l’acide qui réagit.'], [80, 'Vous avez écrit que x sur (1,00 − x) vaut 4 : il faut d’abord prendre la racine carrée de K = 4, soit 2.'], [33.3, 'Vous avez calculé la quantité d’acide restante, 1,00 − x : le rendement porte sur l’ester formé.']],
        expl: 'x = 0,667 mol ; η = frac(0,667|1,00) × 100 = 66,7 %.',
        indice: 'Qr = frac(x × x|(1,00 − x) × (1,00 − x)) = 4 : prenez la racine carrée des deux membres pour obtenir une équation du premier degré en x.' } },
    { id: 'ajout', titre: 'Ajouter de l’éthanol à l’équilibre',
      texte: <>Le système précédent est à l’équilibre : n(acide) = n(éthanol) = 0,333{NB}mol et n(ester) = n(eau) = 0,667{NB}mol (Qr = K = 4). On ajoute 1,00{NB}mol d’éthanol, sans rien retirer. Juste après l’ajout, avant toute évolution, K n’a pas changé mais la composition, donc Qr, oui.</>,
      tache: { type: 'num', carnet: false, q: 'Quotient de réaction Qr juste après l’ajout', unite: '', vrai: 1.0, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['n(éthanol) = 0,333 + 1,00 = 1,333 mol ; les autres quantités sont inchangées.', 'Qr = frac(0,667 × 0,667|0,333 × 1,333) = frac(0,445|0,444) ≈ 1,0.'],
        pieges: [[4, 'Vous avez gardé les quantités d’avant l’ajout : Qr = K à l’équilibre. L’ajout a changé n(éthanol), donc Qr.'], [1.34, 'Vous avez pris 1,00 mol pour n(éthanol) : il y a 0,333 mol déjà présente en plus des 1,00 mol ajoutées.']],
        expl: 'n(éthanol) = 1,333 mol ; Qr = frac(0,667 × 0,667|0,333 × 1,333) ≈ 1,0.',
        indice: 'Seule la quantité d’éthanol change : 0,333 + 1,00 mol. Recalculez le quotient avec les quatre quantités.' } },
    { id: 'sens', titre: 'Quel effet sur le rendement ?',
      texte: <>Juste après l’ajout, Qr ≈ 1,0 alors que K = 4. Le mélange contient 0,333{NB}mol d’acide, 1,333{NB}mol d’éthanol, 0,667{NB}mol d’ester et 0,667{NB}mol d’eau.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il ensuite ?', ...Q.sens,
        expl: 'Qr (≈ 1,0) est inférieur à K (4) : le système évolue spontanément dans le sens direct, vers la formation d’ester et d’eau, jusqu’à ce que Qr rejoigne de nouveau K. Il se forme donc plus d’ester qu’avant l’ajout : le rendement par rapport à l’acide augmente. Le sens inverse éloignerait Qr de K ; Qr ≠ K signifie que le système n’est plus à l’équilibre ; et retrouver Qr = K exige de changer les quantités d’ester et d’eau, pas seulement celle d’éthanol.',
        indice: 'Comparez Qr à K : dans quel sens faut-il faire évoluer le mélange pour que Qr augmente et rejoigne K ?' } },
    { id: 'rapports', titre: 'Comparer les excès',
      texte: <>Avec le même K, la simulation donne le rendement à l’équilibre pour 1,00{NB}mol d’acide et différentes quantités d’éthanol (tableau).</>,
      tache: { type: 'qcm', q: 'Un cahier des charges impose un rendement d’au moins 88 %. Quel est le plus petit excès d’éthanol qui convient ?', ...Q.rapports,
        expl: 'Le rendement vaut 66,7 % pour 1 : 1 et 84,5 % pour 1 : 2 : insuffisants. Il atteint 90,3 % pour 1 : 3, le plus petit excès qui convient. Le rapport 1 : 5 donne 94,5 %, mais le gain est faible et il faudra séparer ensuite beaucoup d’éthanol : on retient le plus petit excès suffisant.',
        indice: 'Lisez le tableau ligne par ligne, du plus petit excès au plus grand, et arrêtez-vous à la première valeur supérieure à 88 %.' } },
    { id: 'retrait', titre: 'Éliminer un produit',
      retenirTitre: 'Un excès déplace Qr sous K', retenir: <>
        <SvgCarteExces/>
        <ul style={UL}>
          <li>Ajouter un réactif <strong>fait chuter Qr sous K</strong> : le système évolue dans le sens direct et forme plus de produit.</li>
          <li>Plus l’excès est grand, plus le rendement monte, mais <strong>de moins en moins</strong> : 1 : 3 donne déjà 90 %.</li>
          <li>Moyen de s’en souvenir : <strong>« réactif en plus, Qr en dessous »</strong>. Idée fausse : « l’excès accélère seulement la réaction ». Vrai : il déplace l’état d’équilibre.</li>
        </ul></>,
      texte: <>Autre moyen d’agir sur le rendement : retirer un produit du milieu, ici l’eau, piégée par un montage de Dean-Stark avec un solvant entraîneur (montage simplifié : on suppose l’eau retirée au fur et à mesure). Partons de l’équilibre pour 1,00{NB}mol d’acide et 1,00{NB}mol d’éthanol : n(acide) = n(éthanol) = 0,333{NB}mol et n(ester) = n(eau) = 0,667{NB}mol. On retire 0,333{NB}mol d’eau.</>,
      tache: { type: 'num', carnet: false, q: 'Quotient de réaction Qr juste après le retrait de l’eau', unite: '', vrai: 2.0, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['n(eau) = 0,667 − 0,333 = 0,334 mol ; les autres quantités sont inchangées.', 'Qr = frac(0,667 × 0,334|0,333 × 0,333) = frac(0,223|0,111) ≈ 2,0.'],
        pieges: [[4, 'Vous avez gardé les quantités d’avant le retrait : Qr = K à l’équilibre. Le retrait a changé n(eau), donc Qr.'], [0.5, 'Le rapport est inversé : produits au numérateur, réactifs au dénominateur.']],
        expl: 'n(eau) = 0,334 mol ; Qr = frac(0,667 × 0,334|0,333 × 0,333) ≈ 2,0, inférieur à K = 4.',
        indice: 'Seule la quantité d’eau change : 0,667 − 0,333 mol. Recalculez le quotient avec les quatre quantités.' } },
    { id: 'variante', titre: 'Analyser une variante du protocole',
      texte: <>Voici un autre protocole de synthèse de l’éthanoate d’éthyle, avec 0,50{NB}mol d’acide et 0,50{NB}mol d’éthanol. L’une de ses opérations permet de dépasser le rendement de 67 % obtenu avec un mélange équimolaire.</>,
      tache: { type: 'qcm', q: 'Quelle opération agit sur le rendement, sans changer la valeur de K ?', ...Q.variante,
        expl: 'Piéger l’eau au fur et à mesure (ligne 3) maintient Qr au-dessous de K : la transformation se poursuit et l’ester se forme en plus grande quantité. L’acide sulfurique et le chauffage à reflux accélèrent seulement l’obtention de l’équilibre ; avec des quantités égales d’acide et d’éthanol, il n’y a aucun excès qui augmenterait le rendement.',
        indice: 'Quelle opération retire un produit du milieu ? Distinguez ce qui accélère (température, catalyseur) de ce qui augmente le rendement.' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Vitesse ou rendement ?', retenir: <>
        <SvgCarteBilan/>
        <ul style={UL}>
          <li><strong>Plus vite</strong> : température, catalyseur, concentration. <strong>Plus loin</strong> : excès d’un réactif, élimination d’un produit (Qr &lt; K).</li>
          <li>Le catalyseur <strong>n’augmente pas le rendement</strong> : il ne change ni K ni l’état d’équilibre.</li>
          <li>Moyen de s’en souvenir : <strong>« accélérer ≠ augmenter η »</strong>. Idée fausse : « chauffer plus fort donne plus d’ester à l’équilibre ». Vrai : on arrive plus vite au même palier (pour cette estérification, K varie très peu avec la température ; pour d’autres réactions, changer la température change K).</li>
        </ul></>,
      texte: <>Vous savez repérer, dans un protocole, les opérations qui accélèrent la formation d’un produit (température, catalyseur, concentration) et celles qui augmentent le rendement (excès d’un réactif, élimination d’un produit) : on justifie les secondes par Qr &lt; K. Passez à l’exploration pour combiner ces leviers, ou relevez les deux défis.</>, tache: null },
  ];

  // ---------- scènes du parcours ----------
  const COURBE_REF = { p: REF, nom: '', c: COL.bleu };
  const sceneGuide = () => {
    switch (idEtape) {
      case 'limite': return <><Equation/><GrapheEssais courbes={[COURBE_REF]} horizon={M.DUREE} ticksY="aucun" aria="Graphique : la quantité d’ester formé monte pendant la première heure puis reste sur un palier, sous le trait en pointillés n_max."/></>;
      case 'rendement': return <><Equation/><Tab premiere="Essai" lignes={[{ nom: 'au départ', v: ['0,60 mol', '0,80 mol', '0', '0'] }, { nom: 'à la fin', v: ['', '', '0,45 mol', ''] }]}/><div style={sceneNote}>Les quantités sans valeur ne sont pas données.</div></>;
      case 'protocole': return <><Equation/><MontageGuide init={{ T: 75, nA: 0.5, nB: 1, cat: false, ds: false }} commandes={['acide']} goutteInit="cat" reserve={0.2}/><div style={{ height: 10 }}/><Protocole titre="Synthèse de l’éthanoate d’éthyle" lignes={PROTO_A}/></>;
      case 'palier': return <><Equation/><GrapheEssais courbes={[{ p: { ...REF, T: 75 }, nom: '75 °C', c: COL.bleu, etiq: { t: 540, dx: 0, dy: -10, a: 'start' } }, { p: { ...REF, T: 45 }, nom: '45 °C', c: COL.vert, dash: '10 6', etiq: { t: 300, dx: 8, dy: 28, a: 'start' } }]} horizon={900} ticksY="std" nmax={false}/></>;
      case 'qr': return <><Equation/><Tab premiere="Mélange" lignes={[{ nom: 'en cours', v: ['0,40 mol', '0,40 mol', '0,60 mol', '0,60 mol'] }]}/></>;
      case 'eqr1': return <><Equation/><Tab premiere="Mélange" lignes={[{ nom: 'au départ', v: ['1,00', '1,00', '0', '0'] }, { nom: 'à l’équilibre', v: [<>1,00 − {X}</>, <>1,00 − {X}</>, X, X] }]}/><div style={sceneNote}>Quantités en mol.</div></>;
      case 'ajout': return <><Equation/><Tab premiere="Mélange" lignes={[{ nom: 'à l’équilibre', v: ['0,333', '0,333', '0,667', '0,667'] }, { nom: 'on ajoute', v: ['', '1,00', '', ''] }]}/><div style={sceneNote}>Quantités en mol ; K = 4.</div><div style={{ height: 10 }}/><MontageGuide init={{ T: 75, nA: 1, nB: 1, cat: true, ds: false }} commandes={['ajout']}/></>;
      case 'sens': return <><Equation/><Tab premiere="Mélange" lignes={[{ nom: 'juste après l’ajout', v: ['0,333', '1,333', '0,667', '0,667'] }]}/><div style={sceneNote}>Quantités en mol ; K = 4.</div></>;
      case 'rapports': return <><Equation/><TabRendements/><div style={sceneNote}>Valeurs calculées avec K = 4, sans élimination de produit.</div><div style={{ height: 10 }}/><MontageGuide init={{ T: 75, nA: 1, nB: 1, cat: true, ds: false }} commandes={['rapports']}/></>;
      case 'retrait': return <><Equation/><MontageGuide init={{ T: 75, nA: 1, nB: 1, cat: true, ds: true }} commandes={['bascule']} eauMl={0.333 * 18.015}/></>;
      case 'variante': return <><Equation/><Protocole titre="Variante du protocole" lignes={PROTO_B}/><div style={{ height: 10 }}/><MontageGuide init={{ T: 75, nA: 0.5, nB: 0.5, cat: true, ds: true }} commandes={['bascule']}/></>;
      default: return null;
    }
  };

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'rendement') setDefi({ type, ...M.tirageDefiRendement(), choix: { r: 1, eau: false }, essais: 0, dernier: null, ok: false });
    else setDefi({ type, ...M.tirageDefiProtocole() });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }

  const lancer = () => {
    const p = { r: defi.choix.r, T: M.T_REFLUX, cat: true, eau: defi.choix.eau }, eta = M.rendementAffiche(p), ok = eta >= defi.cible;
    setDefi(d => ({ ...d, essais: d.essais + 1, dernier: { p, eta, ok }, ok: d.ok || ok })); noterR(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };

  const voletRendement = defi && defi.type === 'rendement' && (() => {
    const sol = M.solutionRendement(defi.rmax, defi.cible), revele = defi.ok || defi.essais >= 3;
    return (<>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : atteindre le rendement visé</div>
      <div style={{ ...lbl, marginBottom: 8 }}>{indicesProfond(<>On synthétise l’ester à partir de 1,00{NB}mol d’acide éthanoïque, avec catalyseur, à reflux (75{NB}°C), pendant 3{NB}h. Sans autre précaution (1,00{NB}mol d’éthanol, eau non retirée), le rendement est insuffisant. La réserve d’éthanol permet au plus <strong>{nbf(defi.rmax, 2)}{NB}mol</strong> d’éthanol pour 1,00{NB}mol d’acide. Choisissez les conditions pour obtenir un rendement d’<strong>au moins {defi.cible}{NB}%</strong>, puis lancez l’essai.</>)}</div>
      <label style={lbSel}>Quantité d’éthanol pour 1,00 mol d’acide
        <select value={defi.choix.r} onChange={e => setDefi(d => ({ ...d, choix: { ...d.choix, r: +e.target.value } }))} style={{ ...menu, marginTop: 2 }}>{M.RAPPORTS.map(r => <option key={r} value={r} disabled={r > defi.rmax}>{nbf(r, 2)} mol{r > defi.rmax ? ' (réserve insuffisante)' : ''}</option>)}</select></label>
      <label style={lbSel}>Eau formée
        <select value={defi.choix.eau ? 'oui' : 'non'} onChange={e => setDefi(d => ({ ...d, choix: { ...d.choix, eau: e.target.value === 'oui' } }))} style={{ ...menu, marginTop: 2 }}><option value="non">laissée dans le ballon</option><option value="oui">retirée au fur et à mesure (Dean-Stark)</option></select></label>
      <IndiceDefi cache={defi.ok}>{indicesProfond(<>Un excès de réactif ou le retrait d’un produit rend Qr inférieur à K : la transformation avance et le rendement monte. Testez les réglages un à un, puis combinez-les si un seul ne suffit pas. Le rendement n’est pas augmenté par la vitesse : les 3 h suffisent ici pour atteindre l’équilibre.</>)}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={lancer} style={styleBouton(true, '#15803d')}><Pic n="target"/>Lancer l’essai</button>
        <button onClick={() => nouveauDefi('rendement')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.dernier && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.dernier.ok ? '#15803d' : '#b91c1c' }}>
        {defi.dernier.ok ? `✓ Réussi : rendement de ${nbf(defi.dernier.eta, 1)} % après 3 h (visé : au moins ${defi.cible} %).` : `✗ Insuffisant : rendement de ${nbf(defi.dernier.eta, 1)} % après 3 h (visé : au moins ${defi.cible} %). Modifiez les conditions et relancez.`}</div>}
      {revele && sol && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 8px', lineHeight: 1.5 }}>
        {defi.ok ? 'Une solution possible : ' : 'Après trois essais, voici une solution possible : '}{nbf(sol.r, 2)}{NB}mol d’éthanol{sol.eau ? ', eau retirée' : ', eau non retirée'} ({nbf(M.rendementFin({ r: sol.r, T: 75, cat: true, eau: sol.eau }) * 100, 1)}{NB}% après 3{NB}h). {sol.eau ? 'Retirer l’eau maintient Qr sous K : la transformation se poursuit.' : 'L’excès d’éthanol fait passer Qr sous K : le système évolue vers plus d’ester.'}</div>}
    </>);
  })();

  const voletProtocole = defi && defi.type === 'protocole' && (() => {
    const bonsSens = { v: 0, r: 1, n: 2 };
    const optsOp = ['elle accélère la formation de l’ester sans changer la quantité obtenue à l’équilibre', 'elle augmente la quantité d’ester obtenue à l’équilibre', 'elle traite ou contrôle le produit, sans agir sur la vitesse ni sur le rendement', 'elle accélère la formation de l’ester et augmente aussi la quantité obtenue à l’équilibre'];
    const exos = [
      { id: 'q1', type: 'num', unite: 'mol', vrai: 2 * defi.n0 / 3, tol: 0.05, affiche: v => nbf(v, 2),
        q: <>Un mélange contient {nbf(defi.n0, 2)}{NB}mol d’acide éthanoïque et {nbf(defi.n0, 2)}{NB}mol d’éthanol, sans ester ni eau (K = 4). Quelle quantité d’ester contient-il à l’équilibre (2 chiffres significatifs) ?</>,
        indice: <>Avec des quantités égales : n(acide) = n(éthanol) = {nbf(defi.n0, 2)} − <i>x</i> et n(ester) = n(eau) = <i>x</i>. Qr = K donne, en prenant la racine carrée, {avecIndices('frac(x|' + nbf(defi.n0, 2) + ' − x) = 2')}.</>,
        pieges: [[defi.n0 / 2, 'Vous avez supposé que la moitié de l’acide réagit : Qr = K impose un rapport de x sur (n − x) égal à 2.'], [0.8 * defi.n0, 'Vous avez pris la valeur 4 au lieu de sa racine carrée 2 pour le rapport de x sur (n − x).']],
        expl: <>x sur ({nbf(defi.n0, 2)} − x) vaut 2, donc x = {avecIndices('frac(2 × ' + nbf(defi.n0, 2) + '|3)')} = {nbf(2 * defi.n0 / 3, 2)}{NB}mol.</> },
      { id: 'q2', type: 'qcm', bonne: M.rapportMinimal(defi.cible),
        q: <>On veut un rendement à l’équilibre d’au moins {defi.cible}{NB}% pour 1,00{NB}mol d’acide (sans élimination de produit). Quel est le plus petit excès d’éthanol qui convient ? L’exploration donne le rendement limite pour chaque rapport.</>,
        options: [[1, 'rapport 1 : 1 (1 mol d’éthanol)'], [2, 'rapport 1 : 2 (2 mol d’éthanol)'], [3, 'rapport 1 : 3 (3 mol d’éthanol)'], [5, 'rapport 1 : 5 (5 mol d’éthanol)']],
        indice: <>Le rendement limite pour chaque rapport se lit dans l’exploration (sans élimination, avec catalyseur) ou dans le tableau du parcours guidé. Gardez le plus petit rapport dont le rendement dépasse la valeur visée.</>,
        expl: <>Rendements à l’équilibre : {M.RAPPORTS.map(r => `1 : ${r} → ${nbf(M.xEq(r) * 100, 1)} %`).join(' ; ')}. Le plus petit excès au moins égal à {defi.cible} % est le rapport 1 : {M.rapportMinimal(defi.cible)}.</> },
      { id: 'q3', type: 'qcm', bonne: bonsSens[defi.op[1]], q: <>Dans un protocole d’estérification figure l’opération suivante : « {defi.op[0]} ». Quel est son rôle ?</>, options: optsOp.map((t, i) => [i, t]),
        indice: <>Température, catalyseur et concentration agissent sur la vitesse ; un excès de réactif ou l’élimination d’un produit agissent sur le rendement ; les opérations de lavage, de séchage et d’identification se font après la transformation.</>,
        expl: defi.op[1] === 'v' ? <>Cette opération accélère l’obtention de l’équilibre (facteur cinétique) sans changer sa position : le catalyseur et la concentration ne changent pas K, et pour cette estérification K varie très peu avec la température (réaction quasi athermique) ; pour d’autres réactions, changer la température change K.</> : defi.op[1] === 'r' ? <>Retirer l’eau maintient Qr au-dessous de K : la transformation continue, la quantité d’ester obtenue augmente (le rendement).</> : <>Cette opération intervient après la transformation (séparation, purification ou identification) : elle n’agit ni sur la vitesse ni sur le rendement de la réaction.</> },
      { id: 'q4', type: 'num', unite: '', vrai: 4 * (1 - defi.f), tol: 0.05, affiche: v => nbf(v, 1),
        q: <>À l’équilibre (K = 4), un mélange contient {nbf(defi.nA, 3)}{NB}mol d’acide, {nbf(defi.nA, 3)}{NB}mol d’éthanol, {nbf(defi.nE, 3)}{NB}mol d’ester et {nbf(defi.nE, 3)}{NB}mol d’eau. On retire {nbf(defi.f * defi.nE, 3)}{NB}mol d’eau. Calculez Qr juste après le retrait (avec les quantités affichées).</>,
        indice: <>Seule la quantité d’eau change : n(eau) = {nbf(defi.nE, 3)} − {nbf(defi.f * defi.nE, 3)} mol. Recalculez {avecIndices(Q_R)} avec les quatre quantités.</>,
        pieges: [[4, 'Vous avez gardé les quantités d’avant le retrait : Qr = K à l’équilibre.']],
        expl: <>n(eau) = {nbf(defi.nE - defi.f * defi.nE, 3)} mol ; Qr = {avecIndices(`frac(${nbf(defi.nE, 3)} × ${nbf(defi.nE - defi.f * defi.nE, 3)}|${nbf(defi.nA, 3)} × ${nbf(defi.nA, 3)})`)} ≈ {nbf(4 * (1 - defi.f), 1)}, inférieur à K : la transformation se poursuit dans le sens direct.</> },
    ];
    return (<>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : analyser un protocole</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Estérification de l’acide éthanoïque par l’éthanol, avec K = 4. Répondez aux quatre questions ; l’exploration peut vous aider. Chaque question a son indice ; la correction apparaît après une réponse juste ou trois essais.</div>
      {exos.map((q, i) => <QuestionDefi key={defi.graine + q.id} n={i + 1} q={q} onEssai={noterP}/>)}
      <div style={{ marginTop: 8 }}><button onClick={() => nouveauDefi('protocole')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button></div>
    </>);
  })();

  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['rendement', 'Atteindre le rendement visé'], ['protocole', 'Analyser un protocole']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'rendement' ? voletRendement : voletProtocole}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle construit</strong> : les courbes ne sont pas des mesures. Le mélange est homogène, de volume constant ; comme tous les coefficients de l’équation valent 1, Qr = frac(n(ester) × n(eau)|n(acide) × n(éthanol)) ne dépend que des quantités de matière.</li>
      <li><strong>Constante d’équilibre</strong> : K = 4 pour l’estérification (valeur de la simulation, du même ordre que les valeurs tabulées), supposée constante entre 20 et 75 °C (en réalité elle varie légèrement avec la température).</li>
      <li><strong>Vitesse</strong> : la vitesse d’évolution est proportionnelle à la différence entre ce que forme la réaction directe et ce que détruit la réaction inverse ; elle s’annule exactement quand Qr = K. La température (vitesse multipliée par 2 pour 10 °C) et le catalyseur (facteur 50) ne modifient que cette vitesse, jamais K. Ces facteurs sont des ordres de grandeur qualitatifs, pas des données mesurées.</li>
      <li><strong>Élimination de l’eau</strong> : idéalisée (quantité retirée proportionnelle à l’eau présente) et possible seulement à reflux ; avec elle, le rendement tend vers 100 % (transformation quasi totale). En pratique, un montage de Dean-Stark exige un solvant entraîneur et les azéotropes compliquent la séparation.</li>
      <li><strong>Rendement</strong> : quantité d’ester formée divisée par n<sub>max</sub> = 1,00 mol (l’acide est le réactif limitant) ; l’excès concerne l’éthanol. Un essai dure 3 h. Le temps de demi-réaction est la date où l’ester atteint la moitié de sa valeur à l’équilibre ; il n’est pas affiché avec élimination de l’eau, car l’état final visé change.</li>
      <li><strong>Montage (schéma)</strong> : schéma simplifié, non à l’échelle ; seuls les niveaux de liquide sont à l’échelle (volumes calculés avec n × M ÷ ρ : éthanol 46,07 g/mol et 0,789 g/mL, acide éthanoïque 60,05 g/mol et 1,05 g/mL ; volume du mélange supposé constant au cours de la transformation, ballon de 750 mL). Le sommet du réfrigérant est ouvert à l’air : un montage chauffé n’est jamais fermé.</li>
      <li><strong>Température et reflux</strong> : à reflux, la température est limitée par l’ébullition du mélange (vers 75 à 85 °C à la pression atmosphérique) ; les bulles et les gouttes de reflux sont qualitatives (absentes sous 75 °C : à 60 °C le mélange est chaud mais ne bout pas ; elles n’apparaissent qu’à 75 °C, à l’ébullition). Le menu de chauffage et le bouton du chauffe-ballon règlent la même grandeur.</li>
      <li><strong>Solvant entraîneur</strong> : avec l’éthanol seul, l’eau et l’éthanol forment un azéotrope et le piège de Dean-Stark ne sépare rien ; on ajoute un solvant entraîneur non miscible à l’eau (ici le cyclohexane, volume indicatif de 60 mL). Avec lui, l’eau formée est retirée du ballon au fur et à mesure : on admet ici que l’élimination est totale et immédiate (idéalisation du modèle).</li>
      <li><strong>Catalyseur</strong> : les étincelles sont un symbole (nombre constant : le catalyseur n’est pas consommé), pas une réaction ni des molécules.</li>
      <li><strong>Notations</strong> : Qr s’écrit sans indice ; η désigne le rendement ; les valeurs numériques sont arrondies à 3 chiffres significatifs.</li>
      <li><strong>Hors programme, non traité</strong> : coût, impact environnemental, loi de Le Chatelier, loi d’Arrhenius chiffrée, synthèses en plusieurs étapes.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const resume = `${nbf(ex.r, 2)} mol d’éthanol · ${ex.T} °C · ${ex.cat ? 'avec' : 'sans'} catalyseur · eau ${pE.eau ? 'retirée' : 'non retirée'}`;
  const courbesE = [{ p: pE, c: COL.bleu, w: 3 }, ...(ex.comp ? [{ p: REF, c: COL.gris, dash: '9 6', w: 2.6 }] : [])];
  const horizons = [[180, '3 h'], [720, '12 h'], [2880, '48 h']];
  const eauRetiree = pE.eau ? (finE.x - finE.nW) * 18.015 : 0;   // mL d'eau recueillis à la fin de l'essai (ρ = 1,00 g/mL)
  const iT = PALIERS_CHAUFFE.indexOf(ex.T);
  const btnS = { ...stylePetitBouton(false, '#0369a1'), minHeight: 44, minWidth: 48, fontSize: 18 };
  const stepperT = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '4px 0 6px' }}>
      <span style={{ fontSize: 14, color: KIT.txt }}>Température :</span>
      <button type="button" aria-label="Baisser le chauffage" disabled={iT <= 0} onClick={() => setE({ T: PALIERS_CHAUFFE[iT - 1] })} style={btnS}>−</button>
      <strong style={{ fontSize: 16, minWidth: 56, textAlign: 'center', color: KIT.txt }}>{ex.T}{NB}°C</strong>
      <button type="button" aria-label="Augmenter le chauffage" disabled={iT >= PALIERS_CHAUFFE.length - 1} onClick={() => setE({ T: PALIERS_CHAUFFE[iT + 1] })} style={btnS}>+</button></div>);
  const boxMontage = (
    <div style={styleBoite}>
      <Equation/>
      <div style={aide}>Le schéma suit vos réglages (à droite sur ordinateur, dessous sur téléphone) : essayez le bouton à deux positions et la température.</div>
      <MontageBloc etat={{ T: ex.T, nA: 1, nB: ex.r, cat: ex.cat, ds: pE.eau }} goutte={goutte} eauMl={eauRetiree}
        onBascule={ds => setE(ds ? { eau: true, T: M.T_REFLUX } : { eau: false })} noteEau message={msgRetour} sousBascule={stepperT}/>
      {ex.T < M.T_REFLUX && <div style={{ ...aide, marginTop: 6 }}>Le montage de Dean-Stark ne fonctionne qu’à reflux : le choisir règle le chauffage sur {M.T_REFLUX} °C.</div>}
    </div>);
  const boxExplore = (
    <div style={styleBoite}>
      <div style={titreCarte}>Courbe de l’essai</div>
      <div style={aide}>Courbe de la quantité d’ester formé (mol) pour 1,00 mol d’acide ; le trait en pointillés <Nmax/> est la quantité maximale. Les pointillés mixtes orange marquent le palier de l’équilibre sans élimination.</div>
      <GrapheEssais courbes={courbesE} horizon={ex.horizon} mode={ex.mode} limite={ex.mode === 'n' && !pE.eau}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6 }}>Trait plein bleu : essai choisi{ex.comp ? ' · tirets gris : protocole de référence (1,00 mol d’éthanol, 75 °C, catalyseur, eau non retirée)' : ''}.</div>
    </div>);
  const iR = M.RAPPORTS.indexOf(ex.r);
  const reglages = (
    <div style={styleBoite} className="opt-ctrl">
      <div style={titreCarte}>Réglages du protocole</div>
      <div style={aide}>Chaque réglage modifie un seul levier : le schéma, la courbe et les mesures se mettent à jour.</div>
      <Section titre={`Réglages : ${resume}`} ouvert={ouv.reg} onBascule={() => setOuv(o => ({ ...o, reg: !o.reg }))}>
        <div style={{ ...lbSel }}>Température du mélange (réglée par le bouton du chauffe-ballon)
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
            <select value={ex.T} aria-label="Température du mélange" onChange={e => setE({ T: +e.target.value })} style={{ ...menu, width: 'auto', flex: '1 1 140px' }}>{PALIERS_CHAUFFE.map(T => <option key={T} value={T}>{T} °C{T === M.T_REFLUX ? ' (reflux)' : T === 60 ? ' (chaud, ne bout pas)' : ''}</option>)}</select>
            <button type="button" onClick={() => setE({ T: M.T_REFLUX })} style={{ ...stylePetitBouton(false), minHeight: 44 }}><Pic n="refresh"/>Rétablir</button></div>
          <div style={{ ...aide, marginTop: 4 }}>La température du menu est celle du bouton du chauffe-ballon. À reflux, elle est limitée par l’ébullition du mélange.</div></div>
        <label style={lbSel}>Quantité d’éthanol pour 1,00 mol d’acide (le niveau du ballon monte quand on en ajoute)
          <select value={ex.r} onChange={e => setE({ r: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{M.RAPPORTS.map(r => <option key={r} value={r}>{nbf(r, 2)} mol{r === 1 ? ' (aucun excès)' : ''}</option>)}</select></label>
        <div style={{ marginBottom: 8 }}><button type="button" disabled={iR >= M.RAPPORTS.length - 1} onClick={() => setE({ r: M.RAPPORTS[iR + 1] })} style={{ ...styleBouton(true, '#15803d'), minHeight: 44 }}>{iR < M.RAPPORTS.length - 1 ? `Ajouter ${nbf(M.RAPPORTS[iR + 1] - ex.r, 2)} mol d’éthanol (ampoule de coulée)` : 'Excès maximal atteint'}</button></div>
        <label style={lbSel}>Catalyseur (quelques gouttes d’acide sulfurique concentré : des étincelles apparaissent dans le ballon)
          <select value={ex.cat ? 'oui' : 'non'} onChange={e => setE({ cat: e.target.value === 'oui' })} style={{ ...menu, marginTop: 2 }}><option value="oui">avec catalyseur</option><option value="non">sans catalyseur</option></select></label>
        <label style={lbSel}>Eau formée (montage de Dean-Stark avec cyclohexane comme entraîneur)
          <select value={pE.eau ? 'oui' : 'non'} onChange={e => setE({ eau: e.target.value === 'oui' })} disabled={!M.retraitPossible(ex.T)} style={{ ...menu, marginTop: 2 }}><option value="non">laissée dans le ballon (montage à reflux)</option><option value="oui">retirée au fur et à mesure (Dean-Stark)</option></select></label>
        {!M.retraitPossible(ex.T) && <div style={aide}>Retirer l’eau suppose de chauffer à reflux (75 °C).</div>}
      </Section>
      <Section titre="Affichage : grandeur tracée, durée, comparaison" ouvert={ouv.aff} onBascule={() => setOuv(o => ({ ...o, aff: !o.aff }))}>
        <label style={lbSel}>Grandeur tracée
          <select value={ex.mode} onChange={e => setE({ mode: e.target.value })} style={{ ...menu, marginTop: 2 }}><option value="n">quantité d’ester formé</option><option value="qr">quotient de réaction Qr, comparé à K</option></select></label>
        <label style={lbSel}>Durée affichée
          <select value={ex.horizon} onChange={e => setE({ horizon: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{horizons.map(([h, l]) => <option key={h} value={h}>{l}</option>)}</select></label>
        <label style={lbSel}>Comparer avec le protocole de référence
          <select value={ex.comp ? 'oui' : 'non'} onChange={e => setE({ comp: e.target.value === 'oui' })} style={{ ...menu, marginTop: 2 }}><option value="non">non</option><option value="oui">oui (1,00 mol, 75 °C, catalyseur, eau non retirée)</option></select></label>
        <div style={aide}>Le tracé de Qr montre comment le quotient rejoint K, ou reste au-dessous de K tant que l’eau est retirée.</div>
        <button type="button" onClick={() => setEx({ ...REF, horizon: M.DUREE, mode: 'n', comp: false })} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir le protocole de référence</button>
      </Section>
    </div>);
  const mesures = (
    <div style={styleBoite}>
      <Section titre={`Mesures : rendement à 3 h = ${nbf(finE.x * 100, 1)} %`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>{resume}.</div>
        <LigneMesure nom="Rendement à la fin de l’essai (3 h)" valeur={`${nbf(finE.x * 100, 1)}${NB}%`} couleur={COL.bleu}/>
        <LigneMesure nom={pE.eau ? 'Rendement limite (eau retirée)' : 'Rendement à l’équilibre'} valeur={pE.eau ? '≈ 100 %' : `${nbf(M.xEq(pE.r) * 100, 1)}${NB}%`}/>
        <LigneMesure nom="Temps de demi-réaction" valeur={pE.eau ? 'non défini' : M.dureeTexte(tdE)}/>
        <LigneMesure nom="Qr à la fin de l’essai" valeur={isFinite(finE.qr) ? nbf(finE.qr, 2) : '—'}/>
        <LigneMesure nom="Constante d’équilibre K" valeur="4"/>
        <div style={{ ...aide, marginTop: 8 }}>Le rendement à la fin de l’essai est celui atteint au bout de 3{NB}h ; le rendement à l’équilibre est la valeur limite, atteinte seulement après un temps plus long. Plus les deux valeurs sont proches, plus l’essai est proche de l’équilibre.</div>
        <div style={{ ...aide, marginTop: 8 }}>Avec l’eau retirée, l’état final visé n’est plus le même : la moitié de l’avancement final n’est plus comparable, d’où l’absence de temps de demi-réaction.</div>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Passez de 75 °C à 45 °C, puis à 20 °C (durée affichée : 48 h) : que deviennent le temps de demi-réaction et le rendement à l’équilibre ?</li>
        <li>Retirez le catalyseur à 75 °C : le rendement à 3 h change-t-il ? Le rendement à l’équilibre aussi ?</li>
        <li>Comparez les rapports 1 : 1, 1 : 2, 1 : 3 et 1 : 5 : le gain de rendement est-il proportionnel à l’excès ?</li>
        <li>Retirez l’eau à reflux : quel rendement limite obtenez-vous ? Affichez Qr : reste-t-il inférieur à K ?</li>
        <li>Retirez l’eau avec un seul équivalent d’éthanol, puis avec un excès : les deux leviers s’additionnent-ils ?</li>
        <li>Parmi les quatre réglages, lesquels changent le temps de demi-réaction ? Lesquels changent le rendement à l’équilibre ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Rendement : η = n(obtenue) sur n(max) ; n(max) est fixée par le réactif limitant</li>
          <li>Plus vite : température, catalyseur, concentration (temps de demi-réaction plus court, même palier)</li>
          <li>Qr &lt; K : sens direct ; Qr &gt; K : sens inverse ; Qr = K : équilibre</li>
          <li>Excès d’un réactif : Qr passe sous K, plus de produit, rendement plus grand (de moins en moins)</li>
          <li>Élimination d’un produit : Qr reste sous K, la transformation se poursuit</li>
          <li>Le catalyseur ne change ni K ni le rendement à l’équilibre</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .opt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .opt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .opt-col { display: flex; flex-direction: column; gap: 12px; }
        .opt-df { display: block; margin-bottom: 12px; } .opt-df > * { margin-bottom: 12px; }
        @media (min-width: 901px) { .opt-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .opt-df > * { margin-bottom: 0; } .opt-df-scene { grid-column: 1; grid-row: 1 / span 2; }
          .opt-df-volet { grid-column: 2; grid-row: 1; } .opt-df-hypo { grid-column: 2; grid-row: 2; } }
        .opt-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .opt-l1.cote .opt-carte { order: 2; } .opt-l1.cote .opt-main { order: 1; }
          .opt-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .opt-ex > * { grid-column: 1; } .opt-ex > .opt-ctrl { grid-column: 2; grid-row: 1 / span 6; } .opt-o1 { order: 1; } .opt-o2 { order: 2; } .opt-o3 { order: 3; } .opt-o4 { order: 4; } .opt-o5 { order: 5; } }
        @media (max-width: 900px) { .opt-l1.cote { grid-template-columns: minmax(0, 1fr); } .opt-l1.cote.mt .opt-main { order: -1; } }
        @media (prefers-reduced-motion: no-preference) { .opt-in { animation: opt-fondu 0.35s ease-out; } @keyframes opt-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Optimiser une étape de synthèse : vitesse et rendement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Estérification de l’acide éthanoïque par l’éthanol : quelles opérations d’un protocole accélèrent la formation de l’ester, lesquelles augmentent le rendement, et comment le justifier avec Qr et K.</div>
      {enGuide && <div className={'opt-l1 cote' + (['protocole', 'ajout', 'rapports', 'retrait', 'variante'].includes(idEtape) ? ' mt' : '')}>
        <div className="opt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="opt-main"><div className="opt-col">
          {idEtape !== 'bilan' && <div className="opt-in" key={'s-' + idEtape}><div style={styleBoite}>{sceneGuide()}</div></div>}
        </div></div>
      </div>}
      {enDefi && defi && <div className="opt-df">
        <div className="opt-df-scene opt-in" key={'d' + defi.type}>
          <div style={styleBoite}>
            <Equation/>
            {defi.type === 'rendement'
              ? (defi.dernier
                ? <><GrapheEssais courbes={[{ p: defi.dernier.p, c: COL.bleu }]} horizon={M.DUREE} ticksY="std" nmax aria="Graphique : quantité d’ester formé pendant le dernier essai."/><div style={sceneNote}>Dernier essai : {nbf(defi.dernier.p.r, 2)} mol d’éthanol, eau {defi.dernier.p.eau ? 'retirée' : 'non retirée'}.</div></>
                : <div style={sceneNote}>Choisissez les conditions, puis lancez l’essai : la courbe de la quantité d’ester s’affichera ici.</div>)
              : <><Protocole titre="Protocole d’estérification (extrait)" lignes={PROTO_A.slice(0, 4)}/></>}
          </div>
        </div>
        <div className="opt-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'rendement' ? suiviR : suiviP}/></div></div>
        <div className="opt-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="opt-ex">
        <div className="opt-o0">{boxMontage}</div>
        <div className="opt-ctrl">{reglages}</div>
        <div className="opt-o2">{mesures}</div>
        <div className="opt-o1">{boxExplore}</div>
        <div className="opt-o3">{aEssayer}</div>
        <div className="opt-o4">{retenirExplore}</div>
        <div className="opt-o5">{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}

// ====================================================
//  Question de défi : réponse numérique ou QCM, indice, retour sur la dernière réponse, correction après une réussite ou 3 essais faux
// ====================================================
function QuestionDefi({ n, q, onEssai }) {
  const [rep, setRep] = useState(q.type === 'num' ? '' : null), [essais, setEssais] = useState(0), [ok, setOk] = useState(false), [verifie, setVerifie] = useState(false);
  const juge = () => (q.type === 'num' ? (() => { const x = lireNombre(rep); return isFinite(x) && proche(x, q.vrai, q.tol); })() : rep === q.bonne);
  const valider = () => { if (rep === null || rep === '') return; const j = juge(); setVerifie(true); setEssais(e => e + 1); if (j) setOk(true); onEssai(j); };
  const piege = () => { if (q.type !== 'num') return null; const x = lireNombre(rep); if (!isFinite(x)) return 'Entrez une valeur numérique (virgule ou point).'; const pg = (q.pieges || []).find(([v]) => proche(x, v, Math.max(q.tol, 0.04))); return pg ? pg[1] : null; };
  const revele = ok || essais >= 3, jugeMaintenant = verifie && juge();
  return (
    <div style={{ borderTop: `1px solid ${KIT.bord}`, paddingTop: 8, marginTop: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, lineHeight: 1.5, marginBottom: 6 }}>{n}. {indicesProfond(q.q)}</div>
      {q.type === 'num'
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, marginBottom: 6 }}>
          <input value={rep} aria-label={`Réponse à la question ${n}`} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && valider()} onChange={e => { setRep(e.target.value); setVerifie(false); }}
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${verifie ? (jugeMaintenant ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{q.unite}</span></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>{q.options.map(([k, t]) => <button key={k} onClick={() => { setRep(k); setVerifie(false); }} aria-pressed={rep === k}
          style={{ ...stylePetitBouton(rep === k, '#0ea5e9'), textAlign: 'left', padding: '6px 10px', fontSize: 14 }}>{t}</button>)}</div>}
      <IndiceDefi cache={ok}>{q.indice}</IndiceDefi>
      <div style={{ marginTop: 6 }}><button onClick={valider} disabled={ok} style={styleBouton(true, '#15803d')}>✓ Vérifier</button></div>
      {verifie && <div role="status" aria-live="polite" style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: jugeMaintenant ? '#15803d' : '#b91c1c' }}>
        {jugeMaintenant ? '✓ Correct.' : '✗ Pas tout à fait.'}{!jugeMaintenant && piege() && <div style={{ fontWeight: 400, fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{avecIndices(piege())}</div>}</div>}
      {revele && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 8px', lineHeight: 1.5 }}>{indicesProfond(q.expl)}</div>}
    </div>);
}
