// ====================================================
//  Schémas de la simulation 187 (facteurs cinétiques, catalyse, choix d'un capteur ; niveau TG).
//  Règles de dessin : textes de 16 dans un viewBox de 400 (cartes : 15,5 à 16 dans un viewBox de 320) ; width 100 % + maxWidth ; indices en caractères Unicode ;
//  jamais la couleur seule (courbes : trait plein / tirets / pointillés + forme du repère + nom dans la légende) ; coordonnées toujours numériques.
// ====================================================
import { REACTIONS, ORDRE_CAPTEURS, CAPTEURS, t12, concSuivi, nbf } from './facteursCinModele';

export const COL = { A: '#0369a1', B: '#c2410c', C: '#15803d', txt: '#0f172a', gris: '#64748b', clair: '#cbd5e1', fond: '#f8fafc', rouge: '#b91c1c', violet: '#6d28d9' };
export const STYLES = [
  { c: COL.A, dash: undefined, marker: 'o', w: 3 },
  { c: COL.B, dash: '9 6', marker: 's', w: 3 },
  { c: COL.C, dash: '2 5', marker: 't', w: 3.4 },
  { c: '#94a3b8', dash: undefined, marker: 'o', w: 7 },
];
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

const Tx = ({ x, y, children, c = COL.txt, s = 17.5, w = 700, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Boite = ({ x, y, w, h, c = COL.clair, f = COL.fond, sw = 1.6 }) => <rect x={x} y={y} width={w} height={h} rx={8} fill={f} stroke={c} strokeWidth={sw}/>;
const Fleche = ({ x1, y1, x2, y2, c = COL.gris, w = 2 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, bx = x2 - ux * 9, by = y2 - uy * 9;
  return <g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={`${x2},${y2} ${bx - uy * 4},${by + ux * 4} ${bx + uy * 4},${by - ux * 4}`} fill={c}/></g>;
};
const Repere = ({ m, x, y, c, r = 6 }) => (m === 'o' ? <circle cx={x} cy={y} r={r} fill="#fff" stroke={c} strokeWidth="2.6"/>
  : m === 's' ? <rect x={x - r} y={y - r} width={2 * r} height={2 * r} fill="#fff" stroke={c} strokeWidth="2.6"/>
    : <polygon points={`${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`} fill="#fff" stroke={c} strokeWidth="2.6"/>);

// ---------- graphique c(t) ----------
// série : { nom, cond, st (indice de style), vide (courbe masquée) }
const AX = { persulfate: { pas: 0.5, max: 2.5, dec: 1 }, violet: { pas: 1, max: 6, dec: 0 }, h2o2: { pas: 20, max: 120, dec: 0 }, rcl: { pas: 10, max: 50, dec: 0 } };
export function GraphiqueC({ rid, series, marque = null, marquesT12 = false, constant = false, aria, maxWidth = 480 }) {
  const R = REACTIONS[rid], ax = AX[rid], T = R.horizon / 60;
  const X0 = 58, X1 = 372, Y0 = 200, Y1 = 32, sx = (X1 - X0) / T, sy = (Y0 - Y1) / ax.max;
  const px = t => X0 + t * sx, py = c => Y0 - c * sy;
  const pasT = [1, 2, 5, 10, 15, 20, 30, 60].find(p => p * sx >= 62) || 60;
  const tt = []; for (let k = 0; k * pasT <= T + 1e-9; k++) tt.push(k * pasT);
  const yy = []; for (let k = 0; k * ax.pas <= ax.max + 1e-9; k++) yy.push(k * ax.pas);
  const s = R.suivi;
  return (
    <svg viewBox="0 0 400 262" style={{ ...stl, maxWidth }} role="img" aria-label={aria || `Concentration de l’espèce suivie en fonction du temps pour ${series.length} expérience(s).`}>
      <line x1={X0} y1={Y0} x2={X1 + 6} y2={Y0} stroke={COL.gris} strokeWidth="1.8" strokeLinecap="round"/><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 8} stroke={COL.gris} strokeWidth="1.8" strokeLinecap="round"/>
      {yy.map(g => <g key={'y' + g}><line x1={X0} y1={py(g)} x2={X1} y2={py(g)} stroke="#e2e8f0" strokeWidth="1"/><line x1={X0 - 6} y1={py(g)} x2={X0} y2={py(g)} stroke={COL.gris} strokeWidth="1.6"/><Tx x={X0 - 9} y={py(g) + 6} a="end" w={600}>{nbf(g, ax.dec)}</Tx></g>)}
      {tt.map(g => <g key={'t' + g}><line x1={px(g)} y1={Y0} x2={px(g)} y2={Y0 + 6} stroke={COL.gris} strokeWidth="1.6"/><Tx x={px(g)} y={Y0 + 24} a="middle" w={600}>{g}</Tx></g>)}
      <Tx x={X1 + 8} y={Y0 + 46} a="end" c={COL.gris}>t (min)</Tx>
      <Tx x={6} y={20} c={COL.gris}>{`c(${s.f}) (${s.unite})`}</Tx>
      {marquesT12 && <line x1={X0} y1={py(s.cMax / 2)} x2={X1} y2={py(s.cMax / 2)} stroke={COL.clair} strokeWidth="1.6" strokeDasharray="4 4"/>}
      {constant ? <g><line x1={X0} y1={py(0.5 * s.cMax)} x2={X1} y2={py(0.5 * s.cMax)} stroke={COL.gris} strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round"/></g>
        : series.map((sr, i) => {
          const st = STYLES[sr.st ?? i], pts = [];
          for (let k = 0; k <= 160; k++) { const t = T * k / 160; pts.push(`${k ? 'L' : 'M'}${px(t).toFixed(1)} ${py(concSuivi(rid, sr.cond, t * 60)).toFixed(1)}`); }
          const th = t12(rid, sr.cond) / 60;
          return (<g key={i}>
            <path d={pts.join(' ')} fill="none" stroke={st.c} strokeWidth={st.w} strokeDasharray={st.dash} strokeLinecap={st.dash ? 'butt' : 'round'} strokeLinejoin="round"/>
            {marquesT12 && th <= T && <Repere m={st.marker} x={px(th)} y={py(s.cMax / 2)} c={st.c}/>}
          </g>);
        })}
      {marque != null && !constant && <g><line x1={px(marque)} y1={Y0} x2={px(marque)} y2={Y1} stroke={COL.gris} strokeWidth="1.6" strokeDasharray="3 4"/>
        {series.map((sr, i) => <circle key={i} cx={px(marque)} cy={py(concSuivi(rid, sr.cond, marque * 60))} r="4.5" fill={STYLES[sr.st ?? i].c}/>)}</g>}
    </svg>);
}
// légende : échantillon de trait + forme du repère t½ + nom
export const LegendeC = ({ series, t12Visible = false }) => (
  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14, color: COL.txt, marginTop: 2, justifyContent: 'center' }}>
    {series.map((sr, i) => { const st = STYLES[sr.st ?? i]; return (
      <span key={i} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <svg width="46" height="16" viewBox="0 0 46 16" aria-hidden="true"><line x1="2" y1="8" x2="44" y2="8" stroke={st.c} strokeWidth={Math.min(st.w, 7)} strokeDasharray={st.dash} strokeLinecap={st.dash ? 'butt' : 'round'}/>{t12Visible && <Repere m={st.marker} x={23} y={8} c={st.c} r={5}/>}</svg>{sr.nom}</span>); })}
  </div>);

