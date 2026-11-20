import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./oeilReduit2gtModele";
import { QCM } from "./oeilReduit2gtQcm";
import { C } from "./oeilReduit2gtCouleurs";
import { SceneOeilReel, SceneModele, SceneOeil, SceneThales, SceneDefiNette, FicheModele, FicheRayons, FicheThales, FicheFlou, FicheAccommodation } from "./OeilReduit2gtScenes";

const SIM_ID = 200, CLE_GUIDE = 'oeil-reduit-2gt-guide-v1';
declarerDefis(SIM_ID, [['image', 'Calculer la taille de l’image sur la rétine'], ['nette', 'Prévoir si l’image est nette et ce que fait le cristallin']]);

// ====================================================
//  SIM 200 — L'ŒIL RÉDUIT : UNE LENTILLE ET UN ÉCRAN (2GT spé PC, « Ondes et signaux », vision et image).
//  Prérequis : simulation 65 (lentille convergente : foyer, distance focale), 64 (réfraction). Suite : 1G 115 (lentille mince : OA, OA′, conjugaison), TSTL 117 (œil et loupe).
//  Une seule idée : l'œil se modélise par une lentille convergente et un écran (la rétine) ; l'image est réelle et renversée ; sa taille se trouve par Thalès ;
//  un objet proche donne une image floue si la distance focale ne change pas ; l'accommodation (le cristallin se bombe, f′ diminue) la rend nette.
//  Parcours (12 étapes) : parties de l'œil (1), œil réduit (1), rayon par O (1), rayons du bord de la pupille (1), image réelle et renversée (1), Thalès (1), distance double (1),
//  objet proche (1), accommodation (1, action), sens de f′ (1), image d'une bougie (1), bilan (1). Modèle : oeilReduit2gtModele.js (testé : rayons calculés).
//  Capacités visées (jamais affichées à l'élève) : modéliser l'œil ; produire et caractériser l'image réelle d'un objet plan réel formée par une lentille mince convergente ;
//  déterminer graphiquement position, taille et sens de l'image ; définir et déterminer géométriquement un grandissement ; utiliser le théorème de Thalès.
//  Hors parcours (exploration, balisé) : myopie et hypermétropie. Non traité : relation de conjugaison (1G), diamètre apparent et grossissement de la loupe (TSTL 117).
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB;
const nf = M.nombreFR;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const S = id => M.situation(id);
const FormuleThales = () => <Formule><mfrac><mrow><mi>A′B′</mi></mrow><mrow><mi>AB</mi></mrow></mfrac><mo>=</mo><mfrac><mrow><mi>OA′</mi></mrow><mrow><mi>OA</mi></mrow></mfrac></Formule>;

