// Mécanisme 2D animé de l'addition de Br₂ sur un alcène : pont bromonium (coins pleins ou pointillés), attaque anti de Br⁻, flèches courbes.
// L'alcène est dans le plan de la feuille. Coin plein : vers le lecteur ; pointillés : vers l'arrière (convention de Cram).
import { KIT } from "../commun";
import { C2, C3, SUBST, plan2D } from "./brMeca2dModele";
import { etat as etat3D, seg } from "./br3dModele";

const ENC = '#0f172a', GR = '#475569', BRUN = '#9a3412', VERT = '#15803d', ROUGE = '#dc2626';
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function Liaison({ a, b, type = 'plan', op = 1, c = ENC }) {
  if (op < 0.03) return null;
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, px = -dy / n, py = dx / n;
  if (type === 'coin') return <polygon points={`${a[0]},${a[1]} ${b[0] + px * 4.4},${b[1] + py * 4.4} ${b[0] - px * 4.4},${b[1] - py * 4.4}`} fill={c} opacity={op} />;
  if (type === 'arriere') return (<g opacity={op} stroke={c} strokeWidth={2}>{[0.15, 0.32, 0.49, 0.66, 0.83, 0.98].map(t => <line key={t} x1={a[0] + dx * t - px * 5 * t} y1={a[1] + dy * t - py * 5 * t} x2={a[0] + dx * t + px * 5 * t} y2={a[1] + dy * t + py * 5 * t} />)}</g>);
  if (type === 'partielle') return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={2.2} strokeDasharray="5 4" opacity={op} strokeLinecap="round" />;
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={2.4} strokeLinecap="round" opacity={op} />;
}
const T = ({ p, dx = 0, dy = 5, children, c = ENC, s = 17 }) => <text x={p[0] + dx} y={p[1] + dy} fontSize={s} fontWeight="700" fill={c} textAnchor="middle">{children}</text>;
// Flèche courbe qui se dessine progressivement (t de 0 à 1) du donneur a vers l'accepteur b ; k : bombement (px, signe = côté)
function Fl({ a, b, k = 24, t = 1, op = 1 }) {
  if (t < 0.04 || op < 0.03) return null;
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
  const c = [(a[0] + b[0]) / 2 - dy / n * k, (a[1] + b[1]) / 2 + dx / n * k];
  const m = (p, q, r) => p + (q - p) * r;
  const c1 = [m(a[0], c[0], t), m(a[1], c[1], t)];                                   // sous-courbe de Bézier de 0 à t
  const e = [m(m(a[0], c[0], t), m(c[0], b[0], t), t), m(m(a[1], c[1], t), m(c[1], b[1], t), t)];
  return <path d={`M${a[0]},${a[1]} Q${c1[0]},${c1[1]} ${e[0]},${e[1]}`} fill="none" stroke={ROUGE} strokeWidth={2.4} strokeLinecap="round" markerEnd="url(#pointeBr)" opacity={op} />;
}

