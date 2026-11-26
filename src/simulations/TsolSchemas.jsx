// Cartes « À retenir » de la simulation 312 (solubilité et température, recristallisation). viewBox de 300 de large, textes de 12,5 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";
import * as M from "./tsolModele";

const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const S = M.SOLIDES;
const courbe = (so, x0, x1, yT, yB) => { const pts = []; for (let t = 0; t <= 100; t += 4) pts.push(`${(x0 + t / 100 * (x1 - x0)).toFixed(1)},${(yB - M.sol(so, t) / so.ymax * (yB - yT)).toFixed(1)}`); return pts.join(' '); };
const becher = (x, y, w, h, nIons, nCrist, col, cle) => (
  <g key={cle}>
    <path d={`M${x} ${y} L${x + 4} ${y + h - 4} Q${x + 5} ${y + h} ${x + 11} ${y + h} L${x + w - 11} ${y + h} Q${x + w - 5} ${y + h} ${x + w - 4} ${y + h - 4} L${x + w} ${y}`} fill="#e0f2fe" stroke="#334155" strokeWidth="2.4" strokeLinecap="round"/>
    <line x1={x + 2} x2={x + w - 2} y1={y + 12} y2={y + 12} stroke="#38bdf8" strokeWidth="1.8"/>
    {Array.from({ length: nIons }, (_, i) => <circle key={i} cx={x + 14 + ((i * 29) % (w - 28))} cy={y + 24 + ((i * 17) % (h - 50))} r="4.6" fill={col} stroke="#fff" strokeWidth="1.2"/>)}
    {Array.from({ length: nCrist }, (_, i) => { const cx = x + 14 + i * ((w - 28) / Math.max(1, nCrist - 1 || 1)) * (nCrist > 1 ? 1 : 0) + (nCrist === 1 ? (w - 28) / 2 : 0), cy = y + h - 10; return <polygon key={i} points={`${cx},${cy - 6} ${cx + 6},${cy} ${cx},${cy + 5} ${cx - 6},${cy}`} fill="#fff" stroke={col} strokeWidth="1.6"/>; })}
  </g>);

// Carte 1 : solubilité et saturation
export function SvgSatCarte() {
  const so = S.nh4cl, x0 = 44, x1 = 276, yT = 60, yB = 176, X = t => x0 + t / 100 * (x1 - x0), Y = s => yB - s / so.ymax * (yB - yT);
  const ligne = courbe(so, x0, x1, yT, yB);
  return cadre('Solubilité s : masse maximale de soluté dissoute dans 100 grammes d’eau à une température donnée. Sous la courbe, la solution n’est pas saturée ; sur la courbe, elle est saturée ; au-dessus, le solide en excès forme des cristaux.', 244, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>s = masse maximale dissoute</text>
    <text x="150" y="44" textAnchor="middle" fontSize="13" fill={K.txt}>dans 100 g d’eau, à la température T</text>
    <polygon points={`${x0},${yB} ${ligne} ${x1},${yB}`} fill={so.colS} opacity="0.55"/>
    <polygon points={`${x0},${yT} ${ligne} ${x1},${yT}`} fill="#fde68a" opacity="0.4"/>
    <line x1={x0} x2={x0} y1={yT} y2={yB} stroke="#334155" strokeWidth="1.8"/><line x1={x0} x2={x1} y1={yB} y2={yB} stroke="#334155" strokeWidth="1.8"/>
    <polyline points={ligne} fill="none" stroke={so.col} strokeWidth="3" strokeLinejoin="round"/>
    <text x={x0 + 8} y={yT + 17} fontSize="12.5" fontWeight="800" fill="#b45309">saturée + cristaux</text>
    <text x={x1 - 6} y={yB - 10} textAnchor="end" fontSize="12.5" fontWeight="800" fill={so.col}>non saturée</text>
    <text x={X(62)} y={Y(M.sol(so, 62)) - 20} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={so.col}>saturée</text>
    <text x={x0 - 6} y={yT + 4} textAnchor="end" fontSize="12.5" fontWeight="700" fill="#334155">s</text>
    <text x={x1} y={yB + 18} textAnchor="end" fontSize="12.5" fontWeight="700" fill="#334155">T (°C)</text>
    <text x="150" y="222" textAnchor="middle" fontSize="13" fontWeight="700" fill="#15803d">au-dessus de la courbe : le surplus cristallise</text>
  </g>);
}

// Carte 2 : masse qui cristallise au refroidissement
export function SvgRefroidCarte() {
  const so = S.nh4cl, s1 = M.sol(so, 60), s2 = M.sol(so, 20);
  return cadre('Une solution saturée à la température T1 est refroidie à T2 : la masse qui cristallise est la différence des solubilités s de T1 et de T2, multipliée par la masse d’eau et divisée par 100. Exemple avec le chlorure d’ammonium de 60 à 20 degrés pour 100 grammes d’eau.', 262, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Refroidir une solution saturée</text>
    {becher(24, 40, 84, 74, 9, 0, so.col, 'a')}
    {becher(192, 40, 84, 74, 5, 4, so.col, 'b')}
    <path d="M118 78 L178 78 M170 70 L180 78 L170 86" stroke="#0369a1" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <text x="148" y="68" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0369a1">refroidir</text>
    <text x="66" y="134" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#dc2626">T₁ (chaud)</text>
    <text x="234" y="134" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#0369a1">T₂ (froid)</text>
    <rect x="18" y="144" width="264" height="34" rx="9" fill="#fff" stroke="#b45309" strokeWidth="2"/>
    <text x="150" y="166" textAnchor="middle" fontSize="14" fontWeight="800" fill={K.txt}>m = (s(T₁) − s(T₂)) × m(eau) ÷ 100</text>
    <text x="150" y="198" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">Exemple : NH₄Cl, 60 → 20 °C, 100 g d’eau</text>
    <text x="150" y="218" textAnchor="middle" fontSize="12.5" fill={K.txt}>({M.nbf(s1, 1)} − {M.nbf(s2, 1)}) × 100 ÷ 100 = {M.nbf(s1 - s2, 0)} g</text>
    <text x="150" y="240" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#b45309">s en g pour 100 g d’eau</text>
  </g>);
}

