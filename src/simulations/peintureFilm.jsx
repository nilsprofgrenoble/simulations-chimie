import { fmt, KIT } from "../commun";

// Formation d'un film de latex (peinture à l'eau), en trois temps : évaporation de l'eau ; rapprochement et contact des particules ;
// déformation et coalescence des particules de liant si T ≥ TMFF (sinon, le film se fissure ou reste poudreux).
// Partagé entre le parcours guidé et l'exploration libre de la simulation « Peinture à l'eau ».
// ════════════════ ANIMATION DU SÉCHAGE ════════════════
// Trois temps : évaporation de l'eau ; rapprochement et contact des particules ; déformation et coalescence (si T ≥ TMFF)
export function AnimationSechage({ progres, T, tmff, lambda }) {
  const W = 560, H = 210, base = 180;
  const filme = T >= tmff;
  const r = rngFixe(5);
  const latex = Array.from({ length: 26 }, (_, k) => ({ x: 30 + (k % 13) * 40 + (k > 12 ? 20 : 0), y0: 40 + r() * 100, y1: base - 14 - (k > 12 ? 24 : 0) }));
  const pig = Array.from({ length: Math.round(6 + 10 * Math.min(1.2, lambda)) }, () => ({ x: 20 + r() * 520, y0: 50 + r() * 100, y1: base - 10 - r() * 34 }));
  const e1 = Math.min(1, progres / 0.45), e2 = Math.max(0, Math.min(1, (progres - 0.45) / 0.3)), e3 = Math.max(0, Math.min(1, (progres - 0.75) / 0.25));
  const niveauEau = 30 + e1 * (base - 30 - 50);
  const poreux = lambda > 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Séchage du film de peinture" style={{ width: '100%', maxWidth: 640, margin: '0 auto', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      <rect x="0" y={base} width={W} height={H - base} fill="#cbd5e1"/>
      <text x={W - 10} y={base + 20} fontSize="12" fill={KIT.txt2} textAnchor="end">support</text>
      {e1 < 1 && <rect x="0" y={niveauEau} width={W} height={base - niveauEau} fill="#dbeafe" opacity={0.85 * (1 - e2)}/>}
      {e3 > 0 && filme && <rect x="0" y={base - 48} width={W} height="48" fill="#e2e8f0" opacity={e3 * (poreux ? 0.6 : 0.95)}/>}
      {latex.map((p, k) => {
        const y = p.y0 + (p.y1 - p.y0) * Math.min(1, e1 * 1.1);
        const rx = 15 + (filme ? 6 * e2 : 0), ry = 15 - (filme ? 6 * e2 : 0);
        return <ellipse key={k} cx={p.x} cy={y} rx={rx} ry={ry} fill="#bfdbfe" stroke="#1e3a8a" strokeWidth="1.2" opacity={filme ? 1 - 0.75 * e3 : 1}/>;
      })}
      {pig.map((p, k) => <circle key={k} cx={p.x} cy={p.y0 + (p.y1 - p.y0) * Math.min(1, e1 * 1.1)} r="4.5" fill="#f8fafc" stroke="#475569" strokeWidth="1"/>)}
      {!filme && e2 > 0.6 && [80, 210, 330, 460].map((x, k) => <polyline key={k} points={`${x},${base - 50} ${x + 8},${base - 30} ${x - 4},${base - 15} ${x + 5},${base}`} fill="none" stroke="#b91c1c" strokeWidth="2.5" opacity={(e2 - 0.6) / 0.4}/>)}
      {poreux && e3 > 0.5 && [60, 150, 260, 380, 490].map((x, k) => <circle key={k} cx={x} cy={base - 26} r="5" fill="white" stroke="#b91c1c" strokeDasharray="2 2"/>)}
      <text x="10" y="18" fontSize="13" fontWeight="700" fill={KIT.txt}>
        {progres < 0.45 ? '1. L’eau s’évapore' : progres < 0.75 ? '2. Les particules se touchent' : filme ? '3. Elles se déforment et fusionnent : film continu' : '3. Trop froid (T < TMFF) : elles ne fusionnent pas, le film se fissure'}
      </text>
      <text x={W - 10} y="36" fontSize="12" fill={KIT.txt2} textAnchor="end">T = {fmt(T, 0)} °C ; TMFF {tmff < 0 ? '< 0' : `= ${fmt(tmff, 0)}`} °C</text>
      <g transform={`translate(10, ${H - 6})`}><circle cx="4" cy="-4" r="4" fill="#bfdbfe" stroke="#1e3a8a"/><text x="12" y="0" fontSize="11" fill={KIT.txt2}>particule de liant (latex)</text>
        <circle cx="170" cy="-4" r="4" fill="#f8fafc" stroke="#475569"/><text x="178" y="0" fontSize="11" fill={KIT.txt2}>pigment ou charge</text></g>
    </svg>
  );
}
function rngFixe(g) { let a = g >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

