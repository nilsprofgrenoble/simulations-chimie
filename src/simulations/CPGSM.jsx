import { useState, useEffect, useRef, useMemo } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, Curseur, lireProgression } from "../commun";
import { ColonneAnim } from "./CPG";
import { useLargeur, pasTemps, grille } from "./cpgOutils";
import { SPECTRES } from "./cpgsmSpectres";
import { IDS_SM, PARAMS_DEFAUT, PANNES, PAR_ID, PHASES, analyse, tic, eic, spectreA, rechercheBibliotheque, concordance,
  controleAirEau, ionMoleculaire, picBase, masseNominale, temperature } from "./cpgsmModele";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 55 — CPG COUPLÉE À LA SPECTROMÉTRIE DE MASSE (BTS)
//  Séparation : modèle de la CPG (sim 54), sortie de colonne sous vide.
//  Détection : ionisation électronique 70 eV, spectres réels MassBank (CC BY-NC-SA), recherche en bibliothèque.
//  Interface centrée sur l'exploitation qualitative : TIC, spectre d'un pic, ion moléculaire, pic de base,
//  isotopes du chlore, bibliothèque, chromatogrammes d'ions extraits, contrôle air / eau, pannes.
// ====================================================

const SIM = 55;
declarerDefis(SIM, [
  ['inconnu', 'Identifier un composé par son spectre'],
  ['coelution', 'Séparer deux composés co-élués par leurs ions'],
  ['panne', 'Diagnostiquer une panne'],
]);

const PALETTE = ['#e63946', '#2a9d8f', '#6a4c93', '#d98e04', '#457b9d', '#2d6a4f', '#c2410c', '#9333ea', '#0891b2', '#be185d', '#65a30d', '#475569'];
const COUL_EIC = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#d97706'];
const VERT = '#0f766e', VIOLET = '#6d28d9';
const v = (x, d = 2) => (isFinite(x) ? x.toFixed(d) : '—').replace('.', ',');
const LETTRES = 'ABCDEFGHIJKL';
const FAMILLES = ['alcool', 'cétone', 'ester', 'éther', 'chloré', 'nitrile', 'aromatique', 'alcane'];
const NOM_FAM = { alcool: 'alcools', cétone: 'cétones', ester: 'esters', éther: 'éthers', chloré: 'chlorés', nitrile: 'nitriles', aromatique: 'aromatiques', alcane: 'n-alcanes' };
const Ind = ({ children }) => <sub>{children}</sub>;
const TR = <>t<Ind>R</Ind></>;
const COMPOSES_SM = IDS_SM.map(id => PAR_ID[id]);

let CACHE = { cle: null, val: null };
function analyseMemo(p, ids) {
  const cle = JSON.stringify([p, ids]);
  if (CACHE.cle !== cle) CACHE = { cle, val: analyse(p, ids) };
  return CACHE.val;
}
// instant du fond pour la soustraction : minimum du TIC juste avant le pic
function tempsFond(a, t) {
  let best = Math.max(0, t - 0.3), bv = Infinity;
  for (let i = 0; i <= 60; i++) { const x = Math.max(0, t - 0.6 + 0.55 * i / 60); const y = tic(a, x); if (y < bv) { bv = y; best = x; } }
  return best;
}
const picA = (a, t) => {
  let best = null, bd = Infinity;
  a.pics.forEach(m => { const d = Math.abs(m.tr - t) / Math.max(m.sigma, 1e-4); if (d < bd) { bd = d; best = m; } });
  return best && bd < 4 ? best : null;
};

// ---------- spectre de masse (barres), avec comparaison tête-bêche facultative ----------
function Spectre({ pk, refPk: ref, w, mzMin, mzMax, titre, refTitre, marque }) {
  const h = ref ? 260 : 170, mL = 34, mR = 10, mT = 18, mB = 28;
  const iw = w - mL - mR, haut = ref ? (h - mT - mB) / 2 : h - mT - mB, y0 = mT + haut;
  const tous = [...pk, ...(ref || [])];
  const xMax = Math.max(mzMax === 200 ? 0 : 0, ...tous.map(q => q[0]), 50) + 8, xMin = Math.max(0, Math.min(mzMin, ...tous.map(q => q[0])) - 4);
  const X = mz => mL + (mz - xMin) / (xMax - xMin) * iw;
  const pas = [5, 10, 20, 50].find(s => (xMax - xMin) / s <= (w < 480 ? 7 : 12));
  const grad = []; for (let m = Math.ceil(xMin / pas) * pas; m <= xMax; m += pas) grad.push(m);
  const etiq = (liste, bas) => {
    const tri = [...liste].sort((a, b) => b[1] - a[1]).slice(0, 7);
    if (marque && !tri.some(q => q[0] === marque) && liste.some(q => q[0] === marque)) tri.push(liste.find(q => q[0] === marque));
    const pris = [];
    return tri.filter(q => q[1] >= 3 || q[0] === marque).filter(q => { const x = X(q[0]); if (pris.some(px => Math.abs(px - x) < 16)) return false; pris.push(x); return true; })
      .map(q => <text key={(bas ? 'b' : 'h') + q[0]} x={X(q[0])} y={bas ? y0 + q[1] / 100 * haut + 11 : y0 - q[1] / 100 * haut - 3} textAnchor="middle" fontSize="10.5"
        fill={q[0] === marque ? '#b45309' : bas ? '#b91c1c' : '#0f172a'} fontWeight={q[0] === marque ? 700 : 500}>{q[0]}</text>);
  };
  return (
    <svg width={w} height={h} style={{ display: 'block' }} role="img" aria-label="Spectre de masse : intensité relative en fonction de m/z">
      <rect x={mL} y={mT} width={iw} height={h - mT - mB} fill="white" stroke="#cbd5e1"/>
      {grad.map(m => <g key={m}><line x1={X(m)} x2={X(m)} y1={h - mB} y2={h - mB + 4} stroke="#475569"/><text x={X(m)} y={h - mB + 15} fontSize="10.5" textAnchor="middle" fill="#334155">{m}</text></g>)}
      <text x={mL + iw / 2} y={h - 2} fontSize="11.5" textAnchor="middle" fill="#334155" fontWeight="600">m/z</text>
      <text transform={`translate(11 ${mT + (h - mT - mB) / 2}) rotate(-90)`} fontSize="10.5" textAnchor="middle" fill="#334155">intensité relative (%)</text>
      {ref && <line x1={mL} x2={mL + iw} y1={y0} y2={y0} stroke="#94a3b8"/>}
      {pk.map(([m, i]) => <line key={'a' + m} x1={X(m)} x2={X(m)} y1={y0} y2={y0 - i / 100 * haut} stroke={m === marque ? '#d97706' : '#0f172a'} strokeWidth={Math.min(4, Math.max(1.5, iw / (xMax - xMin) * 0.4))}/>)}
      {ref && ref.map(([m, i]) => <line key={'b' + m} x1={X(m)} x2={X(m)} y1={y0} y2={y0 + i / 100 * haut} stroke="#dc2626" strokeWidth={Math.min(4, Math.max(1.5, iw / (xMax - xMin) * 0.4))}/>)}
      {etiq(pk, false)}{ref && etiq(ref, true)}
      {titre && <text x={mL + 6} y={mT + 13} fontSize="11.5" fill="#0f172a" fontWeight="600">{titre}</text>}
      {refTitre && <text x={mL + 6} y={h - mB - 6} fontSize="11.5" fill="#b91c1c" fontWeight="600">{refTitre}</text>}
    </svg>);
}

