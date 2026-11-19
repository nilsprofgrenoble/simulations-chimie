// Schémas des cartes « À retenir » de la simulation 73 (diffraction des rayons X). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};

export const FBragg = () => (
  <Svg h={196} aria="Loi de Bragg : deux rayons X parallèles frappent deux plans atomiques voisins séparés par la distance d, avec l'angle thêta ; le rayon du plan du dessous fait un chemin plus long de delta égal à deux d sinus thêta ; les ondes sont en phase si delta est un nombre entier de longueurs d'onde">
    {[78, 138].map(y => <g key={y}><Lg x1={14} y1={y} x2={286} y2={y} c={GRIS} w={2.4}/>{[44, 94, 144, 194, 244].map(x => <circle key={x} cx={x} cy={y} r="5.5" fill={GRIS}/>)}</g>)}
    <polyline points="22,40 68,78 114,40" fill="none" stroke={BLEU} strokeWidth="2.6"/>
    <polyline points="64,40 134,138 204,40" fill="none" stroke={ORANGE} strokeWidth="2.6"/>
    <path d="M44,78 A24 24 0 0 1 56,62" fill="none" stroke={ENCRE} strokeWidth="1.8"/><T x={30} y={70} c={ENCRE} w={800}>θ</T>
    <Lg x1={270} y1={80} x2={270} y2={136} c={ENCRE} w={1.8}/><Lg x1={264} y1={80} x2={276} y2={80} c={ENCRE} w={1.8}/><Lg x1={264} y1={136} x2={276} y2={136} c={ENCRE} w={1.8}/>
    <T x={262} y={112} a="end" w={800}>d</T>
    <T x={14} y={98} c={GRIS}>plan 1</T><T x={14} y={158} c={GRIS}>plan 2</T>
    <T x={150} y={182} a="middle" c={ORANGE} w={800}>δ = 2 d sin θ : chemin en plus</T>
  </Svg>);

const Maille = ({ x, y, s = 52, centre, faces }) => {
  const o = 16, f = [[x, y + o], [x + s, y + o], [x, y + s + o], [x + s, y + s + o]], b = f.map(([a, c]) => [a + o, c - o]);
  return (<g>
    <rect x={x + o} y={y} width={s} height={s} fill="none" stroke={GRIS} strokeWidth="1.4" strokeDasharray="3 3"/>
    <rect x={x} y={y + o} width={s} height={s} fill="#f1f5f9" stroke={GRIS} strokeWidth="2"/>
    {[0, 1, 3].map(k => <Lg key={k} x1={f[k][0]} y1={f[k][1]} x2={b[k][0]} y2={b[k][1]} c={GRIS} w={2}/>)}
    <Lg x1={b[0][0]} y1={b[0][1]} x2={b[1][0]} y2={b[1][1]} c={GRIS} w={2}/><Lg x1={b[1][0]} y1={b[1][1]} x2={b[3][0]} y2={b[3][1]} c={GRIS} w={2}/>
    {[...f, ...b].map(([a, c], i) => <circle key={i} cx={a} cy={c} r="5" fill={BLEU}/>)}
    {centre && <circle cx={x + s / 2 + o / 2} cy={y + s / 2 + o / 2} r="6" fill={ORANGE}/>}
    {faces && [[x + s / 2, y + s / 2 + o], [x + s / 2 + o, y + s / 2], [x + s + o / 2, y + s / 2 + o / 2], [x + o / 2, y + s / 2 + o / 2], [x + s / 2 + o / 2, y + o / 2], [x + s / 2 + o / 2, y + s + o / 2]].map(([a, c], i) => <circle key={i} cx={a} cy={c} r="5" fill={ORANGE}/>)}
  </g>);
};
export const FExtinctions = () => (
  <Svg h={204} aria="Trois réseaux cubiques : le cubique simple P a des atomes aux sommets et tous les plans hkl donnent un pic ; le cubique centré I a un atome au centre en plus et seuls les plans avec h plus k plus l pair donnent un pic ; le cubique à faces centrées F a des atomes au centre des faces et seuls les plans avec h, k et l de même parité donnent un pic">
    <Maille x={12} y={16}/><Maille x={110} y={16} centre/><Maille x={208} y={16} faces/>
    <T x={52} y={110} a="middle" c={BLEU} w={800}>P</T><T x={150} y={110} a="middle" c={BLEU} w={800}>I</T><T x={248} y={110} a="middle" c={BLEU} w={800}>F</T>
    <T x={52} y={130} a="middle" c={GRIS}>simple</T><T x={150} y={130} a="middle" c={GRIS}>centré</T><T x={248} y={130} a="middle" c={GRIS}>faces centrées</T>
    <T x={52} y={162} a="middle" c={VERT} w={800}>tous (hkl)</T><T x={150} y={162} a="middle" c={VERT} w={800}>h + k + l pair</T><T x={248} y={162} a="middle" c={VERT} w={800}>même parité</T>
    <T x={150} y={190} a="middle" c={GRIS}>les autres plans : pic éteint</T>
  </Svg>);

