import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./corpsPur2gtModele";
import { QCM } from "./corpsPur2gtQcm";
import { COL } from "./changementEtat2gtCouleurs";
import { SceneMicro, SceneHomHet, SceneThermometre, CourbeT, CourbeProfil, TableauRef } from "./CorpsPur2gtScenes";
import { FichePurMelange, FicheHomHet, FicheArbre, FichePalier, FicheDeuxCourbes, FichePrecision, FicheCompatible, FicheIdentifier, FicheBilan } from "./CorpsPur2gtFiches";

const SIM_ID = 196, CLE_GUIDE = 'corps-pur-2gt-guide-v1';
declarerDefis(SIM_ID, [['pur', 'Corps pur ou mélange ? (courbe de chauffage)'], ['liquide', 'Quel est ce liquide ? (température d’ébullition)']]);

// ====================================================
//  SIM 196 — CORPS PUR OU MÉLANGE : TEMPÉRATURE DE CHANGEMENT D'ÉTAT (2GT spé PC, « Description et caractérisation de la matière à l'échelle macroscopique »).
//  Prérequis : simulation 195 (changement d'état : la température reste constante pendant le changement d'état d'un corps pur ; L n'est pas redéfini ici),
//  simulation 63 (mélanges homogènes ou hétérogènes, miscibilité, masse volumique : renvoi, pas refaite). Une seule idée : un corps pur change d'état à température
//  constante (palier), à une température de référence ; un mélange n'a pas de palier net ou n'a pas la température de référence.
//  Parcours (12 étapes) : corps pur ou mélange (1), homogène ou hétérogène (1), tri de six produits (1), palier d'un corps pur (1), courbe d'un mélange (1),
//  lire la température d'un palier (1), précision du thermomètre (1), écart avec la référence (1), compatibilité (1), identifier un liquide (1), eau salée (1), bilan (1).
//  Capacités visées (jamais affichées à l'élève) : citer des exemples courants de corps purs et de mélanges homogènes et hétérogènes ; distinguer un mélange d'un corps pur
//  à partir de données expérimentales (courbe de température lors d'un changement d'état) ; identifier une espèce chimique à partir de valeurs de référence par ses
//  températures de changement d'état ; mesurer une température de changement d'état (lecture graphique, précision du thermomètre).
//  Hors programme, non traité : azéotropes (une ligne dans le panneau), diagrammes binaires, calcul d'incertitude (simulation 194), ébullioscopie quantitative.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB;
const nf = M.nombreFR;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const decPrec = p => M.decimales(p);
const tLue = (T, prec) => nf(M.lecture(T, prec), decPrec(prec));
// Échantillons de l'exploration
const ECHANTILLONS = [...M.LIQUIDES.map(id => ({ id, nom: `${M.CORPS[id].nom} pur (${M.CORPS[id].f})`, melange: false })),
  ...Object.values(M.MELANGES).map(m => ({ id: m.id, nom: `mélange : ${m.nom}`, melange: true }))];

