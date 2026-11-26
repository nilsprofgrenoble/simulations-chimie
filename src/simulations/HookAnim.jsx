// Molécules animées de la simulation 304 : vibrations de H₂O, CO₂, HCl, N₂ et rotation d'une molécule diatomique.
// Un point suit la variation du moment dipolaire : sans variation, pas de bande d'absorption IR.
import { K, T, svgStyle } from "./schemaOutils";
import { usePhase } from "./hookHorloge";
import { COLA, rayon } from "./hookAtomes";
import * as H from "./hookModes";
import { fAnim } from "./hookModele";

const REF = 0.18;                                 // variation de moment dipolaire pleine échelle de la jauge (unité arbitraire)
const AMP = 0.16;                                 // déplacement maximal dessiné, en fraction de la longueur de liaison
const COUL_DIP = '#b91c1c';

function Jauge({ dp, y = 168, actif }) {
  const x0 = 170, w = 110, xd = x0 + Math.max(-1, Math.min(1, dp / REF)) * w;
  return (<g>
    {T(170, y - 14, 'variation du moment dipolaire', { size: 12.5, gras: true, fill: K.gris })}
    <line x1={x0 - w} y1={y} x2={x0 + w} y2={y} stroke={K.clair} strokeWidth="3" strokeLinecap="round"/>
    <line x1={x0} y1={y - 7} x2={x0} y2={y + 7} stroke={K.gris} strokeWidth="1.6"/>
    {T(x0, y + 22, '0', { size: 12, fill: K.gris })}
    <circle cx={xd} cy={y} r="8" fill={actif ? COUL_DIP : K.gris} stroke="#fff" strokeWidth="1.5"/>
  </g>);
}

// ---------- vibration : atomes dessinés autour de leur position d'équilibre ----------
function MoleculeVib({ molId, modeId, anime }) {
  const M = H.MOLS[molId], md = H.mode(molId, modeId), ph = usePhase(fAnim(md.sigma), anime);
  const d = H.deplacements(molId, modeId), f = AMP / H.amplitudeMax(molId, modeId), c = Math.sin(ph);
  const pos = M.atomes.map((a, i) => [170 + M.S * (a.x + f * d[i][0] * c), M.cy - M.S * (a.y + f * d[i][1] * c)]);
  const v = H.variationDipole(molId, modeId), dp = Math.hypot(...v) * f * c * (Math.abs(v[0]) >= Math.abs(v[1]) ? Math.sign(v[0]) : Math.sign(v[1]));
  const actif = H.actifIR(molId, modeId);
  return (<svg role="img" aria-label={`${M.nom} : ${md.nom}`} viewBox="0 0 340 196" width="100%" style={svgStyle}>
    {M.liaisons.map(([i, j]) => { const [x1, y1] = pos[i], [x2, y2] = pos[j], L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L * 3.5, ny = (x2 - x1) / L * 3.5;
      return M.double ? <g key={`${i}${j}`}><line x1={x1 + nx} y1={y1 + ny} x2={x2 + nx} y2={y2 + ny} stroke="#0f172a" strokeWidth="2.4"/><line x1={x1 - nx} y1={y1 - ny} x2={x2 - nx} y2={y2 - ny} stroke="#0f172a" strokeWidth="2.4"/></g>
        : <line key={`${i}${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeWidth="3.4"/>; })}
    {M.atomes.map((a, i) => <g key={i}><circle cx={pos[i][0]} cy={pos[i][1]} r={rayon(a.m)} fill={COLA[a.s] ?? '#94a3b8'} stroke="#0f172a" strokeWidth="1.6"/>{T(pos[i][0], pos[i][1] + 5, a.s, { size: 14, gras: true, fill: a.s === 'H' ? K.txt : '#fff' })}</g>)}
    <Jauge dp={dp} actif={actif}/>
  </svg>);
}

// ---------- rotation : la molécule tourne ; la jauge donne la composante du dipôle le long du champ électrique de l'onde (horizontal) ----------
function MoleculeRot({ molId, anime }) {
  const M = H.MOLS[molId], ph = usePhase(H.TOURS_ANIM, anime, 0.6), cx = 170, cy = 70, S = M.S * 0.46;
  const pos = M.atomes.map(a => [cx + S * a.x * Math.cos(ph), cy - S * a.x * Math.sin(ph)]);
  const p0 = H.dipolePermanent(molId)[0], dp = p0 * Math.cos(ph), actif = Math.abs(p0) > H.EPS;
  const [xa, ya] = pos[0], [xb, yb] = pos[1];
  return (<svg role="img" aria-label={`${M.nom} : rotation de la molécule`} viewBox="0 0 340 196" width="100%" style={svgStyle}>
    <circle cx={cx} cy={cy} r={S + 6} fill="none" stroke={K.clair} strokeDasharray="3 4"/>
    <line x1={xa} y1={ya} x2={xb} y2={yb} stroke="#0f172a" strokeWidth="3.4"/>
    {M.atomes.map((a, i) => <g key={i}><circle cx={pos[i][0]} cy={pos[i][1]} r={rayon(a.m)} fill={COLA[a.s] ?? '#94a3b8'} stroke="#0f172a" strokeWidth="1.6"/>{T(pos[i][0], pos[i][1] + 5, a.s, { size: 14, gras: true, fill: a.s === 'H' ? K.txt : '#fff' })}</g>)}
    {T(10, 18, 'champ électrique de l’onde : ↔', { size: 12, fill: K.gris, anchor: 'start' })}
    <Jauge dp={dp} actif={actif}/>
  </svg>);
}

export function SceneMolecule({ molId, modeId, anime }) {
  return H.mode(molId, modeId).rot ? <MoleculeRot key={molId} molId={molId} anime={anime}/> : <MoleculeVib key={`${molId}${modeId}`} molId={molId} modeId={modeId} anime={anime}/>;
}

// ---------- barre pause / lecture et rappel du ralenti ----------
export function BarreAnim({ anime, onBascule, note }) {
  return (<div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
    <button onClick={onBascule} aria-pressed={anime} style={{ minHeight: 40, padding: '6px 12px', borderRadius: 10, border: '1.5px solid #0f766e', background: anime ? '#f0fdfa' : '#0f766e', color: anime ? '#0f766e' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{anime ? '⏸ Pause' : '▶ Animer'}</button>
    <span style={{ fontSize: 13, color: K.gris, lineHeight: 1.4, flex: 1, minWidth: 180 }}>{note}</span>
  </div>);
}
