// ====================================================
//  Schémas de la simulation 255 (titrage conductimétrique par précipitation, niveau TSTL).
//  Scène animée : burette (AgNO₃) qui goutte, bécher agité, cellule de conductimétrie, ions (1 point = 0,1 mmol) et grains blancs de AgCl(s) qui se déposent.
//  Couleurs : violet = Ag⁺, vert = Cl⁻, turquoise = NO₃⁻, bleu = Na⁺ ou K⁺ (cation spectateur), gris clair = AgCl(s) ; orange = grandeur à repérer.
//  Scène : viewBox de 400, textes de 13 à 20. Cartes « À retenir » : viewBox de 400, police ≥ 16.
// ====================================================
import { IONS, V_BURETTE, quantites } from './conductimetrieTstlModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', violet: '#7c3aed', gris: '#64748b', txt: '#0f172a', turq: '#0d9488' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');
const PAR_POINT = 0.1;   // mmol représentées par un point

// ---------- emplacements (ordre mélangé fixe : un point ne change pas de place quand on en ajoute ou retire) ----------
const SLOTS = (() => {
  const s = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) s.push([114 + c * 18 + (r % 2 ? 9 : 0), 192 + r * 15]);
  let g = 11; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();
const GROUPES = { cat: [0, 10], cl: [10, 20], no3: [20, 33] };      // plages de SLOTS : Na⁺/K⁺ ; Cl⁻ puis Ag⁺ (jamais ensemble) ; NO₃⁻
const GRAINS = [[150, 287], [166, 288], [182, 287], [198, 288], [214, 287], [158, 278], [174, 279], [190, 278], [206, 279], [182, 270]];

const Pt = ({ x, y, couleur, signe, r = 6.2 }) => { const a = r * 0.5, w = Math.max(1.4, r * 0.29);
  return (<g><circle cx={x} cy={y} r={r} fill={couleur} stroke="#fff" strokeWidth="0.8"/>
    <line x1={x - a} y1={y} x2={x + a} y2={y} stroke="#fff" strokeWidth={w}/>{signe > 0 && <line x1={x} y1={y - a} x2={x} y2={y + a} stroke="#fff" strokeWidth={w}/>}</g>); };

const Cadre = ({ actif, x, y, w, h }) => (actif ? <rect x={x} y={y} width={w} height={h} rx="8" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="7 5"/> : null);

// ---------- scène animée du titrage ----------
//  cA : concentration en Cl⁻ de la prise d'essai ; VB : volume versé ; ouvert : le robinet goutte ; lecture : texte du conductimètre (null : « — »)
//  montrer : { ions, precipite, cellule } pour la progressivité ; hl(id) pour les encadrés orange
export function SceneTitrage({ cA, VB, cation = 'Na', ouvert = false, lecture = null, anime = true, montrer = {}, hl = () => false }) {
  const { ions = true, precipite = true, cellule = true } = montrer;
  const q = quantites({ cA, VB });
  const n = x => Math.round(x / PAR_POINT);
  const nbCat = n(q.nCat), nbCl = n(q.nCl), nbAg = n(q.nAgExces), nbNO3 = n(q.nNO3), nbPrec = Math.min(GRAINS.length, n(q.nPrec));
  const dots = [];
  const place = (g, i) => SLOTS[GROUPES[g][0] + i];
  if (ions) {
    for (let i = 0; i < Math.min(nbCat, 10); i++) dots.push({ k: 'c' + i, p: place('cat', i), coul: IONS[cation].couleur, sg: 1, r: 5.6 });
    for (let i = 0; i < Math.min(nbCl, 10); i++) dots.push({ k: 'l' + i, p: place('cl', i), coul: IONS.Cl.couleur, sg: -1, r: 7.4 });
    for (let i = 0; i < Math.min(nbAg, 10); i++) dots.push({ k: 'a' + i, p: place('cl', i), coul: IONS.Ag.couleur, sg: 1, r: 5.6 });
    for (let i = 0; i < Math.min(nbNO3, 13); i++) dots.push({ k: 'n' + i, p: place('no3', i), coul: IONS.NO3.couleur, sg: -1, r: 7.4 });
  }
  const yB0 = 44, pasB = 3.1, yNiv = yB0 + pasB * Math.min(VB, V_BURETTE);
  return (
    <svg viewBox="0 0 400 352" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Montage du titrage : burette contenant la solution de nitrate d’argent, bécher agité contenant la solution de chlorure${cellule ? ', cellule de conductimétrie reliée à un conductimètre' : ''}. Équation de la réaction : Ag+ + Cl- donne AgCl solide.${lecture ? ` Le conductimètre affiche ${lecture}.` : ''}`}>
      {/* équation de la réaction, toujours visible */}
      <rect x="60" y="4" width="280" height="30" rx="8" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2"/>
      <text x="200" y="26" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt}>Ag⁺ + Cl⁻ → AgCl(s)</text>
      {/* burette */}
      <rect x="150" y={yB0 - 6} width="16" height="84" rx="2" fill="#fff" stroke="#475569" strokeWidth="2"/>
      <rect x="151" y={yNiv} width="14" height={yB0 + 78 - yNiv} fill="#e9d5ff"/>
      {[0, 10, 20].map(v => <g key={v}><line x1="166" y1={yB0 + pasB * v} x2="172" y2={yB0 + pasB * v} stroke="#475569" strokeWidth="1.5"/><text x="176" y={yB0 + pasB * v + 5} fontSize="13" fill={COL.txt}>{v}</text></g>)}
      <path d="M153 122 L163 122 L160 134 L156 134 Z" fill="#475569"/>
      <rect x="154" y="128" width="8" height="5" rx="1" fill={ouvert ? '#16a34a' : '#dc2626'}/>
      {ouvert && anime && [0, 1, 2].map(k => <circle key={k} cx="158" cy="140" r="2.8" fill="#c4b5fd"><animate attributeName="cy" from="138" to="172" dur="0.5s" begin={`${k * 0.17}s`} repeatCount="indefinite"/></circle>)}
      {ouvert && !anime && <circle cx="158" cy="150" r="2.8" fill="#c4b5fd"/>}
      <text x="8" y="56" fontSize="15" fontWeight="700" fill={COL.violet}>burette :</text>
      <text x="8" y="74" fontSize="15" fontWeight="700" fill={COL.violet}>Ag⁺ + NO₃⁻</text>
      <text x="8" y="92" fontSize="14" fill={COL.txt}>5,0×10⁻² mol/L</text>
      <text x="8" y="116" fontSize="14" fill={COL.txt}>versé :</text><text x="8" y="134" fontSize="15" fontWeight="700" fill={COL.txt}>{fr(VB)} mL</text>
      {/* conductimètre et cellule */}
      {cellule && <g>
        <rect x="266" y="44" width="128" height="60" rx="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="2"/>
        <rect x="274" y="50" width="112" height="28" rx="4" fill="#0f172a"/>
        <text x="330" y="71" fontSize="18" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="monospace">{lecture || '— — —'}</text>
        <text x="330" y="96" fontSize="14" textAnchor="middle" fill={COL.txt}>conductimètre</text>
        <path d="M266 80 Q240 90 240 130" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="233" y="128" width="14" height="96" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="2"/>
        <rect x="236" y="206" width="3" height="22" fill="#94a3b8"/><rect x="241" y="206" width="3" height="22" fill="#94a3b8"/>
        <text x="306" y="148" fontSize="14" fill={COL.txt}>cellule</text>
        <line x1="296" y1="144" x2="250" y2="152" stroke="#94a3b8" strokeDasharray="3 3"/></g>}
      {/* bécher */}
      <path d="M95 150 L95 296 Q95 302 101 302 L259 302 Q265 302 265 296 L265 150" fill="none" stroke="#475569" strokeWidth="3"/>
      <path d="M98 172 L98 296 Q98 299 101 299 L259 299 Q262 299 262 296 L262 172 Z" fill="#dbeafe" opacity="0.7"/>
      {/* ions */}
      {dots.map(d => <Pt key={d.k} x={d.p[0]} y={d.p[1]} couleur={d.coul} signe={d.sg} r={d.r}/>)}
      {/* précipité */}
      {precipite && GRAINS.slice(0, nbPrec).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.6"/>)}
      {precipite && nbPrec > 0 && <g><line x1="268" y1="284" x2="222" y2="286" stroke="#94a3b8" strokeDasharray="3 3"/><text x="272" y="290" fontSize="14" fontWeight="700" fill={COL.txt}>AgCl(s)</text></g>}
      {/* agitateur magnétique */}
      <rect x="170" y="291" width="24" height="6" rx="3" fill="#fff" stroke="#64748b" strokeWidth="1.5">
        {anime && <animateTransform attributeName="transform" type="rotate" from="0 182 294" to="360 182 294" dur="0.9s" repeatCount="indefinite"/>}</rect>
      <rect x="88" y="304" width="184" height="16" rx="5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5"/>
      <text x="180" y="316" fontSize="13" textAnchor="middle" fill={COL.txt}>agitateur magnétique</text>
      {/* légende */}
      {ions && <g fontSize="14" fill={COL.txt}>
        <circle cx="14" cy="338" r="5.2" fill={IONS[cation].couleur}/><text x="24" y="343">{IONS[cation].f}</text>
        <circle cx="76" cy="338" r="6.4" fill={IONS.Cl.couleur}/><text x="87" y="343">Cl⁻</text>
        <circle cx="132" cy="338" r="6.4" fill={IONS.NO3.couleur}/><text x="143" y="343">NO₃⁻</text>
        <circle cx="200" cy="338" r="5.2" fill={IONS.Ag.couleur}/><text x="210" y="343">Ag⁺</text>
        <circle cx="258" cy="338" r="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.6"/><text x="269" y="343">AgCl(s)</text></g>}
      <Cadre actif={hl('burette')} x={144} y={34} w={50} h={104}/>
      <Cadre actif={hl('becher')} x={88} y={148} w={184} h={158}/>
      <Cadre actif={hl('cellule')} x={226} y={120} w={28} h={112}/>
      <Cadre actif={hl('lecture')} x={262} y={40} w={136} h={68}/>
    </svg>);
}

// ---------- graphique σ = f(V) du titrage ----------
//  trace : courbe théorique ; mesures : points ; marqueur : { VB, sigma } ; VE : repère d'équivalence ; tp : { res } (vue « comme en TP » : deux droites)
export function GraphiqueTitrage({ trace = [], mesures = null, marqueur = null, VE = null, yMax = 100, titre = '', tp = null }) {
  const X = v => 56 + 13.2 * v, Y = s => 196 - 176 * Math.min(s, yMax) / yMax;
  const pas = yMax > 600 ? 200 : yMax > 300 ? 100 : yMax > 150 ? 50 : yMax > 60 ? 20 : 10, graduations = []; for (let g = 0; g <= yMax + 1e-9; g += pas) graduations.push(g);
  const ligne = (!tp && trace.length ? trace : []).map(p => `${X(p.VB).toFixed(1)},${Y(p.sigma).toFixed(1)}`).join(' ');
  const vI = tp ? Math.min(25, Math.max(0, Number.isFinite(tp.res.VEmod) ? tp.res.VEmod : (VE ?? 10))) : 0;
  const droite = (d, v1, v2) => <line x1={X(v1)} y1={Y(d.a * v1 + d.b)} x2={X(v2)} y2={Y(d.a * v2 + d.b)} stroke={COL.txt} strokeWidth="2.2" strokeDasharray="8 5"/>;
  return (
    <svg viewBox="0 0 400 252" style={{ ...stl, maxWidth: 520 }} role="img"
      aria-label={`${titre || 'Graphique'} : conductivité σ en mS par mètre en fonction du volume de nitrate d’argent versé, de 0 à 25 mL.${marqueur && !tp ? ` Le point courant est à ${fr(marqueur.VB)} mL, σ = ${fr(marqueur.sigma)} mS par mètre.` : ''}`}>
      <defs><clipPath id="tt-clip"><rect x="56" y="20" width="330" height="176"/></clipPath>
        <pattern id="tt-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#fb923c" strokeWidth="2"/></pattern></defs>
      <rect x="56" y="20" width="330" height="176" fill="#f8fafc" stroke="#cbd5e1"/>
      {graduations.map(g => <g key={g}><line x1="56" y1={Y(g)} x2="386" y2={Y(g)} stroke="#e2e8f0"/><text x="50" y={Y(g) + 5} fontSize="16" textAnchor="end" fill={COL.txt}>{g}</text></g>)}
      {[0, 5, 10, 15, 20, 25].map(v => <g key={v}><line x1={X(v)} y1="196" x2={X(v)} y2="202" stroke={COL.txt}/><text x={X(v)} y="220" fontSize="16" textAnchor="middle" fill={COL.txt}>{v}</text></g>)}
      <text x="56" y="14" fontSize="16" fill={COL.gris}>σ (mS·m⁻¹)</text>
      <text x="386" y="244" fontSize="16" textAnchor="end" fill={COL.gris}>volume d’Ag⁺ versé (mL)</text>
      {tp && <g><rect x={X(Math.max(0, VE - 2))} y="20" width={X(Math.min(25, VE + 2)) - X(Math.max(0, VE - 2))} height="176" fill="url(#tt-hach)" opacity="0.4"/>
        <text x={X(VE)} y="64" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange} stroke="#f8fafc" strokeWidth="4" paintOrder="stroke">écartés</text></g>}
      {VE != null && <g><line x1={X(VE)} y1="20" x2={X(VE)} y2="196" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/><text x={X(VE) + 6} y="38" fontSize="16" fontWeight="700" fill={COL.orange}>équivalence</text></g>}
      {ligne && <polyline points={ligne} fill="none" stroke={COL.bleu} strokeWidth="3" strokeLinejoin="round"/>}
      {tp && <g clipPath="url(#tt-clip)">{droite(tp.res.d1, 0, Math.min(25, vI + 1.5))}{droite(tp.res.d2, Math.max(0, vI - 1.5), 25)}</g>}
      {tp && <g>{tp.res.avant.concat(tp.res.apres).map(p => <circle key={p.VB} cx={X(p.VB)} cy={Y(p.sigma)} r="4.4" fill={COL.bleu} stroke="#fff" strokeWidth="1"/>)}
        {tp.res.ecartes.map(p => <circle key={p.VB} cx={X(p.VB)} cy={Y(p.sigma)} r="4.6" fill="#fff" stroke={COL.gris} strokeWidth="2.2"/>)}</g>}
      {mesures && <g>{mesures.map(p => <circle key={p.VB} cx={X(p.VB)} cy={Y(p.sigma)} r="4.2" fill={COL.bleu} stroke="#fff" strokeWidth="1"/>)}</g>}
      {marqueur && !tp && <g><line x1={X(marqueur.VB)} y1={Y(marqueur.sigma)} x2={X(marqueur.VB)} y2="196" stroke={COL.rouge} strokeWidth="1.5" strokeDasharray="4 3"/><circle cx={X(marqueur.VB)} cy={Y(marqueur.sigma)} r="6" fill={COL.rouge}/></g>}
    </svg>);
}

// ---------- barres de contribution de chaque ion à σ ----------
export function BarresContributionAg({ contributions, sigma }) {
  const lignes = contributions.filter(c => c.v > 1e-6);
  const H = 28 + 30 * lignes.length;
  return (
    <svg viewBox={`0 0 400 ${H}`} style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Contribution de chaque ion à la conductivité : ${lignes.map(l => `${l.f} ${fr(l.v)} mS par mètre`).join(', ')} ; total ${fr(sigma)} mS par mètre.`}>
      <text x="8" y="20" fontSize="16" fill={COL.gris}>part de chaque ion dans σ (mS·m⁻¹)</text>
      {lignes.map((l, i) => { const y = 32 + 30 * i, w = sigma > 0 ? 230 * l.v / sigma : 0;
        return <g key={l.id}><text x="8" y={y + 17} fontSize="16" fill={COL.txt}>{l.f}</text>
          <rect x="84" y={y} width={Math.max(w, 2)} height="22" rx="3" fill={l.couleur}/>
          <text x={84 + Math.max(w, 2) + 8} y={y + 17} fontSize="16" fontWeight="700" fill={COL.txt}>{fr(l.v)}</text></g>; })}
    </svg>);
}

