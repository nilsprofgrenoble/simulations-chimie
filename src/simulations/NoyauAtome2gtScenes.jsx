// Scènes de la simulation 202 « Le noyau de l'atome : taille, masse et écriture ZAX » (2GT).
// Schémas SVG : textes de 18 à 22 (viewBox de 480), plafonnés à maxWidth 480 ; cartes dans NoyauAtome2gtFiches.jsx (viewBox de 300).
// Les atomes sont dessinés par le modèle (noyauAtome2gtModele.js) : exactement Z protons, A − Z neutrons et Z électrons ; modèle simplifié, jamais à l'échelle (annoncé sur chaque schéma).
// Les signes + et − des particules sont tracés (pas de texte). Aucune scène ne donne la réponse de l'étape qui l'affiche.
import * as M from "./noyauAtome2gtModele";
import { PART, NUAGE, stl } from "./noyauAtome2gtCouleurs";
import { COL } from "./changementEtat2gtCouleurs";
import { exp } from "./noyauAtome2gtTexte";

const { NB, sciFR, p10 } = M;
export const Tete = ({ x, y, c = COL.gris, dir = 'droite', t = 10 }) => {
  const d = { droite: [[0, 0], [-t, -t * 0.6], [-t, t * 0.6]], gauche: [[0, 0], [t, -t * 0.6], [t, t * 0.6]], haut: [[0, 0], [-t * 0.6, t], [t * 0.6, t]], bas: [[0, 0], [-t * 0.6, -t], [t * 0.6, -t]] }[dir];
  return <polygon points={d.map(([a, b]) => `${x + a},${y + b}`).join(' ')} fill={c} />;
};

// ---------- une particule : disque avec son signe tracé ----------
export function Particule({ x, y, type, r, legende = false }) {
  const c = PART[type], s = r * 0.5;
  return (
    <g {...(legende ? { "data-legende": type } : { "data-particule": type })}>
      <circle cx={x} cy={y} r={r} fill={c.fond} stroke={c.trait} strokeWidth={Math.max(1, r * 0.16)} />
      {type === 'proton' && <path d={`M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`} stroke="white" strokeWidth={Math.max(1.4, r * 0.26)} strokeLinecap="round" />}
      {type === 'electron' && <path d={`M${x - s} ${y}H${x + s}`} stroke="white" strokeWidth={Math.max(1.4, r * 0.26)} strokeLinecap="round" />}
    </g>);
}
// ---------- un atome (noyau + nuage d'électrons) ou un noyau seul, centré en (cx, cy), agrandi de k ----------
export function AtomeSvg({ Z, A, cx, cy, k = 1, nuage = true, electrons = true }) {
  const a = M.atome(Z, A);
  return (
    <g data-atome={`${Z}-${A}`} transform={`translate(${cx} ${cy}) scale(${k})`}>
      {nuage && <circle r={a.rNuage} fill={NUAGE.fond} fillOpacity="0.55" stroke={NUAGE.trait} strokeWidth={2 / k} strokeDasharray={`${6 / k} ${5 / k}`} />}
      {electrons && a.electrons.map((p, i) => <Particule key={`e${i}`} x={p.x} y={p.y} type="electron" r={M.RE} />)}
      {a.noyau.map((p, i) => <Particule key={`n${i}`} x={p.x} y={p.y} type={p.type} r={M.RP} />)}
    </g>);
}
const { rayonNuage, rayonNoyau } = M;

