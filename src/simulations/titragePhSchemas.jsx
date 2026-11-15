import * as M from "./titragePhModele";

// ====================================================
//  Schémas des cartes « À retenir » de la simulation 118 (titrage pH-métrique, TG).
//  Couleurs : bleu = donnée / liant, orange = grandeur à repérer, vert = bon, rouge = piège, violet = acide, vert d'eau = base conjuguée.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', acide: '#6d28d9', base: '#0e7490', ho: '#c2410c' };
const ETHA = { acide: 'etha', C0: 0.080, V0: 20.0, Cb: 0.100 }, HCL = { ...ETHA, acide: 'hcl' };
const chemin = (pts, X, Y, cle = 'pH') => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.V).toFixed(1)},${Y(p[cle]).toFixed(1)}`).join('');
const stl = { width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Sub = ({ children }) => <tspan baselineShift="sub" fontSize="0.75em">{children}</tspan>;
const Sup = ({ children }) => <tspan baselineShift="super" fontSize="0.75em">{children}</tspan>;

// ---- 1. Réaction support : transfert de H⁺ et transformation totale
export function SvgReaction() {
  return (
    <svg viewBox="0 0 360 206" role="img" aria-label="Le titrage est un transfert d’ion H plus : l’acide éthanoïque CH3COOH du couple CH3COOH sur CH3COO moins cède H plus à l’ion HO moins du couple H2O sur HO moins. L’équation est CH3COOH plus HO moins donne CH3COO moins plus H2O. La constante K vaut environ 1,6 fois 10 puissance 9 : la transformation est totale" style={stl}>
      <defs><marker id="th" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COL.orange}/></marker></defs>
      <rect x="12" y="34" width="142" height="54" rx="10" fill="#f5f3ff" stroke={COL.acide} strokeWidth="2"/>
      <text x="83" y="58" fontSize="16" fontWeight="700" fill={COL.acide} textAnchor="middle">CH<Sub>3</Sub>COOH</text>
      <text x="83" y="78" fontSize="13" fill="#334155" textAnchor="middle">acide (donneur de H⁺)</text>
      <rect x="206" y="34" width="142" height="54" rx="10" fill="#fff7ed" stroke={COL.ho} strokeWidth="2"/>
      <text x="277" y="58" fontSize="16" fontWeight="700" fill={COL.ho} textAnchor="middle">HO⁻</text>
      <text x="277" y="78" fontSize="13" fill="#334155" textAnchor="middle">base (receveur de H⁺)</text>
      <path d="M150 40 C 168 6, 192 6, 210 40" fill="none" stroke={COL.orange} strokeWidth="2.4" markerEnd="url(#th)"/>
      <text x="180" y="22" fontSize="16" fontWeight="700" fill={COL.orange} textAnchor="middle">H⁺</text>
      <text x="180" y="118" fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">CH<Sub>3</Sub>COOH + HO⁻ → CH<Sub>3</Sub>COO⁻ + H<Sub>2</Sub>O</text>
      <text x="180" y="138" fontSize="11.5" fill="#475569" textAnchor="middle">Na⁺ : ion spectateur (il ne réagit pas)</text>
      <text x="180" y="162" fontSize="13" fill="#0f172a" textAnchor="middle"><tspan fontStyle="italic">K</tspan> = <tspan fontStyle="italic">K</tspan><Sub>A</Sub> / <tspan fontStyle="italic">K</tspan><Sub>e</Sub> = 10<Sup>14 − 4,8</Sup> ≈ 1,6 × 10<Sup>9</Sup></text>
      <text x="180" y="188" fontSize="13.5" fontWeight="700" fill={COL.vert} textAnchor="middle">K très grand ⇒ transformation totale</text>
    </svg>);
}

// ---- 2. Composition avant, à, après l'équivalence
export function SvgComposition() {
  const base = 150, k = 50;   // 1 mmol = 50 px
  const groupes = [
    { cx: 66, titre: 'V', v: '4,0', sous: 'avant V', e: false, n: [1.2, 0.4, 0] },
    { cx: 180, titre: 'V', v: '16,0', sous: 'équivalence', e: true, n: [0, 1.6, 0] },
    { cx: 294, titre: 'V', v: '22,0', sous: 'après V', e: false, n: [0, 1.6, 0.6] },
  ];
  const coul = [COL.acide, COL.base, COL.ho];
  const fmt = x => String(x.toFixed(2)).replace('.', ',');
  return (
    <svg viewBox="0 0 360 232" role="img" aria-label="Quantités de matière en millimoles de CH3COOH, CH3COO moins et HO moins : à 4,0 millilitres il reste 1,20 d’acide pour 0,40 de base conjuguée ; à l’équivalence, 16,0 millilitres, il ne reste que 1,60 de CH3COO moins ; à 22,0 millilitres il y a en plus 0,60 d’ions HO moins en excès" style={stl}>
      <line x1="10" y1={base} x2="350" y2={base} stroke="#94a3b8" strokeWidth="1.2"/>
      {groupes.map(g => (
        <g key={g.v}>
          {g.e && <rect x={g.cx - 52} y="8" width="104" height="176" rx="8" fill="#ecfdf5" stroke={COL.vert} strokeDasharray="4 3"/>}
          {g.n.map((n, i) => {
            const x = g.cx - 33 + i * 24, h = n * k;
            return (<g key={i}>
              <rect x={x} y={base - h} width="20" height={Math.max(h, 0.5)} rx="2" fill={coul[i]} opacity="0.88"/>
              <text x={x + 10} y={base - h - 4} fontSize="11" fontWeight="700" fill="#0f172a" textAnchor="middle">{n === 0 ? '0' : fmt(n)}</text>
            </g>);
          })}
          <text x={g.cx} y={base + 16} fontSize="12.5" fontWeight="700" fill="#0f172a" textAnchor="middle">V<Sub>B</Sub> = {g.v} mL</text>
          <text x={g.cx} y={base + 31} fontSize="11.5" fill={g.e ? COL.vert : '#475569'} fontWeight={g.e ? 700 : 400} textAnchor="middle">{g.sous}{g.sous.startsWith('équi') ? '' : <Sub>E</Sub>}</text>
        </g>))}
      {[['CH₃COOH', COL.acide, 34], ['CH₃COO⁻', COL.base, 124], ['HO⁻ (excès)', COL.ho, 214]].map(([t, c, x]) => (
        <g key={t}><rect x={x} y="196" width="11" height="11" fill={c}/><text x={x + 16} y="206" fontSize="11.5" fill="#0f172a">{t}</text></g>))}
      <text x="180" y="226" fontSize="11.5" fill="#334155" textAnchor="middle">quantités en mmol ; avant V<Sub>E</Sub>, HO⁻ est le réactif limitant</text>
    </svg>);
}

// ---- 3. Repérer V_E : saut de pH et maximum de la dérivée
export function SvgRepererVE() {
  const pts = M.courbe(ETHA, 25, 250), dmax = Math.max(...pts.map(p => p.d));
  const X = v => 36 + v / 25 * 308, Y = p => 150 - p / 14 * 128, Yd = d => 150 - 118 * d / dmax;
  return (
    <svg viewBox="0 0 360 206" role="img" aria-label="Courbe de titrage pH en fonction du volume de soude versé : un saut de pH autour de 16,0 millilitres. La courbe dérivée, en vert pointillé, passe par un maximum au même volume : c’est le volume équivalent V E" style={stl}>
      <line x1="36" y1="150" x2="344" y2="150" stroke="#94a3b8"/><line x1="36" y1="22" x2="36" y2="150" stroke="#94a3b8"/>
      {[0, 7, 14].map(p => <g key={p}><line x1="33" y1={Y(p)} x2="36" y2={Y(p)} stroke="#64748b"/><text x="30" y={Y(p) + 4} fontSize="11" textAnchor="end" fill="#334155">{p}</text></g>)}
      {[0, 5, 10, 15, 20, 25].map(v => <text key={v} x={X(v)} y="164" fontSize="11" textAnchor="middle" fill="#334155">{v}</text>)}
      <text x="190" y="179" fontSize="11.5" textAnchor="middle" fill="#334155">V<Sub>B</Sub> (mL)</text><text x="8" y="14" fontSize="11.5" fill="#334155">pH</text>
      <path d={chemin(pts, X, Yd, 'd')} fill="none" stroke={COL.vert} strokeWidth="1.8" strokeDasharray="5 3"/>
      <path d={chemin(pts, X, Y)} fill="none" stroke={COL.bleu} strokeWidth="2.6"/>
      <line x1={X(16)} y1="22" x2={X(16)} y2="150" stroke={COL.orange} strokeWidth="1.6" strokeDasharray="3 3"/>
      <circle cx={X(16)} cy={Y(M.pHEq(ETHA))} r="5.5" fill={COL.orange} stroke="#0f172a"/>
      <text x={X(16) + 8} y="30" fontSize="12.5" fontWeight="700" fill={COL.orange}>V<Sub>E</Sub> = 16,0 mL</text>
      <text x={X(16) - 6} y={Yd(dmax) + 14} fontSize="11.5" fontWeight="700" fill={COL.vert} textAnchor="end">dpH/dV<Sub>B</Sub> maximale</text>
      <text x={X(2.3)} y={Y(3.4) - 8} fontSize="11.5" fill={COL.bleu} fontWeight="700">pH</text>
      <text x="190" y="199" fontSize="12" fontWeight="700" fill="#0f172a" textAnchor="middle">équivalence = saut de pH = maximum de dpH/dV</text>
    </svg>);
}

// ---- 4. pH à l'équivalence : acide fort et acide faible ; diagramme de prédominance
export function SvgPhEquivalence() {
  const pf = M.courbe(HCL, 25, 250), pw = M.courbe(ETHA, 25, 250);
  const X = v => 34 + v / 25 * 300, Y = p => 126 - p / 14 * 108;
  const pHe = M.pHEq(ETHA), xs = p => 24 + p / 14 * 312;
  return (
    <svg viewBox="0 0 360 232" role="img" aria-label="Deux courbes de titrage par la soude : pour l’acide chlorhydrique le pH à l’équivalence vaut 7,0 ; pour l’acide éthanoïque il vaut 8,7, au-dessus de 7. Dessous, le diagramme de prédominance du couple CH3COOH sur CH3COO moins de pKA 4,8 : au pH de l’équivalence, CH3COO moins prédomine" style={stl}>
      <line x1="34" y1="126" x2="336" y2="126" stroke="#94a3b8"/><line x1="34" y1="18" x2="34" y2="126" stroke="#94a3b8"/>
      <line x1="34" y1={Y(7)} x2="336" y2={Y(7)} stroke="#94a3b8" strokeDasharray="4 3"/><text x="338" y={Y(7) - 3} fontSize="10.5" fill="#475569" textAnchor="end">pH = 7</text>
      {[0, 7, 14].map(p => <text key={p} x="29" y={Y(p) + 4} fontSize="10.5" textAnchor="end" fill="#334155">{p}</text>)}
      <text x="190" y="140" fontSize="11" textAnchor="middle" fill="#334155">V<Sub>B</Sub> (mL)</text>
      <path d={chemin(pf, X, Y)} fill="none" stroke={COL.bleu} strokeWidth="2.4"/><path d={chemin(pw, X, Y)} fill="none" stroke={COL.acide} strokeWidth="2.4"/>
      <circle cx={X(16)} cy={Y(7)} r="5" fill={COL.bleu} stroke="#0f172a"/><circle cx={X(16)} cy={Y(pHe)} r="5" fill={COL.acide} stroke="#0f172a"/>
      <text x={X(16) + 8} y={Y(7) + 15} fontSize="11.5" fontWeight="700" fill={COL.bleu}>HCl : pH<Sub>E</Sub> = 7,0</text>
      <text x={X(16) + 8} y={Y(pHe) - 6} fontSize="11.5" fontWeight="700" fill={COL.acide}>CH₃COOH : pH<Sub>E</Sub> = 8,7</text>
      <rect x={xs(0)} y="168" width={xs(4.8) - xs(0)} height="24" fill="#ede9fe"/><rect x={xs(4.8)} y="168" width={xs(14) - xs(4.8)} height="24" fill="#cffafe"/>
      <text x={(xs(0) + xs(4.8)) / 2} y="184" fontSize="11.5" fontWeight="700" fill={COL.acide} textAnchor="middle">CH₃COOH</text><text x={(xs(4.8) + xs(14)) / 2 - 24} y="184" fontSize="11.5" fontWeight="700" fill={COL.base} textAnchor="middle">CH₃COO⁻ prédomine</text>
      <line x1={xs(4.8)} y1="164" x2={xs(4.8)} y2="196" stroke="#0f172a" strokeWidth="1.6"/><text x={xs(4.8)} y="208" fontSize="11.5" fill="#0f172a" textAnchor="middle">pK<Sub>A</Sub> = 4,8</text>
      <polygon points={`${xs(pHe) - 6},162 ${xs(pHe) + 6},162 ${xs(pHe)},170`} fill={COL.orange}/><text x={xs(pHe)} y="158" fontSize="11.5" fontWeight="700" fill={COL.orange} textAnchor="middle">pH<Sub>E</Sub></text>
      <text x="180" y="226" fontSize="11.5" fill="#334155" textAnchor="middle">pH (échelle de 0 à 14)</text>
    </svg>);
}

// ---- 5. Choix de l'indicateur : la zone de virage doit contenir pH_E
export function SvgIndicateur() {
  const pts = M.courbe(ETHA, 25, 250), pHe = M.pHEq(ETHA);
  const X = v => 36 + v / 25 * 300, Y = p => 150 - p / 14 * 130;
  const bande = (a, b, c, t, x, ok) => (<g>
    <rect x="36" y={Y(b)} width="300" height={Y(a) - Y(b)} fill={c} opacity="0.2"/>
    <rect x="36" y={Y(b)} width="300" height={Y(a) - Y(b)} fill="none" stroke={c} strokeDasharray="4 3"/>
    <text x={x} y={Y((a + b) / 2) + 4} fontSize="11.5" fontWeight="700" fill={c}>{t} {ok ? '✓' : '✗'}</text></g>);
  return (
    <svg viewBox="0 0 360 214" role="img" aria-label="Courbe de titrage de l’acide éthanoïque avec deux zones de virage : le bleu de bromothymol, de pH 6,0 à 7,6, ne contient pas le pH à l’équivalence 8,7 et ne convient pas ; le bleu de thymol, de pH 8,0 à 9,6, le contient et convient" style={stl}>
      <line x1="36" y1="150" x2="336" y2="150" stroke="#94a3b8"/><line x1="36" y1="20" x2="36" y2="150" stroke="#94a3b8"/>
      {[0, 7, 14].map(p => <text key={p} x="31" y={Y(p) + 4} fontSize="10.5" textAnchor="end" fill="#334155">{p}</text>)}
      <text x="186" y="166" fontSize="11" textAnchor="middle" fill="#334155">V<Sub>B</Sub> (mL)</text>
      {bande(6.0, 7.6, COL.rouge, 'BBT (6,0 – 7,6)', 44, false)}
      {bande(8.0, 9.6, COL.vert, 'bleu de thymol (8,0 – 9,6)', 44, true)}
      <path d={chemin(pts, X, Y)} fill="none" stroke={COL.bleu} strokeWidth="2.6"/>
      <circle cx={X(16)} cy={Y(pHe)} r="5.5" fill={COL.orange} stroke="#0f172a"/>
      <text x={X(16) - 8} y={Y(9.6) - 7} fontSize="12" fontWeight="700" fill={COL.orange} textAnchor="end">pH<Sub>E</Sub> = 8,7</text>
      <text x="180" y="186" fontSize="12" fontWeight="700" fill="#0f172a" textAnchor="middle">choisir l’indicateur dont la zone de virage</text>
      <text x="180" y="203" fontSize="12" fontWeight="700" fill="#0f172a" textAnchor="middle">contient le pH à l’équivalence</text>
    </svg>);
}
