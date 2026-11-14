import { useState, useEffect, useRef } from "react";
import { useEtatPersistant, Formule } from "../commun";
import {
  CLE_ETAT, CLE_FINS, FINS, PNJ, SCENES, T_FIN, T_S2, CHAMPS_FORMULE, FORMULE_REPLI, etatInitial, texteDe, choixDe, visuelsDe, choisir, valider, estFin,
  horloge, duree, nf, statutBg, resume, bilan, validerFormule, ajouterBase, validerPh, OBSERVATIONS, noterObs, chronologie, consequences, fiche,
} from "./percutafeineJeu";

// ====================================================
//  SIM 113 : CONTRE-TYPAGE DE LA PERCUTAFÉINE (BTS Métiers de la Chimie), histoire à choix d'après le TP / CCF4. Hors menu : ?sim=113.
//  Toute la logique est dans percutafeineJeu.js ; ce composant assemble l'affichage (scènes, stations, instruments dessinés).
// ====================================================
const C = { encre: '#1b2733', doux: '#5b6877', bord: '#dbe4ee', accent: '#0f766e', accentFond: '#e7f5f2', ambre: '#b45309', rouge: '#b91c1c', vert: '#15803d', bleu: '#1e3a8a', carte: '#ffffff', fond: '#f4f8fb' };
const NIVEAUX = { ok: ['✅', C.vert, 'Maîtrisé'], moyen: ['🟡', C.ambre, 'À consolider'], ko: ['❌', C.rouge, 'À retravailler'], nd: ['⚪', C.doux, 'Non évalué'] };
const TONS = { ok: C.vert, moyen: C.ambre, ko: C.rouge };
const ICONES = { obs_video: '🎞️', es_prep: '🔥', es_calc1: '📊', eth1: '⚖️', formule: '📝', eq_base: '⚗️', fab_choix: '⚗️', fab_disp: '🧴', rheoC: '🌀', rheoF: '🌀', hplc_m: '📈', cpg_ei: '🔬', cpg_inj: '🔬', uv_ajouts: '🌈', uv_ext: '🌈', hplc_ei: '📈', verdict: '✅', eq_ines: '✅' };
const FOND_LIEU = { 'Paillasse de formulation': '#ecf7ee', 'Salle de chromatographie': '#e8f1fa', 'Bureau': '#f3eefb', 'Bureau de Mme Dubreuil': '#f3eefb', 'Salle de rhéologie': '#fdf1e7', 'Salle des étuves': '#fdf1e7' };
const STYLE = `
@keyframes pc-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pc-scene{animation:pc-in .35s ease-out}
.pc-choix{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;padding:12px 14px;margin:9px 0;border:1.5px solid ${C.bord};border-radius:14px;background:#fff;color:${C.encre};font:inherit;font-size:16px;line-height:1.45;cursor:pointer;transition:border-color .15s,background .15s,transform .15s,box-shadow .15s}
.pc-choix:hover,.pc-choix:focus-visible{border-color:${C.accent};background:${C.accentFond};outline:none;transform:translateY(-1px);box-shadow:0 4px 12px rgba(15,118,110,.12)}
.pc-badge{flex:none;width:26px;height:26px;border-radius:50%;background:${C.fond};border:1.5px solid ${C.bord};color:${C.doux};font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
.pc-choix:hover .pc-badge,.pc-choix:focus-visible .pc-badge{background:${C.accent};border-color:${C.accent};color:#fff}
.pc-tache{display:flex;gap:12px;align-items:flex-start;text-align:left;padding:13px 14px;border:1.5px solid ${C.bord};border-radius:14px;background:#fff;color:${C.encre};font:inherit;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.pc-tache:hover,.pc-tache:focus-visible{border-color:${C.accent};outline:none;transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,118,110,.14)}
.pc-btn{padding:10px 20px;border-radius:12px;border:none;background:${C.bleu};color:#fff;font:inherit;font-weight:700;cursor:pointer;transition:filter .15s}
.pc-btn:hover:not(:disabled){filter:brightness(1.12)}
.pc-btn:disabled{background:#94a3b8;cursor:default}
.pc-btn2{padding:7px 13px;border-radius:10px;border:1.5px solid ${C.bleu};background:#fff;color:${C.bleu};font:inherit;font-weight:600;cursor:pointer}
.pc-btn2:hover{background:#eef2ff}
.pc-bulle{position:relative;background:#fff;border:1.5px solid ${C.bord};border-radius:4px 16px 16px 16px;padding:11px 15px;margin:8px 0;line-height:1.6}
.pc-inst{border-radius:14px;padding:14px 16px;margin-top:14px}
.pc-grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}
@keyframes pc-trace{to{stroke-dashoffset:0}}
@keyframes pc-lueur{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes pc-bulle{0%{transform:translateY(0);opacity:0}20%{opacity:.9}100%{transform:translateY(-22px);opacity:0}}
@media (prefers-reduced-motion:no-preference){.pc-trace{stroke-dasharray:1;stroke-dashoffset:1;animation:pc-trace 2.4s ease-out forwards}.pc-lueur{animation:pc-lueur 1.6s ease-in-out infinite}.pc-bull{animation:pc-bulle 2.2s ease-in infinite}}
.pc-poste{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px 8px;border:2px solid transparent;border-radius:14px;background:transparent;cursor:pointer;font:inherit;color:inherit;position:relative}
.pc-poste:hover,.pc-poste:focus-visible{background:rgba(255,255,255,.55);outline:none}
.pc-poste[aria-pressed="true"]{background:#fff;border-color:${C.accent};box-shadow:0 4px 14px rgba(15,118,110,.2)}
@media (prefers-reduced-motion:reduce){.pc-scene{animation:none}.pc-choix,.pc-tache{transition:none}}
`;

