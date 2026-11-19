// Cartes « À retenir » de la simulation « Lentille convergente : trajet de la lumière et foyer » (sim 65, 2GT).
// Chaque carte est posée UNE OU PLUSIEURS ÉTAPES APRÈS les questions qu'elle conclut ; aucune réponse n'est donnée d'avance.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320 (pas de grossissement sur ordinateur).

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', VERRE = '#dbeafe';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const rad = d => d * Math.PI / 180;
const L2 = ({ x1, y1, x2, y2, c, w = 2.8, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}/>;
// Symbole de lentille mince convergente : trait vertical, flèches vers l'extérieur
const Symbole = ({ x, y1, y2 }) => <g><L2 x1={x} y1={y1} x2={x} y2={y2} c={ENCRE} w="3"/><polygon points={`${x},${y1 - 8} ${x - 6},${y1 + 3} ${x + 6},${y1 + 3}`} fill={ENCRE}/><polygon points={`${x},${y2 + 8} ${x - 6},${y2 - 3} ${x + 6},${y2 - 3}`} fill={ENCRE}/></g>;
const Bas = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 8} stroke={GRIS} strokeWidth="2.5"/><polygon points={`150,${y + 12} 145,${y + 5} 155,${y + 5}`} fill={GRIS}/></g>;
const Case = ({ y, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="42" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <text x="150" y={y + 18} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    <text x="150" y={y + 34} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>
  </g>
);

// ── Carte A : une lentille, deux réfractions ──
export function FicheRefLentille() {
  const C = [212, 90], R = 130;
  const point = h => [C[0] - Math.sqrt(R * R - h * h), 90 - h];
  const cas = [[28, 'i petit'], [68, 'i grand']].map(([h, lab]) => {
    const P = point(h), sin = h / R, i = Math.asin(sin), r = Math.asin(sin / 1.5), ang = i - r;
    return { P, lab, fin: [P[0] + 92 * Math.cos(ang), P[1] + 92 * Math.sin(ang)] };
  });
  return (
    <div>
      <svg viewBox="0 0 300 202" style={svgStyle} role="img" aria-label="Face courbe d’une lentille en verre : la normale en un point est la droite qui joint ce point au centre C de la sphère ; un rayon éloigné de l’axe arrive avec un angle d’incidence plus grand qu’un rayon proche de l’axe, il est donc plus dévié">
        <path d={`M${point(76)[0]},${14} A${R},${R} 0 0 1 ${point(76)[0]},${166} L296,166 L296,14 Z`} fill={VERRE}/>
        <path d={`M${point(76)[0]},${14} A${R},${R} 0 0 1 ${point(76)[0]},${166}`} fill="none" stroke={BLEU} strokeWidth="3"/>
        <L2 x1="6" y1="90" x2="290" y2="90" c={GRIS} w="1.5" dash="5 4"/>
        {cas.map(({ P, fin, lab }, i) => (
          <g key={i}>
            <L2 x1={P[0]} y1={P[1]} x2={C[0]} y2={C[1]} c={GRIS} w="1.5" dash="3 4"/>
            <L2 x1="10" y1={P[1]} x2={P[0]} y2={P[1]} c={ORANGE}/>
            <L2 x1={P[0]} y1={P[1]} x2={fin[0]} y2={fin[1]} c={ORANGE}/>
            <text x="10" y={P[1] - 6} fontSize="12.5" fontWeight="800" fill={ORANGE}>{lab}</text>
          </g>
        ))}
        <circle cx={C[0]} cy={C[1]} r="4" fill={ENCRE}/>
        <text x={C[0] + 8} y={C[1] + 18} fontSize="12.5" fontWeight="800" fill={ENCRE}>C</text>
        <text x="150" y="182" textAnchor="middle" fontSize="12.5" fill={GRIS}>normales en pointillés : elles passent par C</text>
        <text x="150" y="198" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>loin de l’axe, i est plus grand</text>
      </svg>
      <ul style={liste}>
        <li><em>Une lentille = deux réfractions</em>, une à chaque face (loi de Snell-Descartes).</li>
        <li>Sur une face plane, la normale est la même partout. Sur une face <strong>courbe</strong>, c’est la droite qui joint le point au <strong>centre de la sphère</strong> : elle change d’un point à l’autre.</li>
        <li>Air → verre : le rayon <strong>se rapproche</strong> de la normale ; verre → air : il <strong>s’écarte</strong>. Les angles se mesurent avec la normale.</li>
      </ul>
    </div>
  );
}

// ── Carte B : foyer et distance focale ──
export function FicheFoyer() {
  const O = 150, F1 = 230, F0 = 70, ay = 80;
  return (
    <div>
      <svg viewBox="0 0 300 164" style={svgStyle} role="img" aria-label="Des rayons parallèles à l’axe optique traversent une lentille convergente et se rejoignent au foyer image F prime ; le foyer objet F est le symétrique de F prime par rapport à la lentille ; la distance focale est la distance entre le centre optique O et F prime">
        <L2 x1="10" y1={ay} x2="292" y2={ay} c={GRIS} w="1.5" dash="5 4"/>
        {[40, 120].map(y => <g key={y}><L2 x1="14" y1={y} x2={O} y2={y} c={VERT}/><L2 x1={O} y1={y} x2={F1 + 40} y2={ay + (ay - y) * 40 / (F1 - O)} c={VERT}/></g>)}
        <Symbole x={O} y1={20} y2={140}/>
        <circle cx={F0} cy={ay} r="4.5" fill={BLEU}/><circle cx={F1} cy={ay} r="4.5" fill={ORANGE}/><circle cx={O} cy={ay} r="3.5" fill={ENCRE}/>
        <text x={F0} y={ay + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>F</text>
        <text x={O + 8} y={ay + 20} fontSize="13" fontWeight="800" fill={ENCRE}>O</text>
        <text x={F1} y={ay + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>F′</text>
        <L2 x1={O} y1="132" x2={F1} y2="132" c={ORANGE} w="2.5"/><L2 x1={O} y1="126" x2={O} y2="138" c={ORANGE} w="2.5"/><L2 x1={F1} y1="126" x2={F1} y2="138" c={ORANGE} w="2.5"/>
        <text x={(O + F1) / 2} y="156" textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>f′ = OF′</text>
        <text x="14" y="30" fontSize="12.5" fontWeight="700" fill={GRIS}>rayons ∥ à l’axe</text>
      </svg>
      <ul style={liste}>
        <li><em>Le foyer image F′ : là où se rejoignent les rayons parallèles à l’axe.</em></li>
        <li>Centre optique <strong>O</strong> : milieu de la lentille. Distance focale <strong>f′ = OF′</strong> (en cm ou en m). Le foyer objet <strong>F</strong> est le symétrique de F′ par rapport à la lentille (OF = OF′).</li>
        <li><strong>Hypothèse</strong> : pour des rayons loin de l’axe, le foyer est « presque » un point (aberration sphérique réelle).</li>
      </ul>
    </div>
  );
}

// ── Carte C : la lentille mince et ses rayons particuliers ──
export function FicheMince() {
  const O = 150, ay = 80, F1 = 230;
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Modèle de la lentille mince : le verre est remplacé par un trait vertical avec deux flèches ; un rayon parallèle à l’axe ressort en passant par le foyer image F prime ; un rayon qui passe par le centre optique O n’est pas dévié">
        <L2 x1="10" y1={ay} x2="292" y2={ay} c={GRIS} w="1.5" dash="5 4"/>
        <L2 x1="14" y1="40" x2={O} y2="40" c={VERT}/><L2 x1={O} y1="40" x2="280" y2={40 + (ay - 40) * (280 - O) / (F1 - O)} c={VERT}/>
        <L2 x1="40" y1="124" x2="262" y2="36" c={ORANGE}/>
        <Symbole x={O} y1={14} y2={146}/>
        <circle cx={O} cy={ay} r="3.5" fill={ENCRE}/><circle cx={F1} cy={ay} r="4.5" fill={VERT}/>
        <text x={O + 8} y={ay + 18} fontSize="13" fontWeight="800" fill={ENCRE}>O</text>
        <text x={F1} y={ay + 18} textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>F′</text>
        <text x="14" y="20" fontSize="12.5" fontWeight="800" fill={VERT}>∥ à l’axe : par F′</text>
        <text x="14" y="162" fontSize="12.5" fontWeight="800" fill={ORANGE}>par O : pas dévié</text>
      </svg>
      <ul style={liste}>
        <li><em>Lentille mince : tout le verre se réduit à un trait vertical avec deux flèches</em> ; la déviation a lieu « au niveau du trait ».</li>
        <li>Au centre O, la lentille est comme une lame à faces parallèles très mince : un rayon qui passe par O <strong>n’est pas dévié</strong>.</li>
        <li>Construction : un rayon parallèle à l’axe qui ressort par F′, puis un rayon qui passe par O sans déviation.</li>
      </ul>
    </div>
  );
}

// ── Carte D : de quoi dépend f′ ──
const Panneau = ({ x0, f, bomb, c, t1, t2, t3 }) => {
  const O = x0 + 36, F1 = O + f, ay = 74;
  return (
    <g>
      <L2 x1={x0} y1={ay} x2={x0 + 138} y2={ay} c={GRIS} w="1.5" dash="5 4"/>
      {[38, 110].map(y => <g key={y}><L2 x1={x0 + 2} y1={y} x2={O} y2={y} c={c}/><L2 x1={O} y1={y} x2={F1 + 18} y2={ay + (ay - y) * 18 / (F1 - O)} c={c}/></g>)}
      <path d={`M${O},22 Q${O + bomb},${ay} ${O},126 Q${O - bomb},${ay} ${O},22 Z`} fill={VERRE} stroke={BLEU} strokeWidth="2.5"/>
      <circle cx={F1} cy={ay} r="4.5" fill={ORANGE}/>
      <text x={F1} y={ay + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>F′</text>
      <text x={x0 + 66} y="148" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>{t1}</text>
      <text x={x0 + 66} y="164" textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>
      <text x={x0 + 66} y="180" textAnchor="middle" fontSize="13" fontWeight="800" fill={c}>{t3}</text>
    </g>
  );
};
export function FicheDependF() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Deux lentilles convergentes : à gauche, un verre peu réfringent et une face peu bombée, les rayons se croisent loin, la distance focale est longue ; à droite, un verre plus réfringent et une face plus bombée, les rayons se croisent plus près, la distance focale est courte">
        <Panneau x0={4} f={92} bomb={7} c={BLEU} t1="n petit, R grand" t2="face peu bombée" t3="f′ longue"/>
        <Panneau x0={154} f={52} bomb={14} c={VERT} t1="n grand, R petit" t2="face très bombée" t3="f′ courte"/>
      </svg>
      <ul style={liste}>
        <li><em>Plus la lentille dévie, plus f′ est courte.</em></li>
        <li>Plus l’indice <strong>n</strong> est grand, plus la lumière est déviée à chaque face. Plus la face est bombée (rayon de courbure <strong>R</strong> petit), plus f′ est courte.</li>
        <li>Une lentille qui dévie beaucoup a une distance focale courte (« lentille forte »).</li>
      </ul>
    </div>
  );
}

// ── Carte E : mesurer f′ au banc d'optique ──
export function FicheBanc() {
  const lx = 120, ex = 224, ay = 74;
  return (
    <div>
      <svg viewBox="0 0 300 172" style={svgStyle} role="img" aria-label="Banc d’optique : une source envoie un faisceau de rayons parallèles sur la lentille ; on déplace l’écran jusqu’à obtenir la tache lumineuse la plus petite ; la distance entre la lentille et l’écran est alors la distance focale f prime">
        <L2 x1="6" y1="118" x2="294" y2="118" c={GRIS} w="4"/>
        <rect x="8" y={ay - 26} width="30" height="52" rx="6" fill="#fef3c7" stroke={ORANGE} strokeWidth="2.5"/>
        {[ay - 18, ay, ay + 18].map(y => <g key={y}><L2 x1="40" y1={y} x2={lx} y2={y} c={ORANGE}/><L2 x1={lx} y1={y} x2={ex} y2={ay} c={ORANGE}/></g>)}
        <Symbole x={lx} y1={ay - 40} y2={ay + 40}/>
        <rect x={ex - 4} y={ay - 36} width="8" height="72" fill="#cbd5e1" stroke={GRIS} strokeWidth="2"/>
        <circle cx={ex} cy={ay} r="4" fill={ORANGE}/>
        <text x="23" y={ay - 34} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>source</text>
        <text x={ex + 10} y={ay - 22} fontSize="12.5" fontWeight="700" fill={ENCRE}>écran</text>
        <text x={ex + 10} y={ay - 7} fontSize="12.5" fill={GRIS}>tache</text>
        <text x={ex + 10} y={ay + 8} fontSize="12.5" fill={GRIS}>minimale</text>
        <L2 x1={lx} y1="136" x2={ex} y2="136" c={VERT} w="2.5"/><L2 x1={lx} y1="130" x2={lx} y2="142" c={VERT} w="2.5"/><L2 x1={ex} y1="130" x2={ex} y2="142" c={VERT} w="2.5"/>
        <text x={(lx + ex) / 2} y="160" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>f′ = distance lentille – écran</text>
      </svg>
      <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
        <li>Envoyer sur la lentille un faisceau de <strong>rayons parallèles</strong>.</li>
        <li>Déplacer l’<strong>écran</strong> jusqu’à obtenir la <strong>tache la plus petite</strong> : l’écran est au foyer image F′.</li>
        <li>Lire la distance lentille–écran : c’est f′ (préciser l’unité).</li>
      </ol>
      <ul style={liste}>
        <li><strong>Objet très éloigné</strong> (Soleil, fenêtre lointaine) : ses rayons sont presque parallèles ; son image se forme dans le plan du foyer.</li>
        <li><strong>Piège</strong> : la position de départ de l’écran n’est pas f′. <strong>Hypothèses</strong> : lentille mince, rayons proches de l’axe, diffraction ignorée.</li>
      </ul>
    </div>
  );
}

// ── Carte F : bilan ──
export function FicheBilanLent() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Bilan : une lentille convergente est faite de deux réfractions ; elle fait converger les rayons parallèles à l’axe au foyer image F prime ; la distance focale est d’autant plus courte que n est grand et R petit ; au banc, la tache minimale donne la position de F prime et la mesure de f prime">
        <Case y={4} t1="une lentille = deux réfractions" t2="angles mesurés avec la normale" c={BLEU}/>
        <Bas y={48}/>
        <Case y={62} t1="rayons ∥ à l’axe → foyer image F′" t2="f′ = OF′ ; un rayon par O n’est pas dévié" c={VERT}/>
        <Bas y={106}/>
        <Case y={120} t1="n grand ou R petit → f′ courte" t2="lentille « forte » : dévie beaucoup" c={ORANGE}/>
        <text x="150" y="182" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>au banc : tache minimale = écran en F′,</text>
        <text x="150" y="200" textAnchor="middle" fontSize="12.5" fill={GRIS}>on lit f′ avec son unité</text>
      </svg>
      <ul style={liste}>
        <li><em>Rayons parallèles, foyer image, distance focale : tout se mesure à partir de O et de F′.</em></li>
        <li><strong>Pièges</strong> : angles pris avec la surface au lieu de la normale ; confondre F et F′ ; oublier l’unité de f′.</li>
      </ul>
    </div>
  );
}
