// Schémas de la simulation 309 (radioactivité, TSTL) : désintégration d'un noyau (nucléons dessinés un à un), graphes de décroissance, points-noyaux, compteur,
// sources d'activité en échelle logarithmique, protection, cartes « À retenir ».
import { C } from './vecteursVASchemas';
import * as M from './radPcmModele';
const stl = { userSelect: 'none', WebkitUserSelect: 'none', width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8, border: `1px solid ${C.clair}` };
const T = ({ x, y, children, c = C.encre, s = 14, w = 700, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtSci = M.fmtSci;
const COL_P = '#dc2626', COL_N = '#64748b', COL_E = '#1d4ed8', COL_POS = '#ea580c', COL_G = '#7c3aed';

// ───────────── nucléons d'un noyau : A points répartis (phyllotaxie), Z rouges (protons), N gris (neutrons) ─────────────
function Nucleons({ cx, cy, R, A, Z, op = 1 }) {
  const pts = [], r = Math.min(7, R * 0.95 * Math.sqrt(1 / Math.max(A, 1)) * 0.95), g = Math.PI * (3 - Math.sqrt(5));
  let p = 0;
  for (let i = 0; i < A; i++) {
    const rho = R * 0.92 * Math.sqrt((i + 0.5) / A), th = i * g, isP = Math.floor((i + 1) * Z / A) > Math.floor(i * Z / A) && p < Z;
    if (isP) p++;
    pts.push(<circle key={i} cx={cx + rho * Math.cos(th)} cy={cy + rho * Math.sin(th)} r={r} fill={isP ? COL_P : COL_N} stroke="#fff" strokeWidth="0.6" opacity={op}/>);
  }
  return <g>{pts}</g>;
}
const Noyau = ({ cx, cy, R, A, Z, op = 1, excite = false }) => (
  <g opacity={op}>
    <circle cx={cx} cy={cy} r={R + 4} fill="#f8fafc" stroke={excite ? C.orange : C.clair} strokeWidth={excite ? 3 : 1.6} strokeDasharray={excite ? '5 4' : undefined}/>
    <Nucleons cx={cx} cy={cy} R={R} A={A} Z={Z}/>
  </g>);
// particule émise (centrée en (x, y)) : α = 2p + 2n, électron, positon, photon (onde)
function Particule({ type, x, y }) {
  if (type === 'a') return <g><circle cx={x - 6} cy={y - 6} r="7" fill={COL_P} stroke="#fff"/><circle cx={x + 6} cy={y - 5} r="7" fill={COL_N} stroke="#fff"/><circle cx={x - 5} cy={y + 7} r="7" fill={COL_N} stroke="#fff"/><circle cx={x + 7} cy={y + 7} r="7" fill={COL_P} stroke="#fff"/></g>;
  if (type === 'b-') return <g><circle cx={x} cy={y} r="9" fill={COL_E} stroke="#fff" strokeWidth="1.5"/><text x={x} y={y + 4} fontSize="13" fontWeight="800" fill="#fff" textAnchor="middle">−</text></g>;
  if (type === 'b+') return <g><circle cx={x} cy={y} r="9" fill={COL_POS} stroke="#fff" strokeWidth="1.5"/><text x={x} y={y + 5} fontSize="14" fontWeight="800" fill="#fff" textAnchor="middle">+</text></g>;
  const d = Array.from({ length: 13 }, (_, i) => `${i ? 'L' : 'M'}${x - 24 + i * 4},${y + Math.sin(i * Math.PI / 1.5) * 8}`).join(' ');
  return <path d={d} fill="none" stroke={COL_G} strokeWidth="3" strokeLinecap="round"/>;
}
const NOM_PART = { a: 'particule α', 'b-': 'électron', 'b+': 'positon', g: 'photon γ' };
const lisse = p => p * p * (3 - 2 * p);

// n = noyau de M.NUCLEIDES ; gamma = { A, Z, s } pour un noyau excité qui émet un photon ; phase : null (état initial), 0..1 (émission en cours), 1 (état final)
// bilan : écrit les sommes de A et de Z sous le schéma
export function SceneNoyau({ n, gamma = null, phase = null, bilan = false, maxWidth = 440, aria, svgRef = null, children = null }) {
  const mode = gamma ? 'g' : n.mode, pere = gamma ? { ...gamma, N: gamma.A - gamma.Z } : n, fils = gamma ? gamma : n.fils;
  const p = phase === null ? 0 : Math.max(0, Math.min(1, phase)), q = lisse(p), apres = p > 0.5;
  const px = 108 + q * 205, part = mode === 'g' ? 'g' : mode;
  const Rp = 52, Rf = mode === 'a' ? 46 : 52;
  const nomPere = gamma ? M.noyau(pere.A, pere.Z, pere.s) + '*' : M.noyau(pere.A, pere.Z, pere.s), nomFils = M.noyau(fils.A, fils.Z, fils.s);
  const bil = M.PART[mode];
  return (
    <svg ref={svgRef} viewBox={`0 0 420 ${bilan ? 256 : 214}`} role="img" aria-label={aria} style={{ ...stl, maxWidth }}>
      <rect x="0" y="0" width="420" height="40" fill="#f1f5f9"/>
      <T x="12" y="26" s={15} c={C.gris}>{phase === null || !apres ? 'Avant : noyau père' : 'Après : noyau fils + particule émise'}</T>
      <Noyau cx={108} cy={104} R={Rp} A={pere.A} Z={pere.Z} op={apres ? Math.max(0, 1 - (q - 0.4) * 4) : 1} excite={!!gamma && !apres}/>
      <Noyau cx={108} cy={104} R={Rf} A={fils.A} Z={fils.Z} op={apres ? Math.min(1, (q - 0.4) * 4) : 0}/>
      {p > 0 && p < 1 && mode !== 'g' && <line x1="108" y1="104" x2={px} y2={104} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4"/>}
      {p > 0 && <Particule type={part} x={mode === 'g' ? 108 + q * 205 : px} y={104}/>}
      <T x="108" y="176" a="middle" s={18} c={C.encre}>{apres ? nomFils : nomPere}</T>
      <T x="108" y="196" a="middle" s={13} w={600} c={C.gris}>{apres ? `${fils.nom || M.noyau(0, 0, '')} ${fils.A}`.trim() : `${pere.nom || ''} ${pere.A}`.trim()}</T>
      {p > 0.55 && <g><T x="313" y="150" a="middle" s={13} w={600} c={C.gris}>{NOM_PART[part]}</T></g>}
      {children}
      {bilan && <g>
        <rect x="8" y="204" width="404" height="46" rx="8" fill="#f0fdf4" stroke="#86efac"/>
        <T x="16" y="224" s={14} c={C.encre}>{`A : ${pere.A} = ${fils.A} + ${bil.A}`}</T>
        <T x="16" y="243" s={14} c={C.encre}>{`Z : ${pere.Z} = ${fils.Z} + ${bil.Z < 0 ? '(' + String(bil.Z).replace('-', '−') + ')' : bil.Z}`}</T>
        <T x="410" y="224" s={13} a="end" w={600} c={C.gris}>nucléons conservés</T><T x="410" y="243" s={13} a="end" w={600} c={C.gris}>charge conservée</T>
      </g>}
    </svg>);
}

// ───────────── repère de graphe ─────────────
function repere({ w = 420, h = 250, xmax, xTicks, yTicks, ymax = 1, ymin = 0, xLabel, yLabel, lm = 56, bm = 40, tm = 14, rm = 14 }) {
  const X = t => lm + (t / xmax) * (w - lm - rm), Y = v => h - bm - ((v - ymin) / (ymax - ymin)) * (h - bm - tm);
  return { X, Y, w, h, lm, bm, tm, rm, ymin, ymax, svg: (
    <g>
      {yTicks.map(([v, l]) => <g key={'y' + v}><line x1={lm} y1={Y(v)} x2={w - rm} y2={Y(v)} stroke="#e2e8f0" strokeWidth="1"/><text x={lm - 5} y={Y(v) + 4} fontSize="12.5" fill={C.gris} textAnchor="end">{l}</text></g>)}
      {xTicks.map(([t, l]) => <g key={'x' + t}><line x1={X(t)} y1={tm} x2={X(t)} y2={h - bm} stroke="#f1f5f9" strokeWidth="1"/><text x={X(t)} y={h - bm + 17} fontSize="12.5" fill={C.gris} textAnchor="middle">{l}</text></g>)}
      <line x1={lm} y1={h - bm} x2={w - rm} y2={h - bm} stroke={C.encre} strokeWidth="2"/><line x1={lm} y1={tm} x2={lm} y2={h - bm} stroke={C.encre} strokeWidth="2"/>
      <text x={(lm + w - rm) / 2} y={h - 6} fontSize="13.5" fontWeight="700" fill={C.encre} textAnchor="middle">{xLabel}</text>
      <text x="14" y={(tm + h - bm) / 2} fontSize="13.5" fontWeight="700" fill={C.encre} textAnchor="middle" transform={`rotate(-90 14 ${(tm + h - bm) / 2})`}>{yLabel}</text>
    </g>) };
}
const courbe = (R, f, xmax, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const t = (i / n) * xmax; return `${i ? 'L' : 'M'}${R.X(t).toFixed(1)},${R.Y(f(t)).toFixed(1)}`; }).join(' ');

// Décroissance de N / N0 : courbe de la loi (bleu), pas d'Euler (escalier orange), tirage au hasard (points gris), niveau N0/2, curseur d'instant.
// opts : l (h⁻¹), tMax (h), yTicks, euler (Δt en h ou null), trace [{t, f}], niveau (fraction ou null), cursor (instant ou null), masqueCourbe (bool), points [{t, f}]
export function GrapheDecroissance({ l = 0.12, tMax = 12, xStep = 2, ymax = 1, yTicks = [[0, '0'], [0.5, 'N₀ ÷ 2'], [1, 'N₀']], euler = null, trace = null, niveau = null, cursor = null, masqueCourbe = false, points = null, xLabel = 'temps t (h)', yLabel = 'N (noyaux)', maxWidth = 440, aria, svgRef = null, children = null }) {
  const xt = []; for (let t = 0; t <= tMax + 1e-9; t += xStep) xt.push([t, String(t).replace('.', ',')]);
  const R = repere({ xmax: tMax, xTicks: xt, yTicks, ymax, xLabel, yLabel });
  const esc = euler ? M.escalier(1, l, euler, tMax) : null;
  return (
    <svg ref={svgRef} viewBox="0 0 420 250" role="img" aria-label={aria} style={{ ...stl, maxWidth }}>
      {R.svg}
      {niveau !== null && <g><line x1={R.lm} y1={R.Y(niveau)} x2={R.w - R.rm} y2={R.Y(niveau)} stroke={C.orange} strokeWidth="2" strokeDasharray="6 5"/></g>}
      {!masqueCourbe && <path d={courbe(R, t => Math.exp(-l * t), tMax)} fill="none" stroke={C.bleu} strokeWidth="3.2" strokeLinecap="round"/>}
      {esc && <g>
        <polyline fill="none" stroke={C.orange} strokeWidth="2.4" points={esc.flatMap((p, i) => (i === 0 ? [`${R.X(p.t)},${R.Y(p.N)}`] : [`${R.X(p.t)},${R.Y(esc[i - 1].N)}`, `${R.X(p.t)},${R.Y(p.N)}`])).join(' ')}/>
        {esc.map((p, i) => <circle key={i} cx={R.X(p.t)} cy={R.Y(p.N)} r="3.6" fill={C.orange} stroke="#fff" strokeWidth="1"/>)}
      </g>}
      {trace && <polyline fill="none" stroke={COL_N} strokeWidth="2" points={trace.map(p => `${R.X(p.t).toFixed(1)},${R.Y(p.f).toFixed(1)}`).join(' ')}/>}
      {points && points.map((p, i) => <circle key={i} cx={R.X(p.t)} cy={R.Y(p.f)} r="4.5" fill={C.orange} stroke="#fff" strokeWidth="1.3"/>)}
      {cursor !== null && <g><line x1={R.X(cursor)} y1={R.tm} x2={R.X(cursor)} y2={R.h - R.bm} stroke={C.violet} strokeWidth="2"/><circle cx={R.X(cursor)} cy={R.Y(Math.exp(-l * cursor))} r="5.5" fill={C.violet} stroke="#fff" strokeWidth="1.5"/></g>}
      {children && children(R)}
    </svg>);
}

// Graphe de ln(A) en fonction de t : deux points mesurés, droite de pente −λ
export function GrapheLn({ pts, tMax = 12, y0 = 6, y1 = 7.5, afficheDroite = true, maxWidth = 440, aria }) {
  const yt = []; for (let v = y0; v <= y1 + 1e-9; v += 0.5) yt.push([v, nbf(v, 1)]);
  const xt = []; for (let t = 0; t <= tMax; t += 2) xt.push([t, String(t)]);
  const R = repere({ xmax: tMax, xTicks: xt, yTicks: yt, ymin: y0, ymax: y1, xLabel: 'temps t (h)', yLabel: 'ln(A), A en Bq' });
  const a = pts[0], b = pts[pts.length - 1], pente = (Math.log(b.A) - Math.log(a.A)) / (b.t - a.t);
  return (
    <svg viewBox="0 0 420 250" role="img" aria-label={aria} style={{ ...stl, maxWidth }}>
      {R.svg}
      {afficheDroite && <line x1={R.X(0)} y1={R.Y(Math.log(a.A))} x2={R.X(tMax)} y2={R.Y(Math.log(a.A) + pente * tMax)} stroke={C.bleu} strokeWidth="2.6"/>}
      {pts.map((p, i) => <circle key={i} cx={R.X(p.t)} cy={R.Y(Math.log(p.A))} r="5.5" fill={C.orange} stroke="#fff" strokeWidth="1.5"/>)}
    </svg>);
}

// ───────────── noyaux sous forme de points (intacts en bleu, désintégrés en gris clair) ─────────────
export function PointsNoyaux({ n, instants, t, maxWidth = 440, aria, hauteur = 150 }) {
  const W = 420, H = hauteur, cols = Math.max(1, Math.round(Math.sqrt(n * (W / H)))), rows = Math.ceil(n / cols), cell = Math.min(W / cols, H / rows), r = Math.max(1.4, Math.min(9, cell * 0.38));
  const x0 = (W - cols * cell) / 2, y0 = (H - rows * cell) / 2;
  const pts = []; for (let i = 0; i < n; i++) { const dec = instants[i] <= t; pts.push(<circle key={i} cx={x0 + (i % cols + 0.5) * cell} cy={y0 + (Math.floor(i / cols) + 0.5) * cell} r={r} fill={dec ? '#e2e8f0' : C.bleu} stroke={dec ? '#cbd5e1' : 'none'} strokeWidth="0.8"/>); }
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ ...stl, maxWidth, background: '#f8fafc' }}>{pts}</svg>;
}