// Carte 3 : eau minimale et rendement
export function SvgEauRendementCarte() {
  const so = S.nh4cl, s40 = M.sol(so, 40), r = M.rendement(so, 60, 20);
  return cadre('Masse d’eau minimale pour dissoudre une masse de solide : cent fois la masse de solide divisée par la solubilité à la température de travail. Rendement de la recristallisation : différence des solubilités divisée par la solubilité à la température la plus haute.', 258, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Recristalliser : deux calculs</text>
    <rect x="16" y="36" width="268" height="86" rx="10" fill="#fff" stroke="#0369a1" strokeWidth="2"/>
    <text x="150" y="56" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0369a1">Eau minimale (à chaud)</text>
    <text x="150" y="78" textAnchor="middle" fontSize="14" fontWeight="800" fill={K.txt}>m(eau) = 100 × m(solide) ÷ s(T)</text>
    <text x="150" y="100" textAnchor="middle" fontSize="12.5" fill={K.txt}>30 g de NH₄Cl à 40 °C :</text>
    <text x="150" y="116" textAnchor="middle" fontSize="12.5" fill={K.txt}>100 × 30 ÷ {M.nbf(s40, 1)} ≈ {M.nbf(M.eauMin(so, 30, 40), 0)} g d’eau</text>
    <rect x="16" y="134" width="268" height="86" rx="10" fill="#fff" stroke="#b45309" strokeWidth="2"/>
    <text x="150" y="154" textAnchor="middle" fontSize="13" fontWeight="800" fill="#b45309">Rendement (au refroidissement)</text>
    <text x="150" y="176" textAnchor="middle" fontSize="14" fontWeight="800" fill={K.txt}>η = (s(T₁) − s(T₂)) ÷ s(T₁)</text>
    <text x="150" y="198" textAnchor="middle" fontSize="12.5" fill={K.txt}>NH₄Cl, 60 → 20 °C :</text>
    <text x="150" y="214" textAnchor="middle" fontSize="12.5" fill={K.txt}>{M.nbf(M.sol(so, 60) - M.sol(so, 20), 0)} ÷ {M.nbf(M.sol(so, 60), 1)} ≈ {M.nbf(r * 100, 0)} %</text>
    <text x="150" y="244" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">dissoudre à chaud, cristalliser à froid</text>
  </g>);
}

// Carte 4 : sens de variation selon le caractère thermique de la dissolution
export function SvgSensCarte() {
  const a = S.nh4cl, b = S.li2co3, X0 = [20, 170], W = 110, yT = 66, yB = 154;
  const mini = (so, x0, i) => (<g key={i}>
    <line x1={x0} x2={x0} y1={yT} y2={yB} stroke="#334155" strokeWidth="1.6"/><line x1={x0} x2={x0 + W} y1={yB} y2={yB} stroke="#334155" strokeWidth="1.6"/>
    <polyline points={courbe(so, x0, x0 + W, yT, yB)} fill="none" stroke={so.col} strokeWidth="3" strokeLinejoin="round"/>
    <text x={x0 + W / 2} y={yT - 14} textAnchor="middle" fontSize="13" fontWeight="800" fill={so.col}>{so.formule}</text>
    <text x={x0 + W} y={yB + 15} textAnchor="end" fontSize="12" fill="#334155">T</text><text x={x0 - 4} y={yT + 4} textAnchor="end" fontSize="12" fill="#334155">s</text>
  </g>);
  return cadre('Deux comportements : pour le chlorure d’ammonium, la solubilité augmente avec la température et la dissolution est endothermique ; pour le carbonate de lithium, la solubilité diminue quand la température augmente et la dissolution est exothermique.', 252, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>s(T) : deux comportements</text>
    {mini(a, X0[0], 0)}{mini(b, X0[1], 1)}
    <text x={X0[0] + W / 2} y="186" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={K.txt}>dissolution</text>
    <text x={X0[0] + W / 2} y="202" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#b45309">endothermique</text>
    <text x={X0[1] + W / 2} y="186" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={K.txt}>dissolution</text>
    <text x={X0[1] + W / 2} y="202" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#7c3aed">exothermique</text>
    <text x={X0[0] + W / 2} y="224" textAnchor="middle" fontSize="12" fill={K.txt}>chauffer dissout plus</text>
    <text x={X0[1] + W / 2} y="224" textAnchor="middle" fontSize="12" fill={K.txt}>chauffer fait déposer</text>
    <text x="150" y="242" textAnchor="middle" fontSize="12" fontWeight="700" fill="#15803d">Ks suit le même sens que s</text>
  </g>);
}