// ---------- échelle des durées (étape 1) ----------
export function EchelleDurees() {
  const X0 = 22, W = 360, L0 = -1, L1 = 8.6, x = lg => X0 + (lg - L0) / (L1 - L0) * W;
  const lg = s => Math.log10(s);
  const lignes = [
    { nom: 'précipitation de AgCl', a: L0, b: lg(0.6) },
    { nom: 'décoloration du cristal violet', a: lg(60), b: lg(900), txt: '' },
    { nom: 'oxydation de I⁻ par S₂O₈²⁻', a: lg(900), b: lg(10800), txt: '' },
    { nom: 'formation de la rouille', a: lg(6e5), b: L1, txt: '' },
  ];
  const graduations = [[0, '1 s'], [lg(60), '1 min'], [lg(3600), '1 h'], [lg(86400), '1 jour'], [lg(3.15e7), '1 an']];
  return (
    <svg viewBox="0 0 400 270" style={stl} role="img" aria-label="Échelle logarithmique des durées. Précipitation du chlorure d’argent : moins d’une seconde. Décoloration du cristal violet : quelques minutes. Oxydation de l’ion iodure par l’ion peroxodisulfate : de l’ordre de l’heure. Formation de la rouille : des mois à des années. Ordres de grandeur.">
      {lignes.map((l, i) => { const y = 14 + i * 48; return (<g key={l.nom}>
        <Tx x={X0} y={y + 16}>{l.nom}</Tx>
        <rect x={x(l.a)} y={y + 24} width={Math.max(8, x(l.b) - x(l.a))} height={14} rx={4} fill="#bfdbfe" stroke={COL.A} strokeWidth="2"/>
      </g>); })}
      <line x1={X0} y1={216} x2={X0 + W + 6} y2={216} stroke={COL.gris} strokeWidth="1.8"/>
      {graduations.map(([g, t]) => <g key={t}><line x1={x(g)} y1={216} x2={x(g)} y2={223} stroke={COL.gris} strokeWidth="1.8"/><Tx x={x(g)} y={240} a="middle" w={600}>{t}</Tx></g>)}
      <Tx x={X0 + W + 6} y={264} a="end" s={17} c={COL.gris} w={600}>durée (échelle logarithmique)</Tx>
    </svg>);
}

