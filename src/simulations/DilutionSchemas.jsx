// Schémas des cartes « À retenir » de la simulation 62 (dilution). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#7b2d8e';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const I = ({ b, i }) => <>{b}<tspan fontSize="9.5" dy="3">{i}</tspan><tspan dy="-3">{' '}</tspan></>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.4"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const Fiole = ({ x, y, o = 0.3 }) => <path d={`M ${x - 10} ${y} L ${x - 10} ${y + 38} L ${x - 38} ${y + 86} Q ${x - 42} ${y + 104} ${x - 22} ${y + 104} L ${x + 22} ${y + 104} Q ${x + 42} ${y + 104} ${x + 38} ${y + 86} L ${x + 10} ${y + 38} L ${x + 10} ${y} Z`} fill={VIOLET} fillOpacity={o} stroke={GRIS} strokeWidth="2.2"/>;

export const FDiluer = () => (
  <Svg h={168} aria="Dilution : on prélève 10 millilitres de solution mère à 0,40 gramme par litre, on les verse dans une fiole jaugée de 100 millilitres, puis on complète avec de l'eau distillée jusqu'au trait de jauge ; la solution fille est à 0,040 gramme par litre ; la masse de soluté est la même avant et après">
    <rect x="18" y="44" width="56" height="70" rx="4" fill={VIOLET} fillOpacity="0.85" stroke={GRIS} strokeWidth="2.2"/>
    <T x={46} y={32} a="middle" c={VIOLET} w={800}>mère</T><T x={46} y={132} a="middle">0,40 g/L</T><T x={46} y={149} a="middle" c={ORANGE} w={700}>10 mL</T>
    <Fleche x1={84} y1={80} x2={140} y2={80} c={ORANGE}/><T x={112} y={70} a="middle" c={ORANGE} w={700}>+ eau</T>
    <Fiole x={210} y={26}/>
    <Lg x1={196} y1={44} x2={224} y2={44} c={ROUGE}/><T x={230} y={48} c={ROUGE}>trait</T>
    <T x={210} y={20} a="middle" c={VIOLET} w={800}>fille</T><T x={210} y={146} a="middle">100 mL</T><T x={210} y={163} a="middle" c={VERT} w={700}>0,040 g/L</T>
    <T x={84} y={106} c={GRIS}>même masse</T><T x={84} y={122} c={GRIS}>de soluté</T>
  </Svg>);

export const FFacteur = () => (
  <Svg h={170} aria="Facteur de dilution : F est égal à la concentration de la mère divisée par celle de la fille, ou au volume final divisé par le volume prélevé ; exemple : 4 millilitres complétés à 100 millilitres donnent F égal à 25, la concentration est divisée par 25">
    <rect x="30" y="14" width="240" height="30" rx="6" fill="#eef6ff" stroke={BLEU} strokeWidth="2"/>
    <T x={150} y={34} a="middle" c={BLEU} w={800}><I b="F = t" i="m"/> ÷ <I b="t" i="f"/> = <I b="V" i="f"/> ÷ <I b="V" i="m"/></T>
    <T x={150} y={66} a="middle" c={GRIS}>exemple : 4 mL complétés à 100 mL</T>
    <rect x="30" y="78" width="104" height="26" rx="5" fill={VIOLET} fillOpacity="0.85"/><T x={82} y={96} a="middle" c="#fff" w={700}>mère</T>
    <rect x="30" y="112" width="4" height="26" rx="2" fill={VIOLET} fillOpacity="0.3"/><rect x="30" y="112" width="104" height="26" rx="5" fill={VIOLET} fillOpacity="0.22" stroke={VIOLET} strokeWidth="1.5"/><T x={82} y={130} a="middle" c={VIOLET} w={700}>fille</T>
    <Fleche x1={150} y1={91} x2={196} y2={91} c={ORANGE}/><T x={236} y={96} a="middle" c={ORANGE} w={800}>÷ 25</T>
    <Fleche x1={150} y1={125} x2={196} y2={125} c={ORANGE}/><T x={236} y={130} a="middle" c={ORANGE} w={800}>÷ 25</T>
    <T x={150} y={160} a="middle" c={VERT} w={700}>« diluer 25 fois » : F = 25, sans unité</T>
  </Svg>);

export const FMethodeV = () => (
  <Svg h={170} aria="Méthode pour trouver le volume à prélever : d'abord le facteur de dilution F égal à t m divisé par t f, puis le volume à prélever V m égal à V f divisé par F ; exemple : 100 millilitres à 0,016 gramme par litre donnent F égal à 25 et V m égal à 4,0 millilitres">
    <circle cx="20" cy="22" r="11" fill={BLEU}/><T x={20} y={26.5} a="middle" c="#fff" w={800}>1</T>
    <T x={40} y={27} c={BLEU} w={800}><I b="F = t" i="m"/> ÷ <I b="t" i="f"/></T>
    <T x={40} y={46} c={GRIS}>0,40 ÷ 0,016 = 25</T>
    <Lg x1={20} y1={34} x2={20} y2={66} c={GRIS} w={1.6}/>
    <circle cx="20" cy="78" r="11" fill={ORANGE}/><T x={20} y={82.5} a="middle" c="#fff" w={800}>2</T>
    <T x={40} y={83} c={ORANGE} w={800}><I b="V" i="m"/> = <I b="V" i="f"/> ÷ F</T>
    <T x={40} y={102} c={GRIS}>100 ÷ 25 = 4,0 mL</T>
    <rect x="14" y="122" width="272" height="38" rx="6" fill="#ecfdf5" stroke={VERT} strokeWidth="1.5"/>
    <T x={150} y={138} a="middle" c={VERT} w={700}>plus on dilue, moins on prélève</T><T x={150} y={154} a="middle" c={GRIS}>de solution mère</T>
  </Svg>);

