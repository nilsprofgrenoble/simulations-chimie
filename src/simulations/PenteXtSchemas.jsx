// Schémas de la simulation 265 : graphique de la position x en fonction de la date t, avec corde et tangente ; cartes « À retenir ».
import { C } from './vecteursVASchemas';
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const T = ({ x, y, children, c = C.encre, s = 15, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const pas = r => [1, 2, 5, 10, 20].find(p => r / p <= 6) || 20;

// Graphe x(t). fn : t → x ; xmin/xmax/tmax : bornes ; corde : [t1, t2] ; tangente : { t0, v } ; points : [[t, x, nom?]] ; masquerTangente etc. gérés par l'appelant
export function GrapheXT({ fn, tmax, xmin, xmax, corde = null, tangente = null, points = [], maxWidth = 460, aria, repere = null }) {
  const W = 400, H = 280, ml = 48, mr = 14, mt = 16, mb = 42, pw = W - ml - mr, ph = H - mt - mb;
  const X = t => ml + (t / tmax) * pw, Y = x => mt + ph - ((x - xmin) / (xmax - xmin)) * ph;
  const pt = []; for (let k = 0; k <= 120; k++) { const t = tmax * k / 120; pt.push(`${X(t).toFixed(1)},${Y(fn(t)).toFixed(1)}`); }
  const pt_ = pas(tmax), px_ = pas(xmax - xmin);
  const gt = [], gx = []; for (let t = 0; t <= tmax + 1e-9; t += pt_) gt.push(t); for (let x = Math.ceil(xmin / px_) * px_; x <= xmax + 1e-9; x += px_) gx.push(x);
  const tg = tangente && (() => { const x0 = fn(tangente.t0); const f = t => x0 + tangente.v * (t - tangente.t0);
    const ts = [0, tmax].filter(Boolean); let a = 0, b = tmax; // on borne la droite à la zone du graphe
    if (tangente.v !== 0) { const ta = tangente.t0 + (xmin - x0) / tangente.v, tb = tangente.t0 + (xmax - x0) / tangente.v; const lo = Math.min(ta, tb), hi = Math.max(ta, tb); a = Math.max(a, lo); b = Math.min(b, hi); }
    return ts && <line x1={X(a)} y1={Y(f(a))} x2={X(b)} y2={Y(f(b))} stroke={C.bleu} strokeWidth="2.6"/>; })();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || 'Graphique de la position x en fonction de la date t.'}>
      {gx.map(x => <g key={'x' + x}><line x1={ml} y1={Y(x)} x2={W - mr} y2={Y(x)} stroke="#e2e8f0"/><T x={ml - 6} y={Y(x) + 5} a="end" s={14} c={C.gris}>{fr(x, 0)}</T></g>)}
      {gt.map(t => <g key={'t' + t}><line x1={X(t)} y1={mt} x2={X(t)} y2={mt + ph} stroke="#e2e8f0"/><T x={X(t)} y={mt + ph + 18} a="middle" s={14} c={C.gris}>{fr(t, 0)}</T></g>)}
      <line x1={ml} y1={mt + ph} x2={W - mr} y2={mt + ph} stroke={C.encre} strokeWidth="1.6"/><line x1={ml} y1={mt} x2={ml} y2={mt + ph} stroke={C.encre} strokeWidth="1.6"/>
      <T x={W - mr} y={H - 6} a="end" s={15} w={700}>t (s)</T><T x={ml + 4} y={mt + 12} s={15} w={700}>x (m)</T>
      {tg}
      <polyline points={pt.join(' ')} fill="none" stroke={C.encre} strokeWidth="2.6" strokeLinejoin="round"/>
      {corde && <g><line x1={X(corde[0])} y1={Y(fn(corde[0]))} x2={X(corde[1])} y2={Y(fn(corde[1]))} stroke={C.orange} strokeWidth="2.6" strokeDasharray="7 4"/>
        {corde.map(t => <circle key={t} cx={X(t)} cy={Y(fn(t))} r="5" fill={C.orange} stroke="#fff" strokeWidth="1.5"/>)}</g>}
      {repere != null && <g><line x1={X(repere)} y1={Y(fn(repere))} x2={X(repere)} y2={mt + ph} stroke={C.gris} strokeDasharray="3 3"/><circle cx={X(repere)} cy={Y(fn(repere))} r="5.5" fill={C.bleu} stroke="#fff" strokeWidth="1.5"/></g>}
      {points.map(([t, x, nom], k) => <g key={k}><circle cx={X(t)} cy={Y(x)} r="5" fill={C.vert} stroke="#fff" strokeWidth="1.5"/>{nom && <T x={X(t) + 8} y={Y(x) - 8} s={14} w={700} c={C.vert}>{nom}</T>}</g>)}
    </svg>);
}

const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" aria-label={aria} style={{ ...stl, maxWidth: 420 }}>{children}</svg>;

