// Schémas des cartes « À retenir » de la simulation 100 (épaississants associatifs). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const Axes = ({ x0 = 40, y0 = 150, x1 = 284, y1 = 14, lx, ly }) => <g><Lg x1={x0} y1={y0} x2={x1} y2={y0} c={GRIS} w={1.8}/><Lg x1={x0} y1={y0} x2={x0} y2={y1} c={GRIS} w={1.8}/><T x={x1} y={y0 + 16} a="end" c={GRIS} w={700}>{lx}</T><T x={x0 - 6} y={y1 + 4} a="end" c={GRIS} w={700}>{ly}</T></g>;
// Particule de TiO₂, gant (arc ouvert à droite), crochet (J)
const Part = ({ x, y, r = 11 }) => <g><circle cx={x} cy={y} r={r} fill="#e2e8f0" stroke={GRIS} strokeWidth="2"/></g>;
const Gant = ({ x, y, c = ORANGE }) => <path d={`M${x + 12},${y - 13} A15,15 0 1,0 ${x + 12},${y + 13}`} fill="none" stroke={c} strokeWidth="5" strokeLinecap="round"/>;
const Crochet = ({ x, y, c = BLEU, sens = 1 }) => <path d={`M${x},${y + 14} L${x},${y - 6} Q${x},${y - 16} ${x + 9 * sens},${y - 16} Q${x + 18 * sens},${y - 16} ${x + 18 * sens},${y - 8}`} fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>;

export const FGantsCrochets = () => (
  <Svg h={204} aria="Gants et crochets : un gant peut attraper une particule de TiO2, liaison associative forte, ou un autre gant, liaison auto-associante lâche ; un crochet ne s'accroche qu'à un autre crochet, liaison lâche, et n'a aucune prise sur une particule">
    <Gant x={40} y={26}/><Part x={50} y={26}/><T x={86} y={31} c={ORANGE} w={800}>gant + particule : forte</T>
    <Gant x={40} y={70}/><Gant x={58} y={70} c={ORANGE}/><T x={86} y={75} c={ORANGE} w={800}>gant + gant : lâche</T>
    <Crochet x={36} y={116}/><Crochet x={66} y={116} sens={-1}/><T x={86} y={121} c={BLEU} w={800}>crochet + crochet : lâche</T>
    <Crochet x={36} y={162}/><Part x={64} y={162}/><T x={86} y={167} c={ROUGE} w={800}>crochet + particule : rien</T>
    <T x={150} y={196} a="middle" c={GRIS}>particule = TiO₂ (pigment)</T>
  </Svg>);

export const FViscosite = () => (
  <Svg h={214} aria="Viscosité en fonction du gradient de vitesse, échelles logarithmiques : le Thixol, un HASE, a une viscosité forte à bas gradient qui s'effondre à haut gradient ; le Coapur, un HEUR, garde une viscosité quasi constante ; le bas gradient correspond au pot et au mur frais, le haut gradient à l'application au rouleau">
    <rect x="40" y="14" width="70" height="136" fill="#dcfce7" opacity="0.7"/><rect x="196" y="14" width="88" height="136" fill="#dbeafe" opacity="0.8"/>
    <Axes lx="γ̇ (log)" ly="η"/>
    <path d="M40,34 C100,34 130,38 150,70 C170,104 200,124 284,128" fill="none" stroke={ORANGE} strokeWidth="3"/>
    <path d="M40,90 C120,90 200,86 284,82" fill="none" stroke={BLEU} strokeWidth="3"/>
    <T x={44} y={30} c={ORANGE} w={800}>HASE</T><T x={250} y={120} c={ORANGE} w={800} a="middle">HASE</T><T x={72} y={106} c={BLEU} w={800}>HEUR</T>
    <T x={75} y={188} a="middle" c={VERT} w={700}>pot, mur frais</T><T x={240} y={188} a="middle" c={BLEU} w={700}>application</T>
    <T x={150} y={206} a="middle" c={GRIS}>HASE : bas gradient ; HEUR : haut gradient</T>
  </Svg>);

export const FEcoulement = () => (
  <Svg h={196} aria="Courbe d'écoulement, contrainte en fonction du gradient : un fluide newtonien, le Coapur, donne une droite passant par l'origine dont la pente est la viscosité ; un fluide rhéofluidifiant, le Thixol, donne une courbe dont la pente diminue quand le gradient augmente">
    <Axes lx="γ̇" ly="τ"/>
    <Lg x1={40} y1={150} x2={276} y2={36} c={BLEU} w={3}/><T x={196} y={50} c={BLEU} w={800}>newtonien</T>
    <path d="M40,150 C70,96 120,80 280,72" fill="none" stroke={ORANGE} strokeWidth="3"/><T x={196} y={112} c={ORANGE} w={800}>rhéofluidifiant</T>
    <Lg x1={86} y1={128} x2={130} y2={106} c={GRIS} w={1.4} d="3 3"/>
    <T x={150} y={188} a="middle" w={800}>pente de la courbe = viscosité η</T>
  </Svg>);

