import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./flammeModele";
import { QCM } from "./flammeQcm";
import { useBoucle, useTiragesFlamme, N_ATOMES, legendeFlamme, texteEvenement } from "./flammeHook";
import { useProgres } from "./frxTiragesHook";
import { reduitMouvement } from "./hookHorloge";
import { SceneTrajet, SceneNiveauxFlamme, SceneGrille, SceneDispositif, SceneEtalonnage, SvgCarteDeux, SvgCartePopulation } from "./FlammeSchemas";
import { PanneauScenariosFlamme, CommandesTiragesFlamme } from "./FlammeTirages";

const SIM_ID = 313, CLE_GUIDE = 'flamme-guide-v1';
declarerDefis(SIM_ID, [['emission', 'Doser en émission (SEF)'], ['absorption', 'Doser en absorption (SAA)']]);

// ====================================================
//  SIM 313 — ATOMES DANS UNE FLAMME : ÉMISSION (SEF) ET ABSORPTION (SAA) (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : décrire succinctement le principe d'une spectrométrie atomique (émission de flamme, absorption atomique) à partir d'un schéma ;
//  identifier les éléments de l'appareil ; exploiter une courbe d'étalonnage pour déterminer une concentration ; choisir la spectrométrie adaptée à une analyse.
//  Modèle : flammeModele.js (valeurs d'ordre de grandeur annoncées dans les hypothèses). Schémas : FlammeSchemas.jsx. Tirages : flammeHook.js, FlammeTirages.jsx.
// ====================================================

const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = ' ';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['trajet', 'atomi', 'niveaux', 'emission', 'boltzmann', 'cuivre', 'absorption', 'transmittance', 'sensible', 'etalonnage', 'flamme', 'choisir', 'bilan'];
const num2 = s => parseFloat(String(s).replace(/\s|\u00a0/g, '').replace(',', '.').replace('−', '-'));
const NA = M.element('Na'), CU = M.element('Cu'), CA = M.element('Ca');
const FormuleAbs = <FormuleEnLigne><mi>A</mi><mo>=</mo><mo>−</mo><mi>log</mi><mo>(</mo><mi>T</mi><mo>)</mo><mo>,</mo><mspace width="0.6em"/><mi>T</mi><mo>=</mo><mfrac><mi>I</mi><msub><mi>I</mi><mn>0</mn></msub></mfrac></FormuleEnLigne>;
const PLAGE = { trajet: [0, 0.999], atomi: [0.58, 0.999] };

