import { KIT } from "../commun";
import { TV } from "./Travail";
import { COL, cramElems, Cram, EchelleDeltaChi } from "./geometrieScenes";
import * as M from "./geometrieModele";

// Schémas des cartes « À retenir » de la sim 155 (viewBox de 300 de large, textes de 13 à 16, tout le texte dans le cadre).
const cadre = { display: 'block', width: '100%', maxWidth: 320, margin: '4px auto 8px', background: '#fff', borderRadius: 8 };
const RAD = Math.PI / 180;
const MOINS = '−';

// ----- carte 1 : trois arrangements de doublets -----
export function SvgDoublets() {
  const pan = (cx, titre, angle, desc, figure) => (
    <g key={titre}>
      {figure}
      <text x={cx} y="124" textAnchor="middle" fontSize="15" fontWeight="800" fill={KIT.txt}>{titre}</text>
      <text x={cx} y="143" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>{angle}</text>
      <text x={cx} y="162" textAnchor="middle" fontSize="13.5" fill={KIT.txt2}>{desc}</text>
    </g>);
  const bras = (cx, cy, angles, L = 34, pre) => angles.map((a, i) => <g key={`${pre}${i}`}><line x1={cx} y1={cy} x2={cx + L * Math.cos(a * RAD)} y2={cy - L * Math.sin(a * RAD)} stroke="#6d28d9" strokeWidth="5" strokeLinecap="round"/><circle cx={cx + L * Math.cos(a * RAD)} cy={cy - L * Math.sin(a * RAD)} r="5" fill="#c4b5fd" stroke="#6d28d9" strokeWidth="1.5"/></g>);
  const A = (cx, cy) => <circle cx={cx} cy={cy} r="11" fill="#a8a29e" stroke="#1e293b" strokeWidth="1.2"/>;
  return (
    <svg viewBox="0 0 300 176" role="img" aria-label="Trois arrangements de doublets autour d’un atome A : deux doublets à 180 degrés (digonal), trois à 120 degrés (trigonal), quatre à 109,5 degrés (tétragonal)." style={cadre}>
      {pan(50, 'digonal', '180°', '2 doublets', <g>{bras(50, 66, [0, 180], 36, 'a')}{A(50, 66)}<text x="50" y="71" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">A</text></g>)}
      {pan(150, 'trigonal', '120°', '3 doublets', <g>{bras(150, 66, [90, 210, 330], 36, 'b')}{A(150, 66)}<text x="150" y="71" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">A</text></g>)}
      {pan(250, 'tétragonal', '109,5°', '4 doublets', <g>
        <line x1="250" y1="66" x2="226" y2="38" stroke="#6d28d9" strokeWidth="5" strokeLinecap="round"/><circle cx="226" cy="38" r="5" fill="#c4b5fd" stroke="#6d28d9" strokeWidth="1.5"/>
        <line x1="250" y1="66" x2="226" y2="94" stroke="#6d28d9" strokeWidth="5" strokeLinecap="round"/><circle cx="226" cy="94" r="5" fill="#c4b5fd" stroke="#6d28d9" strokeWidth="1.5"/>
        <polygon points="250,66 280,46 284,58" fill="#6d28d9"/><circle cx="283" cy="52" r="5" fill="#c4b5fd" stroke="#6d28d9" strokeWidth="1.5"/>
        {[1, 2, 3, 4, 5].map(t => { const f = t / 5.5; return <line key={t} x1={250 + 26 * f} y1={66 + 34 * f - 1 - 4 * f} x2={250 + 26 * f} y2={66 + 34 * f + 1 + 4 * f} stroke="#6d28d9" strokeWidth="2"/>; })}
        <circle cx="277" cy="102" r="5" fill="#c4b5fd" stroke="#6d28d9" strokeWidth="1.5"/>{A(250, 66)}<text x="250" y="71" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">A</text></g>)}
    </svg>);
}

// ----- carte 2 : de AXnEm à la forme (cinq formes du programme) -----
export function SvgFormes() {
  const cell = (cx, cy, nom, axe, liens, centreSym = 'A') => (
    <g key={nom}>
      {cramElems({ centreSym, liens, cx, cy, k: 0.5, fs: 15, pre: nom })}
      <text x={cx} y={cy + 52} textAnchor="middle" fontSize="14" fontWeight="800" fill={KIT.txt}>{nom}</text>
      <text x={cx} y={cy + 70} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>{axe}</text>
    </g>);
  const X = (x, y, st = 'plan') => ({ s: 'X', x, y, st });
  return (
    <svg viewBox="0 -8 300 290" role="img" aria-label="Cinq formes : linéaire (AX₂E₀), coudée (AX₂E₂), trigonale plane (AX₃E₀), pyramidale (AX₃E₁), tétraédrique (AX₄E₀)." style={cadre}>
      {cell(50, 40, 'linéaire', 'AX₂E₀', [X(-70, 0), X(70, 0)])}
      {cell(150, 40, 'coudée', 'AX₂E₂', [X(-52, 42), X(52, 42)])}
      {cell(250, 40, 'trigonale plane', 'AX₃E₀', [X(0, -64), X(-62, 40), X(62, 40)])}
      {cell(100, 168, 'pyramidale', 'AX₃E₁', [X(0, -60), X(-62, 40, 'avant'), X(62, 40, 'arriere')])}
      {cell(220, 168, 'tétraédrique', 'AX₄E₀', [X(-30, -52), X(-30, 52), X(54, -34, 'arriere'), X(54, 34, 'avant')])}
    </svg>);
}

// ----- carte 3 : représentation de Cram -----
export function SvgCram() { return <Cram ent={M.entite('CH4')} maxWidth={300} legende aria="Représentation de Cram du méthane : deux liaisons dans le plan, une en avant (triangle plein), une en arrière (pointillés)."/>; }

// ----- carte 4 : liaison polarisée et échelle des Δχ -----
export function SvgLiaison() {
  return (
    <div>
      <svg viewBox="0 0 300 118" role="img" aria-label="Liaison H–Cl : le doublet est plus proche de Cl, l’atome le plus électronégatif, qui porte la charge partielle moins delta ; H porte plus delta." style={cadre}>
        <circle cx="86" cy="68" r="20" fill={M.COUL_ATOME.H} stroke="#64748b" strokeWidth="1.5"/><text x="86" y="75" textAnchor="middle" fontSize="20" fontWeight="800" fill={KIT.txt}>H</text>
        <circle cx="198" cy="68" r="32" fill={M.COUL_ATOME.Cl} stroke="#1e293b" strokeWidth="1.5"/><text x="198" y="76" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">Cl</text>
        <ellipse cx="152" cy="68" rx="22" ry="12" fill="#c4b5fd" fillOpacity="0.65" stroke="#6d28d9" strokeWidth="1.6"/>
        <circle cx="146" cy="68" r="2.4" fill="#4c1d95"/><circle cx="158" cy="68" r="2.4" fill="#4c1d95"/>
        <text x="86" y="32" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.bleu}>+δ</text>
        <text x="198" y="32" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.rouge}>{MOINS}δ</text>
        <text x="150" y="112" textAnchor="middle" fontSize="14" fontWeight="700" fill={KIT.txt}>Le doublet est plus près de Cl</text>
      </svg>
      <EchelleDeltaChi marques={[{ d: 0.3, etiq: 'C–H' }, { d: 0.8, etiq: 'N–H' }, { d: 0.8, etiq: 'H–Cl' }, { d: 1.3, etiq: 'O–H' }, { d: 2.1, etiq: 'Na–Cl' }]} titre="Δχ et type de liaison (convention du cours)" maxWidth={320}/>
    </div>);
}

// ----- carte 5 : CO₂ et H₂O, G⁺ et G⁻ -----
export function SvgPolaire() {
  const at = (x, y, s, r = 14) => <g key={`${s}${x}`}><circle cx={x} cy={y} r={r} fill={M.COUL_ATOME[s]} stroke={s === 'H' ? '#64748b' : '#1e293b'} strokeWidth="1.3"/><text x={x} y={y + 5.5} textAnchor="middle" fontSize="16" fontWeight="800" fill={s === 'H' ? KIT.txt : '#fff'}>{s}</text></g>;
  return (
    <svg viewBox="0 0 300 196" role="img" aria-label="CO₂ linéaire : G plus et G moins sont confondus, la molécule est apolaire. H₂O coudée : G plus entre les deux H et G moins sur O sont distincts, la molécule est polaire, avec un vecteur moment dipolaire de G moins vers G plus." style={cadre}>
      <line x1="150" y1="6" x2="150" y2="132" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4"/>
      {/* CO2 */}
      <line x1="25" y1="64" x2="125" y2="64" stroke="#64748b" strokeWidth="4"/>
      {at(25, 64, 'O')}{at(75, 64, 'C')}{at(125, 64, 'O')}
      <text x="25" y="34" textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.rouge}>{MOINS}δ</text>
      <text x="75" y="34" textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.bleu}>+2δ</text>
      <text x="125" y="34" textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.rouge}>{MOINS}δ</text>
      <circle cx="75" cy="64" r="22" fill="none" stroke={COL.noir} strokeWidth="2.6"/>
      <text x="75" y="106" textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.noir}>G⁺ = G⁻</text>
      {/* H2O */}
      <line x1="225" y1="34" x2="178" y2="74" stroke="#64748b" strokeWidth="4"/><line x1="225" y1="34" x2="272" y2="74" stroke="#64748b" strokeWidth="4"/>
      {at(225, 34, 'O')}{at(176, 76, 'H', 12)}{at(274, 76, 'H', 12)}
      <text x="259" y="26" fontSize="15" fontWeight="800" fill={COL.rouge}>{MOINS}2δ</text>
      <text x="176" y="102" textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.bleu}>+δ</text>
      <text x="274" y="102" textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.bleu}>+δ</text>
      <line x1="225" y1="52" x2="225" y2="68" stroke={COL.orange} strokeWidth="4" strokeLinecap="round"/><polygon points="225,78 219,66 231,66" fill={COL.orange}/>
      <circle cx="225" cy="80" r="5.5" fill="#fff" stroke={COL.bleu} strokeWidth="2.4"/>
      <TV x={236} y={86} s={19} c={COL.orange} halo>p</TV>
      <text x="225" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.noir}>G⁺ ≠ G⁻</text>
      <text x="75" y="150" textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.vert}>CO₂ apolaire</text>
      <text x="225" y="150" textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.rouge}>H₂O polaire</text>
      <text x="150" y="182" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={KIT.txt}>liaisons polarisées ≠ molécule polaire</text>
    </svg>);
}
