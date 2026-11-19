// Schémas des cartes « À retenir » de la simulation 88 (échographe : écho, célérité et résolution). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const TE = ({ x, y, parts, a = 'start', c = ENCRE, w = 400 }) => (
  <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>
    {parts.map((p, i) => p[0] === '_'
      ? <tspan key={i} fontSize="9.5" dy="3">{p.slice(1)}</tspan>
      : <tspan key={i} dy={i && parts[i - 1][0] === '_' ? -3 : 0}>{p}</tspan>)}
  </text>);
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.6 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const burst = (x0, w, amp, cy, k = 9) => { const o = []; for (let x = 0; x <= w; x += 1) { const u = (x - w / 2) / (w / 3); o.push(`${(x0 + x).toFixed(1)},${(cy - amp * Math.exp(-u * u) * Math.sin(x / w * k * Math.PI * 2 / 3)).toFixed(1)}`); } return o.join(' '); };
const gauss = (xs, sig, amp, base, a, b) => { const o = []; for (let x = a; x <= b; x += 1) { let y = 0; xs.forEach(c => { y += Math.exp(-((x - c) ** 2) / (2 * sig * sig)); }); o.push(`${x},${(base - Math.min(amp * y, amp * 1.25)).toFixed(1)}`); } return o.join(' '); };

export const FAllerRetour = () => (
  <Svg h={206} aria="Un capteur à ultrasons envoie une salve vers un obstacle situé à la distance d ; la salve revient ; le trajet total est un aller-retour de longueur 2 d, donc le retard de l'écho est égal à 2 d divisé par la célérité v">
    <rect x="10" y="48" width="30" height="48" rx="4" fill="#cbd5e1" stroke={GRIS} strokeWidth="2"/><T x={25} y={116} a="middle" w={800}>capteur</T>
    <rect x="262" y="26" width="10" height="92" fill="#94a3b8" stroke={GRIS} strokeWidth="2"/><T x={267} y={140} a="middle" c={GRIS}>obstacle</T>
    <Fleche x1={44} y1={62} x2={258} y2={62} c={ORANGE} w={2.6}/><T x={150} y={54} a="middle" c={ORANGE} w={800}>aller : d</T>
    <Fleche x1={258} y1={86} x2={44} y2={86} c={BLEU} w={2.6}/><T x={150} y={108} a="middle" c={BLEU} w={800}>retour : d</T>
    <T x={150} y={164} a="middle" w={800}>trajet total : 2 d</T>
    <TE x={150} y={188} a="middle" w={800} c={VERT} parts={['Δt = 2 d ÷ v']}/>
  </Svg>);

export const FRetard = () => (
  <Svg h={206} aria="Oscillogramme : la salve émise au repère 1 et l'écho reçu plus tard au repère 2 ; le retard Δt est la durée entre le début de la salve émise et le début de l'écho">
    <Lg x1={14} y1={110} x2={290} y2={110} c={GRIS} w={1.8}/><T x={288} y={128} a="end" c={GRIS}>t</T>
    <polyline points={burst(34, 50, 34, 110)} fill="none" stroke={BLEU} strokeWidth="2.2"/><polyline points={burst(168, 50, 16, 110)} fill="none" stroke={BLEU} strokeWidth="2.2"/>
    <Lg x1={34} y1={34} x2={34} y2={118} c={ORANGE} w={1.8} d="4 3"/><Lg x1={168} y1={34} x2={168} y2={118} c={BLEU} w={1.8} d="4 3"/>
    <T x={34} y={26} a="middle" c={ORANGE} w={800}>repère 1</T><T x={168} y={26} a="middle" c={BLEU} w={800}>repère 2</T>
    <T x={60} y={70} c={GRIS}>émission</T><T x={196} y={84} c={GRIS}>écho</T>
    <Fleche x1={36} y1={144} x2={166} y2={144} c={VERT} w={2.4}/><Fleche x1={166} y1={144} x2={36} y2={144} c={VERT} w={2.4}/>
    <T x={100} y={138} a="middle" c={VERT} w={800}>Δt</T>
    <T x={150} y={176} a="middle" c={GRIS}>du début de la salve émise</T><T x={150} y={196} a="middle" c={GRIS}>au début de l’écho</T>
  </Svg>);

