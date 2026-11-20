// ====================================================
//  Schémas des cartes « À retenir » de la simulation « Fluide au repos : pression, force pressante et loi de Mariotte » (1G, sim 162).
//  viewBox de 340 de large, textes ≥ 15 ; plafonnés à 320 px (maxWidth). Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = force / piège.
//  Flèches fines à pointe fixe (composant Fl) ; forces écrites avec une flèche au-dessus (notation vectorielle).
// ====================================================
import { Fl, TV, FVec } from "./pressionScenes";
import { COL, alea } from "./pressionStyle";

const NB = '\u00a0';
const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const fmtN = x => Math.round(x).toLocaleString('fr-FR').replace(/\u202f/g, NB);

// boîte de gaz : cadre, entités et (facultatif) petites flèches de vitesse (longueur lv) ; positions déterministes
function BoiteGaz({ x, y, w, h, n = 6, lv = 0, g = 0, fond = '#e0f2fe', paroiD = null }) {
  const pts = Array.from({ length: n }, (_, i) => ({ px: x + 9 + alea(i * 2 + g + 5) * (w - 18), py: y + 9 + alea(i * 2 + g + 41) * (h - 18), a: alea(i + g + 3) * Math.PI * 2 }));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="5" fill={fond} />
      {lv > 0 && pts.map((p, i) => <Fl key={`v${i}`} x1={p.px + Math.cos(p.a) * 5} y1={p.py + Math.sin(p.a) * 5} x2={p.px + Math.cos(p.a) * (5 + lv)} y2={p.py + Math.sin(p.a) * (5 + lv)} c="#64748b" w={1.8} tete={6.5} />)}
      {pts.map((p, i) => <circle key={i} cx={p.px} cy={p.py} r="4.4" fill={COL.bleu} stroke="#fff" strokeWidth="1" />)}
      <rect x={x} y={y} width={w} height={h} rx="5" fill="none" stroke={COL.acier} strokeWidth="2.4" />
      {paroiD && <line x1={x + w} y1={y + 3} x2={x + w} y2={y + h - 3} stroke={COL.orange} strokeWidth="5" strokeLinecap="round" />}
    </g>);
}
const Mnemo = ({ y, texte, c = COL.vert, fond = '#f0fdf4', h = 32 }) => (
  <g><rect x="12" y={y} width="316" height={h} rx="9" fill={fond} stroke={c} strokeWidth="1.8" /><text x="170" y={y + h / 2 + 5.5} fontSize="16" fontWeight="700" textAnchor="middle" fill={c}>{texte}</text></g>);

// ---------- carte 1 : un gaz = des entités en agitation qui frappent la paroi ----------
export function SvgChocs() {
  const flashs = [[236, 70], [236, 120], [236, 148]];
  return (
    <svg viewBox="0 0 340 236" style={stl} role="img"
      aria-label="Un gaz enfermé dans un récipient : des entités en agitation, représentées par des points bleus avec leurs vitesses en petites flèches, frappent la paroi. Chaque choc est marqué en orange sur la paroi. Pas de choc, pas de pression.">
      <BoiteGaz x={16} y={34} w={220} h={130} n={9} lv={20} g={11} paroiD />
      {flashs.map(([x, y], i) => <line key={i} x1={x + 5} y1={y - 9} x2={x + 5} y2={y + 9} stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />)}
      <text x="16" y="24" fontSize="16" fontWeight="700" fill={COL.encre}>gaz enfermé</text>
      <text x="270" y="86" fontSize="16" fontWeight="700" fill={COL.orange}>paroi</text>
      <text x="270" y="108" fontSize="16" fontWeight="700" fill={COL.orange}>(chocs)</text>
      <Fl x1={266} y1={96} x2={248} y2={84} c={COL.orange} w={1.8} tete={8} />
      <circle cx="26" cy="184" r="5" fill={COL.bleu} stroke="#fff" strokeWidth="1" /><text x="38" y="190" fontSize="16" fill={COL.txt2}>entité</text>
      <Fl x1={100} y1={184} x2={136} y2={184} c="#64748b" w={1.8} tete={7} /><text x="146" y="190" fontSize="16" fill={COL.txt2}>vitesse, sens au hasard</text>
      <Mnemo y={202} texte="Pas de choc, pas de pression" c={COL.vert} />
    </svg>);
}

