// ====================================================
//  Schémas de la simulation 307 (spectroscopie UV-visible, terminale STL) : droite d'étalonnage, cartes « À retenir » (énergie du photon, étalonnage).
//  Cartes : viewBox de 400, textes ≥ 16. Public daltonien : jamais la couleur seule (traits pleins / tirets, étiquettes).
// ====================================================
import { useId } from 'react';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#b45309', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const fr = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 600, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Fl = ({ x1, y1, x2, y2, c = COL.txt, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), t = 11, bx = x2 - (t - 2) * Math.cos(a), by = y2 - (t - 2) * Math.sin(a);
  return <g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - t * Math.cos(a - 0.42)},${y2 - t * Math.sin(a - 0.42)} ${x2 - t * Math.cos(a + 0.42)},${y2 - t * Math.sin(a + 0.42)}`} fill={c}/></g>;
};
const cadre = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 };
const joli = x => { const e = Math.pow(10, Math.floor(Math.log10(x))); const m = x / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };

// ====================================================
//  GRAPHIQUE DE LA DROITE D'ÉTALONNAGE : points (c, A), droite A = k × c, et (option) lecture de c à partir de l'absorbance Ax de l'échantillon
//  pts : [{c, A}] ; k : A par unité de c ; unite : '…' ; cMax, aMax ; ax : absorbance de l'échantillon ou null ; lecture : trace les traits de report
// ====================================================
const GX0 = 62, GX1 = 388, GYT = 22, GYB = 196;
export function GrapheDroite({ pts, k, unite, cMax, aMax = 1.4, ax = null, lecture = false, aria }) {
  const xc = c => GX0 + c / cMax * (GX1 - GX0), ya = A => GYB - A / aMax * (GYB - GYT);
  const pasX = joli(cMax / 4), tx = []; for (let c = 0; c <= cMax + 1e-9; c += pasX) tx.push(c);
  const ty = []; for (let a = 0; a <= aMax + 1e-9; a += 0.5) ty.push(a);
  const cFin = Math.min(cMax, aMax / k), cx = ax != null ? ax / k : null;
  return (
    <svg viewBox="0 0 400 252" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      {ty.map(a => <g key={a}><line x1={GX0} y1={ya(a)} x2={GX1} y2={ya(a)} stroke="#e2e8f0" strokeWidth="1"/><text x={GX0 - 6} y={ya(a) + 5} fontSize="18" fill={COL.txt} textAnchor="end">{fr(a, 1)}</text></g>)}
      <line x1={GX0} y1={GYT - 4} x2={GX0} y2={GYB} stroke="#334155" strokeWidth="2"/><line x1={GX0} y1={GYB} x2={GX1} y2={GYB} stroke="#334155" strokeWidth="2"/>
      {tx.map(c => <g key={c}><line x1={xc(c)} y1={GYB} x2={xc(c)} y2={GYB + 5} stroke="#334155" strokeWidth="2"/><text x={xc(c)} y={GYB + 22} fontSize="18" fill={COL.txt} textAnchor="middle">{fr(c, c < 10 && c % 1 ? 1 : 0)}</text></g>)}
      <text x="4" y="16" fontSize="18" fontWeight="700" fill={COL.txt}>A</text>
      <text x={(GX0 + GX1) / 2} y="246" fontSize="18" fontWeight="700" fill={COL.txt} textAnchor="middle">c ({unite})</text>
      <line x1={xc(0)} y1={ya(0)} x2={xc(cFin)} y2={ya(k * cFin)} stroke={COL.gris} strokeWidth="3"/>
      {lecture && ax != null && <g>
        <line x1={GX0} y1={ya(ax)} x2={xc(cx)} y2={ya(ax)} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="7 5"/>
        <line x1={xc(cx)} y1={ya(ax)} x2={xc(cx)} y2={GYB} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="7 5"/>
        <circle cx={xc(cx)} cy={ya(ax)} r="6" fill="#fff" stroke={COL.orange} strokeWidth="3.5"/>
        <text x={GX0 + 8} y={ya(ax) - 6} fontSize="17" fontWeight="700" fill={COL.orange} {...HALO}>A échantillon</text></g>}
      {pts.map(p => <circle key={p.c} cx={xc(p.c)} cy={ya(p.A)} r="6.5" fill={COL.bleu} stroke="#fff" strokeWidth="1.5"/>)}
    </svg>);
}

// ====================================================
//  CARTE : énergie d'un photon et longueur d'onde
// ====================================================
const ARC = [[400, '#6d28d9'], [450, '#2563eb'], [490, '#06b6d4'], [530, '#22c55e'], [575, '#eab308'], [610, '#f97316'], [680, '#dc2626'], [750, '#991b1b']];
export function SvgEnergieCarte() {
  const id = useId().replace(/:/g, ''), gx = lam => 36 + (lam - 200) / 650 * 354;
  return (
    <svg viewBox="0 0 400 236" role="img" aria-label="Échelle des longueurs d'onde de 200 à 850 nanomètres : ultraviolet, visible, infrarouge. Les photons les plus énergétiques sont à gauche, vers l'ultraviolet ; relation E égale h c sur lambda" style={cadre}>
      <defs>
        <linearGradient id={`ea${id}`} x1={gx(400)} x2={gx(750)} y1="0" y2="0" gradientUnits="userSpaceOnUse">{ARC.map(([l, c]) => <stop key={l} offset={`${(l - 400) / 350 * 100}%`} stopColor={c}/>)}</linearGradient>
        <pattern id={`eu${id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e2e8f0"/><line x1="0" y1="0" x2="0" y2="7" stroke="#64748b" strokeWidth="2"/></pattern>
      </defs>
      <Fl x1="368" y1="36" x2="40" y2="36" c={COL.bleu} w={4}/>
      <Tx x="44" y="24" c={COL.bleu} w={700} halo={false}>E plus grande</Tx><Tx x="392" y="62" c={COL.gris} w={700} ancre="end" halo={false}>E plus petite</Tx>
      <rect x={gx(200)} y="82" width={gx(400) - gx(200)} height="26" fill={`url(#eu${id})`} stroke="#64748b" strokeWidth="1"/>
      <rect x={gx(400)} y="82" width={gx(750) - gx(400)} height="26" fill={`url(#ea${id})`}/>
      <rect x={gx(750)} y="82" width={gx(850) - gx(750)} height="26" fill="#f1f5f9" stroke="#64748b" strokeWidth="1"/>
      <Tx x={(gx(200) + gx(400)) / 2} y="132" ancre="middle" w={700} halo={false}>UV</Tx><Tx x={(gx(400) + gx(750)) / 2} y="132" ancre="middle" w={700} halo={false}>visible</Tx><Tx x={(gx(750) + gx(850)) / 2 + 2} y="132" ancre="middle" w={700} halo={false}>IR</Tx>
      <Tx x={gx(400)} y="154" ancre="middle" s={16} halo={false} c={COL.gris}>400</Tx><Tx x={gx(750)} y="154" ancre="middle" s={16} halo={false} c={COL.gris}>750 nm</Tx>
      <rect x="84" y="166" width="232" height="56" rx="12" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2.5"/>
      <Tx x="200" y="192" ancre="middle" s={22} w={700} halo={false}>E = h × c ÷ λ</Tx>
      <Tx x="200" y="214" ancre="middle" s={16} halo={false} c={COL.gris}>λ en m, E en J</Tx>
    </svg>);
}