export const FRapports = () => (
  <Svg h={176} aria="Les rapports de sinus carré thêta ne dépendent pas du paramètre de maille : pour deux valeurs de a, les pics se décalent mais leurs rapports restent 1, 2, 3, 4, 5 : seule la structure les fixe">
    <Lg x1={14} y1={64} x2={286} y2={64} c={GRIS} w={2}/><Lg x1={14} y1={138} x2={286} y2={138} c={GRIS} w={2}/>
    {[1, 2, 3, 4, 5].map(k => <g key={k}><Lg x1={14 + k * 42} y1={64} x2={14 + k * 42} y2={44} c={BLEU} w={3}/><T x={14 + k * 42} y={36} a="middle" c={BLEU} w={800}>{k}</T></g>)}
    {[1, 2, 3, 4, 5].map(k => <g key={k}><Lg x1={14 + k * 28} y1={138} x2={14 + k * 28} y2={118} c={ORANGE} w={3}/><T x={14 + k * 28} y={110} a="middle" c={ORANGE} w={800}>{k}</T></g>)}
    <T x={286} y={82} a="end" c={GRIS}>a grand</T><T x={286} y={156} a="end" c={GRIS}>a plus petit</T>
    <T x={10} y={16} w={800}>sin²θ : pics numérotés par N</T>
    <T x={150} y={172} a="middle" c={GRIS}>l’échelle change, pas les rapports</T>
  </Svg>);

export const FModele = () => (
  <Svg h={224} aria="Démarche d'identification : relever les pics, calculer les rapports de sinus carré thêta, tester un modèle P, I ou F où les N sont permis et où a est constant, puis moyenner a et confirmer par la masse volumique">
    {[['1  Relever les 2θ de tous les pics', BLEU], ['2  Rapports sin²θ ÷ sin²θ du 1ᵉʳ pic', BLEU], ['3  Tester P, I, F : N permis, a constant', ORANGE], ['4  a moyen, puis masse volumique', VERT]].map(([t, c], i) => <g key={t}>
      <rect x="10" y={8 + i * 52} width="280" height="38" rx="8" fill="#fff" stroke={c} strokeWidth="2.2"/><T x={22} y={32 + i * 52} w={700}>{t}</T>
      {i < 3 && <Fleche x1={150} y1={46 + i * 52} x2={150} y2={60 + i * 52} c={GRIS} w={2}/>}</g>)}
  </Svg>);

export const FDensite = () => (
  <Svg h={196} aria="Masse volumique d'un cristal cubique : la masse d'une maille est n fois la masse d'un atome, soit n M sur N A, et son volume est a au cube ; n vaut 1 pour P, 2 pour I et 4 pour F">
    <Maille x={30} y={30} s={80} centre/>
    <Lg x1={30} y1={138} x2={110} y2={138} c={ENCRE} w={1.8}/><Lg x1={30} y1={132} x2={30} y2={144} c={ENCRE} w={1.8}/><Lg x1={110} y1={132} x2={110} y2={144} c={ENCRE} w={1.8}/>
    <T x={70} y={160} a="middle" w={800}>a</T>
    <T x={150} y={60} c={BLEU} w={800}>masse : n atomes</T><T x={150} y={82} c={ORANGE} w={800}>volume : a³</T>
    <T x={150} y={112} c={GRIS}>n = 1 (P), 2 (I), 4 (F)</T>
    <T x={150} y={188} a="middle" c={GRIS}>a en cm : 1 nm = 10⁻⁷ cm</T>
  </Svg>);
