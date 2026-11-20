import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./thmModele";
import { QCM_PARCOURS as Q } from "./thmQcm";
import { SceneTasse, GrapheT, GrapheLn, SvgCarteNewton, SvgCarteSolution, SvgCarteTau, SvgCarteChauffage, SvgCarteInfluence } from "./thmSchemas";

const SIM_ID = 212, CLE_GUIDE = 'thermostat-tg-guide-v2';
declarerDefis(SIM_ID, [['tau', 'Lire τ sur une acquisition'], ['calcul', 'Prévoir la température d’un système']]);

// ====================================================
// SIM 212 — LOI DE NEWTON ET THERMOSTAT : TEMPÉRATURE D'UN SYSTÈME AU COURS DU TEMPS
//  (TG spé PC, « L'énergie : conversions et transferts », « Effectuer des bilans d'énergie sur un système »).
//  Capacités visées (jamais affichées à l'élève) : effectuer un bilan d'énergie pour un système incompressible échangeant de l'énergie par un transfert
//  thermique modélisé par la loi de Newton fournie ; établir l'expression de T(t) ; suivre et modéliser l'évolution de la température d'un système
//  incompressible ; résoudre une équation différentielle linéaire du premier ordre à coefficients constants avec un second membre constant ; temps caractéristique.
//  Même équation que les sims 174 (circuit RC) et 122 (cinétique d'ordre 1). Modèle : thmModele.js (test : thmModele.test.mjs).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const nbt = t => nbf(t, t < 100 ? 1 : 0);                                   // temps en min
const BLEU = '#0369a1', VERT = '#15803d';
const IDS = ['sens', 'newton', 'bilan', 'equation', 'tau', 'solution', 'unTau', 'pente', 'froid', 'influence', 'acquisition', 'conclusion'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
const P_CAFE = { m: 0.20, iso: 'nue', T0: 80, Text: 20 };
const hSde = id => M.ISOLATIONS.find(x => x.id === id).hS;
const sysDe = (m, iso) => { const C = M.capacite(m), hS = hSde(iso); return { C, hS, tau: M.tauMin(C, hS) }; };
const S0 = sysDe(P_CAFE.m, P_CAFE.iso);                                       // café : C = 836 J·K⁻¹, hS = 0,45 W·K⁻¹, τ = 30,96 min
const ACQ = M.acquisitionGuide(), AJ = M.ajustementLn(ACQ), TAU_FIT = -1 / AJ.b;
const kMax = 300;

// ---------- formules (MathML) ----------
const Tm = <mi>T</mi>, Text = <msub><mi>T</mi><mtext>ext</mtext></msub>, T0 = <msub><mi>T</mi><mn>0</mn></msub>;
const dTdt = <mfrac><mrow><mi>d</mi><mi>T</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>;
const gros = { mathDepth: 1, mathStyle: 'normal' };
const expo = <msup><mi>e</mi><mrow><mo>−</mo><mfrac style={gros}><mi>t</mi><mi>τ</mi></mfrac></mrow></msup>;
const ecart = <mrow><mo>(</mo>{Text}<mo>−</mo>{Tm}<mo>)</mo></mrow>;
const FNewton = <Formule><mi>φ</mi><mo>=</mo><mi>h</mi><mo>×</mo><mi>S</mi><mo>×</mo>{ecart}</Formule>;
const FBilan = <Formule><mi>Δ</mi><mi>U</mi><mo>=</mo><mi>C</mi><mo>×</mo><mi>Δ</mi><mi>T</mi><mo>=</mo><mi>Q</mi><mo>=</mo><mi>φ</mi><mo>×</mo><mi>Δ</mi><mi>t</mi></Formule>;
const FEquDiff = <Formule><mi>C</mi><mo>×</mo>{dTdt}<mo>=</mo><mi>h</mi><mo>×</mo><mi>S</mi><mo>×</mo>{ecart}</Formule>;
const FEqTau = <Formule>{dTdt}<mo>+</mo><mfrac><mi>T</mi><mi>τ</mi></mfrac><mo>=</mo><mfrac>{Text}<mi>τ</mi></mfrac></Formule>;
const FTau = <Formule><mi>τ</mi><mo>=</mo><mfrac><mi>C</mi><mrow><mi>h</mi><mi>S</mi></mrow></mfrac></Formule>;
const FSolGen = <Formule><mi>T</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo>{Text}<mo>+</mo><mi>A</mi><mo>×</mo>{expo}</Formule>;
const FSolution = <Formule compact={<><FormuleEnLigne><mi>T</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo>{Text}<mo>+</mo><mi>A</mi><mo>×</mo>{expo}</FormuleEnLigne>{' '}avec <FormuleEnLigne><mi>A</mi><mo>=</mo>{T0}<mo>−</mo>{Text}</FormuleEnLigne></>}><mi>T</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo>{Text}<mo>+</mo><mo>(</mo>{T0}<mo>−</mo>{Text}<mo>)</mo><mo>×</mo>{expo}</Formule>;
const eEqTau = <FormuleEnLigne>{dTdt}<mo>+</mo><mfrac><mi>T</mi><mi>τ</mi></mfrac><mo>=</mo><mfrac>{Text}<mi>τ</mi></mfrac></FormuleEnLigne>;
const eExpo = <FormuleEnLigne>{expo}</FormuleEnLigne>;
const ePuis = x => <FormuleEnLigne><msup><mi>e</mi><mrow><mo>−</mo><mn>{x}</mn></mrow></msup></FormuleEnLigne>;
const eTempsPour = <FormuleEnLigne><mi>t</mi><mo>=</mo><mi>τ</mi><mo>×</mo><mi>ln</mi><mo>(</mo><mfrac><mrow>{T0}<mo>−</mo>{Text}</mrow><mrow><mi>T</mi><mo>−</mo>{Text}</mrow></mfrac><mo>)</mo></FormuleEnLigne>;
const eTauDef = <FormuleEnLigne><mi>τ</mi><mo>=</mo><mfrac><mi>C</mi><mrow><mi>h</mi><mi>S</mi></mrow></mfrac></FormuleEnLigne>;
const eDeltaTDeltat = <FormuleEnLigne><mfrac><mrow><mi>Δ</mi><mi>T</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></FormuleEnLigne>;
const eY = <FormuleEnLigne><mi>y</mi><mo>=</mo><mfrac><mrow><mi>T</mi><mo>−</mo>{Text}</mrow><mrow>{T0}<mo>−</mo>{Text}</mrow></mfrac></FormuleEnLigne>;
const eLn = <FormuleEnLigne><mi>ln</mi><mo>(</mo><mi>y</mi><mo>)</mo><mo>=</mo><mo>−</mo><mfrac><mi>t</mi><mi>τ</mi></mfrac></FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// contrôle du temps : curseur + boutons − / + (un doigt ne vise pas un cran) + rétablir + menu « Aller à » facultatif
function ControleTemps({ valeur, max, onChange, texte, nom = 'Temps t', aller = null, joue = null, lancer = null, reduit = false, pasBouton = 1, retablir = 'Rétablir (t = 0)' }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 2, fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt, textAlign: 'right', whiteSpace: 'nowrap' }}>{avecIndices(texte)}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label="Reculer un peu" onClick={() => onChange(Math.max(0, valeur - pasBouton))} style={btn}>−</button>
        <input type="range" min={0} max={max} step={1} value={Math.round(valeur)} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label="Avancer un peu" onClick={() => onChange(Math.min(max, valeur + pasBouton))} style={btn}>+</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button onClick={() => onChange(0)} style={stylePetitBouton(false)}><Pic n="refresh"/>{retablir}</button>
        {lancer && <button onClick={lancer} style={stylePetitBouton(true, VERT)}>{reduit ? 'Avancer d’un cran' : joue ? 'Pause' : 'Lancer'}</button>}
        {aller}
      </div>
    </div>);
}

