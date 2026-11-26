// Schémas de la simulation 301 « Fluorescence et phosphorescence ». SVG, largeur 100 % plafonnée.
import { K, T, flecheV, svgStyle } from "./schemaOutils";
import { intensiteFluo, intensitePhos, gauss } from "./fluoModele";

const COL = { abs: '#7c3aed', fluo: '#15803d', phos: '#b91c1c', cis: '#c2410c', nr: '#64748b' };
const niveau = (x1, x2, y, id, ep = 2.6) => <line key={id} x1={x1} y1={y} x2={x2} y2={y} stroke={ep > 2 ? '#0f172a' : '#94a3b8'} strokeWidth={ep}/>;
const flecheH = (x1, y1, x2, y2, col, w, dash, op = 1, id) => { const a = Math.atan2(y2 - y1, x2 - x1), L = 9, p = (s) => `${x2 - L * Math.cos(a + s)},${y2 - L * Math.sin(a + s)}`;
  return <g key={id} opacity={op}><line x1={x1} y1={y1} x2={x2 - 6 * Math.cos(a)} y2={y2 - 6 * Math.sin(a)} stroke={col} strokeWidth={w} strokeDasharray={dash}/><polygon points={`${x2},${y2} ${p(0.4)} ${p(-0.4)}`} fill={col}/></g>; };
const POS = { S0: [70, 258], S1: [70, 140], S2: [70, 70], T1: [250, 190] };

// ---------- diagramme de Perrin-Jablonski ----------
export function SceneJablonski({ actif = null, etat = null, durees = false }) {
  const A = actif == null ? null : Array.isArray(actif) ? actif : [actif];
  const op = k => (A == null || A.includes(k) ? 1 : 0.22), w = k => (A != null && A.includes(k) ? 3.6 : 2.4);
  const dur = (x, y, s, o = {}) => durees ? T(x, y, s, { size: 11, fill: K.gris, halo: true, ...o }) : null;
  return (<svg role="img" aria-label="Diagramme de Perrin-Jablonski : états S0, S1, S2 et T1, absorption, relaxations, fluorescence, croisement intersystème et phosphorescence" viewBox="0 0 340 292" width="100%" style={svgStyle}>
    {flecheV(14, 282, 22, K.gris, 1.6, 1, 'ax')}{T(14, 14, 'E', { size: 13, gras: true })}
    {[258, 250, 242].map((y, i) => niveau(36, 304, y, 's0' + y, i ? 1.1 : 2.6))}{T(308, 262, 'S₀', { anchor: 'start', size: 14, gras: true })}
    {[140, 132, 124].map((y, i) => niveau(36, 142, y, 's1' + y, i ? 1.1 : 2.6))}{T(148, 144, 'S₁', { anchor: 'start', size: 14, gras: true })}
    {[70, 62, 54].map((y, i) => niveau(36, 142, y, 's2' + y, i ? 1.1 : 2.6))}{T(148, 74, 'S₂', { anchor: 'start', size: 14, gras: true })}
    {[190, 182, 174].map((y, i) => niveau(200, 304, y, 't1' + y, i ? 1.1 : 2.6))}{T(308, 194, 'T₁', { anchor: 'start', size: 14, gras: true })}
    {flecheV(50, 256, 124, COL.abs, w('absorption'), op('absorption'), 'a1')}{flecheV(66, 256, 54, COL.abs, w('absorption'), op('absorption') * 0.8, 'a2')}
    <g opacity={op('absorption')}>{T(30, 278, 'absorption', { anchor: 'start', size: 12, fill: COL.abs, gras: true })}{dur(112, 278, '10⁻¹⁵ s', { anchor: 'start' })}</g>
    {flecheH(94, 56, 94, 122, COL.nr, 1.8, '4 3', op('ci'), 'ci')}<g opacity={op('ci')}>{T(106, 96, 'CI', { anchor: 'start', size: 12, fill: COL.nr, gras: true })}{dur(106, 109, '10⁻¹² s', { anchor: 'start' })}</g>
    {flecheV(120, 125, 139, COL.nr, 2, op('rv'), 'rv1')}{flecheV(120, 55, 69, COL.nr, 2, op('rv'), 'rv2')}<g opacity={op('rv')}>{T(128, 118, 'RV', { anchor: 'start', size: 11, fill: COL.nr, gras: true, halo: true })}{T(128, 48, 'RV', { anchor: 'start', size: 11, fill: COL.nr, gras: true, halo: true })}</g>
    {flecheV(222, 175, 189, COL.nr, 2, op('rv'), 'rv3')}
    {flecheV(130, 142, 241, COL.fluo, w('fluo'), op('fluo'), 'fl')}<g opacity={op('fluo')}>{T(138, 224, 'fluorescence', { anchor: 'start', size: 12, fill: COL.fluo, gras: true, halo: true })}{dur(138, 237, '10⁻⁹ s', { anchor: 'start' })}</g>
    {flecheH(142, 128, 200, 176, COL.cis, w('cis') - 0.6, '5 3', op('cis'), 'cis')}<g opacity={op('cis')}>{T(176, 146, 'CIS', { anchor: 'start', size: 12, fill: COL.cis, gras: true, halo: true })}{dur(176, 159, '10⁻⁸ s', { anchor: 'start' })}</g>
    {flecheV(272, 192, 241, COL.phos, w('phos'), op('phos'), 'ph')}<g opacity={op('phos')}>{T(280, 218, 'phospho-', { anchor: 'start', size: 12, fill: COL.phos, gras: true, halo: true })}{T(280, 231, 'rescence', { anchor: 'start', size: 12, fill: COL.phos, gras: true, halo: true })}{dur(238, 206, '10⁻² à 10² s', { anchor: 'start' })}</g>
    {etat && POS[etat] && <circle cx={POS[etat][0]} cy={POS[etat][1] - 7} r="7" fill="#0f172a" stroke="#fff" strokeWidth="2"/>}
  </svg>);
}