export const FFroid = () => (
  <Svg h={218} aria="Effet de la température : à 20 degrés la célérité est d'environ 343 mètres par seconde et l'écho revient après 7,00 millisecondes ; à 0 degré la célérité est plus petite, environ 331 mètres par seconde, et l'écho revient plus tard, après 7,25 millisecondes">
    <T x={14} y={18} w={800} c={BLEU}>20 °C : v ≈ 343 m·s⁻¹</T>
    <Lg x1={14} y1={64} x2={290} y2={64} c={GRIS} w={1.6}/><polyline points={burst(24, 36, 24, 64)} fill="none" stroke={BLEU} strokeWidth="2"/><polyline points={burst(196, 36, 12, 64)} fill="none" stroke={BLEU} strokeWidth="2"/>
    <Lg x1={196} y1={26} x2={196} y2={72} c={BLEU} w={1.6} d="3 3"/><T x={196} y={86} a="middle" c={BLEU} w={800}>7,00 ms</T>
    <T x={14} y={118} w={800} c={ORANGE}>0 °C : v ≈ 331 m·s⁻¹</T>
    <Lg x1={14} y1={164} x2={290} y2={164} c={GRIS} w={1.6}/><polyline points={burst(24, 36, 24, 164)} fill="none" stroke={ORANGE} strokeWidth="2"/><polyline points={burst(208, 36, 12, 164)} fill="none" stroke={ORANGE} strokeWidth="2"/>
    <Lg x1={208} y1={126} x2={208} y2={172} c={ORANGE} w={1.6} d="3 3"/><T x={208} y={186} a="middle" c={ORANGE} w={800}>7,25 ms</T>
    <T x={150} y={212} a="middle" c={GRIS}>plus froid : v plus petite, Δt plus grand</T>
  </Svg>);

export const F340 = () => (
  <Svg h={216} aria="Un capteur réglé sur 340 mètres par seconde se trompe quand il fait 0 degré : la vraie distance est 1,200 mètre, le retard réel est 7,25 millisecondes, l'appareil calcule la distance avec 340 mètres par seconde et affiche 1,232 mètre, il surestime">
    <T x={150} y={16} a="middle" w={800}>L’appareil suppose v₀ = 340 m·s⁻¹</T>
    <T x={14} y={46} c={GRIS}>vraie distance</T><rect x="14" y="52" width="120" height="14" fill="#38bdf8" opacity="0.7" stroke={BLEU} strokeWidth="1.6"/><T x={142} y={64} c={BLEU} w={800}>1,200 m</T>
    <T x={14} y={96} c={GRIS}>distance affichée</T><rect x="14" y="102" width="123.2" height="14" fill="#fdba74" opacity="0.85" stroke={ORANGE} strokeWidth="1.6"/><T x={145} y={114} c={ORANGE} w={800}>1,232 m</T>
    <TE x={150} y={150} a="middle" parts={['à 0 °C : Δt = 7,25 ms (v réelle ≈ 331 m·s⁻¹)']}/>
    <TE x={150} y={172} a="middle" w={800} parts={['d affichée = v', '_0', ' × Δt ÷ 2']}/>
    <T x={150} y={198} a="middle" w={800} c={ORANGE}>v réelle plus faible : d surestimée</T>
  </Svg>);

export const FGazHe = () => (
  <Svg h={206} aria="La célérité dépend du gaz : l'air, de masse molaire 29 grammes par mole, a une célérité d'environ 343 mètres par seconde ; l'hélium, de masse molaire 4 grammes par mole, va environ trois fois plus vite, 1 010 mètres par seconde ; v égale racine de gamma R T divisé par M : plus la masse molaire est petite, plus la célérité est grande">
    <TE x={150} y={18} a="middle" w={800} parts={['v = √(γ R T ÷ M)']}/>
    <T x={14} y={52} c={GRIS}>air : M = 29 g·mol⁻¹</T><rect x="14" y="58" width="68.6" height="16" fill="#38bdf8" opacity="0.7" stroke={BLEU} strokeWidth="1.6"/><T x={90} y={71} c={BLEU} w={800}>343 m·s⁻¹</T>
    <T x={14} y={106} c={GRIS}>hélium : M = 4,0 g·mol⁻¹</T><rect x="14" y="112" width="202" height="16" fill="#fdba74" opacity="0.85" stroke={ORANGE} strokeWidth="1.6"/><T x={222} y={125} c={ORANGE} w={800}>1 010</T>
    <T x={150} y={162} a="middle" w={800} c={VERT}>M petite : v grande</T>
    <T x={150} y={184} a="middle" c={GRIS}>à 20 °C, γ dépend du gaz</T>
  </Svg>);

