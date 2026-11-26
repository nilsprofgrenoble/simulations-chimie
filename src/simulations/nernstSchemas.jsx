// ====================================================
//  Schémas de la simulation 292 (potentiel d'un couple : ESH et relation de Nernst, TSTL SPCL).
//  Scène animée : pile « ESH | couple » à vide : électrode standard à hydrogène (bulles de H₂), demi-pile du couple (ions dessinés selon les concentrations,
//  électrode métallique ou de platine), pont salin, voltmètre numérique (la fem lue est le potentiel du couple) ; graphique E = f(log c) ou f(pH) ; six cartes « À retenir ».
//  Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège, gris = texte secondaire ; une couleur par espèce (voir ESPECES).
//  Scène : viewBox 400 × 340, textes de 12 à 20. Cartes : viewBox 400 × 290, textes ≥ 14. Les animations s'arrêtent si `anime` est faux (mouvement réduit).
// ====================================================
import { log10, nbPoints, potentiel, COUPLES, ECHELLE, fr, concTexte } from './nernstModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// espèces dessinées : couleur de l'ion, signe de la charge (+1 ou −1)
const ESPECES = {
  'Cu²⁺': { c: '#0284c7', z: 1 }, 'Zn²⁺': { c: '#64748b', z: 1 }, 'Ag⁺': { c: '#475569', z: 1 }, 'Fe³⁺': { c: '#d97706', z: 1 }, 'Fe²⁺': { c: '#65a30d', z: 1 },
  'MnO₄⁻': { c: '#7e22ce', z: -1 }, 'Mn²⁺': { c: '#db2777', z: 1 }, 'H⁺': { c: '#ea580c', z: 1 },
};
const Ion = ({ x, y, couleur, signe, r = 6 }) => { const a = r * 0.5, w = Math.max(1.4, r * 0.29);
  return (<g><circle cx={x} cy={y} r={r} fill={couleur} stroke="#fff" strokeWidth="0.9"/>
    <line x1={x - a} y1={y} x2={x + a} y2={y} stroke="#fff" strokeWidth={w}/>{signe > 0 && <line x1={x} y1={y - a} x2={x} y2={y + a} stroke="#fff" strokeWidth={w}/>}</g>); };
const Vib = ({ k, anime, children }) => (anime
  ? <g>{children}<animateTransform attributeName="transform" type="translate" dur={`${3 + (k % 5) * 0.6}s`} repeatCount="indefinite" values={`0 0; ${((k * 7) % 5) - 2} ${((k * 3) % 5) - 2}; ${((k * 5) % 5) - 2} ${((k * 11) % 5) - 2}; 0 0`}/></g>
  : <g>{children}</g>);
const Cadre = ({ actif, x, y, w, h }) => (actif ? <rect x={x} y={y} width={w} height={h} rx="9" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="7 5"/> : null);

// ---------- définitions communes (dégradés des matériaux) ----------
export const Defs = () => (
  <defs>
    <linearGradient id="n-verre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.85"/><stop offset="0.18" stopColor="#fff" stopOpacity="0.15"/><stop offset="0.85" stopColor="#fff" stopOpacity="0.05"/><stop offset="1" stopColor="#fff" stopOpacity="0.6"/></linearGradient>
    <linearGradient id="n-pt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f1f5f9"/><stop offset="0.5" stopColor="#94a3b8"/><stop offset="1" stopColor="#cbd5e1"/></linearGradient>
    <linearGradient id="n-cuivre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fdba74"/><stop offset="0.5" stopColor="#c2410c"/><stop offset="1" stopColor="#9a3412"/></linearGradient>
    <linearGradient id="n-zinc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f1f5f9"/><stop offset="0.5" stopColor="#94a3b8"/><stop offset="1" stopColor="#64748b"/></linearGradient>
    <linearGradient id="n-argent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff"/><stop offset="0.5" stopColor="#cbd5e1"/><stop offset="1" stopColor="#e2e8f0"/></linearGradient>
    <linearGradient id="n-volt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#334155"/><stop offset="1" stopColor="#0f172a"/></linearGradient>
    <linearGradient id="n-pont" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fafc"/><stop offset="1" stopColor="#e2e8f0"/></linearGradient>
    <linearGradient id="n-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e2e8f0"/><stop offset="1" stopColor="#f1f5f9"/></linearGradient>
  </defs>);

