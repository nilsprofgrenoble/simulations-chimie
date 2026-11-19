// Schémas des cartes « À retenir » de la simulation 87 (son : spectre, hauteur, timbre, niveau sonore). viewBox de 300, texte de 12,5.
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
const sinus = (x0, x1, cy, amp, lam, ph = 0) => { const o = []; for (let x = x0; x <= x1; x += 1) o.push(`${x},${(cy - amp * Math.sin((x - x0) / lam * Math.PI * 2 + ph)).toFixed(1)}`); return o.join(' '); };
const Raies = ({ x0, base, h, pas, vals, c, noms, w = 8 }) => <g>{vals.map((v, i) => v > 0 && <g key={i}><rect x={x0 + i * pas - w / 2} y={base - v * h} width={w} height={v * h} fill={c}/>{noms && <T x={x0 + i * pas} y={base + 16} a="middle" c={GRIS}>{noms[i]}</T>}</g>)}</g>;

export const FPeriode = () => (
  <Svg h={216} aria="Mesure de la période : on place deux repères sur des maximums séparés de trois périodes ; la durée d entre les repères est égale à trois périodes, donc T égale d divisé par 3 ; la fréquence est f égale 1 divisé par T, avec T en secondes">
    <Lg x1={14} y1={70} x2={290} y2={70} c={GRIS} w={1.4}/><polyline points={sinus(30, 246, 70, 30, 72)} fill="none" stroke={BLEU} strokeWidth="2.4"/>
    <Lg x1={30 + 18} y1={26} x2={30 + 18} y2={132} c={ORANGE} w={1.8} d="4 3"/><Lg x1={30 + 18 + 216} y1={26} x2={30 + 18 + 216} y2={132} c={ORANGE} w={1.8} d="4 3"/>
    <Fleche x1={50} y1={126} x2={262} y2={126} c={ORANGE} w={2.2}/><T x={156} y={120} a="middle" c={ORANGE} w={800}>d = 3 périodes</T>
    <T x={156} y={152} a="middle" w={800}>T = d ÷ n   (n = 3)</T>
    <T x={156} y={172} a="middle" w={800} c={VERT}>f = 1 ÷ T</T>
    <T x={156} y={192} a="middle" c={GRIS}>T en secondes, f en hertz</T><T x={156} y={210} a="middle" c={GRIS}>plusieurs périodes : mesure plus précise</T>
  </Svg>);

export const FHarmo = () => (
  <Svg h={210} aria="Spectre d'un son périodique : un fondamental de fréquence f1 et des harmoniques aux fréquences multiples, deux f1, trois f1, quatre f1, cinq f1 ; la fréquence de l'harmonique de rang n est n fois f1 ; les raies sont régulièrement espacées">
    <Lg x1={20} y1={130} x2={284} y2={130} c={GRIS} w={1.8}/>
    <Raies x0={50} base={130} h={90} pas={50} vals={[1, 0.65, 0.45, 0.3, 0.2]} c={BLEU} noms={['f₁', '2 f₁', '3 f₁', '4 f₁', '5 f₁']}/>
    <T x={28} y={36} c={ORANGE} w={800}>fondamental</T><T x={150} y={36} c={VERT} w={800}>harmoniques</T>
    <T x={150} y={176} a="middle" w={800}>fₙ = n × f₁   (n = 2, 3, 4…)</T>
    <T x={150} y={200} a="middle" c={GRIS}>même écart f₁ entre deux raies</T>
  </Svg>);

export const FHauteur = () => (
  <Svg h={212} aria="La hauteur est donnée par le fondamental : à gauche un son de 500 hertz, à droite le même timbre à 1000 hertz ; les raies sont deux fois plus écartées mais leurs amplitudes relatives sont les mêmes ; le son est plus aigu, avec le même timbre">
    <Lg x1={10} y1={120} x2={142} y2={120} c={GRIS} w={1.8}/><Lg x1={158} y1={120} x2={290} y2={120} c={GRIS} w={1.8}/>
    <Raies x0={26} base={120} h={80} pas={26} vals={[1, 0.6, 0.4, 0.25]} c={BLEU} noms={['500', '', '', '']}/>
    <Raies x0={174} base={120} h={80} pas={52} vals={[1, 0.6, 0.4, 0.25]} c={ORANGE} noms={['1 000', '', '', '']}/>
    <T x={76} y={28} a="middle" c={BLEU} w={800}>f₁ = 500 Hz</T><T x={224} y={28} a="middle" c={ORANGE} w={800}>f₁ = 1 000 Hz</T>
    <T x={150} y={168} a="middle" w={800} c={VERT}>f₁ ↑ : son plus aigu</T>
    <T x={150} y={192} a="middle" c={GRIS}>mêmes hauteurs relatives : même timbre</T>
  </Svg>);

