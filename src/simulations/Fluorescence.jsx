import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useCallback } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./fluoModele";
import { QCM } from "./fluoQcm";
import { SceneJablonski, SceneEmission, SvgCarteJablonski, SvgCarteTemps, SvgCarteBilanFluo } from "./FluoSchemas";
import { VueDispositif } from "./FluoDispositif";
import { VueTemps } from "./FluoTemps";
import { Onglets } from "./FluoUI";
import * as D from "./fluoDispositif";

const SIM_ID = 301, CLE_GUIDE = 'fluo-guide-v1';
declarerDefis(SIM_ID, [['stokes', 'Énergie perdue entre absorption et émission'], ['duree', 'Quelle lumière après l’arrêt ?'], ['dispositif', 'Quelle mesure choisir ?']]);

// ====================================================
//  SIM 301 — FLUORESCENCE ET PHOSPHORESCENCE : DIAGRAMME DE PERRIN-JABLONSKI (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : différencier fluorescence et phosphorescence ; décrire à l'aide du diagramme de Perrin-Jablonski
//  les processus (absorption, relaxation vibrationnelle, conversion interne, croisement intersystème, émission).
//  Modèle : fluoModele.js. Schémas : FluoSchemas.jsx.
// ====================================================

const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = '\u00a0';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['absorption', 'relaxation', 'fluo', 'stokes', 'cis', 'phos', 'temps', 'ecart', 'spectres', 'tri', 'tirem', 'raies', 'kasha', 'tirex', 'bilan'];
const BASE = { te: -9 };
const DEPART = { temps: { te: -9 } };
const arrondi3 = v => Number(Number(v).toPrecision(3));
const num2 = s => parseFloat(String(s).replace(/\s|\u00a0/g, '').replace(',', '.').replace('−', '-'));
const A = M.MOLS.A, B = M.MOLS.B;
const DE_STOKES = M.decalageStokes(350, 450), DE_ST = M.energie(420) - M.energie(520);

