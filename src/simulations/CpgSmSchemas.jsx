// Schémas des cartes « À retenir » de la simulation 55 (CPG couplée à la spectrométrie de masse). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FChaine = () => (
  <Svg h={168} aria="Chaîne CPG couplée à la spectrométrie de masse : la colonne sépare les composés ; sous vide, la source d'ions ionise et fragmente, le quadripôle trie les ions selon m sur z et le détecteur les compte ; à chaque instant on obtient un spectre de masse, et le courant ionique total est la somme de tous les ions">
    <rect x="76" y="6" width="220" height="92" rx="8" fill="#f8fafc" stroke={GRIS} strokeWidth="1.6" strokeDasharray="5 4"/><T x={186} y={22} a="middle" c={GRIS} w={700}>sous vide</T>
    {[[6, 62, 'Colonne', 'sépare', BLEU], [82, 58, 'Source', 'ionise', ORANGE], [154, 66, 'Quadripôle', 'trie m/z', ORANGE], [232, 62, 'Détecteur', 'compte', VERT]].map(([x, w, n, r, c]) => (
      <g key={n}><rect x={x} y="34" width={w} height="34" rx="6" fill="#fff" stroke={c} strokeWidth="2"/><text x={x + w / 2} y="56" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={c}>{n}</text><T x={x + w / 2} y={86} a="middle" c={GRIS}>{r}</T></g>))}
    <Fleche x1={68} y1={51} x2={80} y2={51}/><Fleche x1={140} y1={51} x2={152} y2={51}/><Fleche x1={220} y1={51} x2={230} y2={51}/>
    <T x={150} y={122} a="middle" w={700}>à chaque instant : un spectre de masse</T>
    <T x={150} y={144} a="middle" c={BLEU} w={800}>TIC = somme de tous les ions</T><T x={150} y={162} a="middle" c={GRIS}>(l’allure d’un chromatogramme)</T>
  </Svg>);

export const FSpectre = () => {
  const X = m => 24 + m * 3.9, B = 118, H = v => v * 0.8;
  return (
    <Svg h={190} aria="Lire un spectre de masse, exemple de l'acétone : le pic à m sur z 58 est l'ion moléculaire ; le pic de base à 43 est le plus intense, 100 pour cent ; le pic à 15 est un fragment ; une identification sûre associe un spectre concordant et un temps de rétention d'étalon identique">
      <T x={150} y={14} a="middle" c={GRIS}>acétone : M = 58 g/mol (valeurs indicatives)</T>
      <Lg x1={14} y1={B} x2={290} y2={B} c={GRIS} w={1.6}/>
      {[[15, 25, 'fragment', BLEU], [43, 100, 'pic de base', ORANGE], [58, 60, 'M⁺•', VERT]].map(([m, v, n, c]) => (
        <g key={m}><Lg x1={X(m)} y1={B} x2={X(m)} y2={B - H(v)} c={c} w={6}/><T x={X(m)} y={B + 14} a="middle" c={c} w={700}>{m}</T><T x={X(m)} y={B - H(v) - 6} a="middle" c={c} w={800}>{n}</T></g>))}
      <T x={286} y={B + 14} a="end" c={GRIS}>m/z</T>
      <T x={150} y={156} a="middle" w={700}>identification sûre :</T><T x={150} y={174} a="middle" c={VERT} w={800}>spectre concordant + temps de rétention</T>
    </Svg>);
};

export const FIsotopes = () => (
  <Svg h={172} aria="Motifs isotopiques : un atome de chlore donne deux ions séparés de deux unités dans le rapport trois pour un ; un atome de brome donne deux ions séparés de deux unités dans le rapport un pour un">
    {[[78, 'un Cl', 'rapport 3 : 1', 62, 21, BLEU], [222, 'un Br', 'rapport 1 : 1', 42, 42, ORANGE]].map(([cx, n, r, h1, h2, c]) => (
      <g key={n}><T x={cx} y={18} a="middle" c={c} w={800}>{n}</T>
        <Lg x1={cx - 54} y1={102} x2={cx + 54} y2={102} c={GRIS} w={1.6}/>
        <Lg x1={cx - 22} y1={102} x2={cx - 22} y2={102 - h1} c={c} w={9}/><Lg x1={cx + 22} y1={102} x2={cx + 22} y2={102 - h2} c={c} w={9}/>
        <T x={cx - 22} y={118} a="middle" c={GRIS}>M</T><T x={cx + 22} y={118} a="middle" c={GRIS}>M+2</T>
        <T x={cx} y={140} a="middle" w={800}>{r}</T></g>))}
    <T x={150} y={164} a="middle" c={GRIS}>deux ions espacés de 2 unités : signature</T>
  </Svg>);

