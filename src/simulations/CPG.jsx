import { useState, useEffect, useRef, useMemo } from "react";
import { useLargeur, pasTemps, grille } from "./cpgOutils";
import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, Curseur, lireProgression } from "../commun";
import { COMPOSES, PAR_ID, PHASES, GAZ, PARAMS_DEFAUT, SEUIL_RS, P_MAX, PANNES, FRACTION_VOL,
  analyse, ecoulement, signal, ligneBase, temperature, positionBande } from "./cpgModele";

// ====================================================
//  SIM 54 — CHROMATOGRAPHIE EN PHASE GAZEUSE (BTS)
//  Modèle : indices de Kováts publiés (colonnes 5 % phényl et PEG), programmation de température,
//  gaz vecteur à débit constant, efficacité de Golay, injecteur split / splitless, détecteur FID — voir cpgModele.js.
//  Interface centrée sur la pratique : appareil, réglages, chromatogramme en direct, pannes, parcours et défis.
// ====================================================

const SIM = 54;
declarerDefis(SIM, [
  ['ordre', 'Prédire l’ordre d’élution'],
  ['identifier', 'Identifier des pics par leur temps de rétention'],
  ['separer', 'Choisir la colonne et le programme'],
  ['panne', 'Diagnostiquer une panne'],
]);

const PALETTE = ['#e63946', '#2a9d8f', '#6a4c93', '#d98e04', '#457b9d', '#2d6a4f', '#c2410c', '#9333ea', '#0891b2', '#be185d', '#65a30d', '#475569'];
const COUL_RS = { ok: '#16a34a', lim: '#d97706', non: '#dc2626' };
const VERT = '#0f766e';
const classeRs = R => R >= SEUIL_RS[1] ? 'ok' : R >= SEUIL_RS[0] ? 'lim' : 'non';
const v = (x, d = 2) => (isFinite(x) ? x.toFixed(d) : '—').replace('.', ',');
const LETTRES = 'ABCDEFGHIJKL';
const TEMPS_MAX_DEFI = 12;
const Ind = ({ children }) => <sub>{children}</sub>;
const TR = <>t<Ind>R</Ind></>;
const T0 = <>t<Ind>0</Ind></>;
const FAMILLES = ['alcool', 'cétone', 'ester', 'éther', 'chloré', 'nitrile', 'amide', 'aromatique', 'alcane'];

function tirages(nMol, n) {
  let s = 4242;
  const alea = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(alea() || 1e-9)) * Math.cos(2 * Math.PI * alea());
  return Array.from({ length: nMol }, () => Array.from({ length: n }, () => ({ z: gauss(), y: alea() })));
}
const PARTICULES = tirages(12, 30);
const hasard = (a, b, c) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); };

let CACHE = { cle: null, val: null };
function analyseMemo(p, ids) {
  const cle = JSON.stringify([p, ids]);
  if (CACHE.cle !== cle) CACHE = { cle, val: analyse(p, ids) };
  return CACHE.val;
}
const trSeul = (p, id) => { const a = analyse({ ...p, panne: null }, [id]); return a.pics.length ? a.pics[0].tr : NaN; };