// ================= cartes « À retenir » =================
// carte 1 : la précipitation, le solide sort du jeu
export function SvgPrecipCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Les ions argent Ag+ et chlorure Cl- se rejoignent et forment le chlorure d’argent solide AgCl, qui tombe au fond. Les ions sodium et nitrate restent dissous : ils sont spectateurs.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Le précipité sort du jeu</text>
      <rect x="10" y="36" width="222" height="168" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2"/>
      <defs><marker id="pr-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill={COL.txt}/></marker></defs>
      <text x="170" y="54" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.gris}>spectateurs</text>
      <Pt x={46} y={84} couleur={IONS.Ag.couleur} signe={1} r={11}/><Pt x={118} y={88} couleur={IONS.Cl.couleur} signe={-1} r={13}/>
      <text x="46" y="118" fontSize="16" textAnchor="middle" fill={COL.violet} fontWeight="700">Ag⁺</text><text x="118" y="122" fontSize="16" textAnchor="middle" fill={COL.vert} fontWeight="700">Cl⁻</text>
      <path d="M52 96 Q74 112 82 136" fill="none" stroke={COL.txt} strokeWidth="2.4" markerEnd="url(#pr-fl)"/><path d="M110 100 Q96 112 92 136" fill="none" stroke={COL.txt} strokeWidth="2.4" markerEnd="url(#pr-fl)"/>
      <text x="88" y="152" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>AgCl(s)</text>
      {[[54, 186], [76, 188], [98, 186], [120, 188], [65, 173], [87, 174], [109, 173]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2"/>)}
      <Pt x={186} y={104} couleur={IONS.Na.couleur} signe={1} r={8}/><Pt x={206} y={138} couleur={IONS.NO3.couleur} signe={-1} r={11}/><Pt x={166} y={160} couleur={IONS.Na.couleur} signe={1} r={8}/><Pt x={196} y={184} couleur={IONS.NO3.couleur} signe={-1} r={11}/>
      <text x="314" y="110" fontSize="16" textAnchor="middle" fill={COL.txt}>dissous :</text><text x="314" y="132" fontSize="16" textAnchor="middle" fill={COL.txt}>ils conduisent</text>
      <text x="314" y="168" fontSize="16" textAnchor="middle" fill={COL.txt}>solide :</text><text x="314" y="190" fontSize="16" textAnchor="middle" fill={COL.txt}>il ne conduit pas</text>
      <text x="200" y="232" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt}>Ag⁺ + Cl⁻ → AgCl(s)</text>
      <text x="200" y="262" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>Un solide ne transporte pas de courant</text>
    </svg>);
}

