// Schémas animés de la simulation 314 (ICP) : torche et plasma, polychromateur, spectre construit photon par photon, gamme de dosage, carte de comparaison.
// Rien n'est codé par la seule couleur : zones numérotées, longueurs d'onde écrites, marques ◄.
import { K, T, svgStyle } from "./schemaOutils";
import * as M from "./icpModele";
import { couleurOnde } from "./chromoTirages";

const lerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const seg = (p, a, b) => (p - a) / (b - a);

// ---------- torche : un échantillon nébulisé monte dans le canal central du plasma (p de 0 à 1, en boucle) ----------
const ZONES = [[1, 'Nébuliseur', 'aérosol de gouttes'], [2, 'Canal central', 'séchage, vaporisation'], [3, 'Plasma', 'atomisation, excitation'], [4, 'Zone d’analyse', 'photons émis']];
export function SceneTorche({ p }) {
  const parts = [0, 0.2, 0.4, 0.6, 0.8].map(o => (p + o) % 1), st = Math.min(3, Math.floor(p * 4));
  const corps = u => { const y = 196 - 150 * u, x = 112 + 4 * Math.sin(u * 20 + 1);
    if (u < 0.28) return <g key={u}><circle cx={x} cy={y} r="5.5" fill="#e0f2fe" stroke="#0369a1" strokeWidth="1.4"/></g>;
    if (u < 0.5) return <g key={u}><rect x={x - 3.5} y={y - 3.5} width="7" height="7" fill="#e5e7eb" stroke="#475569" strokeWidth="1.4"/></g>;
    if (u < 0.72) return <g key={u}><circle cx={x} cy={y} r="4.6" fill="#fde68a" stroke="#92400e" strokeWidth="1.6"/></g>;
    return <g key={u}><circle cx={x} cy={y} r="4.6" fill="#fde68a" stroke="#92400e" strokeWidth="1.6"/>{u > 0.82 && [0, 1, 2].map(k => <path key={k} d={`M${x + 8},${y - 8 + k * 7} l10,0`} stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(u * 30 + k)}/>)}</g>; };
  return (<svg role="img" aria-label="Torche à plasma d'argon : l'échantillon nébulisé monte dans le canal central, est atomisé et excité dans le plasma puis émet des photons dans la zone d'analyse" viewBox="0 0 340 222" width="100%" style={svgStyle}>
    <rect x="60" y="150" width="120" height="58" rx="4" fill="#e0f2fe" stroke="#64748b" strokeWidth="1.5" opacity="0.6"/>
    <path d="M70,150 L70,100 C70,60 90,34 120,16 C150,34 170,60 170,100 L170,150 Z" fill="#fce7f3" stroke="#be185d" strokeWidth="1.6" opacity="0.8"/>
    <path d="M100,150 L100,70 C100,50 108,38 120,30 C132,38 140,50 140,70 L140,150 Z" fill="#fff7ed" stroke="#c2410c" strokeWidth="1" opacity="0.9"/>
    <rect x="108" y="40" width="8" height="166" fill="#ffffff" opacity="0.35"/>
    {[100, 110, 120, 130].map(y => <ellipse key={y} cx="120" cy={y} rx="62" ry="6" fill="none" stroke="#475569" strokeWidth="2.2"/>)}
    {T(120, 218, 'argon', { size: 12, fill: K.gris })}{T(52, 100, 'bobine', { size: 11.5, anchor: 'end', fill: K.gris })}
    {parts.map(corps)}
    {ZONES.map(([n, nom, txt], i) => { const y = 196 - 150 * (i + 0.5) / 4, act = i === st; return <g key={n}><line x1="186" y1={196 - 150 * i / 4 - 0.1} x2="188" y2={196 - 150 * i / 4} stroke={K.clair}/>
      {T(196, y - 1, `${act ? '◄ ' : ''}${n}. ${nom}`, { anchor: 'start', size: 12.5, gras: act, fill: act ? '#9d174d' : K.gris })}{T(196, y + 13, txt, { anchor: 'start', size: 11.5, fill: K.gris })}</g>; })}
    {T(196, 14, 'T ≈ 6 000 à 10 000 K', { anchor: 'start', size: 12.5, gras: true, fill: '#9d174d' })}
  </svg>);
}

