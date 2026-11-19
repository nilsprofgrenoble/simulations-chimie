// Cartes « À retenir » de la simulation « Point de fonctionnement d'une régulation P » (sim 6, TSTL).
// Chaque carte est posée UNE ÉTAPE (ou plus) APRÈS la question qu'elle conclut ; exemples différents de ceux demandés.
// Vocabulaire du programme : grandeurs réglée / réglante / perturbatrice, caractéristique statique, point de fonctionnement, écart statique.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320.

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const L2 = ({ x1, y1, x2, y2, c = ENCRE, w = 2.4, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}/>;
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Fl = ({ x, y, dir, c = ENCRE }) => { // pointe de flèche : d droite, g gauche, h haut, b bas
  const p = { d: `${x + 7},${y} ${x - 5},${y - 6} ${x - 5},${y + 6}`, g: `${x - 7},${y} ${x + 5},${y - 6} ${x + 5},${y + 6}`, h: `${x},${y - 7} ${x - 6},${y + 5} ${x + 6},${y + 5}`, b: `${x},${y + 7} ${x - 6},${y - 5} ${x + 6},${y - 5}` }[dir];
  return <polygon points={p} fill={c}/>;
};
const Case = ({ y, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="42" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <text x="150" y={y + 18} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    <text x="150" y={y + 34} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>
  </g>
);
const Bas = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 8} stroke={GRIS} strokeWidth="2.5"/><polygon points={`150,${y + 12} 145,${y + 5} 155,${y + 5}`} fill={GRIS}/></g>;
const Boite = ({ x, y, w, h = 34, t, c = ENCRE }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill="#fff" stroke={c} strokeWidth="2.4"/><text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t}</text></g>;

// Repère commun aux graphiques : H de hMin à hMax (m), débit Q de 0 à 100 m³/h
const rep = (hMin, hMax) => ({ x0: 46, y0: 124, w: 236, h: 100, X: H => 46 + (H - hMin) / (hMax - hMin) * 236, Y: q => 124 - q / 100 * 100 });
const AxesPF = ({ R, ticks }) => (
  <g>
    <L2 x1={R.x0} y1={R.y0} x2={R.x0 + R.w + 8} y2={R.y0} w="2"/><L2 x1={R.x0} y1={R.y0} x2={R.x0} y2={R.y0 - R.h - 6} w="2"/>
    {ticks.map(H => <g key={H}><L2 x1={R.X(H)} y1={R.y0} x2={R.X(H)} y2={R.y0 + 5} w="2"/><T x={R.X(H)} y={R.y0 + 19} a="middle">{H}</T></g>)}
    {[0, 50, 100].map(q => <g key={q}><L2 x1={R.x0 - 5} y1={R.Y(q)} x2={R.x0} y2={R.Y(q)} w="2"/><T x={R.x0 - 8} y={R.Y(q) + 4} a="end">{q}</T></g>)}
    <T x={R.x0 + R.w + 8} y={R.y0 + 36} a="end" w={700}>H (m)</T>
    <T x={R.x0 - 36} y={R.y0 - R.h - 14} w={700}>débit Q (m³/h)</T>
  </g>
);

// ── Carte A : la boucle de régulation ──
export function FicheBoucle() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Boucle de régulation du château d’eau : le régulateur commande la pompe qui remplit le réservoir ; un capteur mesure la hauteur d’eau et la renvoie au régulateur ; les abonnés puisent de l’eau, c’est la perturbation. Grandeur réglée : la hauteur H ; grandeur réglante : le débit de la pompe ; perturbation : le débit de puisage">
        <T x={50} y={16} a="middle" c={VERT} w={800}>consigne</T>
        <L2 x1="50" y1="22" x2="50" y2="42" c={VERT}/><Fl x={50} y={44} dir="b" c={VERT}/>
        <Boite x={8} y={50} w={84} t="Régulateur"/>
        <L2 x1="92" y1="67" x2="106" y2="67"/><Fl x={108} y={67} dir="d"/>
        <Boite x={110} y={50} w={62} t="Pompe" c={ORANGE}/>
        <L2 x1="172" y1="67" x2="186" y2="67" c={ORANGE}/><Fl x={188} y={67} dir="d" c={ORANGE}/>
        <Boite x={190} y={50} w={82} t="Réservoir" c={BLEU}/>
        <T x={231} y={16} a="middle" c={ROUGE} w={800}>puisage</T>
        <L2 x1="231" y1="22" x2="231" y2="42" c={ROUGE}/><Fl x={231} y={44} dir="b" c={ROUGE}/>
        <L2 x1="272" y1="67" x2="290" y2="67" c={BLEU}/><Fl x={292} y={67} dir="d" c={BLEU}/>
        <polyline points="231,84 231,108 50,108 50,90" fill="none" stroke={GRIS} strokeWidth="2.4"/><Fl x={50} y={86} dir="h" c={GRIS}/>
        <T x={140} y={124} a="middle" c={GRIS}>capteur : mesure de la hauteur H</T>
        <T x={10} y={150} c={BLEU} w={800}>réglée : la hauteur d’eau H</T>
        <T x={10} y={168} c={ORANGE} w={800}>réglante : le débit de la pompe</T>
        <T x={10} y={186} c={ROUGE} w={800}>perturbation : le débit de puisage</T>
      </svg>
      <ul style={liste}>
        <li><em>La régulation compare la mesure à la consigne, puis agit sur la grandeur réglante.</em></li>
        <li>La <strong>perturbation</strong> vient de l’extérieur : le régulateur ne la décide pas, il doit la compenser.</li>
      </ul>
    </div>
  );
}

