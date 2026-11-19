// Schémas de la simulation 142 (CO₂ dissous, TSTL PCM) : scènes (flacons gaz / eau), axe de prédominance, graphe de répartition, cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400, caractères Unicode pour les indices, tout le texte dans le viewBox.
import * as M from './co2DissousModele';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', eau: '#bae6fd', eauB: '#0284c7', gaz: '#f1f5f9' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const virg = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const nbKPa = P => P >= 10 ? virg(P, 0) : P >= 1 ? virg(P, 1) : virg(P, P < 0.1 ? 2 : 2);

// points répartis de façon régulière (suite de Kronecker) dans un rectangle
const points = (n, x0, y0, w, h, graine = 0) => Array.from({ length: n }, (_, i) => ({ x: x0 + 10 + (((i + graine) * 0.6180339) % 1) * (w - 20), y: y0 + 9 + (((i + graine) * 0.7548777 + 0.21) % 1) * (h - 18) }));

// ═════════ Scène : flacons fermés (gaz au-dessus d'une eau) ═════════
//  flacons : [{ P, c (mmol/L, pour le nombre de molécules dissoutes), ions (0 à 14, nombre d'ions HCO₃⁻ dessinés), titre, lignes: [{ texte, couleur }] }]
export function SceneCO2({ flacons }) {
  const n = flacons.length, petit = n > 2, cxs = n === 1 ? [200] : n === 2 ? [100, 300] : [50, 150, 250, 350], w = n === 1 ? 150 : n === 2 ? 130 : 78;
  const haut = petit ? 232 : 262, avecIons = flacons.some(f => f.ions > 0);
  return (
    <svg viewBox={`0 0 400 ${haut}`} style={base} role="img"
      aria-label={flacons.map(f => `${f.titre ?? ''} Gaz à ${nbKPa(f.P)} kilopascals de CO₂ au-dessus de l’eau. ${(f.lignes ?? []).map(l => l.texte).join(' ; ')}`).join(' — ')}>
      {flacons.map((f, k) => {
        const cx = cxs[k], x0 = cx - w / 2, yH = 40, yL = 84, yB = 160, nG = clamp(Math.round(2 + 4 * Math.log10(f.P / 0.04)), 2, 18), nL = clamp(Math.round(1 + 2.4 * Math.log10(Math.max(f.c, 0.0132) / 0.0132)), 1, 10);
        return (<g key={k}>
          {!petit && <text x={cx} y={f.T ? 17 : 24} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>P(CO₂) = {nbKPa(f.P)} kPa</text>}
          {!petit && f.T && <text x={cx} y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>{f.T} °C</text>}
          <rect x={x0} y={yH} width={w} height={yL - yH} fill={COL.gaz}/>
          <path d={`M ${x0} ${yL} H ${x0 + w} V ${yB - 12} q 0 12 -12 12 H ${x0 + 12} q -12 0 -12 -12 Z`} fill={COL.eau}/>
          <path d={`M ${x0} ${yH} V ${yB - 12} q 0 12 12 12 H ${x0 + w - 12} q 12 0 12 -12 V ${yH}`} fill="none" stroke={COL.gris} strokeWidth="3.5" strokeLinecap="round"/>
          <line x1={x0 - 4} y1={yH} x2={x0 + w + 4} y2={yH} stroke={COL.gris} strokeWidth="5" strokeLinecap="round"/>
          {points(nG, x0, yH, w, yL - yH).map((p, i) => <circle key={`g${i}`} cx={p.x} cy={p.y} r="4.5" fill={COL.encre}/>)}
          {points(nL, x0, yL, w, yB - yL, 3).map((p, i) => <circle key={`l${i}`} cx={p.x} cy={p.y} r="4.5" fill={COL.encre}/>)}
          {f.ions > 0 && points(f.ions, x0, yL, w, yB - yL, 9).map((p, i) => <circle key={`i${i}`} cx={p.x} cy={p.y} r="4.5" fill="#fb923c" stroke={COL.orange} strokeWidth="1.5"/>)}
          {(f.lignes ?? []).map((l, j) => { const pw = petit ? 84 : n === 1 ? 210 : 184, y = 172 + j * 34; return (<g key={j}>
            <rect x={cx - pw / 2} y={y} width={pw} height="28" rx="8" fill="white" stroke={l.couleur ?? COL.eauB} strokeWidth="2.5"/>
            <text x={cx} y={y + 20} textAnchor="middle" fontSize={petit ? 16 : 17} fontWeight="800" fill={COL.encre}>{l.texte}</text>
          </g>); })}
        </g>);
      })}
      <circle cx="14" cy={haut - 12} r="4.5" fill={COL.encre}/><text x="24" y={haut - 7} fontSize="16" fill={COL.encre}>CO₂</text>
      {avecIons && <g><circle cx="86" cy={haut - 12} r="4.5" fill="#fb923c" stroke={COL.orange} strokeWidth="1.5"/><text x="96" y={haut - 7} fontSize="16" fill={COL.encre}>HCO₃⁻</text></g>}
    </svg>);
}

