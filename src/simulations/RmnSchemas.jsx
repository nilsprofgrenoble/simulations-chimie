// Schémas des cartes « À retenir » de la simulation 75 (RMN du proton). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const XD = d => 24 + (10 - d) * 25.6;   // δ de 10 (gauche) à 0 (droite)

export const FDeplacement = () => (
  <Svg h={174} aria="Axe d'un spectre de RMN du proton : le déplacement chimique delta en ppm décroît de la gauche vers la droite ; le TMS est à zéro ; un proton proche d'un atome électronégatif est déblindé et sort à gauche, à delta élevé ; un proton éloigné est blindé et sort à droite">
    <T x={10} y={14} c={ROUGE} w={800}>déblindé : δ grand</T><T x={290} y={14} a="end" c={BLEU} w={800}>blindé : δ petit</T>
    <Fleche x1={250} y1={30} x2={50} y2={30} c={GRIS} w={2}/>
    <Lg x1={14} y1={112} x2={290} y2={112} c={GRIS} w={2}/>
    {[10, 8, 6, 4, 2, 0].map(d => <g key={d}><Lg x1={XD(d)} y1={112} x2={XD(d)} y2={120} c={GRIS} w={1.6}/><T x={XD(d)} y={136} a="middle" c={GRIS}>{d}</T></g>)}
    <T x={150} y={158} a="middle" w={800}>δ (ppm)</T>
    <Lg x1={XD(3.6)} y1={112} x2={XD(3.6)} y2={52} c={ROUGE} w={3.4}/><T x={XD(3.6) + 2} y={46} a="middle" c={ROUGE} w={800}>près de O</T>
    <Lg x1={XD(1.0)} y1={112} x2={XD(1.0)} y2={76} c={BLEU} w={3.4}/><T x={XD(1.0)} y={70} a="middle" c={BLEU} w={800}>CH₃</T>
    <Lg x1={XD(0)} y1={112} x2={XD(0)} y2={86} c={ORANGE} w={3.4}/><T x={XD(0)} y={80} a="middle" c={ORANGE} w={800}>TMS</T>
  </Svg>);

export const FIntegration = () => (
  <Svg h={196} aria="Intégration : sous le spectre, la courbe d'intégration monte d'un palier à chaque signal ; la hauteur h du palier est proportionnelle au nombre de H du signal ; H est la hauteur totale ; le nombre de H d'un signal vaut N fois h sur H">
    <Lg x1={16} y1={84} x2={280} y2={84} c={GRIS} w={1.8}/>
    <Lg x1={66} y1={84} x2={66} y2={62} c={BLEU} w={3.4}/><Lg x1={200} y1={84} x2={200} y2={38} c={BLEU} w={3.4}/>
    <path d="M16,176 H58 V136 H74 H192 V76 H208 H270" fill="none" stroke={ROUGE} strokeWidth="2.8"/>
    <Lg x1={86} y1={176} x2={86} y2={136} c={ORANGE} w={2} d="3 3"/><T x={92} y={162} c={ORANGE} w={800}>h₁</T>
    <Lg x1={222} y1={136} x2={222} y2={76} c={ORANGE} w={2} d="3 3"/><T x={228} y={112} c={ORANGE} w={800}>h₂</T>
    <Lg x1={286} y1={76} x2={286} y2={176} c={ENCRE} w={1.8}/><Lg x1={280} y1={76} x2={292} y2={76} c={ENCRE} w={1.8}/><Lg x1={280} y1={176} x2={292} y2={176} c={ENCRE} w={1.8}/><T x={278} y={130} a="end" w={800}>H</T>
    <T x={150} y={14} a="middle" c={GRIS}>courbe d’intégration en rouge</T><T x={150} y={192} a="middle" w={800}>H = h₁ + h₂ : hauteur totale</T>
  </Svg>);

