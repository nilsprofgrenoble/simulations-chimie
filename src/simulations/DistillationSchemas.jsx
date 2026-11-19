// Schémas des cartes « À retenir » de la simulation 41 (distillation simple et fractionnée). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#6d28d9';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Axes = ({ y0 = 140, haut = 16 }) => <g><line x1="30" y1={y0} x2="292" y2={y0} stroke={GRIS} strokeWidth="1.5"/><line x1="30" y1={y0} x2="30" y2={haut} stroke={GRIS} strokeWidth="1.5"/>
  <T x={36} y={haut + 2} c={GRIS}>T ↑</T><T x={292} y={y0 + 16} a="end" c={GRIS}>x (éthanol) →</T></g>;

export const SchemaMontage = () => (
  <Svg h={176} aria="Montage de distillation : un ballon chauffé, une colonne à plateaux surmontée d'un thermomètre de tête, un condenseur incliné et un récipient qui recueille le distillat">
    <circle cx="52" cy="118" r="28" fill="#dbeafe" stroke={GRIS} strokeWidth="2.5"/>
    <rect x="42" y="36" width="20" height="56" fill="#fff" stroke={GRIS} strokeWidth="2.5"/>
    <path d="M42 50 H62 M42 64 H62 M42 78 H62" stroke={VIOLET} strokeWidth="2"/>
    <path d="M52 36 V18" stroke={ENCRE} strokeWidth="2.5"/><circle cx="52" cy="16" r="4" fill={ROUGE}/><T x={62} y={20} c={ROUGE} w={700}>T tête</T>
    <path d="M62 40 H104 L214 92" fill="none" stroke={GRIS} strokeWidth="12"/><path d="M62 40 H104 L214 92" fill="none" stroke="#bfdbfe" strokeWidth="7"/>
    <path d="M222 100 V116" stroke={GRIS} strokeWidth="2.5"/><path d="M200 116 L244 116 L252 156 L192 156 Z" fill="#fecaca" stroke={GRIS} strokeWidth="2.5"/>
    <T x={52} y={168} a="middle" c={BLEU} w={700}>ballon</T><T x={72} y={66} c={VIOLET} w={700}>plateaux</T>
    <T x={150} y={50} c={BLEU} w={700}>condenseur</T><T x={222} y={172} a="middle" c={ROUGE} w={700}>distillat</T>
  </Svg>);

export const SchemaMassique = () => (
  <Svg h={150} aria="Pour un mélange à 10 pour cent de molécules d'éthanol, la fraction molaire vaut 0,10 mais l'éthanol étant plus lourd que l'eau, la fraction massique vaut environ 0,22">
    <T x={6} y={22} c={BLEU} w={700}>x : on compte les molécules</T>
    <rect x="6" y="30" width="288" height="26" fill="#dbeafe" stroke={GRIS} strokeWidth="1.5"/><rect x="6" y="30" width="29" height="26" fill="#fca5a5" stroke={ROUGE} strokeWidth="2"/>
    <T x={42} y={48} c={ROUGE} w={700}>x = 0,10</T>
    <T x={6} y={88} c={ORANGE} w={700}>w : on compte les masses</T>
    <rect x="6" y="96" width="288" height="26" fill="#dbeafe" stroke={GRIS} strokeWidth="1.5"/><rect x="6" y="96" width="63" height="26" fill="#fca5a5" stroke={ROUGE} strokeWidth="2"/>
    <T x={76} y={114} c={ROUGE} w={700}>w ≈ 0,22</T>
    <T x={150} y={142} a="middle" c={GRIS}>éthanol plus lourd que l’eau : w &gt; x</T>
  </Svg>);

