// Cartes « À retenir » de la simulation Solubilité et miscibilité (sim 53) : un schéma dessiné et une idée mémorisable par carte.
const GRIS = '#475569', BLEU = '#1d4ed8', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#dc2626', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

const Fl = ({ x1, y1, x2, y2, c = ORANGE }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11;
  const p = `${x2},${y2} ${x2 - L * Math.cos(a - 0.45)},${y2 - L * Math.sin(a - 0.45)} ${x2 - L * Math.cos(a + 0.45)},${y2 - L * Math.sin(a + 0.45)}`;
  return <g><line x1={x1} y1={y1} x2={x2 - 8 * Math.cos(a)} y2={y2 - 8 * Math.sin(a)} stroke={c} strokeWidth="2.5" strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};

// Bécher : coin haut gauche (x, y), largeur w, hauteur h ; couches = [[fraction du bas, couleur], …] du bas vers le haut
const forme = (x, y, w, h, top) => `M${x},${top} L${x},${y + h - 9} Q${x},${y + h} ${x + 9},${y + h} L${x + w - 9},${y + h} Q${x + w},${y + h} ${x + w},${y + h - 9} L${x + w},${top} Z`;
function Becher({ x, y, w = 70, h = 90, couches = [], grains = false }) {
  return (
    <g>
      {couches.map(([frac, c], i) => {
        const bas = couches.slice(0, i).reduce((s, q) => s + q[0], 0), haut = y + h * (1 - bas - frac);
        return i === 0
          ? <path key={i} d={forme(x, y, w, h, haut)} fill={c}/>
          : <rect key={i} x={x} y={haut} width={w} height={h * frac} fill={c}/>;
      })}
      {grains && [[12, 8], [24, 4], [36, 9], [50, 5], [60, 9], [30, 12]].map(([dx, dy], i) => <polygon key={i} points={`${x + dx},${y + h - dy - 6} ${x + dx + 6},${y + h - dy - 3} ${x + dx + 3},${y + h - dy + 3} ${x + dx - 3},${y + h - dy + 1}`} fill="#fff" stroke="#94a3b8" strokeWidth="1.2"/>)}
      <path d={`M${x},${y} L${x},${y + h - 9} Q${x},${y + h} ${x + 9},${y + h} L${x + w - 9},${y + h} Q${x + w},${y + h} ${x + w},${y + h - 9} L${x + w},${y}`} fill="none" stroke={GRIS} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
    </g>
  );
}

// ── Carte : miscible / soluble, et la méthode ──
export function FicheVocab() {
  const EAU = '#bfdbfe', HUILE = '#fde68a';
  return (
    <div>
      <svg viewBox="0 0 400 214" style={svgStyle} role="img" aria-label="Trois béchers : eau et éthanol forment une seule phase, ils sont miscibles ; eau et huile forment deux phases, ils sont non miscibles ; un solide qui se dépose au fond d’un liquide indique une solution saturée, au-delà de la solubilité">
        <rect x="6" y="6" width="258" height="26" rx="13" fill="#e0f2fe"/><text x="135" y="24" textAnchor="middle" fontSize="14" fontWeight="700" fill={BLEU}>deux liquides</text>
        <rect x="276" y="6" width="118" height="26" rx="13" fill="#fdf4ff"/><text x="335" y="24" textAnchor="middle" fontSize="14" fontWeight="700" fill="#7c3aed">un solide</text>
        <Becher x={34} y={50} couches={[[0.72, EAU]]}/>
        <Becher x={160} y={50} couches={[[0.40, EAU], [0.32, HUILE]]}/>
        <Becher x={300} y={50} couches={[[0.72, '#e9d5ff']]} grains/>
        <g fontSize="14" textAnchor="middle">
          <text x="69" y="162" fontWeight="700" fill={VERT}>miscibles</text><text x="69" y="180" fill={GRIS}>1 phase</text>
          <text x="195" y="162" fontWeight="700" fill={ROUGE}>non miscibles</text><text x="195" y="180" fill={GRIS}>2 phases</text>
          <text x="335" y="162" fontWeight="700" fill="#7c3aed">saturée</text><text x="335" y="180" fill={GRIS}>solubilité atteinte</text>
        </g>
        <text x="69" y="204" textAnchor="middle" fontSize="13" fill={GRIS}>eau + éthanol</text>
        <text x="195" y="204" textAnchor="middle" fontSize="13" fill={GRIS}>eau + huile</text>
      </svg>
      <ol style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 1.6 }}>
        <li><strong>État initial</strong> : interactions A…A et B…B (corps purs séparés).</li>
        <li><strong>État final</strong> : interactions A…B (mélange).</li>
        <li><strong>Bilan</strong> = perdu − regagné, comparé à l’agitation thermique (RT ≈ 2,5 kJ/mol à 25 °C).</li>
      </ol>
    </div>
  );
}

