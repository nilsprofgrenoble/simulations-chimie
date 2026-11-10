// Animation partagée : addition de Br₂, OsO₄ ou H₂/Pd sur un alcène, en perspective.
// L'alcène est dessiné dans un plan (parallélogramme) avec TOUS ses substituants : chaque carbone porte quatre liaisons
// (double liaison = 2, plus deux substituants). Les faces supérieure et inférieure du plan sont les faces d'attaque.
import { KIT } from "../commun";

const NOIR = '#0f172a', BRUN = '#9a3412', BLEU = '#1d4ed8', VERT = '#15803d', VIOLET = '#7c3aed', ROUGE = '#dc2626', GRIS = '#94a3b8';
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
const seg = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
const lisse = t => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t)))) / 2;
// perspective : x vers la droite, d en profondeur (vers l'arrière = vers le haut de l'écran)
const P = (x, d) => [180 + x + 0.75 * d, 150 - 0.8 * d];
const XC = 36, C2 = P(-XC, 0), C3 = P(XC, 0);

// Substituants de chaque alcène : [carbone, position (x, d), texte]  (back = d>0)
const SUBST = {
  Z: [['L', -XC - 36, 30, 'CH₃'], ['L', -XC - 36, -30, 'H'], ['R', XC + 36, 30, 'CH₃'], ['R', XC + 36, -30, 'H']],
  E: [['L', -XC - 36, 30, 'CH₃'], ['L', -XC - 36, -30, 'H'], ['R', XC + 36, -30, 'CH₃'], ['R', XC + 36, 30, 'H']],
  cyclo: [['L', -XC - 36, -30, 'H'], ['R', XC + 36, -30, 'H']],
  cyc: [['L', -XC - 36, -30, 'CH₃'], ['R', XC + 36, -30, 'CH₃']],
};
const CYCLE = [[-XC - 30, 24], [-XC + 2, 68], [XC - 2, 68], [XC + 30, 24]];   // quatre carbones du cycle, derrière

const ligne = (a, b, c = NOIR, w = 2.6, dash, op = 1) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} opacity={op} />;
const pastille = (x, y, txt, c, r = 11, fond = 'white') => <g><circle cx={x} cy={y} r={r} fill={fond} stroke={c} strokeWidth={2} /><text x={x} y={y + 4} fontSize={r > 13 ? 12 : 11} fontWeight="700" textAnchor="middle" fill={c}>{txt}</text></g>;
const etiq = (x, y, t, c = NOIR, taille = 13) => <text x={x} y={y + 4} fontSize={taille} fontWeight="700" textAnchor="middle" fill={c}>{t}</text>;

// flèche courbe (quadratique) avec pointe orientée selon la tangente finale
function Fleche({ de, vers, ctrl, op = 1 }) {
  const [x0, y0] = de, [x1, y1] = vers, [cx, cy] = ctrl;
  const ang = Math.atan2(y1 - cy, x1 - cx), L = 8;
  const a1 = [x1 - L * Math.cos(ang - 0.45), y1 - L * Math.sin(ang - 0.45)], a2 = [x1 - L * Math.cos(ang + 0.45), y1 - L * Math.sin(ang + 0.45)];
  return <g opacity={op}><path d={`M${x0},${y0} Q${cx},${cy} ${x1},${y1}`} fill="none" stroke={ROUGE} strokeWidth={2} /><polygon points={`${x1},${y1} ${a1[0]},${a1[1]} ${a2[0]},${a2[1]}`} fill={ROUGE} /></g>;
}

