// ====================================================
//  Schémas et animations de la simulation 240 (effet photoélectrique ; niveau TG).
//  Scène animée : viewBox 460 × 300, textes ≥ 16. Graphe : viewBox 400 × 300, textes ≥ 15,5. Cartes : viewBox de 320, textes ≥ 15,5.
//  Animation : le temps t (secondes) vient de useHorloge ; toutes les positions sont des fonctions pures de t (aucun état caché), donc une image fixe
//  (pause, préférence « réduire les animations », capture d'écran) est toujours cohérente. Public daltonien : le domaine de la lumière est toujours écrit.
// ====================================================
import { T_FIGE } from './effetPhotoHorloge';
import * as M from "./effetPhotoModele";
const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', gris: '#475569', txt: '#0f172a', clair: '#cbd5e1', paroi: '#334155', elec: '#1d4ed8', metal: '#94a3b8' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const SVG_STYLE = { width: '100%', maxWidth: 480, display: 'block', margin: '0 auto' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Sub = ({ children, s }) => <tspan dy={s * 0.22} fontSize={s * 0.78}>{children}</tspan>;
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 9 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};

const PERIODE = 3.2, V_PHOTON = 140, LONG_PAQUET = 70;

// Paquet d'onde d'un photon : sinusoïde enveloppée, de nombre d'ondulations proportionnel à ν (λ plus courte = ondulations plus serrées)
function Photon({ ax, ay, bx, by, u, nu, couleur, largeur = 4, depart = 0 }) {
  const D = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / D, uy = (by - ay) / D, nx = -uy, ny = ux;
  const debut = u - LONG_PAQUET, s0 = Math.max(depart, debut), s1 = Math.min(u, D);
  if (s1 - s0 < 1.5) return null;
  const cycles = nu / 1.25, pts = [];
  for (let s = s0; s <= s1 + 0.01; s += 2) {
    const q = (s - debut) / LONG_PAQUET, amp = 10 * Math.sin(Math.PI * Math.min(1, Math.max(0, q))), d = amp * Math.sin(2 * Math.PI * cycles * q);
    pts.push(`${(ax + ux * s + nx * d).toFixed(1)},${(ay + uy * s + ny * d).toFixed(1)}`);
  }
  return <polyline points={pts.join(' ')} fill="none" stroke={couleur} strokeWidth={largeur} strokeLinecap="round" strokeLinejoin="round"/>;
}
const Electron = ({ x, y, o = 1 }) => (
  <g opacity={o}><circle cx={x} cy={y} r={9} fill="#dbeafe" stroke={COL.elec} strokeWidth={3}/><line x1={x - 4.5} y1={y} x2={x + 4.5} y2={y} stroke={COL.elec} strokeWidth={2.6} strokeLinecap="round"/></g>);

const IMPACTS = [[260], [230, 290], [200, 260, 320], [200, 240, 280, 320], [200, 230, 260, 290, 320]];
const LAMPE = { x: 62, y: 70 }, SURF = 238;

