// Schémas de la simulation 146 (Tensioactifs) : scène animée (concentration croissante) et schémas des cartes « À retenir ».
import * as M from "./tensioactifsModele";

import { COUL, teteDe } from "./tensioactifsCouleurs";

// générateur pseudo-aléatoire à graine : mêmes positions à chaque affichage (pas de remplissage ordonné)
function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const W = 420, H = 300, Y0 = 100;                                // largeur, hauteur, hauteur de l'interface
const MIC = [[105, 215], [300, 190], [210, 255], [330, 262]];    // centres des micelles (dans l'ordre d'apparition)
const PRE = (() => {
  const r = alea(146);
  const ordre = [...Array(M.NS).keys()];
  for (let i = ordre.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  const rang = []; ordre.forEach((slot, k) => { rang[slot] = k; });   // rang[slot] = ordre d'arrivée de la molécule dans ce créneau
  const vol = []; let essais = 0;
  while (vol.length < 12 && essais++ < 500) {
    const x = 24 + r() * (W - 48), y = Y0 + 28 + r() * (H - Y0 - 50);
    if (MIC.some(([cx, cy]) => Math.hypot(x - cx, y - cy) < 44) || vol.some(v => Math.hypot(x - v.x, y - v.y) < 30)) continue;
    vol.push({ x, y, a: r() * 360, d: r() * 3 });
  }
  return { rang, vol, jit: [...Array(M.NS)].map(() => r() * 3) };
})();

// monomère : tête ronde + queue ondulée (la tête est à l'origine, la queue part vers le haut)
function Mono({ tete, long = 26 }) {
  return (<g>
    <path d={`M0 -3 q3 ${-long / 4} 0 ${-long / 2} t0 ${-long / 2}`} fill="none" stroke={COUL.queue} strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="0" cy="0" r="4.6" fill={tete} stroke="white" strokeWidth="0.8"/>
  </g>);
}

function Micelle({ cx, cy, tete, n = 11 }) {
  const g = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    g.push(<g key={k}><line x1={cx + 5 * c} y1={cy + 5 * s} x2={cx + 18 * c} y2={cy + 18 * s} stroke={COUL.queue} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx={cx + 21.5 * c} cy={cy + 21.5 * s} r="3.9" fill={tete} stroke="white" strokeWidth="0.7"/></g>);
  }
  return <g>{g}</g>;
}

