// ═══════════════════════════════════════════════════════════════════════════
//  Petites illustrations des types d'exercices (S'APP, ANA, VAL, REA) : elles s'affichent à droite de chaque ligne de l'écran « Choisis ce que tu veux travailler »
//  pour montrer d'un coup d'œil ce que l'on y fait (lire un graphique, repérer des données, isoler une grandeur…).
//  Purement décoratives (aria-hidden) : le titre et la description disent déjà tout. Pas de couleur seule : chaque idée a aussi une forme (✓ / ✗, flèche, repère).
//  Pour un nouveau type d'exercice : ajouter une entrée ci-dessous (clé = identifiant du type) ; sans entrée, la ligne s'affiche sans image.
// ═══════════════════════════════════════════════════════════════════════════
const ENCRE = '#334155', GRIS = '#cbd5e1', AMBRE = '#f59e0b', VERT = '#16a34a', ROUGE = '#dc2626', BLANC = '#fff';
const T = { fontFamily: 'inherit', fontWeight: 800 };

const Fleche = ({ id, c }) => <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={c} /></marker>;
const Coche = ({ x, y, c = VERT }) => <g><circle cx={x} cy={y} r="9" fill={c} /><path d={`M${x - 4.5} ${y}l3.5 3.5l6-7`} fill="none" stroke={BLANC} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></g>;
const Croix = ({ x, y, c = ROUGE }) => <g><circle cx={x} cy={y} r="9" fill={c} /><path d={`M${x - 3.5} ${y - 3.5}l7 7M${x + 3.5} ${y - 3.5}l-7 7`} stroke={BLANC} strokeWidth="2.6" strokeLinecap="round" /></g>;
const Axes = ({ x0 = 24, y0 = 82, x1 = 148, y1 = 10 }) => <path d={`M${x0} ${y1}V${y0}H${x1}`} fill="none" stroke={ENCRE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />;

const DESSINS = {
  // ── S'APP ──
  donnees: c => (<>
    <rect x="6" y="8" width="84" height="84" rx="8" fill={BLANC} stroke={GRIS} strokeWidth="2" />
    {[[20, 58], [32, 66, 1], [44, 48], [56, 62, 1], [68, 40]].map(([y, w, h], i) => <rect key={i} x="16" y={y} width={w} height="7" rx="3.5" fill={h ? AMBRE : GRIS} />)}
    <path d="M82 35C98 35 98 32 106 32M82 59C98 59 98 62 106 62" fill="none" stroke={ENCRE} strokeWidth="2" markerEnd="url(#a-d)" /><defs><Fleche id="a-d" c={ENCRE} /></defs>
    <rect x="108" y="20" width="46" height="24" rx="12" fill={c} /><text x="131" y="38" textAnchor="middle" fontSize="16" fill={BLANC} style={T}>m</text>
    <rect x="108" y="50" width="46" height="24" rx="12" fill={c} /><text x="131" y="68" textAnchor="middle" fontSize="16" fill={BLANC} style={T}>v</text></>),
  situation: c => (<>
    <path d="M30 52H130" stroke={ENCRE} strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" />
    {[[30, '1'], [80, '2'], [130, '3']].map(([x, n], i) => <g key={n}>
      {i === 1 && <circle cx={x} cy="52" r="23" fill="none" stroke={AMBRE} strokeWidth="2.5" />}
      <circle cx={x} cy="52" r="16" fill={i === 1 ? AMBRE : BLANC} stroke={i === 1 ? AMBRE : c} strokeWidth="3" />
      <text x={x} y="58" textAnchor="middle" fontSize="17" fill={ENCRE} style={T}>{n}</text></g>)}
    </>),
  graphique: c => (<>
    <path d="M24 28H148M24 46H148M24 64H148" stroke="#e2e8f0" strokeWidth="1.5" />
    <Axes /><path d="M28 78Q60 18 146 24" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M73.5 35V82M24 35H73.5" stroke={AMBRE} strokeWidth="2.2" strokeDasharray="4 4" />
    <circle cx="73.5" cy="35" r="6" fill={AMBRE} stroke={BLANC} strokeWidth="2" />
    <circle cx="124" cy="62" r="11" fill={BLANC} stroke={ENCRE} strokeWidth="3" /><path d="M132 70l10 10" stroke={ENCRE} strokeWidth="4.5" strokeLinecap="round" /></>),
  // ── ANA ──
  probleme: c => (<>
    <defs><Fleche id="a-p" c={ENCRE} /></defs>
    {[8, 60].map((x, i) => <g key={x}><rect x={x} y="32" width="38" height="36" rx="7" fill={BLANC} stroke={i ? c : GRIS} strokeWidth="2.5" />
      <rect x={x + 7} y="42" width="24" height="5" rx="2.5" fill={i ? c : GRIS} /><rect x={x + 7} y="53" width="16" height="5" rx="2.5" fill={GRIS} /></g>)}
    <path d="M47 50H58M99 50H111" stroke={ENCRE} strokeWidth="2.5" markerEnd="url(#a-p)" />
    <path d="M122 80V20" stroke={ENCRE} strokeWidth="3" strokeLinecap="round" /><path d="M122 20l30 10l-30 10z" fill={AMBRE} /></>),
  relation: c => (<>
    {[[8, 1], [88, 0]].map(([x, ok]) => <g key={x}><rect x={x} y="12" width="64" height="56" rx="8" fill={BLANC} stroke={ok ? VERT : GRIS} strokeWidth="2.5" />
      <rect x={x + 10} y="24" width="44" height="7" rx="3.5" fill={ok ? c : GRIS} /><rect x={x + 10} y="38" width="28" height="7" rx="3.5" fill={GRIS} />
      {ok ? <Coche x={x + 32} y="78" /> : <Croix x={x + 32} y="78" />}</g>)}</>),
  hypothese: c => (<>
    {[[18, 1, 70], [46, 1, 54], [74, 0, 62]].map(([y, ok, w]) => <g key={y}>
      <rect x="14" y={y - 11} width="22" height="22" rx="5" fill={ok ? c : BLANC} stroke={ok ? c : ENCRE} strokeWidth="2.5" />
      {ok && <path d={`M19 ${y}l5 5l8-10`} fill="none" stroke={BLANC} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      <rect x="46" y={y - 4} width={w} height="8" rx="4" fill={ok ? GRIS : '#e2e8f0'} /></g>)}
    <path d="M122 86C128 86 130 30 140 30S152 86 156 86" fill="none" stroke={c} strokeWidth="3" /><path d="M118 86H160" stroke={ENCRE} strokeWidth="2.2" /></>),
  prevoir: c => (<>
    <Axes /><path d="M28 78Q80 78 140 16" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M82 61V82M24 61H82M110.5 42V82M24 42H110.5" stroke={AMBRE} strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="82" cy="61" r="5" fill={AMBRE} /><circle cx="110.5" cy="42" r="5" fill={AMBRE} />
    <text x="96" y="76" textAnchor="middle" fontSize="13" fill={ENCRE} style={T}>×2</text><text x="14" y="52" textAnchor="middle" fontSize="13" fill={ENCRE} style={T}>×4</text></>),
  schema: c => (<>
    <defs><Fleche id="a-s" c={c} /></defs>
    {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, x = (r) => (80 + r * Math.cos(a)).toFixed(1), y = (r) => (50 + r * Math.sin(a) * 0.95).toFixed(1);
      return <path key={i} d={`M${x(17)} ${y(17)}L${x(40)} ${y(40)}`} stroke={c} strokeWidth="3" markerEnd="url(#a-s)" />; })}
    <circle cx="80" cy="50" r="14" fill={ROUGE} /><path d="M73 50H87M80 43V57" stroke={BLANC} strokeWidth="3.2" strokeLinecap="round" /></>),
  algorithme: c => (<>
    <defs><Fleche id="a-a" c={ENCRE} /></defs>
    <rect x="52" y="4" width="56" height="18" rx="9" fill={c} />
    <path d="M80 22V32" stroke={ENCRE} strokeWidth="2.5" markerEnd="url(#a-a)" />
    <path d="M80 33L102 50L80 67L58 50z" fill={BLANC} stroke={ENCRE} strokeWidth="2.5" strokeLinejoin="round" /><text x="80" y="56" textAnchor="middle" fontSize="16" fill={ENCRE} style={T}>?</text>
    <path d="M58 50H32V70M102 50H128V70" fill="none" stroke={ENCRE} strokeWidth="2.5" markerEnd="url(#a-a)" />
    <rect x="6" y="74" width="52" height="18" rx="6" fill={BLANC} stroke={c} strokeWidth="2.5" /><rect x="102" y="74" width="52" height="18" rx="6" fill={AMBRE} /></>),
  // ── VAL ──
  plausible: c => (<>
    <path d="M10 62H150" stroke={ENCRE} strokeWidth="2.5" strokeLinecap="round" />
    {[10, 30, 50, 70, 90, 110, 130, 150].map(x => <path key={x} d={`M${x} 57V67`} stroke={ENCRE} strokeWidth="2" />)}
    <rect x="46" y="44" width="48" height="16" rx="4" fill={c} opacity=".28" /><rect x="46" y="44" width="48" height="16" rx="4" fill="none" stroke={c} strokeWidth="2.2" />
    <circle cx="132" cy="62" r="6" fill={ROUGE} /><path d="M132 14l15 26H117z" fill={AMBRE} stroke={ENCRE} strokeWidth="2" strokeLinejoin="round" />
    <path d="M132 22v9" stroke={ENCRE} strokeWidth="2.8" strokeLinecap="round" /><circle cx="132" cy="35" r="1.6" fill={ENCRE} /></>),
  compat: c => (<>
    <path d="M80 8V92" stroke={ENCRE} strokeWidth="2.5" strokeDasharray="5 4" />
    {[[34, 54, 106, 80, 1], [70, 112, 140, 126, 0]].map(([y, a, b, m, ok]) => <g key={y}>
      <path d={`M${a} ${y}H${b}M${a} ${y - 6}V${y + 6}M${b} ${y - 6}V${y + 6}`} stroke={ok ? VERT : ROUGE} strokeWidth="3" strokeLinecap="round" />
      <circle cx={m} cy={y} r="5.5" fill={ok ? VERT : ROUGE} /></g>)}
    <path d="M14 34H24M14 70H24" stroke={GRIS} strokeWidth="2" /></>),
  decision: c => (<>
    <path d="M80 18V84M58 86H102" stroke={ENCRE} strokeWidth="3.5" strokeLinecap="round" /><path d="M26 30L134 40" stroke={ENCRE} strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="80" cy="18" r="5" fill={AMBRE} />
    <path d="M26 30L12 62H40zM134 40L120 72H148z" fill="none" stroke={ENCRE} strokeWidth="2" strokeLinejoin="round" />
    <path d="M8 62Q26 78 44 62zM116 72Q134 88 152 72z" fill={c} /></>),
  // ── REA ──
  unites: c => (<>
    <defs><Fleche id="a-u" c={ENCRE} /></defs>
    <rect x="6" y="14" width="58" height="30" rx="8" fill={BLANC} stroke={c} strokeWidth="2.5" /><text x="35" y="35" textAnchor="middle" fontSize="15" fill={ENCRE} style={T}>km/h</text>
    <rect x="96" y="56" width="58" height="30" rx="8" fill={c} /><text x="125" y="77" textAnchor="middle" fontSize="15" fill={BLANC} style={T}>m/s</text>
    <path d="M40 50C40 72 60 72 90 72" fill="none" stroke={ENCRE} strokeWidth="2.5" markerEnd="url(#a-u)" />
    <text x="98" y="30" fontSize="15" fill={AMBRE} style={{ ...T, stroke: ENCRE, strokeWidth: .4 }}>÷ 3,6</text></>),
  chiffres: c => (<>
    <text x="14" y="56" fontSize="34" fill={ENCRE} style={T}>3,14</text><text x="98" y="56" fontSize="34" fill={GRIS} style={T}>16</text>
    <path d="M16 66Q16 76 26 76H78Q88 76 88 66" fill="none" stroke={AMBRE} strokeWidth="3.2" strokeLinecap="round" />
    <path d="M96 22L150 74" stroke={c} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7" /></>),
  calculatrice: c => (<>
    <rect x="44" y="5" width="72" height="90" rx="9" fill={BLANC} stroke={ENCRE} strokeWidth="3" />
    <rect x="52" y="13" width="56" height="22" rx="4" fill={c} opacity=".22" stroke={c} strokeWidth="2" /><text x="102" y="30" textAnchor="end" fontSize="15" fill={ENCRE} style={T}>√2</text>
    {[0, 1, 2, 3].flatMap(r => [0, 1, 2].map(k => <rect key={`${r}${k}`} x={53 + k * 19} y={43 + r * 12.5} width="15" height="9" rx="3" fill={r === 0 && k === 2 ? AMBRE : r === 3 && k === 2 ? c : GRIS} />))}</>),
  isoler: c => (<>
    <defs><Fleche id="a-i" c={ENCRE} /></defs>
    <text x="80" y="30" textAnchor="middle" fontSize="19" fill={ENCRE} style={T}>U = R × I</text>
    <path d="M80 40V58" stroke={AMBRE} strokeWidth="3.2" markerEnd="url(#a-i)" />
    <rect x="22" y="62" width="116" height="30" rx="8" fill={c} /><text x="80" y="83" textAnchor="middle" fontSize="19" fill={BLANC} style={T}>I = U ÷ R</text></>),
  calcul: c => (<>
    <defs><Fleche id="a-c" c={ENCRE} /></defs>
    <text x="80" y="26" textAnchor="middle" fontSize="19" fill={ENCRE} style={T}>n = m / M</text>
    <text x="80" y="54" textAnchor="middle" fontSize="17" fill={ENCRE} style={T}>= 5,0 / 20</text>
    <path d="M80 60V70" stroke={AMBRE} strokeWidth="3" markerEnd="url(#a-c)" />
    <rect x="38" y="72" width="84" height="22" rx="11" fill={c} /><text x="80" y="89" textAnchor="middle" fontSize="16" fill={BLANC} style={T}>0,25 mol</text></>),
  vecteurs: c => (<>
    <defs><Fleche id="a-v1" c={c} /><Fleche id="a-v2" c={AMBRE} /><Fleche id="a-v3" c={ENCRE} /></defs>
    <path d="M90 68L110 28M50 38L110 28" stroke={GRIS} strokeWidth="2.2" strokeDasharray="4 4" />
    <path d="M30 78L88 68" stroke={c} strokeWidth="3.5" markerEnd="url(#a-v1)" /><path d="M30 78L48 40" stroke={AMBRE} strokeWidth="3.5" markerEnd="url(#a-v2)" />
    <path d="M30 78L108 29" stroke={ENCRE} strokeWidth="4" markerEnd="url(#a-v3)" /></>),
  courbe: c => (<>
    <path d="M24 28H148M24 46H148M24 64H148M56 10V82M88 10V82M120 10V82" stroke="#e2e8f0" strokeWidth="1.5" /><Axes />
    <path d="M34 72C60 50 70 38 148 28" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 0" />
    {[[40, 68], [60, 54], [80, 44], [100, 36], [124, 32]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill={AMBRE} stroke={ENCRE} strokeWidth="1.8" />)}</>),
};

export const aUneIllustration = id => !!DESSINS[id];

// Illustration d'un type d'exercice. couleur = couleur de la compétence ; la taille se règle en CSS (classe .pc-ill dans ParcoursCompetence)
export function IllustrationType({ id, couleur, className = 'pc-ill' }) {
  const dessin = DESSINS[id];
  if (!dessin) return null;
  return (
    <span className={className} aria-hidden="true" style={{ flex: 'none', display: 'block', borderRadius: 12, background: `${couleur}14`, border: `1px solid ${couleur}26`, overflow: 'hidden' }}>
      <svg viewBox="0 0 160 100" width="100%" height="100%" focusable="false" style={{ display: 'block' }}>{dessin(couleur)}</svg>
    </span>);
}
