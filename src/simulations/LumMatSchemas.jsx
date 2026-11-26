// Schémas de la simulation 300 « Photons, niveaux d'énergie et domaines spectraux ». SVG, largeur 100 % plafonnée.
import { C } from "./synthCouleurModele";
import { niveauH, raieH } from "./lumMatModele";

const K = { txt: '#0f172a', gris: '#64748b', clair: '#cbd5e1', el: '#7c3aed', vib: '#b45309', rot: '#0f766e', rouge: '#b91c1c', vert: '#15803d', bleu: '#1d4ed8' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" stroke={o.halo ? '#fff' : 'none'} strokeWidth={o.halo ? 3 : 0} paintOrder="stroke">{s}</text>;
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const couleurLam = l => (l >= 400 && l <= 700 ? C.cssXYNormalise(C.pointLieu(l).x, C.pointLieu(l).y) : l < 400 ? '#6d28d9' : '#7f1d1d');
const Frac = (x, y, n, d, o = {}) => [T(x, y - 4, n, { size: o.size ?? 13, ...o }), <line key={`f${x}${y}`} x1={x - (o.l ?? 9)} y1={y} x2={x + (o.l ?? 9)} y2={y} stroke={o.fill ?? K.txt} strokeWidth="1.3"/>, T(x, y + 13, d, { size: o.size ?? 13, ...o })];
const flecheV = (x, y1, y2, col, w, op = 1, id) => (<g key={id} opacity={op}><line x1={x} y1={y1} x2={x} y2={y2 + (y2 < y1 ? 6 : -6)} stroke={col} strokeWidth={w}/><polygon points={y2 < y1 ? `${x - 5},${y2 + 9} ${x + 5},${y2 + 9} ${x},${y2}` : `${x - 5},${y2 - 9} ${x + 5},${y2 - 9} ${x},${y2}`} fill={col}/></g>);
const svgStyle = { display: 'block', maxWidth: 480, margin: '0 auto' };

// ---------- échelle des longueurs d'onde (log) ----------
const BANDES = [[100, 400, '#c4b5fd', 'UV'], [400, 780, null, 'visible'], [780, 2500, '#fecaca', 'proche IR'], [2500, 20000, '#fdba74', 'IR moyen'], [20000, 1e7, '#99f6e4', 'IR lointain, micro-ondes']];
const lx = l => 20 + (Math.log10(Math.max(100, Math.min(1e7, l))) - 2) / 5 * 300;
export function SceneEchelle({ lam }) {
  return (<svg role="img" aria-label="Échelle des longueurs d'onde et nature des transitions" viewBox="0 0 340 186" width="100%" style={svgStyle}>
    <defs><linearGradient id="lm-arc" x1="0" x2="1">{[400, 450, 500, 550, 600, 650, 700, 780].map((l, i) => <stop key={l} offset={`${i / 7 * 100}%`} stopColor={couleurLam(Math.min(l, 700))}/>)}</linearGradient></defs>
    {BANDES.map(([a, b, col, nom]) => <rect key={nom} x={lx(a)} y="62" width={lx(b) - lx(a)} height="20" fill={col ?? 'url(#lm-arc)'} stroke="#94a3b8" strokeWidth="0.8"/>)}
    {T(lx(100) + 18, 100, 'UV', { size: 12 })}{T(lx(590) - 6, 116, 'visible', { size: 12 })}{T(lx(1400) + 8, 100, 'proche IR', { size: 12 })}{T(lx(7000), 116, 'IR moyen', { size: 12 })}{T(lx(1.5e6), 100, 'IR lointain, micro-ondes', { size: 12 })}
    <line x1={lx(100)} y1="128" x2={lx(780)} y2="128" stroke={K.el} strokeWidth="2.5"/>{T((lx(100) + lx(780)) / 2 - 6, 144, 'électronique', { size: 12, fill: K.el, gras: true })}
    <line x1={lx(2500) + 2} y1="128" x2={lx(20000) - 2} y2="128" stroke={K.vib} strokeWidth="2.5"/>{T(lx(7000) + 8, 144, 'vibration', { size: 12, fill: K.vib, gras: true })}
    <line x1={lx(20000) + 2} y1="128" x2={lx(1e7)} y2="128" stroke={K.rot} strokeWidth="2.5"/>{T(lx(1.5e6), 144, 'rotation', { size: 12, fill: K.rot, gras: true })}
    {[[100, '100 nm'], [1000, '1 µm'], [1e4, '10 µm'], [1e5, '100 µm'], [1e6, '1 mm']].map(([l, t]) => <g key={t}><line x1={lx(l)} y1="82" x2={lx(l)} y2="88" stroke={K.gris}/>{T(lx(l), 162, t, { size: 11, fill: K.gris })}<line x1={lx(l)} y1="148" x2={lx(l)} y2="152" stroke="none"/></g>)}
    {lam != null && <g><line x1={lx(lam)} y1="30" x2={lx(lam)} y2="82" stroke="#0f172a" strokeWidth="2.2"/><polygon points={`${lx(lam) - 5},30 ${lx(lam) + 5},30 ${lx(lam)},40`} fill="#0f172a"/>
      {T(Math.max(40, Math.min(300, lx(lam))), 22, lam >= 1000 ? `λ = ${fr(lam / 1000, lam >= 1e5 ? 0 : 1)} µm` : `λ = ${fr(lam, 0)} nm`, { size: 13, gras: true })}</g>}
    {T(170, 180, 'échelle logarithmique', { size: 11, fill: K.gris })}
  </svg>);
}

// ---------- niveaux d'énergie d'une molécule ----------
export function SceneNiveaux({ actif = null }) {
  const op = k => (actif == null || actif === k ? 1 : 0.3), w = k => (actif === k ? 4 : 2.4);
  return (<svg role="img" aria-label="Niveaux d'énergie électroniques, vibrationnels et rotationnels d'une molécule" viewBox="0 0 340 262" width="100%" style={svgStyle}>
    {flecheV(16, 244, 24, K.gris, 1.6, 1, 'ax')}{T(16, 14, 'E', { size: 13, gras: true })}
    <line x1="40" y1="215" x2="180" y2="215" stroke="#0f172a" strokeWidth="2.6"/><line x1="40" y1="200" x2="180" y2="200" stroke="#64748b" strokeWidth="1.2"/><line x1="40" y1="186" x2="180" y2="186" stroke="#64748b" strokeWidth="1.2"/>
    <line x1="40" y1="70" x2="180" y2="70" stroke="#0f172a" strokeWidth="2.6"/><line x1="40" y1="56" x2="180" y2="56" stroke="#64748b" strokeWidth="1.2"/><line x1="40" y1="42" x2="180" y2="42" stroke="#64748b" strokeWidth="1.2"/>
    {T(190, 74, 'état électronique excité', { anchor: 'start', size: 12 })}{T(40, 236, 'état électronique fondamental', { anchor: 'start', size: 12 })}
    {T(190, 203, 'v = 1', { anchor: 'start', size: 11, fill: K.gris })}{T(190, 189, 'v = 2', { anchor: 'start', size: 11, fill: K.gris })}
    {flecheV(62, 214, 72, K.el, w('el'), op('el'), 'el')}{T(76, 118, 'électronique', { size: 12, fill: K.el, gras: true, anchor: 'start' })}{T(76, 132, '1 à 10 eV', { size: 12, fill: K.el, anchor: 'start' })}
    {flecheV(130, 214, 201, K.vib, w('vib'), op('vib'), 'vib')}{T(120, 168, 'vibration', { size: 12, fill: K.vib, gras: true, anchor: 'start' })}{T(120, 182, '0,06 à 0,5 eV', { size: 12, fill: K.vib, anchor: 'start' })}
    <g opacity={op('rot')}><line x1="250" y1="236" x2="322" y2="236" stroke="#0f172a" strokeWidth="2"/><line x1="250" y1="222" x2="322" y2="222" stroke="#0f172a" strokeWidth="1.2"/><line x1="250" y1="208" x2="322" y2="208" stroke="#0f172a" strokeWidth="1.2"/>
      <line x1="180" y1="215" x2="250" y2="236" stroke="#94a3b8" strokeDasharray="3 3"/><line x1="180" y1="215" x2="250" y2="208" stroke="#94a3b8" strokeDasharray="3 3"/></g>
    {flecheV(286, 235, 223, K.rot, w('rot'), op('rot'), 'rot')}{T(286, 190, 'rotation', { size: 12, fill: K.rot, gras: true })}{T(286, 176, '10⁻⁴ à 10⁻² eV', { size: 12, fill: K.rot })}{T(286, 254, '(zoom sur v = 0)', { size: 11, fill: K.gris })}
    {T(190, 12, 'schéma non à l’échelle', { size: 11, fill: K.gris })}
  </svg>);
}

// ---------- atome d'hydrogène ----------
const YN = { 1: 205, 2: 135, 3: 95, 4: 68, 5: 48, 6: 32 };
export function SceneAtome({ ni, nf }) {
  const l = raieH(ni, nf), col = couleurLam(l), x = 90;
  return (<svg role="img" aria-label="Diagramme d'énergie de l'atome d'hydrogène" viewBox="0 0 340 236" width="100%" style={svgStyle}>
    {[1, 2, 3, 4, 5, 6].map(n => <g key={n}><line x1="40" y1={YN[n]} x2="180" y2={YN[n]} stroke={n === ni || n === nf ? '#0f172a' : '#94a3b8'} strokeWidth={n === ni || n === nf ? 2.6 : 1.5}/>
      {T(188, YN[n] + 4, `n = ${n} : ${fr(niveauH(n), 2)} eV`, { anchor: 'start', size: 12 })}</g>)}
    <line x1="40" y1="14" x2="180" y2="14" stroke="#cbd5e1" strokeDasharray="4 3"/>{T(188, 18, 'n = ∞ : 0 eV', { anchor: 'start', size: 12, fill: K.gris })}
    {flecheV(x, YN[ni], YN[nf], col === '#7f1d1d' ? '#7f1d1d' : col, 4, 1, 'h')}
    {T(x + 14, (YN[ni] + YN[nf]) / 2 + 4, `${ni} → ${nf}`, { anchor: 'start', size: 12.5, gras: true, halo: true })}
    {T(170, 232, 'schéma non à l’échelle', { size: 11, fill: K.gris })}
  </svg>);
}

// ---------- émission, absorption, diffusion ----------
export function SceneInteractions({ actif = null }) {
  const cadre = k => ({ stroke: actif === k ? '#ea580c' : '#cbd5e1', strokeWidth: actif === k ? 3 : 1.2, fill: actif === k ? '#fff7ed' : '#f8fafc' });
  const rayon = (x1, y1, x2, y2, col = '#b45309', w = 2) => <line key={`${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={w}/>;
  return (<svg role="img" aria-label="Émission, absorption et diffusion de la lumière par la matière" viewBox="0 0 340 150" width="100%" style={svgStyle}>
    <rect x="4" y="4" width="106" height="142" rx="9" {...cadre('emission')}/><rect x="117" y="4" width="106" height="142" rx="9" {...cadre('absorption')}/><rect x="230" y="4" width="106" height="142" rx="9" {...cadre('diffusion')}/>
    <circle cx="57" cy="52" r="13" fill="#fde047" stroke="#a16207" strokeWidth="1.5"/>{[0, 45, 90, 135, 180, 225, 270, 315].map(a => rayon(57 + 18 * Math.cos(a * Math.PI / 180), 52 + 18 * Math.sin(a * Math.PI / 180), 57 + 34 * Math.cos(a * Math.PI / 180), 52 + 34 * Math.sin(a * Math.PI / 180)))}
    {T(57, 108, 'émission', { gras: true, size: 13 })}{T(57, 125, 'la matière', { size: 12 })}{T(57, 139, 'émet', { size: 12 })}
    <rect x="152" y="32" width="36" height="42" fill="#bfdbfe" stroke="#3b82f6"/>{rayon(124, 53, 152, 53, '#b45309', 4)}{rayon(188, 53, 216, 53, '#b45309', 1.2)}
    {T(170, 108, 'absorption', { gras: true, size: 13 })}{T(170, 125, 'moins de lumière', { size: 12 })}{T(170, 139, 'en sortie', { size: 12 })}
    <rect x="270" y="32" width="26" height="42" fill="#bfdbfe" stroke="#3b82f6"/>{rayon(238, 53, 270, 53, '#b45309', 3)}{[[-35, -28], [-35, 0], [-35, 28], [0, -30], [0, 30]].map(([dx, dy]) => rayon(296, 53, 296 + dx * -0.9 + 12, 53 + dy, '#b45309', 1.4))}
    {T(283, 108, 'diffusion', { gras: true, size: 13 })}{T(283, 125, 'relancée dans', { size: 12 })}{T(283, 139, 'toutes directions', { size: 12 })}
  </svg>);
}

// ---------- spectre d'absorbance UV-visible et spectre de transmittance IR ----------
const gauss = (x, m, s, h) => h * Math.exp(-0.5 * ((x - m) / s) ** 2);
export function SceneDeuxSpectres({ actif = null }) {
  const pts = (f, n = 60) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
  const uv = pts(t => { const l = 200 + 600 * t; return 0.04 + gauss(l, 270, 22, 0.75) + gauss(l, 450, 38, 1.0); });
  const ir = pts(t => { const s = 4000 - 3500 * t; return 0.96 - gauss(s, 2950, 90, 0.35) - gauss(s, 1710, 38, 0.82) - gauss(s, 1200, 70, 0.4) - gauss(s, 3350, 220, 0.0); });
  const path = (v, x0, w, y0, h, inv) => v.map((y, i) => `${i ? 'L' : 'M'}${(x0 + i / (v.length - 1) * w).toFixed(1)},${(inv ? y0 - y * h : y0 - y * h).toFixed(1)}`).join(' ');
  const cadre = k => ({ stroke: actif === k ? '#ea580c' : '#cbd5e1', strokeWidth: actif === k ? 3 : 1.2, fill: actif === k ? '#fff7ed' : '#fff' });
  return (<svg role="img" aria-label="Spectre UV-visible en absorbance et spectre infrarouge en transmittance" viewBox="0 0 340 190" width="100%" style={svgStyle}>
    <rect x="4" y="4" width="162" height="182" rx="9" {...cadre('uv')}/><rect x="174" y="4" width="162" height="182" rx="9" {...cadre('ir')}/>
    {T(85, 22, 'UV-visible', { gras: true, size: 13 })}{T(255, 22, 'Infrarouge', { gras: true, size: 13 })}
    <line x1="22" y1="140" x2="154" y2="140" stroke={K.gris}/><line x1="22" y1="140" x2="22" y2="36" stroke={K.gris}/><path d={path(uv, 22, 132, 140, 96)} fill="none" stroke={K.el} strokeWidth="2.6"/>
    {T(22, 154, '200', { size: 11, fill: K.gris })}{T(154, 154, '800 nm', { size: 11, fill: K.gris, anchor: 'end' })}{T(30, 36, 'A', { size: 12, gras: true, anchor: 'start' })}{T(88, 170, 'bande : maximum d’absorbance', { size: 11, fill: K.gris })}
    <line x1="192" y1="140" x2="324" y2="140" stroke={K.gris}/><line x1="192" y1="140" x2="192" y2="36" stroke={K.gris}/><path d={path(ir, 192, 132, 140, 96)} fill="none" stroke={K.vib} strokeWidth="2.6"/>
    {T(192, 154, '4000', { size: 11, fill: K.gris, anchor: 'start' })}{T(324, 154, '500 cm⁻¹', { size: 11, fill: K.gris, anchor: 'end' })}{T(200, 36, 'T', { size: 12, gras: true, anchor: 'start' })}{T(258, 170, 'bande : creux de transmittance', { size: 11, fill: K.gris })}
  </svg>);
}

// ---------- cartes « À retenir » (viewBox 300, textes ≥ 12,5) ----------
const carte = (aria, h, children) => <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>{children}</svg>;
export function SvgCarteConversions() {
  return carte('Un photon : énergie, fréquence, nombre d’onde, longueur d’onde', 262, <>
    {T(150, 20, 'Un photon, quatre grandeurs', { size: 15, gras: true })}
    <rect x="6" y="32" width="288" height="50" rx="9" fill="#fff7ed" stroke="#fdba74"/>{T(150, 62, 'E = h·ν = h·c·σ', { size: 18, gras: true })}
    <rect x="6" y="90" width="138" height="62" rx="9" fill="#eff6ff" stroke="#93c5fd"/>{T(36, 126, 'ν =', { size: 16, gras: true })}{Frac(78, 124, 'c', 'λ', { size: 16, l: 10 })}{T(110, 126, 'en Hz', { size: 12.5, anchor: 'start', fill: K.gris })}
    <rect x="156" y="90" width="138" height="62" rx="9" fill="#eff6ff" stroke="#93c5fd"/>{T(186, 126, 'σ =', { size: 16, gras: true })}{Frac(228, 124, '1', 'λ', { size: 16, l: 10 })}{T(248, 126, 'en cm⁻¹', { size: 12.5, anchor: 'start', fill: K.gris })}
    {T(150, 176, 'λ petite  →  E grande', { size: 15, gras: true, fill: K.rouge })}
    {T(150, 198, 'h = 6,63·10⁻³⁴ J·s ; c = 3,00·10⁸ m/s', { size: 12.5 })}{T(150, 214, '1 eV = 1,60·10⁻¹⁹ J', { size: 12.5 })}
    {T(150, 238, '600 nm : E ≈ 2,1 eV', { size: 13, fill: K.gris })}{T(150, 254, '1000 cm⁻¹ : λ = 10 µm', { size: 13, fill: K.gris })}
  </>);
}
export function SvgCarteNiveaux() {
  const ligne = (y, col, tit, e, dom, lng) => <g key={tit}><rect x="6" y={y} width="288" height="66" rx="9" fill="#fff" stroke={col} strokeWidth="2"/>
    {flecheV(30, y + 54, y + 54 - lng, col, 4, 1, tit)}{T(50, y + 22, tit, { size: 14, gras: true, fill: col, anchor: 'start' })}{T(50, y + 40, e, { size: 13, anchor: 'start' })}{T(50, y + 57, dom, { size: 13, anchor: 'start', fill: K.gris })}</g>;
  return carte('Énergies électronique, vibrationnelle, rotationnelle et domaines spectraux', 276, <>
    {ligne(6, K.el, 'électronique', 'E ≈ 1 à 10 eV', 'UV-visible', 44)}{ligne(80, K.vib, 'vibration', 'E ≈ 0,06 à 0,5 eV', 'infrarouge (500 à 4000 cm⁻¹)', 24)}{ligne(154, K.rot, 'rotation', 'E ≈ 10⁻⁴ à 10⁻² eV', 'IR lointain, micro-ondes', 8)}
    {T(150, 240, 'E rot ≪ E vib ≪ E él', { size: 16, gras: true })}{T(150, 262, 'l’énergie absorbée est quantifiée', { size: 13, fill: K.gris })}
  </>);
}
export function SvgCarteBilan() {
  const L = (x, y, s, o = {}) => T(x, y, s, { size: 12.5, ...o });
  const lignes = [['E', '0,06 à 0,5 eV', '1 à 10 eV'], ['λ', '2,5 à 20 µm', '200 à 800 nm'], ['σ', '500 à 4000 cm⁻¹', '12 500 à 50 000 cm⁻¹'], ['transition', 'vibration', 'électronique'], ['spectre', 'T (%) en fonction de σ', 'A en fonction de λ'], ['sert à', 'identifier des liaisons', 'colorer, doser']];
  return carte('Bilan : spectroscopie infrarouge et UV-visible', 258, <>
    <rect x="6" y="6" width="288" height="246" rx="9" fill="#fff" stroke="#cbd5e1"/>
    <rect x="62" y="6" width="116" height="30" fill="#fff7ed"/><rect x="178" y="6" width="116" height="30" fill="#f5f3ff"/>
    {L(120, 27, 'IR', { size: 15, gras: true, fill: K.vib })}{L(236, 27, 'UV-visible', { size: 15, gras: true, fill: K.el })}
    {lignes.map(([a, b, c], i) => <g key={a}><line x1="6" y1={36 + i * 36} x2="294" y2={36 + i * 36} stroke="#e2e8f0"/>{L(12, 58 + i * 36, a, { gras: true, anchor: 'start' })}
      {b.length > 14 ? [L(120, 54 + i * 36, b.split(' ').slice(0, Math.ceil(b.split(' ').length / 2)).join(' ')), L(120, 69 + i * 36, b.split(' ').slice(Math.ceil(b.split(' ').length / 2)).join(' '))] : L(120, 60 + i * 36, b)}
      {c.length > 14 ? [L(236, 54 + i * 36, c.split(' ').slice(0, Math.ceil(c.split(' ').length / 2)).join(' ')), L(236, 69 + i * 36, c.split(' ').slice(Math.ceil(c.split(' ').length / 2)).join(' '))] : L(236, 60 + i * 36, c)}</g>)}
  </>);
}
