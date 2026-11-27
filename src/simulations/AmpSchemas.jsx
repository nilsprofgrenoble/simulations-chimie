// Cartes « À retenir » de la simulation 315 (amplifier, plage du CAN, saturation, décalage par une tension continue, chaîne complète).
// viewBox de 300 de large, textes de 12 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";

const BLEU = '#2563eb', ORANGE = '#ea580c', VERT = '#15803d', ROUGE = '#dc2626', VIOLET = '#7c3aed', AMBRE = '#b45309';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const halo = { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' };
// sinusoïde de x0 à x1 centrée en ym, d'amplitude amp (px), np périodes ; cl : écrêtage {min, max} en y
const sinus = (x0, x1, ym, amp, np, cl = {}, ph = 0) => {
  const p = []; for (let i = 0; i <= 80; i++) { const x = x0 + i / 80 * (x1 - x0); let y = ym - amp * Math.sin(2 * Math.PI * np * i / 80 + ph); if (cl.min !== undefined) y = Math.max(cl.min, y); if (cl.max !== undefined) y = Math.min(cl.max, y); p.push(`${x.toFixed(1)},${y.toFixed(1)}`); }
  return p.join(' ');
};
const fleche = (x1, y1, x2, y2, c = '#64748b') => { const a = Math.atan2(y2 - y1, x2 - x1), l = 8; return (<g><line x1={x1} y1={y1} x2={x2 - 4 * Math.cos(a)} y2={y2 - 4 * Math.sin(a)} stroke={c} strokeWidth="2.4"/>
  <polygon points={`${x2},${y2} ${x2 - l * Math.cos(a - 0.45)},${y2 - l * Math.sin(a - 0.45)} ${x2 - l * Math.cos(a + 0.45)},${y2 - l * Math.sin(a + 0.45)}`} fill={c}/></g>); };

// Carte 1 : amplifier, Us = A × Ue
export function SvgAmpliCarte() {
  return cadre('Amplifier une tension : un amplificateur à AOP multiplie la tension d’entrée Ue par le facteur d’amplification A. Us égale A fois Ue, et A égale Us divisé par Ue, sans unité. Exemple : Ue de 3 millivolts, A égal 250, Us de 0,75 volt.', 244, <g>
    <text x="150" y="25" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Amplifier : Us = A × Ue</text>
    <polyline points={sinus(20, 80, 78, 7, 1.5)} fill="none" stroke={BLEU} strokeWidth="2.8" strokeLinecap="round"/>
    <text x="50" y="112" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>Ue</text>
    {fleche(86, 78, 118, 78)}
    <polygon points="122,44 122,112 190,78" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.6" strokeLinejoin="round"/>
    <text x="141" y="84" textAnchor="middle" fontSize="14" fontWeight="800" fill={K.txt}>A</text>
    {fleche(194, 78, 216, 78)}
    <polyline points={sinus(222, 282, 78, 30, 1.5)} fill="none" stroke={ORANGE} strokeWidth="2.8" strokeLinecap="round"/>
    <text x="252" y="124" textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>Us</text>
    <rect x="42" y="136" width="216" height="40" rx="12" fill="#fff" stroke={ORANGE} strokeWidth="2.4"/>
    <text x="150" y="162" textAnchor="middle" fontSize="16" fontWeight="800" fill={K.txt}>A = Us ÷ Ue</text>
    <text x="150" y="196" textAnchor="middle" fontSize="12.5" fill={K.txt}>A n’a pas d’unité (Us et Ue en même unité)</text>
    <text x="150" y="216" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={VERT}>ex. : 3 mV × 250 = 750 mV = 0,75 V</text>
  </g>);
}

// Carte 2 : le CAN lit de 0 à 5 V
export function SvgCanCarte() {
  const yTop = 50, yBot = 130, ym = 90;
  return cadre('Le convertisseur analogique-numérique lit des tensions de 0 à 5 volts. Un signal dont la tension maximale reste sous 5 volts est converti en entier ; au-dessus de 5 volts il est écrêté. Pour bien utiliser le CAN, la tension de sortie maximale doit être proche de 5 volts sans la dépasser.', 252, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Le CAN lit de 0 à 5 V</text>
    <rect x="46" y={yTop} width="228" height={yBot - yTop} fill={VERT} opacity="0.12"/>
    <line x1="46" x2="274" y1={yTop} y2={yTop} stroke={VERT} strokeWidth="1.8" strokeDasharray="6 4"/><line x1="46" x2="274" y1={yBot} y2={yBot} stroke={VERT} strokeWidth="1.8" strokeDasharray="6 4"/>
    <text x="40" y={yTop + 4.5} textAnchor="end" fontSize="12.5" fontWeight="800" fill={VERT}>5 V</text><text x="40" y={yBot + 4.5} textAnchor="end" fontSize="12.5" fontWeight="800" fill={VERT}>0 V</text>
    <polyline points={sinus(46, 274, ym + 14, 44, 2)} fill="none" stroke={ROUGE} strokeWidth="3" strokeLinecap="round"/>
    <clipPath id="amp-cc"><rect x="46" y={yTop} width="228" height={yBot - yTop}/></clipPath>
    <g clipPath="url(#amp-cc)"><polyline points={sinus(46, 274, ym + 14, 44, 2)} fill="none" stroke={ORANGE} strokeWidth="3.4" strokeLinecap="round"/></g>
    <text x="160" y={yTop - 8} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ROUGE} {...halo}>au-dessus de 5 V : écrêté</text>
    <text x="150" y="162" textAnchor="middle" fontSize="12.5" fill={K.txt}>Le CAN lit les valeurs dans la fenêtre verte</text>
    <text x="150" y="190" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>Il faut Us,max ≤ 5 V</text>
    <text x="150" y="210" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={VERT}>pour bien l’utiliser : Us,max proche de 5 V</text>
    <text x="150" y="232" textAnchor="middle" fontSize="12.5" fill={K.txt}>(au moins 80 % de la plage, soit 4 V)</text>
  </g>);
}

