import { PNJ } from "./laboJournee";

// ====================================================
//  Visuels de « Une journée au labo » : personnages, décors par lieu (ciel et horloge murale suivent l'heure du jeu) et instruments de mesure.
//  Tout est dessiné en SVG, sans image externe. Les animations respectent prefers-reduced-motion (voir STYLE_VISUELS).
// ====================================================

export const STYLE_VISUELS = `
@keyframes lv-souffle{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
@keyframes lv-parle{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.35)}}
@keyframes lv-vapeur{0%{opacity:0;transform:translateY(4px)}40%{opacity:.7}100%{opacity:0;transform:translateY(-14px)}}
@keyframes lv-led{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes lv-onde{0%{opacity:.8;transform:scale(.6)}100%{opacity:0;transform:scale(1.8)}}
@keyframes lv-neige{0%{transform:translateY(-8px);opacity:0}30%{opacity:.9}100%{transform:translateY(34px);opacity:0}}
@keyframes lv-confetti{0%{transform:translateY(-10px) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(240px) rotate(320deg);opacity:0}}
@keyframes lv-tourne{to{transform:rotate(360deg)}}
.lv-souffle{animation:lv-souffle 3.2s ease-in-out infinite}
.lv-bouche{transform-box:fill-box;transform-origin:center;animation:lv-parle .32s ease-in-out infinite}
.lv-vapeur{animation:lv-vapeur 2.6s ease-out infinite}
.lv-led{animation:lv-led 1.1s infinite}
.lv-onde{transform-box:fill-box;transform-origin:center;animation:lv-onde 1.6s ease-out infinite}
.lv-neige{animation:lv-neige 3s linear infinite}
.lv-confetti{animation:lv-confetti 4.5s linear infinite}
.lv-tourne{transform-box:fill-box;transform-origin:center;animation:lv-tourne 1.1s linear infinite}
@media (prefers-reduced-motion:reduce){.lv-souffle,.lv-bouche,.lv-vapeur,.lv-led,.lv-onde,.lv-neige,.lv-confetti,.lv-tourne{animation:none}}
`;

// ───────────── Ciel et horloge murale selon l'heure du jeu ─────────────
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lerpC = (a, b, k) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const CIEL = [[0, '#bcd9f2', '#e8f3fb'], [120, '#8fc4ee', '#dbeefb'], [270, '#78b6ec', '#cfe7fa'], [420, '#f0c987', '#fbe8c4'], [510, '#ee9a62', '#f8cfa0'], [540, '#6f5a8c', '#c99aa6']];
function couleursCiel(t) {
  const x = Math.max(0, Math.min(540, t));
  for (let i = 0; i < CIEL.length - 1; i++) if (x <= CIEL[i + 1][0]) { const k = (x - CIEL[i][0]) / (CIEL[i + 1][0] - CIEL[i][0]); return [lerpC(CIEL[i][1], CIEL[i + 1][1], k), lerpC(CIEL[i][2], CIEL[i + 1][2], k)]; }
  return [CIEL.at(-1)[1], CIEL.at(-1)[2]];
}
function Fenetre({ t, x, y, w = 150, h = 110 }) {
  const [haut, bas] = couleursCiel(t), k = Math.max(0, Math.min(1, t / 540));
  const sx = x + 22 + k * (w - 44), sy = y + h * 0.62 - Math.sin(k * Math.PI) * h * 0.42;
  return (
    <g>
      <defs><linearGradient id={`lv-ciel-${x}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={haut} /><stop offset="1" stopColor={bas} /></linearGradient><clipPath id={`lv-cf-${x}`}><rect x={x} y={y} width={w} height={h} rx="4" /></clipPath></defs>
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx="7" fill="#dfe6ea" stroke="#b7c3cb" strokeWidth="2" />
      <g clipPath={`url(#lv-cf-${x})`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#lv-ciel-${x})`} />
        <circle cx={sx} cy={sy} r="11" fill={t > 500 ? '#ffe9b8' : '#fff3c4'} opacity=".95" />
        <path d={`M${x} ${y + h} V${y + h * 0.78} Q${x + w * 0.3} ${y + h * 0.66} ${x + w * 0.55} ${y + h * 0.78} T${x + w} ${y + h * 0.74} V${y + h} Z`} fill="#6c8f78" opacity=".75" />
        <path d={`M${x} ${y + h} V${y + h * 0.88} Q${x + w * 0.4} ${y + h * 0.8} ${x + w * 0.7} ${y + h * 0.9} T${x + w} ${y + h * 0.86} V${y + h} Z`} fill="#4f7560" opacity=".9" />
      </g>
      <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} stroke="#dfe6ea" strokeWidth="4" />
    </g>);
}
function Horloge({ t, x, y }) {
  const m = 480 + Math.round(t), ha = ((m / 60) % 12) * 30 + (m % 60) * 0.5, ma = (m % 60) * 6;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="24" fill="#fff" stroke="#34495e" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1="0" y1="-20" x2="0" y2={i % 3 === 0 ? -16 : -18} stroke="#34495e" strokeWidth={i % 3 === 0 ? 2 : 1} transform={`rotate(${i * 30})`} />)}
      <line x1="0" y1="2" x2="0" y2="-11" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" transform={`rotate(${ha})`} />
      <line x1="0" y1="3" x2="0" y2="-17" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" transform={`rotate(${ma})`} />
      <circle r="2.4" fill="#1f2937" />
    </g>);
}