// ───────────── Relations de l'énoncé, en notation mathématique ─────────────
const sub = (a, b) => <msub><mi>{a}</mi><mi>{b}</mi></msub>;
const FORMULES = {
  es: <Formule><mi>ES</mi><mo>=</mo><mfrac><mrow>{sub('m', '2')}<mo>−</mo>{sub('m', '0')}</mrow>{sub('m', '1')}</mfrac><mo>×</mo><mn>100</mn></Formule>,
  hplcEI: <Formule>{sub('C', 'éch')}<mo>=</mo>{sub('C', 'réf')}<mo>×</mo><mfrac>{sub('A', 'benz,réf')}{sub('A', 'caf,réf')}</mfrac><mo>×</mo><mfrac>{sub('A', 'caf,éch')}{sub('A', 'benz,éch')}</mfrac></Formule>,
  ajouts: <Formule><mi>A</mi><mo>=</mo><mi>a</mi><mo>·</mo><mi>C</mi><mo>+</mo><mi>b</mi><mo>⇒</mo>{sub('C', 'x')}<mo>=</mo><mfrac><mi>b</mi><mi>a</mi></mfrac></Formule>,
  ext: <Formule><mi>C</mi><mo>=</mo><mfrac><mi>A</mi><mi>pente</mi></mfrac></Formule>,
  cpgEI: <Formule>{sub('V', 'éch')}<mo>=</mo>{sub('V', 'réf')}<mo>×</mo><mfrac>{sub('%A', 'EI,réf')}{sub('%A', 'EtOH,réf')}</mfrac><mo>×</mo><mfrac>{sub('%A', 'EtOH,éch')}{sub('%A', 'EI,éch')}</mfrac></Formule>,
  gamme: <Formule><mi>r</mi><mo>=</mo><mfrac>{sub('%A', 'EtOH')}{sub('%A', 'EI')}</mfrac><mo>=</mo><mi>a</mi><mo>·</mo><mi>V</mi><mo>+</mo><mi>b</mi></Formule>,
};

// ───────────── Instruments dessinés ─────────────
const Cadre = ({ titre, children }) => (
  <figure style={{ margin: '14px 0', background: '#0f2430', color: '#e2f0f5', borderRadius: 12, padding: '8px 10px 10px' }}>
    <figcaption style={{ fontSize: 12, letterSpacing: 1, color: '#9fc3d1', fontFamily: 'ui-monospace,monospace', marginBottom: 4 }}>{titre}</figcaption>{children}</figure>);