// ---------- légende des particules ----------
export function LegendeParticules({ x, y, pas = 44, types = ['proton', 'neutron', 'electron'], taille = 20, r = 13 }) {
  const noms = { proton: 'proton', neutron: 'neutron', electron: 'électron' };
  return <g>{types.map((t, i) => <g key={t}><Particule x={x + r} y={y + i * pas} type={t} r={r} legende /><text x={x + 2 * r + 10} y={y + i * pas + 7} fontSize={taille} fill={COL.encre}>{noms[t]}</text></g>)}</g>;
}
// ---------- écriture ZAX tracée : A au-dessus de Z, à gauche du symbole ----------
const zaxLargeur = (A, Z, s, t) => t * 0.56 * 0.62 * Math.max(String(A).length, String(Z).length) + 4 + t * 0.62 * s.length;
export function ZaxSvg({ x, y, A, Z, s, t = 40, c = COL.encre, ancre = 'milieu' }) {
  const tn = t * 0.56, wd = tn * 0.62 * Math.max(String(A).length, String(Z).length), total = zaxLargeur(A, Z, s, t), x0 = ancre === 'milieu' ? x - total / 2 : x;
  return (
    <g data-zax={`${A}-${Z}-${s}`}>
      <text x={x0 + wd} y={y - t * 0.42} textAnchor="end" fontSize={tn} fontWeight="700" fill={c}>{A}</text>
      <text x={x0 + wd} y={y + t * 0.05} textAnchor="end" fontSize={tn} fontWeight="700" fill={c}>{Z}</text>
      <text x={x0 + wd + 4} y={y} fontSize={t} fontWeight="800" fill={c}>{s}</text>
    </g>);
}
// ---------- écriture ZAX en MathML (dans le texte) ----------
export const Zax = ({ A, Z, s, grand = false }) => (
  <math style={{ fontSize: grand ? '1.5em' : '1.1em', whiteSpace: 'nowrap' }}><mmultiscripts><mi mathvariant="normal">{s}</mi><mprescripts /><mn>{Z}</mn><mn>{A}</mn></mmultiscripts></math>);

// angle (rad) où l'on peut tracer un trait depuis le centre sans toucher un électron : celui qui s'écarte le plus des électrons, parmi une plage
function angleLibre(electrons, de = -0.5, a = 0.5) {
  let meilleur = 0, dmax = -1;
  for (let t = de; t <= a + 1e-9; t += 0.02) {
    let d = Infinity;
    for (const p of electrons) { let w = Math.abs(Math.atan2(p.y, p.x) - t) % (2 * Math.PI); if (w > Math.PI) w = 2 * Math.PI - w; d = Math.min(d, w * Math.hypot(p.x, p.y)); }
    if (d > dmax) { dmax = d; meilleur = t; }
  }
  return meilleur;
}

// repères « noyau » (trait au départ du noyau, par un chemin libre entre les électrons) et « nuage d'électrons » (trait au bord du nuage, en haut à gauche)
function Reperes({ a, k, cx, cy, taille = 18 }) {
  const R = a.rNuage * k, ang = angleLibre(a.electrons, -0.95, -0.3), rEnd = R + 10, c = Math.cos(ang), sn = Math.sin(ang);
  const an = -1.9, xc = cx + R * Math.cos(an), yc = cy + R * Math.sin(an);
  return (
    <g>
      <line x1={cx + a.rNoyau * k * c} y1={cy + a.rNoyau * k * sn} x2={cx + rEnd * c} y2={cy + rEnd * sn} stroke={COL.encre} strokeWidth="2" />
      <text x={cx + rEnd * c + 6} y={cy + rEnd * sn + 2} fontSize={taille} fontWeight="800" fill={COL.orange}>noyau</text>
      <line x1={xc} y1={yc} x2={xc} y2={26} stroke={COL.encre} strokeWidth="2" />
      <text x={Math.max(10, xc - 70)} y={22} fontSize={taille} fontWeight="800" fill={PART.electron.trait}>nuage d’électrons</text>
    </g>);
}

