// Schémas des cartes « À retenir » de la simulation 96 (addition de Br₂ sur un alcène). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', BRUN = '#9a3412', VIOLET = '#6d28d9';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.4"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const Tube = ({ x, fill, stroke }) => <g><path d={`M ${x} 24 L ${x} 100 Q ${x} 122 ${x + 22} 122 Q ${x + 44} 122 ${x + 44} 100 L ${x + 44} 24`} fill="#f8fafc" stroke={GRIS} strokeWidth="2.4"/><path d={`M ${x + 1.5} 52 L ${x + 1.5} 100 Q ${x + 1.5} 120.5 ${x + 22} 120.5 Q ${x + 42.5} 120.5 ${x + 42.5} 100 L ${x + 42.5} 52 Z`} fill={fill} stroke={stroke} strokeWidth="1"/></g>;

export const FTest = () => (
  <Svg h={198} aria="Test au dibrome : l'eau de dibrome brune reste brune avec un alcane, qui ne contient que des liaisons simples, et se décolore aussitôt avec un alcène, qui contient une double liaison C=C">
    <Tube x={52} fill="#b45309" stroke={BRUN}/><Tube x={204} fill="#e0f2fe" stroke={BLEU}/>
    <T x={74} y={146} a="middle" c={BRUN} w={800}>reste brune</T><T x={226} y={146} a="middle" c={BLEU} w={800}>décolorée</T>
    <T x={74} y={164} a="middle" c={GRIS}>liaisons simples</T><T x={226} y={164} a="middle" c={GRIS}>double liaison C=C</T>
    <T x={150} y={190} a="middle" w={700}>Br₂ est consommé par l’addition</T>
  </Svg>);

const Doublet = () => null;
export const FBromonium = () => (
  <Svg h={178} aria="Première étape : le doublet pi de l'alcène attaque une molécule de dibrome Br₂ ; il se forme un pont à trois chaînons, l'ion bromonium, sur une face de l'alcène, et un ion bromure Br⁻ est libéré">
    <T x={72} y={34} a="middle" c={ORANGE} w={800}>Br–Br</T><Fleche x1={72} y1={42} x2={72} y2={72} c={ORANGE}/>
    <Lg x1={44} y1={92} x2={100} y2={92} c={ENCRE} w={2.6}/><Lg x1={44} y1={99} x2={100} y2={99} c={ENCRE} w={2.6}/><T x={36} y={110} a="middle">C</T><T x={108} y={110} a="middle">C</T>
    <Fleche x1={126} y1={96} x2={168} y2={96} c={GRIS}/>
    <polygon points="190,104 244,104 217,60" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.6"/><T x={217} y={52} a="middle" c={ORANGE} w={800}>Br⁺</T><T x={190} y={122} a="middle">C</T><T x={244} y={122} a="middle">C</T>
    <T x={256} y={78} c={ORANGE} w={800}>Br⁻</T>
    <T x={150} y={150} a="middle" c={BLEU} w={700}>ion bromonium : pont à 3 chaînons</T><T x={150} y={168} a="middle" c={GRIS}>intermédiaire, sur une face de l’alcène</T>
  </Svg>);

export const FAnti = () => (
  <Svg h={212} aria="Seconde étape : l'ion bromure Br⁻ attaque l'un des deux carbones du pont bromonium par la face opposée au pont, comme dans une SN2 ; les deux atomes de brome se retrouvent de part et d'autre du plan : addition anti">
    <Lg x1={70} y1={96} x2={230} y2={96} c={GRIS} w={1.4} d="5 4"/><T x={14} y={92} c={GRIS}>plan</T>
    <polygon points="110,96 190,96 150,54" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.6"/><T x={150} y={44} a="middle" c={ORANGE} w={800}>Br⁺ (pont)</T>
    <T x={110} y={114} a="middle">C</T><T x={190} y={114} a="middle">C</T>
    <Fleche x1={236} y1={162} x2={198} y2={112} c={VERT}/><T x={236} y={178} a="middle" c={VERT} w={800}>Br⁻</T>
    <T x={150} y={202} a="middle" c={VERT} w={700}>Br⁻ attaque par l’arrière : addition anti</T>
  </Svg>);

