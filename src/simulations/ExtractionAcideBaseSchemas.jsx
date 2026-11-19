// Schémas de la simulation 143 (extraction acide-base, TSTL PCM) : ampoule à deux phases, courbe de la fraction extraite, cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400, caractères Unicode pour les indices, tout le texte dans le viewBox, pas de « / » ni de « ^ » dans une formule affichée.
import * as M from './extractionAcideBaseModele';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', violet: '#7e22ce', gris: '#475569', encre: '#0f172a', eau: '#bae6fd', eauB: '#0284c7', org: '#fef3c7', orgB: '#d97706' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const virg = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const points = (n, x0, y0, w, h, graine = 0) => Array.from({ length: n }, (_, i) => ({ x: x0 + 10 + (((i + graine) * 0.6180339) % 1) * (w - 20), y: y0 + 9 + (((i + graine) * 0.7548777 + 0.21) % 1) * (h - 18) }));

// Marque d'une espèce : cercle noir = forme neutre de l'acide ou de la base ; cercle orange = ion ; carré gris = composé neutre ; losange violet = base B.
export function Marque({ forme, x, y }) {
  if (forme === 'N') return <rect x={x - 4.5} y={y - 4.5} width="9" height="9" fill="#94a3b8" stroke={COL.gris} strokeWidth="1.5"/>;
  if (forme === 'B') return <path d={`M ${x} ${y - 6} L ${x + 6} ${y} L ${x} ${y + 6} L ${x - 6} ${y} Z`} fill="#c084fc" stroke={COL.violet} strokeWidth="1.5"/>;
  if (forme === 'ion') return <circle cx={x} cy={y} r="5" fill="#fb923c" stroke={COL.orange} strokeWidth="1.5"/>;
  return <circle cx={x} cy={y} r="4.8" fill={COL.encre}/>;
}

// ═════════ Scène : ampoule à décanter simplifiée (deux phases non miscibles) ═════════
//  groupes : [{ forme: 'HA'|'ion'|'N'|'B', org, aq (nombres de marques dans chaque phase), nom }] ; pH : nombre ou null ; sansPoints : phases vides
export function SceneAmpoule({ groupes = [], pH = null, titre = '' }) {
  const x0 = 96, w = 216, yO = 40, yE = 108, yB = 176;
  const legende = [];
  groupes.forEach(g => { if (!legende.some(l => l.nom === g.nom)) legende.push(g); });
  const haut = 222 + (legende.length ? Math.ceil(legende.length / 2) * 26 : 0);
  return (
    <svg viewBox={`0 0 400 ${haut}`} style={base} role="img"
      aria-label={`Ampoule à deux phases non miscibles : solvant organique en haut, eau en bas. ${titre} ${pH !== null ? `pH de la phase aqueuse : ${virg(pH, 1)}. ` : ''}${groupes.map(g => `${g.nom} : ${g.org} dans l’organique et ${g.aq} dans l’eau.`).join(' ')}`}>
      {titre && <text x="200" y="24" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>{titre}</text>}
      <rect x={x0} y={yO} width={w} height={yE - yO} fill={COL.org}/>
      <rect x={x0} y={yE} width={w} height={yB - yE} fill={COL.eau}/>
      <line x1={x0} y1={yE} x2={x0 + w} y2={yE} stroke={COL.eauB} strokeWidth="2" strokeDasharray="6 4"/>
      <rect x={x0} y={yO} width={w} height={yB - yO} fill="none" stroke={COL.gris} strokeWidth="3.5" rx="4"/>
      <text x={x0 - 8} y={yO + 36} textAnchor="end" fontSize="16" fontWeight="700" fill={COL.orange}>organique</text>
      <text x={x0 - 8} y={yE + 36} textAnchor="end" fontSize="16" fontWeight="700" fill={COL.bleu}>eau</text>
      {groupes.map((g, k) => (<g key={k}>
        {points(g.org, x0, yO, w, yE - yO, 3 * k + 1).map((p, i) => <Marque key={`o${i}`} forme={g.forme} x={p.x} y={p.y}/>)}
        {points(g.aq, x0, yE, w, yB - yE, 3 * k + 2).map((p, i) => <Marque key={`a${i}`} forme={g.forme} x={p.x} y={p.y}/>)}
      </g>))}
      {pH !== null && <g><rect x="318" y={yE + 14} width="76" height="30" rx="9" fill="white" stroke={COL.eauB} strokeWidth="2.5"/><text x="356" y={yE + 35} textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>pH {virg(pH, 1)}</text></g>}
      {legende.length > 0 && <g>{legende.map((g, i) => { const cx = 14 + (i % 2) * 196, cy = yB + 30 + Math.floor(i / 2) * 26; return (<g key={i}><Marque forme={g.forme} x={cx + 6} y={cy}/><text x={cx + 20} y={cy + 5} fontSize="16" fill={COL.encre}>{g.nom}</text></g>); })}</g>}
    </svg>);
}

