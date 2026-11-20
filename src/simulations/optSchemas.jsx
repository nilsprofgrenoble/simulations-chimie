// ====================================================
//  Schémas de la simulation 189 (optimiser une étape de synthèse : vitesse et rendement ; niveau TG).
//  Règles de dessin : coordonnées numériques ; textes de 16 minimum dans un viewBox de 400 (cartes : 15,5 minimum dans un viewBox de 320) ;
//  jamais la couleur seule (traits pleins, tirets, pointillés + étiquette directe) ; schémas « non à l'échelle » annoncés ; width 100 % + maxWidth.
// ====================================================
import * as M from './optModele';
import { COL } from './optOutils';

const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const virg = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

const Tx = ({ x, y, children, c = COL.txt, s = 16, w = 700, a = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a} {...(halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {})}>{children}</text>);

// flèche fine à pointe fixe
export const Fl = ({ x1, y1, x2, y2, c = COL.txt, w = 2, dash, tete = 8, demi = 3.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 1.5) return null;
  const ux = dx / L, uy = dy / L, h = Math.min(tete, L * 0.7), d = demi * (h / tete), bx = x2 - ux * h, by = y2 - uy * h;
  return (<g><line x1={x1} y1={y1} x2={bx + ux} y2={by + uy} stroke={c} strokeWidth={w} strokeLinecap={dash ? 'butt' : 'round'} strokeDasharray={dash}/>
    <polygon points={`${x2},${y2} ${bx - uy * d},${by + ux * d} ${bx + uy * d},${by - ux * d}`} fill={c} stroke={c} strokeWidth="1" strokeLinejoin="round"/></g>);
};

