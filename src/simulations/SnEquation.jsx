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
function Fleche({ d }) { return <path d={d} fill="none" stroke={ARC} strokeWidth={2.2} markerEnd="url(#pointe)" />; }
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
// Carbone et ses trois substituants R¹ (haut), R² (bas gauche), R³ (bas droit) ; l'axe horizontal reste libre pour Nu et Br
function CR({ x, y = 52, ch = '', r = ['R¹', 'R²', 'R³'] }) {
  return (<g>
    <Trait x1={x} y1={y - 11} x2={x} y2={y - 30} /><T x={x} y={y - 35} s={13} c={GR}>{r[0]}</T>
    <Liaison x0={x - 3} y0={y + 7} x1={x - 21} y1={y + 30} type={ch ? 'plan' : 'coin'} /><T x={x - 25} y={y + 44} s={13} c={GR}>{r[1]}</T>
    <Liaison x0={x + 3} y0={y + 7} x1={x + 21} y1={y + 30} type={ch ? 'plan' : 'arriere'} /><T x={x + 25} y={y + 44} s={13} c={GR}>{r[2]}</T>
    <T x={x} y={y + 6}>{`C${ch}`}</T>
  </g>);
}
// Alcène (ou fragment H–C–C) avec deux substituants R de chaque côté
function CC({ x, double = false, cation = false }) {
  return (<g>
    <T x={x} y={57}>C</T>
    <Trait x1={x - 4} y1={44} x2={x - 18} y2={20} /><T x={x - 22} y={15} s={13} c={GR}>R</T>
    <Trait x1={x - 4} y1={70} x2={x - 18} y2={92} /><T x={x - 22} y={104} s={13} c={GR}>R</T>
    <T x={x + 62} y={57}>{cation ? 'C⁺' : 'C'}</T>
    <Trait x1={x + 12} y1={54} x2={x + 48} y2={54} />{double && <Trait x1={x + 12} y1={62} x2={x + 48} y2={62} />}
    <Trait x1={x + 66} y1={44} x2={x + 80} y2={20} /><T x={x + 85} y={15} s={13} c={GR}>R</T>
    <Trait x1={x + 66} y1={70} x2={x + 80} y2={92} /><T x={x + 85} y={104} s={13} c={GR}>R</T>
  </g>);
}

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
function Courbe({ d, op = 1 }) { return op < 0.03 ? null : <path d={d} fill="none" stroke={ARC} strokeWidth={2.4} markerEnd="url(#pointe)" opacity={op} />; }

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
      <Courbe op={op} d={`M${nuX + 14},${cy - 14} Q${(nuX + cx) / 2},${cy - 52} ${cx - 8},${cy - 16}`} />
      <Courbe op={op} d={`M${(cx + brX) / 2 - 4},${cy - 8} Q${(cx + brX) / 2 + 14},${cy - 40} ${brX - 6},${cy - 16}`} />
    </Schema>);
}

// E2 animée : la base arrache H (anti-périplanaire de Br), C=C se forme, Br part
function AnimE2({ N, u }) {
  const g = seg(u, 0.1, 0.6), f = seg(u, 0.3, 0.8), cb = [215, 76], ca = [285, 76];
  const H = [200 - 26 * g, 38 - 14 * g], B = [96 + 44 * g, 12 + 2 * g], Br = [306 + 40 * seg(u, 0.35, 0.9), 116 + 6 * seg(u, 0.35, 0.9)];
  const op = FLOU(u);
  const hOp = 1 - seg(u, 0.3, 0.6), brOp = 1 - seg(u, 0.3, 0.6);
  const R = [[190, 108, 'coin', 'R'], [168, 70, 'arriere', 'R']], R2 = [[312, 38, 'coin', 'R'], [334, 72, 'arriere', 'R']];
  const subs = (c, lst) => lst.map(([x, y, t, l], k) => (<g key={`${c[0]}${k}`}>
    <Liaison x0={c[0]} y0={c[1]} x1={x} y1={y} type={t} op={1 - f} /><Liaison x0={c[0]} y0={c[1]} x1={x} y1={y} op={f} />
    <T x={x + (x < c[0] ? -9 : 9)} y={y + (y < c[1] ? -3 : 14)} s={13} c={GR}>{l}</T></g>));
  return (
    <Schema aria="Mécanisme E2 animé : la base arrache l'hydrogène en β, la double liaison C=C se forme et Br part, en une seule étape">
      <Liaison x0={cb[0]} y0={cb[1]} x1={ca[0]} y1={ca[1]} /><Liaison x0={cb[0]} y0={cb[1] + 7} x1={ca[0]} y1={ca[1] + 7} op={f} />
      {subs(cb, R)}{subs(ca, R2)}
      <Liaison x0={cb[0]} y0={cb[1]} x1={H[0]} y1={H[1] + 10} type={hOp > 0.9 ? 'plan' : 'partielle'} op={hOp < 0.05 ? 0 : Math.max(hOp, 0.5)} />
      <Liaison x0={ca[0]} y0={ca[1]} x1={Br[0] - 8} y1={Br[1] - 14} type={brOp > 0.9 ? 'plan' : 'partielle'} op={brOp < 0.05 ? 0 : Math.max(brOp, 0.5)} />
      <Liaison x0={B[0] + 22} y0={B[1] + 3} x1={H[0] - 8} y1={H[1] + 1} type={u < 0.6 ? 'partielle' : 'plan'} op={seg(u, 0.2, 0.6)} />
      {fond(cb[0], cb[1] - 1)}<T x={cb[0]} y={cb[1] + 5}>C</T>{fond(ca[0], ca[1] - 1)}<T x={ca[0]} y={ca[1] + 5}>C</T>
      <T x={H[0]} y={H[1] + 5} s={15}>{u > 0.6 && N === 'H₂O' ? 'H⁺' : 'H'}</T>
      <T x={B[0]} y={B[1] + 5} c="#1d4ed8">{u > 0.6 ? N.replace('⁻', '') : N}</T><T x={Br[0]} y={Br[1] + 5} c={BRUN}>{u > 0.55 ? 'Br⁻' : 'Br'}</T>
      <Courbe op={op} d={`M${B[0] + 14},${B[1] - 6} Q${(B[0] + H[0]) / 2 + 6},${B[1] - 22} ${H[0] - 3},${H[1] - 8}`} />
      <Courbe op={op} d={`M${(cb[0] + H[0]) / 2 + 3},${(cb[1] + H[1]) / 2} Q${cb[0] + 46},${cb[1] - 48} ${(cb[0] + ca[0]) / 2 + 1},${cb[1] - 4}`} />
      <Courbe op={op} d={`M${(ca[0] + Br[0]) / 2 - 2},${(ca[1] + Br[1]) / 2 - 8} Q${Br[0] + 6},${(ca[1] + Br[1]) / 2 - 22} ${Br[0] - 2},${Br[1] - 20}`} />
    </Schema>);
}
const nuProd = N => (N === 'H₂O' ? 'H₂O⁺' : N.replace('⁻', ''));