export function SimulationFluorescence() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState({ onglet: 'temps' });
  const [nbPh, setNbPh] = useState(0);
  const [ouv, setOuv] = useState({});
  const [suiviS, noterS] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('stokes');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'absorption', titre: 'L’absorption d’un photon', focus: ['scene'],
      texte: <>Une molécule dans son état fondamental <strong>S₀</strong> reçoit un photon de 350{NB}nm. Si l’énergie du photon correspond à un écart entre deux niveaux, il est <strong>absorbé</strong> (en 10⁻¹⁵{NB}s environ). Le diagramme de <strong>Perrin-Jablonski</strong> représente les états : S₀, S₁, S₂ (électrons de spins opposés) et T₁ (spins parallèles), chacun avec des sous-niveaux de vibration.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il lors de l’absorption du photon ?', ...QCM.absorption,
        expl: 'Le photon transfère son énergie à la molécule : un électron passe à un niveau d’énergie plus élevé (état excité S₁ ou S₂). Les noyaux n’ont pas le temps de bouger pendant 10⁻¹⁵ s.', indice: 'Regardez la flèche violette : elle monte de S₀ vers un état excité.' } },
    { id: 'relaxation', titre: 'Relaxation vibrationnelle et conversion interne', focus: ['scene'],
      texte: <>Juste après l’absorption, la molécule est dans un sous-niveau de vibration élevé. Elle <strong>descend</strong> les sous-niveaux en 10⁻¹²{NB}s : c’est la <strong>relaxation vibrationnelle</strong> (RV). Si elle est en S₂, elle passe à S₁ par <strong>conversion interne</strong> (CI), toujours en 10⁻¹²{NB}s. Ces processus sont <strong>non radiatifs</strong> : aucun photon n’est émis.</>,
      tache: { type: 'qcm', q: 'Que devient l’énergie perdue lors de la relaxation vibrationnelle ?', ...QCM.relaxation,
        expl: 'La RV et la CI sont non radiatives : l’énergie est transférée au milieu environnant (collisions avec le solvant), qui s’échauffe très légèrement.', indice: 'Non radiatif signifie « sans émission de photon ».' } },
    { id: 'fluo', titre: 'La fluorescence', focus: ['scene'],
      texte: <>Arrivée au bas de S₁, la molécule peut revenir à S₀ en <strong>émettant un photon</strong> : c’est la <strong>fluorescence</strong>, en 10⁻⁹{NB}s environ. Elle a perdu de l’énergie par relaxation vibrationnelle avant d’émettre.</>,
      tache: { type: 'qcm', q: 'Comparée à la longueur d’onde du photon absorbé, celle du photon émis par fluorescence est…', ...QCM.fluo,
        expl: 'La RV a fait perdre de l’énergie : le photon émis est moins énergétique que le photon absorbé, donc sa longueur d’onde est plus grande (E = h·c/λ). C’est le décalage de Stokes.', indice: 'Moins d’énergie, c’est une plus grande longueur d’onde.' } },
    { id: 'stokes', titre: 'Calculer l’énergie perdue', focus: ['scene'],
      texte: <>Une molécule absorbe à <strong>350{NB}nm</strong> et fluoresce à <strong>450{NB}nm</strong>. On utilise E(eV) × λ(nm) = 1243. Calculez l’énergie perdue entre l’absorption et l’émission.</>,
      tache: { type: 'num', q: 'Énergie perdue entre le photon absorbé (350 nm) et le photon émis (450 nm)', unite: 'eV', vrai: arrondi3(DE_STOKES), tol: 0.06, affiche: v => fr(v, 2), cs: 2,
        calcul: () => [`E(abs) = 1243 / 350 ≈ ${fr(1243 / 350, 2)} eV ; E(émis) = 1243 / 450 ≈ ${fr(1243 / 450, 2)} eV.`, `Énergie perdue = ${fr(1243 / 350, 2)} − ${fr(1243 / 450, 2)} ≈ ${fr(DE_STOKES, 2)} eV, soit 22 % de l’énergie absorbée (cédée par RV).`],
        pieges: [[1243 / 100, 'Vous avez utilisé la différence des longueurs d’onde (100 nm) : il faut calculer chaque énergie, puis les soustraire.'], [1243 / 450, 'C’est l’énergie du photon émis : l’énergie perdue est la différence avec le photon absorbé.'], [1243 / 350 + 1243 / 450, 'Vous avez additionné les énergies : l’énergie perdue est leur différence.']],
        expl: 'L’énergie du photon est inversement proportionnelle à λ : on calcule E(abs) et E(émis), puis la différence. Le résultat, environ 0,79 eV, est de l’ordre de grandeur d’une relaxation vibrationnelle.', indice: 'E = 1243 / λ pour chacun des deux photons, puis soustraction.' } },
    { id: 'cis', titre: 'Le croisement intersystème', focus: ['scene'],
      texte: <>Pour certaines molécules, un autre chemin existe : de S₁, la molécule passe à l’état <strong>triplet T₁</strong> par <strong>croisement intersystème</strong> (CIS, 10⁻⁸{NB}s). Dans T₁, les spins des deux électrons sont parallèles : l’énergie de T₁ est inférieure à celle de S₁. Le CIS est non radiatif.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de l’état T₁ ?', ...QCM.cis,
        expl: 'T₁ est plus bas en énergie que S₁ et on l’atteint depuis S₁ par un processus non radiatif, le croisement intersystème, qui change le spin.', indice: 'Regardez la position de T₁ par rapport à S₁ sur le schéma.' } },
    { id: 'phos', titre: 'La phosphorescence', retenirTitre: 'À retenir : fluorescence ou phosphorescence', retenir: <SvgCarteJablonski/>, focus: ['scene'],
      texte: <>De T₁, le retour à S₀ avec émission d’un photon est la <strong>phosphorescence</strong>. Ce retour change le spin : il est très peu probable, donc <strong>lent</strong> (de 10⁻²{NB}s à 10²{NB}s). La molécule reste donc longtemps en T₁ et la lumière persiste après l’arrêt de l’excitation.</>,
      tache: { type: 'qcm', q: 'Après l’arrêt d’une lampe UV, quelle émission persiste plusieurs secondes ?', ...QCM.phos,
        expl: 'La fluorescence s’éteint en quelques nanosecondes. La phosphorescence, issue de T₁, peut durer de quelques millisecondes à plusieurs minutes (étoiles phosphorescentes).', indice: 'Cherchez le retour le plus lent sur le diagramme.' } },
    { id: 'temps', titre: 'Après l’arrêt de la lumière', retenirTitre: 'À retenir : une échelle de temps', retenir: <SvgCarteTemps/>, focus: ['scene', 'curseur', 'mesures'],
      texte: <>La molécule phosphorescente B reçoit un flash très bref à t = 0. Faites glisser l’instant t sur le graphique ③ (une graduation = 1 000 fois plus de temps) ou lancez le flash. Cherchez un moment où la <strong>phosphorescence</strong> est encore là alors que la <strong>fluorescence</strong> s’est éteinte : regardez aussi où sont les molécules sur le diagramme ①.</>,
      tache: { type: 'action', ok: vie.te >= -2 && vie.te <= 0.5, label: 'Régler le temps entre 0,01 s et 3 s', faire: () => setVie(v => ({ ...v, te: -0.5, k: (v.k ?? 0) + 1 })), consigne: 'Placez l’instant t entre 10⁻² s et 3 s' } },
    { id: 'ecart', titre: 'S₁ et T₁ : quel écart d’énergie ?', focus: ['scene'],
      texte: <>Une molécule fluoresce à <strong>420{NB}nm</strong> (retour S₁ → S₀) et phosphoresce à <strong>520{NB}nm</strong> (retour T₁ → S₀). On admet que les énergies des photons mesurent les écarts S₁ − S₀ et T₁ − S₀ (relaxations dans l’état final négligées). E(eV) × λ(nm) = 1243.</>,
      tache: { type: 'num', q: 'Écart d’énergie entre S₁ et T₁', unite: 'eV', vrai: arrondi3(DE_ST), tol: 0.06, affiche: v => fr(v, 2), cs: 2,
        calcul: () => [`E(fluo) = 1243 / 420 ≈ ${fr(1243 / 420, 2)} eV ; E(phospho) = 1243 / 520 ≈ ${fr(1243 / 520, 2)} eV.`, `E(S₁) − E(T₁) = ${fr(1243 / 420, 2)} − ${fr(1243 / 520, 2)} ≈ ${fr(DE_ST, 2)} eV. Hypothèse : on néglige la relaxation vibrationnelle dans S₀ après émission.`],
        pieges: [[1243 / 100, 'Vous avez utilisé la différence des longueurs d’onde (100 nm) : calculez chaque énergie, puis soustrayez.'], [1243 / 520, 'C’est l’énergie du photon de phosphorescence : on cherche la différence avec celle du photon de fluorescence.'], [1243 / 420, 'C’est l’énergie du photon de fluorescence : on cherche la différence avec celle du photon de phosphorescence.']],
        expl: 'Plus le photon est de grande longueur d’onde, moins il est énergétique : T₁ est donc plus bas que S₁, d’environ 0,57 eV pour cette molécule.', indice: 'E = 1243 / λ pour 420 nm puis pour 520 nm, puis soustraction.' } },
    { id: 'spectres', titre: 'Spectre d’absorption et spectre d’émission', focus: ['scene'],
      texte: <>Le spectrofluorimètre excite la molécule A à 350{NB}nm, au maximum de sa bande d’absorption (graphique du haut, en violet), puis balaie la détection pour enregistrer le spectre d’émission (en bas, en vert). Le diagramme ② compare la longueur de la flèche d’absorption et celle de la flèche de fluorescence.</>,
      tache: { type: 'qcm', q: 'Par rapport au spectre d’absorption, le spectre d’émission de fluorescence est…', ...QCM.spectres,
        expl: 'À cause de la relaxation vibrationnelle, la molécule émet des photons moins énergétiques que ceux qu’elle absorbe : le spectre d’émission est décalé vers les grandes longueurs d’onde, avec une forme voisine de celle de l’absorption en image miroir.', indice: 'Les photons émis ont perdu de l’énergie.' } },
    { id: 'tri', titre: 'Fluorescence ou phosphorescence ?', focus: ['scene'],
      texte: <>On éclaire un échantillon, puis on coupe la lampe. Deux secondes plus tard, l’échantillon émet encore une lueur verte. L’intensité de chaque émission est schématisée ci-dessous à t = 2{NB}s.</>,
      tache: { type: 'qcm', q: 'Cette lueur est celle…', ...QCM.tri,
        expl: 'Deux secondes après l’arrêt, la fluorescence (durée de l’ordre de la nanoseconde) est éteinte depuis longtemps : une lueur persistante est de la phosphorescence.', indice: 'Comparez 2 s aux durées caractéristiques de chaque émission.' } },
    { id: 'tirem', titre: 'Un spectre d’émission, photon après photon', focus: ['scene', 'curseur', 'mesures'],
      texte: <>On compte maintenant les photons un par un. La lampe envoie des photons de 350{NB}nm sur la molécule A. Le hasard décide si chaque photon est absorbé ; la molécule perd de l’énergie par relaxation vibrationnelle (RV), puis émet un photon en retombant sur <strong>un sous-niveau de vibration de S₀ tiré au hasard</strong>. Ce photon traverse le réseau et tombe sur le pixel de sa longueur d’onde : le <strong>spectre d’émission</strong> se construit coup par coup. Envoyez d’abord quelques photons un par un et suivez leurs flèches sur le diagramme ②.</>,
      tache: { type: 'action', ok: nbPh >= 100, label: 'Envoyer au moins 100 photons', faire: null, consigne: 'Envoyez au moins 100 photons avec « Un photon à la fois » ou les boutons « d’un coup » (1, × 100…)' } },
    { id: 'raies', titre: 'Pourquoi une bande large ?', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Complétez le spectre jusqu’à environ 2 000 photons : c’est une <strong>bande large</strong>, pas une raie unique. Essayez ensuite les réglages de l’échantillon : « Raies » (molécule isolée, en phase gazeuse), « Structure » (molécule rigide, solvant apolaire) puis « Bande » (solution usuelle). Le comptage repart de zéro à chaque changement.</>,
      tache: { type: 'qcm', q: 'Pourquoi le spectre d’émission forme-t-il une bande large et non une raie unique ?', ...QCM.raies,
        expl: 'La bande rassemble les retours de S₁ (bas du niveau) vers les différents sous-niveaux de vibration de S₀ : chaque retour émet un photon d’énergie différente. En solution, chaque raie est en plus élargie par l’entourage de solvant, différent d’une molécule à l’autre, et une vraie molécule a de nombreux modes de vibration : les raies se fondent en une bande. Une molécule rigide dans un solvant apolaire, ou une molécule isolée en phase gazeuse, laisse voir la structure (exploration, « Du photon au spectre »).', indice: 'Comparez le nombre de flèches de fluorescence du diagramme et la largeur de la bande.' } },
    { id: 'kasha', titre: 'Et si l’on excite à une autre longueur d’onde ?', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Les photons de 330{NB}nm sont plus énergétiques que ceux de 350{NB}nm : ils portent la molécule sur un sous-niveau plus haut de S₁. Envoyez 1 000 photons à 350{NB}nm et notez l’allure du spectre. Faites ensuite glisser le repère « exc. » du graphique du haut vers 330{NB}nm (le comptage repart de zéro) et envoyez 1 000 photons. Comparez les deux spectres et les flèches du diagramme ②.</>,
      tache: { type: 'qcm', q: 'Quand on change la longueur d’onde d’excitation (dans la bande d’absorption), le spectre d’émission…', ...QCM.kasha,
        expl: 'La molécule redescend toujours jusqu’au bas de S₁ par relaxation vibrationnelle avant d’émettre (règle de Kasha) : elle « oublie » comment elle a été excitée. Le spectre d’émission ne dépend donc pas de la longueur d’onde d’excitation ; seul le nombre de photons absorbés change.', indice: 'Regardez où partent les flèches de fluorescence : toujours du même niveau.' } },
    { id: 'tirex', titre: 'Le spectre d’excitation', focus: ['scene', 'curseur', 'mesures'],
      texte: <>On fixe maintenant la <strong>détection</strong> sur la fluorescence, vers 450{NB}nm, et on fait varier la longueur d’onde d’<strong>excitation</strong>. Chaque photon envoyé a une longueur d’onde tirée au hasard entre 285 et 430{NB}nm ; on ajoute un coup à cette longueur d’onde quand le photon émis passe la fenêtre de détection. Envoyez au moins 100 000 photons (bouton × 100 000) : seuls environ 1 % d’entre eux passent la fenêtre de détection. Le graphique du haut montre la bande d’émission obtenue pour le dernier photon d’excitation et la fenêtre de détection en orange.</>,
      tache: { type: 'qcm', q: 'Le spectre d’excitation obtenu ressemble…', ...QCM.tirex,
        expl: 'Un coup n’est compté que si le photon d’excitation est absorbé, puis qu’un photon de fluorescence est détecté : le nombre de coups à chaque longueur d’onde est proportionnel à l’absorption. Le spectre d’excitation a donc l’allure du spectre d’absorption de la molécule.', indice: 'Pour être détecté, il faut d’abord que le photon d’excitation soit absorbé.' } },
    { id: 'bilan', titre: 'Le bilan : le diagramme de Perrin-Jablonski', focus: [],
      retenirTitre: 'À retenir : fluorescence et phosphorescence', retenir: <><SvgCarteBilanFluo/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>Absorption, RV et CI : très rapides (≤ 10⁻¹² s) ; RV et CI sont non radiatives.</li><li>Fluorescence : S₁ → S₀, 10⁻⁹ s ; phosphorescence : T₁ → S₀, lente, après un CIS.</li></ul></>,
      texte: <>Vous savez décrire les processus d’un diagramme de Perrin-Jablonski, distinguer fluorescence et phosphorescence par leur origine et leur durée, et prévoir le décalage vers les grandes longueurs d’onde. En exploration, étudiez deux molécules et l’évolution après l’arrêt de la lumière ; les défis testent le calcul de l’énergie perdue et l’identification de la lumière émise. Les tirages de photons relient les transitions du diagramme à l’allure des spectres : émission (λ d’excitation fixée) et excitation (λ de détection fixée). Pour la suite : la spectrofluorimétrie.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, ORDRE.length - 1);
    if (ni !== Math.min(guide.etape, ORDRE.length - 1)) {
      setVie(() => ({ ...BASE, ...(DEPART[ORDRE[ni]] ?? {}) }));
      setNbPh(0);
    }
    setGuide(nv);
  };
  const sc = idE;
  const majTemps = useCallback(l => setVie(v => (v.te === l ? v : { ...v, te: l })), []);
  const VUES_D = { spectres: { mode: 'em', mol: 'A' }, tirem: { mode: 'em', mol: 'A', comptage: true, onCompte: setNbPh }, raies: { mode: 'em', mol: 'A', comptage: true, conditions: true }, kasha: { mode: 'em', mol: 'A', comptage: true }, tirex: { mode: 'ex', mol: 'A', comptage: true } };
  const PLEIN = ['temps', ...Object.keys(VUES_D)];
  const ACTIFS = { absorption: 'absorption', relaxation: ['absorption', 'rv', 'ci'], fluo: ['absorption', 'rv', 'ci', 'fluo'], stokes: ['absorption', 'fluo'], cis: ['fluo', 'cis'], phos: null, ecart: ['fluo', 'phos', 'cis'] };
  const sceneGuide = !enGuide ? null
    : sc in ACTIFS ? <SceneJablonski actif={ACTIFS[sc]} durees={sc !== 'stokes' && sc !== 'ecart'}/>
    : sc === 'temps' ? <VueTemps key={`t${vie.k ?? 0}`} lt0={vie.te} molFixe="B" onLt={majTemps}/>
    : VUES_D[sc] ? <VueDispositif key={sc} guide={VUES_D[sc]}/>
    : sc === 'tri' ? <SceneEmission mol={B} t={2}/>
    : null;
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'stokes' ? { ...M.tirageDefiStokes(Math.random), rep1: '', verifie: false } : kind === 'dispositif' ? { ...D.tirageDefiDispositif(Math.random), rep1: '', verifie: false } : { ...M.tirageDefiDuree(Math.random), rep1: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => {
    let ok;
    if (defi.kind === 'stokes') { ok = Math.abs(num2(defi.rep1) - defi.dE) <= 0.06 * defi.dE; noterS(ok); }
    else if (defi.kind === 'dispositif') { ok = defi.rep1 === defi.rep; noterP(ok); }
    else { ok = defi.rep1 === defi.rep; noterD(ok); }
    setDefi(x => ({ ...x, verifie: true, ok }));
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['stokes', 'Énergie perdue'], ['duree', 'Quelle lumière ?'], ['dispositif', 'Quelle mesure ?']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#16a34a')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'stokes' ? 'Défi : l’énergie perdue avant l’émission' : defi.kind === 'dispositif' ? 'Défi : quelle mesure choisir ?' : 'Défi : quelle lumière après l’arrêt ?'}</div>
      {defi.kind === 'dispositif' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>{defi.txt} Quelle mesure faut-il réaliser (place du détecteur et réglage des monochromateurs) ?</div>
        {selecteur('fl-d3', 'Type de spectre à enregistrer', defi.rep1, ev => maj({ rep1: ev.target.value }), D.MODES.map(m => ({ id: m.id, nom: m.nom })), 'Choisir…')}</>
      : defi.kind === 'stokes' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Une molécule absorbe un photon de <strong>{defi.lamAbs}{NB}nm</strong> et fluoresce à <strong>{defi.lamEm}{NB}nm</strong>. Quelle énergie a été perdue entre l’absorption et l’émission ? (E(eV) × λ(nm) = 1243 ; 2 chiffres significatifs ; précision attendue : 6 %)</div>
        <div style={{ marginTop: 8 }}><label htmlFor="fl-d1" style={libelle}>Énergie perdue (eV)</label><input id="fl-d1" inputMode="decimal" value={defi.rep1} onChange={ev => maj({ rep1: ev.target.value })} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div></>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une molécule phosphorescente (fluorescence : durée de vie 2{NB}ns ; phosphorescence : 1{NB}s) est excitée, puis la lampe est coupée. On observe l’échantillon <strong>{defi.txt}</strong> après la coupure. On juge une émission visible tant que son intensité dépasse 1{NB}% de sa valeur initiale.</div>
        {selecteur('fl-d2', 'Quelle lumière observe-t-on ?', defi.rep1, ev => maj({ rep1: ev.target.value }), ['les deux', 'phosphorescence seule', 'aucune'].map(s => ({ id: s, nom: s })), 'Choisir…')}</>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'dispositif' ? <>Dans l’axe, on voit ce qui n’est pas absorbé ; à 90°, on ne voit que la lumière émise. Demandez-vous ce qui est fixé et ce qui est balayé, et si la lampe est allumée.</>
        : defi.kind === 'stokes'
        ? <>E = 1243 / λ pour chacun des deux photons, puis E(abs) − E(émis).</>
        : <>Intensité = exp(−t/τ) : une émission est visible tant que t est inférieur à environ 4,6 τ (1 %). Comparez t à 2{NB}ns puis à 1{NB}s.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'stokes' ? <>Réponse : {fr(defi.dE, 2)}{NB}eV.</> : defi.kind === 'dispositif' ? <>Réponse : {defi.nomRep}. {defi.expl}</> : <>Réponse : {defi.rep}.</>}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#16a34a')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration : trois vues, chacune « tout visible d'un coup » ----------
  const pilules = <Onglets valeur={ex.onglet === 'dispositif' ? 'dispositif' : 'temps'} onChange={k => setEx(e => ({ ...e, onglet: k }))}
    options={[['temps', 'Dans le temps', 'après un flash, molécule par molécule'], ['dispositif', 'Du photon au spectre', 'l’appareil, la molécule, le spectre']]}/>;
  const voletScene = (
    <div style={styleBoite}>
      {pilules}
      {ex.onglet === 'dispositif' ? <VueDispositif/> : <VueTemps/>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Le diagramme dans le temps : lancez le flash avec A puis avec B. À partir de quel instant ne reste-t-il que la phosphorescence ?</li>
      <li>Le diagramme dans le temps : touchez chaque processus du diagramme. Lesquels émettent un photon ? Lesquels sont les plus rapides ?</li>
      <li>Le diagramme dans le temps : pourquoi l’œil voit-il la phosphorescence après l’arrêt, mais jamais la fluorescence s’éteindre ?</li>
      <li>Du photon au spectre : passez d’« Absorption » à « Émission » : quel détecteur sert ? Pourquoi ne mesure-t-on pas l’émission dans l’axe du faisceau ?</li>
      <li>Du photon au spectre : en « Émission », comparez la flèche d’absorption et la flèche d’émission du diagramme. Laquelle est la plus longue ? Que devient l’énergie manquante ?</li>
      <li>Du photon au spectre : en « Excitation », la courbe enregistrée suit-elle la bande d’absorption ? Pourquoi ?</li>
      <li>Du photon au spectre : avec B, la phosphorescence est-elle à une longueur d’onde plus petite ou plus grande que la fluorescence ? Que dit le diagramme ?</li>
      <li>Du photon au spectre : passez la mesure en « Photon par photon », spectre d’émission, et envoyez 1 000 photons. Le spectre compté rejoint-il la courbe ? Changez l’excitation : la forme change-t-elle ?</li>
      <li>Du photon au spectre : passez de « Bande » à « Structure » puis à « Raies ». D’où viennent les pics ? Avec les raies, réglez les fentes à 10 nm : que voit l’appareil ?</li>
      <li>Du photon au spectre : en « Excitation », regardez le graphique du haut pendant le balayage : la bande d’émission change-t-elle de forme ou seulement de hauteur ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Absorption (10⁻¹⁵ s), puis RV et CI (10⁻¹² s) : non radiatives</li>
        <li>Fluorescence : S₁ → S₀, environ 10⁻⁹ s ; s’arrête avec l’excitation</li>
        <li>CIS : S₁ → T₁, changement de spin ; phosphorescence : T₁ → S₀, de 10⁻² à 10² s</li>
        <li>λ d’émission &gt; λ d’absorption : décalage vers les grandes longueurs d’onde</li>
        <li>E(eV) × λ(nm) ≈ 1243 : l’énergie perdue est la différence des énergies des deux photons</li>
        <li>Spectre d’émission (λ d’excitation fixée) : une bande, qui rassemble les retours vers les sous-niveaux de vibration de S₀ ; sa forme ne dépend pas de λ d’excitation</li>
        <li>Spectre d’excitation (λ de détection fixée) : il a l’allure du spectre d’absorption</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Le diagramme dans le temps</strong> : flash très bref à t = 0 ; on suit les molécules excitées par le flash ; relaxation achevée vers 10⁻¹² s ; S₁ se vide avec sa durée de vie (fluorescence, et croisement intersystème pour B avec une part de 60 %), T₁ se vide avec 1 s (phosphorescence) ; graphique ③ et lueur de l’échantillon : nombre de photons émis par graduation de l’échelle logarithmique (dN/d log t), proportionnel à la population du niveau multipliée par t/τ, ce qui correspond aux molécules qui retombent ; l’intensité instantanée (photons par seconde) suivrait, elle, la population du niveau ; l’œil ne perçoit pas les durées inférieures à quelques centièmes de seconde.</li>
      <li><strong>Durées</strong> : ordres de grandeur du cours (absorption 10⁻¹⁵ s, RV et CI 10⁻¹² s, CIS 10⁻⁸ s, fluorescence 10⁻⁹ s, phosphorescence 10⁻² à 10² s) ; elles varient beaucoup selon la molécule et le milieu.</li>
      <li><strong>Molécules A et B</strong> : schématiques. Durées de vie : S₁ 5 ns (A) ou 2 ns (B) ; T₁ 1 s (B). Décroissance exponentielle, émission jugée visible au-dessus de 1 % de l’intensité initiale.</li>
      <li><strong>Énergies</strong> : E(eV) × λ(nm) = 1243 (constantes arrondies). L’énergie du photon émis est assimilée à un écart entre niveaux, en négligeant la relaxation vibrationnelle dans l’état d’arrivée.</li>
      <li><strong>Spectres</strong> : allures gaussiennes schématiques, de largeur arbitraire ; les intensités relatives ne sont pas à l’échelle.</li>
      <li><strong>Tirages du parcours guidé</strong> : modèle vibronique schématique à 5 sous-niveaux de vibration, mêmes facteurs de Franck-Condon à l’absorption et à l’émission (spectres en image miroir) ; écart entre sous-niveaux 0,21 eV (A) ou 0,15 eV (B) ; chaque transition élargie en bande (écart-type 0,14 eV : en solution, les sous-niveaux de vibration ne sont pas résolus, on observe des bandes) ; molécule initialement au niveau v = 0 de S₀ ; relaxation vibrationnelle complète avant émission (règle de Kasha) ; probabilité d’absorption au sommet de la bande : 90 % ; rendements fixés (A : 70 % de fluorescence ; B : 15 % de fluorescence, 60 % de croisement intersystème, puis 55 % de phosphorescence). Les nombres de photons sont des tirages aléatoires : deux séries ne donnent jamais exactement le même spectre.</li>
      <li><strong>Du photon au spectre</strong> : montage schématique vu de dessus ; diagramme d’énergie à l’échelle (longueur de chaque flèche = énergie du photon, E = 1243 / λ). Un seul mode de vibration (en réalité, une molécule de N atomes en a 3N − 6). Largeur de chaque raie (écart-type) : 0,012 eV « molécule isolée en phase gazeuse », 0,05 eV « solvant apolaire, molécule rigide », 0,14 eV « solution usuelle » ; en solution, l’élargissement vient surtout de l’entourage de solvant, différent pour chaque molécule, et des nombreux modes de vibration ; l’agitation thermique y contribue indirectement (kT ≈ 0,025 eV). Fentes : le signal est la moyenne du spectre sur la bande passante (1, 5 ou 10 nm), intensités ramenées à la largeur de fente. Absorbance maximale 0,8 ; fluorimétrie en solution diluée (A &lt; 0,1, signal ∝ A). Comptage : en émission et en phosphorescence, un spectrographe à barrette de pixels compte chaque photon à sa longueur d’onde ; en excitation, la lampe envoie des longueurs d’onde au hasard et un coup est compté quand le photon émis passe la fenêtre de détection.</li>
      <li><strong>Hors modèle</strong> : désactivation non radiative S₁ → S₀ détaillée, extinction de fluorescence (quenching), effets de solvant, règles de sélection détaillées.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fl-col { display: flex; flex-direction: column; gap: 12px; }
        .fl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .fl-l1.cote .fl-carte { order: 2; } .fl-l1.cote .fl-main { order: 1; }
          .fl-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .fl-ex > * { grid-column: 1; }
          .fl-ex > .fl-reg { grid-column: 2; grid-row: 1 / span 2; }
          .fl-ex.pleine { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 900px) { .fl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fl-in { animation: fl-fondu 0.35s ease-out; } @keyframes fl-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .fl-l1 *, .fl-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Fluorescence et phosphorescence : le diagramme de Perrin-Jablonski</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une molécule qui a absorbé un photon revient à son état fondamental par plusieurs chemins, certains <strong>radiatifs</strong> (émission d’un photon), d’autres non. Le <strong>diagramme de Perrin-Jablonski</strong> les représente : on distingue ainsi la <strong>fluorescence</strong>, rapide, et la <strong>phosphorescence</strong>, lente.</div>
      {enGuide && <div className={`fl-l1${PLEIN.includes(sc) ? '' : ' cote'}`}>
        <div className="fl-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="fl-main">
          <div className="fl-col">
            {sceneBloc && <div className="fl-in">{sceneBloc}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'stokes' ? suiviS : defi.kind === 'dispositif' ? suiviP : suiviD}/></div>}
      {enExplore && <>
        <div className="fl-ex pleine">{voletScene}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
