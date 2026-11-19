// Cartes « À retenir » de la simulation 93 (régiosélectivité de l'addition de HBr).
// Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut ; schémas dans un cadre de 300 de large, textes ≥ 12,5.
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
const Noeud = ({ x, y, t, c = ENCRE, r = 13, fond = 'white' }) => <g><circle cx={x} cy={y} r={r} fill={fond} stroke={c} strokeWidth="2"/><text x={x} y={y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={c}>{t}</text></g>;

// 1. Deux voies : H d'un côté, charge + de l'autre
export function FicheDeuxVoies() {
  const rang = (y, hSur, plusSur, n) => <g>
    <T x={206} y={y - 18} c={GRIS} w={700}>voie {n}</T>
    <line x1="53" y1={y - 3} x2="87" y2={y - 3} stroke={ENCRE} strokeWidth="2"/><line x1="53" y1={y + 3} x2="87" y2={y + 3} stroke={ENCRE} strokeWidth="2"/>
    <line x1="113" y1={y} x2="147" y2={y} stroke={ENCRE} strokeWidth="2"/>
    <Noeud x={40} y={y} t="C1"/><Noeud x={100} y={y} t="C2"/><Noeud x={160} y={y} t="C3"/>
    <Arr x1={hSur === 1 ? 40 : 100} y1={y - 44} x2={hSur === 1 ? 40 : 100} y2={y - 16} c={ORANGE}/><T x={(hSur === 1 ? 40 : 100) + 8} y={y - 28} c={ORANGE} w={800}>H</T>
        <T x={206} y={y + 4} c={ROUGE} w={800}>charge + sur C{plusSur}</T>
  </g>;
  return (
    <div>
      <svg viewBox="0 0 300 178" style={svgStyle} role="img" aria-label="Propène : si H se fixe sur C1, la charge plus apparaît sur C2 ; si H se fixe sur C2, la charge plus apparaît sur C1">
        {rang(56, 1, 2, 1)}{rang(142, 2, 1, 2)}
      </svg>
      <ul style={liste}>
        <li><em>H se fixe sur un carbone de C=C ; la charge + apparaît sur l’autre.</em></li>
        <li><strong>Étape 1 :</strong> le doublet π attaque H. <strong>Étape 2 :</strong> Br⁻ se fixe sur le carbone chargé.</li>
        <li>Un alcène dissymétrique donne deux produits possibles ; si la réaction en favorise un, elle est <strong>régiosélective</strong>.</li>
      </ul>
    </div>
  );
}

// 2. Classe d'un carbocation : on compte les carbones voisins
export function FicheClasse() {
  const col = [[50, 'primaire', 1, [[0, 38]]], [150, 'secondaire', 2, [[-26, 36], [26, 36]]], [250, 'tertiaire', 3, [[-34, 32], [0, 42], [34, 32]]]];
  return (
    <div>
      <svg viewBox="0 0 300 160" style={svgStyle} role="img" aria-label="Classe d'un carbocation : primaire si le carbone chargé est lié à 1 carbone, secondaire à 2 carbones, tertiaire à 3 carbones">
        {col.map(([cx, nom, n, vois]) => <g key={nom}>
          {vois.map(([dx, dy], i) => <g key={i}><line x1={cx} y1={34} x2={cx + dx} y2={34 + dy} stroke={ENCRE} strokeWidth="2"/><Noeud x={cx + dx} y={34 + dy} t="C" r={11}/></g>)}
          <Noeud x={cx} y={34} t="C⁺" c={ROUGE} fond="#fee2e2" r={15}/>
          <T x={cx} y={112} a="middle" w={800} c={BLEU}>{nom}</T><T x={cx} y={130} a="middle" c={GRIS}>{n} carbone{n > 1 ? 's' : ''} lié{n > 1 ? 's' : ''}</T></g>)}
        <T x={150} y={148} a="middle" c={ORANGE} w={800}>on compte les C, pas les H</T>
      </svg>
      <ul style={liste}>
        <li><em>La classe = le nombre d’atomes de carbone directement liés au C⁺.</em></li>
        <li><strong>Exemple :</strong> R–CH₂⁺ est primaire (1 carbone), R₂CH⁺ secondaire (2), R₃C⁺ tertiaire (3).</li>
      </ul>
    </div>
  );
}

// 3. Stabilité : plus d'alkyles = plus stable = énergie plus basse
export function FicheStabilite() {
  const niv = [[50, 'primaire', ROUGE], [84, 'secondaire', ORANGE], [118, 'tertiaire', VERT]];
  return (
    <div>
      <svg viewBox="0 0 300 168" style={svgStyle} role="img" aria-label="Échelle d'énergie : le carbocation primaire est le plus haut en énergie donc le moins stable, le tertiaire est le plus bas donc le plus stable ; chaque groupe alkyle donne de la densité électronique au carbone chargé">
        <Arr x1={24} y1={150} x2={24} y2={20} c={GRIS} w={2.2}/><T x={34} y={18} c={GRIS}>énergie</T>
        {niv.map(([y, n, c]) => <g key={n}><line x1="44" y1={y} x2="150" y2={y} stroke={c} strokeWidth="4" strokeLinecap="round"/><T x={158} y={y + 4} c={c} w={800}>{n}</T></g>)}
        <T x={44} y={158} c={VERT} w={800}>le plus stable : énergie la plus basse</T>
      </svg>
      <Formule><mtext>tertiaire</mtext><mo>&gt;</mo><mtext>secondaire</mtext><mo>&gt;</mo><mtext>primaire</mtext><mspace width="1em"/><mtext>(stabilité)</mtext></Formule>
      <ul style={liste}>
        <li><em>Chaque groupe alkyle donne des électrons au C⁺ : la charge est « diluée ».</em></li>
        <li><strong>Piège :</strong> « plus stable » veut dire énergie plus <strong>basse</strong>, pas plus haute.</li>
      </ul>
    </div>
  );
}

// 4. Lire les barrières : Hammond
export function FicheBarrieres() {
  const prof = (pic, car, c, nom) => <g>
    <path d={`M20,140 C60,140 70,${pic} 100,${pic} C130,${pic} 140,${car} 190,${car}`} fill="none" stroke={c} strokeWidth="3"/>
    <T x={100} y={pic - 6} a="middle" c={c} w={800}>{nom}</T></g>;
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Deux profils d'énergie : la voie qui mène au carbocation le plus stable a un état de transition ET1 plus bas, donc une énergie d'activation plus faible et une vitesse plus grande">
        <line x1="14" y1="140" x2="280" y2="140" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 4"/><T x={20} y={156} c={GRIS}>réactifs</T>
        {prof(56, 88, ORANGE, 'ET₁ haut')}{prof(84, 114, VERT, '')}<T x={100} y={106} a="middle" c={VERT} w={800}>ET₁ bas</T>
        <T x={194} y={92} c={ORANGE} w={700}>C⁺ moins stable</T><T x={194} y={128} c={VERT} w={700}>C⁺ stable</T>
        <T x={150} y={172} a="middle" c={GRIS}>ET₁ ressemble au carbocation (Hammond)</T>
      </svg>
      <Formule><msub><mi>E</mi><mtext>a</mtext></msub><mo>=</mo><msub><mi>E</mi><mrow><mtext>ET</mtext><mn>1</mn></mrow></msub><mo>−</mo><mi>E</mi><mo>(</mo><mtext>réactifs</mtext><mo>)</mo></Formule>
      <ul style={liste}>
        <li><em>Carbocation plus stable ⇒ ET₁ plus bas ⇒ barrière plus petite ⇒ voie plus rapide.</em></li>
        <li><strong>Hypothèse de la simulation :</strong> E(ET₁) = E(carbocation) + 40 kJ·mol⁻¹ ; valeurs illustratives, seul le classement est à retenir.</li>
      </ul>
    </div>
  );
}

