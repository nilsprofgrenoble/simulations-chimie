// Schémas de la simulation 298 (titrage indirect : eau de Javel, iodure puis thiosulfate) : montage de dosage animé (burette qui se vide, zoom de lecture,
// pipette d’iodure, goutte qui décolore, empois d’amidon), graphique des quantités de matière et cartes « À retenir ».
import { useId } from 'react';
import { KIT, Cadre, ORANGE_GUIDE } from '../commun';
import * as M from './tixModele';

const { V_BURETTE, COUL_BURETTE } = M;
const C = { iode: '#b45309', iodeFond: '#fef3c7', thio: '#1d4ed8', thioFond: '#dbeafe', clo: '#0f766e', cloFond: '#ccfbf1', vert: '#15803d', rouge: '#b91c1c', encre: '#0f172a', gris: '#475569', orange: '#c2410c', amidon: '#312e81' };

const css = `
@media (prefers-reduced-motion: no-preference) {
  .tix-chute { animation: tix-chute 0.42s ease-in both; }
  @keyframes tix-chute { from { transform: translateY(0); opacity: 1; } 90% { opacity: 1; } to { transform: translateY(var(--chute)); opacity: 0; } }
  .tix-onde { transform-box: fill-box; transform-origin: center; animation: tix-onde 0.8s ease-out 0.4s both; }
  @keyframes tix-onde { from { transform: scale(0.4); opacity: 0.8; } to { transform: scale(5); opacity: 0; } }
  .tix-fondu { animation: tix-fondu 0.4s ease-out; } @keyframes tix-fondu { from { opacity: 0; } to { opacity: 1; } }
}
`;
export const StylesTix = () => <style>{css}</style>;

// ====================================================================== LE MONTAGE
/**
 * V : volume versé (mL). coul : couleur de la solution. trans : 0 à 1, tache décolorée qui se dissipe après une goutte de thiosulfate.
 * iode : 0 à 1, formation du diiode (la pipette d’iodure est dessinée tant que 0 < iode < 1). ouvert : robinet ouvert. goutteCle : rejoue la chute d’une goutte.
 * etiqBurette / etiqErlen : lignes de texte. hl : encadrés de focus (burette, erlen, agitateur).
 */
