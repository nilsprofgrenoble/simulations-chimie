// Cartes « À retenir » de la simulation 317 (spectre, filtrage d'un signal, types de filtres et gabarits, cahier des charges, passe-bande par cascade).
// viewBox de 300 de large, textes de 12 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";
import * as G from "./gabModele";

const BLEU = '#2563eb', ORANGE = '#ea580c', TEAL = '#0f766e', VIOLET = '#7c3aed', VERT = '#15803d', ROUGE = '#dc2626';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const halo = { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' };
// courbe A d'un filtre dont les fréquences sont exprimées relativement à 1 (axe logarithmique de 0,01 à 100)
const courbe = (type, f1, f2, x0, x1, yT, yB, n = 70) => {
  const pts = [];
  for (let k = 0; k <= n; k++) { const r = 10 ** (-2 + 4 * k / n); pts.push(`${(x0 + k / n * (x1 - x0)).toFixed(1)},${(yB - G.gainFiltre(type, r, f1, f2) * (yB - yT)).toFixed(1)}`); }
  return pts.join(' ');
};
const Xr = (r, x0, x1) => x0 + (Math.log10(r) + 2) / 4 * (x1 - x0);

// Carte 1 : le spectre
export function SvgSpectreCarte() {
  const x0 = 34, x1 = 276, yT = 46, yB = 128;
  const raie = (x, h, c, lab, ly) => (<g>
    <rect x={x - 4.5} y={yB - h} width="9" height={h} rx="2.5" fill={c}/><circle cx={x} cy={yB - h} r="5" fill={c} stroke="#fff" strokeWidth="1.5"/>
    <text x={x} y={ly} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c} {...halo}>{lab}</text></g>);
  return cadre('Spectre d’un signal : chaque sinusoïde est une raie placée à sa fréquence, avec une hauteur égale à son amplitude. Une composante continue est une raie à 0 hertz. Un signal somme de plusieurs sinusoïdes a plusieurs raies.', 232, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Le spectre : une raie par sinusoïde</text>
    <line x1={x0} x2={x0} y1={yT - 4} y2={yB} stroke="#334155" strokeWidth="1.8"/><line x1={x0} x2={x1} y1={yB} y2={yB} stroke="#334155" strokeWidth="1.8"/>
    <text x={x0 - 4} y={yT + 2} textAnchor="end" fontSize="12.5" fontWeight="800" fill="#334155">a</text><text x={x1} y={yB + 17} textAnchor="end" fontSize="12.5" fontWeight="800" fill="#334155">f</text>
    {raie(x0 + 22, 30, VIOLET, 'continu', yB - 36)}
    {raie(x0 + 92, 62, BLEU, 'f₁', yB - 68)}
    {raie(x0 + 178, 36, ORANGE, 'f₂', yB - 42)}
    <text x={x0 + 22} y={yB + 17} textAnchor="middle" fontSize="12.5" fill={K.txt}>0 Hz</text>
    <text x="150" y="168" textAnchor="middle" fontSize="12.5" fill={K.txt}>1 sinusoïde = 1 raie (fréquence, amplitude)</text>
    <text x="150" y="187" textAnchor="middle" fontSize="12.5" fill={K.txt}>composante continue = raie à 0 Hz</text>
    <text x="150" y="206" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>plusieurs sinusoïdes = plusieurs raies</text>
  </g>);
}

