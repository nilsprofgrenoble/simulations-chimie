// Schémas des cartes « À retenir » de la simulation 26 (statique des fluides). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const TE = ({ x, y, parts, a = 'start', c = ENCRE, w = 400 }) => (
  <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>
    {parts.map((p, i) => p[0] === '_'
      ? <tspan key={i} fontSize="9.5" dy="3">{p.slice(1)}</tspan>
      : <tspan key={i} dy={i && parts[i - 1][0] === '_' ? -3 : 0}>{p}</tspan>)}
  </text>);
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.6 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
export const FEau = () => (
  <Svg h={226} aria="Pression dans l'eau : l'embout d'un manomètre est plongé à la profondeur h ; l'eau au-dessus de l'embout pèse et ajoute à la pression atmosphérique le terme rho g h ; en pascals avec h en mètres ; environ 1 hectopascal par centimètre d'eau ; dix mètres d'eau valent environ 1 bar">
    <rect x="20" y="40" width="70" height="110" fill="rgba(56,189,248,0.4)" stroke={GRIS} strokeWidth="2.4"/>
    <Lg x1={14} y1={40} x2={96} y2={40} c={BLEU} w={1.8} d="4 3"/><T x={20} y={30} c={BLEU} w={800}>Patm</T>
    <Lg x1={106} y1={40} x2={106} y2={110} c={ORANGE} w={2}/><T x={114} y={80} c={ORANGE} w={800}>h</T>
    <circle cx="55" cy="110" r="5" fill="#f59e0b"/><T x={24} y={134} c={GRIS}>embout</T>
    <T x={150} y={24} c={BLEU} w={800}>P = Patm + ρ g h</T>
    <T x={150} y={64} w={800}>ΔP = ρ × g × h</T><T x={150} y={84} c={GRIS}>ρ en kg·m⁻³</T><T x={150} y={102} c={GRIS}>g = 9,81 N·kg⁻¹</T><T x={150} y={120} c={GRIS}>h en m : ΔP en Pa</T>
    <T x={150} y={176} a="middle" w={800} c={VERT}>1 hPa ≈ 1 cm d’eau</T>
    <T x={150} y={198} a="middle" w={800}>1 hPa = 100 Pa</T><T x={150} y={218} a="middle" c={GRIS}>10 m d’eau ≈ 1 bar</T>
  </Svg>);

export const FPenteB = () => (
  <Svg h={218} aria="Droite d'étalonnage : la pression P en fonction de la profondeur h est une droite ; sa pente a vaut rho fois g, donc rho égale a divisé par g ; son ordonnée à l'origine b est la pression atmosphérique, la pression à h égale 0">
    <Lg x1={50} y1={20} x2={50} y2={142} c={GRIS} w={1.8}/><Lg x1={50} y1={142} x2={286} y2={142} c={GRIS} w={1.8}/>
    <T x={44} y={22} a="end" c={GRIS}>P</T><T x={286} y={160} a="end" c={GRIS}>h</T>
    <Lg x1={50} y1={106} x2={270} y2={40} c={BLEU} w={3}/>
    <circle cx="50" cy="106" r="5" fill={ORANGE}/><T x={58} y={124} c={ORANGE} w={800}>b = Patm</T>
    <Lg x1={150} y1={76} x2={230} y2={76} c={VERT} w={2}/><Lg x1={230} y1={76} x2={230} y2={52} c={VERT} w={2}/><T x={236} y={70} c={VERT} w={800}>a</T>
    <T x={150} y={182} a="middle" w={800}>pente a = ρ × g</T><T x={150} y={204} a="middle" w={800} c={VERT}>ρ = a ÷ g   ;   b = Patm</T>
  </Svg>);

export const FMethodeH = () => {
  const B = [['①', 'convertir la pression lue', 'P (Pa) = P (hPa) × 100'], ['②', 'isoler h dans P = a·h + b', 'h = (P − b) ÷ a'], ['③', 'convertir si on demande des cm', 'h (cm) = h (m) × 100']];
  return (
    <Svg h={226} aria="Méthode pour trouver la hauteur d'eau : convertir la pression lue en pascals, isoler h avec h égale P moins b, divisé par a, puis convertir en centimètres ; piège : oublier de retrancher b ou mélanger hectopascals et pascals ; l'embout au fond donne la hauteur d'eau">
      {B.map(([n, a, f], i) => <g key={i}><rect x="12" y={6 + i * 56} width="276" height="48" rx="8" fill="#eff6ff" stroke={BLEU} strokeWidth="1.6"/><T x={22} y={26 + i * 56} c={ORANGE} w={800}>{n}</T><T x={44} y={26 + i * 56} c={GRIS}>{a}</T><T x={44} y={46 + i * 56} w={800} c={BLEU}>{f}</T></g>)}
      <T x={150} y={190} a="middle" w={800} c={ROUGE}>pièges : oublier b ; hPa et Pa</T><T x={150} y={212} a="middle" c={GRIS}>embout au fond : profondeur = H</T>
    </Svg>);
};

export const FVases = () => (
  <Svg h={216} aria="Trois récipients de formes différentes reliés par le bas : le liquide est au même niveau dans chacun ; à la même profondeur, la pression est la même quelle que soit la forme du récipient ; la surface libre est plane et horizontale">
    <g transform="translate(6 6) scale(1.1)">
      <path d="M100,100 L120,100 L134.3,50 L85.7,50 Z" fill="rgba(56,189,248,0.4)"/><rect x="30" y="50" width="22" height="50" fill="rgba(56,189,248,0.4)"/><rect x="190" y="50" width="46" height="50" fill="rgba(56,189,248,0.4)"/><rect x="30" y="100" width="206" height="16" fill="rgba(56,189,248,0.4)"/>
      <path d="M30,30 V116 H236 V30 M52,30 V100 H100 L80,30 M120,100 L140,30 M120,100 H190 V30" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="24" y1="50" x2="242" y2="50" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="4,3"/>
      <circle cx="41" cy="108" r="3.5" fill="#f59e0b"/><circle cx="110" cy="108" r="3.5" fill="#f59e0b"/><circle cx="213" cy="108" r="3.5" fill="#f59e0b"/>
    </g>
    <T x={150} y={18} a="middle" c={BLEU} w={800}>même niveau</T>
    <T x={150} y={156} a="middle" w={800} c={VERT}>même profondeur : même P</T>
    <T x={150} y={180} a="middle" c={GRIS}>quelle que soit la forme du récipient</T><T x={150} y={202} a="middle" c={GRIS}>surface libre plane et horizontale</T>
  </Svg>);
