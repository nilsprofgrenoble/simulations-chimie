// ====================================================
//  Schémas de la simulation 176 (particule chargée dans un condensateur plan ; niveau TG).
//  Scène : viewBox 400 × 192 (hauteur fixée sur d maximal = 2,0 cm : elle ne saute pas quand d change), échelle 36 px par cm sur les deux axes (plaques de 6,0 cm de long : 216 px), barre d'échelle de 1 cm.
//  Flèches : trait de 2,4 aux bouts arrondis, pointe de taille fixe (9) ; notation vectorielle (Ligne / TV) ; textes ≥ 16 ;
//  jamais la couleur seule : le signe de la charge est dessiné (+ ou −), les plaques portent leur signe, les trajectoires sont en trait plein / pointillé.
// ====================================================
import { Ligne } from './newtonSchemas';

const COUL = { E: '#0369a1', F: '#b91c1c', v: '#0f172a', a: '#6d28d9', plaque: '#94a3b8', gris: '#64748b', txt: '#0f172a', cible: '#15803d' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 330, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const S0 = 20;

// flèche fine : trait 2,4, bouts arrondis, pointe de taille fixe ; halo blanc sous la flèche (halo = false pour les lignes de champ et les axes)
export const Fl = ({ x1, y1, x2, y2, c = COUL.txt, w = 2.4, t = 9, dash, halo = true }) => {
  const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy); if (n < t + 3) return null;
  const ux = dx / n, uy = dy / n, bx = x2 - ux * t, by = y2 - uy * t, px = -uy * t * 0.4, py = ux * t * 0.4;
  return <g>
    {halo && <g><line x1={x1} y1={y1} x2={bx + ux} y2={by + uy} stroke="#fff" strokeWidth={w + 4} strokeLinecap="round"/><polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill="#fff" stroke="#fff" strokeWidth="5" strokeLinejoin="round"/></g>}
    <line x1={x1} y1={y1} x2={bx + ux} y2={by + uy} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}/>
    <polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={c} stroke={c} strokeWidth="1" strokeLinejoin="round"/></g>;
};
// particule : cercle blanc portant son signe (+ ou −) dessiné
export const Particule = ({ x, y, z, r = 7 }) => (
  <g><circle cx={x} cy={y} r={r} fill="#fff" stroke={COUL.txt} strokeWidth="2.2"/>
    <line x1={x - r * 0.5} y1={y} x2={x + r * 0.5} y2={y} stroke={COUL.txt} strokeWidth="2" strokeLinecap="round"/>
    {z > 0 && <line x1={x} y1={y - r * 0.5} x2={x} y2={y + r * 0.5} stroke={COUL.txt} strokeWidth="2" strokeLinecap="round"/>}</g>
);
// signe de plaque : cercle portant + ou −
const SignePlaque = ({ x, y, plus }) => (
  <g><circle cx={x} cy={y} r="11" fill="#fff" stroke={COUL.txt} strokeWidth="2"/>
    <line x1={x - 5.5} y1={y} x2={x + 5.5} y2={y} stroke={COUL.txt} strokeWidth="2.4" strokeLinecap="round"/>
    {plus && <line x1={x} y1={y - 5.5} x2={x} y2={y + 5.5} stroke={COUL.txt} strokeWidth="2.4" strokeLinecap="round"/>}</g>
);
const Halo = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
// fraction d / 2 dessinée (barre de fraction), centrée en x ; y = ordonnée de la barre
const Demi = ({ x, y, c = COUL.gris }) => (
  <g><text x={x} y={y - 5} fontSize="16" fontWeight="700" fontStyle="italic" fill={c} textAnchor="middle">d</text>
    <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    <text x={x} y={y + 15} fontSize="16" fontWeight="700" fill={c} textAnchor="middle">2</text></g>
);