// ====================================================
//  Scène : x = c / CMC ; interface = 'air' (tension superficielle) ou 'huile' (émulsion)
// ====================================================
export function SceneTensioactif({ x, interf = 'air', tete = COUL.tete, aria, etiquettes = true }) {
  const e = M.etatScene(x);
  const slots = [];
  for (let i = 0; i < M.NS; i++) if (PRE.rang[i] < e.nSurf) slots.push(i);
  const huile = interf === 'huile';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={aria ?? 'Tensioactifs à l’interface et dans le volume'} style={{ display: 'block', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        .ta-a1 { animation: ta-j1 3.1s ease-in-out infinite; } .ta-a2 { animation: ta-j2 2.7s ease-in-out infinite; } .ta-a3 { animation: ta-j3 3.6s ease-in-out infinite; }
        .ta-v { animation: ta-v 4.2s ease-in-out infinite; }
        .ta-fond { animation: ta-fond 0.5s ease-out; }
        @keyframes ta-j1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(1.8px,-1px); } }
        @keyframes ta-j2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-1.6px,1.2px); } }
        @keyframes ta-j3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(1.2px,1.6px); } }
        @keyframes ta-v { 0%,100% { transform: translate(0,0); } 25% { transform: translate(4px,-3px); } 50% { transform: translate(-2px,4px); } 75% { transform: translate(-4px,-2px); } }
        @keyframes ta-fond { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .ta-a1, .ta-a2, .ta-a3, .ta-v, .ta-fond { animation: none; } }
      `}</style>
      <rect x="0" y="0" width={W} height={Y0} fill={huile ? COUL.huile : COUL.air}/>
      <rect x="0" y={Y0} width={W} height={H - Y0} fill={COUL.eau}/>
      <line x1="0" y1={Y0} x2={W} y2={Y0} stroke="#0369a1" strokeWidth="2"/>
      {etiquettes && <>
        <text x="10" y="18" fontSize="13" fontWeight="700" fill={COUL.gris}>{huile ? 'Huile' : 'Air'}</text>
        <text x="10" y={H - 10} fontSize="13" fontWeight="700" fill="#0369a1">Eau</text>
      </>}
      {slots.map(i => (
        <g key={`s${i}`} transform={`translate(${30 + i * 24}, ${Y0 + 1})`} className="ta-fond">
          <g className={['ta-a1', 'ta-a2', 'ta-a3'][i % 3]} style={{ animationDelay: `${-PRE.jit[i]}s` }}><Mono tete={tete}/></g>
        </g>))}
      {PRE.vol.slice(0, e.nVol).map((v, i) => (
        <g key={`v${i}`} transform={`translate(${v.x}, ${v.y}) rotate(${v.a})`} className="ta-fond">
          <g className="ta-v" style={{ animationDelay: `${-v.d}s` }}><Mono tete={tete} long={14}/></g>
        </g>))}
      {MIC.slice(0, e.nMic).map(([cx, cy], i) => <g key={`m${i}`} className="ta-fond"><Micelle cx={cx} cy={cy} tete={tete}/></g>)}
    </svg>
  );
}

// ---------- indicateurs ----------
export function JaugeTension({ x }) {
  const t = M.tensionRel(x);
  return (<div style={{ fontSize: 13.5, color: COUL.txt }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span>Tension superficielle (qualitatif)</span><strong>{x >= 1 ? 'plateau' : t > 0.9 ? 'élevée' : 'en baisse'}</strong></div>
    <div role="img" aria-label="Jauge qualitative de tension superficielle" style={{ height: 10, borderRadius: 5, background: '#e2e8f0' }}><div style={{ width: `${Math.round((t - 0.4) / 0.6 * 100)}%`, height: 10, borderRadius: 5, background: '#0369a1', transition: 'width 0.3s' }}/></div>
  </div>);
}

// courbe γ = f(log c) qualitative, avec le point courant (aucune valeur chiffrée)
export function CourbeTension({ x }) {
  const X = lx => 36 + (lx + 3) / 4 * 340, yy = xx => 20 + (1 - M.tensionRel(xx)) / 0.6 * 140;
  const p = Array.from({ length: 51 }, (_, k) => { const xx = M.xDeCurseur(k * 2); return `${X(Math.log10(xx)).toFixed(1)},${yy(xx).toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox="0 0 420 215" width="100%" role="img" aria-label="Tension superficielle en fonction du logarithme de la concentration" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
      <line x1="36" y1="14" x2="36" y2="172" stroke={COUL.txt} strokeWidth="1.5"/><line x1="36" y1="172" x2="384" y2="172" stroke={COUL.txt} strokeWidth="1.5"/>
      <text x="8" y="14" fontSize="14" fill={COUL.txt}>γ</text><text x="384" y="196" fontSize="13" textAnchor="end" fill={COUL.txt}>log c (on ajoute du tensioactif)</text>
      <polyline points={p} fill="none" stroke="#0369a1" strokeWidth="2.8"/>
      <circle cx={X(Math.log10(x))} cy={yy(x)} r="6" fill="#f5a31a" stroke="white" strokeWidth="1.5"/>
    </svg>);
}

// ---------- schémas des cartes « À retenir » ----------
const T = (x, y, s, o = {}) => <text x={x} y={y} fontSize={o.size ?? 13} fontWeight={o.gras ? 700 : 400} textAnchor={o.ancre ?? 'middle'} fill={o.fill ?? COUL.txt}>{s}</text>;
const svgBase = (h, aria, kids) => <svg viewBox={`0 0 420 ${h}`} width="100%" role="img" aria-label={aria} style={{ display: 'block', maxWidth: 420, margin: '8px auto' }}>{kids}</svg>;
const mini = (x, y, tete, signe) => <g transform={`translate(${x},${y})`}><Mono tete={tete} long={30}/>{signe && <text x="0" y="3.5" fontSize="10" fontWeight="700" textAnchor="middle" fill="white">{signe}</text>}</g>;

export function SvgFamilles() {
  const F = [['anionique', 'anionique (−)', 'SDS', '−'], ['cationique', 'cationique (+)', 'CTAB', '+'], ['amphotère', 'amphotère (+ et −)', 'sulfobétaïne', '±'], ['non ionique', 'non ionique (0)', 'maltoside', '']];
  return svgBase(170, 'Les quatre familles de tensioactifs selon la tête polaire', <>
    {F.map(([c, nom, ex, sg], i) => <g key={c}>{mini(55 + i * 103, 70, teteDe(c), sg)}{T(55 + i * 103, 102, nom, { gras: true, size: 12 })}{T(55 + i * 103, 120, ex, { fill: COUL.gris, size: 12 })}</g>)}
    {T(210, 18, 'même queue hydrophobe, quatre têtes hydrophiles possibles', { size: 13 })}
    {T(210, 156, 'on classe un tensioactif par la charge de sa tête', { fill: COUL.gris })}
  </>);
}

