// Schémas neutres pour exercices d'analyse : on dessine la situation (objets, montage, noms), jamais une valeur, un résultat ni un sens à trouver.
// Chaque composant est appelé par Visuel() avec les champs du schéma de l'exercice : { type: 'mobile', objet: 'chariot', … }.
const ENCRE = '#0f172a', GRIS = '#64748b', BLEU = '#2563eb', CLAIR = '#bfdbfe', ROUGE = '#dc2626', PAILLE = '#fef9c3';
const Cadre = ({ h, titre, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 6 }}>
    <svg viewBox={`0 0 480 ${h}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={titre}>
      <defs><marker id="pt10" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={ENCRE} /></marker></defs>
      {children}
    </svg>
  </div>);
const T = ({ x, y, children, s = 17, c = ENCRE, a = 'middle', w }) => <text x={x} y={y} fontSize={s} fill={c} textAnchor={a} fontWeight={w}>{children}</text>;
const Fl = ({ x1, y1, x2, y2, c = ENCRE, w = 2.5 }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} markerEnd="url(#pt10)" />;

// Mobile qui avance sur un sol (horizontal ou en montée) : seul le sens du mouvement est indiqué.
export function Mobile({ objet = 'chariot', sol = 'rail', pente = false }) {
  const a = pente ? -14 : 0;
  return (
    <Cadre h={170} titre={`${objet} en mouvement vers la droite sur un ${sol}`}>
      <g transform={`rotate(${a} 240 130)`}>
        <rect x="30" y="130" width="420" height="22" fill={sol === 'glace' ? '#e0f2fe' : '#e2e8f0'} stroke={GRIS} />
        <T x="240" y="147" s={15} c={GRIS}>{sol}</T>
        <rect x="190" y="82" width="100" height="44" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" />
        <circle cx="210" cy="128" r="7" fill={ENCRE} /><circle cx="270" cy="128" r="7" fill={ENCRE} />
        <T x="240" y="112" w="700">{objet}</T>
        <Fl x1="300" y1="64" x2="400" y2="64" />
        <T x="350" y="52" s={15} c={GRIS}>mouvement</T>
      </g>
    </Cadre>);
}

// Même voiture dans deux situations : route horizontale puis montée.
export function DeuxReliefs() {
  const voiture = (x, y) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="-34" width="80" height="26" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" />
      <circle cx="16" cy="-6" r="7" fill={ENCRE} /><circle cx="64" cy="-6" r="7" fill={ENCRE} />
    </g>);
  return (
    <Cadre h={200} titre="Une voiture sur route horizontale, puis dans une montée">
      <line x1="20" y1="110" x2="220" y2="110" stroke={GRIS} strokeWidth="4" />
      <g>{voiture(70, 104)}</g>
      <T x="120" y="140" s={17}>route horizontale</T>
      <line x1="260" y1="130" x2="460" y2="70" stroke={GRIS} strokeWidth="4" />
      <g transform="rotate(-17 320 118)">{voiture(290, 120)}</g>
      <T x="360" y="160" s={17}>montée</T>
    </Cadre>);
}

// Virage circulaire : trajectoire, repère de Frenet (tangent et normal), sans aucun vecteur accélération.
export function Virage() {
  return (
    <Cadre h={220} titre="Voiture dans un virage circulaire, repère de Frenet">
      <path d="M60 190 A170 170 0 0 1 400 190" fill="none" stroke={GRIS} strokeWidth="3" strokeDasharray="8 6" />
      <circle cx="230" cy="190" r="4" fill={GRIS} /><T x="230" y="212" s={15} c={GRIS}>centre du virage</T>
      <g transform="translate(150 70) rotate(-35)"><rect x="-26" y="-12" width="52" height="24" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" /></g>
      <Fl x1="150" y1="70" x2="214" y2="58" /><T x="224" y="62" s={17} a="start">tangent</T>
      <Fl x1="150" y1="70" x2="170" y2="118" /><T x="180" y="132" s={17} a="start">normal</T>
    </Cadre>);
}

// Même lancer depuis le sol, sur deux astres, sans valeur de portée.
export function LancerDeuxAstres() {
  const un = (x, nom) => (
    <g>
      <line x1={x} y1="150" x2={x + 190} y2="150" stroke={GRIS} strokeWidth="4" />
      <circle cx={x + 12} cy="138" r="9" fill={CLAIR} stroke={BLEU} strokeWidth="2" />
      <Fl x1={x + 12} y1="138" x2={x + 62} y2="96" />
      <T x={x + 78} y="92" s={16} a="start">v₀</T>
      <path d={`M${x + 12} 138 Q${x + 96} 20 ${x + 180} 138`} fill="none" stroke={GRIS} strokeWidth="2" strokeDasharray="6 5" />
      <path d={`M${x + 42} 138 A32 32 0 0 0 ${x + 32} 118`} fill="none" stroke={ROUGE} strokeWidth="2" />
      <T x={x + 58} y="132" s={16} c={ROUGE}>α</T>
      <T x={x + 96} y="182" w="700">{nom}</T>
    </g>);
  return <Cadre h={196} titre="Un même lancer depuis le sol, sur Terre puis sur la Lune">{un(25, 'Terre')}{un(265, 'Lune')}</Cadre>;
}

// Deux récipients (ou un seul) : on nomme ce qu'ils contiennent, aucune valeur.
export function Becher({ gauche = 'solution 1', droite = null, soluteGauche = true }) {
  const un = (x, nom) => (
    <g>
      <path d={`M${x} 40 L${x} 150 Q${x} 160 ${x + 10} 160 L${x + 110} 160 Q${x + 120} 160 ${x + 120} 150 L${x + 120} 40`} fill="none" stroke={GRIS} strokeWidth="3" />
      <rect x={x + 2} y="80" width="116" height="78" rx="4" fill={CLAIR} opacity="0.7" />
      {soluteGauche && [0, 1, 2, 3].map(i => <circle key={i} cx={x + 30 + i * 22} cy={110 + (i % 2) * 22} r="4" fill={BLEU} />)}
      <T x={x + 60} y="188" w="700">{nom}</T>
    </g>);
  return <Cadre h={200} titre={droite ? `${gauche} et ${droite}` : gauche}>{droite ? <>{un(80, gauche)}{un(280, droite)}</> : un(180, gauche)}</Cadre>;
}

// Dilution : prélèvement de solution mère, fiole jaugée complétée à l'eau.
export function Dilution({ mere = 'solution mère', eau = 'eau distillée' }) {
  return (
    <Cadre h={210} titre={`Dilution : ${mere} versée dans une fiole jaugée, complétée avec ${eau}`}>
      <path d="M50 70 L50 150 Q50 160 60 160 L120 160 Q130 160 130 150 L130 70" fill="none" stroke={GRIS} strokeWidth="3" />
      <rect x="52" y="100" width="76" height="58" fill={CLAIR} opacity="0.8" />
      <T x="90" y="190" w="700" s={16}>{mere}</T>
      <Fl x1="150" y1="120" x2="215" y2="120" />
      <path d="M270 30 L270 80 L240 160 Q236 172 250 172 L330 172 Q344 172 340 160 L310 80 L310 30" fill="none" stroke={GRIS} strokeWidth="3" />
      <rect x="248" y="130" width="84" height="40" fill={CLAIR} opacity="0.8" />
      <line x1="262" y1="50" x2="318" y2="50" stroke={ROUGE} strokeWidth="2" /><T x="290" y="20" s={15} c={ROUGE}>trait de jauge</T>
      <T x="290" y="198" w="700" s={16}>fiole jaugée</T>
      <Fl x1="400" y1="40" x2="400" y2="96" c={BLEU} /><T x="400" y="28" s={16} c={BLEU}>{eau}</T>
    </Cadre>);
}

// Titrage avec suivi conductimétrique ou pH-métrique : burette au-dessus du bécher, sonde plongée dans la solution, agitateur dessous.
export function Titrage({ sonde = 'conductimètre', burette = 'réactif titrant', becher = 'solution à titrer' }) {
  return (
    <Cadre h={260} titre={`Montage de titrage : ${burette} dans la burette, ${becher} dans le bécher, ${sonde}`}>
      <rect x="190" y="10" width="20" height="110" fill="#fff" stroke={GRIS} strokeWidth="3" />
      <rect x="192" y="50" width="16" height="68" fill={CLAIR} />
      <path d="M194 120 L206 120 L200 140 Z" fill={GRIS} />
      <T x="170" y="40" s={16} a="end" w="700">burette</T><T x="170" y="60" s={14} c={GRIS} a="end">{burette}</T>
      <path d="M140 160 L140 215 Q140 225 150 225 L250 225 Q260 225 260 215 L260 160" fill="none" stroke={GRIS} strokeWidth="3" />
      <rect x="142" y="185" width="116" height="38" fill={CLAIR} opacity="0.8" />
      <T x="200" y="252" w="700" s={16}>{becher}</T>
      <rect x="297" y="40" width="20" height="110" rx="6" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" />
      <path d="M307 150 L307 170 L240 205" fill="none" stroke={GRIS} strokeWidth="4" />
      <T x="330" y="90" s={16} a="start" w="700">{sonde}</T>
      <ellipse cx="200" cy="232" rx="22" ry="4" fill="#94a3b8" /><T x="352" y="236" s={14} c={GRIS} a="end">agitateur</T>
    </Cadre>);
}

// Lentille convergente : objet très éloigné, écran, distance lentille–écran à mesurer.
export function LentilleLointain() {
  return (
    <Cadre h={200} titre="Un objet très éloigné, une lentille convergente et un écran">
      <line x1="20" y1="100" x2="460" y2="100" stroke={GRIS} strokeWidth="1.5" strokeDasharray="6 5" />
      <path d="M60 100 L60 60 M46 74 L60 60 L74 74 M60 90 L60 110" stroke="#15803d" strokeWidth="5" fill="none" />
      <T x="60" y="150" s={16} c="#15803d" w="700">objet très éloigné</T>
      <ellipse cx="270" cy="100" rx="12" ry="56" fill={CLAIR} stroke={BLEU} strokeWidth="3" />
      <T x="270" y="182" w="700" s={16}>lentille</T>
      <rect x="400" y="50" width="10" height="100" fill="#e2e8f0" stroke={GRIS} strokeWidth="2" /><T x="405" y="182" w="700" s={16}>écran</T>
      <line x1="270" y1="30" x2="405" y2="30" stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="337" y="22" s={16}>distance mesurée</T>
    </Cadre>);
}

// Microscope optique : lumière d'une couleur donnée traversant l'échantillon, objectif puis oculaire.
export function Microscope({ lumiere = 'lumière' }) {
  return (
    <Cadre h={240} titre={`Microscope éclairé en ${lumiere}`}>
      <rect x="205" y="20" width="70" height="26" rx="6" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><T x="295" y="38" s={16} a="start" w="700">oculaire</T>
      <rect x="220" y="46" width="40" height="112" fill="#f8fafc" stroke={GRIS} strokeWidth="2.5" />
      <rect x="212" y="158" width="56" height="24" rx="4" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><T x="295" y="176" s={16} a="start" w="700">objectif</T>
      <rect x="170" y="196" width="140" height="10" fill="#cbd5e1" stroke={GRIS} strokeWidth="2" /><T x="160" y="204" s={15} c={GRIS} a="end">échantillon</T>
      <Fl x1="240" y1="236" x2="240" y2="212" c={BLEU} />
      <T x="262" y="232" s={16} c={BLEU} a="start">{lumiere}</T>
    </Cadre>);
}

// Diffraction par une fente ou interférences de deux trous : laser, obstacle, écran.
export function Diffraction({ obstacle = 'fente' }) {
  const deux = obstacle === 'deux trous';
  return (
    <Cadre h={190} titre={`Un laser éclaire ${deux ? 'deux trous fins' : 'une fente fine'} ; la figure se forme sur un écran`}>
      <rect x="20" y="82" width="70" height="26" rx="6" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5" /><T x="55" y="128" s={16} w="700">laser</T>
      <Fl x1="90" y1="95" x2="200" y2="95" c={ROUGE} />
      <rect x="206" y="30" width="10" height="130" fill="#94a3b8" />
      {deux ? <><rect x="206" y="78" width="10" height="9" fill="#fff" /><rect x="206" y="104" width="10" height="9" fill="#fff" /><T x="211" y="180" s={16} w="700">deux trous</T></>
        : <><rect x="206" y="88" width="10" height="14" fill="#fff" /><T x="211" y="180" s={16} w="700">fente</T></>}
      <rect x="400" y="30" width="12" height="130" fill="#e2e8f0" stroke={GRIS} strokeWidth="2" /><T x="406" y="180" s={16} w="700">écran</T>
      <line x1="211" y1="20" x2="406" y2="20" stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="308" y="14" s={15} c={GRIS}>distance D</T>
    </Cadre>);
}

// Un faisceau laser éclaire une cible : durée d'éclairement à choisir par l'élève.
export function LaserCible() {
  return (
    <Cadre h={150} titre="Un faisceau laser éclaire une cible">
      <rect x="20" y="58" width="80" height="28" rx="6" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5" /><T x="60" y="112" s={16} w="700">laser</T>
      <Fl x1="100" y1="72" x2="350" y2="72" c={ROUGE} />
      <rect x="360" y="30" width="16" height="84" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><T x="368" y="134" s={16} w="700">cible</T>
    </Cadre>);
}

// Laser dans un prisme, écran derrière.
export function PrismeLaser({ couleur = '#16a34a' }) {
  return (
    <Cadre h={190} titre="Un laser éclaire un prisme ; un écran est placé derrière">
      <rect x="20" y="86" width="70" height="26" rx="6" fill="#dcfce7" stroke={couleur} strokeWidth="2.5" /><T x="55" y="136" s={16} w="700">laser</T>
      <Fl x1="90" y1="99" x2="190" y2="99" c={couleur} />
      <path d="M200 40 L270 160 L130 160 Z" transform="translate(70 0)" fill={CLAIR} fillOpacity="0.6" stroke={BLEU} strokeWidth="2.5" />
      <T x="270" y="180" s={16} w="700">prisme</T>
      <rect x="420" y="30" width="12" height="130" fill="#e2e8f0" stroke={GRIS} strokeWidth="2" /><T x="426" y="180" s={16} w="700">écran</T>
    </Cadre>);
}

// Lampe colorée, filtre, observateur.
export function LampeFiltre({ lampe = 'lampe', filtre = 'filtre', couleurLampe = '#ef4444', couleurFiltre = '#22d3ee' }) {
  return (
    <Cadre h={170} titre={`${lampe}, ${filtre}, observateur`}>
      <circle cx="70" cy="80" r="30" fill={couleurLampe} fillOpacity="0.85" stroke={ENCRE} strokeWidth="2.5" /><T x="70" y="140" s={16} w="700">{lampe}</T>
      <Fl x1="110" y1="80" x2="200" y2="80" />
      <rect x="215" y="30" width="22" height="100" fill={couleurFiltre} fillOpacity="0.55" stroke={ENCRE} strokeWidth="2.5" /><T x="226" y="152" s={16} w="700">{filtre}</T>
      <Fl x1="252" y1="80" x2="340" y2="80" />
      <ellipse cx="400" cy="80" rx="34" ry="20" fill="#fff" stroke={ENCRE} strokeWidth="2.5" /><circle cx="400" cy="80" r="10" fill={ENCRE} /><T x="400" y="130" s={16} w="700">observateur</T>
    </Cadre>);
}

// Chaîne d'un spectrophotomètre : source, sélection de la longueur d'onde, cuve, détecteur.
export function Spectrophotometre() {
  const bloc = (x, nom, c) => <g><rect x={x} y="60" width="86" height="60" rx="8" fill={c} stroke={ENCRE} strokeWidth="2.5" /><T x={x + 43} y="96" s={15} w="700">{nom}</T></g>;
  return (
    <Cadre h={170} titre="Chaîne d'un spectrophotomètre : source, sélection de la longueur d'onde, cuve, détecteur">
      {bloc(14, 'source', PAILLE)}{bloc(124, 'choix de λ', '#e0f2fe')}{bloc(234, 'cuve', '#dcfce7')}{bloc(344, 'détecteur', '#fee2e2')}
      <Fl x1="100" y1="90" x2="122" y2="90" /><Fl x1="210" y1="90" x2="232" y2="90" /><Fl x1="320" y1="90" x2="342" y2="90" />
      <T x="240" y="150" s={16} c={GRIS}>domaine de longueurs d’onde balayé</T>
    </Cadre>);
}

// Circuit simple : générateur et dipôle(s) en boucle, sans aucune valeur.
export function CircuitSimple({ dipole = 'résistor', generateur = 'générateur' }) {
  return (
    <Cadre h={190} titre={`Circuit : ${generateur} et ${dipole} en série`}>
      <rect x="60" y="40" width="360" height="110" rx="4" fill="none" stroke={ENCRE} strokeWidth="2.5" />
      <rect x="40" y="70" width="40" height="50" fill="#fff" /><line x1="52" y1="82" x2="52" y2="108" stroke={ENCRE} strokeWidth="3" /><line x1="68" y1="72" x2="68" y2="118" stroke={ENCRE} strokeWidth="5" />
      <T x="20" y="172" s={15} a="start" c={GRIS}>{generateur}</T>
      <rect x="330" y="26" width="64" height="28" fill="#fff" stroke={ENCRE} strokeWidth="2.5" /><T x="362" y="82" s={16} w="700">{dipole}</T>
    </Cadre>);
}

// Panneau photovoltaïque éclairé par le soleil.
export function PanneauSoleil() {
  return (
    <Cadre h={170} titre="Un panneau photovoltaïque éclairé">
      <circle cx="70" cy="50" r="26" fill="#fde047" stroke="#ca8a04" strokeWidth="2.5" />
      {[0, 1, 2].map(i => <Fl key={i} x1={105 + i * 6} y1={60 + i * 22} x2={215 + i * 6} y2={90 + i * 22} c="#ca8a04" />)}
      <g transform="rotate(-18 330 110)"><rect x="250" y="90" width="150" height="46" fill="#1e3a8a" stroke={ENCRE} strokeWidth="2.5" />
        {[1, 2, 3].map(i => <line key={i} x1={250 + i * 37.5} y1="90" x2={250 + i * 37.5} y2="136" stroke="#93c5fd" strokeWidth="1.5" />)}</g>
      <T x="330" y="162" s={16} w="700">panneau photovoltaïque</T>
    </Cadre>);
}

// Gaz enfermé dans un récipient chauffé : particules, sans aucune vitesse chiffrée.
export function GazChauffe() {
  const p = [[90, 70], [150, 110], [210, 80], [120, 130], [250, 120], [180, 60]];
  return (
    <Cadre h={200} titre="Un gaz enfermé dans un récipient que l'on chauffe">
      <rect x="60" y="30" width="230" height="130" fill="none" stroke={GRIS} strokeWidth="3" />
      {p.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="8" fill={BLEU} /><Fl x1={x + 10} y1={y + 6} x2={x + 28} y2={y + 14} c={BLEU} w={1.8} /></g>)}
      <T x="175" y="186" s={16} w="700">gaz enfermé</T>
      <path d="M345 150 Q330 125 350 105 Q355 125 370 118 Q385 130 372 150 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2" /><T x="360" y="178" s={16} w="700">chauffage</T>
    </Cadre>);
}

// Cube plein entièrement immergé dans de l'eau, maintenu puis lâché : aucune force dessinée.
export function CubeImmerge() {
  return (
    <Cadre h={210} titre="Un cube plein entièrement immergé dans l'eau">
      <path d="M100 30 L100 180 Q100 190 110 190 L370 190 Q380 190 380 180 L380 30" fill="none" stroke={GRIS} strokeWidth="3" />
      <rect x="102" y="64" width="276" height="124" fill={CLAIR} opacity="0.7" /><line x1="102" y1="64" x2="378" y2="64" stroke={BLEU} strokeWidth="2.5" />
      <T x="150" y="52" s={15} c={BLEU}>eau douce</T>
      <rect x="205" y="100" width="70" height="70" fill="#d6b88a" stroke="#7c5a2b" strokeWidth="2.5" /><T x="240" y="142" s={16} w="700">cube</T>
    </Cadre>);
}

// Corde avec deux capteurs : on dit seulement que la distance entre eux est une grandeur de l'exercice.
export function CordeCapteurs() {
  return (
    <Cadre h={190} titre="Une corde tendue avec deux capteurs, une bosse se propage">
      <path d="M20 110 L120 110 Q145 50 170 110 L460 110" fill="none" stroke={ENCRE} strokeWidth="3" />
      <Fl x1="195" y1="60" x2="285" y2="60" />
      <T x="240" y="48" s={15} c={GRIS}>propagation</T>
      {[300, 420].map((x, i) => <g key={i}><rect x={x - 10} y="120" width="20" height="30" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><T x={x} y="172" s={16} w="700">capteur {i + 1}</T></g>)}
      <line x1="300" y1="100" x2="420" y2="100" stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="360" y="92" s={16}>distance</T>
    </Cadre>);
}

// Casserole d'eau qui bout / linge qui sèche : on nomme l'eau avant et après, sans en dire le nom du changement d'état.
export function Casserole() {
  return (
    <Cadre h={200} titre="Une casserole d'eau sur une plaque chauffante, avec de la buée au-dessus">
      <path d="M120 80 L120 150 L320 150 L320 80" fill="none" stroke={ENCRE} strokeWidth="3.5" /><rect x="122" y="110" width="196" height="38" fill={CLAIR} opacity="0.8" />
      <rect x="100" y="150" width="240" height="14" fill="#475569" />
      {[0, 1, 2].map(i => <path key={i} d={`M${170 + i * 50} 70 q-10 -16 0 -30 q10 -14 0 -28`} fill="none" stroke={GRIS} strokeWidth="2.5" />)}
      <T x="220" y="190" s={16} w="700">eau liquide chauffée</T>
    </Cadre>);
}
export function LingeFil() {
  return (
    <Cadre h={180} titre="Du linge mouillé qui sèche sur un fil">
      <line x1="30" y1="40" x2="450" y2="40" stroke={GRIS} strokeWidth="3" />
      {[90, 230, 370].map((x, i) => <g key={i}><path d={`M${x} 40 L${x} 60 L${x + 10} 60 Q${x + 50} 140 ${x + 10} 150 L${x - 50} 150 Q${x - 60} 100 ${x - 10} 60 Z`} fill={CLAIR} stroke={BLEU} strokeWidth="2" opacity="0.8" /></g>)}
      <T x="240" y="174" s={16} w="700">linge mouillé</T>
    </Cadre>);
}

// Cristallisation : solution saturée chaude puis refroidie.
export function Refroidissement({ avant = 'solution saturée à chaud', apres = 'solution refroidie' }) {
  const bec = (x, nom, cristaux) => (
    <g>
      <path d={`M${x} 40 L${x} 150 Q${x} 160 ${x + 10} 160 L${x + 100} 160 Q${x + 110} 160 ${x + 110} 150 L${x + 110} 40`} fill="none" stroke={GRIS} strokeWidth="3" />
      <rect x={x + 2} y="70" width="106" height="88" fill={CLAIR} opacity="0.7" />
      {cristaux && [0, 1, 2, 3, 4].map(i => <rect key={i} x={x + 18 + i * 17} y={140 - (i % 2) * 8} width="10" height="10" fill="#fff" stroke={BLEU} strokeWidth="1.5" />)}
      <T x={x + 55} y="186" s={15} w="700">{nom}</T>
    </g>);
  return <Cadre h={200} titre={`${avant}, puis ${apres}`}>{bec(60, avant, false)}<Fl x1="195" y1="110" x2="265" y2="110" />{bec(300, apres, false)}</Cadre>;
}

// Distillation simple : ballon, colonne, réfrigérant, récepteur.
export function Distillation() {
  return (
    <Cadre h={210} titre="Montage de distillation : ballon chauffé, tête de colonne, réfrigérant, récepteur">
      <circle cx="90" cy="140" r="46" fill={CLAIR} fillOpacity="0.6" stroke={GRIS} strokeWidth="3" /><rect x="82" y="72" width="16" height="30" fill="none" stroke={GRIS} strokeWidth="3" />
      <T x="90" y="205" s={15} w="700">ballon + chauffage</T>
      <path d="M90 72 L90 52 L220 52 L350 110" fill="none" stroke={GRIS} strokeWidth="5" />
      <rect x="215" y="62" width="150" height="26" fill="#e0f2fe" stroke={GRIS} strokeWidth="2" transform="rotate(25 290 75)" /><T x="300" y="40" s={15} w="700">réfrigérant</T>
      <rect x="370" y="140" width="70" height="46" fill="none" stroke={GRIS} strokeWidth="3" /><T x="405" y="205" s={15} w="700">distillat</T>
      <circle cx="90" cy="48" r="3" fill={ENCRE} /><T x="90" y="30" s={15} a="middle">thermomètre</T>
    </Cadre>);
}

// Plaque de CCM : ligne de dépôt, front de l'éluant, deux dépôts (produit, témoin) ; aucune tache après élution.
export function PlaqueCCM() {
  return (
    <Cadre h={220} titre="Plaque de chromatographie sur couche mince : dépôts du produit et du témoin sur la ligne de dépôt">
      <rect x="40" y="14" width="170" height="190" fill="#f8fafc" stroke={GRIS} strokeWidth="2.5" />
      <line x1="40" y1="40" x2="210" y2="40" stroke={BLEU} strokeWidth="2" strokeDasharray="6 4" /><T x="224" y="45" s={15} a="start" c={BLEU}>front de l’éluant</T>
      <line x1="40" y1="170" x2="210" y2="170" stroke={ROUGE} strokeWidth="2" strokeDasharray="6 4" /><T x="224" y="175" s={15} a="start" c={ROUGE}>ligne de dépôt</T>
      <circle cx="90" cy="170" r="6" fill={ENCRE} /><circle cx="160" cy="170" r="6" fill={ENCRE} />
      <T x="90" y="196" s={15} w="700">produit</T><T x="160" y="196" s={15} w="700">témoin</T>
    </Cadre>);
}

// Cisaillement entre deux plaques : un fluide pris entre une plaque fixe et une plaque mobile.
export function Cisaillement() {
  return (
    <Cadre h={170} titre="Fluide cisaillé entre une plaque fixe et une plaque mobile">
      <rect x="110" y="30" width="260" height="14" fill="#94a3b8" stroke={ENCRE} strokeWidth="2" /><Fl x1="380" y1="37" x2="450" y2="37" /><T x="240" y="22" s={15} c={GRIS}>plaque mobile</T>
      <rect x="110" y="44" width="260" height="70" fill={CLAIR} opacity="0.7" /><T x="240" y="86" s={16} w="700">crème</T>
      <rect x="110" y="114" width="260" height="14" fill="#94a3b8" stroke={ENCRE} strokeWidth="2" /><T x="240" y="152" s={15} c={GRIS}>plaque fixe</T>
    </Cadre>);
}

// Huit petites gouttes qui fusionnent en une seule : aucun rayon chiffré, la grosse goutte n'a pas de taille « juste ».
export function Coalescence({ n = 8 }) {
  const pos = [[60, 60], [100, 60], [140, 60], [60, 100], [100, 100], [140, 100], [80, 140], [120, 140]].slice(0, n);
  return (
    <Cadre h={190} titre={`${n} gouttes d'huile identiques qui fusionnent en une seule goutte`}>
      {pos.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="14" fill="#fde68a" stroke="#b45309" strokeWidth="2" />)}
      <Fl x1="190" y1="100" x2="270" y2="100" />
      <circle cx="370" cy="100" r="44" fill="#fde68a" stroke="#b45309" strokeWidth="2.5" strokeDasharray="6 4" /><T x="370" y="106" s={22} w="700">?</T>
      <T x="100" y="182" s={15} c={GRIS}>identiques</T><T x="370" y="170" s={15} c={GRIS}>une seule goutte</T>
    </Cadre>);
}

