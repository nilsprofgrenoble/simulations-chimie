import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, ARetenir, IndiceDefi, LigneMesure, Curseur, fmt, ORANGE_GUIDE } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./tcrModele";
import * as MAB from "./mabModele";
import { QCM_PARCOURS as Q } from "./tcrQcm";
import { StylesTcr, SceneDosage, GraphQuantites, SvgReactionCarte, SvgMilieuCarte, SvgSituationsCarte, SvgEquivalenceCarte, SvgCalculCarte } from "./tcrSchemas";
import { StylesSchemas, EquationPuces, Legende } from "./mabSchemas";

const SIM_ID = 295, CLE_GUIDE = 'titrage-redox-direct-tstl-guide-v1';
declarerDefis(SIM_ID, [['dosage', 'Doser une eau oxygénée'], ['calcul', 'Calculer à partir de V_E']]);

// ====================================================
// SIM 295 — TITRAGE REDOX DIRECT AVEC CHANGEMENT DE COULEUR (TSTL SPCL, chapitre « Oxydo-réduction »).
//  Capacité visée (jamais affichée à l’élève) : déterminer une concentration à l’aide des données d’un titrage direct (équivalence repérée par un changement de couleur).
//  Modèle : tcrModele.js. Situation originale : eau oxygénée d’un désinfectant dosée par du permanganate de potassium en milieu acide.
// ====================================================

const IDS = ['montage', 'equation', 'milieu', 'rapide', 'situations', 'equiv', 'precis', 'relation', 'nMnO4', 'nH2O2', 'cA', 'c0', 'bilan'];
const DEBIT = 1.5;                         // mL par seconde, robinet ouvert
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const modeTest = () => typeof window !== 'undefined' && !!window.__PARCOURS_TEST__;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const SG = M.situation(M.SIT_GUIDE);       // situation du parcours guidé : V_E = 17,40 mL
const VE_TXT = '17,4';
const EQ = MAB.reaction('MnO4m/Mn2p', 'O2/H2O2', 'acide');
const PRINC = { ox: ['MnO4m'], red: ['H2O2'] };
const fmtC = c => (c < 0.1 ? `${(c * 100).toFixed(2).replace('.', ',')}×10⁻² mol/L` : `${fmt(c, 2)} mol/L`);
const LIB_REGLAGE = { acide: 'Acide sulfurique ajouté (milieu acide)', neutre: 'Aucun acide ajouté (milieu neutre)' };
const BONNES_SIT = { avant: { t: 'incolore', l: 'MnO₄⁻', e: 'H₂O₂' }, eq: { t: 'incolore', l: 'les deux', e: 'aucun' }, apres: { t: 'rose persistant', l: 'H₂O₂', e: 'MnO₄⁻' } };
const OPTS_SIT = { t: ['incolore', 'rose persistant'], l: ['MnO₄⁻', 'H₂O₂', 'les deux'], e: ['MnO₄⁻', 'H₂O₂', 'aucun'] };
const NOMS_SIT = [['avant', 'Avant l’équivalence'], ['eq', 'À l’équivalence'], ['apres', 'Après l’équivalence']];
const situationsOk = sit => NOMS_SIT.every(([k]) => ['t', 'l', 'e'].every(c => sit[k] && sit[k][c] === BONNES_SIT[k][c]));

const SelectGen = ({ nom, valeur, onChange, options, aide, petit = false }) => (
  <label style={{ display: 'block', fontSize: petit ? 13 : 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: petit ? 4 : 8 }}>{avecIndices(nom)}
    <select value={valeur} onChange={e => onChange(e.target.value)} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', display: 'block', marginTop: 4 }}>
      {options.map(([v, l, off]) => <option key={v} value={v} disabled={off}>{l}</option>)}
    </select>{aide && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{aide}</span>}</label>);