export function AnimAddition({ alc, re, u, face = 'dessus', syn = false, hauteur = 270 }) {
  const m = face === 'dessus' ? 1 : -1;                       // m = -1 : le réactif arrive par le dessous
  const t1 = seg(u, 0, 0.3), t2 = seg(u, 0.3, 0.55), t3 = seg(u, 0.55, 1);
  const subst = SUBST[alc], estCycle = alc === 'cyclo' || alc === 'cyc';
  const pi = u < 0.3;                                          // double liaison complète avant la première étape
  const bloque = syn && re === 'Br2' && t3 > 0.35;
  const [c2x, c2y] = C2, [c3x, c3y] = C3;
  const plan = [P(-118, -46), P(118, -46), P(118, 84), P(-118, 84)];

  // 1) plan de l'alcène, liaisons et substituants
  const elements = [];
  elements.push(<polygon key="plan" points={plan.map(p => p.join(',')).join(' ')} fill="#e0f2fe" opacity={0.55} stroke="#bae6fd" />);
  if (estCycle) {
    const pts = [C2, ...CYCLE.map(([x, d]) => P(x, d)), C3];
    pts.slice(0, -1).forEach((p, i) => elements.push(<g key={`r${i}`}>{ligne(p, pts[i + 1], NOIR, 2.4)}</g>));
  }
  subst.forEach(([cote, x, d, txt], i) => {
    const base = cote === 'L' ? C2 : C3, p = P(x, d), v = [p[0] - base[0], p[1] - base[1]], n = Math.hypot(...v), fin = [p[0] - v[0] / n * 11, p[1] - v[1] / n * 11];
    elements.push(<g key={`s${i}`}>{ligne(base, fin, NOIR, 2.2)}{etiq(p[0], p[1], txt, txt === 'H' ? '#475569' : NOIR, txt === 'H' ? 12 : 13)}</g>);
  });
  // double liaison (π estompée après la première étape)
  elements.push(<g key="cc">{ligne(C2, C3, NOIR, 3)}{ligne([c2x, c2y - 6], [c3x, c3y - 6], pi ? NOIR : GRIS, 3, pi ? undefined : '4 3')}</g>);
  elements.push(<g key="cl">{etiq(c2x + 15, c2y + 17, 'C2', KIT.txt2, 11)}{etiq(c3x - 15, c3y + 17, 'C3', KIT.txt2, 11)}</g>);

  // 2) réactif et intermédiaires. up(d) : d pixels du côté du réactif ; down(d) : de l'autre côté
  const up = d => 150 - m * d, down = d => 150 + m * d;
  const haut = [], bas = [];
  const fin = t3 > 0.999;
  if (re === 'Br2') {
    if (u < 0.3) {
      const x = lerp(250, 200, lisse(t1)), x2 = lerp(290, 240, lisse(t1)), y = up(lerp(125, 90, lisse(t1)));
      haut.push(<g key="a">{ligne([x, y], [x2, y], BRUN, 3)}{pastille(x, y, 'Br', BRUN)}{pastille(x2, y, 'Br', BRUN)}</g>);
      if (u > 0.1) { const o = seg(u, 0.1, 0.22); const mx = (c2x + c3x) / 2;
        haut.push(<g key="f"><Fleche de={[mx, c2y - 8 * m]} vers={[x - 3, y + 12 * m]} ctrl={[mx - 6, up(70)]} op={o} /><Fleche de={[(x + x2) / 2, y - 7 * m]} vers={[x2 + 4, y - 15 * m]} ctrl={[(x + x2) / 2 + 6, y - 24 * m]} op={o} /></g>); }
    } else if (!fin) {
      const yb = up(lerp(92, 58, lisse(t2)));
      haut.push(<g key="b">{ligne(C2, [180, yb], BRUN, 2.6)}{ligne(C3, [180, yb], BRUN, 2.6, t3 > 0.5 ? '4 3' : undefined)}{pastille(180, yb, 'Br⁺', BRUN, 13, '#fff7ed')}</g>);
    }
    if (u >= 0.3) {
      let bx, by;
      if (syn) { bx = lerp(272, 262, lisse(t3 / 0.5)); by = up(lerp(80, 52, lisse(t3 / 0.5))); if (t2 < 1) { bx = lerp(265, 300, lisse(t2)); by = up(lerp(86, 70, lisse(t2))); } }
      else if (t3 === 0) { bx = lerp(265, 300, lisse(t2)); by = up(lerp(86, 70, lisse(t2))); }
      else { const a = lisse(seg(t3, 0, 0.5)), b = lisse(seg(t3, 0.5, 1)); bx = lerp(300, c3x, b); by = lerp(up(70), down(58), a); }
      if (fin && !syn) bas.push(<g key="m">{ligne(C3, [c3x, down(44)], BRUN, 2.6)}{pastille(c3x, down(58), 'Br', BRUN)}</g>);
      else (syn ? haut : bas).push(<g key="m">{pastille(bx, by, 'Br⁻', BLEU)}</g>);
      if (!syn && t3 > 0.6 && !fin) bas.push(<g key="f2"><Fleche de={[c3x + 22, down(40)]} vers={[c3x + 4, c3y + 9 * m]} ctrl={[c3x + 24, down(18)]} op={seg(t3, 0.6, 0.75)} /></g>);
      if (bloque) haut.push(<g key="x">{etiq(244, up(34), '✕', ROUGE, 24)}</g>);
    }
    if (fin && !syn) haut.push(<g key="p">{ligne(C2, [c2x, up(44)], BRUN, 2.6)}{pastille(c2x, up(58), 'Br', BRUN)}</g>);
  } else if (re === 'OsO4') {
    if (u < 0.3) haut.push(<g key="a">{pastille(lerp(250, 180, lisse(t1)), up(lerp(125, 90, lisse(t1))), 'OsO₄', VIOLET, 19, '#f5f3ff')}</g>);
    else if (u < 0.6) {
      const dy = lerp(78, 62, lisse(t2));
      haut.push(<g key="b">{ligne(C2, [150, up(34)], VIOLET)}{ligne(C3, [210, up(34)], VIOLET)}{ligne([150, up(34)], [180, up(dy)], VIOLET)}{ligne([210, up(34)], [180, up(dy)], VIOLET)}
        {pastille(150, up(34), 'O', VIOLET, 9)}{pastille(210, up(34), 'O', VIOLET, 9)}{pastille(180, up(dy), 'Os', VIOLET, 12, '#f5f3ff')}
        {etiq(180, up(dy + 22), '(=O)₂', VIOLET, 11)}</g>);
    } else haut.push(<g key="c">{ligne(C2, [c2x, up(44)], VIOLET, 2.6)}{pastille(c2x, up(58), 'OH', VIOLET, 13)}{ligne(C3, [c3x, up(44)], VIOLET, 2.6)}{pastille(c3x, up(58), 'OH', VIOLET, 13)}
      {t3 < 0.95 && etiq(300, up(60), '+ H₂O', KIT.txt2, 11)}</g>);
  } else {
    haut.push(<g key="s"><rect x={96} y={up(112) - 6} width={168} height={12} rx={4} fill="#cbd5e1" stroke="#64748b" /><text x={274} y={up(112) + 4} fontSize={11} fontWeight="700" fill="#475569">Pd</text></g>);
    if (u < 0.6) {
      const dy = lerp(94, 70, lisse(seg(u, 0.3, 0.6)));
      haut.push(<g key="h">{ligne([c2x, up(106)], [c2x, up(dy + 8)], VERT, 1.6, '3 2')}{ligne([c3x, up(106)], [c3x, up(dy + 8)], VERT, 1.6, '3 2')}{pastille(c2x, up(dy), 'H', VERT, 9)}{pastille(c3x, up(dy), 'H', VERT, 9)}</g>);
    } else haut.push(<g key="c">{ligne(C2, [c2x, up(44)], VERT, 2.6)}{pastille(c2x, up(58), 'H', VERT, 10)}{ligne(C3, [c3x, up(44)], VERT, 2.6)}{pastille(c3x, up(58), 'H', VERT, 10)}</g>);
  }

  return (
    <svg viewBox="0 0 360 270" role="img" aria-label={`Animation en perspective : addition sur ${alc}`} style={{ width: '100%', height: hauteur, display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      <text x={8} y={m > 0 ? 16 : 262} fontSize={12} fill={KIT.txt2}>face d'attaque du réactif</text>
      <text x={8} y={m > 0 ? 262 : 16} fontSize={12} fill={KIT.txt2}>face opposée</text>
      {elements}{bas}{haut}
    </svg>);
}
