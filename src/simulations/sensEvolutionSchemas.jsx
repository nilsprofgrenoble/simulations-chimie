// ====================================================
//  Schémas de la simulation 293 (prévoir le sens d'évolution : Qr, K et potentiels standards, TSTL SPCL).
//  - SceneReaction : bécher animé (plaques métalliques qui s'amincissent ou s'épaississent avec des cristaux, ions dessinés selon les concentrations,
//    teinte de la solution, légende des concentrations) ;
//  - Jauge : axe logarithmique sur lequel une bille Qr glisse vers le repère K (zones « sens direct » / « sens inverse ») ;
//  - FlaconH2O2 : eau oxygénée stable malgré un K énorme, puis bulles de O₂ après ajout d'un catalyseur ;
//  - 5 cartes « À retenir » (viewBox 400 × 290, textes ≥ 14).
//  Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège, gris = texte secondaire. Une couleur par espèce (ESP).
//  Les animations s'arrêtent si `anime` est faux (mouvement réduit).
// ====================================================
import { fr, concTexte, log10, paire, H2O2, pow10, puissanceTexte, sens } from './sensEvolutionModele.js';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
// espèces : couleur de l'ion, signe de la charge
const ESP = {
  'Zn²⁺': { c: '#7c3aed', z: 1 }, 'Cu²⁺': { c: '#0284c7', z: 1 }, 'Ag⁺': { c: '#475569', z: 1 }, 'Fe³⁺': { c: '#d97706', z: 1 }, 'Fe²⁺': { c: '#65a30d', z: 1 },
};
const TEINTE = { 'Cu²⁺': ['#38bdf8', 0.42], 'Fe³⁺': ['#f59e0b', 0.28], 'Fe²⁺': ['#a3e635', 0.13] };
const METAL = { Zn: 'url(#s-zinc)', Cu: 'url(#s-cuivre)', Ag: 'url(#s-argent)' };
const DEPOT = { Zn: ['#cbd5e1', '#64748b'], Cu: ['#fb923c', '#9a3412'], Ag: ['#f8fafc', '#64748b'] };

const Ion = ({ x, y, couleur, signe, r = 6 }) => { const a = r * 0.5, w = Math.max(1.4, r * 0.29);
  return (<g><circle cx={x} cy={y} r={r} fill={couleur} stroke="#fff" strokeWidth="0.9"/>
    <line x1={x - a} y1={y} x2={x + a} y2={y} stroke="#fff" strokeWidth={w}/>{signe > 0 && <line x1={x} y1={y - a} x2={x} y2={y + a} stroke="#fff" strokeWidth={w}/>}</g>); };
const Vib = ({ k, anime, children }) => (anime
  ? <g>{children}<animateTransform attributeName="transform" type="translate" dur={`${3 + (k % 5) * 0.6}s`} repeatCount="indefinite" values={`0 0; ${((k * 7) % 5) - 2} ${((k * 3) % 5) - 2}; ${((k * 5) % 5) - 2} ${((k * 11) % 5) - 2}; 0 0`}/></g>
  : <g>{children}</g>);

export const Defs = () => (
  <defs>
    <linearGradient id="s-verre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.85"/><stop offset="0.18" stopColor="#fff" stopOpacity="0.15"/><stop offset="0.85" stopColor="#fff" stopOpacity="0.05"/><stop offset="1" stopColor="#fff" stopOpacity="0.6"/></linearGradient>
    <linearGradient id="s-cuivre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fdba74"/><stop offset="0.5" stopColor="#c2410c"/><stop offset="1" stopColor="#9a3412"/></linearGradient>
    <linearGradient id="s-zinc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f1f5f9"/><stop offset="0.5" stopColor="#94a3b8"/><stop offset="1" stopColor="#64748b"/></linearGradient>
    <linearGradient id="s-argent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff"/><stop offset="0.5" stopColor="#cbd5e1"/><stop offset="1" stopColor="#e2e8f0"/></linearGradient>
    <linearGradient id="s-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e2e8f0"/><stop offset="1" stopColor="#f1f5f9"/></linearGradient>
    <linearGradient id="s-verreF" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.7"/><stop offset="0.25" stopColor="#fff" stopOpacity="0.1"/><stop offset="1" stopColor="#fff" stopOpacity="0.4"/></linearGradient>
  </defs>);

// ---------- bécher ----------
const Becher = ({ x, y, w, h, niveau, id, children }) => {
  const prof = `M${x} ${y} V${y + h - 10} Q${x} ${y + h} ${x + 10} ${y + h} H${x + w - 10} Q${x + w} ${y + h} ${x + w} ${y + h - 10} V${y}`;
  return (<g>
    <clipPath id={`s-cl-${id}`}><path d={`${prof} Z`}/></clipPath>
    <g clipPath={`url(#s-cl-${id})`}><rect x={x} y={niveau} width={w} height={y + h - niveau} fill="#e0f2fe" opacity="0.5"/>{children}<rect x={x} y={niveau} width={w} height="3" fill="#fff" opacity="0.8"/></g>
    <path d={prof} fill="none" stroke="#475569" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x={x + 6} y={y + 8} width="7" height={h - 28} rx="3.5" fill="url(#s-verre)"/>
    <line x1={x - 5} y1={y} x2={x + w + 5} y2={y} stroke="#475569" strokeWidth="3.2" strokeLinecap="round"/>
  </g>);
};

