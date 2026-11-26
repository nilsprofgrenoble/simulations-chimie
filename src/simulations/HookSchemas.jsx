// Schémas de la simulation 304 « Infrarouge : de la liaison-ressort au spectre ». SVG, largeur 100 % plafonnée.
import { K, T, svgStyle } from "./schemaOutils";
import { transmittance, sigmaHooke, masseReduite, fAnim } from "./hookModele";
import { usePhase } from "./hookHorloge";
import { COLA, rayon } from "./hookAtomes";

const carte = { display: 'block', width: '100%', maxWidth: 320, margin: '0 auto' };
const frac = (x, y, n, d, o = {}) => [T(x, y - 4, n, { size: o.size ?? 14, ...o }), <line key={`f${x}${y}`} x1={x - 11} y1={y} x2={x + 11} y2={y} stroke={o.fill ?? K.txt} strokeWidth="1.4"/>, T(x, y + 14, d, { size: o.size ?? 14, ...o })];
const racine = (x, y, w, h, c = K.txt) => <path key={`r${x}${y}`} d={`M${x},${y} l4,-3 l5,${h} l6,${-h - 6} h${w}`} fill="none" stroke={c} strokeWidth="1.5"/>;

// ---------- deux atomes reliés par un ressort (animé : 1 oscillation par seconde pour 1000 cm⁻¹, centre de masse immobile) ----------
export function SceneRessort({ a, b, k = 500, vibre = true, anime = false }) {
  const sig = sigmaHooke(k, masseReduite(a.m, b.m)), ph = usePhase(fAnim(sig), anime && vibre);
  const ra = rayon(a.m), rb = rayon(b.m), xa0 = 90, xb0 = 250, ya = 70, ep = 1.2 + k / 500, tot = a.m + b.m;
  const dep = vibre && anime ? 16 * Math.sin(ph) : 0, xa = xa0 - dep * b.m / tot, xb = xb0 + dep * a.m / tot;
  const x1 = xa + ra, x2 = xb - rb, n = 9, pts = []; for (let i = 0; i <= n; i++) pts.push(`${(x1 + (x2 - x1) * i / n).toFixed(1)},${(ya + (i % 2 ? 11 : -11) * (i === 0 || i === n ? 0 : 1)).toFixed(1)}`);
  const atome = (x, r, at) => <g><circle cx={x} cy={ya} r={r} fill={COLA[at.lab] ?? '#94a3b8'} stroke="#0f172a" strokeWidth="1.6"/>{T(x, ya + 5, at.lab, { size: 14, gras: true, fill: ['H'].includes(at.lab) ? K.txt : '#fff' })}{T(x, ya + r + 16, `${at.m} u`, { size: 12, fill: K.gris })}</g>;
  return (<svg role="img" aria-label="Deux atomes reliés par un ressort : modèle d'une liaison qui vibre" viewBox="0 0 340 150" width="100%" style={svgStyle}>
    <polyline points={pts.join(' ')} fill="none" stroke="#0f766e" strokeWidth={ep}/>{atome(xa, ra, a)}{atome(xb, rb, b)}
    {vibre && !anime && <g>{T(xa0 - 2, 24, '←', { size: 18, fill: K.gris })}{T(xa0 + 26, 24, '→', { size: 18, fill: K.gris })}{T(xb0 - 26, 24, '←', { size: 18, fill: K.gris })}{T(xb0 + 2, 24, '→', { size: 18, fill: K.gris })}</g>}
    {T(170, 138, `ressort de raideur k = ${k} N/m`, { size: 12.5, fill: '#0f766e', gras: true })}
  </svg>);
}

