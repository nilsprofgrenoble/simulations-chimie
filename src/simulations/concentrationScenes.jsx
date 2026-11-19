// ====================================================
//  Scènes (schémas animés par les réglages) de la simulation « Concentration en quantité de matière : dissolution et dilution » (1G, sim 153).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
//  Les particules sont des points bleus : leur nombre est celui de la quantité de soluté, leur serrage rend la concentration visible.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0', encre: '#0f172a', eau: '#dbeafe' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const alea = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };   // pseudo-aléa déterministe (pas de saut d’un rendu à l’autre)

// ---------- verrerie (dessinée dans un repère local : base en (0, 0), le verre monte vers les y négatifs) ----------
const VERRE = { fill: '#f1f5f9', stroke: '#64748b', strokeWidth: 2 };
const CHEMIN_FIOLE = 'M-6,-130 L-6,-84 Q-40,-70 -40,-36 Q-40,0 0,0 Q40,0 40,-36 Q40,-70 6,-84 L6,-130 Z';
export function Verre({ type, x = 0, y = 0, k = 1, nom, aria, liquide = null }) {
  const corps = {
    fiole: <g><path d={CHEMIN_FIOLE} {...VERRE} /><line x1="-10" y1="-108" x2="10" y2="-108" stroke={COL.encre} strokeWidth="3" /></g>,
    pipette: <g><path fill={liquide || VERRE.fill} d="M-3,-150 L-3,-92 Q-12,-80 -12,-60 L-12,-50 Q-12,-38 -3,-26 L-3,-8 L0,0 L3,-8 L3,-26 Q12,-38 12,-50 L12,-60 Q12,-80 3,-92 L3,-150 Z" stroke={VERRE.stroke} strokeWidth={VERRE.strokeWidth} />
      <line x1="-7" y1="-130" x2="7" y2="-130" stroke={COL.encre} strokeWidth="3" /></g>,
    eprouvette: <g><rect x="-14" y="-130" width="28" height="124" rx="3" {...VERRE} /><rect x="-24" y="-6" width="48" height="6" rx="3" fill="#cbd5e1" stroke={COL.gris} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <line key={i} x1="14" y1={-14 - i * 13} x2={i % 2 ? 8 : 4} y2={-14 - i * 13} stroke={COL.gris} />)}</g>,
    becher: <g><path d="M-34,-84 L-34,-2 Q-34,0 -32,0 L32,0 Q34,0 34,-2 L34,-84" {...VERRE} fill="#f1f5f9" />
      {[0, 1, 2].map(i => <line key={i} x1="-34" y1={-22 - i * 20} x2={i % 2 ? -24 : -18} y2={-22 - i * 20} stroke={COL.gris} />)}</g>,
    erlenmeyer: <g><path d="M-8,-100 L-8,-70 L-38,-2 Q-39,0 -36,0 L36,0 Q39,0 38,-2 L8,-70 L8,-100 Z" {...VERRE} /></g>,
  }[type];
  return <g transform={`translate(${x},${y}) scale(${k})`} role="img" aria-label={aria || nom}>{corps}</g>;
}

// point d'un volume de liquide : (largeur disponible selon la hauteur) → positions pseudo-aléatoires déterministes
function pointsDans(n, { x0, x1, y0, y1, demi = null, graine = 0 }) {
  const pts = []; let i = 0;
  while (pts.length < n && i < n * 60) {
    const x = x0 + alea(i * 2 + graine) * (x1 - x0), y = y0 + alea(i * 2 + 1 + graine + 400) * (y1 - y0);
    if (!demi || Math.abs(x - (x0 + x1) / 2) <= demi(y)) pts.push({ x, y });
    i++;
  }
  return pts;
}
const Points = ({ pts, r = 3.8, fill = COL.bleu, op = 0.9 }) => pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={r} fill={fill} opacity={op} />);

// ---------- bécher dessiné « en grand » (liquide à la hauteur donnée, particules réparties dans le liquide) ----------
function BecherGrand({ cx, base = 170, w = 130, H = 130, niveau, n, graine = 0, couleur = COL.eau }) {
  const hL = Math.max(4, niveau * H), yL = base - hL;
  const pts = pointsDans(n, { x0: cx - w / 2 + 8, x1: cx + w / 2 - 8, y0: yL + 8, y1: base - 8, graine });
  return (
    <g>
      <rect x={cx - w / 2} y={yL} width={w} height={hL} fill={couleur} opacity="0.9" />
      <Points pts={pts} />
      <path d={`M${cx - w / 2},${base - H} L${cx - w / 2},${base - 3} Q${cx - w / 2},${base} ${cx - w / 2 + 3},${base} L${cx + w / 2 - 3},${base} Q${cx + w / 2},${base} ${cx + w / 2},${base - 3} L${cx + w / 2},${base - H}`}
        fill="none" stroke="#64748b" strokeWidth="2.5" />
    </g>);
}

