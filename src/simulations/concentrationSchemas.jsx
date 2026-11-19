// ====================================================
//  Schémas des cartes « À retenir » de la simulation « Concentration en quantité de matière : dissolution et dilution » (1G, sim 153).
//  viewBox de 400 de large, textes ≥ 15 ; plafonnés à 400 px (maxWidth). Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
// ====================================================
import { Verre } from "./concentrationScenes";

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0', encre: '#0f172a', eau: '#dbeafe' };
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const alea = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };   // pseudo-aléa déterministe (pas de saut d’un rendu à l’autre)
const pts = (n, x0, x1, y0, y1, g = 0) => Array.from({ length: n }, (_, i) => ({ x: x0 + alea(i * 2 + g) * (x1 - x0), y: y0 + alea(i * 2 + 1 + g + 400) * (y1 - y0) }));
const Pts = ({ l, r = 3.6 }) => l.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={r} fill={COL.bleu} opacity="0.9" />);
// fraction dessinée centrée en (cx, cy) : la barre est à l'ordonnée cy
const Fr = ({ cx, cy, n, d, fs = 18, w = 40, fill = COL.encre }) => (
  <g>
    <line x1={cx - w / 2} y1={cy} x2={cx + w / 2} y2={cy} stroke={fill} strokeWidth="1.8" />
    <text x={cx} y={cy - 5} fontSize={fs} fontWeight="700" textAnchor="middle" fill={fill}>{n}</text>
    <text x={cx} y={cy + fs + 1} fontSize={fs} fontWeight="700" textAnchor="middle" fill={fill}>{d}</text>
  </g>);
const bec = (cx, base, w, H, hL) => (
  <g>
    <rect x={cx - w / 2} y={base - hL} width={w} height={hL} fill={COL.eau} opacity="0.95" />
    <path d={`M${cx - w / 2},${base - H} L${cx - w / 2},${base - 2} Q${cx - w / 2},${base} ${cx - w / 2 + 2},${base} L${cx + w / 2 - 2},${base} Q${cx + w / 2},${base} ${cx + w / 2},${base - 2} L${cx + w / 2},${base - H}`} fill="none" stroke="#64748b" strokeWidth="2.5" />
  </g>);

// ---------- carte 1 : la concentration c = n / V ----------
export function SvgConcentration() {
  return (
    <svg viewBox="0 0 400 252" style={stl} role="img"
      aria-label="Un bécher contient une quantité de matière n de soluté dans un volume V de solution. La concentration c est la quantité de matière par litre de solution : c égale n divisée par V, en moles par litre. Piège : le volume doit être en litres, 250 millilitres valent 0,250 litre.">
      {bec(100, 130, 110, 100, 70)}
      <Pts l={pts(16, 54, 146, 72, 124, 3)} />
      <text x="100" y="156" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.bleu}>n : particules de soluté</text>
      <text x="100" y="176" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>V : volume de solution</text>
      <text x="232" y="62" fontSize="19" fontWeight="700" fill={COL.encre}>c</text>
      <text x="252" y="62" fontSize="19" fontWeight="700" fill={COL.encre}>=</text>
      <Fr cx={300} cy={56} n="n" d="V" fs={20} w={34} />
      <text x="232" y="100" fontSize="16" fill="#334155">mol/L = mol ÷ L</text>
      <text x="232" y="122" fontSize="16" fill={COL.bleu} fontWeight="700">c = soluté par litre</text>
      <rect x="14" y="190" width="372" height="52" rx="8" fill="#fef2f2" stroke={COL.rouge} />
      <text x="200" y="212" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : V se convertit en litres</text>
      <text x="200" y="233" fontSize="16" textAnchor="middle" fill="#334155">250 mL = 0,250 L (÷ 1000)</text>
    </svg>);
}

