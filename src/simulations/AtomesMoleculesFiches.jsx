// Cartes « À retenir » de la simulation « Atomes, ions et molécules : la quête de l'octet » (sim 57, 2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut, et ses exemples sont différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 12,5 à 16 (≥ 9 px rendus).
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 360, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const pt = (cx, cy, r, k, n, dec = 0) => [cx + r * Math.cos(-Math.PI / 2 + (2 * Math.PI * (k + dec)) / n), cy + r * Math.sin(-Math.PI / 2 + (2 * Math.PI * (k + dec)) / n)];

// Atome en couches : cercles concentriques et électrons ; la dernière couche (valence) est en orange
const Atome = ({ cx, cy, couches, rayons }) => (
  <g>
    <circle cx={cx} cy={cy} r="2.5" fill={GRIS}/>
    {couches.map((n, i) => {
      const derniere = i === couches.length - 1, r = rayons[i];
      return <g key={i}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={derniere ? ORANGE : '#94a3b8'} strokeWidth={derniere ? 2.2 : 1.1}/>
        {Array.from({ length: n }, (_, k) => { const [x, y] = pt(cx, cy, r, k, n); return <circle key={k} cx={x} cy={y} r={derniere ? 3 : 2.6} fill={derniere ? ORANGE : BLEU}/>; })}
      </g>;
    })}
  </g>
);

