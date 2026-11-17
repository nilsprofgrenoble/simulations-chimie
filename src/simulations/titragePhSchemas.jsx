import * as M from "./titragePhModele";

// ====================================================
//  Schémas des cartes « À retenir » de la simulation Titrage pH-métrique (TG).
//  Tous les textes font au moins 14 unités du viewBox (≥ 12 px à l'écran sur téléphone).
//  Couleurs : bleu = donnée / liant, orange = grandeur à repérer, vert = bon, rouge = piège, violet = acide, vert d'eau = base conjuguée.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', acide: '#6d28d9', base: '#0e7490', ho: '#c2410c' };
const ETHA = { acide: 'etha', C0: 0.080, V0: 20.0, Cb: 0.100 }, HCL = { ...ETHA, acide: 'hcl' };
const chemin = (pts, X, Y, cle = 'pH') => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.V).toFixed(1)},${Y(p[cle]).toFixed(1)}`).join('');
const stl = { width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Sub = ({ children }) => <tspan baselineShift="sub" fontSize="0.75em">{children}</tspan>;

// ---- 1. Réaction support : transfert de H⁺ et transformation totale
export function SvgReaction() {
  return (
    <svg viewBox="0 0 360 226" role="img" aria-label="Le titrage est un transfert d’ion H plus : l’acide éthanoïque CH3COOH cède H plus à l’ion HO moins. L’équation est CH3COOH plus HO moins donne CH3COO moins plus H2O. La constante K vaut environ 1,6 fois 10 puissance 9 : la transformation est totale" style={stl}>
      <defs><marker id="th" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COL.orange}/></marker></defs>
      <rect x="8" y="40" width="152" height="60" rx="10" fill="#f5f3ff" stroke={COL.acide} strokeWidth="2"/>
      <text x="84" y="66" fontSize="18" fontWeight="700" fill={COL.acide} textAnchor="middle">CH₃COOH</text>
      <text x="84" y="89" fontSize="15.5" fill="#334155" textAnchor="middle">acide : donne H⁺</text>
      <rect x="200" y="40" width="152" height="60" rx="10" fill="#fff7ed" stroke={COL.ho} strokeWidth="2"/>
      <text x="276" y="66" fontSize="18" fontWeight="700" fill={COL.ho} textAnchor="middle">HO⁻</text>
      <text x="276" y="89" fontSize="15.5" fill="#334155" textAnchor="middle">base : reçoit H⁺</text>
      <path d="M150 44 C 168 20, 192 20, 210 44" fill="none" stroke={COL.orange} strokeWidth="2.4" markerEnd="url(#th)"/>
      <text x="180" y="17" fontSize="18" fontWeight="700" fill={COL.orange} textAnchor="middle">H⁺</text>
      <text x="180" y="132" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O</text>
      <text x="180" y="156" fontSize="15.5" fill="#475569" textAnchor="middle">Na⁺ : ion spectateur (il ne réagit pas)</text>
      <text x="180" y="184" fontSize="16" fill="#0f172a" textAnchor="middle"><tspan fontStyle="italic">K</tspan> ≈ 1,6 × 10⁹ ≫ 1</text>
      <text x="180" y="210" fontSize="16" fontWeight="700" fill={COL.vert} textAnchor="middle">⇒ transformation totale</text>
    </svg>);
}

// ---- 2. Composition avant, à, après l'équivalence
export function SvgComposition() {
  const base = 150, k = 50;   // 1 mmol = 50 unités
  const groupes = [
    { cx: 62, v: '4,0', sous: 'avant', e: false, n: [1.2, 0.4, 0] },
    { cx: 180, v: '16,0', sous: 'équivalence', e: true, n: [0, 1.6, 0] },
    { cx: 298, v: '22,0', sous: 'après', e: false, n: [0, 1.6, 0.6] },
  ];
  const coul = [COL.acide, COL.base, COL.ho];
  const fmt = x => String(x.toFixed(2)).replace('.', ',');
  return (
    <svg viewBox="0 0 360 240" role="img" aria-label="Quantités de matière en millimoles de CH3COOH, CH3COO moins et HO moins : à 4,0 millilitres il reste 1,20 d’acide pour 0,40 de base conjuguée ; à l’équivalence, 16,0 millilitres, il ne reste que 1,60 de CH3COO moins ; à 22,0 millilitres il y a en plus 0,60 d’ions HO moins en excès" style={stl}>
      <line x1="6" y1={base} x2="354" y2={base} stroke="#94a3b8" strokeWidth="1.2"/>
      {groupes.map(g => (
        <g key={g.v}>
          {g.e && <rect x={g.cx - 56} y="6" width="112" height="204" rx="8" fill="#ecfdf5" stroke={COL.vert} strokeDasharray="4 3"/>}
          {g.n.map((n, i) => {
            const x = g.cx - 42 + i * 30, h = n * k;
            return (<g key={i}>
              <rect x={x} y={base - h} width="24" height={Math.max(h, 0.5)} rx="2" fill={coul[i]} opacity="0.88"/>
              <text x={x + 12} y={base - h - 5} fontSize="15.5" fontWeight="700" fill="#0f172a" textAnchor="middle">{n === 0 ? '0' : fmt(n)}</text>
            </g>);
          })}
          <text x={g.cx} y={base + 20} fontSize="15.5" fontWeight="700" fill="#0f172a" textAnchor="middle">V<Sub>B</Sub> = {g.v} mL</text>
          <text x={g.cx} y={base + 48} fontSize="15.5" fill={g.e ? COL.vert : '#475569'} fontWeight={g.e ? 700 : 400} textAnchor="middle">{g.sous}</text>
        </g>))}
      {[['CH₃COOH', COL.acide, 8], ['CH₃COO⁻', COL.base, 128], ['HO⁻', COL.ho, 250]].map(([t, c, x]) => (
        <g key={t}><rect x={x} y="218" width="14" height="14" fill={c}/><text x={x + 20} y="231" fontSize="15.5" fill="#0f172a">{t}</text></g>))}
    </svg>);
}

// ---- 3. Repérer V_E : saut de pH et maximum de la dérivée
export function SvgRepererVE() {
  const pts = M.courbe(ETHA, 25, 250), dmax = Math.max(...pts.map(p => p.d));
  const X = v => 38 + v / 25 * 306, Y = p => 140 - p / 14 * 118, Yd = d => 140 - 108 * d / dmax;
  return (
    <svg viewBox="0 0 360 234" role="img" aria-label="Courbe de titrage pH en fonction du volume de soude versé : un saut de pH autour de 16,0 millilitres. La courbe dérivée, en vert pointillé, passe par un maximum au même volume : c’est le volume équivalent V E" style={stl}>
      <line x1="38" y1="140" x2="344" y2="140" stroke="#94a3b8"/><line x1="38" y1="22" x2="38" y2="140" stroke="#94a3b8"/>
      {[0, 7, 14].map(p => <g key={p}><line x1="34" y1={Y(p)} x2="38" y2={Y(p)} stroke="#64748b"/><text x="31" y={Y(p) + 5} fontSize="15.5" textAnchor="end" fill="#334155">{p}</text></g>)}
      {[0, 5, 10, 15, 20, 25].map(v => <text key={v} x={X(v)} y="158" fontSize="15.5" textAnchor="middle" fill="#334155">{v}</text>)}
      <text x="190" y="176" fontSize="15.5" textAnchor="middle" fill="#334155">V<Sub>B</Sub> (mL)</text>
      <path d={chemin(pts, X, Yd, 'd')} fill="none" stroke={COL.vert} strokeWidth="1.8" strokeDasharray="5 3"/>
      <path d={chemin(pts, X, Y)} fill="none" stroke={COL.bleu} strokeWidth="2.6"/>
      <line x1={X(16)} y1="22" x2={X(16)} y2="140" stroke={COL.orange} strokeWidth="1.6" strokeDasharray="3 3"/>
      <circle cx={X(16)} cy={Y(M.pHEq(ETHA))} r="5.5" fill={COL.orange} stroke="#0f172a"/>
      <text x={X(16) + 8} y="98" fontSize="16" fontWeight="700" fill={COL.orange}>V<Sub>E</Sub> = 16,0 mL</text>
      <text x={X(16) - 8} y={Yd(dmax) + 22} fontSize="15.5" fontWeight="700" fill={COL.vert} textAnchor="end">dérivée maximale</text>
      <text x={X(1.5)} y={Y(3.4) - 10} fontSize="15.5" fill={COL.bleu} fontWeight="700">pH</text>
      <text x="190" y="206" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">équivalence = saut de pH</text>
      <text x="190" y="226" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">= maximum de la dérivée</text>
    </svg>);
}

// ---- 4. pH à l'équivalence : acide fort et acide faible
export function SvgPhEquivalence() {
  const pf = M.courbe(HCL, 25, 250), pw = M.courbe(ETHA, 25, 250);
  const X = v => 38 + v / 25 * 306, Y = p => 150 - p / 14 * 128;
  const pHe = M.pHEq(ETHA);
  return (
    <svg viewBox="0 0 360 226" role="img" aria-label="Deux courbes de titrage par la soude : pour l’acide chlorhydrique le pH à l’équivalence vaut 7,0 ; pour l’acide éthanoïque il vaut 8,7, au-dessus de 7. Une ligne en pointillés marque pH égal 7" style={stl}>
      <line x1="38" y1="150" x2="344" y2="150" stroke="#94a3b8"/><line x1="38" y1="22" x2="38" y2="150" stroke="#94a3b8"/>
      <line x1="38" y1={Y(7)} x2="344" y2={Y(7)} stroke="#94a3b8" strokeDasharray="4 3"/>
      {[0, 7, 14].map(p => <text key={p} x="32" y={Y(p) + 5} fontSize="15.5" textAnchor="end" fill="#334155">{p}</text>)}
      <text x="190" y="172" fontSize="15.5" textAnchor="middle" fill="#334155">V<Sub>B</Sub> (mL)</text>
      <path d={chemin(pf, X, Y)} fill="none" stroke={COL.bleu} strokeWidth="2.6"/><path d={chemin(pw, X, Y)} fill="none" stroke={COL.acide} strokeWidth="2.6"/>
      <circle cx={X(16)} cy={Y(7)} r="5.5" fill={COL.bleu} stroke="#0f172a"/><circle cx={X(16)} cy={Y(pHe)} r="5.5" fill={COL.acide} stroke="#0f172a"/>
      <text x={X(16) - 10} y={Y(pHe) - 8} fontSize="15.5" fontWeight="700" fill={COL.acide} textAnchor="end">CH₃COOH : 8,7</text>
      <text x={X(16) + 10} y={Y(7) + 20} fontSize="15.5" fontWeight="700" fill={COL.bleu}>HCl : 7,0</text>
      <text x="190" y="199" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">● = pH à l’équivalence</text>
      <text x="190" y="218" fontSize="15.5" fill="#334155" textAnchor="middle">pointillés : pH = 7</text>
    </svg>);
}

// ---- 5. Choix de l'indicateur : la zone de virage doit contenir pH_E
export function SvgIndicateur() {
  const pts = M.courbe(ETHA, 25, 250), pHe = M.pHEq(ETHA);
  const X = v => 38 + v / 25 * 306, Y = p => 200 - p / 14 * 180;
  const bande = (a, b, c, t, ok) => (<g>
    <rect x="38" y={Y(b)} width="306" height={Y(a) - Y(b)} fill={c} opacity="0.2"/>
    <rect x="38" y={Y(b)} width="306" height={Y(a) - Y(b)} fill="none" stroke={c} strokeDasharray="4 3"/>
    <text x="46" y={Y((a + b) / 2) + 5} fontSize="15.5" fontWeight="700" fill={c}>{t} {ok ? '✓' : '✗'}</text></g>);
  return (
    <svg viewBox="0 0 360 276" role="img" aria-label="Courbe de titrage de l’acide éthanoïque avec deux zones de virage : le bleu de bromothymol, de pH 6,0 à 7,6, ne contient pas le pH à l’équivalence 8,7 et ne convient pas ; le bleu de thymol, de pH 8,0 à 9,6, le contient et convient" style={stl}>
      <line x1="38" y1="200" x2="344" y2="200" stroke="#94a3b8"/><line x1="38" y1="20" x2="38" y2="200" stroke="#94a3b8"/>
      {[0, 7, 14].map(p => <text key={p} x="32" y={Y(p) + 5} fontSize="15.5" textAnchor="end" fill="#334155">{p}</text>)}
      <text x="190" y="222" fontSize="15.5" textAnchor="middle" fill="#334155">V<Sub>B</Sub> (mL)</text>
      {bande(6.0, 7.6, COL.rouge, 'BBT (6,0 – 7,6)', false)}
      {bande(8.0, 9.6, COL.vert, 'thymol (8,0 – 9,6)', true)}
      <path d={chemin(pts, X, Y)} fill="none" stroke={COL.bleu} strokeWidth="2.6"/>
      <circle cx={X(16)} cy={Y(pHe)} r="5.5" fill={COL.orange} stroke="#0f172a"/>
      <text x={X(16) + 10} y={Y(pHe) + 5} fontSize="15.5" fontWeight="700" fill={COL.orange}>pH<Sub>E</Sub> = 8,7</text>
      <text x="190" y="248" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">la zone de virage doit contenir pH<Sub>E</Sub></text>
      <text x="190" y="268" fontSize="15.5" fill="#334155" textAnchor="middle">(pH à l’équivalence)</text>
    </svg>);
}
