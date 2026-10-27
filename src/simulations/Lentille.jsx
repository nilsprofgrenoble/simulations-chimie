import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, avecIndices } from "../commun";
import { fr, tracer, foyer, geometrie, PX_CM } from "./optiqueModele";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 65 — LENTILLE CONVERGENTE : DU TRAJET DE LA LUMIÈRE AU FOYER (2GT, « Ondes et signaux »)
//  Atelier 1 : vrai tracé de rayons à travers une lentille de verre (loi de Snell-Descartes sur chaque face courbe ou plane).
//  Atelier 2 : banc d'optique, recherche de la distance focale f′ d'une lentille cachée.
//  Hypothèses : lentille en verre à faces sphériques parfaites, indice à 589 nm (pas de dispersion), lumière monochromatique,
//  rayons dans un plan contenant l'axe, les rayons éloignés de l'axe ne passent pas exactement par F′ (aberration sphérique, réelle),
//  banc d'optique : lentille mince, rayons proches de l'axe, tache sur l'écran = modèle géométrique (la diffraction est ignorée).
// ====================================================

const SIM = 65;
declarerDefis(SIM, [
  ['trouver', 'Trouver f′'],
  ['comparer', 'Comparer deux lentilles'],
  ['prevoir', 'Prévoir un rayon'],
]);
const TITRES = { trouver: 'Trouver f′', comparer: 'Comparer deux lentilles', prevoir: 'Prévoir un rayon' };
const VERT = '#15803d', ORANGE = '#b45309', C_RAY = '#d55e00', C_NRM = '#475569', C_SCH = '#009e73', C_F = '#0072b2';
const alea = l => l[Math.floor(Math.random() * l.length)];
const AXE = 165, X0 = 190, H = 70;
const FOCALES = [6, 8, 10, 12, 15, 20];
const lentille = (type, n, R) => ({ type, n, R, H, x0: X0, next: 1 });
const cm = x => fr(x, 1);