export const FCoelution = () => (
  <Svg h={196} aria="Co-élution : deux composés qui sortent ensemble donnent un seul pic du courant ionique total ; en extrayant l'ion propre à chaque composé, on obtient deux courbes dont les maxima sont à des instants légèrement différents">
    <T x={14} y={16} w={800}>TIC : un seul pic</T>
    <path d="M14,78 C70,78 86,32 122,32 C158,32 174,78 230,78" fill="none" stroke={GRIS} strokeWidth="3"/><Lg x1={14} y1={78} x2={290} y2={78} c={GRIS} w={1.4}/>
    <T x={14} y={100} c={ORANGE} w={800}>ion extrait propre à A</T>
    <T x={14} y={116} c={BLEU} w={800}>ion extrait propre à B</T>
    <path d="M14,172 C60,172 76,134 112,134 C148,134 164,172 210,172" fill="none" stroke={ORANGE} strokeWidth="3"/>
    <path d="M14,172 C70,172 90,134 132,134 C174,134 190,172 246,172" fill="none" stroke={BLEU} strokeWidth="3"/>
    <Lg x1={14} y1={172} x2={290} y2={172} c={GRIS} w={1.4}/>
    <Lg x1={112} y1={128} x2={112} y2={172} c={ORANGE} w={1.4} d="3 3"/><Lg x1={132} y1={128} x2={132} y2={172} c={BLEU} w={1.4} d="3 3"/>
    <T x={150} y={190} a="middle" c={GRIS}>maxima décalés : on les sépare</T>
  </Svg>);

export const FPlage = () => {
  const X = m => 20 + m * 2.15;
  return (
    <Svg h={184} aria="Choisir la plage de m sur z : le début de la plage est placé au-dessus des ions du fond, eau 18, azote 28 et oxygène 32, mais en dessous des ions utiles des composés cherchés">
      <rect x={X(40)} y="22" width={X(120) - X(40)} height="76" rx="4" fill="#dcfce7" stroke={VERT} strokeWidth="2"/><T x={(X(40) + X(120)) / 2} y={40} a="middle" c={VERT} w={800}>plage balayée</T>
      <Lg x1={14} y1={98} x2={290} y2={98} c={GRIS} w={1.6}/>
      {[18, 28, 32].map(m => <Lg key={m} x1={X(m)} y1={98} x2={X(m)} y2={66} c={ROUGE} w={6}/>)}<T x={X(25)} y={58} a="middle" c={ROUGE} w={800}>fond</T>
      <Lg x1={X(91)} y1={98} x2={X(91)} y2={52} c={ORANGE} w={6}/><T x={X(91) + 8} y={78} c={ORANGE} w={800}>ion utile</T>
      {[0, 40, 80, 120].map(m => <T key={m} x={X(m)} y={114} a="middle" c={GRIS}>{m}</T>)}<T x={150} y={130} a="middle" c={GRIS}>m/z</T>
      <T x={150} y={152} a="middle" c={ROUGE} w={800}>fond : à exclure (18, 28, 32)</T><T x={150} y={170} a="middle" c={VERT} w={800}>mais couvrir les ions du composé cherché</T>
    </Svg>);
};

export const FDiagnostic = () => (
  <Svg h={196} aria="Diagnostiquer le fond : une fuite d'air donne les ions 28 et 32 dans le rapport 4 pour 1 ; le ressuage de la colonne donne les ions 73, 207 et 281 et un fond qui monte avec la température du four">
    {[[6, 'Fuite d’air', ROUGE], [154, 'Ressuage', ORANGE]].map(([x, n, c]) => <g key={n}><rect x={x} y="8" width="140" height="140" rx="8" fill="#fff" stroke={c} strokeWidth="2"/><T x={x + 70} y={28} a="middle" c={c} w={800}>{n}</T></g>)}
    <Lg x1={22} y1={104} x2={130} y2={104} c={GRIS} w={1.4}/><Lg x1={52} y1={104} x2={52} y2={58} c={ROUGE} w={9}/><Lg x1={96} y1={104} x2={96} y2={92} c={ROUGE} w={9}/>
    <T x={52} y={120} a="middle" c={GRIS}>28</T><T x={96} y={120} a="middle" c={GRIS}>32</T><T x={76} y={140} a="middle" w={700}>rapport ≈ 4 : 1</T>
    <path d="M170,104 C200,104 230,100 250,84 C262,72 268,60 272,52" fill="none" stroke={ORANGE} strokeWidth="3"/><Lg x1={170} y1={106} x2={282} y2={106} c={GRIS} w={1.4}/>
    <T x={226} y={122} a="middle" c={GRIS}>m/z 73, 207, 281</T><T x={226} y={140} a="middle" w={700}>monte avec T du four</T>
    <T x={150} y={172} a="middle" w={700}>on regarde le spectre du fond</T><T x={150} y={190} a="middle" c={GRIS}>entre deux pics du chromatogramme</T>
  </Svg>);