// ---------- carte 2 : concentration en masse et en quantité de matière ----------
export function SvgCmC() {
  return (
    <svg viewBox="0 0 400 248" style={stl} role="img"
      aria-label="Passage entre la concentration en masse Cm en grammes par litre et la concentration en quantité de matière c en moles par litre : pour aller de Cm à c on divise par la masse molaire M ; pour aller de c à Cm on multiplie par M. Dans une solution, les grammes se simplifient avec les grammes par mole.">
      <rect x="14" y="22" width="150" height="74" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2" />
      <text x="89" y="52" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.encre}>Cm</text>
      <text x="89" y="80" fontSize="16" textAnchor="middle" fill="#334155">en g/L (masse)</text>
      <rect x="236" y="22" width="150" height="74" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2" />
      <text x="311" y="52" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.encre}>c</text>
      <text x="311" y="80" fontSize="16" textAnchor="middle" fill="#334155">en mol/L (moles)</text>
      <line x1="170" y1="42" x2="228" y2="42" stroke={COL.bleu} strokeWidth="3" /><polygon points="226,34 226,50 238,42" fill={COL.bleu} />
      <text x="199" y="32" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.bleu}>÷ M</text>
      <line x1="230" y1="76" x2="172" y2="76" stroke={COL.orange} strokeWidth="3" /><polygon points="174,68 174,84 162,76" fill={COL.orange} />
      <text x="199" y="100" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>× M</text>
      <text x="200" y="132" fontSize="16" textAnchor="middle" fill="#334155">M = masse molaire du soluté, en g/mol</text>
      <text x="200" y="164" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>Cm = c × M</text>
      <text x="200" y="190" fontSize="16" textAnchor="middle" fill="#334155">g/L = (mol/L) × (g/mol) : les mol se simplifient</text>
      <rect x="14" y="204" width="372" height="34" rx="8" fill="#f0fdf4" stroke={COL.vert} />
      <text x="200" y="226" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>Regarder les unités dit quoi faire</text>
    </svg>);
}

// ---------- carte 3 : préparer une solution par dissolution ----------
export function SvgDissolution() {
  const etapes = [['1', 'Calculer', 'n = c × V, puis m = n × M'], ['2', 'Peser', 'la masse m, balance tarée'], ['3', 'Dissoudre', 'eau aux 2/3, on agite'], ['4', 'Ajuster', 'eau jusqu’au trait de jauge']];
  return (
    <svg viewBox="0 0 400 282" style={stl} role="img"
      aria-label="Préparer une solution par dissolution en quatre étapes : 1, calculer la quantité de matière puis la masse à peser ; 2, peser le solide ; 3, le dissoudre dans une fiole jaugée remplie aux deux tiers d’eau distillée en agitant ; 4, compléter avec de l’eau distillée jusqu’au trait de jauge.">
      {etapes.map(([k, t, d], i) => (
        <g key={k}>
          <circle cx="28" cy={32 + i * 56} r="17" fill={i === 3 ? COL.vert : COL.bleu} />
          <text x="28" y={38 + i * 56} fontSize="18" fontWeight="700" textAnchor="middle" fill="white">{k}</text>
          <text x="58" y={30 + i * 56} fontSize="17" fontWeight="700" fill={COL.encre}>{t}</text>
          <text x="58" y={50 + i * 56} fontSize="16" fill="#334155">{d}</text>
        </g>))}
      <rect x="300" y="26" width="86" height="34" rx="6" fill="#0f172a" />
      <text x="343" y="49" fontSize="17" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>m en g</text>
      <Verre type="fiole" x={343} y={238} k={0.9} aria="Fiole jaugée" />
      <text x="343" y="264" fontSize="16" textAnchor="middle" fill="#334155">fiole jaugée</text>
    </svg>);
}

// ---------- carte 4 : la dilution conserve la quantité de matière ----------
export function SvgConservation() {
  const a = pts(12, 38, 82, 124, 152, 21), b = pts(12, 205, 355, 90, 152, 5);
  return (
    <svg viewBox="0 0 400 262" style={stl} role="img"
      aria-label="Avant la dilution : un petit volume de solution mère contient douze particules de soluté. Après l’ajout d’eau : un grand volume de solution fille contient les mêmes douze particules, plus espacées. La quantité de matière de soluté ne change pas ; la concentration diminue. c mère fois V mère égale c fille fois V fille.">
      {bec(60, 160, 60, 56, 40)}<Pts l={a} />
      <text x="60" y="184" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>mère</text>
      <text x="60" y="204" fontSize="16" textAnchor="middle" fill={COL.bleu}>12 particules</text>
      <line x1="104" y1="128" x2="160" y2="128" stroke="#94a3b8" strokeWidth="3" /><polygon points="158,120 158,136 170,128" fill="#94a3b8" />
      <text x="132" y="112" fontSize="16" textAnchor="middle" fill="#334155">+ eau</text>
      {bec(280, 160, 160, 90, 76)}<Pts l={b} />
      <text x="280" y="184" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>fille</text>
      <text x="280" y="204" fontSize="16" textAnchor="middle" fill={COL.bleu}>les mêmes 12 particules</text>
      <rect x="14" y="216" width="372" height="38" rx="8" fill="#eff6ff" stroke={COL.bleu} />
      <text x="200" y="241" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>c mère × V mère = c fille × V fille</text>
      <text x="200" y="30" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>n ne change pas, c diminue</text>
    </svg>);
}