// ═════════ Axe de pH avec repère rouge ; domaines de prédominance colorés si revele ═════════
export function SceneDiag({ pH, revele = false }) {
  const X = p => 24 + p * (352 / 14), y0 = 62, h = 40;
  return (
    <svg viewBox="0 0 400 156" style={base} role="img"
      aria-label={`Axe de pH de 0 à 14 avec pKa1 = 6,35 et pKa2 = 10,3. Repère rouge : pH ${virg(pH)}.${revele ? ' Domaines : CO₂,H₂O avant pKa1, HCO₃⁻ entre pKa1 et pKa2, CO₃²⁻ après pKa2.' : ''}`}>
      <text x={X(pH)} y="22" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.rouge}>pH = {virg(pH)}</text>
      <rect x={X(0)} y={y0} width={X(M.PKA1) - X(0)} height={h} fill={revele ? '#dbeafe' : '#f1f5f9'} stroke={COL.gris} strokeWidth="2"/>
      <rect x={X(M.PKA1)} y={y0} width={X(M.PKA2) - X(M.PKA1)} height={h} fill={revele ? '#ffedd5' : '#f1f5f9'} stroke={COL.gris} strokeWidth="2"/>
      <rect x={X(M.PKA2)} y={y0} width={X(14) - X(M.PKA2)} height={h} fill={revele ? '#dcfce7' : '#f1f5f9'} stroke={COL.gris} strokeWidth="2"/>
      {revele && <g fontSize="16" fontWeight="800" textAnchor="middle">
        <text x={(X(0) + X(M.PKA1)) / 2} y={y0 + 26} fill={COL.bleu}>CO₂,H₂O</text>
        <text x={(X(M.PKA1) + X(M.PKA2)) / 2} y={y0 + 26} fill={COL.orange}>HCO₃⁻</text>
        <text x={(X(M.PKA2) + X(14)) / 2} y={y0 + 26} fill={COL.vert}>CO₃²⁻</text>
      </g>}
      {!revele && <text x="200" y={y0 + 26} textAnchor="middle" fontSize="16" fill={COL.gris}>domaines à identifier</text>}
      <line x1={X(pH)} y1="30" x2={X(pH)} y2={y0 + h + 8} stroke={COL.rouge} strokeWidth="3.5"/>
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1={y0 + h} x2={X(p)} y2={y0 + h + 6} stroke={COL.gris} strokeWidth="2"/><text x={X(p)} y={y0 + h + 24} textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x={X(M.PKA1)} y="56" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>6,35</text>
      <text x={X(M.PKA2)} y="56" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>10,3</text>
      <text x="200" y="148" textAnchor="middle" fontSize="16" fill={COL.encre}>pKa1 = 6,35 et pKa2 = 10,3</text>
    </svg>);
}