export const F3ITT = () => (
  <Svg h={222} aria="Test en trois intervalles : à bas gradient la viscosité initiale est élevée ; à haut gradient elle chute ; pendant le repos elle remonte lentement mais sans retrouver sa valeur initiale ; la régénération compare la viscosité finale à la viscosité initiale">
    <Axes y0={140} lx="t" ly="η"/>
    <Lg x1={80} y1={20} x2={80} y2={140} c={GRIS} w={1.2} d="3 3"/><Lg x1={120} y1={20} x2={120} y2={140} c={GRIS} w={1.2} d="3 3"/>
    <T x={60} y={16} a="middle" c={GRIS} w={700}>bas</T><T x={100} y={16} a="middle" c={ROUGE} w={700}>haut</T><T x={202} y={16} a="middle" c={GRIS} w={700}>repos</T>
    <path d="M40,44 L80,44 L80,122 L120,122 C150,122 160,76 200,70 C240,64 262,62 284,60" fill="none" stroke={ORANGE} strokeWidth="3"/>
    <Lg x1={40} y1={44} x2={284} y2={44} c={BLEU} w={1.2} d="4 3"/><T x={286} y={40} a="end" c={BLEU} w={700}>η initiale</T>
    <T x={286} y={80} a="end" c={ORANGE} w={700}>η finale</T>
    <T x={150} y={172} a="middle" w={800}>le réseau se reforme lentement</T><T x={150} y={192} a="middle" c={GRIS}>bas, haut : gradient γ̇ appliqué</T><T x={150} y={210} a="middle" c={GRIS}>régénération : η finale par rapport à η initiale</T>
  </Svg>);

export const FASE = () => (
  <Svg h={196} aria="Mode d'action d'un ASE : à pH acide, les groupes acide carboxylique ne sont pas ionisés et la chaîne reste enroulée ; après neutralisation, ils deviennent des groupes carboxylate chargés négativement qui se repoussent, la chaîne se déploie et gonfle, ce qui épaissit">
    <T x={14} y={20} w={800}>pH acide : –COOH</T>
    <path d="M30,60 C30,36 70,36 70,56 C70,76 44,76 44,58 C44,50 56,48 58,56" fill="none" stroke={BLEU} strokeWidth="3.5" strokeLinecap="round"/><T x={108} y={62} c={GRIS}>chaîne enroulée</T>
    <Fleche x1={150} y1={86} x2={150} y2={112} c={ORANGE} w={3}/><T x={162} y={104} c={ORANGE} w={800}>+ base (pH 8–9)</T>
    <T x={14} y={132} w={800}>neutralisé : –COO⁻</T>
    <path d="M24,160 C70,134 110,184 160,158 C200,138 240,178 280,156" fill="none" stroke={BLEU} strokeWidth="3.5" strokeLinecap="round"/>
    {[[48, 142], [100, 172], [148, 150], [196, 164], [248, 150]].map(([x, y]) => <text key={x} x={x} y={y} textAnchor="middle" fontSize="14" fontWeight="800" fill={ROUGE}>−</text>)}
    <T x={150} y={190} a="middle" c={ROUGE} w={800}>charges − qui se repoussent : chaîne gonflée</T>
  </Svg>);

export const FCombinaison = () => (
  <Svg h={196} aria="Combiner les deux épaississants : le Thixol, un HASE, assure la viscosité à bas gradient pour la tenue en pot et le mur frais ; le Coapur, un HEUR, règle la viscosité à haut gradient pour l'application ; une peinture mate combine les deux">
    <Lg x1={14} y1={64} x2={286} y2={64} c={GRIS} w={1.8}/>
    {[['0,1', 60], ['3', 120], ['500', 200], ['10 000', 262]].map(([t, x]) => <g key={t}><Lg x1={x} y1={58} x2={x} y2={70} c={GRIS} w={1.6}/><T x={x} y={86} a="middle" c={GRIS}>{t}</T></g>)}
    <T x={286} y={104} a="end" c={GRIS}>γ̇ (s⁻¹)</T>
    <rect x="30" y="28" width="108" height="26" rx="5" fill="#dcfce7" stroke={VERT} strokeWidth="2"/><T x={84} y={46} a="middle" c={VERT} w={800}>pot, mur : HASE</T>
    <rect x="178" y="28" width="108" height="26" rx="5" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><T x={232} y={46} a="middle" c={BLEU} w={800}>rouleau : HEUR</T>
    <T x={150} y={138} a="middle" w={800}>peinture mate : les deux, dosés</T><T x={150} y={158} a="middle" c={GRIS}>chacun couvre sa zone de gradient</T><T x={150} y={178} a="middle" c={GRIS}>(sans excès : limite à bas gradient)</T>
  </Svg>);
