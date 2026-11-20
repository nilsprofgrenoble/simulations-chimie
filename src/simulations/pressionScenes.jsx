// ====================================================
//  Scènes (schémas) de la simulation « Fluide au repos : pression, force pressante et loi de Mariotte » (1G, sim 162).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
//  Flèches : trait fin (2,5), pointe de taille FIXE dessinée à la main (jamais un marker SVG).
//  Les forces sont des vecteurs : lettre + flèche (composant TV, notation vectorielle).
//  Les entités du gaz sont des points bleus en agitation (animation légère, arrêtable ; respecte prefers-reduced-motion).
// ====================================================
import { useEffect, useRef, useState } from "react";
import * as M from "./pressionModele";
import { COL, stl, alea } from "./pressionStyle";

const NB = '\u00a0';
const tri = x => { const m = ((x % 2) + 2) % 2; return m <= 1 ? m : 2 - m; };                                    // va-et-vient entre 0 et 1

// ---------- flèche fine à pointe fixe ----------
export function Fl({ x1, y1, x2, y2, c = COL.rouge, w = 2.5, tete = 11, halo = false }) {
  const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, hw = tete * 0.46, th = Math.min(tete, n);
  const bx = x2 - ux * th, by = y2 - uy * th;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {halo && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={w + 4} />}
      <line x1={x1} y1={y1} x2={bx + ux} y2={by + uy} stroke={c} strokeWidth={w} />
      <polygon points={`${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`} fill={c} stroke={c} strokeWidth="1" />
    </g>);
}

// ---------- lettre-vecteur : lettre + flèche au-dessus (notation vectorielle) ----------
export const TV = ({ x, y, children, c = COL.encre, s = 19, w = 700, halo = false }) => {
  const l = s * 0.6, yy = y - s * 0.9, ha = halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {};
  return (
    <g>
      <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} {...ha}>{children}</text>
      <line x1={x} y1={yy} x2={x + l} y2={yy} stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <polyline points={`${x + l - 3.4},${yy - 2.8} ${x + l},${yy} ${x + l - 3.4},${yy + 2.8}`} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>);
};
// F⃗ suivi d'un indice en texte (« gaz », « air », « main »)
export const FVec = ({ x, y, sub, c = COL.encre, s = 19, anchor = 'start', halo = false }) => {
  const largeur = s * 0.62 + (sub ? sub.length * 7.4 + 3 : 0), x0 = anchor === 'end' ? x - largeur : x;
  return (
    <g>
      <TV x={x0} y={y} c={c} s={s} halo={halo}>F</TV>
      {sub && <text x={x0 + s * 0.66} y={y + 4} fontSize="14" fontWeight="700" fill={c} {...(halo ? { stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke' } : {})}>{sub}</text>}
    </g>);
};

// ---------- cadran sans graduation numérique (pression « plus ou moins forte ») ----------
export function Cadran({ cx, cy, r = 36, niveau, c = COL.bleu }) {
  const a = Math.PI * (1 - niveau), pt = (an, rr) => [cx + rr * Math.cos(an), cy - rr * Math.sin(an)];
  const arc = (a0, a1, rr) => { const [x0, y0] = pt(a0, rr), [x1, y1] = pt(a1, rr); return `M${x0.toFixed(1)},${y0.toFixed(1)} A${rr},${rr} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`; };
  const [ex, ey] = pt(a, r - 7);
  return (
    <g strokeLinecap="round">
      <path d={arc(Math.PI, 0, r)} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      {niveau > 0.02 && <path d={arc(Math.PI, a, r)} fill="none" stroke={c} strokeWidth="8" />}
      {[0, 0.25, 0.5, 0.75, 1].map(k => { const [x1, y1] = pt(Math.PI * (1 - k), r - 9), [x2, y2] = pt(Math.PI * (1 - k), r - 15); return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COL.gris} strokeWidth="1.8" />; })}
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={COL.acier} strokeWidth="3" />
      <circle cx={cx} cy={cy} r="5" fill={COL.acier} />
    </g>);
}

// ---------- thermomètre ----------
export function Thermo({ x, y, theta }) {
  const H = 66, k = Math.max(0, Math.min(1, theta / 100)), h = 6 + k * (H - 6);
  return (
    <g>
      <rect x={x - 6} y={y} width="12" height={H} rx="6" fill="#f8fafc" stroke={COL.gris} strokeWidth="2" />
      <rect x={x - 2.5} y={y + H - h} width="5" height={h} rx="2.5" fill="#dc2626" />
      <circle cx={x} cy={y + H + 7} r="10" fill="#dc2626" stroke={COL.gris} strokeWidth="2" />
      {[0.25, 0.5, 0.75].map(t => <line key={t} x1={x + 6} y1={y + H - t * H} x2={x + 11} y2={y + H - t * H} stroke={COL.gris} strokeWidth="1.6" strokeLinecap="round" />)}
      <text x={x} y={y + H + 36} fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.encre}>{String(Math.round(theta)).replace('-', '−')}{NB}°C</text>
    </g>);
}

// ---------- capteur de pression : cadran (sans nombre) ou affichage numérique ----------
function Capteur({ capteur }) {
  const num = capteur.type === 'nombre';
  return (
    <g>
      <path d="M86,134 H70 V204" fill="none" stroke={COL.gris} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M86,134 H70 V204" fill="none" stroke="#e2e8f0" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="204" width="120" height="88" rx="10" fill="#f8fafc" stroke={COL.acier} strokeWidth="2.5" />
      <text x="70" y="226" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt2}>Capteur</text>
      {num ? <g><text x="70" y="256" fontSize={String(capteur.valeur).length > 6 ? 21 : 24} fontWeight="700" textAnchor="middle" fill={COL.encre} fontFamily="monospace">{capteur.valeur}</text>
        <text x="70" y="280" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.bleu}>{capteur.unite}</text></g>
        : <Cadran cx={70} cy={276} r={34} niveau={capteur.niveau} />}
    </g>);
}

