// Cartes « À retenir » de la loi de Beer-Lambert et du dosage par étalonnage (sim 10) : un schéma et une idée mémorisable par carte.
// Les exemples chiffrés sont volontairement différents des valeurs obtenues dans le parcours.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

const Fl = ({ x1, y1, x2, y2, c = ORANGE }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 10;
  const p = `${x2},${y2} ${x2 - L * Math.cos(a - 0.45)},${y2 - L * Math.sin(a - 0.45)} ${x2 - L * Math.cos(a + 0.45)},${y2 - L * Math.sin(a + 0.45)}`;
  return <g><line x1={x1} y1={y1} x2={x2 - 7 * Math.cos(a)} y2={y2 - 7 * Math.sin(a)} stroke={c} strokeWidth="2.5"/><polygon points={p} fill={c}/></g>;
};
const Boite = ({ x, y, w, h = 44, l1, l2 }) => (
  <g><rect x={x} y={y} width={w} height={h} rx="8" fill="#eaf2fb" stroke="#7aa6d6" strokeWidth="2"/>
    <text x={x + w / 2} y={y + (l2 ? 19 : h / 2 + 5)} textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>{l1}</text>
    {l2 && <text x={x + w / 2} y={y + 36} textAnchor="middle" fontSize="13" fill={GRIS}>{l2}</text>}</g>
);

// ── Couleur perçue = complémentaire de la couleur absorbée ──
export function FicheCouleurs() {
  const lignes = [['#ea580c', 'rouge-orangé', '#2563eb', 'bleu'], ['#16a34a', 'vert', '#c026d3', 'magenta'], ['#eab308', 'jaune', '#6d28d9', 'bleu-violet']];
  return (
    <div>
      <svg viewBox="0 0 400 190" style={svgStyle} role="img" aria-label="Couleurs complémentaires : une solution qui absorbe le rouge-orangé paraît bleue, une solution qui absorbe le vert paraît magenta, une solution qui absorbe le jaune paraît bleu-violet">
        <text x="70" y="18" textAnchor="middle" fontSize="14" fontWeight="700" fill={GRIS}>absorbée</text>
        <text x="320" y="18" textAnchor="middle" fontSize="14" fontWeight="700" fill={GRIS}>perçue</text>
        {lignes.map(([c1, n1, c2, n2], i) => (
          <g key={i}>
            <rect x="12" y={32 + i * 50} width="46" height="36" rx="6" fill={c1}/>
            <text x="66" y={56 + i * 50} fontSize="14" fill={ENCRE}>{n1}</text>
            <Fl x1={186} y1={50 + i * 50} x2={236} y2={50 + i * 50}/>
            <rect x="246" y={32 + i * 50} width="46" height="36" rx="6" fill={c2}/>
            <text x="300" y={56 + i * 50} fontSize="14" fontWeight="700" fill={ENCRE}>{n2}</text>
          </g>
        ))}
      </svg>
      <ul style={liste}>
        <li><em>On voit la couleur qui n’est pas absorbée.</em> La bouillie bleue absorbe surtout le rouge-orangé.</li>
        <li>On mesure A à la longueur d’onde du <strong>maximum d’absorption λ<sub>max</sub></strong> : la mesure y est la plus <strong>sensible</strong>, et le spectre y est presque plat (peu sensible à une petite erreur sur λ).</li>
      </ul>
    </div>
  );
}

// Repère A = f(c) commun aux cartes suivantes : origine (50, 150), c vers la droite, A vers le haut
const Axes = ({ cLabel = 'c (mol/L)' }) => (
  <g>
    <line x1="50" y1="150" x2="290" y2="150" stroke={ENCRE} strokeWidth="2"/><line x1="50" y1="150" x2="50" y2="14" stroke={ENCRE} strokeWidth="2"/>
    <text x="290" y="170" textAnchor="end" fontSize="14" fill={GRIS}>{cLabel}</text><text x="56" y="22" fontSize="14" fill={GRIS}>A</text>
  </g>
);