// ---------- montage : bécher / cuve / flacon et capteur (étiquettes dans le dessin) ----------
function liquide(rid, f) {
  if (rid === 'violet') return { fill: '#7c3aed', op: 0.12 + 0.7 * (1 - f), densite: 1 - f };
  if (rid === 'persulfate') return { fill: '#b45309', op: 0.05 + 0.6 * f, densite: f };
  return { fill: '#93c5fd', op: 0.4, densite: 0 };
}
const Ecran = ({ x, y, sym, nom1, nom2 }) => (<g>
  <rect x={x} y={y} width={80} height={52} rx={8} fill="#e2e8f0" stroke={COL.txt} strokeWidth="2"/><rect x={x + 8} y={y + 8} width={64} height={36} rx={4} fill="#f1f5f9" stroke={COL.gris} strokeWidth="1.4"/>
  <Tx x={x + 40} y={y + 34} a="middle" s={22} w={700}>{sym}</Tx>
  <Tx x={x + 40} y={y + 72} a="middle">{nom1}</Tx>{nom2 && <Tx x={x + 40} y={y + 90} a="middle">{nom2}</Tx>}
</g>);
export function Montage({ rid, capteur, f = 0, maxWidth = 440 }) {
  const L = liquide(rid, f), bulles = rid === 'h2o2' && f > 0.02 && f < 0.995;
  const cadre = (corps, aria) => <svg viewBox="0 0 400 236" style={{ ...stl, maxWidth }} role="img" aria-label={aria}><line x1={8} y1={208} x2={392} y2={208} stroke={COL.gris} strokeWidth="2"/>{corps}</svg>;
  if (capteur === 'spectro') {
    const att = 0.95 * (1 - 0.75 * L.densite);
    return cadre(<g>
      <Tx x={8} y={24}>spectrophotomètre</Tx>
      <circle cx={50} cy={140} r={16} fill="#fde68a" stroke={COL.txt} strokeWidth="2"/>{[0, 60, 120, 180, 240, 300].map(a => <line key={a} x1={50 + 21 * Math.cos(a * Math.PI / 180)} y1={140 + 21 * Math.sin(a * Math.PI / 180)} x2={50 + 29 * Math.cos(a * Math.PI / 180)} y2={140 + 29 * Math.sin(a * Math.PI / 180)} stroke="#d97706" strokeWidth="2.2" strokeLinecap="round"/>)}
      <Tx x={50} y={196} a="middle">source</Tx>
      <line x1={68} y1={140} x2={168} y2={140} stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" opacity="0.95"/>
      <rect x={168} y={108} width={34} height={64} rx={3} fill="#fff" fillOpacity="0.5" stroke={COL.txt} strokeWidth="2.4"/>
      <rect x={171} y={122} width={28} height={47} fill={L.fill} fillOpacity={L.op}/>
      <Tx x={185} y={196} a="middle">cuve</Tx>
      <line x1={202} y1={140} x2={298} y2={140} stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" opacity={att}/>
      <rect x={298} y={118} width={30} height={44} rx={4} fill="#94a3b8" stroke={COL.txt} strokeWidth="2.4"/>
      <Tx x={313} y={196} a="middle">détecteur</Tx>
      <line x1={313} y1={118} x2={313} y2={84} stroke={COL.txt} strokeWidth="2.2"/>
      <Ecran x={273} y={32} sym="A"/>
    </g>, 'Spectrophotomètre : une source de lumière, une cuve contenant la solution, un détecteur relié à un écran qui affiche l’absorbance A.');
  }
  const bec = (<g>
    <path d="M130 84 L130 196 Q130 204 138 204 L222 204 Q230 204 230 196 L230 84" fill="none" stroke={COL.txt} strokeWidth="2.6" strokeLinejoin="round"/>
    <path d="M131 118 L229 118 L229 196 Q229 203 222 203 L138 203 Q131 203 131 196 Z" fill={L.fill} fillOpacity={L.op}/>
    <line x1={130} y1={118} x2={230} y2={118} stroke={COL.A} strokeWidth="1.6"/>
    <Tx x={240} y={170}>solution</Tx>
  </g>);
  if (capteur === 'conduct') return cadre(<g>
    {bec}
    <path d="M180 62 L180 34 L292 34" fill="none" stroke={COL.txt} strokeWidth="2.4"/>
    <rect x={170} y={62} width={20} height={112} rx={3} fill="#fff" fillOpacity="0.55" stroke={COL.txt} strokeWidth="2.2"/>
    <rect x={174} y={136} width={5} height={34} fill="#111827"/><rect x={181} y={136} width={5} height={34} fill="#111827"/>
    <Tx x={8} y={92}>cellule de</Tx><Tx x={8} y={112}>conductimétrie</Tx><line x1={118} y1={104} x2={168} y2={126} stroke={COL.gris} strokeWidth="1.6"/>
    <Ecran x={292} y={10} sym="σ" nom1="conductimètre"/>
  </g>, 'Conductimètre : une cellule de conductimétrie, deux plaques de platine immergées dans la solution d’un bécher, reliée par un câble à l’appareil qui affiche la conductivité sigma.');
  if (capteur === 'ph') return cadre(<g>
    {bec}
    <path d="M180 52 L180 34 L292 34" fill="none" stroke={COL.txt} strokeWidth="2.4"/>
    <rect x={172} y={52} width={16} height={116} rx={3} fill="#fff" fillOpacity="0.6" stroke={COL.txt} strokeWidth="2.2"/>
    <ellipse cx={180} cy={178} rx={12} ry={13} fill="#fff" fillOpacity="0.8" stroke={COL.txt} strokeWidth="2.2"/><circle cx={180} cy={178} r={4} fill="#94a3b8"/>
    <Tx x={8} y={92}>électrode</Tx><Tx x={8} y={112}>de pH</Tx><line x1={84} y1={104} x2={168} y2={130} stroke={COL.gris} strokeWidth="1.6"/>
    <Ecran x={292} y={10} sym="pH" nom1="pH-mètre"/>
  </g>, 'pH-mètre : une électrode de verre plongée dans la solution d’un bécher, reliée par un câble à l’appareil qui affiche le pH.');
  // pression
  const hb = [[148, 176], [172, 164], [200, 180], [162, 190], [188, 150]];
  return cadre(<g>
    <path d="M162 70 L162 104 L112 192 Q108 204 120 204 L240 204 Q252 204 248 192 L198 104 L198 70" fill="none" stroke={COL.txt} strokeWidth="2.6" strokeLinejoin="round"/>
    <path d="M136 148 L224 148 L247 190 Q251 203 241 203 L119 203 Q109 203 113 190 Z" fill={L.fill} fillOpacity={L.op}/>
    <line x1={136} y1={148} x2={224} y2={148} stroke={COL.A} strokeWidth="1.6"/>
    {bulles && hb.map(([bx, by], i) => <circle key={i} cx={bx} cy={by} r={4 + (i % 2)} fill="#fff" stroke={COL.A} strokeWidth="1.6"/>)}
    <polygon points="157,70 203,70 199,54 161,54" fill="#a16207" stroke={COL.txt} strokeWidth="2"/>
    <path d="M180 54 L180 34 L292 34" fill="none" stroke={COL.txt} strokeWidth="2.4"/>
    <Tx x={180} y={128} a="middle">gaz</Tx>
    <Tx x={8} y={150}>flacon</Tx><Tx x={8} y={170}>fermé</Tx><line x1={62} y1={162} x2={118} y2={176} stroke={COL.gris} strokeWidth="1.6"/>
    <Ecran x={292} y={10} sym="P" nom1="capteur de" nom2="pression"/>
  </g>, 'Flacon fermé contenant la solution et du gaz, relié par un tuyau à un capteur de pression qui affiche la pression P.');
}

