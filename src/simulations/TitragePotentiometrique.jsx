import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, ARetenir, IndiceDefi, LigneMesure, Curseur, fmt, ORANGE_GUIDE } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./tptModele";
import { QCM_PARCOURS as Q } from "./tptQcm";
import { StylesTpt, SceneDosagePotentio, GraphE, SvgMontageCarte, SvgCourbeCarte, SvgDeriveeCarte, SvgStandardCarte, SvgCalculCarte } from "./tptSchemas";
import TableurTitrage from "./TableurTitrage";

const SIM_ID = 297, CLE_GUIDE = 'titrage-potentiometrique-tstl-guide-v1';
declarerDefis(SIM_ID, [['dosage', 'Doser une solution de fer(II)'], ['standard', 'Lire un potentiel standard']]);

// ====================================================
// SIM 297 — TITRAGE POTENTIOMÉTRIQUE (TSTL SPCL, chapitre « Oxydo-réduction »).
//  Capacités visées (jamais affichées) : interpréter l'allure d'une courbe de titrage potentiométrique ; déterminer un potentiel standard à partir d'une telle courbe ;
//  déterminer une concentration à l'aide des données d'un titrage direct ; (numérique) repérer V_E par la méthode de la dérivée avec un tableur.
//  Modèle : tptModele.js. Situation originale : fer(II) dosé par le cérium(IV), suivi par une électrode de platine et une électrode de référence.
// ====================================================

const IDS = ['montage', 'reaction', 'mesure', 'verser', 'saut', 'derivee', 'demi', 'nCe', 'cA', 'apres', 'bilan'];
const DEBIT = 1.5;
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const SG = M.situation(M.SIT_GUIDE);
const PTS_G = M.pointsTableur(SG);
const VE_G = M.veqDerivee(PTS_G);                                        // 12,5 mL
const U_AV = Math.round(M.etat(SG, 0).U * 1000) / 1000, E_AV = U_AV + M.E_ECS;
const U_DEMI = Math.round(M.etat(SG, VE_G / 2).U * 1000) / 1000, E_DEMI = U_DEMI + M.E_ECS;
const U_2VE = Math.round(M.etat(SG, 2 * VE_G).U * 1000) / 1000, E_2VE = U_2VE + M.E_ECS;
const cTxt = c => `${(c * 100).toFixed(2).replace('.', ',')}×10⁻² mol/L`;

const SelectGen = ({ nom, valeur, onChange, options, aide }) => (
  <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>{avecIndices(nom)}
    <select value={valeur} onChange={e => onChange(e.target.value)} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', display: 'block', marginTop: 4 }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>{aide && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{aide}</span>}</label>);
const Pastille = ({ t, c, f }) => <span style={{ display: 'inline-block', padding: '5px 10px', borderRadius: 10, background: f, color: c, fontWeight: 800, fontSize: 16, border: `1.5px solid ${c}` }}>{avecIndices(t)}</span>;
const EquationCe = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
    <Pastille t="Ce⁴⁺" c="#b45309" f="#fef3c7"/><span>+</span><Pastille t="Fe²⁺" c="#0f766e" f="#ccfbf1"/><span style={{ fontSize: 20 }}>→</span><Pastille t="Ce³⁺" c="#b45309" f="#fef3c7"/><span>+</span><Pastille t="Fe³⁺" c="#0f766e" f="#ccfbf1"/>
  </div>);

