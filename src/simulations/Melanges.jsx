import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, avecIndices } from "../commun";
import { fr, LIQUIDES, COLORANTS, miscible, goutte, D_HUILE, SHA, shaEau, D_EAU } from "./solutionsModele";

// ====================================================
//  SIM 63 — MÉLANGES : MISCIBILITÉ, SOLUBILITÉ ET DENSITÉ (2GT, « Constitution et transformations de la matière »)
//  Tubes à essais (liquides miscibles ou non, colorants solubles ou non), masse volumique et densité, expérience de Marie Curie
//  (goutte d'huile suspendue dans un mélange eau-alcool), composition d'une solution hydro-alcoolique (pourcentage volumique).
//  Hypothèses : volumes additifs (en réalité, eau + éthanol se contractent d'environ 3 %), mélange idéal, huile végétale peu miscible à l'éthanol à 20 °C,
//  densités à 20 °C : eau 1,0 ; huile 0,9 ; alcool 0,8 ; goutte « suspendue » à 0,01 de densité près.
// ====================================================

const SIM = 63;
declarerDefis(SIM, [
  ['tubes', 'Prévoir un mélange'],
  ['superposer', 'Qui flotte ?'],
  ['goutte', 'La goutte suspendue'],
]);
const TITRES = { tubes: 'Prévoir un mélange', superposer: 'Qui flotte ?', goutte: 'La goutte suspendue' };
const VERT = '#15803d', ORANGE = '#b45309';
const COUL_LIQ = { eau: '#93c5fd', huile: '#fcd34d', alcool: '#e2e8f0' };
const COUL_COL = { bleu: '#0072b2', rouge: '#d55e00' };
const alea = l => l[Math.floor(Math.random() * l.length)];
const nom = id => LIQUIDES[id].nom;