export const FTimbre = () => (
  <Svg h={216} aria="Timbre : deux instruments jouent la même note, donc le même fondamental ; le violon a des harmoniques de tous les rangs, la clarinette seulement des harmoniques impairs ; la hauteur est donnée par la fréquence du fondamental, le timbre par les amplitudes relatives des harmoniques">
    <Lg x1={10} y1={124} x2={144} y2={124} c={GRIS} w={1.8}/><Lg x1={156} y1={124} x2={290} y2={124} c={GRIS} w={1.8}/>
    <Raies x0={26} base={124} h={80} pas={24} vals={[1, 0.6, 0.45, 0.3, 0.2]} c={BLEU} noms={['f₁', '', '', '', '']}/>
    <Raies x0={172} base={124} h={80} pas={24} vals={[1, 0, 0.55, 0, 0.3]} c={ORANGE} noms={['f₁', '', '3 f₁', '', '5 f₁']}/>
    <T x={78} y={24} a="middle" c={BLEU} w={800}>violon</T><T x={224} y={24} a="middle" c={ORANGE} w={800}>clarinette</T>
    <T x={150} y={166} a="middle" w={800}>hauteur : fréquence de f₁</T>
    <T x={150} y={190} a="middle" w={800} c={VERT}>timbre : amplitudes des harmoniques</T>
    <T x={150} y={210} a="middle" c={GRIS}>même note, instruments différents</T>
  </Svg>);

export const FMoyenne = () => (
  <Svg h={214} aria="Composante continue : en ajoutant une tension constante u0, la courbe oscille à la même fréquence mais autour d'une valeur moyenne plus haute ; sur le spectre, une raie apparaît à 0 hertz ; elle représente la valeur moyenne, et ne produit pas de son car seules les variations de pression sont perçues">
    <Lg x1={14} y1={110} x2={290} y2={110} c={GRIS} w={1.2}/><T x={288} y={126} a="end" c={GRIS}>0</T>
    <polyline points={sinus(20, 280, 66, 22, 65)} fill="none" stroke={BLEU} strokeWidth="2.4"/>
    <Lg x1={14} y1={66} x2={290} y2={66} c={ORANGE} w={1.8} d="5 4"/><T x={20} y={34} c={ORANGE} w={800}>valeur moyenne u₀</T>
    <Lg x1={30} y1={190} x2={286} y2={190} c={GRIS} w={1.8}/><Raies x0={42} base={190} h={44} pas={70} vals={[0.7]} c={ORANGE}/>
    <rect x="164" y="146" width="8" height="44" fill={BLEU}/><T x={42} y={206} a="middle" c={ORANGE} w={800}>0 Hz</T><T x={168} y={206} a="middle" c={BLEU} w={800}>f</T>
    <T x={290} y={150} a="end" c={ORANGE}>pas de son</T>
  </Svg>);

export const FNonPer = () => (
  <Svg h={212} aria="Son périodique ou non : un son périodique a des raies aux multiples d'une même fréquence, avec une hauteur bien définie ; un son non périodique a des raies sans rapport simple entre elles et pas de motif qui se répète, donc pas de hauteur bien définie">
    <T x={14} y={18} w={800} c={VERT}>périodique : multiples de f₁</T>
    <Lg x1={14} y1={84} x2={286} y2={84} c={GRIS} w={1.8}/><Raies x0={50} base={84} h={50} pas={50} vals={[1, 0.6, 0.4, 0.25, 0.15]} c={BLEU}/>
    <T x={14} y={116} w={800} c={ROUGE}>non périodique : raies sans rapport</T>
    <Lg x1={14} y1={182} x2={286} y2={182} c={GRIS} w={1.8}/>{[[40, 0.9], [97, 0.5], [141, 0.8], [203, 0.35], [262, 0.6]].map(([x, v], i) => <rect key={i} x={x - 4} y={182 - v * 50} width="8" height={v * 50} fill={ORANGE}/>)}
    <T x={150} y={204} a="middle" c={GRIS}>pas de hauteur bien définie</T>
  </Svg>);

export const FAmpPuiss = () => (
  <Svg h={206} aria="Amplitude et puissance : la puissance est proportionnelle au carré de l'amplitude ; si l'amplitude est multipliée par 2, la puissance est multipliée par 4, ce qui ajoute 6 décibels">
    <Lg x1={30} y1={150} x2={286} y2={150} c={GRIS} w={1.8}/>
    <rect x="50" y="110" width="40" height="40" fill="#38bdf8" opacity="0.8" stroke={BLEU} strokeWidth="1.6"/><T x={70} y={168} a="middle" c={BLEU} w={800}>a</T>
    <rect x="120" y="70" width="40" height="80" fill="#38bdf8" opacity="0.8" stroke={BLEU} strokeWidth="1.6"/><T x={140} y={168} a="middle" c={BLEU} w={800}>2 a</T>
    <rect x="200" y="110" width="30" height="40" fill="#fdba74" stroke={ORANGE} strokeWidth="1.6"/><rect x="232" y="110" width="30" height="40" fill="#fdba74" stroke={ORANGE} strokeWidth="1.6"/><rect x="200" y="70" width="30" height="40" fill="#fdba74" stroke={ORANGE} strokeWidth="1.6"/><rect x="232" y="70" width="30" height="40" fill="#fdba74" stroke={ORANGE} strokeWidth="1.6"/>
    <T x={231} y={168} a="middle" c={ORANGE} w={800}>4 P</T><T x={14} y={20} w={800}>amplitude ×2</T><T x={170} y={92} a="middle" c={GRIS}>⇒</T>
    <T x={150} y={192} a="middle" w={800} c={VERT}>P ∝ a² : ×4, soit + 6 dB</T>
  </Svg>);

