import { useState, useEffect, useRef, useMemo } from "react";
import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { Field, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, Curseur, lireProgression } from "../commun";
import { MOLECULES_CLHP, PARAMS_DEFAUT, SEUIL_RS, analyse, signal } from "./clhpModele";

export { MOLECULES_CLHP };

// ====================================================
//  SIM 12 — SIMULATION CLHP (BTS) : chromatographie en phase inverse C18, éluant acétonitrile / eau
//  Modèle de X. Bataille (ENCPB / RNChimie, 2008) — voir clhpModele.js.
//  Interface : vue colonne animée + chromatogramme enregistré en direct + grandeurs lues sur le pic.
// ====================================================

const SIM = 12;
declarerDefis(SIM, [
  ['ordre', 'Prédire l’ordre d’élution'],
  ['facteur', 'Calculer un facteur de rétention'],
  ['separer', 'Séparer deux composés'],
]);

const PALETTE = ['#e63946', '#2a9d8f', '#6a4c93', '#d98e04', '#457b9d', '#2d6a4f', '#c2410c', '#9333ea', '#0891b2', '#be185d', '#65a30d', '#475569'];
const COUL_RS = { ok: '#16a34a', lim: '#d97706', non: '#dc2626' };
const classeRs = R => R >= SEUIL_RS[1] ? 'ok' : R >= SEUIL_RS[0] ? 'lim' : 'non';
const v = (x, d = 2) => (isFinite(x) ? x.toFixed(d) : '—').replace('.', ',');
const TEMPS_MAX_DEFI = 8;                       // min : durée maximale d’analyse du défi « séparer »
const nomsCourts = (m) => m.court || m.nom;
const Ind = ({ children }) => <sub>{children}</sub>;
const TR = <>t<Ind>R</Ind></>;
const T0 = <>t<Ind>0</Ind></>;

function useLargeur(ref) {
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const maj = () => setW(Math.max(280, Math.floor(el.getBoundingClientRect().width)));
    maj();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', maj); return () => window.removeEventListener('resize', maj); }
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

// graine fixe : les mêmes « particules » à chaque affichage
function tirages(nMol, n) {
  let s = 12345;
  const alea = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(alea() || 1e-9)) * Math.cos(2 * Math.PI * alea());
  return Array.from({ length: nMol }, () => Array.from({ length: n }, () => ({ z: gauss(), y: alea(), r: alea() })));
}
const hasard = (a, b, c) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); };

