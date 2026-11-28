// Cartes « À retenir » de la simulation 316 (filtres RC passe-bas et passe-haut). viewBox de 300 de large, textes de 12,5 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";
import * as M from "./filtreModele";
import { FormuleSvg } from '../svgFrac';

const BLEU = '#2563eb', ORANGE = '#ea580c', TEAL = '#0f766e', VIOLET = '#7c3aed';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const halo = { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' };

// courbe A(f/fc) sur 4 décades (de fc/100 à 100·fc), fc au milieu
const courbe = (nature, x0, x1, yT, yB) => {
  const pts = [];
  for (let k = 0; k <= 80; k++) { const r = 10 ** (-2 + 4 * k / 80); pts.push(`${(x0 + k / 80 * (x1 - x0)).toFixed(1)},${(yB - M.gain(nature, r, 1) / 1.1 * (yB - yT)).toFixed(1)}`); }
  return pts.join(' ');
};
const axes = (x0, x1, yT, yB) => (<g>
  <line x1={x0} x2={x0} y1={yT} y2={yB} stroke="#334155" strokeWidth="1.8"/><line x1={x0} x2={x1} y1={yB} y2={yB} stroke="#334155" strokeWidth="1.8"/>
</g>);

// petit circuit RC (passe-bas : R en série et C vers la masse ; passe-haut : C en série et R vers la masse)
function miniRC(ox, oy, nature, rLab, cLab, key) {
  const fil = (x1, y1, x2, y2) => <line key={`${key}${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="2.6" strokeLinecap="round"/>;
  const bas = nature === 'bas', yt = oy, yb = oy + 50;
  return (<g key={key}>
    <circle cx={ox} cy={yt} r="3.6" fill="#fff" stroke="#334155" strokeWidth="2"/><circle cx={ox} cy={yb} r="3.6" fill="#fff" stroke="#334155" strokeWidth="2"/>
    <circle cx={ox + 112} cy={yt} r="3.6" fill="#fff" stroke="#334155" strokeWidth="2"/><circle cx={ox + 112} cy={yb} r="3.6" fill="#fff" stroke="#334155" strokeWidth="2"/>
    {fil(ox + 4, yb, ox + 108, yb)}
    {bas ? <>
      {fil(ox + 4, yt, ox + 18, yt)}<rect x={ox + 18} y={yt - 7} width="34" height="14" rx="3" fill="#fff" stroke="#334155" strokeWidth="2.4"/>{fil(ox + 52, yt, ox + 108, yt)}
      {fil(ox + 82, yt, ox + 82, yt + 18)}{fil(ox + 82, yt + 32, ox + 82, yb)}
      <line x1={ox + 72} x2={ox + 92} y1={yt + 18} y2={yt + 18} stroke="#334155" strokeWidth="3"/><line x1={ox + 72} x2={ox + 92} y1={yt + 32} y2={yt + 32} stroke="#334155" strokeWidth="3"/>
      <circle cx={ox + 82} cy={yt} r="3" fill="#334155"/>
      <text x={ox + 35} y={yt - 12} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={K.txt}>{rLab}</text>
      <text x={ox + 96} y={yt + 29} fontSize="12.5" fontWeight="800" fill={K.txt}>{cLab}</text>
    </> : <>
      {fil(ox + 4, yt, ox + 30, yt)}<line x1={ox + 30} x2={ox + 30} y1={yt - 11} y2={yt + 11} stroke="#334155" strokeWidth="3"/><line x1={ox + 40} x2={ox + 40} y1={yt - 11} y2={yt + 11} stroke="#334155" strokeWidth="3"/>{fil(ox + 40, yt, ox + 108, yt)}
      {fil(ox + 82, yt, ox + 82, yt + 10)}<rect x={ox + 75} y={yt + 10} width="14" height="30" rx="3" fill="#fff" stroke="#334155" strokeWidth="2.4"/>{fil(ox + 82, yt + 40, ox + 82, yb)}
      <circle cx={ox + 82} cy={yt} r="3" fill="#334155"/>
      <text x={ox + 35} y={yt - 14} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={K.txt}>{cLab}</text>
      <text x={ox + 96} y={yt + 29} fontSize="12.5" fontWeight="800" fill={K.txt}>{rLab}</text>
    </>}
    <text x={ox - 9} y={yt + 4} textAnchor="end" fontSize="12.5" fontWeight="800" fill={BLEU}>Ue</text>
    <text x={ox + 121} y={yt + 4} fontSize="12.5" fontWeight="800" fill={ORANGE}>Us</text>
  </g>);
}

// Carte 1 : le facteur d'amplification
export function SvgAmplCarte() {
  const x0 = 24, w = 252, cy = 100, d = 40;
  const f = (a, ph) => { const pts = []; for (let x2 = 0; x2 <= w; x2 += 3) pts.push(`${(x0 + x2).toFixed(1)},${(cy - a * Math.sin(2 * Math.PI * x2 / 126 + ph)).toFixed(1)}`); return pts.join(' '); };
  return cadre('Facteur d’amplification : A est le rapport de l’amplitude de la tension de sortie sur celle de la tension d’entrée, A égale Us max divisé par Ue max. Exemple : Ue max 3 volts, Us max 1,5 volt, donc A égale 0,50, sans unité. Un filtre passif atténue : A est inférieur ou égal à 1.', 260, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Facteur d’amplification A</text>
    <rect x={x0} y="38" width={w} height="108" rx="6" fill="#fff" stroke="#94a3b8" strokeWidth="1.6"/>
    <line x1={x0} x2={x0 + w} y1={cy} y2={cy} stroke="#cbd5e1" strokeWidth="1.2"/>
    <polyline points={f(d, 0)} fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round"/>
    <polyline points={f(d / 2, -0.5)} fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round"/>
    <line x1={x0 + 31.5} x2={x0 + 31.5} y1={cy} y2={cy - d} stroke={BLEU} strokeWidth="1.8" strokeDasharray="4 3"/>
    <text x={x0 + 8} y="56" fontSize="12.5" fontWeight="800" fill={BLEU}>Ue,max</text>
    <text x={x0 + 92} y="56" fontSize="12.5" fontWeight="800" fill={ORANGE}>Us,max</text>
    <rect x="30" y="156" width="240" height="38" rx="10" fill="#fff" stroke={TEAL} strokeWidth="2"/>
    <FormuleSvg x={150} y={181} s={16} w={800} c={K.txt} a="middle" parts={['A = ', { h: 'Us,max', b: 'Ue,max' }]} />
    <text x="150" y="212" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">Exemple : Ue,max = 3,0 V ; Us,max = 1,5 V</text>
    <FormuleSvg x={150} y={233} s={12.5} w={400} c={K.txt} a="middle" parts={['A = ', { h: '1,5', b: '3,0' }, ' = 0,50 (sans unité)']} />
    <text x="150" y="249" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>filtre passif : il atténue, donc A ≤ 1</text>
  </g>);
}

// Carte 2 : la fréquence de coupure
export function SvgFcCarte() {
  const x0 = 40, x1 = 282, yT = 46, yB = 150, X = r => x0 + (Math.log10(r) + 2) / 4 * (x1 - x0), Y = a => yB - a / 1.1 * (yB - yT);
  return cadre('Fréquence de coupure fc : c’est la fréquence pour laquelle A vaut Amax divisé par racine de 2, soit environ 0,7 fois Amax. Pour un passe-bas, A est proche de 1 aux basses fréquences ; pour un passe-haut, A est proche de 1 aux hautes fréquences. À fc l’amplitude est réduite d’environ 30 pour cent.', 252, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Fréquence de coupure fc</text>
    <line x1={x0} x2={x1} y1={Y(1)} y2={Y(1)} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 5"/>
    <line x1={x0} x2={x1} y1={Y(M.SEUIL)} y2={Y(M.SEUIL)} stroke={ORANGE} strokeWidth="1.8" strokeDasharray="7 5"/>
    <line x1={X(1)} x2={X(1)} y1={yT - 4} y2={yB} stroke={ORANGE} strokeWidth="1.8" strokeDasharray="7 5"/>
    {axes(x0, x1, yT, yB)}
    <polyline points={courbe('bas', x0, x1, yT, yB)} fill="none" stroke={TEAL} strokeWidth="3.4" strokeLinejoin="round"/>
    <polyline points={courbe('haut', x0, x1, yT, yB)} fill="none" stroke={VIOLET} strokeWidth="3.4" strokeLinejoin="round"/>
    <circle cx={X(1)} cy={Y(M.SEUIL)} r="5.5" fill={ORANGE} stroke="#fff" strokeWidth="2"/>
    <text x={x0 + 4} y={Y(1) - 5} fontSize="12" fontWeight="700" fill="#64748b">Amax</text>
    <text x={x1} y={Y(M.SEUIL) + 15} textAnchor="end" fontSize="12" fontWeight="800" fill={ORANGE} {...halo}>0,7 × Amax</text>
    <text x={x0 + 6} y={Y(0.2) + 4} fontSize="12.5" fontWeight="800" fill={VIOLET} {...halo}>passe-haut</text>
    <text x={x1 - 4} y={Y(0.2) + 4} textAnchor="end" fontSize="12.5" fontWeight="800" fill={TEAL} {...halo}>passe-bas</text>
    <text x={X(1)} y={yB + 17} textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>fc</text>
    <text x={x0 - 6} y={yT + 4} textAnchor="end" fontSize="13" fontWeight="800" fill="#334155">A</text><text x={x1} y={yB + 17} textAnchor="end" fontSize="12.5" fill="#334155">f</text>
    <rect x="20" y="180" width="260" height="34" rx="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/>
    <FormuleSvg x={150} y={202} s={14} w={800} c={K.txt} a="middle" parts={['A(fc) = ', { h: 'Amax', b: '√2' }, ' ≈ 0,7 × Amax']} />
    <text x="150" y="236" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">à fc, l’amplitude est réduite d’environ 30 %</text>
  </g>);
}

// Carte 3 : passe-bas et passe-haut (circuits)
export function SvgNaturesCarte() {
  const col = (ox, nature, titre, l1, l2, cl, key) => (<g key={key}>
    <g transform={`translate(${ox + 8} 6) scale(0.8)`}>{miniRC(22, 58, nature, 'R', 'C', key)}</g>
    <polyline points={courbe(nature, ox + 16, ox + 108, 134, 190)} fill="none" stroke={cl} strokeWidth="3.4" strokeLinejoin="round"/>
    {axes(ox + 16, ox + 108, 128, 190)}
    <text x={ox + 12} y={140} textAnchor="end" fontSize="12.5" fontWeight="800" fill="#334155">A</text><text x={ox + 108} y={206} textAnchor="end" fontSize="12.5" fill="#334155">f</text>
    <text x={ox + 62} y="226" textAnchor="middle" fontSize="14" fontWeight="800" fill={cl}>{titre}</text>
    <text x={ox + 62} y="244" textAnchor="middle" fontSize="12" fill={K.txt}>{l1}</text><text x={ox + 62} y="260" textAnchor="middle" fontSize="12" fill={K.txt}>{l2}</text>
  </g>);
  return cadre('Deux filtres RC : si la résistance est en série et le condensateur vers la masse, c’est un filtre passe-bas, qui laisse passer les basses fréquences ; si le condensateur est en série et la résistance vers la masse, c’est un filtre passe-haut, qui laisse passer les hautes fréquences.', 284, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Deux filtres RC</text>
    <line x1="150" x2="150" y1="38" y2="270" stroke="#e2e8f0" strokeWidth="1.5"/>
    {col(2, 'bas', 'passe-bas', 'laisse passer les', 'basses fréquences', TEAL, 'a')}
    {col(158, 'haut', 'passe-haut', 'laisse passer les', 'hautes fréquences', VIOLET, 'b')}
  </g>);
}

// Carte 4 : la bande passante
export function SvgBandeCarte() {
  const mini = (ox, nature, cl, titre, intervalle, key) => {
    const x0 = ox + 18, x1 = ox + 118, yT = 56, yB = 130, xfc = x0 + (x1 - x0) / 2, a = nature === 'bas' ? x0 : xfc, b = nature === 'bas' ? xfc : x1;
    return (<g key={key}>
      <rect x={a} y={yT} width={b - a} height={yB - yT} fill={cl} opacity="0.14"/>
      <rect x={a} y={yB - 4} width={b - a} height="8" rx="3" fill={cl}/>
      <line x1={xfc} x2={xfc} y1={yT} y2={yB} stroke={ORANGE} strokeWidth="1.6" strokeDasharray="6 4"/>
      {axes(x0, x1, yT, yB)}
      <polyline points={courbe(nature, x0, x1, yT, yB)} fill="none" stroke={cl} strokeWidth="3.4" strokeLinejoin="round"/>
      <text x={xfc} y={yB + 17} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>fc</text>
      <text x={x0 - 4} y={yT + 4} textAnchor="end" fontSize="12.5" fontWeight="800" fill="#334155">A</text>
      <text x={(a + b) / 2} y={yT + 50} textAnchor="middle" fontSize="12" fontWeight="800" fill={cl}>bande</text>
      <text x={(a + b) / 2} y={yT + 64} textAnchor="middle" fontSize="12" fontWeight="800" fill={cl}>passante</text>
      <text x={ox + 68} y="40" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={cl}>{titre}</text>
      <text x={ox + 68} y="172" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={K.txt}>{intervalle}</text>
    </g>);
  };
  return cadre('Bande passante : ensemble des fréquences que le filtre laisse passer, pour lesquelles A est au moins égal à 0,7 fois Amax. Pour un passe-bas, c’est de 0 à fc ; pour un passe-haut, c’est de fc vers les hautes fréquences. En dehors de la bande passante, le signal est atténué.', 252, <g>
    {mini(4, 'bas', TEAL, 'passe-bas', '[ 0 ; fc ]', 'a')}{mini(156, 'haut', VIOLET, 'passe-haut', '[ fc ; +∞ [', 'b')}
    <rect x="18" y="186" width="264" height="34" rx="10" fill="#fff" stroke={TEAL} strokeWidth="2"/>
    <text x="150" y="208" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={K.txt}>bande passante : A ≥ 0,7 × Amax</text>
    <text x="150" y="240" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">hors de la bande, le signal est atténué</text>
  </g>);
}

// Carte 5 : R, C et la fréquence de coupure
export function SvgRCCarte() {
  const fc1 = M.fcRC(220, 1), fc2 = M.fcRC(1000, 1);
  const ligne = (oy, r, fc, cl, key) => (<g key={key}>
    {miniRC(46, oy, 'bas', r, '1 µF', key)}
    <rect x="196" y={oy + 6} width="84" height="40" rx="10" fill="#fff" stroke={cl} strokeWidth="2.2"/>
    <text x="238" y={oy + 23} textAnchor="middle" fontSize="12" fontWeight="700" fill={K.txt}>fc ≈</text>
    <text x="238" y={oy + 40} textAnchor="middle" fontSize="14" fontWeight="800" fill={cl}>{M.nbf(Math.round(fc / 10) * 10, 0)} Hz</text>
  </g>);
  return cadre('Effet de R et de C : pour un filtre RC, la fréquence de coupure est d’autant plus petite que le produit R fois C est grand. Exemples avec C égale 1 microfarad : R égale 220 ohms donne fc environ 720 hertz ; R égale 1 kilo-ohm donne fc environ 160 hertz. Repère : fc vaut 1 divisé par 2 pi R C.', 300, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>R et C fixent fc</text>
    {ligne(58, '220 Ω', fc1, ORANGE, 'a')}
    {ligne(148, '1 kΩ', fc2, '#b45309', 'b')}
    <rect x="18" y="222" width="264" height="30" rx="10" fill="#fff" stroke={TEAL} strokeWidth="2"/>
    <text x="150" y="242" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={K.txt}>R × C plus grand → fc plus petite</text>
    <FormuleSvg x={150} y={272} s={12.5} w={400} c={K.txt} a="middle" parts={['repère : fc = ', { h: '1', b: '2π × R × C' }]} />
    <text x="150" y="291" textAnchor="middle" fontSize="12" fill="#64748b">(R en Ω, C en F, fc en Hz)</text>
  </g>);
}