// ---------- gaz en agitation (animation légère) ----------
const REDUIT = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NMAX = 64, BASE = Array.from({ length: NMAX }, (_, i) => ({ u: alea(i * 3 + 1) * 2, v: alea(i * 3 + 2) * 2, su: 0.5 + alea(i * 3 + 3) * 1.0, sv: 0.5 + alea(i * 3 + 9) * 1.0 }));
function GazAnime({ xg, xd, yh, yb, N, vit, chocs, fige, r = 3.7 }) {
  const [ph, setPh] = useState(() => ({ u: BASE.map(b => b.u), v: BASE.map(b => b.v) }));
  const par = useRef({ L: 1, H: 1, vit: 1 });
  useEffect(() => { par.current = { L: Math.max(10, xd - xg - 2 * r), H: Math.max(10, yb - yh - 2 * r), vit }; });
  useEffect(() => {
    if (fige || REDUIT()) return undefined;
    let raf = 0, dernier = performance.now(), dessine = dernier;
    const boucle = t => {
      raf = requestAnimationFrame(boucle);
      if (t - dessine < 32) return;
      const dt = Math.min(0.06, (t - dernier) / 1000); dernier = t; dessine = t;
      const { L, H, vit: v } = par.current;
      setPh(p => ({ u: p.u.map((x, i) => x + BASE[i].su * 70 * v * dt / L), v: p.v.map((y, i) => y + BASE[i].sv * 70 * v * dt / H) }));
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [fige]);
  const L = Math.max(10, xd - xg - 2 * r), H = Math.max(10, yb - yh - 2 * r), pts = [];
  for (let i = 0; i < Math.min(N, NMAX); i++) {
    const u = tri(ph.u[i]), v = tri(ph.v[i]);
    pts.push({ x: xg + r + u * L, y: yh + r + v * H, u, v, i });
  }
  return (
    <g>
      {chocs && pts.map(p => {
        const m = [];
        if (p.u > 0.97) m.push(<line key="d" x1={xd} y1={p.y - 6} x2={xd} y2={p.y + 6} stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />);
        if (p.u < 0.03) m.push(<line key="g" x1={xg} y1={p.y - 6} x2={xg} y2={p.y + 6} stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />);
        if (p.v > 0.97) m.push(<line key="b" x1={p.x - 6} y1={yb} x2={p.x + 6} y2={yb} stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />);
        if (p.v < 0.03) m.push(<line key="h" x1={p.x - 6} y1={yh} x2={p.x + 6} y2={yh} stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />);
        return m.length ? <g key={p.i}>{m}</g> : null;
      })}
      {pts.map(p => <circle key={p.i} cx={p.x} cy={p.y} r={r} fill={COL.bleu} stroke="#fff" strokeWidth="0.9" opacity="0.93" />)}
    </g>);
}
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

// ====================================================
//  La seringue fermée, reliée à un capteur de pression
//  V : volume de gaz (mL), N : nombre d'entités tracées, theta : température (°C), capteur : {type:'cadran', niveau} | {type:'nombre', valeur, unite} | null
//  thermo : affiche le thermomètre ; bloque : piston bloqué ; chocs : surligne les chocs sur les parois ; surface : texte « S = … » (disque vue de face)
//  fleches : { gaz: px, air: px, main: px (positif : on pousse vers le gaz) } longueurs de flèches (null : absentes) ; legendeF : texte des étiquettes
// ====================================================
export function SceneSeringue({ V = 60, N = 30, theta = 20, capteur = null, thermo = false, bloque = false, chocs = false, surface = null, fleches = null, fige = false, titre = 'Une seringue fermée, reliée à un capteur de pression', note = null, grand = false }) {
  const xp = 100 + 4 * V, cold = [214, 234, 255], hot = [255, 224, 190], [r, g, b] = mix(cold, hot, Math.max(0, Math.min(1, theta / 100)));
  const f = fleches || {}, gx = xp + 7;
  const aria = `${titre} : volume de gaz ${Math.round(V)} millilitres, température ${Math.round(theta)} degrés Celsius${bloque ? ', piston bloqué' : ''}.`;
  return (
    <svg viewBox={(fleches || note || grand) ? "0 0 480 300" : "0 66 480 234"} style={stl} role="img" aria-label={aria}>
      {/* tube de la seringue */}
      <rect x="100" y="104" width="240" height="60" rx="7" fill="#f8fafc" stroke={COL.gris} strokeWidth="2.5" />
      <rect x={100} y="104" width={xp - 100} height="60" rx="7" fill={`rgb(${r},${g},${b})`} />
      <rect x="100" y="104" width="240" height="60" rx="7" fill="none" stroke={COL.gris} strokeWidth="2.5" />
      <rect x="336" y="98" width="8" height="72" rx="3" fill="#94a3b8" stroke={COL.gris} strokeWidth="1.5" />
      <path d="M100,126 L86,128 L86,140 L100,142" fill="#cbd5e1" stroke={COL.gris} strokeWidth="2" strokeLinejoin="round" />
      {/* graduations */}
      {[0, 20, 40, 60].map(v => <g key={v}><line x1={100 + 4 * v} y1="164" x2={100 + 4 * v} y2="173" stroke={COL.gris} strokeWidth="2" strokeLinecap="round" />
        <text x={100 + 4 * v} y="192" fontSize="19" textAnchor="middle" fill={COL.txt2}>{v}</text></g>)}
      <text x="376" y="192" fontSize="19" fill={COL.txt2}>mL</text>
      {/* gaz */}
      <GazAnime xg={100} xd={xp} yh={104} yb={164} N={N} vit={M.vitesseRelative(theta)} chocs={chocs} fige={fige} />
      {/* piston, tige, poignée */}
      <rect x={xp + 14} y="131" width="70" height="6" rx="3" fill="#94a3b8" />
      <rect x={xp} y="106" width="14" height="56" rx="3" fill={COL.acier} stroke="#1e293b" strokeWidth="1.5" />
      <line x1={xp + 4} y1="110" x2={xp + 4} y2="158" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
      <rect x={xp + 84} y="116" width="9" height="36" rx="3" fill={COL.acier} stroke="#1e293b" strokeWidth="1.5" />
      {bloque && <g><rect x={xp + 17} y="120" width="11" height="28" rx="2" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
        <text x={xp + 40} y="94" fontSize="19" fontWeight="700" fill={COL.rouge}>piston bloqué</text></g>}
      {/* forces sur le piston (représentées à côté du schéma, à partir du centre du piston) */}
      {(f.gaz || f.air || f.main) && <g>
        <line x1={gx} y1="22" x2={gx} y2="104" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" />
        <circle cx={gx} cy="104" r="3.4" fill={COL.acier} />
        {f.gaz && <g><Fl x1={gx} y1={34} x2={gx + f.gaz} y2={34} c={COL.rouge} halo /><FVec x={gx - 8} y={40} sub="gaz" c={COL.rouge} anchor="end" halo /></g>}
        {f.air && <g><Fl x1={gx} y1={58} x2={gx - f.air} y2={58} c={COL.bleu} halo /><FVec x={gx + 8} y={64} sub="air" c={COL.bleu} halo /></g>}
        {f.main && <g><Fl x1={gx} y1={82} x2={gx - f.main} y2={82} c={COL.orange} halo /><FVec x={f.main > 0 ? gx + 8 : gx - 8} y={88} sub="main" c={COL.orange} anchor={f.main > 0 ? 'start' : 'end'} halo /></g>}
      </g>}
      {/* capteur */}
      {capteur && <Capteur capteur={capteur} />}
      {/* thermomètre */}
      {thermo && <Thermo x={450} y={186} theta={theta} />}
      {/* surface du piston, vue de face */}
      {surface && <g>
        <text x="262" y="214" fontSize="19" textAnchor="middle" fill={COL.txt2}>face du piston</text>
        <circle cx="262" cy="248" r="27" fill="#cbd5e1" stroke={COL.acier} strokeWidth="2.5" />
        <circle cx="262" cy="248" r="19" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.8" />
        <text x="262" y="293" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.orange}>{surface}</text>
      </g>}
      {note && <text x="240" y="16" fontSize="15" textAnchor="middle" fill={COL.gris}>{note}</text>}
    </svg>);
}

// ====================================================
//  Trois systèmes : un solide, un liquide, un gaz (sans les nommer « solide / liquide / gaz »)
// ====================================================
export function SceneTrois() {
  return (
    <svg viewBox="0 0 480 230" style={stl} role="img" aria-label="Trois systèmes : un bloc de bois, de l’eau dans un verre et de l’air dans un ballon.">
      <defs>
        <linearGradient id="fl-bois" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6a76b" /><stop offset="1" stopColor="#b9803f" /></linearGradient>
        <linearGradient id="fl-eau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfdbfe" /><stop offset="1" stopColor="#7dd3fc" /></linearGradient>
        <radialGradient id="fl-ballon" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#fecaca" /><stop offset="1" stopColor="#f87171" /></radialGradient>
      </defs>
      <line x1="14" y1="170" x2="466" y2="170" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
      {/* bloc de bois */}
      <g>
        <polygon points="36,170 36,112 118,112 118,170" fill="url(#fl-bois)" stroke="#7c4a1a" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="36,112 56,94 138,94 118,112" fill="#e8c593" stroke="#7c4a1a" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="118,112 138,94 138,152 118,170" fill="#a8702f" stroke="#7c4a1a" strokeWidth="2.5" strokeLinejoin="round" />
        {[128, 140, 152].map(y => <path key={y} d={`M44,${y} Q77,${y - 5} 110,${y}`} fill="none" stroke="#9a6529" strokeWidth="1.8" strokeLinecap="round" />)}
        <text x="86" y="204" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>bloc de bois</text>
      </g>
      {/* verre d'eau */}
      <g>
        <path d="M188,92 L200,170 L270,170 L282,92 Z" fill="#f1f5f9" opacity="0.7" stroke="#64748b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M191,116 Q211,110 235,116 T279,116 L271,168 L199,168 Z" fill="url(#fl-eau)" opacity="0.95" />
        <path d="M191,116 Q211,110 235,116 T279,116" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M188,92 L200,170 L270,170 L282,92" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinejoin="round" />
        <text x="235" y="204" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>eau dans un verre</text>
      </g>
      {/* ballon d'air */}
      <g>
        <ellipse cx="398" cy="108" rx="48" ry="56" fill="url(#fl-ballon)" stroke="#b91c1c" strokeWidth="2.5" />
        <path d="M392,163 L398,172 L404,163 Z" fill="#dc2626" stroke="#b91c1c" strokeWidth="2" strokeLinejoin="round" />
        <path d="M398,172 q-5,4 1,7 t-1,7" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="380" cy="86" rx="9" ry="14" fill="#fff" opacity="0.45" transform="rotate(-25 380 86)" />
        <text x="398" y="204" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>air dans un ballon</text>
      </g>
    </svg>);
}

// ====================================================
//  Un gaz dans un récipient à paroi inclinée ; force pressante F⃗ (flèche perpendiculaire) seulement si montrée
// ====================================================
export function SceneParoi({ montrer = false }) {
  // paroi inclinée : D(330,150) → E(250,76) ; normale sortante (0,737 ; −0,676) ≈ perpendiculaire, vers l'extérieur du gaz
  const D = [330, 150], E = [250, 76], dx = E[0] - D[0], dy = E[1] - D[1], n = Math.hypot(dx, dy);
  const px = -dy / n, py = dx / n;                                           // normale à la paroi, dirigée vers le haut et la droite (hors du gaz)
  const Mx = (D[0] + E[0]) / 2, My = (D[1] + E[1]) / 2;
  const pts = [[100, 110], [150, 96], [196, 120], [128, 150], [182, 168], [236, 148], [262, 182], [300, 176], [96, 186], [214, 92], [160, 194], [288, 138], [118, 128], [232, 196], [194, 144], [270, 118]];
  const vit = [[0, 0], [1, [24, -10]], [3, [14, 20]], [5, [26, -14]], [7, [18, -22]], [9, [-8, 22]], [11, [20, -16]], [13, [-14, 14]], [15, [22, -20]]];
  const u1 = dx / n, u1y = dy / n;                                          // direction de la paroi
  const aria = `Un gaz est enfermé dans un récipient dont une paroi est inclinée.${montrer ? ' La force pressante exercée par le gaz sur cette paroi est une flèche perpendiculaire à la paroi, dirigée du gaz vers la paroi.' : ''}`;
  return (
    <svg viewBox="0 0 480 260" style={stl} role="img" aria-label={aria}>
      <polygon points={`70,76 ${E[0]},${E[1]} ${D[0]},${D[1]} 330,226 70,226`} fill="#e0f2fe" />
      <polyline points={`${E[0]},${E[1]} 70,76 70,226 330,226 330,${D[1]}`} fill="none" stroke={COL.acier} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={D[0]} y1={D[1]} x2={E[0]} y2={E[1]} stroke={COL.orange} strokeWidth="6" strokeLinecap="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.6" fill={COL.bleu} stroke="#fff" strokeWidth="1" />)}
      {vit.slice(1).map(([i, [vx, vy]]) => <Fl key={i} x1={pts[i][0] + 6 * Math.sign(vx)} y1={pts[i][1] + 5 * Math.sign(vy)} x2={pts[i][0] + vx} y2={pts[i][1] + vy} c="#94a3b8" w={1.8} tete={8} />)}
      <text x="200" y="250" fontSize="16" textAnchor="middle" fill={COL.txt2}>gaz enfermé (entités en agitation)</text>
      <text x={Mx - 34} y="40" fontSize="16" fontWeight="700" textAnchor="end" fill={COL.orange}>paroi inclinée</text>
      <line x1={Mx - 28} y1="46" x2={Mx - 8} y2={My - 6} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="3 4" strokeLinecap="round" />
      {montrer && <g>
        <path d={`M${Mx + u1 * 9},${My + u1y * 9} l${px * 9},${py * 9} l${-u1 * 9},${-u1y * 9}`} fill="none" stroke={COL.encre} strokeWidth="1.8" strokeLinejoin="round" />
        <Fl x1={Mx} y1={My} x2={Mx + px * 82} y2={My + py * 82} c={COL.rouge} w={3} tete={13} />
        <TV x={Mx + px * 82 + 8} y={My + py * 82 + 6} c={COL.rouge} s={22}>F</TV>
        <text x={Mx + px * 82 + 8} y={My + py * 82 + 28} fontSize="16" fontWeight="700" fill={COL.rouge}>force pressante</text>
      </g>}
    </svg>);
}