// ── Carte : les trois interactions entre molécules ──
export function FicheInteractions() {
  const L = [['liaison hydrogène', 'O–H…O', 17, BLEU, '≈ 17 kJ/mol'], ['dipôle–dipôle', 'molécules polaires', 4, ORANGE, 'quelques kJ/mol'], ['dispersion', 'toutes les molécules', 1.6, '#94a3b8', 'faible, croît avec la taille']];
  return (
    <div>
      <svg viewBox="0 0 400 190" style={svgStyle} role="img" aria-label="Trois interactions classées par énergie : la liaison hydrogène, environ 17 kilojoules par mole, est la plus forte ; le dipôle–dipôle vaut quelques kilojoules par mole ; la dispersion est la plus faible et croît avec la taille de la molécule">
        <text x="12" y="20" fontSize="14" fontWeight="700" fill={GRIS}>énergie de l’interaction</text>
        <Fl x1={190} y1={15} x2={388} y2={15} c="#cbd5e1"/>
        {L.map(([nom, ou, v, c, txt], i) => {
          const y = 36 + i * 52, w = Math.max(16, v / 17 * 250);
          return (
            <g key={nom}>
              <text x="12" y={y + 14} fontSize="14" fontWeight="700" fill={ENCRE}>{nom}</text>
              <text x="12" y={y + 32} fontSize="13" fill={GRIS}>{ou}</text>
              <rect x="150" y={y + 2} width={w} height="26" rx="13" fill={c}/>
              <text x={150 + w + 8} y={y + 20} fontSize="13" fontWeight="700" fill={c === '#94a3b8' ? GRIS : c}>{w > 200 ? '' : txt}</text>
              {w > 200 && <text x={150 + w - 14} y={y + 20} textAnchor="end" fontSize="13" fontWeight="700" fill="#fff">{txt}</text>}
            </g>
          );
        })}
      </svg>
      <ul style={liste}>
        <li><em>Plus l’interaction est forte, plus elle coûte à rompre.</em></li>
        <li>Eau + éthanol : liaison H remplacée par liaison H → petite perte. Eau + hexane : liaisons H perdues, non remplacées → grosse perte.</li>
        <li>« Qui se ressemble s’assemble » : la perte est faible si A…B ressemble à A…A et B…B.</li>
      </ul>
    </div>
  );
}

