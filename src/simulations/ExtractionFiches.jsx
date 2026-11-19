// Cartes « À retenir » de la simulation « Ampoule à décanter : extraction liquide-liquide » (sim 112, 1G).
// Chaque carte est posée UNE ÉTAPE après la question qu'elle conclut. Schémas dans un cadre de 300 de large,
// textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320.
import { Formule } from "../commun";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const EAU = '#bfdbfe', ORG = '#fef9c3', I2_EAU = '#c2823a', I2_ORG = '#8b5cf6';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Arr = ({ x1, y1, x2, y2, c = ENCRE, w = 2.6 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, ca = Math.cos(a), sa = Math.sin(a);
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 5 * ca} y2={y2 - 5 * sa} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p.map(q => q.join(',')).join(' ')} fill={c}/></g>;
};
// Petite ampoule à décanter (hauteur 114, largeur 68 à l'échelle 1) : haut / bas = couleurs des deux phases, rot = retournée
const CORPS = "M-5,0 L-5,14 C-5,14 -34,30 -34,62 C-34,88 -12,98 -3,102 L-3,114 L3,114 L3,102 C12,98 34,88 34,62 C34,30 5,14 5,14 L5,0 Z";
const Mini = ({ id, x, y, s = 1, rot = 0, haut, bas, inter = 62, bouchon = true, ouvert = false }) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${rot} 0 57)`}>
    <clipPath id={id}><path d={CORPS}/></clipPath>
    <g clipPath={`url(#${id})`}>
      {haut && <rect x="-40" y="16" width="80" height={inter - 16} fill={haut}/>}
      {bas && <rect x="-40" y={inter} width="80" height={116 - inter} fill={bas}/>}
    </g>
    <path d={CORPS} fill="none" stroke={GRIS} strokeWidth="3" vectorEffect="non-scaling-stroke"/>
    {bouchon && <path d="M-7,0 L7,0 L5,-9 L-5,-9 Z" fill="#94a3b8" stroke={GRIS} strokeWidth="2" vectorEffect="non-scaling-stroke"/>}
    <rect x="-7" y="102" width="14" height="6" fill="#cbd5e1" stroke={GRIS} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    {ouvert ? <line x1="7" y1="105" x2="17" y2="116" stroke={GRIS} strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke"/> : <line x1="7" y1="105" x2="20" y2="105" stroke={GRIS} strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>}
  </g>
);

// ── Carte A : position des phases (carte posée sur « Un solvant miscible ») ──
export function FichePositionPhases() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Deux liquides non miscibles : à gauche l'huile, de densité 0,92, surnage sur l'eau ; à droite l'eau, de densité 1,00, surnage sur le dichlorométhane, de densité 1,33 ; le plus dense est en bas">
        <T x={150} y={16} a="middle" c={ORANGE} w={800}>le plus dense coule</T>
        <rect x="15" y="28" width="110" height="48" fill={ORG}/><rect x="15" y="76" width="110" height="48" fill={EAU}/><rect x="15" y="28" width="110" height="96" fill="none" stroke={GRIS} strokeWidth="2"/>
        <T x={70} y={48} a="middle" w={700}>huile</T><T x={70} y={65} a="middle">d = 0,92</T>
        <T x={70} y={96} a="middle" w={700}>eau</T><T x={70} y={113} a="middle">d = 1,00</T>
        <rect x="175" y="28" width="110" height="48" fill={EAU}/><rect x="175" y="76" width="110" height="48" fill={ORG}/><rect x="175" y="28" width="110" height="96" fill="none" stroke={GRIS} strokeWidth="2"/>
        <T x={230} y={48} a="middle" w={700}>eau</T><T x={230} y={65} a="middle">d = 1,00</T>
        <T x={230} y={96} a="middle" w={700}>dichlorométhane</T><T x={230} y={113} a="middle">d = 1,33</T>
        <T x={70} y={144} a="middle" c={VERT} w={800}>d &lt; 1 : dessus</T><T x={230} y={144} a="middle" c={VERT} w={800}>d &gt; 1 : dessous</T>
        <T x={150} y={166} a="middle" c={GRIS}>on compare à l’eau (d = 1,00)</T>
      </svg>
      <Formule><mi>d</mi><mo>=</mo><mfrac><mi>ρ</mi><msub><mi>ρ</mi><mtext>eau</mtext></msub></mfrac><mspace width="1.5em"/><mtext>sans unité</mtext></Formule>
      <ul style={liste}>
        <li><em>Deux liquides non miscibles forment deux phases : le plus dense est en bas.</em></li>
        <li><strong>Méthode :</strong> on compare la densité du solvant à celle de l’eau (d = 1,00).</li>
        <li><strong>Idée fausse :</strong> « l’eau est toujours en bas ». <strong>Vrai :</strong> tout dépend de la densité de l’autre liquide.</li>
      </ul>
    </div>
  );
}

