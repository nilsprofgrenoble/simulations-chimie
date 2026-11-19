// Cartes « À retenir » de la simulation « Circuits électriques : intensité et tension » (sim 68, 2GT).
// Chaque carte est posée UNE ÉTAPE (ou plus) APRÈS la question qu'elle conclut ; exemples différents de ceux demandés.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const L2 = ({ x1, y1, x2, y2, c = ENCRE, w = 2.4, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}/>;
const Fleche = ({ x, y, dir, c = ORANGE }) => { // petite pointe de flèche centrée en (x,y), dir : 'd' droite, 'g' gauche, 'h' haut, 'b' bas
  const p = { d: `${x + 7},${y} ${x - 5},${y - 6} ${x - 5},${y + 6}`, g: `${x - 7},${y} ${x + 5},${y - 6} ${x + 5},${y + 6}`, h: `${x},${y - 7} ${x - 6},${y + 5} ${x + 6},${y + 5}`, b: `${x},${y + 7} ${x - 6},${y - 5} ${x + 6},${y - 5}` }[dir];
  return <polygon points={p} fill={c}/>;
};
// résistor horizontal / vertical centré en (x,y) ; pile verticale centrée en (x,y) (+ en haut)
const RH = ({ x, y, nom, haut }) => <g><rect x={x - 24} y={y - 9} width="48" height="18" fill="#fff" stroke={ENCRE} strokeWidth="2.4"/><text x={x} y={haut ? y - 14 : y + 27} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>{nom}</text></g>;
const RV = ({ x, y, nom, cote = 'd' }) => <g><rect x={x - 9} y={y - 24} width="18" height="48" fill="#fff" stroke={ENCRE} strokeWidth="2.4"/><text x={cote === 'd' ? x + 14 : x - 14} y={y + 5} textAnchor={cote === 'd' ? 'start' : 'end'} fontSize="12.5" fontWeight="800" fill={ENCRE}>{nom}</text></g>;
const Pile = ({ x, y }) => <g><L2 x1={x - 13} y1={y - 8} x2={x + 13} y2={y - 8} w="4"/><L2 x1={x - 7} y1={y + 8} x2={x + 7} y2={y + 8} w="4"/><text x={x + 18} y={y - 3} fontSize="13" fontWeight="800" fill={ROUGE}>+</text><text x={x + 18} y={y + 16} fontSize="13" fontWeight="800" fill={BLEU}>−</text></g>;
const Appareil = ({ x, y, lettre, c }) => <g><circle cx={x} cy={y} r="13" fill="#fff" stroke={c} strokeWidth="2.6"/><text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={c}>{lettre}</text></g>;
const Case = ({ y, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="42" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <text x="150" y={y + 18} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    <text x="150" y={y + 34} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>
  </g>
);

// ── Carte A : un circuit est une boucle ──
export function FicheBoucle() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Circuit en série : une pile et deux résistors R1 et R2 dans une seule boucle fermée ; le courant sort de la borne plus de la pile, parcourt la boucle et revient à la borne moins">
        <polyline points="50,70 50,32 250,32 250,138 50,138 50,100" fill="none" stroke={ENCRE} strokeWidth="2.4"/>
        <RH x={150} y={32} nom="R₁" haut/>
        <RH x={150} y={138} nom="R₂"/>
        <Pile x={50} y={85}/>
        <Fleche x={96} y={32} dir="d"/><Fleche x={250} y={86} dir="b"/><Fleche x={204} y={138} dir="g"/>
        <text x="262" y="90" fontSize="14" fontWeight="800" fill={ORANGE}>I</text>
        <text x="150" y="88" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>sens conventionnel :</text>
        <text x="150" y="104" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>de + vers −, dehors</text>
        <text x="150" y="182" textAnchor="middle" fontSize="12.5" fill={GRIS}>boucle fermée : le courant circule</text>
      </svg>
      <ul style={liste}>
        <li><em>Un circuit : une boucle fermée qui relie un générateur à des dipôles.</em></li>
        <li>Si la boucle est ouverte (fil coupé, résistor dévissé), plus aucun courant.</li>
        <li><strong>Hypothèses</strong> : pile idéale (tension constante), fils sans résistance, appareils de mesure parfaits, régime continu.</li>
      </ul>
    </div>
  );
}