// ── Carte : échelle continue de polarité ──
const Lab = ({ X, f, n, p, y, anchor = 'middle' }) => <g><text x={X(f)} y={y} textAnchor={anchor} fontSize="14" fontWeight="700" fill={ENCRE}>{n}</text><text x={X(f)} y={y + 16} textAnchor={anchor} fontSize="13" fill={GRIS}>{p} %</text></g>;
export function FichePolarite() {
  const X = f => 24 + f / 0.9 * 352;
  const up0 = [[0.10, 'Soudan', 10], [0.60, 'carminique', 60], [0.89, 'eau', 89]], up1 = [[0.74, 'méthanol', 74]], down = [[0.35, 'octanol', 35], [0.67, 'éthanol', 67]];
  return (
    <div>
      <svg viewBox="0 0 400 200" style={svgStyle} role="img" aria-label="Échelle de polarité de l’apolaire au polaire : rouge Soudan 10 pour cent, octanol 35, acide carminique 60, éthanol 67, méthanol 74, eau environ 89 pour cent de part polaire de la cohésion">
        <defs><linearGradient id="gpol" x1="0" x2="1"><stop offset="0" stopColor="#fcd34d"/><stop offset="1" stopColor="#3b82f6"/></linearGradient></defs>
        <rect x="14" y="98" width="372" height="18" rx="9" fill="url(#gpol)"/>
        <line x1={X(0.74)} y1="56" x2={X(0.74)} y2="98" stroke="#94a3b8" strokeWidth="1.5"/>
        {[...up0, ...up1, ...down].map(([f]) => <circle key={f} cx={X(f)} cy="107" r="6" fill="#fff" stroke={ENCRE} strokeWidth="2.5"/>)}
        {up0.map(([f, n, p]) => <Lab X={X} key={n} f={f} n={n} p={p} y={62} anchor={f > 0.85 ? 'end' : 'middle'}/>)}
        <Lab X={X} f={0.74} n="méthanol" p={74} y={18}/>
        {down.map(([f, n, p]) => <Lab X={X} key={n} f={f} n={n} p={p} y={138}/>)}
        <text x="14" y="190" fontSize="13" fontWeight="700" fill="#92400e">← apolaire : dispersion</text>
        <text x="386" y="190" textAnchor="end" fontSize="13" fontWeight="700" fill={BLEU}>polaire : OH, dipôles →</text>
      </svg>
      <ul style={liste}>
        <li><em>Une molécule n’est ni « polaire » ni « apolaire » : sa cohésion mêle dispersion, dipôles et liaisons H.</em></li>
        <li>Alcool : partie <strong>hydrophile</strong> (OH) + partie <strong>lipophile</strong> (chaîne). Plus la chaîne s’allonge, moins l’alcool est miscible à l’eau.</li>
      </ul>
    </div>
  );
}

