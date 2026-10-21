import { useState, useEffect, useMemo } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression } from "../commun";
import { fr, simuler, forcesSurCaisse, FORCES_CANDIDATES, BILANS, PREVOIR } from "./forcesModele";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 60 — PRINCIPE D'INERTIE (2GT, « Mouvement et interactions »)
//  Une caisse sur un sol horizontal : poids, réaction du sol, poussée, frottements. On voit les vecteurs forces, leur résultante,
//  la chronophotographie et la vitesse. Les forces se compensent ⇔ vitesse constante (repos ou mouvement rectiligne uniforme).
//  Parcours guidé avec exemples résolus, exploration libre, 3 défis. Modèle : forcesModele.js.
// ====================================================

const SIM = 60;
declarerDefis(SIM, [
  ['bilan', 'Faire le bilan des forces'],
  ['regler', 'Régler la poussée'],
  ['prevoir', 'Prévoir le mouvement'],
]);

const VERT = '#15803d', ORANGE = '#b45309', VIOLET = '#7c3aed';
const COUL = { poids: '#c2410c', reaction: '#0072b2', poussee: '#15803d', frottement: '#a16207' };
const alea = l => l[Math.floor(Math.random() * l.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const EPS = 1;                                  // newtons : en dessous, on considère que les forces se compensent
const T_MAX = 6;
const SOLS = [[0, 'Sans frottement (coussin d’air)'], [0.1, 'Sol glissant'], [0.2, 'Sol normal'], [0.3, 'Sol rugueux']];
const DEFAUT = { m: 25, F: 0, mu: 0.2, v0: 1 };
const g = 9.8;
const Vec = ({ c = 'F' }) => <span style={{ position: 'relative', display: 'inline-block', fontStyle: 'italic' }}>{c}<span aria-hidden="true" style={{ position: 'absolute', left: '0.1em', top: '-0.5em', fontSize: '0.8em', fontStyle: 'normal', lineHeight: 1 }}>→</span></span>;
const compense = res => Math.abs(res.x) < EPS && Math.abs(res.y) < EPS;

// échelle « ronde » (N pour 1 cm) pour que le plus grand vecteur mesure au plus 2,5 cm
const nice = F => [10, 20, 50, 100, 200, 500, 1000].find(s => F / s <= 2.5) || 1000;
function Fleche({ x, y, dx, dy, couleur, ep = 4.5, dash }) {
  const L = Math.hypot(dx, dy); if (L < 2) return null;
  const ux = dx / L, uy = dy / L, tete = Math.min(13, L * 0.6), bx = x + dx - ux * tete, by = y + dy - uy * tete;
  return <g><line x1={x} y1={y} x2={bx} y2={by} stroke={couleur} strokeWidth={ep} strokeLinecap="round" strokeDasharray={dash}/>
    <polygon points={`${x + dx},${y + dy} ${bx - uy * 7},${by + ux * 7} ${bx + uy * 7},${by - ux * 7}`} fill={couleur}/></g>;
}

// ---------- scène : caisse, chronophotographie, vecteurs forces ----------
const W = 560, H = 316, CY = 171, BAS = 196;   // la caisse (50 px de haut) repose sur le sol : fond = CY + 25 = BAS
function Scene({ P, sim, t }) {
  const i = clamp(Math.round(t / 0.1), 0, sim.t.length - 1), x = sim.x[i], v = sim.v[i];
  const xmin = Math.min(...sim.x, 0), xmax = Math.max(...sim.x, 0), k = Math.min(70, 440 / Math.max(1, xmax - xmin)), px = xx => 50 + (xx - xmin) * k + 30;
  const f = forcesSurCaisse({ m: P.m, F: P.F, mu: P.mu, v, g }), maxF = Math.max(...f.liste.map(e => Math.hypot(e.fx, e.fy)), 1), S = nice(maxF), pxN = 40 / S;
  const cx = px(x), pas = k >= 30 ? 1 : k >= 15 ? 2 : 5, ticks = [];
  for (let m = Math.ceil(xmin / pas) * pas; m <= xmax + 1e-9; m += pas) ticks.push(m);
  const points = []; for (let s = 0; s <= T_MAX + 1e-9; s += 0.5) { const j = Math.round(s / 0.1); points.push({ s, x: sim.x[Math.min(j, sim.x.length - 1)] }); }
  const lab = (txt, X, Y, c, anchor = 'start') => <text x={X} y={Y} textAnchor={anchor} fontSize="14" fontWeight="800" fill={c} fontStyle="italic">{txt}<tspan dx="-8" dy="-9" fontSize="9" fontStyle="normal">→</tspan></text>;
  const horiz = f.liste.filter(e => e.fy === 0), res = f.resultante;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Caisse de ${P.m} kg à la date ${fr(t, 1)} s, vitesse ${fr(v, 2)} m/s`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="10" y1={BAS} x2={W - 10} y2={BAS} stroke="#64748b" strokeWidth="3"/>
      {ticks.map(m => <g key={m}><line x1={px(m)} y1={BAS} x2={px(m)} y2={BAS + 8} stroke="#64748b" strokeWidth="2"/><text x={px(m)} y={BAS + 22} textAnchor="middle" fontSize="11" fill="#475569">{m} m</text></g>)}
      {points.map(p => <circle key={p.s} cx={px(p.x)} cy={BAS + 84} r={p.s <= t + 1e-9 ? 4.5 : 2.5} fill={p.s <= t + 1e-9 ? '#0f172a' : '#cbd5e1'}/>)}
      <text x="10" y={BAS + 106} fontSize="11.5" fill="#475569">Chronophotographie : une position toutes les 0,5 s</text>
      <rect x={cx - 36} y={CY - 25} width="72" height="50" fill="#e3c99b" stroke="#7c5a2b" strokeWidth="2.5"/>
      <text x={cx - 32} y={CY + 20} fontSize="11.5" fontWeight="700" fill="#5b4220">{P.m} kg</text>
      {/* points d'application : P en G (centre), R au contact caisse/sol, F sur la face poussée, f au contact caisse/sol */}
      {f.liste.filter(e => e.fx === 0).map(e => { const x0 = e.id === 'poids' ? cx : cx + 9, y0 = e.id === 'poids' ? CY : BAS; return <g key={e.id}><Fleche x={x0} y={y0} dx={0} dy={-e.fy * pxN} couleur={COUL[e.id]}/>{lab(e.note, x0 + 8, y0 - e.fy * pxN + (e.fy < 0 ? 4 : 14), COUL[e.id])}</g>; })}
      <circle cx={cx} cy={CY} r="3.5" fill="#0f172a"/><text x={cx - 8} y={CY - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="#0f172a">G</text>
      {horiz.map(e => { const pousse = e.id === 'poussee', x0 = pousse ? (e.fx >= 0 ? cx - 36 : cx + 36) : cx - 9, yy = pousse ? CY : BAS - 4, c = COUL[e.id]; return <g key={e.id}><Fleche x={x0} y={yy} dx={e.fx * pxN} dy={0} couleur={c}/>{lab(e.note, x0 + e.fx * pxN + (e.fx >= 0 ? 8 : -8), yy + (pousse ? 5 : -6), c, e.fx >= 0 ? 'start' : 'end')}</g>; })}
      <g><text x="12" y="22" fontSize="12.5" fontWeight="700" fill="#334155">Échelle des forces : 1 cm ↔ {S} N</text></g>
      <g><line x1="12" y1="32" x2="52" y2="32" stroke="#334155" strokeWidth="2"/><text x="58" y="36" fontSize="11" fill="#334155">1 cm</text></g>
      <text x={W - 12} y="22" textAnchor="end" fontSize="13" fontWeight="700" fill="#334155">t = {fr(t, 1)} s · v = {fr(v, 2)} m/s</text>
      {compense(res)
        ? <text x={cx} y="70" textAnchor="middle" fontSize="15" fontWeight="800" fill={VERT}>ΣF = 0 : les forces se compensent</text>
        : <g><Fleche x={cx} y={72} dx={res.x * pxN} dy={-res.y * pxN} couleur={VIOLET} ep={6} dash="7 4"/>
          <text x={cx + res.x * pxN / 2} y="56" textAnchor="middle" fontSize="13" fontWeight="800" fill={VIOLET}>résultante ΣF = {fr(Math.hypot(res.x, res.y), 0)} N</text></g>}
    </svg>);
}
function Graphe({ sim, t }) {
  const vmin = Math.min(0, ...sim.v), vmax = Math.max(0.5, ...sim.v), gx = s => 46 + s / T_MAX * 490, gy = v => 92 - (v - vmin) / (vmax - vmin) * 70;
  const i = clamp(Math.round(t / 0.1), 0, sim.t.length - 1);
  return (
    <svg viewBox="0 0 560 120" width="100%" role="img" aria-label="Graphique de la vitesse en fonction du temps" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="46" y1={gy(0)} x2="540" y2={gy(0)} stroke="#94a3b8" strokeWidth="1.5"/><line x1="46" y1="14" x2="46" y2="104" stroke="#94a3b8" strokeWidth="1.5"/>
      <polyline fill="none" stroke="#0f766e" strokeWidth="3" points={sim.t.map((s, j) => `${gx(s)},${gy(sim.v[j])}`).join(' ')}/>
      <circle cx={gx(sim.t[i])} cy={gy(sim.v[i])} r="6" fill="#0f172a" stroke="#fff" strokeWidth="1.5"/>
      <text x="52" y="12" fontSize="11.5" fill="#334155">v (m/s)</text><text x="6" y={gy(vmax) + 14} fontSize="10.5" fill="#475569">{fr(vmax, 1)}</text>
      <text x="540" y="116" textAnchor="end" fontSize="11.5" fill="#334155">t (s) → 6 s</text></svg>);
}

// ====================================================
//  DÉFIS
// ====================================================
const TITRES = { bilan: 'Bilan des forces', regler: 'Régler la poussée', prevoir: 'Prévoir le mouvement' };
function nouveauDefi(type, prec) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'bilan') { let b; do { b = alea(BILANS); } while (prec && prec.type === 'bilan' && prec.id === b.id); return { ...base, id: b.id, sel: [] }; }
  if (type === 'regler') { let m, mu, v0; do { m = alea([15, 20, 25, 30, 40]); mu = alea([0.1, 0.2, 0.3]); v0 = alea([1, 1.5, 2]); } while (prec && prec.type === 'regler' && prec.m === m && prec.mu === mu); return { ...base, m, mu, v0 }; }
  let k; do { k = Math.floor(Math.random() * PREVOIR.length); } while (prec && prec.type === 'prevoir' && prec.k === k);
  return { ...base, k };
}
function evaluerDefi(d, P) {
  if (d.type === 'bilan') {
    const b = BILANS.find(x => x.id === d.id), sel = [...d.sel].sort().join(), vrai = [...b.vrai].sort().join(), o1 = sel === vrai, o2 = d.reps.comp === b.compensent;
    const faux = d.sel.filter(s => !b.vrai.includes(s)), manque = b.vrai.filter(s => !d.sel.includes(s));
    return { ok: o1 && o2, lignes: [
      [o1, o1 ? 'Liste des forces correcte.' : faux.includes('lancer') ? 'Après le lancer, aucune « force du lancer » ne s’exerce : l’objet continue grâce à son inertie (la main n’est plus en contact).' : faux.length ? 'Une des forces cochées ne s’exerce pas sur l’objet.' : `Il manque : ${manque.map(m => FORCES_CANDIDATES.find(c => c[0] === m)[1]).join(', ')}.`],
      [o2, o2 ? 'Bonne réponse sur la compensation.' : b.compensent ? 'Ici les forces se compensent : la vitesse est constante (ou nulle).' : 'Ici les forces ne se compensent pas : la vitesse varie.']] };
  }
  if (d.type === 'regler') {
    const fk = d.mu * d.m * g, ok = Math.abs(P.F - fk) <= Math.max(1.5, 0.03 * fk);
    return { ok, lignes: [[ok, ok ? 'La poussée compense exactement les frottements : la vitesse reste constante.' : P.F < fk ? 'La poussée est trop faible : les frottements l’emportent, la caisse ralentit.' : 'La poussée est trop forte : la caisse accélère.']] };
  }
  const p = PREVOIR[d.k], o1 = d.reps.comp === p.compensent, o2 = d.reps.mvt === p.mvt;
  return { ok: o1 && o2, lignes: [[o1, o1 ? 'Bonne réponse sur la compensation.' : 'Revois : les forces se compensent seulement si la vitesse reste constante.'], [o2, o2 ? 'Bonne réponse sur la vitesse.' : 'Revois : si les forces se compensent, la vitesse est constante (ou nulle).']] };
}
function VoletDefi({ defi, setDefi, changerType, P, planche }) {
  const res = defi.verifie ? evaluerDefi(defi, P) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }, q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const choix = (k, opts) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{opts.map(([v, l]) => <button key={String(v)} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>;
  const b = defi.type === 'bilan' ? BILANS.find(x => x.id === defi.id) : null, p = defi.type === 'prevoir' ? PREVOIR[defi.k] : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'bilan' && <>
        <div style={txt}><Pic n="target"/>{b.texte} Quelles forces s’exercent sur l’objet ? (cochez toutes les bonnes réponses)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{FORCES_CANDIDATES.map(([id, nom]) => <label key={id} style={{ fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={defi.sel.includes(id)} onChange={e => setDefi(d => ({ ...d, sel: e.target.checked ? [...d.sel, id] : d.sel.filter(x => x !== id), verifie: false }))}/> {nom}</label>)}</div>
        {q('Ces forces se compensent-elles ?')}{choix('comp', [[true, 'Oui'], [false, 'Non']])}</>}
      {defi.type === 'regler' && <><div style={txt}><Pic n="target"/>Une caisse de <strong>{defi.m} kg</strong> glisse à <strong>{fr(defi.v0, 1)} m/s</strong> sur un sol avec frottements. Réglez la <strong>poussée</strong> (curseur ci-dessous) pour qu’elle garde <strong>exactement cette vitesse</strong>, puis cliquez sur « Vérifier ».</div>{planche}</>}
      {defi.type === 'prevoir' && <>
        <div style={txt}><Pic n="target"/>{p.txt}</div>
        {q('Les forces qui s’exercent sur le système se compensent-elles ?')}{choix('comp', [[true, 'Oui'], [false, 'Non']])}
        {q('Sa vitesse (valeur et direction)…')}{choix('mvt', [['constante', 'reste constante (ou nulle)'], ['varie', 'varie']])}</>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'bilan' && <>Forces : {b.vrai.map(id => FORCES_CANDIDATES.find(c => c[0] === id)[1]).join(' ; ')}. {b.compensent ? 'Elles se compensent : la vitesse est constante (ou nulle).' : 'Elles ne se compensent pas : la vitesse varie.'}</>}
        {defi.type === 'regler' && <>Les frottements valent f = μ × m × g = {fr(defi.mu, 1)} × {defi.m} × 9,8 ≈ <strong>{fr(defi.mu * defi.m * g, 0)} N</strong>. Pour que les forces se compensent, la poussée doit valoir la même chose, dans l’autre sens.</>}
        {defi.type === 'prevoir' && <>{p.expl}</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationPrincipeInertie() {
  const [mode, setMode] = useState(() => modeOuverture('inertie-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('inertie-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [P, setP] = useState(DEFAUT);
  const [t, setT] = useState(3);
  const [lecture, setLecture] = useState(false);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const Peff = enDefi && defi.type === 'regler' ? { ...P, m: defi.m, mu: defi.mu, v0: defi.v0 } : P;
  const sim = useMemo(() => simuler({ m: Peff.m, F: Peff.F, mu: Peff.mu, v0: Peff.v0, T: T_MAX, g }), [Peff.m, Peff.F, Peff.mu, Peff.v0]);
  const i = clamp(Math.round(t / 0.1), 0, sim.t.length - 1), vT = sim.v[i], res = forcesSurCaisse({ m: Peff.m, F: Peff.F, mu: Peff.mu, v: vT, g }).resultante;
  const fk = Peff.mu * Peff.m * g;

  useEffect(() => {
    if (!lecture) return undefined;
    const id = setInterval(() => setT(s => { if (s >= T_MAX - 1e-9) { setLecture(false); return T_MAX; } return Math.round((s + 0.1) * 10) / 10; }), 90);
    return () => clearInterval(id);
  }, [lecture]);

  const voir = (params, t0 = 3) => { setP({ ...DEFAUT, ...params }); setT(t0); setLecture(false); };
  const vFin = sim.v[sim.v.length - 1], r0 = forcesSurCaisse({ m: P.m, F: P.F, mu: P.mu, v: P.v0, g }).resultante;
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const ETAPES = [
    { id: 'coussin', titre: 'Faut-il une force pour avancer ?', depart: () => voir({ mu: 0, F: 0, v0: 1 }, 3),
      texte: <>Un palet est lancé sur une table à <strong>coussin d’air</strong> : l’air le soulève et supprime presque tous les frottements. Après le lancer, <strong>plus rien ne le pousse</strong>. Regardez la chronophotographie (une position toutes les 0,5 s) et la courbe de vitesse.
        <ExempleResolu>Les points sont <strong>régulièrement espacés</strong> : le palet parcourt la même distance à chaque intervalle de temps. Sa vitesse est constante (1 m/s), sa trajectoire est une droite : c’est un <strong>mouvement rectiligne uniforme</strong>.
          {bouton('Voir la simulation', () => voir({ mu: 0, F: 0, v0: 1 }, 3))}</ExempleResolu>
        À vous : que fait la vitesse du palet après le lancer ?</>,
      tache: { type: 'qcm', q: 'Après le lancer, sans frottement, la vitesse du palet…', options: ['reste constante', 'diminue peu à peu, car la force du lancer s’épuise', 'augmente', 'devient nulle aussitôt'], bonne: 0, expl: 'Sans frottement, la vitesse reste constante : il n’y a pas besoin de force pour maintenir un mouvement.' } },
    { id: 'vertical', titre: 'Poids et réaction du sol', depart: () => voir({ m: 20, mu: 0, F: 0, v0: 1 }, 3),
      texte: <>Le palet n’est pas « sans force » pour autant : la <strong>Terre l’attire</strong> (son <strong>poids</strong> <Vec c="P"/>) et la table le soutient (la <strong>réaction du support</strong> <Vec c="R"/>). Ces deux forces sont verticales.
        <ExempleResolu>Le palet ne s’enfonce pas dans la table et ne s’envole pas : verticalement, <strong>poids et réaction se compensent</strong>. Elles ont même direction, sens opposés et même intensité : R = P = m × g.</ExempleResolu>
        À vous : la caisse de 20 kg (g = 9,8 N/kg).</>,
      tache: { type: 'num', q: 'Quelle est l’intensité de la réaction du sol sur la caisse de 20 kg ?', unite: 'N', vrai: 196, tol: 0.03, affiche: x => String(x), pieges: [[20, 'C’est la masse en kg. La réaction vaut m × g.'], [19.6, 'Vérifiez l’ordre de grandeur : 20 × 9,8.']], expl: 'R = P = m × g = 20 × 9,8 = 196 N.' } },
    { id: 'resultante', titre: 'La résultante des forces', depart: () => voir({ m: 25, mu: 0.2, F: 49, v0: 1 }, 3),
      texte: <>Pour savoir si des forces se compensent, on les <strong>additionne</strong> : la <strong>résultante</strong> <Vec c="ΣF"/> est la somme vectorielle de toutes les forces. Si <Vec c="ΣF"/> = <Vec c="0"/>, les forces <strong>se compensent</strong>.
        <ExempleResolu>Sol normal, caisse de 25 kg, glissant à 1 m/s. Les <strong>frottements</strong> f valent 0,2 × 25 × 9,8 = 49 N, vers la gauche. Une poussée F de 49 N vers la droite les compense : <Vec c="ΣF"/> = <Vec c="0"/> (la flèche violette disparaît).
          {bouton('Voir cette situation', () => voir({ m: 25, mu: 0.2, F: 49, v0: 1 }, 3))}</ExempleResolu>
        À vous : coupez la poussée (F = 0) en réglant le curseur.</>,
      tache: { type: 'action', ok: enGuide && P.m === 25 && P.mu === 0.2 && P.F === 0 && Math.abs(r0.x) > EPS, consigne: 'Mettez la poussée à 0 : qu’arrive-t-il à la résultante et à la vitesse ?' } },
    { id: 'constante', titre: 'Avancer à vitesse constante', depart: () => voir({ m: 25, mu: 0.2, F: 0, v0: 1 }, 0.3),
      texte: <>Sur un sol avec frottements, il faut pousser pour que la caisse garde sa vitesse. Pourquoi ? Pour <strong>compenser</strong> les frottements. Ici, la poussée ne sert pas à « faire avancer » mais à annuler les frottements.
        <ExempleResolu>La caisse part à 1 m/s. Sans poussée, les frottements (49 N) la freinent jusqu’à l’arrêt.</ExempleResolu>
        À vous : réglez la poussée pour que la caisse garde une vitesse constante de 1 m/s.</>,
      tache: { type: 'action', ok: enGuide && P.mu > 0 && P.v0 >= 0.5 && P.F > 5 && Math.abs(r0.x) < EPS, consigne: 'Réglez la poussée F pour que la résultante soit nulle et que la vitesse reste constante.' } },
    { id: 'accelere', titre: 'Quand les forces ne se compensent pas', depart: () => voir({ m: 25, mu: 0.2, F: 49, v0: 1 }, 6),
      texte: <>Si la poussée est <strong>plus grande</strong> que les frottements, la résultante n’est plus nulle : elle est dirigée vers l’avant et la <strong>vitesse augmente</strong>.
        <ExempleResolu>Avec F = 100 N et f = 49 N, la résultante vaut 51 N vers la droite : la vitesse augmente. Plus la résultante est grande, plus la vitesse varie vite.</ExempleResolu>
        À vous : faites <strong>accélérer</strong> la caisse.</>,
      tache: { type: 'action', ok: enGuide && P.mu > 0 && vFin > P.v0 + 0.8 && P.F > 0, consigne: 'Réglez la poussée pour que la vitesse à 6 s dépasse nettement la vitesse de départ.' } },
    { id: 'freine', titre: 'Pourquoi la caisse s’arrête-t-elle ?', depart: () => voir({ m: 25, mu: 0.2, F: 0, v0: 2 }, 0.5),
      texte: <>On lance la caisse à 2 m/s, sans la pousser. Elle ralentit puis s’arrête. Contrairement à ce qu’on croit souvent, ce n’est pas parce que « la force du lancer s’épuise » : il n’y en a plus.
        <ExempleResolu>Seuls les <strong>frottements</strong> agissent horizontalement : ils ne sont compensés par rien. La résultante n’est pas nulle, donc la vitesse diminue.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Pourquoi la caisse ralentit-elle ?', options: ['Les frottements ne sont compensés par aucune autre force horizontale', 'Il n’y a plus aucune force sur la caisse', 'La force du lancer s’est épuisée', 'Le poids diminue'], bonne: 0, expl: 'Les frottements sont la seule force horizontale : la résultante n’est pas nulle, la vitesse diminue.' } },
    { id: 'principe', titre: 'Le principe d’inertie', depart: null,
      texte: <ARetenir titre="LE PRINCIPE D’INERTIE"><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Si les forces qui s’exercent sur un système <strong>se compensent</strong> (<Vec c="ΣF"/> = <Vec c="0"/>), alors il est <strong>immobile</strong> ou en <strong>mouvement rectiligne uniforme</strong> (vitesse constante en ligne droite).</li>
        <li>Réciproquement, si la <strong>vitesse varie</strong> (valeur ou direction), les forces <strong>ne se compensent pas</strong>.</li>
        <li>Il n’est donc <strong>pas nécessaire</strong> d’avoir une force pour entretenir un mouvement.</li></ul></ARetenir>, tache: null },
    { id: 'voiture', titre: 'Une voiture sur l’autoroute', depart: null,
      texte: <>Appliquons le principe d’inertie. Une voiture roule à 90 km/h en ligne droite sur une route horizontale.
        <ExempleResolu>Vitesse constante en ligne droite : les forces se compensent. Verticalement, poids et réaction. Horizontalement, la force motrice compense les frottements (air et route).</ExempleResolu></>,
      tache: { type: 'qcm', q: 'La même voiture roule à 90 km/h en ligne droite. Que peut-on dire de la force motrice et des frottements ?', options: ['Ils ont la même intensité et des sens opposés', 'La force motrice est la plus grande', 'Les frottements sont la plus grande des forces', 'Il n’y a ni force motrice ni frottements'], bonne: 0, expl: 'Vitesse constante : ΣF = 0, donc la force motrice compense exactement les frottements.' } },
    { id: 'virage', titre: 'Un virage à vitesse constante', depart: null,
      texte: <>Attention : la vitesse est un <strong>vecteur</strong> (valeur, direction, sens). Elle est constante seulement si sa valeur <em>et</em> sa direction ne changent pas.
        <ExempleResolu>Une voiture roule à 50 km/h (valeur constante) dans un virage : la <strong>direction</strong> de sa vitesse change, donc le vecteur vitesse varie. Les forces ne se compensent pas.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Dans un virage à valeur de vitesse constante, les forces sur la voiture…', options: ['ne se compensent pas', 'se compensent', 'sont nulles', 'ont une résultante dirigée vers l’arrière'], bonne: 0, expl: 'La direction de la vitesse change : le vecteur vitesse varie, donc les forces ne se compensent pas.' } },
    { id: 'parachute', titre: 'Un parachutiste', depart: null,
      texte: <>Un parachutiste saute. Au début, il accélère : les frottements de l’air sont faibles. Plus il va vite, plus les frottements augmentent. Puis sa vitesse n’augmente plus : il a atteint sa <strong>vitesse limite</strong>.</>,
      tache: { type: 'qcm', q: 'À la vitesse limite (constante, en ligne droite), les frottements de l’air valent…', options: ['exactement le poids', 'plus que le poids', 'moins que le poids', 'zéro'], bonne: 0, expl: 'Vitesse constante en ligne droite : ΣF = 0. Les frottements de l’air compensent le poids.' } },
    { id: 'iss', titre: '★ Les astronautes de la Station spatiale', depart: null,
      texte: <>À 400 km d’altitude, l’attraction de la Terre est encore forte (environ 90 % de sa valeur au sol). Les astronautes flottent pourtant. Seule force : le poids (l’attraction de la Terre). Ils sont en <strong>chute libre</strong> autour de la Terre.
        <ExempleResolu>Sur l’astronaute s’exerce <strong>une seule force</strong> : elle ne peut pas être compensée. Son vecteur vitesse change à chaque instant (il tourne autour de la Terre) : c’est cohérent avec le principe d’inertie. Dans la station (qui chute aussi), il paraît « flotter ».</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Pour un astronaute en orbite, soumis seulement à l’attraction de la Terre, les forces…', options: ['ne se compensent pas (une seule force)', 'se compensent', 'sont nulles', 'ont une résultante nulle car la gravité a disparu'], bonne: 0, expl: 'Une seule force ne peut pas se compenser elle-même : la vitesse varie (la direction change), comme le prévoit le principe d’inertie.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Forces qui <strong>se compensent</strong> (<Vec c="ΣF"/> = <Vec c="0"/>) ⇒ vitesse constante (repos ou mouvement rectiligne uniforme).</li>
        <li>Vitesse qui <strong>varie</strong> ⇒ forces qui ne se compensent pas.</li>
        <li>Pas besoin de force pour <em>entretenir</em> un mouvement : les frottements, eux, le freinent.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type, prec) {
    const d = nouveauDefi(type, prec); setDefi(d); setLecture(false);
    if (type === 'regler') { setP(p => ({ ...p, F: 0, m: d.m, mu: d.mu, v0: d.v0 })); setT(6); }
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'bilan', null); }

  // ════════════════ PANNEAUX ════════════════
  const verdict = compense(res)
    ? <div style={{ color: VERT, fontWeight: 700 }}><Pic n="ok"/>Les forces se compensent (<Vec c="ΣF"/> = <Vec c="0"/>) : {Math.abs(vT) < 1e-6 ? 'la caisse est immobile.' : `la vitesse est constante (${fr(vT, 2)} m/s) : mouvement rectiligne uniforme.`}</div>
    : <div style={{ color: ORANGE, fontWeight: 700 }}><Pic n="warn"/>Les forces ne se compensent pas (résultante de {fr(Math.abs(res.x), 0)} N) : la vitesse {res.x * (Math.abs(vT) < 1e-6 ? 1 : vT) > 0 ? 'augmente' : 'diminue'}.</div>;
  const plancheEtControles = (verrou, tableau = true) => (
    <div style={styleBoite}>
      <Scene P={Peff} sim={sim} t={t}/>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button onClick={() => { if (t >= T_MAX - 1e-9) setT(0); setLecture(l => !l); }} style={styleBouton(true, '#0f766e')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
        <label style={{ flex: '1 1 200px', fontSize: 13.5, fontWeight: 600 }}>Date : <strong>{fr(t, 1)} s</strong>
          <input type="range" min="0" max={T_MAX} step="0.1" value={t} aria-label="Date en secondes" onChange={e => { setLecture(false); setT(+e.target.value); }} style={{ width: '100%' }}/></label></div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
        <label style={{ flex: '1 1 220px', fontSize: 13.5, fontWeight: 600 }}>Poussée F : <strong>{P.F} N</strong> <span style={{ fontWeight: 400, color: KIT.txt2 }}>(+ vers la droite)</span>
          <input type="range" min="-150" max="150" step="1" value={P.F} aria-label="Poussée en newtons" onChange={e => setP(p => ({ ...p, F: +e.target.value }))} style={{ width: '100%' }}/></label>
        {!verrou && <>
          <label style={{ flex: '1 1 160px', fontSize: 13.5, fontWeight: 600 }}>Masse : <strong>{P.m} kg</strong>
            <input type="range" min="5" max="60" step="5" value={P.m} aria-label="Masse en kilogrammes" onChange={e => setP(p => ({ ...p, m: +e.target.value }))} style={{ width: '100%' }}/></label>
          <label style={{ flex: '1 1 160px', fontSize: 13.5, fontWeight: 600 }}>Vitesse initiale : <strong>{fr(P.v0, 1)} m/s</strong>
            <input type="range" min="-2" max="3" step="0.5" value={P.v0} aria-label="Vitesse initiale en mètres par seconde" onChange={e => setP(p => ({ ...p, v0: +e.target.value }))} style={{ width: '100%' }}/></label></>}</div>
      {!verrou && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Sol :</span>
        {SOLS.map(([mu, l]) => <button key={mu} onClick={() => setP(p => ({ ...p, mu }))} style={stylePetitBouton(P.mu === mu, '#0f766e')}>{l}</button>)}
        <span style={{ fontSize: 13, color: KIT.txt2 }}>Frottements : f = {fr(fk, 0)} N</span></div>}
      <div style={{ marginTop: 8 }}><Graphe sim={sim} t={t}/></div>
      {tableau && <div style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5 }}>{verdict}</div>}
    </div>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Système = la caisse</strong>, modélisée par un point (ses dimensions n’interviennent pas) ; le poids est tracé depuis son centre G, mais la réaction et le frottement s’appliquent au contact avec le sol, et la poussée sur la face poussée de la caisse.</li>
      <li><strong>Référentiel terrestre</strong>, supposé galiléen : le principe d’inertie s’y applique.</li>
      <li><strong>Frottements solides</strong> de valeur constante f = μ·m·g, opposés au mouvement. On néglige les frottements de l’air (sauf dans les exemples du parcours). Le coefficient μ est supposé le même au repos et en mouvement.</li>
      <li><strong>Calcul du mouvement</strong> : pour animer la caisse, la simulation utilise un calcul numérique de la vitesse, hors programme de seconde. Vous n’avez qu’à observer la vitesse : le programme n’exige que le principe d’inertie.</li>
      <li><strong>Seuil de compensation</strong> : on considère que les forces se compensent si la résultante vaut moins de 1 N en valeur absolue. Une poussée à 1 N près suffit à garder la vitesse sensiblement constante.</li>
      <li><strong>g = 9,8 N/kg</strong>. Le poids et la réaction du sol sont toujours égaux (le sol ne s’enfonce pas).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Sol « sans frottement », poussée nulle, vitesse initiale 2 m/s : que fait la vitesse ? Et les points de la chronophotographie ?</li>
        <li>Sol normal : trouvez la poussée qui garde la vitesse constante. Comparez-la à la valeur des frottements.</li>
        <li>Doublez la masse sans changer la poussée : que changent les frottements ? Faut-il pousser plus fort ?</li>
        <li>Mettez une vitesse initiale négative (vers la gauche) et une poussée vers la droite : quel est le sens des frottements ?</li>
        <li>Poussée de 20 N sur un sol à frottements de 49 N, caisse à l’arrêt : que se passe-t-il ? (frottement statique)</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>forces qui se compensent ⇒ vitesse constante (repos ou MRU)</li>
    <li>vitesse qui varie ⇒ forces qui ne se compensent pas</li>
    <li>pas de force nécessaire pour entretenir un mouvement</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pi-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pi-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pi-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .pi-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Principe d’inertie : forces et mouvement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Faut-il une force pour qu’un objet avance ? Poussez une caisse sur différents sols, observez les <strong>forces</strong>, leur <strong>résultante</strong>, la <strong>chronophotographie</strong> et la <strong>vitesse</strong>, et découvrez le <strong>principe d’inertie</strong>.</div>
      <div className={`pi-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} P={Peff} changerType={t2 => lancer(t2, defi)} planche={null}/></div>}
          {(!enDefi || defi.type === 'regler') && plancheEtControles(enDefi, !enDefi)}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="pi-l2">{panneauHypo}</div>}
      {enExplore && <div className="pi-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
