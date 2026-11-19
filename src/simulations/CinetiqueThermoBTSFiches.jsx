// Cartes « À retenir » de la simulation 94 (contrôle cinétique / thermodynamique, HBr + buta-1,3-diène).
// Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut.
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
const Noeud = ({ x, y, t, c = ENCRE, r = 13, fond = 'white' }) => <g><circle cx={x} cy={y} r={r} fill={fond} stroke={c} strokeWidth="2"/><text x={x} y={y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={c}>{t}</text></g>;

// 1. Carbocation allylique : deux formes limites
export function FicheAllylique() {
  const chaine = (cx, plus, dbl) => { const xs = [cx - 54, cx - 18, cx + 18, cx + 54], ys = [78, 56, 78, 56];
    return <g>
      {[0, 1, 2].map(i => <line key={i} x1={xs[i]} y1={ys[i]} x2={xs[i + 1]} y2={ys[i + 1]} stroke={ENCRE} strokeWidth="2.4"/>)}
      <line x1={xs[dbl[0] - 1] + 3} y1={ys[dbl[0] - 1] + 4} x2={xs[dbl[1] - 1] + 3} y2={ys[dbl[1] - 1] + 4} stroke={ENCRE} strokeWidth="2.4"/>
      {xs.map((x, i) => <Noeud key={i} x={x} y={ys[i]} t={`C${i + 1}`} r={12} c={i + 1 === plus ? ROUGE : ENCRE} fond={i + 1 === plus ? '#fee2e2' : 'white'}/>)}
      <T x={xs[plus - 1]} y={ys[plus - 1] - 20} a="middle" c={ROUGE} w={800}>+</T></g>; };
  return (
    <div>
      <svg viewBox="0 0 300 130" style={svgStyle} role="img" aria-label="Carbocation allylique : deux formes limites reliées par une double flèche, la charge plus est sur C2 dans l'une et sur C4 dans l'autre">
        {chaine(70, 2, [3, 4])}{chaine(230, 4, [2, 3])}
        <T x={150} y={72} a="middle" c={ORANGE} w={800}>↔</T>
        <T x={150} y={118} a="middle" c={ORANGE} w={800}>une seule entité, deux écritures</T>
      </svg>
      <ul style={liste}>
        <li><em>Diène conjugué : deux C=C séparées par une seule liaison simple. La charge + est délocalisée sur C2 et C4.</em></li>
        <li><strong>Deux sites d’attaque</strong> pour Br⁻, donc deux produits : addition 1,2 (3-bromobut-1-ène, Br sur C2) et addition 1,4 (1-bromobut-2-ène, Br sur C4).</li>
        <li><strong>Piège :</strong> ce n’est pas un équilibre entre deux molécules.</li>
      </ul>
    </div>
  );
}

// 2. Stabilité des produits
export function FicheStabiliteProduits() {
  return (
    <div>
      <svg viewBox="0 0 300 170" style={svgStyle} role="img" aria-label="Énergies des produits : le produit 1,4 à moins 67 kilojoules par mole est plus bas donc plus stable que le produit 1,2 à moins 60 ; la différence est de 7 kilojoules par mole">
        <Arr x1={24} y1={26} x2={24} y2={150} c={GRIS} w={2.2}/><T x={34} y={18} c={GRIS}>énergie</T>
        <line x1="14" y1="40" x2="270" y2="40" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 4"/><T x={206} y={36} c={GRIS}>réactifs (0)</T>
        <line x1="60" y1="88" x2="130" y2="88" stroke={ORANGE} strokeWidth="4" strokeLinecap="round"/><T x={95} y={78} a="middle" c={ORANGE} w={800}>1,2 : −60</T>
        <line x1="170" y1="112" x2="240" y2="112" stroke={VERT} strokeWidth="4" strokeLinecap="round"/><T x={205} y={134} a="middle" c={VERT} w={800}>1,4 : −67</T>
        <T x={150} y={162} a="middle" c={GRIS}>énergies en kJ·mol⁻¹</T>
      </svg>
      <ul style={liste}>
        <li><em>Le plus stable est celui d’énergie la plus basse : c’est le produit thermodynamique.</em></li>
        <li><strong>Pourquoi :</strong> une double liaison plus substituée est plus stable (1,4 : au milieu de la chaîne ; 1,2 : en bout de chaîne).</li>
        <li>Énergies de la simulation (réactifs : 0) : des ordres de grandeur.</li>
      </ul>
    </div>
  );
}

// 3. Produit cinétique : barrières depuis le carbocation
export function FicheCinetiqueBarrieres() {
  return (
    <div>
      <svg viewBox="0 0 300 170" style={svgStyle} role="img" aria-label="À partir du carbocation à 20 kilojoules par mole, deux barrières : vers le produit 1,2 le sommet est à 30, soit 10 de barrière ; vers le produit 1,4 le sommet est à 33, soit 13 de barrière ; la barrière la plus basse est la plus rapide">
        <path d="M16,104 C40,104 48,104 66,104" stroke={GRIS} strokeWidth="3" fill="none"/><T x={16} y={124} c={GRIS} w={700}>carbocation (20)</T>
        <path d="M66,104 C100,104 110,64 150,64 C190,64 200,150 262,150" fill="none" stroke={ORANGE} strokeWidth="3"/>
        <path d="M66,104 C96,104 106,52 150,52 C194,52 204,160 262,160" fill="none" stroke={BLEU} strokeWidth="3"/>
        <T x={8} y={22} c={BLEU} w={800}>ET₂ : 33 → Eₐ = 13</T>
        <T x={8} y={42} c={ORANGE} w={800}>ET₂ : 30 → Eₐ = 10</T>
        <T x={270} y={146} c={ORANGE} w={800}>1,2</T><T x={270} y={166} c={BLEU} w={800}>1,4</T>
      </svg>
      <Formule><msub><mi>E</mi><mtext>a</mtext></msub><mo>=</mo><mi>E</mi><mo>(</mo><mtext>ET₂</mtext><mo>)</mo><mo>−</mo><mi>E</mi><mo>(</mo><mtext>carbocation</mtext><mo>)</mo></Formule>
      <ul style={liste}>
        <li><em>Barrière la plus basse = formation la plus rapide : produit cinétique.</em></li>
        <li><strong>Attention :</strong> le plus rapide (1,2) n’est pas le plus stable (1,4). Eₐ se compte depuis le carbocation, pas depuis les réactifs.</li>
      </ul>
    </div>
  );
}

// 4. Contrôle cinétique : conditions et composition
export function FicheCinetique() {
  return (
    <div>
      <svg viewBox="0 0 300 140" style={svgStyle} role="img" aria-label="Contrôle cinétique à 0 degré Celsius et pendant 10 secondes : réaction irréversible, composition environ 79 pour cent de produit 1,2 et 21 pour cent de produit 1,4">
        <T x={150} y={16} a="middle" w={800}>0 °C · temps court (10 s) · irréversible</T>
        <rect x="10" y="28" width="233" height="34" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><rect x="243" y="28" width="47" height="34" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/>
        <T x={126} y={50} a="middle" c={ORANGE} w={800}>1,2 ≈ 79 %</T><T x={266} y={50} a="middle" c={BLEU} w={700}>21</T>
        <T x={10} y={97} c={GRIS} w={700}>carbocation</T><Arr x1={88} y1={92} x2={136} y2={92} c={GRIS}/>
        <T x={144} y={97} c={ORANGE} w={800}>1,2 ✓</T><T x={196} y={97} c={GRIS} w={700}>pas de retour</T>
        <T x={150} y={128} a="middle" c={GRIS}>la composition reflète les vitesses de formation</T>
      </svg>
      <Formule><mfrac><mrow><mo>[</mo><mn>1,2</mn><mo>]</mo></mrow><mrow><mo>[</mo><mn>1,4</mn><mo>]</mo></mrow></mfrac><mo>=</mo><mfrac><msub><mi>k</mi><mrow><mn>2</mn><mtext>a</mtext></mrow></msub><msub><mi>k</mi><mrow><mn>2</mn><mtext>b</mtext></mrow></msub></mfrac><mo>≈</mo><mn>3,7</mn></Formule>
      <ul style={liste}>
        <li><em>Basse température, temps court : les produits n’ont pas assez d’énergie pour revenir au carbocation.</em></li>
        <li><strong>Calcul :</strong> exp(3 / (RT)) avec RT ≈ 2,27 kJ·mol⁻¹ à 273 K (3 = 13 − 10, en kJ·mol⁻¹).</li>
      </ul>
    </div>
  );
}

// 5. Contrôle thermodynamique : équilibre
export function FicheThermo() {
  return (
    <div>
      <svg viewBox="0 0 300 140" style={svgStyle} role="img" aria-label="Contrôle thermodynamique à 40 degrés Celsius pendant plusieurs heures : réaction réversible, équilibre, environ 94 pour cent de produit 1,4 et 6 pour cent de produit 1,2">
        <T x={150} y={16} a="middle" w={800}>40 °C · temps long (3 h) · réversible</T>
        <rect x="10" y="28" width="30" height="34" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><rect x="40" y="28" width="250" height="34" fill="#bbf7d0" stroke={VERT} strokeWidth="2"/>
        <T x={25} y={50} a="middle" c={ORANGE} w={700}>6</T><T x={165} y={50} a="middle" c={VERT} w={800}>1,4 ≈ 94 %</T>
        <T x={150} y={90} a="middle" c={GRIS} w={800}>1,2 ⇄ carbocation ⇄ 1,4</T>
        <T x={150} y={112} a="middle" c={ORANGE} w={700}>les produits franchissent la barrière inverse</T>
        <T x={150} y={132} a="middle" c={GRIS}>le plus stable finit par dominer</T>
      </svg>
      <Formule><mfrac><mrow><mo>[</mo><mn>1,4</mn><mo>]</mo></mrow><mrow><mo>[</mo><mn>1,2</mn><mo>]</mo></mrow></mfrac><mo>=</mo><mi>exp</mi><mo>(</mo><mfrac><mrow><mi>Δ</mi><mi>E</mi></mrow><mrow><mi>R</mi><mi>T</mi></mrow></mfrac><mo>)</mo><mo>≈</mo><mn>15</mn></Formule>
      <ul style={liste}>
        <li><em>Température plus élevée, temps long : l’équilibre est atteint, la stabilité décide.</em></li>
        <li><strong>Barrière inverse</strong> = E(ET₂) − E(produit) : on part du produit, pas du carbocation.</li>
        <li><strong>Calcul :</strong> ΔE = 7 kJ·mol⁻¹ à 313 K : exp(7 / 2,60) ≈ 15, soit 15 / 16 ≈ 94 %. <strong>Hypothèse :</strong> même facteur A pour toutes les étapes.</li>
      </ul>
    </div>
  );
}

// 6. Bilan : cinétique ou thermodynamique
export function FicheComparaison() {
  const lig = [['conditions', 'basse T, court', 'T plus haute, long'], ['réaction', 'irréversible', 'réversible'], ['décide', 'vitesses (Eₐ basse)', 'stabilité (E basse)'], ['produit', '1,2 (≈ 79 %)', '1,4 (≈ 94 %)']];
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Comparaison : contrôle cinétique (basse température, temps court, irréversible, vitesses, produit 1,2) et contrôle thermodynamique (température plus haute, temps long, réversible, stabilité, produit 1,4)">
        <rect x="66" y="4" width="110" height="28" rx="6" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={121} y={23} a="middle" c={ORANGE} w={800}>cinétique</T>
        <rect x="180" y="4" width="116" height="28" rx="6" fill="#dcfce7" stroke={VERT} strokeWidth="2"/><T x={238} y={23} a="middle" c={VERT} w={800}>thermodynamique</T>
        {lig.map(([a, b, c], i) => { const y = 38 + 36 * i; return <g key={a}><rect x="4" y={y} width="292" height="32" rx="5" fill={i % 2 ? '#f1f5f9' : '#e8f1fa'}/>
          <T x={10} y={y + 20} c={GRIS} w={700}>{a}</T><T x={121} y={y + 20} a="middle" c={ORANGE} w={700}>{b}</T><T x={238} y={y + 20} a="middle" c={VERT} w={700}>{c}</T></g>; })}
      </svg>
      <ul style={liste}>
        <li><em>Rapide ≠ stable : le produit majoritaire dépend des conditions.</em></li>
        <li><strong>Lois :</strong> k = A·exp(−Eₐ / RT) pour les vitesses ; K = exp(ΔE / RT) pour l’équilibre.</li>
        <li><strong>Piège :</strong> croire que le majoritaire est toujours le plus stable.</li>
      </ul>
    </div>
  );
}
