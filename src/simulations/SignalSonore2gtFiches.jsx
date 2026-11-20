// Cartes « À retenir » de la simulation « Signal sonore : période, fréquence, hauteur et timbre » (sim 190, 2GT).
// Chaque carte est posée sur l'ÉTAPE SUIVANT la question qu'elle conclut, et ses exemples chiffrés sont différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 13 à 16 (≥ 10 px rendus).
import { Formule } from "../commun";
import * as M from "./signalSonore2gtModele";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VIOLET = '#6d28d9';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const NB = ' ';

// Courbe d'un signal dans un cadre : x0..x1 (largeur), yc (milieu), amp (pixels), T (pixels par période), dec (pixels de décalage)
const Courbe = ({ forme = 'sinus', x0, x1, yc, amp, T, dec = 0, c = BLEU, w = 2.6 }) => {
  const n = Math.max(60, Math.round((x1 - x0) * 1.6)), pts = [];
  for (let i = 0; i <= n; i++) { const x = x0 + i / n * (x1 - x0); pts.push(`${x.toFixed(1)},${(yc - amp * M.motif(forme, (x - x0 - dec) / T)).toFixed(1)}`); }
  return <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round"/>;
};
const Axes = ({ x0, x1, y0, yc, y1 }) => (<g>
  <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.4"/>
  <line x1={x0} y1={yc} x2={x1} y2={yc} stroke="#94a3b8" strokeWidth="1.4"/></g>);
const Fl2 = ({ x1, x2, y, c }) => (<g stroke={c} fill={c}>
  <line x1={x1 + 6} y1={y} x2={x2 - 6} y2={y} strokeWidth="2.4"/>
  <polygon points={`${x1},${y} ${x1 + 9},${y - 5} ${x1 + 9},${y + 5}`} stroke="none"/><polygon points={`${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}`} stroke="none"/></g>);

// ── Carte 1 : signal périodique et période ──
export function FichePeriode() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Un signal périodique : le même motif se répète. La période T est la durée d’un motif, mesurée d’un sommet au sommet suivant, avec une double flèche. Le creux se trouve à mi-chemin entre deux sommets : du sommet au creux, on n’a qu’une demi-période.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Un motif qui se répète</text>
        <Axes x0={20} x1={290} y0={64} yc={102} y1={140}/>
        <Courbe x0={20} x1={290} yc={102} amp={30} T={100}/>
        <polyline points={Array.from({ length: 101 }, (_, i) => `${(45 + i).toFixed(1)},${(102 - 30 * M.motif('sinus', (25 + i) / 100)).toFixed(1)}`).join(' ')} fill="none" stroke={ORANGE} strokeWidth="4.4" strokeLinecap="round"/>
        <line x1="45" y1="50" x2="45" y2="140" stroke={ORANGE} strokeWidth="1.6" strokeDasharray="4 3"/>
        <line x1="145" y1="50" x2="145" y2="140" stroke={ORANGE} strokeWidth="1.6" strokeDasharray="4 3"/>
        <Fl2 x1={45} x2={145} y={52} c={ORANGE}/>
        <text x="95" y="44" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>T = un motif</text>
        <text x="290" y="158" textAnchor="end" fontSize="13.5" fill={GRIS}>temps →</text>
        <text x="150" y="180" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>de sommet à sommet, pas de sommet à creux</text>
      </svg>
      <ul style={liste}>
        <li><strong>Signal périodique</strong> : le même motif revient, identique, à intervalles réguliers.</li>
        <li><strong>Période <em>T</em></strong> : durée d’un motif, en s ou en ms. Elle se lit entre deux points identiques qui se suivent.</li>
        <li>Exemple : deux sommets à 2{NB}ms et 8{NB}ms, donc <em>T</em> = 8 − 2 = 6{NB}ms.</li>
        <li><strong>Idée fausse</strong> : « la période va du sommet au creux ». <strong>Vrai</strong> : de sommet à sommet (le creux est à mi-chemin).</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : de ms à s ──