// ---------- tube à essais : miscibilité et colorants ----------
function Tube({ t, l1, l2, cols }) {
  const un = !l2 || l2 === l1, homog = un || miscible(l1, l2);
  const couches = un ? [l1] : homog ? ['eau+alcool'] : [l1, l2].sort((a, b) => LIQUIDES[a].d - LIQUIDES[b].d);   // du haut vers le bas
  const hH = 120, y0 = 70, h = un || homog ? hH : hH / 2;
  const actifs = Object.keys(cols).filter(d => cols[d]);
  const solDans = (d, c) => (c === 'eau+alcool' ? COLORANTS[d].soluble.eau || COLORANTS[d].soluble.alcool : COLORANTS[d].soluble[c]);
  const coul = c => c === 'eau+alcool' ? '#bfdbfe' : COUL_LIQ[c];
  return (
    <svg viewBox="0 0 560 270" width="100%" role="img" aria-label={`Tube à essais contenant ${nom(l1)}${un ? '' : ' et ' + nom(l2)}`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <clipPath id="tb"><path d="M 110 40 L 110 190 A 40 40 0 0 0 190 190 L 190 40 Z"/></clipPath>
      <g clipPath="url(#tb)">
        {couches.map((c, k) => <g key={c}>
          <rect x="100" y={y0 + k * h} width="100" height={h + (k === couches.length - 1 ? 80 : 0)} fill={coul(c)} opacity="0.85"/>
          {actifs.filter(d => solDans(d, c)).map((d, j, arr) => <rect key={d} x="100" y={y0 + k * h} width="100" height={h + (k === couches.length - 1 ? 80 : 0)} fill={COUL_COL[d]} opacity={arr.length > 1 ? 0.45 : 0.62}/>)}
        </g>)}
        {actifs.map((d, j) => { const sol = couches.some(c => solDans(d, c));
          return !sol ? <g key={d}>{[0, 1, 2, 3].map(k => <circle key={k} cx={130 + k * 12 + j * 6} cy={216 - (k % 2) * 4} r="3.5" fill={COUL_COL[d]}/>)}</g> : null; })}
      </g>
      <path d="M 110 40 L 110 190 A 40 40 0 0 0 190 190 L 190 40" fill="none" stroke="#0f172a" strokeWidth="3.5"/>
      <g fontSize="13" fill="#0f172a">
        {couches.map((c, k) => <text key={c} x="218" y={y0 + k * h + h / 2 + 4} fontWeight="700">{c === 'eau+alcool' ? 'eau + alcool (un seul liquide)' : nom(c)}{!homog && !un && k === 0 ? ' (en haut)' : ''}{!homog && !un && k === 1 ? ' (en bas)' : ''}</text>)}
        <text x="218" y="40" fontSize="15" fontWeight="800" fill={homog ? VERT : ORANGE}>Mélange {un ? 'd’un seul liquide' : homog ? 'homogène' : 'hétérogène'}</text>
        {actifs.map((d, k) => { const ou = couches.filter(c => solDans(d, c)); return <text key={d} x="218" y={216 + k * 20} fill={COUL_COL[d]} fontWeight="800">{COLORANTS[d].nom} : {ou.length ? `soluble (colore ${ou.map(c => c === 'eau+alcool' ? 'le mélange' : nom(c)).join(' et ')})` : 'non soluble (reste au fond en grains)'}</text>; })}
      </g>
      <text x="150" y="260" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#334155">{t}</text>
    </svg>);
}

// ---------- bécher de Marie Curie ----------
function Becher({ Ve, Va, masque }) {
  const g = goutte(Ve, Va), Vt = Ve + Va, haut = Math.min(200, 120 + Vt * 1.6), top = 232 - haut, bas = 232;
  const cy = top + 12 + g.frac * (haut - 40), plat = g.etat !== 'suspendue' && (g.frac <= 0.12 || g.frac >= 0.88);
  const coul = '#d55e00';
  return (
    <svg viewBox="0 0 640 270" width="100%" role="img" aria-label={`Bécher : ${fr(Ve, 1)} mL d’eau et ${fr(Va, 1)} mL d’alcool avec une goutte d’huile`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <clipPath id="bc"><rect x="90" y="20" width="150" height="212"/></clipPath>
      <rect x="92" y={top} width="146" height={haut} fill={Va > 0 ? '#c7d2fe' : '#93c5fd'} opacity="0.8"/>
      {plat && g.etat === 'flotte' && <rect x="92" y={top} width="146" height="14" fill={coul} opacity="0.85"/>}
      {plat && g.etat === 'coule' && <ellipse cx="165" cy={bas - 7} rx="58" ry="8" fill={coul} opacity="0.9"/>}
      {!plat && <circle cx="165" cy={cy} r="15" fill={coul} opacity="0.9"/>}
      <path d="M 90 20 L 90 232 L 240 232 L 240 20" fill="none" stroke="#0f172a" strokeWidth="3.5"/>
      <g fontSize="13.5" fill="#0f172a">
        <text x="262" y="40" fontWeight="800">Bécher : {fr(Ve, 1)} mL d’eau + {fr(Va, 1)} mL d’alcool</text>
        <text x="262" y="60">+ 2 mL d’huile colorée (rouge Soudan)</text>
        <text x="262" y="92">Volume total du mélange eau-alcool : <tspan fontWeight="800">{fr(Vt, 1)} mL</tspan></text>
        <text x="262" y="116">Densité du mélange eau-alcool :</text>
        <text x="262" y="138" fontSize="15" fontWeight="800" fill="#0f766e">d = ({fr(Ve, 1)} × 1,0 + {fr(Va, 1)} × 0,8) / {fr(Vt, 1)} = {fr(g.dm, 3)}</text>
        <text x="262" y="162">Densité de l’huile : <tspan fontWeight="800">{fr(D_HUILE, 1)}</tspan></text>
        {!masque && <text x="262" y="196" fontSize="15" fontWeight="800" fill={g.etat === 'suspendue' ? VERT : ORANGE}>{g.etat === 'suspendue' ? '✅ Goutte suspendue : d(mélange) = d(huile)' : g.etat === 'flotte' ? 'L’huile flotte : d(mélange) > d(huile)' : 'L’huile coule : d(mélange) < d(huile)'}</text>}
        {!masque && g.etat === 'flotte' && <text x="262" y="216" fontSize="12.5" fill={KIT.txt2}>Trop d’eau : ajoutez de l’alcool.</text>}
        {!masque && g.etat === 'coule' && <text x="262" y="216" fontSize="12.5" fill={KIT.txt2}>Trop d’alcool : ajoutez de l’eau.</text>}
      </g>
    </svg>);
}

// ---------- solution hydro-alcoolique ----------
function Sha({ s, setS }) {
  const eau = 100 - s.e - s.h - s.g, lignes = [...SHA.map(x => ({ ...x, V: s[x.id === 'ethanol' ? 'e' : x.id === 'h2o2' ? 'h' : 'g'] })), { id: 'eau', nom: 'eau distillée (qsp 100 mL)', pct: shaEau(), d: D_EAU, couleur: '#93c5fd', V: Math.max(0, eau) }];
  const masses = lignes.map(l => l.d * l.V), mtot = masses.reduce((a, b) => a + b, 0);
  const ok = Math.abs(s.e - 85) <= 0.5 && Math.abs(s.h - 4) <= 0.2 && Math.abs(s.g - 1.5) <= 0.1 && eau >= 0;
  const c = { padding: '3px 6px', fontSize: 13, textAlign: 'right', borderBottom: `1px solid ${KIT.bord}` };
  return (
    <div>
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Préparez <strong>100,0 mL</strong> de solution hydro-alcoolique (recette OMS : éthanol 85 %, eau oxygénée 4 %, glycérol 1,5 %, eau distillée pour compléter, en pourcentages volumiques).</div>
      <div style={{ display: 'flex', height: 30, borderRadius: 6, overflow: 'hidden', border: '2px solid #0f172a', marginBottom: 8 }} role="img" aria-label="Composition en volume">
        {lignes.map(l => <div key={l.id} style={{ width: `${Math.max(0, l.V)}%`, background: l.couleur, opacity: 0.9, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap' }}>{l.V >= 6 ? `${fr(l.V, 1)}` : ''}</div>)}</div>
      {[['e', 'Éthanol à 96 %', 100], ['h', 'Eau oxygénée', 10], ['g', 'Glycérol', 5]].map(([k, l, mx]) => <label key={k} style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{l} : <strong>{fr(s[k], 1)} mL</strong>
        <input type="range" min="0" max={mx} step={k === 'e' ? 0.5 : 0.1} value={s[k]} aria-label={`Volume de ${l} en millilitres`} onChange={e => setS(x => ({ ...x, [k]: +e.target.value }))} style={{ width: '100%' }}/></label>)}
      <div style={{ overflowX: 'auto', marginTop: 6 }}><table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>{['Constituant', 'V (mL)', '% vol.', 'OMS', 'd', 'masse (g)', '% masse'].map((h, k) => <th key={h} style={{ ...c, textAlign: k === 0 ? 'left' : 'right', fontSize: 12, color: KIT.txt2 }}>{h}</th>)}</tr></thead>
        <tbody>{lignes.map((l, k) => <tr key={l.id}><td style={{ ...c, textAlign: 'left', fontWeight: 600 }}>{l.nom}</td><td style={c}>{fr(l.V, 1)}</td><td style={c}>{fr(l.V, 1)} %</td><td style={c}>{fr(l.pct, 1)} %</td><td style={c}>{fr(l.d, 2)}</td><td style={c}>{fr(masses[k], 2)}</td><td style={c}>{mtot > 0 ? fr(100 * masses[k] / mtot, 1) : '—'} %</td></tr>)}</tbody></table></div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: ok ? VERT : ORANGE }}>{ok ? '✅ Composition conforme à la recette de l’OMS.' : eau < 0 ? '⚠ Les volumes dépassent 100 mL.' : 'Pas encore conforme : comparez la colonne « % vol. » à la colonne « OMS ».'}</div>
    </div>);
}
const shaOk = s => Math.abs(s.e - 85) <= 0.5 && Math.abs(s.h - 4) <= 0.2 && Math.abs(s.g - 1.5) <= 0.1 && 100 - s.e - s.h - s.g >= 0;

// ---------- défis ----------
const PAIRES_SUP = [['l’huile', 0.92], ['l’essence', 0.75], ['le cyclohexane', 0.78], ['le dichlorométhane', 1.33], ['le tétrachlorométhane', 1.59]];
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'tubes') { const ids = Object.keys(LIQUIDES), l1 = alea(ids), l2 = alea(ids.filter(x => x !== l1)), col = alea(Object.keys(COLORANTS)), solv = alea(ids); return { ...base, l1, l2, col, solv }; }
  if (type === 'superposer') { const [n, d] = alea(PAIRES_SUP); return { ...base, n, d }; }
  return { ...base, Ve: alea([10, 12, 15, 18, 20, 25]) };
}
function evaluer(d, G) {
  if (d.type === 'tubes') {
    const hom = miscible(d.l1, d.l2), sol = COLORANTS[d.col].soluble[d.solv], o1 = d.reps.hom === hom, o2 = d.reps.sol === sol;
    return { ok: o1 && o2, lignes: [[o1, o1 ? 'Bonne réponse sur le mélange.' : 'Revois : deux liquides miscibles donnent un mélange homogène (un seul liquide visible).'], [o2, o2 ? 'Bonne réponse sur la solubilité.' : 'Revois : un colorant est soluble dans un solvant s’il s’y dissout et le colore.']] };
  }
  if (d.type === 'superposer') { const haut = d.d < D_EAU, o = d.reps.pos === (haut ? 'haut' : 'bas'); return { ok: o, lignes: [[o, o ? 'Bonne réponse.' : 'Le liquide le moins dense flotte sur le plus dense.']] }; }
  const g = goutte(d.Ve, G.Va), ok = g.etat === 'suspendue' && G.Ve === d.Ve;
  return { ok, lignes: [[ok, ok ? 'La goutte est suspendue au milieu du mélange.' : g.etat === 'flotte' ? 'L’huile flotte encore : le mélange est trop dense, il faut ajouter de l’alcool.' : 'L’huile coule : il y a trop d’alcool.']] };
}
function VoletDefi({ defi, setDefi, changerType, G }) {
  const res = defi.verifie ? evaluer(defi, G) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }, q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const choix = (k, opts) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{opts.map(([v, l]) => <button key={String(v)} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'tubes' && <><div style={txt}>🎯 On mélange <strong>{nom(defi.l1)}</strong> et <strong>{nom(defi.l2)}</strong> dans un tube à essais (volumes comparables, huile végétale).</div>
        {q('Le mélange obtenu est…')}{choix('hom', [[true, 'homogène (miscibles)'], [false, 'hétérogène (non miscibles)']])}
        {q(`Le colorant « ${COLORANTS[defi.col].nom} » est-il soluble dans ${defi.solv === 'huile' ? 'l’huile' : defi.solv === 'eau' ? 'l’eau' : 'l’alcool'} ?`)}{choix('sol', [[true, 'oui, soluble'], [false, 'non, insoluble']])}</>}
      {defi.type === 'superposer' && <><div style={txt}>🎯 On verse <strong>{defi.n}</strong> (densité <strong>{fr(defi.d, 2)}</strong>) dans de l’eau (densité 1,00). Les deux liquides <strong>ne sont pas miscibles</strong>.</div>
        {q(`Où se place ${defi.n} ?`)}{choix('pos', [['haut', 'au-dessus de l’eau'], ['bas', 'au-dessous de l’eau']])}</>}
      {defi.type === 'goutte' && <div style={txt}>🎯 Dans un bécher, <strong>{defi.Ve} mL d’eau</strong> et 2 mL d’huile colorée (d = 0,9). Réglez le volume d’<strong>alcool</strong> (d = 0,8) pour que la goutte d’huile reste <strong>suspendue au milieu</strong> (curseur ci-dessous), puis cliquez sur « Vérifier ».</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'tubes' && <>{nom(defi.l1)} et {nom(defi.l2)} : {miscible(defi.l1, defi.l2) ? 'miscibles, mélange homogène' : 'non miscibles, mélange hétérogène'}. Le {COLORANTS[defi.col].nom} {COLORANTS[defi.col].soluble[defi.solv] ? 'est soluble' : 'n’est pas soluble'} dans {defi.solv === 'huile' ? 'l’huile' : defi.solv === 'eau' ? 'l’eau' : 'l’alcool'}.</>}
        {defi.type === 'superposer' && <>Le liquide le moins dense flotte. {fr(defi.d, 2)} {defi.d < 1 ? '<' : '>'} 1,00 : {defi.n} se place <strong>{defi.d < 1 ? 'au-dessus' : 'au-dessous'}</strong> de l’eau.</>}
        {defi.type === 'goutte' && <>La goutte est suspendue quand d(mélange) = d(huile) = 0,9. (V<sub>eau</sub> × 1,0 + V<sub>alcool</sub> × 0,8) / (V<sub>eau</sub> + V<sub>alcool</sub>) = 0,9 donne V<sub>alcool</sub> = V<sub>eau</sub> = <strong>{defi.Ve} mL</strong> (à 0,01 de densité près).</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationMelanges() {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('melanges-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('tubes');
  const [T, setT] = useState({ l1: 'huile', l2: 'eau', bleu: false, rouge: false });
  const [G, setG] = useState({ Ve: 15, Va: 0 });
  const [S, setS] = useState({ e: 60, h: 2, g: 1 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const g = goutte(G.Ve, G.Va);

  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const tube = (l1, l2, bleu = false, rouge = false) => { setAtelier('tubes'); setT({ l1, l2, bleu, rouge }); };
  const goutteVoir = (Ve, Va) => { setAtelier('goutte'); setG({ Ve, Va }); };
  const ETAPES = [
    { id: 'miscible', titre: 'Miscibles ou non ?', depart: () => tube('eau', 'alcool'),
      texte: <>Quand on mélange deux liquides, on obtient soit un seul liquide (<strong>mélange homogène</strong>), soit deux couches (<strong>mélange hétérogène</strong>). Deux liquides qui donnent un mélange homogène sont <strong>miscibles</strong>.
        <ExempleResolu>Huile + eau : on voit <strong>deux couches</strong> : mélange hétérogène, l’huile n’est <strong>pas miscible</strong> à l’eau. Eau + alcool : un seul liquide : mélange homogène, <strong>miscibles</strong>.
          {bouton('Voir huile + eau', () => tube('huile', 'eau'))}{' '}{bouton('Voir eau + alcool', () => tube('eau', 'alcool'))}</ExempleResolu>
        À vous : on verse du sirop dans de l’eau et on obtient un seul liquide coloré.</>,
      tache: { type: 'qcm', q: 'Le sirop et l’eau forment un seul liquide. On dit qu’ils sont…', options: ['miscibles', 'non miscibles', 'solubles', 'saturés'], bonne: 0, expl: 'Un mélange homogène (un seul liquide) signifie que les deux liquides sont miscibles.' } },
    { id: 'soluble', titre: 'Solubilité d’un colorant', depart: () => tube('huile', 'eau'),
      texte: <>« Miscible » parle de <strong>deux liquides</strong>. Pour un <strong>solide</strong> (ici un colorant) qui se dissout dans un liquide, on dit qu’il est <strong>soluble</strong> dans ce liquide.
        <ExempleResolu>Le <strong>bleu de méthylène</strong> est soluble dans l’eau : il la colore, mais il n’est pas soluble dans l’huile.
          {bouton('Ajouter du bleu de méthylène', () => tube('huile', 'eau', true, false))}</ExempleResolu>
        À vous : ajoutez du <strong>rouge Soudan</strong> au tube huile + eau.</>,
      tache: { type: 'qcm', q: 'Où va le rouge Soudan (voir le tube : colorant ajouté, couche colorée) ?', options: ['Il est soluble dans l’huile : il colore l’huile', 'Il est soluble dans l’eau : il colore l’eau', 'Il est soluble dans les deux', 'Il n’est soluble dans aucun des deux'], bonne: 0, expl: 'Le rouge Soudan colore la couche d’huile : il est soluble dans l’huile, pas dans l’eau.' } },
    { id: 'rho', titre: 'Masse volumique et densité', depart: null,
      texte: <>La <strong>masse volumique</strong> d’un liquide est <strong>ρ = m / V</strong> (en g/L). Sa <strong>densité</strong> compare à l’eau : <strong>d = ρ / ρ<sub>eau</sub></strong> (sans unité, avec ρ<sub>eau</sub> = 1000 g/L).
        <ExempleResolu>L’huile : 90 g pour 100 mL = 0,100 L : ρ = 90 / 0,100 = 900 g/L ; d = 900 / 1000 = <strong>0,9</strong>.</ExempleResolu>
        À vous : un alcool de masse 40 g occupe 50 mL.</>,
      tache: { type: 'num', q: 'Quelle est sa densité ? (convertir 50 mL en 0,050 L)', unite: '', vrai: 0.8, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[800, 'Ça, c’est ρ en g/L : la densité s’obtient en divisant par 1000 g/L.'], [0.0008, 'Convertis d’abord 50 mL en litres.']], expl: 'ρ = 40 / 0,050 = 800 g/L ; d = 800 / 1000 = 0,80.' } },
    { id: 'superpose', titre: 'Dans quel ordre se superposent-ils ?', depart: () => tube('huile', 'eau'),
      texte: <>Deux liquides <strong>non miscibles</strong> se superposent : le <strong>moins dense flotte</strong> sur le plus dense. Dans le tube huile + eau, l’huile (d = 0,9) est au-dessus de l’eau (d = 1,0).
        <ExempleResolu>L’essence (d = 0,75) et l’eau (d = 1,0), non miscibles : l’essence, moins dense, flotte sur l’eau.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Un liquide non miscible à l’eau a une densité de 1,3. Où se place-t-il ?', options: ['Au fond, sous l’eau', 'Au-dessus de l’eau', 'Il se mélange à l’eau', 'Au milieu'], bonne: 0, expl: '1,3 > 1,0 : il est plus dense que l’eau, il coule.' } },
    { id: 'curie', titre: '★ L’expérience de Marie Curie', depart: () => goutteVoir(15, 0),
      texte: <>En 1907, Marie Curie fait une expérience aux enfants : dans un mélange <strong>eau + alcool</strong> bien dosé, une goutte d’<strong>huile</strong> reste <strong>suspendue</strong> en boule, sans monter ni descendre. Si l’huile monte, il y a trop d’eau ; si elle coule, trop d’alcool.
        <ExempleResolu>Sans alcool, l’huile (d = 0,9) flotte sur l’eau (d = 1,0). Avec beaucoup d’alcool (d = 0,8), elle coule. Entre les deux, le mélange eau-alcool a une densité d’environ 0,9 : celle de l’huile.</ExempleResolu>
        À vous : ajoutez de l’alcool (curseur) jusqu’à ce que la goutte soit suspendue.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'goutte' && g.etat === 'suspendue', consigne: 'Réglez le volume d’alcool pour que la goutte d’huile reste suspendue.' } },
    { id: 'calcul', titre: 'Pourquoi cette quantité d’alcool ?', depart: () => goutteVoir(15, 15),
      texte: <>Le mélange eau-alcool a une densité <strong>comprise entre 0,8 et 1,0</strong> : une moyenne pondérée par les volumes, <strong>d = (V<sub>eau</sub> × 1,0 + V<sub>alcool</sub> × 0,8) / (V<sub>eau</sub> + V<sub>alcool</sub>)</strong>. La goutte est suspendue quand d(mélange) = d(huile) = 0,9.</>,
      tache: { type: 'num', q: 'Quelle est la densité d’un mélange de 15 mL d’eau et de 15 mL d’alcool ?', unite: '', vrai: 0.9, tol: 0.01, affiche: x => String(x).replace('.', ','), pieges: [[1.8, 'Tu as additionné les densités. La densité du mélange est une moyenne pondérée : entre 0,8 et 1,0.']], expl: 'd = (15 × 1,0 + 15 × 0,8) / 30 = 27 / 30 = 0,90 : égale à celle de l’huile, la goutte est suspendue.' } },
    { id: 'sha', titre: 'Une solution hydro-alcoolique', depart: () => { setAtelier('sha'); setS({ e: 60, h: 2, g: 1 }); },
      texte: <>Pour décrire un mélange de liquides, on donne la <strong>proportion en volume</strong> de chaque constituant : <strong>V(E) / V<sub>tot</sub></strong>, souvent en pourcentage (« pourcentage volumique »). La recette de l’OMS pour 100,0 mL de solution hydro-alcoolique : 85 % d’éthanol, 4 % d’eau oxygénée, 1,5 % de glycérol, le reste en eau distillée.
        <ExempleResolu>Pour 100,0 mL : V(éthanol) = 85 % × 100,0 = <strong>85,0 mL</strong>. L’eau complète : 100,0 − 85,0 − 4,0 − 1,5 = 9,5 mL.</ExempleResolu>
        À vous : réglez les volumes pour respecter la recette.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'sha' && shaOk(S), consigne: 'Réglez éthanol, eau oxygénée et glycérol pour que la composition soit conforme (colonne OMS).' } },
    { id: 'shamasse', titre: 'Volume ou masse ?', depart: null,
      texte: <>Dans le tableau, la masse d’un constituant se calcule avec sa masse volumique : <strong>m = ρ × V</strong>, soit <strong>m = d × 1000 g/L × V</strong>. Les pourcentages <strong>en masse</strong> ne sont pas les mêmes que ceux <strong>en volume</strong>.</>,
      tache: { type: 'num', q: 'Quelle masse d’éthanol (d = 0,81) y a-t-il dans 100,0 mL de solution (85,0 mL d’éthanol) ?', unite: 'g', vrai: 68.85, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[85, 'C’est le volume en mL. Pour la masse : m = ρ × V = 0,81 × 85,0.'], [104.9, 'Divise-t-on ? Non : m = ρ × V.']], expl: 'm = 0,81 g/mL × 85,0 mL = 68,9 g.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Liquides <strong>miscibles</strong> → mélange <strong>homogène</strong> ; <strong>non miscibles</strong> → <strong>hétérogène</strong>. Un solide est <strong>soluble</strong> (ou non) dans un solvant.</li>
        <li><strong>ρ = m / V</strong> ; <strong>d = ρ / ρ<sub>eau</sub></strong>.</li>
        <li>Deux liquides non miscibles : le <strong>moins dense</strong> est au-dessus.</li>
        <li>Proportion en volume : <strong>V(E) / V<sub>tot</sub></strong> (en %).</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { const d = nouveauDefi(type); setDefi(d); if (type === 'goutte') setG({ Ve: d.Ve, Va: 0 }); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'tubes'); }

  const liquidesBtn = (cle, aucun) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
    <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>{cle === 'l1' ? 'Liquide 1 :' : 'Liquide 2 :'}</span>
    {Object.keys(LIQUIDES).map(k => <button key={k} onClick={() => setT(x => ({ ...x, [cle]: k }))} style={stylePetitBouton(T[cle] === k, '#0f766e')}>{nom(k)}</button>)}
    {aucun && <button onClick={() => setT(x => ({ ...x, l2: null }))} style={stylePetitBouton(!T.l2, '#0f766e')}>aucun</button>}</div>;
  const preset = (n, a, b) => <button key={n} onClick={() => setT({ l1: a, l2: b, bleu: false, rouge: false })} style={stylePetitBouton(T.l1 === a && T.l2 === b, '#7c3aed')}>{n}</button>;
  const sliderGoutte = (verrou) => (
    <div style={{ marginTop: 8 }}>
      {!verrou && <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>Volume d’eau : <strong>{G.Ve} mL</strong>
        <input type="range" min="10" max="30" step="1" value={G.Ve} aria-label="Volume d'eau en millilitres" onChange={e => setG(x => ({ ...x, Ve: +e.target.value }))} style={{ width: '100%' }}/></label>}
      <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>Volume d’alcool versé : <strong>{fr(G.Va, 1)} mL</strong>
        <input type="range" min="0" max="40" step="0.5" value={G.Va} aria-label="Volume d'alcool en millilitres" onChange={e => setG(x => ({ ...x, Va: +e.target.value }))} style={{ width: '100%' }}/></label>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}><button onClick={() => setG(x => ({ ...x, Va: Math.min(40, x.Va + 1) }))} style={styleBouton(false)}>+ 1 mL d’alcool</button><button onClick={() => setG(x => ({ ...x, Va: 0 }))} style={styleBouton(false)}>↺ vider</button></div>
    </div>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Volumes additifs</strong> : le volume du mélange eau-alcool est la somme des volumes. En réalité, eau et éthanol <strong>se contractent</strong> (environ 3 % pour un mélange à parts égales) : la densité mesurée est un peu plus grande que celle calculée.</li>
      <li><strong>Densité du mélange</strong> = moyenne des densités pondérée par les volumes (conséquence de l’additivité des volumes et de la conservation de la masse).</li>
      <li><strong>Valeurs à 20 °C</strong> : eau 1,00 ; huile 0,9 ; alcool 0,8 (valeurs de l’énoncé). Une goutte est « suspendue » si les densités diffèrent de moins de 0,01 : un petit intervalle de volumes d’alcool convient.</li>
      <li><strong>Miscibilité</strong> : eau et alcool miscibles ; huile et eau non miscibles. L’huile <strong>végétale</strong> est très peu miscible à l’éthanol à froid, on la considère donc comme non miscible (l’huile de ricin, elle, y est miscible).</li>
      <li><strong>Colorants</strong> : le bleu de méthylène est soluble dans l’eau et l’alcool, le rouge Soudan dans l’huile et l’alcool. Solubilité = oui / non (on ne parle pas ici de quantité limite).</li>
      <li><strong>Recette OMS</strong> : pourcentages en volume pour 100,0 mL, l’eau complétant au volume final ; on néglige aussi la contraction pour calculer les masses.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const defiG = enDefi && defi.type === 'goutte', defiT = enDefi && defi.type === 'tubes' && defi.verifie;
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['tubes', '🧪 Tubes à essais'], ['goutte', '💧 Goutte d’huile'], ['sha', '🧴 Solution hydro-alcoolique']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'tubes' && <>
        <Tube t={`Tube : ${nom(T.l1)}${T.l2 ? ' + ' + nom(T.l2) : ''}`} l1={T.l1} l2={T.l2} cols={{ bleu: T.bleu, rouge: T.rouge }}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Tubes du TP :</span>{preset('A : huile + eau', 'huile', 'eau')}{preset('B : huile + alcool', 'huile', 'alcool')}{preset('C : eau + alcool', 'eau', 'alcool')}</div>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>{liquidesBtn('l1', false)}{liquidesBtn('l2', true)}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Ajouter un colorant :</span>
            {Object.keys(COLORANTS).map(k => <button key={k} onClick={() => setT(x => ({ ...x, [k]: !x[k] }))} style={stylePetitBouton(T[k], COUL_COL[k])}>{T[k] ? '✓ ' : ''}{COLORANTS[k].nom}</button>)}</div></div></>}
      {atelier === 'goutte' && <><Becher Ve={G.Ve} Va={G.Va} masque={false}/>{sliderGoutte(false)}</>}
      {atelier === 'sha' && <Sha s={S} setS={setS}/>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Tube A, B, C : lesquels sont homogènes ? Dans quel ordre se superposent les couches des mélanges hétérogènes ?</li>
        <li>Ajoutez les deux colorants dans le tube eau + alcool, puis dans huile + eau : comparez.</li>
        <li>Goutte d’huile : avec 20 mL d’eau, quel volume d’alcool la suspend ? Et avec 12 mL d’eau ? Que remarquez-vous ?</li>
        <li>Calculez la densité du mélange avec le curseur, puis vérifiez sur l’écran.</li>
        <li>Solution hydro-alcoolique : changez le volume d’éthanol. Comparez les % en volume et les % en masse.</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>miscibles ⇒ homogène ; non miscibles ⇒ hétérogène</li><li>ρ = m / V ; d = ρ / ρ<sub>eau</sub></li><li>le liquide le moins dense flotte</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ml-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ml-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ml-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .ml-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mélanges : miscibilité, solubilité et densité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Huile et eau se mélangent-elles ? Pourquoi l’huile flotte-t-elle ? Étudiez la <strong>miscibilité</strong>, la <strong>solubilité</strong> et la <strong>densité</strong>, reproduisez l’expérience de la <strong>goutte d’huile</strong> de Marie Curie et préparez une <strong>solution hydro-alcoolique</strong>.</div>
      <div className={`ml-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancer} G={G}/></div>}
          {defiG && <div style={styleBoite}><Becher Ve={defi.Ve} Va={G.Va} masque={!defi.verifie && !defi.solution}/>{sliderGoutte(true)}</div>}
          {defiT && <div style={styleBoite}><Tube t="Le mélange" l1={defi.l1} l2={defi.l2} cols={{ [defi.col]: true }}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="ml-l2">{panneauHypo}</div>}
      {enExplore && <div className="ml-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
