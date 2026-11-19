// ====================================================
//  Schémas de la simulation 168 (deuxième loi de Newton ; niveau TG).
//  Scène et cartes : viewBox de 400 de large, textes de 17 à 20 (environ 11 px rendus sur un téléphone de 390 px, où le schéma s'affiche à ~260 px).
//  Notation vectorielle : toute force, vitesse ou accélération porte une flèche (TV/Vl) ; une norme est une lettre simple.
//  Public daltonien : jamais la couleur seule ; chaque flèche porte son nom (P, R, T, f) ; Σ F en trait épais, a_G en pointillés.
// ====================================================
import { TV } from './Travail';
import { COL, nbf, nbm, K, KS, COUL_F, CENTRE } from './newtonOutils';

const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
// carte « À retenir » : légèrement plus large que son cadre (marges de 10 px reprises) pour que les textes restent lisibles sur téléphone
const stlCarte = { ...stl, width: 'calc(100% + 20px)', maxWidth: 440, margin: '0 -10px 6px' };
const NB = '\u00a0';
const S0 = 18;   // taille minimale des textes (viewBox de 400)

// ---------- mesure de texte ----------
let _ctx = null;
const mesure = (t, taille, graisse = 700) => {
  const u = t.replace(/ /g, '\u00a0');   // les espaces comptent (y compris en fin de segment)
  try {
    if (!_ctx && typeof document !== 'undefined') _ctx = document.createElement('canvas').getContext('2d');
    if (_ctx) { _ctx.font = `${graisse} ${taille}px Inter, "Segoe UI", Arial, sans-serif`; const w = _ctx.measureText(u).width; if (w > 0) return w; }
  } catch { /* repli */ }
  return [...t].length * taille * 0.56;
};