export function SimulationFlamme() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const BASE = () => ({ T: 2500, fl: 'propane', cle: 0, ex: [] });
  const [vie, setVie] = useState(() => ({ ...BASE(), ex: M.instantane(NA, 2500, N_ATOMES, Math.random) }));
  const [ex, setEx] = useState({ onglet: 'tirages', el: 'Na', methode: 'absorption', fl: 'acetylene', c: 0.5, points: true });
  const [ouv, setOuv] = useState({});
  const [anim, setAnim] = useState(() => !reduitMouvement());
  const [p, setP] = useBoucle(9000, anim);
  const tir = useTiragesFlamme();
  const demoSc = tir.demo?.sc ?? null;
  const progAuto = useProgres(tir.demo ? 1000000 + tir.demo.cle : tir.etat.n * 1000 + tir.rejeu % 1000, tir.demo ? tir.dureeDemo : tir.dureeAnim, tir.demo ? !reduitMouvement() : tir.anime);
  const progT = tir.manuel ?? progAuto, lotT = demoSc == null && tir.etat.lot > 1;
  const dernier = tir.etat.dernier, em = tir.t.methode === 'emission';
  const scReel = demoSc != null ? demoSc : lotT || !dernier ? null : em ? (dernier.ex.length ? 1 : 0) : (dernier.absorbe ? 1 : 0);
  const pAff = lotT ? 1 : progT;
  const [suiviE, noterE] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('emission');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'trajet', titre: 'De la solution à la flamme', focus: ['scene', 'curseur'],
      texte: <>Pour analyser une solution, on l’aspire : elle est <strong>pulvérisée en gouttelettes</strong> qui entrent dans la flamme. Suivez une goutte de chlorure de sodium dissous (⏸ pour arrêter, curseur pour avancer ou reculer).</>,
      tache: { type: 'qcm', q: 'Après évaporation du solvant (désolvatation), il reste…', ...QCM.desolv,
        expl: 'Le solvant s’évapore : la goutte rétrécit et laisse un petit grain solide du sel dissous. Ce grain fond et se vaporise ensuite plus haut dans la flamme.', indice: 'Regardez la taille de la goutte quand elle monte dans la flamme, puis ce qui reste à la fin de l’étape 2.' } },
    { id: 'atomi', titre: 'La flamme fabrique des atomes libres', focus: ['scene', 'curseur'],
      texte: <>Le grain fond, se vaporise en <strong>molécules gazeuses</strong> (NaCl), puis la chaleur les casse : on obtient des <strong>atomes libres</strong>. Ce sont eux, et eux seuls, qui absorbent ou émettent aux longueurs d’onde de la spectrométrie atomique.</>,
      tache: { type: 'qcm', q: 'La chaleur de la flamme donne des atomes libres parce qu’elle…', ...QCM.atomi,
        expl: 'La chaleur apporte l’énergie nécessaire pour rompre la liaison entre l’atome de sodium et celui de chlore : c’est l’atomisation.', indice: 'Regardez ce qui arrive à la molécule NaCl dans la dernière zone de la flamme.' } },
    { id: 'niveaux', titre: 'Un atome, deux niveaux d’énergie', focus: ['scene', 'curseur'],
      texte: <>L’électron externe d’un atome libre occupe le <strong>niveau fondamental</strong>. Un choc le fait passer au <strong>niveau excité</strong> si l’énergie fournie est exactement l’écart entre les deux niveaux. Pour le sodium, la raie correspondante est à <strong>589,0{NB}nm</strong> (jaune-orangé). Rappel : E(eV) = 1240 / λ(nm).</>,
      tache: { type: 'num', q: 'Écart d’énergie entre les deux niveaux du sodium', unite: 'eV', vrai: 2.105, tol: 0.02, affiche: v => fr(v, 2), cs: 3,
        calcul: () => ['E = h·c / λ = 1240 / 589,0 = 2,10 eV.', 'Hypothèse : on assimile la raie à une seule longueur d’onde (le doublet du sodium, 589,0 et 589,6 nm, est ici confondu).'],
        pieges: [[0.475, 'Vous avez divisé λ par h·c : il faut diviser h·c par λ.'], [2105, 'Erreur d’une puissance de 10 : λ est en nm et h·c = 1240 eV·nm donne directement des eV.'], [3.37e-19, 'Cette valeur est en joules ; l’énoncé demande des eV.']],
        expl: 'E = 1240 / 589,0 ≈ 2,10 eV : l’énergie d’un photon jaune-orangé.', indice: 'E(eV) = 1240 / λ(nm).' } },
    { id: 'emission', titre: 'Émission : la flamme éclaire', focus: ['scene', 'curseur'],
      texte: <>Dans la flamme, des chocs avec les gaz chauds excitent <strong>quelques</strong> atomes. En revenant au fondamental, ils émettent un photon de la raie : c’est la <strong>spectrométrie d’émission de flamme</strong> (SEF). Le monochromateur isole la raie, le détecteur mesure son intensité.</>,
      tache: { type: 'qcm', q: 'En SEF, la lumière mesurée à 589 nm vient…', ...QCM.emission,
        expl: 'Il n’y a pas de lampe en SEF : la lumière est émise par les atomes de sodium eux-mêmes, excités par la chaleur de la flamme puis revenus au fondamental. Son intensité augmente avec leur nombre, donc avec la concentration.', indice: 'Regardez le schéma : y a-t-il une lampe avant la flamme ?' } },
    { id: 'boltzmann', titre: 'Combien d’atomes sont excités ?', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Voici <strong>10 000 atomes de sodium</strong> libres photographiés à un instant. Les atomes excités s’allument (rond cerclé, ondes). Faites varier la température de la flamme et prenez plusieurs instantanés.</>,
      tache: { type: 'qcm', q: 'Quand la température de la flamme augmente, le nombre d’atomes excités…', ...QCM.temperature,
        expl: 'La proportion d’atomes excités suit la loi de Boltzmann, en exp(−E/kT) : elle est très sensible à la température. Pour le sodium, elle est d’environ 1 sur 100 000 à 2 000 K et de 9 sur 10 000 à 3 000 K : bien plus d’un facteur 10.', indice: 'Comparez le nombre d’atomes allumés à 2 000 K puis à 3 000 K, sur plusieurs instantanés.' } },
    { id: 'cuivre', titre: 'Et pour une raie dans l’ultraviolet ?', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Le cuivre a sa raie à <strong>324,8{NB}nm</strong> (ultraviolet) : l’écart d’énergie est de 3,82{NB}eV, bien plus grand que pour le sodium (2,10{NB}eV). Voici 10 000 atomes de cuivre dans la même flamme.</>,
      tache: { type: 'qcm', q: 'En émission de flamme, l’intensité de la raie du cuivre est…', ...QCM.cuivre,
        expl: 'Plus l’écart d’énergie est grand, moins les chocs thermiques peuvent exciter d’atomes : pour le cuivre, il y en a des millions de fois moins que pour le sodium. La SEF convient aux éléments à raie peu énergétique (Na, K, Li) ; pour le cuivre il faut une autre méthode.', indice: 'Comparez le nombre d’atomes allumés pour le cuivre et pour le sodium à la même température.' } },
    { id: 'absorption', titre: 'Absorption : une lampe éclaire la flamme', retenirTitre: 'À retenir : émission ou absorption', retenir: <SvgCarteDeux/>, focus: ['scene', 'curseur'],
      texte: <>En <strong>absorption atomique</strong> (SAA), on envoie dans la flamme la lumière d’une <strong>lampe à cathode creuse</strong> contenant l’élément à doser. Les atomes de la flamme <strong>retirent</strong> des photons du faisceau ; le détecteur reçoit moins de lumière.</>,
      tache: { type: 'qcm', q: 'La lampe contient l’élément à doser parce que…', ...QCM.lampe,
        expl: 'La lampe émet les raies de l’élément qu’elle contient, donc des photons dont l’énergie correspond exactement à la transition des atomes de la flamme, qui peuvent alors les absorber. Elle n’a pas pour rôle de chauffer ni d’exciter la flamme.', indice: 'Pour être absorbé, un photon doit avoir exactement l’énergie de la transition de l’atome.' } },
    { id: 'transmittance', titre: 'De la transmission à l’absorbance', focus: [],
      texte: <>Sur 10 000 photons envoyés à la longueur d’onde de la raie, <strong>2 000</strong> arrivent au détecteur. On définit la transmittance T = I / I₀ et l’absorbance : {FormuleAbs}.</>,
      tache: { type: 'num', q: 'Absorbance de la flamme', unite: '', vrai: 0.699, tol: 0.03, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['T = I / I₀ = 2000 / 10 000 = 0,20.', 'A = −log(0,20) = 0,70.', 'Hypothèse : chaque photon absorbé l’est une seule fois, sans diffusion ni émission parasite.'],
        pieges: [[0.2, 'Vous avez donné T : l’absorbance est A = −log T.'], [1.61, 'Vous avez utilisé le logarithme népérien : A = −log T avec le logarithme décimal.'], [-0.699, 'Une absorbance est positive : A = −log T avec T < 1.']],
        expl: 'T = 0,20 donc A = −log(0,20) ≈ 0,70 : 80 % des photons ont été absorbés.', indice: 'Calculez d’abord T = I / I₀, puis A = −log T (touche log).' } },
    { id: 'sensible', titre: 'Pourquoi l’absorption est plus sensible', retenirTitre: 'À retenir : qui peut absorber ?', retenir: <SvgCartePopulation/>, focus: ['scene', 'curseur'],
      texte: <>Reprenez l’instantané : dans la flamme, presque tous les atomes sont au niveau fondamental. Regardez un atome qui reçoit un photon de la lampe (même écart d’énergie que la raie).</>,
      tache: { type: 'qcm', q: 'Les atomes qui absorbent la lumière de la lampe sont ceux qui sont…', ...QCM.sensible,
        expl: 'L’absorption part du niveau fondamental, occupé par presque tous les atomes (même à 3 000 K). L’émission, elle, ne vient que des rares atomes excités : c’est pourquoi la SAA est plus sensible, et qu’elle convient aussi aux éléments à raie ultraviolette comme le cuivre.', indice: 'Dans l’instantané, quelle catégorie d’atomes est la plus nombreuse ?' } },
    { id: 'etalonnage', titre: 'Étalonner : de l’absorbance à la concentration', focus: ['scene'],
      texte: <>On mesure l’absorbance d’étalons de sodium. Un étalon à <strong>1,0{NB}mg/L</strong> donne A = 0,40. L’échantillon (marqué en orange) donne <strong>A = 0,25</strong>.</>,
      tache: { type: 'num', q: 'Concentration en sodium de l’échantillon', unite: 'mg/L', vrai: 0.625, tol: 0.05, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['Domaine linéaire : A = k·c, avec k = 0,40 / 1,0 = 0,40 L/mg.', 'c = 0,25 / 0,40 = 0,63 mg/L.', 'Hypothèses : A proportionnelle à c (loi de Beer-Lambert, valable à faible absorbance), même flamme et mêmes conditions pour l’étalon et l’échantillon.'],
        pieges: [[1.6, 'Vous avez inversé le rapport : c = A(échantillon) / k.'], [6.25, 'Erreur d’une puissance de 10 sur le résultat.'], [0.4 + 0.25, 'La droite passe par l’origine : on ne somme pas les absorbances.']],
        expl: 'k = 0,40 L/mg donc c = 0,25 / 0,40 ≈ 0,63 mg/L : moins que l’étalon, car l’absorbance est plus faible.', indice: 'Calculez le coefficient k = A / c avec l’étalon, puis c = A / k.' } },
    { id: 'flamme', titre: 'Le choix de la flamme', focus: ['scene', 'curseur'],
      texte: <>Le calcium forme des composés très stables (oxydes) : dans une flamme froide, beaucoup d’atomes restent liés. Changez la flamme et regardez la droite d’étalonnage du calcium.</>,
      tache: { type: 'qcm', q: 'Avec la flamme plus chaude (protoxyde d’azote-acétylène), on obtient…', ...QCM.flamme,
        expl: 'Plus la flamme est chaude, plus l’atomisation est complète : plus d’atomes de calcium sont libres, donc l’absorbance (la pente de la droite) augmente. On choisit la flamme selon l’élément : air-acétylène pour Na ou Cu, protoxyde d’azote-acétylène pour les éléments réfractaires.', indice: 'Observez comment la pente de la droite change d’une flamme à l’autre.' } },
    { id: 'choisir', titre: 'Choisir la technique', focus: [],
      texte: <>On veut doser le <strong>cuivre</strong> d’une eau de rivière, à environ 0,5{NB}mg/L. Raie du cuivre : 324,8{NB}nm.</>,
      tache: { type: 'qcm', q: 'Quelle technique est la mieux adaptée parmi les suivantes ?', ...QCM.choisir,
        expl: 'La raie du cuivre est dans l’ultraviolet : très peu d’atomes sont excités dans une flamme, l’émission est donc quasi nulle. L’absorption atomique, qui part du niveau fondamental, mesure très bien le cuivre.', indice: 'Souvenez-vous de la comparaison faite avec le sodium.' } },
    { id: 'bilan', titre: 'Le bilan : deux façons d’utiliser la flamme', focus: [],
      retenirTitre: 'À retenir : flamme, émission, absorption', retenir: <><SvgCarteDeux/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>Nébulisation, désolvatation, vaporisation, atomisation : on obtient des atomes libres.</li><li>SEF : la flamme excite les atomes, qui émettent ; seuls les éléments à raie peu énergétique (Na, K, Li) s’y prêtent.</li><li>SAA : une lampe à cathode creuse de l’élément ; A = −log(I / I₀) ; plus sensible car les atomes partent du fondamental.</li><li>Étalonnage : signal proportionnel à la concentration (domaine linéaire).</li></ul></>,
      texte: <>Vous savez décrire le trajet d’un échantillon dans la flamme, distinguer émission et absorption, exploiter un étalonnage et choisir la technique. En exploration, envoyez des photons un par un, photographiez les atomes de la flamme et changez d’élément ou de flamme ; deux défis vous attendent.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    if (Math.min(nv.etape, ORDRE.length - 1) !== Math.min(guide.etape, ORDRE.length - 1)) { setVie(() => ({ ...BASE(), ex: M.instantane(NA, 2500, N_ATOMES, Math.random) })); setP(0); }
    setGuide(nv);
  };
  const sc = idE;
  const nouvelInstantane = (el, T) => setVie(v => ({ ...v, cle: v.cle + 1, ex: M.instantane(el, T, N_ATOMES, Math.random) }));
  const avance = PLAGE[sc] ? PLAGE[sc][0] + p * (PLAGE[sc][1] - PLAGE[sc][0]) : p;
  const elGrille = sc === 'cuivre' ? CU : NA;
  const sceneGuide = !enGuide ? null
    : sc === 'trajet' || sc === 'atomi' ? <SceneTrajet p={avance} el={NA}/>
    : sc === 'niveaux' ? <SceneNiveauxFlamme mode="emission" el={NA} sc={1} p={p}/>
    : sc === 'emission' ? <SceneDispositif mode="emission" el={NA} p={p}/>
    : sc === 'boltzmann' || sc === 'cuivre' ? <SceneGrille el={elGrille} T={vie.T} ex={vie.ex} cle={vie.cle}/>
    : sc === 'absorption' ? <SceneDispositif mode="absorption" el={NA} p={p}/>
    : sc === 'sensible' ? <SceneNiveauxFlamme mode="absorption" el={NA} sc={1} p={p}/>
    : sc === 'etalonnage' ? <SceneEtalonnage el={NA} fl="acetylene" methode="absorption" cEch={0.62}/>
    : sc === 'flamme' ? <SceneEtalonnage el={CA} fl={vie.fl} methode="absorption" points={false} titre={`calcium, flamme ${M.flamme(vie.fl).nom}`}/>
    : null;
  const curs = (id, lab_, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: '#d97706' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const barreAnim = (<div style={{ marginTop: 6 }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => setAnim(a => !a)} aria-pressed={!anim} style={stylePetitBouton(!anim, '#334155')}>{anim ? '⏸ Pause' : '▶ Lecture'}</button>
      <label htmlFor="fm-p" style={{ ...libelle, margin: 0 }}>Avancement</label>
    </div>
    <input id="fm-p" type="range" min="0" max="100" step="1" value={Math.round(p * 100)} onChange={ev => { setAnim(false); setP(parseInt(ev.target.value, 10) / 100); }} aria-label="Avancement de l’animation" style={{ width: '100%', accentColor: '#d97706' }}/>
  </div>);
  const avecAnim = ['trajet', 'atomi', 'niveaux', 'emission', 'absorption', 'sensible'].includes(sc);
  const curseurGuide = !enGuide ? null
    : avecAnim ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{barreAnim}</div>
    : sc === 'boltzmann' || sc === 'cuivre' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{curs('fm-T', `Température de la flamme : ${vie.T} K (${vie.T - 273} °C)`, vie.T, 2000, 3500, 100, ev => { const T = parseInt(ev.target.value, 10); setVie(v => ({ ...v, T })); nouvelInstantane(elGrille, T); }, 'Chaque déplacement du curseur prend un nouvel instantané.')}
        <div style={{ marginTop: 8 }}><button onClick={() => nouvelInstantane(elGrille, vie.T)} style={styleBouton(false)}><Pic n="refresh"/>Nouvel instantané</button></div></div>
    : sc === 'flamme' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{selecteur('fm-fl', 'Flamme', vie.fl, ev => setVie(v => ({ ...v, fl: ev.target.value })), M.FLAMMES.map(f => ({ id: f.id, nom: `${f.nom} (≈ ${f.tC} °C)` })))}</div>
    : null;
  const lignesGuide = enGuide && (sc === 'boltzmann' || sc === 'cuivre') ? [['Élément', `${elGrille.nom} (${Math.round(elGrille.lam)}${NB}nm)`], ['Énergie de la raie', `${fr(M.energieEV(elGrille.lam), 2)}${NB}eV`], ['Atomes excités sur cet instantané', `${vie.ex.length}`], ['Moyenne attendue sur 10 000', `${fr(M.pourDixMille(elGrille, vie.T), M.pourDixMille(elGrille, vie.T) < 0.1 ? 4 : 1)}`]] : [];
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi({ ...M.tirageDefiEtalonnage(Math.random, kind), rep1: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => { const ok = Math.abs(num2(defi.rep1) - defi.vrai) <= 0.05 * defi.vrai; (defi.kind === 'emission' ? noterE : noterA)(ok); setDefi(x => ({ ...x, verifie: true, ok })); };
  const dEm = defi?.kind === 'emission';
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['emission', 'Émission (SEF)'], ['absorption', 'Absorption (SAA)']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#d97706')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{dEm ? 'Défi : doser par émission de flamme' : 'Défi : doser par absorption atomique'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>On dose le {defi.el.nom} ({defi.el.s}) d’une eau, dans le domaine linéaire. Un étalon à <strong>{fr(defi.c1, 1)}{NB}mg/L</strong> donne {dEm ? <>une intensité d’émission de <strong>{fr(defi.S1, 1)}{NB}u.a.</strong></> : <>une absorbance de <strong>{fr(defi.S1, 3)}</strong></>}. L’échantillon donne {dEm ? <><strong>{fr(defi.S, 1)}{NB}u.a.</strong></> : <>une absorbance de <strong>{fr(defi.S, 3)}</strong></>}. Quelle est sa concentration ? (2 chiffres significatifs ; précision attendue : 5 %).</div>
      <div style={{ marginTop: 8 }}><label htmlFor="fm-d1" style={libelle}>Concentration (mg/L)</label><input id="fm-d1" inputMode="decimal" value={defi.rep1} onChange={ev => maj({ rep1: ev.target.value })} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div>
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Le signal est proportionnel à la concentration : c = c<sub>étalon</sub> × S<sub>échantillon</sub> / S<sub>étalon</sub>.</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}Réponse : c = {fr(defi.c1, 1)} × {fr(defi.S, dEm ? 1 : 3)} / {fr(defi.S1, dEm ? 1 : 3)} ≈ {fr(defi.vrai, 2)}{NB}mg/L.
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#d97706')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const elT = M.element(tir.t.el), elE = M.element(ex.el), flE = M.flamme(ex.fl), cE = Math.min(ex.c, elE.cmax * 1.6);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{ex.onglet === 'tirages' ? 'Réglez la flamme et l’élément' : ex.onglet === 'trajet' ? 'Suivez une goutte' : 'Réglez l’étalonnage'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.onglet === 'tirages' ? 'En absorption, chaque photon est absorbé au hasard avec la probabilité 1 − T ; en émission, chaque atome est excité au hasard avec la probabilité de Boltzmann.' : ex.onglet === 'trajet' ? 'La goutte traverse quatre zones de la flamme. Choisissez l’élément pour voir la formule du sel dissous.' : 'Courbe réelle (trait plein), droite d’étalonnage au départ (pointillés) et point de l’échantillon.'}</div>
      {ex.onglet === 'tirages' && <>
        {selecteur('fm-tm', 'Technique', tir.t.methode, ev => tir.regler({ methode: ev.target.value }), [{ id: 'absorption', nom: 'Absorption atomique (SAA)' }, { id: 'emission', nom: 'Émission de flamme (SEF)' }])}
        {selecteur('fm-te', 'Élément', tir.t.el, ev => tir.regler({ el: ev.target.value, c: M.element(ev.target.value).cmax / 2.5 }), M.ELEMENTS.map(e => ({ id: e.s, nom: `${e.nom} (${Math.round(e.lam)} nm)` })))}
        {selecteur('fm-tf', 'Flamme', tir.t.fl, ev => tir.regler({ fl: ev.target.value }), M.FLAMMES.map(f => ({ id: f.id, nom: `${f.nom} (≈ ${f.tC} °C)` })))}
        {tir.t.methode === 'absorption' && selecteur('fm-tc', 'Concentration de l’échantillon', String(tir.t.c), ev => tir.regler({ c: parseFloat(ev.target.value) }), [0.2, 0.4, 0.6, 0.8, 1].map(f => ({ id: String(+(elT.cmax * f).toFixed(2)), nom: `${fr(elT.cmax * f, elT.cmax < 2 ? 1 : 0)} mg/L` })).concat(String(tir.t.c) !== '' && ![0.2, 0.4, 0.6, 0.8, 1].some(f => +(elT.cmax * f).toFixed(2) === tir.t.c) ? [{ id: String(tir.t.c), nom: `${fr(tir.t.c, 1)} mg/L` }] : []))}</>}
      {ex.onglet === 'trajet' && selecteur('fm-re', 'Élément', ex.el, ev => setEx(e => ({ ...e, el: ev.target.value })), M.ELEMENTS.map(e => ({ id: e.s, nom: `${e.nom} (${e.s})` })))}
      {ex.onglet === 'etalonnage' && <>
        {selecteur('fm-em', 'Technique', ex.methode, ev => setEx(e => ({ ...e, methode: ev.target.value })), [{ id: 'absorption', nom: 'Absorption atomique (SAA)' }, { id: 'emission', nom: 'Émission de flamme (SEF)' }])}
        {selecteur('fm-ee', 'Élément', ex.el, ev => setEx(e => ({ ...e, el: ev.target.value, c: M.element(ev.target.value).cmax / 2.5 })), M.ELEMENTS.map(e => ({ id: e.s, nom: `${e.nom} (${Math.round(e.lam)} nm)` })))}
        {selecteur('fm-ef', 'Flamme', ex.fl, ev => setEx(e => ({ ...e, fl: ev.target.value })), M.FLAMMES.map(f => ({ id: f.id, nom: `${f.nom} (≈ ${f.tC} °C)` })))}
        {curs('fm-ec', `Concentration de l’échantillon : ${fr(cE, 1)} mg/L`, cE, 0, +(elE.cmax * 1.6).toFixed(1), +(elE.cmax / 50).toFixed(2), ev => setEx(e => ({ ...e, c: parseFloat(ev.target.value) })), 'Au-delà de la plage d’étalonnage, la courbe s’écarte de la droite.')}</>}
      {ex.onglet === 'trajet' && <div style={{ marginTop: 8 }}>{barreAnim}</div>}
    </div>);
  const pilules = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {[['tirages', 'Atomes et tirages'], ['trajet', 'Trajet dans la flamme'], ['etalonnage', 'Étalonnage']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, onglet: k }))} aria-pressed={ex.onglet === k} style={stylePetitBouton(ex.onglet === k, '#d97706')}>{l}</button>)}
    </div>);
  const evtTexte = lotT ? `Bilan du dernier paquet : ${tir.etat.lotRes.n} ${em ? 'instantanés' : 'photons'}, ${tir.etat.lotRes.ex} ${em ? 'atomes excités en tout' : 'absorbés'}.` : `${scReel != null ? `Scénario ${scReel + 1} sur 2 : ` : ''}${demoSc != null ? 'scénario joué seul.' : texteEvenement(tir.t.methode, dernier) + '.'}`;
  const voletScene = (
    <div style={styleBoite}>
      {pilules}
      {ex.onglet === 'tirages' ? <>
        <div aria-hidden="true" style={{ fontSize: 14.5, fontWeight: 700, color: '#92400e', minHeight: 44, lineHeight: 1.4, marginBottom: 4 }}>{lotT ? 'Les tirages défilent trop vite pour être animés un par un : voici le bilan du dernier paquet. « × 10 » et « × 100 » montrent chaque tirage.' : (demoSc != null ? 'Scénario seul. ' : '') + legendeFlamme(tir.t.methode, scReel, pAff, elT)}</div>
        <div className="fm-at">
          {em && demoSc == null ? <SceneGrille el={elT} T={M.flamme(tir.t.fl).T} ex={lotT || !dernier ? [] : dernier.ex} cle={tir.etat.n}/> : <SceneNiveauxFlamme mode={tir.t.methode} el={elT} sc={scReel ?? 0} p={scReel == null ? 0 : pAff}/>}
          <PanneauScenariosFlamme t={tir.t} etat={tir.etat} courant={lotT || demoSc != null ? (demoSc ?? -1) : em ? -1 : (scReel != null && pAff >= 0.4 ? scReel : -1)} demo={tir.demo} prog={progT} tir={tir}/>
        </div>
        <div role="status" aria-live="polite" style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, margin: '4px 0 8px', minHeight: 42 }}>{evtTexte}</div>
        <CommandesTiragesFlamme tir={tir}/></>
      : ex.onglet === 'trajet' ? <><SceneTrajet p={p} el={elE}/></>
        : <><SceneDispositif mode={ex.methode} el={elE} p={p}/><div style={{ height: 6 }}/><SceneEtalonnage el={elE} fl={ex.fl} methode={ex.methode} cEch={cE} titre={`${elE.nom}, flamme ${flE.nom}`}/></>}
    </div>);
  const etN = tir.etat.n, expAt = M.pourDixMille(elT, M.flamme(tir.t.fl).T);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {ex.onglet === 'tirages' ? <>
        <LigneMesure nom="Raie de l’élément" valeur={`${fr(elT.lam, 1)}${NB}nm (${M.lectureCoul(elT.lam).replace(' (invisible)', '')}), ${fr(M.energieEV(elT.lam), 2)}${NB}eV`}/>
        <LigneMesure nom="Température de la flamme" valeur={`${M.flamme(tir.t.fl).T}${NB}K`}/>
        <LigneMesure nom="Atomes libres (flamme)" valeur={`${fr(100 * M.beta(elT, tir.t.fl), 0)}${NB}% du sel`}/>
        {em ? <><LigneMesure nom="Instantanés pris" valeur={`${etN}`}/><LigneMesure nom="Atomes excités sur 10 000 (attendu)" valeur={fr(expAt, expAt < 0.1 ? 4 : 1)}/>
          <LigneMesure nom="Atomes excités sur 10 000 (moyenne mesurée)" valeur={etN ? fr(tir.etat.nEx / etN, 2) : '—'}/></>
        : <><LigneMesure nom="Photons envoyés" valeur={`${etN}`}/><LigneMesure nom="Photons absorbés" valeur={`${tir.etat.nEx}`}/>
          <LigneMesure nom="Transmittance mesurée (transmis / envoyés)" valeur={etN ? `${fr(100 * (etN - tir.etat.nEx) / etN, 0)}${NB}%` : '—'}/>
          <LigneMesure nom="Absorbance mesurée" valeur={etN ? fr(-Math.log10(Math.max(etN - tir.etat.nEx, 0.5) / etN), 2) : '—'}/>
          <LigneMesure nom="Absorbance prévue" valeur={fr(M.absorbance(elT, tir.t.fl, tir.t.c), 2)}/></>}</>
      : ex.onglet === 'trajet' ? <>
        <LigneMesure nom="Sel dissous" valeur={ex.el === 'Na' || ex.el === 'K' || ex.el === 'Li' ? `${ex.el}Cl` : `${ex.el}Cl₂`}/>
        <LigneMesure nom="Étape en cours" valeur={`${M.etapeDe(p) + 1}. ${M.ETAPES_TRAJET[M.etapeDe(p)].nom}`}/>
        <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 6 }}>{M.ETAPES_TRAJET[M.etapeDe(p)].texte}</div></>
      : <>
        <LigneMesure nom="Raie" valeur={`${fr(elE.lam, 1)}${NB}nm, ${fr(M.energieEV(elE.lam), 2)}${NB}eV`}/><LigneMesure nom="Concentration de l’échantillon" valeur={`${fr(cE, 2)}${NB}mg/L`}/>
        {ex.methode === 'absorption' ? <><LigneMesure nom="Absorbance A" valeur={fr(M.absorbance(elE, ex.fl, cE), 3)}/><LigneMesure nom="Transmittance T" valeur={`${fr(100 * M.transmittance(elE, ex.fl, cE), 1)}${NB}%`}/></>
          : <LigneMesure nom="Intensité d’émission" valeur={`${fr(M.emission(elE, ex.fl, cE), M.emission(elE, ex.fl, cE) < 0.01 ? 6 : 1)}${NB}u.a.`}/>}
        <LigneMesure nom="Plage d’étalonnage" valeur={`0 à ${fr(elE.cmax, 0)}${NB}mg/L`}/></>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Atomes et tirages : en émission, élément sodium, passez de la flamme air-propane à la flamme protoxyde d’azote-acétylène. Que devient le nombre d’atomes excités ?</li>
      <li>Atomes et tirages : en émission, choisissez le cuivre ou le magnésium. Pourquoi ne voit-on presque jamais d’atome excité ?</li>
      <li>Atomes et tirages : en absorption, envoyez 1000 photons. Comparez la transmittance mesurée à celle qui est prévue (Mesures).</li>
      <li>Atomes et tirages : en absorption, doublez la concentration. Que devient la proportion de photons absorbés ?</li>
      <li>Étalonnage : choisissez le calcium en absorption ; passez de la flamme air-propane à la flamme la plus chaude. Que devient la pente ?</li>
      <li>Étalonnage : poussez la concentration au-delà de la plage. Pourquoi la courbe s’écarte-t-elle de la droite ?</li>
      <li>Étalonnage : comparez l’émission du sodium et du cuivre. Pour quelle technique le cuivre est-il mesurable ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Flamme : nébulisation, désolvatation, vaporisation, atomisation → atomes libres</li>
        <li>SEF : atomes excités par la flamme, puis photon émis ; I ∝ c, intensité très sensible à T (Boltzmann)</li>
        <li>SAA : lampe à cathode creuse de l’élément ; A = −log(I / I₀) ∝ c (Beer-Lambert)</li>
        <li>La SAA part du niveau fondamental : plus sensible et valable pour les raies UV (Cu, Mg)</li>
        <li>E(eV) = 1240 / λ(nm) ; flamme plus chaude : atomisation plus complète (Ca)</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Valeurs</strong> : ordres de grandeur arrondis (raies de résonance, températures de flamme : air-propane ≈ 2 200 K, air-acétylène ≈ 2 500 K, protoxyde d’azote-acétylène ≈ 3 000 K). Aucune ne remplace les données d’un constructeur ou d’un TP.</li>
      <li><strong>Excitation thermique</strong> : proportion d’atomes excités = (g*/g₀) · exp(−E / kT) (loi de Boltzmann), avec g*/g₀ = 3 pour Na, Li, K, Ca, Mg (les composantes du doublet sont confondues) et 2 pour Cu ; équilibre thermique supposé.</li>
      <li><strong>Atomisation</strong> : fraction d’atomes libres donnée par élément et par flamme, valeurs illustratives (Ca et Mg sont réfractaires : peu d’atomes libres dans les flammes froides).</li>
      <li><strong>Signaux</strong> : absorbance proportionnelle à la concentration et aux atomes libres, avec une légère courbure en fin de plage ; intensité d’émission proportionnelle à c × (atomes libres) × (atomes excités), avec autoabsorption en fin de plage. Unités arbitraires pour l’émission (100 pour 1 mg/L de sodium dans la flamme air-acétylène).</li>
      <li><strong>Tirages</strong> : en absorption, chaque photon est absorbé avec la probabilité 1 − 10^(−A), indépendamment des autres ; en émission, chaque atome libre d’un instantané de 10 000 est excité avec la probabilité de Boltzmann. Un atome excité émet un photon (rendement 1).</li>
      <li><strong>Hors modèle</strong> : ionisation (alcalins dans les flammes chaudes), interférences chimiques et spectrales, élargissement des raies, émission du fond, correction du fond, flammes riches ou pauvres, four en graphite.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fm-col { display: flex; flex-direction: column; gap: 12px; }
        .fm-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .fm-l1.cote .fm-carte { order: 2; } .fm-l1.cote .fm-main { order: 1; }
          .fm-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .fm-ex > * { grid-column: 1; }
          .fm-ex > .fm-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        .fm-at { display: grid; gap: 10px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .fm-at { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); } }
        .fm-sc { transition: background 0.3s, transform 0.3s; } .fm-sc.on { transform: scale(1.02); font-weight: 600; }
        @media (prefers-reduced-motion: reduce) { .fm-sc { transition: none; } .fm-sc.on { transform: none; } }
        @media (max-width: 900px) { .fm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fm-in { animation: fm-fondu 0.35s ease-out; } @keyframes fm-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Atomes dans une flamme : émission (SEF) et absorption (SAA)</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La flamme transforme la solution en <strong>atomes libres</strong>. On peut mesurer la lumière que ces atomes <strong>émettent</strong> (émission de flamme) ou la lumière d’une lampe qu’ils <strong>absorbent</strong> (absorption atomique). Dans les deux cas, le signal donne la concentration par étalonnage.</div>
      {enGuide && <div className="fm-l1 cote">
        <div className="fm-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="fm-main">
          <div className="fm-col">
            {sceneBloc && <div className="fm-in">{sceneBloc}</div>}
            {curseurGuide && <div className="fm-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="fm-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'emission' ? suiviE : suiviA}/></div>}
      {enExplore && <>
        <div className="fm-ex">
          {voletScene}
          <div className="fm-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