// Couche de valence à 8 places : `pleins` électrons (couleur c), les autres places en pointillés
const Valence = ({ cx, cy, pleins, c, creux = [], r = 21 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#f8fafc" stroke={c} strokeWidth="2.2"/>
    {Array.from({ length: 8 }, (_, k) => {
      const [x, y] = pt(cx, cy, r, k, 8);
      if (pleins.includes(k)) return <circle key={k} cx={x} cy={y} r="3.6" fill={c}/>;
      if (creux.includes(k)) return <circle key={k} cx={x} cy={y} r="3.6" fill="#fff" stroke={c} strokeWidth="1.4" strokeDasharray="2 1.5"/>;
      return null;
    })}
  </g>
);
const Tete = ({ x, y }) => <polygon points={`${x},${y} ${x - 10},${y - 5} ${x - 10},${y + 5}`} fill={GRIS}/>;

// ── Carte 1 : gaz nobles ──
export function FicheGazNobles() {
  const noms = [['hélium (Z = 2)', 'duet : 2 e⁻'], ['néon (Z = 10)', 'octet : 8 e⁻'], ['argon (Z = 18)', 'octet : 8 e⁻']];
  return (
    <div>
      <svg viewBox="0 0 300 130" style={svgStyle} role="img" aria-label="Schémas en couches de l’hélium (2 électrons), du néon et de l’argon (8 électrons sur la dernière couche) : la couche de valence est pleine">
        <text x="150" y="15" textAnchor="middle" fontSize="12.5" fill={GRIS}>dernière couche pleine = atome stable</text>
        <Atome cx={50} cy={58} couches={[2]} rayons={[18]}/>
        <Atome cx={150} cy={58} couches={[2, 8]} rayons={[10, 23]}/>
        <Atome cx={250} cy={58} couches={[2, 8, 8]} rayons={[8, 17, 27]}/>
        {noms.map(([n, e], i) => <g key={n}>
          <text x={50 + i * 100} y="104" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>{n}</text>
          <text x={50 + i * 100} y="121" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>{e}</text></g>)}
      </svg>
      <ul style={liste}>
        <li>Les <strong>gaz nobles</strong> sont les seuls atomes qui restent <strong>seuls</strong> : leur couche de valence est <strong>pleine</strong>.</li>
        <li><strong>Octet</strong> = 8 électrons de valence ; <strong>duet</strong> = 2 électrons, pour H et He seulement (leur seule couche est n = 1).</li>
        <li>Tout autre atome cherche à <strong>ressembler au gaz noble le plus proche</strong>.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : électrons de valence (exemple : le carbone) ──
export function FicheValence() {
  const [x0, y0] = [62, 70];
  return (
    <div>
      <svg viewBox="0 0 300 160" style={svgStyle} role="img" aria-label="Le carbone (Z = 6) : 2 électrons sur la couche K, 4 sur la dernière couche L ; il a donc 4 électrons de valence et il lui en manque 4 pour l’octet">
        <circle cx={x0} cy={y0} r="2.5" fill={GRIS}/>
        <circle cx={x0} cy={y0} r="14" fill="none" stroke="#94a3b8" strokeWidth="1.1"/>
        {[0, 1].map(k => { const [x, y] = pt(x0, y0, 14, k, 2); return <circle key={k} cx={x} cy={y} r="2.8" fill={BLEU}/>; })}
        <circle cx={x0} cy={y0} r="30" fill="none" stroke={ORANGE} strokeWidth="2.2"/>
        {Array.from({ length: 8 }, (_, k) => { const [x, y] = pt(x0, y0, 30, k, 8);
          return k % 2 === 0 ? <circle key={k} cx={x} cy={y} r="3.4" fill={ORANGE}/> : <circle key={k} cx={x} cy={y} r="3.4" fill="#fff" stroke={ORANGE} strokeWidth="1.3" strokeDasharray="2 1.5"/>; })}
        <text x="116" y="40" fontSize="14" fontWeight="800" fill={ENCRE}>carbone (Z = 6)</text>
        <text x="116" y="64" fontSize="13" fill={GRIS}>couche K : 2 e⁻</text>
        <text x="116" y="86" fontSize="13" fontWeight="700" fill={ORANGE}>couche L : 4 e⁻</text>
        <text x="116" y="106" fontSize="13" fontWeight="700" fill={ORANGE}>= valence : 4 e⁻</text>
        <rect x="14" y="122" width="272" height="30" rx="15" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="142" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>il manque 8 − 4 = 4 électrons</text>
      </svg>
      <ul style={liste}>
        <li><strong>Électrons de valence = électrons de la dernière couche</strong> (celle dont le numéro n est le plus grand).</li>
        <li>Méthode : ① configuration électronique ② repérer la dernière couche ③ additionner ses électrons.</li>
        <li><strong>Manque pour l’octet = 8 − valence</strong> ; les ronds pointillés sont les places libres.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : cations et anions ──
const Ligne = ({ cy, a, b, fleche, nom, sens }) => (
  <g>
    {a}
    <line x1="72" y1={cy} x2="104" y2={cy} stroke={GRIS} strokeWidth="2.5"/><Tete x={112} y={cy}/>
    <text x="92" y={cy - 10} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={GRIS}>{fleche}</text>
    {b}
    <text x="188" y={cy - 2} fontSize="14" fontWeight="800" fill={sens}>{nom[0]}</text>
    <text x="188" y={cy + 16} fontSize="12.5" fill={GRIS}>{nom[1]}</text>
  </g>
);
export function FicheIons() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Un atome de fluor gagne un électron et devient l’anion fluorure F⁻ à 8 électrons de valence ; un atome de sodium perd un électron et devient le cation Na⁺, dont la dernière couche contient 8 électrons">
        <Ligne cy={42} fleche="+ 1 e⁻" nom={['anion F⁻', 'a gagné des e⁻']} sens={BLEU}
          a={<g><Valence cx={40} cy={42} pleins={[0, 1, 2, 3, 4, 5, 7]} creux={[6]} c={BLEU}/><text x="40" y="47" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>F</text></g>}
          b={<g><Valence cx={150} cy={42} pleins={[0, 1, 2, 3, 4, 5, 6, 7]} c={VERT}/><text x="150" y="47" textAnchor="middle" fontSize="13" fontWeight="800" fill={ENCRE}>F⁻</text></g>}/>
        <text x="40" y="80" textAnchor="middle" fontSize="12.5" fill={GRIS}>7 e⁻</text><text x="150" y="80" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={VERT}>8 e⁻ : stable</text>
        <Ligne cy={128} fleche="− 1 e⁻" nom={['cation Na⁺', 'a perdu des e⁻']} sens={ORANGE}
          a={<g><Valence cx={40} cy={128} pleins={[0]} c={ORANGE}/><text x="40" y="133" textAnchor="middle" fontSize="13" fontWeight="800" fill={ENCRE}>Na</text></g>}
          b={<g><Valence cx={150} cy={128} pleins={[0, 1, 2, 3, 4, 5, 6, 7]} c={VERT}/><text x="150" y="133" textAnchor="middle" fontSize="12" fontWeight="800" fill={ENCRE}>Na⁺</text></g>}/>
        <text x="40" y="166" textAnchor="middle" fontSize="12.5" fill={GRIS}>1 e⁻</text><text x="150" y="166" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={VERT}>8 e⁻ (couche n = 2)</text>
      </svg>
      <ul style={liste}>
        <li>Le <strong>t</strong> de ca<strong>t</strong>ion ressemble à un <strong>+</strong> : <strong>cation = positif</strong> (a perdu des e⁻) ; <strong>anion = négatif</strong> (a gagné des e⁻).</li>
        <li>Un atome gagne ou perd <strong>le moins d’électrons possible</strong> pour ressembler au gaz noble le plus proche (F⁻ et Na⁺ ont 10 e⁻, comme le néon).</li>
        <li>Ions courants : cations Na⁺ · Al³⁺ ; anions F⁻ · O²⁻.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : doublet liant / non liant (F₂) ──
const Barre = ({ x, y, v = false }) => <line x1={v ? x : x - 6} y1={v ? y - 6 : y} x2={v ? x : x + 6} y2={v ? y + 6 : y} stroke={ORANGE} strokeWidth="3" strokeLinecap="round"/>;
export function FicheDoublets() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Molécule F2 : un doublet liant partagé entre les deux atomes de fluor, et trois doublets non liants sur chaque atome ; chaque atome voit 2 + 6 = 8 électrons">
        <text x="80" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill={ENCRE}>F</text>
        <text x="220" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill={ENCRE}>F</text>
        <line x1="98" y1="60" x2="202" y2="60" stroke={BLEU} strokeWidth="4" strokeLinecap="round"/>
        <text x="150" y="46" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>doublet liant</text>
        <text x="150" y="82" textAnchor="middle" fontSize="12.5" fill={GRIS}>partagé</text>
        <Barre x={80} y={34}/><Barre x={80} y={86}/><Barre x={58} y={58} v/>
        <Barre x={220} y={34}/><Barre x={220} y={86}/><Barre x={242} y={58} v/>
        <text x="80" y="112" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>3 doublets</text><text x="80" y="128" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>non liants</text>
        <text x="220" y="112" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>3 doublets</text><text x="220" y="128" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ORANGE}>non liants</text>
        <rect x="14" y="142" width="272" height="30" rx="15" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="162" textAnchor="middle" fontSize="13" fontWeight="800" fill={VERT}>chaque F voit 2 + 6 = 8 électrons</text>
      </svg>
      <ul style={liste}>
        <li><strong>Doublet liant</strong> : 2 électrons <strong>partagés</strong> par deux atomes (la liaison). <strong>Doublet non liant</strong> : 2 électrons qui restent sur <strong>un seul</strong> atome.</li>
        <li>Un doublet liant <strong>compte pour les deux</strong> atomes : c’est ce partage qui les rend stables.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : schéma de Lewis (HF, CH₄, Cl₂) ──
const Trait = ({ x1, y1, x2, y2 }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BLEU} strokeWidth="3" strokeLinecap="round"/>;
const Sym = ({ x, y, t }) => <text x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill={ENCRE}>{t}</text>;
export function FicheLewis() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Schémas de Lewis de HF, CH4 et Cl2 : un tiret bleu entre deux atomes est un doublet liant, un tiret orange sur un atome est un doublet non liant">
        <Sym x={20} y={62} t="H"/><Sym x={74} y={62} t="F"/><Trait x1={31} y1={62} x2={63} y2={62}/>
        <Barre x={74} y={44}/><Barre x={74} y={80}/><Barre x={90} y={62} v/>
        <Sym x={150} y={62} t="C"/><Sym x={150} y={22} t="H"/><Sym x={150} y={102} t="H"/><Sym x={112} y={62} t="H"/><Sym x={188} y={62} t="H"/>
        <Trait x1={150} y1={32} x2={150} y2={50}/><Trait x1={150} y1={74} x2={150} y2={92}/><Trait x1={122} y1={62} x2={139} y2={62}/><Trait x1={161} y1={62} x2={178} y2={62}/>
        <Sym x={228} y={62} t="Cl"/><Sym x={274} y={62} t="Cl"/><Trait x1={242} y1={62} x2={260} y2={62}/>
        <Barre x={228} y={44}/><Barre x={228} y={80}/><Barre x={212} y={62} v/>
        <Barre x={274} y={44}/><Barre x={274} y={80}/><Barre x={290} y={62} v/>
        <text x="46" y="124" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>HF</text>
        <text x="150" y="124" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>CH₄</text>
        <text x="251" y="124" textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>Cl₂</text>
        <line x1="10" y1="144" x2="32" y2="144" stroke={BLEU} strokeWidth="3" strokeLinecap="round"/><text x="38" y="149" fontSize="12.5" fill={GRIS}>entre deux atomes : doublet liant</text>
        <line x1="14" y1="164" x2="28" y2="164" stroke={ORANGE} strokeWidth="3" strokeLinecap="round"/><text x="38" y="169" fontSize="12.5" fill={GRIS}>sur un atome : doublet non liant</text>
      </svg>
      <ul style={liste}>
        <li>Un <strong>tiret = un doublet</strong> d’électrons (2 e⁻). <strong>Entre</strong> deux atomes : doublet <strong>liant</strong> (liaison). <strong>Sur</strong> un atome : doublet <strong>non liant</strong>.</li>
        <li>Chaque atome doit « voir » <strong>8 électrons</strong> (octet), ou <strong>2</strong> pour H (duet). Exemple CH₄ : C voit 4 × 2 = 8, chaque H voit 2.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : combien de liaisons ? ──
const Atom5 = ({ x, t, liens, barres, n }) => (
  <g>
    <Sym x={x} y={62} t={t}/>
    {liens.map(([dx, dy], k) => <Trait key={k} x1={x + dx * 0.55} y1={62 + dy * 0.55} x2={x + dx} y2={62 + dy}/>)}
    {barres.map(([dx, dy, v], k) => <Barre key={k} x={x + dx} y={62 + dy} v={v}/>)}
    <text x={x} y="120" textAnchor="middle" fontSize="18" fontWeight="800" fill={BLEU}>{n}</text>
  </g>
);
export function FicheLiaisons() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Nombre de liaisons de H (1), O (2), N (3), C (4) et Cl (1), avec leurs doublets non liants en orange">
        <Atom5 x={30} t="H" liens={[[20, 0]]} barres={[]} n="1"/>
        <Atom5 x={89} t="O" liens={[[-20, 0], [20, 0]]} barres={[[0, -22], [0, 22]]} n="2"/>
        <Atom5 x={148} t="N" liens={[[-20, 0], [20, 0], [0, 26]]} barres={[[0, -22]]} n="3"/>
        <Atom5 x={207} t="C" liens={[[-20, 0], [20, 0], [0, -26], [0, 26]]} barres={[]} n="4"/>
        <Atom5 x={266} t="Cl" liens={[[22, 0]]} barres={[[0, -22], [0, 22], [-20, 0, true]]} n="1"/>
        <text x="150" y="142" textAnchor="middle" fontSize="12.5" fill={GRIS}>nombre de liaisons (tirets bleus)</text>
        <rect x="14" y="152" width="272" height="30" rx="15" fill="#f0fdf4" stroke={VERT} strokeWidth="2.5"/>
        <text x="150" y="172" textAnchor="middle" fontSize="14" fontWeight="800" fill={VERT}>H – O – N – C : 1 – 2 – 3 – 4</text>
      </svg>
      <ul style={liste}>
        <li><strong>H – O – N – C : 1 – 2 – 3 – 4</strong> liaisons (Cl et F : 1).</li>
        <li>Pour un atome : <strong>liaisons + doublets non liants = 4</strong> (H : 1 liaison seulement).</li>
        <li>Liaisons = 8 − électrons de valence (O : 8 − 6 = 2).</li>
      </ul>
    </div>
  );
}