// ── Carte B : l'intensité et l'ampèremètre ──
export function FicheAmpere() {
  return (
    <div>
      <svg viewBox="0 0 300 168" style={svgStyle} role="img" aria-label="Un ampèremètre est placé dans la boucle, en série avec le résistor, pour mesurer l’intensité du courant qui le traverse">
        <polyline points="50,66 50,30 250,30 250,128 50,128 50,96" fill="none" stroke={ENCRE} strokeWidth="2.4"/>
        <RH x={150} y={30} nom="R" haut/>
        <Pile x={50} y={81}/>
        <rect x="132" y="116" width="36" height="24" fill="#fff"/>
        <Appareil x={150} y={128} lettre="A" c={ORANGE}/>
        <Fleche x={98} y={30} dir="d"/><Fleche x={250} y={84} dir="b"/><Fleche x={206} y={128} dir="g"/>
        <text x="150" y="86" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>A dans la boucle</text>
        <text x="150" y="104" textAnchor="middle" fontSize="12.5" fill={ENCRE}>= en série</text>
        <text x="150" y="162" textAnchor="middle" fontSize="12.5" fill={GRIS}>il est traversé par tout le courant</text>
      </svg>
      <ul style={liste}>
        <li><em>L’intensité I : combien de charges passent par seconde dans un fil.</em> Unité : l’ampère (A) ; 1 mA = 0,001 A.</li>
        <li><strong>Exemple</strong> : I = 25 mA = <strong>0,025 A</strong> (de mA à A : ÷ 1 000).</li>
        <li>Changer R change I, mais en série I reste la <strong>même valeur partout</strong> dans la boucle.</li>
      </ul>
    </div>
  );
}

// ── Carte C : la tension et le voltmètre ──
export function FicheTension() {
  return (
    <div>
      <svg viewBox="0 -8 300 192" style={svgStyle} role="img" aria-label="Un voltmètre est branché aux bornes d’un résistor, en dérivation, sans couper la boucle ; la flèche tension U1 pointe vers la borne la plus positive du résistor">
        <polyline points="50,96 50,60 250,60 250,154 50,154 50,126" fill="none" stroke={ENCRE} strokeWidth="2.4"/>
        <RH x={150} y={60} nom="R₁"/>
        <Pile x={50} y={111}/>
        <polyline points="126,60 126,36 150,36" fill="none" stroke={BLEU} strokeWidth="2.2"/>
        <polyline points="174,60 174,36 150,36" fill="none" stroke={BLEU} strokeWidth="2.2"/>
        <rect x="134" y="26" width="32" height="20" fill="#fff"/>
        <Appareil x={150} y={36} lettre="V" c={BLEU}/>
        <L2 x1="126" y1="14" x2="174" y2="14" c={BLEU} w="2.6"/><Fleche x={174} y={14} dir="d" c={BLEU}/>
        <text x="150" y="10" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>U₁</text>
        <text x="150" y="112" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>V aux bornes de R₁</text>
        <text x="150" y="130" textAnchor="middle" fontSize="12.5" fill={ENCRE}>= en dérivation</text>
        <text x="150" y="178" textAnchor="middle" fontSize="12.5" fill={GRIS}>on ne coupe pas la boucle</text>
      </svg>
      <Formule><mi>U</mi><mo>=</mo><mi>R</mi><mo>×</mo><mi>I</mi></Formule>
      <ul style={liste}>
        <li><em>La tension U se mesure entre deux points ; son unité est le volt (V).</em> Dans U = R × I : U en V, R en Ω, I en A.</li>
        <li><strong>Exemple</strong> : R₁ = 150 Ω, I = 0,020 A → U₁ = 150 × 0,020 = <strong>3,0 V</strong>.</li>
        <li><strong>Piège</strong> : ampèremètre en série, voltmètre en dérivation : ne jamais les inverser.</li>
      </ul>
    </div>
  );
}

