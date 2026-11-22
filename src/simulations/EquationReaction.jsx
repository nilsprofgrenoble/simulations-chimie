import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, VoirSolution, BoiteSolution } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./equationReactionModele";
import { QCM } from "./equationReactionQcm";
import { EquationTete, AvantApres, TableauAtomes, Copies, Equilibreur, LegendeEtats, TableProportions, SceneTubeMetal, SceneTubeCalcaire, SceneTemperature } from "./EquationReactionScenes";
import { FicheConservation, FicheAjuster, FicheCharge, FicheSpectatrice, FicheEnergie, FichePropor } from "./EquationReactionFiches";

const SIM_ID = 179, CLE_GUIDE = 'equation-reaction-2gt-guide-v1';
declarerDefis(SIM_ID, [['ajuster', 'Ajuster une équation de réaction'], ['quantite', 'Combien de molécules, d’atomes ou d’ions se forment ?']]);

// ====================================================
//  SIM 179 — ÉQUATION DE RÉACTION : ÉCRIRE ET AJUSTER (2GT spé PC, « Constitution et transformations de la matière », B « Transformation chimique »).
//  Prérequis : simulation 57 (atomes, ions et molécules), simulation 61 (solutions). Suite : simulation 1 (avancement, 1G) et simulation 159 (combustions, 1G).
//  Une seule idée : une équation de réaction est un bilan où l'on ne perd et ne crée aucun atome ni aucune charge ; on l'ajuste avec des coefficients.
//  Parcours (14 étapes) : réactifs et produits (1), lire une formule (1), conservation (1), équation non ajustée (1), ajuster H puis O du méthane (2),
//  états physiques (1), produits d'après des observations (1), ajuster avec des ions et conserver la charge (1), calcaire (1), espèce spectatrice (1),
//  exothermique ou endothermique (1), proportions (1), bilan (1). Modèle : equationReactionModele.js (testé).
//  Situation de Nils (synthèse de la dibenzalacétone, ressource C7) : reprise en exploration et en exercices, avec des énoncés réécrits.
//  Capacités visées (jamais affichées à l'élève) : modéliser une transformation par une réaction, établir et ajuster l'équation ; combustion du carbone et du
//  méthane ; corrosion d'un métal par un acide ; action d'un acide sur le calcaire ; action de HCl sur NaOH ; espèce spectatrice ; exo / endothermique ; proportionnalité.
//  Hors programme, non traité : quantité de matière, avancement, réactif limitant (1G), mécanisme.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const nbf = v => String(v).replace('-', '−');
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const Indice = ({ children }) => <details style={{ marginTop: 8, fontSize: 14, color: KIT.txt }}><summary style={{ cursor: 'pointer', fontWeight: 700, color: '#92400e' }}>💡 Indice</summary><div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>{children}</div></details>;

// Indice en deux temps : d'abord un coup de pouce, puis (sur demande) l'aide complète
const IndiceGradue = ({ niveaux }) => {
  const [n, setN] = useState(0);
  const bouton = { cursor: 'pointer', fontWeight: 700, color: '#92400e', background: 'none', border: 'none', padding: 0, fontSize: 14, textAlign: 'left' };
  return (
    <div style={{ marginTop: 8, fontSize: 14, color: KIT.txt }}>
      {n === 0 && <button type="button" style={bouton} onClick={() => setN(1)}>💡 Indice</button>}
      {n > 0 && <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 8px' }}>
        {niveaux.slice(0, n).map((t, i) => <div key={i} style={{ marginTop: i ? 6 : 0 }}><strong>Indice {i + 1} : </strong>{t}</div>)}
      </div>}
      {n > 0 && n < niveaux.length && <button type="button" style={{ ...bouton, marginTop: 6 }} onClick={() => setN(n + 1)}>💡 Un indice de plus</button>}
    </div>);
};

const R = id => M.reaction(id);
const CH4 = R('methane');