// ---------- cartes « À retenir » (viewBox 320 de large ; affichées à ≈ 223 px sur téléphone : tous les textes ≥ 16 pour rester ≥ 11 px rendus) ----------
const FS = 16.5, FP = 16;
const Titre = ({ t }) => <text x={160} y={24} fontSize={17.5} fontWeight={700} textAnchor="middle" fill={COL.txt}>{t}</text>;

// 1. Lente ou rapide
export function CarteLenteRapide() {
  return (
    <svg viewBox="0 0 320 352" style={stlCarte} role="img" aria-label="Une flèche du temps, puis deux cadres. Rapide : terminée dès le mélange, comme la précipitation de AgCl. Lente : dure de quelques secondes à des années, comme la rouille ou l’oxydation de I⁻ par S₂O₈²⁻ ; on peut la suivre au cours du temps.">
      <Titre t="Lente ou rapide ?"/>
      <Fleche x1={14} y1={52} x2={306} y2={52} w={2.4}/><Tx x={306} y={44} a="end" c={COL.gris} s={FP}>durée</Tx>
      <Boite x={10} y={64} w={300} h={76} c={COL.rouge} f="#fef2f2" sw={2}/>
      <Tx x={160} y={88} a="middle" c={COL.rouge} s={17.5}>rapide</Tx><Tx x={160} y={110} a="middle" s={FP} w={600}>terminée dès le mélange</Tx><Tx x={160} y={130} a="middle" s={FP} w={600}>exemple : AgCl ↓</Tx>
      <Boite x={10} y={150} w={300} h={100} c={COL.A} f="#eff6ff" sw={2}/>
      <Tx x={160} y={174} a="middle" c={COL.A} s={17.5}>lente</Tx><Tx x={160} y={196} a="middle" s={FP} w={600}>dure de quelques secondes</Tx><Tx x={160} y={216} a="middle" s={FP} w={600}>à des années</Tx><Tx x={160} y={238} a="middle" s={FP} w={600}>exemple : rouille</Tx>
      <Boite x={10} y={262} w={300} h={80} c={COL.txt} f="#fff" sw={2}/>
      <Tx x={160} y={286} a="middle" s={FS}>Lente : on peut la suivre</Tx><Tx x={160} y={306} a="middle" s={FS}>au cours du temps.</Tx>
      <Tx x={160} y={330} a="middle" c={COL.rouge} s={FP} w={600}>Faux : « lente = pas de réaction »</Tx>
    </svg>);
}

