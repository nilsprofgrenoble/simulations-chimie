// Cartes « À retenir » de la simulation Fidélité d'une méthode : étude interlaboratoire (sim 9) : un schéma dessiné et une idée mémorisable par carte.
const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a', VIOLET = '#7c3aed';
const svgStyle = { width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// s indicé (s_n) et s indicé au carré, en tspan pour rester lisibles dans un SVG
const S = ({ n }) => <><tspan>s</tspan><tspan fontSize="11" dy="4">{n}</tspan><tspan dy="-4"> </tspan></>;
const Sq = ({ n }) => <><tspan>s</tspan><tspan fontSize="11" dy="4">{n}</tspan><tspan dy="-4">²</tspan></>;

// double flèche horizontale
const DF = ({ x1, x2, y, c = ORANGE }) => (
  <g stroke={c} fill={c} strokeWidth="2.5"><line x1={x1 + 6} y1={y} x2={x2 - 6} y2={y} strokeLinecap="round"/>
    <polygon points={`${x1},${y} ${x1 + 10},${y - 5} ${x1 + 10},${y + 5}`} stroke="none"/><polygon points={`${x2},${y} ${x2 - 10},${y - 5} ${x2 - 10},${y + 5}`} stroke="none"/></g>
);

// ── Carte 1 : deux sources de dispersion ──
export function FicheDispersion() {
  const labs = [[46, 150], [86, 205], [126, 260]];
  const off = [-18, -6, 8, 20];
  return (
    <div>
      <svg viewBox="0 0 400 282" style={svgStyle} role="img" aria-label="Trois laboratoires : les essais d’un même laboratoire sont groupés autour de leur moyenne, c’est la répétabilité s r ; les moyennes des laboratoires diffèrent entre elles, c’est l’effet laboratoire s L ; la reproductibilité s R combine les deux, comme l’hypoténuse d’un triangle rectangle : s R au carré égale s L au carré plus s r au carré">
        <DF x1={132} x2={170} y={22} c={BLEU}/><text x="180" y="27" fontSize="15" fontWeight="800" fill={BLEU}><S n="r"/></text>
        <text x="388" y="27" textAnchor="end" fontSize="13" fill={GRIS}>● essai   | moyenne</text>
        {labs.map(([y, m], i) => <g key={i}>
          <text x="8" y={y + 5} fontSize="13" fontWeight="700" fill={GRIS}>labo {i + 1}</text>
          <line x1="66" y1={y} x2="392" y2={y} stroke="#e2e8f0" strokeWidth="1.5"/>
          {off.map(d => <circle key={d} cx={m + d} cy={y} r="6" fill={BLEU}/>)}
          <line x1={m} y1={y - 14} x2={m} y2={y + 14} stroke={ORANGE} strokeWidth="3"/></g>)}
        <line x1="150" y1="58" x2="150" y2="152" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/><line x1="260" y1="140" x2="260" y2="152" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>
        <line x1="150" y1="152" x2="150" y2="164" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>
        <DF x1={150} x2={260} y={164} c={ORANGE}/><text x="205" y="186" textAnchor="middle" fontSize="15" fontWeight="800" fill={ORANGE}><S n="L"/> entre les moyennes</text>
        <polygon points="40,262 150,262 40,208" fill="#f5f3ff" stroke={VIOLET} strokeWidth="2.5" strokeLinejoin="round"/>
        <text x="95" y="277" textAnchor="middle" fontSize="15" fontWeight="800" fill={ORANGE}><S n="L"/></text>
        <text x="32" y="240" textAnchor="end" fontSize="15" fontWeight="800" fill={BLEU}><S n="r"/></text>
        <text x="112" y="226" fontSize="15" fontWeight="800" fill={VIOLET}><S n="R"/></text>
        <text x="176" y="244" fontSize="17" fontWeight="800" fill={VIOLET}><Sq n="R"/> = <Sq n="L"/> + <Sq n="r"/></text>
      </svg>
      <ul style={liste}>
        <li><strong>Répétabilité</strong> s<sub>r</sub> : même laboratoire, mêmes conditions. <strong>Effet laboratoire</strong> s<sub>L</sub> : dispersion des moyennes.</li>
        <li><em>La reproductibilité s<sub>R</sub> est l’hypoténuse : s<sub>R</sub>² = s<sub>L</sub>² + s<sub>r</sub>², donc s<sub>R</sub> ≥ s<sub>r</sub>.</em></li>
        <li><strong>Hypothèses</strong> : même échantillon homogène, même méthode, dispersions décrites par des écarts-types.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : deux seuils, trois verdicts (Cochran et Grubbs) ──
export function FicheSeuils() {
  return (
    <div>
      <svg viewBox="0 0 400 256" style={svgStyle} role="img" aria-label="Échelle de la statistique calculée, C pour Cochran ou G pour Grubbs : sous le seuil à 5 pour cent le laboratoire est correct, entre les seuils à 5 et 1 pour cent il est isolé donc douteux et on le conserve en le signalant, au-dessus du seuil à 1 pour cent il est aberrant et on l’écarte après vérification">
        <text x="12" y="22" fontSize="14" fontWeight="800" fill={ENCRE}>statistique calculée (C ou G)</text>
        <line x1="14" y1="40" x2="386" y2="40" stroke={GRIS} strokeWidth="3" strokeLinecap="round"/><polygon points="392,40 380,33 380,47" fill={GRIS}/>
        <rect x="14" y="56" width="140" height="44" rx="10" fill="#dcfce7" stroke={VERT} strokeWidth="2.5"/>
        <rect x="154" y="56" width="100" height="44" rx="0" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5"/>
        <rect x="254" y="56" width="132" height="44" rx="10" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5"/>
        <text x="84" y="84" textAnchor="middle" fontSize="15" fontWeight="800" fill={VERT}>correct</text>
        <text x="204" y="84" textAnchor="middle" fontSize="15" fontWeight="800" fill="#a16207">isolé</text>
        <text x="320" y="84" textAnchor="middle" fontSize="15" fontWeight="800" fill={ROUGE}>aberrant</text>
        <line x1="154" y1="46" x2="154" y2="108" stroke={ENCRE} strokeWidth="2"/><line x1="254" y1="46" x2="254" y2="108" stroke={ENCRE} strokeWidth="2"/>
        <text x="154" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>seuil 5 %</text><text x="254" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>seuil 1 %</text>
        <text x="84" y="150" textAnchor="middle" fontSize="13" fill={GRIS}>on garde</text>
        <text x="204" y="150" textAnchor="middle" fontSize="13" fill={GRIS}>on garde</text><text x="204" y="167" textAnchor="middle" fontSize="13" fill={GRIS}>et on signale</text>
        <text x="320" y="150" textAnchor="middle" fontSize="13" fill={GRIS}>on écarte</text><text x="320" y="167" textAnchor="middle" fontSize="13" fill={GRIS}>après vérification</text>
        <rect x="8" y="180" width="184" height="66" rx="14" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>
        <text x="100" y="202" textAnchor="middle" fontSize="15" fontWeight="800" fill={BLEU}>Cochran</text><text x="100" y="220" textAnchor="middle" fontSize="13" fill={GRIS}>compare les variances</text><text x="100" y="237" textAnchor="middle" fontSize="13" fill={GRIS}>des essais (répétabilité)</text>
        <rect x="208" y="180" width="184" height="66" rx="14" fill="#faf5ff" stroke={VIOLET} strokeWidth="2.5"/>
        <text x="300" y="202" textAnchor="middle" fontSize="15" fontWeight="800" fill={VIOLET}>Grubbs</text><text x="300" y="220" textAnchor="middle" fontSize="13" fill={GRIS}>compare les moyennes</text><text x="300" y="237" textAnchor="middle" fontSize="13" fill={GRIS}>(loi normale supposée)</text>
      </svg>
      <ul style={liste}>
        <li><em>Deux seuils, trois verdicts : correct, isolé (douteux), aberrant.</em></li>
        <li>Un test statistique <strong>suspecte</strong>, il ne prouve pas : on ne l’écarte qu’après avoir cherché une cause technique.</li>
        <li><strong>Hypothèses</strong> : Cochran suppose la même variance de répétabilité pour tous les laboratoires ; Grubbs suppose des moyennes de loi normale.</li>
      </ul>
    </div>
  );
}

const Ligne = ({ y, a, b, ok }) => (
  <g>
    <line x1="30" y1={y} x2="370" y2={y} stroke="#cbd5e1" strokeWidth="2"/>
    <line x1={a} y1={y - 34} x2={a + 120} y2={y - 34} stroke={VIOLET} strokeWidth="3" strokeLinecap="round"/><line x1={a} y1={y - 40} x2={a} y2={y - 28} stroke={VIOLET} strokeWidth="3"/><line x1={a + 120} y1={y - 40} x2={a + 120} y2={y - 28} stroke={VIOLET} strokeWidth="3"/>
    <text x={a + 60} y={y - 42} textAnchor="middle" fontSize="15" fontWeight="800" fill={VIOLET}>r</text>
    <circle cx={a} cy={y} r="8" fill={BLEU}/><circle cx={b} cy={y} r="8" fill={BLEU}/>
    <text x={a - 14} y={y + 5} textAnchor="end" fontSize="14" fontWeight="800" fill={BLEU}>y<tspan fontSize="11" dy="4">1</tspan></text>
    <text x={b + 14} y={y + 5} fontSize="14" fontWeight="800" fill={BLEU}>y<tspan fontSize="11" dy="4">2</tspan></text>
    <DF x1={a} x2={b} y={y + 24} c={ok ? VERT : ROUGE}/>
    <text x="388" y={y + 8} textAnchor="end" fontSize="22" fontWeight="800" fill={ok ? VERT : ROUGE}>{ok ? '✓' : '✗'}</text>
  </g>
);

// ── Carte 3 : limite de répétabilité, essais compatibles ou non ──
export function FicheCompat() {
  return (
    <div>
      <svg viewBox="0 0 400 238" style={svgStyle} role="img" aria-label="Limite de répétabilité r : si l’écart entre deux essais est plus petit que la règle r, ils sont compatibles et on fait la moyenne ; s’il est plus grand que r, on cherche la cause et on refait des essais">
        <Ligne y={58} a={110} b={176} ok/>
        <text x="30" y="108" fontSize="13" fill={GRIS}>écart plus court que r : compatibles</text>
        <Ligne y={178} a={50} b={268} ok={false}/>
        <text x="30" y="228" fontSize="13" fill={GRIS}>écart plus long que r : on cherche la cause</text>
      </svg>
      <ul style={liste}>
        <li><em>Écart plus court que la règle r : on moyenne. Plus long : on enquête et on refait des essais.</em></li>
        <li>r = 2,8 × s<sub>r</sub>, avec 2,8 ≈ 1,96 × √2 (seuil à 95 % sur l’écart de deux essais).</li>
        <li><strong>Hypothèses</strong> : deux essais en conditions de répétabilité, de loi normale d’écart-type s<sub>r</sub> ; un écart supérieur à r survient quand même par hasard 5 fois sur 100.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : écrire le résultat ȳ ± U ──
export function FicheEcriture() {
  return (
    <div>
      <svg viewBox="0 0 400 252" style={svgStyle} role="img" aria-label="Écriture d’un résultat : la moyenne au centre, entourée d’une incertitude élargie U égale à k fois u, avec u l’écart-type de reproductibilité et k égal à 2 ; exemple 5,43 plus ou moins 0,12 millimole par litre, k égal à 2">
        <line x1="20" y1="92" x2="380" y2="92" stroke="#cbd5e1" strokeWidth="2"/>
        <line x1="104" y1="92" x2="296" y2="92" stroke="#fdba74" strokeWidth="10" strokeLinecap="round"/>
        <line x1="104" y1="76" x2="104" y2="108" stroke={ORANGE} strokeWidth="3"/><line x1="296" y1="76" x2="296" y2="108" stroke={ORANGE} strokeWidth="3"/>
        <circle cx="200" cy="92" r="10" fill={BLEU} stroke="#fff" strokeWidth="2"/>
        <text x="200" y="64" textAnchor="middle" fontSize="16" fontWeight="800" fill={BLEU}>ȳ</text>
        <DF x1={200} x2={248} y={130} c={VIOLET}/><text x="224" y="156" textAnchor="middle" fontSize="15" fontWeight="800" fill={VIOLET}>u = <S n="R"/></text>
        <DF x1={200} x2={296} y={176} c={ORANGE}/><text x="248" y="202" textAnchor="middle" fontSize="15" fontWeight="800" fill={ORANGE}>U = k × u</text>
        <rect x="30" y="212" width="340" height="38" rx="19" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="200" y="237" textAnchor="middle" fontSize="16" fontWeight="800" fill={VERT}>5,43 ± 0,12 mmol/L (k = 2)</text>
      </svg>
      <ul style={liste}>
        <li><em>ȳ ± U : même nombre de décimales, U en 1 ou 2 chiffres significatifs, avec k et l’unité.</em></li>
        <li>Incertitude-type u = s<sub>R</sub> (elle contient l’effet laboratoire) ; U = k × u, k = 2 pour environ 95 %.</li>
        <li><strong>Hypothèses</strong> : loi normale pour le niveau de confiance de 95 % ; votre laboratoire est représentatif de ceux de l’étude.</li>
      </ul>
    </div>
  );
}

const Cible = ({ cx, cy, pts, titre, sous, c }) => (
  <g>
    <circle cx={cx} cy={cy} r="42" fill="#fff" stroke={GRIS} strokeWidth="2.5"/><circle cx={cx} cy={cy} r="26" fill="none" stroke="#94a3b8" strokeWidth="2"/><circle cx={cx} cy={cy} r="9" fill="#fecaca" stroke="#94a3b8" strokeWidth="2"/>
    {pts.map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r="4.5" fill={BLEU}/>)}
    <text x={cx} y={cy + 66} textAnchor="middle" fontSize="14" fontWeight="800" fill={c}>{titre}</text>
    <text x={cx} y={cy + 83} textAnchor="middle" fontSize="13" fill={GRIS}>{sous}</text>
  </g>
);
// ── Carte 5 : fidélité et justesse, quatre cibles ──
export function FicheJustesse() {
  return (
    <div>
      <svg viewBox="0 0 400 306" style={svgStyle} role="img" aria-label="Quatre cibles : fidèle et juste, les points sont groupés au centre ; fidèle mais pas juste, ils sont groupés loin du centre ; juste en moyenne mais pas fidèle, ils sont dispersés autour du centre ; ni fidèle ni juste, dispersés et décalés">
        <Cible cx={100} cy={56} pts={[[-6, -4], [4, -7], [7, 4], [-3, 7], [0, 1]]} titre="fidèle et juste" sous="groupés au centre" c={VERT}/>
        <Cible cx={300} cy={56} pts={[[18, 12], [26, 8], [23, 20], [14, 20], [20, 16]]} titre="fidèle, pas juste" sous="biais systématique" c={ORANGE}/>
        <Cible cx={100} cy={196} pts={[[-26, -10], [24, 14], [-8, 28], [10, -28], [-20, 22]]} titre="juste, pas fidèle" sous="dispersés autour du centre" c={ORANGE}/>
        <Cible cx={300} cy={196} pts={[[6, -20], [30, 24], [-12, 22], [34, -4], [22, 32]]} titre="ni fidèle ni juste" sous="dispersés et décalés" c={ROUGE}/>
      </svg>
      <ul style={liste}>
        <li><strong>Fidélité</strong> = dispersion des résultats (s<sub>r</sub>, s<sub>R</sub>). <strong>Justesse</strong> = proximité d’une valeur de référence.</li>
        <li><em>L’étude interlaboratoire mesure la fidélité, pas la justesse : un s<sub>R</sub> petit n’annonce pas une méthode juste.</em></li>
        <li><strong>Hypothèse</strong> : la valeur de référence est connue avec son incertitude (ici 10,00 mmol/L), c’est ce qui permet de juger la justesse.</li>
      </ul>
    </div>
  );
}