// ---------- carte 2 : plus de chocs quand on chauffe (V constant) ou quand on comprime (T constante) ----------
export function SvgPlusChocs() {
  return (
    <svg viewBox="0 0 340 262" style={stl} role="img"
      aria-label="Deux cas. En haut : on chauffe un gaz dans un volume constant, les entités vont plus vite, les flèches de vitesse sont plus longues et la pression augmente. En bas : on comprime un gaz à température constante, le même nombre d’entités est dans un volume plus petit, elles sont plus serrées et la pression augmente.">
      <text x="14" y="20" fontSize="16" fontWeight="700" fill={COL.encre}>On chauffe (volume constant)</text>
      <BoiteGaz x={14} y={30} w={104} h={62} n={5} lv={9} g={3} />
      <BoiteGaz x={168} y={30} w={104} h={62} n={5} lv={26} g={3} fond="#fde8d0" />
      <Fl x1={126} y1={61} x2={158} y2={61} c={COL.gris} w={2.2} tete={9} />
      <text x="66" y="112" fontSize="16" textAnchor="middle" fill={COL.txt2}>moins agitées</text>
      <text x="220" y="112" fontSize="16" textAnchor="middle" fill={COL.txt2}>plus agitées</text>
      <text x="304" y="68" fontSize="20" fontWeight="700" textAnchor="middle" fill={COL.rouge}>P ↑</text>
      <line x1="14" y1="128" x2="326" y2="128" stroke="#e2e8f0" strokeWidth="1.6" />
      <text x="14" y="150" fontSize="16" fontWeight="700" fill={COL.encre}>On comprime (température constante)</text>
      <BoiteGaz x={14} y={160} w={104} h={62} n={5} lv={14} g={7} />
      <BoiteGaz x={168} y={160} w={52} h={62} n={5} lv={14} g={7} />
      <rect x="220" y="162" width="10" height="58" rx="3" fill={COL.acier} /><rect x="230" y="188" width="38" height="5" rx="2.5" fill="#94a3b8" />
      <rect x="118" y="162" width="10" height="58" rx="3" fill={COL.acier} /><rect x="128" y="188" width="32" height="5" rx="2.5" fill="#94a3b8" />
      <text x="66" y="242" fontSize="16" textAnchor="middle" fill={COL.txt2}>plus de place</text>
      <text x="194" y="242" fontSize="16" textAnchor="middle" fill={COL.txt2}>plus serrées</text>
      <text x="304" y="196" fontSize="20" fontWeight="700" textAnchor="middle" fill={COL.rouge}>P ↑</text>
    </svg>);
}

// ---------- carte 3 : force pressante F = P × S ----------
export function SvgForcePressante() {
  return (
    <svg viewBox="0 0 340 250" style={stl} role="img"
      aria-label="Un gaz, à gauche, exerce sur une paroi plane de surface S des forces pressantes perpendiculaires à la paroi, dirigées du gaz vers la paroi. La norme de la force est F égale P fois S, avec P en pascals, S en mètres carrés et F en newtons.">
      <BoiteGaz x={14} y={30} w={112} h={140} n={8} lv={0} g={17} />
      <rect x="126" y="30" width="14" height="140" rx="3" fill="#94a3b8" stroke={COL.acier} strokeWidth="2.2" />
      {[56, 100, 144].map(y => <Fl key={y} x1={126} y1={y} x2={216} y2={y} c={COL.rouge} w={2.6} tete={12} halo />)}
      <TV x={226} y={106} c={COL.rouge} s={23}>F</TV>
      <text x="226" y="128" fontSize="15" fontWeight="700" fill={COL.rouge}>⟂ paroi</text>
      <line x1="152" y1="30" x2="152" y2="170" stroke={COL.orange} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="147" y1="30" x2="157" y2="30" stroke={COL.orange} strokeWidth="1.8" strokeLinecap="round" /><line x1="147" y1="170" x2="157" y2="170" stroke={COL.orange} strokeWidth="1.8" strokeLinecap="round" />
      <text x="164" y="24" fontSize="16" fontWeight="700" fill={COL.orange}>S : surface</text>
      <text x="14" y="24" fontSize="16" fontWeight="700" fill={COL.encre}>gaz</text>
      <text x="14" y="190" fontSize="15" fill={COL.txt2}>{`le gaz pousse la paroi`}</text>
      <Mnemo y={212} texte={`P en Pa × S en m² = F en N`} c={COL.orange} fond="#fffbeb" />
    </svg>);
}