// Carte 2 : le filtre multiplie chaque raie par A(f)
export function SvgFiltrerCarte() {
  const x0 = 30, x1 = 274, yT = 44, yB = 132, hmax = 78;
  const xs = [78, 148, 226], A = [1 / Math.sqrt(1 + (0.2) ** 2), 1 / Math.sqrt(1 + 1), 1 / Math.sqrt(1 + 16)], h = [62, 50, 56];
  const pts = []; for (let k = 0; k <= 60; k++) { const r = 10 ** (-1 + 2 * k / 60), x = x0 + k / 60 * (x1 - x0); pts.push(`${x.toFixed(1)},${(yB - 1 / Math.sqrt(1 + r * r) * hmax).toFixed(1)}`); }
  return cadre('Filtrer un signal : le filtre multiplie l’amplitude de chaque raie par le facteur d’amplification A à la fréquence de cette raie. Raie de sortie égale A fois raie d’entrée. La raie à A proche de 1 passe, celle à A proche de 0 est supprimée.', 244, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Filtrer = multiplier chaque raie par A</text>
    <line x1={x0} x2={x0} y1={yT - 4} y2={yB} stroke="#334155" strokeWidth="1.8"/><line x1={x0} x2={x1} y1={yB} y2={yB} stroke="#334155" strokeWidth="1.8"/>
    <polyline points={pts.join(' ')} fill="none" stroke={TEAL} strokeWidth="3" strokeDasharray="7 4" strokeLinejoin="round"/>
    {xs.map((x, i) => (<g key={i}>
      <rect x={x - 12} y={yB - h[i]} width="9" height={h[i]} rx="2.5" fill={BLEU}/><circle cx={x - 7.5} cy={yB - h[i]} r="5" fill={BLEU} stroke="#fff" strokeWidth="1.5"/>
      <rect x={x + 3} y={yB - h[i] * A[i]} width="9" height={h[i] * A[i]} rx="2.5" fill={ORANGE}/><circle cx={x + 7.5} cy={yB - h[i] * A[i]} r="5" fill={ORANGE} stroke="#fff" strokeWidth="1.5"/>
    </g>))}
    <text x={x1} y={yB + 17} textAnchor="end" fontSize="12.5" fontWeight="800" fill="#334155">f</text>
    <text x={x0 + 8} y={yT + 4} fontSize="12.5" fontWeight="800" fill={TEAL} {...halo}>courbe A(f)</text>
    <rect x="30" y="152" width="240" height="34" rx="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/>
    <text x="150" y="174" textAnchor="middle" fontSize="14" fontWeight="800" fill={K.txt}>sortie = A(f) × entrée</text>
    <text x="150" y="208" textAnchor="middle" fontSize="12.5" fill={K.txt}>ex. : 2,0 V × 0,25 = 0,50 V</text>
    <text x="150" y="226" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">A ≈ 1 : la raie passe ; A ≈ 0 : elle est supprimée</text>
  </g>);
}

// Carte 3 : les quatre types de filtres et leur gabarit
export function SvgTypesCarte() {
  const cell = (ox, oy, type, f1, f2, titre, l1, l2, c, key) => (<g key={key}>
    <rect x={ox} y={oy} width="134" height="114" rx="10" fill="#fff" stroke={K.clair}/>
    <text x={ox + 67} y={oy + 18} textAnchor="middle" fontSize="13.5" fontWeight="800" fill={c}>{titre}</text>
    <line x1={ox + 14} x2={ox + 14} y1={oy + 26} y2={oy + 74} stroke="#334155" strokeWidth="1.6"/><line x1={ox + 14} x2={ox + 122} y1={oy + 74} y2={oy + 74} stroke="#334155" strokeWidth="1.6"/>
    <polyline points={courbe(type, f1, f2, ox + 14, ox + 122, oy + 28, oy + 74)} fill="none" stroke={c} strokeWidth="3.2" strokeLinejoin="round"/>
    <text x={ox + 67} y={oy + 92} textAnchor="middle" fontSize="12" fill={K.txt}>{l1}</text><text x={ox + 67} y={oy + 107} textAnchor="middle" fontSize="12" fill={K.txt}>{l2}</text>
  </g>);
  return cadre('Les quatre types de filtres. Passe-bas : garde les basses fréquences. Passe-haut : garde les hautes fréquences. Passe-bande : garde une bande de fréquences. Coupe-bande : supprime une bande de fréquences. Chaque type a un gabarit : la forme de la courbe A en fonction de la fréquence.', 284, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Quatre types de filtres</text>
    {cell(8, 36, 'bas', 1, 1, 'passe-bas', 'garde les graves,', 'coupe les aigus', TEAL, 'a')}
    {cell(158, 36, 'haut', 1, 1, 'passe-haut', 'garde les aigus,', 'coupe les graves', VIOLET, 'b')}
    {cell(8, 156, 'bande', 0.1, 10, 'passe-bande', 'garde une bande', 'de fréquences', ORANGE, 'c')}
    {cell(158, 156, 'rej', 0.1, 10, 'coupe-bande', 'supprime une bande', 'de fréquences', BLEU, 'd')}
  </g>);
}