// ═════════ Courbe : fraction extraite selon le pH (une espèce, un rapport de volumes) ═════════
export function CourbeE({ e, r = 1, pH = null, marques = [] }) {
  const X0 = 52, X1 = 384, Y0 = 30, Y1 = 196, px = v => X0 + (v / 14) * (X1 - X0), py = v => Y1 - (v / 100) * (Y1 - Y0);
  const pts = []; for (let p = 0; p <= 14.001; p += 0.2) pts.push([px(p), py(100 * M.fractionExtraite(M.distribution(e, p), r))]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const Ep = v => 100 * M.fractionExtraite(M.distribution(e, v), r);
  return (
    <svg viewBox="0 0 400 252" style={base} role="img" aria-label={`Fraction extraite dans le solvant organique selon le pH pour ${e.nom} (pKa ${virg(e.pKa, 1)}, K = ${e.K}, rapport des volumes ${virg(r, 1)}).`}>
      {[0, 50, 100].map(v => <g key={v}><line x1={X0} y1={py(v)} x2={X1} y2={py(v)} stroke="#e2e8f0" strokeWidth="1.5"/><text x={X0 - 6} y={py(v) + 5} textAnchor="end" fontSize="16" fill={COL.gris}>{v}</text></g>)}
      {[0, 2, 4, 6, 8, 10, 12, 14].map(v => <text key={v} x={px(v)} y={Y1 + 22} textAnchor="middle" fontSize="16" fill={COL.gris}>{v}</text>)}
      <text x="12" y="18" fontSize="16" fontWeight="700" fill={COL.encre}>% extrait</text>
      <text x={X1} y="246" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pH de la phase aqueuse</text>
      <line x1={px(e.pKa)} y1={Y0} x2={px(e.pKa)} y2={Y1} stroke={COL.gris} strokeWidth="2" strokeDasharray="5 4"/>
      <path d={d} fill="none" stroke={COL.orange} strokeWidth="3.5" strokeLinejoin="round"/>
      {marques.map((m, i) => <g key={i}><circle cx={px(m.pH)} cy={py(Ep(m.pH))} r="6" fill="white" stroke={COL.rouge} strokeWidth="3"/>
        <text x={px(m.pH) + (m.dx ?? 10)} y={py(Ep(m.pH)) + (m.dy ?? -10)} textAnchor={m.ancre ?? 'start'} fontSize="16" fontWeight="800" fill={COL.rouge} stroke="white" strokeWidth="4" paintOrder="stroke">{m.texte}</text></g>)}
      {pH !== null && <g><line x1={px(pH)} y1={Y0} x2={px(pH)} y2={Y1} stroke={COL.rouge} strokeWidth="2.5"/><circle cx={px(pH)} cy={py(Ep(pH))} r="6" fill={COL.rouge}/></g>}
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════
// A : deux phases, coefficient de partage K
export function SvgPartage() {
  return (
    <svg viewBox="0 0 400 252" style={base} role="img" aria-label="Coefficient de partage : K est égal à la concentration de la forme neutre dans le solvant organique divisée par sa concentration dans l’eau. Exemple : 20 molécules neutres dans l’organique pour 1 dans l’eau, K = 20. Les ions restent dans l’eau.">
      <text x="200" y="26" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Deux phases, deux solubilités</text>
      <text x="22" y="98" fontSize="22" fontWeight="800" fill={COL.encre}>K =</text>
      <text x="100" y="82" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.orange}>[HA]org</text>
      <line x1="52" y1="92" x2="150" y2="92" stroke={COL.encre} strokeWidth="2.5"/>
      <text x="100" y="116" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.bleu}>[HA]aq</text>
      <rect x="196" y="46" width="190" height="52" fill={COL.org} stroke={COL.gris} strokeWidth="3"/>
      <rect x="196" y="98" width="190" height="52" fill={COL.eau} stroke={COL.gris} strokeWidth="3"/>
      {points(14, 196, 46, 190, 52, 1).map((p, i) => <Marque key={i} forme="HA" x={p.x} y={p.y}/>)}
      {points(1, 196, 98, 190, 52, 5).map((p, i) => <Marque key={i} forme="HA" x={p.x} y={p.y}/>)}
      <text x="190" y="76" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.orange}>org.</text>
      <text x="190" y="130" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.bleu}>eau</text>
      <rect x="8" y="164" width="384" height="80" rx="10" fill="#f0f9ff" stroke={COL.eauB} strokeWidth="2"/>
      <text x="200" y="190" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>14 contre 1 : K est grand,</text>
      <text x="200" y="212" textAnchor="middle" fontSize="16" fill={COL.encre}>la forme neutre « préfère » l’organique</text>
      <text x="200" y="234" textAnchor="middle" fontSize="16" fill={COL.encre}>un ion reste dans l’eau</text>
    </svg>);
}
// B : acide ou base, forme neutre ou ionique selon le pH
export function SvgFormes() {
  const ligne = (y, titre, g1, g2, d1, d2, cg, cd) => (<g>
    <text x="12" y={y - 10} fontSize="17" fontWeight="800" fill={COL.encre}>{titre}</text>
    <rect x="12" y={y} width="188" height="62" fill={cg}/><rect x="200" y={y} width="188" height="62" fill={cd}/>
    <text x="106" y={y + 26} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>{g1}</text>
    <text x="106" y={y + 50} textAnchor="middle" fontSize="16" fill={COL.encre}>{g2}</text>
    <text x="294" y={y + 26} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>{d1}</text>
    <text x="294" y={y + 50} textAnchor="middle" fontSize="16" fill={COL.encre}>{d2}</text>
    <line x1="200" y1={y - 4} x2="200" y2={y + 66} stroke={COL.encre} strokeWidth="3"/>
  </g>);
  return (
    <svg viewBox="0 0 400 276" style={base} role="img" aria-label="Forme neutre ou ionique selon le pH. Un acide : HA, neutre et extractible, pour un pH inférieur au pKa ; A⁻, ionique et resté dans l’eau, pour un pH supérieur. Une base : BH⁺ ionique pour un pH inférieur au pKa ; B, neutre et extractible, pour un pH supérieur.">
      <text x="200" y="24" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Neutre ou ion : le pH décide</text>
      {ligne(66, 'Un acide', 'pH < pKa', 'HA : neutre', 'pH > pKa', 'A⁻ : ion', '#fde68a', '#bae6fd')}
      {ligne(166, 'Une base', 'pH < pKa', 'BH⁺ : ion', 'pH > pKa', 'B : neutre', '#bae6fd', '#fde68a')}
      <text x="200" y="262" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.vert}>la frontière est le pKa du couple</text>
    </svg>);
}
// C : courbe de la fraction extraite pour l'acide benzoïque
export function SvgCourbe() {
  return (<CourbeE e={M.ESPECES.benz} r={1} marques={[{ pH: 4.2, texte: '91 %', dx: 12, dy: -8 }, { pH: 6.2, texte: '17 %', dx: 12, dy: -10 }]}/>);
}
// D : la règle du choix du pH
export function SvgChoix() {
  const cell = (x, y, t1, t2, fond) => (<g><rect x={x} y={y} width="184" height="62" rx="8" fill={fond} stroke={COL.gris} strokeWidth="1.5"/><text x={x + 92} y={y + 26} textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>{t1}</text><text x={x + 92} y={y + 50} textAnchor="middle" fontSize="16" fill={COL.encre}>{t2}</text></g>);
  return (
    <svg viewBox="0 0 400 290" style={base} role="img" aria-label="Choisir le pH : pour extraire un acide dans l’organique, pH inférieur au pKa ; pour le renvoyer dans l’eau, pH supérieur au pKa. Pour une base, c’est l’inverse : pH supérieur au pKa pour l’extraire, pH inférieur pour la renvoyer dans l’eau.">
      <text x="200" y="24" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Quel pH choisir ?</text>
      <text x="110" y="58" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>vers l’organique</text>
      <text x="300" y="58" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.bleu}>vers l’eau</text>
      {cell(14, 68, 'acide', 'pH < pKa', '#fef3c7')}{cell(204, 68, 'acide', 'pH > pKa', '#e0f2fe')}
      {cell(14, 140, 'base', 'pH > pKa', '#fef3c7')}{cell(204, 140, 'base', 'pH < pKa', '#e0f2fe')}
      <rect x="8" y="218" width="384" height="64" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <text x="200" y="244" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>on veut la forme neutre dans l’organique</text>
      <text x="200" y="268" textAnchor="middle" fontSize="16" fill={COL.encre}>on veut l’ion dans l’eau</text>
    </svg>);
}
// E : plan de séparation d'un mélange acide, base, neutre
export function SvgPlan() {
  const boite = (x, y, w, h, lignes, fond, tr) => (<g><rect x={x} y={y} width={w} height={h} rx="8" fill={fond} stroke={tr ?? COL.gris} strokeWidth="2"/>{lignes.map((t, i) => <text key={i} x={x + w / 2} y={y + 24 + i * 22} textAnchor="middle" fontSize="16" fontWeight={i === 0 ? 800 : 500} fill={COL.encre}>{t}</text>)}</g>);
  return (
    <svg viewBox="0 0 400 322" style={base} role="img" aria-label="Plan de séparation d’un mélange d’un acide HA, d’une base B et d’un composé neutre N dans le solvant organique. On ajoute une solution de pH 12 : A⁻ passe dans l’eau, B et N restent dans l’organique. On ajoute ensuite une solution de pH 1 à la phase organique : BH⁺ passe dans l’eau, N reste. On acidifie la phase aqueuse contenant A⁻ : HA se forme et peut être extrait.">
      {boite(40, 8, 320, 54, ['mélange dans l’organique', 'HA, B et N'], COL.org, COL.orgB)}
      <path d="M 200 62 V 92" stroke={COL.encre} strokeWidth="3"/><path d="M 192 86 L 200 98 L 208 86 Z" fill={COL.encre}/>
      <text x="212" y="84" fontSize="16" fontWeight="800" fill={COL.rouge}>+ eau de pH 12</text>
      {boite(8, 104, 184, 82, ['organique : B, N', 'B neutre à pH 12'], COL.org, COL.orgB)}
      {boite(208, 104, 184, 82, ['eau : A⁻', 'ion, reste dans l’eau'], COL.eau, COL.eauB)}
      <path d="M 100 186 V 208" stroke={COL.encre} strokeWidth="3"/><path d="M 92 202 L 100 214 L 108 202 Z" fill={COL.encre}/>
      <path d="M 300 186 V 208" stroke={COL.encre} strokeWidth="3"/><path d="M 292 202 L 300 214 L 308 202 Z" fill={COL.encre}/>
      {boite(8, 220, 184, 92, ['+ eau de pH 1', 'BH⁺ passe dans l’eau', 'N reste (organique)'], '#fef9c3', COL.orgB)}
      {boite(208, 220, 184, 92, ['+ acide : pH 1', 'A⁻ devient HA', 'HA à extraire'], '#dcfce7', COL.vert)}
    </svg>);
}