// ---------- petits outils de dessin ----------
export const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, dash, tete = 10 }) => {
  const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy); if (n < 1) return null;
  const ux = dx / n, uy = dy / n, t = Math.min(tete, n * 0.6);
  return <g><line x1={x1} y1={y1} x2={x2 - ux * t * 0.6} y2={y2 - uy * t * 0.6} stroke={c} strokeWidth={w} strokeDasharray={dash}/>
    <polygon points={`${x2},${y2} ${x2 - t * ux - t * 0.45 * uy},${y2 - t * uy + t * 0.45 * ux} ${x2 - t * ux + t * 0.45 * uy},${y2 - t * uy - t * 0.45 * ux}`} fill={c}/></g>;
};
// lettre-vecteur de n caractères (flèche au-dessus de toute la lettre ou du groupe, ex. « Δv »)
export const Vl = ({ x, y, n, s = 15, c = COL.txt, w = 700, halo }) => {
  const l = s * 0.62 * [...n].length, yy = y - s * 0.92, ha = halo ? { stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke' } : {};
  return <g><text x={x} y={y} fontSize={s} fontWeight={w} fill={c} {...ha}>{n}</text>
    <line x1={x} y1={yy} x2={x + l} y2={yy} stroke={c} strokeWidth="1.5"/><polyline points={`${x + l - 3.2},${yy - 2.6} ${x + l},${yy} ${x + l - 3.2},${yy + 2.6}`} fill="none" stroke={c} strokeWidth="1.5"/></g>;
};
// Largeur d'une suite de segments (texte, { v, i } lettre-vecteur avec indice éventuel, { i } indice)
const largSeg = (g, s, w) => {
  const ci = Math.max(13, s * 0.8);
  return typeof g === 'string' ? mesure(g, s, w) + (/\s$/.test(g) ? s * 0.3 : 0) : g.v ? [...g.v].length * s * 0.64 + (g.i ? mesure(g.i, ci, w) + 1 : 0) : mesure(g.i, ci, w) + 1;
};
const largeur = (segs, s, w = 700) => segs.reduce((t, g) => t + largSeg(g, s, w), 0);
// Ligne de texte SVG mêlant texte, lettres-vecteurs { v: 'F' } (indice éventuel : { v: 'a', i: 'G' }) et indices { i: 'x' }.
// segs : ['Σ ', { v: 'F' }, ' = m ', { v: 'a', i: 'G' }] ; anchor : start | middle | end
export const Ligne = ({ x, y, s = S0, w = 700, c = COL.txt, segs, anchor = 'start', halo }) => {
  const ci = Math.max(13, s * 0.8);
  const largs = segs.map(g => largSeg(g, s, w)), total = largs.reduce((t, v) => t + v, 0), debut = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;
  const starts = largs.map((_, k) => debut + largs.slice(0, k).reduce((u, v) => u + v, 0));
  const ha = halo ? { stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke' } : {};
  return <g>{segs.map((g, k) => { const px = starts[k];
    if (typeof g === 'string') return <text key={k} x={px} y={y} fontSize={s} fontWeight={w} fill={g.c || c} xmlSpace="preserve" style={{ whiteSpace: 'pre' }} {...ha}>{g}</text>;
    return <g key={k}>{g.v && (g.v.length === 1 ? <TV x={px} y={y} s={s} w={w} c={g.c || c} halo={halo}>{g.v}</TV> : <Vl x={px} y={y} n={g.v} s={s} w={w} c={g.c || c} halo={halo}/>)}
      {g.i && <text x={px + (g.v ? [...g.v].length * s * 0.64 : 0) + 1} y={y + 4} fontSize={ci} fontWeight={w} fill={g.c || c} {...ha}>{g.i}</text>}</g>; })}</g>;
};
// Fraction dessinée (numérateur, trait, dénominateur), centrée en x ; y = ligne de base du texte voisin (signe égal) ; occupe de y − 28 à y + 15 environ
const Fr = ({ x, y, num, den, s = S0, w = 700, c = COL.txt }) => {
  const W = Math.max(largeur(num, s, w), largeur(den, s, w)) + 10;
  return <g><Ligne x={x} y={y - 9} s={s} w={w} c={c} anchor="middle" segs={num}/><line x1={x - W / 2} y1={y - 5} x2={x + W / 2} y2={y - 5} stroke={c} strokeWidth="1.6"/><Ligne x={x} y={y + 13} s={s} w={w} c={c} anchor="middle" segs={den}/></g>;
};
const largFr = (num, den, s = S0, w = 700) => Math.max(largeur(num, s, w), largeur(den, s, w)) + 10;
const Croix = ({ x, y, c = COL.txt }) => <g><line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} stroke={c} strokeWidth="2.2"/><line x1={x - 5} y1={y + 5} x2={x + 5} y2={y - 5} stroke={c} strokeWidth="2.2"/>
  <text x={x + 7} y={y + 22} fontSize="17" fontWeight="700" fill={c} stroke="#fff" strokeWidth="3" paintOrder="stroke">G</text></g>;
// signe de coupure sur une flèche dont la longueur ne représente rien (intensité inconnue)
const Coupure = ({ x, y, dx, dy, c }) => {
  const px = -dy, py = dx, o = 4;
  return <g><line x1={x - dx * 6} y1={y - dy * 6} x2={x + dx * 6} y2={y + dy * 6} stroke="#fff" strokeWidth="6"/>
    {[-o, o].map(d => <line key={d} x1={x + dx * d + px * 8 - dx * 3} y1={y + dy * d + py * 8 - dy * 3} x2={x + dx * d - px * 8 + dx * 3} y2={y + dy * d - py * 8 + dy * 3} stroke={c} strokeWidth="2.4"/>)}</g>;
};

// ---------- décors ----------
function Decor({ kind, charge }) {
  if (kind === 'rail') return (
    <g>
      <rect x="10" y="158" width="380" height="8" rx="2" fill="#94a3b8"/><line x1="10" y1="166" x2="390" y2="166" stroke="#475569" strokeWidth="1.5"/>
      <rect x="148" y="112" width="104" height="38" rx="5" fill="#fde68a" stroke="#0f172a" strokeWidth="2"/>
      <circle cx="170" cy="152" r="7" fill="#334155" stroke="#0f172a" strokeWidth="1.5"/><circle cx="230" cy="152" r="7" fill="#334155" stroke="#0f172a" strokeWidth="1.5"/>
      {charge && <g><rect x="150" y="80" width="64" height="32" rx="3" fill="#94a3b8" stroke="#0f172a" strokeWidth="2"/><text x="182" y="102" fontSize="17" fontWeight="700" textAnchor="middle" fill="#0f172a">charge</text></g>}
    </g>);
  if (kind === 'fil') return (
    <g>
      <rect x="120" y="4" width="160" height="10" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5"/>
      {[130, 150, 170, 190, 210, 230, 250, 270].map(x => <line key={x} x1={x} y1="4" x2={x - 8} y2="-2" stroke="#475569" strokeWidth="1.5"/>)}
      <line x1="200" y1="14" x2="200" y2="108" stroke="#334155" strokeWidth="2.2"/>
      <rect x="176" y="108" width="48" height="44" rx="4" fill="#fde68a" stroke="#0f172a" strokeWidth="2"/>
    </g>);
  if (kind === 'cabine') return (
    <g>
      <rect x="140" y="0" width="120" height="8" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5"/>
      <line x1="200" y1="8" x2="200" y2="98" stroke="#334155" strokeWidth="2.5"/>
      <rect x="150" y="98" width="100" height="74" rx="5" fill="#e0f2fe" stroke="#0f172a" strokeWidth="2"/>
    </g>);
  return (   // parachutiste : voile, suspentes, silhouette
    <g>
      <path d="M 140 84 Q 200 18 260 84 Q 230 70 200 84 Q 170 70 140 84 Z" fill="#fecaca" stroke="#0f172a" strokeWidth="2"/>
      <line x1="140" y1="84" x2="196" y2="118" stroke="#334155" strokeWidth="1.5"/><line x1="260" y1="84" x2="204" y2="118" stroke="#334155" strokeWidth="1.5"/><line x1="200" y1="84" x2="200" y2="118" stroke="#334155" strokeWidth="1.5"/>
      <circle cx="200" cy="124" r="7" fill="#fde68a" stroke="#0f172a" strokeWidth="1.8"/><rect x="193" y="131" width="14" height="26" rx="4" fill="#0369a1" stroke="#0f172a" strokeWidth="1.8"/>
      <line x1="196" y1="157" x2="192" y2="176" stroke="#0f172a" strokeWidth="3"/><line x1="204" y1="157" x2="208" y2="176" stroke="#0f172a" strokeWidth="3"/>
    </g>);
}
const unite = (kind, v) => (kind === 'cabine' || kind === 'chute' ? `${nbm(v)}${NB}N` : `${nbf(v, Math.abs(v) < 10 && Math.abs(v * 10 - Math.round(v * 10)) > 1e-6 ? 2 : 1)}${NB}N`);

// ---------- scène : situation, centre de masse G, forces fléchées au point G ----------
//  forces : [{ id, x, y }] en N (x vers la droite, y vers le haut) ; valeursDe : identifiants des forces dont on écrit la norme à côté de la flèche ; fil : dessiner le fil du chariot ; charge : chariot chargé à gauche ;
//  vit : [{ i, y, txt }] vecteurs vitesse (composante verticale en m/s) tracés à droite ;
//  inconnue : id d'une force dont on ne donne pas l'intensité : flèche en pointillés, de longueur fixe SANS rapport avec la valeur, coupée (signe de coupure) et marquée « = ? ».
//  Échelle : K[kind] px par newton, réduite si une flèche dépasse 88 px (verticale) ou 95 px (horizontale) ; la barre d'échelle en bas la donne toujours.
export function SceneNewton({ kind, forces = [], valeursDe = [], charge = false, vit = [], inconnue = null, alpha = 0, fil: avecFil = false, aria }) {
  const [gx0, gy] = CENTRE[kind], gx = charge ? 182 : gx0, H = kind === 'rail' ? 300 : 270;
  const connues = forces.filter(f => f.id !== inconnue);
  const maxV = Math.max(0, ...connues.map(f => Math.abs(f.y))), maxH = Math.max(0, ...connues.map(f => Math.abs(f.x)));
  const k = Math.min(K[kind], maxV ? 88 / maxV : Infinity, maxH ? 95 / maxH : Infinity);
  const lst = forces.filter(f => Math.hypot(f.x, f.y) * k >= 1.5 || f.id === inconnue);
  const a = alpha * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a);
  // fil du chariot : demi-droite issue de G (la tension T est tracée le long du fil), à partir du bord du chariot (x 148–252, y 112–150)
  const rail = kind === 'rail' && (avecFil || forces.some(f => f.id === 'T'));
  const t0 = Math.min(52 / ux, uy < -1e-6 ? 18 / -uy : Infinity), D = 100;
  const fil = rail ? { x1: gx + t0 * ux, y1: gy + t0 * uy, x2: gx + D * ux, y2: gy + D * uy } : null;
  const fl = lst.map(f => {
    const inc = f.id === inconnue, n = Math.hypot(f.x, f.y) || 1, L = inc ? 40 : n * k, dx = f.x / n, dy = -f.y / n;
    const tx = gx + dx * L, ty = gy + dy * L, c = COUL_F[f.id] || COL.txt;
    let lx, ly, anch = 'start';
    if (kind === 'rail' && f.id === 'T' && fil) { lx = fil.x2 + 8; ly = fil.y2 + 6; }
    else if (kind === 'rail' && f.id === 'f') { lx = 142; ly = gy + 6; anch = 'end'; }
    else { const haut = dy < -0.5, bas = dy > 0.5; lx = kind === 'cabine' && haut ? 258 : tx + 9; ly = haut ? ty + 8 : bas ? ty + 18 : ty - 9; }   // cabine : la tension (vers le haut) s'écrit à droite de la cabine, pas sur son contour
    const txt = inc ? ' = ?' : valeursDe.includes(f.id) ? ` = ${unite(kind, n)}` : '';
    return <g key={f.id}><Fleche x1={gx} y1={gy} x2={tx} y2={ty} c={c} w={3.2} dash={inc ? '7 5' : undefined}/>
      {inc && <Coupure x={gx + dx * L * 0.5} y={gy + dy * L * 0.5} dx={dx} dy={dy} c={c}/>}
      <Ligne x={lx} y={ly} s={17} c={c} segs={[{ v: f.id }, txt]} anchor={anch} halo/></g>;
  });
  const vv = vit.map((v, j) => {
    const x = 326 + j * 46, L = Math.abs(v.y) * 30;
    return <g key={j}>
      <line x1={x - 14} y1={gy} x2={x + 14} y2={gy} stroke={COL.v} strokeWidth="1" strokeDasharray="3 3"/>
      {L < 1 ? <circle cx={x} cy={gy} r="3.5" fill={COL.v}/> : <Fleche x1={x} y1={gy} x2={x} y2={gy - Math.sign(v.y) * L} c={COL.v} w={3.2}/>}
      <Ligne x={x - 14} y={gy + 26} s={17} c={COL.v} segs={[{ v: 'v', i: v.i }]}/>
      <text x={x - 14} y={gy + 46} fontSize="17" fontWeight="700" fill={COL.v}>{v.txt}</text>{j === vit.length - 1 && vit.length > 1 && <text x={326 - 14} y={gy + 68} fontSize="17" fontWeight="700" fill={COL.v}>(en m/s)</text>}
    </g>;
  });
  // échelle
  const cand = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000], N0 = cand.find(c => c * k >= 22) || 1000;
  return (
    <svg viewBox={`0 0 400 ${H}`} style={stl} role="img" aria-label={aria || `Scène : ${SCEN_TXT[kind]}.`}>
      <Decor kind={kind} charge={charge}/>
      {fil && <g><line {...fil} stroke="#334155" strokeWidth="2.2"/><circle cx={fil.x2} cy={fil.y2} r="4" fill="#334155"/></g>}
      {fl}
      <Croix x={gx} y={gy} c={COL.txt}/>
      {vv}
      {forces.length > 0 && <g><line x1="14" y1={H - 16} x2={14 + N0 * k} y2={H - 16} stroke={COL.gris} strokeWidth="3"/><line x1="14" y1={H - 22} x2="14" y2={H - 10} stroke={COL.gris} strokeWidth="2"/><line x1={14 + N0 * k} y1={H - 22} x2={14 + N0 * k} y2={H - 10} stroke={COL.gris} strokeWidth="2"/>
        <text x={14 + N0 * k + 8} y={H - 10} fontSize="17" fontWeight="700" fill={COL.gris} stroke="#fff" strokeWidth="3" paintOrder="stroke">= {nbm(N0, N0 < 1 ? 1 : 0)}{NB}N</text></g>}
    </svg>);
}
const SCEN_TXT = {
  rail: 'un chariot roule sur un rail horizontal, tiré par un fil ; son centre de masse G est repéré par une croix',
  fil: 'une masse est accrochée à un fil fixé au plafond ; son centre de masse G est repéré par une croix',
  cabine: 'une cabine d’ascenseur est suspendue à un câble ; son centre de masse G est repéré par une croix',
  chute: 'un parachutiste sous sa voile ; son centre de masse G est repéré par une croix',
};

