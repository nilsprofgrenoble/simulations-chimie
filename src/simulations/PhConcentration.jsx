import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./phConcentrationModele";
import { SvgRelation, SvgDilution10, SvgMesure, SvgFacteurN, SvgTester, SvgValidite } from "./phConcentrationSchemas";

const SIM_ID = 121, CLE_GUIDE = 'ph-concentration-tg-guide-v1';
declarerDefis(SIM_ID, [['conc', 'Quelle est la concentration en ions oxonium d’après le pH lu ?'], ['aberr', 'Quelle mesure de la série est aberrante ?']]);

// ====================================================
//  SIM 121 — pH ET CONCENTRATION EN IONS OXONIUM (TG spé PC, thème « Constitution et transformations de la matière »)
//  Une seule idée : la relation pH = −log([H₃O⁺]/c°) dans les deux sens, et son effet quand on dilue d'un facteur 10 (le pH augmente de 1).
//  Solutions d'acide chlorhydrique (acide fort : [H₃O⁺] = C). Modèle : phConcentrationModele.js, qui réutilise acidesBasesModele.js (sim 85) sans le modifier.
//  La 85 (TSTL) traite l'acide fort/faible, le diagramme de distribution, le tampon et le titrage ; ici : c°, les deux sens du calcul,
//  les chiffres significatifs, la série de dilutions d'un facteur 10 et le domaine de validité de la relation.
// ====================================================