const bulle = "M 40 24 Q 50 80 100 98 T 280 120", rosee = "M 40 24 Q 90 56 150 84 T 280 120";
export const SchemaDiagramme = () => (
  <Svg h={176} aria="Diagramme température en fonction de la composition : la courbe d'ébullition, à gauche, donne la température du liquide ; à la même température, on lit à l'horizontale la composition de la vapeur sur la courbe de rosée, à droite, plus riche en éthanol">
    <Axes y0={140}/>
    <path d={bulle} fill="none" stroke={BLEU} strokeWidth="3"/><path d={rosee} fill="none" stroke={ROUGE} strokeWidth="3"/>
    <line x1="52" y1="60" x2="118" y2="60" stroke={ENCRE} strokeWidth="2" strokeDasharray="5 3"/>
    <circle cx="52" cy="60" r="5.5" fill={BLEU}/><circle cx="118" cy="60" r="5.5" fill={ROUGE}/>
    <T x={44} y={52} a="end" c={BLEU} w={700}>x</T><T x={126} y={52} c={ROUGE} w={700}>y</T>
    <T x={40} y={130} c={BLEU} w={700}>ébullition</T><T x={150} y={76} c={ROUGE} w={700}>rosée</T>
    <T x={150} y={172} a="middle" c={GRIS}>y est à droite de x : vapeur plus riche</T>
  </Svg>);

export const SchemaSimple = () => (
  <Svg h={160} aria="Au fil d'une distillation simple, la température du ballon augmente et la teneur en éthanol du distillat diminue, en fonction de la fraction de matière distillée">
    <T x={72} y={16} a="middle" c={ORANGE} w={700}>ballon : T monte</T><T x={226} y={16} a="middle" c={BLEU} w={700}>distillat : éthanol baisse</T>
    <line x1="14" y1="118" x2="130" y2="118" stroke={GRIS} strokeWidth="1.5"/><line x1="14" y1="118" x2="14" y2="28" stroke={GRIS} strokeWidth="1.5"/>
    <path d="M14 100 Q70 94 126 36" fill="none" stroke={ORANGE} strokeWidth="3.5"/>
    <line x1="166" y1="118" x2="288" y2="118" stroke={GRIS} strokeWidth="1.5"/><line x1="166" y1="118" x2="166" y2="28" stroke={GRIS} strokeWidth="1.5"/>
    <path d="M166 36 Q222 76 284 106" fill="none" stroke={BLEU} strokeWidth="3.5"/>
    <T x={72} y={138} a="middle" c={GRIS}>fraction distillée →</T><T x={226} y={138} a="middle" c={GRIS}>fraction distillée →</T>
    <T x={150} y={156} a="middle" c={ROUGE} w={700}>jamais d’éthanol pur</T>
  </Svg>);

export const SchemaEscalier = () => (
  <Svg h={176} aria="Distillation fractionnée : chaque plateau est une marche de l'escalier entre la courbe d'ébullition et la courbe de rosée ; l'escalier s'arrête à l'azéotrope, point où les deux courbes se touchent, et la vapeur n'y est plus enrichie">
    <Axes y0={140}/>
    <path d="M 40 24 Q 56 70 110 94 T 232 118 L 280 108" fill="none" stroke={BLEU} strokeWidth="3"/>
    <path d="M 40 24 Q 90 56 150 82 T 232 118 L 280 108" fill="none" stroke={ROUGE} strokeWidth="3"/>
    <polyline points="56,62 104,62 104,96 176,96 176,110 214,110 214,116" fill="none" stroke={ENCRE} strokeWidth="2.2"/>
    <circle cx="232" cy="118" r="5.5" fill={VERT}/><T x={292} y={92} a="end" c={VERT} w={700}>azéotrope</T>
    <T x={150} y={172} a="middle" c={GRIS}>1 marche = 1 plateau ; arrêt à l’azéotrope</T>
  </Svg>);

export const SchemaTete = () => (
  <Svg h={150} aria="Contrôle du distillat : le thermomètre en tête de colonne indique la température de la vapeur ; plus elle est haute, plus la vapeur est diluée en éthanol, plus elle est basse, plus la vapeur est riche">
    <rect x="30" y="46" width="30" height="92" fill="#fff" stroke={GRIS} strokeWidth="2.5"/><path d="M30 68 H60 M30 90 H60 M30 112 H60" stroke={VIOLET} strokeWidth="2"/>
    <path d="M45 46 V22" stroke={ENCRE} strokeWidth="2.5"/><circle cx="45" cy="19" r="5" fill={ROUGE}/>
    <T x={58} y={24} c={ROUGE} w={700}>T tête</T>
    <T x={100} y={62} c={ROUGE} w={700}>T tête haute :</T><T x={100} y={80} c={ROUGE}>distillat trop dilué</T>
    <T x={100} y={112} c={VERT} w={700}>T tête basse :</T><T x={100} y={130} c={VERT}>distillat plus riche</T>
  </Svg>);