export function SvgStades() {
  const P = [[0.01, 'c ≪ CMC'], [0.3, 'c < CMC'], [0.8, 'c ≲ CMC'], [3, 'c > CMC']];
  return svgBase(185, 'Les quatre stades quand la concentration en tensioactif augmente', <>
    {P.map(([xx, nom], i) => { const x0 = 8 + i * 102; return (
      <g key={nom}><svg x={x0} y="8" width="98" height="130" viewBox="0 0 420 300"><SceneMiniature x={xx}/></svg>
        {T(x0 + 49, 156, nom, { gras: true, size: 13 })}</g>); })}
    {T(210, 176, 'surface qui se remplit, puis micelles dans le volume', { fill: COUL.gris })}
  </>);
}
function SceneMiniature({ x }) {
  const e = M.etatScene(x), slots = [];
  for (let i = 0; i < M.NS; i++) if (PRE.rang[i] < e.nSurf) slots.push(i);
  return (<g>
    <rect width={W} height={Y0} fill={COUL.air}/><rect y={Y0} width={W} height={H - Y0} fill={COUL.eau}/><line x1="0" y1={Y0} x2={W} y2={Y0} stroke="#0369a1" strokeWidth="4"/>
    {slots.map(i => <g key={i} transform={`translate(${30 + i * 24}, ${Y0 + 1}) scale(1.5)`}><Mono tete={COUL.tete}/></g>)}
    {PRE.vol.slice(0, e.nVol).map((v, i) => <g key={i} transform={`translate(${v.x}, ${v.y}) rotate(${v.a}) scale(1.5)`}><Mono tete={COUL.tete} long={14}/></g>)}
    {MIC.slice(0, e.nMic).map(([cx, cy], i) => <g key={i} transform={`translate(${cx * -0.5}, ${cy * -0.5}) scale(1.5)`}><Micelle cx={cx} cy={cy} tete={COUL.tete}/></g>)}
  </g>);
}

export function SvgMesureCMC() {
  const ax = (x0, y0, xl, yl) => <g><line x1={x0} y1="20" x2={x0} y2={y0} stroke={COUL.txt} strokeWidth="1.5"/><line x1={x0} y1={y0} x2={x0 + 160} y2={y0} stroke={COUL.txt} strokeWidth="1.5"/>{T(x0 + 160, y0 + 16, xl, { size: 12, ancre: 'end' })}{T(x0 - 2, 14, yl, { ancre: 'start' })}</g>;
  return svgBase(215, 'Deux courbes pour évaluer la CMC : tension superficielle et conductivité', <>
    {ax(30, 150, 'log c', 'γ')}<polyline points="30,40 135,125 190,125" fill="none" stroke="#0369a1" strokeWidth="2.8"/><line x1="135" y1="32" x2="135" y2="150" stroke="#b91c1c" strokeDasharray="5 4"/>{T(135, 24, 'CMC', { gras: true, fill: '#b91c1c' })}
    {T(110, 206, 'tensiométrie : la pente s’annule', { size: 12 })}
    {ax(240, 150, 'c', 'σ')}<polyline points="240,130 320,75 400,55" fill="none" stroke="#15803d" strokeWidth="2.8"/><line x1="320" y1="32" x2="320" y2="150" stroke="#b91c1c" strokeDasharray="5 4" transform="translate(0,0)"/>{T(320, 24, 'CMC', { gras: true, fill: '#b91c1c' })}
    {T(320, 206, 'conductimétrie : la pente diminue', { size: 12 })}
  </>);
}

export function SvgStructureCMC() {
  const ch = (x, y, n, tete) => <g transform={`translate(${x},${y})`}><path d={`M0 0 ${Array.from({ length: n }, (_, k) => `l8 ${k % 2 ? 5 : -5}`).join(' ')}`} fill="none" stroke={COUL.queue} strokeWidth="2.4" strokeLinecap="round"/><circle cx="-8" cy="0" r="6" fill={tete}/></g>;
  return svgBase(190, 'Structure et CMC : chaîne plus longue et tête non ionique abaissent la CMC', <>
    {T(210, 16, 'chaîne plus longue : plus hydrophobe, CMC plus faible', { gras: true })}
    {ch(40, 52, 6, COUL.tete)}{T(130, 56, 'C10', { size: 12 })}{T(210, 56, 'CMC élevée', { ancre: 'start', fill: COUL.gris })}
    {ch(40, 88, 12, COUL.tete)}{T(175, 92, 'C14', { size: 12 })}{T(210, 92, 'CMC faible', { ancre: 'start', fill: '#15803d', gras: true })}
    {T(210, 126, 'tête non chargée : pas de répulsion, CMC plus faible', { gras: true })}
    {T(110, 152, 'ionique (−)', { size: 12 })}{T(110, 172, 'CMC plus élevée', { size: 12, fill: COUL.gris })}
    {T(310, 152, 'non ionique', { size: 12 })}{T(310, 172, 'CMC plus faible', { size: 12, fill: '#15803d', gras: true })}
  </>);
}