// ── Carte B : le régulateur proportionnel (caractéristique statique du régulateur) ──
export function FicheRegP() {
  const R = rep(31, 35), Kp = 50, c = 34;
  const q = H => Math.max(0, Math.min(100, Kp * (c - H)));
  const pts = []; for (let H = 31; H <= 35.001; H += 0.1) pts.push(`${R.X(H).toFixed(1)},${R.Y(q(H)).toFixed(1)}`);
  return (
    <div>
      <svg viewBox="0 -4 300 176" style={svgStyle} role="img" aria-label="Caractéristique statique d’un régulateur proportionnel : le débit demandé à la pompe est proportionnel à l’écart entre la consigne et la hauteur d’eau, limité à 100 pour cent par le plafond de la pompe ; plus le niveau est bas, plus le régulateur demande de débit">
        <AxesPF R={R} ticks={[31, 33, 35]}/>
        <polyline points={pts.join(' ')} fill="none" stroke={VERT} strokeWidth="3.4" strokeLinejoin="round"/>
        <L2 x1={R.X(c)} y1={R.y0} x2={R.X(c)} y2={R.y0 - R.h} c={BLEU} w="2" dash="5 4"/>
        <T x={R.X(c) + 5} y={R.Y(78)} c={BLEU} w={800}>consigne</T>
        <T x={R.X(c) + 5} y={R.Y(78) + 15} c={BLEU} w={800}>34 m</T>
        <T x={R.X(31) + 6} y={R.Y(100) + 16} c={ORANGE} w={800}>à fond</T>
        <T x={R.X(31) + 6} y={R.Y(30)} c={VERT} w={800}>régulateur P</T>
      </svg>
      <ul style={liste}>
        <li><em>Plus le niveau est sous la consigne, plus le régulateur demande de débit à la pompe.</em></li>
        <li>Commande : <strong>Y = K<sub>p</sub> × (consigne − H)</strong>, entre 0 et 100 %. Débit : Q = Q<sub>max</sub> × Y / 100.</li>
        <li><strong>Exemple</strong> (consigne 34 m, K<sub>p</sub> = 50 %/m, Q<sub>max</sub> = 100 m³/h) : H = 32,8 m → écart 1,2 m → Y = 60 % → Q = 60 m³/h.</li>
      </ul>
    </div>
  );
}

