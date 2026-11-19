// Cartes « À retenir » de la simulation 89 (machines thermiques : PAC, groupe froid, COP).
// Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut ; exemples : PAC du bassin (W = 2,0 kW, COP = 8,3).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', VIOLET = '#7e22ce', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
const Case = ({ x, y, w = 84, h = 38, children, c = BLEU, fond = '#e8f1fa' }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill={fond} stroke={c} strokeWidth="2"/><text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={c}>{children}</text></g>;

// D. Second principe : sens spontané et travail
export function FicheSensSpontane() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Le transfert thermique spontané va de la source chaude vers la source froide ; pour aller de la source froide vers la source chaude, la machine doit recevoir un travail">
        <Case x={10} y={8} w={130} h={34} c={ROUGE} fond="#fee2e2">source chaude</Case><Case x={160} y={8} w={130} h={34}>source froide</Case>
        <Arr x1={142} y1={25} x2={158} y2={25} c={VERT}/>
        <T x={150} y={64} a="middle" c={VERT} w={800}>spontané : chaud → froid</T>
        <Case x={10} y={96} w={130} h={34} c={ROUGE} fond="#fee2e2">source chaude</Case><Case x={160} y={96} w={130} h={34}>source froide</Case>
        <Arr x1={158} y1={113} x2={142} y2={113} c={ORANGE}/>
        <T x={150} y={152} a="middle" c={ORANGE} w={800}>contre-sens : il faut un travail W</T>
        <T x={150} y={170} a="middle" c={GRIS}>(2ᵉ principe de la thermodynamique)</T>
      </svg>
      <ul style={liste}>
        <li><em>Sans aide, l’énergie thermique ne remonte jamais du froid vers le chaud.</em></li>
        <li><strong>Une PAC</strong> le fait grâce au travail électrique W fourni au compresseur.</li>
        <li><strong>Sources :</strong> la plus chaude est la « source chaude », ici l’eau du bassin ; l’air extérieur est la source froide.</li>
      </ul>
    </div>
  );
}

// A. Le circuit en quatre organes
export function FicheCircuit() {
  return (
    <div>
      <svg viewBox="0 0 300 184" style={svgStyle} role="img" aria-label="Circuit fermé : l'évaporateur côté source froide où le fluide s'évapore, le compresseur qui élève pression et température, le condenseur côté source chaude où le fluide se condense, le détendeur qui abaisse pression et température">
        <Case x={100} y={6} w={100} h={34} c={VIOLET} fond="#f3e8ff">compresseur</Case>
        <g><rect x="196" y="70" width="98" height="46" rx="6" fill="#fee2e2" stroke={ROUGE} strokeWidth="2"/><T x={245} y={89} a="middle" c={ROUGE} w={700}>condenseur</T><T x={245} y={107} a="middle" c={ROUGE} w={700}>→ liquide</T></g>
        <Case x={100} y={140} w={100} h={34} c={BLEU}>détendeur</Case>
        <g><rect x="6" y="70" width="98" height="46" rx="6" fill="#e8f1fa" stroke={BLEU} strokeWidth="2"/><T x={55} y={89} a="middle" c={BLEU} w={700}>évaporateur</T><T x={55} y={107} a="middle" c={BLEU} w={700}>→ vapeur</T></g>
        <Arr x1={70} y1={68} x2={110} y2={42} c={GRIS}/><Arr x1={190} y1={42} x2={236} y2={72} c={GRIS}/><Arr x1={236} y1={118} x2={190} y2={142} c={GRIS}/><Arr x1={108} y1={142} x2={70} y2={118} c={GRIS}/>
                <T x={150} y={90} a="middle" c={GRIS}>boucle</T><T x={150} y={106} a="middle" c={GRIS}>fermée</T>
      </svg>
      <ul style={liste}>
        <li><em>Le fluide capte l’énergie à l’évaporateur et la cède au condenseur ; il revient à son état initial à chaque tour.</em></li>
        <li><strong>Compresseur :</strong> reçoit W ; pression et température augmentent, sans transfert thermique pendant la compression rapide.</li>
        <li><strong>Détendeur :</strong> pression et température chutent ; le liquide peut de nouveau s’évaporer.</li>
      </ul>
    </div>
  );
}