// ---------- chromatogramme : courant ionique total et ions extraits ----------
function Chromato({ a, p, frac, w, couleurs, hover, setHover, anonyme, tSel, setTSel, eics, normEic }) {
  const [zoom, setZoom] = useState(null);
  const [sel, setSel] = useState(null);
  const [cleA, setCleA] = useState(a);
  if (cleA !== a) { setCleA(a); if (zoom && zoom[0] > a.tMax) setZoom(null); }
  const h = w < 480 ? 240 : 280, mL = 34, mR = p.rampe > 0 ? 40 : 12, mT = 14, mB = 34;
  const iw = w - mL - mR, ih = h - mT - mB;
  const [xa, xb] = zoom || [0, a.tMax];
  const tCur = frac * a.tMax;
  const geo = useMemo(() => {
    const ts = grille(a, xa, xb);
    const tot = ts.map(t => tic(a, t));
    const ex = eics.map(mz => ts.map(t => eic(a, t, mz)));
    const ymax = (zoom ? Math.max(...tot, a.hRef * 0.01) : Math.max(...tot, a.hRef)) * 1.15;
    return { ts, tot, ex, ymax };
  }, [a, xa, xb, zoom, eics]);
  const X = t => mL + (t - xa) / (xb - xa) * iw, Y = (s, ym = geo.ymax) => mT + ih - s / ym * ih;
  const tEnV = px => xa + (px - mL) / iw * (xb - xa);
  const nCur = geo.ts.findIndex(t => t > tCur), nVis = nCur < 0 ? geo.ts.length : nCur;
  const chemin = (ys, ym) => ys.slice(0, nVis).map((s, i) => `${i ? 'L' : 'M'}${X(geo.ts[i]).toFixed(1)},${Y(s, ym).toFixed(1)}`).join('');
  const pas = pasTemps(xb - xa), graduations = [];
  for (let t = Math.ceil(xa / pas) * pas; t <= xb + 1e-9; t += pas) graduations.push(Math.round(t * 1000) / 1000);
  const TaxeMax = Math.ceil(Math.max(p.Tf, p.T0) / 50) * 50 || 50;
  const etiq = a.pics.map((m, i) => ({ m, lib: anonyme ? LETTRES[i] : (m.court || m.nom), x: X(m.tr), y: Y(Math.min(tic(a, m.tr), geo.ymax)) - 7 })).filter(e => e.m.tr >= xa && e.m.tr <= xb && e.m.tr >= p.retard);
  const places = [];
  [...etiq].sort((q, r) => r.m.abond - q.m.abond).forEach(e => {
    const lg = e.lib.length * 6.4 + 6;
    e.x = Math.min(Math.max(e.x, mL + lg / 2), w - mR - lg / 2);
    for (let k = 0; k < 6; k++) {
      const y = Math.max(e.y - k * 14, mT + 12), b = { x1: e.x - lg / 2, x2: e.x + lg / 2, y1: y - 11, y2: y + 2 };
      if (!places.some(q => b.x1 < q.x2 && q.x1 < b.x2 && b.y1 < q.y2 && q.y1 < b.y2)) { e.y = y; places.push(b); e.ok = true; return; }
      if (y === mT + 12) break;
    }
  });
  function bouge(ev) {
    const r = ev.currentTarget.getBoundingClientRect(), px = ev.clientX - r.left;
    if (sel) { setSel(s => ({ ...s, x1: px })); return; }
    const m = picA(a, tEnV(px)); setHover(m && !anonyme ? m.id : null);
  }
  function debut(ev) { if (ev.pointerType === 'mouse' && ev.button !== 0) return; const r = ev.currentTarget.getBoundingClientRect(); setSel({ x0: ev.clientX - r.left, x1: ev.clientX - r.left }); }
  function fin() {
    if (!sel) return;
    if (Math.abs(sel.x1 - sel.x0) > 10) {
      const t1 = Math.max(xa, tEnV(Math.min(sel.x0, sel.x1))), t2 = Math.min(xb, tEnV(Math.max(sel.x0, sel.x1)));
      if (t2 - t1 > 0.01) setZoom([t1, t2]);
    } else {
      const t = tEnV(sel.x0);
      if (t >= xa && t <= Math.min(xb, tCur)) {
        const m = picA(a, t);                        // un clic près d'un pic se cale sur son sommet… sauf en co-élution
        setTSel(m && Math.abs(X(m.tr) - sel.x0) < 6 ? m.tr : t);
      }
    }
    setSel(null);
  }
  const maxEic = geo.ex.map(e => Math.max(...e, 1e-12));
  return (
    <div style={{ position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block', touchAction: 'pan-y', userSelect: 'none', cursor: 'crosshair' }} role="img" aria-label="Chromatogramme : courant ionique total en fonction du temps"
        onPointerMove={bouge} onPointerDown={debut} onPointerUp={fin} onPointerLeave={() => { setSel(null); setHover(null); }}>
        <defs><clipPath id="sm-clip"><rect x={mL} y={mT} width={iw} height={ih}/></clipPath></defs>
        <rect x={mL} y={mT} width={iw} height={ih} fill="white" stroke="#cbd5e1"/>
        {graduations.map(t => <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={mT} y2={mT + ih} stroke="#e2e8f0"/>
          <line x1={X(t)} x2={X(t)} y1={mT + ih} y2={mT + ih + 5} stroke="#475569"/>
          <text x={X(t)} y={mT + ih + 18} textAnchor="middle" fontSize="11" fill="#334155">{String(t).replace('.', ',')}</text></g>)}
        <text x={mL + iw / 2} y={h - 4} textAnchor="middle" fontSize="12" fill="#334155" fontWeight="600">temps t (min)</text>
        <text transform={`translate(11 ${mT + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="#334155">abondance (u.a.)</text>
        {p.rampe > 0 && <g>
          <path d={geo.ts.filter((_, i) => i % 4 === 0).map((t, i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)},${(mT + ih - temperature(p, t) / TaxeMax * ih).toFixed(1)}`).join('')} fill="none" stroke="#c2410c" strokeWidth="1.3" strokeDasharray="6 3" opacity="0.7"/>
          {[0, TaxeMax / 2, TaxeMax].map(q => <g key={q}><line x1={mL + iw} x2={mL + iw + 4} y1={mT + ih - q / TaxeMax * ih} y2={mT + ih - q / TaxeMax * ih} stroke="#c2410c"/>
            <text x={mL + iw + 6} y={mT + ih - q / TaxeMax * ih + 4} fontSize="10.5" fill="#c2410c">{q}</text></g>)}
          <text transform={`translate(${w - 6} ${mT + ih / 2}) rotate(90)`} textAnchor="middle" fontSize="11" fill="#c2410c">température du four (°C)</text></g>}
        {p.retard > 0 && p.retard > xa && <rect x={mL} y={mT} width={Math.min(X(p.retard), mL + iw) - mL} height={ih} fill="#e2e8f0" opacity="0.6"/>}
        <g clipPath="url(#sm-clip)">
          <path d={chemin(geo.tot)} fill="none" stroke="#0f172a" strokeWidth={1.3}/>
          {geo.ex.map((e, i) => <path key={eics[i]} d={chemin(e, normEic ? maxEic[i] * 1.15 : geo.ymax)} fill="none" stroke={COUL_EIC[i % COUL_EIC.length]} strokeWidth={1.5}/>)}
        </g>
        {etiq.filter(e => e.ok && tCur >= e.m.tr).map(e => <text key={e.m.id} x={e.x} y={e.y} textAnchor="middle" fontSize="11.5" fontWeight="700"
          fill={anonyme ? '#0f172a' : couleurs[e.m.id]} stroke="white" strokeWidth="3" paintOrder="stroke" opacity={hover && hover !== e.m.id ? 0.4 : 1}>{e.lib}</text>)}
        <line x1={X(tCur)} x2={X(tCur)} y1={mT} y2={mT + ih} stroke={ORANGE_GUIDE} strokeWidth="1.6" opacity={frac > 0 && frac < 1 && tCur >= xa && tCur <= xb ? 1 : 0}/>
        {tSel != null && tSel >= xa && tSel <= xb && <g><line x1={X(tSel)} x2={X(tSel)} y1={mT} y2={mT + ih} stroke={VIOLET} strokeWidth="1.6"/>
          <polygon points={`${X(tSel) - 5},${mT} ${X(tSel) + 5},${mT} ${X(tSel)},${mT + 7}`} fill={VIOLET}/></g>}
        {sel && Math.abs(sel.x1 - sel.x0) > 4 && <rect x={Math.min(sel.x0, sel.x1)} y={mT} width={Math.abs(sel.x1 - sel.x0)} height={ih} fill="#0ea5e9" opacity="0.15" stroke="#0284c7"/>}
      </svg>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>
        <span>Cliquez sur un pic pour afficher son spectre ; glissez pour zoomer.</span>
        {zoom && <button onClick={() => setZoom(null)} style={stylePetitBouton(false)}>↔ Vue entière</button>}
        {eics.length > 0 && <span>{eics.map((mz, i) => <span key={mz} style={{ color: COUL_EIC[i % COUL_EIC.length], fontWeight: 700, marginRight: 8 }}>— m/z {mz}</span>)}</span>}
      </div>
    </div>);
}

function Visu({ a, p, couleurs, hover, setHover, lancement, onLancer, anonyme, tSel, setTSel, eics, normEic }) {
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
      <div style={{ height: 8 }}/>
      <Chromato a={a} p={p} frac={frac} w={w} couleurs={couleurs} hover={hover} setHover={setHover} anonyme={anonyme} tSel={tSel} setTSel={setTSel} eics={eics} normEic={normEic}/>
    </div>);
}