// ---------- vue « colonne capillaire » : le gaz vecteur entraîne les molécules, le film les retient ----------
const H_COL = 112;
const rr = (ctx, x, y, w, h, r) => { if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
function dessinerColonne(ctx, dpr, W, { a, p, frac, hover, couleurs }, now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H_COL);
  const xL = 70, xR = W - 70, L = xR - xL, y0 = 40, hT = 46;
  ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); rr(ctx, xL, y0, L, hT, hT / 2); ctx.fill(); ctx.stroke();
  // film de phase stationnaire sur la paroi interne
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(xL + hT / 2, y0 + 3); ctx.lineTo(xR - hT / 2, y0 + 3); ctx.moveTo(xL + hT / 2, y0 + hT - 3); ctx.lineTo(xR - hT / 2, y0 + hT - 3); ctx.stroke();
  ctx.fillStyle = '#334155'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Injecteur', xL - 34, y0 + 18);
  ctx.beginPath(); ctx.moveTo(xL - 54, y0 + 28); ctx.lineTo(xL - 6, y0 + 28); ctx.lineTo(xL - 13, y0 + 23); ctx.moveTo(xL - 6, y0 + 28); ctx.lineTo(xL - 13, y0 + 33);
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillText('FID', xR + 34, y0 + 18);
  ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.ellipse(xR + 34, y0 + 32, 5, 9, 0, 0, 7); ctx.fill();
  const t = frac * a.tMax, T = temperature(p, t), pr = ecoulement(p, T).pEntree;
  ctx.fillStyle = '#475569'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(W < 560 ? `t = ${v(t)} min · four ${Math.round(T)} °C` : `t = ${v(t)} min · four à ${Math.round(T)} °C · pression en tête ${Math.round(pr)} kPa`, W < 560 ? 8 : xL, 16);
  ctx.textAlign = 'right'; ctx.fillStyle = '#64748b';
  if (W >= 780) ctx.fillText('gaz vecteur · film de phase stationnaire (jaune)', xR, 16);
  ctx.textAlign = 'left';
  a.pics.forEach((m, gi) => {
    const pb = positionBande(p, m, t);
    if (pb.z >= 1 || t <= 0) return;
    const xb = pb.z * L, sx = Math.max(2.5, Math.sqrt(Math.max(pb.z, 0)) * L / Math.sqrt(m.N));
    const pStat = pb.k / (1 + pb.k), bucket = Math.floor(now / 160);
    ctx.globalAlpha = hover != null && hover !== m.id ? 0.2 : 1;
    PARTICULES[gi % 12].forEach((q, j) => {
      let x = xb + sx * q.z; if (x < 0) x = -x;
      if (x >= L) return;
      const stat = hasard(gi, j, bucket) < pStat;
      const y = stat ? (hasard(j, gi, 7) < 0.5 ? y0 + 5 : y0 + hT - 5) : y0 + 10 + hasard(j, gi, bucket + 3) * (hT - 20);
      ctx.beginPath(); ctx.arc(xL + x, y, stat ? 2.8 : 2.3, 0, 7); ctx.fillStyle = couleurs[m.id]; ctx.fill();
      if (stat) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 0.8; ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
  });
}
export function ColonneAnim({ a, p, frac, couleurs, hover, w }) {
  const ref = useRef(null);
  const etat = useRef({ a, p, frac, hover, couleurs });
  useEffect(() => { etat.current = { a, p, frac, hover, couleurs }; });
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
    aria-label="Coupe schématique de la colonne capillaire : les bandes de chaque composé avancent de l’injecteur vers le détecteur"/>;
}

// ---------- chromatogramme (SVG) ----------
function Chromato({ a, p, frac, w, couleurs, hover, setHover, anonyme }) {
  const [lect, setLect] = useState(null);
  const [zoom, setZoom] = useState(null);       // [t1, t2] ou null
  const [sel, setSel] = useState(null);         // glisser pour zoomer : { x0, x1 }
  const [cleA, setCleA] = useState(a);
  if (cleA !== a) { setCleA(a); if (zoom && zoom[0] > a.tMax) setZoom(null); }
  const h = w < 480 ? 240 : 280, mL = 34, mR = p.rampe > 0 ? 40 : 12, mT = 14, mB = 34;
  const iw = w - mL - mR, ih = h - mT - mB;
  const [xa, xb] = zoom || [0, a.tMax];
  const tCur = frac * a.tMax;
  const geo = useMemo(() => {
    const ts = grille(a, xa, xb);
    const sig = a.pics.map(m => ts.map(t => signal(m, t)));
    const tot = ts.map((t, i) => sig.reduce((s, c) => s + c[i], 0) + ligneBase(a.ligneBase, p, t));
    const maxFen = Math.max(...tot, 1e-9);
    const ymax = (zoom ? Math.max(maxFen, a.hRef * 0.02) : Math.max(maxFen, a.hRef)) * 1.15;
    return { ts, sig, tot, ymax };
  }, [a, p, xa, xb, zoom]);
  const X = t => mL + (t - xa) / (xb - xa) * iw, Y = s => mT + ih - s / geo.ymax * ih;
  const tEnV = px => xa + (px - mL) / iw * (xb - xa);
  const nCur = geo.ts.findIndex(t => t > tCur);
  const nVis = nCur < 0 ? geo.ts.length : nCur;
  const chemin = ys => ys.slice(0, nVis).map((s, i) => `${i ? 'L' : 'M'}${X(geo.ts[i]).toFixed(1)},${Y(s).toFixed(1)}`).join('');
  const pas = pasTemps(xb - xa), graduations = [];
  for (let t = Math.ceil(xa / pas) * pas; t <= xb + 1e-9; t += pas) graduations.push(Math.round(t * 1000) / 1000);
  const Tmax = Math.max(p.Tf, p.T0), TaxeMax = Math.ceil(Tmax / 50) * 50 || 50;
  // étiquettes
  const etiq = a.pics.map((m, i) => ({ m, i, lib: anonyme ? LETTRES[i] : (m.court || m.nom), x: X(m.tr), y: Y(Math.min(m.hauteur + ligneBase(a.ligneBase, p, m.tr), geo.ymax)) - 7 }))
    .filter(e => e.m.tr >= xa && e.m.tr <= xb);
  const places = [];
  [...etiq].sort((q, r) => r.m.hauteur - q.m.hauteur).forEach(e => {
    const lg = e.lib.length * 6.4 + 6;
    e.x = Math.min(Math.max(e.x, mL + lg / 2), w - mR - lg / 2);
    for (let essai = 0; essai < 6; essai++) {
      const y = Math.max(e.y - essai * 14, mT + 12);
      const boite = { x1: e.x - lg / 2, x2: e.x + lg / 2, y1: y - 11, y2: y + 2 };
      if (!places.some(q => boite.x1 < q.x2 && q.x1 < boite.x2 && boite.y1 < q.y2 && q.y1 < boite.y2)) { e.y = y; places.push(boite); e.ok = true; return; }
      if (y === mT + 12) break;
    }
  });
  const t0 = a.t0;
  function pointe(ev) {
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ev.clientX - r.left;
    if (sel) { setSel(s => ({ ...s, x1: px })); return; }
    const t = tEnV(px);
    if (t < xa || t > xb || t > tCur) { setLect(null); setHover(null); return; }
    if (Math.abs(px - X(t0)) < 7 && t0 <= tCur && t0 >= xa && t0 <= xb) { setLect({ x: X(t0), id: 't0' }); setHover(null); return; }
    let best = null, bd = 1e9;
    a.pics.forEach(m => { const d = Math.abs(X(m.tr) - px); if (d < bd) { bd = d; best = m; } });
    if (best && bd < 14) { setLect({ x: X(best.tr), id: best.id }); setHover(best.id); } else { setLect(null); setHover(null); }
  }
  function debut(ev) {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    const r = ev.currentTarget.getBoundingClientRect();
    setSel({ x0: ev.clientX - r.left, x1: ev.clientX - r.left });
  }
  function fin() {
    if (sel && Math.abs(sel.x1 - sel.x0) > 10) {
      const t1 = Math.max(xa, tEnV(Math.min(sel.x0, sel.x1))), t2 = Math.min(xb, tEnV(Math.max(sel.x0, sel.x1)));
      if (t2 - t1 > 0.01) setZoom([t1, t2]);
      setLect(null);
    }
    setSel(null);
  }
  const mol = lect && lect.id !== 't0' ? a.pics.find(m => m.id === lect.id) : null;
  const info = lect && (lect.id === 't0'
    ? <><strong>{T0} = {v(t0)} min</strong><br/>temps mort : un gaz non retenu (méthane) sort à cet instant</>
    : mol && (anonyme ? <><strong>Pic {LETTRES[a.pics.indexOf(mol)]}</strong><br/>{TR} = {v(mol.tr, 3)} min</>
      : <><strong style={{ color: couleurs[mol.id] }}>{mol.nom}</strong><br/>{TR} = {v(mol.tr, 3)} min · I = {Math.round(mol.Ik)}<br/>W<Ind>½</Ind> = {v(mol.W * 60, 1)} s · aire = {v(mol.aire, 1)}</>));
  const posInfo = lect ? Math.min(Math.max(lect.x + 12, 4), w - 200) : 0;
  return (
    <div style={{ position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block', touchAction: 'pan-y', userSelect: 'none' }} role="img" aria-label="Chromatogramme : signal du détecteur FID en fonction du temps"
        onPointerMove={pointe} onPointerDown={ev => { debut(ev); pointe(ev); }} onPointerUp={fin}
        onPointerLeave={ev => { setSel(null); if (ev.pointerType === 'mouse') { setLect(null); setHover(null); } }}>
        <defs><clipPath id="cpg-clip"><rect x={mL} y={mT} width={iw} height={ih}/></clipPath></defs>
        <rect x={mL} y={mT} width={iw} height={ih} fill="white" stroke="#cbd5e1"/>
        {graduations.map(t => <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={mT} y2={mT + ih} stroke="#e2e8f0"/>
          <line x1={X(t)} x2={X(t)} y1={mT + ih} y2={mT + ih + 5} stroke="#475569"/>
          <text x={X(t)} y={mT + ih + 18} textAnchor="middle" fontSize="11" fill="#334155">{String(t).replace('.', ',')}</text></g>)}
        <text x={mL + iw / 2} y={h - 4} textAnchor="middle" fontSize="12" fill="#334155" fontWeight="600">temps t (min)</text>
        <text transform={`translate(11 ${mT + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="#334155">signal du FID (u.a.)</text>
        {p.rampe > 0 && <g>
          <path d={geo.ts.filter((_, i) => i % 4 === 0).map((t, i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)},${(mT + ih - temperature(p, t) / TaxeMax * ih).toFixed(1)}`).join('')} fill="none" stroke="#c2410c" strokeWidth="1.4" strokeDasharray="6 3" opacity="0.8"/>
          {[0, TaxeMax / 2, TaxeMax].map(q => <g key={q}><line x1={mL + iw} x2={mL + iw + 4} y1={mT + ih - q / TaxeMax * ih} y2={mT + ih - q / TaxeMax * ih} stroke="#c2410c"/>
            <text x={mL + iw + 6} y={mT + ih - q / TaxeMax * ih + 4} fontSize="10.5" fill="#c2410c">{q}</text></g>)}
          <text transform={`translate(${w - 6} ${mT + ih / 2}) rotate(90)`} textAnchor="middle" fontSize="11" fill="#c2410c">température du four (°C)</text></g>}
        {t0 >= xa && t0 <= xb && <>
          <line x1={X(t0)} x2={X(t0)} y1={mT} y2={mT + ih} stroke="#64748b" strokeDasharray="4 3"/>
          <text x={X(t0) + 4} y={mT + 11} fontSize="11" fill="#475569">t₀</text></>}
        <g clipPath="url(#cpg-clip)">
          {!anonyme && a.pics.map((m, i) => (
            <path key={m.id} d={chemin(geo.sig[i])} fill="none" stroke={couleurs[m.id]} strokeWidth={hover === m.id ? 2.4 : 1.2} opacity={hover != null && hover !== m.id ? 0.25 : 0.9}/>))}
          <path d={chemin(geo.tot)} fill="none" stroke="#0f172a" strokeWidth={1.3}/>
        </g>
        {etiq.filter(e => e.ok && tCur >= e.m.tr && e.m.hauteur > geo.ymax * 0.03).map(e => <text key={e.m.id} x={e.x} y={e.y} textAnchor="middle" fontSize="11.5" fontWeight="700"
          fill={anonyme ? '#0f172a' : couleurs[e.m.id]} stroke="white" strokeWidth="3" paintOrder="stroke">{e.lib}</text>)}
        <line x1={X(tCur)} x2={X(tCur)} y1={mT} y2={mT + ih} stroke={ORANGE_GUIDE} strokeWidth="1.6" opacity={frac > 0 && frac < 1 && tCur >= xa && tCur <= xb ? 1 : 0}/>
        {lect && <line x1={lect.x} x2={lect.x} y1={mT} y2={mT + ih} stroke="#0f172a" strokeWidth="1" strokeDasharray="2 3"/>}
        {sel && Math.abs(sel.x1 - sel.x0) > 4 && <rect x={Math.min(sel.x0, sel.x1)} y={mT} width={Math.abs(sel.x1 - sel.x0)} height={ih} fill="#0ea5e9" opacity="0.15" stroke="#0284c7"/>}
      </svg>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>
        {zoom ? <button onClick={() => setZoom(null)} style={stylePetitBouton(false)}>↔ Vue entière</button>
          : <span>Les pics de CPG capillaire sont très fins : glissez sur le chromatogramme pour zoomer.</span>}
      </div>
      {lect && info && <div style={{ position: 'absolute', left: posInfo, top: 18, background: 'white', border: '1px solid #94a3b8', borderRadius: 6, padding: '4px 8px',
        fontSize: 12.5, color: KIT.txt, pointerEvents: 'none', boxShadow: '0 2px 6px rgba(0,0,0,.15)', maxWidth: 230, lineHeight: 1.45 }}>{info}</div>}
    </div>);
}

function Visu({ a, p, couleurs, hover, setHover, lancement, onLancer, anonyme }) {
  const cont = useRef(null);
  const w = useLargeur(cont);
  const [frac, setFrac] = useState(1);
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
      setFrac(f => Math.min(1, f + dt * vit / 16));
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [enCours, vit]);
  return (
    <div ref={cont}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={onLancer} style={styleBouton(true, VERT)}>▶ Injecter</button>
        <button onClick={() => { if (frac >= 1) { setFrac(0); setLecture(true); } else setLecture(l => !l); }} style={styleBouton(false)} aria-label={enCours ? 'Pause' : 'Lecture'}>{enCours ? '⏸' : '⏵'}</button>
        <button onClick={() => { setLecture(false); setFrac(1); }} style={styleBouton(false)} title="Aller à la fin de l’analyse">⏭</button>
        <input type="range" min={0} max={1} step={0.001} value={frac} aria-label="Temps écoulé depuis l’injection"
          onChange={e => { setLecture(false); setFrac(parseFloat(e.target.value)); }} style={{ flex: 1, minWidth: 120, accentColor: ORANGE_GUIDE }}/>
        {[0.5, 1, 2].map(x => <button key={x} onClick={() => setVit(x)} style={stylePetitBouton(vit === x, '#334155')}>×{String(x).replace('.', ',')}</button>)}
      </div>
      <ColonneAnim a={a} p={p} frac={frac} couleurs={couleurs} hover={anonyme ? null : hover} w={w}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 8px', lineHeight: 1.5 }}>
        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#475569', marginRight: 4 }}/>dans le gaz vecteur · {' '}
        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#475569', border: '1.5px solid #0f172a', marginRight: 4 }}/>dissous dans le film.
        Plus le four est chaud, moins les molécules restent dans le film. Vue schématique : la colonne réelle est un tube de silice enroulé dans le four.
      </div>
      <Chromato a={a} p={p} frac={frac} w={w} couleurs={couleurs} hover={hover} setHover={setHover} anonyme={anonyme}/>
    </div>);
}