// ---------- scène 1 : deux béchers, la même quantité de soluté dans deux volumes ----------
export function SceneComparer({ titre = 'Même quantité de soluté, volumes différents', A = { V: 100, n: 12 }, B = { V: 200, n: 12 }, Vmax = 250 }) {
  return (
    <svg viewBox="0 0 480 266" style={stl} role="img"
      aria-label={`${titre} : la solution A fait ${A.V} millilitres et contient ${A.n} particules de soluté ; la solution B fait ${B.V} millilitres et contient ${B.n} particules de soluté.`}>
      <text x="240" y="24" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      <g><BecherGrand cx={120} niveau={A.V / Vmax} n={A.n} graine={3} />
        <text x="120" y="198" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Solution A</text>
        <text x="120" y="222" fontSize="18" textAnchor="middle" fill="#334155">{A.V} mL de solution</text></g>
      <g><BecherGrand cx={360} niveau={B.V / Vmax} n={B.n} graine={9} />
        <text x="360" y="198" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Solution B</text>
        <text x="360" y="222" fontSize="18" textAnchor="middle" fill="#334155">{B.V} mL de solution</text></g>
      <circle cx="140" cy="251" r="4.5" fill={COL.bleu} /><text x="152" y="257" fontSize="16" fill="#334155">= une particule de soluté</text>
    </svg>);
}

// ---------- scène : une solution (bécher), nombre de particules ∝ quantité de matière, hauteur ∝ volume ----------
export function SceneSolution({ n, V, Vmax = 1000, nParPoint = 0.01, titre, sous, couleur = COL.eau, legende = true }) {
  const k = Math.max(0, Math.min(60, Math.round(n / nParPoint)));
  return (
    <svg viewBox="0 0 480 236" style={stl} role="img"
      aria-label={`${titre} : ${V} millilitres de solution, ${k} particules de soluté représentées${legende ? ` (un point pour ${String(nParPoint).replace('.', ',')} mole)` : ''}.`}>
      <text x="240" y="24" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      <BecherGrand cx={150} niveau={Math.min(1, V / Vmax)} n={k} graine={5} couleur={couleur} H={140} base={186} w={150} />
      <circle cx="268" cy="86" r="4.5" fill={COL.bleu} /><text x="280" y="92" fontSize="16" fill="#334155">{legende ? `1 point = ${String(nParPoint).replace('.', ',')} mol` : 'particules de soluté'}</text>
      <text x="268" y="124" fontSize="17" fontWeight="700" fill={COL.encre}>{sous && sous[0]}</text>
      <text x="268" y="150" fontSize="17" fill="#334155">{sous && sous[1]}</text>
      <text x="150" y="216" fontSize="16" textAnchor="middle" fill="#334155">hauteur du liquide : le volume</text>
    </svg>);
}

// ---------- fiole jaugée (liquide à un niveau donné, particules) ----------
function FioleGrande({ cx, base = 200, k = 1.05, niveau, n, graine = 0, idc, soluteSolide = false }) {
  // le niveau est une fraction de la hauteur utile jusqu'au trait de jauge (y = −108)
  const yTrait = -108, yBas = 0, yL = niveau <= 0 ? 0 : yBas + (yTrait - yBas) * Math.min(1, niveau);
  const pts = niveau > 0 ? pointsDans(n, { x0: -38, x1: 38, y0: Math.min(-4, yL + 5), y1: -5, graine, demi: y => (y < -88 ? 5 : y < -64 ? 22 : 36) }) : [];
  return (
    <g transform={`translate(${cx},${base}) scale(${k})`}>
      <defs><clipPath id={idc}><path d={CHEMIN_FIOLE} /></clipPath></defs>
      {niveau > 0 && <rect x="-60" y={yL} width="120" height={-yL + 2} fill={COL.eau} opacity="0.95" clipPath={`url(#${idc})`} />}
      {soluteSolide && <path d="M-26,-4 Q0,-22 26,-4 Z" fill="#f8fafc" stroke={COL.gris} />}
      <Points pts={pts} r={3.4 / k} />
      <path d={CHEMIN_FIOLE} fill="none" stroke="#64748b" strokeWidth={2.5 / k} />
      <line x1="-11" y1="-108" x2="11" y2="-108" stroke={COL.encre} strokeWidth={3 / k} />
    </g>);
}

