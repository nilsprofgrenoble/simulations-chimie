// Éléments d'interface communs aux explorations « Substitution ou élimination ? » et « Addition du dibrome » :
// barre d'onglets (équation et mécanisme / perspective / 3D / énergie) et barre de lecture (bouton + curseur d'avancement).
import { KIT, styleBouton, stylePetitBouton } from "../commun";

export function OngletsVue({ onglets, actif, onChange }) {
  return (
    <div role="tablist" aria-label="Représentation de la réaction" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {onglets.map(([id, nom]) => (
        <button key={id} role="tab" aria-selected={actif === id} onClick={() => onChange(id)}
          style={{ ...stylePetitBouton(actif === id, '#0f172a'), fontSize: 14, padding: '7px 12px' }}>{id === '3d' ? '🧊 ' : ''}{nom}</button>))}
    </div>);
}

export function BarreLecture({ lecture, setLecture, u, setU }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
      <input type="range" min={0} max={1000} step={1} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(+e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ flex: 1 }} />
    </div>);
}

// Profil d'énergie avec une bille qui suit l'avancement u. pts = [[nom, énergie], ...] ; valeurs = false : allure qualitative, sans nombres.
const energieEn = (pts, x) => {
  const n = pts.length - 1, i = Math.min(n - 1, Math.floor(x * n)), t = x * n - i, a = pts[i][1], b = pts[i + 1][1];
  return a + (b - a) * (1 - Math.cos(Math.PI * t)) / 2;
};
export function ProfilEnergie({ pts, couleur, u, aria, valeurs = true, bornes }) {
  const W = 360, H = 220, gx = 40, gy = 14, gw = W - gx - 12, gh = H - gy - 34;
  const es = pts.map(p => p[1]), Emin = bornes ? bornes[0] : Math.min(...es) - 20, Emax = bornes ? bornes[1] : Math.max(...es) + 20;
  const X = x => gx + x * gw, Y = e => gy + (1 - (e - Emin) / (Emax - Emin)) * gh;
  let d = '';
  for (let i = 0; i <= 120; i++) { const x = i / 120; d += `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(energieEn(pts, x)).toFixed(1)} `; }
  const n = pts.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 520, display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke="#64748b" /><line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke="#64748b" />
      <line x1={gx} y1={Y(0)} x2={gx + gw} y2={Y(0)} stroke="#cbd5e1" strokeDasharray="4 3" />
      <text x={6} y={gy + 8} fontSize={11} fill={KIT.txt2}>Énergie</text>
      <text x={gx + gw} y={H - 6} fontSize={11} fill={KIT.txt2} textAnchor="end">avancement de la réaction →</text>
      <path d={d} fill="none" stroke={couleur} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([nom, e], i) => {
        const x = i / n, haut = nom.startsWith('ET'), ancre = i === 0 ? 'start' : i === n ? 'end' : 'middle';
        return (<g key={nom}>
          <text x={X(x)} y={haut ? Y(e) - (valeurs ? 22 : 9) : Y(e) + 16} fontSize={11} fill={KIT.txt2} textAnchor={ancre}>{nom}</text>
          {valeurs && <text x={X(x)} y={haut ? Y(e) - 9 : Y(e) + 29} fontSize={11} fontWeight="700" fill={KIT.txt} textAnchor={ancre}>{String(e).replace('-', '−')}</text>}
        </g>);
      })}
      <circle cx={X(u)} cy={Y(energieEn(pts, u))} r={7} fill="#f59e0b" stroke="white" strokeWidth={2} />
    </svg>);
}
