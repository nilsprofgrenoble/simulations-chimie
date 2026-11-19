// Cartes « À retenir » de la simulation « Écrire un résultat avec son incertitude-type » (sim 78, TSTL).
// Chaque carte est posée une étape APRÈS la question qu'elle conclut, avec d'autres valeurs que celles de la simulation.
// Schémas dessinés dans un cadre de 300 de large (textes ≥ 12,5) : ≥ 9 px rendus sur téléphone, sans grossir sur ordinateur (maxWidth 320).
import { Formule } from "../commun";

const GRIS = '#475569', TEAL = '#0f766e', ROUGE = '#b91c1c', ORANGE = '#c2410c', BLEU = '#1d4ed8', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };

// ── Carte 1 : dispersion, moyenne, écart-type ──
export function FicheDispersion() {
  const xs = [92, 108, 118, 126, 134, 146, 160, 176], ys = [96, 84, 100, 88, 98, 86, 94, 90];
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Huit mesures d’un même volume, toutes un peu différentes : la moyenne est la meilleure estimation du résultat, l’écart-type s décrit la dispersion d’une mesure autour de la moyenne ; la valeur vraie reste inconnue">
        <text x="150" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>8 mesures d’un même volume</text>
        <line x1="104" y1="38" x2="160" y2="38" stroke={ORANGE} strokeWidth="2.5"/><line x1="104" y1="32" x2="104" y2="44" stroke={ORANGE} strokeWidth="2.5"/><line x1="160" y1="32" x2="160" y2="44" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="132" y="58" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>s : dispersion</text>
        <line x1="132" y1="66" x2="132" y2="124" stroke={TEAL} strokeWidth="3"/>
        <line x1="146" y1="66" x2="146" y2="124" stroke={GRIS} strokeWidth="2" strokeDasharray="5 4"/>
        {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="6" fill={BLEU} stroke="#fff" strokeWidth="1.5"/>)}
        <line x1="40" y1="124" x2="260" y2="124" stroke={ENCRE} strokeWidth="2"/>
        <text x="132" y="142" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={TEAL}>x̄ : moyenne</text>
        <text x="150" y="160" textAnchor="middle" fontSize="12.5" fill={GRIS}>- - -  valeur vraie : inconnue</text>
        <text x="150" y="178" textAnchor="middle" fontSize="12.5" fill={GRIS}>on n’a que des mesures</text>
      </svg>
      <ul style={liste}>
        <li><em>Mêmes conditions, mesures différentes : c’est la dispersion.</em></li>
        <li><strong>x̄</strong> = meilleure estimation du résultat ; <strong>s</strong> (touche σₙ₋₁ de la calculatrice) = dispersion d’<em>une</em> mesure.</li>
        <li>Hypothèse : mesures <strong>indépendantes</strong>, faites dans les <strong>mêmes conditions</strong>.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : u = s / √n ──
const bell = (sigma, haut, y0) => {
  const pts = [];
  for (let x = 30; x <= 270; x += 6) pts.push(`${x},${(y0 - haut * Math.exp(-((x - 150) ** 2) / (2 * sigma * sigma))).toFixed(1)}`);
  return pts.join(' ');
};
export function FicheMoyenne() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Deux courbes en cloche centrées sur la moyenne : la dispersion d’une mesure isolée, large, d’écart-type s, et celle de la moyenne de n mesures, plus étroite, d’incertitude-type u égale à s sur racine de n ; avec 4 fois plus de mesures, u est divisée par 2">
        <polyline points={bell(44, 40, 112)} fill="none" stroke={GRIS} strokeWidth="3"/>
        <polyline points={bell(22, 80, 112)} fill="none" stroke={TEAL} strokeWidth="3.5"/>
        <line x1="20" y1="112" x2="280" y2="112" stroke={ENCRE} strokeWidth="2"/>
        <line x1="150" y1="22" x2="150" y2="112" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x="150" y="16" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={ORANGE}>x̄</text>
        <text x="8" y="80" fontSize="12.5" fontWeight="700" fill={GRIS}>une mesure : s</text>
        <text x="196" y="48" fontSize="12.5" fontWeight="800" fill={TEAL}>la moyenne : u</text>
        <rect x="14" y="126" width="272" height="42" rx="21" fill="#f0fdfa" stroke={TEAL} strokeWidth="2.5"/>
        <text x="150" y="144" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>4 fois plus de mesures</text>
        <text x="150" y="160" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={TEAL}>⇒ u divisée par 2</text>
      </svg>
      <Formule><mi>u</mi><mo>=</mo><mfrac><mi>s</mi><msqrt><mi>n</mi></msqrt></mfrac></Formule>
      <ul style={liste}>
        <li>u est l’incertitude-type <strong>de la moyenne</strong> (type A : étude statistique de n mesures) : <strong>plus petite que s</strong>.</li>
        <li>Exemple : 10,2 ; 10,4 ; 10,3 mL → x̄ = 10,3 mL ; s = 0,10 mL ; u = 0,10 / √3 ≈ 0,058 mL.</li>
        <li><strong>Pièges</strong> : diviser par n au lieu de √n ; donner s à la place de u.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : arrondir puis écrire la phrase ──
