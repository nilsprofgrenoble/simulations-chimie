import { useState, useEffect, useMemo } from "react";
import { cardStyle, fmt, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE } from "../commun";

// ====================================================
// PARAMÈTRES DE HANSEN : LA NITROCELLULOSE D'UN VERNIS À ONGLE (BTS Métiers de la chimie)
// Sphère de solubilité, distance Ra et RED ; mélanges de solvants (moyenne pondérée par les volumes) ;
// séchage : la composition du mélange change, et sa trajectoire peut sortir de la sphère (blanchiment).
// ====================================================

// Solvants : δd, δp, δh (MPa½), pression de vapeur saturante à 20 °C (Pa), volume molaire (cm³/mol)
export const SOLVANTS = {
  ea: { nom: 'acétate d’éthyle', court: 'AE', d: 15.8, p: 5.3, h: 7.2, psat: 10000, vm: 98.5, famille: 'ester', color: '#2563eb' },
  ba: { nom: 'acétate de butyle', court: 'AB', d: 15.8, p: 3.7, h: 6.3, psat: 1070, vm: 132.5, famille: 'ester', color: '#7c3aed' },
  etoh: { nom: 'éthanol', court: 'EtOH', d: 15.8, p: 8.8, h: 19.4, psat: 5800, vm: 58.5, famille: 'alcool', color: '#dc2626' },
  ipa: { nom: 'isopropanol', court: 'IPA', d: 15.8, p: 6.1, h: 16.4, psat: 4400, vm: 76.8, famille: 'alcool', color: '#ea580c' },
};
// Deux jeux de paramètres pour la nitrocellulose : ils dépendent de la source et du grade (teneur en azote)
export const POLYMERES = {
  tp: { nom: 'données du TP', d: 17, p: 8.7, h: 9.3, R0: 9.0, source: 'Données fournies avec l’activité (source d’origine à préciser).' },
  hansen: { nom: 'moyenne citée par Hansen', d: 16.2, p: 14.1, h: 9.5, R0: 10.7, source: 'Moyenne de valeurs citées dans C. M. Hansen, Hansen Solubility Parameters: A User’s Handbook (2e éd., CRC Press, 2007).' },
};

export const ra = (P, s) => Math.sqrt(4 * (s.d - P.d) ** 2 + (s.p - P.p) ** 2 + (s.h - P.h) ** 2);
// Paramètres d'un mélange : moyenne pondérée par les fractions volumiques (hypothèse)
export function melange(vol) {
  const tot = Object.values(vol).reduce((a, b) => a + b, 0) || 1;
  const m = { d: 0, p: 0, h: 0 };
  Object.entries(vol).forEach(([k, v]) => { const s = SOLVANTS[k]; m.d += v / tot * s.d; m.p += v / tot * s.p; m.h += v / tot * s.h; });
  return m;
}
// Séchage : évaporation idéale (loi de Raoult), vitesse molaire de chaque solvant ∝ x_i × Psat_i (hypothèse).
// On suit la composition du solvant restant ; le film est considéré comme figé quand il reste moins de 15 % du solvant.
export function secher(vol, P) {
  const n = {}; Object.entries(vol).forEach(([k, v]) => { if (v > 0) n[k] = v / SOLVANTS[k].vm; });
  const V0 = Object.entries(n).reduce((s, [k, x]) => s + x * SOLVANTS[k].vm, 0);
  const traj = []; let t = 0, dt = 0.0005, redMax = 0, tFige = null, tSec = null, rFige = null;
  for (let it = 0; it < 200000; it++) {
    const N = Object.values(n).reduce((a, b) => a + b, 0), V = Object.entries(n).reduce((s, [k, x]) => s + x * SOLVANTS[k].vm, 0);
    const reste = V / V0;
    const volAct = Object.fromEntries(Object.entries(n).map(([k, x]) => [k, x * SOLVANTS[k].vm]));
    const m = melange(volAct), r = ra(P, m) / P.R0;
    if (it % 20 === 0) traj.push({ t, reste, ...m, red: r });
    if (reste >= 0.15) redMax = Math.max(redMax, r); else if (tFige == null) { tFige = t; rFige = r; }
    if (reste < 0.05) { tSec = t; break; }
    Object.keys(n).forEach(k => { n[k] = Math.max(0, n[k] - dt * (n[k] / N) * SOLVANTS[k].psat / 1000); });
    t += dt;
  }
  return { traj, redMax, tFige, tSec, rFige };
}
const T_REF = secher({ ba: 100 }, POLYMERES.tp).tSec;    // temps de séchage de l'acétate de butyle pur = 100

