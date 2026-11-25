import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./equilibreModele";
import { SvgNonTotale, SvgCritere, SvgQrFinal, SvgTaux } from "./equilibreSchemas";

const SIM_ID = 125, CLE_GUIDE = 'equilibre-tg-guide-v1';
declarerDefis(SIM_ID, [['sens', 'Quel est le sens d’évolution de chaque mélange ?'], ['k', 'Quelle est la constante d’équilibre K ?']]);

// ====================================================
//  SIM 125 — ÉQUILIBRE CHIMIQUE : QUOTIENT DE RÉACTION Qr, CONSTANTE K, SENS D'ÉVOLUTION SPONTANÉE, TAUX D'AVANCEMENT FINAL (TG spé PC,
//  thème « Constitution et transformations de la matière », partie « Prévoir l'état final d'un système, siège d'une transformation chimique »).
//  Une seule idée : un système évolue spontanément jusqu'à ce que Qr atteigne K (état d'équilibre). Support : réactions acide-base dans l'eau (espèces dissoutes),
//  K donnée (valeurs arrondies, cohérentes avec les pKa : voir equilibreModele.js, qui réutilise acidesBasesModele.js sans le modifier).
//  Capacités visées (jamais affichées à l'élève) : relier le caractère non total à la présence de tous les réactifs et produits ; déterminer le sens d'évolution (Qr, K) ;
//  déterminer un taux d'avancement final et le relier au caractère total ou non ; déterminer Qr à l'état final et montrer son indépendance vis-à-vis de la composition initiale.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtC = v => (v === 0 ? '0' : Math.abs(v) < 0.001 ? '< 0,001' : nbf(v, 3));
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const fmtQ = (q, d = 2) => {
  if (q === Infinity || Number.isNaN(q)) return '∞'; if (q === 0) return '0';
  if (q >= 1000 || q < 0.001) { const [m, e] = q.toExponential(1).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => SUP[c]).join('')}`; }
  return nbf(q, q < 1 ? d : 1);
};
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => [...t].sort(() => Math.random() - 0.5);
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const cadreSvg = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` };
const SY = M.SYSTEMES;
const KTXT = { ac: '0,10', oh: `1,7${NB}×${NB}10⁹` };
const S1 = { a: 0.10, b: 0.10, c: 0, d: 0 }, S2 = { a: 0.20, b: 0.10, c: 0.10, d: 0.05 }, S3 = { a: 0.05, b: 0.05, c: 0.10, d: 0.10 }, T1 = { a: 0.10, b: 0.10, c: 0, d: 0 };
const ESSAIS = [{ a: 0.20, b: 0.10, c: 0.02, d: 0.01 }, S2, S3];     // Qr initial : 0,01 ; 0,25 ; 4,0
const PRESET = { sys: 'ac', init: S2, p: 1, evStep: null, essai: 0, vus: [] };
const TYPES_EXPLORE = [['Que des réactifs', { a: 0.10, b: 0.10, c: 0, d: 0 }], ['Un réactif en excès', { a: 0.30, b: 0.10, c: 0, d: 0 }], ['Que des produits', { a: 0, b: 0, c: 0.20, d: 0.20 }], ['Un mélange quelconque', S2]];

// ---------- formules (MathML) ----------
const FQr = <Formule><msub><mi>Q</mi><mi mathvariant="normal">r</mi></msub><mo>=</mo><mfrac><mrow><mo>[</mo><mi>C</mi><mo>]</mo><mo>·</mo><mo>[</mo><mi>D</mi><mo>]</mo></mrow><mrow><mo>[</mo><mi>A</mi><mo>]</mo><mo>·</mo><mo>[</mo><mi>B</mi><mo>]</mo></mrow></mfrac></Formule>;
const Ftau = <Formule><mi>τ</mi><mo>=</mo><mfrac><msub><mi>x</mi><mi mathvariant="normal">f</mi></msub><msub><mi>x</mi><mi>max</mi></msub></mfrac></Formule>;

// ---------- équation de la réaction, toujours en tête ----------
const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
const EQ = {
  ac: <><Esp>CH<sub>3</sub>COOH(aq)</Esp> + <Esp>HCOO<sup>−</sup>(aq)</Esp> <Esp>⇌</Esp> <Esp>CH<sub>3</sub>COO<sup>−</sup>(aq)</Esp> + <Esp>HCOOH(aq)</Esp></>,
  oh: <><Esp>CH<sub>3</sub>COOH(aq)</Esp> + <Esp>HO<sup>−</sup>(aq)</Esp> <Esp>⇌</Esp> <Esp>CH<sub>3</sub>COO<sup>−</sup>(aq)</Esp> + <Esp>H<sub>2</sub>O(ℓ)</Esp></>,
};
function Equation({ sysId, montrerK, nom }) {
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      {nom && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>{nom}</div>}
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.6 }} aria-label="Équation de la réaction">{EQ[sysId]}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Dans 1,00{NB}L d’eau, à 25{NB}°C{montrerK ? <> · <strong style={{ color: COL.vert }}>K = {KTXT[sysId]}</strong></> : null}</div>
    </div>);
}

