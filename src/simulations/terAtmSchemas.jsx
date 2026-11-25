// ====================================================
//  Schémas de la simulation 236 (bilan thermique Terre-atmosphère ; niveau TG).
//  Scène : viewBox 420 × 272, textes ≥ 17. Graphe : viewBox 400 × 300, textes ≥ 15,5. Cartes : viewBox de 320, textes ≥ 15,5.
//  Coordonnées numériques. Public daltonien : jamais la couleur seule (étiquettes écrites, sens des flèches).
// ====================================================
import { SIGMA } from "./terreAtmModele";
const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', gris: '#475569', txt: '#0f172a', clair: '#cbd5e1', paroi: '#334155' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const SVG_STYLE = { width: '100%', maxWidth: 480, display: 'block', margin: '0 auto' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 9 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};

// Scène : Soleil, Terre, rayonnement reçu ; montre : { S0, refl, emis, serre }. Rien ne donne une valeur à calculer.
export function SceneTerre({ montre = {}, aria }) {
  const cx = 282, cy = 140;
  const label = aria || `Le Soleil, à gauche, envoie du rayonnement vers la Terre, à droite.${montre.refl ? ' Une partie est réfléchie vers l’espace.' : ''}${montre.emis ? ' La Terre émet un rayonnement infrarouge vers l’espace.' : ''}${montre.serre ? ' Une atmosphère entoure la Terre et renvoie une partie de l’infrarouge vers le sol.' : ''}`;
  return (
    <svg viewBox="0 0 420 272" role="img" aria-label={label} style={SVG_STYLE}>
      <circle cx={46} cy={140} r={34} fill="#fbbf24" stroke={COL.orange} strokeWidth={4}/>
      <Tx x={46} y={196} ancre="middle" s={18}>Soleil</Tx>
      {[112, 140, 168].map(y => <Fleche key={y} x1={90} y1={y} x2={206} y2={y} c={COL.orange} w={3} tete={11}/>)}
      {montre.S0 && <Tx x={148} y={98} ancre="middle" s={19} c={COL.orange}>S₀</Tx>}
      {montre.serre && <circle cx={cx} cy={cy} r={68} fill="none" stroke="#94a3b8" strokeWidth={6} strokeDasharray="9 6"/>}
      <circle cx={cx} cy={cy} r={46} fill="#7dd3fc" stroke={COL.bleu} strokeWidth={4}/>
      <Tx x={cx} y={cy + 6} ancre="middle" s={19}>Terre</Tx>
      {montre.refl && <g><Fleche x1={214} y1={92} x2={160} y2={44} c={COL.gris} w={3} tete={11}/><Tx x={164} y={34} ancre="end" s={18} c={COL.gris}>réfléchi</Tx></g>}
      {montre.emis && <g><Fleche x1={344} y1={106} x2={406} y2={68} c={COL.rouge} w={3} tete={11}/><Fleche x1={344} y1={174} x2={406} y2={212} c={COL.rouge} w={3} tete={11}/>
        <Tx x={414} y={50} ancre="end" s={18} c={COL.rouge}>infrarouge émis</Tx></g>}
      {montre.serre && <g>{[60, 90, 120].map(t => { const a = t * Math.PI / 180; return <Fleche key={t} x1={cx + 68 * Math.cos(a)} y1={cy + 68 * Math.sin(a)} x2={cx + 50 * Math.cos(a)} y2={cy + 50 * Math.sin(a)} c={COL.rouge} w={3} tete={9}/>; })}
        <Tx x={cx} y={232} ancre="middle" s={18}>atmosphère (pointillés)</Tx><Tx x={cx} y={256} ancre="middle" s={18} c={COL.rouge}>infrarouge renvoyé</Tx></g>}
    </svg>);
}