// ---------- scène du train qui accélère (référentiel non galiléen) ----------
export function SceneTrain() {
  return (
    <svg viewBox="0 0 400 200" style={stl} role="img" aria-label="Un wagon de train, vu de côté, accélère vers la droite. Une bille posée sur son sol lisse recule vers l'arrière du wagon, alors qu'aucune force horizontale ne s'exerce sur elle.">
      <rect x="10" y="150" width="380" height="8" rx="2" fill="#94a3b8"/>
      <rect x="70" y="70" width="260" height="70" rx="8" fill="#e0f2fe" stroke="#0f172a" strokeWidth="2"/><line x1="70" y1="124" x2="330" y2="124" stroke="#0f172a" strokeWidth="2"/>
      <circle cx="110" cy="146" r="8" fill="#334155"/><circle cx="290" cy="146" r="8" fill="#334155"/>
      <circle cx="250" cy="115" r="9" fill="#b45309" stroke="#0f172a" strokeWidth="1.8"/>
      <Fleche x1={236} y1={115} x2={172} y2={115} c={COL.v} w={3.5}/><Ligne x={80} y={98} s={17} c={COL.v} segs={['recule dans le wagon']}/>
      <Ligne x={70} y={28} s={17} c={COL.a} segs={[{ v: 'a', i: 'train' }, ' : le wagon accélère']}/><Fleche x1={70} y1={48} x2={170} y2={48} c={COL.a} w={3.5} dash="7 4"/>
    </svg>);
}