// ───────────── Personnages ─────────────
const TENUE = {
  moi: { peau: '#e8bc96', coat: '#f8fafc', col: '#0f766e' }, dubreuil: { peau: '#f1c9a5', coat: '#6d4bb5', col: '#efe7ff' },
  karim: { peau: '#d9a37a', coat: '#f8fafc', col: '#d97706' }, ines: { peau: '#8d5a3b', coat: '#f8fafc', col: '#0369a1' },
  lucas: { peau: '#f3d1b0', coat: '#f8fafc', col: '#15803d' }, perrin: { peau: '#e9bf9a', coat: '#6b7280', col: '#ffffff' }, aubry: { peau: '#f5d5bd', coat: '#e0527f', col: '#fff0f5' },
};
function Cheveux({ id, avant }) {
  if (id === 'dubreuil') return avant ? <path d="M27 48 Q26 22 50 22 Q74 22 73 48 Q64 38 50 38 Q36 38 27 48Z" fill="#b9bdc6" /> : <path d="M25 52 Q23 20 50 20 Q77 20 75 52 V66 Q70 70 66 64 V50 H34 V64 Q30 70 25 66Z" fill="#b9bdc6" />;
  if (id === 'karim') return avant ? <path d="M28 44 Q30 22 50 22 Q70 22 72 44 Q62 34 50 36 Q38 34 28 44Z" fill="#2b2118" /> : <path d="M29 52 Q32 76 50 76 Q68 76 71 52 Q60 64 50 64 Q40 64 29 52Z" fill="#2b2118" />;
  if (id === 'ines') return avant ? <><path d="M27 46 Q34 24 52 24 Q70 24 73 46 Q60 34 27 46Z" fill="#17171c" /><rect x="30" y="30" width="40" height="5" rx="2.5" fill="#7dd3fc" opacity=".8" /></> : <path d="M25 50 Q22 20 50 20 Q78 20 75 50 V96 H66 V54 H34 V96 H25Z" fill="#17171c" />;
  if (id === 'lucas') return avant ? <>{[[32, 36, 11], [44, 27, 11], [58, 27, 11], [70, 36, 11], [76, 48, 8], [25, 48, 8]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#6b4423" />)}</> : null;
  if (id === 'perrin') return avant ? null : <path d="M28 52 Q24 40 31 34 V52Z M72 52 Q76 40 69 34 V52Z" fill="#9aa0a8" />;
  if (id === 'aubry') return avant ? <>{[[30, 34, 10], [42, 26, 10], [56, 26, 10], [68, 34, 10], [75, 48, 9], [24, 48, 9]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#b4442a" />)}</> : null;
  return avant ? <path d="M28 44 Q32 24 50 24 Q68 24 72 44 Q62 34 50 36 Q38 34 28 44Z" fill="#3a2c20" /> : null;
}
export function Personnage({ id, x = 0, y = 0, taille = 120, parle = false }) {
  const T = TENUE[id] || TENUE.moi, lunettes = id === 'dubreuil' || id === 'perrin';
  return (
    <svg x={x} y={y} width={taille * 100 / 130} height={taille} viewBox="0 0 100 130" overflow="visible" aria-hidden="true">
      <g className="lv-souffle">
        <Cheveux id={id} avant={false} />
        <path d="M12 130 V104 Q12 84 36 79 H64 Q88 84 88 104 V130Z" fill={T.coat} stroke="#00000022" strokeWidth="1.5" />
        {id === 'perrin' ? <><path d="M44 79 L50 90 L56 79Z" fill="#fff" /><path d="M48 84 H52 L54 112 L50 116 L46 112Z" fill="#b91c1c" /></>
          : <path d="M40 79 L50 98 L60 79 Q50 84 40 79Z" fill={T.col} />}
        <rect x="44" y="64" width="12" height="17" rx="5" fill={T.peau} />
        <circle cx="50" cy="48" r="22" fill={T.peau} />
        <Cheveux id={id} avant />
        <circle cx="42" cy="48" r="2.4" fill="#2d2d2d" /><circle cx="58" cy="48" r="2.4" fill="#2d2d2d" />
        {lunettes && <g fill="none" stroke="#33415588" strokeWidth="1.8"><circle cx="42" cy="48" r="6.5" /><circle cx="58" cy="48" r="6.5" /><path d="M48.5 48 H51.5" /></g>}
        {id === 'ines' && <g fill="none" stroke="#7dd3fc" strokeWidth="1.2" opacity=".0" />}
        <ellipse className={parle ? 'lv-bouche' : ''} cx="50" cy="60" rx="5.5" ry="2.6" fill={parle ? '#8a2f2f' : 'none'} stroke={parle ? 'none' : '#8a4b3a'} strokeWidth="1.8" />
        <circle cx="36" cy="55" r="3.2" fill="#e9906f" opacity=".25" /><circle cx="64" cy="55" r="3.2" fill="#e9906f" opacity=".25" />
      </g>
    </svg>);
}

// Portrait rond (visage seulement) pour les bulles de dialogue
export function Avatar({ id, taille = 52, parle = false }) {
  const c = PNJ[id]?.couleur || '#64748b';
  return (
    <span style={{ display: 'inline-block', width: taille, height: taille, borderRadius: '50%', overflow: 'hidden', background: c + '33', border: `2.5px solid ${c}`, flexShrink: 0, boxShadow: '1px 2px 4px rgba(0,0,0,.2)' }}>
      <svg viewBox="14 12 72 72" width="100%" height="100%" aria-hidden="true"><Personnage id={id} taille={130} parle={parle} /></svg>
    </span>);
}

// ───────────── Décors ─────────────
const Mur = ({ t, fenetre = true }) => (
  <g>
    <rect width="800" height="230" fill="#e9f0f2" />
    <rect y="150" width="800" height="80" fill="#cdd6da" />
    {fenetre && <Fenetre t={t} x={54} y={34} />}
    <Horloge t={t} x={330} y={56} />
  </g>);
const Paillasse = ({ y = 150 }) => (<g><rect x="0" y={y} width="800" height="16" fill="#b9ad94" /><rect x="0" y={y + 16} width="800" height="64" fill="#8da1b4" /><path d={`M0 ${y + 16} H800`} stroke="#00000022" /></g>);
const Becher = ({ x, y, niveau = 0.55, couleur = '#ffffff', mousse = false }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 0 H34 V44 Q34 50 28 50 H6 Q0 50 0 44Z" fill="#ffffff55" stroke="#4a6a80" strokeWidth="2" />
    <path d={`M2 ${50 - 44 * niveau} H32 V44 Q32 48 28 48 H6 Q2 48 2 44Z`} fill={couleur} opacity=".95" stroke="#cbd5e1" strokeWidth=".6" />
    {mousse && <g fill="#fff"><circle cx="8" cy={50 - 44 * niveau - 2} r="3.6" /><circle cx="16" cy={50 - 44 * niveau - 4} r="4" /><circle cx="25" cy={50 - 44 * niveau - 2} r="3.4" /></g>}
    <path d="M6 6 H10 M6 14 H10 M6 22 H10" stroke="#4a6a80" strokeWidth="1.4" />
  </g>);

function DecorBureau({ t }) {
  return (<g>
    <Mur t={t} />
    <rect x="30" y="152" width="420" height="14" rx="3" fill="#b78b5a" /><rect x="50" y="166" width="12" height="60" fill="#9c7448" /><rect x="418" y="166" width="12" height="60" fill="#9c7448" />
    <g transform="translate(150 96)"><rect width="110" height="58" rx="5" fill="#2b3a4a" /><rect x="6" y="6" width="98" height="46" rx="2" fill="#bfe3f5" />
      <path d="M12 18 H70 M12 28 H88 M12 38 H56" stroke="#4a90b8" strokeWidth="3" strokeLinecap="round" /><rect x="-12" y="58" width="134" height="6" rx="3" fill="#cdd5db" /></g>
    <g transform="translate(300 128)"><rect width="30" height="24" rx="3" fill="#fff" stroke="#6b7a89" strokeWidth="2" /><path d="M30 6 q10 0 10 10 q0 8 -10 8" fill="none" stroke="#6b7a89" strokeWidth="2" />
      {[8, 15, 22].map((dx, i) => <path key={i} className="lv-vapeur" style={{ animationDelay: `${i * 0.7}s` }} d={`M${dx} -2 q-3 -6 0 -10`} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />)}</g>
    <g transform="translate(86 136) rotate(-4)"><rect width="46" height="16" fill="#fff" stroke="#b7c3cb" /><rect y="-5" width="46" height="16" fill="#fff8e6" stroke="#b7c3cb" /></g>
  </g>);
}
function DecorFormulation({ t }) {
  return (<g>
    <Mur t={t} />
    <Paillasse />
    {/* balance */}
    <g transform="translate(60 118)"><rect width="76" height="34" rx="5" fill="#d9dee3" stroke="#8a97a3" strokeWidth="2" /><rect x="8" y="6" width="42" height="14" rx="2" fill="#0f2a20" /><text x="46" y="17" textAnchor="end" fontSize="10" fontFamily="ui-monospace,monospace" fill="#4ade80">83,3 g</text><circle cx="62" cy="18" r="5" fill="#94a3b8" /><rect x="-4" y="-10" width="62" height="6" rx="3" fill="#b7c0c9" /></g>
    {/* défloculeuse + bécher en dispersion */}
    <g transform="translate(250 60)"><rect x="-4" y="0" width="12" height="96" fill="#7b8794" /><rect x="-4" y="0" width="70" height="10" rx="4" fill="#5b6672" /><rect x="58" y="10" width="6" height="64" fill="#94a3b8" />
      <g transform="translate(61 78)"><ellipse className="lv-tourne" rx="22" ry="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" /></g></g>
    <Becher x={272} y={104} niveau={0.7} couleur="#fdfdfd" />
    <Becher x={330} y={112} niveau={0.35} couleur="#eaf2f7" />
    {/* seaux de peinture */}
    <g transform="translate(470 116)"><path d="M0 8 H54 L50 40 H4Z" fill="#f4f4f4" stroke="#6b7280" strokeWidth="2" /><ellipse cx="27" cy="8" rx="27" ry="6" fill="#ffffff" stroke="#6b7280" strokeWidth="2" /><rect x="8" y="18" width="38" height="12" fill="#0f766e" opacity=".85" /></g>
    {/* jauge Hegman */}
    <g transform="translate(560 126)"><rect width="76" height="14" rx="2" fill="#aeb8c2" stroke="#6b7280" /><path d="M6 3 V11 M16 3 V11 M26 3 V11 M36 3 V11 M46 3 V11 M56 3 V11 M66 3 V11" stroke="#475569" /></g>
  </g>);
}
function DecorAnalyses({ t }) {
  return (<g>
    <Mur t={t} />
    <Paillasse />
    {/* viscosimètre */}
    <g transform="translate(70 60)"><rect x="0" y="0" width="64" height="30" rx="5" fill="#d9dee3" stroke="#8a97a3" strokeWidth="2" /><rect x="8" y="6" width="34" height="14" rx="2" fill="#0b1f33" /><text x="40" y="17" textAnchor="end" fontSize="9" fontFamily="ui-monospace,monospace" fill="#7dd3fc">12,4 Pa·s</text>
      <rect x="28" y="30" width="6" height="40" fill="#94a3b8" /><g transform="translate(31 70)"><rect className="lv-tourne" x="-9" y="-2" width="18" height="4" fill="#64748b" /></g><rect x="-4" y="94" width="76" height="8" fill="#b7c0c9" />
      <Becher x={14} y={72} niveau={0.7} couleur="#fdfdfd" /></g>
    {/* pH-mètre */}
    <g transform="translate(250 98)"><rect width="56" height="54" rx="6" fill="#e4e9ed" stroke="#8a97a3" strokeWidth="2" /><rect x="8" y="8" width="40" height="18" rx="2" fill="#0f2a20" /><text x="44" y="22" textAnchor="end" fontSize="12" fontFamily="ui-monospace,monospace" fill="#4ade80">5,4</text><circle cx="16" cy="40" r="4" fill="#94a3b8" /><circle className="lv-led" cx="42" cy="40" r="3.2" fill="#22c55e" /></g>
    <path d="M330 100 V120 Q330 132 318 134" fill="none" stroke="#475569" strokeWidth="2" /><rect x="326" y="84" width="8" height="30" rx="3" fill="#d4d9de" stroke="#64748b" strokeWidth="1.5" />
    {/* étuve */}
    <g transform="translate(450 70)"><rect width="104" height="82" rx="5" fill="#cdd5db" stroke="#7b8794" strokeWidth="2.5" /><rect x="10" y="10" width="70" height="62" rx="3" fill="#2c3e50" /><rect x="14" y="14" width="62" height="54" rx="2" fill="#415a6e" opacity=".7" /><text x="92" y="30" textAnchor="middle" fontSize="9" fontFamily="ui-monospace,monospace" fill="#0f172a">50°C</text><circle className="lv-led" cx="92" cy="44" r="4" fill="#ef4444" /><rect x="84" y="56" width="14" height="16" rx="2" fill="#aab4bd" /></g>
    {/* fioles */}
    <g fill="#fff" stroke="#4a6a80" strokeWidth="2" strokeLinejoin="round"><path d="M600 150 V120 L588 104 H624 L612 120 V150Z" /><path d="M650 150 V128 H678 V150Z" /></g>
    <path d="M601 144 H611 V128 L601 128Z" fill="#38bdf8" opacity=".6" /><rect x="652" y="138" width="24" height="10" fill="#f59e0b" opacity=".7" />
  </g>);
}
function DecorApplication({ t }) {
  return (<g>
    <Mur t={t} />
    <Paillasse />
    {/* cartes de contraste */}
    {[0, 1, 2, 3].map(i => <g key={i} transform={`translate(${76 + i * 64} 130)`}><rect width="52" height="20" fill="#fff" stroke="#8a97a3" /><rect width="52" height="9" fill="#17171c" /><rect x="0" y="9" width="52" height="11" fill="#fff" opacity={0.55 + i * 0.15} /></g>)}
    <g transform="translate(76 112)"><rect width="52" height="14" rx="2" fill="#aeb8c2" stroke="#6b7280" /></g>
    {/* glossmètre */}
    <g transform="translate(360 112)"><path d="M0 30 H66 L58 8 H14Z" fill="#cfd6dc" stroke="#7b8794" strokeWidth="2" /><rect x="16" y="12" width="30" height="12" rx="2" fill="#0f2a20" /><text x="43" y="22" textAnchor="end" fontSize="9" fontFamily="ui-monospace,monospace" fill="#4ade80">2,8</text></g>
    {/* banc TMFF */}
    <g transform="translate(480 108)"><rect width="190" height="40" rx="5" fill="#d5dbe0" stroke="#7b8794" strokeWidth="2" /><defs><linearGradient id="lv-tm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#fca5a5" /></linearGradient></defs><rect x="8" y="12" width="174" height="16" rx="3" fill="url(#lv-tm)" /><path d="M60 12 V28" stroke="#fff" strokeWidth="2.5" /></g>
  </g>);
}
function DecorVisio({ t }) {
  return (<g>
    <Mur t={t} />
    <rect x="0" y="150" width="800" height="80" fill="#c7b9a3" />
    <g transform="translate(110 40)"><rect width="260" height="150" rx="9" fill="#1e293b" /><rect x="8" y="8" width="244" height="134" rx="4" fill="#e2e8f0" />
      <circle cx="130" cy="64" r="28" fill="#fbcfe8" /><path d="M96 130 Q130 84 164 130Z" fill="#e0527f" />
      <circle cx="130" cy="64" r="34" fill="none" stroke="#38bdf8" strokeWidth="2" className="lv-onde" /><circle cx="130" cy="64" r="34" fill="none" stroke="#38bdf8" strokeWidth="2" className="lv-onde" style={{ animationDelay: '.8s' }} />
      <rect x="14" y="14" width="64" height="42" rx="4" fill="#0f766e" /><circle cx="46" cy="30" r="8" fill="#e8bc96" /><path d="M30 54 Q46 40 62 54Z" fill="#f8fafc" />
      <rect x="95" y="120" width="70" height="16" rx="8" fill="#ef4444" /><text x="130" y="132" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">EN LIGNE</text></g>
    <rect x="228" y="190" width="40" height="6" fill="#64748b" /><rect x="214" y="196" width="68" height="8" rx="4" fill="#94a3b8" />
  </g>);
}
function DecorStockage({ t }) {
  return (<g>
    <rect width="800" height="230" fill="#cfd8de" /><rect y="150" width="800" height="80" fill="#a9b4bb" />
    <Horloge t={t} x={330} y={56} />
    {[70, 230, 390].map((x, i) => <g key={i} transform={`translate(${x} 70)`}><path d="M0 12 Q0 0 30 0 Q60 0 60 12 V70 Q60 82 30 82 Q0 82 0 70Z" fill={i === 0 ? '#2563eb' : '#1d4ed8'} stroke="#1e3a8a" strokeWidth="2" /><path d="M2 26 H58 M2 56 H58" stroke="#1e3a8a" strokeWidth="2" /><rect x="14" y="34" width="32" height="16" rx="2" fill="#fff" /><text x="30" y="46" textAnchor="middle" fontSize="8" fontWeight="800" fill="#1e3a8a">{i === 0 ? 'VAE' : 'ORGAL'}</text></g>)}
    {Array.from({ length: 12 }, (_, i) => <circle key={i} className="lv-neige" style={{ animationDelay: `${i * 0.28}s` }} cx={60 + i * 55 + (i % 3) * 9} cy={40} r="2.6" fill="#fff" />)}
    <g transform="translate(600 60)"><rect width="46" height="92" rx="23" fill="#fff" stroke="#64748b" strokeWidth="3" /><rect x="19" y="14" width="8" height="52" rx="4" fill="#3b82f6" /><circle cx="23" cy="74" r="10" fill="#3b82f6" /><text x="23" y="110" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1d4ed8" fontFamily="ui-monospace,monospace">−5 °C</text></g>
  </g>);
}
function DecorFin({ t, ton }) {
  const fete = ton === 'ok';
  return (<g>
    <Mur t={t} />
    <Paillasse />
    <Becher x={160} y={104} niveau={0.7} couleur="#fdfdfd" /><Becher x={220} y={112} niveau={0.45} couleur="#eaf2f7" />
    <g transform="translate(330 96)"><rect width="120" height="56" rx="4" fill="#fff" stroke="#8a97a3" strokeWidth="2" /><path d="M12 14 H90 M12 26 H100 M12 38 H70" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" /><circle cx="102" cy="44" r="9" fill={ton === 'ko' ? '#ef4444' : ton === 'moyen' ? '#f59e0b' : '#22c55e'} /><path d={ton === 'ko' ? 'M98 40 L106 48 M106 40 L98 48' : 'M98 44 L101 47 L107 40'} stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>
    {fete && Array.from({ length: 16 }, (_, i) => <rect key={i} className="lv-confetti" style={{ animationDelay: `${(i * 0.31) % 4.5}s` }} x={30 + i * 47} y="0" width="7" height="12" rx="1.5" fill={['#f59e0b', '#ec4899', '#38bdf8', '#22c55e', '#a78bfa'][i % 5]} />)}
  </g>);
}

const LIEU_DECOR = { 'Bureau de la responsable': 'bureau', 'Bureau': 'bureau', 'Téléphone': 'bureau', 'Service achats': 'bureau', 'Paillasse de formulation': 'formulation', 'Paillasse': 'formulation', 'Paillasse et laboratoire': 'formulation',
  'Laboratoire d\'analyses': 'analyses', 'Atelier d\'application': 'application', 'Salle de réunion (visio)': 'visio', 'Local de stockage': 'stockage', 'Fin de journée': 'fin' };
const DECORS = { bureau: DecorBureau, formulation: DecorFormulation, analyses: DecorAnalyses, application: DecorApplication, visio: DecorVisio, stockage: DecorStockage };

// Décor illustré d'une scène : le personnage qui parle est au premier plan à droite
export function ScenePlanche({ lieu, pnj, t, ton, parle = true, equipe = null }) {
  const cle = LIEU_DECOR[lieu] || 'formulation', D = DECORS[cle];
  const p = PNJ[pnj];
  return (
    <svg viewBox="0 0 800 230" role="img" aria-label={`Décor : ${lieu}${pnj !== 'moi' ? `, ${p.nom} te parle` : ''}`} style={{ width: '100%', display: 'block', borderRadius: 14 }}>
      {cle === 'fin' ? <DecorFin t={t} ton={ton} /> : <D t={t} />}
      {pnj !== 'moi' && <g><Personnage id={pnj} x={640} y={78} taille={150} parle={parle} /></g>}
      {equipe && ['karim', 'ines', 'lucas'].map((id, i) => <Personnage key={id} id={id} x={560 + i * 78} y={92} taille={130} />)}
      <rect x="10" y="196" width={Math.max(160, (p.nom.length + p.role.length) * 6.4 + 24)} height="26" rx="13" fill="#ffffffee" stroke={p.couleur} strokeWidth="2" />
      <text x="22" y="213" fontSize="13" fontWeight="800" fill={p.couleur}>{p.nom}<tspan fill="#5b6472" fontWeight="500" fontSize="11.5"> · {p.role}</tspan></text>
    </svg>);
}

// Bandeau d'introduction : toute l'équipe devant la paillasse
export function Affiche({ t = 0 }) {
  return (
    <svg viewBox="0 0 800 260" role="img" aria-label="Le laboratoire de R&D et son équipe" style={{ width: '100%', display: 'block', borderRadius: 14 }}>
      <g transform="translate(0 -4)"><DecorFormulation t={t} /></g>
      {['karim', 'dubreuil', 'ines', 'lucas'].map((id, i) => <Personnage key={id} id={id} x={430 + i * 88} y={86} taille={150} />)}
      <text x="30" y="226" fontSize="12.5" fontFamily="ui-monospace,monospace" fill="#0f766e" letterSpacing="2" fontWeight="700">LABORATOIRE R&amp;D · PEINTURES</text>
    </svg>);
}

// Portraits de l'équipe avec disponibilité
export function Equipe({ occup }) {
  const lignes = [['karim', 'Formulation'], ['ines', 'Analyses'], ['lucas', 'Rhéologie, application']];
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} data-equipe>
      {lignes.map(([id, role]) => { const o = occup[id] || 0, p = PNJ[id]; return (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1.5px solid ${o ? '#d97706' : '#15803d'}55`, borderRadius: 12, padding: '3px 10px 3px 4px', flex: '1 1 140px' }}>
          <svg width="40" height="46" viewBox="0 0 100 130" aria-hidden="true" style={{ flex: 'none', overflow: 'visible' }}><Personnage id={id} taille={130} /></svg>
          <div style={{ fontSize: 12.5, lineHeight: 1.35, minWidth: 0 }}>
            <b style={{ color: p.couleur }}>{p.nom}</b><div style={{ color: o ? '#b45309' : '#15803d', fontWeight: 700 }}>{o ? `occupé·e (${Math.round(o)} min)` : 'disponible'}</div><div style={{ color: '#5b6472', fontSize: 11 }}>{role}</div>
          </div>
        </div>); })}
    </div>);
}

// ───────────── Instruments de mesure ─────────────
const Cadre = ({ titre, children, hauteur = 190 }) => (
  <svg viewBox={`0 0 360 ${hauteur}`} role="img" aria-label={titre} style={{ width: '100%', maxWidth: 440, display: 'block', margin: '12px auto 4px' }}>
    <rect x="1" y="1" width="358" height={hauteur - 2} rx="12" fill="#1f2933" stroke="#52606d" strokeWidth="2" />
    <rect x="10" y="10" width="340" height={hauteur - 20} rx="7" fill="#0b1b24" />
    <text x="20" y="27" fontSize="10.5" fill="#7dd3fc" fontFamily="ui-monospace,monospace" letterSpacing="1.5">{titre}</text>
    {children}
  </svg>);
const txt = { fontFamily: 'ui-monospace,monospace', fill: '#a7f3d0' };
const pts = (xs, f) => xs.map(x => f(x).join(',')).join(' ');
const fr = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

export function Instrument({ v }) {
  if (!v) return null;
  if (v.type === 'balance') {
    const k = Math.max(0, Math.min(1, (v.es - 40) / 20));
    return (<Cadre titre="BALANCE À INFRAROUGE · EXTRAIT SEC" hauteur={150}>
      <text x="22" y="72" fontSize="38" fontWeight="700" {...txt}>{fr(v.es)} %</text><text x="24" y="92" fontSize="12" {...txt}>densité {fr(v.dens, 3)}</text>
      <rect x="22" y="108" width="316" height="12" rx="6" fill="#16303d" /><rect x="22" y="108" width={316 * k} height="12" rx="6" fill={v.es > 50 ? '#22c55e' : '#ef4444'} /><path d={`M${22 + 316 * 0.5} 102 V126`} stroke="#fde68a" strokeWidth="2" />
      <text x={22 + 316 * 0.5} y="140" textAnchor="middle" fontSize="10" fill="#fde68a" fontFamily="ui-monospace,monospace">50 % (minimum)</text></Cadre>);
  }
  if (v.type === 'ph') {
    const px = p => 22 + (p / 14) * 316;
    return (<Cadre titre="pH-MÈTRE" hauteur={170}>
      <text x="22" y="58" fontSize="30" fontWeight="700" {...txt}>pH {fr(v.ph)}</text>
      <defs><linearGradient id="lv-phg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ef4444" /><stop offset=".3" stopColor="#f59e0b" /><stop offset=".5" stopColor="#22c55e" /><stop offset=".75" stopColor="#3b82f6" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
      <rect x="22" y="92" width="316" height="14" rx="7" fill="url(#lv-phg)" />
      <path d={`M${px(v.ph)} 84 L${px(v.ph) - 6} 74 H${px(v.ph) + 6}Z`} fill="#fff" /><text x={px(v.ph)} y="73" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="ui-monospace,monospace" transform="translate(0 0)">Vinnapas</text>
      <path d={`M${px(v.ref)} 114 L${px(v.ref) - 6} 124 H${px(v.ref) + 6}Z`} fill="#fde68a" /><text x={px(v.ref)} y="138" textAnchor="middle" fontSize="10" fill="#fde68a" fontFamily="ui-monospace,monospace">référence Orgal</text>
      {[0, 7, 14].map(n => <text key={n} x={px(n)} y="158" textAnchor="middle" fontSize="10" fill="#9fb3c8" fontFamily="ui-monospace,monospace">{n}</text>)}</Cadre>);
  }
  if (v.type === 'gloss') {
    const ang = g => (-90 + Math.min(g, 100) / 100 * 180) * Math.PI / 180, cx = 180, cy = 135, R = 78;
    const arc = (a, b) => { const p1 = [cx + R * Math.sin(ang(a)), cy - R * Math.cos(ang(a))], p2 = [cx + R * Math.sin(ang(b)), cy - R * Math.cos(ang(b))]; return `M${p1} A${R} ${R} 0 0 1 ${p2}`; };
    return (<Cadre titre="GLOSSMÈTRE" hauteur={175}>
      <path d={arc(0, 10)} stroke="#22c55e" strokeWidth="12" fill="none" /><path d={arc(10, 60)} stroke="#f59e0b" strokeWidth="12" fill="none" /><path d={arc(60, 100)} stroke="#ef4444" strokeWidth="12" fill="none" />
      <line x1={cx} y1={cy} x2={cx + (R - 12) * Math.sin(ang(v.g60))} y2={cy - (R - 12) * Math.cos(ang(v.g60))} stroke="#fff" strokeWidth="3" strokeLinecap="round" /><circle cx={cx} cy={cy} r="6" fill="#fff" />
      <text x="22" y="62" fontSize="12" {...txt}>60° : {fr(v.g60)} UB</text><text x="22" y="80" fontSize="12" {...txt}>85° : {fr(v.g85)} UB</text><text x="262" y="160" fontSize="11" fill="#86efac" fontFamily="ui-monospace,monospace">zone « mat »</text></Cadre>);
  }
  if (v.type === 'tmff') {
    const x0 = 22, w = 316, T0 = -2, T1 = 20, px = T => x0 + (T - T0) / (T1 - T0) * w, lim = v.tmff == null ? 0 : v.tmff;
    return (<Cadre titre="BANC À GRADIENT DE TEMPÉRATURE · TMFF" hauteur={175}>
      <rect x={x0} y="58" width={px(lim) - x0} height="56" fill="#1e3a5f" /><rect x={px(lim)} y="58" width={w - (px(lim) - x0)} height="56" fill="#e8eef2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <path key={i} d={`M${x0 + 4 + i * 6} ${64 + (i % 3) * 14} l5 6 l-3 7 l5 7`} stroke="#9fb3c8" strokeWidth="1.3" fill="none" opacity={px(lim) - x0 > 30 + i * 6 ? 1 : 0} />)}
      <path d={`M${px(lim)} 50 V122`} stroke="#fde68a" strokeWidth="3" /><text x={px(lim)} y="46" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fde68a" fontFamily="ui-monospace,monospace">{v.tmff == null ? 'TMFF < 0 °C' : `TMFF ≈ ${v.tmff} °C`}</text>
      <text x={x0 + 8} y="136" fontSize="10.5" fill="#9fb3c8" fontFamily="ui-monospace,monospace">film craquelé</text><text x={x0 + w - 8} y="136" textAnchor="end" fontSize="10.5" fill="#9fb3c8" fontFamily="ui-monospace,monospace">film continu</text>
      {[0, 5, 10, 15, 20].map(T => <text key={T} x={px(T)} y="158" textAnchor="middle" fontSize="10" fill="#9fb3c8" fontFamily="ui-monospace,monospace">{T} °C</text>)}</Cadre>);
  }
  if (v.type === 'huile') {
    const bar = (x, h, c, lab) => <g key={x}><rect x={x} y={140 - h * 1.9} width="38" height={h * 1.9} rx="3" fill={c} /><text x={x + 19} y={134 - h * 1.9} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="ui-monospace,monospace">{lab}</text></g>;
    return (<Cadre titre="PRISES D'HUILE (g/100 g)" hauteur={190}>
      {bar(52, v.fiche[0], '#64748b', v.fiche[0])}{bar(96, v.mesure[0], '#38bdf8', v.mesure[0])}{bar(206, v.fiche[1], '#64748b', v.fiche[1])}{bar(250, v.mesure[1], '#38bdf8', v.mesure[1])}
      <text x="96" y="160" textAnchor="middle" fontSize="11" fill="#cbd5e1" fontFamily="ui-monospace,monospace">TiO₂</text><text x="270" y="160" textAnchor="middle" fontSize="11" fill="#cbd5e1" fontFamily="ui-monospace,monospace">CaCO₃</text>
      <rect x="20" y="170" width="9" height="9" fill="#64748b" /><text x="33" y="178" fontSize="10" fill="#cbd5e1" fontFamily="ui-monospace,monospace">fiche</text><rect x="86" y="170" width="9" height="9" fill="#38bdf8" /><text x="99" y="178" fontSize="10" fill="#cbd5e1" fontFamily="ui-monospace,monospace">mesuré (spatule)</text></Cadre>);
  }
  if (v.type === 'rheo') {
    const X0 = 40, Y0 = 150, W = 300, H = 100, g = [0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000];
    const px = x => X0 + (Math.log10(x) + 1) / 4 * W, py = e => Y0 - (e + 0.3) / 3.2 * H;   // log10(η) entre −0,3 et 2,9
    const courbe = (K, n) => pts(g, x => [px(x), py(Math.log10(K) + (n - 1) * Math.log10(x))]);
    return (<Cadre titre="VISCOSIMÈTRE · η en fonction du gradient" hauteur={190}>
      <path d={`M${X0} ${Y0} H${X0 + W} M${X0} ${Y0} V${Y0 - H - 4}`} stroke="#52606d" fill="none" />
      <polyline points={courbe(3.2, 0.42)} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" />
      <polyline points={v.mauvais ? courbe(14, 0.3) : courbe(3.4, 0.4)} fill="none" stroke="#38bdf8" strokeWidth="3" />
      {v.mauvais && <polyline points={courbe(8, 0.3)} fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />}
      <text x={X0 + W} y={Y0 + 16} textAnchor="end" fontSize="10" fill="#9fb3c8" fontFamily="ui-monospace,monospace">gradient de cisaillement (s⁻¹)</text><text x="14" y="46" fontSize="10" fill="#9fb3c8" fontFamily="ui-monospace,monospace">η</text>
      <text x={X0 + 4} y="44" fontSize="10.5" fill="#94a3b8" fontFamily="ui-monospace,monospace" transform="translate(70 0)">- - référence Orgal</text><text x={X0 + 4} y="58" fontSize="10.5" fill="#38bdf8" fontFamily="ui-monospace,monospace" transform="translate(70 0)">— ta peinture</text>
      {v.mauvais && <text x={X0 + 4} y="72" fontSize="10.5" fill="#f87171" fontFamily="ui-monospace,monospace" transform="translate(70 0)">⋯ retour : thixotropie</text>}</Cadre>);
  }
  if (v.type === 'masq') {
    const X0 = 40, Y0 = 150, W = 300, H = 104, px = r => X0 + (r - 3) / 10 * W, py = c => Y0 - (c - 84) / 16 * H;
    const courbe = Array.from({ length: 41 }, (_, i) => 3 + i * 0.25).map(r => [px(r), py(Math.max(84, Math.min(99.7, 98 - (r - v.pm) * 1.9 * (r > v.pm ? 1 : 0.55))))]);
    return (<Cadre titre="CONTRASTE (%) EN FONCTION DU RENDEMENT (m²/L)" hauteur={190}>
      <path d={`M${X0} ${Y0} H${X0 + W} M${X0} ${Y0} V${Y0 - H - 4}`} stroke="#52606d" fill="none" />
      <line x1={X0} x2={X0 + W} y1={py(98)} y2={py(98)} stroke="#fde68a" strokeDasharray="5 4" /><text x={X0 + W} y={py(98) - 4} textAnchor="end" fontSize="10" fill="#fde68a" fontFamily="ui-monospace,monospace">98 %</text>
      <polyline points={courbe.map(p => p.join(',')).join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
      {[4.6, 6.2, 8.4, 11.6].map((r, i) => <circle key={i} cx={px(r)} cy={py(Math.max(84, Math.min(99.7, 98 - (r - v.pm) * 1.9 * (r > v.pm ? 1 : 0.55))))} r="3.6" fill="#fff" />)}
      <path d={`M${px(v.pm)} ${py(98)} V${Y0}`} stroke="#4ade80" strokeWidth="2" strokeDasharray="3 3" /><circle cx={px(v.pm)} cy={py(98)} r="4.5" fill="#4ade80" />
      <text x={px(v.pm)} y={Y0 + 15} textAnchor="middle" fontSize="12" fontWeight="700" fill={v.pm >= 7 ? '#4ade80' : '#f87171'} fontFamily="ui-monospace,monospace">PM = {fr(v.pm)} m²/L</text>
    </Cadre>);
  }
  return null;
}
