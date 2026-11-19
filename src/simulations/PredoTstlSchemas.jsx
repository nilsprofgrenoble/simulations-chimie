// Schémas de la simulation 139 (pH = pKa + log, diagramme de prédominance, indicateur coloré, TSTL PCM) : scène, graphe de répartition et cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400 (≥ 14 pour la scène), caractères Unicode pour les indices, tout le texte dans le viewBox.
import * as M from './predoTstlModele';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fondB: '#dbeafe', fondO: '#ffedd5', bordB: '#93c5fd', bordO: '#fdba74' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const virg = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const pct = f => { const p = Math.round(f * 100); return p === 0 && f > 0 ? '< 1 %' : p === 100 && f < 1 ? '> 99 %' : `${p} %`; };

// Axe de pH de 0 à 14 : zone de l'acide (bleu, à gauche du pKa), zone de la base (orange, à droite) si `zones`, repère rouge du pH courant (si pH ≠ null)
function AxePH({ x0, x1, y, pKa, pH, zones, pKaVisible }) {
  const X = p => x0 + (p / 14) * (x1 - x0), fs = 16;
  return (
    <g>
      {zones && pKaVisible
        ? <g><rect x={X(0)} y={y} width={X(pKa) - X(0)} height="22" fill={COL.fondB} stroke={COL.bordB}/><rect x={X(pKa)} y={y} width={X(14) - X(pKa)} height="22" fill={COL.fondO} stroke={COL.bordO}/></g>
        : <rect x={X(0)} y={y} width={X(14) - X(0)} height="22" fill="#f1f5f9" stroke="#cbd5e1"/>}
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1={y + 22} x2={X(p)} y2={y + 28} stroke={COL.gris}/><text x={X(p)} y={y + 44} textAnchor="middle" fontSize={fs} fill={COL.encre}>{p}</text></g>)}
      {pKaVisible && <g><line x1={X(pKa)} y1={y - 4} x2={X(pKa)} y2={y + 26} stroke={COL.encre} strokeWidth="2.5"/>
        <text x={X(pKa)} y={y - 8} textAnchor="middle" fontSize={fs} fontWeight="800" fill={COL.encre}>pKa = {virg(pKa)}</text></g>}
      {pH !== null && <g><line x1={X(pH)} y1={y - 2} x2={X(pH)} y2={y + 24} stroke={COL.rouge} strokeWidth="3"/><circle cx={X(pH)} cy={y + 11} r="6" fill={COL.rouge} stroke="white" strokeWidth="1.5"/></g>}
    </g>);
}

// ═════════ Scène : axe de pH (acide/base de part et d'autre du pKa), barres de concentrations, tube d'indicateur ═════════
export function ScenePredo({ coupleId, pH, C, barres, zones = true, pKaVisible = true }) {
  const c = M.COUPLES[coupleId], ind = coupleId === 'ind', pHm = pH ?? c.pKa, e = M.etat(coupleId, pHm, C);
  const hmax = 100, y0 = 224, hA = Math.max(e.AH / C * hmax, e.AH > 0 ? 1.5 : 0), hB = Math.max(e.A / C * hmax, e.A > 0 ? 1.5 : 0);
  const xa = ind ? 60 : 90, xb = ind ? 170 : 230, zonesOk = zones && pKaVisible;
  return (
    <svg viewBox="0 0 400 262" style={base} role="img"
      aria-label={`Axe de pH de 0 à 14.${pKaVisible ? ` Le pKa du couple vaut ${virg(c.pKa)}.` : ''}${pH === null ? '' : ` Le repère rouge indique pH = ${virg(pH, 2)}.`}${zonesOk ? ` Sous le pKa l’acide ${c.AH} prédomine, au-dessus la base ${c.A}.` : ''}${barres ? ` Barres : ${c.AH} ${pct(e.AH / C)} et ${c.A} ${pct(e.A / C)} de la quantité totale.` : ''}`}>
      <AxePH x0={22} y={36} x1={378} pKa={c.pKa} pH={pH} zones={zones} pKaVisible={pKaVisible}/>
      {zonesOk && <g>
        <text x="22" y="108" fontSize="16" fill={COL.bleu} fontWeight="700">{c.AH} prédomine</text>
        <text x="378" y="108" textAnchor="end" fontSize="16" fill={COL.orange} fontWeight="700">{c.A} prédomine</text>
      </g>}
      {pH !== null && <text x="200" y="126" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.rouge}>pH = {virg(pH, 2)}</text>}
      {barres ? <g>
        <line x1="30" y1={y0} x2={ind ? 280 : 370} y2={y0} stroke={COL.gris} strokeWidth="1.5"/>
        <rect x={xa} y={y0 - hA} width="70" height={hA} fill="#60a5fa" stroke={COL.bleu} strokeWidth="2"/>
        <rect x={xb} y={y0 - hB} width="70" height={hB} fill="#fb923c" stroke={COL.orange} strokeWidth="2"/>
        <text x={xa + 35} y={y0 + 18} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.bleu}>{c.AH}</text>
        <text x={xb + 35} y={y0 + 18} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.orange}>{c.A}</text>
        <text x={xa + 35} y={y0 - hA - 6} textAnchor="middle" fontSize="16" fill={COL.encre}>{pct(e.AH / C)}</text>
        <text x={xb + 35} y={y0 - hB - 6} textAnchor="middle" fontSize="16" fill={COL.encre}>{pct(e.A / C)}</text>
      </g> : !ind && <text x="200" y="190" textAnchor="middle" fontSize="16" fill={COL.gris}>pH imposé à la solution</text>}
      {ind && <g>
        <path d="M 306 142 v 78 q 0 14 14 14 h 30 q 14 0 14 -14 v -78 z" fill={M.couleurIndicateur(e.fb)} stroke={COL.gris} strokeWidth="2.5"/>
        <rect x="304" y="138" width="62" height="6" fill="white" stroke={COL.gris}/>
        <text x="335" y="256" textAnchor="middle" fontSize="16" fill={COL.encre}>solution</text>
      </g>}
    </svg>);
}