// Graphe : puissance émise σT⁴ (courbe), puissance absorbée (droite) ; l'intersection donne T. g > 0 : courbe (1 − g) σT⁴.
export function GraphePuissance({ P, g = 0, Teq, aria }) {
  const X = T => 60 + (T - 100) / 300 * 324, Y = p => 250 - Math.min(p, 1500) / 1500 * 226;
  const pts = (k) => { const a = []; for (let T = 100; T <= 400; T += 10) a.push(`${X(T).toFixed(1)},${Y(k * SIGMA * T ** 4).toFixed(1)}`); return a.join(' '); };
  const xe = Teq >= 100 && Teq <= 400 ? X(Teq) : null;
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={aria || `Puissance par mètre carré en fonction de la température : la courbe sigma T puissance 4 croise la droite de la puissance absorbée, ${nbf(P, 0)} W par mètre carré, à ${nbf(Teq, 0)} kelvins.`} style={SVG_STYLE}>
      <line x1={60} y1={20} x2={60} y2={250} stroke={COL.paroi} strokeWidth={3}/><line x1={56} y1={250} x2={392} y2={250} stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={6} y={14} s={15.5} halo={false}>puissance par m² (W·m⁻²)</Tx>
      {[0, 500, 1000, 1500].map(p => <g key={p}><line x1={56} y1={Y(p)} x2={60} y2={Y(p)} stroke={COL.paroi} strokeWidth={2}/><Tx x={52} y={Y(p) + 5} ancre="end" s={15.5} w={600} halo={false}>{p}</Tx></g>)}
      {[100, 200, 300, 400].map(T => <g key={T}><line x1={X(T)} y1={250} x2={X(T)} y2={255} stroke={COL.paroi} strokeWidth={2}/><Tx x={X(T)} y={272} ancre="middle" s={15.5} w={600} halo={false}>{T}</Tx></g>)}
      <Tx x={392} y={294} ancre="end" s={15.5} halo={false}>T (K)</Tx>
      <polyline points={pts(1)} fill="none" stroke={COL.rouge} strokeWidth={3.5}/>
      {g > 0 && <polyline points={pts(1 - g)} fill="none" stroke={COL.bleu} strokeWidth={3.5} strokeDasharray="9 6"/>}
      <line x1={60} y1={Y(P)} x2={384} y2={Y(P)} stroke={COL.orange} strokeWidth={3}/>
      {xe != null && <g><line x1={xe} y1={Y(P)} x2={xe} y2={250} stroke={COL.paroi} strokeWidth={2} strokeDasharray="4 4"/><circle cx={xe} cy={Y(P)} r={6} fill="#fff" stroke={COL.paroi} strokeWidth={3}/></g>}
      <Tx x={66} y={Math.max(Y(P) - 8, 40)} s={15.5} c={COL.orange}>absorbée</Tx>
      <Tx x={232} y={34} s={15.5} c={COL.rouge}>émise σT⁴</Tx>
      {g > 0 && <Tx x={232} y={54} s={15.5} c={COL.bleu}>vers l’espace (1 − g) σT⁴</Tx>}
    </svg>);
}

// ---------- cartes « À retenir » (viewBox 320) ----------
const SvgCarte = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>{children}</svg>;
const Barre = ({ x1, x2, y, c = COL.bleu }) => <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={2.5}/>;

