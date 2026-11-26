import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, ARetenir, IndiceDefi, LigneMesure, Curseur, fmt, ORANGE_GUIDE } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./tixModele";
import { QCM_PARCOURS as Q } from "./tixQcm";
import { StylesTix, SceneDosageIndirect, GraphIode, SvgPrincipeCarte, SvgChaineCarte, SvgAmidonCarte, SvgCalculCarte } from "./tixSchemas";

const SIM_ID = 298, CLE_GUIDE = 'titrage-indirect-javel-tstl-guide-v1';
declarerDefis(SIM_ID, [['dosage', 'Doser une eau de Javel'], ['calcul', 'Calculer à partir du volume équivalent']]);

// ====================================================
// SIM 298 — TITRAGE INDIRECT (TSTL SPCL, chapitre « Oxydo-réduction »).
//  Capacité visée (jamais affichée à l’élève) : déterminer une concentration à l’aide des données d’un titrage indirect (étapes explicitées).
//  Modèle : tixModele.js. Situation originale : eau de Javel (ClO⁻) → diiode par un excès d’iodure → dosage du diiode par le thiosulfate, empois d’amidon.
// ====================================================

const IDS = ['pourquoi', 'forme', 'excess', 'equation2', 'verser', 'amidon', 'equiv', 'nS', 'nI2', 'cA', 'c0', 'bilan'];
const DEBIT = 1.5;                         // mL par seconde, robinet ouvert
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const modeTest = () => typeof window !== 'undefined' && !!window.__PARCOURS_TEST__;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const SG = M.situation(M.SIT_GUIDE);       // situation du parcours guidé : V_E = 16,0 mL
const VE_TXT = '16,0';
const fmtC = c => (c < 0.1 ? `${(c * 100).toFixed(2).replace('.', ',')}×10⁻² mol/L` : `${fmt(c, 3)} mol/L`);
const rgbDe = c => c.match(/\d+/g).map(Number);
const melange = (a, b, t) => { const x = rgbDe(a), y = rgbDe(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(', ')})`; };

const SelectGen = ({ nom, valeur, onChange, options, aide }) => (
  <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>{avecIndices(nom)}
    <select value={valeur} onChange={e => onChange(e.target.value)} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', display: 'block', marginTop: 4 }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>{aide && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{aide}</span>}</label>);
const Pastille = ({ t, c, f }) => <span style={{ display: 'inline-block', padding: '4px 9px', borderRadius: 10, background: f, color: c, fontWeight: 800, fontSize: 15, border: `1.5px solid ${c}` }}>{avecIndices(t)}</span>;
const PCLO = ['#0f766e', '#ccfbf1'], PIOD = ['#b45309', '#fef3c7'], PTHIO = ['#1d4ed8', '#dbeafe'], PIODURE = ['#6d28d9', '#ede9fe'], PNEUTRE = ['#475569', '#f1f5f9'];
const Equation = ({ items }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', margin: '4px 0' }}>
    {items.map(([t, p], k) => p ? <Pastille key={k} t={t} c={p[0]} f={p[1]}/> : <span key={k} style={{ fontSize: t === '→' ? 20 : 16, color: KIT.txt2 }}>{t}</span>)}
  </div>);
const EQ1 = [['ClO⁻', PCLO], ['+'], ['2 I⁻', PIODURE], ['+'], ['2 H⁺', PNEUTRE], ['→'], ['I₂', PIOD], ['+'], ['Cl⁻', PCLO], ['+'], ['H₂O', PNEUTRE]];
const EQ2 = [['I₂', PIOD], ['+'], ['2 S₂O₃²⁻', PTHIO], ['→'], ['2 I⁻', PIODURE], ['+'], ['S₄O₆²⁻', PTHIO]];

// ====================================================
export function SimulationTitrageIndirectJavel() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('dosage');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false, solution: false });
  const [reduit] = useState(mouvementReduit);
  const [par, setPar] = useState({ c0: 0.40, VA: 20, cB: 0.1, acide: true, peuKI: false });
  const [mes, setMes] = useState({ Ve: null });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- formation du diiode (étape 1 du titrage indirect) ----------
  const [iode, setIode] = useState(0), [forme, setForme] = useState(false);
  useEffect(() => {
    if (!forme) return undefined;
    let id; const t0 = performance.now();
    const pas = t => { const x = Math.min(1, (t - t0) / 1800); setIode(x); if (x < 1) id = requestAnimationFrame(pas); };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [forme]);
  function former() { if (modeTest()) setIode(1); else setForme(true); }

  // ---------- le dosage : volume versé, robinet, tache décolorée qui se dissipe, empois d’amidon ----------
  const [V, setVRaw] = useState(0), Vr = useRef(0);
  const setV = v => { Vr.current = v; setVRaw(v); };
  const [ouvert, setOuvert] = useState(false), [goutteCle, setGoutteCle] = useState(0), [declare, setDeclare] = useState(null), [amidon, setAmidon] = useState(false);
  const [trans, setTrans] = useState(0), transRef = useRef({ val: 0, tau: 1 }), [kick, setKick] = useState(0);
  const idE = enGuide ? IDS[Math.min(guide.etape, IDS.length - 1)] : null;
  const defiDosage = enDefi && defi && defi.type === 'dosage';
  const s = enExplore ? M.situation({ c0: par.c0, dil: 10, VA: par.VA, cB: par.cB, acide: par.acide, peuKI: par.peuKI }) : defiDosage ? defi.s : SG;
  const iodeEff = !enGuide ? 1 : guide.etape > IDS.indexOf('forme') ? 1 : guide.etape === IDS.indexOf('forme') ? iode : 0;
  const e = M.etat(s, V, amidon);
  const injecter = dv => { const r = transRef.current; r.tau = 0.9; r.val = modeTest() ? 0 : Math.min(1, r.val + dv / M.V_GOUTTE * 0.9); setKick(k => k + 1); };
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
      injecter(nv - Vr.current); setV(nv);
      if (nv >= M.V_BURETTE) setOuvert(false); else id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [ouvert]);
  function verser(dv) {
    setOuvert(false); setDeclare(null);
    const nv = Math.min(M.V_BURETTE, Math.round((Vr.current + dv) * 100) / 100);
    injecter(nv - Vr.current); setV(nv); setGoutteCle(k => k + 1);
  }
  function nouveauDosage() { setOuvert(false); setDeclare(null); setAmidon(false); Vr.current = 0; setVRaw(0); transRef.current.val = 0; setTrans(0); setGoutteCle(0); }
  // le dosage repart de zéro quand l’élève change de mode ou de réglage (remise à zéro au moment du rendu, sans effet)
  const c0Defi = defiDosage ? defi.c0 : 0;
  const cleReset = `${mode}|${par.c0}|${par.VA}|${par.cB}|${par.acide}|${par.peuKI}|${c0Defi}`;
  const [cleVue, setCleVue] = useState(cleReset);
  if (cleVue !== cleReset) { setCleVue(cleReset); setOuvert(false); setDeclare(null); setAmidon(false); setVRaw(0); setTrans(0); setGoutteCle(0); }
  useEffect(() => { Vr.current = 0; transRef.current.val = 0; }, [cleReset]);

  const coulForme = s.nI2 > 0 ? M.couleurIode(e.cI2, amidon) : M.COUL_JAVEL;
  const coulBase = iodeEff >= 1 ? coulForme : melange(M.COUL_JAVEL, coulForme, iodeEff);
  const mot = iodeEff < 0.5 || s.nI2 <= 0 ? 'jaune très pâle' : M.motTeinte(e.cI2, amidon);

  function declarer(pour) {          // équivalence repérée : disparition de la couleur bleue, à environ deux gouttes près
    setOuvert(false);
    const ecart = V - s.Veq;
    const r = !(s.nI2 > 0) ? { ok: false, msg: 'Il n’y a pas de diiode dans l’erlenmeyer : le dosage n’a pas de sens.' }
      : !amidon ? { ok: false, msg: 'Ajoutez d’abord l’empois d’amidon quand la solution est jaune pâle : la fin du dosage sera bien plus visible.' }
        : e.bleu ? { ok: false, msg: 'La solution est encore bleue : il reste du diiode. Continuez à verser, goutte à goutte près de la fin.' }
          : ecart > 0.12 ? { ok: false, msg: pour === 'defi' ? 'Vous êtes allé trop loin : la solution est incolore depuis plusieurs gouttes. Recommencez en finissant goutte à goutte.' : `Vous avez dépassé l’équivalence d’environ ${fmt(ecart, 2)} mL. Recommencez, en finissant goutte à goutte.` }
            : { ok: true, msg: `Équivalence repérée : V_E = ${fmt(V, 2)} mL.` };
    setDeclare(r);
    if (r.ok && enGuide && idE === 'equiv') setMes(x => ({ ...x, Ve: Math.round(V * 100) / 100 }));
    if (r.ok && enDefi) setDefi(d => ({ ...d, Vmes: Math.round(V * 100) / 100, verifie: false }));
  }

  // ---------- parcours guidé ----------
  const etape = guide.etape;
  const idx = id => IDS.indexOf(id);
  const vu = id => !enGuide || etape >= idx(id), passe = id => !enGuide || etape > idx(id);
  const ETAPES = [
    { id: 'pourquoi', titre: 'Pourquoi un titrage indirect ?', focus: ['erlen'],
      texte: <>On veut connaître la <strong>concentration c<sub>0</sub> d’une eau de Javel</strong> du commerce, solution d’ions hypochlorite <strong>ClO⁻</strong>, oxydant puissant. On en dilue un échantillon <strong>10 fois</strong>, puis on prélève <strong>V<sub>A</sub> = 20,0 mL</strong> de la solution diluée dans un erlenmeyer. On dispose d’une solution de <strong>thiosulfate</strong> de sodium (S₂O₃²⁻, réducteur) de concentration connue <strong>c<sub>B</sub> = 0,100 mol/L</strong>. Mais les ions ClO⁻ oxydent le thiosulfate en plusieurs produits, selon les conditions.</>,
      tache: { type: 'qcm', q: 'Pourquoi ne peut-on pas doser directement ClO⁻ avec le thiosulfate ?', ...Q.pourquoi,
        expl: 'Un titrage exige une réaction unique, totale et rapide, d’équation connue. ClO⁻ oxyde le thiosulfate en produits qui dépendent des conditions (sulfate, tétrathionate…) : on ne peut pas écrire une équation de titrage fiable. On passe donc par une espèce intermédiaire que l’on sait doser.',
        indice: 'Un titrage repose sur une réaction d’équation connue et unique. Que dit l’énoncé de l’oxydation du thiosulfate par ClO⁻ ?' } },
    { id: 'forme', titre: 'Former du diiode', focus: ['erlen'],
      texte: <>On transforme ClO⁻ en une espèce que l’on sait doser : le <strong>diiode I₂</strong>. On ajoute dans l’erlenmeyer un <strong>grand excès d’iodure de potassium</strong> (I⁻) et un peu d’acide. La réaction est totale : <strong>ClO⁻ + 2 I⁻ + 2 H⁺ → I₂ + Cl⁻ + H₂O</strong>. Le diiode colore la solution en <strong>brun</strong>. Cliquez sur « Ajouter l’iodure et l’acide » sous le schéma.</>,
      tache: { type: 'action', ok: iode >= 1, consigne: iode >= 1 ? '✅ Diiode formé : la solution est brune' : 'Cliquez sur « Ajouter l’iodure et l’acide ».' } },
    { id: 'excess', titre: 'Pourquoi un excès d’iodure ?', focus: ['erlen'],
      retenirTitre: 'À retenir : un titrage indirect', retenir: <>
        <SvgPrincipeCarte/>
        <Ul>
          <li>Dans un <strong>titrage indirect</strong>, on transforme d’abord l’espèce à doser en une autre espèce (ici <strong>I₂</strong>), puis on dose celle-ci avec une réaction de titrage fiable.</li>
          <li>Moyen de s’en souvenir : <strong>« transformer d’abord, doser ensuite »</strong>.</li>
          <li>Idée fausse : « on dose directement l’espèce de départ » : ici le thiosulfate ne réagit pas de façon fiable avec ClO⁻.</li>
        </Ul></>,
      texte: <>D’après l’équation, <strong>1 ClO⁻ donne 1 I₂</strong>. On a introduit l’iodure en <strong>grand excès</strong> (10 mL à 0,50 mol/L, bien plus que les 2 I⁻ nécessaires par ClO⁻).</>,
      tache: { type: 'qcm', q: 'Pourquoi introduit-on l’iodure en grand excès ?', ...Q.excess,
        expl: 'Si I⁻ est en excès, tous les ions ClO⁻ sont consommés : le diiode formé est alors en quantité exactement égale à n(ClO⁻), ce qui permet de remonter à ClO⁻ en dosant I₂. Avec trop peu d’iodure, on formerait moins de diiode et on sous-estimerait la concentration.',
        indice: 'On veut que ClO⁻ soit entièrement transformé. Quel réactif doit alors être en excès, et que devient la quantité de diiode formée ?' } },
    { id: 'equation2', titre: 'Titrer le diiode', focus: ['burette'],
      texte: <>Le diiode formé se dose avec le <strong>thiosulfate</strong>, versé avec la burette. Les demi-équations sont : <strong>I₂ + 2 e⁻ → 2 I⁻</strong> (le diiode <strong>capte 2 e⁻</strong>) et <strong>2 S₂O₃²⁻ → S₄O₆²⁻ + 2 e⁻</strong> (chaque ion S₂O₃²⁻ <strong>cède 1 e⁻</strong>). Les ions I⁻ et S₄O₆²⁻ sont incolores.</>,
      tache: { type: 'num', q: 'Combien d’ions S₂O₃²⁻ réagissent avec 1 molécule de diiode ?', unite: 'ions', vrai: 2, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Une molécule I₂ capte 2 e⁻.', 'Chaque ion S₂O₃²⁻ cède 1 e⁻ : il en faut 2 / 1 = 2.'],
        pieges: [[1, 'Un seul ion S₂O₃²⁻ ne cède qu’un électron, alors que I₂ en capte 2.'], [4, 'Quatre est trop : 2 e⁻ à fournir, à raison de 1 e⁻ par ion S₂O₃²⁻.']],
        expl: 'On obtient I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻ : 2 ions thiosulfate pour 1 molécule de diiode.',
        indice: 'I₂ capte 2 électrons ; combien d’ions S₂O₃²⁻ (1 électron chacun) faut-il pour les fournir ?' } },
    { id: 'verser', titre: 'Verser le thiosulfate', focus: ['burette', 'erlen'],
      retenirTitre: 'À retenir : deux équations, une chaîne', retenir: <>
        <SvgChaineCarte/>
        <Ul>
          <li>Les <strong>coefficients</strong> relient les quantités : <strong>1 ClO⁻ donne 1 I₂</strong>, et <strong>1 I₂ réagit avec 2 S₂O₃²⁻</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« 1 pour 1, puis 1 pour 2 »</strong>.</li>
          <li>Idée fausse : « 1 ClO⁻ réagit avec 1 S₂O₃²⁻ » : le diiode est un intermédiaire, il change le rapport.</li>
        </Ul></>,
      texte: <>Les commandes sont apparues. <strong>Versez le thiosulfate</strong> (ouvrez le robinet ou versez par 1 mL) et observez : la teinte brune s’éclaircit à mesure que le diiode est consommé. <strong>Arrêtez-vous quand la solution est jaune pâle</strong>, vers 15 mL.</>,
      tache: { type: 'action', ok: V >= 14 && V <= 15.8, consigne: V >= 14 && V <= 15.8 ? `✅ ${fmt(V, 1)} mL versés : la solution est jaune pâle` : V > 15.8 ? 'Vous avez trop versé : cliquez sur « Nouveau dosage » et recommencez, en vous arrêtant vers 15 mL.' : `Versé : ${fmt(V, 2)} mL (objectif : jaune pâle, vers 15 mL)` } },
    { id: 'amidon', titre: 'L’empois d’amidon', focus: ['erlen'],
      texte: <>Il reste peu de diiode : la teinte jaune pâle devient difficile à repérer. On ajoute alors quelques gouttes d’<strong>empois d’amidon</strong>, qui forme avec le diiode un complexe <strong>bleu-noir très intense</strong>. Cliquez sur « Ajouter l’empois d’amidon » sous le schéma.</>,
      tache: { type: 'action', ok: amidon && V >= 14, consigne: amidon && V >= 14 ? '✅ Empois d’amidon ajouté : la solution est bleu-noir' : 'Cliquez sur « Ajouter l’empois d’amidon » (la solution doit être jaune pâle).' } },
    { id: 'equiv', titre: 'Repérer l’équivalence', focus: ['burette', 'erlen'],
      texte: <>Finissez <strong>goutte à goutte</strong> (1 goutte ≈ 0,05 mL ≈ 1 graduation du zoom). La solution est bleu-noir tant qu’il reste du diiode ; à l’<strong>équivalence</strong>, tout le diiode est consommé et <strong>le bleu disparaît</strong>. Dès que la solution devient incolore, cliquez sur « C’est l’équivalence ! ».</>,
      tache: { type: 'action', ok: mes.Ve != null, consigne: mes.Ve != null ? `✅ V_E = ${fmt(mes.Ve, 2)} mL` : `Versé : ${fmt(V, 2)} mL` } },
    { id: 'nS', titre: 'Le thiosulfate versé', focus: ['burette'],
      retenirTitre: 'À retenir : l’empois d’amidon', retenir: <>
        <SvgAmidonCarte/>
        <Ul>
          <li>L’<strong>empois d’amidon</strong> forme avec I₂ un complexe <strong>bleu-noir</strong> : l’équivalence est repérée quand <strong>le bleu disparaît</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« bleu au départ, incolore à l’arrivée »</strong>.</li>
          <li>Idée fausse : « l’équivalence est quand le bleu apparaît » : au contraire, c’est quand il disparaît.</li>
        </Ul></>,
      texte: <>Votre dosage donne <strong>V<sub>E</sub> ≈ {VE_TXT} mL</strong> ; la burette contient du thiosulfate à <strong>c<sub>B</sub> = 0,100 mol/L</strong>. La quantité de thiosulfate versée à l’équivalence est n(S₂O₃²⁻) = c<sub>B</sub> × V<sub>E</sub> (avec un volume en mL, le résultat est en mmol).</>,
      tache: { type: 'num', q: 'Quelle quantité n(S₂O₃²⁻) a été versée ?', unite: 'mmol', vrai: 1.60, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'n(S₂O₃²⁻) versée',
        calcul: () => ['n(S₂O₃²⁻) = c_B × V_E.', 'c_B = 0,100 mol/L ; V_E = 16,0 mL.', '0,100 × 16,0 = 1,60 : le résultat est en mmol (mol/L × mL).'],
        pieges: [[1600, 'Vous avez donné des µmol : mol/L × mL donne des mmol (1,60 mmol = 1600 µmol).'], [0.0016, 'Vous avez donné la valeur en mol (1,60×10⁻³ mol) : on demande ici des mmol.']],
        expl: 'n(S₂O₃²⁻) = 0,100 × 16,0 = 1,60 mmol.', indice: 'Multipliez la concentration c_B = 0,100 mol/L par le volume V_E = 16,0 mL : le produit est en mmol.' } },
    { id: 'nI2', titre: 'Le diiode dosé', focus: [],
      texte: <>Rappel : n(S₂O₃²⁻) = 1,60 mmol à l’équivalence. D’après l’équation <strong>I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻</strong>, 2 ions thiosulfate réagissent avec 1 molécule de diiode : <strong>n(I₂) = n(S₂O₃²⁻) / 2</strong>.</>,
      tache: { type: 'num', q: 'Quelle quantité n(I₂) a été dosée ?', unite: 'mmol', vrai: 0.800, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'n(I₂) dosée',
        calcul: () => ['2 S₂O₃²⁻ pour 1 I₂ : n(I₂) = n(S₂O₃²⁻) / 2.', '1,60 / 2 = 0,800 mmol.'],
        pieges: [[3.2, 'Vous avez multiplié par 2 : il faut 2 ions thiosulfate pour 1 I₂, donc n(I₂) est la moitié de n(S₂O₃²⁻).'], [1.6, 'Vous avez gardé n(S₂O₃²⁻) : il faut tenir compte du rapport 2 pour 1.'], [0.4, 'Vous avez divisé par 4 : une seule division par 2 suffit.']],
        expl: 'n(I₂) = 1,60 / 2 = 0,800 mmol.', indice: 'Divisez n(S₂O₃²⁻) = 1,60 mmol par 2 : il faut 2 ions thiosulfate pour 1 molécule de diiode.' } },
    { id: 'cA', titre: 'La concentration de la solution diluée', focus: [],
      texte: <>Rappel : n(I₂) = 0,800 mmol. D’après la première équation, <strong>1 ClO⁻ donne 1 I₂</strong> (l’iodure est en excès) : <strong>n(ClO⁻) = n(I₂) = 0,800 mmol</strong>, quantité contenue dans <strong>V<sub>A</sub> = 20,0 mL</strong>. La concentration de la solution diluée est c<sub>A</sub> = n(ClO⁻) / V<sub>A</sub>.</>,
      tache: { type: 'num', q: 'Quelle est la concentration c_A de la solution diluée ?', unite: 'mol/L', vrai: 0.0400, tol: 0.01, cs: 3, affiche: v => fmt(v, 4), carnet: 'c_A (Javel diluée)',
        calcul: () => ['n(ClO⁻) = n(I₂) = 0,800 mmol, dans V_A = 20,0 mL.', 'c_A = 0,800 / 20,0 = 0,0400 mol/L (mmol / mL = mol/L).'],
        pieges: [[0.8, 'Vous avez gardé 0,800 : il faut diviser la quantité de matière par le volume V_A = 20,0 mL.'], [25, 'Vous avez calculé V_A / n : c’est n / V_A.'], [0.02, 'Vous avez divisé par 2 de trop : 1 ClO⁻ donne 1 I₂, donc n(ClO⁻) = n(I₂).']],
        expl: 'c_A = 0,800 / 20,0 = 0,0400 mol/L.', indice: 'Divisez 0,800 mmol par 20,0 mL : mmol divisé par mL donne des mol/L.' } },
    { id: 'c0', titre: 'L’eau de Javel du commerce', focus: [],
      texte: <>La solution dosée a été obtenue en <strong>diluant 10 fois</strong> l’eau de Javel du commerce : c<sub>A</sub> = c<sub>0</sub> / 10, où c<sub>0</sub> est la concentration de l’eau de Javel du commerce. Rappel : c<sub>A</sub> = 0,0400 mol/L.</>,
      tache: { type: 'num', q: 'Quelle est la concentration c_0 de l’eau de Javel du commerce ?', unite: 'mol/L', vrai: 0.400, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'c_0 (Javel du commerce)',
        calcul: () => ['Dilution : c_A = c_0 / 10, donc c_0 = 10 × c_A.', '10 × 0,0400 = 0,400 mol/L.'],
        pieges: [[0.004, 'Vous avez divisé par 10 : l’eau de Javel du commerce est plus concentrée que la solution diluée.'], [0.04, 'C’est la concentration de la solution diluée c_A : il reste à tenir compte de la dilution (× 10).']],
        expl: 'c_0 = 10 × 0,0400 = 0,400 mol/L, soit environ 21 g/L d’ions ClO⁻ (0,400 × 51,5 ≈ 20,6 g/L).', indice: 'La solution du commerce a été diluée 10 fois : sa concentration est 10 fois plus grande que c_A.' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : du volume équivalent à c₀', retenir: <>
        <SvgCalculCarte/>
        <Ul>
          <li>Dans un titrage indirect : <strong>n(S₂O₃²⁻) = c<sub>B</sub> × V<sub>E</sub></strong>, puis <strong>n(ClO⁻) = n(I₂) = n(S₂O₃²⁻) / 2</strong>, puis <strong>c<sub>A</sub> = n(ClO⁻) / V<sub>A</sub></strong>, puis la dilution.</li>
          <li>Moyen de s’en souvenir : <strong>« verser, diviser par 2, diviser par le volume, multiplier par la dilution »</strong>.</li>
          <li>Idée fausse : « on multiplie par 2 » : le thiosulfate est le réactif en plus grande quantité, il faut en retrancher la moitié.</li>
        </Ul></>,
      texte: <>Vous avez réalisé un <strong>titrage indirect</strong> : formation du diiode avec un excès d’iodure, dosage du diiode par le thiosulfate avec l’empois d’amidon, puis remontée jusqu’à la concentration de l’eau de Javel. En exploration, vous pouvez supprimer l’acide ou mettre trop peu d’iodure pour voir ce qui change. Les défis vous demandent de doser une eau de Javel dont la concentration est cachée, puis de calculer à partir d’un volume équivalent donné.</> },
  ];

  const boxEquation = (vu('forme') || !enGuide) && (
    <div className="tix-fondu" style={styleBoite}>
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', marginBottom: 4 }}>1. Formation du diiode (iodure en excès, milieu acide)</div>
      <Equation items={EQ1}/>
      {(passe('equation2') || !enGuide) && <>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', margin: '10px 0 4px' }}>2. Titrage du diiode par le thiosulfate</div>
        <Equation items={EQ2}/>
      </>}
    </div>);

  // ---------- commandes, mesures, schéma ----------
  const etiqErlen = [`${fmt(s.VA, 1)} mL de Javel`, 'diluée 10 fois', ...(iodeEff > 0 ? [s.acide ? `+ ${fmt(s.VKI, 0)} mL de KI + acide` : `+ ${fmt(s.VKI, 0)} mL de KI, sans acide`] : []), ...(amidon ? ['+ empois d’amidon'] : [])];
  const schema = <SceneDosageIndirect anime={!reduit} V={V} coul={coulBase} trans={trans} iode={iodeEff} ouvert={ouvert} goutteCle={goutteCle} mot={mot}
    etiqBurette={['Na₂S₂O₃ (thiosulfate)', `c = ${fmtC(s.cB)}`]} etiqErlen={etiqErlen} hl={id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id)}/>;
  const commandeForme = enGuide && idE === 'forme' && (
    <div className="tix-fondu" style={styleBoite}>
      <button onClick={former} disabled={forme || iode >= 1} style={styleBouton(true, '#7c3aed')}>{iode >= 1 ? '✅ Iodure et acide ajoutés' : 'Ajouter l’iodure et l’acide'}</button>
    </div>);
  const commandes = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => { setDeclare(null); setOuvert(o => !o); }} style={styleBouton(true, ouvert ? '#dc2626' : '#16a34a')}>{ouvert ? '⏹ Fermer le robinet' : '▶ Ouvrir le robinet'}</button>
        <button onClick={() => verser(1)} style={styleBouton(false)}>+ 1 mL</button>
        <button onClick={() => verser(0.1)} style={styleBouton(false)}>+ 0,1 mL</button>
        <button onClick={() => verser(M.V_GOUTTE)} style={styleBouton(false)}><Pic n="drop"/>1 goutte</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(!enGuide || vu('amidon')) && <button onClick={() => { setDeclare(null); setAmidon(true); }} disabled={amidon} style={styleBouton(false)}>{amidon ? '✅ Amidon ajouté' : 'Ajouter l’empois d’amidon'}</button>}
        {(!enGuide || vu('equiv')) && <button onClick={() => declarer(enDefi ? 'defi' : 'autre')} style={styleBouton(true, ORANGE_GUIDE)}><Pic n="target"/>C’est l’équivalence !</button>}
        <button onClick={nouveauDosage} style={styleBouton(false)}>↺ Nouveau dosage</button>
      </div>
      {declare && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: declare.ok ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>{declare.ok ? '✅ ' : '❌ '}{avecIndices(declare.msg)}</div>}
    </div>);
  const mesures = (
    <div style={styleBoite}>
      <LigneMesure nom="Volume versé (lu sur la burette)" valeur={`${fmt(V, 2)} mL`} couleur="#1d4ed8"/>
      {enExplore && <>
        <LigneMesure nom="Teinte de la solution" valeur={mot}/>
        <LigneMesure nom="n(ClO⁻) prélevé" valeur={`${fmt(s.nA, 3)} mmol`} couleur="#0f766e"/>
        <LigneMesure nom="n(I₂) formé" valeur={`${fmt(s.nI2, 3)} mmol`} couleur="#b45309"/>
        <LigneMesure nom="n(I₂) restant" valeur={`${fmt(e.nI2, 3)} mmol`} couleur="#b45309"/>
        <LigneMesure nom="n(S₂O₃²⁻) versé" valeur={`${fmt(e.nS, 3)} mmol`} couleur="#1d4ed8"/>
        {s.nI2 > 0 && <LigneMesure nom="Volume équivalent (calculé)" valeur={`${fmt(s.Veq, 2)} mL`}/>}
        {s.nI2 > 0 && s.Veq > M.V_BURETTE && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6 }}>Le volume équivalent dépasse la burette de 25 mL : prélevez moins de Javel ou prenez un thiosulfate plus concentré.</div>}
        {!s.acide && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6, lineHeight: 1.5 }}>Sans acide, ClO⁻ ne réagit pas avec I⁻ (la réaction exige des ions H⁺) : il ne se forme pas de diiode et il n’y a rien à doser.</div>}
        {s.acide && s.peuKI && s.nI2 < s.nA - 1e-9 && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6, lineHeight: 1.5 }}>L’iodure est limitant : seule une partie des ions ClO⁻ réagit. Le diiode formé est trop peu abondant, donc V<sub>E</sub> est trop petit et la concentration serait sous-estimée.</div>}
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
    const Ve = d.Vmes, c0m = Ve != null ? M.c0Depuis(Ve, d.cB, d.VA, 10) : null;
    return `Avec V_E = ${fmt(d.s.Veq, 2)} mL : n(S₂O₃²⁻) = ${fmt(d.cB * d.s.Veq, 3)} mmol ; n(ClO⁻) = n(I₂) = ${fmt(d.s.nA, 3)} mmol ; c_A = ${fmt(d.s.nA, 3)} / ${fmt(d.VA, 1)} = ${fmt(d.s.cA, 4)} mol/L ; c_0 = 10 × c_A = ${fmt(d.c0, 3)} mol/L.${Ve != null ? ` Avec votre V_E = ${fmt(Ve, 2)} mL, vous obtenez c_0 = ${fmt(c0m, 3)} mol/L.` : ''}`;
  };
  const corrCalcul = d => `n(S₂O₃²⁻) = c_B × V_E = ${fmtC(d.cB).replace(' mol/L', '')} × ${fmt(d.Ve, 1)} = ${fmt(d.nS, 3)} mmol ; n(ClO⁻) = n(I₂) = ${fmt(d.nS, 3)} / 2 = ${fmt(d.nA, 3)} mmol ; c_A = ${fmt(d.nA, 3)} / ${fmt(d.VA, 1)} = ${fmt(d.cA, 4)} mol/L ; c_0 = ${d.dil} × c_A = ${fmt(d.c0, 3)} mol/L ; titre massique = c_0 × M = ${fmt(d.c0, 3)} × 51,5 = ${fmt(d.tm, 1)} g/L.`;
  const verifier = () => {
    const d = defi; let diag = { msg: '' }, ok = false; const v = lireNombre(d.rep);
    if (d.type === 'dosage') {
      if (d.Vmes == null) diag = { msg: 'Repérez d’abord l’équivalence avec le bouton « C’est l’équivalence ! » (après l’empois d’amidon, quand le bleu disparaît), puis calculez c_0.' };
      else if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif en mol/L (par exemple 0,35).' };
      else {
        const mien = M.c0Depuis(d.Vmes, d.cB, d.VA, 10);
        if (Math.abs(v - d.c0) / d.c0 <= 0.05) ok = true;
        else if (Math.abs(v - mien) / mien <= 0.03) diag = { msg: `Votre calcul est juste avec V_E = ${fmt(d.Vmes, 2)} mL, mais ce volume n’est pas celui de l’équivalence (${d.Vmes > d.s.Veq ? 'vous avez versé trop de thiosulfate' : 'l’équivalence n’était pas atteinte'}) : recommencez en finissant goutte à goutte.` };
        else {
          const essais = [[mien / 10, 'Vous avez donné la concentration c_A de la solution diluée : il reste à tenir compte de la dilution (× 10).'], [mien * 2, 'Vous avez oublié de diviser par 2 : 2 ions S₂O₃²⁻ réagissent avec 1 I₂, donc n(I₂) = n(S₂O₃²⁻) / 2.'], [mien / 2, 'Vous avez divisé par 2 deux fois : n(ClO⁻) = n(I₂) (1 pour 1), il n’y a qu’une division par 2, entre le thiosulfate et le diiode.'], [mien * d.VA, 'Vous avez oublié de diviser par le volume prélevé V_A.']];
          const t = essais.find(([val]) => Math.abs(v - val) / val <= 0.05);
          diag = { msg: t ? t[1] : `Ce n’est pas la valeur attendue avec votre V_E = ${fmt(d.Vmes, 2)} mL (votre valeur est trop ${v < mien ? 'petite' : 'grande'}). Refaites : n(S₂O₃²⁻) = c_B × V_E, n(ClO⁻) = n(S₂O₃²⁻) / 2, c_A = n(ClO⁻) / V_A, puis c_0 = 10 × c_A.` };
        }
      }
    } else if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif en g/L (par exemple 20).' };
    else if (Math.abs(v - d.tm) / d.tm <= 0.04) ok = true;
    else {
      const essais = [[d.c0, 'Vous avez donné la concentration c_0 en mol/L : multipliez par la masse molaire M(ClO⁻) = 51,5 g/mol pour obtenir g/L.'], [d.tm / d.dil, 'Vous avez oublié de tenir compte de la dilution : l’eau de Javel du commerce est plus concentrée que la solution dosée.'],
        [d.tm * 2, 'Vous avez oublié de diviser par 2 : n(ClO⁻) = n(I₂) = n(S₂O₃²⁻) / 2.'], [d.tm * d.VA, 'Vous avez oublié de diviser par le volume prélevé V_A.']];
      const t = essais.find(([val]) => Math.abs(v - val) / val <= 0.05);
      diag = { msg: t ? t[1] : `Ce n’est pas la valeur attendue (votre valeur est trop ${v < d.tm ? 'petite' : 'grande'}). Reprenez : n(S₂O₃²⁻), puis n(ClO⁻) = n(S₂O₃²⁻) / 2, puis c_A, puis c_0, puis le titre massique c_0 × M.` };
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
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : doser une eau de Javel</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Une eau de Javel du commerce, dont la concentration c<sub>0</sub> en ions ClO⁻ est <strong>cachée</strong>, a été <strong>diluée 10 fois</strong>. On prélève <strong>V<sub>A</sub> = {fmt(defi.VA, 1)} mL</strong> de la solution diluée et on y a déjà ajouté l’iodure en excès et l’acide : le diiode est formé. Vous le dosez avec du thiosulfate à <strong>c<sub>B</sub> = {fmtC(defi.cB)}</strong>. <strong>1.</strong> Versez, ajoutez l’empois d’amidon quand la solution est jaune pâle, puis repérez l’équivalence goutte à goutte. <strong>2.</strong> Calculez c<sub>0</sub>, avec 3 chiffres significatifs.</div>
        <IndiceDefi cache={false}>n(S₂O₃²⁻) = c<sub>B</sub> × V<sub>E</sub> (mmol, avec V<sub>E</sub> en mL) ; n(ClO⁻) = n(I₂) = n(S₂O₃²⁻) / 2 ; c<sub>A</sub> = n(ClO⁻) / V<sub>A</sub> ; c<sub>0</sub> = 10 × c<sub>A</sub>.</IndiceDefi>
        <div style={{ ...lbl, margin: '8px 0 0', fontWeight: 700, color: defi.Vmes != null ? '#15803d' : KIT.txt2 }}>{avecIndices(defi.Vmes != null ? `Équivalence repérée : V_E = ${fmt(defi.Vmes, 2)} mL` : 'Équivalence pas encore repérée (utilisez les commandes sous le schéma).')}</div>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : calculer à partir de V<sub>E</sub></div>
        <div style={{ ...lbl, marginBottom: 8 }}>On dose <strong>V<sub>A</sub> = {fmt(defi.VA, 1)} mL</strong> d’une eau de Javel diluée <strong>{defi.dil} fois</strong>. Après ajout d’iodure en excès et d’acide, le diiode formé est titré par du thiosulfate à <strong>c<sub>B</sub> = {fmtC(defi.cB)}</strong> : le bleu de l’amidon disparaît après avoir versé <strong>V<sub>E</sub> = {fmt(defi.Ve, 1)} mL</strong>. Quel est le <strong>titre massique en ions ClO⁻</strong> de l’eau de Javel du commerce, en g/L (3 chiffres significatifs) ? On donne M(ClO⁻) = 51,5 g/mol.</div>
        <IndiceDefi cache={false}>n(S₂O₃²⁻) = c<sub>B</sub> × V<sub>E</sub> ; n(ClO⁻) = n(I₂) = n(S₂O₃²⁻) / 2 ; c<sub>A</sub> = n(ClO⁻) / V<sub>A</sub> ; c<sub>0</sub> = {defi.dil} × c<sub>A</sub> ; titre massique = c<sub>0</sub> × M.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>{defi.type === 'dosage' ? <>c<sub>0</sub> =</> : 'Titre massique ='}</span>
        <input value={defi.rep} inputMode="decimal" aria-label="Votre réponse" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('tix-verif')?.click()} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))}
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        <span>{defi.type === 'dosage' ? 'mol/L' : 'g/L'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="tix-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
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
      <li><strong>Deux réactions totales et rapides.</strong> ClO⁻ + 2 I⁻ + 2 H⁺ → I₂ + Cl⁻ + H₂O (iodure en grand excès, milieu acide), puis I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻ : l’équilibre est atteint à chaque ajout.</li>
      <li><strong>Le diiode est écrit I₂.</strong> En présence d’iodure en excès, il est en réalité surtout sous forme d’ions triiodure I₃⁻ (brun) : le bilan de matière est le même, car I₃⁻ libère le diiode au fur et à mesure du dosage.</li>
      <li><strong>Pas de perte de diiode.</strong> Le diiode est volatil : on néglige son départ dans l’air, ce qui oblige en pratique à doser sans attendre.</li>
      <li><strong>Empois d’amidon.</strong> Le complexe bleu-noir est supposé visible dès 2×10⁻⁶ mol/L de diiode, la teinte jaune sans amidon dès 1×10⁻⁴ mol/L (valeurs choisies pour la simulation). On l’ajoute quand la solution est jaune pâle : introduit trop tôt, le complexe se défait lentement et rend l’équivalence imprécise (non simulé).</li>
      <li><strong>Volumes additifs</strong> (10 mL d’iodure de potassium à 0,50 mol/L et 5 mL d’acide ajoutés) ; c<sub>B</sub> supposée connue exactement ; goutte de 0,05 mL (incertitude de lecture d’environ 0,3 % sur V<sub>E</sub> ≈ 16 mL).</li>
      <li><strong>Valeurs de la simulation.</strong> Eau de Javel du commerce supposée à 0,400 mol/L en ClO⁻ (environ 21 g/L, de l’ordre de 2,8 % de chlore actif) ; valeur choisie pour l’exemple.</li>
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
        <li>Choisissez « Iodure insuffisant » : le volume équivalent devient-il plus petit ou plus grand ? Pourquoi le résultat du dosage serait-il faux ?</li>
        <li>Choisissez « Aucun acide » : que se passe-t-il à la première étape ? Reste-t-il quelque chose à doser ?</li>
        <li>Doublez la concentration du thiosulfate : que devient le volume équivalent ? Et la quantité de thiosulfate versée ?</li>
        <li>Ajoutez l’empois d’amidon dès le début : quelle teinte obtenez-vous ? Pourquoi vaut-il mieux l’ajouter près de la fin ?</li>
        <li>Dans le graphique, quelle courbe s’annule à l’équivalence ? Que vaut alors la quantité de thiosulfate versée par rapport à n(I₂) formé ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>ClO⁻ + 2 I⁻ + 2 H⁺ → I₂ + Cl⁻ + H₂O (iodure en excès, milieu acide)</li>
          <li>I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻ ; équivalence : le bleu de l’amidon disparaît</li>
          <li>n(ClO⁻) = n(I₂) = n(S₂O₃²⁻) / 2 ; n(S₂O₃²⁻) = c<sub>B</sub> × V<sub>E</sub></li>
          <li>c<sub>A</sub> = n(ClO⁻) / V<sub>A</sub> ; c<sub>0</sub> = dilution × c<sub>A</sub></li>
        </ul>
      </ARetenir>
    </Section>);

  // ---------- exploration : réglages ----------
  const majPar = ch => setPar(p => ({ ...p, ...ch }));
  const controlesEx = (
    <div style={styleBoite}>
      <SelectGen nom="Milieu de l’erlenmeyer" valeur={par.acide ? 'acide' : 'neutre'} onChange={v => majPar({ acide: v === 'acide' })} options={[['acide', 'Acide ajouté'], ['neutre', 'Aucun acide']]}/>
      <SelectGen nom="Iodure de potassium ajouté" valeur={par.peuKI ? 'peu' : 'exces'} onChange={v => majPar({ peuKI: v === 'peu' })} options={[['exces', 'Grand excès (10 mL à 0,50 mol/L)'], ['peu', 'Iodure insuffisant (1 mL)']]}/>
      <SelectGen nom="Concentration du thiosulfate dans la burette" valeur={String(par.cB)} onChange={v => majPar({ cB: Number(v) })} options={[['0.05', fmtC(0.05)], ['0.1', fmtC(0.1)], ['0.2', fmtC(0.2)]]}/>
      <Section titre={`Eau de Javel : c₀ = ${fmt(par.c0, 2)} mol/L · ${fmt(par.VA, 0)} mL prélevés`} ouvert={ouv.solution} onBascule={() => setOuv(o => ({ ...o, solution: !o.solution }))}>
        <div style={aide}>c₀ est la concentration de l’eau de Javel du commerce ; on la dilue 10 fois, puis on prélève V<sub>A</sub>.</div>
        <Curseur nom="Concentration c₀ de l’eau de Javel du commerce" valeur={par.c0} onChange={v => majPar({ c0: v })} min={0.2} max={0.9} pas={0.01} unite="mol/L" decimales={2} couleur="#0f766e"/>
        <Curseur nom="Volume prélevé V_A" valeur={par.VA} onChange={v => majPar({ VA: v })} min={10} max={25} pas={1} unite="mL" couleur="#0f766e"/>
      </Section>
    </div>);

  const boxScene = <div className="tix-sc"><StylesTix/>{schema}</div>;
  const titrePage = 'Titrage indirect : eau de Javel, iodure puis thiosulfate';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tix-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tix-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tix-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; } .tix-col > *, .tix-main, .tix-carte { min-width: 0; }
        .tix-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .tix-sc { max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        @media (min-width: 901px) { .tix-l1.cote .tix-carte { order: 2; } .tix-l1.cote .tix-main { order: 1; }
          .tix-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tix-ex > * { grid-column: 1; } .tix-ex > .tix-ctrl-col { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .tix-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>{titrePage}</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On ne dose pas directement l’<strong>eau de Javel</strong> : on la transforme d’abord en <strong>diiode</strong> avec de l’iodure, puis on dose le diiode avec du <strong>thiosulfate</strong>. L’<strong>équivalence</strong> est repérée quand le bleu de l’empois d’amidon disparaît.</div>
      {!enExplore && <div className={enGuide ? 'tix-l1 cote' : 'tix-l1'}>
        {enGuide ? <div className="tix-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="tix-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'dosage' ? suiviD : suiviC}/></div>}
          {(!enDefi || defiDosage) && <div className="tix-col">
            {boxScene}
            {commandeForme && <div className="tix-sc">{commandeForme}</div>}
            {(!enGuide || vu('verser')) && <div className="tix-sc">{commandes}</div>}
            {(!enGuide || vu('verser')) && <div className="tix-sc">{mesures}</div>}
            {boxEquation && <div className="tix-sc">{boxEquation}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>}
          {enDefi && defi && defi.type === 'calcul' && <div>{panneauHypo}</div>}
        </div>
      </div>}
      {enExplore && <div className="tix-ex">
        {boxScene}
        <div className="tix-sc">{commandes}</div>
        <div className="tix-sc" style={styleBoite}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Quantités de matière pendant le dosage</div>
          <div style={aide}>Les courbes se tracent au fur et à mesure du versement : le diiode diminue jusqu’à zéro, alors que le thiosulfate versé augmente.</div>
          <GraphIode s={s} V={V} etat={e}/></div>
        <div className="tix-ctrl-col" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>{controlesEx}{mesures}</div>
        <div>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
