// Schémas des cartes « À retenir » de la simulation 71 (puissance, effet Joule et rendement). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Boite = ({ x, y, w, h, c = BLEU, f = '#e8f1fa' }) => <rect x={x} y={y} width={w} height={h} rx="8" fill={f} stroke={c} strokeWidth="2"/>;

export const SchemaChaine = () => (
  <Svg h={150} aria="Chaîne énergétique : la pile, générateur, cède un travail électrique à la lampe, récepteur, qui le convertit en lumière utile et en chaleur perdue">
    <Boite x={8} y={22} w={72} h={42}/><T x={44} y={48} a="middle" c={BLEU} w={700}>pile</T><T x={44} y={82} a="middle" c={GRIS}>générateur</T>
    <Arr x1={82} y1={43} x2={130} y2={43} c={ORANGE}/><T x={106} y={34} a="middle" c={ORANGE} w={700}>W élec</T>
    <Boite x={132} y={22} w={72} h={42} c={ORANGE} f="#ffedd5"/><T x={168} y={48} a="middle" c={ORANGE} w={700}>lampe</T><T x={168} y={82} a="middle" c={GRIS}>récepteur</T>
    <Arr x1={206} y1={34} x2={256} y2={20} c={VERT}/><T x={296} y={16} a="end" c={VERT} w={700}>lumière</T>
    <Arr x1={206} y1={54} x2={256} y2={74} c={ROUGE}/><T x={296} y={94} a="end" c={ROUGE} w={700}>chaleur</T>
    <T x={8} y={124} c={ROUGE} w={700}>une partie est toujours perdue</T><T x={8} y={142} c={ROUGE} w={700}>en chaleur</T>
  </Svg>);

export const SchemaUI = () => (
  <Svg h={176} aria="Un dipôle soumis à la tension U et traversé par le courant I : la puissance est U fois I et l'énergie U fois I fois la durée">
    <Arr x1={14} y1={62} x2={98} y2={62} c={BLEU}/><T x={52} y={52} a="middle" c={BLEU} w={700}>I</T>
    <Boite x={100} y={36} w={90} h={52}/><T x={145} y={67} a="middle" c={BLEU} w={700}>dipôle</T>
    <line x1="190" y1="62" x2="214" y2="62" stroke={BLEU} strokeWidth="2.6"/>
    <line x1="150" y1="36" x2="150" y2="22" stroke={GRIS} strokeDasharray="3 3"/><line x1="150" y1="88" x2="150" y2="104" stroke={GRIS} strokeDasharray="3 3"/>
    <Arr x1={240} y1={100} x2={240} y2={24} c={ORANGE}/><T x={250} y={66} c={ORANGE} w={700}>U</T>
    <line x1="150" y1="24" x2="236" y2="24" stroke={GRIS} strokeDasharray="3 3"/><line x1="150" y1="100" x2="236" y2="100" stroke={GRIS} strokeDasharray="3 3"/>
    <T x={8} y={128} w={700}>P = U × I</T><T x={150} y={128} w={700}>W = U × I × Δt</T>
    <T x={8} y={152} c={GRIS}>watt (W) = volt (V) × ampère (A)</T><T x={8} y={170} c={GRIS}>1 kWh = 3,6 × 10⁶ J</T>
  </Svg>);

export const SchemaJoule = () => (
  <Svg h={156} aria="Effet Joule : un conducteur ohmique traversé par un courant I dissipe de la chaleur ; doubler I multiplie la puissance dissipée par quatre">
    <polyline points="8,40 24,40 30,24 42,56 54,24 66,56 78,24 84,40 104,40" fill="none" stroke={BLEU} strokeWidth="3"/>
    <Arr x1={12} y1={18} x2={60} y2={18} c={BLEU}/><T x={36} y={12} a="middle" c={BLEU} w={700}>I</T>
    <Arr x1={56} y1={62} x2={56} y2={96} c={ROUGE}/><T x={66} y={90} c={ROUGE} w={700}>chaleur</T>
    <line x1="150" y1="104" x2="290" y2="104" stroke={GRIS} strokeWidth="1.5"/>
    <rect x="168" y="84" width="40" height="20" fill={BLEU} opacity="0.85"/><rect x="232" y="24" width="40" height="80" fill={ORANGE} opacity="0.85"/>
    <T x={188} y={78} a="middle" c={BLEU} w={700}>P</T><T x={252} y={18} a="middle" c={ORANGE} w={700}>P × 4</T>
    <T x={188} y={122} a="middle" w={700}>I</T><T x={252} y={122} a="middle" w={700}>2 I</T>
    <T x={8} y={146} c={ROUGE} w={700}>I double : P est multipliée par 4</T>
  </Svg>);

