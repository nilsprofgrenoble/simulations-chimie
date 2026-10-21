import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, proche, avecIndices, indicesProfond } from "../commun";
import { Fiole } from "./solutionsVue";
import { fr, TM, concFille, volumeMere, ECHELLE, PIPETTES, FIOLES, T_DAKIN, teinte } from "./solutionsModele";

// ====================================================
//  SIM 62 — DILUTION ET ÉCHELLE DE TEINTES (2GT, « Constitution et transformations de la matière »)
//  Solution mère de permanganate (0,40 g/L) → solutions filles : conservation de la masse de soluté, tm·Vm = tf·Vf, facteur de dilution F,
//  choix de la verrerie, échelle de teintes et encadrement d'une concentration inconnue (liqueur de Dakin).
//  Hypothèses : volumes parfaits (fiole et pipette jaugées sans incertitude), eau distillée pure, teinte ∝ concentration (faibles concentrations),
//  comparaison de teintes « à l'œil » idéalisée : à l'écran, la couleur n'est qu'une représentation.
// ====================================================

const SIM = 62;
declarerDefis(SIM, [
  ['volume', 'Calculer le volume à prélever'],
  ['regler', 'Préparer la bonne solution'],
  ['encadrer', 'Encadrer une concentration'],
]);
const TITRES = { volume: 'Volume à prélever', regler: 'Préparer la solution', encadrer: 'Encadrer par les teintes' };
const VERT = '#15803d', ORANGE = '#b45309', VIOLET = '#7b2d8e';
const alea = l => l[Math.floor(Math.random() * l.length)];
const MYSTERES = [0.006, 0.015, 0.03, 0.06];
const DEFAUT = { Vm: 10, Vf: 100 };
const fg = (x) => fr(x, x < 0.01 ? 3 : 2);                 // g/L
const fv = (x) => (Number.isInteger(x) ? String(x) : fr(x, 1));

