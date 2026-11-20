// Cartes « À retenir » de la simulation « Le son : émission et propagation » (2GT).
// Chaque carte est posée sur l'ÉTAPE SUIVANT la question qu'elle conclut, et ses exemples chiffrés sont différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 13 à 16 (≥ 10 px rendus).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const NB = ' ';
const arc = (cx, cy, r, a0, a1) => {
  const p = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};
const Banniere = ({ y, texte, couleur = ORANGE, fond = '#fff7ed', x = 8, l = 284 }) => (
  <g><rect x={x} y={y} width={l} height="28" rx="8" fill={fond} stroke={couleur} strokeWidth="1.5"/>
    <text x={x + l / 2} y={Number(y) + 19} textAnchor="middle" fontSize="14.5" fontWeight="700" fill={couleur}>{texte}</text></g>
);
// Double flèche horizontale ↔ centrée en (x, y)
const DoubleFleche = ({ x, y, l = 16, c = ROUGE }) => (
  <g stroke={c} strokeWidth="2.5" fill={c}><line x1={x - l} y1={y} x2={x + l} y2={y}/>
    <polygon points={`${x - l - 5},${y} ${x - l + 4},${y - 5} ${x - l + 4},${y + 5}`} stroke="none"/><polygon points={`${x + l + 5},${y} ${x + l - 4},${y - 5} ${x + l - 4},${y + 5}`} stroke="none"/></g>
);

// ── Carte 1 : un son naît d'une vibration ──
export function FicheVibration() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Trois objets qui émettent un son en vibrant : un diapason dont les branches vont et viennent, une corde tendue qui se déforme, un haut-parleur dont la membrane avance et recule. En dessous : pas de vibration, pas de son.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Un objet qui vibre émet un son</text>
        <g stroke="#64748b" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M40,100 Q40,112 50,112 Q60,112 60,100"/><line x1="40" y1="100" x2="35" y2="50"/><line x1="60" y1="100" x2="65" y2="50"/><line x1="50" y1="112" x2="50" y2="130"/></g>
        <DoubleFleche x={50} y={38} l={22}/>
        <text x="50" y="150" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>diapason</text>
        <circle cx="112" cy="85" r="3" fill={GRIS}/><circle cx="190" cy="85" r="3" fill={GRIS}/>
        <path d="M112,85 Q151,60 190,85" fill="none" stroke={GRIS} strokeWidth="2.5"/><path d="M112,85 Q151,110 190,85" fill="none" stroke={GRIS} strokeWidth="2.5" strokeDasharray="5 4"/>
        <text x="151" y="150" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>corde</text>
        <rect x="226" y="68" width="16" height="44" rx="3" fill="#334155"/><polygon points="242,76 262,58 262,122 242,104" fill="#94a3b8" stroke={GRIS} strokeWidth="2"/>
        <DoubleFleche x={272} y={90} l={8}/>
        <text x="255" y="150" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>haut-parleur</text>
        <Banniere y="158" texte="Pas de vibration, pas de son"/>
      </svg>
      <ul style={liste}>
        <li>Une <strong>vibration</strong> est un va-et-vient très rapide de l’objet.</li>
        <li>Si l’on arrête la vibration (un doigt sur la corde), le son s’arrête.</li>
        <li><strong>Idée fausse</strong> : « le son sort de l’objet comme un jet ». <strong>Vrai</strong> : l’objet qui vibre met l’air voisin en mouvement.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : de proche en proche ──
