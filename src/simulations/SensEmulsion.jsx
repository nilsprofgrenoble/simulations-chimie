import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./sensEmulsionModele";
import { QCM } from "./sensEmulsionQcm";
import { SvgCoupe, SvgDeuxEchantillons, SvgMicroMacro, SvgDilution, SvgConductimetre, SvgViscoCourbe, SvgCarteDilution, SvgCarteColorants, SvgCarteConduct, SvgCarteRegle, SvgCarteTests, SvgCarteMicro } from "./SensEmulsionSchemas";
const lectureConduct = M.lectureConduct;

const SIM_ID = 221, CLE_GUIDE = 'sens-emulsion-guide-v1';
declarerDefis(SIM_ID, [['sens', 'Reconnaître le sens d’une émulsion d’après des résultats de tests'], ['epaissir', 'Épaissir une émulsion : quelle phase ajouter et quel volume']]);

// ====================================================
//  SIM 221 — SENS DE L'ÉMULSION (BTS MDC, Formulation › Tensioactifs et émulsions)
//  Deux idées reliées : (1) la phase CONTINUE se reconnaît par trois tests (dilution, colorants, conductimétrie) ; (2) la viscosité d'une émulsion
//  augmente avec la fraction de phase DISPERSÉE : pour épaissir, on ajoute la phase dispersée (contre-intuitif), pour diluer on ajoute la phase continue.
//  Capacités visées (jamais affichées à l'élève) : déterminer le sens d'une émulsion (conductimétrie, dilution, colorants) ; relier la formulation et le comportement de l'émulsion.
//  Hors référentiel (annoncé) : inversion de phase, modèle de Krieger–Dougherty.
//  Modèle : sensEmulsionModele.js. Schémas et animations : SensEmulsionSchemas.jsx.
// ====================================================

