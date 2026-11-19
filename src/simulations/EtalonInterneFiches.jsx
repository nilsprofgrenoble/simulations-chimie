// Cartes « À retenir » de la simulation 13 (étalon interne / normalisation interne).
// Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut ; exemples chiffrés différents de ceux des étapes.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Case = ({ x, y, w = 84, h = 38, children, c = BLEU, fond = '#e8f1fa' }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill={fond} stroke={c} strokeWidth="2"/><text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={c}>{children}</text></g>;

// A. Rôle de l'EI : le rapport des aires ne dépend pas du volume injecté
export function FicheRoleEI() {
  const base = 118, bar = (x, h, c) => <rect x={x} y={base - h} width="30" height={h} fill={c} rx="2"/>;
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Deux injections : quand le volume injecté est multiplié par 1,5, l'aire de l'analyte et l'aire de l'étalon interne sont multipliées par 1,5 mais leur rapport reste égal à 2">
        <T x={75} y={16} a="middle" w={800}>injection 1</T><T x={225} y={16} a="middle" w={800}>volume × 1,5</T>
        {bar(40, 60, BLEU)}{bar(80, 30, ORANGE)}{bar(190, 90, BLEU)}{bar(230, 45, ORANGE)}
        <line x1="20" y1={base} x2="280" y2={base} stroke={GRIS} strokeWidth="2"/>
        <T x={55} y={136} a="middle" c={BLEU} w={700}>analyte</T><T x={95} y={136} a="middle" c={ORANGE} w={700}>EI</T>
        <T x={205} y={136} a="middle" c={BLEU} w={700}>analyte</T><T x={245} y={136} a="middle" c={ORANGE} w={700}>EI</T>
        <T x={75} y={170} a="middle" c={VERT} w={800}>rapport = 2</T><T x={225} y={170} a="middle" c={VERT} w={800}>rapport = 2</T>
      </svg>
      <ul style={liste}>
        <li><em>L’EI voyage avec l’analyte : si le volume injecté change, les deux aires changent dans la même proportion.</em></li>
        <li><strong>Un bon EI :</strong> absent de l’échantillon, pur, stable, au pic bien séparé et au temps de rétention proche de ceux des analytes.</li>
        <li><strong>On travaille avec</strong> A<sub>analyte</sub> / A<sub>EI</sub>, jamais avec l’aire seule.</li>
      </ul>
    </div>
  );
}

// B. Un seul étalon : droite par l'origine
export function FicheUnEtalon() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Droite passant par l'origine : le rapport des aires est proportionnel à la concentration ; le point de l'étalon et l'origine suffisent à la tracer, et l'échantillon se lit sur la droite à une concentration voisine">
        <polyline points="40,18 40,140 280,140" fill="none" stroke={GRIS} strokeWidth="2"/>
        <T x={44} y={14} c={GRIS}>A / A_EI</T><T x={278} y={158} a="end" c={GRIS}>concentration</T>
        <line x1="40" y1="140" x2="270" y2="36" stroke={BLEU} strokeWidth="3"/>
        <circle cx="40" cy="140" r="5" fill={ENCRE}/><T x={30} y={158} c={GRIS}>origine</T>
        <circle cx="130" cy="99" r="6" fill={ORANGE}/><T x={136} y={120} c={ORANGE} w={800}>étalon</T>
        <circle cx="180" cy="77" r="6" fill={VERT}/><T x={120} y={64} c={VERT} w={800}>échantillon</T>
        <line x1="130" y1="99" x2="130" y2="140" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="3 3"/><line x1="180" y1="77" x2="180" y2="140" stroke={VERT} strokeWidth="1.5" strokeDasharray="3 3"/>
      </svg>
      <Formule><mfrac><msub><mi>C</mi><mtext>éch</mtext></msub><msub><mi>C</mi><mtext>ét</mtext></msub></mfrac><mo>=</mo><mfrac><msub><mi>r</mi><mtext>éch</mtext></msub><msub><mi>r</mi><mtext>ét</mtext></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>Un point + l’origine = une droite : un seul étalon suffit.</em></li>
        <li><strong>r = A<sub>an</sub> / A<sub>EI</sub></strong> (rapport des aires). <strong>Hypothèses :</strong> réponse proportionnelle à la concentration, C<sub>éch</sub> proche de C<sub>ét</sub>, même concentration en EI dans les deux solutions.</li>
      </ul>
    </div>
  );
}