// carte 2 : avant l'équivalence, un Cl⁻ remplacé par un NO₃⁻
export function SvgAvantAgCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Avant l’équivalence, chaque ion chlorure qui disparaît est remplacé par un ion nitrate de conductivité ionique molaire presque égale : la conductivité varie très peu, elle diminue légèrement.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Avant l’équivalence : un échange</text>
      <Pt x={70} y={72} couleur={IONS.Cl.couleur} signe={-1} r={15}/><text x="70" y="108" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>Cl⁻</text>
      <Pt x={330} y={72} couleur={IONS.NO3.couleur} signe={-1} r={15}/><text x="330" y="108" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.turq}>NO₃⁻</text>
      <line x1="104" y1="72" x2="296" y2="72" stroke={COL.txt} strokeWidth="2.6" markerEnd="url(#av-fl)"/>
      <defs><marker id="av-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill={COL.txt}/></marker></defs>
      <text x="200" y="62" fontSize="16" textAnchor="middle" fill={COL.txt}>précipite, remplacé par</text>
      <rect x="40" y="126" width="136" height="34" rx="8" fill="#ecfdf5" stroke="#86efac" strokeWidth="2"/><text x="108" y="149" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>λ = 7,6</text>
      <rect x="224" y="126" width="136" height="34" rx="8" fill="#f0fdfa" stroke="#5eead4" strokeWidth="2"/><text x="292" y="149" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>λ = 7,1</text>
      <text x="200" y="149" fontSize="26" fontWeight="700" textAnchor="middle" fill={COL.orange}>≈</text>
      <line x1="40" y1="236" x2="360" y2="236" stroke="#cbd5e1"/>
      <line x1="40" y1="190" x2="360" y2="198" stroke={COL.bleu} strokeWidth="3.4" strokeLinecap="round"/>
      <text x="40" y="182" fontSize="16" fill={COL.gris}>σ</text><text x="360" y="256" fontSize="16" textAnchor="end" fill={COL.gris}>V versé</text>
      <text x="200" y="280" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>On change de monnaie, pas de valeur</text>
    </svg>);
}

