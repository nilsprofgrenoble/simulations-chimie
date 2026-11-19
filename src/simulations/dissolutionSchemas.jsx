// ====================================================
//  Schémas des cartes « À retenir » de la simulation « Dissolution d'un solide ionique dans l'eau : équation et concentration des ions » (1G, sim 157).
//  viewBox de 300 de large (le schéma s'affiche à environ 230 px sur téléphone, soit un facteur 0,77) : textes de 12,5 à 17 ; plafonnés à 320 px (maxWidth).
//  Couleurs : cation = bleu, anion = vert, orange = grandeur à repérer, rouge = piège.
// ====================================================
import { Ion, Eau } from "./dissolutionScenes";
import { COL } from "./dissolutionDessin";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const rad = d => d * Math.PI / 180;
// couronne d'eau autour d'un ion (anion : H vers l'ion ; cation : O vers l'ion), molécules réduites (k)
const Couronne = ({ x, y, r, plus, n = 4, phase = 20, k = 0.75 }) => Array.from({ length: n }, (_, i) => {
  const a = phase + i * 360 / n, d = r + 19 * k;
  return <Eau key={i} x={x + d * Math.cos(rad(a))} y={y + d * Math.sin(rad(a))} bis={plus ? a : a + 180} k={k} />;
});

// ---------- carte 1 : le cristal ionique et sa formule statistique ----------
export function SvgCristal() {
  const ions = [];
  for (let l = 0; l < 3; l++) for (let k = 0; k < 4; k++) { const plus = (k + l) % 2 === 0; ions.push(<Ion key={`${k}${l}`} x={26 + k * 30} y={30 + l * 30} r={plus ? 10.5 : 12} plus={plus} />); }
  return (
    <svg viewBox="0 0 300 244" style={stl} role="img"
      aria-label="Un cristal de chlorure de sodium est un empilement régulier d’ions Na plus et Cl moins en nombres égaux. La formule NaCl est une formule statistique : un ion sodium pour un ion chlorure. MgCl2 : un ion magnésium Mg2 plus pour deux ions chlorure. Le cristal est neutre : les charges positives égalent les charges négatives. Piège : pas de molécule NaCl dans le cristal, seulement des ions.">
      <rect x="4" y="8" width="124" height="104" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      {ions}
      <text x="66" y="128" fontSize="13" textAnchor="middle" fill="#334155">cristal de NaCl</text>
      <text x="142" y="28" fontSize="17" fontWeight="700" fill={COL.encre}>NaCl</text>
      <text x="142" y="46" fontSize="13" fill={COL.cat}>1 Na⁺ pour 1 Cl⁻</text>
      <text x="142" y="76" fontSize="17" fontWeight="700" fill={COL.encre}>MgCl₂</text>
      <text x="142" y="94" fontSize="13" fill={COL.cat}>1 Mg²⁺ pour 2 Cl⁻</text>
      <text x="142" y="112" fontSize="13" fill="#334155">formule statistique</text>
      <rect x="6" y="140" width="288" height="32" rx="8" fill="#eff6ff" stroke={COL.cat} />
      <text x="150" y="161" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.cat}>neutre : charges + = charges −</text>
      <rect x="6" y="184" width="288" height="50" rx="8" fill="#fef2f2" stroke={COL.rouge} />
      <text x="150" y="205" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : pas de molécule NaCl</text>
      <text x="150" y="223" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.rouge}>dans le cristal, que des ions</text>
    </svg>);
}