export const FOrdres = () => {
  const R = [['gaz (air)', 343, '343 m·s⁻¹', BLEU], ['liquides (eau)', 1500, 'environ 1 500', VERT], ['solides (acier)', 5000, 'environ 5 000', ORANGE]];
  return (
    <Svg h={206} aria="Ordres de grandeur de la célérité du son à 20 degrés : environ 343 mètres par seconde dans l'air, 1 500 dans l'eau, 5 000 dans l'acier ; le son va plus vite dans un solide que dans un liquide, et plus vite dans un liquide que dans un gaz">
      {R.map(([a, v, t, c], i) => <g key={i}><T x={14} y={22 + i * 56} c={GRIS}>{a}</T><rect x="14" y={28 + i * 56} width={Math.max(8, v * 0.033)} height="18" fill={c} opacity="0.75" stroke={c} strokeWidth="1.6"/><T x={Math.max(8, v * 0.033) + 22} y={42 + i * 56} c={c} w={800}>{t}</T></g>)}
      <T x={150} y={196} a="middle" w={800}>gaz &lt; liquides &lt; solides</T>
    </Svg>);
};

export const FInterfaces = () => (
  <Svg h={214} aria="Un écho se forme à chaque interface entre deux milieux différents : la sonde envoie une onde à travers la peau, la graisse, le muscle et l'organe ; à chaque changement de milieu une partie de l'énergie est réfléchie vers la sonde, ce qui donne un pic sur le balayage A">
    <rect x="12" y="52" width="26" height="46" rx="4" fill="#cbd5e1" stroke={GRIS} strokeWidth="2"/><T x={25} y={46} a="middle" c={GRIS}>sonde</T>
    {[[44, 22, '#fde68a', 'peau'], [66, 52, '#fef9c3', 'graisse'], [118, 80, '#fecaca', 'muscle'], [198, 92, '#e9d5ff', 'organe']].map(([x, w, c, n], i) => <g key={i}><rect x={x} y="40" width={w} height="70" fill={c} stroke={GRIS} strokeWidth="1.4"/></g>)}
    <T x={55} y={32} a="middle" c={GRIS}>peau</T><T x={92} y={32} a="middle" c={GRIS}>graisse</T><T x={158} y={32} a="middle" c={GRIS}>muscle</T><T x={244} y={32} a="middle" c={GRIS}>organe</T>
    <Fleche x1={40} y1={75} x2={280} y2={75} c={BLEU} w={2.4}/>
    {[66, 118, 198].map((x, i) => <Fleche key={i} x1={x} y1={96 + i * 4} x2={x - 22} y2={96 + i * 4} c={ORANGE} w={2}/>)}
    <T x={150} y={148} a="middle" w={800} c={ORANGE}>interface : une partie est réfléchie</T>
    <T x={150} y={172} a="middle" w={800}>1 interface = 1 écho = 1 pic</T>
    <T x={150} y={196} a="middle" c={GRIS}>le reste de l’onde continue</T>
  </Svg>);

export const FGel = () => (
  <Svg h={226} aria="Le gel supprime l'air entre la sonde et la peau : sans gel, à l'interface air peau, 99 pour cent de l'énergie est réfléchie et 1 pour cent seulement entre ; avec du gel, 98 pour cent entre ; comme l'onde traverse l'interface à l'aller et au retour, sans gel les échos sont affaiblis de 40 décibels">
    <T x={14} y={20} w={800}>sans gel (air | peau)</T>
    <rect x="14" y="28" width="268" height="18" fill="#fdba74" stroke={ORANGE} strokeWidth="1.6"/><rect x="279" y="28" width="3" height="18" fill="#0369a1"/>
    <T x={14} y={64} c={ORANGE}>R = 0,99</T><T x={286} y={64} a="end" c={BLEU}>T = 0,01</T>
    <T x={14} y={96} w={800}>avec gel (gel | peau)</T>
    <rect x="14" y="104" width="6" height="18" fill="#fdba74" stroke={ORANGE} strokeWidth="1.2"/><rect x="20" y="104" width="262" height="18" fill="#38bdf8" opacity="0.75" stroke={BLEU} strokeWidth="1.6"/>
    <T x={14} y={140} c={ORANGE}>R = 0,02</T><T x={286} y={140} a="end" c={BLEU}>T = 0,98</T>
    <T x={150} y={176} a="middle" w={800}>aller + retour : T × T</T>
    <T x={150} y={198} a="middle" w={800} c={ORANGE}>sans gel : −40 dB</T><T x={150} y={218} a="middle" c={GRIS}>R + T = 1 à chaque interface</T>
  </Svg>);

