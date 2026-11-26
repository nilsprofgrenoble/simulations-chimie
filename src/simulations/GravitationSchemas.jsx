// Schémas de la simulation 266 : deux corps qui s'attirent, graphe de g selon la distance au centre, cartes « À retenir ».
import { C, Fl, VT, L } from './vecteursVASchemas';
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const T = ({ x, y, children, c = C.encre, s = 15, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;

// Deux corps A et B, forces d'attraction réciproques ; echelle : longueur des flèches ; cote : distance d affichée (ou null)
export function SceneDeuxCorps({ rA = 26, rB = 26, flA = 52, cote = null, nomA = 'A', nomB = 'B', maxWidth = 460 }) {
  const xA = 90, xB = 310, y = 100;
  return (
    <svg viewBox="0 0 400 200" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={`Deux corps ${nomA} et ${nomB} qui s'attirent : chacun subit une force dirigée vers l'autre, de même valeur et de sens opposés${cote ? `, séparés d'une distance ${cote}` : ''}.`}>
      <circle cx={xA} cy={y} r={rA} fill="#dbeafe" stroke={C.bleu} strokeWidth="2"/><circle cx={xB} cy={y} r={rB} fill="#ffedd5" stroke={C.orange} strokeWidth="2"/>
      <T x={xA} y={y + 5} a="middle" w={700}>{nomA}</T><T x={xB} y={y + 5} a="middle" w={700}>{nomB}</T>
      <Fl x1={xA + rA} y1={y - 12} x2={xA + rA + flA} y2={y - 12} c={C.rouge} w={3.2}/><Fl x1={xB - rB} y1={y - 12} x2={xB - rB - flA} y2={y - 12} c={C.rouge} w={3.2}/>
      <VT x={xA + rA + 6} y={y - 24} t="F" i="B/A" c={C.rouge} s={16}/><VT x={xB - rB - 6} y={y - 24} t="F" i="A/B" c={C.rouge} s={16} a="end"/>
      {cote && <g><line x1={xA} y1={y + 50} x2={xB} y2={y + 50} stroke={C.gris} strokeWidth="1.6"/><line x1={xA} y1={y + 42} x2={xA} y2={y + 58} stroke={C.gris}/><line x1={xB} y1={y + 42} x2={xB} y2={y + 58} stroke={C.gris}/>
        <T x={200} y={y + 76} a="middle" s={16} w={700} c={C.gris}>d = {cote}</T></g>}
    </svg>);
}

// Graphe g (N/kg) en fonction de la distance au centre r (en rayons R) ; point repère à r = rr
export function GrapheG({ g0, rr = 1, rmax = 3, maxWidth = 460 }) {
  const W = 400, H = 260, ml = 52, mr = 14, mt = 16, mb = 42, pw = W - ml - mr, ph = H - mt - mb;
  const gmax = Math.ceil(g0 * 1.2 / 5) * 5 || 5, X = r => ml + ((r - 1) / (rmax - 1)) * pw, Y = g => mt + ph - (g / gmax) * ph;
  const pts = []; for (let k = 0; k <= 80; k++) { const r = 1 + (rmax - 1) * k / 80; pts.push(`${X(r).toFixed(1)},${Y(g0 / (r * r)).toFixed(1)}`); }
  const gt = []; for (let g = 0; g <= gmax + 1e-9; g += gmax / 5) gt.push(g);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={`Graphique de l'intensité de pesanteur g en fonction de la distance au centre, en rayons du corps : g diminue quand la distance augmente. Valeur au point choisi : ${fr(g0 / (rr * rr), 2)} newtons par kilogramme.`}>
      {gt.map(g => <g key={g}><line x1={ml} y1={Y(g)} x2={W - mr} y2={Y(g)} stroke="#e2e8f0"/><T x={ml - 6} y={Y(g) + 5} a="end" s={14} c={C.gris}>{fr(g, g % 1 ? 1 : 0)}</T></g>)}
      {[1, 1.5, 2, 2.5, 3].filter(r => r <= rmax).map(r => <g key={r}><line x1={X(r)} y1={mt} x2={X(r)} y2={mt + ph} stroke="#e2e8f0"/><T x={X(r)} y={mt + ph + 18} a="middle" s={14} c={C.gris}>{fr(r, r % 1 ? 1 : 0)}</T></g>)}
      <line x1={ml} y1={mt + ph} x2={W - mr} y2={mt + ph} stroke={C.encre} strokeWidth="1.6"/><line x1={ml} y1={mt} x2={ml} y2={mt + ph} stroke={C.encre} strokeWidth="1.6"/>
      <T x={W - mr} y={H - 6} a="end" s={14} w={700}>distance au centre (en rayons R)</T><T x={ml + 4} y={mt + 12} s={15} w={700}>g (N/kg)</T>
      <polyline points={pts.join(' ')} fill="none" stroke={C.bleu} strokeWidth="2.8"/>
      <line x1={X(rr)} y1={Y(g0 / (rr * rr))} x2={X(rr)} y2={mt + ph} stroke={C.gris} strokeDasharray="3 3"/><circle cx={X(rr)} cy={Y(g0 / (rr * rr))} r="5.5" fill={C.orange} stroke="#fff" strokeWidth="1.5"/>
    </svg>);
}

const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" aria-label={aria} style={{ ...stl, maxWidth: 420 }}>{children}</svg>;
export function SvgForcesCarte() {
  return (
    <Cadre h={190} aria="Deux corps A et B : forces d'attraction de même valeur et de sens opposés, F = G mA mB ÷ d².">
      <circle cx="60" cy="80" r="22" fill="#dbeafe" stroke={C.bleu} strokeWidth="2"/><circle cx="250" cy="80" r="22" fill="#ffedd5" stroke={C.orange} strokeWidth="2"/>
      <Fl x1="84" y1="70" x2="140" y2="70" c={C.rouge} w={3.2}/><Fl x1="226" y1="70" x2="170" y2="70" c={C.rouge} w={3.2}/>
      <T x="155" y="58" a="middle" s={14} w={700} c={C.rouge}>même valeur</T>
      <line x1="60" y1="128" x2="250" y2="128" stroke={C.gris} strokeWidth="1.6"/><T x="155" y="150" a="middle" s={15} c={C.gris}>distance d</T>
      <T x="200" y="182" a="middle" s={18} w={700}>F = G × mA × mB ÷ d²</T>
    </Cadre>);
}
export function SvgPoidsCarte() {
  return (
    <Cadre h={200} aria="La masse m est la même partout ; le poids P = m × g dépend de l'astre, car l'intensité de pesanteur g dépend de l'astre.">
      <rect x="10" y="10" width="380" height="84" rx="8" fill="#eff6ff" stroke={C.bleu}/><T x="22" y="36" s={16} w={700} c={C.bleu}>Masse m : la même partout</T><T x="22" y="62" s={15}>70 kg sur la Terre, 70 kg sur la Lune</T>
      <rect x="10" y="104" width="380" height="86" rx="8" fill="#fff7ed" stroke={C.orange}/><T x="22" y="130" s={16} w={700} c={C.orange}>Poids P = m × g : change avec g</T><T x="22" y="158" s={15}>P = m × G M ÷ R² (poids au sol)</T><T x="22" y="180" s={14} c={C.gris}>g plus petit sur la Lune : poids plus petit</T>
    </Cadre>);
}
export function SvgAltitudeCarte() {
  return (
    <Cadre h={200} aria="g diminue quand on s'éloigne du centre : g = G M ÷ (R + h)². À 400 kilomètres d'altitude, g vaut encore près de 90 % de sa valeur au sol : l'apesanteur n'est pas l'absence de gravitation.">
      <circle cx="90" cy="130" r="64" fill="#dbeafe" stroke={C.bleu} strokeWidth="2"/><circle cx="90" cy="38" r="6" fill={C.orange}/><line x1="90" y1="130" x2="90" y2="38" stroke={C.gris} strokeDasharray="4 3"/>
      <Fl x1="90" y1="38" x2="90" y2="62" c={C.rouge} w={3}/>
      <T x="190" y="52" s={16} w={700}>g = G M ÷ (R + h)²</T><T x="190" y="82" s={14} c={C.gris}>h : altitude au-dessus du sol</T>
      <T x="190" y="116" s={15} w={700} c={C.rouge}>g diminue avec h</T><T x="190" y="144" s={14} c={C.gris}>mais g n’est pas nul :</T><T x="190" y="164" s={14} c={C.gris}>la gravitation agit encore</T>
    </Cadre>);
}