// Deux lampes de spectres différents éclairent la même peinture.
export function DeuxLampesPeinture() {
  const l = (x, nom, c) => <g><circle cx={x} cy="50" r="24" fill={c} stroke={ENCRE} strokeWidth="2.5" /><T x={x} y="16" s={15} w="700">{nom}</T><Fl x1={x} y1="80" x2={x} y2="130" /></g>;
  return (
    <Cadre h={190} titre="La même peinture éclairée par deux types de lampes">
      {l(120, 'lumière du jour', '#fef9c3')}{l(360, 'lampe à incandescence', '#fdba74')}
      <rect x="60" y="136" width="360" height="30" fill="#a7f3d0" stroke={ENCRE} strokeWidth="2.5" /><T x="240" y="186" s={16} w="700">peinture</T>
    </Cadre>);
}

// Chauffe-eau à résistance : cuve, résistance, arrivée et départ d'eau.
export function ChauffeEau() {
  return (
    <Cadre h={210} titre="Un chauffe-eau électrique : cuve, résistance chauffante, arrivée et départ d'eau">
      <rect x="170" y="30" width="140" height="150" rx="22" fill={CLAIR} fillOpacity="0.6" stroke={ENCRE} strokeWidth="3" />
      <path d="M200 160 L200 120 L230 120 L230 160 L260 160 L260 120 L290 120" fill="none" stroke="#c2410c" strokeWidth="4" /><T x="240" y="200" s={16} w="700">résistance</T>
      <Fl x1="90" y1="150" x2="165" y2="150" c={BLEU} /><T x="90" y="140" s={15} c={BLEU} a="middle">eau froide</T>
      <Fl x1="315" y1="60" x2="400" y2="60" c={ROUGE} /><T x="400" y="50" s={15} c={ROUGE} a="middle">eau chaude</T>
    </Cadre>);
}