// ====================================================
//  CARTE : droite d'étalonnage, de l'absorbance à la concentration
// ====================================================
export function SvgEtalonnageCarte() {
  const x0 = 54, x1 = 384, yb = 178, yt = 34, k = 0.19;           // k : pente en px (y) par px (x)
  const pts = [0.2, 0.4, 0.6, 0.8, 1].map(t => [x0 + t * 300, yb - t * 300 * k]);
  const ax = yb - 0.62 * 300 * k, cx = x0 + 0.62 * 300;
  return (
    <svg viewBox="0 0 400 236" role="img" aria-label="Droite d'étalonnage : absorbance A en fonction de la concentration c, cinq points alignés avec l'origine ; on lit l'absorbance de l'échantillon sur l'axe vertical, on la reporte sur la droite, puis on descend sur l'axe des concentrations" style={cadre}>
      <line x1={x0} y1={yt - 6} x2={x0} y2={yb} stroke="#334155" strokeWidth="2"/><line x1={x0} y1={yb} x2={x1 + 6} y2={yb} stroke="#334155" strokeWidth="2"/>
      <Tx x="12" y="28" w={700} halo={false}>A</Tx><Tx x="392" y="208" ancre="end" w={700} halo={false}>c</Tx>
      <line x1={x0} y1={yb} x2={x0 + 330} y2={yb - 330 * k} stroke={COL.gris} strokeWidth="3"/>
      <line x1={x0} y1={ax} x2={cx} y2={ax} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="7 5"/><line x1={cx} y1={ax} x2={cx} y2={yb} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="7 5"/>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" fill={COL.bleu} stroke="#fff" strokeWidth="1.5"/>)}
      <circle cx={cx} cy={ax} r="6" fill="#fff" stroke={COL.orange} strokeWidth="3.5"/>
      <Tx x={x0 + 8} y={ax - 7} c={COL.orange} w={700}>A mesurée</Tx><Tx x={cx + 8} y={yb - 8} c={COL.orange} w={700}>c cherchée</Tx>
      <Tx x="62" y="62" c={COL.bleu} w={700} halo={false}>● 5 étalons</Tx><Tx x="62" y="86" halo={false}>A = k × c</Tx>
      <Tx x="200" y="226" ancre="middle" s={16} halo={false} c={COL.gris}>c = A ÷ k</Tx>
    </svg>);
}