// B. Bilan d'un cycle
export function FicheBilanCycle() {
  return (
    <div>
      <svg viewBox="0 0 300 160" style={svgStyle} role="img" aria-label="Machine réceptrice : elle reçoit le travail W et l'énergie Qf de la source froide, et cède Qc à la source chaude">
        <circle cx="46" cy="92" r="40" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><T x={46} y={89} a="middle" c={BLEU} w={800}>source</T><T x={46} y={105} a="middle" c={BLEU} w={800}>froide</T>
        <circle cx="254" cy="92" r="40" fill="#fee2e2" stroke={ROUGE} strokeWidth="2"/><T x={254} y={89} a="middle" c={ROUGE} w={800}>source</T><T x={254} y={105} a="middle" c={ROUGE} w={800}>chaude</T>
        <rect x="108" y="64" width="84" height="56" rx="10" fill="#dcfce7" stroke={VERT} strokeWidth="2"/><T x={150} y={88} a="middle" c={VERT} w={800}>machine</T><T x={150} y={106} a="middle" c={VERT} w={800}>réceptrice</T>
        <Arr x1={88} y1={92} x2={106} y2={92} c={BLEU} w={4}/><Arr x1={194} y1={92} x2={212} y2={92} c={ROUGE} w={4}/><Arr x1={150} y1={8} x2={150} y2={62} c={VIOLET} w={4}/>
        <T x={96} y={82} a="middle" c={BLEU} w={800}>Qf</T><T x={204} y={82} a="middle" c={ROUGE} w={800}>Qc</T><T x={162} y={34} c={VIOLET} w={800}>W</T>
        <T x={150} y={152} a="middle" c={GRIS}>l’énergie va du froid vers le chaud, grâce à W</T>
      </svg>
      <Formule><msub><mi>Q</mi><mi>c</mi></msub><mo>=</mo><msub><mi>Q</mi><mi>f</mi></msub><mo>+</mo><mi>W</mi></Formule>
      <ul style={liste}>
        <li><em>Sur un cycle, le fluide revient à son état initial : ΔU = 0. Ce qui est cédé au chaud vient du froid et du compresseur.</em></li>
        <li><strong>Premier principe :</strong> W + Q<sub>c</sub> + Q<sub>f</sub> = 0 (valeurs algébriques) ; mêmes relations pour les puissances, en kW.</li>
      </ul>
    </div>
  );
}

// C. Convention de signes
export function FicheSignes() {
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Convention du système : ce que le fluide reçoit est positif, ce qu'il cède est négatif ; le fluide reçoit W et Qf, il cède Qc">
        <rect x="100" y="48" width="100" height="56" rx="10" fill="#e8f1fa" stroke={BLEU} strokeWidth="2"/><T x={150} y={72} a="middle" c={BLEU} w={800}>fluide</T><T x={150} y={90} a="middle" c={BLEU} w={800}>frigorigène</T>
        <Arr x1={150} y1={8} x2={150} y2={46} c={VIOLET} w={3.4}/><T x={160} y={30} c={VIOLET} w={800}>W &gt; 0 (reçu)</T>
        <Arr x1={14} y1={76} x2={98} y2={76} c={BLUE_OK} w={3.4}/><T x={14} y={66} c={BLUE_OK} w={800}>Qf &gt; 0 (reçu)</T>
        <Arr x1={202} y1={76} x2={286} y2={76} c={ROUGE} w={3.4}/><T x={286} y={66} a="end" c={ROUGE} w={800}>Qc &lt; 0 (cédé)</T>
        <T x={150} y={136} a="middle" c={GRIS}>reçu : positif ; cédé : négatif</T>
      </svg>
      <ul style={liste}>
        <li><em>Sur le schéma, les flèches portent des valeurs positives ; dans le bilan, on applique la convention du système.</em></li>
        <li><strong>PAC et groupe froid :</strong> W &gt; 0, Q<sub>f</sub> &gt; 0 et Q<sub>c</sub> &lt; 0 ; la somme W + Q<sub>f</sub> + Q<sub>c</sub> reste nulle sur un cycle.</li>
      </ul>
    </div>
  );
}
const BLUE_OK = BLEU;