// ---------- carte 4 : loi de Mariotte, P(V) ----------
export function SvgMariotte() {
  const L = 78, R = 14, T = 16, B = 46, W = 340, H = 232, pw = W - L - R, ph = H - T - B, VM = 66, PM = 3600;
  const X = v => L + v / VM * pw, Y = p => T + ph - p / PM * ph;
  let d = '';
  for (let k = 0; k <= 70; k++) { const v = 16.5 + (VM - 16.5) * k / 70, p = 60660 / v; if (p <= PM) d += `${d ? 'L' : 'M'}${X(v).toFixed(1)},${Y(p).toFixed(1)}`; }
  const pts = [[60, 1011], [30, 2028], [20, 3037]];
  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} style={stl} role="img"
      aria-label="Graphe de la pression P en hectopascals en fonction du volume V en millilitres pour un gaz à température constante : la courbe descend quand le volume augmente. Quand le volume est divisé par 2, de 60 à 30 millilitres, la pression est multipliée par 2, d’environ 1 000 à 2 000 hectopascals. Le produit P fois V est constant.">
      <rect x={L} y={T} width={pw} height={ph} fill="#f8fafc" />
      {[0, 20, 40, 60].map(v => <g key={v}><line x1={X(v)} y1={T} x2={X(v)} y2={T + ph} stroke="#e2e8f0" strokeWidth="1.4" /><text x={X(v)} y={T + ph + 22} fontSize="15" textAnchor="middle" fill={COL.txt2}>{v}</text></g>)}
      {[0, 1000, 2000, 3000].map(p => <g key={p}><line x1={L} y1={Y(p)} x2={L + pw} y2={Y(p)} stroke="#e2e8f0" strokeWidth="1.4" /><text x={L - 8} y={Y(p) + 5} fontSize="15" textAnchor="end" fill={COL.txt2}>{fmtN(p)}</text></g>)}
      <polyline points={`${L},${T} ${L},${T + ph} ${L + pw},${T + ph}`} fill="none" stroke={COL.acier} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={COL.bleu} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([v, p], i) => <g key={i}>
        <line x1={X(v)} y1={Y(p)} x2={X(v)} y2={T + ph} stroke={COL.orange} strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" />
        <line x1={L} y1={Y(p)} x2={X(v)} y2={Y(p)} stroke={COL.orange} strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" />
        <circle cx={X(v)} cy={Y(p)} r="5.5" fill={COL.orange} stroke="#fff" strokeWidth="1.6" /></g>)}
      <text x={L + pw / 2} y={T + ph + 40} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>V (mL)</text>
      <text x="12" y={T + ph / 2} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre} transform={`rotate(-90 12 ${T + ph / 2})`}>P (hPa)</text>
      <text x={X(36)} y={Y(2650)} fontSize="16" fontWeight="700" fill={COL.bleu}>V ÷ 2 ⇒ P × 2</text>
      <Mnemo y={H} texte="P × V = constante" c={COL.bleu} fond="#f0f9ff" />
    </svg>);
}