// Réservoir à niveau régulé : pompe d'alimentation, soutirage, capteur de niveau.
export function ReservoirRegule() {
  return (
    <Cadre h={210} titre="Réservoir : pompe d'alimentation, soutirage, capteur de niveau">
      <path d="M180 30 L180 170 L320 170 L320 30" fill="none" stroke={ENCRE} strokeWidth="3.5" /><rect x="182" y="90" width="136" height="78" fill={CLAIR} opacity="0.7" /><line x1="182" y1="90" x2="318" y2="90" stroke={BLEU} strokeWidth="2.5" />
      <circle cx="80" cy="40" r="26" fill="#e2e8f0" stroke={ENCRE} strokeWidth="2.5" /><T x="80" y="45" s={14} w="700">pompe</T><path d="M106 40 L180 40" stroke={BLEU} strokeWidth="5" fill="none" markerEnd="url(#pt10)" />
      <path d="M320 150 L420 150" stroke={BLEU} strokeWidth="5" fill="none" markerEnd="url(#pt10)" /><T x="410" y="136" s={16} w="700">soutirage</T>
      <rect x="340" y="52" width="60" height="30" fill="#fff" stroke={ENCRE} strokeWidth="2" /><T x="370" y="72" s={14}>niveau</T><line x1="340" y1="67" x2="318" y2="90" stroke={ENCRE} strokeWidth="1.5" />
    </Cadre>);
}