// ---------- étape 1 : l'échelle des tailles ----------
export function SceneEchelle() {
  const lignes = [
    { y: 46, nom: 'un grain de sable', val: `≈ ${p10(-3)}${NB}m`, icone: <polygon points="30,60 34,38 52,30 68,42 64,58 46,64" fill="#d6b98c" stroke="#8b6b3d" strokeWidth="2.5" strokeLinejoin="round" /> },
    { y: 112, nom: 'une cellule du corps', val: `≈ ${p10(-5)}${NB}m`, icone: <g><circle cx="48" cy="112" r="17" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2.5" /><ellipse cx="48" cy="112" rx="7" ry="4.5" fill="#fee2e2" /></g> },
    { y: 178, nom: 'un virus', val: `≈ ${p10(-7)}${NB}m`, icone: <g><circle cx="48" cy="178" r="8" fill="#86efac" stroke="#15803d" strokeWidth="2.5" />{[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return <g key={i}><line x1={48 + 8 * Math.cos(a)} y1={178 + 8 * Math.sin(a)} x2={48 + 14 * Math.cos(a)} y2={178 + 14 * Math.sin(a)} stroke="#15803d" strokeWidth="2.5" /><circle cx={48 + 15 * Math.cos(a)} cy={178 + 15 * Math.sin(a)} r="2.6" fill="#15803d" /></g>; })}</g> },
    { y: 244, nom: 'un atome', val: '?', icone: <g><circle cx="48" cy="244" r="15" fill="white" stroke={COL.gris} strokeWidth="2.5" strokeDasharray="5 4" /></g>, orange: true },
  ];
  return (
    <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label="Quatre objets rangés du plus grand au plus petit : un grain de sable, environ un millimètre ; une cellule du corps, environ dix micromètres ; un virus, environ cent nanomètres ; un atome, dont la taille est à trouver. Les tailles sont données en puissances de 10 de mètre. Schéma non à l’échelle.">
      {lignes.map((l, i) => <g key={i}>
        {i > 0 && <line x1={48} y1={l.y - 46} x2={48} y2={l.y - 26} stroke={COL.clair} strokeWidth="2.5" strokeDasharray="3 4" />}
        {l.icone}
        <text x={92} y={l.y + 7} fontSize="21" fontWeight="700" fill={COL.encre}>{l.nom}</text>
        <text x={470} y={l.y + 7} textAnchor="end" fontSize="22" fontWeight="800" fill={l.orange ? COL.orange : COL.bleu}>{exp(l.val)}</text></g>)}
      <text x={240} y={306} textAnchor="middle" fontSize="18" fill={COL.gris}>tailles indicatives, schéma non à l’échelle</text>
    </svg>);
}

// ---------- étape 2 : un atome et son noyau, avec leurs tailles ----------
export function SceneAtomeNoyau() {
  const Z = 2, a = M.atome(Z, 4), k = 1.3, cx = 150, cy = 150, R = a.rNuage * k;
  const ang = angleLibre(a.electrons, 0.05, 0.6), rEnd = R + 12, xn = cx + rEnd * Math.cos(ang), yn = cy + rEnd * Math.sin(ang);
  const ya = cy - R * 0.72, xa = cx + Math.sqrt(R * R - (ya - cy) ** 2);
  return (
    <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label="Schéma d’un atome d’hélium : un noyau au centre, entouré d’un nuage d’électrons. Légendes : taille de l’atome environ 10 puissance moins 10 mètre ; taille du noyau environ 10 puissance moins 15 mètre. Le noyau est dessiné bien trop grand.">
      <AtomeSvg Z={Z} A={4} cx={cx} cy={cy} k={k} />
      <line x1={xa} y1={ya} x2={xa + 30} y2={ya - 18} stroke={COL.encre} strokeWidth="2" />
      <text x={xa + 36} y={ya - 12} fontSize="21" fontWeight="800" fill={COL.bleu}>{exp(`atome ≈ ${p10(-10)}${NB}m`)}</text>
      <line x1={cx + a.rNoyau * k * Math.cos(ang)} y1={cy + a.rNoyau * k * Math.sin(ang)} x2={xn} y2={yn} stroke={COL.encre} strokeWidth="2" />
      <text x={xn + 6} y={yn + 7} fontSize="21" fontWeight="800" fill={COL.orange}>{exp(`noyau ≈ ${p10(-15)}${NB}m`)}</text>
      <text x={240} y={310} textAnchor="middle" fontSize="18" fill={COL.gris}>non à l’échelle : le noyau est très agrandi</text>
    </svg>);
}