export function FicheUnites() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Pour passer des millisecondes aux secondes, on divise par 1 000 ; pour passer des secondes aux millisecondes, on multiplie par 1 000. Exemples : 8 millisecondes font 0,008 seconde ; 0,5 seconde fait 500 millisecondes.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>1 ms = 0,001 s</text>
        <rect x="20" y="52" width="86" height="44" rx="10" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.4"/>
        <text x="63" y="82" textAnchor="middle" fontSize="20" fontWeight="700" fill={ORANGE}>ms</text>
        <rect x="194" y="52" width="86" height="44" rx="10" fill="#eff6ff" stroke={BLEU} strokeWidth="2.4"/>
        <text x="237" y="82" textAnchor="middle" fontSize="20" fontWeight="700" fill={BLEU}>s</text>
        <path d="M110,62 L186,62" stroke={ROUGE} strokeWidth="2.6" fill="none"/><polygon points="192,62 181,56 181,68" fill={ROUGE}/>
        <text x="150" y="50" textAnchor="middle" fontSize="15" fontWeight="700" fill={ROUGE}>÷ 1 000</text>
        <path d="M190,86 L114,86" stroke={VERT} strokeWidth="2.6" fill="none"/><polygon points="108,86 119,80 119,92" fill={VERT}/>
        <text x="150" y="110" textAnchor="middle" fontSize="15" fontWeight="700" fill={VERT}>× 1 000</text>
        <rect x="14" y="124" width="272" height="52" rx="10" fill="#f8fafc" stroke="#94a3b8"/>
        <text x="150" y="146" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>8 ms = 0,008 s</text>
        <text x="150" y="166" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>0,5 s = 500 ms</text>
      </svg>
      <ul style={liste}>
        <li><strong>ms → s</strong> : on divise par 1 000 (la virgule recule de 3 rangs).</li>
        <li>Astuce : « milli » veut dire « millième », comme dans millimètre.</li>
        <li><strong>Idée fausse</strong> : « 2{NB}ms = 0,02{NB}s ». <strong>Vrai</strong> : 2{NB}ms = 0,002{NB}s, trois rangs et non deux.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : fréquence, f = 1 / T ──
export function FicheFrequence() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Deux enregistrements de même durée. En haut, une période longue : peu de motifs, une fréquence petite. En bas, une période courte : beaucoup de motifs, une fréquence grande. T et f sont inverses.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Même durée, deux signaux</text>
        <Axes x0={20} x1={290} y0={32} yc={62} y1={92}/>
        <Courbe x0={20} x1={290} yc={62} amp={22} T={135} c={BLEU}/>
        <text x="150" y="108" textAnchor="middle" fontSize="14" fontWeight="700" fill={BLEU}>T grande : peu de motifs, f petite</text>
        <Axes x0={20} x1={290} y0={118} yc={148} y1={178}/>
        <Courbe x0={20} x1={290} yc={148} amp={22} T={45} c={ORANGE}/>
        <text x="150" y="196" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>T petite : beaucoup de motifs, f grande</text>
      </svg>
      <Formule><mi>f</mi><mo>=</mo><mfrac><mn>1</mn><mi>T</mi></mfrac></Formule>
      <ul style={liste}>
        <li><em>T</em> en <strong>secondes</strong>, <em>f</em> en <strong>hertz</strong> (Hz) : 1 Hz = 1 motif par seconde.</li>
        <li>Exemple : <em>T</em> = 0,010{NB}s donne <em>f</em> = 1 ÷ 0,010 = 100{NB}Hz.</li>
        <li>Astuce : <em>T</em> et <em>f</em> sont <strong>inverses</strong> : si <em>T</em> est 2 fois plus petite, <em>f</em> est 2 fois plus grande.</li>
        <li><strong>Idée fausse</strong> : « <em>f</em> = <em>T</em> ». <strong>Vrai</strong> : <em>f</em> = 1 ÷ <em>T</em>.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : les trois qualités d'un son ──