export const SchemaRendement = () => (
  <Svg h={156} aria="Rendement d'un chargeur : sur 10 watts consommés, 8 watts sont utiles et 2 watts sont perdus en chaleur, donc le rendement est 0,80">
    <Boite x={8} y={30} w={62} h={60}/><T x={39} y={56} a="middle" c={BLEU} w={800}>10 W</T><T x={39} y={74} a="middle" c={BLEU}>reçus</T>
    <rect x="70" y="30" width="120" height="48" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/><T x={130} y={59} a="middle" c={VERT} w={800}>utile : 8,0 W</T>
    <rect x="70" y="78" width="120" height="12" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/><T x={198} y={88} c={ROUGE} w={700}>pertes 2,0 W</T>
    <T x={8} y={122} w={700}>η = utile ÷ consommée = 0,80</T><T x={8} y={144} c={GRIS}>sans unité, toujours inférieur ou égal à 1</T>
  </Svg>);

export const SchemaCalo = () => (
  <Svg h={160} aria="Bilan énergétique d'une résistance chauffante dans l'eau : l'énergie électrique reçue augmente avec le temps, l'énergie reçue par l'eau reste en dessous, l'écart représente les pertes">
    <line x1="30" y1="110" x2="292" y2="110" stroke={GRIS} strokeWidth="1.5"/><line x1="30" y1="110" x2="30" y2="20" stroke={GRIS} strokeWidth="1.5"/>
    <polygon points="30,110 270,30 270,62" fill="#fecaca" opacity="0.7"/>
    <line x1="30" y1="110" x2="270" y2="30" stroke={BLEU} strokeWidth="3"/><line x1="30" y1="110" x2="270" y2="62" stroke={ORANGE} strokeWidth="3"/>
    <T x={36} y={22} c={GRIS}>énergie ↑</T><T x={292} y={128} a="end" c={GRIS}>t →</T>
    <T x={50} y={50} c={BLEU} w={700}>W élec reçue</T><T x={150} y={104} c={ORANGE} w={700}>Q reçue par l’eau</T><T x={204} y={66} c={ROUGE} w={700}>pertes</T>
    <T x={8} y={152} w={700}>η = Q ÷ W élec, inférieur à 1</T>
  </Svg>);

export const SchemaBilan = () => {
  const B = [[8, 8, 'puissance', 'P = U × I', BLEU], [156, 8, 'énergie', 'W = P × Δt', ORANGE], [8, 66, 'effet Joule', 'Q = R × I² × Δt', ROUGE], [156, 66, 'rendement η', 'utile ÷ consommée', VERT]];
  return (
    <Svg h={158} aria="Quatre relations à retenir : puissance P égale U fois I, énergie W égale P fois Δt, effet Joule Q égale R fois I au carré fois Δt, rendement égal utile divisé par consommée">
      {B.map(([x, y, t, f, c]) => <g key={t}><Boite x={x} y={y} w={136} h={50} c={c} f="#fff"/><T x={x + 68} y={y + 21} a="middle" c={c} w={800}>{t}</T><T x={x + 68} y={y + 40} a="middle">{f}</T></g>)}
      <T x={8} y={136} c={GRIS}>convertir les unités (kW, h, kg, K),</T><T x={8} y={154} c={GRIS}>puis vérifier l’ordre de grandeur</T>
    </Svg>);
};
