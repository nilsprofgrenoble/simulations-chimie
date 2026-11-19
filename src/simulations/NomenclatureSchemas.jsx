// Schémas des cartes « À retenir » de la simulation 102 (nomenclature et groupes caractéristiques). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400, s = 12.5 }) => <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2 }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round"/>;
const lar = s => s.length * 7.3;   // largeur approchée d'une étiquette

// Chaîne en formule semi-développée : gr = liste d'étiquettes, col = couleurs par rang, x0 = centre du 1er groupe, dx = pas, y = ligne de base.
const Chaine = ({ x0, dx, y, gr, col = {} }) => (
  <g>
    {gr.map((g, i) => <T key={'t' + i} x={x0 + i * dx} y={y} a="middle" c={col[i] || ENCRE} w={600}>{g}</T>)}
    {gr.slice(0, -1).map((g, i) => <Lg key={'b' + i} x1={x0 + i * dx + lar(g) / 2 + 3} y1={y - 4.5} x2={x0 + (i + 1) * dx - lar(gr[i + 1]) / 2 - 3} y2={y - 4.5} c={col[i] === ORANGE && col[i + 1] === ORANGE ? ORANGE : ENCRE}/>)}
  </g>);
// Liaison verticale entre deux étiquettes (ramification ou groupe sous la chaîne)
const Vert = ({ x, y1, y2, c = ENCRE }) => <Lg x1={x} y1={y1} x2={x} y2={y2} c={c}/>;
// Carbonyle : O au-dessus du carbone, double liaison
const Oxo = ({ x, y, c = ORANGE }) => (<g><T x={x} y={y - 28} a="middle" c={c} w={700}>O</T><Lg x1={x - 2.6} y1={y - 24} x2={x - 2.6} y2={y - 13} c={c}/><Lg x1={x + 2.6} y1={y - 24} x2={x + 2.6} y2={y - 13} c={c}/></g>);

export const FQuatre = () => (
  <Svg h={156} aria="Un carbone fait toujours quatre liaisons : le méthane CH4 a quatre atomes H ; dans le butane, un carbone d'extrémité a un voisin carbone et trois H, un carbone du milieu a deux voisins carbone et deux H ; règle : nombre de H égal 4 moins le nombre de voisins carbone">
    <T x={150} y={16} a="middle" c={GRIS} w={700}>un carbone fait toujours 4 liaisons</T>
    <T x={44} y={66} a="middle" c={ENCRE} w={700}>C</T>
    <Lg x1={44} y1={52} x2={44} y2={42}/><Lg x1={44} y1={72} x2={44} y2={82}/><Lg x1={34} y1={62} x2={24} y2={62}/><Lg x1={54} y1={62} x2={64} y2={62}/>
    {[[44, 38], [44, 94], [18, 66], [70, 66]].map(([x, y], i) => <T key={i} x={x} y={y} a="middle" c={ORANGE} w={700}>H</T>)}
    <T x={44} y={118} a="middle" c={GRIS}>méthane</T>
    <Chaine x0={134} dx={44} y={66} gr={['CH₃', 'CH₂', 'CH₂', 'CH₃']}/>
    {[['3 H', 134], ['2 H', 178], ['2 H', 222], ['3 H', 266]].map(([t, x]) => <T key={x} x={x} y={92} a="middle" c={ORANGE} w={700}>{t}</T>)}
    <T x={200} y={118} a="middle" c={GRIS}>butane</T>
    <T x={150} y={146} a="middle" c={VERT} w={700}>H = 4 − nombre de voisins C</T>
  </Svg>);

export const FPrefixes = () => (
  <Svg h={186} aria="Les six premiers préfixes : 1 carbone méth, 2 éth, 3 prop, 4 but, 5 pent, 6 hex, suivis de ane pour un alcane linéaire">
    {[['méth', 'méthane'], ['éth', 'éthane'], ['prop', 'propane'], ['but', 'butane'], ['pent', 'pentane'], ['hex', 'hexane']].map(([p, nom], i) => {
      const y = 22 + i * 25, n = i + 1;
      return (<g key={p}>
        {Array.from({ length: n - 1 }, (_, k) => <Lg key={'l' + k} x1={14 + k * 13} y1={y - 4} x2={14 + (k + 1) * 13} y2={y - 4} c={BLEU} w={2}/>)}
        {Array.from({ length: n }, (_, k) => <circle key={'c' + k} cx={14 + k * 13} cy={y - 4} r="4.5" fill={BLEU}/>)}
        <T x={116} y={y} a="end" c={GRIS} w={700}>{n} C</T>
        <T x={128} y={y} c={ORANGE} w={800}>{p}</T><T x={166} y={y} c={GRIS}>+ ane</T>
        <T x={212} y={y} c={VERT} w={700}>{nom}</T>
      </g>);
    })}
    <T x={150} y={180} a="middle" c={GRIS}>les quatre premiers : à savoir par cœur</T>
  </Svg>);