// ---------- spectre infrarouge en transmittance (σ décroissant de gauche à droite) ----------
const SX0 = 30, SX1 = 330, S0 = 4000, S1 = 500, sx = s => SX0 + (S0 - s) / (S0 - S1) * (SX1 - SX0), sy = t => 150 - t * 110;
export function SceneSpectreIR({ bandes, marque = null, etiquettes = [], marqueLabel = null, marqueCouleur = '#dc2626' }) {
  let d = ''; for (let s = S0; s >= S1; s -= 6) d += `${d ? 'L' : 'M'}${sx(s).toFixed(1)},${sy(transmittance(bandes, s)).toFixed(1)}`;
  return (<svg role="img" aria-label="Spectre infrarouge schématique : transmittance en fonction du nombre d'onde" viewBox="0 0 340 196" width="100%" style={svgStyle}>
    <rect x={sx(1500)} y="36" width={sx(S1) - sx(1500)} height="114" fill="#fef3c7" opacity=".55"/>{T((sx(1500) + sx(S1)) / 2, 50, 'empreinte', { size: 11, fill: '#92400e' })}
    <line x1={SX0} y1="150" x2={SX1} y2="150" stroke={K.gris}/><line x1={SX0} y1="36" x2={SX0} y2="150" stroke={K.gris}/>
    {[4000, 3000, 2000, 1500, 1000, 500].map(s => <g key={s}><line x1={sx(s)} y1="150" x2={sx(s)} y2="155" stroke={K.gris}/>{T(sx(s), 168, String(s), { size: 11, fill: K.gris })}</g>)}
    {T(SX1, 186, 'nombre d’onde σ (cm⁻¹)', { anchor: 'end', size: 11, fill: K.gris })}{T(SX0 + 4, 28, 'T', { size: 12, gras: true, anchor: 'start' })}
    <path d={d} fill="none" stroke="#1d4ed8" strokeWidth="2.2"/>
    {etiquettes.map(([s, txt, dy = 0, anc = 'middle']) => T(sx(s), sy(transmittance(bandes, s)) + 14 + dy, txt, { size: 11.5, gras: true, fill: '#0f172a', anchor: anc, halo: true }))}
    {marque != null && <g><line x1={sx(marque)} y1="34" x2={sx(marque)} y2="150" stroke={marqueCouleur} strokeDasharray="4 3" strokeWidth="1.6"/>{T(sx(marque), 30, marqueLabel ?? `${Math.round(marque)}`, { size: 12, gras: true, fill: marqueCouleur })}</g>}
  </svg>);
}

