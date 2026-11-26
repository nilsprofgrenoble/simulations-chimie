// Cartes « À retenir » de la simulation 311 (hydroxydes, pH, fenêtre de séparation). viewBox de 300 de large, textes de 12,5 à 16, maxWidth 320.
import { K, T, svgStyle } from "./schemaOutils";
import * as M from "./hydModele";

const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const C = M.CATS;
const xp = (p, x0 = 20, x1 = 280) => x0 + p / 14 * (x1 - x0);
const barre = (key, cat, c, y, h = 16, x0 = 20, x1 = 280) => {
  const a = xp(M.phDebut(cat, c), x0, x1), b = xp(M.phFin(cat), x0, x1);
  return (<g key={key}><rect x={x0} y={y} width={x1 - x0} height={h} rx="4" fill="#f1f5f9" stroke="#cbd5e1"/>
    <rect x={a} y={y} width={Math.max(2, b - a)} height={h} rx="3" fill={cat.colS} stroke={cat.col} strokeWidth="1.3"/>
    <rect x={b} y={y} width={Math.max(0, x1 - b)} height={h} rx="3" fill={cat.col} opacity="0.2"/></g>);
};
const axe = (y, x0 = 20, x1 = 280) => (<g><line x1={x0} x2={x1} y1={y} y2={y} stroke="#334155" strokeWidth="1.6"/>
  {[0, 2, 4, 6, 8, 10, 12, 14].map(v => <g key={v}><line x1={xp(v, x0, x1)} x2={xp(v, x0, x1)} y1={y} y2={y + 5} stroke="#334155"/><text x={xp(v, x0, x1)} y={y + 18} textAnchor="middle" fontSize="12" fill="#334155">{v}</text></g>)}</g>);

// Carte 1 : pH de début de précipitation d'un hydroxyde
export function SvgSeuilCarte() {
  const Ni = C.Ni, oh = M.ohSeuil(Ni, 0.01);
  return cadre('Pour un hydroxyde M(OH)n : Ks est le produit de la concentration de l’ion métallique et de la concentration en HO moins à la puissance n ; on en déduit la concentration en HO moins de début de précipitation, puis le pH par pH égale 14 plus log de HO moins', 234, <g>
    <text x="150" y="30" textAnchor="middle" fontSize="15" fontWeight="700" fill={K.txt}>M(OH)ₙ(s) ⇌ Mⁿ⁺ + n HO⁻</text>
    <rect x="22" y="42" width="256" height="34" rx="9" fill="#fff" stroke={K.bleu} strokeWidth="2"/>
    <text x="150" y="65" textAnchor="middle" fontSize="15" fontWeight="800" fill={K.txt}>Ks = [Mⁿ⁺] × [HO⁻]ⁿ</text>
    <path d="M150 80 L150 94 M144 90 L150 96 L156 90" stroke="#334155" strokeWidth="2" fill="none"/>
    <text x="150" y="116" textAnchor="middle" fontSize="15" fontWeight="800" fill={K.txt}>[HO⁻] = ⁿ√(Ks ÷ c)</text>
    <path d="M150 122 L150 134 M144 130 L150 136 L156 130" stroke="#334155" strokeWidth="2" fill="none"/>
    <rect x="62" y="140" width="176" height="30" rx="8" fill="#fff" stroke="#dc2626" strokeWidth="2"/>
    <text x="150" y="161" textAnchor="middle" fontSize="15" fontWeight="800" fill="#dc2626">pH = 14 + log [HO⁻]</text>
    <text x="150" y="192" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">Exemple : {Ni.solide} à 0,010 mol/L</text>
    <text x="150" y="212" textAnchor="middle" fontSize="12.5" fill={K.txt}>[HO⁻] = √({M.sciNb(Ni.Ks / 0.01, 1)}) ≈ {M.sciNb(oh, 1)} → pH ≈ {M.phTxt(M.phDebut(Ni, 0.01))}</text>
  </g>);
}