// ── Carte C : point de fonctionnement et écart statique ──
export function FichePoint() {
  const R = rep(31, 35), Kp = 50, c = 34, Qp = 30;
  const q = H => Math.max(0, Math.min(100, Kp * (c - H)));
  const pts = []; for (let H = 31; H <= 35.001; H += 0.1) pts.push(`${R.X(H).toFixed(1)},${R.Y(q(H)).toFixed(1)}`);
  const Hp = c - Qp / Kp;
  return (
    <div>
      <svg viewBox="0 -4 300 176" style={svgStyle} role="img" aria-label="Le point de fonctionnement est l’intersection de la caractéristique du régulateur et de la droite du débit de puisage ; son abscisse est la hauteur d’eau d’équilibre ; l’écart statique est la distance entre cette hauteur et la consigne">
        <AxesPF R={R} ticks={[31, 33, 35]}/>
        <polyline points={pts.join(' ')} fill="none" stroke={VERT} strokeWidth="3.4" strokeLinejoin="round"/>
        <L2 x1={R.x0} y1={R.Y(Qp)} x2={R.x0 + R.w} y2={R.Y(Qp)} c={ROUGE} w="3"/>
        <T x={R.X(31.1)} y={R.Y(Qp) - 7} c={ROUGE} w={800}>puisage 30 m³/h</T>
        <L2 x1={R.X(Hp)} y1={R.Y(Qp)} x2={R.X(Hp)} y2={R.y0} c={ORANGE} w="2" dash="4 4"/>
        <circle cx={R.X(Hp)} cy={R.Y(Qp)} r="5.5" fill={ORANGE}/>
        <L2 x1={R.X(c)} y1={R.y0} x2={R.X(c)} y2={R.y0 - 40} c={BLEU} w="2" dash="5 4"/>
        <T x={R.X(c) + 5} y={R.y0 - 44} c={BLEU} w={800}>consigne</T>
        <L2 x1={R.X(Hp)} y1={R.y0 - 14} x2={R.X(c)} y2={R.y0 - 14} c={ORANGE} w="2.4"/>
        <T x={R.X(Hp) - 8} y={R.Y(Qp) + 18} a="end" c={ORANGE} w={800}>point de fonct.</T>
        <T x={R.X(c) + 5} y={R.y0 - 18} c={ORANGE} w={800}>ES</T>
      </svg>
      <ul style={liste}>
        <li><em>À l’équilibre, la pompe fournit exactement ce que les abonnés puisent : le niveau se lit à l’intersection.</em></li>
        <li><strong>Exemple</strong> (consigne 34 m, K<sub>p</sub> = 50 %/m, Q<sub>max</sub> = 100 m³/h, puisage 30 m³/h) : Y = 30 %, ES = Y / K<sub>p</sub> = 0,6 m, H = 34 − 0,6 = <strong>33,4 m</strong>.</li>
        <li>Écart statique : <strong>ES = consigne − H</strong>, la distance entre le niveau d’équilibre et la consigne.</li>
      </ul>
    </div>
  );
}

// ── Carte D : effet du gain sur l'écart statique ──
export function FicheGain() {
  const R = rep(30, 35), c = 34, Qp = 40;
  const droite = Kp => { const pts = []; for (let H = 30; H <= 35.001; H += 0.1) pts.push(`${R.X(H).toFixed(1)},${R.Y(Math.max(0, Math.min(100, Kp * (c - H)))).toFixed(1)}`); return pts.join(' '); };
  const H20 = c - Qp / 20, H80 = c - Qp / 80;
  return (
    <div>
      <svg viewBox="0 -4 300 186" style={svgStyle} role="img" aria-label="Deux caractéristiques de régulateur avec le même puisage : avec un gain faible l’intersection est loin de la consigne, avec un gain fort elle s’en rapproche ; l’écart statique diminue mais ne s’annule pas">
        <AxesPF R={R} ticks={[30, 32, 34]}/>
        <polyline points={droite(20)} fill="none" stroke={BLEU} strokeWidth="3.2"/>
        <polyline points={droite(80)} fill="none" stroke={VERT} strokeWidth="3.2"/>
        <L2 x1={R.x0} y1={R.Y(Qp)} x2={R.x0 + R.w} y2={R.Y(Qp)} c={ROUGE} w="2.4"/>
        <circle cx={R.X(H20)} cy={R.Y(Qp)} r="5" fill={BLEU}/><circle cx={R.X(H80)} cy={R.Y(Qp)} r="5" fill={VERT}/>
        <L2 x1={R.X(c)} y1={R.y0} x2={R.X(c)} y2={R.y0 - 100} c={GRIS} w="1.8" dash="5 4"/>
        <T x={R.X(c) + 5} y={R.y0 - 6} c={GRIS}>consigne</T>
        <T x={R.X(30.15)} y={R.Y(Qp) + 16} c={ROUGE} w={800}>puisage</T>
        <T x={10} y={160} c={BLEU} w={800}>— gain faible (K = 20 %/m) : ES = 2 m</T>
        <T x={10} y={176} c={VERT} w={800}>— gain fort (K = 80 %/m) : ES = 0,5 m</T>
      </svg>
      <ul style={liste}>
        <li><em>Un gain plus grand rapproche le niveau de la consigne, sans jamais annuler l’écart statique.</em></li>
        <li><strong>Exemple</strong> (consigne 34 m, puisage 40 m³/h) : K<sub>p</sub> = 20 %/m → ES = 2 m ; K<sub>p</sub> = 80 %/m → ES = 0,5 m.</li>
        <li><strong>Limite</strong> : avec un retard de mesure, un gain trop grand fait osciller le niveau (compromis précision / stabilité).</li>
      </ul>
    </div>
  );
}

