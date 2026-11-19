// Schémas des cartes « À retenir » de la simulation 25 (titrage en retour). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const GRIS_CLAIR = '#cbd5e1', ORANGE_CLAIR = '#fdba74';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth="2.2"/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
// Barre : une part « réagi » (gris) et une part « restant » (orange)
const Barre = ({ y, reagi, textes = true }) => (
  <g><rect x="20" y={y} width={reagi} height="26" fill={GRIS_CLAIR}/><rect x={20 + reagi} y={y} width={260 - reagi} height="26" fill={ORANGE_CLAIR}/>
    <rect x="20" y={y} width="260" height="26" fill="none" stroke={GRIS} strokeWidth="2"/>
    {textes && <><T x={20 + reagi / 2} y={y + 18} a="middle" c={GRIS} w={700}>réagi</T><T x={20 + reagi + (260 - reagi) / 2} y={y + 18} a="middle" c="#7c2d12" w={700}>restant</T></>}</g>);

export const FPrincipeRetour = () => (
  <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Principe du titrage en retour : le diiode ajouté en excès, quantité n 1, se partage entre une partie qui a réagi avec la vitamine C et une partie restante, titrée ensuite par le thiosulfate ; plus il y a de vitamine C, plus la partie restante est petite">
    <T x={150} y={14} a="middle" c={ENCRE} w={700}>n₁ : diiode ajouté en excès</T>
    <line x1="20" y1="24" x2="280" y2="24" stroke={GRIS} strokeWidth="1.5"/><line x1="20" y1="19" x2="20" y2="29" stroke={GRIS}/><line x1="280" y1="19" x2="280" y2="29" stroke={GRIS}/>
    <Barre y={34} reagi={170}/><T x={150} y={78} a="middle" c={GRIS}>beaucoup de vitamine C : peu de I₂ restant</T>
    <Barre y={92} reagi={70}/><T x={150} y={136} a="middle" c={GRIS}>peu de vitamine C : beaucoup de I₂ restant</T>
    <T x={150} y={164} a="middle" c={VERT} w={700}>n(vit. C) = n₁ − n(I₂)restant</T>
  </svg>);

export const FLimitant = () => (
  <Svg h={170} aria="Le réactif limitant est celui dont la quantité est la plus petite quand tous les coefficients valent 1 : la vitamine C, quantité n 0, est entièrement consommée ; le diiode, plus abondant, est en excès et il en reste n 1 moins n 0">
    <T x={20} y={20} c={VERT} w={700}>vitamine C : n₀</T><rect x="20" y="26" width="80" height="22" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/>
    <T x={20} y={72} c={ORANGE} w={700}>diiode : n₁</T>
    <rect x="20" y="78" width="80" height="22" fill={GRIS_CLAIR} stroke={GRIS} strokeWidth="2"/><rect x="100" y="78" width="150" height="22" fill={ORANGE_CLAIR} stroke={ORANGE} strokeWidth="2"/>
    <T x={60} y={94} a="middle" c={GRIS} w={700}>réagi</T><T x={175} y={94} a="middle" c="#7c2d12" w={700}>reste</T>
    <line x1="100" y1="28" x2="100" y2="106" stroke={ROUGE} strokeWidth="2" strokeDasharray="5 4"/>
    <T x={100} y={122} a="middle" c={ROUGE} w={800}>x_max = n₀</T>
    <T x={150} y={146} a="middle" c={VERT} w={700}>le plus petit n (coefficients 1)</T><T x={150} y={164} a="middle" c={GRIS}>est le réactif limitant</T>
  </Svg>);

