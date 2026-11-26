// Scène « bécher avec ions » au standard de la scène de dosage du site (potence, burette graduée avec zoom de lecture, goutte, bécher en verre sur agitateur,
// cellule de conductimétrie reliée à un afficheur). Utilisée par les simulations 135 (conductimétrie) et 255 (titrage par précipitation).
// Les ions sont dessinés par l'appelant dans son propre repère (une « zone » rectangulaire : le liquide) ; ce composant les place dans le bécher à la bonne échelle.
import { useId } from 'react';
import { KIT, Cadre } from '../commun';

const COUL_B = '#e9d5ff';                                   // liquide de la burette (titrant)
const BX0 = 150, BX1 = 390, BY0 = 296, BY1 = 470, SURF = 318;  // bécher : cadre extérieur et surface du liquide

/**
 * Vmax, V : capacité de la burette et volume versé (mL) ; burette : null ou { lignes: [{ t, gras, coul }], liquide } ; ouvert : le robinet goutte.
 * zone : { x, y, w, h } rectangle du liquide dans le repère de l'appelant ; ions : éléments SVG dessinés dans ce repère ; cellule : null ou { lecture, nom }.
 * equation : encadré (équation ou titre) ; legende : [{ f, rendu(cx, cy) }] ; compact : seulement le bécher ; hl(id) : encadrés de focus.
 */