// ── Carte B : le soluté passe dans la phase où il est le plus soluble (carte posée sur « Choisir le solvant extracteur ») ──
export function FicheSolute() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Avant l'agitation, le diiode brun est dans l'eau, sous le cyclohexane incolore ; après agitation, le diiode est passé dans le cyclohexane, qui devient violet, et l'eau est presque incolore">
        <T x={70} y={16} a="middle" c={GRIS} w={800}>avant</T><T x={230} y={16} a="middle" c={GRIS} w={800}>après agitation</T>
        <Mini id="fsA" x={70} y={30} haut={ORG} bas={I2_EAU}/>
        <Mini id="fsB" x={230} y={30} haut={I2_ORG} bas={EAU}/>
        <T x={150} y={80} a="middle" c={ORANGE} w={800}>agiter</T>
        <Arr x1={114} y1={90} x2={188} y2={90} c={ORANGE} w={3}/>
        <T x={70} y={164} a="middle">diiode dans l’eau</T><T x={70} y={181} a="middle" c={GRIS}>(brun)</T>
        <T x={230} y={164} a="middle">diiode dans le</T><T x={230} y={181} a="middle">cyclohexane <tspan fill={I2_ORG} fontWeight="800">(violet)</tspan></T>
        <T x={150} y={202} a="middle" c={VERT} w={800}>qui se ressemble s’assemble</T>
      </svg>
      <ul style={liste}>
        <li><em>Un soluté passe dans la phase où il est le plus soluble : le diiode (apolaire) quitte l’eau (polaire) pour le cyclohexane (apolaire).</em></li>
        <li><strong>Constat :</strong> la phase du haut devient violette, l’eau se décolore.</li>
        <li><strong>Idée fausse :</strong> « le soluté reste là où on l’a mis ». <strong>Vrai :</strong> il va vers le solvant qui le dissout le mieux.</li>
      </ul>
    </div>
  );
}

// ── Carte C : trois critères d'un solvant extracteur (carte posée sur « Les gestes ») ──
export function FicheCriteres() {
  return (
    <div>
      <svg viewBox="0 0 300 210" style={svgStyle} role="img" aria-label="Trois critères d'un solvant extracteur : il n'est pas miscible avec l'eau, il dissout mieux l'espèce que l'eau, il est facile à éliminer">
        <g>
          <rect x="22" y="14" width="40" height="22" fill={ORG}/><rect x="22" y="36" width="40" height="22" fill={EAU}/><rect x="22" y="14" width="40" height="44" fill="none" stroke={GRIS} strokeWidth="2"/>
          <T x={78} y={32} w={800} c={VERT}>1. non miscible</T><T x={78} y={50}>avec l’eau (2 phases)</T>
        </g>
        <g>
          <rect x="22" y="74" width="40" height="22" fill={ORG}/><rect x="22" y="96" width="40" height="22" fill={EAU}/><rect x="22" y="74" width="40" height="44" fill="none" stroke={GRIS} strokeWidth="2"/>
          <circle cx="42" cy="108" r="5" fill={I2_EAU}/><circle cx="42" cy="84" r="5" fill={I2_ORG}/><Arr x1={42} y1={101} x2={42} y2={91} c={ORANGE} w={2.4}/>
          <T x={78} y={92} w={800} c={BLEU}>2. dissout mieux</T><T x={78} y={110}>l’espèce que l’eau</T>
        </g>
        <g>
          <path d="M42,158 L42,170 L28,198 L56,198 L42,170" fill="#f1f5f9" stroke={GRIS} strokeWidth="2" strokeLinejoin="round"/>
          <path d="M34,152 C30,146 38,144 34,138 M44,152 C40,146 48,144 44,138 M54,152 C50,146 58,144 54,138" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round"/>
          <T x={78} y={172} w={800} c={ORANGE}>3. facile à éliminer</T><T x={78} y={190}>(volatil, peu toxique)</T>
        </g>
      </svg>
      <ul style={liste}>
        <li><em>Un bon solvant extracteur donne deux phases avec l’eau et dissout mieux l’espèce à extraire.</em></li>
        <li><strong>Exemple :</strong> le cyclohexane et le dichlorométhane conviennent pour le diiode ; l’éthanol, miscible avec l’eau, ne convient pas.</li>
        <li><strong>À noter :</strong> la position du solvant (dessus ou dessous) ne change pas le choix, elle change seulement le geste.</li>
      </ul>
    </div>
  );
}