export const FRamifie = () => (
  <Svg h={206} aria="Nommer un alcane ramifié en quatre temps, sur l'exemple du 2-méthylbutane : chaîne principale la plus longue de 4 carbones, numéros les plus petits, ramification d'un carbone appelée méthyle, nom assemblé 2-méthylbutane">
    <T x={114} y={34} a="middle" c={BLEU} w={700}>CH₃</T><Vert x={114} y1={40} y2={58} c={BLEU}/>
    <Chaine x0={70} dx={44} y={82} gr={['CH₃', 'CH', 'CH₂', 'CH₃']} col={{ 1: BLEU }}/>
    {[1, 2, 3, 4].map((n, i) => <T key={n} x={70 + i * 44} y={104} a="middle" c={ORANGE} w={700}>{n}</T>)}
    {[['1', 'chaîne la plus longue : 4 C', 'butane'], ['2', 'numéros les plus petits', 'méthyle en 2'], ['3', 'ramification de 1 C', 'méthyle'], ['4', 'on assemble', '2-méthylbutane']].map(([n, t, r], i) => (
      <g key={n}><circle cx="14" cy={130 + i * 22 - 4} r="8" fill={i === 3 ? VERT : ORANGE}/><T x={14} y={130 + i * 22} a="middle" c="#fff" w={800}>{n}</T>
        <T x={28} y={130 + i * 22} c={i === 3 ? VERT : ENCRE} w={i === 3 ? 700 : 400}>{i === 3 ? t + ' : ' + r : t + ' → ' + r}</T></g>))}
  </Svg>);

export const FAnatomie = () => (
  <Svg h={196} aria="Les morceaux du nom 2,4-diméthylhexane : les numéros séparés par une virgule, un tiret entre numéro et lettre, di pour deux substituants identiques, méthyl pour la ramification, hexane pour la chaîne principale ; substituants différents dans l'ordre alphabétique">
    <T x={150} y={18} a="middle" c={ENCRE} w={800} s={15}>2,4-diméthylhexane</T>
    {[['2,4', ORANGE, 'numéros, séparés par une virgule'], ['-', GRIS, 'tiret : entre numéro et lettre'], ['di', BLEU, 'deux fois le même (tri : trois)'], ['méthyl', BLEU, 'la ramification (1 C)'], ['hexane', VERT, 'la chaîne principale (6 C)']].map(([m, c, t], i) => (
      <g key={m}><rect x="8" y={30 + i * 26} width="66" height="21" rx="6" fill="#fff" stroke={c} strokeWidth="2"/>
        <T x={41} y={45 + i * 26} a="middle" c={c} w={700}>{m}</T><T x={82} y={45 + i * 26} c={ENCRE}>{t}</T></g>))}
    <T x={150} y={180} a="middle" c={GRIS}>substituants différents : ordre alphabétique</T>
  </Svg>);

export const FFamilles = () => (
  <Svg h={214} aria="Quatre familles : alcool avec le groupe OH ; aldéhyde avec C double liaison O en bout de chaîne, lié à H ; cétone avec C double liaison O au milieu de la chaîne ; acide carboxylique avec C double liaison O et OH sur le même carbone">
    {[[8, 'alcool', ORANGE], [158, 'aldéhyde', ORANGE], [8, 'cétone', ORANGE], [158, 'acide carboxylique', ORANGE]].map(([x, nom, c], i) => (
      <T key={nom} x={x} y={(i < 2 ? 14 : 104)} c={c} w={800}>{nom}</T>))}
    <Chaine x0={26} dx={42} y={62} gr={['CH₃', 'CH₂', 'OH']} col={{ 2: ORANGE }}/>
    <Chaine x0={176} dx={38} y={62} gr={['CH₃', 'CH₂', 'C', 'H']} col={{ 2: ORANGE, 3: ORANGE }}/><Oxo x={176 + 76} y={62}/>
    <Chaine x0={26} dx={42} y={152} gr={['CH₃', 'C', 'CH₃']} col={{ 1: ORANGE }}/><Oxo x={26 + 42} y={152}/>
    <Chaine x0={176} dx={42} y={152} gr={['CH₃', 'C', 'OH']} col={{ 1: ORANGE, 2: ORANGE }}/><Oxo x={176 + 42} y={152}/>
    <T x={150} y={204} a="middle" c={GRIS}>C=O en bout : aldéhyde · au milieu : cétone</T>
  </Svg>);

