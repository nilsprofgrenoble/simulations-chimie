// Schémas des cartes « À retenir » de la simulation 29 (courbes i-E et diagramme E-pH). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Axes = ({ y0 = 150 }) => <g><line x1="36" y1={y0} x2="292" y2={y0} stroke={GRIS} strokeWidth="1.5"/><line x1="36" y1={y0} x2="36" y2="14" stroke={GRIS} strokeWidth="1.5"/>
  <T x={42} y={16} c={GRIS}>E ↑</T><T x={292} y={y0 + 16} a="end" c={GRIS}>pH →</T></g>;
const yE = E => 96 - E * 38, xpH = p => 40 + p * 17.1;

export const SchemaMurs = () => (
  <Svg h={176} aria="Diagramme E-pH de l'eau : deux droites parallèles descendantes, le mur de l'oxydation en haut (O2) et le mur de la réduction en bas (H2) ; entre les deux, le courant est nul, c'est le domaine d'inertie électrochimique">
    <Axes y0={150}/>
    <polygon points={`${xpH(0)},${yE(1.23)} ${xpH(14)},${yE(1.23 - 0.826)} ${xpH(14)},${yE(-0.826)} ${xpH(0)},${yE(0)}`} fill="#dcfce7"/>
    <line x1={xpH(0)} y1={yE(1.23)} x2={xpH(14)} y2={yE(1.23 - 0.826)} stroke={ROUGE} strokeWidth="3"/>
    <line x1={xpH(0)} y1={yE(0)} x2={xpH(14)} y2={yE(-0.826)} stroke={BLEU} strokeWidth="3"/>
    <T x={44} y={34} c={ROUGE} w={700}>O₂ : E = 1,23 − 0,059·pH</T>
    <T x={150} y={96} a="middle" c={VERT} w={700}>courant nul</T>
    <T x={44} y={146} c={BLEU} w={700}>H₂ : E = −0,059·pH</T>
  </Svg>);

export const SchemaSurtension = () => (
  <Svg h={160} aria="À pH 0 : mur de la réduction de l'eau à 0 volt, mur thermodynamique de l'oxydation à 1,23 volt, mur observé sur platine 0,8 volt plus haut à 2,03 volts ; largeur du domaine d'inertie 2,03 volts">
    <line x1="70" y1="20" x2="70" y2="140" stroke={GRIS} strokeWidth="2"/>
    {[[140, '0 V', 'H⁺ / H₂ (mur bas)', BLEU], [85, '1,23 V', 'O₂ / H₂O (thermo.)', ROUGE], [41, '2,03 V', 'mur observé', ORANGE]].map(([y, v, n, c]) => <g key={v}><line x1="62" y1={y} x2="78" y2={y} stroke={c} strokeWidth="3"/><T x={86} y={y + 4} c={c} w={700}>{v}</T><T x={140} y={y + 4} c={c}>{n}</T></g>)}
    <path d="M 56 85 L 50 85 L 50 41 L 56 41" fill="none" stroke={ORANGE} strokeWidth="2.5"/><T x={46} y={66} a="end" c={ORANGE} w={700}>+0,8 V</T>
    <path d="M 100 141 L 100 41" fill="none" stroke="none"/>
    <T x={140} y={108} c={VERT} w={700}>largeur : 2,03 V</T><T x={140} y={125} c={GRIS}>(surtension sur Pt)</T>
  </Svg>);

export const SchemaTranslation = () => (
  <Svg h={160} aria="Le domaine d'inertie de l'eau est une bande verticale de largeur constante ; quand le pH augmente de 0 à 7, la bande se décale en bloc vers les potentiels plus faibles sans changer de largeur">
    <T x={66} y={14} a="middle" c={GRIS}>E ↑</T>
    <rect x="30" y="26" width="70" height="73" fill="#dcfce7" stroke={VERT} strokeWidth="2.5"/><T x={65} y={66} a="middle" c={VERT} w={700}>2,03 V</T><T x={65} y={118} a="middle" c={ENCRE} w={700}>pH 0</T>
    <rect x="130" y="41" width="70" height="73" fill="#dcfce7" stroke={VERT} strokeWidth="2.5"/><T x={165} y={81} a="middle" c={VERT} w={700}>2,03 V</T><T x={165} y={134} a="middle" c={ENCRE} w={700}>pH 7</T>
    <line x1="215" y1="26" x2="215" y2="46" stroke={ROUGE} strokeWidth="2.5"/><polygon points="215,56 208,44 222,44" fill={ROUGE}/>
    <T x={228} y={42} c={ROUGE} w={700}>décalage</T><T x={228} y={60} c={ROUGE}>en bloc</T>
    <T x={150} y={156} a="middle" c={GRIS}>même largeur à tout pH</T>
  </Svg>);