function Chroma({ v }) {
  const W = 360, H = 170, x0 = 28, x1 = 346, yb = 138, X = t => x0 + t / v.tmax * (x1 - x0), sg = v.tmax * 0.017;
  const N = 180, ys = Array.from({ length: N + 1 }, (_, i) => { const t = i / N * v.tmax; return [t, v.pics.reduce((s, p) => s + p.h * Math.exp(-((t - p.tr) ** 2) / (2 * sg * sg)), 0)]; });
  const d = ys.map(([t, y], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${(yb - Math.min(y, 1.15) * 105).toFixed(1)}`).join('');
  return (<Cadre titre={v.titre.toUpperCase()}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${v.titre} : ${v.pics.map(p => `${p.l || 'pic'} à ${p.tr} min`).join(', ')}`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
      <line x1={x0} y1={yb} x2={x1} y2={yb} stroke="#6b8794" /><path d={d} className="pc-trace" pathLength="1" fill="none" stroke="#5eead4" strokeWidth="2" />
      {Array.from({ length: Math.floor(v.tmax) + 1 }, (_, i) => <g key={i}><line x1={X(i)} y1={yb} x2={X(i)} y2={yb + 4} stroke="#6b8794" /><text x={X(i)} y={yb + 16} textAnchor="middle" fontSize="10" fill="#9fc3d1">{i}</text></g>)}
      <text x={x1} y={yb + 30} textAnchor="end" fontSize="10" fill="#9fc3d1">temps (min)</text>
      {v.pics.filter(p => p.l).map((p, i) => <text key={i} x={X(p.tr)} y={yb - Math.min(p.h, 1.15) * 105 - 6} textAnchor="middle" fontSize="11" fill="#fde68a">{p.l}</text>)}
    </svg></Cadre>);
}

function Rheo({ v }) {
  const W = 360, Hh = 150, x0 = 38, x1 = 346, lx = g => x0 + (Math.log10(g) + 1) / 3 * (x1 - x0);
  const etaMax = Math.max(...v.courbes.flatMap(c => c.pts.map(p => p.eta))), sMax = Math.max(...v.courbes.flatMap(c => c.pts.map(p => p.s)));
  const ly = e => 128 - (Math.log10(e) - Math.log10(0.5)) / (Math.log10(etaMax * 1.2) - Math.log10(0.5)) * 110, sy = s => 128 - s / (sMax * 1.1) * 110;
  const tr = (c, f) => c.pts.map((p, i) => `${i ? 'L' : 'M'}${lx(p.g).toFixed(1)} ${f(p).toFixed(1)}`).join('');
  const axes = <><line x1={x0} y1="128" x2={x1} y2="128" stroke="#6b8794" /><line x1={x0} y1="12" x2={x0} y2="128" stroke="#6b8794" />
    {[0.1, 1, 10, 100].map(g => <text key={g} x={lx(g)} y="142" textAnchor="middle" fontSize="10" fill="#9fc3d1">{g}</text>)}</>;
  return (<Cadre titre="RHÉOMÈTRE · COURBES D'ÉCOULEMENT">
    <svg viewBox={`0 0 ${W} ${2 * Hh + 20}`} role="img" aria-label={`Viscosité et contrainte en fonction du gradient de vitesse pour : ${v.courbes.map(c => c.nom).join(', ')}`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
      <g>{axes}<text x="4" y="14" fontSize="10" fill="#9fc3d1">η (Pa·s, échelle log)</text>
        {[1, 10, 100].map(e => <text key={e} x={x0 - 4} y={ly(e) + 3} textAnchor="end" fontSize="9" fill="#9fc3d1">{e}</text>)}
        {v.courbes.map(c => <path key={c.nom} d={tr(c, p => ly(p.eta))} fill="none" stroke={c.couleur === '#1e3a8a' ? '#93c5fd' : '#fcd34d'} strokeWidth="2.2" />)}</g>
      <g transform={`translate(0 ${Hh + 6})`}>{axes}<text x="4" y="14" fontSize="10" fill="#9fc3d1">σ (Pa)</text>
        {[0, Math.round(sMax / 2), Math.round(sMax)].map(s => <text key={s} x={x0 - 4} y={sy(s) + 3} textAnchor="end" fontSize="9" fill="#9fc3d1">{s}</text>)}
        {v.courbes.map(c => <path key={c.nom} d={tr(c, p => sy(p.s))} fill="none" stroke={c.couleur === '#1e3a8a' ? '#93c5fd' : '#fcd34d'} strokeWidth="2.2" />)}
        <text x={x1} y="156" textAnchor="end" fontSize="10" fill="#9fc3d1">γ̇ (s⁻¹, échelle log)</text></g>
    </svg>
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>{v.courbes.map(c => <span key={c.nom}><span style={{ color: c.couleur === '#1e3a8a' ? '#93c5fd' : '#fcd34d' }}>━</span> {c.nom}</span>)}</div>
  </Cadre>);
}

function Droite({ v }) {
  const W = 360, x0 = 40, x1 = 346, xs = v.pts.map(p => p[0]), ys = v.pts.map(p => p[1]), xmax = Math.max(...xs) * 1.05, ymax = Math.max(...ys) * 1.1;
  const X = x => x0 + x / xmax * (x1 - x0), Y = y => 124 - y / ymax * 104, rmax = Math.max(0.0001, ...v.residus.map(Math.abs));
  return (<Cadre titre={v.titre.toUpperCase()}>
    <svg viewBox={`0 0 ${W} 214`} role="img" aria-label={`${v.titre} : ${v.pts.length} points, droite a = ${v.a}, b = ${v.b}, et graphique des résidus`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
      <line x1={x0} y1="124" x2={x1} y2="124" stroke="#6b8794" /><line x1={x0} y1="12" x2={x0} y2="124" stroke="#6b8794" />
      <line x1={X(0)} y1={Y(v.b)} x2={X(xmax)} y2={Y(v.a * xmax + v.b)} stroke="#5eead4" strokeWidth="1.6" />
      {v.pts.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="3.6" fill="#fde68a" />)}
      <text x={x1} y="138" textAnchor="end" fontSize="10" fill="#9fc3d1">{v.xl}</text><text x="4" y="14" fontSize="10" fill="#9fc3d1">{v.yl}</text>
      <text x={x0} y="156" fontSize="10" fill="#9fc3d1">Résidus (mesure − droite)</text>
      <line x1={x0} y1="186" x2={x1} y2="186" stroke="#6b8794" strokeDasharray="3 3" />
      {v.residus.map((r, i) => <circle key={i} cx={X(v.pts[i][0])} cy={186 - r / rmax * 22} r="3.2" fill={Math.abs(r) / rmax > 0.9 ? '#f87171' : '#93c5fd'} />)}
    </svg></Cadre>);
}

function Tableau({ v }) {
  return (<div style={{ margin: '12px 0', overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }}>
    <caption style={{ textAlign: 'left', fontWeight: 700, paddingBottom: 4 }}>{v.titre}</caption>
    <thead><tr>{v.cols.map((c, i) => <th key={i} style={{ border: `1px solid ${C.bord}`, padding: '4px 8px', background: C.fond, textAlign: i ? 'right' : 'left' }}>{c}</th>)}</tr></thead>
    <tbody>{v.lignes.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} style={{ border: `1px solid ${C.bord}`, padding: '4px 8px', textAlign: j ? 'right' : 'left' }}>{c}</td>)}</tr>)}</tbody></table></div>);
}
function BalanceVue({ v }) {
  return (<Cadre titre={v.nom.toUpperCase()}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 6 }}>
      {v.lectures.map(([nom, x]) => <div key={nom} style={{ background: '#0b1b22', borderRadius: 10, padding: '8px 12px', border: '1px solid #2a4654' }}>
        <div style={{ fontSize: 12, color: '#9fc3d1' }}>{nom}</div>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 24, color: '#7ef0d4', letterSpacing: 1 }}>{nf(x, v.dec)} <span style={{ fontSize: 14, color: '#9fc3d1' }}>g</span></div></div>)}
    </div></Cadre>);
}
const Visuel = ({ v }) => v.type === 'balance' ? <BalanceVue v={v} /> : v.type === 'chroma' ? <Chroma v={v} /> : v.type === 'rheo' ? <Rheo v={v} /> : v.type === 'droite' ? <Droite v={v} /> : v.type === 'tableau' ? <Tableau v={v} /> : null;