export function FicheProche() {
  const ligne = (y, dec) => Array.from({ length: 12 }, (_, i) => {
    const x0 = 24 + i * 22, x = x0 + 7 * Math.sin(2 * Math.PI * (x0 - dec) / 100), est = i === 5;
    return <circle key={i} cx={x} cy={y} r={est ? 6 : 4.5} fill={est ? ORANGE : '#38bdf8'} stroke={est ? '#7c2d12' : '#0369a1'} strokeWidth={est ? 1.8 : 1}/>;
  });
  return (
    <div>
      <svg viewBox="0 0 300 214" style={svgStyle} role="img" aria-label="Deux lignes de particules d’air à deux instants successifs. Les zones où les particules sont serrées avancent vers la droite, mais la particule orange reste autour de la même place, marquée par un trait pointillé. En dessous : le son voyage, l’air reste sur place.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>De particule en particule</text>
        <line x1="134" y1="44" x2="134" y2="134" stroke={ORANGE} strokeWidth="1.8" strokeDasharray="4 4"/>
        <text x="8" y="50" fontSize="13" fontWeight="700" fill={GRIS}>instant 1</text>{ligne(66, 0)}
        <text x="8" y="100" fontSize="13" fontWeight="700" fill={GRIS}>instant 2</text>{ligne(116, 40)}
        <line x1="190" y1="145" x2="270" y2="145" stroke={BLEU} strokeWidth="3"/><polygon points="278,145 268,139 268,151" fill={BLEU}/>
        <text x="16" y="150" fontSize="13.5" fontWeight="700" fill={BLEU}>la vibration avance</text>
        <Banniere y="162" texte="Le son voyage, l’air reste sur place"/>
        <text x="150" y="208" textAnchor="middle" fontSize="13" fill={ORANGE} fontWeight="700">trait orange : la place de repos</text>
      </svg>
      <ul style={liste}>
        <li>Chaque particule <strong>va et vient autour de sa place</strong> et pousse sa voisine.</li>
        <li>Aucune matière n’est transportée du haut-parleur à l’oreille : seule la <strong>vibration</strong> avance.</li>
        <li><strong>Idée fausse</strong> : « l’air voyage avec le son ». <strong>Vrai</strong> : l’air oscille, le signal avance.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : la caisse de résonance ──
export function FicheCaisse() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Une corde fait vibrer la caisse d’une guitare, dont la grande surface met beaucoup d’air en mouvement, représenté par de grands arcs. En dessous : la caisse est une grande surface qui vibre.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>La caisse vibre avec la corde</text>
        <rect x="10" y="84" width="96" height="10" fill="#7c4a14"/>
        <circle cx="156" cy="90" r="36" fill="#d6a45a" stroke="#7c4a14" strokeWidth="2.5"/><circle cx="118" cy="90" r="25" fill="#d6a45a" stroke="#7c4a14" strokeWidth="2.5"/>
        <circle cx="156" cy="90" r="34" fill="#d6a45a"/><circle cx="118" cy="90" r="23" fill="#d6a45a"/><circle cx="148" cy="90" r="11" fill="#3b2a14"/>
        <path d="M12,89 Q80,82 186,89" fill="none" stroke={GRIS} strokeWidth="1.8"/>
        {[0, 1, 2].map(j => <path key={j} d={arc(156, 90, 44 + j * 12, -40, 40)} fill="none" stroke={BLEU} strokeWidth="3.5" strokeLinecap="round" opacity={1 - 0.2 * j}/>)}
        <text x="52" y="116" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>corde fine</text>
        <text x="136" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>caisse</text>
        <text x="236" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill={BLEU}>beaucoup d’air</text>
        <Banniere y="154" texte="Caisse = grande surface qui vibre"/>
      </svg>
      <ul style={liste}>
        <li>Une corde seule, très fine, met <strong>très peu d’air</strong> en mouvement.</li>
        <li>La corde fait vibrer la caisse : sa <strong>grande surface</strong> met beaucoup plus d’air en mouvement, donc le son est plus fort.</li>
        <li>Exemples : guitare, violon, piano ; un diapason posé sur une boîte en bois sonne plus fort.</li>
        <li><strong>Idée fausse</strong> : « la caisse crée du son toute seule ». <strong>Vrai</strong> : elle vibre parce que la corde la fait vibrer.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : le milieu matériel ──
export function FicheMilieu() {
  const h = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const pts = Array.from({ length: 16 }, (_, i) => ({ x: 28 + h(i) * 54, y: 80 + h(i + 500) * 50 })).filter(p => Math.hypot(p.x - 64, p.y - 132) > 18);
  const jar = (x, avec) => (
    <g>
      <path d={`M${x},150 L${x},96 Q${x},60 ${x + 40},60 Q${x + 80},60 ${x + 80},96 L${x + 80},150 Z`} fill="#f0f9ff" stroke={BLEU} strokeWidth="2.5"/>
      <rect x={x - 8} y="150" width="96" height="9" rx="2" fill="#94a3b8"/>
      <circle cx={x + 40} cy="132" r="12" fill="#fef3c7" stroke={ORANGE} strokeWidth="2.5"/>
      {avec && pts.map((p, i) => <circle key={i} cx={p.x - 28 + x + 4} cy={p.y} r="2.6" fill={GRIS}/>)}
    </g>);
  return (
    <div>
      <svg viewBox="0 0 300 220" style={svgStyle} role="img" aria-label="À gauche, une cloche contenant de l’air : le son du réveil est entendu à l’extérieur. À droite, une cloche sans air : le réveil vibre mais aucun son n’est entendu. En dessous : pas de milieu matériel, pas de son.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Avec de l’air, puis dans le vide</text>
        {jar(36, true)}{jar(184, false)}
        <path d={arc(30, 108, 12, 140, 220)} fill="none" stroke={VERT} strokeWidth="3" strokeLinecap="round"/><path d={arc(30, 108, 22, 140, 220)} fill="none" stroke={VERT} strokeWidth="3" strokeLinecap="round"/>
        <text x="76" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill={VERT}>son entendu</text>
        <text x="224" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill={ROUGE}>aucun son</text>
        <text x="76" y="176" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>avec de l’air</text>
        <text x="224" y="176" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>sans air (vide)</text>
        <Banniere y="186" texte="Pas de milieu matériel, pas de son"/>
      </svg>
      <ul style={liste}>
        <li>Le son se propage dans un <strong>milieu matériel</strong> : gaz (air), liquide ou solide.</li>
        <li>Dans le <strong>vide</strong> (par exemple l’espace), aucun son ne se propage, même si l’objet vibre.</li>
        <li><strong>Idée fausse</strong> : « le son passe partout ». <strong>Vrai</strong> : sans particules pour se pousser, la vibration ne peut pas avancer.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : mesurer la vitesse du son ──
export function FicheVitesse() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Un haut-parleur, un micro 1 et un micro 2 distants de d. Un chronomètre mesure le retard Δt entre les deux micros. Exemple : 51 mètres divisés par 0,15 seconde font 340 mètres par seconde.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Deux micros et un chronomètre</text>
        <rect x="14" y="52" width="14" height="30" rx="3" fill="#334155"/><polygon points="28,58 44,46 44,88 28,76" fill="#94a3b8" stroke={GRIS} strokeWidth="2"/>
        {[110, 250].map((x, i) => <g key={i}><line x1={x} y1="72" x2={x} y2="100" stroke={GRIS} strokeWidth="3"/><circle cx={x} cy="66" r="9" fill="#fde68a" stroke={ORANGE} strokeWidth="2.5"/>
          <text x={x} y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>micro {i + 1}</text></g>)}
        <path d={arc(62, 66, 14, -50, 50)} fill="none" stroke={BLEU} strokeWidth="3" strokeLinecap="round"/><path d={arc(62, 66, 28, -50, 50)} fill="none" stroke={BLEU} strokeWidth="3" strokeLinecap="round"/>
        <line x1="110" y1="132" x2="250" y2="132" stroke={ORANGE} strokeWidth="2.5"/><polygon points="110,132 119,127 119,137" fill={ORANGE}/><polygon points="250,132 241,127 241,137" fill={ORANGE}/>
        <text x="180" y="150" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={ORANGE}>d (distance)</text>
        <rect x="134" y="30" width="92" height="24" rx="6" fill="#0f172a"/><text x="180" y="47" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#86efac">Δt (retard)</text>
        <Banniere y="158" texte={`51${NB}m ÷ 0,15${NB}s = 340${NB}m/s`} couleur={BLEU} fond="#eff6ff"/>
      </svg>
      <Formule><mi>v</mi><mo>=</mo><mfrac><mi>d</mi><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></Formule>
      <ul style={liste}>
        <li><strong>La distance divisée par la durée</strong> : d en mètres (m), Δt en secondes (s), v en m/s.</li>
        <li>Dans l’air à 20{NB}°C, le son va à environ <strong>340{NB}m/s</strong>.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 (bilan) : comparer des vitesses ──
export function FicheVitesses() {
  const L = [['Piéton', 5, 5], ['Voiture', 90, 90], ['Avion de ligne', 900, 900], ['Son dans l’air', 1200, 1200]];
  return (
    <div>
      <svg viewBox="0 0 300 246" style={svgStyle} role="img" aria-label="Des vitesses en kilomètres par heure comparées par des barres : piéton 5, voiture 90, avion de ligne 900, son dans l’air 1 200. La lumière est hors échelle. En dessous : pour passer de mètres par seconde à kilomètres par heure, on multiplie par 3,6.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Comparer en km/h</text>
        {L.map(([nom, v], i) => {
          const y = 40 + i * 34, son = i === 3;
          return <g key={nom}>
            <text x="8" y={y} fontSize="13.5" fontWeight="700" fill={son ? ORANGE : ENCRE}>{nom}</text>
            <text x="292" y={y} textAnchor="end" fontSize="13.5" fontWeight="700" fill={son ? ORANGE : GRIS}>{v >= 1000 ? '1 200' : v}{NB}km/h</text>
            <rect x="8" y={y + 6} width={Math.max(3, v / 1200 * 284)} height="9" rx="4" fill={son ? ORANGE : BLEU}/></g>;
        })}
        <text x="8" y="180" fontSize="13.5" fontWeight="700" fill={ROUGE}>Lumière : hors échelle,</text>
        <text x="8" y="197" fontSize="13.5" fontWeight="700" fill={ROUGE}>environ 900{NB}000 fois plus vite</text>
        <Banniere y="208" x={8} l={138} texte="m/s → km/h : × 3,6" couleur={BLEU} fond="#eff6ff"/>
        <Banniere y="208" x={154} l={138} texte="km/h → m/s : ÷ 3,6" couleur={BLEU} fond="#eff6ff"/>
      </svg>
      <Formule><mi>d</mi><mo>=</mo><mi>v</mi><mo>×</mo><mrow><mi>Δ</mi><mi>t</mi></mrow></Formule>
      <ul style={liste}>
        <li><strong>« 10 m/s, c’est 36 km/h »</strong> : on multiplie par 3,6. Le son : 340{NB}m/s ≈ 1{NB}200{NB}km/h.</li>
        <li>Pour comparer deux vitesses, il faut les écrire <strong>dans la même unité</strong>.</li>
        <li>Orage : <strong>3 secondes ≈ 1 kilomètre</strong> (340{NB}m/s × 3{NB}s ≈ 1{NB}000{NB}m).</li>
        <li>Une mesure n’est jamais exacte : le chronomètre a une incertitude, donc on trouve « à peu près » 340{NB}m/s.</li>
        <li><strong>Idée fausse</strong> : « un avion de ligne dépasse le son ». <strong>Vrai</strong> : 900{NB}km/h reste sous 1{NB}200{NB}km/h.</li>
      </ul>
    </div>
  );
}
