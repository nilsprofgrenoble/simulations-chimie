// Cartes « À retenir » de la simulation « Familles chimiques : même colonne, mêmes comportements » (sim 58, 2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut, avec des exemples différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 12,5 à 16 (≥ 9 px rendus).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#b45309', VERT = '#15803d', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 360, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const FAM = { alc: ['#fde7b5', '#b97800'], terr: ['#cfe9f8', '#1f7fb5'], hal: ['#f4d3e5', '#a84c82'], nob: ['#e5e7eb', '#4b5563'] };

// ── Carte 1 : colonnes et familles ──
const Colonne = ({ x0, col, noms, elements, fam, val }) => (
  <g>
    <text x={x0 + 34} y="14" textAnchor="middle" fontSize="12.5" fill={GRIS}>colonne {col}</text>
    <text x={x0 + 34} y="31" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>{noms[0]}</text>
    <text x={x0 + 34} y="45" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>{noms[1]}</text>
    {elements.map((e, k) => <g key={e}>
      <rect x={x0 + 8} y={54 + k * 32} width="52" height="28" rx="4" fill={FAM[fam][0]} stroke={FAM[fam][1]} strokeWidth="2"/>
      <text x={x0 + 34} y={73 + k * 32} textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>{e}</text></g>)}
    <text x={x0 + 34} y="164" textAnchor="middle" fontSize="14" fontWeight="800" fill={ORANGE}>{val}</text>
    <text x={x0 + 34} y="180" textAnchor="middle" fontSize="12.5" fill={GRIS}>de valence</text>
  </g>
);
export function FicheColonnes() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Quatre colonnes du tableau périodique : colonne 1, les alcalins (lithium, sodium, potassium) avec 1 électron de valence ; colonne 2, les alcalino-terreux (béryllium, magnésium, calcium) avec 2 ; colonne 17, les halogènes (fluor, chlore) avec 7 ; colonne 18, les gaz nobles (hélium, néon, argon) avec 8, ou 2 pour l’hélium">
        <Colonne x0={2} col="1" noms={['alcalins', '']} elements={['Li', 'Na', 'K']} fam="alc" val="1 e⁻"/>
        <Colonne x0={76} col="2" noms={['alcalino-', 'terreux']} elements={['Be', 'Mg', 'Ca']} fam="terr" val="2 e⁻"/>
        <Colonne x0={150} col="17" noms={['halogènes', '']} elements={['F', 'Cl']} fam="hal" val="7 e⁻"/>
        <Colonne x0={224} col="18" noms={['gaz', 'nobles']} elements={['He', 'Ne', 'Ar']} fam="nob" val="8 e⁻"/>
      </svg>
      <ul style={liste}>
        <li>Une <strong>colonne</strong> = même nombre d’<strong>électrons de valence</strong> = une <strong>famille</strong> aux propriétés chimiques semblables.</li>
        <li>Les colonnes 3 à 16 ne sont pas montrées ici ; l’hélium n’a que 2 électrons (duet).</li>
        <li>Les éléments sont rangés par <strong>numéro atomique Z</strong> croissant (tableau limité ici à Z = 1 à 20).</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : familles et ions ──