// ═════════ Exploration : diagramme de distribution (fractions de CO₂,H₂O, HCO₃⁻, CO₃²⁻ selon le pH) ═════════
export function GrapheRepartition({ pH }) {
  const X0 = 48, X1 = 388, Y0 = 200, Y1 = 22, lx = p => X0 + p / 14 * (X1 - X0), ly = a => Y0 - a * (Y0 - Y1);
  const pts = M.courbeRepartition(), t = k => pts.map(p => `${lx(p.pH).toFixed(1)},${ly(p[k]).toFixed(1)}`).join(' '), al = M.repartition(pH);
  return (
    <svg viewBox="0 0 400 262" style={base} role="img"
      aria-label={`Diagramme de distribution des espèces du CO₂ dissous selon le pH de 0 à 14 : CO₂,H₂O majoritaire avant ${virg(M.PKA1, 2)}, HCO₃⁻ entre ${virg(M.PKA1, 2)} et ${virg(M.PKA2)}, CO₃²⁻ après. Au pH ${virg(pH, 1)} : CO₂,H₂O ${virg(100 * al[0], 1)} %, HCO₃⁻ ${virg(100 * al[1], 1)} %, CO₃²⁻ ${virg(100 * al[2], 1)} %.`}>
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={COL.gris} strokeWidth="1.5"/><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 4} stroke={COL.gris} strokeWidth="1.5"/>
      {[0, 0.5, 1].map(a => <g key={a}><line x1={X0 - 4} y1={ly(a)} x2={X1} y2={ly(a)} stroke="#e2e8f0"/><text x={X0 - 8} y={ly(a) + 5} textAnchor="end" fontSize="16" fill={COL.encre}>{a === 0 ? '0' : a === 1 ? '100 %' : '50 %'}</text></g>)}
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={lx(p)} y1={Y0} x2={lx(p)} y2={Y0 + 5} stroke={COL.gris}/><text x={lx(p)} y={Y0 + 22} textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x={(X0 + X1) / 2} y={Y0 + 48} textAnchor="middle" fontSize="16" fill={COL.encre}>pH</text>
      <polyline points={t('a0')} fill="none" stroke={COL.bleu} strokeWidth="3.5"/>
      <polyline points={t('a1')} fill="none" stroke={COL.orange} strokeWidth="3.5"/>
      <polyline points={t('a2')} fill="none" stroke={COL.vert} strokeWidth="3.5"/>
      <text x={lx(2.2)} y={ly(0.88)} fontSize="16" fontWeight="800" fill={COL.bleu}>CO₂,H₂O</text>
      <text x={lx(6.4)} y={ly(1) - 4} fontSize="16" fontWeight="800" fill={COL.orange}>HCO₃⁻</text>
      <text x={lx(11.4)} y={ly(0.88)} fontSize="16" fontWeight="800" fill={COL.vert}>CO₃²⁻</text>
      <line x1={lx(pH)} y1={Y1} x2={lx(pH)} y2={Y0} stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>
      <circle cx={lx(pH)} cy={ly(al[0])} r="5.5" fill="white" stroke={COL.bleu} strokeWidth="3"/>
      <circle cx={lx(pH)} cy={ly(al[1])} r="5.5" fill="white" stroke={COL.orange} strokeWidth="3"/>
      <circle cx={lx(pH)} cy={ly(al[2])} r="5.5" fill="white" stroke={COL.vert} strokeWidth="3"/>
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════

// A. Loi de Henry : [CO₂] proportionnelle à P ; a diminue quand T augmente
export function SvgHenry() {
  const ech = 9, lignes = [[20, 6.6], [60, 19.8]];
  return (
    <svg viewBox="0 0 400 252" style={base} role="img"
      aria-label="Loi de Henry : la concentration en CO₂ dissous est égale à a fois la pression partielle. À 25 degrés, 20 kilopascals donnent 6,6 millimoles par litre et 60 kilopascals en donnent 19,8, trois fois plus. Le coefficient a diminue quand la température augmente : un gaz est moins soluble à chaud.">
      <text x="200" y="26" textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.encre}>[CO₂] = a × P(CO₂)</text>
      {lignes.map(([P, c], i) => { const y = 46 + i * 46; return (<g key={P}>
        <text x="10" y={y + 21} fontSize="16" fontWeight="800" fill={COL.encre}>{P} kPa</text>
        <rect x="84" y={y} width={c * ech} height="28" fill="#fdba74" stroke={COL.orange} strokeWidth="2"/>
        <text x={84 + c * ech + 8} y={y + 21} fontSize="16" fill={COL.encre}>{virg(c)} mmol/L</text>
      </g>); })}
      <text x="200" y="152" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.vert}>pression × 3 ⇒ concentration × 3</text>
      <rect x="8" y="166" width="384" height="78" rx="10" fill="#f0f9ff" stroke={COL.eauB} strokeWidth="2"/>
      <text x="200" y="192" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>a diminue quand T augmente</text>
      <text x="200" y="218" textAnchor="middle" fontSize="16" fill={COL.encre}>un gaz est moins soluble à chaud</text>
      <text x="200" y="238" textAnchor="middle" fontSize="16" fill={COL.encre}>(a en mmol·L⁻¹·kPa⁻¹)</text>
    </svg>);
}

