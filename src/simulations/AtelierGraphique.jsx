import { useState, useMemo, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite,
  BoutonsModes, ORANGE_GUIDE, lireNombre } from "../commun";
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
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('atelier-graphique-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [bilan, setBilan] = useEtatPersistant('atelier-graphique-bilan-v1', { defis: 0, cumul: [0, 0, 0, 0], n: [0, 0, 0, 0] });
  const [choix, setChoix] = useState('manometre');
  const [g, setG] = useState(() => nouveau('manometre'));
  const [rep, setRep] = useState({});
  const [chk, setChk] = useState({});
  const [vu, setVu] = useState({});
  const [etp, setEtp] = useState(0);
  const [indice, setIndice] = useState({});
  const [reticule, setReticule] = useState(false);
  const [defiFini, setDefiFini] = useState(false);
  const gG = useState(() => nouveauGraphique('beer', { eps: 2400, l: 1, k: 0.0024 }, [0, 0]))[0];
  const Q = useMemo(() => questions(g), [g]);
  const enDefi = mode === 'defi', enGuide = mode === 'guide';

  const charger = id => { setG(nouveau(id)); setRep({}); setChk({}); setVu({}); setEtp(0); setIndice({}); setDefiFini(false); };
  const changerMode = m => {
    setMode(m);
    if (m === 'defi') { const s = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]; setChoix(s.id); charger(s.id); setReticule(false); }
    else if (m === 'explore') charger(choix);
  };

  const ok = q => (q.type === 'qcm' ? rep[q.id] === q.bonne : verifierNum(q, lireNombre(rep[q.id])).ok);
  const corriger = id => setChk(c => ({ ...c, [id]: true }));
  const scores = () => {
    const s = [0, 0, 0, 0], n = [0, 0, 0, 0];
    Q.forEach(q => { n[q.comp]++; if (ok(q)) s[q.comp]++; });
    return { s, n };
  };
  const verifierDefi = () => {
    if (defiFini) return;
    setDefiFini(true);
    const { s, n } = scores();
    setBilan(b => ({ defis: b.defis + 1, cumul: b.cumul.map((v, i) => v + s[i]), n: (b.n || [0, 0, 0, 0]).map((v, i) => v + n[i]) }));
  };
  const bil = defiFini ? scores() : null;

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
            {!bon && <button onClick={() => { corriger(q.id); setVu(x => ({ ...x, [q.id]: true })); }}
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

  // ── Parcours guidé : étalonnage par spectrophotométrie ──
  const gf = gG.f, k = gG.p.k;
  const O = (txts, bonne) => ({ options: txts, bonne });
  const ETAPES = [
    { id: 'intro', titre: 'Avant de lire une valeur…', texte: <>Un graphique n’est pas qu’une courbe : on y lit des <b>grandeurs</b>, des <b>unités</b> et une <b>échelle</b>. Ici : la droite d’étalonnage d’un spectrophotomètre. Le <b>réticule</b> (case « Réticule » sous le graphique) vous aide à lire des coordonnées.</>,
      tache: { type: 'qcm', q: 'Que regarde-t-on en premier ?', ...O(['Le titre, les grandeurs portées sur les axes et leurs unités', 'La valeur du point le plus haut', 'La couleur de la courbe'], 0), expl: 'Sans savoir ce que représentent les axes (et en quelle unité), une lecture n’a aucun sens.' } },
    { id: 'axe', titre: 'Les axes', texte: 'Lisez le nom de la grandeur et l’unité, écrits le long de chaque axe.',
      tache: { type: 'qcm', q: 'Que représente l’axe horizontal ?', ...O(['La concentration c, en µmol·L⁻¹', 'L’absorbance A (sans unité)', 'La concentration c, en mol·L⁻¹', 'L’absorbance A, en µmol·L⁻¹'], 0), expl: 'c, en µmol·L⁻¹ (et non en mol·L⁻¹ : le facteur 10⁶ comptera plus tard).' } },
    { id: 'echX', titre: 'L’échelle horizontale', texte: 'Les grandes graduations sont numérotées, mais les petits carreaux ne le sont pas : il faut calculer leur valeur.',
      tache: { type: 'num', q: 'Que vaut un petit carreau sur l’axe horizontal ?', unite: 'µmol·L⁻¹', vrai: gG.x.minor, tol: 0.02, pieges: [[gG.x.major, 'C’est l’écart entre deux grandes graduations (50). Combien de petits carreaux entre elles ?']], affiche: v => nb(v), expl: '50 µmol·L⁻¹ divisés en 5 petits carreaux : 10 µmol·L⁻¹ chacun.' } },
    { id: 'echY', titre: 'L’échelle verticale', texte: 'Même méthode sur l’axe vertical : l’échelle n’est pas la même.',
      tache: { type: 'num', q: 'Que vaut un petit carreau sur l’axe vertical ?', unite: '', vrai: gG.y.minor, tol: 0.02, pieges: [[gG.y.major, 'C’est l’écart entre deux grandes graduations (0,2). Combien de petits carreaux entre elles ? (4)']], affiche: v => nb(v), expl: '0,2 divisé en 4 petits carreaux : 0,05 chacun.' } },
    { id: 'lect', titre: 'Lire une valeur', texte: 'On part de l’axe horizontal, on monte jusqu’à la courbe, puis on lit sur l’axe vertical.',
      tache: { type: 'num', q: 'Quelle est l’absorbance A pour c = 150 µmol·L⁻¹ ?', unite: '', vrai: gf(150), tol: 0.07, aide: 'Vous pouvez activer le réticule sous le graphique.', affiche: v => nb(v, 2), expl: 'A ≈ 0,36.' } },
    { id: 'inv', titre: 'Lecture inverse', texte: 'Cette fois on connaît l’ordonnée : on part de l’axe vertical, on va jusqu’à la droite, puis on descend.',
      tache: { type: 'num', q: 'Pour quelle concentration c l’absorbance vaut-elle A = 0,60 ?', unite: 'µmol·L⁻¹', vrai: 0.6 / k, tol: 0.05, affiche: v => nb(v), expl: 'c ≈ 250 µmol·L⁻¹.' } },
    { id: 'prop', titre: 'Proportionnalité', texte: 'Regardez où la droite coupe les axes.',
      tache: { type: 'qcm', q: 'A est-elle proportionnelle à c ?', ...O(['Oui : la droite passe par le point (0 ; 0)', 'Non : la droite ne passe pas par le point (0 ; 0)', 'Oui : toute droite représente une proportionnalité'], 0), expl: 'La droite passe par l’origine : A = k·c. (Une droite qui ne passe pas par l’origine n’est pas une proportionnalité.)' } },
    { id: 'pente', titre: 'Le coefficient directeur', texte: 'Choisissez deux points éloignés sur la droite (par exemple c = 50 et c = 250 µmol·L⁻¹) et calculez Δy / Δx. L’unité est celle de y divisée par celle de x.',
      tache: { type: 'num', q: 'Calculez le coefficient directeur de la droite (utilisez l’écriture 0,0024 ou 2,4e-3).', unite: 'L·µmol⁻¹', vrai: k, tol: 0.06, pieges: [[1 / k, 'Vous avez calculé Δx / Δy : le coefficient directeur est Δy / Δx.'], [k * 1e6, 'C’est la valeur en L·mol⁻¹ ; ici on demande l’unité des axes (L·µmol⁻¹).']], affiche: () => '0,0024 (soit 2,4×10⁻³)', expl: 'a = (0,60 − 0,12) / (250 − 50) = 2,4×10⁻³ L·µmol⁻¹.' } },
    { id: 'penteSI', titre: 'Convertir dans le système international', texte: 'Le coefficient directeur dépend des unités choisies pour les axes. 1 µmol = 10⁻⁶ mol, donc 1 L·µmol⁻¹ = 10⁶ L·mol⁻¹.',
      tache: { type: 'num', q: 'Exprimez ce coefficient en L·mol⁻¹.', unite: 'L·mol⁻¹', vrai: k * 1e6, tol: 0.06, pieges: [[k, 'Vous n’avez pas converti : c est en µmol·L⁻¹, pas en mol·L⁻¹.']], affiche: v => nb(v), expl: 'a = 2,4×10⁻³ L·µmol⁻¹ = 2,4×10³ L·mol⁻¹ : c’est le produit ε·ℓ de la loi de Beer-Lambert.' } },
    { id: 'extra', titre: 'Extrapoler', texte: 'Le graphique s’arrête à 300 µmol·L⁻¹. On prolonge la droite (ou on utilise son équation A = a·c).',
      tache: { type: 'num', q: 'Quelle absorbance attendrait-on pour c = 400 µmol·L⁻¹ ?', unite: '', vrai: gf(400), tol: 0.06, affiche: v => nb(v, 2), expl: 'A = 2,4×10⁻³ × 400 ≈ 0,96.' } },
    { id: 'meff', titre: 'Les limites d’une extrapolation', texte: 'Un résultat obtenu en dehors du domaine mesuré repose sur une hypothèse.',
      tache: { type: 'qcm', q: 'Pourquoi faut-il se méfier d’une extrapolation ?', ...O(['On suppose que la droite continue de la même façon, sans l’avoir vérifié', 'Parce que le calcul est plus compliqué', 'Parce que la valeur obtenue est toujours fausse'], 0), expl: 'À forte concentration, la loi de Beer-Lambert cesse d’être linéaire : la droite ne se prolonge pas indéfiniment.' } },
    { id: 'bravo', titre: 'Bravo !', texte: <>La démarche : <b>1.</b> grandeurs, unités, échelle de chaque axe ; <b>2.</b> lire (directement ou en sens inverse) ; <b>3.</b> repérer l’allure et la proportionnalité ; <b>4.</b> calculer un coefficient directeur dans la bonne unité, extrapoler avec prudence. Entraînez-vous maintenant sur d’autres graphiques.</> },
  ];
  const marquesG = [
    ...(guide.reussies && guide.reussies[4] ? [{ x: 150, y: gf(150) }] : []),
    ...(guide.reussies && guide.reussies[5] ? [{ x: 0.6 / k, y: 0.6 }] : []),
    ...(guide.reussies && guide.reussies[7] ? [{ x: 50, y: gf(50) }, { x: 250, y: gf(250) }] : []),
  ];
  const finParcours = <button onClick={() => changerMode('explore')} style={styleBouton(true, ORANGE_GUIDE)}>S’entraîner ▶</button>;

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
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Atelier : lire un graphique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10 }}>Compétence travaillée : <b>S’approprier</b> — identifier grandeurs, unités et échelles, lire des valeurs, interpréter une courbe.</div>
      {enGuide ? (
        <div className="atg-l1">
          <div className="atg-g">{vueGraphe(gG, marquesG)}</div>
          <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
        </div>
      ) : (
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
            {enDefi && <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>{scen.domaine}</div>}
            {vueGraphe(g, marquesExplore)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibles.map((q, i) => carte(q, i))}
            {enDefi && !defiFini && <div><button onClick={verifierDefi} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button></div>}
            {enDefi && defiFini && bil && (
              <div style={styleBoite}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Bilan par compétence</div>
                {COMPETENCES.map((c, i) => bil.n[i] > 0 && (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ width: 250, fontSize: 14 }}>{c}</span>
                    <div style={{ width: 120, height: 10, background: '#e2e8f0', borderRadius: 5 }}><div style={{ width: `${bil.s[i] / bil.n[i] * 100}%`, height: '100%', borderRadius: 5, background: bil.s[i] === bil.n[i] ? '#16a34a' : bil.s[i] / bil.n[i] >= 0.5 ? '#f59e0b' : '#dc2626' }}/></div>
                    <span style={{ fontSize: 13 }}>{bil.s[i]} / {bil.n[i]}</span>
                  </div>))}
                <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Défis faits sur cet appareil : {bilan.defis}. Les points orange sur le graphique montrent où lire.</div>
                <button onClick={() => { const s = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]; setChoix(s.id); charger(s.id); }} style={{ ...styleBouton(true, '#0ea5e9'), marginTop: 8 }}>Nouveau graphique</button>
              </div>)}
          </div>
        </div>)}
    </div>
  );
}
