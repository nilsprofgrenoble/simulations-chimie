// Fiole jaugée partagée par les sims 61 et 62 (solutions).
// niveau : 0 (vide) → 1 (trait de jauge) ; alpha : intensité de la teinte (0–0,92) ;
// pts : nombre de grains de soluté dissous, répartis au hasard (mais toujours de la même façon) dans tout le liquide ;
// solide : fraction de solide resté au fond ; pale : liquide très clair pour bien voir les grains (sim 61).
const HAUT = 26, TRAIT = 70, BAS = 272, EPAULE = 128, PANSE = 214;
const contour = cx => `M ${cx - 11} ${HAUT} L ${cx - 11} ${EPAULE} C ${cx - 11} 152 ${cx - 96} 158 ${cx - 100} ${PANSE} C ${cx - 102} 250 ${cx - 90} ${BAS} ${cx - 68} ${BAS} L ${cx + 68} ${BAS} C ${cx + 90} ${BAS} ${cx + 102} 250 ${cx + 100} ${PANSE} C ${cx + 96} 158 ${cx + 11} 152 ${cx + 11} ${EPAULE} L ${cx + 11} ${HAUT} Z`;
// demi-largeur approchée de la fiole à la hauteur y
const demi = y => {
  if (y < EPAULE) return 11;
  if (y < PANSE) return 11 + 89 * Math.sin(((y - EPAULE) / (PANSE - EPAULE)) * Math.PI / 2);
  return 100 - 32 * Math.pow((y - PANSE) / (BAS - PANSE), 3);
};
// grains répartis au hasard (même tirage à chaque affichage) dans le liquide, sans se toucher, loin des parois
function grains(cx, ys, n) {
  let graine = 12345; const alea = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; };
  const cand = [];
  for (let y = ys + 8; y < BAS - 8; y += 5) { const w = demi(y) - 8; for (let x = -w; x <= w; x += 5) cand.push([cx + x + alea() * 4, y + alea() * 4]); }
  for (let k = cand.length - 1; k > 0; k--) { const j = Math.floor(alea() * (k + 1)); [cand[k], cand[j]] = [cand[j], cand[k]]; }
  const out = [];
  for (const p of cand) { if (out.length >= n) break; if (out.every(q => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 > 81)) out.push(p); }
  return out;
}
export function Fiole({ cx = 150, niveau, couleur, alpha, pts, solide, bouchon, volume, id = 'f', pale = false, couleurPts }) {
  const ys = BAS - niveau * (BAS - TRAIT), col = couleurPts || couleur || '#475569';
  const points = pts > 0 ? grains(cx, ys, pts) : [];
  const op = pale ? 0.1 + 0.22 * Math.min(1, alpha / 0.92) : Math.max(0.12, alpha);
  return (
    <g>
      <defs>
        <clipPath id={`cl${id}`}><path d={contour(cx)}/></clipPath>
        <linearGradient id={`vr${id}`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.55"/><stop offset="0.25" stopColor="#fff" stopOpacity="0"/><stop offset="0.8" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#0f172a" stopOpacity="0.07"/></linearGradient>
      </defs>
      <path d={contour(cx)} fill="#f8fafc"/>
      <g clipPath={`url(#cl${id})`}>
        {niveau > 0 && <rect x={cx - 110} y={ys} width="220" height={BAS - ys + 4} fill={couleur || '#93c5fd'} opacity={couleur ? op : 0.2}/>}
        {niveau > 0 && <line x1={cx - 110} y1={ys} x2={cx + 110} y2={ys} stroke={couleur || '#60a5fa'} strokeWidth="2" opacity="0.7"/>}
        {solide > 0 && <path d={`M ${cx - 62} ${BAS - 1} Q ${cx - 30} ${BAS - 14 - 22 * solide} ${cx} ${BAS - 18 - 26 * solide} Q ${cx + 30} ${BAS - 14 - 22 * solide} ${cx + 62} ${BAS - 1} Z`} fill={col} stroke="#0f172a" strokeWidth="1.2"/>}
        {points.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.1" fill={col} stroke="#fff" strokeWidth="0.8"/>)}
      </g>
      <path d={contour(cx)} fill={`url(#vr${id})`} stroke="#0f172a" strokeWidth="3" strokeLinejoin="round"/>
      <path d={`M ${cx - 82} 202 C ${cx - 86} 190 ${cx - 78} 181 ${cx - 68} 175`} stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6"/>
      <rect x={cx - 15} y={HAUT - 5} width="30" height="7" rx="3" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5"/>
      <line x1={cx - 11} y1={TRAIT} x2={cx + 11} y2={TRAIT} stroke="#b91c1c" strokeWidth="3.5"/>
      <text x={cx + 20} y={TRAIT + 4} fontSize="12" fontWeight="700" fill="#b91c1c">trait de jauge</text>
      {bouchon && <path d={`M ${cx - 13} ${HAUT - 14} L ${cx + 13} ${HAUT - 14} L ${cx + 9} ${HAUT + 14} L ${cx - 9} ${HAUT + 14} Z`} fill="#475569" stroke="#0f172a" strokeWidth="2"/>}
      <text x={cx} y="294" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Fiole jaugée de {volume} mL</text>
    </g>);
}
