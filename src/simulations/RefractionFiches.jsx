// Cartes « À retenir » de la simulation « Réfraction de la lumière : lois de Snell-Descartes » (sim 64, 2GT).
// Chaque carte est posée UNE ÉTAPE APRÈS la question qu'elle conclut, avec d'autres valeurs que celles de l'étape.
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320 (pas de grossissement sur ordinateur).
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a', MILIEU2 = '#dbeafe';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const rad = d => d * Math.PI / 180;
const Rayon = ({ x1, y1, x2, y2, c, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="3" strokeLinecap="round" strokeDasharray={dash}/>;

// ── Carte 1 : le vocabulaire ──
export function FicheVocabRef() {
  const px = 120, py = 92, L = 80, i1 = 40, i2 = 25;
  const a = [px - L * Math.sin(rad(i1)), py - L * Math.cos(rad(i1))], r = [px + L * Math.sin(rad(i1)), py - L * Math.cos(rad(i1))], t = [px + L * Math.sin(rad(i2)), py + L * Math.cos(rad(i2))];
  return (
    <div>
      <svg viewBox="0 0 300 184" style={svgStyle} role="img" aria-label="Schéma de la réfraction : un rayon incident arrive sur la surface de séparation de deux milieux, une partie est réfléchie, l’autre réfractée ; la normale est perpendiculaire à la surface ; l’angle d’incidence i1 et l’angle de réfraction i2 se mesurent à partir de la normale">
        <rect x="4" y={py} width="292" height={184 - py - 2} fill={MILIEU2}/>
        <line x1="4" y1={py} x2="296" y2={py} stroke={ENCRE} strokeWidth="2.5"/>
        <line x1={px} y1="8" x2={px} y2="178" stroke={GRIS} strokeWidth="1.5" strokeDasharray="5 4"/>
        <Rayon x1={a[0]} y1={a[1]} x2={px} y2={py} c={ORANGE}/>
        <Rayon x1={px} y1={py} x2={r[0]} y2={r[1]} c={GRIS} dash="2 5"/>
        <Rayon x1={px} y1={py} x2={t[0]} y2={t[1]} c={BLEU}/>
        <path d={`M${px},${py - 32} A32,32 0 0 0 ${px - 32 * Math.sin(rad(i1))},${py - 32 * Math.cos(rad(i1))}`} fill="none" stroke={ORANGE} strokeWidth="2"/>
        <path d={`M${px},${py + 36} A36,36 0 0 0 ${px + 36 * Math.sin(rad(i2))},${py + 36 * Math.cos(rad(i2))}`} fill="none" stroke={BLEU} strokeWidth="2"/>
        <text x={px - 44} y={py - 36} fontSize="13" fontWeight="800" fill={ORANGE}>i₁</text>
        <text x={px + 8} y={py + 52} fontSize="13" fontWeight="800" fill={BLEU}>i₂</text>
        <text x="6" y="16" fontSize="12.5" fontWeight="700" fill={ENCRE}>milieu 1 (n₁)</text>
        <text x="6" y="48" fontSize="12.5" fontWeight="700" fill={ORANGE}>incident</text>
        <text x={px + 8} y="18" fontSize="12.5" fill={GRIS}>normale</text>
        <text x="186" y="48" fontSize="12.5" fontWeight="700" fill={GRIS}>réfléchi</text>
        <text x="170" y="156" fontSize="12.5" fontWeight="700" fill={BLEU}>réfracté</text>
        <text x="196" y={py + 18} fontSize="12.5" fill={GRIS}>surface de</text>
        <text x="196" y={py + 34} fontSize="12.5" fill={GRIS}>séparation</text>
        <text x="6" y="176" fontSize="12.5" fontWeight="700" fill={ENCRE}>milieu 2 (n₂)</text>
      </svg>
      <ul style={liste}>
        <li><em>Les angles se mesurent toujours par rapport à la normale</em> (perpendiculaire à la surface), jamais par rapport à la surface.</li>
        <li>À la surface, une partie de la lumière est <strong>réfléchie</strong> (dans le milieu 1), l’autre est <strong>réfractée</strong> (dans le milieu 2).</li>
        <li><strong>Hypothèses</strong> : milieux transparents et homogènes, surface plane, rayons rectilignes.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : indice et déviation ──
const Panneau = ({ cx, i1, i2, couleur }) => {
  const py = 72, L = 52, a = [cx - L * Math.sin(rad(i1)), py - L * Math.cos(rad(i1))], t = [cx + L * Math.sin(rad(i2)), py + L * Math.cos(rad(i2))];
  return (
    <g>
      <rect x={cx - 66} y={py} width="132" height="52" fill={couleur}/>
      <line x1={cx - 66} y1={py} x2={cx + 66} y2={py} stroke={ENCRE} strokeWidth="2"/>
      <line x1={cx} y1="14" x2={cx} y2="124" stroke={GRIS} strokeWidth="1.5" strokeDasharray="5 4"/>
      <Rayon x1={a[0]} y1={a[1]} x2={cx} y2={py} c={ORANGE}/>
      <Rayon x1={cx} y1={py} x2={t[0]} y2={t[1]} c={BLEU}/>
    </g>
  );
};
export function FicheIndice() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="À gauche, le rayon passe dans un milieu d’indice plus grand : il se rapproche de la normale ; à droite, il passe dans un milieu d’indice plus petit : il s’écarte de la normale">
        <Panneau cx={74} i1={45} i2={27} couleur="#bfdbfe"/>
        <Panneau cx={226} i1={25} i2={40} couleur="#eff6ff"/>
        <text x="12" y="16" fontSize="12.5" fontWeight="700" fill={ENCRE}>n₁</text>
        <text x="12" y="118" fontSize="12.5" fontWeight="700" fill={ENCRE}>n₂</text>
        <text x="164" y="16" fontSize="12.5" fontWeight="700" fill={ENCRE}>n₁</text>
        <text x="164" y="118" fontSize="12.5" fontWeight="700" fill={ENCRE}>n₂</text>
        <text x="74" y="146" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>n₂ &gt; n₁</text>
        <text x="74" y="164" textAnchor="middle" fontSize="12.5" fill={ENCRE}>se rapproche</text>
        <text x="74" y="180" textAnchor="middle" fontSize="12.5" fill={ENCRE}>(i₂ &lt; i₁)</text>
        <text x="226" y="146" textAnchor="middle" fontSize="13" fontWeight="800" fill={ROUGE}>n₂ &lt; n₁</text>
        <text x="226" y="164" textAnchor="middle" fontSize="12.5" fill={ENCRE}>s’écarte</text>
        <text x="226" y="180" textAnchor="middle" fontSize="12.5" fill={ENCRE}>(i₂ &gt; i₁)</text>
      </svg>
      <ul style={liste}>
        <li><em>Vers le milieu d’indice plus grand, le rayon se rapproche de la normale ; vers le plus petit, il s’écarte.</em></li>
        <li>L’indice n caractérise un milieu transparent : n ≥ 1, sans unité. Air : 1,00 ; eau : 1,33 ; plexiglas : 1,51 ; diamant : 2,42.</li>
        <li>Plus l’indice du milieu 2 est grand, plus la déviation est importante.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : la loi de Snell-Descartes ──
export function FicheLoi() {
  const X = s => 36 + s * 150, Y = s => 120 - s * 100;       // s = sin i dans [0 ; 1]
  const pts = [0.2, 0.4, 0.6, 0.8];
  return (
    <div>
      <svg viewBox="0 0 300 190" style={svgStyle} role="img" aria-label="Graphique de sin i1 en fonction de sin i2 : les points mesurés s’alignent sur une droite qui passe par l’origine ; la pente de cette droite est l’indice du milieu 2 quand le milieu 1 est l’air">
        <line x1="36" y1="120" x2="196" y2="120" stroke={ENCRE} strokeWidth="2"/>
        <line x1="36" y1="120" x2="36" y2="14" stroke={ENCRE} strokeWidth="2"/>
        <line x1="36" y1="120" x2={X(0.66)} y2={Y(0.66 * 1.5)} stroke={ORANGE} strokeWidth="3"/>
        {pts.slice(0, 3).map(s => <circle key={s} cx={X(s)} cy={Y(s * 1.5)} r="5" fill={BLEU}/>)}
        <text x="6" y="22" fontSize="12.5" fontWeight="800" fill={ENCRE}>sin i₁</text>
        <text x="150" y="140" fontSize="12.5" fontWeight="800" fill={ENCRE}>sin i₂</text>
        <text x="204" y="50" fontSize="12.5" fontWeight="800" fill={ORANGE}>droite par</text>
        <text x="204" y="66" fontSize="12.5" fontWeight="800" fill={ORANGE}>l’origine</text>
        <text x="204" y="94" fontSize="12.5" fill={ENCRE}>pente = n₂</text>
        <text x="204" y="110" fontSize="12.5" fill={GRIS}>(milieu 1 : air)</text>
        <rect x="6" y="148" width="288" height="38" rx="12" fill="#fff" stroke={BLEU} strokeWidth="2.5"/>
        <text x="150" y="172" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>n₁ sin i₁ = n₂ sin i₂</text>
      </svg>
      <Formule><msub><mi>n</mi><mn>1</mn></msub><mi>sin</mi><msub><mi>i</mi><mn>1</mn></msub><mo>=</mo><msub><mi>n</mi><mn>2</mn></msub><mi>sin</mi><msub><mi>i</mi><mn>2</mn></msub></Formule>
      <ul style={liste}>
        <li><em>Ce sont les sinus des angles qui sont proportionnels, pas les angles.</em></li>
        <li>Méthode du TP : milieu 1 = air (n₁ = 1,00), plusieurs couples (i₁ ; i₂), tracé de sin i₁ en fonction de sin i₂ : la pente est n₂.</li>
        <li>Exemple : i₁ = 30° et i₂ = 19,5° donnent n = sin 30° / sin 19,5° ≈ 1,50. <strong>Piège</strong> : diviser les angles au lieu de leurs sinus.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : calculer un angle ──
const Ligne = ({ y, n, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="40" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <circle cx="24" cy={y + 20} r="11" fill={c}/>
    <text x="24" y={y + 25} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{n}</text>
    <text x="42" y={y + 17} fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    <text x="42" y={y + 33} fontSize="12.5" fill={ENCRE}>{t2}</text>
  </g>
);
export function FicheCalcAngle() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Calculer un angle de réfraction en quatre temps, exemple de l’air vers le diamant avec i1 de 50 degrés : relever n1 et n2, calculer sin i1, en déduire sin i2 égal à 0,317, puis i2 égal à 18,5 degrés par sin moins un">
        <Ligne y={4} n="1" t1="relever" t2="n₁ = 1,00 ; n₂ = 2,42 ; i₁ = 50°" c={BLEU}/>
        <Ligne y={50} n="2" t1="calculer sin i₁" t2="sin 50° = 0,766" c={BLEU}/>
        <Ligne y={96} n="3" t1="isoler sin i₂ = n₁ sin i₁ / n₂" t2="= 1,00 × 0,766 / 2,42 = 0,317" c={ORANGE}/>
        <Ligne y={142} n="4" t1="appliquer sin⁻¹ (mode degrés)" t2="i₂ = sin⁻¹(0,317) ≈ 18,5°" c={VERT}/>
        <text x="150" y="198" textAnchor="middle" fontSize="12.5" fill={GRIS}>contrôle : n₂ &gt; n₁ donc i₂ &lt; i₁ ✓</text>
      </svg>
      <Formule><mi>sin</mi><msub><mi>i</mi><mn>2</mn></msub><mo>=</mo><mfrac><mrow><msub><mi>n</mi><mn>1</mn></msub><mi>sin</mi><msub><mi>i</mi><mn>1</mn></msub></mrow><msub><mi>n</mi><mn>2</mn></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>Calculer sin i₂, puis revenir à l’angle avec sin⁻¹.</em></li>
        <li><strong>Pièges</strong> : calculatrice en radians ; garder au moins 3 chiffres sur les sinus ; vérifier la cohérence (n₂ &gt; n₁ donne i₂ &lt; i₁).</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : réflexion totale ──
export function FicheTotale() {
  const px = 106, py = 84, L = 64;
  const pt = (th, bas) => [px - L * Math.sin(rad(th)), py + (bas ? 1 : -1) * L * Math.cos(rad(th))];
  const e20 = pt(20, true), e41 = pt(41.5, true), e60 = pt(60, true);
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Rayons qui passent du plexiglas vers l’air : avec un angle d’incidence plus petit que l’angle limite, le rayon est réfracté ; à l’angle limite, il rase la surface ; au-delà, toute la lumière est réfléchie, c’est la réflexion totale">
        <rect x="4" y={py} width="292" height={186 - py - 2} fill={MILIEU2}/>
        <line x1="4" y1={py} x2="296" y2={py} stroke={ENCRE} strokeWidth="2.5"/>
        <line x1={px} y1="8" x2={px} y2="182" stroke={GRIS} strokeWidth="1.5" strokeDasharray="5 4"/>
        <Rayon x1={e20[0]} y1={e20[1]} x2={px} y2={py} c={VERT}/>
        <Rayon x1={px} y1={py} x2={px + L * Math.sin(rad(31.1))} y2={py - L * Math.cos(rad(31.1))} c={VERT}/>
        <Rayon x1={e41[0]} y1={e41[1]} x2={px} y2={py} c={ORANGE}/>
        <Rayon x1={px} y1={py} x2={px + 64} y2={py} c={ORANGE}/>
        <Rayon x1={e60[0]} y1={e60[1]} x2={px} y2={py} c={ROUGE}/>
        <Rayon x1={px} y1={py} x2={px + L * Math.sin(rad(60))} y2={py + L * Math.cos(rad(60))} c={ROUGE}/>
        <text x="6" y="16" fontSize="12.5" fontWeight="700" fill={ENCRE}>air (n₂ = 1,00)</text>
        <text x="6" y="164" fontSize="12.5" fontWeight="700" fill={ENCRE}>plexiglas</text>
        <text x="6" y="180" fontSize="12.5" fontWeight="700" fill={ENCRE}>n₁ = 1,51</text>
        <text x="186" y="28" fontSize="12.5" fontWeight="800" fill={VERT}>i₁ &lt; i lim</text>
        <text x="186" y="44" fontSize="12.5" fill={ENCRE}>réfracté</text>
        <text x="186" y="68" fontSize="12.5" fontWeight="800" fill={ORANGE}>i₁ = i lim</text>
        <text x="186" y="116" fontSize="12.5" fontWeight="800" fill={ROUGE}>i₁ &gt; i lim</text>
        <text x="186" y="132" fontSize="12.5" fill={ENCRE}>tout est réfléchi</text>
      </svg>
      <Formule><mi>sin</mi><msub><mi>i</mi><mtext>lim</mtext></msub><mo>=</mo><mfrac><msub><mi>n</mi><mn>2</mn></msub><msub><mi>n</mi><mn>1</mn></msub></mfrac></Formule>
      <ul style={liste}>
        <li><em>Au-delà de l’angle limite, il n’y a plus de rayon réfracté : toute la lumière est réfléchie.</em></li>
        <li>Condition : passer d’un milieu <strong>plus réfringent</strong> à un milieu <strong>moins réfringent</strong> (n₁ &gt; n₂).</li>
        <li>Angles limites vers l’air : plexiglas 41,5° ; eau 48,8° ; diamant 24,4°.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : bilan ──
const Case = ({ y, t1, t2, c }) => (
  <g>
    <rect x="6" y={y} width="288" height="40" rx="12" fill="#fff" stroke={c} strokeWidth="2.5"/>
    <text x="150" y={y + 17} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={c}>{t1}</text>
    <text x="150" y={y + 33} textAnchor="middle" fontSize="12.5" fill={ENCRE}>{t2}</text>
  </g>
);
const Bas = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 8} stroke={GRIS} strokeWidth="2.5"/><polygon points={`150,${y + 12} 145,${y + 5} 155,${y + 5}`} fill={GRIS}/></g>;
export function FicheBilanRef() {
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Bilan de la réfraction : les angles se mesurent par rapport à la normale ; la loi n1 sin i1 égale n2 sin i2 relie les angles ; si n augmente le rayon se rapproche de la normale, s’il diminue il s’écarte ; au-delà de l’angle limite, la réflexion est totale">
        <Case y={4} t1="angles mesurés avec la normale" t2="i₁ = 0° : pas de déviation" c={BLEU}/>
        <Bas y={46}/>
        <Case y={60} t1="n₁ sin i₁ = n₂ sin i₂" t2="n augmente : on se rapproche de la normale" c={ORANGE}/>
        <Bas y={102}/>
        <Case y={116} t1="n diminue : on s’écarte de la normale" t2="au-delà de i lim : réflexion totale" c={VERT}/>
        <text x="150" y="176" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>poisson : le rayon sort de l’eau,</text>
        <text x="150" y="190" textAnchor="middle" fontSize="12.5" fill={GRIS}>il paraît moins profond</text>
      </svg>
      <ul style={liste}>
        <li><em>Une loi, trois conséquences : rapprochement, éloignement, réflexion totale.</em></li>
        <li>Pêcheur : la lumière du poisson s’écarte de la normale en sortant de l’eau ; l’œil prolonge le rayon en ligne droite et voit le poisson plus haut que sa profondeur réelle.</li>
        <li><strong>Pièges</strong> : angle pris avec la surface ; angles divisés au lieu des sinus ; calculatrice en radians.</li>
      </ul>
    </div>
  );
}