// 2. Un capteur, une grandeur
export function CarteCapteurs() {
  const lig = [
    ['Espèce colorée', 'spectrophotomètre : A', 'spectro'],
    ['Ions', 'conductimètre : σ', 'conduct'],
    ['H₃O⁺ ou HO⁻', 'pH-mètre : pH', 'ph'],
    ['Gaz', 'capteur de pression : P', 'pression'],
  ];
  const icone = (k, cx, cy) => {
    if (k === 'spectro') return <g><rect x={cx - 9} y={cy - 15} width={18} height={30} rx={2} fill="#fff" stroke={COL.txt} strokeWidth="2"/><rect x={cx - 7} y={cy - 3} width={14} height={16} fill="#7c3aed" fillOpacity="0.7"/></g>;
    if (k === 'conduct') return <g><path d={`M${cx - 14} ${cy - 4} L${cx - 14} ${cy + 13} Q${cx - 14} ${cy + 16} ${cx - 11} ${cy + 16} L${cx + 11} ${cy + 16} Q${cx + 14} ${cy + 16} ${cx + 14} ${cy + 13} L${cx + 14} ${cy - 4}`} fill="#dbeafe" stroke={COL.txt} strokeWidth="2"/><rect x={cx - 8} y={cy - 16} width={5} height={26} fill="#111827"/><rect x={cx + 3} y={cy - 16} width={5} height={26} fill="#111827"/></g>;
    if (k === 'ph') return <g><rect x={cx - 5} y={cy - 16} width={10} height={24} rx={2} fill="#fff" stroke={COL.txt} strokeWidth="2"/><ellipse cx={cx} cy={cy + 11} rx={8} ry={8} fill="#fff" stroke={COL.txt} strokeWidth="2"/></g>;
    return <g><path d={`M${cx - 4} ${cy - 16} L${cx - 4} ${cy - 4} L${cx - 14} ${cy + 13} L${cx + 14} ${cy + 13} L${cx + 4} ${cy - 4} L${cx + 4} ${cy - 16}`} fill="#fff" stroke={COL.txt} strokeWidth="2" strokeLinejoin="round"/><circle cx={cx - 3} cy={cy + 7} r={2.6} fill="#fff" stroke={COL.A} strokeWidth="1.6"/><circle cx={cx + 4} cy={cy + 3} r={2.2} fill="#fff" stroke={COL.A} strokeWidth="1.6"/></g>;
  };
  return (
    <svg viewBox="0 0 320 296" style={stlCarte} role="img" aria-label="Quatre lignes : une espèce colorée se suit avec un spectrophotomètre (absorbance A) ; des ions avec un conductimètre (conductivité sigma) ; H₃O⁺ ou HO⁻ avec un pH-mètre ; un gaz avec un capteur de pression.">
      <Titre t="Un capteur, une grandeur"/>
      {lig.map(([a, b, k], i) => { const y = 38 + i * 52; return (<g key={k}>
        <Boite x={10} y={y} w={300} h={46}/>{icone(k, 36, y + 23)}
        <Tx x={62} y={y + 19} s={FS}>{a}</Tx><Tx x={62} y={y + 39} w={600} c={COL.A} s={FP}>{b}</Tx>
      </g>); })}
      <Boite x={10} y={252} w={300} h={36} c={COL.txt} f="#fff" sw={2}/>
      <Tx x={160} y={276} a="middle" s={FP}>reliée à la concentration</Tx>
    </svg>);
}