export const FChaineN = () => (
  <Svg h={162} aria="De la masse à la concentration : la masse m divisée par la masse molaire M donne la quantité de matière n ; n divisée par le volume V en litres donne la concentration c ; en sens inverse, n égale c fois V ; les mg et les mL se convertissent en g et en L en divisant par 1000">
    {[[8, 'm (g)'], [108, 'n (mol)'], [208, 'c (mol·L⁻¹)']].map(([x, t]) => <g key={t}><rect x={x} y="30" width="84" height="30" rx="8" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.2"/><T x={x + 42} y={50} a="middle" c={BLEU} w={700}>{t}</T></g>)}
    <Fleche x1={94} y1={40} x2={106} y2={40} c={ORANGE}/><Fleche x1={194} y1={40} x2={206} y2={40} c={ORANGE}/>
    <T x={100} y={22} a="middle" c={ORANGE} w={800}>÷ M</T><T x={200} y={22} a="middle" c={ORANGE} w={800}>÷ V</T>
    <Fleche x1={106} y1={52} x2={94} y2={52} c={VERT}/><Fleche x1={206} y1={52} x2={194} y2={52} c={VERT}/>
    <T x={100} y={78} a="middle" c={VERT} w={800}>× M</T><T x={200} y={78} a="middle" c={VERT} w={800}>× V</T>
    <T x={150} y={104} a="middle" c={ENCRE} w={700}>n = c × V (V en litres)</T>
    <T x={150} y={128} a="middle" c={GRIS}>mg → g et mL → L : diviser par 1000</T>
    <T x={150} y={150} a="middle" c={GRIS}>toujours convertir avant de calculer</T>
  </Svg>);

export const FTableau = () => {
  const cols = [[96, 'état'], [184, 'vit. C'], [256, 'I₂']];
  const lignes = [['initial', 'n₀', 'n₁'], ['en cours', 'n₀ − x', 'n₁ − x'], ['final', '0', 'n₁ − n₀']];
  return (
    <Svg h={152} aria="Tableau d'avancement : à l'état initial n 0 de vitamine C et n 1 de diiode ; en cours n 0 moins x et n 1 moins x ; à l'état final la vitamine C est à 0 et il reste n 1 moins n 0 de diiode, que l'on titre ensuite">
      {cols.map(([x, t], i) => <T key={t} x={i === 0 ? 10 : x} y={18} a={i === 0 ? 'start' : 'middle'} c={GRIS} w={700}>{t}</T>)}
      <line x1="8" y1="26" x2="292" y2="26" stroke={BLEU} strokeWidth="2"/>
      {lignes.map(([e, a, b], i) => { const y = 50 + i * 30, fin = i === 2; return (<g key={e}>
        {fin && <rect x="4" y={y - 18} width="292" height="26" rx="6" fill="#fff7ed" stroke={ORANGE} strokeWidth="1.5"/>}
        <T x={14} y={y} c={ENCRE} w={700}>{e}</T><T x={184} y={y} a="middle" c={fin ? VERT : ENCRE} w={fin ? 700 : 400}>{a}</T><T x={256} y={y} a="middle" c={fin ? ORANGE : ENCRE} w={fin ? 800 : 400}>{b}</T></g>); })}
      <T x={150} y={134} a="middle" c={ORANGE} w={700}>n₁ − n₀ : le diiode restant, à titrer</T>
    </Svg>);
};

export const FOxRed = () => (
  <Svg h={152} aria="Le thiosulfate, réducteur, cède des électrons : c'est une oxydation ; le diiode, oxydant, capte ces électrons : c'est une réduction ; équation du titrage : I2 plus 2 S2O3 2- donne 2 I- plus S4O6 2-">
    <rect x="8" y="22" width="112" height="46" rx="8" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.2"/><T x={64} y={42} a="middle" c={BLEU} w={700}>réducteur</T><T x={64} y={60} a="middle" c={BLEU} w={800}>S₂O₃²⁻</T>
    <rect x="180" y="22" width="112" height="46" rx="8" fill="#ffedd5" stroke={ORANGE} strokeWidth="2.2"/><T x={236} y={42} a="middle" c={ORANGE} w={700}>oxydant</T><T x={236} y={60} a="middle" c={ORANGE} w={800}>I₂</T>
    <Fleche x1={124} y1={46} x2={176} y2={46} c={ROUGE}/><T x={150} y={38} a="middle" c={ROUGE} w={800}>e⁻</T>
    <T x={64} y={88} a="middle" c={ENCRE}>cède des e⁻</T><T x={64} y={106} a="middle" c={BLEU} w={700}>oxydation</T>
    <T x={236} y={88} a="middle" c={ENCRE}>capte des e⁻</T><T x={236} y={106} a="middle" c={ORANGE} w={700}>réduction</T>
    <T x={150} y={140} a="middle" c={VERT} w={700}>I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻</T>
  </Svg>);

const Erlen = ({ x, fond, bord }) => (
  <g><polygon points={`${x - 9},14 ${x + 9},14 ${x + 9},34 ${x + 26},74 ${x - 26},74 ${x - 9},34`} fill="#fff" stroke={GRIS} strokeWidth="2"/>
    <polygon points={`${x - 13},50 ${x + 13},50 ${x + 26},74 ${x - 26},74`} fill={fond} stroke={bord} strokeWidth="1.5"/></g>);
export const FEquivalence = () => (
  <Svg h={160} aria="Avant l'équivalence la solution reste jaune car il reste du diiode ; à l'équivalence le diiode est tout juste consommé et la solution est incolore ; après, le thiosulfate est en excès ; à l'équivalence, 1 mole de I2 a réagi avec 2 moles de S2O3 2-">
    <Erlen x={48} fond={ORANGE_CLAIR} bord={ORANGE}/><Erlen x={150} fond="#f8fafc" bord={GRIS_CLAIR}/><Erlen x={252} fond="#f8fafc" bord={GRIS_CLAIR}/>
    <T x={48} y={94} a="middle" c={ENCRE} w={700}>avant</T><T x={48} y={112} a="middle" c={ORANGE}>il reste I₂</T>
    <T x={150} y={94} a="middle" c={VERT} w={800}>équivalence</T><T x={150} y={112} a="middle" c={VERT}>I₂ épuisé</T>
    <T x={252} y={94} a="middle" c={ENCRE} w={700}>après</T><T x={252} y={112} a="middle" c={BLEU}>titrant en excès</T>
    <T x={150} y={146} a="middle" c={VERT} w={700}>à l’équivalence : 1 I₂ pour 2 S₂O₃²⁻</T>
  </Svg>);

export const FMethode = () => (
  <Svg h={188} aria="La méthode en cinq temps : lire le volume équivalent, calculer la quantité de thiosulfate c2 fois V2e, la diviser par 2 pour obtenir le diiode restant, soustraire de n 1 pour obtenir la vitamine C, puis multiplier par 4 et par M pour obtenir la masse">
    {[['lire V₂,ₑ à l’équivalence', BLEU], ['n(S₂O₃²⁻) = c₂ × V₂,ₑ', BLEU], ['n(I₂)restant = n(S₂O₃²⁻) ÷ 2', ORANGE], ['n(vit. C) = n₁ − n(I₂)restant', VERT], ['m = 4 × n(vit. C) × M', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={20 + i * 29} r="10" fill={c}/><T x={16} y={24.5 + i * 29} a="middle" c="#fff" w={800}>{i + 1}</T>
        <T x={34} y={24.5 + i * 29} c={ENCRE} w={600}>{t}</T>
        {i < 4 && <line x1="16" y1={31 + i * 29} x2="16" y2={38 + i * 29} stroke={GRIS} strokeWidth="2"/>}</g>))}
    <T x={150} y={180} a="middle" c={GRIS}>le 4 : 25 mL prélevés dans 100 mL</T>
  </Svg>);

export const FPlusMoins = () => (
  <Svg h={176} aria="Une solution fraîche réagit avec beaucoup de diiode : il en reste peu et le volume équivalent est petit ; une solution dégradée par la lumière contient moins de vitamine C : il reste plus de diiode et le volume équivalent est grand ; plus de thiosulfate versé veut dire moins de vitamine C">
    <T x={20} y={18} c={ENCRE} w={700}>solution fraîche</T>
    <rect x="20" y="24" width="150" height="24" fill={GRIS_CLAIR}/><rect x="170" y="24" width="50" height="24" fill={ORANGE_CLAIR}/><rect x="20" y="24" width="200" height="24" fill="none" stroke={GRIS} strokeWidth="2"/>
    <T x={228} y={42} c={BLEU} w={700}>V₂,ₑ petit</T>
    <T x={20} y={82} c={ENCRE} w={700}>solution restée à la lumière</T>
    <rect x="20" y="88" width="70" height="24" fill={GRIS_CLAIR}/><rect x="90" y="88" width="130" height="24" fill={ORANGE_CLAIR}/><rect x="20" y="88" width="200" height="24" fill="none" stroke={GRIS} strokeWidth="2"/>
    <T x={228} y={106} c={BLEU} w={700}>V₂,ₑ grand</T>
    <rect x="20" y="124" width="12" height="12" fill={GRIS_CLAIR} stroke={GRIS}/><T x={38} y={135} c={GRIS} w={700}>vitamine C ayant réagi</T>
    <rect x="20" y="142" width="12" height="12" fill={ORANGE_CLAIR} stroke={GRIS}/><T x={38} y={153} c="#7c2d12" w={700}>diiode restant, à titrer</T>
    <T x={150} y={172} a="middle" c={VERT} w={700}>V₂,ₑ grand ⇒ moins de vit. C</T>
  </Svg>);

export const FLimites = () => (
  <Svg h={186} aria="Deux précautions : l'empois d'amidon colore en bleu sombre la moindre trace de diiode, ce qui rend la disparition de la couleur à l'équivalence très nette ; la vitamine C se dégrade avec la lumière et le temps, donc il faut titrer juste après la préparation de la solution">
    <T x={150} y={16} a="middle" c={BLEU} w={700}>empois d’amidon</T>
    <circle cx="70" cy="46" r="16" fill="#1e3a8a"/><T x={70} y={80} a="middle" c={GRIS}>I₂ : bleu sombre</T>
    <Fleche x1={104} y1={46} x2={196} y2={46} c={GRIS}/><T x={150} y={38} a="middle" c={GRIS}>équivalence</T>
    <circle cx="230" cy="46" r="16" fill="#f8fafc" stroke={GRIS} strokeWidth="2"/><T x={230} y={80} a="middle" c={GRIS}>I₂ épuisé : incolore</T>
    <T x={150} y={112} a="middle" c={ORANGE} w={700}>la vitamine C se dégrade</T>
    <rect x="20" y="120" width="200" height="14" fill="#bbf7d0" stroke={VERT} strokeWidth="1.5"/><T x={228} y={132} c={VERT} w={700}>frais</T>
    <rect x="20" y="140" width="90" height="14" fill="#bbf7d0" stroke={VERT} strokeWidth="1.5"/><T x={118} y={152} c={ROUGE} w={700}>après des heures</T>
    <T x={150} y={178} a="middle" c={GRIS}>titrer juste après la préparation</T>
  </Svg>);
