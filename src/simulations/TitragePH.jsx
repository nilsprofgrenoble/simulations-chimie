import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { SchemaBurette } from "./titrageCommun";
import * as M from "./titragePhModele";
import { SvgReaction, SvgComposition, SvgRepererVE, SvgPhEquivalence, SvgIndicateur } from "./titragePhSchemas";

const SIM_ID = 119, CLE_GUIDE = 'titrage-ph-tg-guide-v1';
declarerDefis(SIM_ID, [['conc', 'Quelle est la concentration de l’acide titré ?'], ['indic', 'Quel est le pH à l’équivalence et quel indicateur choisir ?']]);

// ====================================================
//  SIM 119 — TITRAGE pH-MÉTRIQUE : ÉQUIVALENCE, pH ET CHOIX DE L’INDICATEUR (TG spé PC, thème « Constitution et transformations de la matière »)
//  Une seule idée : un titrage acide-base suivi par pH-métrie. (1) composition du système après ajout de titrant (transformation totale),
//  (2) équivalence et concentration, (3) pH à l’équivalence, (4) choix de l’indicateur coloré.
//  Modèle : titragePhModele.js (pH exact par conservation de la charge, composition par le tableau « totale »). Situations originales.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const VMAX = M.V_BURETTE_ML;
const PRESET = { acide: 'etha', C0: 0.080, V0: 20.0, Cb: 0.100, Vb: 0, ind: null, deriv: false, cmp: false };
const IND = id => M.INDICATEURS.find(i => i.id === id);
const FORM_ACIDE = { hcl: 'HCl', benz: 'C₆H₅COOH', etha: 'CH₃COOH', form: 'HCOOH' };

const NOMS_COUL = { '#dc2626': 'rouge', '#facc15': 'jaune', '#2563eb': 'bleu', '#f8fafc': 'incolore', '#db2777': 'rose', '#b45309': 'brun-orangé' };
const nomCouleur = c => NOMS_COUL[c] || 'colorée';

