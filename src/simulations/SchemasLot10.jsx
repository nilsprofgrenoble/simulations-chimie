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
  const roue = (x) => <g><circle cx={x} cy="126" r="9" fill={ENCRE} /><circle cx={x} cy="126" r="3.5" fill="#fff" /></g>;
  let corps;
  if (objet === 'train') {
    corps = <>
      <rect x="120" y="86" width="90" height="38" rx="5" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" /><rect x="214" y="86" width="90" height="38" rx="5" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" />
      <path d="M308 124 L308 94 Q308 84 322 84 L350 84 Q366 90 372 108 L372 124 Z" fill="#93c5fd" stroke={BLEU} strokeWidth="2.5" /><rect x="326" y="90" width="22" height="14" rx="2" fill="#fff" stroke={BLEU} strokeWidth="1.5" />
      {[132, 192, 226, 286, 326, 354].map(x => <g key={x}><circle cx={x} cy="127" r="7" fill={ENCRE} /></g>)}
      {[134, 160, 236, 262].map(x => <rect key={x} x={x} y="96" width="16" height="12" rx="2" fill="#fff" stroke={BLEU} strokeWidth="1.5" />)}
      <T x="212" y="76" w="700">{objet}</T></>;
  } else if (objet === 'véhicule' || objet === 'voiture') {
    corps = <>
      <path d="M170 124 L170 104 Q170 96 180 94 L204 92 L222 72 Q226 68 232 68 L262 68 Q268 68 272 74 L288 92 L308 96 Q314 98 314 106 L314 124 Z" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M228 74 L216 92 L250 92 L250 74 Z M256 74 L256 92 L284 92 L270 74 Z" fill="#fff" stroke={BLEU} strokeWidth="1.5" />
      {roue(204)}{roue(282)}<T x="242" y="58" w="700">{objet}</T></>;
  } else if (objet === 'caisse') {
    corps = <>
      <rect x="190" y="76" width="100" height="50" fill="#fcd9a8" stroke="#b45309" strokeWidth="2.5" />
      <line x1="190" y1="76" x2="290" y2="126" stroke="#b45309" strokeWidth="1.5" /><line x1="290" y1="76" x2="190" y2="126" stroke="#b45309" strokeWidth="1.5" />
      <T x="240" y="66" w="700">{objet}</T></>;
  } else {
    corps = <>
      <rect x="190" y="82" width="100" height="44" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" />
      <circle cx="210" cy="128" r="7" fill={ENCRE} /><circle cx="270" cy="128" r="7" fill={ENCRE} />
      <T x="240" y="112" w="700">{objet}</T></>;
  }
  return (
    <Cadre h={170} titre={`${objet} en mouvement vers la droite sur un ${sol}`}>
      <g transform={`rotate(${a} 240 130)`}>
        <rect x="30" y="130" width="420" height="22" fill={sol === 'glace' ? '#e0f2fe' : sol === 'route' ? '#cbd5e1' : '#e2e8f0'} stroke={GRIS} />
        {sol === 'route' && <line x1="40" y1="141" x2="440" y2="141" stroke="#fff" strokeWidth="2.5" strokeDasharray="18 12" />}
        <T x="240" y="148" s={15} c={GRIS}>{sol === 'route' ? '' : sol}</T>
        {corps}
        <Fl x1="330" y1="40" x2="430" y2="40" />
        <T x="380" y="28" s={15} c={GRIS}>mouvement</T>
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
export function Virage({ point = false }) {
  return (
    <Cadre h={220} titre={point ? 'Point matériel sur une trajectoire circulaire, repère de Frenet' : 'Voiture dans un virage circulaire, repère de Frenet'}>
      <path d="M60 190 A170 170 0 0 1 400 190" fill="none" stroke={GRIS} strokeWidth="3" strokeDasharray="8 6" />
      <circle cx="230" cy="190" r="4" fill={GRIS} /><T x="230" y="212" s={15} c={GRIS}>{point ? 'centre O du cercle' : 'centre du virage'}</T>
      {point
        ? <><circle cx="150" cy="70" r="8" fill={BLEU} stroke={ENCRE} strokeWidth="2" /><T x="128" y="92" s={17} a="end" w="700">M</T></>
        : <g transform="translate(150 70) rotate(-35)"><rect x="-26" y="-12" width="52" height="24" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" /></g>}
      <Fl x1="150" y1="70" x2="214" y2="58" /><T x="224" y="62" s={17} a="start">tangent</T>
      <Fl x1="150" y1="70" x2="170" y2="118" /><T x="184" y="128" s={17} a="start">normal</T>
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
      <path d="M282 20 L282 84 Q244 96 244 134 Q244 172 290 172 Q336 172 336 134 Q336 96 298 84 L298 20" fill="none" stroke={GRIS} strokeWidth="3" />
      <path d="M247 136 Q247 168 290 168 Q333 168 333 136 Z" fill={CLAIR} opacity="0.8" />
      <line x1="278" y1="44" x2="302" y2="44" stroke={ROUGE} strokeWidth="2" /><T x="268" y="49" s={15} a="end" c={ROUGE}>trait de jauge</T>
      <T x="290" y="196" w="700" s={16}>fiole jaugée</T>
      <Fl x1="372" y1="58" x2="308" y2="30" c={BLEU} /><T x="470" y="84" s={16} a="end" c={BLEU}>{eau}</T>
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
      {sonde && <><rect x="297" y="40" width="20" height="110" rx="6" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" />
      <path d="M307 150 L307 170 L240 205" fill="none" stroke={GRIS} strokeWidth="4" />
      <T x="330" y="90" s={16} a="start" w="700">{sonde}</T></>}
      <ellipse cx="200" cy="232" rx="22" ry="4" fill="#94a3b8" /><T x="270" y="236" s={14} c={GRIS} a="start">barreau aimanté</T>
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
export function LampeFiltre({ observateur = true, lampe = 'lampe', filtre = 'filtre', couleurLampe = '#ef4444', couleurFiltre = '#22d3ee' }) {
  return (
    <Cadre h={170} titre={`${lampe}, ${filtre}, observateur`}>
      <circle cx="70" cy="80" r="30" fill={couleurLampe} fillOpacity="0.85" stroke={ENCRE} strokeWidth="2.5" /><T x="70" y="140" s={16} w="700">{lampe}</T>
      <Fl x1="110" y1="80" x2="200" y2="80" />
      <rect x="215" y="30" width="22" height="100" fill={couleurFiltre} fillOpacity="0.55" stroke={ENCRE} strokeWidth="2.5" /><T x="226" y="152" s={16} w="700">{filtre}</T>
      {observateur && <><Fl x1="252" y1="80" x2="340" y2="80" />
      <ellipse cx="400" cy="80" rx="34" ry="20" fill="#fff" stroke={ENCRE} strokeWidth="2.5" /><circle cx="400" cy="80" r="10" fill={ENCRE} /><T x="400" y="130" s={16} w="700">observateur</T></>}
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
export function CircuitSimple({ dipole = 'résistor', generateur = 'générateur', appareils = false }) {
  const d = /condensateur/.test(dipole) ? 'c' : /lampe/.test(dipole) ? 'l' : 'r';
  return (
    <Cadre h={190} titre={`Circuit : ${generateur} et ${dipole} en série${appareils ? ', ampèremètre en série et voltmètre en dérivation' : ''}`}>
      <g fill="none" stroke={ENCRE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="60,88 60,56 205,56" /><polyline points="275,56 420,56 420,150 60,150 60,112" />
        {d === 'r' && <rect x="205" y="42" width="70" height="28" fill="#fff" />}
        {d === 'c' && <><line x1="236" y1="38" x2="236" y2="74" strokeWidth="4" /><line x1="250" y1="38" x2="250" y2="74" strokeWidth="4" /><line x1="205" y1="56" x2="236" y2="56" /><line x1="250" y1="56" x2="275" y2="56" /></>}
        {d === 'l' && <><circle cx="240" cy="56" r="20" fill="#fff" /><line x1="226" y1="42" x2="254" y2="70" /><line x1="254" y1="42" x2="226" y2="70" /></>}
        <line x1="46" y1="88" x2="74" y2="88" strokeWidth="4" /><line x1="53" y1="112" x2="67" y2="112" strokeWidth="6" />
        {appareils && <><circle cx="420" cy="103" r="15" fill="#fff" /><polyline points="170,56 170,22 207,22" /><polyline points="273,22 310,22 310,56" /><circle cx="240" cy="22" r="15" fill="#fff" /></>}
      </g>
      {appareils && <><T x="420" y="109" s={16} w="700">A</T><T x="240" y="28" s={16} w="700">V</T></>}
      <T x="70" y="84" s={16} a="start" c={ROUGE} w="700">+</T><T x="70" y="126" s={16} a="start" c={BLEU} w="700">−</T>
      <T x="240" y="104" s={16} w="700">{dipole}</T>
      <T x="60" y="176" s={15} c={GRIS}>{generateur}</T>
    </Cadre>);
}

// Panneau photovoltaïque éclairé par le soleil.
export function PanneauSoleil() {
  return (
    <Cadre h={190} titre="Un panneau photovoltaïque éclairé">
      <circle cx="70" cy="50" r="26" fill="#fde047" stroke="#ca8a04" strokeWidth="2.5" />
      {[0, 1, 2].map(i => <Fl key={i} x1={105 + i * 6} y1={60 + i * 22} x2={215 + i * 6} y2={90 + i * 22} c="#ca8a04" />)}
      <g transform="rotate(-18 330 110)"><rect x="250" y="90" width="150" height="46" fill="#1e3a8a" stroke={ENCRE} strokeWidth="2.5" />
        {[1, 2, 3].map(i => <line key={i} x1={250 + i * 37.5} y1="90" x2={250 + i * 37.5} y2="136" stroke="#93c5fd" strokeWidth="1.5" />)}</g>
      <T x="330" y="184" s={16} w="700">panneau photovoltaïque</T>
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
export function Casserole({ liquide = 'eau liquide chauffée' }) {
  return (
    <Cadre h={200} titre="Une casserole d'eau sur une plaque chauffante, avec de la buée au-dessus">
      <path d="M120 80 L120 150 L320 150 L320 80" fill="none" stroke={ENCRE} strokeWidth="3.5" /><rect x="122" y="110" width="196" height="38" fill={CLAIR} opacity="0.8" />
      <rect x="100" y="150" width="240" height="14" fill="#475569" />
      {[0, 1, 2].map(i => <path key={i} d={`M${170 + i * 50} 70 q-10 -16 0 -30 q10 -14 0 -28`} fill="none" stroke={GRIS} strokeWidth="2.5" />)}
      <T x="220" y="190" s={16} w="700">{liquide}</T>
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
export function DeuxCharges({ objet = null }) {
  return (
    <Cadre h={objet ? 170 : 140} titre={objet ? `Deux ${objet}s chargées séparées par une distance` : 'Deux charges ponctuelles séparées par une distance'}>
      <circle cx="130" cy="60" r="22" fill="#fee2e2" stroke={ROUGE} strokeWidth="2.5" /><T x="130" y="67" s={18} w="700">q₁</T>
      <circle cx="350" cy="60" r="22" fill="#dbeafe" stroke={BLEU} strokeWidth="2.5" /><T x="350" y="67" s={18} w="700">q₂</T>
      {objet && <><T x="130" y="104" s={15} c={GRIS}>{objet} 1</T><T x="350" y="104" s={15} c={GRIS}>{objet} 2</T></>}
      <line x1="130" y1={objet ? 126 : 108} x2="350" y2={objet ? 126 : 108} stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="240" y={objet ? 150 : 130} s={17}>distance d entre les centres</T>
    </Cadre>);
}

// Deux chariots roulant côte à côte, même vitesse, masses différentes nommées symboliquement.
export function DeuxChariots() {
  const c = (y, m, w) => (
    <g><rect x="120" y={y} width={w} height="34" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" /><T x={120 + w / 2} y={y + 24} w="700">{m}</T>
      <circle cx="136" cy={y + 36} r="6" fill={ENCRE} /><circle cx={104 + w} cy={y + 36} r="6" fill={ENCRE} /><Fl x1={130 + w} y1={y + 17} x2={200 + w} y2={y + 17} /></g>);
  return <Cadre h={160} titre="Deux chariots roulant à la même vitesse">{c(20, 'm', 70)}{c(90, '2 m', 100)}</Cadre>;
}

// ── Schémas pour les exercices « S’approprier » : situation et noms des objets, jamais de valeur ──

// Condensateur plan : deux armatures reliées à un générateur ; la distance entre les armatures est nommée, pas chiffrée.
export function Plaques({ objet = null }) {
  return (
    <Cadre h={200} titre="Deux armatures planes parallèles reliées à un générateur">
      <rect x="130" y="40" width="220" height="12" fill="#94a3b8" stroke={ENCRE} strokeWidth="2" /><rect x="130" y="140" width="220" height="12" fill="#94a3b8" stroke={ENCRE} strokeWidth="2" />
      <T x="368" y="50" s={15} a="start" c={GRIS}>armature</T><T x="368" y="150" s={15} a="start" c={GRIS}>armature</T>
      <line x1="110" y1="52" x2="110" y2="140" stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="96" y="100" s={17} a="end">d</T>
      <path d="M130 46 L60 46 L60 80 M60 112 L60 146 L130 146" fill="none" stroke={ENCRE} strokeWidth="2.5" />
      <line x1="48" y1="80" x2="72" y2="80" stroke={ENCRE} strokeWidth="3" /><line x1="54" y1="92" x2="66" y2="92" stroke={ENCRE} strokeWidth="6" /><T x="48" y="186" s={15} c={GRIS} a="start">générateur</T>
      {objet && <><circle cx="240" cy="96" r="12" fill="#fecaca" stroke={ROUGE} strokeWidth="2.5" /><T x="240" y="128" s={16} w="700">{objet}</T></>}
    </Cadre>);
}

// Rayon lumineux qui traverse un bloc transparent.
export function BlocTransparent({ milieu = 'bloc transparent' }) {
  return (
    <Cadre h={180} titre={`Un rayon lumineux traverse ${milieu}`}>
      <rect x="170" y="40" width="140" height="100" fill={CLAIR} fillOpacity="0.6" stroke={BLEU} strokeWidth="2.5" /><T x="240" y="170" s={16} w="700">{milieu}</T>
      <Fl x1="30" y1="90" x2="165" y2="90" c={ROUGE} /><Fl x1="315" y1="90" x2="450" y2="90" c={ROUGE} />
      <line x1="170" y1="22" x2="310" y2="22" stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="240" y="16" s={15} c={GRIS}>épaisseur traversée</T>
    </Cadre>);
}

// Brûleur sous un récipient d'eau.
export function BruleurBecher({ contenu = 'eau' }) {
  return (
    <Cadre h={210} titre={`Un combustible brûle sous un récipient contenant de ${contenu}`}>
      <path d="M170 30 L170 120 Q170 130 180 130 L300 130 Q310 130 310 120 L310 30" fill="none" stroke={GRIS} strokeWidth="3" /><rect x="172" y="70" width="136" height="58" fill={CLAIR} opacity="0.8" />
      <T x="240" y="104" s={16} w="700">{contenu}</T>
      <path d="M240 190 Q215 165 235 145 Q242 168 262 160 Q275 175 255 190 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2" /><T x="240" y="208" s={15} w="700">combustible qui brûle</T>
    </Cadre>);
}

// Soleil, rayons, Terre : aucun flux chiffré.
export function SoleilTerre() {
  return (
    <Cadre h={170} titre="Le Soleil envoie des rayons vers la Terre">
      <circle cx="60" cy="85" r="38" fill="#fde047" stroke="#ca8a04" strokeWidth="2.5" /><T x="60" y="150" s={16} w="700">Soleil</T>
      {[55, 85, 115].map(y => <Fl key={y} x1="115" y1={y} x2="330" y2={y} c="#ca8a04" />)}
      <circle cx="400" cy="85" r="46" fill="#93c5fd" stroke={BLEU} strokeWidth="2.5" /><T x="400" y="160" s={16} w="700">Terre</T>
    </Cadre>);
}

// Piste de looping : départ en hauteur, boucle circulaire, wagon.
export function Looping() {
  return (
    <Cadre h={210} titre="Piste avec une boucle circulaire ; le wagon part d'une certaine hauteur">
      <path d="M40 40 L150 170 L200 170" fill="none" stroke={GRIS} strokeWidth="4" />
      <circle cx="270" cy="105" r="64" fill="none" stroke={GRIS} strokeWidth="4" />
      <path d="M200 170 L460 170" stroke={GRIS} strokeWidth="4" />
      <rect x="30" y="22" width="30" height="18" rx="4" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" transform="rotate(50 45 31)" /><T x="108" y="44" s={15} c={GRIS} a="start">départ</T>
      <line x1="30" y1="170" x2="30" y2="40" stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x="20" y="110" s={17} a="end">H</T>
      <T x="270" y="200" s={15} c={GRIS}>boucle de rayon R</T>
    </Cadre>);
}

// Balance avec une pièce.
export function Balance({ objet = 'objet pesé', lot = false }) {
  return (
    <Cadre h={170} titre={lot ? `${objet} posé sur une balance` : 'Pesée d\'une pièce sur une balance de précision'}>
      <rect x="150" y="120" width="180" height="32" rx="6" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><rect x="200" y="128" width="80" height="16" rx="3" fill="#fff" stroke={GRIS} strokeWidth="1.5" />
      <rect x="170" y="108" width="140" height="8" fill="#94a3b8" />
      {lot
        ? <><path d="M200 108 Q196 76 218 66 L262 66 Q284 76 280 108 Z" fill="#fde68a" stroke="#b45309" strokeWidth="2.5" />{[[222, 92], [240, 98], [258, 92], [232, 84], [250, 84]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="6" ry="3.5" fill="#d97706" />)}</>
        : <rect x="215" y="76" width="50" height="32" rx="5" fill="#fde68a" stroke="#b45309" strokeWidth="2.5" />}
      <T x="240" y="56" s={16} w="700">{objet}</T><T x="240" y="168" s={15} c={GRIS}>balance de précision</T>
    </Cadre>);
}

// Chauffage à reflux : ballon chauffé surmonté d'un réfrigérant vertical.
export function Reflux() {
  return (
    <Cadre h={230} titre="Montage de chauffage à reflux : ballon chauffé et réfrigérant vertical">
      <rect x="226" y="20" width="28" height="100" fill="#e0f2fe" stroke={GRIS} strokeWidth="2.5" /><T x="300" y="70" s={16} a="start" w="700">réfrigérant</T>
      <Fl x1="206" y1="108" x2="226" y2="108" c={BLEU} w={2} /><Fl x1="274" y1="36" x2="296" y2="36" c={BLEU} w={2} />
      <rect x="232" y="120" width="16" height="28" fill="none" stroke={GRIS} strokeWidth="3" />
      <circle cx="240" cy="186" r="38" fill={CLAIR} fillOpacity="0.6" stroke={GRIS} strokeWidth="3" /><T x="240" y="190" s={14} w="700">mélange</T>
      <path d="M200 226 L280 226" stroke="#475569" strokeWidth="8" /><T x="170" y="224" s={15} c={GRIS} a="end">chauffe-ballon</T>
    </Cadre>);
}

// Chronophotographie d'une chute : positions successives d'une balle le long d'un axe vertical.
export function ChuteLibre() {
  return (
    <Cadre h={230} titre="Positions successives d'une balle en chute libre">
      <line x1="90" y1="20" x2="90" y2="210" stroke={ENCRE} strokeWidth="2" markerEnd="url(#pt10)" /><T x="104" y="214" s={15} a="start" c={GRIS}>axe vertical</T>
      {[30, 62, 104, 160, 226].map((y, i) => i < 4 && <circle key={i} cx="170" cy={y} r="11" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" />)}
      <T x="210" y="40" s={15} c={GRIS} a="start">positions à intervalles de temps égaux</T>
    </Cadre>);
}

// Diapositive, lentille de projection, écran.
export function Projection() {
  return (
    <Cadre h={190} titre="Un projecteur : diapositive, lentille, écran">
      <rect x="40" y="60" width="10" height="70" fill="#fde68a" stroke="#b45309" strokeWidth="2.5" /><T x="45" y="156" s={15} w="700">diapositive</T>
      <ellipse cx="190" cy="95" rx="12" ry="50" fill={CLAIR} stroke={BLEU} strokeWidth="3" /><T x="190" y="170" s={15} w="700">lentille</T>
      <rect x="410" y="20" width="14" height="150" fill="#f8fafc" stroke={GRIS} strokeWidth="2.5" /><T x="417" y="186" s={15} w="700">écran</T>
      <line x1="50" y1="95" x2="410" y2="95" stroke={GRIS} strokeWidth="1.5" strokeDasharray="6 5" />
    </Cadre>);
}

// Éprouvette graduée contenant un liquide.
export function Eprouvette({ liquide = 'liquide' }) {
  return (
    <Cadre h={230} titre={`Éprouvette graduée contenant ${liquide}`}>
      <rect x="215" y="14" width="50" height="190" rx="6" fill="none" stroke={GRIS} strokeWidth="3" /><rect x="217" y="90" width="46" height="112" fill={CLAIR} opacity="0.8" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1="215" y1={30 + i * 20} x2={i % 2 ? 228 : 236} y2={30 + i * 20} stroke={GRIS} strokeWidth="2" />)}
      <T x="285" y="130" s={16} a="start" w="700">{liquide}</T><T x="285" y="30" s={15} c={GRIS} a="start">graduations</T>
    </Cadre>);
}

// Gaz enfermé sous un piston mobile.
export function Piston({ gaz = 'gaz enfermé' }) {
  return (
    <Cadre h={190} titre={`Un ${gaz} sous un piston mobile`}>
      <rect x="120" y="60" width="200" height="90" fill="none" stroke={GRIS} strokeWidth="3" /><rect x="124" y="64" width="190" height="82" fill={CLAIR} opacity="0.4" />
      {[[160, 90], [210, 120], [260, 95], [290, 125]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={BLEU} />)}
      <rect x="316" y="62" width="14" height="86" fill="#94a3b8" stroke={ENCRE} strokeWidth="2" /><line x1="330" y1="105" x2="410" y2="105" stroke={ENCRE} strokeWidth="5" />
      <T x="220" y="178" s={16} w="700">{gaz}</T><T x="370" y="90" s={15} c={GRIS}>piston</T>
    </Cadre>);
}

// Deux niveaux d'énergie d'un atome et un photon : seuls les noms sont indiqués.
export function Niveaux() {
  return (
    <Cadre h={210} titre="Deux niveaux d'énergie d'un atome et un photon absorbé">
      <line x1="120" y1="40" x2="300" y2="40" stroke={ENCRE} strokeWidth="4" /><T x="316" y="46" s={17} a="start" w="700">niveau excité</T>
      <line x1="120" y1="160" x2="300" y2="160" stroke={ENCRE} strokeWidth="4" /><T x="316" y="152" s={17} a="start" w="700">niveau</T><T x="316" y="172" s={17} a="start" w="700">fondamental</T>
      <path d="M130 100 q10 -10 20 0 t20 0 t20 0 t20 0" fill="none" stroke={ROUGE} strokeWidth="3" /><T x="170" y="126" s={15} c={ROUGE}>photon absorbé</T>
      <Fl x1="240" y1="150" x2="240" y2="52" c={BLEU} /><T x="256" y="100" s={15} c={BLEU} a="start">transition</T>
    </Cadre>);
}

// Échantillon radioactif devant un détecteur.
export function ComptageRadio() {
  return (
    <Cadre h={170} titre="Un échantillon radioactif devant un détecteur">
      <circle cx="90" cy="85" r="30" fill="#fef08a" stroke="#a16207" strokeWidth="2.5" /><T x="90" y="140" s={16} w="700">échantillon</T>
      {[-18, 0, 18].map(d => <Fl key={d} x1="130" y1={85 + d} x2="290" y2={85 + d * 1.4} c={GRIS} w={1.8} />)}
      <rect x="300" y="40" width="100" height="90" rx="10" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><T x="350" y="90" s={16} w="700">détecteur</T>
    </Cadre>);
}

// Haut-parleur et microphone.
export function SonMicro() {
  return (
    <Cadre h={170} titre="Un haut-parleur émet un son capté par un microphone">
      <path d="M60 60 L90 60 L130 30 L130 130 L90 100 L60 100 Z" fill="#e2e8f0" stroke={ENCRE} strokeWidth="2.5" /><T x="95" y="156" s={16} w="700">haut-parleur</T>
      {[0, 1, 2].map(i => <path key={i} d={`M${160 + i * 30} ${60 - i * 8} Q${180 + i * 30} 80 ${160 + i * 30} ${100 + i * 8}`} fill="none" stroke={BLEU} strokeWidth="2.5" />)}
      <circle cx="380" cy="80" r="22" fill="#e2e8f0" stroke={ENCRE} strokeWidth="2.5" /><line x1="380" y1="102" x2="380" y2="136" stroke={ENCRE} strokeWidth="4" /><T x="380" y="158" s={16} w="700">microphone</T>
    </Cadre>);
}

// Polarimètre : source, tube contenant la solution, analyseur.
export function Polarimetre() {
  const b = (x, nom, c) => <g><rect x={x} y="50" width="86" height="60" rx="8" fill={c} stroke={ENCRE} strokeWidth="2.5" /><T x={x + 43} y="86" s={15} w="700">{nom}</T></g>;
  return (
    <Cadre h={160} titre="Polarimètre : source, tube de solution, analyseur">
      {b(20, 'source', PAILLE)}{b(160, 'solution', '#dcfce7')}{b(300, 'analyseur', '#e0f2fe')}
      <Fl x1="108" y1="80" x2="158" y2="80" /><Fl x1="248" y1="80" x2="298" y2="80" />
      <T x="203" y="140" s={15} c={GRIS}>longueur du tube ℓ</T>
    </Cadre>);
}

// Capteur plongé dans un bain.
export function CapteurBain({ bain = 'bain' }) {
  return (
    <Cadre h={200} titre={`Un capteur de température plongé dans un ${bain}`}>
      <path d="M150 60 L150 150 Q150 160 160 160 L320 160 Q330 160 330 150 L330 60" fill="none" stroke={GRIS} strokeWidth="3" /><rect x="152" y="90" width="176" height="68" fill={CLAIR} opacity="0.8" />
      <rect x="226" y="14" width="18" height="90" rx="6" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><T x="262" y="50" s={16} a="start" w="700">capteur</T>
      <T x="240" y="188" s={16} w="700">{bain}</T>
    </Cadre>);
}

// Polymère : tuyau en coupe et chaîne de motifs répétés (aucune valeur).
export function PolymereTuyau() {
  return (
    <Cadre h={210} titre="Un tuyau en polymère et, agrandie, une chaîne de motifs répétés">
      <rect x="30" y="30" width="420" height="44" rx="22" fill="#e2e8f0" stroke={GRIS} strokeWidth="2.5" /><ellipse cx="52" cy="52" rx="10" ry="16" fill="#fff" stroke={GRIS} strokeWidth="2" /><T x="240" y="58" s={16} w="700">tuyau</T>
      <path d="M200 76 L150 112 M280 76 L330 112" stroke={GRIS} strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
      <g stroke={ENCRE} strokeWidth="2.5" fill="none" strokeLinecap="round">
        <polyline points="30,150 60,150 78,134 100,150 130,150 148,134 170,150 200,150 218,134 240,150 270,150 288,134 310,150 340,150 358,134 380,150 394,150" />
      </g>
      <path d="M92 166 L92 182 L248 182 L248 166" fill="none" stroke={BLEU} strokeWidth="2.5" /><T x="170" y="202" s={16} c={BLEU} w="700">motif (se répète)</T>
      <path d="M402 142 Q414 150 402 158" fill="none" stroke={ENCRE} strokeWidth="2.5" /><T x="420" y="154" s={15} a="start" w="700">chaîne</T>
    </Cadre>);
}

// Plan factoriel : facteurs à deux niveaux, essai, réponse mesurée (aucune valeur).
export function PlanFlan() {
  const niv = (y, nom) => <g><rect x="8" y={y} width="152" height="34" rx="8" fill="#fff" stroke={GRIS} strokeWidth="2" /><T x="84" y={y + 22} s={15} w="700">{nom}</T></g>;
  return (
    <Cadre h={190} titre="Plan factoriel : des facteurs à deux niveaux, des essais de cuisson, une réponse mesurée">
      {niv(20, 'facteur A (−1 / +1)')}{niv(66, 'facteur B (−1 / +1)')}{niv(112, '… autres facteurs')}
      <Fl x1="166" y1="90" x2="204" y2="90" />
      <path d="M206 74 L286 74 L278 122 Q276 134 264 134 L228 134 Q216 134 214 122 Z" fill="#a16207" stroke="#78350f" strokeWidth="2.5" /><ellipse cx="246" cy="74" rx="40" ry="9" fill="#78350f" stroke="#78350f" strokeWidth="2" />
      <T x="246" y="160" s={16} w="700">un essai : un flan cuit</T>
      <Fl x1="296" y1="90" x2="344" y2="90" />
      <rect x="350" y="62" width="116" height="56" rx="10" fill={PAILLE} stroke={ENCRE} strokeWidth="2.5" /><T x="408" y="86" s={15} w="700">réponse</T><T x="408" y="106" s={15} c={GRIS}>mesurée</T>
    </Cadre>);
}


// ── Oscillateurs (simulation 321) : situations neutres, ni valeur ni résultat ──
const chemin = (f, t0, t1, n = 120, x0 = 0, ex = 1, y0 = 0, ey = 1) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return `${i ? 'L' : 'M'}${(x0 + ex * t).toFixed(1)} ${(y0 - ey * f(t)).toFixed(1)}`; }).join(' ');
const zigzag = (x, y1, y2, n = 7, a = 11) => { let d = `M${x} ${y1}`; const pas = (y2 - y1) / (n + 1); d += ` L${x} ${y1 + pas * 0.5}`; for (let i = 0; i < n; i++) d += ` L${x + (i % 2 ? -a : a)} ${y1 + pas * (i + 1)}`; return d + ` L${x} ${y1 + pas * (n + 0.5)} L${x} ${y2}`; };

// Masse au bout d'un ressort (avec amortisseur facultatif) et, à droite, un enregistrement x(t) facultatif.
export function OscRessort({ amort = false, courbe = null }) {
  const gx = 290, gy = 100, ech = 24;
  const f = courbe === 'mesure' ? (t => Math.cos(2 * Math.PI * t) * Math.exp(-0.07 * t)) : (t => Math.exp(-0.38 * t) * Math.cos(2 * Math.PI * t * 0.9));
  const dur = courbe === 'mesure' ? 5 : 6.2, sx = courbe === 'mesure' ? 30 : 28;
  return (
    <Cadre h={210} titre="Masse au bout d’un ressort et enregistrement de sa position en fonction du temps">
      <rect x="40" y="14" width="130" height="10" fill="#e2e8f0" stroke={GRIS} strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <line key={i} x1={48 + i * 16} y1="24" x2={40 + i * 16} y2="14" stroke={GRIS} strokeWidth="1.5" />)}
      <path d={zigzag(80, 24, 100)} fill="none" stroke={ENCRE} strokeWidth="3" />
      <rect x="55" y="100" width="50" height="38" rx="6" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" /><T x="80" y="125" w="700">m</T>
      {amort && <g><rect x="132" y="24" width="22" height="46" rx="3" fill="#e0f2fe" stroke={GRIS} strokeWidth="2" /><line x1="143" y1="46" x2="143" y2="119" stroke={GRIS} strokeWidth="3" /><rect x="133" y="119" width="20" height="6" fill={GRIS} /></g>}
      <line x1="30" y1="119" x2="165" y2="119" stroke={GRIS} strokeWidth="1.5" strokeDasharray="6 5" />
      <T x="30" y="150" s={14} c={GRIS} a="start">position d’équilibre</T>
      <Fl x1="30" y1="104" x2="30" y2="134" />
      {amort && <T x="143" y="96" s={14} c={GRIS}>amortisseur</T>}
      {courbe && <g>
        <Fl x1={gx - 6} y1={gy} x2="470" y2={gy} /><Fl x1={gx} y1="190" x2={gx} y2="10" />
        <T x="466" y={gy + 20} s={15} c={GRIS} a="end" w="700">t</T><T x={gx + 10} y="20" s={15} c={GRIS} a="start" w="700">x</T>
        <path d={chemin(f, 0, dur, 160, gx, sx, gy, 70)} fill="none" stroke={BLEU} strokeWidth="3" />
        {courbe === 'amortie' && <><path d={chemin(t => Math.exp(-0.38 * t), 0, dur, 60, gx, sx, gy, 70)} fill="none" stroke={ROUGE} strokeWidth="2" strokeDasharray="6 5" /><T x={gx + 118} y={gy - 54} s={14} c={ROUGE} a="start">enveloppe</T></>}
        {courbe === 'mesure' && <><line x1={gx} y1={gy + 36} x2={gx} y2={gy + 56} stroke={ENCRE} strokeWidth="1.5" /><line x1={gx + 5 * sx} y1={gy + 36} x2={gx + 5 * sx} y2={gy + 56} stroke={ENCRE} strokeWidth="1.5" /><line x1={gx} y1={gy + 46} x2={gx + 5 * sx} y2={gy + 46} stroke={ENCRE} strokeWidth="2" markerStart="url(#pt10)" markerEnd="url(#pt10)" /><T x={gx + 2.5 * sx} y={gy + 70} s={14} c={ENCRE}>durée de la mesure</T></>}
      </g>}
    </Cadre>);
}

// Règle plate serrée dans un étau.
export function OscRegle() {
  return (
    <Cadre h={170} titre="Règle plate serrée par une extrémité dans un étau">
      <rect x="40" y="70" width="64" height="70" rx="4" fill="#e2e8f0" stroke={GRIS} strokeWidth="2" /><T x="72" y="112" s={15} w="700">étau</T>
      <path d="M104 100 Q230 100 380 52" fill="none" stroke={BLEU} strokeWidth="1.8" strokeDasharray="6 5" /><path d="M104 100 Q230 100 380 148" fill="none" stroke={BLEU} strokeWidth="1.8" strokeDasharray="6 5" />
      <rect x="104" y="95" width="276" height="10" rx="2" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" />
      <Fl x1="410" y1="100" x2="410" y2="56" /><Fl x1="410" y1="100" x2="410" y2="144" />
      <T x="240" y="82" s={15} c={GRIS}>règle plate</T><T x="300" y="164" s={14} c={GRIS}>position de repos : règle droite</T>
    </Cadre>);
}

// Piston de petit moteur relié à un vilebrequin.
export function OscPiston() {
  return (
    <Cadre h={170} titre="Piston dans un cylindre, relié à un vilebrequin">
      <rect x="60" y="50" width="170" height="70" rx="4" fill="#f1f5f9" stroke={GRIS} strokeWidth="2.5" /><rect x="120" y="54" width="34" height="62" rx="3" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" />
      <line x1="154" y1="85" x2="320" y2="85" stroke={ENCRE} strokeWidth="4" /><circle cx="350" cy="85" r="34" fill="#fff" stroke={ENCRE} strokeWidth="2.5" /><circle cx="350" cy="85" r="5" fill={ENCRE} />
      <Fl x1="100" y1="140" x2="190" y2="140" /><Fl x1="190" y1="140" x2="100" y2="140" />
      <T x="145" y="40" s={15} c={GRIS}>cylindre</T><T x="137" y="162" s={14} c={GRIS}>piston : mouvement d’aller-retour</T><T x="350" y="140" s={15} c={GRIS}>vilebrequin</T>
    </Cadre>);
}

// Aiguille d'un appareil de mesure analogique.
export function OscAiguille() {
  return (
    <Cadre h={190} titre="Cadran d’un appareil de mesure analogique avec son aiguille">
      <path d="M90 160 A150 150 0 0 1 390 160" fill="#fefce8" stroke={ENCRE} strokeWidth="2.5" />
      {Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (1 - i / 10); return <line key={i} x1={240 + 134 * Math.cos(a)} y1={160 - 134 * Math.sin(a)} x2={240 + 148 * Math.cos(a)} y2={160 - 148 * Math.sin(a)} stroke={ENCRE} strokeWidth="2" />; })}
      <line x1="240" y1="160" x2="320" y2="62" stroke={ROUGE} strokeWidth="4" strokeLinecap="round" /><circle cx="240" cy="160" r="9" fill={ENCRE} />
      <T x="352" y="36" s={15} c={ROUGE} a="start" w="700">aiguille</T><T x="240" y="182" s={15} c={GRIS}>échelle graduée</T>
    </Cadre>);
}

// Circuit RLC série.
export function OscRLC() {
  return (
    <Cadre h={190} titre="Circuit série comprenant une résistance, une bobine et un condensateur">
      <path d="M110 40 L200 40 M290 40 L370 40 L370 62 M370 128 L370 150 L110 150 L110 98 M110 80 L110 40" fill="none" stroke={ENCRE} strokeWidth="2.5" />
      <rect x="200" y="28" width="90" height="24" fill="#fff" stroke={ENCRE} strokeWidth="2.5" /><T x="245" y="20" s={16} w="700">résistance R</T>
      <path d="M370 62 q18 8 0 16 q18 8 0 16 q18 8 0 16 q18 8 0 16" fill="none" stroke={ENCRE} strokeWidth="2.5" /><T x="396" y="100" s={18} a="start" w="700">bobine L</T>
      <line x1="88" y1="80" x2="132" y2="80" stroke={ENCRE} strokeWidth="3" /><line x1="88" y1="98" x2="132" y2="98" stroke={ENCRE} strokeWidth="3" /><T x="130" y="178" s={18} w="700">condensateur C</T>
    </Cadre>);
}


// ── Énergie d'un oscillateur (simulation 322) : situations neutres, ni valeur ni résultat ──
// Chariot sur un rail, relié à un ressort (amortisseur facultatif) ; symboles k, m, x facultatifs.
export function OseChariot({ amort = false, symboles = false }) {
  return (
    <Cadre h={190} titre="Chariot sur un rail, relié à un ressort fixé à un mur">
      <rect x="30" y="40" width="16" height="104" fill="#e2e8f0" stroke={GRIS} strokeWidth="2" />
      <polyline points={Array.from({ length: 11 }, (_, i) => (i === 0 ? '46,104' : i === 10 ? '200,104' : `${46 + 8 + (146 / 9.5) * (i - 0.5)},${104 + (i % 2 ? -11 : 11)}`)).join(' ')} fill="none" stroke={ENCRE} strokeWidth="3" strokeLinejoin="round" />
      <rect x="200" y="82" width="90" height="46" rx="8" fill={CLAIR} stroke={BLEU} strokeWidth="2.5" /><T x="245" y="113" s={22} w="700">m</T>
      <circle cx="222" cy="136" r="7" fill={GRIS} /><circle cx="268" cy="136" r="7" fill={GRIS} />
      <line x1="46" y1="144" x2="440" y2="144" stroke={ENCRE} strokeWidth="3" />
      {amort && <g><rect x="46" y="56" width="70" height="16" rx="4" fill="#e0f2fe" stroke={GRIS} strokeWidth="2" /><polyline points="116,64 232,64 232,82" fill="none" stroke={GRIS} strokeWidth="3.5" /><T x="112" y="50" s={16} c={GRIS}>amortisseur</T></g>}
      <line x1="245" y1="62" x2="245" y2="158" stroke={GRIS} strokeWidth="1.5" strokeDasharray="6 5" />
      <T x="245" y="178" s={16} c={GRIS}>position d’équilibre</T>
      {symboles && <g><T x="120" y="130" s={20} w="700" a="middle">k</T><Fl x1="245" y1="170" x2="318" y2="170" /><T x="338" y="177" s={20} w="700">x</T></g>}
    </Cadre>);
}

// Circuit LC série (bobine et condensateur), sans valeur.
export function OseLC({ resistance = false }) {
  return (
    <Cadre h={190} titre="Circuit comprenant une bobine et un condensateur en série">
      <path d="M110 40 L370 40 L370 62 M370 118 L370 150 L110 150 L110 98 M110 80 L110 40" fill="none" stroke={ENCRE} strokeWidth="2.5" />
      <path d="M370 62 q18 8 0 14 q18 8 0 14 q18 8 0 14 q18 8 0 14" fill="none" stroke={ENCRE} strokeWidth="2.5" /><T x="396" y="100" s={18} a="start" w="700">bobine L</T>
      <line x1="88" y1="80" x2="132" y2="80" stroke={ENCRE} strokeWidth="3" /><line x1="88" y1="98" x2="132" y2="98" stroke={ENCRE} strokeWidth="3" /><T x="130" y="178" s={18} w="700">condensateur C</T>
      <Fl x1="200" y1="28" x2="280" y2="28" /><T x="240" y="18" s={17} c={GRIS}>courant i</T>
      {resistance && <g><rect x="190" y="143" width="80" height="14" fill="#fff" stroke={ENCRE} strokeWidth="2.5" /></g>}
    </Cadre>);
}

export const DESSINS_LOT10 = {
  polymereTuyau: PolymereTuyau, planFlan: PlanFlan,
  mobile: Mobile, deuxReliefs: DeuxReliefs, virage: Virage, lancerDeuxAstres: LancerDeuxAstres,
  becher: Becher, dilution: Dilution, titrage: Titrage, lentilleLointain: LentilleLointain, microscope: Microscope,
  diffraction: Diffraction, laserCible: LaserCible, prismeLaser: PrismeLaser, lampeFiltre: LampeFiltre, spectrophotometre: Spectrophotometre,
  circuitSimple: CircuitSimple, panneauSoleil: PanneauSoleil, gazChauffe: GazChauffe, cubeImmerge: CubeImmerge, cordeCapteurs: CordeCapteurs,
  casserole: Casserole, lingeFil: LingeFil, refroidissement: Refroidissement, distillation: Distillation, plaqueCCM: PlaqueCCM,
  cisaillement: Cisaillement, coalescence: Coalescence, deuxLampesPeinture: DeuxLampesPeinture, chauffeEau: ChauffeEau,
  reservoirRegule: ReservoirRegule, deuxCharges: DeuxCharges, deuxChariots: DeuxChariots,
  plaques: Plaques, blocTransparent: BlocTransparent, bruleurBecher: BruleurBecher, soleilTerre: SoleilTerre, looping: Looping, balance: Balance, reflux: Reflux,
  chuteLibre: ChuteLibre, projection: Projection, eprouvette: Eprouvette, piston: Piston, niveaux: Niveaux, comptageRadio: ComptageRadio, sonMicro: SonMicro,
  polarimetre: Polarimetre, capteurBain: CapteurBain,
  oseChariot: OseChariot, oseLC: OseLC, oscRessort: OscRessort, oscRegle: OscRegle, oscPiston: OscPiston, oscAiguille: OscAiguille, oscRLC: OscRLC,
};