export default function SnEquation({ meca, sub, re, u = 0 }) {
  const N = NUC[re].nu;
  const eq = equation(meca, sub, re);
  const sn = meca.startsWith('S');
  const baseH = NUC[re].conj;
  let schemas;
  if (meca === 'SN2') schemas = <AnimSN2 N={N} u={u} />;
  else if (meca === 'E2') schemas = <AnimE2 N={N} u={u} />;
  else if (meca === 'SN1') schemas = (<>
    <Schema titre="Étape 1, lente : Br part avec le doublet de la liaison, il se forme un carbocation" aria="Étape 1 de la SN1 : la liaison C–Br se rompt">
      <CR x={110} /><Trait x1={121} y1={52} x2={168} y2={52} /><T x={188} c={BRUN}>Br</T>
      <Fleche d="M146,44 Q164,16 186,38" /><T x={256} s={22}>→</T>
      <CR x={330} ch="⁺" /><T x={412} s={15}>+ Br⁻</T>
    </Schema>
    <Schema titre="Étape 2, rapide : le nucléophile se lie au carbocation, plan : il peut arriver par les deux faces" aria="Étape 2 de la SN1 : le nucléophile attaque le carbone du carbocation">
      <T x={42} c="#1d4ed8">{N}</T><CR x={165} ch="⁺" />
      <Fleche d="M64,38 Q108,2 152,40" /><T x={270} s={22}>→</T>
      <T x={335} c="#1d4ed8">{nuProd(N)}</T><Trait x1={355} y1={52} x2={370} y2={52} /><CR x={382} />
    </Schema></>);
  else schemas = (<>
    <Schema titre="Étape 1, lente : Br part avec le doublet de la liaison, il se forme un carbocation" aria="Étape 1 de l'E1 : formation du carbocation">
      <T x={30}>H</T><Trait x1={42} y1={54} x2={64} y2={54} /><CC x={78} /><Trait x1={148} y1={54} x2={178} y2={54} /><T x={198} c={BRUN}>Br</T>
      <Fleche d="M168,44 Q184,18 196,38" /><T x={262} s={22}>→</T><T x={310}>H</T><Trait x1={322} y1={54} x2={338} y2={54} /><CC x={352} cation /><T x={500} s={15}>+ Br⁻</T>
    </Schema>
    <Schema titre="Étape 2, rapide : une base (ici le solvant) arrache H en β du carbocation" aria="Étape 2 de l'E1 : la base arrache H, la liaison C–H devient C=C">
      <T x={30} c="#1d4ed8">{N}</T><T x={98}>H</T><Trait x1={110} y1={54} x2={132} y2={54} /><CC x={146} cation />
      <Fleche d="M48,38 Q72,6 94,38" /><Fleche d="M120,42 Q150,10 176,42" /><T x={290} s={22}>→</T><CC x={340} double /><T x={470} s={15}>+ {baseH}</T>
    </Schema></>);
  return (
    <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Équation de la réaction ({sn ? 'substitution' : 'élimination'}, {meca})</div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: KIT.txt, margin: '4px 0', lineHeight: 1.5 }}>{eq}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginTop: 6 }}>Mécanisme (flèches rouges : déplacements de doublets d’électrons)</div>
      {schemas}
    </div>);
}
