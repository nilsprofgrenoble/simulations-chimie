// ====================================================
//  Schémas des cartes « À retenir » de la simulation « Quantité de matière : masse molaire, volume molaire » (1G, sim 152).
//  Textes ≥ 15 unités du viewBox (400 de large : ≥ 9 px rendus sur téléphone). Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0', encre: '#0f172a' };
// fraction dessinée (numérateur, barre, dénominateur) centrée en (cx, cy), la barre étant à l'ordonnée cy
const Fr = ({ cx, cy, n, d, fs = 18, w = 34, fill = COL.encre }) => (
  <g>
    <line x1={cx - w / 2} y1={cy} x2={cx + w / 2} y2={cy} stroke={fill} strokeWidth="1.6" />
    <text x={cx} y={cy - 5} fontSize={fs} fontWeight="700" textAnchor="middle" fill={fill}>{n}</text>
    <text x={cx} y={cy + fs} fontSize={fs} fontWeight="700" textAnchor="middle" fill={fill}>{d === 'V_m' ? <>V<tspan dy="4">m</tspan></> : d}</text>
  </g>);
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ---------- carte 1 : la mole, un paquet d'entités ----------
export function SvgMole() {
  const oeufs = Array.from({ length: 12 }, (_, i) => ({ x: 28 + (i % 6) * 22, y: 62 + Math.floor(i / 6) * 22 }));
  const points = Array.from({ length: 40 }, (_, i) => ({ x: 232 + ((i * 37) % 130), y: 60 + ((i * 53) % 56) }));
  return (
    <svg viewBox="0 0 400 236" style={stl} role="img"
      aria-label="Comparaison : une douzaine contient 12 oeufs ; une mole contient 6,02 fois 10 puissance 23 entités, par exemple des atomes. La quantité de matière n en moles et le nombre d’entités N sont reliés par N égale n fois N A.">
      <text x="86" y="28" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 douzaine</text>
      <text x="86" y="46" fontSize="16" textAnchor="middle" fill={COL.gris}>= 12 œufs</text>
      <rect x="16" y="52" width="140" height="56" rx="8" fill="#fff7ed" stroke={COL.orange} />
      {oeufs.map((o, i) => <ellipse key={i} cx={o.x + 7} cy={o.y - 2} rx="8" ry="10" fill="#fed7aa" stroke={COL.orange} />)}
      <text x="296" y="28" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 mole</text>
      <text x="296" y="46" fontSize="16" textAnchor="middle" fill={COL.gris}>= 6,02 × 10²³ entités</text>
      <rect x="222" y="52" width="150" height="90" rx="14" fill="#eff6ff" stroke={COL.bleu} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4.2" fill={COL.bleu} opacity="0.85" />)}
      <text x="296" y="134" fontSize="16" textAnchor="middle" fill={COL.bleu}>un paquet énorme</text>
      <text x="200" y="170" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>N = n × N<tspan dy="4">A</tspan></text>
      <text x="200" y="192" fontSize="16" textAnchor="middle" fill="#334155">N : nombre d’entités · n : quantité (mol)</text>
      <text x="200" y="212" fontSize="16" textAnchor="middle" fill="#334155">N<tspan dy="4">A</tspan><tspan dy="-4"> = 6,02 × 10²³ mol⁻¹</tspan></text>
      <text x="200" y="231" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>La mole compte des entités, pas des grammes</text>
    </svg>);
}

