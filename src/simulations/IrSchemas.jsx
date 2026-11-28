// Schémas des cartes « À retenir » de la simulation 111 (spectroscopie infrarouge). viewBox de 300, texte de 12,5.
import { FormuleSvg } from '../svgFrac';
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const X = s => 20 + (4000 - s) / 3500 * 260;   // nombre d'onde → abscisse (axe orienté de droite à gauche)
// Spectre schématique : ligne de base à y0 − h, creux de profondeur d et de demi-largeur l centrés en s
const creux = (y0, creuxs, c = BLEU, hb = 26) => {
  const pts = [`20,${y0 - hb}`];
  creuxs.forEach(([s, l, d]) => { const x = X(s); pts.push(`${x - l * 1.6},${y0 - hb}`, `${x - l * 0.6},${y0 - hb + d * 0.6}`, `${x},${y0 - hb + d}`, `${x + l * 0.6},${y0 - hb + d * 0.6}`, `${x + l * 1.6},${y0 - hb}`); });
  pts.push(`280,${y0 - hb}`);
  return <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round"/>;
};
const Base = ({ y0 }) => <line x1="20" y1={y0} x2="284" y2={y0} stroke={GRIS} strokeWidth="1.5"/>;

export const FPrincipe = () => (
  <Svg h={130} aria="Le faisceau d'intensité I0 traverse l'échantillon ; l'intensité I qui ressort est plus faible car une partie est absorbée ; la transmittance est I divisé par I0">
    <line x1="8" y1="46" x2="80" y2="46" stroke={ORANGE} strokeWidth="4"/><polygon points="92,46 80,39 80,53" fill={ORANGE}/>
    <rect x="96" y="20" width="80" height="52" rx="8" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.5"/><T x={136} y={51} a="middle" c={BLEU} w={700}>échantillon</T>
    <line x1="184" y1="46" x2="250" y2="46" stroke={ORANGE} strokeWidth="2" strokeDasharray="6 4"/><polygon points="262,46 250,39 250,53" fill={ORANGE}/>
    <T x={50} y={34} a="middle" c={ORANGE} w={800}>I₀</T><T x={226} y={34} a="middle" c={ORANGE} w={800}>I</T>
    <FormuleSvg x={150} y={100} s={12.5} w={700} c={ENCRE} a="middle" parts={['T = ', { h: 'I', b: 'I₀' }, ' (en %)']} /><T x={150} y={120} a="middle" c={GRIS}>absorbé = 100 % − T</T>
  </Svg>);

export const FAxes = () => (
  <Svg h={150} aria="Spectre infrarouge : la transmittance en pourcentage en fonction du nombre d'onde, orienté de 4000 à gauche vers 500 à droite ; une bande d'absorption est un creux vers le bas">
    <Base y0={104}/><line x1="20" y1="104" x2="20" y2="14" stroke={GRIS} strokeWidth="1.5"/>
    <T x={26} y={14} c={GRIS}>T (%)</T>
    {creux(104, [[2200, 26, 66]], BLEU, 76)}
    <T x={284} y={60} a="end" c={ROUGE} w={700}>bande = creux</T>
    <T x={20} y={126} c={GRIS}>4000</T><T x={284} y={126} a="end" c={GRIS}>500</T><T x={152} y={144} a="middle" c={GRIS}>σ (cm⁻¹), de droite à gauche</T>
  </Svg>);

export const FOH = () => (
  <Svg h={180} aria="Trois bandes O–H : alcool libre vers 3600 centimètres moins un, étroite ; alcool lié vers 3300, large et forte ; acide carboxylique vers 2900, très large">
    {[[3600, 3, 40, 'libre : 3600, étroite', BLEU, 22], [3300, 12, 40, 'lié : 3300, large, forte', ROUGE, 70], [2900, 30, 36, 'acide : 2900, très large', ORANGE, 118]].map(([s, l, d, nom, c, y]) => <g key={nom}>
      <Base y0={y + 36}/>{creux(y + 36, [[s, l, d]], c, 34)}<T x={150} y={y + 22} c={c} w={700}>{nom}</T></g>)}
    <T x={150} y={176} a="middle" c={GRIS}>liaisons H ⇒ bande large, vers les petits σ</T>
  </Svg>);

export const FCO = () => (
  <Svg h={172} aria="La bande C=O est étroite et forte vers 1700 centimètres moins un ; un acide carboxylique a en plus une bande O–H très large vers 2900">
    <T x={8} y={16} c={VERT} w={700}>cétone : C=O seul</T><Base y0={64}/>{creux(64, [[1700, 3, 36]], VERT, 34)}
    <T x={X(1700)} y={84} a="middle" c={VERT} w={700}>1700</T>
    <T x={8} y={102} c={ORANGE} w={700}>acide : O–H + C=O</T><Base y0={150}/>{creux(150, [[2900, 30, 34], [1700, 3, 36]], ORANGE, 34)}
    <T x={X(1700)} y={170} a="middle" c={ORANGE} w={700}>1700</T><T x={X(2900)} y={170} a="middle" c={ORANGE} w={700}>2900</T>
  </Svg>);

export const FReaction = () => (
  <Svg h={164} aria="Avant l'oxydation l'alcool montre une bande O–H large vers 3300 ; après, dans la cétone, cette bande a disparu et une bande C=O fine apparaît vers 1700">
    <T x={8} y={16} c={BLEU} w={700}>réactif : alcool</T><Base y0={64}/>{creux(64, [[3300, 12, 36]], BLEU, 34)}
    <T x={8} y={84} c={ROUGE} w={700}>produit : cétone</T><Base y0={130}/>{creux(130, [[1700, 3, 36]], ROUGE, 34)}
    <T x={150} y={158} a="middle" c={VERT} w={700}>O–H disparaît, C=O apparaît</T>
  </Svg>);

export const FIdent = () => (
  <Svg h={148} aria="Deux spectres, celui du produit et celui de la chalcone de référence, parfaitement superposés, y compris dans la zone de l'empreinte digitale ; seule cette superposition complète prouve l'identité">
    <rect x={X(1500)} y="20" width={284 - X(1500)} height="84" fill="#f1f5f9"/><T x={(X(1500) + 284) / 2} y={36} a="middle" c={GRIS}>empreinte</T>
    <Base y0={110}/>
    {creux(110, [[1650, 3, 52], [1250, 10, 30], [900, 8, 40]], ROUGE, 56)}
    <g transform="translate(0,1.5)">{creux(110, [[1650, 3, 52], [1250, 10, 30], [900, 8, 40]], BLEU, 56)}</g>
    <T x={20} y={16} c={BLEU} w={700}>produit</T><T x={90} y={16} c={ROUGE} w={700}>référence</T>
    <T x={150} y={138} a="middle" c={VERT} w={700}>tout se superpose ⇒ même composé</T>
  </Svg>);