// 1. La pente d'une droite x(t) est la vitesse
export function SvgPenteCarte() {
  return (
    <Cadre h={200} aria="Droite x(t) : la pente, rapport de la variation de position Δx par la durée Δt, est la vitesse.">
      <line x1="30" y1="170" x2="190" y2="170" stroke={C.encre} strokeWidth="1.6"/><line x1="30" y1="170" x2="30" y2="20" stroke={C.encre} strokeWidth="1.6"/>
      <T x="190" y="190" a="end" s={14}>t</T><T x="36" y="30" s={14}>x</T>
      <line x1="30" y1="150" x2="190" y2="50" stroke={C.bleu} strokeWidth="3"/>
      <polyline points="70,125 150,125 150,75" fill="none" stroke={C.orange} strokeWidth="2.4" strokeDasharray="6 4"/>
      <T x="110" y="144" a="middle" w={700} c={C.orange}>Δt</T><T x="158" y="104" w={700} c={C.orange}>Δx</T>
      <T x="220" y="62" w={700} c={C.bleu}>pente = v</T><T x="220" y="94" w={700}>v = Δx ÷ Δt</T>
      <T x="220" y="128" s={14} c={C.gris}>droite montante : v &gt; 0</T><T x="220" y="150" s={14} c={C.gris}>droite descendante : v &lt; 0</T>
    </Cadre>);
}
// 2. De la corde à la tangente
export function SvgCordeCarte() {
  const f = t => 150 - 105 * Math.pow(t / 170, 1.8), pts = []; for (let k = 0; k <= 40; k++) pts.push(`${30 + 170 * k / 40},${f(170 * k / 40) + 0}`);
  const t0 = 60, t1 = 150, x0 = f(t0), x1 = f(t1), s = (f(t0 + 1) - f(t0 - 1)) / 2;
  return (
    <Cadre h={210} aria="Courbe x(t) avec une corde en tirets orange entre deux points, et la tangente en bleu au premier point : en rapprochant les deux points, la corde se confond avec la tangente.">
      <line x1="30" y1="175" x2="200" y2="175" stroke={C.encre} strokeWidth="1.6"/><line x1="30" y1="175" x2="30" y2="15" stroke={C.encre} strokeWidth="1.6"/>
      <polyline points={pts.map(p => { const [a, b] = p.split(','); return `${Number(a)},${Number(b) + 15}`; }).join(' ')} fill="none" stroke={C.encre} strokeWidth="2.6"/>
      <line x1={30 + t0 - 55} y1={x0 + 15 - s * 55} x2={30 + t0 + 100} y2={x0 + 15 + s * 100} stroke={C.bleu} strokeWidth="2.6"/>
      <line x1={30 + t0} y1={x0 + 15} x2={30 + t1} y2={x1 + 15} stroke={C.orange} strokeWidth="2.6" strokeDasharray="7 4"/>
      <circle cx={30 + t0} cy={x0 + 15} r="5" fill={C.bleu}/><circle cx={30 + t1} cy={x1 + 15} r="5" fill={C.orange}/>
      <T x="215" y="50" w={700} c={C.orange}>corde :</T><T x="215" y="72" s={14} c={C.orange}>vitesse moyenne</T>
      <T x="215" y="112" w={700} c={C.bleu}>tangente :</T><T x="215" y="134" s={14} c={C.bleu}>vitesse à l’instant t</T>
      <T x="215" y="170" s={14} c={C.gris}>corde → tangente quand</T><T x="215" y="190" s={14} c={C.gris}>Δt devient très petit</T>
    </Cadre>);
}
// 3. Tangente horizontale : vitesse nulle un instant
export function SvgSommetCarte() {
  const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40; pts.push(`${30 + 170 * t},${40 + 130 * Math.pow(2 * t - 1, 2)}`); }
  return (
    <Cadre h={200} aria="Courbe x(t) en arche avec une tangente horizontale au sommet : à cet instant la vitesse est nulle, le mobile s'arrête un instant avant de repartir en sens inverse.">
      <line x1="30" y1="180" x2="200" y2="180" stroke={C.encre} strokeWidth="1.6"/><line x1="30" y1="180" x2="30" y2="15" stroke={C.encre} strokeWidth="1.6"/>
      <polyline points={pts.join(' ')} fill="none" stroke={C.encre} strokeWidth="2.6"/>
      <line x1="60" y1="40" x2="170" y2="40" stroke={C.bleu} strokeWidth="2.6"/><circle cx="115" cy="40" r="5" fill={C.bleu}/>
      <T x="215" y="44" w={700} c={C.bleu}>tangente</T><T x="215" y="66" w={700} c={C.bleu}>horizontale</T>
      <T x="215" y="108" w={700}>v = 0</T><T x="215" y="130" s={14} c={C.gris}>un instant seulement :</T><T x="215" y="150" s={14} c={C.gris}>le mobile fait demi-tour</T>
    </Cadre>);
}