// ── Carte D : loi des mailles en série ──
export function FicheMailles() {
  const E = 12, U1 = 4.5, k = 240 / E;
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Loi des mailles en série : la tension de la pile se partage entre les deux résistors, la tension E est égale à la somme de U1 et U2 ; le résistor le plus grand reçoit la plus grande tension">
        <text x="30" y="22" fontSize="12.5" fontWeight="800" fill={ENCRE}>pile : E = 12 V</text>
        <rect x="30" y="30" width={E * k} height="26" fill="#e2e8f0" stroke={ENCRE} strokeWidth="2"/>
        <text x="30" y="82" fontSize="12.5" fontWeight="800" fill={BLEU}>R₁ : U₁ = 4,5 V</text>
        <text x="270" y="82" textAnchor="end" fontSize="12.5" fontWeight="800" fill={ORANGE}>R₂ : U₂ = 7,5 V</text>
        <rect x="30" y="90" width={U1 * k} height="26" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/>
        <rect x={30 + U1 * k} y="90" width={(E - U1) * k} height="26" fill="#fed7aa" stroke={ORANGE} strokeWidth="2"/>
        <text x="150" y="140" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>E = U₁ + U₂   (4,5 + 7,5 = 12)</text>
      </svg>
      <Formule><msub><mi>U</mi><mn>2</mn></msub><mo>=</mo><mi>E</mi><mo>−</mo><msub><mi>U</mi><mn>1</mn></msub></Formule>
      <ul style={liste}>
        <li><em>Dans une maille, la tension de la pile se partage entre les dipôles.</em> En série, il n’y a qu’une maille.</li>
        <li>Le résistor le plus <strong>grand</strong> reçoit la plus <strong>grande</strong> tension.</li>
        <li><strong>Vérification</strong> : chaque tension est plus petite que E ; on additionne, on ne soustrait pas les tensions des dipôles.</li>
      </ul>
    </div>
  );
}

// ── Carte E : dérivation, mailles et nœuds ──
export function FicheNoeud() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Circuit en dérivation : la pile alimente deux branches, R1 et R2 ; au nœud, le courant I de la pile se sépare en I1 et I2 ; la tension est la même aux bornes de chaque branche">
        <polyline points="40,66 40,34 250,34" fill="none" stroke={ENCRE} strokeWidth="2.4"/>
        <polyline points="40,98 40,130 250,130" fill="none" stroke={ENCRE} strokeWidth="2.4"/>
        <L2 x1="150" y1="34" x2="150" y2="130"/><L2 x1="250" y1="34" x2="250" y2="130"/>
        <circle cx="150" cy="34" r="5" fill={ENCRE}/><circle cx="150" cy="130" r="5" fill={ENCRE}/>
        <Pile x={40} y={82}/>
        <rect x="141" y="58" width="18" height="48" fill="#fff" stroke={ENCRE} strokeWidth="2.4"/><text x="132" y="86" textAnchor="end" fontSize="12.5" fontWeight="800" fill={ENCRE}>R₁</text>
        <rect x="241" y="58" width="18" height="48" fill="#fff" stroke={ENCRE} strokeWidth="2.4"/><text x="232" y="86" textAnchor="end" fontSize="12.5" fontWeight="800" fill={ENCRE}>R₂</text>
        <Fleche x={96} y={34} dir="d"/><text x="96" y="26" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>I</text>
        <Fleche x={150} y={48} dir="b"/><text x="162" y="50" fontSize="12.5" fontWeight="800" fill={ORANGE}>I₁</text>
        <Fleche x={250} y={48} dir="b"/><text x="262" y="50" fontSize="12.5" fontWeight="800" fill={ORANGE}>I₂</text>
        <text x="170" y="152" fontSize="12.5" fontWeight="700" fill={BLEU}>nœud</text>
        <text x="150" y="171" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>même tension : U₁ = U₂ = E</text>
      </svg>
      <Formule><mi>I</mi><mo>=</mo><msub><mi>I</mi><mn>1</mn></msub><mo>+</mo><msub><mi>I</mi><mn>2</mn></msub></Formule>
      <ul style={liste}>
        <li><em>En dérivation : même tension, intensités qui s’additionnent.</em> Deux mailles (pile + R₁, pile + R₂) donnent U₁ = U₂ = E.</li>
        <li>Au nœud, le courant se sépare. <strong>Exemple</strong> : I = 150 mA, I₁ = 90 mA → I₂ = 150 − 90 = <strong>60 mA</strong>.</li>
        <li>Le plus petit résistor laisse passer le plus grand courant.</li>
      </ul>
    </div>
  );
}

