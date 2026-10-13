import { useState, useMemo, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite,
  BoutonsModes, ORANGE_GUIDE, lireNombre, exParam } from "../commun";
import { useSuivi } from "../suivi";
import { parDomaine } from "./ordreDomaines";
import { SCENARIOS, COMPETENCES, nouveauGraphique, questions, verifierNum, nb, decimales, fmtAxe } from "./AtelierGraphiqueBanque";

// ====================================================
//  SIM 35 — ATELIER « LIRE UN GRAPHIQUE » (compétence S'approprier)
// ====================================================
// Démarche travaillée : 1. identifier les grandeurs, les unités et l'échelle de chaque axe ; 2. lire une valeur (directe, inverse, à l'origine) ;
// 3. interpréter l'allure ; 4. exploiter : coefficient directeur, extrapolation (et ses limites).

const W = 700, H = 430, ML = 74, MR = 22, MT = 44, MB = 64;

function GrapheLecture({ g, reticule, marques }) {
  const [cur, setCur] = useState(null);
  const ref = useRef(null);
  const { x, y } = g;
  const sx = v => ML + (v - x.min) / (x.max - x.min) * (W - ML - MR);
  const sy = v => H - MB - (v - y.min) / (y.max - y.min) * (H - MT - MB);
  const nx = Math.round((x.max - x.min) / x.minor), ny = Math.round((y.max - y.min) / y.minor);
  const courbe = useMemo(() => {
    const N = 500; let d = '';
    for (let i = 0; i <= N; i++) { const v = x.min + (x.max - x.min) * i / N; d += `${i ? 'L' : 'M'}${sx(v).toFixed(1)},${sy(g.f(v)).toFixed(1)}`; }
    return d;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g]);
  const survol = e => {
    const r = ref.current.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W, py = (e.clientY - r.top) / r.height * H;
    if (px < ML || px > W - MR || py < MT || py > H - MB) { setCur(null); return; }
    setCur({ px, py, vx: x.min + (px - ML) / (W - ML - MR) * (x.max - x.min), vy: y.min + (H - MB - py) / (H - MT - MB) * (y.max - y.min) });
  };
  const ux = x.u ? ` ${x.u}` : '', uy = y.u ? ` ${y.u}` : '';
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', background: 'white', borderRadius: 10, border: `1px solid ${KIT.bord}`, display: 'block' }}
      role="img" aria-label={`Graphique : ${g.titre}`} onMouseMove={reticule ? survol : undefined} onMouseLeave={() => setCur(null)}>
      <defs><clipPath id="atg-clip"><rect x={ML} y={MT} width={W - ML - MR} height={H - MT - MB}/></clipPath></defs>
      <text x={W / 2} y={24} textAnchor="middle" fontSize="15.5" fontWeight="700" fill={KIT.txt}>{g.titre}</text>
      {Array.from({ length: nx + 1 }, (_, i) => { const v = x.min + i * x.minor, maj = i % x.div === 0; return (
        <g key={'x' + i}><line x1={sx(v)} x2={sx(v)} y1={MT} y2={H - MB} stroke={maj ? '#94a3b8' : '#e2e8f0'} strokeWidth={maj ? 1.2 : 0.8}/>
          {maj && <text x={sx(v)} y={H - MB + 18} textAnchor="middle" fontSize="13" fill={KIT.txt}>{fmtAxe(v, x.major)}</text>}</g>); })}
      {Array.from({ length: ny + 1 }, (_, i) => { const v = y.min + i * y.minor, maj = i % y.div === 0; return (
        <g key={'y' + i}><line x1={ML} x2={W - MR} y1={sy(v)} y2={sy(v)} stroke={maj ? '#94a3b8' : '#e2e8f0'} strokeWidth={maj ? 1.2 : 0.8}/>
          {maj && <text x={ML - 8} y={sy(v) + 4.5} textAnchor="end" fontSize="13" fill={KIT.txt}>{fmtAxe(v, y.major)}</text>}</g>); })}
      <rect x={ML} y={MT} width={W - ML - MR} height={H - MT - MB} fill="none" stroke={KIT.txt2} strokeWidth="1.6"/>
      <text x={(ML + W - MR) / 2} y={H - 14} textAnchor="middle" fontSize="14.5" fontWeight="700" fill={KIT.txt}>{x.sym}{x.u ? ` (${x.u})` : ''}</text>
      <text transform={`translate(18 ${(MT + H - MB) / 2}) rotate(-90)`} textAnchor="middle" fontSize="14.5" fontWeight="700" fill={KIT.txt}>{y.sym}{y.u ? ` (${y.u})` : ''}</text>
      <g clipPath="url(#atg-clip)">
        <path d={courbe} fill="none" stroke="#0369a1" strokeWidth={g.sc.type === 'droite' ? 1.8 : 2.6}/>
        {g.pts.map((p, i) => <g key={i}><circle cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill="#dc2626" stroke="white" strokeWidth="1"/></g>)}
      </g>
      {marques.map((m, i) => (m.x < x.min || m.x > x.max || m.y < y.min || m.y > y.max) ? null : (
        <g key={'m' + i}>
          <line x1={sx(m.x)} x2={sx(m.x)} y1={sy(m.y)} y2={H - MB} stroke={ORANGE_GUIDE} strokeWidth="1.8" strokeDasharray="6 4"/>
          <line x1={ML} x2={sx(m.x)} y1={sy(m.y)} y2={sy(m.y)} stroke={ORANGE_GUIDE} strokeWidth="1.8" strokeDasharray="6 4"/>
          <circle cx={sx(m.x)} cy={sy(m.y)} r="6" fill="none" stroke={ORANGE_GUIDE} strokeWidth="2.4"/>
        </g>))}
      {cur && (
        <g pointerEvents="none">
          <line x1={cur.px} x2={cur.px} y1={MT} y2={H - MB} stroke="#475569" strokeWidth="1" strokeDasharray="3 3"/>
          <line x1={ML} x2={W - MR} y1={cur.py} y2={cur.py} stroke="#475569" strokeWidth="1" strokeDasharray="3 3"/>
          <rect x={ML + 8} y={MT + 6} width="230" height="24" rx="5" fill="#0f172a" opacity="0.88"/>
          <text x={ML + 16} y={MT + 22.5} fontSize="12.5" fill="white">{x.sym} ≈ {nb(cur.vx, decimales(x.minor) + 1)}{ux} ; {y.sym} ≈ {nb(cur.vy, decimales(y.minor) + 1)}{uy}</text>
        </g>)}
    </svg>
  );
}