// ── Carte D : les quatre gestes (carte posée sur « Une fois ou deux fois ? ») ──
export function FicheGestes() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Quatre gestes dans l'ordre : 1 agiter bouchon en place, 2 dégazer l'ampoule retournée robinet vers le haut, 3 poser sur le support et laisser décanter, 4 retirer le bouchon puis soutirer la phase du bas par le robinet">
        <g>
          <Mini id="fgA" x={30} y={10} s={0.55} haut={I2_ORG} bas={EAU}/>
          <path d="M60,28 L68,22 L60,38 L68,32" fill="none" stroke={ORANGE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <T x={64} y={62} w={800} c={ORANGE}>1. Agiter</T><T x={64} y={78}>bouchon mis</T>
        </g>
        <g transform="translate(150,0)">
          <Mini id="fgB" x={30} y={14} s={0.55} rot={180} haut={I2_ORG} bas={EAU}/>
          <path d="M30,6 L30,-2 M24,6 L24,0 M36,6 L36,0" fill="none" stroke={BLEU} strokeWidth="2" strokeLinecap="round" transform="translate(0,8)"/>
          <T x={64} y={62} w={800} c={BLEU}>2. Dégazer</T><T x={64} y={78}>robinet haut</T>
        </g>
        <g transform="translate(0,104)">
          <rect x="8" y="64" width="50" height="4" fill="#94a3b8"/>
          <Mini id="fgC" x={30} y={4} s={0.55} haut={I2_ORG} bas={EAU}/>
          <T x={64} y={32} w={800} c={GRIS}>3. Décanter</T><T x={64} y={48}>sur support</T>
        </g>
        <g transform="translate(150,104)">
          <Mini id="fgD" x={30} y={4} s={0.55} haut={I2_ORG} bas={EAU} inter={62} bouchon={false} ouvert/>
          <path d="M44,70 L44,80" stroke={EAU} strokeWidth="3" strokeLinecap="round"/>
          <T x={64} y={32} w={800} c={ROUGE}>4. Soutirer</T><T x={64} y={48}>phase du bas</T>
        </g>
      </svg>
      <ul style={liste}>
        <li><em>Agiter, dégazer, décanter, puis soutirer : toujours dans cet ordre.</em></li>
        <li><strong>Dégazer :</strong> ampoule retournée, robinet vers le haut, pour évacuer la surpression.</li>
        <li><strong>Avant d’ouvrir le robinet :</strong> retirer le bouchon, sinon rien ne coule. On soutire la phase du <strong>bas</strong> ; celle du haut se récupère par le haut.</li>
      </ul>
    </div>
  );
}

// ── Carte E : plusieurs petites extractions (carte posée sur « Le bilan ») ──
export function FicheFractionner() {
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="Pour 20 mL de cyclohexane au total, une seule extraction de 20 mL extrait environ 76 % du diiode de 50 mL d'eau, deux extractions de 10 mL en extraient environ 85 %">
        <T x={150} y={16} a="middle" c={GRIS} w={800}>diiode extrait de 50 mL d’eau</T>
        <T x={8} y={52} w={700}>1 × 20 mL</T><rect x="84" y="36" width="129" height="22" rx="3" fill={BLEU}/><T x={220} y={52} w={800} c={BLEU}>76 %</T>
        <T x={8} y={92} w={700}>2 × 10 mL</T><rect x="84" y="76" width="145" height="22" rx="3" fill={VERT}/><T x={236} y={92} w={800} c={VERT}>85 %</T>
        <T x={150} y={124} a="middle" c={ORANGE} w={800}>même volume total : 20 mL</T>
        <T x={150} y={142} a="middle" c={GRIS}>du solvant neuf à chaque fois</T>
      </svg>
      <ul style={liste}>
        <li><em>Pour un même volume de solvant, plusieurs petites extractions extraient plus qu’une grande.</em></li>
        <li><strong>Exemple</strong> (valeurs illustratives du modèle de la simulation, cyclohexane) : 1 × 20 mL → 76 % ; 2 × 10 mL → 85 %.</li>
        <li><strong>Limite :</strong> chaque extraction coûte du temps et des gestes : on s’arrête quand le gain devient faible.</li>
        <li><strong>Idée fausse :</strong> « tout le solvant d’un coup, c’est mieux ». <strong>Vrai :</strong> fractionner est plus efficace.</li>
      </ul>
    </div>
  );
}