export const SchemaSansH = () => (
  <Svg h={176} aria="Diagramme E-pH : le couple Fe3+ / Fe2+ , dont la demi-équation ne contient pas H+, est une droite horizontale à 0,77 volt ; les murs de l'eau, eux, descendent quand le pH augmente">
    <Axes y0={150}/>
    <line x1={xpH(0)} y1={yE(1.23)} x2={xpH(14)} y2={yE(1.23 - 0.826)} stroke="#cbd5e1" strokeWidth="3"/><line x1={xpH(0)} y1={yE(0)} x2={xpH(14)} y2={yE(-0.826)} stroke="#cbd5e1" strokeWidth="3"/>
    <T x={150} y={30} a="middle" c="#94a3b8">murs de l’eau (pente)</T>
    <line x1={xpH(0)} y1={yE(0.77)} x2={xpH(14)} y2={yE(0.77)} stroke={ORANGE} strokeWidth="3.5"/>
    <T x={60} y={92} c={ORANGE} w={700}>Fe³⁺ / Fe²⁺ : 0,77 V</T>
    <T x={150} y={134} a="middle" c={ORANGE}>pas de H⁺ : horizontale</T>
  </Svg>);

export const SchemaPrecip = () => (
  <Svg h={142} aria="Le fer(III) est dissous en milieu acide, jusqu'à pH 2 environ ; au-delà, il précipite en hydroxyde de fer(III) solide et le modèle de vague d'espèces dissoutes n'est plus valable">
    <rect x={xpH(0)} y="26" width={xpH(2) - xpH(0)} height="42" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/>
    <rect x={xpH(2)} y="26" width={xpH(14) - xpH(2)} height="42" fill="#e2e8f0" stroke={GRIS} strokeWidth="2"/>
    <T x={xpH(1)} y={52} a="middle" c={VERT} w={700}>Fe³⁺</T><T x={xpH(8)} y={52} a="middle" c={GRIS} w={700}>Fe(OH)₃ solide</T>
    <line x1="40" y1="84" x2="280" y2="84" stroke={GRIS} strokeWidth="1.5"/>{[0, 2, 7, 14].map(p => <g key={p}><line x1={xpH(p)} y1="80" x2={xpH(p)} y2="88" stroke={GRIS} strokeWidth="1.5"/><T x={xpH(p)} y={102} a="middle" c={GRIS}>{p}</T></g>)}
    <T x={290} y={118} a="end" c={GRIS}>pH</T>
    <T x={150} y={136} a="middle" c={ROUGE} w={700}>un solide ne diffuse pas vers l’électrode</T>
  </Svg>);

export const SchemaPentes = () => (
  <Svg h={192} aria="Diagramme E-pH : selon le nombre m de H+ échangés, la droite du couple est horizontale pour m égal 0, de pente moins 0,059 pour m égal n, deux fois plus raide pour m égal 2n">
    <Axes y0={150}/>
    <line x1="40" y1="52" x2="280" y2="52" stroke={VERT} strokeWidth="3.5"/><T x={290} y={44} a="end" c={VERT} w={700}>m = 0</T>
    <line x1="40" y1="52" x2="280" y2="85" stroke={BLEU} strokeWidth="3.5"/><T x={290} y={76} a="end" c={BLEU} w={700}>m = n</T>
    <line x1="40" y1="52" x2="280" y2="118" stroke={ROUGE} strokeWidth="3.5"/><T x={290} y={134} a="end" c={ROUGE} w={700}>m = 2n</T>
    <T x={150} y={186} a="middle" c={ENCRE} w={700}>pente = −0,059 × m ÷ n</T>
  </Svg>);

export const SchemaRupture = () => (
  <Svg h={178} aria="Diagramme E-pH d'un couple acide-base : la droite change de pente au pH égal au pKa, là où l'espèce prédominante change">
    <Axes y0={130}/>
    <polyline points="40,36 200,72 280,84" fill="none" stroke={BLEU} strokeWidth="3.5"/>
    <line x1="200" y1="30" x2="200" y2="130" stroke={ORANGE} strokeWidth="2" strokeDasharray="5 4"/>
    <circle cx="200" cy="72" r="5.5" fill={ORANGE}/><T x={206} y={52} c={ORANGE} w={700}>pKa</T>
    <T x={150} y={172} a="middle" c={ORANGE}>changement d’espèce : rupture de pente</T>
  </Svg>);

export const SchemaCinetique = () => (
  <Svg h={170} aria="À pH 0 : le couple permanganate sur manganèse II, à 1,51 volt, est au-dessus du couple O2 sur H2O à 1,23 volt mais en dessous du mur observé à 2,03 volts ; la réaction avec l'eau est possible thermodynamiquement mais lente">
    <line x1="60" y1="20" x2="60" y2="150" stroke={GRIS} strokeWidth="2"/>
    <rect x="62" y="44" width="14" height="45" fill="#fed7aa" stroke={ORANGE} strokeWidth="1.5"/>
    {[[146, '0 V', 'mur bas', BLEU], [89, '1,23 V', 'O₂ / H₂O', ROUGE], [64, '1,51 V', 'MnO₄⁻ / Mn²⁺', VERT], [42, '2,03 V', 'mur observé', ORANGE]].map(([y, v, n, c]) => <g key={v}><line x1="54" y1={y} x2="76" y2={y} stroke={c} strokeWidth="3"/><T x={84} y={y + 4} c={c} w={700}>{v}</T><T x={136} y={y + 4} c={c}>{n}</T></g>)}
    <T x={150} y={112} c={ORANGE} w={700}>possible,</T><T x={150} y={130} c={ORANGE} w={700}>mais lent</T>
  </Svg>);
