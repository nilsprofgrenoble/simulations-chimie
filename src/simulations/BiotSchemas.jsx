// Cartes « À retenir » de la simulation 318 (sens de rotation, loi de Biot, mélange racémique, excès énantiomérique, bilan).
// viewBox de 300 de large, textes de 12 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";
import { FormuleSvg } from '../svgFrac';

const PLUS = '#c2410c', MOINS = '#0f766e', LUM = '#ca8a04', VIOLET = '#7c3aed', BLEU = '#2563eb';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const rad = a => (a * Math.PI) / 180;
// petit cadran : plan de polarisation tourné de a degrés (positif = vers la droite)
function Cadran({ cx, cy, R, a, c }) {
  const p = (ang, r) => [cx + r * Math.sin(rad(ang)), cy - r * Math.cos(rad(ang))];
  const [x1, y1] = p(a, R - 7), [x2, y2] = p(a + 180, R - 7), [t0x, t0y] = p(0, R - 7);
  return (<g>
    <circle cx={cx} cy={cy} r={R} fill="#fff" stroke="#334155" strokeWidth="2.6"/>
    <line x1={t0x} y1={t0y} x2={cx} y2={cy} stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="3 3"/>
    {a !== 0 && <path d={`M ${t0x} ${t0y} A ${R - 7} ${R - 7} 0 0 ${a > 0 ? 1 : 0} ${x1.toFixed(1)} ${y1.toFixed(1)}`} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" opacity="0.55"/>}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LUM} strokeWidth="4.6" strokeLinecap="round"/>
    <circle cx={cx} cy={cy} r="4" fill="#334155"/>
  </g>);
}

// Carte 1 : dextrogyre et lévogyre
export function SvgSensCarte() {
  return cadre('Sens de rotation du plan de polarisation : un composé qui dévie le plan vers la gauche est lévogyre, noté moins, avec α négatif ; vers la droite il est dextrogyre, noté plus, avec α positif.', 232, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Le sens de la rotation</text>
    <Cadran cx={80} cy={92} R={42} a={-35} c={MOINS}/>
    <Cadran cx={220} cy={92} R={42} a={35} c={PLUS}/>
    <text x="80" y="156" textAnchor="middle" fontSize="14" fontWeight="800" fill={MOINS}>lévogyre (−)</text>
    <text x="80" y="174" textAnchor="middle" fontSize="12.5" fill={K.txt}>vers la gauche</text>
    <text x="220" y="156" textAnchor="middle" fontSize="14" fontWeight="800" fill={PLUS}>dextrogyre (+)</text>
    <text x="220" y="174" textAnchor="middle" fontSize="12.5" fill={K.txt}>vers la droite</text>
    <text x="80" y="198" textAnchor="middle" fontSize="13" fontWeight="800" fill={MOINS}>α &lt; 0</text>
    <text x="220" y="198" textAnchor="middle" fontSize="13" fontWeight="800" fill={PLUS}>α &gt; 0</text>
    <text x="150" y="220" textAnchor="middle" fontSize="12.5" fill={K.gris}>α : pouvoir rotatoire, en degrés (°)</text>
  </g>);
}

// Carte 2 : la loi de Biot
export function SvgBiotCarte() {
  return cadre('Loi de Biot : α égale le pouvoir rotatoire spécifique, noté crochet alpha, multiplié par la longueur L de la cuve en décimètres et par la concentration massique C en grammes par millilitre.', 262, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>La loi de Biot</text>
    <rect x="30" y="38" width="240" height="42" rx="12" fill="#fff" stroke={LUM} strokeWidth="2.6"/>
    <text x="150" y="66" textAnchor="middle" fontSize="17" fontWeight="800" fill={K.txt}>α = [α] × L × C</text>
    <text x="22" y="104" fontSize="13" fontWeight="800" fill={PLUS}>α</text>
    <text x="52" y="104" fontSize="12.5" fill={K.txt}>rotation mesurée, en degrés (°)</text>
    <text x="22" y="126" fontSize="13" fontWeight="800" fill={VIOLET}>[α]</text>
    <text x="52" y="126" fontSize="12.5" fill={K.txt}>pouvoir rotatoire spécifique</text>
    <text x="52" y="143" fontSize="12.5" fill={VIOLET}>°·dm⁻¹·g⁻¹·mL</text>
    <text x="22" y="166" fontSize="13" fontWeight="800" fill={BLEU}>L</text>
    <text x="52" y="166" fontSize="12.5" fill={K.txt}>longueur de la cuve, en dm</text>
    <text x="22" y="188" fontSize="13" fontWeight="800" fill={MOINS}>C</text>
    <text x="52" y="188" fontSize="12.5" fill={K.txt}>concentration massique, en g/mL</text>
    <text x="150" y="220" textAnchor="middle" fontSize="12.5" fill={K.txt}>Attention : 1 dm = 10 cm</text>
    <text x="150" y="242" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">ex. : 30 × 1,0 × 0,20 = +6,0°</text>
  </g>);
}

// Carte 3 : mélange racémique
export function SvgRacemiqueCarte() {
  return cadre('Mélange racémique : autant de molécules de l’énantiomère plus que de l’énantiomère moins. Leurs rotations de signes opposés se compensent : α égale 0, le mélange est optiquement inactif.', 236, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Le mélange racémique</text>
    <rect x="46" y="44" width="100" height="30" rx="9" fill={PLUS} opacity="0.85"/>
    <rect x="154" y="44" width="100" height="30" rx="9" fill={MOINS} opacity="0.85"/>
    <text x="96" y="64" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#fff">50 % (+)</text>
    <text x="204" y="64" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#fff">50 % (−)</text>
    <Cadran cx={96} cy={132} R={32} a={28} c={PLUS}/>
    <Cadran cx={204} cy={132} R={32} a={-28} c={MOINS}/>
    <text x="150" y="138" textAnchor="middle" fontSize="20" fontWeight="800" fill={K.gris}>+</text>
    <text x="96" y="182" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={PLUS}>+ x°</text>
    <text x="204" y="182" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={MOINS}>− x°</text>
    <rect x="62" y="194" width="176" height="30" rx="10" fill="#fff" stroke="#15803d" strokeWidth="2.4"/>
    <text x="150" y="214" textAnchor="middle" fontSize="14" fontWeight="800" fill="#15803d">α = 0 : inactif</text>
  </g>);
}

// Carte 4 : excès énantiomérique
export function SvgEECarte() {
  const x0 = 30, w = 240, pp = 0.7;
  return cadre('Excès énantiomérique : e.e. égale la valeur absolue de la différence des quantités des deux énantiomères, divisée par leur somme, fois 100. Pour 70 % de plus et 30 % de moins, e.e. vaut 40 pour cent.', 272, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>L’excès énantiomérique</text>
    <rect x="30" y="38" width="240" height="42" rx="12" fill="#fff" stroke={LUM} strokeWidth="2.6"/>
    <FormuleSvg x={150} y={65} s={15.5} w={800} c={K.txt} a="middle" parts={['e.e. = ', { h: '|n₊ − n₋|', b: 'n₊ + n₋' }, ' × 100']} />
    <rect x={x0} y="98" width={w * pp} height="28" rx="8" fill={PLUS} opacity="0.85"/>
    <rect x={x0 + w * pp} y="98" width={w * (1 - pp)} height="28" rx="8" fill={MOINS} opacity="0.85"/>
    <text x={x0 + w * pp / 2} y="117" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">70 % (+)</text>
    <text x={x0 + w * (pp + (1 - pp) / 2)} y="117" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">30 %</text>
    <text x="150" y="145" textAnchor="middle" fontSize="12.5" fill={K.txt}>(30 % de (+) et 30 % de (−) se compensent)</text>
    <rect x={x0 + w * 0.3} y="154" width={w * 0.4} height="14" rx="6" fill={PLUS} opacity="0.85"/>
    <text x="150" y="190" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={PLUS}>reste : 40 % de (+) en excès</text>
    <text x="150" y="212" textAnchor="middle" fontSize="12.5" fill={K.txt}>e.e. = 0 % : mélange racémique</text>
    <text x="150" y="229" textAnchor="middle" fontSize="12.5" fill={K.txt}>e.e. = 100 % : énantiomère pur</text>
    <text x="150" y="254" textAnchor="middle" fontSize="13" fontWeight="800" fill="#15803d">α = e.e. × α de l’énantiomère pur</text>
  </g>);
}

// Carte 5 : bilan
export function SvgBilanBiotCarte() {
  return cadre('Du polarimètre au résultat : on mesure α ; avec la loi de Biot on retrouve la concentration d’un énantiomère pur, et en comparant α à celui de l’énantiomère pur on trouve l’excès énantiomérique.', 262, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Du polarimètre au résultat</text>
    <rect x="90" y="40" width="120" height="38" rx="11" fill="#fffbeb" stroke={LUM} strokeWidth="2.4"/>
    <text x="150" y="65" textAnchor="middle" fontSize="14" fontWeight="800" fill={K.txt}>mesure de α</text>
    <path d="M 130 80 L 80 112" stroke="#64748b" strokeWidth="2.4" fill="none" strokeLinecap="round"/><polygon points="76,115 88,113 82,104" fill="#64748b"/>
    <path d="M 170 80 L 220 112" stroke="#64748b" strokeWidth="2.4" fill="none" strokeLinecap="round"/><polygon points="224,115 212,113 218,104" fill="#64748b"/>
    <rect x="14" y="120" width="132" height="92" rx="12" fill="#fff" stroke={MOINS} strokeWidth="2.4"/>
    <text x="80" y="142" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={MOINS}>énantiomère pur</text>
    <FormuleSvg x={80} y={166} s={13.5} w={800} c={K.txt} a="middle" parts={['C = ', { h: 'α', b: '[α]·L' }]} />
    <text x="80" y="188" textAnchor="middle" fontSize="12.5" fill={K.txt}>(valeur absolue de α)</text>
    <rect x="154" y="120" width="132" height="92" rx="12" fill="#fff" stroke={PLUS} strokeWidth="2.4"/>
    <text x="220" y="142" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={PLUS}>mélange</text>
    <FormuleSvg x={220} y={166} s={13.5} w={800} c={K.txt} a="middle" parts={['e.e. = ', { h: '|α|', b: '|α pur|' }]} />
    <text x="220" y="188" textAnchor="middle" fontSize="12.5" fill={K.txt}>× 100 (en %)</text>
    <text x="150" y="238" textAnchor="middle" fontSize="12.5" fill={K.txt}>Le signe de α dit quel énantiomère est en excès.</text>
  </g>);
}