// ───────────── Briques d'interaction ─────────────
const inst = { background: '#fffaf0', border: '1.5px solid #ecd9a6' };
function Avatar({ pnj, taille = 40 }) {
  const p = PNJ[pnj];
  return <span aria-hidden="true" style={{ flex: 'none', width: taille, height: taille, borderRadius: '50%', background: p.couleur, color: '#fff', fontWeight: 700, fontSize: taille * 0.45, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>{pnj === 'moi' ? '🧑‍🔬' : p.nom.replace(/^Mme /, '').charAt(0)}</span>;
}

function Calcul({ e, sc, onEtat }) {
  const [saisie, setSaisie] = useState(''), [message, setMessage] = useState('');
  const soumettre = ev => { ev.preventDefault(); const r = valider(e, saisie); onEtat(r.etat); if (!r.juste) setMessage(r.message || ''); };
  return (
    <form onSubmit={soumettre} data-calcul className="pc-inst" style={inst}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>🧮 {sc.calcul.q}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={saisie} onChange={ev => setSaisie(ev.target.value)} inputMode="decimal" autoComplete="off" aria-label="Ta réponse" placeholder="?" style={{ width: 130, fontSize: 18, padding: '7px 11px', border: `1.5px solid ${C.bleu}`, borderRadius: 10, fontFamily: 'inherit', background: '#fff' }} />
        <span style={{ color: C.doux }}>{sc.calcul.unite}</span>
        <button type="submit" className="pc-btn" disabled={!saisie.trim()}>Vérifier</button>
      </div>
      {message && <div role="alert" style={{ marginTop: 10, color: C.ambre, fontSize: 14.5, lineHeight: 1.5 }}>Pas tout à fait. {message}<br /><span style={{ color: C.doux }}>(Chaque essai te coûte 5 minutes. Au deuxième, un collègue refait le calcul avec toi et on avance.)</span></div>}
    </form>);
}

function StationFormule({ e, onEtat }) {
  const [fm, setFm] = useState(() => Object.fromEntries(CHAMPS_FORMULE.map(([k]) => [k, ''])));
  const [lignes, setLignes] = useState([]);
  const verifier = ev => { ev.preventDefault(); const r = validerFormule(e, fm); setLignes(r.lignes); onEtat(r.etat); };
  const tot = CHAMPS_FORMULE.reduce((s, [k]) => s + (parseFloat(String(fm[k]).replace(',', '.')) || 0), 0);
  return (
    <form onSubmit={verifier} data-formule className="pc-inst" style={inst}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>📝 Masses à peser pour environ 200 g (en g)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 8 }}>
        {CHAMPS_FORMULE.map(([k, nom]) => <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 15, background: '#fff', border: `1px solid ${C.bord}`, borderRadius: 10, padding: '6px 10px' }}>{nom}
          <input value={fm[k]} onChange={ev => setFm({ ...fm, [k]: ev.target.value })} inputMode="decimal" autoComplete="off" aria-label={`${nom}, en grammes`} style={{ width: 84, fontSize: 16, padding: '5px 8px', border: `1.5px solid ${C.bleu}`, borderRadius: 8, textAlign: 'right' }} /></label>)}
      </div>
      <div style={{ margin: '10px 0', fontSize: 14.5, color: C.doux }}>Total : <b style={{ color: C.encre, fontSize: 17 }}>{nf(tot, 1)} g</b></div>
      <button type="submit" className="pc-btn" disabled={tot <= 0}>Valider ma formule</button>
      {lignes.length > 0 && <div data-controles role="status" style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.5, color: C.ambre }}>{lignes.map((l, i) => <div key={i}>{l.t}</div>)}</div>}
    </form>);
}