// emplacements fixes des ions (une espèce garde ses emplacements quand on ajoute ou retire des points)
const SLOTS = (() => {
  const s = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) s.push([96 + c * 29 + (r % 2 ? 13 : 0), 140 + r * 22.5]);
  let g = 29; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();
const frac = c => (c < 1e-4 ? 0 : Math.max(0, Math.min(1, (log10(c) + 3) / 3)));
const nbDots = c => (c < 1e-4 ? 0 : 1 + Math.round(7 * frac(c)));

// cristaux (arbre de Diane) sur une plaque : positions fixes, apparition progressive
const CRIST = [[-1, 134], [1, 146], [-1, 158], [1, 170], [-1, 182], [1, 194], [-1, 206], [1, 218], [-1, 230], [1, 240], [-1, 250], [1, 252]];
const Cristaux = ({ x, w, dep, espece, anime }) => {
  const [fill, stroke] = DEPOT[espece] || DEPOT.Ag, nb = Math.ceil(dep * CRIST.length - 1e-9);
  return (<g>{CRIST.map(([side, y], k) => {
    const xe = x + side * (w / 2), vis = k < nb;
    return (<g key={k} style={{ opacity: vis ? 1 : 0, transition: anime ? 'opacity .5s ease' : 'none' }} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none">
      <path d={`M${xe} ${y} l${side * 9} -6 M${xe} ${y} l${side * 11} 3 M${xe + side * 4} ${y - 2.5} l${side * 3} -8`}/>
      <circle cx={xe + side * 9} cy={y - 6} r="2.2" fill={fill}/><circle cx={xe + side * 11} cy={y + 3} r="2.4" fill={fill}/><circle cx={xe + side * 7} cy={y - 10.5} r="2" fill={fill}/>
    </g>);
  })}</g>);
};

// ---------- scène : la réaction dans le bécher ----------
//  p : paire de couples ; c : concentrations courantes ; dir : 'direct' | 'inverse' | null (sens dans lequel on fait évoluer) ; dep ∈ [0, 1] : état d'avancement du dessin
const COL_OX = '#b45309', COL_RED = '#0369a1', COL_E = '#ca8a04';
const nomLame = m => `lame ${/^[AEIOUY]/.test(m) ? 'd’' : 'de '}${m}`;
// les deux demi-réactions du sens d'évolution (oxydation d'abord) et l'emplacement de chacune
function demiReactions(p, sensEff, xs) {
  const dr = sensEff === 'direct', solides = p.solides;
  const H = [{ cp: p.ox1, gagne: dr, coef: p.a }, { cp: p.red2, gagne: !dr, coef: p.b }].map(h => {
    const { cp, gagne } = h, reactif = gagne ? cp.ox : cp.red, produit = gagne ? cp.red : cp.ox, idx = cp.redSolide ? solides.indexOf(cp.red) : -1;
    const x = idx >= 0 ? xs[idx] : xs[0];
    const cote = xs.length === 1 ? (cp.redSolide ? -1 : 1) : (x < 200 ? -1 : 1);
    const e = `${cp.n > 1 ? cp.n + ' ' : ''}e⁻`, eq = gagne ? `${reactif} + ${e} → ${produit}` : `${reactif} → ${produit} + ${e}`;
    return { ...h, reactif, produit, x, cote, eq: h.coef > 1 ? `${h.coef} × ( ${eq} )` : eq, entrant: gagne ? cp.redSolide : false, lieu: cp.redSolide ? `sur la ${nomLame(cp.red)}` : `à la surface de la ${nomLame(solides[0])}` };
  });
  return [H.find(h => !h.gagne), H.find(h => h.gagne)];
}
const FlecheIon = ({ h, anime }) => {
  const col = h.gagne ? COL_RED : COL_OX, y = 190, bord = h.x + h.cote * 14, loin = h.x + h.cote * 58;
  const [x1, x2] = h.entrant ? [loin, bord] : [bord, loin], sg = Math.sign(x2 - x1);
  return (<g>
    <line x1={x1} y1={y} x2={x2 - sg * 8} y2={y} stroke={col} strokeWidth="2.8" strokeLinecap="round" strokeDasharray="7 5">
      {anime && <animate attributeName="stroke-dashoffset" from={sg > 0 ? 12 : -12} to="0" dur="1.1s" repeatCount="indefinite"/>}</line>
    <polygon points={`${x2},${y} ${x2 - sg * 11},${y - 6} ${x2 - sg * 11},${y + 6}`} fill={col}/>
    <text x={h.x + h.cote * 50} y={y - 11} fontSize="11.5" fontWeight="700" textAnchor="middle" fill={col} stroke="#fff" strokeWidth="3.4" paintOrder="stroke">{h.reactif} → {h.produit}</text>
  </g>);
};
const BadgeNum = ({ x, y, n, col }) => (<g><circle cx={x} cy={y} r="9" fill={col} stroke="#fff" strokeWidth="1.6"/><text x={x} y={y + 4.4} fontSize="12.5" fontWeight="700" textAnchor="middle" fill="#fff">{n}</text></g>);

export function SceneReaction({ p, c, dir = null, dep = 0, anime = true, valeurs = true, reactions = false, equilibre = false }) {
  const BX = 64, BW = 272, BY = 64, BH = 226, NIV = 108, PW = 18;
  const solides = p.solides, nSol = solides.length;
  const xs = nSol === 2 ? [150, 250] : [200];
  const sensEff = dir || (reactions ? sens(p, c) : null), nul = !reactions || !sensEff || sensEff === 'equilibre' || equilibre;
  const demi = reactions && !nul ? demiReactions(p, sensEff, xs) : null;
  const hauteurPanneau = !reactions ? 0 : nul ? 56 : 112;
  const produit = dir === 'direct' ? (p.especes.find(s => s.role === 'red1')) : dir === 'inverse' ? (p.especes.find(s => s.role === 'red2')) : null;
  const consomme = dir === 'direct' ? (p.especes.find(s => s.role === 'red2')) : dir === 'inverse' ? (p.especes.find(s => s.role === 'ox1')) : null;
  const dis = p.dissoutes;
  const libres = SLOTS.filter(([x]) => xs.every(px => Math.abs(x - px) > 24));
  const lignes = dis.map((e, i) => ({ e, i, slots: libres.filter((_, k) => k % dis.length === i).slice(0, 8) }));
  const posLeg = dis.length === 3 ? [72, 200, 328] : dis.length === 2 ? [120, 280] : [200];
  return (
    <svg viewBox={!reactions ? '0 0 400 356' : demi ? `0 -40 400 ${396 + hauteurPanneau}` : '0 0 400 408'} style={stl} role="img" aria-label={`Bécher contenant ${dis.join(', ')} en solution et ${solides.join(' et ')} sous forme solide : ${dis.map(e => `[${e}] = ${concTexte(c[e])} mol/L`).join(', ')}.${dir ? (dir === 'direct' ? ' La réaction évolue dans le sens direct.' : ' La réaction évolue dans le sens inverse.') : ''}${demi ? ` Oxydation : ${demi[0].eq}, ${demi[0].lieu}. Réduction : ${demi[1].eq}, ${demi[1].lieu}. Les électrons passent de l’oxydation à la réduction.` : reactions ? (equilibre ? ' À l’équilibre, les réactions directe et inverse se compensent.' : ' Système à l’équilibre : aucune évolution.') : ''}`}>
      <Defs/>
      <rect x="0" y="290" width="400" height="66" fill="url(#s-table)"/><ellipse cx="200" cy="292" rx="150" ry="5" fill="#94a3b8" opacity="0.25"/><line x1="0" y1="290" x2="400" y2="290" stroke="#cbd5e1" strokeWidth="2"/>
      <Becher x={BX} y={BY} w={BW} h={BH} niveau={NIV} id="r">
        {Object.entries(TEINTE).filter(([e]) => dis.includes(e)).map(([e, [fill, op]]) => <rect key={e} x={BX} y={NIV} width={BW} height={BY + BH - NIV} fill={fill} opacity={op * frac(c[e])} style={{ transition: anime ? 'opacity .3s linear' : 'none' }}/>)}
      </Becher>
      {/* plaques */}
      {solides.map((s, k) => {
        const x = xs[k], estProd = produit && produit.e === s, estConso = consomme && consomme.e === s;
        const w = estProd ? PW * (1 + 0.5 * dep) : estConso ? PW * (1 - 0.5 * dep) : PW;
        return (<g key={s}>
          <rect x={x - w / 2} y="58" width={w} height="212" rx="2" fill={METAL[s]} stroke="#64748b" strokeWidth="1.2"/>
          <rect x={x - 11} y="52" width="22" height="9" rx="3" fill="#1e293b"/>
          {estProd && <Cristaux x={x} w={w} dep={dep} espece={s} anime={anime}/>}
          <text x={x} y="42" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>{s}(s)</text>
        </g>);
      })}
      {/* ions */}
      {lignes.map(({ e, i, slots }) => slots.map(([x, y], k) => (
        <g key={`${e}${k}`} style={{ opacity: k < nbDots(c[e]) ? 1 : 0, transition: anime ? 'opacity .5s ease' : 'none' }}>
          <Vib k={i * 7 + k} anime={anime}><Ion x={x} y={y} couleur={ESP[e].c} signe={ESP[e].z} r={6}/></Vib></g>)))}
      {/* demi-réactions : où elles ont lieu */}
      {demi && <g>
        {demi.map(h => <FlecheIon key={h.cp.id} h={h} anime={anime}/>)}
        {(() => {
          const [o, d] = demi, un = xs.length === 1, xo = un ? o.x + o.cote * 30 : o.x, xd = un ? d.x + d.cote * 30 : d.x, mid = (xo + xd) / 2, ang = Math.atan2(39, xd - mid) * 180 / Math.PI;
          return (<g>
            <path d={`M${xo} 5 Q${mid} -34 ${xd} 5`} fill="none" stroke={COL_E} strokeWidth="2.6" strokeLinecap="round" strokeDasharray="6 5">
              {anime && <animate attributeName="stroke-dashoffset" from={xd > xo ? 11 : -11} to="0" dur="1s" repeatCount="indefinite"/>}</path>
            <polygon points="0,0 -10,-5.5 -10,5.5" fill={COL_E} transform={`translate(${xd} 5) rotate(${ang})`}/>
            <circle cx={mid} cy="-14.5" r="9.5" fill="#fef9c3" stroke={COL_E} strokeWidth="1.6"/><text x={mid} y="-10.5" fontSize="11" fontWeight="700" textAnchor="middle" fill="#854d0e">e⁻</text>
            <BadgeNum x={xo} y={14} n="1" col={COL_OX}/><BadgeNum x={xd} y={14} n="2" col={COL_RED}/>
          </g>);
        })()}
      </g>}
      {/* légende des concentrations */}
      {valeurs && dis.map((e, i) => (<g key={e}>
        <Ion x={posLeg[i] - 44} y={317} couleur={ESP[e].c} signe={ESP[e].z} r={7}/>
        <text x={posLeg[i] - 32} y="316" fontSize="15" fontWeight="700" fill={ESP[e].c}>{e}</text>
        <text x={posLeg[i] - 32} y="334" fontSize="13" fontWeight="700" fill={COL.txt}>{concTexte(c[e])} mol/L</text>
      </g>))}
      {reactions && <g>
        {demi ? demi.map((h, k) => { const y = 352 + k * 54, col = k ? COL_RED : COL_OX;
          return (<g key={h.cp.id}>
            <rect x="12" y={y} width="376" height="48" rx="10" fill={k ? '#eff6ff' : '#fff7ed'} stroke={col} strokeWidth="1.6"/>
            <BadgeNum x={36} y={y + 24} n={k + 1} col={col}/>
            <text x="56" y={y + 20} fontSize="13.5" fontWeight="700" fill={col}>{k ? 'Réduction' : 'Oxydation'} : {h.gagne ? 'le réactif gagne' : 'le réactif perd'} des électrons</text>
            <text x="56" y={y + 40} fontSize="15" fontWeight="700" fill={COL.txt}>{h.eq}</text>
            <text x="376" y={y + 40} fontSize="11.5" textAnchor="end" fill={COL.gris}>{h.lieu}</text>
          </g>); })
          : <g><rect x="12" y="352" width="376" height="48" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.6"/>
            <text x="200" y="372" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>{equilibre ? 'À l’équilibre, les réactions directe et inverse' : 'Système à l’équilibre : aucune évolution,'}</text>
            <text x="200" y="391" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>{equilibre ? 'se produisent à la même vitesse : plus d’évolution.' : 'les deux réactions se compensent.'}</text></g>}
      </g>}
    </svg>);
}

// ---------- jauge : Qr glisse vers K sur un axe logarithmique ----------
export function Jauge({ logK, logQ, lo, hi, zones = true, fleche = false, montrerQ = true, montrerK = true, valeurQ = null, valeurK = null }) {
  const X = v => 30 + (v - lo) / (hi - lo) * 340, pas = hi - lo > 26 ? 5 : hi - lo > 13 ? 2 : 1;
  const xk = X(logK), xq = X(logQ), egal = Math.abs(logQ - logK) < 0.03;
  const ticks = []; for (let v = Math.ceil(lo / pas) * pas; v <= hi + 1e-9; v += pas) ticks.push(v);
  const ancre = xk > 300 ? 'end' : xk < 100 ? 'start' : 'middle';
  const txtK = valeurK ?? `K = ${puissanceTexte(logK)}`, txtQ = valeurQ ?? `Qr = ${puissanceTexte(logQ)}`;
  const ancreQ = xq > 300 ? 'end' : xq < 100 ? 'start' : 'middle';
  return (
    <svg viewBox="0 0 400 166" style={stl} role="img" aria-label={`Axe logarithmique${montrerK ? ` : K vaut ${puissanceTexte(logK)}` : ''}${montrerQ ? `, le quotient de réaction Qr vaut ${puissanceTexte(logQ)}` : ''}${zones && montrerK && montrerQ ? (egal ? '. Qr est égal à K : le système est à l’équilibre.' : logQ < logK ? '. Qr est inférieur à K : sens direct.' : '. Qr est supérieur à K : sens inverse.') : ''}`}>
      <defs><clipPath id="s-cj"><rect x="30" y="40" width="340" height="18" rx="9"/></clipPath></defs>
      <g clipPath="url(#s-cj)">
        <rect x="30" y="40" width="340" height="18" fill="#e2e8f0"/>
        {zones && montrerK && <><rect x="30" y="40" width={Math.max(0, xk - 30)} height="18" fill="#bbf7d0"/><rect x={xk} y="40" width={Math.max(0, 370 - xk)} height="18" fill="#fecaca"/></>}
      </g>
      <rect x="30" y="40" width="340" height="18" rx="9" fill="none" stroke="#94a3b8" strokeWidth="2"/>
      {ticks.map(v => <g key={v}><line x1={X(v)} y1="58" x2={X(v)} y2="65" stroke={COL.gris} strokeWidth="1.8"/><text x={X(v)} y="82" fontSize="12.5" textAnchor="middle" fill={COL.gris}>{pow10(v)}</text></g>)}
      {montrerK && <g>
        <line x1={xk} y1="24" x2={xk} y2="64" stroke={COL.orange} strokeWidth="3.2" strokeLinecap="round"/>
        <polygon points={`${xk},24 ${xk + 12},29 ${xk},34`} fill={COL.orange}/>
        <text x={xk + (ancre === 'end' ? -8 : ancre === 'start' ? 8 : 0)} y="16" fontSize="15" fontWeight="700" textAnchor={ancre} fill={COL.orange}>{txtK}</text>
        {egal && <circle cx={xk} cy="49" r="15" fill="none" stroke={COL.vert} strokeWidth="3"/>}
      </g>}
      {fleche && montrerQ && montrerK && !egal && <g>
        <line x1={xq + (logK > logQ ? 14 : -14)} y1="98" x2={xk + (logK > logQ ? -4 : 4)} y2="98" stroke={COL.orange} strokeWidth="2.6" strokeDasharray="6 5" strokeLinecap="round"/>
        <polygon points={logK > logQ ? `${xk},98 ${xk - 9},93 ${xk - 9},103` : `${xk},98 ${xk + 9},93 ${xk + 9},103`} fill={COL.orange}/></g>}
      {montrerQ && <g>
        <circle cx={xq} cy="49" r="11" fill={COL.bleu} stroke="#fff" strokeWidth="2.4"/><circle cx={xq} cy="49" r="3.6" fill="#fff"/>
        <text x={xq + (ancreQ === 'end' ? 12 : ancreQ === 'start' ? -12 : 0)} y="124" fontSize="15" fontWeight="700" textAnchor={ancreQ} fill={COL.bleu}>{txtQ}</text>
      </g>}
      <text x="200" y="143" fontSize="12.5" textAnchor="middle" fill={COL.gris}>axe logarithmique : Qr et K sont des nombres sans unité</text>
      {zones && montrerK && <g fontSize="14" fontWeight="700"><text x="30" y="162" fill={COL.vert}>Qr {'<'} K : sens direct →</text><text x="370" y="162" textAnchor="end" fill={COL.rouge}>← Qr {'>'} K : sens inverse</text></g>}
    </svg>);
}

// ---------- flacon d'eau oxygénée : K énorme, mais aucune transformation sans catalyseur ----------
export function FlaconH2O2({ catalyseur = false, afficherK = false, anime = true }) {
  const prof = 'M168 40 V112 L84 250 Q78 268 96 268 H304 Q322 268 316 250 L232 112 V40';
  const bulles = [[176, 0], [196, 0.5], [214, 1], [186, 1.5], [204, 2], [222, 2.5], [190, 0.9], [210, 1.8]];
  return (
    <svg viewBox="0 0 400 316" style={stl} role="img" aria-label={catalyseur ? 'Flacon d’eau oxygénée dans lequel on a ajouté du dioxyde de manganèse solide : des bulles de dioxygène se dégagent.' : 'Flacon d’eau oxygénée sans catalyseur : la solution est limpide, aucune bulle ne se forme.'}>
      <Defs/>
      <rect x="0" y="268" width="400" height="48" fill="url(#s-table)"/><ellipse cx="200" cy="270" rx="130" ry="5" fill="#94a3b8" opacity="0.25"/><line x1="0" y1="268" x2="400" y2="268" stroke="#cbd5e1" strokeWidth="2"/>
      <clipPath id="s-cf"><path d={`${prof} Z`}/></clipPath>
      <g clipPath="url(#s-cf)">
        <rect x="70" y="186" width="260" height="90" fill="#bae6fd" opacity="0.5"/><rect x="70" y="186" width="260" height="3" fill="#fff" opacity="0.8"/>
        {!catalyseur && [[126, 222], [268, 222], [112, 250], [160, 252], [226, 254], [276, 250], [206, 206]].map(([x, y], k) => (
          <Vib key={k} k={k} anime={anime}><g><circle cx={x} cy={y} r="6" fill="#ef4444" stroke="#fff" strokeWidth="1"/><circle cx={x + 8} cy={y + 5} r="6" fill="#ef4444" stroke="#fff" strokeWidth="1"/>
            <circle cx={x - 5} cy={y - 5} r="3.4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1"/><circle cx={x + 13} cy={y + 10} r="3.4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1"/></g></Vib>))}
        {catalyseur && <g>
          {[[172, 262], [180, 259], [188, 263], [196, 260], [204, 263], [212, 259], [220, 262], [228, 260], [236, 263], [184, 264], [216, 264]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.6" fill="#1e293b"/>)}
          {bulles.map(([x, d], k) => (<circle key={k} cx={x} cy={anime ? 256 : [238, 226, 246, 214, 242, 208, 232, 220][k]} r={3.2 + (k % 3) * 1.2} fill="#fff" stroke="#7dd3fc" strokeWidth="1.4" opacity={anime ? 0 : 0.95}>
            {anime && <animate attributeName="cy" from="256" to="196" dur="2.2s" begin={`${d * 0.6}s`} repeatCount="indefinite"/>}
            {anime && <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.1;0.8;1" dur="2.2s" begin={`${d * 0.6}s`} repeatCount="indefinite"/>}
          </circle>))}
                    {[[146, 187, 4.6], [160, 184, 3.6], [174, 187, 5], [190, 184, 3.8], [204, 187, 4.8], [220, 184, 3.6], [236, 187, 5], [252, 184, 4]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill="#fff" stroke="#bae6fd" strokeWidth="1.4"/>)}
        </g>}
      </g>
      <path d={prof} fill="none" stroke="#475569" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M96 246 L170 118" fill="none" stroke="url(#s-verreF)" strokeWidth="7" strokeLinecap="round" opacity="0.8"/>
      <line x1="160" y1="40" x2="240" y2="40" stroke="#475569" strokeWidth="3.4" strokeLinecap="round"/>
      <rect x="146" y="196" width="108" height="36" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1.6" opacity="0.94"/>
      <text x="200" y="213" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>eau oxygénée</text><text x="200" y="227" fontSize="12.5" textAnchor="middle" fill={COL.gris}>H₂O₂ (aq)</text>
      {catalyseur && <g><text x="200" y="22" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.bleu}>O₂ ↑</text>
        <path d="M300 168 L300 214 L240 258" fill="none" stroke={COL.gris} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="238" cy="259" r="3.6" fill={COL.gris}/>
        <rect x="266" y="134" width="128" height="36" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.6"/><text x="330" y="150" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>MnO₂ (solide)</text><text x="330" y="164" fontSize="12.5" textAnchor="middle" fill={COL.gris}>catalyseur ajouté</text></g>}
      <rect x="8" y="46" width="146" height="66" rx="10" fill={catalyseur ? '#f0fdf4' : '#fef2f2'} stroke={catalyseur ? '#86efac' : '#fca5a5'} strokeWidth="2"/>
      <text x="81" y="66" fontSize="12.5" textAnchor="middle" fill={COL.gris}>temps écoulé :</text>
      <text x="81" y="85" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>{catalyseur ? 'quelques secondes' : 'plusieurs mois'}</text>
      <text x="81" y="104" fontSize="15" fontWeight="700" textAnchor="middle" fill={catalyseur ? COL.vert : COL.rouge}>{catalyseur ? 'bulles de O₂' : 'aucune bulle'}</text>
      {afficherK && <g><rect x="248" y="46" width="146" height="66" rx="10" fill="#fff7ed" stroke="#fdba74" strokeWidth="2"/>
        <text x="321" y="66" fontSize="12.5" textAnchor="middle" fill={COL.gris}>la constante prévoit</text><text x="321" y="88" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>K ≈ {puissanceTexte(H2O2.logK)}</text><text x="321" y="104" fontSize="12.5" textAnchor="middle" fill={COL.gris}>(2 H₂O₂ → O₂ + 2 H₂O)</text></g>}
    </svg>);
}

// ====================================================
//  Cartes « À retenir » (viewBox 400 × 290, textes ≥ 14)
// ====================================================
const Carte = ({ children, label }) => (<svg viewBox="0 0 400 290" style={stl} role="img" aria-label={label}><Defs/>{children}</svg>);
const Boite = ({ x, y, w, h, fill = '#f8fafc', stroke = '#cbd5e1' }) => <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={stroke} strokeWidth="2"/>;

// carte 1 : l'échelle des E° et la règle du gamma (Cu²⁺ / Cu et Zn²⁺ / Zn)
export function SvgGammaCarte() {
  const yCu = 88, yZn = 168;
  return (
    <Carte label="Règle du gamma : sur l'échelle des potentiels standards, l'oxydant du couple de plus grand E° réagit avec le réducteur du couple de plus petit E°. Ici Cu2+ (E° 0,34 volt) réagit avec Zn (E° moins 0,76 volt) : Cu2+ + Zn donne Cu + Zn2+.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>La règle du gamma (γ)</text>
      <line x1="34" y1="214" x2="34" y2="40" stroke={COL.gris} strokeWidth="3" strokeLinecap="round"/><polygon points="34,34 27,48 41,48" fill={COL.gris}/><text x="46" y="50" fontSize="14" fontWeight="700" fill={COL.gris}>E°</text>
      {[[yCu, 'Cu²⁺', 'Cu', '0,34 V'], [yZn, 'Zn²⁺', 'Zn', '−0,76 V']].map(([y, ox, red, e]) => (<g key={ox}>
        <line x1="28" y1={y} x2="122" y2={y} stroke={COL.txt} strokeWidth="2.6"/>
        <text x="130" y={y + 5} fontSize="15" fontWeight="700" fill={COL.txt}>{e}</text>
        <rect x="50" y={y - 34} width="64" height="26" rx="7" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.8"/><text x="82" y={y - 15} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>{ox}</text>
        <rect x="50" y={y + 8} width="64" height="26" rx="7" fill="#dcfce7" stroke="#86efac" strokeWidth="1.8"/><text x="82" y={y + 27} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.vert}>{red}</text>
      </g>))}
      <path d={`M116 ${yCu - 21} C 252 ${yCu - 30}, 252 ${yZn + 40}, 124 ${yZn + 21}`} fill="none" stroke={COL.orange} strokeWidth="3.6" strokeLinecap="round"/>
      <polygon points={`118,${yZn + 21} 133,${yZn + 11} 133,${yZn + 31}`} fill={COL.orange}/>
      <Boite x={262} y={44} w={128} h={46} fill="#fef2f2" stroke="#fca5a5"/>
      <text x="326" y="64" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.rouge}>E° grand :</text><text x="326" y="82" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.rouge}>oxydant fort</text>
      <Boite x={262} y={148} w={128} h={46} fill="#f0fdf4" stroke="#86efac"/>
      <text x="326" y="168" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.vert}>E° petit :</text><text x="326" y="186" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.vert}>réducteur fort</text>
      <text x="326" y="128" fontSize="30" fontWeight="700" textAnchor="middle" fill={COL.orange}>γ</text>
      <text x="200" y="228" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>l’oxydant le plus fort réagit</text>
      <text x="200" y="246" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>avec le réducteur le plus fort</text>
      <Boite x={14} y={256} w={372} h={30} fill="#f0fdf4" stroke="#86efac"/>
      <text x="200" y="277" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>Cu²⁺ + Zn → Cu + Zn²⁺</text>
    </Carte>);
}

