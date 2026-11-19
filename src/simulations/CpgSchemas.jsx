// Schémas des cartes « À retenir » de la simulation 54 (chromatographie en phase gazeuse). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
// Pic gaussien approché : base y0, centre cx, hauteur h, demi-largeur l
const Pic = ({ cx, y0, h, l, c = ENCRE, w = 2.6 }) => <path d={`M${cx - 2.6 * l},${y0} C${cx - 1.2 * l},${y0} ${cx - 1.1 * l},${y0 - h} ${cx},${y0 - h} C${cx + 1.1 * l},${y0 - h} ${cx + 1.2 * l},${y0} ${cx + 2.6 * l},${y0}`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round"/>;

export const FChaineCPG = () => (
  <Svg h={176} aria="Chaîne d'une CPG : le gaz vecteur entraîne l'échantillon vaporisé dans l'injecteur chauffé, puis dans la colonne placée dans le four où les composés se séparent, puis dans le détecteur FID qui trace le chromatogramme">
    <Fleche x1={8} y1={50} x2={30} y2={50} c={GRIS}/><T x={6} y={30} c={GRIS} w={700}>gaz vecteur</T>
    {[[32, 64, 'Injecteur', 'vaporise', ORANGE], [112, 82, 'Colonne', 'dans le four', BLEU], [214, 80, 'Détecteur', 'FID', VERT]].map(([x, w, n, r, c]) => (
      <g key={n}><rect x={x} y="34" width={w} height="34" rx="6" fill="#fff" stroke={c} strokeWidth="2"/><text x={x + w / 2} y="56" textAnchor="middle" fontSize="12" fontWeight="800" fill={c}>{n}</text><T x={x + w / 2} y={86} a="middle" c={GRIS}>{r}</T></g>))}
    <Fleche x1={98} y1={51} x2={110} y2={51}/><Fleche x1={196} y1={51} x2={212} y2={51}/>
    <T x={150} y={116} a="middle" w={700}>le détecteur trace le chromatogramme</T>
    <Lg x1={30} y1={160} x2={270} y2={160} c={GRIS} w={1.4}/>
    <Pic cx={78} y0={160} h={26} l={8} c={ENCRE}/><Pic cx={150} y0={160} h={34} l={9} c={ENCRE}/><Pic cx={226} y0={160} h={20} l={10} c={ENCRE}/>
    <T x={278} y={158} a="end" c={GRIS}>t</T>
  </Svg>);

export const FPolarite = () => (
  <Svg h={216} aria="Effet de la polarité de la colonne : sur colonne apolaire, un alcool sort avant un hydrocarbure plus lourd, l'ordre suit la volatilité ; sur colonne polaire, l'alcool est retenu par liaisons hydrogène et sort après l'hydrocarbure">
    <T x={14} y={18} w={800}>colonne apolaire</T>
    <Lg x1={14} y1={80} x2={290} y2={80} c={GRIS} w={1.4}/><Pic cx={90} y0={80} h={46} l={9} c={ORANGE}/><Pic cx={190} y0={80} h={46} l={9} c={BLEU}/>
    <T x={90} y={98} a="middle" c={ORANGE} w={700}>alcool</T><T x={190} y={98} a="middle" c={BLEU} w={700}>hydrocarbure</T>
    <T x={14} y={128} w={800}>colonne polaire</T>
    <Lg x1={14} y1={190} x2={290} y2={190} c={GRIS} w={1.4}/><Pic cx={80} y0={190} h={46} l={9} c={BLEU}/><Pic cx={214} y0={190} h={46} l={9} c={ORANGE}/>
    <T x={80} y={206} a="middle" c={BLEU} w={700}>hydrocarbure</T><T x={214} y={206} a="middle" c={ORANGE} w={700}>alcool</T>
    <Fleche x1={110} y1={168} x2={186} y2={168} c={ORANGE} w={2}/>
  </Svg>);

export const FIdentCPG = () => (
  <Svg h={190} aria="Identification par temps de rétention : les pics de l'échantillon sont associés aux étalons de même temps de rétention, injectés dans les mêmes conditions ; un étalon sans pic correspondant est absent de l'échantillon">
    <T x={14} y={16} c={GRIS} w={800}>étalons</T>
    <Lg x1={14} y1={68} x2={290} y2={68} c={GRIS} w={1.4}/>
    {[[64, 'A', BLEU], [140, 'B', ORANGE], [222, 'C', VERT]].map(([x, n, c]) => <g key={n}><Pic cx={x} y0={68} h={34} l={8} c={c}/><T x={x} y={84} a="middle" c={c} w={800}>{n}</T></g>)}
    <T x={14} y={112} c={GRIS} w={800}>échantillon</T>
    <Lg x1={14} y1={160} x2={290} y2={160} c={GRIS} w={1.4}/>
    <Pic cx={65} y0={160} h={34} l={8} c={ENCRE}/><Pic cx={222} y0={160} h={34} l={8} c={ENCRE}/>
    <Lg x1={64} y1={92} x2={64} y2={126} c={BLEU} w={1.4} d="3 3"/><Lg x1={222} y1={92} x2={222} y2={126} c={VERT} w={1.4} d="3 3"/>
    <T x={140} y={146} a="middle" c={ORANGE} w={800}>B absent</T>
    <T x={150} y={182} a="middle" c={GRIS}>même temps de rétention : un indice</T>
  </Svg>);

export const FResolution = () => (
  <Svg h={202} aria="Résolution : deux pics bien séparés ont une résolution supérieure ou égale à 1,5 ; deux pics qui se chevauchent ont une résolution inférieure à 1,5, c'est une co-élution">
    <T x={14} y={18} w={800}>Rₛ ≥ 1,5 : pics séparés</T>
    <Lg x1={14} y1={80} x2={290} y2={80} c={GRIS} w={1.4}/><Pic cx={96} y0={80} h={42} l={11} c={BLEU}/><Pic cx={196} y0={80} h={42} l={11} c={ORANGE}/>
    <T x={14} y={112} w={800}>Rₛ &lt; 1,5 : co-élution</T>
    <Lg x1={14} y1={174} x2={290} y2={174} c={GRIS} w={1.4}/><Pic cx={134} y0={174} h={42} l={11} c={BLEU}/><Pic cx={160} y0={174} h={42} l={11} c={ORANGE}/>
    <T x={150} y={190} a="middle" c={GRIS}>pic anormalement large</T>
  </Svg>);

export const FProgrammation = () => (
  <Svg h={214} aria="Isotherme ou programmation de température : en isotherme, les composés lourds sortent tard en pics larges et bas ; avec une rampe de température, les pics sont régulièrement répartis et fins">
    <T x={14} y={16} w={800}>isotherme</T>
    <Lg x1={14} y1={80} x2={290} y2={80} c={GRIS} w={1.4}/>
    <Pic cx={36} y0={80} h={44} l={4} c={BLEU}/><Pic cx={70} y0={80} h={36} l={5} c={BLEU}/><Pic cx={132} y0={80} h={24} l={10} c={BLEU}/><Pic cx={240} y0={80} h={11} l={22} c={BLEU}/>
    <T x={150} y={98} a="middle" c={GRIS}>lourds : très tard, larges, bas</T>
    <T x={14} y={126} w={800}>rampe de température</T>
    <Lg x1={14} y1={190} x2={290} y2={190} c={GRIS} w={1.4}/>
    {[36, 98, 160, 222].map(x => <Pic key={x} cx={x} y0={190} h={44} l={5} c={ORANGE}/>)}
    <T x={150} y={208} a="middle" c={GRIS}>pics fins, durée raisonnable</T>
  </Svg>);

export const FSplitCPG = () => (
  <Svg h={196} aria="Split et splitless : en split, une vanne de fuite évacue la plus grande partie de l'échantillon et seule une petite fraction entre dans la colonne ; en splitless, la vanne est fermée et presque tout entre dans la colonne">
    {[[8, 'split', ORANGE], [158, 'splitless', VERT]].map(([x, n, c]) => <g key={n}><rect x={x} y="6" width="134" height="150" rx="8" fill="#fff" stroke={c} strokeWidth="2"/><T x={x + 67} y={26} a="middle" c={c} w={800}>{n}</T><rect x={x + 30} y="40" width="74" height="30" rx="5" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.8"/><T x={x + 67} y={59} a="middle" w={700}>injecteur</T></g>)}
    <Fleche x1={75} y1={72} x2={75} y2={132} c={GRIS} w={1.8}/><T x={82} y={108} c={GRIS}>colonne</T>
    <Fleche x1={52} y1={56} x2={14} y2={96} c={ORANGE} w={4}/><T x={14} y={118} c={ORANGE} w={700}>fuite</T>
    <Fleche x1={225} y1={72} x2={225} y2={134} c={VERT} w={4.5}/><T x={234} y={108} c={VERT} w={700}>colonne</T>
    <T x={150} y={176} a="middle" w={700}>concentré : split ; traces : splitless</T>
    <T x={150} y={192} a="middle" c={GRIS}>vanne de fuite ouverte ou fermée</T>
  </Svg>);

export const FDiagnosticCPG = () => (
  <Svg h={206} aria="Diagnostiquer une panne en lisant les indicateurs dans l'ordre : pression, temps de rétention, forme et aires des pics, ligne de base ; pression basse et temps de rétention plus longs, fuite au septum ; seuls les alcools traînent, liner encrassé ; aucun pic, flamme éteinte ; pics petits et bruit, dihydrogène déréglé ; ligne de base qui monte, ressuage de la colonne">
    {[['pression ↓ et temps de rétention ↑', 'fuite au septum', ROUGE], ['seuls les alcools traînent', 'liner encrassé', ORANGE], ['aucun pic, ligne de base plate', 'flamme éteinte', BLEU], ['pics petits, bruit en hausse', 'dihydrogène déréglé', VERT], ['ligne de base qui monte', 'ressuage de la colonne', GRIS]].map(([a, b, c], i) => (
      <g key={i}><circle cx="14" cy={20 + i * 38} r="11" fill={c}/><T x={14} y={24.5 + i * 38} a="middle" c="#fff" w={800}>{i + 1}</T>
        <T x={34} y={18 + i * 38} w={700}>{a}</T><T x={34} y={34 + i * 38} c={c} w={800}>→ {b}</T></g>))}
  </Svg>);