// carte 3 : après l'équivalence, l'excès reste en solution
export function SvgApresAgCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Après l’équivalence, il n’y a plus d’ions chlorure à précipiter : les ions argent et nitrate versés s’accumulent dans la solution et la conductivité augmente fortement.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Après l’équivalence : ça s’accumule</text>
      <rect x="10" y="36" width="190" height="130" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2"/>
      {[[40, 62, 'a'], [92, 58, 'n'], [150, 66, 'a'], [64, 96, 'n'], [122, 100, 'a'], [170, 112, 'n'], [38, 134, 'n'], [92, 140, 'a'], [148, 146, 'n']].map(([x, y, t], i) =>
        t === 'a' ? <Pt key={i} x={x} y={y} couleur={IONS.Ag.couleur} signe={1} r={8}/> : <Pt key={i} x={x} y={y} couleur={IONS.NO3.couleur} signe={-1} r={11}/>)}
      <text x="105" y="190" fontSize="16" textAnchor="middle" fill={COL.txt}>Ag⁺ et NO₃⁻ ne trouvent</text><text x="105" y="210" fontSize="16" textAnchor="middle" fill={COL.txt}>plus de Cl⁻ : ils restent</text>
      <text x="300" y="66" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>chaque mL versé</text><text x="300" y="88" fontSize="16" textAnchor="middle" fill={COL.txt}>ajoute</text>
      <rect x="226" y="98" width="148" height="30" rx="8" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2"/><text x="300" y="119" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>λ(Ag⁺) = 6,2</text>
      <rect x="226" y="136" width="148" height="30" rx="8" fill="#f0fdfa" stroke="#5eead4" strokeWidth="2"/><text x="300" y="157" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>λ(NO₃⁻) = 7,1</text>
      <line x1="226" y1="244" x2="380" y2="244" stroke="#cbd5e1"/>
      <line x1="226" y1="246" x2="374" y2="196" stroke={COL.bleu} strokeWidth="3.4" strokeLinecap="round"/>
      <text x="226" y="190" fontSize="16" fill={COL.gris}>σ</text>
      <text x="200" y="280" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>Plus rien ne précipite : σ monte</text>
    </svg>);
}