export function SceneDosageIndirect({ anime = true, V, coul, trans = 0, iode = 1, ouvert, goutteCle = 0, mot = 'incolore', etiqBurette = null, etiqErlen = null, hl = () => false, legende = true }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const yB0 = 46, yB1 = 226, yNiv = yB0 + V / V_BURETTE * (yB1 - yB0);
  const ySurf = 372 - (V / V_BURETTE) * 10, yBout = 292;
  const FLACON = 'M 250 298 L 250 332 Q 250 342 244 350 L 202 394 Q 196 400 205 400 L 335 400 Q 344 400 338 394 L 296 350 Q 290 342 290 332 L 290 298';
  const pipette = iode > 0 && iode < 1;
  return (
    <svg viewBox="0 0 640 440" role="img" aria-label="Montage du titrage indirect : burette de thiosulfate, erlenmeyer contenant l’eau de Javel diluée, l’iodure et l’acide, sur agitateur magnétique"
      style={{ width: '100%', height: 'auto', display: 'block', background: '#f1f5f9', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <defs>
        <clipPath id={`${id}f`}><path d={`${FLACON} Z`}/></clipPath>
        <radialGradient id={`${id}n`}><stop offset="0" stopColor="#fff" stopOpacity="0.95"/><stop offset="0.6" stopColor="#fff" stopOpacity="0.55"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
        <radialGradient id={`${id}b`}><stop offset="0" stopColor="#7c2d12" stopOpacity="0.9"/><stop offset="0.6" stopColor="#b45309" stopOpacity="0.5"/><stop offset="1" stopColor="#d97706" stopOpacity="0"/></radialGradient>
        <linearGradient id={`${id}v`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.5"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
      </defs>
      {/* potence */}
      <rect x="120" y="420" width="512" height="12" rx="3" fill="#94a3b8"/><rect x="620" y="24" width="10" height="398" fill="#94a3b8"/>
      <rect x="262" y="131" width="360" height="8" fill="#94a3b8"/><rect x="254" y="124" width="36" height="22" rx="5" fill="#64748b"/>
      {/* burette */}
      <rect x="258" y="30" width="24" height={yB1 - 30} fill="#fff" stroke={KIT.txt} strokeWidth="2"/>
      <rect x="260" y={yNiv} width="20" height={yB1 - yNiv} fill={COUL_BURETTE}/>
      <rect x="263" y={yNiv} width="4" height={yB1 - yNiv} fill="#fff" opacity="0.5"/>
      <path d={`M 260 ${yNiv} Q 270 ${yNiv + 4} 280 ${yNiv}`} fill="none" stroke="#1e3a8a" strokeWidth="1.6"/>
      {Array.from({ length: 26 }, (_, k) => k).map(v => {
        const y = yB0 + v / V_BURETTE * (yB1 - yB0);
        return <g key={v}><line x1="282" y1={y} x2={v % 5 === 0 ? 296 : 289} y2={y} stroke={KIT.txt} strokeWidth="1"/>
          {v % 5 === 0 && <text x="300" y={y + 7} fontSize="20" fill={KIT.txt}>{v}</text>}</g>;
      })}
      <path d={`M 258 ${yB1} L 266 ${yB1 + 20} L 274 ${yB1 + 20} L 282 ${yB1} Z`} fill={V < V_BURETTE ? COUL_BURETTE : '#fff'} stroke={KIT.txt} strokeWidth="2"/>
      <rect x="262" y={yB1 + 20} width="16" height="10" rx="2" fill="#cbd5e1" stroke={KIT.txt}/>
      <g style={{ transformBox: 'fill-box' }}><rect x="278" y={yB1 + 22} width="28" height="6" rx="3" fill={ouvert ? C.vert : C.rouge}
        transform={ouvert ? `rotate(-90 278 ${yB1 + 25})` : undefined}/></g>
      <path d={`M 266 ${yB1 + 30} L 266 ${yBout - 12} L 270 ${yBout} L 274 ${yBout - 12} L 274 ${yB1 + 30} Z`} fill={V < V_BURETTE ? COUL_BURETTE : '#fff'} stroke={KIT.txt} strokeWidth="1.8"/>
      <rect x="262" y="38" width="3" height={yB1 - 44} fill={`url(#${id}v)`} opacity="0.6"/>
      <text x="346" y="40" fontSize="20" fontWeight="700" fill={KIT.txt2}>Burette</text>
      {etiqBurette ? etiqBurette.map((t, k) => <text key={k} x="346" y={68 + k * 25} fontSize="19.5" fill={KIT.txt}>{t}</text>)
        : <text x="346" y="84" fontSize="40" fontWeight="800" fill={ORANGE_GUIDE}>?</text>}
      {/* zoom de lecture */}
      {(() => {
        const z0 = 70, zy = 56, zh = 150, zw = 62, mlParPx = 2 / zh, Yz = v => zy + zh / 2 + (v - V) / mlParPx;
        return <g>
          <rect x={z0} y={zy} width={zw} height={zh} fill="#fff" stroke={KIT.txt} strokeWidth="1.5"/>
          <rect x={z0 + 1} y={Math.max(zy, Math.min(zy + zh, Yz(V)))} width={zw - 2} height={Math.max(0, zy + zh - Math.max(zy, Yz(V)))} fill={COUL_BURETTE}/>
          {Array.from({ length: 41 }, (_, k) => Math.round(V * 10) / 10 - 2 + k * 0.1).map(v => {
            const y = Yz(v); if (y < zy || y > zy + zh || v < -0.001 || v > V_BURETTE + 0.001) return null;
            const r10 = Math.round(v * 10);
            return <g key={r10}><line x1={z0 + zw - (r10 % 10 === 0 ? 20 : r10 % 5 === 0 ? 14 : 8)} y1={y} x2={z0 + zw} y2={y} stroke={r10 % 5 === 0 ? '#1e3a8a' : '#93c5fd'} strokeWidth="1.4"/>
              {r10 % 10 === 0 && <text x={z0 - 4} y={y + 7} fontSize="20" fill={KIT.txt} textAnchor="end">{r10 / 10}</text>}</g>;
          })}
          <path d={`M ${z0} ${Yz(V) - 2} Q ${z0 + zw / 2} ${Yz(V) + 7} ${z0 + zw} ${Yz(V) - 2}`} fill="none" stroke="#1e3a8a" strokeWidth="2"/>
          <line x1={z0 - 8} y1={zy + zh / 2} x2={z0 + zw + 8} y2={zy + zh / 2} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x={z0 + zw / 2} y={zy - 22} fontSize="20" fill={KIT.txt2} textAnchor="middle">zoom (mL)</text>
          <line x1={z0 + zw} y1={zy + zh / 2} x2="258" y2={yNiv} stroke="#94a3b8" strokeDasharray="3 3"/>
        </g>;
      })()}
      {/* fond blanc, agitateur, erlenmeyer */}
      <rect x="176" y="290" width="188" height="110" rx="10" fill="#fff" stroke="#cbd5e1"/>
      <rect x="186" y="400" width="168" height="20" rx="4" fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/>
      <circle cx="208" cy="410" r="5" fill="none" stroke={KIT.txt}/><circle cx="332" cy="410" r="4" fill="#22c55e"/>
      <g clipPath={`url(#${id}f)`}>
        <rect x="190" y={ySurf} width="160" height={402 - ySurf} fill={coul}/>
        {pipette && <ellipse cx="262" cy={ySurf + 14} rx={14 + iode * 60} ry={8 + iode * 24} fill={`url(#${id}b)`} opacity={1 - iode * 0.5}/>}
        <ellipse cx="270" cy={ySurf + 16} rx={14 + trans * 38} ry={8 + trans * 16} fill={`url(#${id}n)`} opacity={Math.min(1, trans * 1.15)}/>
        <rect x="257" y="388" width="26" height="6" rx="3" fill="#fff" stroke="#64748b">
          {anime && <animate attributeName="width" values="26;6;26" dur="0.5s" repeatCount="indefinite"/>}{anime && <animate attributeName="x" values="257;267;257" dur="0.5s" repeatCount="indefinite"/>}</rect>
      </g>
      <line x1="230" y1={ySurf} x2="310" y2={ySurf} stroke="#fff" strokeOpacity="0.55" clipPath={`url(#${id}f)`}/>
      <path d={FLACON} fill="none" stroke={KIT.txt} strokeWidth="2.5" strokeLinejoin="round"/>
      <rect x="246" y="294" width="48" height="7" rx="2" fill="none" stroke={KIT.txt} strokeWidth="2"/>
      <path d="M 254 304 L 254 330" stroke="#fff" strokeWidth="3.5" opacity="0.7"/>
      {/* pipette d’iodure de potassium (pendant la formation du diiode) */}
      {pipette && <g>
        <g transform="rotate(-32 252 280)">
          <rect x="246" y="206" width="12" height="62" rx="3" fill="#fff" stroke={KIT.txt} strokeWidth="1.8"/><rect x="248" y="232" width="8" height="36" fill="#fde68a" opacity="0.8"/>
          <path d="M 246 268 L 252 284 L 258 268 Z" fill="#fff" stroke={KIT.txt} strokeWidth="1.8" strokeLinejoin="round"/><rect x="244" y="196" width="16" height="14" rx="5" fill="#dc2626" stroke={KIT.txt} strokeWidth="1.5"/>
        </g>
        {[0, 1, 2].map(k => <circle key={k} cx="252" cy="284" r="3.2" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8">{anime && <animate attributeName="cy" from="286" to={ySurf - 2} dur="0.5s" begin={`${k * 0.17}s`} repeatCount="indefinite"/>}</circle>)}
        <text x="116" y="252" fontSize="17" fontWeight="700" fill={C.iode}>iodure de potassium</text><text x="116" y="272" fontSize="17" fontWeight="700" fill={C.iode}>+ acide</text>
      </g>}
      {/* goutte(s) de thiosulfate */}
      {ouvert && [0, 1, 2].map(k => <circle key={k} cx="270" cy={yBout + 4} r="3.4" fill="#60a5fa">
        {anime && <animate attributeName="cy" from={yBout + 3} to={ySurf - 2} dur="0.5s" begin={`${k * 0.17}s`} repeatCount="indefinite"/>}</circle>)}
      {ouvert && <ellipse cx="270" cy={ySurf} rx="6" ry="2" fill="none" stroke="#1d4ed8" strokeWidth="1.5" opacity="0.7">
        {anime && <animate attributeName="rx" values="4;24" dur="0.5s" repeatCount="indefinite"/>}{anime && <animate attributeName="opacity" values="0.8;0" dur="0.5s" repeatCount="indefinite"/>}</ellipse>}
      {!ouvert && goutteCle > 0 && <g key={goutteCle}>
        <circle className="tix-chute" style={{ '--chute': `${ySurf - yBout - 6}px` }} cx="270" cy={yBout + 5} r="4" fill="#60a5fa"/>
        <ellipse className="tix-onde" cx="270" cy={ySurf} rx="8" ry="2.5" fill="none" stroke="#1d4ed8" strokeWidth="1.6"/></g>}
      {/* contenu de l’erlenmeyer et légende de teinte */}
      <text x="372" y="298" fontSize="20" fontWeight="700" fill={KIT.txt2}>Erlenmeyer</text>
      {etiqErlen && etiqErlen.map((t, k) => <text key={k} x="372" y={324 + k * 25} fontSize="19.5" fill={KIT.txt}>{t}</text>)}
      {legende && <g>
        <rect x="346" y="150" width="264" height="108" rx="10" fill="#fff" stroke={KIT.bord}/>
        <text x="360" y="174" fontSize="20" fontWeight="700" fill={KIT.txt}>teinte de la solution</text>
        <rect x="360" y="190" width="64" height="44" rx="8" fill={coul} stroke={KIT.txt}/>
        <text x="436" y="219" fontSize="21" fontWeight="800" fill={mot.startsWith('bleu') ? C.amidon : mot === 'incolore' ? KIT.txt2 : C.iode}>{mot}</text>
        <text x="360" y="251" fontSize="17" fill={KIT.txt2}>fond blanc : on voit mieux</text>
      </g>}
      <Cadre actif={hl('burette')} x={204} y={20} w={110} h={282}/>
      <Cadre actif={hl('erlen')} x={176} y={288} w={190} h={114}/>
      <Cadre actif={hl('agitateur')} x={180} y={398} w={180} h={26}/>
    </svg>
  );
}

// ====================================================================== GRAPHIQUE DES QUANTITÉS DE MATIÈRE
/** n(I₂) restant (brun) et n(S₂O₃²⁻) versé (bleu) en fonction du volume versé ; tracés jusqu’au volume déjà versé. */
export function GraphIode({ s, V, etat }) {
  const W = 460, H = 250, x0 = 58, x1 = W - 14, y0 = 34, y1 = H - 44;
  const base = Math.max(2 * s.nI2, 0.2), pasN = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5].find(p => Math.ceil(base * 1.05 / p) <= 5) || 5, nmax = Math.max(Math.ceil(base * 1.05 / pasN) * pasN, pasN), Vmax = V_BURETTE;
  const X = v => x0 + (v / Vmax) * (x1 - x0), Y = n => y1 - (n / nmax) * (y1 - y0);
  const pas = Math.max(0.05, Vmax / 250), pts = [];
  for (let v = 0; v <= V + 1e-9; v += pas) pts.push(v);
  if (pts[pts.length - 1] < V) pts.push(V);
  const ligne = f => pts.map((v, k) => `${k ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(f(v)).toFixed(1)}`).join(' ');
  const nI2 = v => Math.max(0, s.nI2 - s.cB * v / 2), nS = v => s.cB * v;
  const ticksY = Array.from({ length: Math.round(nmax / pasN) + 1 }, (_, k) => k * pasN);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Quantités de matière de diiode restant et de thiosulfate versé en fonction du volume versé" style={{ width: '100%', height: 'auto', display: 'block', background: '#fff', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {ticksY.map(n => <g key={n}><line x1={x0} x2={x1} y1={Y(n)} y2={Y(n)} stroke="#e2e8f0"/><text x={x0 - 6} y={Y(n) + 6} fontSize="16" fill={KIT.txt2} textAnchor="end">{(Math.round(n * 100) / 100).toString().replace('.', ',')}</text></g>)}
      <text x="8" y="16" fontSize="16" fill={KIT.txt2}>n (mmol)</text>
      {[0, 5, 10, 15, 20, 25].map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={y1} y2={y1 + 5} stroke={KIT.txt}/><text x={X(v)} y={y1 + 22} fontSize="16" fill={KIT.txt2} textAnchor="middle">{v}</text></g>)}
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={KIT.txt}/><line x1={x0} x2={x0} y1={y0} y2={y1} stroke={KIT.txt}/>
      <text x={(x0 + x1) / 2} y={H - 6} fontSize="16" fill={KIT.txt2} textAnchor="middle">volume de thiosulfate versé (mL)</text>
      <path d={ligne(nS)} fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeDasharray="6 4"/>
      <path d={ligne(nI2)} fill="none" stroke={C.iode} strokeWidth="3.5" strokeLinecap="round"/>
      {V >= s.Veq && s.nI2 > 0 && <g><line x1={X(s.Veq)} x2={X(s.Veq)} y1={y0} y2={y1} stroke={ORANGE_GUIDE} strokeDasharray="4 4" strokeWidth="2"/><text x={X(s.Veq) + 5} y={y0 + 14} fontSize="16" fontWeight="700" fill={C.orange}>équivalence</text></g>}
      <circle cx={X(V)} cy={Y(etat.nI2)} r="5.5" fill={C.iode} stroke="#fff" strokeWidth="1.5"/>
      <circle cx={X(V)} cy={Y(etat.nS)} r="5.5" fill={C.thio} stroke="#fff" strokeWidth="1.5"/>
      <g fontSize="16" fontWeight="700"><line x1="300" x2="320" y1="40" y2="40" stroke={C.iode} strokeWidth="3.5"/><text x="326" y="45" fill={C.iode}>I₂ restant</text>
        <line x1="300" x2="320" y1="62" y2="62" stroke="#93c5fd" strokeWidth="2.5" strokeDasharray="6 4"/><text x="326" y="67" fill={C.thio}>S₂O₃²⁻ versé</text></g>
    </svg>
  );
}

// ====================================================================== CARTES « À RETENIR » (viewBox 300 de large, textes ≥ 12,5)
const Fond = ({ h, children, titre }) => <svg viewBox={`0 0 300 ${h}`} width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }} role="img"><title>{titre}</title>{children}</svg>;
const Titre = ({ t }) => <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.encre}>{t}</text>;
const Ind = ({ t }) => t.split(/_([A-Za-z0-9])/).map((m, i) => i % 2 ? <tspan key={i} fontSize="0.75em" dy="3">{m}</tspan> : (i > 0 && m ? <tspan key={i} dy="-3">{m}</tspan> : m));
const Fleche = ({ x1, x2, y, c = C.gris }) => <g><line x1={x1} y1={y} x2={x2 - 6} y2={y} stroke={c} strokeWidth="2.4"/><path d={`M ${x2} ${y} l -9 -5 v 10 Z`} fill={c}/></g>;
const Verre = ({ x, y, coul, w = 52, h = 60, niv = 0.6 }) => {
  const yl = y + h * (1 - niv);
  return <g>
    <path d={`M${x + w * 0.34} ${y} V${y + h * 0.28} L${x + 2} ${y + h - 4} Q${x} ${y + h} ${x + 6} ${y + h} H${x + w - 6} Q${x + w} ${y + h} ${x + w - 2} ${y + h - 4} L${x + w * 0.66} ${y + h * 0.28} V${y}`} fill="#fff" stroke={C.encre} strokeWidth="2" strokeLinejoin="round"/>
    <path d={`M${x + w * 0.2} ${yl} L${x + 5} ${y + h - 4} Q${x + 4} ${y + h - 1} ${x + 8} ${y + h - 1} H${x + w - 8} Q${x + w - 4} ${y + h - 1} ${x + w - 5} ${y + h - 4} L${x + w * 0.8} ${yl} Z`} fill={coul} stroke="none"/>
  </g>;
};

