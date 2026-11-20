// Cartes « À retenir » de la simulation « Quantité de matière : compter les entités et la mole » (sim 178, 2GT).
// Chaque carte est posée sur l'ÉTAPE SUIVANT la question qu'elle conclut, et ses exemples chiffrés sont différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 13 à 16 (≥ 10 px rendus).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };

// Une coquillette (pâte en forme de coude) : arc épais ; (x, y) = centre, rot = rotation en degrés
const Coq = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-7,5 Q-8,-7 3,-7 Q9,-6 8,1" fill="none" stroke="#e8b04a" strokeWidth="5.2" strokeLinecap="round"/>
    <path d="M-7,5 Q-8,-7 3,-7 Q9,-6 8,1" fill="none" stroke="#b7791f" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
  </g>
);
const tas = (cx, cy, k) => Array.from({ length: k }, (_, i) => ({ x: cx - 24 + ((i * 17) % 49), y: cy - 6 + ((i * 11) % 13) - Math.floor(i / 6) * 4, r: (i * 53) % 180 }));
// Lettre avec indice : « N » puis un petit « A » (pas d'indice Unicode pour la lettre A majuscule)
const NA = ({ x, y, fs = 16, fill = ENCRE }) => (
  <g><text x={x} y={y} fontSize={fs} fontWeight="700" fill={fill}>N</text><text x={x + fs * 0.72} y={y + fs * 0.28} fontSize={Math.max(fs * 0.78, 13)} fontWeight="700" fill={fill}>A</text></g>
);

// ── Carte 1 : compter avec une balance ──
export function FicheBalance() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="À gauche, une coquillette seule sur une petite balance qui affiche 0,50 gramme. À droite, un tas de coquillettes sur une balance qui affiche 12 grammes. En dessous : 12 grammes divisés par 0,50 gramme égalent 24 coquillettes.">
        <rect x="14" y="92" width="112" height="14" rx="4" fill="#cbd5e1" stroke="#94a3b8"/>
        <rect x="42" y="96" width="56" height="7" rx="2" fill="#0f172a"/>
        <Coq x={70} y={78} s={1.3}/>
        <text x="70" y="124" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>1 coquillette</text>
        <text x="70" y="143" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>0,50 g</text>
        <rect x="170" y="92" width="116" height="14" rx="4" fill="#cbd5e1" stroke="#94a3b8"/>
        <rect x="198" y="96" width="60" height="7" rx="2" fill="#0f172a"/>
        <path d="M176,86 Q228,52 280,86 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.6"/>
        {tas(228, 78, 24).map((p, i) => <Coq key={i} x={p.x} y={p.y} rot={p.r} s={0.8}/>)}
        <text x="228" y="124" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>le tas</text>
        <text x="228" y="143" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>12 g</text>
        <rect x="10" y="150" width="280" height="22" rx="8" fill="#eff6ff" stroke={BLEU}/>
        <text x="150" y="166" textAnchor="middle" fontSize="14" fontWeight="700" fill={BLEU}>12 g ÷ 0,50 g = 24 coquillettes</text>
        <text x="150" y="30" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>On pèse, puis on divise</text>
      </svg>
      <Formule><mi>N</mi><mo>=</mo><mfrac><mi>m</mi><msub><mi>m</mi><mtext>entité</mtext></msub></mfrac></Formule>
      <ul style={liste}>
        <li><strong>Le tas divisé par un objet = le nombre d’objets.</strong> N : nombre d’objets ; m : masse du tas ; m<sub>entité</sub> : masse d’un seul objet.</li>
        <li>Les deux masses doivent être dans la <strong>même unité</strong> (1 kg = 1000 g).</li>
        <li><strong>Idée fausse</strong> : « pour compter, il faut tout compter un par un ». <strong>Vrai</strong> : si les objets sont identiques, la balance compte pour nous.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : la mole, un paquet ──