// ---------- carte 2 : la masse molaire ----------
export function SvgMasseMolaire() {
  const piles = [['C', 12.0, COL.gris], ['Na', 23.0, COL.bleu], ['Cu', 63.5, COL.orange]];
  const H = m => 6 + m * 1.05;                                  // hauteur proportionnelle à la masse (63,5 g → 73)
  return (
    <svg viewBox="0 0 400 276" style={stl} role="img"
      aria-label="Une mole d’atomes de carbone pèse 12,0 grammes, une mole d’atomes de sodium 23,0 grammes, une mole d’atomes de cuivre 63,5 grammes : même nombre d’atomes, masses différentes. Pour une molécule, la masse molaire est la somme des masses molaires des atomes : H2O vaut 2 fois 1,0 plus 16,0, soit 18,0 grammes par mole.">
      <text x="200" y="20" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 mol d’atomes = 6,02 × 10²³ atomes</text>
      <line x1="20" y1="112" x2="380" y2="112" stroke="#94a3b8" strokeWidth="2" />
      {piles.map(([s, m, c], i) => { const x = 52 + i * 112, h = H(m); return (
        <g key={s}>
          <rect x={x} y={112 - h} width="64" height={h} rx="5" fill={c} opacity="0.88" />
          <text x={x + 32} y={112 - h / 2 + 5} fontSize="16" fontWeight="700" textAnchor="middle" fill="white">{s}</text>
          <text x={x + 32} y="132" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{String(m).replace('.', ',')} g</text>
        </g>); })}
      <text x="200" y="154" fontSize="16" textAnchor="middle" fill="#334155">même nombre d’atomes, masses différentes</text>
      <rect x="16" y="164" width="368" height="106" rx="10" fill="#eff6ff" stroke={COL.bleu} />
      <text x="200" y="187" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.bleu}>M(molécule) = somme des M des atomes</text>
      <text x="200" y="211" fontSize="16" textAnchor="middle" fill={COL.encre}>M(H₂O) = 2 × 1,0 + 16,0</text>
      <text x="200" y="234" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>= 18,0 g/mol</text>
      <text x="200" y="257" fontSize="16" textAnchor="middle" fill={COL.gris}>(2 atomes H · 1 atome O)</text>
    </svg>);
}

// ---------- carte 3 : n = m / M (le triangle) ----------
export function SvgTriangle() {
  return (
    <svg viewBox="0 0 400 244" style={stl} role="img"
      aria-label="Triangle des relations : la masse m en grammes en haut, la quantité de matière n en moles et la masse molaire M en grammes par mole en bas. n égale m sur M ; m égale n fois M. Pour des milligrammes, convertir d’abord en grammes.">
      <polygon points="104,22 20,170 188,170" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2" />
      <line x1="46" y1="126" x2="162" y2="126" stroke={COL.bleu} />
      <line x1="104" y1="126" x2="104" y2="170" stroke={COL.bleu} />
      <text x="104" y="108" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>m</text>
      <text x="104" y="68" fontSize="16" textAnchor="middle" fill={COL.gris}>(g)</text>
      <text x="64" y="156" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.orange}>n</text>
      <text x="146" y="156" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>M</text>
      <text x="64" y="188" fontSize="16" textAnchor="middle" fill={COL.gris}>(mol)</text>
      <text x="146" y="188" fontSize="16" textAnchor="middle" fill={COL.gris}>(g/mol)</text>
      <text x="232" y="58" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.orange}>n =</text>
      <Fr cx={266} cy={52} n="m" d="M" fill={COL.orange} w={30} />
      <text x="290" y="108" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>m = n × M</text>
      <text x="232" y="148" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.encre}>M =</text>
      <Fr cx={266} cy={142} n="m" d="n" w={30} />
      <text x="290" y="186" fontSize="16" textAnchor="middle" fill="#334155">cache la grandeur cherchée</text>
      <rect x="16" y="200" width="368" height="38" rx="8" fill="#fef2f2" stroke={COL.rouge} />
      <text x="200" y="224" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : 500 mg = 0,500 g avant de calculer</text>
    </svg>);
}