export function SvgPrincipeCarte() {
  return <Fond h="234" titre="Titrage indirect : deux réactions successives">
    <Titre t="Deux réactions, un seul dosage"/>
    <rect x="8" y="34" width="84" height="74" rx="12" fill={C.cloFond} stroke={C.clo} strokeWidth="2"/><text x="50" y="62" textAnchor="middle" fontSize="13" fill={C.gris}>à doser</text><text x="50" y="86" textAnchor="middle" fontSize="17" fontWeight="800" fill={C.clo}><Ind t="ClO⁻"/></text><text x="50" y="102" textAnchor="middle" fontSize="12.5" fill={C.gris}>(Javel)</text>
    <rect x="108" y="34" width="84" height="74" rx="12" fill={C.iodeFond} stroke={C.iode} strokeWidth="2"/><text x="150" y="62" textAnchor="middle" fontSize="13" fill={C.gris}>formé</text><text x="150" y="86" textAnchor="middle" fontSize="17" fontWeight="800" fill={C.iode}><Ind t="I₂"/></text><text x="150" y="102" textAnchor="middle" fontSize="12.5" fill={C.gris}>(brun)</text>
    <rect x="208" y="34" width="84" height="74" rx="12" fill="#f8fafc" stroke={C.gris} strokeWidth="2"/><text x="250" y="62" textAnchor="middle" fontSize="13" fill={C.gris}>produits</text><text x="250" y="86" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.gris}>I⁻ et S₄O₆²⁻</text><text x="250" y="102" textAnchor="middle" fontSize="12.5" fill={C.gris}>(incolores)</text>
    <Fleche x1={92} x2={108} y={71}/><Fleche x1={192} x2={208} y={71}/>
    <text x="50" y="128" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={C.iode}>1. I⁻ en excès</text><text x="200" y="128" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={C.thio}>2. S₂O₃²⁻ titrant</text>
    <rect x="12" y="142" width="276" height="48" rx="12" fill="#fff" stroke={C.orange} strokeWidth="2"/>
    <text x="150" y="162" textAnchor="middle" fontSize="13" fill={C.encre}>on dose le diiode formé, dont la</text><text x="150" y="180" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.encre}>quantité est liée à celle de ClO⁻</text>
    <text x="150" y="212" textAnchor="middle" fontSize="12.5" fill={C.gris}>le diiode formé remplace l’espèce à doser</text>
  </Fond>;
}
export function SvgChaineCarte() {
  const L = [['1', 'ClO⁻ + 2 I⁻ + 2 H⁺ → I₂ + Cl⁻ + H₂O', '1 ClO⁻ donne 1 I₂', C.clo], ['2', 'I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻', '1 I₂ réagit avec 2 S₂O₃²⁻', C.thio]];
  return <Fond h="236" titre="Chaîne de rapports entre les quantités de matière">
    <Titre t="Deux équations, une chaîne"/>
    {L.map(([n, eq, rap, c], i) => <g key={n} transform={`translate(0 ${32 + i * 62})`}>
      <rect x="10" y="0" width="280" height="54" rx="12" fill="#fff" stroke={c} strokeWidth="2"/><circle cx="29" cy="27" r="12" fill={c}/><text x="29" y="32" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">{n}</text>
      <text x="50" y="22" fontSize="12.5" fontWeight="700" fill={C.encre}>{eq}</text><text x="50" y="42" fontSize="13" fill={c} fontWeight="700">{rap}</text></g>)}
    <rect x="10" y="160" width="280" height="64" rx="12" fill="#fff7ed" stroke={C.orange} strokeWidth="2"/>
    <text x="150" y="182" textAnchor="middle" fontSize="13" fill={C.encre}>on enchaîne les deux rapports :</text>
    <text x="150" y="203" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.encre}><Ind t="n(ClO⁻) = n(I₂) = n(S₂O₃²⁻) / 2"/></text>
    <text x="150" y="218" textAnchor="middle" fontSize="12.5" fill={C.gris}>à l’équivalence</text>
  </Fond>;
}
export function SvgAmidonCarte() {
  return <Fond h="226" titre="L’empois d’amidon rend la fin du dosage plus visible">
    <Titre t="L’empois d’amidon : du bleu à l’incolore"/>
    <Verre x={20} y={40} coul="rgb(243, 214, 120)" niv={0.55}/><Verre x={124} y={40} coul="rgb(40, 48, 130)" niv={0.55}/><Verre x={228} y={40} coul="rgb(250, 251, 252)" niv={0.55}/>
    <Fleche x1={78} x2={118} y={76} c={C.thio}/><Fleche x1={182} x2={222} y={76} c={C.thio}/>
    <text x="46" y="118" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={C.iode}>jaune pâle</text><text x="150" y="118" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={C.amidon}>bleu-noir</text><text x="254" y="118" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={C.gris}>incolore</text>
    <text x="98" y="68" textAnchor="middle" fontSize="12" fill={C.gris}>+ amidon</text><text x="202" y="68" textAnchor="middle" fontSize="12" fill={C.gris}>+ S₂O₃²⁻</text>
    <rect x="12" y="132" width="276" height="42" rx="12" fill="#eef2ff" stroke={C.amidon} strokeWidth="2"/><text x="150" y="150" textAnchor="middle" fontSize="13" fill={C.encre}>I₂ + amidon : complexe bleu-noir</text><text x="150" y="167" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.encre}>équivalence : le bleu disparaît</text>
    <text x="150" y="196" textAnchor="middle" fontSize="12.5" fill={C.gris}>on l’ajoute quand la solution est jaune pâle,</text><text x="150" y="213" textAnchor="middle" fontSize="12.5" fill={C.gris}>près de la fin du dosage</text>
  </Fond>;
}
export function SvgCalculCarte() {
  const L = [['1', 'thiosulfate versé', 'n(S₂O₃²⁻) = c_B × V_E', C.thio], ['2', 'diiode, puis Javel prélevée', 'n(ClO⁻) = n(S₂O₃²⁻) / 2', C.iode], ['3', 'concentration prélevée', 'c_A = n(ClO⁻) / V_A', C.clo], ['4', 'Javel du commerce', 'c_0 = dilution × c_A', C.orange]];
  return <Fond h="262" titre="Du volume équivalent à la concentration"><Titre t="Du volume équivalent à c₀"/>
    {L.map(([n, t, f, c], i) => <g key={n} transform={`translate(0 ${30 + i * 57})`}>
      <rect x="10" y="0" width="280" height="50" rx="12" fill="#fff" stroke={c} strokeWidth="2"/><circle cx="29" cy="25" r="12" fill={c}/><text x="29" y="30" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">{n}</text>
      <text x="50" y="20" fontSize="12.5" fontWeight="700" fill={c}>{t}</text><text x="50" y="40" fontSize="14" fontWeight="700" fill={C.encre}><Ind t={f}/></text></g>)}
  </Fond>;
}