// ---------- emplacements fixes des ions de la demi-pile (un point ne change pas de place quand on en ajoute ou retire) ----------
const SLOTS = (() => {
  const s = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) s.push([14 + c * 15.4 + (r % 2 ? 7 : 0), 24 + r * 14.5]);
  let g = 17; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();

// teinte de la solution selon le couple et les concentrations
const frac = c => Math.max(0, Math.min(1, (log10(Math.max(c, 1e-9)) + 3) / 3));
function teinte(c, cOx, cRed) {
  if (c.id === 'cu') return { fill: '#38bdf8', op: 0.1 + 0.38 * frac(cOx) };
  if (c.id === 'fe') { const r = cOx / (cOx + cRed); return { fill: r > 0.5 ? '#f59e0b' : '#a3e635', op: 0.12 + 0.3 * frac(Math.max(cOx, cRed)) }; }
  if (c.id === 'mn') { const r = cOx / (cOx + cRed); return { fill: r > 0.5 ? '#a855f7' : '#f9a8d4', op: 0.1 + 0.4 * frac(Math.max(cOx, cRed)) }; }
  return { fill: '#bae6fd', op: 0.12 };
}

// bécher en verre : rebord, reflets, liquide (clippé par le profil), niveau
const Becher = ({ x, y, w, h, niveau, fill, op, id }) => {
  const prof = `M${x} ${y} V${y + h - 8} Q${x} ${y + h} ${x + 8} ${y + h} H${x + w - 8} Q${x + w} ${y + h} ${x + w} ${y + h - 8} V${y}`;
  return (<g>
    <clipPath id={`n-cl-${id}`}><path d={`${prof} Z`}/></clipPath>
    <g clipPath={`url(#n-cl-${id})`}><rect x={x} y={niveau} width={w} height={y + h - niveau} fill={fill} opacity={op}/><rect x={x} y={niveau} width={w} height="3" fill="#fff" opacity="0.7"/></g>
    <path d={prof} fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x={x + 5} y={y + 6} width="6" height={h - 26} rx="3" fill="url(#n-verre)"/>
    <line x1={x - 4} y1={y} x2={x + w + 4} y2={y} stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
  </g>);
};

// ---------- scène : pile ESH | couple, à vide ----------
//  couple : objet de COUPLES ; cOx, cRed (mol/L), pH ; E : fem affichée (V) ou null (affichage « – – – ») ; anime ; montrer : { ions, pont, volt } ; hl(id) : cadres de repérage (esh, couple, volt, pont)
export function ScenePile({ couple, cOx = 1, cRed = 1, pH = 0, E = null, anime = true, montrer = {}, hl = () => false, etiquette = true, masquerConc = false, decE = 2 }) {
  const { ions = true, pont = true, volt = true } = montrer;
  const BY = 122, BH = 160, NIV = 160, BXL = 30, BXR = 266, BW = 104;
  const t = teinte(couple, masquerConc ? 0.05 : cOx, cRed);
  const nOx = masquerConc ? 3 : nbPoints(cOx), nRed = couple.redSolide ? 0 : nbPoints(cRed), nH = couple.beta ? Math.max(1, Math.min(6, 7 - Math.round(pH * 1.6) - 1)) : 0;
  const oxE = ESPECES[couple.ox], redE = ESPECES[couple.red], hE = ESPECES['H⁺'];
  const libres = SLOTS.filter(([x]) => x < 46 || x > 84), dots = []; if (ions) {
    for (let i = 0; i < nOx; i++) dots.push({ k: i, s: libres[i], e: oxE });
    for (let i = 0; i < nRed; i++) dots.push({ k: 10 + i, s: libres[6 + i], e: redE });
    for (let i = 0; i < nH; i++) dots.push({ k: 20 + i, s: libres[12 + i], e: hE });
  }
  const metal = { cu: 'n-cuivre', zn: 'n-zinc', ag: 'n-argent' }[couple.id] || 'n-pt';
  const lecture = E == null ? '– – –' : `${fr(E, decE)}`;
  const bulles = [[56, 0], [64, 0.7], [72, 1.4], [60, 2.1], [68, 2.8]];
  return (
    <svg viewBox="0 0 400 358" style={stl} role="img" aria-label={`Pile à vide : à gauche l'électrode standard à hydrogène (platine, dihydrogène qui barbote, ions H+), à droite la demi-pile du couple ${couple.nom} (${couple.electrode}), reliées par un pont salin ; un voltmètre branché entre les deux électrodes indique la tension à vide${E == null ? '' : `, ${lecture} volt`}.`}>
      <Defs/>
      <rect x="0" y="282" width="400" height="76" fill="url(#n-table)"/><ellipse cx="82" cy="284" rx="62" ry="5" fill="#94a3b8" opacity="0.25"/><ellipse cx="318" cy="284" rx="62" ry="5" fill="#94a3b8" opacity="0.25"/><line x1="0" y1="282" x2="400" y2="282" stroke="#cbd5e1" strokeWidth="2"/>
      {volt && (<g>
        <rect x="136" y="6" width="128" height="56" rx="11" fill="url(#n-volt)" stroke="#0f172a" strokeWidth="2"/>
        <rect x="146" y="12" width="108" height="30" rx="6" fill="#06281f" stroke="#064e3b" strokeWidth="1.5"/>
        <text key={lecture} x="200" y="35" fontSize="22" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="ui-monospace, Menlo, monospace">{lecture}<tspan fontSize="14" dx="3">V</tspan>{anime && <animate attributeName="opacity" from="0.25" to="1" dur="0.45s" fill="freeze"/>}</text>
        <text x="168" y="55" fontSize="12" fontWeight="700" textAnchor="middle" fill="#cbd5e1">COM</text><text x="232" y="55" fontSize="12" fontWeight="700" textAnchor="middle" fill="#fca5a5">V</text>
        <circle cx="168" cy="62" r="5.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5"/><circle cx="232" cy="62" r="5.5" fill="#dc2626" stroke="#fecaca" strokeWidth="1.5"/>
        <Cadre actif={hl('volt')} x="128" y="1" w="144" h="68"/>
      </g>)}
      {volt && (<g fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M168 67 V78 H95 V112" stroke="#334155"/><path d="M232 67 V78 H331 V112" stroke="#dc2626"/></g>)}
      {/* pont salin */}
      {pont && (<g>
        <path d="M110 178 V106 Q110 98 118 98 H282 Q290 98 290 106 V178" fill="none" stroke="#94a3b8" strokeWidth="15" strokeLinecap="round"/>
        <path d="M110 178 V106 Q110 98 118 98 H282 Q290 98 290 106 V178" fill="none" stroke="url(#n-pont)" strokeWidth="10" strokeLinecap="round"/>
        {[[126, 98, 1], [150, 98, -1], [176, 98, 1], [224, 98, -1], [250, 98, 1], [274, 98, -1], [110, 130, 1], [290, 130, -1], [110, 156, -1], [290, 156, 1]].map(([x, y, s], k) =>
          <Vib key={k} k={k} anime={anime}><Ion x={x} y={y} couleur={s > 0 ? '#94a3b8' : '#cbd5e1'} signe={s} r={3.6}/></Vib>)}
        <text x="200" y="124" fontSize="13" fontWeight="700" textAnchor="middle" fill={COL.gris}>pont salin</text>
        <Cadre actif={hl('pont')} x="98" y="86" w="204" h="40"/>
      </g>)}
      {/* ESH */}
      <g>
        <Becher x={BXL} y={BY} w={BW} h={BH} niveau={NIV} fill="#bae6fd" op={0.35} id="g"/>
        <rect x={BXL + 58} y="108" width="14" height="150" rx="2" fill="url(#n-pt)" stroke="#64748b" strokeWidth="1.2"/>
        <rect x={BXL + 55} y="102" width="20" height="9" rx="3" fill="#1e293b"/>
        <path d={`M${BXL + 14} 96 V250 H${BXL + 34}`} fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/><path d={`M${BXL + 14} 96 V250 H${BXL + 34}`} fill="none" stroke="#e0f2fe" strokeWidth="3" strokeLinecap="round"/>
        <text x={BXL + 14} y="88" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.bleu}>H₂</text>
        <path d={`M${BXL + 14} 92 V82`} stroke={COL.bleu} strokeWidth="0"/>
        {bulles.map(([bx, d], k) => (<circle key={k} cx={BXL + bx - 4} cy="246" r={2.6 + (k % 3)} fill="#fff" stroke="#7dd3fc" strokeWidth="1.3" opacity={anime ? 0.9 : 0.9}>
          {anime && <animate attributeName="cy" from="248" to="170" dur="2.4s" begin={`${d}s`} repeatCount="indefinite"/>}
          {anime && <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.12;0.8;1" dur="2.4s" begin={`${d}s`} repeatCount="indefinite"/>}
        </circle>))}
        {!anime && [[BXL + 50, 236, 3.4], [BXL + 40, 212, 2.6], [BXL + 52, 196, 3], [BXL + 44, 176, 2.4]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill="#fff" stroke="#7dd3fc" strokeWidth="1.3"/>)}
        {[[0, 8], [1, 3], [2, 11], [3, 6], [4, 14]].map(([k]) => <Vib key={k} k={k + 30} anime={anime}><Ion x={BXL + [80, 90, 22, 36, 92][k]} y={[200, 232, 188, 222, 176][k]} couleur="#ea580c" signe={1} r={5.2}/></Vib>)}
        <Cadre actif={hl('esh')} x={BXL - 10} y="84" w={BW + 20} h="204"/>
      </g>
      {/* demi-pile du couple */}
      <g>
        <Becher x={BXR} y={BY} w={BW} h={BH} niveau={NIV} fill={t.fill} op={t.op} id="d"/>
        <rect x={BXR + 58} y="108" width="14" height="150" rx="2" fill={`url(#${metal})`} stroke="#64748b" strokeWidth="1.2"/>
        <rect x={BXR + 55} y="102" width="20" height="9" rx="3" fill="#1e293b"/>
        {ions && dots.map(d => <Vib key={d.k} k={d.k} anime={anime}><Ion x={BXR + d.s[0] - (d.s[0] > 54 && d.s[0] < 82 ? 0 : 0)} y={NIV + d.s[1] + 8} couleur={d.e.c} signe={d.e.z} r={5.4}/></Vib>)}
        <Cadre actif={hl('couple')} x={BXR - 10} y="84" w={BW + 20} h="204"/>
      </g>
      {etiquette && (<g textAnchor="middle">
        <text x={BXL + BW / 2} y="304" fontSize="15" fontWeight="700" fill={COL.txt}>ESH</text>
        <text x={BXL + BW / 2} y="320" fontSize="12.5" fill={COL.gris}>Pt · H₂ (1 bar) · H⁺</text>
        <text x={BXL + BW / 2} y="336" fontSize="12.5" fontWeight="700" fill={COL.bleu}>E(ESH) = 0,00 V</text>
        <text x={BXR + BW / 2} y="304" fontSize="15" fontWeight="700" fill={COL.txt}>{couple.nom}</text>
        <text x={BXR + BW / 2} y="320" fontSize="12.5" fill={oxE.c} fontWeight="700">{masquerConc ? `[${couple.ox}] : inconnue` : `[${couple.ox}] = ${concTexte(cOx)} mol/L`}</text>
        {!couple.redSolide && <text x={BXR + BW / 2} y="336" fontSize="12.5" fill={redE.c} fontWeight="700">{`[${couple.red}] = ${concTexte(cRed)} mol/L`}</text>}
        {couple.beta > 0 && <text x={BXR + BW / 2} y="352" fontSize="12.5" fill={hE.c} fontWeight="700">{`pH = ${fr(pH, 0)}`}</text>}
      </g>)}
    </svg>);
}

// ====================================================
//  Graphique : E = f(log c) ou E = f(pH) ; points mesurés, droite ajustée (a, b), point courant
// ====================================================
const nice = (lo, hi) => { const w = hi - lo, st = w > 1.2 ? 0.5 : w > 0.5 ? 0.2 : w > 0.25 ? 0.1 : 0.05; return { st, lo: Math.floor(lo / st) * st, hi: Math.ceil(hi / st) * st }; };
export function Graphe({ points = [], x = 'logc', droite = null, marqueur = null, xmin, xmax, titre = '' }) {
  const xs = x === 'ph' ? [xmin ?? -0.2, xmax ?? 4.2] : [xmin ?? -3.2, xmax ?? 0.2];
  const ys = [...points.map(p => p.E), ...(marqueur ? [marqueur.E] : []), ...(droite ? [droite.a * xs[0] + droite.b, droite.a * xs[1] + droite.b] : [])];
  const { st, lo, hi } = nice(Math.min(...(ys.length ? ys : [0])) - 0.02, Math.max(...(ys.length ? ys : [1])) + 0.02);
  const X = v => 62 + (v - xs[0]) / (xs[1] - xs[0]) * 316, Y = v => 214 - (v - lo) / (hi - lo) * 180;
  const yt = []; for (let v = lo; v <= hi + 1e-9; v += st) yt.push(Number(v.toFixed(3)));
  const xt = []; for (let v = Math.ceil(xs[0]); v <= xs[1] + 1e-9; v += 1) xt.push(v);
  return (
    <svg viewBox="0 0 400 270" style={stl} role="img" aria-label={`Graphique du potentiel E en volts en fonction de ${x === 'ph' ? 'pH' : 'log de la concentration'}. ${points.length} points.${droite ? ` Droite ajustée de pente ${fr(droite.a, 3)} V par unité.` : ''}`}>
      <rect x="62" y="34" width="316" height="180" fill="#f8fafc"/>
      {yt.map(v => <g key={v}><line x1="62" y1={Y(v)} x2="378" y2={Y(v)} stroke="#e2e8f0" strokeWidth="1.2"/><text x="56" y={Y(v) + 5} fontSize="13" textAnchor="end" fill={COL.gris}>{fr(v, st < 0.1 ? 2 : 1)}</text></g>)}
      {xt.map(v => <g key={v}><line x1={X(v)} y1="34" x2={X(v)} y2="214" stroke="#e2e8f0" strokeWidth="1.2"/><text x={X(v)} y="234" fontSize="13" textAnchor="middle" fill={COL.gris}>{fr(v, 0)}</text></g>)}
      <line x1="62" y1="214" x2="378" y2="214" stroke={COL.gris} strokeWidth="2"/><line x1="62" y1="34" x2="62" y2="214" stroke={COL.gris} strokeWidth="2"/>
      <text x="220" y="258" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>{x === 'ph' ? 'pH' : 'log ( [Ox] / mol·L⁻¹ )'}</text>
      <text x="6" y="22" fontSize="14" fontWeight="700" fill={COL.txt}>E (V)</text>
      {titre && <text x="394" y="22" fontSize="13" textAnchor="end" fill={COL.gris}>{titre}</text>}
      {droite && <line x1={X(xs[0])} y1={Y(droite.a * xs[0] + droite.b)} x2={X(xs[1])} y2={Y(droite.a * xs[1] + droite.b)} stroke={COL.orange} strokeWidth="2.6" strokeDasharray="7 5"/>}
      {points.map((p, k) => <circle key={k} cx={X(x === 'ph' ? p.pH : p.logc)} cy={Y(p.E)} r="6" fill={COL.bleu} stroke="#fff" strokeWidth="1.6"/>)}
      {marqueur && <g><circle cx={X(marqueur.x)} cy={Y(marqueur.E)} r="8" fill="none" stroke={COL.orange} strokeWidth="3"/><circle cx={X(marqueur.x)} cy={Y(marqueur.E)} r="3.4" fill={COL.orange}/></g>}
    </svg>);
}

// ====================================================
//  Cartes « À retenir » (viewBox 400 × 290, textes ≥ 14)
// ====================================================
const Carte = ({ children, label }) => (<svg viewBox="0 0 400 290" style={stl} role="img" aria-label={label}><Defs/>{children}</svg>);
const Boite = ({ x, y, w, h, fill = '#f8fafc', stroke = '#cbd5e1' }) => <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={stroke} strokeWidth="2"/>;
const MiniBec = ({ x, y, w = 74, h = 86, niveau = 24, fill = '#bae6fd', op = 0.4, children }) => (<g>
  <rect x={x} y={y + niveau} width={w} height={h - niveau} fill={fill} opacity={op}/>
  <path d={`M${x} ${y} V${y + h - 7} Q${x} ${y + h} ${x + 7} ${y + h} H${x + w - 7} Q${x + w} ${y + h} ${x + w} ${y + h - 7} V${y}`} fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>{children}</g>);

// carte 1 : ESH et fem
export function SvgEshCarte() {
  return (
    <Carte label="Un potentiel ne se mesure pas seul : on mesure la tension à vide entre une demi-pile contenant le couple et une électrode de référence, l'électrode standard à hydrogène, dont le potentiel vaut 0,00 volt par convention. La tension mesurée est alors le potentiel du couple.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>On mesure une tension, pas un potentiel</text>
      <rect x="150" y="32" width="100" height="40" rx="9" fill="url(#n-volt)"/><rect x="158" y="37" width="84" height="22" rx="5" fill="#06281f"/>
      <text x="200" y="54" fontSize="16" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="ui-monospace, Menlo, monospace">fem</text>
      <path d="M178 72 V80 H77 V92 M222 72 V80 H323 V92" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <MiniBec x={40} y={104} niveau={22}/><MiniBec x={286} y={104} niveau={22} fill="#38bdf8" op={0.32}/>
      <rect x="72" y="88" width="10" height="92" rx="2" fill="url(#n-pt)" stroke="#64748b"/><rect x="318" y="88" width="10" height="92" rx="2" fill="url(#n-cuivre)" stroke="#64748b"/>
      {[[56, 166, 3.4], [96, 150, 2.6], [58, 140, 2.2], [98, 172, 3]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill="#fff" stroke="#7dd3fc" strokeWidth="1.5"/>)}
      {[[52, 156], [94, 164], [60, 176]].map(([x, y], k) => <Ion key={k} x={x} y={y} couleur="#ea580c" signe={1} r={5}/>)}
      {[[300, 158], [346, 150], [340, 176], [304, 178]].map(([x, y], k) => <Ion key={k} x={x} y={y} couleur="#0284c7" signe={1} r={5}/>)}
      <path d="M104 150 V124 Q104 116 112 116 H288 Q296 116 296 124 V150" fill="none" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round"/>
      <path d="M104 150 V124 Q104 116 112 116 H288 Q296 116 296 124 V150" fill="none" stroke="url(#n-pont)" strokeWidth="5.5" strokeLinecap="round"/>
      <text x="200" y="136" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.gris}>pont salin</text>
      <text x="77" y="212" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>ESH</text><text x="77" y="230" fontSize="14.5" textAnchor="middle" fill={COL.bleu} fontWeight="700">0,00 V</text>
      <text x="323" y="212" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>couple Ox / Red</text><text x="323" y="230" fontSize="14.5" textAnchor="middle" fill={COL.orange} fontWeight="700">potentiel E</text>
      <Boite x={40} y={240} w={320} h={40} fill="#fff7ed" stroke="#fdba74"/>
      <text x="200" y="266" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>fem = E(couple) − E(ESH) = E(couple)</text>
    </Carte>);
}

// carte 2 : échelle des potentiels standards (tableau de la fiche)
export function SvgEchelleCarte() {
  const Y = E => 52 + (1.9 - E) / 2.8 * 166;
  return (
    <Carte label="Échelle des potentiels standards : du plus grand, oxydant le plus fort, au plus petit, réducteur le plus fort : H2O2 sur H2O 1,78 volt, permanganate sur manganèse II 1,51, argent 0,80, cuivre 0,34, ESH 0,00, zinc moins 0,76.">
      <text x="200" y="24" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Échelle des potentiels standards E°</text>
      <line x1="62" y1="40" x2="62" y2="226" stroke={COL.gris} strokeWidth="3" strokeLinecap="round"/><polygon points="62,34 55,48 69,48" fill={COL.gris}/>
      {ECHELLE.map(({ nom, E0 }) => <g key={nom}><line x1="56" y1={Y(E0)} x2="76" y2={Y(E0)} stroke={COL.txt} strokeWidth="2.6"/>
        <text x="86" y={Y(E0) + 5} fontSize="15" fontWeight="700" fill={E0 === 0 ? COL.bleu : COL.txt}>{nom}</text>
        <text x="296" y={Y(E0) + 5} fontSize="15" fontWeight="700" textAnchor="end" fill={E0 === 0 ? COL.bleu : COL.txt}>{fr(E0)} V</text></g>)}
      <text x="12" y="80" fontSize="13" fontWeight="700" fill={COL.rouge} transform="rotate(-90 12 80)" textAnchor="middle">E° grand</text>
      <text x="12" y="190" fontSize="13" fontWeight="700" fill={COL.vert} transform="rotate(-90 12 190)" textAnchor="middle">E° petit</text>
      <Boite x={316} y={54} w={76} h={72} fill="#fef2f2" stroke="#fca5a5"/><text x="354" y="82" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>oxydant</text><text x="354" y="100" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>plus fort</text><text x="354" y="118" fontSize="18" textAnchor="middle" fill={COL.rouge}>↑</text>
      <Boite x={316} y={140} w={76} h={72} fill="#f0fdf4" stroke="#86efac"/><text x="354" y="168" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>réducteur</text><text x="354" y="186" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>plus fort</text><text x="354" y="206" fontSize="18" textAnchor="middle" fill={COL.vert}>↓</text>
      <text x="200" y="252" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>un E° se compare, il ne se mesure qu’avec l’ESH</text>
      <text x="200" y="274" fontSize="14" textAnchor="middle" fill={COL.gris}>E° : potentiel quand [Ox] = [Red] = 1 (25 °C, 1 bar)</text>
    </Carte>);
}

// carte 3 : relation de Nernst annotée + exemple
export function SvgNernstCarte() {
  const ex = potentiel(COUPLES.zn, 0.1);
  return (
    <Carte label="Relation de Nernst à 25 degrés : E égale E zéro plus 0,06 sur n fois le logarithme de la concentration de l'oxydant sur celle du réducteur. Les solides valent 1. Exemple : zinc II à 0,10 mol par litre : moins 0,79 volt.">
      <text x="200" y="24" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Relation de Nernst (25 °C)</text>
      <Boite x={14} y={36} w={372} h={88} fill="#fff7ed" stroke="#fdba74"/>
      <text x="20" y="94" fontSize="22" fontWeight="700" fill={COL.orange}>E = E° +</text>
      <text x="152" y="80" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>0,06</text><line x1="128" y1="87" x2="176" y2="87" stroke={COL.txt} strokeWidth="2"/><text x="152" y="108" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>n</text>
      <text x="190" y="94" fontSize="22" fontWeight="700" fill={COL.orange}>log</text>
      <text x="246" y="96" fontSize="30" fill={COL.txt}>(</text>
      <text x="312" y="78" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.bleu}>[Ox]</text><line x1="276" y1="86" x2="348" y2="86" stroke={COL.txt} strokeWidth="2"/><text x="312" y="108" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.vert}>[Red]</text>
      <text x="356" y="96" fontSize="30" fill={COL.txt}>)</text>
      <text x="22" y="148" fontSize="14.5" fontWeight="700" fill={COL.bleu}>[Ox] augmente : E augmente</text>
      <text x="22" y="170" fontSize="14.5" fontWeight="700" fill={COL.vert}>[Red] augmente : E diminue</text>
      <text x="22" y="192" fontSize="14.5" fontWeight="700" fill={COL.txt}>solide : on remplace sa « concentration » par 1</text>
      <text x="22" y="214" fontSize="14.5" fontWeight="700" fill={COL.txt}>E = E° si [Ox] = [Red]</text>
      <Boite x={14} y={226} w={372} h={52} fill="#f8fafc"/>
      <text x="200" y="248" fontSize="15" textAnchor="middle" fill={COL.txt}>Zn²⁺ à 0,10 mol/L : E = −0,76 + 0,06/2 × log(0,10)</text>
      <text x="200" y="270" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>E = {fr(ex)} V</text>
    </Carte>);
}

