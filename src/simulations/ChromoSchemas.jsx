// Schémas de la simulation 303 « UV-visible : couleur, conjugaison et auxochromes ». SVG, largeur 100 % plafonnée.
import { K, T, svgStyle } from "./schemaOutils";
import * as M from "./chromoModele";

const carte = { display: 'block', width: '100%', maxWidth: 320, margin: '0 auto' };
const X0 = 30, X1 = 330, xl = l => X0 + (l - 200) / 600 * (X1 - X0);
const YB = 214, HT = 118;
const ARC = [[380, '#7c3aed'], [440, '#2563eb'], [490, '#06b6d4'], [530, '#22c55e'], [580, '#eab308'], [620, '#f97316'], [700, '#dc2626'], [780, '#7f1d1d']];

// ---------- cuve colorée et spectre d'absorption ε(λ) de une ou deux espèces (la première, en tirets, sert de référence si ref = true) ----------
export function SceneCuveSpectre({ bandes, css = null, marque = null, ymax = null, titre = 'Spectre d’absorption UV-visible' }) {
  const ym = ymax ?? 1.32 * Math.max(...bandes.map(b => b.eps));
  const trace = b => { let d = ''; for (let l = M.LAM_MIN; l <= M.LAM_MAX; l += 4) d += `${d ? 'L' : 'M'}${xl(l).toFixed(1)},${(YB - M.epsLam(l, b.eps, b.lam) / ym * HT).toFixed(1)}`; return d; };
  return (<svg role="img" aria-label={`${titre} : absorption en fonction de la longueur d'onde, de 200 à 800 nanomètres`} viewBox="0 0 340 254" width="100%" style={svgStyle}>
    <defs><linearGradient id="chromo-arc" x1="0" x2="1" y1="0" y2="0">{ARC.map(([l, c]) => <stop key={l} offset={`${(l - 380) / 400 * 100}%`} stopColor={c}/>)}</linearGradient></defs>
    {css && <g><rect x="140" y="6" width="60" height="64" rx="5" fill="#f8fafc" stroke={K.txt} strokeWidth="1.6"/><rect x="143" y="24" width="54" height="43" rx="3" fill={css} stroke="#94a3b8" strokeWidth=".8"/>{T(215, 40, 'solution', { size: 12, fill: K.gris, anchor: 'start' })}{T(215, 55, 'dans la cuve', { size: 12, fill: K.gris, anchor: 'start' })}</g>}
    <rect x={xl(380)} y="82" width={xl(780) - xl(380)} height={YB - 82} fill="#f1f5f9" opacity=".8"/>
    <line x1={xl(380)} y1="82" x2={xl(380)} y2={YB} stroke={K.clair} strokeDasharray="3 3"/>
    {T(xl(290), 96, 'UV', { size: 12.5, gras: true, fill: K.gris })}{T(xl(580), 96, 'visible', { size: 12.5, gras: true, fill: K.gris })}
    <line x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris}/><line x1={X0} y1="82" x2={X0} y2={YB} stroke={K.gris}/>
    <rect x={xl(380)} y={YB + 2} width={xl(780) - xl(380)} height="6" fill="url(#chromo-arc)" rx="2"/>
    {[200, 300, 400, 500, 600, 700, 800].map(l => <g key={l}><line x1={xl(l)} y1={YB} x2={xl(l)} y2={YB - 4} stroke={K.gris}/>{T(xl(l), YB + 22, String(l), { size: 11.5, fill: K.gris })}</g>)}
    {T(X1, 250, 'longueur d’onde λ (nm)', { anchor: 'end', size: 11.5, fill: K.gris })}{T(X0 + 4, 80, 'ε', { size: 13, gras: true, anchor: 'start' })}
    {bandes.map((b, i) => <path key={i} d={trace(b)} fill="none" stroke={b.ref ? '#94a3b8' : '#1d4ed8'} strokeWidth={b.ref ? 1.8 : 2.4} strokeDasharray={b.ref ? '5 3' : undefined}/>)}
    {bandes.map((b, i) => T(xl(b.lam), YB - b.eps / ym * HT - 6, `${Math.round(b.lam)}`, { size: 12, gras: true, fill: b.ref ? K.gris : '#1d4ed8', halo: true, key: `t${i}` }))}
    {marque != null && <g><line x1={xl(marque)} y1="82" x2={xl(marque)} y2={YB} stroke="#dc2626" strokeDasharray="4 3" strokeWidth="1.4"/></g>}
  </svg>);
}