// ── Carte F : bilan série / dérivation ──
export function FicheBilanCirc() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Bilan : en série, une seule maille, la même intensité partout et E égale U1 plus U2 ; en dérivation, deux mailles, U1 égale U2 égale E et I égale I1 plus I2">
        <text x="76" y="16" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>en série</text>
        <text x="226" y="16" textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>en dérivation</text>
        <rect x="6" y="24" width="140" height="106" rx="12" fill="#fff" stroke={BLEU} strokeWidth="2.5"/>
        <rect x="154" y="24" width="140" height="106" rx="12" fill="#fff" stroke={ORANGE} strokeWidth="2.5"/>
        <polyline points="22,64 22,42 130,42 130,110 22,110 22,84" fill="none" stroke={ENCRE} strokeWidth="2.2"/>
        <rect x="58" y="35" width="40" height="14" fill="#fff" stroke={ENCRE} strokeWidth="2"/><rect x="58" y="103" width="40" height="14" fill="#fff" stroke={ENCRE} strokeWidth="2"/>
        <L2 x1="14" y1="64" x2="30" y2="64" w="3.5"/><L2 x1="18" y1="84" x2="26" y2="84" w="3.5"/>
        <polyline points="170,64 170,42 280,42" fill="none" stroke={ENCRE} strokeWidth="2.2"/><polyline points="170,84 170,110 280,110" fill="none" stroke={ENCRE} strokeWidth="2.2"/>
        <L2 x1="226" y1="42" x2="226" y2="110" w="2.2"/><L2 x1="280" y1="42" x2="280" y2="110" w="2.2"/>
        <rect x="219" y="64" width="14" height="32" fill="#fff" stroke={ENCRE} strokeWidth="2"/><rect x="273" y="64" width="14" height="32" fill="#fff" stroke={ENCRE} strokeWidth="2"/>
        <L2 x1="162" y1="64" x2="178" y2="64" w="3.5"/><L2 x1="166" y1="84" x2="174" y2="84" w="3.5"/>
        <text x="76" y="80" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={BLEU}>1 maille</text>
        <text x="226" y="126" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>2 mailles</text>
        <text x="76" y="152" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={BLEU}>I identique partout</text>
        <text x="76" y="170" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>E = U₁ + U₂</text>
        <text x="226" y="152" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>I = I₁ + I₂</text>
        <text x="226" y="170" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>U₁ = U₂ = E</text>
        <text x="150" y="198" textAnchor="middle" fontSize="12.5" fill={GRIS}>A en série (dans la boucle), V en dérivation</text>
      </svg>
      <ul style={liste}>
        <li><em>Série : même intensité, tensions qui s’additionnent. Dérivation : même tension, intensités qui s’additionnent.</em></li>
        <li><strong>Méthode</strong> : repérer mailles et nœuds, écrire la loi, isoler l’inconnue, convertir les mA en A si besoin, vérifier (une partie est plus petite que le tout).</li>
        <li><strong>Hypothèses</strong> : pile idéale, fils sans résistance, appareils parfaits, régime continu.</li>
      </ul>
    </div>
  );
}