export function SimulationOeilReduit() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviN, noterN] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('image');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [ex, setEx] = useState({ sit: 'bougie25', f: M.F_REPOS, defaut: 'normal', ouv: {} });
  const [reg, setReg] = useState({ e: -1, f: M.F_REPOS });         // focale réglée à l'étape « accommodation » (revient à 17,0 mm à chaque arrivée sur l'étape)
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- données du parcours ----------
  const arbre50 = S('arbre50'), arbre100 = S('arbre100'), bougie25 = S('bougie25'), bougie40 = S('bougie40');
  const f25 = M.focaleNette(250), f40 = M.focaleNette(400);
  const IDS = ['parties', 'modele', 'centre', 'bords', 'image', 'thales', 'distance', 'proche', 'accommoder', 'bombe', 'bougie', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const fG = reg.e === etape ? reg.f : M.F_REPOS, setFG = v => setReg({ e: etape, f: v });
  const netteG = M.netteRetine(250, fG);
  const vuePleine = { centre: 'tout', haut: 'tout', bas: 'tout' };
  const ETAPES = [
    { id: 'parties', titre: 'Les parties de l’œil', focus: ['scene'],
      texte: <>L’œil est une petite sphère. La lumière entre par la <strong>cornée</strong>, une fenêtre transparente à l’avant. Elle passe ensuite par la <strong>pupille</strong>, le petit trou noir au centre, entouré de l’<strong>iris</strong> (la partie colorée de l’œil). Elle traverse enfin le <strong>cristallin</strong>, une sorte de lentille transparente. Au fond de l’œil, une couche sensible à la lumière reçoit l’image et l’envoie au cerveau. Regardez la coupe de l’œil.</>,
      tache: { type: 'qcm', ...QCM.parties } },
    { id: 'modele', titre: 'Un modèle simple : l’œil réduit', focus: ['scene'],
      texte: <>Un <strong>modèle</strong> est une version simplifiée de la réalité : on ne garde que l’essentiel. Pour étudier l’œil, on utilise l’<strong>œil réduit</strong> : un seul objet d’optique à l’avant, et un <strong>écran</strong> au fond, à 17{NB}mm derrière. L’écran joue le rôle de la couche du fond de l’œil. De la lentille à l’écran, il y a environ 17{NB}mm ; l’œil entier, de la cornée à la rétine, mesure environ 24{NB}mm.
        <ExempleResolu>La cornée et le cristallin sont en bleu sur l’œil réel ; la couche du fond est en brun. Dans l’œil réduit, la partie brune est l’<strong>écran</strong>.</ExempleResolu>
        À vous : la partie bleue de l’œil réduit.</>,
      tache: { type: 'qcm', ...QCM.modele } },
    { id: 'centre', titre: 'Un rayon qui passe par O', focus: ['scene'],
      texte: <>Un <strong>rayon</strong> représente le trajet de la lumière en ligne droite : c’est un trait fléché. Regardons un arbre très loin, à 50{NB}m. Le point <strong>B</strong> est le sommet de l’arbre et <strong>A</strong> son pied. Le point <strong>O</strong> est le centre de la lentille. Sur le schéma, la coupure // rappelle que l’arbre est beaucoup plus loin que dessiné : on ne voit que la fin du trajet du rayon. Règle à connaître : un rayon qui passe par O <strong>n’est pas dévié</strong>, il continue en ligne droite.
        <ExempleResolu>Un rayon qui part du pied A, sur l’axe, passe par O et continue tout droit sur l’axe : il arrive au centre de la rétine.</ExempleResolu>
        À vous : le rayon orange part du sommet B et arrive en O.</>,
      tache: { type: 'qcm', ...QCM.centre },
      retenirTitre: 'L’œil réduit : une lentille et un écran',
      retenir: <><FicheModele />
        <ul style={liste}>
          <li><strong>Phrase-clé : œil réduit = une lentille + un écran.</strong></li>
          <li><strong>Exemple</strong> : la cornée et le cristallin deviennent une lentille convergente ; la rétine devient un écran, à 17{NB}mm de la lentille.</li>
          <li><strong>Idée fausse</strong> : « l’œil réduit est un petit œil ». <strong>Vrai</strong> : c’est un modèle, qui garde seulement ce qui compte pour former l’image.</li>
        </ul>{renvoi}</> },
    { id: 'bords', titre: 'Les rayons du bord de la pupille', focus: ['scene'],
      texte: <>Du sommet B partent beaucoup de rayons. Seuls ceux qui passent par la pupille entrent dans l’œil. Voici deux rayons <strong style={{ color: C.bord }}>bleus</strong>, au bord de la pupille, un en haut et un en bas. Le rayon <strong style={{ color: C.centre }}>orange</strong> a continué tout droit jusqu’à la rétine. La lentille est <strong>convergente</strong>.
        <ExempleResolu>Un rayon qui arrive au-dessus de l’axe, parallèle à lui, ressort de la lentille convergente en se rapprochant de l’axe.</ExempleResolu>
        À vous : les rayons issus de B.</>,
      tache: { type: 'qcm', ...QCM.bords } },
    { id: 'image', titre: 'L’image de l’arbre', focus: ['scene'],
      texte: <>Les trois rayons se rejoignent au même point B′ de la rétine ; A′ est le point où se rejoignent les rayons issus de A. La flèche <strong style={{ color: C.img }}>verte</strong> A′B′ est l’<strong>image</strong> de l’arbre. Une image qui se forme sur un écran est une image <strong>réelle</strong> : on peut la recueillir sur cet écran, ici la rétine. Comparez le sens de la flèche verte à celui de la flèche noire AB.</>,
      tache: { type: 'qcm', ...QCM.image } },
    { id: 'thales', titre: 'La taille de l’image', focus: ['scene'],
      texte: <>Quelle est la hauteur A′B′ de l’image ? On peut la calculer : le rayon orange forme deux triangles de même forme, le grand (A, B, O) et le petit (A′, B′, O) ; l’un est une réduction de l’autre. La règle de <strong>Thalès</strong> relie leurs côtés. Ici OA′ est la distance de la lentille à la rétine, <strong>17{NB}mm</strong>. Les longueurs doivent être dans la <strong>même unité</strong> (1{NB}m = 1{NB}000{NB}mm).
        <FormuleThales />
        <ExempleResolu>Un poteau de 4,0{NB}m à 20{NB}m. On convertit : AB = 4{NB}000{NB}mm et OA = 20{NB}000{NB}mm. Alors A′B′ = 4{NB}000 × 17 ÷ 20{NB}000 = <strong>3,4{NB}mm</strong>.</ExempleResolu>
        À vous : l’arbre.</>,
      tache: { type: 'num', q: <>L’arbre mesure AB = 6,0{NB}m et se trouve à OA = 50{NB}m ; OA′ = 17{NB}mm. Quelle est la hauteur A′B′ de l’image sur la rétine ?</>, carnet: 'Hauteur de l’image de l’arbre', unite: 'mm', vrai: M.hauteurImage(6000, 50000), tol: 0.06, affiche: v => nf(M.arrondiSig(v, 2)), cs: 2,
        calcul: () => ['Conversion : AB = 6,0 m = 6 000 mm et OA = 50 m = 50 000 mm.', 'A′B′ = AB × OA′ ÷ OA = 6 000 × 17 ÷ 50 000 ≈ 2,0 mm (2 chiffres significatifs).'],
        pieges: [[2040, 'Les longueurs ne sont pas dans la même unité : 6,0 m = 6 000 mm, mais 50 m = 50 000 mm.'], [0.00204, 'Avec AB en mètres et OA en mm, le résultat est 1 000 fois trop petit : convertissez tout en mm.'], [6 * 50 / 17, 'On multiplie par OA′ et on divise par OA : l’image est plus petite que l’arbre.'], [17, 'C’est OA′, la distance lentille-rétine : ce n’est pas la hauteur de l’image.']],
        expl: 'A′B′ = AB × OA′ ÷ OA = 6 000 × 17 ÷ 50 000 ≈ 2,0 mm : l’image d’un arbre de 6,0 m mesure environ 2,0 mm sur la rétine.', indice: 'Convertissez AB et OA en millimètres, puis calculez AB × OA′ ÷ OA (OA′ = 17 mm).' },
      retenirTitre: 'Image réelle et renversée',
      retenir: <><FicheRayons />
        <ul style={liste}>
          <li><strong>Phrase-clé : par O, tout droit ; l’image est réelle et renversée.</strong></li>
          <li><strong>Exemple</strong> : l’arbre est à l’endroit, son image sur la rétine est la tête en bas ; le cerveau la remet à l’endroit.</li>
          <li><strong>Idée fausse</strong> : « on voit le monde à l’envers ». <strong>Vrai</strong> : l’image sur la rétine est renversée, mais on la voit à l’endroit.</li>
        </ul>{renvoi}</> },
    { id: 'distance', titre: 'Un arbre deux fois plus loin', focus: ['scene'],
      texte: <>Le même arbre est maintenant à <strong>100{NB}m</strong>, deux fois plus loin. Rappel : à 50{NB}m, l’image mesurait environ 2,0{NB}mm. Le rayon orange arrive plus à plat. Pensez à la règle de Thalès : AB et OA′ ne changent pas, OA double.</>,
      tache: { type: 'qcm', ...QCM.distance } },
    { id: 'proche', titre: 'Un objet proche', focus: ['scene'],
      texte: <>Regardons une bougie de 4,0{NB}cm à 25{NB}cm de l’œil, avec le cristallin <strong>au repos</strong>. Sa distance focale f′ (la distance de O au foyer F′, vue dans la simulation « Lentille convergente ») vaut alors 17,0{NB}mm : <strong>F′ est sur la rétine</strong>. Pour un objet très loin, les rayons arrivent presque parallèles et se coupent en F′ : l’image est nette. Ici l’objet est tout près. Regardez où les rayons se rejoignent par rapport à la rétine.</>,
      tache: { type: 'qcm', ...QCM.proche },
      retenirTitre: 'Taille de l’image : la règle de Thalès',
      retenir: <><FicheThales /><FormuleThales />
        <ul style={liste}>
          <li><strong>Grandissement</strong> = A′B′ ÷ AB = OA′ ÷ OA : ici il est plus petit que 1, l’image est plus petite que l’objet.</li>
          <li><strong>Phrase-clé : deux fois plus loin, une image deux fois plus petite.</strong> Les longueurs sont dans la même unité.</li>
          <li><strong>Exemple</strong> : un poteau de 4,0{NB}m à 20{NB}m donne une image de 3,4{NB}mm sur la rétine.</li>
        </ul>{renvoi}</> },
    { id: 'accommoder', titre: 'Rendre l’image nette', focus: ['scene', 'reglage'],
      texte: <>Le cristallin peut changer de forme : en se bombant, il change sa distance focale f′. Cette capacité s’appelle l’<strong>accommodation</strong>. Un curseur règle f′ ; la rétine, elle, reste à 17{NB}mm. Regardez ce que deviennent les rayons quand vous bougez le curseur.</>,
      tache: { type: 'action', ok: enGuide && idE === 'accommoder' && netteG, label: `Rétablir f′ = ${nf(M.F_REPOS, 1)}${NB}mm`, faire: () => setFG(M.F_REPOS), consigne: 'Réglez f′ pour que l’image de la bougie soit nette sur la rétine (une flèche verte à la place de la tache rouge).' } },
    { id: 'bombe', titre: 'Le cristallin et la distance de l’objet', focus: ['scene'],
      texte: <>Le cristallin est plus ou moins bombé. Une lentille très bombée dévie fort les rayons : elle a une distance focale <strong>courte</strong> ; une lentille peu bombée a une distance focale longue. Tout à l’heure, la bougie était à 25{NB}cm. Ici elle est à <strong>40{NB}cm</strong> et l’image est nette : f′ vaut {nf(M.arrondiSig(f40, 3), 1)}{NB}mm. Que doit faire le cristallin si la bougie se rapproche à 25{NB}cm ?</>,
      tache: { type: 'qcm', ...QCM.bombe },
      retenirTitre: 'Loin ou près : net ou flou',
      retenir: <><FicheFlou />
        <ul style={liste}>
          <li><strong>Phrase-clé : au repos, loin = net, près = flou.</strong> Près, les rayons se rejoignent derrière la rétine.</li>
          <li><strong>Exemple</strong> : la bougie à 25{NB}cm est floue tant que f′ reste à 17,0{NB}mm.</li>
          <li><strong>Idée fausse</strong> : « de près, c’est flou parce que l’image est trop petite ». <strong>Vrai</strong> : elle est floue parce qu’elle se forme derrière la rétine.</li>
        </ul>{renvoi}</> },
    { id: 'bougie', titre: 'L’image d’une bougie vue de près', focus: ['scene'],
      texte: <>L’œil accommode : l’image de la bougie est nette sur la rétine, donc OA′ = 17{NB}mm, comme pour l’arbre. La bougie mesure AB = 40{NB}mm et se trouve à OA = 250{NB}mm de la lentille. Cette fois, les longueurs sont déjà en millimètres.
        <ExempleResolu>Une flamme de 30{NB}mm à 300{NB}mm : A′B′ = 30 × 17 ÷ 300 = <strong>1,7{NB}mm</strong>.</ExempleResolu>
        À vous : la bougie.</>,
      tache: { type: 'num', q: <>La bougie mesure AB = 40{NB}mm, à OA = 250{NB}mm ; OA′ = 17{NB}mm. Quelle est la hauteur A′B′ de l’image sur la rétine ?</>, carnet: 'Hauteur de l’image de la bougie', unite: 'mm', vrai: M.hauteurImage(40, 250), tol: 0.06, affiche: v => nf(M.arrondiSig(v, 2)), cs: 2,
        calcul: () => ['Les longueurs sont déjà en millimètres : AB = 40 mm, OA = 250 mm, OA′ = 17 mm.', 'A′B′ = AB × OA′ ÷ OA = 40 × 17 ÷ 250 ≈ 2,7 mm (2 chiffres significatifs).'],
        pieges: [[40 * 17 / 25, 'OA est en centimètres dans votre calcul : 25 cm = 250 mm. Gardez les millimètres partout.'], [40 * 250 / 17, 'On multiplie par OA′ et on divise par OA : l’image est plus petite que la bougie.'], [40 + 17, 'On ne les additionne pas : on utilise la règle de Thalès.'], [17, 'C’est OA′, la distance lentille-rétine : ce n’est pas la hauteur de l’image.']],
        expl: 'A′B′ = AB × OA′ ÷ OA = 40 × 17 ÷ 250 ≈ 2,7 mm : l’image est plus petite que la bougie (40 mm) et renversée.', indice: 'A′B′ = AB × OA′ ÷ OA, avec AB = 40 mm, OA′ = 17 mm et OA = 250 mm.' },
      retenirTitre: 'L’accommodation',
      retenir: <><FicheAccommodation />
        <ul style={liste}>
          <li><strong>Phrase-clé : plus c’est près, plus le cristallin se bombe, plus f′ diminue.</strong></li>
          <li><strong>Exemple</strong> : f′ = 17,0{NB}mm au repos ; environ 15,9{NB}mm pour un objet à 25{NB}cm. La rétine reste à 17{NB}mm.</li>
        </ul>{renvoi}</> },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>L’œil se modélise par une <strong>lentille convergente</strong> et un <strong>écran</strong>, la rétine, à 17{NB}mm. L’image est <strong>réelle</strong> et <strong>renversée</strong> ; sa hauteur se calcule avec Thalès : A′B′ = AB × OA′ ÷ OA. Un objet proche donne une image floue si f′ ne change pas ; en <strong>accommodant</strong>, le cristallin se bombe et f′ diminue. Vous pouvez maintenant explorer (avec, en plus, la myopie et l’hypermétropie) ou relever un défi.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'image') setDefi({ type, ...M.tirerDefiImage(prec && prec.type === 'image' ? prec : null), rep: '', verifie: false });
    else setDefi({ type, s: M.tirerSituationNette(prec && prec.type === 'nette' ? prec.s : null), nette: '', action: '', verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    if (defi.type === 'image') {
      const x = lireNombre(defi.rep), ok = M.reponseJusteImage(defi, x);
      setDefi(d => ({ ...d, verifie: true, ok, x })); noterI(ok);
    } else {
      const v = M.verifierSituationNette(defi.s, { nette: defi.nette, action: defi.action }), ok = v.netteOk && v.actionOk;
      setDefi(d => ({ ...d, verifie: true, ok, v })); noterN(ok);
    }
  };
  const messageImage = d => {
    const bon = d.variante === 'image' ? `${nf(M.arrondiSig(d.vrai, 2))}${NB}mm` : `${nf(M.arrondiSig(d.vrai, 2))}${NB}m`;
    if (d.ok) return d.variante === 'image'
      ? `✓ Correct : A′B′ = AB × OA′ ÷ OA = ${nf(d.AB * 1000)} × 17 ÷ ${nf(d.D * 1000)} ≈ ${bon}.`
      : `✓ Correct : AB = A′B′ × OA ÷ OA′ = ${nf(d.Ap)} × ${nf(d.D * 1000)} ÷ 17 ≈ ${nf(M.arrondiSig(d.vrai * 1000, 2))}${NB}mm, soit environ ${bon}.`;
    const x = d.x;
    if (!isFinite(x)) return '✗ Entrez un nombre (avec la virgule ou le point).';
    if (d.variante === 'image') {
      if (Math.abs(x - d.vrai * 1000) <= 0.06 * d.vrai * 1000) return '✗ Il y a un facteur 1 000 : AB et OA doivent être dans la même unité (tout en mm, ou tout en m), et OA′ = 17 mm.';
      if (Math.abs(x - d.vrai / 1000) <= 0.06 * d.vrai / 1000) return '✗ Il y a un facteur 1 000 : vérifiez que AB et OA sont dans la même unité.';
      if (Math.abs(x - 17) <= 0.06 * 17) return '✗ 17 mm est la distance OA′ de la lentille à la rétine, pas la hauteur de l’image.';
      return '✗ Pas encore. Calculez A′B′ = AB × OA′ ÷ OA : AB et OA dans la même unité, OA′ = 17 mm. L’image est bien plus petite que l’objet.';
    }
    if (Math.abs(x - d.Ap) <= 0.06 * d.Ap) return '✗ Vous avez recopié A′B′ : c’est la hauteur de l’image. On cherche la hauteur de l’objet, bien plus grande.';
    if (Math.abs(x - d.vrai * 1000) <= 0.06 * d.vrai * 1000 || Math.abs(x - d.vrai / 1000) <= 0.06 * d.vrai / 1000) return '✗ Il y a un facteur 1 000 : convertissez bien les mètres et les millimètres.';
    return '✗ Pas encore. AB = A′B′ × OA ÷ OA′ : l’objet est bien plus grand que son image. Gardez la même unité pour OA et OA′ (ici des mm), puis convertissez le résultat en m.';
  };
  const messageNette = d => {
    const s = d.s, f = M.focaleNette(s.D), ec = M.ecartRetine(s.D, M.F_REPOS);
    if (d.ok) return s.nette
      ? `✓ Correct : à ${M.distanceTexte(s.D)}, l’image est déjà sur la rétine avec f′ = 17,0${NB}mm : le cristallin n’a rien à changer.`
      : `✓ Correct : à ${M.distanceTexte(s.D)}, l’image se forme environ ${nf(M.arrondiSig(ec, 2))}${NB}mm derrière la rétine : elle est floue. Il faut se bomber : f′ passe de 17,0${NB}mm à environ ${nf(M.arrondiSig(f, 3))}${NB}mm.`;
    const dits = [!d.v.netteOk ? 'la netteté : pour un objet lointain les rayons sont presque parallèles, pour un objet proche ils se rejoignent derrière la rétine' : null, !d.v.actionOk ? 'le cristallin : plus l’objet est proche, plus il se bombe (f′ diminue)' : null].filter(Boolean);
    return `✗ À revoir : ${dits.join(' ; ')}.`;
  };
  const champDefiImage = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        {d.variante === 'image'
          ? <>Un œil normal observe {d.nom} de <strong>AB{NB}={NB}{nf(d.AB)}{NB}m</strong> situé à <strong>OA{NB}={NB}{nf(d.D)}{NB}m</strong>. La rétine est à <strong>OA′{NB}={NB}17{NB}mm</strong> de la lentille et l’image est nette. Quelle est la hauteur A′B′ de l’image sur la rétine ? Donnez le résultat en mm avec 2 chiffres significatifs.</>
          : <>Un œil normal observe {d.nom} situé à <strong>OA{NB}={NB}{nf(d.D)}{NB}m</strong>. La rétine est à <strong>OA′{NB}={NB}17{NB}mm</strong> de la lentille ; l’image est nette et mesure <strong>A′B′{NB}={NB}{nf(d.Ap)}{NB}mm</strong>. Quelle est la hauteur AB de l’objet ? Donnez le résultat en m avec 2 chiffres significatifs.</>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>Réponse :</span>
        <input value={d.rep} aria-label="Votre réponse" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('oe-verif')?.click()} onChange={e => setDefi(x => ({ ...x, rep: e.target.value, verifie: false }))}
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${d.verifie ? (d.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }} /><span>{d.variante === 'image' ? 'mm' : 'm'}</span>
      </div>
      <IndiceDefi cache={false}>{d.variante === 'image' ? 'Relation : A′B′ = AB × OA′ ÷ OA. Mettez AB et OA dans la même unité (1 m = 1 000 mm), prenez OA′ = 17 mm : le résultat est en mm.' : 'Relation : A′B′ ÷ AB = OA′ ÷ OA, donc AB = A′B′ × OA ÷ OA′. Mettez OA en mm (1 m = 1 000 mm), calculez en mm, puis convertissez en m.'}</IndiceDefi>
    </>);
  const champDefiNette = d => {
    const o = M.OBJETS[d.s.objet];
    return (
      <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un œil normal regarde {o.nom} de {o.hLabel} située à <strong>{M.distanceTexte(d.s.D)}</strong>. Son cristallin est <strong>au repos</strong> : f′{NB}={NB}17,0{NB}mm, rétine à 17{NB}mm. Que se passe-t-il sur la rétine, et que doit faire le cristallin pour voir net ?</div>
        <label style={etiquette}>Image sur la rétine
          <select value={d.nette} onChange={e => setDefi(x => ({ ...x, nette: e.target.value, verifie: false }))} style={sel}>
            <option value="">— choisir —</option><option value="oui">nette</option><option value="non">floue</option></select></label>
        <label style={etiquette}>Pour voir net cet objet, le cristallin doit…
          <select value={d.action} onChange={e => setDefi(x => ({ ...x, action: e.target.value, verifie: false }))} style={sel}>
            <option value="">— choisir —</option><option value="bomber">se bomber : f′ diminue</option><option value="aplatir">s’aplatir : f′ augmente</option><option value="rien">ne rien changer : f′ reste 17,0{NB}mm</option></select></label>
        <IndiceDefi cache={false}>Objet très loin : les rayons arrivent presque parallèles et se coupent au foyer F′, sur la rétine. Objet proche : ils se coupent derrière la rétine. Pour ramener l’image sur la rétine, f′ doit diminuer.</IndiceDefi>
      </>);
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['image', 'Taille de l’image'], ['nette', 'Net ou flou ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'image' ? 'Défi : la taille de l’image sur la rétine' : 'Défi : image nette ou floue, et rôle du cristallin'}</div>
      {defi.type === 'image' ? champDefiImage(defi) : champDefiNette(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="oe-verif" onClick={verifier} disabled={defi.type === 'nette' && (!defi.nette || !defi.action)} style={{ ...styleBouton(true, '#15803d'), opacity: defi.type === 'nette' && (!defi.nette || !defi.action) ? 0.5 : 1 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'image' ? messageImage(defi) : messageNette(defi)}</div>}
    </div>);
  // la scène du défi ne montre jamais la réponse : pas de rayons tant que la réponse n'est pas juste
  const sceneDefi = defi && (defi.type === 'image'
    ? <SceneThales AB={defi.variante === 'image' ? `${nf(defi.AB)}${NB}m` : '?'} OA={`${nf(defi.D)}${NB}m`} OAp={`17${NB}mm`} ApBp={defi.variante === 'image' ? '?' : `${nf(defi.Ap)}${NB}mm`} />
    : defi.verifie && defi.ok
      ? <SceneOeil situ={{ objet: defi.s.objet, D: defi.s.D }} f={defi.s.nette ? M.F_REPOS : defi.s.fNette} etiq={{ lentille: 'lentille', ABp: true }} />
      : <SceneDefiNette D={defi.s.D} objet={defi.s.objet} />);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Œil réduit</strong> : une seule lentille mince convergente (cornée + cristallin) et un écran fixe (la rétine) à 17{NB}mm derrière. Le vrai œil est plus compliqué : plusieurs milieux transparents, une rétine courbe, un œil de 24{NB}mm de long environ.</li>
      <li><strong>Rayons peu inclinés</strong> : l’objet est petit ou éloigné, les rayons font un petit angle avec l’axe. La rétine est dessinée plate.</li>
      <li><strong>Pupille de 4{NB}mm</strong> : les deux rayons bleus passent à 2{NB}mm de l’axe. Elle se réduit en pleine lumière.</li>
      <li><strong>Accommodation</strong> : seule la distance focale f′ change, de 15,5 à 17,5{NB}mm dans la simulation ; au repos f′ = 17,0{NB}mm. Ce sont des valeurs arrondies d’un œil moyen.</li>
      <li><strong>Image nette</strong> : l’image est jugée nette si les rayons se rejoignent à moins de 0,15{NB}mm de la rétine. Dans la réalité, la netteté dépend aussi de la lumière et de la taille des cellules de la rétine.</li>
      <li><strong>Schémas</strong> : l’œil est dessiné à l’échelle (règle de 5{NB}mm) ; l’arbre, la bougie et leur distance ne sont pas à l’échelle. Les couleurs : rayon orange = passe par O ; rayons bleus = bord de la pupille ; flèche verte = image.</li>
      <li><strong>Myopie et hypermétropie</strong> (exploration, hors du parcours) : on change seulement la distance lentille-rétine (18{NB}mm ou 16{NB}mm). Les lunettes et lentilles de contact ne sont pas étudiées ici.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const sceneGuide = (() => {
    switch (idE) {
      case 'parties': return boite('Coupe de l’œil', <SceneOeilReel />, cadre('scene'));
      case 'modele': return boite('De l’œil réel à l’œil réduit', <SceneModele />, cadre('scene'));
      case 'centre': return boite('Un arbre très loin, vu par l’œil réduit', <SceneOeil situ={arbre50} vue={{ centre: 'avant', haut: null, bas: null }} image={false} etiq={{ lentille: 'lentille' }} />, cadre('scene'));
      case 'bords': return boite('Les rayons du bord de la pupille', <SceneOeil situ={arbre50} vue={{ centre: 'tout', haut: 'avant', bas: 'avant' }} image={false} etiq={{ lentille: 'lentille' }} />, cadre('scene'));
      case 'image': return boite('Trois rayons, une image', <SceneOeil situ={arbre50} vue={vuePleine} etiq={{ lentille: 'lentille', ABp: true }} />, cadre('scene'));
      case 'thales': return boite('Deux triangles de même forme', <SceneThales />, cadre('scene'));
      case 'distance': return boite('L’arbre est à 100 m', <SceneOeil situ={arbre100} vue={{ centre: 'avant', haut: null, bas: null }} image={false} etiq={{ lentille: 'lentille' }} />, cadre('scene'));
      case 'proche': return boite('Une bougie à 25 cm, cristallin au repos', <SceneOeil situ={bougie25} vue={vuePleine} etiq={{ lentille: 'lentille', F: true, zoom: true }} />, cadre('scene'));
      case 'accommoder': return boite('Une bougie à 25 cm : réglez le cristallin',
        <><SceneOeil situ={bougie25} f={fG} vue={vuePleine} etiq={{ lentille: 'lentille', F: true, ABp: true, zoom: true }} />
          <div style={{ marginTop: 8, ...cadre('reglage') }}>
            <Curseur nom="Distance focale f′ du cristallin" valeur={fG} onChange={v => setFG(Math.round(v * 20) / 20)} min={M.F_MIN} max={M.F_REPOS} pas={0.05} unite="mm" decimales={2} couleur={C.lent} />
            <LigneMesure nom="Image sur la rétine" valeur={netteG ? 'nette' : 'floue'} couleur={netteG ? C.img : C.flou} />
          </div></>, cadre('scene'));
      case 'bombe': return boite('Une bougie à 40 cm, image nette', <SceneOeil situ={bougie40} f={f40} vue={vuePleine} etiq={{ lentille: 'lentille', F: true, ABp: true }} />, cadre('scene'));
      case 'bougie': return boite('Une bougie à 25 cm, cristallin bombé', <SceneOeil situ={bougie25} f={f25} vue={vuePleine} etiq={{ lentille: 'lentille', ABp: true }} />, cadre('scene'));
      case 'bilan': return boite('Une bougie à 25 cm, image nette', <SceneOeil situ={bougie25} f={f25} vue={vuePleine} etiq={{ lentille: 'lentille', F: true, ABp: true }} />, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const sit = S(ex.sit), L = M.DEFAUTS[ex.defaut].L, ob = M.OBJETS[sit.objet];
  const nette = M.netteRetine(sit.D, ex.f, L), OAp = M.positionImage(sit.D, ex.f), ecart = OAp - L;
  const fNette = M.focaleNette(sit.D, L), peut = M.peutAccommoder(sit.D, L);
  const reglagesEx = (<>
    <label style={etiquette}>Objet observé
      <select value={ex.sit} onChange={x => setEx(s => ({ ...s, sit: x.target.value }))} style={sel}>{M.SITUATIONS.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></label>
    <Curseur nom="Distance focale f′ du cristallin" valeur={ex.f} onChange={v => setEx(s => ({ ...s, f: Math.round(v * 20) / 20 }))} min={M.F_MIN} max={M.F_MAX} pas={0.05} unite="mm" decimales={2} couleur={C.lent} />
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      <button onClick={() => setEx(s => ({ ...s, f: M.F_REPOS }))} style={stylePetitBouton(false, '#334155')}>Cristallin au repos (17,0{NB}mm)</button>
      <button onClick={() => setEx(s => ({ ...s, f: Math.min(M.F_MAX, Math.max(M.F_MIN, Math.round(fNette * 20) / 20)) }))} style={stylePetitBouton(false, '#15803d')}>Accommoder : rendre l’image nette</button>
    </div>
    <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Choisissez l’objet, puis réglez f′ : le cristallin se bombe quand f′ diminue. La rétine reste fixe.</div>
    <Section titre={`Au-delà du parcours : défauts de vision · ${M.DEFAUTS[ex.defaut].nom}`} ouvert={!!ex.ouv.defaut} onBascule={() => ouvrir('defaut')}>
      <label style={etiquette}>Œil observé
        <select value={ex.defaut} onChange={x => setEx(s => ({ ...s, defaut: x.target.value }))} style={sel}>{Object.values(M.DEFAUTS).map(d => <option key={d.id} value={d.id}>{d.nom}{d.id !== 'normal' ? ` : rétine à ${d.L} mm` : ''}</option>)}</select></label>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Un œil myope est trop long : même au repos, l’image d’un objet lointain se forme devant la rétine. Un œil hypermétrope est trop court : l’image d’un objet proche se forme derrière la rétine, même en accommodant au maximum. Essayez : bougie à 25{NB}cm, puis arbre à 50{NB}m, pour chaque œil.</div>
    </Section>
  </>);
  const scEx = <SceneOeil situ={sit} f={ex.f} L={L} vue={vuePleine} etiq={{ lentille: 'lentille', F: true, ABp: true, zoom: true }} />;
  const mesuresEx = (
    <div style={{ marginTop: 8 }}>
      <LigneMesure nom="Image sur la rétine" valeur={nette ? 'nette' : ecart > 0 ? 'floue : l’image se forme derrière la rétine' : 'floue : l’image se forme devant la rétine'} couleur={nette ? C.img : C.flou} />
      <LigneMesure nom="Distance focale f′" valeur={`${nf(ex.f, 2)}${NB}mm`} />
      <LigneMesure nom="Distance OA′ de la lentille à l’image" valeur={`${nf(M.arrondiSig(OAp, 4), 2)}${NB}mm (rétine : ${nf(L)}${NB}mm)`} />
      {nette
        ? <LigneMesure nom="Hauteur A′B′ de l’image" valeur={`${nf(M.arrondiSig(M.hauteurImage(ob.AB, sit.D, L), 2))}${NB}mm`} couleur={C.img} />
        : <LigneMesure nom="Diamètre de la tache sur la rétine" valeur={`${nf(M.arrondiSig(M.tacheRetine(sit.D, ex.f, L), 2))}${NB}mm`} couleur={C.flou} />}
      {!peut && <LigneMesure nom="Remarque" valeur="cet œil ne peut pas voir net cet objet, même en accommodant" couleur={C.flou} />}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Arbre à 50{NB}m, puis à 100{NB}m, puis à 200{NB}m : comment change la hauteur de l’image ? Quelle règle voyez-vous ?</li>
      <li>Bougie à 25{NB}cm : l’image est floue. Réglez f′ jusqu’à ce qu’elle soit nette. Que devient f′ ? Quelle est la distance OA′ ?</li>
      <li>Passez de la bougie à 25{NB}cm à la bougie à 1,0{NB}m : l’œil au repos voit-il net ? Que doit faire f′ ?</li>
      <li>Réglez f′ à 17,5{NB}mm : que devient l’image de la bougie ? Pourquoi un œil ne peut-il pas voir net de très près ?</li>
      <li>Au-delà du parcours : choisissez un œil myope, puis un œil hypermétrope. Dans quel cas l’arbre est-il flou ? Et la bougie ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>œil réduit : une lentille convergente + un écran (la rétine) à 17{NB}mm</li>
        <li>l’image sur la rétine est réelle et renversée</li>
        <li>hauteur de l’image : A′B′ = AB × OA′ ÷ OA (même unité pour AB et OA)</li>
        <li>au repos, f′ = 17,0{NB}mm : objet loin net, objet proche flou</li>
        <li>accommodation : le cristallin se bombe, f′ diminue, la rétine ne bouge pas</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .oe-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .oe-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .oe-l1.cote .oe-carte { order: 2; } .oe-l1.cote .oe-main { order: 1; } }
        @media (max-width: 900px) { .oe-l1.cote { grid-template-columns: minmax(0, 1fr); } .oe-l1.cote .oe-main { order: 1; } .oe-l1.cote .oe-carte { order: 2; } .oe-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .oe-in { animation: oe-fondu 0.35s ease-out; } @keyframes oe-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>L’œil réduit : une lentille et un écran</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>L’œil se représente par une <strong>lentille convergente</strong> et un <strong>écran</strong>, la rétine. Sur cet écran se forme une <strong>image</strong> de ce que l’on regarde : sa taille se calcule, et sa netteté dépend de la distance de l’objet et du <strong>cristallin</strong>.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {scEx}{reglagesEx}{mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`oe-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="oe-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="oe-carte oe-hypo-defi">{panneauHypo}</div> : null}
          <div className="oe-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'image' ? suiviI : suiviN} /></div>}
            {enDefi && defi && <div className="oe-in" key={`${defi.type}${defi.AB ?? defi.s.D}${defi.D ?? ''}${defi.Ap ?? ''}${defi.verifie && defi.ok ? 'ok' : ''}`}>{boite(null, sceneDefi)}</div>}
            {enGuide && <div className="oe-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