// Carte 3 : saturation de l'AOP
export function SvgSatCarte() {
  const ym = 92, yH = 56, yL = 128;
  return cadre('Un amplificateur à AOP alimenté en plus et moins 12 volts ne peut pas fournir une tension de sortie dont la valeur absolue dépasse 12 volts : il sature et le signal est écrêté. Si A fois Ue dépasse 12 volts, la sortie reste à 12 volts.', 250, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>La saturation de l’AOP</text>
    <line x1="30" x2="278" y1={yH} y2={yH} stroke={AMBRE} strokeWidth="2" strokeDasharray="3 4"/><line x1="30" x2="278" y1={yL} y2={yL} stroke={AMBRE} strokeWidth="2" strokeDasharray="3 4"/>
    <line x1="30" x2="278" y1={ym} y2={ym} stroke="#94a3b8" strokeWidth="1.2"/>
    <text x="276" y={yH - 5} textAnchor="end" fontSize="12.5" fontWeight="800" fill={AMBRE}>+12 V</text><text x="276" y={yL + 15} textAnchor="end" fontSize="12.5" fontWeight="800" fill={AMBRE}>−12 V</text>
    <polyline points={sinus(30, 270, ym, 52, 2)} fill="none" stroke="#fdba74" strokeWidth="2.4" strokeDasharray="4 4"/>
    <polyline points={sinus(30, 270, ym, 52, 2, { min: yH, max: yL })} fill="none" stroke={ORANGE} strokeWidth="3.4" strokeLinejoin="round"/>
    <text x="150" y="160" textAnchor="middle" fontSize="12.5" fill={K.txt}>pointillés : A × Ue (théorique)</text>
    <text x="150" y="180" textAnchor="middle" fontSize="12.5" fill={K.txt}>trait plein : Us réelle, écrêtée</text>
    <text x="150" y="206" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>L’AOP alimenté ±12 V : |Us| ≤ 12 V</text>
    <text x="150" y="226" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={AMBRE}>ex. : A × Ue = 18 V donne Us = 12 V</text>
  </g>);
}