const PASCAL = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]], NOMS = ['singulet', 'doublet', 'triplet', 'quadruplet', 'quintuplet'];
export const FCouplage = () => (
  <Svg h={226} aria="Règle des n plus 1 : un groupe de protons ayant n voisins équivalents donne un multiplet de n plus 1 raies, dont les intensités suivent le triangle de Pascal : singulet 1, doublet 1 1, triplet 1 2 1, quadruplet 1 3 3 1, quintuplet 1 4 6 4 1">
    {PASCAL.map((row, n) => <g key={n}>
      <T x={8} y={38 + n * 38} w={800} c={n ? ENCRE : GRIS}>{`n = ${n}`}</T><T x={52} y={38 + n * 38} c={GRIS}>{NOMS[n]}</T>
      {row.map((v, i) => <Lg key={i} x1={218 + (i - (row.length - 1) / 2) * 16} y1={46 + n * 38} x2={218 + (i - (row.length - 1) / 2) * 16} y2={46 + n * 38 - v * 5 - 4} c={BLEU} w={4}/>)}</g>)}
    <T x={150} y={14} a="middle" w={800} c={ORANGE}>n voisins ⇒ n + 1 raies</T>
    <T x={150} y={218} a="middle" c={GRIS}>hauteurs : triangle de Pascal</T>
  </Svg>);

export const FChamp = () => (
  <Svg h={206} aria="Effet du champ : à 60 MHz, les multiplets sont larges en ppm et se chevauchent ; à 400 MHz, les mêmes multiplets sont étroits et bien séparés ; la constante de couplage J en hertz ne change pas">
    <T x={150} y={16} a="middle" c={ROUGE} w={800}>60 MHz : chevauchement</T>
    <Lg x1={14} y1={84} x2={286} y2={84} c={GRIS} w={1.6}/>
    {[[102, 20], [118, 40], [134, 20]].map(([x, h]) => <Lg key={x} x1={x} y1={84} x2={x} y2={84 - h} c={BLEU} w={3.6}/>)}
    {[[138, 16], [154, 44], [170, 44], [186, 16]].map(([x, h]) => <Lg key={x} x1={x} y1={84} x2={x} y2={84 - h} c={ORANGE} w={3.6}/>)}
    <T x={150} y={118} a="middle" c={VERT} w={800}>400 MHz : bien séparés</T>
    <Lg x1={14} y1={186} x2={286} y2={186} c={GRIS} w={1.6}/>
    {[[78, 22], [84, 44], [90, 22]].map(([x, h]) => <Lg key={x} x1={x} y1={186} x2={x} y2={186 - h} c={BLEU} w={3.6}/>)}
    {[[204, 18], [210, 46], [216, 46], [222, 18]].map(([x, h]) => <Lg key={x} x1={x} y1={186} x2={x} y2={186 - h} c={ORANGE} w={3.6}/>)}
    <T x={150} y={204} a="middle" c={GRIS}>J en Hz : inchangée</T>
  </Svg>);

const Lignes = ({ lignes, h, aria, bas }) => (
  <Svg h={h} aria={aria}>
    {lignes.map(([a, b], i) => <g key={a}>
      <rect x="10" y={8 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
      <circle cx="30" cy={27 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={32 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
      <T x={48} y={25 + i * 44} w={800}>{a}</T><T x={48} y={40 + i * 44} c={GRIS}>{b}</T></g>)}
    {bas && <T x={150} y={h - 6} a="middle" c={GRIS}>{bas}</T>}
  </Svg>);
export const FMethode = () => (
  <Lignes h={248} aria="Méthode d'analyse d'un spectre : compter les signaux, lire l'intégration, analyser la multiplicité, confirmer par les déplacements chimiques, puis proposer et vérifier la structure"
    lignes={[['Compter les signaux', 'un par groupe de H équivalents'], ['Intégration', 'nombre de H par signal'], ['Multiplicité', 'n voisins ⇒ n + 1 raies'], ['Déplacement chimique', 'tables : O, cycle, C=O'], ['Proposer la structure', 'puis vérifier signal par signal']]} bas="on vérifie chaque signal à la fin"/>);
export const FBilanRmn = () => (
  <Lignes h={248} aria="Bilan : un signal par groupe de H équivalents ; delta plus grand si le proton est déblindé ; nombre de H égal N fois h sur H ; n plus 1 raies avec J indépendante du champ ; les H labiles donnent un singulet qui disparaît avec D2O"
    lignes={[['Un signal par groupe', 'de H équivalents'], ['δ grand', 'proton déblindé, à gauche'], ['Nombre de H', 'N × h ÷ H (intégration)'], ['n + 1 raies', 'J en Hz, indépendante de B₀'], ['H labiles (OH, NH, COOH)', 'singulet ; D₂O les efface']]} bas="spectre = carte d’identité de la molécule"/>);
