// Schémas de la simulation 224 « Stabilité d'une suspension ». SVG dans un viewBox de ~320 de large, textes de 12 à 15, largeur 100 % plafonnée.
// Les déplacements (particules qui s'agglomèrent, marqueur de la courbe) sont animés par transitions CSS, neutralisées si l'élève demande moins d'animations.
import * as M from "./suspensionModele";

const C = { part: '#e2e8f0', partTr: '#475569', plus: '#b91c1c', moins: '#1d4ed8', trait: '#475569', txt: '#0f172a', gris: '#64748b', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', ion: '#94a3b8' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 13} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" {...(o.halo ? { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' } : {})}>{s}</text>;
function base(w, h, label, children, max = 400) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const mvt = { transition: 'transform .6s ease-out' };

// Positions des 12 particules : dispersées (grille légèrement décalée) ou agglomérées en deux amas
const DISP = Array.from({ length: 12 }, (_, i) => [48 + (i % 4) * 74 + (i % 3 - 1) * 7, 56 + Math.floor(i / 4) * 54 + ((i * 5) % 3 - 1) * 6]);
const AMAS = [[110, 118], [112, 140], [92, 129], [130, 129], [101, 106], [121, 108], [210, 112], [228, 126], [208, 134], [190, 123], [222, 104], [200, 100]];
const R = 12;
// Signe des charges autour d'une particule : fixe, une par côté
function Charges({ s, force }) {
  if (s === '0' || force <= 0.05) return null;
  const col = s === '+' ? C.plus : C.moins, sym = s === '+' ? '+' : '−';
  return <g opacity={Math.min(1, 0.25 + force)}>{[[0, -R - 6], [R + 6, 0], [0, R + 6], [-R - 6, 0]].map(([dx, dy], k) => <text key={k} x={dx} y={dy + 4} fontSize="13" fontWeight="700" textAnchor="middle" fill={col} fontFamily="inherit">{sym}</text>)}</g>;
}
// Scène : suspension dans l'eau ; sel = petits ions, dispersant = chaînes adsorbées
const IONS = Array.from({ length: 30 }, (_, i) => [14 + ((i * 53) % 292), 28 + ((i * 37) % 186), i % 2]);
export function SvgParticules({ z, c = 0, sel = 'NaCl', disp = false, solideNom = '' }) {
  const v = M.verdict(z), f = 1 - M.stabilite(z), s = M.signe(z), force = Math.min(1, Math.abs(z) / 40);
  const nIons = c <= 0 ? 0 : Math.min(30, Math.round(6 + 6 * Math.log10(1 + c * 100)));
  const couleur = v === 'stable' ? C.vert : v === 'limite' ? C.orange : C.rouge;
  const lib = v === 'stable' ? 'Suspension stable' : v === 'limite' ? 'Stabilité limite' : 'Floculation';
  const halo = R + Math.max(2, Math.min(16, 3 + 5 * Math.log10(Math.max(M.longueurDebye(M.forceIonique(c, sel)), 1))));
  return base(320, 232, `${solideNom ? solideNom + ' : ' : ''}12 particules en suspension dans l’eau ; ${lib.toLowerCase()} ; charge de surface ${s === '+' ? 'positive' : s === '−' ? 'négative' : 'nulle'}${c > 0 ? ' ; sel ajouté' : ''}${disp ? ' ; dispersant ajouté' : ''}`, <>
    <rect x="4" y="22" width="312" height="204" rx="10" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2"/>
    {IONS.slice(0, nIons).map(([x, y, k], i) => <g key={i}><circle cx={x} cy={y} r="3" fill={k ? '#64748b' : '#94a3b8'}/>{T(x, y + 1.5, k ? '+' : '−', { size: 7, fill: 'white', gras: true })}</g>)}
    {DISP.map(([x, y], i) => {
      const [ax, ay] = AMAS[i], dx = x + (ax - x) * f, dy = y + (ay - y) * f;
      return <g key={i} style={{ ...mvt, transform: `translate(${dx}px,${dy}px)` }}>
        <circle r={halo} fill="none" stroke={C.gris} strokeDasharray="3 3" opacity={0.5 * (1 - f)}/>
        <circle r={R} fill={C.part} stroke={C.partTr} strokeWidth="2"/>
        {disp && <circle r={R + 3} fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="1 3"/>}
        <Charges s={s} force={force * (1 - 0.6 * f)}/>
      </g>;
    })}
    <rect x="8" y="2" width="160" height="22" rx="6" fill="white" stroke={couleur} strokeWidth="2"/>{T(88, 18, lib, { size: 13.5, gras: true, fill: couleur })}
    {T(160, 222, `cercles en pointillés : contre-ions${disp ? ' · violet : dispersant' : ''}`, { size: 12, fill: C.gris })}
  </>, 400);
}

// ---------- courbe du potentiel zêta ----------
const GX = { x0: 40, x1: 304 }, GY = { y0: 24, y1: 170 };      // pH 0..14 ; ζ +70..−70 mV
const gx = pH => GX.x0 + (pH / 14) * (GX.x1 - GX.x0), gy = z => GY.y0 + ((70 - z) / 140) * (GY.y1 - GY.y0);
export function SvgZeta({ solide, pH, c = 0, sel = 'NaCl', disp = false, montrePIE = true }) {
  const so = M.solide(solide), pts = [];
  for (let p = 0; p <= 14.001; p += 0.25) pts.push(`${gx(p).toFixed(1)},${gy(M.zeta({ solide, pH: p, c, sel, disp })).toFixed(1)}`);
  const z = M.zeta({ solide, pH, c, sel, disp });
  return base(320, 212, `courbe du potentiel zêta de ${so.nom} en fonction du pH, avec les zones stable, limite et floculation${montrePIE ? `, point isoélectrique ${fr(so.pie)}` : ''}`, <>
    <rect x={GX.x0} y={gy(70)} width={GX.x1 - GX.x0} height={gy(30) - gy(70)} fill="#dcfce7"/><rect x={GX.x0} y={gy(-30)} width={GX.x1 - GX.x0} height={gy(-70) - gy(-30)} fill="#dcfce7"/>
    <rect x={GX.x0} y={gy(15)} width={GX.x1 - GX.x0} height={gy(-15) - gy(15)} fill="#fee2e2"/>
    {T(GX.x1 - 3, gy(50), 'stable', { size: 12, anchor: 'end', fill: C.vert, gras: true })}{T(GX.x1 - 3, gy(-56), 'stable', { size: 12, anchor: 'end', fill: C.vert, gras: true })}
    {T(GX.x1 - 3, gy(4), 'floculation', { size: 12, anchor: 'end', fill: C.rouge, gras: true })}
    <line x1={GX.x0} y1={gy(0)} x2={GX.x1} y2={gy(0)} stroke={C.trait} strokeWidth="1.5"/><line x1={GX.x0} y1={GY.y0} x2={GX.x0} y2={GY.y1} stroke={C.trait} strokeWidth="1.5"/>
    {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={gx(p)} y1={GY.y1} x2={gx(p)} y2={GY.y1 + 4} stroke={C.trait}/>{T(gx(p), GY.y1 + 17, String(p), { size: 12 })}</g>)}
    {[60, 0, -60].map(v => T(GX.x0 - 5, gy(v) + 4, v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0', { size: 12, anchor: 'end' }))}
    {T(GX.x1 / 2 + 20, 204, 'pH', { size: 13, gras: true })}{T(8, 16, 'ζ (mV)', { size: 12, gras: true, anchor: 'start' })}
    {montrePIE && <g><line x1={gx(so.pie)} y1={GY.y0} x2={gx(so.pie)} y2={GY.y1} stroke={C.orange} strokeWidth="2" strokeDasharray="5 4"/>{T(gx(so.pie), GY.y0 - 4, `PIE ${fr(so.pie)}`, { size: 12, gras: true, fill: C.orange, halo: true })}</g>}
    <polyline points={pts.join(' ')} fill="none" stroke="#7c3aed" strokeWidth="3"/>
    <g style={{ ...mvt, transform: `translate(${gx(pH)}px,${gy(z)}px)` }}><circle r="7" fill="white" stroke="#0f172a" strokeWidth="3"/></g>
  </>, 420);
}

// ---------- cartes « À retenir » (viewBox 300 de large) ----------
function Grain({ x, y, s, r = 17, nom, cotes = [0, 1, 2, 3] }) {
  const col = s === '+' ? C.plus : s === '−' ? C.moins : C.gris, sym = s === '+' ? '+' : '−';
  return <g><circle cx={x} cy={y} r={r} fill={C.part} stroke={C.partTr} strokeWidth="2.5"/>
    {s !== '0' && [[0, -r - 8], [r + 9, 0], [0, r + 8], [-r - 9, 0]].map(([dx, dy], k) => cotes.includes(k) && <text key={k} x={x + dx} y={y + dy + 5} fontSize="15" fontWeight="700" textAnchor="middle" fill={col} fontFamily="inherit">{sym}</text>)}
    {nom && T(x, y + 5, nom, { size: 12.5, gras: true })}</g>;
}
export function SvgCarteCharge() {
  return base(300, 196, 'charge de surface d’un oxyde selon le pH : positive sous le point isoélectrique, nulle au point isoélectrique, négative au-dessus', <>
    <Grain x={50} y={44} s="+" r={20}/><Grain x={150} y={44} s="0" r={20}/><Grain x={250} y={44} s="−" r={20}/>
    {T(50, 98, 'M–OH₂⁺', { size: 14, gras: true })}{T(150, 98, 'M–OH', { size: 14, gras: true })}{T(250, 98, 'M–O⁻', { size: 14, gras: true })}
    {T(50, 122, 'pH < PIE', { size: 13.5, gras: true, fill: C.plus })}{T(150, 122, 'pH = PIE', { size: 13.5, gras: true, fill: C.orange })}{T(250, 122, 'pH > PIE', { size: 13.5, gras: true, fill: C.moins })}
    {T(6, 142, 'M–OH + H⁺ → M–OH₂⁺', { size: 12, anchor: 'start' })}{T(294, 142, 'M–OH → M–O⁻ + H⁺', { size: 12, anchor: 'end' })}
    <line x1="30" y1="166" x2="262" y2="166" stroke={C.trait} strokeWidth="2"/><polygon points="272,166 260,160 260,172" fill={C.trait}/>{T(150, 188, 'pH croissant', { size: 12.5, fill: C.gris })}
  </>, 320);
}
const Fleche = ({ x1, x2, y, col }) => <g><line x1={x1} y1={y} x2={x2} y2={y} stroke={col} strokeWidth="3"/><polygon points={x2 > x1 ? `${x2 + 7},${y} ${x2 - 3},${y - 6} ${x2 - 3},${y + 6}` : `${x2 - 7},${y} ${x2 + 3},${y - 6} ${x2 + 3},${y + 6}`} fill={col}/></g>;
export function SvgCarteSel() {
  const ions = [[188, 40, 1], [226, 34, 0], [262, 44, 1], [184, 128, 0], [212, 150, 1], [262, 126, 0], [172, 84, 0], [276, 84, 1], [222, 112, 0]];
  return base(300, 196, 'effet du sel : sans sel, les particules chargées se repoussent grâce à leur épaisse couche de contre-ions ; avec du sel, la couche est écrasée par les ions et les particules s’agglomèrent', <>
    {T(75, 16, 'Sans sel', { size: 14, gras: true, fill: C.vert })}{T(225, 16, 'Avec sel', { size: 14, gras: true, fill: C.rouge })}
    <line x1="150" y1="26" x2="150" y2="186" stroke="#cbd5e1" strokeDasharray="4 4"/>
    <circle cx="38" cy="84" r="34" fill="#eff6ff" stroke={C.gris} strokeDasharray="3 3"/><circle cx="112" cy="84" r="34" fill="#eff6ff" stroke={C.gris} strokeDasharray="3 3"/>
    <Grain x={38} y={84} s="−" r={14} cotes={[0, 2, 3]}/><Grain x={112} y={84} s="−" r={14} cotes={[0, 1, 2]}/>
    <Fleche x1={64} x2={50} y={140} col={C.vert}/><Fleche x1={86} x2={100} y={140} col={C.vert}/>
    {T(75, 170, 'elles se repoussent', { size: 13, gras: true, fill: C.vert })}
    {ions.map(([x, y, k], i) => <g key={i}><circle cx={x} cy={y} r="6" fill={k ? '#64748b' : '#94a3b8'}/>{T(x, y + 4, k ? '+' : '−', { size: 10, fill: 'white', gras: true })}</g>)}
    <circle cx="207" cy="84" r="20" fill="#eff6ff" stroke={C.gris} strokeDasharray="3 3"/><circle cx="237" cy="84" r="20" fill="#eff6ff" stroke={C.gris} strokeDasharray="3 3"/>
    <Grain x={207} y={84} s="−" r={14} cotes={[0, 2, 3]}/><Grain x={237} y={84} s="−" r={14} cotes={[0, 1, 2]}/>
    <Fleche x1={178} x2={192} y={158} col={C.rouge}/><Fleche x1={266} x2={252} y={158} col={C.rouge}/>
    {T(225, 180, 'elles s’agglomèrent', { size: 13, gras: true, fill: C.rouge })}
  </>, 320);
}
export function SvgCarteBilanSusp() {
  const bo = (x, y, w, h, l1, l2, col) => <g><rect x={x} y={y} width={w} height={h} rx="8" fill="white" stroke={col} strokeWidth="2.5"/>{T(x + w / 2, y + 20, l1, { size: 13, gras: true, fill: col })}{T(x + w / 2, y + 38, l2, { size: 12 })}</g>;
  return base(300, 190, 'stabilité d’une suspension aqueuse : trois leviers, le pH loin du point isoélectrique, peu de sel, un dispersant ; ils renforcent la répulsion électrostatique', <>
    {bo(10, 8, 280, 48, 'Le pH', 'loin du point isoélectrique', C.orange)}
    {bo(10, 64, 280, 48, 'Le sel', 'le moins possible (eau déminéralisée)', C.moins)}
    {bo(10, 120, 280, 48, 'Le dispersant', 'polyacrylate : ajoute des charges −', '#7c3aed')}
    {T(150, 184, '→ |ζ| élevé : les particules se repoussent', { size: 13, gras: true, fill: C.vert })}
  </>, 320);
}