// E. Les deux COP
export function FicheCOP() {
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Le COP compare l'énergie utile à l'énergie payée : pour une pompe à chaleur l'énergie utile est Qc, pour un groupe froid c'est Qf ; l'énergie payée est le travail électrique W">
        <Case x={8} y={8} w={136} h={34} c={ROUGE} fond="#fee2e2">PAC : utile = Qc</Case><Case x={156} y={8} w={136} h={34}>froid : utile = Qf</Case>
        <T x={76} y={70} a="middle" c={ROUGE} w={800}>COP = Qc / W</T><T x={224} y={70} a="middle" c={BLEU} w={800}>COP = Qf / W</T>
        <Arr x1={150} y1={90} x2={150} y2={112} c={VIOLET}/><T x={150} y={128} a="middle" c={VIOLET} w={800}>W : l’électricité payée</T>
        <T x={150} y={146} a="middle" c={GRIS}>pas d’unité</T>
      </svg>
      <Formule><msub><mi>Q</mi><mtext>utile</mtext></msub><mo>=</mo><mi>COP</mi><mo>×</mo><msub><mi>W</mi><mtext>élec</mtext></msub></Formule>
      <ul style={liste}>
        <li><em>Même circuit, même compresseur : seule change l’énergie utile.</em></li>
        <li><strong>COP d’une PAC &gt; 1</strong> : l’énergie en plus vient de la source froide, ce n’est pas un rendement supérieur à 100 %.</li>
        <li><strong>Piège :</strong> on multiplie par le COP, on ne divise pas.</li>
      </ul>
    </div>
  );
}

// F. L'écart de température commande le COP
export function FicheEcart() {
  const pts = []; for (let tf = 1; tf <= 19; tf += 2) pts.push(`${40 + tf * 12},${(130 - 300 / (22 - tf + 4)).toFixed(1)}`);
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Courbe : à température de source chaude fixée, le COP augmente quand la température de la source froide se rapproche de celle de la source chaude, donc quand l'écart diminue">
        <polyline points="40,16 40,130 280,130" fill="none" stroke={GRIS} strokeWidth="2"/>
        <T x={46} y={14} c={GRIS}>COP</T><T x={280} y={150} a="end" c={GRIS}>T froide →</T>
        <polyline points={pts.join(' ')} fill="none" stroke={ORANGE} strokeWidth="3.2"/>
        <line x1="268" y1="22" x2="268" y2="130" stroke={ROUGE} strokeWidth="1.8" strokeDasharray="4 4"/><T x={264} y={34} a="end" c={ROUGE} w={800}>T chaude</T>
        <Arr x1={80} y1={160} x2={250} y2={160} c={GRIS} w={2}/><T x={160} y={182} a="middle" c={GRIS}>l’écart diminue</T>
      </svg>
      <ul style={liste}>
        <li><em>Plus la source froide est proche de la source chaude, plus le COP est élevé.</em></li>
        <li><strong>Conséquence :</strong> une PAC est très performante par temps doux et « décroche » quand il gèle.</li>
      </ul>
    </div>
  );
}

