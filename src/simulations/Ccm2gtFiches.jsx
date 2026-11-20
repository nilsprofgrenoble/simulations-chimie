// Schémas des cartes « À retenir » de la simulation 197 « Chromatographie sur couche mince : identifier et comparer » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver.
// viewBox de 300 de large (≈ 230 px sur téléphone) : textes de 13,5 à 16 ; schémas plafonnés à 320 px.
import { COL } from "./Ccm2gtScenes";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const T = ({ x, y, children, c = COL.encre, w = 700, s = 14.5, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Pt = ({ x, y, c, r = 6 }) => <ellipse cx={x} cy={y} rx={r} ry={r * 0.88} fill={c} />;

// ── Carte 1 : le matériel et le dépôt ──
export function FicheMateriel() {
  return (
    <svg viewBox="0 0 300 262" style={stl} role="img" aria-label="Une cuve fermée par un couvercle, avec de l’éluant au fond et une plaque de silice debout. La ligne de dépôt, tracée au crayon, est au-dessus du niveau de l’éluant. Le crayon est bon, le stylo est interdit car son encre migre.">
      <rect x={96} y={48} width={110} height={150} rx="5" fill="#f8fafc" stroke="#64748b" strokeWidth="2.5" />
      <rect x={98} y={170} width={106} height={26} fill="#93c5fd" opacity="0.75" />
      <rect x={90} y={36} width={122} height={13} rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
      <rect x={132} y={56} width={38} height={136} rx="2" fill="white" stroke={COL.gris} strokeWidth="2" />
      <line x1={134} x2={168} y1={140} y2={140} stroke="#6b7280" strokeWidth="2.5" />
      <Pt x={151} y={140} c="#dc2626" r={5} />
      <line x1={88} y1={42} x2={50} y2={22} stroke={COL.orange} strokeWidth="1.6" /><T x={4} y={19}>couvercle</T>
      <line x1={134} y1={100} x2={92} y2={100} stroke={COL.orange} strokeWidth="1.6" /><T x={4} y={95}>plaque</T><T x={4} y={111}>de silice</T>
      <line x1={134} y1={140} x2={92} y2={140} stroke={COL.orange} strokeWidth="1.6" /><T x={4} y={136}>ligne de</T><T x={4} y={152}>dépôt</T>
      <line x1={204} y1={184} x2={226} y2={184} stroke={COL.orange} strokeWidth="1.6" /><T x={228} y={189}>éluant</T>
      <path d="M240 178 V150" stroke={COL.bleu} strokeWidth="2.5" fill="none" /><polygon points="240,144 234,155 246,155" fill={COL.bleu} />
      <T x={250} y={150} c={COL.bleu} s={13.5}>sous la</T><T x={250} y={166} c={COL.bleu} s={13.5}>ligne</T>
      <rect x={6} y={212} width={288} height={44} rx="8" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />
      <T x={14} y={231} c={COL.vert} s={14}>✓ crayon : le trait ne migre pas</T>
      <T x={14} y={249} c={COL.rouge} s={14}>✗ stylo : l’encre migre avec l’éluant</T>
    </svg>);
}

// ── Carte 2 : le schéma légendé d'une CCM ──
export function FicheSchemaLegende() {
  return (
    <svg viewBox="0 0 300 262" style={stl} role="img" aria-label="Schéma légendé d’une CCM terminée : couvercle, cuve, éluant, plaque de silice, ligne de dépôt, front de l’éluant et deux taches.">
      <rect x={102} y={56} width={96} height={190} rx="5" fill="#f8fafc" stroke="#64748b" strokeWidth="2.5" />
      <rect x={104} y={218} width={92} height={26} fill="#93c5fd" opacity="0.75" />
      <rect x={96} y={44} width={108} height={13} rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
      <rect x={134} y={64} width={32} height={176} rx="2" fill="white" stroke={COL.gris} strokeWidth="2" />
      <rect x={136} y={92} width={28} height={148} fill="#bfdbfe" opacity="0.7" />
      <line x1={136} x2={164} y1={92} y2={92} stroke={COL.gris} strokeWidth="2.2" strokeDasharray="5 3" />
      <line x1={136} x2={164} y1={196} y2={196} stroke="#6b7280" strokeWidth="2.5" />
      <Pt x={150} y={126} c="#facc15" r={5.5} /><Pt x={150} y={172} c="#2563eb" r={5.5} />
      <line x1={98} y1={50} x2={70} y2={30} stroke={COL.orange} strokeWidth="1.6" /><T x={4} y={27}>couvercle</T>
      <line x1={136} y1={92} x2={98} y2={86} stroke={COL.orange} strokeWidth="1.6" /><T x={4} y={80}>front de</T><T x={4} y={96}>l’éluant</T>
      <line x1={136} y1={196} x2={98} y2={196} stroke={COL.orange} strokeWidth="1.6" /><T x={4} y={192}>ligne de</T><T x={4} y={208}>dépôt</T>
      <line x1={204} y1={130} x2={226} y2={130} stroke={COL.orange} strokeWidth="1.6" /><T x={228} y={135}>cuve</T>
      <line x1={156} y1={126} x2={226} y2={110} stroke={COL.orange} strokeWidth="1.6" /><T x={228} y={106}>tache</T>
      <line x1={204} y1={232} x2={226} y2={232} stroke={COL.orange} strokeWidth="1.6" /><T x={228} y={237}>éluant</T>
      <line x1={166} y1={150} x2={226} y2={160} stroke={COL.orange} strokeWidth="1.6" /><T x={228} y={162}>plaque</T><T x={228} y={178}>(silice)</T>
    </svg>);
}

// ── Carte 3 : lire et comparer ──
export function FicheLireComparer() {
  const xs = [64, 150, 236], yR = 104, yB = 160;
  return (
    <svg viewBox="0 0 300 276" style={stl} role="img" aria-label="Une plaque à trois voies : l’échantillon donne deux taches, une rouge et une bleue. Les références rouge et bleue, déposées à côté, ont des taches à la même hauteur : l’échantillon contient peut-être ces deux colorants.">
      <rect x={18} y={20} width={264} height={190} rx="5" fill="white" stroke={COL.gris} strokeWidth="2.5" />
      <line x1={26} x2={274} y1={190} y2={190} stroke="#6b7280" strokeWidth="2" />
      <line x1={26} x2={274} y1={yR} y2={yR} stroke="#dc2626" strokeWidth="1.8" strokeDasharray="5 4" /><line x1={26} x2={274} y1={yB} y2={yB} stroke="#2563eb" strokeWidth="1.8" strokeDasharray="5 4" />
      <Pt x={xs[0]} y={yR} c="#dc2626" r={8} /><Pt x={xs[0]} y={yB} c="#2563eb" r={8} />
      <Pt x={xs[1]} y={yR} c="#dc2626" r={8} /><Pt x={xs[2]} y={yB} c="#2563eb" r={8} />
      <T x={xs[0]} y={228} a="middle" s={14}>échantillon</T><T x={xs[1]} y={228} a="middle" s={14}>réf. rouge</T><T x={xs[2]} y={228} a="middle" s={14}>réf. bleue</T>
      <T x={150} y={247} c={COL.vert} a="middle" s={14}>2 taches alignées :</T><T x={150} y={266} c={COL.vert} a="middle" s={14}>probablement ces 2 colorants</T>
      <T x={xs[0] + 18} y={38} c={COL.orange} s={13.5}>2 taches</T>
    </svg>);
}

// ── Carte 4 : le rapport frontal ──
export function FicheRf() {
  return (
    <svg viewBox="0 0 300 268" style={stl} role="img" aria-label="Une plaque avec une tache rouge. La distance parcourue par la tache depuis la ligne de dépôt est de 2,1&nbsp;cm ; la distance parcourue par le front de l’éluant est de 6,0&nbsp;cm.">
      <rect x={30} y={14} width={90} height={232} rx="5" fill="white" stroke={COL.gris} strokeWidth="2.5" />
      <line x1={36} x2={114} y1={210} y2={210} stroke="#6b7280" strokeWidth="2" />
      <line x1={36} x2={114} y1={50} y2={50} stroke={COL.gris} strokeWidth="2.2" strokeDasharray="7 4" />
      <Pt x={75} y={154} c="#dc2626" r={8} />
      <line x1={132} y1={210} x2={132} y2={158} stroke={COL.orange} strokeWidth="2.5" /><polygon points="132,154 126,165 138,165" fill={COL.orange} />
      <line x1={160} y1={210} x2={160} y2={54} stroke={COL.gris} strokeWidth="2.5" /><polygon points="160,50 154,61 166,61" fill={COL.gris} />
      <line x1={118} y1={154} x2={132} y2={154} stroke={COL.orange} strokeWidth="1.5" strokeDasharray="3 3" />
      <T x={176} y={118} c={COL.gris} s={15}>front :</T><T x={176} y={136} c={COL.gris} s={15}>6,0&nbsp;cm</T>
      <T x={176} y={190} c={COL.orange} s={15}>tache :</T><T x={176} y={208} c={COL.orange} s={15}>2,1&nbsp;cm</T>
      <T x={75} y={258} s={13.5} a="middle" c={COL.gris}>ligne de dépôt</T>
    </svg>);
}

// ── Carte 5 : même hauteur ne prouve pas ──
export function FicheLimite() {
  const plaque = (x, titre, y1, y2) => (
    <g>
      <T x={x + 62} y={20} a="middle" s={15}>{titre}</T>
      <rect x={x} y={30} width={124} height={150} rx="5" fill="#bbf7d0" stroke={COL.gris} strokeWidth="2.5" />
      <line x1={x + 6} x2={x + 118} y1={160} y2={160} stroke="#6b7280" strokeWidth="2" />
      <line x1={x + 6} x2={x + 118} y1={y1} y2={y1} stroke="#6d28d9" strokeWidth="1.6" strokeDasharray="5 4" />
      <Pt x={x + 30} y={y1} c="#1e293b" r={8} /><Pt x={x + 94} y={y2} c="#1e293b" r={8} />
      <T x={x + 30} y={198} a="middle" s={13.5}>synth.</T><T x={x + 94} y={198} a="middle" s={13.5}>naturel</T>
    </g>);
  return (
    <svg viewBox="0 0 300 284" style={stl} role="img" aria-label="Deux plaques vues sous lampe UV, avec deux éluants. Avec l’éluant 1, la tache de l’arôme de synthèse et celle de l’arôme naturel sont à la même hauteur : compatible, pas prouvé. Avec l’éluant 2, elles sont à des hauteurs différentes : espèces différentes.">
      {plaque(10, 'éluant 1', 100, 100)}
      {plaque(166, 'éluant 2', 70, 112)}
      <T x={72} y={224} c={COL.orange} a="middle" s={13.5}>même hauteur :</T><T x={72} y={241} c={COL.orange} a="middle" s={13.5}>compatible,</T><T x={72} y={258} c={COL.orange} a="middle" s={13.5}>pas prouvé</T>
      <T x={228} y={224} c={COL.vert} a="middle" s={13.5}>hauteurs différentes :</T><T x={228} y={241} c={COL.vert} a="middle" s={13.5}>espèces</T><T x={228} y={258} c={COL.vert} a="middle" s={13.5}>différentes (preuve)</T>
    </svg>);
}

// ── Carte 6 : les trois erreurs fréquentes ──
export function FicheErreurs() {
  const plaque = (x, id, l1, l2) => (
    <g transform={`translate(${x} 0)`}>
      <rect x={0} y={14} width={84} height={150} rx="5" fill="white" stroke={COL.gris} strokeWidth="2.5" />
      <line x1={6} x2={78} y1={136} y2={136} stroke="#6b7280" strokeWidth="2" />
      {id === 'bas' && <g><rect x={2} y={118} width={80} height={44} fill="#93c5fd" opacity="0.6" /><line x1={2} x2={82} y1={118} y2={118} stroke={COL.bleu} strokeWidth="2.2" /></g>}
      {id === 'concentre' && <g><ellipse cx={28} cy={98} rx={13} ry={22} fill="#dc2626" opacity="0.4" /><ellipse cx={28} cy={86} rx={11} ry={10} fill="#dc2626" opacity="0.85" /><ellipse cx={58} cy={66} rx={11} ry={20} fill="#2563eb" opacity="0.4" /><ellipse cx={58} cy={56} rx={10} ry={9} fill="#2563eb" opacity="0.85" /></g>}
      {id === 'depasse' && <g><Pt x={24} y={50} c="#2563eb" r={6} /><Pt x={42} y={76} c="#dc2626" r={6} /><Pt x={60} y={100} c="#facc15" r={6} /><line x1={2} x2={82} y1={15} y2={15} stroke={COL.rouge} strokeWidth="3" strokeDasharray="5 3" /></g>}
      <T x={42} y={186} a="middle" s={14}>{l1}</T><T x={42} y={204} a="middle" s={14}>{l2}</T>
    </g>);
  return (
    <svg viewBox="0 0 300 214" style={stl} role="img" aria-label="Trois plaques ratées : dépôt trop bas, plongé dans l’éluant, donc aucune tache ; dépôt trop concentré, donc de grosses taches qui traînent ; front dépassé, arrivé au bord de la plaque, donc Rf impossible à calculer.">
      {plaque(8, 'bas', 'dépôt', 'trop bas')}{plaque(108, 'concentre', 'dépôt trop', 'concentré')}{plaque(208, 'depasse', 'front', 'dépassé')}
    </svg>);
}