// mini-courbes pour la carte 3 et 5
const mini = (x0, y0, w, h, tau) => { const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40; const v = 1 - Math.exp(-t * 5 / tau); pts.push(`${k ? 'L' : 'M'}${(x0 + t * w).toFixed(1)} ${(y0 - v * h).toFixed(1)}`); } return pts.join(' '); };
// 3. Température et concentration
export function CarteTemperatureConcentration() {
  const cle = (x, y, c, dash, t) => <g><line x1={x} y1={y - 5} x2={x + 22} y2={y - 5} stroke={c} strokeWidth="3" strokeDasharray={dash}/><Tx x={x + 28} y={y} s={FP} c={c}>{t}</Tx></g>;
  const panneau = (x, titre, l1, l2) => (<g>
    <Tx x={x + 65} y={52} a="middle" s={FS}>{titre}</Tx>
    <Fleche x1={x + 6} y1={150} x2={x + 6} y2={64} w={1.8}/><Fleche x1={x + 6} y1={150} x2={x + 134} y2={150} w={1.8}/>
    <path d={mini(x + 6, 150, 116, 78, 0.45)} fill="none" stroke={COL.B} strokeWidth="3" strokeDasharray="9 6"/>
    <path d={mini(x + 6, 150, 116, 78, 1.5)} fill="none" stroke={COL.A} strokeWidth="3"/>
    <Tx x={x + 134} y={170} a="end" s={FP} c={COL.gris}>t</Tx>
    {cle(x + 6, 184, COL.B, '5 3', l1)}{cle(x + 6, 204, COL.A, undefined, l2)}
  </g>);
  return (
    <svg viewBox="0 0 320 330" style={stlCarte} role="img" aria-label="Deux petits graphiques de la quantité formée en fonction du temps. À gauche, la courbe à température élevée monte plus vite que la courbe à basse température. À droite, la courbe du réactif en excès plus concentré monte plus vite que celle du réactif moins concentré.">
      <Titre t="Température et concentration"/>
      {panneau(8, 'plus chaud', '40 °C', '20 °C')}{panneau(168, 'plus concentré', 'concentré', 'dilué')}
      <Boite x={10} y={216} w={300} h={104} c={COL.txt} f="#fff" sw={2}/>
      <Tx x={160} y={240} a="middle" s={FS}>plus chaud : t½ plus court</Tx>
      <Tx x={160} y={262} a="middle" s={FS}>plus concentré : t½ plus court</Tx>
      <Tx x={160} y={288} a="middle" c={COL.A} s={FP}>« plus chaud, plus concentré :</Tx><Tx x={160} y={308} a="middle" c={COL.A} s={FP}>plus vite »</Tx>
    </svg>);
}