// G. Limite théorique en kelvins
export function FicheLimite() {
  return (
    <div>
      <svg viewBox="0 0 300 124" style={svgStyle} role="img" aria-label="Pour calculer la limite théorique il faut convertir les températures en kelvins : T en kelvins égale T en degrés Celsius plus 273,15 ; exemple 22 degrés Celsius font 295,15 kelvins et 7 degrés Celsius font 280,15 kelvins ; l'écart est le même, 15">
        <Case x={8} y={8} w={118} h={34} c={ORANGE} fond="#ffedd5">22 °C</Case><Arr x1={130} y1={25} x2={168} y2={25}/><Case x={174} y={8} w={118} h={34} c={VERT} fond="#dcfce7">295,15 K</Case>
        <Case x={8} y={52} w={118} h={34} c={ORANGE} fond="#ffedd5">7 °C</Case><Arr x1={130} y1={69} x2={168} y2={69}/><Case x={174} y={52} w={118} h={34} c={VERT} fond="#dcfce7">280,15 K</Case>
        <T x={150} y={106} a="middle" c={GRIS} w={700}>+ 273,15 · l’écart reste 15 (K ou °C)</T>
      </svg>
      <Formule><msub><mi>COP</mi><mtext>max, PAC</mtext></msub><mo>=</mo><mfrac><msub><mi>T</mi><mi>c</mi></msub><mrow><msub><mi>T</mi><mi>c</mi></msub><mo>−</mo><msub><mi>T</mi><mi>f</mi></msub></mrow></mfrac></Formule>
      <ul style={liste}>
        <li><em>Pour un groupe froid, on met T<sub>f</sub> au numérateur à la place de T<sub>c</sub>.</em></li>
        <li><strong>Méthode :</strong> ① convertir en kelvins, ② calculer l’écart, ③ diviser.</li>
        <li><strong>Piège :</strong> des °C dans la formule donnent un résultat faux.</li>
      </ul>
    </div>
  );
}

// H. COP réel sous le plafond théorique
export function FichePlafond() {
  return (
    <div>
      <svg viewBox="0 0 300 120" style={svgStyle} role="img" aria-label="Pour la PAC du bassin, le COP réel de 8,3 représente 42 pour cent de la limite théorique de 19,7 : la limite est un plafond que la machine réelle n'atteint pas">
        <T x={10} y={16} w={800} c={VERT}>limite théorique ≈ 19,7</T>
        <rect x="10" y="24" width="280" height="30" fill="#dcfce7" stroke={VERT} strokeWidth="2"/>
        <T x={10} y={78} w={800} c={ORANGE}>COP réel ≈ 8,3</T>
        <rect x="10" y="86" width="118" height="30" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={69} y={106} a="middle" c={ORANGE} w={800}>42 %</T>
        <line x1="290" y1="20" x2="290" y2="120" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 4"/><T x={286} y={78} a="end" c={GRIS}>plafond</T>
      </svg>
      <ul style={liste}>
        <li><em>Le COP réel reste strictement inférieur à la limite : frottements, pertes thermiques, compresseur imparfait.</em></li>
        <li><strong>Hypothèse du modèle :</strong> rendement global constant, 42 % de la limite pour la PAC et 30 % pour le groupe froid (en réalité, il varie).</li>
      </ul>
    </div>
  );
}

// I. Méthode : de W au COP
export function FicheMethodeCOP() {
  const e = [['1. Repérer l’énergie utile', BLEU, '#e8f1fa'], ['2. Qutile = COP × W', ORANGE, '#ffedd5'], ['3. Autre transfert : Qc = Qf + W', VIOLET, '#f3e8ff'], ['4. Juger : COP < limite (en K)', VERT, '#dcfce7']];
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Méthode en quatre étapes : repérer l'énergie utile, calculer l'énergie utile par le COP et le travail, trouver l'autre transfert par le bilan, juger la machine en comparant à la limite théorique en kelvins">
        {e.map(([t, c, f], i) => <g key={t}><Case x={14} y={4 + 50 * i} w={272} h={34} c={c} fond={f}>{t}</Case>{i < 3 && <Arr x1={150} y1={40 + 50 * i} x2={150} y2={52 + 50 * i} w={2.4}/>}</g>)}
      </svg>
      <ul style={liste}>
        <li><strong>Exemple, PAC du bassin :</strong> W = 2,0 kW et COP = 8,3 donnent Q<sub>c</sub> = 16,6 kW, puis Q<sub>f</sub> = 16,6 − 2,0 = 14,6 kW.</li>
        <li><strong>Pièges :</strong> des °C dans la limite ; confondre COP réel et limite ; oublier W dans le bilan ; diviser au lieu de multiplier.</li>
      </ul>
    </div>
  );
}