export const FProfondeur = () => (
  <Svg h={226} aria="Profondeur d'un organe : l'échographe suppose une célérité moyenne de 1540 mètres par seconde pour tous les tissus et calcule la profondeur d égale v fois Δt divisé par 2, le facteur 2 venant de l'aller-retour ; le retard se lit en microsecondes et se convertit en secondes">
    <rect x="12" y="40" width="22" height="46" rx="4" fill="#cbd5e1" stroke={GRIS} strokeWidth="2"/><T x={23} y={34} a="middle" c={GRIS}>sonde</T>
    <rect x="40" y="30" width="214" height="66" fill="#fef2f2" stroke={GRIS} strokeWidth="1.4"/><rect x="226" y="30" width="28" height="66" fill="#e9d5ff" stroke={GRIS} strokeWidth="1.4"/><T x={240} y={24} a="middle" c={GRIS}>organe</T>
    <Fleche x1={38} y1={53} x2={224} y2={53} c={ORANGE} w={2.4}/><Fleche x1={224} y1={73} x2={38} y2={73} c={BLEU} w={2.4}/>
    <Lg x1={40} y1={104} x2={226} y2={104} c={GRIS} w={1.6}/><T x={133} y={120} a="middle" w={800}>profondeur d</T>
    <TE x={150} y={152} a="middle" w={800} parts={['d = v × Δt ÷ 2']}/>
    <T x={150} y={176} a="middle" c={GRIS}>÷ 2 : aller-retour</T><T x={150} y={196} a="middle" c={GRIS}>µs → s : × 10⁻⁶</T><T x={150} y={212} a="middle" c={VERT} w={800}>v = 1 540 m·s⁻¹ (moyenne)</T>
  </Svg>);

export const FAbsorption = () => {
  const x0 = 40, y0 = 34, seuil = 118;
  return (
    <Svg h={218} aria="Absorption : l'atténuation en décibels est proportionnelle à la fréquence et à la distance parcourue aller-retour ; deux droites partent de zéro décibel, celle de 10 mégahertz descend deux fois plus vite que celle de 5 mégahertz et passe sous le seuil de détection avant la profondeur de l'organe, ce qui fait disparaître l'écho">
      <T x={150} y={14} a="middle" w={800}>L’absorption augmente avec f</T>
      <Lg x1={x0} y1={22} x2={x0} y2={160} c={GRIS} w={1.8}/><Lg x1={x0} y1={y0} x2={290} y2={y0} c={GRIS} w={1.8}/><T x={288} y={y0 - 6} a="end" c={GRIS}>distance</T><T x={34} y={y0 + 10} a="end" c={GRIS}>0 dB</T>
      <Lg x1={x0} y1={y0} x2={286} y2={y0 + 66} c={BLEU} w={3}/><Lg x1={x0} y1={y0} x2={286} y2={y0 + 160} c={ORANGE} w={3} d={undefined}/>
      <Lg x1={x0} y1={seuil} x2={290} y2={seuil} c={ROUGE} w={1.6} d="5 4"/><T x={34} y={seuil + 4} a="end" c={ROUGE}>seuil</T>
      <Lg x1={226} y1={y0} x2={226} y2={166} c={GRIS} w={1.6} d="3 3"/><T x={226} y={180} a="middle" c={GRIS}>organe</T>
      <T x={282} y={y0 + 54} a="end" c={BLEU} w={800}>5 MHz : détecté</T><T x={150} y={150} c={ORANGE} w={800}>10 MHz : sous le seuil</T>
      <TE x={150} y={206} a="middle" parts={['atténuation = α × f × distance (aller-retour)']}/>
    </Svg>);
};