// ════════════════ GRAPHIQUES ════════════════
// Coupe de la sphère dans le plan δp–δh, au δd des solvants (tous à 15,8) : cercle de rayon √(R0² − 4 Δδd²)
function Carte({ P, points, mel, traj, progres }) {
  const W = 520, H = 400, g = 50, d = 14, t = 14, b = 40, pMax = 22, hMax = 24;
  const X = v => g + v / pMax * (W - g - d), Y = v => H - b - v / hMax * (H - b - t);
  const dd = 15.8 - P.d, rCoupe = Math.sqrt(Math.max(0, P.R0 ** 2 - 4 * dd * dd));
  const kx = (W - g - d) / pMax, ky = (H - b - t) / hMax;
  const visible = traj ? traj.slice(0, Math.max(1, Math.round(traj.length * progres))) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Carte de Hansen δp–δh" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {[0, 5, 10, 15, 20].map(v => <g key={`p${v}`}><line x1={X(v)} y1={t} x2={X(v)} y2={H - b} stroke="#eef2f7"/><text x={X(v)} y={H - b + 15} fontSize="12" fill={KIT.txt2} textAnchor="middle">{v}</text></g>)}
      {[0, 5, 10, 15, 20].map(v => <g key={`h${v}`}><line x1={g} y1={Y(v)} x2={W - d} y2={Y(v)} stroke="#eef2f7"/><text x={g - 5} y={Y(v) + 4} fontSize="12" fill={KIT.txt2} textAnchor="end">{v}</text></g>)}
      <ellipse cx={X(P.p)} cy={Y(P.h)} rx={rCoupe * kx} ry={rCoupe * ky} fill="#dcfce7" stroke="#16a34a" strokeWidth="2"/>
      <circle cx={X(P.p)} cy={Y(P.h)} r="5" fill="#15803d"/><text x={X(P.p) + 7} y={Y(P.h) - 7} fontSize="12.5" fontWeight="700" fill="#15803d">nitrocellulose</text>
      {points.map(s => <g key={s.k}><circle cx={X(s.p)} cy={Y(s.h)} r="6" fill={s.color} stroke={KIT.txt}/>
        <text x={X(s.p) + 8} y={Y(s.h) + 4} fontSize="12.5" fontWeight="700" fill={s.color}>{s.court}</text></g>)}
      {visible && visible.length > 1 && <polyline points={visible.map(q => `${X(q.p).toFixed(1)},${Y(q.h).toFixed(1)}`).join(' ')} fill="none" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 3"/>}
      {visible && visible.length > 0 && (() => { const q = visible[visible.length - 1]; return <circle cx={X(q.p)} cy={Y(q.h)} r="6" fill={q.red > 1 ? '#dc2626' : '#fde047'} stroke={KIT.txt} strokeWidth="2"/>; })()}
      {mel && !visible && <g><rect x={X(mel.p) - 6} y={Y(mel.h) - 6} width="12" height="12" fill="#fde047" stroke={KIT.txt} strokeWidth="2" transform={`rotate(45 ${X(mel.p)} ${Y(mel.h)})`}/>
        <text x={X(mel.p) + 9} y={Y(mel.h) + 16} fontSize="12" fontWeight="700" fill={KIT.txt}>mélange</text></g>}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={t} x2={g} y2={H - b} stroke={KIT.txt}/>
      <text x={(g + W - d) / 2} y={H - 8} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">δp (MPa½)</text>
      <text x="14" y={(t + H - b) / 2} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 14 ${(t + H - b) / 2})`}>δh (MPa½)</text>
    </svg>
  );
}
// La sphère en 3D (axes 2δd, δp, δh, pour qu'elle soit une vraie sphère), vue sous un angle réglable
function Sphere3D({ P, points, mel, angle }) {
  const W = 520, H = 380, cx = 260, cy = 210, k = 9;
  const a = angle * Math.PI / 180, el = 0.45;
  const proj = (x, y, z) => { const X1 = x * Math.cos(a) - y * Math.sin(a), Y1 = x * Math.sin(a) + y * Math.cos(a);
    return [cx + k * X1, cy - k * (z * Math.cos(el) - Y1 * Math.sin(el))]; };
  const c = [2 * P.d, P.p, P.h], o = [2 * 12, 0, 0];
  const P3 = s => proj(2 * s.d - o[0], s.p, s.h);
  const [pcx, pcy] = proj(c[0] - o[0], c[1], c[2]);
  const axes = [[[0, 0, 0], [26, 0, 0], '2δd (à partir de 24)'], [[0, 0, 0], [0, 22, 0], 'δp'], [[0, 0, 0], [0, 0, 24], 'δh']];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sphère de Hansen en trois dimensions" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {axes.map(([p0, p1, n], i) => { const [x0, y0] = proj(...p0), [x1, y1] = proj(...p1); return <g key={i}><line x1={x0} y1={y0} x2={x1} y2={y1} stroke={KIT.txt2} strokeWidth="1.5"/><text x={x1 + 4} y={y1} fontSize="12" fill={KIT.txt2}>{n}</text></g>; })}
      <circle cx={pcx} cy={pcy} r={P.R0 * k} fill="#16a34a" opacity="0.12" stroke="#16a34a" strokeWidth="2"/>
      <circle cx={pcx} cy={pcy} r="5" fill="#15803d"/>
      {points.map(s => { const [x, y] = P3(s); const dans = ra(P, s) < P.R0; return <g key={s.k}><circle cx={x} cy={y} r="6" fill={s.color} stroke={KIT.txt} opacity={dans ? 1 : 0.85}/>
        <text x={x + 8} y={y + 4} fontSize="12.5" fontWeight="700" fill={s.color}>{s.court}</text></g>; })}
      {mel && (() => { const [x, y] = P3(mel); return <rect x={x - 6} y={y - 6} width="12" height="12" fill="#fde047" stroke={KIT.txt} strokeWidth="2" transform={`rotate(45 ${x} ${y})`}/>; })()}
      <text x="10" y="18" fontSize="12" fill={KIT.txt2}>Vue projetée : un point peut paraître dans le disque sans être dans la sphère. Fiez-vous à RED.</text>
    </svg>
  );
}
function CourbeRed({ traj, progres }) {
  if (!traj || traj.length < 2) return null;
  const W = 520, H = 190, g = 46, d = 14, t = 12, b = 36, rMax = Math.max(1.3, ...traj.map(q => q.red)) * 1.05;
  const X = reste => g + (1 - reste) * (W - g - d), Y = r => H - b - r / rMax * (H - b - t);
  const vis = traj.slice(0, Math.max(1, Math.round(traj.length * progres)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="RED pendant le séchage" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      <rect x={X(0.15)} y={t} width={X(0) - X(0.15)} height={H - b - t} fill="#f1f5f9"/>
      <text x={(X(0.15) + X(0)) / 2} y={t + 14} fontSize="11" fill={KIT.txt2} textAnchor="middle">film figé</text>
      <line x1={g} y1={Y(1)} x2={W - d} y2={Y(1)} stroke="#dc2626" strokeDasharray="6 4"/><text x={W - d - 2} y={Y(1) - 4} fontSize="11.5" fill="#dc2626" textAnchor="end">RED = 1</text>
      <polyline points={vis.map(q => `${X(q.reste).toFixed(1)},${Y(q.red).toFixed(1)}`).join(' ')} fill="none" stroke="#0f172a" strokeWidth="2.5"/>
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={t} x2={g} y2={H - b} stroke={KIT.txt}/>
      {[0, 0.25, 0.5, 0.75, 1].map(f => <text key={f} x={X(1 - f)} y={H - b + 15} fontSize="11.5" fill={KIT.txt2} textAnchor="middle">{fmt(f * 100, 0)} %</text>)}
      {[0, 0.5, 1].map(r => <text key={r} x={g - 5} y={Y(r) + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">{fmt(r, 1)}</text>)}
      <text x={(g + W - d) / 2} y={H - 4} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">part du solvant évaporée</text>
      <text x="12" y={(t + H - b) / 2} fontSize="12" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 12 ${(t + H - b) / 2})`}>RED</text>
    </svg>
  );
}
function Hypotheses() {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Une sphère</strong> : on suppose que le domaine de solubilité est une sphère (avec le facteur empirique 4 devant Δδd). Le domaine réel est rarement aussi
        régulier : près de la frontière (RED entre 0,8 et 1,2 environ), la prévision est incertaine.</li>
      <li><strong>Les paramètres de la nitrocellulose dépendent de la source et du grade</strong> (teneur en azote) : deux jeux de valeurs sont proposés, et ils ne donnent pas
        les mêmes prévisions.</li>
      <li><strong>Mélanges</strong> : les paramètres d'un mélange sont la moyenne de ceux des solvants, pondérée par leurs fractions <em>volumiques</em>.</li>
      <li><strong>Séchage</strong> : évaporation idéale (loi de Raoult), chaque solvant s'évaporant à une vitesse proportionnelle à sa fraction molaire et à sa pression de
        vapeur. On néglige les écarts à l'idéalité (les mélanges ester-alcool en présentent), l'effet du polymère dissous, la température, la ventilation et l'humidité
        (l'évaporation refroidit le film, et l'eau de l'air peut s'y condenser : c'est une autre cause fréquente de blanchiment).</li>
      <li><strong>Figeage</strong> : on considère que le film est figé quand il reste moins de 15 % du solvant ; seul ce qui se passe avant compte pour le blanchiment.</li>
    </ul>
  );
}

