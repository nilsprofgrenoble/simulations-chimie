// Équation-bilan et mécanisme (flèches courbes) du mécanisme examiné dans « Substitution ou élimination ? ».
import { KIT } from "../commun";
import { etat as etatSN, seg } from "./sn3dModele";

const RBR = { prim: x => `CH₃CH₂CH₂CH₂${x}`, sec: x => `CH₃CH(${x})CH₂CH₃`, tert: x => `(CH₃)₃C${x}` };
const ALCENE = { prim: 'CH₃CH₂CH=CH₂', sec: 'CH₃CH=CH–CH₃', tert: '(CH₃)₂C=CH₂' };
const NUC = { HO: { nu: 'HO⁻', x: 'OH', conj: 'H₂O' }, tBuO: { nu: 'tBuO⁻', x: 'OC(CH₃)₃', conj: 'tBuOH' }, H2O: { nu: 'H₂O', x: 'OH', conj: 'H₃O⁺' } };

// Équation-bilan écrite avec les formules semi-développées, pour le substrat, le réactif et le mécanisme examinés
function equation(meca, sub, re) {
  const N = NUC[re], R = RBR[sub]('Br');
  if (meca === 'SN1' || meca === 'SN2') {
    return re === 'H2O' ? `${R} + H₂O → ${RBR[sub]('OH')} + H⁺ + Br⁻` : `${R} + ${N.nu} → ${RBR[sub](N.x)} + Br⁻`;
  }
  return re === 'H2O' ? `${R} + H₂O → ${ALCENE[sub]} + H₃O⁺ + Br⁻` : `${R} + ${N.nu} → ${ALCENE[sub]} + ${N.conj} + Br⁻`;
}

