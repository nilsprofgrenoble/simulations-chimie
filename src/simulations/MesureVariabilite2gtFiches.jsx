// Cartes « À retenir » de la simulation « Mesure : variabilité, histogramme, moyenne et écart-type » (sim 193, 2GT).
// Chaque carte est posée sur l'ÉTAPE SUIVANT la question qu'elle conclut, et ses exemples chiffrés sont différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 13 à 16 (≥ 10 px rendus).
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#6d28d9';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const NB = ' ';

// barres d'un mini-histogramme : vals = hauteurs en pixels, de gauche à droite
const Barres = ({ x0, yb, larg, vals, c = BLEU, op = 0.9 }) => (<g>
  {vals.map((h, i) => h > 0 && <rect key={i} x={x0 + i * larg + 1} y={yb - h} width={larg - 2} height={h} fill={c} opacity={op}/>)}
  <line x1={x0 - 4} y1={yb} x2={x0 + vals.length * larg + 4} y2={yb} stroke={GRIS} strokeWidth="1.8"/></g>);
const Fl2 = ({ x1, x2, y, c }) => (<g stroke={c} fill={c}>
  <line x1={x1 + 6} y1={y} x2={x2 - 6} y2={y} strokeWidth="2.4"/>
  <polygon points={`${x1},${y} ${x1 + 9},${y - 5} ${x1 + 9},${y + 5}`} stroke="none"/><polygon points={`${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}`} stroke="none"/></g>);

