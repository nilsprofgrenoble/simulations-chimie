// ====================================================
//  Schémas de la simulation 242 (cellule photovoltaïque : du photon au rendement ; niveau TG).
//  Scène animée : viewBox 420 × 312, textes ≥ 15. Autres scènes : viewBox 400, textes ≥ 15. Cartes : viewBox de 320, textes ≥ 15,5.
//  Animation en SMIL (boucle de 5 s), absente si anim = false (préférence « réduire les animations ») : une image fixe parlante la remplace.
//  Physique : un photon absorbé libère un électron ; la structure de la cellule l'envoie vers la face avant (borne −) et laisse un manque
//  d'électron (+) vers la face arrière (borne +). Dans le circuit extérieur, les électrons vont de la borne − vers la borne + ;
//  le sens conventionnel du courant I est l'inverse : de la borne + vers la borne − à travers la lampe.
// ====================================================
import { energieEv, lambdaMaxNm } from "./pvcModele";
const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', gris: '#475569', txt: '#0f172a', clair: '#cbd5e1', paroi: '#334155',
  photon: '#f59e0b', elec: '#2563eb', elecBord: '#1e3a8a', manque: '#dc2626', manqueBord: '#7f1d1d' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const SVG_STYLE = { width: '100%', maxWidth: 480, display: 'block', margin: '0 auto' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const Tx = ({ x, y, children, c = COL.txt, s = 17, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 9 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};
// Charges : électron (−, bleu) et manque d'électron (+, rouge). Le signe est écrit dans le disque : jamais la couleur seule.
const Elec = ({ cx, cy, r = 9, ...rest }) => (<g {...rest}><circle cx={cx} cy={cy} r={r} fill={COL.elec} stroke={COL.elecBord} strokeWidth={2}/><text x={cx} y={cy + 5} fontSize={14} fontWeight={700} fill="#fff" textAnchor="middle">−</text></g>);
const Manque = ({ cx, cy, r = 9, ...rest }) => (<g {...rest}><circle cx={cx} cy={cy} r={r} fill={COL.manque} stroke={COL.manqueBord} strokeWidth={2}/><text x={cx} y={cy + 5} fontSize={14} fontWeight={700} fill="#fff" textAnchor="middle">+</text></g>);
// Photon : disque jaune et courte onde (queue), centré sur (cx, cy).
const Photon = ({ cx, cy }) => (<g><path d={`M${cx},${cy - 26} q5,6 0,12 q-5,6 0,12`} fill="none" stroke={COL.orange} strokeWidth={2.5} strokeLinecap="round"/><circle cx={cx} cy={cy} r={8} fill={COL.photon} stroke={COL.orange} strokeWidth={2.5}/></g>);

// ---------- scène : la cellule, la lumière, le circuit ----------
// anim = true : boucle de 5 s (photons qui tombent, électron et manque qui se séparent, électrons dans le circuit). Rien ne donne une valeur à calculer.
export function SceneCellule({ anim = true, aria }) {
  const XS = [100, 160, 220], Y0 = 40, YA = 140, D = YA - Y0;   // abscisses des photons, départ, ordonnée d'absorption
  const circuit = 'M250,98 H370 V196 H250';
  const label = aria || 'Une cellule photovoltaïque est éclairée par des photons. Un photon absorbé libère un électron : il se dirige vers la face avant, la borne moins, pendant qu’un manque d’électron se dirige vers la face arrière, la borne plus. Dans le circuit, les électrons vont de la borne moins vers la borne plus à travers une lampe ; le sens conventionnel du courant I est inverse.';
  const ev = (att, vals, kt, off, extra = {}) => <animate attributeName={att} values={vals} keyTimes={kt} dur="5s" begin={`${off}s`} repeatCount="indefinite" {...extra}/>;
  return (
    <svg viewBox="0 0 420 330" role="img" aria-label={label} style={SVG_STYLE}>
      {/* cellule : deux zones (la structure interne), contacts avant et arrière */}
      <rect x={30} y={100} width={220} height={24} fill="#bfdbfe"/><rect x={30} y={124} width={220} height={66} fill="#fecaca"/>
      <rect x={30} y={100} width={220} height={90} fill="none" stroke={COL.paroi} strokeWidth={3}/>
      <line x1={30} y1={124} x2={250} y2={124} stroke={COL.gris} strokeWidth={1.5} strokeDasharray="5 4"/>
      <rect x={30} y={94} width={220} height={6} fill={COL.paroi}/><rect x={30} y={190} width={220} height={10} fill={COL.paroi}/>
      <Tx x={140} y={228} ancre="middle" s={17}>cellule photovoltaïque</Tx>
      {/* circuit extérieur */}
      <path d="M250,98 H370 V124 M370,168 V196 H250" fill="none" stroke={COL.paroi} strokeWidth={4}/>
      <circle cx={370} cy={146} r={22} fill="#fef9c3" stroke={COL.paroi} strokeWidth={3.5}/>
      <path d="M355,131 L385,161 M385,131 L355,161" stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={370} y={222} ancre="middle" s={17}>lampe</Tx>
      {/* flèches de sens : électrons (borne − vers borne +) et courant conventionnel I (inverse) */}
      <Fleche x1={272} y1={114} x2={336} y2={114} c={COL.elec} w={3.5} tete={11}/><Tx x={304} y={136} ancre="middle" s={15} c={COL.elec}>électrons</Tx>
      <Fleche x1={336} y1={180} x2={272} y2={180} c={COL.gris} w={3.5} tete={11}/><Tx x={304} y={170} ancre="middle" s={15} c={COL.gris}>courant I</Tx>
      <Tx x={258} y={86} s={16}>borne −</Tx><Tx x={258} y={222} s={16}>borne +</Tx>
      <Tx x={16} y={22} s={17} c={COL.orange}>lumière</Tx>
      {anim ? (<g>
        {XS.map((X, k) => { const off = -(k * 1.7).toFixed(1);
          return (<g key={X}>
            <g opacity={0}><Photon cx={X} cy={Y0}/>
              <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;0 ${D};0 ${D}`} keyTimes="0;0.05;0.40;1" dur="5s" begin={`${off}s`} repeatCount="indefinite"/>
              {ev('opacity', '0;1;1;0;0', '0;0.05;0.40;0.42;1', off)}</g>
            <g opacity={0}><Elec cx={X - 7} cy={YA}/>
              <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -30;0 -30" keyTimes="0;0.43;0.65;1" dur="5s" begin={`${off}s`} repeatCount="indefinite"/>
              {ev('opacity', '0;0;1;1;0;0', '0;0.40;0.43;0.65;0.72;1', off)}</g>
            <g opacity={0}><Manque cx={X + 7} cy={YA}/>
              <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 36;0 36" keyTimes="0;0.43;0.65;1" dur="5s" begin={`${off}s`} repeatCount="indefinite"/>
              {ev('opacity', '0;0;1;1;0;0', '0;0.40;0.43;0.65;0.72;1', off)}</g>
          </g>); })}
        {[0, 1, 2, 3, 4, 5].map(k => (<circle key={k} r={6} fill={COL.elec} stroke={COL.elecBord} strokeWidth={1.5}>
          <animateMotion dur="9s" begin={`${-k * 1.5}s`} repeatCount="indefinite" path={circuit}/></circle>))}
      </g>) : (<g>
        <Photon cx={100} cy={70}/><Photon cx={220} cy={96}/>
        <Elec cx={153} cy={132}/><Manque cx={167} cy={160}/>
        <Fleche x1={153} y1={120} x2={153} y2={106} c={COL.elecBord} w={2.5} tete={7}/><Fleche x1={167} y1={172} x2={167} y2={184} c={COL.manqueBord} w={2.5} tete={7}/>
        {[[290, 98], [340, 98], [370, 118], [370, 172], [330, 196], [280, 196]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={6} fill={COL.elec} stroke={COL.elecBord} strokeWidth={1.5}/>)}
      </g>)}
      {/* légende */}
      <g><circle cx={24} cy={256} r={8} fill={COL.photon} stroke={COL.orange} strokeWidth={2.5}/><Tx x={42} y={262} s={16}>photon (lumière)</Tx>
        <Elec cx={24} cy={280}/><Tx x={42} y={286} s={16}>électron libéré, puis électron du circuit</Tx>
        <Manque cx={24} cy={304}/><Tx x={42} y={310} s={16}>manque d’électron, côté borne +</Tx></g>
    </svg>);
}

// ---------- scène d'exploration : l'axe des longueurs d'onde, le seuil et le photon choisi ----------
const XL = l => 20 + (l - 300) / 1200 * 360;
export function SceneSeuil({ lambda, gap, aria }) {
  const lm = lambdaMaxNm(gap), E = energieEv(lambda), ab = E >= gap;
  const xl = Math.max(26, Math.min(374, XL(lambda))), xs = XL(lm);
  const anc = x => (x < 60 ? 'start' : x > 340 ? 'end' : 'middle'), ax = x => (x < 60 ? x - 6 : x > 340 ? x + 6 : x);
  const txtE = `E_ph = ${nbf(E, 2)} eV ${ab ? '≥' : '<'} ${nbf(gap, 2)} eV : ${ab ? 'photon absorbé' : 'photon non absorbé'}`;
  return (
    <svg viewBox="0 0 400 226" role="img" aria-label={aria || `Axe des longueurs d’onde de 300 à 1500 nanomètres. Le seuil d’absorption est à ${nbf(lm, 0)} nanomètres. Le photon choisi, de ${nbf(lambda, 0)} nanomètres, a une énergie de ${nbf(E, 2)} électronvolts : ${ab ? 'il est absorbé' : 'il n’est pas absorbé'}.`} style={SVG_STYLE}>
      <defs><linearGradient id="pvc-arc" x1={XL(380)} x2={XL(780)} y1="0" y2="0" gradientUnits="userSpaceOnUse">
        {[['0', '#7c3aed'], ['0.17', '#2563eb'], ['0.3', '#06b6d4'], ['0.45', '#22c55e'], ['0.6', '#eab308'], ['0.78', '#f97316'], ['1', '#b91c1c']].map(([o, c]) => <stop key={o} offset={o} stopColor={c}/>)}</linearGradient></defs>
      <rect x={XL(300)} y={56} width={XL(380) - XL(300)} height={38} fill="#e2e8f0"/><rect x={XL(380)} y={56} width={XL(780) - XL(380)} height={38} fill="url(#pvc-arc)"/>
      <rect x={XL(780)} y={56} width={XL(1500) - XL(780)} height={38} fill="#e7e5e4"/>
      <rect x={XL(300)} y={56} width={XL(1500) - XL(300)} height={38} fill="none" stroke={COL.paroi} strokeWidth={2.5}/>
      <Tx x={XL(340)} y={80} ancre="middle" s={15}>UV</Tx><Tx x={XL(580)} y={80} ancre="middle" s={15}>visible</Tx><Tx x={xs > XL(1140) - 50 ? xs + 50 : XL(1140)} y={80} ancre="middle" s={15}>infrarouge</Tx>
      {[400, 600, 800, 1000, 1200, 1400].map(l => <g key={l}><line x1={XL(l)} y1={94} x2={XL(l)} y2={100} stroke={COL.paroi} strokeWidth={2}/><Tx x={XL(l)} y={118} ancre="middle" s={15} w={600} halo={false}>{l}</Tx></g>)}
      <Tx x={396} y={136} ancre="end" s={15} c={COL.gris} halo={false}>longueur d’onde (nm)</Tx>
      <line x1={xs} y1={44} x2={xs} y2={96} stroke={COL.vert} strokeWidth={3} strokeDasharray="6 4"/>
      <Tx x={ax(xs)} y={36} ancre={anc(xs)} s={15} c={COL.vert}>seuil {nbf(lm, 0)} nm</Tx>
      <Fleche x1={xl} y1={170} x2={xl} y2={144} c={ab ? COL.vert : COL.rouge} w={3.5} tete={11}/>
      <Tx x={ax(xl)} y={190} ancre={anc(xl)} s={16} c={ab ? COL.vert : COL.rouge}>ce photon : {nbf(lambda, 0)} nm</Tx>
      <Tx x={200} y={216} ancre="middle" s={16.5} c={ab ? COL.vert : COL.rouge}>{txtE}</Tx>
    </svg>);
}

// ---------- scène d'exploration : le bilan de puissance (flux proportionnels à la puissance) ----------
const fmtP = p => (p >= 100 ? nbf(p, 0) : p >= 10 ? nbf(p, 1) : nbf(p, 2));
export function SankeyBilan({ Prec, Pel, aria }) {
  const eta = Pel / Prec, H = 120, y0 = 54, hu = Math.max(8, H * eta), hp = H - H * eta;
  const yu = 54, yp = yu + hu + 34;                  // blocs de sortie
  const band = (ya, h, yb) => `M60,${ya} C150,${ya} 150,${yb} 236,${yb} L236,${yb + h} C150,${yb + h} 150,${ya + h} 60,${ya + h} Z`;
  return (
    <svg viewBox="0 0 400 252" role="img" aria-label={aria || `Bilan de puissance : la cellule reçoit ${fmtP(Prec)} watts de lumière, fournit ${fmtP(Pel)} watts d’énergie électrique, et ${fmtP(Prec - Pel)} watts sont perdus, soit un rendement de ${nbf(100 * eta, 0)} pour cent.`} style={SVG_STYLE}>
      <path d={band(y0, hu, yu)} fill="#86efac" stroke={COL.vert} strokeWidth={2}/>
      <path d={band(y0 + hu, hp, yp)} fill="#fdba74" stroke={COL.orange} strokeWidth={2}/>
      <rect x={16} y={y0} width={44} height={H} fill="#fde68a" stroke={COL.orange} strokeWidth={3}/>
      <rect x={236} y={yu} width={30} height={hu} fill="#4ade80" stroke={COL.vert} strokeWidth={3}/><rect x={236} y={yp} width={30} height={hp} fill="#fb923c" stroke={COL.orange} strokeWidth={3}/>
      <Tx x={16} y={34} s={16.5} c={COL.orange}>reçue : {fmtP(Prec)} W</Tx>
      <Tx x={274} y={yu + Math.min(hu, 30) / 2 + 6} s={16.5} c={COL.vert}>utile : {fmtP(Pel)} W</Tx><Tx x={274} y={yu + Math.min(hu, 30) / 2 + 26} s={15} c={COL.vert} w={600}>(électrique)</Tx>
      <Tx x={274} y={yp + hp / 2 - 4} s={16.5} c={COL.orange}>pertes : {fmtP(Prec - Pel)} W</Tx><Tx x={274} y={yp + hp / 2 + 16} s={15} c={COL.orange} w={600}>(chaleur…)</Tx>
      <Tx x={200} y={236} ancre="middle" s={17}>rendement η = {nbf(100 * eta, 0)} %</Tx>
    </svg>);
}

// ---------- cartes « À retenir » (viewBox 320) ----------
const SvgCarte = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>{children}</svg>;
const Barre = ({ x1, x2, y, c = COL.bleu }) => <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={2.5}/>;

export function SvgCarteCellule() {
  const boites = [['Lumière : des photons', '#fef3c7', COL.orange], ['Photon absorbé : un électron libéré', '#dbeafe', COL.elec], ['Électrons en mouvement : courant I', '#dbeafe', COL.elec], ['Lampe : énergie électrique utilisée', '#dcfce7', COL.vert]];
  return (
    <SvgCarte h={308} aria="Du photon au courant : la lumière envoie des photons ; un photon absorbé par la cellule libère un électron ; les électrons se mettent en mouvement dans le circuit, c’est le courant I ; le récepteur utilise cette énergie électrique. Un photon trop peu énergétique n’est pas absorbé.">
      {boites.map(([t, f, b], k) => (<g key={t}>
        <rect x={10} y={8 + 66 * k} width={300} height={44} rx={10} fill={f} stroke={b} strokeWidth={2.5}/>
        <Tx x={160} y={36 + 66 * k} ancre="middle" s={16} halo={false}>{t}</Tx>
        {k < 3 && <Fleche x1={160} y1={52 + 66 * k} x2={160} y2={72 + 66 * k} c={COL.paroi} w={3} tete={10}/>}</g>))}
      <Tx x={160} y={284} ancre="middle" s={15.5} w={600} c={COL.gris}>Photon trop peu énergétique :</Tx><Tx x={160} y={303} ancre="middle" s={15.5} w={600} c={COL.gris}>non absorbé, rien ne se passe</Tx>
    </SvgCarte>);
}
export function SvgCarteEnergie() {
  return (
    <SvgCarte h={296} aria="Énergie d’un photon : E indice ph égale h fois c divisé par lambda. E en joules, lambda en mètres, h vaut 6,63 fois dix puissance moins trente-quatre joule seconde, c vaut 3,00 fois dix puissance huit mètres par seconde, et un électronvolt vaut 1,60 fois dix puissance moins dix-neuf joule. Plus la longueur d’onde est petite, plus le photon est énergétique.">
      <rect x={10} y={8} width={300} height={86} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={96} y={58} ancre="end" s={22} c={COL.bleu} halo={false}>E_ph =</Tx>
      <Tx x={190} y={44} ancre="middle" s={22} c={COL.bleu} halo={false}>h × c</Tx><Barre x1={106} x2={270} y={54}/><Tx x={190} y={82} ancre="middle" s={22} c={COL.bleu} halo={false}>λ</Tx>
      <Tx x={16} y={122} s={16.5}>E_ph : énergie du photon (J)</Tx>
      <Tx x={16} y={148} s={16.5}>λ : longueur d’onde (en m)</Tx>
      <Tx x={16} y={174} s={16.5}>h = 6,63×10⁻³⁴ J·s</Tx><Tx x={16} y={198} s={16.5}>c = 3,00×10⁸ m·s⁻¹</Tx>
      <Tx x={16} y={222} s={16.5}>1 eV = 1,60×10⁻¹⁹ J</Tx>
      <Tx x={16} y={256} s={15.5} w={600} c={COL.gris}>Plus λ est petite, plus le photon est</Tx><Tx x={16} y={276} s={15.5} w={600} c={COL.gris}>énergétique (bleu &gt; rouge &gt; infrarouge)</Tx>
    </SvgCarte>);
}
export function SvgCarteSeuil() {
  const X = l => 20 + (l - 300) * 0.2333;
  return (
    <SvgCarte h={300} aria="Seuil d’absorption du silicium : un photon n’est absorbé que si son énergie est au moins égale à 1,12 électronvolt, c’est-à-dire si sa longueur d’onde est inférieure à 1110 nanomètres. À droite du seuil, dans l’infrarouge, les photons ne sont pas absorbés. Un photon plus énergétique que nécessaire est absorbé, mais l’excédent d’énergie est perdu en chaleur.">
      <Tx x={160} y={20} ancre="middle" s={16.5}>Silicium : seuil à 1,12 eV</Tx>
      <rect x={X(300)} y={54} width={X(380) - X(300)} height={30} fill="#e2e8f0"/><rect x={X(380)} y={54} width={X(780) - X(380)} height={30} fill="#fde68a"/><rect x={X(780)} y={54} width={X(1500) - X(780)} height={30} fill="#e7e5e4"/>
      <rect x={X(300)} y={54} width={X(1500) - X(300)} height={30} fill="none" stroke={COL.paroi} strokeWidth={2.5}/>
      <line x1={X(1110)} y1={44} x2={X(1110)} y2={90} stroke={COL.vert} strokeWidth={3} strokeDasharray="6 4"/>
      <Tx x={X(1110)} y={40} ancre="middle" s={15.5} c={COL.vert}>1110 nm</Tx>
      {[400, 800, 1200].map(l => <g key={l}><line x1={X(l)} y1={84} x2={X(l)} y2={90} stroke={COL.paroi} strokeWidth={2}/><Tx x={X(l)} y={108} ancre="middle" s={15.5} w={600} halo={false}>{l}</Tx></g>)}
      <Tx x={310} y={108} ancre="end" s={15.5} c={COL.gris} halo={false}>nm</Tx>
      <Tx x={X(340)} y={132} ancre="middle" s={15.5} w={600} c={COL.gris} halo={false}>UV</Tx><Tx x={X(580)} y={132} ancre="middle" s={15.5} w={600} c={COL.gris} halo={false}>visible</Tx><Tx x={262} y={132} ancre="middle" s={15.5} w={600} c={COL.gris} halo={false}>infrarouge</Tx>
      <Tx x={16} y={170} s={16.5} c={COL.vert}>E_ph ≥ 1,12 eV : photon absorbé,</Tx><Tx x={16} y={192} s={16.5} c={COL.vert}>il libère un électron</Tx>
      <Tx x={16} y={222} s={16.5} c={COL.orange}>Excédent d’énergie : perdu en</Tx><Tx x={16} y={244} s={16.5} c={COL.orange}>chaleur (photons bleus)</Tx>
      <Tx x={16} y={274} s={16.5} c={COL.rouge}>E_ph &lt; 1,12 eV : non absorbé</Tx><Tx x={16} y={294} s={15.5} w={600} c={COL.gris}>(infrarouge lointain)</Tx>
    </SvgCarte>);
}
export function SvgCartePuissances() {
  return (
    <SvgCarte h={292} aria="Puissances : la puissance lumineuse reçue est l’éclairement E multiplié par la surface S ; la puissance électrique est la tension U multipliée par l’intensité I ; le rendement est la puissance électrique divisée par la puissance reçue, sans unité.">
      <rect x={10} y={8} width={300} height={40} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/><Tx x={160} y={36} ancre="middle" s={20} c={COL.bleu} halo={false}>P_reçue = E × S</Tx>
      <Tx x={16} y={68} s={15.5} w={600}>E : éclairement (W·m⁻²), S : surface (m²)</Tx>
      <rect x={10} y={88} width={300} height={40} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/><Tx x={160} y={116} ancre="middle" s={20} c={COL.bleu} halo={false}>P_él = U × I</Tx>
      <Tx x={16} y={148} s={15.5} w={600}>U : tension (V), I : intensité (A)</Tx>
      <rect x={10} y={168} width={300} height={70} rx={10} fill="#f0fdf4" stroke={COL.vert} strokeWidth={2.5}/>
      <Tx x={92} y={210} ancre="end" s={20} c={COL.vert} halo={false}>η =</Tx><Tx x={188} y={198} ancre="middle" s={20} c={COL.vert} halo={false}>P_él</Tx><Barre x1={102} x2={274} y={206} c={COL.vert}/><Tx x={188} y={228} ancre="middle" s={20} c={COL.vert} halo={false}>P_reçue</Tx>
      <Tx x={16} y={262} s={15.5} w={600}>η sans unité (entre 0 et 1) ;</Tx><Tx x={16} y={280} s={15.5} w={600}>× 100 pour l’exprimer en %</Tx>
    </SvgCarte>);
}
export function SvgCartePertes() {
  return (
    <SvgCarte h={316} aria="Bilan de puissance d’une cellule : la puissance reçue se partage en une petite part de puissance électrique utile, par exemple 20 pour cent, et une grande part de pertes, surtout de la chaleur. Rendement égal puissance électrique divisée par puissance reçue. Pertes égales puissance reçue moins puissance électrique.">
      <path d="M58,52 C120,52 120,52 190,52 L190,76 C120,76 120,76 58,76 Z" fill="#86efac" stroke={COL.vert} strokeWidth={2}/>
      <path d="M58,76 C120,76 120,102 190,102 L190,198 C120,198 120,172 58,172 Z" fill="#fdba74" stroke={COL.orange} strokeWidth={2}/>
      <rect x={14} y={52} width={44} height={120} fill="#fde68a" stroke={COL.orange} strokeWidth={3}/>
      <rect x={190} y={52} width={28} height={24} fill="#4ade80" stroke={COL.vert} strokeWidth={3}/><rect x={190} y={102} width={28} height={96} fill="#fb923c" stroke={COL.orange} strokeWidth={3}/>
      <Tx x={14} y={38} s={16.5} c={COL.orange}>P_reçue</Tx>
      <Tx x={226} y={62} s={16.5} c={COL.vert}>P_él</Tx><Tx x={226} y={82} s={15.5} w={600} c={COL.vert}>(utile)</Tx>
      <Tx x={226} y={148} s={16.5} c={COL.orange}>pertes</Tx><Tx x={226} y={168} s={15.5} w={600} c={COL.orange}>(chaleur…)</Tx>
      <Tx x={16} y={232} s={16.5}>η = P_él / P_reçue (ici 20 %)</Tx>
      <Tx x={16} y={258} s={16.5}>pertes = P_reçue − P_él</Tx>
      <Tx x={16} y={288} s={15.5} w={600} c={COL.gris}>Rien ne se perd : l’énergie non</Tx><Tx x={16} y={308} s={15.5} w={600} c={COL.gris}>convertie devient de la chaleur</Tx>
    </SvgCarte>);
}
export function SvgCarteBilanPvc() {
  const etapes = [['1', 'Photon : E_ph = h × c / λ ≥ E_seuil'], ['2', 'Reçue : P_reçue = E × S'], ['3', 'Électrique : P_él = U × I'], ['4', 'Rendement η = P_él / P_reçue']];
  return (
    <SvgCarte h={284} aria="Méthode en quatre étapes : vérifier que le photon est assez énergétique, calculer la puissance reçue, calculer la puissance électrique, puis le rendement ; les pertes sont la différence entre puissance reçue et puissance électrique.">
      <Tx x={160} y={22} ancre="middle" s={16.5}>Méthode pour une cellule</Tx>
      {etapes.map(([n, t], k) => (<g key={n}>
        <circle cx={26} cy={58 + 46 * k} r={15} fill={COL.bleu}/><Tx x={26} y={64 + 46 * k} ancre="middle" c="#fff" halo={false} s={17}>{n}</Tx>
        <Tx x={52} y={64 + 46 * k} s={15.5}>{t}</Tx></g>))}
      <Tx x={16} y={254} s={15.5} c={COL.gris} w={600}>Pertes : P_reçue − P_él ;</Tx><Tx x={16} y={274} s={15.5} c={COL.gris} w={600}>l’énergie non convertie chauffe la cellule</Tx>
    </SvgCarte>);
}
