// Schémas des cartes « À retenir » de la simulation 92 (mécanismes réactionnels, addition de HBr). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', VIOLET = '#6d28d9', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
// Flèche courbe : un arc de cercle-like (courbe de Bézier) terminé par une pointe orientée selon la tangente finale
const Courbe = ({ d, tip, dir, c = ROUGE }) => {
  const [tx, ty] = tip, [ux, uy] = dir;
  return (<g><path d={d} fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round"/>
    <polygon points={`${tx},${ty} ${tx - ux * 11 - uy * 5.5},${ty - uy * 11 + ux * 5.5} ${tx - ux * 11 + uy * 5.5},${ty - uy * 11 - ux * 5.5}`} fill={c}/></g>);
};

export const FFlecheCourbe = () => (
  <Svg h={196} aria="Flèches courbes de l'addition de HBr sur une double liaison C=C : la première part de la liaison pi, riche en électrons, et pointe vers l'atome d'hydrogène δ plus ; la seconde part de la liaison H–Br et pointe vers le brome δ moins">
    <ellipse cx="82" cy="110" rx="38" ry="16" fill="#ede9fe" stroke={VIOLET} strokeWidth="1.6" strokeDasharray="4 3"/>
    <Lg x1={56} y1={106} x2={108} y2={106} w={2.4}/><Lg x1={56} y1={114} x2={108} y2={114} w={2.4}/>
    <T x={30} y={115} a="middle" w={800}>C</T><T x={134} y={115} a="middle" w={800}>C</T>
    <Lg x1={222} y1={110} x2={254} y2={110} w={2.4}/><T x={210} y={115} a="middle" w={800}>H</T><T x={266} y={115} a="middle" w={800}>Br</T>
    <Courbe d="M82,94 C82,30 200,22 208,92" tip={[208, 92]} dir={[0.1, 1]}/>
    <Courbe d="M238,104 C246,62 272,58 268,96" tip={[268, 96]} dir={[0, 1]}/>
    <T x={210} y={140} a="middle" c={ROUGE} w={800}>δ+</T><T x={268} y={140} a="middle" c={BLEU} w={800}>δ–</T>
    <T x={82} y={140} a="middle" c={VIOLET} w={800}>liaison π</T>
    <T x={150} y={170} a="middle" w={800}>début : source du doublet</T><T x={150} y={188} a="middle" w={800}>pointe : où il arrive</T>
  </Svg>);

export const FCarbocation = () => (
  <Svg h={206} aria="Carbocation : le carbone C plus est lié à trois groupes, un hydrogène, un méthyle et un éthyle, dans un plan avec des angles de 120 degrés ; il n'a que six électrons autour de lui, c'est-à-dire une lacune électronique">
    <circle cx="150" cy="92" r="26" fill="none" stroke={BLEU} strokeWidth="2" strokeDasharray="5 4"/>
    <Lg x1={150} y1={108} x2={150} y2={150} w={2.6}/><Lg x1={136} y1={84} x2={100} y2={63} w={2.6}/><Lg x1={164} y1={84} x2={200} y2={63} w={2.6}/>
    <T x={150} y={97} a="middle" w={800}>C⁺</T>
    <T x={150} y={168} a="middle" w={800}>H</T><T x={94} y={60} a="end" w={800}>CH₃</T><T x={206} y={60} w={800}>CH₂CH₃</T>
    <T x={166} y={124} c={ORANGE} w={800}>120°</T>
    <T x={150} y={190} a="middle" c={BLEU} w={800}>6 électrons : une lacune</T>
    <T x={288} y={22} a="end" c={GRIS}>3 liaisons, pas de doublet</T><T x={288} y={40} a="end" c={GRIS}>⇒ plan trigonal</T>
  </Svg>);