// ---------- polychromateur : un photon traverse la fente, est dévié par le réseau selon λ, arrive sur son pixel (p de 0 à 1) ----------
export function ScenePolychromateur({ lam, p }) {
  const col = lam ? couleurOnde(lam) : '#64748b', th = lam ? M.angleReseau(lam) : 0, xd = lam ? 36 + (lam - 200) / 600 * 270 : 170;
  const xg = 156, yg = 82, x1 = p < 0.4 ? lerp(66, xg, p / 0.4) : xg;
  const xp = p < 0.4 ? null : lerp(xg, xd, seg(p, 0.4, 0.95)), yp = p < 0.4 ? null : lerp(yg, 170, seg(p, 0.4, 0.95));
  return (<svg role="img" aria-label="Polychromateur : la lumière du plasma passe par une fente, un réseau la disperse selon la longueur d'onde, et un détecteur à plusieurs pixels la mesure" viewBox="0 0 340 224" width="100%" style={svgStyle}>
    <rect x="4" y="58" width="58" height="48" rx="8" fill="#fce7f3" stroke="#be185d" strokeWidth="1.8"/>{T(33, 79, 'plasma', { size: 12, gras: true })}{T(33, 94, 'ICP', { size: 12, gras: true })}
    <line x1="62" y1={yg} x2={xg} y2={yg} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4"/>
    <line x1="92" y1="60" x2="92" y2="75" stroke="#0f172a" strokeWidth="4"/><line x1="92" y1="89" x2="92" y2="104" stroke="#0f172a" strokeWidth="4"/>{T(92, 122, 'fente', { size: 12 })}
    <g transform={`rotate(-32 ${xg} ${yg})`}><rect x={xg - 5} y={yg - 20} width="10" height="40" rx="2" fill="#ede9fe" stroke="#6d28d9" strokeWidth="1.8"/>{[-14, -7, 0, 7, 14].map(d => <line key={d} x1={xg - 5} y1={yg + d} x2={xg + 5} y2={yg + d} stroke="#6d28d9" strokeWidth="1.2"/>)}</g>
    {T(xg, 46, 'réseau', { size: 12, gras: true })}
    <rect x="30" y="170" width="280" height="14" fill="#f1f5f9" stroke="#15803d" strokeWidth="1.6"/>
    {Array.from({ length: 28 }, (_, i) => <line key={i} x1={36 + i * 10} y1="170" x2={36 + i * 10} y2="184" stroke="#cbd5e1"/>)}
    {T(170, 216, 'détecteur à pixels : un pixel par longueur d’onde', { size: 12, fill: K.gris })}
    {lam && p < 0.4 && <circle cx={x1} cy={yg} r="5" fill={col} stroke="#0f172a" strokeWidth="1.2"/>}
    {lam && p >= 0.4 && <g><line x1={xg} y1={yg} x2={xp} y2={yp} stroke={col} strokeWidth="2.2"/><circle cx={xp} cy={yp} r="5" fill={col} stroke="#0f172a" strokeWidth="1.2"/></g>}
    {lam && p >= 0.95 && <g><rect x={xd - 5} y="169" width="10" height="16" fill={col} stroke="#0f172a" strokeWidth="1.4"/>{T(Math.min(Math.max(xd, 36), 304), 202, `${Math.round(lam)} nm`, { size: 12.5, gras: true })}</g>}
    {!lam && T(230, 130, 'En attente d’un photon', { size: 12.5, fill: K.gris })}
    {lam && T(334, 24, `θ ≈ ${Math.round(th)}° pour ${Math.round(lam)} nm`, { size: 11.5, fill: K.gris, anchor: 'end' })}
  </svg>);
}

// ---------- spectre construit photon par photon ----------
const X0 = 40, X1 = 352, PH = 112, YB = 150, sx = l => X0 + (l - 200) / 600 * (X1 - X0);
export function SceneSpectreICP({ etat, liste = M.ECH, noms = true }) {
  const max = Math.max(5, ...etat.h) * 1.12, bw = (X1 - X0) / M.NBINS, sy = h => YB - PH * h / max;
  const lignes = liste.map(s => M.raie(s));
  return (<svg role="img" aria-label={`Spectre d'émission construit photon par photon : ${etat.n} photons détectés`} viewBox="0 0 370 204" width="100%" style={svgStyle}>
    {T(X0 - 4, 12, 'photons détectés par case de 2 nm', { anchor: 'start', size: 12.5, fill: K.gris, gras: true })}
    <line x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris}/><line x1={X0} y1={YB} x2={X0} y2={YB - PH - 2} stroke={K.gris}/>
    {[200, 300, 400, 500, 600, 700, 800].map(l => <g key={l}><line x1={sx(l)} y1={YB} x2={sx(l)} y2={YB + 5} stroke={K.gris}/>{T(sx(l), YB + 18, String(l), { size: 12.5, fill: K.gris })}</g>)}
    {T(X1, YB + 36, 'longueur d’onde λ (nm)', { anchor: 'end', size: 12.5, fill: K.gris })}
    {Array.from({ length: M.NBINS }, (_, i) => etat.h[i] > 0 && <rect key={i} x={sx(M.centre(i)) - bw / 2} y={sy(etat.h[i])} width={Math.max(1.4, bw)} height={YB - sy(etat.h[i])} fill="#be185d"/>)}
    {noms && lignes.map(r => etat.n > 0 && (etat.par[r.s] ?? 0) >= Math.max(1, Math.round(0.005 * etat.n)) && T(sx(r.lam), sy(etat.h[M.indice(r.lam)]) - 5, r.s, { size: 12.5, gras: true, halo: true }))}
    {etat.n === 0 && T((X0 + X1) / 2, YB - PH / 2, 'aucun photon détecté pour l’instant', { size: 13, fill: K.gris })}
  </svg>);
}