// ---------- carte 4 : le volume molaire ----------
export function SvgVolumeMolaire() {
  const L = v => v * 10;                                         // longueur de barre : 24 L → 240
  const barres = [['0 °C', 22.4, '22,4'], ['20 °C', 24.0, '24,0'], ['25 °C', 24.5, '24,5']];
  const pts = (x0, y0) => Array.from({ length: 8 }, (_, i) => ({ x: x0 + 12 + (i % 4) * 17, y: y0 + 16 + Math.floor(i / 4) * 17 }));
  return (
    <svg viewBox="0 0 400 284" style={stl} role="img"
      aria-label="Le volume molaire V m d’un gaz augmente avec la température : 22,4 litres par mole à 0 degré Celsius, 24,0 à 20 degrés, 24,5 à 25 degrés, à pression atmosphérique. À même volume, même température et même pression, deux gaz différents, dioxygène et dihydrogène, contiennent le même nombre de molécules, mais n’ont pas la même masse.">
      <text x="200" y="20" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>V<tspan dy="4">m</tspan><tspan dy="-4"> (L/mol)</tspan> dépend de T et de P</text>
      {barres.map(([t, v, s], i) => (
        <g key={t}>
          <text x="58" y={46 + i * 26} fontSize="16" textAnchor="end" fill="#334155">{t}</text>
          <rect x="66" y={31 + i * 26} width={L(v)} height="20" rx="3" fill={COL.bleu} opacity={0.6 + i * 0.15} />
          <text x={66 + L(v) - 6} y={46 + i * 26} fontSize="16" fontWeight="700" textAnchor="end" fill="white">{s}</text>
        </g>))}
      <text x="200" y="122" fontSize="16" textAnchor="middle" fill={COL.gris}>(pression : 1013 hPa)</text>
      <line x1="16" y1="132" x2="384" y2="132" stroke={COL.clair} />
      <text x="200" y="152" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>Même V, même T, même P</text>
      {[['O₂', 32, 52], ['H₂', 2, 232]].map(([f, M, x]) => (
        <g key={f}>
          <rect x={x} y="162" width="116" height="52" rx="8" fill="#f0fdf4" stroke={COL.vert} />
          {pts(x, 162).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill={f === 'O₂' ? COL.orange : COL.bleu} />)}
          <text x={x + 98} y="196" fontSize="16" fontWeight="700" textAnchor="end" fill={COL.encre}>{f}</text>
          <text x={x + 58} y="232" fontSize="16" textAnchor="middle" fill="#334155">M = {M},0 g/mol</text>
        </g>))}
      <text x="200" y="254" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>même nombre de molécules, masses différentes</text>
      <text x="200" y="274" fontSize="16" textAnchor="middle" fill={COL.gris}>V<tspan dy="4">m</tspan><tspan dy="-4"> est donné dans l’énoncé</tspan></text>
    </svg>);
}

// ---------- carte 5 : trois chemins vers n ----------
export function SvgChemins() {
  const boite = (x, y, w, h, couleur, l1, l2) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="white" stroke={couleur} strokeWidth="2" />
      <text x={x + w / 2} y={y + 22} fontSize="16" fontWeight="700" textAnchor="middle" fill={couleur}>{l1}</text>
      <text x={x + w / 2} y={y + 42} fontSize="16" textAnchor="middle" fill={COL.encre}>{l2}</text>
    </g>);
  const res = (x, couleur, lab, num, den, legende) => (
    <g>
      <rect x={x} y="132" width="112" height="82" rx="8" fill="white" stroke={couleur} strokeWidth="2" />
      <text x={x + 14} y="168" fontSize="17" fontWeight="700" fill={couleur}>{lab}</text>
      <Fr cx={x + 70} cy={162} n={num} d={den} fill={couleur} w={52} fs={16} />
      <text x={x + 56} y="206" fontSize="16" textAnchor="middle" fill="#334155">{legende}</text>
    </g>);
  return (
    <svg viewBox="0 0 400 276" style={stl} role="img"
      aria-label="Trois chemins pour trouver la quantité de matière n : si on pèse le solide ou le liquide, n égale m sur M ; si on mesure le volume d’un gaz, n égale V sur V m ; si on mesure le volume d’un liquide, n égale rho fois V sur M.">
      <text x="200" y="22" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>Qu’est-ce qu’on connaît ?</text>
      {boite(16, 36, 112, 56, COL.bleu, 'la masse m', 'solide, liquide')}
      {boite(144, 36, 112, 56, COL.orange, 'le volume V', 'd’un gaz')}
      {boite(272, 36, 112, 56, COL.vert, 'le volume V', 'd’un liquide')}
      {[72, 200, 328].map(x => <g key={x}><line x1={x} y1="92" x2={x} y2="118" stroke="#94a3b8" strokeWidth="2" /><polygon points={`${x - 6},114 ${x + 6},114 ${x},124`} fill="#94a3b8" /></g>)}
      {res(16, COL.bleu, 'n =', 'm', 'M', 'g et g/mol')}
      {res(144, COL.orange, 'n =', 'V', 'V_m', 'L et L/mol')}
      {res(272, COL.vert, 'n =', 'ρ · V', 'M', 'ρ en g/mL')}
      <rect x="16" y="226" width="368" height="44" rx="10" fill="#eff6ff" stroke={COL.bleu} />
      <text x="200" y="245" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>Mélange : un calcul par constituant</text>
      <text x="200" y="263" fontSize="16" textAnchor="middle" fill="#334155">plus de masse ≠ plus de moles</text>
    </svg>);
}