export const FVerrerie = () => (
  <Svg h={190} aria="La verrerie : la pipette jaugée avec propipette prélève le volume de solution mère avec précision ; la fiole jaugée permet de compléter avec l'eau distillée jusqu'au trait de jauge ; un bécher n'est gradué qu'à quelques pour cent près et ne sert pas à mesurer précisément">
    <rect x="46" y="20" width="10" height="64" fill="#e0f2fe" stroke={GRIS} strokeWidth="2"/><ellipse cx="51" cy="52" rx="10" ry="12" fill="#e0f2fe" stroke={GRIS} strokeWidth="2"/>
    <polygon points="46,84 56,84 51,100" fill="#e0f2fe" stroke={GRIS} strokeWidth="2"/><Lg x1={44} y1={30} x2={58} y2={30} c={ROUGE}/>
    <T x={51} y={16} a="middle" c={BLEU} w={800}>pipette</T>
    <Fiole x={150} y={24} o={0.18}/><Lg x1={136} y1={40} x2={164} y2={40} c={ROUGE}/>
    <T x={150} y={19} a="middle" c={BLEU} w={800}>fiole</T>
    <path d="M 232 36 L 238 100 L 270 100 L 276 36" fill="none" stroke={GRIS} strokeWidth="2.2"/>
    {[52, 68, 84].map(y => <Lg key={y} x1={238} y1={y} x2={246} y2={y} c={GRIS} w={1.4}/>)}
    <T x={254} y={28} a="middle" c={ROUGE} w={800}>bécher</T>
    <T x={51} y={144} a="middle" c={VERT} w={700}>prélever V<tspan fontSize="9.5" dy="3">m</tspan></T>
    <T x={150} y={144} a="middle" c={VERT} w={700}>compléter</T>
    <T x={254} y={144} a="middle" c={ROUGE} w={700}>± quelques %</T>
    <T x={150} y={168} a="middle" c={GRIS}>jaugée = un seul volume, très précis</T><T x={150} y={185} a="middle" c={GRIS}>propipette : jamais à la bouche</T>
  </Svg>);

export const FEchelle = () => {
  const O = [0.08, 0.16, 0.30, 0.50, 0.80];
  const N = ['Sf5', 'Sf4', 'Sf3', 'Sf2', 'Sf1'], V = ['0,004', '0,010', '0,020', '0,040', '0,080'];
  return (
    <Svg h={186} aria="Échelle de teintes : cinq solutions de plus en plus foncées Sf5 à 0,004 gramme par litre jusqu'à Sf1 à 0,080 ; une solution inconnue plus foncée que Sf3 et plus claire que Sf2 a une concentration comprise entre 0,020 et 0,040 gramme par litre">
      {O.map((o, k) => <g key={k}><rect x={14 + k * 56} y={44} width={46} height={50} rx="5" fill={VIOLET} fillOpacity={o} stroke={GRIS} strokeWidth="1.8"/>
        <T x={37 + k * 56} y={38} a="middle" c={BLEU} w={700}>{N[k]}</T><T x={37 + k * 56} y={112} a="middle" c={GRIS}>{V[k]}</T></g>)}
      <T x={150} y={16} a="middle" c={GRIS}>concentration en g/L</T>
      <circle cx={186} cy={134} r="0" fill="none"/>
      <rect x="126" y="126" width="46" height="36" rx="5" fill={VIOLET} fillOpacity="0.40" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="5 3"/>
      <T x={149} y={149} a="middle" c={ORANGE} w={800}>?</T>
      <T x={18} y={148} c={ORANGE} w={700}>inconnue</T>
      <T x={150} y={180} a="middle" c={VERT} w={700}>0,020 &lt; t &lt; 0,040 g/L</T>
      <Lg x1={149} y1={126} x2={149} y2={118} c={ORANGE} w={2}/>
    </Svg>);
};

export const FBilanD = () => (
  <Svg h={178} aria="Bilan d'une dilution en quatre étapes : calculer F, calculer V m, choisir la verrerie, vérifier que la concentration de la fille est plus faible que celle de la mère et que le volume prélevé est plus petit que le volume final">
    {[['calculer F = tm ÷ tf', BLEU], ['calculer Vm = Vf ÷ F', BLEU], ['choisir la verrerie', ORANGE], ['vérifier : tf < tm et Vm < Vf', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={20 + i * 32} r="11" fill={c}/><T x={16} y={24.5 + i * 32} a="middle" c="#fff" w={800}>{i + 1}</T><T x={36} y={25 + i * 32} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={32 + i * 32} x2={16} y2={40 + i * 32} c={GRIS}/>}</g>))}
    <T x={150} y={156} a="middle" c={GRIS}>on ajoute seulement de l’eau :</T><T x={150} y={173} a="middle" c={GRIS}>la masse de soluté est conservée</T>
  </Svg>);