// ---------- barres de concentrations : départ (pointillés) et état actuel (plein) ----------
function Barres({ sysId, ini, cur, avance, smax, noms }) {
  const sys = SY[sysId], N = noms || sys.noms;
  const lignes = ['A', 'B', 'C', 'D'].filter(k => N[k]);
  const W = 300, x0 = 90, lg = 150, H = 14 + lignes.length * 34 + 22, X = v => x0 + lg * Math.min(v, smax) / smax;
  const col = { A: COL.bleu, B: COL.bleu, C: COL.vert, D: COL.vert };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={cadreSvg} role="img"
      aria-label={`Concentrations en mol par litre. ${lignes.map(k => `${N[k]} : ${nbf(cur[k.toLowerCase()], 3)}${avance ? `, au départ ${nbf(ini[k.toLowerCase()], 3)}` : ''}`).join(' ; ')}.`}>
      {lignes.map((k, i) => { const y = 10 + i * 34, v = cur[k.toLowerCase()], v0 = ini[k.toLowerCase()]; return (
        <g key={k}>
          <text x="4" y={y + 18} fontSize="15" fill="#0f172a">{N[k]}</text>
          <rect x={x0} y={y} width={lg} height="22" fill="#f8fafc" stroke="#e2e8f0"/>
          <rect x={x0} y={y + 3} width={Math.max(0, X(v) - x0)} height="16" fill={col[k]} opacity="0.92"/>
          {avance && <rect x={x0} y={y} width={Math.max(0, X(v0) - x0)} height="22" fill="none" stroke={COL.gris} strokeWidth="1.5" strokeDasharray="4 3"/>}
          <text x={x0 + lg + 6} y={y + 18} fontSize="15" fontWeight="700" fill="#0f172a">{fmtC(v)}</text>
        </g>); })}
      <text x={x0} y={H - 3} fontSize="14" fill={COL.gris}>mol/L{avance ? ' · pointillés : départ' : ''}</text>
    </svg>);
}

// ---------- règle graduée (logarithmique) : K et Qr ----------
function Regle({ sysId, qIni, qCur, avance, montrerNum }) {
  const sys = SY[sysId], logK = Math.log10(sys.K), oh = sysId === 'oh';
  const lo = -3, hi = oh ? 12 : 2, g = 30, d = 272, X = l => g + (d - g) * (Math.max(lo, Math.min(hi, l)) - lo) / (hi - lo);
  const ticks = oh ? [0, 3, 6, 9, 12] : [-3, -2, -1, 0, 1, 2];
  const lab = l => (oh ? (l === 0 ? '1' : `10${{ 3: '³', 6: '⁶', 9: '⁹', 12: '¹²' }[l]}`) : String(10 ** l).replace('.', ','));
  const lq = M.log10Q(qCur), li = M.log10Q(qIni);
  return (
    <svg viewBox="0 0 300 130" style={cadreSvg} role="img"
      aria-label={`Règle graduée en puissances de dix. K vaut ${KTXT[sysId]}. ${montrerNum ? `Qr vaut ${isFinite(qCur) ? nbf(qCur, 3) : 'zéro ou infini'}.` : 'Qr est repéré par le point orange.'}`}>
      <line x1={g} y1="70" x2={d} y2="70" stroke="#475569" strokeWidth="2"/>
      {ticks.map(l => <g key={l}><line x1={X(l)} y1="64" x2={X(l)} y2="76" stroke="#475569"/><text x={X(l)} y="98" fontSize="14" textAnchor="middle" fill="#334155">{lab(l)}</text></g>)}
      <line x1={X(logK)} y1="40" x2={X(logK)} y2="84" stroke={COL.vert} strokeWidth="3"/>
      <text x={X(logK)} y="32" fontSize="16" fontWeight="700" fill={COL.vert} textAnchor={logK > hi - 2 ? 'end' : 'middle'}>K</text>
      {avance && isFinite(li) && Math.abs(li - lq) > 0.02 && <circle cx={X(li)} cy="70" r="6" fill="white" stroke={COL.gris} strokeWidth="2" strokeDasharray="3 2"/>}
      <circle cx={X(lq)} cy="70" r="8" fill={COL.orange} stroke="#0f172a" strokeWidth="1.5"/>
      <text x={Math.max(40, Math.min(260, X(lq)))} y={Math.abs(lq - logK) < 0.7 ? 120 : 32} fontSize="16" fontWeight="700" fill={COL.orange} textAnchor="middle">Qr{montrerNum ? ` = ${fmtQ(qCur)}` : ''}</text>
    </svg>);
}