// nom du soluté sur une ou deux lignes (sans parenthèses) pour ne pas déborder de la balance
const nomsLignes = nom => { const n = nom.replace(/ \(.*\)/, ''); if (n.length <= 18) return [n]; const k = n.lastIndexOf(' de '); return k > 0 ? [n.slice(0, k), n.slice(k + 1)] : [n]; };

// ---------- scène : préparer par dissolution (la balance, la fiole jaugée) ----------
export function SceneDissolution({ solute, forme, V, masse, etat = 'jauge', titre = 'Préparer une solution par dissolution' }) {
  // etat : 'pese' (solide dans la fiole), 'jauge' (solution prête au trait)
  const prete = etat === 'jauge';
  return (
    <svg viewBox="0 0 480 252" style={stl} role="img"
      aria-label={`${titre} : ${solute} ${forme}, masse à peser ${masse}, dissoute dans une fiole jaugée de ${V} millilitres.`}>
      <text x="240" y="24" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      <rect x="20" y="172" width="170" height="38" rx="8" fill="#cbd5e1" stroke="#94a3b8" />
      <rect x="62" y="180" width="86" height="22" rx="4" fill="#0f172a" />
      <text x="105" y="197" fontSize="18" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>{masse}</text>
      <ellipse cx="105" cy="166" rx="56" ry="7" fill="#94a3b8" />
      <path d="M62,164 Q105,128 148,164 Z" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
      {nomsLignes(solute).map((l, i, t) => <text key={i} x="105" y={104 - 22 * (t.length - 1 - i)} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>{l}</text>)}
      <text x="105" y="126" fontSize="17" textAnchor="middle" fill="#334155">{forme} (solide)</text>
      <text x="105" y="234" fontSize="17" textAnchor="middle" fill="#334155">balance (tarée)</text>
      <line x1="200" y1="150" x2="262" y2="150" stroke="#94a3b8" strokeWidth="3" /><polygon points="260,142 260,158 274,150" fill="#94a3b8" />
      <FioleGrande cx={360} base={214} niveau={prete ? 1 : 0.0} n={prete ? 22 : 0} graine={2} idc="dis-fiole" soluteSolide={!prete} />
      <text x="360" y="238" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>fiole jaugée de {V} mL</text>
      <text x="336" y="108" fontSize="16" textAnchor="end" fill="#334155">trait de jauge</text>
    </svg>);
}

// ---------- scène : préparer par dilution (prélèvement dans la mère, fiole de la fille) ----------
export function SceneDilution({ V0, V1, nPts = 24, apres = true, titre = 'Préparer une solution par dilution', mere = 'solution mère', fille = 'solution fille' }) {
  const pts0 = pointsDans(nPts, { x0: -9, x1: 9, y0: -78, y1: -36, graine: 4 }).map(p => ({ x: p.x + 105, y: p.y + 190 }));
  return (
    <svg viewBox="0 0 480 252" style={stl} role="img"
      aria-label={`${titre} : prélèvement de ${V0} millilitres de ${mere} à la pipette jaugée, versé dans une fiole jaugée de ${V1} millilitres complétée avec de l’eau. ${apres ? `Les ${nPts} particules de soluté prélevées sont maintenant réparties dans toute la fiole.` : 'La fiole n’est pas encore remplie.'}`}>
      <text x="240" y="24" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      <Verre type="pipette" x={105} y={190} k={1} liquide={COL.eau} aria="Pipette jaugée contenant le prélèvement de solution mère" />
      <Points pts={pts0} r={3.2} />
      <text x="105" y="214" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>{mere}</text>
      <text x="105" y="236" fontSize="17" textAnchor="middle" fill="#334155">prélèvement : {String(V0).replace('.', ',')} mL</text>
      <line x1="170" y1="130" x2="246" y2="130" stroke="#94a3b8" strokeWidth="3" /><polygon points="244,122 244,138 258,130" fill="#94a3b8" />
      <text x="208" y="116" fontSize="16" textAnchor="middle" fill="#334155">+ eau</text>
      <FioleGrande cx={360} base={214} niveau={apres ? 1 : 0} n={apres ? nPts : 0} graine={7} idc="dil-fiole" />
      <text x="360" y="238" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>{apres ? fille : 'fiole jaugée'} : {String(V1).replace('.', ',')} mL</text>
      {!apres && <text x="360" y="150" fontSize="28" fontWeight="700" textAnchor="middle" fill={COL.gris}>?</text>}
    </svg>);
}