// ====================================================
export function SimulationTitragePotentiometrique() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('dosage');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false, solution: false, tableur: false });
  const [reduit] = useState(mouvementReduit);
  const [par, setPar] = useState({ cA: 0.05, VA: 20, cB: 0.08, couple: 'fe' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- le dosage : volume versé et robinet ----------
  const [V, setVRaw] = useState(0), Vr = useRef(0);
  const setV = v => { Vr.current = v; setVRaw(v); };
  const [ouvert, setOuvert] = useState(false), [goutteCle, setGoutteCle] = useState(0), [declare, setDeclare] = useState(null);
  const idE = enGuide ? IDS[Math.min(guide.etape, IDS.length - 1)] : null;
  const defiDosage = enDefi && defi && defi.type === 'dosage';
  const s = enExplore ? M.situation({ cA: par.cA, VA: par.VA, cB: par.cB, E0A: M.COUPLES_A[par.couple].E0 }) : defiDosage ? defi.s : SG;
  const e = M.etat(s, V);
  useEffect(() => {
    if (!ouvert) return undefined;
    let id, t0 = performance.now();
    const pas = t => {
      const dt = Math.min(0.1, (t - t0) / 1000); t0 = t;
      const nv = Math.min(M.V_BURETTE, Vr.current + DEBIT * dt); setV(nv);
      if (nv >= M.V_BURETTE) setOuvert(false); else id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [ouvert]);
  function verser(dv) { setOuvert(false); setDeclare(null); const nv = Math.min(M.V_BURETTE, Math.round((Vr.current + dv) * 100) / 100); setV(nv); setGoutteCle(k => k + 1); }
  function nouveauDosage() { setOuvert(false); setDeclare(null); Vr.current = 0; setVRaw(0); setGoutteCle(0); }
  const cleReset = `${mode}|${par.cA}|${par.VA}|${par.cB}|${par.couple}|${defiDosage ? defi.cA : ''}`;
  const [cleVue, setCleVue] = useState(cleReset);
  if (cleVue !== cleReset) { setCleVue(cleReset); setOuvert(false); setDeclare(null); setVRaw(0); setGoutteCle(0); }
  useEffect(() => { Vr.current = 0; }, [cleReset]);

  function declarer() {
    setOuvert(false);
    const ecart = V - s.Veq;
    const r = V <= 0 ? { ok: false, msg: 'Versez d’abord du cérium(IV) et observez la courbe E = f(V).' }
      : ecart < -0.3 ? { ok: false, msg: 'Vous êtes avant le saut de potentiel : la courbe n’a pas encore bondi. Continuez à verser.' }
        : ecart > 0.3 ? { ok: false, msg: 'Vous avez dépassé le milieu du saut de potentiel. Cliquez sur « Nouveau dosage » et finissez par petits ajouts (0,1 mL).' }
          : { ok: true, msg: `Équivalence repérée : V_E = ${fmt(V, 2)} mL.` };
    setDeclare(r);
    if (r.ok && enDefi) setDefi(d => ({ ...d, Vmes: Math.round(V * 100) / 100, verifie: false }));
  }

  // ---------- parcours guidé ----------
  const etape = guide.etape;
  const idx = id => IDS.indexOf(id);
  const vu = id => !enGuide || etape >= idx(id), passe = id => !enGuide || etape > idx(id);
  const ETAPES = [
    { id: 'montage', titre: 'Le montage du dosage', focus: ['burette', 'becher', 'electrodes'],
      texte: <>On veut connaître la <strong>concentration c<sub>A</sub></strong> d’une solution contenant des ions <strong>fer(II)</strong> Fe²⁺. On en prélève <strong>V<sub>A</sub> = 20,0 mL</strong> dans un bécher et on la dose avec une solution d’ions <strong>cérium(IV)</strong> Ce⁴⁺ de concentration connue <strong>c<sub>B</sub> = 8,00×10⁻² mol/L</strong>, versée avec la burette. Les ions Fe³⁺ et Ce⁴⁺ sont jaunes, Fe²⁺ et Ce³⁺ presque incolores : <strong>la teinte change à peine</strong>. On plonge donc dans le bécher une <strong>électrode de platine</strong> (Pt), qui prend le potentiel de la solution, et une <strong>électrode de référence</strong> (ECS) dont le potentiel est constant, reliées à un voltmètre.</>,
      tache: { type: 'qcm', q: 'Pourquoi suit-on une tension plutôt que la couleur ?', ...Q.montage,
        expl: 'Les couleurs changent trop peu pour repérer l’équivalence à l’œil : on suit le potentiel de la solution, qui varie fortement quand les quantités des espèces évoluent.',
        indice: 'Regardez la teinte de la solution dans le schéma : peut-on y lire facilement la fin de la réaction ?' } },
    { id: 'reaction', titre: 'La réaction de titrage', focus: [],
      retenirTitre: 'À retenir : deux électrodes, une tension', retenir: <>
        <SvgMontageCarte/>
        <Ul>
          <li>L’électrode de <strong>platine</strong> prend le potentiel <strong>E</strong> de la solution ; l’<strong>ECS</strong> sert de référence, à 0,245 V, constant.</li>
          <li>Le voltmètre donne <strong>U = E(Pt) − E(ECS)</strong>, donc <strong>E = U + 0,245 V</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« le platine écoute, la référence ne bouge pas »</strong>.</li>
        </Ul></>,
      texte: <>Les ions cérium(IV) réagissent avec les ions fer(II) : un électron passe de chaque Fe²⁺ vers un Ce⁴⁺, donc <strong>1 Ce⁴⁺ réagit avec 1 Fe²⁺</strong>. La réaction est totale. Les potentiels standards des couples (à 25 °C) sont <strong>E°(Ce⁴⁺/Ce³⁺) = 1,44 V</strong> (en milieu sulfurique) et <strong>E°(Fe³⁺/Fe²⁺) = 0,77 V</strong>.</>,
      tache: { type: 'qcm', q: 'Quel ion joue le rôle d’oxydant le plus fort dans la réaction de titrage ?', ...Q.reaction,
        expl: 'Le couple Ce⁴⁺/Ce³⁺ a le potentiel standard le plus élevé : Ce⁴⁺ est l’oxydant le plus fort. Il capte l’électron cédé par Fe²⁺, le réducteur du couple Fe³⁺/Fe²⁺.',
        indice: 'L’oxydant le plus fort appartient au couple qui a le plus grand potentiel standard.' } },
    { id: 'mesure', titre: 'Lire la tension', focus: ['voltmetre'],
      texte: <>Avant tout ajout, le voltmètre indique <strong>U = {fmt(U_AV, 3)} V</strong>. Il mesure U = E(Pt) − E(ECS), avec E(ECS) = 0,245 V. Le potentiel de la solution est donc E = U + E(ECS).</>,
      tache: { type: 'num', q: 'Quel est le potentiel E de la solution avant tout ajout ?', unite: 'V', vrai: E_AV, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: false,
        calcul: () => ['U = E(Pt) − E(ECS), donc E(Pt) = U + E(ECS).', `E = ${fmt(U_AV, 3)} + 0,245 = ${fmt(E_AV, 3)} V.`],
        pieges: [[U_AV - M.E_ECS, 'Vous avez soustrait 0,245 V : E(Pt) = U + E(ECS).'], [U_AV, 'C’est la tension U lue sur le voltmètre ; le potentiel E est U + 0,245 V.']],
        expl: `E = U + 0,245 = ${fmt(U_AV, 3)} + 0,245 = ${fmt(E_AV, 3)} V.`, indice: 'U = E(Pt) − E(ECS) : isolez E(Pt) en ajoutant E(ECS) = 0,245 V de chaque côté.' } },
    { id: 'verser', titre: 'Verser et regarder la courbe', focus: ['burette', 'voltmetre'],
      texte: <>Les commandes et le graphique sont apparus. <strong>Versez le cérium(IV)</strong> (par 1 mL ou avec le robinet) <strong>jusqu’à 15 mL</strong> et regardez ce qui arrive à U et à la courbe E = f(V), où E = U + 0,245 V.</>,
      tache: { type: 'action', ok: V >= 15, consigne: V >= 15 ? `✅ ${fmt(V, 1)} mL versés` : `Versé : ${fmt(V, 2)} mL (objectif : 15 mL)` } },
    { id: 'saut', titre: 'Le saut de potentiel', focus: [],
      texte: <>La courbe monte <strong>lentement</strong>, puis <strong>très brusquement</strong> sur quelques dixièmes de mL, puis remonte lentement. Ce bond s’appelle le <strong>saut de potentiel</strong> : il se produit autour de l’équivalence.</>,
      tache: { type: 'qcm', q: 'Pourquoi le potentiel bondit-il à l’équivalence ?', ...Q.saut,
        expl: 'Avant l’équivalence, E est fixé par le rapport [Fe³⁺]/[Fe²⁺] ; juste après, Fe²⁺ a disparu et c’est le rapport [Ce⁴⁺]/[Ce³⁺] qui fixe E. Quand une espèce s’épuise, son rapport varie brutalement.',
        indice: 'À l’équivalence, un des deux réactifs est entièrement consommé. Quel rapport [Ox]/[Red] devient alors très grand ou très petit ?' } },
    { id: 'derivee', titre: 'Repérer V_E par la dérivée', focus: [],
      retenirTitre: 'À retenir : allure de la courbe', retenir: <>
        <SvgCourbeCarte/>
        <Ul>
          <li>Avant l’équivalence, <strong>Fe²⁺ est en excès</strong> ; après, <strong>Ce⁴⁺ est en excès</strong> : E suit tour à tour chacun des deux couples.</li>
          <li>Le <strong>saut de potentiel</strong> encadre l’équivalence, située au milieu du saut.</li>
          <li>Moyen de s’en souvenir : <strong>« doucement, saut, doucement »</strong>.</li>
        </Ul></>,
      texte: <>Pour repérer précisément V<sub>E</sub>, on utilise la <strong>méthode de la dérivée</strong> : on calcule dE/dV entre deux points voisins, et V<sub>E</sub> correspond au <strong>maximum de dE/dV</strong>. Le tableur ci-dessous contient les mesures (V, E) de ce dosage, tous les 0,2 mL. Ouvrez l’onglet « Dérivée », puis repérez le maximum.</>,
      tache: { type: 'num', q: 'Quel est le volume équivalent V_E ?', unite: 'mL', vrai: VE_G, tol: 0.02, cs: 3, affiche: v => fmt(v, 2), carnet: 'V_E (méthode de la dérivée)',
        calcul: () => ['dE/dV est calculée entre points voisins ; son maximum se trouve au milieu de l’intervalle qui contient le saut.', `Le maximum est à V = ${fmt(VE_G, 2)} mL.`],
        pieges: [[VE_G / 2, 'C’est la demi-équivalence : on cherche le maximum de dE/dV, au milieu du saut.'], [2 * VE_G, 'C’est le double de V_E : lisez le volume où dE/dV est maximale.']],
        expl: `Le maximum de dE/dV se situe à V = ${fmt(VE_G, 2)} mL : V_E = ${fmt(VE_G, 1)} mL.`, indice: 'Onglet « Dérivée », bouton « Aller au maximum » : lisez le volume moyen (V moyen).' } },
    { id: 'demi', titre: 'À la demi-équivalence', focus: ['voltmetre'],
      retenirTitre: 'À retenir : la méthode de la dérivée', retenir: <>
        <SvgDeriveeCarte/>
        <Ul>
          <li>Entre deux points voisins : <strong>dE/dV ≈ ΔE / ΔV</strong>. On trace dE/dV en fonction de V.</li>
          <li><strong>V<sub>E</sub> est le volume où dE/dV est maximale</strong> (le point d’inflexion du saut).</li>
          <li>Moyen de s’en souvenir : <strong>« la pente la plus raide marque l’équivalence »</strong>.</li>
        </Ul></>,
      texte: <>Avec V<sub>E</sub> = {fmt(VE_G, 1)} mL, la <strong>demi-équivalence</strong> est à V<sub>E</sub>/2 = {fmt(VE_G / 2, 2)} mL : la moitié du fer(II) a été transformée en fer(III), donc <strong>[Fe³⁺] = [Fe²⁺]</strong>. La relation de Nernst donne E = E°(Fe³⁺/Fe²⁺) + 0,06 log([Fe³⁺]/[Fe²⁺]). À V = {fmt(VE_G / 2, 2)} mL, le voltmètre indique <strong>U = {fmt(U_DEMI, 3)} V</strong>.</>,
      tache: { type: 'num', q: 'Quel est le potentiel standard E°(Fe³⁺/Fe²⁺) que l’on en déduit ?', unite: 'V', vrai: E_DEMI, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'E° lu à V_E/2',
        calcul: () => ['[Fe³⁺] = [Fe²⁺] donc log(1) = 0 : E = E°.', `E = U + 0,245 = ${fmt(U_DEMI, 3)} + 0,245 = ${fmt(E_DEMI, 3)} V.`],
        pieges: [[U_DEMI, 'C’est la tension U ; le potentiel E est U + 0,245 V.'], [U_DEMI - M.E_ECS, 'Vous avez soustrait 0,245 V : E = U + 0,245 V.'], [E_2VE, 'C’est le potentiel standard de l’autre couple : ici on est à la demi-équivalence du fer.']],
        expl: `À la demi-équivalence, E = E° : E°(Fe³⁺/Fe²⁺) = ${fmt(U_DEMI, 3)} + 0,245 = ${fmt(E_DEMI, 3)} V ≈ 0,77 V.`,
        indice: 'À la demi-équivalence [Fe³⁺] = [Fe²⁺] : le logarithme vaut 0 et E = E°. Il reste à passer de U à E.' } },
    { id: 'nCe', titre: 'Le cérium(IV) versé', focus: ['burette'],
      retenirTitre: 'À retenir : lire un potentiel standard', retenir: <>
        <SvgStandardCarte/>
        <Ul>
          <li>À la <strong>demi-équivalence</strong>, [Ox] = [Red] : <strong>E = E°</strong> du couple titré.</li>
          <li>Moyen de s’en souvenir : <strong>« moitié-moitié, E égale E° »</strong>.</li>
          <li>Idée fausse : « E° se lit à l’équivalence » : à l’équivalence, E est la moyenne des deux E°.</li>
        </Ul></>,
      texte: <>Rappel : V<sub>E</sub> = {fmt(VE_G, 1)} mL et c<sub>B</sub> = 8,00×10⁻² mol/L. La quantité de cérium(IV) versée à l’équivalence est <strong>n(Ce⁴⁺) = c<sub>B</sub> × V<sub>E</sub></strong> (avec un volume en mL, le résultat est en mmol).</>,
      tache: { type: 'num', q: 'Quelle quantité n(Ce⁴⁺) a été versée à l’équivalence ?', unite: 'mmol', vrai: 1.0, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: 'n(Ce⁴⁺) versée',
        calcul: () => ['n(Ce⁴⁺) = c_B × V_E.', `8,00×10⁻² × ${fmt(VE_G, 1)} = 1,00 mmol (mol/L × mL = mmol).`],
        pieges: [[1000, 'Vous avez donné des µmol : mol/L × mL donne des mmol.'], [0.001, 'Vous avez donné des mol : mol/L × mL donne des mmol.']],
        expl: `n(Ce⁴⁺) = 8,00×10⁻² × ${fmt(VE_G, 1)} = 1,00 mmol.`, indice: 'Multipliez c_B = 8,00×10⁻² mol/L par V_E = 12,5 mL : le produit est en mmol.' } },
    { id: 'cA', titre: 'La concentration en fer(II)', focus: [],
      texte: <>Rappel : n(Ce⁴⁺) = 1,00 mmol à l’équivalence. D’après l’équation, <strong>1 Ce⁴⁺ réagit avec 1 Fe²⁺</strong> : n(Fe²⁺) = n(Ce⁴⁺) = 1,00 mmol, contenue dans <strong>V<sub>A</sub> = 20,0 mL</strong>. La concentration est c<sub>A</sub> = n(Fe²⁺) / V<sub>A</sub>.</>,
      tache: { type: 'num', q: 'Quelle est la concentration c_A de la solution de fer(II) ?', unite: 'mol/L', vrai: 0.05, tol: 0.01, cs: 3, affiche: v => fmt(v, 4), carnet: 'c_A (solution de fer(II))',
        calcul: () => ['n(Fe²⁺) = n(Ce⁴⁺) = 1,00 mmol (1 pour 1).', 'c_A = 1,00 mmol / 20,0 mL = 0,0500 mol/L (mmol / mL = mol/L).'],
        pieges: [[1.0, 'Vous avez gardé la quantité de matière : divisez par le volume V_A = 20,0 mL.'], [0.02, 'Vous avez calculé V_A / n : c’est n / V_A.'], [0.1, 'Vous avez multiplié par 2 : ici 1 Ce⁴⁺ réagit avec 1 Fe²⁺.']],
        expl: 'c_A = 1,00 / 20,0 = 0,0500 mol/L.', indice: 'Divisez 1,00 mmol par 20,0 mL : mmol divisé par mL donne des mol/L.' } },
    { id: 'apres', titre: 'À deux fois le volume équivalent', focus: ['voltmetre'],
      retenirTitre: 'À retenir : du volume équivalent à la concentration', retenir: <>
        <SvgCalculCarte/>
        <Ul>
          <li>À l’équivalence : <strong>n(Ce⁴⁺) = c<sub>B</sub> × V<sub>E</sub></strong>, puis <strong>n(Fe²⁺) = n(Ce⁴⁺)</strong> (1 pour 1), puis <strong>c<sub>A</sub> = n(Fe²⁺) / V<sub>A</sub></strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« verser, 1 pour 1, diviser »</strong>.</li>
          <li>Idée fausse : « on multiplie par 5/2 » : ce rapport vient d’une autre équation ; ici les coefficients valent 1.</li>
        </Ul></>,
      texte: <>On continue à verser jusqu’à <strong>2 V<sub>E</sub> = {fmt(2 * VE_G, 1)} mL</strong>. On a alors versé deux fois la quantité nécessaire : la moitié du cérium(IV) versé a réagi, l’autre moitié reste, donc <strong>[Ce⁴⁺] = [Ce³⁺]</strong>. Le voltmètre indique <strong>U = {fmt(U_2VE, 3)} V</strong>.</>,
      tache: { type: 'num', q: 'Quel potentiel standard E°(Ce⁴⁺/Ce³⁺) en déduit-on ?', unite: 'V', vrai: E_2VE, tol: 0.01, cs: 3, affiche: v => fmt(v, 3), carnet: false,
        calcul: () => ['[Ce⁴⁺] = [Ce³⁺] : log(1) = 0, donc E = E°(Ce⁴⁺/Ce³⁺).', `E = U + 0,245 = ${fmt(U_2VE, 3)} + 0,245 = ${fmt(E_2VE, 3)} V.`],
        pieges: [[U_2VE, 'C’est la tension U ; le potentiel E est U + 0,245 V.'], [E_DEMI, 'C’est le potentiel standard du couple du fer : ici [Ce⁴⁺] = [Ce³⁺], c’est le couple du cérium.']],
        expl: `E°(Ce⁴⁺/Ce³⁺) = ${fmt(U_2VE, 3)} + 0,245 = ${fmt(E_2VE, 3)} V ≈ 1,44 V.`, indice: 'Comme à la demi-équivalence, deux concentrations égales donnent log(1) = 0 et E = E°. Il reste à passer de U à E.' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : deux potentiels standards sur une courbe', retenir: <>
        <SvgStandardCarte/>
        <Ul>
          <li>À <strong>V<sub>E</sub>/2</strong> : E = E° du couple titré. À <strong>2 V<sub>E</sub></strong> : E = E° du couple du titrant.</li>
          <li>À l’équivalence, E est la <strong>moyenne</strong> des deux E° quand chaque couple échange un électron.</li>
          <li>Moyen de s’en souvenir : <strong>« moitié, double : deux E° sur une courbe »</strong>.</li>
        </Ul></>,
      texte: <>Vous avez réalisé un <strong>titrage potentiométrique</strong> : montage à deux électrodes, courbe E = f(V), saut de potentiel, repérage de V<sub>E</sub> par la dérivée, potentiels standards lus à V<sub>E</sub>/2 et 2 V<sub>E</sub>, concentration c<sub>A</sub> = 0,0500 mol/L. Explorez d’autres couples dans l’exploration, ou relevez les défis.</> },
  ];

  const equationBox = (vu('reaction') || !enGuide) && (
    <div style={styleBoite}>
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', marginBottom: 6 }}>Équation de la réaction de titrage (1 pour 1)</div>
      <EquationCe/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 6 }}>E°(Ce⁴⁺/Ce³⁺) = 1,44 V · E°(Fe³⁺/Fe²⁺) = 0,77 V</div>
    </div>);

  // ---------- défis ----------
  const nouveauDefi = type => {
    if (type === 'dosage') setDefi({ type, ...M.tirageDefiDosage(), Vmes: null, rep: '', verifie: false });
    else setDefi({ type, ...M.tirageDefiE0(), rep: '', verifie: false });
    nouveauDosage();
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const corrDosage = d => `V_E = ${fmt(d.s.Veq, 2)} mL ; n(Ce⁴⁺) = ${fmt(d.cB, 4)} × ${fmt(d.s.Veq, 2)} = ${fmt(d.cB * d.s.Veq, 3)} mmol = n(Fe²⁺) ; c_A = ${fmt(d.cB * d.s.Veq, 3)} / ${fmt(d.VA, 1)} = ${fmt(d.cA, 4)} mol/L.`;
  const veD = defi && defi.type === 'standard' ? M.veqDerivee(defi.pts) : null;
  const corrStandard = d => `Le maximum de dE/dV donne V_E ≈ ${fmt(veD, 1)} mL ; à V_E/2 ≈ ${fmt(veD / 2, 2)} mL, [Ox] = [Red] et E = E°. Sur la courbe, E ≈ ${fmt(d.E0A, 2)} V : E° ≈ ${fmt(d.E0A, 2)} V.`;
  const verifier = () => {
    const d = defi; let diag = { msg: '' }, ok = false; const v = lireNombre(d.rep);
    if (d.type === 'dosage') {
      if (d.Vmes == null) diag = { msg: 'Repérez d’abord l’équivalence avec le bouton « C’est l’équivalence ! » (milieu du saut de potentiel), puis calculez c_A.' };
      else if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif en mol/L (par exemple 0,045).' };
      else {
        const mien = d.cB * d.Vmes / d.VA;
        if (Math.abs(v - d.cA) / d.cA <= 0.06) ok = true;
        else if (Math.abs(v - mien) / mien <= 0.03) diag = { msg: `Votre calcul est juste avec V_E = ${fmt(d.Vmes, 2)} mL, mais ce volume est trop ${d.Vmes < d.s.Veq ? 'petit' : 'grand'} : repérez mieux le milieu du saut de potentiel (finissez par ajouts de 0,1 mL).` };
        else {
          const essais = [[d.cB * d.Vmes, 'Vous avez donné la quantité de matière n (mmol) : divisez par le volume prélevé V_A.'], [2 * mien, 'Vous avez multiplié par 2 : ici 1 Ce⁴⁺ réagit avec 1 Fe²⁺ (rapport 1 pour 1).'], [d.cB * d.VA / d.Vmes, 'Vous avez inversé le calcul : c_A = c_B × V_E / V_A.'], [mien / 2.5, 'Vous avez utilisé le rapport 2/5 : ici les coefficients valent 1.']];
          const t = essais.find(([val]) => Math.abs(v - val) / val <= 0.05);
          diag = { msg: t ? t[1] : `Ce n’est pas la valeur attendue avec votre V_E = ${fmt(d.Vmes, 2)} mL (votre valeur est trop ${v < mien ? 'petite' : 'grande'}). Reprenez : n(Ce⁴⁺) = c_B × V_E, n(Fe²⁺) = n(Ce⁴⁺), c_A = n(Fe²⁺) / V_A.` };
        }
      }
    } else if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif en V (par exemple 0,70).' };
    else if (Math.abs(v - d.E0A) <= 0.03) ok = true;
    else {
      const eEq = M.etat(d.s, veD).E, eTot = M.etat(d.s, 2 * veD).E;
      const essais = [[eEq, 'Vous avez lu E à l’équivalence : cherchez E à la demi-équivalence V_E/2, où [Ox] = [Red].'], [eTot, 'Vous avez lu E à 2 V_E : c’est le potentiel standard du couple du cérium, pas celui du couple titré.'], [d.E0A - M.E_ECS, 'Vous avez soustrait 0,245 V : la courbe donne déjà le potentiel E.'], [d.E0A + M.E_ECS, 'Vous avez ajouté 0,245 V : la courbe donne déjà le potentiel E.']];
      const t = essais.find(([val]) => Math.abs(v - val) <= 0.04);
      diag = { msg: t ? t[1] : `Ce n’est pas la valeur attendue (votre valeur est trop ${v < d.E0A ? 'petite' : 'grande'}). Reprenez : trouvez V_E (maximum de dE/dV), puis lisez E à V_E/2.` };
    }
    setDefi(x => ({ ...x, verifie: true, ok, diag, corr: false }));
    if (d.type === 'dosage' ? (d.Vmes != null && isFinite(v) && v > 0) : (isFinite(v) && v > 0)) (d.type === 'dosage' ? noterD : noterC)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['dosage', 'Doser'], ['standard', 'Lire E°']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'dosage' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : doser une solution de fer(II)</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Vous dosez <strong>V<sub>A</sub> = {fmt(defi.VA, 1)} mL</strong> d’une solution de fer(II) de concentration c<sub>A</sub> <strong>cachée</strong> avec du cérium(IV) à <strong>c<sub>B</sub> = {cTxt(defi.cB)}</strong>. 1. Versez et repérez l’équivalence sur la courbe E = f(V) (milieu du saut de potentiel). 2. Calculez c<sub>A</sub>, avec 3 chiffres significatifs.</div>
        <IndiceDefi cache={false}>n(Ce⁴⁺) = c<sub>B</sub> × V<sub>E</sub> (mmol, avec V<sub>E</sub> en mL) ; n(Fe²⁺) = n(Ce⁴⁺) ; c<sub>A</sub> = n(Fe²⁺) / V<sub>A</sub>.</IndiceDefi>
        <div style={{ ...lbl, margin: '8px 0 0', fontWeight: 700, color: defi.Vmes != null ? '#15803d' : KIT.txt2 }}>{defi.Vmes != null ? `✅ Équivalence repérée : V_E = ${fmt(defi.Vmes, 2)} mL` : 'Équivalence pas encore repérée (utilisez les commandes sous le schéma).'}</div>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : lire un potentiel standard</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Un réducteur d’un couple Ox/Red <strong>inconnu</strong> est dosé par du cérium(IV). Le tableur contient les mesures (V, E) du dosage. Trouvez V<sub>E</sub> par la méthode de la dérivée, puis déterminez le <strong>potentiel standard E°</strong> du couple titré, avec 2 chiffres après la virgule.</div>
        <IndiceDefi cache={false}>V<sub>E</sub> : maximum de dE/dV (onglet « Dérivée »). À V<sub>E</sub>/2, [Ox] = [Red] et E = E° : lisez E sur la courbe ou dans le tableau à ce volume.</IndiceDefi>
        <TableurTitrage pts={defi.pts} titre="Titrage par le cérium(IV)" ordonnee="E (V)" titrant="cérium(IV)" dec={3} decDer={3}/>
      </>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>{defi.type === 'dosage' ? <>c<sub>A</sub> =</> : 'E° ='}</span>
        <input value={defi.rep} inputMode="decimal" aria-label="Votre réponse" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('tpt-verif')?.click()} onChange={ev => setDefi(d => ({ ...d, rep: ev.target.value, verifie: false }))}
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        <span>{defi.type === 'dosage' ? 'mol/L' : 'V'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="tpt-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? (defi.type === 'dosage' ? corrDosage(defi) : corrStandard(defi)) : defi.diag.msg))}
        {!defi.ok && !/^(Entrez|Repérez)/.test(defi.diag.msg) && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 40 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(defi.type === 'dosage' ? corrDosage(defi) : corrStandard(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses, à essayer, à retenir ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Relation de Nernst à 25 °C</strong> avec le coefficient 0,06 V (arrondi de 0,0592 V) : E = E° + 0,06 log([Ox]/[Red]) pour un électron échangé. Les activités sont assimilées aux concentrations (solutions diluées).</li>
      <li><strong>Réaction totale et rapide</strong> : l’équilibre est atteint à chaque ajout, et calculé exactement (la constante K = 10<sup>(E°(Ce) − E°(A))/0,06</sup> est finie, ce qui arrondit un peu le sommet du saut).</li>
      <li><strong>Électrodes idéales</strong> : le platine est inerte et prend instantanément le potentiel de la solution ; l’électrode de référence reste à 0,245 V ; le voltmètre ne débite aucun courant.</li>
      <li><strong>Valeurs choisies</strong> : E°(Ce⁴⁺/Ce³⁺) = 1,44 V (valeur usuelle en milieu sulfurique, elle dépend du milieu) ; E°(Fe³⁺/Fe²⁺) = 0,77 V ; un peu de Fe³⁺ (0,2 % de la quantité de Fe²⁺) est présent dès le départ, ce qui rend le potentiel initial défini.</li>
      <li><strong>Seul le rapport des quantités compte</strong> dans E : la dilution par le titrant ne change pas la courbe.</li>
      <li><strong>Animation</strong> : schématique ; la teinte est volontairement presque inchangée et aucune échelle n’est respectée.</li>
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
        <li>Doublez la concentration c<sub>A</sub> : que devient V<sub>E</sub> ? Et le potentiel à la demi-équivalence ?</li>
        <li>Changez de couple titré : où se lit E° pour chacun ? Le saut est-il aussi grand quand E° se rapproche de 1,44 V ?</li>
        <li>Prenez un titrant deux fois moins concentré : la forme de la courbe change-t-elle ? Le volume équivalent ?</li>
        <li>Ouvrez le tableur : retrouvez V<sub>E</sub> par la dérivée et comparez avec le volume équivalent calculé.</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Ce⁴⁺ + Fe²⁺ → Ce³⁺ + Fe³⁺ ; U = E(Pt) − E(ECS), donc E = U + 0,245 V</li>
          <li>Équivalence : maximum de dE/dV, au milieu du saut de potentiel</li>
          <li>À V<sub>E</sub>/2 : E = E° du couple titré ; à 2 V<sub>E</sub> : E = E° du titrant</li>
          <li>n(Ce⁴⁺) = c<sub>B</sub> × V<sub>E</sub> = n(Fe²⁺) ; c<sub>A</sub> = n(Fe²⁺) / V<sub>A</sub></li>
        </ul>
      </ARetenir>
    </Section>);

  // ---------- commandes, mesures, schéma ----------
  const lectureU = (!enGuide || vu('mesure')) ? e.U : null;
  const couleur = M.couleurSolution(s, e), mot = M.motTeinte(e);
  const etiqB = (!enGuide || vu('montage')) ? ['Ce⁴⁺ (cérium IV)', `c = ${cTxt(s.cB)}`] : null;
  const etiqBecher = [`${fmt(s.VA, 1)} mL de Fe²⁺`, enExplore ? `c_A = ${fmt(s.cA, 3)} mol/L` : 'c_A inconnue'].map(t => t.replace('Fe²⁺', M.COUPLES_A[enExplore ? par.couple : 'fe'].red).replace('c_A', 'cA'));
  const schema = <SceneDosagePotentio anime={!reduit} V={V} coul={couleur} ouvert={ouvert} goutteCle={goutteCle} lecture={lectureU} mot={mot}
    etiqBurette={etiqB} etiqBecher={etiqBecher} hl={id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id)}/>;
  const commandes = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => { setDeclare(null); setOuvert(o => !o); }} style={styleBouton(true, ouvert ? '#dc2626' : '#16a34a')}>{ouvert ? '⏹ Fermer le robinet' : '▶ Ouvrir le robinet'}</button>
        <button onClick={() => verser(1)} style={styleBouton(false)}>+ 1 mL</button>
        <button onClick={() => verser(0.1)} style={styleBouton(false)}>+ 0,1 mL</button>
        <button onClick={() => verser(M.V_GOUTTE)} style={styleBouton(false)}><Pic n="drop"/>1 goutte</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(enDefi) && <button onClick={declarer} style={styleBouton(true, ORANGE_GUIDE)}><Pic n="target"/>C’est l’équivalence !</button>}
        <button onClick={nouveauDosage} style={styleBouton(false)}>↺ Nouveau dosage</button>
      </div>
      {declare && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: declare.ok ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>{declare.ok ? '✅ ' : '❌ '}{avecIndices(declare.msg)}</div>}
    </div>);
  const mesures = (
    <div style={styleBoite}>
      <LigneMesure nom="Volume versé (lu sur la burette)" valeur={`${fmt(V, 2)} mL`} couleur="#92400e"/>
      <LigneMesure nom="Tension U lue sur le voltmètre" valeur={`${fmt(e.U, 3)} V`} couleur="#334155"/>
      {(!enGuide || passe('mesure')) && <LigneMesure nom="Potentiel E = U + 0,245 V" valeur={`${fmt(e.E, 3)} V`} couleur="#1d4ed8"/>}
      {enExplore && <>
        <LigneMesure nom={`n(${M.COUPLES_A[par.couple].red}) restant`} valeur={`${fmt(e.nRed, 4)} mmol`} couleur="#0f766e"/>
        <LigneMesure nom={`n(${M.COUPLES_A[par.couple].ox}) formé`} valeur={`${fmt(e.nOx, 4)} mmol`} couleur="#0f766e"/>
        <LigneMesure nom="n(Ce⁴⁺) en excès" valeur={`${fmt(e.nCe4, 4)} mmol`} couleur="#b45309"/>
        <LigneMesure nom="Volume équivalent (calculé)" valeur={`${fmt(s.Veq, 2)} mL`}/>
        <LigneMesure nom="Constante de la réaction K" valeur={`10^${fmt(M.log10(s.K), 1)}`}/>
        {s.Veq > M.V_BURETTE && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6 }}>Le volume équivalent dépasse la burette de 25 mL : prélevez moins de solution ou prenez un titrant plus concentré.</div>}
      </>}
    </div>);
  const majPar = ch => setPar(p => ({ ...p, ...ch }));
  const ptsEx = enExplore && ouv.tableur ? M.pointsTableur(s) : null;
  const controlesEx = (
    <div style={styleBoite}>
      <SelectGen nom="Couple du réducteur dosé" valeur={par.couple} onChange={v => majPar({ couple: v })} options={Object.values(M.COUPLES_A).map(c => [c.id, `${c.nom} · E° = ${fmt(c.E0, 2)} V`])} aide="Le titrant est toujours le cérium(IV), E° = 1,44 V."/>
      <SelectGen nom="Concentration du cérium(IV) dans la burette" valeur={String(par.cB)} onChange={v => majPar({ cB: Number(v) })} options={[['0.04', cTxt(0.04)], ['0.08', cTxt(0.08)], ['0.1', cTxt(0.1)]]}/>
      <Section titre={`Solution dosée : c_A = ${fmt(par.cA, 3)} mol/L · ${fmt(par.VA, 0)} mL prélevés`.replace('c_A', 'cA')} ouvert={ouv.solution} onBascule={() => setOuv(o => ({ ...o, solution: !o.solution }))}>
        <div style={aide}>On prélève V<sub>A</sub> de la solution de concentration c<sub>A</sub> et on la place dans le bécher.</div>
        <Curseur nom="Concentration c_A du réducteur" valeur={par.cA} onChange={v => majPar({ cA: v })} min={0.02} max={0.1} pas={0.005} unite="mol/L" decimales={3} couleur="#0f766e"/>
        <Curseur nom="Volume prélevé V_A" valeur={par.VA} onChange={v => majPar({ VA: v })} min={10} max={25} pas={1} unite="mL" couleur="#0f766e"/>
      </Section>
    </div>);

  const boxScene = <div className="tpt-sc"><StylesTpt/>{schema}</div>;
  const montrerEq = enExplore || passe('derivee');
  const boxGraphe = (!enGuide || vu('verser')) && !(enDefi) && (
    <div className="tpt-sc" style={styleBoite}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Potentiel de la solution E = f(V)</div>
      <div style={aide}>La courbe se trace au fur et à mesure du versement : lentement, puis un bond (saut de potentiel), puis lentement.</div>
      <GraphE s={s} V={V} e={e} montrer={{ eq: montrerEq }}/></div>);
  const boxGrapheDefi = defiDosage && (
    <div className="tpt-sc" style={styleBoite}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Potentiel de la solution E = f(V)</div><GraphE s={s} V={V} e={e} montrer={{}}/></div>);
  const boxTableurGuide = enGuide && vu('derivee') && (
    <div className="tpt-sc"><TableurTitrage pts={PTS_G} titre="Titrage du fer(II) par le cérium(IV)" ordonnee="E (V)" titrant="cérium(IV)" dec={3} decDer={3}/></div>);
  const titrePage = 'Titrage potentiométrique : fer(II) et cérium(IV)';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tpt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tpt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tpt-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; } .tpt-col > *, .tpt-main, .tpt-carte { min-width: 0; }
        .tpt-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .tpt-sc { max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        @media (min-width: 901px) { .tpt-l1.cote .tpt-carte { order: 2; } .tpt-l1.cote .tpt-main { order: 1; }
          .tpt-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tpt-ex > * { grid-column: 1; } .tpt-ex > .tpt-ctrl-col { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .tpt-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>{titrePage}</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On verse du <strong>cérium(IV)</strong> dans une solution de <strong>fer(II)</strong> sans voir de changement net de couleur : on suit le <strong>potentiel</strong> de la solution avec une électrode de platine, et l’<strong>équivalence</strong> se repère au saut de potentiel.</div>
      {!enExplore && <div className={enGuide ? 'tpt-l1 cote' : 'tpt-l1'}>
        {enGuide ? <div className="tpt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="tpt-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'dosage' ? suiviD : suiviC}/></div>}
          {(!enDefi || defiDosage) && <div className="tpt-col">
            {boxScene}
            {(!enGuide || vu('verser')) && <div className="tpt-sc">{commandes}</div>}
            {(!enGuide || vu('mesure')) && <div className="tpt-sc">{mesures}</div>}
            {boxGraphe}{boxGrapheDefi}
            {boxTableurGuide}
            {equationBox && <div className="tpt-sc">{equationBox}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>}
          {enDefi && defi && defi.type === 'standard' && <div>{panneauHypo}</div>}
        </div>
      </div>}
      {enExplore && <div className="tpt-ex">
        {boxScene}
        <div className="tpt-sc">{commandes}</div>
        {boxGraphe}
        <div className="tpt-sc" style={styleBoite}><Section titre="Tableur : repérer V_E par la dérivée" ouvert={ouv.tableur} onBascule={() => setOuv(o => ({ ...o, tableur: !o.tableur }))}>
          {ptsEx && <TableurTitrage pts={ptsEx} titre="Titrage du dosage en cours" ordonnee="E (V)" titrant="cérium(IV)" dec={3} decDer={3}/>}</Section></div>
        <div className="tpt-ctrl-col" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>{controlesEx}{mesures}</div>
        <div>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