// ====================================================
//  Une canette retournée dans l'eau froide : seulement le dessin (écrasée ou non), les flèches de force si montrer
// ====================================================
export function SceneCanette({ ecrasee = false, montrer = false }) {
  const cx = 240, top = 62, bas = 196, w = 38, pin = ecrasee ? 17 : 0;
  const corps = `M${cx - w},${top} L${cx - w + pin * 0.4},${top + 26} Q${cx - w + pin * 1.15},${(top + bas) / 2} ${cx - w + pin * 0.4},${bas - 26} L${cx - w},${bas} L${cx + w},${bas} L${cx + w - pin * 0.4},${bas - 26} Q${cx + w - pin * 1.15},${(top + bas) / 2} ${cx + w - pin * 0.4},${top + 26} L${cx + w},${top} Z`;
  return (
    <svg viewBox="0 0 480 270" style={stl} role="img" aria-label={`Une canette retournée, ouverture vers le bas, plongée dans un bac d’eau froide${ecrasee ? '. Elle est écrasée.' : '.'}${montrer ? ' Une grande force pressante extérieure et une petite force pressante intérieure s’exercent sur la paroi.' : ''}`}>
      <defs>
        <linearGradient id="fl-can" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#cbd5e1" /><stop offset="0.45" stopColor="#f1f5f9" /><stop offset="1" stopColor="#94a3b8" /></linearGradient>
        <linearGradient id="fl-bac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bae6fd" /><stop offset="1" stopColor="#7dd3fc" /></linearGradient>
      </defs>
      <path d={corps} fill="url(#fl-can)" stroke={COL.acier} strokeWidth="2.6" strokeLinejoin="round" />
      <ellipse cx={cx} cy={top} rx={w} ry="7" fill="#e2e8f0" stroke={COL.acier} strokeWidth="2.2" />
      <rect x="104" y="184" width="272" height="66" rx="6" fill="url(#fl-bac)" opacity="0.95" />
      <path d="M104,184 H376" stroke="#0ea5e9" strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M${cx - w},${bas} L${cx + w},${bas}`} stroke={COL.acier} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="104" y="184" width="272" height="66" rx="6" fill="none" stroke="#64748b" strokeWidth="2.6" />
      <text x="126" y="244" fontSize="17" fontWeight="700" fill="#075985">eau froide</text>
      <text x={cx} y="34" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>canette retournée</text>
      {montrer && <g>
        {[100, 130, 160].map(y => <g key={y}>
          <Fl x1={cx - w - 62} y1={y} x2={cx - w + pin * 0.9 - 4} y2={y} c={COL.rouge} w={3} tete={12} />
          <Fl x1={cx + w + 62} y1={y} x2={cx + w - pin * 0.9 + 4} y2={y} c={COL.rouge} w={3} tete={12} />
          <Fl x1={cx - 8} y1={y} x2={cx - 24} y2={y} c={COL.bleu} w={2} tete={7} />
          <Fl x1={cx + 8} y1={y} x2={cx + 24} y2={y} c={COL.bleu} w={2} tete={7} />
        </g>)}
        <FVec x={cx - w - 66} y={92} sub="ext" c={COL.rouge} anchor="end" halo />
        <FVec x={cx + w + 66} y={92} sub="ext" c={COL.rouge} halo />
      </g>}
    </svg>);
}

// ====================================================
//  Graphe générique (axes, points, courbe) : P en fonction de V, P·V en fonction de V, P en fonction de 1/V…
// ====================================================
export function Graphe({ xMax, yMax, xTicks, yTicks, xLabel, yLabel, points = [], courbe = null, xMin = 0, courbeMin = null, couleurPoints = COL.orange, aria, gauche = 76, droite = 16 }) {
  const W = 480, Ht = 300, L = gauche, R = droite, T = 18, B = 56, pw = W - L - R, ph = Ht - T - B;
  const X = x => L + (x - xMin) / (xMax - xMin) * pw, Y = y => T + ph - y / yMax * ph;
  const fmt = v => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') : String(v).replace('.', ','));
  let d = '';
  if (courbe) { const a = courbeMin ?? xMin; for (let k = 0; k <= 80; k++) { const x = a + (xMax - a) * k / 80, y = courbe(x); if (isFinite(y) && y <= yMax * 1.02) d += `${d ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Math.min(y, yMax * 1.02)).toFixed(1)}`; } }
  return (
    <svg viewBox={`0 0 ${W} ${Ht}`} style={stl} role="img" aria-label={aria}>
      <rect x={L} y={T} width={pw} height={ph} fill="#f8fafc" />
      {xTicks.map(t => <g key={`x${t}`}><line x1={X(t)} y1={T} x2={X(t)} y2={T + ph} stroke="#e2e8f0" strokeWidth="1.4" /><line x1={X(t)} y1={T + ph} x2={X(t)} y2={T + ph + 6} stroke={COL.gris} strokeWidth="2" strokeLinecap="round" />
        <text x={X(t)} y={T + ph + 24} fontSize="16" textAnchor="middle" fill={COL.txt2}>{fmt(t)}</text></g>)}
      {yTicks.map(t => <g key={`y${t}`}><line x1={L} y1={Y(t)} x2={L + pw} y2={Y(t)} stroke="#e2e8f0" strokeWidth="1.4" /><line x1={L - 6} y1={Y(t)} x2={L} y2={Y(t)} stroke={COL.gris} strokeWidth="2" strokeLinecap="round" />
        <text x={L - 10} y={Y(t) + 5.5} fontSize="16" textAnchor="end" fill={COL.txt2}>{fmt(t)}</text></g>)}
      <polyline points={`${L},${T} ${L},${T + ph} ${L + pw},${T + ph}`} fill="none" stroke={COL.acier} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {d && <path d={d} fill="none" stroke={COL.bleu} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="6" fill={couleurPoints} stroke="#fff" strokeWidth="1.8" />)}
      <text x={L + pw / 2} y={Ht - 10} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{xLabel}</text>
      <text x="16" y={T + ph / 2} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre} transform={`rotate(-90 16 ${T + ph / 2})`}>{yLabel}</text>
    </svg>);
}

// ====================================================
//  Avant / après : deux seringues schématiques (défi de Mariotte), non à l'échelle
// ====================================================
export function SceneAvantApres({ V1, V2, P1, P2, vu = 'mL' }) {
  const seringue = (cx, V, Vref, lab, P, Pcol) => {
    const L = 40 + 150 * Math.min(1, V / Vref), x0 = cx - 100;
    return (
      <g>
        <rect x={x0} y="70" width="200" height="46" rx="6" fill="#f8fafc" stroke={COL.gris} strokeWidth="2.4" />
        <rect x={x0} y="70" width={L} height="46" rx="6" fill="#dbeafe" />
        <rect x={x0} y="70" width="200" height="46" rx="6" fill="none" stroke={COL.gris} strokeWidth="2.4" />
        <rect x={x0 + L} y="72" width="12" height="42" rx="3" fill={COL.acier} />
        <rect x={x0 + L + 12} y="91" width={200 - L - 8} height="5" rx="2.5" fill="#94a3b8" />
        <rect x={x0 + 204} y="80" width="8" height="26" rx="3" fill={COL.acier} />
        <text x={x0 + L / 2} y="98" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{lab}</text>
        <text x={cx} y="146" fontSize="17" fontWeight="700" textAnchor="middle" fill={Pcol}>{P}</text>
      </g>);
  };
  const Vref = Math.max(V1, V2);
  return (
    <svg viewBox="0 0 480 190" style={stl} role="img" aria-label={`Avant : ${V1} ${vu} de gaz, ${P1}. Après : ${V2} ${vu} de gaz, ${P2}. Schéma non à l’échelle.`}>
      <text x="120" y="32" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt2}>avant</text>
      <text x="360" y="32" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt2}>après</text>
      {seringue(120, V1, Vref, `${String(V1).replace('.', ',')}${NB}${vu}`, P1, COL.bleu)}
      {seringue(360, V2, Vref, `${String(V2).replace('.', ',')}${NB}${vu}`, P2, COL.orange)}
      <text x="240" y="176" fontSize="15" textAnchor="middle" fill={COL.gris}>schéma non à l’échelle ; T et quantité de gaz constantes</text>
    </svg>);
}