// carte 4 : droite E = f(log c)
export function SvgDroiteCarte() {
  return (
    <Carte label="Le potentiel est une fonction affine de log de la concentration : la pente vaut 0,06 sur n volt par décade, l'ordonnée à l'origine, pour log c égal 0, vaut E zéro. Pour n égal 1, 0,06 V par décade ; pour n égal 2, 0,03 V par décade.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>E = f(log c) est une droite</text>
      <rect x="40" y="36" width="320" height="140" fill="#f8fafc"/>
      <line x1="40" y1="176" x2="360" y2="176" stroke={COL.gris} strokeWidth="2.4"/><line x1="40" y1="36" x2="40" y2="176" stroke={COL.gris} strokeWidth="2.4"/>
      <line x1="320" y1="46" x2="320" y2="176" stroke={COL.orange} strokeWidth="1.8" strokeDasharray="4 4"/>
      <line x1="44" y1="150" x2="320" y2="62" stroke={COL.rouge} strokeWidth="3.4"/><line x1="44" y1="106" x2="320" y2="62" stroke={COL.vert} strokeWidth="3.4"/>
      <circle cx="320" cy="62" r="6.5" fill={COL.orange}/>
      <text x="312" y="50" fontSize="15" fontWeight="700" textAnchor="end" fill={COL.orange}>E° en log c = 0</text>
      <text x="64" y="76" fontSize="14.5" fontWeight="700" fill={COL.vert}>n = 2 : 0,03 V/décade</text>
      <text x="150" y="162" fontSize="14.5" fontWeight="700" fill={COL.rouge}>n = 1 : 0,06 V/décade</text>
      <text x="320" y="196" fontSize="14" textAnchor="middle" fill={COL.orange} fontWeight="700">log c = 0</text>
      <text x="46" y="54" fontSize="14" fill={COL.gris}>E</text>
      <text x="200" y="232" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>pente = 0,06 / n  (V par décade)</text>
      <text x="200" y="256" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>ordonnée à l’origine = E°</text>
      <text x="200" y="278" fontSize="14" textAnchor="middle" fill={COL.gris}>×10 sur [Ox] : E varie de 0,06 / n</text>
    </Carte>);
}