// 4. Un seul facteur à la fois
export function CarteUnSeulFacteur() {
  const ligne = (x, y, w, a, c, f = '#fff') => <g><rect x={x} y={y} width={w} height={26} rx={5} fill={f} stroke={c} strokeWidth="1.6"/><Tx x={x + w / 2} y={y + 19} a="middle" s={FP} w={600}>{a}</Tx></g>;
  return (
    <svg viewBox="0 0 320 312" style={stlCarte} role="img" aria-label="Deux comparaisons. Première : les expériences A et B ne diffèrent que par la température (20 °C et 40 °C, même concentration) : on peut conclure sur la température. Seconde : A et B diffèrent par la température et par la concentration : on ne peut pas conclure.">
      <Titre t="Un seul facteur à la fois"/>
      <Boite x={10} y={36} w={300} h={116} c={COL.C} f="#f0fdf4" sw={2}/>
      <Tx x={20} y={58} c={COL.C} s={FS}>✓ un seul paramètre change</Tx>
      <Tx x={20} y={84} s={FP} w={600}>A</Tx>{ligne(40, 66, 78, '20 °C', COL.clair)}{ligne(126, 66, 150, '0,10 mol·L⁻¹', COL.clair)}
      <Tx x={20} y={118} s={FP} w={600}>B</Tx>{ligne(40, 100, 78, '40 °C', COL.C, '#dcfce7')}{ligne(126, 100, 150, '0,10 mol·L⁻¹', COL.clair)}
      <Tx x={160} y={142} a="middle" s={FP} w={600}>l’écart vient de la température</Tx>
      <Boite x={10} y={162} w={300} h={116} c={COL.rouge} f="#fef2f2" sw={2}/>
      <Tx x={20} y={184} c={COL.rouge} s={FS}>✗ deux paramètres changent</Tx>
      <Tx x={20} y={210} s={FP} w={600}>A</Tx>{ligne(40, 192, 78, '20 °C', COL.clair)}{ligne(126, 192, 150, '0,05 mol·L⁻¹', COL.clair)}
      <Tx x={20} y={244} s={FP} w={600}>B</Tx>{ligne(40, 226, 78, '40 °C', COL.rouge, '#fee2e2')}{ligne(126, 226, 150, '0,10 mol·L⁻¹', COL.rouge, '#fee2e2')}
      <Tx x={160} y={268} a="middle" s={FP} w={600}>on ne peut pas conclure</Tx>
      <Tx x={160} y={300} a="middle" c={COL.A} s={FP}>« une seule différence, une conclusion »</Tx>
    </svg>);
}