// ── Carte E : puisage trop fort, réservoir vide ──
export function FicheVide() {
  const R = rep(28, 35), c = 34, Qp = 70;
  const droite = Kp => { const pts = []; for (let H = 28; H <= 35.001; H += 0.1) pts.push(`${R.X(H).toFixed(1)},${R.Y(Math.max(0, Math.min(100, Kp * (c - H)))).toFixed(1)}`); return pts.join(' '); };
  return (
    <div>
      <svg viewBox="0 -4 300 182" style={svgStyle} role="img" aria-label="Si le puisage est trop fort pour le gain choisi, la droite du puisage coupe la caractéristique du régulateur sous le fond du réservoir : il n’y a pas de point de fonctionnement dans le réservoir et il se vide ; avec un gain plus fort l’intersection revient dans le réservoir">
        <rect x={R.x0} y={R.y0 - R.h - 4} width={R.X(30) - R.x0} height={R.h + 4} fill="#fee2e2" opacity="0.8"/>
        <T x={R.x0 + 4} y={R.y0 - 6} c={ROUGE} w={800}>sous le fond</T>
        <AxesPF R={R} ticks={[28, 30, 32, 34]}/>
        <polyline points={droite(15)} fill="none" stroke={BLEU} strokeWidth="3.2"/>
        <polyline points={droite(35)} fill="none" stroke={VERT} strokeWidth="3.2"/>
        <L2 x1={R.x0} y1={R.Y(Qp)} x2={R.x0 + R.w} y2={R.Y(Qp)} c={ROUGE} w="2.6"/>
        <T x={R.X(32.2)} y={R.Y(Qp) - 7} c={ROUGE} w={800}>puisage 70 m³/h</T>
        <T x={R.X(28.2)} y={R.Y(45)} c={BLEU} w={800}>gain 15 :</T>
        <T x={R.X(28.2)} y={R.Y(45) + 16} c={BLEU} w={800}>pas d’équilibre</T>
        <T x={R.X(33.15)} y={R.Y(38)} c={VERT} w={800}>gain 35</T>
      </svg>
      <ul style={liste}>
        <li><em>Si la pompe, commandée par le régulateur, ne peut pas compenser le puisage, le réservoir se vide.</em></li>
        <li>Remède : un <strong>gain plus fort</strong> (la pompe est plus vite à fond) ou un puisage moins important ; l’intersection revient alors dans le réservoir.</li>
        <li><strong>Hypothèses</strong> : pompe idéale (débit proportionnel à la commande), puisage constant.</li>
      </ul>
    </div>
  );
}

// ── Carte F : bilan ──
export function FicheBilanReg() {
  return (
    <div>
      <svg viewBox="0 0 300 210" style={svgStyle} role="img" aria-label="Bilan : le régulateur compare la hauteur à la consigne et commande la pompe ; le point de fonctionnement, intersection de la caractéristique du régulateur et du débit de puisage, donne la hauteur d’équilibre et l’écart statique ; un gain plus grand réduit l’écart sans l’annuler et seule une action intégrale l’annule">
        <Case y={4} t1="boucle : réglée H, réglante Q pompe" t2="perturbation : le débit de puisage" c={BLEU}/>
        <Bas y={48}/>
        <Case y={62} t1="point de fonctionnement" t2="intersection → H d’équilibre, ES" c={ORANGE}/>
        <Bas y={106}/>
        <Case y={120} t1="K plus grand → ES plus petit" t2="jamais nul avec un régulateur P seul" c={VERT}/>
        <T x={150} y={186} a="middle" w={700}>pour annuler ES : action intégrale (PI)</T>
        <T x={150} y={202} a="middle" c={GRIS}>modèle : pompe idéale, régulateur P pur</T>
      </svg>
      <ul style={liste}>
        <li><em>On lit le résultat final (niveau d’équilibre) sur le graphique ; la simulation temporelle montre le chemin pour y arriver.</em></li>
        <li><strong>Pièges</strong> : signe de l’écart (H est sous la consigne) ; confondre la commande Y (en %) et le débit Q (en m³/h).</li>
      </ul>
    </div>
  );
}