const Verdict = ({ ok, children }) => (
  <div style={{ fontSize: 14, marginTop: 6, fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅ ' : '❌ '}{children}</div>
);
const Correction = ({ children }) => (
  <div style={{ fontSize: 13.5, marginTop: 6, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', color: KIT.txt }}>{children}</div>
);

const nouveau = id => nouveauGraphique(id);

export function SimulationAtelierGraphique() {
  const depart = (() => { const p = exParam(); return SCENARIOS.some(s => s.id === p) ? p : 'manometre'; })();
  const [choix, setChoix] = useState(depart);
  const [g, setG] = useState(() => nouveau(depart));
  const [rep, setRep] = useState({});
  const [chk, setChk] = useState({});
  const [vu, setVu] = useState({});
  const [etp, setEtp] = useState(0);
  const [indice, setIndice] = useState({});
  const [reticule, setReticule] = useState(false);
  const Q = useMemo(() => questions(g), [g]);
  const enDefi = false;
  const defiFini = false;

  const charger = id => { try { document.activeElement?.blur?.(); } catch { /* sans effet */ } setG(nouveau(id)); setRep({}); setChk({}); setVu({}); setEtp(0); setIndice({}); };
  const ok = q => (q.type === 'qcm' ? rep[q.id] === q.bonne : verifierNum(q, lireNombre(rep[q.id])).ok);
  const reussi = Q.every(q => chk[q.id] && ok(q));
  const suivi = useSuivi(`35:${choix}`, reussi);
  const corriger = (id, vue = false) => { (vue ? suivi.vue : suivi.essai)(); setChk(c => ({ ...c, [id]: true })); };

  // ── Carte d'une question (exploration et défi) ──
  const carte = (q, i) => {
    const affichee = enDefi ? defiFini : !!chk[q.id], bon = ok(q);
    const v = q.type === 'num' ? verifierNum(q, lireNombre(rep[q.id])) : null;
    return (
      <div key={q.id} data-q={q.id} style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: KIT.txt, marginBottom: 6 }}>{i + 1}. {q.q}</div>
        {q.type === 'qcm' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {q.options.map((o, k) => (
              <button key={k} data-ok={k === q.bonne ? 'true' : 'false'} disabled={enDefi && defiFini} onClick={() => { setRep(r => ({ ...r, [q.id]: k })); setChk(c => ({ ...c, [q.id]: false })); }}
                style={{ ...styleBouton(rep[q.id] === k, '#0ea5e9'), textAlign: 'left', padding: '6px 10px' }}>{o}</button>))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input aria-label={`Réponse ${q.id}`} data-vrai={q.vrai} placeholder="?" value={rep[q.id] ?? ''} disabled={enDefi && defiFini}
              onChange={e => { setRep(r => ({ ...r, [q.id]: e.target.value })); setChk(c => ({ ...c, [q.id]: false })); }}
              onKeyDown={e => { if (e.key === 'Enter' && !enDefi) corriger(q.id); }}
              style={{ fontSize: 15, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130, color: KIT.txt }}/>
            <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.unite}</span>
          </div>)}
        {indice[q.id] && q.aide && <Correction>💡 {q.aide}</Correction>}
        {affichee && <Verdict ok={bon}>{bon ? 'Bravo !' : 'Pas encore.'}</Verdict>}
        {affichee && !bon && v && v.msg && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{v.msg}</div>}
        {(vu[q.id] || (enDefi && defiFini)) && !bon && <Correction>{q.type === 'num' ? <>Réponse attendue : ≈ {nb(q.vrai, q.dec ?? undefined)} {q.unite} (à ± {nb(q.tol)} près). </> : null}{q.expl}</Correction>}
        {(affichee && bon && !enDefi) && <Correction>{q.expl}</Correction>}
        {!enDefi && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
            <button onClick={() => corriger(q.id)} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>
            {!bon && <button onClick={() => { corriger(q.id, true); setVu(x => ({ ...x, [q.id]: true })); }}
              style={{ fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' }}>voir la correction</button>}
            {q.aide && !indice[q.id] && <button onClick={() => setIndice(x => ({ ...x, [q.id]: true }))} style={stylePetitBouton(false)}>💡 Indice</button>}
            {(bon || vu[q.id]) && chk[q.id] && i === etp && i < Q.length - 1 && <button onClick={() => setEtp(e => e + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Question suivante ▶</button>}
          </div>)}
      </div>);
  };
  const visibles = enDefi ? Q : Q.slice(0, etp + 1);
  const marquesExplore = [
    ...(enDefi && defiFini ? Q.flatMap(q => q.marques || []) : []),
    ...(!enDefi ? Q.filter(q => vu[q.id]).flatMap(q => q.marques || []) : []),
  ];

  const caseReticule = !enDefi && (
    <label style={{ fontSize: 13.5, color: KIT.txt, display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      <input type="checkbox" checked={reticule} onChange={e => setReticule(e.target.checked)}/> Réticule : afficher les coordonnées du pointeur (aide à la lecture)</label>);

  const vueGraphe = (gr, marques) => (
    <div style={{ minWidth: 0 }}>
      <GrapheLecture g={gr} reticule={reticule && !enDefi} marques={marques}/>
      {caseReticule}
    </div>);
  const scen = SCENARIOS.find(s => s.id === g.id);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .atg-l1 { display: grid; align-items: start; gap: 12px; grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr); }
        .atg-g { position: sticky; top: 8px; }
        @media (max-width: 960px) { .atg-l1 { grid-template-columns: minmax(0, 1fr); } .atg-g { position: static; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>S’APP : lire un graphique</h2>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10 }}>Compétence travaillée : <b>S’approprier</b> — identifier grandeurs, unités et échelles, lire des valeurs (parfois dans une autre unité que celle de l’axe), interpréter l’allure d’une courbe.</div>
      <div className="atg-l1">
          <div className="atg-g">
            {!enDefi && (
              <div style={{ ...styleBoite, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 14 }}>Graphique :{' '}
                  <select aria-label="Choix du graphique" value={choix} onChange={e => { setChoix(e.target.value); charger(e.target.value); }}
                    style={{ fontSize: 14, padding: 4, borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}>
                    {parDomaine(SCENARIOS).map(([d, l]) => <optgroup key={d} label={d}>{l.map(s => <option key={s.id} value={s.id}>{s.titre({ liq: 'eau' })}</option>)}</optgroup>)}
                  </select></label>
                <button onClick={() => charger(choix)} style={stylePetitBouton(false)}>🎲 Nouveau graphique</button>
              </div>)}
            {vueGraphe(g, marquesExplore)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibles.map((q, i) => carte(q, i))}
          </div>
        </div>
    </div>
  );
}