export function SimulationEquationReaction() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA, vueA] = useCompteurDefi(), [suiviQ, noterQ, vueQ] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('ajuster');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [ex, setEx] = useState({ rid: 'methane', spect: false, n: 1, coefs: [1, 1, 1, 1], ouv: {} });
  const [cg, setCg] = useState({});               // coefficients réglés par l'élève à chaque étape qui en demande
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['reactifs', 'formule', 'conservation', 'nonAjustee', 'ajusterH', 'ajusterO', 'etats', 'produits', 'charge', 'calcaire', 'spect', 'energie', 'propor', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);
  // départ des coefficients à chaque étape (tout à 1, sauf l'étape de l'oxygène qui reprend l'eau déjà ajustée)
  const DEPART = { conservation: [1, 1, 1], nonAjustee: [1, 1, 1, 1], ajusterH: [1, 1, 1, 1], ajusterO: [1, 1, 1, 2], charge: [1, 1, 1, 1], calcaire: [1, 1, 1, 1, 1] };
  const REF = { ajusterH: 'methane', ajusterO: 'methane', charge: 'fer', calcaire: 'calcaire' };
  const coefsEtape = id => cg[id] ?? (fait(id) && REF[id] ? R(REF[id]).attendus : DEPART[id]);
  const setCoefsEtape = id => f => setCg(s => ({ ...s, [id]: f(s[id] ?? DEPART[id]) }));
  const cMeth = coefsEtape('ajusterH'), cMethO = coefsEtape('ajusterO'), cFer = coefsEtape('charge'), cCalc = coefsEtape('calcaire');
  const bonMeth = [1, 2, 1, 2];

  const ETAPES = [
    { id: 'reactifs', titre: 'Avant, après : ce qui change', focus: ['scene'],
      texte: <>Quand on fait brûler du charbon de bois, il se passe une <strong>transformation chimique</strong> : des corps <strong>disparaissent</strong>, d’autres <strong>apparaissent</strong>. Les corps qui disparaissent s’appellent les <strong>réactifs</strong>. Les corps qui apparaissent s’appellent les <strong>produits</strong>. On résume tout par une <strong>équation de réaction</strong> : les réactifs à gauche, une flèche, les produits à droite.</>,
      tache: { type: 'qcm', ...QCM.reactifs } },
    { id: 'formule', titre: 'Lire une formule : combien d’atomes ?', focus: ['scene'],
      texte: <>Une <strong>formule</strong> dit de quels <strong>atomes</strong> est faite une molécule. Le petit chiffre en bas, l’<strong>indice</strong>, compte les atomes juste avant lui. Le grand chiffre devant la formule, le <strong>coefficient</strong>, compte les molécules.
        <ExempleResolu>2 CO₂ : le coefficient 2 donne <strong>2 molécules</strong>. Chaque CO₂ contient 1 atome C et 2 atomes O (indice 2). Donc 2 CO₂ contiennent 2 atomes C et 2 × 2 = <strong>4 atomes O</strong>.</ExempleResolu>
        À vous : l’eau H₂O.</>,
      tache: { type: 'num', q: 'Combien d’atomes d’hydrogène y a-t-il dans 3 H₂O ?', carnet: false, unite: 'atomes', vrai: 6, tol: 0.001, affiche: nbf,
        calcul: () => ['Le coefficient 3 donne 3 molécules d’eau.', 'Chaque H₂O contient 2 atomes H (indice 2) : 3 × 2 = 6 atomes H.'],
        pieges: [[3, 'Vous avez pris le coefficient seul : chaque molécule H₂O contient 2 atomes H, il faut multiplier.'], [5, 'On ne les additionne pas : 3 molécules, chacune avec 2 atomes H, donc 3 × 2.'], [2, 'C’est l’indice : le nombre d’atomes H dans UNE molécule. Il y a 3 molécules.']],
        expl: '3 molécules × 2 atomes H par molécule = 6 atomes H.', indice: 'Combien d’atomes H dans une seule molécule H₂O ? Multiplie par le nombre de molécules (le coefficient).' } },
    { id: 'conservation', titre: 'On ne perd rien, on ne crée rien', focus: ['scene'],
      texte: <>Regardez les atomes, représentés par des disques colorés (C gris foncé, O rouge). Comptez les atomes C et O avant et après dans le tableau.</>,
      tache: { type: 'qcm', ...QCM.conservation } },
    { id: 'nonAjustee', titre: 'Quand l’équation n’est pas ajustée', focus: ['scene'],
      texte: <>Le méthane CH₄ est le gaz des gazinières. Il brûle avec le dioxygène O₂ pour former du dioxyde de carbone CO₂ et de l’eau H₂O. Si on écrit juste chaque formule une fois, les atomes ne sont pas en même nombre avant et après : l’équation n’est <strong>pas ajustée</strong>. Observez les lignes du tableau marquées ✗.</>,
      tache: { type: 'num', q: 'Combien d’atomes d’hydrogène manque-t-il à droite pour en avoir autant qu’à gauche ?', carnet: false, unite: 'atomes', vrai: 2, tol: 0.001, affiche: nbf,
        calcul: () => ['À gauche : CH₄ contient 4 atomes H.', 'À droite : H₂O contient 2 atomes H.', 'Il en manque 4 − 2 = 2 à droite.'],
        pieges: [[4, 'C’est le nombre d’atomes H à gauche. On demande ce qui MANQUE à droite : 4 − 2.'], [6, 'On ne les additionne pas : on cherche la différence entre la gauche (4 H) et la droite (2 H).'], [1, 'Il y a 4 H à gauche et 2 H à droite : la différence est 4 − 2.']],
        expl: '4 atomes H à gauche, 2 à droite : il en manque 2 à droite.', indice: 'Lis la ligne H du tableau : le nombre d’atomes avant, le nombre d’atomes après. Fais la différence.' },
      retenirTitre: 'À retenir : on ne perd rien, on ne crée rien',
      retenir: <><FicheConservation />
        <ul style={liste}>
          <li><strong>Phrase-clé : on ne perd rien, on ne crée rien.</strong> Les atomes se réarrangent, ils sont aussi nombreux avant qu’après. On l’appelle la <strong>conservation des éléments chimiques</strong>.</li>
          <li><strong>Idée fausse</strong> : « après la réaction, il y a moins de matière ». <strong>Vrai</strong> : les mêmes atomes sont assemblés autrement.</li>
        </ul>{renvoi}</> },
    { id: 'ajusterH', titre: 'Ajuster : d’abord l’hydrogène', focus: ['scene'],
      texte: <>On <strong>ajuste</strong> une équation en écrivant des <strong>coefficients</strong> devant les formules. On ne change <strong>jamais les indices</strong> (sinon on change de molécule). On ajuste dans l’ordre : le carbone C, puis l’hydrogène H, puis l’oxygène O.
        <ExempleResolu>Pour C + H₂ → CH₄ : C est bon (1 à gauche, 1 à droite). H ne va pas (2 à gauche, 4 à droite) ; on met un 2 devant H₂ : C + 2 H₂ → CH₄. Autant d’atomes avant et après.</ExempleResolu>
        À vous, avec le méthane : le carbone est déjà bon. Réglez le coefficient de H₂O pour avoir autant d’atomes H avant qu’après.</>,
      tache: { type: 'action', ok: cMeth[3] === 2, consigne: 'Avec les boutons ＋ et −, trouvez le coefficient devant H₂O : la ligne H du tableau doit afficher ✓.' } },
    { id: 'ajusterO', titre: 'Ajuster : puis l’oxygène', focus: ['scene'],
      texte: <>Avec 2 H₂O, il y a maintenant 2 × 1 + 2 = 4 atomes d’oxygène à droite (2 dans CO₂ et 2 dans les 2 H₂O). Il reste à régler le dioxygène O₂ : on le fait <strong>en dernier</strong>, car l’oxygène se trouve dans plusieurs corps. Chaque molécule O₂ contient 2 atomes O.</>,
      tache: { type: 'action', ok: M.estMinimale(CH4, cMethO), consigne: 'Réglez le coefficient devant O₂ : toutes les lignes du tableau doivent afficher ✓.' } },
    { id: 'etats', titre: 'Les états physiques', focus: ['scene'],
      texte: <>Dans une équation, on précise souvent l’<strong>état physique</strong> de chaque corps entre parenthèses, juste après la formule : <strong>(s)</strong> solide, <strong>(l)</strong> liquide, <strong>(g)</strong> gaz, <strong>(aq)</strong> dissous dans l’eau (solution aqueuse). L’équation complète de la combustion du méthane s’écrit en tête de l’écran.</>,
      tache: { type: 'qcm', ...QCM.etats },
      retenirTitre: 'À retenir : ajuster une équation',
      retenir: <><FicheAjuster />
        <ul style={liste}>
          <li><strong>Dans l’ordre : C, puis H, puis O.</strong> On vérifie : autant d’atomes de chaque sorte à gauche et à droite.</li>
          <li><strong>Idée fausse</strong> : « je change l’indice pour que ça marche ». <strong>Vrai</strong> : on change seulement le coefficient, devant la formule.</li>
        </ul>{renvoi}</> },
    { id: 'produits', titre: 'Trouver les produits grâce à l’expérience', focus: ['scene'],
      texte: <>On plonge une lame de zinc dans de l’acide chlorhydrique. L’acide apporte des <strong>ions hydrogène H⁺</strong>. Un <strong>ion</strong> est un atome (ou un groupe d’atomes) qui porte une charge électrique. On observe des bulles et la lame de zinc diminue. Les produits sont inconnus : deux tests permettent de les trouver. Le premier : on approche une flamme du gaz. Le second : on ajoute de la <strong>soude</strong>, un liquide qui sert à tester les ions. Un <strong>précipité</strong> est un solide qui apparaît dans le liquide.</>,
      tache: { type: 'qcm', ...QCM.produits },
      },
    { id: 'charge', titre: 'Avec des ions : la charge aussi se conserve', focus: ['scene'],
      texte: <>Un ion porte une <strong>charge électrique</strong>, positive (+) ou négative (−) ; un corps neutre a une charge nulle. H⁺ a une charge +1, Zn²⁺ a une charge +2. Dans une équation, la <strong>charge totale</strong> est la même avant et après.
        <ExempleResolu>Zn + 2 H⁺ → Zn²⁺ + H₂ : avant, 2 × (+1) = +2 ; après, +2 (pour Zn²⁺) et 0 (pour H₂, qui est neutre). Charge totale : +2 des deux côtés. ✓</ExempleResolu>
        À vous, avec le fer : Fe + H⁺ → Fe²⁺ + H₂. Réglez le coefficient de H⁺ pour que les atomes H <strong>et</strong> la charge soient égaux.</>,
      tache: { type: 'action', ok: M.estMinimale(R('fer'), cFer), consigne: 'Trouvez le coefficient devant H⁺ : les lignes H et charge du tableau doivent afficher ✓.' } },
    { id: 'calcaire', titre: 'Autre situation : l’acide sur le calcaire', focus: ['scene'],
      texte: <>Le calcaire est une roche de carbonate de calcium CaCO₃. C’est un solide formé d’ions (un solide ionique) : sa formule donne l’unité qui se répète, ce n’est pas une molécule. Quand on verse de l’acide dessus, on observe une <strong>effervescence</strong> (des bulles de gaz) : le gaz trouble l’eau de chaux, c’est du dioxyde de carbone CO₂. Les produits sont les ions calcium Ca²⁺, le dioxyde de carbone et l’eau. Ajustez l’équation, dans l’ordre C, H, O, puis la charge.</>,
      tache: { type: 'action', ok: M.estMinimale(R('calcaire'), cCalc), consigne: 'Réglez les coefficients : toutes les lignes du tableau (atomes et charge) doivent afficher ✓. Un coefficient qui vaut 1 reste 1.' },
      retenirTitre: 'À retenir : la charge se conserve',
      retenir: <><FicheCharge />
        <ul style={liste}>
          <li><strong>Phrase-clé : même charge totale avant et après.</strong> Exemple : Zn + 2 H⁺ → Zn²⁺ + H₂ : +2 = +2.</li>
          <li><strong>Méthode</strong> : on ajuste les atomes, puis on vérifie la charge : H⁺ vaut +1, Zn²⁺ vaut +2.</li>
        </ul>{renvoi}</> },
    { id: 'spect', titre: 'Les espèces spectatrices', focus: ['scene'],
      texte: <>L’acide chlorhydrique contient des ions H⁺ et Cl⁻. La soude (hydroxyde de sodium) contient des ions Na⁺ et HO⁻. Quand on les mélange, on peut écrire <strong>tous les ions</strong>. Une espèce qui est <strong>présente avant et après sans changer</strong> ne participe pas à la transformation : c’est une <strong>espèce spectatrice</strong>.</>,
      tache: { type: 'qcm', ...QCM.spect } },
    { id: 'energie', titre: 'Chaud ou froid : suivre la température', focus: ['scene'],
      texte: <>Une transformation chimique échange de l’énergie avec le milieu qui l’entoure. On le voit avec un thermomètre. Voici le suivi de température de deux transformations, A et B, parties toutes deux de 20,0 °C. Dans une transformation <strong>exothermique</strong>, l’énergie est <strong>libérée</strong> vers le milieu : une transformation qui libère de l’énergie réchauffe le milieu. Dans une transformation <strong>endothermique</strong>, l’énergie est <strong>prise</strong> au milieu.</>,
      tache: { type: 'qcm', ...QCM.exo },
      retenirTitre: 'À retenir : une espèce spectatrice',
      retenir: <><FicheSpectatrice />
        <ul style={liste}>
          <li><strong>Phrase-clé : le spectateur regarde, il ne joue pas.</strong> Il est avant ET après, identique : on l’enlève de l’équation.</li>
          <li><strong>Exemple</strong> : H⁺ + Cl⁻ + Na⁺ + HO⁻ → H₂O + Na⁺ + Cl⁻ devient H⁺ + HO⁻ → H₂O.</li>
        </ul>{renvoi}</> },
    { id: 'propor', titre: 'Les coefficients sont des proportions', focus: ['scene'],
      texte: <>L’équation <strong>CH₄ + 2 O₂ → CO₂ + 2 H₂O</strong> se lit : pour 1 molécule de méthane brûlée, il faut 2 molécules de dioxygène, et il se forme 1 molécule de dioxyde de carbone et 2 molécules d’eau. Si on brûle deux fois plus de méthane, tous les nombres sont <strong>multipliés par le même nombre</strong>. Les quantités sont <strong>proportionnelles</strong>.</>,
      tache: { type: 'num', q: 'On brûle 10 molécules de méthane. Combien de molécules d’eau se forment ?', carnet: false, unite: 'molécules', vrai: 20, tol: 0.001, affiche: nbf,
        calcul: () => ['L’équation donne 2 H₂O pour 1 CH₄.', 'Pour 10 CH₄ : 10 × 2 = 20 molécules H₂O.'],
        pieges: [[10, 'Il se forme 2 molécules d’eau pour CHAQUE molécule de méthane : 10 × 2.'], [12, 'On ne les additionne pas : on multiplie par 10 le nombre 2 de l’équation.'], [5, 'On multiplie, on ne divise pas : 2 H₂O pour 1 CH₄, donc 10 × 2.']],
        expl: '1 CH₄ donne 2 H₂O ; 10 CH₄ donnent 10 × 2 = 20 H₂O.', indice: 'Dans l’équation, combien de H₂O se forment pour 1 CH₄ ? Multiplie ce nombre par 10.' },
      retenirTitre: 'À retenir : exothermique ou endothermique',
      retenir: <><FicheEnergie />
        <ul style={liste}>
          <li><strong>Exo = l’énergie sort, le milieu se réchauffe ; endo = l’énergie entre, le milieu se refroidit.</strong></li>
          <li><strong>Exemple</strong> : acide + soude, de 20,0 °C à 26,5 °C : exothermique.</li>
        </ul>{renvoi}</> },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>Une équation de réaction est un <strong>bilan</strong> : réactifs → produits, avec des <strong>coefficients</strong> pour ne perdre aucun atome ni en créer, et pour garder la même charge. Elle se vérifie en comptant. Vous pouvez maintenant explorer les transformations ou relever un défi.</>,
      tache: null,
      retenirTitre: 'À retenir : les proportions',
      retenir: <><FichePropor />
        <ul style={liste}>
          <li><strong>Les coefficients sont des proportions</strong> : on multiplie tous les coefficients par le même nombre.</li>
          <li><strong>Hypothèses</strong> : l’équation modélise le bilan, pas le déroulement ; la transformation est supposée totale.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const initCoefs = r => M.especesDe(r).map(() => 1);
  const nouveauDefi = type => {
    if (type === 'ajuster') { const d = M.tirerDefiAjuster(defi && defi.type === 'ajuster' ? defi.r.id : null); setDefi({ type, ...d, coefs: initCoefs(d.r), reps: {}, verifie: false, solution: false }); }
    else { const d = M.tirerDefiQuantite(); setDefi({ type, ...d, coefs: initCoefs(d.r), reps: {}, verifie: false, solution: false }); }
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const setCoefsDefi = f => setDefi(d => ({ ...d, coefs: f(d.coefs), verifie: false }));
  const verifier = () => {
    if (defi.type === 'ajuster') {
      const ok = M.estMinimale(defi.r, defi.coefs);
      setDefi(d => ({ ...d, verifie: true, ok })); noterA(ok);
    } else {
      const x = lireNombre(defi.reps.v), ok = isFinite(x) && Math.round(x) === defi.vrai && Math.abs(x - defi.vrai) < 1e-9;
      setDefi(d => ({ ...d, verifie: true, ok })); noterQ(ok);
    }
  };
  const champ = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>Réponse :</span>
      <input value={defi.reps.v ?? ''} aria-label="Votre réponse" onKeyDown={e => e.key === 'Enter' && document.getElementById('eq-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="numeric"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }} /><span>{defi.type === 'quantite' ? M.nomEntites(M.especesDe(defi.r)[defi.j]) : ''}</span>
    </div>);
  const messageAjuster = d => {
    const b = M.bilan(d.r, d.coefs);
    if (d.ok) return `✓ Correct. Équation ajustée : ${M.equationTexte(d.r, d.coefs)}. Autant d’atomes de chaque sorte${b.charge.present ? ' et la même charge' : ''} avant et après.`;
    if (b.ok) return '✗ L’équation conserve bien les atomes, mais les coefficients ne sont pas les plus petits possibles : simplifiez.';
    const faux = b.lignes.filter(l => !l.ok).map(l => l.el);
    return `✗ Pas encore ajustée : ${faux.length ? `comptez les atomes ${faux.join(' et ')} avant et après` : ''}${faux.length && !b.charge.ok ? ' ; ' : ''}${!b.charge.ok ? 'la charge totale n’est pas la même des deux côtés' : ''}.`;
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ajuster', 'Ajuster l’équation'], ['quantite', 'Combien se forment ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'ajuster' ? 'Défi : ajuster l’équation de réaction' : 'Défi : combien de molécules, d’atomes ou d’ions se forment ?'}</div>
      {defi.type === 'ajuster' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Transformation : <strong>{defi.r.titre.toLowerCase()}</strong>. Les formules et les états sont donnés ; il manque les <strong>coefficients</strong>. Réglez-les avec les boutons ＋ et −, puis vérifiez. Prenez les plus petits nombres entiers possibles.</div>
        <IndiceDefi cache={false}>On ajuste dans l’ordre : C, puis H, puis O. S’il y a des ions, la charge totale doit aussi être la même à gauche et à droite. Ne changez jamais les indices. Commencez par un atome présent dans un seul corps à gauche et un seul à droite.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Transformation : <strong>{defi.r.titre.toLowerCase()}</strong>. On fait réagir <strong>{defi.N} {M.nomEntites(M.especesDe(defi.r)[defi.i])}</strong> {M.ESPECES[M.especesDe(defi.r)[defi.i]].f}. Ajustez d’abord l’équation, puis trouvez combien de {M.nomEntites(M.especesDe(defi.r)[defi.j])} <strong>{M.ESPECES[M.especesDe(defi.r)[defi.j]].f}</strong> se forment. On suppose que tout réagit.</div>
        {champ()}
        <IndiceDefi cache={false}>Ajustez l’équation : les coefficients donnent les proportions. Si {defi.N} {M.ESPECES[M.especesDe(defi.r)[defi.i]].f} réagissent, par quel nombre faut-il multiplier la réaction de l’équation ? Multipliez alors le coefficient de {M.ESPECES[M.especesDe(defi.r)[defi.j]].f} par ce nombre.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="eq-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
        <VoirSolution visible={!(defi.verifie && defi.ok) && !defi.solution} onClick={() => { (defi.type === 'ajuster' ? vueA : vueQ)(); setDefi(d => ({ ...d, solution: true })); }}/>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'ajuster' ? messageAjuster(defi)
          : defi.ok ? `✓ Correct. Équation : ${M.equationAttendue(defi.r)} ; il faut ${defi.N / M.coefsAjustes(defi.r)[defi.i]} fois la réaction, soit ${defi.vrai} ${M.nomEntites(M.especesDe(defi.r)[defi.j])}.`
            : '✗ Vérifiez d’abord l’équation ajustée (tableau des coefficients), puis par quel nombre il faut multiplier la réaction, et enfin le coefficient de l’espèce demandée.'}
      </div>}
      {defi.solution && <BoiteSolution>{defi.type === 'ajuster'
        ? <>On ajuste un élément à la fois (en commençant par celui qui n’est que dans un seul corps de chaque côté){M.bilan(defi.r, M.coefsAjustes(defi.r)).charge.present ? ', puis on égalise la charge' : ''}. Équation ajustée avec les plus petits entiers : <strong>{M.equationAttendue(defi.r)}</strong>.</>
        : <>Équation ajustée : <strong>{M.equationAttendue(defi.r)}</strong>. Les coefficients de {M.ESPECES[M.especesDe(defi.r)[defi.i]].f} et de {M.ESPECES[M.especesDe(defi.r)[defi.j]].f} sont {M.coefsAjustes(defi.r)[defi.i]} et {M.coefsAjustes(defi.r)[defi.j]}. Il réagit {defi.N} {M.nomEntites(M.especesDe(defi.r)[defi.i])}, soit {defi.N} ÷ {M.coefsAjustes(defi.r)[defi.i]} = {defi.N / M.coefsAjustes(defi.r)[defi.i]} fois la réaction : il se forme {defi.N / M.coefsAjustes(defi.r)[defi.i]} × {M.coefsAjustes(defi.r)[defi.j]} = <strong>{defi.vrai} {M.nomEntites(M.especesDe(defi.r)[defi.j])}</strong>.</>}</BoiteSolution>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Un bilan, pas un déroulement</strong> : l’équation dit ce qui disparaît et ce qui apparaît ; elle ne dit pas comment les atomes se réarrangent, ni en combien d’étapes.</li>
      <li><strong>Transformation totale</strong> : on suppose que tous les réactifs de l’équation disparaissent. En réalité, certaines transformations s’arrêtent avant (ce n’est pas traité en Seconde).</li>
      <li><strong>Coefficients</strong> : ce sont les plus petits nombres entiers qui conservent les éléments chimiques et la charge électrique. Multiplier tous les coefficients par le même nombre donne une équation juste, mais on écrit la plus simple.</li>
      <li><strong>Proportions</strong> : les coefficients se lisent comme des nombres d’atomes, de molécules ou d’ions. CaCO₃ est un solide ionique : sa formule donne l’unité qui se répète, on parle d’« unités CaCO₃ » et non de molécules.</li>
      <li><strong>Combustion complète</strong> : on suppose que le carbone et le méthane brûlent complètement : seuls CO₂ et H₂O se forment.</li>
      <li><strong>Ion H⁺</strong> : écriture simplifiée de l’ion hydrogène en solution (dans l’eau, il est lié à une molécule d’eau).</li>
      <li><strong>États physiques</strong> : (s) solide, (l) liquide, (g) gaz, (aq) dissous dans l’eau ; dans une combustion, l’eau est écrite à l’état gazeux (vapeur dans la flamme).</li>
      <li><strong>Espèces spectatrices</strong> : elles ne figurent pas dans l’équation simplifiée ; les ions Cl⁻ de l’acide chlorhydrique sont aussi spectateurs dans les réactions avec un métal ou le calcaire.</li>
      <li><strong>Énergie</strong> : exothermique ou endothermique se lit sur la température du milieu ; l’étude est qualitative, les valeurs de température du parcours sont des valeurs d’exemple.</li>
      <li><strong>Schémas simplifiés</strong> : les atomes sont des disques colorés ; les formes ne sont pas à l’échelle ni exactes.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const carbone = R('carbone'), zinc = R('zinc'), fer = R('fer'), calc = R('calcaire'), neutra = R('neutralisation'), neutraC = R('neutraComplete');
  const sceneGuide = (() => {
    switch (idE) {
      case 'reactifs': return boite('Le carbone brûle', <><EquationTete texte={M.equationTexte(carbone, carbone.attendus, { etats: false })} /><AvantApres r={carbone} coefs={carbone.attendus} soustitre={false} /></>, cadre('scene'));
      case 'formule': return boite('Des atomes en disques colorés', <><EquationTete texte={M.equationTexte(carbone, carbone.attendus, { etats: false })} /><div style={{ textAlign: 'center' }}><Copies id="CO2" n={2} /><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt }}>2 CO₂</div></div>{aide('Deux molécules CO₂ : les atomes sont des disques colorés (C gris foncé, O rouge).')}</>, cadre('scene'));
      case 'conservation': return boite('Compter les atomes', <><EquationTete texte={M.equationTexte(carbone, carbone.attendus, { etats: false })} /><AvantApres r={carbone} coefs={carbone.attendus} /><TableauAtomes r={carbone} coefs={carbone.attendus} /></>, cadre('scene'));
      case 'nonAjustee': return boite('Méthane et dioxygène : on compte', <Equilibreur r={CH4} coefs={DEPART.nonAjustee} etats={false} />, cadre('scene'));
      case 'ajusterH': return boite('À vous : l’hydrogène', <><Equilibreur r={CH4} coefs={cMeth} setCoefs={setCoefsEtape('ajusterH')} editables={[3]} etats={false} verdict={false} /><Indice>Il y a 4 atomes H à gauche (dans CH₄). Chaque molécule H₂O en contient 2 : combien faut-il de molécules ?</Indice></>, cadre('scene'));
      case 'ajusterO': return boite('À vous : l’oxygène', <><Equilibreur r={CH4} coefs={cMethO} setCoefs={setCoefsEtape('ajusterO')} editables={[1]} etats={false} verdict /><Indice>À droite : 2 atomes O dans CO₂ et 2 × 1 dans les 2 H₂O, soit 4 atomes O. Chaque molécule O₂ contient 2 atomes O.</Indice></>, cadre('scene'));
      case 'etats': return boite('L’équation avec les états physiques', <><EquationTete texte={M.equationTexte(CH4, bonMeth)} /><AvantApres r={CH4} coefs={bonMeth} /><LegendeEtats /></>, cadre('scene'));
      case 'produits': return boite('Zinc et acide chlorhydrique', <><EquationTete texte={M.equationTexte(zinc, [1, 1, 1, 1], { inconnus: [2, 3] })} note="les produits sont à trouver" /><SceneTubeMetal metal="zinc" /></>, cadre('scene'));
      case 'charge': return boite('Fer et acide chlorhydrique', <><Equilibreur r={fer} coefs={cFer} setCoefs={setCoefsEtape('charge')} editables={[1]} /><Indice>H : il y a 2 atomes H à droite (dans H₂), donc il faut 2 ions H⁺ à gauche. Vérifiez ensuite la charge : 2 × (+1) = +2 à gauche et +2 à droite (Fe²⁺).</Indice></>, cadre('scene'));
      case 'calcaire': return boite('Calcaire et acide chlorhydrique', <><Equilibreur r={calc} coefs={cCalc} setCoefs={setCoefsEtape('calcaire')} editables={[0, 1, 2, 3, 4]} /><IndiceGradue niveaux={['Laissez tous les coefficients à 1 et regardez le tableau : quelles lignes affichent ✗ ?', 'C, O et Ca sont déjà en même nombre. Reste H : 2 atomes H à droite dans H₂O, donc 2 ions H⁺. Vérifiez la charge : +2 des deux côtés.']} /></>, cadre('scene'));
      case 'spect': return boite('Tous les ions de la solution', <><EquationTete texte={M.equationTexte(neutraC, neutraC.attendus)} note="acide chlorhydrique + hydroxyde de sodium, en solution" /><AvantApres r={neutraC} coefs={neutraC.attendus} legende={false} grises={fait('spect') ? ['Na', 'Cl'] : []} /></>, cadre('scene'));
      case 'energie': return boite('Suivi de température', <><EquationTete texte={M.equationTexte(neutra, neutra.attendus)} note="transformation A : acide chlorhydrique + hydroxyde de sodium" /><SceneTemperature /></>, cadre('scene'));
      case 'propor': return boite('Une réaction, deux, trois…', <><EquationTete texte={M.equationTexte(CH4, bonMeth)} /><TableProportions r={CH4} coefs={bonMeth} lignes={[1, 2, 3]} />{aide('Chaque ligne : le nombre de réactions, puis le nombre de molécules de chaque corps.')}</>, cadre('scene'));
      case 'bilan': return boite('Le méthane brûle', <><EquationTete texte={M.equationTexte(CH4, bonMeth)} /><AvantApres r={CH4} coefs={bonMeth} /></>, cadre('scene'));
      default: return null;
    }
  })();
  const apresSpect = enGuide && idE === 'spect' && fait('spect');

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const rEx = ex.rid === 'neutralisation' && ex.spect ? neutraC : R(ex.rid);
  const choisir = rid => { const r = R(rid); setEx(s => ({ ...s, rid, spect: false, n: 1, coefs: initCoefs(r) })); };
  const basculerSpect = v => setEx(s => ({ ...s, spect: v, coefs: initCoefs(v ? neutraC : neutra) }));
  const setCoefsEx = f => setEx(s => ({ ...s, coefs: f(s.coefs) }));
  const bonEx = M.coefsAjustes(rEx), ajusteeEx = M.estMinimale(rEx, ex.coefs);
  const OBS = {
    carbone: 'Le charbon de bois brûle dans le dioxygène : il rougeoie et dégage de la chaleur (exothermique). Le gaz formé trouble l’eau de chaux : c’est du dioxyde de carbone.',
    methane: 'La flamme du gaz de ville chauffe (exothermique). Les produits : le dioxyde de carbone (qui trouble l’eau de chaux) et de la vapeur d’eau (de la buée se dépose sur une paroi froide).',
    zinc: 'Des bulles se forment ; le gaz fait « pop » près d’une flamme (dihydrogène). Le métal disparaît peu à peu : il devient des ions dans la solution. Les ions Cl⁻ de l’acide ne changent pas (spectateurs, non écrits).',
    fer: 'Des bulles se forment ; le gaz fait « pop » près d’une flamme (dihydrogène). Le fer disparaît peu à peu : il devient des ions Fe²⁺ dans la solution. Les ions Cl⁻ de l’acide sont spectateurs.',
    magnesium: 'La réaction est vive : bulles de gaz (dihydrogène, « pop » près d’une flamme), le ruban de magnésium disparaît. Les ions Cl⁻ de l’acide sont spectateurs.',
    aluminium: 'Des bulles de dihydrogène se forment ; le métal disparaît peu à peu. Attention aux charges : Al³⁺ porte trois charges positives. Les ions Cl⁻ de l’acide sont spectateurs.',
    calcaire: 'Effervescence : le gaz dégagé trouble l’eau de chaux (dioxyde de carbone). Le calcaire disparaît peu à peu. Les ions Cl⁻ de l’acide sont spectateurs.',
    neutralisation: 'La température du mélange monte (exothermique). Les ions Na⁺ et Cl⁻ ne changent pas : ce sont des espèces spectatrices. Cochez la case pour les voir dans l’équation.',
    dba: 'Deux molécules de benzaldéhyde réagissent avec une molécule de propanone (la soude aide la réaction mais n’est pas consommée : on ne l’écrit pas). Il se forme un solide jaune, la dibenzalacétone, et de l’eau. Les molécules sont trop grandes pour être dessinées atome par atome : comptez avec le tableau.',
  };
  const reglagesEx = (<>
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>Transformation
      <select value={ex.rid} onChange={x => choisir(x.target.value)} style={sel}>
        {M.REACTIONS.filter(r => !r.cache).map(r => <option key={r.id} value={r.id}>{r.titre}</option>)}</select></label>
    {ex.rid === 'neutralisation' && <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, color: KIT.txt, marginBottom: 8 }}><input type="checkbox" checked={ex.spect} onChange={e => basculerSpect(e.target.checked)} style={{ width: 20, height: 20 }} />Écrire aussi les ions spectateurs (Na⁺ et Cl⁻)</label>}
    {aide('Choisissez une transformation, puis réglez les coefficients avec ＋ et − : le tableau compte les atomes (et la charge) avant et après.')}
  </>);
  const scEx = (<>
    <Equilibreur r={rEx} coefs={ex.coefs} setCoefs={setCoefsEx} editables={ex.coefs.map((_, i) => i)} verdict grises={rEx.spect || []} legende={rEx.id !== 'dba'} note={rEx.loin ? 'pour aller plus loin : molécules trop grandes pour être dessinées atome par atome' : null} />
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
      <button onClick={() => setCoefsEx(() => bonEx)} style={stylePetitBouton(false, '#4338ca')}>✨ Ajuster pour moi</button>
      <button onClick={() => setCoefsEx(() => initCoefs(rEx))} style={stylePetitBouton(false, '#334155')}><Pic n="refresh" />Tout remettre à 1</button>
    </div>
  </>);
  const multi = (<>
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>Faire la réaction plusieurs fois
      <select value={ex.n} onChange={x => setEx(s => ({ ...s, n: Number(x.target.value) }))} style={sel}>{[1, 2, 3, 5, 10].map(k => <option key={k} value={k}>{k} {k > 1 ? 'fois' : 'fois (équation de départ)'}</option>)}</select></label>
    {ajusteeEx ? <EquationTete texte={M.equationTexte(rEx, M.fois(ex.coefs, ex.n))} note={ex.n > 1 ? 'tous les coefficients sont multipliés par le même nombre' : null} /> : <div style={{ fontSize: 14, color: KIT.txt2 }}>Ajustez d’abord l’équation (plus petits coefficients entiers) : les proportions viendront ensuite.</div>}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Choisissez l’aluminium : combien d’ions H⁺ faut-il pour 2 atomes Al ? Quelle règle sur la charge vous le dit ?</li>
      <li>Pour le zinc, essayez les coefficients 2, 4, 2, 2 : l’équation est juste, mais est-elle la plus simple ? (Le bouton « Ajuster pour moi » donne la plus simple.)</li>
      <li>Neutralisation : cochez les ions spectateurs. Que reste-t-il quand on les retire ?</li>
      <li>Combustion du méthane : faites la réaction 10 fois. Combien de molécules d’eau se forment ? Même question pour la dibenzalacétone.</li>
      <li>Dibenzalacétone : les molécules sont trop grosses pour être dessinées. Comment compter les atomes sans le dessin ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>équation de réaction : réactifs → produits ; on ne perd rien, on ne crée rien (éléments et charge conservés)</li>
        <li>ajuster : coefficients devant les formules (jamais les indices), dans l’ordre C, H, O, puis la charge</li>
        <li>états : (s) solide, (l) liquide, (g) gaz, (aq) dissous dans l’eau</li>
        <li>espèce spectatrice : présente avant et après, inchangée ; on l’enlève de l’équation</li>
        <li>exothermique : le milieu se réchauffe ; endothermique : il se refroidit</li>
        <li>les coefficients sont des proportions : on les multiplie tous par le même nombre</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .eq-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .eq-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .eq-l1.cote .eq-carte { order: 2; } .eq-l1.cote .eq-main { order: 1; } }
        @media (max-width: 900px) { .eq-l1.cote { grid-template-columns: minmax(0, 1fr); } .eq-l1.cote .eq-main { order: 1; } .eq-l1.cote .eq-carte { order: 2; } .eq-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .eq-in { animation: eq-fondu 0.35s ease-out; } @keyframes eq-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Équation de réaction : écrire et ajuster</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une transformation chimique se résume par une <strong>équation de réaction</strong> : les <strong>réactifs</strong> (qui disparaissent) donnent les <strong>produits</strong> (qui apparaissent). On l’<strong>ajuste</strong> pour ne perdre aucun atome ni en créer.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>{reglagesEx}{scEx}</div>
        <div style={{ ...styleBoite, marginBottom: 12 }}>{multi}</div>
        <Section titre="Ce qu’on observe dans l’expérience" ouvert={!!ex.ouv.obs} onBascule={() => ouvrir('obs')}>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>{OBS[rEx.id === 'neutraComplete' ? 'neutralisation' : rEx.id]}</div>
          {ex.rid === 'zinc' && <div style={{ marginTop: 8 }}><SceneTubeMetal metal="zinc" /></div>}
          {ex.rid === 'calcaire' && <div style={{ marginTop: 8 }}><SceneTubeCalcaire /></div>}
        </Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`eq-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="eq-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="eq-carte eq-hypo-defi">{panneauHypo}</div> : null}
          <div className="eq-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'ajuster' ? suiviA : suiviQ} /></div>}
            {enDefi && defi && <div className="eq-in" key={`${defi.type}${defi.r.id}${defi.N ?? ''}`}>{boite(defi.r.titre, <Equilibreur r={defi.r} coefs={defi.coefs} setCoefs={setCoefsDefi} editables={defi.coefs.map((_, i) => i)} tableau={false} verdict={false} />)}</div>}
            {enGuide && <div className="eq-in" key={idE}>{sceneGuide}{apresSpect && <div style={{ marginTop: 8 }}>{boite('Équation simplifiée, sans les spectateurs', <EquationTete texte={M.equationAttendue(M.sansSpectatrices(neutraC))} note="Na⁺ et Cl⁻ n’y figurent plus" />)}</div>}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