// Carte 2 : concentration de l'ion en fonction du pH, début et fin de précipitation (convention 1,0×10⁻⁵)
export function SvgFinCarte() {
  const x0 = 48, x1 = 282, y0 = 66, y1 = 180;               // zone du graphe : pH 2 → 12, log c −2 → −7
  const X = p => x0 + (p - 2) / 10 * (x1 - x0), Y = lc => y0 + (-2 - lc) / 5 * (y1 - y0);
  const courbe = cat => { const d = M.phDebut(cat, 0.01), pts = [`${X(2)},${Y(-2)}`, `${X(d).toFixed(1)},${Y(-2)}`]; for (let p = d; p <= 12.001; p += 0.1) { const lc = Math.log10(M.restant(cat, 0.01, p)); if (lc <= -7) { pts.push(`${X(d + (-2 - -7) / cat.n).toFixed(1)},${Y(-7).toFixed(1)}`); break; } pts.push(`${X(p).toFixed(1)},${Y(lc).toFixed(1)}`); } return pts.join(' '); };
  return cadre('Concentration restante en ions métalliques selon le pH : constante jusqu’au pH de début de précipitation, puis elle diminue avec une pente égale à moins n ; la précipitation est dite quasi totale quand elle atteint 1,0 fois 10 puissance moins 5 mol par litre', 244, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="13" fontWeight="800" fill={K.txt}>Ions restants selon le pH</text>
    <text x="70" y="48" textAnchor="start" fontSize="13" fontWeight="800" fill={C.Cr.col}>━ Cr³⁺ (n = 3)</text><text x="172" y="48" textAnchor="start" fontSize="13" fontWeight="800" fill={C.Ni.col}>━ Ni²⁺ (n = 2)</text>
    <line x1={x0} x2={x0} y1={y0 - 6} y2={y1} stroke="#334155" strokeWidth="1.6"/><line x1={x0} x2={x1} y1={y1} y2={y1} stroke="#334155" strokeWidth="1.6"/>
    <text x={x0 - 5} y={Y(-2) + 4} textAnchor="end" fontSize="12" fill="#334155">10⁻²</text><text x={x0 - 5} y={Y(-7) + 4} textAnchor="end" fontSize="12" fill="#334155">10⁻⁷</text>
    <line x1={x0} x2={x1} y1={Y(-5)} y2={Y(-5)} stroke="#b45309" strokeWidth="1.6" strokeDasharray="5 4"/>
    <text x={x0 + 6} y={Y(-5) + 15} fontSize="12.5" fontWeight="700" fill="#b45309">quasi total</text>
    <text x={x0 + 6} y={Y(-5) + 30} fontSize="12.5" fontWeight="700" fill="#b45309">10⁻⁵ mol/L</text>
    <polyline points={courbe(C.Cr)} fill="none" stroke={C.Cr.col} strokeWidth="2.8" strokeLinejoin="round"/>
    <polyline points={courbe(C.Ni)} fill="none" stroke={C.Ni.col} strokeWidth="2.8" strokeLinejoin="round"/>
    {[2, 4, 6, 8, 10, 12].map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={y1} y2={y1 + 5} stroke="#334155"/><text x={X(v)} y={y1 + 18} textAnchor="middle" fontSize="12" fill="#334155">{v}</text></g>)}
    <text x={x1} y={y1 + 34} textAnchor="end" fontSize="12.5" fontWeight="700" fill="#334155">pH</text>
    <text x="150" y="232" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">plus n est grand, plus la chute est raide</text>
  </g>);
}

// Carte 3 : fenêtre de séparation, trois cas
export function SvgFenetreCarte() {
  const cas = [['Cr³⁺ et Ni²⁺', C.Cr, C.Ni, 'fenêtre nette', '#15803d'], ['Ni²⁺ et Mn²⁺', C.Ni, C.Mn, 'fenêtre trop étroite', '#b45309'], ['Mn²⁺ et Mg²⁺', C.Mn, C.Mg, 'zones qui se chevauchent', '#b91c1c']];
  return cadre('Séparer deux cations par le pH : il faut un pH entre la fin de précipitation du premier et le début du second ; trois cas : fenêtre nette pour le chrome et le nickel, fenêtre trop étroite pour le nickel et le manganèse, chevauchement pour le manganèse et le magnésium', 270, <g>
    <text x="150" y="24" textAnchor="middle" fontSize="13" fontWeight="800" fill={K.txt}>fenêtre = de la fin du 1er au début du 2e</text>
    {cas.map(([t, a, b, v, col], i) => { const y = 40 + i * 62; const w = M.fenetre(a, 0.01, b, 0.01);
      return (<g key={t}><text x="20" y={y + 10} fontSize="12.5" fontWeight="700" fill={K.txt}>{t}</text><text x="280" y={y + 10} textAnchor="end" fontSize="12.5" fontWeight="800" fill={col}>{v}</text>
        {barre('a', a, 0.01, y + 16, 12)}{barre('b', b, 0.01, y + 31, 12)}
        {w.ok && <rect x={xp(w.lo)} y={y + 14} width={Math.max(3, xp(w.hi) - xp(w.lo))} height="31" fill={w.pratique ? '#22c55e' : '#f59e0b'} opacity="0.3" stroke={col} strokeDasharray="3 2"/>}</g>); })}
    {axe(228)}
  </g>);
}

// Carte 4 : pièges et effet de la concentration
export function SvgPiegeHydCarte() {
  const Ni = C.Ni, a = M.phDebut(Ni, 0.01), b = M.phDebut(Ni, 0.001);
  return cadre('Pièges classiques : confondre pOH et pH, oublier la racine d’ordre n, oublier de diviser Ks par la concentration ; diluer dix fois une solution de nickel fait monter le pH de début de précipitation de un demi', 240, <g>
    <text x="150" y="26" textAnchor="middle" fontSize="13" fontWeight="800" fill={K.txt}>Trois pièges à éviter</text>
    {[['pH ≠ pOH', 'pH = 14 − pOH, avec pOH = −log [HO⁻]'], ['racine d’ordre n', 'Ks = c × [HO⁻]ⁿ : n = 2 → √, n = 3 → ∛'], ['diviser Ks par c', '[HO⁻] = ⁿ√(Ks ÷ c), pas ⁿ√Ks']].map(([t, s], i) => { const y = 38 + i * 44;
      return (<g key={t}><rect x="16" y={y} width="268" height="38" rx="9" fill="#fff" stroke="#fecaca"/><text x="28" y={y + 16} fontSize="12.5" fontWeight="800" fill="#b91c1c">✗ {t}</text><text x="28" y={y + 32} fontSize="12" fill={K.txt}>{s}</text></g>); })}
    <text x="150" y="186" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#15803d">Plus c’est dilué, plus le pH de début monte</text>
    <text x="150" y="206" textAnchor="middle" fontSize="12.5" fill={K.txt}>{Ni.solide} à 0,010 mol/L : pH {M.phTxt(a)}</text>
    <text x="150" y="224" textAnchor="middle" fontSize="12.5" fill={K.txt}>à 0,0010 mol/L : pH {M.phTxt(b)} (+ 1 ÷ n = 0,5)</text>
  </g>);
}