// ───────────── compteur : tube, afficheur du nombre de désintégrations comptées ─────────────
export function SceneCompteur({ n, dureeS, maxWidth = 360, aria }) {
  const chiffres = String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, ' ');
  return (
    <svg viewBox="0 0 360 170" role="img" aria-label={aria} style={{ ...stl, maxWidth }}>
      <rect x="10" y="30" width="150" height="110" rx="14" fill="#e2e8f0" stroke="#475569" strokeWidth="2.5"/>
      <rect x="26" y="52" width="118" height="30" rx="5" fill="#0f172a"/><text x="135" y="75" fontSize="21" fontWeight="800" fill="#4ade80" textAnchor="end" fontFamily="ui-monospace, monospace">{chiffres}</text>
      <text x="85" y="106" fontSize="13" fontWeight="700" fill="#475569" textAnchor="middle">désintégrations</text><text x="85" y="124" fontSize="13" fontWeight="700" fill="#475569" textAnchor="middle">comptées</text>
      <rect x="160" y="78" width="70" height="20" fill="#94a3b8" stroke="#475569" strokeWidth="2"/>
      <rect x="230" y="62" width="104" height="52" rx="26" fill="#f1f5f9" stroke="#475569" strokeWidth="2.5"/>
      {[0, 1, 2].map(i => <line key={i} x1={308 + i * 0} y1={74 + i * 14} x2={346 + 12} y2={74 + i * 14} stroke={C.orange} strokeWidth="2" strokeDasharray="5 4" transform={`translate(${-56 + i * 0},0)`}/>)}
      <text x="282" y="40" fontSize="13" fontWeight="700" fill={C.gris} textAnchor="middle">tube compteur</text>
      <rect x="10" y="146" width="150" height="20" rx="6" fill="#fef3c7" stroke={C.orange}/><text x="85" y="161" fontSize="13" fontWeight="700" fill={C.encre} textAnchor="middle">durée de comptage : {dureeS} s</text>
    </svg>);
}

