// Cartes « À retenir » de la simulation « Loi d'Ohm, caractéristique et capteur résistif » (sim 69, 2GT).
// Aucune carte ne donne la réponse de sa propre étape ; exemples différents de ceux demandés.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const L2 = ({ x1, y1, x2, y2, c = ENCRE, w = 2.4, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}/>;
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Case = ({ y, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="42" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <text x="150" y={y + 18} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    <text x="150" y={y + 34} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>
  </g>
);
const Bas = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 8} stroke={GRIS} strokeWidth="2.5"/><polygon points={`150,${y + 12} 145,${y + 5} 155,${y + 5}`} fill={GRIS}/></g>;
// repère : origine (x0,y0), largeur w, hauteur h
const Axes = ({ x0, y0, w, h, lx, ly, ticksX = [], ticksY = [] }) => (
  <g>
    <L2 x1={x0} y1={y0} x2={x0 + w} y2={y0} w="2"/><L2 x1={x0} y1={y0 + 0} x2={x0} y2={y0 - h} w="2"/>
    {ticksX.map(([x, t]) => <g key={t}><L2 x1={x} y1={y0} x2={x} y2={y0 + 5} w="2"/><T x={x} y={y0 + 19} a="middle">{t}</T></g>)}
    {ticksY.map(([y, t]) => <g key={t}><L2 x1={x0 - 5} y1={y} x2={x0} y2={y} w="2"/><T x={x0 - 8} y={y + 4} a="end">{t}</T></g>)}
    <T x={x0 + w} y={y0 + 36} a="end" w={700}>{lx}</T>
    <T x={x0 - 34} y={y0 - h - 4} w={700}>{ly}</T>
  </g>
);

// ── Carte A : la caractéristique d'un résistor ──
export function FicheCaract() {
  const x0 = 44, y0 = 134, w = 240, h = 112, X = i => x0 + i / 60 * w, Y = u => y0 - u / 6 * h;
  return (
    <div>
      <svg viewBox="0 -10 300 186" style={svgStyle} role="img" aria-label="Caractéristiques tension en fonction de l’intensité de deux résistors, 100 ohms et 220 ohms : deux droites qui passent par l’origine ; la droite la plus raide correspond à la plus grande résistance">
        <Axes x0={x0} y0={y0} w={w + 10} h={h + 8} lx="I (mA)" ly="U (V)" ticksX={[[X(0), '0'], [X(30), '30'], [X(60), '60']]} ticksY={[[Y(0), '0'], [Y(3), '3'], [Y(6), '6']]}/>
        <L2 x1={X(0)} y1={Y(0)} x2={X(60)} y2={Y(6)} c={BLEU} w="3"/>
        <L2 x1={X(0)} y1={Y(0)} x2={X(27.3)} y2={Y(6)} c={ORANGE} w="3"/>
        {[[20, 2, BLEU], [40, 4, BLEU], [60, 6, BLEU], [9.1, 2, ORANGE], [18.2, 4, ORANGE], [27.3, 6, ORANGE]].map(([i, u, c], k) => <circle key={k} cx={X(i)} cy={Y(u)} r="4" fill={c}/>)}
        <T x={X(36)} y={Y(2.2) + 16} c={BLEU} w={800}>R = 100 Ω</T>
        <T x={X(10)} y={Y(5.6) - 8} c={ORANGE} w={800}>R = 220 Ω</T>
      </svg>
      <ul style={liste}>
        <li><em>Un résistor : U proportionnelle à I, donc une droite qui passe par l’origine.</em></li>
        <li>La caractéristique d’un dipôle est la courbe U = f(I). Plus la droite est <strong>raide</strong>, plus la résistance R (la pente) est <strong>grande</strong>.</li>
        <li><strong>Modèles</strong> : U = k × I (proportionnel) ou U = a × I + b (affine) ; pour un résistor, b ≈ 0 aux incertitudes près et k = R.</li>
      </ul>
    </div>
  );
}

// ── Carte B : la loi d'Ohm (triangle) ──
export function FicheOhm() {
  return (
    <div>
      <svg viewBox="0 0 300 158" style={svgStyle} role="img" aria-label="Le triangle de la loi d’Ohm : U en haut, R et I en bas ; on cache la grandeur cherchée pour lire la formule : U égale R fois I, R égale U divisé par I, I égale U divisé par R">
        <polygon points="70,12 20,128 120,128" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.6" strokeLinejoin="round"/>
        <L2 x1="38" y1="88" x2="102" y2="88" c={BLEU} w="2"/><L2 x1="70" y1="88" x2="70" y2="124" c={BLEU} w="2"/>
        <text x="70" y="74" textAnchor="middle" fontSize="22" fontWeight="800" fill={ORANGE}>U</text>
        <text x="48" y="116" textAnchor="middle" fontSize="22" fontWeight="800" fill={ENCRE}>R</text>
        <text x="92" y="116" textAnchor="middle" fontSize="22" fontWeight="800" fill={ENCRE}>I</text>
        <T x={146} y={42} w={800} c={BLEU}>on cache l’inconnue :</T>
        <T x={146} y={72}>cacher U → U = R × I</T>
        <T x={146} y={98}>cacher R → R = U / I</T>
        <T x={146} y={124}>cacher I → I = U / R</T>
        <T x={150} y={152} a="middle" c={GRIS}>U en V · I en A · R en Ω</T>
      </svg>
      <ul style={liste}>
        <li><em>Un résistor : la tension à ses bornes est proportionnelle à l’intensité qui le traverse.</em></li>
        <li><strong>Méthode</strong> : (1) convertir, 1 mA = 10⁻³ A ; (2) choisir la formule ; (3) calculer ; (4) écrire l’unité.</li>
        <li><strong>Exemple</strong> : U = 12 V, I = 40 mA = 0,040 A → R = 12 / 0,040 = <strong>300 Ω</strong>.</li>
        <li><strong>Pièges</strong> : mA non convertis ; division à l’envers. Valable seulement pour un conducteur <strong>ohmique</strong> (R constante).</li>
      </ul>
    </div>
  );
}