function contourVerre(L) {
  const G = geometrie(L), pts = [];
  for (let k = 0; k <= 30; k++) { const y = -H + 2 * H * k / 30; pts.push([G.c1[0] - Math.sqrt(L.R * L.R - y * y), AXE - y]); }
  for (let k = 30; k >= 0; k--) { const y = -H + 2 * H * k / 30; pts.push([L.type === 'plano' ? G.x1 : G.c2[0] + Math.sqrt(L.R * L.R - y * y), AXE - y]); }
  return pts.map(p => p.join(',')).join(' ');
}
function Lunette({ L, normales, mince, foyers, ideale = false, w = 700, hauteurs = [-60, -45, -30, -15, 15, 30, 45, 60], legende = true }) {
  const G = geometrie(L), fo = foyer(L);
  const rayons = hauteurs.map(h => { const r = tracer(L, Math.abs(h)); return r && r.fin ? { h, r, s: Math.sign(h) } : null; }).filter(Boolean);
  const flecheD = (x, y, c) => <polygon points={`${x},${y} ${x - 11},${y - 5} ${x - 11},${y + 5}`} fill={c}/>;
  const op = mince ? 0.28 : 1;
  const hl = rayons.find(q => q.h === 60);
  return (
    <svg viewBox={`0 0 ${w} 330`} width="100%" role="img" aria-label="Rayons lumineux parallèles à l’axe optique traversant une lentille convergente" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="8" y1={AXE} x2={w - 8} y2={AXE} stroke="#0f172a" strokeWidth="1.5" strokeDasharray="10 5"/>
      <text x={w - 12} y={AXE + 16} textAnchor="end" fontSize="12.5" fontWeight="700" fill="#0f172a">axe optique Δ</text>
      <polygon points={contourVerre(L)} fill="#7dd3fc" fillOpacity="0.45" stroke="#0369a1" strokeWidth="2.5"/>
      <g opacity={op}>
        {rayons.map(({ h, r, s }) => {
          const [p0, q1, q2] = r.pts, d = ideale && fo ? (() => { const vx = fo.xF - q2[0], vy = -q2[1], l = Math.hypot(vx, vy); return [vx / l, vy / l]; })() : r.fin, t = (w - 10 - q2[0]) / d[0], fin = [q2[0] + t * d[0], q2[1] + t * d[1]];
          const P = ([x, y]) => `${x},${AXE - s * y}`;
          return <g key={h}><polyline points={[p0, q1, q2, fin].map(P).join(' ')} fill="none" stroke={C_RAY} strokeWidth="2.6" strokeLinejoin="round"/>
            {flecheD(40, AXE - h, C_RAY)}</g>;
        })}
        {normales && rayons.map(({ h, r, s }) => { const [a, b] = [r.q1, r.q2], n1 = r.nrm1, n2 = r.nrm2, e = 34;
          return <g key={h} stroke={C_NRM} strokeWidth="1.4" strokeDasharray="4 3">
            <line x1={a[0] - n1[0] * e} y1={AXE - s * a[1] + s * n1[1] * e} x2={a[0] + n1[0] * e} y2={AXE - s * a[1] - s * n1[1] * e}/>
            {!ideale && <line x1={b[0] - n2[0] * e} y1={AXE - s * b[1] + s * n2[1] * e} x2={b[0] + n2[0] * e} y2={AXE - s * b[1] - s * n2[1] * e}/>}</g>; })}
      </g>
      {normales && !mince && hl && legende && <g fontSize="12.5" fontWeight="700" fill={C_NRM}>
        <text x={hl.r.q1[0] - 120} y={AXE - hl.r.q1[1] - 30}>normale (entrée)</text>{!ideale && <text x={hl.r.q2[0] + 20} y={AXE - hl.r.q2[1] - 30}>normale (sortie)</text>}</g>}
      {mince && fo && <g>
        <line x1={G.xO} y1={AXE - H - 14} x2={G.xO} y2={AXE + H + 14} stroke={C_SCH} strokeWidth="4"/>
        <polygon points={`${G.xO},${AXE - H - 20} ${G.xO - 7},${AXE - H - 6} ${G.xO + 7},${AXE - H - 6}`} fill={C_SCH}/><polygon points={`${G.xO},${AXE + H + 20} ${G.xO - 7},${AXE + H + 6} ${G.xO + 7},${AXE + H + 6}`} fill={C_SCH}/>
        {[-60, -30, 30, 60].map(h => <polyline key={h} points={`40,${AXE - h} ${G.xO},${AXE - h} ${fo.xF},${AXE}`} fill="none" stroke={C_SCH} strokeWidth="3"/>)}
        {legende && <text x={G.xO + 8} y={AXE - H - 20} fontSize="12.5" fontWeight="700" fill={C_SCH}>lentille mince (schéma)</text>}</g>}
      {foyers && fo && <g fontSize="14" fontWeight="800">
        <circle cx={G.xO} cy={AXE} r="4.5" fill="#0f172a"/><text x={G.xO - 4} y={AXE + 20} textAnchor="end">O</text>
        <circle cx={fo.xF} cy={AXE} r="6" fill={C_F} stroke="#fff" strokeWidth="1.5"/><text x={fo.xF} y={AXE + 22} textAnchor="middle" fill={C_F}>F′</text>
        <circle cx={2 * G.xO - fo.xF} cy={AXE} r="6" fill="#fff" stroke={C_F} strokeWidth="2.5"/><text x={2 * G.xO - fo.xF} y={AXE + 22} textAnchor="middle" fill={C_F}>F</text>
        {legende && <text x={(G.xO + fo.xF) / 2} y={AXE + 50} textAnchor="middle" fontSize="13" fill={C_F} stroke="#fff" strokeWidth="4" paintOrder="stroke">f′ = OF′ = {cm(fo.f)} cm</text>}
        {legende && <line x1={G.xO} y1={AXE + 30} x2={fo.xF} y2={AXE + 30} stroke={C_F} strokeWidth="2"/>}</g>}
      <text x="14" y="26" fontSize="13" fontWeight="800" fill="#0f172a">faisceau de rayons parallèles à l’axe</text>
    </svg>);
}

