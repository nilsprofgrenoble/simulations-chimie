// Schémas des cartes « À retenir » de la simulation 181 (diffraction d'une onde). viewBox de 320, textes de 15,5 à 20 (≥ 11 px rendus à 390 px).
// Toutes les coordonnées sont des nombres ; aucune formule avec « / » : fractions dessinées (barre) ou MathML dans la carte.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400, s = 16 }) => <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 11 - uy * 5.5},${y2 - uy * 11 + ux * 5.5} ${x2 - ux * 11 + uy * 5.5},${y2 - uy * 11 - ux * 5.5}`} fill={c}/></g>);
};
// cote : trait avec petits traits d'extrémité (vertical ou horizontal)
const CoteV = ({ x, y1, y2, c = ENCRE }) => <g><Lg x1={x} y1={y1} x2={x} y2={y2} c={c} w={1.8}/><Lg x1={x - 5} y1={y1} x2={x + 5} y2={y1} c={c} w={1.8}/><Lg x1={x - 5} y1={y2} x2={x + 5} y2={y2} c={c} w={1.8}/></g>;
const CoteH = ({ y, x1, x2, c = ENCRE }) => <g><Lg x1={x1} y1={y} x2={x2} y2={y} c={c} w={1.8}/><Lg x1={x1} y1={y - 5} x2={x1} y2={y + 5} c={c} w={1.8}/><Lg x1={x2} y1={y - 5} x2={x2} y2={y + 5} c={c} w={1.8}/></g>;
const Mur = ({ x, g1, g2, h0 = 20, h1 = 180 }) => <g><rect x={x} y={h0} width="9" height={g1 - h0} fill={GRIS}/><rect x={x} y={g2} width="9" height={h1 - g2} fill={GRIS}/></g>;
// arc de cercle de centre (cx, cy), rayon r, de l'angle 0 à ±th (th > 0 : au-dessus de l'axe)
const Arc = ({ cx, cy, r, th, c = ROUGE }) => <path d={`M${cx + r},${cy} A${r},${r} 0 0 ${th > 0 ? 0 : 1} ${cx + r * Math.cos(th)},${cy - r * Math.sin(th)}`} stroke={c} strokeWidth="2.2" fill="none"/>;

// Carte 1 : diffraction, grande ouverture et petite ouverture (deux colonnes séparées)
export const SvgCarteDiffraction = () => (
  <Svg h={262} aria="Diffraction, schéma qualitatif pas à l'échelle, en deux colonnes. À gauche, ouverture a très grande devant la longueur d'onde lambda : les fronts d'onde traversent presque sans changer, le faisceau est presque droit. À droite, ouverture a de l'ordre de lambda : les fronts d'onde deviennent des arcs de cercle, les ondes s'étalent.">
    <T x={6} y={16} c={GRIS} s={15.5}>pas à l’échelle</T>
    <Lg x1={160} y1={28} x2={160} y2={214} c="#cbd5e1" w={2} d="5 5"/>
    <Mur x={62} g1={50} g2={150} h0={24} h1={176}/><Mur x={212} g1={92} g2={108} h0={24} h1={176}/>
    {[12, 30].map(x => <Lg key={x} x1={x} y1={32} x2={x} y2={168} c={BLEU} w={2.4}/>)}
    {[94, 112, 130].map(x => <Lg key={x} x1={x} y1={52} x2={x} y2={148} c={BLEU} w={2.4}/>)}
    {[168, 186].map(x => <Lg key={x} x1={x} y1={32} x2={x} y2={168} c={BLEU} w={2.4}/>)}
    {[22, 40, 58].map(r => <path key={r} d={`M${221 + r * Math.cos(1.3)},${100 - r * Math.sin(1.3)} A${r},${r} 0 0 1 ${221 + r * Math.cos(1.3)},${100 + r * Math.sin(1.3)}`} stroke={BLEU} strokeWidth="2.4" fill="none"/>)}
    <CoteV x={50} y1={50} y2={150}/><T x={43} y={106} a="end" w={700} s={18}>a</T>
    <CoteV x={206} y1={92} y2={108}/><T x={194} y={106} a="end" w={700} s={18}>a</T>
    <CoteH y={190} x1={12} x2={30}/><T x={21} y={212} a="middle" w={700} s={18}>λ</T>
    <CoteH y={190} x1={168} x2={186}/><T x={177} y={212} a="middle" w={700} s={18}>λ</T>
    <T x={80} y={236} a="middle" w={700} c={VERT} s={16.5}>a ≫ λ :</T><T x={80} y={256} a="middle" w={700} c={VERT} s={16.5}>faisceau droit</T>
    <T x={240} y={236} a="middle" w={700} c={ROUGE} s={16.5}>a ≈ λ :</T><T x={240} y={256} a="middle" w={700} c={ROUGE} s={16.5}>ondes étalées</T>
  </Svg>);

