import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, Formule,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./imageLentille2gtModele";
import { QCM } from "./imageLentille2gtQcm";
import { SceneLentille, LegendeRayons, NoteEchelle, TableauConstructions, SceneBancDefi, sousTriangles } from "./ImageLentille2gtScenes";
import { FicheTroisRayons, FicheImageReelle, FicheLireImage, FicheGrandissement, FicheDistanceObjet } from "./ImageLentille2gtFiches";

const SIM_ID = 199, CLE_GUIDE = 'image-lentille-2gt-guide-v1';
declarerDefis(SIM_ID, [['lire', 'Lire la position et la taille de l’image'], ['thales', 'Calculer le grandissement ou la taille de l’image']]);

// ====================================================
//  SIM 199 — IMAGE RÉELLE ET GRANDISSEMENT AVEC UNE LENTILLE CONVERGENTE (2GT spé PC, « Ondes et signaux », lumière et image).
//  Prérequis : simulation 65 « Lentille » (foyers, distance focale), simulation 64 (rayons, réfraction). Suite : simulation 115 « Lentille mince » (1re : relation de conjugaison,
//  grandissement algébrique), simulation 200 « L'œil réduit » (2GT) puis simulation 117 (TSTL). Une seule idée : avec trois rayons particuliers, on construit l'image réelle d'un objet
//  (position, taille, sens), et le grandissement se détermine par les tailles ou par Thalès sur les distances. AUCUNE relation de conjugaison en 2GT.
//  Parcours (13 étapes) : décor et lecture de OA (1), rayon parallèle (1), rayon par O (1), rayon par F (1), image réelle et écran (1), sens (1), lecture d'une position (1),
//  lecture d'une taille (1), grandissement par les tailles (1), grandissement par Thalès (1), déplacer l'objet (1), objet de plus en plus loin (1), bilan (1).
//  Les tracés sont CALCULÉS par imageLentille2gtModele.js et mis en page par imageLentille2gtGeometrie.js (testés par node : rayons concourants au point image à 1e-9 près).
//  Capacités visées (jamais affichées à l'élève) : utiliser le modèle du rayon lumineux pour déterminer graphiquement la position, la taille et le sens de l'image réelle d'un objet plan
//  réel donnée par une lentille mince convergente ; définir et déterminer géométriquement un grandissement ; théorème de Thalès (capacité mathématique).
//  Hors parcours (exploration, balisé « au-delà du parcours ») : objet entre O et F (pas d'image réelle). Hors programme, non traité : relation de conjugaison, image virtuelle, grandissement algébrique.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
// nombre à 2 chiffres significatifs, en notation française (12 ; 4,0 ; 0,50)
const fmt2 = x => { const r = M.arrondiSig(x, 2); return M.nombreFR(r, r >= 10 ? 0 : r >= 1 ? 1 : 2); };
const T3 = { 1: 'complet', 2: 'complet', 3: 'complet' };
const PTS_IMG = ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'];