const COL = { bleu: '#1d4ed8', rouge: '#b91c1c', vert: '#15803d', violet: '#7c3aed', orange: '#b45309' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const pc = p => `${fr(p * 100, 0)} %`;
const fmtEta = (eta, hors) => `${hors ? '> ' : ''}${eta >= 1 ? `${fr(eta, 1)} Pa·s` : `${fr(eta * 1000, 0)} mPa·s`}`;
const x0 = x => ({ cmmol: x.cmmol, colorant: x.colorant });
const MAYO = M.etatInitial('H/E', 200, 110), CREME = M.etatInitial('E/H', 200, 60);
const DEPART = { 'ep-1': MAYO, 'ep-2': MAYO, 'ep-micro': M.etatInitial('H/E', 240, 150), 'ep-EH': CREME, 'ep-calcul': CREME };
const PAS = 20;
const nomPhase = p => (p === 'eau' ? 'l’eau' : 'l’huile');

function expliqueSens(d) {
  const L = [];
  if (d.tests.dilution) L.push(d.type === 'H/E' ? 'Dilution : la goutte se disperse dans l’eau, donc la phase continue est l’eau (H/E).' : 'Dilution : la goutte se disperse dans l’huile, donc la phase continue est l’huile (E/H).');
  if (d.tests.colorants === 'micro') L.push(d.type === 'H/E' ? 'Colorants : avec le rouge Soudan, les gouttes sont rouges ; avec le bleu de méthylène, le fond est bleu. Les deux disent que l’eau est continue.' : 'Colorants : avec le rouge Soudan, le fond est rouge ; avec le bleu de méthylène, les gouttes sont bleues. Les deux disent que l’huile est continue.');
  else L.push('Colorants : sans microscope, on ne peut pas lire la coloration (les gouttes sont trop petites) : ce test ne permet pas de conclure.');
  const v = M.verdictConductivite(d.sigma);
  L.push(v === 'H/E' ? `Conductimétrie : ${lectureConduct(d.sigma)} est une valeur forte : phase aqueuse continue (H/E).`
    : v === 'E/H' ? `Conductimétrie : ${lectureConduct(d.sigma)} est inférieure à 1 µS/cm : l’huile isolante est continue (E/H).`
    : `Conductimétrie : ${lectureConduct(d.sigma)} est faible, mais une phase aqueuse sans sel conduit aussi très peu : on ne peut pas conclure.`);
  return L.join(' ');
}

export function SimulationSensEmulsion() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [em, setEm] = useState(MAYO);                       // émulsion du parcours
  const [ex, setEx] = useState({ ...MAYO, cmmol: 10, colorant: 'aucun' });   // émulsion de l'exploration
  const [ouv, setOuv] = useState({});
  const [suiviS, noterS] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('sens');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const etaEm = M.viscosite(em.type, M.phi(em));
  const boutonsAjout = (e, set, restaurer) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {['huile', 'eau'].map(ph => <button key={ph} onClick={() => set(x => (x.V + PAS <= 400 ? M.ajouter(x, ph, PAS) : x))} style={stylePetitBouton(true, ph === 'huile' ? '#b45309' : '#2563eb')}>+ {PAS} mL {ph === 'huile' ? 'd’huile' : 'd’eau'}</button>)}
      <button onClick={restaurer} style={stylePetitBouton(false)}><Pic n="refresh"/>Remettre au départ</button>
    </div>);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'sens', titre: 'H/E ou E/H : qui entoure qui ?', focus: ['scene'],
      texte: <>Une émulsion est un liquide dispersé en gouttelettes dans un autre liquide non miscible. La phase en gouttes est la <strong>phase dispersée</strong> ; celle qui les entoure est la <strong>phase continue</strong>. On écrit <strong>H/E</strong> pour de l’huile dispersée dans de l’eau, et <strong>E/H</strong> pour de l’eau dispersée dans de l’huile. Les deux coupes ci-dessous sont vues au microscope (jaune : huile, bleu pâle : eau ; ces couleurs sont conventionnelles). <strong>À l’œil nu</strong>, une crème H/E et une crème E/H ont le même aspect : il faut un test pour les distinguer.</>,
      tache: { type: 'qcm', q: 'Dans une émulsion notée E/H, quelle est la phase continue ?', ...QCM.sensDef,
        expl: 'E/H se lit « eau dans huile » : l’eau forme les gouttes (phase dispersée) et l’huile les entoure (phase continue). Le sens se lit sur la phase continue : c’est elle qui détermine presque tout le comportement de l’émulsion.', indice: 'Dans « A dans B », A est dispersée en gouttes et B est la phase qui entoure.' } },
    { id: 'dil-1', titre: 'Déterminer le sens de l’émulsion par le test de dilution : émulsion n°1', focus: ['scene'],
      texte: <>Le <strong>test de dilution</strong> est le plus simple : on dépose avec une spatule une goutte d’émulsion dans de l’eau, une autre dans de l’huile, sans agiter, et on observe. Voici l’émulsion n°1 (l’animation se répète : regardez ce que devient la goutte).</>,
      tache: { type: 'qcm', q: 'Une goutte de l’émulsion n°1 se disperse dans l’eau et reste en bloc dans l’huile. Que peut-on dire de cette émulsion ?', ...QCM.dil1,
        expl: 'La goutte se mélange au liquide miscible avec sa phase continue : ici l’eau. La phase continue de l’émulsion n°1 est donc l’eau : c’est une émulsion H/E (huile dans eau). Les gouttes d’huile se retrouvent simplement plus écartées.', indice: 'Un liquide se mélange avec ce qui lui est miscible : avec quelle phase de l’émulsion l’eau est-elle miscible ?' } },
    { id: 'dil-2', titre: 'Déterminer le sens de l’émulsion par le test de dilution : émulsion n°2', focus: ['scene'],
      texte: <>Voici maintenant l’émulsion n°2, avec le même protocole : une goutte dans l’eau, une goutte dans l’huile.</>,
      tache: { type: 'qcm', q: 'Pourquoi la goutte de l’émulsion n°2 se disperse-t-elle dans l’huile ?', ...QCM.dil2,
        expl: 'La goutte reste en bloc dans l’eau et se disperse dans l’huile : l’huile est miscible avec la phase continue, donc l’émulsion n°2 est E/H. L’huile ajoutée se mélange à l’huile qui entoure les gouttes d’eau, qui se retrouvent plus espacées.', indice: 'La goutte se disperse dans le liquide miscible avec sa phase continue.' } },
    { id: 'cond-1', titre: 'Conductimétrie : par où passent les ions ?', focus: ['scene'],
      retenirTitre: 'À retenir : le test de dilution', retenir: <>
        <SvgCarteDilution/>
        <ul style={puces}>
          <li>Une émulsion <strong>se dilue dans sa phase continue</strong> : la goutte se disperse dans le liquide miscible avec cette phase, et reste en bloc dans l’autre.</li>
          <li>Moyen de s’en souvenir : <strong>« elle se mélange avec ce qui l’entoure »</strong>.</li>
        </ul></>,
      texte: <>On plonge une sonde de conductimétrie dans une crème : l’appareil affiche <strong>1,4 mS/cm</strong>, soit <strong>1 400 µS/cm</strong> (1 mS = 1 000 µS). Le courant n’est transporté que par des <strong>ions</strong> qui se déplacent d’une électrode à l’autre. L’agrandissement montre quelques ions (+ et −) de la crème.</>,
      tache: { type: 'qcm', q: 'Dans cette crème, par où les ions peuvent-ils passer d’une électrode à l’autre ?', ...QCM.cond1,
        expl: 'Les ions sont dissous dans l’eau : ils circulent dans la phase aqueuse, qui relie ici les deux électrodes. La phase continue est l’eau : la crème est H/E. Si l’huile (isolante) était continue, elle séparerait les gouttes d’eau et le courant ne passerait presque pas.', indice: 'Les ions sont dissous dans l’eau, pas dans l’huile. Quelle phase relie les électrodes ?' } },
    { id: 'cond-2', titre: 'Conductimétrie : quand elle ne conclut pas', focus: ['scene'],
      texte: <>On prépare une crème avec de l’eau déminéralisée et un tensioactif non ionique (donc très peu d’ions). La conductivité mesurée est de <strong>4 µS/cm</strong>.</>,
      tache: { type: 'qcm', q: 'Peut-on en conclure que la crème est E/H ?', ...QCM.cond2,
        expl: 'Une phase aqueuse presque sans ions conduit très mal elle aussi : 4 µS/cm est possible pour une H/E faite avec de l’eau déminéralisée. Une valeur très faible ne prouve donc pas que l’huile est continue ; en revanche, une valeur forte prouve que l’eau est continue.', indice: 'Pour qu’une phase aqueuse conduise, il lui faut des ions : en a-t-elle ici ?' } },
    { id: 'col-1', titre: 'Test de coloration : le rouge Soudan', focus: ['scene'],
      retenirTitre: 'À retenir : la conductimétrie', retenir: <>
        <SvgCarteConduct/>
        <ul style={puces}>
          <li>Phase continue <strong>aqueuse et salée</strong> (H/E) : au-dessus de 100 µS/cm, souvent de l’ordre du mS/cm. Phase continue <strong>huileuse</strong> (E/H) : moins de 1 µS/cm.</li>
          <li>Une H/E faite avec de l’eau <strong>peu ionisée</strong> a une conductivité faible : la mesure ne conclut pas.</li>
          <li>Moyen de s’en souvenir : <strong>« conducteur, donc eau continue ; isolant, doute possible »</strong>.</li>
        </ul></>,
      texte: <>Le <strong>rouge Soudan</strong> (RS) est liposoluble : il colore l’huile, pas l’eau. On prélève un <strong>petit échantillon</strong> d’émulsion (qui est blanche), on y ajoute une pointe de rouge Soudan et on l’observe au microscope.</>,
      tache: { type: 'qcm', q: 'On voit des gouttelettes rouges dans un fond blanc (non coloré). Quelle est l’émulsion ?', ...QCM.col1,
        expl: 'Le rouge Soudan colore l’huile : les gouttes sont de l’huile, dispersée dans une phase aqueuse qui reste blanche. L’émulsion est H/E. Avec un colorant, on regarde ce qui est coloré : le fond (phase continue) ou les gouttes (phase dispersée).', indice: 'Le rouge Soudan colore uniquement l’huile : où est l’huile ici, en gouttes ou en fond ?' } },
    { id: 'col-2', titre: 'Test de coloration : le bleu de méthylène', focus: ['scene'],
      texte: <>Le <strong>bleu de méthylène</strong> (BM) est hydrosoluble : il colore l’eau, pas l’huile. On le teste sur <strong>un autre échantillon</strong> : chaque colorant a son propre prélèvement, on ne les mélange pas dans le même échantillon. Voici une autre émulsion, observée au microscope avec le bleu de méthylène.</>,
      tache: { type: 'qcm', q: 'On voit des gouttelettes bleues dans un fond blanc (non coloré). Quelle est l’émulsion ?', ...QCM.col2,
        expl: 'Le bleu de méthylène colore l’eau : les gouttes sont de l’eau, dispersée dans une phase huileuse qui reste blanche. L’émulsion est E/H. Attention : avec le bleu, des gouttes colorées signifient E/H, alors qu’avec le rouge Soudan elles signifient H/E.', indice: 'Le bleu de méthylène colore uniquement l’eau : où est l’eau ici, en gouttes ou en fond ?' } },
    { id: 'col-3', titre: 'Deux colorations d’une même émulsion', focus: ['scene'],
      retenirTitre: 'À retenir : les colorants', retenir: <>
        <SvgCarteColorants/>
        <ul style={puces}>
          <li>Le <strong>rouge Soudan</strong> colore l’huile, le <strong>bleu de méthylène</strong> colore l’eau. Chacun se teste dans <strong>son propre échantillon</strong> : on ne les mélange pas.</li>
          <li>Au microscope, un fond coloré est la phase continue ; des gouttes colorées sont la phase dispersée. L’émulsion elle-même est blanche : la phase non colorée reste blanche.</li>
          <li>Moyen de s’en souvenir : <strong>« la couleur du fond, c’est la phase continue »</strong>.</li>
        </ul></>,
      texte: <>Les deux colorations donnent des résultats qui doivent <strong>concorder</strong>. On teste une même émulsion avec chaque colorant, sur deux échantillons séparés. Échantillon 1 (rouge Soudan) : un fond rouge et des gouttes blanches. Échantillon 2 (bleu de méthylène) : des gouttes bleues dans un fond blanc.</>,
      tache: { type: 'qcm', q: 'Que peut-on conclure sur cette émulsion ?', ...QCM.col3,
        expl: 'Fond rouge avec le rouge Soudan : l’huile est continue. Gouttes bleues avec le bleu de méthylène : l’eau est dispersée. Les deux tests disent E/H : ils concordent, ce qui renforce la conclusion. Chaque test fonctionne seul ; le test de dilution reste souvent le plus discriminant.', indice: 'Lisez chaque échantillon avec la règle de son colorant : rouge = huile, bleu = eau, puis cherchez la phase continue.' } },
    { id: 'ep-1', titre: 'Comment épaissir une mayonnaise ?', focus: ['scene'],
      retenirTitre: 'À retenir : trois tests', retenir: <>
        <SvgCarteTests/>
        <ul style={puces}>
          <li>Le test de dilution est souvent le plus fiable : il ne dépend que de la <strong>phase continue</strong>, se fait à l’œil nu et ne demande ni colorant ni sel.</li>
          <li>Les colorants se partagent un peu entre les phases ou se fixent sur le tensioactif ; leur lecture demande un microscope. La conductimétrie ne conclut pas pour une phase aqueuse sans sel.</li>
          <li>Limites de la dilution : émulsion multiple (E/H/E), crème très épaisse ou gélifiée. On croise alors deux tests.</li>
        </ul></>,
      texte: <>Passons à l’épaississement. Une mayonnaise est une émulsion <strong>H/E</strong> : de l’huile en gouttes dans une phase aqueuse (jaune d’œuf, vinaigre, eau). Voici une préparation légère : <strong>200 mL</strong> dont <strong>110 mL d’huile</strong>. La bille tombe assez vite : elle est trop liquide. On veut l’épaissir en ajoutant <em>un seul ingrédient</em>.</>,
      tache: { type: 'qcm', q: 'Pour épaissir cette mayonnaise H/E, il faut ajouter…', ...QCM.epPred,
        expl: 'De l’huile ! C’est contre-intuitif : on pense « épaissir = retirer de l’eau ». Mais l’épaisseur d’une émulsion vient surtout de la fraction de gouttes (phase dispersée). Ajouter de l’huile, qui est ici dispersée, serre les gouttes et épaissit. Ajouter de l’eau, la phase continue, dilue.', indice: 'Dans une H/E, quelle phase est dispersée en gouttes, et laquelle est continue ?' } },
    { id: 'ep-2', titre: 'À vous : ajoutez une phase', focus: ['scene', 'boutons'],
      texte: <>Vérifiez par l’expérience : ajoutez de l’huile ou de l’eau, <strong>{PAS} mL</strong> à la fois, et regardez les gouttes et la bille. La bille tombe d’autant plus lentement que l’émulsion est <strong>visqueuse</strong>. Objectif : faire dépasser <strong>0,15 Pa·s</strong> à la viscosité (voir le panneau Données).</>,
      tache: { type: 'action', ok: etaEm >= 0.15 && em.type === 'H/E', consigne: 'Faites dépasser 0,15 Pa·s à la viscosité de la mayonnaise' } },
    { id: 'ep-micro', titre: 'Pourquoi ? Regardez les gouttes', focus: ['scene'],
      texte: <>Voici la même mayonnaise, avec 150 mL d’huile dans 240 mL : les gouttes sont plus nombreuses dans le même volume. La bille tombe plus lentement que dans la préparation de départ.</>,
      tache: { type: 'qcm', q: 'Quand on ajoute de la phase dispersée, que se passe-t-il au niveau des gouttes ?', ...QCM.epMicro,
        expl: 'Les gouttes se rapprochent et se serrent : il reste peu de phase continue entre elles, elle circule mal et l’émulsion s’écoule difficilement. La viscosité augmente de plus en plus vite quand la fraction approche 70 %.', indice: 'Comparez l’espace entre les gouttes à 55 % et à 62 % d’huile.' } },
    { id: 'ep-EH', titre: 'Une crème E/H trop fluide', focus: ['scene', 'boutons'],
      retenirTitre: 'À retenir : phase dispersée et viscosité', retenir: <>
        <SvgCarteMicro/>
        <ul style={puces}>
          <li>L’émulsion est d’autant plus <strong>épaisse</strong> que la fraction de phase dispersée est <strong>grande</strong> : les gouttes se serrent et la phase continue ne circule presque plus entre elles.</li>
          <li>Au-delà de 74 % (empilement compact de sphères identiques), les gouttes doivent se déformer : l’émulsion est très épaisse, mais fragile.</li>
          <li>Moyen de s’en souvenir : <strong>« plus de gouttes, plus épais »</strong>.</li>
        </ul></>,
      texte: <>Une crème cosmétique est une émulsion <strong>E/H</strong> : 200 mL dont <strong>60 mL d’eau</strong> (phase dispersée) dans de l’huile. Elle est trop fluide. Vous pouvez essayer les deux ajouts avec les boutons.</>,
      tache: { type: 'qcm', q: 'Pour épaissir cette crème E/H, il faut ajouter…', ...QCM.epEH,
        expl: 'De l’eau, qui est ici la phase dispersée : elle serre les gouttes d’eau. Même règle que pour la mayonnaise, avec les phases inversées : on épaissit en ajoutant la phase dispersée, et ce n’est ni toujours l’huile, ni toujours l’eau.', indice: 'Quelle est la phase dispersée d’une émulsion E/H ?' } },
    { id: 'ep-calcul', titre: 'Calculer la nouvelle fraction', focus: ['scene'],
      retenirTitre: 'À retenir : quelle phase ajouter ?', retenir: <>
        <SvgCarteRegle/>
        <ul style={puces}>
          <li>Pour <strong>épaissir</strong> : ajouter de la phase <strong>dispersée</strong> (H/E : de l’huile, comme pour une mayonnaise ; E/H : de l’eau, comme pour une crème cosmétique).</li>
          <li>Pour <strong>diluer</strong> : ajouter de la phase <strong>continue</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« dispersée : on épaissit ; continue : on dilue »</strong>.</li>
        </ul></>,
      texte: <>Reprenons la crème E/H : <strong>200 mL</strong> dont <strong>60 mL d’eau</strong>. On ajoute <strong>40 mL d’eau</strong>. La fraction volumique de phase dispersée est le volume de phase dispersée divisé par le volume total.</>,
      tache: { type: 'num', q: 'Nouvelle fraction volumique d’eau φ', unite: '%', vrai: 100 / 240 * 100, tol: 0.02, affiche: v => fr(v, 1), cs: 3,
        calcul: () => ['Les 40 mL ajoutés sont de l’eau, donc de la phase dispersée : V dispersée = 60 + 40 = 100 mL.', 'Le volume total augmente aussi : V total = 200 + 40 = 240 mL.', 'φ = frac(100|240) = 0,417, soit 41,7 %.'],
        pieges: [[50, 'Le volume total augmente aussi de 40 mL : le dénominateur est 240 mL, pas 200 mL.'], [25, 'Les 40 mL ajoutés sont de l’eau, donc de la phase dispersée : ils s’ajoutent aussi au numérateur (60 + 40 = 100 mL).']],
        expl: 'φ = frac(60 + 40|200 + 40) = frac(100|240) ≈ 0,417, soit environ 41,7 % : la crème est passée de 30 % à 42 % d’eau dispersée, donc elle est plus épaisse.', indice: 'φ = V de phase dispersée divisé par V total, après l’ajout (les deux volumes changent).' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : sens et épaississement', retenir: <>
        <ul style={puces}>
          <li>Le <strong>sens</strong> d’une émulsion est celui de sa phase continue : H/E (eau continue) ou E/H (huile continue).</li>
          <li><strong>Dilution</strong> : l’émulsion se mélange à sa phase continue (le test le plus fiable) ; <strong>colorants</strong> : le fond coloré est la phase continue ; <strong>conductimétrie</strong> : H/E au-dessus de 100 µS/cm, E/H sous 1 µS/cm.</li>
          <li>Pour <strong>épaissir</strong>, on ajoute la phase <strong>dispersée</strong> ; pour <strong>diluer</strong>, la phase <strong>continue</strong>.</li>
        </ul></>,
      texte: <>Vous savez reconnaître le sens d’une émulsion par trois tests, lire une coloration au microscope avec chacun des deux colorants et prévoir quelle phase ajouter pour épaissir ou diluer. En exploration, vous pouvez comparer H/E et E/H, régler la salinité et le colorant ; les défis proposent des résultats de tests à interpréter et un calcul de volume à ajouter.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1) && DEPART[IDS[ni]]) setEm(DEPART[IDS[ni]]);
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sceneGuide = {
    sens: () => <div className="se-deux"><SvgCoupe id="g1" type="H/E" phi={0.35} titre="H/E (huile dans eau)"/><SvgCoupe id="g2" type="E/H" phi={0.35} titre="E/H (eau dans huile)"/></div>,
    'dil-1': () => <SvgDilution type="H/E" nom="émulsion n°1"/>,
    'dil-2': () => <SvgDilution type="E/H" nom="émulsion n°2"/>,
    'cond-1': () => <SvgConductimetre type="H/E" phi={0.4} cmmol={10} forcerSigma={1400}/>,
    'cond-2': () => <SvgConductimetre type="H/E" phi={0.4} cmmol={0} forcerSigma={4} peu/>,
    'col-1': () => <SvgCoupe id="g3" type="H/E" phi={0.3} colorant="RS" titre="Au microscope : rouge Soudan"/>,
    'col-2': () => <SvgCoupe id="g4" type="E/H" phi={0.3} colorant="BM" titre="Au microscope : bleu de méthylène"/>,
    'col-3': () => <SvgDeuxEchantillons type="E/H"/>,
    'ep-1': () => <SvgMicroMacro type="H/E" phi={M.phi(em)}/>,
    'ep-2': () => <SvgMicroMacro type={em.type} phi={M.phi(em)}/>,
    'ep-micro': () => <SvgMicroMacro type={em.type} phi={M.phi(em)}/>,
    'ep-EH': () => <SvgMicroMacro type={em.type} phi={M.phi(em)}/>,
    'ep-calcul': () => <SvgMicroMacro type={em.type} phi={M.phi(em)}/>,
  }[idE]?.() ?? null;
  const ligneEm = (avecEta = true) => [['Volume total', `${fr(em.V, 0)} mL`], [`Volume ${M.phaseDispersee(em.type) === 'huile' ? 'd’huile' : 'd’eau'} (dispersée)`, `${fr(em.Vd, 0)} mL`], ...(avecEta ? [['Fraction dispersée φ', pc(M.phi(em))], ['Viscosité (ordre de grandeur)', fmtEta(etaEm, M.horsModele(M.phi(em)))]] : [['Fraction dispersée φ', pc(M.phi(em))]])];
  const MES = { 'ep-1': () => ligneEm(false), 'ep-2': () => ligneEm(), 'ep-micro': () => ligneEm(), 'ep-EH': () => ligneEm(), 'ep-calcul': () => [['Volume total', `${fr(em.V, 0)} mL`], ['Volume d’eau (dispersée)', `${fr(em.Vd, 0)} mL`], ['Eau ajoutée', '40 mL']] };
  const lignesGuide = enGuide ? (MES[idE]?.() ?? []) : [];
  const boutonsGuide = enGuide && (idE === 'ep-2' || idE === 'ep-EH') && (
    <div style={{ ...styleBoite, ...cadre('boutons') }}>
      <div style={{ fontSize: 14, color: KIT.txt2, fontWeight: 700, marginBottom: 6 }}>Ajouter à l’émulsion</div>
      {boutonsAjout(em, setEm, () => setEm(DEPART[idE]))}
    </div>);

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'sens' ? { kind, ...M.tirageSens(), rep: '', verifie: false } : { kind, ...M.tirageEpaissir(), rep: '', phaseRep: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'sens') { ok = defi.rep === defi.type; noterS(ok); }
    else { const x = lireNombre(defi.rep); ok = defi.phaseRep === defi.phase && isFinite(x) && Math.abs(x - defi.x) <= 0.03 * defi.x; noterE(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const resultatsSens = d => {
    const lignes = [];
    if (d.tests.dilution) lignes.push(['Dilution', `dans l’eau : ${M.sedisperse(d.type, 'eau') ? 'la goutte se disperse' : 'la goutte reste en bloc'} ; dans l’huile : ${M.sedisperse(d.type, 'huile') ? 'la goutte se disperse' : 'la goutte reste en bloc'}`]);
    lignes.push(['Colorants (un échantillon avec chaque colorant)', d.tests.colorants === 'micro' ? (() => { const a = M.coloration(d.type, 'RS'), b = M.coloration(d.type, 'BM'); const dec = c => `fond ${c.fond ?? 'blanc'}, gouttes ${c.gouttes ?? 'blanches'}`; return `au microscope, avec le rouge Soudan : ${dec(a)} ; avec le bleu de méthylène : ${dec(b)}`; })() : 'pas de microscope disponible : coloration illisible']);
    lignes.push(['Conductimétrie', `${lectureConduct(d.sigma)}${d.cmmol === 0 && d.type === 'H/E' ? ' (eau déminéralisée, tensioactif non ionique)' : ''}`]);
    return lignes;
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['sens', 'Sens d’après les tests'], ['epaissir', 'Épaissir : quelle phase, quel volume']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'sens' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : H/E ou E/H ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 6 }}>Un technicien a fait trois tests sur une crème. Voici ses résultats :</div>
        <div style={{ border: `1.5px solid ${KIT.bord}`, borderRadius: 12, background: 'white', marginBottom: 8 }}>
          {resultatsSens(defi).map(([n, v], k) => <div key={n} style={{ padding: '7px 10px', borderTop: k ? `1px dashed ${KIT.bord}` : 'none', fontSize: 14, lineHeight: 1.5 }}><strong>{n}</strong> : {v}</div>)}
        </div>
        <label htmlFor="se-sens" style={libelle}>Sens de l’émulsion</label>
        <select id="se-sens" value={defi.rep} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))} style={{ ...selectStyle, maxWidth: 260, border: `1.5px solid ${defi.verifie ? (defi.rep === defi.type ? '#15803d' : '#dc2626') : KIT.bord}` }}>
          <option value="">Choisir…</option>{M.TYPES.map(t => <option key={t} value={t}>{M.nomType(t)}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Cherchez le test qui conclut à coup sûr : la dilution (le liquide qui disperse la goutte est miscible avec la phase continue). Une conductivité faible ne prouve rien si la phase aqueuse est sans sel ; sans microscope, une coloration ne se lit pas.</IndiceDefi></div>
      </>}
      {defi.kind === 'epaissir' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : épaissir une émulsion</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une émulsion <strong>{defi.e.type}</strong> a un volume total de <strong>{fr(defi.e.V, 0)} mL</strong>, dont <strong>{fr(defi.e.Vd, 0)} mL de phase dispersée</strong>. On veut l’épaissir jusqu’à une fraction volumique de phase dispersée de <strong>{fr(defi.phiCible * 100, 0)} %</strong>, en ajoutant un seul liquide.</div>
        <label htmlFor="se-ph" style={libelle}>Phase à ajouter</label>
        <select id="se-ph" value={defi.phaseRep} onChange={ev => setDefi(d => ({ ...d, phaseRep: ev.target.value, verifie: false }))} style={{ ...selectStyle, maxWidth: 200 }}>
          <option value="">Choisir…</option><option value="eau">de l’eau</option><option value="huile">de l’huile</option></select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><span>Volume à ajouter :</span>
          <input value={defi.rep} aria-label="Volume à ajouter en millilitres" inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('se-verif')?.click()} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))}
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/><span>mL</span></div>
        <IndiceDefi cache={false}>On ajoute la phase <strong>dispersée</strong>. Si x est le volume ajouté, la fraction devient <FormuleEnLigne><mi>φ</mi><mo>=</mo><mfrac><mrow><msub><mi>V</mi><mi mathvariant="normal">d</mi></msub><mo>+</mo><mi>x</mi></mrow><mrow><mi>V</mi><mo>+</mo><mi>x</mi></mrow></mfrac></FormuleEnLigne>. Résolvez en x. Les deux volumes augmentent de x. Résultat à 3 % près.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="se-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'sens' && <>Réponse : {M.nomType(defi.type)}. {expliqueSens(defi)}</>}
        {defi.kind === 'epaissir' && <>Il faut ajouter de {nomPhase(defi.phase)}, la phase dispersée d’une émulsion {defi.e.type}. <FormuleEnLigne><mfrac><mrow><mn>{fr(defi.e.Vd, 0)}</mn><mo>+</mo><mi>x</mi></mrow><mrow><mn>{fr(defi.e.V, 0)}</mn><mo>+</mo><mi>x</mi></mrow></mfrac><mo>=</mo><mn>{fr(defi.phiCible, 2)}</mn></FormuleEnLigne>, donc <FormuleEnLigne><mi>x</mi><mo>=</mo><mfrac><mrow><mn>{fr(defi.phiCible, 2)}</mn><mo>×</mo><mn>{fr(defi.e.V, 0)}</mn><mo>−</mo><mn>{fr(defi.e.Vd, 0)}</mn></mrow><mrow><mn>1</mn><mo>−</mo><mn>{fr(defi.phiCible, 2)}</mn></mrow></mfrac></FormuleEnLigne> ≈ {fr(defi.x, 1)} mL.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Coupe schématique</strong> : jaune = huile et bleu pâle = eau sont des couleurs conventionnelles (en réalité l’émulsion est blanche à l’œil nu). Les gouttes de tailles voisines occupent des positions fixes : ajouter une phase les fait grossir ou les écarter, sans en changer le nombre. Dans une vraie préparation, l’agitation modifie aussi la taille et le nombre des gouttes. Les gouttes réelles mesurent quelques micromètres, et leur fraction d’aire sur une coupe est égale à leur fraction volumique.</li>
      <li><strong>Test de dilution</strong> : goutte déposée sans agiter ; il suppose une crème pas trop épaisse ni gélifiée, et ne convient pas aux émulsions multiples (E/H/E) sans croiser avec un autre test.</li>
      <li><strong>Colorants</strong> : le rouge Soudan (liposoluble) colore l’huile, le bleu de méthylène (hydrosoluble) colore l’eau. Dans la réalité, ils se partagent un peu entre les phases et peuvent se fixer sur le tensioactif : la lecture se fait au microscope sur le fond coloré, et il vaut mieux croiser avec la dilution.</li>
      <li><strong>Conductimétrie</strong> : ordres de grandeur. Phase aqueuse déminéralisée avec un peu de tensioactif ≈ 6 µS/cm, plus 126 µS/cm par mmol/L de chlorure de sodium. Pour une H/E, on prend σ = σ<sub>eau</sub> · 2(1 − φ)/(2 + φ) (sphères isolantes dans un milieu conducteur). Une E/H est donnée à moins de 1 µS/cm ; une E/H très riche en eau peut conduire par des canaux d’eau reliés (non modélisé).</li>
      <li><strong>Viscosité</strong> : η = η<sub>continue</sub> · (1 − φ/0,74)<sup>−1,85</sup> (modèle de Krieger–Dougherty, hors référentiel), avec 74 % pour l’empilement compact de sphères identiques, η<sub>continue</sub> = 5 mPa·s pour la phase aqueuse d’une sauce et 60 mPa·s pour l’huile. Valable pour des gouttes sphériques, sans floculation ni épaississant, jusqu’à φ ≈ 70 % ; il surestime souvent l’épaisseur des fortes fractions. Une vraie mayonnaise est un fluide à seuil, de viscosité variable avec la vitesse : les valeurs sont des ordres de grandeur. Le temps de chute de la bille est schématique (proportionnel à la viscosité).</li>
      <li><strong>Épaissir par la phase dispersée</strong> suppose assez de tensioactif pour couvrir les gouttes et un ajout progressif sous agitation. On peut aussi épaissir en gélifiant la phase continue ou en réduisant la taille des gouttes : ces leviers ne sont pas modélisés ici. Au-delà de 75 à 80 % de phase dispersée, l’émulsion devient instable (coalescence, inversion de phase : hors référentiel).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  // ---------- exploration ----------
  const phiX = M.phi(ex), etaX = M.viscosite(ex.type, phiX), sigX = M.conductivite(ex.type, phiX, ex.cmmol);
  const majEx = f => setEx(x => ({ ...x, ...f }));
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="se-type" style={libelle}>Sens de l’émulsion</label>
      <select id="se-type" value={ex.type} onChange={ev => setEx(ev.target.value === 'H/E' ? { ...x0(ex), ...MAYO } : { ...x0(ex), ...CREME })} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.TYPES.map(t => <option key={t} value={t}>{M.nomType(t)}{t === 'H/E' ? ' : mayonnaise légère' : ' : crème cosmétique'}</option>)}</select>
      <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Ajouter à l’émulsion</div>
      {boutonsAjout(ex, f => setEx(x => ({ ...x, ...f(x) })), () => setEx(x => ({ ...x, ...(x.type === 'H/E' ? MAYO : CREME) })))}
      <div style={{ fontSize: 13, color: KIT.txt2, margin: '4px 0 8px' }}>Ajouter la phase dispersée épaissit ; ajouter la phase continue dilue.</div>
      <Section titre={`Colorants : ${ex.colorant === 'aucun' ? 'aucun' : ex.colorant}`} ouvert={!!ouv.col} onBascule={() => bascule('col')}>
        <label htmlFor="se-col" style={libelle}>Colorant ajouté</label>
        <select id="se-col" value={ex.colorant} onChange={ev => majEx({ colorant: ev.target.value })} style={selectStyle}>
          <option value="aucun">aucun</option><option value="RS">rouge Soudan (RS)</option><option value="BM">bleu de méthylène (BM)</option></select>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>RS colore l’huile, BM colore l’eau. On les teste dans des échantillons séparés : choisissez-en un et regardez la coupe.</div>
      </Section>
      <Section titre={`Sel dans la phase aqueuse : ${fr(ex.cmmol, 0)} mmol/L`} ouvert={!!ouv.sel} onBascule={() => bascule('sel')}>
        <label htmlFor="se-sel" style={libelle}>Chlorure de sodium (mmol/L)</label>
        <input id="se-sel" type="range" min="0" max="50" step="1" value={ex.cmmol} onChange={ev => majEx({ cmmol: parseFloat(ev.target.value) })} aria-label="Concentration en chlorure de sodium en mmol/L" style={{ width: '100%', accentColor: '#7c3aed' }}/>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Sans sel, une H/E conduit très peu : la conductimétrie ne conclut plus. Sans effet sur une E/H.</div>
      </Section>
    </div>);
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Du pot à la coupe : le lien micro-macro</div>}
      {enGuide ? sceneGuide : <SvgMicroMacro type={ex.type} phi={phiX} colorant={ex.colorant}/>}
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 4 }}>{M.regimeGouttes(phiX)}.</div>}
    </div>);
  const mesures = (enExplore || (enGuide && lignesGuide.length > 0)) && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Données'}</div>
      {enGuide ? lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>) : <>
        <LigneMesure nom="Volume total" valeur={`${fr(ex.V, 0)} mL`}/>
        <LigneMesure nom={`Volume ${M.phaseDispersee(ex.type) === 'huile' ? 'd’huile' : 'd’eau'} (dispersée)`} valeur={`${fr(ex.Vd, 0)} mL`} couleur={COL.violet}/>
        <LigneMesure nom="Fraction dispersée φ" valeur={pc(phiX)} couleur={COL.violet}/>
        <LigneMesure nom="Viscosité (ordre de grandeur)" valeur={fmtEta(etaX, M.horsModele(phiX))}/>
        <LigneMesure nom="Conductivité" valeur={lectureConduct(sigX)} couleur={COL.bleu}/>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>La viscosité ne dépend pas du sens : elle dépend de la phase continue et de φ.</div>
      </>}
    </div>);
  const sectionDilution = enExplore && (
    <Section titre="Test de dilution" ouvert={!!ouv.dil} onBascule={() => bascule('dil')}>
      <SvgDilution type={ex.type}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>La goutte se disperse dans le liquide miscible avec la phase continue ({nomPhase(M.phaseContinue(ex.type))}). Le test ne dépend ni de φ ni du sel.</div>
    </Section>);
  const sectionConduct = enExplore && (
    <Section titre={`Conductimétrie : ${lectureConduct(sigX)}`} ouvert={!!ouv.cond} onBascule={() => bascule('cond')}>
      <SvgConductimetre type={ex.type} phi={phiX} cmmol={ex.cmmol} peu={ex.cmmol < 2}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.type === 'H/E' ? 'Les ions circulent dans la phase aqueuse continue.' : 'Les ions sont prisonniers des gouttes d’eau, isolées par l’huile : le courant ne passe pas.'}</div>
    </Section>);
  const sectionVisco = enExplore && (
    <Section titre="Viscosité selon la fraction dispersée" ouvert={!!ouv.vis} onBascule={() => bascule('vis')}>
      <SvgViscoCourbe phi={phiX}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>La viscosité relative est le rapport de la viscosité de l’émulsion à celle de sa phase continue seule : elle ne dépend que de φ dans ce modèle.</div>
    </Section>);
  const sectionInversion = enExplore && (
    <Section titre="Prolongement : et si on dépasse 75 % ? (hors référentiel)" ouvert={!!ouv.inv} onBascule={() => bascule('inv')}>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Au-delà de 74 %, des gouttes sphériques identiques ne peuvent plus se ranger : elles se déforment en polyèdres séparés par un film très mince (c’est le cas d’une mayonnaise ferme). En poursuivant, le film se rompt : les gouttes fusionnent (coalescence) ou l’émulsion s’<strong>inverse</strong>, la phase dispersée devenant continue (H/E → E/H). Le sens de l’émulsion dépend donc aussi de la quantité de chaque phase et du tensioactif choisi. Ce comportement n’est pas modélisé ici.</div>
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>Avec la mayonnaise H/E, ajoutez 40 mL d’huile, puis 40 mL d’eau : comparez la viscosité et la bille. Qu’en concluez-vous pour épaissir ?</li>
      <li>Passez à la crème E/H : quelle phase faut-il ajouter pour épaissir ? Est-ce la même que pour la mayonnaise ?</li>
      <li>Choisissez le rouge Soudan, puis le bleu de méthylène, pour la crème E/H puis pour la mayonnaise : quelle phase est colorée dans chaque cas ? Où se trouve le fond coloré ?</li>
      <li>Avec la mayonnaise, ramenez le sel à 0 mmol/L : que devient la conductivité ? Peut-on encore conclure ?</li>
      <li>Poussez φ au-delà de 70 % : que devient la coupe et que dit le modèle ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Le sens d’une émulsion est celui de sa phase continue : H/E (eau continue) ou E/H (huile continue)</li>
        <li>Dilution : une goutte se disperse dans le liquide miscible avec la phase continue (test le plus fiable)</li>
        <li>Colorants : rouge Soudan = huile, bleu de méthylène = eau ; le fond coloré est la phase continue</li>
        <li>Conductimétrie : H/E salée au-dessus de 100 µS/cm ; E/H sous 1 µS/cm ; une H/E sans sel ne conclut pas</li>
        <li>Pour épaissir : ajouter la phase dispersée ; pour diluer : ajouter la phase continue</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .se-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .se-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .se-col { display: flex; flex-direction: column; gap: 12px; }
        .se-deux { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
        @media (min-width: 560px) { .se-deux { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .se-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .se-l1.cote .se-carte { order: 2; } .se-l1.cote .se-main { order: 1; }
          .se-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .se-ex > * { grid-column: 1; }
          .se-ex > .se-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .se-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .se-in { animation: se-fondu 0.35s ease-out; } @keyframes se-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Sens de l’émulsion et épaississement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une émulsion est <strong>H/E</strong> (huile dans eau) ou <strong>E/H</strong> (eau dans huile) selon sa <strong>phase continue</strong>. On la reconnaît par la <strong>dilution</strong>, les <strong>colorants</strong> et la <strong>conductimétrie</strong>. Et pour l’<strong>épaissir</strong>, on ajoute… la phase dispersée.</div>
      {enGuide && <div className="se-l1 cote">
        <div className="se-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="se-main">
          <div className="se-col">
            {sceneGuide && <div className="se-in">{scene}</div>}
            {boutonsGuide && <div className="se-in">{boutonsGuide}</div>}
            {mesures && <div className="se-in">{mesures}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'sens' ? suiviS : suiviE}/></div>}
      {enExplore && <>
        <div className="se-ex">
          {scene}
          <div className="se-reg">{reglages}</div>
          {mesures}
        </div>
        {sectionDilution}
        {sectionConduct}
        {sectionVisco}
        {sectionInversion}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