// B. Le CO₂ dissous est un acide faible
export function SvgAcide() {
  const X = p => 24 + p * 44;
  return (
    <svg viewBox="0 0 400 236" style={base} role="img"
      aria-label="Le dioxyde de carbone dissous réagit avec l’eau : CO₂,H₂O plus H₂O donne HCO₃⁻ plus H₃O⁺. Il libère des ions oxonium, donc l’eau en équilibre avec l’air est acide : son pH est d’environ 5,6, inférieur à 7, le pH de l’eau pure.">
      <rect x="8" y="8" width="384" height="84" rx="10" fill="#fff7ed" stroke="#fdba74" strokeWidth="2"/>
      <text x="200" y="36" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>CO₂ dissous : un acide faible</text>
      <text x="200" y="70" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>CO₂,H₂O + H₂O ⇌ HCO₃⁻ + <tspan fill={COL.rouge}>H₃O⁺</tspan></text>
      <text x="200" y="118" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>plus de CO₂ ⇒ plus de H₃O⁺ ⇒ pH plus bas</text>
      <line x1="24" y1="176" x2="376" y2="176" stroke={COL.gris} strokeWidth="2"/>
      {[0, 2, 4, 6, 8].map(p => <g key={p}><line x1={X(p)} y1="176" x2={X(p)} y2="183" stroke={COL.gris} strokeWidth="2"/><text x={X(p)} y="204" textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <circle cx={X(7)} cy="176" r="7" fill="white" stroke={COL.eauB} strokeWidth="3.5"/>
      <text x={X(7)} y="148" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.eauB}>eau pure : 7</text>
      <circle cx={X(5.6)} cy="176" r="7" fill={COL.rouge}/>
      <text x={X(5.6) - 6} y="148" textAnchor="end" fontSize="16" fontWeight="800" fill={COL.rouge}>air : 5,6</text>
      <text x="394" y="230" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
    </svg>);
}

// C. Deux couples, trois espèces, trois domaines de prédominance ; HCO₃⁻ est un ampholyte
export function SvgPredo() {
  const X = p => 24 + p * (352 / 14), y0 = 112, h = 40;
  return (
    <svg viewBox="0 0 400 252" style={base} role="img"
      aria-label="Deux couples : CO₂,H₂O sur HCO₃⁻ de pKa 6,35 et HCO₃⁻ sur CO₃²⁻ de pKa 10,3 ; HCO₃⁻ est un ampholyte, base du premier couple et acide du second. Axe de pH : CO₂,H₂O prédomine avant 6,35, HCO₃⁻ entre 6,35 et 10,3, CO₃²⁻ après 10,3. À pH égal au pKa, les deux formes du couple ont la même concentration.">
      <text x="100" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.bleu}>CO₂,H₂O</text>
      <text x="200" y="26" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>⇌</text>
      <text x="262" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>HCO₃⁻</text>
      <text x="320" y="26" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>⇌</text>
      <text x="372" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>CO₃²⁻</text>
      <text x="170" y="50" textAnchor="middle" fontSize="16" fill={COL.encre}>pKa1 = 6,35</text>
      <text x="326" y="50" textAnchor="middle" fontSize="16" fill={COL.encre}>pKa2 = 10,3</text>
      <text x="262" y="76" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>ampholyte</text>
      <rect x={X(0)} y={y0} width={X(M.PKA1) - X(0)} height={h} fill="#dbeafe" stroke={COL.gris} strokeWidth="2"/>
      <rect x={X(M.PKA1)} y={y0} width={X(M.PKA2) - X(M.PKA1)} height={h} fill="#ffedd5" stroke={COL.gris} strokeWidth="2"/>
      <rect x={X(M.PKA2)} y={y0} width={X(14) - X(M.PKA2)} height={h} fill="#dcfce7" stroke={COL.gris} strokeWidth="2"/>
      <text x={(X(0) + X(M.PKA1)) / 2} y={y0 + 26} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.bleu}>CO₂,H₂O</text>
      <text x={(X(M.PKA1) + X(M.PKA2)) / 2} y={y0 + 26} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>HCO₃⁻</text>
      <text x={(X(M.PKA2) + X(14)) / 2} y={y0 + 26} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>CO₃²⁻</text>
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1={y0 + h} x2={X(p)} y2={y0 + h + 6} stroke={COL.gris} strokeWidth="2"/><text x={X(p)} y={y0 + h + 24} textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x={X(M.PKA1)} y="106" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>6,35</text>
      <text x={X(M.PKA2)} y="106" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>10,3</text>
      <rect x="8" y="204" width="384" height="40" rx="8" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <text x="200" y="230" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>pH = pKa : les deux formes à 50 %</text>
    </svg>);
}