export function SvgCarteAbsorbe() {
  return (
    <SvgCarte h={262} aria="Puissance absorbée par mètre carré de surface terrestre : P absorbée égale un moins A, multiplié par S zéro, divisé par quatre. A est l’albédo, S zéro la puissance reçue par mètre carré face au Soleil. Le quatre vient du rapport entre la surface de la sphère et celle du disque éclairé.">
      <rect x={10} y={8} width={300} height={86} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={90} y={62} ancre="end" s={21} c={COL.bleu} halo={false}>P_abs =</Tx>
      <Tx x={197} y={44} ancre="middle" s={21} c={COL.bleu} halo={false}>(1 − A) × S₀</Tx><Barre x1={98} x2={296} y={54}/><Tx x={197} y={82} ancre="middle" s={21} c={COL.bleu} halo={false}>4</Tx>
      <Tx x={16} y={122} s={16.5}>A : albédo, part réfléchie (0 à 1)</Tx>
      <Tx x={16} y={148} s={16.5}>S₀ : puissance reçue par m²</Tx><Tx x={16} y={168} s={16.5} w={600} c={COL.gris}>face au Soleil (W·m⁻²)</Tx>
      <Tx x={16} y={198} s={16.5}>Pourquoi 4 ? Disque éclairé π R²,</Tx><Tx x={16} y={218} s={16.5} w={600} c={COL.gris}>sphère de surface 4 π R²</Tx>
      <Tx x={16} y={248} s={15.5} w={600} c={COL.gris}>P_abs en W par m² de surface terrestre</Tx>
    </SvgCarte>);
}
export function SvgCarteEquilibre() {
  return (
    <SvgCarte h={272} aria="À l’équilibre, la température est constante : la puissance émise par mètre carré, sigma fois T puissance quatre, est égale à la puissance absorbée. Sigma vaut 5,67 fois dix puissance moins huit watts par mètre carré et par kelvin puissance quatre. T s’exprime en kelvins : T égale thêta plus 273.">
      <Tx x={160} y={26} ancre="middle" s={17}>Équilibre : température constante</Tx>
      <rect x={10} y={40} width={300} height={74} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={160} y={72} ancre="middle" s={20} c={COL.bleu} halo={false}>P_émise = P_absorbée</Tx>
      <Tx x={160} y={102} ancre="middle" s={20} c={COL.bleu} halo={false}>σ × T⁴ = P_abs</Tx>
      <Tx x={16} y={146} s={16.5}>σ = 5,67×10⁻⁸ W·m⁻²·K⁻⁴ (donnée)</Tx>
      <Tx x={16} y={174} s={16.5}>T en kelvins (K) obligatoirement</Tx>
      <Tx x={16} y={202} s={16.5}>T (K) = θ (°C) + 273</Tx>
      <Tx x={16} y={236} s={15.5} w={600} c={COL.gris}>Plus un corps est chaud, plus il émet :</Tx><Tx x={16} y={256} s={15.5} w={600} c={COL.gris}>doubler T multiplie P_émise par 16</Tx>
    </SvgCarte>);
}
export function SvgCarteSerre() {
  return (
    <SvgCarte h={300} aria="Effet de serre : le rayonnement visible du Soleil traverse l’atmosphère et chauffe le sol. Le sol émet de l’infrarouge ; l’atmosphère en absorbe une partie et en renvoie vers le sol, qui se réchauffe davantage. Plus il y a de gaz à effet de serre, plus la température du sol est élevée.">
      <rect x={10} y={90} width={300} height={36} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={3} strokeDasharray="9 6"/>
      <Tx x={66} y={114} s={15.5} c={COL.gris} halo={false}>atmosphère</Tx>
      <rect x={10} y={168} width={300} height={22} fill="#a16207" stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={160} y={186} ancre="middle" s={16} c="#fff" halo={false}>sol</Tx>
      <Fleche x1={60} y1={16} x2={60} y2={164} c={COL.orange} w={3} tete={11}/><Tx x={70} y={46} s={16} c={COL.orange}>visible</Tx>
      <Fleche x1={160} y1={164} x2={160} y2={20} c={COL.rouge} w={3} tete={11}/><Tx x={170} y={52} s={16} c={COL.rouge}>infrarouge</Tx>
      <Fleche x1={240} y1={128} x2={240} y2={160} c={COL.rouge} w={3} tete={10}/><Tx x={250} y={150} s={15.5} c={COL.rouge}>renvoyé</Tx>
      <Tx x={16} y={222} s={16.5}>Visible : traverse l’atmosphère</Tx>
      <Tx x={16} y={246} s={16.5}>Infrarouge : en partie renvoyé</Tx>
      <Tx x={16} y={270} s={16.5}>Plus de gaz à effet de serre : sol</Tx><Tx x={16} y={290} s={16.5}>plus chaud</Tx>
    </SvgCarte>);
}
export function SvgCarteBilan() {
  const etapes = [['1', 'Absorbée : (1 − A) × S₀ ÷ 4'], ['2', 'Émise : σ × T⁴ (donnée)'], ['3', 'Équilibre : émise = absorbée'], ['4', 'T = racine 4e de P_abs ÷ σ']];
  return (
    <SvgCarte h={286} aria="Méthode en quatre étapes : calculer la puissance absorbée par mètre carré, écrire la puissance émise sigma T puissance quatre, égaler les deux, puis en déduire T en kelvins par la racine quatrième de la puissance absorbée divisée par sigma. Comparer ensuite à la température observée.">
      <Tx x={160} y={22} ancre="middle" s={16.5}>Méthode pour une planète</Tx>
      {etapes.map(([n, t], k) => (<g key={n}>
        <circle cx={26} cy={58 + 46 * k} r={15} fill={COL.bleu}/><Tx x={26} y={64 + 46 * k} ancre="middle" c="#fff" halo={false} s={17}>{n}</Tx>
        <Tx x={52} y={64 + 46 * k} s={16}>{t}</Tx></g>))}
      <Tx x={16} y={256} s={16} c={COL.gris} w={600}>Puis comparer à la température</Tx><Tx x={16} y={276} s={16} c={COL.gris} w={600}>observée : l’écart = effet de serre</Tx>
    </SvgCarte>);
}