// ── Loi de Beer-Lambert : A = k c (exemple : ε = 25 L·mol⁻¹·cm⁻¹, ℓ = 1 cm) ──
export function FicheDroite() {
  return (
    <div>
      <svg viewBox="0 0 400 180" style={svgStyle} role="img" aria-label="Droite d’étalonnage A égale k fois c passant par l’origine ; exemple : avec ε égal à 25 et ℓ égal à 1 cm, k vaut 25 L par mole, et une concentration de 0,020 mol par litre donne A égal à 0,50">
        <Axes/>
        <line x1="50" y1="150" x2="270" y2="30" stroke={BLEU} strokeWidth="3"/>
        <line x1="50" y1="90" x2="170" y2="90" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 4"/><line x1="170" y1="90" x2="170" y2="150" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 4"/>
        <circle cx="170" cy="90" r="5" fill={ORANGE}/>
        <text x="46" y="95" textAnchor="end" fontSize="13" fill={ORANGE}>0,50</text><text x="170" y="168" textAnchor="middle" fontSize="13" fill={ORANGE}>0,020</text>
        <text x="66" y="52" fontSize="15" fontWeight="700" fill={BLEU}>A = k × c</text>
        <text x="296" y="100" fontSize="14" fill={ENCRE}>ε = 25</text><text x="296" y="120" fontSize="14" fill={ENCRE}>ℓ = 1 cm</text>
        <text x="296" y="142" fontSize="14" fontWeight="700" fill={ORANGE}>k = ε × ℓ</text><text x="296" y="160" fontSize="14" fontWeight="700" fill={ORANGE}>= 25 L/mol</text>
      </svg>
      <Formule><mi>A</mi><mo>=</mo><mi>ε</mi><mo>×</mo><mi>ℓ</mi><mo>×</mo><mi>c</mi><mo>=</mo><mi>k</mi><mo>×</mo><mi>c</mi></Formule>
      <ul style={liste}>
        <li><em>A est proportionnelle à c : une droite qui passe par l’origine.</em></li>
        <li>ε (L·mol⁻¹·cm⁻¹) dépend de l’espèce et de λ ; ℓ (cm) est la largeur de la cuve ; A n’a pas d’unité.</li>
      </ul>
    </div>
  );
}

// ── Domaine de validité : au-delà de A ≈ 1, les points quittent la droite ──
export function FicheLineaire() {
  return (
    <div>
      <svg viewBox="0 0 400 180" style={svgStyle} role="img" aria-label="Schéma qualitatif : les points d’étalonnage suivent la droite pour les faibles absorbances puis s’en écartent vers le bas pour les fortes absorbances, au-delà de A voisin de 1">
        <Axes/>
        <rect x="50" y="90" width="236" height="60" fill="rgba(22,163,74,0.12)"/>
        <line x1="50" y1="90" x2="286" y2="90" stroke={VERT} strokeWidth="1.5" strokeDasharray="5 4"/>
        <line x1="50" y1="150" x2="270" y2="22" stroke={GRIS} strokeWidth="2" strokeDasharray="6 4"/>
        {[[82, 131], [122, 108], [162, 85], [202, 66], [242, 56]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill={i < 3 ? BLEU : ROUGE}/>)}
        <text x="46" y="95" textAnchor="end" fontSize="13" fill={VERT}>A ≈ 1</text>
        <text x="290" y="118" fontSize="14" fontWeight="700" fill={VERT}>domaine</text><text x="290" y="136" fontSize="14" fontWeight="700" fill={VERT}>linéaire</text>
        <text x="290" y="48" fontSize="14" fontWeight="700" fill={ROUGE}>points sous</text><text x="290" y="66" fontSize="14" fontWeight="700" fill={ROUGE}>la droite</text>
      </svg>
      <ul style={liste}>
        <li><em>R² proche de 1 ne suffit pas : on regarde aussi l’écart de chaque point à la droite.</em></li>
        <li>Aux fortes absorbances, la pente est sous-estimée : on dilue pour rester dans la zone où A est proportionnelle à c.</li>
      </ul>
    </div>
  );
}

// ── Dosage par étalonnage : lire c_X à partir de A_X (exemple : A_X = 0,30 ; k = 20 L/mol) ──
export function FicheEtalonnage() {
  return (
    <div>
      <svg viewBox="0 0 400 180" style={svgStyle} role="img" aria-label="Lecture de la concentration inconnue : on repère l’absorbance A X de la solution inconnue sur l’axe vertical, on rejoint la droite d’étalonnage puis on descend sur l’axe des concentrations ; exemple : A X égale 0,30 et k égal 20 L par mole donnent c X égale 0,015 mol par litre">
        <Axes/>
        <line x1="50" y1="150" x2="270" y2="30" stroke={BLEU} strokeWidth="3"/>
        {[[72, 138], [116, 114], [160, 90], [204, 66], [248, 42]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={BLEU}/>)}
        <Fl x1={50} y1={102} x2={128} y2={102}/><Fl x1={128} y1={102} x2={128} y2={146}/>
        <text x="46" y="107" textAnchor="end" fontSize="13" fontWeight="700" fill={ORANGE}>A<tspan fontSize="11">X</tspan></text>
        <text x="128" y="168" textAnchor="middle" fontSize="13" fontWeight="700" fill={ORANGE}>c<tspan fontSize="11">X</tspan></text>
        <text x="296" y="80" fontSize="14" fill={ENCRE}>A<tspan fontSize="11" dy="3">X</tspan><tspan dy="-3"> = 0,30</tspan></text>
        <text x="296" y="100" fontSize="14" fill={ENCRE}>k = 20 L/mol</text>
        <text x="296" y="128" fontSize="14" fontWeight="700" fill={ORANGE}>c<tspan fontSize="11" dy="3">X</tspan><tspan dy="-3"> = A</tspan><tspan fontSize="11" dy="3">X</tspan><tspan dy="-3"> / k</tspan></text>
        <text x="296" y="148" fontSize="14" fontWeight="700" fill={ORANGE}>= 0,015 mol/L</text>
      </svg>
      <Formule><msub><mi>c</mi><mi>X</mi></msub><mo>=</mo><mfrac><msub><mi>A</mi><mi>X</mi></msub><mi>k</mi></mfrac><mspace width="1.5em"/><msub><mi>c</mi><mi>m</mi></msub><mo>=</mo><mi>c</mi><mo>×</mo><mi>M</mi></Formule>
      <ul style={liste}>
        <li><em>Mesurer A<sub>X</sub>, puis lire (ou calculer) c<sub>X</sub> sur la droite : A<sub>X</sub> doit tomber dans la gamme étalon.</em></li>
        <li>c en mol·L⁻¹ et M en g·mol⁻¹ donnent c<sub>m</sub> en g·L⁻¹.</li>
      </ul>
    </div>
  );
}

