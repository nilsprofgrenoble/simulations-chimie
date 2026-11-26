import { useState, useRef } from "react";
import { KIT, styleBouton, stylePetitBouton, styleBoite, Section, LigneMesure, avecIndices } from "../commun";
import { NB } from "./Distillation";
import * as M from "./conductimetrieAllureModele";
import { SceneAllure } from "./conductimetrieAllureSchemas";

// ====================================================
//  Exploration de la sim 257 : on SIMULE le dosage. Le volume de titrant est versé par paliers ; à chaque palier on lit σ au conductimètre (valeur diluée), on la corrige
//  de la dilution (σ' = σ × (V0 + V) / V0) et le point se place sur le graphique. Puis on choisit les points de chaque branche, on modélise par deux droites (moindres carrés)
//  et l'intersection donne le volume équivalent. Les points proches de l'équivalence (courbe arrondie) sont à écarter.
//  Hypothèses du modèle : voir conductimetrieAllureModele.js (dilution réelle, arrondi gaussien de 0,9 mL, bruit de mesure de 0,5 % optionnel).
// ====================================================
const COL = { bleu: '#0369a1', vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b' };
const COUL_G = ['#0369a1', '#15803d', '#7c3aed'];
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sci = (v, d = 1) => { const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; const [m, e] = Number(v).toExponential(d).split('e'); return `${m.replace('.', ',')}×10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const pasNice = m => (m > 150 ? 50 : m > 60 ? 20 : m > 30 ? 10 : m > 12 ? 5 : 2);

// ---------- graphique σ' = f(V) : points, zones de modélisation glissables, droites, intersection ----------
//  bornes : { 1: [a, b] | null, 2: [a, b] | null } en mL ; actif : droite en cours de délimitation (1 ou 2) ; onBornes(nouvellesBornes)
const X0 = 56, PX = 13.2, vDe = xv => Math.max(0, Math.min(M.V_BURETTE, (xv - X0) / PX));
function GraphiqueDosage({ pts, fits, VEm, yMax, montrerSm, bornes, actif, onBornes, onCree }) {
  const X = v => X0 + PX * v, Y = s => 216 - 196 * Math.min(Math.max(s, 0), yMax) / yMax;
  const Yl = s => 216 - 196 * s / yMax;     // sans écrêtage : les droites sortent du cadre (coupées par le clipPath) sans se déformer
  const svgRef = useRef(null), drag = useRef(null);
  const pas = pasNice(yMax), grad = []; for (let g = 0; g <= yMax + 1e-9; g += pas) grad.push(g);
  const vDuPointeur = e => { const r = svgRef.current.getBoundingClientRect(); return vDe((e.clientX - r.left) * 400 / r.width); };
  const arrondi = v => Math.round(v * 10) / 10;
  const debut = e => {
    const v = vDuPointeur(e), tol = 11 / PX;
    for (const k of [1, 2]) { const b = bornes[k]; if (!b) continue;
      for (const cote of [0, 1]) if (Math.abs(b[cote] - v) < tol) { drag.current = { k, cote }; svgRef.current.setPointerCapture(e.pointerId); return; } }
    drag.current = { k: actif, cote: 1, ancre: arrondi(v) };
    onBornes({ ...bornes, [actif]: [arrondi(v), arrondi(v)] });
    svgRef.current.setPointerCapture(e.pointerId);
  };
  const bouge = e => {
    const d = drag.current; if (!d) return;
    const v = arrondi(vDuPointeur(e)), b = bornes[d.k] || [v, v];
    if (d.ancre != null) onBornes({ ...bornes, [d.k]: [Math.min(d.ancre, v), Math.max(d.ancre, v)] });
    else { const n = [...b]; n[d.cote] = v; onBornes({ ...bornes, [d.k]: [Math.min(n[0], n[1]), Math.max(n[0], n[1])] }); if (n[0] > n[1]) d.cote = 1 - d.cote; }
  };
  const fin = e => {
    const d = drag.current; drag.current = null; if (!d) return;
    try { svgRef.current.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
    const b = bornes[d.k]; if (b && b[1] - b[0] < 0.3) onBornes({ ...bornes, [d.k]: null }); else if (d.ancre != null && onCree) onCree(d.k);
  };
  const ligne = (d, c, i) => {
    if (!d) return null;
    const dessus = pts.filter(p => p.g === i + 1).map(p => p.VB), x0 = Math.min(...dessus), x1 = Math.max(...dessus);
    const seg = (a, b) => `${X(a).toFixed(1)},${Yl(d.a * a + d.b).toFixed(1)} ${X(b).toFixed(1)},${Yl(d.a * b + d.b).toFixed(1)}`;
    return <g key={i}><polyline points={seg(0, M.V_BURETTE)} fill="none" stroke={c} strokeWidth="1.8" strokeDasharray="5 4" opacity="0.8"/>
      <polyline points={seg(x0, x1)} fill="none" stroke={c} strokeWidth="3.2"/></g>;
  };
  return (
    <svg ref={svgRef} viewBox="0 0 400 270" onPointerDown={debut} onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin}
      style={{ width: '100%', maxWidth: 560, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, touchAction: 'pan-y', cursor: 'crosshair', userSelect: 'none' }} role="img"
      aria-label={`Graphique de σ' (conductivité corrigée de la dilution) en fonction du volume de titrant versé. ${pts.length} points mesurés. On délimite par glisser-déposer la zone de points de chaque droite.${VEm != null ? ` Les deux droites se coupent à ${nbf(VEm, 2)} mL.` : ''}`}>
      <defs><clipPath id="al-clip"><rect x="56" y="20" width="330" height="196"/></clipPath></defs>
      <rect x="56" y="20" width="330" height="196" fill="#f8fafc" stroke="#cbd5e1"/>
      {grad.map(g => <g key={g}><line x1="56" y1={Y(g)} x2="386" y2={Y(g)} stroke="#e2e8f0"/><text x="50" y={Y(g) + 5} fontSize="15" textAnchor="end" fill="#0f172a">{g}</text></g>)}
      {[0, 5, 10, 15, 20, 25].map(v => <g key={v}><line x1={X(v)} y1="20" x2={X(v)} y2="216" stroke="#eef2f7"/><line x1={X(v)} y1="216" x2={X(v)} y2="222" stroke="#0f172a"/><text x={X(v)} y="240" fontSize="15" textAnchor="middle" fill="#0f172a">{v}</text></g>)}
      <text x="56" y="14" fontSize="15" fill={COL.gris}>σ' (mS·m⁻¹)</text>
      <text x="386" y="263" fontSize="15" textAnchor="end" fill={COL.gris}>volume de titrant versé V (mL)</text>
      {[1, 2].map(k => bornes[k] && <rect key={'z' + k} x={X(bornes[k][0])} y="20" width={Math.max(1, X(bornes[k][1]) - X(bornes[k][0]))} height="196" fill={COUL_G[k]} opacity={k === actif ? 0.2 : 0.12}/>)}
      <g clipPath="url(#al-clip)">
        {fits.map((d, i) => ligne(d, COUL_G[i + 1], i))}
        {VEm != null && VEm >= 0 && VEm <= M.V_BURETTE && <line x1={X(VEm)} y1="20" x2={X(VEm)} y2="216" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/>}
        {montrerSm && pts.map(p => <circle key={'m' + p.id} cx={X(p.VB)} cy={Y(p.sm)} r="4" fill="white" stroke="#64748b" strokeWidth="1.8"/>)}
        {pts.map(p => <circle key={p.id} cx={X(p.VB)} cy={Y(p.sp)} r="5.6" fill={COUL_G[p.g]} stroke="#fff" strokeWidth="1.4"/>)}
      </g>
      {[1, 2].map(k => bornes[k] && [0, 1].map(c => <g key={`h${k}${c}`} style={{ cursor: 'ew-resize' }}>
        <line x1={X(bornes[k][c])} y1="20" x2={X(bornes[k][c])} y2="216" stroke={COUL_G[k]} strokeWidth="2.4"/>
        <rect x={X(bornes[k][c]) - 5} y="104" width="10" height="34" rx="5" fill="#fff" stroke={COUL_G[k]} strokeWidth="2.4"/>
        <line x1={X(bornes[k][c]) - 1.5} y1="112" x2={X(bornes[k][c]) - 1.5} y2="130" stroke={COUL_G[k]} strokeWidth="1.4"/><line x1={X(bornes[k][c]) + 1.5} y1="112" x2={X(bornes[k][c]) + 1.5} y2="130" stroke={COUL_G[k]} strokeWidth="1.4"/></g>))}
      {[1, 2].map(k => bornes[k] && <text key={'t' + k} x={(X(bornes[k][0]) + X(bornes[k][1])) / 2} y="196" fontSize="14" fontWeight="700" textAnchor="middle" fill={COUL_G[k]} stroke="#f8fafc" strokeWidth="3.5" paintOrder="stroke">droite {k}</text>)}
      {VEm != null && VEm >= 0 && VEm <= M.V_BURETTE && <text x={X(VEm) + (X(VEm) > 270 ? -6 : 6)} y="36" fontSize="15" fontWeight="700" textAnchor={X(VEm) > 270 ? 'end' : 'start'} fill={COL.orange} stroke="#f8fafc" strokeWidth="4" paintOrder="stroke">V<tspan fontSize="11" dy="3">E</tspan><tspan dy="-3"> = {nbf(VEm, 1)} mL</tspan></text>}
    </svg>);
}

