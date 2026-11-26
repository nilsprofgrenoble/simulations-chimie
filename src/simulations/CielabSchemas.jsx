// Schémas de la simulation « Couleur : L*, a*, b* et écart de couleur ». SVG, textes de 10,5 à 16, largeur 100 % plafonnée.
import { cssDeLab, srgb, xyzDeLab, lch, ellipseCMC } from "./couleurModele";

const K = { txt: '#0f172a', gris: '#64748b', cible: '#0f172a', lot: '#c2410c', vert: '#15803d', rouge: '#b91c1c', jaune: '#a16207', bleu: '#1d4ed8', orange: '#b45309', violet: '#7c3aed' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
const base = (w, h, label, children, max = 400) => <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
const n0 = v => String(Math.round(v)).replace('-', '−');
const gris = L => srgb(xyzDeLab({ L, a: 0, b: 0 })).css;

// ---------- Étape 1 : la luminosité L* ----------
export function SvgLuminosite({ lab }) {
  const bar = []; for (let k = 0; k < 20; k++) bar.push(<rect key={k} x={26} y={14 + k * 8.5} width={30} height={8.6} fill={gris(100 - k * 100 / 19)}/>);
  const y = 14 + 170 * (1 - lab.L / 100);
  return base(320, 214, `Échantillon de luminosité L* = ${n0(lab.L)}`, <>
    {bar}<rect x={26} y={14} width={30} height={170} fill="none" stroke="#334155" strokeWidth="1.5"/>
    <polygon points={`${60},${y} ${74},${y - 7} ${74},${y + 7}`} fill={K.orange}/>
    {T(41, 204, 'L*', { size: 13, gras: true })}{T(82, 22, '100 (blanc)', { size: 10.5, anchor: 'start', fill: K.gris })}{T(82, 188, '0 (noir)', { size: 10.5, anchor: 'start', fill: K.gris })}
    <rect x={130} y={20} width={170} height={150} rx={6} fill={cssDeLab(lab)} stroke="#334155" strokeWidth="1.5"/>
    {T(215, 196, 'échantillon', { size: 12, fill: K.gris })}
  </>);
}

// ---------- Deux pastilles côte à côte (cible, lot) ----------
export function SvgPastilles({ cible, lot, nomLot = 'Lot' }) {
  const et = l => `L* ${n0(l.L)} · a* ${n0(l.a)} · b* ${n0(l.b)}`;
  return base(320, 120, 'Couleur de la cible et du lot, côte à côte', <>
    <rect x={20} y={8} width={140} height={64} fill={cssDeLab(cible)}/><rect x={160} y={8} width={140} height={64} fill={cssDeLab(lot)}/>
    <rect x={20} y={8} width={280} height={64} fill="none" stroke="#334155" strokeWidth="1.5"/>
    {T(90, 92, 'Cible', { size: 13, gras: true, fill: K.cible })}{T(230, 92, nomLot, { size: 13, gras: true, fill: K.lot })}
    {T(90, 110, et(cible), { size: 10.5, fill: K.gris })}{T(230, 110, et(lot), { size: 10.5, fill: K.gris })}
  </>, 380);
}

// ---------- Plan a*b* ----------
// pts : [{ lab, nom, col, plein, cyl }] ; zoom : { centre:{a,b}, demi } pour agrandir autour de la cible ; tol : { cible, tolE, tolCMC } pour dessiner les zones de tolérance
export function SvgPlanAB({ pts = [], lfond = 60, zoom = null, tol = null, axes = true, noms = true }) {
  const X0 = 38, Y0 = 14, W = 308, cx = X0 + W / 2, cy = Y0 + W / 2;
  const demi = zoom ? zoom.demi : 60, s = (W / 2) / demi, c0 = zoom ? zoom.centre : { a: 0, b: 0 };
  const px = a => cx + (a - c0.a) * s, py = b => cy - (b - c0.b) * s;
  const els = [];
  if (!zoom) {
    const pas = 6, n = Math.round(2 * demi / pas);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const a = -demi + (i + 0.5) * pas, b = demi - (j + 0.5) * pas, c = srgb(xyzDeLab({ L: lfond, a, b }));
      els.push(<rect key={`${i}-${j}`} x={X0 + i * (W / n)} y={Y0 + j * (W / n)} width={W / n + 0.4} height={W / n + 0.4} fill={c.hors ? '#e2e8f0' : c.css}/>);
    }
  } else {
    els.push(<rect key="fond" x={X0} y={Y0} width={W} height={W} fill="#f8fafc"/>);
    for (let k = -Math.floor(demi); k <= Math.floor(demi); k++) {
      const a = Math.round(c0.a) + k, b = Math.round(c0.b) + k;
      if (Math.abs(a - c0.a) <= demi) els.push(<line key={'ga' + k} x1={px(a)} y1={Y0} x2={px(a)} y2={Y0 + W} stroke="#cbd5e1" strokeWidth="0.7"/>);
      if (Math.abs(b - c0.b) <= demi) els.push(<line key={'gb' + k} x1={X0} y1={py(b)} x2={X0 + W} y2={py(b)} stroke="#cbd5e1" strokeWidth="0.7"/>);
    }
  }
  els.push(<rect key="cadre" x={X0} y={Y0} width={W} height={W} fill="none" stroke="#334155" strokeWidth="1.5"/>);
  if (axes && !zoom) {
    els.push(<line key="ax" x1={X0} y1={cy} x2={X0 + W} y2={cy} stroke="#0f172a" strokeWidth="1.3"/>, <line key="ay" x1={cx} y1={Y0} x2={cx} y2={Y0 + W} stroke="#0f172a" strokeWidth="1.3"/>);
    els.push(T(X0 + W - 3, cy - 5, '+a*', { size: 12, gras: true, anchor: 'end' }), T(X0 + 3, cy - 5, '−a*', { size: 12, gras: true, anchor: 'start' }), T(cx + 5, Y0 + 12, '+b*', { size: 12, gras: true, anchor: 'start' }), T(cx + 5, Y0 + W - 5, '−b*', { size: 12, gras: true, anchor: 'start' }));
    els.push(T(X0 + W - 3, cy + 15, 'rouge', { size: 10.5, anchor: 'end' }), T(X0 + 3, cy + 15, 'vert', { size: 10.5, anchor: 'start' }), T(cx - 5, Y0 + 12, 'jaune', { size: 10.5, anchor: 'end' }), T(cx - 5, Y0 + W - 5, 'bleu', { size: 10.5, anchor: 'end' }));
  }
  if (zoom) { // repères de graduation : valeurs de a* en bas, de b* à gauche
    for (const k of [-1, 0, 1]) { const a = Math.round(c0.a + k * demi / 1.5), b = Math.round(c0.b + k * demi / 1.5);
      els.push(T(px(a), Y0 + W + 14, n0(a), { size: 10.5, fill: K.gris }), T(X0 - 4, py(b) + 4, n0(b), { size: 10.5, fill: K.gris, anchor: 'end' })); }
    els.push(T(X0 + W / 2, Y0 + W + 28, 'a*', { size: 11, gras: true, fill: K.gris }), T(10, Y0 + W / 2, 'b*', { size: 11, gras: true, fill: K.gris }));
  }
  if (tol) { // zones de tolérance autour de la cible : sphère ΔE*ab (cercle) et ellipsoïde CMC (ellipse), dans le plan a*b*
    const e = ellipseCMC(tol.cible, tol.tolCMC);
    els.push(<circle key="tolE" cx={px(tol.cible.a)} cy={py(tol.cible.b)} r={tol.tolE * s} fill="none" stroke={K.violet} strokeWidth="2" strokeDasharray="5 4"/>);
    els.push(<ellipse key="tolC" cx={px(tol.cible.a)} cy={py(tol.cible.b)} rx={e.rC * s} ry={e.rH * s} transform={`rotate(${-e.angle} ${px(tol.cible.a)} ${py(tol.cible.b)})`} fill="rgba(21,128,61,0.18)" stroke={K.vert} strokeWidth="2.2"/>);
  }
  for (const p of pts) {
    const x = px(p.lab.a), y = py(p.lab.b), col = p.col ?? K.cible;
    if (p.cyl && !zoom) {
      const c = lch(p.lab), r = 34, a1 = Math.min(c.h, 360 - c.h) * Math.PI / 180, sens = c.h <= 180 ? 0 : 1;
      els.push(<line key={'C' + p.nom} x1={cx} y1={cy} x2={x} y2={y} stroke="#0f172a" strokeWidth="2.2"/>);
      if (c.h > 2 && c.h < 358) els.push(<path key={'h' + p.nom} d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 ${sens} ${cx + r * Math.cos(a1)} ${cy + (c.h <= 180 ? -1 : 1) * r * Math.sin(a1)}`} fill="none" stroke={K.orange} strokeWidth="2.5"/>);
      els.push(T((cx + x) / 2 + (y < cy ? 12 : -12), (cy + y) / 2 - 6, 'C*', { size: 13, gras: true }), T(cx + r + 10, cy + (c.h <= 180 ? -8 : 17), 'h', { size: 13, gras: true, fill: K.orange, anchor: 'start' }));
    }
    els.push(<circle key={'p' + p.nom} cx={x} cy={y} r={zoom ? 6.5 : 7.5} fill={p.plein === false ? 'none' : col} stroke={p.plein === false ? col : '#fff'} strokeWidth={p.plein === false ? 3 : 2}/>);
    if (noms && p.nom) els.push(T(x + (x > X0 + W - 70 ? -11 : 11), y - 9, p.nom, { size: 11.5, gras: true, fill: col, anchor: x > X0 + W - 70 ? 'end' : 'start' }));
  }
  return base(360, zoom ? 372 : 358, zoom ? 'Plan a*b*, agrandi autour de la cible' : 'Plan a*b* (couleurs à L* fixe)', els, 400);
}

// ---------- Cartes « À retenir » (viewBox 300 de large) ----------
export function SvgCarteAB() {
  return base(300, 198, 'Les trois coordonnées de CIELAB', <>
    <rect x={8} y={22} width={26} height={134} fill="url(#gL)" stroke="#334155" strokeWidth="1.3"/>
    <defs><linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#000"/></linearGradient></defs>
    {T(21, 16, 'L*', { size: 13, gras: true })}{T(40, 32, '100 blanc', { size: 10.5, anchor: 'start', fill: K.gris })}{T(40, 154, '0 noir', { size: 10.5, anchor: 'start', fill: K.gris })}
    <line x1={150} y1={95} x2={290} y2={95} stroke="#0f172a" strokeWidth="1.6"/><line x1={220} y1={22} x2={220} y2={168} stroke="#0f172a" strokeWidth="1.6"/>
    <circle cx={150} cy={95} r={9} fill="#16a34a"/><circle cx={290} cy={95} r={9} fill="#dc2626"/><circle cx={220} cy={24} r={9} fill="#eab308"/><circle cx={220} cy={166} r={9} fill="#2563eb"/>
    {T(150, 120, '−a* vert', { size: 11.5, gras: true, fill: K.vert })}{T(268, 120, '+a* rouge', { size: 11.5, gras: true, fill: K.rouge })}
    {T(270, 28, '+b* jaune', { size: 11.5, gras: true, fill: K.jaune })}{T(160, 172, '−b* bleu', { size: 11.5, gras: true, fill: K.bleu })}
    {T(150, 192, 'a* : vert → rouge ; b* : bleu → jaune', { size: 10.5, fill: K.gris })}
  </>, 340);
}
export function SvgCarteCyl() {
  const cx = 70, cy = 140, px = 190, py = 50, dx = px - cx, dy = cy - py, r = 38;
  return base(300, 190, 'Coordonnées rectangulaires et cylindriques', <>
    <line x1={20} y1={cy} x2={285} y2={cy} stroke="#0f172a" strokeWidth="1.4"/><line x1={cx} y1={15} x2={cx} y2={176} stroke="#0f172a" strokeWidth="1.4"/>
    {T(284, cy + 15, 'a*', { size: 12, gras: true, anchor: 'end' })}{T(cx + 8, 22, 'b*', { size: 12, gras: true, anchor: 'start' })}
    <line x1={px} y1={cy} x2={px} y2={py} stroke="#64748b" strokeWidth="1.3" strokeDasharray="4 3"/><line x1={cx} y1={py} x2={px} y2={py} stroke="#64748b" strokeWidth="1.3" strokeDasharray="4 3"/>
    {T(px + 6, (cy + py) / 2 + 4, 'b*', { size: 12, anchor: 'start', fill: K.gris })}{T((cx + px) / 2, cy + 15, 'a*', { size: 12, fill: K.gris })}
    <line x1={cx} y1={cy} x2={px} y2={py} stroke="#0f172a" strokeWidth="2.6"/>
    <path d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx + r * dx / Math.hypot(dx, dy)} ${cy - r * dy / Math.hypot(dx, dy)}`} fill="none" stroke={K.orange} strokeWidth="2.6"/>
    {T(cx + r + 8, cy - 10, 'h', { size: 14, gras: true, fill: K.orange, anchor: 'start' })}{T((cx + px) / 2 - 12, (cy + py) / 2 - 8, 'C*', { size: 14, gras: true })}
    <circle cx={px} cy={py} r={8} fill={K.bleu} stroke="#fff" strokeWidth="2"/>
    {T(150, 186, 'C* = √(a*² + b*²)', { size: 11.5, fill: K.txt, anchor: 'start' })}
  </>, 340);
}
export function SvgCarteEcart() {
  const rang = (y, titre, plus, moins) => <g key={titre}>{T(14, y + 4, titre, { size: 13.5, gras: true, anchor: 'start' })}
    {T(100, y + 4, `> 0 : ${plus}`, { size: 12, anchor: 'start', fill: K.vert })}{T(100, y + 21, `< 0 : ${moins}`, { size: 12, anchor: 'start', fill: K.rouge })}</g>;
  return base(300, 154, 'Lire les signes des écarts', <>
    {rang(22, 'ΔL*', 'lot plus clair', 'lot plus foncé')}{rang(64, 'ΔC*', 'lot plus saturé', 'lot plus terne')}{rang(106, 'ΔH*', 'h augmente', 'h diminue')}
    {T(150, 148, 'Écarts toujours : lot − cible', { size: 10.5, fill: K.gris })}
  </>, 340);
}
export function SvgCarteTolerance() {
  const cx = 150, cy = 80;
  return base(300, 175, 'Sphère ΔE*ab et ellipsoïde CMC autour de la cible', <>
    <circle cx={cx} cy={cy} r={42} fill="none" stroke={K.violet} strokeWidth="2.2" strokeDasharray="5 4"/>
    <ellipse cx={cx} cy={cy} rx={62} ry={32} transform={`rotate(-25 ${cx} ${cy})`} fill="rgba(21,128,61,0.18)" stroke={K.vert} strokeWidth="2.4"/>
    <circle cx={cx} cy={cy} r={6} fill={K.cible}/>{T(cx - 4, cy + 20, 'cible', { size: 11, anchor: 'end' })}
    {T(60, 18, 'ΔE*ab : zone ronde', { size: 11.5, gras: true, fill: K.violet, anchor: 'start' })}{T(150, 164, 'CMC : plus étroite en teinte', { size: 11.5, gras: true, fill: K.vert })}
  </>, 340);
}