export default function BrMeca2D({ alc, face, syn, u }) {
  const l3 = etat3D(alc, face, 1).lettres, P = plan2D(alc, face, l3);
  const S = SUBST(alc), RL = alc === 'cyclo' ? 'CH₂' : 'CH₃';
  const att = P.att === 'C3' ? C3 : C2, non = P.att === 'C3' ? C2 : C3, sx = P.att === 'C3' ? 1 : -1;     // carbone attaqué, autre carbone, côté d'où arrive Br⁻
  const typePont = P.pont > 0 ? 'coin' : 'arriere', typeAtt = P.pont > 0 ? 'arriere' : 'coin';          // le pont d'un côté de la feuille, l'attaque de l'autre
  const pi = 1 - seg(u, 0.3, 0.55);                                                                      // la liaison π disparaît quand le pont se forme
  const p1 = seg(u, 0.05, 0.4), formation = seg(u, 0.3, 0.55), depart = seg(u, 0.35, 0.7), attaque = seg(u, 0.6, 0.95);
  // Br₂ puis ion bromonium (Br⁺) puis Br lié à un seul carbone
  const mid = [280, 40];
  const brn0 = lerp2([262, 20], mid, p1);
  const brn = u < 0.55 ? brn0 : syn ? mid : lerp2(mid, [non[0], 34], attaque);
  const brfDebut = [brn0[0] + 46, brn0[1] - 8];
  const brf = u < 0.35 ? brfDebut : lerp2(brfDebut, [455, 22], depart);
  // Br⁻ qui attaque : par la face opposée (anti) ou, en syn, du côté du pont (impossible)
  const arrivee = [att[0], 134];
  const loin = [att[0] + sx * 85, 168];
  const brm = u < 0.5 ? null : syn ? [sx * 1 > 0 ? 470 - 70 * Math.sin(Math.PI * attaque) : 90 + 70 * Math.sin(Math.PI * attaque), 56] : lerp2(loin, arrivee, attaque);
  const liePont = u >= 0.3;
  const opPontNon = liePont ? Math.min(1, formation * 2) : 0;
  const opPontAtt = liePont ? (syn ? opPontNon : opPontNon * (1 - attaque)) : 0;
  const libelleBr = u < 0.35 ? 'Br' : 'Br⁻';
  const labelPont = u < 0.35 ? 'Br' : u < 0.95 || syn ? 'Br⁺' : 'Br';
  const lienProduitNon = !syn && attaque > 0.85;
  return (
    <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '6px 8px' }}>
      <svg viewBox="0 -24 560 216" role="img" aria-label="Mécanisme 2D animé de l'addition de Br₂ : pont bromonium d'un côté de la feuille, attaque de Br⁻ par l'autre côté" style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}>
        <defs><marker id="pointeBr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={ROUGE} /></marker></defs>
        {/* squelette de l'alcène */}
        <Liaison a={C2} b={C3} />
        <Liaison a={[C2[0], C2[1] + 7]} b={[C3[0], C3[1] + 7]} op={pi} />
        <Liaison a={C2} b={S.R2} /><Liaison a={C2} b={S.H2} /><Liaison a={C3} b={S.R3} /><Liaison a={C3} b={S.H3} />
        <T p={S.R2} dx={-14} dy={-2} c={GR} s={14}>{RL}</T><T p={S.H2} dx={-12} dy={8} c={GR} s={14}>H</T>
        <T p={S.R3} dx={18} dy={S.R3[1] < 84 ? -2 : 8} c={GR} s={14}>{RL}</T><T p={S.H3} dx={12} dy={S.H3[1] < 84 ? -2 : 8} c={GR} s={14}>H</T>
        <circle cx={C2[0]} cy={C2[1] + 2} r={11} fill="#f8fafc" /><T p={C2}>C</T><circle cx={C3[0]} cy={C3[1] + 2} r={11} fill="#f8fafc" /><T p={C3}>C</T>
        {/* Br–Br puis pont bromonium */}
        {u < 0.35 && <Liaison a={brn} b={brf} />}
        <Liaison a={C2} b={brn} type={typePont} op={u >= 0.55 && !syn && P.att === 'C2' ? opPontAtt : opPontNon} />
        <Liaison a={C3} b={brn} type={typePont} op={u >= 0.55 && !syn && P.att === 'C3' ? opPontAtt : opPontNon} />
        {u >= 0.55 && !syn && lienProduitNon && <Liaison a={att} b={[att[0], 134]} type={typeAtt} op={attaque} />}
        <circle cx={brn[0]} cy={brn[1]} r={13} fill="#fff7ed" stroke={BRUN} strokeWidth={1.6} /><T p={brn} c={BRUN} s={13}>{labelPont}</T>
        {u >= 0.35 && <><circle cx={brf[0]} cy={brf[1]} r={13} fill="#fff7ed" stroke={BRUN} strokeWidth={1.6} /><T p={brf} c={BRUN} s={13}>{libelleBr}</T></>}
        {u < 0.35 && <><circle cx={brf[0]} cy={brf[1]} r={13} fill="#fff7ed" stroke={BRUN} strokeWidth={1.6} /><T p={brf} c={BRUN} s={13}>Br</T></>}
        {brm && <>
          {!syn && <Liaison a={att} b={[brm[0], brm[1] - 12]} type={typeAtt} op={Math.min(1, attaque * 1.6)} c={VERT} />}
          <circle cx={brm[0]} cy={brm[1]} r={13} fill={!syn && attaque > 0.9 ? '#fff7ed' : '#f0fdf4'} stroke={!syn && attaque > 0.9 ? BRUN : VERT} strokeWidth={1.6} /><T p={brm} c={!syn && attaque > 0.9 ? BRUN : VERT} s={13}>{!syn && attaque > 0.9 ? 'Br' : 'Br⁻'}</T>
          {syn && attaque > 0.25 && <T p={[brm[0], brm[1] - 22]} c={ROUGE} s={20}>✗</T>}
        </>}
        {/* flèches courbes : elles se dessinent, suivent les atomes, puis s'estompent */}
        {/* étape 1 : le doublet π attaque Br (le plus proche), la liaison Br–Br se rompt vers l'autre Br */}
        <Fl a={[(C2[0] + C3[0]) / 2, C2[1] - 5]} b={[brn0[0] - 1, brn0[1] + 14]} k={-22} t={seg(u, 0.04, 0.3)} op={1 - seg(u, 0.36, 0.5)} />
        {u < 0.35 && <Fl a={[(brn0[0] + brfDebut[0]) / 2, (brn0[1] + brfDebut[1]) / 2 - 3]} b={[brfDebut[0] + 2, brfDebut[1] - 15]} k={14} t={seg(u, 0.12, 0.32)} op={1 - seg(u, 0.3, 0.35)} />}
        {u >= 0.35 && u < 0.7 && <Fl a={[brn[0] + 12, brn[1] - 6]} b={[brf[0] - 15, brf[1] - 2]} k={-12} t={1} op={1 - seg(u, 0.38, 0.52)} />}
        {/* étape 2 : le doublet de Br⁻ attaque le carbone par l'arrière, la liaison C–Br⁺ se rompt vers Br⁺ */}
        {!syn && brm && <Fl a={[brm[0] - sx * 11, brm[1] - 9]} b={[att[0] + sx * 3, att[1] + 15]} k={sx * 20} t={seg(u, 0.55, 0.8)} op={1 - seg(u, 0.93, 0.99)} />}
        {!syn && <Fl a={[(brn[0] + att[0]) / 2, (brn[1] + att[1]) / 2 - 3]} b={[brn[0] + sx * 12, brn[1] + 8]} k={sx * 14} t={seg(u, 0.62, 0.85)} op={u < 0.55 ? 0 : 1 - seg(u, 0.93, 0.99)} />}
        {/* produit : lettres lues sur le dessin */}
        {!syn && u >= 0.999 && <><T p={[C2[0], 160]} c={KIT.txt} s={14}>{`(${alc === 'cyclo' ? '1' : '2'}${P.lettres[0]},${alc === 'cyclo' ? '2' : '3'}${P.lettres[1]})`}</T></>}
      </svg>
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2 }}>
        L’alcène est dans le plan de la feuille. Trait en coin : vers vous ; pointillés : vers l’arrière.{alc === 'cyclo' ? ' Les deux CH₂ sont reliés par le cycle (non dessiné).' : ''} Flèches rouges : déplacements de doublets d’électrons.
      </div>
    </div>);
}