const nomIso = id => M.ISOLATIONS.find(x => x.id === id).nom;
const txtSys = (m, iso) => `${nbf(m, 2)} kg · ${nomIso(iso).toLowerCase()} (hS = ${nbf(hSde(iso), 2)} W·K⁻¹)`;

export function SimulationLoiNewtonThermostat() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviT, noterT] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('tau');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ sys: false, cond: false, comp: false, reperes: false, essayer: false, retenir: false, ln: false });
  const [kS, setKS] = useState({}), [ovG, setOvG] = useState({}), [jG, setJG] = useState(0), [jL, setJL] = useState(0);   // parcours : temps (en 1/300 de la plage), réglages modifiés par étape, points de l'acquisition
  const [ex, setEx] = useState({ m: 0.20, iso: 'nue', T0: 80, Text: 20, k: 0, comparer: false, mB: 0.20, isoB: 'isotherme', repTau: false, repTan: false, repCinq: false });   // exploration
  const [jD, setJD] = useState(0);                                                                 // défi : point de l'acquisition
  const [joue, setJoue] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  // ---------- étape du parcours ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const kG = kS[idx] ?? 0, setKG = f => setKS(o => ({ ...o, [idx]: typeof f === 'function' ? f(o[idx] ?? 0) : f }));
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const PG = { ...P_CAFE, ...(idx === I.froid ? { T0: 4 } : {}), ...(ovG[idx] || {}) };
  const modifie = enGuide && ovG[idx] && (ovG[idx].m !== undefined || ovG[idx].iso !== undefined);

  // ---------- système(s) affiché(s) ----------
  const sA = enGuide ? sysDe(PG.m, PG.iso) : sysDe(ex.m, ex.iso);
  const sB = enExplore && ex.comparer ? sysDe(ex.mB, ex.isoB) : null;
  const sRef = enGuide && idx === I.influence ? sysDe(P_CAFE.m, P_CAFE.iso) : null;            // étape « influence » : la tasse nue de départ reste tracée en tirets
  const Tdep = enGuide ? PG.T0 : enExplore ? ex.T0 : dd ? dd.T0 : 80, Tpiece = enGuide ? PG.Text : enExplore ? ex.Text : dd ? dd.Text : 20;
  const courbes = enGuide
    ? (sRef ? [{ T0: Tdep, Text: Tpiece, tau: sA.tau, nom: 'Votre choix' }, { T0: Tdep, Text: Tpiece, tau: sRef.tau, trait: 'tirets', nom: 'Départ (nue)' }] : [{ T0: Tdep, Text: Tpiece, tau: sA.tau }])
    : [{ T0: Tdep, Text: Tpiece, tau: sA.tau, nom: 'A' }, ...(sB ? [{ T0: Tdep, Text: Tpiece, tau: sB.tau, trait: 'tirets', nom: 'B' }] : [])];
  const tauRef = Math.max(...courbes.map(c => c.tau));
  const tMax = 6 * tauRef;
  const kCur = enGuide ? (sRef ? 0 : kG) : enExplore ? ex.k : 0;
  const t = (kCur / kMax) * tMax;
  const T = M.temperature(t, Tdep, Tpiece, courbes[0].tau), TB = sB ? M.temperature(t, Tdep, Tpiece, sB.tau) : null;
  const acq = enGuide && idx === I.acquisition ? ACQ : dd && dd.type === 'tau' ? dd : null;     // graphe d'acquisition (pas de tasse)
  const ptCourant = acq ? acq.pts[enGuide ? jG : jD] : null;

  // ---------- lecture animée ----------
  const tickRef = useRef(null);
  useEffect(() => {
    tickRef.current = dt => {
      const k0 = enExplore ? ex.k : kG;
      if (k0 + dt * 50 >= kMax) setJoue(false);
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
  const allerA = m => setK(Math.min(kMax, Math.round(m * courbes[0].tau / tMax * kMax)));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'sens', titre: 'Un système et un thermostat', focus: ['scene'],
      texte: <>Une tasse contient 0,20{NB}kg de café à la température T_0 = 80{NB}°C. Elle est posée dans une pièce dont l’air reste à T_ext = 20{NB}°C. Le <strong>système</strong> étudié est le café : on suppose que sa température T est la même en tout point du liquide, et l’on néglige la capacité thermique de la tasse (le système est le liquide seul). La pièce joue le rôle de <strong>thermostat</strong> : sa température T_ext reste constante, même quand elle reçoit de l’énergie du café.</>,
      tache: { type: 'qcm', q: 'Dans quel sens se fait le transfert thermique entre le café et l’air de la pièce ?', options: Q.sens.options, bonne: 0,
        expl: 'Un transfert thermique va spontanément du corps le plus chaud vers le plus froid : ici du café (80 °C) vers l’air (20 °C). Le sens inverse irait du froid vers le chaud. Un transfert a bien lieu tant que les deux températures diffèrent, et la tasse ne l’empêche pas : le café perd aussi de l’énergie par la surface en contact avec l’air.',
        indice: 'Comparez les deux températures : l’énergie thermique passe de l’endroit le plus chaud vers l’endroit le plus froid.' } },
    { id: 'newton', titre: 'La loi de Newton', focus: ['scene'],
      texte: <>Le transfert thermique entre le café et la pièce est modélisé par la <strong>loi de Newton</strong>, fournie : le flux thermique φ <strong>reçu</strong> par le système vaut{FNewton}où h est le coefficient d’échange, S la surface d’échange et T la température du café. Le produit h × S est supposé constant : pour cette tasse, h × S = 0,45{NB}W·K⁻¹ (valeur fournie, ordre de grandeur pour une tasse non isolée). φ est positif quand le système reçoit de l’énergie, négatif quand il en cède.</>,
      tache: { type: 'num', q: 'Flux thermique φ reçu par le café à l’instant initial (T = 80 °C), en W, signe compris (2 chiffres significatifs)', unite: 'W', vrai: -27, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['φ = h × S × (T_ext − T) = 0,45 W·K⁻¹ × (20 − 80) K.', 'φ = 0,45 × (−60) = −27 W : le signe moins indique que le café cède de l’énergie à la pièce.'],
        pieges: [[27, 'Le signe est faux : φ est le flux REÇU par le café ; le café est plus chaud que la pièce, il cède de l’énergie, donc φ est négatif.'], [36, 'Vous avez utilisé T seule : c’est l’écart (T_ext − T) qui intervient dans la loi de Newton.'], [-45, 'Vous avez ajouté les températures : il faut l’écart (T_ext − T) = 20 − 80 = −60 K.'], [-60, 'Vous avez oublié de multiplier par h × S : φ = h × S × (T_ext − T).']],
        expl: 'φ = h × S × (T_ext − T) = 0,45 × (20 − 80) = −27 W : le café cède 27 joules par seconde à la pièce.',
        indice: 'Écart (T_ext − T) = 20 − 80, en kelvins (un écart en °C est égal à un écart en K) ; multipliez-le par h × S = 0,45 W·K⁻¹.' } },
    { id: 'bilan', titre: 'Bilan d’énergie sur une courte durée', focus: ['scene'],
      texte: <>Le café est un liquide : un système <strong>incompressible</strong>, dont l’énergie interne ne varie qu’avec sa température, ΔU = C × ΔT, où C est la capacité thermique du café. Ici C = 836{NB}J·K⁻¹ (0,20{NB}kg × 4{NB}180{NB}J·kg⁻¹·K⁻¹, café assimilé à de l’eau). Le seul transfert d’énergie est le transfert thermique Q = φ × Δt. Le bilan d’énergie s’écrit :{FBilan}Pendant une courte durée Δt = 30{NB}s, on suppose φ constant : φ = −27{NB}W (valeur de l’étape précédente).</>,
      tache: { type: 'num', q: 'Variation de température ΔT du café pendant ces 30 s, en K, signe compris (2 chiffres significatifs)', unite: 'K', vrai: -27 * 30 / 836, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Q = φ × Δt = −27 W × 30 s = −810 J (1 W = 1 J·s⁻¹).', 'ΔT = frac(Q|C) = frac(−810 J|836 J·K⁻¹) = −0,97 K.'],
        pieges: [[0.97, 'Le signe est faux : le café cède de l’énergie (Q < 0), sa température diminue.'], [-810, 'C’est le transfert thermique Q en joules : il faut encore le diviser par la capacité thermique C.'], [-27 * 0.5 / 836, 'La durée doit être en secondes (1 W = 1 J·s⁻¹) : 30 s, pas 0,5 min.'], [-27 / 836, 'Vous avez oublié de multiplier le flux par la durée Δt.']],
        expl: 'Q = φ × Δt = −27 × 30 = −810 J ; ΔT = frac(Q|C) = frac(−810|836) = −0,97 K : en 30 s, le café perd environ 1 K au début.',
        indice: 'D’abord Q = φ × Δt (en joules, avec Δt en secondes), puis ΔU = C × ΔT = Q donne ΔT = Q divisé par C.' } },
    { id: 'equation', titre: 'L’équation différentielle', focus: ['scene'],
      retenirTitre: 'Loi de Newton et bilan d’énergie',
      retenir: <>
        <SvgCarteNewton/>
        <ul style={ULS}>
          <li><strong>Loi de Newton</strong> : φ = h S (T_ext − T), avec φ le flux <strong>reçu</strong> par le système (en W).</li>
          <li>Système incompressible : <strong>ΔU = C ΔT = Q = φ Δt</strong> (C en J·K⁻¹).</li>
          <li>Moyen de s’en souvenir : <strong>« l’énergie passe du chaud vers le froid, d’autant plus fort que l’écart est grand »</strong>. Idée fausse : « le flux reste constant ». Vrai : il est proportionnel à l’écart T_ext − T, donc il diminue quand T se rapproche de T_ext.</li>
        </ul></>,
      texte: <>Le flux φ dépend de T : il change dès que T change, donc le bilan précédent n’est valable que sur une durée très courte. Quand Δt tend vers 0, {eDeltaTDeltat} devient la dérivée de T et le bilan s’écrit à chaque instant :{FEquDiff}On divise par C et on pose τ = frac(C|h × S), appelé <strong>temps caractéristique</strong> (ou constante de temps).</>,
      tache: { type: 'qcm', q: 'Quelle équation différentielle vérifie la température T(t) du café ?', options: Q.equation.options, bonne: 0,
        expl: <>En divisant C × <FormuleEnLigne>{dTdt}</FormuleEnLigne> = h S (T_ext − T) par C : <FormuleEnLigne>{dTdt}</FormuleEnLigne> = <FormuleEnLigne><mfrac><mrow><mi>h</mi><mi>S</mi></mrow><mi>C</mi></mfrac></FormuleEnLigne> × (T_ext − T), soit {eEqTau}. Le signe moins devant T/τ est indispensable : avec un signe plus, T s’éloignerait de T_ext. Sans τ, le second membre n’aurait pas la dimension d’une température divisée par un temps. Avec (T_ext − T)/τ au second membre, T serait comptée deux fois.</>,
        indice: 'Divisez les deux membres par C, puis utilisez τ = C divisé par (h × S) pour remplacer h × S divisé par C par 1 divisé par τ.' } },
    { id: 'tau', titre: 'Le temps caractéristique τ', focus: ['scene'],
      texte: <>Pour ce café, C = 836{NB}J·K⁻¹ et h × S = 0,45{NB}W·K⁻¹.{FTau}Dans cette expression, des J·K⁻¹ sont divisés par des W·K⁻¹ : il reste des joules divisés par des watts, c’est-à-dire des secondes (1{NB}W = 1{NB}J·s⁻¹), donc τ est bien une durée.</>,
      tache: { type: 'num', q: 'Valeur de τ pour ce café, en minutes (2 chiffres significatifs)', unite: 'min', vrai: S0.tau, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['τ = frac(C|h × S) = frac(836 J·K⁻¹|0,45 W·K⁻¹) = 1 858 s.', '1 858 s = frac(1 858|60) min = 31 min.'],
        pieges: [[1858, 'Vous avez donné τ en secondes : la réponse est attendue en minutes (60 s = 1 min).'], [S0.tau / 60, 'Vous avez donné τ en heures : la réponse est attendue en minutes.'], [836 * 0.45, 'Il faut diviser C par h × S, pas les multiplier.'], [0.45 / 836 * 60, 'Le rapport est inversé : τ = C divisé par h × S.']],
        expl: 'τ = frac(C|h × S) = frac(836|0,45) = 1 858 s = 31 min : il faut environ une demi-heure pour que l’écart de température diminue d’un facteur voisin de 3.',
        indice: 'τ = C divisé par (h × S) donne des secondes ; divisez ensuite par 60 pour obtenir des minutes.' } },
    { id: 'solution', titre: 'Résoudre l’équation différentielle', focus: ['scene'],
      texte: <>On cherche T(t) telle que {eEqTau}. Une solution particulière est la constante T = T_ext ; la solution de l’équation sans second membre est de la forme A × {eExpo}, où A est une constante. La solution générale est donc :{FSolGen}La constante A est fixée par la condition initiale : à t = 0, le café est à T_0 = 80{NB}°C, la pièce à T_ext = 20{NB}°C.</>,
      tache: { type: 'qcm', q: 'Que vaut la constante A ?', options: Q.solution.options, bonne: 0,
        expl: 'À t = 0, l’exponentielle vaut 1 : T(0) = T_ext + A. Comme T(0) = T_0, A = T_0 − T_ext = 60 K. A = T_0 donnerait T(0) = T_ext + T_0, soit 100 °C. A = T_ext − T_0 changerait le signe de l’écart et donnerait T(0) = 2 T_ext − T_0 = −40 °C. Avec A = T_0 − 2 T_ext, on aurait T(0) = T_0 − T_ext = 60 °C, et non 80 °C.',
        indice: 'À t = 0, e⁰ = 1 : écrivez T(0) = T_ext + A et imposez T(0) = T_0.' } },
    { id: 'unTau', titre: 'Que se passe-t-il au bout de τ ?', focus: ['scene', 'graphe', 'curseurs', 'mesures'],
      retenirTitre: 'Équation différentielle et solution',
      retenir: <>
        <SvgCarteSolution/>
        <ul style={ULS}>
          <li>Bilan à chaque instant : C × <FormuleEnLigne>{dTdt}</FormuleEnLigne> = h S (T_ext − T), soit {eEqTau} avec <strong>τ = frac(C|h S)</strong>.</li>
          <li>Avec T(0) = T_0 : <FormuleEnLigne><mi>T</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo>{Text}<mo>+</mo><mi>A</mi><mo>×</mo>{expo}</FormuleEnLigne>, avec <FormuleEnLigne><mi>A</mi><mo>=</mo>{T0}<mo>−</mo>{Text}</FormuleEnLigne>.</li>
          <li>Moyen de s’en souvenir : <strong>« ce vers quoi on tend (T_ext), plus un écart initial qui s’éteint en exponentielle »</strong>. Idée fausse : « T atteint T_ext à un instant précis ». Vrai : T s’en approche sans jamais l’atteindre exactement.</li>
        </ul></>,
      texte: <>La solution est {FSolution}Le graphique montre T(t) pour le café (T_0 = 80{NB}°C, T_ext = 20{NB}°C, τ = 31{NB}min). Avec le menu « Aller à », placez t = τ et lisez T dans le panneau Mesures.</>,
      tache: { type: 'num', q: 'À t = τ, quel pourcentage de l’écart initial (T_0 − T_ext) reste-t-il, c’est-à-dire quelle est la valeur de (T − T_ext) divisée par (T_0 − T_ext), en % ?', unite: '%', vrai: 100 * Math.exp(-1), tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['À t = τ : T = T_ext + (T_0 − T_ext) × e⁻¹ = 20 + 60 × 0,368 = 42 °C.', 'Il reste T − T_ext = 22 K sur un écart initial de 60 K : frac(22|60) = 37 %.'],
        pieges: [[63.2, 'Ce sont les 63 % déjà parcourus. La question porte sur ce qui RESTE de l’écart initial : 100 % − 63 % = 37 %.'], [42, 'C’est la température T en °C ; il faut en déduire l’écart T − T_ext, puis le comparer à l’écart initial.'], [50, 'La moitié de l’écart est atteinte plus tôt, à t = 0,69 τ : à t = τ, il reste moins de la moitié.'], [13.5, 'C’est la valeur à t = 2 τ : vérifiez que le curseur est bien en t = τ.']],
        expl: 'À t = τ, T − T_ext = (T_0 − T_ext) × e⁻¹ : il reste 37 % de l’écart initial (63 % ont été parcourus), quels que soient C et h S.',
        indice: 'Lisez T dans Mesures pour t = τ, calculez T − T_ext, puis divisez par T_0 − T_ext = 60 K.' } },
    { id: 'pente', titre: 'La vitesse de refroidissement au départ', focus: ['scene', 'graphe', 'mesures'],
      texte: <>À t = 0, la température vaut T = T_0 = 80{NB}°C. Reportez-la dans l’équation différentielle {eEqTau} pour exprimer la dérivée <FormuleEnLigne>{dTdt}</FormuleEnLigne> à t = 0. Rappel : T_ext = 20{NB}°C et τ = 31{NB}min.</>,
      tache: { type: 'num', q: <>Valeur de <FormuleEnLigne>{dTdt}</FormuleEnLigne> à t = 0, en K par minute, signe compris (2 chiffres significatifs)</>, unite: 'K·min⁻¹', vrai: M.penteOrigine(80, 20, S0.tau), tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [<>À t = 0, la dérivée vaut (T_ext − T_0) divisé par τ : {dTdt} = frac(20 − 80|31 min).</>, 'La dérivée à t = 0 vaut frac(−60 K|31 min) = −1,9 K par minute : le café refroidit d’environ 2 °C par minute au départ.'],
        pieges: [[1.94, 'Le signe est faux : le café refroidit, donc la dérivée de T est négative.'], [-60, 'C’est l’écart T_ext − T_0 en K ; il faut encore le diviser par τ pour obtenir une vitesse en K par minute.'], [-1 / S0.tau, 'Vous avez calculé 1 divisé par τ : il faut multiplier par l’écart T_ext − T_0 = −60 K.'], [M.penteOrigine(80, 20, S0.tau) * 60, 'Vous avez donné la vitesse en K par heure : la réponse est attendue en K par minute.']],
        expl: <>La dérivée à t = 0 vaut (T_ext − T_0) divisé par τ = frac(−60|31) = −1,9 K par minute. La tangente à l’origine, de cette pente, rejoint T_ext à t = τ.</>,
        indice: 'À t = 0, T = T_0 : la dérivée de T vaut (T_ext − T_0) divisé par τ, avec τ en minutes.' } },
    { id: 'froid', titre: 'Un liquide plus froid que la pièce', focus: ['scene'],
      retenirTitre: 'Le temps caractéristique τ',
      retenir: <>
        <SvgCarteTau/>
        <ul style={ULS}>
          <li><strong>τ = frac(C|h S)</strong> : des J·K⁻¹ divisés par des W·K⁻¹ donnent des <strong>secondes</strong>.</li>
          <li>À t = τ, il reste <strong>37 %</strong> de l’écart initial (63 % parcourus) ; la tangente à l’origine coupe l’asymptote T_ext à t = τ ; à t = 5τ, il reste moins de <strong>1 %</strong>.</li>
          <li>Exemple : café, τ = 31 min ; à t = 31 min, T ≈ 42 °C (écart restant : 37 % de 60 K) ; l’équilibre est pratiquement atteint vers 5τ ≈ 2,6 h.</li>
          <li>Moyen de s’en souvenir : <strong>« 63 – 37, et 5τ pour finir »</strong>. Idée fausse : « au bout de τ, l’équilibre est atteint ». Vrai : il reste encore 37 % de l’écart.</li>
        </ul></>,
      texte: <>On verse maintenant dans la même tasse 0,20{NB}kg d’eau à T_0 = 4{NB}°C, dans la même pièce (T_ext = 20{NB}°C). C et h × S sont inchangés : τ = 31{NB}min. L’équation différentielle et sa solution gardent exactement la même forme ; seule la valeur de T_0 change.</>,
      tache: { type: 'num', q: 'Température T de cette eau au bout de t = 60 min, en °C (3 chiffres significatifs)', unite: '°C', vrai: M.temperature(60, 4, 20, S0.tau), tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => [<>T(t) = T_ext + (T_0 − T_ext) × {eExpo}, avec t divisé par τ = frac(60 min|31 min) = 1,94, donc {ePuis('1,94')} = 0,144.</>, 'T = 20 + (4 − 20) × 0,144 = 20 − 2,3 = 17,7 °C : l’eau s’est réchauffée et se rapproche de 20 °C par en dessous.'],
        pieges: [[22.31, 'Le signe de l’écart est faux : T_0 − T_ext = 4 − 20 = −16 K est négatif ; l’eau est plus froide que la pièce, sa température reste inférieure à T_ext.'], [4, 'C’est la température initiale T_0 : au bout de 60 min, l’eau s’est réchauffée.'], [20, 'T tend vers T_ext sans l’atteindre : après 60 min (environ 2τ), il reste un petit écart.'], [12, 'C’est la moyenne de T_0 et T_ext : la température à mi-parcours est atteinte avant t = τ.']],
        expl: <>T(60) = 20 + (4 − 20) × {ePuis('1,94')} = 20 − 16 × 0,144 = 17,7 °C. Pour un liquide plus froid que la pièce, c’est la même équation : le flux φ est positif et T monte vers T_ext.</>,
        indice: <>Même formule T(t) = T_ext + (T_0 − T_ext) × {eExpo}, avec T_0 − T_ext = 4 − 20 = −16 K et t divisé par τ = 60 divisé par 31.</> } },
    { id: 'influence', titre: 'Isolation et masse : l’effet sur τ', focus: ['scene', 'graphe', 'curseurs'],
      retenirTitre: 'Refroidissement ou chauffage : même équation',
      retenir: <>
        <SvgCarteChauffage/>
        <ul style={ULS}>
          <li>Même équation {eEqTau} et même solution, que T_0 soit supérieure (refroidissement) ou inférieure (chauffage) à T_ext ; seul le signe de T_0 − T_ext change : φ &lt; 0 si le système cède, φ &gt; 0 s’il reçoit.</li>
          <li>Moyen de s’en souvenir : <strong>« T file toujours vers T_ext »</strong>. Idée fausse : « un liquide froid suit une autre loi ».</li>
        </ul></>,
      texte: <>Retour au café (T_0 = 80{NB}°C, T_ext = 20{NB}°C). La courbe en tirets est celle de la tasse nue de 0,20{NB}kg. Choisissez dans les menus une autre isolation ou une autre masse de café : la courbe en trait plein se déplace. Essayez, puis répondez. (La valeur de h × S est fournie pour chaque isolation et gardée la même quand on change la masse ; en réalité, la surface change un peu avec le volume.)</>,
      tache: { type: 'qcm', q: <>On remplace la tasse nue (h × S = 0,45{NB}W·K⁻¹) par un mug isotherme (h × S = 0,06{NB}W·K⁻¹), avec le même café. Que devient τ ?</>, options: Q.influence.options, bonne: 0,
        expl: 'τ = C divisé par (h × S) : avec h × S divisé par 7,5, τ est multiplié par 7,5. Un τ plus grand signifie un refroidissement plus lent. Un τ qui diminue aurait un café qui refroidit plus vite, ce qui contredit l’isolation. Et la masse n’est pas seule en cause : τ dépend aussi de h × S.',
        indice: 'τ = C divisé par (h × S) : C ne change pas, h × S diminue. Que fait un quotient quand son dénominateur diminue ?' } },
    { id: 'acquisition', titre: 'Modéliser des mesures', focus: ['graphe', 'curseurs'],
      retenirTitre: 'Ce qui fait varier τ',
      retenir: <>
        <SvgCarteInfluence/>
        <ul style={ULS}>
          <li><strong>τ = frac(C|h S)</strong> : τ augmente avec la capacité thermique C (plus de liquide) et quand h S diminue (meilleure isolation).</li>
          <li>τ ne dépend <strong>ni de T_0 ni de T_ext</strong> : ces températures fixent le point de départ et la valeur finale, pas la durée.</li>
          <li>Moyen de s’en souvenir : <strong>« gros et bien isolé = lent »</strong>. Idée fausse : « mieux isoler change la température finale ». Vrai : elle reste T_ext ; seule la durée change.</li>
        </ul></>,
      texte: <>Un bécher contenant 0,10{NB}kg d’eau à T_0 = 20{NB}°C est plongé dans un bain thermostaté à T_ext = 60{NB}°C. Un thermomètre relève la température T toutes les minutes (points simulés par ordinateur, avec un peu de bruit de mesure). Déplacez le curseur le long des points. Ici le liquide se réchauffe : même équation, T_0 &lt; T_ext. Quelle est la valeur de τ ?</>,
      tache: { type: 'num', q: 'Temps caractéristique τ de ce système, en minutes', unite: 'min', vrai: ACQ.tau, tol: M.TOL_TAU, affiche: v => nbf(v, 1),
        calcul: () => ['À t = τ, la température a parcouru 63 % de l’écart : T = T_0 + 0,63 × (T_ext − T_0) = 20 + 0,63 × 40 = 45 °C.', 'On cherche la date à laquelle les points passent par 45 °C : environ 8 min. Le bruit rend la lecture un peu incertaine : on accepte ± 15 %.'],
        pieges: [[ACQ.tau * 5, 'Vous avez lu la date où T atteint environ 99 % de l’écart : c’est 5τ, pas τ.'], [ACQ.tau * 0.46, 'Vous avez lu la date où 37 % de l’écart est parcouru : c’est 0,46 τ. Pour τ, il faut 63 % parcourus.'], [ACQ.tau * 2, 'À 86 % de l’écart parcouru, on lit 2τ ; τ correspond à 63 %.']],
        expl: 'On lit la date à laquelle T a parcouru 63 % de l’écart T_ext − T_0 = 40 K : T = 20 + 0,63 × 40 = 45 °C, vers t = 8 min. Donc τ ≈ 8 min (avec une incertitude liée au bruit des points).',
        indice: 'Au bout de τ, 63 % de l’écart T_ext − T_0 = 40 K est parcouru : calculez T_0 + 0,63 × 40, puis cherchez avec le curseur la date où les points passent par cette valeur.' } },
    { id: 'conclusion', titre: 'Bilan', focus: [],
      texte: <>Vous savez effectuer un bilan d’énergie sur un système incompressible échangeant de l’énergie par un transfert thermique modélisé par la loi de Newton, établir et résoudre l’équation différentielle du premier ordre qui en découle, interpréter le temps caractéristique {eTauDef} (37 %, 63 %, 5τ) et le déterminer à partir de mesures. C’est la même équation que pour la charge d’un condensateur (simulation « Circuit RC : charge et décharge d’un condensateur ») et que pour une réaction d’ordre 1. Passez à l’exploration (masse, isolation, températures, comparaison de deux essais) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'tau') { const a = M.tirageAcquisition(); setDefi({ ...a, type, rep: '', verifie: false, essais: 0 }); }
    else { const d = M.tirageCalcul(); setDefi({ ...d, type, rep: '', rep2: '', rep3: '', verifie: false, essais: 0 }); }
    setJD(0); setJoue(false);
  };
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const verifier = () => {
    const x = lireNombre(defi.rep), pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
    let ok1, ok2 = true, ok3 = true;
    if (defi.type === 'tau') ok1 = pr(x, defi.tau, M.TOL_TAU);
    else { ok1 = pr(x, defi.qTau, 0.05); ok2 = pr(lireNombre(defi.rep2 || ''), defi.qT, 0.06); ok3 = pr(lireNombre(defi.rep3 || ''), defi.qT_t, 0.06); }
    const ok = ok1 && ok2 && ok3;
    setDefi(d => ({ ...d, verifie: true, ok, ok1, ok2, ok3, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'tau' ? noterT : noterC)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite, okCle) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('thm-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi[okCle] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const cJ = x => nbf(x, 0), hSf = x => nbf(x, 2);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['tau', 'Lire τ sur des mesures'], ['calcul', 'Prévoir T(t)']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'tau' ? 'Défi : quel est le temps caractéristique de ce système ?' : 'Défi : prévoir la température d’un liquide qui refroidit ou se réchauffe'}</div>
      {defi.type === 'tau' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un liquide, dans un récipient plongé dans un thermostat, a été suivi par un thermomètre (points simulés par ordinateur, avec du bruit de mesure). Au départ, T_0 = <strong>{cJ(defi.T0)}{NB}°C</strong> ; le thermostat est à T_ext = <strong>{cJ(defi.Text)}{NB}°C</strong>. Déplacez le curseur de mesure et déterminez le temps caractéristique τ, en minutes (marge acceptée : 15{NB}%).</div>
        {champ('τ', 'rep', 'min', 'ok1')}
        <IndiceDefi cache={false}>Au bout de τ, 63 % de l’écart entre T_0 et T_ext est parcouru : calculez T_0 + 0,63 × (T_ext − T_0), puis cherchez avec le curseur la date où les points passent par cette valeur.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un liquide de capacité thermique <strong>C = {cJ(defi.C)}{NB}J·K⁻¹</strong> est dans un récipient dont le produit h × S vaut <strong>{hSf(defi.hS)}{NB}W·K⁻¹</strong>. À t = 0, sa température est T_0 = <strong>{cJ(defi.T0)}{NB}°C</strong> ; le thermostat est à T_ext = <strong>{cJ(defi.Text)}{NB}°C</strong> (valeurs fournies). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Temps caractéristique τ du système (marge acceptée : 5{NB}%).</div>
        {champ('τ', 'rep', 'min', 'ok1')}
        <IndiceDefi cache={false}>τ = C divisé par (h × S) donne des secondes ; divisez par 60 pour obtenir des minutes.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Température T du liquide à t = <strong>{cJ(defi.t)}{NB}min</strong> (utilisez le τ de la question 1 ; marge acceptée : 6{NB}%).</div>
        {champ('T', 'rep2', '°C', 'ok2')}
        <IndiceDefi cache={false}>T(t) = T_ext + (T_0 − T_ext) × {eExpo}, avec t et τ dans la même unité (minutes). Attention au signe de T_0 − T_ext.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Durée au bout de laquelle la température atteint <strong>{cJ(defi.Tc)}{NB}°C</strong>, en minutes (marge acceptée : 6{NB}%).</div>
        {champ('t', 'rep3', 'min', 'ok3')}
        <IndiceDefi cache={false}>Isolez t dans T = T_ext + (T_0 − T_ext) × {eExpo} : {eTempsPour} Calculez d’abord le rapport des écarts, puis son logarithme népérien.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="thm-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {(defi.ok ? '✓ Correct. ' : defi.type === 'calcul' ? `✗ Pas tout à fait (question 1 ${defi.ok1 ? 'juste' : 'à revoir'}, question 2 ${defi.ok2 ? 'juste' : 'à revoir'}, question 3 ${defi.ok3 ? 'juste' : 'à revoir'}). ` : '✗ Pas tout à fait. ')}
        {defi.ok || (defi.essais || 0) >= 3
          ? <span style={{ fontWeight: 400 }}>{defi.type === 'tau'
            ? `Le système avait C = ${cJ(defi.C)} J·K⁻¹ et h × S = ${hSf(defi.hS)} W·K⁻¹ : τ = frac(C|h × S) = frac(${cJ(defi.C)} J·K⁻¹|${hSf(defi.hS)} W·K⁻¹) = ${nbf(defi.tau, 1)} min (marge acceptée : 15 %).`
            : `τ = frac(${cJ(defi.C)}|${hSf(defi.hS)}) = ${nbf(defi.qTau, 1)} min ; T(${cJ(defi.t)} min) = ${nbf(defi.qT, 1)} °C ; la durée pour atteindre ${cJ(defi.Tc)} °C vaut τ × ln(frac(${cJ(defi.T0)} − ${cJ(defi.Text)}|${cJ(defi.Tc)} − ${cJ(defi.Text)})) = ${nbf(defi.qT_t, 1)} min.`}</span>
          : <span style={{ fontWeight: 400 }}>{defi.type === 'tau' ? 'Repérez la date où T a parcouru 63 % de l’écart entre T_0 et T_ext, et vérifiez à nouveau (l’indice peut vous aider).' : 'Revoyez les unités (J·K⁻¹ divisés par W·K⁻¹ donnent des secondes), le signe de T_0 − T_ext et la formule de T(t), puis vérifiez à nouveau.'}</span>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Système</strong> : un liquide (assimilé à de l’eau), incompressible, de température T <strong>uniforme</strong> à chaque instant. Son énergie interne ne varie qu’avec T : ΔU = C ΔT, avec C = m × c (c = 4 180 J·kg⁻¹·K⁻¹, valeur tabulée usuelle pour l’eau).</li>
      <li><strong>Récipient</strong> : sa capacité thermique est négligée (le système est le liquide seul). En réalité la tasse absorbe aussi de l’énergie : la capacité thermique totale serait plus grande, donc τ aussi.</li>
      <li><strong>Thermostat</strong> : l’air de la pièce, de température T_ext <strong>constante</strong>, même s’il reçoit de l’énergie du système.</li>
      <li><strong>Loi de Newton</strong> (loi phénoménologique, fournie) : φ = h S (T_ext − T), avec h S <strong>constant</strong> ; φ est le flux <strong>reçu</strong> par le système (φ &gt; 0 s’il reçoit de l’énergie). Seul le transfert thermique est pris en compte : pas d’évaporation, pas de rayonnement traité à part, pas de changement d’état, pas de travail.</li>
      <li><strong>Valeurs fournies</strong> : les h S des différentes isolations (tasse nue 0,45 ; avec couvercle 0,30 ; mug isotherme 0,06 W·K⁻¹) sont des ordres de grandeur plausibles, non des mesures. Quand on change la masse, h S est gardé identique pour comparer (en réalité la surface d’échange change un peu). Les températures sont en °C : seuls des écarts interviennent, égaux en °C et en K.</li>
      <li><strong>Temps</strong> : t et τ en minutes (τ = C divisé par h S est d’abord obtenu en secondes). Régime pratiquement établi à partir de 5 τ (moins de 1 % de l’écart restant) ; en réalité il n’est jamais exactement atteint.</li>
      <li><strong>Mesures et acquisitions</strong> : les valeurs du panneau Mesures sont calculées par le modèle, pas mesurées. Les points des acquisitions sont simulés avec un bruit aléatoire de 0,15 K et arrondis à 0,1 °C ; la lecture de τ y est incertaine (marge de 15 %). La droite d’ajustement de la rubrique « Tester le modèle par ln y » (exploration) est tracée par moindres carrés.</li>
      <li><strong>Notations</strong> : T désigne T(t) ; φ est algébrique ; la même équation du premier ordre décrit la charge d’un condensateur (simulation « Circuit RC ») et une réaction d’ordre 1 (simulation « Cinétique : ordre 1 »).</li>
      <li><strong>Hors périmètre</strong> : premier principe général, résistance thermique, changements d’état et bilan Terre-atmosphère ne sont pas traités ici.</li>
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
  const montreScene = enGuide ? (idx < I.acquisition || idx === I.conclusion) : enExplore || (dd && dd.type === 'calcul');
  const tSceneDefi = dd && dd.type === 'calcul';
  const masseScene = enGuide ? PG.m : enExplore ? ex.m : tSceneDefi ? dd.C / M.C_EAU : 0.2;
  const isoScene = enGuide ? PG.iso : enExplore ? ex.iso : 'nue';
  const nomSys = enGuide ? 'le café' : 'le liquide';
  const ariaScene = `Un liquide dans une tasse (le système), posée dans une pièce à température constante, de ${nbf(Tpiece, 1)} °C (le thermostat). Température du liquide : ${nbf(tSceneDefi ? Tdep : T, 1)} °C.`;
  const scene = montreScene && <SceneTasse T={tSceneDefi ? Tdep : T} Text={Tpiece} masse={masseScene} isolation={isoScene} flecheTransfert={enGuide ? idx >= I.bilan : enExplore} nomSysteme={nomSys} aria={ariaScene}/>;
  const reperes = enGuide ? (idx === I.conclusion ? { tau: true, tangente: true, niveau: { T: Tpiece + Math.exp(-1) * (Tdep - Tpiece), txt: '37 % restants' } } : {})
    : enExplore ? { tau: ex.repTau, niveau: ex.repTau ? { T: Tpiece + Math.exp(-1) * (Tdep - Tpiece), txt: '37 % restants' } : null, tangente: ex.repTan, cinq: ex.repCinq } : {};
  const montreGraphe = acq ? true : enGuide ? ((idx >= I.unTau && idx !== I.froid && idx < I.acquisition) || idx === I.conclusion) : enExplore;
  const ariaGraphe = acq ? `Points de mesure bruités de la température d'un liquide au cours du temps, avec un curseur de lecture.`
    : `Courbe de la température T du liquide en fonction du temps t, qui tend vers la température T ext de la pièce${courbes.length > 1 ? ', pour deux essais' : ''}, avec un curseur de lecture.`;
  const grapheT = montreGraphe && (acq
    ? <GrapheT courbes={[{ T0: acq.T0, Text: acq.Text, tau: acq.tau }]} tMax={acq.tmax} pts={acq.pts} curseur={ptCourant ? { t: ptCourant.t, T: ptCourant.T } : null} tracerAsymptote aria={ariaGraphe}/>
    : <GrapheT courbes={courbes} tMax={tMax} curseur={sRef ? null : { t, T }} reperes={reperes} aria={ariaGraphe}/>);
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Un liquide (le système) refroidit ou se réchauffe dans une pièce à température constante (le thermostat). Faites avancer le temps et regardez T(t).</div>}
      {dd && dd.type === 'tau' && <div style={aide}>Points de mesure simulés. Avancez le curseur de mesure pour lire le temps et la température.</div>}
      {scene}
      {grapheT && <div style={{ marginTop: scene ? 10 : 0, ...cadre('graphe') }}>{grapheT}</div>}
    </div>);

  const boxSceneEx = (
    <div style={styleBoite}>
      <div style={aide}>Un liquide (le système) refroidit ou se réchauffe dans une pièce à température constante (le thermostat). Faites avancer le temps et regardez T(t).</div>
      {scene}
    </div>);
  const boxGrapheEx = <div style={styleBoite}>{grapheT}</div>;

  // ---------- commandes ----------
  const majOv = f => setOvG(o => ({ ...o, [idx]: { ...(o[idx] || {}), ...f } }));
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lblMenu = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const selectM = (val, on, nom = 'Masse de liquide') => (
    <label style={lblMenu}>{nom}
      <select value={val} onChange={e => on(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{M.MASSES.map(m => <option key={m} value={m}>{nbf(m, 2)} kg</option>)}</select></label>);
  const selectIso = (val, on, nom = 'Isolation du récipient') => (
    <label style={lblMenu}>{nom}
      <select value={val} onChange={e => on(e.target.value)} style={{ ...menu, marginTop: 2 }}>{M.ISOLATIONS.map(x => <option key={x.id} value={x.id}>{x.nom} (hS = {nbf(x.hS, 2)} W·K⁻¹)</option>)}</select></label>);
  const selectAller = (
    <select aria-label="Aller à un instant" value="" onChange={e => { if (e.target.value) allerA(Number(e.target.value)); }} style={{ ...menu, width: 'auto', minHeight: 36, fontSize: 13.5, padding: '4px 8px' }}>
      <option value="">Aller à…</option><option value="1">t = τ</option><option value="2">t = 2 τ</option><option value="3">t = 3 τ</option><option value="5">t = 5 τ</option></select>);
  const texteTemps = `t = ${nbt(t)}${NB}min`;
  const afficheTemps = enGuide && (idx === I.unTau || idx === I.pente);
  const boxCommandes = enGuide && (afficheTemps || idx === I.influence || idx === I.acquisition) && (
    <div style={{ ...styleBoite, ...cadre('curseurs') }}>
      {idx === I.acquisition && <>
        <div style={titreCarte}>Curseur de mesure</div><div style={aide}>Déplacez le curseur le long des points mesurés.</div>
        <ControleTemps nom="Curseur de mesure" valeur={jG} max={M.N_ECH - 1} onChange={setJG} texte={`t = ${nbt(ACQ.pts[jG].t)}${NB}min · T = ${nbf(ACQ.pts[jG].T, 1)}${NB}°C`} retablir="Rétablir (début)"/></>}
      {afficheTemps && <ControleTemps valeur={kG} max={kMax} onChange={setKG} texte={texteTemps} aller={selectAller} joue={joue} lancer={lancer} reduit={reduit} pasBouton={2}/>}
      {idx === I.influence && <>
        <div style={titreCarte}>Réglages du café (essai en trait plein)</div>
        {selectIso(PG.iso, x => majOv({ iso: x }))}
        {selectM(PG.m, x => majOv({ m: x }))}
        {modifie && <button onClick={() => setOvG(o => ({ ...o, [idx]: {} }))} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir la tasse nue de 0,20{NB}kg</button>}</>}
    </div>);

  // ---------- mesures ----------
  const lignesGuide = [['Temps caractéristique τ', `${nbt(sA.tau)}${NB}min`], ['Instant t', `${nbt(t)}${NB}min`], ['Température T', `${nbf(T, 1)}${NB}°C`]];
  const boxMesuresGuide = enGuide && afficheTemps && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      {lignesGuide.map(([n, vl]) => <LigneMesure key={n} nom={n} valeur={vl}/>)}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Valeurs à l’instant t choisi.</div>
      <LigneMesure nom="Capacité thermique C (essai A)" valeur={`${nbf(sA.C, 0)}${NB}J·K⁻¹`}/>
      <LigneMesure nom="Temps caractéristique τ (A)" valeur={`${nbt(sA.tau)}${NB}min`} couleur="#b45309"/>
      <LigneMesure nom="Instant t" valeur={`${nbt(t)}${NB}min (${nbf(t / sA.tau, 2)} τ)`}/>
      <LigneMesure nom="Température T (A)" valeur={`${nbf(T, 1)}${NB}°C`} couleur={BLEU}/>
      <LigneMesure nom="Flux thermique reçu φ (A)" valeur={`${nbf(M.flux(T, Tpiece, sA.hS), 1)}${NB}W`}/>
      <LigneMesure nom="Énergie reçue depuis t = 0" valeur={`${nbf(sA.C * (T - Tdep) / 1000, 1)}${NB}kJ`}/>
      {sB && <><LigneMesure nom="Temps caractéristique τ (B)" valeur={`${nbt(sB.tau)}${NB}min`} couleur="#b45309"/><LigneMesure nom="Température T (B)" valeur={`${nbf(TB, 1)}${NB}°C`} couleur="#b45309"/></>}
    </div>);
  const boxMesuresDefi = dd && dd.type === 'tau' && (
    <div style={styleBoite}>
      <div style={titreCarte}>Curseur de mesure</div>
      <div style={aide}>Déplacez le curseur le long des points : le temps et la température mesurée s’affichent.</div>
      <ControleTemps nom="Curseur de mesure" valeur={jD} max={dd.pts.length - 1} onChange={setJD} texte={`t = ${nbt(dd.pts[jD].t)}${NB}min · T = ${nbf(dd.pts[jD].T, 1)}${NB}°C`} retablir="Rétablir (début)" pasBouton={5}/>
    </div>);

  // ---------- réglages de l'exploration ----------
  const optT0 = M.T0_MENU.filter(v => v !== ex.Text), optText = M.T_EXT_MENU.filter(v => v !== ex.T0);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Faites avancer le temps avec le curseur ou « Lancer », puis changez le système ou les températures dans les rubriques ci-dessous.</div>
      <ControleTemps valeur={ex.k} max={kMax} onChange={k => setEx(s => ({ ...s, k }))} texte={texteTemps} aller={selectAller} joue={joue} lancer={lancer} reduit={reduit} pasBouton={2}/>
      <Section titre={`Système : ${txtSys(ex.m, ex.iso)}`} ouvert={ouv.sys} onBascule={() => setOuv(o => ({ ...o, sys: !o.sys }))}>
        <div style={aide}>La masse fixe la capacité thermique C ; l’isolation fixe h × S. Ensemble, ils donnent τ = C divisé par (h × S).</div>
        {selectM(ex.m, x => setEx(s => ({ ...s, m: x })))}
        {selectIso(ex.iso, x => setEx(s => ({ ...s, iso: x })))}
      </Section>
      <Section titre={`Températures : liquide ${nbf(ex.T0, 0)} °C · pièce ${nbf(ex.Text, 0)} °C`} ouvert={ouv.cond} onBascule={() => setOuv(o => ({ ...o, cond: !o.cond }))}>
        <div style={aide}>{avecIndices('T_0 est la température du liquide à t = 0, T_ext celle de la pièce (thermostat). Choisissez T_0 inférieure à T_ext pour un réchauffement.')}</div>
        <label style={lblMenu}>{avecIndices('Température initiale T_0 du liquide')}
          <select value={ex.T0} onChange={e => setEx(s => ({ ...s, T0: Number(e.target.value), k: 0 }))} style={{ ...menu, marginTop: 2 }}>{optT0.map(v => <option key={v} value={v}>{v} °C</option>)}</select></label>
        <label style={lblMenu}>{avecIndices('Température T_ext de la pièce')}
          <select value={ex.Text} onChange={e => setEx(s => ({ ...s, Text: Number(e.target.value), k: 0 }))} style={{ ...menu, marginTop: 2 }}>{optText.map(v => <option key={v} value={v}>{v} °C</option>)}</select></label>
      </Section>
      <Section titre={ex.comparer ? `Comparer avec un 2ᵉ essai : B = ${txtSys(ex.mB, ex.isoB)}` : 'Comparer avec un 2ᵉ essai'} ouvert={ouv.comp} onBascule={() => setOuv(o => ({ ...o, comp: !o.comp }))}>
        <div style={aide}>L’essai B, en tirets, part des mêmes températures : seuls le système (masse, isolation) changent.</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex.comparer} onChange={e => setEx(s => ({ ...s, comparer: e.target.checked }))} style={{ width: 20, height: 20 }}/>Afficher l’essai B</label>
        {ex.comparer && <>{selectM(ex.mB, x => setEx(s => ({ ...s, mB: x })), 'Masse de liquide (B)')}{selectIso(ex.isoB, x => setEx(s => ({ ...s, isoB: x })), 'Isolation du récipient (B)')}</>}
      </Section>
      <Section titre="Repères sur le graphique" ouvert={ouv.reperes} onBascule={() => setOuv(o => ({ ...o, reperes: !o.reperes }))}>
        <div style={aide}>Affichez les repères qui servent à déterminer τ (sur l’essai A).</div>
        {[['repTau', 'Repère τ (et 37 % de l’écart restant)'], ['repTan', 'Tangente à l’origine (coupe l’asymptote à t = τ)'], ['repCinq', 'Repère 5 τ (équilibre pratiquement atteint)']].map(([c, l]) =>
          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex[c]} onChange={e => setEx(s => ({ ...s, [c]: e.target.checked }))} style={{ width: 20, height: 20 }}/>{l}</label>)}
      </Section>
    </div>);
  const tLn = jL * 0.5;
  const lnExplore = (
    <Section titre="Tester le modèle par ln y (mesures d’un bécher)" ouvert={ouv.ln} onBascule={() => setOuv(o => ({ ...o, ln: !o.ln }))}>
      <div style={aide}>{indicesProfond(<>Si le modèle est le bon, la grandeur {eY} vérifie {eLn} : en représentant ln y en fonction de t, les points mesurés s’alignent sur une droite de pente −frac(1|τ).</>)}</div>
      <GrapheLn acq={ACQ} ajust={AJ} curseurT={tLn} aria="Logarithme de l’écart relatif y en fonction du temps pour les mesures d’un bécher d’eau chauffé, avec la droite d’ajustement et un curseur de lecture."/>
      <ControleTemps nom="Curseur" valeur={jL} max={40} onChange={setJL} texte={`t = ${nbt(tLn)}${NB}min · ln y = ${nbf(AJ.a + AJ.b * tLn, 2)}`} retablir="Rétablir (t = 0)"/>
      <div style={aide}>{indicesProfond(<>Pente de la droite : {nbf(AJ.b, 2)}{NB}min⁻¹, soit τ = −frac(1|pente) ≈ {nbf(TAU_FIT, 1)}{NB}min (valeur de τ du bécher : {nbt(ACQ.tau)}{NB}min).</>)}</div>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez la masse de liquide (même isolation) : que devient τ ? Et la température finale ?</li>
        <li>Comparez la tasse nue et le mug isotherme avec l’essai B : à quel instant chacun passe-t-il sous 50 °C ?</li>
        <li>Changez T_ext sans toucher au système : τ change-t-il ? Et la température finale ?</li>
        <li>Choisissez T_0 inférieure à T_ext : que devient le signe du flux φ ? La courbe a-t-elle la même forme ?</li>
        <li>Affichez la tangente à l’origine et le repère τ : où la tangente coupe-t-elle l’asymptote ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Loi de Newton : φ = h S (T_ext − T), flux reçu par le système ; bilan : C ΔT = φ Δt</li>
          <li>Équation différentielle : {eEqTau} avec {eTauDef}</li>
          <li>Solution : T(t) = T_ext + (T_0 − T_ext) × {eExpo}</li>
          <li>À t = τ : 37 % de l’écart initial restent ; tangente à l’origine : coupe l’asymptote à t = τ ; équilibre pratique à 5 τ</li>
          <li>τ augmente avec C et diminue avec h S ; il ne dépend ni de T_0 ni de T_ext</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .thm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .thm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .thm-col { display: flex; flex-direction: column; gap: 12px; }
        .thm-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .thm-l1.cote .thm-carte { order: 2; } .thm-l1.cote .thm-main { order: 1; }
          .thm-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .thm-ex > * { grid-column: 1; } .thm-ex > .thm-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .thm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .thm-in { animation: thm-fondu 0.35s ease-out; } @keyframes thm-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Loi de Newton et thermostat : température au cours du temps</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un liquide chaud (ou froid) placé dans une pièce à température constante se rapproche progressivement de la température de la pièce{(enGuide && !deja('tau')) ? '.' : <> : la durée du phénomène est donnée par le <strong>temps caractéristique</strong> {eTauDef}.</>}</div>
      {!enExplore && <div className="thm-l1 cote">
        {enGuide ? <div className="thm-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="thm-carte">{panneauHypo}</div> : null}
        <div className="thm-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'tau' ? suiviT : suiviC}/></div>}
          <div className="thm-col">
            {(!enDefi || defi) && (scene || grapheT) && <div className="thm-in">{boxScene}</div>}
            {boxCommandes && <div className="thm-in">{boxCommandes}</div>}
            {boxMesuresDefi && <div className="thm-in">{boxMesuresDefi}</div>}
            {boxMesuresGuide && <div className="thm-in">{boxMesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="thm-ex">
        <div>{boxSceneEx}</div>
        <div className="thm-ctrl">{reglagesEx}</div>
        <div>{boxGrapheEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{lnExplore}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('conclusion') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