export function FicheMole() {
  const oeufs = Array.from({ length: 12 }, (_, i) => ({ x: 30 + (i % 4) * 20, y: 74 + Math.floor(i / 4) * 20 }));
  const points = Array.from({ length: 46 }, (_, i) => ({ x: 176 + ((i * 37) % 104), y: 66 + ((i * 53) % 62) }));
  return (
    <div>
      <svg viewBox="0 0 300 212" style={svgStyle} role="img" aria-label="Comparaison : une douzaine contient 12 œufs, une mole contient 6,02 fois 10 puissance 23 entités, c’est un paquet énorme d’atomes ou de molécules. La mole compte des entités, pas des grammes.">
        <text x="68" y="26" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>1 douzaine</text>
        <text x="68" y="46" textAnchor="middle" fontSize="14" fill={GRIS}>= 12 œufs</text>
        <rect x="16" y="54" width="104" height="84" rx="10" fill="#fff7ed" stroke={ORANGE}/>
        {oeufs.map((o, i) => <ellipse key={i} cx={o.x + 8} cy={o.y} rx="7" ry="9" fill="#fed7aa" stroke={ORANGE}/>)}
        <text x="228" y="26" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>1 mole</text>
        <text x="228" y="46" textAnchor="middle" fontSize="14" fill={GRIS}>= 6,02 × 10²³ entités</text>
        <rect x="166" y="54" width="124" height="84" rx="14" fill="#eff6ff" stroke={BLEU}/>
        {points.map((p, i) => <circle key={i} cx={p.x + 6} cy={p.y + 6} r="3.8" fill={BLEU} opacity="0.85"/>)}
        <text x="150" y="162" textAnchor="middle" fontSize="14" fill={GRIS}>un paquet, mais bien plus grand</text>
        <text x="150" y="188" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>La mole compte des entités,</text>
        <text x="150" y="206" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>pas des grammes</text>
      </svg>
      <ul style={liste}>
        <li><strong>1 mol = 6,02 × 10²³ entités</strong> (atomes, molécules ou ions). Ce nombre s’appelle la constante d’Avogadro : N<sub>A</sub> = 6,02 × 10²³ mol⁻¹.</li>
        <li><strong>Mole = paquet</strong>, comme la douzaine : 2 douzaines = 24 œufs, 2 moles = 2 paquets d’entités.</li>
        <li><strong>Idée fausse</strong> : « une mole est une masse ». <strong>Vrai</strong> : c’est un nombre d’entités, le même pour tous les atomes.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : écriture scientifique ──
export function FicheSci() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Trois repères sur l’écriture scientifique : 6,02 fois 10 puissance 23 est un 602 suivi de 21 zéros ; 30 fois 10 puissance 22 égale 3,0 fois 10 puissance 23 : quand la virgule recule d’un rang, la puissance augmente de un ; 10 puissance moins 3 vaut 0,001.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Grand nombre</text>
        <rect x="10" y="28" width="280" height="42" rx="8" fill="#eff6ff" stroke={BLEU}/>
        <text x="150" y="46" textAnchor="middle" fontSize="15" fontWeight="700" fill={BLEU}>6,02 × 10²³</text>
        <text x="150" y="63" textAnchor="middle" fontSize="13" fill={ENCRE}>= 602 suivi de 21 zéros</text>
        <text x="150" y="92" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Changer la puissance</text>
        <rect x="10" y="100" width="280" height="42" rx="8" fill="#fff7ed" stroke={ORANGE}/>
        <text x="150" y="118" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>30 × 10²² = 3,0 × 10²³</text>
        <text x="150" y="135" textAnchor="middle" fontSize="13" fill={ENCRE}>virgule : 1 rang à gauche, puissance + 1</text>
        <text x="150" y="164" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Très petit nombre</text>
        <rect x="10" y="172" width="280" height="28" rx="8" fill="#f0fdf4" stroke={VERT}/>
        <text x="150" y="191" textAnchor="middle" fontSize="15" fontWeight="700" fill={VERT}>10⁻³ = 0,001 (un millième)</text>
      </svg>
      <ul style={liste}>
        <li><strong>10²³ = 1 suivi de 23 zéros</strong> (et non 10 × 23).</li>
        <li>On divise : 10²⁴ ÷ 10²³ = 10¹ ; on multiplie : les puissances de 10 s’additionnent.</li>
        <li><strong>Calculatrice</strong> : touche « ×10ˣ » ou « EXP » (6,02 EXP 23).</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : de n à N et de N à n ──
export function FicheNn() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Deux lignes en parallèle : œufs égale boîtes fois 6, et N égale n fois N A ; boîtes égale œufs divisé par 6, et n égale N divisé par N A. Exemple : 1 mole contient 6,02 fois 10 puissance 23 entités.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Même idée que les boîtes d’œufs</text>
        <rect x="10" y="30" width="135" height="64" rx="10" fill="#fff7ed" stroke={ORANGE}/>
        <text x="77" y="50" textAnchor="middle" fontSize="13" fill={GRIS}>œufs</text>
        <text x="77" y="76" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>boîtes × 6</text>
        <rect x="155" y="30" width="135" height="64" rx="10" fill="#eff6ff" stroke={BLEU}/>
        <text x="222" y="50" textAnchor="middle" fontSize="13" fill={GRIS}>entités</text>
        <text x="180" y="80" fontSize="15" fontWeight="700" fill={BLEU}>N = n ×</text>
        <NA x={240} y={80} fs={15} fill={BLEU}/>
        <rect x="10" y="102" width="135" height="64" rx="10" fill="#fff7ed" stroke={ORANGE}/>
        <text x="77" y="122" textAnchor="middle" fontSize="13" fill={GRIS}>boîtes</text>
        <text x="77" y="148" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>œufs ÷ 6</text>
        <rect x="155" y="102" width="135" height="64" rx="10" fill="#eff6ff" stroke={BLEU}/>
        <text x="222" y="122" textAnchor="middle" fontSize="13" fill={GRIS}>paquets (mol)</text>
        <text x="186" y="152" fontSize="15" fontWeight="700" fill={BLEU}>n = N ÷</text>
        <NA x={241} y={152} fs={15} fill={BLEU}/>
      </svg>
      <Formule><mi>N</mi><mo>=</mo><mi>n</mi><mo>×</mo><msub><mi>N</mi><mi>A</mi></msub></Formule>
      <Formule><mi>n</mi><mo>=</mo><mfrac><mi>N</mi><msub><mi>N</mi><mi>A</mi></msub></mfrac></Formule>
      <ul style={liste}>
        <li><strong>n paquets × N<sub>A</sub> entités par paquet = N entités.</strong></li>
        <li>Exemple : 1 mol → N = 1 × 6,02 × 10²³ entités ; les mol se simplifient dans n = N ÷ N<sub>A</sub>.</li>
        <li><strong>Piège</strong> : N est un très grand nombre sans unité (des entités) ; n est en mol, bien plus petit.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : masse d'une entité ──
export function FicheMasseEntite() {
  return (
    <div>
      <svg viewBox="0 0 300 178" style={svgStyle} role="img" aria-label="Molécule de dioxyde de carbone, formée d’un atome de carbone au centre et de deux atomes d’oxygène alignés de chaque côté. Masse d’un atome de carbone : 1,99 fois 10 puissance moins 26 kilogramme. Masse d’un atome d’oxygène : 2,66 fois 10 puissance moins 26 kilogramme. La masse de la molécule est la somme des masses des trois atomes.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Une molécule de CO₂ : 3 atomes</text>
        <circle cx="86" cy="62" r="23" fill="#dc2626"/><text x="86" y="68" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">O</text>
        <circle cx="150" cy="62" r="19" fill="#334155"/><text x="150" y="68" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">C</text>
        <circle cx="214" cy="62" r="23" fill="#dc2626"/><text x="214" y="68" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">O</text>
        <text x="86" y="104" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>2,66 × 10⁻²⁶ kg</text>
        <text x="150" y="124" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>1,99 × 10⁻²⁶ kg</text>
        <text x="214" y="104" textAnchor="middle" fontSize="13" fontWeight="700" fill={ENCRE}>2,66 × 10⁻²⁶ kg</text>
        <rect x="10" y="134" width="280" height="38" rx="8" fill="#eff6ff" stroke={BLEU}/>
        <text x="150" y="150" textAnchor="middle" fontSize="13" fill={ENCRE}>masse de la molécule = somme des masses</text>
        <text x="150" y="166" textAnchor="middle" fontSize="14" fontWeight="700" fill={BLEU}>7,31 × 10⁻²⁶ kg</text>
      </svg>
      <ul style={liste}>
        <li>La <strong>formule brute</strong> donne le nombre d’atomes de chaque sorte : CO₂ = 1 atome C + 2 atomes O.</li>
        <li><strong>Masse d’une entité = somme des masses de tous ses atomes</strong> (chaque masse est multipliée par le nombre d’atomes).</li>
        <li>Pour additionner, il faut la <strong>même puissance de 10</strong> : 3,0 × 10⁻²⁷ = 0,30 × 10⁻²⁶.</li>
        <li><strong>Idée fausse</strong> : « la molécule pèse comme un seul atome ». <strong>Vrai</strong> : on additionne tous les atomes.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : la chaîne complète ──
export function FicheChaine() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Chaîne de calcul : la masse m de l’échantillon, divisée par la masse d’une entité, donne le nombre d’entités N ; N divisé par N A donne la quantité de matière n en moles. Dans l’autre sens, on multiplie.">
        <rect x="8" y="14" width="84" height="70" rx="10" fill="#fff7ed" stroke={ORANGE}/>
        <text x="50" y="40" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>m</text>
        <text x="50" y="58" textAnchor="middle" fontSize="13" fill={ENCRE}>masse</text>
        <text x="50" y="74" textAnchor="middle" fontSize="13" fill={ENCRE}>en kg</text>
        <rect x="108" y="14" width="84" height="70" rx="10" fill="#eff6ff" stroke={BLEU}/>
        <text x="150" y="40" textAnchor="middle" fontSize="15" fontWeight="700" fill={BLEU}>N</text>
        <text x="150" y="58" textAnchor="middle" fontSize="13" fill={ENCRE}>nombre</text>
        <text x="150" y="74" textAnchor="middle" fontSize="13" fill={ENCRE}>d’entités</text>
        <rect x="208" y="14" width="84" height="70" rx="10" fill="#f0fdf4" stroke={VERT}/>
        <text x="250" y="40" textAnchor="middle" fontSize="15" fontWeight="700" fill={VERT}>n</text>
        <text x="250" y="58" textAnchor="middle" fontSize="13" fill={ENCRE}>quantité</text>
        <text x="250" y="74" textAnchor="middle" fontSize="13" fill={ENCRE}>en mol</text>
        <line x1="94" y1="38" x2="106" y2="38" stroke={GRIS} strokeWidth="2.4"/><polygon points="106,38 100,34 100,42" fill={GRIS}/>
        <line x1="194" y1="38" x2="206" y2="38" stroke={GRIS} strokeWidth="2.4"/><polygon points="206,38 200,34 200,42" fill={GRIS}/>
        <text x="100" y="108" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>÷ masse</text>
        <text x="100" y="124" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>d’une entité</text>
        <text x="204" y="108" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>÷ N</text>
        <text x="219" y="112" fontSize="13.5" fontWeight="700" fill={GRIS}>A</text>
        <text x="150" y="150" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>Dans l’autre sens : on multiplie</text>
        <rect x="10" y="160" width="280" height="30" rx="8" fill="#fff7ed" stroke={ORANGE}/>
        <text x="150" y="180" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>balance → nombre → paquets</text>
      </svg>
      <ul style={liste}>
        <li><strong>Trois étapes</strong> : (1) masse en kg ; (2) N = m ÷ masse d’une entité ; (3) n = N ÷ N<sub>A</sub>.</li>
        <li>Chaque étape garde son <strong>unité</strong> : kg, puis un nombre d’entités, puis des mol.</li>
        <li><strong>Moyen de s’en souvenir</strong> : « balance → nombre → paquets ».</li>
      </ul>
    </div>
  );
}