// ── Pureté d'un solide (exemple : 1,00 g dans 100 mL attendrait 0,0400 mol/L ; on mesure 0,0344 mol/L) ──
export function FichePurete() {
  return (
    <div>
      <svg viewBox="0 0 400 190" style={svgStyle} role="img" aria-label="Pureté : on compare la concentration mesurée à la concentration attendue si le solide était pur ; exemple : 0,0344 mol par litre mesurée pour 0,0400 mol par litre attendue donne une pureté de 86 pour cent">
        <Boite x={10} y={14} w={110} l1="c attendue" l2="0,0400"/>
        <Boite x={145} y={14} w={110} l1="c mesurée" l2="0,0344"/>
        <Boite x={280} y={14} w={110} l1="pureté" l2="0,0344 ÷ 0,0400"/>
        <Fl x1={120} y1={36} x2={145} y2={36}/><Fl x1={255} y1={36} x2={280} y2={36}/>
        <text x="200" y="76" textAnchor="middle" fontSize="13" fill={GRIS}>concentrations en mol/L ; solide pur : 1,00 g dans 100 mL</text>
        <rect x="40" y="110" width="320" height="26" rx="4" fill="#e2e8f0"/>
        <rect x="40" y="110" width={320 * 0.86} height="26" rx="4" fill="#60a5fa"/>
        <text x="40" y="160" fontSize="14" fill={GRIS}>0 %</text><text x="360" y="160" textAnchor="end" fontSize="14" fill={GRIS}>100 %</text>
        <text x={40 + 320 * 0.86} y="103" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>86 %</text>
        <text x="200" y="184" textAnchor="middle" fontSize="14" fill={GRIS}>le reste : impuretés (eau, sels…)</text>
      </svg>
      <ul style={liste}>
        <li><strong>Préparer</strong> : n = c × V (V en litres), puis m = n × M.</li>
        <li><em>Concentration mesurée plus faible que prévue : le solide n’est pas pur.</em></li>
        <li>Pureté = <strong>c<sub>mesurée</sub> ÷ c<sub>attendue</sub> × 100</strong>, avec c<sub>mesurée</sub> = A ÷ k.</li>
      </ul>
    </div>
  );
}

// ── Bilan : la méthode en six temps ──
export function FicheBilan() {
  return (
    <div>
      <svg viewBox="0 0 400 190" style={svgStyle} role="img" aria-label="Méthode du dosage par étalonnage en six temps : faire le blanc, choisir la longueur d’onde du maximum, mesurer la gamme étalon, tracer la droite A égale k c, mesurer A X et calculer c X, puis calculer la concentration en masse">
        <Boite x={10} y={10} w={110} l1="1. Blanc" l2="A = 0"/>
        <Boite x={145} y={10} w={110} l1="2. λ" l2="maximum"/>
        <Boite x={280} y={10} w={110} l1="3. Gamme" l2="mesurer A"/>
        <Boite x={280} y={100} w={110} l1="4. Droite" l2="A = k × c"/>
        <Boite x={145} y={100} w={110} l1="5. A de X" l2="c = A ÷ k"/>
        <Boite x={10} y={100} w={110} l1="6. Masse" l2="c × M"/>
        <Fl x1={120} y1={32} x2={145} y2={32}/><Fl x1={255} y1={32} x2={280} y2={32}/>
        <Fl x1={335} y1={54} x2={335} y2={100}/>
        <Fl x1={280} y1={122} x2={255} y2={122}/><Fl x1={145} y1={122} x2={120} y2={122}/>
        <text x="200" y="176" textAnchor="middle" fontSize="14" fill={GRIS}>vérifier : R² et écart de chaque point</text>
      </svg>
      <ul style={liste}>
        <li>Absorbance, sans unité : <Formule><mi>A</mi><mo>=</mo><mi>log</mi><mo>(</mo><mfrac><msub><mi>I</mi><mn>0</mn></msub><mi>I</mi></mfrac><mo>)</mo></Formule></li>
        <li>Loi de Beer-Lambert : A = ε × ℓ × c, pour des solutions diluées.</li>
        <li><em>Le blanc d’abord, le maximum ensuite, la droite pour conclure.</em></li>
      </ul>
    </div>
  );
}