// Carte 2 : angle caractéristique θ
export const SvgCarteAngle = () => {
  const t = 0.35, tn = Math.tan(t);
  return (
    <Svg h={224} aria="Angle caractéristique de diffraction, schéma pas à l'échelle : une onde plane arrive sur un mur percé d'une ouverture de largeur a ; l'angle theta est l'angle entre l'axe et la direction de la première extinction, de part et d'autre de l'axe ; theta est environ égal à lambda divisé par a">
      <Mur x={91} g1={84} g2={116} h0={24} h1={176}/>
      <Fleche x1={10} y1={100} x2={58} y2={100} c={BLEU}/><T x={34} y={86} a="middle" c={BLEU} w={700}>onde</T>
      <CoteV x={78} y1={84} y2={116}/><T x={71} y={106} a="end" w={700} s={18}>a</T>
      <polygon points={`100,100 300,${100 - 200 * tn} 300,${100 + 200 * tn}`} fill={ROUGE} opacity="0.1"/>
      <Lg x1={100} y1={100} x2={300} y2={100} c={GRIS} w={1.8} d="2 5"/><T x={300} y={92} a="end" c={GRIS}>axe</T>
      <Lg x1={100} y1={100} x2={300} y2={100 - 200 * tn} c={ROUGE} w={2.4} d="7 5"/><Lg x1={100} y1={100} x2={300} y2={100 + 200 * tn} c={ROUGE} w={2.4} d="7 5"/>
      <Arc cx={100} cy={100} r={66} th={t}/><Arc cx={100} cy={100} r={66} th={-t}/>
      <T x={100 + 83 * Math.cos(t + 0.12) - 5} y={100 - 83 * Math.sin(t + 0.12) + 5} c={ROUGE} w={700} s={20}>θ</T>
      <T x={100 + 83 * Math.cos(t + 0.12) - 5} y={100 + 83 * Math.sin(t + 0.12) + 5} c={ROUGE} w={700} s={20}>θ</T>
      <T x={304} y={22} a="end" c={ROUGE} s={15.5}>1re extinction</T><T x={304} y={196} a="end" c={ROUGE} s={15.5}>1re extinction</T>
      <T x={6} y={218} c={GRIS} s={15.5}>pas à l’échelle</T>
    </Svg>);
};

