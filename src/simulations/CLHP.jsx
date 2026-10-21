import { useState, useEffect, useRef, useMemo } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { Field, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, ExempleResolu, Frac, Curseur, lireProgression } from "../commun";
import { MOLECULES_CLHP, PARAMS_DEFAUT, SEUIL_RS, P_MAX, PANNES, analyse, colonne, signal, bruitLigne, positionBande, phiEntree } from "./clhpModele";

export { MOLECULES_CLHP };

// ====================================================
//  SIM 12 — SIMULATION CLHP (BTS) : chromatographie en phase inverse C18, éluant acétonitrile / eau
//  Modèle de X. Bataille (ENCPB / RNChimie, 2008) — voir clhpModele.js.
//  Interface : schéma de l'appareil (pompe, manomètre, injecteur, colonne, détecteur), vue colonne animée,
//  chromatogramme enregistré en direct, diagnostic de pannes (contrôle de routine) et défis de pratique.
// ====================================================

const SIM = 12;
declarerDefis(SIM, [
  ['ordre', 'Prédire l’ordre d’élution'],
  ['identifier', 'Identifier des pics par leur temps de rétention'],
  ['separer', 'Séparer deux composés'],
  ['panne', 'Diagnostiquer une panne'],
]);

const PALETTE = ['#e63946', '#2a9d8f', '#6a4c93', '#d98e04', '#457b9d', '#2d6a4f', '#c2410c', '#9333ea', '#0891b2', '#be185d', '#65a30d', '#475569'];
const COUL_RS = { ok: '#16a34a', lim: '#d97706', non: '#dc2626' };
const classeRs = R => R >= SEUIL_RS[1] ? 'ok' : R >= SEUIL_RS[0] ? 'lim' : 'non';
const v = (x, d = 2) => (isFinite(x) ? x.toFixed(d) : '—').replace('.', ',');
const TEMPS_MAX_DEFI = 8;                       // min : durée maximale d’analyse du défi « séparer »
const nomsCourts = (m) => m.court || m.nom;
const LETTRES = 'ABCDEFGHIJKL';
const trSeul = (i, pct = 50) => analyse({ ...PARAMS_DEFAUT, pct }, [{ ...MOLECULES_CLHP[i], conc: 1, epsilon: 10 }]).pics[0].tr;
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
function dessinerColonne(ctx, dpr, W, { a, p, frac, hover, couleurs, nonRetenu }, now) {
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
  ctx.fillText(p.grad ? (W < 560 ? `t = ${v(t)} min · ${Math.round(phiEntree(p, t) * 100)} % ACN` : `t = ${v(t)} min · éluant entrant : ${Math.round(phiEntree(p, t) * 100)} % d’acétonitrile`) : `t = ${v(t)} min`, W < 560 ? 8 : xL, 16);
  ctx.textAlign = 'right'; ctx.fillStyle = '#64748b';
  if (!(p.grad && W < 760)) ctx.fillText(W < 560 ? 'éluant · grains C18' : 'éluant (phase mobile) · grains greffés C18 (phase stationnaire)', xR, 16);
  ctx.textAlign = 'left';
  // bandes
  const N = a.col.N, groupes = [];
  const u = p.longueur / a.col.tm;
  if (nonRetenu) groupes.push({ id: 'tm', slot: 11, pos: () => ({ x: u * t, k: 0 }), coul: '#64748b' });
  a.pics.forEach((m, i) => groupes.push({ id: m.id, slot: i % 11, pos: () => positionBande(p, m, t, a.col), coul: couleurs[m.id] }));
  const bucket = Math.floor(now / 160);
  groupes.forEach((g, gi) => {
    const dim = hover != null && hover !== g.id;
    const pb = g.pos();
    const xb = pb.x / p.longueur * L, sx = Math.max(1.8, Math.sqrt(Math.max(xb, 0) * L / N));   // variance ∝ distance parcourue : σx² = H·x
    const ps = PARTICULES[g.slot];
    const pStat = pb.k / (1 + pb.k);
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

function ColonneAnim({ a, p, frac, couleurs, hover, w, nonRetenu }) {
  const ref = useRef(null);
  const etat = useRef({ a, p, frac, hover, couleurs, nonRetenu });
  useEffect(() => { etat.current = { a, p, frac, hover, couleurs, nonRetenu }; });
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
function Chromato({ a, p, frac, w, couleurs, hover, setHover, total, indiv, nonRetenu, anonyme }) {
  const [lect, setLect] = useState(null);                    // { x, t, id } : lecture sous le pointeur
  const h = w < 480 ? 230 : 270, mL = 34, mR = p.grad ? 40 : 12, mT = 14, mB = 34;
  const iw = w - mL - mR, ih = h - mT - mB;
  const { tMax, pics, col } = a;
  const N = 360;
  const geo = useMemo(() => {
    const ts = Array.from({ length: N + 1 }, (_, i) => i * tMax / N);
    const sig = pics.map(m => ts.map(t => signal(m, t)));
    const tot = ts.map((_, i) => sig.reduce((s, c) => s + c[i], 0));
    const totB = tot.map((s, i) => s + bruitLigne(a.ligneBase, ts[i]));          // signal enregistré : bruit et ondulation éventuels
    const ymax = Math.max(...tot, a.hRef, 1e-9) * 1.22;                          // échelle de la colonne en bon état : une perte de signal se voit
    return { ts, sig, tot, totB, ymax };
  }, [a, tMax, pics]);
  const X = t => mL + t / tMax * iw, Y = s => mT + ih - s / geo.ymax * ih;
  const chemin = (ys, n = ys.length) => ys.slice(0, n).map((s, i) => `${i ? 'L' : 'M'}${X(geo.ts[i]).toFixed(1)},${Y(s).toFixed(1)}`).join('');
  const tCur = frac * tMax, nCur = Math.min(N, Math.floor(frac * N)) + 1;
  const pas = pasTemps(tMax), graduations = [];
  for (let t = 0; t <= tMax + 1e-9; t += pas) graduations.push(Math.round(t * 1000) / 1000);
  // étiquettes des pics, décalées si elles se chevauchent
  const etiq = pics.map((m, i) => ({ m, i, lib: anonyme ? LETTRES[i] : nomsCourts(m), x: X(m.tr), y: Y(Math.max(geo.tot[Math.round(m.tr / tMax * N)] || 0, signal(m, m.tr))) - 7 }));
  // placement sans chevauchement : les pics les plus hauts d'abord ; une étiquette qui ne trouve pas de place est omise (le survol la donne)
  const places = [];
  [...etiq].sort((p, q) => q.m.hauteur - p.m.hauteur).forEach(e => {
    const lg = e.lib.length * 6.6 + 6;
    e.x = Math.min(Math.max(e.x, mL + lg / 2), w - mR - lg / 2);
    for (let essai = 0; essai < 5; essai++) {
      const y = Math.max(e.y - essai * 14, mT + 12);
      const boite = { x1: e.x - lg / 2, x2: e.x + lg / 2, y1: y - 11, y2: y + 2 };
      if (!places.some(q => boite.x1 < q.x2 && q.x1 < boite.x2 && boite.y1 < q.y2 && q.y1 < boite.y2)) { e.y = y; places.push(boite); e.ok = true; return; }
      if (y === mT + 12) break;
    }
  });

  function pointe(ev) {
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ev.clientX - r.left, t = (px - mL) / iw * tMax;
    if (t < 0 || t > tMax || t > tCur) { setLect(null); setHover(null); return; }
    if (Math.abs(px - X(col.tm)) < 7 && col.tm <= tCur) { setLect({ x: X(col.tm), t: col.tm, id: 'tm' }); setHover(null); return; }
    let best = null, bd = 1e9;
    pics.forEach(m => { const d = Math.abs(t - m.tr) / m.sigma; if (d < bd && signal(m, t) > 0.04 * geo.ymax) { bd = d; best = m; } });
    if (best && bd < 5) { setLect({ x: X(best.tr), t: best.tr, id: best.id }); setHover(best.id); } else { setLect(null); setHover(null); }
  }
  const mol = lect && lect.id !== 'tm' ? pics.find(m => m.id === lect.id) : null;
  const info = lect && (lect.id === 'tm'
    ? <><strong>{T0} = {v(col.tm)} min</strong><br/>temps mort : un composé non retenu sort à cet instant</>
    : mol && (anonyme ? <><strong>Pic {LETTRES[pics.indexOf(mol)]}</strong><br/>{TR} = {v(mol.tr)} min</>
      : <><strong style={{ color: couleurs[mol.id] }}>{mol.nom}</strong><br/>{TR} = {v(mol.tr)} min · k’ = {v(mol.k)}<br/>W<Ind>½</Ind> = {v(mol.W, 3)} min</>));
  const posInfo = lect ? Math.min(Math.max(lect.x + 12, 4), w - 190) : 0;
  return (
    <div style={{ position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block', touchAction: 'pan-y' }} role="img" aria-label="Chromatogramme : réponse du détecteur en fonction du temps"
        onPointerMove={pointe} onPointerDown={pointe} onPointerLeave={ev => { if (ev.pointerType === 'mouse') { setLect(null); setHover(null); } }}>
        <defs><clipPath id="cl-clip"><rect x={mL} y={mT} width={iw} height={ih}/></clipPath></defs>
        <rect x={mL} y={mT} width={iw} height={ih} fill="white" stroke="#cbd5e1"/>
        {graduations.map(t => <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={mT} y2={mT + ih} stroke="#e2e8f0"/>
          <line x1={X(t)} x2={X(t)} y1={mT + ih} y2={mT + ih + 5} stroke="#475569"/>
          <text x={X(t)} y={mT + ih + 18} textAnchor="middle" fontSize="11" fill="#334155">{String(t).replace('.', ',')}</text></g>)}
        <text x={mL + iw / 2} y={h - 4} textAnchor="middle" fontSize="12" fill="#334155" fontWeight="600">temps t (min)</text>
        <text transform={`translate(11 ${mT + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="#334155">réponse du détecteur (u.a.)</text>
        {p.grad && <g>
          <path d={geo.ts.map((t, i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)},${(mT + ih - phiEntree(p, t) * ih).toFixed(1)}`).join('')} fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeDasharray="6 3"/>
          {[0, 50, 100].map(q => <g key={q}><line x1={mL + iw} x2={mL + iw + 4} y1={mT + ih - q / 100 * ih} y2={mT + ih - q / 100 * ih} stroke="#7c3aed"/>
            <text x={mL + iw + 6} y={mT + ih - q / 100 * ih + 4} fontSize="10.5" fill="#7c3aed">{q}</text></g>)}
          <text transform={`translate(${w - 6} ${mT + ih / 2}) rotate(90)`} textAnchor="middle" fontSize="11" fill="#7c3aed">% acétonitrile (pompe)</text></g>}
        {nonRetenu && <>
          <line x1={X(col.tm)} x2={X(col.tm)} y1={mT} y2={mT + ih} stroke="#64748b" strokeDasharray="4 3"/>
          <text x={X(col.tm) + 4} y={mT + 11} fontSize="11" fill="#475569">t₀ (composé non retenu)</text></>}
        {indiv && pics.map((m, i) => {
          const dim = hover != null && hover !== m.id;
          return <g key={m.id} opacity={dim ? 0.25 : 1}>
            <path d={`${chemin(geo.sig[i], nCur)}L${X(geo.ts[nCur - 1])},${Y(0)}L${X(0)},${Y(0)}Z`} fill={couleurs[m.id]} opacity="0.16"/>
            <path d={chemin(geo.sig[i], nCur)} fill="none" stroke={couleurs[m.id]} strokeWidth={hover === m.id ? 3 : 1.8}/></g>;
        })}
        {total && <path d={chemin(geo.totB, nCur)} clipPath="url(#cl-clip)" fill="none" stroke="#0f172a" strokeWidth={a.ligneBase.bruit > 0 ? 1.1 : 1.8} strokeDasharray={indiv && !a.ligneBase.bruit ? '5 3' : undefined}/>}
        {(indiv || anonyme) && etiq.filter(e => e.ok && tCur >= e.m.tr).map(e => <text key={e.m.id} x={e.x} y={e.y} textAnchor="middle" fontSize="11.5" fontWeight="700"
          fill={anonyme ? '#0f172a' : couleurs[e.m.id]} stroke="white" strokeWidth="3" paintOrder="stroke">{e.lib}</text>)}
        <line x1={X(tCur)} x2={X(tCur)} y1={mT} y2={mT + ih} stroke={ORANGE_GUIDE} strokeWidth="1.6" opacity={frac > 0 && frac < 1 ? 1 : 0}/>
        {lect && <line x1={lect.x} x2={lect.x} y1={mT} y2={mT + ih} stroke="#0f172a" strokeWidth="1" strokeDasharray="2 3"/>}
        {mol && <circle cx={X(mol.tr)} cy={Y(signal(mol, mol.tr))} r="4.5" fill="white" stroke={couleurs[mol.id]} strokeWidth="2"/>}
      </svg>
      {lect && info && <div style={{ position: 'absolute', left: posInfo, top: 18, background: 'white', border: '1px solid #94a3b8', borderRadius: 6, padding: '4px 8px',
        fontSize: 12.5, color: KIT.txt, pointerEvents: 'none', boxShadow: '0 2px 6px rgba(0,0,0,.15)', maxWidth: 220, lineHeight: 1.45 }}>{info}</div>}
    </div>);
}

// ---------- bloc visuel : colonne + chromatogramme + commandes de lecture ----------
function Visu({ a, p, couleurs, hover, setHover, lancement, onLancer, nonRetenu, setNonRetenu, total, setTotal, anonyme }) {
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
      <ColonneAnim a={a} p={p} frac={frac} couleurs={couleurs} hover={hover} w={w} nonRetenu={nonRetenu}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 8px', lineHeight: 1.5 }}>
        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#475569', marginRight: 4 }}/>libre dans l’éluant · {' '}
        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#475569', border: '1.5px solid #0f172a', marginRight: 4 }}/>adsorbé sur un grain.
        La part du temps passée adsorbé est k’/(1 + k’) = 1 − {T0}/{TR}.
      </div>
      <Chromato a={a} p={p} frac={frac} w={w} couleurs={couleurs} hover={hover} setHover={setHover} total={total || anonyme || a.ligneBase.bruit > 0} indiv={!anonyme} anonyme={anonyme} nonRetenu={nonRetenu}/>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: KIT.txt2, marginTop: 6 }}>
        {!anonyme && <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={total} onChange={e => setTotal(e.target.checked)}/> signal total enregistré (ce que voit le détecteur)</label>}
        <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={nonRetenu} onChange={e => setNonRetenu(e.target.checked)}/> composé non retenu (repère {T0})</label>
      </div>
    </div>);
}

let CACHE = { cle: null, val: null };
function analyseMemo(p, mols) {
  const cle = JSON.stringify([p, mols]);
  if (CACHE.cle !== cle) CACHE = { cle, val: analyse(p, mols) };
  return CACHE.val;
}

// ---------- schéma de l'appareil : pompe, manomètre, injecteur, colonne, détecteur ----------
const PIECES = {
  eluant: { nom: 'Réservoirs d’éluant',
    role: 'Eau et acétonitrile de qualité CLHP, dans des flacons distincts : la pompe les mélange (gradient) ou on prépare l’éluant à l’avance (isocratique).',
    ctrl: 'Niveau suffisant, crépines propres. Éluant filtré (0,45 µm) et dégazé. Mesurer chaque volume séparément : 500 mL d’eau + 500 mL d’acétonitrile ne font pas exactement 1 L.' },
  pompe: { nom: 'Pompe',
    role: 'Impose un débit constant d’éluant dans le circuit, même quand la pression change.',
    ctrl: 'Pression stable (une pression qui oscille trahit une bulle d’air). Purger avant utilisation. Joints de piston et clapets : usure à surveiller.' },
  manometre: { nom: 'Manomètre (pression en sortie de pompe)',
    role: 'Mesure la pression nécessaire pour faire passer l’éluant à travers la colonne. Elle dépend du débit, de la longueur de la colonne, de la taille des grains et de la viscosité de l’éluant.',
    ctrl: 'Noter la pression habituelle de la méthode : c’est la référence. Trop haute : filtre ou colonne encrassé(e). Trop basse : fuite. Qui oscille : bulle d’air. Au-delà de la limite, la pompe s’arrête.' },
  injecteur: { nom: 'Injecteur (vanne à boucle)',
    role: 'Introduit un volume précis d’échantillon, en un temps très court, dans le flux d’éluant juste avant la colonne.',
    ctrl: 'Échantillon filtré (0,45 µm) et sans bulle. Seringue à pointe plate. Rincer la boucle entre deux échantillons.' },
  colonne: { nom: 'Colonne (dans le four)',
    role: 'Tube en acier rempli de silice greffée C18 : c’est là que les composés se séparent. Le four thermostate la colonne (température constante, temps de rétention reproductibles).',
    ctrl: 'Sens d’écoulement respecté. Précolonne pour la protéger. Ne jamais dépasser la pression maximale. Après usage, rincer les sels avec de l’eau puis conserver dans un mélange eau / acétonitrile.' },
  detecteur: { nom: 'Détecteur UV',
    role: 'Mesure l’absorbance de l’éluant à la sortie de la colonne : le signal augmente quand un composé passe dans la cellule. La hauteur du pic dépend de la quantité injectée et de l’absorbance du composé.',
    ctrl: 'Longueur d’onde adaptée aux composés. Lampe (deutérium) : noter ses heures de fonctionnement, elle perd de l’intensité avec l’âge. Cellule propre, sans bulle.' },
};

function Appareil({ a, p, actif, setActif }) {
  const [ph, setPh] = useState(0);
  const oscille = a.col.dPmax - a.col.dPmin > 1;
  useEffect(() => {
    if (!oscille) return undefined;
    const id = setInterval(() => setPh(x => x + 0.9), 90);
    return () => clearInterval(id);
  }, [oscille]);
  const pr = oscille ? (a.col.dPmin + a.col.dPmax) / 2 + (a.col.dPmax - a.col.dPmin) / 2 * Math.sin(ph) : a.col.dP;
  const frac = Math.min(pr / (P_MAX * 1.25), 1), ang = (-120 + 240 * frac) * Math.PI / 180;
  const nx = 285 + 22 * Math.sin(ang), ny = 82 - 22 * Math.cos(ang);
  const trop = a.col.dP > P_MAX;
  const piece = (id, enfants) => (
    <g role="button" tabIndex={0} aria-label={PIECES[id].nom} aria-pressed={actif === id} style={{ cursor: 'pointer', outline: 'none' }}
      onClick={() => setActif(actif === id ? null : id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActif(actif === id ? null : id); } }}>
      {enfants}
      {actif === id && <rect x={PIECE_BOITE[id][0]} y={PIECE_BOITE[id][1]} width={PIECE_BOITE[id][2]} height={PIECE_BOITE[id][3]} rx="8" fill="none" stroke={ORANGE_GUIDE} strokeWidth="2.5" strokeDasharray="5 3"/>}
    </g>);
  const txt = { fontSize: 11.5, fill: '#334155', textAnchor: 'middle', fontWeight: 600 };
  const tube = { stroke: '#64748b', strokeWidth: 2.4, fill: 'none' };
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 780 170" style={{ width: '100%', minWidth: 600, display: 'block' }} role="group" aria-label="Schéma de l’appareil de CLHP">
          <path d="M770 84 L776 90 L770 96" {...tube} strokeWidth="2"/>
          {piece('eluant', <g>
            <rect x="12" y="52" width="36" height="66" rx="6" fill="#dbeafe" stroke="#475569" strokeWidth="1.5"/>
            <rect x="54" y="52" width="36" height="66" rx="6" fill="#ede9fe" stroke="#475569" strokeWidth="1.5"/>
            <rect x="10" y="48" width="40" height="5" rx="2" fill="#475569"/><rect x="52" y="48" width="40" height="5" rx="2" fill="#475569"/>
            <text x="30" y="110" style={txt}>Eau</text><text x="72" y="110" style={txt}>ACN</text>
            <text x="51" y="140" style={txt}>Éluant</text></g>)}
          {piece('pompe', <g>
            <rect x="150" y="50" width="80" height="80" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5"/>
            <text x="190" y="72" style={txt}>Pompe</text>
            <text x="190" y="92" style={{ ...txt, fontWeight: 400 }}>{v(p.debit, 1)} mL/min</text>
            <text x="190" y="110" style={{ ...txt, fontWeight: 400 }}>{p.grad ? 'gradient' : `${p.pct} % ACN`}</text></g>)}
          {piece('manometre', <g>
            <circle cx="285" cy="82" r="30" fill="white" stroke="#475569" strokeWidth="2"/>
            <path d={`M${285 + 24 * Math.sin(((-120 + 240 * (P_MAX / (P_MAX * 1.25))) * Math.PI) / 180)} ${82 - 24 * Math.cos(((-120 + 240 * (P_MAX / (P_MAX * 1.25))) * Math.PI) / 180)} A24 24 0 0 1 ${285 + 24 * Math.sin((120 * Math.PI) / 180)} ${82 - 24 * Math.cos((120 * Math.PI) / 180)}`} stroke="#dc2626" strokeWidth="4" fill="none"/>
            <line x1="285" y1="82" x2={nx} y2={ny} stroke={trop ? '#dc2626' : '#0f172a'} strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="285" cy="82" r="3" fill="#0f172a"/>
            <text x="285" y="128" style={{ ...txt, fill: trop ? '#b91c1c' : '#334155' }}>{Math.round(pr)} bar</text>
            <text x="285" y="143" style={{ ...txt, fontWeight: 400 }}>manomètre</text></g>)}
          {piece('injecteur', <g>
            <rect x="345" y="62" width="60" height="56" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5"/>
            <circle cx="375" cy="90" r="14" fill="white" stroke="#475569"/>
            <path d="M375 90 L386 82 M375 90 L386 98 M375 90 L364 90" stroke="#475569" strokeWidth="1.6"/>
            <path d="M375 30 V58 M371 58 L375 64 L379 58" stroke="#475569" strokeWidth="1.8" fill="none"/>
            <rect x="371" y="20" width="8" height="14" fill="#94a3b8"/>
            <text x="375" y="138" style={txt}>Injecteur</text></g>)}
          {piece('colonne', <g>
            <rect x="436" y="40" width="198" height="100" rx="10" fill="#fff7ed" stroke="#c2410c" strokeWidth="1.3" strokeDasharray="5 3"/>
            <rect x="452" y="72" width="166" height="36" rx="5" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5"/>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(i => <circle key={i} cx={462 + i * 11.5} cy={i % 2 ? 84 : 96} r="4.4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8"/>)}
            <text x="535" y="58" style={txt}>Four · {p.temperature} °C</text>
            <text x="535" y="128" style={txt}>Colonne C{p.nC} · {p.longueur} cm</text></g>)}
          <g fill="none" stroke="#64748b" strokeWidth="2.4" strokeLinejoin="round" pointerEvents="none">
            <path d="M150 96 H126 V30 H30 V92"/><path d="M150 108 H114 V38 H72 V92"/>
            <path d="M230 82 H255 M315 82 H345 M405 90 H452 M618 90 H664 M730 90 H775"/></g>
          {piece('detecteur', <g>
            <rect x="664" y="56" width="66" height="68" rx="8" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5"/>
            <circle cx="697" cy="82" r="9" fill="#fde047" stroke="#a16207"/>
            <text x="697" y="108" style={txt}>UV</text>
            <text x="697" y="142" style={txt}>Détecteur</text></g>)}
        </svg>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55, marginTop: 4, minHeight: 20 }}>
        {actif ? <><strong>{PIECES[actif].nom}</strong> — {PIECES[actif].role}<div style={{ marginTop: 3, color: KIT.txt2 }}><strong>À contrôler :</strong> {PIECES[actif].ctrl}</div></>
          : <span style={{ color: KIT.txt2 }}>Cliquez sur un élément de l’appareil pour voir son rôle et ce que l’on contrôle en routine. L’éluant circule de gauche à droite ; l’échantillon est injecté juste avant la colonne.</span>}
      </div>
    </div>);
}
const PIECE_BOITE = { eluant: [6, 44, 90, 112], pompe: [144, 44, 92, 92], manometre: [248, 44, 74, 106], injecteur: [339, 14, 72, 134], colonne: [430, 34, 210, 112], detecteur: [658, 50, 78, 98] };