// ---------- étape 3 : le noyau devient une bille ; quelle taille pour l'atome ? ----------
export function SceneBille() {
  const cx = 150, cy = 132, R = 100;
  return (
    <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label="Schéma d’un atome : un grand cercle en pointillés, avec en son centre une petite bille qui représente le noyau, de 1 centimètre. Une double flèche sous le cercle indique le diamètre de l’atome, à trouver. Schéma non à l’échelle.">
      <circle cx={cx} cy={cy} r={R} fill={NUAGE.fond} fillOpacity="0.55" stroke={NUAGE.trait} strokeWidth="2.5" strokeDasharray="7 6" />
      <circle cx={cx} cy={cy} r={9} fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
      <line x1={cx + 11} y1={cy} x2={296} y2={cy} stroke={COL.encre} strokeWidth="2" />
      <text x={302} y={cy - 6} fontSize="21" fontWeight="800" fill={COL.orange}>noyau :</text><text x={302} y={cy + 20} fontSize="21" fontWeight="800" fill={COL.orange}>une bille de 1{NB}cm</text>
      <line x1={cx - R} y1={262} x2={cx + R} y2={262} stroke={COL.bleu} strokeWidth="2.5" /><Tete x={cx + R} y={262} c={COL.bleu} /><Tete x={cx - R} y={262} c={COL.bleu} dir="gauche" />
      <line x1={cx - R} y1={252} x2={cx - R} y2={272} stroke={COL.bleu} strokeWidth="2.5" /><line x1={cx + R} y1={252} x2={cx + R} y2={272} stroke={COL.bleu} strokeWidth="2.5" />
      <text x={cx} y={296} textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.bleu}>diamètre de l’atome : ?</text>
      <text x={470} y={34} textAnchor="end" fontSize="18" fill={COL.gris}>schéma non à l’échelle</text>
    </svg>);
}

// ---------- étape 4 : les masses des trois particules ----------
export function SceneMasses() {
  const col = [{ x: 80, t: 'proton', r: 30, m: M.M_NUCLEON }, { x: 240, t: 'neutron', r: 30, m: M.M_NUCLEON }, { x: 400, t: 'electron', r: 12, m: M.M_ELECTRON }];
  return (
    <svg viewBox="0 0 480 250" style={stl()} role="img" aria-label="Trois particules et leurs masses : le proton, 1,67 fois 10 puissance moins 27 kilogramme ; le neutron, 1,67 fois 10 puissance moins 27 kilogramme ; l’électron, 9,11 fois 10 puissance moins 31 kilogramme. Dessins non à l’échelle.">
      {col.map(c => <g key={c.t}>
        <Particule x={c.x} y={64} type={c.t} r={c.r} />
        <text x={c.x} y={134} textAnchor="middle" fontSize="23" fontWeight="800" fill={COL.encre}>{c.t === 'electron' ? 'électron' : c.t}</text>
        <text x={c.x} y={168} textAnchor="middle" fontSize="19" fontWeight="700" fill={COL.bleu}>{exp(sciFR(c.m))}</text>
        <text x={c.x} y={192} textAnchor="middle" fontSize="19" fontWeight="700" fill={COL.bleu}>kg</text></g>)}
      <text x={240} y={234} textAnchor="middle" fontSize="18" fill={COL.gris}>dessins non à l’échelle</text>
    </svg>);
}

// ---------- étape 5 : la masse de l'atome de carbone et celle de ses électrons ----------
export function SceneMasseAtome() {
  const R = 84, k = R / rayonNuage(6), cx = 98, cy = 162, a = M.atome(6, 12);
  const boite = (y, titre, valeur, c) => <g><rect x={252} y={y} width={220} height={72} rx="12" fill="white" stroke={c} strokeWidth="2.5" />
    <text x={362} y={y + 29} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>{titre}</text><text x={362} y={y + 57} textAnchor="middle" fontSize="19" fontWeight="700" fill={c}>{exp(`${valeur}${NB}kg`)}</text></g>;
  return (
    <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label="Schéma d’un atome de carbone avec son noyau et son nuage d’électrons. À droite, trois masses : celle de l’atome entier, 1,99 fois 10 puissance moins 26 kilogramme ; celle de son noyau de 12 nucléons, 2,00 fois 10 puissance moins 26 kilogramme ; celle de ses six électrons, 5,47 fois 10 puissance moins 30 kilogramme. Schéma non à l’échelle.">
      <AtomeSvg Z={6} A={12} cx={cx} cy={cy} k={k} />
      <Reperes a={a} k={k} cx={cx} cy={cy} />
      {boite(40, 'l’atome entier', sciFR(M.M_ATOME_C12, 3), COL.gris)}{boite(122, 'son noyau (A = 12)', sciFR(M.masseNoyau(12), 3), COL.orange)}{boite(204, 'ses 6 électrons', sciFR(M.masseElectrons(6), 3), PART.electron.trait)}
      <text x={240} y={310} textAnchor="middle" fontSize="18" fill={COL.gris}>modèle simplifié, non à l’échelle</text>
    </svg>);
}