// ---------- carte 5 : le facteur de dilution ----------
export function SvgFacteur() {
  return (
    <svg viewBox="0 0 400 262" style={stl} role="img"
      aria-label="Facteur de dilution F : une solution mère à 2,0 mole par litre, dont on prélève 25 millilitres, est diluée en 100 millilitres de solution fille à 0,50 mole par litre. Le volume est multiplié par 4 et la concentration divisée par 4 : F égale c mère divisé par c fille, égale V fille divisé par V mère, soit 4.">
      <text x="200" y="26" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>Exemple : on dilue 4 fois</text>
      <rect x="20" y="42" width="60" height="50" rx="6" fill={COL.eau} stroke={COL.bleu} strokeWidth="2" />
      <Pts l={pts(12, 28, 72, 50, 86, 31)} />
      <text x="50" y="112" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>mère</text>
      <text x="50" y="132" fontSize="16" textAnchor="middle" fill="#334155">25 mL</text>
      <text x="50" y="152" fontSize="16" textAnchor="middle" fill={COL.orange}>2,0 mol/L</text>
      <text x="108" y="72" fontSize="26" fontWeight="700" textAnchor="middle" fill={COL.gris}>→</text>
      <rect x="134" y="42" width="240" height="50" rx="6" fill={COL.eau} stroke={COL.bleu} strokeWidth="2" />
      <Pts l={pts(12, 142, 366, 50, 86, 17)} />
      <text x="254" y="112" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>fille</text>
      <text x="254" y="132" fontSize="16" textAnchor="middle" fill="#334155">100 mL (4 fois plus)</text>
      <text x="254" y="152" fontSize="16" textAnchor="middle" fill={COL.orange}>0,50 mol/L (4 fois moins)</text>
      <text x="62" y="196" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.encre}>F =</text>
      <Fr cx={150} cy={190} n="c mère" d="c fille" fs={16} w={64} />
      <text x="206" y="196" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.encre}>=</text>
      <Fr cx={262} cy={190} n="V fille" d="V mère" fs={16} w={64} />
      <text x="320" y="196" fontSize="19" fontWeight="700" fill={COL.encre}>= 4,0</text>
      <rect x="14" y="222" width="372" height="32" rx="8" fill="#fff7ed" stroke={COL.orange} />
      <text x="200" y="244" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>F n’a pas d’unité ; F est supérieur à 1</text>
    </svg>);
}

// ---------- carte 6 : le bon verre pour le bon usage ----------
export function SvgVerrerie() {
  const v = [['fiole', ['fiole', 'jaugée'], ['volume final', 'précis'], COL.vert], ['pipette', ['pipette', 'jaugée'], ['prélèvement', 'précis'], COL.vert], ['eprouvette', ['éprouvette', 'graduée'], ['mesure', 'approchée'], COL.orange], ['becher', ['bécher', ''], ['contenir', 'indicatif'], COL.rouge]];
  return (
    <svg viewBox="0 0 400 278" style={stl} role="img"
      aria-label="Quatre verres : la fiole jaugée donne le volume final précis ; la pipette jaugée sert à prélever un volume précis ; l’éprouvette graduée donne une mesure approchée ; le bécher sert à contenir, ses graduations sont indicatives. Pour une solution de concentration connue avec précision, on utilise la fiole jaugée et la pipette jaugée.">
      {v.map(([t, nom, role, c], i) => { const cx = 50 + i * 100; return (
        <g key={t}>
          <Verre type={t} x={cx} y={150} k={0.9} nom={nom.join(' ')} />
          <text x={cx} y={174} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{nom[0]}</text>
          <text x={cx} y={193} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{nom[1]}</text>
          <text x={cx} y={214} fontSize="16" textAnchor="middle" fill="#334155">{role[0]}</text>
          <text x={cx} y={233} fontSize="16" fontWeight="700" textAnchor="middle" fill={c}>{role[1]}</text>
        </g>); })}
      <rect x="14" y="248" width="372" height="24" rx="6" fill="#f0fdf4" stroke={COL.vert} />
      <text x="200" y="265" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>Précis : fiole et pipette jaugées</text>
    </svg>);
}