export function SimulationCorpsPur() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviL, noterL] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('pur');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [tri, setTri] = useState({});
  const [ex, setEx] = useState({ id: 'ethanol', p: null, prec: 0.5, t: 0, joue: false, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- tri des six produits (étape 3) ----------
  const triOk = M.TRI.every(id => tri[id] === M.exemple(id).cat);
  const sceneTri = (
    <div data-tri="1">
      <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: KIT.txt, lineHeight: 1.5 }}>Choisissez une catégorie pour chacun des six produits : l’étape se termine quand tout est juste.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {M.TRI.map(id => {
          const e = M.exemple(id), c = tri[id], juste = c === e.cat;
          return (
            <div key={id} style={{ background: 'white', border: `2px solid ${c ? (juste ? '#15803d' : '#dc2626') : KIT.bord}`, borderRadius: 12, padding: '8px 10px' }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{e.nom}</div>
              <div role="group" aria-label={`Catégorie de ${e.nom}`} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {M.CATEGORIES.map(([k, nom]) => <button key={k} onClick={() => setTri(t => ({ ...t, [id]: k }))} aria-pressed={c === k} style={stylePetitBouton(c === k, '#0369a1')}>{nom}</button>)}
              </div>
              {c && <div role="status" style={{ marginTop: 6, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: juste ? '#15803d' : '#dc2626' }}>
                {juste ? <>✓ {e.pourquoi}</> : <>✗ Pas encore : combien d’espèces chimiques ? Et voit-on plusieurs matières à l’œil nu ?</>}</div>}
            </div>);
        })}
      </div>
    </div>);

  // ---------- étapes du parcours ----------
  const IDS = ['espece', 'homhet', 'tri', 'palier', 'melange', 'lire', 'precision', 'ecart', 'compat', 'identifier', 'eausalee', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const ETAPES = [
    { id: 'espece', titre: 'Corps pur ou mélange ?', focus: ['scene'],
      texte: <>Une <strong>espèce chimique</strong> est un type de matière toujours le même : l’or, l’eau, le sucre, le dioxygène sont des espèces chimiques. Un <strong>corps pur</strong> ne contient qu’<strong>une seule</strong> espèce chimique. Un <strong>mélange</strong> en contient <strong>au moins deux</strong>.
        <ExempleResolu>Un lingot d’or pur ne contient que de l’or : c’est un <strong>corps pur</strong>. L’air contient du diazote, du dioxygène et d’autres gaz : c’est un <strong>mélange</strong>.</ExempleResolu>
        À vous : trouvez le corps pur.</>,
      tache: { type: 'qcm', ...QCM.pur } },
    { id: 'homhet', titre: 'Un seul liquide, ou plusieurs matières ?', focus: ['scene'],
      texte: <>Un mélange peut être <strong>homogène</strong> ou <strong>hétérogène</strong>. Dans un mélange homogène, on ne distingue <strong>qu’une seule matière</strong> à l’œil nu. Dans un mélange hétérogène, on distingue <strong>plusieurs matières</strong>.
        <ExempleResolu>Eau et sirop de menthe bien mélangés : on ne voit qu’un liquide vert, c’est un mélange <strong>homogène</strong>. Eau et huile : on voit deux couches, c’est un mélange <strong>hétérogène</strong> (les liquides ne se mélangent pas : voir la simulation « Mélanges »).</ExempleResolu>
        À vous : repérez le mélange hétérogène.</>,
      tache: { type: 'qcm', ...QCM.homhet },
      retenirTitre: 'Corps pur ou mélange',
      retenir: <><FichePurMelange />
        <ul style={liste}>
          <li><strong>Phrase-clé : un corps pur, une seule espèce ; un mélange, au moins deux.</strong></li>
          <li><strong>Exemple</strong> : l’or pur est un corps pur ; l’air est un mélange de gaz.</li>
        </ul>{renvoi}</> },
    { id: 'tri', titre: 'Ranger des produits du quotidien', focus: ['scene'],
      texte: <>Rangez chaque produit dans l’une des trois catégories : <strong>corps pur</strong>, <strong>mélange homogène</strong> ou <strong>mélange hétérogène</strong>. Deux questions aident : combien d’espèces chimiques contient-il ? Voit-on plusieurs matières à l’œil nu ?
        <ExempleResolu>Du jus de pomme sans pulpe : il contient de l’eau, des sucres et d’autres espèces (au moins deux) ; on ne voit qu’un liquide : <strong>mélange homogène</strong>.</ExempleResolu></>,
      tache: { type: 'action', ok: triOk, consigne: 'Quand les six produits sont bien rangés, l’étape est terminée.' },
      retenirTitre: 'Homogène ou hétérogène',
      retenir: <><FicheHomHet />
        <ul style={liste}>
          <li><strong>Phrase-clé : homogène, une seule matière visible ; hétérogène, plusieurs.</strong></li>
          <li><strong>Exemple</strong> : l’eau salée est homogène ; l’eau et l’huile sont hétérogènes.</li>
        </ul>{renvoi}</> },
    { id: 'palier', titre: 'La courbe d’un corps pur', focus: ['scene'],
      texte: <>Chauffons de l’éthanol pur et notons sa température chaque minute : on trace une <strong>courbe de chauffage</strong>. Quand un corps pur change d’état, sa <strong>température reste constante</strong> (voir la simulation « Changement d’état et énergie »). Sur la courbe, cela donne une partie plate : le <strong>palier</strong>.
        <ExempleResolu>Pour l’eau pure, le palier est en face de 100&nbsp;°C : c’est la <strong>température d’ébullition</strong> de l’eau.</ExempleResolu>
        À vous : la courbe de l’éthanol. Les traits fins verticaux sont espacés d’une minute.</>,
      tache: { type: 'qcm', ...QCM.palier },
      retenirTitre: 'Les trois catégories',
      retenir: <><FicheArbre />
        <ul style={liste}>
          <li><strong>Phrase-clé : homogène ne veut pas dire pur.</strong> Un mélange peut ressembler à un seul liquide.</li>
          <li><strong>Exemples</strong> : l’or pur et le dioxygène sont des corps purs ; l’eau du robinet et l’air sont des mélanges.</li>
        </ul>{renvoi}</> },
    { id: 'melange', titre: 'Une autre courbe de chauffage', focus: ['scene'],
      texte: <>On chauffe maintenant un autre liquide, dont on ne connaît pas la nature, et on trace sa courbe de chauffage. Comparez-la à celle de l’éthanol de l’étape précédente : repérez ce qui change pendant l’ébullition.</>,
      tache: { type: 'qcm', ...QCM.melange },
      retenirTitre: 'Le palier d’un corps pur',
      retenir: <><FichePalier />
        <ul style={liste}>
          <li><strong>Phrase-clé : corps pur, palier à température constante.</strong></li>
          <li><strong>Exemple</strong> : l’eau pure bout à 100&nbsp;°C et reste à 100&nbsp;°C pendant l’ébullition.</li>
        </ul>{renvoi}</> },
    { id: 'lire', titre: 'Lire la température du palier', focus: ['scene'],
      texte: <>Un flacon sans étiquette contient un liquide <strong>pur</strong>. On le chauffe et on trace sa courbe. La <strong>température d’ébullition</strong> se lit sur l’axe vertical, en face du palier : les nombres sont écrits tous les 20&nbsp;°C et une ligne horizontale est tracée tous les 10&nbsp;°C.
        <ExempleResolu>Sur la courbe de l’éthanol, le palier est en face de 78&nbsp;°C : la température d’ébullition lue est 78&nbsp;°C.</ExempleResolu>
        À vous : lisez la température du palier du flacon.</>,
      tache: { type: 'num', q: <>Quelle température d’ébullition lit-on sur le palier ?</>, carnet: 'Température d’ébullition du flacon sans étiquette', unite: '°C', vrai: M.CORPS.acetone.Tvap, tol: 0.045, affiche: v => nf(v),
        calcul: () => ['Repérez la partie plate de la courbe (le palier).', 'Suivez-la vers la gauche jusqu’à l’axe vertical : elle est entre les lignes de 50 °C et de 60 °C, plus près de 60 °C : environ 56 °C.'],
        pieges: [[20, 'C’est la température de départ, avant le chauffage. Il faut lire la hauteur du palier.'], [60, 'La ligne de 60 °C est tout près, mais le palier est un peu plus bas : comparez avec les lignes de 50 °C et de 60 °C.'], [78, 'C’est le palier de l’éthanol, vu à l’étape précédente. Ici, regardez la courbe du flacon.']],
        expl: 'Le palier est en face de 56 °C environ : c’est la température d’ébullition du liquide du flacon.', indice: 'Repérez la partie plate, puis suivez-la vers la gauche jusqu’à l’axe vertical. Entre quels grands traits se trouve-t-elle ?' },
      retenirTitre: 'Corps pur ou mélange : deux courbes',
      retenir: <><FicheDeuxCourbes />
        <ul style={liste}>
          <li><strong>Phrase-clé : un palier, peut-être un corps pur ; pas de palier, forcément un mélange.</strong></li>
          <li><strong>Exemple</strong> : l’éthanol pur a un palier à 78&nbsp;°C ; un mélange d’eau et d’éthanol n’en a pas.</li>
        </ul>{renvoi}</> },
    { id: 'precision', titre: 'La précision du thermomètre', focus: ['scene'],
      texte: <>Un thermomètre n’est jamais parfait : il est <strong>précis à ±&nbsp;1&nbsp;°C</strong>, par exemple. La valeur lue peut donc différer de la vraie température d’au plus 1&nbsp;°C, vers le haut ou vers le bas.
        <ExempleResolu>On lit 78&nbsp;°C avec un thermomètre précis à ±&nbsp;1&nbsp;°C : la vraie température est <strong>entre 77&nbsp;°C et 79&nbsp;°C</strong>.</ExempleResolu>
        À vous : le thermomètre du flacon sans étiquette.</>,
      tache: { type: 'qcm', ...QCM.precision } },
    { id: 'ecart', titre: 'Comparer à la valeur de référence', focus: ['scene'],
      texte: <>Un tableau donne les <strong>valeurs de référence</strong> : les températures de changement d’état de corps purs connus, à la pression atmosphérique normale. L’<strong>écart</strong> entre deux valeurs est leur différence, toujours positive. Le flacon a donné 56&nbsp;°C.
        <ExempleResolu>Avec l’eau (référence 100&nbsp;°C) : écart = 100 − 56 = <strong>44&nbsp;°C</strong>.</ExempleResolu>
        À vous : avec l’éthanol.</>,
      tache: { type: 'num', q: <>Quel est l’écart entre 56&nbsp;°C et la valeur de référence de l’éthanol ?</>, carnet: false, unite: '°C', vrai: M.CORPS.ethanol.Tvap - 56, tol: 0.06, affiche: v => nf(v),
        calcul: () => ['Dans le tableau, la température d’ébullition de l’éthanol est 78 °C.', 'Écart = 78 − 56 = 22 °C.'],
        pieges: [[78, 'C’est la valeur de référence, pas l’écart : faites la différence avec 56 °C.'], [134, 'On soustrait les deux valeurs, on ne les additionne pas.'], [44, 'C’est l’écart avec l’eau, de l’exemple. Ici, c’est l’éthanol.']],
        expl: 'Écart = 78 − 56 = 22 °C.', indice: 'Lisez la température d’ébullition de l’éthanol dans le tableau, puis soustrayez 56 °C.' },
      retenirTitre: 'Valeur lue et précision',
      retenir: <><FichePrecision />
        <ul style={liste}>
          <li><strong>Phrase-clé : valeur lue ± précision, c’est une zone.</strong></li>
          <li><strong>Exemple</strong> : 100&nbsp;°C lus avec une précision de ±&nbsp;0,5&nbsp;°C : la vraie valeur est entre 99,5&nbsp;°C et 100,5&nbsp;°C.</li>
        </ul>{renvoi}</> },
    { id: 'compat', titre: 'Quand deux valeurs sont-elles compatibles ?', focus: ['scene'],
      texte: <>Une valeur lue est <strong>compatible</strong> avec une valeur de référence si leur <strong>écart est inférieur à la précision</strong> du thermomètre. Sinon, elle n’est pas compatible.
        <ExempleResolu>On lit 99,5&nbsp;°C (précision ±&nbsp;1&nbsp;°C) pour de l’eau, dont la référence est 100&nbsp;°C. Écart : 0,5&nbsp;°C, inférieur à 1&nbsp;°C : <strong>compatible</strong>.</ExempleResolu>
        À vous : l’éthanol, dont la référence est dans le tableau.</>,
      tache: { type: 'qcm', ...QCM.compat } },
    { id: 'identifier', titre: 'Quel est ce liquide ?', focus: ['scene'],
      texte: <>Pour identifier un liquide pur, on compare sa température d’ébullition aux valeurs de référence : on garde les liquides <strong>compatibles</strong>. On pourrait aussi utiliser la masse volumique (voir la simulation « Mélanges »).
        <ExempleResolu>Un liquide bout à 56,5&nbsp;°C (précision ±&nbsp;1&nbsp;°C) : écart de 0,5&nbsp;°C avec l’acétone, bien plus grand avec les autres. C’est l’<strong>acétone</strong>.</ExempleResolu>
        À vous : un autre liquide, avec le même thermomètre.</>,
      tache: { type: 'qcm', ...QCM.identifier },
      retenirTitre: 'Compatible ou non',
      retenir: <><FicheCompatible />
        <ul style={liste}>
          <li><strong>Phrase-clé : compatible si l’écart est inférieur à la précision.</strong></li>
          <li><strong>Exemple</strong> : lu 97&nbsp;°C (précision ±&nbsp;1&nbsp;°C) : l’écart avec 100&nbsp;°C est 3&nbsp;°C, pas compatible.</li>
        </ul>{renvoi}</> },
    { id: 'eausalee', titre: 'Un liquide qui bout à 102 °C', focus: ['scene'],
      texte: <>On chauffe un liquide inconnu. Regardez sa courbe pendant l’ébullition, avec un axe vertical agrandi (de 96&nbsp;°C à 106&nbsp;°C). Pour de l’eau pure, la référence est 100&nbsp;°C.
        <ExempleResolu>Si c’était de l’eau pure, le thermomètre (précis à ±&nbsp;0,5&nbsp;°C) indiquerait entre 99,5&nbsp;°C et 100,5&nbsp;°C.</ExempleResolu>
        À vous : tirez la conclusion.</>,
      tache: { type: 'qcm', ...QCM.eausalee },
      retenirTitre: 'Identifier un liquide',
      retenir: <><FicheIdentifier />
        <ul style={liste}>
          <li><strong>Phrase-clé : écart avec chaque référence, puis on garde les compatibles.</strong></li>
          <li><strong>Exemple</strong> : lu 80,5&nbsp;°C (±&nbsp;1&nbsp;°C) : le cyclohexane (81&nbsp;°C) convient, l’éthanol (78&nbsp;°C) non.</li>
        </ul>{renvoi}</> },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>Un <strong>corps pur</strong> a un <strong>palier</strong> à sa température de changement d’état, qu’on retrouve dans les valeurs de référence. Un <strong>mélange</strong> n’a pas de palier net, ou une température qui ne correspond pas à la référence. Pour comparer, on regarde l’<strong>écart</strong> et la <strong>précision</strong> du thermomètre. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'L’eau salée et les limites',
      retenir: <><FicheBilan />
        <ul style={liste}>
          <li><strong>Phrase-clé : l’eau salée bout au-dessus de 100&nbsp;°C, l’eau pure à 100&nbsp;°C.</strong></li>
          <li><strong>À savoir</strong> : ces règles valent à la pression normale ; un mélange très particulier peut avoir un palier (hors programme).</li>
        </ul></> },
  ];

  // ---------- scènes du parcours guidé ----------
  const prEthanol = M.profil('ethanol'), prMel = M.profil('eau-ethanol', 30), prFlacon = M.profil('acetone'), prSel = M.profil('eau-sel', 10), prEau = M.profil('eau');
  const sceneGuide = (() => {
    switch (idE) {
      case 'espece': return boite('Une seule sorte d’entité, ou plusieurs ?', <SceneMicro />);
      case 'homhet': return boite('Deux mélanges', <SceneHomHet />);
      case 'tri': return boite('Six produits à ranger', sceneTri);
      case 'palier': return boite('Courbe de chauffage de l’éthanol pur', <CourbeProfil pr={prEthanol} ariaLabel="Courbe de la température de l’éthanol pur en fonction du temps : la température monte de 20 degrés Celsius, puis reste constante pendant plusieurs minutes, puis la courbe s’arrête." />);
      case 'melange': return boite('Courbe de chauffage d’un liquide inconnu', <CourbeProfil pr={prMel} ariaLabel="Courbe de chauffage d’un liquide inconnu : température en fonction du temps." />);
      case 'lire': return boite('Courbe de chauffage du flacon sans étiquette', <CourbeProfil pr={prFlacon} yPas={20} ymineur={10} ariaLabel="Courbe de la température du liquide du flacon en fonction du temps : la température monte, puis reste constante pendant 5 minutes. La hauteur du palier est à lire sur l’axe vertical." />);
      case 'precision': return boite('Le thermomètre du flacon', <SceneThermometre lue={56} prec={1} />);
      case 'ecart': return boite('Valeurs de référence', <TableauRef />);
      case 'compat': return boite('Valeurs de référence', <TableauRef />);
      case 'identifier': return boite('Valeurs de référence', <><TableauRef /><div style={{ marginTop: 8 }}><SceneThermometre lue={80.5} prec={1} titre="un autre liquide pur : précision ± 1 °C" /></div></>);
      case 'eausalee': return boite('Liquide inconnu : zoom sur l’ébullition', <CourbeT points={M.courbe(prSel)} tMin={10} tMax={20} tPas={5} tMineur={1} yMin={96} yMax={106} yPas={2} ymineur={1} hauteur={290} refs={[{ T: 100, label: 'eau pure : 100 °C', couleur: COL.rouge }]} ariaLabel="Courbe d’un liquide inconnu près de l’ébullition, axe vertical de 96 à 106 degrés Celsius. La température monte jusqu’à environ 102 degrés Celsius puis varie très peu. Une ligne en pointillés marque la référence de l’eau pure, 100 degrés Celsius." />);
      case 'bilan': return boite('Un corps pur : le palier', <CourbeProfil pr={prEau} surligne ariaLabel="Courbe de chauffage de l’eau pure : un palier à 100 degrés Celsius, partie colorée." />);
      default: return null;
    }
  })();

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'pur') setDefi({ type, ...M.tirerDefiPur(prec && prec.type === 'pur' ? prec : null), rep: '', verifie: false });
    else setDefi({ type, ...M.tirerDefiLiquide(prec && prec.type === 'liquide' ? prec : null), rep: '', verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    const ok = defi.type === 'pur' ? M.reponseJustePur(defi, defi.rep) : M.reponseJusteLiquide(defi, defi.rep);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'pur' ? noterP : noterL)(ok);
  };
  const messageDefi = d => {
    if (d.type === 'pur') {
      if (d.ok) return d.pur ? `✓ Correct : c’est un corps pur (${M.corps(d.id).nom}) : palier à ${M.temp(d.pr.Tdeb)}.` : `✓ Correct : c’est un mélange : la température monte de ${nf(M.arrondi(d.pr.Tdeb, 0))}${NB}°C à ${nf(M.arrondi(d.pr.Tfin, 0))}${NB}°C pendant l’ébullition, sans palier.`;
      return d.pur ? '✗ Pas encore : repérez la partie plate de la courbe. Y en a-t-il une ?' : '✗ Pas encore : la température continue-t-elle de monter pendant l’ébullition ? Un corps pur resterait constant.';
    }
    const lignes = M.LIQUIDES.map(id => { const e = M.ecart(d.lue, M.CORPS[id].Tvap); return `${M.CORPS[id].nom} : écart ${nf(M.arrondi(e, 1), 1)}${NB}°C ${e < d.prec ? '<' : '>'} ${nf(d.prec)}${NB}°C`; });
    if (d.ok) return `✓ Correct : ${M.CORPS[d.id].art}. Écarts avec les références : ${lignes.join(' ; ')}. Seul ${M.CORPS[d.id].art} est compatible.`;
    return '✗ Pas encore : calculez l’écart entre la valeur lue et chaque référence, puis gardez le liquide dont l’écart est inférieur à la précision.';
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['pur', 'Corps pur ou mélange ?'], ['liquide', 'Quel est ce liquide ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'pur' ? 'Défi : corps pur ou mélange ?' : 'Défi : quel est ce liquide ?'}</div>
      {defi.type === 'pur' ? (
        <>
          <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On chauffe un liquide à la pression atmosphérique et on trace la courbe de sa température. <strong>S’agit-il d’un corps pur ou d’un mélange ?</strong></div>
          <div role="group" aria-label="Votre réponse" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {[['pur', 'corps pur'], ['melange', 'mélange']].map(([k, l]) => <button key={k} onClick={() => setDefi(x => ({ ...x, rep: k, verifie: false }))} aria-pressed={defi.rep === k} style={stylePetitBouton(defi.rep === k, '#0369a1')}>{l}</button>)}
          </div>
          <IndiceDefi cache={false}>Cherchez une partie plate pendant l’ébullition. Un corps pur en a une (le palier) ; un mélange n’en a pas.</IndiceDefi>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un liquide <strong>pur</strong> bout à la pression atmosphérique. Le thermomètre, <strong>précis à ±&nbsp;{nf(defi.prec)}{NB}°C</strong>, indique <strong>{nf(defi.lue, 1)}{NB}°C</strong> pendant l’ébullition. D’après le tableau, de quel liquide s’agit-il ? (Compatible : écart inférieur à {nf(defi.prec)}{NB}°C.)</div>
          <div role="group" aria-label="Votre réponse" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {M.LIQUIDES.map(id => <button key={id} onClick={() => setDefi(x => ({ ...x, rep: id, verifie: false }))} aria-pressed={defi.rep === id} style={stylePetitBouton(defi.rep === id, '#0369a1')}>{M.CORPS[id].nom}</button>)}
          </div>
          <IndiceDefi cache={false}>Calculez l’écart entre {nf(defi.lue, 1)}&nbsp;°C et la référence de chaque liquide. Un seul écart est inférieur à la précision.</IndiceDefi>
        </>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cp-verif" onClick={verifier} disabled={!defi.rep} style={{ ...styleBouton(true, '#15803d'), opacity: defi.rep ? 1 : 0.5 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{messageDefi(defi)}</div>}
    </div>);
  const sceneDefi = defi && (defi.type === 'pur'
    ? boite('Courbe de chauffage du liquide', <CourbeProfil pr={defi.pr} ariaLabel="Courbe de la température du liquide en fonction du temps, du début du chauffage à la fin de l’ébullition." />)
    : boite('Courbe de chauffage et valeurs de référence', <><CourbeProfil pr={M.profilPalier(defi.lue)} ariaLabel={`Courbe de la température du liquide : palier à ${nf(defi.lue, 1)} degrés Celsius.`} /><div style={{ marginTop: 8 }}><TableauRef fusion={false} /></div></>));

  // ---------- hypothèses ----------
  const lih = { marginBottom: 2 };
  const hypotheses = (
    <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={lih}><strong>Pression atmosphérique normale</strong> : les valeurs de référence du tableau sont celles de la pression normale. À une autre pression, les températures d’ébullition changent.</li>
        <li style={lih}><strong>Chauffage régulier</strong> : sans changement d’état, la température monte de 6&nbsp;°C par minute. On ne trace que le début de l’ébullition, pendant 5&nbsp;minutes pour tous les liquides : l’ébullition complète durerait beaucoup plus longtemps que la montée. La durée du palier ne sert donc pas à identifier un liquide (voir la simulation « Changement d’état et énergie »), et les pentes sont schématiques.</li>
        <li style={lih}><strong>Thermomètre simulé et « compatible »</strong> : la valeur lue est proche de la vraie température, à la précision près (on peut lire entre deux graduations). On compare l’écart à la précision, sans calcul d’incertitude (c’est l’objet de la simulation sur l’incertitude-type).</li>
        <li style={lih}><strong>Mélange ordinaire</strong> : on suppose que le mélange n’a pas de température de changement d’état unique. Un mélange très particulier (un « azéotrope », comme l’eau avec environ 96&nbsp;% d’éthanol, qui bout vers 78&nbsp;°C) peut bouillir à température constante comme un corps pur : hors programme, ne vous laissez pas tromper.</li>
      </ul>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: KIT.txt }}>Pour les curieux</summary>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          <li style={lih}><strong>Échantillon uniforme</strong> : l’échantillon est homogène et sa température est la même partout ; le thermomètre mesure la température de tout l’échantillon.</li>
          <li style={lih}><strong>Courbes schématiques</strong> : pour un mélange, la température du début d’ébullition est un ordre de grandeur ; la montée de eau + éthanol est un peu exagérée. Pour l’eau salée, la montée réelle est très faible : on repère surtout que l’ébullition n’a pas lieu à 100&nbsp;°C. Les courbes sont idéales, sans fluctuations de mesure.</li>
          <li style={lih}><strong>Références arrondies, prises comme exactes</strong> : elles varient de moins de 1&nbsp;°C d’une table à l’autre ; on les traite comme exactes.</li>
        </ul>
      </details>
    </div>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const mel = M.MELANGES[ex.id] || null, prEx = M.profil(ex.id, mel ? ex.p ?? mel.defaut : null);
  const tFinEx = prEx.tFin, tEx = Math.min(ex.t, tFinEx), TEx = M.temperature(prEx, tEx);
  useEffect(() => {
    if (!ex.joue) return undefined;
    const id = setInterval(() => setEx(s => (s.t >= M.profil(s.id, M.MELANGES[s.id] ? s.p ?? M.MELANGES[s.id].defaut : null).tFin - 1e-9 ? { ...s, joue: false } : { ...s, t: Math.round((s.t + 0.1) * 10) / 10 })), 70);
    return () => clearInterval(id);
  }, [ex.joue]);
  const changerEch = id => setEx(s => ({ ...s, id, p: M.MELANGES[id] ? M.MELANGES[id].defaut : null, t: 0, joue: false }));
  const enEbullition = tEx > prEx.tDeb + 1e-9 && tEx <= prEx.tFin + 1e-9;
  const reglagesEx = (<>
    <label style={etiquette}>Échantillon
      <select value={ex.id} onChange={x => changerEch(x.target.value)} style={sel}>{ECHANTILLONS.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}</select></label>
    {mel && <Curseur nom={`${mel.reglage} (en masse)`} valeur={ex.p ?? mel.defaut} onChange={v => setEx(s => ({ ...s, p: Math.round(v / mel.pas) * mel.pas, t: 0, joue: false }))} min={mel.min} max={mel.max} pas={mel.pas} unite={mel.unite} decimales={0} couleur="#b45309" />}
    <label style={etiquette}>Précision du thermomètre
      <select value={ex.prec} onChange={x => setEx(s => ({ ...s, prec: Number(x.target.value) }))} style={sel}>{M.PRECISIONS.map(p => <option key={p} value={p}>±&nbsp;{nf(p)}&nbsp;°C</option>)}</select></label>
    <Curseur nom="Durée de chauffage" valeur={tEx} onChange={v => setEx(s => ({ ...s, t: Math.round(v * 10) / 10, joue: false }))} min={0} max={Math.ceil(tFinEx * 10) / 10} pas={0.1} unite="min" decimales={1} couleur="#0369a1" />
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      <button onClick={() => setEx(s => ({ ...s, joue: !s.joue, t: s.t >= tFinEx - 1e-9 ? 0 : s.t }))} style={styleBouton(true, '#b45309')}>{ex.joue ? 'Pause' : 'Chauffer'}</button>
      <button onClick={() => setEx(s => ({ ...s, t: 0, joue: false }))} style={styleBouton(false)}><Pic n="refresh" />Recommencer</button>
    </div>
    {aide('Choisissez un échantillon et chauffez : la courbe se trace au fil du temps. Changez la précision du thermomètre et regardez quels liquides restent compatibles avec la valeur lue.')}
  </>);
  const scEx = <CourbeT points={M.courbe(prEx).filter(([t]) => t <= tEx + 1e-9)} tMax={20} curseur={{ t: tEx, T: TEx }} ariaLabel={`Courbe de chauffage de ${M.nomEchantillon(ex.id, mel ? ex.p ?? mel.defaut : null)} : température lue ${tLue(TEx, ex.prec)} degrés Celsius à ${nf(tEx, 1)}\u00a0minutes.`} />;
  const lueEx = M.lecture(TEx, ex.prec);
  const mesuresEx = (
    <div style={{ marginTop: 8 }}>
      <LigneMesure nom="Nature de l’échantillon" valeur={prEx.type === 'pur' ? 'corps pur' : 'mélange'} />
      <LigneMesure nom="Température lue" valeur={`${tLue(TEx, ex.prec)}${NB}°C (± ${nf(ex.prec)}${NB}°C)`} couleur={COL.orange} />
      <LigneMesure nom="Phase du chauffage" valeur={enEbullition ? 'ébullition en cours' : tEx > prEx.tFin - 1e-9 ? 'ébullition terminée' : 'montée en température'} />
      {tEx >= prEx.tFin - 1e-9 && <LigneMesure nom="Pente pendant l’ébullition" valeur={prEx.type === 'pur' ? 'nulle : palier' : `environ ${nf(M.arrondi(M.penteEbullition(prEx), 1), 1)}${NB}°C par minute`} />}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '8px 0 4px' }}>Compatible avec la température d’ébullition de… (écart inférieur à la précision)</div>
      <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', fontSize: 14.5 }} data-compat="1">
        <tbody>{M.LIQUIDES.map(id => { const e = M.ecart(lueEx, M.CORPS[id].Tvap), ok = M.compatible(lueEx, M.CORPS[id].Tvap, ex.prec);
          return <tr key={id}><td style={{ padding: '4px 8px', border: `1px solid ${KIT.bord}`, fontWeight: 700 }}>{M.CORPS[id].nom} ({M.temp(M.CORPS[id].Tvap)})</td>
            <td style={{ padding: '4px 8px', border: `1px solid ${KIT.bord}` }}>écart {nf(M.arrondi(e, 1), 1)}{NB}°C<br /><strong style={{ color: ok ? COL.vert : COL.gris }}>{ok ? 'compatible' : 'non compatible'}</strong></td></tr>; })}</tbody>
      </table>
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Chauffez un corps pur (acétone, éthanol, cyclohexane, eau) : quelle est la température du palier ? Retrouvez-vous le tableau de référence ?</li>
      <li>Chauffez le mélange eau + éthanol : la température reste-t-elle constante pendant l’ébullition ? Augmentez la part d’éthanol : que devient la température du début d’ébullition ?</li>
      <li>Chauffez l’eau salée : à quelle température commence l’ébullition ? Quel écart avec l’eau pure ? Est-ce plus grand que la précision du thermomètre ?</li>
      <li>Prenez l’éthanol et le cyclohexane, deux liquides aux températures d’ébullition voisines (78&nbsp;°C et 81&nbsp;°C). Avec quelle précision peut-on encore les distinguer ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>corps pur : une seule espèce chimique ; mélange : au moins deux (homogène ou hétérogène)</li>
        <li>corps pur : palier à température constante, égale à la valeur de référence</li>
        <li>mélange : pas de palier net, ou température différente de la référence</li>
        <li>valeur lue compatible avec la référence si l’écart est inférieur à la précision</li>
        <li>on identifie un liquide pur en gardant les références compatibles</li>
      </ul>
    </ARetenir>);
  const discuter = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li><strong>L’huile de cuisine</strong> paraît n’être qu’un seul liquide, mais elle contient de nombreuses espèces chimiques : c’est un mélange homogène, pas un corps pur.</li>
      <li><strong>Le lait</strong> paraît homogène à l’œil nu ; en regardant au microscope, on voit de petites gouttes de matière grasse dans l’eau : c’est un mélange hétérogène. Le classement dépend donc de l’échelle d’observation.</li>
      <li><strong>Un bijou en or 18 carats</strong> est un alliage : de l’or mélangé à d’autres métaux. Il n’est pas fait d’or pur.</li>
    </ul>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .cp-l1.cote .cp-carte { order: 2; } .cp-l1.cote .cp-main { order: 1; } }
        @media (max-width: 900px) { .cp-l1.cote { grid-template-columns: minmax(0, 1fr); } .cp-l1.cote .cp-main { order: 1; } .cp-l1.cote .cp-carte { order: 2; } .cp-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .cp-in { animation: cp-fondu 0.35s ease-out; } @keyframes cp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Corps pur ou mélange : température de changement d’état</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>corps pur</strong> change d’état à une température bien déterminée ; un <strong>mélange</strong> se comporte autrement. En chauffant un liquide et en lisant sa température, on peut <strong>distinguer</strong> un corps pur d’un mélange et <strong>identifier</strong> un liquide.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {reglagesEx}{scEx}{mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="À discuter (au-delà du parcours)" ouvert={!!ex.ouv.discuter} onBascule={() => ouvrir('discuter')}>{discuter}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`cp-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="cp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="cp-carte cp-hypo-defi">{panneauHypo}</div> : null}
          <div className="cp-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'pur' ? suiviP : suiviL} /></div>}
            {enDefi && defi && <div className="cp-in" key={`${defi.type}${defi.id}${defi.p ?? ''}${defi.lue ?? ''}${defi.prec ?? ''}`}>{sceneDefi}</div>}
            {enGuide && <div className="cp-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