// ───────────── sources d'activité : barres en échelle logarithmique ─────────────
export function SceneSources({ sources = M.SOURCES, surligne = null, maxWidth = 440, aria }) {
  const L0 = 150, L1 = 400, dec = 15, X = a => L0 + (Math.log10(a) / dec) * (L1 - L0), H = 28 + sources.length * 36 + 36;
  const cols = ['#15803d', '#0369a1', '#7c3aed', '#b45309', '#be185d', '#b91c1c'];
  return (
    <svg viewBox={`0 0 420 ${H}`} role="img" aria-label={aria} style={{ ...stl, maxWidth }}>
      {[0, 3, 6, 9, 12, 15].map(d => <g key={d}><line x1={L0 + d / dec * (L1 - L0)} y1="10" x2={L0 + d / dec * (L1 - L0)} y2={H - 34} stroke="#e2e8f0"/><text x={L0 + d / dec * (L1 - L0)} y={H - 18} fontSize="12.5" fill={C.gris} textAnchor="middle">{d === 0 ? '1' : `10${String(d).replace(/[0-9]/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`}</text></g>)}
      <text x={(L0 + L1) / 2} y={H - 3} fontSize="13" fontWeight="700" fill={C.encre} textAnchor="middle">activité A (Bq), échelle logarithmique</text>
      {sources.map((s, i) => { const y = 16 + i * 36, op = surligne && !surligne.includes(s.id) ? 0.35 : 1; return (
        <g key={s.id} opacity={op}><text x="6" y={y + 20} fontSize="13" fontWeight="700" fill={C.encre}>{s.nom}</text>
          <rect x={L0} y={y + 4} width={X(s.A) - L0} height="22" rx="5" fill={cols[i % cols.length]}/><text x={Math.min(X(s.A) + 5, L1 - 70)} y={y + 20} fontSize="12.5" fontWeight="700" fill={X(s.A) > 330 ? '#fff' : C.encre} textAnchor={X(s.A) > 330 ? 'end' : 'start'} dx={X(s.A) > 330 ? -(0) : 0}>{fmtSci(s.A, 1).replace(' × 10⁰', '')}</text></g>); })}
    </svg>);
}