// carte 5 : bilan, trois leviers
export function SvgRecapCarte() {
  const levier = (x, titre, l1, l2, coul, fond, fl) => (<g>
    <Boite x={x} y={74} w={118} h={110} fill={fond} stroke="#cbd5e1"/>
    <text x={x + 59} y={98} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>{titre}</text>
    <text x={x + 59} y={138} fontSize="34" fontWeight="700" textAnchor="middle" fill={coul}>{fl}</text>
    <text x={x + 59} y={162} fontSize="14" fontWeight="700" textAnchor="middle" fill={coul}>{l1}</text><text x={x + 59} y={178} fontSize="13" fontWeight="700" textAnchor="middle" fill={coul}>{l2}</text></g>);
  return (
    <Carte label="Trois leviers sur le potentiel : plus d'oxydant fait monter E, plus de réducteur le fait baisser, et si des ions H+ figurent du côté de l'oxydant, une augmentation du pH fait baisser E.">
      <text x="200" y="24" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Ce qui fait varier E</text>
      <Boite x={50} y={34} w={300} h={30} fill="#fff7ed" stroke="#fdba74"/><text x="200" y="55" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.orange}>E = E° + (0,06 / n) log( [Ox] / [Red] )</text>
      {levier(8, '[Ox] augmente', 'E augmente', '+ 0,06/n par ×10', COL.bleu, '#eff6ff', '↑')}
      {levier(141, '[Red] augmente', 'E diminue', '− 0,06/n par ×10', COL.vert, '#f0fdf4', '↓')}
      {levier(274, 'pH augmente', 'E diminue', 'si H⁺ côté Ox', COL.rouge, '#fef2f2', '↓')}
      <text x="200" y="218" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>E ne dépend que de ces concentrations</text>
      <text x="200" y="240" fontSize="14" textAnchor="middle" fill={COL.txt}>et de n : plus n est grand, moins E varie</text>
      <text x="200" y="266" fontSize="14" textAnchor="middle" fill={COL.gris}>solides : 1 · à vide, sans courant · 25 °C</text>
    </Carte>);
}