// carte 4 : deux droites, un coude ; σ ≠ 0 à l'équivalence
export function SvgCoudeAgCarte() {
  const y1 = x => 100 + 0.1 * (x - 50), y2 = x => 105 - 0.62 * (x - 200);
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Courbe de titrage par précipitation : une droite presque horizontale avant l’équivalence, puis une droite qui monte. Elles se coupent en un coude au volume équivalent, où la conductivité n’est pas nulle.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Deux droites, un coude</text>
      <rect x="40" y="34" width="350" height="170" fill="#f8fafc" stroke="#cbd5e1"/>
      <line x1="200" y1="34" x2="200" y2="204" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/>
      <line x1="50" y1={y1(50)} x2="200" y2={y1(200)} stroke={COL.bleu} strokeWidth="3.4" strokeLinecap="round"/>
      <line x1="200" y1={y2(200)} x2="380" y2={y2(380)} stroke={COL.bleu} strokeWidth="3.4" strokeLinecap="round"/>
      <circle cx="200" cy={y1(200)} r="7" fill={COL.orange} stroke="#fff" strokeWidth="1.5"/>
      <text x="192" y="54" fontSize="16" fontWeight="700" textAnchor="end" fill={COL.orange}>V(équivalent)</text>
      <text x="56" y="86" fontSize="16" fill={COL.txt}>presque plate</text><text x="222" y="176" fontSize="16" fill={COL.txt}>monte nettement</text>
      <line x1="40" y1={y1(200)} x2="200" y2={y1(200)} stroke={COL.rouge} strokeWidth="1.5" strokeDasharray="4 3"/>
      <text x="48" y="56" fontSize="16" fontWeight="700" fill={COL.gris}>σ</text><text x="390" y="224" fontSize="16" textAnchor="end" fill={COL.gris}>volume versé</text>
      <text x="200" y="252" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.rouge}>σ(équivalence) n’est pas nulle !</text>
      <text x="200" y="278" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>Le coude des deux droites donne V</text>
    </svg>);
}