// ---------- schéma de l'appareil ----------
const PIECES = {
  gaz: { nom: 'Gaz vecteur', role: 'Gaz inerte (hélium, dihydrogène ou diazote) qui entraîne les composés vaporisés dans la colonne. Il ne participe pas à la séparation.',
    ctrl: 'Pression de la bouteille suffisante, gaz de pureté chromatographique, filtres (eau, dioxygène, hydrocarbures) à jour. Le dihydrogène est inflammable : détecteur de fuite.' },
  manometre: { nom: 'Pression en tête de colonne', role: 'Le régulateur électronique ajuste la pression d’entrée pour maintenir le débit choisi. À débit constant, la pression monte quand le four chauffe (le gaz devient plus visqueux).',
    ctrl: 'Comparer à la valeur habituelle de la méthode : plus basse, fuite (septum, raccord) ; plus haute, colonne ou liner obstrué. Mesurer t₀ en injectant du méthane.' },
  injecteur: { nom: 'Injecteur split / splitless', role: 'Chambre chauffée (≈ 250 °C) où l’échantillon se vaporise dans un insert de verre (liner). En split, une vanne de fuite évacue la plus grande partie de la vapeur : seule une fraction entre dans la colonne. En splitless, la vanne reste fermée pendant ≈ 0,75 min : presque tout entre dans la colonne (analyse de traces).',
    ctrl: 'Septum changé régulièrement (fuite, débris), liner propre et désactivé, seringue rincée, volume injecté reproductible, aiguille enfoncée franchement.' },
  four: { nom: 'Four', role: 'Enceinte thermostatée contenant la colonne. Sa température règle la rétention : en isotherme, elle reste constante ; en programmation, elle augmente pendant l’analyse pour faire sortir plus tôt les composés lourds.',
    ctrl: 'Programme conforme à la méthode, temps de stabilisation avant l’injection, ne jamais dépasser la température maximale de la colonne.' },
  colonne: { nom: 'Colonne capillaire', role: 'Tube de silice fondue (15 à 60 m, diamètre 0,25 à 0,53 mm) dont la paroi interne est recouverte d’un film de phase stationnaire. Apolaire (5 % phényl) : les composés sortent à peu près dans l’ordre de leur température d’ébullition. Polaire (PEG, « WAX ») : les composés polaires (alcools…) sont nettement plus retenus.',
    ctrl: 'Écrous et ferrules serrés sans excès, coupe nette (pierre à couper), longueur insérée dans l’injecteur et le détecteur selon la notice, conditionnement d’une colonne neuve.' },
  fid: { nom: 'Détecteur à ionisation de flamme (FID)', role: 'Les composés brûlent dans une flamme dihydrogène / air ; les ions formés donnent un courant proportionnel à la quantité de carbone. Très sensible aux composés organiques, presque aveugle à l’eau, au CS₂ et aux gaz permanents.',
    ctrl: 'Débits de dihydrogène, d’air et de gaz d’appoint conformes, flamme allumée, température du détecteur supérieure à celle du four, collecteur propre.' },
};
const PIECE_BOITE = { gaz: [4, 30, 62, 124], manometre: [76, 40, 70, 104], injecteur: [158, 10, 108, 140], four: [276, 22, 260, 126], fid: [548, 22, 96, 126] };

function Appareil({ a, p, actif, setActif }) {
  const piece = (id, enfants, boite = id) => (
    <g role="button" tabIndex={0} aria-label={PIECES[id].nom} aria-pressed={actif === id} style={{ cursor: 'pointer', outline: 'none' }}
      onClick={() => setActif(actif === id ? null : id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActif(actif === id ? null : id); } }}>
      {enfants}
      {actif === id && PIECE_BOITE[boite] && <rect x={PIECE_BOITE[boite][0]} y={PIECE_BOITE[boite][1]} width={PIECE_BOITE[boite][2]} height={PIECE_BOITE[boite][3]} rx="8" fill="none" stroke={ORANGE_GUIDE} strokeWidth="2.5" strokeDasharray="5 3"/>}
    </g>);
  const txt = { fontSize: 11.5, fill: '#334155', textAnchor: 'middle', fontWeight: 600 };
  const fin = { ...txt, fontWeight: 400, fontSize: 10.5 };
  const pr = a.pression.debut, frac = Math.min(pr / (P_MAX * 1.2), 1), ang = (-120 + 240 * frac) * Math.PI / 180;
  const trop = pr > P_MAX;
  const prog = p.rampe > 0 ? `${p.T0} → ${p.Tf} °C` : `${p.T0} °C (isotherme)`;
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 650 160" style={{ width: '100%', minWidth: 560, display: 'block' }} role="group" aria-label="Schéma de l’appareil de CPG">
          {piece('gaz', <g>
            <rect x="14" y="44" width="42" height="96" rx="14" fill="#e0f2fe" stroke="#475569" strokeWidth="1.5"/>
            <rect x="27" y="36" width="16" height="10" fill="#475569"/>
            <text x="35" y="96" style={txt}>{p.gaz === 'H2' ? 'H₂' : p.gaz === 'N2' ? 'N₂' : 'He'}</text>
            <text x="35" y="152" style={fin}>gaz vecteur</text></g>)}
          {piece('manometre', <g>
            <circle cx="111" cy="92" r="24" fill="white" stroke="#475569" strokeWidth="2"/>
            <line x1="111" y1="92" x2={111 + 18 * Math.sin(ang)} y2={92 - 18 * Math.cos(ang)} stroke={trop ? '#dc2626' : '#0f172a'} strokeWidth="2" strokeLinecap="round"/>
            <circle cx="111" cy="92" r="2.5" fill="#0f172a"/>
            <text x="111" y="58" style={{ ...txt, fill: trop ? '#b91c1c' : '#334155' }}>{Math.round(pr)} kPa</text>
            <text x="111" y="132" style={fin}>pression</text><text x="111" y="143" style={fin}>en tête</text></g>)}
          {piece('injecteur', <g>
            <rect x="166" y="66" width="82" height="52" rx="6" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5"/>
            <rect x="196" y="60" width="22" height="7" fill="#1e293b"/>
            <path d="M207 18 V56 M203 56 L207 62 L211 56" stroke="#475569" strokeWidth="1.8" fill="none"/>
            <rect x="203" y="10" width="8" height="12" fill="#94a3b8"/>
            <rect x="190" y="74" width="34" height="36" rx="4" fill="white" stroke="#94a3b8"/>
            <path d="M248 78 H262 M262 78 V60 M258 64 L262 58 L266 64" stroke="#64748b" strokeWidth="1.6" fill="none"/>
            <text x="268" y="54" style={{ ...fin, textAnchor: 'end' }}>{p.mode === 'split' ? `fuite 1:${p.split}` : 'splitless'}</text>
            <text x="207" y="134" style={txt}>Injecteur</text>
            <text x="207" y="146" style={fin}>septum · liner</text></g>)}
          {piece('four', <g>
            <rect x="282" y="28" width="248" height="114" rx="10" fill="#fff7ed" stroke="#c2410c" strokeWidth="1.3" strokeDasharray="5 3"/>
            <text x="406" y="44" style={txt}>Four · {prog}</text>
            <text x="406" y="136" style={fin}>Colonne {p.phase} · {p.L} m × {String(p.dc).replace('.', ',')} mm</text></g>)}
          {piece('colonne', <g>
            {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={406} cy={88} rx={60 - i * 9} ry={30 - i * 4.5} fill="none" stroke="#475569" strokeWidth="1.6"/>)}
          </g>, 'four')}
          <g fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinejoin="round" pointerEvents="none">
            <path d="M35 36 V20 H70 V92 H87"/><path d="M135 92 H166"/><path d="M248 92 H290 Q325 92 346 88"/><path d="M466 88 Q500 92 530 92 H560"/></g>
          {piece('fid', <g>
            <rect x="560" y="52" width="74" height="76" rx="8" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5"/>
            <path d="M597 98 C588 88 592 76 597 68 C602 76 606 88 597 98 Z" fill="#fb923c" stroke="#c2410c"/>
            <text x="597" y="118" style={txt}>FID</text>
            <text x="597" y="40" style={fin}>H₂ + air</text>
            <text x="597" y="146" style={txt}>Détecteur</text></g>)}
        </svg>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55, marginTop: 4, minHeight: 20 }}>
        {actif ? <><strong>{PIECES[actif].nom}</strong> — {PIECES[actif].role}<div style={{ marginTop: 3, color: KIT.txt2 }}><strong>À contrôler :</strong> {PIECES[actif].ctrl}</div></>
          : <span style={{ color: KIT.txt2 }}>Cliquez sur un élément de l’appareil pour voir son rôle et ce que l’on contrôle en routine. Le gaz vecteur circule de gauche à droite. La pression affichée est celle du début du programme ; à débit constant, elle atteint {Math.round(a.pression.fin)} kPa en fin de programme.</span>}
      </div>
    </div>);
}