// ====================================================
export function SimulationTitrageRedoxDirect() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('dosage');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false, solution: false });
  const [reduit] = useState(mouvementReduit);
  const [par, setPar] = useState({ c0: 0.87, VA: 10, cB: 0.02, acide: true });
  const [sit, setSit] = useState({ verif: false });
  const [mes, setMes] = useState({ Vrapide: null, Ve: null });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- le dosage : volume versé, robinet, tache violette qui se dissipe ----------
  const [V, setVRaw] = useState(0), Vr = useRef(0);
  const setV = v => { Vr.current = v; setVRaw(v); };
  const [ouvert, setOuvert] = useState(false), [goutteCle, setGoutteCle] = useState(0), [declare, setDeclare] = useState(null);
  const [trans, setTrans] = useState(0), transRef = useRef({ val: 0, tau: 1 }), [kick, setKick] = useState(0);
  const idE = enGuide ? IDS[Math.min(guide.etape, IDS.length - 1)] : null;
  const s = enExplore ? M.situation({ c0: par.c0, dil: 10, VA: par.VA, cB: par.cB, acide: par.acide }) : enDefi && defi && defi.type === 'dosage' ? defi.s : SG;
  const sRef = useRef(s); useEffect(() => { sRef.current = s; });
  const e = M.etat(s, V);
  const injecter = (dv, Vavant) => {
    const r = transRef.current, loin = sRef.current.Veq - Vavant;
    r.tau = Vavant < 0.6 ? 2.6 : loin < 0.4 && loin > -1 ? 1.5 : 0.8;          // premières gouttes plus lentes (catalyse par Mn²⁺), et près de l’équivalence
    r.val = modeTest() ? 0 : Math.min(1, r.val + dv / M.V_GOUTTE * 0.9);
    setKick(k => k + 1);
  };
  useEffect(() => {
    if (transRef.current.val <= 0) return undefined;
    let id, t0 = performance.now();
    const pas = t => {
      const dt = (t - t0) / 1000; t0 = t; const r = transRef.current;
      r.val *= Math.exp(-dt / r.tau); if (r.val < 0.012) r.val = 0;
      setTrans(r.val); if (r.val > 0) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [kick]);
  useEffect(() => {
    if (!ouvert) return undefined;
    let id, t0 = performance.now();
    const pas = t => {
      const dt = Math.min(0.1, (t - t0) / 1000); t0 = t;
      const nv = Math.min(M.V_BURETTE, Vr.current + DEBIT * dt);
      injecter(nv - Vr.current, Vr.current); setV(nv);
      if (nv >= M.V_BURETTE) setOuvert(false); else id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [ouvert]);
  function verser(dv) {
    setOuvert(false); setDeclare(null);
    const nv = Math.min(M.V_BURETTE, Math.round((Vr.current + dv) * 100) / 100);
    injecter(nv - Vr.current, Vr.current); setV(nv); setGoutteCle(k => k + 1);
  }
  function nouveauDosage() { setOuvert(false); setDeclare(null); Vr.current = 0; setVRaw(0); transRef.current.val = 0; setTrans(0); setGoutteCle(0); }
  // le dosage repart de zéro quand l’élève change de mode, d’étape de dosage ou de réglage (remise à zéro au moment du rendu, sans effet)
  const c0Defi = defi && defi.type === 'dosage' ? defi.c0 : 0;
  const cleReset = `${mode}|${enGuide && (idE === 'rapide' || idE === 'precis') ? idE : ''}|${par.c0}|${par.VA}|${par.cB}|${par.acide}|${c0Defi}`;
  const [cleVue, setCleVue] = useState(cleReset);
  if (cleVue !== cleReset) { setCleVue(cleReset); setOuvert(false); setDeclare(null); setVRaw(0); setTrans(0); setGoutteCle(0); }
  useEffect(() => { Vr.current = 0; transRef.current.val = 0; }, [cleReset]);

  const coulBase = s.acide ? M.couleurMnO4(e.cMnO4) : 'rgb(236, 226, 214)';
  const mot = !s.acide ? (V > 0 ? 'brun, trouble' : 'incolore') : M.motTeinte(e.cMnO4);

  function decolore() {             // dosage rapide : la teinte rose doit persister
    setOuvert(false);
    if (!e.visible) { setDeclare({ ok: false, msg: 'La solution est encore incolore : continuez à verser.' }); return; }
    setDeclare({ ok: true, msg: `Teinte rose persistante à ${fmt(V, 1)} mL : c’est une valeur approchée (vous avez sans doute un peu dépassé l’équivalence).` });
    if (enGuide) setMes(x => ({ ...x, Vrapide: Math.round(V * 10) / 10 }));
  }
  function declarer(pour) {         // dosage précis : à environ deux gouttes près
    setOuvert(false);
    const ecart = V - s.Veq;
    const r = !s.acide ? { ok: false, msg: 'Sans acide, la teinte brune du dioxyde de manganèse masque la fin de la réaction : le dosage n’est pas exploitable.' }
      : !e.visible ? { ok: false, msg: 'Pas encore : la solution n’est pas rose. Continuez à verser goutte à goutte.' }
        : ecart > 0.12 ? { ok: false, msg: pour === 'defi' ? 'Vous êtes allé trop loin : la teinte est déjà bien marquée. Recommencez un dosage en finissant goutte à goutte.' : `Vous avez dépassé l’équivalence d’environ ${fmt(ecart, 2)} mL. Recommencez, en finissant goutte à goutte.` }
          : { ok: true, msg: `Équivalence repérée : V_E = ${fmt(V, 2)} mL.` };
    setDeclare(r);
    if (r.ok && enGuide && idE === 'precis') setMes(x => ({ ...x, Ve: Math.round(V * 100) / 100 }));
    if (r.ok && enDefi) setDefi(d => ({ ...d, Vmes: Math.round(V * 100) / 100, verifie: false }));
  }

  // ---------- parcours guidé ----------
  const etape = guide.etape, reussie = !!(guide.reussies && guide.reussies[etape]);
  const idx = id => IDS.indexOf(id);
  const vu = id => !enGuide || etape >= idx(id), passe = id => !enGuide || etape > idx(id);
  const et0 = id => IDS[etape] === id;
  const un = (d, cle) => { const st = d.stades.find(x => x.cle === cle); return { g: st.gauche, d: st.droite }; };
  const dMn = MAB.demiEquation('MnO4m/Mn2p'), dO2 = MAB.demiEquation('O2/H2O2');
  const ETAPES = [
    { id: 'montage', titre: 'Le montage du dosage', focus: ['burette', 'erlen'],
      texte: <>On veut connaître la <strong>concentration de l’eau oxygénée</strong> d’un désinfectant du commerce, dont on a <strong>dilué 10 fois</strong> un échantillon. On la <strong>dose</strong> avec une solution de <strong>permanganate de potassium</strong> (violette), de concentration connue <strong>c<sub>B</sub> = 2,00×10⁻² mol/L</strong>. On prélève <strong>V<sub>A</sub> = 10,0 mL</strong> de la solution diluée d’eau oxygénée et on les place dans l’erlenmeyer, avec un peu d’acide sulfurique ; l’erlenmeyer est posé sur un agitateur magnétique, devant un fond blanc.</>,
      tache: { type: 'qcm', q: 'Quelle solution met-on dans la burette ?', ...Q.montage,
        expl: 'On verse le titrant, de concentration connue (le permanganate), dans la solution à doser placée dans l’erlenmeyer. On prélève cette dernière avec précision (pipette jaugée) ; le volume de titrant versé se lit sur la burette.',
        indice: 'Le titrant est la solution de concentration connue, versée peu à peu. Laquelle des deux solutions est connue ici ?' } },
    { id: 'equation', titre: 'L’équation du titrage', focus: [],
      texte: <>La réaction support est une réaction d’oxydo-réduction entre les couples <strong>MnO₄⁻ / Mn²⁺</strong> et <strong>O₂ / H₂O₂</strong> (équation établie dans la simulation « Équations en milieu acide ou basique »). Leurs demi-équations, en milieu acide, sont affichées sous le schéma. Le permanganate <strong>capte 5 e⁻</strong> ; l’eau oxygénée <strong>cède 2 e⁻</strong> : on multiplie la première demi-équation par 2 et la seconde par 5 (10 e⁻ échangés), puis on additionne.</>,
      tache: { type: 'num', q: 'Combien de molécules H₂O₂ réagissent avec 2 ions MnO₄⁻ ?', unite: 'molécules', vrai: 5, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Les 2 MnO₄⁻ captent 2 × 5 = 10 e⁻.', 'Chaque H₂O₂ cède 2 e⁻ : il en faut 10 / 2 = 5.'],
        pieges: [[2, 'Deux est le nombre d’ions MnO₄⁻ : chaque H₂O₂ ne cède que 2 e⁻, alors que les 2 MnO₄⁻ en captent 10 au total.'], [10, 'Dix est le nombre d’électrons échangés : chaque H₂O₂ en cède 2, il en faut donc 10 / 2.']],
        expl: 'On obtient 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O : 10 e⁻ sont échangés.',
        indice: 'Chaque MnO₄⁻ capte 5 e⁻, chaque H₂O₂ en cède 2. Pour 2 ions MnO₄⁻, combien d’électrons faut-il fournir, et combien de H₂O₂ pour les fournir ?' } },
    { id: 'milieu', titre: 'Le rôle du milieu acide', focus: ['erlen'],
      retenirTitre: 'À retenir : qui réagit avec qui ?', retenir: <>
        <SvgReactionCarte/>
        <Ul>
          <li>Les <strong>coefficients</strong> de l’équation donnent le rapport des quantités : <strong>2 MnO₄⁻ pour 5 H₂O₂</strong>, donc n(H₂O₂) = 5/2 × n(MnO₄⁻) à l’équivalence.</li>
          <li>Moyen de s’en souvenir : <strong>« 5 sur 2 pour l’eau oxygénée »</strong> (le coefficient de la espèce cherchée en haut).</li>
          <li>Idée fausse : « un ion MnO₄⁻ réagit avec une molécule H₂O₂ » : le rapport est de 2 pour 5, pas de 1 pour 1.</li>
        </Ul></>,
      texte: <>L’équation montre que les ions <strong>H⁺</strong> sont des <strong>réactifs</strong> : on ajoute donc de l’acide sulfurique dans l’erlenmeyer <strong>avant</strong> le dosage. (On évite l’acide chlorhydrique, dont les ions chlorure sont oxydés par le permanganate, et l’acide nitrique, qui est un oxydant.)</>,
      tache: { type: 'qcm', q: 'Pourquoi ajoute-t-on de l’acide sulfurique dans l’erlenmeyer ?', ...Q.milieu,
        expl: 'Dans l’équation, 6 H⁺ figurent parmi les réactifs. Sans acide, le permanganate est réduit en dioxyde de manganèse MnO₂, brun : il masque la teinte et la réaction n’a plus la même équation, donc le dosage serait inexploitable.',
        indice: 'Regardez l’équation 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → … : de quel côté figurent les ions H⁺ ? À quoi servent des réactifs ?' } },
    { id: 'rapide', titre: 'Un premier dosage rapide', focus: ['burette', 'erlen'],
      retenirTitre: 'À retenir : le rôle du milieu acide', retenir: <>
        <SvgMilieuCarte/>
        <Ul>
          <li>Les <strong>ions H⁺ sont des réactifs</strong> : on acidifie l’erlenmeyer à l’acide sulfurique <strong>avant</strong> de doser ; sans acide, il se forme du MnO₂ brun.</li>
          <li>Moyen de s’en souvenir : <strong>« pas d’acide, pas de dosage »</strong>.</li>
          <li>Idée fausse : « tous les acides conviennent » : HCl (Cl⁻ oxydé) et HNO₃ (oxydant) fausseraient le dosage.</li>
        </Ul></>,
      texte: <>Les commandes sont apparues. <strong>Ouvrez le robinet</strong> (ou versez par 1 mL) et observez l’erlenmeyer : les premières gouttes violettes disparaissent peu à peu. Arrêtez-vous quand une <strong>teinte rose ne disparaît plus</strong>, puis cliquez sur « La teinte rose persiste ». Le volume de permanganate versé à ce moment est le <strong>volume équivalent V<sub>E</sub></strong> (à quelques gouttes près) ; ce premier essai, rapide, n’en donne qu’une valeur approchée.</>,
      tache: { type: 'action', ok: mes.Vrapide != null, consigne: mes.Vrapide != null ? `✅ V_E ≈ ${fmt(mes.Vrapide, 1)} mL` : `Versé : ${fmt(V, 2)} mL` } },
    { id: 'situations', titre: 'Avant, à et après l’équivalence', focus: ['erlen'],
      texte: <>Le tableau est apparu sous le schéma. Pour chaque situation, indiquez la <strong>teinte</strong> de la solution, le <strong>réactif limitant</strong> (celui qui est entièrement consommé) et le <strong>réactif en excès</strong>.</>,
      tache: { type: 'action', ok: sit.verif && situationsOk(sit), consigne: sit.verif && situationsOk(sit) ? null : 'Remplissez le tableau, puis cliquez sur « Vérifier le tableau ».' } },
    { id: 'equiv', titre: 'Repérer l’équivalence', focus: ['erlen'],
      retenirTitre: 'À retenir : avant, à et après l’équivalence', retenir: <>
        <SvgSituationsCarte/>
        <Ul>
          <li><strong>Avant</strong> : le permanganate versé est entièrement consommé (limitant), H₂O₂ est en excès : <strong>incolore</strong>. <strong>À l’équivalence</strong> : plus aucun excès. <strong>Après</strong> : MnO₄⁻ en excès : <strong>rose</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« incolore, incolore, rose »</strong>.</li>
          <li>Idée fausse : « la solution est violette avant l’équivalence » : elle ne l’est que le temps de mélanger chaque goutte.</li>
        </Ul></>,
      texte: <>À l’<strong>équivalence</strong>, on a versé juste assez de permanganate pour faire réagir <strong>tout</strong> l’eau oxygénée. Ici, on n’ajoute <strong>aucun indicateur coloré</strong> : le permanganate lui-même est violet, alors que les ions Mn²⁺ sont pratiquement incolores.</>,
      tache: { type: 'qcm', q: 'Comment repère-t-on l’équivalence ?', ...Q.equiv,
        expl: 'Avant l’équivalence, chaque goutte de permanganate est consommée : la solution reste incolore. Après, le permanganate en excès colore la solution : la première goutte qui reste rose marque l’équivalence, à une goutte près (environ 0,05 mL).',
        indice: 'Qu’arrive-t-il à la couleur violette d’une goutte de permanganate tant qu’il reste de l’eau oxygénée ? Et quand il n’en reste plus ?' } },
    { id: 'precis', titre: 'Un dosage précis, goutte à goutte', focus: ['burette', 'erlen'],
      retenirTitre: 'À retenir : la goutte qui reste rose', retenir: <>
        <SvgEquivalenceCarte/>
        <Ul>
          <li>Le permanganate est <strong>son propre indicateur</strong> : l’équivalence est la <strong>première goutte dont la teinte rose reste</strong>. On finit <strong>goutte à goutte</strong> (1 goutte ≈ 0,05 mL).</li>
          <li>Moyen de s’en souvenir : <strong>« la goutte qui reste rose »</strong>.</li>
          <li>Idée fausse : « il faut ajouter un indicateur coloré » : ici le réactif versé joue ce rôle.</li>
        </Ul></>,
      texte: <>Nouveau dosage. Versez rapidement jusqu’à environ <strong>{mes.Vrapide != null ? `${fmt(Math.max(0, mes.Vrapide - 1), 1)} mL` : 'V_E − 1 mL'}</strong>, puis finissez <strong>goutte à goutte</strong> (1 goutte ≈ 0,05 mL ≈ 1 graduation du zoom). Dès que la <strong>première goutte reste rose</strong>, cliquez sur « C’est l’équivalence ! ».</>,
      tache: { type: 'action', ok: mes.Ve != null, consigne: mes.Ve != null ? `✅ V_E = ${fmt(mes.Ve, 2)} mL` : `Versé : ${fmt(V, 2)} mL` } },
    { id: 'relation', titre: 'La relation à l’équivalence', focus: [],
      texte: <>À l’équivalence, les réactifs ont été introduits dans les proportions de l’équation <strong>2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O</strong> :<div style={{ textAlign: 'center', fontSize: 17, margin: '6px 0' }}><strong>n(H₂O₂) / 5 = n(MnO₄⁻) / 2</strong>, soit <strong>n(H₂O₂) = 5/2 × n(MnO₄⁻)</strong></div>où n(H₂O₂) est la quantité d’eau oxygénée présente au départ dans l’erlenmeyer et n(MnO₄⁻) la quantité de permanganate versée jusqu’à l’équivalence.</>,
      tache: { type: 'qcm', q: 'Pourquoi multiplie-t-on n(MnO₄⁻) par 5/2 ?', ...Q.relation,
        expl: 'Les coefficients de l’équation sont 5 pour H₂O₂ et 2 pour MnO₄⁻ : à l’équivalence, n(H₂O₂) / 5 = n(MnO₄⁻) / 2.',
        indice: 'Regardez les coefficients de H₂O₂ et de MnO₄⁻ dans l’équation : combien de H₂O₂ pour 2 MnO₄⁻ ?' } },
    { id: 'nMnO4', titre: 'Le permanganate versé', focus: ['burette'],
      texte: <>Supposons que le dosage donne <strong>V<sub>E</sub> = {VE_TXT} mL</strong>. La burette contient du permanganate à <strong>c<sub>B</sub> = 2,00×10⁻² mol/L</strong>. La quantité de permanganate versée est n(MnO₄⁻) = c<sub>B</sub> × V<sub>E</sub> (avec un volume en mL, le résultat est en mmol).</>,
      tache: { type: 'num', q: 'Quelle quantité n(MnO₄⁻) a été versée ?', unite: 'mmol', vrai: 0.348, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'n(MnO₄⁻) versée',
        calcul: () => ['n(MnO₄⁻) = c_B × V_E.', 'c_B = 2,00×10⁻² mol/L ; V_E = 17,4 mL.', '2,00×10⁻² × 17,4 = 0,348 : le résultat est en mmol (mol/L × mL).'],
        pieges: [[348, 'Vous avez écrit 348 : mol/L × mL donne des mmol, et 0,348 mmol = 348 µmol.'], [0.000348, 'Vous avez donné la valeur en mol (3,48×10⁻⁴ mol) : on demande ici des mmol.']],
        expl: 'n(MnO₄⁻) = 2,00×10⁻² × 17,4 = 0,348 mmol.', indice: 'Multipliez la concentration c_B = 2,00×10⁻² mol/L par le volume V_E = 17,4 mL : le produit est en mmol.' } },
    { id: 'nH2O2', titre: 'L’eau oxygénée dosée', focus: [],
      texte: <>Rappel : n(MnO₄⁻) = 0,348 mmol à l’équivalence. D’après l’équation, <strong>n(H₂O₂) = 5/2 × n(MnO₄⁻)</strong>, où n(H₂O₂) est la quantité d’eau oxygénée contenue dans les 10,0 mL prélevés.</>,
      tache: { type: 'num', q: 'Quelle quantité n(H₂O₂) était dans l’erlenmeyer ?', unite: 'mmol', vrai: 0.870, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'n(H₂O₂) dosée',
        calcul: () => ['n(H₂O₂) = 5/2 × n(MnO₄⁻) = 2,5 × 0,348.', '2,5 × 0,348 = 0,870 mmol.'],
        pieges: [[0.139, 'Vous avez multiplié par 2/5 : c’est 5/2 (5 H₂O₂ pour 2 MnO₄⁻).'], [0.348, 'Vous avez gardé la quantité de permanganate : il faut tenir compte des coefficients de l’équation.'], [1.74, 'Vous avez multiplié par 5 : le rapport est 5/2, pas 5.']],
        expl: 'n(H₂O₂) = 5/2 × 0,348 = 0,870 mmol.', indice: 'Multipliez n(MnO₄⁻) = 0,348 mmol par 5/2, c’est-à-dire par 2,5.' } },
    { id: 'cA', titre: 'La concentration de la solution diluée', focus: [],
      texte: <>Rappel : n(H₂O₂) = 0,870 mmol dans <strong>V<sub>A</sub> = 10,0 mL</strong>. La concentration de la solution diluée est <strong>c<sub>A</sub> = n(H₂O₂) / V<sub>A</sub></strong>.</>,
      tache: { type: 'num', q: 'Quelle est la concentration c_A ?', unite: 'mol/L', vrai: 0.0870, tol: 0.01, cs: 3, affiche: v => fmt(v, 4), carnet: 'c_A (solution diluée)',
        calcul: () => ['c_A = n(H₂O₂) / V_A = 0,870 mmol / 10,0 mL.', 'mmol / mL = mol/L : 0,870 / 10,0 = 0,0870 mol/L.'],
        pieges: [[0.87, 'Vous avez gardé 0,870 : il faut diviser la quantité de matière par le volume V_A = 10,0 mL.'], [0.00870, 'Vous avez divisé deux fois par 10 : 0,870 mmol / 10,0 mL = 0,0870 mol/L.']],
        expl: 'c_A = 0,870 / 10,0 = 0,0870 mol/L.', indice: 'Divisez 0,870 mmol par 10,0 mL : mmol divisé par mL donne des mol/L.' } },
    { id: 'c0', titre: 'L’eau oxygénée du commerce', focus: [],
      texte: <>La solution dosée a été obtenue en <strong>diluant 10 fois</strong> l’eau oxygénée du commerce : c<sub>A</sub> = c<sub>0</sub> / 10, où c<sub>0</sub> est la concentration de l’eau oxygénée du commerce. Rappel : c<sub>A</sub> = 0,0870 mol/L.</>,
      tache: { type: 'num', q: 'Quelle est la concentration c_0 de l’eau oxygénée du commerce ?', unite: 'mol/L', vrai: 0.870, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'c_0 (eau oxygénée du commerce)',
        calcul: () => ['Dilution : c_A = c_0 / 10, donc c_0 = 10 × c_A.', '10 × 0,0870 = 0,870 mol/L.'],
        pieges: [[0.00870, 'Vous avez divisé par 10 : l’échantillon du commerce est plus concentré que la solution diluée.'], [0.087, 'C’est la concentration de la solution diluée c_A : il reste à tenir compte de la dilution (× 10).']],
        expl: 'c_0 = 10 × 0,0870 = 0,870 mol/L, soit environ 30 g/L (0,870 × 34,0 ≈ 29,6 g/L), c’est-à-dire de l’ordre de 3 g pour 100 mL.', indice: 'La solution du commerce a été diluée 10 fois : sa concentration est 10 fois plus grande que c_A.' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : du volume équivalent à la concentration', retenir: <>
        <SvgCalculCarte/>
        <Ul>
          <li>On verse le titrant jusqu’à l’<strong>équivalence</strong> (teinte rose persistante), puis : <strong>n(MnO₄⁻) = c<sub>B</sub> × V<sub>E</sub></strong>, <strong>n(H₂O₂) = 5/2 × n(MnO₄⁻)</strong>, <strong>c<sub>A</sub> = n(H₂O₂) / V<sub>A</sub></strong>, puis la dilution.</li>
          <li>Moyen de s’en souvenir : <strong>« verser, 5/2, diviser, multiplier par la dilution »</strong>.</li>
          <li>Idée fausse : « on divise par 5/2 » : l’eau oxygénée a le plus grand coefficient, sa quantité est la plus grande.</li>
        </Ul></>,
      texte: <>Vous avez réalisé un <strong>dosage direct avec changement de couleur</strong> : montage, équation, rôle du milieu acide, repérage de l’équivalence, calcul de la concentration. En exploration, vous pouvez changer l’eau oxygénée, le volume prélevé et le permanganate, et même supprimer l’acide pour voir ce qui se passe. Les défis vous demandent de doser une eau oxygénée dont la concentration est cachée.</> },
  ];

  const boxEquation = (vu('equation') || !enGuide) && (
    <div className="tcr-fondu" style={styleBoite}>
      {enGuide && !(passe('equation') || (et0('equation') && reussie)) ? <>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', marginBottom: 6 }}>Demi-équations en milieu acide</div>
        <EquationPuces gauche={un(dMn, 'charges').g} droite={un(dMn, 'charges').d} principaux={{ ox: ['MnO4m'], red: [] }}/>
        <div style={{ height: 8 }}/>
        <EquationPuces gauche={un(dO2, 'charges').g} droite={un(dO2, 'charges').d} principaux={{ ox: ['O2'], red: ['H2O2'] }}/>
      </> : <>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', marginBottom: 6 }}>Équation de la réaction de titrage</div>
        <EquationPuces gauche={EQ.final.reactifs} droite={EQ.final.produits} flecheTxt="→" principaux={PRINC}/>
      </>}
      <div style={{ marginTop: 8 }}><Legende/></div>
    </div>);

  // ---------- le tableau des trois situations ----------
  const tableau = (
    <div className="tcr-fondu" style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Les trois situations</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {NOMS_SIT.map(([k, nom]) => (
          <div key={k} style={{ border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8, background: '#fff' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{nom}</div>
            <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
              {[['t', 'Teinte'], ['l', 'Réactif limitant'], ['e', 'Réactif en excès']].map(([c, lib]) => {
                const v = sit[k] ? sit[k][c] : '', bonne = sit.verif ? v === BONNES_SIT[k][c] : undefined;
                return <label key={c} style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{lib}
                  <select value={v || ''} aria-label={`${nom} : ${lib}`} onChange={ev => { const x = ev.target.value; setSit(o => ({ ...o, [k]: { ...(o[k] || {}), [c]: x }, verif: false })); }}
                    style={{ font: 'inherit', fontSize: 14.5, padding: '6px 8px', minHeight: 40, borderRadius: 8, width: '100%', boxSizing: 'border-box', marginTop: 3, background: '#fff', color: KIT.txt,
                      border: `2px solid ${bonne === undefined ? KIT.bord : bonne ? '#15803d' : '#dc2626'}` }}>
                    <option value="">?</option>{OPTS_SIT[c].map(o => <option key={o} value={o}>{o}</option>)}
                  </select></label>;
              })}
            </div>
          </div>))}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setSit(o => ({ ...o, verif: true }))} style={styleBouton(true, '#15803d')}>Vérifier le tableau</button>
        {sit.verif && <span style={{ fontSize: 14, fontWeight: 700, color: situationsOk(sit) ? '#15803d' : '#b91c1c' }}>{situationsOk(sit) ? '✅ Tableau juste' : '❌ Une case est à revoir (entourée en rouge)'}</span>}
      </div>
    </div>);

  // ---------- commandes, mesures, schéma ----------
  const etiqB = (!enGuide || passe('montage')) ? ['KMnO₄ (permanganate)', `c = ${fmtC(s.cB)}`] : null;
  const etiqErlen = [`${fmt(s.VA, 1)} mL d’eau oxygénée`, 'diluée 10 fois', s.acide ? '+ 5 mL de H₂SO₄' : 'sans acide'];
  const schema = <SceneDosage anime={!reduit} V={V} coul={coulBase} trans={trans} ouvert={ouvert} goutteCle={goutteCle} mot={mot} acide={s.acide} bulles={s.acide}
    etiqBurette={etiqB} etiqErlen={etiqErlen} hl={id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id)}/>;
  const commandes = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => { setDeclare(null); setOuvert(o => !o); }} style={styleBouton(true, ouvert ? '#dc2626' : '#16a34a')}>{ouvert ? '⏹ Fermer le robinet' : '▶ Ouvrir le robinet'}</button>
        <button onClick={() => verser(1)} style={styleBouton(false)}>+ 1 mL</button>
        <button onClick={() => verser(0.1)} style={styleBouton(false)}>+ 0,1 mL</button>
        <button onClick={() => verser(M.V_GOUTTE)} style={styleBouton(false)}><Pic n="drop"/>1 goutte</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {enGuide && et0('rapide')
          ? <button onClick={decolore} style={styleBouton(true, ORANGE_GUIDE)}><Pic n="target"/>La teinte rose persiste</button>
          : <button onClick={() => declarer(enDefi ? 'defi' : 'autre')} style={styleBouton(true, ORANGE_GUIDE)}><Pic n="target"/>C’est l’équivalence !</button>}
        <button onClick={nouveauDosage} style={styleBouton(false)}>↺ Nouveau dosage</button>
      </div>
      {declare && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: declare.ok ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>{declare.ok ? '✅ ' : '❌ '}{avecIndices(declare.msg)}</div>}
    </div>);
  const mesures = (
    <div style={styleBoite}>
      <LigneMesure nom="Volume versé (lu sur la burette)" valeur={`${fmt(V, 2)} mL`} couleur="#7e22ce"/>
      {enExplore && <>
        <LigneMesure nom="Teinte de la solution" valeur={mot}/>
        <LigneMesure nom="n(MnO₄⁻) versée" valeur={`${fmt(e.nB, 3)} mmol`}/>
        {s.acide && <LigneMesure nom="n(H₂O₂) restant" valeur={`${fmt(e.nH2O2, 3)} mmol`} couleur="#0369a1"/>}
        {s.acide && <LigneMesure nom="n(MnO₄⁻) en excès" valeur={`${fmt(e.nExces, 4)} mmol`} couleur="#86198f"/>}
        {s.acide && <LigneMesure nom="Volume équivalent (calculé)" valeur={`${fmt(s.Veq, 2)} mL`}/>}
        {s.acide && s.Veq > M.V_BURETTE && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6 }}>Le volume équivalent dépasse la burette de 25 mL : prélevez moins d’eau oxygénée ou prenez un permanganate plus concentré.</div>}
        {!s.acide && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6, lineHeight: 1.5 }}>Sans acide, MnO₄⁻ est réduit en MnO₂ brun : la solution brunit, la teinte rose n’apparaît plus et l’équation n’est plus la même. Le dosage est impossible.</div>}
      </>}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    setDefi(type === 'dosage' ? { type, ...M.tirageDefiDosage(), Vmes: null, rep: '', verifie: false } : { type, ...M.tirageDefiCalcul(), rep: '', verifie: false });
    nouveauDosage();
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const corrDosage = d => {
    const Ve = d.Vmes, c0m = Ve != null ? M.c0Depuis(Ve, d.cB, 10, 10) : null;
    return `Avec V_E = ${fmt(d.s.Veq, 2)} mL : n(MnO₄⁻) = ${fmt(d.cB * d.s.Veq, 3)} mmol ; n(H₂O₂) = 5/2 × ${fmt(d.cB * d.s.Veq, 3)} = ${fmt(d.s.nA, 3)} mmol ; c_A = ${fmt(d.s.nA, 3)} / 10,0 = ${fmt(d.s.cA, 4)} mol/L ; c_0 = 10 × c_A = ${fmt(d.c0, 3)} mol/L.${Ve != null ? ` Avec votre V_E = ${fmt(Ve, 2)} mL, vous obtenez c_0 = ${fmt(c0m, 3)} mol/L.` : ''}`;
  };
  const corrCalcul = d => `n(MnO₄⁻) = c_B × V_E = ${fmtC(d.cB).replace(' mol/L', '')} × ${fmt(d.Ve, 1)} = ${fmt(d.nB, 3)} mmol ; n(H₂O₂) = 5/2 × ${fmt(d.nB, 3)} = ${fmt(d.nA, 3)} mmol ; c_A = ${fmt(d.nA, 3)} / ${fmt(d.VA, 1)} = ${fmt(d.cA, 4)} mol/L ; c_0 = ${d.dil} × c_A = ${fmt(d.c0, 3)} mol/L ; titre massique = c_0 × M = ${fmt(d.c0, 3)} × 34,0 = ${fmt(d.tm, 1)} g/L.`;
  const verifier = () => {
    const d = defi; let diag = { msg: '' }, ok = false; const v = lireNombre(d.rep);
    if (d.type === 'dosage') {
      if (d.Vmes == null) diag = { msg: 'Repérez d’abord l’équivalence avec le bouton « C’est l’équivalence ! » (teinte rose persistante), puis calculez c_0.' };
      else if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif en mol/L (par exemple 0,85).' };
      else {
        const mien = M.c0Depuis(d.Vmes, d.cB, 10, 10);
        if (Math.abs(v - d.c0) / d.c0 <= 0.05) ok = true;
        else if (Math.abs(v - mien) / mien <= 0.03) diag = { msg: `Votre calcul est juste avec V_E = ${fmt(d.Vmes, 2)} mL, mais ce volume n’est pas celui de l’équivalence (${d.Vmes > d.s.Veq ? 'vous avez versé trop de permanganate' : 'l’équivalence n’était pas atteinte'}) : recommencez en finissant goutte à goutte.` };
        else {
          const essais = [[mien / 10, 'Vous avez donné la concentration c_A de la solution diluée : il reste à tenir compte de la dilution (× 10).'], [mien * 0.4 / 2.5, 'Vous avez utilisé le rapport 2/5 : il faut multiplier n(MnO₄⁻) par 5/2 (5 H₂O₂ pour 2 MnO₄⁻).'], [mien / 2.5, 'Vous avez oublié le rapport 5/2 entre les coefficients de l’équation (5 H₂O₂ pour 2 MnO₄⁻).']];
          const t = essais.find(([val]) => Math.abs(v - val) / val <= 0.05);
          diag = { msg: t ? t[1] : `Ce n’est pas la valeur attendue avec votre V_E = ${fmt(d.Vmes, 2)} mL (votre valeur est trop ${v < mien ? 'petite' : 'grande'}). Refaites : n(MnO₄⁻) = c_B × V_E, n(H₂O₂) = 5/2 × n(MnO₄⁻), c_A = n(H₂O₂) / V_A, puis c_0 = 10 × c_A.` };
        }
      }
    } else if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif en g/L (par exemple 30).' };
    else if (Math.abs(v - d.tm) / d.tm <= 0.04) ok = true;
    else {
      const essais = [[d.c0, 'Vous avez donné la concentration c_0 en mol/L : multipliez par la masse molaire M(H₂O₂) = 34,0 g/mol pour obtenir g/L.'], [d.tm / d.dil, 'Vous avez oublié de tenir compte de la dilution : la solution du commerce est plus concentrée que la solution dosée.'],
        [d.tm * 0.4 / 2.5, 'Vous avez utilisé le rapport 2/5 : n(H₂O₂) = 5/2 × n(MnO₄⁻).'], [d.tm / 2.5, 'Vous avez oublié le rapport 5/2 entre les coefficients de l’équation.']];
      const t = essais.find(([val]) => Math.abs(v - val) / val <= 0.05);
      diag = { msg: t ? t[1] : `Ce n’est pas la valeur attendue (votre valeur est trop ${v < d.tm ? 'petite' : 'grande'}). Reprenez : n(MnO₄⁻), puis n(H₂O₂) = 5/2 × n(MnO₄⁻), puis c_A, puis c_0, puis le titre massique c_0 × M.` };
    }
    setDefi(x => ({ ...x, verifie: true, ok, diag, corr: false }));
    if (d.type === 'dosage' ? (d.Vmes != null && isFinite(v) && v > 0) : (isFinite(v) && v > 0)) (d.type === 'dosage' ? noterD : noterC)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['dosage', 'Doser'], ['calcul', 'Calculer']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'dosage' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : doser une eau oxygénée</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Un désinfectant du commerce, dont la concentration c<sub>0</sub> en eau oxygénée est cachée, a été <strong>dilué 10 fois</strong>. Vous dosez <strong>V<sub>A</sub> = 10,0 mL</strong> de la solution diluée avec du permanganate à <strong>c<sub>B</sub> = {fmtC(defi.cB)}</strong>, en milieu acide. <strong>1.</strong> Repérez l’équivalence goutte à goutte. <strong>2.</strong> Calculez c<sub>0</sub>, avec 3 chiffres significatifs.</div>
        <IndiceDefi cache={false}>n(MnO₄⁻) = c<sub>B</sub> × V<sub>E</sub> (mmol, avec V<sub>E</sub> en mL) ; n(H₂O₂) = 5/2 × n(MnO₄⁻) ; c<sub>A</sub> = n(H₂O₂) / V<sub>A</sub> ; c<sub>0</sub> = 10 × c<sub>A</sub>.</IndiceDefi>
        <div style={{ ...lbl, margin: '8px 0 0', fontWeight: 700, color: defi.Vmes != null ? '#15803d' : KIT.txt2 }}>{defi.Vmes != null ? `✅ Équivalence repérée : V_E = ${fmt(defi.Vmes, 2)} mL` : 'Équivalence pas encore repérée (utilisez les commandes sous le schéma).'}</div>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : calculer à partir de V<sub>E</sub></div>
        <div style={{ ...lbl, marginBottom: 8 }}>On dose <strong>V<sub>A</sub> = {fmt(defi.VA, 1)} mL</strong> d’une eau oxygénée diluée <strong>{defi.dil} fois</strong> avec du permanganate à <strong>c<sub>B</sub> = {fmtC(defi.cB)}</strong>, en milieu acide. La teinte rose persiste après avoir versé <strong>V<sub>E</sub> = {fmt(defi.Ve, 1)} mL</strong>. Quel est le <strong>titre massique</strong> de l’eau oxygénée du commerce, en g/L (3 chiffres significatifs) ? On donne M(H₂O₂) = 34,0 g/mol.</div>
        <IndiceDefi cache={false}>n(MnO₄⁻) = c<sub>B</sub> × V<sub>E</sub> ; n(H₂O₂) = 5/2 × n(MnO₄⁻) ; c<sub>A</sub> = n(H₂O₂) / V<sub>A</sub> ; c<sub>0</sub> = {defi.dil} × c<sub>A</sub> ; titre massique = c<sub>0</sub> × M.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>{defi.type === 'dosage' ? <>c<sub>0</sub> =</> : 'Titre massique ='}</span>
        <input value={defi.rep} inputMode="decimal" aria-label="Votre réponse" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('tcr-verif')?.click()} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))}
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        <span>{defi.type === 'dosage' ? 'mol/L' : 'g/L'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="tcr-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? (defi.type === 'dosage' ? corrDosage(defi) : corrCalcul(defi)) : defi.diag.msg))}
        {!defi.ok && !/^(Entrez|Repérez)/.test(defi.diag.msg) && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 40 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(defi.type === 'dosage' ? corrDosage(defi) : corrCalcul(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses, à essayer, à retenir ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Réaction totale et rapide.</strong> On suppose que chaque goutte de permanganate réagit entièrement avec l’eau oxygénée disponible. Dans la réalité, les toutes premières gouttes se décolorent lentement, car les ions Mn²⁺ formés catalysent la réaction : le schéma le montre (tache violette plus lente au début), mais le calcul reste celui d’une réaction totale.</li>
      <li><strong>Acide en large excès.</strong> 5 mL d’acide sulfurique (environ 1 mol/L) apportent beaucoup plus de H⁺ que l’équation n’en exige : H⁺ n’est jamais limitant. Sans acide, le permanganate donne du MnO₂ brun et le dosage est inexploitable.</li>
      <li><strong>Volumes additifs</strong> et eau oxygénée stable pendant le dosage (elle se décompose très lentement, ce qui est négligé).</li>
      <li><strong>Visibilité de la teinte.</strong> L’œil voit une teinte rose pâle à partir d’environ 1×10⁻⁵ mol/L de MnO₄⁻ (valeur approchée, choisie pour la simulation). Avec les valeurs du parcours, l’équivalence est donc repérée à moins d’une goutte près ; les autres espèces (H₂O₂, Mn²⁺) sont supposées incolores.</li>
      <li><strong>Incertitude de lecture.</strong> Une goutte vaut environ 0,05 mL : sur V<sub>E</sub> ≈ 17 mL, cela représente 0,3 %. La concentration du permanganate est supposée connue exactement (en pratique, on la vérifie car la solution se dégrade lentement).</li>
      <li><strong>Valeurs de la simulation.</strong> L’eau oxygénée du commerce est supposée à 0,870 mol/L (environ 3 g pour 100 mL, étiquette « 10 volumes ») ; ces valeurs ont été choisies pour l’exemple.</li>
      <li><strong>Animation.</strong> Le schéma est schématique : durées de mélange et couleurs approchées, aucune échelle n’est respectée.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez la concentration du permanganate : que devient le volume équivalent ? Pourquoi ?</li>
        <li>Doublez le volume d’eau oxygénée prélevé : que devient V<sub>E</sub> ? Et la teinte à l’équivalence ?</li>
        <li>Dans le graphique, quelle courbe s’annule à l’équivalence ? Que devient l’autre courbe après ?</li>
        <li>Choisissez « Aucun acide ajouté » : que voyez-vous dans l’erlenmeyer ? Pourquoi ne peut-on plus repérer l’équivalence ?</li>
        <li>Observez les toutes premières gouttes : pourquoi se décolorent-elles plus lentement que les suivantes ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O</li>
          <li>Milieu acide indispensable (H⁺ est un réactif) ; sans acide : MnO₂ brun</li>
          <li>Équivalence : première goutte de permanganate qui reste rose (auto-indicateur)</li>
          <li>n(H₂O₂) = 5/2 × n(MnO₄⁻) ; n(MnO₄⁻) = c<sub>B</sub> × V<sub>E</sub> ; c<sub>A</sub> = n(H₂O₂) / V<sub>A</sub></li>
        </ul>
      </ARetenir>
    </Section>);

  // ---------- exploration : réglages ----------
  const majPar = ch => setPar(p => ({ ...p, ...ch }));
  const controlesEx = (
    <div style={styleBoite}>
      <SelectGen nom="Milieu de l’erlenmeyer" valeur={par.acide ? 'acide' : 'neutre'} onChange={v => majPar({ acide: v === 'acide' })} options={Object.entries(LIB_REGLAGE)}/>
      <SelectGen nom="Concentration du permanganate dans la burette" valeur={String(par.cB)} onChange={v => majPar({ cB: Number(v) })} options={[[ '0.01', fmtC(0.01)], ['0.02', fmtC(0.02)], ['0.04', fmtC(0.04)]]}/>
      <Section titre={`Eau oxygénée : c₀ = ${fmt(par.c0, 2)} mol/L · ${fmt(par.VA, 0)} mL prélevés`} ouvert={ouv.solution} onBascule={() => setOuv(o => ({ ...o, solution: !o.solution }))}>
        <div style={aide}>c₀ est la concentration de l’eau oxygénée du commerce ; on la dilue 10 fois, puis on prélève V<sub>A</sub>.</div>
        <Curseur nom="Concentration c₀ de l’eau oxygénée du commerce" valeur={par.c0} onChange={v => majPar({ c0: v })} min={0.4} max={1.3} pas={0.01} unite="mol/L" decimales={2} couleur="#0369a1"/>
        <Curseur nom="Volume prélevé V_A" valeur={par.VA} onChange={v => majPar({ VA: v })} min={5} max={20} pas={1} unite="mL" couleur="#0369a1"/>
      </Section>
    </div>);

  const boxScene = <div className="tcr-sc"><StylesTcr/>{schema}</div>;
  const titrePage = 'Titrage redox direct : eau oxygénée et permanganate';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <StylesSchemas/>
      <style>{`
        .tcr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tcr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tcr-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; } .tcr-col > *, .tcr-main, .tcr-carte { min-width: 0; }
        .tcr-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .tcr-sc { max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        @media (min-width: 901px) { .tcr-l1.cote .tcr-carte { order: 2; } .tcr-l1.cote .tcr-main { order: 1; }
          .tcr-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tcr-ex > * { grid-column: 1; } .tcr-ex > .tcr-ctrl-col { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .tcr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>{titrePage}</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On verse peu à peu du <strong>permanganate</strong> (violet) dans de l’<strong>eau oxygénée</strong> acidifiée : tant qu’il reste de l’eau oxygénée, chaque goutte est décolorée ; l’<strong>équivalence</strong> est la première goutte qui reste <strong>rose</strong>.</div>
      {!enExplore && <div className={enGuide ? 'tcr-l1 cote' : 'tcr-l1'}>
        {enGuide ? <div className="tcr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="tcr-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'dosage' ? suiviD : suiviC}/></div>}
          {(!enDefi || (defi && defi.type === 'dosage')) && <div className="tcr-col">
            {boxScene}
            {(!enGuide || vu('rapide')) && <div className="tcr-sc">{commandes}</div>}
            {(!enGuide || vu('rapide')) && <div className="tcr-sc">{mesures}</div>}
            {enGuide && vu('situations') && <div className="tcr-sc">{tableau}</div>}
            {boxEquation && <div className="tcr-sc">{boxEquation}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>}
          {enDefi && defi && defi.type === 'calcul' && <div>{panneauHypo}</div>}
        </div>
      </div>}
      {enExplore && <div className="tcr-ex">
        {boxScene}
        <div className="tcr-sc">{commandes}</div>
        <div className="tcr-sc" style={styleBoite}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Quantités de matière pendant le dosage</div>
          <div style={aide}>Les courbes se tracent au fur et à mesure du versement : H₂O₂ diminue, puis MnO₄⁻ s’accumule après l’équivalence.</div>
          <GraphQuantites s={s} V={V} etat={e}/></div>
        <div className="tcr-ctrl-col" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>{controlesEx}{mesures}</div>
        <div>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