// ── Carte C : dipôle non ohmique (lampe) ──
export function FicheLampe() {
  const x0 = 44, y0 = 134, w = 240, h = 112, X = i => x0 + i / 300 * w, Y = u => y0 - u / 6 * h;
  const pts = []; for (let i = 0; i <= 300; i += 10) pts.push(`${X(i).toFixed(1)},${Y(6 * (i / 300) ** 1.71).toFixed(1)}`);
  return (
    <div>
      <svg viewBox="0 -10 300 186" style={svgStyle} role="img" aria-label="Caractéristiques tension en fonction de l’intensité : un résistor donne une droite passant par l’origine, une lampe donne une courbe qui s’incurve car la résistance de son filament augmente quand il chauffe">
        <Axes x0={x0} y0={y0} w={w + 10} h={h + 8} lx="I (mA)" ly="U (V)" ticksX={[[X(0), '0'], [X(150), '150'], [X(300), '300']]} ticksY={[[Y(0), '0'], [Y(3), '3'], [Y(6), '6']]}/>
        <L2 x1={X(0)} y1={Y(0)} x2={X(300)} y2={Y(6)} c={BLEU} w="3"/>
        <polyline points={pts.join(' ')} fill="none" stroke={ORANGE} strokeWidth="3.2"/>
        <T x={X(8)} y={Y(5.6)} c={BLEU} w={800}>résistor : droite</T>
        <T x={X(8)} y={Y(5.6) + 16} c={ORANGE} w={800}>lampe : courbe</T>
      </svg>
      <ul style={liste}>
        <li><em>Le filament chauffe, sa résistance augmente : la caractéristique de la lampe n’est pas une droite.</em></li>
        <li>La loi d’Ohm U = R × I avec R constante ne s’applique <strong>pas</strong> à la lampe.</li>
        <li><strong>Hypothèses</strong> : lampe 6 V – 0,30 A modélisée par une loi de puissance ; résistor idéal ; appareils de mesure parfaits.</li>
      </ul>
    </div>
  );
}

// ── Carte D : point de fonctionnement ──
export function FicheFonct() {
  const E = 9, R = 47, lampe = i => 6 * (i / 0.3) ** 1.71;
  let a = 0, b = 0.19; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (lampe(m) < E - R * m) a = m; else b = m; }
  const Ip = (a + b) / 2, Up = lampe(Ip);
  const x0 = 44, y0 = 134, w = 232, h = 112, X = i => x0 + i / 200 * w, Y = u => y0 - u / 9 * h;
  const pts = []; for (let i = 0; i <= 200; i += 8) pts.push(`${X(i).toFixed(1)},${Y(lampe(i / 1000)).toFixed(1)}`);
  return (
    <div>
      <svg viewBox="0 -10 300 188" style={svgStyle} role="img" aria-label="Le point de fonctionnement est l’intersection de la caractéristique de la lampe et de la droite U égale E moins R fois I issue de la loi des mailles">
        <Axes x0={x0} y0={y0} w={w + 14} h={h + 8} lx="I (mA)" ly="U (V)" ticksX={[[X(0), '0'], [X(100), '100'], [X(200), '200']]} ticksY={[[Y(0), '0'], [Y(9), '9']]}/>
        <L2 x1={X(0)} y1={Y(E)} x2={X(E / R * 1000)} y2={Y(0)} c={BLEU} w="3"/>
        <polyline points={pts.join(' ')} fill="none" stroke={ORANGE} strokeWidth="3.2"/>
        <L2 x1={X(Ip * 1000)} y1={Y(Up)} x2={X(Ip * 1000)} y2={y0} c={VERT} w="2" dash="4 4"/>
        <circle cx={X(Ip * 1000)} cy={Y(Up)} r="5.5" fill={VERT}/>
        <T x={X(8)} y={Y(E) + 3} c={BLEU} w={800}>E</T>
        <T x={X(6)} y={Y(3.4)} c={BLEU} w={800}>U = E − R × I</T>
        <T x={X(100)} y={Y(8.2)} c={VERT} w={800}>point de</T>
        <T x={X(100)} y={Y(8.2) + 16} c={VERT} w={800}>fonctionnement</T>
        <L2 x1={X(150)} y1={Y(8.2) + 24} x2={X(Ip * 1000)} y2={Y(Up) - 8} c={VERT} w="1.8"/>
        <T x={X(160)} y={Y(3.4)} c={ORANGE} w={800}>lampe</T>
      </svg>
      <Formule><mi>E</mi><mo>=</mo><mi>U</mi><mo>+</mo><mi>R</mi><mo>×</mo><mi>I</mi></Formule>
      <ul style={liste}>
        <li><em>Le point de fonctionnement est à l’intersection de la droite de la maille et de la courbe du dipôle.</em></li>
        <li><strong>Exemple</strong> : E = 9 V, R = 47 Ω : la droite coupe l’axe des U en 9 V ; intersection vers I ≈ {Math.round(Ip * 1000 / 10) * 10} mA et U ≈ {Up.toFixed(1).replace('.', ',')} V.</li>
      </ul>
    </div>
  );
}