// ---------- contrôle de routine ----------
function Controle({ a }) {
  const r = a.ref;
  if (!r) return <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Aucun écart : l’installation est conforme à la référence.</div>;
  const der = x => x.pics[x.pics.length - 1];
  const rsMin = x => x.res.length ? Math.min(...x.res.map(q => q.R)) : null;
  const aire = x => x.pics.reduce((s, m) => s + m.aire, 0);
  const vide = a.ligneBase.eteinte;
  const lb = a.ligneBase.eteinte ? 'à zéro, sans bruit' : a.ligneBase.ressuage > 1 ? 'monte en fin de programme' : a.ligneBase.bruit > 0 ? 'bruitée' : 'plate';
  const lignes = [
    ['Pression en tête (début)', `${Math.round(r.pression.debut)} kPa`, `${Math.round(a.pression.debut)} kPa`, a.pression.debut / r.pression.debut],
    [<>Temps mort {T0} (méthane)</>, `${v(r.t0)} min`, `${v(a.t0)} min`, a.t0 / r.t0],
    [<>{TR} du dernier pic</>, `${v(der(r).tr)} min`, vide ? 'aucun pic' : `${v(der(a).tr)} min`, vide ? 0 : der(a).tr / der(r).tr],
    [<>Largeur W<Ind>½</Ind> du dernier pic</>, `${v(der(r).W * 60, 1)} s`, vide ? '—' : `${v(der(a).W * 60, 1)} s`, vide ? 1 : der(a).W / der(r).W],
    ...(rsMin(r) != null && !vide ? [[<>R<Ind>s</Ind> minimal</>, v(rsMin(r)), v(rsMin(a)), rsMin(a) / rsMin(r)]] : []),
    ['Aire totale des pics', '100 %', `${Math.round(100 * aire(a) / aire(r))} %`, aire(a) / aire(r)],
    ['Ligne de base', 'plate', lb, lb === 'plate' ? 1 : 0],
  ];
  return (
    <div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>On compare les valeurs du jour à celles de la méthode validée (installation en bon état, même mélange, mêmes réglages). Un écart de plus de 10 % est à expliquer.</div>
      <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
        <thead><tr style={{ background: '#eef2f6' }}>{['Grandeur', 'Référence', 'Aujourd’hui', ''].map((h, i) => <th key={i} style={{ padding: '4px 8px', textAlign: 'left', fontSize: 12.5, borderBottom: '1px solid #cbd5e1' }}>{h}</th>)}</tr></thead>
        <tbody>{lignes.map(([nom, ref, act, rap], i) => {
          const ecart = Math.abs(rap - 1) > 0.1;
          return <tr key={i} style={{ background: ecart ? '#fff7ed' : 'transparent' }}>
            <td style={{ padding: '3px 8px' }}>{nom}</td><td style={{ padding: '3px 8px', color: KIT.txt2 }}>{ref}</td>
            <td style={{ padding: '3px 8px', fontWeight: ecart ? 700 : 400, color: ecart ? '#b45309' : KIT.txt }}>{act}</td>
            <td style={{ padding: '3px 8px', color: '#b45309', fontWeight: 700 }}>{ecart ? (rap > 1 ? '↑' : '↓') : ''}</td></tr>;
        })}</tbody></table></div>
    </div>);
}