// carte 5 : relation à l'équivalence
export function SvgEquivAgCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="À l’équivalence, la quantité d’ions argent versés est égale à la quantité d’ions chlorure de la prise d’essai : concentration en Ag+ fois volume équivalent égale concentration en Cl- fois volume de la prise d’essai.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>À l’équivalence, quantités égales</text>
      <rect x="10" y="38" width="172" height="104" rx="10" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2"/>
      <rect x="218" y="38" width="172" height="104" rx="10" fill="#ecfdf5" stroke="#86efac" strokeWidth="2"/>
      <text x="96" y="62" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.violet}>Ag⁺ versés</text><text x="96" y="86" fontSize="16" textAnchor="middle" fill={COL.txt}>c(Ag⁺) connue</text>
      <text x="96" y="110" fontSize="16" textAnchor="middle" fill={COL.txt}>volume équivalent</text><text x="96" y="132" fontSize="16" textAnchor="middle" fill={COL.txt}>lu sur la courbe</text>
      <text x="304" y="62" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>Cl⁻ dosés</text><text x="304" y="86" fontSize="16" textAnchor="middle" fill={COL.txt}>c(Cl⁻) cherchée</text>
      <text x="304" y="110" fontSize="16" textAnchor="middle" fill={COL.txt}>volume de la prise</text><text x="304" y="132" fontSize="16" textAnchor="middle" fill={COL.txt}>d’essai connu</text>
      <text x="200" y="102" fontSize="30" fontWeight="700" textAnchor="middle" fill={COL.orange}>=</text>
      <text x="200" y="176" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>c(Ag⁺) × V(équivalent)</text>
      <text x="200" y="198" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>= c(Cl⁻) × V(prise d’essai)</text>
      <line x1="60" y1="212" x2="340" y2="212" stroke="#cbd5e1"/>
      <text x="200" y="236" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>c(Cl⁻) = c(Ag⁺) × V(équivalent)</text>
      <text x="200" y="258" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>÷ V(prise d’essai)</text>
      <text x="200" y="282" fontSize="16" textAnchor="middle" fill={COL.gris}>un Ag⁺ pour un Cl⁻ : coefficients 1 et 1</text>
    </svg>);
}