const Etape = ({ y, titre, ligne1, ligne2, couleur }) => (
  <g>
    <rect x="6" y={y} width="288" height="44" rx="10" fill="#fff" stroke={couleur} strokeWidth="2.5"/>
    <text x="16" y={y + 17} fontSize="12.5" fontWeight="800" fill={couleur}>{titre}</text>
    <text x="16" y={y + 32} fontSize="12.5" fill={ENCRE}>{ligne1}</text>
    {ligne2 && <text x="284" y={y + 32} textAnchor="end" fontSize="12.5" fontWeight="800" fill={couleur}>{ligne2}</text>}
  </g>
);
const Descend = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 12} stroke={GRIS} strokeWidth="2.5"/><polygon points={`150,${y + 16} 144,${y + 8} 156,${y + 8}`} fill={GRIS}/></g>;
export function FicheEcrire() {
  return (
    <div>
      <svg viewBox="0 0 300 184" style={svgStyle} role="img" aria-label="Écrire un résultat en trois temps : arrondir u selon son premier chiffre, une valeur de 0,0583 millilitre devenant 0,06 ; arrondir le résultat à la même décimale, 10,3041 devenant 10,30 ; écrire une phrase avec les unités">
        <Etape y={2} titre="1. arrondir u" ligne1="u commence par 5" ligne2="0,0583 → 0,06" couleur={TEAL}/>
        <Descend y={46}/>
        <Etape y={64} titre="2. arrondir x̄ à la même décimale" ligne1="2 décimales, comme u" ligne2="10,3041 → 10,30" couleur={BLEU}/>
        <Descend y={108}/>
        <Etape y={126} titre="3. écrire la phrase" ligne1="résultat + unité + origine + u" ligne2="" couleur={ORANGE}/>
      </svg>
      <ul style={liste}>
        <li><strong>Règle de la classe</strong> : u commence par 1 à 4 → 2 chiffres significatifs ; par 5 à 9 → 1 seul. D’autres conventions existent.</li>
        <li>Phrase type : « Le volume est 10,30 mL (moyenne de 3 mesures) avec une incertitude-type de 0,06 mL. »</li>
        <li>Arrondir <strong>à la fin</strong>. <strong>Pièges</strong> : trop de décimales, unité oubliée, « ± » lu comme une garantie.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : ce que dit l'intervalle ──
const Intervalle = ({ y, c, w, vrai = 150, couleurs = true }) => {
  const ok = Math.abs(c - vrai) <= w, col = ok || !couleurs ? TEAL : ROUGE;
  return <g><line x1={c - w} y1={y} x2={c + w} y2={y} stroke={col} strokeWidth="4" strokeLinecap="round"/><circle cx={c} cy={y} r="3.5" fill={col}/></g>;
};
export function FicheIntervalle() {
  const un = [[128, 34], [180, 26], [140, 30], [160, 36], [118, 24], [150, 30]], deux = un.map(([c, w]) => [c, 2 * w]);
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Six élèves refont la mesure : avec un intervalle x barre plus ou moins u, 4 intervalles sur 6 contiennent la valeur vraie, soit environ 2 sur 3 ; avec x barre plus ou moins 2u, presque tous la contiennent, environ 95 pour cent">
        <text x="8" y="14" fontSize="12.5" fontWeight="800" fill={ENCRE}>x̄ ± u : environ 2 sur 3</text>
        {un.map(([c, w], i) => <Intervalle key={i} y={28 + i * 10} c={c} w={w}/>)}
        <line x1="150" y1="20" x2="150" y2="92" stroke={ENCRE} strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x="158" y="104" fontSize="12.5" fill={GRIS}>valeur vraie</text>
        <text x="8" y="122" fontSize="12.5" fontWeight="800" fill={ENCRE}>x̄ ± 2u : environ 95 %</text>
        {deux.map(([c, w], i) => <Intervalle key={i} y={136 + i * 10} c={c} w={w}/>)}
        <line x1="150" y1="128" x2="150" y2="196" stroke={ENCRE} strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x="296" y="48" textAnchor="end" fontSize="12.5" fontWeight="700" fill={ROUGE}>2 ratent</text>
      </svg>
      <ul style={liste}>
        <li><em>Un intervalle ± u sur trois rate la valeur vraie : aucune garantie.</em></li>
        <li>Pour <strong>comparer</strong> à une valeur de référence, on prend la règle « écart ≤ 2u » (intervalle plus large).</li>
        <li><strong>Hypothèse</strong> : écarts à peu près normaux ; avec peu de mesures, les proportions sont un peu plus faibles (≈ 65 % et ≈ 9 sur 10 pour n = 10).</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : erreur aléatoire / systématique, bilan ──
export function FicheSysteme() {
  const alea = [[96, 0], [112, 1], [130, 0], [146, 1], [162, 0], [178, 1], [194, 0]], syst = [[188, 0], [196, 1], [202, 0], [208, 1], [214, 0], [220, 1]];
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Erreur aléatoire : les mesures sont dispersées autour de la valeur vraie, répéter et moyenner réduit u ; erreur systématique : les mesures sont regroupées mais toutes décalées, u reste petite et le résultat faux, il faut étalonner">
        <text x="8" y="16" fontSize="13.5" fontWeight="800" fill={TEAL}>aléatoire</text>
        <line x1="150" y1="22" x2="150" y2="62" stroke={ENCRE} strokeWidth="1.5" strokeDasharray="4 3"/>
        {alea.map(([x, k], i) => <circle key={i} cx={x} cy={34 + k * 14} r="5.5" fill={BLEU}/>)}
        <text x="150" y="78" textAnchor="middle" fontSize="12.5" fill={ENCRE}>dispersées autour de la valeur vraie</text>
        <text x="8" y="106" fontSize="13.5" fontWeight="800" fill={ROUGE}>systématique</text>
        <line x1="150" y1="112" x2="150" y2="152" stroke={ENCRE} strokeWidth="1.5" strokeDasharray="4 3"/>
        {syst.map(([x, k], i) => <circle key={i} cx={x} cy={124 + k * 14} r="5.5" fill={ROUGE}/>)}
        <text x="150" y="168" textAnchor="middle" fontSize="12.5" fill={ENCRE}>regroupées, mais décalées</text>
        <text x="150" y="188" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={GRIS}>- - -  valeur vraie</text>
      </svg>
      <ul style={liste}>
        <li><em>u petite ne prouve pas un résultat juste</em> : elle dit que les mesures sont proches entre elles (fidélité), pas de la valeur vraie (justesse).</li>
        <li>Aléatoire : prise en compte dans u (type A) ; répéter et moyenner la réduit. Systématique : <strong>pas dans u</strong> ; seul l’étalonnage la corrige.</li>
        <li><strong>Bilan</strong> : calculer x̄, s, u = s / √n ; arrondir u puis x̄ ; écrire la phrase ; interpréter sans garantie sur l’intervalle.</li>
      </ul>
    </div>
  );
}