const ENC = '#0f172a', ARC = '#dc2626', BRUN = '#9a3412', GR = '#475569';
function Schema({ titre, aria, children }) {
  return (
    <div style={{ marginTop: 6 }}>
      {titre && <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>{titre}</div>}
      <svg viewBox="0 0 560 132" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 620, display: 'block' }}>
        <defs><marker id="pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={ARC} /></marker></defs>
        {children}
      </svg>
    </div>);
}
const T = ({ x, y = 57, children, c = ENC, a = 'middle', s = 17 }) => <text x={x} y={y} fontSize={s} fontWeight="700" fill={c} textAnchor={a}>{children}</text>;
const Trait = ({ x1, y1, x2, y2, c = ENC, w = 2.2, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />;
// Liaisons en perspective : trait plein (dans le plan), coin plein (vers l'observateur), traits pointillés (vers l'arrière)
function Liaison({ x0, y0, x1, y1, type = 'plan', op = 1, c = ENC }) {
  if (op < 0.03) return null;
  const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1, px = -dy / n, py = dx / n;
  if (type === 'coin') return <polygon points={`${x0},${y0} ${x1 + px * 4.2},${y1 + py * 4.2} ${x1 - px * 4.2},${y1 - py * 4.2}`} fill={c} opacity={op} />;
  if (type === 'arriere') return (<g opacity={op} stroke={c} strokeWidth={2}>{[0.18, 0.36, 0.54, 0.72, 0.9].map(t => <line key={t} x1={x0 + dx * t - px * 5 * t} y1={y0 + dy * t - py * 5 * t} x2={x0 + dx * t + px * 5 * t} y2={y0 + dy * t + py * 5 * t} />)}</g>);
  if (type === 'partielle') return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={c} strokeWidth={2.2} strokeDasharray="5 4" opacity={op} strokeLinecap="round" />;
  return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={c} strokeWidth={2.2} strokeLinecap="round" opacity={op} />;
}
const fond = (x, y, r = 12) => <circle cx={x} cy={y} r={r} fill="#f8fafc" />;
const FLOU = u => 1 - seg(u, 0.55, 0.75);          // les flèches courbes s'estompent quand les liaisons sont faites
// Flèche courbe (Bézier quadratique « M départ Q contrôle arrivée ») qui se dessine progressivement : t de 0 (rien) à 1 (flèche complète)
function Courbe({ d, op = 1, t = 1 }) {
  if (op < 0.03 || t < 0.04) return null;
  const [x0, y0, cx, cy, x1, y1] = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const m = (p, q, r) => p + (q - p) * r;
  const px = m(x0, cx, t), py = m(y0, cy, t), ex = m(px, m(cx, x1, t), t), ey = m(py, m(cy, y1, t), t);     // sous-courbe de 0 à t
  return <path d={`M${x0},${y0} Q${px},${py} ${ex},${ey}`} fill="none" stroke={ARC} strokeWidth={2.4} strokeLinecap="round" markerEnd="url(#pointe)" opacity={op} />;
}

// SN2 animée : Nu arrive par l'arrière, Br part, les trois R se retournent (parapluie)
function AnimSN2({ N, u }) {
  const e = etatSN('SN2', u), cx = 245, cy = 62;
  const nuX = cx - 58 - 70 * (1 - seg(u, 0.05, 0.6)), brX = cx + 58 + 85 * seg(u, 0.4, 0.95);
  const off = -e.xSub * 66;                                  // décalage horizontal des R : de gauche (loin de Br) à droite
  const r1 = [cx + off, cy - 38], r2 = [cx + off - 17, cy + 30], r3 = [cx + off + 17, cy + 30];
  const op = FLOU(u);
  const typeNu = e.nuOp > 0.9 ? 'plan' : 'partielle', typeBr = e.lgOp > 0.9 ? 'plan' : 'partielle';
  const brLabel = u > 0.55 ? 'Br⁻' : 'Br', nuLabel = u > 0.55 ? nuProd(N) : N;
  return (
    <Schema aria="Mécanisme SN2 animé : le nucléophile attaque le carbone par l'arrière, Br part avec le doublet de la liaison C–Br, les trois groupes R se retournent">
      <Liaison x0={nuX + 16} y0={cy} x1={cx - 11} y1={cy} type={typeNu} op={e.nuOp < 0.05 ? 0 : Math.max(e.nuOp, 0.5)} />
      <Liaison x0={cx + 11} y0={cy} x1={brX - 16} y1={cy} type={typeBr} op={e.lgOp < 0.05 ? 0 : Math.max(e.lgOp, 0.5)} />
      <Liaison x0={cx} y0={cy - 9} x1={r1[0]} y1={r1[1] + 4} />
      <Liaison x0={cx} y0={cy + 8} x1={r2[0]} y1={r2[1] - 4} type="coin" />
      <Liaison x0={cx} y0={cy + 8} x1={r3[0]} y1={r3[1] - 4} type="arriere" />
      <T x={r1[0]} y={r1[1] - 3} s={13} c={GR}>R¹</T><T x={r2[0] - 4} y={r2[1] + 14} s={13} c={GR}>R²</T><T x={r3[0] + 4} y={r3[1] + 14} s={13} c={GR}>R³</T>
      {fond(cx, cy - 1)}<T x={cx} y={cy + 5}>C</T>
      <T x={nuX} y={cy + 5} c="#1d4ed8">{nuLabel}</T><T x={brX} y={cy + 5} c={BRUN}>{brLabel}</T>
      <Courbe op={op} t={seg(u, 0.02, 0.3)} d={`M${nuX + 14},${cy - 14} Q${(nuX + cx) / 2},${cy - 52} ${cx - 8},${cy - 16}`} />
      <Courbe op={op} t={seg(u, 0.25, 0.5)} d={`M${(cx + brX) / 2 - 4},${cy - 8} Q${(cx + brX) / 2 + 14},${cy - 40} ${brX - 6},${cy - 16}`} />
    </Schema>);
}

// E2 animée : la base arrache H (anti-périplanaire de Br), C=C se forme, Br part
function AnimElim({ N, u, e1 = false }) {
  // phases : E2 en une étape ; E1 en deux étapes (Br part et le carbocation devient plan, puis la base arrache H)
  const E = e1 ? { g: seg(u, 0.55, 0.9), fCb: seg(u, 0.6, 0.95), fCa: seg(u, 0.15, 0.45), d: seg(u, 0.05, 0.4), h: 1 - seg(u, 0.65, 0.9), br: 1 - seg(u, 0.1, 0.3), bh: [0.55, 0.9], lim: 0.9, brLab: 0.3 }
    : { g: seg(u, 0.1, 0.6), fCb: seg(u, 0.3, 0.8), fCa: seg(u, 0.3, 0.8), d: seg(u, 0.35, 0.9), h: 1 - seg(u, 0.3, 0.6), br: 1 - seg(u, 0.3, 0.6), bh: [0.2, 0.6], lim: 0.6, brLab: 0.55 };
  const g = E.g, cb = [215, 76], ca = [285, 76];
  const H = [200 - 26 * g, 38 - 14 * g], B = [96 + 44 * g, 12 + 2 * g], Br = [306 + 40 * E.d, 116 + 6 * E.d];
  const opA = e1 ? 1 - seg(u, 0.9, 1) : 1 - seg(u, 0.7, 0.9), opBr = e1 ? 1 - seg(u, 0.3, 0.45) : opA;
  const hOp = E.h, brOp = E.br;
  const R = [[190, 108, 'coin', 'R'], [168, 70, 'arriere', 'R']], R2 = [[312, 38, 'coin', 'R'], [334, 72, 'arriere', 'R']];
  const subs = (c, lst, f) => lst.map(([x, y, t, l], k) => (<g key={`${c[0]}${k}`}>
    <Liaison x0={c[0]} y0={c[1]} x1={x} y1={y} type={t} op={1 - f} /><Liaison x0={c[0]} y0={c[1]} x1={x} y1={y} op={f} />
    <T x={x + (x < c[0] ? -9 : 9)} y={y + (y < c[1] ? -3 : 14)} s={13} c={GR}>{l}</T></g>));
  return (
    <Schema titre={e1 ? (u < 0.5 ? 'Étape 1, lente : Br part avec le doublet de la liaison, il se forme un carbocation plan' : 'Étape 2, rapide : la base (ici le solvant) arrache H en β du carbocation') : null} aria={e1 ? "Mécanisme E1 animé en deux étapes : Br part et forme un carbocation, puis la base arrache l'hydrogène en β" : "Mécanisme E2 animé : la base arrache l'hydrogène en β, la double liaison C=C se forme et Br part, en une seule étape"}>
      <Liaison x0={cb[0]} y0={cb[1]} x1={ca[0]} y1={ca[1]} /><Liaison x0={cb[0]} y0={cb[1] + 7} x1={ca[0]} y1={ca[1] + 7} op={E.fCb} />
      {subs(cb, R, E.fCb)}{subs(ca, R2, E.fCa)}
      <Liaison x0={cb[0]} y0={cb[1]} x1={H[0]} y1={H[1] + 10} type={hOp > 0.9 ? 'plan' : 'partielle'} op={hOp < 0.05 ? 0 : Math.max(hOp, 0.5)} />
      <Liaison x0={ca[0]} y0={ca[1]} x1={Br[0] - 8} y1={Br[1] - 14} type={brOp > 0.9 ? 'plan' : 'partielle'} op={brOp < 0.05 ? 0 : Math.max(brOp, 0.5)} />
      <Liaison x0={B[0] + 22} y0={B[1] + 3} x1={H[0] - 8} y1={H[1] + 1} type={u < E.bh[1] ? 'partielle' : 'plan'} op={u > E.lim && N === 'H₂O' ? 0 : seg(u, E.bh[0], E.bh[1])} />
      {fond(cb[0], cb[1] - 1)}<T x={cb[0]} y={cb[1] + 5}>C</T>{fond(ca[0], ca[1] - 1)}<T x={ca[0]} y={ca[1] + 5}>{e1 && u > 0.4 && E.fCb < 0.5 ? 'C⁺' : 'C'}</T>
      <T x={H[0]} y={H[1] + 5} s={15}>{u > E.lim && N === 'H₂O' ? '' : 'H'}</T>
      <T x={B[0]} y={B[1] + 5} c="#1d4ed8">{u > E.lim ? (N === 'H₂O' ? 'H₃O⁺' : N.replace('⁻', '')) : N}</T><T x={Br[0]} y={Br[1] + 5} c={BRUN}>{u > E.brLab ? 'Br⁻' : 'Br'}</T>
      <Courbe op={opA} t={e1 ? seg(u, 0.5, 0.68) : seg(u, 0.02, 0.25)} d={`M${B[0] + 14},${B[1] - 6} Q${(B[0] + H[0]) / 2 + 6},${B[1] - 22} ${H[0] - 3},${H[1] - 8}`} />
      <Courbe op={opA} t={e1 ? seg(u, 0.62, 0.82) : seg(u, 0.2, 0.45)} d={`M${(cb[0] + H[0]) / 2 + 3},${(cb[1] + H[1]) / 2} Q${cb[0] + 46},${cb[1] - 48} ${(cb[0] + ca[0]) / 2 + 1},${cb[1] - 4}`} />
      <Courbe op={opBr} t={e1 ? seg(u, 0.02, 0.25) : seg(u, 0.4, 0.6)} d={`M${(ca[0] + Br[0]) / 2 - 2},${(ca[1] + Br[1]) / 2 - 8} Q${Br[0] + 6},${(ca[1] + Br[1]) / 2 - 22} ${Br[0] - 2},${Br[1] - 20}`} />
    </Schema>);
}
// SN1 animée : Br part (carbocation plan), puis le nucléophile attaque l'une des deux faces (ici la face opposée à Br, comme dans la vue 3D)
function AnimSN1({ N, u }) {
  const e = etatSN('SN1', u), cx = 280, cy = 62;
  const brX = cx - 58 - 85 * seg(u, 0.05, 0.45), nuX = cx + 58 + 70 * (1 - seg(u, 0.55, 0.95));
  const off = e.xSub * 66, r1 = [cx + off, cy - 38], r2 = [cx + off - 17, cy + 30], r3 = [cx + off + 17, cy + 30];
  const plat = Math.abs(e.xSub) < 0.12, cation = !e.lgLie && !e.nuLie;
  const opBr = 1 - seg(u, 0.35, 0.5), opNu = seg(u, 0.5, 0.6) * (1 - seg(u, 0.92, 1));
  return (
    <Schema titre={u < 0.5 ? 'Étape 1, lente : Br part avec le doublet de la liaison, il se forme un carbocation plan' : 'Étape 2, rapide : le nucléophile se lie au carbocation (plan : les deux faces sont possibles)'} aria="Mécanisme SN1 animé : Br part et laisse un carbocation plan, puis le nucléophile se lie au carbone">
      <Liaison x0={brX + 16} y0={cy} x1={cx - 11} y1={cy} type={e.lgOp > 0.9 ? 'plan' : 'partielle'} op={e.lgOp < 0.05 ? 0 : Math.max(e.lgOp, 0.5)} />
      <Liaison x0={cx + 11} y0={cy} x1={nuX - 16} y1={cy} type={e.nuOp > 0.9 ? 'plan' : 'partielle'} op={e.nuOp < 0.05 ? 0 : Math.max(e.nuOp, 0.5)} />
      <Liaison x0={cx} y0={cy - 9} x1={r1[0]} y1={r1[1] + 4} />
      <Liaison x0={cx} y0={cy + 8} x1={r2[0]} y1={r2[1] - 4} type={plat ? 'plan' : 'coin'} />
      <Liaison x0={cx} y0={cy + 8} x1={r3[0]} y1={r3[1] - 4} type={plat ? 'plan' : 'arriere'} />
      <T x={r1[0]} y={r1[1] - 3} s={13} c={GR}>R¹</T><T x={r2[0] - 4} y={r2[1] + 14} s={13} c={GR}>R²</T><T x={r3[0] + 4} y={r3[1] + 14} s={13} c={GR}>R³</T>
      {fond(cx, cy - 1)}<T x={cx} y={cy + 5}>{cation ? 'C⁺' : 'C'}</T>
      <T x={brX} y={cy + 5} c={BRUN}>{u > 0.3 ? 'Br⁻' : 'Br'}</T><T x={nuX} y={cy + 5} c="#1d4ed8">{u > 0.75 ? nuProd(N) : N}</T>
      <Courbe op={opBr} t={seg(u, 0.02, 0.3)} d={`M${(cx + brX) / 2 + 4},${cy - 8} Q${(cx + brX) / 2 - 14},${cy - 40} ${brX + 6},${cy - 16}`} />
      <Courbe op={opNu} t={seg(u, 0.5, 0.75)} d={`M${nuX - 14},${cy - 14} Q${(nuX + cx) / 2},${cy - 52} ${cx + 8},${cy - 16}`} />
    </Schema>);
}
const nuProd = N => (N === 'H₂O' ? 'H₂O⁺' : N.replace('⁻', ''));

export default function SnEquation({ meca, sub, re, u = 0 }) {
  const N = NUC[re].nu;
  const eq = equation(meca, sub, re);
  const sn = meca.startsWith('S');
  let schemas;
  if (meca === 'SN2') schemas = <AnimSN2 N={N} u={u} />;
  else if (meca === 'E2') schemas = <AnimElim N={N} u={u} />;
  else if (meca === 'SN1') schemas = <AnimSN1 N={N} u={u} />;
  else schemas = <AnimElim N={N} u={u} e1 />;
  return (
    <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Équation de la réaction ({sn ? 'substitution' : 'élimination'}, {meca})</div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: KIT.txt, margin: '4px 0', lineHeight: 1.5 }}>{eq}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginTop: 6 }}>Mécanisme (flèches rouges : déplacements de doublets d’électrons)</div>
      {schemas}
    </div>);
}