// 5. Produit majoritaire : contrôle cinétique et Markovnikov
export function FicheMajoritaire() {
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Exemple avec un écart de 5 kilojoules par mole entre les deux états de transition : la voie la plus rapide donne environ 88 pour cent du produit majoritaire et 12 pour cent du minoritaire ; règle de Markovnikov : H sur le carbone le plus hydrogéné, Br sur le plus substitué">
        <T x={150} y={16} a="middle" w={800}>exemple : ΔE(ET₁) = 5 kJ·mol⁻¹</T>
        <rect x="10" y="26" width="212" height="34" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/><rect x="222" y="26" width="68" height="34" fill="#e2e8f0" stroke={GRIS} strokeWidth="2"/>
        <T x={116} y={48} a="middle" c={VERT} w={800}>majoritaire ≈ 88 %</T><T x={256} y={48} a="middle" c={GRIS} w={700}>12 %</T>
        <T x={150} y={82} a="middle" c={GRIS}>minoritaire ne veut pas dire nul</T>
        <rect x="10" y="94" width="134" height="50" rx="6" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={77} y={114} a="middle" c={ORANGE} w={700}>H → C le plus</T><T x={77} y={132} a="middle" c={ORANGE} w={700}>hydrogéné</T>
        <rect x="156" y="94" width="134" height="50" rx="6" fill="#e8f1fa" stroke={BLEU} strokeWidth="2"/><T x={223} y={114} a="middle" c={BLEU} w={700}>Br → C le plus</T><T x={223} y={132} a="middle" c={BLEU} w={700}>substitué</T>
      </svg>
      <Formule><mfrac><msub><mi>v</mi><mn>1</mn></msub><msub><mi>v</mi><mn>2</mn></msub></mfrac><mo>=</mo><mi>exp</mi><mo>(</mo><mfrac><mrow><mi>Δ</mi><msub><mi>E</mi><mrow><mtext>ET</mtext><mn>1</mn></mrow></msub></mrow><mrow><mi>R</mi><mi>T</mi></mrow></mfrac><mo>)</mo></Formule>
      <ul style={liste}>
        <li><em>Contrôle cinétique : la voie la plus rapide donne le produit majoritaire.</em></li>
        <li><strong>Markovnikov</strong> n’est pas une loi indépendante : c’est la conséquence de la stabilité du carbocation.</li>
        <li>Calcul à T = 298 K : RT ≈ 2,48 kJ·mol⁻¹, donc v₁/v₂ = exp(5 / 2,48) ≈ 7,5.</li>
      </ul>
    </div>
  );
}