// ---------- gamme de dosage : ICP (échelles log) et SAA (échelles linéaires) ----------
export function SceneGamme({ c }) {
  const lg = v => Math.log10(v), icp = v => 40 + (lg(v) + 3) / 6 * 110, ys = v => 156 - (lg(M.signalICP(v)) - lg(M.signalICP(0.001))) / 6 * 110;
  const sA = v => 214 + v / 100 * 112, yA = v => 156 - M.absorbanceSAA(v) / 3.2 * 110;
  const ptsA = Array.from({ length: 51 }, (_, i) => { const v = 2 * i; return `${i ? 'L' : 'M'}${sA(v).toFixed(1)},${yA(v).toFixed(1)}`; }).join('');
  const hors = M.horsPlageSAA(c);
  return (<svg role="img" aria-label="Gamme de dosage : l'ICP reste proportionnelle sur six décades, l'absorbance de l'absorption atomique sature au-delà de quelques mg/L" viewBox="0 0 340 226" width="100%" style={svgStyle}>
    {T(95, 14, 'ICP (échelles log)', { size: 13, gras: true })}{T(270, 14, 'SAA (linéaire)', { size: 13, gras: true })}
    <line x1="40" y1="156" x2="152" y2="156" stroke={K.gris}/><line x1="40" y1="156" x2="40" y2="40" stroke={K.gris}/><line x1={icp(0.001)} y1={ys(0.001)} x2={icp(1000)} y2={ys(1000)} stroke="#be185d" strokeWidth="2.4"/>
    {[0.001, 0.1, 10, 1000].map(v => <g key={v}><line x1={icp(v)} y1="156" x2={icp(v)} y2="161" stroke={K.gris}/>{T(icp(v), 174, String(v).replace('.', ','), { size: 11.5, fill: K.gris })}</g>)}
    {T(96, 192, 'c (mg/L)', { size: 12, fill: K.gris })}{T(46, 36, 'signal', { size: 12, fill: K.gris, anchor: 'start' })}
    <line x1="214" y1="156" x2="326" y2="156" stroke={K.gris}/><line x1="214" y1="156" x2="214" y2="40" stroke={K.gris}/><path d={ptsA} fill="none" stroke="#1d4ed8" strokeWidth="2.4"/>
    <line x1="214" y1="156" x2={sA(30)} y2={156 + (yA(10) - 156) / 10 * 30} stroke="#64748b" strokeDasharray="2 4" strokeWidth="1.3"/>
    {[0, 50, 100].map(v => <g key={v}><line x1={sA(v)} y1="156" x2={sA(v)} y2="161" stroke={K.gris}/>{T(sA(v), 174, String(v), { size: 11.5, fill: K.gris })}</g>)}
    {T(270, 192, 'c (mg/L)', { size: 12, fill: K.gris })}{T(220, 36, 'A', { size: 12, fill: K.gris, anchor: 'start' })}
    {c > 0 && <g><circle cx={icp(Math.max(c, 0.001))} cy={ys(Math.max(c, 0.001))} r="5" fill="#b45309" stroke="#fff" strokeWidth="1.2"/><circle cx={sA(Math.min(c, 100))} cy={yA(Math.min(c, 100))} r="5" fill={hors ? '#dc2626' : '#b45309'} stroke="#fff" strokeWidth="1.2"/>
      {hors && T(270, 216, 'hors plage : dilution', { size: 12, gras: true, fill: '#dc2626' })}{!hors && T(270, 216, 'dans la plage linéaire', { size: 12, fill: K.gris })}</g>}
  </svg>);
}

// ---------- carte « À retenir » : flamme et plasma ----------
export function SvgCarteComparaison() {
  const ligne = (y, lab, f, pl) => <g key={lab}>{T(76, y, lab, { size: 12.5, gras: true })}{T(160, y, f, { size: 12.5, anchor: 'middle' })}{T(246, y, pl, { size: 12.5, anchor: 'middle' })}</g>;
  return (<svg role="img" aria-label="Comparaison flamme et plasma : température, éléments détectables, gamme" viewBox="0 0 300 150" width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    {T(160, 16, 'Flamme', { size: 13.5, gras: true })}{T(246, 16, 'Plasma ICP', { size: 13.5, gras: true })}
    <line x1="10" y1="24" x2="290" y2="24" stroke={K.clair}/>
    {ligne(44, 'Température', '≈ 2 500 K', '≈ 6 500 K')}{ligne(68, 'Éléments', 'Na, K (SEF)', 'presque tous')}{ligne(92, 'Éléments à la fois', 'un seul', 'plusieurs')}{ligne(116, 'Gamme', '≈ 2 décades', '≈ 6 décades')}
    {T(150, 140, 'plus chaud : plus d’atomes excités', { size: 12, fill: K.gris, gras: true })}
  </svg>);
}