export const FProfil = () => (
  <Svg h={196} aria="Lecture d'un profil d'énergie à deux étapes : l'énergie d'activation est la hauteur entre le départ de l'étape et le sommet ; un sommet est un état de transition qu'on ne peut pas isoler ; un creux est un intermédiaire réactionnel">
    <Lg x1={14} y1={8} x2={14} y2={150} c={GRIS} w={1.8}/><Lg x1={14} y1={150} x2={290} y2={150} c={GRIS} w={1.8}/><T x={18} y={16} c={GRIS}>énergie</T>
    <path d="M24,134 C58,134 62,44 94,44 C126,44 126,102 154,102 C178,102 174,66 204,66 C234,66 238,118 276,118" fill="none" stroke={BLEU} strokeWidth="3"/>
    <Lg x1={24} y1={134} x2={100} y2={134} c={GRIS} w={1.4} d="4 3"/><Lg x1={40} y1={44} x2={94} y2={44} c={GRIS} w={1.4} d="4 3"/>
    <Fleche x1={40} y1={134} x2={40} y2={46} c={ORANGE} w={2.6}/>
    <T x={46} y={96} c={ORANGE} w={800}>Eₐ</T>
    <T x={94} y={36} a="middle" c={ROUGE} w={800}>sommet</T><T x={154} y={122} a="middle" c={VERT} w={800}>creux</T>
    <T x={150} y={172} a="middle" w={800}>Eₐ = sommet − départ de l’étape</T><T x={150} y={190} a="middle" c={GRIS}>sommet : état de transition ; creux : intermédiaire</T>
  </Svg>);

export const FAddition = () => (
  <Svg h={206} aria="Mécanisme en deux étapes : à l'étape 1, lente, le doublet pi attaque H et la liaison H–Br se rompt, ce qui donne un carbocation et Br moins avec deux flèches courbes ; à l'étape 2, rapide, un doublet de Br moins attaque C plus, ce qui donne le 2-bromobutane avec une flèche courbe">
    <rect x="10" y="8" width="280" height="86" rx="8" fill="#fff" stroke={ORANGE} strokeWidth="2.2"/>
    <T x={22} y={28} c={ORANGE} w={800}>Étape 1 : lente</T><T x={22} y={50} w={700}>but-2-ène + HBr</T><T x={22} y={70} w={700}>→ carbocation + Br⁻</T><T x={288} y={86} a="end" c={ROUGE} w={800}>2 flèches courbes</T>
    <Fleche x1={150} y1={96} x2={150} y2={110} c={GRIS} w={2}/>
    <rect x="10" y="112" width="280" height="86" rx="8" fill="#fff" stroke={VERT} strokeWidth="2.2"/>
    <T x={22} y={132} c={VERT} w={800}>Étape 2 : rapide</T><T x={22} y={154} w={700}>carbocation + Br⁻</T><T x={22} y={174} w={700}>→ 2-bromobutane</T><T x={288} y={190} a="end" c={ROUGE} w={800}>1 flèche courbe</T>
  </Svg>);

export const FStereo = () => (
  <Svg h={232} aria="Stéréochimie : le carbocation est plan ; Br moins peut l'attaquer par l'avant ou par l'arrière avec la même probabilité, ce qui donne les deux énantiomères R et S à 50 pour cent chacun, un mélange racémique dont la rotation optique est nulle">
    <ellipse cx="150" cy="104" rx="84" ry="13" fill="#e0f2fe" stroke={BLEU} strokeWidth="2"/><T x={150} y={109} a="middle" w={800}>C⁺</T>
    <T x={150} y={24} a="middle" w={800}>Br⁻</T><Fleche x1={150} y1={32} x2={150} y2={86} c={ROUGE} w={2.6}/><T x={170} y={60} c={GRIS}>avant</T>
    <T x={150} y={186} a="middle" w={800}>Br⁻</T><Fleche x1={150} y1={174} x2={150} y2={122} c={ROUGE} w={2.6}/><T x={170} y={150} c={GRIS}>arrière</T>
    <T x={150} y={208} a="middle" c={VERT} w={800}>(R) 50 % + (S) 50 %</T><T x={150} y={226} a="middle" c={GRIS}>racémique : α = 0</T>
  </Svg>);

export const FBilanMeca = () => (
  <Svg h={208} aria="Bilan : polariser pour repérer le site riche et le site pauvre, tracer les flèches courbes du doublet vers la lacune, lire le profil d'énergie, et se souvenir que le carbocation plan donne un mélange racémique">
    {[['Polariser', 'liaison π riche ; H δ+ pauvre'], ['Flèches courbes', 'du doublet vers la lacune'], ['Profil d’énergie', 'Eₐ = sommet − départ'], ['Carbocation plan', 'deux faces : racémique, α = 0']].map(([a, b], i) => <g key={a}>
      <rect x="10" y={8 + i * 48} width="280" height="40" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
      <circle cx="30" cy={28 + i * 48} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={33 + i * 48} a="middle" c={ORANGE} w={800}>{i + 1}</T>
      <T x={48} y={26 + i * 48} w={800}>{a}</T><T x={48} y={42 + i * 48} c={GRIS}>{b}</T></g>)}
    <T x={150} y={204} a="middle" c={GRIS}>la flèche suit toujours un doublet</T>
  </Svg>);