function StationPh({ e, onEtat }) {
  const add = g => onEtat(ajouterBase(e, g));
  const ph = e.f.phMes, reprise = e.scene === 'ph2';
  return (
    <div data-ph className="pc-inst" style={inst}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ background: '#0f2430', color: '#7ef0d4', borderRadius: 12, padding: '8px 16px', minWidth: 130 }}><div style={{ fontSize: 12, color: '#9fc3d1', letterSpacing: 1 }}>pH-MÈTRE</div><div style={{ fontSize: 32, fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>{ph == null ? '—' : nf(ph, 2)}</div></div>
        <div style={{ background: '#0f2430', color: '#fde68a', borderRadius: 12, padding: '8px 16px', minWidth: 150 }}><div style={{ fontSize: 12, color: '#9fc3d1', letterSpacing: 1 }}>TROLAMINE AJOUTÉE</div><div style={{ fontSize: 32, fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>{nf(e.f.trolAdd || 0, 2)} g</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{[0.1, 0.3, 0.5].map(g => <button key={g} type="button" className="pc-btn2" onClick={() => add(g)}>+ {nf(g, 1)} g (2 min)</button>)}
        <button type="button" className="pc-btn" onClick={() => onEtat(validerPh(e).etat)}>{reprise ? 'Valider et remettre en pot (15 min)' : 'Valider et mettre en pot (10 min)'}</button></div>
    </div>);
}

function StationObs({ e, onEtat }) {
  const [sel, setSel] = useState([]);
  const bascule = id => setSel(x => x.includes(id) ? x.filter(i => i !== id) : [...x, id]);
  return (
    <div data-obs className="pc-inst" style={inst}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>📓 Qu'as-tu observé ? (coche ce que tu notes dans ton cahier)</div>
      {OBSERVATIONS.map(([id, t]) => <label key={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 4px', fontSize: 15.5, cursor: 'pointer' }}><input type="checkbox" checked={sel.includes(id)} onChange={() => bascule(id)} style={{ marginTop: 4, width: 18, height: 18 }} />{t}</label>)}
      <button type="button" className="pc-btn" style={{ marginTop: 10 }} onClick={() => onEtat(noterObs(e, sel))}>Noter dans mon cahier (5 min)</button>
    </div>);
}


// ───────────── La paillasse : cinq postes de travail illustrés ─────────────
const POSTES = [
  { id: 'etuve', nom: 'Étuve et balance', vers: ['es_balance', 'es_prep', 'es_calc1'] },
  { id: 'bureau', nom: 'Bureau', vers: ['eth1', 'formule', 'eq_ines', 'verdict'] },
  { id: 'formulation', nom: 'Formulation', vers: ['eq_base', 'fab_choix', 'fab_disp', 'obs_video'] },
  { id: 'rheo', nom: 'Rhéologie', vers: ['rheoC', 'rheoF'] },
  { id: 'chroma', nom: 'Chromatographie, UV', vers: ['hplc_m', 'hplc_ei', 'cpg_ei', 'cpg_inj', 'uv_ajouts', 'uv_ext'] },
];
const posteDe = vers => (POSTES.find(p => p.vers.includes(vers)) || POSTES[1]).id;
function Dessin({ id, actif, termine }) {
  const T = '#334155', L = '#cbd5e1', O = '#f59e0b';
  const cadre = { width: 92, height: 68, display: 'block' };
  if (id === 'etuve') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="14" y="8" width="56" height="46" rx="5" fill="#e2e8f0" stroke={T} strokeWidth="2" />
    <rect x="22" y="16" width="40" height="28" rx="3" fill={actif ? '#fb923c' : termine ? '#86efac' : '#94a3b8'} className={actif ? 'pc-lueur' : undefined} stroke={T} strokeWidth="1.5" />
    <circle cx="78" cy="18" r="5" fill={actif ? O : '#cbd5e1'} stroke={T} /><rect x="74" y="28" width="9" height="3" fill={T} />
    <rect x="62" y="60" width="32" height="6" rx="2" fill={T} /><rect x="68" y="52" width="20" height="8" fill="#f1f5f9" stroke={T} /><text x="78" y="58.5" textAnchor="middle" fontSize="6" fill={T}>0,0</text></svg>);
  if (id === 'bureau') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="22" y="8" width="46" height="32" rx="3" fill="#f1f5f9" stroke={T} strokeWidth="2" /><rect x="27" y="13" width="36" height="22" fill="#bae6fd" />
    <path d="M30 30 L38 22 L45 27 L55 17" fill="none" stroke="#0369a1" strokeWidth="2" /><rect x="40" y="40" width="10" height="7" fill={T} /><rect x="30" y="47" width="30" height="5" rx="2" fill={L} stroke={T} />
    <rect x="70" y="36" width="20" height="26" rx="2" fill="#fff" stroke={T} /><path d="M74 44h12M74 50h12M74 56h8" stroke={L} strokeWidth="2" /></svg>);
  if (id === 'formulation') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="14" y="58" width="60" height="8" rx="2" fill={T} /><circle cx="44" cy="42" r="17" fill="#e0f2fe" stroke={T} strokeWidth="2" /><path d="M29 44 Q44 36 59 44" fill="#7dd3fc" opacity=".8" />
    <rect x="40" y="8" width="8" height="14" fill={L} stroke={T} /><path d="M44 8 V2" stroke={T} strokeWidth="2" />
    {actif && [0, 1, 2].map(i => <circle key={i} className="pc-bull" style={{ animationDelay: `${i * .7}s` }} cx={37 + i * 7} cy="48" r="2" fill="#fff" stroke="#0369a1" strokeWidth=".8" />)}
    <rect x="80" y="30" width="10" height="28" rx="2" fill="#bbf7d0" stroke={T} /></svg>);
  if (id === 'rheo') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="30" y="8" width="36" height="12" rx="2" fill={L} stroke={T} strokeWidth="2" /><rect x="44" y="20" width="8" height="18" fill={T} /><path d="M32 40 H64 L56 46 H40 Z" fill="#94a3b8" stroke={T} /><rect x="22" y="50" width="52" height="14" rx="3" fill="#e2e8f0" stroke={T} strokeWidth="2" />
    <circle cx="80" cy="30" r="9" fill="#fff" stroke={T} strokeWidth="2" /><path d="M80 30 L85 25" stroke="#b91c1c" strokeWidth="2" /></svg>);
  return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="12" y="10" width="46" height="12" rx="2" fill="#e2e8f0" stroke={T} strokeWidth="1.5" /><rect x="12" y="25" width="46" height="12" rx="2" fill="#e2e8f0" stroke={T} strokeWidth="1.5" /><rect x="12" y="40" width="46" height="12" rx="2" fill="#e2e8f0" stroke={T} strokeWidth="1.5" />
    <circle cx="50" cy="16" r="2.5" fill="#22c55e" /><circle cx="50" cy="31" r="2.5" fill="#22c55e" />
    <rect x="62" y="10" width="28" height="30" rx="3" fill="#0f2430" stroke={T} strokeWidth="1.5" /><path d="M65 34 L72 34 L75 18 L78 34 L87 34" fill="none" stroke="#5eead4" strokeWidth="1.8" /><path d="M20 62 H80" stroke={L} strokeWidth="3" strokeLinecap="round" /></svg>);
}
function Paillasse({ e, s, choix, onChoix }) {
  const parPoste = Object.fromEntries(POSTES.map(p => [p.id, []]));
  choix.forEach((c, i) => parPoste[posteDe(c.vers)].push({ c, i }));
  const premier = (POSTES.find(p => parPoste[p.id].length) || POSTES[0]).id;
  const [sel, setSel] = useState(null);
  const actuel = sel && parPoste[sel] && parPoste[sel].length ? sel : premier;
  const etuveActive = !!s.es && e.bg.es > e.t, etuveFinie = !!s.es && !etuveActive, gelActif = !!s.gel && e.bg.gel > e.t;
  return (<div data-paillasse>
    <div style={{ background: 'linear-gradient(180deg,#e9eef3 0%,#dde5ec 100%)', borderRadius: 16, padding: '12px 8px 0', border: `1px solid ${C.bord}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(104px,1fr))', gap: 4 }}>
        {POSTES.map(p => { const n = parPoste[p.id].length, actif = (p.id === 'etuve' && etuveActive) || (p.id === 'formulation' && gelActif), fini = (p.id === 'etuve' && etuveFinie);
          return <button key={p.id} type="button" className="pc-poste" aria-pressed={actuel === p.id} onClick={() => setSel(p.id)} aria-label={`${p.nom}, ${n} tâche${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''}${actif ? ', un appareil tourne' : ''}`}>
            <Dessin id={p.id} actif={actif} termine={fini} />
            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>{p.nom}</span>
            {n > 0 && <span aria-hidden="true" style={{ position: 'absolute', top: 2, right: 6, minWidth: 20, height: 20, borderRadius: 10, background: C.accent, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{n}</span>}
            {(actif || fini) && <span aria-hidden="true" style={{ fontSize: 11.5, color: actif ? C.ambre : C.vert, fontWeight: 700 }}>{actif ? (p.id === 'etuve' ? `encore ${duree(e.bg.es - e.t)}` : `encore ${duree(e.bg.gel - e.t)}`) : 'terminé'}</span>}
          </button>; })}
      </div>
      <div aria-hidden="true" style={{ height: 14, margin: '4px -8px 0', borderRadius: '0 0 16px 16px', background: 'repeating-linear-gradient(90deg,#8a6a4c 0 22px,#7d5f43 22px 24px)', borderTop: '3px solid #5d452f' }} />
    </div>
    <div className="pc-grille" style={{ marginTop: 12 }}>{(parPoste[actuel] || []).map(({ c, i }) => (
      <button key={i} type="button" className="pc-tache" data-choix={i} onClick={() => onChoix(c)}><span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden="true">{ICONES[c.vers] || '▪️'}</span><span><b style={{ fontSize: 16 }}>{c.t}</b>{c.d && <span style={{ display: 'block', fontSize: 13.5, color: C.doux, marginTop: 3, lineHeight: 1.4 }}>{c.d}</span>}</span></button>))}
      {!(parPoste[actuel] || []).length && <div style={{ color: C.doux, fontSize: 14.5 }}>Rien à faire à ce poste pour l'instant.</div>}</div>
  </div>);
}

// ───────────── Le film de la journée (fin de partie) ─────────────
function Film({ e }) {
  const ch = chronologie(e), W = 680, x0 = 120, x1 = 664, X = t => x0 + t / T_FIN * (x1 - x0), tmax = Math.min(e.t, T_FIN);
  const rangs = [['Toi (actif)', ch.actif, '#1e3a8a'], ['Étuve', ch.etuve, '#f59e0b'], ['Dispersion gel', ch.gel, '#7c3aed'], ['Attente subie', ch.attentes, '#dc2626']];
  const barres = a => a.map((b, i) => { const t0 = b.t0, t1 = b.t1 ?? b.t1; return <rect key={i} x={X(t0)} y="0" width={Math.max(2, X(Math.min(t1, T_FIN)) - X(t0))} height="18" rx="3" />; });
  const ticks = [0, 60, 120, 180, 240, 300, 360, 420].map(t => [t, t < T_S2 ? `${13 + t / 60} h` : `${8 + (t - T_S2) / 60} h`]);
  return (<figure data-film style={{ margin: '8px 0' }}>
    <svg viewBox={`0 0 ${W} 170`} width="100%" role="img" aria-label="Frise horaire de ta journée : ton travail actif, l'étuve, la dispersion du gel et les attentes subies" style={{ display: 'block', background: C.fond, borderRadius: 12, border: `1px solid ${C.bord}` }}>
      {rangs.map(([nom, a, col], r) => <g key={nom} transform={`translate(0 ${14 + r * 30})`}><text x="8" y="13" fontSize="12" fill={C.encre}>{nom}</text><rect x={x0} y="0" width={x1 - x0} height="18" rx="3" fill="#e8eef4" /><g fill={col}>{barres(a)}</g></g>)}
      <line x1={X(T_S2)} y1="8" x2={X(T_S2)} y2="136" stroke={C.ambre} strokeDasharray="4 3" strokeWidth="1.5" />
      <rect x={X(tmax)} y="8" width={Math.max(0, x1 - X(tmax))} height="128" fill="#fff" opacity=".6" />
      {ticks.map(([t, l]) => <g key={t}><line x1={X(t)} y1="136" x2={X(t)} y2="141" stroke={C.doux} /><text x={X(t)} y="154" fontSize="11" textAnchor="middle" fill={C.doux}>{l}</text></g>)}
      <text x={X(T_S2) + 4} y="10" fontSize="10" fill={C.ambre}>séance 2</text>
    </svg>
    <figcaption style={{ fontSize: 13.5, color: C.doux, marginTop: 6, lineHeight: 1.5 }}>Un technicien efficace lance d'abord les opérations longues (étuve, dispersion du Carbopol), puis prépare calculs, rhéologie du témoin et analyses pendant qu'elles tournent. Tes attentes subies : <b>{duree(e.f.attente || 0)}</b>.</figcaption>
  </figure>);
}
function Conseq({ e }) {
  const L = consequences(e);
  if (!L.length) return null;
  return (<div data-conseq style={{ display: 'grid', gap: 8 }}>{L.map((c, i) => <div key={i} style={{ display: 'flex', gap: 10, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '9px 12px', background: '#fff', fontSize: 14.5, lineHeight: 1.5 }}>
    <span aria-hidden="true" style={{ color: C.accent, fontWeight: 700 }}>→</span><div><b>{c.cause}</b>{c.quand && <span style={{ color: C.doux }}> ({c.quand})</span>} : {c.effet}.</div></div>)}</div>);
}
function Fiche({ e }) {
  const [copie, setCopie] = useState(false), txt = fiche(e).join('\n');
  const copier = async () => { try { await navigator.clipboard.writeText(txt); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* copie indisponible */ } };
  return (<div data-fiche style={{ border: `1.5px dashed ${C.bord}`, borderRadius: 12, padding: '10px 14px', background: '#fff' }}>
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}>{txt}</pre>
    <button type="button" className="pc-btn2" style={{ marginTop: 8 }} onClick={copier}>{copie ? 'Copié' : 'Copier ma fiche'}</button></div>);
}

function BarreTemps({ t }) {
  const pct = x => `${Math.min(100, x / T_FIN * 100)}%`, fin = t > T_FIN * 0.85;
  return (
    <div style={{ marginBottom: 14, background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '10px 14px' }} aria-label={`${horloge(t)}, il reste ${duree(Math.max(0, T_FIN - t))}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}><b style={{ fontSize: 16 }}>🕐 {horloge(Math.min(t, T_FIN))}</b><span style={{ fontSize: 14, color: fin ? C.rouge : C.doux, fontWeight: fin ? 700 : 400 }}>Reste {duree(Math.max(0, T_FIN - t))}</span></div>
      <div style={{ position: 'relative', height: 10, background: '#dbe4ee', borderRadius: 6 }}>
        <div style={{ width: pct(t), height: '100%', background: fin ? C.rouge : C.accent, borderRadius: 6, transition: 'width .4s' }} />
        <div style={{ position: 'absolute', left: pct(T_S2), top: -3, width: 3, height: 16, borderRadius: 2, background: C.ambre }} title="Début de la séance 2" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.doux, marginTop: 3 }}><span>Séance 1 · 13 h</span><span>Séance 2 · 8 h</span><span>11 h 30</span></div>
    </div>);
}