// ── Carte E : étalonner un capteur ──
export function FicheEtalon() {
  const data = [[0, 33.6], [20, 12.5], [40, 5.3], [60, 2.5], [80, 1.3]];
  const x0 = 46, y0 = 134, w = 236, h = 112, X = t => x0 + t / 80 * w, Y = r => y0 - r / 35 * h;
  const lisse = []; for (let t = 0; t <= 80; t += 2) { const i = Math.min(3, Math.floor(t / 20)), [t0, r0] = data[i], [t1, r1] = data[i + 1]; const u = (t - t0) / (t1 - t0); lisse.push([t, r0 * Math.pow(r1 / r0, u)]); }
  return (
    <div>
      <svg viewBox="0 -10 300 188" style={svgStyle} role="img" aria-label="Courbe d’étalonnage d’une thermistance CTN : la résistance diminue quand la température augmente ; pour lire une température, on repère la résistance sur l’axe vertical, on va à la courbe, puis on descend sur l’axe horizontal">
        <Axes x0={x0} y0={y0} w={w + 12} h={h + 8} lx="θ (°C)" ly="R (kΩ)" ticksX={[[X(0), '0'], [X(40), '40'], [X(80), '80']]} ticksY={[[Y(0), '0'], [Y(10), '10'], [Y(30), '30']]}/>
        <polyline points={lisse.map(([t, r]) => `${X(t).toFixed(1)},${Y(r).toFixed(1)}`).join(' ')} fill="none" stroke={VERT} strokeWidth="3.2"/>
        {data.map(([t, r]) => <circle key={t} cx={X(t)} cy={Y(r)} r="4" fill={VERT}/>)}
        <L2 x1={x0} y1={Y(12.5)} x2={X(20)} y2={Y(12.5)} c={ORANGE} w="2.2" dash="5 4"/>
        <L2 x1={X(20)} y1={Y(12.5)} x2={X(20)} y2={y0} c={ORANGE} w="2.2" dash="5 4"/>
        <T x={X(34)} y={Y(27)} c={ORANGE} w={800}>① R lu</T>
        <T x={X(34)} y={Y(27) + 16} c={ORANGE} w={800}>② courbe</T>
        <T x={X(34)} y={Y(27) + 32} c={ORANGE} w={800}>③ θ</T>
      </svg>
      <ul style={liste}>
        <li><em>Étalonner : mesurer R pour des températures connues. Utiliser : mesurer R, puis lire θ sur la courbe.</em></li>
        <li><strong>Exemple</strong> : R = 12,5 kΩ → θ ≈ 20 °C. Une CTN : θ augmente, R <strong>diminue</strong>.</li>
        <li><strong>Hypothèses</strong> : capteur alimenté sous 5 V, sans auto-échauffement ; on exploite la courbe, pas de formule.</li>
      </ul>
    </div>
  );
}

// ── Carte F : bilan ──
export function FicheBilanOhm() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Bilan : un résistor suit la loi d’Ohm U égale R fois I avec une caractéristique droite ; une lampe n’est pas ohmique et son point de fonctionnement est l’intersection avec la droite de la maille ; un capteur résistif s’étalonne puis on lit la grandeur sur la courbe">
        <Case y={4} t1="résistor : U = R × I" t2="droite par l’origine, pente R" c={BLEU}/>
        <Bas y={48}/>
        <Case y={62} t1="lampe : pas ohmique (courbe)" t2="point de fonct. = intersection" c={ORANGE}/>
        <Bas y={106}/>
        <Case y={120} t1="capteur résistif : étalonnage" t2="mesurer R, lire la grandeur" c={VERT}/>
        <T x={150} y={184} a="middle" w={700}>convertir (mA → A), calculer, écrire l’unité</T>
        <T x={150} y={200} a="middle" c={GRIS}>vérifier l’ordre de grandeur</T>
      </svg>
      <ul style={liste}>
        <li><em>Loi d’Ohm pour un résistor ; courbe et intersection pour un dipôle non ohmique ; étalonnage pour un capteur.</em></li>
        <li><strong>Pièges</strong> : mA non convertis ; R = U / I écrit à l’envers ; loi d’Ohm appliquée à une lampe.</li>
      </ul>
    </div>
  );
}