// Carte 4 : cahier des charges et gabarit (portes)
export function SvgPortesCarte() {
  const x0 = 36, x1 = 268, yT = 46, yB = 130, Y = a => yB - a * (yB - yT), xu = Xr(0.25, x0, x1), xp = Xr(25, x0, x1), xc = Xr(1, x0, x1);
  return cadre('Gabarit et cahier des charges : la raie utile doit passer, avec A supérieur ou égal à 0,9 ; le parasite doit être supprimé, avec A inférieur ou égal à 0,1. On place la fréquence de coupure entre les deux pour que la courbe traverse les deux zones.', 250, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Le cahier des charges fixe le gabarit</text>
    <line x1={x0} x2={x0} y1={yT - 4} y2={yB} stroke="#334155" strokeWidth="1.8"/><line x1={x0} x2={x1} y1={yB} y2={yB} stroke="#334155" strokeWidth="1.8"/>
    <rect x={xu - 11} y={Y(1)} width="22" height={Y(0.9) - Y(1)} rx="4" fill={VERT} opacity="0.3" stroke={VERT} strokeWidth="2.4"/>
    <rect x={xp - 11} y={Y(0.1)} width="22" height={Y(0) - Y(0.1)} rx="4" fill={ROUGE} opacity="0.22" stroke={ROUGE} strokeWidth="2.4"/>
    <line x1={xc} x2={xc} y1={yT - 4} y2={yB} stroke={ORANGE} strokeWidth="1.8" strokeDasharray="6 4"/>
    <polyline points={courbe('bas', 1, 1, x0, x1, yT, yB)} fill="none" stroke={TEAL} strokeWidth="3.4" strokeLinejoin="round"/>
    <text x={xu} y={Y(1) - 6} textAnchor="middle" fontSize="12" fontWeight="800" fill={VERT} {...halo}>A ≥ 0,9</text>
    <text x={xp - 6} y={Y(0.1) - 22} textAnchor="middle" fontSize="12" fontWeight="800" fill={ROUGE} {...halo}>A ≤ 0,1</text>
    <text x={xu} y={yB + 17} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={VERT}>utile</text>
    <text x={xp} y={yB + 17} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE}>parasite</text>
    <text x={xc} y={yB + 17} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>fc</text>
    <text x="150" y="176" textAnchor="middle" fontSize="12.5" fill={K.txt}>1. Raie utile : la courbe traverse le vert</text>
    <text x="150" y="196" textAnchor="middle" fontSize="12.5" fill={K.txt}>2. Parasite : la courbe traverse le rouge</text>
    <text x="150" y="220" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>fc se place entre la raie utile et le parasite</text>
  </g>);
}

// Carte 5 : passe-bande = passe-haut puis passe-bas (cascade)
export function SvgCascadeCarte() {
  const g = (ox, type, f1, f2, c, titre, key) => (<g key={key}>
    <line x1={ox} x2={ox} y1="54" y2="102" stroke="#334155" strokeWidth="1.6"/><line x1={ox} x2={ox + 70} y1="102" y2="102" stroke="#334155" strokeWidth="1.6"/>
    <polyline points={courbe(type, f1, f2, ox, ox + 70, 56, 102, 50)} fill="none" stroke={c} strokeWidth="3.2" strokeLinejoin="round"/>
    <text x={ox + 35} y="44" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{titre}</text>
  </g>);
  const op = (x, t) => <text key={x} x={x} y="86" textAnchor="middle" fontSize="20" fontWeight="800" fill={K.txt}>{t}</text>;
  return cadre('Passe-bande par cascade : un passe-haut suivi d’un passe-bas donne un passe-bande. Le facteur d’amplification est le produit A égale A1 fois A2. Exemple à 1 kilohertz : 0,96 fois 0,97 donne environ 0,93.', 244, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Passe-bande = passe-haut puis passe-bas</text>
    {g(16, 'haut', 0.1, 0.1, VIOLET, 'passe-haut', 'a')}{op(100, '×')}{g(108, 'bas', 10, 10, TEAL, 'passe-bas', 'b')}{op(192, '=')}{g(200, 'bande', 0.1, 10, ORANGE, 'passe-bande', 'c')}
    <text x="51" y="122" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={VIOLET}>A₁</text><text x="143" y="122" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={TEAL}>A₂</text><text x="235" y="122" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>A</text>
    <rect x="48" y="138" width="204" height="34" rx="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/>
    <text x="150" y="160" textAnchor="middle" fontSize="15" fontWeight="800" fill={K.txt}>A = A₁ × A₂</text>
    <text x="150" y="196" textAnchor="middle" fontSize="12.5" fill={K.txt}>à 1 kHz : 0,96 × 0,97 ≈ 0,93</text>
    <text x="150" y="216" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">fc1 pour les graves, fc2 pour les aigus</text>
  </g>);
}