// ════════════════ SIMULATION ════════════════
export function Simulation4() {
  const [mode, setMode] = useState('guide');
  const [parc, setParc] = useEtatPersistant('hansen-parcours-choix', 1);
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [g1, setG1] = useEtatPersistant('hansen-guide-p1', VIDE), [g2, setG2] = useEtatPersistant('hansen-guide-p2', VIDE), [g3, setG3] = useEtatPersistant('hansen-guide-p3', VIDE);
  const guide = parc === 1 ? g1 : parc === 2 ? g2 : g3, setGuide = parc === 1 ? setG1 : parc === 2 ? setG2 : setG3;
  const [polyId, setPolyId] = useState('tp');
  const [vol, setVol] = useState({ ea: 50, ba: 0, etoh: 50, ipa: 0 });
  const [testes, setTestes] = useState({});
  const [vue, setVue] = useState('carte');
  const [angle, setAngle] = useState(35);
  const [progres, setProgres] = useState(1), [anime, setAnime] = useState(false), [seche, setSeche] = useState(null);
  const [vuHansen, setVuHansen] = useState(false);
  const [ouverts, setOuverts] = useState({ mel: true, hypo: true, sech: true });
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;
  const P = POLYMERES[polyId];
  const tot = Object.values(vol).reduce((a, b) => a + b, 0);
  const mel = melange(vol), redMel = ra(P, mel) / P.R0;
  const sech = useMemo(() => (seche ? secher(seche.vol, P) : null), [seche, P]);

  useEffect(() => {
    if (!anime) return;
    const t0 = performance.now(); let id;
    const pas = now => { const x = Math.min(1, (now - t0) / 4000); setProgres(x); if (x < 1) id = requestAnimationFrame(pas); else setAnime(false); };
    id = requestAnimationFrame(pas); return () => cancelAnimationFrame(id);
  }, [anime]);
  function lancerSechage() { if (tot <= 0) return; setSeche({ vol: { ...vol } }); setProgres(0); setAnime(true); }
  useEffect(() => { setSeche(null); }, [vol, polyId]);

  // ── Valeurs du parcours (données du TP) ──
  const PT = POLYMERES.tp;
  const raEA = ra(PT, SOLVANTS.ea), redOf = (k, Q = PT) => ra(Q, SOLVANTS[k]) / Q.R0;
  const m5050 = melange({ ea: 50, etoh: 50 });
  // fraction d'éthanol maximale dans l'acétate d'éthyle, pour RED = 1 (résolution numérique)
  const fMax = (() => { let lo = 0, hi = 1; for (let i = 0; i < 60; i++) { const f = (lo + hi) / 2; if (ra(PT, melange({ ea: 1 - f, etoh: f })) / PT.R0 < 1) lo = f; else hi = f; } return lo; })();
  const sechEco = secher({ ea: 30, etoh: 70 }, PT);

  // ════════════════ LES TROIS PARCOURS ════════════════
  const TOUTES = [
    // ── 1. La sphère de solubilité ──
    { id: 'contexte', titre: 'Le vernis à ongle', focus: [],
      texte: <>Un vernis à ongle contient un polymère filmogène, la <strong>nitrocellulose</strong>, avec une résine et un plastifiant, dissous dans un mélange de solvants.
        Une fois appliqué, les solvants s'évaporent et laissent un film brillant. Première question : quels solvants dissolvent la nitrocellulose ? Les paramètres de
        Hansen permettent de le prévoir.</>, tache: null },
    { id: 'parametres', titre: 'Trois paramètres', focus: [],
      texte: <>Chaque molécule est décrite par trois paramètres de solubilité (en MPa½) : δd (forces de dispersion), δp (interactions entre dipôles), δh (liaisons hydrogène).
        Ce sont les coordonnées d'un point dans l'« espace de Hansen ». Deux substances se mélangent bien si leurs points sont proches.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’éthanol a-t-il un δh élevé (19,4) ?', options: ['Son groupe –OH forme des liaisons hydrogène', 'Il est très polaire', 'Il est très volatil'], bonne: 0 } },
    { id: 'ra', titre: 'La distance de Hansen', focus: ['vue'],
      texte: <>La distance entre un solvant (s) et le polymère (P) vaut Ra = √[4(δd,s − δd,P)² + (δp,s − δp,P)² + (δh,s − δh,P)²]. La nitrocellulose : δd = 17 ; δp = 8,7 ;
        δh = 9,3. L'acétate d'éthyle : 15,8 ; 5,3 ; 7,2.</>,
      tache: { type: 'num', q: 'Distance Ra entre l’acétate d’éthyle et la nitrocellulose', unite: 'MPa½', vrai: raEA, tol: 0.02, affiche: x => fmt(x, 2),
        pieges: [[Math.sqrt((15.8 - 17) ** 2 + 3.4 ** 2 + 2.1 ** 2), 'N’oubliez pas le facteur 4 devant le terme en δd.']] } },
    { id: 'facteur4', titre: 'Pourquoi ce facteur 4 ?', focus: [],
      texte: <>Le facteur 4 devant le terme de dispersion n'est pas démontré : Hansen l'a choisi parce qu'avec lui, les domaines de solubilité mesurés deviennent à peu près
        sphériques. C'est pour cela que la vue 3D utilise l'axe 2δd.</>,
      tache: { type: 'qcm', q: 'Le facteur 4 est…', options: ['un choix empirique, qui rend les domaines de solubilité à peu près sphériques', 'une constante physique fondamentale', 'une erreur de la formule'], bonne: 0 } },
    { id: 'red', titre: 'La sphère et le RED', focus: ['vue'],
      texte: <>Le polymère est entouré d'une <strong>sphère de solubilité</strong> de rayon R0 (ici 9,0 MPa½). On calcule RED = Ra / R0 : si RED &lt; 1, le solvant est dans la
        sphère, il doit dissoudre le polymère.</>,
      tache: { type: 'num', q: 'RED de l’acétate d’éthyle', unite: '', vrai: raEA / PT.R0, tol: 0.02, affiche: x => fmt(x, 2) } },
    { id: 'tester', titre: 'Tester les quatre solvants', focus: ['solvants'],
      texte: <>Cliquez sur chaque solvant dans le cadre « Les solvants » : son RED et sa position sur le diagramme s'affichent.</>,
      tache: { type: 'action', ok: Object.keys(SOLVANTS).every(k => testes[k]), consigne: `Solvants testés : ${Object.keys(SOLVANTS).filter(k => testes[k]).length} / 4` } },
    { id: 'classer', titre: 'Solvants et non-solvants', focus: ['solvants'],
      texte: <>Les esters sont les vrais solvants de la nitrocellulose ; les alcools servent surtout de diluants, moins chers.</>,
      tache: { type: 'qcm', q: 'Lequel de ces quatre liquides est un non-solvant de la nitrocellulose ?', options: ['l’éthanol', 'l’acétate d’éthyle', 'l’acétate de butyle'], bonne: 0,
        expl: `Éthanol : RED = ${fmt(redOf('etoh'), 2)}, juste au-dessus de 1 : trop de liaisons hydrogène.` } },
    { id: 'ipa', titre: 'Le cas de l’isopropanol', focus: ['solvants'],
      texte: <>L'isopropanol a un RED de {fmt(redOf('ipa'), 2)} : il serait dans la sphère. Pourtant, seul, il ne dissout pas la plupart des nitrocelluloses : on s'en sert pour
        les mouiller (les rendre moins inflammables au transport), et comme diluant.</>,
      tache: { type: 'qcm', q: 'Comment l’expliquer ?', options: ['Près de la frontière de la sphère, la prévision est incertaine, et les paramètres dépendent du grade de nitrocellulose', 'Le calcul est faux', 'L’isopropanol est toujours un bon solvant'], bonne: 0,
        expl: 'Le modèle de Hansen prévoit bien la tendance, mais pas avec certitude près de RED = 1. Il faut toujours vérifier au laboratoire.' } },
    { id: 'source', titre: 'Une autre source de données', focus: ['poly'],
      texte: <>Les paramètres de la nitrocellulose ne sont pas universels. Dans le cadre « Le polymère », choisissez « moyenne citée par Hansen » (16,2 ; 14,1 ; 9,5 ;
        R0 = 10,7) et regardez les RED.</>,
      tache: { type: 'qcm', q: 'Avec ces valeurs, l’acétate de butyle a un RED de 1,02. Que conclure ?', options: ['La prévision dépend des données choisies : seule une mesure sur le grade réellement utilisé tranche', 'L’acétate de butyle ne dissout pas la nitrocellulose', 'Les deux sources sont fausses'], bonne: 0,
        bloque: vuHansen ? null : 'Choisissez d’abord l’autre jeu de paramètres.',
        expl: 'En pratique, l’acétate de butyle est l’un des solvants les plus utilisés pour les vernis à la nitrocellulose : les données du TP décrivent mieux ce grade.' } },
    { id: 'bravo1', titre: 'Bravo !', focus: [],
      texte: <>Vous savez situer un solvant par rapport à la sphère de solubilité, et vous connaissez les limites de la prévision. Parcours suivant : « Les mélanges ».</>, tache: null },
    // ── 2. Les mélanges ──
    { id: 'intro2', titre: 'Mélanger les solvants', focus: ['mel'],
      texte: <>Un vernis n'utilise jamais un seul solvant. Les alcools sont moins chers que les esters : on cherche à en mettre le plus possible, sans que la nitrocellulose
        précipite. Les paramètres d'un mélange se calculent comme la moyenne de ceux des solvants, pondérée par leurs fractions volumiques.</>, tache: null },
    { id: 'moyenne', titre: 'Le point d’un mélange', focus: ['mel'],
      texte: <>Mélange à 50 % d'acétate d'éthyle (δh = 7,2) et 50 % d'éthanol (δh = 19,4), en volume.</>,
      tache: { type: 'num', q: 'δh du mélange', unite: 'MPa½', vrai: m5050.h, tol: 0.005, affiche: x => fmt(x, 1) } },
    { id: 'red5050', titre: 'Ce mélange dissout-il la nitrocellulose ?', focus: ['mel'],
      texte: <>Ce mélange : δd = 15,8 ; δp = {fmt(m5050.p, 2)} ; δh = {fmt(m5050.h, 1)}.</>,
      tache: { type: 'num', q: 'RED du mélange 50/50', unite: '', vrai: ra(PT, m5050) / PT.R0, tol: 0.02, affiche: x => fmt(x, 2) } },
    { id: 'optimum', titre: 'Le mélange le plus proche du centre', focus: ['mel'],
      texte: <>En formulation, on cherche souvent le mélange le plus proche du point du polymère (le RED le plus petit). Avec l'acétate d'éthyle et l'éthanol, réglez les
        proportions dans le cadre « Mon mélange » pour obtenir RED ≤ 0,41.</>,
      tache: { type: 'action', ok: redMel <= 0.41 && polyId === 'tp', consigne: `RED actuel : ${fmt(redMel, 2)}${polyId !== 'tp' ? ' (revenez aux données du TP)' : ''}` } },
    { id: 'diluer', titre: 'Jusqu’où diluer ?', focus: ['mel'],
      texte: <>Augmentez maintenant la part d'éthanol, jusqu'à ce que le mélange sorte de la sphère.</>,
      tache: { type: 'num', q: 'Part maximale d’éthanol (en % du volume) pour rester dans la sphère', unite: '%', vrai: fMax * 100, tol: 0.03, affiche: x => fmt(x, 0) } },
    { id: 'marge', titre: 'Une marge de sécurité', focus: [],
      texte: <>Le modèle autorise jusqu'à {fmt(fMax * 100, 0)} % d'éthanol. Mais il ne décrit que le vernis au moment où il est dans le flacon.</>,
      tache: { type: 'qcm', q: 'Pourquoi ne pas formuler à la limite ?', options: ['La prévision est incertaine près de RED = 1, et la composition change pendant le séchage', 'Parce que l’éthanol est un ester', 'Il n’y a aucune raison'], bonne: 0 } },
    { id: 'bravo2', titre: 'Bravo !', focus: [],
      texte: <>Vous savez calculer le point d'un mélange et l'optimiser. Parcours suivant : « Le séchage du vernis », où la composition du mélange change.</>, tache: null },
    // ── 3. Le séchage ──
    { id: 'intro3', titre: 'Le séchage du vernis', focus: ['sech'],
      texte: <>Une fois le vernis appliqué, les solvants s'évaporent, mais pas tous à la même vitesse. La composition du solvant restant change donc, et son point se déplace
        dans l'espace de Hansen.</>, tache: null },
    { id: 'volatil', titre: 'Qui s’évapore le plus vite ?', focus: ['solvants'],
      texte: <>Pressions de vapeur saturante à 20 °C : acétate d'éthyle 10 000 Pa ; éthanol 5 800 Pa ; isopropanol 4 400 Pa ; acétate de butyle 1 070 Pa.</>,
      tache: { type: 'qcm', q: 'Lequel s’évapore le plus vite ?', options: ['l’acétate d’éthyle', 'l’acétate de butyle', 'l’éthanol'], bonne: 0 } },
    { id: 'eco', titre: 'Un vernis économique', focus: ['sech'],
      texte: <>Formulation « économique » : 30 % d'acétate d'éthyle et 70 % d'éthanol (RED = {fmt(ra(PT, melange({ ea: 30, etoh: 70 })) / PT.R0, 2)} au départ, dans la sphère).
        Réglez ce mélange, puis lancez le séchage.</>,
      tache: { type: 'action', ok: !!sech && Math.abs((seche?.vol.ea || 0) / tot - 0.3) < 0.03 && Math.abs((seche?.vol.etoh || 0) / tot - 0.7) < 0.03 && progres >= 1,
        consigne: sech ? 'Regardez la trajectoire et la courbe du RED.' : 'Réglez AE 30 % et EtOH 70 %, puis « Lancer le séchage ».' } },
    { id: 'blanchiment', titre: 'Que s’est-il passé ?', focus: ['sech'],
      texte: <>Pendant le séchage, le RED du solvant restant monte jusqu'à {fmt(sechEco.redMax, 2)}.</>,
      tache: { type: 'qcm', q: 'Pourquoi ?', options: ['L’acétate d’éthyle part plus vite : le solvant restant s’enrichit en éthanol, sort de la sphère, et la nitrocellulose précipite (le vernis blanchit)', 'L’éthanol devient un solvant', 'La nitrocellulose s’évapore'], bonne: 0 } },
    { id: 'lent', titre: 'Le rôle du solvant lent', focus: ['sech'],
      texte: <>Remplacez une partie de l'acétate d'éthyle par de l'<strong>acétate de butyle</strong>, en gardant 70 % d'éthanol, et relancez le séchage jusqu'à ce que le RED reste
        sous 1 avant le figeage.</>,
      tache: { type: 'action', ok: !!sech && progres >= 1 && (seche?.vol.ba || 0) > 0 && (seche?.vol.etoh || 0) / tot >= 0.68 && sech.redMax < 1,
        consigne: sech ? `RED maximal avant figeage : ${fmt(sech.redMax, 2)}` : 'Ajoutez de l’acétate de butyle, puis lancez le séchage.' } },
    { id: 'regle', titre: 'La règle de formulation', focus: [],
      texte: <>Le solvant le plus lent est celui qui reste en dernier : c'est lui qui doit garder la nitrocellulose dissoute jusqu'au bout.</>,
      tache: { type: 'qcm', q: 'Que doit être le solvant le plus lent du mélange ?', options: ['Un vrai solvant du polymère (ici l’acétate de butyle)', 'Un diluant bon marché', 'Le plus volatil possible'], bonne: 0,
        expl: 'C’est une règle classique des vernis à la nitrocellulose. Mais un solvant lent allonge aussi le séchage : tout est affaire de compromis.' } },
    { id: 'hypotheses', titre: 'Les hypothèses du modèle', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Laquelle de ces causes de blanchiment le modèle ignore-t-il ?', options: ['L’eau de l’air qui se condense sur le film refroidi par l’évaporation', 'Le changement de composition du solvant', 'La sortie de la sphère de solubilité'], bonne: 0 } },
    { id: 'bravo3', titre: 'Bravo !', focus: [],
      texte: <>Vous savez qu'un bon mélange de solvants doit dissoudre le polymère au départ, mais aussi pendant tout le séchage. En exploration libre, testez vos propres
        mélanges ; le défi vous demande un vernis rapide, économique et sans blanchiment.</>, tache: null },
  ];
  const ORDRE = [P1, P2, P3];
  const ETAPES = ORDRE[parc - 1].map(id => TOUTES.find(e => e.id === id));
  const loc = id => ORDRE[parc - 1].indexOf(id);
  const avant = id => ORDRE.slice(0, parc - 1).some(l => l.includes(id));
  const vu = id => !enGuide || avant(id) || (loc(id) >= 0 && etape >= loc(id));
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3 } : {});
  useEffect(() => { if (enGuide && parc === 1 && etape === loc('tester')) setTestes({}); }, [etape, enGuide, parc]);
  useEffect(() => { if (polyId === 'hansen') setVuHansen(true); }, [polyId]);
  // Dans le parcours 1, le solvant « testé » est affiché ; ailleurs, tous les solvants sont visibles
  const montrerPoint = k => !enGuide || parc > 1 || etape > loc('tester') || testes[k];
  const points = Object.entries(SOLVANTS).filter(([k]) => montrerPoint(k)).map(([k, s]) => ({ ...s, k }));
  const montrerMel = !enGuide || parc >= 2;

  // ════════════════ BLOCS ════════════════
  const vueBloc = (
    <div style={{ ...styleBoite, ...cadre('vue') }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>L'espace de Hansen</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setVue('carte')} style={stylePetitBouton(vue === 'carte', '#334155')}>Coupe δp–δh</button>
          <button onClick={() => setVue('3d')} style={stylePetitBouton(vue === '3d', '#334155')}>Sphère 3D</button>
        </div>
      </div>
      {vue === 'carte' ? <Carte P={P} points={points} mel={montrerMel && tot > 0 ? mel : null} traj={sech ? sech.traj : null} progres={progres}/>
        : <><Sphere3D P={P} points={points} mel={montrerMel && tot > 0 ? mel : null} angle={angle}/><Curseur nom="Angle de vue" valeur={angle} onChange={setAngle} min={-90} max={90} pas={5} unite="°" couleur="#334155"/></>}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.45 }}>
        {vue === 'carte' ? <>La carte est une coupe de la sphère au δd des solvants (tous à 15,8) : le cercle a pour rayon √(R0² − 4 Δδd²) = {fmt(Math.sqrt(Math.max(0, P.R0 ** 2 - 4 * (15.8 - P.d) ** 2)), 2)} MPa½.
          Un point dans le cercle vert a un RED inférieur à 1. (Le cercle apparaît ici comme une ellipse, car les deux axes n'ont pas la même échelle.)</> : <>Axes 2δd, δp et δh : avec le facteur 2 sur δd, le domaine de solubilité est une vraie sphère.</>}
      </div>
    </div>
  );
  const blocPoly = (
    <div style={{ ...styleBoite, ...cadre('poly') }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Le polymère : nitrocellulose</div>
      {(!enGuide || parc > 1 || etape >= loc('source')) && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
        {Object.entries(POLYMERES).map(([k, q]) => <button key={k} onClick={() => setPolyId(k)} style={stylePetitBouton(polyId === k, '#15803d')}>{q.nom}</button>)}
      </div>}
      <div style={{ fontSize: 13.5, color: KIT.txt }}>δd = {fmt(P.d, 1)} ; δp = {fmt(P.p, 1)} ; δh = {fmt(P.h, 1)} ; R0 = {fmt(P.R0, 1)} MPa½</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>{P.source}</div>
    </div>
  );
  const blocSolvants = (
    <div style={{ ...styleBoite, ...cadre('solvants') }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Les solvants</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
          <thead><tr>{['Solvant', 'δd', 'δp', 'δh', 'Psat (20 °C)', 'RED'].map(t => <th key={t} style={cell}>{t}</th>)}</tr></thead>
          <tbody>{Object.entries(SOLVANTS).map(([k, s]) => {
            const r = ra(P, s) / P.R0, visible = montrerPoint(k) && (!enGuide || parc > 1 || etape >= loc('tester'));
            return <tr key={k} onClick={() => setTestes(x => ({ ...x, [k]: true }))} style={{ cursor: 'pointer' }}>
              <td style={{ ...cell, color: s.color, fontWeight: 700, textAlign: 'left' }}>{s.nom}</td><td style={cell}>{fmt(s.d, 1)}</td><td style={cell}>{fmt(s.p, 1)}</td><td style={cell}>{fmt(s.h, 1)}</td>
              <td style={cell}>{s.psat} Pa</td>
              <td style={{ ...cell, fontWeight: 700, color: visible ? (r < 1 ? '#15803d' : '#b91c1c') : KIT.txt2 }}>{visible ? `${fmt(r, 2)} ${r < 1 ? '(solvant)' : '(non-solvant)'}` : enGuide && parc === 1 && etape === loc('tester') ? 'cliquer' : '?'}</td></tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
  const pas = 5;
  const blocMel = montrerMel && (
    <div style={{ ...styleBoite, ...cadre('mel') }}>
      <Section titre="Mon mélange" ouvert={ouverts.mel} onBascule={() => setOuverts(o => ({ ...o, mel: !o.mel }))}>
        {Object.entries(SOLVANTS).map(([k, s]) => <Curseur key={k} nom={`${s.nom} (% du volume)`} valeur={tot > 0 ? Math.round(vol[k] / tot * 100) : 0}
          onChange={v => setVol(o => { const autres = Object.keys(o).filter(x => x !== k), reste = autres.reduce((a, x) => a + o[x], 0), nv = { ...o, [k]: v };
            autres.forEach(x => { nv[x] = reste > 0 ? o[x] / reste * (100 - v) : (100 - v) / autres.length; }); return nv; })} min={0} max={100} pas={pas} unite="%" couleur={s.color}/>)}
        <LigneMesure nom="Point du mélange (δd ; δp ; δh)" valeur={`${fmt(mel.d, 1)} ; ${fmt(mel.p, 2)} ; ${fmt(mel.h, 2)}`}/>
        <LigneMesure nom="RED du mélange" valeur={`${fmt(redMel, 2)} : ${redMel < 1 ? 'dissout la nitrocellulose' : 'ne la dissout pas'}`} couleur={redMel < 1 ? '#15803d' : '#b91c1c'}/>
        <LigneMesure nom="Part d'alcool" valeur={`${fmt(tot > 0 ? (vol.etoh + vol.ipa) / tot * 100 : 0, 0)} %`}/>
      </Section>
    </div>
  );
  const blocSech = (!enGuide || parc === 3) && (
    <div style={{ ...styleBoite, ...cadre('sech') }}>
      <Section titre="Le séchage" ouvert={ouverts.sech} onBascule={() => setOuverts(o => ({ ...o, sech: !o.sech }))}>
        <button onClick={lancerSechage} style={styleBouton(true, '#2563eb')}>▶ Lancer le séchage du mélange</button>
        {sech && <>
          <div style={{ marginTop: 8 }}><CourbeRed traj={sech.traj} progres={progres}/></div>
          {progres >= 1 && <>
            <LigneMesure nom="RED maximal avant figeage" valeur={`${fmt(sech.redMax, 2)} : ${sech.redMax < 1 ? 'film transparent' : 'la nitrocellulose précipite : le vernis blanchit'}`} couleur={sech.redMax < 1 ? '#15803d' : '#b91c1c'}/>
            <LigneMesure nom="Temps de séchage (acétate de butyle pur = 100)" valeur={fmt(sech.tSec / T_REF * 100, 0)}/>
          </>}
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Sur la coupe δp–δh, la trajectoire en pointillés suit le point du solvant restant.</div>
        </>}
      </Section>
    </div>
  );
  const blocHypo = (vu('ipa') || !enGuide || parc > 1) && (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={ouverts.hypo} onBascule={() => setOuverts(o => ({ ...o, hypo: !o.hypo }))}><Hypotheses/></Section>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() { setDefi({ tMax: [35, 40, 45][Math.floor(Math.random() * 3)], alcoolMin: [40, 45, 50][Math.floor(Math.random() * 3)] }); setPolyId('tp'); setVol({ ea: 50, ba: 0, etoh: 50, ipa: 0 }); }
  const voletDefi = defi && (() => {
    const alc = tot > 0 ? (vol.etoh + vol.ipa) / tot * 100 : 0;
    const C = [
      { ok: redMel < 0.9, t: `Dissout la nitrocellulose, avec une marge : RED au départ < 0,9 (${fmt(redMel, 2)})` },
      { ok: sech ? sech.redMax < 1 : null, t: `Pas de blanchiment : RED < 1 jusqu'au figeage${sech ? ` (max ${fmt(sech.redMax, 2)})` : ' (lancez le séchage)'}` },
      { ok: sech ? sech.tSec / T_REF * 100 <= defi.tMax : null, t: `Séchage rapide : temps ≤ ${defi.tMax}${sech ? ` (${fmt(sech.tSec / T_REF * 100, 0)})` : ''}` },
      { ok: alc >= defi.alcoolMin, t: `Économique : au moins ${defi.alcoolMin} % d'alcool (${fmt(alc, 0)} %)` },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>Formulez le mélange de solvants d'un vernis à la nitrocellulose (données du TP) qui respecte les quatre critères ci-dessous. Réglez le mélange, puis lancez le séchage.</div>
        {C.map((c, k) => <div key={k} style={{ fontSize: 14, color: KIT.txt }}>{c.ok === true ? '✅' : c.ok === false ? '❌' : '⏳'} {c.t}</div>)}
        {C.every(c => c.ok === true) && <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>Bravo ! Pouvez-vous mettre encore plus d'alcool ?</div>}
        {tot > 0 && vol.ipa / tot > 0.5 && <div style={{ fontSize: 13.5, color: '#b45309', lineHeight: 1.5 }}>⚠️ Le modèle accepte ce mélange parce qu'il place l'isopropanol juste dans la sphère (RED = 0,88).
          En pratique, l'isopropanol ne dissout pas seul la plupart des nitrocelluloses : un mélange aussi riche en isopropanol est à vérifier au laboratoire avant d'y croire.</div>}
        <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 D'autres critères</button>
      </div>
    );
  })();

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi') nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ha-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ha-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .ha-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Paramètres de Hansen : la nitrocellulose d'un vernis à ongle</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {enGuide && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Parcours :</span>
        {[[1, '1. La sphère de solubilité'], [2, '2. Les mélanges'], [3, '3. Le séchage du vernis']].map(([k, n]) =>
          <button key={k} onClick={() => setParc(k)} style={styleBouton(parc === k, ORANGE_GUIDE)}>{n}{[g1, g2, g3][k - 1].etape > 0 ? ` (étape ${[g1, g2, g3][k - 1].etape + 1})` : ''}</button>)}
      </div>}
      <div className="ha-l1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{vueBloc}{blocSech}</div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? <div style={styleBoite}>{voletDefi}</div> : blocMel}
      </div>
      <div className="ha-l2">
        {(enGuide || enDefi) && blocMel}
        {blocSolvants}
        {blocPoly}
        {blocHypo}
      </div>
    </div>
  );
}

const cell = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
const P1 = ['contexte', 'parametres', 'ra', 'facteur4', 'red', 'tester', 'classer', 'ipa', 'source', 'bravo1'];
const P2 = ['intro2', 'moyenne', 'red5050', 'optimum', 'diluer', 'marge', 'bravo2'];
const P3 = ['intro3', 'volatil', 'eco', 'blanchiment', 'lent', 'regle', 'hypotheses', 'bravo3'];