// ---------- graphe pH = f(V) ----------
function CourbePH({ pts, ptsCmp, Vb, ph, VE, montrerVE, deriv, ind }) {
  const W = 480, H = 340, mx = 50, my = 14, bas = H - 62;
  const X = v => mx + (W - mx - 12) * v / VMAX, Y = p => my + (bas - my) * (1 - p / 14);
  const dmax = Math.max(...pts.map(p => p.d));
  const Yd = d => bas - (bas - my - 20) * d / dmax;
  const trace = (liste, f) => liste.map((p, i) => `${i ? 'L' : 'M'}${X(p.V).toFixed(1)},${f(p).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={`Courbe de titrage : pH en fonction du volume de soude versé. Le point orange est au volume ${nbf(Vb, 1)} millilitres, pH ${nbf(ph, 2)}${deriv ? ' ; la dérivée du pH est tracée en vert' : ''}${ind ? ` ; zone de virage du ${ind.nom} de pH ${nbf(ind.zone[0], 1)} à ${nbf(ind.zone[1], 1)}` : ''}${montrerVE ? ` ; le volume équivalent est ${nbf(VE, 1)} millilitres` : ''}`}>
      <line x1={mx} y1={bas} x2={W - 12} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {[0, 5, 10, 15, 20, 25].map(v => <text key={v} x={X(v)} y={bas + 21} fontSize="17" textAnchor="middle" fill="#334155">{v}</text>)}
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={mx} y1={Y(p)} x2={W - 12} y2={Y(p)} stroke="#eef2f7"/><text x={mx - 7} y={Y(p) + 6} fontSize="17" textAnchor="end" fill="#334155">{p}</text></g>)}
      <text x={(mx + W) / 2} y={H - 10} fontSize="17" textAnchor="middle" fill="#334155">volume de soude versé V<tspan baselineShift="sub" fontSize="0.75em">B</tspan> (mL)</text>
      <text x="16" y={(my + bas) / 2} fontSize="17" fill="#334155" transform={`rotate(-90 16 ${(my + bas) / 2})`} textAnchor="middle">pH</text>
      {ind && <><defs><linearGradient id="tph-grad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={ind.acide}/><stop offset="1" stopColor={ind.base}/></linearGradient></defs>
        <rect x={mx} y={Y(ind.zone[1])} width={W - mx - 12} height={Y(ind.zone[0]) - Y(ind.zone[1])} fill="url(#tph-grad)" opacity="0.55"/>
        <rect x={mx} y={Y(ind.zone[1])} width={W - mx - 12} height={Y(ind.zone[0]) - Y(ind.zone[1])} fill="none" stroke="#475569" strokeDasharray="4 3"/>
        <text x={W - 16} y={(Y(ind.zone[0]) + Y(ind.zone[1])) / 2 + 4} fontSize="17" fontWeight="700" textAnchor="end" fill="#0f172a" stroke="white" strokeWidth="3" paintOrder="stroke">zone de virage ({nbf(ind.zone[0], 1)} – {nbf(ind.zone[1], 1)})</text>
        <rect x={mx + 6} y={Y(ind.zone[0]) + 5} width="14" height="14" rx="2" fill={ind.acide} stroke="#475569"/>
        <text x={mx + 24} y={Y(ind.zone[0]) + 18} fontSize="17" fill="#334155">pH &lt; {nbf(ind.zone[0], 1)} : {nomCouleur(ind.acide)} </text>
        <rect x={mx + 6} y={Y(ind.zone[1]) - 21} width="14" height="14" rx="2" fill={ind.base} stroke="#475569"/>
        <text x={mx + 24} y={Y(ind.zone[1]) - 8} fontSize="17" fill="#334155">pH &gt; {nbf(ind.zone[1], 1)} : {nomCouleur(ind.base)} </text></>}
      {ptsCmp && <path d={trace(ptsCmp, p => Y(p.pH))} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4"/>}
      {ptsCmp && <text x={X(20.5)} y={Y(2.2)} fontSize="17" fill="#64748b">acide fort (HCl)</text>}
      {deriv && <path d={trace(pts, p => Yd(p.d))} fill="none" stroke="#15803d" strokeWidth="1.8" strokeDasharray="5 3"/>}
      {deriv && <text x={X(Math.min(VMAX - 7, VE + 1))} y={my + 22} fontSize="17" fill="#15803d" fontWeight="700">dpH/dV<tspan baselineShift="sub" fontSize="0.75em">B</tspan></text>}
      <path d={trace(pts, p => Y(p.pH))} fill="none" stroke="#0369a1" strokeWidth="2.6"/>
      {montrerVE && VE <= VMAX && <><line x1={X(VE)} y1={my} x2={X(VE)} y2={bas} stroke="#15803d" strokeWidth="1.3" strokeDasharray="3 3"/>
        <text x={X(VE) + 5} y={bas - 6} fontSize="17" fill="#15803d" fontWeight="700">V<tspan baselineShift="sub" fontSize="0.75em">E</tspan> = {nbf(VE, 1)} mL</text></>}
      <line x1={X(Vb)} y1={my} x2={X(Vb)} y2={bas} stroke="#b45309" strokeWidth="1.4" strokeDasharray="3 3"/>
      <circle cx={X(Vb)} cy={Y(ph)} r="6" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5"/>
    </svg>);
}

// ---------- graphe des quantités de matière n = f(V) (transformation totale) ----------
function GrapheQuantites({ p, Vb, VE, montrerVE }) {
  const W = 480, H = 290, mx = 56, my = 16, bas = H - 60, fort = M.ACIDES[p.acide].fort;
  const { acide, C0, V0, Cb } = p;
  const pts = useMemo(() => M.courbeQuantites({ acide, C0, V0, Cb }, VMAX, 200), [acide, C0, V0, Cb]);
  const top = Math.max(p.C0 * p.V0, p.Cb * VMAX - p.C0 * p.V0, 0.5), pas = top > 2 ? 1 : 0.5, haut = Math.ceil(top / pas) * pas;
  const X = v => mx + (W - mx - 12) * v / VMAX, Y = n => my + (bas - my) * (1 - n / haut);
  const L = cle => pts.map((q, i) => `${i ? 'L' : 'M'}${X(q.V).toFixed(1)},${Y(q[cle]).toFixed(1)}`).join('');
  const nomAH = fort ? 'H₃O⁺' : FORM_ACIDE[p.acide], nomA = fort ? null : M.ACIDES[p.acide].base;
  const c = M.composition(p, Vb);
  const ticks = []; for (let n = 0; n <= haut + 1e-9; n += pas) ticks.push(n);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={`Quantités de matière en millimoles en fonction du volume versé : ${nomAH} décroît jusqu’à zéro à l’équivalence, ${nomA ? `${nomA} croît jusqu’à ${nbf(c.n0, 2)} millimoles, ` : ''}HO⁻ n’apparaît qu’après l’équivalence`}>
      <line x1={mx} y1={bas} x2={W - 12} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {[0, 5, 10, 15, 20, 25].map(v => <text key={v} x={X(v)} y={bas + 21} fontSize="17" textAnchor="middle" fill="#334155">{v}</text>)}
      {ticks.map(n => <g key={n}><line x1={mx} y1={Y(n)} x2={W - 12} y2={Y(n)} stroke="#eef2f7"/><text x={mx - 7} y={Y(n) + 6} fontSize="17" textAnchor="end" fill="#334155">{nbf(n, 1)}</text></g>)}
      <text x={(mx + W) / 2} y={H - 10} fontSize="17" textAnchor="middle" fill="#334155">V<tspan baselineShift="sub" fontSize="0.75em">B</tspan> (mL)</text>
      <text x="16" y={(my + bas) / 2} fontSize="17" fill="#334155" transform={`rotate(-90 16 ${(my + bas) / 2})`} textAnchor="middle">n (mmol)</text>
      <path d={L('nAH')} fill="none" stroke="#6d28d9" strokeWidth="2.4"/>{nomA && <path d={L('nA')} fill="none" stroke="#0e7490" strokeWidth="2.4"/>}<path d={L('nOH')} fill="none" stroke="#c2410c" strokeWidth="2.4"/>
      <text x={X(1)} y={Y(c.n0) - 5} fontSize="17" fontWeight="700" fill="#6d28d9">{nomAH}</text>
      {nomA && <text x={X(18.5)} y={Y(c.n0) - 5} fontSize="17" fontWeight="700" fill="#0e7490">{nomA}</text>}
      <text x={X(22.6)} y={Y(Math.max(0, p.Cb * 22.6 - c.n0)) - 14} fontSize="17" fontWeight="700" fill="#c2410c" textAnchor="end">HO⁻</text>
      {montrerVE && VE <= VMAX && <line x1={X(VE)} y1={my} x2={X(VE)} y2={bas} stroke="#15803d" strokeWidth="1.3" strokeDasharray="3 3"/>}
      <line x1={X(Vb)} y1={my} x2={X(Vb)} y2={bas} stroke="#b45309" strokeWidth="1.4" strokeDasharray="3 3"/>
    </svg>);
}

// ---------- tableau de composition au volume versé ----------
function TableComposition({ p, Vb }) {
  const c = M.composition(p, Vb), fort = M.ACIDES[p.acide].fort, et = M.etatTitrage(p, Vb);
  const lignes = [[fort ? 'H₃O⁺ (acide apporté)' : `${FORM_ACIDE[p.acide]} (acide)`, c.nAH, '#6d28d9'],
    fort ? ['Cl⁻ (ion spectateur)', c.nCl, '#64748b'] : [`${M.ACIDES[p.acide].base} (formé)`, c.nA, '#0e7490'], ['HO⁻ (en excès)', c.nOH, '#c2410c']];
  return (
    <div role="group" aria-label="Composition du système" style={{ fontSize: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '3px 4px' }}>Espèce dans l’erlenmeyer</th><th style={{ padding: '3px 4px', textAlign: 'right' }}>n (mmol)</th></tr></thead>
        <tbody>{lignes.map(([n, v, col]) => <tr key={n} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '4px', fontWeight: 600 }}><span style={{ color: col }}>●</span> {n}</td>
          <td style={{ padding: '4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{nbf(v, 2)}</td></tr>)}</tbody>
      </table>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        Quantité initiale d’acide : {nbf(c.n0, 2)} mmol ; HO⁻ versé : {nbf(c.nB, 2)} mmol. Na⁺ (spectateur) : {nbf(c.nNa, 2)} mmol.{' '}
        <strong style={{ color: et === 'equivalence' ? '#15803d' : KIT.txt }}>{et === 'avant' ? 'Avant l’équivalence : HO⁻ est le réactif limitant.' : et === 'equivalence' ? 'Équivalence : acide et HO⁻ sont tous deux consommés.' : 'Après l’équivalence : l’acide est le réactif limitant, HO⁻ est en excès.'}</strong>
      </div>
    </div>);
}

// ---------- diagramme de prédominance du couple ----------
function Predominance({ pKa, ph, acide, base }) {
  const W = 480, x = p => 20 + p / 14 * 440, yb = 36;
  return (
    <svg viewBox={`0 -20 ${W} 118`} style={{ width: '100%', maxWidth: 520, display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={`Diagramme de prédominance du couple ${acide} / ${base} de pKA ${nbf(pKa, 1)} : ${acide} prédomine pour pH inférieur à ${nbf(pKa, 1)}, ${base} au-dessus. Le pH actuel est ${nbf(ph, 2)}`}>
      <rect x={x(0)} y={yb} width={x(pKa) - x(0)} height="30" fill="#ede9fe"/><rect x={x(pKa)} y={yb} width={x(14) - x(pKa)} height="30" fill="#cffafe"/>
      <text x={(x(0) + x(pKa)) / 2} y={yb + 21} fontSize="17" fontWeight="700" fill="#6d28d9" textAnchor="middle">{acide} prédomine</text>
      <text x={(x(pKa) + x(14)) / 2} y={yb + 21} fontSize="17" fontWeight="700" fill="#0e7490" textAnchor="middle">{base} prédomine</text>
      <line x1={x(pKa)} y1={yb - 4} x2={x(pKa)} y2={yb + 34} stroke="#0f172a" strokeWidth="1.8"/>
      <text x={x(pKa)} y="88" fontSize="17" fill="#0f172a" textAnchor="middle">pK<tspan baselineShift="sub" fontSize="0.75em">A</tspan> = {nbf(pKa, 1)}</text>
      {[0, 7, 14].map(p => <text key={p} x={x(p)} y="88" fontSize="17" fill="#64748b" textAnchor={p === 0 ? 'start' : p === 14 ? 'end' : 'middle'}>{p === 7 ? '' : p}</text>)}
      <polygon points={`${x(ph) - 7},8 ${x(ph) + 7},8 ${x(ph)},21`} fill="#f59e0b" stroke="#0f172a"/>
      <text x={Math.min(Math.max(x(ph), 50), 430)} y="2" fontSize="17" fontWeight="700" fill="#b45309" textAnchor="middle" style={{ paintOrder: 'stroke' }}>pH = {nbf(ph, 2)}</text>
    </svg>);
}

// ---------- tableau des indicateurs (exploration) ----------
function TableIndicateurs({ p }) {
  const VE = M.volumeEq(p);
  return (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Quel indicateur pour ce titrage ?</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>pH à l’équivalence : <strong>{nbf(M.pHEq(p), 2)}</strong> ; V<sub>E</sub> = {nbf(VE, 1)} mL. Règle : l’indicateur convient si sa zone de virage <strong>contient</strong> pH<sub>E</sub>.</div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Indicateur (zone)</th><th style={{ padding: '2px 4px' }}>Convient ?</th><th style={{ padding: '2px 4px' }}>Virage (mL)</th></tr></thead>
        <tbody>{M.INDICATEURS.map(i => {
          const v = M.virage(i, p), ok = M.convient(i, p);
          return (<tr key={i.id} style={{ borderTop: `1px dashed ${KIT.bord}` }}>
            <td style={{ padding: '3px 4px', fontWeight: 600 }}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: `linear-gradient(90deg, ${i.acide}, ${i.base})`, border: '1px solid #94a3b8', marginRight: 5, verticalAlign: 'middle' }}/>{i.nom}<br/><span style={{ fontWeight: 400, color: KIT.txt2 }}>{nbf(i.zone[0], 1)} – {nbf(i.zone[1], 1)}</span></td>
            <td style={{ padding: '3px 4px', fontWeight: 700, color: ok ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>{ok ? '✓ oui' : '✗ non'}</td>
            <td style={{ padding: '3px 4px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{v.v1 == null || v.v2 == null ? 'hors burette' : `${nbf(v.v1, 2)} → ${nbf(v.v2, 2)}`}</td></tr>);
        })}</tbody>
      </table>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>« Virage » : volumes versés au début puis à la fin de la zone de virage. Un bon indicateur change de couleur d’un coup, tout près de V<sub>E</sub> ; un mauvais vire loin de V<sub>E</sub>, ou lentement.</div>
    </div>);
}

// ====================================================
export function SimulationTitragePH() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [g1, setG1] = useEtatPersistant(CLE_GUIDE, VIDE), [g2, setG2] = useEtatPersistant(CLE_GUIDE + '-p2', VIDE), [g3, setG3] = useEtatPersistant(CLE_GUIDE + '-p3', VIDE);
  const [parcBrut, setParc] = useEtatPersistant(CLE_GUIDE + '-parcours-choix', 1);
  const parc = [1, 2, 3].includes(parcBrut) ? parcBrut : 1;
  const guide = [g1, g2, g3][parc - 1], setGuide = [setG1, setG2, setG3][parc - 1];
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('conc');
  const [hypoOuv, setHypoOuv] = useState(false), [revoirScene, setRevoirScene] = useState(false);
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));
  const setV = v => setT({ Vb: Math.max(0, Math.min(VMAX, Math.round(v * 10) / 10)) });

  // ---------- étapes du parcours ----------
  const ORDRE_PARC = [['montage', 'verser', 'nhoh', 'limitant', 'compo', 'exces', 'equiv', 'bilan1'],
    ['courbe', 'derivee', 'ca', 'phe', 'predom', 'bilan2'],
    ['fort', 'fortph', 'indic', 'bbtfort', 'bbtfaible', 'choix', 'bravo']];
  const IDS = ORDRE_PARC[parc - 1];
  // étape d’un autre parcours : déjà passée (parcours précédent) ou pas encore atteinte (parcours suivant)
  const iEt = id => { const k = IDS.indexOf(id); if (k >= 0) return k; return ORDRE_PARC.findIndex(o => o.includes(id)) < parc - 1 ? -1 : Infinity; };
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > iEt(id), deja = id => !enGuide || etape >= iEt(id);

  // ---------- grandeurs effectives ----------
  const P = dd ? { acide: dd.acide, C0: dd.C0, V0: 20.0, Cb: 0.100 } : { acide: ti.acide, C0: ti.C0, V0: ti.V0, Cb: ti.Cb };
  const Vb = ti.Vb, ac = M.ACIDES[P.acide], fort = !!ac.fort, pKa = fort ? null : ac.pKas[0];
  const VE = M.volumeEq(P), ph = M.pHa(P, Vb), phE = M.pHEq(P);
  const indEff = dd ? (dd.type === 'indic' && dd.ind ? IND(dd.ind) : null) : (ti.ind ? IND(ti.ind) : null);
  const { acide: pAcide, C0: pC0, V0: pV0, Cb: pCb } = P, comparer = ti.cmp && !dd;
  const pts = useMemo(() => M.courbe({ acide: pAcide, C0: pC0, V0: pV0, Cb: pCb }), [pAcide, pC0, pV0, pCb]);
  const ptsCmp = useMemo(() => (comparer && pAcide !== 'hcl' ? M.courbe({ acide: 'hcl', C0: pC0, V0: pV0, Cb: pCb }) : null), [comparer, pAcide, pC0, pV0, pCb]);
  const nB = P.Cb * Vb;
  const coulSol = indEff ? M.couleurIndicateur(indEff, ph) : '#e0f2fe';

  // ---------- états attendus (rétablissements du parcours) ----------
  const attendu = {
    nhoh: { V: 4 }, limitant: { V: 4 }, compo: { V: 4 }, exces: { V: 22 },
    courbe: { acide: 'etha' }, derivee: { acide: 'etha' }, ca: { acide: 'etha' }, phe: { acide: 'etha', V: 16 }, predom: { acide: 'etha', V: 16 }, fortph: { acide: 'hcl', V: 16 },
    bbtfort: { acide: 'hcl', ind: 'bbt', V: 16 }, bbtfaible: { acide: 'etha', ind: 'bbt', V: 16 }, choix: { acide: 'etha', V: 16 },
  }[idE] || null;
  const conforme = !attendu || ((attendu.V == null || Math.abs(Vb - attendu.V) < 0.05) && (!attendu.acide || ti.acide === attendu.acide) && (!attendu.ind || ti.ind === attendu.ind));
  const bloque = conforme ? null : 'Rétablissez d’abord le montage avec le bouton au-dessus du schéma.';
  const retablir = () => setT({ ...(attendu.V != null ? { Vb: attendu.V } : {}), ...(attendu.acide ? { acide: attendu.acide } : {}), ...(attendu.ind ? { ind: attendu.ind } : {}) });
  const libelleRetablir = attendu && `Rétablir : ${[attendu.acide === 'hcl' ? 'acide chlorhydrique' : attendu.acide === 'etha' ? 'acide éthanoïque' : null, attendu.ind ? 'BBT' : null, attendu.V != null ? `${nbf(attendu.V, 1)} mL de soude versés` : null].filter(Boolean).join(', ')}`;

  const vir = M.virage(IND('bbt'), { acide: 'etha', C0: 0.080, V0: 20.0, Cb: 0.100 }), virBth = M.virage(IND('bth'), { acide: 'etha', C0: 0.080, V0: 20.0, Cb: 0.100 });

  const TOUTES = [
    { id: 'montage', titre: 'Le montage du titrage', focus: ['scene'],
      texte: <>Vous contrôlez une solution d’acide éthanoïque CH₃COOH dont l’étiquette annonce <em>C</em><sub>A</sub> = 0,080{NB}mol·L⁻¹. On en place <em>V</em><sub>A</sub> = 20,0{NB}mL dans l’erlenmeyer et on la <strong>titre</strong> avec une solution d’hydroxyde de sodium (Na⁺ + HO⁻) de concentration <em>C</em><sub>B</sub> = 0,100{NB}mol·L⁻¹, versée avec la burette. Un pH-mètre suit le pH de la solution.</>,
      tache: { type: 'qcm', q: 'Quelle équation modélise la réaction support du titrage ?', options: ['CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O', 'CH₃COOH + H₂O → CH₃COO⁻ + H₃O⁺', 'H₃O⁺ + HO⁻ → 2 H₂O'], bonne: 0,
        expl: 'Les couples CH₃COOH / CH₃COO⁻ et H₂O / HO⁻ interviennent : l’acide CH₃COOH cède un ion H⁺ à la base HO⁻ de la soude. Les ions Na⁺ sont spectateurs. La 2ᵉ équation est celle de l’acide avec l’eau (avant tout ajout) ; la 3ᵉ serait celle du titrage d’un acide fort.',
        indice: 'Un acide cède un ion H⁺ à une base : repérez l’acide du couple CH₃COOH / CH₃COO⁻ et la base du couple H₂O / HO⁻.' } },
    { id: 'verser', titre: 'Verser la soude', focus: ['reglages', 'scene'],
      texte: <>Le curseur « Volume de soude versé » commande la burette : le niveau baisse dans la burette et le pH-mètre affiche le pH de l’erlenmeyer. Versez <em>V</em><sub>B</sub> = 4,0{NB}mL.</>,
      tache: { type: 'action', ok: Math.abs(Vb - 4) < 0.05, label: 'Verser 4,0 mL', faire: () => setV(4), consigne: 'Réglez le volume de soude versé sur 4,0 mL' } },
    { id: 'nhoh', titre: 'Les ions HO⁻ versés', focus: ['mesures'],
      texte: <>On a versé <em>V</em><sub>B</sub> = 4,0{NB}mL de soude de concentration <em>C</em><sub>B</sub> = 0,100{NB}mol·L⁻¹. Seuls les ions HO⁻ réagissent avec l’acide (Na⁺ est spectateur). La quantité d’ions HO⁻ versée est :
        <Formule><msub><mi>n</mi><mi>B</mi></msub><mo>=</mo><msub><mi>C</mi><mi>B</mi></msub><mo>×</mo><msub><mi>V</mi><mi>B</mi></msub></Formule></>,
      tache: { type: 'num', q: 'Quantité n_B d’ions HO⁻ versée', unite: 'mmol', vrai: 0.40, tol: 0.04, affiche: v => nbf(v, 2), cs: 2, bloque,
        calcul: () => ['Unités : mol·L⁻¹ × mL = mmol (pas besoin de convertir les mL si on garde des mmol).', 'n_B = C_B × V_B = 0,100 × 4,0 = 0,40 mmol (soit 4,0 × 10⁻⁴ mol).'],
        pieges: [[4.0e-4, 'Le résultat est demandé en millimoles (1 mmol = 10⁻³ mol) : 4,0 × 10⁻⁴ mol = 0,40 mmol.'], [0.025, 'Le rapport est inversé : n_B = C_B × V_B, pas frac(V_B|C_B).']],
        expl: 'n_B = 0,100 × 4,0 = 0,40 mmol d’ions HO⁻.', indice: 'n = C × V : avec C en mol·L⁻¹ et V en mL, on obtient des millimoles.' } },
    { id: 'limitant', titre: 'Une transformation totale', focus: ['scene'],
      retenirTitre: 'La réaction support du titrage',
      retenir: <>
        <SvgReaction/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Titrer = faire réagir, de façon totale et rapide, l’espèce à doser avec un réactif titrant connu.</strong> Ici : transfert de H⁺ de l’acide vers HO⁻.</li>
          <li>Constante de la réaction : <em>K</em> = {avecIndices('frac(K_A|K_e)')} ≈ 1,6 × 10⁹ ≫ 1 ⇒ on la considère comme <strong>totale</strong>.</li>
          <li><strong>Idée fausse</strong> : « les ions HO⁻ versés restent dans le bécher ». <strong>Vrai</strong> : tant qu’il reste de l’acide, chaque HO⁻ versé est consommé.</li>
        </ul></>,
      texte: <>Au contact de l’acide, les ions HO⁻ réagissent. La constante de la réaction, <em>K</em>, se calcule avec la constante d’acidité <em>K</em><sub>A</sub> du couple CH₃COOH / CH₃COO⁻ (p<em>K</em><sub>A</sub> = 4,8) et le produit ionique de l’eau <em>K</em><sub>e</sub> (10⁻¹⁴ à 25 °C). Elle est très grande :
        <Formule><mi>K</mi><mo>=</mo><mfrac><msub><mi>K</mi><mi>A</mi></msub><msub><mi>K</mi><mi>e</mi></msub></mfrac><mo>=</mo><msup><mn>10</mn><mrow><mn>14</mn><mo>−</mo><mn>4,8</mn></mrow></msup><mo>≈</mo><mn>1,6</mn><mo>×</mo><msup><mn>10</mn><mn>9</mn></msup></Formule>
        On modélise donc la transformation comme <strong>totale</strong> (et rapide).</>,
      tache: { type: 'qcm', q: 'Avant l’équivalence, que deviennent les ions HO⁻ versés ?', options: ['ils sont entièrement consommés par l’acide : HO⁻ est le réactif limitant', 'ils s’accumulent dans l’erlenmeyer', 'la moitié reste en solution'], bonne: 0, bloque,
        expl: 'La transformation étant totale et l’acide en excès, chaque ion HO⁻ versé réagit : HO⁻ est le réactif limitant. Il n’en reste pratiquement pas dans l’erlenmeyer.', indice: 'Dans une transformation totale, le réactif limitant est entièrement consommé.' } },
    { id: 'compo', titre: 'Composition après un ajout', focus: ['scene'],
      texte: <>Au départ, l’erlenmeyer contient <em>n</em><sub>A</sub> = <em>C</em><sub>A</sub> × <em>V</em><sub>A</sub> = 0,080 × 20,0 = 1,60{NB}mmol d’acide éthanoïque. Vous avez versé 0,40{NB}mmol d’ions HO⁻ (étape précédente) : chacun fait disparaître une molécule d’acide et forme un ion CH₃COO⁻.</>,
      tache: { type: 'num', q: 'Quantité d’acide éthanoïque restant', unite: 'mmol', vrai: 1.20, tol: 0.04, affiche: v => nbf(v, 2), cs: 2, bloque,
        calcul: () => ['Transformation totale, coefficients stœchiométriques égaux à 1 : n(CH₃COOH) restant = n(CH₃COOH) initial − n_B.', 'n(CH₃COOH) restant = 1,60 − 0,40 = 1,20 mmol ; il s’est formé 0,40 mmol d’ions CH₃COO⁻.'],
        pieges: [[0.40, '0,40 mmol est la quantité d’ions CH₃COO⁻ formés, pas celle d’acide restant.'], [2.00, 'Il faut soustraire : l’acide disparaît quand on verse HO⁻.'], [1.60, '1,60 mmol est la quantité initiale d’acide : il en a déjà réagi 0,40 mmol.']],
        expl: 'n(CH₃COOH) restant = 1,60 − 0,40 = 1,20 mmol.', indice: 'Quantité restante = quantité initiale − quantité qui a réagi (= quantité de HO⁻ versée).' } },
    { id: 'exces', titre: 'Après avoir tout versé', focus: ['scene'],
      texte: <>Poursuivons jusqu’à <em>V</em><sub>B</sub> = 22,0{NB}mL : on a versé <em>n</em><sub>B</sub> = 0,100 × 22,0 = 2,20{NB}mmol d’ions HO⁻ pour 1,60{NB}mmol d’acide éthanoïque au départ. Tout l’acide a réagi.</>,
      tache: { type: 'num', q: 'Quantité d’ions HO⁻ en excès dans l’erlenmeyer', unite: 'mmol', vrai: 0.60, tol: 0.04, affiche: v => nbf(v, 2), cs: 3, bloque,
        calcul: () => ['Les 1,60 mmol d’acide ont consommé 1,60 mmol d’ions HO⁻ (transformation totale).', 'n(HO⁻) en excès = 2,20 − 1,60 = 0,60 mmol.'],
        pieges: [[2.20, '2,20 mmol est la quantité versée : 1,60 mmol ont réagi avec l’acide.'], [3.80, 'Il faut soustraire la quantité d’acide, qui a réagi.'], [1.60, '1,60 mmol est la quantité d’ions HO⁻ qui a réagi, pas celle qui reste.']],
        expl: 'n(HO⁻) en excès = 2,20 − 1,60 = 0,60 mmol.', indice: 'Excès = quantité versée − quantité qui a réagi avec l’acide.' } },
    { id: 'equiv', titre: 'L’équivalence', focus: ['scene'],
      retenirTitre: 'Composition et équivalence',
      retenir: <>
        <SvgComposition/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Avant V<sub>E</sub> : HO⁻ versé = HO⁻ consommé</strong> : n(acide) = n<sub>A</sub> − n<sub>B</sub> (n<sub>A</sub> : quantité initiale d’acide) et n(base conjuguée) = n<sub>B</sub>.</li>
          <li><strong>À l’équivalence, il ne reste ni acide ni HO⁻</strong> : réactifs en proportions stœchiométriques, n<sub>B</sub> = n<sub>A</sub>.</li>
          <li><strong>Après V<sub>E</sub></strong> : HO⁻ en excès, n(HO⁻) = n<sub>B</sub> − n<sub>A</sub>.</li>
          <li>Notation : <strong>E = équivalence</strong> (V<sub>E</sub>, pH<sub>E</sub>) ; <strong>éq = équilibre</strong> (ne pas confondre).</li>
        </ul></>,
      texte: <>Le tableau de composition donne, à chaque volume versé, les quantités des espèces (transformation totale). Déplacez le curseur de 0 à 22{NB}mL. Il existe un volume <em>V</em><sub>E</sub> pour lequel l’acide et les ions HO⁻ ont tous deux disparu : c’est l’<strong>équivalence</strong>.</>,
      tache: { type: 'qcm', q: 'À l’équivalence…', options: ['l’acide et les ions HO⁻ sont dans les proportions stœchiométriques : ils sont tous deux entièrement consommés', 'le pH de la solution vaut forcément 7', 'il reste autant d’acide que d’ions HO⁻'], bonne: 0,
        expl: 'À l’équivalence, n(HO⁻) versé = n(acide) initial : ni l’un ni l’autre ne reste (transformation totale). Rien n’impose que le pH vaille 7 : on le verra plus loin.', indice: 'Dans le tableau, cherchez le volume où les lignes « acide » et « HO⁻ » valent toutes deux 0.' } },
    { id: 'bilan1', titre: 'Le bilan', focus: [],
      texte: <>Vous savez établir la composition du système au cours d’un titrage et définir l’équivalence. Le parcours 2 repère l’équivalence sur la courbe, en déduit la concentration et le pH à l’équivalence.</>, tache: null },
    { id: 'courbe', titre: 'Repérer l’équivalence par le pH', focus: ['scene'],
      texte: <>En pratique, on ne voit pas les quantités de matière : on mesure le <strong>pH</strong>. La courbe pH = f(<em>V</em><sub>B</sub>) apparaît ; le point orange suit le curseur. Déplacez le curseur de volume jusqu’à l’endroit où le pH <strong>augmente le plus vite</strong> : c’est le <strong>saut de pH</strong>.</>,
      tache: { type: 'action', ok: Math.abs(Vb - 16) <= 0.5, label: 'Aller au saut de pH', faire: () => setV(16), consigne: 'Placez le curseur au milieu du saut de pH' } },
    { id: 'derivee', titre: 'Lire V_E avec la dérivée', focus: ['reglages', 'scene'],
      texte: <>Pour lire <em>V</em><sub>E</sub> plus précisément, on trace la dérivée dpH/d<em>V</em><sub>B</sub> : elle passe par un <strong>maximum</strong> à l’équivalence. Cliquez sur « Afficher la dérivée » (dans les réglages), puis lisez <em>V</em><sub>E</sub>.</>,
      tache: { type: 'num', q: 'Volume équivalent V_E', unite: 'mL', vrai: 16.0, tol: 0.03, affiche: v => nbf(v, 1), cs: 3, bloque: ti.deriv ? null : 'Affichez d’abord la dérivée avec le bouton « Afficher la dérivée ».',
        calcul: () => ['V_E est l’abscisse du maximum de la courbe dérivée (en vert) : V_E = 16,0 mL.'],
        pieges: [[8.0, '8,0 mL est la moitié de V_E : il n’y a pas de saut à cet endroit, cherchez le maximum de la dérivée.']],
        expl: 'Le maximum de dpH/dV_B se situe à V_E = 16,0 mL : c’est aussi le milieu du saut de pH.', indice: 'V_E est l’abscisse du sommet de la courbe verte (maximum de dpH/dV_B).' } },
    { id: 'ca', titre: 'En déduire la concentration', focus: ['mesures'],
      retenirTitre: 'Repérer l’équivalence et en déduire la concentration',
      retenir: <>
        <SvgRepererVE/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>V<sub>E</sub> = milieu du saut de pH = maximum de dpH/dV<sub>B</sub>.</strong></li>
          <li>À l’équivalence : n<sub>A</sub> = n<sub>B</sub>, donc <em>C</em><sub>A</sub> <em>V</em><sub>A</sub> = <em>C</em><sub>B</sub> <em>V</em><sub>E</sub>. Exemple de la simulation : <em>C</em><sub>A</sub> = {avecIndices('frac(0,100 × 16,0|20,0)')} = 0,0800 mol·L⁻¹.</li>
          <li><em>V</em><sub>E</sub> et <em>V</em><sub>A</sub> dans la même unité ; le résultat se compare à l’étiquette.</li>
        </ul></>,
      texte: <>À l’équivalence, la quantité d’ions HO⁻ versée est égale à la quantité d’acide initiale :
        <Formule><msub><mi>C</mi><mi>A</mi></msub><mo>×</mo><msub><mi>V</mi><mi>A</mi></msub><mo>=</mo><msub><mi>C</mi><mi>B</mi></msub><mo>×</mo><msub><mi>V</mi><mi>E</mi></msub></Formule>
        Vous avez repéré <em>V</em><sub>E</sub> = 16,0{NB}mL ; on a <em>V</em><sub>A</sub> = 20,0{NB}mL et <em>C</em><sub>B</sub> = 0,100{NB}mol·L⁻¹.</>,
      tache: { type: 'num', q: 'Concentration C_A de la solution d’acide', unite: 'mol·L⁻¹', vrai: 0.0800, tol: 0.04, affiche: v => nbf(v, 4), cs: 3,
        calcul: () => ['C_A = frac(C_B × V_E|V_A) : V_E et V_A sont dans la même unité (mL), le rapport frac(V_E|V_A) est sans unité.', 'C_A = frac(0,100 × 16,0|20,0) = 0,0800 mol·L⁻¹.', 'Comparaison avec l’étiquette (0,080 mol·L⁻¹) : la solution est conforme.'],
        pieges: [[0.125, 'Le rapport est inversé : C_A = frac(C_B × V_E|V_A).'], [0.0800 * 1000, 'La concentration est demandée en mol·L⁻¹, pas en mmol·L⁻¹.']],
        expl: 'C_A = 0,0800 mol·L⁻¹ : la solution est conforme à l’étiquette (0,080 mol·L⁻¹).', indice: 'C_A × V_A = C_B × V_E, donc C_A = frac(C_B × V_E|V_A).' } },
    { id: 'phe', titre: 'Le pH à l’équivalence', focus: ['scene', 'mesures'],
      texte: <>La solution à l’équivalence est-elle neutre ? Placez le curseur à <em>V</em><sub>E</sub> = 16,0{NB}mL (bouton ci-dessous si besoin) et lisez le pH sur le pH-mètre.</>,
      tache: { type: 'num', q: 'pH à l’équivalence', unite: '', vrai: M.pHEq({ acide: 'etha', C0: 0.080, V0: 20.0, Cb: 0.100 }), tol: 0.02, affiche: v => nbf(v, 2), cs: 2, bloque,
        calcul: () => ['Lecture du pH-mètre à V_B = V_E = 16,0 mL : pH_E ≈ 8,72 ; on retient pH_E ≈ 8,7.'],
        expl: 'pH_E ≈ 8,7 : supérieur à 7. À l’équivalence, la solution n’est pas neutre.', indice: 'Mettez le curseur sur 16,0 mL et lisez le pH affiché.' } },
    { id: 'predom', titre: 'Pourquoi un pH basique ?', focus: ['scene'],
      texte: <>À l’équivalence, il ne reste plus d’acide CH₃COOH : l’erlenmeyer contient surtout des ions éthanoate CH₃COO⁻ (formés) et des ions Na⁺ (spectateurs). Le <strong>diagramme de prédominance</strong> du couple CH₃COOH / CH₃COO⁻ indique quelle forme domine selon le pH : l’acide si pH &lt; p<em>K</em><sub>A</sub>, la base si pH &gt; p<em>K</em><sub>A</sub> (p<em>K</em><sub>A</sub> = −log <em>K</em><sub>A</sub> = 4,8 pour ce couple). Il place le pH lu : pH<sub>E</sub> ≈ 8,7.</>,
      tache: { type: 'qcm', q: 'Au pH de l’équivalence (≈ 8,7), l’espèce qui prédomine dans le couple est…', options: ['CH₃COO⁻, car pH > pKA', 'CH₃COOH, car pH > pKA', 'les deux à égalité, car pH = pKA'], bonne: 0, bloque,
        expl: 'pH > pK_A : la base CH₃COO⁻ prédomine. C’est une base faible : elle réagit un peu avec l’eau (CH₃COO⁻ + H₂O ⇌ CH₃COOH + HO⁻), ce qui rend la solution basique : pH_E > 7.', indice: 'Pour pH > pKA, l’espèce basique du couple prédomine ; pour pH < pKA, c’est l’espèce acide.' } },
    { id: 'bilan2', titre: 'Le bilan', focus: [],
      texte: <>Vous savez repérer l’équivalence avec la dérivée du pH, en déduire la concentration de l’acide et expliquer un pH à l’équivalence supérieur à 7. Le parcours 3 compare avec un acide fort et traite le choix d’un indicateur coloré.</>, tache: null },
    { id: 'fort', titre: 'Et avec un acide fort ?', focus: ['reglages'],
      texte: <>Les boutons « Acide titré » apparaissent dans les réglages. Choisissez l’<strong>acide chlorhydrique</strong> (H₃O⁺ + Cl⁻), de même concentration et de même volume : <em>V</em><sub>E</sub> reste 16,0{NB}mL. La réaction support est alors H₃O⁺ + HO⁻ → 2 H₂O.</>,
      tache: { type: 'action', ok: ti.acide === 'hcl', label: 'Choisir l’acide chlorhydrique', faire: () => setT({ acide: 'hcl' }), consigne: 'Choisissez « acide chlorhydrique » dans les réglages' } },
    { id: 'fortph', titre: 'pH à l’équivalence : acide fort', focus: ['scene', 'mesures'],
      retenirTitre: 'Le pH à l’équivalence n’est pas toujours 7',
      retenir: <>
        <SvgPhEquivalence/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Acide fort + base forte : pH<sub>E</sub> = 7,0</strong> (Na⁺ et Cl⁻ sont spectateurs). <strong>Acide faible + base forte : pH<sub>E</sub> &gt; 7</strong> (la base conjuguée formée prédomine).</li>
          <li>Moyen de s’en souvenir : <strong>« à V<sub>E</sub>, c’est la base conjuguée qui décide du pH »</strong>.</li>
          <li><strong>Idée fausse</strong> : équivalence ⇒ pH = 7. <strong>Vrai</strong> : équivalence signifie réactifs en proportions stœchiométriques, pas solution neutre.</li>
        </ul></>,
      texte: <>Avec l’acide chlorhydrique, placez-vous à <em>V</em><sub>B</sub> = <em>V</em><sub>E</sub> = 16,0{NB}mL et lisez le pH sur le pH-mètre. Rappel : avec l’acide éthanoïque, on avait trouvé pH<sub>E</sub> ≈ 8,7.</>,
      tache: { type: 'qcm', q: 'Pour le titrage de l’acide chlorhydrique, le pH à l’équivalence vaut…', options: ['7,0 : il ne reste que Na⁺ et Cl⁻ (ions spectateurs) et de l’eau', '8,7, comme pour l’acide éthanoïque', 'moins de 7 : il reste de l’acide chlorhydrique'], bonne: 0, bloque,
        expl: 'Na⁺ et Cl⁻ viennent d’une base forte et d’un acide fort : ils n’ont aucune action sur le pH. pH_E = 7,0. Pour un acide faible, la base conjuguée formée rend la solution basique (pH_E = 8,7).', indice: 'Lisez le pH à 16,0 mL ; demandez-vous quelles espèces restent dans l’erlenmeyer.' } },
    { id: 'indic', titre: 'Un indicateur coloré', focus: ['reglages', 'scene'],
      texte: <>Un <strong>indicateur coloré</strong> change de couleur dans sa <strong>zone de virage</strong> : une teinte pour la forme acide, une autre pour la forme basique. Dans les réglages, choisissez le <strong>bleu de bromothymol (BBT)</strong> : jaune si pH &lt; 6,0, bleu si pH &gt; 7,6. Sa zone de virage s’affiche sur la courbe.</>,
      tache: { type: 'action', ok: ti.ind === 'bbt', label: 'Choisir le BBT', faire: () => setT({ ind: 'bbt' }), consigne: 'Choisissez le bleu de bromothymol dans les réglages' } },
    { id: 'bbtfort', titre: 'Le BBT avec l’acide fort', focus: ['scene'],
      texte: <>Avec l’acide chlorhydrique, déplacez le curseur autour de <em>V</em><sub>E</sub> = 16,0{NB}mL et regardez la couleur de l’erlenmeyer. Le pH à l’équivalence vaut 7,0 ; la zone de virage du BBT va de 6,0 à 7,6.</>,
      tache: { type: 'qcm', q: 'Le BBT convient-il pour ce titrage ?', options: ['Oui : pH_E = 7,0 est dans la zone de virage (6,0 – 7,6)', 'Non : pH_E = 7,0 est en dehors de la zone de virage', 'Non : il faudrait un indicateur qui vire vers pH = 12'], bonne: 0, bloque,
        expl: 'pH_E = 7,0 appartient à [6,0 ; 7,6] : le BBT change de couleur au moment même du saut de pH, c’est-à-dire à V_E. Règle : un indicateur convient si sa zone de virage contient le pH à l’équivalence.', indice: 'Comparez pH_E = 7,0 avec la zone de virage 6,0 – 7,6.' } },
    { id: 'bbtfaible', titre: 'Le même BBT, un acide faible', focus: ['scene', 'reglages'],
      texte: <>Revenons à l’<strong>acide éthanoïque</strong> (pH<sub>E</sub> ≈ 8,7) avec le même BBT. Observez la couleur de l’erlenmeyer pour <em>V</em><sub>B</sub> entre 15 et 16{NB}mL.</>,
      tache: { type: 'qcm', q: 'Pour le titrage de l’acide éthanoïque, le BBT…', options: ['est mal adapté : pH_E = 8,7 n’est pas dans sa zone de virage (6,0 – 7,6) et sa teinte change progressivement avant V_E', 'convient aussi : un indicateur convient toujours s’il vire autour de pH = 7', 'convient, car la zone de virage n’a aucune importance'], bonne: 0, bloque,
        expl: `pH_E = 8,7 est hors de la zone du BBT. Le BBT commence à virer dès ${nbf(vir.v1, 2)} mL (${nbf(16 - vir.v1, 2)} mL avant V_E) et n’est franchement bleu qu’à ${nbf(vir.v2, 2)} mL : le changement de couleur est progressif, on ne repère pas nettement V_E.`, indice: 'Comparez pH_E = 8,7 avec la zone de virage 6,0 – 7,6 : le contient-elle ?' } },
    { id: 'choix', titre: 'Choisir le bon indicateur', focus: ['reglages', 'scene'],
      retenirTitre: 'Choisir l’indicateur coloré',
      retenir: <>
        <SvgIndicateur/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Un indicateur convient si sa zone de virage contient le pH à l’équivalence.</strong> Il change alors de couleur d’un coup, juste à V<sub>E</sub>.</li>
          <li>Acide fort + base forte (pH<sub>E</sub> = 7,0) : BBT. Acide faible + base forte (pH<sub>E</sub> ≈ 8,7) : bleu de thymol (8,0 – 9,6).</li>
          <li><strong>Méthode</strong> : 1) repérer V<sub>E</sub> ; 2) lire ou prévoir pH<sub>E</sub> ; 3) choisir l’indicateur dont la zone contient pH<sub>E</sub>.</li>
        </ul></>,
      texte: <>Pour l’acide éthanoïque, <em>V</em><sub>E</sub> = 16,0{NB}mL et pH<sub>E</sub> ≈ 8,7. Essayez les indicateurs dans les réglages, puis choisissez celui dont la zone de virage <strong>contient</strong> pH<sub>E</sub>.</>,
      tache: { type: 'qcm', q: 'Quel indicateur choisir pour titrer l’acide éthanoïque ?', options: ['le bleu de thymol (zone 8,0 – 9,6)', 'le jaune de méthyle (zone 2,9 – 4,0)', 'le bleu de bromothymol (zone 6,0 – 7,6)', 'le jaune d’alizarine R (zone 10,1 – 12,0)'], bonne: 0, bloque,
        expl: `La zone du bleu de thymol (8,0 – 9,6) contient pH_E = 8,7. Il change de couleur entre ${nbf(virBth.v1, 2)} mL et ${nbf(virBth.v2, 2)} mL, c’est-à-dire d’un coup à V_E = 16,0 mL. Les autres zones ne contiennent pas pH_E.`, indice: 'Cherchez la zone de virage qui contient 8,7.' } },
    { id: 'bravo', titre: 'Le bilan', focus: [],
      texte: <>Vous savez établir la composition du système au cours d’un titrage, repérer l’équivalence, en déduire une concentration, prévoir le pH à l’équivalence et choisir un indicateur coloré. Passez à l’exploration (autres acides, autres concentrations, comparaison de courbes) ou tentez les deux défis.</>, tache: null },
  ];
  // Une carte « À retenir » ne doit pas donner la réponse de l'étape qu'elle conclut : elle s'affiche à l'étape suivante.
  [['limitant', 'compo'], ['equiv', 'bilan1'], ['ca', 'phe'], ['fortph', 'indic'], ['choix', 'bravo']].forEach(([de, vers]) => {
    const a = TOUTES.find(e => e.id === de), b = TOUTES.find(e => e.id === vers);
    b.retenir = a.retenir; b.retenirTitre = a.retenirTitre; delete a.retenir; delete a.retenirTitre;
  });
  const ETAPES = IDS.map(id => TOUTES.find(e => e.id === id));
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const donneesDefi = type => {
    const acide = tire(['hcl', 'etha', 'benz']), C0 = Math.round(tire([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]) * 5) / 1000, p = { acide, C0, V0: 20.0, Cb: 0.100 };
    if (type === 'conc') return { type, acide, C0 };
    const cl = M.INDICATEURS.map(i => [i, M.classeIndicateur(i, p)]), bon = tire(cl.filter(([, c]) => c === 'bon').map(([i]) => i));
    const mauvais = melange(cl.filter(([, c]) => c === 'mauvais').map(([i]) => i)).slice(0, 3);
    return { type, acide, C0, options: melange([bon, ...mauvais]).map(i => i.id), bon: bon.id, ind: null };
  };
  const nouveauDefi = type => { setDefi({ ...donneesDefi(type), type, reps: {}, verifie: false }); setT({ Vb: 0, deriv: false, ind: null }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'conc') {
      const x = lireNombre(defi.reps.c), ok = isFinite(x) && proche(x, defi.C0, 0.05);
      setDefi(d => ({ ...d, verifie: true, ok })); noterC(ok);
    } else {
      const x = lireNombre(defi.reps.ph), okPh = isFinite(x) && Math.abs(x - phE) <= 0.1, okInd = defi.ind === defi.bon;
      setDefi(d => ({ ...d, verifie: true, okPh, okInd, ok: okPh && okInd })); noterI(okPh && okInd);
    }
  };
  const champ = (cle, label, unite, largeur = 90) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('tph-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: largeur, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? ((cle === 'c' ? defi.ok : defi.okPh) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['conc', 'Concentration inconnue'], ['indic', 'pH à l’équivalence et indicateur']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'conc' ? 'Défi : quelle est la concentration de l’acide ?' : 'Défi : pH à l’équivalence et choix de l’indicateur'}</div>
      {defi.type === 'conc' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>On titre <strong>20,0{NB}mL</strong> d’une solution d’un acide (fort ou faible) de concentration inconnue <em>C</em><sub>A</sub> par de la soude de concentration <em>C</em><sub>B</sub> = <strong>0,100{NB}mol·L⁻¹</strong>. Faites varier le volume versé, repérez l’équivalence sur la courbe, puis calculez <em>C</em><sub>A</sub>. Donnez le résultat avec 3 chiffres significatifs.</div>
        {champ('c', 'Concentration C_A', 'mol·L⁻¹', 110)}
        <IndiceDefi cache={false}>Repérez <em>V</em><sub>E</sub> au maximum de la dérivée (bouton « Afficher la dérivée »), puis <em>C</em><sub>A</sub> = {avecIndices('frac(C_B × V_E|V_A)')} avec <em>V</em><sub>E</sub> et <em>V</em><sub>A</sub> en mL.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>On titre <strong>20,0{NB}mL</strong> d’<strong>{M.ACIDES[defi.acide].nom}</strong> de concentration <em>C</em><sub>A</sub> = <strong>{nbf(defi.C0, 3)}{NB}mol·L⁻¹</strong> par de la soude de concentration <em>C</em><sub>B</sub> = <strong>0,100{NB}mol·L⁻¹</strong>. 1) Calculez <em>V</em><sub>E</sub>, placez le curseur à ce volume et lisez le pH à l’équivalence (à 0,1 près). 2) Choisissez l’indicateur coloré qui convient.</div>
        {champ('ph', 'pH à l’équivalence', '', 90)}
        <div role="group" aria-label="Indicateur coloré" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>Indicateur :</span>
          {defi.options.map(id => <button key={id} onClick={() => setDefi(d => ({ ...d, ind: id, verifie: false }))} aria-pressed={defi.ind === id} style={stylePetitBouton(defi.ind === id, '#475569')}>{IND(id).nom} ({nbf(IND(id).zone[0], 1)} – {nbf(IND(id).zone[1], 1)})</button>)}
        </div>
        <IndiceDefi cache={false}><em>V</em><sub>E</sub> = {avecIndices('frac(C_A × V_A|C_B)')} (en mL). Lisez le pH à ce volume. L’indicateur convient si sa zone de virage <strong>contient</strong> pH<sub>E</sub> ; vous pouvez tester chacun : sa couleur apparaît dans l’erlenmeyer.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="tph-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'conc'
          ? (defi.ok ? `✓ Correct. C_A = ${nbf(defi.C0, 3)} mol·L⁻¹ (V_E = ${nbf(VE, 1)} mL).` : '✗ Vérifiez : V_E est l’abscisse du maximum de la dérivée ; puis C_A = C_B × V_E / V_A avec V_A = 20,0 mL et C_B = 0,100 mol·L⁻¹.')
          : (defi.ok ? `✓ Correct. V_E = ${nbf(VE, 1)} mL, pH_E = ${nbf(phE, 2)} ; ${IND(defi.bon).nom} (zone ${nbf(IND(defi.bon).zone[0], 1)} – ${nbf(IND(defi.bon).zone[1], 1)}) contient pH_E.`
            : <>{defi.okPh ? '✓ pH à l’équivalence correct.' : `✗ pH : calculez V_E = C_A × V_A / C_B = ${nbf(VE, 1)} mL, placez le curseur à ce volume et lisez le pH.`}{' '}{defi.okInd ? '✓ Indicateur correct.' : '✗ Indicateur : sa zone de virage doit contenir le pH à l’équivalence.'}</>)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température</strong> : 25 °C, avec <em>K</em><sub>e</sub> = 1,0 × 10⁻¹⁴ ; les p<em>K</em><sub>A</sub> sont des valeurs de table à 25 °C (acide éthanoïque : 4,8). Une autre température change <em>K</em><sub>e</sub>, les p<em>K</em><sub>A</sub> et donc le pH à l’équivalence.</li>
      <li><strong>Activités = concentrations</strong> : solutions diluées (concentrations ≤ 0,1 mol·L⁻¹). À plus forte concentration, les interactions entre ions rendent ce modèle moins bon.</li>
      <li><strong>Volumes additifs</strong> : le volume de l’erlenmeyer est <em>V</em><sub>A</sub> + <em>V</em><sub>B</sub> ; les concentrations diminuent à mesure qu’on verse (dilution).</li>
      <li><strong>Titrage rapide et total</strong> : la réaction (<em>K</em> ≥ 10⁹) est supposée instantanée et totale pour établir la composition en quantités de matière. Limite : à l’équivalence il reste en réalité une très petite quantité d’acide (environ 10⁻⁵ mol·L⁻¹), et il faut attendre l’homogénéisation à chaque ajout.</li>
      <li><strong>Calcul du pH</strong> : fait « exactement » avec l’équilibre de l’acide et l’autoprotolyse de l’eau (conservation de la charge), pas avec le tableau « total » : le pH est donc défini même à l’équivalence. Le CO₂ dissous de l’air est ignoré.</li>
      <li><strong>Instruments idéaux</strong> : burette, pipette et pH-mètre sans incertitude, pH-mètre parfaitement étalonné ; les incertitudes d’un titrage sont l’objet d’une autre simulation (métrologie).</li>
      <li><strong>Indicateur coloré</strong> : en quantité négligeable (il ne change ni le pH ni <em>V</em><sub>E</sub>) ; sa teinte est un mélange des deux couleurs selon la fraction de forme basique. Les zones de virage sont des valeurs usuelles ; l’œil situe mal le début et la fin du virage.</li>
      <li><strong>Règle de choix</strong> : « la zone de virage contient pH<sub>E</sub> » est une règle de choix, pas une frontière absolue : si le saut de pH est très grand (acide fort concentré), un indicateur dont la zone est dans le saut sans contenir pH<sub>E</sub> donne aussi une erreur très faible.</li>
      <li><strong>Notations</strong> : E = équivalence (<em>V</em><sub>E</sub>, pH<sub>E</sub>) ; éq = équilibre. Ne pas confondre les grandeurs à l’équivalence et à l’équilibre.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const NOMS_PARC = ['1. Composition du système et équivalence', '2. Concentration et pH à l’équivalence', '3. Acide fort et indicateur coloré'];
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {parc < 3 && <button onClick={() => setParc(parc + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Parcours {parc + 1} : {NOMS_PARC[parc].slice(3).toLowerCase()}</button>}
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- schéma du montage ----------
  const boutonRetablir = (txt, f) => <button onClick={f} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>{txt}</button>;
  // Le schéma du montage n'est utile qu'aux deux premières étapes et à celles où l'on regarde la couleur de l'indicateur : ailleurs il est replié (il séparait la consigne des graphiques).
  const sceneRepliee = enGuide && etape > iEt('verser') && !(etape >= iEt('indic') && etape <= iEt('choix')) && !revoirScene;
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enGuide && attendu && !conforme && boutonRetablir(libelleRetablir, retablir)}
      {enGuide && etape > iEt('verser') && <button onClick={() => setRevoirScene(r => !r)} aria-expanded={!sceneRepliee} style={{ ...styleBouton(false), marginBottom: sceneRepliee ? 0 : 8 }}>{sceneRepliee ? 'Revoir le schéma du montage' : 'Masquer le schéma'}</button>}
      {!sceneRepliee && <><div style={{ maxWidth: 560, margin: '0 auto' }}>
        <SchemaBurette V2={Vb} ouvert={false} coul={coulSol} indicateur={indEff ? indEff.nom : null} reperes={false} legendeCouleur={false} sonde={{ valeur: nbf(ph, 2) }}
          etiquetteBurette={<><strong>Burette : soude</strong><br/>C<sub>B</sub> = {nbf(P.Cb, 3)} mol·L⁻¹</>}
          etiquetteErlen={<><strong>Erlenmeyer</strong><br/>{nbf(P.V0, 1)} mL {dd && dd.type === 'conc' ? 'd’acide inconnu' : `d’${ac.nom}`}{indEff ? <> + {indEff.nom}</> : null}</>}/>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>V<sub>B</sub> versé : <strong>{nbf(Vb, 1)} mL</strong>. Le pH-mètre indique le pH de l’erlenmeyer.</div></>}
    </div>);

  // ---------- réglages ----------
  const peutDeriv = enDefi || mode === 'explore' || deja('derivee'), peutAcide = mode === 'explore' || (enGuide && deja('fort')), peutInd = (mode === 'explore') || (enGuide && deja('indic')) || (dd && dd.type === 'indic');
  const indsListe = dd ? (dd.options || []).map(IND) : (enGuide ? ['jm', 'bbt', 'bth', 'jar'].map(IND) : M.INDICATEURS);
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {peutAcide && !dd && <div role="group" aria-label="Acide titré" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Acide titré</span>
        {Object.entries(M.ACIDES).filter(([k]) => mode === 'explore' || k === 'hcl' || k === 'etha').map(([k, a]) => <button key={k} onClick={() => setT({ acide: k })} aria-pressed={ti.acide === k} style={stylePetitBouton(ti.acide === k, '#0f766e')}>{a.nom}</button>)}
      </div>}
      {mode === 'explore' && <>
        <Curseur nom="Concentration de l’acide C_A" valeur={ti.C0} onChange={v => setT({ C0: Math.round(v * 1000) / 1000 })} min={0.02} max={0.1} pas={0.005} unite="mol·L⁻¹" decimales={3} couleur="#475569"/>
        <Curseur nom="Prise d’essai V_A (pipette)" valeur={ti.V0} onChange={v => setT({ V0: v })} min={10} max={25} pas={5} unite="mL" decimales={1} couleur="#475569"/>
        <Curseur nom="Concentration de la soude C_B" valeur={ti.Cb} onChange={v => setT({ Cb: Math.round(v * 1000) / 1000 })} min={0.05} max={0.2} pas={0.01} unite="mol·L⁻¹" decimales={3} couleur="#475569"/>
        {VE > VMAX && <div role="alert" style={{ fontSize: 13, color: '#b91c1c', marginBottom: 6 }}>V_E ({nbf(VE, 1)} mL) dépasse la burette de {VMAX} mL : prélevez moins d’acide ou prenez une soude plus concentrée.</div>}
      </>}
      {enGuide && !deja('fort') && <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>20,0 mL d’acide éthanoïque (0,080 mol·L⁻¹) ; soude à 0,100 mol·L⁻¹.</div>}
      {dd && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>20,0 mL d’acide ; soude à 0,100 mol·L⁻¹.</div>}
      <Curseur nom="Volume de soude versé V_B" valeur={Vb} onChange={setV} min={0} max={VMAX} pas={0.1} unite="mL" decimales={1} couleur="#b45309"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {peutDeriv && (!enGuide || deja('derivee')) && <button onClick={() => setT({ deriv: !ti.deriv })} aria-pressed={ti.deriv} style={stylePetitBouton(ti.deriv, '#15803d')}>{ti.deriv ? 'Masquer la dérivée' : 'Afficher la dérivée'}</button>}
        {mode === 'explore' && !fort && <button onClick={() => setT({ cmp: !ti.cmp })} aria-pressed={ti.cmp} style={stylePetitBouton(ti.cmp, '#475569')}>Comparer avec l’acide fort</button>}
      </div>
      {peutInd && <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, display: 'block', marginBottom: 3 }} htmlFor="tph-ind">Indicateur coloré</label>
        <select id="tph-ind" value={(dd ? dd.ind : ti.ind) || ''} onChange={e => (dd ? setDefi(d => ({ ...d, ind: e.target.value || null, verifie: false })) : setT({ ind: e.target.value || null }))}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}>
          <option value="">aucun</option>
          {indsListe.map(i => <option key={i.id} value={i.id}>{i.nom} (zone de virage {nbf(i.zone[0], 1)} – {nbf(i.zone[1], 1)})</option>)}
        </select>
      </div>}
    </div>);

  // ---------- mesures ----------
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Volume versé V_B" valeur={`${nbf(Vb, 1)}${NB}mL`}/>
      {(apres('nhoh') || !enGuide) && <LigneMesure nom="n_B (HO⁻ versé)" valeur={`${nbf(nB, 2)}${NB}mmol`}/>}
      {(deja('courbe') || !enGuide) && <LigneMesure nom="pH lu" valeur={nbf(ph, 2)} couleur="#b45309"/>}
      {((enGuide && apres('derivee')) || mode === 'explore') && <LigneMesure nom="V_E (C_A V_A / C_B)" valeur={`${nbf(VE, 1)}${NB}mL`} couleur="#15803d"/>}
      {((enGuide && apres('phe')) || mode === 'explore') && <LigneMesure nom="pH à l’équivalence pH_E" valeur={nbf(phE, 2)} couleur="#15803d"/>}
      {mode === 'explore' && <>
        <LigneMesure nom="n_A initial (C_A V_A)" valeur={`${nbf(P.C0 * P.V0, 2)}${NB}mmol`}/>
        {!fort && <LigneMesure nom="pH à V_E / 2" valeur={nbf(M.pHa(P, VE / 2), 2)}/>}
        {!fort && <LigneMesure nom="pK_A du couple" valeur={nbf(pKa, 2)}/>}
        <LigneMesure nom="log K (réaction de titrage)" valeur={nbf(M.logKTitrage(P), 1)}/></>}
    </div>);

  // ---------- courbes, tableau, prédominance ----------
  const montrerVE = mode === 'explore' || (enGuide && apres('ca'));
  const graphiqueCourbe = (!enGuide || deja('courbe')) && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Courbe de titrage pH = f(V<sub>B</sub>)</div>
      <CourbePH pts={pts} ptsCmp={ptsCmp} Vb={Vb} ph={ph} VE={VE} montrerVE={montrerVE} deriv={ti.deriv && (peutDeriv)} ind={indEff}/>
      {mode === 'explore' && indEff && (() => {
        const v = M.virage(indEff, P), etat = (x, acide, base) => (x < indEff.zone[0] ? `${nomCouleur(acide)}` : x > indEff.zone[1] ? `${nomCouleur(base)}` : 'de teinte intermédiaire (dans la zone de virage)');
        return <div style={{ fontSize: 13, color: KIT.txt, marginTop: 6, lineHeight: 1.5 }}>Indicateur choisi : {indEff.nom}. Au début du titrage (pH = {nbf(M.pHa(P, 0), 2)}), la solution est <strong>{etat(M.pHa(P, 0), indEff.acide, indEff.base)}</strong> ; après l’équivalence (V<sub>B</sub> = {VMAX} mL, pH = {nbf(M.pHa(P, VMAX), 2)}), elle est <strong>{etat(M.pHa(P, VMAX), indEff.acide, indEff.base)}</strong>. Le virage {v.v1 == null || v.v2 == null ? 'a lieu hors de la plage 0 – 25 mL' : <>s’étend de {nbf(v.v1, 2)} à {nbf(v.v2, 2)} mL</>}, pour V<sub>E</sub> = {nbf(VE, 1)} mL : {M.convient(indEff, P) ? <strong style={{ color: '#15803d' }}>l’indicateur convient (sa zone contient pH<sub>E</sub> = {nbf(phE, 2)})</strong> : <strong style={{ color: '#b91c1c' }}>il ne convient pas (pH<sub>E</sub> = {nbf(phE, 2)} est hors de sa zone)</strong>}.</div>;
      })()}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Bleu : pH. Le point orange suit le curseur de volume.{ti.deriv ? ' Vert pointillé : dérivée dpH/dV_B (échelle libre).' : ''}</div>
    </div>);
  const graphiqueQuantites = (!enGuide || deja('equiv')) && !enDefi && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Composition du système (transformation totale)</div>
      <TableComposition p={P} Vb={Vb}/>
      <div style={{ marginTop: 8 }}><GrapheQuantites p={P} Vb={Vb} VE={VE} montrerVE={montrerVE}/></div>
    </div>);
  const predom = !fort && !enDefi && ((enGuide && deja('predom')) || mode === 'explore') && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Diagramme de prédominance du couple</div>
      <Predominance pKa={pKa} ph={ph} acide={FORM_ACIDE[P.acide]} base={ac.base}/>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Titrez l’acide chlorhydrique, puis un acide faible : comparez le pH initial, le pH à l’équivalence et la largeur du saut (bouton « Comparer avec l’acide fort »).</li>
        <li>Diminuez la concentration de l’acide de 0,10 à 0,02 mol·L⁻¹ : que deviennent V<sub>E</sub>, le saut de pH et pH<sub>E</sub> ?</li>
        <li>Pour trois acides faibles, lisez le pH à {avecIndices('frac(V_E|2)')} et comparez-le au p<em>K</em><sub>A</sub> du couple.</li>
        <li>Dans le tableau des indicateurs, trouvez ceux qui conviennent pour l’acide benzoïque, puis pour l’acide chlorhydrique. Vérifiez la couleur obtenue autour de V<sub>E</sub>.</li>
        <li>Mettez la soude à 0,05 mol·L⁻¹ avec 25 mL d’acide à 0,10 mol·L⁻¹ : que se passe-t-il pour V<sub>E</sub> ? Quelle solution ?</li>
      </ul>
    </div>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>réaction de titrage totale et rapide ; avant V<sub>E</sub>, HO⁻ est le réactif limitant</li>
        <li>à l’équivalence : n<sub>A</sub> = n<sub>B</sub>, soit C<sub>A</sub> V<sub>A</sub> = C<sub>B</sub> V<sub>E</sub> ; V<sub>E</sub> = maximum de dpH/dV<sub>B</sub></li>
        <li>pH<sub>E</sub> = 7,0 pour acide fort + base forte ; pH<sub>E</sub> &gt; 7 pour acide faible + base forte</li>
        <li>indicateur adapté : sa zone de virage contient pH<sub>E</sub></li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tph-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tph-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tph-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .tph-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr); margin-bottom: 12px; }
        .tph-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .tph-l1.cote .tph-carte { order: 2; } .tph-l1.cote .tph-main { order: 1; } }
        @media (max-width: 900px) { .tph-l1.cote, .tph-pri { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tph-in { animation: tph-fondu 0.35s ease-out; } @keyframes tph-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Titrage pH-métrique : équivalence, pH et choix de l’indicateur</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>titrage</strong> acide-base suivi au pH-mètre permet de trouver la concentration d’un acide : on repère l’<strong>équivalence</strong>, on prévoit le pH à ce moment et on choisit un indicateur coloré adapté.</div>
      <div className={`tph-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="tph-carte">
          <div role="group" aria-label="Choix du parcours" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
            <span style={{ color: KIT.txt2 }}>Parcours :</span>
            {NOMS_PARC.map((l, i) => <button key={i} onClick={() => setParc(i + 1)} aria-pressed={parc === i + 1} style={{ ...styleBouton(parc === i + 1, ORANGE_GUIDE), fontSize: 13 }}>{l}</button>)}
          </div>
          <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="tph-carte">{panneauHypo}</div> : null}
        <div className="tph-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'conc' ? suiviC : suiviI}/></div>}
          <div className={`tph-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(!enGuide || deja('verser')) && <div className="tph-in">{reglages}</div>}
              {(!enGuide || deja('nhoh')) && <div className="tph-in">{mesures}</div>}
            </div>
          </div>
          <div className="tph-l2">
            {graphiqueCourbe && <div className="tph-in">{graphiqueCourbe}</div>}
            {graphiqueQuantites && <div className="tph-in">{graphiqueQuantites}</div>}
          </div>
          {predom && <div className="tph-in" style={{ marginBottom: 12 }}>{predom}</div>}
        </div>
      </div>
      {mode === 'explore' && <div className="tph-l2"><TableIndicateurs p={P}/>{aEssayer}{retenirExplore}</div>}
      {!enDefi && (!enGuide || deja('bravo')) && <div className="tph-l2">{panneauHypo}</div>}
    </div>
  );
}