// ---------- étape 6 : les charges ----------
export function SceneCharges() {
  const col = [{ x: 80, t: 'proton', q: 'charge +e' }, { x: 240, t: 'neutron', q: 'charge nulle' }, { x: 400, t: 'electron', q: 'charge −e' }];
  return (
    <svg viewBox="0 0 480 250" style={stl()} role="img" aria-label="Trois particules et leurs charges électriques : le proton porte la charge plus e, le neutron n’a pas de charge, l’électron porte la charge moins e. La charge élémentaire e vaut 1,60 fois 10 puissance moins 19 coulomb.">
      {col.map(c => <g key={c.t}>
        <Particule x={c.x} y={56} type={c.t} r={28} />
        <text x={c.x} y={122} textAnchor="middle" fontSize="23" fontWeight="800" fill={COL.encre}>{c.t === 'electron' ? 'électron' : c.t}</text>
        <text x={c.x} y={154} textAnchor="middle" fontSize="21" fontWeight="700" fill={c.t === 'proton' ? PART.proton.trait : c.t === 'electron' ? PART.electron.trait : COL.gris}>{c.q}</text></g>)}
      <rect x={60} y={176} width={360} height={46} rx="12" fill="#fffbeb" stroke={COL.orange} strokeWidth="2" />
      <text x={240} y={207} textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.orange}>{exp(`e = ${sciFR(M.E_CHARGE, 3)}${NB}C`)}</text>
      <text x={240} y={242} textAnchor="middle" fontSize="18" fill={COL.gris}>dessins non à l’échelle</text>
    </svg>);
}

// ---------- étape 7 : un atome d'oxygène (exemple) avec la légende ----------
export function SceneAtomeNeutre() {
  const R = 116, k = R / rayonNuage(8), cx = 140, cy = 160, a = M.atome(8, 16);
  return (
    <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label="Schéma d’un atome d’oxygène : un noyau de protons rouges et de neutrons gris au centre, entouré d’un nuage d’électrons bleus. Modèle simplifié, non à l’échelle.">
      <AtomeSvg Z={8} A={16} cx={cx} cy={cy} k={k} />
      <Reperes a={a} k={k} cx={cx} cy={cy} />
      <LegendeParticules x={296} y={168} pas={42} />
      <text x={470} y={296} textAnchor="end" fontSize="18" fill={COL.gris}>modèle simplifié, non à l’échelle</text>
    </svg>);
}

// ---------- étapes 9 et 10 : un noyau seul, grossi, avec la légende ----------
export function SceneNoyau({ Z, nom }) {
  const e = M.element(Z), R = 108, k = Math.min(3.2, R / rayonNoyau(Z)), cx = 150, cy = 140;
  return (
    <svg viewBox="0 0 480 290" style={stl()} role="img" aria-label={`Schéma du noyau d’un atome ${nom || e.deNom}, très grossi : des protons rouges et des neutrons gris serrés ensemble. Les électrons ne sont pas dessinés.`}>
      <AtomeSvg Z={Z} A={e.A} cx={cx} cy={cy} k={k} nuage={false} electrons={false} />
      <LegendeParticules x={312} y={90} types={['proton', 'neutron']} />
      <text x={470} y={250} textAnchor="end" fontSize="18" fill={COL.gris}>noyau très grossi,</text><text x={470} y={275} textAnchor="end" fontSize="18" fill={COL.gris}>non à l’échelle</text>
    </svg>);
}