// ---------- bandeau : Σ F et a_G, même direction et même sens ----------
//  S : vecteur {x, y} ; nul : somme réellement nulle (même critère que les mesures) ; sinon une flèche de longueur au moins 8 px est tracée.
//  La flèche de a_G a la même longueur que celle de Σ F (échelles différentes : N et m/s²).
export function BandeauSomme({ kind, S, nul }) {
  const horiz = kind === 'rail', ks = KS[kind], n = Math.hypot(S.x, S.y);
  const lim = horiz ? 82 : 36, L = Math.max(8, Math.min(lim, n * ks)), u = horiz ? { x: Math.sign(S.x) || 1, y: 0 } : { x: 0, y: -(Math.sign(S.y) || 1) };
  const dessin = (cx, cy, col, dash, sg) => nul ? <circle cx={cx} cy={cy} r="5" fill={col}/> : <Fleche x1={cx} y1={cy} x2={cx + u.x * L} y2={cy + u.y * L} c={col} w={sg ? 5 : 3.2} dash={dash}/>;
  return (
    <svg viewBox="0 0 400 118" style={stl} role="img" aria-label={nul ? 'Bandeau : la somme des forces et le vecteur accélération sont nuls.' : `Bandeau : la somme des forces et le vecteur accélération du centre de masse ont la même direction et le même sens (${horiz ? (S.x > 0 ? 'vers la droite' : 'vers la gauche') : (S.y > 0 ? 'vers le haut' : 'vers le bas')}).`}>
      <rect x="6" y="4" width="188" height="110" rx="10" fill="#f8fafc" stroke="#cbd5e1"/><rect x="206" y="4" width="188" height="110" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
      <Ligne x={100} y={30} s={18} anchor="middle" segs={['Σ ', { v: 'F' }]}/><Ligne x={300} y={30} s={18} anchor="middle" c={COL.a} segs={[{ v: 'a', i: 'G' }]}/>
      {dessin(100, 66, COL.S, undefined, true)}{dessin(300, 66, COL.a, '7 4', false)}
      {nul && <><text x="100" y="100" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>vecteur nul</text><text x="300" y="100" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.a}>vecteur nul</text></>}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox de 400 de large, textes de 17 à 20)