// ---------- contrôle de routine : valeurs de référence (installation conforme) et valeurs actuelles ----------
function Controle({ a }) {
  const r = a.ref;
  const dernier = x => x.pics[x.pics.length - 1];
  const rsMin = x => x.res.length ? Math.min(...x.res.map(q => q.R)) : null;
  const lignes = r ? [
    ['Pression en tête de colonne', `${Math.round(r.col.dP)} bar`, `${Math.round(a.col.dP)} bar${a.col.dPmax - a.col.dPmin > 1 ? ' (oscille)' : ''}`, a.col.dP / r.col.dP],
    [<>Temps mort {T0}</>, `${v(r.col.tm)} min`, `${v(a.col.tm)} min`, a.col.tm / r.col.tm],
    [<>{TR} du dernier pic</>, `${v(dernier(r).tr)} min`, `${v(dernier(a).tr)} min`, dernier(a).tr / dernier(r).tr],
    [<>Largeur W<Ind>½</Ind> du dernier pic</>, `${v(dernier(r).W, 3)} min`, `${v(dernier(a).W, 3)} min`, dernier(a).W / dernier(r).W],
    ...(rsMin(r) != null ? [[<>R<Ind>s</Ind> minimal</>, v(rsMin(r)), v(rsMin(a)), rsMin(a) / rsMin(r)]] : []),
    ['Hauteur du plus grand pic', 'référence', `${Math.round(100 * Math.max(...a.pics.map(m => m.hauteur)) / Math.max(...r.pics.map(m => m.hauteur)))} %`,
      Math.max(...a.pics.map(m => m.hauteur)) / Math.max(...r.pics.map(m => m.hauteur))],
    ['Ligne de base', 'plate', a.ligneBase.ondulation > 0 ? 'ondule' : a.ligneBase.bruit > 0 ? 'bruitée' : 'plate', a.ligneBase.ondulation > 0 || a.ligneBase.bruit > 0 ? 0 : 1],
  ] : [];
  return (
    <div>
      {!r ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Aucun écart : l’installation est conforme à la référence.</div> : <>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>On compare les valeurs du jour à celles de la méthode validée (colonne et installation en bon état). Un écart de plus de 10 % est à expliquer.</div>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
          <thead><tr style={{ background: '#eef2f6' }}>{['Grandeur', 'Référence', 'Aujourd’hui', ''].map((h, i) => <th key={i} style={{ padding: '4px 8px', textAlign: 'left', fontSize: 12.5, borderBottom: '1px solid #cbd5e1' }}>{h}</th>)}</tr></thead>
          <tbody>{lignes.map(([nom, ref, act, rap], i) => {
            const ecart = Math.abs(rap - 1) > 0.1;
            return <tr key={i} style={{ background: ecart ? '#fff7ed' : 'transparent' }}>
              <td style={{ padding: '3px 8px' }}>{nom}</td><td style={{ padding: '3px 8px', color: KIT.txt2 }}>{ref}</td>
              <td style={{ padding: '3px 8px', fontWeight: ecart ? 700 : 400, color: ecart ? '#b45309' : KIT.txt }}>{act}</td>
              <td style={{ padding: '3px 8px', color: '#b45309', fontWeight: 700 }}>{ecart ? (rap > 1 ? '↑' : '↓') : ''}</td></tr>;
          })}</tbody></table></div></>}
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
const MELANGES_PANNE = [[1, 2, 7], [1, 13, 7], [0, 2, 12]];   // mélanges bien séparés quand l’installation est en bon état
function nouveauDefi(type) {
  if (type === 'ordre') {
    let mols; do { mols = [...MOLECULES_CLHP.keys()].sort(() => Math.random() - 0.5).slice(0, 4); const l = mols.map(i => MOLECULES_CLHP[i].logP).sort((x, y) => x - y); if (l.every((x, k) => !k || x - l[k - 1] >= 0.25)) break; } while (true); // eslint-disable-line no-constant-condition
    return { type, mols, pct: tire([35, 45, 55, 65]), reps: { ordre: [] }, verifie: false };
  }
  if (type === 'identifier') {
    const pct = 40;
    for (let essai = 0; essai < 600; essai++) {
      const ids = [...MOLECULES_CLHP.keys()].sort(() => Math.random() - 0.5).slice(0, 4);
      const r = analyse({ ...PARAMS_DEFAUT, pct }, ids.map(i => ({ ...MOLECULES_CLHP[i], conc: 1, epsilon: 10 })));
      if (r.pics.length === 4 && r.res.every(x => x.R >= 1.3) && r.pics[3].tr <= 10 && r.pics.every((m, k) => !k || m.tr / r.pics[k - 1].tr >= 1.12)) {
        const retire = tire(ids);
        return { type, pct, mols: ids.filter(i => i !== retire), etalons: ids, reps: {}, verifie: false };
      }
    }
    return { type, pct, mols: [1, 2, 7], etalons: [1, 2, 7, 11], reps: {}, verifie: false };
  }
  if (type === 'panne') {
    return { type, pct: 50, mols: tire(MELANGES_PANNE), panne: tire(Object.keys(PANNES)), reps: {}, verifie: false };
  }
  if (!PAIRES) PAIRES = pairesFaisables();
  return { type, mols: tire(PAIRES), pct: 50, reps: {}, verifie: false };
}
const TITRES = { ordre: 'Ordre d’élution', identifier: 'Identifier des pics', separer: 'Séparer deux composés', panne: 'Diagnostiquer une panne' };

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationCLHP() {
  const [mode, setMode] = useState(() => modeOuverture('clhp-guide-v3'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('clhp-guide-v3', { etape: 0, reps: {}, verifs: {}, reussies: {} });
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
  const [ouv, setOuv] = useState({ melange: false, eluant: true, tableau: true, hypo: false, plus: false, avance: false, pannes: false });
  const [piece, setPiece] = useState(null);
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
  const fige = enDefi && ['ordre', 'identifier', 'panne'].includes(defi.type);     // conditions imposées par l’énoncé
  const pEff = !fige ? p : defi.type === 'panne' ? { ...PARAMS_DEFAUT, pct: defi.pct, panne: defi.panne } : { ...p, pct: defi.pct };
  const a = analyseMemo(pEff, allMols);
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
  const situation = (ids, panne) => { setSelected(ids); setCustomMols([]); setP({ ...PARAMS_DEFAUT, panne }); setLancement(n => n + 1); };
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#0d6e6e'), margin: '6px 0' }}>{label}</button>;
  const CAFEINE = 1, PARACETAMOL = 0, PHENOL = 2, PHENACETINE = 3, AMINO = 5, BZP = 7, TPC = 11, DPA = 12, LIDO = 9;   // indices dans MOLECULES_CLHP
  const duo = (ids, pct = 50, panne = null) => analyse({ ...PARAMS_DEFAUT, pct, panne }, ids.map(k => ({ ...MOLECULES_CLHP[k], conc: 1, epsilon: 10 })));
  const r3 = x => Math.round(x * 1000) / 1000;
  // exemple résolu « résolution » : caféine / paracétamol à 50 % ; exercice : lidocaïne / 1,3-diphénylacétone
  const [exA, exB] = duo([CAFEINE, PARACETAMOL]).pics;
  const rsExemple = 1.18 * (r3(exB.tr) - r3(exA.tr)) / (r3(exA.W) + r3(exB.W));
  const [moA, moB] = duo([LIDO, DPA]).pics;
  const rsExercice = 1.18 * (r3(moB.tr) - r3(moA.tr)) / (r3(moA.W) + r3(moB.W));
  const essaisPct = [50, 40, 35, 30].map(pc => ({ pc, r: duo([CAFEINE, PARACETAMOL], pc) }));
  const pEluant = duo([CAFEINE, PHENOL, BZP], 50, 'eluant').pics, pRef = duo([CAFEINE, PHENOL, BZP]).pics;
  const cBulle = colonne({ ...PARAMS_DEFAUT, panne: 'bulle' }), cEluant = colonne({ ...PARAMS_DEFAUT, panne: 'eluant' });
  const th = { padding: '3px 8px', borderBottom: '1px solid #cbd5e1', textAlign: 'left', fontSize: 13 }, td = { padding: '3px 8px', fontSize: 13.5 };
  const TROIS = [CAFEINE, PHENOL, BZP], QUATRE = [CAFEINE, PARACETAMOL, BZP, TPC];
  const ref0 = colonne({ ...PARAMS_DEFAUT }).dP;
  const ETAPES = [
    { id: 'appareil', titre: 'Le chemin de l’échantillon', focus: ['appareil'],
      texte: <>Un chromatographe liquide est une chaîne d’éléments traversés par l’éluant. La <strong>pompe</strong> impose le débit ; le <strong>manomètre</strong> indique la pression ; l’<strong>injecteur</strong> introduit l’échantillon dans le flux ; dans la <strong>colonne</strong> (thermostatée dans un four) les composés se séparent ; le <strong>détecteur UV</strong> les repère à la sortie. Cliquez sur chaque élément du schéma pour lire son rôle et ce qu’on y contrôle.</>,
      tache: { type: 'qcm', q: 'Dans quel ordre le liquide traverse-t-il ces éléments ?', options: ['pompe → injecteur → colonne → détecteur', 'injecteur → pompe → colonne → détecteur', 'pompe → colonne → injecteur → détecteur', 'pompe → injecteur → détecteur → colonne'], bonne: 0,
        expl: 'La pompe pousse l’éluant ; l’échantillon est injecté juste avant la colonne (sinon il ne serait pas séparé) ; le détecteur est placé à la sortie de la colonne.' } },
    { id: 'inj', titre: 'Injecter et regarder', focus: ['viz'],
      texte: <>On injecte un mélange de <strong>caféine</strong>, de <strong>phénol</strong> et de <strong>benzophénone</strong>, avec un éluant à 50 % d’acétonitrile. Les bandes avancent dans la colonne, passent devant le détecteur, et le chromatogramme se trace. En phase inverse, <strong>plus un composé est apolaire, plus il est retenu</strong> par la phase C18 : il sort plus tard.</>,
      tache: { type: 'action', ok: lancement > 0 && memeMelange(TROIS), label: '▶ Mettre le mélange et injecter', faire: () => mettre(TROIS), consigne: 'Observez l’ordre de sortie des trois pics.' } },
    { id: 'ordre', titre: 'Prévoir l’ordre de sortie', focus: ['viz'],
      texte: <>En phase inverse la phase C18 est apolaire : <strong>plus un composé est apolaire (logP élevé), plus il est retenu</strong>. On peut donc prévoir l’ordre de sortie avant de simuler.
        <ExempleResolu>Le mélange précédent, éluant à 50 % d’acétonitrile.<br/>
          1. On relève les logP : caféine −0,13 ; phénol 1,48 ; benzophénone 3,18.<br/>
          2. On les classe du plus petit au plus grand : caféine &lt; phénol &lt; benzophénone.<br/>
          3. Ordre de sortie prévu : <strong>caféine → phénol → benzophénone</strong>. Le chromatogramme le confirme (t<Ind>R</Ind> = {v(trSeul(CAFEINE))} ; {v(trSeul(PHENOL))} ; {v(trSeul(BZP))} min).</ExempleResolu>
        À vous, avec un autre mélange : paracétamol (logP 0,34), phénacétine (1,63) et 1,3-diphénylacétone (2,99). {bouton('Mettre ce mélange dans le simulateur', () => mettre([PARACETAMOL, PHENACETINE, DPA]))}</>,
      tache: { type: 'qcm', q: 'Dans quel ordre ces trois composés sortent-ils ?', options: ['paracétamol → phénacétine → 1,3-diphénylacétone', 'phénacétine → paracétamol → 1,3-diphénylacétone', '1,3-diphénylacétone → phénacétine → paracétamol'], bonne: 0,
        indice: 'Classez d’abord les trois logP du plus petit au plus grand : le plus petit sort en premier.',
        expl: 'logP : 0,34 < 1,63 < 2,99, donc paracétamol, puis phénacétine, puis 1,3-diphénylacétone. Dans ce modèle seul le logP compte ; dans la réalité, d’autres interactions (liaisons hydrogène, ionisation) peuvent inverser deux composés aux logP voisins.' } },
    { id: 'ident', titre: 'Identifier un pic par son temps de rétention', focus: ['viz', 'resultats'],
      texte: <>En routine, on <strong>reconnaît</strong> un composé à son temps de rétention t<Ind>R</Ind>, mesuré <strong>dans les mêmes conditions</strong> (même éluant, même débit, même température, même colonne) sur un étalon injecté seul. Étalons purs à 50 % d’acétonitrile : caféine {v(trSeul(CAFEINE))} min, phénol {v(trSeul(PHENOL))} min, benzophénone {v(trSeul(BZP))} min.</>,
      tache: { type: 'qcm', q: `Dans l’échantillon inconnu, un pic sort à ${v(trSeul(BZP))} min (mêmes conditions). De quel composé s’agit-il ?`, options: ['la benzophénone', 'le phénol', 'la caféine'], bonne: 0,
        expl: 'Même t_R que l’étalon dans les mêmes conditions : c’est probablement la benzophénone. Ce n’est qu’un indice : deux composés peuvent avoir le même t_R, d’où l’intérêt de confirmer (autre éluant, détecteur à barrette de diodes ou spectromètre de masse).' } },
    { id: 'ident3', titre: 'Identifier les pics d’un échantillon', focus: ['viz', 'resultats'],
      texte: <>On injecte des <strong>étalons</strong> seuls, puis on associe chaque pic de l’échantillon à l’étalon qui a le même t<Ind>R</Ind>, à quelques centièmes de minute près (c’est la répétabilité de l’appareil).
        <ExempleResolu>Étalons à 50 % d’acétonitrile : caféine {v(trSeul(CAFEINE))} min ; phénol {v(trSeul(PHENOL))} ; benzophénone {v(trSeul(BZP))} ; triphénylcarbinol {v(trSeul(TPC))}.<br/>
          Échantillon : pic A à {v(trSeul(PHENOL) + 0.01)} min, pic B à {v(trSeul(BZP) - 0.01)} min, pic C à {v(trSeul(TPC) + 0.01)} min.<br/>
          A ↔ phénol, B ↔ benzophénone, C ↔ triphénylcarbinol. Aucun pic ne correspond à la caféine : <strong>elle est absente de l’échantillon</strong>.<br/>
          Attention : l’identification n’est solide que si les étalons ont des t<Ind>R</Ind> bien différents. La caféine ({v(trSeul(CAFEINE))} min) et le paracétamol ({v(trSeul(PARACETAMOL))} min) sont trop proches : un pic entre les deux laisserait un doute.</ExempleResolu>
        À vous : étalons paracétamol {v(trSeul(PARACETAMOL))} min, phénol {v(trSeul(PHENOL))} min, 1,3-diphénylacétone {v(trSeul(DPA))} min, triphénylcarbinol {v(trSeul(TPC))} min.</>,
      tache: { type: 'qcm', q: `Un échantillon donne trois pics à ${v(trSeul(PARACETAMOL) + 0.01)}, ${v(trSeul(DPA) - 0.01)} et ${v(trSeul(TPC) + 0.01)} min. Quel étalon n’y est pas ?`, options: ['le phénol', 'le paracétamol', 'la 1,3-diphénylacétone', 'le triphénylcarbinol'], bonne: 0,
        indice: 'Associez chaque pic à l’étalon de même t_R ; celui qui reste sans pic est absent.',
        expl: `Les pics correspondent au paracétamol (${v(trSeul(PARACETAMOL))} min), à la 1,3-diphénylacétone (${v(trSeul(DPA))} min) et au triphénylcarbinol (${v(trSeul(TPC))} min). Le phénol (${v(trSeul(PHENOL))} min) n’a pas de pic : il est absent. C’est exactement la démarche du défi « Identifier des pics ».` } },
    { id: 'rs', titre: 'Calculer une résolution', focus: ['resultats'],
      texte: <>Deux pics sont <strong>séparés</strong> quand leur résolution R<Ind>s</Ind> est au moins égale à 1,5. Le tableau des résultats la donne, mais il faut savoir la retrouver à partir du chromatogramme.
        <ExempleResolu>Caféine et paracétamol à 50 % d’acétonitrile : t<Ind>R1</Ind> = {v(exA.tr, 3)} min, t<Ind>R2</Ind> = {v(exB.tr, 3)} min, W<Ind>½,1</Ind> = {v(exA.W, 3)} min, W<Ind>½,2</Ind> = {v(exB.W, 3)} min.<br/>
          Expression littérale : R<Ind>s</Ind> = 1,18 × <Frac haut={<>t<Ind>R2</Ind> − t<Ind>R1</Ind></>} bas={<>W<Ind>½,1</Ind> + W<Ind>½,2</Ind></>}/><br/>
          Application numérique : R<Ind>s</Ind> = 1,18 × <Frac haut={<>{v(exB.tr, 3)} − {v(exA.tr, 3)}</>} bas={<>{v(exA.W, 3)} + {v(exB.W, 3)}</>}/> ≈ {v(rsExemple)}.<br/>
          Comme R<Ind>s</Ind> &lt; 1,0, les deux pics se chevauchent largement : il faudra améliorer la séparation.</ExempleResolu>
        À vous : lidocaïne et 1,3-diphénylacétone, à 50 % d’acétonitrile.</>,
      tache: { type: 'num', q: <>t<Ind>R1</Ind> = {v(moA.tr, 3)} min, t<Ind>R2</Ind> = {v(moB.tr, 3)} min, W<Ind>½,1</Ind> = {v(moA.W, 3)} min, W<Ind>½,2</Ind> = {v(moB.W, 3)} min. Calculez R<Ind>s</Ind>.</>, unite: '', vrai: rsExercice, tol: 0.03, affiche: x => v(x),
        aide: 'Utilisez la formule de l’exemple, avec les valeurs ci-dessus (3 décimales).',
        pieges: [[(r3(moB.tr) - r3(moA.tr)) / (r3(moA.W) + r3(moB.W)), 'Il manque le facteur 1,18 dans la formule.']],
        expl: `R_s = 1,18 × (${v(moB.tr, 3)} − ${v(moA.tr, 3)}) / (${v(moA.W, 3)} + ${v(moB.W, 3)}) ≈ ${v(rsExercice)}. Comme R_s ≥ 1,5, les deux pics sont séparés. Vérifiez dans le tableau en mettant ces deux composés dans le simulateur.` } },
    { id: 'separer2', titre: 'Séparer deux composés proches', focus: ['eluant', 'viz', 'resultats'],
      texte: <>Le réglage le plus efficace est la <strong>composition de l’éluant</strong> : moins il y a d’acétonitrile, plus les composés sont retenus (k’ plus grand) et plus leurs pics s’écartent, mais plus ils sortent tard.
        <ExempleResolu>Caféine et paracétamol sortent presque ensemble à 50 %. On essaie plusieurs compositions et on relève R<Ind>s</Ind> et le t<Ind>R</Ind> du dernier pic :
          <table style={{ borderCollapse: 'collapse', margin: '4px 0' }}><thead><tr><th style={th}>% ACN</th><th style={th}>R<Ind>s</Ind></th><th style={th}>dernier t<Ind>R</Ind> (min)</th></tr></thead>
            <tbody>{essaisPct.map(({ pc, r }) => <tr key={pc}><td style={td}>{pc}</td><td style={{ ...td, fontWeight: 700, color: r.res[0].R >= SEUIL_RS[1] ? '#15803d' : '#b91c1c' }}>{v(r.res[0].R)}</td><td style={td}>{v(r.pics[1].tr)}</td></tr>)}</tbody></table>
          Dès que R<Ind>s</Ind> ≥ 1,5 (ici vers 35 %), on s’arrête : descendre davantage ne fait que rallonger l’analyse.</ExempleResolu>
        À vous : acide 2-aminobenzoïque et phénol. Objectif : R<Ind>s</Ind> ≥ 1,5 avec un dernier pic avant {TEMPS_MAX_DEFI} min (c’est le principe du défi « Séparer deux composés »). {bouton('Mettre ces deux composés (50 %)', () => mettre([AMINO, PHENOL]))}</>,
      tache: { type: 'action', ok: memeMelange([AMINO, PHENOL]) && !p.grad && nbPics === 2 && rsMin >= SEUIL_RS[1] && dernierTr <= TEMPS_MAX_DEFI, label: null,
        consigne: memeMelange([AMINO, PHENOL]) ? `${p.pct} % d’acétonitrile · R_s = ${v(rsMin ?? 0)} · dernier pic à ${v(dernierTr)} min${p.grad ? ' · repassez en isocratique' : ''}` : 'Mettez les deux composés avec le bouton ci-dessus.' } },
    { id: 'iso', titre: 'Choisir la composition de l’éluant', focus: ['eluant', 'viz', 'resultats'],
      texte: <>Mélange plus difficile : caféine, paracétamol (très proches), benzophénone et triphénylcarbinol (très retenu). {bouton('Mettre ces 4 composés (50 %)', () => mettre(QUATRE))} Faites varier le pourcentage d’acétonitrile : plus l’éluant est riche en acétonitrile, plus tout sort vite… mais moins les pics du début sont séparés. Cherchez Rs ≥ 1,5 pour toutes les paires <strong>et</strong> un dernier pic avant 10 min.</>,
      tache: { type: 'qcm', q: 'En élution isocratique (composition constante), peut-on séparer les 4 pics (Rs ≥ 1,5) en moins de 10 min ?', options: ['non : ce qui sépare les premiers retarde trop les derniers', 'oui, vers 50 % d’acétonitrile', 'oui, en diminuant le débit'], bonne: 0,
        expl: 'À 36 % d’acétonitrile les deux premiers pics sont tout juste séparés, mais le dernier sort après 13 min ; à 50 % tout sort vite mais caféine et paracétamol se chevauchent. Un compromis unique n’existe pas : c’est le cas typique où l’on passe en gradient.' } },
    { id: 'grad', titre: 'Passer en gradient', focus: ['eluant', 'viz', 'resultats'],
      texte: <>En <strong>gradient d’élution</strong>, la pompe augmente progressivement la proportion d’acétonitrile : les premiers composés sont séparés dans un éluant faible, les derniers sont décrochés par un éluant fort. Choisissez « gradient » et réglez le départ, la fin et la durée.</>,
      tache: { type: 'action', ok: p.grad && memeMelange(QUATRE) && rsMin >= SEUIL_RS[1] && dernierTr <= 10, label: null, consigne: memeMelange(QUATRE) ? `Rs minimal : ${v(rsMin ?? 0)} · dernier pic à ${v(dernierTr)} min${p.grad ? '' : ' · passez en gradient'}` : 'Remettez les 4 composés à l’étape précédente.' } },
    { id: 'debit', titre: 'Débit et pression', focus: ['appareil', 'eluant'],
      texte: <>Retour à l’isocratique. {bouton('Mettre le mélange de 3 composés (50 %, débit habituel)', () => mettre(TROIS))} Le <strong>manomètre</strong> lit la pression nécessaire pour faire passer l’éluant dans la colonne : ici ≈ {Math.round(ref0)} bar. Changez le débit et lisez la pression ; regardez aussi ce qui arrive aux temps de rétention.</>,
      tache: { type: 'qcm', q: 'On double le débit. Que devient la pression lue au manomètre ?', options: ['elle double à peu près', 'elle est divisée par 2', 'elle ne change pas'], bonne: 0,
        expl: 'La pression est proportionnelle au débit (loi de Darcy). C’est pourquoi on note la pression de référence de la méthode : un écart à débit identique signale un problème. Doubler le débit divise aussi les temps de rétention par 2 ; au-delà de la limite de pression de l’appareil, la pompe s’arrête.' } },
    { id: 'methode', titre: 'Diagnostiquer : la méthode', focus: ['controle'],
      texte: <>Face à une analyse anormale, on <strong>compare la journée à la méthode validée</strong>, indicateur par indicateur, plutôt que de deviner. Le tableau « Contrôle de routine » du simulateur donne ces écarts.
        <ExempleResolu titre="Grille de lecture">
          <ul style={{ margin: '4px 0', paddingLeft: 18 }}>
            <li><strong>Encrassement</strong> : pression ↑↑ ; le reste est inchangé.</li>
            <li><strong>Fuite</strong> : pression ↓, t<Ind>R</Ind> ↑ (tous), R<Ind>s</Ind> inchangé.</li>
            <li><strong>Éluant mal préparé</strong> : pression ≈ ; t<Ind>R</Ind> décalés, surtout les derniers.</li>
            <li><strong>Colonne vieillie</strong> : pression =, t<Ind>R</Ind> un peu ↓, pics larges et R<Ind>s</Ind> ↓.</li>
            <li><strong>Bulle d’air</strong> : pression qui oscille, ligne de base ondulée, pics irréguliers.</li>
            <li><strong>Lampe</strong> : pression et t<Ind>R</Ind> corrects, pics plus petits, bruit ↑.</li></ul>
          On lit dans cet ordre : <strong>pression</strong>, puis <strong>t<Ind>R</Ind></strong>, puis <strong>forme des pics et R<Ind>s</Ind></strong>, enfin <strong>hauteur et bruit</strong>. Le premier indicateur qui sort de la tolérance oriente vers la cause.</ExempleResolu>
        Les six pannes qui suivent se règlent avec cette grille.</>,
      tache: { type: 'qcm', q: 'Les t_R ont tous beaucoup augmenté et les pics sont toujours bien séparés. Quel indicateur fait d’abord la différence entre une fuite et un éluant mal préparé ?', options: ['la pression au manomètre', 'la hauteur des pics', 'la ligne de base'], bonne: 0,
        expl: 'Avec une fuite, le débit réel est plus faible : la pression baisse. Avec un éluant mal préparé, le débit est le bon : la pression ne bouge presque pas.' } },
    { id: 'bouchee', titre: 'Panne n° 1 : la pression monte', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => situation(TROIS, 'bouchee'))} Le tableau « Contrôle de routine » compare la journée à la méthode validée. Ici la pression est passée de {Math.round(ref0)} à {Math.round(colonne({ ...PARAMS_DEFAUT, panne: 'bouchee' }).dP)} bar alors que les chromatogrammes ont gardé les mêmes temps de rétention, la même résolution et la même hauteur de pic.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.bouchee.nom, PANNES.fuite.nom, PANNES.lampe.nom], bonne: 0,
        expl: `Pression ↑ sans autre changement : l’écoulement est gêné (filtre en ligne, frittés ou tête de colonne encrassés par des particules). Geste : ${PANNES.bouchee.geste}` } },
    { id: 'fuite', titre: 'Panne n° 2 : tout sort trop tard', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => situation(TROIS, 'fuite'))} Les temps de rétention ont beaucoup augmenté, la pression est plus faible que d’habitude, les pics sont toujours bien séparés (Rs inchangé). Le débit réel dans la colonne est inférieur au débit réglé sur la pompe.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.fuite.nom, PANNES.bouchee.nom, PANNES.vieille.nom], bonne: 0,
        expl: `Débit réel plus faible : t₀ augmente, donc tous les t_R aussi, et la pression baisse (elle est proportionnelle au débit). Geste : ${PANNES.fuite.geste}` } },
    { id: 'vieille', titre: 'Panne n° 3 : les pics s’élargissent', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => situation(TROIS, 'vieille'))} Les pics sont plus larges et plus bas, la résolution a chuté, les temps de rétention sont un peu plus courts. La pression n’a pas bougé.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.vieille.nom, PANNES.bulle.nom, PANNES.eluant.nom], bonne: 0,
        expl: `Une colonne usée (phase greffée dégradée, vide dans le lit) retient moins et élargit les bandes, sans changer la pression. Geste : ${PANNES.vieille.geste}` } },
    { id: 'lampe', titre: 'Panne n° 4 : des pics trop petits', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => situation(TROIS, 'lampe'))} Les temps de rétention, la pression et la résolution sont corrects, mais les pics ont perdu les deux tiers de leur hauteur et la ligne de base est plus bruitée.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.lampe.nom, PANNES.fuite.nom, PANNES.vieille.nom], bonne: 0,
        expl: `Tout ce qui concerne la séparation est normal : c’est le détecteur qui a perdu en sensibilité. Geste : ${PANNES.lampe.geste}` } },
    { id: 'bulle', titre: 'Panne n° 5 : la pression oscille', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => situation(TROIS, 'bulle'))} Observez l’aiguille du manomètre : elle oscille entre {Math.round(cBulle.dPmin)} et {Math.round(cBulle.dPmax)} bar. La ligne de base ondule et les pics sont irréguliers, alors que les temps de rétention moyens sont corrects.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.bulle.nom, PANNES.bouchee.nom, PANNES.lampe.nom], bonne: 0,
        expl: `Une bulle d’air dans la pompe rend le débit irrégulier : la pression oscille et la ligne de base ondule. Une pression trop haute mais stable serait un encrassement. Geste : ${PANNES.bulle.geste}` } },
    { id: 'eluant', titre: 'Panne n° 6 : les derniers pics sortent trop tard', focus: ['appareil', 'controle', 'viz'],
      texte: <>{bouton('Charger la situation', () => situation(TROIS, 'eluant'))} Les t<Ind>R</Ind> ont augmenté, surtout ceux des derniers pics : la benzophénone sort à {v(pEluant[2].tr)} min au lieu de {v(pRef[2].tr)} min, la caféine à peine décalée ({v(pEluant[0].tr)} au lieu de {v(pRef[0].tr)} min). La pression est presque inchangée ({Math.round(cEluant.dP)} bar au lieu de {Math.round(ref0)} bar) et les pics restent bien séparés.</>,
      tache: { type: 'qcm', q: 'Quelle est la cause la plus probable ?', options: [PANNES.eluant.nom, PANNES.fuite.nom, PANNES.vieille.nom], bonne: 0,
        expl: `Un éluant trop pauvre en acétonitrile retient davantage les composés apolaires, donc les derniers pics sont les plus retardés. Avec une fuite, tous les t_R seraient multipliés par le même facteur et la pression baisserait. Geste : ${PANNES.eluant.geste}` } },
    { id: 'fin', titre: 'À retenir', focus: [],
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Chaîne : <strong>pompe → injecteur → colonne (four) → détecteur</strong>. Le manomètre donne la santé du circuit.</li>
        <li>On <strong>identifie</strong> par t<Ind>R</Ind> (comparaison à un étalon dans les mêmes conditions) et on vérifie par une autre méthode.</li>
        <li>Phase inverse : plus un composé est apolaire (logP élevé), plus il est retenu. Plus il y a d’acétonitrile, plus tout sort vite.</li>
        <li>Résolution : R<Ind>s</Ind> = 1,18 (t<Ind>R2</Ind> − t<Ind>R1</Ind>) / (W<Ind>½,1</Ind> + W<Ind>½,2</Ind>) ; séparés si R<Ind>s</Ind> ≥ 1,5. Pour séparer deux composés proches, on diminue le % d’acétonitrile, tant que le dernier pic sort dans un temps raisonnable.</li>
        <li>Un mélange aux polarités très étalées se sépare mieux en <strong>gradient</strong>.</li>
        <li><strong>Diagnostic</strong> : comparer pression, t<Ind>R</Ind>, forme et hauteur des pics, ligne de base à la méthode validée. Pression ↑ : encrassement. Pression ↓ et t<Ind>R</Ind> ↑ : fuite. Pics larges et Rs ↓ : colonne usée. Pics petits, bruit ↑ : lampe. Pression qui oscille : bulle d’air. t<Ind>R</Ind> décalés (surtout les derniers) avec pression normale : éluant mal préparé.</li></ul></ARetenir>,
      tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  function lancer(type) { const d = nouveauDefi(type); setDefi(d); setP({ ...PARAMS_DEFAUT, pct: d.pct }); setHover(null); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'ordre'); else setP(q => (q.panne ? { ...q, panne: null } : q)); }
  const ordreVrai = a.pics.map(m => m.id);
  function evaluer(d) {
    if (d.type === 'ordre') { const ok = JSON.stringify(d.reps.ordre) === JSON.stringify(ordreVrai); return { ok, ligne: ok ? 'Bon ordre : plus un composé est apolaire (logP élevé), plus il est retenu.' : 'Pas encore : plus logP est élevé, plus le composé est apolaire donc retenu par les chaînes C18, et sort tard.' }; }
    if (d.type === 'identifier') {
      const faux = a.pics.filter((m, i) => d.reps[LETTRES[i]] !== m.id).length;
      const ok = faux === 0 && a.pics.every((m, i) => d.reps[LETTRES[i]]);
      return { ok, ligne: ok ? 'Tous les pics sont identifiés : même tR que l’étalon, dans les mêmes conditions.' : 'Comparez le tR de chaque pic (survol) à ceux des étalons. Attention : un étalon de la liste n’est pas dans l’échantillon.' };
    }
    if (d.type === 'panne') {
      const ok = d.reps.cause === d.panne;
      return { ok, ligne: ok ? `Bien vu : ${PANNES[d.panne].nom}. Geste : ${PANNES[d.panne].geste}` : d.reps.cause ? 'Ce n’est pas la bonne cause : confrontez les écarts du tableau de contrôle (pression, tR, largeur, hauteur, ligne de base) aux symptômes de chaque défaut.' : 'Choisissez d’abord une cause.' };
    }
    const ok = nbPics === 2 && rsMin >= SEUIL_RS[1] && dernierTr <= TEMPS_MAX_DEFI;
    return { ok, ligne: ok ? 'Séparation obtenue dans le temps imparti.' : `Il faut R_s ≥ 1,5 et un dernier pic avant ${TEMPS_MAX_DEFI} min (actuellement R_s = ${v(rsMin ?? 0)} ; dernier pic à ${v(dernierTr)} min).` };
  }
  const res = enDefi && defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const anonyme = enDefi && defi.type === 'identifier' && !defi.solution && !reussi;
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
      {defi.type === 'identifier' && <>
        <div style={txtD}>🎯 Éluant à <strong>{defi.pct} %</strong> d’acétonitrile. On a injecté séparément quatre étalons ; l’échantillon, lui, <strong>n’en contient que trois</strong>. Identifiez chaque pic (A, B, C…) en comparant son t<Ind>R</Ind> (survol du pic) à celui des étalons.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
          {defi.etalons.map(i => <span key={i} style={{ ...styleBoite, padding: '3px 8px' }}>{MOLECULES_CLHP[i].nom} : <strong>{v(trSeul(i, defi.pct))} min</strong></span>)}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          {a.pics.map((m, i) => <label key={m.id} style={{ fontSize: 14, fontWeight: 700 }}>Pic {LETTRES[i]} {' '}
            <select value={defi.reps[LETTRES[i]] ?? ''} onChange={e => rep(LETTRES[i], e.target.value)} style={{ fontSize: 14, padding: '3px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, color: KIT.txt }}>
              <option value="">?</option>{defi.etalons.map(k => <option key={k} value={'pre_' + k}>{MOLECULES_CLHP[k].nom}</option>)}</select></label>)}</div></>}
      {defi.type === 'panne' && <>
        <div style={txtD}>🎯 Une analyse de routine donne ce chromatogramme (mélange {allMols.map(m => nomsCourts(m)).join(', ')} ; méthode validée : 50 % d’acétonitrile, {v(PARAMS_DEFAUT.debit, 1)} mL/min, {PARAMS_DEFAUT.temperature} °C). Observez le manomètre et le contrôle de routine, puis choisissez la <strong>cause la plus probable</strong>.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(PANNES).map(([k, q]) => <button key={k} onClick={() => rep('cause', k)} style={stylePetitBouton(defi.reps.cause === k, '#0ea5e9')}>{q.nom}</button>)}</div></>}
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
        {defi.type === 'identifier' && <>{a.pics.map((m, i) => <span key={m.id}>Pic {LETTRES[i]} ({TR} = {v(m.tr)} min) : <strong>{m.nom}</strong>{i < a.pics.length - 1 ? ' ; ' : '.'} </span>)}</>}
        {defi.type === 'panne' && <><strong>{PANNES[defi.panne].nom}</strong> — {PANNES[defi.panne].symptome}. Geste : {PANNES[defi.panne].geste}</>}
        {defi.type === 'separer' && <>Piste : à 50 % d’acétonitrile, R<Ind>s</Ind> = {v(analyse({ ...PARAMS_DEFAUT }, allMols).res[0].R)}. Diminuez le pourcentage d’acétonitrile pour augmenter k’ et α, en surveillant le temps du dernier pic.</>}</div>}
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const resultats = nbPics === 0 || anonyme ? null : (
    <div style={{ ...styleBoite, ...cadre('resultats') }}>
      <Section titre={`Résultats : ${nbPics} pic${nbPics > 1 ? 's' : ''}`} ouvert={ouv.tableau} onBascule={() => bascule('tableau')}>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Colonne : {T0} = {v(a.col.tm)} min · N = {Math.round(a.col.N).toLocaleString('fr-FR')} plateaux · H = {v(a.col.H * 1000, 1)} µm · ΔP ≈ {Math.round(a.col.dP)} bar. Concentration et réponse de chaque composé sont modifiables.
          {p.grad && <> En gradient, k’ affiché = ({TR} − {T0}) / {T0} : c’est un facteur de rétention <strong>apparent</strong>, car la composition de l’éluant change pendant la migration.</>}</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt }}>Éluant et colonne</div>
        {!enDefi && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: KIT.txt2 }}>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>Élution :
            <button onClick={() => maj('grad', false)} style={stylePetitBouton(!p.grad, '#0d6e6e')}>isocratique</button>
            <button onClick={() => maj('grad', true)} style={stylePetitBouton(p.grad, '#7c3aed')}>gradient</button></span>
        </div>}
      </div>
      <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {fige && defi.type !== 'ordre' ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Conditions fixées par l’énoncé : {defi.pct} % d’acétonitrile, {v(PARAMS_DEFAUT.debit, 1)} mL/min, {PARAMS_DEFAUT.temperature} °C, colonne C{PARAMS_DEFAUT.nC} de {PARAMS_DEFAUT.longueur} cm.</div> :
        (enDefi && defi.type === 'ordre') ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Éluant fixé : {defi.pct} % d’acétonitrile.</div> :
          <Curseur nom={p.grad ? 'Acétonitrile au départ' : 'Acétonitrile'} valeur={p.pct} onChange={x => maj('pct', x)} min={5} max={95} pas={1} unite="%" couleur={p.grad ? '#7c3aed' : '#0d6e6e'}/>}
        {!(fige && defi.type !== 'ordre') && p.grad && <Curseur nom="Acétonitrile à la fin" valeur={p.pct1} onChange={x => maj('pct1', x)} min={5} max={95} pas={1} unite="%" couleur="#7c3aed"/>}
        {!(fige && defi.type !== 'ordre') && p.grad && <Curseur nom="Durée du gradient" valeur={p.tg} onChange={x => maj('tg', x)} min={1} max={60} pas={1} unite="min" couleur="#7c3aed"/>}
        {!(fige && defi.type !== 'ordre') && <Curseur nom="Débit" valeur={p.debit} onChange={x => maj('debit', x)} min={0.1} max={10} pas={0.1} unite="mL/min" decimales={1} couleur="#0d6e6e"/>}
        {!(fige && defi.type !== 'ordre') && <Curseur nom="Température" valeur={p.temperature} onChange={x => maj('temperature', x)} min={5} max={80} pas={1} unite="°C" couleur="#0d6e6e"/>}
        {!(fige && defi.type !== 'ordre') && <Curseur nom="Longueur L" valeur={p.longueur} onChange={x => maj('longueur', x)} min={1} max={50} pas={1} unite="cm" couleur="#0d6e6e"/>}
      </div>
      {!(fige && defi.type !== 'ordre') && <button onClick={() => bascule('plus')} aria-expanded={ouv.plus} style={{ ...stylePetitBouton(false), marginTop: 4 }}>{ouv.plus ? '▲ Moins de réglages' : '▼ Autres réglages de la colonne'}</button>}
      {ouv.plus && !(fige && defi.type !== 'ordre') && <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginTop: 8 }}>
        <Curseur nom="Diamètre interne" valeur={p.diametre} onChange={x => maj('diametre', x)} min={1} max={10} pas={0.1} unite="mm" decimales={1} couleur="#475569"/>
        <Curseur nom="Taille des particules dp" valeur={p.dp} onChange={x => maj('dp', x)} min={1} max={20} pas={1} unite="µm" couleur="#475569"/>
        <Curseur nom="Greffage nC" valeur={p.nC} onChange={x => maj('nC', x)} min={1} max={30} pas={1} unite="C" couleur="#475569"/>
        <Curseur nom="Porosité ε" valeur={p.porosite} onChange={x => maj('porosite', x)} min={0.1} max={1} pas={0.05} unite="" decimales={2} couleur="#475569"/>
      </div>}
      <div style={{ fontSize: 13.5, marginTop: 4, color: a.col.dP > P_MAX ? '#b91c1c' : KIT.txt2, fontWeight: a.col.dP > P_MAX ? 700 : 400 }}>
        Pression en tête de colonne ≈ {Math.round(a.col.dP)} bar{p.grad ? ' (au maximum pendant le gradient)' : ''}{a.col.dP > P_MAX ? ` : au-delà de ${P_MAX} bar, une CLHP classique se met en sécurité (il faudrait une UHPLC).` : '.'}</div>
      {!fige && <button onClick={() => bascule('avance')} aria-expanded={ouv.avance} style={{ ...stylePetitBouton(false), marginTop: 6, marginLeft: ouv.plus ? 0 : 6 }}>{ouv.avance ? '▲ Masquer les paramètres du modèle' : '▼ Paramètres du modèle (mp, mo, b, c)'}</button>}
      {ouv.avance && !fige && <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, padding: '10px 12px', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
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
          <li><strong>Efficacité</strong> : N = L / (dp · nC), indépendant du débit et du composé (relation de X. Bataille). Elle donne une colonne peu efficace (H ≈ 18 dp), proche de colonnes de TP usagées. La variation réelle de N avec le débit n’est pas représentée.</li>
          <li><strong>Défauts de fonctionnement</strong> : volontairement simples, pour montrer le <em>sens</em> des écarts et non les valeurs d’un appareil réel. Colonne encrassée : résistance à l’écoulement × 2,6. Colonne vieillie : N × 0,35 et k’ × 0,75. Fuite : débit réel × 0,7. Éluant mal préparé : 8 points d’acétonitrile en moins. Bulle : pression oscillante, N × 0,8 et ligne de base ondulée. Lampe : signal × 0,35 et bruit de ligne de base.</li>
          <li><strong>Pression</strong> : loi de Darcy ΔP = Φ·η·u·L / dp² avec Φ ≈ 1000 ; viscosité du mélange eau / acétonitrile estimée (maximum ≈ 1 mPa·s vers 20 % d’acétonitrile), et décroissante avec la température. Ordre de grandeur, à ± 30 % environ.</li>
          <li><strong>Gradient</strong> : linéaire, puis palier à la composition finale. Volume de délai de la pompe, rééquilibrage et variation de N avec la composition sont négligés. Chaque bande avance à la vitesse u / (1 + k’) avec le k’ de l’éluant qui l’entoure ; la largeur du pic est estimée par σ ≈ t₀ (1 + k’<Ind>sortie</Ind>) / √N (compression de bande négligée).</li>
          <li>Volume mort extra-colonne et volume injecté ne sont pas modélisés.</li>
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
        <li>Augmentez le débit : lisez la pression au manomètre et regardez les temps de rétention. Chauffez la colonne : que deviennent la pression et la durée de l’analyse ?</li>
        <li>Dans « Simuler un défaut », choisissez une panne et repérez ses symptômes dans le tableau de contrôle de routine.</li>
        <li>Mettez les 17 composés et passez en gradient (10 → 90 % en 10 min) : comparez la largeur des derniers pics avec l’isocratique.</li>
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
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Choisissez un défaut, injectez, puis comparez l’appareil, le chromatogramme et le contrôle de routine à la situation normale.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <button onClick={() => maj('panne', null)} style={stylePetitBouton(!p.panne, '#16a34a')}>Aucun défaut</button>
          {Object.entries(PANNES).map(([k, q]) => <button key={k} onClick={() => { maj('panne', k); setLancement(n => n + 1); }} style={stylePetitBouton(p.panne === k, '#c2410c')}>{q.nom}</button>)}</div>
        {p.panne && <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}><strong>Symptômes :</strong> {PANNES[p.panne].symptome}.<br/><strong>Geste :</strong> {PANNES[p.panne].geste}</div>}
      </Section>
    </div>);

  const visuel = (
    <div style={{ ...styleBoite, background: 'white', ...cadre('viz') }}>
      {a.nonElues.length > 0 && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>
        ⚠ {a.nonElues.map(m => m.nom).join(', ')} : ne sort pas de la colonne pendant l’analyse simulée (plus de {Math.round(p.tg + 300 * a.col.tm)} min). Augmentez le pourcentage final d’acétonitrile.</div>}
      {nbPics === 0 ? <div style={{ padding: '2rem', textAlign: 'center', fontSize: 14, color: KIT.txt2 }}>{a.nonElues.length ? 'Aucun composé ne sort de la colonne.' : 'Sélectionnez au moins un composé pour afficher le chromatogramme.'}</div>
        : masque ? <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: 14, color: KIT.txt2, lineHeight: 1.6 }}>🔒 Le chromatogramme sera affiché après votre vérification : prédisez d’abord l’ordre de sortie.</div>
        : <Visu a={a} p={pEff} couleurs={couleurs} hover={hover} setHover={setHover} lancement={lancement} onLancer={() => setLancement(n => n + 1)}
            nonRetenu={nonRetenu} setNonRetenu={setNonRetenu} total={total} setTotal={setTotal} anonyme={anonyme}/>}
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
          {appareil}
          {eluant}
          {visuel}
          {controle}
          {defauts}
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