// ---------- schéma de l'appareil ----------
const PIECES = {
  gaz: { nom: 'Gaz vecteur (hélium)', role: 'Gaz inerte qui entraîne les composés. Avec un spectromètre de masse, on utilise surtout l’hélium : la pompe à vide doit évacuer tout le gaz qui sort de la colonne, ce qui limite le débit (souvent ≤ 2 mL/min).',
    ctrl: 'Pureté du gaz, filtres à oxygène et à eau à jour : l’air et l’eau se voient directement dans le spectre de fond.' },
  injecteur: { nom: 'Injecteur split / splitless', role: 'Vaporise l’échantillon ; en split, seule une petite fraction entre dans la colonne.',
    ctrl: 'Septum et liner propres : leurs débris donnent des pics parasites bien visibles en SM (siloxanes du septum).' },
  four: { nom: 'Four et colonne', role: 'La séparation est la même qu’en CPG avec FID. La sortie de colonne est sous vide : pour un même débit, la pression en tête est plus faible et le temps mort plus court.',
    ctrl: 'Colonne « spéciale SM » (faible ressuage), température maximale respectée.' },
  ligne: { nom: 'Ligne de transfert', role: 'Tube chauffé (≈ 250 à 280 °C) qui conduit l’extrémité de la colonne jusqu’à la source d’ions, sans point froid où les composés se condenseraient.',
    ctrl: 'Température réglée au-dessus de la température finale du four ; écrou de colonne étanche (sinon entrée d’air).' },
  source: { nom: 'Source d’ions (impact électronique, 70 eV)', role: 'Un filament chauffé émet des électrons accélérés à 70 eV. En heurtant une molécule M, ils lui arrachent un électron : ion moléculaire M⁺•, qui se fragmente en ions plus petits. À 70 eV, les spectres sont reproductibles d’un appareil à l’autre : c’est ce qui permet les bibliothèques.',
    ctrl: 'Réglage automatique (autotune) avec un composé de référence ; une source encrassée perd de la sensibilité et déforme les spectres.' },
  quadripole: { nom: 'Analyseur quadripolaire', role: 'Quatre barres soumises à des tensions continues et alternatives : à chaque instant, seuls les ions d’un rapport m/z donné le traversent. En balayant les tensions, on parcourt toute la plage de m/z plusieurs fois par seconde : chaque balayage donne un spectre.',
    ctrl: 'Étalonnage des masses (autotune) ; plage de m/z adaptée aux composés recherchés.' },
  detecteur: { nom: 'Détecteur (multiplicateur d’électrons)', role: 'Chaque ion qui arrive déclenche une cascade d’électrons : le courant mesuré est proportionnel au nombre d’ions. La somme sur tous les m/z donne le courant ionique total (TIC).',
    ctrl: 'Tension du multiplicateur : elle augmente avec l’usure ; un réglage automatique la reprend.' },
  vide: { nom: 'Système de vide', role: 'Pompe primaire + pompe turbomoléculaire : vide poussé (≈ 10⁻⁵ mbar) indispensable pour que les ions parcourent l’analyseur sans heurter de molécules, et pour protéger le filament.',
    ctrl: 'Contrôle air / eau : au repos, le fond doit être dominé par l’eau (m/z 18) avec peu d’azote (28) et d’oxygène (32).' },
};
const PB = { gaz: [4, 30, 58, 124], injecteur: [66, 10, 92, 140], four: [164, 22, 196, 126], ligne: [362, 64, 60, 52], source: [424, 40, 70, 84], quadripole: [496, 40, 90, 84], detecteur: [588, 40, 56, 84], vide: [424, 128, 220, 30] };
function Appareil({ a, p, actif, setActif }) {
  const piece = (id, enfants) => (
    <g role="button" tabIndex={0} aria-label={PIECES[id].nom} aria-pressed={actif === id} style={{ cursor: 'pointer', outline: 'none' }}
      onClick={() => setActif(actif === id ? null : id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActif(actif === id ? null : id); } }}>
      {enfants}
      {actif === id && <rect x={PB[id][0]} y={PB[id][1]} width={PB[id][2]} height={PB[id][3]} rx="8" fill="none" stroke={ORANGE_GUIDE} strokeWidth="2.5" strokeDasharray="5 3"/>}
    </g>);
  const txt = { fontSize: 11, fill: '#334155', textAnchor: 'middle', fontWeight: 600 };
  const fin = { ...txt, fontWeight: 400, fontSize: 10 };
  const prog = p.rampe > 0 ? `${p.T0} → ${p.Tf} °C` : `${p.T0} °C`;
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 650 165" style={{ width: '100%', minWidth: 580, display: 'block' }} role="group" aria-label="Schéma de l’appareil de CPG/SM">
          <rect x="420" y="36" width="228" height="92" rx="10" fill="#f1f5f9" stroke="#64748b" strokeDasharray="3 3"/>
          <text x="534" y="30" style={fin}>enceinte sous vide</text>
          {piece('gaz', <g>
            <rect x="12" y="44" width="40" height="96" rx="14" fill="#e0f2fe" stroke="#475569" strokeWidth="1.5"/>
            <rect x="24" y="36" width="16" height="10" fill="#475569"/>
            <text x="32" y="96" style={txt}>He</text><text x="32" y="153" style={fin}>gaz vecteur</text></g>)}
          {piece('injecteur', <g>
            <rect x="74" y="66" width="76" height="52" rx="6" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5"/>
            <rect x="101" y="60" width="22" height="7" fill="#1e293b"/>
            <path d="M112 18 V56 M108 56 L112 62 L116 56" stroke="#475569" strokeWidth="1.8" fill="none"/>
            <rect x="108" y="10" width="8" height="12" fill="#94a3b8"/>
            <text x="112" y="134" style={txt}>Injecteur</text>
            <text x="112" y="146" style={fin}>{p.mode === 'split' ? `split 1:${p.split}` : 'splitless'}</text></g>)}
          {piece('four', <g>
            <rect x="170" y="28" width="184" height="114" rx="10" fill="#fff7ed" stroke="#c2410c" strokeWidth="1.3" strokeDasharray="5 3"/>
            <text x="262" y="44" style={txt}>Four · {prog}</text>
            {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={262} cy={88} rx={52 - i * 8} ry={28 - i * 4.4} fill="none" stroke="#475569" strokeWidth="1.5"/>)}
            <text x="262" y="136" style={fin}>Colonne {p.phase} · {p.L} m</text></g>)}
          {piece('ligne', <g>
            <rect x="368" y="84" width="50" height="12" rx="4" fill="#fdba74" stroke="#c2410c"/>
            <text x="392" y="78" style={fin}>ligne de</text><text x="392" y="110" style={fin}>transfert</text></g>)}
          {piece('source', <g>
            <rect x="430" y="56" width="58" height="56" rx="6" fill="#fef9c3" stroke="#a16207" strokeWidth="1.4"/>
            <path d="M440 66 q4 6 8 0 q4 -6 8 0 q4 6 8 0" stroke="#dc2626" strokeWidth="1.6" fill="none"/>
            <text x="459" y="90" style={txt}>Source</text><text x="459" y="103" style={fin}>EI 70 eV</text></g>)}
          {piece('quadripole', <g>
            {[66, 76, 92, 102].map(y => <rect key={y} x="502" y={y} width="78" height="6" rx="3" fill="#94a3b8" stroke="#475569"/>)}
            <text x="541" y="58" style={txt}>Quadripôle</text>
            <text x="541" y="122" style={fin}>tri selon m/z</text></g>)}
          {piece('detecteur', <g>
            <rect x="594" y="62" width="44" height="44" rx="6" fill="#dcfce7" stroke="#15803d" strokeWidth="1.4"/>
            <text x="616" y="88" style={{ ...txt, fontSize: 10 }}>EM</text>
            <text x="616" y="122" style={fin}>détecteur</text></g>)}
          {piece('vide', <g>
            <rect x="472" y="134" width="124" height="20" rx="6" fill="#e2e8f0" stroke="#475569"/>
            <text x="534" y="148" style={fin}>pompes à vide (≈ 10⁻⁵ mbar)</text>
            <path d="M534 128 V134" stroke="#475569" strokeWidth="2"/></g>)}
          <g fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinejoin="round" pointerEvents="none">
            <path d="M32 36 V20 H62 V92 H74"/><path d="M150 92 H190 Q208 92 210 88"/><path d="M314 88 Q330 90 368 90"/><path d="M418 90 H430"/>
            <path d="M488 84 H502 M580 84 H594" stroke="#a16207" strokeDasharray="3 2"/></g>
        </svg>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55, marginTop: 4, minHeight: 20 }}>
        {actif ? <><strong>{PIECES[actif].nom}</strong> — {PIECES[actif].role}<div style={{ marginTop: 3, color: KIT.txt2 }}><strong>À contrôler :</strong> {PIECES[actif].ctrl}</div></>
          : <span style={{ color: KIT.txt2 }}>Cliquez sur un élément pour voir son rôle et ce que l’on contrôle. Pression en tête : {Math.round(a.pression.debut)} kPa (sortie de colonne sous vide), temps mort {v(a.t0)} min.</span>}
      </div>
    </div>);
}