// ---------- carte 5 : utiliser la loi (avant / après) ----------
export function SvgUtiliser() {
  const seringue = (y, Lg, lab, P, c) => (
    <g>
      <rect x="64" y={y} width="170" height="44" rx="6" fill="#f8fafc" stroke={COL.gris} strokeWidth="2.4" />
      <rect x="64" y={y} width={Lg} height="44" rx="6" fill="#dbeafe" />
      <rect x="64" y={y} width="170" height="44" rx="6" fill="none" stroke={COL.gris} strokeWidth="2.4" />
      <rect x={64 + Lg} y={y + 2} width="11" height="40" rx="3" fill={COL.acier} /><rect x={64 + Lg + 11} y={y + 19} width={160 - Lg} height="5" rx="2.5" fill="#94a3b8" />
      <rect x="238" y={y + 9} width="8" height="26" rx="3" fill={COL.acier} />
      <text x={64 + Lg / 2} y={y + 28} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{lab}</text>
      <text x="262" y={y + 28} fontSize="17" fontWeight="700" fill={c}>{P}</text>
    </g>);
  return (
    <svg viewBox="0 0 340 236" style={stl} role="img"
      aria-label="Avant : 50 millilitres de gaz à 1,0 bar. Après avoir poussé le piston : 25 millilitres, soit un volume divisé par 2, et 2,0 bar, soit une pression multipliée par 2. La température et la quantité de gaz ne changent pas.">
      <text x="14" y="52" fontSize="16" fontWeight="700" fill={COL.txt2}>avant</text>
      <text x="14" y="140" fontSize="16" fontWeight="700" fill={COL.txt2}>après</text>
      {seringue(26, 110, `50${NB}mL`, `1,0${NB}bar`, COL.bleu)}
      {seringue(114, 55, `25${NB}mL`, `2,0${NB}bar`, COL.orange)}
      <Fl x1={150} y1={78} x2={150} y2={106} c={COL.gris} w={2.4} tete={10} />
      <text x="162" y="98" fontSize="15" fill={COL.txt2}>on pousse le piston</text>
      <text x="170" y="184" fontSize="15" textAnchor="middle" fill={COL.rouge}>T et quantité de gaz : inchangées</text>
      <Mnemo y={196} texte={`P₁ × V₁ = P₂ × V₂`} c={COL.bleu} fond="#f0f9ff" />
    </svg>);
}

// ---------- carte 6 : deux pressions, une force résultante (canette) ----------
export function SvgCanetteCarte() {
  const cx = 110, top = 40, bas = 160, w = 34, pin = 15;
  const corps = `M${cx - w},${top} L${cx - w + pin * 0.4},${top + 24} Q${cx - w + pin * 1.15},${(top + bas) / 2} ${cx - w + pin * 0.4},${bas - 24} L${cx - w},${bas} L${cx + w},${bas} L${cx + w - pin * 0.4},${bas - 24} Q${cx + w - pin * 1.15},${(top + bas) / 2} ${cx + w - pin * 0.4},${top + 24} L${cx + w},${top} Z`;
  return (
    <svg viewBox="0 0 340 236" style={stl} role="img"
      aria-label="Une canette écrasée. À l’extérieur, la pression de l’air est grande : les forces pressantes extérieures, en rouge, sont grandes. À l’intérieur, la pression est faible : les forces pressantes intérieures, en bleu, sont petites. La force résultante pousse la paroi vers l’intérieur, du côté de la plus faible pression.">
      <path d={corps} fill="#e2e8f0" stroke={COL.acier} strokeWidth="2.6" strokeLinejoin="round" />
      <ellipse cx={cx} cy={top} rx={w} ry="6.5" fill="#f1f5f9" stroke={COL.acier} strokeWidth="2.2" />
      {[84, 106, 128].map(y => <g key={y}>
        <Fl x1={cx - w - 46} y1={y} x2={cx - w + pin * 0.8 - 2} y2={y} c={COL.rouge} w={2.8} tete={11} />
        <Fl x1={cx + w + 46} y1={y} x2={cx + w - pin * 0.8 + 2} y2={y} c={COL.rouge} w={2.8} tete={11} />
        <Fl x1={cx - 6} y1={y} x2={cx - 20} y2={y} c={COL.bleu} w={2} tete={7} />
        <Fl x1={cx + 6} y1={y} x2={cx + 20} y2={y} c={COL.bleu} w={2} tete={7} />
      </g>)}
      <rect x="196" y="40" width="132" height="124" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.6" />
      <FVec x={206} y={68} sub="ext" c={COL.rouge} s={20} />
      <text x="206" y="90" fontSize="15" fill={COL.txt2}>grande : air</text>
      <text x="206" y="108" fontSize="15" fill={COL.txt2}>extérieur</text>
      <FVec x={206} y={138} sub="int" c={COL.bleu} s={20} />
      <text x="206" y="158" fontSize="15" fill={COL.txt2}>petite : vapeur</text>
      <text x={cx} y="26" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>canette écrasée</text>
      <Mnemo y={182} texte="La paroi cède côté basse pression" c={COL.rouge} fond="#fef2f2" h={32} />
    </svg>);
}