// ---------- intensités après l'arrêt de l'excitation ----------
export function SceneEmission({ mol, t }) {
  const f = intensiteFluo(mol, t), p = intensitePhos(mol, t), W = 220;
  const barre = (y, lab, v, col, absent) => <g key={lab}>{T(8, y + 12, lab, { anchor: 'start', size: 12, gras: true, fill: col })}
    <rect x="112" y={y} width={W} height="18" rx="3" fill="#f1f5f9" stroke="#cbd5e1"/>{!absent && v > 0.003 && <rect x="112" y={y} width={Math.max(2, W * v)} height="18" rx="3" fill={col}/>}
    {absent && T(112 + 8, y + 13, 'cette molécule ne phosphoresce pas', { anchor: 'start', size: 11, fill: K.gris })}</g>;
  return (<svg role="img" aria-label="Intensité de fluorescence et de phosphorescence après l'arrêt de l'excitation" viewBox="0 0 340 78" width="100%" style={svgStyle}>
    {barre(6, 'fluorescence', f, COL.fluo)}{barre(40, 'phosphorescence', p / 0.6, COL.phos, !mol.tauT1)}{T(112, 72, 'intensité relative', { anchor: 'start', size: 11, fill: K.gris })}</svg>);
}

// ---------- spectres d'absorption et d'émission ----------
export function SceneSpectresFluo({ mol, montrerPhos = true }) {
  const X0 = 36, X1 = 330, lam0 = 250, lam1 = 650, x = l => X0 + (l - lam0) / (lam1 - lam0) * (X1 - X0), Y0 = 124, H = 90;
  const chemin = (c, s, h = 1) => { let d = ''; for (let l = lam0; l <= lam1; l += 4) d += `${d ? 'L' : 'M'}${x(l).toFixed(1)},${(Y0 - H * h * gauss(l, c, s)).toFixed(1)}`; return d; };
  return (<svg role="img" aria-label="Spectres schématiques d'absorption et d'émission de la molécule" viewBox="0 0 340 168" width="100%" style={svgStyle}>
    <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={K.gris}/>{[300, 400, 500, 600].map(l => <g key={l}><line x1={x(l)} y1={Y0} x2={x(l)} y2={Y0 + 5} stroke={K.gris}/>{T(x(l), Y0 + 18, String(l), { size: 11, fill: K.gris })}</g>)}
    {T(X1 - 4, Y0 + 34, 'longueur d’onde (nm)', { anchor: 'end', size: 11, fill: K.gris })}
    <path d={chemin(mol.lamAbs, 22)} fill="none" stroke={COL.abs} strokeWidth="2.6"/><path d={chemin(mol.lamFluo, 26)} fill="none" stroke={COL.fluo} strokeWidth="2.6"/>
    {montrerPhos && mol.lamPhos && <path d={chemin(mol.lamPhos, 30, 0.6)} fill="none" stroke={COL.phos} strokeWidth="2.2" strokeDasharray="5 3"/>}
    {T(x(mol.lamAbs) - 6, 24, 'absorption', { size: 12, fill: COL.abs, gras: true, anchor: 'end' })}{T(x(mol.lamFluo) + 6, 24, 'fluorescence', { size: 12, fill: COL.fluo, gras: true, anchor: 'start' })}
    {montrerPhos && mol.lamPhos && T(x(mol.lamPhos) + 4, 60, 'phosphorescence', { size: 11, fill: COL.phos, gras: true, anchor: 'start' })}
    <line x1={x(mol.lamAbs)} y1={Y0} x2={x(mol.lamAbs)} y2={32} stroke={COL.abs} strokeDasharray="3 3"/><line x1={x(mol.lamFluo)} y1={Y0} x2={x(mol.lamFluo)} y2={32} stroke={COL.fluo} strokeDasharray="3 3"/>
  </svg>);
}