// ---------- étape 11 : lire l'écriture ZAX (exemple du fluor) ----------
export function SceneLireZax() {
  const e = M.element(9);
  return (
    <svg viewBox="0 0 480 260" style={stl()} role="img" aria-label="L’écriture du noyau de fluor : le nombre de nucléons A est écrit en haut à gauche du symbole, le numéro atomique Z en bas à gauche, puis le symbole de l’élément.">
      <ZaxSvg x={376} y={146} A={e.A} Z={e.Z} s={e.s} t={96} c={COL.encre} />
      <text x={262} y={88} textAnchor="end" fontSize="21" fontWeight="800" fill={COL.orange}>A : nucléons</text><line x1={270} y1={80} x2={296} y2={80} stroke={COL.orange} strokeWidth="2.5" /><Tete x={300} y={80} c={COL.orange} />
      <text x={262} y={162} textAnchor="end" fontSize="21" fontWeight="800" fill={COL.rouge}>Z : protons</text><line x1={270} y1={154} x2={296} y2={154} stroke={COL.rouge} strokeWidth="2.5" /><Tete x={300} y={154} c={COL.rouge} />
      <line x1={410} y1={206} x2={410} y2={168} stroke={COL.bleu} strokeWidth="2.5" /><Tete x={410} y={164} c={COL.bleu} dir="haut" />
      <text x={410} y={236} textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.bleu}>symbole</text>
      <text x={14} y={236} fontSize="18" fill={COL.gris}>A est écrit au-dessus de Z</text>
    </svg>);
}

// ---------- étape 12 : bilan, l'atome de sodium ----------
export function SceneBilan() {
  const e = M.element(11), R = 112, k = R / rayonNuage(11), cx = 126, cy = 160, a = M.atome(11, e.A);
  const ligne = (y, t, n, mot) => <g><Particule x={296} y={y} type={t} r={12} /><text x={318} y={y + 7} fontSize="21" fill={COL.encre}><tspan fontWeight="800">{n}</tspan> {mot}</text></g>;
  return (
    <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label="Schéma d’un atome de sodium, noyau et nuage d’électrons. À droite, son écriture conventionnelle et sa composition : 11 protons, 12 neutrons, 11 électrons. Modèle simplifié, non à l’échelle.">
      <AtomeSvg Z={11} A={e.A} cx={cx} cy={cy} k={k} />
      <Reperes a={a} k={k} cx={cx} cy={cy} />
      <ZaxSvg x={376} y={96} A={e.A} Z={e.Z} s={e.s} t={60} />
      {ligne(148, 'proton', e.Z, 'protons')}{ligne(190, 'neutron', e.N, 'neutrons')}{ligne(232, 'electron', e.Z, 'électrons')}
      <text x={470} y={300} textAnchor="end" fontSize="18" fill={COL.gris}>modèle simplifié, non à l’échelle</text>
    </svg>);
}

// ---------- exploration : atome entier ou zoom sur le noyau ----------
export function SceneExplore({ Z, vue }) {
  const e = M.element(Z), a = M.atome(Z, e.A);
  if (vue === 'zoom') {
    const k = Math.min(3, 86 / a.rNoyau), cx = 150, cy = 118, R = a.rNoyau * k;
    return (
      <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label={`Vue du noyau seul de l’atome ${e.deNom}, très agrandi : ${e.Z} protons rouges et ${e.N} neutrons gris, taille environ 10 puissance moins 15 mètre. À ce même agrandissement, l’atome entier serait 100\u00a0000 fois plus large que le noyau.`}>
        <AtomeSvg Z={Z} A={e.A} cx={cx} cy={cy} k={k} nuage={false} electrons={false} />
        <line x1={cx - R} y1={218} x2={cx + R} y2={218} stroke={COL.orange} strokeWidth="2.5" /><line x1={cx - R} y1={208} x2={cx - R} y2={228} stroke={COL.orange} strokeWidth="2.5" /><line x1={cx + R} y1={208} x2={cx + R} y2={228} stroke={COL.orange} strokeWidth="2.5" />
        <text x={cx} y={254} textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.orange}>{exp(`noyau ≈ ${p10(-15)}${NB}m`)}</text>
        <LegendeParticules x={312} y={80} types={['proton', 'neutron']} />
        <text x={240} y={288} textAnchor="middle" fontSize="18" fill={COL.gris}>même agrandissement pour tout : l’atome serait</text>
        <text x={240} y={311} textAnchor="middle" fontSize="18" fill={COL.gris}>{`100${NB}000 fois plus large que ce noyau`}</text>
      </svg>);
  }
  const R = 112, k = Math.min(1.9, R / a.rNuage), cx = 160, cy = 150, Ra = a.rNuage * k;
  return (
    <svg viewBox="0 0 480 322" style={stl()} role="img" aria-label={`Schéma de l’atome ${e.deNom} : ${e.Z} protons et ${e.N} neutrons dans le noyau, ${e.Z} électrons dans le nuage. Taille de l’atome : environ 10 puissance moins 10 mètre. Le noyau est dessiné bien trop grand.`}>
      <AtomeSvg Z={Z} A={e.A} cx={cx} cy={cy} k={k} />
      <Reperes a={a} k={k} cx={cx} cy={cy} />
      <line x1={cx - Ra} y1={cy + Ra + 14} x2={cx + Ra} y2={cy + Ra + 14} stroke={COL.bleu} strokeWidth="2.5" /><line x1={cx - Ra} y1={cy + Ra + 6} x2={cx - Ra} y2={cy + Ra + 22} stroke={COL.bleu} strokeWidth="2.5" /><line x1={cx + Ra} y1={cy + Ra + 6} x2={cx + Ra} y2={cy + Ra + 22} stroke={COL.bleu} strokeWidth="2.5" />
      <text x={cx} y={cy + Ra + 42} textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.bleu}>{exp(`atome ≈ ${p10(-10)}${NB}m`)}</text>
      <LegendeParticules x={352} y={110} pas={40} />
      <text x={470} y={236} textAnchor="end" fontSize="18" fill={COL.gris}>noyau très agrandi,</text><text x={470} y={261} textAnchor="end" fontSize="18" fill={COL.gris}>non à l’échelle</text>
    </svg>);
}