// C. Dilution : facteur et unités
export function FicheDilution() {
  return (
    <div>
      <svg viewBox="0 0 300 160" style={svgStyle} role="img" aria-label="Dilution : on prélève 50 microlitres d'une solution à 2 000 milligrammes par litre et on complète à 10 millilitres soit 10 000 microlitres ; le facteur est 0,005 et la concentration devient 10 milligrammes par litre">
        <Case x={10} y={14} w={112} h={44}>fiole mère</Case><Case x={178} y={14} w={112} h={44} c={VERT} fond="#dcfce7">fiole fille</Case>
        <Arr x1={124} y1={36} x2={176} y2={36}/><T x={150} y={28} a="middle" c={ORANGE} w={800}>50 µL</T>
        <T x={66} y={76} a="middle">2 000 mg/L</T><T x={234} y={76} a="middle">10 mL</T>
        <T x={150} y={104} a="middle" c={ORANGE} w={800}>10 mL = 10 000 µL</T>
        <T x={150} y={126} a="middle" w={700}>facteur = 50 / 10 000 = 0,005</T>
        <T x={150} y={148} a="middle" c={VERT} w={800}>2 000 × 0,005 = 10 mg/L</T>
      </svg>
      <Formule><mi>C</mi><mo>=</mo><msub><mi>C</mi><mn>0</mn></msub><mo>×</mo><mfrac><msub><mi>V</mi><mtext>prélevé</mtext></msub><msub><mi>V</mi><mtext>fiole</mtext></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>Même unité en haut et en bas : 10 mL = 10 000 µL.</em></li>
        <li><strong>Piège :</strong> diviser des µL par des mL donne un facteur 1 000 fois trop grand.</li>
      </ul>
    </div>
  );
}

// D. Du rapport d'aires à la concentration
export function FicheRapports() {
  const base = 100, pic = (cx, h, c) => <polygon points={`${cx - 14},${base} ${cx},${base - h} ${cx + 14},${base}`} fill={c} opacity="0.85"/>;
  return (
    <div>
      <svg viewBox="0 0 300 178" style={svgStyle} role="img" aria-label="Exemple : l'étalon a un rapport 0,8, l'échantillon un rapport 1,2 ; avec une concentration d'étalon de 10 milligrammes par litre, l'échantillon est à 15 milligrammes par litre">
        <T x={75} y={16} a="middle" w={800}>étalon</T><T x={225} y={16} a="middle" w={800}>échantillon</T>
        {pic(48, 40, BLEU)}{pic(100, 50, ORANGE)}{pic(198, 60, BLEU)}{pic(250, 50, ORANGE)}
        <line x1="20" y1={base} x2="280" y2={base} stroke={GRIS} strokeWidth="2"/>
        <T x={48} y={118} a="middle" c={BLEU} w={700}>analyte</T><T x={100} y={118} a="middle" c={ORANGE} w={700}>EI</T>
        <T x={198} y={118} a="middle" c={BLEU} w={700}>analyte</T><T x={250} y={118} a="middle" c={ORANGE} w={700}>EI</T>
        <T x={75} y={152} a="middle" w={800}>rapport 0,8</T><T x={225} y={152} a="middle" w={800}>rapport 1,2</T>
        <T x={150} y={172} a="middle" c={VERT} w={800}>10 × 1,2 / 0,8 = 15 mg/L</T>
      </svg>
      <ul style={liste}>
        <li><em>Rapport de l’échantillon ÷ rapport de l’étalon = C<sub>éch</sub> ÷ C<sub>ét</sub> : on multiplie C<sub>ét</sub> par ce quotient.</em></li>
        <li><strong>Piège :</strong> aires brutes au lieu des rapports, ou rapports inversés.</li>
      </ul>
    </div>
  );
}

// E. De la fiole injectée au pourcentage massique
export function FichePourcentage() {
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Chaîne de calcul : concentration dans la fiole injectée, multipliée par l'inverse du facteur de dilution, donne la concentration de la fiole de dissolution ; multipliée par le volume, elle donne la masse du composé ; divisée par la masse de solide pesée et multipliée par 100, elle donne le pourcentage massique">
        <Case x={80} y={6} w={140} h={32}>C dans la fiole injectée</Case>
        <Arr x1={150} y1={40} x2={150} y2={62} c={ORANGE}/><T x={160} y={56} c={ORANGE} w={800}>÷ facteur de dilution</T>
        <Case x={80} y={66} w={140} h={32}>C dans la fiole 4</Case>
        <Arr x1={150} y1={100} x2={150} y2={122} c={ORANGE}/><T x={160} y={116} c={ORANGE} w={800}>× volume (en L)</T>
        <Case x={80} y={126} w={140} h={32} c={VERT} fond="#dcfce7">masse du composé</Case>
        <Arr x1={150} y1={160} x2={150} y2={176} c={ORANGE}/>
        <T x={150} y={188} a="middle" w={800}>÷ masse pesée × 100 = %</T>
      </svg>
      <ul style={liste}>
        <li><em>On remonte les dilutions, puis on rapporte la masse à la prise d’essai pesée.</em></li>
        <li><strong>Volume en litres :</strong> 20 mL = 0,020 L.</li>
        <li><strong>Masses dans la même unité</strong> (mg avec mg) avant de multiplier par 100.</li>
      </ul>
    </div>
  );
}