export const FLambda = () => {
  const w = (a, lam, cy) => { const o = []; for (let x = 0; x <= 250; x += 1) o.push(`${(24 + x).toFixed(1)},${(cy - 20 * Math.sin(x / lam * Math.PI * 2)).toFixed(1)}`); return o.join(' '); };
  return (
    <Svg h={212} aria="Longueur d'onde et résolution : lambda égale v divisé par f ; à basse fréquence la longueur d'onde est grande, à haute fréquence elle est petite ; plus lambda est petite, plus on distingue de petits détails">
      <T x={150} y={14} a="middle" w={800}>λ = v ÷ f</T>
      <T x={14} y={34} c={BLEU} w={800}>f petite</T><polyline points={w(0, 90, 70)} fill="none" stroke={BLEU} strokeWidth="2.4"/>
      <Lg x1={24} y1={100} x2={114} y2={100} c={BLEU} w={2}/><T x={69} y={116} a="middle" c={BLEU} w={800}>λ grande</T>
      <T x={14} y={142} c={ORANGE} w={800}>f grande</T><polyline points={w(0, 30, 170)} fill="none" stroke={ORANGE} strokeWidth="2.4"/>
      <Lg x1={24} y1={196} x2={54} y2={196} c={ORANGE} w={2}/><T x={62} y={200} c={ORANGE} w={800}>λ petite</T>
      <T x={290} y={116} a="end" c={GRIS}>détails mal vus</T><T x={290} y={200} a="end" c={VERT} w={800}>détails fins vus</T>
    </Svg>);
};

export const FSepare = () => (
  <Svg h={218} aria="Séparer deux détails : si l'écart s entre les deux détails est inférieur à la longueur d'onde, les deux échos se recouvrent et on ne voit qu'un seul pic ; si s est au moins égal à lambda, on voit deux pics distincts ; la condition est lambda inférieur ou égal à s, soit f supérieur ou égal à v divisé par s">
    <Lg x1={14} y1={90} x2={290} y2={90} c={GRIS} w={1.6}/><polyline points={gauss([140, 152], 14, 34, 90, 14, 290)} fill="none" stroke={ORANGE} strokeWidth="2.6"/>
    <T x={150} y={20} a="middle" w={800} c={ORANGE}>s &lt; λ : un seul pic</T>
    <Lg x1={14} y1={178} x2={290} y2={178} c={GRIS} w={1.6}/><polyline points={gauss([110, 190], 14, 40, 178, 14, 290)} fill="none" stroke={VERT} strokeWidth="2.6"/>
    <T x={150} y={118} a="middle" w={800} c={VERT}>s ≥ λ : deux pics</T>
    <TE x={150} y={206} a="middle" w={800} parts={['λ ≤ s ⇔ f ≥ v ÷ s']}/>
  </Svg>);

export const FCompromis = () => {
  const X = f => 20 + (f - 1) / 14 * 260;
  return (
    <Svg h={212} aria="Compromis sur la fréquence : une bonne résolution demande une fréquence au moins égale à 3,2 mégahertz, et l'écho du fond n'est plus détecté au-delà de 5,6 mégahertz ; on choisit une fréquence entre 3,2 et 5,6 mégahertz ; une fréquence plus élevée améliore la résolution mais diminue la pénétration">
      <T x={150} y={14} a="middle" w={800}>Choisir la fréquence</T>
      <rect x={X(3.2)} y="28" width={X(15) - X(3.2)} height="22" fill="#86efac" opacity="0.7" stroke={VERT} strokeWidth="1.6"/><T x={X(3.2) + 6} y={44} c={VERT} w={800}>résolution : f ≥ 3,2</T>
      <rect x={X(1)} y="62" width={X(5.6) - X(1)} height="22" fill="#7dd3fc" opacity="0.7" stroke={BLEU} strokeWidth="1.6"/><T x={X(5.6) + 6} y={78} c={BLEU} w={800}>fond vu : f ≤ 5,6</T>
      <rect x={X(3.2)} y="100" width={X(5.6) - X(3.2)} height="22" fill="#fdba74" opacity="0.9" stroke={ORANGE} strokeWidth="2"/>
      <T x={X(4.4)} y={138} a="middle" c={ORANGE} w={800}>les deux : le bon choix</T>
      <Lg x1={X(1)} y1={150} x2={X(15)} y2={150} c={GRIS} w={1.8}/>{[1, 5, 10, 15].map(f => <g key={f}><Lg x1={X(f)} y1={146} x2={X(f)} y2={154} c={GRIS} w={1.8}/><T x={X(f)} y={168} a="middle" c={GRIS}>{f}</T></g>)}
      <T x={290} y={186} a="end" c={GRIS}>MHz</T>
      <T x={150} y={204} a="middle" c={GRIS}>f ↑ : meilleure résolution, moins de pénétration</T>
    </Svg>);
};