export function SvgMolecule({ fam, n, titre, annoter = false }) {
  const dx = Math.min(20, 230 / (n - 1)), ye = 98, X0 = 14;
  const pts = Array.from({ length: n }, (_, k) => [X0 + k * dx, ye - ((n - 1 - k) % 2) * 10]);
  const [xe] = pts[n - 1], B = COUL.tete, E = { stroke: B, strokeWidth: 2, strokeLinecap: 'round' };
  const L = (x1, y1, x2, y2, c = B) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2" strokeLinecap="round"/>;
  const D = (x1, y1, x2, y2) => { const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, ox = Math.cos(a) * 2.2, oy = Math.sin(a) * 2.2; return <g>{L(x1 + ox, y1 + oy, x2 + ox, y2 + oy)}{L(x1 - ox, y1 - oy, x2 - ox, y2 - oy)}</g>; };
  const A = (x, y, s, c = B) => <g><circle cx={x} cy={y} r="9" fill="white"/><text x={x} y={y + 5.5} fontSize="16" fontWeight="700" textAnchor="middle" fill={c}>{s}</text></g>;
  const Tx = (x, y, s, anc = 'start') => <text x={x} y={y} fontSize="15" fill={B} textAnchor={anc}>{s}</text>;
  const ox = xe, oy = ye;                        // dernier carbone : la tête part vers le haut puis le bas, en zigzag
  let tete = null, largeur = 90;
  if (fam === 'sulfate') {
    largeur = 156;
    tete = <g>{L(ox, oy, ox + 25, oy - 15)}{L(ox + 25, oy - 15, ox + 51, oy)}{D(ox + 51, oy, ox + 51, oy - 33)}{D(ox + 51, oy, ox + 51, oy + 33)}{L(ox + 51, oy, ox + 76, oy - 15)}
      {A(ox + 25, oy - 15, 'O')}{A(ox + 51, oy, 'S')}{A(ox + 51, oy - 36, 'O')}{A(ox + 51, oy + 36, 'O')}{A(ox + 79, oy - 15, 'O⁻', '#b91c1c')}{Tx(ox + 99, oy - 9, 'Na⁺')}</g>;
  } else if (fam === 'ammonium') {
    largeur = 164;
    tete = <g>{L(ox, oy, ox + 25, oy - 15)}{L(ox + 25, oy - 15, ox + 25, oy - 48)}{L(ox + 25, oy - 15, ox + 60, oy - 15)}{L(ox + 25, oy - 15, ox + 25, oy + 18)}
      {A(ox + 25, oy - 15, 'N⁺', '#0369a1')}{Tx(ox + 25, oy - 54, 'CH₃', 'middle')}<text x={ox + 66} y={oy - 9} fontSize="15" fill={B}>CH₃</text>{Tx(ox + 25, oy + 37, 'CH₃', 'middle')}{Tx(ox + 114, oy + 37, 'Br⁻')}</g>;
  } else if (fam === 'phosphine') {
    largeur = 120;
    tete = <g>{L(ox, oy, ox + 25, oy - 15)}{D(ox + 25, oy - 15, ox + 25, oy - 48)}{L(ox + 25, oy - 15, ox + 60, oy - 15)}{L(ox + 25, oy - 15, ox + 25, oy + 18)}
      {A(ox + 25, oy - 15, 'P')}{A(ox + 25, oy - 51, 'O')}<text x={ox + 66} y={oy - 9} fontSize="15" fill={B}>CH₃</text>{Tx(ox + 25, oy + 37, 'CH₃', 'middle')}</g>;
  } else if (fam === 'sulfobetaine') {
    largeur = 186;
    tete = <g>{L(ox, oy, ox + 25, oy - 15)}{L(ox + 25, oy - 15, ox + 25, oy - 48)}{L(ox + 25, oy - 15, ox + 25, oy + 18)}{L(ox + 25, oy - 15, ox + 51, oy)}{L(ox + 51, oy, ox + 76, oy - 15)}{L(ox + 76, oy - 15, ox + 101, oy)}{L(ox + 101, oy, ox + 126, oy - 15)}
      {D(ox + 126, oy - 15, ox + 126, oy - 48)}{D(ox + 126, oy - 15, ox + 126, oy + 18)}{L(ox + 126, oy - 15, ox + 153, oy)}
      {A(ox + 25, oy - 15, 'N⁺')}{Tx(ox + 25, oy - 54, 'CH₃', 'middle')}{Tx(ox + 25, oy + 37, 'CH₃', 'middle')}{A(ox + 126, oy - 15, 'S')}{A(ox + 126, oy - 51, 'O')}{A(ox + 126, oy + 21, 'O')}{A(ox + 155, oy, 'O⁻', '#b91c1c')}</g>;
  } else if (fam === 'glucamide') {
    largeur = 224;
    tete = <g>{D(ox, oy, ox, oy - 33)}{L(ox, oy, ox + 25, oy - 15)}{A(ox, oy - 36, 'O')}{L(ox + 25, oy - 15, ox + 25, oy + 18)}{L(ox + 25, oy - 15, ox + 51, oy)}
      {A(ox + 25, oy - 15, 'N')}{Tx(ox + 25, oy + 37, 'CH₃', 'middle')}<text x={ox + 56} y={oy + 6} fontSize="15" fill={B}>CH₂(CHOH)₄CH₂OH</text></g>;
  } else {                                          // maltoside : deux unités glucose (hexagones plats)
    const R = 21, o1 = ox + 26, c1 = o1 + 17 + R, o2 = c1 + R + 17, c2 = o2 + 17 + R;
    const hex = cx => Array.from({ length: 6 }, (_, k) => `${(cx + R * Math.cos(k * Math.PI / 3)).toFixed(1)},${(oy - 15 + R * Math.sin(k * Math.PI / 3)).toFixed(1)}`).join(' ');
    const oh = cx => <g>{L(cx - R / 2, oy - 15 + 0.866 * R, cx - R / 2, oy - 15 + 0.866 * R + 10)}{Tx(cx - R / 2, oy - 15 + 0.866 * R + 26, 'OH', 'middle')}</g>;
    largeur = c2 + R + 4 - ox;
    tete = <g>{L(ox, oy, o1, oy - 15)}{L(o1, oy - 15, c1 - R, oy - 15)}<polygon points={hex(c1)} fill="#f0f9ff" {...E}/>{L(c1 + R, oy - 15, o2, oy - 15)}{L(o2, oy - 15, c2 - R, oy - 15)}<polygon points={hex(c2)} fill="#f0f9ff" {...E}/>
      {A(o1, oy - 15, 'O')}{A(o2, oy - 15, 'O')}{A(c1 + R / 2, oy - 15 - 0.866 * R, 'O')}{A(c2 + R / 2, oy - 15 - 0.866 * R, 'O')}{oh(c1)}{oh(c2)}</g>;
  }
  const W2 = Math.max(350, xe + largeur + 16);
  return (
    <svg viewBox={`0 0 ${W2} ${annoter ? 198 : 166}`} width="100%" role="img" aria-label={`Formule simplifiée : ${titre ?? ''}`} style={{ display: 'block', maxWidth: 480, margin: '0 auto' }}>
      {titre && <text x="8" y="18" fontSize="16" fontWeight="700" fill={COUL.txt}>{titre}</text>}
      <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={COUL.queue} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      {tete}
      {annoter ? <>
        <line x1={X0} y1="150" x2={xe} y2="150" stroke={COUL.queue} strokeWidth="2"/><text x={(X0 + xe) / 2} y="170" fontSize="16" fontWeight="700" textAnchor="middle" fill={COUL.queue}>queue hydrophobe</text><text x={(X0 + xe) / 2} y="188" fontSize="15" textAnchor="middle" fill={COUL.queue}>({n} carbones)</text>
        <line x1={xe + 8} y1="150" x2={xe + largeur} y2="150" stroke="#b91c1c" strokeWidth="2"/><text x={xe + 8 + (largeur - 8) / 2} y="170" fontSize="16" fontWeight="700" textAnchor="middle" fill="#b91c1c">tête hydrophile</text>
      </> : <text x={(X0 + xe) / 2} y="158" fontSize="15" textAnchor="middle" fill={COUL.gris}>chaîne de {n} carbones (un sommet = un carbone)</text>}
    </svg>);
}