// ---------- banc d'optique (lentille mince, f′ en cm) ----------
const PXB = 16, XL = 90, FEC = 28;
function Banc({ f, s, reveler }) {
  const xs = XL + PXB * s, xf = XL + PXB * f, demi = Math.max(2, FEC * Math.abs(1 - s / f));
  const nette = Math.abs(s - f) <= 0.4;
  return (
    <svg viewBox="0 0 700 330" width="100%" role="img" aria-label={`Banc d’optique : écran à ${cm(s)} cm de la lentille`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="8" y1={AXE} x2="692" y2={AXE} stroke="#0f172a" strokeWidth="1.5" strokeDasharray="10 5"/>
      <line x1="30" y1="290" x2="690" y2="290" stroke="#0f172a" strokeWidth="3"/>
      {Array.from({ length: 38 }, (_, k) => k).map(k => <g key={k}><line x1={XL + PXB * k} y1="290" x2={XL + PXB * k} y2={k % 5 === 0 ? 304 : 298} stroke="#0f172a" strokeWidth="1.5"/>
        {k % 5 === 0 && <text x={XL + PXB * k} y="318" textAnchor="middle" fontSize="11.5" fill="#0f172a">{k} cm</text>}</g>)}
      {[-28, -14, 0, 14, 28].map(h => { const fin = h === 0 ? [xs, AXE] : [xs, AXE - h * (1 - s / f)];
        return <g key={h}><polyline points={`20,${AXE - h} ${XL},${AXE - h} ${fin[0]},${fin[1]}`} fill="none" stroke={C_RAY} strokeWidth="2.6"/>
          <polygon points={`44,${AXE - h} 33,${AXE - h - 5} 33,${AXE - h + 5}`} fill={C_RAY}/></g>; })}
      <line x1={XL} y1={AXE - 62} x2={XL} y2={AXE + 62} stroke="#0369a1" strokeWidth="5"/>
      <polygon points={`${XL},${AXE - 70} ${XL - 7},${AXE - 56} ${XL + 7},${AXE - 56}`} fill="#0369a1"/><polygon points={`${XL},${AXE + 70} ${XL - 7},${AXE + 56} ${XL + 7},${AXE + 56}`} fill="#0369a1"/>
      <text x={XL} y={AXE - 78} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0369a1">lentille (f′ inconnue)</text>
      <line x1={xs} y1={AXE - 62} x2={xs} y2={AXE + 62} stroke="#0f172a" strokeWidth="2.5"/><rect x={xs} y={AXE - 62} width="9" height="124" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2"/>
      <rect x={xs - 2} y={AXE - demi} width="13" height={2 * demi} rx="3" fill="#fde047" stroke={C_RAY} strokeWidth="2"/>
      <text x={xs + 4} y={AXE - 70} textAnchor="middle" fontSize="12.5" fontWeight="700">écran</text>
      <text x="14" y="26" fontSize="14" fontWeight="800" fill="#0f172a">Écran à s = {cm(s)} cm de la lentille</text>
      <text x="14" y="46" fontSize="13.5" fontWeight="700" fill={nette ? VERT : ORANGE}>Tache sur l’écran : {nette ? 'très petite, quasi un point' : demi > 18 ? 'grande' : 'moyenne'}</text>
      {reveler && <g><circle cx={xf} cy={AXE} r="6" fill={C_F} stroke="#fff" strokeWidth="1.5"/><text x={xf} y={AXE + 24} textAnchor="middle" fontSize="14" fontWeight="800" fill={C_F}>F′ : f′ = {cm(f)} cm</text></g>}
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'trouver') return { ...base, f: alea(FOCALES) };
  if (type === 'comparer') {
    for (;;) {
      const A = { n: alea([1.4, 1.5, 1.6, 1.8, 1.9]), R: alea([100, 130, 160]) }, B = { n: alea([1.4, 1.5, 1.6, 1.8, 1.9]), R: alea([100, 130, 160]) };
      const fa = foyer(lentille('plano', A.n, A.R)).f, fb = foyer(lentille('plano', B.n, B.R)).f;
      if (Math.max(fa, fb) / Math.min(fa, fb) > 1.15) return { ...base, A, B, fa, fb, rep: fa < fb ? 'A' : 'B' };
    }
  }
  const v = alea(['pF', 'tout', 'para']);
  return { ...base, v, rep: v };
}
const RAYONS = {
  pF: 'arrive parallèlement à l’axe optique', tout: 'passe par le centre optique O de la lentille', para: 'passe par le foyer objet F',
};
const BONS = { pF: 'passe par le foyer image F′', tout: 'n’est pas dévié', para: 'ressort parallèlement à l’axe optique' };
function evaluer(d, bancS) {
  if (d.type === 'trouver') { const x = lireNombre(d.reps.v), ok = isFinite(x) && Math.abs(x - d.f) <= 0.8, vu = Math.abs(bancS - d.f) <= 1.2; return { ok, lignes: [[ok, ok ? 'Distance focale correcte (à 0,8 cm près).' : vu ? 'Ta valeur ne correspond pas à la position où la tache est la plus petite : relis la graduation.' : 'Cherche d’abord la position de l’écran où la tache est la plus petite possible.']] }; }
  const ok = d.reps.d === d.rep; return { ok, lignes: [[ok, ok ? 'Bonne réponse.' : d.type === 'comparer' ? 'Une lentille plus « bombée » (R petit) et plus réfringente (n grand) dévie plus et converge plus près.' : 'Rappel : parallèle à l’axe → F′ ; par O → pas dévié ; par F → parallèle à l’axe.']] };
}
function VoletDefi({ defi, setDefi, changerType, bancS }) {
  const res = defi.verifie ? evaluer(defi, bancS) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const choix = (opts) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{opts.map(([v, l]) => <button key={v} onClick={() => rep('d', v)} style={stylePetitBouton(defi.reps.d === v, '#0ea5e9')}>{l}</button>)}</div>;
  const decrire = X => `n = ${fr(X.n, 2)}, R = ${fr(X.R / PX_CM, 1)} cm`;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'trouver' && <><div style={txt}><Pic n="target"/>Une lentille convergente est <strong>cachée</strong>. Avec le banc d’optique ci-dessous, déplacez l’écran pour obtenir la tache <strong>la plus petite</strong>, puis donnez la distance focale <strong>f′</strong> (en cm).</div>
        <label style={{ fontSize: 14, fontWeight: 600 }}>f′ = <input value={defi.reps.v || ''} onChange={e => rep('v', e.target.value)} inputMode="decimal" aria-label="Votre réponse" style={{ width: 90, padding: '5px 8px', fontSize: 15, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> cm</label></>}
      {defi.type === 'comparer' && <><div style={txt}><Pic n="target"/>Deux lentilles plan-convexes en verre : <strong>A</strong> ({decrire(defi.A)}) et <strong>B</strong> ({decrire(defi.B)}). Laquelle a la distance focale f′ <strong>la plus courte</strong> ?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8, marginBottom: 8 }}>
          {[['A', defi.A], ['B', defi.B]].map(([k, X]) => <div key={k}><div style={{ fontSize: 13, fontWeight: 700 }}>Lentille {k}</div><Lunette L={lentille('plano', X.n, X.R)} normales={false} foyers={false} ideale legende={false} w={700}/></div>)}</div>
        {choix([['A', 'La lentille A'], ['B', 'La lentille B']])}</>}
      {defi.type === 'prevoir' && <><div style={txt}><Pic n="target"/>Un rayon lumineux <strong>{RAYONS[defi.v]}</strong> (lentille mince convergente). Après la lentille, ce rayon…</div>
        {choix([['pF', 'passe par le foyer image F′'], ['tout', 'n’est pas dévié'], ['para', 'ressort parallèlement à l’axe optique'], ['F', 'passe par le foyer objet F']])}</>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'trouver' && <>La tache est la plus petite quand l’écran est dans le plan du foyer : s = f′. Ici f′ = <strong>{cm(defi.f)} cm</strong> (à 0,8 cm près).</>}
        {defi.type === 'comparer' && <>f′<sub>A</sub> ≈ {cm(defi.fa)} cm et f′<sub>B</sub> ≈ {cm(defi.fb)} cm : la lentille <strong>{defi.rep}</strong> a la plus courte distance focale. Plus n est grand (verre plus réfringent) et plus R est petit (face plus bombée), plus la lentille dévie et plus f′ est court.</>}
        {defi.type === 'prevoir' && <>Un rayon qui {RAYONS[defi.v]} {BONS[defi.v].replace('n’est', 'n’est')} : <strong>{BONS[defi.v]}</strong>.</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationLentille() {
  const [mode, setMode] = useState(() => modeOuverture('lentille-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('lentille-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('lentille');
  const [Le, setLe] = useState({ type: 'plano', n: 1.5, R: 100, normales: true, mince: false, foyers: true, ideale: true });
  const [B, setB] = useState({ f: 12, s: 5, reveler: false });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const L = lentille(Le.type, Le.n, Le.R), fo = foyer(L);
  const bancF = enDefi && defi.type === 'trouver' ? defi.f : B.f;

  const voirL = patch => { setAtelier('lentille'); setLe(l => ({ ...l, ...patch })); };
  const voirB = (f, s = 5) => { setAtelier('banc'); setB({ f, s, reveler: false }); };
  const ETAPES = [
    { id: 'idee', titre: 'Une lentille, c’est de la réfraction', depart: () => voirL({ type: 'plano', n: 1.5, R: 100, normales: true, mince: false, foyers: false }),
      texte: <>Une lentille est un morceau de verre taillé. La lumière y entre et en ressort : à <strong>chaque surface</strong>, c’est de la <strong>réfraction</strong>, exactement comme dans le chapitre précédent (n₁ sin i₁ = n₂ sin i₂). Ici, un faisceau de rayons <strong>parallèles</strong> arrive sur une lentille <strong>plan-convexe</strong> : la face de gauche est courbe, celle de droite est plane.
        <ExempleResolu>Chaque rayon arrive sur la face courbe avec un angle d’incidence <strong>différent</strong> (mesuré avec la <strong>normale</strong>, en pointillés gris). C’est pour cela que les rayons ne sont pas tous déviés pareil.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Un rayon passe de l’air (n = 1,00) au verre (n = 1,50) sur la face courbe. À l’entrée, il…', options: ['se rapproche de la normale', 's’écarte de la normale', 'n’est pas dévié', 'est entièrement réfléchi'], bonne: 0, expl: 'L’indice augmente (1,00 → 1,50) : le rayon se rapproche de la normale.' } },
    { id: 'normale', titre: 'Où est la normale sur une face courbe ?', depart: () => voirL({ normales: true, foyers: false }),
      texte: <>Sur une surface <strong>plane</strong>, la normale est la même partout. Sur une surface <strong>courbe</strong> (une sphère), la normale en un point est la droite qui passe par ce point et par le <strong>centre</strong> de la sphère : elle change d’orientation d’un point à l’autre. Regardez les pointillés sur la face courbe : plus le rayon est loin de l’axe, plus la normale est inclinée.</>,
      tache: { type: 'qcm', q: 'Pour un rayon qui arrive loin de l’axe, l’angle d’incidence sur la face courbe est…', options: ['plus grand que près de l’axe', 'plus petit que près de l’axe', 'toujours nul', 'toujours le même'], bonne: 0, expl: 'La normale est plus inclinée loin de l’axe : l’angle d’incidence est plus grand, donc la déviation aussi.' } },
    { id: 'sortie', titre: 'À la sortie du verre', depart: () => voirL({ normales: true, foyers: false }),
      texte: <>À la sortie, sur la face <strong>plane</strong>, la normale est horizontale (parallèle à l’axe). Le rayon passe du verre (1,50) à l’air (1,00) : l’indice <strong>diminue</strong>, donc le rayon <strong>s’écarte de la normale</strong>. Il est dévié <strong>encore plus</strong> vers l’axe.</>,
      tache: { type: 'qcm', q: 'Le rayon sort du verre vers l’air. Par rapport à la normale, il…', options: ['s’écarte de la normale', 'se rapproche de la normale', 'reste sur la normale', 'revient dans le verre'], bonne: 0, expl: 'n diminue (1,50 → 1,00) : le rayon s’écarte de la normale.' } },
    { id: 'foyer', titre: 'Les rayons se rejoignent : le foyer', depart: () => voirL({ normales: false, foyers: true }),
      texte: <>Après la lentille, tous les rayons <strong>convergent</strong> (presque) en un même point de l’axe : c’est le <strong>foyer image F′</strong>. La lentille est dite <strong>convergente</strong>. Le <strong>centre optique O</strong> est le milieu de la lentille. La distance <strong>f′ = OF′</strong> est la <strong>distance focale</strong>.
        <ExempleResolu>Ici f′ ≈ {cm(foyer(lentille('plano', 1.5, 100)).f)} cm. Le <strong>foyer objet F</strong> est le symétrique de F′ par rapport à la lentille.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Des rayons parallèles à l’axe optique traversent une lentille convergente. Ils se rejoignent au…', options: ['foyer image F′', 'centre optique O', 'foyer objet F', 'bord de la lentille'], bonne: 0, expl: 'Les rayons parallèles à l’axe convergent au foyer image F′.' } },
    { id: 'schema', titre: 'Le schéma de la lentille mince', depart: () => voirL({ normales: false, foyers: true, mince: true }),
      texte: <>Dessiner toute la forme du verre est long. Pour les schémas on utilise le modèle de la <strong>lentille mince</strong> : un trait vertical avec deux <strong>flèches vers l’extérieur</strong> (symbole d’une lentille convergente). En vert : un rayon <strong>parallèle à l’axe</strong> est dévié au centre O de la lentille et passe par F′.
        <ExempleResolu>Un rayon qui passe par le centre optique O <strong>n’est pas dévié</strong> (la lentille y est comme une lame à faces parallèles, très mince).</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Dans le schéma d’une lentille mince convergente, un rayon parallèle à l’axe optique…', options: ['passe par le foyer image F′', 'passe par le foyer objet F', 'n’est pas dévié', 'est parallèle à l’axe après la lentille'], bonne: 0, expl: 'Parallèle à l’axe en entrée → passe par F′ en sortie.' } },
    { id: 'indice', titre: 'Un verre plus réfringent', depart: () => voirL({ normales: false, foyers: true, mince: false }),
      texte: <>Que se passe-t-il si le verre dévie plus la lumière, c’est-à-dire si son indice <strong>n</strong> est plus grand ? Réglez <strong>n = 1,90 ou plus</strong> avec le curseur et regardez où est F′.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'lentille' && Le.n >= 1.85, consigne: 'Réglez l’indice n à 1,85 ou plus.' } },
    { id: 'conclusion-n', titre: 'Plus n est grand…', depart: null,
      texte: <>Un verre plus réfringent dévie davantage : les rayons se croisent <strong>plus près</strong> de la lentille. La distance focale f′ <strong>diminue</strong>. C’est aussi le cas si la face est plus bombée (rayon de courbure R plus petit).</>,
      tache: { type: 'qcm', q: 'Si l’indice n du verre augmente, la distance focale f′…', options: ['diminue', 'augmente', 'ne change pas', 'devient négative'], bonne: 0, expl: 'Plus n est grand, plus la lentille dévie la lumière : F′ est plus proche, f′ est plus petite.' } },
    { id: 'banc', titre: 'Mesurer f′ au banc d’optique', depart: () => voirB(12, 5),
      texte: <>En TP, on envoie un faisceau parallèle (lumière d’une source lointaine) sur une lentille et on déplace un <strong>écran</strong> jusqu’à obtenir la tache <strong>la plus petite</strong> : l’écran est alors au foyer image F′. Ici, la lentille est « cachée » : déplacez l’écran avec le curseur.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'banc' && Math.abs(B.s - B.f) <= 0.4, consigne: 'Placez l’écran de façon que la tache soit la plus petite possible.' } },
    { id: 'valeur', titre: 'Lire la distance focale', depart: null,
      texte: <>La tache est la plus petite quand l’écran est au foyer. La graduation du banc donne la distance entre la lentille et l’écran : c’est <strong>f′</strong>.</>,
      tache: { type: 'num', q: 'Quelle est la distance focale f′ de cette lentille (en cm) ?', unite: 'cm', vrai: 12, tol: 0.07, aide: 'Lisez sur la règle du banc la distance entre la lentille et l’écran, quand la tache lumineuse est la plus petite.', affiche: x => String(x).replace('.', ','), pieges: [[5, 'C’est la position de départ de l’écran, pas celle où la tache est la plus petite.']], expl: 'La tache est minimale pour s = 12 cm, donc f′ = 12 cm.' } },
    { id: 'soleil', titre: 'Et pour un objet très éloigné ?', depart: null,
      texte: <>Le Soleil, une étoile, une fenêtre lointaine : les rayons qui arrivent sur la lentille sont presque <strong>parallèles</strong> entre eux. Leur image se forme donc dans le <strong>plan du foyer</strong>. C’est ainsi qu’on peut estimer f′ avec une lentille loupe et une feuille de papier.</>,
      tache: { type: 'qcm', q: 'Pour obtenir l’image nette d’un objet très éloigné, où place-t-on l’écran ?', options: ['À la distance f′ de la lentille', 'Contre la lentille', 'À 2 cm de la lentille', 'Très loin de la lentille'], bonne: 0, expl: 'Un objet très éloigné envoie des rayons parallèles : son image est au foyer image F′.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Une lentille = <strong>deux réfractions</strong> (une par face).</li>
        <li>Lentille convergente : des rayons <strong>parallèles à l’axe</strong> convergent au <strong>foyer image F′</strong> ; <strong>f′ = OF′</strong>.</li>
        <li>Rayon par le centre O : <strong>pas dévié</strong>. Plus n est grand ou R petit, plus f′ est <strong>courte</strong>.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) {
    const d = nouveauDefi(type); setDefi(d);
    if (type === 'trouver') { setAtelier('banc'); setB({ f: d.f, s: 4, reveler: false }); }
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'trouver'); else if (md === 'explore') setAtelier('lentille'); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Lentille de verre</strong> aux faces <strong>sphériques parfaites</strong> (plan-convexe ou biconvexe), sans défaut. À chaque face, on applique la loi de <strong>Snell-Descartes</strong> avec la normale réelle (le rayon est tracé par le calcul, pas dessiné à la main).</li>
      <li><strong>Lumière monochromatique</strong> et indice à 589 nm : la dispersion (l’indice change un peu avec la couleur) n’est pas modélisée. Indices proposés : 1,40 à 2,00.</li>
      <li><strong>Rayons dans un plan</strong> contenant l’axe optique, faisceau parallèle à l’axe. Pas de lumière réfléchie par les faces du verre.</li>
      <li><strong>Lentille idéale</strong> (réglage par défaut) : on suppose que tous les rayons parallèles à l’axe passent exactement par F′. Dans une vraie lentille simple, les rayons loin de l’axe croisent l’axe un peu avant F′ (aberration sphérique) : décochez « lentille idéale » pour le voir. Le foyer F′ est défini avec les rayons <strong>proches de l’axe</strong> (approximation de Gauss) ; f′ est mesurée depuis le milieu O de la lentille.</li>
      <li><strong>Lentille mince (schéma et banc)</strong> : modèle où toute la déviation se fait dans un plan. Une lentille épaisse (biconvexe très bombée) s’en écarte un peu.</li>
      <li><strong>Banc d’optique</strong> : taille de la tache = modèle géométrique (la diffraction est ignorée) ; position de l’écran lue à 0,1 cm près ; la tache est considérée « minimale » à ±0,4 cm.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const curs = (nom, val, min, max, pas, set, aff) => <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>{nom} : <strong>{aff}</strong>
    <input type="range" min={min} max={max} step={pas} value={val} aria-label={nom} onChange={e => set(+e.target.value)} style={{ width: '100%' }}/></label>;
  const bascule = (label, cle) => <button onClick={() => setLe(l => ({ ...l, [cle]: !l[cle] }))} style={stylePetitBouton(Le[cle], '#334155')}>{Le[cle] ? '☑' : '☐'} {label}</button>;
  const bancPanel = (
    <div>
      <Banc f={bancF} s={B.s} reveler={B.reveler && !enDefi}/>
      <div style={{ marginTop: 8 }}>{curs('Position de l’écran s', B.s, 2, 32, 0.1, v => setB(b => ({ ...b, s: Math.round(v * 10) / 10 })), `${cm(B.s)} cm`)}</div>
      {!enDefi && <div style={{ marginTop: 6 }}><button onClick={() => setB(b => ({ ...b, reveler: !b.reveler }))} style={stylePetitBouton(B.reveler, '#334155')}>{B.reveler ? 'Cacher' : 'Révéler'} f′</button>
        {!enGuide && <button onClick={() => setB({ f: alea(FOCALES.filter(x => x !== B.f)), s: 5, reveler: false })} style={{ ...styleBouton(false), marginLeft: 6 }}><Pic n="refresh"/>Autre lentille</button>}</div>}
    </div>);
  const lentillePanel = (
    <div>
      <Lunette L={L} normales={Le.normales} mince={Le.mince} foyers={Le.foyers} ideale={Le.ideale}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Lentille :</span>
        {[['plano', 'plan-convexe'], ['bi', 'biconvexe']].map(([k, l]) => <button key={k} onClick={() => setLe(x => ({ ...x, type: k }))} style={stylePetitBouton(Le.type === k, '#0f766e')}>{l}</button>)}
        {bascule('normales', 'normales')}{bascule('foyers F, F′', 'foyers')}{bascule('schéma lentille mince', 'mince')}{bascule('lentille idéale (tous les rayons au foyer)', 'ideale')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 6 }}>
        {curs('Indice du verre n', Le.n, 1.4, 2.0, 0.05, v => setLe(l => ({ ...l, n: Math.round(v * 100) / 100 })), fr(Le.n, 2))}
        {curs('Rayon de courbure R', Le.R, 100, 160, 5, v => setLe(l => ({ ...l, R: v })), `${fr(Le.R / PX_CM, 2)} cm`)}</div>
      <div style={{ marginTop: 4, fontSize: 14.5, color: KIT.txt }}>Distance focale : <strong>f′ = {fo ? `${cm(fo.f)} cm` : '—'}</strong></div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['lentille', '🔍 Trajet dans la lentille'], ['banc', '📏 Banc d’optique']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'lentille' ? lentillePanel : bancPanel}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Affichez les normales : à quel endroit l’angle d’incidence est-il le plus grand ?</li>
        <li>Augmentez l’indice n, puis diminuez R : que devient f′ ?</li>
        <li>Comparez plan-convexe et biconvexe pour les mêmes réglages.</li>
        <li>Au banc d’optique, trouvez f′ de 3 lentilles différentes puis révélez-la pour vérifier.</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>Lentille = deux réfractions</li><li>Parallèle à l’axe → F′ ; par O → pas dévié</li><li>n grand ou R petit → f′ courte</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ln-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ln-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ln-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .ln-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Lentille convergente : le trajet de la lumière et le foyer</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Une lentille, c’est de la <strong>réfraction</strong> sur deux faces. Suivez les rayons à travers le verre, trouvez le <strong>foyer</strong> et mesurez une <strong>distance focale</strong> au banc d’optique.</div>
      <div className={`ln-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancer} bancS={B.s}/></div>}
          {enDefi && defi.type === 'trouver' && <div style={styleBoite}>{bancPanel}</div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="ln-l2">{panneauHypo}</div>}
      {enExplore && <div className="ln-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