export function FicheQualites() {
  const rang = (y, titre, gauche, droite, legende, c) => (<g>
    <text x="8" y={y} fontSize="15" fontWeight="700" fill={c}>{titre}</text>
    <Axes x0={8} x1={130} y0={y + 6} yc={y + 32} y1={y + 58}/>
    {gauche(y + 32)}
    <path d={`M136,${y + 32} L160,${y + 32}`} stroke={GRIS} strokeWidth="2.6" fill="none"/><polygon points={`168,${y + 32} 157,${y + 26} 157,${y + 38}`} fill={GRIS}/>
    <Axes x0={172} x1={292} y0={y + 6} yc={y + 32} y1={y + 58}/>
    {droite(y + 32)}
    <text x="150" y={y + 78} textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>{legende}</text></g>);
  return (
    <div>
      <svg viewBox="0 0 300 300" style={svgStyle} role="img" aria-label="Trois qualités d’un son. Hauteur : une période plus courte donne un son plus aigu. Timbre : une autre forme de motif donne un autre timbre, la période restant la même. Force : une amplitude plus grande donne un son plus fort.">
        {rang(20, '1. Hauteur', y => <Courbe x0={8} x1={130} yc={y} amp={20} T={60} c={BLEU}/>, y => <Courbe x0={172} x1={292} yc={y} amp={20} T={30} c={BLEU}/>, 'T plus courte : plus aigu', BLEU)}
        {rang(116, '2. Timbre', y => <Courbe x0={8} x1={130} yc={y} amp={20} T={40} c={VIOLET}/>, y => <Courbe forme="carre" x0={172} x1={292} yc={y} amp={20} T={40} c={VIOLET}/>, 'même T, autre forme : autre timbre', VIOLET)}
        {rang(212, '3. Force', y => <Courbe x0={8} x1={130} yc={y} amp={8} T={40} c={ORANGE}/>, y => <Courbe x0={172} x1={292} yc={y} amp={24} T={40} c={ORANGE}/>, 'amplitude plus grande : plus fort', ORANGE)}
      </svg>
      <ul style={liste}>
        <li><strong>Hauteur</strong> (grave ou aigu) : elle dépend de la fréquence. Plus <em>f</em> est grande, plus le son est aigu.</li>
        <li><strong>Timbre</strong> : la forme du motif. Deux instruments qui jouent la même note ont la même période mais pas la même forme.</li>
        <li><strong>Force</strong> : elle dépend de l’amplitude. Plus l’amplitude est grande, plus le son est fort.</li>
        <li><strong>Idée fausse</strong> : « un son fort est un son aigu ». <strong>Vrai</strong> : fort et aigu sont deux choses différentes.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : les domaines de fréquences ──
export function FicheDomaines() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Trois domaines : infrasons sous 20 hertz, sons audibles de 20 hertz à 20 kilohertz, ultrasons au-dessus de 20 kilohertz. Un kilohertz vaut 1 000 hertz.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>On entend de 20 Hz à 20 kHz</text>
        <rect x="8" y="34" width="74" height="46" rx="8" fill="#e0f2fe" stroke={BLEU} strokeWidth="2"/>
        <rect x="82" y="34" width="136" height="46" rx="8" fill="#dcfce7" stroke={VERT} strokeWidth="2"/>
        <rect x="218" y="34" width="74" height="46" rx="8" fill="#ede9fe" stroke={VIOLET} strokeWidth="2"/>
        <text x="45" y="62" textAnchor="middle" fontSize="13" fontWeight="700" fill={BLEU}>Infrasons</text>
        <text x="150" y="62" textAnchor="middle" fontSize="14" fontWeight="700" fill={VERT}>Audibles</text>
        <text x="255" y="62" textAnchor="middle" fontSize="13" fontWeight="700" fill={VIOLET}>Ultrasons</text>
        <text x="82" y="102" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>20 Hz</text>
        <text x="218" y="102" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>20 kHz</text>
        <rect x="40" y="116" width="220" height="48" rx="10" fill="#fff7ed" stroke={ORANGE}/>
        <text x="150" y="137" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>1 kHz = 1 000 Hz</text>
        <text x="150" y="156" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>20 kHz = 20 000 Hz</text>
      </svg>
      <ul style={liste}>
        <li><strong>Infrason</strong> : <em>f</em> inférieure à 20{NB}Hz. <strong>Ultrason</strong> : <em>f</em> supérieure à 20{NB}kHz. Les deux sont inaudibles pour nous.</li>
        <li>Pour comparer, mettre d’abord la fréquence en Hz : 5{NB}kHz = 5 000{NB}Hz.</li>
        <li>Astuce : « 20 – 20 000 », de la plus grave à la plus aiguë des fréquences audibles.</li>
        <li><strong>Idée fausse</strong> : « un ultrason est un son très fort ». <strong>Vrai</strong> : c’est un son très aigu, au-dessus de 20{NB}kHz.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : de l'écran à la fréquence ──
export function FicheMesure() {
  // 4 motifs entre les curseurs (de 40 à 240 : 200 px pour 4 motifs de 50 px)
  return (
    <div>
      <svg viewBox="0 0 300 214" style={svgStyle} role="img" aria-label="Mesure sur un oscillogramme : deux curseurs encadrent 4 motifs, 5 sommets. La durée entre les curseurs est Δt égale 8 millisecondes. La période est T égale 8 divisé par 4, soit 2 millisecondes, et la fréquence 1 divisé par 0,002 égale 500 hertz.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Mesurer plusieurs motifs</text>
        <Axes x0={14} x1={286} y0={58} yc={94} y1={130}/>
        <Courbe x0={14} x1={286} yc={94} amp={28} T={50} dec={12.5}/>
        <line x1="39" y1="48" x2="39" y2="130" stroke={VIOLET} strokeWidth="2" strokeDasharray="5 3"/>
        <line x1="239" y1="48" x2="239" y2="130" stroke={VIOLET} strokeWidth="2" strokeDasharray="5 3"/>
        <Fl2 x1={39} x2={239} y={52} c={VIOLET}/>
        <text x="139" y="44" textAnchor="middle" fontSize="15" fontWeight="700" fill={VIOLET}>Δt = 8 ms</text>
        <text x="139" y="150" textAnchor="middle" fontSize="14" fill={GRIS}>5 sommets = 4 motifs (N = 4)</text>
        <rect x="14" y="160" width="272" height="44" rx="10" fill="#eff6ff" stroke={BLEU} strokeWidth="2"/>
        <text x="150" y="179" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>T = 8 ÷ 4 = 2 ms = 0,002 s</text>
        <text x="150" y="197" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>f = 1 ÷ 0,002 = 500 Hz</text>
      </svg>
      <Formule><mi>T</mi><mo>=</mo><mfrac><mrow><mi>Δ</mi><mi>t</mi></mrow><mi>N</mi></mfrac></Formule>
      <ul style={liste}>
        <li>On mesure la durée <strong>Δt</strong> de <strong>N motifs</strong> (chaîne de mesure : micro, puis oscilloscope ou appli), puis on divise par <em>N</em>.</li>
        <li>L’erreur de lecture est partagée entre les <em>N</em> motifs : le résultat est plus précis qu’avec un seul motif.</li>
        <li>Ensuite : ms → s (÷ 1 000), puis <em>f</em> = 1 ÷ <em>T</em>.</li>
        <li><strong>Piège</strong> : entre 5 sommets il n’y a que 4 motifs. On compte les motifs, pas les sommets.</li>
      </ul>
    </div>
  );
}
