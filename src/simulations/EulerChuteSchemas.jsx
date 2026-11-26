// Schémas de la simulation 271 : bilan des trois forces, méthode d'Euler (courbe exacte et points calculés), cartes « À retenir ».
import { C, Fl, VT } from './vecteursVASchemas';
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const T = ({ x, y, children, c = C.encre, s = 15, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" style={{ ...stl, maxWidth: 420, border: `1px solid ${C.clair}` }} aria-label={aria}>{children}</svg>;

// Bilan des forces : poids (bas), poussée d'Archimède (haut), frottement (haut, plus court)
export function SceneBilan({ poussee = true, frottement = true, maxWidth = 300, aria }) {
  const cx = 150, cy = 124;
  return (
    <svg viewBox="0 0 300 250" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || 'Un objet dans un fluide subit trois forces verticales : son poids vers le bas, la poussée d’Archimède vers le haut et le frottement du fluide vers le haut.'}>
      <rect x="40" y="18" width="220" height="222" rx="14" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2.4"/>
      <text x="250" y="38" fontSize="13" fontWeight="700" fill="#0369a1" textAnchor="end">fluide</text>
      <circle cx={cx} cy={cy} r="22" fill="#dbeafe" stroke={C.bleu} strokeWidth="3"/>
      <Fl x1={cx} y1={cy + 22} x2={cx} y2={cy + 22 + 80} c={C.orange} w={4}/><VT x={cx + 12} y={cy + 22 + 58} t="P" c={C.orange} s={19} halo/>
      {poussee && <g><Fl x1={cx - 12} y1={cy - 22} x2={cx - 12} y2={cy - 22 - 36} c={C.vert} w={4}/><VT x={cx - 36} y={cy - 22 - 22} t="Π" c={C.vert} s={19} halo/></g>}
      {frottement && <g><Fl x1={cx + 12} y1={cy - 22} x2={cx + 12} y2={cy - 22 - 22} c={C.violet} w={4}/><VT x={cx + 22} y={cy - 22 - 8} t="f" c={C.violet} s={19} halo/></g>}
      <g><Fl x1="72" y1="52" x2="72" y2="96" c={C.gris} w={3}/><VT x={82} y={82} t="v" c={C.gris} s={18} halo/></g>
    </svg>);
}

// Courbe v(t)/v_lim = 1 − e^(−u), u = t/τ ; repère (X0, Y0), largeur W pour U unités de τ, hauteur H pour v_lim
const X0 = 54, W = 316;
const gx = (u, U) => X0 + u / U * W, gy = (v, Y0, H) => Y0 - v * H;
const exacte = (Y0, H, U) => Array.from({ length: 61 }, (_, i) => { const u = U * i / 60; return `${gx(u, U).toFixed(1)},${gy(1 - Math.exp(-u), Y0, H).toFixed(1)}`; }).join(' ');
const euler = (dt, U) => { const pts = []; let v = 0; for (let u = 0; u <= U + 1e-9; u += dt) { pts.push([u, v]); v += (1 - v) * dt; } return pts; };
const Axes = ({ Y0, H, U, vl = true }) => <g>
  <line x1={X0} y1={Y0} x2={X0 + W + 10} y2={Y0} stroke={C.gris} strokeWidth="2.4"/><line x1={X0} y1={Y0} x2={X0} y2={Y0 - H - 24} stroke={C.gris} strokeWidth="2.4"/>
  <T x={X0 + W + 8} y={Y0 + 18} s={14} w={700} c={C.gris} a="end">t</T><T x={X0 + 6} y={Y0 - H - 12} s={14} w={700} c={C.gris}>v</T>
  {vl && <line x1={X0} y1={Y0 - H} x2={X0 + W + 6} y2={Y0 - H} stroke={C.rouge} strokeWidth="1.8" strokeDasharray="7 5"/>}
  <g>{[0, 1, 2, 3].filter(u => u <= U).map(u => <line key={u} x1={gx(u, U)} y1={Y0} x2={gx(u, U)} y2={Y0 + 5} stroke={C.gris} strokeWidth="1.6"/>)}</g></g>;

// Scène du parcours : courbe exacte et points d'Euler ; nPas = nombre de pas dessinés, dt en unités de τ ; aucune valeur numérique
export function SceneEuler({ nPas = 1, dt = 0.5, tangente = true, maxWidth = 460, aria }) {
  const U = 3, Y0 = 190, H = 130, pts = euler(dt, U).slice(0, nPas + 1);
  return (
    <svg viewBox="0 0 400 230" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || 'Courbe de la vitesse en fonction du temps et premiers points calculés par la méthode d’Euler, qui suivent la courbe en la dépassant légèrement.'}>
      <Axes Y0={Y0} H={H} U={U}/>
      <polyline points={exacte(Y0, H, U)} fill="none" stroke={C.clair} strokeWidth="4.5" strokeLinecap="round"/>
      {tangente && pts.length > 1 && <line x1={gx(0, U)} y1={gy(0, Y0, H)} x2={gx(dt, U)} y2={gy(dt, Y0, H)} stroke={C.violet} strokeWidth="2.4" strokeDasharray="6 4"/>}
      <polyline points={pts.map(([u, v]) => `${gx(u, U).toFixed(1)},${gy(v, Y0, H).toFixed(1)}`).join(' ')} fill="none" stroke={C.orange} strokeWidth="2.6"/>
      {pts.map(([u, v], i) => <circle key={i} cx={gx(u, U)} cy={gy(v, Y0, H)} r="5" fill={C.orange} stroke="#fff" strokeWidth="1.6"/>)}
      <T x={gx(dt, U)} y={Y0 + 20} s={14} w={800} c={C.gris} a="middle">Δt</T><line x1={gx(dt, U)} y1={Y0 - 4} x2={gx(dt, U)} y2={Y0 + 4} stroke={C.gris} strokeWidth="2"/>
      <circle cx={X0} cy={Y0} r="4" fill={C.bleu}/>
    </svg>);
}
// Carte : équation différentielle et valeurs limites
export function SvgEquationCarte() {
  return (
    <Cadre h={214} aria="Trois forces : poids, poussée d'Archimède et frottement. L'équation différentielle est m dv/dt = m g − m_f g − k v. En régime permanent, dv/dt = 0 et la vitesse limite vaut (m − m_f) g ÷ k.">
      <rect x="22" y="20" width="110" height="174" rx="12" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2"/>
      <circle cx="77" cy="108" r="14" fill="#dbeafe" stroke={C.bleu} strokeWidth="2.6"/>
      <Fl x1="77" y1="122" x2="77" y2="172" c={C.orange} w={3.6}/><VT x={87} y={158} t="P" c={C.orange} s={17} halo/>
      <Fl x1="68" y1="94" x2="68" y2="60" c={C.vert} w={3.6}/><VT x={42} y={72} t="Π" c={C.vert} s={17} halo/>
      <Fl x1="86" y1="94" x2="86" y2="72" c={C.violet} w={3.6}/><VT x={94} y={84} t="f" c={C.violet} s={17} halo/>
      <T x="150" y="40" s={14} w={800} c={C.encre}>m dv/dt = m g − m<tspan dy="3" fontSize="10">f</tspan><tspan dy="-3"> g − k v</tspan></T>
      <T x="150" y="62" s={13} w={700} c={C.gris}>poids − poussée − frottement</T>
      <T x="150" y="96" s={14} w={800} c={C.encre}>dv/dt = A − v ÷ τ</T>
      <T x="150" y="116" s={13} w={700} c={C.gris}>A = g (1 − m<tspan dy="3" fontSize="9">f</tspan><tspan dy="-3"> ÷ m) ; τ = m ÷ k</tspan></T>
      <T x="150" y="152" s={14} w={800} c={C.rouge}>régime permanent : dv/dt = 0</T>
      <T x="150" y="174" s={14} w={800} c={C.encre}>v<tspan dy="3" fontSize="10">lim</tspan><tspan dy="-3"> = (m − m</tspan><tspan dy="3" fontSize="10">f</tspan><tspan dy="-3">) g ÷ k</tspan></T>
      <T x="150" y="194" s={12.5} w={700} c={C.gris}>l’objet est moins « lourd » dans le fluide</T>
    </Cadre>);
}
// Carte : la méthode d'Euler
export function SvgEulerCarte() {
  const U = 3, Y0 = 138, H = 92, dt = 0.5, pts = euler(dt, U);
  return (
    <Cadre h={214} aria="Méthode d'Euler : à chaque pas, on calcule l'accélération avec la vitesse actuelle, puis la nouvelle vitesse vaut la vitesse actuelle plus l'accélération multipliée par le pas Δt.">
      <Axes Y0={Y0} H={H} U={U}/>
      <polyline points={exacte(Y0, H, U)} fill="none" stroke={C.clair} strokeWidth="4.5" strokeLinecap="round"/>
      <polyline points={pts.map(([u, v]) => `${gx(u, U).toFixed(1)},${gy(v, Y0, H).toFixed(1)}`).join(' ')} fill="none" stroke={C.orange} strokeWidth="2.4"/>
      {pts.map(([u, v], i) => <circle key={i} cx={gx(u, U)} cy={gy(v, Y0, H)} r="4.6" fill={C.orange} stroke="#fff" strokeWidth="1.4"/>)}
      <T x={X0 + 120} y={Y0 + 20} s={13} w={800} c={C.orange}>points calculés</T><T x={X0 + 232} y={Y0 - H + 44} s={13} w={800} c={C.gris}>solution exacte</T>
      <T x="200" y="176" a="middle" s={14} w={800} c={C.encre}>a<tspan dy="3" fontSize="10">i</tspan><tspan dy="-3"> = A − v</tspan><tspan dy="3" fontSize="10">i</tspan><tspan dy="-3"> ÷ τ   puis   v</tspan><tspan dy="3" fontSize="10">i+1</tspan><tspan dy="-3"> = v</tspan><tspan dy="3" fontSize="10">i</tspan><tspan dy="-3"> + a</tspan><tspan dy="3" fontSize="10">i</tspan><tspan dy="-3"> Δt</tspan></T>
      <T x="200" y="196" a="middle" s={13} w={700} c={C.gris}>départ : v = 0 ; chaque pas utilise la tangente</T>
    </Cadre>);
}
// Carte : effet du pas
export function SvgPasCarte() {
  const U = 3, Y0 = 138, H = 80;
  const ligne = (dt, c, d) => { const pts = euler(dt, U); return <g><polyline points={pts.map(([u, v]) => `${gx(u, U).toFixed(1)},${gy(v, Y0, H).toFixed(1)}`).join(' ')} fill="none" stroke={c} strokeWidth="2.6" strokeDasharray={d}/>{pts.map(([u, v], i) => <circle key={i} cx={gx(u, U)} cy={gy(v, Y0, H)} r="3.6" fill={c}/>)}</g>; };
  // pas de 1,5 τ : oscillation autour de v_lim
  const grand = euler(1.5, U);
  return (
    <Cadre h={214} aria="Un petit pas donne une suite d'Euler proche de la solution exacte ; un pas de l'ordre de la constante de temps ou plus grand donne une suite très éloignée qui peut dépasser la vitesse limite et osciller.">
      <Axes Y0={Y0} H={H} U={U}/>
      <polyline points={exacte(Y0, H, U)} fill="none" stroke={C.clair} strokeWidth="4.5" strokeLinecap="round"/>
      {ligne(0.2, C.vert)}
      <polyline points={grand.map(([u, v]) => `${gx(u, U).toFixed(1)},${gy(v, Y0, H).toFixed(1)}`).join(' ')} fill="none" stroke={C.rouge} strokeWidth="2.6" strokeDasharray="7 4"/>{grand.map(([u, v], i) => <circle key={i} cx={gx(u, U)} cy={gy(v, Y0, H)} r="4.4" fill={C.rouge}/>)}
      <T x={X0 + 150} y={Y0 + 22} s={13} w={800} c={C.vert}>petit pas : proche</T><T x={X0 + 6} y={Y0 - H - 34} s={13} w={800} c={C.rouge}>grand pas : très approximatif</T>
      <T x="200" y="178" a="middle" s={14} w={800} c={C.encre}>Δt plus petit : plus précis, plus de calculs</T>
      <T x="200" y="198" a="middle" s={13} w={700} c={C.gris}>Δt de l’ordre de τ ou plus : résultat peu fiable</T>
    </Cadre>);
}
