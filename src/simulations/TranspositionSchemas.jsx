// Schémas des cartes « À retenir » de la simulation 97 (transposition de carbocation). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.2"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FStabilite = () => (
  <Svg h={182} aria="Stabilité des carbocations : primaire avec un groupe alkyle, secondaire avec deux, tertiaire avec trois ; plus il y a de groupes alkyle donneurs d'électrons, plus le carbocation est stable ; dans la simulation, le secondaire est à 60 et le tertiaire à 50 kilojoules par mole">
    {[[48, 'R–CH₂⁺', 'primaire', '1 alkyle'], [150, 'R₂CH⁺', 'secondaire', '2 alkyles'], [252, 'R₃C⁺', 'tertiaire', '3 alkyles']].map(([x, f, n, k], i) => (
      <g key={n}><T x={x} y={34} a="middle" c={i === 2 ? VERT : ENCRE} w={800}>{f}</T><T x={x} y={54} a="middle" c={ENCRE} w={700}>{n}</T><T x={x} y={72} a="middle" c={GRIS}>{k}</T></g>))}
    <Fleche x1={24} y1={92} x2={276} y2={92} c={VERT}/><T x={150} y={112} a="middle" c={VERT} w={700}>de plus en plus stable</T>
    <T x={150} y={138} a="middle" c={ENCRE}>alkyles donneurs d’électrons :</T><T x={150} y={156} a="middle" c={ENCRE}>effet inductif et hyperconjugaison</T>
    <T x={150} y={172} a="middle" c={GRIS}>ici : 60 → 50 kJ·mol⁻¹</T>
  </Svg>);

export const FMigration = () => (
  <Svg h={168} aria="Migration 1,2 d'un hydrogène : une flèche courbe part du doublet de la liaison C3–H et pointe vers le carbone positif C2 ; l'hydrogène se lie à C2, la charge positive passe sur C3 qui devient tertiaire">
    <T x={14} y={78} c={ENCRE} w={700}>CH₃</T><Lg x1={44} y1={74} x2={58} y2={74}/><T x={72} y={78} a="middle" c={ROUGE} w={800}>C⁺</T><T x={72} y={106} a="middle" c={ENCRE} w={700}>H</T><Lg x1={72} y1={84} x2={72} y2={94}/>
    <Lg x1={84} y1={74} x2={150} y2={74}/><T x={165} y={78} a="middle" c={ENCRE} w={800}>C</T>
    <T x={165} y={34} a="middle" c={ORANGE} w={800}>H</T><Lg x1={165} y1={40} x2={165} y2={64} c={ORANGE}/>
    <Lg x1={177} y1={74} x2={192} y2={74}/><T x={196} y={78} c={ENCRE} w={700}>CH₃</T>
    <Lg x1={165} y1={86} x2={165} y2={96}/><T x={165} y={110} a="middle" c={ENCRE} w={700}>CH₃</T>
    <path d="M163,48 Q118,26 85,58" fill="none" stroke={ORANGE} strokeWidth="2.4"/><polygon points="80,63 82,52 90,58" fill={ORANGE}/>
    <T x={150} y={134} a="middle" c={ORANGE} w={700}>H migre avec le doublet de C3–H</T>
    <T x={150} y={154} a="middle" c={ROUGE} w={700}>la charge + passe de C2 à C3</T>
  </Svg>);

export const FTypes = () => (
  <Svg h={178} aria="Quatre types d'étapes : addition, A plus B donne A–B ; substitution, un groupe en remplace un autre ; élimination, une liaison pi se forme et deux groupes partent ; transposition, un groupe migre vers l'atome voisin, mêmes atomes mais enchaînement différent">
    {[['addition', BLEU, 'A + B → A–B'], ['substitution', BLEU, 'A–X + Y → A–Y + X'], ['élimination', BLEU, 'H–C–C–X → C=C + HX'], ['transposition', ORANGE, 'H migre : C⁺–C–H → H–C–C⁺']].map(([n, c, e], i) => (
      <g key={n}><rect x="6" y={8 + i * 30} width="96" height="24" rx="6" fill="#fff" stroke={c} strokeWidth="2"/><T x={54} y={25 + i * 30} a="middle" c={c} w={700}>{n}</T>
        <T x={110} y={25 + i * 30} c={ENCRE}>{e}</T></g>))}
    <T x={150} y={150} a="middle" c={ORANGE} w={700}>transposition : mêmes atomes,</T><T x={150} y={166} a="middle" c={ORANGE} w={700}>enchaînement différent</T>
  </Svg>);