// carte 2 : K à partir des potentiels standards
export function SvgKCarte() {
  const lk = paire('ag', 'cu').logK, X = v => 40 + (v + 10) / 30 * 320;
  return (
    <Carte label="Constante d'équilibre : log K égale N fois la différence des potentiels standards divisée par 0,06, avec N le nombre d'électrons échangés dans l'équation. Exemple : argent et cuivre, N égale 2, log K égale 15,3. Si K dépasse 10 puissance 4, la transformation est quasi totale.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>La constante d’équilibre K</text>
      <Boite x={14} y={34} w={372} h={62} fill="#fff7ed" stroke="#fdba74"/>
      <text x="22" y="74" fontSize="20" fontWeight="700" fill={COL.orange}>log K =</text>
      <text x="206" y="60" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>N × (E°₁ − E°₂)</text><line x1="112" y1="67" x2="300" y2="67" stroke={COL.txt} strokeWidth="2"/><text x="206" y="88" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>0,06</text>
      <text x="342" y="64" fontSize="13" textAnchor="middle" fill={COL.gris}>avec</text><text x="342" y="82" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.gris}>E°₁ {'>'} E°₂</text>
      <text x="22" y="120" fontSize="14.5" fontWeight="700" fill={COL.txt}>N : électrons échangés dans l’équation écrite</text>
      <text x="22" y="140" fontSize="14.5" fontWeight="700" fill={COL.bleu}>2 Ag⁺ + Cu ⇌ 2 Ag + Cu²⁺ : N = 2</text>
      <text x="22" y="162" fontSize="14.5" fontWeight="700" fill={COL.orange}>log K = 2 × (0,80 − 0,34) / 0,06 = {fr(lk, 1)}</text>
      <rect x="40" y="188" width="320" height="16" rx="8" fill="#e2e8f0"/>
      <rect x="40" y="188" width={X(-4) - 40} height="16" rx="8" fill="#fecaca"/><rect x={X(-4)} y="188" width={X(4) - X(-4)} height="16" fill="#fde68a"/><rect x={X(4)} y="188" width={360 - X(4)} height="16" rx="8" fill="#bbf7d0"/>
      <rect x={X(-4)} y="188" width="10" height="16" fill="#fde68a"/><rect x={X(4) - 8} y="188" width="10" height="16" fill="#fde68a"/>
      {[[-4, '10⁻⁴'], [4, '10⁴']].map(([v, t]) => <g key={v}><line x1={X(v)} y1="184" x2={X(v)} y2="208" stroke={COL.txt} strokeWidth="2"/><text x={X(v)} y="226" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>{t}</text></g>)}
      <text x="34" y="178" fontSize="13" fontWeight="700" fill={COL.rouge}>presque rien</text>
      <text x={(X(-4) + X(4)) / 2 + 4} y="178" fontSize="13" fontWeight="700" textAnchor="middle" fill={COL.orange}>équilibre</text>
      <text x={(X(4) + 360) / 2} y="178" fontSize="13" fontWeight="700" textAnchor="middle" fill={COL.vert}>quasi totale</text>
      <circle cx={X(lk)} cy="196" r="9" fill={COL.bleu} stroke="#fff" strokeWidth="2.4"/>
      <text x="200" y="256" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>K très grand : réaction quasi totale</text>
      <text x="200" y="278" fontSize="14" textAnchor="middle" fill={COL.gris}>E° au centivolt : K n’est qu’un ordre de grandeur</text>
    </Carte>);
}