// 5. Le catalyseur
export function CarteCatalyseur() {
  return (
    <svg viewBox="0 0 320 320" style={stlCarte} role="img" aria-label="Deux courbes de la quantité de produit formé en fonction du temps : avec catalyseur, la courbe monte vite ; sans catalyseur, elle monte lentement ; elles atteignent le même plateau, la même quantité finale. Trois propriétés du catalyseur : il accélère, il n’apparaît pas dans l’équation, il est retrouvé intact.">
      <Titre t="Le catalyseur"/>
      <Fleche x1={22} y1={156} x2={22} y2={44} w={1.8}/><Fleche x1={22} y1={156} x2={304} y2={156} w={1.8}/>
      <line x1={22} y1={72} x2={296} y2={72} stroke={COL.clair} strokeWidth="1.6" strokeDasharray="5 4"/>
      <path d={mini(22, 156, 262, 84, 0.35)} fill="none" stroke={COL.B} strokeWidth="3" strokeDasharray="9 6"/>
      <path d={mini(22, 156, 262, 84, 1.6)} fill="none" stroke={COL.A} strokeWidth="3"/>
      <line x1={118} y1={118} x2={140} y2={118} stroke={COL.B} strokeWidth="3" strokeDasharray="5 3"/><Tx x={146} y={123} c={COL.B} s={FP}>avec catalyseur</Tx>
      <line x1={118} y1={140} x2={140} y2={140} stroke={COL.A} strokeWidth="3"/><Tx x={146} y={145} c={COL.A} s={FP}>sans catalyseur</Tx>
      <Tx x={296} y={62} a="end" s={FP} c={COL.gris} w={600}>même état final</Tx><Tx x={304} y={176} a="end" s={FP} c={COL.gris}>t</Tx>
      <Boite x={10} y={188} w={300} h={124} c={COL.txt} f="#fff" sw={2}/>
      <Tx x={20} y={214} s={FS}>1. Il accélère.</Tx>
      <Tx x={20} y={240} s={FS}>2. Il n’est pas dans l’équation.</Tx>
      <Tx x={20} y={266} s={FS}>3. Retrouvé intact à la fin.</Tx>
      <Tx x={20} y={296} c={COL.rouge} s={FP} w={600}>Quantité finale inchangée.</Tx>
    </svg>);
}

// 6. Catalyseur ou réactif ?
export function CarteCatalyseurReactif() {
  const cel = (x, y, w, t, c = COL.txt, f = '#fff') => { const L = Array.isArray(t) ? t : [t]; return <g><rect x={x} y={y} width={w} height={46} fill={f} stroke={COL.clair} strokeWidth="1.6"/>{L.map((l, k) => <Tx key={k} x={x + w / 2} y={y + (L.length === 1 ? 28 : 19 + 18 * k)} a="middle" s={FP} c={c} w={600}>{l}</Tx>)}</g>; };
  return (
    <svg viewBox="0 0 320 340" style={stlCarte} role="img" aria-label="Tableau comparant un catalyseur et un réactif. Dans l’équation : non pour le catalyseur, oui pour le réactif. Sa quantité : inchangée pour le catalyseur, elle diminue pour le réactif. État final : le même avec ou sans catalyseur ; il dépend du réactif. Un catalyseur est spécifique d’une transformation.">
      <Titre t="Catalyseur ou réactif ?"/>
      {cel(10, 38, 108, '', COL.txt, '#f1f5f9')}{cel(118, 38, 102, 'catalyseur', COL.B, '#fff7ed')}{cel(220, 38, 90, 'réactif', COL.A, '#eff6ff')}
      {cel(10, 84, 108, ['dans', 'l’équation ?'])}{cel(118, 84, 102, 'non')}{cel(220, 84, 90, 'oui')}
      {cel(10, 130, 108, ['sa quantité', 'au final'])}{cel(118, 130, 102, 'inchangée')}{cel(220, 130, 90, 'diminue')}
      {cel(10, 176, 108, 'état final')}{cel(118, 176, 102, 'le même')}{cel(220, 176, 90, ['dépend', 'de lui'])}
      <Boite x={10} y={236} w={300} h={96} c={COL.txt} f="#fff" sw={2}/>
      <Tx x={160} y={262} a="middle" s={FS}>Un catalyseur est spécifique :</Tx><Tx x={160} y={286} a="middle" s={FS}>la catalase n’agit que sur</Tx><Tx x={160} y={310} a="middle" s={FS}>certaines transformations.</Tx>
    </svg>);
}
// utilitaire pour les tests de rendu
export const NOMS_CAPTEURS = ORDRE_CAPTEURS.map(c => CAPTEURS[c].nom);