// Instruments qui tournent pendant que l'élève travaille
function Instruments({ e, s }) {
  if (!s.es && !s.gel) return null;
  const carte = (icone, nom, fin, dureeMax, txt) => {
    const r = Math.max(0, fin - e.t), p = Math.max(0, Math.min(1, 1 - r / dureeMax));
    return <div key={nom} style={{ background: r > 0 ? '#fff7ed' : '#ecfdf3', border: `1.5px solid ${r > 0 ? '#fdba74' : '#86d9a5'}`, borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700, fontSize: 15 }}><span>{icone} {nom}</span><span style={{ color: r > 0 ? C.ambre : C.vert }}>{r > 0 ? `encore ${duree(r)}` : 'terminé'}</span></div>
      <div style={{ height: 7, background: 'rgba(0,0,0,.08)', borderRadius: 4, margin: '8px 0 5px', overflow: 'hidden' }}><div style={{ width: `${p * 100}%`, height: '100%', background: r > 0 ? '#f59e0b' : '#22c55e', transition: 'width .4s' }} /></div>
      <div style={{ fontSize: 13, color: C.doux }}>{txt}</div></div>; };
  return <div data-attentes className="pc-grille" style={{ margin: '4px 0 14px' }}>
    {s.es && carte('🔥', 'Étuve à 105 °C', e.bg.es, 60, 'Extrait sec en cours')}
    {s.gel && carte('⚗️', 'Dispersion du gel', e.bg.gel, 90, 'Le Carbopol se disperse')}</div>;
}