// F. Ce que l'EI corrige, ce qu'il ne corrige pas
export function FicheLimitesEI() {
  const lignes = [['volume injecté qui change', 'corrigé par l’EI', VERT], ['quantité d’EI différente', 'à corriger : × C_EI,éch / C_EI,ét', ORANGE], ['total des % supérieur à 100', 'incertitudes (pesées, 40 µL, aires)', ROUGE]];
  return (
    <div>
      <svg viewBox="0 0 300 168" style={svgStyle} role="img" aria-label="Trois situations : un volume injecté qui change est corrigé par l'étalon interne ; une quantité d'étalon interne différente doit être corrigée par le rapport des concentrations ; un total supérieur à 100 pour cent s'explique par les incertitudes">
        {lignes.map(([a, b, c], i) => { const y = 6 + 54 * i; return <g key={a}>
          <rect x="4" y={y} width="292" height="48" rx="6" fill={i % 2 ? '#f1f5f9' : '#e8f1fa'}/><rect x="4" y={y} width="6" height="48" rx="3" fill={c}/>
          <T x={18} y={y + 20} w={700}>{a}</T><T x={18} y={y + 39} c={c} w={800}>→ {b}</T></g>; })}
      </svg>
      <ul style={liste}>
        <li><em>L’EI compense ce qui varie à l’injection, pas ce qui varie à la préparation.</em></li>
        <li><strong>Un total de 104 %</strong> est impossible : un écart de quelques % reste de l’ordre des incertitudes, qu’il faut calculer avant de conclure.</li>
      </ul>
    </div>
  );
}

// G. Principe de la normalisation interne
export function FicheNI() {
  return (
    <div>
      <svg viewBox="0 0 300 120" style={svgStyle} role="img" aria-label="Barre de 100 pour cent formée de tous les constituants détectés : éthanol, toluène, acétate de butyle ; on ne répartit que ce qui est détecté">
        <T x={150} y={16} a="middle" w={800}>100 % = tous les pics détectés</T>
        <rect x="10" y="28" width="110" height="38" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/><rect x="120" y="28" width="90" height="38" fill="#fed7aa" stroke={ORANGE} strokeWidth="2"/><rect x="210" y="28" width="80" height="38" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/>
        <T x={65} y={52} a="middle" c={BLEU} w={800}>constit. 1</T><T x={165} y={52} a="middle" c={ORANGE} w={800}>2</T><T x={250} y={52} a="middle" c={VERT} w={800}>3</T>
        <T x={150} y={96} a="middle" w={700}>on répartit uniquement ce qui est vu</T>
        <T x={150} y={114} a="middle" c={GRIS}>pas d’EI, pas de masse injectée</T>
      </svg>
      <ul style={liste}>
        <li><em>NI : on cherche la composition (% massiques), à condition que tous les constituants soient élués et détectés.</em></li>
        <li><strong>Étalon de composition connue,</strong> passé dans les mêmes conditions que l’échantillon.</li>
      </ul>
    </div>
  );
}