// Scène « plaque métallique éclairée ». nu : 10¹⁴ Hz ; W : eV ; N : nombre de photons par cycle (1 à 5) ; t : temps. montre.etiq : étiquettes de la lumière.
export function ScenePhoto({ nu, W, N = 2, t = T_FIGE, nomMetal = 'métal', aria }) {
  const nm = M.lambdaNm(nu), coul = M.couleurLumiere(nm), ec = M.ecMaxEV(nu, W), sort = ec > 0;
  const xs = IMPACTS[Math.max(1, Math.min(5, Math.round(N))) - 1];
  const dirE = [0.5, -0.866], vE = 40 + 45 * Math.sqrt(ec);
  const elems = xs.map((x, i) => {
    const D = Math.hypot(x - LAMPE.x, SURF - LAMPE.y), tc = (t + i * PERIODE / xs.length) % PERIODE, u = V_PHOTON * tc, th = D / V_PHOTON;
    const age = ((tc - th) % PERIODE + PERIODE) % PERIODE, d = vE * age, ex = x + dirE[0] * d, ey = SURF - 9 + dirE[1] * d, o = Math.max(0, 1 - age / PERIODE) * (ey > 14 ? 1 : 0);
    return (<g key={i}>
      <Photon ax={LAMPE.x} ay={LAMPE.y} bx={x} by={SURF} u={u} nu={nu} couleur={coul} depart={42}/>
      {sort && o > 0.02 && <Electron x={ex} y={ey} o={o}/>}
    </g>);
  });
  const label = aria || `Une lampe, en haut à gauche, envoie des photons de ${M.domaineLumiere(nm).nom} vers une plaque de ${nomMetal}.${sort ? ' Des électrons sont éjectés de la plaque.' : ' Aucun électron n’est éjecté de la plaque.'}`;
  return (
    <svg viewBox="0 0 460 300" role="img" aria-label={label} style={SVG_STYLE}>
      <g>{[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return <line key={a} x1={LAMPE.x + 26 * Math.cos(r)} y1={LAMPE.y + 26 * Math.sin(r)} x2={LAMPE.x + 36 * Math.cos(r)} y2={LAMPE.y + 36 * Math.sin(r)} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round"/>; })}
        <circle cx={LAMPE.x} cy={LAMPE.y} r={19} fill="#fde68a" stroke="#f59e0b" strokeWidth={4}/></g>
      <Tx x={LAMPE.x} y={LAMPE.y + 66} ancre="middle" s={18}>lumière</Tx>
      <rect x={120} y={SURF} width={320} height={26} rx={3} fill="#cbd5e1" stroke={COL.paroi} strokeWidth={3.5}/>
      <line x1={120} y1={SURF + 6} x2={440} y2={SURF + 6} stroke="#e2e8f0" strokeWidth={4}/>
      <Tx x={280} y={SURF + 51} ancre="middle" s={18}>plaque de {nomMetal}</Tx>
      {elems}
      <g><Electron x={30} y={286}/><Tx x={46} y={292} s={17.5} w={600} halo={false}>électron</Tx></g>
    </svg>);
}

// Scène « cellule photoélectrique » : tube sous vide, photocathode, anode, circuit avec ampèremètre et générateur.
export function SceneCellule({ nu, W, N = 2, t = T_FIGE, aria }) {
  const PC = 1.6;   // période plus courte : le trajet photocathode-anode est court
  const nm = M.lambdaNm(nu), coul = M.couleurLumiere(nm), ec = M.ecMaxEV(nu, W), sort = ec > 0;
  const ys = [[116], [100, 132], [92, 116, 140]][Math.max(1, Math.min(3, Math.round(N))) - 1], XC = 148, XA = 330, vE = 60 + 40 * Math.sqrt(ec);
  const L = { x: 60, y: 56 };
  const elems = ys.map((y, i) => {
    const D = Math.hypot(XC - L.x, y - L.y), tc = (t + i * PC / ys.length) % PC, u = V_PHOTON * tc, th = D / V_PHOTON, age = ((tc - th) % PC + PC) % PC, d = vE * age, ex = XC + 8 + d;
    return (<g key={i}><Photon ax={L.x} ay={L.y} bx={XC - 2} by={y} u={u} nu={nu} couleur={coul} depart={32}/>
      {sort && ex < XA - 8 && age < (XA - XC) / vE + 0.01 && <Electron x={ex} y={y} o={1}/>}</g>);
  });
  return (
    <svg viewBox="0 0 460 300" role="img" aria-label={aria || 'Une cellule photoélectrique : dans une ampoule vide, la lumière éclaire une photocathode qui éjecte des électrons ; ils sont collectés par l’anode, reliée à la photocathode par un circuit contenant un ampèremètre et un générateur.'} style={SVG_STYLE}>
      <rect x={112} y={38} width={252} height={152} rx={38} fill="#f1f5f9" stroke={COL.paroi} strokeWidth={3.5}/>
      <Tx x={238} y={176} ancre="middle" s={17.5} w={600} c={COL.gris} halo={false}>vide</Tx>
      <path d="M 138 64 Q 124 114 138 166" fill="none" stroke={COL.metal} strokeWidth={9} strokeLinecap="round"/>
      <line x1={XA} y1={74} x2={XA} y2={156} stroke={COL.paroi} strokeWidth={6} strokeLinecap="round"/>
      <Tx x={150} y={26} ancre="middle" s={17.5}>photocathode</Tx><Tx x={XA + 8} y={26} ancre="middle" s={17.5}>anode</Tx>
      <g>{[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return <line key={a} x1={L.x + 17 * Math.cos(r)} y1={L.y + 17 * Math.sin(r)} x2={L.x + 25 * Math.cos(r)} y2={L.y + 25 * Math.sin(r)} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round"/>; })}
        <circle cx={L.x} cy={L.y} r={12} fill="#fde68a" stroke="#f59e0b" strokeWidth={3.5}/></g>
      {/* circuit : photocathode → ampèremètre → générateur (borne + côté anode) → anode */}
      <polyline points={`133,166 133,246 190,246`} fill="none" stroke={COL.paroi} strokeWidth={3}/>
      <circle cx={206} cy={246} r={16} fill="#fff" stroke={COL.paroi} strokeWidth={3}/><Tx x={206} y={252} ancre="middle" s={17} halo={false}>A</Tx>
      <polyline points={`222,246 262,246`} fill="none" stroke={COL.paroi} strokeWidth={3}/>
      <line x1={262} y1={238} x2={262} y2={254} stroke={COL.paroi} strokeWidth={3}/><line x1={276} y1={232} x2={276} y2={260} stroke={COL.paroi} strokeWidth={3}/>
      <polyline points={`276,246 ${XA},246 ${XA},156`} fill="none" stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={250} y={228} ancre="middle" s={17.5} halo={false}>−</Tx><Tx x={288} y={228} ancre="middle" s={17.5} halo={false}>+</Tx>
      <Tx x={215} y={284} ancre="end" s={17.5} w={600}>ampèremètre</Tx><Tx x={236} y={284} s={17.5} w={600}>générateur</Tx>
      {elems}
    </svg>);
}

// Trois photons de fréquences différentes (étape 1) : plus de ν = plus d'ondulations serrées. Aucune valeur numérique.
export function SceneTroisPhotons({ aria }) {
  const L = [{ nm: 650, nom: 'rouge' }, { nm: 530, nom: 'vert' }, { nm: 410, nom: 'violet' }];
  const X0 = 96, LONG = 150, AMP = 15;
  return (
    <svg viewBox="0 0 460 230" role="img" aria-label={aria || 'Trois photons se déplacent vers la droite à la même vitesse : un photon rouge, un vert et un violet. Plus la fréquence est grande, plus les ondulations sont serrées.'} style={SVG_STYLE}>
      {L.map((p, k) => {
        const y = 42 + 72 * k, nu = M.nu14DeLambda(p.nm), coul = M.couleurLumiere(p.nm), cycles = nu * 1.05, pts = [];
        for (let x = 0; x <= LONG; x += 2) { const q = x / LONG, amp = AMP * Math.sin(Math.PI * q); pts.push(`${(X0 + x).toFixed(1)},${(y + amp * Math.sin(2 * Math.PI * cycles * q)).toFixed(1)}`); }
        return (<g key={p.nom}>
          <Tx x={10} y={y + 6} s={19} c={coul}>{p.nom}</Tx>
          <polyline points={pts.join(' ')} fill="none" stroke={coul} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"/>
          <Fleche x1={276} y1={y} x2={448} y2={y} c={COL.gris} w={3} tete={10}/>
          <Tx x={362} y={y - 10} ancre="middle" s={17.5} c={COL.gris} w={600} halo={false}>même vitesse c</Tx>
        </g>);
      })}
    </svg>);
}

// Graphe Ec,max = f(ν) pour un métal de travail d'extraction W (eV) ; point courant (nu en 10¹⁴ Hz).
export function GrapheEc({ nu, W, aria }) {
  const X = v => 62 + v / 14 * 320, Y = e => 250 - e / 6 * 226, nu0 = M.nuSeuil14(W), E14 = M.energiePhotonEV(14) - W, finX = E14 > 6 ? nu0 + (6 / (M.energiePhotonEV(1))) : 14, finE = Math.min(6, E14);
  const ec = M.ecMaxEV(nu, W), sort = ec > 0, py = sort ? Y(Math.min(ec, 6)) : 250;
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={aria || `Énergie cinétique maximale des électrons en fonction de la fréquence de la lumière : une droite qui part de la fréquence seuil, ${nbf(nu0, 1)} fois dix puissance quatorze hertz, et monte avec la fréquence. Fréquence réglée : ${nbf(nu, 1)}. ${sort ? `Énergie cinétique maximale : ${nbf(ec, 2)} électronvolt.` : 'Aucun électron n’est éjecté.'}`} style={SVG_STYLE}>
      <line x1={62} y1={20} x2={62} y2={250} stroke={COL.paroi} strokeWidth={3}/><line x1={58} y1={250} x2={392} y2={250} stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={72} y={16} s={15.5} halo={false}>Ec<Sub s={15.5}>,max</Sub> (eV)</Tx>
      {[0, 2, 4, 6].map(e => <g key={e}><line x1={58} y1={Y(e)} x2={62} y2={Y(e)} stroke={COL.paroi} strokeWidth={2}/><Tx x={54} y={Y(e) + 5} ancre="end" s={15.5} w={600} halo={false}>{e}</Tx></g>)}
      {[0, 2, 4, 6, 8, 10, 12, 14].map(v => <g key={v}><line x1={X(v)} y1={250} x2={X(v)} y2={255} stroke={COL.paroi} strokeWidth={2}/><Tx x={X(v)} y={272} ancre="middle" s={15.5} w={600} halo={false}>{v}</Tx></g>)}
      <Tx x={392} y={294} ancre="end" s={15.5} halo={false}>ν (10¹⁴ Hz)</Tx>
      <line x1={X(nu0)} y1={250} x2={X(finX)} y2={Y(finE)} stroke={COL.bleu} strokeWidth={3.5}/>
      <circle cx={X(nu0)} cy={250} r={5.5} fill="#fff" stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={X(nu0) - 8} y={236} ancre="end" s={16.5} c={COL.paroi}>ν₀</Tx>
      {sort && <line x1={X(nu)} y1={py} x2={X(nu)} y2={250} stroke={COL.paroi} strokeWidth={2} strokeDasharray="4 4"/>}
      <circle cx={X(nu)} cy={py} r={7} fill={sort ? COL.elec : '#fff'} stroke={COL.elec} strokeWidth={3.5}/>
      {!sort && <Tx x={72} y={204} s={16} c={COL.elec}>aucun électron éjecté</Tx>}
    </svg>);
}

// ---------- cartes « À retenir » (viewBox 320) ----------
const SvgCarte = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>{children}</svg>;
const Barre = ({ x1, x2, y, c = COL.bleu }) => <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={2.5}/>;
const Onde = ({ x, y, L, cyc, c, w = 3.5, dir = 1 }) => { const pts = []; for (let s = 0; s <= L; s += 2) { const q = s / L; pts.push(`${(x + dir * s).toFixed(1)},${(y + 6.5 * Math.sin(Math.PI * q) * Math.sin(2 * Math.PI * cyc * q)).toFixed(1)}`); } return <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round"/>; };

export function SvgCartePhoton() {
  return (
    <SvgCarte h={292} aria="Le photon : particule de lumière, sans masse, qui se déplace à la vitesse c. Son énergie E égale h fois nu, ou h c divisé par lambda. Plus la fréquence est grande, plus l’énergie est grande : l’ultraviolet est plus énergétique que le visible, le rouge est moins énergétique que le violet. Un électronvolt vaut 1,60 fois dix puissance moins dix-neuf joules.">
      <rect x={10} y={8} width={300} height={84} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={108} y={60} ancre="end" s={21} c={COL.bleu} halo={false}>E = h ν =</Tx>
      <Tx x={150} y={46} ancre="middle" s={21} c={COL.bleu} halo={false}>h × c</Tx><Barre x1={116} x2={184} y={56}/><Tx x={150} y={80} ancre="middle" s={21} c={COL.bleu} halo={false}>λ</Tx>
      <Tx x={200} y={60} s={15.5} c={COL.gris} w={600} halo={false}>E en joules (J)</Tx>
      <defs><linearGradient id="gSpecPh" x1="0" x2="1"><stop offset="0" stopColor="#b91c1c"/><stop offset="0.25" stopColor="#d97706"/><stop offset="0.5" stopColor="#15803d"/><stop offset="0.75" stopColor="#1d4ed8"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect x={16} y={112} width={288} height={20} rx={4} fill="url(#gSpecPh)" stroke={COL.paroi} strokeWidth={2}/>
      <Tx x={16} y={154} s={15.5}>rouge</Tx><Tx x={304} y={154} ancre="end" s={15.5}>violet</Tx>
      <Fleche x1={16} y1={172} x2={304} y2={172} c={COL.txt} w={3} tete={10}/><Tx x={160} y={196} ancre="middle" s={16.5}>ν et E augmentent</Tx>
      <Tx x={16} y={214} s={15.5}>h = 6,63×10⁻³⁴ J·s</Tx><Tx x={16} y={234} s={15.5}>c = 3,00×10⁸ m·s⁻¹</Tx>
      <Tx x={16} y={254} s={16.5}>1 eV = 1,60×10⁻¹⁹ J</Tx>
      <Tx x={16} y={278} s={15.5} w={600} c={COL.gris}>Photon : sans masse, vitesse c</Tx>
    </SvgCarte>);
}
export function SvgCarteSeuil() {
  const Plaque = x => <g><rect x={x} y={104} width={116} height={16} rx={2} fill="#cbd5e1" stroke={COL.paroi} strokeWidth={3}/></g>;
  return (
    <SvgCarte h={284} aria="Deux cas. Si la fréquence est inférieure à la fréquence seuil nu zéro, les photons n’ont pas assez d’énergie : aucun électron n’est éjecté, même avec une lumière très intense. Si la fréquence est supérieure à nu zéro, des électrons sont éjectés. Le travail d’extraction W est l’énergie minimale pour arracher un électron au métal ; h fois nu zéro égale W.">
      <Tx x={70} y={24} ancre="middle" s={16.5}>ν &lt; ν₀</Tx><Tx x={250} y={24} ancre="middle" s={16.5}>ν &gt; ν₀</Tx>
      {Plaque(12)}{Plaque(192)}
      <Onde x={26} y={44} L={50} cyc={2} c={COL.rouge}/><Fleche x1={76} y1={44} x2={96} y2={98} c={COL.rouge} w={3} tete={9}/>
      <Onde x={206} y={44} L={50} cyc={5} c={COL.elec}/><Fleche x1={256} y1={44} x2={270} y2={98} c={COL.elec} w={3} tete={9}/>
      <circle cx={298} cy={64} r={9} fill="#dbeafe" stroke={COL.elec} strokeWidth={3}/><line x1={293.5} y1={64} x2={302.5} y2={64} stroke={COL.elec} strokeWidth={2.6}/>
      <Fleche x1={276} y1={98} x2={292} y2={74} c={COL.elec} w={2.5} tete={8}/>
      <Tx x={70} y={148} ancre="middle" s={16}>aucun électron</Tx><Tx x={250} y={148} ancre="middle" s={16}>électrons éjectés</Tx>
      <rect x={10} y={166} width={300} height={44} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={160} y={196} ancre="middle" s={20} c={COL.bleu} halo={false}>h ν₀ = W</Tx>
      <Tx x={16} y={236} s={16}>W : travail d’extraction du métal,</Tx><Tx x={16} y={256} s={16} w={600} c={COL.gris}>énergie minimale pour arracher</Tx><Tx x={16} y={276} s={16} w={600} c={COL.gris}>un électron (en eV)</Tx>
    </SvgCarte>);
}
export function SvgCarteBilan() {
  const yB = 210;      // barre : 1 eV = 40 unités
  const W = 2.3 * 40, Ec = 1.2 * 40;
  return (
    <SvgCarte h={292} aria="Bilan d’énergie : l’énergie h nu du photon est partagée entre le travail d’extraction W et l’énergie cinétique de l’électron. h nu égale W plus Ec. Donc Ec maximale égale h nu moins W. Pas d’électron si h nu est inférieur à W.">
      <rect x={96} y={yB - W} width={70} height={W} fill="#e2e8f0" stroke={COL.paroi} strokeWidth={3}/><Tx x={131} y={yB - W / 2 + 6} ancre="middle" s={20} halo={false}>W</Tx>
      <rect x={96} y={yB - W - Ec} width={70} height={Ec} fill="#bfdbfe" stroke={COL.paroi} strokeWidth={3}/><Tx x={131} y={yB - W - Ec / 2 + 6} ancre="middle" s={18} halo={false}>Ec</Tx>
      <path d={`M 84 ${yB} L 76 ${yB} L 76 ${yB - W - Ec} L 84 ${yB - W - Ec}`} fill="none" stroke={COL.bleu} strokeWidth={3}/>
      <Tx x={68} y={yB - (W + Ec) / 2 + 6} ancre="end" s={20} c={COL.bleu} halo={false}>h ν</Tx>
      <Tx x={176} y={yB - W / 2 - 2} s={15.5} c={COL.gris} w={600}>sert à extraire</Tx><Tx x={176} y={yB - W / 2 + 18} s={15.5} c={COL.gris} w={600}>l’électron</Tx><Tx x={176} y={yB - W - Ec / 2 - 2} s={15.5} c={COL.gris} w={600}>énergie de</Tx><Tx x={176} y={yB - W - Ec / 2 + 18} s={15.5} c={COL.gris} w={600}>mouvement</Tx>
      <rect x={10} y={8} width={300} height={44} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={160} y={38} ancre="middle" s={20} c={COL.bleu} halo={false}>Ec,max = h ν − W</Tx>
      <Tx x={16} y={242} s={16}>h ν = W + Ec : toute l’énergie du photon</Tx><Tx x={16} y={262} s={16} w={600} c={COL.gris}>est cédée à un seul électron</Tx><Tx x={16} y={280} s={15.5} w={600} c={COL.gris}>Si h ν &lt; W : aucun électron</Tx>
    </SvgCarte>);
}
export function SvgCarteHistoire() {
  const jalons = [[44, '1887', 'Hertz observe l’effet'], [160, '1905', 'Einstein : les photons'], [276, '1921', 'prix Nobel (Einstein)']];
  return (
    <SvgCarte h={262} aria="Repères historiques : en 1887, Hertz observe l’effet photoélectrique ; en 1905, Einstein l’explique avec des photons ; en 1921, il reçoit le prix Nobel de physique. Le modèle ondulatoire seul ne peut pas expliquer le seuil de fréquence : il faut le modèle particulaire.">
      <line x1={20} y1={64} x2={300} y2={64} stroke={COL.paroi} strokeWidth={3}/>
      {jalons.map(([x, an]) => (<g key={an}><circle cx={x} cy={64} r={8} fill={COL.bleu} stroke="#fff" strokeWidth={2}/><Tx x={x} y={40} ancre="middle" s={18}>{an}</Tx></g>))}
      <Tx x={44} y={100} ancre="middle" s={15.5} w={600}>Hertz</Tx><Tx x={44} y={118} ancre="middle" s={15.5} w={600}>observe</Tx>
      <Tx x={160} y={100} ancre="middle" s={15.5} w={600}>Einstein :</Tx><Tx x={160} y={118} ancre="middle" s={15.5} w={600}>les photons</Tx>
      <Tx x={276} y={100} ancre="middle" s={15.5} w={600}>prix Nobel</Tx><Tx x={276} y={118} ancre="middle" s={15.5} w={600}>d’Einstein</Tx>
      <rect x={10} y={142} width={300} height={104} rx={10} fill="#fff7ed" stroke={COL.orange} strokeWidth={2.5}/>
      <Tx x={20} y={168} s={16}>Le modèle ondulatoire seul prévoit :</Tx>
      <Tx x={20} y={190} s={15.5} w={600}>• une lumière intense éjecte toujours</Tx><Tx x={20} y={210} s={15.5} w={600}>  des électrons : faux (seuil)</Tx>
      <Tx x={20} y={232} s={15.5} w={600}>• Ec dépend de l’intensité : faux</Tx>
    </SvgCarte>);
}
export function SvgCarteCellule() {
  return (
    <SvgCarte h={286} aria="Cellule photoélectrique : dans une ampoule vide, la lumière éclaire la photocathode qui éjecte des électrons. L’anode, reliée au pôle plus du générateur, les collecte : un courant circule dans le circuit. Avec plus de photons par seconde, le courant est plus grand ; en dessous du seuil de fréquence, il n’y a pas de courant.">
      <rect x={44} y={26} width={232} height={118} rx={34} fill="#f1f5f9" stroke={COL.paroi} strokeWidth={3}/>
      <path d="M 66 46 Q 54 84 66 122" fill="none" stroke={COL.metal} strokeWidth={9} strokeLinecap="round"/>
      <line x1={254} y1={56} x2={254} y2={114} stroke={COL.paroi} strokeWidth={6} strokeLinecap="round"/>
      <Onde x={4} y={52} L={44} cyc={4} c={COL.elec}/>
      <Fleche x1={78} y1={84} x2={236} y2={84} c={COL.elec} w={2.5} tete={9}/>
      <circle cx={158} cy={84} r={9} fill="#dbeafe" stroke={COL.elec} strokeWidth={3}/><line x1={153.5} y1={84} x2={162.5} y2={84} stroke={COL.elec} strokeWidth={2.6}/>
      <Tx x={72} y={20} ancre="middle" s={15.5}>photocathode</Tx><Tx x={254} y={20} ancre="middle" s={15.5}>anode</Tx>
      <polyline points="61,122 61,168 118,168" fill="none" stroke={COL.paroi} strokeWidth={3}/>
      <circle cx={134} cy={168} r={15} fill="#fff" stroke={COL.paroi} strokeWidth={3}/><Tx x={134} y={174} ancre="middle" s={16.5} halo={false}>A</Tx>
      <polyline points="150,168 190,168" fill="none" stroke={COL.paroi} strokeWidth={3}/>
      <line x1={190} y1={162} x2={190} y2={174} stroke={COL.paroi} strokeWidth={3}/><line x1={202} y1={156} x2={202} y2={180} stroke={COL.paroi} strokeWidth={3}/>
      <polyline points="202,168 254,168 254,114" fill="none" stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={180} y={150} ancre="middle" s={15.5} halo={false}>−</Tx><Tx x={212} y={150} ancre="middle" s={15.5} halo={false}>+</Tx>
      <Tx x={16} y={214} s={16}>Lumière (ν &gt; ν₀) : électrons éjectés</Tx><Tx x={16} y={236} s={16}>L’anode (+) les collecte : courant</Tx>
      <Tx x={16} y={258} s={16}>Plus de photons : courant plus grand</Tx><Tx x={16} y={278} s={15.5} w={600} c={COL.gris}>(Pas de courant si ν &lt; ν₀)</Tx>
    </SvgCarte>);
}
