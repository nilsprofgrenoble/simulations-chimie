// Cartes « À retenir » de la simulation « Niveau sonore et dangers de l'exposition » (sim 192, 2GT).
// Chaque carte est posée sur l'ÉTAPE SUIVANT la question qu'elle conclut, et ses exemples chiffrés sont différents de ceux demandés.
// Schémas dessinés dans un cadre de 300 de large : sur téléphone ils s'affichent à ~230 px, donc textes de 13 à 16 (≥ 10 px rendus).
const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const NB = ' ';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const sinus = (x0, yc, A, L, nPer) => Array.from({ length: 41 }, (_, i) => `${(x0 + (L * i) / 40).toFixed(1)},${(yc - A * Math.sin((2 * Math.PI * nPer * i) / 40)).toFixed(1)}`).join(' ');
// petit sonomètre (x, y = coin haut gauche, 84 × 32)
const Mini = ({ x, y, txt, c = '#86efac' }) => (<g><rect x={x} y={y} width="84" height="32" rx="7" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5"/><text x={x + 42} y={y + 22} textAnchor="middle" fontSize="16" fontWeight="700" fill={c} style={{ fontFamily: 'monospace' }}>{txt}</text></g>);
const Enc = ({ x, y, s = 1 }) => (<g transform={`translate(${x},${y}) scale(${s})`}><rect x="-12" y="-18" width="24" height="36" rx="4" fill="#334155"/><circle cx="0" cy="-6" r="3.5" fill="#94a3b8"/><circle cx="0" cy="7" r="7" fill="#cbd5e1" stroke="#0f172a"/></g>);

// ── Carte 1 : du son au décibel ──
export function FicheChaine() {
  return (
    <div>
      <svg viewBox="0 0 300 214" style={svgStyle} role="img" aria-label="À gauche, une vibration de petite amplitude donne un niveau de 30 décibels, un son faible. À droite, une vibration de grande amplitude donne 60 décibels, un son fort. En dessous : amplitude, intensité et niveau en dB augmentent ensemble.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Grande amplitude, grand niveau</text>
        <rect x="8" y="32" width="136" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1"/><polyline points={sinus(14, 62, 7, 124, 3)} fill="none" stroke={BLEU} strokeWidth="2.6"/>
        <rect x="156" y="32" width="136" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1"/><polyline points={sinus(162, 62, 24, 124, 3)} fill="none" stroke={BLEU} strokeWidth="2.6"/>
        <path d="M76,96 L76,108 M70,104 L76,110 L82,104" stroke={GRIS} strokeWidth="2.5" fill="none"/><path d="M224,96 L224,108 M218,104 L224,110 L230,104" stroke={GRIS} strokeWidth="2.5" fill="none"/>
        <Mini x={34} y={112} txt={`30${NB}dB`}/><Mini x={182} y={112} txt={`60${NB}dB`} c="#fcd34d"/>
        <text x="76" y="162" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>petite amplitude</text><text x="224" y="162" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>grande amplitude</text>
        {[[6, 'amplitude'], [106, 'intensité'], [206, 'niveau (dB)']].map(([x, t], i) => (
          <g key={t}><rect x={x} y="176" width="88" height="30" rx="8" fill="#eff6ff" stroke={BLEU} strokeWidth="1.6"/><text x={x + 44} y="196" textAnchor="middle" fontSize="13" fontWeight="700" fill={BLEU}>{t}</text>
            {i < 2 && <text x={x + 94} y="196" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>→</text>}</g>))}
      </svg>
      <ul style={liste}>
        <li><strong>Plus l’amplitude est grande, plus le son est intense, plus le niveau en dB est élevé.</strong> Les trois montent ensemble.</li>
        <li>Exemple : chuchotement ≈ 30{NB}dB, conversation ≈ 60{NB}dB.</li>
        <li><strong>Idée fausse</strong> : « les dB mesurent si le son est aigu ou grave ». <strong>Vrai</strong> : les dB mesurent la <em>force</em> du son ; aigu ou grave, c’est la note.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : l'échelle des niveaux sonores ──
export function FicheEchelle() {
  const y = d => 276 - d * 1.9, x0 = 76;
  const reperes = [[0, 'seuil d’audition'], [30, 'chuchotement'], [60, 'conversation'], [100, 'casque fort, concert'], [120, 'seuil de douleur']];
  return (
    <div>
      <svg viewBox="0 0 300 306" style={svgStyle} role="img" aria-label="Échelle verticale des niveaux sonores : 0 décibel seuil d'audition, 30 chuchotement, 60 conversation, 85 attention si l'exposition est longue, 100 casque fort ou concert, 120 seuil de douleur.">
        <text x="150" y="16" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>L’échelle des niveaux sonores</text>
        <rect x={x0} y={y(85)} width="12" height={y(0) - y(85)} fill="#bbf7d0"/><rect x={x0} y={y(120)} width="12" height={y(85) - y(120)} fill="#fed7aa"/><rect x={x0} y={y(130)} width="12" height={y(120) - y(130)} fill="#fecaca"/>
        <line x1={x0} y1={y(0)} x2={x0} y2={y(130)} stroke={ENCRE} strokeWidth="2.5"/>
        {reperes.map(([d, t]) => (<g key={d}><circle cx={x0 + 6} cy={y(d)} r="5" fill={BLEU}/><text x={x0 - 12} y={y(d) + 5} textAnchor="end" fontSize="14" fontWeight="700" fill={ENCRE}>{d}</text><text x={x0 + 22} y={y(d) + 5} fontSize="14" fontWeight="700" fill={ENCRE}>{t}</text></g>))}
        <line x1={x0 - 8} y1={y(85)} x2={x0 + 20} y2={y(85)} stroke={ORANGE} strokeWidth="3"/>
        <text x={x0 - 12} y={y(85) + 5} textAnchor="end" fontSize="14" fontWeight="700" fill={ORANGE}>85</text><text x={x0 + 24} y={y(85) + 5} fontSize="14" fontWeight="700" fill={ORANGE}>attention si c’est long</text>
        <text x="296" y="302" textAnchor="end" fontSize="13" fill={GRIS}>valeurs : ordres de grandeur</text>
      </svg>
      <ul style={liste}>
        <li><strong>0 : on entend à peine · 60 : on parle · 85 : attention · 120 : ça fait mal.</strong></li>
        <li>Le <strong>seuil d’audition</strong> (0{NB}dB) n’est pas « aucun son » : c’est le son le plus faible que l’on puisse entendre.</li>
        <li>Les valeurs de l’échelle sont des <strong>repères</strong> : elles varient de 10{NB}dB selon les sources et les personnes.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : +10 dB = × 10 ──
export function FichePlus10() {
  const marches = [[24, 150, 36, '× 1', '40'], [112, 114, 72, '× 10', '50'], [200, 78, 108, '× 100', '60']];
  return (
    <div>
      <svg viewBox="0 0 300 236" style={svgStyle} role="img" aria-label="Un escalier de trois marches : 40, 50 et 60 décibels. À chaque marche de plus 10 décibels, l'intensité est multipliée par 10 : fois 1, fois 10, fois 100.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Un zéro de plus tous les + 10{NB}dB</text>
        {marches.map(([x, y, h, f, n]) => (<g key={n}><rect x={x} y={y} width="76" height={h} rx="6" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><text x={x + 38} y={y + 24} textAnchor="middle" fontSize="16" fontWeight="700" fill={ENCRE}>{n}{NB}dB</text>
          <text x={x + 38} y="210" textAnchor="middle" fontSize="16" fontWeight="700" fill={ORANGE}>{f}</text></g>))}
        <text x="150" y="106" textAnchor="middle" fontSize="14" fontWeight="700" fill={VERT}>+ 10 dB</text><text x="238" y="70" textAnchor="middle" fontSize="14" fontWeight="700" fill={VERT}>+ 10 dB</text>
        <path d="M20,192 H280" stroke={GRIS} strokeWidth="1.5"/>
        <text x="150" y="230" textAnchor="middle" fontSize="14" fill={GRIS}>intensité par rapport à 40{NB}dB</text>
      </svg>
      <ul style={liste}>
        <li><strong>+ 10{NB}dB ≈ 10 fois plus intense ; + 20{NB}dB ≈ 100 fois ; + 30{NB}dB ≈ 1000 fois.</strong> Chaque + 10{NB}dB ajoute un zéro.</li>
        <li><strong>Idée fausse</strong> : « + 10{NB}dB, c’est 10 % de plus ». <strong>Vrai</strong> : c’est 10 <em>fois</em> plus d’intensité.</li>
        <li>Repère : l’échelle des dB est « écrasée » : de 0 à 120{NB}dB, l’intensité est multipliée par mille milliards.</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : plusieurs sources ──
export function FicheSources() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="À gauche, une enceinte et un sonomètre à 60 décibels. À droite, deux enceintes identiques et un sonomètre à environ 63 décibels. Deux sources identiques ajoutent environ 3 décibels, pas 60.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Deux sources : environ + 3{NB}dB</text>
        <Enc x={46} y={66} s={1.5}/><Mini x={20} y={102} txt={`60${NB}dB`}/>
        <text x="62" y="150" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>1 source</text>
        <line x1="150" y1="34" x2="150" y2="150" stroke="#cbd5e1" strokeDasharray="4 4"/>
        <Enc x={208} y={60} s={1.2}/><Enc x={246} y={72} s={1.2}/><Mini x={196} y={102} txt={`≈ 63${NB}dB`} c="#fcd34d"/>
        <text x="236" y="150" textAnchor="middle" fontSize="14" fontWeight="700" fill={ENCRE}>2 sources</text>
        <rect x="14" y="160" width="272" height="38" rx="8" fill="#eff6ff" stroke={BLEU}/><text x="150" y="176" textAnchor="middle" fontSize="14" fontWeight="700" fill={BLEU}>intensité × 2  ⇒  + 3 dB</text>
        <text x="150" y="192" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ROUGE}>60 + 60 = 120 dB : FAUX</text>
      </svg>
      <ul style={liste}>
        <li><strong>Deux sources identiques : intensité × 2, niveau + 3{NB}dB environ.</strong> On n’additionne pas les niveaux.</li>
        <li>Exemple : deux sources indépendantes de 60{NB}dB donnent environ 63{NB}dB, pas 120{NB}dB. (Deux enceintes qui jouent exactement le même signal peuvent aller jusqu’à + 6{NB}dB.)</li>
        <li><strong>Idée fausse</strong> : « deux fois plus de sources, deux fois plus de dB ». <strong>Vrai</strong> : 3{NB}dB de plus seulement.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : dangers et durées ──
export function FicheDangers() {
  const lignes = [[85, 480, '8 h'], [91, 120, '2 h'], [97, 30, '30 min'], [100, 15, '15 min']];
  return (
    <div>
      <svg viewBox="0 0 300 208" style={svgStyle} role="img" aria-label="Durées repères indicatives : 85 décibels, 8 heures ; 91 décibels, 2 heures ; 97 décibels, 30 minutes ; 100 décibels, 15 minutes. Chaque fois que le niveau monte de 3 décibels, la durée repère est divisée par 2.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Plus fort, moins longtemps</text>
        {lignes.map(([n, t, txt], i) => { const y = 34 + i * 34, w = Math.max(8, (t / 480) * 150); return (<g key={n}><text x="62" y={y + 19} textAnchor="end" fontSize="15" fontWeight="700" fill={ENCRE}>{n}{NB}dB</text><rect x="70" y={y} width={w} height="26" rx="4" fill={n >= 97 ? '#dc2626' : n >= 91 ? '#ea580c' : '#f59e0b'}/><text x={78 + w} y={y + 19} fontSize="15" fontWeight="700" fill={ENCRE}>{txt}</text></g>); })}
        <rect x="14" y="174" width="272" height="28" rx="8" fill="#eff6ff" stroke={BLEU}/><text x="150" y="193" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={BLEU}>+ 3 dB : durée repère ÷ 2</text>
      </svg>
      <ul style={liste}>
        <li><strong>3 dB de plus, deux fois moins de temps.</strong> Ce sont des repères de prévention (INRS, OMS), pas des seuils médicaux exacts.</li>
        <li><strong>Dangers</strong> : fatigue auditive (temporaire), acouphènes (sifflements), perte d’audition définitive.</li>
        <li><strong>Idée fausse</strong> : « pas de douleur, pas de danger ». <strong>Vrai</strong> : l’oreille s’abîme sans faire mal.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : se protéger ──
export function FicheProtections() {
  const cases = [
    [14, 34, ['Baisser', 'le volume'], (cx, cy) => <g><circle cx={cx} cy={cy} r="18" fill="#e2e8f0" stroke={ENCRE} strokeWidth="2"/><line x1={cx} y1={cy} x2={cx - 9} y2={cy - 11} stroke={ROUGE} strokeWidth="3.5" strokeLinecap="round"/></g>],
    [154, 34, ['S’éloigner', 'des enceintes'], (cx, cy) => <g><Enc x={cx - 20} y={cy} s={0.8}/><path d={`M${cx - 4},${cy} H${cx + 24} M${cx + 16},${cy - 7} L${cx + 24},${cy} L${cx + 16},${cy + 7}`} stroke={VERT} strokeWidth="3" fill="none" strokeLinecap="round"/></g>],
    [14, 124, ['Bouchons ou casque', 'de protection'], (cx, cy) => <g><circle cx={cx} cy={cy} r="15" fill="#fde68a" stroke={ORANGE} strokeWidth="2.5"/><circle cx={cx} cy={cy} r="6" fill="#f59e0b"/></g>],
    [154, 124, ['Pauses', 'au calme'], (cx, cy) => <g><rect x={cx - 14} y={cy - 16} width="10" height="32" rx="3" fill={BLEU}/><rect x={cx + 4} y={cy - 16} width="10" height="32" rx="3" fill={BLEU}/></g>],
  ];
  return (
    <div>
      <svg viewBox="0 0 300 214" style={svgStyle} role="img" aria-label="Quatre gestes pour protéger ses oreilles : baisser le volume, s'éloigner des enceintes, porter des bouchons ou un casque de protection auditive, faire des pauses au calme.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Protéger ses oreilles</text>
        {cases.map(([x, y, l, ico]) => (<g key={l[0]}><rect x={x} y={y} width="132" height="82" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>{ico(x + 66, y + 26)}
          <text x={x + 66} y={y + 56} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ENCRE}>{l[0]}</text><text x={x + 66} y={y + 73} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ENCRE}>{l[1]}</text></g>))}
      </svg>
      <ul style={liste}>
        <li><strong>Moins fort, plus loin, protégé, en pause.</strong></li>
        <li>Exemple : un casque à 94{NB}dB (repère : 1{NB}h) baissé à 88{NB}dB : repère de 4{NB}h.</li>
        <li><strong>Idée fausse</strong> : « monter le son pour couvrir les bruits autour ». <strong>Vrai</strong> : on abîme l’oreille ; mieux vaut un casque ou des bouchons bien ajustés.</li>
      </ul>
    </div>
  );
}

// ── Carte 4bis : la distance ──
export function FicheDistance() {
  const lignes = [[1, `80${NB}dB`], [2, `≈ 74${NB}dB`], [4, `≈ 68${NB}dB`]];
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Une enceinte et trois sonomètres placés à 1, 2 et 4 mètres : ils affichent 80, environ 74 et environ 68 décibels. Plus on est loin de la source, plus le niveau est faible.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Plus loin, moins fort</text>
        <Enc x={36} y={92} s={1.6}/>
        {lignes.map(([d, txt], i) => { const y = 36 + i * 42; return (<g key={d}><line x1="62" y1="92" x2="104" y2={y + 16} stroke="#cbd5e1" strokeDasharray="4 4"/><text x="146" y={y + 22} textAnchor="end" fontSize="15" fontWeight="700" fill={ENCRE}>{d}{NB}m</text><Mini x={156} y={y} txt={txt} c={i === 0 ? '#86efac' : i === 1 ? '#bef264' : '#fcd34d'}/></g>); })}
        <rect x="14" y="168" width="272" height="30" rx="8" fill="#eff6ff" stroke={BLEU}/><text x="150" y="188" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={BLEU}>distance ↑  ⇒  niveau ↓</text>
      </svg>
      <ul style={liste}>
        <li><strong>Plus on s’éloigne de la source, plus le niveau baisse.</strong> S’éloigner est un moyen de se protéger.</li>
        <li>Exemple : une même enceinte, en plein air : 80{NB}dB à 1{NB}m, environ 74{NB}dB à 2{NB}m, environ 68{NB}dB à 4{NB}m.</li>
        <li><strong>Idée fausse</strong> : « le niveau est le même partout si le volume ne change pas ». <strong>Vrai</strong> : il dépend de la distance.</li>
      </ul>
    </div>
  );
}

// ── Carte 8 : mesurer avec un smartphone ──
export function FicheSmartphone() {
  const conseils = ['Micro dégagé', 'Bras tendu', 'Même endroit', 'Mesure répétée'];
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Un smartphone qui affiche 68 décibels et quatre conseils : micro dégagé, téléphone à bout de bras, toujours au même endroit, mesure répétée. La valeur est indicative, à quelques décibels près.">
        <text x="150" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill={ENCRE}>Mesurer avec un smartphone</text>
        <rect x="16" y="32" width="72" height="124" rx="12" fill="#334155" stroke={ENCRE} strokeWidth="2"/>
        <rect x="23" y="48" width="58" height="92" rx="5" fill="#1e293b"/><text x="52" y="98" textAnchor="middle" fontSize="16" fontWeight="700" fill="#86efac">68{NB}dB</text>
        <circle cx="52" cy="40" r="2.5" fill="#94a3b8"/>
        {conseils.map((c, i) => { const y = 54 + i * 30; return (<g key={c}><circle cx="110" cy={y} r="9" fill="#dcfce7" stroke={VERT} strokeWidth="2"/><path d={`M105,${y} L109,${y + 4} L116,${y - 4}`} stroke={VERT} strokeWidth="2.5" fill="none" strokeLinecap="round"/><text x="128" y={y + 5} fontSize="14" fontWeight="700" fill={ENCRE}>{c}</text></g>); })}
        <rect x="14" y="168" width="272" height="30" rx="8" fill="#eff6ff" stroke={BLEU}/><text x="150" y="188" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={BLEU}>valeur indicative, à quelques dB près</text>
      </svg>
      <ul style={liste}>
        <li><strong>Un smartphone sert à comparer des lieux, pas à mesurer avec précision.</strong></li>
        <li>Exemple : 69{NB}dB dans un lieu et 71{NB}dB dans un autre : l’écart est trop petit pour conclure.</li>
        <li><strong>Idée fausse</strong> : « l’application donne la valeur exacte ». <strong>Vrai</strong> : elle donne une valeur indicative.</li>
      </ul>
    </div>
  );
}