export const FProfil = () => (
  <Svg h={186} aria="Profil d'énergie : à partir du carbocation secondaire à 60, l'état de transition de la migration est à 75, puis le carbocation tertiaire est à 50 kilojoules par mole ; la barrière de migration vaut 15, très inférieure à celle de formation du carbocation, voisine de 100">
    <T x={8} y={14} c={GRIS} w={700}>énergie (kJ·mol⁻¹)</T>
    <path d="M14,150 L34,150 Q62,-40 90,86 L108,86 Q134,48 160,97 L184,97" fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round"/>
    <Lg x1={14} y1={156} x2={14} y2={26} c={GRIS} w={1.5}/>
    <T x={24} y={168} a="middle" c={GRIS}>réactifs</T>
    <T x={84} y={42} c={GRIS}>ET ≈ 100</T>
    <T x={99} y={106} a="middle" c={ENCRE} w={700}>secondaire 60</T>
    <T x={134} y={58} a="middle" c={ORANGE} w={700}>ET 75</T>
    <T x={172} y={116} a="middle" c={VERT} w={700}>tertiaire 50</T>
    <Lg x1={110} y1={86} x2={236} y2={86} c={GRIS} w={1.2} d="4 3"/><Lg x1={134} y1={70} x2={236} y2={70} c={GRIS} w={1.2} d="4 3"/>
    <Lg x1={228} y1={72} x2={228} y2={84} c={ORANGE} w={2.4}/><T x={242} y={82} c={ORANGE} w={800}>Eₐ = 15</T>
    <T x={150} y={146} a="middle" c={GRIS}>migration : barrière faible,</T><T x={150} y={164} a="middle" c={GRIS}>donc transposition très rapide</T>
  </Svg>);

export const FDeuxVoies = () => (
  <Svg h={174} aria="Deux produits à partir du 3-méthylbut-1-ène et de HBr : sans transposition, le 2-bromo-3-méthylbutane, environ 40 pour cent ; avec transposition, le 2-bromo-2-méthylbutane, majoritaire, environ 60 pour cent ; ordres de grandeur expérimentaux">
    <T x={10} y={18} c={BLEU} w={700}>sans transposition</T><T x={10} y={36} c={GRIS}>2-bromo-3-méthylbutane</T>
    <rect x="10" y="44" width="96" height="22" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/><T x={114} y={61} c={BLEU} w={800}>≈ 40 %</T>
    <T x={10} y={92} c={ORANGE} w={700}>avec transposition</T><T x={10} y={110} c={GRIS}>2-bromo-2-méthylbutane</T>
    <rect x="10" y="118" width="144" height="22" fill="#fed7aa" stroke={ORANGE} strokeWidth="2"/><T x={162} y={135} c={ORANGE} w={800}>≈ 60 % : majoritaire</T>
    <T x={150} y={166} a="middle" c={GRIS}>ordres de grandeur expérimentaux</T>
  </Svg>);

export const FMethodeT = () => (
  <Svg h={168} aria="La démarche en quatre temps : écrire le carbocation et le classer ; regarder le voisin porteur d'un H ou d'un CH3 ; tracer la flèche courbe de la liaison qui migre vers C+ ; placer Br- sur chaque carbocation">
    {[['écrire le carbocation et le classer', BLEU], ['voisin portant un H ou un CH₃ ?', BLEU], ['flèche : liaison qui migre → C⁺', ORANGE], ['Br⁻ sur chaque carbocation', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={20 + i * 30} r="10" fill={c}/><T x={16} y={24.5 + i * 30} a="middle" c="#fff" w={800}>{i + 1}</T><T x={34} y={24.5 + i * 30} c={ENCRE} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={31 + i * 30} x2={16} y2={39 + i * 30} c={GRIS}/>}</g>))}
    <T x={150} y={154} a="middle" c={GRIS}>migration rapide : Eₐ ≈ 15 à 20 kJ·mol⁻¹</T>
  </Svg>);