// ═════════ Exploration : répartition (en %) des deux formes du couple en fonction du pH ═════════
export function GrapheRepartition({ coupleId, pH }) {
  const c = M.COUPLES[coupleId], X0 = 44, X1 = 384, Y0 = 200, Y1 = 22;
  const lx = p => X0 + p / 14 * (X1 - X0), ly = f => Y0 - f * (Y0 - Y1);
  const pts = g => { const t = []; for (let k = 0; k <= 140; k++) { const p = k / 10; t.push(`${lx(p).toFixed(1)},${ly(g(p, c.pKa)).toFixed(1)}`); } return t.join(' '); };
  return (
    <svg viewBox="0 0 400 262" style={base} role="img"
      aria-label={`Proportion de ${c.AH} (courbe bleue, décroissante) et de ${c.A} (courbe orange, croissante) en fonction du pH ; elles se coupent à 50 pour cent au pH égal au pKa (${virg(c.pKa)}). Repère : pH = ${virg(pH, 2)}.`}>
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={COL.gris} strokeWidth="1.5"/><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 4} stroke={COL.gris} strokeWidth="1.5"/>
      {[0, 0.5, 1].map(f => <g key={f}><line x1={X0 - 4} y1={ly(f)} x2={X1} y2={ly(f)} stroke="#e2e8f0"/><text x={X0 - 7} y={ly(f) + 5} textAnchor="end" fontSize="16" fill={COL.encre}>{f * 100}</text></g>)}
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={lx(p)} y1={Y0} x2={lx(p)} y2={Y0 + 5} stroke={COL.gris}/><text x={lx(p)} y={Y0 + 20} textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x={(X0 + X1) / 2} y={Y0 + 42} textAnchor="middle" fontSize="16" fill={COL.encre}>pH</text>
      <text x="4" y="14" fontSize="16" fontWeight="700" fill={COL.encre}>%</text>
      <polyline points={pts(M.fracAcide)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
      <polyline points={pts(M.fracBase)} fill="none" stroke={COL.orange} strokeWidth="3.5" strokeLinejoin="round"/>
      <line x1={lx(c.pKa)} y1={ly(0.5)} x2={lx(c.pKa)} y2={Y0} stroke={COL.gris} strokeDasharray="4 4"/>
      <text x={lx(c.pKa) + (c.pKa > 10 ? -6 : 6)} y={Y1 + 16} textAnchor={c.pKa > 10 ? 'end' : 'start'} fontSize="16" fill={COL.gris}>pKa = {virg(c.pKa)}</text>
      <line x1={lx(pH)} y1={Y1} x2={lx(pH)} y2={Y0} stroke={COL.rouge} strokeWidth="2.5"/>
      <circle cx={lx(pH)} cy={ly(M.fracAcide(pH, c.pKa))} r="6" fill="white" stroke={COL.bleu} strokeWidth="3"/>
      <circle cx={lx(pH)} cy={ly(M.fracBase(pH, c.pKa))} r="6" fill="white" stroke={COL.orange} strokeWidth="3"/>
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════

// A. Diagramme de prédominance (exemple : acide propanoïque, pKa 4,9)
export function SvgPredo() {
  const X = p => 20 + p / 8 * 360, pKa = 4.9;
  return (
    <svg viewBox="0 0 400 190" style={base} role="img"
      aria-label="Diagramme de prédominance du couple acide propanoïque, base conjuguée : à gauche de pKa égal 4,9, l’acide prédomine ; à droite, la base prédomine ; au pKa, les deux ont la même concentration.">
      <rect x={X(0)} y="48" width={X(pKa) - X(0)} height="40" fill={COL.fondB} stroke={COL.bordB} strokeWidth="2"/>
      <rect x={X(pKa)} y="48" width={X(8) - X(pKa)} height="40" fill={COL.fondO} stroke={COL.bordO} strokeWidth="2"/>
      <text x={(X(0) + X(pKa)) / 2} y="74" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.bleu}>AH</text>
      <text x={(X(pKa) + X(8)) / 2} y="74" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.orange}>A⁻</text>
      <line x1={X(pKa)} y1="38" x2={X(pKa)} y2="98" stroke={COL.encre} strokeWidth="3"/>
      <text x={X(pKa)} y="28" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>pKa = 4,9</text>
      {[0, 2, 4, 6, 8].map(p => <g key={p}><line x1={X(p)} y1="88" x2={X(p)} y2="96" stroke={COL.gris} strokeWidth="2"/><text x={X(p)} y="116" textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x="394" y="140" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
      <text x="8" y="140" fontSize="16" fill={COL.bleu} fontWeight="700">pH &lt; pKa : AH</text>
      <text x="8" y="164" fontSize="16" fill={COL.orange} fontWeight="700">pH &gt; pKa : A⁻</text>
      <text x="394" y="176" textAnchor="end" fontSize="16" fill={COL.encre} fontWeight="700">pH = pKa : [AH] = [A⁻]</text>
    </svg>);
}

// B. pH = pKa + log([A⁻]/[AH]) : trois lignes (rapport 1, 10, 0,1)
function Frac({ x, y, h = 16 }) {
  return (<g>
    <text x={x} y={y - 4} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>[A⁻]</text>
    <line x1={x - 24} y1={y} x2={x + 24} y2={y} stroke={COL.encre} strokeWidth="2"/>
    <text x={x} y={y + h} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>[AH]</text>
  </g>);
}
export function SvgRelation() {
  const lignes = [['1', '0', 'pH = pKa'], ['10', '1', 'pH = pKa + 1'], ['0,1', '−1', 'pH = pKa − 1']];
  return (
    <svg viewBox="0 0 400 244" style={base} role="img"
      aria-label="Tableau : rapport de [A⁻] sur [AH] égal 1, logarithme 0, pH égal pKa ; rapport 10, logarithme 1, pH égal pKa plus 1 ; rapport 0,1, logarithme moins 1, pH égal pKa moins 1.">
      <Frac x={62} y={26}/>
      <text x="196" y="32" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>log</text>
      <text x="306" y="32" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>pH</text>
      {lignes.map(([r, l, p], i) => { const y = 58 + i * 48; return (
        <g key={r}>
          <rect x="8" y={y} width="384" height="40" rx="8" fill={i === 0 ? '#f0fdf4' : '#f8fafc'} stroke={i === 0 ? COL.vert : '#cbd5e1'} strokeWidth="2"/>
          <text x="62" y={y + 27} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.bleu}>{r}</text>
          <text x="196" y={y + 27} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.orange}>{l}</text>
          <text x="306" y={y + 27} textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>{p}</text>
        </g>); })}
      <text x="40" y="226" fontSize="16" fontWeight="700" fill={COL.encre}>pH = pKa + log</text>
      <Frac x={206} y={222}/>
    </svg>);
}

