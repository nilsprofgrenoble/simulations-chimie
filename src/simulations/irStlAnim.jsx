// Animations de la simulation 308 : une liaison qui vibre (ressort) et schéma de carte « À retenir ».
import { K, T, svgStyle } from "./schemaOutils";
import { usePhase } from "./hookHorloge";
import { COLA, rayon } from "./hookAtomes";
import { fAnim } from "./hookModele";
import { MASSE_ATOME } from "./irStlVibCte";

function Zigzag({ x1, x2, y, n = 9, ep = 2.4, col = '#0f766e' }) {
  const pts = []; for (let i = 0; i <= n; i++) pts.push(`${(x1 + (x2 - x1) * i / n).toFixed(1)},${(y + (i % 2 ? 10 : -10) * (i === 0 || i === n ? 0 : 1)).toFixed(1)}`);
  return <polyline points={pts.join(' ')} fill="none" stroke={col} strokeWidth={ep}/>;
}
const atome = (x, y, r, s) => <g key={`${x}${s}`}><circle cx={x} cy={y} r={r} fill={COLA[s] ?? '#94a3b8'} stroke="#0f172a" strokeWidth="1.6"/>{T(x, y + 5, s, { size: 14, gras: true, fill: s === 'H' ? K.txt : '#fff' })}</g>;

// Deux atomes reliés par un ressort ; l'atome léger bouge davantage ; fréquence d'animation proportionnelle à σ.
export function SceneLiaisonStl({ liaison, anime }) {
  const ph = usePhase(fAnim(liaison.sigma), anime);
  const ma = MASSE_ATOME[liaison.a], mb = MASSE_ATOME[liaison.b], tot = ma + mb, ra = rayon(ma), rb = rayon(mb), xa0 = 90, xb0 = 250, ya = 56;
  const dep = anime ? 16 * Math.sin(ph) : 0, xa = xa0 - dep * mb / tot, xb = xb0 + dep * ma / tot;
  return (<svg role="img" aria-label={`Liaison ${liaison.nom} : deux atomes reliés par un ressort qui vibre`} viewBox="0 0 340 112" width="100%" style={svgStyle}>
    <Zigzag x1={xa + ra} x2={xb - rb} y={ya}/>{atome(xa, ya, ra, liaison.a)}{atome(xb, ya, rb, liaison.b)}
    {!anime && <g>{T(xa0 - 2, 18, '←', { size: 18, fill: K.gris })}{T(xa0 + 26, 18, '→', { size: 18, fill: K.gris })}{T(xb0 - 26, 18, '←', { size: 18, fill: K.gris })}{T(xb0 + 2, 18, '→', { size: 18, fill: K.gris })}</g>}
    {T(170, 104, `liaison ${liaison.nom}`, { size: 13, gras: true, fill: '#0f766e' })}
  </svg>);
}

// Carte « À retenir » : liaison qui vibre → photon absorbé → bande (viewBox 300 de large, textes ≥ 12,5).
export function SvgVibrationCarte() {
  return (<svg role="img" aria-label="Une liaison qui vibre absorbe un photon infrarouge et donne une bande d'absorption sur le spectre" viewBox="0 0 300 196" width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="6" y="6" width="288" height="184" rx="14" fill="#f8fafc" stroke={K.clair}/>
    <Zigzag x1={98} x2={190} y={44} ep={2.4}/>{atome(84, 44, 14, 'C')}{atome(204, 44, 11, 'H')}
    {T(84, 74, '←→', { size: 13, fill: K.gris })}{T(204, 74, '←→', { size: 13, fill: K.gris })}
    {T(150, 22, 'la liaison vibre', { size: 13, gras: true, fill: '#0f766e' })}
    <path d="M26 112 q22 -22 44 0 t44 0" fill="none" stroke={K.bleu} strokeWidth="2.4"/>
    {T(60, 138, 'photon IR', { size: 12.5, fill: K.bleu, gras: true })}
    <line x1="120" y1="112" x2="146" y2="112" stroke={K.bleu} strokeWidth="2.4"/><polygon points="146,106 158,112 146,118" fill={K.bleu}/>
    <line x1="172" y1="168" x2="280" y2="168" stroke={K.gris}/>
    <path d="M172 140 L212 140 Q222 140 224 168 Q226 140 236 140 L280 140" fill="none" stroke={K.bleu} strokeWidth="2.4"/>
    {T(224, 184, 'bande à σ', { size: 12.5, fill: K.gris })}
  </svg>);
}