// ───────────── protection : source, écran, personne ─────────────
const Trefle = ({ cx, cy, r = 20 }) => (
  <g><circle cx={cx} cy={cy} r={r + 4} fill="#fde047" stroke="#0f172a" strokeWidth="2"/>
    {[90, 210, 330].map(a => { const a0 = (a - 30) * Math.PI / 180, a1 = (a + 30) * Math.PI / 180; return <path key={a} d={`M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`} fill="#0f172a"/>; })}
    <circle cx={cx} cy={cy} r={r * 0.22} fill="#fde047" stroke="#0f172a" strokeWidth="1.5"/></g>);
const COL_RAY = { a: COL_P, b: COL_E, g: COL_G }, COL_ECR = { air: '#e2e8f0', alu: '#94a3b8', plomb: '#475569' };
const NOM_ECR = { air: 'papier', alu: 'aluminium', plomb: 'plomb' };
// rayon : 'a' | 'b' | 'g' ; ecran : 'air' | 'alu' | 'plomb' | null ; distance ∈ {1, 2, 3} (la personne s'éloigne) ; phase : animation des particules (0..1) ou null
export function SceneProtection({ rayon = 'b', ecran = null, distance = 1, phase = null, maxWidth = 440, aria, svgRef = null }) {
  const xs = 70, xe = 170, xp = 250 + (distance - 1) * 60, tr = ecran ? M.TRANSMIS[rayon][ecran] : 'passe', ys = [76, 100, 124];
  const avant = ecran ? xe - 7 : xp - 18, limite = ecran && tr === 'arrete' ? xe - 7 : xp - 18;
  const n = 7;
  return (
    <svg ref={svgRef} viewBox="0 0 420 200" role="img" aria-label={aria} style={{ ...stl, maxWidth }}>
      <rect x="0" y="160" width="420" height="40" fill="#f1f5f9"/>
      <Trefle cx={xs} cy={100} r={17}/><text x={xs} y={150} fontSize="13" fontWeight="700" fill={C.gris} textAnchor="middle">source</text>
      {ys.map((y, k) => <g key={k}>
        <line x1={xs + 24} y1={y} x2={avant} y2={y} stroke={COL_RAY[rayon]} strokeWidth={rayon === 'g' ? 2.4 : 3} strokeDasharray={rayon === 'g' ? '2 4' : undefined} opacity="0.85"/>
        {phase !== null && Array.from({ length: n }, (_, i) => { const f = (phase + i / n + k * 0.13) % 1, x = xs + 24 + f * (limite - xs - 24); return x < limite - 2 ? <circle key={i} cx={x} cy={y} r="3.6" fill={COL_RAY[rayon]}/> : null; })}
        {tr === 'reduit' && ecran && <line x1={xe + 10} y1={y} x2={xp - 18} y2={y} stroke={COL_RAY[rayon]} strokeWidth="1.5" strokeDasharray="2 6" opacity="0.7"/>}
        {tr === 'passe' && ecran && <line x1={xe + 10} y1={y} x2={xp - 18} y2={y} stroke={COL_RAY[rayon]} strokeWidth={rayon === 'g' ? 2.4 : 3} strokeDasharray={rayon === 'g' ? '2 4' : undefined} opacity="0.85"/>}
      </g>)}
      {ecran && <g><rect x={xe - 7} y="56" width={ecran === 'plomb' ? 22 : ecran === 'alu' ? 10 : 5} height="88" rx="3" fill={COL_ECR[ecran]} stroke="#334155" strokeWidth="1.8"/><text x={xe + 2} y="156" fontSize="12.5" fontWeight="700" fill={C.encre} textAnchor="middle">{NOM_ECR[ecran]}</text>
        {tr === 'arrete' && <text x={xe + 24} y="104" fontSize="24" fontWeight="800" fill={C.vert}>✓</text>}</g>}
      <g><circle cx={xp} cy="78" r="12" fill="#fcd9b6" stroke="#334155" strokeWidth="1.8"/><rect x={xp - 13} y="92" width="26" height="46" rx="8" fill="#38bdf8" stroke="#334155" strokeWidth="1.8"/>
        <text x={xp} y="156" fontSize="13" fontWeight="700" fill={C.gris} textAnchor="middle">personne</text></g>
      <text x="410" y="22" fontSize="13.5" fontWeight="700" fill={COL_RAY[rayon]} textAnchor="end">{M.NOM_RAYON[rayon]}</text>
    </svg>);
}