// ---------- carte 2 : les trois temps ----------
export function SvgTroisTemps() {
  const P = i => i * 102;
  return (
    <svg viewBox="0 0 300 186" style={stl} role="img"
      aria-label="Les trois temps de la dissolution. Un : dissociation, des molécules d’eau s’insèrent entre un cation et un anion et affaiblissent leur attraction. Deux : solvatation, des molécules d’eau entourent un ion, hydrogènes vers l’anion. Trois : dispersion, les ions entourés d’eau s’éloignent dans la solution.">
      {[0, 1, 2].map(i => <rect key={i} x={P(i)} y="4" width="96" height="118" rx="8" fill={COL.eau} opacity="0.45" />)}
      {/* 1 : dissociation */}
      <Ion x={P(0) + 30} y={66} r={11} plus={false} /><Ion x={P(0) + 68} y={66} r={10} plus />
      <Eau x={P(0) + 49} y={30} bis={90} k={0.8} /><Eau x={P(0) + 49} y={104} bis={-90} k={0.8} />
      <Eau x={P(0) + 14} y={28} bis={60} k={0.8} /><Eau x={P(0) + 84} y={28} bis={120} k={0.8} />
      {/* 2 : solvatation */}
      <Couronne x={P(1) + 48} y={62} r={12} plus={false} n={5} phase={10} k={0.8} /><Ion x={P(1) + 48} y={62} r={12} plus={false} />
      {/* 3 : dispersion */}
      <Couronne x={P(2) + 24} y={28} r={9} plus n={3} phase={40} k={0.6} /><Ion x={P(2) + 24} y={28} r={9} plus />
      <Couronne x={P(2) + 72} y={38} r={11} plus={false} n={4} phase={20} k={0.6} /><Ion x={P(2) + 72} y={38} r={11} plus={false} />
      <Couronne x={P(2) + 30} y={86} r={11} plus={false} n={4} phase={50} k={0.6} /><Ion x={P(2) + 30} y={86} r={11} plus={false} />
      <Couronne x={P(2) + 74} y={92} r={9} plus n={3} phase={100} k={0.6} /><Ion x={P(2) + 74} y={92} r={9} plus />
      {['1. Dissocier', '2. Solvater', '3. Disperser'].map((t, i) => <text key={i} x={P(i) + 48} y="144" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.encre}>{t}</text>)}
      {[['l’eau sépare', 'les ions'], ['l’eau entoure', 'chaque ion'], ['les ions', 's’éloignent']].map(([a, b], i) => (
        <g key={i}><text x={P(i) + 48} y="162" fontSize="12.5" textAnchor="middle" fill="#334155">{a}</text><text x={P(i) + 48} y="177" fontSize="12.5" textAnchor="middle" fill="#334155">{b}</text></g>))}
    </svg>);
}

// ---------- carte 3 : l'équation de dissolution ----------
export function SvgEquation() {
  return (
    <svg viewBox="0 0 300 210" style={stl} role="img"
      aria-label="Équation de dissolution du chlorure de magnésium : MgCl2 solide donne un ion Mg2 plus aqueux et deux ions Cl moins aqueux. Le symbole s désigne le solide, aq un ion entouré d’eau, le coefficient 2 est le nombre d’ions Cl moins par formule. La charge est conservée : zéro égale plus deux plus deux fois moins un. On n’écrit pas H2O.">
      <g fontSize="15" fontWeight="700" fill={COL.encre}>
        <text x="4" y="26">MgCl₂(s)</text><text x="80" y="26">→</text><text x="104" y="26" fill={COL.cat}>Mg²⁺(aq)</text><text x="184" y="26">+</text><text x="202" y="26" fill={COL.an}>2 Cl⁻(aq)</text>
      </g>
      <g stroke={COL.gris} strokeWidth="1.5"><line x1="36" y1="32" x2="36" y2="42" /><line x1="140" y1="32" x2="140" y2="42" /><line x1="242" y1="32" x2="242" y2="42" /></g>
      <g fontSize="12.5" fill="#334155" textAnchor="middle">
        <text x="36" y="56">(s) :</text><text x="36" y="71">solide</text>
        <text x="140" y="56">(aq) : ion</text><text x="140" y="71">entouré d’eau</text>
        <text x="242" y="56">2 : ions Cl⁻</text><text x="242" y="71">par formule</text>
      </g>
      <rect x="6" y="88" width="288" height="52" rx="8" fill="#f0fdf4" stroke={COL.an} />
      <text x="150" y="108" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.an}>Bilan de charge</text>
      <text x="150" y="128" fontSize="15" textAnchor="middle" fill={COL.encre}>0 = (+2) + 2 × (−1)</text>
      <rect x="6" y="152" width="288" height="50" rx="8" fill="#fef2f2" stroke={COL.rouge} />
      <text x="150" y="172" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : on n’écrit pas H₂O</text>
      <text x="150" y="190" fontSize="13" textAnchor="middle" fill={COL.rouge}>l’eau est le solvant</text>
    </svg>);
}