// ---------- cartes « À retenir » (viewBox 300, texte ≥ 12,5) ----------
export function SvgCarteHooke() {
  return (<svg role="img" aria-label="Loi de Hooke : le nombre d'onde augmente avec la raideur et diminue avec la masse réduite" viewBox="0 0 300 220" style={carte}>
    {T(150, 18, 'Une liaison vibre comme un ressort', { size: 14, gras: true })}
    {T(48, 66, 'σ =', { size: 15, gras: true })}{frac(96, 66, '1', '2π·c', { size: 14 })}{racine(126, 70, 44, -22)}{frac(156, 66, 'k', 'μ', { size: 15 })}
    <rect x="12" y="92" width="134" height="58" rx="8" fill="#ecfdf5" stroke="#10b981"/>{T(79, 112, 'k plus grand', { size: 13, gras: true })}{T(79, 130, 'liaison rigide', { size: 12.5 })}{T(79, 145, 'σ augmente ↑', { size: 13, gras: true, fill: '#047857' })}
    <rect x="154" y="92" width="134" height="58" rx="8" fill="#eff6ff" stroke="#3b82f6"/>{T(221, 112, 'μ plus grande', { size: 13, gras: true })}{T(221, 130, 'atomes lourds', { size: 12.5 })}{T(221, 145, 'σ diminue ↓', { size: 13, gras: true, fill: '#1d4ed8' })}
    {T(150, 176, 'C≡C (k fort) : 2200 cm⁻¹', { size: 12.5, fill: K.gris })}{T(150, 194, 'C–C (k faible) : 1000 cm⁻¹', { size: 12.5, fill: K.gris })}{T(150, 212, 'C–H (H léger) : 2950 cm⁻¹', { size: 12.5, fill: K.gris })}
  </svg>);
}
export function SvgCarteZones() {
  const x = s => 20 + (4000 - s) / 3500 * 260, bar = [['O–H', 3620, '#be123c', 0], ['N–H', 3400, '#7c3aed', 1], ['C–H', 2950, '#b45309', 0], ['C≡C', 2200, '#0f766e', 1], ['C=O', 1715, '#1d4ed8', 0], ['C=C', 1650, '#15803d', 1], ['C–O', 1100, '#475569', 0]];
  return (<svg role="img" aria-label="Nombres d'onde caractéristiques des principales liaisons" viewBox="0 0 300 156" style={carte}>
    {T(150, 18, 'Où lit-on chaque liaison ?', { size: 14, gras: true })}
    <rect x={x(1500)} y="58" width={x(500) - x(1500)} height="22" fill="#fef3c7"/>
    <line x1="20" y1="80" x2="280" y2="80" stroke={K.gris} strokeWidth="2"/>
    {[4000, 3000, 2000, 1000, 500].map(s => <g key={s}><line x1={x(s)} y1="76" x2={x(s)} y2="84" stroke={K.gris}/>{T(x(s), 100, String(s), { size: 12.5, fill: K.gris })}</g>)}
    {bar.map(([n, s, c, h]) => <g key={n}><circle cx={x(s)} cy="80" r="5" fill={c}/><line x1={x(s)} y1={h ? 50 : 62} x2={x(s)} y2="75" stroke={c}/>{T(x(s), h ? 44 : 56, n, { size: 12.5, gras: true, fill: c })}</g>)}
    {T(150, 126, 'σ en cm⁻¹ ; sous 1500 : zone d’empreinte', { size: 12.5, fill: K.gris })}{T(150, 144, 'au-dessus : groupes caractéristiques', { size: 12.5, fill: K.gris })}
  </svg>);
}
export function SvgCarteBilanIR() {
  const x = e => 30 + (3800 - e) / 800 * 240;
  const gauss = (c, w, h, y0) => { let d = ''; for (let e = 3800; e >= 3000; e -= 8) d += `${d ? 'L' : 'M'}${x(e).toFixed(1)},${(y0 - h * Math.exp(-0.5 * ((e - c) / w) ** 2)).toFixed(1)}`; return d; };
  return (<svg role="img" aria-label="Liaison hydrogène : bande O–H fine si libre, large et décalée si liée" viewBox="0 0 300 200" style={carte}>
    {T(150, 18, 'La liaison hydrogène élargit O–H', { size: 14, gras: true })}
    <line x1="30" y1="130" x2="270" y2="130" stroke={K.gris}/>{[3800, 3600, 3400, 3200, 3000].map(e => <g key={e}><line x1={x(e)} y1="130" x2={x(e)} y2="135" stroke={K.gris}/>{T(x(e), 150, String(e), { size: 12, fill: K.gris })}</g>)}
    <path d={gauss(3620, 16, 80, 130)} fill="none" stroke="#be123c" strokeWidth="2.6"/><path d={gauss(3330, 110, 90, 130)} fill="none" stroke="#1d4ed8" strokeWidth="2.6" strokeDasharray="6 3"/>
    {T(x(3620) - 4, 40, 'libre : fine', { size: 12.5, gras: true, fill: '#be123c', anchor: 'end' })}{T(x(3330) + 10, 62, 'liée : large', { size: 12.5, gras: true, fill: '#1d4ed8', anchor: 'start' })}
    {T(150, 174, 'σ plus basse (≈ 3300) et bande large', { size: 12.5, fill: K.gris })}{T(150, 192, 'conjugué : C=O baissé de 10 à 30 cm⁻¹', { size: 12.5, fill: K.gris })}
  </svg>);
}