// C. Règle des dizaines : pH − pKa = −2, −1, 0, +1, +2 → proportions de A⁻ (1, 9, 50, 91, 99 %)
export function SvgDizaines() {
  const cols = [[-2, '−2'], [-1, '−1'], [0, '0'], [1, '+1'], [2, '+2']];
  return (
    <svg viewBox="0 0 400 252" style={base} role="img"
      aria-label="Cinq colonnes selon pH moins pKa égal moins 2, moins 1, 0, plus 1, plus 2 : la base représente environ 1, 9, 50, 91 et 99 pour cent du couple ; le reste est l’acide.">
      <text x="200" y="22" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>pH − pKa</text>
      {cols.map(([d, t], i) => { const fb = M.fracBase(d, 0), x = 18 + i * 76, h = 140, hb = fb * h; return (
        <g key={d}>
          <rect x={x} y={60} width="58" height={h - hb} fill="#60a5fa" stroke={COL.bleu} strokeWidth="1.5"/>
          <rect x={x} y={60 + h - hb} width="58" height={hb} fill="#fb923c" stroke={COL.orange} strokeWidth="1.5"/>
          <text x={x + 29} y="46" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>{t}</text>
          <text x={x + 29} y="222" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>{Math.round(fb * 100)} %</text>
        </g>); })}
      <text x="200" y="244" textAnchor="middle" fontSize="16" fill={COL.encre}>part de A⁻ (orange) ; AH en bleu</text>
    </svg>);
}