// D. pH de l'eau en équilibre avec un gaz : pH = ½ (pKa1 − log [CO₂]) ; ×100 sur P = −1 unité de pH
export function SvgPHGaz() {
  const X = p => 24 + p * 100;
  return (
    <svg viewBox="0 0 400 238" style={base} role="img"
      aria-label="Le pH de l’eau en équilibre avec le gaz vaut un demi de pKa1 moins log de la concentration en CO₂. Exemple à 25 degrés : à 1 kilopascal le pH vaut 4,9 ; à 100 kilopascals, pression multipliée par 100, il vaut 3,9 : une unité de pH de moins.">
      <text x="200" y="28" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>pH = ½ (pKa1 − log [CO₂])</text>
      <line x1="24" y1="140" x2="376" y2="140" stroke={COL.gris} strokeWidth="2"/>
      {[3, 4, 5, 6].map(p => <g key={p}><line x1={X(p - 3)} y1="140" x2={X(p - 3)} y2="147" stroke={COL.gris} strokeWidth="2"/><text x={X(p - 3)} y="168" textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <circle cx={X(1.9)} cy="140" r="7" fill="white" stroke={COL.orange} strokeWidth="3.5"/>
      <text x={X(1.9)} y="112" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>1 kPa : 4,9</text>
      <circle cx={X(0.9)} cy="140" r="7" fill={COL.rouge}/>
      <text x={X(0.9) - 4} y="112" textAnchor="end" fontSize="16" fontWeight="800" fill={COL.rouge}>100 kPa : 3,9</text>
      <path d={`M ${X(1.9) - 12} 82 H ${X(0.9) + 12}`} stroke={COL.rouge} strokeWidth="4"/>
      <path d={`M ${X(0.9) + 2} 82 l 13 -8 v 16 z`} fill={COL.rouge}/>
      <text x="200" y="66" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>pression × 100 : pH − 1 unité</text>
      <text x="394" y="196" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
      <text x="200" y="224" textAnchor="middle" fontSize="16" fill={COL.encre}>plus de CO₂ dans le gaz, eau plus acide</text>
    </svg>);
}

// E. Solubilité apparente du CO₂ selon le pH du milieu (échelle logarithmique du rapport C_T / [CO₂])
export function SvgSolub() {
  const phs = [3, 6, 8, 10], ech = 52, x0 = 80;
  const val = pH => M.milieu(0.4, 25, pH).solub, txt = r => r >= 1000 ? `≈ ${virg(M.arrondiCS(r, 2) / 1000, 1)} × 10³` : r >= 10 ? virg(M.arrondiCS(r, 2), 0) : virg(M.arrondiCS(r, 2), 1);
  return (
    <svg viewBox="0 0 400 262" style={base} role="img"
      aria-label="Rapport du carbone inorganique dissous total à la concentration en CO₂ moléculaire, selon le pH du milieu, à pression égale : environ 1 à pH 3, 1,4 à pH 6, 46 à pH 8 et plus de 6 000 à pH 10. Plus le milieu est basique, plus il peut contenir de carbone dissous.">
      <text x="200" y="22" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>carbone dissous total ÷ CO₂ moléculaire</text>
      {phs.map((pH, i) => { const r = val(pH), y = 42 + i * 44, l = Math.max(Math.log10(r) * ech, 5); return (<g key={pH}>
        <text x="10" y={y + 21} fontSize="16" fontWeight="800" fill={COL.encre}>pH {pH}</text>
        <rect x={x0} y={y} width={l} height="28" fill={pH >= 8 ? '#fb923c' : '#93c5fd'} stroke={pH >= 8 ? COL.orange : COL.bleu} strokeWidth="2"/>
        <text x={x0 + l + 8} y={y + 21} fontSize="16" fill={COL.encre}>{txt(r)}</text>
      </g>); })}
      <text x="200" y="238" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>milieu plus basique ⇒ plus de CO₂ dissous</text>
      <text x="200" y="256" textAnchor="middle" fontSize="16" fill={COL.gris}>(longueur de barre : échelle logarithmique)</text>
    </svg>);
}
