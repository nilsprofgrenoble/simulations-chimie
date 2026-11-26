// ====================================================
//  Schémas de la simulation 257 (prévoir l'allure d'une courbe de titrage conductimétrique, niveau TSTL).
//  Scène animée : burette, bécher agité avec les ions (un point = 0,1 mmol), cellule et conductimètre ; graphique σ = f(V) ; cinq cartes « À retenir ».
//  Couleurs : une couleur par ion (voir IONS), gris = molécule neutre, bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
//  Scène : viewBox de 400, textes de 13 à 18. Cartes : viewBox de 400, police ≥ 16.
// ====================================================
import { IONS, TITRAGES, ORDRE_TITRAGES, maxPoints, quantites, PAR_POINT, V_BURETTE, VA0, courbe } from './conductimetrieAllureModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// ---------- emplacements fixes (mélangés) : un point ne change pas de place quand on en ajoute ou retire ----------
const SLOTS = (() => {
  const s = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 11; c++) s.push([34 + c * 17 + (r % 2 ? 8 : 0), 190 + r * 14.5]);
  let g = 31; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();
const ALLOC = {};
const alloc = t => {
  if (ALLOC[t]) return ALLOC[t];
  let o = 0; const a = {}; Object.entries(maxPoints(t)).forEach(([k, n]) => { if (n > 0) { a[k] = [o, n]; o += n; } });
  return (ALLOC[t] = a);
};

const Ion = ({ x, y, couleur, signe, r }) => { const a = r * 0.5, w = Math.max(1.4, r * 0.29);
  return (<g><circle cx={x} cy={y} r={r} fill={couleur} stroke="#fff" strokeWidth="0.8"/>
    <line x1={x - a} y1={y} x2={x + a} y2={y} stroke="#fff" strokeWidth={w}/>{signe > 0 && <line x1={x} y1={y - a} x2={x} y2={y + a} stroke="#fff" strokeWidth={w}/>}</g>); };
const Mol = ({ x, y, r = 5.4 }) => (<g><circle cx={x} cy={y} r={r} fill="#e2e8f0" stroke="#64748b" strokeWidth="1.4"/><circle cx={x + r * 0.95} cy={y - r * 0.7} r={r * 0.5} fill="#fff" stroke="#64748b" strokeWidth="1.2"/></g>);
const Cadre = ({ actif, x, y, w, h }) => (actif ? <rect x={x} y={y} width={w} height={h} rx="8" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="7 5"/> : null);
const Vib = ({ k, anime, children }) => (anime ? <g>{children}<animateTransform attributeName="transform" type="translate" values={`0 0; ${((k * 7) % 5) - 2} ${((k * 3) % 5) - 2}; ${((k * 5) % 5) - 2} ${((k * 11) % 5) - 2}; 0 0`} dur={`${(1.1 + (k % 7) * 0.17).toFixed(2)}s`} repeatCount="indefinite"/></g> : <g>{children}</g>);
const GRAINS = [[40, 304], [58, 305], [76, 304], [94, 305], [112, 304], [50, 296], [68, 297], [86, 296], [104, 297], [77, 289]];
const IonDe = ({ id, x, y, r }) => <Ion x={x} y={y} couleur={IONS[id].couleur} signe={IONS[id].z} r={r}/>;
const rayon = id => (IONS[id].z > 0 ? 5.8 : 6.6);

// ---------- scène : burette, bécher, cellule, conductimètre ----------
//  t : titrage ; cA : concentration de l'espèce titrée ; VB : volume versé ; lecture : texte du conductimètre ; montrer : { equation, ions, cellule, burette, legende }
export function SceneAllure({ t, cA, VB = 0, lecture = null, anime = true, montrer = {}, hl = () => false }) {
  const { equation = true, ions = true, cellule = true, burette = true, legende = true } = montrer;
  const T = TITRAGES[t], q = quantites(t, cA, VB), al = alloc(t), items = [];
  const place = (k, n, type) => { const [o, m] = al[k] || [0, 0]; for (let i = 0; i < Math.min(n, m); i++) items.push({ k: k + i, p: SLOTS[o + i], type, id: k }); };
  if (ions) {
    Object.entries(q.ions).forEach(([id, n]) => place(id, Math.round(n / PAR_POINT), 'ion'));
    if (T.neutre && t !== 'precip') place('N', Math.round(q.neutre / PAR_POINT), 'mol');
  }
  const grains = ions && t === 'precip' ? Math.min(10, Math.round(q.neutre / PAR_POINT)) : 0;
  const ionsLegende = [...new Set([...Object.keys(T.depart), ...Object.keys(T.avant), ...Object.keys(T.apres)])].filter(i => IONS[i]).sort((a, b) => ['H3O', 'HO', 'Na', 'Cl', 'NO3', 'Ag', 'AcO', 'NH4'].indexOf(a) - ['H3O', 'HO', 'Na', 'Cl', 'NO3', 'Ag', 'AcO', 'NH4'].indexOf(b));
  const entrees = [...ionsLegende.map(i => ({ id: i, f: IONS[i].f })), ...(T.neutre ? [{ id: 'N', f: T.neutre }] : [])];
  const dx = 400 / Math.max(entrees.length, 1);
  const niveau = 112 * (1 - Math.min(VB, V_BURETTE) / V_BURETTE);           // hauteur du liquide dans la burette
  const eq = T.reaction;
  const mots = T.titrant.split(' '), nomL = T.titrant.length > 10 && mots.length > 1 ? [mots[0], mots.slice(1).join(' ')] : [T.titrant];
  return (
    <svg viewBox={cellule || equation ? '0 0 400 372' : '0 30 400 342'} style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Burette de ${T.titrant} (${T.fTitrant}) au-dessus d’un bécher contenant ${T.analyte}${cellule ? ', avec une cellule de conductimétrie reliée à un conductimètre' : ''}. Volume versé : ${fr(VB)} mL.${ions ? ' Les points colorés représentent les ions dissous.' : ''}`}>
      {equation && <g>
        <rect x="14" y="4" width="372" height="30" rx="8" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2"/>
        <text x="200" y="25" fontSize={eq.length > 26 ? 16 : 18} fontWeight="700" textAnchor="middle" fill={COL.txt}>{eq}</text></g>}
      {/* burette */}
      {burette && <g>
        <rect x="108" y="44" width="16" height="112" rx="3" fill="#f8fafc" stroke="#475569" strokeWidth="2"/>
        <rect x="110" y={44 + (112 - niveau)} width="12" height={niveau} fill="#bfdbfe"/>
        <rect x="112" y="156" width="8" height="12" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5"/>
        <rect x="104" y="159" width="16" height="5" rx="2" fill="#f59e0b"/>
        {anime && VB > 0 && VB < V_BURETTE && <circle cx="116" cy="172" r="3.2" fill="#60a5fa"><animate attributeName="cy" values="170;186;186" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0" dur="1.1s" repeatCount="indefinite"/></circle>}
        <text x="14" y="58" fontSize="14" fill={COL.gris}>burette :</text>
        {nomL.map((l, i) => <text key={i} x="14" y={77 + 17 * i} fontSize="14" fontWeight="700" fill={COL.txt}>{l}</text>)}
        <text x="14" y={77 + 17 * nomL.length} fontSize="14" fill={COL.txt}>{T.fTitrant}</text>
        <text x="14" y={77 + 17 * nomL.length + 17} fontSize="14" fill={COL.txt}>{fr(T.cB, 3)} mol/L</text>
        <text x="134" y="118" fontSize="14" fontWeight="700" fill={COL.bleu}>V = {fr(VB)} mL</text></g>}
      {/* conductimètre et cellule */}
      {cellule && <g>
        <rect x="266" y="46" width="128" height="60" rx="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="2"/>
        <rect x="274" y="52" width="112" height="28" rx="4" fill="#0f172a"/>
        <text x="330" y="73" fontSize="17" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="monospace">{lecture || '— — —'}</text>
        <text x="330" y="98" fontSize="14" textAnchor="middle" fill={COL.txt}>conductimètre</text>
        <path d="M266 82 Q244 92 236 140" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="229" y="138" width="14" height="108" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="2"/>
        <rect x="232" y="226" width="3" height="24" fill="#94a3b8"/><rect x="237" y="226" width="3" height="24" fill="#94a3b8"/>
        <text x="300" y="150" fontSize="14" fill={COL.txt}>cellule</text>
        <line x1="296" y1="146" x2="246" y2="162" stroke="#94a3b8" strokeDasharray="3 3"/></g>}
      {/* prise d'essai */}
      <g>
        <text x="266" y="196" fontSize="14" fill={COL.gris}>prise d’essai :</text>
        <text x="266" y="215" fontSize="14" fontWeight="700" fill={COL.txt}>{T.analyte}</text>
        <text x="266" y="234" fontSize="14" fontWeight="700" fill={COL.bleu}>{T.fAnalyte}</text>
        <text x="266" y="254" fontSize="14" fontWeight="700" fill={COL.txt}>c = {fr(cA, 3)} mol/L</text>
        <text x="266" y="272" fontSize="14" fill={COL.txt}>V = {fr(VA0)} mL + eau</text>
      </g>
      {/* bécher */}
      <path d="M16 170 L16 310 Q16 316 22 316 L252 316 Q258 316 258 310 L258 170" fill="none" stroke="#475569" strokeWidth="3"/>
      <path d="M19 180 L19 308 Q19 313 23 313 L251 313 Q255 313 255 308 L255 180 Z" fill="#dbeafe" opacity="0.7"/>
      {grains > 0 && GRAINS.slice(0, grains).map((g, i) => <circle key={'g' + i} cx={g[0]} cy={g[1] + 3} r="5.2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.6"/>)}
      {items.map((d, i) => (
        <Vib key={d.k} k={i} anime={anime}>
          {d.type === 'mol' ? <Mol x={d.p[0]} y={d.p[1]} r={5.2}/> : <IonDe id={d.id} x={d.p[0]} y={d.p[1]} r={rayon(d.id)}/>}
        </Vib>))}
      <rect x="110" y="304" width="24" height="6" rx="3" fill="#fff" stroke="#64748b" strokeWidth="1.5">
        {anime && <animateTransform attributeName="transform" type="rotate" from="0 122 307" to="360 122 307" dur="0.9s" repeatCount="indefinite"/>}</rect>
      <rect x="10" y="318" width="244" height="16" rx="5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5"/>
      <text x="132" y="330" fontSize="13" textAnchor="middle" fill={COL.txt}>agitateur magnétique</text>
      {legende && ions && <g fontSize="14" fill={COL.txt}>
        {entrees.map((e, i) => <g key={e.id}>
          {e.id === 'N' ? (t === 'precip' ? <circle cx={dx * i + 14} cy={356} r="5.2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.6"/> : <Mol x={dx * i + 12} y={356} r={5}/>) : <IonDe id={e.id} x={dx * i + 14} y={356} r={IONS[e.id].z > 0 ? 6 : 7}/>}
          <text x={dx * i + 26} y="361" fontSize={e.f.length > 6 ? 13 : 14}>{e.f}</text></g>)}</g>}
      <Cadre actif={hl('burette')} x={8} y={38} w={178} h={124}/>
      <Cadre actif={hl('becher')} x={8} y={166} w={252} h={156}/>
      <Cadre actif={hl('cellule')} x={224} y={134} w={26} h={118}/>
      <Cadre actif={hl('lecture')} x={262} y={42} w={136} h={68}/>
      <Cadre actif={hl('equation')} x={10} y={0} w={380} h={38}/>
    </svg>);
}

// ---------- graphique σ = f(V) ----------
//  courbes : [{ pts, couleur, nom }] ; marqueur : { VB, sigma } ; VE : repère ; jusqua : volume jusqu'auquel la courbe est tracée ; yMax
export function GraphiqueAllure({ courbes = [], marqueur = null, VE = null, yMax = 100, jusqua = V_BURETTE, titre = '', pentes = null }) {
  const X = v => 56 + 13.2 * v, Y = s => 196 - 176 * Math.min(Math.max(s, 0), yMax) / yMax;
  const pas = yMax > 150 ? 50 : yMax > 60 ? 20 : yMax > 30 ? 10 : 5, graduations = []; for (let g = 0; g <= yMax + 1e-9; g += pas) graduations.push(g);
  return (
    <svg viewBox="0 0 400 252" style={{ ...stl, maxWidth: 520 }} role="img"
      aria-label={`${titre || 'Graphique'} : conductivité σ en mS par mètre en fonction du volume de titrant versé, de 0 à ${V_BURETTE} mL.${marqueur ? ` Le point courant est à ${fr(marqueur.VB)} mL, σ = ${fr(marqueur.sigma)} mS par mètre.` : ''}`}>
      <rect x="56" y="20" width="330" height="176" fill="#f8fafc" stroke="#cbd5e1"/>
      {graduations.map(g => <g key={g}><line x1="56" y1={Y(g)} x2="386" y2={Y(g)} stroke="#e2e8f0"/><text x="50" y={Y(g) + 5} fontSize="16" textAnchor="end" fill={COL.txt}>{g}</text></g>)}
      {[0, 5, 10, 15, 20, 25].map(v => <g key={v}><line x1={X(v)} y1="196" x2={X(v)} y2="202" stroke={COL.txt}/><text x={X(v)} y="220" fontSize="16" textAnchor="middle" fill={COL.txt}>{v}</text></g>)}
      <text x="56" y="14" fontSize="16" fill={COL.gris}>σ (mS·m⁻¹)</text>
      <text x="386" y="244" fontSize="16" textAnchor="end" fill={COL.gris}>volume de titrant versé (mL)</text>
      {VE != null && <g><line x1={X(VE)} y1="20" x2={X(VE)} y2="196" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/><text x={X(VE) + 6} y="38" fontSize="16" fontWeight="700" fill={COL.orange}>équivalence</text></g>}
      {courbes.map((c, i) => <polyline key={i} points={c.pts.filter(p => p.VB <= jusqua + 1e-9).map(p => `${X(p.VB).toFixed(1)},${Y(p.sigma).toFixed(1)}`).join(' ')} fill="none" stroke={c.couleur || COL.bleu} strokeWidth="3" strokeLinejoin="round"/>)}
      {pentes && pentes.map((p, i) => <text key={i} x={X(p.x)} y={Y(p.y) + (p.dy || -10)} fontSize="16" fontWeight="700" textAnchor="middle" fill={p.couleur || COL.rouge} stroke="#f8fafc" strokeWidth="4" paintOrder="stroke">{p.txt}</text>)}
      {marqueur && <g><line x1={X(marqueur.VB)} y1={Y(marqueur.sigma)} x2={X(marqueur.VB)} y2="196" stroke={COL.rouge} strokeWidth="1.5" strokeDasharray="4 3"/><circle cx={X(marqueur.VB)} cy={Y(marqueur.sigma)} r="6" fill={COL.rouge}/></g>}
    </svg>);
}

// ---------- mini-courbe sans graduations (défi : associer une courbe à un titrage) ----------
export function MiniCourbe({ t, cA, eau, nom, choisie = false }) {
  const pts = courbe(t, cA, eau, V_BURETTE, 0.5), m = Math.max(...pts.map(p => p.sigma)) || 1, mn = Math.min(...pts.map(p => p.sigma));
  const X = v => 28 + 4.3 * v, Y = s => 108 - 90 * (s - Math.min(0, mn)) / (m - Math.min(0, mn));
  return (
    <svg viewBox="0 0 150 130" style={{ width: '100%', maxWidth: 190, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: `2px solid ${choisie ? COL.bleu : '#e2e8f0'}` }} role="img"
      aria-label={`Courbe ${nom} : conductivité en fonction du volume de titrant versé, sans graduation.`}>
      <line x1="28" y1="110" x2="140" y2="110" stroke={COL.gris} strokeWidth="1.6"/><line x1="28" y1="12" x2="28" y2="110" stroke={COL.gris} strokeWidth="1.6"/>
      <text x="140" y="124" fontSize="12" textAnchor="end" fill={COL.gris}>V versé</text><text x="32" y="14" fontSize="12" fill={COL.gris}>σ</text>
      <polyline points={pts.map(p => `${X(p.VB).toFixed(1)},${Y(p.sigma).toFixed(1)}`).join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3" strokeLinejoin="round"/>
      <text x="8" y="22" fontSize="18" fontWeight="700" fill={COL.orange}>{nom}</text>
    </svg>);
}

// ====================================================
//  Cartes « À retenir » (viewBox 400 × 290)
// ====================================================
const Carte = ({ children, label }) => (<svg viewBox="0 0 400 290" style={stl} role="img" aria-label={label}>{children}</svg>);
const Boite = ({ x, y, w, h, fill = '#f8fafc', stroke = '#cbd5e1' }) => <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={stroke} strokeWidth="2"/>;

// carte 1 : trois sortes d'ions (neutre : lettres génériques)
export function SvgIonsCarte() {
  const col = (x, titre, couleur, signe, nom, l1, l2, fondCouleur) => (
    <g>
      <Boite x={x} y={46} w={118} h={150} fill={fondCouleur} stroke="#cbd5e1"/>
      <text x={x + 59} y={70} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>{titre}</text>
      <Ion x={x + 59} y={112} couleur={couleur} signe={signe} r={20}/>
      <text x={x + 59} y={152} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>{nom}</text>
      <text x={x + 59} y={174} fontSize="15" textAnchor="middle" fill={COL.txt}>{l1}</text>
      <text x={x + 59} y={190} fontSize="15" textAnchor="middle" fill={COL.txt}>{l2}</text>
    </g>);
  return (
    <Carte label="Trois sortes d’ions : un ion qui disparaît parce qu’il réagit, un ion qui apparaît parce qu’il est apporté ou formé, un ion spectateur qui ne change pas.">
      <text x="200" y="26" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Pendant le titrage, on suit trois sortes d’ions</text>
      {col(8, 'disparaît', '#dc2626', 1, 'ion A⁺', 'consommé par', 'la réaction', '#fef2f2')}
      {col(141, 'apparaît', '#0369a1', 1, 'ion B⁺', 'apporté par le', 'titrant ou formé', '#eff6ff')}
      {col(274, 'spectateur', '#15803d', -1, 'ion C⁻', 'ne réagit pas,', 'reste là', '#f0fdf4')}
      <text x="200" y="228" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>Un ion qui apparaît ou disparaît fait varier σ</text>
      <text x="200" y="254" fontSize="16" textAnchor="middle" fill={COL.txt}>le spectateur ne change rien : sa quantité reste fixe</text>
      <text x="200" y="276" fontSize="15" textAnchor="middle" fill={COL.gris}>(sans dilution : le volume de la solution est constant)</text>
    </Carte>);
}

// carte 2 : pente = Σ λ(apparus) − Σ λ(disparus)
export function SvgPenteCarte() {
  const fleche = (x, y, haut, couleur) => <g><line x1={x} y1={y + (haut ? 26 : -26)} x2={x} y2={y + (haut ? -26 : 26)} stroke={couleur} strokeWidth="5" strokeLinecap="round"/>
    <polygon points={haut ? `${x - 10},${y - 18} ${x + 10},${y - 18} ${x},${y - 34}` : `${x - 10},${y + 18} ${x + 10},${y + 18} ${x},${y + 34}`} fill={couleur}/></g>;
  return (
    <Carte label="La pente de σ par volume versé vaut la somme des λ des ions qui apparaissent moins la somme des λ des ions qui disparaissent. Si elle est positive, σ monte ; négative, σ baisse ; proche de zéro, σ reste presque constante.">
      <text x="200" y="26" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>La pente dépend des λ</text>
      <Boite x={14} y={40} w={372} h={56} fill="#fff7ed" stroke="#fdba74"/>
      <text x="200" y="64" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>pente ∝ Σλ (apparus) − Σλ (disparus)</text>
      <text x="200" y="85" fontSize="14" textAnchor="middle" fill={COL.txt}>par mole de titrant versée</text>
      <Boite x={14} y={110} w={118} h={128}/><Boite x={141} y={110} w={118} h={128}/><Boite x={268} y={110} w={118} h={128}/>
      {fleche(73, 174, true, COL.vert)}{fleche(200, 174, false, COL.rouge)}<line x1="294" y1="174" x2="360" y2="174" stroke={COL.gris} strokeWidth="5" strokeLinecap="round"/>
      <text x="73" y="216" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>apparus</text><text x="73" y="230" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>&gt; disparus</text>
      <text x="200" y="216" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>apparus</text><text x="200" y="230" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>&lt; disparus</text>
      <text x="327" y="223" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.gris}>λ voisins</text>
      <text x="73" y="130" fontSize="14" textAnchor="middle" fill={COL.txt}>σ monte</text><text x="200" y="130" fontSize="14" textAnchor="middle" fill={COL.txt}>σ baisse</text><text x="327" y="130" fontSize="14" textAnchor="middle" fill={COL.txt}>σ ≈ constante</text>
      <text x="200" y="259" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>on compare les λ, pas le nombre d’ions</text>
      <text x="200" y="279" fontSize="14" textAnchor="middle" fill={COL.gris}>(H₃O⁺ et HO⁻ ont les plus grands λ)</text>
    </Carte>);
}

const Axes = ({ x0 = 40, y0 = 214, x1 = 380, y1 = 40 }) => (
  <g><line x1={x0} y1={y0} x2={x1} y2={y0} stroke={COL.gris} strokeWidth="2"/><line x1={x0} y1={y0} x2={x0} y2={y1} stroke={COL.gris} strokeWidth="2"/>
    <text x={x1} y={y0 + 22} fontSize="15" textAnchor="end" fill={COL.gris}>volume versé</text><text x={x0 + 6} y={y1 + 6} fontSize="15" fill={COL.gris}>σ</text></g>);

// carte 3 : courbe en V (forme générique, sans nombre)
export function SvgVCarte() {
  return (
    <Carte label="Courbe en V : avant l’équivalence σ baisse parce qu’un ion de grand λ est remplacé par un ion de λ plus petit ; après l’équivalence σ monte parce que le titrant en excès apporte des ions. Le minimum est à l’équivalence.">
      <text x="200" y="24" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Courbe en V : un minimum à l’équivalence</text>
      <Axes/>
      <line x1="210" y1="44" x2="210" y2="214" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/>
      <polyline points="50,70 210,176 370,70" fill="none" stroke={COL.bleu} strokeWidth="4.5" strokeLinejoin="round"/>
      <circle cx="210" cy="176" r="6" fill={COL.orange}/>
      <text x="218" y="62" fontSize="16" fontWeight="700" fill={COL.orange}>équivalence</text>
      <text x="64" y="132" fontSize="16" fontWeight="700" fill={COL.rouge}>baisse</text>
      <text x="296" y="132" fontSize="16" fontWeight="700" fill={COL.vert}>monte</text>
      <text x="200" y="252" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>le coude marque l’équivalence</text>
      <text x="200" y="276" fontSize="14" textAnchor="middle" fill={COL.gris}>grand λ remplacé par un plus petit, puis excès d’ions</text>
    </Carte>);
}

// carte 4 : acide faible par base forte (forme générique)
export function SvgFaibleCarte() {
  return (
    <Carte label="Titrage d’un acide faible par une base forte : avant l’équivalence σ augmente lentement car les ions formés ont de petits λ ; après l’équivalence σ augmente plus vite car la base forte en excès apporte des ions HO⁻ de grand λ.">
      <text x="200" y="24" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Acide faible + base forte : deux pentes</text>
      <Axes/>
      <line x1="230" y1="44" x2="230" y2="214" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/>
      <polyline points="50,206 230,160 370,70" fill="none" stroke={COL.bleu} strokeWidth="4.5" strokeLinejoin="round"/>
      <circle cx="230" cy="160" r="6" fill={COL.orange}/>
      <text x="238" y="62" fontSize="16" fontWeight="700" fill={COL.orange}>équivalence</text>
      <text x="74" y="160" fontSize="15" fontWeight="700" fill={COL.vert}>pente faible</text>
      <text x="286" y="150" fontSize="15" fontWeight="700" fill={COL.vert}>pente forte</text>
      <text x="200" y="252" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>seule la rupture de pente indique l’équivalence</text>
      <text x="200" y="276" fontSize="14" textAnchor="middle" fill={COL.gris}>peu d’ions au départ : on les néglige</text>
    </Carte>);
}

// carte 5 : récapitulatif des cinq allures
export function SvgRecapCarte() {
  const m = (x, y, nom, pts, txt) => <g>
    <Boite x={x} y={y} w={120} h={92}/>
    <polyline points={pts.map(([a, b]) => `${x + a},${y + b}`).join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
    <text x={x + 60} y={y + 84} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>{nom}</text>
    {txt && <text x={x + 60} y={y + 17} fontSize="12" textAnchor="middle" fill={COL.gris}>{txt}</text>}
  </g>;
  return (
    <Carte label="Cinq allures de courbes de titrage conductimétrique : acide fort par base forte en V ; acide faible par base forte en deux pentes ; base forte par acide fort en V décalé vers le haut ; base faible par acide fort en deux pentes ; précipitation presque plate puis montante.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Cinq allures à reconnaître</text>
      {m(8, 34, 'fort / fort', [[14, 30], [60, 62], [106, 28]])}
      {m(140, 34, 'faible / fort', [[14, 66], [60, 54], [106, 24]])}
      {m(272, 34, 'base / acide', [[14, 26], [60, 56], [106, 22]])}
      {m(74, 136, 'précipitation', [[14, 48], [60, 52], [106, 22]])}
      {m(206, 136, 'base faible', [[14, 66], [60, 50], [106, 20]])}
      <text x="200" y="254" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>même méthode : ions apparus − ions disparus</text>
      <text x="200" y="276" fontSize="14" textAnchor="middle" fill={COL.gris}>le coude marque toujours l’équivalence</text>
    </Carte>);
}
export { ORDRE_TITRAGES };