// ═══════════ Cartes « À retenir » (viewBox de 300 de large, affichées à environ 230 px sur téléphone) ═══════════
const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} role="img" style={{ ...stl, maxWidth: 320 }} aria-label={aria}>{children}</svg>;

// Les quatre émissions : particule, variation de A et de Z du noyau
export function SvgTypesCarte() {
  const L = [['α', 'a', '⁴₂He', '− 4', '− 2', COL_P], ['β⁻', 'b-', '⁰₋₁e', '0', '+ 1', COL_E], ['β⁺', 'b+', '⁰₊₁e', '0', '− 1', COL_POS], ['γ', 'g', 'photon', '0', '0', COL_G]];
  return (
    <Cadre h={230} aria="Les quatre émissions radioactives : alpha émet un noyau d'hélium 4 et le noyau perd 4 nucléons et 2 charges ; bêta moins émet un électron, A inchangé et Z augmente de 1 ; bêta plus émet un positon, A inchangé et Z diminue de 1 ; gamma émet un photon et ne change ni A ni Z.">
      <rect x="6" y="6" width="288" height="30" rx="8" fill="#f1f5f9"/>
      <T x="16" y="27" s={13} c={C.gris}>type</T><T x="80" y="27" s={13} c={C.gris}>émis</T><T x="190" y="27" s={13} c={C.gris} a="middle">A du noyau</T><T x="260" y="27" s={13} c={C.gris} a="middle">Z</T>
      {L.map(([n, , e, dA, dZ, c], i) => { const y = 44 + i * 44; return (
        <g key={n}><rect x="6" y={y} width="288" height="38" rx="9" fill="#fff" stroke={c} strokeWidth="1.8"/>
          <circle cx="30" cy={y + 19} r="14" fill={c}/><text x="30" y={y + 25} fontSize="17" fontWeight="800" fill="#fff" textAnchor="middle">{n}</text>
          <T x="62" y={y + 25} s={e === 'photon' ? 14 : 17} c={C.encre}>{e}</T>
          <T x="190" y={y + 25} s={16} a="middle" c={C.encre}>{dA}</T><T x="260" y={y + 25} s={16} a="middle" c={C.encre}>{dZ}</T></g>); })}
      <T x="150" y="224" s={13} a="middle" c={C.gris}>un noyau ne perd jamais ni nucléon ni charge</T>
    </Cadre>);
}
// Équation de désintégration : lois de conservation
export function SvgConservationCarte() {
  return (
    <Cadre h={214} aria="Équation de désintégration du cobalt 60 : le nombre de nucléons 60 se conserve et la charge 27 se conserve, car 28 plus moins 1 égale 27.">
      <rect x="10" y="10" width="280" height="56" rx="10" fill="#eff6ff" stroke={C.bleu} strokeWidth="1.8"/>
      <T x="150" y="46" s={20} a="middle" c={C.encre}>⁶⁰₂₇Co → ⁶⁰₂₈Ni + ⁰₋₁e</T>
      <T x="150" y="92" s={14} a="middle" c={C.bleu}>Σ A à gauche = Σ A à droite</T>
      <T x="150" y="114" s={14} a="middle" c={C.encre}>60 = 60 + 0</T>
      <T x="150" y="148" s={14} a="middle" c={C.rouge}>Σ Z à gauche = Σ Z à droite</T>
      <T x="150" y="170" s={14} a="middle" c={C.encre}>27 = 28 + (−1)</T>
      <T x="150" y="203" s={13} a="middle" c={C.gris}>Z compte les charges, A compte les nucléons</T>
    </Cadre>);
}
// Loi de décroissance : courbe, demi-vies successives, formules
export function SvgLoiCarte() {
  const R = repere({ w: 300, h: 150, xmax: 4, xTicks: [[0, '0'], [1, 't½'], [2, '2 t½'], [3, '3 t½']], yTicks: [[0, '0'], [0.5, '½'], [1, '1']], xLabel: '', yLabel: '', lm: 34, bm: 24, tm: 10, rm: 12 });
  return (
    <Cadre h={236} aria="Courbe de décroissance exponentielle de N divisé par N zéro : un demi après une demi-vie, un quart après deux, un huitième après trois. Formules : N égale N zéro exponentielle moins lambda t, et t demi égale ln 2 divisé par lambda.">
      <g>{R.svg}
        <path d={courbe(R, t => Math.exp(-Math.LN2 * t), 4)} fill="none" stroke={C.bleu} strokeWidth="3" strokeLinecap="round"/>
        {[1, 2, 3].map(k => <g key={k}><line x1={R.X(k)} y1={R.Y(2 ** -k)} x2={R.X(k)} y2={R.h - R.bm} stroke={C.orange} strokeDasharray="4 3" strokeWidth="1.6"/><circle cx={R.X(k)} cy={R.Y(2 ** -k)} r="4.5" fill={C.orange} stroke="#fff"/></g>)}
        <T x={R.X(1) + 8} y={R.Y(0.5) - 6} s={12.5} c={C.orange}>N₀/2</T><T x={R.X(2) + 8} y={R.Y(0.25) - 6} s={12.5} c={C.orange}>N₀/4</T><T x={R.X(3) + 6} y={R.Y(0.125) - 6} s={12.5} c={C.orange}>N₀/8</T></g>
      <rect x="10" y="160" width="280" height="68" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.6"/>
      <T x="150" y="184" s={15} a="middle" c={C.encre}>N(t) = N₀ e^(−λt)</T>
      <T x="150" y="206" s={15} a="middle" c={C.encre}>t½ = ln 2 ÷ λ</T>
      <T x="150" y="223" s={12.5} a="middle" c={C.gris} w={600}>λ et t½ en unités de temps inverses</T>
    </Cadre>);
}
// Activité : A = λ N, becquerel
export function SvgActiviteCarte() {
  return (
    <Cadre h={226} aria="L'activité d'une source est le nombre de désintégrations par seconde : A égale lambda fois N, en becquerel ; elle décroît comme N : A de t égale A zéro exponentielle moins lambda t.">
      <rect x="10" y="10" width="130" height="64" rx="10" fill="#dbeafe" stroke={C.bleu} strokeWidth="1.8"/><T x="75" y="36" s={14} a="middle" c={C.encre}>N noyaux</T><T x="75" y="58" s={13} a="middle" c={C.gris} w={600}>présents à l’instant t</T>
      <line x1="140" y1="42" x2="166" y2="42" stroke={C.gris} strokeWidth="3"/><polygon points="176,42 164,35 164,49" fill={C.gris}/>
      <rect x="176" y="10" width="114" height="64" rx="10" fill="#fef3c7" stroke={C.orange} strokeWidth="1.8"/><T x="233" y="36" s={14} a="middle" c={C.encre}>A = λ N</T><T x="233" y="58" s={13} a="middle" c={C.gris} w={600}>par seconde</T>
      <T x="150" y="104" s={15} a="middle" c={C.encre}>1 Bq = 1 désintégration par s</T>
      <T x="150" y="132" s={15} a="middle" c={C.encre}>A(t) = A₀ e^(−λt)</T>
      <rect x="10" y="150" width="280" height="66" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.6"/>
      <T x="150" y="173" s={13.5} a="middle" c={C.rouge}>λ en s⁻¹ pour avoir A en Bq</T>
      <T x="150" y="194" s={13.5} a="middle" c={C.encre} w={600}>λ en h⁻¹ donne des désintégrations par heure</T>
      <T x="150" y="210" s={12.5} a="middle" c={C.gris} w={600}>(1 h = 3 600 s)</T>
    </Cadre>);
}
// Protection : tableau rayonnement / écran
export function SvgProtectionCarte() {
  const ecr = [['papier', 'air'], ['alu', 'alu'], ['plomb', 'plomb']], ray = [['α', 'a', COL_P], ['β', 'b', COL_E], ['γ', 'g', COL_G]];
  const f = { arrete: ['#dcfce7', '#15803d', 'arrêté'], passe: ['#fee2e2', '#b91c1c', 'passe'], reduit: ['#fef3c7', '#b45309', 'atténué'] };
  return (
    <Cadre h={228} aria="Protection : les rayonnements alpha sont arrêtés par une feuille de papier, bêta par quelques millimètres d'aluminium, gamma sont atténués par du plomb épais sans jamais être complètement arrêtés. Il faut aussi s'éloigner de la source et réduire la durée d'exposition.">
      {ecr.map(([n], j) => <T key={n} x={106 + j * 64} y="22" s={13} a="middle" c={C.gris}>{n}</T>)}
      {ray.map(([nom, m, c], i) => <g key={nom}><circle cx="24" cy={52 + i * 42} r="15" fill={c}/><text x="24" y={58 + i * 42} fontSize="17" fontWeight="800" fill="#fff" textAnchor="middle">{nom}</text>
        {ecr.map(([, e], j) => { const [bg, fg, t] = f[M.TRANSMIS[m][e]]; return <g key={e}><rect x={76 + j * 64} y={34 + i * 42} width="60" height="36" rx="8" fill={bg} stroke={fg} strokeWidth="1.5"/><T x={106 + j * 64} y={57 + i * 42} s={13} a="middle" c={fg}>{t}</T></g>; })}</g>)}
      <rect x="10" y="164" width="280" height="56" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.6"/>
      <T x="150" y="186" s={14} a="middle" c={C.encre}>s’éloigner · mettre un écran</T><T x="150" y="207" s={14} a="middle" c={C.encre}>réduire la durée d’exposition</T>
    </Cadre>);
}