// ---------- scène du condensateur ----------
// d : écart des plaques (cm) ; haut : signe de la plaque du haut ('+' ou '−') ; signes : affiche + et − ; lignes : lignes de champ ('pale' : en filigrane) ; axes : repère O x y
// part : { z, xc (cm) } particule (z = signe de la charge) placée à l'abscisse xc (cm) sur la trajectoire ; traj : { k2 (cm⁻¹), xFin (cm) } ; fleches : liste de 'F', 'v0', 'v', 'a'
// sensF : +1 si la force est vers le haut, −1 vers le bas ; cible : { y (cm, algébrique) } ; choc : marque un choc en fin de trajectoire ; prolonge : prolonge la trajectoire en ligne droite après la sortie
const X0 = 90, YC = 135, K = 36, LCM = 6, DMAX = 2, OXA = X0 - 14, R = 7;
export function SceneCondensateur({ d = 2, haut = '+', signes = false, lignes = false, axes = false, part = null, traj = null, fleches = [], sensF = 1, cible = null, choc = false, prolonge = false, aria }) {
  const demi = d * K / 2, yH = YC - demi, yB = YC + demi, X1 = X0 + LCM * K;
  const k2 = traj ? traj.k2 : 0, xFin = traj ? traj.xFin : 0;
  const Yc = x => YC - K * k2 * x * x;                 // y(x) en px (x en cm)
  let chemin = '';
  if (traj) { const n = 48; chemin = Array.from({ length: n + 1 }, (_, i) => { const x = xFin * i / n; return `${i ? 'L' : 'M'}${(X0 + K * x).toFixed(1)},${Yc(x).toFixed(1)}`; }).join(' '); }
  const px = part ? X0 + K * part.xc : 0, pyBrut = part ? Yc(part.xc) : 0;
  const py = part ? Math.min(yB - R - 2, Math.max(yH + R + 2, pyBrut)) : 0;     // la particule reste à 2 px des plaques
  const pente = part ? 2 * k2 * part.xc : 0, nv = Math.hypot(1, pente);
  const dirV = [1 / nv, -pente / nv];                      // direction de vec(v) à l'écran (y vers le bas)
  const sortie = traj && xFin >= LCM - 1e-6, ySortie = Yc(xFin), pSortie = 2 * k2 * xFin;
  const xl = i => X0 + 60 + 48 * i;
  const place = sensF > 0 ? py - yH : yB - py;               // place disponible entre la particule et la plaque vers laquelle va la force
  const lvF = Math.min(24, place - R - 3), lvA = Math.round(lvF * 0.75);       // longueurs visibles (hors cercle de la particule) des flèches de principe
  const aF = fleches.includes('F') && lvF >= 13, aA = fleches.includes("a") && lvF >= 13, deux = aF && aA;
  const xF = px - (deux ? 5 : 0), xA = px + (deux ? 5 : 0);
  const pale = lignes === 'pale';
  const finTraj = !!(part && traj && part.xc >= xFin - 0.01), impact = finTraj && !traj.sort;      // la particule est arrivée contre une plaque
  const vl = 22, sx = px + R * dirV[0], sy = py + R * dirV[1], bx = sx + vl * dirV[0], by = sy + vl * dirV[1];
  const procheFin = bx > X1 + 4;
  const vx = procheFin ? px - R - 4 : bx + 6, vAnc = procheFin ? 'end' : 'start', vy = sensF > 0 ? (procheFin ? py + R + 22 : by + 22) : (procheFin ? py - R - 8 : by - 8);
  return (
    <svg viewBox={`0 ${YC - DMAX * K / 2 - 56} 400 ${DMAX * K + 120}`} role="img" aria-label={aria} style={stl}>
      <defs><clipPath id="cpl-clip"><rect x="0" y={YC - DMAX * K / 2 - 56} width="400" height={DMAX * K + 120}/></clipPath></defs>
      {/* plaques */}
      <rect x={X0} y={yH - 8} width={LCM * K} height="8" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/>
      <rect x={X0} y={yB} width={LCM * K} height="8" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/>
      {signes && <g><SignePlaque x={X0 + 232} y={yH - 26} plus={haut === '+'}/><SignePlaque x={X0 + 232} y={yB + 26} plus={haut !== '+'}/></g>}
      {/* distance d */}
      <line x1="44" y1={yH} x2="44" y2={yB} stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="38" y1={yH} x2="50" y2={yH} stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/><line x1="38" y1={yB} x2="50" y2={yB} stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <text x="24" y={YC + 6} fontSize={S0} fontWeight="700" fill={COUL.gris} textAnchor="middle" fontStyle="italic">d</text>
      {/* lignes de champ : de la plaque + vers la plaque − */}
      {lignes && [0, 1, 2, 3].map(i => <g key={i} opacity={pale ? 0.45 : 1}>{haut === '+'
        ? <Fl x1={xl(i)} y1={yH + 8} x2={xl(i)} y2={yB - 6} c={COUL.E} w={1.6} t={8} halo={false}/>
        : <Fl x1={xl(i)} y1={yB - 8} x2={xl(i)} y2={yH + 6} c={COUL.E} w={1.6} t={8} halo={false}/>}</g>)}
      {/* repère : l'axe Oy est tracé juste à gauche des plaques, O est séparé de la particule */}
      {axes && <g>
        <Fl x1={OXA} y1={YC} x2={X1 + 14} y2={YC} c={COUL.gris} w={1.4} t={7} dash="6 5" halo={false}/>
        <Fl x1={OXA} y1={YC} x2={OXA} y2={yH + 4} c={COUL.gris} w={1.4} t={7} halo={false}/>
        <text x={X1 + 20} y={YC + 6} fontSize={S0} fontStyle="italic" fontWeight="700" fill={COUL.gris} style={Halo}>x</text>
        <text x={OXA - 18} y={yH + 16} fontSize={S0} fontStyle="italic" fontWeight="700" fill={COUL.gris} style={Halo}>y</text>
        <text x={OXA - 20} y={YC + 24} fontSize={S0} fontWeight="700" fill={COUL.gris} style={Halo}>O</text></g>}
      {/* cible */}
      {cible && <g><circle cx={X1} cy={YC - K * cible.y} r="6" fill="none" stroke={COUL.cible} strokeWidth="2.4"/><circle cx={X1} cy={YC - K * cible.y} r="2.2" fill={COUL.cible}/>
        <text x={X1 + 12} y={YC - K * cible.y + 6} fontSize={S0 - 2} fontWeight="700" fill={COUL.cible} style={Halo}>cible</text></g>}
      {/* trajectoire */}
      <g clipPath="url(#cpl-clip)">
        {traj && <path d={chemin} fill="none" stroke={COUL.v} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
        {traj && prolonge && sortie && <line x1={X1} y1={ySortie} x2={X1 + 90} y2={ySortie - pSortie * 90} stroke={COUL.v} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 6"/>}
      </g>
      {choc && traj && !traj.sort && <g>{!finTraj && <circle cx={X0 + K * xFin} cy={Yc(xFin)} r="6" fill="none" stroke={COUL.F} strokeWidth="2.4"/>}
        <text x={X0 + K * xFin} y={k2 > 0 ? yH - 14 : yB + 30} fontSize={S0 - 2} fontWeight="700" fill={COUL.F} textAnchor="middle" style={Halo}>choc</text></g>}
      {traj && sortie && !prolonge && <circle cx={X1} cy={ySortie} r="3.4" fill={COUL.txt}/>}
      {/* particule et vecteurs */}
      {part && <g>
        {fleches.includes('v0') && <Fl x1={px} y1={py} x2={px + 46} y2={py} c={COUL.v}/>}
        {fleches.includes('v') && !impact && <Fl x1={sx} y1={sy} x2={bx} y2={by} c={COUL.v}/>}
        {aF && <Fl x1={xF} y1={py - sensF * R} x2={xF} y2={py - sensF * (R + lvF)} c={COUL.F}/>}
        {aA && <Fl x1={xA} y1={py - sensF * R} x2={xA} y2={py - sensF * (R + lvA)} c={COUL.a}/>}
        <Particule x={px} y={py} z={part.z}/>
        {fleches.includes('v0') && <Ligne x={px + 14} y={py + 30} s={S0} segs={[{ v: 'v', i: '0' }]} halo/>}
        {fleches.includes('v') && !impact && <Ligne x={vx} y={vy} anchor={vAnc} s={S0} segs={[{ v: 'v' }]} halo/>}
        {aF && <Ligne x={deux ? xF - 24 : xF + 9} y={py - sensF * (R + lvF / 2) + 6} s={S0} c={COUL.F} segs={[{ v: 'F' }]} halo/>}
        {aA && <Ligne x={xA + 9} y={py - sensF * (R + lvA / 2) + 6} s={S0} c={COUL.a} segs={[{ v: 'a' }]} halo/>}
      </g>}
      {lignes === true && <Ligne x={xl(3) + 8} y={yB - 12} s={S0} c={COUL.E} segs={[{ v: 'E' }]} halo/>}
      {/* barre d'échelle : 1 cm */}
      <g><line x1={X0} y1="226" x2={X0 + K} y2="226" stroke={COUL.gris} strokeWidth="2" strokeLinecap="round"/>
        <line x1={X0} y1="221" x2={X0} y2="231" stroke={COUL.gris} strokeWidth="2" strokeLinecap="round"/><line x1={X0 + K} y1="221" x2={X0 + K} y2="231" stroke={COUL.gris} strokeWidth="2" strokeLinecap="round"/>
        <text x={X0 + K + 8} y="232" fontSize="16" fontWeight="700" fill={COUL.gris}>1{' '}cm</text></g>
    </svg>
  );
}

// ---------- canon à particules (une seule accélération) : départ au repos près de la plaque −, trou dans la plaque + ----------
export function SceneCanon({ aria }) {
  return (
    <svg viewBox="0 0 400 220" role="img" aria-label={aria} style={stl}>
      <rect x="110" y="30" width="8" height="66" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/><rect x="110" y="124" width="8" height="66" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/>
      <rect x="282" y="30" width="8" height="66" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/><rect x="282" y="124" width="8" height="66" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/>
      <SignePlaque x={114} y={16} plus={false}/><SignePlaque x={286} y={16} plus/>
      {[50, 170].map(y => <Fl key={y} x1={252} y1={y} x2={140} y2={y} c={COUL.E} w={1.6} t={8} halo={false}/>)}
      <Ligne x={190} y={43} s={S0} c={COUL.E} segs={[{ v: 'E' }]} halo/>
      <Fl x1={146} y1={110} x2={246} y2={110} c={COUL.F}/>
      <Particule x={134} y={110} z={-1}/>
      <Ligne x={190} y={140} s={S0} c={COUL.F} segs={[{ v: 'F' }]} halo/>
      <Fl x1={313} y1={110} x2={372} y2={110} c={COUL.v}/>
      <Particule x={304} y={110} z={-1}/>
      <Ligne x={322} y={98} s={S0} segs={[{ v: 'v' }]} halo/>
      <line x1="114" y1="204" x2="286" y2="204" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="114" y1="198" x2="114" y2="210" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/><line x1="286" y1="198" x2="286" y2="210" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <text x="200" y="196" fontSize={S0} fontWeight="700" fill={COUL.gris} textAnchor="middle" fontStyle="italic" style={Halo}>U</text>
    </svg>
  );
}

// ---------- accélérateur linéaire : tubes de plus en plus longs (ℓ ∝ √n), tension alternative ----------
const LT = [18, 25, 31, 36, 40], GAP = 26, XT = 40, YT = 88, HT = 44;
const debutTube = i => XT + LT.slice(0, i).reduce((s, v) => s + v, 0) + GAP * i;
export function SceneLineaire({ aria, nomme = true }) {
  const ym = YT + HT / 2, gx = debutTube(0) + LT[0] + GAP / 2, fin = debutTube(4) + LT[4];
  return (
    <svg viewBox="0 0 400 256" role="img" aria-label={aria} style={stl}>
      {LT.map((l, i) => { const x = debutTube(i), cx = x + l / 2, haut = i % 2 === 0; return (
        <g key={i}>
          <rect x={x} y={YT} width={l} height={HT} rx="3" fill="#e2e8f0" stroke={COUL.txt} strokeWidth="2"/>
          <line x1={cx - 5.5} y1={ym} x2={cx + 5.5} y2={ym} stroke={COUL.txt} strokeWidth="2.4" strokeLinecap="round"/>
          {haut && <line x1={cx} y1={ym - 5.5} x2={cx} y2={ym + 5.5} stroke={COUL.txt} strokeWidth="2.4" strokeLinecap="round"/>}
          <line x1={cx} y1={haut ? YT : YT + HT} x2={cx} y2={haut ? 62 : 150} stroke={COUL.gris} strokeWidth="2" strokeLinecap="round"/>
          {nomme && <text x={cx} y={202} fontSize={S0} fontWeight="700" fill={COUL.txt} textAnchor="middle">{i + 1}</text>}
        </g>); })}
      <polyline points={`${debutTube(0) + LT[0] / 2},62 380,62 380,98`} fill="none" stroke={COUL.gris} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={`${debutTube(1) + LT[1] / 2},150 380,150 380,134`} fill="none" stroke={COUL.gris} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="380" cy="116" r="17" fill="#fff" stroke={COUL.txt} strokeWidth="2"/>
      <path d="M370,116 q5,-10 10,0 t10,0" fill="none" stroke={COUL.txt} strokeWidth="2.2" strokeLinecap="round"/>
      <Fl x1="2" y1={ym} x2="28" y2={ym} c={COUL.v}/>
      <Fl x1={fin + 8} y1={ym} x2={fin + 38} y2={ym} c={COUL.v}/>
      {/* intervalle 1-2 : champ vec(E) et particule positive */}
      <Fl x1={gx - 9} y1={YT + 7} x2={gx + 9} y2={YT + 7} c={COUL.E} w={2} t={8}/>
      <Ligne x={gx - 7} y={83} s={S0} c={COUL.E} segs={[{ v: 'E' }]} halo/>
      <Particule x={gx} y={ym} z={1} r={7}/>
      <line x1={gx - GAP / 2} y1="142" x2={gx + GAP / 2} y2="142" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1={gx - GAP / 2} y1="138" x2={gx - GAP / 2} y2="146" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/><line x1={gx + GAP / 2} y1="138" x2={gx + GAP / 2} y2="146" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1={gx} y1="146" x2={gx} y2="160" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <text x={gx} y="178" fontSize="17" fontWeight="700" fill={COUL.gris} textAnchor="middle">intervalle</text>
      <Fl x1={XT} y1={222} x2={fin} y2={222} c={COUL.gris} w={2} halo={false}/>
      <text x={(XT + fin) / 2} y="248" fontSize="17" fontWeight="700" fill={COUL.gris} textAnchor="middle">longueur des tubes</text>
    </svg>
  );
}

// ====================================================
//  Cartes « À retenir » : viewBox de 320 de large, textes de 14 à 17 (≥ 11 px rendus sur un téléphone de 390 px)
// ====================================================
const Car = ({ aria, h, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={stlCarte}>{children}</svg>;
const Plaque = ({ x, y, l }) => <rect x={x} y={y} width={l} height="7" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/>;

export function SvgCarteChamp() {
  return (
    <Car aria="Deux plaques parallèles, la plaque du haut positive et celle du bas négative, des lignes de champ verticales parallèles et équidistantes orientées de la plaque positive vers la négative, distance d entre les plaques" h={204}>
      <Plaque x={50} y={30} l={220}/><Plaque x={50} y={150} l={220}/>
      <SignePlaque x={30} y={33} plus/><SignePlaque x={30} y={153} plus={false}/>
      {[88, 128, 168, 208, 248].map(x => <Fl key={x} x1={x} y1={42} x2={x} y2={146} c={COUL.E} w={1.8} t={8}/>)}
      <Ligne x={178} y={102} s={19} c={COUL.E} segs={[{ v: 'E' }]} halo/>
      <line x1="292" y1="37" x2="292" y2="150" stroke={COUL.gris} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="285" y1="37" x2="299" y2="37" stroke={COUL.gris} strokeWidth="1.8" strokeLinecap="round"/><line x1="285" y1="150" x2="299" y2="150" stroke={COUL.gris} strokeWidth="1.8" strokeLinecap="round"/>
      <text x="306" y="99" fontSize="17" fontWeight="700" fill={COUL.gris} fontStyle="italic">d</text>
      <text x="160" y="190" fontSize="15" fontWeight="700" fill={COUL.txt} textAnchor="middle">lignes parallèles, équidistantes</text>
    </Car>
  );
}
export function SvgCarteForce() {
  const col = (x0, z, titre) => (
    <g>
      <text x={x0 + 70} y={22} fontSize="17" fontWeight="700" fill={COUL.txt} textAnchor="middle">{titre}</text>
      <Plaque x={x0 + 4} y={36} l={132}/><Plaque x={x0 + 4} y={170} l={132}/>
      <Fl x1={x0 + 26} y1={52} x2={x0 + 26} y2={160} c={COUL.E} w={1.8} t={8}/>
      <Ligne x={x0 + 34} y={112} s={19} c={COUL.E} segs={[{ v: 'E' }]} halo/>
      <Fl x1={x0 + 96} y1={105} x2={x0 + 96} y2={105 + (z > 0 ? 40 : -40)} c={COUL.F}/>
      <Particule x={x0 + 96} y={105} z={z}/>
      <Ligne x={x0 + 106} y={105 + (z > 0 ? 36 : -26)} s={19} c={COUL.F} segs={[{ v: 'F' }]} halo/>
    </g>);
  return (
    <Car aria="Deux schémas côte à côte : une particule positive subit une force de même sens que le champ, une particule négative une force de sens opposé au champ" h={200}>
      {col(10, 1, 'q > 0')}{col(170, -1, 'q < 0')}
    </Car>
  );
}
export function SvgCarteTrajectoire() {
  const pts = Array.from({ length: 41 }, (_, i) => { const x = 50 + 220 * i / 40; return `${i ? 'L' : 'M'}${x.toFixed(1)},${(92 - 36 * Math.pow((x - 50) / 220, 2)).toFixed(1)}`; }).join(' ');
  return (
    <Car aria="Repère Ox horizontal, Oy vertical vers le haut, tracé à gauche des plaques ; trajectoire en arc de parabole partant du milieu de l'entrée avec le vecteur vitesse initial horizontal et s'incurvant vers le haut, sans toucher la plaque du haut ; la déviation y S est mesurée à la sortie des plaques" h={196}>
      <Plaque x={50} y={26} l={220}/><Plaque x={50} y={152} l={220}/>
      <Fl x1={36} y1={92} x2={284} y2={92} c={COUL.gris} w={1.4} t={7} dash="6 5" halo={false}/>
      <Fl x1={36} y1={92} x2={36} y2={44} c={COUL.gris} w={1.4} t={7} halo={false}/>
      <text x="278" y="116" fontSize="17" fontStyle="italic" fontWeight="700" fill={COUL.gris}>x</text>
      <text x="16" y="56" fontSize="17" fontStyle="italic" fontWeight="700" fill={COUL.gris}>y</text>
      <text x="12" y="112" fontSize="17" fontWeight="700" fill={COUL.gris}>O</text>
      <path d={pts} fill="none" stroke={COUL.v} strokeWidth="2.5" strokeLinecap="round"/>
      <Fl x1={50} y1={92} x2={98} y2={92} c={COUL.v}/>
      <Ligne x={62} y={118} s={20} segs={[{ v: 'v', i: '0' }]} halo/>
      <line x1="296" y1="92" x2="296" y2="56" stroke={COUL.gris} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="289" y1="92" x2="303" y2="92" stroke={COUL.gris} strokeWidth="1.8" strokeLinecap="round"/><line x1="289" y1="56" x2="303" y2="56" stroke={COUL.gris} strokeWidth="1.8" strokeLinecap="round"/>
      <Ligne x={258} y={84} s={20} segs={['y', { i: 'S' }]} anchor="end" halo/>
      <circle cx="270" cy="56" r="4" fill={COUL.txt}/>
      <line x1="276" y1="56" x2="289" y2="56" stroke={COUL.gris} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 4"/>
      <text x="160" y="182" fontSize="15" fontWeight="700" fill={COUL.txt} textAnchor="middle">parabole : y proportionnel à x²</text>
    </Car>
  );
}
export function SvgCarteCollision() {
  const para = (xm, ymax, xf) => Array.from({ length: 31 }, (_, i) => { const x = 50 + xf * i / 30; return `${i ? 'L' : 'M'}${x.toFixed(1)},${(100 - ymax * Math.pow((x - 50) / xm, 2)).toFixed(1)}`; }).join(' ');
  return (
    <Car aria="Deux trajectoires paraboliques entre les plaques : l'une sort de l'intervalle, l'autre heurte la plaque du haut avant la sortie" h={212}>
      <Plaque x={50} y={30} l={230}/><Plaque x={50} y={166} l={230}/>
      <path d={para(230, 44, 230)} fill="none" stroke={COUL.v} strokeWidth="2.5" strokeLinecap="round"/>
      <path d={para(150, 63, 150)} fill="none" stroke={COUL.v} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="8 6"/>
      <circle cx="200" cy="37" r="6" fill="#fff" stroke={COUL.F} strokeWidth="2.4"/>
      <text x="200" y="20" fontSize="16" fontWeight="700" fill={COUL.F} textAnchor="middle">choc</text>
      <text x="272" y="90" fontSize="16" fontWeight="700" fill={COUL.txt} textAnchor="end">sortie</text>
      <line x1="38" y1="37" x2="38" y2="100" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="32" y1="37" x2="44" y2="37" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/><line x1="32" y1="100" x2="44" y2="100" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <Demi x={18} y={70}/>
      <text x="160" y="198" fontSize="15" fontWeight="700" fill={COUL.txt} textAnchor="middle">trait plein : sortie, pointillés : choc</text>
    </Car>
  );
}
export function SvgCarteEnergie() {
  return (
    <Car aria="Électron partant du repos près de la plaque négative, à gauche, accéléré vers la plaque positive, à droite, qu'il traverse par un trou avec un vecteur vitesse ; la tension U entre les plaques fournit l'énergie cinétique" h={196}>
      <rect x="44" y="28" width="8" height="52" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/><rect x="44" y="106" width="8" height="52" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/>
      <rect x="206" y="28" width="8" height="52" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/><rect x="206" y="106" width="8" height="52" rx="2" fill={COUL.plaque} stroke={COUL.txt} strokeWidth="1.8"/>
      <SignePlaque x={48} y={14} plus={false}/><SignePlaque x={210} y={14} plus/>
      <Fl x1={190} y1={48} x2={72} y2={48} c={COUL.E} w={1.8} t={8} halo={false}/>
      <Ligne x={116} y={40} s={19} c={COUL.E} segs={[{ v: 'E' }]} halo/>
      <Fl x1={96} y1={93} x2={170} y2={93} c={COUL.F}/>
      <Ligne x={124} y={116} s={19} c={COUL.F} segs={[{ v: 'F' }]} halo/>
      <Particule x={84} y={93} z={-1}/>
      <text x="84" y="132" fontSize="16" fontWeight="700" fill={COUL.txt} textAnchor="middle" style={Halo}>v = 0</text>
      <Particule x={252} y={93} z={-1}/>
      <Fl x1={261} y1={93} x2={306} y2={93} c={COUL.v}/>
      <Ligne x={268} y={78} s={19} segs={[{ v: 'v' }]} halo/>
      <line x1="48" y1="174" x2="210" y2="174" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="48" y1="168" x2="48" y2="180" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/><line x1="210" y1="168" x2="210" y2="180" stroke={COUL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      <text x="129" y="188" fontSize="17" fontWeight="700" fill={COUL.gris} textAnchor="middle" fontStyle="italic" style={Halo}>U</text>
    </Car>
  );
}
export function SvgCarteLineaire() {
  const L = [20, 28, 35, 40, 44], G = 10; let x = 28; const T = L.map(l => { const d = x; x += l + G; return [d, l]; });
  return (
    <Car aria="Cinq tubes alignés de longueurs croissantes, reliés alternativement aux deux bornes d'un générateur de tension alternative ; la particule est accélérée entre les tubes et va à vitesse constante dans chaque tube" h={184}>
      {T.map(([d, l], i) => <g key={i}><rect x={d} y={56} width={l} height="36" rx="3" fill="#e2e8f0" stroke={COUL.txt} strokeWidth="2"/>
        <line x1={d + l / 2 - 5} y1="74" x2={d + l / 2 + 5} y2="74" stroke={COUL.txt} strokeWidth="2.2" strokeLinecap="round"/>
        {i % 2 === 0 && <line x1={d + l / 2} y1="69" x2={d + l / 2} y2="79" stroke={COUL.txt} strokeWidth="2.2" strokeLinecap="round"/>}
        <line x1={d + l / 2} y1={i % 2 === 0 ? 56 : 92} x2={d + l / 2} y2={i % 2 === 0 ? 34 : 114} stroke={COUL.gris} strokeWidth="2" strokeLinecap="round"/></g>)}
      <polyline points={`${T[0][0] + 10},34 296,34 296,64`} fill="none" stroke={COUL.gris} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={`${T[1][0] + 14},114 296,114 296,84`} fill="none" stroke={COUL.gris} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="296" cy="74" r="13" fill="#fff" stroke={COUL.txt} strokeWidth="2"/><path d="M289,74 q3.5,-8 7,0 t7,0" fill="none" stroke={COUL.txt} strokeWidth="2" strokeLinecap="round"/>
      <Fl x1="4" y1="74" x2="22" y2="74" c={COUL.v} t={8}/>
      <Fl x1={T[4][0] + T[4][1] + 6} y1="74" x2={T[4][0] + T[4][1] + 32} y2="74" c={COUL.v} t={8}/>
      <Fl x1="30" y1="140" x2="250" y2="140" c={COUL.gris} w={2}/>
      <text x="150" y="168" fontSize="16" fontWeight="700" fill={COUL.gris} textAnchor="middle">tubes de plus en plus longs</text>
    </Car>
  );
}
