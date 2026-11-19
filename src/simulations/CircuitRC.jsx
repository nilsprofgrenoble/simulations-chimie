import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./rcModele";
import { QCM_PARCOURS as Q, uC, uR, duC } from "./rcQcm";
import { SceneRC, GrapheRC, SvgCarteCondensateur, SvgCarteMaille, SvgCarteCharge, SvgCarteTau, SvgCarteDecharge, SvgCarteCapteur, SceneCapteur } from "./rcSchemas";

const SIM_ID = 174, CLE_GUIDE = 'rc-tg-guide-v1';
declarerDefis(SIM_ID, [['tau', 'Déterminer τ sur une acquisition bruitée'], ['rc', 'Retrouver C ou R à partir de τ']]);

// ====================================================
// SIM 174 — CIRCUIT RC : CHARGE ET DÉCHARGE D'UN CONDENSATEUR (TG spé PC, « Ondes et signaux », « Étudier la dynamique d'un système électrique »).
//  Une seule idée : charge et décharge d'un condensateur dans un circuit RC série soumis à une source idéale de tension ; temps caractéristique τ = RC.
//  Capacités visées (jamais affichées à l'élève) : relier l'intensité au débit de charges ; comportement capacitif, q = C u, ordres de grandeur de C ;
//  établir et résoudre l'équation différentielle de la charge et de la décharge ; temps caractéristique, le déterminer sur une courbe ;
//  capteurs capacitifs, réponse d'un dispositif modélisé par un dipôle RC.
//  Hors périmètre : étude énergétique, circuit RL, régime sinusoïdal. Modèle de calcul : rcModele.js (kΩ, µF, ms, mA, µC).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const nbt = t => nbf(t, t < 10 ? 2 : t < 1000 ? 1 : 0);                         // temps en ms
const BLEU = '#0369a1', VERT = '#15803d';
const IDS = ['armatures', 'debit', 'courant', 'maille', 'solution', 'verif', 'stationnaire', 'tau', 'soixante', 'courantInitial', 'decharge', 'trenteSept', 'acquisition', 'capteur', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
// valeurs de départ de chaque étape du parcours : R en kΩ, C en µF, E en V
const P0 = { R: 10, C: 10, E: 6, type: 'charge' }, P1 = { R: 4.7, C: 22, E: 6, type: 'charge' };
const PRESETS = IDS.map((id, k) => (id === 'capteur' ? { R: 10, C: 1, E: 6, type: 'charge' } : id === 'decharge' || id === 'trenteSept' ? { ...P1, type: 'decharge' } : k >= I.tau ? P1 : P0));
const ACQ = M.acquisitionGuide();
const C_CAPTEUR = [0.47, 1, 2.2, 4.7];

// ---------- formules (MathML) ----------
const expo = (arg) => <msup><mi>e</mi><mrow><mo>−</mo>{arg}</mrow></msup>;
// fraction de l'exposant : taille lisible (sans cela, MathML la réduit deux fois)
const gros = { mathDepth: 1, mathStyle: 'normal' };
const tSurRC = <mfrac style={gros}><mi>t</mi><mrow><mi>R</mi><mi>C</mi></mrow></mfrac>, tSurTau = <mfrac style={gros}><mi>t</mi><mi>τ</mi></mfrac>;
const dqdt = <mfrac><mrow><mi>d</mi><mi>q</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>;
const FDebit = <Formule><mi>i</mi><mo>=</mo><mfrac><mrow><mi>Δ</mi><mi>q</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac><mspace width="2em"/><mi>q</mi><mo>=</mo><mi>C</mi><mo>×</mo>{uC}</Formule>;
const FMaille1 = <Formule><mi>E</mi><mo>=</mo>{uR}<mo>+</mo>{uC}</Formule>;
const FMaille2 = <Formule>{uR}<mo>=</mo><mi>R</mi><mo>×</mo><mi>i</mi><mspace width="1.4em"/><mi>i</mi><mo>=</mo>{dqdt}<mo>=</mo><mi>C</mi><mo>×</mo>{duC}</Formule>;
const FEquCharge = <Formule><mi>R</mi><mi>C</mi><mo>×</mo>{duC}<mo>+</mo>{uC}<mo>=</mo><mi>E</mi></Formule>;
const FEquDecharge = <Formule><mi>R</mi><mi>C</mi><mo>×</mo>{duC}<mo>+</mo>{uC}<mo>=</mo><mn>0</mn></Formule>;
const FSolGen = <Formule>{uC}<mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mi>E</mi><mo>+</mo><mi>A</mi><mo>×</mo>{expo(tSurRC)}</Formule>;
const FChargeRC = <Formule>{uC}<mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mi>E</mi><mo>×</mo><mo>(</mo><mn>1</mn><mo>−</mo>{expo(tSurRC)}<mo>)</mo></Formule>;
const FChargeTau = <Formule>{uC}<mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mi>E</mi><mo>×</mo><mo>(</mo><mn>1</mn><mo>−</mo>{expo(tSurTau)}<mo>)</mo></Formule>;
const FDechargeTau = <Formule>{uC}<mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mi>E</mi><mo>×</mo>{expo(tSurTau)}</Formule>;
const FTau = <Formule><mi>τ</mi><mo>=</mo><mi>R</mi><mo>×</mo><mi>C</mi></Formule>;
const eRC = <FormuleEnLigne>{expo(tSurRC)}</FormuleEnLigne>;
const eqChargeLigne = <FormuleEnLigne><mi>R</mi><mi>C</mi><mo>×</mo>{duC}<mo>+</mo>{uC}<mo>=</mo><mi>E</mi></FormuleEnLigne>;
const eqDechargeLigne = <FormuleEnLigne><mi>R</mi><mi>C</mi><mo>×</mo>{duC}<mo>+</mo>{uC}<mo>=</mo><mn>0</mn></FormuleEnLigne>;
const eTau = <FormuleEnLigne>{expo(tSurTau)}</FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// contrôle du temps : curseur d'indice + boutons − / + (un doigt ne vise pas un cran) + rétablir + menu « aller à » facultatif
function ControleTemps({ valeur, max, onChange, texte, nom = 'Temps t', aller = null, joue = null, lancer = null, reduit = false, pasBouton = 1 }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt }}>{avecIndices(texte)}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label="Reculer un peu" onClick={() => onChange(Math.max(0, valeur - pasBouton))} style={btn}>−</button>
        <input type="range" min={0} max={max} step={1} value={Math.round(valeur)} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label="Avancer un peu" onClick={() => onChange(Math.min(max, valeur + pasBouton))} style={btn}>+</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button onClick={() => onChange(0)} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir (t = 0)</button>
        {lancer && <button onClick={lancer} style={stylePetitBouton(true, VERT)}>{reduit ? 'Avancer d’un cran' : joue ? 'Pause' : 'Lancer'}</button>}
        {aller}
      </div>
    </div>);
}