// ---------- cartes « À retenir » (viewBox 300, texte ≥ 12,5) ----------
const LIGNES = [[410, '#7c3aed', 'violet', '400–435', 'jaune-vert'], [455, '#2563eb', 'bleu', '435–480', 'jaune'], [530, '#16a34a', 'vert', '500–560', 'pourpre'], [588, '#eab308', 'jaune', '580–595', 'bleu'], [600, '#f97316', 'orange', '595–605', 'bleu-vert'], [650, '#dc2626', 'rouge', '605–780', 'bleu-vert']];
export function SvgCarteCouleur() {
  return (<svg role="img" aria-label="La couleur perçue d'une solution est la complémentaire de la couleur absorbée" viewBox="0 0 300 236" style={carte}>
    {T(150, 17, 'Couleur absorbée → couleur perçue', { size: 14, gras: true })}
    {T(60, 38, 'absorbée', { size: 12.5, fill: K.gris })}{T(236, 38, 'perçue', { size: 12.5, fill: K.gris })}
    {LIGNES.map(([lam, col, abs, pl, vue], i) => { const y = 46 + i * 28; return (<g key={lam}>
      <rect x="10" y={y} width="22" height="22" rx="4" fill={col} stroke="#0f172a" strokeWidth="1"/>{T(40, y + 12, abs, { size: 13, gras: true, anchor: 'start' })}{T(40, y + 24, `${pl} nm`, { size: 11, fill: K.gris, anchor: 'start' })}
      {T(142, y + 16, '→', { size: 16, fill: K.gris })}
      <rect x="170" y={y} width="22" height="22" rx="4" fill={M.cssSolution(lam)} stroke="#0f172a" strokeWidth="1"/>{T(200, y + 16, vue, { size: 13, gras: true, anchor: 'start' })}</g>); })}
    <rect x="10" y="216" width="280" height="18" rx="5" fill="#f1f5f9"/>{T(150, 229, 'λmax < 380 nm (UV seul) : solution incolore', { size: 12.5 })}
  </svg>);
}
export function SvgCarteConjugaison() {
  const lignes = [[2, 'n = 2'], [3, 'n = 3'], [4, 'n = 4'], [6, 'n = 6'], [11, 'n = 11']], xx = l => 58 + (l - 200) / 300 * 232;
  return (<svg role="img" aria-label="Plus le nombre de liaisons C=C conjuguées est grand, plus la longueur d'onde du maximum d'absorption est grande" viewBox="0 0 300 220" style={carte}>
    {T(150, 17, 'Plus de C=C conjuguées → λmax plus grand', { size: 13.5, gras: true })}
    {lignes.map(([n, lab], i) => { const y = 36 + i * 28, l = M.lamPolyene(n); return (<g key={n}>
      {T(8, y + 14, lab, { size: 12.5, gras: true, anchor: 'start' })}
      <rect x="58" y={y} width={xx(l) - 58} height="20" rx="3" fill={l > 380 ? '#f59e0b' : '#7c3aed'} opacity=".85"/>{T(xx(l) + 4, y + 15, `${l} nm`, { size: 12.5, gras: true, anchor: 'start' })}</g>); })}
    <line x1={xx(380)} y1="30" x2={xx(380)} y2="178" stroke="#dc2626" strokeDasharray="4 3" strokeWidth="1.6"/>{T(xx(380) + 3, 190, 'limite du visible', { size: 12, fill: '#b91c1c', anchor: 'middle' })}
    {T(150, 211, 'n = 11 : β-carotène, jaune-orangé', { size: 12.5, fill: K.gris })}
  </svg>);
}
const gauss = (x, c, s, h) => h * Math.exp(-0.5 * ((x - c) / s) ** 2);
export function SvgCarteEffets() {
  const cell = (cx, cy, titre, sous, ref, nv) => {
    const tr = p => { let d = ''; for (let x = -60; x <= 60; x += 3) d += `${d ? 'L' : 'M'}${(cx + x).toFixed(1)},${(cy + 40 - gauss(x, p[0], 14, p[1])).toFixed(1)}`; return d; };
    return (<g key={titre}>
      <rect x={cx - 66} y={cy - 22} width="132" height="82" rx="8" fill="#f8fafc" stroke={K.clair}/>
      <line x1={cx - 60} y1={cy + 40} x2={cx + 60} y2={cy + 40} stroke={K.gris}/>
      <path d={tr(ref)} fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="4 3"/><path d={tr(nv)} fill="none" stroke="#1d4ed8" strokeWidth="2.4"/>
      {T(cx, cy - 7, titre, { size: 12.5, gras: true })}{T(cx, cy + 54, sous, { size: 11.5, fill: K.gris })}</g>);
  };
  return (<svg role="img" aria-label="Effets bathochrome, hypsochrome, hyperchrome et hypochrome sur une bande d'absorption" viewBox="0 0 300 236" style={carte}>
    {T(150, 15, 'λ : position · ε : hauteur', { size: 13.5, gras: true })}
    {cell(76, 50, 'bathochrome', 'λ augmente →', [-12, 34], [14, 34])}{cell(224, 50, 'hypsochrome', '← λ diminue', [12, 34], [-14, 34])}
    {cell(76, 148, 'hyperchrome', 'ε augmente ↑', [0, 22], [0, 40])}{cell(224, 148, 'hypochrome', 'ε diminue ↓', [0, 40], [0, 20])}
    {T(150, 232, 'tirets : référence · trait plein : après', { size: 12, fill: K.gris })}
  </svg>);
}
