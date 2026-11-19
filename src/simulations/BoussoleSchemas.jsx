// Schémas des cartes « À retenir » de la simulation 46 (boussole et champ magnétique). viewBox de 300, texte de 12,5. Vecteurs avec flèche (TV).
import { TV } from "./Travail";
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400, s = 12.5 }) => <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 9, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 6 * ca} y2={y2 - 6 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
// Étiquette vecteur B avec indice : lettre-vecteur + indice en petit
const BV = ({ x, y, sub, c = ENCRE }) => <g><TV x={x} y={y} c={c} s={14}>B</TV><text x={x + 10} y={y + 4} fontSize="10.5" fontWeight="700" fill={c}>{sub}</text></g>;

export const SchemaBoussole = () => (
  <Svg h={150} aria="Une boussole : l'aiguille s'aligne sur le champ magnétique, son pôle nord indique le sens du vecteur B">
    <circle cx="80" cy="76" r="52" fill="#fff" stroke={GRIS} strokeWidth="2.5"/>
    <polygon points="80,30 70,76 90,76" fill={ROUGE}/><polygon points="80,122 70,76 90,76" fill="#cbd5e1"/>
    <T x={80} y={26} a="middle" c={ROUGE} w={700}>N</T><T x={80} y={140} a="middle" c={GRIS} w={700}>S</T>
    <Arr x1={150} y1={76} x2={150} y2={22} c={BLEU}/><BV x={160} y={44} sub="" c={BLEU}/>
    <T x={160} y={66} c={BLEU}>direction : celle</T><T x={160} y={84} c={BLEU}>de l’aiguille</T>
    <T x={160} y={112} c={ROUGE} w={700}>sens : vers le</T><T x={160} y={130} c={ROUGE} w={700}>pôle nord</T>
  </Svg>);

export const SchemaDipole = () => (
  <Svg h={178} aria="Champ d'un aimant sur son axe : à la distance r il vaut B, à 2r il est divisé par 8, à 3r divisé par 27, car il décroît en un sur r au cube">
    <line x1="20" y1="132" x2="290" y2="132" stroke={GRIS} strokeWidth="1.5"/>
    <rect x="40" y="32" width="46" height="100" fill="#fed7aa" stroke={ORANGE} strokeWidth="2"/><T x={63} y={86} a="middle" c={ORANGE} w={700}>B</T>
    <rect x="124" y="119" width="46" height="13" fill="#fed7aa" stroke={ORANGE} strokeWidth="2"/><T x={147} y={112} a="middle" c={ORANGE} w={700}>B ÷ 8</T>
    <rect x="208" y="130" width="46" height="2" fill={ORANGE}/><T x={231} y={122} a="middle" c={ORANGE} w={700}>B ÷ 27</T>
    <T x={63} y={152} a="middle" c={BLEU} w={700}>r</T><T x={147} y={152} a="middle" c={BLEU} w={700}>2r</T><T x={231} y={152} a="middle" c={BLEU} w={700}>3r</T>
    <T x={150} y={172} a="middle" c={GRIS}>doubler la distance : champ ÷ 8</T>
  </Svg>);

export const SchemaTangentes = () => (
  <Svg h={176} aria="Boussole des tangentes : le champ de la Terre pointe vers le nord, celui de l'aimant vers l'est ; l'aiguille s'aligne sur le champ total et dévie de l'angle alpha avec tangente alpha égale B aimant sur B Terre">
    <Arr x1={60} y1={140} x2={60} y2={40} c={BLEU}/><BV x={14} y={90} sub="Terre" c={BLEU}/><T x={70} y={28} c={GRIS}>nord</T>
    <Arr x1={60} y1={140} x2={200} y2={140} c={ORANGE}/><BV x={110} y={162} sub="aimant" c={ORANGE}/><T x={210} y={145} c={GRIS}>est</T>
    <Arr x1={60} y1={140} x2={200} y2={40} c={ENCRE} w={3.4}/>
    <line x1={60} y1={40} x2={200} y2={40} stroke="#94a3b8" strokeDasharray="4 3"/><line x1={200} y1={40} x2={200} y2={140} stroke="#94a3b8" strokeDasharray="4 3"/>
    <path d="M 60 112 A 28 28 0 0 1 80 120" fill="none" stroke={ROUGE} strokeWidth="2"/><T x={86} y={112} c={ROUGE} w={700}>α</T>
    <T x={96} y={62} c={ENCRE} w={700}>aiguille</T>
    <T x={226} y={88} c={ROUGE} w={700}>tan α =</T><T x={226} y={108} c={ROUGE} w={700}>B aimant</T><T x={226} y={126} c={ROUGE} w={700}>÷ B Terre</T>
  </Svg>);

export const SchemaPythagore = () => (
  <Svg h={176} aria="Somme de deux champs perpendiculaires : 30 microtesla vers le nord et 40 microtesla vers l'est donnent un champ total de 50 microtesla, par le théorème de Pythagore">
    <Arr x1={50} y1={140} x2={50} y2={44} c={BLEU}/><BV x={6} y={92} sub="1" c={BLEU}/><T x={60} y={96} c={BLEU} w={700}>30 µT</T>
    <Arr x1={50} y1={140} x2={206} y2={140} c={ORANGE}/><BV x={110} y={162} sub="2" c={ORANGE}/><T x={150} y={134} c={ORANGE} w={700}>40 µT</T>
    <Arr x1={50} y1={140} x2={206} y2={44} c={ENCRE} w={3.4}/><TV x={70} y={30} c={ENCRE} s={14}>B</TV><T x={86} y={30} c={ENCRE} w={700}>= 50 µT</T>
    <line x1={50} y1={44} x2={206} y2={44} stroke="#94a3b8" strokeDasharray="4 3"/><line x1={206} y1={44} x2={206} y2={140} stroke="#94a3b8" strokeDasharray="4 3"/>
    <T x={222} y={58} c={GRIS} w={700}>B² = B₁²</T><T x={222} y={76} c={GRIS} w={700}>     + B₂²</T>
    <T x={216} y={100} c={GRIS}>900 + 1 600</T><T x={222} y={120} c={GRIS}>= 2 500</T>
  </Svg>);

export const SchemaEchelle = () => {
  const X = l => 20 + (l + 5) * 37.1;
  const pts = [[-4.3, 'Terre', '50 µT', BLEU, 0], [-1.7, 'aimant', '20 mT', ORANGE, 1], [1, 'électro', '10 T', VERT, 0], [2, 'record', '100 T', ROUGE, 1]];
  return (
    <Svg h={140} aria="Échelle logarithmique des champs magnétiques : champ de la Terre 50 microtesla, aimant 20 millitesla, électroaimant 10 tesla, record de laboratoire 100 tesla">
      <line x1="16" y1="70" x2="288" y2="70" stroke={GRIS} strokeWidth="2.5"/>
      {[-5, -3, -1, 1].map(l => <g key={l}><line x1={X(l)} y1="63" x2={X(l)} y2="77" stroke={GRIS} strokeWidth="1.5"/></g>)}
      {pts.map(([l, n, v, c, up]) => <g key={n}><circle cx={X(l)} cy="70" r="6" fill={c}/>
        <T x={X(l)} y={up ? 32 : 104} a="middle" c={c} w={700}>{n}</T><T x={X(l)} y={up ? 50 : 122} a="middle" c={c}>{v}</T></g>)}
      <T x={16} y={14} c={GRIS}>échelle logarithmique</T>
    </Svg>);
};

export const SchemaTrompe = () => (
  <Svg h={150} aria="Une boussole près d'un haut-parleur : le champ local, bien plus intense que celui de la Terre, s'ajoute à lui et l'aiguille se tourne vers la source au lieu de pointer le nord">
    <circle cx="90" cy="84" r="44" fill="#fff" stroke={GRIS} strokeWidth="2.5"/>
    <polygon points="132,84 84,74 84,94" fill={ROUGE}/><polygon points="48,84 96,74 96,94" fill="#cbd5e1"/>
    <Arr x1={90} y1={40} x2={90} y2={14} c={BLEU} w={2.6}/><T x={100} y={22} c={BLEU}>nord</T>
    <rect x="212" y="52" width="70" height="64" rx="8" fill="#fed7aa" stroke={ORANGE} strokeWidth="2.5"/><T x={247} y={90} a="middle" c={ORANGE} w={700}>source</T>
    <Arr x1={196} y1={84} x2={142} y2={84} c={ORANGE} w={3.4}/>
    <T x={150} y={142} a="middle" c={ROUGE} w={700}>champ local ≫ champ terrestre</T>
  </Svg>);