export function SimulationCircuitRC() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviT, noterT] = useCompteurDefi(), [suiviR, noterR] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('tau');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ comp: false, reperes: false, essayer: false, retenir: false });
  const [kS, setKS] = useState({}), [ovG, setOvG] = useState({}), [jG, setJG] = useState(0);        // parcours : position du curseur de temps (en 1/50 de τ), réglages modifiés par étape, point de l'acquisition
  const [ex, setEx] = useState({ type: 'charge', R: 4.7, C: 22, E: 6, k: 25, repTau: false, repTan: false, repCinq: false, courbes: 'u' });   // exploration
  const [jD, setJD] = useState(0);                                                                 // défi : point de l'acquisition
  const [joue, setJoue] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const k0Etape = idx === I.armatures || idx === I.decharge ? 0 : 40;   // t = 0 pour « condensateur déchargé » et « u_C(0) = E », comme l'annonce l'énoncé
  const kG = kS[idx] ?? k0Etape, setKG = f => setKS(o => ({ ...o, [idx]: typeof f === 'function' ? f(o[idx] ?? k0Etape) : f }));   // position du temps, propre à chaque étape
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- paramètres affichés ----------
  const PG = { ...PRESETS[Math.max(idx, 0)], ...(ovG[idx] || {}) };
  const modifie = enGuide && ovG[idx] && (ovG[idx].R !== undefined || ovG[idx].C !== undefined);
  let P;                       // { type, R, C, E, k }
  if (enGuide) P = { ...PG, k: kG };
  else if (dd) P = { type: 'charge', R: dd.R, C: dd.C, E: 6, k: 0 };
  else P = { type: ex.type, R: ex.R, C: ex.C, E: ex.E, k: ex.k };
  const T = M.tau(P.R, P.C), unitS = false;
  const acq = enGuide && idx === I.acquisition ? ACQ : dd && dd.type === 'tau' ? dd.acq : null;      // graphe d'acquisition (pas de circuit)
  const kMax = 300;
  const tFixe = enGuide && idx === I.capteur ? 6 * M.tau(P.R, C_CAPTEUR[C_CAPTEUR.length - 1]) : null;   // étape du capteur : axe du temps FIXE pour voir la courbe changer
  const tMax = acq ? acq.tmax : tFixe || 6 * T;
  const t = acq ? (acq.pts[enGuide ? jG : jD] || { t: 0 }).t : (tFixe ? (P.k / kMax) * tMax : P.k * T / 50);
  const ptCourant = acq ? acq.pts[enGuide ? jG : jD] : null;
  const u = M.uC(P.type, t, P.E, T), i = M.intensite(P.type, t, P.E, P.R, T);

  // ---------- lecture animée ----------
  const tickRef = useRef(null);
  useEffect(() => {
    tickRef.current = dt => {
      const k0 = enExplore ? ex.k : kG;
      if (k0 + dt * 50 >= kMax) setJoue(false);                  // arrêt automatique au bout de la plage de temps
      if (enExplore) setEx(s => (s.k >= kMax ? s : { ...s, k: Math.min(kMax, s.k + dt * 50) }));
      else if (enGuide) setKG(k => Math.min(kMax, k + dt * 50));
    };
  });
  useEffect(() => {
    if (!joue) return undefined;
    let raf, t0 = null;
    const boucle = tt => { if (t0 !== null) tickRef.current(Math.min(0.05, (tt - t0) / 1000)); t0 = tt; raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [joue]);
  const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lancer = () => {
    if (reduit) { if (enExplore) setEx(s => ({ ...s, k: Math.min(kMax, s.k + 50) })); else setKG(k => Math.min(kMax, k + 50)); return; }
    if (!joue && ((enExplore && ex.k >= kMax) || (enGuide && kG >= kMax))) { if (enExplore) setEx(s => ({ ...s, k: 0 })); else setKG(0); }
    setJoue(j => !j);
  };
  const changerMode = md => { setJoue(false); setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const setK = k => { if (enExplore) setEx(s => ({ ...s, k })); else setKG(k); };
  const allerA = m => setK(Math.min(kMax, m * 50));

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'armatures', titre: 'Des charges de signes opposés', focus: ['scene', 'curseurs'],
      texte: <>Un condensateur est formé de deux <strong>armatures</strong> conductrices en regard, séparées par un isolant. Il est relié à un générateur de tension E par un résistor R et un interrupteur K (position 1). À l’instant t = 0, K vient d’être fermé et le condensateur est déchargé. Déplacez le curseur du temps et observez les signes + et − portés par les armatures A et B.</>,
      tache: { type: 'qcm', q: 'Quand t augmente, que deviennent les charges portées par les deux armatures ?', options: Q.armatures.options, bonne: 0,
        expl: 'Des charges de signes opposés s’accumulent sur les armatures en regard : + sur A, − sur B. L’isolant empêche toute traversée, donc aucune charge ne passe de A à B : elles viennent des fils. Les deux armatures ne peuvent pas être positives toutes les deux : ce qui part de B arrive sur A.',
        indice: 'Regardez les signes sur A et sur B quand le curseur avance : sont-ils identiques ? Que fait leur nombre ?' } },
    { id: 'debit', titre: 'Intensité, débit de charges et q = C × u', focus: ['scene'],
      texte: <>L’intensité i du courant qui arrive sur l’armature A est le <strong>débit de charges</strong> : la charge q de A varie de Δq pendant Δt. La charge q d’un condensateur est proportionnelle à la tension u_C entre ses armatures ; le coefficient est la <strong>capacité</strong> C (en farads, F).{FDebit}Ici C = 10{NB}µF. Entre deux instants séparés de Δt = 10{NB}ms, la tension u_C passe de 1,0{NB}V à 1,5{NB}V.</>,
      tache: { type: 'num', q: 'Intensité moyenne i du courant pendant cette durée, en mA (2 chiffres significatifs)', unite: 'mA', vrai: 0.5, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Δu = 1,5 − 1,0 = 0,50 V (la charge varie comme la tension).', 'Δq = C × Δu = 10 µF × 0,50 V = 5,0 µC.', 'i = frac(Δq|Δt) = frac(5,0 µC|10 ms) = 0,50 mA (1 µC par ms = 1 mA).'],
        pieges: [[1.5, 'Vous avez utilisé u = 1,5 V au lieu de la variation Δu : c’est la charge qui VARIE (Δq = C × Δu) qui donne le débit.'], [5, 'C’est la variation de charge Δq en µC : il faut encore la diviser par la durée Δt.'], [2, 'Le rapport est inversé : i = frac(Δq|Δt), la charge divisée par la durée.'], [0.05, 'Δu divisée par Δt n’est pas une intensité : il faut Δq = C × Δu, puis Δq divisée par Δt.']],
        expl: 'Δq = C × Δu = 10 µF × 0,50 V = 5,0 µC ; i = frac(Δq|Δt) = frac(5,0 µC|10 ms) = 0,50 mA.',
        indice: 'D’abord la variation de charge Δq = C × Δu (µF × V = µC), puis i = Δq divisée par Δt (µC par ms = mA).' } },
    { id: 'courant', titre: 'Relier l’intensité à la tension u_C', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE CONDENSATEUR',
      retenir: <>
        <SvgCarteCondensateur/>
        <ul style={ULS}>
          <li>Un condensateur : <strong>deux armatures en regard</strong>, charges opposées +q et −q ; le courant ne traverse jamais l’isolant.</li>
          <li><strong>q = C × u</strong> (q en C, u en V, C en F) ; i = frac(Δq|Δt) : l’intensité est le débit de charges.</li>
          <li>Ordres de grandeur : <strong>µF</strong> en électronique, <strong>pF à nF</strong> pour les capteurs et écrans tactiles, jusqu’à quelques <strong>F</strong> pour un supercondensateur.</li>
          <li>Moyen de s’en souvenir : <strong>« ce que l’armature A gagne, l’armature B le perd »</strong>. Idée fausse : « les charges traversent l’isolant ». Vrai : elles s’accumulent sur les armatures.</li>
        </ul></>,
      texte: <>Le débit de charges se précise à chaque instant : l’intensité i du courant qui arrive sur l’armature A est la <strong>dérivée par rapport au temps</strong> de la charge q de cette armature, notée <FormuleEnLigne>{dqdt}</FormuleEnLigne>. La capacité C est constante et q = C × u_C. Il reste à écrire i en fonction de u_C.</>,
      tache: { type: 'qcm', q: 'Quelle relation lie l’intensité i à la tension u_C ?', options: Q.courant.options, bonne: 0,
        expl: <>Comme q = C × u_C avec C constante, la dérivée de q vaut C fois la dérivée de u_C : <FormuleEnLigne><mi>i</mi><mo>=</mo>{dqdt}<mo>=</mo><mi>C</mi><mo>×</mo>{duC}</FormuleEnLigne>. L’intensité est liée à la VARIATION de u_C, pas à sa valeur : tant que u_C ne varie plus, i est nulle même si le condensateur est chargé. i = C × u_C confond i et q ; q / C donne une tension, pas un courant ; le signe moins correspond à une flèche de i dans l’autre sens.</>,
        indice: 'i est la dérivée de q ; remplacez q par C × u_C (C est une constante qui sort de la dérivée).' } },
    { id: 'maille', titre: 'Loi des mailles et équation différentielle', focus: ['scene'],
      texte: <>Les tensions sont maintenant fléchées (flèches bleues pour u_R et u_C, convention récepteur : flèche de tension à l’opposé de celle du courant). La loi des mailles donne :{FMaille1}La loi d’Ohm donne u_R = R × i. En utilisant la relation entre i et u_C trouvée à l’étape précédente, exprimez u_R en fonction de u_C, puis écrivez l’équation vérifiée par u_C.</>,
      tache: { type: 'qcm', q: 'Quelle équation différentielle vérifie u_C pendant la charge ?', options: Q.maille.options, bonne: 0,
        expl: <>On remplace u_R = R × i = R × C × <FormuleEnLigne>{duC}</FormuleEnLigne> dans E = u_R + u_C : on obtient {eqChargeLigne}. Les autres écritures oublient C dans le terme dérivé, mettent le produit RC sur u_C, ou changent le signe de u_C : aucune ne vient de la loi des mailles.</>,
        indice: <>Partez de E = u_R + u_C, remplacez u_R par R × i, puis i par <FormuleEnLigne><mi>C</mi><mo>×</mo>{duC}</FormuleEnLigne> (relation de l’étape précédente).</> } },
    { id: 'solution', titre: 'Résoudre l’équation différentielle', focus: ['scene'],
      retenirTitre: 'À RETENIR : L’ÉQUATION DE LA CHARGE',
      retenir: <>
        <SvgCarteMaille/>
        <ul style={ULS}>
          <li>Loi des mailles : <strong>E = u_R + u_C</strong>, avec u_R = R × i et i = C × <FormuleEnLigne>{duC}</FormuleEnLigne>.</li>
          <li>Équation de la charge : {FEquCharge}C’est une équation différentielle du premier ordre, à coefficients constants.</li>
          <li>Exemple : E = 6,0 V, R = 10 kΩ, C = 10 µF ; le coefficient RC de la dérivée est un temps.</li>
          <li>Moyen de s’en souvenir : <strong>« E = tension du résistor + tension du condensateur »</strong>. Idée fausse : « u_C vaut E dès le début ». Vrai : u_C part de 0 et ne varie pas brusquement.</li>
        </ul></>,
      texte: <>La solution est la somme d’une solution particulière (la constante u_C = E) et de la solution de l’équation sans second membre, de la forme A × {eRC}, où A est une constante :{FSolGen}La constante A est fixée par la condition initiale : le condensateur est déchargé, donc u_C(0) = 0.</>,
      tache: { type: 'qcm', q: 'Que vaut la constante A ?', options: Q.solution.options, bonne: 0,
        expl: 'À t = 0, e⁰ = 1 donc u_C(0) = E + A. Comme u_C(0) = 0, il faut A = −E. A = E donnerait u_C(0) = 2E ; A = 0 donnerait u_C(0) = E, alors que le condensateur est déchargé ; E divisée par RC n’a pas l’unité d’une tension.',
        indice: 'À t = 0, l’exponentielle vaut 1. Écrivez u_C(0) = E + A et imposez u_C(0) = 0.' } },
    { id: 'verif', titre: 'Vérifier une fonction candidate', focus: ['scene'],
      texte: <>La constante A = −E conduit à la solution de la charge :{FChargeRC}Pour savoir si une fonction est solution d’une équation différentielle, on la dérive et on remplace dans l’équation. Testez ce réflexe sur une fonction proche, la fonction u_C(t) = E × {eRC}, dans l’équation de la charge {eqChargeLigne}.</>,
      tache: { type: 'qcm', q: <>La fonction u_C(t) = E × {eRC} est-elle solution de l’équation de la charge ?</>, options: Q.verif.options, bonne: 0,
        expl: <>Si u_C = E × {eRC}, alors <FormuleEnLigne><mi>R</mi><mi>C</mi><mo>×</mo>{duC}<mo>=</mo><mo>−</mo>{uC}</FormuleEnLigne> : le membre de gauche <FormuleEnLigne><mi>R</mi><mi>C</mi><mo>×</mo>{duC}<mo>+</mo>{uC}</FormuleEnLigne> vaut 0, et non E. Cette fonction est la solution de la DÉCHARGE (second membre nul), pas de la charge. La fonction E × (1 − {eRC}) donne bien E.</>,
        indice: <>Dérivez u_C(t) = E × {eRC} : la dérivée de {eRC} est −<FormuleEnLigne><mfrac><mn>1</mn><mrow><mi>R</mi><mi>C</mi></mrow></mfrac></FormuleEnLigne> × {eRC}. Calculez ensuite <FormuleEnLigne><mi>R</mi><mi>C</mi><mo>×</mo>{duC}<mo>+</mo>{uC}</FormuleEnLigne> et comparez à E.</> } },
    { id: 'stationnaire', titre: 'Régime transitoire et régime stationnaire', focus: ['scene', 'graphe', 'curseurs'],
      retenirTitre: 'À RETENIR : LA TENSION AUX BORNES DU CONDENSATEUR',
      retenir: <>
        <SvgCarteCharge/>
        <ul style={ULS}>
          <li>Charge, avec u_C(0) = 0 : {FEquCharge}a pour solution {FChargeRC}</li>
          <li><strong>Régime transitoire</strong> : u_C varie ; <strong>régime stationnaire</strong> : u_C ne varie plus.</li>
          <li>Moyen de s’en souvenir : <strong>« 1 − exponentielle : on part de 0 et on tend vers E »</strong>. Idée fausse : « u_C atteint E à un instant précis ». Vrai : elle s’en approche sans jamais l’atteindre exactement.</li>
        </ul></>,
      texte: <>Le graphique montre la tension u_C (E = 6,0{NB}V). Pendant que u_C varie, on est en <strong>régime transitoire</strong> ; quand elle ne varie plus, en <strong>régime stationnaire</strong>. Faites avancer t jusqu’au bout.</>,
      tache: { type: 'qcm', q: 'En régime stationnaire, quelle est l’intensité i du courant dans le circuit ?', options: Q.stationnaire.options, bonne: 0,
        expl: 'i = C × frac(du|dt) : en régime stationnaire u_C est constante, donc i = 0, et u_R = R × i = 0. L’intensité vaut frac(E|R) seulement au tout début de la charge, pas à la fin. Elle n’est pas négative : tant que E reste appliquée, le condensateur ne se décharge pas dans le générateur.',
        indice: 'Regardez la courbe : que fait u_C à la fin ? Rappel : i = C × la dérivée de u_C.' } },
    { id: 'tau', titre: 'Le temps caractéristique τ = R × C', focus: ['scene', 'curseurs'],
      texte: <>La solution fait apparaître le produit τ = R × C, le <strong>temps caractéristique</strong> du dipôle RC : {FChargeTau}Les menus R et C sont apparus. On prend R = 4,7{NB}kΩ et C = 22{NB}µF.{FTau}</>,
      tache: { type: 'num', q: 'Valeur de τ, en ms', unite: 'ms', vrai: 103.4, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['R = 4,7 kΩ = 4,7×10³ Ω ; C = 22 µF = 22×10⁻⁶ F.', 'τ = R × C = 4,7×10³ × 22×10⁻⁶ = 0,1034 s = 103 ms.', 'Unité : ohm × farad = seconde (Ω·F = s) ; en pratique, kΩ × µF = ms.'],
        pieges: [[103400, 'Vous avez multiplié 4,7 par 22 puis ajouté trois zéros par erreur : 4,7 kΩ × 22 µF = 103 ms ; contrôlez les préfixes (kΩ × µF = ms).'], [26.7, 'Il faut multiplier R par C, pas les additionner.'], [4.7 / 22, 'Il faut multiplier R par C, pas les diviser.'], [4.7 * 22 * 1e-6, 'Vous avez converti C en farads mais pas R en ohms : R = 4,7×10³ Ω.']],
        expl: 'τ = R × C = 4,7×10³ Ω × 22×10⁻⁶ F = 0,1034 s ≈ 103 ms. Ω × F = s : τ est bien une durée.',
        indice: 'τ = R × C avec R en Ω et C en F donne des secondes ; ou bien kΩ × µF donne directement des millisecondes.' } },
    { id: 'soixante', titre: 'Où en est u_C au bout de τ, pendant la charge ?', focus: ['scene', 'mesures', 'curseurs'],
      texte: <>Le tableau Mesures donne maintenant u_C à l’instant choisi. Avec le menu « Aller à », placez t = τ et lisez u_C. Rappel : E = 6,0{NB}V et τ = 103{NB}ms.</>,
      tache: { type: 'num', q: 'À t = τ, quel pourcentage de E la tension u_C a-t-elle atteint ? (en %)', unite: '%', vrai: 63.2, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['u_C(τ) = E × (1 − e⁻¹) = 0,632 × E.', 'Avec E = 6,0 V : u_C(τ) = 3,8 V, soit frac(3,8|6,0) = 63 % de E.'],
        pieges: [[36.8, 'Ce sont les 37 % de la décharge (e⁻¹). Ici le condensateur se charge : u_C = E × (1 − e⁻¹).'], [50, 'La moitié de E est atteinte plus tôt, à t = 0,69 τ : à t = τ, on a dépassé 50 %.'], [86.5, 'C’est la valeur à t = 2 τ : vérifiez que le curseur est bien en t = τ.'], [100, 'La charge n’est jamais complète en un temps fini : à t = τ il reste encore une partie de E à atteindre.']],
        expl: 'u_C(τ) = E × (1 − e⁻¹) = 0,632 × E : au bout d’un temps τ, 63 % de la tension finale est atteinte.',
        indice: 'Placez t = τ avec le menu, lisez u_C (en V) dans Mesures, puis calculez le rapport u_C divisée par E, exprimé en pourcentage.' } },
    { id: 'courantInitial', titre: 'L’intensité au début de la charge', focus: ['scene', 'graphe'],
      retenirTitre: 'À RETENIR : LE TEMPS CARACTÉRISTIQUE τ',
      retenir: <>
        <SvgCarteTau/>
        <ul style={ULS}>
          <li><strong>τ = R × C</strong> : ohm × farad = <strong>seconde</strong> (en pratique kΩ × µF = ms).</li>
          <li>Charge : à t = τ, u_C = <strong>63 %</strong> de E ; la tangente à l’origine coupe l’asymptote E à t = τ ; à t = 5τ, <strong>99 %</strong> : la charge est pratiquement terminée.</li>
          <li>Exemple : R = 4,7 kΩ, C = 22 µF, τ = 103 ms, donc durée de charge ≈ 5τ ≈ 0,5 s.</li>
          <li>Moyen de s’en souvenir : <strong>« τ : 63 en charge, 37 en décharge, et 63 + 37 = 100 »</strong>. Idée fausse : « plus de résistance, charge plus rapide ». Vrai : τ = R × C augmente avec R : la charge est plus lente.</li>
        </ul></>,
      texte: <>La courbe de l’intensité i(t) est apparue sous celle de u_C (sans graduation sur son axe vertical). Les repères τ et 63 % sont tracés. Au tout début de la charge, à t = 0, le condensateur est déchargé : u_C(0) = 0. Appliquez la loi des mailles E = u_R + u_C à cet instant, avec E = 6,0{NB}V et R = 4,7{NB}kΩ.</>,
      tache: { type: 'num', q: 'Intensité i(0) à t = 0, en mA (2 chiffres significatifs)', unite: 'mA', vrai: 6 / 4.7, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['À t = 0 : u_C(0) = 0, donc u_R(0) = E − u_C(0) = E = 6,0 V.', 'u_R = R × i, donc i(0) = frac(E|R) = frac(6,0 V|4,7 kΩ) = 1,3 mA (V divisés par kΩ donnent des mA).'],
        pieges: [[28.2, 'Vous avez multiplié E par R : la loi d’Ohm donne u_R = R × i, donc i = frac(u_R|R).'], [6 / 22, 'Vous avez divisé E par la capacité C : l’intensité s’obtient avec la résistance R.'], [4.7 / 6, 'Le rapport est inversé : i = frac(u_R|R), pas R divisée par u_R.'], [0, 'À t = 0, l’intensité n’est pas nulle : c’est le moment où elle est maximale, car u_R = E.']],
        expl: 'À t = 0, u_C = 0 donc u_R = E : i(0) = frac(E|R) = frac(6,0|4,7) = 1,28 mA ≈ 1,3 mA. Ensuite i décroît, comme u_R = E − u_C.',
        indice: 'À t = 0, u_C(0) = 0 : que vaut alors u_R d’après E = u_R + u_C ? Puis appliquez la loi d’Ohm u_R = R × i.' } },
    { id: 'decharge', titre: 'La décharge : une autre équation', focus: ['scene'],
      texte: <>Le condensateur est chargé : u_C(0) = E. On bascule K en position 2 : le générateur est retiré du circuit, il ne reste que R et C. La loi des mailles s’écrit 0 = u_R + u_C. Avec u_R = R × i et i = C × la dérivée de u_C, on obtient l’équation de la décharge. Faites avancer le temps et observez les signes sur les armatures.</>,
      tache: { type: 'qcm', q: 'Quelle équation vérifie u_C pendant la décharge ?', options: Q.decharge.options, bonne: 0,
        expl: <>Sans générateur, la loi des mailles donne 0 = u_R + u_C, donc {eqDechargeLigne} (second membre nul). Le second membre E n’existe qu’en charge ; le signe − donnerait une croissance sans fin ; u_C n’est pas nulle à chaque instant : le condensateur garde sa charge au début et la perd progressivement.</>,
        indice: 'Même démarche que pour la charge, mais le générateur n’est plus dans la maille : à quoi se réduit la somme des tensions ?' } },
    { id: 'trenteSept', titre: 'Où en est u_C au bout de τ, pendant la décharge ?', focus: ['scene', 'mesures', 'curseurs'],
      texte: <>La solution de l’équation de la décharge, avec u_C(0) = E, est la suivante.{FDechargeTau}Utilisez le menu « Aller à » pour placer t = τ et lisez u_C dans Mesures. Rappel : E = 6,0{NB}V et τ = 103{NB}ms. Remarquez aussi le signe de l’intensité i.</>,
      tache: { type: 'num', q: 'À t = τ, quel pourcentage de E la tension u_C vaut-elle encore ? (en %)', unite: '%', vrai: 36.8, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['u_C(τ) = E × e⁻¹ = 0,368 × E.', 'Avec E = 6,0 V : u_C(τ) = 2,2 V, soit frac(2,2|6,0) = 37 % de E.'],
        pieges: [[63.2, 'Ce sont les 63 % de la charge. En décharge, u_C(τ) = E × e⁻¹, il reste donc 37 % de E.'], [50, 'La moitié de E est atteinte à t = 0,69 τ, avant t = τ : à t = τ, il reste moins de la moitié.'], [13.5, 'C’est la valeur à t = 2 τ : vérifiez que le curseur est bien en t = τ.'], [0, 'La décharge n’est jamais complète en un temps fini : à t = τ, il reste 37 % de E.']],
        expl: 'u_C(τ) = E × e⁻¹ = 0,368 × E : au bout de τ, il reste 37 % de la tension initiale. L’intensité i est négative : en décharge, le courant réel circule dans le sens contraire à celui du sens choisi pour i.',
        indice: 'Placez t = τ avec le menu, lisez u_C (en V) dans Mesures, puis calculez u_C divisée par E, en pourcentage.' } },
    { id: 'acquisition', titre: 'Déterminer τ sur une acquisition', focus: ['graphe', 'curseurs'],
      retenirTitre: 'À RETENIR : LA DÉCHARGE',
      retenir: <>
        <SvgCarteDecharge/>
        <ul style={ULS}>
          <li>Équation de la décharge : {FEquDecharge}Avec u_C(0) = E : {FDechargeTau}</li>
          <li>À t = τ, u_C = <strong>37 %</strong> de E ; à t = 5τ, moins de 1 % : la décharge est pratiquement terminée. L’intensité est <strong>négative</strong> (sens choisi pour i en convention récepteur).</li>
          <li>Moyen de s’en souvenir : <strong>« charge : 1 − e⁻¹ = 63 % ; décharge : e⁻¹ = 37 % »</strong>. Idée fausse : « en décharge, i est positive ». Vrai : le courant réel va en sens inverse du sens de i choisi, donc i &lt; 0.</li>
        </ul></>,
      texte: <>Une carte d’acquisition a enregistré la tension aux bornes d’un condensateur pendant sa charge sous E = 5,0{NB}V (points bruités ; R et C sont inconnus ; ces points sont simulés par ordinateur). Déplacez le curseur de mesure le long de la courbe et déterminez τ.</>,
      tache: { type: 'num', q: 'Temps caractéristique τ de ce circuit, en ms', unite: 'ms', vrai: ACQ.tau, tol: M.TOL_TAU, affiche: v => nbf(v, 1),
        calcul: () => ['À t = τ, u_C = 63 % de E (charge) : 0,63 × 5,0 V = 3,2 V.', 'On cherche la date t à laquelle les points atteignent 3,2 V : environ 4,7 ms.', 'Le bruit rend la lecture un peu incertaine : on accepte ± 15 %.'],
        pieges: [[ACQ.tau * 5, 'Vous avez lu la date où la courbe atteint environ 99 % de E : c’est 5τ, pas τ.'], [ACQ.tau * 0.5, 'À 37 % de E, vous avez lu une date trop courte : en charge, τ correspond à 63 % de E.'], [ACQ.tau * 2, 'Vérifiez le niveau : à 86 % de E on lit 2τ ; τ correspond à 63 % de E.']],
        expl: 'On lit la date à laquelle u_C atteint 63 % de E : 0,63 × 5,0 V = 3,2 V, vers t = 4,7 ms. Donc τ ≈ 4,7 ms (avec une incertitude liée au bruit des points).',
        indice: 'En charge, u_C(τ) = 63 % de E. Calculez 0,63 × E, puis cherchez avec le curseur la date où les points passent par cette valeur.' } },
    { id: 'capteur', titre: 'Un capteur capacitif de niveau', focus: ['scene', 'curseurs'],
      texte: <>Dans un capteur capacitif de niveau, deux électrodes plongent dans une cuve : plus le liquide monte, plus la capacité C du condensateur ainsi formé augmente. Le capteur est monté en série avec un résistor R fixe (10{NB}kΩ), sous E = 6,0{NB}V. (Les capacités d’un vrai capteur sont plutôt de l’ordre du pF au nF ; elles sont agrandies ici pour voir les courbes.) Le menu C simule une montée du niveau : choisissez des valeurs de plus en plus grandes et regardez la charge, l’échelle de temps restant la même.</>,
      tache: { type: 'qcm', q: 'Le niveau monte (C augmente). Comment évolue la durée nécessaire pour que u_C atteigne 63 % de E ?', options: Q.capteur.options, bonne: 0,
        expl: 'La durée pour atteindre 63 % de E est τ = R × C : avec R fixe, elle augmente avec C, donc avec le niveau. Un microcontrôleur peut mesurer cette durée et en déduire C, donc le niveau. La tension finale E ne change pas, mais elle n’est pas atteinte plus vite avec un plus grand C : un condensateur plus gros se charge plus lentement.',
        indice: 'Le niveau monte, donc C augmente. R reste fixe : que devient τ = R × C ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : UN CAPTEUR CAPACITIF',
      retenir: <>
        <SvgCarteCapteur/>
        <ul style={ULS}>
          <li>Capteur capacitif : la grandeur mesurée (niveau, position d’un doigt, accélération, distance) fait varier <strong>C</strong> ; le dipôle RC la traduit en durée : <strong>τ = R × C</strong>.</li>
          <li>Un microcontrôleur mesure le temps de charge (par exemple jusqu’à 63 % de E) et en déduit C, donc la grandeur.</li>
          <li>Moyen de s’en souvenir : <strong>« grandeur ↑, C ↑, τ ↑ : le capteur mesure un temps »</strong>. Idée fausse : « une grande capacité charge plus vite ». Vrai : à R fixe, elle charge plus lentement.</li>
        </ul></>,
      texte: <>Vous savez relier l’intensité au débit de charges, utiliser q = C × u_C, établir l’équation différentielle de la charge et de la décharge d’un circuit RC et leurs solutions, interpréter le temps caractéristique τ = R × C (63 %, 37 %, 5τ) et le déterminer sur une courbe. Passez à l’exploration (R, C, E et repères réglables) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'tau') { const a = M.tirageAcquisition(); setDefi({ ...a, type, acq: a, rep: '', verifie: false }); }
    else { const d = M.tirageRC(); setDefi({ ...d, type, rep: '', rep2: '', verifie: false }); }
    setJD(0); setJoue(false);
  };
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const verifier = () => {
    const x = lireNombre(defi.rep);
    const ok1 = defi.type === 'tau' ? isFinite(x) && Math.abs(x - defi.tau) <= M.TOL_TAU * defi.tau : isFinite(x) && Math.abs(x - defi.vrai) <= 0.06 * defi.vrai;
    const x2 = lireNombre(defi.rep2 || ''), ok2 = defi.type === 'tau' ? true : isFinite(x2) && Math.abs(x2 - defi.qVrai) <= 0.08 * defi.qVrai;
    const ok = ok1 && ok2;
    setDefi(d => ({ ...d, verifie: true, ok, ok1, ok2, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'tau' ? noterT : noterR)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle = 'rep', unite = null) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{aria} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('rc-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? ((cle === 'rep' ? defi.ok1 : defi.ok2) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite || (defi.type === 'tau' ? 'ms' : defi.unite)}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['tau', 'Déterminer τ'], ['rc', 'Retrouver C ou R']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'tau' ? 'Défi : quel est le temps caractéristique de ce circuit ?' : `Défi : quelle ${defi.cherche === 'C' ? 'capacité' : 'résistance'} pour ce temps caractéristique ?`}</div>
      {defi.type === 'tau' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une carte d’acquisition a enregistré la tension u_C aux bornes d’un condensateur pendant sa <strong>{defi.acq.type === 'charge' ? 'charge' : 'décharge'}</strong> à travers un résistor, avec une source de tension <strong>E = {nbf(defi.acq.E, 1)}{NB}V</strong> (points bruités, simulés par ordinateur ; R et C sont inconnus). Déplacez le curseur de mesure et déterminez le temps caractéristique τ, en ms (marge acceptée : 15{NB}%).</div>
        {champ('τ')}
        <IndiceDefi cache={false}>{defi.acq.type === 'charge'
          ? 'En charge, u_C atteint 63 % de E à t = τ : calculez 0,63 × E, puis cherchez la date où les points passent par cette valeur.'
          : 'En décharge, u_C est tombée à 37 % de E à t = τ : calculez 0,37 × E, puis cherchez la date où les points passent par cette valeur.'}</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On mesure le temps caractéristique d’un dipôle RC : <strong>τ = {nbf(defi.tauAff, defi.tauAff < 10 ? 1 : 0)}{NB}ms</strong>. {defi.cherche === 'C' ? <>La résistance vaut <strong>R = {nbf(defi.R, defi.R < 10 ? 1 : 0)}{NB}kΩ</strong>. Calculez la capacité C, en µF</> : <>La capacité vaut <strong>C = {nbf(defi.C, defi.C < 1 ? 2 : defi.C < 10 ? 1 : 0)}{NB}µF</strong>. Calculez la résistance R, en kΩ</>}, avec 2 chiffres significatifs (marge acceptée : 6{NB}%).</div>
        {champ(defi.cherche)}
        <div style={{ ...lbl, margin: '4px 0 8px' }}><strong>Deuxième question.</strong> Le condensateur est ensuite chargé sous <strong>E = {nbf(defi.E, 0)}{NB}V</strong> jusqu’à la fin du régime transitoire{defi.cherche === 'C' ? <> (utilisez la capacité C que vous venez de trouver)</> : <> (avec C = {nbf(defi.C, defi.C < 1 ? 2 : defi.C < 10 ? 1 : 0)}{NB}µF)</>}. Calculez la charge q de l’armature A, en µC, avec 2 chiffres significatifs (marge acceptée : 8{NB}%).</div>
        {champ('q', 'rep2', 'µC')}
        <IndiceDefi cache={false}><strong>Question 1</strong> : τ = R × C, donc {defi.cherche === 'C' ? 'C = τ divisée par R' : 'R = τ divisée par C'}. Avec τ en ms et {defi.cherche === 'C' ? 'R en kΩ, C sort en µF' : 'C en µF, R sort en kΩ'} (1 ms = 1 kΩ × 1 µF). <strong>Question 2</strong> : en fin de charge, u_C = E, donc q = C × E (µF × V = µC) ; gardez un chiffre de plus dans la valeur de C pour calculer.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="rc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {(defi.ok ? '✓ Correct. ' : defi.type === 'rc' ? `✗ Pas tout à fait (${defi.ok1 ? 'question 1 juste' : 'question 1 à revoir'}, ${defi.ok2 ? 'question 2 juste' : 'question 2 à revoir'}). ` : '✗ Pas tout à fait. ') + (defi.ok || (defi.essais || 0) >= 2
          ? (defi.type === 'tau' ? `Le montage avait R = ${nbf(defi.acq.R, defi.acq.R < 10 ? 1 : 0)} kΩ et C = ${nbf(defi.acq.C, defi.acq.C < 1 ? 2 : defi.acq.C < 10 ? 1 : 0)} µF : τ = R × C = ${nbf(defi.tau, defi.tau < 10 ? 2 : 1)} ms (marge acceptée : 15 %).`
            : `${defi.cherche} = frac(τ|${defi.cherche === 'C' ? 'R' : 'C'}) = frac(${nbf(defi.tauAff, defi.tauAff < 10 ? 1 : 0)} ms|${nbf(defi.cherche === 'C' ? defi.R : defi.C, 2).replace(/,?0+$/, '')} ${defi.cherche === 'C' ? 'kΩ' : 'µF'}) = ${nbf(defi.vrai, defi.vrai < 10 ? 2 : 1)} ${defi.unite} (marge acceptée : 6 %) ; q = C × E = ${nbf(defi.Cq, defi.Cq < 1 ? 2 : defi.Cq < 10 ? 1 : 0)} µF × ${nbf(defi.E, 0)} V = ${nbf(defi.qVrai, defi.qVrai < 10 ? 2 : 1)} µC (marge acceptée : 8 %).`)
          : (defi.type === 'tau' ? 'Repérez la date où u_C atteint le bon pourcentage de E, et vérifiez à nouveau (l’indice peut vous aider).' : 'Revoyez τ = R × C, les unités (kΩ × µF = ms) et q = C × E (µF × V = µC), puis vérifiez à nouveau (l’indice peut vous aider).'))}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Source idéale de tension</strong> : E constante, sans résistance interne. <strong>Résistor idéal</strong> (loi d’Ohm u_R = R × i). <strong>Fils de résistance nulle</strong>, interrupteur idéal commuté à t = 0.</li>
      <li><strong>Condensateur idéal</strong> : q = C × u_C avec C constante, sans fuite entre les armatures. Il est <strong>initialement déchargé</strong> en charge (u_C(0) = 0) et chargé sous E au début de la décharge (u_C(0) = E).</li>
      <li><strong>Conventions de signe</strong> : i est orienté vers l’armature A (celle de la charge q) ; u_C = V_A − V_B (flèche vers A) ; convention récepteur pour R et C (flèche de tension à l’opposé de celle du courant) ; E est fléchée de la borne − vers la borne +. En décharge, i est donc négative : le courant réel circule en sens inverse du sens choisi.</li>
      <li><strong>Notations simplifiées</strong> : u_C désigne u_C(t) ; l’exponentielle {eTau} a pour base e ≈ 2,718 ; i(t) est un courant « lent » (régime quasi continu à chaque instant).</li>
      <li><strong>Régimes</strong> : le régime transitoire dure théoriquement indéfiniment ; on dit qu’il est pratiquement terminé à partir de 5 τ (99 % de E atteints en charge, moins de 1 % de E restant en décharge). <strong>Deux critères, tous deux justes</strong> : ici, 5τ (99 %) = régime pratiquement atteint ; en TSTL (temps de réponse), on prend 3τ (95 %).</li>
      <li><strong>Ordres de grandeur</strong> : R de 1 kΩ à 100 kΩ et C de 0,1 µF à 100 µF (travaux pratiques) ; un vrai capteur capacitif a plutôt C de l’ordre du pF au nF. Les valeurs sont des valeurs usuelles de laboratoire, non des valeurs imposées.</li>
      <li><strong>Mesures et acquisitions</strong> : les valeurs affichées sont calculées par le modèle (elles ne sont pas des mesures indépendantes) ; les points « mesurés » des défis sont simulés avec un bruit aléatoire de 0,8 % de E : la lecture de τ sur ces points est incertaine (marge acceptée : 15 %).</li>
      <li><strong>Chiffres significatifs</strong> : les données sont à 2 chiffres significatifs ; les résultats demandés aussi (marge de 5 à 6 % sur les calculs).</li>
      <li><strong>Hors périmètre</strong> : étude énergétique, circuit RL et régime sinusoïdal ne sont pas traités ici.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène et graphe ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const valeursTxt = dd && dd.type === 'rc' ? `τ = ${nbf(dd.tauAff, dd.tauAff < 10 ? 1 : 0)} ms ; ${dd.cherche === 'C' ? `R = ${nbf(dd.R, dd.R < 10 ? 1 : 0)} kΩ ; C = ?` : `C = ${nbf(dd.C, dd.C < 1 ? 2 : dd.C < 10 ? 1 : 0)} µF ; R = ?`}`
    : `E = ${nbf(P.E, 1)} V · R = ${nbf(P.R, P.R < 10 ? 1 : 0)} kΩ · C = ${nbf(P.C, P.C < 1 ? 2 : P.C < 10 ? 1 : 0)} µF`;
  const fracPlaques = dd && dd.type === 'rc' ? 0.5 : u / P.E;
  const ariaScene = `Circuit RC série : générateur de tension E, interrupteur K en position ${P.type === 'charge' ? '1 (charge)' : '2 (décharge)'}, résistor R et condensateur C. ${valeursTxt}.`;
  const montreCircuit = !acq && !(dd && dd.type === 'tau');
  const flechesScene = (enGuide ? idx >= I.maille : !dd) ? 'tout' : 'i';
  const scene = montreCircuit && <SceneRC type={dd && dd.type === 'rc' ? 'charge' : P.type} frac={fracPlaques} fleches={flechesScene} ligneValeurs={valeursTxt} aria={ariaScene}/>;
  const reperesGuide = (() => {
    if (!enGuide) return {};
    const niv = P.type === 'charge' ? { u: P.E * M.fraction('charge', 1), txt: '63 %' } : { u: P.E * M.fraction('decharge', 1), txt: '37 %' };
    if (idx === I.courantInitial || idx === I.bilan) return { tau: true, niveau: niv };
    if (idx === I.decharge || idx === I.trenteSept) return { tau: true };
    if (idx === I.capteur) return { niveau: niv };
    return {};
  })();
  const reperes = enGuide ? reperesGuide : enExplore ? { tau: ex.repTau, niveau: ex.repTau ? (ex.type === 'charge' ? { u: ex.E * M.fraction('charge', 1), txt: '63 %' } : { u: ex.E * M.fraction('decharge', 1), txt: '37 %' }) : null, tangente: ex.repTan, cinq: ex.repCinq } : {};
  const montreGraphe = acq ? true : enGuide ? idx >= I.stationnaire : enExplore;
  const montreI = enGuide ? idx >= I.courantInitial && idx !== I.acquisition : enExplore && ex.courbes === 'ui';
  const ariaGraphe = acq ? `Points de mesure bruités de la tension u C aux bornes d'un condensateur pendant la ${acq.type === 'charge' ? 'charge' : 'décharge'}, avec un curseur de lecture.`
    : `Courbe de la tension u C${montreI ? ' et de l\'intensité i' : ''} en fonction du temps, pendant la ${P.type === 'charge' ? 'charge' : 'décharge'}, avec un curseur de lecture.`;
  const graphe = montreGraphe && (
    <GrapheRC type={acq ? acq.type : P.type} E={acq ? acq.E : P.E} R={acq ? acq.R : P.R} tau={acq ? acq.tau : T} tMax={tMax} unitS={unitS}
      curseur={dd && dd.type === 'rc' ? null : { t, u: ptCourant ? ptCourant.u : undefined }} pts={acq ? acq.pts : null} montreI={!!montreI && !acq}
      reperes={acq ? {} : reperes} gradI={!(enGuide && idx === I.courantInitial)} aria={ariaGraphe}/>);
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Le circuit se charge ou se décharge à travers le résistor. Les signes + et − sur les armatures montrent la charge du condensateur.</div>}
      {dd && dd.type === 'tau' && <div style={aide}>Points de mesure simulés. Avancez le curseur de mesure pour lire le temps et la tension.</div>}
      {scene}
      {graphe && <div style={{ marginTop: scene ? 10 : 0, ...cadre('graphe') }}>{graphe}</div>}
    </div>);

  // ---------- commandes ----------
  const majOv = f => setOvG(o => ({ ...o, [idx]: { ...(o[idx] || {}), ...f } }));
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const selectR = (val, on) => (
    <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Résistance R du résistor
      <select value={val} onChange={e => on(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{M.R_MENU.map(r => <option key={r} value={r}>{nbf(r, r < 10 ? 1 : 0)} kΩ</option>)}</select></label>);
  const selectC = (val, on, liste = M.C_MENU) => (
    <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Capacité C du condensateur
      <select value={val} onChange={e => on(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{liste.map(c => <option key={c} value={c}>{nbf(c, c < 1 ? 2 : c < 10 ? 1 : 0)} µF</option>)}</select></label>);
  const selectAller = (
    <select aria-label="Aller à un instant" value="" onChange={e => { if (e.target.value) allerA(Number(e.target.value)); }} style={{ ...menu, width: 'auto', minHeight: 36, fontSize: 13.5, padding: '4px 8px' }}>
      <option value="">Aller à…</option><option value="1">t = τ</option><option value="2">t = 2 τ</option><option value="3">t = 3 τ</option><option value="5">t = 5 τ</option></select>);
  const texteTemps = `t = ${nbt(t)}${NB}ms`;
  const afficheR = enGuide && idx >= I.tau && idx <= I.trenteSept, afficheC = enGuide && ((idx >= I.tau && idx <= I.trenteSept) || idx === I.capteur);
  const afficheAller = enGuide && deja('soixante') && idx !== I.acquisition && idx !== I.bilan && idx !== I.capteur && idx !== I.courantInitial;
  const boxCommandes = enGuide && (
    <div style={{ ...styleBoite, ...cadre('curseurs') }}>
      {(afficheR || afficheC || acq) && <div style={titreCarte}>{afficheR || afficheC ? 'Réglages' : 'Curseur de mesure'}</div>}
      {acq
        ? <>
          <div style={aide}>Déplacez le curseur le long des points mesurés.</div>
          <ControleTemps nom="Curseur de mesure" valeur={jG} max={M.N_ECH - 1} onChange={setJG} texte={`t = ${nbt(acq.pts[jG].t)}${NB}ms · u_C = ${nbf(acq.pts[jG].u, 2)}${NB}V`} pasBouton={1}/></>
        : <>
          <ControleTemps valeur={kG} max={kMax} onChange={setKG} texte={texteTemps} aller={afficheAller ? selectAller : null} joue={joue} lancer={lancer} reduit={reduit} pasBouton={tFixe ? 4 : 2}/>
          {afficheR && selectR(PG.R, x => majOv({ R: x }))}
          {afficheC && selectC(PG.C, x => majOv({ C: x }), idx === I.capteur ? C_CAPTEUR : M.C_MENU)}
          {idx === I.capteur && <div style={{ marginBottom: 8 }}>
            <SceneCapteur niveau={C_CAPTEUR.indexOf(PG.C) / (C_CAPTEUR.length - 1)} aria={`Capteur capacitif : deux électrodes plongent dans une cuve ; le liquide monte quand la capacité C choisie augmente (niveau ${C_CAPTEUR.indexOf(PG.C) + 1} sur ${C_CAPTEUR.length}).`}/>
            <div style={{ ...aide, textAlign: 'center', marginTop: 4, marginBottom: 0 }}>Le niveau du liquide suit la capacité C choisie : plus il monte, plus C est grande.</div>
          </div>}
          {modifie && idx !== I.capteur && <button onClick={() => setOvG(o => ({ ...o, [idx]: {} }))} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir R = {nbf(PRESETS[idx].R, 1)}{NB}kΩ et C = {nbf(PRESETS[idx].C, 0)}{NB}µF</button>}</>}
    </div>);

  // ---------- mesures ----------
  const lignesGuide = (() => {
    const l = [];
    if (idx !== I.capteur) l.push(['Temps caractéristique τ', `${nbt(T)}${NB}ms`]);
    l.push(['Instant t', `${nbt(t)}${NB}ms`], ['Tension u_C', `${nbf(u, 2)}${NB}V`]);
    if (idx >= I.decharge) l.push(['Intensité i', `${nbf(i, 3)}${NB}mA`]);
    return l;
  })();
  const boxMesuresGuide = enGuide && idx >= I.soixante && idx !== I.acquisition && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      {lignesGuide.map(([n, vl]) => <LigneMesure key={n} nom={n} valeur={vl}/>)}
    </div>);
  const boxMesuresDefi = dd && dd.type === 'tau' && (
    <div style={styleBoite}>
      <div style={titreCarte}>Curseur de mesure</div>
      <div style={aide}>Déplacez le curseur le long des points : le temps et la tension mesurée s’affichent.</div>
      <ControleTemps nom="Curseur de mesure" valeur={jD} max={M.N_ECH - 1} onChange={setJD} texte={`t = ${nbt(dd.acq.pts[jD].t)}${NB}ms · u_C = ${nbf(dd.acq.pts[jD].u, 2)}${NB}V`}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Valeurs à l’instant t choisi.</div>
      <LigneMesure nom="Temps caractéristique τ = R × C" valeur={`${nbt(T)}${NB}ms`} couleur="#b45309"/>
      <LigneMesure nom="Instant t" valeur={`${nbt(t)}${NB}ms (${nbf(t / T, 2)} τ)`}/>
      <LigneMesure nom="Tension u_C" valeur={`${nbf(u, 2)}${NB}V`} couleur={BLEU}/>
      <LigneMesure nom="Tension u_R" valeur={`${nbf(P.type === 'charge' ? P.E - u : -u, 2)}${NB}V`}/>
      <LigneMesure nom="Intensité i" valeur={`${nbf(i, 3)}${NB}mA`} couleur="#b45309"/>
      <LigneMesure nom="Charge q de l’armature A" valeur={`${nbf(P.C * u, 1)}${NB}µC`}/>
    </div>);

  // ---------- réglages de l'exploration ----------
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez charge ou décharge, puis faites avancer le temps avec le curseur ou « Lancer ».</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Phase étudiée
        <select value={ex.type} onChange={e => setEx(s => ({ ...s, type: e.target.value, k: 0 }))} style={{ ...menu, marginTop: 2 }}>
          <option value="charge">Charge (condensateur déchargé au départ)</option><option value="decharge">Décharge (condensateur chargé sous E au départ)</option></select></label>
      <ControleTemps valeur={ex.k} max={kMax} onChange={k => setEx(s => ({ ...s, k }))} texte={texteTemps} aller={selectAller} joue={joue} lancer={lancer} reduit={reduit} pasBouton={2}/>
      <Section titre={`Composants : R = ${nbf(ex.R, ex.R < 10 ? 1 : 0)} kΩ · C = ${nbf(ex.C, ex.C < 1 ? 2 : ex.C < 10 ? 1 : 0)} µF · E = ${nbf(ex.E, 0)} V`} ouvert={ouv.comp} onBascule={() => setOuv(o => ({ ...o, comp: !o.comp }))}>
        <div style={aide}>R et C fixent la vitesse du phénomène (τ = R × C) ; E fixe la tension finale.</div>
        {selectR(ex.R, x => setEx(s => ({ ...s, R: x })))}
        {selectC(ex.C, x => setEx(s => ({ ...s, C: x })))}
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Tension E du générateur
          <select value={ex.E} onChange={e => setEx(s => ({ ...s, E: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{M.E_MENU.map(e => <option key={e} value={e}>{nbf(e, 0)} V</option>)}</select></label>
      </Section>
      <Section titre="Courbes et repères sur le graphique" ouvert={ouv.reperes} onBascule={() => setOuv(o => ({ ...o, reperes: !o.reperes }))}>
        <div style={aide}>{avecIndices('Affichez l’intensité sous la courbe de u_C, ou les repères qui servent à déterminer τ.')}</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Courbes affichées
          <select value={ex.courbes} onChange={e => setEx(s => ({ ...s, courbes: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="u">Tension aux bornes du condensateur seulement</option><option value="ui">Tension aux bornes du condensateur et intensité</option></select></label>
        {[['repTau', 'Repère τ (et 63 % en charge, 37 % en décharge)'], ['repTan', 'Tangente à l’origine (coupe l’asymptote à t = τ)'], ['repCinq', 'Repère 5 τ (régime pratiquement stationnaire)']].map(([c, l]) =>
          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex[c]} onChange={e => setEx(s => ({ ...s, [c]: e.target.checked }))} style={{ width: 20, height: 20 }}/>{l}</label>)}
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez R sans changer C : que devient τ ? Et la durée de la charge ? Que devient l’intensité à t = 0 ?</li>
        <li>Choisissez une très petite capacité : la charge est-elle plus rapide ou plus lente ? Pourquoi un capteur capacitif exploite-t-il cet effet ?</li>
        <li>Changez E sans toucher à R et C : τ change-t-il ? Et la forme de la courbe ?</li>
        <li>Affichez la tangente à l’origine et le repère τ : où la tangente coupe-t-elle l’asymptote ?</li>
        <li>En décharge, regardez le signe de i et celui de u_R : pourquoi i est-elle négative ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Condensateur : q = C × u_C ; i = frac(Δq|Δt) (débit de charges)</li>
          <li>Charge : {eqChargeLigne} ; solution avec u_C(0) = 0 : u_C(t) = E × (1 − {eTau})</li>
          <li>Décharge : {eqDechargeLigne} ; solution avec u_C(0) = E : u_C(t) = E × {eTau} ; i &lt; 0</li>
          <li>τ = R × C (en s si R en Ω et C en F) ; 63 % de E à t = τ en charge, 37 % en décharge ; régime pratiquement stationnaire à 5 τ</li>
          <li>Capteur capacitif : la grandeur mesurée fait varier C, donc τ</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .rc-col { display: flex; flex-direction: column; gap: 12px; }
        .rc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .rc-l1.cote .rc-carte { order: 2; } .rc-l1.cote .rc-main { order: 1; }
          .rc-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .rc-ex > * { grid-column: 1; } .rc-ex > .rc-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .rc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .rc-in { animation: rc-fondu 0.35s ease-out; } @keyframes rc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Circuit RC : charge et décharge d’un condensateur</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un condensateur relié à une source de tension par un résistor ne se charge pas instantanément : la durée du phénomène est donnée par le <strong>temps caractéristique</strong> τ = R × C.</div>
      {!enExplore && <div className="rc-l1 cote">
        {enGuide ? <div className="rc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="rc-carte">{panneauHypo}</div> : null}
        <div className="rc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'tau' ? suiviT : suiviR}/></div>}
          <div className="rc-col">
            {(!enDefi || defi) && <div className="rc-in">{boxScene}</div>}
            {boxCommandes && <div className="rc-in">{boxCommandes}</div>}
            {boxMesuresDefi && <div className="rc-in">{boxMesuresDefi}</div>}
            {boxMesuresGuide && <div className="rc-in">{boxMesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="rc-ex">
        <div>{boxScene}</div>
        <div className="rc-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