// ---------- cartes « À retenir » (viewBox 300, texte ≥ 12,5) ----------
const carte = { display: 'block', width: '100%', maxWidth: 320, margin: '0 auto' };
export function SvgCarteJablonski() {
  return (<svg role="img" aria-label="Fluorescence rapide depuis S1, phosphorescence lente depuis T1" viewBox="0 0 300 244" style={carte}>
    {T(150, 18, 'Fluorescence ou phosphorescence ?', { size: 14, gras: true })}
    <line x1="30" y1="206" x2="270" y2="206" stroke="#0f172a" strokeWidth="2.6"/>{T(18, 210, 'S₀', { size: 13, gras: true, anchor: 'end' })}
    <line x1="30" y1="70" x2="130" y2="70" stroke="#0f172a" strokeWidth="2.6"/>{T(18, 74, 'S₁', { size: 13, gras: true, anchor: 'end' })}
    <line x1="170" y1="130" x2="270" y2="130" stroke="#0f172a" strokeWidth="2.6"/>{T(284, 134, 'T₁', { size: 13, gras: true, anchor: 'start' })}
    {flecheV(60, 204, 72, COL.abs, 2.6, 1, 'a')}{T(66, 150, 'abs.', { size: 12.5, fill: COL.abs, gras: true, anchor: 'start' })}
    {flecheV(110, 72, 204, COL.fluo, 3.4, 1, 'f')}{T(104, 124, 'fluo', { size: 13, fill: COL.fluo, gras: true, anchor: 'end' })}{T(104, 139, '10⁻⁹ s', { size: 12.5, fill: COL.fluo, anchor: 'end' })}
    {flecheH(130, 76, 170, 124, COL.cis, 2.4, '5 3', 1, 'c')}{T(150, 98, 'CIS', { size: 12.5, fill: COL.cis, gras: true, anchor: 'start' })}
    {flecheV(220, 132, 204, COL.phos, 3.4, 1, 'p')}{T(228, 168, 'phospho', { size: 13, fill: COL.phos, gras: true, anchor: 'start' })}{T(228, 183, '≥ 10⁻² s', { size: 12.5, fill: COL.phos, anchor: 'start' })}
    {T(150, 222, 'Après l’arrêt de la lampe : la fluorescence', { size: 12.5, fill: K.gris })}{T(150, 236, 's’éteint, la phosphorescence persiste', { size: 12.5, fill: K.gris })}
  </svg>);
}
export function SvgCarteTemps() {
  const x = e => 20 + (e + 15) / 17 * 260;   // exposant -15 → 2
  const marq = [[-15, 'absorption', 0, COL.abs], [-12, 'RV, CI', 1, COL.nr], [-9, 'fluo', 0, COL.fluo], [-8, 'CIS', 1, COL.cis], [0, 'phospho', 0, COL.phos]];
  return (<svg role="img" aria-label="Échelle de temps des processus de désexcitation" viewBox="0 0 300 150" style={carte}>
    {T(150, 18, 'Qui est rapide, qui est lent ?', { size: 14, gras: true })}
    <line x1="20" y1="84" x2="280" y2="84" stroke={K.gris} strokeWidth="2"/>
    <rect x={x(-2)} y="74" width={x(2) - x(-2)} height="20" rx="3" fill={COL.phos} opacity=".25"/>
    {[-15, -12, -9, -6, -3, 0].map(e => <g key={e}><line x1={x(e)} y1="80" x2={x(e)} y2="88" stroke={K.gris}/>{T(x(e), 108, `10${String(e).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`, { size: 12.5, fill: K.gris })}</g>)}
    {marq.map(([e, n, h, c]) => <g key={n}><circle cx={x(e)} cy="84" r="5" fill={c}/>{T(Math.min(262, Math.max(36, x(e))), h ? 52 : 36, n, { size: 13, fill: c, gras: true })}<line x1={x(e)} y1={h ? 58 : 42} x2={x(e)} y2="78" stroke={c} strokeWidth="1.3"/></g>)}
    {T(150, 132, 'temps en secondes (échelle logarithmique)', { size: 12.5, fill: K.gris })}
  </svg>);
}
export function SvgCarteBilanFluo() {
  const ligne = (y, a, b, c, g) => <g key={y}>{T(10, y, a, { size: 13, gras: g, anchor: 'start', fill: g ? K.txt : K.gris })}{T(92, y, b, { size: 12.5, gras: g, anchor: 'start', fill: g ? COL.fluo : K.txt })}{T(184, y, c, { size: 12.5, gras: g, anchor: 'start', fill: g ? COL.phos : K.txt })}</g>;
  return (<svg role="img" aria-label="Tableau comparatif fluorescence et phosphorescence" viewBox="0 0 300 168" style={carte}>
    {T(150, 18, 'Fluorescence et phosphorescence', { size: 14, gras: true })}
    {ligne(44, '', 'Fluorescence', 'Phosphorescence', true)}<line x1="8" y1="52" x2="292" y2="52" stroke={K.clair}/>
    {ligne(74, 'part de', 'S₁', 'T₁', false)}{ligne(98, 'durée', '≈ 10⁻⁹ s', '10⁻² à 10² s', false)}{ligne(122, 'après l’arrêt', 's’éteint', 'persiste', false)}{ligne(146, 'photon émis', 'λ > λ abs.', 'λ > λ fluo.', false)}
  </svg>);
}