// ---------- carte 4 : concentration effective ----------
export function SvgConcEffective() {
  const L = v => 700 * v;   // 0,100 mol/L → 70
  const lignes = [['c (soluté apporté)', 0.100, COL.orange, '0,100 mol/L'], ['[Mg²⁺]', 0.100, COL.cat, '0,100 mol/L'], ['[Cl⁻]', 0.200, COL.an, '0,200 mol/L']];
  return (
    <svg viewBox="0 0 300 246" style={stl} role="img"
      aria-label="Pour une solution de chlorure de magnésium de concentration en soluté apporté c égale à 0,100 mol par litre, la concentration en ions Mg2 plus vaut 0,100 mol par litre et la concentration en ions Cl moins vaut 0,200 mol par litre : concentration d’un ion égale coefficient multiplié par c. Piège : la concentration en Cl moins n’est pas égale à c.">
      <text x="150" y="20" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.encre}>MgCl₂(s) → Mg²⁺(aq) + 2 Cl⁻(aq)</text>
      {lignes.map(([nom, v, col, txt], i) => (
        <g key={i}>
          <text x="8" y={48 + i * 42} fontSize="13.5" fontWeight="700" fill={COL.encre}>{nom}</text>
          <rect x="8" y={54 + i * 42} width={L(v)} height="16" rx="3" fill={col} opacity="0.9" />
          <text x={14 + L(v)} y={67 + i * 42} fontSize="13" fontWeight="700" fill={COL.encre}>{txt}</text>
        </g>))}
      <rect x="6" y="178" width="288" height="26" rx="8" fill="#fffbeb" stroke={COL.orange} />
      <text x="150" y="196" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.orange}>[ion] = coefficient × c</text>
      <rect x="6" y="212" width="288" height="26" rx="8" fill="#fef2f2" stroke={COL.rouge} />
      <text x="150" y="230" fontSize="13" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : [Cl⁻] n’est pas égale à c</text>
    </svg>);
}

// ---------- carte 5 : de la masse aux ions ----------
export function SvgMasseIons() {
  const boites = [['m = 2,22 g de CaCl₂', COL.encre], ['n ≈ 1,998 × 10⁻² mol', COL.encre], ['c ≈ 0,0799 mol/L', COL.orange], ['[Cl⁻] ≈ 0,160 mol/L', COL.an]];
  const fleches = ['÷ M (111,1 g/mol)', '÷ V (0,2500 L)', '× coefficient de Cl⁻ (2)'];
  return (
    <svg viewBox="0 0 300 252" style={stl} role="img"
      aria-label="Chaîne de calcul : une masse de 2,22 grammes de chlorure de calcium, divisée par la masse molaire 111,1 grammes par mole, donne environ 1,998 centièmes de mole, soit 0,01998 mole ; divisée par le volume 0,2500 litre, cela donne une concentration en soluté apporté d’environ 0,0799 mole par litre ; multipliée par le coefficient 2 de l’équation, cela donne une concentration en ions chlorure d’environ 0,160 mole par litre.">
      {boites.map(([t, col], i) => (
        <g key={i}>
          <rect x="8" y={6 + i * 62} width="170" height="36" rx="8" fill="#f8fafc" stroke={col} strokeWidth="2" />
          <text x="93" y={29 + i * 62} fontSize="14" fontWeight="700" textAnchor="middle" fill={col}>{t}</text>
          {i < 3 && <g><path d={`M40,${42 + i * 62} L40,${64 + i * 62}`} stroke={COL.gris} strokeWidth="2.5" fill="none" /><path d={`M34,${58 + i * 62} L40,${66 + i * 62} L46,${58 + i * 62} Z`} fill={COL.gris} />
            <text x="54" y={59 + i * 62} fontSize="12.5" fill="#334155">{fleches[i]}</text></g>}
        </g>))}
    </svg>);
}