// ====================================================
const Titre = ({ t, segs }) => (segs ? <Ligne x={200} y={26} s={19} anchor="middle" segs={segs}/> : <text x="200" y="26" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt}>{t}</text>);
const Boite = ({ x, y, w, h, c = '#cbd5e1', f = '#f8fafc', sw = 1.5 }) => <rect x={x} y={y} width={w} height={h} rx="9" fill={f} stroke={c} strokeWidth={sw}/>;
const T = ({ x, y, children, s = S0, c = COL.txt, a = 'start', w = 700 }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Descend = ({ x, y1, y2 }) => <Fleche x1={x} y1={y1} x2={x} y2={y2} c={COL.gris} w={2.5} tete={9}/>;

// 1. Bilan des forces (sans frottements : l'étape « bilan » les néglige) ; R et P ont la même longueur (le chariot reste sur le rail)
export function SvgBilanCarte() {
  return (
    <svg viewBox="0 0 400 238" style={stlCarte} role="img" aria-label="Chariot sur un rail avec son centre de masse G et trois forces fléchées depuis G : le poids vers le bas et la réaction du rail vers le haut, de même longueur, et la tension du fil vers la droite.">
      <Titre t="Une flèche par action, depuis G"/>
      <rect x="40" y="164" width="320" height="8" rx="2" fill="#94a3b8"/>
      <rect x="150" y="112" width="100" height="40" rx="5" fill="#fde68a" stroke="#0f172a" strokeWidth="2"/><circle cx="172" cy="158" r="7" fill="#334155"/><circle cx="228" cy="158" r="7" fill="#334155"/>
      <Fleche x1={200} y1={132} x2={200} y2={52} c={COL.R} w={3.5}/><Ligne x={208} y={66} s={18} c={COL.R} halo segs={[{ v: 'R' }, ' réaction du rail']}/>
      <Fleche x1={200} y1={132} x2={200} y2={212} c={COL.P} w={3.5}/><Ligne x={208} y={216} s={18} c={COL.P} halo segs={[{ v: 'P' }, ' poids']}/>
      <Fleche x1={200} y1={132} x2={300} y2={132} c={COL.T} w={3.5}/><Ligne x={308} y={138} s={18} c={COL.T} halo segs={[{ v: 'T' }, ' fil']}/>
      <circle cx="200" cy="132" r="4.5" fill={COL.txt}/><text x="188" y="145" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.txt} stroke="#fde68a" strokeWidth="3" paintOrder="stroke">G</text>
    </svg>);
}
// 2. Σ F et a_G : même direction, même sens (exemple vertical : une charge suspendue dont le poids l'emporte ; autre situation que la question qui précède)
export function SvgSommeAccCarte() {
  return (
    <svg viewBox="0 0 400 304" style={stlCarte} role="img" aria-label="Exemple d'une charge suspendue à un câble. À gauche, deux forces verticales exercées sur G : le poids vers le bas, plus long que la tension du câble vers le haut. Au milieu, leur somme, vers le bas. À droite, le vecteur accélération du centre de masse, tracé dans la même direction et le même sens que la somme. En bas, la relation somme des forces égale m fois accélération.">
      <Titre segs={['Σ ', { v: 'F' }, ' et ', { v: 'a', i: 'G' }, ' : même sens']}/>
      {[70, 200, 330].map(x => <circle key={x} cx={x} cy="100" r="4.5" fill={COL.txt}/>)}
      <Fleche x1={70} y1={100} x2={70} y2={64} c={COL.T} w={3.5}/><Ligne x={78} y={78} c={COL.T} halo segs={[{ v: 'T' }]}/>
      <Fleche x1={70} y1={100} x2={70} y2={172} c={COL.P} w={3.5}/><Ligne x={78} y={168} c={COL.P} halo segs={[{ v: 'P' }]}/>
      <Fleche x1={112} y1={100} x2={152} y2={100} c={COL.gris} w={2.5} tete={9}/>
      <Fleche x1={200} y1={100} x2={200} y2={136} c={COL.S} w={6}/><Ligne x={210} y={132} segs={['Σ', { v: 'F' }]}/>
      <Fleche x1={248} y1={100} x2={288} y2={100} c={COL.gris} w={2.5} tete={9}/><T x={268} y={90} a="middle" c={COL.gris}>÷ m</T>
      <Fleche x1={330} y1={100} x2={330} y2={136} c={COL.a} w={3.5} dash="7 4"/><Ligne x={340} y={132} c={COL.a} segs={[{ v: 'a', i: 'G' }]}/>
      <T x={70} y={206} a="middle" c={COL.gris}>deux forces</T><T x={200} y={206} a="middle" c={COL.gris}>leur somme</T><T x={330} y={206} a="middle" c={COL.gris}>accélération</T>
      <Boite x={20} y={222} w={360} h={46} c={COL.S} f="#fff" sw={2}/>
      <Ligne x={200} y={254} s={20} anchor="middle" segs={['Σ ', { v: 'F' }, ' = m × ', { v: 'a', i: 'G' }]}/>
      <T x={200} y={292} a="middle">m &gt; 0 : même direction, même sens</T>
    </svg>);
}
// rangée numérotée d'une carte de méthode
const Rang = ({ y, n, h = 44, c = COL.T, children }) => <g><Boite x={20} y={y} w={360} h={h}/><circle cx="44" cy={y + 22} r="12" fill={c}/><T x={44} y={y + 28} a="middle" c="#fff">{n}</T>{children}</g>;
// 3. Des forces à l'accélération (sens 1)
export function SvgSens1Carte() {
  const numFr = ['ΣF', { i: 'x' }], denFr = ['m'], debut = ['a', { i: 'x' }, ' = '], xf = 66 + largeur(debut, S0) + largFr(numFr, denFr) / 2;
  return (
    <svg viewBox="0 0 400 380" style={stlCarte} role="img" aria-label="Méthode en trois étapes pour passer des forces à l'accélération : bilan des forces, projection sur un axe avec des signes algébriques, division de la somme par la masse. Exemple : 7,5 newtons moins 3,0 newtons font 4,5 newtons ; divisé par 1,5 kilogramme, cela donne 3,0 mètres par seconde carrée.">
      <Titre t="Des forces à l’accélération"/>
      <Rang y={40} n="1"><T x={66} y={68}>Bilan des forces (flèches)</T></Rang>
      <Descend x={200} y1={86} y2={104}/>
      <Rang y={106} n="2" h={66}><Ligne x={66} y={132} segs={['Sur Ox : ΣF', { i: 'x' }, ' = T − f']}/><T x={66} y={158} w={600} c={COL.gris}>vers l’axe : +, contre l’axe : −</T></Rang>
      <Descend x={200} y1={174} y2={192}/>
      <Rang y={194} n="3" h={90}><Ligne x={66} y={238} segs={debut}/><Fr x={xf} y={238} num={numFr} den={denFr}/><Ligne x={66} y={274} w={600} c={COL.gris} segs={['a', { i: 'x' }, ' a le signe de ΣF', { i: 'x' }]}/></Rang>
      <Boite x={20} y={298} w={360} h={74} c={COL.S} f="#fff" sw={2}/>
      <T x={200} y={324} a="middle">m = 1,5 kg ; T = 7,5 N ; f = 3,0 N</T>
      <Ligne x={200} y={354} anchor="middle" segs={['ΣF', { i: 'x' }, ' = 4,5 N ⇒ a', { i: 'x' }, ' = 3,0 m/s²']}/>
    </svg>);
}
// 4. Du mouvement aux forces (sens 2)
export function SvgSens2Carte() {
  const numFr = [{ v: 'Δv' }], denFr = ['Δt'], debut = [{ v: 'a', i: 'G' }, ' = '], xf = 66 + largeur(debut, S0) + largFr(numFr, denFr) / 2;
  return (
    <svg viewBox="0 0 400 394" style={stlCarte} role="img" aria-label="Méthode en trois étapes pour passer du mouvement aux forces : calculer le vecteur accélération, quotient de la variation de vitesse par la durée, en déduire la somme des forces égale m fois l'accélération, puis la force inconnue par le bilan. Exemple d'une cabine de 800 kilogrammes dont la vitesse passe de 0 à 1,6 mètre par seconde en 2,0 secondes.">
      <Titre t="Du mouvement aux forces"/>
      <Rang y={40} n="1" h={84} c={COL.a}><Ligne x={66} y={84} segs={debut}/><Fr x={xf} y={84} num={numFr} den={denFr}/><T x={66} y={114} w={600} c={COL.gris}>deux dates, avec le signe</T></Rang>
      <Descend x={200} y1={126} y2={144}/>
      <Rang y={146} n="2" h={66} c={COL.a}><Ligne x={66} y={172} segs={['Σ ', { v: 'F' }, ' = m × ', { v: 'a', i: 'G' }]}/><Ligne x={66} y={198} w={600} c={COL.gris} segs={['même sens que ', { v: 'a', i: 'G' }]}/></Rang>
      <Descend x={200} y1={214} y2={232}/>
      <Rang y={234} n="3" h={66} c={COL.a}><Ligne x={66} y={260} segs={['Bilan : T − P = ΣF', { i: 'y' }]}/><T x={66} y={286} w={600} c={COL.gris}>la force inconnue est T</T></Rang>
      <Boite x={20} y={314} w={360} h={74} c={COL.S} f="#fff" sw={2}/>
      <T x={200} y={340} a="middle">m = 800 kg ; 0 → 1,6 m/s en 2,0 s</T>
      <Ligne x={200} y={370} anchor="middle" segs={['a', { i: 'y' }, ' = 0,80 m/s² ⇒ T = P + m × a', { i: 'y' }]}/>
    </svg>);
}
// 5. Équilibre
export function SvgEquilibreCarte() {
  return (
    <svg viewBox="0 0 400 332" style={stlCarte} role="img" aria-label="Parachutiste à vitesse constante : le poids vers le bas et le frottement de l'air vers le haut ont la même longueur, donc la somme des forces est nulle et l'accélération est nulle. Idée fausse : il faut une force dans le sens du mouvement. Vrai : à vitesse constante, la somme des forces est nulle.">
      <Titre segs={['Équilibre : Σ ', { v: 'F' }, ' = ', { v: '0' }, ' ⇒ ', { v: 'a', i: 'G' }, ' = ', { v: '0' }]}/>
      <path d="M 70 78 Q 110 28 150 78 Q 130 68 110 78 Q 90 68 70 78 Z" fill="#fecaca" stroke="#0f172a" strokeWidth="1.8"/>
      <line x1="70" y1="78" x2="106" y2="104" stroke="#334155" strokeWidth="1.3"/><line x1="150" y1="78" x2="114" y2="104" stroke="#334155" strokeWidth="1.3"/>
      <circle cx="110" cy="108" r="6" fill="#fde68a" stroke="#0f172a" strokeWidth="1.6"/><rect x="104" y="114" width="12" height="22" rx="3" fill="#0369a1" stroke="#0f172a" strokeWidth="1.6"/>
      <circle cx="110" cy="122" r="3.5" fill={COL.txt}/>
      <Fleche x1={110} y1={122} x2={110} y2={180} c={COL.P} w={3.5}/><Ligne x={118} y={190} s={18} c={COL.P} halo segs={[{ v: 'P' }, ' poids']}/>
      <Fleche x1={110} y1={122} x2={110} y2={64} c={COL.f} w={3.5}/><Ligne x={118} y={56} s={18} c={COL.f} halo segs={[{ v: 'f' }, ' air']}/>
      <T x={285} y={84} a="middle">Même longueur,</T><T x={285} y={106} a="middle">sens opposés :</T>
      <Ligne x={285} y={140} s={19} anchor="middle" segs={['Σ ', { v: 'F' }, ' = ', { v: '0' }]}/>
      <Ligne x={285} y={170} s={19} anchor="middle" segs={[{ v: 'a', i: 'G' }, ' = ', { v: '0' }]}/>
      <Ligne x={285} y={200} anchor="middle" segs={[{ v: 'v' }, ' constant (ou nul)']}/>
      <Boite x={20} y={214} w={360} h={54} c={COL.P} f="#fef2f2"/><T x={32} y={236} c={COL.P}>✗ Idée fausse</T><T x={32} y={258} w={600}>« Il avance : une force le pousse »</T>
      <Boite x={20} y={276} w={360} h={54} c={COL.R} f="#f0fdf4"/><T x={32} y={298} c={COL.R}>✓ Vrai</T><T x={32} y={320} w={600}>Vitesse constante : somme nulle</T>
    </svg>);
}
// 6. Référentiel galiléen
export function SvgGalileenCarte() {
  return (
    <svg viewBox="0 0 400 330" style={stlCarte} role="img" aria-label="Deux référentiels. En haut, le référentiel terrestre pendant quelques secondes, supposé galiléen : la deuxième loi s'applique. En bas, un wagon qui accélère : une bille posée sur le sol sans force horizontale recule par rapport au wagon, la deuxième loi ne s'applique pas dans ce référentiel, qui n'est pas galiléen.">
      <Titre t="Référentiel galiléen ou non ?"/>
      <Boite x={14} y={40} w={372} h={118} c={COL.R} f="#f0fdf4" sw={2}/>
      <T x={28} y={66} c={COL.R}>✓ Terre, sur quelques secondes</T>
      <Ligne x={28} y={96} segs={['Σ ', { v: 'F' }, ' = m × ', { v: 'a', i: 'G' }, ' : valable']}/>
      <T x={28} y={124} w={600}>rotation de la Terre négligeable</T><T x={28} y={146} w={600}>sur une si courte durée</T>
      <Boite x={14} y={170} w={372} h={152} c={COL.P} f="#fef2f2" sw={2}/>
      <T x={28} y={196} c={COL.P}>✗ Wagon qui accélère</T>
      <rect x="28" y="228" width="110" height="40" rx="5" fill="#e0f2fe" stroke="#0f172a" strokeWidth="1.8"/><line x1="28" y1="258" x2="138" y2="258" stroke="#0f172a" strokeWidth="1.8"/><circle cx="118" cy="251" r="7" fill="#b45309" stroke="#0f172a" strokeWidth="1.5"/>
      <Fleche x1={106} y1={251} x2={64} y2={251} c={COL.v} w={3} tete={9}/><Ligne x={28} y={300} segs={['non galiléen']}/>
      <T x={150} y={226} w={600}>La bille recule sans force</T><T x={150} y={248} w={600}>horizontale : la loi ne</T><T x={150} y={270} w={600}>s’applique pas ici.</T>
    </svg>);
}
