// ====================================================
//  Schémas des cartes « À retenir » de la simulation 121 (pH et concentration en ions oxonium, TG).
//  Couleurs : bleu = donnée / liant, orange = grandeur à repérer, vert = bon, rouge = piège, violet = acide.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', acide: '#6d28d9', eau: '#bfdbfe' };
const stl = { width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Sub = ({ children }) => <tspan baselineShift="sub" fontSize="0.75em">{children}</tspan>;
const Sup = ({ children }) => <tspan baselineShift="super" fontSize="0.75em">{children}</tspan>;
const It = ({ children }) => <tspan fontStyle="italic">{children}</tspan>;

// Bécher simple : (x, y) = coin haut gauche, w × h, niveau de liquide = fraction de la hauteur
function Bec({ x, y, w, h, niveau = 0.65, coul = COL.eau, trait = '#475569' }) {
  const bas = y + h, haut = bas - h * niveau;
  return (<g>
    <rect x={x + 1.5} y={haut} width={w - 3} height={bas - haut - 1.5} fill={coul} opacity="0.85"/>
    <path d={`M${x} ${y} L${x} ${bas} L${x + w} ${bas} L${x + w} ${y}`} fill="none" stroke={trait} strokeWidth="2" strokeLinejoin="round"/>
  </g>);
}
const Fleche = ({ x1, y1, x2, y2, c = COL.orange, id }) => (<g>
  <defs><marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={c}/></marker></defs>
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.4" markerEnd={`url(#${id})`}/></g>);

// ---- 1. La relation pH ↔ [H₃O⁺], dans les deux sens
export function SvgRelation() {
  return (
    <svg viewBox="0 0 360 214" role="img" aria-label="Deux sens de calcul : de la concentration en ions oxonium au pH avec pH égal moins log de H3O plus divisé par c zéro, et du pH à la concentration avec H3O plus égal c zéro fois dix puissance moins pH. Exemple : 2,5 fois dix puissance moins cinq mole par litre correspond à pH 4,60. Le pH est donné avec autant de décimales que la concentration a de chiffres significatifs" style={stl}>
      <text x="180" y="20" fontSize="14" fontWeight="700" fill={COL.orange} textAnchor="middle">pH = −log( [H₃O⁺] / c° )</text>
      <rect x="10" y="32" width="128" height="52" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2"/>
      <text x="74" y="55" fontSize="14" fontWeight="700" fill={COL.bleu} textAnchor="middle">[H₃O⁺]</text>
      <text x="74" y="73" fontSize="12" fill="#334155" textAnchor="middle">en mol·L⁻¹</text>
      <rect x="222" y="32" width="128" height="52" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2"/>
      <text x="286" y="55" fontSize="14" fontWeight="700" fill={COL.orange} textAnchor="middle">pH</text>
      <text x="286" y="73" fontSize="12" fill="#334155" textAnchor="middle">sans unité</text>
      <Fleche x1="144" y1="48" x2="216" y2="48" id="r1"/>
      <Fleche x1="216" y1="70" x2="144" y2="70" id="r2" c={COL.bleu}/>
      <text x="180" y="106" fontSize="14" fontWeight="700" fill={COL.bleu} textAnchor="middle">[H₃O⁺] = c° × 10<Sup>−pH</Sup></text>
      <text x="180" y="128" fontSize="12" fill="#475569" textAnchor="middle">avec c° = 1 mol·L⁻¹ : [H₃O⁺] / c° est un nombre sans unité</text>
      <line x1="14" y1="138" x2="346" y2="138" stroke="#cbd5e1"/>
      <text x="180" y="158" fontSize="13" fill="#0f172a" textAnchor="middle">Exemple : 2,5 × 10<Sup>−5</Sup> mol·L⁻¹  ⟷  pH = 4,60</text>
      <text x="180" y="178" fontSize="12.5" fill={COL.vert} fontWeight="700" textAnchor="middle">plus [H₃O⁺] est grande, plus le pH est petit</text>
      <text x="180" y="198" fontSize="12.5" fill="#334155" textAnchor="middle">2 décimales pour le pH ⟷ 2 chiffres significatifs pour [H₃O⁺]</text>
    </svg>);
}

// ---- 2. Une dilution d'un facteur 10 ajoute 1 au pH
export function SvgDilution10() {
  const col = [{ cx: 62, c: '1,0 × 10⁻³', ph: '3,0', n: 0.4 }, { cx: 180, c: '1,0 × 10⁻⁴', ph: '4,0', n: 0.6 }, { cx: 298, c: '1,0 × 10⁻⁵', ph: '5,0', n: 0.8 }];
  return (
    <svg viewBox="0 0 360 232" role="img" aria-label="Trois béchers de solutions d'acide chlorhydrique de concentrations dix puissance moins trois, moins quatre et moins cinq mole par litre ; entre deux béchers la solution est diluée d'un facteur dix et le pH augmente de un : pH 3,0, 4,0, 5,0. Idée fausse : dix fois moins concentré donc pH divisé par dix. Vrai : le pH augmente de un" style={stl}>
      {col.map(k => (<g key={k.cx}>
        <Bec x={k.cx - 28} y={52} w={56} h={64} niveau={k.n}/>
        <text x={k.cx} y="136" fontSize="11.5" fill="#0f172a" textAnchor="middle">C = {k.c}</text>
        <text x={k.cx} y="152" fontSize="11" fill="#334155" textAnchor="middle">mol·L⁻¹</text>
        <rect x={k.cx - 34} y="160" width="68" height="24" rx="6" fill="#fff7ed" stroke={COL.orange} strokeWidth="1.6"/>
        <text x={k.cx} y="177" fontSize="14" fontWeight="700" fill={COL.orange} textAnchor="middle">pH {k.ph}</text>
      </g>))}
      <Fleche x1="96" y1="84" x2="144" y2="84" id="d1"/><Fleche x1="214" y1="84" x2="262" y2="84" id="d2"/>
      <text x="120" y="72" fontSize="12.5" fontWeight="700" fill={COL.orange} textAnchor="middle">÷ 10</text>
      <text x="238" y="72" fontSize="12.5" fontWeight="700" fill={COL.orange} textAnchor="middle">÷ 10</text>
      <text x="120" y="102" fontSize="12.5" fontWeight="700" fill={COL.vert} textAnchor="middle">pH + 1</text>
      <text x="238" y="102" fontSize="12.5" fontWeight="700" fill={COL.vert} textAnchor="middle">pH + 1</text>
      <text x="180" y="18" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">Acide chlorhydrique dilué d’un facteur 10</text>
      <text x="180" y="206" fontSize="12" fill={COL.rouge} textAnchor="middle"><tspan fontWeight="700">Idée fausse</tspan> : « 10 fois moins concentré ⇒ pH ÷ 10 »</text>
      <text x="180" y="224" fontSize="12" fill={COL.vert} textAnchor="middle"><tspan fontWeight="700">Vrai</tspan> : le pH augmente de 1 (échelle logarithmique)</text>
    </svg>);
}

// ---- 3. Mesurer le pH : protocole
export function SvgMesure() {
  const etapes = [['1', 'Étalonner', 'avec deux tampons (pH 4,00 et 7,00)'], ['2', 'Rincer', 'l’électrode à l’eau distillée'], ['3', 'Mesurer', 'du plus dilué au plus concentré'], ['4', 'Lire', 'quand la valeur est stable (0,01)']];
  return (
    <svg viewBox="0 0 360 214" role="img" aria-label="Protocole de mesure du pH : un pH-mètre dont l'électrode plonge dans un bécher, et quatre étapes : étalonner avec deux tampons de pH 4,00 et 7,00, rincer l'électrode à l'eau distillée, mesurer du plus dilué au plus concentré, lire quand la valeur est stable au centième" style={stl}>
      <rect x="12" y="22" width="88" height="44" rx="8" fill="#0f172a"/>
      <text x="56" y="53" fontSize="22" fontWeight="700" fill="#4ade80" textAnchor="middle" fontFamily="monospace">4,60</text>
      <text x="56" y="14" fontSize="11.5" fill="#334155" textAnchor="middle">pH-mètre</text>
      <path d="M56 66 L56 92 L40 118 L40 140" fill="none" stroke="#475569" strokeWidth="2.2"/>
      <rect x="36" y="138" width="8" height="26" rx="3" fill="#94a3b8" stroke="#475569"/>
      <Bec x={14} y={112} w={70} h={74} niveau={0.7}/>
      <text x="49" y="204" fontSize="11.5" fill="#334155" textAnchor="middle">dans la solution</text>
      {etapes.map(([n, t, d], i) => (<g key={n}>
        <circle cx="128" cy={30 + i * 44} r="12" fill={COL.orange}/>
        <text x="128" y={35 + i * 44} fontSize="14" fontWeight="700" fill="white" textAnchor="middle">{n}</text>
        <text x="148" y={27 + i * 44} fontSize="13.5" fontWeight="700" fill="#0f172a">{t}</text>
        <text x="148" y={43 + i * 44} fontSize="11.5" fill="#334155">{d}</text>
      </g>))}
    </svg>);
}

// ---- 4. Dilution d'un facteur 10ⁿ : le pH augmente de n
export function SvgFacteurN() {
  const X = p => 30 + (p - 2) * 75;       // axe des pH de 2 à 6
  return (
    <svg viewBox="0 0 360 214" role="img" aria-label="Axe des pH : une solution de pH 2,40 diluée d'un facteur dix passe à 3,40, puis encore d'un facteur dix à 4,40 : un facteur cent donne plus deux. Formule : pH final égal pH initial plus log F, avec F le facteur de dilution : facteur dix plus un, cent plus deux, mille plus trois" style={stl}>
      <line x1="20" y1="92" x2="340" y2="92" stroke="#94a3b8" strokeWidth="1.5"/>
      {[2, 3, 4, 5, 6].map(p => (<g key={p}><line x1={X(p)} y1="87" x2={X(p)} y2="97" stroke="#94a3b8" strokeWidth="1.5"/><text x={X(p)} y="112" fontSize="12" fill="#334155" textAnchor="middle">{p}</text></g>))}
      <text x="345" y="80" fontSize="12" fontWeight="700" fill="#334155" textAnchor="end">pH</text>
      {[2.4, 3.4, 4.4].map((p, i) => (<g key={p}><circle cx={X(p)} cy="92" r="7" fill={i === 0 ? COL.bleu : i === 2 ? COL.orange : '#7dd3fc'} stroke="#0f172a" strokeWidth="1.4"/>
        <text x={X(p)} y="76" fontSize="12.5" fontWeight="700" fill="#0f172a" textAnchor="middle">{String(p).replace('.', ',')}0</text></g>))}
      <path d={`M${X(2.4)} 66 Q${(X(2.4) + X(3.4)) / 2} 30 ${X(3.4) - 3} 64`} fill="none" stroke={COL.vert} strokeWidth="2"/>
      <path d={`M${X(3.4)} 66 Q${(X(3.4) + X(4.4)) / 2} 30 ${X(4.4) - 3} 64`} fill="none" stroke={COL.vert} strokeWidth="2"/>
      <text x={(X(2.4) + X(3.4)) / 2} y="30" fontSize="12" fontWeight="700" fill={COL.vert} textAnchor="middle">÷ 10 : +1</text>
      <text x={(X(3.4) + X(4.4)) / 2} y="30" fontSize="12" fontWeight="700" fill={COL.vert} textAnchor="middle">÷ 10 : +1</text>
      <text x={(X(2.4) + X(4.4)) / 2} y="142" fontSize="12.5" fontWeight="700" fill={COL.orange} textAnchor="middle">÷ 100 : +2</text>
      <line x1={X(2.4)} y1="124" x2={X(4.4)} y2="124" stroke={COL.orange} strokeWidth="1.6"/>
      <line x1="14" y1="152" x2="346" y2="152" stroke="#cbd5e1"/>
      <text x="180" y="174" fontSize="14" fontWeight="700" fill="#0f172a" textAnchor="middle">pH<Sub>final</Sub> = pH<Sub>initial</Sub> + log <It>F</It></text>
      <text x="180" y="196" fontSize="12.5" fill="#334155" textAnchor="middle"><It>F</It> = 10 : +1   ·   <It>F</It> = 100 : +2   ·   <It>F</It> = 1000 : +3</text>
    </svg>);
}

// ---- 5. Tester la relation : pH = f(−log C) est une droite de pente 1
export function SvgTester() {
  const X = v => 44 + v * 46, Y = p => 168 - p * 23;
  return (
    <svg viewBox="0 0 360 214" role="img" aria-label="Graphe du pH mesuré en fonction de moins log de C sur c zéro : cinq points alignés sur une droite de pente un passant par l'origine. Si les points sont sur cette droite, à mieux que 0,05 près, la relation est vérifiée. Le pH n'est pas proportionnel à C" style={stl}>
      <line x1="44" y1="168" x2="330" y2="168" stroke="#94a3b8"/><line x1="44" y1="168" x2="44" y2="14" stroke="#94a3b8"/>
      {[0, 2, 4, 6].map(v => (<g key={v}><text x={X(v)} y="184" fontSize="11.5" fill="#334155" textAnchor="middle">{v}</text><line x1={X(v)} y1="168" x2={X(v)} y2="172" stroke="#94a3b8"/></g>))}
      {[0, 2, 4, 6].map(p => (<g key={p}><text x="36" y={Y(p) + 4} fontSize="11.5" fill="#334155" textAnchor="end">{p}</text></g>))}
      <text x="190" y="204" fontSize="12" fill="#334155" textAnchor="middle">−log( <It>C</It> / c° )</text>
      <text x="14" y="90" fontSize="12" fill="#334155" textAnchor="middle" transform="rotate(-90 14 90)">pH mesuré</text>
      <line x1={X(0)} y1={Y(0)} x2={X(6.2)} y2={Y(6.2)} stroke={COL.gris} strokeWidth="2" strokeDasharray="6 4"/>
      {[2, 3, 4, 5, 6].map(v => <circle key={v} cx={X(v)} cy={Y(v)} r="5.5" fill={COL.bleu} stroke="#0f172a" strokeWidth="1.2"/>)}
      <text x="60" y="38" fontSize="12.5" fontWeight="700" fill={COL.orange}>pente = 1</text>
      <text x="60" y="55" fontSize="11.5" fill="#334155">pH = −log(<It>C</It> / c°)</text>
      <text x="326" y="150" fontSize="12" fontWeight="700" fill={COL.vert} textAnchor="end">ordonnée à l’origine = 0</text>
      <text x="326" y="133" fontSize="11.5" fill="#334155" textAnchor="end">points sur la droite à 0,05 près</text>
    </svg>);
}

// ---- 6. Domaine de validité de pH = −log C pour un acide fort
export function SvgValidite() {
  const X = e => 24 + (e - 1) * 44;          // e = exposant n de C = 10⁻ⁿ, de 1 à 8
  return (
    <svg viewBox="0 0 360 236" role="img" aria-label="Axe des concentrations de dix puissance moins un à dix puissance moins huit mole par litre. De moins un à moins six : la relation pH égal moins log C est valable, écart inférieur à 0,01. Autour de dix puissance moins sept : l'écart grandit, le pH mesuré est 6,79 au lieu de 7,0. Au-delà : la relation est fausse, par exemple 6,98 mesuré au lieu de 8,0 ; une solution d'acide a toujours un pH inférieur à 7" style={stl}>
      <text x="180" y="16" fontSize="12.5" fontWeight="700" fill="#0f172a" textAnchor="middle">HCl de concentration <It>C</It> (mol·L⁻¹)</text>
      <rect x={X(1)} y="30" width={X(6) - X(1)} height="30" fill="#dcfce7" stroke={COL.vert}/>
      <rect x={X(6)} y="30" width={X(7.5) - X(6)} height="30" fill="#ffedd5" stroke={COL.orange}/>
      <rect x={X(7.5)} y="30" width={X(8) - X(7.5) + 14} height="30" fill="#fee2e2" stroke={COL.rouge}/>
      <text x={(X(1) + X(6)) / 2} y="49" fontSize="12.5" fontWeight="700" fill={COL.vert} textAnchor="middle">relation valable</text>
      <text x={(X(6) + X(7.5)) / 2} y="49" fontSize="11" fontWeight="700" fill={COL.orange} textAnchor="middle">écart</text>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (<g key={n}><line x1={X(n)} y1="60" x2={X(n)} y2="66" stroke="#475569"/><text x={X(n)} y="80" fontSize="11" fill="#334155" textAnchor="middle">{`10⁻${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]}`}</text></g>))}
      <line x1="14" y1="92" x2="346" y2="92" stroke="#cbd5e1"/>
      <text x="14" y="112" fontSize="12.5" fontWeight="700" fill={COL.vert}>C ≥ 10⁻⁶ mol/L</text>
      <text x="14" y="128" fontSize="12" fill="#334155">écart entre relation et mesure &lt; 0,01 : on peut le négliger</text>
      <text x="14" y="152" fontSize="12.5" fontWeight="700" fill={COL.rouge}>C = 10⁻⁷ mol/L : relation → 7,00 ; mesure → 6,79</text>
      <text x="14" y="172" fontSize="12.5" fontWeight="700" fill={COL.rouge}>C = 10⁻⁸ mol/L : relation → 8,00 ; mesure → 6,98</text>
      <text x="14" y="194" fontSize="12" fill="#334155">L’eau apporte déjà 10⁻⁷ mol/L d’ions H₃O⁺ (autoprotolyse)</text>
      <text x="14" y="214" fontSize="12.5" fontWeight="700" fill="#0f172a">Une solution d’acide a toujours un pH &lt; 7</text>
    </svg>);
}