// ---------- défi : un noyau seul (sans électrons) ou la grande écriture ZAX ----------
export function SceneDefiNoyau({ Z }) {
  const e = M.element(Z), R = 96, k = Math.min(3, R / rayonNoyau(Z)), cx = 150, cy = 122;
  return (
    <svg viewBox="0 0 480 260" style={stl()} role="img" aria-label="Schéma d’un noyau, très grossi : des protons rouges et des neutrons gris serrés ensemble.">
      <AtomeSvg Z={Z} A={e.A} cx={cx} cy={cy} k={k} nuage={false} electrons={false} />
      <LegendeParticules x={312} y={72} types={['proton', 'neutron']} />
      <text x={470} y={226} textAnchor="end" fontSize="18" fill={COL.gris}>noyau très grossi,</text><text x={470} y={251} textAnchor="end" fontSize="18" fill={COL.gris}>non à l’échelle</text>
    </svg>);
}
export function SceneDefiZax({ Z }) {
  const e = M.element(Z);
  return (
    <svg viewBox="0 0 480 200" style={stl()} role="img" aria-label="L’écriture conventionnelle d’un noyau, en grand : nombre de nucléons en haut à gauche, numéro atomique en bas à gauche, symbole de l’élément.">
      <ZaxSvg x={240} y={124} A={e.A} Z={e.Z} s={e.s} t={110} />
    </svg>);
}

// ---------- mini-tableau : les 18 premiers éléments, rangés par numéro atomique Z croissant (3 lignes de 6) ----------
export function MiniTableau({ surligne = [] }) {
  return (
    <div role="group" aria-label="Les 18 premiers éléments chimiques, rangés par numéro atomique Z croissant, avec leur symbole et leur nom" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
      {M.ELEMENTS.map(e => {
        const on = surligne.includes(e.Z);
        return (
          <div key={e.Z} style={{ textAlign: 'center', border: `${on ? 2.5 : 1.5}px solid ${on ? COL.orange : '#cbd5e1'}`, background: on ? '#fffbeb' : 'white', borderRadius: 8, padding: '3px 1px 4px', minWidth: 0 }}>
            <div style={{ fontSize: 12, color: COL.gris, lineHeight: 1.2 }}>{e.Z}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COL.encre, lineHeight: 1.15 }}>{e.s}</div>
            <div className="noy-nomel" style={{ fontSize: 11, color: COL.gris, lineHeight: 1.2 }}>{e.nom}</div>
          </div>);
      })}
    </div>);
}