export function SimulationImageLentille() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviL, noterL] = useCompteurDefi(), [suiviT, noterT] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('lire');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [dSel, setDSel] = useState(12);
  const [ex, setEx] = useState({ f: 4, d: 12, r: { 1: true, 2: true, 3: true }, ecran: true, cotes: false, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['decor', 'r1', 'r2', 'r3', 'image', 'sens', 'lecture1', 'lecture2', 'gamma', 'thales', 'deplace', 'loin', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const ETAPES = [
    { id: 'decor', titre: 'Un objet et une lentille', focus: ['scene'],
      texte: <>Une lentille convergente peut former l’<strong>image</strong> d’un objet. Voici le décor, dessiné <strong>à l’échelle</strong> : 1 carreau = 1&nbsp;cm, en longueur comme en hauteur. Une bougie de 2&nbsp;cm est représentée par la flèche <strong>AB</strong> : <strong>A</strong> est son pied, sur l’axe, et <strong>B</strong> la pointe de la flamme. <strong>O</strong> est le centre de la lentille ; <strong>F</strong> et <strong>F′</strong> sont ses deux foyers (voir la simulation « Lentille »). Hypothèses : lentille mince, rayons proches de l’axe (le détail est donné en mode exploration).
        <ExempleResolu>La règle sous le schéma donne la distance à O. Le foyer F′ est sous la graduation 4 : la distance focale vaut <strong>f′ = OF′ = 4&nbsp;cm</strong>.</ExempleResolu>
        À vous : l’objet.</>,
      tache: { type: 'num', q: <>Quelle est la distance OA entre l’objet et la lentille ?</>, carnet: false, unite: 'cm', vrai: 8, tol: 0.06, affiche: v => fmt2(v),
        calcul: () => ['On lit la position de A sur la règle ou on compte les carreaux depuis O.', 'A est sous la graduation 8 : OA = 8\u00a0cm.'],
        pieges: [[4, 'C’est la distance focale f′ = OF′. L’objet est plus loin de la lentille que le foyer F.'], [2, 'C’est la hauteur AB de l’objet. On demande sa distance à la lentille, le long de l’axe.']],
        expl: 'A est à 8 carreaux de O, vers la gauche : OA = 8\u00a0cm.', indice: 'Comptez les carreaux le long de l’axe, de O jusqu’à A (1 carreau = 1\u00a0cm), ou lisez la règle.' } },
    { id: 'r1', titre: 'Premier rayon : parallèle à l’axe', focus: ['scene'],
      texte: <>Pour trouver où se forme l’image, on trace des <strong>rayons lumineux</strong> qui partent de B. Trois rayons ont un trajet facile à connaître : ce sont les <strong>rayons particuliers</strong>. On les ajoute un par un, chacun avec sa couleur. Le premier part de B <strong>parallèlement à l’axe</strong> : il arrive sur la lentille à la même hauteur que B, ici 2&nbsp;cm. La flèche au milieu du trait montre le sens de la lumière.
        <ExempleResolu>Pour un autre point lumineux, situé à 3&nbsp;cm au-dessus de l’axe, le rayon parallèle à l’axe arrive sur la lentille à 3&nbsp;cm de l’axe, puis <strong>ressort en passant par le foyer image F′</strong>.</ExempleResolu>
        À vous : le rayon issu de B. Quatre tracés possibles (a, b, c, d) sont dessinés en gris après la lentille.</>,
      tache: { type: 'qcm', ...QCM.rayon1 } },
    { id: 'r2', titre: 'Deuxième rayon : par le centre O', focus: ['scene'],
      texte: <>Le premier rayon est maintenant tracé en entier (en bleu). Deuxième rayon particulier : celui qui part de B et <strong>passe par le centre O</strong> de la lentille.
        <ExempleResolu>Au centre, la lentille est très mince, comme une vitre : un rayon qui la traverse en O <strong>n’est pas dévié</strong>. S’il arrive en O en descendant doucement, il repart en descendant avec la même pente.</ExempleResolu>
        À vous : le rayon issu de B qui arrive en O.</>,
      tache: { type: 'qcm', ...QCM.rayon2 } },
    { id: 'r3', titre: 'Troisième rayon : par le foyer F', focus: ['scene'],
      texte: <>Les deux premiers rayons sont tracés. Troisième rayon particulier : celui qui part de B en <strong>passant par le foyer F</strong>. Il traverse l’axe en F, puis arrive sur la lentille sous l’axe.
        <ExempleResolu>C’est le trajet inverse du premier rayon. Un rayon qui part d’un point lumineux en passant par F <strong>ressort de la lentille parallèlement à l’axe</strong>.</ExempleResolu>
        À vous : le rayon issu de B qui passe par F.</>,
      tache: { type: 'qcm', ...QCM.rayon3 } },
    { id: 'image', titre: 'Où se forme l’image ?', focus: ['scene'],
      texte: <>Les trois rayons se croisent en un <strong>même point</strong>, <strong>B′</strong> : c’est l’image du point B. Le point <strong>A′</strong>, sur l’axe, est juste en dessous de B′. La flèche verte <strong>A′B′</strong> est l’<strong>image</strong> de l’objet AB. Comme la lumière s’y <strong>rassemble vraiment</strong>, on peut la recevoir sur un écran (le trait gris) : c’est une <strong>image réelle</strong>.
        <ExempleResolu>Avec une loupe, on peut former sur une feuille de papier une petite tache de lumière bien nette : elle se trouve <strong>à l’endroit précis où les rayons se rejoignent</strong>. Si on éloigne un peu la feuille de ce point, la tache n’est plus nette.</ExempleResolu>
        À vous : une expérience avec l’écran.</>,
      tache: { type: 'qcm', ...QCM.ecran },
      retenirTitre: 'Les trois rayons particuliers',
      retenir: <><FicheTroisRayons />
        <ul style={liste}>
          <li><strong>Phrase-clé : parallèle, centre, foyer.</strong> Parallèle à l’axe : il ressort par F′. Par O : il continue tout droit. Par F : il ressort parallèle à l’axe.</li>
          <li><strong>À savoir</strong> : deux rayons suffisent pour trouver B′ ; le troisième sert à vérifier.</li>
        </ul>{renvoi}</> },
    { id: 'sens', titre: 'Dans quel sens est l’image ?', focus: ['scene'],
      texte: <>Une image est <strong>droite</strong> si sa pointe est du même côté de l’axe que la pointe de l’objet. Sinon, elle est <strong>renversée</strong> (la tête en bas).
        <ExempleResolu>Une flèche a sa pointe au-dessus de l’axe ; son image a aussi sa pointe au-dessus de l’axe : l’image est <strong>droite</strong>.</ExempleResolu>
        À vous : la bougie de ce schéma.</>,
      tache: { type: 'qcm', ...QCM.sens } },
    { id: 'lecture1', titre: 'À vous : un objet plus près', focus: ['scene'],
      texte: <>Même méthode avec un objet plus près de la lentille : <strong>OA = 6&nbsp;cm</strong>. Les trois rayons sont déjà tracés pour vous ; ils se croisent en B′.
        <ExempleResolu>Sur le schéma des étapes 5 et 6 (objet à 8&nbsp;cm), le pied A′ de l’image est sous la graduation 8 de la règle : <strong>OA′ = 8&nbsp;cm</strong>.</ExempleResolu>
        À vous : lisez la position de l’image sur ce nouveau schéma.</>,
      tache: { type: 'num', q: <>À quelle distance de la lentille se trouve l’image ? (Lisez OA′ : de O jusqu’au pied A′ de l’image.)</>, carnet: false, unite: 'cm', vrai: 12, tol: 0.06, affiche: v => fmt2(v),
        calcul: () => ['On lit la position du pied A′ de la flèche verte sur la règle, à droite de la lentille.', 'A′ est sous la graduation 12 : OA′ = 12\u00a0cm.'],
        pieges: [[6, 'C’est la distance de l’objet, OA = 6\u00a0cm. Lisez la position de l’image, du côté droit de la lentille.'], [4, 'Ce nombre est la distance focale f′ (ou la hauteur de l’image) : on demande la distance OA′, le long de l’axe.']],
        expl: 'Le pied A′ de l’image est à 12 carreaux de O vers la droite : OA′ = 12\u00a0cm.', indice: 'Comptez les carreaux le long de l’axe, de O jusqu’au pied A′ de la flèche verte (1 carreau = 1\u00a0cm), ou lisez la règle.' },
      retenirTitre: 'Image réelle, sur un écran, renversée',
      retenir: <><FicheImageReelle />
        <ul style={liste}>
          <li><strong>Phrase-clé : image réelle = on peut la poser sur un écran.</strong> Les rayons s’y croisent vraiment, donc la lumière s’y rassemble.</li>
          <li><strong>Idée fausse</strong> : « l’image est à l’endroit, comme dans un miroir ». <strong>Vrai</strong> : avec cette lentille, l’image sur l’écran est renversée.</li>
        </ul>{renvoi}</> },
    { id: 'lecture2', titre: 'Quelle est la taille de l’image ?', focus: ['scene'],
      texte: <>Sur le même schéma (objet à 6&nbsp;cm), lisez maintenant la <strong>hauteur</strong> de l’image A′B′, avec les carreaux. L’objet AB mesure 2&nbsp;cm de haut. Regardez de combien de carreaux la flèche verte s’éloigne de l’axe.</>,
      tache: { type: 'num', q: <>Quelle est la hauteur A′B′ de l’image ?</>, unite: 'cm', carnet: 'Hauteur A′B′ de l’image (objet à 6\u00a0cm)', vrai: 4, tol: 0.15, affiche: v => fmt2(v),
        calcul: () => ['On compte les carreaux de l’axe jusqu’à la pointe B′ de la flèche verte.', 'B′ est à 4 carreaux de l’axe : A′B′ = 4\u00a0cm.'],
        pieges: [[2, 'C’est la hauteur de l’objet AB. Mesurez la flèche verte, l’image.'], [12, 'C’est la distance OA′ (le long de l’axe), pas la hauteur de l’image.']],
        expl: 'La pointe B′ est à 4 carreaux sous l’axe : A′B′ = 4\u00a0cm. L’image est plus grande que l’objet (2\u00a0cm).', indice: 'Comptez les carreaux de bas en haut, de l’axe jusqu’à la pointe B′ de la flèche verte (1 carreau = 1\u00a0cm).' },
      retenirTitre: 'Lire une image : où, quelle taille, quel sens',
      retenir: <><FicheLireImage />
        <ul style={liste}>
          <li><strong>Phrase-clé : on lit trois choses sur la construction.</strong> Où (OA′ sur la règle), quelle taille (A′B′ en carreaux), quel sens (droite ou renversée).</li>
          <li><strong>Exemple</strong> (objet à 8&nbsp;cm) : OA′ = 8&nbsp;cm, A′B′ = 2&nbsp;cm, image renversée.</li>
        </ul>{renvoi}</> },
    { id: 'gamma', titre: 'Le grandissement', focus: ['scene'],
      texte: <>Pour dire si l’image est plus grande ou plus petite que l’objet, on calcule le <strong>grandissement</strong> : c’est la taille de l’image divisée par la taille de l’objet. Un grandissement plus petit que 1 veut dire « image plus petite » ; plus grand que 1, « image plus grande ». Il n’a pas d’unité (les deux tailles sont en cm).
        <Formule><mtext>grandissement</mtext><mo>=</mo><mfrac><mi>A′B′</mi><mi>AB</mi></mfrac></Formule>
        <ExempleResolu>Objet à 12&nbsp;cm : A′B′ = 1,0&nbsp;cm et AB = 2,0&nbsp;cm. Grandissement = 1,0 ÷ 2,0 = <strong>0,50</strong> : l’image est deux fois plus petite que l’objet.</ExempleResolu>
        À vous : un autre objet, placé à 8&nbsp;cm de la lentille (celui des étapes 5 et 6).</>,
      tache: { type: 'num', q: <>Sur ce schéma, lisez la hauteur A′B′ de l’image, puis calculez le grandissement A′B′ ÷ AB (AB = 2,0&nbsp;cm).</>, unite: '', carnet: 'Grandissement (objet à 8\u00a0cm)', vrai: 1, tol: 0.06, affiche: v => fmt2(v),
        calcul: () => ['On lit A′B′ : la pointe B′ est à 2 carreaux de l’axe, donc A′B′ = 2,0\u00a0cm.', 'Grandissement = A′B′ ÷ AB = 2,0 ÷ 2,0 = 1,0.'],
        pieges: [[2, 'C’est la hauteur A′B′ (ou AB). Il faut diviser A′B′ par AB : le grandissement n’a pas d’unité.'], [4, 'On ne multiplie pas : on divise la taille de l’image par la taille de l’objet.']],
        expl: 'A′B′ = 2,0\u00a0cm et AB = 2,0\u00a0cm : le grandissement est 2,0 ÷ 2,0 = 1,0 : l’image a la même taille que l’objet.', indice: 'Lisez A′B′ avec les carreaux, puis divisez par AB = 2,0\u00a0cm. Si A′B′ est plus petit que AB, le résultat est plus petit que 1.' } },
    { id: 'thales', titre: 'Le grandissement avec les distances', focus: ['scene'],
      texte: <>On peut aussi trouver le grandissement avec les <strong>distances à la lentille</strong>. Les triangles OAB (gris) et OA′B′ (vert) ont la même forme : l’un est une réduction ou un agrandissement de l’autre. C’est le théorème de <strong>Thalès</strong> : le rapport des hauteurs est égal au rapport des distances.
        <Formule><mfrac><mi>A′B′</mi><mi>AB</mi></mfrac><mo>=</mo><mfrac><mi>OA′</mi><mi>OA</mi></mfrac></Formule>
        <ExempleResolu>Objet à 12&nbsp;cm, image à 6&nbsp;cm : OA′ ÷ OA = 6 ÷ 12 = <strong>0,50</strong>, comme avec les hauteurs (1,0 ÷ 2,0).</ExempleResolu>
        À vous : on revient à l’objet des étapes 7 et 8, placé à 6&nbsp;cm de la lentille. Lisez sur le schéma les distances OA et OA′.</>,
      tache: { type: 'num', q: <>Lisez OA et OA′ sur le schéma, puis calculez le grandissement avec les distances : OA′ ÷ OA.</>, unite: '', carnet: 'Grandissement (objet à 6\u00a0cm)', vrai: 2, tol: 0.06, affiche: v => fmt2(v),
        calcul: () => ['On lit OA = 6\u00a0cm (position de A sur la règle) et OA′ = 12\u00a0cm (position de A′).', 'Grandissement = OA′ ÷ OA = 12 ÷ 6 = 2,0. Avec les hauteurs : A′B′ ÷ AB = 4,0 ÷ 2,0 = 2,0 : le même résultat.'],
        pieges: [[0.5, 'Vous avez divisé à l’envers : c’est OA′ (l’image) divisé par OA (l’objet).'], [12, 'C’est la distance OA′. Il faut la diviser par OA.'], [6, 'C’est la distance OA. Il faut diviser OA′ par OA.']],
        expl: 'OA′ ÷ OA = 12 ÷ 6 = 2,0. C’est aussi A′B′ ÷ AB = 4,0 ÷ 2,0 : l’image est deux fois plus grande que l’objet.', indice: 'Divisez la distance de l’image à la lentille (OA′ = 12\u00a0cm) par la distance de l’objet à la lentille (OA = 6\u00a0cm).' },
      retenirTitre: 'Le grandissement',
      retenir: <><FicheGrandissement />
        <Formule><mtext>grandissement</mtext><mo>=</mo><mfrac><mi>A′B′</mi><mi>AB</mi></mfrac><mo>=</mo><mfrac><mi>OA′</mi><mi>OA</mi></mfrac></Formule>
        <ul style={liste}>
          <li><strong>Phrase-clé : image ÷ objet, ou distance de l’image ÷ distance de l’objet.</strong> Deux chemins, le même nombre.</li>
          <li><strong>Moins de 1</strong> : image plus petite. <strong>Plus de 1</strong> : image plus grande. <strong>Égal à 1</strong> : même taille.</li>
        </ul>{renvoi}</> },
    { id: 'deplace', titre: 'Rapprocher l’objet', focus: ['scene'],
      texte: <>Que devient l’image quand on déplace l’objet ? Avec les trois boutons, placez l’objet à 12&nbsp;cm, à 8&nbsp;cm ou à 6&nbsp;cm de la lentille. À 8&nbsp;cm, l’objet est à <strong>deux fois la distance focale</strong> (2 × 4&nbsp;cm) : ce point est noté <strong>2F</strong> (et <strong>2F′</strong> de l’autre côté de la lentille).
        <ExempleResolu>Objet à 12&nbsp;cm : l’image est à 6&nbsp;cm de la lentille et mesure 1,0&nbsp;cm. Elle est plus petite que l’objet (2,0&nbsp;cm).</ExempleResolu>
        À vous : comparez avec les deux autres positions, puis répondez.</>,
      tache: { type: 'qcm', ...QCM.deplace } },
    { id: 'loin', titre: 'Un objet de plus en plus loin', focus: ['scene'],
      texte: <>Et si l’objet est très loin de la lentille, comme un arbre au bout d’un champ ? On ne peut pas le dessiner sur la page : le tableau ci-dessous donne les résultats de constructions faites par la simulation, pour la lentille de distance focale 4&nbsp;cm.
        <ExempleResolu>Pour lire une ligne du tableau : « Objet à 12&nbsp;cm » signifie OA = 12&nbsp;cm ; les colonnes suivantes donnent la distance OA′ de l’image, sa hauteur A′B′ et le grandissement.</ExempleResolu>
        À vous : regardez comment les nombres évoluent jusqu’à 40&nbsp;cm.</>,
      tache: { type: 'qcm', ...QCM.loin } },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>Trois rayons particuliers permettent de construire l’image d’un objet : le rayon <strong>parallèle</strong> à l’axe (il passe par F′), le rayon par le <strong>centre</strong> O (il ne dévie pas) et le rayon par le <strong>foyer</strong> F (il ressort parallèle). Ils se croisent en B′ : l’image est <strong>réelle</strong>, <strong>renversée</strong>, et on peut la recevoir sur un écran. Le <strong>grandissement</strong> vaut A′B′ ÷ AB, et aussi OA′ ÷ OA. Plus l’objet est loin, plus l’image est petite et proche de F′ ; plus il se rapproche de F, plus elle est grande et loin de la lentille. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'Où est l’image selon la distance de l’objet',
      retenir: <><FicheDistanceObjet />
        <ul style={liste}>
          <li><strong>Phrase-clé : plus l’objet s’approche, plus l’image s’éloigne et grandit.</strong> Objet à 2f′ : image à 2f′, de même taille.</li>
          <li><strong>Exemple</strong> (f′ = 4&nbsp;cm) : objet à 12&nbsp;cm, image à 6&nbsp;cm, grandissement 0,5 ; objet à 6&nbsp;cm, image à 12&nbsp;cm, grandissement 2.</li>
          <li><strong>Objet très loin</strong> : l’image est petite et presque en F′.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'lire') setDefi({ type, ...M.tirerDefiLire(prec && prec.type === 'lire' ? prec : null), repA: '', repB: '', verifie: false });
    else setDefi({ type, ...M.tirerDefiThales(prec && prec.type === 'thales' ? prec : null), rep: '', verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    if (defi.type === 'lire') {
      const a = lireNombre(defi.repA), b = lireNombre(defi.repB), okA = M.reponseDistanceJuste(defi.vraiOAp, a), okB = M.reponseHauteurJuste(defi.vraiAB, b);
      setDefi(d => ({ ...d, verifie: true, okA, okB, a, b, ok: okA && okB })); noterL(okA && okB);
    } else {
      const x = lireNombre(defi.rep), ok = M.reponseThalesJuste(defi, x);
      setDefi(d => ({ ...d, verifie: true, ok, x })); noterT(ok);
    }
  };
  const messageLire = d => {
    if (d.ok) return `✓ Correct : OA′ ≈ ${fmt2(d.vraiOAp)}${NB}cm et A′B′ ≈ ${fmt2(d.vraiAB)}${NB}cm.`;
    if (!isFinite(d.a) || !isFinite(d.b)) return '✗ Entrez deux nombres (avec la virgule ou le point).';
    const dits = [];
    if (!d.okA) dits.push(Math.abs(d.a - d.d) <= 0.5 ? 'OA′ : vous avez donné la distance de l’objet ; lisez la position du pied A′ de l’image, à droite de la lentille' : Math.abs(d.a - d.f) <= 0.5 ? 'OA′ : vous avez donné la distance focale ; lisez où se trouve A′' : 'OA′ : comptez les carreaux le long de l’axe, de O jusqu’au pied A′ de la flèche verte');
    if (!d.okB) dits.push(Math.abs(d.b - M.H_OBJ) <= 0.3 ? 'A′B′ : vous avez donné la hauteur de l’objet ; mesurez la flèche verte' : 'A′B′ : comptez les carreaux de l’axe jusqu’à la pointe B′ de la flèche verte');
    return `✗ À revoir : ${dits.join(' ; ')}.`;
  };
  const messageThales = d => {
    const bon = d.variante === 'gamma' ? fmt2(d.vrai) : `${fmt2(d.vrai)}${NB}cm`;
    if (d.ok) return d.variante === 'gamma' ? `✓ Correct : grandissement = OA′ ÷ OA = ${d.OAp} ÷ ${d.OA} ≈ ${bon}.` : `✓ Correct : A′B′ = AB × OA′ ÷ OA = ${M.nombreFR(d.AB, 1)} × ${d.OAp} ÷ ${d.OA} ≈ ${bon}.`;
    const x = d.x;
    if (!isFinite(x)) return '✗ Entrez un nombre (avec la virgule ou le point).';
    if (d.variante === 'hauteur' && Math.abs(x - d.gamma) <= 0.06 * d.gamma) return '✗ Vous avez donné le grandissement (OA′ ÷ OA). La question demande la hauteur de l’image : multipliez-le par AB.';
    if (d.variante === 'gamma' && Math.abs(x - d.hImg) <= 0.06 * d.hImg) return '✗ Vous avez donné la hauteur de l’image. La question demande le grandissement, qui n’a pas d’unité.';
    if (Math.abs(x - d.OA / d.OAp) <= 0.06 * d.OA / d.OAp) return '✗ Vous avez divisé à l’envers : c’est OA′ (l’image) divisé par OA (l’objet).';
    return '✗ Pas encore. Le grandissement est OA′ ÷ OA ; la hauteur de l’image est le grandissement multiplié par la hauteur de l’objet.';
  };
  const champDefiLire = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        Une lentille convergente de distance focale <strong>f′{NB}={NB}{d.f}{NB}cm</strong> donne une image de l’objet AB ({M.cmFR(M.H_OBJ)} de haut), placé à <strong>OA{NB}={NB}{M.nombreFR(d.d, d.d % 1 ? 1 : 0)}{NB}cm</strong>. Le schéma est à l’échelle (1 carreau = 1&nbsp;cm). Lisez sur le schéma la distance <strong>OA′</strong> et la hauteur <strong>A′B′</strong> de l’image, avec une précision d’un demi-carreau.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <label>OA′ : <input value={d.repA} aria-label="OA′ en centimètres" inputMode="decimal" onChange={e => setDefi(x => ({ ...x, repA: e.target.value, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${d.verifie ? (d.okA ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }} /> cm</label>
        <label>A′B′ : <input value={d.repB} aria-label="A′B′ en centimètres" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('il-verif')?.click()} onChange={e => setDefi(x => ({ ...x, repB: e.target.value, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${d.verifie ? (d.okB ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }} /> cm</label>
      </div>
      <IndiceDefi cache={false}>OA′ : comptez les carreaux le long de l’axe, de O jusqu’au pied A′ de la flèche verte (ou lisez la règle). A′B′ : comptez les carreaux de l’axe jusqu’à la pointe B′ de la flèche verte.</IndiceDefi>
    </>);
  const champDefiThales = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        Un objet AB de <strong>{M.cmFR(d.AB)}</strong> de haut est placé à <strong>OA{NB}={NB}{d.OA}{NB}cm</strong> d’une lentille convergente. Son image se forme, nette, sur un écran placé à <strong>OA′{NB}={NB}{d.OAp}{NB}cm</strong> de la lentille.
        {d.variante === 'gamma' ? <> Quel est le <strong>grandissement</strong> ? Donnez le résultat avec 2 chiffres significatifs, sans unité.</> : <> Quelle est la <strong>hauteur A′B′</strong> de l’image ? Donnez le résultat en cm avec 2 chiffres significatifs.</>}
      </div>
      <SceneBancDefi AB={d.AB} OA={d.OA} OAp={d.OAp} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>Réponse :</span>
        <input value={d.rep} aria-label="Votre réponse" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('il-verif')?.click()} onChange={e => setDefi(x => ({ ...x, rep: e.target.value, verifie: false }))}
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${d.verifie ? (d.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }} /><span>{d.variante === 'gamma' ? '' : 'cm'}</span>
      </div>
      <IndiceDefi cache={false}>{d.variante === 'gamma' ? 'Grandissement : OA′ ÷ OA (Thalès). Divisez la distance de l’image à la lentille par la distance de l’objet à la lentille.' : 'Le grandissement est OA′ ÷ OA. La hauteur de l’image est le grandissement multiplié par la hauteur de l’objet : A′B′ = AB × OA′ ÷ OA.'}</IndiceDefi>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['lire', 'Lire l’image'], ['thales', 'Calculer avec Thalès']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'lire' ? 'Défi : lire la position et la taille de l’image' : 'Défi : grandissement et hauteur de l’image'}</div>
      {defi.type === 'lire' ? champDefiLire(defi) : champDefiThales(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="il-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'lire' ? messageLire(defi) : messageThales(defi)}</div>}
    </div>);
  const sceneDefi = defi && defi.type === 'lire' && boite('Construction à l’échelle', <>
    <SceneLentille o={{ d: defi.d, f: defi.f, rayons: T3, image: true, points: PTS_IMG }} />
    <LegendeRayons rayons={[1, 2, 3]} image /><NoteEchelle /></>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Lentille mince</strong> : son épaisseur est négligée ; chaque rayon est dévié d’un seul coup, dans le plan de la lentille (le trait vertical).</li>
      <li><strong>Rayons proches de l’axe</strong> : la lentille est dessinée grande pour que ce soit lisible. Dans la réalité, une lentille ordinaire ne donne une image nette que si les rayons restent assez près de l’axe ; sinon l’image devient floue.</li>
      <li><strong>Objet plan et réel</strong> : l’objet AB est une flèche plate, perpendiculaire à l’axe, placée devant la lentille, avec A sur l’axe. Sa hauteur est de 2,0&nbsp;cm.</li>
      <li><strong>Une seule couleur de lumière</strong> : la lentille dévie de la même façon toutes les lumières. En lumière blanche, les couleurs sont un peu déviées différemment, ce qui colore les bords de l’image (non étudié ici).</li>
      <li><strong>Schéma à l’échelle</strong> : même échelle en longueur et en hauteur (1 carreau = 1&nbsp;cm). Les valeurs lues sur les carreaux ont une précision d’environ un demi-carreau. Les distances (f′ = 4&nbsp;cm dans le parcours, objet à quelques centimètres) sont <strong>choisies</strong> pour que tout tienne sur l’écran : ce ne sont pas des mesures d’un vrai banc d’optique.</li>
      <li><strong>Trois rayons seulement</strong> : il part de B une infinité de rayons ; on en trace trois dont le trajet est connu. Tous les autres passent aussi par B′.</li>
      <li><strong>Pas de formule de conjugaison</strong> : en Seconde, la position de l’image se lit sur la construction. Les valeurs du tableau et des mesures sont calculées par la simulation en traçant les rayons (la relation de conjugaison sera vue en Première).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const scene = (o, legende, titre, extra = null, props = {}) => boite(titre, <><SceneLentille o={o} {...props} />{legende}{extra}<NoteEchelle /></>, cadre('scene'));
  const sceneGuide = (() => {
    switch (idE) {
      case 'decor': return scene({ d: 8, points: ['A', 'B', 'O', 'F', 'Fp'] }, <LegendeRayons rayons={[]} />, 'L’objet AB et la lentille');
      case 'r1': return scene({ d: 8, rayons: { 1: 'avant' }, candidats: 1, points: ['A', 'B', 'O', 'F', 'Fp'] }, <LegendeRayons rayons={[1]} candidats />, 'Le rayon parallèle à l’axe');
      case 'r2': return scene({ d: 8, rayons: { 1: 'complet', 2: 'avant' }, candidats: 2, points: ['A', 'B', 'O', 'F', 'Fp'] }, <LegendeRayons rayons={[1, 2]} candidats />, 'Le rayon qui passe par O');
      case 'r3': return scene({ d: 8, rayons: { 1: 'complet', 2: 'complet', 3: 'avant' }, candidats: 3, points: ['A', 'B', 'O', 'F', 'Fp'] }, <LegendeRayons rayons={[1, 2, 3]} candidats />, 'Le rayon qui passe par F');
      case 'image': return scene({ d: 8, rayons: T3, image: true, ecran: true, points: PTS_IMG }, <LegendeRayons rayons={[1, 2, 3]} image />, 'Les trois rayons se croisent');
      case 'sens': return scene({ d: 8, rayons: T3, image: true, ecran: true, points: PTS_IMG }, <LegendeRayons rayons={[1, 2, 3]} image />, 'L’objet et son image');
      case 'lecture1':
      case 'lecture2': return scene({ d: 6, rayons: T3, image: true, ecran: true, points: PTS_IMG }, <LegendeRayons rayons={[1, 2, 3]} image />, 'Un objet plus près de la lentille');
      case 'gamma': return scene({ d: 8, rayons: T3, image: true, ecran: true, points: PTS_IMG }, <LegendeRayons rayons={[1, 2, 3]} image />, 'Un objet à 8\u00a0cm de la lentille');
      case 'thales': return boite('Deux triangles de même forme', <><SceneLentille o={{ d: 6, rayons: T3, image: true, ecran: true, points: PTS_IMG }} sous={sousTriangles(M.construction(6))} /><LegendeRayons rayons={[1, 2, 3]} image /><NoteEchelle /></>, cadre('scene'));
      case 'deplace': return boite('Déplacer l’objet',
        <><SceneLentille o={{ d: dSel, rayons: T3, image: true, ecran: true, deuxF: true, points: PTS_IMG }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 4px', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt2 }}>Objet à :</span>
            {[12, 8, 6].map(v => <button key={v} onClick={() => setDSel(v)} aria-pressed={dSel === v} style={stylePetitBouton(dSel === v, '#0369a1')}>{v}{NB}cm</button>)}
          </div>
          <LegendeRayons rayons={[1, 2, 3]} image /><NoteEchelle /></>, cadre('scene'));
      case 'loin': return boite('Constructions pour des objets de plus en plus loin', <TableauConstructions />, cadre('scene'));
      case 'bilan': return scene({ d: 12, rayons: T3, image: true, ecran: true, points: PTS_IMG }, <LegendeRayons rayons={[1, 2, 3]} image />, 'La construction complète');
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const cEx = M.construction(ex.d, ex.f), im = cEx.image, zone = M.zoneObjet(ex.d, ex.f);
  const rayonsEx = Object.fromEntries([1, 2, 3].filter(i => ex.r[i]).map(i => [i, 'complet']));
  const idsEx = [1, 2, 3].filter(i => ex.r[i]);
  const imgDansSchema = !!im && im.OAp <= M.X_MAX - 0.4 && Math.abs(im.B[1]) <= M.LENS_H - 0.3;
  const reglagesEx = (<>
    <label style={etiquette}>Distance focale de la lentille f′
      <select value={ex.f} onChange={x => setEx(s => ({ ...s, f: Number(x.target.value) }))} style={sel}>{[2, 3, 4, 5].map(v => <option key={v} value={v}>{v}{NB}cm{v === 4 ? ' (comme dans le parcours)' : ''}</option>)}</select></label>
    <Curseur nom="Distance de l’objet à la lentille (OA)" valeur={ex.d} onChange={v => setEx(s => ({ ...s, d: Math.round(v * 2) / 2 }))} min={1} max={14.5} pas={0.5} unite="cm" decimales={1} couleur="#0369a1" />
    <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '2px 0 6px', lineHeight: 1.5 }}>Déplacez l’objet : les rayons, l’image et les mesures se recalculent.</div>
  </>);
  const optionsEx = (<>
    <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Choisissez les rayons à montrer (deux suffisent pour trouver l’image) :</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {[1, 2, 3].map(i => <button key={i} onClick={() => setEx(s => ({ ...s, r: { ...s.r, [i]: !s.r[i] } }))} aria-pressed={ex.r[i]} style={{ ...stylePetitBouton(ex.r[i], M.COULEUR_RAYON[i]), minHeight: 38 }}>{i === 1 ? 'parallèle' : i === 2 ? 'par O' : 'par F'}</button>)}
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => setEx(s => ({ ...s, ecran: !s.ecran }))} aria-pressed={ex.ecran} style={{ ...stylePetitBouton(ex.ecran, '#475569'), minHeight: 38 }}>écran</button>
      <button onClick={() => setEx(s => ({ ...s, cotes: !s.cotes }))} aria-pressed={ex.cotes} style={{ ...stylePetitBouton(ex.cotes, '#15803d'), minHeight: 38 }}>mesures sur le schéma</button>
    </div>
  </>);
  const scEx = (<>
    <SceneLentille o={{ d: ex.d, f: ex.f, rayons: rayonsEx, image: true, ecran: ex.ecran, cotes: ex.cotes ? ['OAp', 'hImg'] : [], points: PTS_IMG }} detail />
    <LegendeRayons rayons={idsEx} image={imgDansSchema} /><NoteEchelle />
  </>);
  const textZone = {
    entre: 'Au-delà du parcours : l’objet est entre O et F. Les rayons s’écartent après la lentille : ils ne se croisent pas, il n’y a pas d’image réelle (rien à recevoir sur un écran). Cette situation, c’est celle d’une loupe, vue plus tard.',
    foyer: 'Au-delà du parcours : l’objet est en F. Les rayons ressortent parallèles : ils ne se croisent jamais, l’image est « à l’infini » (aucun écran ne la reçoit).',
    proche: 'L’objet est entre F et 2F : l’image est plus grande que l’objet, et loin de la lentille.',
    deuxf: 'L’objet est en 2F : l’image a la même taille que l’objet, et se forme en 2F′.',
    loin: 'L’objet est au-delà de 2F : l’image est plus petite que l’objet, entre F′ et 2F′.',
  };
  const mesuresEx = (
    <div style={{ marginTop: 8 }}>
      <LigneMesure nom="Distance de l’objet OA" valeur={`${M.nombreFR(ex.d, 1)}${NB}cm`} />
      <LigneMesure nom="Hauteur de l’objet AB" valeur={`${M.nombreFR(M.H_OBJ, 1)}${NB}cm`} />
      {im && <>
        <LigneMesure nom="Distance de l’image OA′" valeur={imgDansSchema ? `${fmt2(im.OAp)}${NB}cm` : `${fmt2(im.OAp)}${NB}cm (hors du schéma)`} couleur="#15803d" />
        <LigneMesure nom="Hauteur de l’image A′B′" valeur={`${fmt2(im.hImg)}${NB}cm`} couleur="#15803d" />
        <LigneMesure nom="Grandissement A′B′ ÷ AB" valeur={fmt2(M.grandissementHauteurs(cEx))} couleur="#b45309" />
        <LigneMesure nom="Grandissement OA′ ÷ OA" valeur={fmt2(M.grandissementThales(cEx))} couleur="#b45309" />
        <LigneMesure nom="Sens de l’image" valeur="renversée" />
      </>}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Avec f′ = 4&nbsp;cm, placez l’objet à 8&nbsp;cm (le double de f′). Comparez OA, OA′, AB et A′B′ : que remarquez-vous ?</li>
      <li>Éloignez peu à peu l’objet jusqu’à 14&nbsp;cm. Où se rapproche l’image ? Que devient sa hauteur ?</li>
      <li>Rapprochez l’objet de F (par exemple 4,5&nbsp;cm avec f′ = 4&nbsp;cm). Que devient l’image ?</li>
      <li>Gardez l’objet à 12&nbsp;cm et changez f′ de 4&nbsp;cm à 2&nbsp;cm. L’image se rapproche-t-elle ou s’éloigne-t-elle de la lentille ?</li>
      <li>Cachez un rayon, puis un deuxième : peut-on encore trouver l’image avec deux rayons ?</li>
      <li>Au-delà du parcours : placez l’objet entre O et F. Les rayons se croisent-ils ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>trois rayons : parallèle (ressort par F′), par O (ne dévie pas), par F (ressort parallèle)</li>
        <li>image réelle : les rayons s’y croisent, on la reçoit sur un écran ; elle est renversée</li>
        <li>lire l’image : où (OA′), quelle taille (A′B′), quel sens</li>
        <li>grandissement = A′B′ ÷ AB = OA′ ÷ OA</li>
        <li>objet loin : image petite, près de F′ ; objet qui s’approche : image qui s’éloigne et grandit</li>
      </ul>
    </ARetenir>);
  const aideEx = <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Réglez la lentille et la position de l’objet : le schéma est tracé à l’échelle (1 carreau = 1&nbsp;cm) par la simulation.</div>;

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .il-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .il-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .il-l1.cote .il-carte { order: 2; } .il-l1.cote .il-main { order: 1; } }
        @media (max-width: 900px) { .il-l1.cote { grid-template-columns: minmax(0, 1fr); } .il-l1.cote .il-main { order: 1; } .il-l1.cote .il-carte { order: 2; } .il-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .il-in { animation: il-fondu 0.35s ease-out; } @keyframes il-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Image réelle et grandissement avec une lentille convergente</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une lentille convergente forme l’<strong>image</strong> d’un objet. Avec trois <strong>rayons</strong> faciles à tracer, on trouve où elle est, quelle est sa taille et son sens ; le <strong>grandissement</strong> dit si elle est plus grande ou plus petite que l’objet.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {aideEx}{scEx}
          <div style={{ marginTop: 8 }}>{reglagesEx}</div>
          <Section titre="Rayons, écran et mesures sur le schéma" ouvert={!!ex.ouv.options} onBascule={() => ouvrir('options')}>{optionsEx}</Section>
          {mesuresEx}
          <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, color: KIT.txt, lineHeight: 1.5, background: zone === 'entre' || zone === 'foyer' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${zone === 'entre' || zone === 'foyer' ? '#fcd34d' : '#bbf7d0'}`, borderRadius: 8, padding: '6px 10px' }}>
            {textZone[zone]}{im && !imgDansSchema ? ' L’image se forme très loin : elle sort du schéma.' : ''}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`il-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="il-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="il-carte il-hypo-defi">{panneauHypo}</div> : null}
          <div className="il-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'lire' ? suiviL : suiviT} /></div>}
            {enDefi && defi && sceneDefi && <div className="il-in" key={`${defi.type}${defi.d}${defi.f}${defi.OAp ?? ''}`}>{sceneDefi}</div>}
            {enGuide && <div className="il-in" key={idE === 'deplace' ? `${idE}${dSel}` : idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
