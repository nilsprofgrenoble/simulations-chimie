import { KIT } from "../commun";

// Figure de l'atelier « Valider » (exercices « quel modèle choisir ? ») : points de mesure et courbes de deux modèles, sur et au-delà de la plage mesurée.
//   fig : { xnom, xunite, ynom, yunite, x: [min, max, pas], y: [min, max, pas], plage: [xmin, xmax], mesures: [[x, y]…], modeles: [{ nom, f, tireté? }] }
const COUL = ['#15803d', '#c2410c'];
export function FigureModeles({ fig }) {
  const L = 54, B = 40, T = 12, R = 12, W = 380, H = 240, VW = L + W + R, VH = T + H + B;
  const [x0, x1, px_] = fig.x, [y0, y1, py_] = fig.y;
  const X = x => L + ((x - x0) / (x1 - x0)) * W, Y = y => T + H - ((y - y0) / (y1 - y0)) * H;
  const clipY = y => Math.max(y0, Math.min(y1, y));
  const courbe = f => { const p = []; for (let i = 0; i <= 200; i++) { const x = x0 + (i / 200) * (x1 - x0); const y = f(x); if (isFinite(y) && y >= y0 - 1e-9 && y <= y1 + 1e-9) p.push([X(x), Y(clipY(y))]); } return 'M' + p.map(q => q.map(v => v.toFixed(1)).join(',')).join(' L'); };
  const gx = [], gy = [];
  for (let x = x0; x <= x1 + 1e-9; x += px_) gx.push(Number(x.toFixed(6)));
  for (let y = y0; y <= y1 + 1e-9; y += py_) gy.push(Number(y.toFixed(6)));
  const f = v => String(Number(v.toFixed(4))).replace('.', ',');
  return (
    <div style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label="Mesures et deux modèles proposés" style={{ width: '100%', maxWidth: 560 }}>
        <rect x={X(fig.plage[0])} y={T} width={X(fig.plage[1]) - X(fig.plage[0])} height={H} fill="#f1f5f9"/>
        {gx.map(x => <g key={'x' + x}><line x1={X(x)} y1={T} x2={X(x)} y2={T + H} stroke="#e2e8f0"/><text x={X(x)} y={T + H + 14} fontSize="10.5" textAnchor="middle" fill="#334155">{f(x)}</text></g>)}
        {gy.map(y => <g key={'y' + y}><line x1={L} y1={Y(y)} x2={L + W} y2={Y(y)} stroke={y === 0 ? '#475569' : '#e2e8f0'} strokeWidth={y === 0 ? 1.5 : 1}/><text x={L - 6} y={Y(y) + 4} fontSize="10.5" textAnchor="end" fill="#334155">{f(y)}</text></g>)}
        <line x1={L} y1={T} x2={L} y2={T + H} stroke="#334155" strokeWidth="1.5"/>
        {fig.modeles.map((m, k) => <path key={m.nom} d={courbe(m.f)} fill="none" stroke={COUL[k]} strokeWidth="2.2" strokeDasharray={k ? '6 4' : undefined}/>)}
        {fig.mesures.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r="3.8" fill="#0f172a"/>)}
        <text x={L + W / 2} y={VH - 5} fontSize="12" textAnchor="middle" fontWeight="700" fill="#0f172a">{fig.xnom} ({fig.xunite})</text>
        <text x={12} y={T + H / 2} fontSize="12" textAnchor="middle" fontWeight="700" fill="#0f172a" transform={`rotate(-90 12 ${T + H / 2})`}>{fig.ynom} ({fig.yunite})</text>
      </svg>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: KIT.txt, padding: '2px 8px 4px' }}>
        <span><span style={{ color: '#0f172a' }}>●</span> mesures (zone grisée = plage mesurée)</span>
        {fig.modeles.map((m, k) => <span key={m.nom} style={{ color: COUL[k], fontWeight: 700 }}>{k ? '- - -' : '———'} modèle {m.nom}</span>)}
      </div>
    </div>);
}