// carte 3 : Qr comparé à K
export function SvgQrKCarte() {
  const ligne = (y, fond, bord, coul, t1, t2, g) => (<g>
    <Boite x={14} y={y} w={372} h={50} fill={fond} stroke={bord}/>
    <text x="30" y={y + 33} fontSize="22" fontWeight="700" fill={coul}>{t1}</text>
    <text x="130" y={y + 30} fontSize="15" fontWeight="700" fill={coul}>{t2}</text>
    <text x="368" y={y + 34} fontSize="26" fontWeight="700" textAnchor="end" fill={coul}>{g}</text></g>);
  return (
    <Carte label="Comparer le quotient de réaction Qr à la constante K : si Qr est inférieur à K, la réaction évolue dans le sens direct ; si Qr est égal à K, le système est à l'équilibre ; si Qr est supérieur à K, la réaction évolue dans le sens inverse. Le quotient Qr tend toujours vers K.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Comparer Qr et K</text>
      <text x="200" y="46" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>Qr = [produits]<tspan fontSize="11" dy="-5">coef</tspan><tspan dy="5"> / [réactifs]</tspan><tspan fontSize="11" dy="-5">coef</tspan><tspan dy="5" fill={COL.gris} fontWeight="400">  (solides : 1)</tspan></text>
      {ligne(58, '#f0fdf4', '#86efac', COL.vert, 'Qr < K', 'sens direct', '→')}
      {ligne(116, '#eff6ff', '#93c5fd', COL.bleu, 'Qr = K', 'équilibre', '⇌')}
      {ligne(174, '#fef2f2', '#fca5a5', COL.rouge, 'Qr > K', 'sens inverse', '←')}
      <text x="200" y="252" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>Qr évolue toujours vers K</text>
      <text x="200" y="274" fontSize="14" textAnchor="middle" fill={COL.gris}>l’état final est atteint quand Qr = K</text>
    </Carte>);
}