const Rangee = ({ y, fam, nom, col, ion, c }) => (
  <g>
    <rect x="4" y={y} width="292" height="36" rx="10" fill={FAM[fam][0]} stroke={FAM[fam][1]} strokeWidth="2"/>
    <text x="12" y={y + 23} fontSize="13" fontWeight="800" fill={ENCRE}>{nom}</text>
    <text x="150" y={y + 23} fontSize="12.5" fill={GRIS}>{col}</text>
    <text x="288" y={y + 24} textAnchor="end" fontSize="16" fontWeight="800" fill={c}>{ion}</text>
  </g>
);
export function FicheFamilles() {
  return (
    <div>
      <svg viewBox="0 0 300 178" style={svgStyle} role="img" aria-label="Chaque famille forme un ion de charge fixée : les alcalins X plus, les alcalino-terreux X 2 plus, les halogènes X moins, les gaz nobles aucun ion">
        <Rangee y={4} fam="alc" nom="alcalins" col="col. 1 · 1 e⁻" ion="X⁺" c={ORANGE}/>
        <Rangee y={46} fam="terr" nom="alcalino-terreux" col="col. 2 · 2 e⁻" ion="X²⁺" c={ORANGE}/>
        <Rangee y={88} fam="hal" nom="halogènes" col="col. 17 · 7 e⁻" ion="X⁻" c={BLEU}/>
        <Rangee y={130} fam="nob" nom="gaz nobles" col="col. 18 · 8 e⁻" ion="aucun" c={GRIS}/>
      </svg>
      <ul style={liste}>
        <li><strong>Règle :</strong> un atome devient un ion en perdant ou en gagnant des électrons pour avoir la couche externe d’un <strong>gaz noble</strong> (octet, ou duet pour He).</li>
        <li><strong>Méthode :</strong> (1) trouver la colonne ; (2) compter les électrons de valence ; (3) en perdre 1 ou 2, ou gagner ce qui manque pour 8 ; (4) en déduire la charge.</li>
        <li><strong>Piège :</strong> la charge d’un ion est positive si l’atome perd des électrons, négative s’il en gagne.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : équilibrer atomes et charge ──
const Coef = ({ n }) => <tspan fill={ORANGE} fontWeight="800">{n}</tspan>;
export function FicheEquilibrer() {
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Équation du métal alcalin X avec l’eau : 2 X plus 2 H2O donne 2 X plus, H2 et 2 HO moins ; équation du magnésium : Mg plus 2 H2O donne Mg 2 plus, H2 et 2 HO moins ; les atomes d’hydrogène et d’oxygène et la charge totale sont conservés">
        <text x="150" y="16" textAnchor="middle" fontSize="12.5" fill={GRIS}>colonne 1 (Na, K) : X⁺</text>
        <text x="150" y="38" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}><Coef n="2"/> X + <Coef n="2"/> H₂O → <Coef n="2"/> X⁺ + H₂ + <Coef n="2"/> HO⁻</text>
        <text x="150" y="68" textAnchor="middle" fontSize="12.5" fill={GRIS}>colonne 2 (Mg) : X²⁺</text>
        <text x="150" y="90" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>Mg + <Coef n="2"/> H₂O → Mg²⁺ + H₂ + <Coef n="2"/> HO⁻</text>
        <rect x="14" y="108" width="272" height="30" rx="15" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="128" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>H : 4 = 2 + 2 · O : 2 = 2 ✓</text>
        <rect x="14" y="146" width="272" height="30" rx="15" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="166" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>charge : 0 = (+2) + 2 × (−1) ✓</text>
      </svg>
      <ul style={liste}>
        <li>Une équation conserve les <strong>atomes</strong> de chaque élément et la <strong>charge électrique</strong> : on ajuste les <strong>coefficients</strong>, jamais les formules.</li>
        <li><strong>Même famille, même équation</strong> : Na et K (X⁺) donnent 2 X + 2 H₂O → 2 X⁺ + H₂ + 2 HO⁻. En colonne 2 (X²⁺), il faut <strong>deux</strong> ions HO⁻ par ion X²⁺ (2+ et 2 × 1− se compensent).</li>
        <li><strong>Hypothèse :</strong> le magnésium réagit en réalité lentement avec l’eau froide ; on s’entraîne ici à équilibrer, pas à prévoir la vitesse.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : solide ionique neutre ──
const Ion = ({ cx, cy, r, t, c, fond }) => (
  <g><circle cx={cx} cy={cy} r={r} fill={fond} stroke={c} strokeWidth="2.5"/><text x={cx} y={cy + 5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ENCRE}>{t}</text></g>
);
export function FicheIonique() {
  return (
    <div>
      <svg viewBox="0 0 300 170" style={svgStyle} role="img" aria-label="Un solide ionique est neutre : Na plus et Cl moins se compensent, formule NaCl ; Ca 2 plus se compense avec deux F moins, formule CaF2">
        <Ion cx={40} cy={34} r={18} t="Na⁺" c={ORANGE} fond="#fff7ed"/><text x="76" y="40" textAnchor="middle" fontSize="16" fontWeight="800" fill={GRIS}>+</text><Ion cx={112} cy={34} r={18} t="Cl⁻" c={BLEU} fond="#eff6ff"/>
        <text x="158" y="40" textAnchor="middle" fontSize="18" fontWeight="800" fill={GRIS}>→</text><text x="226" y="41" textAnchor="middle" fontSize="17" fontWeight="800" fill={VERT}>NaCl</text>
        <text x="150" y="72" textAnchor="middle" fontSize="12.5" fill={GRIS}>(+1) + (−1) = 0</text>
        <Ion cx={40} cy={110} r={22} t="Ca²⁺" c={ORANGE} fond="#fff7ed"/><text x="76" y="116" textAnchor="middle" fontSize="16" fontWeight="800" fill={GRIS}>+</text>
        <Ion cx={106} cy={110} r={17} t="F⁻" c={BLEU} fond="#eff6ff"/><Ion cx={140} cy={110} r={17} t="F⁻" c={BLEU} fond="#eff6ff"/>
        <text x="176" y="116" textAnchor="middle" fontSize="18" fontWeight="800" fill={GRIS}>→</text><text x="238" y="117" textAnchor="middle" fontSize="17" fontWeight="800" fill={VERT}>CaF₂</text>
        <text x="150" y="150" textAnchor="middle" fontSize="12.5" fill={GRIS}>(+2) + 2 × (−1) = 0</text>
      </svg>
      <Formule><mi>x</mi><mo>×</mo><msub><mi>q</mi><mtext>+</mtext></msub><mo>+</mo><mi>y</mi><mo>×</mo><msub><mi>q</mi><mtext>−</mtext></msub><mo>=</mo><mn>0</mn></Formule>
      <ul style={liste}>
        <li>Un solide ionique est <strong>électriquement neutre</strong> : charges positives et négatives se compensent.</li>
        <li><strong>Méthode :</strong> écrire les charges, chercher les plus petits x et y qui rendent le total nul, écrire la formule (cation d’abord) et nommer (anion d’abord : « chlorure de sodium »).</li>
        <li>La formule ne donne que le <strong>rapport</strong> des ions (CaF₂ : 1 Ca²⁺ pour 2 F⁻), pas une molécule.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : test aux ions argent ──
const Tube = ({ cx, couleur, trait }) => (
  <g>
    <path d={`M ${cx - 14} 30 V 84 a 14 14 0 0 0 28 0 V 30`} fill="#e0f2fe" stroke={ENCRE} strokeWidth="2"/>
    <path d={`M ${cx - 14} 66 V 84 a 14 14 0 0 0 28 0 V 66 Z`} fill={couleur} stroke={trait} strokeWidth="1.5"/>
  </g>
);
export function FicheArgent() {
  const tubes = [[50, '#f8fafc', '#94a3b8', 'Cl⁻', 'AgCl', 'blanc'], [150, '#fef9c3', '#ca8a04', 'Br⁻', 'AgBr', 'jaune pâle'], [250, '#fde047', '#a16207', 'I⁻', 'AgI', 'jaune']];
  return (
    <div>
      <svg viewBox="0 0 300 168" style={svgStyle} role="img" aria-label="Test aux ions argent : avec les ions chlorure, le précipité AgCl est blanc ; avec les ions bromure, AgBr est jaune pâle ; avec les ions iodure, AgI est jaune">
        <text x="150" y="16" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={GRIS}>Ag⁺ + X⁻ → AgX (précipité)</text>
        {tubes.map(([cx, c, t, ion, sel, asp]) => <g key={ion}>
          <Tube cx={cx} couleur={c} trait={t}/>
          <text x={cx} y="118" textAnchor="middle" fontSize="14" fontWeight="800" fill={BLEU}>{ion}</text>
          <text x={cx} y="135" textAnchor="middle" fontSize="12.5" fill={GRIS}>{sel}</text>
          <text x={cx} y="152" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>{asp}</text></g>)}
      </svg>
      <ul style={liste}>
        <li><strong>Équation :</strong> Ag⁺ + X⁻ → AgX (solide) : atomes et charge conservés (1+ et 1− se compensent).</li>
        <li>Le <strong>précipité</strong> est un solide qui se forme dans une solution ; sa couleur identifie l’ion halogénure.</li>
        <li><strong>Piège :</strong> blanc, jaune pâle et jaune se ressemblent : comparer avec des témoins.</li>
      </ul>
    </div>
  );
}