const Boite = ({ x, y, w, h = 30, f, c, children }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill={f} stroke={c} strokeWidth="1.8"/><T x={x + w / 2} y={y + h / 2 + 4.5} a="middle" c={c} w={800}>{children}</T></g>;

export const FRacemique = () => (
  <Svg h={186} aria="Addition de Br₂ sur le (Z)-but-2-ène : les deux faces d'attaque sont équiprobables et donnent chacune un énantiomère, (2R,3R) et (2S,3S), images l'un de l'autre dans un miroir ; le mélange à proportions égales est un racémique, sans pouvoir rotatoire">
    <Boite x={50} y={10} w={200} f="#f1f5f9" c={GRIS}>(Z)-but-2-ène + Br₂</Boite>
    <Fleche x1={110} y1={44} x2={70} y2={78} c={GRIS}/><Fleche x1={190} y1={44} x2={230} y2={78} c={GRIS}/>
    <Boite x={14} y={82} w={112} f="#e0f2fe" c={BLEU}>(2R,3R)</Boite><Boite x={174} y={82} w={112} f="#fce7f3" c="#be185d">(2S,3S)</Boite>
    <Lg x1={150} y1={74} x2={150} y2={124} c={GRIS} w={1.6} d="4 3"/><T x={150} y={138} a="middle" c={GRIS}>miroir</T>
    <T x={150} y={160} a="middle" c={ORANGE} w={800}>50 % / 50 % : racémique</T><T x={150} y={176} a="middle" c={GRIS}>sans pouvoir rotatoire</T>
  </Svg>);

export const FMeso = () => (
  <Svg h={176} aria="Stéréospécificité de l'addition anti de Br₂ : le (Z)-but-2-ène donne un mélange racémique de (2R,3R) et (2S,3S), alors que le (E)-but-2-ène donne le composé méso (2R,3S), qui possède un plan de symétrie ; chaque stéréoisomère de départ donne un produit différent">
    <Boite x={8} y={16} w={96} f="#f1f5f9" c={GRIS}>(Z)</Boite><Fleche x1={112} y1={31} x2={158} y2={31} c={GRIS}/><Boite x={164} y={16} w={128} f="#e0f2fe" c={BLEU}>racémique</Boite>
    <Boite x={8} y={66} w={96} f="#f1f5f9" c={GRIS}>(E)</Boite><Fleche x1={112} y1={81} x2={158} y2={81} c={GRIS}/><Boite x={164} y={66} w={128} f="#dcfce7" c={VERT}>méso (2R,3S)</Boite>
    <T x={150} y={126} a="middle" w={700}>produits différents</T><T x={150} y={146} a="middle" c={ORANGE} w={800}>réaction stéréospécifique</T><T x={150} y={166} a="middle" c={GRIS}>méso : plan de symétrie, achiral</T>
  </Svg>);

export const FBilanBr = () => {
  const L = [['(Z)-but-2-ène', '2,3-dibromobutane', 'racémique', BLEU, '#e0f2fe'], ['(E)-but-2-ène', '2,3-dibromobutane', 'méso', VERT, '#dcfce7'], ['cyclohexène', '1,2-dibromocyclohexane', 'trans (racémique)', ORANGE, '#ffedd5']];
  return (
    <Svg h={214} aria="Bilan de l'addition anti de Br₂ : le (Z)-but-2-ène donne un 2,3-dibromobutane racémique, le (E)-but-2-ène donne le composé méso, le cyclohexène donne le trans-1,2-dibromocyclohexane racémique">
      <T x={150} y={16} a="middle" c={GRIS} w={700}>alcène + Br₂ → addition anti</T>
      {L.map(([a, p, s, c, f], k) => <g key={a}><rect x="6" y={30 + k * 58} width="108" height="44" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/><T x={60} y={57 + k * 58} a="middle" w={700}>{a}</T>
        <Fleche x1={118} y1={52 + k * 58} x2={138} y2={52 + k * 58} c={GRIS}/><rect x="142" y={30 + k * 58} width="152" height="44" rx="6" fill={f} stroke={c} strokeWidth="1.8"/><T x={218} y={48 + k * 58} a="middle" c={ENCRE}>{p}</T><T x={218} y={65 + k * 58} a="middle" c={c} w={800}>{s}</T></g>)}
      <T x={150} y={208} a="middle" c={GRIS}>pont bromonium, puis Br⁻ par la face opposée</T>
    </Svg>);
};
void Doublet; void VIOLET;