// Carte 3 : échelle des rapports λ / a (puissances de 10) ; positions approximatives (ordres de grandeur)
export const SvgCarteEchelle = () => {
  const x = l => 16 + (l + 7) * 36;
  const px2 = x(-0.1);
  return (
    <Svg h={226} aria="Échelle logarithmique du rapport lambda sur a. À gauche, rapport très petit : la lumière par une porte ; au milieu, un laser sur une fente fine ; à droite, rapport voisin de 1 : la cuve à ondes et la voix par une porte. Plus le rapport est grand, plus les ondes s'étalent.">
      <defs><linearGradient id="dif-ech" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#86efac"/><stop offset="0.55" stopColor="#fde68a"/><stop offset="1" stopColor="#fdba74"/></linearGradient></defs>
      <T x={150} y={34} a="end" w={700}>rapport</T>
      <T x={166} y={22} a="middle" w={700} s={18}>λ</T><Lg x1={157} y1={27} x2={175} y2={27} w={1.8}/><T x={166} y={46} a="middle" w={700} s={18}>a</T>
      <T x={16} y={74} c={VERT} w={700}>presque droit</T><T x={304} y={74} a="end" c={ROUGE} w={700}>très étalé</T>
      <rect x={16} y={106} width={288} height={12} rx={3} fill="url(#dif-ech)" stroke={GRIS} strokeWidth="1.2"/>
      {[-6, -4, -2, 0].map(l => <g key={l}><Lg x1={x(l)} y1={102} x2={x(l)} y2={122} c={GRIS} w={1.8}/><T x={x(l)} y={98} a="middle" s={16}>{l === 0 ? '1' : '10' + '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[-l]}</T></g>)}
      {[[x(-6.2), 'lumière, porte', 8, 'start', 150], [x(-2), 'laser, fente', x(-2), 'middle', 150], [px2, 'cuve, voix', px2, 'middle', 182]].map(([px, nom, tx, an, ty]) => <g key={nom}><circle cx={px} cy={112} r={6} fill={ENCRE} stroke="#fff" strokeWidth="1.5"/><Lg x1={px} y1={120} x2={px} y2={ty - 18} c={ENCRE} w={1.6}/><T x={tx} y={ty} a={an} w={700}>{nom}</T></g>)}
      <Lg x1={x(-0.3)} y1={112} x2={x(0.1)} y2={112} c={ENCRE} w={3}/>
      <T x={160} y={216} a="middle" c={GRIS} s={15.5}>ordres de grandeur, en puissances de 10</T>
    </Svg>);
};

// Carte 4 : figure sur l'écran, θ = L / (2D)
export const SvgCarteFigure = () => {
  const tn = 48 / 168, t = Math.atan(tn), pts = [];
  for (let y = 10; y <= 190; y += 3) { const u = (y - 100) / 48 * Math.PI, I = Math.abs(u) < 1e-6 ? 1 : (Math.sin(u) / u) ** 2; pts.push(`${y === 10 ? 'M' : 'L'}${(214 + 56 * I).toFixed(1)},${y}`); }
  return (
    <Svg h={228} aria="Figure de diffraction d'une fente, schéma pas à l'échelle : la lumière traverse une fente de largeur a ; sur l'écran à la distance D, la tache centrale a pour largeur L entre les deux premières extinctions ; la moitié de L est vue sous l'angle theta depuis la fente ; à droite, le profil d'intensité montre la tache centrale très lumineuse et des taches secondaires faibles">
      <Mur x={30} g1={92} g2={108} h0={30} h1={170}/><T x={34} y={22} a="middle" w={700}>fente</T>
      <CoteV x={22} y1={92} y2={108}/><T x={15} y={106} a="end" w={700} s={18}>a</T>
      <polygon points={`38,100 206,52 206,148`} fill={VERT} opacity="0.14"/>
      <Lg x1={38} y1={100} x2={206} y2={100} c={GRIS} w={1.8} d="2 5"/>
      <Lg x1={38} y1={100} x2={206} y2={52} c={ROUGE} w={2.4} d="7 5"/><Lg x1={38} y1={100} x2={206} y2={148} c={ROUGE} w={2.4} d="7 5"/>
      <Arc cx={38} cy={100} r={76} th={t}/>
      <T x={38 + 94 * Math.cos(t + 0.1) - 4} y={100 - 94 * Math.sin(t + 0.1) + 3} c={ROUGE} w={700} s={20}>θ</T>
      <rect x={206} y={10} width={8} height={180} fill="#cbd5e1" stroke={GRIS} strokeWidth="1.4"/>
      <path d={pts.join(' ')} fill="none" stroke={VERT} strokeWidth="2.4"/>
      <CoteV x={198} y1={52} y2={100} c={ROUGE}/>
      <T x={180} y={72} a="middle" c={ROUGE} w={700} s={17}>L</T><Lg x1={171} y1={77} x2={189} y2={77} c={ROUGE} w={1.8}/><T x={180} y={95} a="middle" c={ROUGE} w={700} s={17}>2</T>
      <CoteV x={300} y1={52} y2={148}/><T x={306} y={106} w={700} s={20}>L</T>
      <T x={222} y={38} c={GRIS} s={15.5}>extinction</T><T x={222} y={168} c={GRIS} s={15.5}>extinction</T>
      <CoteH y={184} x1={38} x2={206}/><T x={122} y={178} a="middle" w={700} s={20}>D</T>
      <T x={6} y={220} c={GRIS} s={15.5}>pas à l’échelle</T>
      <T x={290} y={210} a="end" c={GRIS} s={15.5}>écran</T>
    </Svg>);
};

// Carte 5 : petit a, grand θ (à λ fixée)
export const SvgCarteBilan = () => (
  <Svg h={220} aria="Bilan, schéma pas à l'échelle, à longueur d'onde fixée : avec une petite ouverture a, l'angle caractéristique theta est grand et le faisceau s'élargit beaucoup ; avec une grande ouverture a, theta est petit et le faisceau reste fin">
    <T x={6} y={16} c={GRIS} s={15.5}>pas à l’échelle</T><T x={314} y={16} a="end" c={GRIS} s={15.5}>à λ fixée</T>
    <Mur x={55} g1={94} g2={106} h0={30} h1={176}/><Mur x={198} g1={70} g2={130} h0={30} h1={176}/>
    <Fleche x1={4} y1={100} x2={36} y2={100} c={BLEU}/><Fleche x1={126} y1={100} x2={164} y2={100} c={BLEU}/>
    <polygon points={`64,100 150,${100 - 86 * Math.tan(0.5)} 150,${100 + 86 * Math.tan(0.5)}`} fill={ROUGE} opacity="0.12"/>
    <polygon points={`207,100 300,${100 - 93 * Math.tan(0.25)} 300,${100 + 93 * Math.tan(0.25)}`} fill={VERT} opacity="0.18"/>
    <Lg x1={64} y1={100} x2={150} y2={100 - 86 * Math.tan(0.5)} c={ROUGE} w={2.4} d="7 5"/><Lg x1={64} y1={100} x2={150} y2={100 + 86 * Math.tan(0.5)} c={ROUGE} w={2.4} d="7 5"/>
    <Lg x1={207} y1={100} x2={300} y2={100 - 93 * Math.tan(0.25)} c={VERT} w={2.4} d="7 5"/><Lg x1={207} y1={100} x2={300} y2={100 + 93 * Math.tan(0.25)} c={VERT} w={2.4} d="7 5"/>
    <Arc cx={64} cy={100} r={42} th={0.5}/><T x={64 + 58 * Math.cos(0.62) - 4} y={100 - 58 * Math.sin(0.62) + 3} c={ROUGE} w={700} s={20}>θ</T>
    <Arc cx={207} cy={100} r={72} th={0.25} c={VERT}/><T x={207 + 90 * Math.cos(0.3) - 3} y={100 - 90 * Math.sin(0.3) + 3} c={VERT} w={700} s={20}>θ</T>
    <CoteV x={44} y1={94} y2={106}/><T x={44} y={128} a="middle" w={700} s={18}>a</T>
    <CoteV x={182} y1={70} y2={130}/><T x={182} y={152} a="middle" w={700} s={18}>a</T>
    <T x={78} y={208} a="middle" w={700} c={ROUGE} s={16}>a petit : θ grand</T><T x={244} y={208} a="middle" w={700} c={VERT} s={16}>a grand : θ petit</T>
  </Svg>);