// ====================================================
//  DÉFIS
// ====================================================
const tire = tab => tab[Math.floor(Math.random() * tab.length)];
const melanger = tab => [...tab].sort(() => Math.random() - 0.5);
const SOLVANTS = COMPOSES.filter(c => !c.alcane).map(c => c.id);
const MELANGES_SEPARER = [['mek', 'c6', 'aceet', 'chcl3'], ['etoh', 'acn', 'acet', 'ipa'], ['meoh', 'mek', 'etoh', 'dcm'], ['benz', 'c7', 'aceet', 'mek', 'c6'], ['meoh', 'mek', 'ipa', 'aceip']];
let SEPARABLES = null;
function melangesSeparer() {
  if (SEPARABLES) return SEPARABLES;
  const ok = (p, ids) => { const r = analyse(p, ids); return r.pics.length === ids.length && r.res.every(x => x.R >= SEUIL_RS[1]) && r.pics[r.pics.length - 1].tr <= TEMPS_MAX_DEFI; };
  SEPARABLES = MELANGES_SEPARER.filter(ids => !ok(PARAMS_DEFAUT, ids) && (ok({ ...PARAMS_DEFAUT, phase: 'polaire' }, ids) || ok({ ...PARAMS_DEFAUT, phase: 'apolaire' }, ids)));
  return SEPARABLES;
}
function nouveauDefi(type) {
  if (type === 'ordre') {
    const phase = tire(['apolaire', 'polaire']);
    for (let n = 0; n < 300; n++) {
      const ids = melanger(SOLVANTS).slice(0, 4);
      const r = analyse({ ...PARAMS_DEFAUT, phase }, ids);
      if (r.pics.length === 4 && r.pics.every((m, k) => !k || m.tr - r.pics[k - 1].tr > 0.15)) return { type, phase, mols: ids, reps: { ordre: [] }, verifie: false };
    }
    return { type, phase, mols: ['acet', 'etoh', 'tol', 'oxyl'], reps: { ordre: [] }, verifie: false };
  }
  if (type === 'identifier') {
    const phase = tire(['apolaire', 'polaire']);
    for (let n = 0; n < 300; n++) {
      const ids = melanger(SOLVANTS).slice(0, 4);
      const r = analyse({ ...PARAMS_DEFAUT, phase }, ids);
      if (r.pics.length === 4 && r.res.every(x => x.R >= 3) && r.pics.every((m, k) => !k || m.tr / r.pics[k - 1].tr >= 1.06)) {
        const retire = tire(ids);
        return { type, phase, mols: ids.filter(i => i !== retire), etalons: ids, reps: {}, verifie: false };
      }
    }
    return { type, phase, mols: ['acet', 'aceet', 'tol'], etalons: ['acet', 'aceet', 'tol', 'oxyl'], reps: {}, verifie: false };
  }
  if (type === 'panne') return { type, mols: tire([['etoh', 'acet', 'aceet', 'tol', 'oxyl'], ['meoh', 'buoh', 'mek', 'tol', 'c10'], ['ipa', 'aceet', 'diox', 'ebz', 'c12']]), panne: tire(Object.keys(PANNES)), reps: {}, verifie: false };
  return { type: 'separer', mols: tire(melangesSeparer()), reps: {}, verifie: false };
}
const TITRES = { ordre: 'Ordre d’élution', identifier: 'Identifier des pics', separer: 'Colonne et programme', panne: 'Diagnostiquer une panne' };

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationCPG() {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('cpg-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [p, setP] = useState({ ...PARAMS_DEFAUT });
  const maj = (k, x) => setP(q => ({ ...q, [k]: x }));
  const [selected, setSelected] = useState(['etoh', 'acet', 'aceet', 'tol', 'oxyl']);
  const [ouv, setOuv] = useState({ melange: true, tableau: true, hypo: false, pannes: false, colonne: false, inj: false });
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const [hover, setHover] = useState(null);
  const [lancement, setLancement] = useState(0);
  const [piece, setPiece] = useState(null);
  const injecter = () => setLancement(n => n + 1);

  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const fige = enDefi && defi.type !== 'separer';
  const ids = enDefi ? defi.mols : selected;
  const pEff = !fige ? p : defi.type === 'panne' ? { ...PARAMS_DEFAUT, panne: defi.panne } : { ...PARAMS_DEFAUT, phase: defi.phase };
  const pCalc = pEff.panne === 'septum' ? { ...pEff, essai: lancement } : pEff;
  const a = analyseMemo(pCalc, ids);
  const couleurs = {}; ids.forEach((id, i) => { couleurs[id] = PALETTE[i % PALETTE.length]; });
  const nbPics = a.pics.length;
  const rsMin = nbPics > 1 ? Math.min(...a.res.map(r => r.R)) : null;
  const dernierTr = nbPics ? a.pics[nbPics - 1].tr : 0;
  const surcharge = a.pics.some(m => m.surcharge > 1.5);
  const toggleMol = id => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const memeMelange = l => selected.length === l.length && l.every(i => selected.includes(i));
  const mettre = (l, extra = {}) => { setSelected(l); setP({ ...PARAMS_DEFAUT, ...extra }); injecter(); };
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, VERT), margin: '6px 0' }}>{label}</button>;
  const CINQ = ['etoh', 'acet', 'aceet', 'tol', 'oxyl'], VOISINS = ['mek', 'c6', 'aceet', 'chcl3'], LARGE = ['etoh', 'acet', 'aceet', 'tol', 'oxyl', 'c10', 'c12'];
  const ref0 = ecoulement(PARAMS_DEFAUT, PARAMS_DEFAUT.T0).pEntree;
  const ETAPES = [
    { id: 'appareil', titre: 'Le chemin de l’échantillon', focus: ['appareil'],
      texte: <>Un chromatographe en phase gazeuse est une chaîne : le <strong>gaz vecteur</strong> (hélium) traverse l’<strong>injecteur</strong> chauffé où l’on vaporise l’échantillon, puis la <strong>colonne capillaire</strong> enroulée dans le <strong>four</strong>, et enfin le <strong>détecteur FID</strong>. Cliquez sur chaque élément du schéma pour lire son rôle et ce qu’on y contrôle.</>,
      tache: { type: 'qcm', q: 'Dans quel ordre l’échantillon vaporisé traverse-t-il l’appareil ?', options: ['injecteur → colonne (dans le four) → détecteur', 'colonne → injecteur → détecteur', 'injecteur → détecteur → colonne'], bonne: 0,
        expl: 'L’échantillon est vaporisé dans l’injecteur, séparé dans la colonne et détecté à sa sortie. Le gaz vecteur, lui, circule en permanence depuis la bouteille.' } },
    { id: 'inj', titre: 'Injecter et regarder', focus: ['viz'],
      texte: <>On injecte 0,2 µL d’un mélange d’éthanol, d’acétone, d’acétate d’éthyle, de toluène et d’o-xylène (5 % de chacun dans du CS₂, invisible au FID), sur colonne <strong>apolaire</strong>, avec un programme de 40 à 200 °C. Regardez les bandes avancer et le chromatogramme se tracer, puis survolez les pics.</>,
      tache: { type: 'action', ok: lancement > 0 && memeMelange(CINQ), label: '▶ Mettre le mélange et injecter', faire: () => mettre(CINQ), consigne: 'Glissez sur le chromatogramme pour zoomer sur les premiers pics.' } },
    { id: 'teb', titre: 'Sur colonne apolaire : l’ordre des températures d’ébullition', focus: ['viz', 'resultats'],
      texte: <>Le tableau des résultats donne la température d’ébullition de chaque composé. Comparez avec l’ordre de sortie.</>,
      tache: { type: 'qcm', q: 'Sur une colonne apolaire, les composés sortent à peu près…', options: ['dans l’ordre croissant de leur température d’ébullition', 'dans l’ordre décroissant de leur température d’ébullition', 'dans l’ordre de leur masse molaire, quelle que soit leur famille'], bonne: 0,
        expl: 'Sur une phase apolaire, la rétention dépend surtout de la volatilité : plus un composé est volatil, plus il passe de temps dans le gaz et sort tôt. Ce n’est qu’une tendance : l’éthanol (78 °C) sort avant l’acétone (56 °C) car ses liaisons hydrogène ne trouvent pas de partenaire dans la phase apolaire.' } },
    { id: 'ident', titre: 'Identifier un pic par son temps de rétention', focus: ['viz', 'resultats'],
      texte: <>En routine, on identifie un composé en comparant son t<Ind>R</Ind> à celui d’un <strong>étalon injecté dans les mêmes conditions</strong> (même colonne, même programme, même débit). Étalon de toluène seul : t<Ind>R</Ind> = {v(trSeul(PARAMS_DEFAUT, 'tol'), 3)} min ; étalon d’o-xylène seul : {v(trSeul(PARAMS_DEFAUT, 'oxyl'), 3)} min.</>,
      tache: { type: 'qcm', q: `Dans un échantillon analysé avec la même méthode, un pic sort à ${v(trSeul(PARAMS_DEFAUT, 'tol'), 3)} min. Que peut-on conclure ?`, options: ['c’est probablement du toluène : il faut le confirmer (autre colonne ou spectre de masse)', 'c’est certainement du toluène', 'on ne peut rien dire sans calculer k'], bonne: 0,
        expl: 'Un même t_R est un indice fort mais pas une preuve : un autre composé peut sortir au même instant. On confirme en changeant de colonne (polarité différente) ou par CPG couplée à la spectrométrie de masse.' } },
    { id: 'colonne', titre: 'Choisir la colonne', focus: ['colonne', 'viz', 'resultats'],
      texte: <>Mélange difficile : butanone, hexane, acétate d’éthyle et chloroforme, quatre composés de volatilités voisines. {bouton('Mettre ce mélange (colonne apolaire)', () => mettre(VOISINS))} Sur colonne apolaire, deux pics se superposent. Passez sur la colonne <strong>polaire</strong> (PEG) et injectez à nouveau.</>,
      tache: { type: 'action', ok: memeMelange(VOISINS) && p.phase === 'polaire' && nbPics === 4 && rsMin >= SEUIL_RS[1], label: null,
        consigne: memeMelange(VOISINS) ? `Colonne ${p.phase} · R_s minimal : ${v(rsMin ?? 0)}` : 'Remettez le mélange avec le bouton ci-dessus.' } },
    { id: 'iso', titre: 'Isotherme ou programmation de température ?', focus: ['four', 'viz'],
      texte: <>Mélange très étalé : du très volatil (éthanol, 78 °C) au très lourd (dodécane, 216 °C). {bouton('Mettre ce mélange en isotherme à 40 °C', () => mettre(LARGE, { rampe: 0 }))} Essayez aussi un isotherme à 120 °C.</>,
      tache: { type: 'qcm', q: 'Que constate-t-on en isotherme ?', options: ['à basse température, les composés lourds sortent très tard et en pics larges et bas ; à haute température, les composés volatils sortent ensemble', 'l’isotherme sépare tout, rapidement', 'la température du four ne change pas les temps de rétention'], bonne: 0,
        expl: 'Aucune température unique ne convient à un mélange de volatilités très différentes. On programme donc le four : départ froid pour séparer les volatils, puis montée en température pour faire sortir les lourds plus tôt, en pics fins.' } },
    { id: 'prog', titre: 'Programmer le four', focus: ['four', 'viz', 'resultats'],
      texte: <>Réglez une <strong>rampe de température</strong> (vitesse en °C/min non nulle) pour séparer les 7 composés (R<Ind>s</Ind> ≥ 1,5) avec un dernier pic avant 12 min.</>,
      tache: { type: 'action', ok: p.rampe > 0 && memeMelange(LARGE) && nbPics === 7 && rsMin >= SEUIL_RS[1] && dernierTr <= 12, label: null,
        consigne: memeMelange(LARGE) ? `${nbPics} pics sur 7 · R_s minimal : ${v(rsMin ?? 0)} · dernier pic à ${v(dernierTr)} min` : 'Remettez le mélange à l’étape précédente.' } },
    { id: 'debit', titre: 'Débit du gaz vecteur et pression', focus: ['appareil', 'colonne'],
      texte: <>{bouton('Revenir au mélange de 5 composés (méthode de départ)', () => mettre(CINQ))} Le régulateur maintient un <strong>débit constant</strong> en ajustant la pression en tête de colonne : ≈ {Math.round(ref0)} kPa au départ. Changez le débit et regardez la pression, t<Ind>0</Ind> et les temps de rétention.</>,
      tache: { type: 'qcm', q: 'On passe de 1,2 à 2,4 mL/min. Que se passe-t-il ?', options: ['la pression en tête augmente et tous les composés sortent plus tôt', 'la pression diminue et les composés sortent plus tard', 'rien ne change : seule la température compte'], bonne: 0,
        expl: 'Pour faire passer plus de gaz dans le même tube, il faut plus de pression. Le gaz va plus vite : t₀ et tous les t_R diminuent. Un débit trop élevé élargit un peu les pics ; on garde le débit de la méthode validée.' } },
    { id: 'split', titre: 'Split ou splitless ?', focus: ['injecteur', 'viz'],
      texte: <>En mode <strong>split</strong>, la vanne de fuite évacue la plus grande partie de l’échantillon vaporisé : avec un rapport 1:100, environ 1 % seulement entre dans la colonne. Essayez 1:10, puis le mode <strong>splitless</strong>.</>,
      tache: { type: 'qcm', q: 'On passe du rapport de division 1:100 à 1:10. Les aires des pics…', options: ['sont multipliées par environ 9', 'sont divisées par 10', 'ne changent pas'], bonne: 0,
        expl: 'La fraction qui entre dans la colonne passe de 1/101 à 1/11 : les aires sont multipliées par ≈ 9. En splitless, presque tout l’échantillon entre : les pics d’un échantillon concentré se déforment (colonne saturée). Le splitless est réservé aux traces, avec un four froid au départ pour reconcentrer les composés en tête de colonne.' } },
    { id: 'septum', titre: 'Panne n° 1 : pression basse, pics en retard', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => mettre(CINQ, { panne: 'septum' }))} Comparez le tableau « Contrôle de routine » à la référence. Injectez plusieurs fois et regardez les aires.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.septum.nom, PANNES.flamme.nom, PANNES.ressuage.nom], bonne: 0,
        expl: `Une fuite à l’injecteur fait perdre du gaz vecteur et de l’échantillon : la pression et le débit réel baissent, les t_R augmentent, les aires diminuent et varient d’une injection à l’autre. Geste : ${PANNES.septum.geste}` } },
    { id: 'liner', titre: 'Panne n° 2 : les alcools traînent', focus: ['controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => mettre(['etoh', 'buoh', 'aceet', 'tol', 'oxyl'], { panne: 'liner' }))} Zoomez sur les pics de l’éthanol et du butan-1-ol, puis sur ceux du toluène.</>,
      tache: { type: 'qcm', q: 'Seuls les alcools traînent et perdent de l’aire. Cause la plus probable ?', options: [PANNES.liner.nom, PANNES.septum.nom, PANNES.hydrogene.nom], bonne: 0,
        expl: `Des sites actifs (liner sale, débris de septum, tête de colonne dégradée) retiennent les composés capables de liaisons hydrogène : leurs pics traînent. Geste : ${PANNES.liner.geste}` } },
    { id: 'flamme', titre: 'Panne n° 3 : plus aucun pic', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => mettre(CINQ, { panne: 'flamme' }))} La pression et le débit sont normaux, l’injection s’est bien passée…</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.flamme.nom, PANNES.septum.nom, PANNES.liner.nom], bonne: 0,
        expl: `Ligne de base plate à zéro, sans aucun bruit : le détecteur ne fonctionne pas. Geste : ${PANNES.flamme.geste}` } },
    { id: 'ressuage', titre: 'Panne n° 4 : la ligne de base monte', focus: ['controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => mettre(CINQ, { panne: 'ressuage', Tf: 250 }))} Le programme monte jusqu’à 250 °C. Observez la ligne de base en fin d’analyse.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.ressuage.nom, PANNES.flamme.nom, PANNES.hydrogene.nom], bonne: 0,
        expl: `À haute température, une colonne usée (ou chauffée au-delà de sa limite) perd de la phase stationnaire, qui brûle dans le FID : la ligne de base monte avec la température. Geste : ${PANNES.ressuage.geste}` } },
    { id: 'fin', titre: 'À retenir', focus: [],
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Chaîne : <strong>gaz vecteur → injecteur → colonne (four) → FID</strong>.</li>
        <li>Colonne <strong>apolaire</strong> : ordre ≈ températures d’ébullition. Colonne <strong>polaire</strong> : les composés polaires sont retardés. On change de colonne quand deux composés co-éluent.</li>
        <li>On <strong>identifie</strong> par t<Ind>R</Ind> (étalon dans les mêmes conditions) et on confirme par une autre méthode.</li>
        <li>La <strong>programmation</strong> du four sépare les volatils et fait sortir les lourds plus tôt, en pics fins. Le débit raccourcit l’analyse mais augmente la pression.</li>
        <li><strong>Split</strong> pour les échantillons concentrés, <strong>splitless</strong> pour les traces.</li>
        <li>Diagnostic : pression ↓ et t<Ind>R</Ind> ↑ : fuite (septum). Traînée des polaires : liner. Aucun pic : flamme. Ligne de base qui monte : ressuage.</li></ul></ARetenir>,
      tache: null },
  ];
  const cadre = id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  function lancer(type) { const d = nouveauDefi(type); setDefi(d); setP({ ...PARAMS_DEFAUT }); setHover(null); injecter(); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'ordre'); else setP(q => (q.panne ? { ...q, panne: null } : q)); }
  const ordreVrai = a.pics.map(m => m.id);
  function evaluer(d) {
    if (d.type === 'ordre') { const ok = JSON.stringify(d.reps.ordre) === JSON.stringify(ordreVrai); return { ok, ligne: ok ? 'Bon ordre !' : d.phase === 'apolaire' ? 'Pas encore : sur colonne apolaire, pensez d’abord aux températures d’ébullition (avec des écarts pour les alcools).' : 'Pas encore : sur colonne polaire, les composés capables de liaisons hydrogène (alcools) ou très polaires sont fortement retenus.' }; }
    if (d.type === 'identifier') {
      const ok = a.pics.every((m, i) => d.reps[LETTRES[i]] === m.id);
      return { ok, ligne: ok ? 'Tous les pics sont identifiés : même tR que l’étalon, dans les mêmes conditions.' : 'Comparez le tR de chaque pic (survol, zoom) à ceux des étalons. Attention : un étalon de la liste n’est pas dans l’échantillon.' };
    }
    if (d.type === 'panne') { const ok = d.reps.cause === d.panne; return { ok, ligne: ok ? `Bien vu : ${PANNES[d.panne].nom}. Geste : ${PANNES[d.panne].geste}` : d.reps.cause ? 'Ce n’est pas la bonne cause : confrontez les écarts du contrôle de routine (pression, tR, aires, ligne de base) aux symptômes de chaque défaut.' : 'Choisissez d’abord une cause.' }; }
    const ok = nbPics === d.mols.length && rsMin >= SEUIL_RS[1] && dernierTr <= TEMPS_MAX_DEFI;
    return { ok, ligne: ok ? 'Séparation obtenue dans le temps imparti.' : `Il faut Rs ≥ 1,5 pour toutes les paires et un dernier pic avant ${TEMPS_MAX_DEFI} min (actuellement Rs minimal = ${v(rsMin ?? 0)} ; dernier pic à ${v(dernierTr)} min).` };
  }
  const res = enDefi && defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${enDefi ? defi.type : 'ordre'}`, reussi);
  const prog = lireProgression();
  const masque = enDefi && defi.type === 'ordre' && !defi.verifie && !defi.solution;
  const anonyme = enDefi && defi.type === 'identifier' && !defi.solution && !reussi;
  const rep = (k, x) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: x }, verifie: false }));
  const txtD = { fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const conditions = <>colonne {pEff.phase} {pEff.L} m × {String(pEff.dc).replace('.', ',')} mm, {GAZ[pEff.gaz].nom} {v(pEff.debit, 1)} mL/min, four {pEff.T0} °C ({pEff.t1} min) puis {pEff.rampe} °C/min jusqu’à {pEff.Tf} °C, split 1:{pEff.split}</>;
  const voletDefi = enDefi && (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => lancer(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'ordre' && <>
        <div style={txtD}>🎯 Méthode : {conditions}. Cliquez les composés <strong>dans l’ordre où ils sortent</strong>. Le chromatogramme apparaît après la vérification.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{ids.map(id => {
          const m = PAR_ID[id], rang = defi.reps.ordre.indexOf(id);
          return <button key={id} onClick={() => rep('ordre', rang >= 0 ? defi.reps.ordre.filter(x => x !== id) : [...defi.reps.ordre, id])} style={stylePetitBouton(rang >= 0, couleurs[id])}>
            {rang >= 0 ? `${rang + 1}. ` : ''}{m.nom} <span style={{ opacity: 0.75, fontWeight: 400 }}>{m.famille}, téb {Math.round(m.teb)} °C</span></button>;
        })}</div></>}
      {defi.type === 'identifier' && <>
        <div style={txtD}>🎯 Méthode : {conditions}. On a injecté séparément quatre étalons ; l’échantillon n’en contient que <strong>trois</strong>. Identifiez chaque pic (survolez-le, zoomez si besoin).</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
          {defi.etalons.map(i => <span key={i} style={{ ...styleBoite, padding: '3px 8px' }}>{PAR_ID[i].nom} : <strong>{v(trSeul(pEff, i), 3)} min</strong></span>)}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          {a.pics.map((m, i) => <label key={m.id} style={{ fontSize: 14, fontWeight: 700 }}>Pic {LETTRES[i]} {' '}
            <select value={defi.reps[LETTRES[i]] ?? ''} onChange={e => rep(LETTRES[i], e.target.value)} style={{ fontSize: 14, padding: '3px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, color: KIT.txt }}>
              <option value="">?</option>{defi.etalons.map(k => <option key={k} value={k}>{PAR_ID[k].nom}</option>)}</select></label>)}</div></>}
      {defi.type === 'separer' && <>
        <div style={txtD}>🎯 Mélange : <strong>{ids.map(i => PAR_ID[i].nom).join(', ')}</strong>. Choisissez la colonne et réglez le four (et le débit si besoin) pour obtenir <strong>R<Ind>s</Ind> ≥ 1,5</strong> pour toutes les paires, dernier pic <strong>avant {TEMPS_MAX_DEFI} min</strong>.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
          <span style={{ ...styleBoite, padding: '3px 8px', color: nbPics === ids.length ? COUL_RS[classeRs(rsMin ?? 0)] : KIT.txt2, fontWeight: 700 }}>R<Ind>s</Ind> minimal = {v(rsMin ?? 0)}</span>
          <span style={{ ...styleBoite, padding: '3px 8px', color: dernierTr <= TEMPS_MAX_DEFI ? '#15803d' : '#b91c1c', fontWeight: 700 }}>dernier pic : {v(dernierTr)} min</span></div></>}
      {defi.type === 'panne' && <>
        <div style={txtD}>🎯 Une analyse de routine (mélange {ids.map(i => PAR_ID[i].nom).join(', ')} ; méthode validée : {conditions}) donne ce chromatogramme. Observez l’appareil et le contrôle de routine (réinjectez si besoin), puis choisissez la <strong>cause la plus probable</strong>.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(PANNES).map(([k, q]) => <button key={k} onClick={() => rep('cause', k)} style={stylePetitBouton(defi.reps.cause === k, '#0ea5e9')}>{q.nom}</button>)}</div></>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => lancer(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14, color: res.ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{res.ok ? '✅' : '❌'} {res.ligne}{res.ok && <div style={{ fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'ordre' && <>Ordre de sortie : <strong>{a.pics.map(m => m.nom).join(' → ')}</strong>.</>}
        {defi.type === 'identifier' && <>{a.pics.map((m, i) => <span key={m.id}>Pic {LETTRES[i]} ({TR} = {v(m.tr, 3)} min) : <strong>{m.nom}</strong>{i < a.pics.length - 1 ? ' ; ' : '.'} </span>)}</>}
        {defi.type === 'panne' && <><strong>{PANNES[defi.panne].nom}</strong> — {PANNES[defi.panne].symptome}. Geste : {PANNES[defi.panne].geste}</>}
        {defi.type === 'separer' && (() => {
          const ap = analyse({ ...PARAMS_DEFAUT, phase: 'apolaire' }, ids), po = analyse({ ...PARAMS_DEFAUT, phase: 'polaire' }, ids);
          const rs = x => v(Math.min(...x.res.map(r => r.R)));
          return <>Avec la méthode de départ : R<Ind>s</Ind> minimal = {rs(ap)} sur colonne apolaire, {rs(po)} sur colonne polaire. Choisissez la colonne sur laquelle les composés diffèrent le plus (volatilité ou polarité), puis ajustez le programme.</>;
        })()}</div>}
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const totalAire = a.pics.reduce((s, m) => s + m.aire, 0);
  const resultats = nbPics === 0 || anonyme || masque ? null : (
    <div style={{ ...styleBoite, ...cadre('resultats') }}>
      <Section titre={`Résultats : ${nbPics} pic${nbPics > 1 ? 's' : ''}`} ouvert={ouv.tableau} onBascule={() => bascule('tableau')}>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>{T0} = {v(a.t0)} min (méthane). I : indice de rétention de Kováts sur cette colonne. Aire % : part de chaque pic dans l’aire totale (normalisation) ; le FID ne répond pas pareil à tous les composés, l’aire % n’est donc pas un % en masse.</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
            <thead><tr style={{ background: '#eef2f6' }}>
              {['Composé', 'téb (°C)', <>{TR} (min)</>, 'I', <>W<Ind>½</Ind> (s)</>, 'Aire', 'Aire %'].map((h, i) =>
                <th key={i} style={{ padding: '5px 8px', borderBottom: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 12.5 }}>{h}</th>)}</tr></thead>
            <tbody>{a.pics.map(m => (
              <tr key={m.id} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)} style={{ background: hover === m.id ? '#fff7ed' : 'transparent' }}>
                <td style={{ padding: '4px 8px', fontWeight: 700 }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: couleurs[m.id], marginRight: 6 }}/>{m.nom}</td>
                <td style={{ padding: '4px 8px', color: KIT.txt2 }}>{Math.round(m.teb)}</td>
                <td style={{ padding: '4px 8px', fontWeight: 700 }}>{v(m.tr, 3)}</td>
                <td style={{ padding: '4px 8px' }}>{Math.round(m.Ik)}</td>
                <td style={{ padding: '4px 8px' }}>{v(m.W * 60, 1)}</td>
                <td style={{ padding: '4px 8px' }}>{v(m.aire, 1)}</td>
                <td style={{ padding: '4px 8px' }}>{totalAire > 0 ? v(100 * m.aire / totalAire, 1) : '—'}</td>
              </tr>))}</tbody>
          </table></div>
        {a.res.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {a.res.map((r, i) => { const c = classeRs(r.R); return (
            <div key={i} style={{ background: 'white', borderRadius: 8, padding: '5px 10px', fontSize: 13, border: `1.5px solid ${COUL_RS[c]}` }}>
              <span style={{ color: KIT.txt2 }}>{r.de.nom} / {r.a.nom} : </span>
              <strong style={{ color: COUL_RS[c] }}>R<Ind>s</Ind> = {r.R > 20 ? '> 20' : v(r.R)} {c === 'ok' ? '✓' : c === 'lim' ? '⚠' : '✗'}</strong></div>); })}</div>}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>R<Ind>s</Ind> = 1,18 (t<Ind>R2</Ind> − t<Ind>R1</Ind>) / (W<Ind>½,1</Ind> + W<Ind>½,2</Ind>) : <span style={{ color: COUL_RS.ok }}>✓ ≥ 1,5</span> séparés · <span style={{ color: COUL_RS.lim }}>⚠ 1,0 à 1,5</span> partiellement · <span style={{ color: COUL_RS.non }}>✗ &lt; 1,0</span> superposés.</div>
      </Section>
    </div>);

  const melange = !enDefi && (
    <div style={{ ...styleBoite, ...cadre('melange') }}>
      <Section titre={`Échantillon : ${selected.length ? selected.map(i => PAR_ID[i].nom).join(', ') : 'aucun composé'}`} ouvert={ouv.melange} onBascule={() => bascule('melange')}>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Chaque composé choisi est à {Math.round(FRACTION_VOL * 100)} % en volume dans le disulfure de carbone (CS₂), solvant presque invisible au FID. La température d’ébullition est indiquée.</div>
        {FAMILLES.map(f => <div key={f} style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: KIT.txt2, width: 76 }}>{f === 'alcane' ? 'n-alcanes' : f + 's'}</span>
          {COMPOSES.filter(c => c.famille === f).map(c => <button key={c.id} onClick={() => toggleMol(c.id)} aria-pressed={selected.includes(c.id)}
            style={{ ...stylePetitBouton(selected.includes(c.id), VERT), borderRadius: 16, fontWeight: selected.includes(c.id) ? 700 : 500 }}>
            {c.nom} <span style={{ opacity: 0.7, fontSize: 11, fontWeight: 400 }}>{Math.round(c.teb)} °C</span></button>)}
        </div>)}
      </Section>
    </div>);

  const libre = !fige;
  const reglages = (
    <div style={{ ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages de la méthode</div>
      {!libre ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Méthode imposée par l’énoncé : {conditions}.</div> : <>
        <div style={{ ...cadre('four'), padding: 2 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: KIT.txt2, marginBottom: 2 }}>Four :
            <button onClick={() => maj('rampe', 0)} style={stylePetitBouton(!(p.rampe > 0), '#c2410c')}>isotherme</button>
            <button onClick={() => maj('rampe', p.rampe > 0 ? p.rampe : 10)} style={stylePetitBouton(p.rampe > 0, '#c2410c')}>programmation</button></div>
          <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            <Curseur nom={p.rampe > 0 ? 'Température initiale' : 'Température du four'} valeur={p.T0} onChange={x => maj('T0', x)} min={30} max={PHASES[p.phase].tmax} pas={5} unite="°C" couleur="#c2410c"/>
            {p.rampe > 0 && <Curseur nom="Palier initial" valeur={p.t1} onChange={x => maj('t1', x)} min={0} max={10} pas={0.5} unite="min" decimales={1} couleur="#c2410c"/>}
            {p.rampe > 0 && <Curseur nom="Vitesse de chauffe" valeur={p.rampe} onChange={x => maj('rampe', x)} min={1} max={40} pas={1} unite="°C/min" couleur="#c2410c"/>}
            {p.rampe > 0 && <Curseur nom="Température finale" valeur={p.Tf} onChange={x => maj('Tf', Math.max(x, p.T0))} min={50} max={PHASES[p.phase].tmax + 25} pas={5} unite="°C" couleur="#c2410c"/>}
            {p.rampe > 0 && <Curseur nom="Palier final" valeur={p.t2} onChange={x => maj('t2', x)} min={0} max={20} pas={0.5} unite="min" decimales={1} couleur="#c2410c"/>}
          </div>
          {(p.rampe > 0 ? p.Tf : p.T0) > PHASES[p.phase].tmax && <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 700 }}>⚠ Au-delà de {PHASES[p.phase].tmax} °C, la phase {p.phase} se dégrade : ressuage et colonne abîmée.</div>}
        </div>
        <div style={{ ...cadre('colonne'), padding: 2, marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: KIT.txt2 }}>Colonne :
            <button onClick={() => maj('phase', 'apolaire')} style={stylePetitBouton(p.phase === 'apolaire', VERT)} title={PHASES.apolaire.chimie}>apolaire (5 % phényl)</button>
            <button onClick={() => maj('phase', 'polaire')} style={stylePetitBouton(p.phase === 'polaire', '#7c3aed')} title={PHASES.polaire.chimie}>polaire (PEG, WAX)</button>
            <button onClick={() => bascule('colonne')} aria-expanded={ouv.colonne} style={stylePetitBouton(false)}>{ouv.colonne ? '▲' : '▼'} dimensions et gaz</button></div>
          <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            <Curseur nom="Débit du gaz vecteur" valeur={p.debit} onChange={x => maj('debit', x)} min={0.3} max={5} pas={0.1} unite="mL/min" decimales={1} couleur={VERT}/>
          </div>
          {ouv.colonne && <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: KIT.txt2, marginTop: 4 }}>
            <span>Longueur : {[15, 30, 60].map(x => <button key={x} onClick={() => maj('L', x)} style={stylePetitBouton(p.L === x, '#475569')}>{x} m</button>)}</span>
            <span>Diamètre : {[0.25, 0.32, 0.53].map(x => <button key={x} onClick={() => maj('dc', x)} style={stylePetitBouton(p.dc === x, '#475569')}>{String(x).replace('.', ',')} mm</button>)}</span>
            <span>Film : {[0.25, 0.5, 1].map(x => <button key={x} onClick={() => maj('df', x)} style={stylePetitBouton(p.df === x, '#475569')}>{String(x).replace('.', ',')} µm</button>)}</span>
            <span>Gaz : {Object.entries(GAZ).map(([k, g]) => <button key={k} onClick={() => maj('gaz', k)} style={stylePetitBouton(p.gaz === k, '#475569')} title={g.nom}>{k === 'H2' ? 'H₂' : k === 'N2' ? 'N₂' : 'He'}</button>)}</span>
          </div>}
        </div>
        <div style={{ ...cadre('injecteur'), padding: 2, marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: KIT.txt2 }}>Injecteur :
            <button onClick={() => maj('mode', 'split')} style={stylePetitBouton(p.mode === 'split', '#0369a1')}>split</button>
            <button onClick={() => maj('mode', 'splitless')} style={stylePetitBouton(p.mode === 'splitless', '#0369a1')}>splitless</button></div>
          <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {p.mode === 'split' && <Curseur nom="Rapport de division 1:" valeur={p.split} onChange={x => maj('split', x)} min={5} max={500} pas={5} unite="" couleur="#0369a1"/>}
            <Curseur nom="Volume injecté" valeur={p.V} onChange={x => maj('V', x)} min={0.1} max={2} pas={0.1} unite="µL" decimales={1} couleur="#0369a1"/>
          </div>
        </div>
        <div style={{ fontSize: 13.5, marginTop: 4, color: a.pression.fin > P_MAX ? '#b91c1c' : KIT.txt2 }}>Pression en tête : {Math.round(a.pression.debut)} kPa au départ{p.rampe > 0 ? `, ${Math.round(a.pression.fin)} kPa à ${p.Tf} °C` : ''} · {T0} = {v(a.t0)} min{a.pression.fin > P_MAX ? ` : au-delà de ${P_MAX} kPa, le régulateur ne peut plus maintenir le débit.` : '.'}</div>
      </>}
    </div>);

  const appareil = (
    <div style={{ ...styleBoite, background: 'white', ...cadre('appareil') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>L’appareil</div>
      <Appareil a={a} p={pEff} actif={piece} setActif={setPiece}/>
    </div>);
  const controle = (pEff.panne || enGuide) && (
    <div style={{ ...styleBoite, ...cadre('controle') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Contrôle de routine</div>
      <Controle a={a}/>
    </div>);
  const defauts = mode === 'explore' && (
    <div style={styleBoite}>
      <Section titre={`Simuler un défaut${p.panne ? ` : ${PANNES[p.panne].nom}` : ''}`} ouvert={ouv.pannes} onBascule={() => bascule('pannes')}>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Choisissez un défaut, injectez, puis comparez le chromatogramme et le contrôle de routine à la situation normale.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <button onClick={() => maj('panne', null)} style={stylePetitBouton(!p.panne, '#16a34a')}>Aucun défaut</button>
          {Object.entries(PANNES).map(([k, q]) => <button key={k} onClick={() => { maj('panne', k); injecter(); }} style={stylePetitBouton(p.panne === k, '#c2410c')}>{q.nom}</button>)}</div>
        {p.panne && <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}><strong>Symptômes :</strong> {PANNES[p.panne].symptome}.<br/><strong>Geste :</strong> {PANNES[p.panne].geste}</div>}
      </Section>
    </div>);

  const visuel = (
    <div style={{ ...styleBoite, background: 'white', ...cadre('viz') }}>
      {a.nonElues.length > 0 && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>
        ⚠ {a.nonElues.map(m => m.nom).join(', ')} : ne sort pas de la colonne en moins de 200 min. Chauffez le four ou programmez une montée en température.</div>}
      {surcharge && !masque && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>
        ⚠ Colonne saturée : trop de matière est entrée dans la colonne (environ {v(Math.max(...a.pics.map(m => m.masse)), 1)} µg par composé, pour une capacité de l’ordre de {v(a.cap, 1)} µg). Les pics se déforment (front avant étalé). Augmentez le rapport de division ou diminuez le volume injecté.</div>}
      {nbPics === 0 ? <div style={{ padding: '2rem', textAlign: 'center', fontSize: 14, color: KIT.txt2 }}>{a.nonElues.length ? 'Aucun composé ne sort de la colonne.' : 'Choisissez au moins un composé pour l’échantillon.'}</div>
        : masque ? <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: 14, color: KIT.txt2, lineHeight: 1.6 }}>🔒 Le chromatogramme sera affiché après votre vérification : prédisez d’abord l’ordre de sortie.</div>
        : <Visu a={a} p={pEff} couleurs={couleurs} hover={hover} setHover={setHover} lancement={lancement} onLancer={injecter} anonyme={anonyme}/>}
    </div>);

  const hypotheses = (
    <div style={styleBoite}>
      <Section titre="Hypothèses et limites du modèle" ouvert={ouv.hypo || enDefi} onBascule={() => bascule('hypo')}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
          <li><strong>Rétention</strong> : chaque composé est repéré par son <strong>indice de Kováts</strong> I, mesuré sur deux colonnes réelles (GL Sciences : InertCap 5, 5 % phényl, et InertCap WAX, PEG ; 60 m × 0,25 mm × 0,25 µm) à 40, 80, 120 et 160 °C ; on interpole I(T) par une droite. Pour cinq composés sur la colonne polaire (butan-1-ol, éthylbenzène, xylènes, DMF, cyclohexanone), seul l’indice en programmation est publié : on le suppose constant.</li>
          <li><strong>Échelle des alcanes</strong> : sur ces mêmes chromatogrammes, ln k a été ajusté sous la forme ln k = a₀ + a₁/T + (b₀ + b₁/T)·I/100 (relation de van ’t Hoff, écart-type 0,5 % sur les temps de rétention). Contrôle indépendant : la programmation publiée (40 → 220 °C à 5 °C/min) est retrouvée à 3 à 5 % près. D’autres colonnes de même type (HP-5, DB-WAX…) donnent des indices voisins mais pas identiques.</li>
          <li><strong>Film et diamètre</strong> : k est inversement proportionnel au rapport de phase β = d<Ind>c</Ind> / (4 d<Ind>f</Ind>). Les données valent pour β = 250.</li>
          <li><strong>Gaz vecteur</strong> : débit constant (mesuré à 25 °C), écoulement laminaire d’un gaz compressible ; la pression d’entrée est calculée, la sortie est à la pression atmosphérique.</li>
          <li><strong>Largeur des pics</strong> : efficacité théorique d’une colonne capillaire (équation de Golay) avec un coefficient de diffusion moyen pour tous les composés ; une colonne réelle fait un peu moins bien. En programmation, la largeur est évaluée à la température de sortie du pic. Volumes morts négligés.</li>
          <li><strong>Injecteur</strong> : en split, une fraction 1/(1 + rapport) entre dans la colonne ; en splitless, 90 % en 0,75 min, reconcentrés en tête de colonne si le four est froid. Discrimination selon la volatilité et effet de solvant non modélisés. Au-delà d’environ {v(a.cap, 1)} µg par composé (ordre de grandeur), le pic se déforme.</li>
          <li><strong>FID</strong> : aire ∝ masse × nombre de carbones effectif / masse molaire (contributions de groupes de Sternberg ; ester et DMF estimés). Ces coefficients sont des ordres de grandeur : en quantitatif, on étalonne toujours.</li>
          <li><strong>Pannes</strong> : effets simples, pour montrer le sens des écarts et non les valeurs d’un appareil réel.</li>
          <li><strong>Vue colonne</strong> : schématique ; position et élargissement des bandes viennent du modèle, l’agitation des molécules est tirée au hasard.</li>
        </ul>
      </Section>
    </div>);
  const aEssayer = (
    <div style={{ ...styleBoite, background: '#f0fdfa' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Injectez les n-alcanes de C5 à C12 : sur les deux colonnes, ils sortent dans le même ordre ; c’est leur échelle qui définit l’indice de Kováts.</li>
        <li>Mettez méthanol, éthanol, acétone et hexane : comparez l’ordre sur colonne apolaire et sur colonne polaire.</li>
        <li>Passez en isotherme et cherchez la température qui sépare le mieux un mélange d’alcools et d’aromatiques.</li>
        <li>Doublez la vitesse de chauffe : que gagne-t-on en temps, que perd-on en séparation ?</li>
        <li>Remplacez l’hélium par le dihydrogène, puis par le diazote, au même débit : regardez la pression et la largeur des pics.</li>
        <li>Passez en splitless avec 1 µL : que deviennent les pics ? Pourquoi ce mode est-il réservé aux traces ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Apolaire : ordre ≈ températures d’ébullition ; polaire : les composés polaires sont retardés.</li>
        <li>Four : il règle la rétention ; la programmation fait sortir les lourds plus tôt et en pics fins.</li>
        <li>Débit ↑ : analyse plus courte, pression plus élevée. Split ↑ : moins de matière dans la colonne.</li>
      </ul>
    </ARetenir>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button></span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cg-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cg-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cg-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .cg-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .cg-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chromatographie en phase gazeuse (CPG)</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Colonne capillaire, injecteur split / splitless, détecteur FID. Rétention calculée à partir d’indices de Kováts publiés pour des solvants courants, sur colonne apolaire et polaire.</div>
      <div className={`cg-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div className="cg-col">
          {voletDefi}
          {appareil}
          {reglages}
          {visuel}
          {controle}
          {defauts}
          {melange}
          {resultats}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? hypotheses : null}
      </div>
      {!enDefi && <div style={{ marginBottom: 12 }}>{hypotheses}</div>}
      {mode === 'explore' && <div className="cg-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