// Carte 4 : tension continue ajoutée pour centrer un signal alternatif
export function SvgDecalCarte() {
  const yT = 40, yB = 120, y0 = yB;
  return cadre('Un signal de capteur qui prend des valeurs négatives est en partie perdu par le CAN. On ajoute une tension continue Vdc : tout le signal est décalé vers le haut sans changer son amplitude, Us égale A fois Ue plus Vdc. Pour centrer un signal dans la plage de 0 à 5 volts, on choisit Vdc égale à 2,5 volts.', 268, <g>
    <text x="150" y="22" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>Centrer le signal : Us = A × Ue + Vdc</text>
    <rect x="56" y={yT} width="218" height={y0 - yT} fill={VERT} opacity="0.11"/>
    <line x1="56" x2="274" y1={yT} y2={yT} stroke={VERT} strokeWidth="1.6" strokeDasharray="6 4"/><line x1="56" x2="274" y1={y0} y2={y0} stroke={VERT} strokeWidth="1.6" strokeDasharray="6 4"/>
    <text x="50" y={yT + 4.5} textAnchor="end" fontSize="12.5" fontWeight="800" fill={VERT}>5 V</text><text x="50" y={y0 + 4.5} textAnchor="end" fontSize="12.5" fontWeight="800" fill={VERT}>0 V</text>
    <polyline points={sinus(56, 274, y0 + 22, 30, 2)} fill="none" stroke={ROUGE} strokeWidth="2.4" strokeDasharray="4 4" opacity="0.7"/>
    <polyline points={sinus(56, 274, (yT + y0) / 2, 30, 2)} fill="none" stroke={ORANGE} strokeWidth="3.4" strokeLinecap="round"/>
    {fleche(150, y0 + 14, 150, (yT + y0) / 2 + 34, VIOLET)}
    <text x="160" y={y0 + 6} fontSize="13" fontWeight="800" fill={VIOLET} {...halo}>+ Vdc</text>
    <text x="150" y="156" textAnchor="middle" fontSize="12.5" fill={K.txt}>pointillés : sans Vdc, la partie négative est perdue</text>
    <text x="150" y="190" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>Vdc décale tout le signal vers le haut</text>
    <text x="150" y="210" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>sans changer son amplitude</text>
    <text x="150" y="232" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={VIOLET}>Vdc au milieu de la plage : 2,5 V</text>
    <text x="150" y="252" textAnchor="middle" fontSize="12.5" fill={K.txt}>ex. : ±1,5 V autour de 2,5 V → de 1 à 4 V</text>
  </g>);
}

// Carte 5 : la chaîne complète
export function SvgChaineCarte() {
  const bloc = (x, y, w, c, l1, l2) => (<g><rect x={x} y={y} width={w} height="48" rx="11" fill="#fff" stroke={c} strokeWidth="2.4"/>
    <text x={x + w / 2} y={y + 21} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{l1}</text><text x={x + w / 2} y={y + 38} textAnchor="middle" fontSize="12" fill={K.txt}>{l2}</text></g>);
  return cadre('La chaîne complète : un capteur délivre quelques millivolts, un amplificateur de facteur A multiplie la tension, une tension continue Vdc centre le signal, et le convertisseur analogique-numérique lit de 0 à 5 volts. A est choisi pour remplir la plage, Vdc pour la centrer, et la tension ne doit pas dépasser 12 volts en valeur absolue. Un montage inverseur a un facteur A négatif : le signal est retourné.', 262, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={K.txt}>De quelques mV au CAN</text>
    {bloc(10, 40, 62, BLEU, 'capteur', 'mV')}{fleche(74, 64, 92, 64)}
    {bloc(94, 40, 62, ORANGE, '× A', 'AOP')}{fleche(158, 64, 176, 64)}
    {bloc(178, 40, 54, VIOLET, '+ Vdc', 'centrer')}{fleche(234, 64, 250, 64)}
    {bloc(252, 40, 40, VERT, 'CAN', '0–5 V')}
    <text x="150" y="124" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>1. A pour remplir la plage (≥ 80 %)</text>
    <text x="150" y="146" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>2. Vdc pour centrer le signal</text>
    <text x="150" y="168" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={K.txt}>3. Rester dans la plage : de 0 à 5 V</text>
    <text x="150" y="196" textAnchor="middle" fontSize="12.5" fill={AMBRE}>et |Us| &lt; 12 V (sinon l’AOP sature)</text>
    <text x="150" y="226" textAnchor="middle" fontSize="12.5" fill={K.txt}>montage inverseur : A &lt; 0, signal retourné</text>
    <text x="150" y="246" textAnchor="middle" fontSize="12.5" fill={K.txt}>montage non inverseur : A &gt; 0</text>
  </g>);
}