// D. Indicateur coloré : teinte sensible entre pKa − 1 et pKa + 1 (indicateur fictif, pKa 5,4)
export function SvgIndicateur() {
  const X = p => 20 + (p - 3.4) / 4 * 360, pKa = 5.4, bandes = [];
  for (let i = 0; i < 60; i++) { const p = 3.4 + (i + 0.5) / 60 * 4; bandes.push(<rect key={i} x={X(3.4) + i * 6} y="44" width="6.2" height="42" fill={M.couleurIndicateur(M.fracBase(p, pKa))}/>); }
  return (
    <svg viewBox="0 0 400 200" style={base} role="img"
      aria-label="Bande de teintes d’un indicateur coloré de pKa 5,4 : jaune (forme acide) pour un pH inférieur à 4,4, violet (forme basique) pour un pH supérieur à 6,4, teinte intermédiaire (mélange) entre les deux.">
      {bandes}
      <rect x={X(3.4)} y="44" width="360" height="42" fill="none" stroke={COL.gris} strokeWidth="2"/>
      {[4.4, 5.4, 6.4].map(p => <g key={p}><line x1={X(p)} y1="38" x2={X(p)} y2="96" stroke={COL.encre} strokeWidth="2.5" strokeDasharray="5 4"/><text x={X(p)} y="116" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>{virg(p)}</text></g>)}
      <text x={X(4.4)} y="140" textAnchor="middle" fontSize="16" fill={COL.encre}>pKa − 1</text>
      <text x={X(5.4)} y="140" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>pKa</text>
      <text x={X(6.4)} y="140" textAnchor="middle" fontSize="16" fill={COL.encre}>pKa + 1</text>
      <text x="26" y="30" fontSize="16" fontWeight="800" fill="#a16207">HInd : jaune</text>
      <text x="374" y="30" textAnchor="end" fontSize="16" fontWeight="800" fill="#6d28d9">Ind⁻ : violet</text>
      <text x="200" y="172" textAnchor="middle" fontSize="16" fill={COL.encre}>entre pKa − 1 et pKa + 1 :</text>
      <text x="200" y="193" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>on voit un mélange des deux teintes</text>
    </svg>);
}

// E. Déterminer un pKa par spectrophotométrie : A(pH) en S, la demi-hauteur donne pH = pKa
export function SvgPKaSpectro() {
  const X0 = 52, X1 = 384, Y0 = 170, Y1 = 28, pKa = 5.4, X = p => X0 + (p - 3) / 5 * (X1 - X0), Y = a => Y0 - a * (Y0 - Y1);
  const t = []; for (let k = 0; k <= 50; k++) { const p = 3 + k / 10; t.push(`${X(p).toFixed(1)},${Y(M.fracBase(p, pKa)).toFixed(1)}`); }
  return (
    <svg viewBox="0 0 400 244" style={base} role="img"
      aria-label="Courbe en S de l’absorbance en fonction du pH : elle atteint la moitié de sa valeur maximale au pH égal au pKa, soit 5,4 ; la ligne en pointillés du haut est l’absorbance maximale, quand tout l’indicateur est sous forme basique.">
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={COL.gris} strokeWidth="1.5"/><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 6} stroke={COL.gris} strokeWidth="1.5"/>
      {[3, 4, 5, 6, 7, 8].map(p => <g key={p}><line x1={X(p)} y1={Y0} x2={X(p)} y2={Y0 + 5} stroke={COL.gris}/><text x={X(p)} y={Y0 + 22} textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x="390" y={Y0 + 44} textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
      <text x="8" y="18" fontSize="16" fontWeight="700" fill={COL.encre}>A</text>
      <line x1={X0} y1={Y(1)} x2={X1} y2={Y(1)} stroke={COL.orange} strokeDasharray="5 4" strokeWidth="2"/>
      <text x={X0 + 8} y={Y(1) + 20} fontSize="16" fontWeight="700" fill={COL.orange}>A max</text>
      <line x1={X0} y1={Y(0.5)} x2={X(pKa)} y2={Y(0.5)} stroke={COL.gris} strokeDasharray="4 4" strokeWidth="2"/>
      <line x1={X(pKa)} y1={Y(0.5)} x2={X(pKa)} y2={Y0} stroke={COL.gris} strokeDasharray="4 4" strokeWidth="2"/>
      <text x={X0 + 8} y={Y(0.5) - 8} fontSize="16" fill={COL.encre}>A max / 2</text>
      <polyline points={t.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinejoin="round"/>
      <circle cx={X(pKa)} cy={Y(0.5)} r="7" fill="white" stroke={COL.rouge} strokeWidth="3.5"/>
      <text x={X(pKa) + 12} y={Y(0.5) + 26} fontSize="16" fontWeight="800" fill={COL.rouge}>pH = pKa</text>
    </svg>);
}