function Dialogue({ sc, paragraphes, p }) {
  return <div>{paragraphes.map((l, i) => l.startsWith('«') || /^[A-ZÉÈÀ][\w'’ éèêàùçî-]* : «/.test(l) ?
    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '10px 0' }}><Avatar pnj={sc.pnj} /><div className="pc-bulle" style={{ flex: 1, margin: 0, borderColor: p.couleur + '66', background: p.couleur + '0d' }}>{l}</div></div>
    : <p key={i} style={{ lineHeight: 1.65, margin: '10px 0', color: '#334155' }}>{l}</p>)}</div>;
}

export function SimulationHistoirePercutafeine() {
  const [etat, setEtat] = useEtatPersistant(CLE_ETAT, null);
  const [fins, setFins] = useEtatPersistant(CLE_FINS, []);
  const [carnetOuvert, setCarnetOuvert] = useState(false);
  const refTitre = useRef(null), refCadre = useRef(null);
  const e = etat && SCENES[etat.scene] ? etat : null, fin = !!e && estFin(e.scene);
  useEffect(() => { if (e) refTitre.current?.focus({ preventScroll: true }); }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (e && typeof window !== 'undefined' && refCadre.current) { try { window.scrollTo(0, Math.max(0, refCadre.current.getBoundingClientRect().top + window.scrollY - 8)); } catch { /* sans défilement */ } } }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (fin && !fins.includes(e.scene)) setFins([...fins, e.scene]); }, [fin, e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps

  const cadre = { color: C.encre, background: C.carte, borderRadius: 20, padding: 'clamp(14px, 3vw, 28px)', maxWidth: 920, margin: '0 auto', fontSize: 16, boxShadow: '0 14px 40px rgba(0,0,0,.38)' };
  const boiteFins = (
    <div style={{ fontSize: 13.5, color: C.doux, marginTop: 14 }} data-fins>
      <b style={{ color: C.encre }}>Fins découvertes : {fins.length} / {FINS.length}</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{FINS.map(([id, nom]) => <span key={id} style={{ padding: '3px 10px', borderRadius: 99, border: `1px solid ${fins.includes(id) ? C.accent : C.bord}`, background: fins.includes(id) ? C.accentFond : 'transparent', color: fins.includes(id) ? C.accent : C.doux }}>{fins.includes(id) ? nom : '???'}</span>)}</div>
    </div>);

  if (!e) return (
    <div style={cadre} data-percu="intro"><style>{STYLE}</style>
      <div style={{ background: 'linear-gradient(135deg,#0f4c5c,#0b2f3a)', color: '#fff', borderRadius: 16, padding: 'clamp(16px,4vw,28px)', marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, letterSpacing: 2, color: '#7ef0d4', fontFamily: 'ui-monospace,monospace' }}>BTS MÉTIERS DE LA CHIMIE · HISTOIRE À CHOIX</div>
        <h2 style={{ margin: '8px 0 10px', fontSize: 'clamp(26px,6vw,38px)', color: '#fff', lineHeight: 1.15 }}>🧴 Contre-typer la Percutaféine</h2>
        <p style={{ margin: 0, lineHeight: 1.6, maxWidth: 640, color: '#d7eef2' }}>Tu es technicien·ne de R&amp;D. En 7 h 30 de TP, tu retrouves la formule d'un gel à la caféine, tu en fabriques 200 g, puis tu contrôles sa qualité.</p>
      </div>
      <div className="pc-grille" style={{ marginBottom: 14 }}>
        {[['⏱️', 'Environ 45 min', 'Tu joues seul·e, sur un temps de TP simulé.'], ['🔥', 'Le temps compte', "L'étuve et le ballon chauffent pendant que tu travailles."], ['🧮', 'Calculs et choix libres', 'Aucune alerte : tes choix ont des conséquences que tu verras plus loin.'], ['🏁', `${FINS.length} fins possibles`, 'Un imprévu (panne de CLHP) survient dans une partie sur deux.']].map(([ic, t, d]) => <div key={t} style={{ display: 'flex', gap: 12, background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '11px 14px' }}><span style={{ fontSize: 24 }}>{ic}</span><div><b>{t}</b><div style={{ fontSize: 14, color: C.doux }}>{d}</div></div></div>)}
      </div>
      <button type="button" className="pc-btn" data-commencer onClick={() => setEtat(etatInitial())} style={{ fontSize: 17, padding: '12px 28px' }}>Commencer</button>
      {boiteFins}
      <div style={{ fontSize: 12.5, color: C.doux, marginTop: 14 }}>Bilan final par compétence du référentiel. Rien n'est transmis à ton enseignant. Scénario fictif d'après le TP de contre-typage (BTS MDC, lycée Argouges) ; les valeurs mesurées sont des données de scénario calées sur des mesures d'élèves.</div>
    </div>);

  const sc = SCENES[e.scene], choix = choixDe(e), vis = visuelsDe(e), p = PNJ[sc.pnj], s = statutBg(e);
  const avancer = c => setEtat(choisir(e, c));
  const paragraphes = String(texteDe(e)).split('\n').filter(l => l.trim() && !(e.scene === 'hub' && /^(🔥|⚗️)/.test(l)));
  const hub = e.scene === 'hub', lettre = i => String.fromCharCode(65 + i);
  return (
    <div style={cadre} ref={refCadre} data-percu={fin ? 'fin' : 'jeu'}><style>{STYLE}</style>
      <BarreTemps t={e.t} />
      <div key={e.scene} className="pc-scene">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: C.doux, background: FOND_LIEU[sc.lieu] || C.fond, borderRadius: 99, padding: '4px 12px 4px 6px' }}>
          <Avatar pnj={sc.pnj} taille={24} /><span>{sc.lieu} · {p.nom}</span></div>
        {fin && <div style={{ marginTop: 10, borderRadius: 14, padding: '14px 18px', background: TONS[sc.fin.ton] + '14', border: `1.5px solid ${TONS[sc.fin.ton]}55` }}><div style={{ fontSize: 12, letterSpacing: 1.5, color: TONS[sc.fin.ton], fontWeight: 700 }}>FIN DU TP</div>
          <h3 ref={refTitre} tabIndex={-1} data-titre style={{ margin: '2px 0 0', fontSize: 'clamp(22px,5vw,28px)', outline: 'none', color: TONS[sc.fin.ton] }}>{sc.titre}</h3></div>}
        {!fin && <h3 ref={refTitre} tabIndex={-1} data-titre style={{ margin: '10px 0 6px', fontSize: 'clamp(21px,4.5vw,26px)', outline: 'none', color: C.encre }}>{sc.titre}</h3>}
        {e.f.corrige && <div data-corrige role="status" style={{ background: '#fef3c7', border: '1px solid #f5d98a', borderRadius: 12, padding: '9px 13px', fontSize: 14.5, margin: '8px 0' }}>🤝 {e.f.corrige}</div>}
        <Dialogue sc={sc} paragraphes={paragraphes} p={p} />
        {sc.formule && <div data-relation style={{ margin: '12px 0', background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '8px 12px', overflowX: 'auto' }}>{FORMULES[sc.formule]}</div>}
        {sc.video && <figure data-video style={{ margin: '12px 0' }}><video controls playsInline preload="metadata" aria-label={sc.video.legende} src={`${import.meta.env.BASE_URL}${sc.video.src}`} style={{ width: '100%', maxWidth: 520, maxHeight: '60vh', display: 'block', margin: '0 auto', borderRadius: 14, background: '#0f2430', boxShadow: '0 6px 18px rgba(0,0,0,.2)' }} /><figcaption style={{ fontSize: 13, color: C.doux, textAlign: 'center', marginTop: 6 }}>{sc.video.legende}</figcaption></figure>}
        {vis.map((v, i) => <Visuel key={i} v={v} />)}
        {sc.hyp && <details data-hyp open style={{ margin: '12px 0', background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '9px 14px', fontSize: 14.5, lineHeight: 1.55 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses de travail</summary>{sc.hyp}</details>}

        {sc.station === 'formule' && <StationFormule key={e.scene + e.t} e={e} onEtat={setEtat} />}
        {sc.station === 'ph' && <StationPh e={e} onEtat={setEtat} />}
        {sc.station === 'obs' && <StationObs e={e} onEtat={setEtat} />}
        {sc.calcul && <Calcul key={e.scene} e={e} sc={sc} onEtat={setEtat} />}

        {hub && <Paillasse e={e} s={s} choix={choix} onChoix={avancer} />}
        {!hub && !sc.calcul && !sc.station && choix.map((c, i) => (
          <button key={i} type="button" className="pc-choix" data-choix={i} onClick={() => avancer(c)}><span className="pc-badge" aria-hidden="true">{lettre(i)}</span><span>{c.t}{c.d && <span style={{ display: 'block', fontSize: 13.5, color: C.doux, marginTop: 3 }}>{c.d}</span>}</span></button>))}

        {fin && (<>
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Résumé de tes choix</h4>
          <ul data-resume style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.6 }}>{resume(e).map((t, i) => <li key={i}>{t}</li>)}</ul>
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Le film de ta journée</h4>
          <Film e={e} />
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Tes choix et leurs conséquences</h4>
          <Conseq e={e} />
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Bilan par compétence</h4>
          <div data-bilan className="pc-grille">{bilan(e).map(b => { const [ic, col, lib] = NIVEAUX[b.niveau]; return (
            <div key={b.comp} style={{ display: 'flex', gap: 10, padding: '10px 12px', border: `1px solid ${C.bord}`, borderLeft: `5px solid ${col}`, borderRadius: 12, fontSize: 14.5, lineHeight: 1.5, background: '#fff' }}>
              <span aria-label={lib} title={lib} style={{ fontSize: 20 }}>{ic}</span>
              <div><b>{b.comp}</b> · {b.titre} <span style={{ color: col, fontWeight: 700 }}>({lib})</span><div style={{ color: C.doux }}>{b.texte}</div></div>
            </div>); })}</div>
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Ta fiche de fabrication</h4>
          <Fiche e={e} />
          <button type="button" className="pc-btn" data-rejouer onClick={() => { setEtat(null); setCarnetOuvert(false); }} style={{ marginTop: 16 }}>Rejouer</button>
          {boiteFins}
        </>)}
      </div>
      <div data-carnet style={{ marginTop: 20, border: `1.5px dashed ${C.bord}`, borderRadius: 14, padding: '10px 14px', background: C.fond }}>
        <button type="button" onClick={() => setCarnetOuvert(o => !o)} aria-expanded={carnetOuvert} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 700, cursor: 'pointer', padding: 0, color: C.encre }}>📓 Cahier de laboratoire ({e.carnet.length}) {carnetOuvert ? '▾' : '▸'}</button>
        {carnetOuvert && (e.carnet.length ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6, color: C.doux }}>{e.carnet.map((l, i) => <li key={i}>{l}</li>)}</ul> : <div style={{ fontSize: 14, color: C.doux, marginTop: 6 }}>Rien de noté pour l'instant.</div>)}
      </div>
      {!fin && <div style={{ fontSize: 12.5, color: C.doux, marginTop: 10 }}>Ta partie est enregistrée sur cet appareil. <button type="button" onClick={() => { if (window.confirm('Abandonner cette partie et recommencer ?')) { setEtat(null); setCarnetOuvert(false); } }} style={{ background: 'none', border: 'none', padding: 0, color: C.accent, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>Recommencer</button></div>}
    </div>);
}
