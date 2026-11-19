// Cartes « À retenir » de la simulation Optimiser une synthèse (sim 90) : un schéma dessiné et une idée mémorisable par carte.
import { Formule } from '../commun';

const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

const Fl = ({ x1, y1, x2, y2, c = ORANGE, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11;
  const p = `${x2},${y2} ${x2 - L * Math.cos(a - 0.45)},${y2 - L * Math.sin(a - 0.45)} ${x2 - L * Math.cos(a + 0.45)},${y2 - L * Math.sin(a + 0.45)}`;
  return <g><line x1={x1} y1={y1} x2={x2 - 8 * Math.cos(a)} y2={y2 - 8 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};

// ── Carte 1 : courbe x(t) et temps de demi-réaction ──
export function FicheCourbe() {
  const X = s => 58 + s * 64, Y = v => 196 - v * 150;           // s = t / t½ (0 à 5), v = x / x_éq (0 à 1)
  const pts = []; for (let i = 0; i <= 50; i++) { const s = i / 10; pts.push(`${X(s).toFixed(1)},${Y(1 - Math.pow(2, -s)).toFixed(1)}`); }
  return (
    <div>
      <svg viewBox="0 0 400 252" style={svgStyle} role="img" aria-label="Courbe d’avancement : x augmente vite puis se stabilise sur le palier x éq ; le temps de demi-réaction est la durée pour atteindre la moitié du palier ; la pente, qui est la vitesse, diminue jusqu’à s’annuler">
        <line x1="58" y1="196" x2="388" y2="196" stroke={GRIS} strokeWidth="2.5"/><line x1="58" y1="196" x2="58" y2="18" stroke={GRIS} strokeWidth="2.5"/>
        <text x="388" y="222" textAnchor="end" fontSize="14" fontWeight="700" fill={GRIS}>t (min)</text><text x="64" y="20" fontSize="14" fontWeight="700" fill={GRIS}>x (mol)</text>
        <line x1="58" y1={Y(1)} x2="380" y2={Y(1)} stroke={VERT} strokeWidth="2" strokeDasharray="7 5"/>
        <text x="384" y={Y(1) - 8} textAnchor="end" fontSize="14" fontWeight="800" fill={VERT}>palier x<tspan fontSize="11" dy="4">éq</tspan></text>
        <line x1="58" y1={Y(0.5)} x2={X(1)} y2={Y(0.5)} stroke={ORANGE} strokeWidth="2" strokeDasharray="5 4"/><line x1={X(1)} y1={Y(0.5)} x2={X(1)} y2="196" stroke={ORANGE} strokeWidth="2" strokeDasharray="5 4"/>
        <text x="52" y={Y(0.5) + 5} textAnchor="end" fontSize="13" fontWeight="700" fill={ORANGE}>½</text>
        <polyline points={pts.join(' ')} fill="none" stroke={BLEU} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
        <circle cx={X(1)} cy={Y(0.5)} r="6" fill={BLEU} stroke="#fff" strokeWidth="2"/>
        <text x={X(1)} y="216" textAnchor="middle" fontSize="15" fontWeight="800" fill={ORANGE}>t<tspan fontSize="11" dy="4">1/2</tspan></text>
        <line x1="58" y1="196" x2="108" y2="92" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
        <text x="126" y="76" fontSize="13" fontWeight="700" fill="#7c3aed">pente = vitesse</text>
        <text x="126" y="93" fontSize="13" fill="#7c3aed">forte au début</text>
        <text x="384" y="134" textAnchor="end" fontSize="13" fill={GRIS}>pente nulle</text><text x="384" y="151" textAnchor="end" fontSize="13" fill={GRIS}>à l’équilibre</text>
      </svg>
      <Formule><mi>x</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><msub><mi>x</mi><mtext>éq</mtext></msub><mo>(</mo><mn>1</mn><mo>−</mo><msup><mi>e</mi><mrow><mo>−</mo><mi>k</mi><mi>t</mi></mrow></msup><mo>)</mo><mspace width="1.2em"/><msub><mi>t</mi><mrow><mn>1</mn><mo>/</mo><mn>2</mn></mrow></msub><mo>=</mo><mfrac><mrow><mi>ln</mi><mo>(</mo><mn>2</mn><mo>)</mo></mrow><mi>k</mi></mfrac></Formule>
      <ul style={liste}>
        <li><em>k grand ⇒ t<sub>1/2</sub> court : la réaction est plus rapide.</em></li>
        <li>Exemple : k = 0,050 min⁻¹ → t<sub>1/2</sub> = 0,693 / 0,050 ≈ <strong>14 min</strong> (k en min⁻¹, t<sub>1/2</sub> en min).</li>
        <li><strong>Hypothèse</strong> : modèle d’ordre 1 fourni par la simulation, k constant à température et composition données.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : les trois leviers de vitesse ──
const Col = ({ x, titre, couleur, bg, f1, f2, children }) => (
  <g>
    <rect x={x} y="10" width="124" height="176" rx="16" fill={bg} stroke={couleur} strokeWidth="2.5"/>
    <text x={x + 62} y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill={couleur}>{titre}</text>
    {children}
    <text x={x + 62} y="148" textAnchor="middle" fontSize="13" fill={GRIS}>{f1}</text>
    <text x={x + 62} y="172" textAnchor="middle" fontSize="18" fontWeight="800" fill={couleur}>{f2}</text>
  </g>
);
export function FicheLeviers() {
  const dots = [[18, 64], [44, 82], [72, 66], [98, 86], [30, 100], [60, 108], [88, 112], [20, 124], [50, 128], [96, 126]];
  return (
    <div>
      <svg viewBox="0 0 400 196" style={svgStyle} role="img" aria-label="Trois leviers pour accélérer une réaction : chauffer, avec k multipliée par 2 tous les 10 degrés ; concentrer, avec plus de chocs par litre ; ajouter un catalyseur, avec k multipliée par 4">
        <Col x={6} titre="chauffer" couleur={ORANGE} bg="#fff7ed" f1="+ 10 °C" f2="k × 2">
          <rect x="52" y="46" width="20" height="62" rx="10" fill="#fff" stroke={ORANGE} strokeWidth="2.5"/><circle cx="62" cy="112" r="14" fill={ORANGE}/><rect x="58" y="62" width="8" height="48" rx="4" fill={ORANGE}/>
          <line x1="80" y1="58" x2="92" y2="58" stroke={ORANGE} strokeWidth="2.5"/><line x1="80" y1="78" x2="92" y2="78" stroke={ORANGE} strokeWidth="2.5"/><line x1="80" y1="98" x2="92" y2="98" stroke={ORANGE} strokeWidth="2.5"/>
        </Col>
        <Col x={138} titre="concentrer" couleur={BLEU} bg="#eff6ff" f1="plus de chocs" f2="k plus grand">
          <rect x="164" y="46" width="72" height="88" rx="8" fill="#fff" stroke={BLEU} strokeWidth="2.5"/>
          {dots.map(([dx, dy], i) => <circle key={i} cx={166 + dx * 0.68} cy={dy - 8} r="4.5" fill={i % 2 ? BLEU : ROUGE}/>)}
        </Col>
        <Col x={270} titre="catalyser" couleur={VERT} bg="#f0fdf4" f1="col plus bas" f2="k × 4">
          <path d="M282,118 C300,118 304,56 332,56 S356,118 376,118" fill="none" stroke="#fca5a5" strokeWidth="3" strokeDasharray="6 4"/>
          <path d="M282,118 C300,118 306,88 332,88 S356,118 376,118" fill="none" stroke={VERT} strokeWidth="3.5"/>
          <line x1="282" y1="118" x2="376" y2="118" stroke={GRIS} strokeWidth="1.5"/>
        </Col>
      </svg>
      <ul style={liste}>
        <li><em>Chauffer, concentrer, catalyser : k augmente, t<sub>1/2</sub> diminue.</em></li>
        <li>Une réaction a lieu par des <strong>chocs efficaces</strong> : assez énergétiques et bien orientés. Chauffer les rend plus fréquents et plus violents ; diluer les raréfie.</li>
        <li><strong>Hypothèses</strong> : « × 2 tous les 10 °C » est une règle simplifiée d’Arrhenius ; facteur de concentration borné entre 0,5 et 2.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : le catalyseur abaisse le col, pas les niveaux ──
export function FicheCatalyseur() {
  return (
    <div>
      <svg viewBox="0 0 400 248" style={svgStyle} role="img" aria-label="Profil réactionnel : sans catalyseur le col d’énergie d’activation est haut, avec catalyseur il est plus bas ; les niveaux des réactifs et des produits ne changent pas">
        <line x1="40" y1="206" x2="392" y2="206" stroke={GRIS} strokeWidth="2.5"/><line x1="40" y1="206" x2="40" y2="14" stroke={GRIS} strokeWidth="2.5"/>
        <text x="48" y="22" fontSize="14" fontWeight="700" fill={GRIS}>énergie</text><text x="388" y="230" textAnchor="end" fontSize="14" fontWeight="700" fill={GRIS}>avancement</text>
        <line x1="48" y1="150" x2="100" y2="150" stroke={ENCRE} strokeWidth="3"/><text x="74" y="174" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>réactifs</text>
        <line x1="300" y1="160" x2="352" y2="160" stroke={ENCRE} strokeWidth="3"/><text x="326" y="184" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>produits</text>
        <path d="M100,150 C140,150 150,36 200,36 S270,160 300,160" fill="none" stroke={ORANGE} strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M100,150 C140,150 152,86 200,86 S270,160 300,160" fill="none" stroke={BLEU} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="200" y1="36" x2="200" y2="148" stroke={ORANGE} strokeWidth="1.8" strokeDasharray="5 4"/>
        <Fl x1={126} y1={140} x2={126} y2={40} c={ORANGE} w={2.5}/>
        <text x="118" y="98" textAnchor="end" fontSize="15" fontWeight="800" fill={ORANGE}>Eₐ</text>
        <Fl x1={166} y1={140} x2={166} y2={92} c={BLEU} w={2.5}/>
        <text x="174" y="128" fontSize="15" fontWeight="800" fill={BLEU}>Eₐ’</text>
        <text x="226" y="34" fontSize="14" fontWeight="700" fill={ORANGE}>sans catalyseur</text>
        <text x="226" y="82" fontSize="14" fontWeight="700" fill={BLEU}>avec catalyseur</text>
      </svg>
      <ul style={liste}>
        <li><em>Le catalyseur abaisse le col, pas les niveaux : il fait gagner du temps, jamais du rendement.</em></li>
        <li>Il est <strong>régénéré</strong> : sa quantité est la même au début et à la fin ; il ne change ni K ni x<sub>éq</sub>.</li>
        <li><strong>Homogène</strong> : même phase que les réactifs (acide dissous) ; <strong>hétérogène</strong> : phase différente (résine solide), récupérée par filtration.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : rendement, une étape puis plusieurs ──
const Barre = ({ y, w, c, t, bg }) => <g><rect x="44" y={y} width="320" height="30" rx="15" fill="#e2e8f0"/><rect x="44" y={y} width={w} height="30" rx="15" fill={c}/><text x={44 + w - 12} y={y + 21} textAnchor="end" fontSize="14" fontWeight="800" fill={bg}>{t}</text></g>;
export function FicheRendement() {
  return (
    <div>
      <svg viewBox="0 0 400 250" style={svgStyle} role="img" aria-label="Le rendement compare la quantité obtenue à la quantité maximale : 0,40 mole sur 0,50 mole donne 80 pour cent ; en plusieurs étapes, les pertes se multiplient : 90 pour cent puis 80 pour cent donnent 72 pour cent">
        <text x="12" y="24" fontSize="14" fontWeight="800" fill={ENCRE}>une étape</text>
        <Barre y={36} w={320} c="#cbd5e1" t="n max = 0,50 mol" bg={ENCRE}/>
        <Barre y={76} w={256} c={VERT} t="n obtenu = 0,40 mol" bg="#fff"/>
        <text x="200" y="128" textAnchor="middle" fontSize="16" fontWeight="800" fill={VERT}>R = 0,40 / 0,50 = 80 %</text>
        <line x1="12" y1="142" x2="388" y2="142" stroke="#cbd5e1" strokeWidth="2"/>
        <text x="12" y="166" fontSize="14" fontWeight="800" fill={ENCRE}>plusieurs étapes : les pertes se multiplient</text>
        <rect x="12" y="180" width="108" height="42" rx="12" fill="#dcfce7" stroke={VERT} strokeWidth="2.5"/><text x="66" y="206" textAnchor="middle" fontSize="15" fontWeight="800" fill={VERT}>90 %</text>
        <text x="136" y="208" textAnchor="middle" fontSize="20" fontWeight="800" fill={GRIS}>×</text>
        <rect x="152" y="180" width="108" height="42" rx="12" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5"/><text x="206" y="206" textAnchor="middle" fontSize="15" fontWeight="800" fill="#a16207">80 %</text>
        <text x="276" y="208" textAnchor="middle" fontSize="20" fontWeight="800" fill={GRIS}>=</text>
        <rect x="292" y="180" width="96" height="42" rx="12" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5"/><text x="340" y="206" textAnchor="middle" fontSize="16" fontWeight="800" fill={ROUGE}>72 %</text>
        <text x="200" y="242" textAnchor="middle" fontSize="13" fill={GRIS}>0,90 × 0,80 = 0,72 : pas la moyenne (85 %)</text>
      </svg>
      <Formule><mi>R</mi><mo>=</mo><mfrac><msub><mi>n</mi><mtext>obtenu</mtext></msub><msub><mi>n</mi><mtext>max</mtext></msub></mfrac><mo>×</mo><mn>100</mn><mspace width="1.2em"/><msub><mi>R</mi><mtext>global</mtext></msub><mo>=</mo><msub><mi>R</mi><mn>1</mn></msub><mo>×</mo><msub><mi>R</mi><mn>2</mn></msub><mo>×</mo><msub><mi>R</mi><mn>3</mn></msub></Formule>
      <ul style={liste}>
        <li><em>Le rendement ne dépasse jamais 100 % : obtenu sur maximal, jamais l’inverse.</em></li>
        <li>Plus il y a d’étapes, plus le rendement global s’effondre.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : l'équilibre limite le rendement, comment le déplacer ──
export function FicheEquilibre() {
  const L = [['équimolaire (r = 1)', 67, '#94a3b8'], ['excès d’éthanol (r = 5)', 94.5, BLEU], ['eau éliminée', 97, VERT], ['anhydride d’acide', 98, '#7c3aed']];
  return (
    <div>
      <svg viewBox="0 0 400 258" style={svgStyle} role="img" aria-label="L’estérification est limitée par un équilibre : acide plus éthanol donnent ester plus eau et réciproquement ; l’avancement à l’équilibre est de 67 pour cent pour un mélange équimolaire, 94,5 pour cent avec un excès d’éthanol, 97 pour cent en éliminant l’eau et 98 pour cent avec un anhydride d’acide">
        <rect x="8" y="8" width="384" height="52" rx="26" fill="#f8fafc" stroke={GRIS} strokeWidth="2.5"/>
        <text x="96" y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>acide + éthanol</text>
        <text x="200" y="42" textAnchor="middle" fontSize="26" fontWeight="800" fill={BLEU}>⇌</text>
        <text x="304" y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>ester + eau</text>
        <text x="12" y="88" fontSize="14" fontWeight="800" fill={ENCRE}>avancement à l’équilibre</text><text x="388" y="88" textAnchor="end" fontSize="13" fill={GRIS}>(rendement maximal)</text>
        {L.map(([nom, v, c], i) => {
          const y = 100 + i * 36, w = v / 100 * 180;
          return <g key={nom}><text x="12" y={y + 18} fontSize="13" fontWeight="700" fill={ENCRE}>{nom}</text><rect x="158" y={y} width={w} height="26" rx="13" fill={c}/><text x={158 + w + 6} y={y + 18} fontSize="13" fontWeight="800" fill={c === '#94a3b8' ? GRIS : c}>{v === 94.5 ? '94,5' : v} %</text></g>;
        })}
        <text x="200" y="254" textAnchor="middle" fontSize="13" fill={GRIS}>3 façons de déplacer l’équilibre vers l’ester</text>
      </svg>
      <ul style={liste}>
        <li>Estérification <strong>renversable</strong> : il reste des réactifs à l’équilibre, le rendement plafonne à x<sub>éq</sub> (K = 4 : hypothèse didactique).</li>
        <li><em>Vitesse et rendement sont deux problèmes distincts : k pour aller vite, x<sub>éq</sub> pour aller loin.</em></li>
        <li>Cahier des charges : on <strong>combine</strong> les leviers indépendants et on <strong>arbitre</strong> entre rendement, durée, coût et impact (unités de coût fictives).</li>
      </ul>
    </div>
  );
}