export const FSuffixes = () => (
  <Svg h={178} aria="Les suffixes : alcool ol, aldéhyde al, cétone one, acide carboxylique oïque ; le nom est celui de l'alcane sans son e final, puis le suffixe ; exemples sur quatre carbones">
    <T x={8} y={16} c={GRIS} w={700}>famille</T><T x={112} y={16} c={GRIS} w={700}>suffixe</T><T x={170} y={16} c={GRIS} w={700}>exemple (4 C)</T>
    {[['alcool', 'ol', 'butan-2-ol'], ['aldéhyde', 'al', 'butanal'], ['cétone', 'one', 'butanone'], ['acide', 'oïque', 'acide butanoïque']].map(([f, s, ex], i) => (
      <g key={f}><T x={8} y={44 + i * 28} c={ENCRE} w={700}>{f}</T>
        <rect x="106" y={28 + i * 28} width="52" height="22" rx="6" fill="#fff7ed" stroke={ORANGE} strokeWidth="2"/><T x={132} y={44 + i * 28} a="middle" c={ORANGE} w={800}>{s}</T>
        <T x={170} y={44 + i * 28} c={VERT} w={700}>{ex}</T></g>))}
    <T x={150} y={152} a="middle" c={GRIS}>nom = alcane sans son « e » + suffixe</T>
    <T x={150} y={170} a="middle" c={GRIS}>butane → butan-ol, butan-al…</T>
  </Svg>);

export const FNumero = () => (
  <Svg h={190} aria="Où mettre le numéro : sur l'hexan-3-ol, numéroter dans les deux sens ; le groupe OH est au carbone 3 dans un sens et 4 dans l'autre, on garde le plus petit ; un aldéhyde ou un acide a son groupe au carbone 1, sans numéro">
    <T x={150} y={14} a="middle" c={GRIS} w={700}>on numérote dans les deux sens</T>
    {[1, 2, 3, 4, 5, 6].map((n, i) => <T key={'a' + n} x={30 + i * 48} y={34} a="middle" c={BLEU} w={700}>{n}</T>)}
    {[6, 5, 4, 3, 2, 1].map((n, i) => <T key={'b' + n} x={30 + i * 48} y={52} a="middle" c={ORANGE} w={700}>{n}</T>)}
    <Chaine x0={30} dx={48} y={80} gr={['CH₃', 'CH₂', 'CH', 'CH₂', 'CH₂', 'CH₃']} col={{ 2: ORANGE }}/>
    <Vert x={126} y1={88} y2={100} c={ORANGE}/><T x={126} y={114} a="middle" c={ORANGE} w={700}>OH</T>
    <T x={150} y={140} a="middle" c={ENCRE}>OH : n° 3 (bleu) ou n° 4 (orange)</T>
    <T x={150} y={158} a="middle" c={VERT} w={700}>on garde le plus petit : hexan-3-ol</T>
    <T x={150} y={180} a="middle" c={GRIS}>aldéhyde, acide : groupe en C 1, pas de numéro</T>
  </Svg>);

export const FLire = () => (
  <Svg h={198} aria="Du nom à la formule sur le 2,3-diméthylpentane : pentane donne une chaîne de 5 carbones, diméthyl deux groupes CH3, les numéros 2 et 3 placent ces groupes sur les carbones 2 et 3">
    <T x={150} y={16} a="middle" c={ENCRE} w={800} s={15}>2,3-diméthylpentane</T>
    <T x={94} y={50} a="middle" c={BLEU} w={700}>CH₃</T><Vert x={94} y1={56} y2={70} c={BLEU}/>
    <T x={138} y={50} a="middle" c={BLEU} w={700}>CH₃</T><Vert x={138} y1={56} y2={70} c={BLEU}/>
    <Chaine x0={50} dx={44} y={92} gr={['CH₃', 'CH', 'CH', 'CH₂', 'CH₃']} col={{ 1: BLEU, 2: BLEU }}/>
    {[1, 2, 3, 4, 5].map((n, i) => <T key={n} x={50 + i * 44} y={114} a="middle" c={ORANGE} w={700}>{n}</T>)}
    {[['pentane', 'chaîne de 5 C', VERT], ['diméthyl', 'deux CH₃ ramifiés', BLEU], ['2,3', 'sur les carbones 2 et 3', ORANGE]].map(([m, t, c], i) => (
      <g key={m}><T x={8} y={146 + i * 20} c={c} w={800}>{m}</T><T x={96} y={146 + i * 20} c={ENCRE}>→ {t}</T></g>))}
  </Svg>);
