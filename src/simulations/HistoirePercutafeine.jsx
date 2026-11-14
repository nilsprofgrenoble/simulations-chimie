import { useState, useEffect, useRef } from "react";
import { useEtatPersistant, Formule } from "../commun";
import {
  CLE_ETAT, CLE_FINS, FINS, PNJ, SCENES, T_FIN, T_S2, CHAMPS_FORMULE, FORMULE_REPLI, etatInitial, texteDe, choixDe, visuelsDe, choisir, valider, estFin,
  horloge, duree, nf, statutBg, resume, bilan, validerFormule, ajouterBase, validerPh,
} from "./percutafeineJeu";

// ====================================================
//  SIM 113 : CONTRE-TYPAGE DE LA PERCUTAFÉINE (BTS Métiers de la Chimie), histoire à choix d'après le TP / CCF4. Hors menu : ?sim=113.
//  Toute la logique est dans percutafeineJeu.js ; ce composant assemble l'affichage (scènes, stations, instruments dessinés).
// ====================================================
const C = { encre: '#1f2937', doux: '#5b6472', bord: '#d5dfeb', accent: '#0f766e', accentFond: '#e6f4f1', ambre: '#b45309', rouge: '#b91c1c', vert: '#15803d', bleu: '#1e3a8a', carte: '#ffffff', fond: '#f8fafc' };
const NIVEAUX = { ok: ['✅', C.vert, 'Maîtrisé'], moyen: ['🟡', C.ambre, 'À consolider'], ko: ['❌', C.rouge, 'À retravailler'], nd: ['⚪', C.doux, 'Non évalué'] };
const TONS = { ok: C.vert, moyen: C.ambre, ko: C.rouge };
const STYLE = `
@keyframes pc-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.pc-scene{animation:pc-in .3s ease-out}
.pc-choix{display:block;width:100%;text-align:left;padding:11px 14px;margin:8px 0;border:1.5px solid ${C.bord};border-radius:12px;background:#fff;color:${C.encre};font:inherit;font-size:16px;line-height:1.45;cursor:pointer}
.pc-choix:hover,.pc-choix:focus-visible{border-color:${C.accent};background:${C.accentFond};outline:none}
.pc-btn{padding:9px 18px;border-radius:10px;border:none;background:${C.bleu};color:#fff;font:inherit;font-weight:700;cursor:pointer}
.pc-btn:disabled{background:#94a3b8;cursor:default}
.pc-btn2{padding:6px 12px;border-radius:10px;border:1.5px solid ${C.bleu};background:#fff;color:${C.bleu};font:inherit;font-weight:600;cursor:pointer}
@media (prefers-reduced-motion:reduce){.pc-scene{animation:none}}
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
      <line x1={x0} y1={yb} x2={x1} y2={yb} stroke="#6b8794" /><path d={d} fill="none" stroke="#5eead4" strokeWidth="2" />
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
const Visuel = ({ v }) => v.type === 'chroma' ? <Chroma v={v} /> : v.type === 'rheo' ? <Rheo v={v} /> : v.type === 'droite' ? <Droite v={v} /> : v.type === 'tableau' ? <Tableau v={v} /> : null;

// ───────────── Briques d'interaction ─────────────
function Calcul({ e, sc, onEtat }) {
  const [saisie, setSaisie] = useState(''), [message, setMessage] = useState('');
  const soumettre = ev => { ev.preventDefault(); const r = valider(e, saisie); onEtat(r.etat); if (!r.juste) setMessage(r.message || ''); };
  return (
    <form onSubmit={soumettre} data-calcul style={{ marginTop: 14, background: '#fffbe6', border: '1.5px dashed #d4b94a', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>🧮 {sc.calcul.q}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={saisie} onChange={ev => setSaisie(ev.target.value)} inputMode="decimal" autoComplete="off" aria-label="Ta réponse" placeholder="?" style={{ width: 130, fontSize: 18, padding: '6px 10px', border: `1.5px solid ${C.bleu}`, borderRadius: 8, fontFamily: 'inherit' }} />
        <span style={{ color: C.doux }}>{sc.calcul.unite}</span>
        <button type="submit" className="pc-btn" disabled={!saisie.trim()}>Vérifier</button>
      </div>
      {message && <div role="alert" style={{ marginTop: 8, color: C.ambre, fontSize: 14.5, lineHeight: 1.5 }}>❌ Pas tout à fait. {message}<br /><span style={{ color: C.doux }}>(Chaque erreur te coûte 5 minutes. À la deuxième, on te donne la valeur et on avance.)</span></div>}
    </form>);
}

function StationFormule({ e, onEtat }) {
  const [fm, setFm] = useState(() => Object.fromEntries(CHAMPS_FORMULE.map(([k]) => [k, ''])));
  const [lignes, setLignes] = useState([]);
  const tent = e.f.fTent || 0;
  const verifier = ev => { ev.preventDefault(); const r = validerFormule(e, fm); setLignes(r.lignes); onEtat(r.etat); };
  const tot = CHAMPS_FORMULE.reduce((s, [k]) => s + (parseFloat(String(fm[k]).replace(',', '.')) || 0), 0);
  return (
    <form onSubmit={verifier} data-formule style={{ marginTop: 14, background: '#fffbe6', border: '1.5px dashed #d4b94a', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>📝 Masses à peser (g)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
        {CHAMPS_FORMULE.map(([k, nom]) => <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 15 }}>{nom}
          <input value={fm[k]} onChange={ev => setFm({ ...fm, [k]: ev.target.value })} inputMode="decimal" autoComplete="off" aria-label={`${nom}, en grammes`} style={{ width: 84, fontSize: 16, padding: '5px 8px', border: `1.5px solid ${C.bleu}`, borderRadius: 8 }} /></label>)}
      </div>
      <div style={{ margin: '8px 0', fontSize: 14, color: C.doux }}>Total : <b style={{ color: Math.abs(tot - 200) <= 4 ? C.vert : C.encre }}>{nf(tot, 1)} g</b></div>
      <button type="submit" className="pc-btn" disabled={tot <= 0}>Vérifier ma formule (3 min)</button>
      {lignes.length > 0 && <ul data-controles style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none', fontSize: 14.5, lineHeight: 1.5 }}>{lignes.map((l, i) => <li key={i} style={{ color: l.ok ? C.vert : C.rouge }}>{l.ok ? '✔' : '✘'} {l.t}</li>)}</ul>}
      {tent >= 3 && <div style={{ marginTop: 10, fontSize: 14 }}>Tu bloques ? <button type="button" className="pc-btn2" onClick={() => onEtat(validerFormule(e, FORMULE_REPLI, true).etat)}>Utiliser la formule de repli (compte comme une aide)</button></div>}
    </form>);
}

function StationPh({ e, onEtat }) {
  const [msg, setMsg] = useState('');
  const add = g => { setMsg(''); onEtat(ajouterBase(e, g)); };
  const valide = () => { const r = validerPh(e); if (r.ok) onEtat(r.etat); else setMsg(r.message); };
  const ph = e.f.phMes;
  return (
    <div data-ph style={{ marginTop: 14, background: '#fffbe6', border: '1.5px dashed #d4b94a', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 10 }}>
        <div><div style={{ fontSize: 13, color: C.doux }}>pH-mètre</div><div style={{ fontSize: 30, fontWeight: 700 }}>{ph == null ? '—' : nf(ph, 2)}</div></div>
        <div><div style={{ fontSize: 13, color: C.doux }}>Trolamine ajoutée</div><div style={{ fontSize: 30, fontWeight: 700 }}>{nf(e.f.trolAdd || 0, 2)} g</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{[0.1, 0.3, 0.5].map(g => <button key={g} type="button" className="pc-btn2" onClick={() => add(g)}>+ {nf(g, 1)} g (2 min)</button>)}
        <button type="button" className="pc-btn" onClick={valide} disabled={!(e.f.trolAdd > 0)}>Valider le pH et mettre en pot (10 min)</button></div>
      {msg && <div role="alert" style={{ marginTop: 8, color: C.ambre, fontSize: 14.5 }}>{msg}</div>}
    </div>);
}

function BarreTemps({ t }) {
  const pct = x => `${Math.min(100, x / T_FIN * 100)}%`;
  return (
    <div style={{ marginBottom: 12 }} aria-label={`${horloge(t)}, il reste ${duree(Math.max(0, T_FIN - t))}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontSize: 14, marginBottom: 4 }}><b>{horloge(Math.min(t, T_FIN))}</b><span style={{ color: C.doux }}>Reste {duree(Math.max(0, T_FIN - t))}</span></div>
      <div style={{ position: 'relative', height: 10, background: '#e2e8f0', borderRadius: 6 }}>
        <div style={{ width: pct(t), height: '100%', background: t > T_FIN * 0.85 ? C.rouge : C.bleu, borderRadius: 6, transition: 'width .4s' }} />
        <div style={{ position: 'absolute', left: pct(T_S2), top: -3, width: 2, height: 16, background: C.ambre }} title="Séance 2" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.doux, marginTop: 2 }}><span>Séance 1 · 13 h</span><span>Séance 2 · 8 h</span><span>11 h 30</span></div>
    </div>);
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

  const cadre = { color: C.encre, background: C.carte, borderRadius: 16, padding: 'clamp(14px, 3vw, 26px)', maxWidth: 900, margin: '0 auto', fontSize: 16, boxShadow: '0 12px 34px rgba(0,0,0,.35)' };
  const boiteFins = (
    <div style={{ fontSize: 13.5, color: C.doux, marginTop: 12 }} data-fins>
      <b style={{ color: C.encre }}>Fins découvertes : {fins.length} / {FINS.length}</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{FINS.map(([id, nom]) => <span key={id} style={{ padding: '2px 9px', borderRadius: 99, border: `1px solid ${fins.includes(id) ? C.accent : C.bord}`, background: fins.includes(id) ? C.accentFond : 'transparent', color: fins.includes(id) ? C.accent : C.doux }}>{fins.includes(id) ? nom : '???'}</span>)}</div>
    </div>);

  if (!e) return (
    <div style={cadre} data-percu="intro"><style>{STYLE}</style>
      <div style={{ fontSize: 12.5, letterSpacing: 2, color: C.accent, fontFamily: 'ui-monospace,monospace' }}>BTS MÉTIERS DE LA CHIMIE · HISTOIRE À CHOIX</div>
      <h2 style={{ margin: '8px 0 14px', fontSize: 'clamp(24px,5.5vw,34px)', color: C.bleu }}>🧴 Contre-typer la Percutaféine</h2>
      <p style={{ lineHeight: 1.6, maxWidth: 720 }}>Tu es technicien·ne de R&amp;D. En 7 h 30 de TP, tu retrouves la formule d'un gel à la caféine, tu en fabriques 200 g, puis tu contrôles sa qualité : extrait sec, rhéologie, caféine (CLHP ou UV), éthanol (CPG). Un entraînement avant le vrai TP.</p>
      <ul style={{ lineHeight: 1.7, color: '#4b5563', paddingLeft: 20 }}>
        <li>Tu joues <b>seul·e</b>, environ <b>45 minutes</b> de temps réel.</li>
        <li>L'étuve et le ballon chauffent pendant que tu travailles : <b>organise-toi</b>, le temps compte.</li>
        <li>Les calculs sont à faire (calculatrice autorisée). Des hypothèses de travail sont affichées avec chaque mesure : lis-les.</li>
        <li><b>{FINS.length} fins</b> possibles ; un imprévu (panne de CLHP) survient dans une partie sur deux.</li>
        <li>Bilan final par compétence du référentiel. Rien n'est transmis à ton enseignant.</li>
      </ul>
      <button type="button" className="pc-btn" data-commencer onClick={() => setEtat(etatInitial())} style={{ fontSize: 17, padding: '11px 24px' }}>Commencer</button>
      {boiteFins}
      <div style={{ fontSize: 12.5, color: C.doux, marginTop: 14 }}>Scénario fictif d'après le TP de contre-typage (BTS MDC, lycée Argouges). Les valeurs mesurées sont des données de scénario calées sur des mesures d'élèves.</div>
    </div>);

  const sc = SCENES[e.scene], choix = choixDe(e), vis = visuelsDe(e), p = PNJ[sc.pnj], s = statutBg(e);
  const avancer = c => setEtat(choisir(e, c));
  const paragraphes = String(texteDe(e)).split('\n').filter(l => l.trim());
  return (
    <div style={cadre} ref={refCadre} data-percu={fin ? 'fin' : 'jeu'}><style>{STYLE}</style>
      <BarreTemps t={e.t} />
      <div key={e.scene} className="pc-scene">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13.5, color: C.doux }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 99, background: p.couleur }} /><span>{sc.lieu} · {p.nom}{p.role ? `, ${p.role.toLowerCase()}` : ''}</span></div>
        <h3 ref={refTitre} tabIndex={-1} data-titre style={{ margin: '6px 0 10px', fontSize: 24, outline: 'none', color: fin ? TONS[sc.fin.ton] : C.encre }}>{sc.titre}</h3>
        {e.f.corrige && <div data-corrige role="status" style={{ background: '#fef3c7', border: '1px solid #f5d98a', borderRadius: 10, padding: '8px 12px', fontSize: 14.5, marginBottom: 10 }}>ℹ️ {e.f.corrige}</div>}
        {paragraphes.map((l, i) => <p key={i} style={{ lineHeight: 1.6, margin: '8px 0', color: l.startsWith('«') ? C.encre : '#374151', fontStyle: l.startsWith('«') ? 'italic' : 'normal' }}>{l}</p>)}
        {sc.formule && <div data-relation style={{ margin: '10px 0' }}>{FORMULES[sc.formule]}</div>}
        {sc.video && <figure data-video style={{ margin: '12px 0' }}><video controls playsInline preload="metadata" aria-label={sc.video.legende} src={`${import.meta.env.BASE_URL}${sc.video.src}`} style={{ width: '100%', maxWidth: 520, maxHeight: '60vh', display: 'block', margin: '0 auto', borderRadius: 10, background: '#0f2430' }} /><figcaption style={{ fontSize: 13, color: C.doux, textAlign: 'center', marginTop: 4 }}>{sc.video.legende}</figcaption></figure>}
        {vis.map((v, i) => <Visuel key={i} v={v} />)}
        {sc.hyp && <details data-hyp open style={{ margin: '10px 0', background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 10, padding: '8px 12px', fontSize: 14.5, lineHeight: 1.5 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses de travail</summary>{sc.hyp}</details>}

        {sc.station === 'formule' && <StationFormule key={e.scene + e.t} e={e} onEtat={setEtat} />}
        {sc.station === 'ph' && <StationPh e={e} onEtat={setEtat} />}
        {sc.calcul && <Calcul key={e.scene} e={e} sc={sc} onEtat={setEtat} />}

        {e.scene === 'hub' && (s.es || s.gel) && <div data-attentes style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: '8px 12px', margin: '10px 0', fontSize: 14.5 }}>{s.es && <div>🔥 {s.es}</div>}{s.gel && <div>⚗️ {s.gel}</div>}</div>}
        {!sc.calcul && !sc.station && choix.map((c, i) => (
          <button key={i} type="button" className="pc-choix" data-choix={i} onClick={() => avancer(c)}>{c.t}{c.d && <div style={{ fontSize: 13, color: C.doux, marginTop: 2 }}>{c.d}</div>}</button>))}

        {fin && (<>
          <h4 style={{ margin: '18px 0 6px' }}>Résumé de tes choix</h4>
          <ul data-resume style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.55 }}>{resume(e).map((t, i) => <li key={i}>{t}</li>)}</ul>
          <h4 style={{ margin: '18px 0 6px' }}>Bilan par compétence</h4>
          <div data-bilan>{bilan(e).map(b => { const [ic, col, lib] = NIVEAUX[b.niveau]; return (
            <div key={b.comp} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: `1px solid ${C.bord}`, fontSize: 14.5, lineHeight: 1.5 }}>
              <span aria-label={lib} title={lib} style={{ fontSize: 18 }}>{ic}</span>
              <div><b>{b.comp}</b> · {b.titre} <span style={{ color: col, fontWeight: 700 }}>({lib})</span><div style={{ color: C.doux }}>{b.texte}</div></div>
            </div>); })}</div>
          <button type="button" className="pc-btn" data-rejouer onClick={() => { setEtat(null); setCarnetOuvert(false); }} style={{ marginTop: 14 }}>Rejouer</button>
          {boiteFins}
        </>)}
      </div>
      <div data-carnet style={{ marginTop: 18, border: `1px dashed ${C.bord}`, borderRadius: 10, padding: '8px 12px' }}>
        <button type="button" onClick={() => setCarnetOuvert(o => !o)} aria-expanded={carnetOuvert} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 700, cursor: 'pointer', padding: 0, color: C.encre }}>📓 Cahier de laboratoire ({e.carnet.length}) {carnetOuvert ? '▾' : '▸'}</button>
        {carnetOuvert && (e.carnet.length ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: C.doux }}>{e.carnet.map((l, i) => <li key={i}>{l}</li>)}</ul> : <div style={{ fontSize: 14, color: C.doux, marginTop: 6 }}>Rien de noté pour l'instant.</div>)}
      </div>
      {!fin && <div style={{ fontSize: 12.5, color: C.doux, marginTop: 10 }}>Ta partie est enregistrée sur cet appareil. <button type="button" onClick={() => { if (window.confirm('Abandonner cette partie et recommencer ?')) { setEtat(null); setCarnetOuvert(false); } }} style={{ background: 'none', border: 'none', padding: 0, color: C.accent, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>Recommencer</button></div>}
    </div>);
}