// ---------- scène : la verrerie du laboratoire (noms seuls, ou avec la précision qualitative) ----------
export function SceneVerrerie({ liste, precision = false, titre = 'La verrerie du laboratoire' }) {
  const NOMS = { fiole: [['fiole', 'jaugée'], 'très bonne'], pipette: [['pipette', 'jaugée'], 'très bonne'], eprouvette: [['éprouvette', 'graduée'], 'moyenne'], becher: [['bécher', ''], 'faible'], erlenmeyer: [['erlenmeyer', ''], 'faible'] };
  const n = liste.length, w = 480 / n, H = precision ? 286 : 246;
  return (
    <svg viewBox={`0 0 480 ${H}`} style={stl} role="img"
      aria-label={`${titre} : ${liste.map(t => NOMS[t][0].join(' ').trim() + (precision ? `, précision ${NOMS[t][1]}` : '')).join(' ; ')}.`}>
      <text x="240" y="24" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      {liste.map((t, i) => { const cx = w * i + w / 2, coul = t === 'fiole' || t === 'pipette' ? COL.vert : t === 'eprouvette' ? COL.orange : COL.rouge; return (
        <g key={t}>
          <Verre type={t} x={cx} y={188} k={1} nom={NOMS[t][0].join(' ').trim()} />
          <text x={cx} y="212" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>{NOMS[t][0][0]}</text>
          <text x={cx} y="232" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>{NOMS[t][0][1]}</text>
          {precision && <text x={cx} y="256" fontSize="16" textAnchor="middle" fill={coul}>précision</text>}
          {precision && <text x={cx} y="276" fontSize="16" textAnchor="middle" fill={coul}>{NOMS[t][1]}</text>}
        </g>); })}
    </svg>);
}

// ---------- scène : conservation de la quantité de matière lors d'une dilution (exploration : avant / après, même nombre de particules) ----------
export function SceneConservation({ V0, V1, nPts, c0Txt, c1Txt, note = null }) {
  const w0 = 70, w1 = 150, H0 = 60, H1 = 130;
  const p0 = pointsDans(nPts, { x0: 80 - w0 / 2 + 7, x1: 80 + w0 / 2 - 7, y0: 190 - H0 + 8, y1: 182, graine: 1 });
  const p1 = pointsDans(nPts, { x0: 340 - w1 / 2 + 8, x1: 340 + w1 / 2 - 8, y0: 190 - H1 + 8, y1: 182, graine: 11 });
  return (
    <svg viewBox="0 0 480 288" style={stl} role="img"
      aria-label={`Avant la dilution : ${V0} de solution mère avec ${nPts} particules, concentration ${c0Txt}. Après : ${V1} de solution fille avec les mêmes ${nPts} particules, concentration ${c1Txt}.`}>
      <text x="240" y="24" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Les mêmes particules, un volume plus grand</text>
      <rect x={80 - w0 / 2} y={190 - H0} width={w0} height={H0} fill={COL.eau} opacity="0.9" /><Points pts={p0} r={3.2} />
      <path d={`M${80 - w0 / 2},${190 - H0 - 8} L${80 - w0 / 2},188 Q${80 - w0 / 2},190 ${80 - w0 / 2 + 2},190 L${80 + w0 / 2 - 2},190 Q${80 + w0 / 2},190 ${80 + w0 / 2},188 L${80 + w0 / 2},${190 - H0 - 8}`} fill="none" stroke="#64748b" strokeWidth="2.5" />
      <text x="80" y="214" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>prélèvement</text>
      <text x="80" y="236" fontSize="16" textAnchor="middle" fill="#334155">{V0}</text>
      <text x="80" y="256" fontSize="16" textAnchor="middle" fill={COL.orange}>{c0Txt}</text>
      <line x1="150" y1="130" x2="240" y2="130" stroke="#94a3b8" strokeWidth="3" /><polygon points="238,122 238,138 252,130" fill="#94a3b8" />
      <text x="196" y="116" fontSize="16" textAnchor="middle" fill="#334155">+ eau</text>
      <rect x={340 - w1 / 2} y={190 - H1} width={w1} height={H1} fill={COL.eau} opacity="0.9" /><Points pts={p1} r={3.2} />
      <path d={`M${340 - w1 / 2},${190 - H1 - 8} L${340 - w1 / 2},188 Q${340 - w1 / 2},190 ${340 - w1 / 2 + 2},190 L${340 + w1 / 2 - 2},190 Q${340 + w1 / 2},190 ${340 + w1 / 2},188 L${340 + w1 / 2},${190 - H1 - 8}`} fill="none" stroke="#64748b" strokeWidth="2.5" />
      <text x="340" y="214" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>solution fille</text>
      <text x="340" y="236" fontSize="16" textAnchor="middle" fill="#334155">{V1}</text>
      <text x="340" y="256" fontSize="16" textAnchor="middle" fill={COL.orange}>{c1Txt}</text>
      {note && <text x="240" y="278" fontSize="16" textAnchor="middle" fill={COL.gris}>{note}</text>}
    </svg>);
}