// ── Carte 1 : mesurande, série, variabilité ──
export function FicheVariabilite() {
  const pts = [[66, 92], [88, 74], [100, 92], [112, 56], [124, 74], [136, 92], [148, 74], [160, 92], [186, 92]];
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Plusieurs mesures du même mesurande : des points posés sur un axe, répartis sur un petit intervalle. Chaque point est une mesure ; les valeurs ne sont pas toutes identiques.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Un mesurande, plusieurs mesures</text>
        <line x1="24" y1="112" x2="282" y2="112" stroke={GRIS} strokeWidth="2.2"/>
        <polygon points="288,112 277,106 277,118" fill={GRIS}/>
        {pts.map(([x, y], i) => <circle key={i} cx={x + 20} cy={y} r="8" fill={BLEU} stroke="#fff" strokeWidth="1.6"/>)}
        <Fl2 x1={80} x2={216} y={132} c={ORANGE}/>
        <text x="148" y="154" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>les valeurs s’étalent un peu</text>
        <text x="282" y="178" textAnchor="end" fontSize="13.5" fill={GRIS}>valeur mesurée →</text>
        <text x="24" y="44" fontSize="13.5" fill={GRIS}>un point = une mesure</text>
      </svg>
      <ul style={liste}>
        <li><strong>Mesurande</strong> : la grandeur que l’on veut mesurer (par exemple la masse d’un caillou).</li>
        <li><strong>Série de mesures</strong> : plusieurs mesures du même mesurande, dans les mêmes conditions.</li>
        <li><strong>Variabilité</strong> : d’une mesure à l’autre, la valeur change un peu. Ce n’est pas une faute.</li>
        <li>Exemple : 12,31{NB}g ; 12,34{NB}g ; 12,29{NB}g pour le même caillou.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : histogramme ──
export function FicheHistogramme() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Un histogramme : l’axe horizontal est découpé en classes, la hauteur de chaque barre est le nombre de mesures de la classe. Les bornes d’une classe : la borne de gauche est incluse, celle de droite est exclue.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Lire un histogramme</text>
        <line x1="40" y1="40" x2="40" y2="150" stroke={GRIS} strokeWidth="1.8"/>
        <Barres x0={50} yb={150} larg={44} vals={[18, 54, 90, 54, 18]}/>
        <rect x="94" y="96" width="44" height="54" fill={ORANGE} opacity="0.95" stroke="#fff"/>
        <text x="116" y="130" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">3</text>
        <text x="46" y="36" fontSize="13.5" fill={GRIS}>nombre de mesures</text>
        <line x1="94" y1="156" x2="138" y2="156" stroke={ORANGE} strokeWidth="2.4"/><line x1="94" y1="152" x2="94" y2="160" stroke={ORANGE} strokeWidth="2.4"/><line x1="138" y1="152" x2="138" y2="160" stroke={ORANGE} strokeWidth="2.4"/>
        <text x="116" y="176" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>une classe</text>
        <text x="276" y="196" textAnchor="end" fontSize="13.5" fill={GRIS}>valeur mesurée →</text>
        <text x="30" y="196" fontSize="13.5" fill={GRIS}>[a ; b[ : a inclus, b exclu</text>
      </svg>
      <ul style={liste}>
        <li><strong>Classe</strong> : un petit intervalle de valeurs, de largeur choisie.</li>
        <li><strong>Hauteur d’une barre</strong> : le nombre de mesures de la classe.</li>
        <li>Une valeur égale à la borne de droite passe dans la classe suivante.</li>
        <li>Au tableur : on place les valeurs dans une colonne, puis on demande un graphique de type histogramme (on règle la largeur des classes).</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : moyenne ──
export function FicheMoyenne() {
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="La moyenne comme point d’équilibre : quatre valeurs placées sur un axe gradué de 1 à 7 comme des poids sur une planche ; la planche est en équilibre sur un triangle placé à la moyenne, 3. Formule : moyenne égale somme des valeurs divisée par nombre de valeurs.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>La moyenne : le point d’équilibre</text>
        {[1, 2, 3, 6].map(v => <circle key={v} cx={30 + (v - 1) * 40} cy={68} r="13" fill={BLEU} stroke="#fff" strokeWidth="1.6"/>)}
        <rect x="14" y="82" width="272" height="10" rx="3" fill="#cbd5e1" stroke={GRIS}/>
        <polygon points={`${30 + 2 * 40},92 ${30 + 2 * 40 - 16},118 ${30 + 2 * 40 + 16},118`} fill={ORANGE}/>
        {[1, 2, 3, 4, 5, 6, 7].map(v => <text key={v} x={30 + (v - 1) * 40} y="138" textAnchor="middle" fontSize="14" fill={GRIS}>{v}</text>)}
        <text x="110" y="158" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>moyenne = 3</text>
        <rect x="14" y="168" width="272" height="26" rx="8" fill="#fff7ed" stroke={ORANGE}/>
        <text x="150" y="186" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ENCRE}>somme des valeurs ÷ nombre de valeurs</text>
      </svg>
      <ul style={liste}>
        <li><strong>Moyenne</strong> : on additionne toutes les valeurs, puis on divise par leur nombre.</li>
        <li>Elle indique le <strong>centre</strong> de la série ; elle est toujours comprise entre la plus petite et la plus grande valeur.</li>
        <li>Exemple : 1, 2, 3 et 6 donnent (1 + 2 + 3 + 6) ÷ 4 = 12 ÷ 4 = 3.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : dispersion et écart-type ──
export function FicheDispersion() {
  return (
    <div>
      <svg viewBox="0 0 300 244" style={svgStyle} role="img" aria-label="Deux histogrammes de même centre, tracés sur le même axe : un étroit et haut, un large et bas. L’écart-type est petit pour la série étroite, grand pour la série large : il mesure la largeur de la série.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>L’écart-type : la largeur</text>
        <Barres x0={100} yb={86} larg={20} vals={[14, 40, 56, 40, 14]} c={BLEU}/>
        <Barres x0={80} yb={170} larg={20} vals={[10, 24, 36, 40, 36, 24, 10]} c={VIOLET}/>
        <line x1="150" y1="34" x2="150" y2="172" stroke={GRIS} strokeWidth="1.6" strokeDasharray="4 4"/>
        <Fl2 x1={100} x2={200} y={100} c={BLEU}/>
        <Fl2 x1={80} x2={220} y={184} c={VIOLET}/>
        <text x="208" y="62" fontSize="15" fontWeight="700" fill={BLEU}>étroit</text>
        <text x="208" y="80" fontSize="14" fill={ENCRE}>s petit</text>
        <text x="228" y="148" fontSize="15" fontWeight="700" fill={VIOLET}>large</text>
        <text x="228" y="166" fontSize="14" fill={ENCRE}>s grand</text>
        <rect x="14" y="198" width="272" height="40" rx="8" fill="#eff6ff" stroke={BLEU}/>
        <text x="150" y="216" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>moyenne = le centre (même axe)</text>
        <text x="150" y="232" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>écart-type s = la largeur</text>
      </svg>
      <ul style={liste}>
        <li><strong>Dispersion</strong> : à quel point les valeurs sont étalées autour de la moyenne.</li>
        <li><strong>Écart-type <em>s</em></strong> : un nombre qui mesure cette largeur, dans la même unité que les mesures. Le tableur ou la calculatrice le donne.</li>
        <li><em>s</em> grand : série étalée. <em>s</em> petit : série serrée.</li>
        <li>Deux séries peuvent avoir la même moyenne et des écarts-types très différents.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : instrument et protocole ──
export function FicheInstrumentProtocole() {
  return (
    <div>
      <svg viewBox="0 0 300 236" style={svgStyle} role="img" aria-label="Sur un même axe, Un meilleur instrument ou un meilleur protocole donne une série plus étroite. En haut : règle graduée, série large, puis pied à coulisse, série étroite. En bas : un intervalle chronométré, série large, puis dix intervalles chronométrés d’un coup et divisés par dix, série étroite.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Instrument et protocole</text>
        <Barres x0={94} yb={86} larg={16} vals={[8, 20, 30, 34, 30, 20, 8]} c={VIOLET} op={0.6}/>
        <Barres x0={126} yb={86} larg={16} vals={[14, 52, 14]} c={BLEU}/>
        <text x="88" y="70" textAnchor="end" fontSize="13" fontWeight="700" fill={VIOLET}>règle</text>
        <text x="212" y="60" fontSize="13" fontWeight="700" fill={BLEU}>pied à</text>
        <text x="212" y="76" fontSize="13" fontWeight="700" fill={BLEU}>coulisse</text>
        <line x1="14" y1="108" x2="286" y2="108" stroke="#cbd5e1" strokeWidth="1.4"/>
        <Barres x0={94} yb={170} larg={16} vals={[8, 20, 30, 34, 30, 20, 8]} c={VIOLET} op={0.6}/>
        <Barres x0={126} yb={170} larg={16} vals={[14, 52, 14]} c={BLEU}/>
        <text x="88" y="154" textAnchor="end" fontSize="13" fontWeight="700" fill={VIOLET}>1 intervalle</text>
        <text x="212" y="144" fontSize="13" fontWeight="700" fill={BLEU}>10 intervalles</text>
        <text x="212" y="160" fontSize="13" fontWeight="700" fill={BLEU}>÷ 10</text>
        <text x="150" y="206" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ENCRE}>Même axe : la série bleue est plus étroite,</text>
        <text x="150" y="224" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ENCRE}>son écart-type s est plus petit.</text>
      </svg>
      <ul style={liste}>
        <li>L’<strong>instrument</strong> et le <strong>protocole</strong> changent la dispersion d’une série.</li>
        <li>Une série plus étroite permet de repérer de plus petites différences.</li>
        <li>Une différence nettement plus petite que <em>s</em> se perd dans la variabilité.</li>
        <li>Exemple : on chronomètre 10 oscillations d’un pendule d’un coup, puis on divise par 10.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : indépendance ──
export function FicheIndependance() {
  const ok = [70, 52, 80, 60, 76, 50, 66, 78], tendance = [92, 86, 80, 70, 62, 54, 46, 40];
  const plot = (x0, ys, c) => <g>
    <line x1={x0} y1="100" x2={x0 + 112} y2="100" stroke={GRIS} strokeWidth="1.8"/><line x1={x0} y1="34" x2={x0} y2="100" stroke={GRIS} strokeWidth="1.8"/>
    {ys.map((y, i) => <circle key={i} cx={x0 + 12 + i * 13.5} cy={y} r="5.5" fill={c} stroke="#fff" strokeWidth="1.2"/>)}</g>;
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Deux séries tracées dans l’ordre des mesures. À gauche, les points se répartissent au hasard autour d’une valeur : mesures indépendantes, la moyenne a un sens. À droite, les points montent régulièrement : le mesurande change pendant la série, la moyenne n’a plus de sens.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Tracer dans l’ordre des mesures</text>
        {plot(20, ok, BLEU)}{plot(168, tendance, ROUGE)}
        <text x="76" y="122" textAnchor="middle" fontSize="14" fontWeight="700" fill={VERT}>aucune tendance</text>
        <text x="224" y="122" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>ça monte</text>
        <text x="76" y="146" textAnchor="middle" fontSize="20" fontWeight="700" fill={VERT}>✓</text>
        <text x="224" y="146" textAnchor="middle" fontSize="20" fontWeight="700" fill={ROUGE}>✗</text>
        <text x="150" y="168" textAnchor="middle" fontSize="13.5" fill={GRIS}>horizontalement : numéro de la mesure</text>
        <text x="150" y="190" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>indépendantes : rien ne change en route</text>
      </svg>
      <ul style={liste}>
        <li><strong>Mesures indépendantes</strong> : faites dans les mêmes conditions, sans que l’une influence la suivante.</li>
        <li><strong>Test</strong> : tracer les valeurs dans l’ordre des mesures. Pas de tendance, c’est bon.</li>
        <li>Une tendance montre que le mesurande change : la moyenne et l’écart-type n’ont plus de sens pour la série.</li>
        <li>Exemple : une boisson qui refroidit pendant qu’on mesure sa température.</li>
      </ul>
    </div>
  );
}

// ── Carte 7 : bilan ──
export function FicheBilan() {
  const caisse = (y, c, t1, t2) => (<g><rect x="10" y={y} width="280" height="44" rx="10" fill="white" stroke={c} strokeWidth="2.4"/>
    <text x="150" y={y + 20} textAnchor="middle" fontSize="15" fontWeight="700" fill={c}>{t1}</text><text x="150" y={y + 37} textAnchor="middle" fontSize="13.5" fill={ENCRE}>{t2}</text></g>);
  const fl = y => <g fill={GRIS} stroke={GRIS}><line x1="150" y1={y} x2="150" y2={y + 10} strokeWidth="2.4"/><polygon points={`150,${y + 17} 144,${y + 8} 156,${y + 8}`} stroke="none"/></g>;
  return (
    <div>
      <svg viewBox="0 0 300 230" style={svgStyle} role="img" aria-label="Résumé : répéter la mesure donne une série, on la range en histogramme, puis on la résume par la moyenne (le centre) et l’écart-type (la largeur). Conditions : mesures indépendantes, série à peu près symétrique.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Une série de mesures</text>
        {caisse(30, BLEU, 'Répéter la mesure', 'même mesurande, mêmes conditions')}
        {fl(76)}
        {caisse(96, VIOLET, 'Ranger', 'histogramme : valeurs par classes')}
        {fl(142)}
        {caisse(162, ORANGE, 'Résumer', 'moyenne : centre · écart-type : largeur')}
        <text x="150" y="223" textAnchor="middle" fontSize="13" fontWeight="700" fill={ROUGE}>si indépendantes et à peu près symétriques</text>
      </svg>
      <ul style={liste}>
        <li>Plus l’instrument ou le protocole est bon, plus la série est étroite.</li>
        <li>Plus de mesures : l’histogramme est mieux dessiné, mais l’écart-type ne devient pas plus petit.</li>
        <li><strong>Hypothèses</strong> : mesures indépendantes ; série à peu près symétrique autour de son centre ; l’écart-type décrit la série, pas l’erreur sur la moyenne.</li>
      </ul>
    </div>
  );
}
