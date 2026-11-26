// Schémas de la simulation 270 : objet lâché dans un fluide (poids et frottement), courbe v(t), cartes « À retenir ».
import { C, Fl, VT } from './vecteursVASchemas';
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const T = ({ x, y, children, c = C.encre, s = 15, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" style={{ ...stl, maxWidth: 420, border: `1px solid ${C.clair}` }} aria-label={aria}>{children}</svg>;

// Courbe v(t) = v_lim (1 − e^(−t/τ)) dans un repère (X0, Y0) ; l'unité de temps est τ (5,6 τ sur la largeur W), v_lim occupe la hauteur H
const X0 = 54, W = 316, TT = 5.6;
const courbe = (Y0, H, k = 1, tmax = TT) => Array.from({ length: 57 }, (_, i) => { const u = tmax * i / 56; return `${(X0 + u / TT * W).toFixed(1)},${(Y0 - H * k * (1 - Math.exp(-u))).toFixed(1)}`; }).join(' ');
const Axes = ({ Y0, H, vtxt = 'v' }) => <g>
  <line x1={X0} y1={Y0} x2={X0 + W + 10} y2={Y0} stroke={C.gris} strokeWidth="2.4"/><line x1={X0} y1={Y0} x2={X0} y2={Y0 - H - 24} stroke={C.gris} strokeWidth="2.4"/>
  <T x={X0 + W + 8} y={Y0 + 18} s={14} w={700} c={C.gris} a="end">t</T><T x={X0 + 6} y={Y0 - H - 14} s={14} w={700} c={C.gris}>{vtxt}</T></g>;

// Scène du parcours : un objet dans un fluide ; fr = f ÷ P (longueur du frottement par rapport au poids) ; aucune valeur numérique
export function SceneObjet({ fr = 0.5, noms = true, maxWidth = 300, aria }) {
  const cx = 150, cy = 120, LP = 78, LF = Math.max(0, LP * fr);
  return (
    <svg viewBox="0 0 300 250" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || `Un objet lâché dans un fluide : le poids, vers le bas, est représenté par une flèche de longueur fixe ; le frottement du fluide, vers le haut, est ${fr === 0 ? 'nul (aucune flèche)' : fr >= 1 ? 'aussi long que le poids' : 'plus court que le poids'}.`}>
      <rect x="40" y="18" width="220" height="222" rx="14" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2.4"/>
      <text x="250" y="38" fontSize="13" fontWeight="700" fill="#0369a1" textAnchor="end">fluide</text>
      <circle cx={cx} cy={cy} r="20" fill="#dbeafe" stroke={C.bleu} strokeWidth="3"/>
      <Fl x1={cx} y1={cy + 20} x2={cx} y2={cy + 20 + LP} c={C.orange} w={4}/>{noms && <VT x={cx + 12} y={cy + 20 + LP * 0.7} t="P" c={C.orange} s={19} halo/>}
      {LF > 6 && <g><Fl x1={cx} y1={cy - 20} x2={cx} y2={cy - 20 - LF} c={C.violet} w={4}/>{noms && <VT x={cx + 12} y={cy - 20 - LF * 0.6} t="f" c={C.violet} s={19} halo/>}</g>}
      <g><Fl x1="76" y1="52" x2="76" y2="96" c={C.gris} w={3}/><VT x="86" y="82" t="v" c={C.gris} s={18} halo/></g>
      {fr === 0 && noms && <T x={cx} y={cy - 36} s={13.5} w={700} c={C.violet} a="middle">f = 0</T>}
      {fr >= 1 && noms && <T x={cx} y={228} s={13.5} w={800} c={C.vert} a="middle">f = P : les forces se compensent</T>}
    </svg>);
}
// Scène de lecture : la courbe v(t) avec l'asymptote, la tangente à l'origine et le point à t = τ ; options symboliques (pas de valeur numérique)
export function SceneCourbe({ asymp = false, tangente = false, point = false, zones = false, maxWidth = 460, aria }) {
  const Y0 = 190, H = 130, xt = X0 + 1 / TT * W, yt = Y0 - H * (1 - Math.exp(-1));
  return (
    <svg viewBox="0 0 400 230" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || 'Courbe de la vitesse en fonction du temps : elle part de zéro, croît de moins en moins vite et tend vers une valeur limite, la vitesse limite.'}>
      <Axes Y0={Y0} H={H}/>
      {zones && <g><rect x={X0} y={Y0 - H - 20} width={xt * 2 - X0 - 0} height={H + 20} fill="#fef3c7" opacity="0.5"/><rect x={xt * 2} y={Y0 - H - 20} width={X0 + W - xt * 2 + 10} height={H + 20} fill="#dcfce7" opacity="0.6"/>
        <T x={X0 + 8} y={Y0 - 8} s={12.5} w={800} c="#92400e">régime transitoire</T><T x={X0 + W + 6} y={Y0 - 8} s={12.5} w={800} c="#166534" a="end">régime permanent</T></g>}
      {asymp && <g><line x1={X0} y1={Y0 - H} x2={X0 + W + 6} y2={Y0 - H} stroke={C.rouge} strokeWidth="2.2" strokeDasharray="7 5"/><T x={X0 - 6} y={Y0 - H + 5} s={14} w={800} c={C.rouge} a="end">v<tspan dy="3" fontSize="10">lim</tspan></T></g>}
      {tangente && <g><line x1={X0} y1={Y0} x2={xt} y2={Y0 - H} stroke={C.violet} strokeWidth="2.4" strokeDasharray="6 4"/><line x1={xt} y1={Y0 - H} x2={xt} y2={Y0 + 6} stroke={C.violet} strokeWidth="1.8" strokeDasharray="3 4"/><T x={xt} y={Y0 + 20} s={15} w={800} c={C.violet} a="middle">τ</T></g>}
      {point && <g><circle cx={xt} cy={yt} r="5.5" fill="#fff" stroke={C.vert} strokeWidth="2.8"/><line x1={X0} y1={yt} x2={xt} y2={yt} stroke={C.vert} strokeWidth="1.8" strokeDasharray="4 4"/></g>}
      <polyline points={courbe(Y0, H)} fill="none" stroke={C.bleu} strokeWidth="3.6" strokeLinecap="round"/>
      <circle cx={X0} cy={Y0} r="4" fill={C.bleu}/>
    </svg>);
}
// Carte : forces et régimes
export function SvgRegimesCarte() {
  const Y0 = 150, H = 100;
  return (
    <Cadre h={206} aria="Au départ la vitesse est nulle et le frottement aussi ; le frottement augmente avec la vitesse ; en régime permanent le frottement égale le poids, l'accélération est nulle et la vitesse est constante.">
      <Axes Y0={Y0} H={H}/>
      <rect x={X0} y={Y0 - H - 20} width="118" height={H + 20} fill="#fef3c7" opacity="0.55"/><rect x={X0 + 118} y={Y0 - H - 20} width={W - 108} height={H + 20} fill="#dcfce7" opacity="0.65"/>
      <line x1={X0} y1={Y0 - H} x2={X0 + W + 6} y2={Y0 - H} stroke={C.rouge} strokeWidth="2" strokeDasharray="7 5"/>
      <polyline points={courbe(Y0, H)} fill="none" stroke={C.bleu} strokeWidth="3.6" strokeLinecap="round"/>
      <T x={X0 + 6} y={Y0 - H - 28} s={13} w={800} c="#92400e">transitoire</T><T x={X0 + 126} y={Y0 - H - 28} s={13} w={800} c="#166534">permanent</T>
      <T x="200" y="176" a="middle" s={14} w={800} c={C.encre}>transitoire : a diminue ; permanent : a = 0</T>
      <T x="200" y="196" a="middle" s={14} w={700} c={C.rouge}>alors v reste égale à v<tspan dy="3" fontSize="10">lim</tspan></T>
    </Cadre>);
}
// Carte : v_lim et τ ; exemple m = 1,0 kg, k = 5,0 kg/s
export function SvgTauCarte() {
  const Y0 = 150, H = 100, xt = X0 + W / TT, yt = Y0 - H * (1 - Math.exp(-1));
  return (
    <Cadre h={214} aria="La vitesse limite vaut m g divisé par k et la constante de temps tau vaut m divisé par k. À la date tau, la vitesse atteint 63 pour cent de la vitesse limite. La tangente à l'origine coupe l'asymptote à la date tau. Le régime permanent est atteint au bout d'environ 5 tau.">
      <Axes Y0={Y0} H={H}/>
      <line x1={X0} y1={Y0 - H} x2={X0 + W + 6} y2={Y0 - H} stroke={C.rouge} strokeWidth="2" strokeDasharray="7 5"/>
      <line x1={X0} y1={Y0} x2={xt} y2={Y0 - H} stroke={C.violet} strokeWidth="2.2" strokeDasharray="6 4"/><line x1={xt} y1={Y0 - H} x2={xt} y2={Y0 + 6} stroke={C.violet} strokeWidth="1.6" strokeDasharray="3 4"/>
      <polyline points={courbe(Y0, H)} fill="none" stroke={C.bleu} strokeWidth="3.6" strokeLinecap="round"/>
      <circle cx={xt} cy={yt} r="5" fill="#fff" stroke={C.vert} strokeWidth="2.6"/><line x1={X0} y1={yt} x2={xt} y2={yt} stroke={C.vert} strokeWidth="1.6" strokeDasharray="4 4"/>
      <T x={xt} y={Y0 + 17} s={14} w={800} c={C.violet} a="middle">τ</T><T x={X0 + 5 * W / TT} y={Y0 + 17} s={14} w={800} c={C.gris} a="middle">5τ</T>
      <T x={xt + 10} y={yt + 20} s={12.5} w={800} c={C.vert}>63 % de v<tspan dy="3" fontSize="9">lim</tspan></T>
      <T x="200" y="188" a="middle" s={14} w={700} c={C.encre}>v<tspan dy="3" fontSize="10">lim</tspan><tspan dy="-3"> = m g ÷ k   ·   τ = m ÷ k</tspan></T>
      <T x="200" y="206" a="middle" s={13} w={700} c={C.gris}>exemple : m = 1,0 kg, k = 5,0 kg/s : v<tspan dy="3" fontSize="9">lim</tspan><tspan dy="-3"> ≈ 2,0 m/s, τ = 0,20 s</tspan></T>
    </Cadre>);
}
// Carte : effets de m et de k
export function SvgEffetsCarte() {
  const Y0 = 150, H = 92;
  return (
    <Cadre h={212} aria="Avec une masse plus grande, la vitesse limite et la constante de temps augmentent. Avec un coefficient de frottement k plus grand, la vitesse limite et la constante de temps diminuent.">
      <Axes Y0={Y0} H={H + 30}/>
      <polyline points={courbe(Y0, H)} fill="none" stroke={C.bleu} strokeWidth="3.4" strokeLinecap="round"/>
      <polyline points={Array.from({ length: 57 }, (_, i) => { const u = TT * i / 56; return `${(X0 + u / TT * W).toFixed(1)},${(Y0 - H * 1.3 * (1 - Math.exp(-u / 2))).toFixed(1)}`; }).join(' ')} fill="none" stroke={C.vert} strokeWidth="3.4" strokeLinecap="round"/>
      <T x={X0 + 120} y={Y0 - H - 34} s={12.5} w={800} c={C.vert}>m double : v<tspan dy="3" fontSize="9">lim</tspan><tspan dy="-3"> et τ doublés</tspan></T>
      <T x={X0 + 200} y={Y0 - H * 0.62} s={12.5} w={800} c={C.bleu}>référence</T>
      <T x="200" y="190" a="middle" s={13.5} w={700} c={C.encre}>m ×2 : v<tspan dy="3" fontSize="9.5">lim</tspan><tspan dy="-3"> ×2 et τ ×2   ·   k ×2 : v</tspan><tspan dy="3" fontSize="9.5">lim</tspan><tspan dy="-3"> ÷2 et τ ÷2</tspan></T>
      <T x="200" y="206" a="middle" s={13} w={700} c={C.gris}>v<tspan dy="3" fontSize="9">lim</tspan><tspan dy="-3"> = m g ÷ k ; τ = m ÷ k</tspan></T>
    </Cadre>);
}
// Défi de lecture : courbe v(t) quadrillée (t de 0 à 8 s, v de 0 à 18 m/s), sans aucune valeur écrite en dehors des graduations
export function GrapheLecture({ vlim, tau, maxWidth = 460 }) {
  const GW = 460, GH = 290, x0 = 54, x1 = 442, y0 = 20, y1 = 250, TM = 8, VM = 18, gX = t => x0 + t / TM * (x1 - x0), gY = v => y1 - v / VM * (y1 - y0);
  const pts = Array.from({ length: 81 }, (_, i) => { const t = TM * i / 80; return `${gX(t).toFixed(1)},${gY(vlim * (1 - Math.exp(-t / tau))).toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox={`0 0 ${GW} ${GH}`} role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label="Courbe de la vitesse d’un objet en fonction du temps, sur un quadrillage : t de 0 à 8 secondes, v de 0 à 18 mètres par seconde. La vitesse croît puis tend vers une valeur limite.">
      {Array.from({ length: TM * 2 + 1 }, (_, i) => i / 2).map(t => <line key={'x' + t} x1={gX(t)} y1={y0} x2={gX(t)} y2={y1} stroke={Number.isInteger(t) ? '#cbd5e1' : '#e2e8f0'} strokeWidth={Number.isInteger(t) ? 1.3 : 1}/>)}
      {Array.from({ length: VM + 1 }, (_, v) => v).map(v => <line key={'y' + v} x1={x0} y1={gY(v)} x2={x1} y2={gY(v)} stroke={v % 2 === 0 ? '#cbd5e1' : '#e2e8f0'} strokeWidth={v % 2 === 0 ? 1.3 : 1}/>)}
      <line x1={x0} y1={y1} x2={x1 + 6} y2={y1} stroke={C.gris} strokeWidth="2.4"/><line x1={x0} y1={y1} x2={x0} y2={y0 - 8} stroke={C.gris} strokeWidth="2.4"/>
      {Array.from({ length: TM + 1 }, (_, t) => t).map(t => <text key={'tx' + t} x={gX(t)} y={y1 + 18} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.gris}>{t}</text>)}
      {Array.from({ length: 10 }, (_, i) => 2 * i).map(v => <text key={'ty' + v} x={x0 - 8} y={gY(v) + 5} textAnchor="end" fontSize="13" fontWeight="700" fill={C.gris}>{v}</text>)}
      <text x={x1} y={y1 + 36} textAnchor="end" fontSize="13.5" fontWeight="800" fill={C.gris}>temps (s)</text><text x={x0 + 6} y={y0 - 6} fontSize="13.5" fontWeight="800" fill={C.gris}>vitesse (m/s)</text>
      <polyline points={pts} fill="none" stroke={C.bleu} strokeWidth="3.8" strokeLinecap="round"/>
    </svg>);
}