// H. Coefficient de réponse relatif
export function FicheK() {
  return (
    <div>
      <svg viewBox="0 0 300 130" style={svgStyle} role="img" aria-label="Exemple sur l'étalon : composé i à 30 pour cent d'aire 5000, référence à 40 pour cent d'aire 8000 ; K vaut 1,2, ce qui signifie que le détecteur voit moins bien le composé i que la référence">
        <T x={150} y={16} a="middle" w={800}>exemple sur l’étalon</T>
        <Case x={8} y={26} w={130} h={34} c={ORANGE} fond="#ffedd5">réf. 40 % · A 8 000</Case><Case x={162} y={26} w={130} h={34}>i : 30 % · A 5 000</Case>
        <T x={150} y={88} a="middle" w={700}>K = (30 / 40) × (8 000 / 5 000)</T>
        <T x={150} y={110} a="middle" c={VERT} w={800}>K = 0,75 × 1,6 = 1,2</T>
        <T x={150} y={126} a="middle" c={GRIS}>K &gt; 1 : i est vu moins bien que la réf.</T>
      </svg>
      <Formule><msub><mi>K</mi><mrow><mi>i</mi><mo>/</mo><mn>1</mn></mrow></msub><mo>=</mo><mfrac><msub><mi>%</mi><mi>i</mi></msub><msub><mi>%</mi><mn>1</mn></msub></mfrac><mo>×</mo><mfrac><msub><mi>A</mi><mn>1</mn></msub><msub><mi>A</mi><mi>i</mi></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>K corrige la réponse du détecteur : pour la référence, K = 1.</em></li>
        <li><strong>Piège :</strong> A de la référence au numérateur, pas au dénominateur.</li>
      </ul>
    </div>
  );
}

// I. Des aires corrigées aux pourcentages
export function FicheCorrection() {
  const w = [21.7, 52.2, 26.1], xs = [10, 10 + 2.8 * w[0], 10 + 2.8 * (w[0] + w[1])];
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Exemple : trois aires corrigées 1000, 2400 et 1200 de somme 4600 donnent 21,7, 52,2 et 26,1 pour cent, soit 100 pour cent au total">
        <T x={150} y={16} a="middle" w={800}>K × A : 1 000 · 2 400 · 1 200</T>
        <T x={150} y={36} a="middle" c={GRIS}>somme = 4 600</T>
        {w.map((p, i) => <rect key={i} x={xs[i]} y="48" width={2.8 * p} height="34" fill={['#bfdbfe', '#fed7aa', '#bbf7d0'][i]} stroke={[BLEU, ORANGE, VERT][i]} strokeWidth="2"/>)}
        {w.map((p, i) => <T key={i} x={xs[i] + 1.4 * p} y={70} a="middle" c={[BLEU, ORANGE, VERT][i]} w={800}>{p}</T>)}
        <T x={150} y={106} a="middle" w={700}>% = K × A / somme × 100</T>
        <T x={150} y={128} a="middle" c={VERT} w={800}>21,7 + 52,2 + 26,1 = 100,0 %</T>
      </svg>
      <ul style={liste}>
        <li><em>On corrige chaque aire par son K, puis on divise par la somme des aires corrigées.</em></li>
        <li><strong>Contrôle :</strong> les pourcentages totalisent 100 % par construction.</li>
      </ul>
    </div>
  );
}

// J. Bilan : étalon interne ou normalisation interne
export function FicheChoix() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Comparaison : l'étalon interne ajoute un composé de référence et donne la quantité d'un analyte, avec pour hypothèses la linéarité et la même quantité d'EI ; la normalisation interne n'ajoute rien et donne la composition, à condition que tout soit détecté et les coefficients connus">
        <Case x={6} y={6} w={140} h={30}>étalon interne</Case><Case x={154} y={6} w={140} h={30} c={ORANGE} fond="#ffedd5">normalisation</Case>
        <T x={76} y={56} a="middle" w={700}>on ajoute un EI</T><T x={224} y={56} a="middle" w={700}>on n’ajoute rien</T>
        <T x={76} y={80} a="middle" c={GRIS}>résultat :</T><T x={224} y={80} a="middle" c={GRIS}>résultat :</T>
        <T x={76} y={98} a="middle" w={800}>une quantité</T><T x={224} y={98} a="middle" w={800}>une composition</T>
        <line x1="150" y1="46" x2="150" y2="152" stroke={GRIS} strokeWidth="1.5" strokeDasharray="3 4"/>
        <T x={76} y={126} a="middle" c={VERT} w={700}>réponse linéaire</T><T x={76} y={144} a="middle" c={VERT} w={700}>même C_EI partout</T>
        <T x={224} y={126} a="middle" c={VERT} w={700}>tout est détecté</T><T x={224} y={144} a="middle" c={VERT} w={700}>K connus (étalon)</T>
        <T x={150} y={170} a="middle" c={GRIS}>hypothèses à vérifier</T>
      </svg>
      <ul style={liste}>
        <li><em>EI : on dose un composé ; NI : on répartit 100 % entre tous.</em></li>
        <li><strong>Dans les deux cas,</strong> la méthode vaut ce que valent ses hypothèses : on les écrit toujours avec le résultat.</li>
      </ul>
    </div>
  );
}