// ====================================================
//  GRAPHE n(t) ou Qr(t)
//  courbes : [{ p (paramètres du modèle), nom (étiquette directe), dash, c, etiq: { t (min), dx, dy, a } }]
//  horizon : durée affichée (min) ; mode : 'n' (ester formé, en mol) ou 'qr' ; ticksY : 'aucun' (seulement 0 et n_max) ou 'std' ;
//  nmax : trait en pointillés « n_max » (ester si la transformation était totale) ; limite : trait de la valeur limite de la première courbe (sans élimination)
// ====================================================
export function GrapheEssais({ courbes, horizon = M.DUREE, mode = 'n', ticksY = 'std', nmax = true, limite = false, aria }) {
  const X0 = 58, X1 = 386, Y0 = 36, Y1 = 218, W = X1 - X0, H = Y1 - Y0;
  const ymax = mode === 'n' ? 1.06 : M.K * 1.22;
  const px = t => X0 + W * t / horizon, py = v => Y1 - H * v / ymax;
  const hz = horizon / 60, pasH = hz <= 3 ? 1 : hz <= 6 ? 2 : hz <= 12 ? 3 : hz <= 15 ? 5 : hz <= 24 ? 6 : 12;
  const ticksT = []; for (let h = 0; h <= hz + 1e-9; h += pasH) ticksT.push(h);
  const ticksV = mode === 'n' ? (ticksY === 'aucun' ? [0] : [0, 0.5, 1]) : [0, 1, 2, 3, 4];
  const chemin = pts => pts.map((q, k) => `${k ? 'L' : 'M'}${px(q.t).toFixed(1)} ${py(mode === 'n' ? q.x : Math.min(q.qr, ymax)).toFixed(1)}`).join(' ');
  const lim = limite && courbes.length ? M.xLimite(courbes[0].p) : null;
  return (
    <svg viewBox="0 0 400 286" style={stl} role="img" aria-label={aria || (mode === 'n' ? 'Graphique : quantité d’ester formé, en mol, en fonction du temps, en heures.' : 'Graphique : quotient de réaction Qr en fonction du temps, avec la valeur de la constante d’équilibre K.')}>
      <Fl x1={X0} y1={Y1} x2={X0} y2={Y0 - 16} c={COL.gris} w={1.8} tete={7} demi={3}/>
      <Fl x1={X0} y1={Y1} x2={X1 + 6} y2={Y1} c={COL.gris} w={1.8} tete={7} demi={3}/>
      <Tx x={X0 + 6} y={18} s={18} c={COL.txt} halo={false}>{mode === 'n' ? 'n(ester) en mol' : 'Qr'}</Tx>
      <Tx x={X1 + 6} y={Y1 + 44} s={18} c={COL.txt} a="end" halo={false}>t en h</Tx>
      {ticksT.map(h => <g key={'t' + h}><line x1={px(h * 60)} y1={Y1} x2={px(h * 60)} y2={Y1 + 6} stroke={COL.gris} strokeWidth="1.8"/><Tx s={18} x={px(h * 60)} y={Y1 + 25} a="middle" w={600} halo={false}>{h}</Tx></g>)}
      {ticksV.map(v => <g key={'v' + v}><line x1={X0 - 6} y1={py(v)} x2={X0} y2={py(v)} stroke={COL.gris} strokeWidth="1.8"/>
        <Tx s={18} x={X0 - 10} y={py(v) + 5.5} a="end" w={600} halo={false}>{mode === 'n' ? (v === 0.5 ? '0,5' : v === 1 ? '1,0' : v) : v}</Tx></g>)}
      {mode === 'n' && nmax && <g><line x1={X0} y1={py(1)} x2={X1} y2={py(1)} stroke={COL.gris} strokeWidth="1.8" strokeDasharray="2 5" strokeLinecap="round"/><Tx s={18} x={X0 + 8} y={py(1) - 7} c={COL.gris}>n<tspan dy={4} fontSize={17}>max</tspan></Tx></g>}
      {mode === 'qr' && <g><line x1={X0} y1={py(M.K)} x2={X1} y2={py(M.K)} stroke={COL.orange} strokeWidth="2.2" strokeDasharray="9 5"/><Tx s={18} x={X1 - 2} y={py(M.K) - 7} c={COL.orange} a="end">K = 4</Tx></g>}
      {lim != null && <g><line x1={X0} y1={py(lim)} x2={X1} y2={py(lim)} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="9 4 2 4"/></g>}
      {courbes.map((c, i) => { const pts = M.simuler(c.p, horizon, 150), e = c.etiq;
        const q = e ? pts.reduce((b, z) => (Math.abs(z.t - e.t) < Math.abs(b.t - e.t) ? z : b)) : null;
        return (
        <g key={i}><path d={chemin(pts)} fill="none" stroke={c.c || COL.bleu} strokeWidth={c.w || 3} strokeDasharray={c.dash} strokeLinecap="round" strokeLinejoin="round"/>
          {e && <Tx s={18} x={px(e.t) + (e.dx || 0)} y={py(mode === 'n' ? q.x : Math.min(q.qr, ymax)) + (e.dy || 0)} a={e.a || 'start'} c={c.c || COL.bleu}>{c.nom}</Tx>}</g>); })}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320, textes ≥ 15,5)
// ====================================================
// 1. rendement : n_obtenue et n_max sur la courbe
export function SvgCarteRendement() {
  const pt = 'M 44 176 C 66 118, 96 96, 150 90 S 230 88, 296 88';
  return (
    <svg viewBox="0 0 320 218" style={stlCarte} role="img" aria-label="Schéma : courbe de la quantité d’ester qui monte puis reste sur un palier, sous le trait en pointillés n_max ; l’écart entre le palier et n_max montre une transformation limitée.">
      <Fl x1={44} y1={180} x2={44} y2={26} c={COL.gris} w={1.8} tete={7} demi={3}/><Fl x1={44} y1={180} x2={308} y2={180} c={COL.gris} w={1.8} tete={7} demi={3}/>
      <Tx x={52} y={22} s={15.5} halo={false}>n(ester)</Tx><Tx x={308} y={202} s={15.5} a="end" halo={false}>temps</Tx>
      <line x1={44} y1={46} x2={300} y2={46} stroke={COL.gris} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round"/>
      <Tx x={52} y={40} s={15.5} c={COL.gris}>n<tspan dy={4} fontSize={14.5}>max</tspan><tspan dy={-4}> (transformation totale)</tspan></Tx>
      <path d={pt} fill="none" stroke={COL.bleu} strokeWidth="3.2" strokeLinecap="round"/>
      <Fl x1={266} y1={178} x2={266} y2={92} c={COL.vert} w={2.2}/><Fl x1={266} y1={92} x2={266} y2={178} c={COL.vert} w={2.2}/>
      <Tx x={258} y={140} s={15.5} c={COL.vert} a="end">n<tspan dy={4} fontSize={14.5}>obtenue</tspan></Tx>
      <Fl x1={296} y1={50} x2={296} y2={84} c={COL.rouge} w={2.2}/><Fl x1={296} y1={84} x2={296} y2={50} c={COL.rouge} w={2.2}/>
      <Tx x={288} y={72} s={15.5} c={COL.rouge} a="end">manque</Tx>
    </svg>);
}
// 2. plus vite, même palier
export function SvgCarteMemePalier() {
  const f = (a, t) => 1 - Math.exp(-a * t), X = t => 44 + t * 256, Y = v => 176 - v * 116;
  const chem = a => Array.from({ length: 41 }, (_, k) => `${k ? 'L' : 'M'}${X(k / 40).toFixed(1)} ${Y(f(a, k / 40)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 320 218" style={stlCarte} role="img" aria-label="Schéma : deux courbes de quantité d’ester, l’une monte vite et l’autre lentement, mais elles tendent vers le même palier.">
      <Fl x1={44} y1={180} x2={44} y2={26} c={COL.gris} w={1.8} tete={7} demi={3}/><Fl x1={44} y1={180} x2={308} y2={180} c={COL.gris} w={1.8} tete={7} demi={3}/>
      <Tx x={52} y={22} s={15.5} halo={false}>n(ester)</Tx><Tx x={308} y={202} s={15.5} a="end" halo={false}>temps</Tx>
      <line x1={44} y1={Y(1)} x2={300} y2={Y(1)} stroke={COL.orange} strokeWidth="2" strokeDasharray="8 4"/>
      <Tx x={300} y={Y(1) - 8} s={15.5} c={COL.orange} a="end">même palier</Tx>
      <path d={chem(7)} fill="none" stroke={COL.bleu} strokeWidth="3.2" strokeLinecap="round"/>
      <path d={chem(1.6)} fill="none" stroke={COL.vert} strokeWidth="3.2" strokeDasharray="9 5" strokeLinecap="round"/>
      <Tx x={108} y={102} s={15.5} c={COL.bleu}>rapide</Tx>
      <Tx x={196} y={140} s={15.5} c={COL.vert}>lent</Tx>
    </svg>);
}
// 3. Qr compare à K
export function SvgCarteQrK() {
  return (
    <svg viewBox="0 0 320 196" style={stlCarte} role="img" aria-label="Schéma : sur un axe de valeurs de Qr, la constante d’équilibre K au centre ; à gauche Qr est inférieur à K et le système évolue dans le sens direct, à droite Qr est supérieur à K et il évolue dans le sens inverse.">
      <line x1={20} y1={80} x2={300} y2={80} stroke={COL.gris} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1={160} y1={64} x2={160} y2={96} stroke={COL.orange} strokeWidth="3.4" strokeLinecap="round"/>
      <Tx x={160} y={122} s={17} c={COL.orange} a="middle">K</Tx>
      <Tx x={160} y={146} s={15.5} c={COL.orange} a="middle">équilibre : Qr = K</Tx>
      <Fl x1={40} y1={44} x2={140} y2={44} c={COL.bleu} w={3} tete={10} demi={4.4}/>
      <Fl x1={280} y1={44} x2={180} y2={44} c={COL.vert} w={3} tete={10} demi={4.4} dash="8 4"/>
      <Tx x={24} y={26} s={15.5} c={COL.bleu}>Qr &lt; K</Tx><Tx x={296} y={26} s={15.5} c={COL.vert} a="end">Qr &gt; K</Tx>
      <Tx x={24} y={106} s={15.5} c={COL.bleu}>sens direct</Tx><Tx x={296} y={106} s={15.5} c={COL.vert} a="end">sens inverse</Tx>
      <Tx x={160} y={178} s={15.5} c={COL.gris} w={600} a="middle" halo={false}>Qr s’ajuste jusqu’à K</Tx>
    </svg>);
}
// 4. excès d'éthanol : rendement à l'équilibre pour 1:1, 1:2, 1:3, 1:5 (valeurs du modèle)
export function SvgCarteExces() {
  const barres = M.RAPPORTS.map(r => ({ r, v: M.xEq(r) * 100 }));
  const X = k => 52 + k * 60, Y = v => 176 - v * 1.3;
  return (
    <svg viewBox="0 0 320 234" style={stlCarte} role="img" aria-label="Schéma : rendement à l’équilibre pour une quantité d’éthanol égale à 1, 2, 3 et 5 fois celle de l’acide ; il augmente avec l’excès mais de moins en moins vite.">
      <line x1={36} y1={176} x2={304} y2={176} stroke={COL.gris} strokeWidth="2" strokeLinecap="round"/>
      {barres.map((b, k) => <g key={k}><rect x={X(k)} y={Y(b.v)} width={44} height={176 - Y(b.v)} fill={k === 0 ? '#cbd5e1' : '#bae6fd'} stroke={COL.bleu} strokeWidth="2.4" strokeDasharray={k === 0 ? '6 3' : undefined}/>
        <Tx x={X(k) + 22} y={Y(b.v) - 7} s={15.5} a="middle">{virg(b.v, 0)} %</Tx>
        <Tx x={X(k) + 22} y={198} s={15.5} a="middle" w={600} halo={false}>1 : {b.r}</Tx></g>)}
      <Tx x={36} y={22} s={15.5} halo={false}>rendement à l’équilibre</Tx>
      <Tx x={304} y={228} s={15.5} a="end" c={COL.gris} halo={false}>acide : éthanol</Tx>
    </svg>);
}
// 5. bilan : vitesse ou rendement ? deux mini-graphiques
export function SvgCarteBilan() {
  const X = (x0, t) => x0 + t * 112, Y = v => 128 - v * 70, f = (a, t) => 1 - Math.exp(-a * t);
  const chem = (x0, a, h) => Array.from({ length: 31 }, (_, k) => `${k ? 'L' : 'M'}${X(x0, k / 30).toFixed(1)} ${Y(h * f(a, k / 30)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 320 196" style={stlCarte} role="img" aria-label="Schéma : à gauche, une courbe qui monte plus vite vers le même palier (plus vite) ; à droite, une courbe qui monte vers un palier plus haut (plus loin).">
      <Tx x={72} y={20} s={16} c={COL.bleu} a="middle">plus vite</Tx><Tx x={252} y={20} s={16} c={COL.vert} a="middle">plus loin</Tx>
      {[16, 196].map(x0 => <g key={x0}><Fl x1={x0} y1={132} x2={x0} y2={36} c={COL.gris} w={1.6} tete={6} demi={2.6}/><Fl x1={x0} y1={132} x2={x0 + 112} y2={132} c={COL.gris} w={1.6} tete={6} demi={2.6}/></g>)}
      <line x1={16} y1={Y(0.75)} x2={128} y2={Y(0.75)} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="8 4"/>
      <path d={chem(16, 2.2, 0.75)} fill="none" stroke={COL.gris} strokeWidth="2.6" strokeDasharray="8 4" strokeLinecap="round"/>
      <path d={chem(16, 7, 0.75)} fill="none" stroke={COL.bleu} strokeWidth="3.2" strokeLinecap="round"/>
      <path d={chem(196, 5, 0.75)} fill="none" stroke={COL.gris} strokeWidth="2.6" strokeDasharray="8 4" strokeLinecap="round"/>
      <path d={chem(196, 5, 0.97)} fill="none" stroke={COL.vert} strokeWidth="3.2" strokeLinecap="round"/>
      <line x1={196} y1={Y(0.75)} x2={308} y2={Y(0.75)} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="8 4"/>
      <Tx x={16} y={158} s={15.5} halo={false} w={600}>t½ plus court</Tx><Tx x={196} y={158} s={15.5} halo={false} w={600}>palier plus haut</Tx>
      <Tx x={160} y={186} s={15.5} a="middle" c={COL.gris} halo={false} w={600}>tirets : avant la modification</Tx>
    </svg>);
}