// carte 4 : les concentrations peuvent renverser le sens (Ag⁺ / Ag et Fe³⁺ / Fe²⁺)
export function SvgConcCarte() {
  const Y = E => 232 - (E - 0.60) / 0.30 * 140;
  const Echelle = (x, titre, eAg, eFe) => (<g>
    <text x={x} y="50" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>{titre}</text>
    <line x1={x} y1="62" x2={x} y2="236" stroke={COL.gris} strokeWidth="2.6" strokeLinecap="round"/>
    <circle cx={x} cy={Y(eAg)} r="7" fill={COL.rouge} stroke="#fff" strokeWidth="2"/>
    <text x={x + 14} y={Y(eAg) - 2} fontSize="14" fontWeight="700" fill={COL.rouge}>Ag⁺ / Ag</text><text x={x + 14} y={Y(eAg) + 14} fontSize="14" fontWeight="700" fill={COL.rouge}>{fr(eAg, 2)} V</text>
    <circle cx={x} cy={Y(eFe)} r="7" fill={COL.vert} stroke="#fff" strokeWidth="2"/>
    <text x={x - 14} y={Y(eFe) - 2} fontSize="14" fontWeight="700" textAnchor="end" fill={COL.vert}>Fe³⁺ / Fe²⁺</text><text x={x - 14} y={Y(eFe) + 14} fontSize="14" fontWeight="700" textAnchor="end" fill={COL.vert}>{fr(eFe, 2)} V</text>
  </g>);
  return (
    <Carte label="Quand K est proche de 1, les concentrations décident du sens. En conditions standard, Ag+ (E° 0,80 volt) est un oxydant plus fort que Fe3+ (0,77 volt), sens direct. Mais pour une concentration de Ag+ de 0,010 mole par litre, le potentiel de Ag+ sur Ag tombe à 0,68 volt, sous celui de Fe3+ sur Fe2+ : la réaction évolue dans le sens inverse.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Les concentrations décident</text>
      {Echelle(104, 'à 1 mol/L : E°', 0.80, 0.77)}
      {Echelle(304, '[Ag⁺] = 0,010 mol/L', 0.68, 0.77)}
      <line x1="200" y1="40" x2="200" y2="240" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5"/>
      <text x="104" y="258" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.vert}>Ag⁺ plus oxydant : →</text>
      <text x="304" y="258" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Fe³⁺ plus oxydant : ←</text>
      <text x="200" y="280" fontSize="14" textAnchor="middle" fill={COL.gris}>E₁ − E₂ = (0,06 / N) × log(K / Qr)</text>
    </Carte>);
}