// ---------- contrôle air / eau ----------
function AirEau({ a }) {
  const c = controleAirEau(a);
  const lignes = [['18', 'eau (H₂O⁺)', c.m18], ['28', 'diazote (N₂⁺)', c.m28], ['32', 'dioxygène (O₂⁺)', c.m32], ['44', 'dioxyde de carbone', c.m44]];
  const mx = Math.max(...lignes.map(q => q[2]), 1);
  const eteint = c.m18 === 0;
  const fuite = c.m28 > 2 * c.m18;
  return (
    <div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Spectre du fond avant l’injection (m/z 18, 28, 32, 44). Un vide correct est dominé par l’eau résiduelle ; si l’azote et l’oxygène dominent dans le rapport ≈ 4 : 1 de l’air, il y a une entrée d’air.</div>
      {lignes.map(([mz, nom, x]) => <div key={mz} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 3 }}>
        <span style={{ width: 54, fontWeight: 700 }}>m/z {mz}</span>
        <span style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 12, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * x / mx}%`, background: mz === '28' || mz === '32' ? '#f97316' : '#64748b', borderRadius: 4 }}/></span>
        <span style={{ width: 150, color: KIT.txt2 }}>{nom}</span></div>)}
      <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4, color: eteint ? '#b91c1c' : fuite ? '#b45309' : '#15803d' }}>
        {eteint ? 'Aucun signal, même pas le fond.' : fuite ? `Azote et oxygène dominants (28/32 ≈ ${v(c.m28 / Math.max(c.m32, 1e-9), 1)}) : signature de l’air.` : 'Fond normal : surtout de l’eau.'}</div>
    </div>);
}

// ====================================================
//  DÉFIS
// ====================================================
const tire = tab => tab[Math.floor(Math.random() * tab.length)];
const melanger = tab => [...tab].sort(() => Math.random() - 0.5);
const PAIRES_COELUTION = [['mek', 'c6'], ['etoh', 'acn'], ['acn', 'acet'], ['aceet', 'chcl3'], ['benz', 'c7'], ['c8', 'acebu']];
let PAIRES_OK = null;
function pairesCoelution() {
  if (PAIRES_OK) return PAIRES_OK;
  PAIRES_OK = PAIRES_COELUTION.filter(pr => { const r = analyse(PARAMS_DEFAUT, pr); return r.pics.length === 2 && r.res[0].R < 1; });
  if (!PAIRES_OK.length) PAIRES_OK = [['mek', 'c6']];
  return PAIRES_OK;
}
// part d'un ion m/z qui vient du composé `cible` au sommet de son pic (sélectivité de l'ion)
function selectivite(a, mz, cible) {
  const m = a.pics.find(q => q.id === cible); if (!m) return 0;
  const sp = Object.fromEntries(SPECTRES[cible].pics), tous = a.pics.map(q => [q.id, Object.fromEntries(SPECTRES[q.id].pics)]);
  const part = id => { const q = a.pics.find(x => x.id === id), s = tous.find(x => x[0] === id)[1]; const tot = SPECTRES[id].pics.reduce((x, y) => x + y[1], 0); return q.abond * (s[mz] || 0) / tot * Math.exp(-0.5 * ((m.tr - q.tr) / q.sigma) ** 2) / q.sigma; };
  const vise = part(cible), total = a.pics.reduce((s, q) => s + part(q.id), 0);
  return sp[mz] ? vise / total : 0;
}
function nouveauDefi(type) {
  if (type === 'inconnu') {
    for (let n = 0; n < 300; n++) {
      const ids = melanger(IDS_SM).slice(0, 3);
      const r = analyse(PARAMS_DEFAUT, ids);
      if (r.pics.length === 3 && r.res.every(x => x.R >= 3)) {
        const cible = tire(ids);
        const autres = melanger(IDS_SM.filter(i => i !== cible && concordance(SPECTRES[i].pics, SPECTRES[cible].pics) < 750)).sort((x, y) => Math.abs(masseNominale(x) - masseNominale(cible)) - Math.abs(masseNominale(y) - masseNominale(cible))).slice(0, 3);
        return { type, mols: ids, cible, choix: melanger([cible, ...autres]), reps: {}, verifie: false };
      }
    }
  }
  if (type === 'coelution') return { type, mols: tire(pairesCoelution()), reps: { ions: {} }, verifie: false };
  return { type: 'panne', mols: tire([['etoh', 'acet', 'aceet', 'tol', 'pxyl'], ['meoh', 'mek', 'buoh', 'tol', 'c10'], ['ipa', 'thf', 'diox', 'ebz', 'c12']]), panne: tire(Object.keys(PANNES)), reps: {}, verifie: false };
}
const TITRES = { inconnu: 'Identifier un composé', coelution: 'Pics co-élués', panne: 'Diagnostiquer une panne' };

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationCPGSM() {
  const [mode, setMode] = useState(() => modeOuverture('cpgsm-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('cpgsm-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [p, setP] = useState({ ...PARAMS_DEFAUT });
  const maj = (k, x) => setP(q => ({ ...q, [k]: x }));
  const [selected, setSelected] = useState(['etoh', 'acet', 'aceet', 'tol', 'pxyl']);
  const [ouv, setOuv] = useState({ melange: false, tableau: true, hypo: false, pannes: false, reglages: false });
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const [hover, setHover] = useState(null);
  const [lancement, setLancement] = useState(0);
  const [piece, setPiece] = useState(null);
  const [tSel, setTSel] = useState(null);
  const [soustraire, setSoustraire] = useState(false);
  const [hit, setHit] = useState(null);
  const [eics, setEics] = useState([]);
  const [normEic, setNormEic] = useState(false);
  const [mzSaisi, setMzSaisi] = useState('');
  const injecter = () => setLancement(n => n + 1);
  const choisirT = t => { setTSel(t); setHit(null); };

  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const ids = enDefi ? defi.mols : selected;
  const pEff = enDefi ? { ...PARAMS_DEFAUT, panne: defi.type === 'panne' ? defi.panne : null } : p;
  const a = analyseMemo(pEff, ids);
  const couleurs = {}; ids.forEach((id, i) => { couleurs[id] = PALETTE[i % PALETTE.length]; });
  const nbPics = a.pics.length;
  const anonyme = enDefi && (defi.type === 'inconnu' || defi.type === 'coelution') && !defi.solution && !(defi.verifie && evaluer(defi).ok);
  const bibliOff = enDefi && defi.type === 'inconnu' && !defi.solution;
  const tFond = tSel != null && soustraire ? tempsFond(a, tSel) : null;
  const sp = tSel != null ? spectreA(a, tSel, tFond) : [];
  const hits = bibliOff ? [] : rechercheBibliotheque(sp, pEff.mzMin, pEff.mzMax, 5);
  const picSel = tSel != null ? picA(a, tSel) : null;
  const toggleMol = id => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const ajouterEic = mz => { const n = Math.round(mz); if (n >= 10 && n <= 400 && !eics.includes(n)) setEics(l => [...l, n].slice(-5)); };

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const memeMelange = l => selected.length === l.length && l.every(i => selected.includes(i));
  const mettre = (l, extra = {}) => { setSelected(l); setP({ ...PARAMS_DEFAUT, ...extra }); setTSel(null); setHit(null); setEics([]); setSoustraire(false); injecter(); };
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, VERT), margin: '6px 0' }}>{label}</button>;
  const CINQ = ['etoh', 'acet', 'aceet', 'tol', 'pxyl'], CHLORES = ['dcm', 'chcl3', 'tol'], ISOMERES = ['ebz', 'pxyl', 'tol'], COELU = ['mek', 'c6', 'tol'], ALCOOLS = ['meoh', 'etoh', 'nproh', 'tol'];
  const ETAPES = [
    { id: 'appareil', titre: 'Un détecteur qui donne un spectre', focus: ['appareil'],
      texte: <>La séparation est celle de la CPG ; à la sortie de la colonne, la <strong>ligne de transfert</strong> conduit les composés dans le <strong>spectromètre de masse</strong>, sous vide : la <strong>source</strong> (électrons de 70 eV) ionise et fragmente les molécules, le <strong>quadripôle</strong> trie les ions selon leur rapport m/z, le <strong>détecteur</strong> les compte. Cliquez sur chaque élément du schéma.</>,
      tache: { type: 'qcm', q: 'Dans quel ordre les molécules sortant de la colonne traversent-elles le spectromètre ?', options: ['source d’ions → quadripôle → détecteur', 'quadripôle → source d’ions → détecteur', 'détecteur → quadripôle → source d’ions'], bonne: 0,
        expl: 'Il faut d’abord former des ions (source), puis les trier selon m/z (analyseur quadripolaire), puis les compter (multiplicateur d’électrons). Le tout sous vide.' } },
    { id: 'tic', titre: 'Le courant ionique total (TIC)', focus: ['viz'],
      texte: <>On injecte cinq solvants. Le chromatogramme affiché est le <strong>TIC</strong> : à chaque instant, la somme de tous les ions détectés. Il ressemble au chromatogramme d’une CPG classique, mais chaque point contient en plus un <strong>spectre de masse</strong> complet.</>,
      tache: { type: 'action', ok: lancement > 0 && memeMelange(CINQ), label: '▶ Mettre le mélange et injecter', faire: () => mettre(CINQ), consigne: 'Regardez le TIC se tracer.' } },
    { id: 'spectre', titre: 'Le spectre d’un pic', focus: ['viz', 'spectre'],
      texte: <>Cliquez sur le pic du <strong>toluène</strong> : le spectre de masse correspondant s’affiche sous le chromatogramme (barres : intensité relative de chaque ion, le plus intense valant 100 %).</>,
      tache: { type: 'action', ok: memeMelange(CINQ) && picSel?.id === 'tol', label: null, consigne: picSel ? `Pic sélectionné : ${picSel.nom}` : 'Cliquez sur un pic du chromatogramme.' } },
    { id: 'ions', titre: 'Ion moléculaire et pic de base', focus: ['spectre'],
      texte: <>L’<strong>ion moléculaire</strong> M⁺• a pour m/z la masse molaire de la molécule (toluène C₇H₈ : 92 g/mol). Le <strong>pic de base</strong> est le plus intense (100 %) : pour le toluène, c’est l’ion C₇H₇⁺ (perte d’un atome H), très stable.</>,
      tache: { type: 'qcm', q: 'Dans le spectre du toluène, quels sont l’ion moléculaire et le pic de base ?', options: ['M⁺• à m/z 92 ; pic de base à m/z 91', 'M⁺• à m/z 91 ; pic de base à m/z 92', 'M⁺• à m/z 65 ; pic de base à m/z 91'], bonne: 0,
        expl: 'm/z 92 = masse molaire du toluène : c’est l’ion moléculaire. m/z 91 (C₇H₇⁺, ion tropylium) est le plus abondant : c’est le pic de base. On retrouve m/z 91 dans le spectre de tous les alkylbenzènes.' } },
    { id: 'biblio', titre: 'La recherche en bibliothèque', focus: ['spectre'],
      texte: <>Le logiciel compare le spectre à ceux d’une bibliothèque et donne un <strong>facteur de concordance</strong> (sur 999). Cliquez sur la première proposition pour superposer les deux spectres « tête-bêche ».</>,
      tache: { type: 'qcm', q: 'Un spectre obtient 950 avec le toluène, 460 avec l’éthylbenzène. Que conclure ?', options: ['c’est très probablement du toluène, à confirmer par le temps de rétention d’un étalon', 'c’est certainement du toluène, aucune vérification n’est utile', 'le facteur est trop bas, ce n’est pas du toluène'], bonne: 0,
        expl: 'Au-dessus de ≈ 900, la concordance est excellente ; mais certains composés ont des spectres presque identiques. L’identification est solide quand le spectre ET le temps de rétention (étalon, même méthode) concordent.' } },
    { id: 'chlore', titre: 'Les isotopes du chlore', focus: ['spectre', 'viz'],
      texte: <>{bouton('Mettre dichlorométhane, chloroforme et toluène', () => mettre(CHLORES))} Le chlore existe sous deux isotopes : ³⁵Cl (≈ 76 %) et ³⁷Cl (≈ 24 %). Cliquez sur le pic du dichlorométhane (CH₂Cl₂) et regardez les ions vers m/z 84, 86 et 88.</>,
      tache: { type: 'qcm', q: 'Pourquoi trouve-t-on trois ions à m/z 84, 86 et 88 dans le spectre de CH₂Cl₂ ?', options: ['ce sont les ions moléculaires avec ³⁵Cl₂, ³⁵Cl³⁷Cl et ³⁷Cl₂', 'ce sont trois fragments différents de la molécule', 'ce sont des impuretés de la colonne'], bonne: 0,
        expl: 'Avec deux atomes de chlore, l’ion moléculaire existe en trois versions, espacées de 2 unités, d’intensités ≈ 9 : 6 : 1 (100 : 64 : 10). Ce motif signe la présence de deux chlores ; avec un seul chlore, on aurait deux ions séparés de 2 dans le rapport ≈ 3 : 1.' } },
    { id: 'isomeres', titre: 'Des isomères au spectre presque identique', focus: ['spectre', 'viz'],
      texte: <>{bouton('Mettre éthylbenzène, p-xylène et toluène', () => mettre(ISOMERES))} L’éthylbenzène et le p-xylène sont deux isomères C₈H₁₀ (M = 106). Comparez leurs spectres et les propositions de la bibliothèque.</>,
      tache: { type: 'qcm', q: 'Comment distinguer sûrement l’éthylbenzène du p-xylène ?', options: ['par leur temps de rétention (étalons injectés dans les mêmes conditions)', 'par leur ion moléculaire', 'par leur pic de base'], bonne: 0,
        expl: `Les deux ont M⁺• = 106 et un pic de base à 91 ; leurs spectres concordent à ${concordance(SPECTRES.ebz.pics, SPECTRES.pxyl.pics)}/999. Seule la séparation chromatographique (t_R) les distingue sûrement : la CPG et la SM sont complémentaires.` } },
    { id: 'coelution', titre: 'Deux composés qui sortent ensemble', focus: ['viz', 'spectre', 'eic'],
      texte: <>{bouton('Mettre butanone, hexane et toluène', () => mettre(COELU))} Sur cette colonne, la butanone et l’hexane sortent presque en même temps : un seul pic, un spectre mélangé, une bibliothèque hésitante. Extrayez les ions <strong>m/z 72</strong> (ion moléculaire de la butanone) et <strong>m/z 86</strong> (ion moléculaire de l’hexane) dans « Ions extraits ».</>,
      tache: { type: 'action', ok: memeMelange(COELU) && eics.includes(72) && eics.includes(86), label: 'Extraire m/z 72 et 86', faire: () => setEics([72, 86]),
        consigne: 'Cochez « chaque ion à sa propre échelle » et zoomez : les deux courbes ont leur maximum à des instants légèrement différents.' } },
    { id: 'plage', titre: 'La plage de m/z balayée', focus: ['reglages', 'viz'],
      texte: <>{bouton('Mettre méthanol, éthanol, propan-1-ol et toluène', () => mettre(ALCOOLS))} On évite souvent de balayer en dessous de m/z 29 ou 35, pour ne pas enregistrer l’air et l’eau. Passez le début de la plage à m/z 35 et injectez à nouveau.</>,
      tache: { type: 'qcm', q: 'Avec une plage commençant à m/z 35, le pic du méthanol a presque disparu. Pourquoi ?', options: ['ses ions principaux (m/z 29, 31, 32) sont en dehors de la plage balayée', 'le méthanol ne sort plus de la colonne', 'le méthanol n’est pas ionisé à 70 eV'], bonne: 0,
        expl: 'Le méthanol (M = 32) ne donne que des ions légers. La plage de m/z doit couvrir les ions caractéristiques des composés recherchés, tout en excluant le fond (eau 18, azote 28, oxygène 32).' } },
    { id: 'air', titre: 'Panne n° 1 : le fond est très élevé', focus: ['aireau', 'viz'],
      texte: <>{bouton('Charger la situation', () => mettre(CINQ, { panne: 'air' }))} Regardez le contrôle air / eau et le spectre du fond (cliquez entre deux pics).</>,
      tache: { type: 'qcm', q: 'm/z 28 et 32 dominent, dans un rapport voisin de 4. Cause la plus probable ?', options: [PANNES.air.nom, PANNES.filament.nom, PANNES.ressuage.nom], bonne: 0,
        expl: `N₂⁺ (28) et O₂⁺ (32) dans le rapport de l’air : de l’air entre dans le vide. Geste : ${PANNES.air.geste}` } },
    { id: 'ressuage', titre: 'Panne n° 2 : des ions qui montent avec la température', focus: ['viz', 'spectre'],
      texte: <>{bouton('Charger la situation', () => mettre(CINQ, { panne: 'ressuage', Tf: 280 }))} Le four monte jusqu’à 280 °C. Cliquez en fin de chromatogramme, là où le fond monte, et lisez le spectre.</>,
      tache: { type: 'qcm', q: 'Le fond qui monte en fin de programme contient surtout m/z 207, 281 et 73. Cause la plus probable ?', options: [PANNES.ressuage.nom, PANNES.air.nom, PANNES.source.nom], bonne: 0,
        expl: `Les ions 73, 207 et 281 viennent de siloxanes cycliques : la phase stationnaire (polydiméthylsiloxane) se dégrade à haute température. Geste : ${PANNES.ressuage.geste}` } },
    { id: 'fin', titre: 'À retenir', focus: [],
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>CPG/SM = séparation (t<Ind>R</Ind>) + spectre de masse de chaque pic.</li>
        <li><strong>TIC</strong> : somme de tous les ions ; <strong>ion extrait</strong> : un seul m/z, pour suivre un composé même s’il co-élue.</li>
        <li><strong>Ion moléculaire</strong> M⁺• (m/z = masse molaire) ; <strong>pic de base</strong> = ion le plus intense. Motifs isotopiques : deux chlores → 9 : 6 : 1.</li>
        <li>Bibliothèque : facteur de concordance élevé = identification probable, à confirmer par le t<Ind>R</Ind> d’un étalon (les isomères ont des spectres voisins).</li>
        <li>Contrôle air / eau : 28 et 32 dans le rapport 4 → fuite d’air. Fond 73 / 207 / 281 à haute température → ressuage.</li></ul></ARetenir>,
      tache: null },
  ];
  const cadre = id => enGuide && (ETAPES[Math.min(etape, ETAPES.length - 1)].focus || []).includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  function lancer(type) { const d = nouveauDefi(type); setDefi(d); setP({ ...PARAMS_DEFAUT }); setTSel(null); setHit(null); setEics([]); setSoustraire(false); setHover(null); injecter(); }
  function changerMode(md) { setMode(md); setTSel(null); setHit(null); if (md === 'defi') lancer(defi ? defi.type : 'inconnu'); else setP(q => (q.panne ? { ...q, panne: null } : q)); }
  function evaluer(d) {
    if (d.type === 'inconnu') { const ok = d.reps.choix === d.cible; return { ok, ligne: ok ? `Oui : ${PAR_ID[d.cible].nom} (M⁺• = ${ionMoleculaire(d.cible).mz}, pic de base ${picBase(d.cible)}).` : d.reps.choix ? 'Pas encore : regardez l’ion moléculaire (m/z le plus élevé, s’il est présent), le pic de base et les fragments caractéristiques.' : 'Choisissez d’abord un composé.' }; }
    if (d.type === 'coelution') {
      const res = d.mols.map(id => ({ id, mz: d.reps.ions[id], s: d.reps.ions[id] ? selectivite(a, d.reps.ions[id], id) : 0 }));
      const ok = res.every(r => r.s >= 0.9);
      return { ok, ligne: ok ? 'Chaque ion choisi provient à plus de 90 % d’un seul composé : leurs chromatogrammes d’ions extraits les séparent.' : 'Il faut, pour chaque composé, un ion qui ne vienne (presque) que de lui : cherchez dans les spectres de référence un ion intense chez l’un et absent chez l’autre. ' + res.map(r => r.mz ? `m/z ${r.mz} : ${Math.round(100 * r.s)} % de ${PAR_ID[r.id].nom}` : '').filter(Boolean).join(' ; ') };
    }
    const ok = d.reps.cause === d.panne;
    return { ok, ligne: ok ? `Bien vu : ${PANNES[d.panne].nom}. Geste : ${PANNES[d.panne].geste}` : d.reps.cause ? 'Ce n’est pas la bonne cause : comparez le contrôle air / eau, la taille des pics et le spectre du fond (début et fin de programme).' : 'Choisissez d’abord une cause.' };
  }
  const res = enDefi && defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${enDefi ? defi.type : 'inconnu'}`, reussi);
  const prog = lireProgression();
  const rep = (k, x) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: x }, verifie: false }));
  const txtD = { fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const ionsDispo = enDefi && defi.type === 'coelution' ? [...new Set(defi.mols.flatMap(id => SPECTRES[id].pics.filter(q => q[1] >= 5 && q[0] >= PARAMS_DEFAUT.mzMin).map(q => q[0])))].sort((x, y) => x - y) : [];
  const lettreCible = enDefi && defi.type === 'inconnu' ? LETTRES[a.pics.findIndex(m => m.id === defi.cible)] : null;
  const voletDefi = enDefi && (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => lancer(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'inconnu' && <>
        <div style={txtD}>🎯 Cliquez sur le pic <strong>{lettreCible}</strong> et lisez son spectre (la bibliothèque est désactivée). De quel composé s’agit-il ?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {defi.choix.map(id => <button key={id} onClick={() => rep('choix', id)} style={stylePetitBouton(defi.reps.choix === id, '#0ea5e9')}>{PAR_ID[id].nom} <span style={{ opacity: 0.75, fontWeight: 400 }}>M = {masseNominale(id)} g/mol</span></button>)}</div></>}
      {defi.type === 'coelution' && <>
        <div style={txtD}>🎯 Deux composés co-éluent : <strong>{defi.mols.map(i => PAR_ID[i].nom).join(' et ')}</strong>. Pour chacun, choisissez un ion à extraire qui ne vienne (presque) que de lui. Les spectres de référence sont ci-dessous ; vérifiez avec « Ions extraits ».</div>
        <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 8 }}>
          {defi.mols.map(id => <div key={id}>
            <SpectreAuto pk={SPECTRES[id].pics} titre={`Référence : ${PAR_ID[id].nom}`} mzMin={PARAMS_DEFAUT.mzMin} mzMax={PARAMS_DEFAUT.mzMax}/>
            <label style={{ fontSize: 13.5, fontWeight: 700 }}>Ion pour {PAR_ID[id].nom} : <select value={defi.reps.ions[id] ?? ''} onChange={e => setDefi(d => ({ ...d, reps: { ions: { ...d.reps.ions, [id]: +e.target.value || undefined } }, verifie: false }))}
              style={{ fontSize: 14, padding: '2px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}><option value="">?</option>{ionsDispo.map(mz => <option key={mz} value={mz}>m/z {mz}</option>)}</select></label></div>)}
        </div></>}
      {defi.type === 'panne' && <>
        <div style={txtD}>🎯 Une analyse de routine (mélange {ids.map(i => PAR_ID[i].nom).join(', ')}) donne ce résultat. Observez le TIC, le contrôle air / eau et les spectres (pics et fond), puis choisissez la <strong>cause la plus probable</strong>.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(PANNES).map(([k, q]) => <button key={k} onClick={() => rep('cause', k)} style={stylePetitBouton(defi.reps.cause === k, '#0ea5e9')}>{q.nom}</button>)}</div></>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => lancer(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14, color: res.ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{res.ok ? '✅' : '❌'} {res.ligne}{res.ok && <div style={{ fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'inconnu' && <>Pic {lettreCible} : <strong>{PAR_ID[defi.cible].nom}</strong> — ion moléculaire m/z {ionMoleculaire(defi.cible).mz} ({v(ionMoleculaire(defi.cible).rel, 0)} %), pic de base m/z {picBase(defi.cible)}.</>}
        {defi.type === 'coelution' && <>{defi.mols.map(id => { const inten = mz => (SPECTRES[id].pics.find(q => q[0] === mz) || [0, 0])[1]; const cand = ionsDispo.map(mz => [mz, selectivite(a, mz, id)]); const bons = cand.filter(q => q[1] >= 0.9).sort((x, y) => inten(y[0]) - inten(x[0])); const best = bons[0] || cand.sort((x, y) => y[1] - x[1])[0]; return <div key={id}>{PAR_ID[id].nom} : m/z {best[0]} ({Math.round(100 * best[1])} % de cet ion vient de lui).</div>; })}</>}
        {defi.type === 'panne' && <><strong>{PANNES[defi.panne].nom}</strong> — {PANNES[defi.panne].symptome}. Geste : {PANNES[defi.panne].geste}</>}</div>}
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const ionM = picSel ? ionMoleculaire(picSel.id) : null;
  const spectreBloc = (
    <div style={{ ...styleBoite, background: 'white', ...cadre('spectre') }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt }}>Spectre de masse {tSel != null ? `à t = ${v(tSel, 3)} min` : ''}</div>
        <label style={{ fontSize: 13, color: KIT.txt2, cursor: 'pointer' }}><input type="checkbox" checked={soustraire} onChange={e => setSoustraire(e.target.checked)}/> soustraire le fond (pris juste avant le pic)</label>
      </div>
      {tSel == null ? <div style={{ fontSize: 13.5, color: KIT.txt2, padding: '1rem 0' }}>Cliquez sur un pic du chromatogramme (ou entre deux pics, pour voir le fond).</div>
        : !sp.length ? <div style={{ fontSize: 13.5, color: KIT.txt2, padding: '1rem 0' }}>Aucun ion détecté à cet instant.</div>
        : <>
          <SpectreAuto pk={sp} refPk={hit ? SPECTRES[hit].pics.filter(q => q[0] >= pEff.mzMin && q[0] <= pEff.mzMax) : null} titre="Spectre enregistré" refTitre={hit ? `Bibliothèque : ${PAR_ID[hit].nom}` : null}
            mzMin={pEff.mzMin} mzMax={pEff.mzMax} marque={!anonyme && ionM && sp.some(q => q[0] === ionM.mz) ? ionM.mz : null}/>
          <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Pic de base : m/z {sp.reduce((b, q) => q[1] > b[1] ? q : b)[0]} · ion le plus lourd (≥ 1 %) : m/z {Math.max(...sp.filter(q => q[1] >= 1).map(q => q[0]))}
            {!anonyme && ionM && picSel && <> · {picSel.nom} : M = {ionM.mz}{ionM.rel >= 1 ? ` (ion moléculaire à ${v(ionM.rel, 0)} %, en orange)` : ' (ion moléculaire absent ou très faible)'}</>}</div>
          {!bibliOff ? <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Recherche en bibliothèque (facteur de concordance /999) — cliquez pour comparer :</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {hits.map(h => <button key={h.id} onClick={() => setHit(hit === h.id ? null : h.id)} style={{ ...stylePetitBouton(hit === h.id, h.mf >= 900 ? '#15803d' : h.mf >= 700 ? '#b45309' : '#64748b') }}>
                {PAR_ID[h.id].nom} <strong>{h.mf}</strong></button>)}</div>
            <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>≥ 900 : excellente concordance · 700 à 900 : bonne, à vérifier · &lt; 700 : douteuse. La bibliothèque ne contient ici que les {IDS_SM.length} composés de la simulation.</div>
          </div> : <div style={{ fontSize: 13, color: '#b45309', marginTop: 6 }}>Bibliothèque désactivée pour ce défi.</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8, fontSize: 13, color: KIT.txt2 }}>Extraire un ion :
            {[...sp].sort((x, y) => y[1] - x[1]).slice(0, 4).map(q => <button key={q[0]} onClick={() => ajouterEic(q[0])} style={stylePetitBouton(eics.includes(q[0]), '#475569')}>m/z {q[0]}</button>)}</div>
        </>}
    </div>);

  const eicBloc = (
    <div style={{ ...styleBoite, ...cadre('eic') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Ions extraits (EIC)</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Un chromatogramme d’ion extrait ne trace que l’abondance d’un seul m/z : il suit un composé même s’il co-élue avec un autre.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={mzSaisi} onChange={e => setMzSaisi(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { ajouterEic(+mzSaisi); setMzSaisi(''); } }} placeholder="m/z" aria-label="m/z à extraire"
          style={{ width: 70, fontSize: 14, padding: '4px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/>
        <button onClick={() => { ajouterEic(+mzSaisi); setMzSaisi(''); }} style={styleBouton(true, '#475569')}>+ Extraire</button>
        {eics.map((mz, i) => <span key={mz} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '3px 8px', borderRadius: 14, border: `2px solid ${COUL_EIC[i % COUL_EIC.length]}`, color: COUL_EIC[i % COUL_EIC.length], fontWeight: 700 }}>
          m/z {mz}<button onClick={() => setEics(l => l.filter(x => x !== mz))} aria-label={`Retirer m/z ${mz}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 15, padding: 0 }}>×</button></span>)}
        {eics.length > 0 && <label style={{ fontSize: 13, color: KIT.txt2, cursor: 'pointer' }}><input type="checkbox" checked={normEic} onChange={e => setNormEic(e.target.checked)}/> chaque ion à sa propre échelle</label>}
      </div>
    </div>);

  const melange = !enDefi && (
    <div style={{ ...styleBoite, ...cadre('melange') }}>
      <Section titre={`Échantillon : ${selected.length ? selected.map(i => PAR_ID[i].nom).join(', ') : 'aucun composé'}`} ouvert={ouv.melange} onBascule={() => bascule('melange')}>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Composés dilués dans un solvant non représenté (en pratique, un « retard solvant » éteint le filament pendant son passage). La masse molaire est indiquée.</div>
        {FAMILLES.map(f => <div key={f} style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: KIT.txt2, width: 76 }}>{NOM_FAM[f]}</span>
          {COMPOSES_SM.filter(c => c.famille === f).map(c => <button key={c.id} onClick={() => toggleMol(c.id)} aria-pressed={selected.includes(c.id)}
            style={{ ...stylePetitBouton(selected.includes(c.id), VERT), borderRadius: 16, fontWeight: selected.includes(c.id) ? 700 : 500 }}>
            {c.nom} <span style={{ opacity: 0.7, fontSize: 11, fontWeight: 400 }}>M {masseNominale(c.id)}</span></button>)}
        </div>)}
      </Section>
    </div>);

  const reglages = !enDefi && (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <Curseur nom="Début de la plage balayée" valeur={p.mzMin} onChange={x => maj('mzMin', Math.min(x, p.mzMax - 10))} min={10} max={100} pas={1} unite="m/z" couleur={VIOLET}/>
        <Curseur nom="Fin de la plage balayée" valeur={p.mzMax} onChange={x => maj('mzMax', Math.max(x, p.mzMin + 10))} min={60} max={400} pas={10} unite="m/z" couleur={VIOLET}/>
        <Curseur nom="Retard solvant" valeur={p.retard} onChange={x => maj('retard', x)} min={0} max={5} pas={0.1} unite="min" decimales={1} couleur={VIOLET}/>
      </div>
      <button onClick={() => bascule('reglages')} aria-expanded={ouv.reglages} style={{ ...stylePetitBouton(false), marginTop: 4 }}>{ouv.reglages ? '▲' : '▼'} Colonne, four, injecteur</button>
      {ouv.reglages && <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: KIT.txt2 }}>Colonne :
          <button onClick={() => maj('phase', 'apolaire')} style={stylePetitBouton(p.phase === 'apolaire', VERT)}>apolaire (5 % phényl)</button>
          <button onClick={() => maj('phase', 'polaire')} style={stylePetitBouton(p.phase === 'polaire', '#7c3aed')}>polaire (PEG)</button>
          Four : <button onClick={() => maj('rampe', 0)} style={stylePetitBouton(!(p.rampe > 0), '#c2410c')}>isotherme</button>
          <button onClick={() => maj('rampe', p.rampe > 0 ? p.rampe : 10)} style={stylePetitBouton(p.rampe > 0, '#c2410c')}>programmation</button>
          Injecteur : <button onClick={() => maj('mode', 'split')} style={stylePetitBouton(p.mode === 'split', '#0369a1')}>split</button>
          <button onClick={() => maj('mode', 'splitless')} style={stylePetitBouton(p.mode === 'splitless', '#0369a1')}>splitless</button></div>
        <div style={{ display: 'grid', gap: '2px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          <Curseur nom={p.rampe > 0 ? 'Température initiale' : 'Température du four'} valeur={p.T0} onChange={x => maj('T0', x)} min={30} max={PHASES[p.phase].tmax} pas={5} unite="°C" couleur="#c2410c"/>
          {p.rampe > 0 && <Curseur nom="Vitesse de chauffe" valeur={p.rampe} onChange={x => maj('rampe', x)} min={1} max={40} pas={1} unite="°C/min" couleur="#c2410c"/>}
          {p.rampe > 0 && <Curseur nom="Température finale" valeur={p.Tf} onChange={x => maj('Tf', Math.max(x, p.T0))} min={50} max={PHASES[p.phase].tmax + 25} pas={5} unite="°C" couleur="#c2410c"/>}
          <Curseur nom="Débit d’hélium" valeur={p.debit} onChange={x => maj('debit', x)} min={0.3} max={3} pas={0.1} unite="mL/min" decimales={1} couleur={VERT}/>
          {p.mode === 'split' && <Curseur nom="Rapport de division 1:" valeur={p.split} onChange={x => maj('split', x)} min={5} max={500} pas={5} unite="" couleur="#0369a1"/>}
        </div></div>}
    </div>);

  const appareil = (
    <div style={{ ...styleBoite, background: 'white', ...cadre('appareil') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>L’appareil</div>
      <Appareil a={a} p={pEff} actif={piece} setActif={setPiece}/>
    </div>);
  const aireau = (
    <div style={{ ...styleBoite, ...cadre('aireau') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Contrôle air / eau</div>
      <AirEau a={a}/>
    </div>);
  const defauts = mode === 'explore' && (
    <div style={styleBoite}>
      <Section titre={`Simuler un défaut${p.panne ? ` : ${PANNES[p.panne].nom}` : ''}`} ouvert={ouv.pannes} onBascule={() => bascule('pannes')}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <button onClick={() => maj('panne', null)} style={stylePetitBouton(!p.panne, '#16a34a')}>Aucun défaut</button>
          {Object.entries(PANNES).map(([k, q]) => <button key={k} onClick={() => { maj('panne', k); injecter(); }} style={stylePetitBouton(p.panne === k, '#c2410c')}>{q.nom}</button>)}</div>
        {p.panne && <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}><strong>Symptômes :</strong> {PANNES[p.panne].symptome}.<br/><strong>Geste :</strong> {PANNES[p.panne].geste}</div>}
      </Section>
    </div>);

  const resultats = nbPics === 0 || anonyme ? null : (
    <div style={styleBoite}>
      <Section titre={`Pics : ${nbPics}`} ouvert={ouv.tableau} onBascule={() => bascule('tableau')}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
            <thead><tr style={{ background: '#eef2f6' }}>
              {['Composé', <>{TR} (min)</>, 'M (g/mol)', 'Ion moléculaire', 'Pic de base', 'Concordance'].map((h, i) =>
                <th key={i} style={{ padding: '5px 8px', borderBottom: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 12.5 }}>{h}</th>)}</tr></thead>
            <tbody>{a.pics.map(m => {
              const s = spectreA(a, m.tr), best = rechercheBibliotheque(s, pEff.mzMin, pEff.mzMax, 1)[0], im = ionMoleculaire(m.id);
              return <tr key={m.id} onClick={() => choisirT(m.tr)} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)} style={{ background: hover === m.id ? '#fff7ed' : picSel?.id === m.id ? '#f5f3ff' : 'transparent', cursor: 'pointer' }}>
                <td style={{ padding: '4px 8px', fontWeight: 700 }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: couleurs[m.id], marginRight: 6 }}/>{m.nom}</td>
                <td style={{ padding: '4px 8px', fontWeight: 700 }}>{v(m.tr, 3)}</td>
                <td style={{ padding: '4px 8px' }}>{masseNominale(m.id)}</td>
                <td style={{ padding: '4px 8px' }}>{im.rel >= 1 ? `m/z ${im.mz} (${v(im.rel, 0)} %)` : `m/z ${im.mz} : absent`}</td>
                <td style={{ padding: '4px 8px' }}>m/z {picBase(m.id)}</td>
                <td style={{ padding: '4px 8px', color: best && best.id === m.id ? '#15803d' : '#b45309' }}>{best ? `${PAR_ID[best.id].nom} ${best.mf}` : '—'}</td>
              </tr>; })}</tbody>
          </table></div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Concordance : meilleure proposition de la bibliothèque pour le spectre au sommet du pic (en orange si ce n’est pas le bon composé : co-élution ou spectres voisins).</div>
      </Section>
    </div>);

  const visuel = (
    <div style={{ ...styleBoite, background: 'white', ...cadre('viz') }}>
      {a.nonElues.length > 0 && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>⚠ {a.nonElues.map(m => m.nom).join(', ')} : ne sort pas de la colonne en moins de 200 min.</div>}
      {a.pics.some(m => m.tr < pEff.retard) && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>⚠ Retard solvant trop long : {a.pics.filter(m => m.tr < pEff.retard).map(m => m.nom).join(', ')} sort pendant que le filament est éteint et n’est pas enregistré.</div>}
      {nbPics === 0 ? <div style={{ padding: '2rem', textAlign: 'center', fontSize: 14, color: KIT.txt2 }}>Choisissez au moins un composé.</div>
        : <Visu a={a} p={pEff} couleurs={couleurs} hover={hover} setHover={setHover} lancement={lancement} onLancer={injecter} anonyme={anonyme} tSel={tSel} setTSel={choisirT} eics={eics} normEic={normEic}/>}
    </div>);

  const hypotheses = (
    <div style={styleBoite}>
      <Section titre="Hypothèses et limites du modèle" ouvert={ouv.hypo} onBascule={() => bascule('hypo')}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
          <li><strong>Séparation</strong> : celle de la simulation CPG (indices de Kováts publiés), avec une sortie de colonne sous vide (écoulement compressible vérifié sur des données Agilent).</li>
          <li><strong>Spectres</strong> : spectres réels d’impact électronique à 70 eV de la base MassBank (Faculté d’ingénierie de l’Université de Tokyo, licence CC BY-NC-SA ; numéros d’enregistrement dans le code). Ils ont été mesurés sur des spectromètres à secteur magnétique : un quadripôle donne des spectres très voisins, avec parfois des rapports d’intensité un peu différents. DMF et o-xylène, sans spectre fiable dans ce fonds, ne sont pas proposés.</li>
          <li><strong>Signal</strong> : chaque composé contribue à chaque ion selon son spectre, proportionnellement à la quantité qui sort de la colonne (réponse supposée proportionnelle à la masse, à ± 50 % selon les composés en réalité). Spectre constant sur toute la largeur du pic : le balayage du quadripôle (quelques spectres par seconde) n’est pas simulé.</li>
          <li><strong>Bibliothèque</strong> : les {IDS_SM.length} spectres de la simulation seulement (une vraie bibliothèque en contient des centaines de milliers) ; facteur de concordance calculé par produit scalaire pondéré (m/z × √intensité), sur la plage balayée.</li>
          <li><strong>Fond et pannes</strong> : eau et air résiduels, ressuage (siloxanes 73, 207, 281 ; ions du PEG 45, 89, 133), discrimination des ions lourds pour une source encrassée : effets simples, pour montrer le sens des écarts.</li>
        </ul>
      </Section>
    </div>);
  const aEssayer = (
    <div style={{ ...styleBoite, background: '#f0fdfa' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Comparez les spectres des n-alcanes : la série 43, 57, 71, 85 (CₙH₂ₙ₊₁⁺), ion moléculaire de plus en plus faible.</li>
        <li>Alcools : ion m/z 31 (CH₂=OH⁺) pour les alcools primaires, 45 pour le propan-2-ol ; ion moléculaire très faible.</li>
        <li>Chloroforme : motif isotopique 83 / 85 / 87 de l’ion CHCl₂⁺ (perte d’un chlore).</li>
        <li>Acétates : m/z 43 (CH₃CO⁺) et 61 ; cétones méthylées : m/z 43, et m/z 58 pour la MIBK (réarrangement de McLafferty).</li>
        <li>Passez sur la colonne polaire : les co-élutions changent, les spectres non.</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>TIC : tous les ions ; EIC : un ion, pour suivre un composé.</li>
        <li>M⁺• → masse molaire ; pic de base ; motifs isotopiques (Cl, Br).</li>
        <li>Spectre + t<Ind>R</Ind> d’un étalon : identification solide.</li>
      </ul>
    </ARetenir>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button></span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sm-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .sm-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .sm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>CPG couplée à la spectrométrie de masse (CPG/SM)</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Ionisation électronique à 70 eV, analyseur quadripolaire. Spectres de masse réels (MassBank) de {IDS_SM.length} solvants courants ; séparation calculée comme dans la simulation CPG.</div>
      <div className={`sm-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div className="sm-col">
          {voletDefi}
          {appareil}
          {reglages}
          {visuel}
          {spectreBloc}
          {eicBloc}
          {(pEff.panne || enGuide || mode === 'explore') && aireau}
          {defauts}
          {melange}
          {resultats}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? hypotheses : null}
      </div>
      {!enDefi && <div style={{ marginBottom: 12 }}>{hypotheses}</div>}
      {mode === 'explore' && <div className="sm-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}

// spectre à la largeur de son conteneur
function SpectreAuto(props) {
  const ref = useRef(null);
  const w = useLargeur(ref);
  return <div ref={ref}><Spectre {...props} w={w}/></div>;
}
