// Schémas des cartes « À retenir » de la simulation 72 (caractéristique d'une pile). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.4 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Axes = ({ y0 }) => <g><line x1="40" y1={y0} x2="292" y2={y0} stroke={GRIS} strokeWidth="1.5"/><line x1="40" y1={y0} x2="40" y2="20" stroke={GRIS} strokeWidth="1.5"/><T x={46} y={18} c={GRIS}>U ↑</T><T x={292} y={y0 + 18} a="end" c={GRIS}>I →</T></g>;

export const SchemaCarac = () => (
  <Svg h={196} aria="Caractéristique U en fonction de I : une pile réelle donne une droite décroissante qui part de la tension à vide U0 ; une source idéale donne une droite horizontale">
    <Axes y0={150}/>
    <line x1="40" y1="44" x2="250" y2="44" stroke={VERT} strokeWidth="3" strokeDasharray="6 4"/><T x={250} y={36} a="end" c={VERT} w={700}>source idéale</T>
    <line x1="40" y1="44" x2="250" y2="130" stroke={ORANGE} strokeWidth="3.5"/><T x={50} y={112} c={ORANGE} w={700}>pile réelle</T>
    <circle cx="40" cy="44" r="5" fill={BLEU}/><T x={4} y={48} c={BLEU} w={800}>U₀</T>
    <T x={8} y={186} c={ROUGE} w={700}>plus la pile débite, plus U baisse</T>
  </Svg>);

export const SchemaPente = () => (
  <Svg h={170} aria="Régression linéaire de U en fonction de I : l'ordonnée à l'origine est U0 et la pente, négative, vaut moins r">
    <Axes y0={130}/>
    <line x1="40" y1="30" x2="230" y2="100" stroke={ORANGE} strokeWidth="3.5"/>
    <circle cx="40" cy="30" r="5" fill={BLEU}/><T x={4} y={34} c={BLEU} w={800}>U₀</T>
    <polyline points="90,48 190,48 190,85" fill="none" stroke={GRIS} strokeWidth="2" strokeDasharray="4 3"/>
    <T x={140} y={40} a="middle" c={GRIS} w={700}>ΔI</T><T x={198} y={70} c={GRIS} w={700}>ΔU</T>
    <T x={8} y={160} w={700}>pente = ΔU ÷ ΔI = −r</T>
    <T x={150} y={118} c={BLEU}>b = U₀</T>
  </Svg>);

export const SchemaModele = () => (
  <Svg h={156} aria="Modèle d'une pile réelle : une source idéale de tension U0 en série avec la résistance interne r, branchée sur un résistor R avec le courant I">
    <rect x="4" y="8" width="172" height="58" rx="8" fill="none" stroke={GRIS} strokeDasharray="4 3"/><T x={90} y={82} a="middle" c={GRIS}>pile réelle</T>
    <rect x="12" y="20" width="60" height="38" rx="6" fill="#e8f1fa" stroke={BLEU} strokeWidth="2"/><T x={42} y={44} a="middle" c={BLEU} w={800}>U₀</T>
    <rect x="108" y="20" width="60" height="38" rx="6" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={138} y={44} a="middle" c={ORANGE} w={800}>r</T>
    <rect x="212" y="20" width="60" height="38" rx="6" fill="#dcfce7" stroke={VERT} strokeWidth="2"/><T x={242} y={44} a="middle" c={VERT} w={800}>R</T>
    <line x1="72" y1="39" x2="108" y2="39" stroke={ENCRE} strokeWidth="2"/><line x1="168" y1="39" x2="212" y2="39" stroke={ENCRE} strokeWidth="2"/>
    <polyline points="242,58 242,104 42,104 42,58" fill="none" stroke={ENCRE} strokeWidth="2"/>
    <Arr x1={176} y1={39} x2={204} y2={39} c={ENCRE}/><T x={190} y={32} a="middle" w={700}>I</T>
    <T x={8} y={128} w={700}>U = U₀ − r × I</T><T x={8} y={148} c={GRIS}>et U = R × I aux bornes du résistor</T>
  </Svg>);

export const SchemaJouleP = () => (
  <Svg h={140} aria="Bilan de puissance d'une pile : la source débite U0 fois I, dont U fois I est fourni au circuit et r fois I au carré est perdu en chaleur dans la pile">
    <line x1="8" y1="30" x2="268" y2="30" stroke={BLEU} strokeWidth="2.5"/><line x1="8" y1="24" x2="8" y2="36" stroke={BLEU} strokeWidth="2.5"/><line x1="268" y1="24" x2="268" y2="36" stroke={BLEU} strokeWidth="2.5"/>
    <T x={138} y={20} a="middle" c={BLEU} w={700}>U₀ × I : débité par la pile</T>
    <rect x="8" y="42" width="220" height="36" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/><T x={118} y={65} a="middle" c={VERT} w={800}>U × I</T>
    <rect x="228" y="42" width="40" height="36" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/>
    <T x={118} y={96} a="middle" c={VERT}>fourni au circuit</T><T x={268} y={96} a="end" c={ROUGE} w={700}>r × I² perdu</T>
    <T x={8} y={128} w={700}>rendement η = U ÷ U₀</T>
  </Svg>);

export const SchemaUsee = () => (
  <Svg h={184} aria="Pile neuve et pile usée de même tension à vide : la caractéristique de la pile neuve est presque horizontale, celle de la pile usée descend fortement, donc sa tension s'effondre en charge">
    <Axes y0={130}/>
    <T x={120} y={18} c={GRIS}>même U₀ à vide</T>
    <line x1="40" y1="40" x2="250" y2="48" stroke={VERT} strokeWidth="3.5"/><T x={256} y={52} c={VERT} w={700}>neuve</T>
    <line x1="40" y1="40" x2="250" y2="118" stroke={ROUGE} strokeWidth="3.5"/><T x={256} y={122} c={ROUGE} w={700}>usée</T>
    <circle cx="40" cy="40" r="5" fill={BLEU}/><T x={4} y={44} c={BLEU} w={800}>U₀</T>
    <T x={8} y={172} c={ROUGE} w={700}>usée : r grand, U s’effondre en charge</T>
  </Svg>);