export function ExplorationDosage({ aEssayer, retenir, panneauHypo, sectionLambda, reduit }) {
  const [ti, setTi] = useState({ t: 'fortSoude', cA: 0.040, eau: M.EAU_DEFAUT });
  const [pas, setPas] = useState(1);
  const [pts, setPts] = useState([]);                 // { id, VB, sm }
  const [bornes, setBornes] = useState({ 1: null, 2: null }), [actif, setActif] = useState(1);   // zones de modélisation (mL)
  const [bruit, setBruit] = useState(true), [montrerSm, setMontrerSm] = useState(false), [coule, setCoule] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, table: false });
  const idSuiv = useRef(1), minuteur = useRef(null);
  const { t, cA, eau } = ti, T = M.TITRAGES[t], VE = M.volumeEquivalent(t, cA), Vd = M.Vdepart(eau), F = v => M.facteurDilution(v, eau);
  const vb = pts.length ? Math.max(...pts.map(p => p.VB)) : 0;
  const dedans = (v, k) => bornes[k] && v >= bornes[k][0] - 1e-6 && v <= bornes[k][1] + 1e-6;
  const groupe = v => (dedans(v, 1) ? 1 : dedans(v, 2) ? 2 : 0);
  const lignes = pts.map(p => ({ ...p, sp: p.sm * F(p.VB), g: groupe(p.VB) })).sort((a, b) => a.VB - b.VB);
  const mesure = v => { const s = M.sigmaMesuree(t, cA, v, eau); return bruit ? Math.max(0, s * (1 + Math.max(-2, Math.min(2, gauss())) * 0.005)) : s; };
  const reinit = f => { setPts([]); setBornes({ 1: null, 2: null }); setTi(s => ({ ...s, ...f })); };
  const ajouter = liste => {
    setPts(s => [...s, ...liste.map(v => ({ id: idSuiv.current++, VB: Number(v.toFixed(3)), sm: mesure(v) }))]);
    setCoule(true); clearTimeout(minuteur.current); minuteur.current = setTimeout(() => setCoule(false), 1400);
  };
  const suivant = pts.length === 0 ? 0 : Number((vb + pas).toFixed(3));
  const peutVerser = suivant <= M.V_BURETTE + 1e-9 && !pts.some(p => Math.abs(p.VB - suivant) < 1e-6);
  const toutVerser = () => { const l = []; for (let v = pts.length ? suivant : 0; v <= M.V_BURETTE + 1e-9; v += pas) l.push(Number(v.toFixed(3))); if (l.length) ajouter(l); };
  const g1 = lignes.filter(p => p.g === 1).map(p => ({ x: p.VB, y: p.sp })), g2 = lignes.filter(p => p.g === 2).map(p => ({ x: p.VB, y: p.sp }));
  const d1 = M.regression(g1), d2 = M.regression(g2), VEm = d1 && d2 ? M.abscisseIntersection(d1, d2) : null;
  const sigmaLue = pts.length ? lignes.find(p => p.VB === vb)?.sm ?? M.sigmaMesuree(t, cA, 0, eau) : M.sigmaMesuree(t, cA, 0, eau);
  const lecture = `${nbf(sigmaLue, sigmaLue >= 100 ? 0 : 1)} mS/m`;
  const yM = Math.max(M.sigma(t, cA, 0, eau), M.sigma(t, cA, M.V_BURETTE, eau), M.sigmaEquivalence(t, cA, eau)) * 1.12, st = pasNice(yM), yMax = Math.max(st * 2, Math.ceil(yM / st) * st);

  // ---------- diagnostic de la modélisation ----------
  const messages = [];
  if (g1.length >= 1 && g2.length >= 1 && (g1.length < 3 || g2.length < 3) && !(d1 && d2 && g1.length >= 3 && g2.length >= 3)) messages.push('Prenez au moins 3 points sur chaque branche : une droite tracée avec 2 points passe forcément par eux, on ne vérifie rien.');
  const proches = lignes.filter(p => p.g > 0 && M.dansZoneArrondi(p.VB, VE));
  if (d1 && d2 && proches.length) messages.push(`${proches.length > 1 ? 'Les points' : 'Le point'} à V = ${proches.map(p => nbf(p.VB, 1)).join(' ; ')} mL ${proches.length > 1 ? 'sont' : 'est'} trop près de l’équivalence : la courbe y est arrondie (réaction non totale, mélange d’ions). Retirez-${proches.length > 1 ? 'les' : 'le'} des droites : on modélise loin de la rupture de pente.`);
  if (d1 && d2 && VEm != null) {
    const mal1 = lignes.filter(p => p.g === 1 && p.VB > VEm), mal2 = lignes.filter(p => p.g === 2 && p.VB < VEm);
    if (mal1.length || mal2.length) messages.push('Un point d’une branche est du mauvais côté du volume équivalent trouvé : vérifiez que la droite 1 regroupe les points avant la rupture de pente et la droite 2 ceux d’après.');
  }
  if (d1 && d2 && VEm == null) messages.push('Les deux droites sont parallèles : choisissez des points de part et d’autre de la rupture de pente.');
  const ecartVE = VEm != null ? VEm - VE : null;
  const cAm = VEm != null ? T.cB * VEm / M.VA0 : null;

  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };

  const reglages = (
    <div style={styleBoite}>
      <div style={titreCarte}>Le titrage à simuler</div>
      <div style={aide}>Choisissez ce qui est dosé (changer un réglage efface les points). Vous versez ensuite le titrant par paliers : à chaque palier, σ est lue puis placée sur le graphique.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Titrage
        <select value={t} onChange={e => reinit({ t: e.target.value })} style={{ ...menu, marginTop: 2 }}>{M.ORDRE_TITRAGES.map(id => <option key={id} value={id}>{M.TITRAGES[id].titre}</option>)}</select></label>
      <Section titre={<span><span style={{ display: 'block' }}>Concentration et eau ajoutée</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{avecIndices(`c_A = ${sci(cA, 1)} mol/L · ${eau} mL d’eau`)}</span></span>} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Concentration de l’espèce titrée c<sub>A</sub>
          <select value={cA} onChange={e => reinit({ cA: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>{M.CONC_A.map(v => <option key={v} value={v}>{sci(v, 1)} mol/L</option>)}</select></label>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Eau ajoutée avant le titrage
          <select value={eau} onChange={e => reinit({ eau: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>{M.EAU.map(v => <option key={v} value={v}>{v} mL (volume de départ {M.Vdepart(v)} mL)</option>)}</select></label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: KIT.txt, minHeight: 42 }}>
          <input type="checkbox" checked={bruit} onChange={e => { setPts([]); setBruit(e.target.checked); }} style={{ width: 20, height: 20 }}/>Ajouter une incertitude de mesure (± 0,5 % sur σ)</label>
      </Section>
      <div style={{ ...aide, margin: '8px 0 0' }}>Prise d’essai : {nbf(M.VA0, 1)} mL. Titrant à {nbf(T.cB, 3)} mol/L. Volume de départ V<sub>0</sub> = {nbf(Vd, 0)} mL.</div>
    </div>);
  const verser = (
    <div style={styleBoite}>
      <div style={titreCarte}>Verser le titrant</div>
      <div style={aide}>Chaque appui verse un palier de {T.titrant}, mesure σ au conductimètre et ajoute un point au graphique. Volume déjà versé : <strong>{nbf(vb, 1)} mL</strong>.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Volume d’un palier
        <select value={pas} onChange={e => setPas(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{[0.5, 1, 2].map(v => <option key={v} value={v}>{nbf(v, 1)} mL</option>)}</select></label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" disabled={!peutVerser} onClick={() => ajouter([suivant])} style={{ ...styleBouton(peutVerser, '#0369a1'), minHeight: 42, opacity: peutVerser ? 1 : 0.5 }}>{pts.length === 0 ? 'Mesurer σ avant de verser (V = 0)' : `Verser ${nbf(pas, 1)} mL et mesurer`}</button>
        <button type="button" disabled={!peutVerser} onClick={toutVerser} style={{ ...styleBouton(false), minHeight: 42, opacity: peutVerser ? 1 : 0.5 }}>Verser tout le titrage</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" disabled={!pts.length} onClick={() => setPts(s => s.filter(p => p.VB !== vb))} style={{ ...styleBouton(false), minHeight: 42, opacity: pts.length ? 1 : 0.5 }}>Annuler le dernier point</button>
        <button type="button" disabled={!pts.length} onClick={() => setPts([])} style={{ ...styleBouton(false), minHeight: 42, opacity: pts.length ? 1 : 0.5 }}>Recommencer</button>
      </div>
      {!peutVerser && pts.length > 0 && <div style={{ ...aide, marginTop: 8, marginBottom: 0 }}>La burette est vide (25 mL) : annulez des points ou recommencez.</div>}
    </div>);
  const scene = (
    <div style={styleBoite}>
      <div style={aide}>La burette verse le titrant dans le bécher ; chaque point coloré représente 0,1 mmol d’un ion. Le conductimètre affiche σ <strong>mesurée</strong> : elle baisse aussi par dilution, ce qu’on corrigera sur le graphique.</div>
      <SceneAllure t={t} cA={cA} VB={vb} lecture={lecture} anime={!reduit} coule={coule} montrer={{ equation: true, cellule: true, ions: true, burette: true, legende: true }}/>
    </div>);
  const maj = (k, cote, val) => { const v = Math.max(0, Math.min(M.V_BURETTE, Number(String(val).replace(',', '.')))); if (!isFinite(v)) return;
    const b = bornes[k] ? [...bornes[k]] : [0, v]; b[cote] = v; setBornes(s => ({ ...s, [k]: [Math.min(b[0], b[1]), Math.max(b[0], b[1])] })); };
  const graphe = (
    <div style={styleBoite}>
      <div style={titreCarte}>{avecIndices("σ' = σ × (V₀ + V) / V₀ en fonction du volume versé")}</div>
      <div style={aide}>On trace σ' : la conductivité <strong>corrigée de la dilution</strong> (V<sub>0</sub> = {nbf(Vd, 0)} mL, volume de départ). Sans cette correction, la courbe s’incurve et les portions ne sont plus des droites.</div>
      <div style={{ ...aide, color: KIT.txt, fontWeight: 700 }}>Modéliser : choisissez la droite, puis faites glisser sur le graphique pour délimiter les points à utiliser (poignées pour ajuster).</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[1, 2].map(k => <button key={k} type="button" aria-pressed={actif === k} onClick={() => setActif(k)} style={{ ...stylePetitBouton(actif === k, COUL_G[k]), minHeight: 42 }}>Droite {k} : {k === 1 ? 'avant' : 'après'} la rupture</button>)}
        <button type="button" onClick={() => setBornes({ 1: null, 2: null })} style={{ ...styleBouton(false), minHeight: 42 }}>Effacer les zones</button>
      </div>
      <GraphiqueDosage pts={lignes} fits={[d1, d2]} VEm={VEm} yMax={yMax} montrerSm={montrerSm} bornes={bornes} actif={actif} onBornes={setBornes} onCree={k => setActif(k === 1 && !bornes[2] ? 2 : k)}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, margin: '8px 0' }}>
        {[1, 2].map(k => <div key={k} style={{ fontSize: 13.5, color: KIT.txt }}>
          <div style={{ fontWeight: 700, color: COUL_G[k] }}>Zone de la droite {k} (mL)</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>de
            <input type="number" inputMode="decimal" min="0" max="25" step="0.5" value={bornes[k] ? bornes[k][0] : ''} placeholder="—" aria-label={`Début de la zone de la droite ${k}, en mL`} onChange={e => e.target.value !== '' && maj(k, 0, e.target.value)} style={{ ...menu, width: 84, minHeight: 40 }}/>
            à <input type="number" inputMode="decimal" min="0" max="25" step="0.5" value={bornes[k] ? bornes[k][1] : ''} placeholder="—" aria-label={`Fin de la zone de la droite ${k}, en mL`} onChange={e => e.target.value !== '' && maj(k, 1, e.target.value)} style={{ ...menu, width: 84, minHeight: 40 }}/></div></div>)}
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: KIT.txt, minHeight: 42 }}>
        <input type="checkbox" checked={montrerSm} onChange={e => setMontrerSm(e.target.checked)} style={{ width: 20, height: 20 }}/>Afficher aussi σ non corrigée (ronds gris, avant correction)</label>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13.5, color: KIT.txt }}>
        {[[0, 'point non utilisé'], [1, 'point de la droite 1'], [2, 'point de la droite 2']].map(([g, l]) => <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 6, background: COUL_G[g], display: 'inline-block' }}/>{l}</span>)}
      </div>
    </div>);
  const tableau = (
    <div style={styleBoite}>
      <Section titre={<span><span style={{ display: 'block' }}>Tableau de mesures</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{lignes.length ? `${lignes.length} points · droite 1 : ${g1.length} · droite 2 : ${g2.length}` : 'aucune mesure pour le moment'}</span></span>} ouvert={ouv.table} onBascule={() => setOuv(o => ({ ...o, table: !o.table }))}>
        <div style={aide}>σ' = σ × facteur de dilution, avec facteur = (V<sub>0</sub> + V) / V<sub>0</sub>. La colonne « Droite » indique quels points sont utilisés par la modélisation (selon les zones délimitées sur le graphique).</div>
        {lignes.length === 0 ? <div style={aide}>Versez le titrant pour remplir le tableau.</div> :
          <div style={{ maxHeight: 360, overflow: 'auto', border: `1px solid ${KIT.bord}`, borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: KIT.txt }}>
              <thead><tr style={{ position: 'sticky', top: 0, background: '#f1f5f9', textAlign: 'right' }}>
                <th style={{ padding: '6px 8px' }}>V (mL)</th><th style={{ padding: '6px 8px' }}>σ lue</th><th style={{ padding: '6px 8px' }}>σ'</th><th style={{ padding: '6px 8px', textAlign: 'left' }}>Droite</th></tr></thead>
              <tbody>{lignes.map(p => <tr key={p.id} style={{ borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                <td style={{ padding: '4px 8px', fontWeight: 700 }}>{nbf(p.VB, 1)}</td><td style={{ padding: '4px 8px' }}>{nbf(p.sm, 1)}</td><td style={{ padding: '4px 8px', color: COUL_G[p.g] }}>{nbf(p.sp, 1)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'left', color: COUL_G[p.g], fontWeight: 700 }}>{p.g ? `droite ${p.g}` : '—'}</td></tr>)}</tbody>
            </table></div>}
        <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>σ en mS·m⁻¹ ; σ lue : valeur affichée par le conductimètre.</div>
      </Section>
    </div>);
  const modele = (
    <div style={styleBoite}>
      <div style={titreCarte}>Modélisation affine et volume équivalent</div>
      <div style={aide}>Chaque groupe de points donne une droite σ' = a·V + b (moindres carrés, comme un tableur ou la calculatrice). Le volume équivalent est l’abscisse du point d’intersection des deux droites.</div>
      {[[d1, 1, g1], [d2, 2, g2]].map(([d, i, g]) => <div key={i} style={{ marginBottom: 4 }}>
        <LigneMesure nom={`Droite ${i} (${g.length} points)`} valeur={d ? `σ' = ${nbf(d.a, 2)}·V ${d.b < 0 ? '−' : '+'} ${nbf(Math.abs(d.b), 1)}` : 'choisissez au moins 2 points'} couleur={COUL_G[i]}/>
        {d && <LigneMesure nom="Coefficient R²" valeur={nbf(d.r2, 4)}/>}</div>)}
      {VEm != null && <>
        <LigneMesure nom={avecIndices('Volume équivalent V_E (intersection)')} valeur={`${nbf(VEm, 2)}${NB}mL`} couleur={COL.orange}/>
        <LigneMesure nom={avecIndices('Concentration c_A = c_B × V_E / V_A')} valeur={`${nbf(cAm, 4)}${NB}mol/L`} couleur={COL.orange}/>
        <LigneMesure nom={avecIndices('Référence de la simulation : V_E')} valeur={`${nbf(VE, 2)}${NB}mL`}/>
        <LigneMesure nom={avecIndices('Référence de la simulation : c_A')} valeur={`${nbf(cA, 4)}${NB}mol/L`}/>
        <LigneMesure nom="Écart sur V_E" valeur={`${ecartVE >= 0 ? '+' : '−'}${nbf(Math.abs(ecartVE), 2)}${NB}mL (${nbf(100 * Math.abs(ecartVE) / VE, 1)} %)`} couleur={Math.abs(ecartVE) < 0.15 ? COL.vert : COL.rouge}/>
      </>}
      {messages.map((m, i) => <div key={i} role="status" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px' }}>{m}</div>)}
      {VEm != null && !messages.length && <div role="status" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: COL.vert, fontWeight: 700 }}>Modélisation correcte : points loin de la rupture de pente, deux droites bien définies.</div>}
    </div>);
  return (<>
    <div>{scene}</div>
    <div className="al-ctrl">{reglages}{verser}</div>
    <div>{graphe}</div>
    <div>{tableau}</div>
    <div>{modele}</div>
    <div>{sectionLambda}</div>
    <div>{aEssayer}</div>
    <div>{retenir}</div>
    <div>{panneauHypo}</div>
  </>);
}