// Deux charges ponctuelles séparées d'une distance.
export function DeuxCharges() {
  return (
    <Cadre h={140} titre="Deux charges ponctuelles séparées par une distance">
      <circle cx="130" cy="60" r="22" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5" /><T x="130" y="67" s={18} w="700">q₁</T>
      <circle cx="350" cy="60" r="22" fill="#dbeafe" stroke={BLEU} strokeWidth="2.5" /><T x="350" y="67" s={18} w="700">q₂</T>
      <line x1="130" y1="108" x2="350" y2="108" stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="240" y="130" s={17}>d</T>
    </Cadre>);
}

// Deux chariots roulant côte à côte, même vitesse, masses différentes nommées symboliquement.
export function DeuxChariots() {
  const c = (y, m, w) => (
    <g><rect x="120" y={y} width={w} height="34" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" /><T x={120 + w / 2} y={y + 24} w="700">{m}</T>
      <circle cx="136" cy={y + 36} r="6" fill={ENCRE} /><circle cx={104 + w} cy={y + 36} r="6" fill={ENCRE} /><Fl x1={130 + w} y1={y + 17} x2={200 + w} y2={y + 17} /></g>);
  return <Cadre h={160} titre="Deux chariots roulant à la même vitesse">{c(20, 'm', 70)}{c(90, '2 m', 100)}</Cadre>;
}

export const DESSINS_LOT10 = {
  mobile: Mobile, deuxReliefs: DeuxReliefs, virage: Virage, lancerDeuxAstres: LancerDeuxAstres,
  becher: Becher, dilution: Dilution, titrage: Titrage, lentilleLointain: LentilleLointain, microscope: Microscope,
  diffraction: Diffraction, laserCible: LaserCible, prismeLaser: PrismeLaser, lampeFiltre: LampeFiltre, spectrophotometre: Spectrophotometre,
  circuitSimple: CircuitSimple, panneauSoleil: PanneauSoleil, gazChauffe: GazChauffe, cubeImmerge: CubeImmerge, cordeCapteurs: CordeCapteurs,
  casserole: Casserole, lingeFil: LingeFil, refroidissement: Refroidissement, distillation: Distillation, plaqueCCM: PlaqueCCM,
  cisaillement: Cisaillement, coalescence: Coalescence, deuxLampesPeinture: DeuxLampesPeinture, chauffeEau: ChauffeEau,
  reservoirRegule: ReservoirRegule, deuxCharges: DeuxCharges, deuxChariots: DeuxChariots,
};