// ---------- scène : dilution ----------
function SceneDilution({ D }) {
  const tf = concFille(TM, D.Vm, D.Vf), F = D.Vm > 0 ? D.Vf / D.Vm : Infinity, m = TM * D.Vm;      // g/L × mL = mg
  return (
    <svg viewBox="0 0 560 300" width="100%" role="img" aria-label={`On prélève ${D.Vm} mL de solution mère que l’on complète à ${D.Vf} mL`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <defs><marker id="ft" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#334155"/></marker></defs>
      <rect x="14" y="76" width="92" height="66" rx="3" fill={VIOLET} opacity={teinte(TM)} />
      <path d="M14 56 L14 142 L106 142 L106 56" fill="none" stroke="#0f172a" strokeWidth="3"/>
      <text x="60" y="160" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">Solution mère Sm</text>
      <g stroke="#0f172a" strokeWidth="2.5" fill="#e2e8f0"><rect x="55" y="22" width="10" height="82" rx="2"/><ellipse cx="60" cy="18" rx="9" ry="9" fill="#cbd5e1"/></g>
      <rect x="56.5" y="70" width="7" height="34" fill={VIOLET} opacity={teinte(TM)}/>
      <text x="76" y="34" fontSize="12.5" fontWeight="700" fill="#0f172a">pipette : {fr(D.Vm, 1)} mL</text>
      <line x1="130" y1="104" x2="432" y2="104" stroke="#334155" strokeWidth="2.5" strokeDasharray="6 5" markerEnd="url(#ft)"/>
      <text x="281" y="94" textAnchor="middle" fontSize="12" fill="#334155">on verse V<tspan dy="3" fontSize="9">m</tspan><tspan dy="-3">, puis on complète à V</tspan><tspan dy="3" fontSize="9">f</tspan><tspan dy="-3"> avec de l’eau distillée</tspan></text>
      <Fiole cx={455} niveau={1} couleur={VIOLET} alpha={teinte(tf)} pts={0} solide={0} volume={D.Vf} id="g"/>
      <g fontSize="12.5" fill="#0f172a">
        <text x="14" y="188" fontWeight="800">Masse de soluté prélevée</text>
        <text x="14" y="206">m = t<tspan dy="3" fontSize="9">m</tspan><tspan dy="-3"> × V</tspan><tspan dy="3" fontSize="9">m</tspan><tspan dy="-3"> = 0,40 × {fr(D.Vm, 1)} = </tspan><tspan fontWeight="800">{fr(m, 1)} mg</tspan></text>
        <text x="14" y="230" fontWeight="800">Concentration dans la fiole</text>
        <text x="14" y="248">t<tspan dy="3" fontSize="9">f</tspan><tspan dy="-3"> = m / V</tspan><tspan dy="3" fontSize="9">f</tspan><tspan dy="-3"> = {fr(m, 1)} / {D.Vf} = </tspan><tspan fontWeight="800" fill="#0f766e">{fg(tf)} g/L</tspan></text>
        <text x="14" y="276" fontSize="14" fontWeight="800" fill={VERT}>Facteur de dilution F = {Number.isFinite(F) ? fr(F, F < 10 && F !== Math.round(F) ? 1 : 0) : '—'}</text>
      </g>
    </svg>);
}

// ---------- scène : échelle de teintes ----------
function Tube({ x, t, titre, sous, plein, couleurTxt = '#0f172a' }) {
  return (
    <g>
      <path d={`M ${x - 21} 40 L ${x - 21} 170 A 21 21 0 0 0 ${x + 21} 170 L ${x + 21} 40`} fill="none" stroke="#0f172a" strokeWidth="3"/>
      {plein && <path d={`M ${x - 19.5} 70 L ${x - 19.5} 170 A 19.5 19.5 0 0 0 ${x + 19.5} 170 L ${x + 19.5} 70 Z`} fill={VIOLET} opacity={teinte(t)}/>}
      <text x={x} y="222" textAnchor="middle" fontSize="13" fontWeight="800" fill={couleurTxt}>{titre}</text>
      <text x={x} y="240" textAnchor="middle" fontSize="12" fill={KIT.txt2}>{sous}</text>
    </g>);
}
function SceneEchelle({ mystere, voirT }) {
  return (
    <svg viewBox="0 0 560 262" width="100%" role="img" aria-label="Échelle de teintes de cinq solutions filles et une solution inconnue" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      {ECHELLE.map(([nom, t], k) => <Tube key={nom} x={48 + k * 84} t={t} titre={nom} sous={`${fg(t)} g/L`} plein/>)}
      <line x1="454" y1="34" x2="454" y2="250" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5"/>
      <Tube x={512} t={mystere} titre="Inconnue" sous={voirT ? `${fg(mystere)} g/L` : '? g/L'} plein couleurTxt={ORANGE}/>
      <text x="14" y="22" fontSize="12.5" fill={KIT.txt2}>Solutions filles, de la plus concentrée à la plus diluée (Vf = 100 mL, solution mère à 0,40 g/L)</text>
    </svg>);
}

// ---------- tableau à compléter (Q1 du TP) ----------
const bonneLigne = (t) => { const F = TM / t, Vm = 100 / F; return { F, Vm, v: PIPETTES.includes(Vm) ? 'jaugee' : 'graduee' }; };
function Tableau({ tab, setTab, verif, setVerif }) {
  const set = (id, k, v) => { setTab(s => ({ ...s, [id]: { ...s[id], [k]: v } })); setVerif(false); };
  const cell = { padding: '4px 6px', fontSize: 13.5, textAlign: 'center', borderBottom: `1px solid ${KIT.bord}` };
  const inp = (id, k, ok) => <input value={(tab[id] || {})[k] || ''} onChange={e => set(id, k, e.target.value)} inputMode="decimal" aria-label={`${k} ${id}`} style={{ width: 62, padding: '3px 5px', fontSize: 14, border: `1.5px solid ${verif ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, borderRadius: 5, textAlign: 'center' }}/>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Chaque solution fille fait <strong>V<sub>f</sub> = 100 mL</strong> et est préparée à partir de la solution mère (<strong>t<sub>m</sub> = 0,40 g/L</strong>). Complétez le tableau.</div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>{['Solution', 't_f (g/L)', 'Facteur F', 'V_m à prélever (mL)', 'Verrerie'].map(h => <th key={h} style={{ ...cell, fontSize: 12.5, color: KIT.txt2 }}>{avecIndices(h)}</th>)}</tr></thead>
        <tbody>{ECHELLE.map(([id, t]) => { const b = bonneLigne(t), r = tab[id] || {};
          const okF = proche(lireNombre(r.F), b.F, 0.03), okV = proche(lireNombre(r.Vm), b.Vm, 0.03), okG = r.v === b.v;
          return <tr key={id}><td style={{ ...cell, fontWeight: 700 }}>{id}</td><td style={cell}>{fg(t)}</td><td style={cell}>{inp(id, 'F', okF)}</td><td style={cell}>{inp(id, 'Vm', okV)}</td>
            <td style={cell}><select value={r.v || ''} onChange={e => set(id, 'v', e.target.value)} aria-label={`Verrerie ${id}`} style={{ padding: '3px 4px', fontSize: 13, border: `1.5px solid ${verif ? (okG ? '#16a34a' : '#dc2626') : KIT.bord}`, borderRadius: 5 }}>
              <option value="">…</option><option value="jaugee">pipette jaugée</option><option value="graduee">pipette graduée</option></select></td></tr>; })}</tbody></table>
      <div style={{ marginTop: 6, fontSize: 12.5, color: KIT.txt2 }}>Pipettes jaugées disponibles : {PIPETTES.join(' ; ')} mL.</div>
    </div>);
}
const tableauJuste = tab => ECHELLE.every(([id, t]) => { const b = bonneLigne(t), r = tab[id] || {}; return proche(lireNombre(r.F), b.F, 0.03) && proche(lireNombre(r.Vm), b.Vm, 0.03) && r.v === b.v; });

// ---------- encadrement ----------
const OPTIONS_ENC = [['', '…'], ...ECHELLE.map(([, t]) => [String(t), `${fg(t)} g/L`])];
const encadrementJuste = (m, bas, haut) => { const b = parseFloat(bas), h = parseFloat(haut); const vals = ECHELLE.map(e => e[1]).sort((x, y) => x - y); const i = vals.findIndex(v => v > m); return i > 0 && b === vals[i - 1] && h === vals[i]; };

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'volume') { const [tf, Vf] = alea([[0.08, 100], [0.04, 200], [0.02, 250], [0.2, 50], [0.1, 100], [0.05, 200], [0.04, 100], [0.01, 100], [0.004, 250]]); return { ...base, tf, Vf, Vm: volumeMere(TM, tf, Vf) }; }
  if (type === 'regler') return { ...base, tf: alea([0.01, 0.02, 0.04, 0.08]) };
  return { ...base, mystere: alea(MYSTERES) };
}
function evaluer(d, D) {
  if (d.type === 'volume') { const x = lireNombre(d.reps.v), ok = isFinite(x) && proche(x, d.Vm, 0.02); return { ok, lignes: [[ok, ok ? 'Volume correct.' : 'Revois : V_m = V_f × t_f / t_m (ou V_m = V_f / F).']] }; }
  if (d.type === 'regler') {
    const tf = concFille(TM, D.Vm, D.Vf), oka = proche(tf, d.tf, 0.01), okb = PIPETTES.includes(D.Vm);
    return { ok: oka && okb, lignes: [[oka, oka ? 'La concentration de la fille est la bonne.' : `Ta solution est à ${fg(tf)} g/L au lieu de ${fg(d.tf)} g/L.`], [okb, okb ? 'Le volume prélevé correspond à une pipette jaugée.' : 'Choisis une pipette jaugée (un volume proposé par les boutons).']] };
  }
  const ok = encadrementJuste(d.mystere, d.reps.bas, d.reps.haut);
  return { ok, lignes: [[ok, ok ? 'Encadrement correct (entre deux solutions voisines).' : 'Compare la teinte de la solution inconnue à celle des filles : elle est plus foncée que l’une et plus claire que l’autre. Prends deux solutions voisines.']] };
}
function VoletDefi({ defi, setDefi, changerType, D }) {
  const res = defi.verifie ? evaluer(defi, D) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'volume' && <><div style={txt}>🎯 On dispose de la solution mère à <strong>0,40 g/L</strong>. On veut <strong>{defi.Vf} mL</strong> de solution fille à <strong>{fg(defi.tf)} g/L</strong>. Quel volume de solution mère faut-il prélever ?</div>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Réponse : <input value={defi.reps.v || ''} onChange={e => rep('v', e.target.value)} inputMode="decimal" aria-label="Volume à prélever" style={{ width: 90, padding: '5px 8px', fontSize: 15, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> mL</label></>}
      {defi.type === 'regler' && <div style={txt}>🎯 Préparez, à partir de la solution mère à 0,40 g/L, une solution fille à <strong>{fg(defi.tf)} g/L</strong> : choisissez la <strong>fiole</strong> et la <strong>pipette jaugée</strong> (boutons ci-dessous), puis cliquez sur « Vérifier ».</div>}
      {defi.type === 'encadrer' && <><div style={txt}>🎯 Comparez la solution <strong>inconnue</strong> à l’échelle de teintes (ci-dessous) et encadrez sa concentration entre <strong>deux solutions voisines</strong>.</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 14 }}>
          <select value={defi.reps.bas || ''} onChange={e => rep('bas', e.target.value)} aria-label="Borne basse" style={{ padding: '5px 6px', fontSize: 14 }}>{OPTIONS_ENC.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <span>{'<'} t {'<'}</span>
          <select value={defi.reps.haut || ''} onChange={e => rep('haut', e.target.value)} aria-label="Borne haute" style={{ padding: '5px 6px', fontSize: 14 }}>{OPTIONS_ENC.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div></>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'volume' && indicesProfond(<>F = t_m / t_f = 0,40 / {fg(defi.tf)} = {fr(TM / defi.tf, 0)}. V_m = V_f / F = {defi.Vf} / {fr(TM / defi.tf, 0)} = <strong>{fv(defi.Vm)} mL</strong>.</>)}
        {defi.type === 'regler' && indicesProfond(<>Il faut t_m × V_m = t_f × V_f, soit V_m / V_f = {fg(defi.tf)} / 0,40 = {fr(defi.tf / TM, 3)}. Exemple : {defi.tf === 0.01 ? '5 mL dans 200 mL' : defi.tf === 0.02 ? '5 mL dans 100 mL' : defi.tf === 0.04 ? '10 mL dans 100 mL' : '20 mL dans 100 mL'}.</>)}
        {defi.type === 'encadrer' && <>La concentration vaut {fg(defi.mystere)} g/L : elle est comprise entre {fg(ECHELLE.map(e => e[1]).sort((a, b) => a - b).filter(v => v < defi.mystere).pop())} et {fg(ECHELLE.map(e => e[1]).sort((a, b) => a - b).find(v => v > defi.mystere))} g/L.</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationDilution() {
  const [mode, setMode] = useState(() => modeOuverture('dilution-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('dilution-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [D, setD] = useState(DEFAUT);
  const [atelier, setAtelier] = useState('diluer');
  const [tab, setTab] = useState({});
  const [tabV, setTabV] = useState(false);
  const [mystere, setMystere] = useState(0.015);
  const [voirT, setVoirT] = useState(false);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const tf = concFille(TM, D.Vm, D.Vf);
  const juste = tableauJuste(tab);

  const voir = (params, at = 'diluer') => { setD({ ...DEFAUT, ...params }); setAtelier(at); };
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const ETAPES = [
    { id: 'def', titre: 'Qu’est-ce que diluer ?', depart: () => voir({ Vm: 10, Vf: 100 }),
      texte: <>Diluer une solution, c’est lui <strong>ajouter de l’eau</strong> pour obtenir une solution <strong>moins concentrée</strong>. On part d’une solution <strong>mère</strong> et on prépare une solution <strong>fille</strong>.
        <ExempleResolu>On prélève 10 mL de solution mère (0,40 g/L) et on complète à 100 mL avec de l’eau distillée. On a <strong>seulement ajouté de l’eau</strong> : le soluté prélevé (4,0 mg) est <strong>tout entier dans la fiole</strong>. La fille est plus claire : 0,040 g/L.
          {bouton('Voir la dilution', () => voir({ Vm: 10, Vf: 100 }))}</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Quand on dilue une solution en ajoutant de l’eau, la masse de soluté…', options: ['ne change pas', 'augmente', 'diminue', 'est divisée par le volume d’eau'], bonne: 0, expl: 'On n’ajoute que de l’eau : la masse de soluté est la même dans le prélèvement et dans la solution fille (tₘ × Vₘ = t_f × V_f).' } },
    { id: 'facteur', titre: 'Le facteur de dilution', depart: () => voir({ Vm: 10, Vf: 100 }),
      texte: <>Comme la masse de soluté se conserve : <strong>t<sub>m</sub> × V<sub>m</sub> = t<sub>f</sub> × V<sub>f</sub></strong>. Le <strong>facteur de dilution</strong> est <strong>F = t<sub>m</sub> / t<sub>f</sub> = V<sub>f</sub> / V<sub>m</sub></strong> : « diluer 10 fois » signifie diviser la concentration par 10.
        <ExempleResolu>10 mL complétés à 100 mL : F = 100 / 10 = <strong>10</strong>. La concentration est divisée par 10 : 0,40 / 10 = 0,040 g/L.</ExempleResolu>
        À vous : on prélève 5 mL de solution mère, que l’on complète à 100 mL.</>,
      tache: { type: 'num', q: 'Quel est le facteur de dilution F ?', unite: '', vrai: 20, tol: 0.02, affiche: x => String(x), pieges: [[0.05, 'F = V_f / V_m (le grand volume divisé par le petit), pas l’inverse.'], [95, 'Tu as soustrait : on divise V_f par V_m.']], expl: 'F = V_f / V_m = 100 / 5 = 20 : la solution fille est 20 fois moins concentrée.' } },
    { id: 'volume', titre: 'Quel volume prélever ?', depart: () => voir({ Vm: 5, Vf: 100 }),
      texte: <>On connaît la concentration voulue : on calcule d’abord <strong>F = t<sub>m</sub> / t<sub>f</sub></strong>, puis <strong>V<sub>m</sub> = V<sub>f</sub> / F</strong>.
        <ExempleResolu>Pour 100 mL à 0,040 g/L : F = 0,40 / 0,040 = 10, donc V<sub>m</sub> = 100 / 10 = <strong>10 mL</strong>.</ExempleResolu>
        À vous : 100 mL de solution fille à 0,020 g/L.</>,
      tache: { type: 'num', q: 'Quel volume de solution mère (0,40 g/L) faut-il prélever ?', unite: 'mL', vrai: 5, tol: 0.02, affiche: x => String(x), pieges: [[20, 'C’est le facteur de dilution F. Le volume à prélever vaut V_f / F.'], [0.05, 'Attention aux unités : V_f est en mL, donc V_m aussi (100 / 20).']], expl: 'F = 0,40 / 0,020 = 20 ; V_m = 100 / 20 = 5 mL.' } },
    { id: 'regler', titre: 'Essayez avec la pipette et la fiole', depart: () => voir({ Vm: 2, Vf: 100 }),
      texte: <>Choisissez une pipette jaugée et une fiole : la couleur et la concentration de la fille s’affichent.</>,
      tache: { type: 'action', ok: enGuide && D.Vf === 200 && Math.abs(tf - 0.04) < 0.0005, consigne: 'Obtenez 0,040 g/L en fiole de 200 mL (calculez d’abord V_m).' } },
    { id: 'verrerie', titre: 'Pourquoi une pipette jaugée ?', depart: null,
      texte: <>Pour prélever V<sub>m</sub>, on utilise une <strong>pipette jaugée</strong> avec une propipette (jamais à la bouche !). Une <strong>fiole jaugée</strong> sert à compléter le volume.</>,
      tache: { type: 'qcm', q: 'Pourquoi prélève-t-on la solution mère avec une pipette jaugée plutôt qu’avec un bécher ?', options: ['Elle donne le volume avec bien plus de précision', 'Elle va plus vite', 'Elle contient plus de liquide', 'Elle ne se salit pas'], bonne: 0, expl: 'Le bécher n’est gradué qu’à quelques % près ; la pipette jaugée mesure un volume précis. L’incertitude sur V_m se retrouve sur la concentration de la fille.' } },
    { id: 'tableau', titre: 'Préparer toute une échelle', depart: () => voir({}, 'tableau'),
      texte: <>On prépare cinq solutions filles de 100 mL avec des concentrations de plus en plus faibles : une <strong>échelle de teintes</strong>. Calculez F et V<sub>m</sub>, puis choisissez la verrerie (une pipette jaugée n’existe que pour certains volumes), et cliquez sur « Vérifier ».</>,
      tache: { type: 'action', ok: enGuide && tabV && juste, consigne: 'Complétez et vérifiez le tableau : tout doit être juste.' } },
    { id: 'echelle', titre: 'Encadrer une concentration par la couleur', depart: () => { setMystere(0.015); setVoirT(false); setAtelier('echelle'); },
      texte: <>Plus la solution est concentrée, plus elle est <strong>foncée</strong>. En comparant la teinte d’une solution inconnue à l’échelle, on peut <strong>encadrer</strong> sa concentration.
        <ExempleResolu>Si la solution inconnue est plus foncée que Sf3 (0,02 g/L) mais plus claire que Sf2 (0,04 g/L), alors 0,02 g/L {'<'} t {'<'} 0,04 g/L.</ExempleResolu>
        À vous : regardez l’inconnue dans l’atelier « Échelle de teintes ».</>,
      tache: { type: 'qcm', q: 'La solution inconnue est entre quelles solutions de l’échelle ?', options: ['entre Sf4 (0,010) et Sf3 (0,020 g/L)', 'entre Sf5 (0,004) et Sf4 (0,010 g/L)', 'entre Sf3 (0,020) et Sf2 (0,040 g/L)', 'entre Sf2 (0,040) et Sf1 (0,080 g/L)'], bonne: 0, expl: 'Elle est plus foncée que Sf4 et plus claire que Sf3 : 0,010 g/L < t < 0,020 g/L (en réalité 0,015 g/L).' } },
    { id: 'dakin', titre: '★ La liqueur de Dakin', depart: null,
      texte: <>La liqueur de Dakin est un antiseptique coloré par du permanganate. Le fabricant indique que <strong>100,0 mL</strong> de solution contiennent <strong>1,0 mg</strong> de permanganate de potassium. Comparez avec l’échelle de teintes : est-ce cohérent ?</>,
      tache: { type: 'num', q: 'Quelle est la concentration en masse théorique en KMnO₄ de la liqueur de Dakin ? (1,0 mg = 0,0010 g ; 100,0 mL = 0,1000 L)', unite: 'g/L', vrai: T_DAKIN, tol: 0.03, affiche: x => String(x).replace('.', ','), pieges: [[1, 'Convertis : 1,0 mg = 0,0010 g, pas 1 g.'], [0.1, 'Convertis aussi les mL : 100,0 mL = 0,1000 L.']], expl: 't = m / V = 0,0010 g / 0,1000 L = 0,010 g/L : c’est la teinte de Sf4 sur l’échelle.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>On dilue en <strong>ajoutant de l’eau</strong> : la masse de soluté ne change pas, donc <strong>t<sub>m</sub> V<sub>m</sub> = t<sub>f</sub> V<sub>f</sub></strong>.</li>
        <li><strong>F = t<sub>m</sub> / t<sub>f</sub> = V<sub>f</sub> / V<sub>m</sub></strong> ; <strong>V<sub>m</sub> = V<sub>f</sub> / F</strong>.</li>
        <li>On prélève avec une pipette jaugée, on complète en fiole jaugée.</li>
        <li>Une échelle de teintes permet d’encadrer une concentration.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { const d = nouveauDefi(type); setDefi(d); if (type === 'regler') setD({ Vm: 1, Vf: 50 }); if (type === 'encadrer') setMystere(d.mystere); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'volume'); }

  const verrerieTxt = PIPETTES.includes(D.Vm) ? `pipette jaugée de ${D.Vm} mL` : 'pas de pipette jaugée de ce volume : pipette graduée';
  const controlesDilution = (verrou) => (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Fiole jaugée :</span>
        {FIOLES.map(v => <button key={v} onClick={() => setD(x => ({ ...x, Vf: v, Vm: Math.min(x.Vm, v) }))} style={stylePetitBouton(D.Vf === v, '#0f766e')}>{v} mL</button>)}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Pipette jaugée :</span>
        {PIPETTES.map(v => <button key={v} onClick={() => setD(x => ({ ...x, Vm: v }))} disabled={v > D.Vf} style={{ ...stylePetitBouton(D.Vm === v, '#0f766e'), opacity: v > D.Vf ? 0.4 : 1 }}>{v} mL</button>)}</div>
      {!verrou && <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>ou pipette graduée (volume libre) : <strong>{fr(D.Vm, 1)} mL</strong>
        <input type="range" min="0.5" max={Math.min(D.Vf, 50)} step="0.5" value={Math.min(D.Vm, Math.min(D.Vf, 50))} aria-label="Volume prélevé en millilitres" onChange={e => setD(x => ({ ...x, Vm: +e.target.value }))} style={{ width: '100%' }}/></label>}
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 2 }}>Verrerie : {verrerieTxt}</div>
    </div>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Conservation de la masse de soluté</strong> : on n’ajoute que de l’eau distillée, donc t<sub>m</sub> × V<sub>m</sub> = t<sub>f</sub> × V<sub>f</sub>.</li>
      <li><strong>Volume de la fille = volume de la fiole</strong> (ajustement au trait de jauge) ; verrerie jaugée supposée <strong>parfaite</strong> : dans la réalité, la pipette et la fiole ont une incertitude (de l’ordre de quelques ‰ à 1 %).</li>
      <li><strong>Teinte proportionnelle à la concentration</strong> (valable pour de faibles concentrations, avec des tubes identiques). La couleur affichée à l’écran n’est qu’une <strong>représentation</strong> : en TP, l’œil est un détecteur peu précis, d’où un <strong>encadrement</strong> et non une valeur exacte.</li>
      <li><strong>Pipettes jaugées</strong> : on suppose que seuls les volumes 1 ; 2 ; 5 ; 10 ; 20 ; 25 mL existent. Pour un autre volume (2,5 mL par exemple), on utilise une pipette graduée, moins précise.</li>
      <li><strong>Température constante</strong> et <strong>pas d’évolution chimique</strong> du permanganate (en réalité, il peut se dégrader lentement).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const defiRegler = enDefi && defi.type === 'regler', defiEnc = enDefi && defi.type === 'encadrer';
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['diluer', '🧪 Diluer'], ['tableau', '📋 Tableau de l’échelle'], ['echelle', '🎨 Échelle de teintes']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'diluer' && <><SceneDilution D={D}/>{controlesDilution(false)}</>}
      {atelier === 'tableau' && <><Tableau tab={tab} setTab={setTab} verif={tabV} setVerif={setTabV}/>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setTabV(true)} style={styleBouton(true, '#16a34a')}>✓ Vérifier le tableau</button>
          {tabV && juste && <span style={{ color: VERT, fontWeight: 700, fontSize: 14 }}>🎉 Tableau juste !</span>}</div></>}
      {atelier === 'echelle' && <><SceneEchelle mystere={mystere} voirT={voirT}/>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setMystere(alea(MYSTERES)); setVoirT(false); }} style={styleBouton(false)}>🔄 Nouvelle solution inconnue</button>
          <button onClick={() => setVoirT(v => !v)} style={styleBouton(voirT, '#334155')}>{voirT ? 'Cacher' : 'Révéler'} la concentration</button></div></>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Gardez 10 mL de solution mère et passez la fiole de 100 à 200 mL : que devient la concentration ? et le facteur de dilution ?</li>
        <li>Quelle fiole et quelle pipette donnent 0,010 g/L ? Y a-t-il plusieurs solutions ?</li>
        <li>Visez 0,016 g/L avec la pipette graduée : pourquoi ne peut-on pas le faire avec une jaugée ?</li>
        <li>Dans « Échelle de teintes », encadrez la solution inconnue, puis révélez sa concentration. L’encadrement était-il juste ?</li>
        <li>La liqueur de Dakin (0,010 g/L) : à quelle solution de l’échelle ressemble-t-elle ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>diluer = ajouter de l’eau : t<sub>m</sub> V<sub>m</sub> = t<sub>f</sub> V<sub>f</sub></li><li>F = t<sub>m</sub> / t<sub>f</sub> = V<sub>f</sub> / V<sub>m</sub></li><li>plus c’est concentré, plus c’est foncé</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dn-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dn-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dn-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .dn-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Dilution et échelle de teintes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Comment préparer une solution <strong>moins concentrée</strong> à partir d’une solution mère ? Calculez le <strong>facteur de dilution</strong> et le <strong>volume à prélever</strong>, puis utilisez une <strong>échelle de teintes</strong> pour encadrer la concentration d’une solution inconnue.</div>
      <div className={`dn-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancer} D={D}/></div>}
          {defiRegler && <div style={styleBoite}><SceneDilution D={D}/>{controlesDilution(true)}</div>}
          {defiEnc && <div style={styleBoite}><SceneEchelle mystere={defi.mystere} voirT={false}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="dn-l2">{panneauHypo}</div>}
      {enExplore && <div className="dn-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