// carte 5 : le blocage cinétique
export function SvgBlocageCarte() {
  const Flacon = (x, bulles) => (<g>
    <path d={`M${x + 22} 66 V96 L${x - 4} 150 Q${x - 6} 158 ${x + 4} 158 H${x + 76} Q${x + 86} 158 ${x + 84} 150 L${x + 58} 96 V66`} fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d={`M${x + 3} 140 L${x + 17} 118 H${x + 63} L${x + 77} 140 L${x + 80} 150 Q${x + 81} 155 ${x + 76} 155 H${x + 4} Q${x - 1} 155 ${x} 150 Z`} fill="#bae6fd" opacity="0.55"/>
    {bulles && [[x + 28, 136, 4], [x + 44, 124, 3.4], [x + 56, 138, 4.4], [x + 36, 150, 3], [x + 62, 148, 3.2]].map(([a, b, r], k) => <circle key={k} cx={a} cy={b} r={r} fill="#fff" stroke="#7dd3fc" strokeWidth="1.5"/>)}
    {bulles && [[x + 26, 150], [x + 36, 153], [x + 46, 151], [x + 56, 153]].map(([a, b], k) => <circle key={k} cx={a} cy={b} r="2.8" fill="#1e293b"/>)}
  </g>);
  return (
    <Carte label="Blocage cinétique : K et Qr donnent le sens d'évolution possible, jamais la vitesse. L'eau oxygénée devrait se transformer en dioxygène et en eau (K très grand) mais reste stable pendant des mois. Un catalyseur, par exemple du dioxyde de manganèse, déclenche le dégagement de dioxygène.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Prévoir n’est pas observer</text>
      {Flacon(24, false)}{Flacon(246, true)}
      <text x="66" y="52" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>H₂O₂ seule</text><text x="288" y="52" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>+ catalyseur</text>
      <text x="66" y="180" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.rouge}>rien ne se passe</text><text x="288" y="180" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.vert}>bulles de O₂</text>
      <path d="M118 112 H236" stroke={COL.orange} strokeWidth="3.2" strokeDasharray="7 5" strokeLinecap="round"/><polygon points="244,112 232,105 232,119" fill={COL.orange}/>
      <text x="177" y="104" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.orange}>K ≈ 10³⁷</text>
      <Boite x={14} y={196} w={372} h={88} fill="#fff7ed" stroke="#fdba74"/>
      <text x="200" y="220" fontSize="15.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>K et Qr donnent le <tspan fill={COL.orange}>sens possible</tspan>,</text>
      <text x="200" y="242" fontSize="15.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>pas la <tspan fill={COL.rouge}>vitesse</tspan> de la transformation</text>
      <text x="200" y="266" fontSize="14" textAnchor="middle" fill={COL.gris}>prévue mais non observée : blocage cinétique</text>
    </Carte>);
}