// 6. Méthode en quatre temps
export function FicheMethodeHBr() {
  const e = [['1. Écrire les deux C⁺', BLEU, '#e8f1fa'], ['2. Classer et comparer', BLEU, '#e8f1fa'], ['3. Le plus stable : ET₁ bas', ORANGE, '#ffedd5'], ['4. Br sur ce C⁺ : produit majoritaire', VERT, '#dcfce7']];
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Méthode en quatre étapes : écrire les deux carbocations, les classer et comparer leur stabilité, retenir le plus stable dont l'état de transition est le plus bas, placer Br sur ce carbocation pour obtenir le produit majoritaire">
        {e.map(([t, c, f], i) => <g key={t}><Case x={20} y={4 + 50 * i} w={260} h={34} c={c} fond={f}>{t}</Case>{i < 3 && <Arr x1={150} y1={40 + 50 * i} x2={150} y2={52 + 50 * i} w={2.4}/>}</g>)}
      </svg>
      <ul style={liste}>
        <li><em>Régiosélectif ne veut pas dire exclusif : on obtient des proportions.</em></li>
        <li><strong>Hypothèses :</strong> énergie du carbocation ne dépendant que de sa classe, T = 298 K, contrôle cinétique.</li>
        <li><strong>Pièges :</strong> compter des H au lieu des C ; confondre H sur le C le plus hydrogéné et charge + sur le C le plus substitué.</li>
      </ul>
    </div>
  );
}