// Un ion entouré de 4 molécules d'eau ; versIon = 'O' (l'oxygène regarde l'ion) ou 'H' (un hydrogène regarde l'ion)
function Eau({ x, y, ang, versIon }) {
  // ang : direction (radians) de l'ion vers la molécule ; la molécule est dessinée avec l'axe d'orientation ang
  const R = (dx, dy) => [x + dx * Math.cos(ang) - dy * Math.sin(ang), y + dx * Math.sin(ang) + dy * Math.cos(ang)];
  // dans le repère local, l'ion est à gauche (−x). O au centre ; H à ±52° du côté opposé (O vers l'ion) ou H proche de l'ion (H vers l'ion)
  const H = versIon === 'O' ? [R(9, -8), R(9, 8)] : [R(-8, -7), R(8, 9)];
  const O = R(0, 0);
  return <g><line x1={O[0]} y1={O[1]} x2={H[0][0]} y2={H[0][1]} stroke={GRIS} strokeWidth="2"/><line x1={O[0]} y1={O[1]} x2={H[1][0]} y2={H[1][1]} stroke={GRIS} strokeWidth="2"/>
    <circle cx={O[0]} cy={O[1]} r="8" fill="#fca5a5" stroke={ROUGE} strokeWidth="1.5"/>{H.map((h, i) => <circle key={i} cx={h[0]} cy={h[1]} r="5" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.5"/>)}</g>;
}
function Hydrate({ cx, cy, ion, fill, stroke, versIon }) {
  return (
    <g>
      {[[Math.PI, 0], [0, 0], [-Math.PI / 2, 0], [Math.PI / 2, 0]].map(([ang], i) => <Eau key={i} x={cx + 50 * Math.cos(ang)} y={cy + 36 * Math.sin(ang)} ang={ang + Math.PI} versIon={versIon}/>)}
      <circle cx={cx} cy={cy} r="24" fill={fill} stroke={stroke} strokeWidth="2.5"/><text x={cx} y={cy + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill={ENCRE}>{ion}</text>
    </g>
  );
}

// ── Carte : dissoudre NaCl (ions entourés par le solvant, solubilité très variable) ──
export function FicheNaCl() {
  const barres = [['eau', 360, '360 g/kg', VERT], ['éthanol', 0.65, '0,65 g/kg', ORANGE], ['acétone', 0.0004, '0,0004 g/kg', ROUGE]];
  const Lg = v => (Math.log10(v) + 4) / 7 * 210;
  return (
    <div>
      <svg viewBox="0 0 400 252" style={svgStyle} role="img" aria-label="Dissolution du sel : l’eau tourne son oxygène vers Na plus et un hydrogène vers Cl moins ; la solubilité de NaCl, en échelle logarithmique, est de 360 grammes par kilogramme dans l’eau, 0,65 dans l’éthanol et 0,0004 dans l’acétone">
        <Hydrate cx={100} cy={60} ion="Na⁺" fill="#fde68a" stroke={ORANGE} versIon="O"/>
        <Hydrate cx={300} cy={60} ion="Cl⁻" fill="#bbf7d0" stroke={VERT} versIon="H"/>
        <text x="100" y="128" textAnchor="middle" fontSize="13" fill={GRIS}>côté O (δ−) vers l’ion +</text>
        <text x="300" y="128" textAnchor="middle" fontSize="13" fill={GRIS}>côté H (δ+) vers l’ion −</text>
        <text x="12" y="158" fontSize="14" fontWeight="700" fill={ENCRE}>Solubilité de NaCl</text><text x="388" y="158" textAnchor="end" fontSize="13" fill={GRIS}>échelle logarithmique</text>
        {barres.map(([n, v, t, c], i) => {
          const y = 168 + i * 26, w = Math.max(14, Lg(v));
          return <g key={n}><text x="12" y={y + 17} fontSize="14" fontWeight="700" fill={ENCRE}>{n}</text><rect x="86" y={y} width={w} height="22" rx="11" fill={c}/><text x={86 + w + 8} y={y + 17} fontSize="13" fontWeight="700" fill={c}>{t}</text></g>;
        })}
      </svg>
      <ul style={liste}>
        <li>Dissoudre le sel : défaire le cristal (≈ 720 kJ/mol) puis entourer chaque ion de solvant. Dans l’eau, les deux termes sont presque égaux.</li>
        <li><em>Perdre quelques dizaines de kJ/mol sur la solvatation suffit pour que le sel ne se dissolve plus.</em></li>
      </ul>
    </div>
  );
}

// ── Carte : extraction du diiode par le cyclohexane ──
export function FicheExtraction() {
  return (
    <div>
      <svg viewBox="0 0 400 214" style={svgStyle} role="img" aria-label="Extraction du diiode : avant, une seule phase aqueuse brune ; on ajoute le cyclohexane, on agite et on laisse décanter ; après, la phase supérieure de cyclohexane est violette car le diiode y est passé, et la phase aqueuse du dessous est presque incolore">
        <Becher x={30} y={34} w={84} h={100} couches={[[0.75, '#fcd9a8']]}/>
        <Becher x={286} y={34} w={84} h={100} couches={[[0.40, '#fef3e2'], [0.34, '#c4b5fd']]}/>
        <Fl x1={130} y1={86} x2={270} y2={86}/>
        <text x="200" y="66" textAnchor="middle" fontSize="14" fontWeight="700" fill={ORANGE}>+ cyclohexane</text>
        <text x="200" y="108" textAnchor="middle" fontSize="13" fill={GRIS}>on agite, on décante</text>
        <text x="72" y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>avant</text><text x="328" y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>après</text>
        <text x="72" y="156" textAnchor="middle" fontSize="14" fill={GRIS}>I₂ dans l’eau</text>
        <g fontSize="13" textAnchor="middle"><text x="328" y="150" fontWeight="700" fill="#6d28d9">cyclohexane + I₂</text><text x="328" y="166" fill={GRIS}>phase du dessus</text></g>
        <text x="328" y="186" textAnchor="middle" fontSize="13" fill={GRIS}>eau : presque incolore</text>
        <text x="200" y="208" textAnchor="middle" fontSize="13" fontWeight="700" fill={VERT}>I₂ très soluble dans le cyclohexane, non miscible à l’eau</text>
      </svg>
      <ol style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 1.6 }}>
        <li>Le soluté doit être <strong>très soluble</strong> dans le solvant extracteur.</li>
        <li>Ce solvant doit être <strong>non miscible</strong> à la phase d’origine.</li>
        <li><em>Agiter, laisser décanter, séparer les deux phases.</em></li>
      </ol>
    </div>
  );
}

// ── Carte : la balance du bilan ──
const Chip = ({ x, c, bg, t1, t2 }) => (
  <g><rect x={x} y="128" width="122" height="62" rx="12" fill={bg} stroke={c} strokeWidth="2"/>
    <text x={x + 61} y="152" textAnchor="middle" fontSize="14" fontWeight="700" fill={c}>{t1}</text>
    <text x={x + 61} y="172" textAnchor="middle" fontSize="13" fill={GRIS}>{t2}</text></g>
);
export function FicheBilan() {
  return (
    <div>
      <svg viewBox="0 0 400 200" style={svgStyle} role="img" aria-label="Balance du bilan : on compare ce que l’on perd en défaisant les interactions initiales A…A et B…B à ce que l’on regagne avec les interactions A…B ; petite perte, mélange ; grosse perte, deux phases ; perte de l’ordre de l’agitation thermique, cas limite">
        <line x1="200" y1="30" x2="200" y2="108" stroke={GRIS} strokeWidth="4" strokeLinecap="round"/>
        <rect x="170" y="106" width="60" height="9" rx="4.5" fill={GRIS}/>
        <line x1="70" y1="42" x2="330" y2="30" stroke={GRIS} strokeWidth="4" strokeLinecap="round"/>
        <g stroke={GRIS} strokeWidth="1.8"><line x1="70" y1="42" x2="30" y2="56"/><line x1="70" y1="42" x2="110" y2="50"/><line x1="330" y1="30" x2="290" y2="44"/><line x1="330" y1="30" x2="370" y2="38"/></g>
        <path d="M30,56 L110,50 L96,86 L44,88 Z" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M290,44 L370,38 L356,74 L304,76 Z" fill="#dcfce7" stroke={VERT} strokeWidth="2.5" strokeLinejoin="round"/>
        <text x="70" y="78" textAnchor="middle" fontSize="14" fontWeight="700" fill={ROUGE}>perdu</text>
        <text x="330" y="66" textAnchor="middle" fontSize="14" fontWeight="700" fill={VERT}>regagné</text>
        <text x="70" y="108" textAnchor="middle" fontSize="13" fill={GRIS}>A…A et B…B</text><text x="330" y="96" textAnchor="middle" fontSize="13" fill={GRIS}>A…B</text>
        <Chip x={6} c={VERT} bg="#f0fdf4" t1="petite perte" t2="miscibles"/>
        <Chip x={139} c={ORANGE} bg="#fffbeb" t1="≈ RT" t2="cas limite"/>
        <Chip x={272} c={ROUGE} bg="#fef2f2" t1="grosse perte" t2="deux phases"/>
      </svg>
      <ul style={liste}>
        <li><strong>Liquides</strong> : miscibles ou non. <strong>Solide dans un liquide</strong> : soluble ou non (solubilité limitée).</li>
        <li><em>Qui se ressemble s’assemble : on compare l’état initial à l’état final.</em></li>
      </ul>
    </div>
  );
}