// ---------- vue « colonne » : bandes en marche, molécules libres ou adsorbées ----------
const H_COL = 128;
const rr = (ctx, x, y, w, h, r) => { if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
function dessinerColonne(ctx, dpr, W, { a, frac, hover, couleurs, nonRetenu }, now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H_COL);
  const xL = 74, xR = W - 78, L = xR - xL, y0 = 34, hT = 64, R = 8.6, dy = R * 1.732;
  // tube : éluant (phase mobile)
  ctx.fillStyle = '#e8f1f8'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); rr(ctx, xL, y0, L, hT, 6); ctx.fill(); ctx.stroke();
  // grains de silice greffés C18 (phase stationnaire)
  ctx.save(); ctx.beginPath(); rr(ctx, xL, y0, L, hT, 6); ctx.clip();
  for (let r = 0; r < 4; r++) for (let c = -1; c * 2 * R < L + 2 * R; c++) {
    const cx = xL + R + c * 2 * R + (r % 2 ? R : 0), cy = y0 + R + r * dy;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = '#cbd5e1'; ctx.fill();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  ctx.restore();
  // injecteur et détecteur
  ctx.fillStyle = '#334155'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Injecteur', xL - 34, y0 + 22);
  ctx.beginPath(); ctx.moveTo(xL - 54, y0 + 32); ctx.lineTo(xL - 8, y0 + 32); ctx.lineTo(xL - 15, y0 + 27); ctx.moveTo(xL - 8, y0 + 32); ctx.lineTo(xL - 15, y0 + 37);
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#334155'; ctx.fillText('Détecteur', xR + 36, y0 + 22);
  ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.2;
  ctx.beginPath(); rr(ctx, xR + 10, y0 + 27, 52, 14, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#713f12'; ctx.font = '600 9px system-ui, sans-serif'; ctx.fillText('UV', xR + 36, y0 + 37.5);
  ctx.fillStyle = '#475569'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'left';
  const t = frac * a.tMax;
  ctx.fillText(`t = ${v(t)} min`, xL, 16);
  ctx.textAlign = 'right'; ctx.fillStyle = '#64748b';
  ctx.fillText(W < 560 ? 'éluant · grains C18' : 'éluant (phase mobile) · grains greffés C18 (phase stationnaire)', xR, 16);
  ctx.textAlign = 'left';
  // bandes
  const N = a.col.N, groupes = [];
  if (nonRetenu) groupes.push({ id: 'tm', slot: 11, k: 0, tr: a.col.tm, coul: '#64748b' });
  a.pics.forEach((m, i) => groupes.push({ id: m.id, slot: i % 11, k: m.k, tr: m.tr, coul: couleurs[m.id] }));
  const bucket = Math.floor(now / 160);
  groupes.forEach((g, gi) => {
    const dim = hover != null && hover !== g.id;
    const xb = L * t / g.tr, sx = Math.max(1.8, xb / Math.sqrt(N));
    const ps = PARTICULES[g.slot];
    const pStat = g.k / (1 + g.k);
    ps.forEach((p, j) => {
      let x = xb + sx * p.z; if (x < 0) x = -x;
      if (x >= L) return;
      const stat = hasard(gi, j, bucket) < pStat;
      let y;
      if (stat) { const row = Math.floor(hasard(j, gi, 7) * 4); y = y0 + R + row * dy; }
      else y = y0 + 3 + hasard(j, gi, bucket + 3) * (hT - 6);
      ctx.globalAlpha = dim ? 0.18 : 1;
      ctx.beginPath(); ctx.arc(xL + x, y, stat ? 3.3 : 2.6, 0, 7);
      ctx.fillStyle = g.coul; ctx.fill();
      if (stat) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
  });
}
const PARTICULES = tirages(12, 34);

function ColonneAnim({ a, frac, couleurs, hover, w, nonRetenu }) {
  const ref = useRef(null);
  const etat = useRef({ a, frac, hover, couleurs, nonRetenu });
  useEffect(() => { etat.current = { a, frac, hover, couleurs, nonRetenu }; });
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(H_COL * dpr);
    const ctx = cv.getContext('2d');
    let raf, dernier = 0;
    const boucle = now => {
      raf = requestAnimationFrame(boucle);
      if (now - dernier < 33) return;
      dernier = now;
      dessinerColonne(ctx, dpr, w, etat.current, now);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [w]);
  return <canvas ref={ref} style={{ width: w, height: H_COL, display: 'block', borderRadius: 8, background: 'white' }} role="img"
    aria-label="Coupe de la colonne : les bandes de chaque composé avancent de l’injecteur vers le détecteur"/>;
}

// ---------- chromatogramme (SVG) ----------
function pasTemps(tMax) { return [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find(s => tMax / s <= 8) || 100; }
function Chromato({ a, frac, w, couleurs, hover, setHover, total, indiv, nonRetenu }) {
  const [lect, setLect] = useState(null);                    // { x, t, id } : lecture sous le pointeur
  const h = w < 480 ? 230 : 270, mL = 34, mR = 12, mT = 14, mB = 34;
  const iw = w - mL - mR, ih = h - mT - mB;
  const { tMax, pics, col } = a;
  const N = 360;
  const geo = useMemo(() => {
    const ts = Array.from({ length: N + 1 }, (_, i) => i * tMax / N);
    const sig = pics.map(m => ts.map(t => signal(m, t)));
    const tot = ts.map((_, i) => sig.reduce((s, c) => s + c[i], 0));
    const ymax = Math.max(...tot, 1e-9) * 1.22;
    return { ts, sig, tot, ymax };
  }, [a, tMax, pics]);   // eslint-disable-line react-hooks/exhaustive-deps
  const X = t => mL + t / tMax * iw, Y = s => mT + ih - s / geo.ymax * ih;
  const chemin = (ys, n = ys.length) => ys.slice(0, n).map((s, i) => `${i ? 'L' : 'M'}${X(geo.ts[i]).toFixed(1)},${Y(s).toFixed(1)}`).join('');
  const tCur = frac * tMax, nCur = Math.min(N, Math.floor(frac * N)) + 1;
  const pas = pasTemps(tMax), graduations = [];
  for (let t = 0; t <= tMax + 1e-9; t += pas) graduations.push(Math.round(t * 1000) / 1000);
  // étiquettes des pics, décalées si elles se chevauchent
  const etiq = pics.map((m, i) => ({ m, i, x: X(m.tr), y: Y(Math.max(geo.tot[Math.round(m.tr / tMax * N)] || 0, signal(m, m.tr))) - 7 }));
  etiq.sort((p, q) => p.x - q.x);
  etiq.forEach((e, k) => { if (k && Math.abs(e.x - etiq[k - 1].x) < 76) e.y = Math.min(e.y, etiq[k - 1].y - 14); });

  function pointe(ev) {
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ev.clientX - r.left, t = (px - mL) / iw * tMax;
    if (t < 0 || t > tMax) { setLect(null); setHover(null); return; }
    if (Math.abs(px - X(col.tm)) < 7) { setLect({ x: X(col.tm), t: col.tm, id: 'tm' }); setHover(null); return; }
    let best = null, bd = 1e9;
    pics.forEach(m => { const d = Math.abs(t - m.tr) / m.sigma; if (d < bd && signal(m, t) > 0.04 * geo.ymax) { bd = d; best = m; } });
    if (best && bd < 5) { setLect({ x: X(best.tr), t: best.tr, id: best.id }); setHover(best.id); } else { setLect(null); setHover(null); }
  }
  const mol = lect && lect.id !== 'tm' ? pics.find(m => m.id === lect.id) : null;
  const info = lect && (lect.id === 'tm'
    ? <><strong>{T0} = {v(col.tm)} min</strong><br/>temps mort : un composé non retenu sort à cet instant</>
    : mol && <><strong style={{ color: couleurs[mol.id] }}>{mol.nom}</strong><br/>{TR} = {v(mol.tr)} min · k’ = {v(mol.k)}<br/>W<Ind>½</Ind> = {v(mol.W, 3)} min</>);
  const posInfo = lect ? Math.min(Math.max(lect.x + 12, 4), w - 190) : 0;
  return (
    <div style={{ position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block', touchAction: 'pan-y' }} role="img" aria-label="Chromatogramme : réponse du détecteur en fonction du temps"
        onPointerMove={pointe} onPointerDown={pointe} onPointerLeave={ev => { if (ev.pointerType === 'mouse') { setLect(null); setHover(null); } }}>
        <rect x={mL} y={mT} width={iw} height={ih} fill="white" stroke="#cbd5e1"/>
        {graduations.map(t => <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={mT} y2={mT + ih} stroke="#e2e8f0"/>
          <line x1={X(t)} x2={X(t)} y1={mT + ih} y2={mT + ih + 5} stroke="#475569"/>
          <text x={X(t)} y={mT + ih + 18} textAnchor="middle" fontSize="11" fill="#334155">{String(t).replace('.', ',')}</text></g>)}
        <text x={mL + iw / 2} y={h - 4} textAnchor="middle" fontSize="12" fill="#334155" fontWeight="600">temps t (min)</text>
        <text transform={`translate(11 ${mT + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="#334155">réponse du détecteur (u.a.)</text>
        {nonRetenu && <>
          <line x1={X(col.tm)} x2={X(col.tm)} y1={mT} y2={mT + ih} stroke="#64748b" strokeDasharray="4 3"/>
          <text x={X(col.tm) + 4} y={mT + 11} fontSize="11" fill="#475569">t₀ (composé non retenu)</text></>}
        {indiv && pics.map((m, i) => {
          const dim = hover != null && hover !== m.id;
          return <g key={m.id} opacity={dim ? 0.25 : 1}>
            <path d={`${chemin(geo.sig[i])}L${X(tMax)},${Y(0)}L${X(0)},${Y(0)}Z`} fill={couleurs[m.id]} opacity="0.16"/>
            <path d={chemin(geo.sig[i])} fill="none" stroke={couleurs[m.id]} strokeWidth={hover === m.id ? 3 : 1.8}/></g>;
        })}
        {total && <path d={chemin(geo.tot, nCur)} fill="none" stroke="#0f172a" strokeWidth="1.8" strokeDasharray={indiv ? '5 3' : undefined}/>}
        {indiv && etiq.map(e => <text key={e.m.id} x={Math.min(Math.max(e.x, mL + 30), w - mR - 30)} y={Math.max(e.y, mT + 22)} textAnchor="middle" fontSize="11.5" fontWeight="700"
          fill={couleurs[e.m.id]} stroke="white" strokeWidth="3" paintOrder="stroke">{nomsCourts(e.m)}</text>)}
        <line x1={X(tCur)} x2={X(tCur)} y1={mT} y2={mT + ih} stroke={ORANGE_GUIDE} strokeWidth="1.6" opacity={frac > 0 && frac < 1 ? 1 : 0.55}/>
        {lect && <line x1={lect.x} x2={lect.x} y1={mT} y2={mT + ih} stroke="#0f172a" strokeWidth="1" strokeDasharray="2 3"/>}
        {mol && <circle cx={X(mol.tr)} cy={Y(signal(mol, mol.tr))} r="4.5" fill="white" stroke={couleurs[mol.id]} strokeWidth="2"/>}
      </svg>
      {lect && info && <div style={{ position: 'absolute', left: posInfo, top: 18, background: 'white', border: '1px solid #94a3b8', borderRadius: 6, padding: '4px 8px',
        fontSize: 12.5, color: KIT.txt, pointerEvents: 'none', boxShadow: '0 2px 6px rgba(0,0,0,.15)', maxWidth: 220, lineHeight: 1.45 }}>{info}</div>}
    </div>);
}

// ---------- bloc visuel : colonne + chromatogramme + commandes de lecture ----------
function Visu({ a, couleurs, hover, setHover, lancement, onLancer, nonRetenu, setNonRetenu, total, setTotal }) {
  const cont = useRef(null);
  const w = useLargeur(cont);
  const [frac, setFrac] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [vit, setVit] = useState(1);
  const [vu, setVu] = useState(lancement);
  if (vu !== lancement) { setVu(lancement); setFrac(0); setLecture(true); }
  const enCours = lecture && frac < 1;
  useEffect(() => {
    if (!enCours) return undefined;
    let raf, dernier = null;
    const pas = now => {
      if (dernier == null) dernier = now;
      const dt = (now - dernier) / 1000; dernier = now;
      setFrac(f => Math.min(1, f + dt * vit / 14));
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [enCours, vit]);
  const bar = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 };
  return (
    <div ref={cont}>
      <div style={bar}>
        <button onClick={onLancer} style={styleBouton(true, '#0d6e6e')}>▶ Injecter</button>
        <button onClick={() => { if (frac >= 1) { setFrac(0); setLecture(true); } else setLecture(l => !l); }} style={styleBouton(false)} aria-label={enCours ? 'Pause' : 'Lecture'}>{enCours ? '⏸' : '⏵'}</button>
        <button onClick={() => { setLecture(false); setFrac(1); }} style={styleBouton(false)} title="Aller à la fin de l’analyse">⏭</button>
        <input type="range" min={0} max={1} step={0.002} value={frac} aria-label="Temps écoulé depuis l’injection"
          onChange={e => { setLecture(false); setFrac(parseFloat(e.target.value)); }} style={{ flex: 1, minWidth: 120, accentColor: ORANGE_GUIDE }}/>
        {[0.5, 1, 2].map(x => <button key={x} onClick={() => setVit(x)} style={stylePetitBouton(vit === x, '#334155')}>×{String(x).replace('.', ',')}</button>)}
      </div>
      <ColonneAnim a={a} frac={frac} couleurs={couleurs} hover={hover} w={w} nonRetenu={nonRetenu}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 8px', lineHeight: 1.5 }}>
        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#475569', marginRight: 4 }}/>libre dans l’éluant · {' '}
        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#475569', border: '1.5px solid #0f172a', marginRight: 4 }}/>adsorbé sur un grain.
        La part du temps passée adsorbé est k’/(1 + k’) = 1 − {T0}/{TR}.
      </div>
      <Chromato a={a} frac={frac} w={w} couleurs={couleurs} hover={hover} setHover={setHover} total={total} indiv nonRetenu={nonRetenu}/>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: KIT.txt2, marginTop: 6 }}>
        <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={total} onChange={e => setTotal(e.target.checked)}/> signal total enregistré (ce que voit le détecteur)</label>
        <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={nonRetenu} onChange={e => setNonRetenu(e.target.checked)}/> composé non retenu (repère {T0})</label>
      </div>
    </div>);
}

// ====================================================
//  DÉFIS
// ====================================================
const tire = tab => tab[Math.floor(Math.random() * tab.length)];
function pairesFaisables() {
  const out = [];
  for (let i = 0; i < MOLECULES_CLHP.length; i++) for (let j = i + 1; j < MOLECULES_CLHP.length; j++) {
    const d = Math.abs(MOLECULES_CLHP[i].logP - MOLECULES_CLHP[j].logP);
    if (d < 0.2 || d > 0.6) continue;
    let bons = 0, ok50 = false;
    for (let pct = 5; pct <= 95; pct++) {
      const r = analyse({ ...PARAMS_DEFAUT, pct }, [i, j].map(k => ({ ...MOLECULES_CLHP[k], conc: 1, epsilon: 10 })));
      const bon = r.res[0].R >= SEUIL_RS[1] && r.pics[1].tr <= TEMPS_MAX_DEFI;
      if (bon) bons++;
      if (pct === 50 && bon) ok50 = true;
    }
    if (bons >= 8 && !ok50) out.push([i, j]);
  }
  return out;
}
let PAIRES = null;
function nouveauDefi(type) {
  if (type === 'ordre') {
    let mols; do { mols = [...MOLECULES_CLHP.keys()].sort(() => Math.random() - 0.5).slice(0, 4); const l = mols.map(i => MOLECULES_CLHP[i].logP).sort((x, y) => x - y); if (l.every((x, k) => !k || x - l[k - 1] >= 0.25)) break; } while (true); // eslint-disable-line no-constant-condition
    return { type, mols, pct: tire([35, 45, 55, 65]), reps: { ordre: [] }, verifie: false };
  }
  if (type === 'facteur') {
    const mols = [...MOLECULES_CLHP.keys()].sort(() => Math.random() - 0.5).slice(0, 3);
    return { type, mols, cible: tire(mols), pct: tire([30, 40, 50, 60]), reps: {}, verifie: false };
  }
  if (!PAIRES) PAIRES = pairesFaisables();
  return { type, mols: tire(PAIRES), pct: 50, reps: {}, verifie: false };
}
const TITRES = { ordre: 'Ordre d’élution', facteur: 'Facteur de rétention', separer: 'Séparer deux composés' };

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationCLHP() {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('clhp-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [p, setP] = useState({ ...PARAMS_DEFAUT });
  const maj = (k, x) => setP(q => ({ ...q, [k]: x }));
  const [selected, setSelected] = useState([2, 4]);
  const [customMols, setCustomMols] = useState([]);
  const [newNom, setNewNom] = useState('');
  const [newLogP, setNewLogP] = useState(1.0);
  const [concs, setConcs] = useState({});
  const [epsilons, setEpsilons] = useState({});
  const [showExpData, setShowExpData] = useState(false);
  const [expTr, setExpTr] = useState({});
  const [ouv, setOuv] = useState({ melange: false, eluant: true, tableau: true, hypo: false, plus: false, avance: false });
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const [hover, setHover] = useState(null);
  const [lancement, setLancement] = useState(0);
  const [nonRetenu, setNonRetenu] = useState(true);
  const [total, setTotal] = useState(true);

  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const masque = enDefi && defi.type === 'ordre' && !defi.verifie && !defi.solution;

  // ----- mélange -----
  const idsSel = enDefi ? defi.mols : selected;
  const allMols = [
    ...idsSel.map(i => ({ ...MOLECULES_CLHP[i], id: 'pre_' + i, conc: concs['pre_' + i] ?? 1, epsilon: epsilons['pre_' + i] ?? 10 })),
    ...(enDefi ? [] : customMols.map((m, i) => ({ ...m, court: m.nom, id: 'cust_' + i, conc: concs['cust_' + i] ?? 1, epsilon: epsilons['cust_' + i] ?? 10 }))),
  ];
  const couleurs = {}; allMols.forEach((m, i) => { couleurs[m.id] = PALETTE[i % PALETTE.length]; });
  const pEff = enDefi && defi.type === 'ordre' ? { ...p, pct: defi.pct } : p;
  const a = analyse(pEff, allMols);
  const nbPics = a.pics.length;
  const rsMin = nbPics > 1 ? Math.min(...a.res.map(r => r.R)) : null;
  const dernierTr = nbPics ? a.pics[nbPics - 1].tr : 0;

  const toggleMol = idx => setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  const addCustomMol = () => { if (!newNom.trim()) return; setCustomMols(prev => [...prev, { nom: newNom.trim(), logP: newLogP }]); setNewNom(''); setNewLogP(1.0); };
  const removeCustom = i => setCustomMols(prev => prev.filter((_, j) => j !== i));

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const cadre = id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const memeMelange = ids => customMols.length === 0 && selected.length === ids.length && ids.every(i => selected.includes(i));
  const mettre = (ids, pct = 50) => { setSelected(ids); setCustomMols([]); setP({ ...PARAMS_DEFAUT, pct }); setLancement(n => n + 1); };
  const exp = id => a.pics.find(m => m.id === id);
  const BZP = 7, PHENOL = 2, ONITRO = 4;   // indices dans MOLECULES_CLHP
  const picBzp = exp('pre_' + BZP);
  const duoPhOn = exp('pre_' + PHENOL) && exp('pre_' + ONITRO) && nbPics === 2;
  const ETAPES = [
    { id: 'intro', titre: 'Séparer un mélange : le principe', focus: [],
      texte: <>En CLHP <strong>en phase inverse</strong>, la <strong>phase stationnaire</strong> est de la silice greffée par des chaînes C18 (apolaire) ; la <strong>phase mobile</strong> est un mélange eau / acétonitrile (polaire). Chaque composé du mélange injecté passe son temps à <strong>alterner</strong> entre la phase mobile, qui l’entraîne, et la phase stationnaire, où il est retenu. Plus il est <strong>apolaire</strong> (logP élevé), plus il s’attarde sur les chaînes C18.</>,
      tache: { type: 'qcm', q: 'On injecte un mélange de phénol (logP = 1,48) et de benzophénone (logP = 3,18). Quel composé sortira en premier de la colonne ?', options: ['le phénol, plus polaire (logP plus faible)', 'la benzophénone, moins polaire (logP plus élevé)', 'les deux sortent en même temps'], bonne: 0,
        expl: 'Le phénol (logP = 1,48) est moins retenu par la phase stationnaire apolaire que la benzophénone (logP = 3,18) : il est entraîné plus vite par l’éluant polaire.' } },
    { id: 'inj', titre: 'Injecter et regarder', focus: ['viz'],
      texte: <>On <strong>injecte</strong> le mélange à l’instant t = 0 : tous les composés partent ensemble de l’entrée de la colonne. Chaque bande avance à sa vitesse, puis passe devant le <strong>détecteur UV</strong>, qui enregistre le chromatogramme. La molécule alterne entre <strong>libre</strong> (entraînée) et <strong>adsorbée</strong> (immobile).</>,
      tache: { type: 'action', ok: lancement > 0 && memeMelange([PHENOL, BZP]), label: '▶ Mettre le phénol et la benzophénone, et injecter', faire: () => mettre([PHENOL, BZP]), consigne: 'Observez les deux bandes se séparer, puis le chromatogramme se tracer.' } },
    { id: 't0', titre: 'Le temps mort t₀', focus: ['eluant', 'viz'],
      texte: <>Une espèce qui <strong>ne serait pas retenue</strong> (repère gris) sort à l’instant <strong>t₀</strong> : le temps que met l’éluant à traverser le volume de phase mobile de la colonne, <strong>t₀ = (ε · π r² · L) / débit</strong>. Réglez le débit et regardez le repère t₀ bouger.</>,
      tache: { type: 'qcm', q: 'On double le débit de l’éluant. Le temps mort t₀ est…', options: ['divisé par 2', 'multiplié par 2', 'inchangé'], bonne: 0,
        expl: 't₀ est inversement proportionnel au débit : l’éluant va deux fois plus vite, donc il traverse la colonne en deux fois moins de temps.' } },
    { id: 'k', titre: 'Le facteur de rétention k’', focus: ['viz', 'tableau'],
      texte: <>Le temps de rétention d’un composé est <strong>t<Ind>R</Ind> = t₀ (1 + k’)</strong>, soit <strong>k’ = (t<Ind>R</Ind> − t₀) / t₀</strong>. k’ mesure combien de temps le composé passe sur la phase stationnaire par rapport au temps passé dans l’éluant. Lisez t<Ind>R</Ind> en survolant le pic (ou dans le tableau), et t₀ en survolant le repère gris.</>,
      tache: { type: 'num', q: 'Calculez k’ pour la benzophénone avec les valeurs lues (réglages actuels).', unite: '', vrai: picBzp ? picBzp.k : 0, tol: 0.05, bloque: picBzp ? null : 'La benzophénone n’est plus dans le mélange : revenez à l’étape précédente pour la remettre.',
        aide: 'Écrivez d’abord k’ = (t_R − t_0) / t_0 puis remplacez par vos valeurs.', affiche: x => v(x),
        expl: 'k’ = (t_R − t_0) / t_0 : c’est la grandeur sans dimension qui caractérise la rétention du composé.' } },
    { id: 'frac', titre: 'Le temps passé sur la phase stationnaire', focus: ['viz'],
      texte: <>Dans la vue colonne, une molécule est adsorbée une fraction du temps égale à <strong>k’ / (1 + k’)</strong> (c’est aussi 1 − t₀ / t<Ind>R</Ind>). Plus k’ est grand, plus cette fraction se rapproche de 100 % : la molécule est presque toujours immobile, donc elle progresse lentement.</>,
      tache: { type: 'num', q: 'Quel pourcentage du temps la benzophénone passe-t-elle adsorbée sur la phase stationnaire (réglages actuels) ?', unite: '%', vrai: picBzp ? 100 * picBzp.k / (1 + picBzp.k) : 0, tol: 0.04, bloque: picBzp ? null : 'La benzophénone n’est plus dans le mélange.',
        aide: 'Fraction = k’ / (1 + k’).', affiche: x => v(x, 0),
        expl: 'Fraction du temps sur la phase stationnaire = k’ / (1 + k’) : la molécule ne progresse que pendant le reste du temps.' } },
    { id: 'pct', titre: 'Changer la force de l’éluant', focus: ['eluant'],
      texte: <>Augmenter le <strong>pourcentage d’acétonitrile</strong> rend l’éluant <strong>moins polaire</strong> : on parle d’éluant plus « fort ». Passez à 70 % et injectez à nouveau.</>,
      tache: { type: 'action', ok: p.pct >= 70 && lancement > 1, label: '70 % d’acétonitrile et injecter', faire: () => { maj('pct', 70); setLancement(n => n + 1); }, consigne: 'Comparez avec l’injection à 50 %.' } },
    { id: 'pctq', titre: 'Pourquoi sortent-ils plus vite ?', focus: ['eluant', 'viz'],
      texte: <>À 70 % d’acétonitrile, les deux pics sont sortis beaucoup plus tôt, mais ils sont aussi plus proches.</>,
      tache: { type: 'qcm', q: 'Pourquoi les temps de rétention ont-ils diminué ?', options: ['l’éluant, moins polaire, retient moins les composés apolaires sur C18 : k’ diminue', 'l’éluant est plus polaire, donc il pousse plus fort', 'la colonne est devenue plus courte'], bonne: 0,
        expl: 'Plus d’acétonitrile = éluant plus apolaire : les molécules apolaires se trouvent « bien » dans la phase mobile et s’adsorbent moins sur C18. k’ diminue, donc tR diminue aussi.' } },
    { id: 'alpha', titre: 'Sélectivité et résolution', focus: ['melange', 'resultats'],
      texte: <>Deux pics voisins sont séparés si leur <strong>écart</strong> est grand devant leur <strong>largeur</strong>. La <strong>sélectivité</strong> est α = k’<Ind>2</Ind> / k’<Ind>1</Ind>. La <strong>résolution</strong> est R<Ind>s</Ind> = 1,18 (t<Ind>R2</Ind> − t<Ind>R1</Ind>) / (W<Ind>½,1</Ind> + W<Ind>½,2</Ind>) ; on considère les pics séparés pour <strong>R<Ind>s</Ind> ≥ 1,5</strong>. Étudions deux composés très proches : le phénol et l’o-nitrophénol.</>,
      tache: { type: 'action', ok: memeMelange([PHENOL, ONITRO]), label: 'Phénol + o-nitrophénol (50 %)', faire: () => mettre([PHENOL, ONITRO]), consigne: 'Observez : les deux pics se chevauchent presque.' } },
    { id: 'alphan', titre: 'Calculer la sélectivité', focus: ['resultats'],
      texte: <>Les valeurs de k’ de chaque composé sont dans le tableau.</>,
      tache: { type: 'num', q: 'Calculez α = k’(o-nitrophénol) / k’(phénol).', unite: '', vrai: duoPhOn ? exp('pre_' + ONITRO).k / exp('pre_' + PHENOL).k : 0, tol: 0.03, bloque: duoPhOn ? null : 'Revenez à l’étape précédente pour remettre phénol + o-nitrophénol.',
        affiche: x => v(x, 3), expl: 'α = k’2 / k’1 est toujours ≥ 1 par convention. Plus α est loin de 1, plus la colonne « distingue » les deux composés.' } },
    { id: 'sep', titre: 'À vous de séparer !', focus: ['eluant', 'viz', 'resultats'],
      texte: <>Réglez la colonne ou l’éluant pour obtenir <strong>R<Ind>s</Ind> ≥ 1,5</strong> sans que l’analyse dépasse <strong>10 minutes</strong>. Piste : un éluant plus faible (moins d’acétonitrile) augmente à la fois k’ et α, mais allonge l’analyse.</>,
      tache: { type: 'action', ok: duoPhOn && rsMin >= SEUIL_RS[1] && dernierTr <= 10, label: null, consigne: duoPhOn ? `R_s actuel : ${v(rsMin ?? 0)} · dernier pic à ${v(dernierTr)} min` : 'Remettez phénol + o-nitrophénol.' } },
    { id: 'N', titre: 'L’efficacité de la colonne', focus: ['eluant', 'viz'],
      texte: <>La <strong>largeur</strong> des pics dépend de l’<strong>efficacité</strong> de la colonne : N = 5,54 (t<Ind>R</Ind> / W<Ind>½</Ind>)² plateaux théoriques, hauteur équivalente à un plateau H = L / N. Doubler la longueur L double N, mais n’affine les pics (en valeur relative, t<Ind>R</Ind> / σ = √N) que d’un facteur √2.</>,
      tache: { type: 'qcm', q: 'On double la longueur de la colonne (même éluant). Que devient la résolution R_s ?', options: ['elle est multipliée par √2 ≈ 1,4', 'elle est multipliée par 2', 'elle ne change pas'], bonne: 0,
        expl: 'R_s est proportionnelle à √N, et N est proportionnel à L. Doubler L multiplie R_s par √2 mais double aussi le temps d’analyse : c’est un compromis, pas une solution miracle.' } },
    { id: 'debit', titre: 'Et le débit ?', focus: ['eluant'],
      texte: <>Dans ce modèle, k’ ne dépend que de la composition de l’éluant, de la température et du composé. Le débit change le temps mort t₀ (donc tous les temps de rétention) mais pas k’.</>,
      tache: { type: 'qcm', q: 'On augmente le débit. Dans ce modèle, k’ d’un composé…', options: ['ne change pas (seuls t₀ et t_R changent)', 'augmente', 'diminue'], bonne: 0,
        expl: 'k’ traduit un équilibre entre les deux phases. Attention : dans une vraie colonne, le débit modifie aussi l’efficacité N (courbe de van Deemter) — ce que ce modèle ne représente pas (voir « Hypothèses et limites »).' } },
    { id: 'T', titre: 'La température', focus: ['eluant'],
      texte: <>Le terme <strong>b / T</strong> du modèle traduit l’effet de la température sur la rétention.</>,
      tache: { type: 'qcm', q: 'On chauffe la colonne de 25 °C à 50 °C. Les temps de rétention…', options: ['diminuent : la rétention est moins forte', 'augmentent', 'ne changent pas'], bonne: 0,
        expl: 'La rétention est un équilibre d’adsorption, favorisé à basse température : en chauffant, k’ diminue. C’est aussi un moyen de diminuer la pression et la durée d’analyse.' } },
    { id: 'fin', titre: 'À retenir', focus: [],
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>En phase inverse, <strong>plus un composé est apolaire, plus il est retenu</strong>.</li>
        <li>t₀ = temps mort ; t<Ind>R</Ind> = t₀ (1 + k’).</li>
        <li>Sélectivité α = k’₂ / k’₁ ; résolution R<Ind>s</Ind> = 1,18 Δt<Ind>R</Ind> / (W<Ind>½,1</Ind> + W<Ind>½,2</Ind>) ; séparés si R<Ind>s</Ind> ≥ 1,5.</li>
        <li>Pour séparer : agir sur <strong>k’ et α</strong> (éluant, température) puis sur <strong>N</strong> (longueur, particules) ; chaque amélioration a un coût en temps.</li></ul></ARetenir>,
      tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  function lancer(type) { const d = nouveauDefi(type); setDefi(d); setP({ ...PARAMS_DEFAUT, pct: d.pct }); setHover(null); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'ordre'); }
  const cible = enDefi && defi.cible != null ? exp('pre_' + defi.cible) : null;
  const ordreVrai = a.pics.map(m => m.id);
  function evaluer(d) {
    if (d.type === 'ordre') { const ok = JSON.stringify(d.reps.ordre) === JSON.stringify(ordreVrai); return { ok, ligne: ok ? 'Bon ordre : plus un composé est apolaire (logP élevé), plus il est retenu.' : 'Pas encore : plus logP est élevé, plus le composé est apolaire donc retenu par les chaînes C18, et sort tard.' }; }
    if (d.type === 'facteur') { const x = parseFloat(String(d.reps.k ?? '').replace(',', '.')); const ok = cible && isFinite(x) && Math.abs(x - cible.k) <= 0.04 * cible.k; return { ok, ligne: ok ? 'Juste : k’ = (t_R − t_0) / t_0.' : 'Relisez t_R au survol du pic, t_0 au survol du repère gris, puis calculez k’ = (t_R − t_0) / t_0.' }; }
    const ok = nbPics === 2 && rsMin >= SEUIL_RS[1] && dernierTr <= TEMPS_MAX_DEFI;
    return { ok, ligne: ok ? 'Séparation obtenue dans le temps imparti.' : `Il faut R_s ≥ 1,5 et un dernier pic avant ${TEMPS_MAX_DEFI} min (actuellement R_s = ${v(rsMin ?? 0)} ; dernier pic à ${v(dernierTr)} min).` };
  }
  const res = enDefi && defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${enDefi ? defi.type : 'ordre'}`, reussi);
  const prog = lireProgression();
  const rep = (k, x) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: x }, verifie: false }));
  const txtD = { fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const voletDefi = enDefi && (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => lancer(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'ordre' && <>
        <div style={txtD}>🎯 On injecte ce mélange, éluant à <strong>{defi.pct} %</strong> d’acétonitrile. Cliquez les composés <strong>dans l’ordre où ils sortent</strong> (le premier à sortir d’abord). Le chromatogramme apparaît après la vérification.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{allMols.map(m => {
          const rang = defi.reps.ordre.indexOf(m.id);
          return <button key={m.id} onClick={() => rep('ordre', rang >= 0 ? defi.reps.ordre.filter(x => x !== m.id) : [...defi.reps.ordre, m.id])} style={stylePetitBouton(rang >= 0, couleurs[m.id])}>
            {rang >= 0 ? `${rang + 1}. ` : ''}{m.nom} <span style={{ opacity: 0.75, fontWeight: 400 }}>logP {String(m.logP).replace('.', ',')}</span></button>;
        })}</div></>}
      {defi.type === 'facteur' && <>
        <div style={txtD}>🎯 Éluant à <strong>{p.pct} %</strong> d’acétonitrile. Lisez sur le chromatogramme (au survol) {TR} de <strong>{MOLECULES_CLHP[defi.cible].nom}</strong> et {T0}, puis calculez son facteur de rétention k’.</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>k’ =</span>
          <input value={defi.reps.k ?? ''} onChange={e => rep('k', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); } }} placeholder="?" aria-label="Votre valeur de k’"
            style={{ fontSize: 15, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110, color: KIT.txt }}/></div></>}
      {defi.type === 'separer' && <>
        <div style={txtD}>🎯 Mélange de <strong>{allMols[0].nom}</strong> et <strong>{allMols[1].nom}</strong>. Réglez l’éluant (et la colonne si besoin) pour obtenir <strong>R<Ind>s</Ind> ≥ 1,5</strong> avec le dernier pic <strong>avant {TEMPS_MAX_DEFI} min</strong>.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
          <span style={{ ...styleBoite, padding: '3px 8px', color: nbPics === 2 ? COUL_RS[classeRs(rsMin)] : KIT.txt2, fontWeight: 700 }}>R<Ind>s</Ind> = {v(rsMin ?? 0)}</span>
          <span style={{ ...styleBoite, padding: '3px 8px', color: dernierTr <= TEMPS_MAX_DEFI ? '#15803d' : '#b91c1c', fontWeight: 700 }}>dernier pic : {v(dernierTr)} min</span></div></>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => lancer(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14, color: res.ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{res.ok ? '✅' : '❌'} {res.ligne}{res.ok && <div style={{ fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'ordre' && <>Ordre de sortie : <strong>{a.pics.map(m => m.nom).join(' → ')}</strong>.</>}
        {defi.type === 'facteur' && cible && <>t₀ = {v(a.col.tm)} min ; {TR} = {v(cible.tr)} min ; k’ = ({v(cible.tr)} − {v(a.col.tm)}) / {v(a.col.tm)} = <strong>{v(cible.k)}</strong>.</>}
        {defi.type === 'separer' && <>Piste : à 50 % d’acétonitrile, R<Ind>s</Ind> = {v(analyse({ ...PARAMS_DEFAUT }, allMols).res[0].R)}. Diminuez le pourcentage d’acétonitrile pour augmenter k’ et α, en surveillant le temps du dernier pic.</>}</div>}
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const resultats = nbPics === 0 ? null : (
    <div style={{ ...styleBoite, ...cadre('resultats') }}>
      <Section titre={`Résultats : ${nbPics} pic${nbPics > 1 ? 's' : ''}`} ouvert={ouv.tableau} onBascule={() => bascule('tableau')}>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Colonne : {T0} = {v(a.col.tm)} min · N = {Math.round(a.col.N).toLocaleString('fr-FR')} plateaux · H = {v(a.col.H)} mm. Concentration et réponse de chaque composé sont modifiables.</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
            <thead><tr style={{ background: '#eef2f6' }}>
              {[['Composé', ''], ['logP', 'coefficient de partage octanol / eau'], ['C (u.a.)', 'concentration relative'], ['ε (u.a.)', 'coefficient de réponse du détecteur'], [<>{TR} (min)</>, 'temps de rétention'], ['k’', 'facteur de rétention'], [<>W<Ind>½</Ind> (min)</>, 'largeur à mi-hauteur']]
                .concat(showExpData ? [[<>{TR} exp. (min)</>, ''], ['Écart (%)', '']] : []).map(([h, tip], ih) =>
                <th key={ih} title={tip} style={{ padding: '5px 8px', borderBottom: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 12.5 }}>{h}</th>)}</tr></thead>
            <tbody>{a.pics.map(m => {
              const ecart = showExpData && expTr[m.id] ? Math.abs((m.tr - expTr[m.id]) / expTr[m.id] * 100) : null;
              const cE = ecart !== null ? (ecart < 5 ? '#16a34a' : ecart < 15 ? '#d97706' : '#dc2626') : '';
              return <tr key={m.id} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)} style={{ background: hover === m.id ? '#fff7ed' : 'transparent' }}>
                <td style={{ padding: '4px 8px', fontWeight: 700 }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: couleurs[m.id], marginRight: 6 }}/>{m.nom}</td>
                <td style={{ padding: '4px 8px', color: KIT.txt2 }}>{String(m.logP).replace('.', ',')}</td>
                <td style={{ padding: '4px 8px' }}><input type="number" value={concs[m.id] ?? 1} min={0} step={0.1} aria-label={`Concentration de ${m.nom}`}
                  onChange={e => setConcs(q => ({ ...q, [m.id]: parseFloat(e.target.value) || 0 }))} style={inpStyle}/></td>
                <td style={{ padding: '4px 8px' }}><input type="number" value={epsilons[m.id] ?? 10} min={0} step={1} aria-label={`Réponse de ${m.nom}`}
                  onChange={e => setEpsilons(q => ({ ...q, [m.id]: parseFloat(e.target.value) || 0 }))} style={inpStyle}/></td>
                <td style={{ padding: '4px 8px', fontWeight: 700 }}>{masque ? '?' : v(m.tr)}</td>
                <td style={{ padding: '4px 8px' }}>{masque ? '?' : v(m.k)}</td>
                <td style={{ padding: '4px 8px' }}>{masque ? '?' : v(m.W, 3)}</td>
                {showExpData && <>
                  <td style={{ padding: '4px 8px' }}><input type="number" value={expTr[m.id] ?? ''} min={0} step={0.01} placeholder="—" aria-label={`Temps de rétention expérimental de ${m.nom}`}
                    onChange={e => setExpTr(q => ({ ...q, [m.id]: parseFloat(e.target.value) || '' }))} style={{ ...inpStyle, width: 74 }}/></td>
                  <td style={{ padding: '4px 8px', fontWeight: 700, color: cE }}>{ecart !== null ? `${v(ecart, 1)} %` : '—'}</td></>}
              </tr>;
            })}
            {showExpData && a.pics.some(m => expTr[m.id]) && (() => {
              const vals = a.pics.filter(m => expTr[m.id]).map(m => Math.abs((m.tr - expTr[m.id]) / expTr[m.id] * 100));
              const moy = vals.reduce((x, y) => x + y, 0) / vals.length;
              return <tr style={{ background: '#eef2f6', fontWeight: 700 }}><td colSpan={7} style={{ padding: '4px 8px' }}>Écart moyen</td><td/>
                <td style={{ padding: '4px 8px', color: moy < 5 ? '#16a34a' : moy < 15 ? '#d97706' : '#dc2626' }}>{v(moy, 1)} %</td></tr>;
            })()}</tbody>
          </table></div>
        <button onClick={() => setShowExpData(x => !x)} style={{ ...stylePetitBouton(showExpData, '#0d6e6e'), marginTop: 8 }}>
          {showExpData ? '✓ Comparaison expérimentale activée' : '+ Comparer avec des tR expérimentaux'}</button>
        {a.res.length > 0 && !masque && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {a.res.map((r, i) => { const c = classeRs(r.R); return (
            <div key={i} style={{ background: 'white', borderRadius: 8, padding: '5px 10px', fontSize: 13, border: `1.5px solid ${COUL_RS[c]}` }}>
              <span style={{ color: KIT.txt2 }}>{nomsCourts(r.de)} / {nomsCourts(r.a)} : </span>
              <strong style={{ color: COUL_RS[c] }}>R<Ind>s</Ind> = {v(r.R)} {c === 'ok' ? '✓' : c === 'lim' ? '⚠' : '✗'}</strong>
              <span style={{ color: KIT.txt2 }}> · α = {v(r.alpha)}</span></div>); })}</div>}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>R<Ind>s</Ind> = 1,18 (t<Ind>R2</Ind> − t<Ind>R1</Ind>) / (W<Ind>½,1</Ind> + W<Ind>½,2</Ind>) : <span style={{ color: COUL_RS.ok }}>✓ R<Ind>s</Ind> ≥ 1,5</span> séparés · <span style={{ color: COUL_RS.lim }}>⚠ 1,0 ≤ R<Ind>s</Ind> &lt; 1,5</span> partiellement · <span style={{ color: COUL_RS.non }}>✗ R<Ind>s</Ind> &lt; 1,0</span> superposés.</div>
      </Section>
    </div>);

  const melange = !enDefi && (
    <div style={{ ...styleBoite, ...cadre('melange') }}>
      <Section titre={`Mélange à séparer : ${allMols.length ? allMols.map(m => nomsCourts(m)).join(', ') : 'aucun composé'}`} ouvert={ouv.melange || (enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes('melange'))} onBascule={() => bascule('melange')}>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Cliquez pour ajouter ou retirer un composé. Un composé est d’autant plus retenu que son logP est élevé (apolaire).</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {MOLECULES_CLHP.map((m, i) => <button key={i} onClick={() => toggleMol(i)} aria-pressed={selected.includes(i)}
            style={{ ...stylePetitBouton(selected.includes(i), '#0d6e6e'), borderRadius: 16, fontWeight: selected.includes(i) ? 700 : 500 }}>
            {m.nom} <span style={{ opacity: 0.7, fontSize: 11, fontWeight: 400 }}>logP {String(m.logP).replace('.', ',')}</span></button>)}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Autre composé" value={newNom} onChange={setNewNom} width={150} type="text"/>
          <Field label="logP" value={newLogP} onChange={x => setNewLogP(parseFloat(x) || 0)} width={70}/>
          <button onClick={addCustomMol} style={styleBouton(true, '#0d6e6e')}>+ Ajouter</button>
          {customMols.map((m, i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, padding: '4px 10px', borderRadius: 16, border: '2px solid #6a4c93', background: '#f3eeff', color: '#6a4c93' }}>
            {m.nom} (logP {String(m.logP).replace('.', ',')})
            <button onClick={() => removeCustom(i)} aria-label={`Retirer ${m.nom}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a4c93', fontSize: 15, padding: 0 }}>×</button></span>)}
        </div>
      </Section>
    </div>);

  const eluant = (
    <div style={{ ...styleBoite, ...cadre('eluant') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Éluant et colonne</div>
      <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {(enDefi && defi.type === 'ordre') ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Éluant fixé : {defi.pct} % d’acétonitrile.</div> :
          <Curseur nom="Acétonitrile" valeur={p.pct} onChange={x => maj('pct', x)} min={5} max={95} pas={1} unite="%" couleur="#0d6e6e"/>}
        <Curseur nom="Débit" valeur={p.debit} onChange={x => maj('debit', x)} min={0.1} max={10} pas={0.1} unite="mL/min" decimales={1} couleur="#0d6e6e"/>
        <Curseur nom="Température" valeur={p.temperature} onChange={x => maj('temperature', x)} min={5} max={80} pas={1} unite="°C" couleur="#0d6e6e"/>
        <Curseur nom="Longueur L" valeur={p.longueur} onChange={x => maj('longueur', x)} min={1} max={50} pas={1} unite="cm" couleur="#0d6e6e"/>
      </div>
      <button onClick={() => bascule('plus')} aria-expanded={ouv.plus} style={{ ...stylePetitBouton(false), marginTop: 4 }}>{ouv.plus ? '▲ Moins de réglages' : '▼ Autres réglages de la colonne'}</button>
      {ouv.plus && <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginTop: 8 }}>
        <Curseur nom="Diamètre interne" valeur={p.diametre} onChange={x => maj('diametre', x)} min={1} max={10} pas={0.1} unite="mm" decimales={1} couleur="#475569"/>
        <Curseur nom="Taille des particules dp" valeur={p.dp} onChange={x => maj('dp', x)} min={1} max={20} pas={1} unite="µm" couleur="#475569"/>
        <Curseur nom="Greffage nC" valeur={p.nC} onChange={x => maj('nC', x)} min={1} max={30} pas={1} unite="C" couleur="#475569"/>
        <Curseur nom="Porosité ε" valeur={p.porosite} onChange={x => maj('porosite', x)} min={0.1} max={1} pas={0.05} unite="" decimales={2} couleur="#475569"/>
      </div>}
      <button onClick={() => bascule('avance')} aria-expanded={ouv.avance} style={{ ...stylePetitBouton(false), marginTop: 6, marginLeft: ouv.plus ? 0 : 6 }}>{ouv.avance ? '▲ Masquer les paramètres du modèle' : '▼ Paramètres du modèle (mp, mo, b, c)'}</button>
      {ouv.avance && <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, padding: '10px 12px', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
        <div style={{ fontSize: 13, color: KIT.txt2, width: '100%' }}>ln k’ = (mp · logP + mo) · ln φ + b / T + c — T en °C, φ = fraction volumique d’acétonitrile</div>
        {[['mp', -3, 0, 0.01], ['mo', -3, 1, 0.01], ['b', 0, 50, 0.5], ['c', -5, 0, 0.1]].map(([k, min, max, step]) => (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: KIT.txt2 }}>{k} =
            <input type="number" value={p[k]} min={min} max={max} step={step} onChange={e => maj(k, parseFloat(e.target.value))} style={{ ...inpStyle, width: 80 }}/></label>))}
        <button onClick={() => setP(q => ({ ...q, mp: PARAMS_DEFAUT.mp, mo: PARAMS_DEFAUT.mo, b: PARAMS_DEFAUT.b, c: PARAMS_DEFAUT.c }))} style={stylePetitBouton(false)}>Réinitialiser</button>
      </div>}
    </div>);

  const hypotheses = (
    <div style={styleBoite}>
      <Section titre="Hypothèses et limites du modèle" ouvert={ouv.hypo || enDefi} onBascule={() => bascule('hypo')}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
          <li><strong>Rétention</strong> : relation empirique ln k’ = (mp·logP + mo)·ln φ + b/T + c, calibrée pour des molécules <strong>neutres</strong> en phase inverse C18 / acétonitrile-eau, pour un pourcentage d’acétonitrile intermédiaire. Le seul descripteur du composé est son logP : ni liaisons hydrogène spécifiques, ni ionisation (pH), ni forme de la molécule.</li>
          <li><strong>Pics gaussiens</strong> : on suppose une distribution normale des temps de passage, de largeur σ = t<Ind>R</Ind> / √N. Pas de traînée, pas de pics asymétriques.</li>
          <li><strong>Efficacité N constante</strong> : N = L / (dp · nC) ne dépend ni du débit ni du composé. Dans une vraie colonne, N varie avec le débit (courbe de van Deemter) et avec la rétention.</li>
          <li><strong>Isocratique</strong> : composition de l’éluant constante, pas de gradient. Pression, volume mort extra-colonne et volume injecté ne sont pas modélisés.</li>
          <li><strong>Détecteur UV linéaire</strong> : l’aire d’un pic est proportionnelle à C · ε (loi de Beer-Lambert), sans saturation ; la hauteur est donc plus faible pour un pic plus large.</li>
          <li><strong>Vue colonne schématique</strong> : la position moyenne des bandes, leur élargissement et la part du temps adsorbée (k’/(1 + k’)) viennent du modèle ; l’agitation des molécules est tirée au hasard, ce n’est pas une simulation moléculaire.</li>
          <li>Modèle d’origine : X. Bataille (ENCPB, 2008). Il n’a pas été revalidé ici sur des mesures : vous pouvez saisir vos t<Ind>R</Ind> expérimentaux pour le confronter à vos propres chromatogrammes.</li>
        </ul>
      </Section>
    </div>);

  const aEssayer = (
    <div style={{ ...styleBoite, background: '#f0fdfa' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Faites varier le pourcentage d’acétonitrile en regardant l’écart ET la largeur des pics.</li>
        <li>Séparez le phénol et l’o-nitrophénol avec R<Ind>s</Ind> ≥ 1,5 : quel est le prix en temps d’analyse ?</li>
        <li>Doublez la longueur de colonne : que deviennent R<Ind>s</Ind> et la durée de l’analyse ?</li>
        <li>Ajoutez le triphénylcarbinol (logP 4,59) : voyez comme un pic tardif est large et bas.</li>
        <li>Augmentez le débit : qu’est-ce qui change, qu’est-ce qui reste identique, et qu’est-ce que le modèle ne sait pas représenter ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Phase inverse : plus un composé est <strong>apolaire</strong>, plus il est <strong>retenu</strong>.</li>
        <li>t<Ind>R</Ind> = t₀ (1 + k’) ; α = k’₂ / k’₁ ; R<Ind>s</Ind> = 1,18 Δt<Ind>R</Ind> / (W<Ind>½,1</Ind> + W<Ind>½,2</Ind>) ; séparés si R<Ind>s</Ind> ≥ 1,5.</li>
        <li>On sépare en agissant sur k’ et α (éluant, température), puis sur N (longueur, particules) : tout gain a un coût en temps.</li>
      </ul>
    </ARetenir>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button></span>);

  const visuel = (
    <div style={{ ...styleBoite, background: 'white', ...cadre('viz') }}>
      {nbPics === 0 ? <div style={{ padding: '2rem', textAlign: 'center', fontSize: 14, color: KIT.txt2 }}>Sélectionnez au moins un composé pour afficher le chromatogramme.</div>
        : masque ? <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: 14, color: KIT.txt2, lineHeight: 1.6 }}>🔒 Le chromatogramme sera affiché après votre vérification : prédisez d’abord l’ordre de sortie.</div>
        : <Visu a={a} couleurs={couleurs} hover={hover} setHover={setHover} lancement={lancement} onLancer={() => setLancement(n => n + 1)}
            nonRetenu={nonRetenu} setNonRetenu={setNonRetenu} total={total} setTotal={setTotal}/>}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cl-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .cl-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .cl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Simulation CLHP : séparer un mélange en phase inverse</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Phase inverse C{p.nC}, éluant acétonitrile / eau — d’après X. Bataille (ENCPB / RNChimie, 2008). Injectez le mélange et suivez la progression des bandes dans la colonne, puis la construction du chromatogramme.</div>
      <div className={`cl-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div className="cl-col">
          {voletDefi}
          {eluant}
          {visuel}
          {melange}
          {resultats}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? hypotheses : null}
      </div>
      {!enDefi && <div style={{ marginBottom: 12 }}>{hypotheses}</div>}
      {mode === 'explore' && <div className="cl-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}

const inpStyle = { width: 64, fontSize: 13, padding: '2px 6px', border: '1px solid #cbd5e1', borderRadius: 4, color: '#0f172a', background: 'white' };