export const FSphere = () => (
  <Svg h={216} aria="Intensité sonore : une source ponctuelle de puissance P rayonne dans toutes les directions ; à la distance r, la puissance se répartit sur une sphère d'aire S égale 4 pi r au carré ; l'intensité est I égale P divisé par S, en watts par mètre carré">
    <circle cx="80" cy="84" r="62" fill="#e0f2fe" stroke={BLEU} strokeWidth="1.8" strokeDasharray="5 4"/><circle cx="80" cy="84" r="7" fill={ORANGE}/>
    <Fleche x1={80} y1={84} x2={140} y2={84} c={GRIS} w={2}/><T x={110} y={76} a="middle" c={GRIS} w={800}>r</T>
    <T x={64} y={106} a="middle" c={ORANGE} w={800}>P</T>
    <T x={184} y={64} w={800}>S = 4 π r²</T><T x={184} y={88} c={GRIS}>aire de la sphère</T>
    <T x={150} y={170} a="middle" w={800} c={VERT}>I = P ÷ S</T>
    <T x={150} y={196} a="middle" c={GRIS}>I en W·m⁻², P en W, S en m²</T>
  </Svg>);

export const FEchelleDb = () => (
  <Svg h={216} aria="Le niveau en décibels : L égale 10 log de I divisé par I zéro ; multiplier l'intensité par 2 ajoute environ 3 décibels ; par 4, 6 décibels ; par 10, 10 décibels ; une échelle logarithmique : on additionne des décibels quand on multiplie des intensités">
    <T x={150} y={16} a="middle" w={800}>L = 10 × log(I ÷ I₀)</T>
    {[['I × 2', 3, '+ 3 dB'], ['I × 4', 6, '+ 6 dB'], ['I × 10', 10, '+ 10 dB']].map(([a, v, t], i) => <g key={i}><T x={14} y={58 + i * 44} c={GRIS} w={800}>{a}</T><rect x="80" y={44 + i * 44} width={v * 16} height="20" fill={ORANGE} opacity="0.8" stroke={ORANGE} strokeWidth="1.4"/><T x={86 + v * 16} y={59 + i * 44} c={ORANGE} w={800}>{t}</T></g>)}
    <T x={150} y={192} a="middle" w={800} c={VERT}>× en intensité : + en dB</T><T x={150} y={210} a="middle" c={GRIS}>échelle logarithmique</T>
  </Svg>);

export const FDistanceDb = () => (
  <Svg h={222} aria="Effet de la distance : chaque fois que la distance double, la surface de la sphère est multipliée par 4, l'intensité est divisée par 4 et le niveau baisse d'environ 6 décibels ; trois sphères à une, deux et quatre fois la distance de départ">
    {[16, 32, 64].map(ra => <circle key={ra} cx={150} cy={84} r={ra} fill="none" stroke={BLEU} strokeWidth="1.8"/>)}
    <circle cx="150" cy="84" r="5" fill={ORANGE}/>
    <T x={150} y={64} a="middle" c={BLEU} w={800}>r</T><T x={150} y={48} a="middle" c={BLEU} w={800}>2 r</T><T x={150} y={16} a="middle" c={BLEU} w={800}>4 r</T>
    <T x={150} y={176} a="middle" w={800}>distance × 2 : S × 4, I ÷ 4</T>
    <T x={150} y={198} a="middle" w={800} c={VERT}>niveau : − 6 dB</T>
    <T x={150} y={216} a="middle" c={GRIS}>vrai à chaque doublement de distance</T>
  </Svg>);

export const FDeuxSources = () => (
  <Svg h={212} aria="Deux sources identiques indépendantes : leurs puissances, donc leurs intensités, s'ajoutent ; l'intensité est doublée, ce qui ajoute 3 décibels au niveau ; on n'additionne pas les niveaux en décibels">
    <circle cx="50" cy="60" r="12" fill="#fdba74" stroke={ORANGE} strokeWidth="1.8"/><circle cx="50" cy="104" r="12" fill="#fdba74" stroke={ORANGE} strokeWidth="1.8"/>
    <T x={74} y={65} c={ORANGE} w={800}>I</T><T x={74} y={109} c={ORANGE} w={800}>I</T>
    <T x={120} y={86} c={GRIS} w={800}>⇒</T><rect x="150" y="48" width="44" height="72" fill="#38bdf8" opacity="0.8" stroke={BLEU} strokeWidth="1.6"/><T x={172} y={90} a="middle" c="#0c4a6e" w={800}>2 I</T>
    <T x={150} y={156} a="middle" w={800} c={VERT}>intensités qui s’ajoutent : + 3 dB</T>
    <T x={150} y={180} a="middle" c={ROUGE} w={800}>jamais 79 dB + 79 dB = 158 dB</T>
    <T x={150} y={202} a="middle" c={GRIS}>on ajoute les intensités, pas les niveaux</T>
  </Svg>);