const SUPC = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = n => String(n).split('').map(c => SUPC[c] ?? c).join('');
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
// Concentration en notation scientifique à cs chiffres significatifs : « 4,0 × 10⁻³ »
const sciC = (x, cs = 2) => { const [m, e] = Number(x).toExponential(cs - 1).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${sup(Number(e))}`; };
const concTxt = c => (c >= 9.99e-5 ? nbf(c, Math.min(5, Math.max(2, 1 - Math.floor(Math.log10(c) + 1e-9)))) : sciC(c));   // 0,010 ou 0,0050 (décimal) tant que c'est lisible, sinon notation scientifique
const tire = t => t[Math.floor(Math.random() * t.length)];
const CONCS = [0.1, 0.05, 0.03, 0.02, 0.01, 0.005, 0.003, 0.002, 0.001, 0.0005, 0.0001];   // concentrations de départ proposées (mol·L⁻¹)
const PRESET = { i: 4, k: 0 };
const IDS = ['solution', 'def', 'ph1', 'mant', 'inverse', 'dil', 'prevoir', 'serie', 'protocole', 'fact100', 'graphe', 'limite1', 'limite2', 'bravo'];
const SCENES = { solution: 1e-2, def: 1e-2, ph1: 1e-2, mant: 4.0e-3, inverse: M.concDePH(3.40) };    // concentration de S₀ imposée aux premières étapes
const Sk = k => <>S<sub>{k}</sub></>;

// ---------- formules ----------
const H3O = <mrow><mo>[</mo><mi mathvariant="normal">H₃O⁺</mi><mo>]</mo></mrow>;
const FORM_PH = <Formule><mi>pH</mi><mo>=</mo><mo>−</mo><mi>log</mi><mo>(</mo><mfrac>{H3O}<msup><mi>c</mi><mo>°</mo></msup></mfrac><mo>)</mo></Formule>;
const FORM_INV = <Formule>{H3O}<mo>=</mo><msup><mi>c</mi><mo>°</mo></msup><mo>×</mo><msup><mn>10</mn><mrow><mo>−</mo><mi>pH</mi></mrow></msup></Formule>;
const FORM_DIL = <Formule><msub><mi>pH</mi><mi>final</mi></msub><mo>=</mo><msub><mi>pH</mi><mi>initial</mi></msub><mo>+</mo><mi>log</mi><mi>F</mi></Formule>;

// ---------- scène : fiole, pH-mètre, dilution ----------
function Scene({ C0, k, montrerPH, montrerC, pHForce }) {
  const Ck = M.concApres(C0, k), ph = pHForce ?? M.pHMesure(Ck);
  const etiqC = c => (montrerC ? `C = ${sciC(c)} mol·L⁻¹` : 'C = ? mol·L⁻¹');
  return (
    <svg viewBox="0 0 440 262" style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={`Paillasse : ${k > 0 ? `la solution S${k - 1} est diluée d’un facteur 10 pour donner la solution S${k} ; ` : 'une solution d’acide chlorhydrique '}le pH-mètre plongé dans la solution affiche ${montrerPH ? nbf(ph, 2) : 'une valeur encore masquée'}`}>
      <g className="phc-glisse" style={{ transform: k === 0 ? 'translateX(-105px)' : 'translateX(0)' }}>
        {k > 0 && <g className="phc-in">
          <path d="M30 132 L30 212 L110 212 L110 132" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinejoin="round"/>
          <rect x="31.5" y="150" width="77" height="60.5" fill="#bfdbfe" opacity="0.85"/>
          <text x="78" y="228" fontSize="17" fontWeight="700" fill="#0f172a" textAnchor="middle">S<tspan baselineShift="sub" fontSize="0.75em">{k - 1}</tspan></text>
          <text x="78" y="252" fontSize="14" fill="#334155" textAnchor="middle">{etiqC(M.concApres(C0, k - 1))}</text>
          <defs><marker id="phc-fl" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#b45309"/></marker></defs>
          <line x1="120" y1="168" x2="278" y2="168" stroke="#b45309" strokeWidth="2.4" markerEnd="url(#phc-fl)"/>
          <text x="199" y="144" fontSize="13" fontWeight="700" fill="#b45309" textAnchor="middle">prélever 10,0 mL</text>
          <text x="199" y="160" fontSize="13" fontWeight="700" fill="#b45309" textAnchor="middle">compléter à 100 mL</text>
          <text x="199" y="188" fontSize="12.5" fill="#475569" textAnchor="middle">facteur 10</text>
        </g>}
        <rect x="236" y="8" width="196" height="76" rx="10" fill="#0f172a"/>
        <text x="248" y="28" fontSize="13" fill="#94a3b8">pH-mètre</text>
        <text x="420" y="68" fontSize="40" fontWeight="700" fontFamily="monospace" textAnchor="end" fill={montrerPH ? '#4ade80' : '#64748b'}>{montrerPH ? nbf(ph, 2) : '?,??'}</text>
        <path d="M300 84 Q300 106 320 110 L320 176" fill="none" stroke="#475569" strokeWidth="2.4"/>
        <rect x="314" y="170" width="12" height="30" rx="4" fill="#cbd5e1" stroke="#475569"/>
        <path d="M290 112 L290 212 L390 212 L390 112" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinejoin="round"/>
        <rect x="291.5" y="140" width="97" height="70.5" fill="#bfdbfe" opacity="0.85"/>
        <text x="340" y="228" fontSize="17" fontWeight="700" fill="#0f172a" textAnchor="middle">{k === 0 ? 'Solution S' : 'S'}<tspan baselineShift="sub" fontSize="0.75em">{k}</tspan> : HCl</text>
        <text x="340" y="252" fontSize="14" fill="#334155" textAnchor="middle">{etiqC(Ck)}</text>
      </g>
    </svg>);
}

// ---------- tableau des solutions de la série ----------
function TableSerie({ lignes, colLog, colPH, kSel, choix }) {
  return (
    <div role="group" aria-label="Solutions de la série" style={{ fontSize: 13.5 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '3px 3px' }}>Solution</th><th style={{ padding: '3px 3px' }}><em>C</em> (mol·L⁻¹)</th>
          {colLog && <th style={{ padding: '3px 3px' }}>−log(<em>C</em>/c°)</th>}{colPH && <th style={{ padding: '3px 3px' }}>pH lu</th>}{choix && <th style={{ padding: '3px 3px' }}>Aberrante ?</th>}</tr></thead>
        <tbody>{lignes.map(l => (
          <tr key={l.k} style={{ borderTop: `1px dashed ${KIT.bord}`, background: kSel === l.k ? '#fff7ed' : 'transparent' }}>
            <td style={{ padding: '4px 3px', fontWeight: 700 }}>{Sk(l.k)}</td>
            <td style={{ padding: '4px 3px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{sciC(l.C)}</td>
            {colLog && <td style={{ padding: '4px 3px', fontFamily: 'monospace' }}>{nbf(l.moinsLog, 2)}</td>}
            {colPH && <td style={{ padding: '4px 3px', fontFamily: 'monospace', fontWeight: 700, color: '#b45309' }}>{nbf(l.pHMes, 2)}</td>}
            {choix && <td style={{ padding: '4px 3px' }}><button onClick={() => choix.onSel(l.k)} aria-pressed={choix.sel === l.k} aria-label={`La mesure de S${l.k} est aberrante`} style={stylePetitBouton(choix.sel === l.k, '#b91c1c')}>{choix.sel === l.k ? '✓ choisie' : 'choisir'}</button></td>}
          </tr>))}</tbody>
      </table>
    </div>);
}

// ---------- graphe pH lu = f(−log(C/c°)) ----------
function GrapheTest({ lignes, kSel }) {
  const W = 480, H = 300, mx = 46, my = 14, bas = H - 46, droite = W - 16;
  const vmax = Math.max(8, 2 * Math.ceil(Math.max(0, ...lignes.map(l => l.moinsLog)) / 2));
  const X = v => mx + (droite - mx) * v / vmax, Y = p => my + (bas - my) * (1 - p / 8);
  const ecarte = lignes.some(l => Math.abs(l.ecart) > 0.05);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={`Graphe du pH lu en fonction de moins log de C sur c zéro, pour ${lignes.length} solutions ; la droite pointillée est pH égal moins log de C sur c zéro${ecarte ? ' ; pour les solutions les plus diluées les points s’écartent de la droite et le pH reste inférieur à 7' : ' ; les points sont sur la droite'}`}>
      <line x1={mx} y1={bas} x2={droite} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {Array.from({ length: vmax / 2 + 1 }, (_, i) => 2 * i).map(v => <text key={'x' + v} x={X(v)} y={bas + 16} fontSize="12.5" textAnchor="middle" fill="#334155">{v}</text>)}
      {[0, 2, 4, 6, 8].map(v => <g key={v}><line x1={mx} y1={Y(v)} x2={droite} y2={Y(v)} stroke="#eef2f7"/><text x={mx - 6} y={Y(v) + 4} fontSize="12.5" textAnchor="end" fill="#334155">{v}</text></g>)}
      <text x={(mx + droite) / 2} y={H - 8} fontSize="12.5" textAnchor="middle" fill="#334155">−log(<tspan fontStyle="italic">C</tspan> / c°)</text>
      <text x="13" y={(my + bas) / 2} fontSize="12.5" fill="#334155" transform={`rotate(-90 13 ${(my + bas) / 2})`} textAnchor="middle">pH lu</text>
      <line x1={mx} y1={Y(7)} x2={droite} y2={Y(7)} stroke="#b91c1c" strokeWidth="1" strokeDasharray="3 3" opacity="0.7"/>
      <text x={mx + 6} y={Y(7) - 5} fontSize="11.5" fill="#b91c1c">pH = 7</text>
      <line x1={X(0)} y1={Y(0)} x2={X(8)} y2={Y(8)} stroke="#64748b" strokeWidth="2" strokeDasharray="6 4"/>
      {lignes.map(l => <circle key={l.k} cx={X(l.moinsLog)} cy={Y(l.pHMes)} r={kSel === l.k ? 7 : 5} fill={kSel === l.k ? '#f59e0b' : '#0369a1'} stroke="#0f172a" strokeWidth="1.3"/>)}
      <line x1={droite - 150} y1={bas - 36} x2={droite - 124} y2={bas - 36} stroke="#64748b" strokeWidth="2" strokeDasharray="6 4"/>
      <text x={droite - 120} y={bas - 32} fontSize="11.5" fill="#334155">pH = −log(<tspan fontStyle="italic">C</tspan>/c°)</text>
      <circle cx={droite - 137} cy={bas - 16} r="5" fill="#0369a1" stroke="#0f172a"/><text x={droite - 120} y={bas - 12} fontSize="11.5" fill="#334155">pH lu</text>
    </svg>);
}

// ====================================================
export function SimulationPhConcentration() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('conc');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', explore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);
  const okEtape = !!(guide.reussies && guide.reussies[etape]);
  const suitSerie = !enGuide || IDS.indexOf(idE) >= IDS.indexOf('dil');

  // ---------- grandeurs effectives ----------
  const C0 = enGuide ? (SCENES[idE] ?? 1e-2) : CONCS[ti.i];
  const k = dd ? 0 : (suitSerie ? ti.k : 0);
  const Ck = M.concApres(C0, k), lignes = M.serie(C0, k);
  const pHlu = M.pHMesure(Ck), logC = M.pHDeConc(Ck);
  const montrerPH = enGuide ? ({ solution: false, def: false, ph1: okEtape, mant: okEtape, inverse: true, dil: k === 0, prevoir: k === 0 || okEtape }[idE] ?? true) : true;
  const montrerC = enGuide ? !(idE === 'inverse' && !okEtape) : true;

  // ---------- états attendus (rétablissements du parcours) ----------
  const attendu = { prevoir: { k: 1 }, protocole: { k: 4 }, graphe: { k: 4 }, limite2: { k: 6 } }[idE] || null;
  const conforme = !attendu || ti.k === attendu.k;
  const bloque = conforme ? null : 'Rétablissez d’abord les solutions avec le bouton au-dessus du schéma.';
  const retablir = () => setT({ k: attendu.k });
  const libelleRetablir = attendu && `Rétablir : ${attendu.k === 1 ? 'S₁ (une dilution)' : `S₀ à S${'₀₁₂₃₄₅₆₇₈'[attendu.k]} (${attendu.k} dilutions)`}`;

  const phS1 = M.pHMesure(M.concApres(1e-2, 1));
  const ETAPES = [
    { id: 'solution', titre: 'Une solution d’acide chlorhydrique', focus: ['scene'],
      texte: <>Une solution d’<strong>acide chlorhydrique</strong> (H₃O⁺ + Cl⁻) est préparée avec une concentration en soluté apporté <em>C</em> = 1,0{NB}×{NB}10⁻²{NB}mol·L⁻¹. L’acide chlorhydrique réagit <strong>totalement</strong> avec l’eau : HCl + H₂O → H₃O⁺ + Cl⁻.</>,
      tache: { type: 'qcm', q: 'Quelle est la concentration en ions oxonium [H₃O⁺] de cette solution ?', options: ['1,0 × 10⁻² mol·L⁻¹ : un ion H₃O⁺ par molécule HCl', '2,0 × 10⁻² mol·L⁻¹ : H₃O⁺ et Cl⁻ s’additionnent', '1,0 × 10⁻⁷ mol·L⁻¹ : valeur de l’eau pure'], bonne: 0,
        expl: 'La réaction est totale et chaque molécule HCl donne un ion H₃O⁺ et un ion Cl⁻ : [H₃O⁺] = C = 1,0 × 10⁻² mol·L⁻¹. Les deux ions ont la même concentration ; on ne les additionne pas.',
        indice: 'Combien d’ions H₃O⁺ une molécule HCl fournit-elle quand elle réagit totalement avec l’eau ?' } },
    { id: 'def', titre: 'Définition du pH', focus: ['scene'],
      texte: <>Le <strong>pH</strong> d’une solution aqueuse se définit par :{FORM_PH}où <em>c</em>° = 1{NB}mol·L⁻¹ est la concentration standard et « log » le logarithme décimal (log 10<sup>n</sup> = n). On calcule avec [H₃O⁺] en mol·L⁻¹.</>,
      tache: { type: 'qcm', q: 'Pourquoi divise-t-on [H₃O⁺] par c° dans cette définition ?', options: ['pour obtenir un nombre sans unité : on ne prend le log que d’un nombre', 'pour convertir la concentration en moles par mètre cube, unité du SI', 'pour que le pH reste toujours compris entre 0 et 14, quelle que soit C'], bonne: 0,
        expl: 'On ne calcule le logarithme que d’un nombre sans unité : [H₃O⁺] / c° n’a pas d’unité. Comme c° = 1 mol·L⁻¹, la valeur numérique ne change pas : on peut calculer directement avec [H₃O⁺] exprimée en mol·L⁻¹.',
        indice: 'Quelle condition doit remplir le nombre dont on prend le logarithme ?' } },
    { id: 'ph1', titre: 'Calculer un pH', focus: ['scene', 'mesures'],
      texte: <>La solution de l’étape 1 a pour concentration en ions oxonium [H₃O⁺] = 1,0{NB}×{NB}10⁻²{NB}mol·L⁻¹. Calculez son pH ; le pH-mètre indiquera la valeur après votre réponse.</>,
      tache: { type: 'num', q: 'pH de la solution', unite: '', vrai: 2.0, tol: 0.02, affiche: v => nbf(v, 1), carnet: 'pH de la solution à 1,0 × 10⁻² mol·L⁻¹',
        calcul: () => ['[H₃O⁺] / c° = 1,0 × 10⁻² / 1 = 1,0 × 10⁻² (nombre sans unité).', 'log(10⁻²) = −2, donc pH = −(−2) = 2,0.'],
        pieges: [[-2, 'Le pH est −log([H₃O⁺]/c°) : il y a un signe moins devant le logarithme.'], [0.01, 'Vous avez recopié [H₃O⁺] : le pH est −log de cette valeur.']],
        expl: 'pH = −log(1,0 × 10⁻²) = 2,0.', indice: 'log(10ⁿ) = n : quel est l’exposant de 10 dans 1,0 × 10⁻² ?' } },
    { id: 'mant', titre: 'Quand ce n’est pas une puissance de 10', focus: ['scene', 'mesures'],
      texte: <>Une autre solution d’acide chlorhydrique a pour concentration [H₃O⁺] = 4,0{NB}×{NB}10⁻³{NB}mol·L⁻¹. Le nombre n’est plus une puissance de dix exacte : utilisez la touche <em>log</em> de la calculatrice. Donnez le pH avec <strong>2 décimales</strong> (autant que [H₃O⁺] a de chiffres significatifs).</>,
      tache: { type: 'num', q: 'pH de la solution', unite: '', vrai: M.pHDeConc(4.0e-3), tol: 0.01, affiche: v => nbf(v, 2), cs: 3, carnet: 'pH de la solution à 4,0 × 10⁻³ mol·L⁻¹',
        calcul: () => ['[H₃O⁺] / c° = 4,0 × 10⁻³ (sans unité).', 'log(4,0 × 10⁻³) = log 4,0 + log 10⁻³ = 0,60 − 3 = −2,40.', 'pH = −(−2,40) = 2,40 (2 décimales, car [H₃O⁺] a 2 chiffres significatifs).'],
        pieges: [[3.60, 'Vous avez calculé 3 + log 4,0 : le pH est −(log 4,0 − 3) = 3 − 0,60.'], [-2.40, 'Le pH est l’opposé du logarithme : il est positif ici.'], [0.60, 'log 4,0 = 0,60 ne donne qu’une partie du résultat : il faut aussi tenir compte du 10⁻³.'],
          [3.0, 'Vous avez ignoré le facteur 4,0 : log(4,0 × 10⁻³) n’est pas égal à −3.'], [5.52, 'Vous avez utilisé la touche ln (logarithme népérien) ; il faut la touche log (logarithme décimal).']],
        expl: 'pH = −log(4,0 × 10⁻³) = 2,40.', indice: 'À la calculatrice : −log(4,0 × 10⁻³). Ou log(a × b) = log a + log b, avec log 4,0 ≈ 0,60 et log 10⁻³ = −3.' } },
    { id: 'inverse', titre: 'Du pH à la concentration', focus: ['scene', 'mesures'],
      texte: <>Un pH-mètre plongé dans une troisième solution d’acide chlorhydrique indique <strong>pH = 3,40</strong>. On cherche sa concentration en ions oxonium : la relation s’inverse (touche <em>10<sup>x</sup></em> de la calculatrice, avec x = −3,40).{FORM_INV}</>,
      tache: { type: 'num', q: 'Concentration en ions oxonium [H₃O⁺]', unite: 'mol·L⁻¹', vrai: M.concDePH(3.40), tol: 0.06, affiche: v => sciC(v), cs: 2, carnet: '[H₃O⁺] pour pH = 3,40',
        calcul: () => ['[H₃O⁺] = c° × 10^(−pH) = 1 × 10^(−3,40).', '10^(−3,40) = 10^0,60 × 10⁻⁴ = 3,98 × 10⁻⁴ (touche 10ˣ avec −3,40).', 'Le pH a 2 décimales : [H₃O⁺] s’écrit avec 2 chiffres significatifs, 4,0 × 10⁻⁴ mol·L⁻¹.'],
        pieges: [[10 ** 3.4, 'Le signe de l’exposant est faux : [H₃O⁺] = 10^(−pH), pas 10^(+pH).'], [3.4e-3, 'Le « 3,40 » du pH n’est pas à recopier : il faut calculer 10^(−3,40).'], [1.0e-3, 'Vous avez arrondi le pH à 3 : 10^(−3,40) est plus petit que 10⁻³.']],
        expl: '[H₃O⁺] = 10^(−3,40) = 3,98 × 10⁻⁴ ≈ 4,0 × 10⁻⁴ mol·L⁻¹ (2 chiffres significatifs, comme le pH a 2 décimales).', indice: 'Calculatrice : 10^x avec x = −3,40. Le résultat est de l’ordre de 10⁻⁴.' } },
    { id: 'dil', titre: 'Diluer d’un facteur 10', focus: ['reglages', 'scene'],
      retenirTitre: 'À RETENIR : DU [H₃O⁺] AU pH, ET INVERSEMENT',
      retenir: <><SvgRelation/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>[H₃O⁺] = 10⁻ⁿ mol·L⁻¹ ⇒ pH = n</strong> ; pour un nombre quelconque, on utilise la touche <em>log</em> (et <em>10<sup>x</sup></em> dans l’autre sens).</li>
          <li><strong>Plus [H₃O⁺] est grande, plus le pH est petit</strong> : 2,5 × 10⁻⁵ mol·L⁻¹ ↔ pH 4,60.</li>
          <li><strong>Règle d’écriture</strong> : autant de décimales pour le pH que de chiffres significatifs pour [H₃O⁺].</li></ul></>,
      texte: <>Pour <strong>tester</strong> la relation, on prépare des solutions par <strong>dilutions successives d’un facteur 10</strong> : on prélève 10,0{NB}mL de la solution à la pipette jaugée, on les place dans une fiole jaugée de 100{NB}mL et on complète avec de l’eau distillée. Appelons {Sk(0)} la solution de départ (<em>C</em> = 1,0{NB}×{NB}10⁻²{NB}mol·L⁻¹, pH = 2,0). Le bouton de dilution est apparu dans les réglages : préparez {Sk(1)}, obtenue en diluant {Sk(0)}.</>,
      tache: { type: 'action', ok: ti.k >= 1, label: 'Préparer S₁ (diluer d’un facteur 10)', faire: () => setT({ k: 1 }), consigne: 'Diluez une fois d’un facteur 10 pour obtenir S1' } },
    { id: 'prevoir', titre: 'Prévoir le pH après dilution', focus: ['scene'],
      texte: <>{Sk(1)} est dix fois moins concentrée que {Sk(0)} : [H₃O⁺] est passée de 1,0{NB}×{NB}10⁻² à 1,0{NB}×{NB}10⁻³{NB}mol·L⁻¹. Avant de lire le pH-mètre, faites une prévision. Rappel : le pH de {Sk(0)} est 2,0.</>,
      tache: { type: 'qcm', q: 'Le pH de S₁ sera…', options: ['3,0 : le pH a augmenté de 1 unité', '2,1 : le pH a augmenté de 0,1 unité', '0,20 : le pH a été divisé par 10', '20 : le pH a été multiplié par 10'], bonne: 0, bloque,
        expl: `pH(S₁) = −log(1,0 × 10⁻³) = ${nbf(phS1, 1)} : diluer d’un facteur 10 divise [H₃O⁺] par 10, ce qui augmente le pH de 1 (log 10 = 1). Le pH-mètre le confirme.`,
        indice: 'Calculez le pH de S₁ à partir de [H₃O⁺] = 1,0 × 10⁻³ mol·L⁻¹ et comparez-le à celui de S₀.' } },
    { id: 'serie', titre: 'La série de dilutions', focus: ['reglages', 'scene'],
      retenirTitre: 'À RETENIR : DILUER D’UN FACTEUR 10 AJOUTE 1 AU pH',
      retenir: <><SvgDilution10/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Dilution d’un facteur 10 : [H₃O⁺] ÷ 10, pH + 1.</strong></li>
          <li><strong>Idée fausse</strong> : « 10 fois moins concentré, donc pH ÷ 10 ». <strong>Vrai</strong> : le pH est un logarithme, il <em>augmente</em> de 1.</li>
          <li>Le pH augmente quand on dilue un acide : la solution devient moins acide.</li></ul></>,
      texte: <>Poursuivez les dilutions jusqu’à {Sk(4)} (<em>C</em> = 1,0{NB}×{NB}10⁻⁶{NB}mol·L⁻¹) : chaque solution est préparée à partir de la précédente. Le tableau des solutions apparaît.</>,
      tache: { type: 'action', ok: ti.k >= 4, label: 'Préparer jusqu’à S₄', faire: () => setT({ k: 4 }), consigne: 'Préparez S1 à S4 (4 dilutions au total)' } },
    { id: 'protocole', titre: 'Mesurer le pH de la série', focus: ['scene'],
      texte: <>Les solutions {Sk(0)} à {Sk(4)} sont prêtes. Pour mesurer leur pH, on utilise un pH-mètre <strong>étalonné</strong> avec deux solutions tampons (pH 4,00 et pH 7,00).</>,
      tache: { type: 'qcm', q: 'Dans quel ordre mesurer les cinq pH ?', options: ['de la plus diluée (S₄) à la plus concentrée (S₀), en rinçant l’électrode à l’eau distillée entre deux mesures', 'de la plus concentrée (S₀) à la plus diluée (S₄), sans rincer l’électrode entre deux mesures', 'dans n’importe quel ordre, car l’électrode ne garde aucune trace de la solution précédente'], bonne: 0, bloque,
        expl: 'Quelques gouttes d’une solution concentrée restées sur l’électrode fausseraient beaucoup le pH d’une solution diluée ; l’inverse est négligeable. On rince donc l’électrode à l’eau distillée et on mesure du plus dilué au plus concentré, en lisant la valeur quand elle est stable.',
        indice: 'Que se passe-t-il si une trace de solution concentrée contamine une solution très diluée ?' } },
    { id: 'fact100', titre: 'Un facteur de dilution 100', focus: ['mesures'],
      retenirTitre: 'À RETENIR : MESURER LE pH',
      retenir: <><SvgMesure/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Étalonner</strong> le pH-mètre avec deux tampons encadrant les pH à mesurer, <strong>rincer</strong> l’électrode, <strong>mesurer du plus dilué au plus concentré</strong>.</li>
          <li>Lire le pH <strong>quand la valeur est stable</strong>, au centième ; la précision d’un pH-mètre courant est de l’ordre de 0,05 unité de pH.</li></ul></>,
      texte: <>Reprenez la solution de l’étape 4 : [H₃O⁺] = 4,0{NB}×{NB}10⁻³{NB}mol·L⁻¹ et pH = 2,40. On en prélève 1,0{NB}mL qu’on place dans une fiole jaugée de 100{NB}mL, complétée avec de l’eau distillée : la solution est diluée d’un facteur <strong>100</strong>, soit deux dilutions successives d’un facteur 10.</>,
      tache: { type: 'num', q: 'pH de la solution diluée', unite: '', vrai: M.pHDeConc(4.0e-3) + 2, tol: 0.01, affiche: v => nbf(v, 2), cs: 3, carnet: 'pH après dilution d’un facteur 100',
        calcul: () => ['Facteur 100 : [H₃O⁺] est divisée par 100, soit 4,0 × 10⁻³ / 100 = 4,0 × 10⁻⁵ mol·L⁻¹.', 'pH = −log(4,0 × 10⁻⁵) = 4,40.', 'Autre méthode : pH final = pH initial + log F = 2,40 + log 100 = 2,40 + 2 = 4,40.'],
        pieges: [[3.40, 'Vous avez ajouté 1 : un facteur 100 correspond à deux dilutions d’un facteur 10, donc à +2.'], [0.40, 'Le pH augmente quand on dilue : il faut ajouter 2, pas retrancher.'], [240, 'Vous avez multiplié le pH par 100 : la dilution agit sur [H₃O⁺], le pH augmente de log 100 = 2.']],
        expl: 'pH = 2,40 + log 100 = 4,40.', indice: 'Un facteur 100 = deux dilutions d’un facteur 10 : de combien le pH change-t-il à chaque dilution ?' } },
    { id: 'graphe', titre: 'Tester la relation', focus: ['graphe'],
      retenirTitre: 'À RETENIR : DILUER D’UN FACTEUR 10ⁿ AJOUTE n AU pH',
      retenir: <><SvgFacteurN/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>pH final = pH initial + log F</strong> (F = facteur de dilution) : F = 10 → +1 ; F = 100 → +2 ; F = 1000 → +3.</li>
          <li>Deux dilutions successives d’un facteur 10 = une dilution d’un facteur 100 : on <strong>additionne</strong> les variations de pH.</li></ul></>,
      texte: <>Le graphe du pH lu en fonction de −log(<em>C</em>/c°) apparaît pour les solutions {Sk(0)} à {Sk(4)}. Si la relation pH = −log(<em>C</em>/c°) est vraie, les points sont alignés sur la droite pointillée (y = x).</>,
      tache: { type: 'qcm', q: 'Que montre l’alignement des cinq points sur la droite pointillée ?', options: ['le pH lu est égal à −log(C/c°) à 0,05 près : la relation est vérifiée', 'le pH est proportionnel à la concentration C : il double si C double', 'le pH ne dépend pas de la concentration : les points sont alignés'], bonne: 0, bloque,
        expl: 'Les points (−log(C/c°) ; pH lu) sont sur la droite y = x : pente 1, ordonnée à l’origine 0. Le pH est une fonction logarithmique de C, pas proportionnelle : diviser C par 10 ajoute 1 au pH.',
        indice: 'Si les points sont sur la droite y = x, que valent pH lu et −log(C/c°) l’un par rapport à l’autre ?' } },
    { id: 'limite1', titre: 'Des solutions encore plus diluées', focus: ['reglages', 'scene', 'graphe'],
      retenirTitre: 'À RETENIR : TESTER LA RELATION',
      retenir: <><SvgTester/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>pH lu = f(−log(C/c°)) est une droite de pente 1 passant par l’origine</strong> : c’est le test de la relation.</li>
          <li>Les points doivent être sur la droite à la précision du pH-mètre près (≈ 0,05). Le pH n’est <strong>pas</strong> proportionnel à C.</li></ul></>,
      texte: <>Que se passe-t-il pour des solutions encore plus diluées ? Préparez {Sk(5)} (<em>C</em> = 1,0{NB}×{NB}10⁻⁷{NB}mol·L⁻¹) puis {Sk(6)} (<em>C</em> = 1,0{NB}×{NB}10⁻⁸{NB}mol·L⁻¹) et observez le tableau et le graphe.</>,
      tache: { type: 'action', ok: ti.k >= 6, label: 'Préparer S₅ et S₆', faire: () => setT({ k: 6 }), consigne: 'Diluez jusqu’à S6 (6 dilutions au total)' } },
    { id: 'limite2', titre: 'Les limites de la relation', focus: ['graphe', 'mesures'],
      texte: <>Pour {Sk(6)} (<em>C</em> = 1,0{NB}×{NB}10⁻⁸{NB}mol·L⁻¹), la relation donnerait pH = 8,00 ; or le pH-mètre indique {nbf(M.pHMesure(1e-8), 2)}. Une solution d’acide ne peut pas avoir un pH supérieur à 7.</>,
      tache: { type: 'qcm', q: 'Pourquoi la relation pH = −log(C/c°) ne s’applique-t-elle plus à S₆ ?', options: ['l’eau apporte déjà environ 10⁻⁷ mol·L⁻¹ d’ions H₃O⁺, non négligeables devant 10⁻⁸ mol·L⁻¹', 'le pH-mètre s’est déréglé en cours de série : il faudrait le réétalonner avant de poursuivre', 'l’acide chlorhydrique devient une base lorsqu’il est trop dilué, ce qui fait monter le pH'], bonne: 0, bloque,
        expl: 'Dans l’eau pure à 25 °C, [H₃O⁺] = 10⁻⁷ mol·L⁻¹ (autoprotolyse de l’eau). Quand C devient comparable à cette valeur, ces ions ne sont plus négligeables : [H₃O⁺] ≠ C et pH = −log C n’est plus valable. Une solution d’acide garde un pH inférieur à 7.',
        indice: 'Combien d’ions H₃O⁺ contient déjà l’eau pure ? Comparez à 1,0 × 10⁻⁸ mol·L⁻¹.' } },
    { id: 'bravo', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : DOMAINE DE VALIDITÉ',
      retenir: <><SvgValidite/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>pH = −log(C/c°)</strong> pour un acide fort est valable pour <strong>10⁻⁶ ≤ C ≤ 10⁻¹ mol·L⁻¹</strong> (25 °C).</li>
          <li><strong>Trop diluée</strong> : l’eau apporte 10⁻⁷ mol·L⁻¹ d’ions H₃O⁺, le pH reste inférieur à 7. <strong>Trop concentrée</strong> : les activités ne sont plus égales aux concentrations.</li></ul></>,
      texte: <>Vous savez passer de [H₃O⁺] au pH et inversement, prévoir l’effet d’une dilution d’un facteur 10 (pH + 1), tester la relation avec une série de solutions et reconnaître ses limites. Passez à l’exploration ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const donneesDefi = type => {
    if (type === 'conc') return { type, pH: Math.round((1 + Math.random() * 4.5) * 100) / 100 };
    const m = tire([1.0, 2.0, 2.5, 4.0, 5.0, 8.0]), n0 = 2, C = Number(`${m}e-${n0}`), j = tire([1, 2, 3, 4]), delta = tire([0.45, -0.40, 0.60, -0.50, 0.70]);
    const liste = M.serie(C, 4).map(l => (l.k === j ? { ...l, pHMes: M.arrondi(l.pHMes + delta, 2) } : l));
    return { type, C, j, lignes: liste, vrai: M.pHDeConc(M.concApres(C, j)), sel: null };
  };
  const nouveauDefi = type => { setDefi({ ...donneesDefi(type), type, reps: {}, verifie: false }); setT({ k: 0 }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v);
    if (defi.type === 'conc') {
      const ok = isFinite(x) && proche(x, M.concDePH(defi.pH), 0.06);
      setDefi(d => ({ ...d, verifie: true, ok })); noterC(ok);
    } else {
      const okPh = isFinite(x) && proche(x, defi.vrai, 0.01), okLigne = defi.sel === defi.j;
      setDefi(d => ({ ...d, verifie: true, okPh, okLigne, ok: okPh && okLigne })); noterA(okPh && okLigne);
    }
  };
  const champ = (label, unite, largeur = 120) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('phc-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: largeur, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok || (defi.type === 'aberr' && defi.okPh) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['conc', 'Du pH à la concentration'], ['aberr', 'La mesure aberrante']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'conc' ? 'Défi : quelle est la concentration en ions oxonium ?' : 'Défi : quelle mesure de la série est aberrante ?'}</div>
      {defi.type === 'conc' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>Le pH-mètre plongé dans une solution d’acide chlorhydrique indique <strong>pH = {nbf(defi.pH, 2)}</strong>. Calculez la concentration en ions oxonium [H₃O⁺] de la solution, en mol·L⁻¹, avec <strong>2 chiffres significatifs</strong>.</div>
        {champ('[H₃O⁺] =', 'mol·L⁻¹')}
        <IndiceDefi cache={false}>[H₃O⁺] = c° × 10<sup>−pH</sup> avec c° = 1 mol·L⁻¹. À la calculatrice : touche <em>10<sup>x</sup></em> avec x = −pH (le signe moins compte). Le résultat s’écrit a × 10<sup>−n</sup>.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>Un élève a préparé cinq solutions d’acide chlorhydrique par dilutions successives d’un facteur 10 et mesuré leur pH. <strong>Une seule mesure est aberrante.</strong> Choisissez-la dans le tableau, puis donnez le pH qu’on aurait dû lire pour cette solution (2 décimales).</div>
        <TableSerie lignes={defi.lignes} colPH choix={{ sel: defi.sel, onSel: s => setDefi(d => ({ ...d, sel: s, verifie: false })) }}/>
        <div style={{ height: 8 }}/>
        {champ('pH attendu =', '', 90)}
        <IndiceDefi cache={false}>À chaque dilution d’un facteur 10, le pH doit augmenter de 1 : cherchez la mesure qui rompt cette régularité. Calculez ensuite −log(<em>C</em>/c°) pour cette solution.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="phc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'conc'
          ? (defi.ok ? `✓ Correct. [H₃O⁺] = 10^(−${nbf(defi.pH, 2)}) = ${sciC(M.concDePH(defi.pH))} mol·L⁻¹.` : (proche(lireNombre(defi.reps.v), 10 ** defi.pH, 0.06) ? '✗ Le signe de l’exposant est faux : [H₃O⁺] = 10^(−pH).' : '✗ Vérifiez : [H₃O⁺] = c° × 10^(−pH), avec c° = 1 mol·L⁻¹ et le signe moins devant le pH.'))
          : <>{defi.okLigne ? '✓ Bonne mesure repérée.' : '✗ Cherchez la mesure qui ne respecte pas « dilution × 10 ⇒ pH + 1 ».'}{' '}{defi.okPh ? `✓ pH attendu correct (${nbf(defi.vrai, 2)}).` : '✗ pH attendu : calculez −log(C/c°) pour la solution choisie.'}</>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température</strong> : 25 °C, avec <em>K</em><sub>e</sub> = 1,0 × 10⁻¹⁴ et un pH-mètre étalonné à cette température. Une autre température change <em>K</em><sub>e</sub> : le pH de l’eau pure n’est plus 7.</li>
      <li><strong>Activités = concentrations</strong> : le pH est défini avec l’activité de H₃O⁺ ; au lycée on la remplace par [H₃O⁺] / c°. C’est valable pour des solutions diluées (C ≤ 0,1 mol·L⁻¹) ; au-delà, les interactions entre ions rendent la relation moins bonne.</li>
      <li><strong>Acide fort</strong> : l’acide chlorhydrique réagit totalement avec l’eau, donc [H₃O⁺] = C. Pour un <em>acide faible</em>, [H₃O⁺] &lt; C : une dilution d’un facteur 10 n’ajoute plus 1 au pH (voir la simulation sur les acides et les bases).</li>
      <li><strong>Autoprotolyse de l’eau</strong> : <em>négligée</em> dans la relation du cours pH = −log(C/c°), mais <em>prise en compte</em> par le pH-mètre simulé (calcul complet avec <em>K</em><sub>e</sub>). L’écart reste inférieur à 0,01 unité de pH pour C ≥ 10⁻⁶ mol·L⁻¹ et devient grand en dessous (pH lu 6,79 pour 10⁻⁷ mol·L⁻¹ au lieu de 7,00).</li>
      <li><strong>Domaine de validité</strong> : pH = −log(C/c°) pour un acide fort est valable pour 10⁻⁶ ≤ C ≤ 10⁻¹ mol·L⁻¹. Une solution d’acide a toujours un pH &lt; 7 à 25 °C : un résultat supérieur à 7 est invraisemblable.</li>
      <li><strong>Dilutions parfaites</strong> : pipette jaugée de 10,0 mL et fiole jaugée de 100 mL sans incertitude, volumes additifs : le facteur de dilution est exactement 10. Pas de CO₂ dissous (sinon l’eau distillée a un pH voisin de 5,6).</li>
      <li><strong>pH-mètre idéal</strong> : lecture stable au centième ; un vrai pH-mètre fluctue et a une précision de l’ordre de 0,05 unité de pH. Un écart de 0,02 entre pH lu et pH calculé n’est donc pas significatif.</li>
      <li><strong>Chiffres significatifs</strong> : pH et logarithme se lisent ainsi — le nombre de décimales du pH est égal au nombre de chiffres significatifs de [H₃O⁺] (pH = 2,40 ↔ 4,0 × 10⁻³ mol·L⁻¹).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const boutonRetablir = (txt, f) => <button onClick={f} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>{txt}</button>;
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enGuide && attendu && !conforme && boutonRetablir(libelleRetablir, retablir)}
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Scene C0={dd ? M.concDePH(dd.pH) : C0} k={k} montrerPH={dd ? true : montrerPH} montrerC={dd ? false : montrerC} pHForce={dd ? dd.pH : (enGuide && idE === 'inverse' ? 3.40 : undefined)}/>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Acide chlorhydrique (H₃O⁺ + Cl⁻), 25 °C. Le pH-mètre indique le pH de la solution dans laquelle plonge l’électrode.</div>
    </div>);

  // ---------- réglages ----------
  const peutDiluer = !dd && (explore || (enGuide && deja('dil')));
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {explore && <>
        <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 4 }}>Concentration de départ <em>C</em><sub>0</sub> de {Sk(0)} (mol·L⁻¹) :</div>
        <div role="group" aria-label="Concentration de départ" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {CONCS.map((c, i) => <button key={c} onClick={() => setT({ i })} aria-pressed={ti.i === i} style={stylePetitBouton(ti.i === i, '#475569')}>{nbf(c, c < 0.001 ? 4 : c < 0.01 ? 3 : 2)}</button>)}
        </div>
        <Curseur nom="Nombre de dilutions successives (facteur 10)" valeur={ti.k} onChange={v => setT({ k: v })} min={0} max={M.K_MAX} pas={1} decimales={0} couleur="#b45309"/>
      </>}
      {enGuide && peutDiluer && <>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Solution de départ {Sk(0)} : <em>C</em> = 1,0{NB}×{NB}10⁻²{NB}mol·L⁻¹. Dilutions réalisées : <strong>{ti.k}</strong>.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setT({ k: Math.min(M.K_MAX, ti.k + 1) })} disabled={ti.k >= M.K_MAX} style={styleBouton(true, '#0f766e')}>Diluer d’un facteur 10</button>
          <button onClick={() => setT({ k: Math.max(0, ti.k - 1) })} disabled={ti.k <= 0} style={styleBouton(false)}>Annuler la dernière dilution</button>
        </div></>}
    </div>);

  // ---------- mesures ----------
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {montrerC && !dd && <LigneMesure nom="Concentration apportée C" valeur={`${explore ? concTxt(Ck) : sciC(Ck)}${NB}mol·L⁻¹`}/>}
      {(!enGuide || (apres('solution') && montrerC)) && !dd && <LigneMesure nom="[H₃O⁺] (acide fort : = C)" valeur={`${explore ? concTxt(Ck) : sciC(Ck)}${NB}mol·L⁻¹`}/>}
      {(montrerPH || dd) && <LigneMesure nom="pH lu" valeur={nbf(dd ? dd.pH : pHlu, 2)} couleur="#b45309"/>}
      {!dd && suitSerie && (!enGuide || deja('dil')) && <LigneMesure nom="Dilutions réalisées" valeur={`${k}`}/>}
      {!dd && suitSerie && (!enGuide || deja('dil')) && k > 0 && <LigneMesure nom="Facteur de dilution total" valeur={`10${sup(k)}`}/>}
      {explore && <>
        <LigneMesure nom="−log(C/c°) (relation)" valeur={nbf(logC, 2)}/>
        <LigneMesure nom="écart (pH lu − relation)" valeur={`${Math.abs(pHlu - logC) < 0.005 ? '0,00' : (pHlu - logC > 0 ? '+' : '−') + nbf(Math.abs(pHlu - logC), 2)}`} couleur={Math.abs(pHlu - logC) > 0.05 ? '#b91c1c' : '#15803d'}/>
        <LigneMesure nom="relation valable ?" valeur={M.relationValable(Ck) ? 'oui' : 'non'} couleur={M.relationValable(Ck) ? '#15803d' : '#b91c1c'}/></>}
    </div>);

  // ---------- tableau et graphe ----------
  const tableau = !dd && ((enGuide && deja('serie')) || explore) && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Solutions de la série</div>
      <TableSerie lignes={lignes} colLog={!enGuide || deja('graphe')} colPH={!enGuide || apres('protocole')} kSel={k}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{explore || deja('graphe') ? 'La ligne orange est la solution dans laquelle plonge l’électrode.' : 'Chaque solution est préparée à partir de la précédente (facteur 10).'}</div>
    </div>);
  const graphique = !dd && ((enGuide && deja('graphe')) || explore) && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>pH lu en fonction de −log(<em>C</em>/c°)</div>
      <GrapheTest lignes={lignes} kSel={k}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Pointillés : la droite d’équation pH = −log(C/c°). Points bleus : pH lu ; point orange : solution mesurée.</div>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez <em>C</em><sub>0</sub> = 0,03 mol·L⁻¹ : prévoyez le pH de S<sub>0</sub>, S<sub>2</sub> et S<sub>3</sub> avant de lire le pH-mètre.</li>
        <li>Quelle que soit <em>C</em><sub>0</sub>, de combien le pH change-t-il à chaque dilution tant que la relation est valable ?</li>
        <li>Diluez jusqu’à S<sub>8</sub> : à partir de quelle solution l’écart avec la relation dépasse-t-il 0,05 ? Que devient le pH lu quand on dilue encore ?</li>
        <li>Comparez deux solutions dont les concentrations diffèrent d’un facteur 1000 : de combien diffèrent leurs pH ?</li>
        <li>Trouvez un réglage pour lequel le pH lu est voisin de 3,5, puis vérifiez avec la relation inverse [H₃O⁺] = 10<sup>−pH</sup>.</li>
      </ul>
    </div>);
  const retenirExplore = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>pH = −log([H₃O⁺]/c°), c° = 1 mol·L⁻¹ ; [H₃O⁺] = 10<sup>−pH</sup> mol·L⁻¹</li>
        <li>dilution d’un facteur F : pH + log F (facteur 10 : +1)</li>
        <li>acide fort : valable pour 10⁻⁶ ≤ C ≤ 10⁻¹ mol·L⁻¹ ; pH &lt; 7 pour un acide</li>
        <li>décimales du pH = chiffres significatifs de [H₃O⁺]</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .phc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .phc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .phc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .phc-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr); margin-bottom: 12px; }
        .phc-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .phc-l1.cote .phc-carte { order: 2; } .phc-l1.cote .phc-main { order: 1; } }
        @media (max-width: 900px) { .phc-l1.cote, .phc-pri { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .phc-in { animation: phc-fondu 0.35s ease-out; } .phc-glisse { transition: transform 0.4s ease; } @keyframes phc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>pH et concentration en ions oxonium</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le <strong>pH</strong> se déduit de la concentration en ions oxonium par un logarithme, et inversement. On teste cette relation avec des solutions d’acide chlorhydrique obtenues par <strong>dilutions successives d’un facteur 10</strong>.</div>
      <div className={`phc-l1${!explore ? ' cote' : ''}`}>
        {enGuide ? <div className="phc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="phc-carte">{panneauHypo}</div> : null}
        <div className="phc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'conc' ? suiviC : suiviA}/></div>}
          {!(enDefi && defi && defi.type === 'aberr') && <div className={`phc-pri${!explore ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {peutDiluer && <div className="phc-in">{reglages}</div>}
              {(!enGuide || deja('solution')) && <div className="phc-in">{mesures}</div>}
            </div>
          </div>}
          <div className="phc-l2">
            {tableau && <div className="phc-in">{tableau}</div>}
            {graphique && <div className="phc-in">{graphique}</div>}
          </div>
        </div>
      </div>
      {explore && <div className="phc-l2">{aEssayer}{retenirExplore}</div>}
      {!enDefi && (!enGuide || deja('bravo')) && <div className="phc-l2">{panneauHypo}</div>}
    </div>
  );
}