// ====================================================
export function SimulationEquilibre() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviS, noterS] = useCompteurDefi(), [suiviK, noterK] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('sens');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['obs', 'present', 'dyn', 'qr', 'sens', 'evol', 'kf', 'essais', 'tau', 'totale', 'sens2', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée ----------
  const scGuide = { obs: ['ac', S1], present: ['ac', S1], dyn: ['ac', S1], qr: ['ac', S2], sens: ['ac', S2], evol: ['ac', S2], kf: ['ac', S2], essais: ['ac', ESSAIS[ti.essai]],
    tau: ['ac', S1], totale: ['oh', T1], sens2: ['ac', S3], bilan: ['ac', S3] };
  const [sysId, ini] = enGuide ? scGuide[idE] : [ti.sys, ti.init];
  const sys = SY[sysId];
  const progGuide = { obs: ti.evStep === 'obs' ? 1 : 0, present: 1, dyn: 1, qr: 0, sens: 0, evol: ti.evStep === 'evol' ? 1 : 0, kf: 1, essais: 1, tau: 1, totale: 1, sens2: 0, bilan: 1 };
  const p = enGuide ? progGuide[idE] : ti.p;
  const xf = useMemo(() => M.avancementFinal(sys, ini), [sys, ini]);
  const cur = M.apresAvancement(sys, ini, p * xf), fin = M.apresAvancement(sys, ini, xf);
  const Qi = M.qr(sys, ini), Qc = M.qr(sys, cur), Qf = M.qr(sys, fin);
  const avance = p > 0 && Math.abs(xf) > 1e-12;
  const sensIni = M.sens(sys, ini);
  const sansProduit = ini.c === 0 && (sys.solvant || ini.d === 0), xM = M.xmax(ini);
  const tau = sansProduit && xM > 0 ? xf / xM : null;
  const smax = enGuide ? 0.25 : Math.max(0.2, Math.ceil(10 * Math.max(...['a', 'b', 'c', 'd'].map(k => Math.max(ini[k], fin[k])))) / 10);

  const bloqueEssais = ti.vus.length >= 3 ? null : 'Choisissez d’abord les trois mélanges (boutons sous les barres) pour compléter le tableau.';
  const choixEssai = i => { setT({ essai: i, vus: ti.vus.includes(i) ? ti.vus : [...ti.vus, i] }); };

  const ETAPES = [
    { id: 'obs', titre: 'Un mélange et sa transformation', focus: ['scene'],
      texte: <>On mélange <strong>0,10{NB}mol d’acide éthanoïque</strong> (CH<sub>3</sub>COOH) et <strong>0,10{NB}mol d’ions méthanoate</strong> (HCOO<sup>−</sup>) dans 1,00{NB}L d’eau. L’équation de la réaction est écrite en haut ; les barres donnent les concentrations en mol/L. Cliquez sur « Laisser évoluer » : la transformation se déroule jusqu’à l’état final.</>,
      tache: { type: 'action', ok: ti.evStep === 'obs', label: 'Laisser évoluer', faire: () => setT({ evStep: 'obs' }), consigne: 'Cliquez sur « Laisser évoluer »' } },
    { id: 'present', titre: 'L’état final', focus: ['scene'],
      texte: <>Dans l’état final, les concentrations ne varient plus. Les barres pleines montrent la composition obtenue, les pointillés rappellent le départ.</>,
      tache: { type: 'qcm', q: 'Que constate-t-on dans l’état final ?', options: ['les 4 espèces sont toutes présentes : elle est non totale', 'un réactif a disparu : la transformation est totale', 'seuls les produits restent : les réactifs ont tous disparu', 'rien n’a changé : mêmes concentrations qu’au départ'], bonne: 0,
        expl: 'Dans l’état final on trouve les deux réactifs (0,076 mol/L chacun) et les deux produits (0,024 mol/L chacun) : aucun réactif n’a disparu. C’est ce qui caractérise une transformation non totale.', indice: 'Comptez les barres qui ne sont pas vides dans l’état final.' } },
    { id: 'dyn', titre: 'Un équilibre qui reste actif', focus: ['scene'],
      texte: <>Les concentrations ne varient plus, mais le système n’est pas « arrêté » : à l’échelle microscopique, deux réactions opposées se produisent en permanence, la réaction dans le <strong>sens direct</strong> (A + B → C + D) et la réaction dans le <strong>sens inverse</strong> (C + D → A + B).</>,
      tache: { type: 'qcm', q: 'Pourquoi les concentrations ne varient-elles plus dans l’état final ?', options: ['les deux réactions opposées ont exactement la même vitesse', 'les deux réactions sont arrêtées : plus rien ne réagit', 'la réaction directe est finie, seule l’inverse continue', 'les réactifs sont trop dilués : ils ne se rencontrent plus'], bonne: 0,
        expl: 'À l’état final, la quantité de A qui disparaît par la réaction directe est exactement compensée par celle qui réapparaît par la réaction inverse : les vitesses sont égales, les concentrations constantes. C’est un équilibre dynamique.', indice: 'Les concentrations sont constantes, mais les molécules continuent de réagir dans les deux sens.' } },
    { id: 'qr', titre: 'Le quotient de réaction Qr', focus: ['scene'],
      texte: <>Autre mélange (1,00{NB}L) : [CH<sub>3</sub>COOH] = 0,20{NB}mol/L ; [HCOO<sup>−</sup>] = 0,10{NB}mol/L ; [CH<sub>3</sub>COO<sup>−</sup>] = 0,10{NB}mol/L ; [HCOOH] = 0,050{NB}mol/L. Pour une réaction A + B ⇌ C + D en solution, le <strong>quotient de réaction</strong> s’écrit {FQr}où [X] est la concentration de X en mol/L divisée par c° = 1{NB}mol/L : <em>Q</em><sub>r</sub> n’a pas d’unité. Le solvant n’intervient pas.</>,
      tache: { type: 'num', q: 'Quotient de réaction Qr du mélange de départ', unite: '(sans unité)', vrai: 0.25, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Qr = frac([CH₃COO⁻] × [HCOOH]|[CH₃COOH] × [HCOO⁻]).', 'Qr = frac(0,10 × 0,050|0,20 × 0,10) = frac(0,0050|0,020) = 0,25 (sans unité).'],
        pieges: [[4.0, 'Le rapport est inversé : les produits (C et D) sont au numérateur, les réactifs (A et B) au dénominateur.'], [0.50, 'On multiplie les concentrations de deux espèces, on ne les additionne pas.'], [0.0050, 'Il manque le dénominateur : Qr est un rapport, produits sur réactifs.']],
        expl: 'Qr = frac(0,10 × 0,050|0,20 × 0,10) = 0,25.', indice: 'Numérateur : produit des concentrations des deux produits. Dénominateur : produit des concentrations des deux réactifs.' },
      retenirTitre: 'À RETENIR : UNE TRANSFORMATION NON TOTALE',
      retenir: <>
        <SvgNonTotale/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Non totale</strong> : à l’état final, <strong>tous les réactifs et tous les produits</strong> sont présents ; l’avancement final est inférieur à l’avancement maximal.</li>
          <li>Exemple de la simulation : 0,10 mol/L de chaque réactif au départ, il en reste 0,076 mol/L à l’état final.</li>
          <li>Moyen de s’en souvenir : <strong>« concentrations constantes ≠ réactions arrêtées »</strong> : deux réactions opposées, de même vitesse (équilibre dynamique).</li>
        </ul></> },
    { id: 'sens', titre: 'Dans quel sens évolue le système ?', focus: ['regle'],
      texte: <>Chaque réaction possède une <strong>constante d’équilibre K</strong>, qui ne dépend que de la température. Pour cette réaction à 25{NB}°C : <strong>K = 0,10</strong>. Sur la règle graduée, K est le trait vert et <em>Q</em><sub>r</sub> du mélange (0,25) le point orange.</>,
      tache: { type: 'qcm', q: 'Comment ce système évolue-t-il spontanément ?', options: ['sens inverse, car Qr est supérieur à K', 'dans le sens direct, car Qr est supérieur à K', 'dans le sens direct, car il y a des réactifs', 'il n’évolue pas : Qr n’est pas nul'], bonne: 0,
        expl: 'Qr = 0,25 est supérieur à K = 0,10 : le système évolue dans le sens inverse (C + D → A + B), ce qui fait diminuer Qr jusqu’à K.', indice: 'Comparez les deux nombres : Qr = 0,25 et K = 0,10. Le système évolue de façon que Qr se rapproche de K.' } },
    { id: 'evol', titre: 'Qr rejoint K', focus: ['scene', 'regle'],
      texte: <>Cliquez sur « Laisser évoluer » et regardez les barres : les concentrations des produits diminuent-elles ou augmentent-elles ? Le point orange (<em>Q</em><sub>r</sub>) se déplace sur la règle.</>,
      tache: { type: 'action', ok: ti.evStep === 'evol', label: 'Laisser évoluer', faire: () => setT({ evStep: 'evol' }), consigne: 'Cliquez sur « Laisser évoluer »' },
      retenirTitre: 'À RETENIR : QR CONTRE K DONNE LE SENS',
      retenir: <>
        <SvgCritere/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Qr &lt; K : sens direct. Qr &gt; K : sens inverse. Qr = K : équilibre</strong> (aucune évolution).</li>
          <li>Exemple de la simulation : Qr = 0,25 et K = 0,10, donc sens inverse.</li>
          <li>Moyen de s’en souvenir : <strong>« Qr cherche à rejoindre K »</strong>. Piège : la présence de réactifs ne décide pas du sens.</li>
        </ul></> },
    { id: 'kf', titre: 'Qr dans l’état final', focus: ['mesures'],
      texte: <>Dans l’état final (équilibre), les concentrations sont celles du panneau « Mesures » : [CH<sub>3</sub>COOH] = 0,218{NB}mol/L ; [HCOO<sup>−</sup>] = 0,118{NB}mol/L ; [CH<sub>3</sub>COO<sup>−</sup>] = 0,082{NB}mol/L ; [HCOOH] = 0,032{NB}mol/L.</>,
      tache: { type: 'num', q: 'Quotient de réaction Qr dans l’état final', unite: '(sans unité)', vrai: 0.102, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['Qr = frac([CH₃COO⁻] × [HCOOH]|[CH₃COOH] × [HCOO⁻]).', 'Qr = frac(0,082 × 0,032|0,218 × 0,118) = frac(0,002624|0,025724) = 0,10 : on retrouve K (à l’arrondi des concentrations près).'],
        pieges: [[9.8, 'Le rapport est inversé : produits au numérateur, réactifs au dénominateur.'], [0.25, 'Cette valeur est le Qr du mélange de départ ; il faut utiliser les concentrations de l’état final.'], [0.56, 'On multiplie les concentrations de deux espèces (produits au numérateur, réactifs au dénominateur), on ne les additionne pas.']],
        expl: 'Qr = frac(0,082 × 0,032|0,218 × 0,118) ≈ 0,10 = K : dans l’état final, Qr est égal à K.', indice: 'Même formule qu’avant, avec les concentrations de l’état final : produits au numérateur, réactifs au dénominateur.' } },
    { id: 'essais', titre: 'Trois mélanges de départ différents', focus: ['scene', 'tableau'],
      texte: <>Choisissez successivement les <strong>mélanges 1, 2 et 3</strong> (boutons sous les barres). Ils ont des compositions de départ différentes. Le tableau note <em>Q</em><sub>r</sub> au départ et <em>Q</em><sub>r</sub> à l’état final.</>,
      tache: { type: 'qcm', q: 'Que constate-t-on pour Qr à l’état final ?', options: ['le même pour les trois mélanges : il vaut K', 'il dépend du mélange de départ', 'il est égal à Qr de départ pour chaque mélange', 'il vaut 1 dans tous les cas'], bonne: 0, bloque: bloqueEssais,
        expl: 'Les Qr de départ sont très différents (0,01 ; 0,25 ; 4,0), mais le système évolue chaque fois jusqu’à Qr = K = 0,10. À température donnée, Qr à l’état final ne dépend pas de la composition initiale.', indice: 'Comparez les valeurs de la dernière colonne du tableau, avec K = 0,10.' } },
    { id: 'tau', titre: 'Le taux d’avancement final', focus: ['scene', 'mesures'],
      texte: <>Retour au premier mélange : 0,10{NB}mol de CH<sub>3</sub>COOH et 0,10{NB}mol de HCOO<sup>−</sup> dans 1,00{NB}L. Si la transformation était totale, un réactif disparaîtrait : l’avancement serait <em>x</em><sub>max</sub> = 0,10{NB}mol. Dans l’état final, [CH<sub>3</sub>COO<sup>−</sup>] = 0,024{NB}mol/L, donc l’avancement final est <em>x</em><sub>f</sub> = 0,024{NB}mol. Le <strong>taux d’avancement final</strong> est {Ftau}</>,
      tache: { type: 'num', q: 'Taux d’avancement final τ', unite: '(sans unité)', vrai: 0.24, tol: 0.04, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['xf = [CH₃COO⁻] × V = 0,024 mol/L × 1,00 L = 0,024 mol ; xmax = 0,10 mol.', 'τ = frac(x_f|x_max) = frac(0,024|0,10) = 0,24 (soit 24 %) : τ est inférieur à 1, la transformation est non totale.'],
        pieges: [[4.17, 'Le rapport est inversé : τ = frac(x_f|x_max), et xf est plus petit que xmax.'], [0.76, 'Cette valeur est la part de réactif restante (frac(0,076|0,10)), pas ce qui a réagi.'], [24, 'τ est un nombre sans unité : 24 % s’écrit 0,24.']],
        expl: 'τ = frac(0,024|0,10) = 0,24 : seul un quart environ de l’avancement maximal est atteint.', indice: 'τ = avancement final divisé par avancement maximal, tous deux en mol.' },
      retenirTitre: 'À RETENIR : À L’ÉQUILIBRE, QR = K',
      retenir: <>
        <SvgQrFinal/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Dans l’état final, Qr = K(T)</strong>, quelle que soit la composition initiale (à température donnée). K ne dépend que de la réaction et de T.</li>
          <li>Exemple de la simulation : Qr de départ = 0,01, 0,25 ou 4,0 ; Qr final = 0,10 = K.</li>
          <li>Moyen de s’en souvenir : <strong>« on part de n’importe où, on arrive à K »</strong>.</li>
        </ul></> },
    { id: 'totale', titre: 'Une transformation totale', focus: ['scene', 'mesures'],
      texte: <>Même départ (0,10{NB}mol/L de CH<sub>3</sub>COOH) mais avec <strong>0,10{NB}mol/L d’ions hydroxyde HO<sup>−</sup></strong> à la place de HCOO<sup>−</sup>. Cette réaction a une constante d’équilibre très grande : <em>K</em> = 1,7 × 10⁹ à 25{NB}°C. Regardez la composition de l’état final.</>,
      tache: { type: 'qcm', q: 'Que dire de cette transformation ?', options: ['un réactif a disparu : la transformation est totale', 'les deux réactifs sont encore là : elle est non totale', 'τ vaut 0,24 comme avant : elle est non totale', 'K est très grand : la réaction est impossible'], bonne: 0,
        expl: 'Il ne reste que des traces des réactifs (moins de 0,001 mol/L, sous la précision d’affichage) : l’avancement final est égal à l’avancement maximal, donc τ = 1. La transformation est totale.', indice: 'Regardez dans les Mesures les concentrations finales des réactifs, puis comparez l’avancement final à l’avancement maximal.' } },
    { id: 'sens2', titre: 'Prévoir avant de laisser évoluer', focus: ['scene'],
      texte: <>Retour à la première réaction (K = 0,10). Nouveau mélange : [CH<sub>3</sub>COOH] = 0,050{NB}mol/L ; [HCOO<sup>−</sup>] = 0,050{NB}mol/L ; [CH<sub>3</sub>COO<sup>−</sup>] = 0,10{NB}mol/L ; [HCOOH] = 0,10{NB}mol/L.</>,
      tache: { type: 'qcm', q: 'Dans quel sens ce système évolue-t-il spontanément ?', options: ['sens inverse, car Qr = 4,0 est supérieur à K', 'sens direct, car Qr = 4,0 est supérieur à K', 'sens direct, car il y a plus de produits que de réactifs', 'pas d’évolution, car les 4 espèces sont présentes'], bonne: 0,
        expl: 'Qr = frac(0,10 × 0,10|0,050 × 0,050) = 4,0, supérieur à K = 0,10 : le système évolue dans le sens inverse, Qr diminue jusqu’à K.', indice: 'Calculez Qr = frac([C] × [D]|[A] × [B]) avec les quatre concentrations, puis comparez à K = 0,10.' },
      retenirTitre: 'À RETENIR : TAUX D’AVANCEMENT ET TRANSFORMATION TOTALE',
      retenir: <>
        <SvgTaux/>
        {Ftau}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>τ = {avecIndices('frac(x_f|x_max)')}</strong>, sans unité, compris entre 0 et 1. <strong>τ = 1 : totale</strong> (le réactif limitant disparaît) ; <strong>τ &lt; 1 : non totale</strong> (tous les constituants présents).</li>
          <li>Exemple de la simulation : τ = {avecIndices('frac(0,024|0,10)')} = 0,24 pour K = 0,10 ; τ ≈ 1 pour K = 1,7 × 10⁹.</li>
          <li>Moyen de s’en souvenir : <strong>« τ, c’est la part de l’avancement maximal réellement atteinte »</strong>.</li>
        </ul></> },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez relier le caractère non total d’une transformation à la présence de tous les constituants à l’état final, prévoir le sens d’évolution en comparant <em>Q</em><sub>r</sub> à <em>K</em>, déterminer <em>Q</em><sub>r</sub> à l’état final et un taux d’avancement final. Passez à l’exploration (vos propres mélanges) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const QSENS = (m) => M.qr(SY.ac, m);
  const EQUILIBRES = useMemo(() => { const v = [0.01, 0.02, 0.04, 0.05, 0.10, 0.20, 0.25, 0.40], r = [];
    v.forEach(a => v.forEach(b => v.forEach(c => v.forEach(d => { if (Math.abs(c * d / (a * b) - 0.10) < 1e-9) r.push({ a, b, c, d }); })))); return r; }, []);
  const donneesDefi = type => {
    if (type === 'k') { const x = tire([0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08]); return { type, x, vrai: (x / (0.10 - x)) ** 2 }; }
    const valeurs = [0.02, 0.05, 0.10, 0.20, 0.40], voulus = melange(['direct', 'inverse', tire(['direct', 'inverse', 'equilibre'])]);
    const mix = voulus.map(v => {
      if (v === 'equilibre') return tire(EQUILIBRES);
      for (let i = 0; i < 500; i++) {
        const m = { a: tire(valeurs), b: tire(valeurs), c: tire(valeurs), d: tire(valeurs) }, Q = QSENS(m);
        if ((v === 'direct' && Q < 0.05) || (v === 'inverse' && Q > 0.20)) return m;
      }
      return v === 'direct' ? { a: 0.40, b: 0.20, c: 0.02, d: 0.05 } : { a: 0.05, b: 0.02, c: 0.40, d: 0.20 };
    });
    return { type, mix, vrais: mix.map(m => M.sens(SY.ac, m)) };
  };
  const nouveauDefi = type => { setDefi({ ...donneesDefi(type), type, reps: {}, verifie: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s, evStep: null }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const NOMS_SENS = { direct: 'sens direct', inverse: 'sens inverse', equilibre: 'équilibre' };
  const verifier = () => {
    if (defi.type === 'sens') { const ok = defi.vrais.every((v, i) => defi.reps[i] === v); setDefi(d => ({ ...d, verifie: true, ok })); noterS(ok); }
    else { const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, 0.06); setDefi(d => ({ ...d, verifie: true, ok })); noterK(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const noms = SY.ac.noms;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['sens', 'Sens d’évolution de trois mélanges'], ['k', 'Constante d’équilibre inconnue']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'sens' ? 'Défi : dans quel sens évolue chaque mélange ?' : 'Défi : quelle est la constante d’équilibre ?'}</div>
      {defi.type === 'sens' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Trois mélanges de 1,00{NB}L sont préparés pour la réaction <strong>{EQ.ac}</strong>, de constante <strong>K = 0,10</strong> à 25{NB}°C. Concentrations de départ en mol/L. Pour chaque mélange, choisissez le sens d’évolution spontanée.</div>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse', marginBottom: 8, tableLayout: 'fixed' }}>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 2px', width: 26 }}>N°</th>{['A', 'B', 'C', 'D'].map(k => <th key={k} style={{ padding: '2px 2px' }}>{noms[k]}</th>)}</tr></thead>
          <tbody>{defi.mix.map((m, i) => <tr key={i} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 700 }}>{i + 1}</td>{['a', 'b', 'c', 'd'].map(k => <td key={k} style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(m[k], 2)}</td>)}</tr>)}</tbody>
        </table></div>
        {defi.mix.map((m, i) => (
          <div key={i} role="group" aria-label={`Sens d’évolution du mélange ${i + 1}`} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, minWidth: 66 }}>Mélange {i + 1}</span>
            {Object.entries(NOMS_SENS).map(([k, l]) => <button key={k} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, [i]: k }, verifie: false }))} aria-pressed={defi.reps[i] === k}
              style={stylePetitBouton(defi.reps[i] === k, defi.verifie ? (defi.vrais[i] === k ? '#15803d' : '#dc2626') : '#475569')}>{l}</button>)}
          </div>))}
        <IndiceDefi cache={false}>Pour chaque mélange, calculez <em>Q</em><sub>r</sub> = [CH<sub>3</sub>COO<sup>−</sup>]·{avecIndices('frac([HCOOH]|[CH_3COOH]·[HCOO^−])')} puis comparez à K = 0,10 : <em>Q</em><sub>r</sub> &lt; K sens direct ; <em>Q</em><sub>r</sub> &gt; K sens inverse ; <em>Q</em><sub>r</sub> = K équilibre.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On mélange un acide AH et une base B<sup>−</sup> (couples inconnus), <strong>0,10{NB}mol/L de chacun</strong> dans 1,00{NB}L, à température constante. La réaction s’écrit AH + B<sup>−</sup> ⇌ A<sup>−</sup> + BH. À l’état final, on mesure <strong>[A<sup>−</sup>] = {nbf(defi.x, 2)}{NB}mol/L</strong> (et [BH] = [A<sup>−</sup>]). Déterminez la constante d’équilibre K de cette réaction (2{NB}chiffres significatifs ; marge acceptée : ± 6{NB}%).</div>
        <div style={{ marginBottom: 8 }}><Barres sysId="ac" ini={{ a: 0.10, b: 0.10, c: 0, d: 0 }} cur={{ a: 0.10 - defi.x, b: 0.10 - defi.x, c: defi.x, d: defi.x }} avance smax={0.2} noms={{ A: 'AH', B: 'B⁻', C: 'A⁻', D: 'BH' }}/></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Constante K =</span>
          <input value={defi.reps.v ?? ''} aria-label="Constante d’équilibre K" onKeyDown={e => e.key === 'Enter' && document.getElementById('eq-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>(sans unité)</span>
        </div>
        <IndiceDefi cache={false}>À l’état final, <em>Q</em><sub>r</sub> = K. Ici <em>Q</em><sub>r</sub> = [A<sup>−</sup>]·{avecIndices('frac([BH]|[AH]·[B^−])')}, avec [A<sup>−</sup>] = [BH] = {nbf(defi.x, 2)}{NB}mol/L et [AH] = [B<sup>−</sup>] = 0,10 − {nbf(defi.x, 2)}{NB}mol/L.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="eq-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'sens'
          ? (defi.ok ? '✓ Correct : les trois sens sont justes.' : '✗ Au moins un sens est faux.') + ' ' + defi.mix.map((m, i) => `Mélange ${i + 1} : Qr = ${nbf(QSENS(m), QSENS(m) < 1 ? 3 : 1)}, ${NOMS_SENS[defi.vrais[i]]}.`).join(' ')
          : defi.ok ? `✓ Correct. K = ${nbf(defi.vrai, defi.vrai < 1 ? 3 : 1)} (marge acceptée : ± 6 %).` : '✗ Vérifiez : K = Qr à l’état final = [A⁻]·[BH] / ([AH]·[B⁻]), avec [AH] = [B⁻] = 0,10 − [A⁻].'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante</strong> (25 °C) : la constante d’équilibre K dépend de la réaction et de la température, pas de la composition. Si T change, K change : la simulation ne fait pas varier T.</li>
      <li><strong>Espèces concernées</strong> : uniquement des espèces dissoutes dans l’eau (et le solvant). Réaction 1 : acide éthanoïque CH<sub>3</sub>COOH et ion méthanoate HCOO<sup>−</sup> ; réaction 2 : acide éthanoïque et ion hydroxyde HO<sup>−</sup>. Les ions spectateurs (Na<sup>+</sup>…) n’interviennent pas. Aucune espèce solide ni gazeuse : pas de pression partielle.</li>
      <li><strong>Activités ≈ concentrations</strong> : solutions diluées (concentrations de 0,40 mol/L au plus), on remplace l’activité de chaque espèce par {avecIndices('frac([X]|c°)')} avec c° = 1 mol/L ; Qr et K n’ont pas d’unité. Le solvant (l’eau) n’apparaît pas dans Qr.</li>
      <li><strong>Valeurs de K</strong> : K = 0,10 (réaction 1) et K = 1,7 × 10⁹ (réaction 2) sont des valeurs arrondies, déduites de constantes d’acidité usuelles à 25 °C (K = 10<sup>pKa(base) − pKa(acide)</sup>) ; ce sont des données, pas des résultats à retrouver.</li>
      <li><strong>Volume constant</strong> : 1,00 L, donc l’avancement en mol s’exprime avec le même nombre qu’en mol/L ; l’ajout de solutés ne change pas le volume.</li>
      <li><strong>État final = état d’équilibre</strong> : le simulateur calcule l’état où Qr = K (équation du second degré résolue numériquement). Il ne dit rien de la durée pour l’atteindre (cinétique).</li>
      <li><strong>Transformation totale</strong> : avec K = 1,7 × 10⁹, il reste quelques 10⁻⁶ mol/L de réactif, sous la précision d’affichage : on considère le réactif limitant comme disparu (τ = 1). C’est une convention de précision, pas une disparition absolue.</li>
      <li><strong>Taux d’avancement final</strong> : défini ici seulement pour un mélange de départ sans produit, τ = {avecIndices('frac(x_f|x_max)')}, où x<sub>max</sub> correspond à la disparition du réactif limitant.</li>
      <li><strong>Limites</strong> : pas de calcul de pH ni de réaction concurrente (autoprotolyse de l’eau, autres équilibres) ; interactions entre ions négligées ; la « règle » de Qr est en échelle logarithmique pour lire des valeurs très différentes.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène : équation, barres, choix des mélanges ----------
  const montrerK = enExplore || (enGuide && deja('sens'));
  const montrerRegle = enExplore || (enGuide && deja('sens'));
  const regleNum = enExplore || (enGuide && apres('kf'));
  const choixEssais = enGuide && idE === 'essais' && (
    <div role="group" aria-label="Mélange de départ" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Mélange de départ</span>
      {[0, 1, 2].map(i => <button key={i} onClick={() => choixEssai(i)} aria-pressed={ti.essai === i} style={stylePetitBouton(ti.essai === i, '#475569')}>Mélange {i + 1}{ti.vus.includes(i) ? ' ✓' : ''}</button>)}
    </div>);
  const barresBox = !dd && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Concentrations des espèces</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Barres pleines : concentrations à l’avancement choisi ; pointillés : composition de départ.</div>}
      <Barres sysId={sysId} ini={ini} cur={cur} avance={avance} smax={smax}/>
      {choixEssais}
    </div>);
  const regleBox = !dd && montrerRegle && (
    <div style={{ ...styleBoite, ...cadre('regle') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Qr et K sur une règle graduée</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le trait vert marque K. Le point orange marque Qr à l’avancement choisi : il se déplace vers K quand le système évolue. L’échelle est logarithmique (chaque graduation multiplie par 10).</div>}
      <Regle sysId={sysId} qIni={Qi} qCur={Qc} avance={avance} montrerNum={regleNum}/>
    </div>);
  const tableEssais = enGuide && idE === 'essais' && ti.vus.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('tableau') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Qr au départ et à l’état final</div>
      <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Mélange</th><th style={{ padding: '2px 4px' }}>Qr au départ</th><th style={{ padding: '2px 4px' }}>Qr final</th></tr></thead>
        <tbody>{[...ti.vus].sort().map(i => <tr key={i} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px' }}>{i + 1}</td>
          <td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(M.qr(SY.ac, ESSAIS[i]), M.qr(SY.ac, ESSAIS[i]) < 0.1 ? 2 : 2)}</td>
          <td style={{ padding: '3px 4px', fontFamily: 'monospace', fontWeight: 700 }}>{nbf(M.qr(SY.ac, M.etatFinal(SY.ac, ESSAIS[i])), 2)}</td></tr>)}</tbody>
      </table>
    </div>);

  // ---------- mesures ----------
  const lignesEsp = ['A', 'B', 'C', 'D'].filter(k => sys.noms[k]);
  const montrerMesures = enExplore || (enGuide && deja('kf'));
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <LigneMesure nom="Qr au départ" valeur={Number.isNaN(Qi) ? 'indéfini (il manque un réactif)' : Qi === Infinity ? 'infini (aucun réactif)' : fmtQ(Qi, 3)} couleur={COL.orange}/>}
      {enExplore && <LigneMesure nom="K" valeur={KTXT[sysId]} couleur={COL.vert}/>}
      {enExplore && <LigneMesure nom="Sens d’évolution" valeur={sensIni === 'direct' ? 'sens direct (Qr < K)' : sensIni === 'inverse' ? 'sens inverse (Qr > K)' : 'aucune évolution (Qr = K)'}/>}
      {lignesEsp.map(k => <LigneMesure key={k} nom={`[${sys.noms[k]}] ${enExplore ? 'à l’avancement choisi' : 'état final'}`} valeur={`${fmtC((enExplore ? cur : fin)[k.toLowerCase()])}${NB}mol/L`}/>)}
      {(enExplore || (enGuide && apres('kf'))) && <LigneMesure nom={enExplore ? 'Qr à l’avancement choisi' : 'Qr état final'} valeur={fmtQ(enExplore ? Qc : Qf, 3)} couleur={COL.orange}/>}
      {enExplore && <LigneMesure nom="Avancement final xf" valeur={`${nbf(xf, 3)}${NB}mol`}/>}
      {enExplore && <LigneMesure nom="Taux d’avancement final τ" valeur={tau === null ? '— (départ avec produits)' : nbf(tau, tau > 0.999 ? 4 : 2)} couleur={COL.vert}/>}
    </div>);

  // ---------- exploration ----------
  const nomSys = { ac: 'Réaction 1 : acide éthanoïque + ion méthanoate (K = 0,10)', oh: `Réaction 2 : acide éthanoïque + ion hydroxyde (K = 1,7${NB}×${NB}10⁹)` };
  const reglages = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages de l’expérience</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>1. Choisissez la réaction (chacune a sa constante K).</div>
      <div role="group" aria-label="Réaction étudiée" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {['ac', 'oh'].map(k => <button key={k} onClick={() => setT({ sys: k })} aria-pressed={ti.sys === k} style={stylePetitBouton(ti.sys === k, '#0f766e')}>{nomSys[k]}</button>)}
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>2. Choisissez la composition de départ : un mélange type, ou vos propres concentrations avec les curseurs.</div>
      <div role="group" aria-label="Mélanges types" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {TYPES_EXPLORE.map(([l, c]) => <button key={l} onClick={() => setT({ init: c })} style={stylePetitBouton(false, '#475569')}>{l}</button>)}
      </div>
      {lignesEsp.map(k => <Curseur key={k} nom={`Concentration de départ de ${sys.noms[k]}`} valeur={ti.init[k.toLowerCase()]} onChange={v => setT({ init: { ...ti.init, [k.toLowerCase()]: Math.round(v * 100) / 100 } })} min={0} max={0.40} pas={0.05} unite="mol/L" decimales={2} couleur="#0f766e"/>)}
      <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0', lineHeight: 1.5 }}>3. Faites évoluer le système : à gauche l’état de départ, à droite l’état final (équilibre).</div>
      <Curseur nom="Avancement de l’évolution" valeur={Math.round(ti.p * 100)} onChange={v => setT({ p: v / 100 })} min={0} max={100} pas={5} unite="%" decimales={0} couleur="#b45309"/>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Réaction 1, « Que des réactifs » puis « Que des produits » : vers quoi évolue Qr dans chaque cas ? Que vaut Qr à l’état final ?</li>
        <li>Changez les concentrations de départ de plusieurs façons : Qr final change-t-il ? Et le taux d’avancement τ ?</li>
        <li>Réaction 1, « Un réactif en excès » : comparez τ avec celui de « Que des réactifs ». Pourquoi τ change-t-il alors que K reste le même ?</li>
        <li>Passez à la réaction 2 : que deviennent les réactifs à l’état final ? Que vaut τ ? Que dire de la transformation ?</li>
        <li>Cherchez un mélange de départ qui est déjà à l’équilibre (aucune évolution) pour la réaction 1.</li>
      </ul>
    </div>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Non totale : tous les réactifs et tous les produits présents à l’état final ; équilibre dynamique (deux réactions opposées de même vitesse)</li>
        <li>Quotient de réaction : Qr = [C]·{avecIndices('frac([D]|[A]·[B])')} (sans unité, solvant absent)</li>
        <li>Qr &lt; K : sens direct ; Qr &gt; K : sens inverse ; Qr = K : équilibre</li>
        <li>État final : Qr = K(T), indépendant de la composition initiale (à T donnée)</li>
        <li>Taux d’avancement final : τ = {avecIndices('frac(x_f|x_max)')} ; τ = 1 totale, τ &lt; 1 non totale</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .eq-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .eq-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .eq-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .eq-col { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 901px) { .eq-l1.cote .eq-carte { order: 2; } .eq-l1.cote .eq-main { order: 1; } }
        @media (max-width: 900px) { .eq-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .eq-in { animation: eq-fondu 0.35s ease-out; } @keyframes eq-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Équilibre chimique : Qr, K et taux d’avancement final</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un système évolue spontanément jusqu’à ce que son <strong>quotient de réaction Qr</strong> atteigne la <strong>constante d’équilibre K</strong> : on en tire le <strong>sens d’évolution</strong> et le <strong>taux d’avancement final</strong>.</div>
      <div className={`eq-l1${!enExplore ? ' cote' : ''}`}>
        {enGuide ? <div className="eq-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="eq-carte">{panneauHypo}</div> : null}
        <div className="eq-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'sens' ? suiviS : suiviK}/></div>}
          {!dd && <div className="eq-col">
            <Equation sysId={sysId} montrerK={montrerK} nom={enExplore ? nomSys[sysId] : null}/>
            {enExplore && reglages}
            <div className="eq-in">{barresBox}</div>
            {regleBox && <div className="eq-in">{regleBox}</div>}
            {tableEssais && <div className="eq-in">{tableEssais}</div>}
            {mesures && <div className="eq-in">{mesures}</div>}
          </div>}
        </div>
      </div>
      {enExplore && <div className="eq-l2">{aEssayer}{retenirExplore}</div>}
      {!enDefi && (!enGuide || deja('bilan')) && <div className="eq-l2">{panneauHypo}</div>}
    </div>
  );
}