export function SceneBecher({ aria, Vmax = 25, V = 0, burette = null, ouvert = false, anime = true, zone, ions, cellule = null, equation = null, legende = [], compact = false, hl = () => false, extra = null }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const yB0 = 40, yB1 = 170, yNiv = yB0 + Math.min(V, Vmax) / Vmax * (yB1 - yB0), yBout = 232;
  const k = Math.min((BX1 - BX0 - 14) / zone.w, (BY1 - SURF - 4) / zone.h);
  const tx = (BX0 + BX1) / 2 - (zone.x + zone.w / 2) * k, ty = BY1 - 4 - (zone.y + zone.h) * k;
  const lignesLeg = Math.ceil(legende.length / 3), Htot = 530 + Math.max(0, lignesLeg - 1) * 26;
  const vb = compact ? `70 ${equation ? 236 : 280} 400 ${Htot - (equation ? 236 : 280)}` : `0 0 640 ${Htot}`;
  const BECHER = `M ${BX0} ${BY0} L ${BX0} ${BY1 - 8} Q ${BX0} ${BY1} ${BX0 + 8} ${BY1} L ${BX1 - 8} ${BY1} Q ${BX1} ${BY1} ${BX1} ${BY1 - 8} L ${BX1} ${BY0}`;
  return (
    <svg viewBox={vb} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 640, height: 'auto', display: 'block', margin: '0 auto', background: '#f1f5f9', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <defs><clipPath id={`${id}b`}><rect x={BX0 + 3} y={SURF} width={BX1 - BX0 - 6} height={BY1 - SURF - 2}/></clipPath></defs>
      {/* potence */}
      {!compact && <g>
        <rect x="620" y="24" width="10" height={BY1 + 24} fill="#94a3b8"/><rect x="100" y={BY1 + 20} width="530" height="12" rx="3" fill="#94a3b8"/>
        {burette && <g><rect x="262" y="131" width="360" height="8" fill="#94a3b8"/><rect x="254" y="124" width="36" height="22" rx="5" fill="#64748b"/></g>}
      </g>}
      {/* burette */}
      {burette && !compact && <g>
        <rect x="258" y="30" width="24" height={yB1 - 30} fill="#fff" stroke={KIT.txt} strokeWidth="2"/>
        <rect x="260" y={yNiv} width="20" height={yB1 - yNiv} fill={burette.liquide || COUL_B}/><rect x="263" y={yNiv} width="4" height={yB1 - yNiv} fill="#fff" opacity="0.5"/>
        <path d={`M 260 ${yNiv} Q 270 ${yNiv + 4} 280 ${yNiv}`} fill="none" stroke="#6d28d9" strokeWidth="1.6"/>
        {Array.from({ length: Vmax + 1 }, (_, v) => v).map(v => { const y = yB0 + v / Vmax * (yB1 - yB0);
          return <g key={v}><line x1="282" y1={y} x2={v % 5 === 0 ? 296 : 289} y2={y} stroke={KIT.txt} strokeWidth="1"/>{v % 5 === 0 && <text x="300" y={y + 7} fontSize="19" fill={KIT.txt}>{v}</text>}</g>; })}
        <path d={`M 258 ${yB1} L 266 ${yB1 + 20} L 274 ${yB1 + 20} L 282 ${yB1} Z`} fill={V < Vmax ? (burette.liquide || COUL_B) : '#fff'} stroke={KIT.txt} strokeWidth="2"/>
        <rect x="262" y={yB1 + 20} width="16" height="10" rx="2" fill="#cbd5e1" stroke={KIT.txt}/>
        <rect x="278" y={yB1 + 22} width="28" height="6" rx="3" fill={ouvert ? '#15803d' : '#b91c1c'} transform={ouvert ? `rotate(-90 278 ${yB1 + 25})` : undefined}/>
        <path d={`M 266 ${yB1 + 30} L 266 ${yBout - 12} L 270 ${yBout} L 274 ${yBout - 12} L 274 ${yB1 + 30} Z`} fill={V < Vmax ? (burette.liquide || COUL_B) : '#fff'} stroke={KIT.txt} strokeWidth="1.8"/>
        <rect x="262" y="38" width="3" height={yB1 - 44} fill="#fff" opacity="0.5"/>
        {burette.lignes.map((l, i) => <text key={i} x="346" y={40 + i * 26} fontSize="19" fontWeight={l.gras ? 700 : 400} fill={l.coul || KIT.txt}>{l.t}</text>)}
        {/* zoom de lecture */}
        {(() => { const z0 = 70, zy = 56, zh = 130, zw = 62, mlParPx = 2 / zh, Yz = v => zy + zh / 2 + (v - V) / mlParPx;
          return <g>
            <rect x={z0} y={zy} width={zw} height={zh} fill="#fff" stroke={KIT.txt} strokeWidth="1.5"/>
            <rect x={z0 + 1} y={Math.max(zy, Math.min(zy + zh, Yz(V)))} width={zw - 2} height={Math.max(0, zy + zh - Math.max(zy, Yz(V)))} fill={burette.liquide || COUL_B}/>
            {Array.from({ length: 41 }, (_, j) => Math.round(V * 10) / 10 - 2 + j * 0.1).map(v => { const y = Yz(v); if (y < zy || y > zy + zh || v < -0.001 || v > Vmax + 0.001) return null; const r10 = Math.round(v * 10);
              return <g key={r10}><line x1={z0 + zw - (r10 % 10 === 0 ? 20 : r10 % 5 === 0 ? 14 : 8)} y1={y} x2={z0 + zw} y2={y} stroke={r10 % 5 === 0 ? '#5b21b6' : '#c4b5fd'} strokeWidth="1.4"/>
                {r10 % 10 === 0 && <text x={z0 - 4} y={y + 7} fontSize="19" fill={KIT.txt} textAnchor="end">{r10 / 10}</text>}</g>; })}
            <path d={`M ${z0} ${Yz(V) - 2} Q ${z0 + zw / 2} ${Yz(V) + 7} ${z0 + zw} ${Yz(V) - 2}`} fill="none" stroke="#6d28d9" strokeWidth="2"/>
            <line x1={z0 - 8} y1={zy + zh / 2} x2={z0 + zw + 8} y2={zy + zh / 2} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3"/>
            <text x={z0 + zw / 2} y={zy - 22} fontSize="19" fill={KIT.txt2} textAnchor="middle">zoom (mL)</text>
            <line x1={z0 + zw} y1={zy + zh / 2} x2="258" y2={yNiv} stroke="#94a3b8" strokeDasharray="3 3"/></g>; })()}
        {ouvert && anime && [0, 1, 2].map(j => <circle key={j} cx="270" cy={yBout + 4} r="3.4" fill="#a78bfa"><animate attributeName="cy" from={yBout + 3} to={SURF - 2} dur="0.5s" begin={`${j * 0.17}s`} repeatCount="indefinite"/></circle>)}
        {ouvert && anime && <ellipse cx="270" cy={SURF} rx="6" ry="2" fill="none" stroke="#6d28d9" strokeWidth="1.5"><animate attributeName="rx" values="4;24" dur="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="0.5s" repeatCount="indefinite"/></ellipse>}
        {ouvert && !anime && <circle cx="270" cy={yBout + 14} r="3.4" fill="#a78bfa"/>}
      </g>}
      {/* bécher : liquide, ions, agitateur, verre */}
      <rect x={BX0 + 3} y={SURF} width={BX1 - BX0 - 6} height={BY1 - SURF - 2} fill="#dbeafe" opacity="0.85"/>
      <line x1={BX0 + 4} y1={SURF} x2={BX1 - 4} y2={SURF} stroke="#fff" strokeOpacity="0.7" strokeWidth="2"/>
      <g clipPath={`url(#${id}b)`}>
        <rect x="244" y={BY1 - 14} width="36" height="8" rx="4" fill="#fff" stroke="#64748b" strokeWidth="1.5">
          {anime && <animate attributeName="width" values="36;8;36" dur="0.9s" repeatCount="indefinite"/>}{anime && <animate attributeName="x" values="244;258;244" dur="0.9s" repeatCount="indefinite"/>}</rect>
        <g transform={`translate(${tx} ${ty}) scale(${k})`}>{ions}</g></g>
      <path d={BECHER} fill="none" stroke={KIT.txt} strokeWidth="3" strokeLinejoin="round"/>
      <path d={`M ${BX0 + 10} ${BY0 + 14} L ${BX0 + 10} ${BY1 - 24}`} stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
      <rect x={BX0 - 14} y={BY1} width={BX1 - BX0 + 28} height="20" rx="5" fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/>
      <text x={(BX0 + BX1) / 2} y={BY1 + 15} fontSize="15" textAnchor="middle" fill={KIT.txt2}>agitateur magnétique</text>
      <circle cx={BX0 + 6} cy={BY1 + 10} r="4" fill="none" stroke={KIT.txt}/><circle cx={BX1 - 6} cy={BY1 + 10} r="4" fill="#22c55e"/>
      {extra}
      {/* cellule de conductimétrie et afficheur */}
      {cellule && <g>
        <path d={compact ? 'M 345 262 Q 345 238 410 232' : 'M 345 244 Q 345 214 400 206'} fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round"/>
        <rect x="337" y={compact ? 262 : 244} width="16" height="34" rx="3" fill="#475569"/>
        <rect x="332" y="294" width="26" height="116" rx="4" fill="#f8fafc" fillOpacity="0.75" stroke="#64748b" strokeWidth="1.8"/>
        <rect x="339" y="366" width="5" height="40" fill="#0f172a"/><rect x="346" y="366" width="5" height="40" fill="#0f172a"/>
        {[304, 318, 332].map(y => <line key={y} x1="335" y1={y} x2="355" y2={y} stroke="#94a3b8" strokeWidth="1.5"/>)}
        <rect x={compact ? 410 : 400} y={compact ? 206 : 166} width="210" height="76" rx="10" fill="#0f172a"/>
        <text x={compact ? 515 : 505} y={compact ? 232 : 192} fontSize="18" textAnchor="middle" fill="#94a3b8">{cellule.nom || 'conductimètre'}</text>
        <text x={compact ? 515 : 505} y={compact ? 270 : 242} fontSize="30" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="ui-monospace, monospace">{cellule.lecture || '— — —'}</text>
        {!compact && <text x="362" y="286" fontSize="16" fill={KIT.txt2}>cellule</text>}
      </g>}
      {/* équation ou titre */}
      {equation && <g><rect x={compact ? 150 : 400} y={compact ? 242 : 300} width={compact ? 240 : 210} height="44" rx="10" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2"/>
        <text x={compact ? 270 : 505} y={compact ? 271 : 329} fontSize="19" fontWeight="700" textAnchor="middle" fill={KIT.txt}>{equation}</text></g>}
      {/* légende */}
      {legende.map((l, i) => { const x = 150 + (i % 3) * 120, y = BY1 + 52 + Math.floor(i / 3) * 26;
        return <g key={l.f}>{l.rendu(x + 8, y - 5)}<text x={x + 24} y={y} fontSize="17" fill={KIT.txt}>{l.f}</text></g>; })}
      <Cadre actif={hl('burette')} x={204} y={20} w={110} h={226}/>
      <Cadre actif={hl('becher')} x={BX0 - 6} y={BY0 - 6} w={BX1 - BX0 + 12} h={BY1 - BY0 + 34}/>
      <Cadre actif={hl('cellule')} x={326} y={238} w={38} h={178}/>
      <Cadre actif={hl('lecture')} x={394} y={160} w={222} h={88}/>
    </svg>
  );
}
