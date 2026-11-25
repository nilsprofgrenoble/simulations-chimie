// Schémas de la simulation « Diagramme ternaire des microémulsions ». SVG dans un viewBox de 320 de large, textes de 10,5 à 16, largeur 100 % plafonnée.
import { DIAGRAMMES, H3, xy, analyser } from "./ternaireModele";

const C = { txt: '#0f172a', gris: '#64748b', eau: '#2563eb', huile: '#c2410c', ma: '#7c3aed', bi: '#fde68a', tri: '#fca5a5', mono: '#dbeafe' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
const base = (w, h, label, children, max = 400) => <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
const pc = v => Math.round(v * 100);

// Un triangle : eau en bas à gauche, huile en bas à droite, mélange actif en haut. (ox, oy) = sommet « eau », L = côté.
function Tri({ ox, oy, L, type, g, regions, liens, ticks, lecture, phases, dilution, grille = true, lettres }) {
  const P = p => [ox + L * p.x, oy - L * p.y], pt = p => P(p).join(',');
  const C3 = c => P(xy(c));
  const D = type ? DIAGRAMMES[type] : null, a = type && g ? analyser(type, g) : null;
  const els = [];
  els.push(<polygon key="fond" points={[[0, 0], [1, 0], [0.5, H3]].map(([x, y]) => pt({ x, y })).join(' ')} fill={regions ? C.mono : '#fff'} opacity={regions ? 0.55 : 1}/>);
  if (regions && D) {
    D.biphasiques.forEach((z, i) => els.push(<polygon key={'b' + i} points={z.poly.map(pt).join(' ')} fill={C.bi} opacity="0.9"/>));
    if (D.triphasique) els.push(<polygon key="t" points={D.triphasique.map(pt).join(' ')} fill={C.tri} opacity="0.9"/>);
  }
  if (grille) for (let k = 1; k < 10; k++) { const v = k / 10;
    els.push(<line key={'gs' + k} x1={P(xy({ e: 1 - v, h: 0, s: v }))[0]} y1={P(xy({ e: 1 - v, h: 0, s: v }))[1]} x2={P(xy({ e: 0, h: 1 - v, s: v }))[0]} y2={P(xy({ e: 0, h: 1 - v, s: v }))[1]} stroke="#94a3b8" strokeWidth="0.6" opacity="0.55"/>);
    els.push(<line key={'ge' + k} x1={P(xy({ e: v, h: 0, s: 1 - v }))[0]} y1={P(xy({ e: v, h: 0, s: 1 - v }))[1]} x2={P(xy({ e: v, h: 1 - v, s: 0 }))[0]} y2={P(xy({ e: v, h: 1 - v, s: 0 }))[1]} stroke="#94a3b8" strokeWidth="0.6" opacity="0.55"/>);
    els.push(<line key={'gh' + k} x1={P(xy({ e: 1 - v, h: v, s: 0 }))[0]} y1={P(xy({ e: 1 - v, h: v, s: 0 }))[1]} x2={P(xy({ e: 0, h: v, s: 1 - v }))[0]} y2={P(xy({ e: 0, h: v, s: 1 - v }))[1]} stroke="#94a3b8" strokeWidth="0.6" opacity="0.55"/>); }
  if (regions && liens && D) D.biphasiques.forEach((z, i) => { for (let k = 1; k <= 7; k++) { const q = z.courbe[Math.round(z.courbe.length * k / 8)]; els.push(<line key={`l${i}${k}`} x1={P(z.sommet)[0]} y1={P(z.sommet)[1]} x2={P(q)[0]} y2={P(q)[1]} stroke="#92400e" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.6"/>); } });
  if (regions && D) { // frontières
    D.biphasiques.forEach((z, i) => els.push(<polyline key={'f' + i} points={z.courbe.map(pt).join(' ')} fill="none" stroke="#b45309" strokeWidth="1.8"/>));
    if (D.triphasique) els.push(<polygon key="ft" points={D.triphasique.map(pt).join(' ')} fill="none" stroke="#b91c1c" strokeWidth="1.4"/>);
  }
  els.push(<polygon key="cadre" points={[[0, 0], [1, 0], [0.5, H3]].map(([x, y]) => pt({ x, y })).join(' ')} fill="none" stroke="#334155" strokeWidth={L > 150 ? 2 : 1.5}/>);
  if (ticks) for (const v of [0.2, 0.4, 0.6, 0.8]) {
    const pe = P(xy({ e: v, h: 0, s: 1 - v })), ph = P(xy({ e: 1 - v, h: v, s: 0 })), ps = P(xy({ e: 0, h: 1 - v, s: v }));
    els.push(T(pe[0] - 7, pe[1] + 4, pc(v), { size: 10.5, anchor: 'end', fill: C.eau, gras: true }));
    els.push(T(ph[0], ph[1] + 15, pc(v), { size: 10.5, fill: C.huile, gras: true }));
    els.push(T(ps[0] + 7, ps[1] + 4, pc(v), { size: 10.5, anchor: 'start', fill: C.ma, gras: true }));
  }
  if (lecture && g) { // pointillés de lecture vers les trois côtés, avec les valeurs
    const [gx, gy] = C3(g), pe = P(xy({ e: g.e, h: 0, s: 1 - g.e })), ph = P(xy({ e: 1 - g.h, h: g.h, s: 0 })), ps = P(xy({ e: 0, h: 1 - g.s, s: g.s }));
    [[pe, C.eau, 'e'], [ph, C.huile, 'h'], [ps, C.ma, 's']].forEach(([q, col, k]) => { els.push(<line key={'lec' + k} x1={gx} y1={gy} x2={q[0]} y2={q[1]} stroke={col} strokeWidth="2" strokeDasharray="4 3"/>); els.push(<circle key={'lc' + k} cx={q[0]} cy={q[1]} r="4.5" fill={col}/>); });
    els.push(T(P(xy({ e: g.e, h: 0, s: 1 - g.e }))[0] - 22, P(xy({ e: g.e, h: 0, s: 1 - g.e }))[1] - 8, `${pc(g.e)} % eau`, { size: 11.5, gras: true, fill: C.eau, anchor: 'end' }));
    els.push(T(P(xy({ e: 1 - g.h, h: g.h, s: 0 }))[0], P(xy({ e: 1 - g.h, h: g.h, s: 0 }))[1] + 30, `${pc(g.h)} % huile`, { size: 11.5, gras: true, fill: C.huile }));
    els.push(T(P(xy({ e: 0, h: 1 - g.s, s: g.s }))[0] + 4, P(xy({ e: 0, h: 1 - g.s, s: g.s }))[1] - 18, `${pc(g.s)} % MA`, { size: 11.5, gras: true, fill: C.ma, anchor: 'start' }));
  }
  if (dilution) { const c = dilution.r, A0 = P(xy({ e: c, h: 0, s: 1 - c })), B0 = P(xy({ e: 0, h: 1, s: 0 }));
    els.push(<line key="dil" x1={A0[0]} y1={A0[1]} x2={B0[0]} y2={B0[1]} stroke="#7c3aed" strokeWidth="2.2" strokeDasharray="6 4"/>);
    els.push(<circle key="dilc" cx={A0[0]} cy={A0[1]} r="5.5" fill="#fff" stroke="#7c3aed" strokeWidth="2.5"/>);
    els.push(T(A0[0] + 10, A0[1] - 8, 'C', { size: 14, gras: true, fill: '#7c3aed', anchor: 'start' }));
    if (dilution.phi != null) { const q = C3({ e: c * (1 - dilution.phi), h: dilution.phi, s: (1 - c) * (1 - dilution.phi) }); els.push(<circle key="dilq" cx={q[0]} cy={q[1]} r="5" fill="#7c3aed" stroke="#fff" strokeWidth="1.5"/>); } }
  if (a && g && regions) { // phases en équilibre (points sur le diagramme)
    if (a.tie && phases) els.push(<line key="tie" x1={P(a.tie.de)[0]} y1={P(a.tie.de)[1]} x2={P(a.tie.vers)[0]} y2={P(a.tie.vers)[1]} stroke="#7c2d12" strokeWidth="2.2"/>);
    if (phases) a.phases.forEach(p => { const q = C3(p.comp), col = p.id === 'huile' ? '#ef4a23' : p.id === 'micro' ? '#2563eb' : '#64748b'; els.push(<circle key={'ph' + p.id} cx={q[0]} cy={q[1]} r={L > 150 ? 5.5 : 3.5} fill={col} stroke="#fff" strokeWidth="1.5"/>); });
  }
  if (g) { const [gx, gy] = C3(g), s = L > 150 ? 9 : 6; els.push(<rect key="G" x={gx - s / 2} y={gy - s / 2} width={s} height={s} fill="#fff" stroke="#0f172a" strokeWidth={L > 150 ? 2.5 : 1.8}/>); }
  if (lettres) { const [ex, ey] = P({ x: 0, y: 0 }), [hx, hy] = P({ x: 1, y: 0 }), [sx, sy] = P({ x: 0.5, y: H3 });
    els.push(T(ex - (L > 150 ? 2 : 3), ey + (L > 150 ? 32 : 13), lettres[0], { size: L > 150 ? 13 : 11, gras: true, fill: C.eau }));
    els.push(T(hx + 2, hy + (L > 150 ? 32 : 13), lettres[1], { size: L > 150 ? 13 : 11, gras: true, fill: C.huile }));
    els.push(T(sx, sy - 9, lettres[2], { size: L > 150 ? 13 : 11, gras: true, fill: C.ma })); }
  return <g>{els}</g>;
}
const LEGENDE = [[C.mono, '1 phase'], [C.bi, '2 phases'], [C.tri, '3 phases']];

// Diagramme principal. g = {e,h,s} (fractions) ; type = 'I' | 'II' | 'III' ou null (triangle vierge)
export function SvgTernaire({ type, g, regions = true, liens = true, phases = false, dilution = null, lecture = false }) {
  const a = type && g ? analyser(type, g) : null;
  return base(320, 322, g ? `diagramme ternaire eau, huile, mélange actif : mélange à ${pc(g.e)} % d’eau, ${pc(g.h)} % d’huile et ${pc(g.s)} % de mélange actif${a && regions ? `, ${a.n} phase${a.n > 1 ? 's' : ''}` : ''}` : 'diagramme ternaire eau, huile, mélange actif', <>
    <Tri ox={30} oy={266} L={260} type={type} g={g} regions={regions} liens={liens} ticks lecture={lecture} phases={phases} dilution={dilution} lettres={['Eau', 'Huile', 'Mélange actif']}/>
    {regions && LEGENDE.map(([c, l], i) => <g key={l}><rect x="6" y={26 + 17 * i} width="14" height="12" rx="2" fill={c} stroke="#475569" strokeWidth="1"/>{T(25, 36 + 17 * i, l, { size: 11, anchor: 'start' })}</g>)}
    {T(160, 318, 'teneurs en % massiques', { size: 10.5, fill: C.gris })}
  </>);
}
// Carte « lire un diagramme ternaire » : un point et ses trois lectures
export function SvgCarteLecture() {
  const g = { e: 0.5, h: 0.3, s: 0.2 };
  return base(320, 322, 'lire un point sur un diagramme ternaire : 50 % d’eau, 30 % d’huile, 20 % de mélange actif', <>
    <Tri ox={30} oy={266} L={260} g={g} regions={false} ticks lecture lettres={['Eau', 'Huile', 'Mélange actif']}/>
    {T(160, 318, 'chaque teneur se lit sur le côté de même couleur', { size: 11, fill: C.gris })}
  </>, 380);
}
// Carte « trois diagrammes » : Winsor I, III, II avec le même mélange A (45 % / 45 % / 10 %)
export function SvgCarteTrois() {
  const g = { e: 0.45, h: 0.45, s: 0.10 };
  return base(320, 152, 'trois diagrammes de phases : Winsor I, Winsor III, Winsor II, avec le même mélange', <>
    {[['I', 'Winsor I', 'ME H/E + huile'], ['III', 'Winsor III', '3 phases'], ['II', 'Winsor II', 'ME E/H + eau']].map(([t, nom, sous], i) => <g key={t}>
      <Tri ox={6 + i * 106} oy={104} L={84} type={t} g={g} regions liens={false} grille={false} lettres={['E', 'H', 'S']}/>
      {T(48 + i * 106, 130, nom, { size: 12.5, gras: true })}{T(48 + i * 106, 145, sous, { size: 10.5, fill: C.gris })}</g>)}
  </>, 400);
}
// Carte « ligne de dilution » : solution initiale C (eau + mélange actif), ajout d'huile
export function SvgCarteDilution() {
  return base(320, 322, 'ligne de dilution par l’huile : du point C sur le côté eau–mélange actif vers le sommet huile', <>
    <Tri ox={30} oy={266} L={260} regions={false} ticks dilution={{ r: 0.7, phi: 0.4 }} lettres={['Eau', 'Huile', 'Mélange actif']}/>
    {T(160, 318, 'ajouter de l’huile : on avance vers le sommet Huile', { size: 11, fill: C.gris })}
  </>, 380);
}
