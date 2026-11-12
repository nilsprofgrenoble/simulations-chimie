import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef, useMemo, useDeferredValue } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./ondesModele";

const SIM_ID = 84;
declarerDefis(SIM_ID, [['fentes', 'Quelle est la distance entre les deux fentes ?'], ['pas', 'Quel est le pas du réseau ?'], ['raie', 'Quelle est la longueur d’onde de la raie ?']]);

// ====================================================
//  SIM 84 — INTERFÉRENCES À DEUX ONDES ET RÉSEAUX : cuve à deux vibreurs (retard, franges), fentes de Young (interfrange), réseau (formule des réseaux, lumière blanche, lampe à mercure)
//  Notations de la collection STL SPCL : l = distance entre les deux fentes ; a = pas du réseau ; sin θk = kλ/a.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const deg = r => r / M.RAD;
const tire = t => t[Math.floor(Math.random() * t.length)];

// ---------- cuve à deux vibreurs ----------
const CUVE = { W: 600, H: 360, PXCM: 15, X0: 60, Y0: 180, GX: 150, GY: 90 };       // 40 cm × 24 cm ; les sources sont à x = 4 cm du bord gauche
const toPx = (x, y) => [CUVE.X0 + x * CUVE.PXCM, CUVE.Y0 - y * CUVE.PXCM];
const PRESET_CUVE = { s: 6, lam: 2 };
const M_DEPART = { x: 20, y: 3 };

function CuveDeux({ s, lam, vue, anim, lignes, P, setP }) {
  const ref = useRef(null), glisse = useRef(false), t = useRef(0);
  const sD = useDeferredValue(s), lD = useDeferredValue(lam);
  const champ = useMemo(() => {
    const dx = 4 / CUVE.PXCM;
    const xs = Array.from({ length: CUVE.GX }, (_, i) => (i + 0.5) * dx - CUVE.X0 / CUVE.PXCM), ys = Array.from({ length: CUVE.GY }, (_, j) => CUVE.Y0 / CUVE.PXCM - (j + 0.5) * dx);
    return M.champCuveDeux({ s: sD, lambda: lD, xs, ys });
  }, [sD, lD]);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(CUVE.W, CUVE.H), d = img.data, w = 2 * Math.PI * 0.6;
    let raf, dernier = performance.now();
    const dessine = () => {
      const ph = w * t.current, c = Math.cos(ph), sn = Math.sin(ph);
      for (let y = 0; y < CUVE.H; y++) {
        const jy = Math.min(CUVE.GY - 1, Math.floor(y / 4));
        for (let x = 0; x < CUVE.W; x++) {
          const i = jy * CUVE.GX + Math.min(CUVE.GX - 1, Math.floor(x / 4)), o = (y * CUVE.W + x) * 4;
          if (vue === 'amplitude') {
            const g = Math.min(1, Math.hypot(champ.re[i], champ.im[i]) / (champ.w[i] || 1));
            d[o] = 238 - 200 * g; d[o + 1] = 244 - 140 * g; d[o + 2] = 250 - 40 * g;
          } else {
            const q = Math.max(-1, Math.min(1, (champ.re[i] * c + champ.im[i] * sn) / (1.1 * (champ.w[i] || 1)))) * 0.5 + 0.5;
            d[o] = 40 + 195 * q; d[o + 1] = 100 + 140 * q; d[o + 2] = 160 + 90 * q;
          }
          d[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    const boucle = now => { if (anim) t.current += Math.min(0.05, (now - dernier) / 1000); dernier = now; dessine(); raf = anim ? requestAnimationFrame(boucle) : null; };
    if (anim) raf = requestAnimationFrame(boucle); else dessine();
    return () => raf && cancelAnimationFrame(raf);
  }, [champ, vue, anim]);
  const [x1, y1] = toPx(0, s / 2), [x2, y2] = toPx(0, -s / 2), [mx, my] = toPx(P.x, P.y);
  const hyper = useMemo(() => {
    const L = [];
    for (let n = 0; n < 2 * Math.floor(2 * s / lam) + 2; n++) {
      const d = n * lam / 2; if (d >= s - 1e-9) break;
      const dest = n % 2 === 1, pts = [];
      for (let x = -4; x <= 36.01; x += 0.5) { const y = M.yPourDelta(s, d, x); if (y != null) pts.push([x, y]); }
      for (const sg of d === 0 ? [1] : [1, -1]) L.push({ dest, n, d: pts.map(([x, y]) => { const [px, py] = toPx(x, sg * y); return `${px.toFixed(1)},${py.toFixed(1)}`; }).join(' ') });
    }
    return L;
  }, [s, lam]);
  const versCm = e => { const r = ref.current.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * CUVE.W, py = (e.clientY - r.top) / r.height * CUVE.H; return { x: Math.max(2, Math.min(35, (px - CUVE.X0) / CUVE.PXCM)), y: Math.max(-11, Math.min(11, (CUVE.Y0 - py) / CUVE.PXCM)) }; };
  return (
    <div style={{ position: 'relative', lineHeight: 0 }}>
      <canvas ref={ref} width={CUVE.W} height={CUVE.H} style={{ width: '100%', borderRadius: 8, display: 'block', background: '#e0e8f0' }}
        role="img" aria-label={`Cuve à ondes vue de dessus : deux vibreurs S1 et S2, distants de ${nbf(s, 1)} cm, émettent des ondes de longueur d’onde ${nbf(lam, 2)} cm`}/>
      <svg aria-hidden="true" viewBox={`0 0 ${CUVE.W} ${CUVE.H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onPointerMove={e => { if (glisse.current) setP(versCm(e)); }} onPointerUp={() => { glisse.current = false; }} onPointerLeave={() => { glisse.current = false; }}>
        {lignes && hyper.map((h, i) => <polyline key={i} points={h.d} fill="none" stroke={h.dest ? '#b91c1c' : '#0f172a'} strokeWidth="1.6" strokeDasharray={h.dest ? '6 4' : undefined} opacity="0.85"/>)}
        <line x1={x1} y1={y1} x2={mx} y2={my} stroke="#7c2d12" strokeWidth="1.6" strokeDasharray="3 3"/><line x1={x2} y1={y2} x2={mx} y2={my} stroke="#7c2d12" strokeWidth="1.6" strokeDasharray="3 3"/>
        <g fill="#0f172a"><circle cx={x1} cy={y1} r="7"/><circle cx={x2} cy={y2} r="7"/></g>
        <g fontSize="15" fontWeight="700" fill="#0f172a" stroke="#fff" strokeWidth="3" paintOrder="stroke"><text x={x1 - 34} y={y1 + 5}>S₁</text><text x={x2 - 34} y={y2 + 5}>S₂</text></g>
        <g style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={e => { glisse.current = true; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); }}>
          <circle cx={mx} cy={my} r="22" fill="transparent"/><circle cx={mx} cy={my} r="9" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5"/>
          <text x={mx + 13} y={my - 11} fontSize="16" fontWeight="700" fill="#0f172a" stroke="#fff" strokeWidth="3" paintOrder="stroke">M</text></g>
      </svg>
    </div>);
}

// ---------- écran (Young, réseau) ----------
const IMG = { W: 600, H: 120 };
const dPointe = W => W / 100;          // pointé d’un repère : ± 3 pixels de l’image (mm)
const dD = 2e-3;                        // mètre ruban : ± 2 mm
const dLaser = lam => 0.01 * lam;       // notice : ± 1 % (nm)

function Ecran({ cfg }) {
  const { W, rgbAt, profil, enveloppe, x1, x2, setX, couleurCourbe, aria, legende } = cfg;
  const mmpx = W / (IMG.W / 2), ref = useRef(null), glisse = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(IMG.W, IMG.H), d = img.data;
    for (let x = 0; x < IMG.W; x++) {
      const c = rgbAt((x - IMG.W / 2 + 0.5) * mmpx);
      for (let y = 0; y < IMG.H; y++) { const o = (y * IMG.W + x) * 4; d[o] = 255 * c[0]; d[o + 1] = 255 * c[1]; d[o + 2] = 255 * c[2]; d[o + 3] = 255; }     // la même colonne de couleur sur toute la hauteur
    }
    ctx.putImageData(img, 0, 0);
  }, [rgbAt, mmpx]);
  const px = mm => IMG.W / 2 + mm / mmpx;
  const versMm = e => { const r = ref.current.getBoundingClientRect(); return Math.max(-W, Math.min(W, ((e.clientX - r.left) / r.width * IMG.W - IMG.W / 2) * mmpx)); };
  const grand = W >= 200, pas = grand ? 20 : 2, etiq = grand ? 100 : 10;
  const ticks = []; for (let m = -Math.floor(W / pas) * pas; m <= W + 1e-9; m += pas) ticks.push(Math.round(m / pas) * pas);
  const courbe = useMemo(() => { if (!profil) return null; let dd = '', de = ''; for (let x = 0; x <= IMG.W; x += W >= 200 ? 1 : 2) { const mm = (x - IMG.W / 2) * mmpx; dd += `${x ? 'L' : 'M'}${x},${(58 - 54 * Math.min(1, profil(mm))).toFixed(1)} `; if (enveloppe) de += `${x ? 'L' : 'M'}${x},${(58 - 54 * Math.min(1, enveloppe(mm))).toFixed(1)} `; } return { dd, de }; }, [profil, enveloppe, mmpx]);
  const mk = (xm, col, i) => (
    <g key={i} style={{ cursor: 'ew-resize', touchAction: 'none' }} onPointerDown={e => { glisse.current = i; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); }}>
      <line x1={px(xm)} y1="0" x2={px(xm)} y2={IMG.H} stroke="#fff" strokeWidth="5"/><line x1={px(xm)} y1="0" x2={px(xm)} y2={IMG.H} stroke={col} strokeWidth="2.5"/>
      <rect x={px(xm) - 30} y="0" width="60" height={IMG.H} fill="transparent"/>
      <text x={px(xm) + 9} y="22" fontSize="15" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="3" paintOrder="stroke">{i}</text></g>);
  return (
    <div>
      <div style={{ position: 'relative', lineHeight: 0 }}>
        <canvas ref={ref} width={IMG.W} height={IMG.H} style={{ width: '100%', display: 'block', borderRadius: '8px 8px 0 0', background: '#000' }} role="img" aria-label={aria}/>
        <svg aria-hidden="true" viewBox={`0 0 ${IMG.W} ${IMG.H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          onPointerMove={e => { if (glisse.current != null) setX(glisse.current, versMm(e)); }} onPointerUp={() => { glisse.current = null; }} onPointerLeave={() => { glisse.current = null; }}>
          {[mk(x1, '#f59e0b', 1), mk(x2, '#22d3ee', 2)]}
        </svg>
      </div>
      <svg viewBox={`0 0 ${IMG.W} 34`} style={{ width: '100%', display: 'block', background: '#f1f5f9' }} role="img" aria-label="Règle graduée en millimètres">
        {ticks.map(m => { const big = Math.abs(m / etiq - Math.round(m / etiq)) < 1e-6; return <g key={m}><line x1={px(m)} y1="0" x2={px(m)} y2={big ? 12 : 6} stroke="#475569" strokeWidth="1"/>
          {big && px(m) > 14 && px(m) < IMG.W - 22 && <text x={px(m)} y="26" fontSize="11" textAnchor="middle" fill="#334155">{String(m).replace('.', ',')}</text>}</g>; })}
        <text x={IMG.W - 4} y="10" fontSize="11" textAnchor="end" fill="#334155">mm</text>
      </svg>
      {courbe && <svg viewBox={`0 0 ${IMG.W} 64`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: '0 0 8px 8px', borderTop: '1px solid #e2e8f0' }} role="img" aria-label="Profil d’intensité lumineuse le long de l’écran">
        {enveloppe && <path d={courbe.de} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 4"/>}
        <path d={courbe.dd} fill="none" stroke={couleurCourbe} strokeWidth="2"/>
        <line x1="0" y1="58" x2={IMG.W} y2="58" stroke="#94a3b8" strokeWidth="0.8"/><text x="6" y="14" fontSize="11" fill="#475569" stroke="white" strokeWidth="3" paintOrder="stroke">{legende || 'intensité'}{enveloppe ? ' (tirets : enveloppe de diffraction)' : ''}</text>
      </svg>}
    </div>);
}

function Montage({ scene, source, lam, D }) {
  const col = source === 'laser' || scene === 'young' ? `rgb(${M.rgbLambda(lam).map(c => Math.round(c * 230)).join(',')})` : '#94a3b8';
  const ox = 230, ex = 510;
  return (
    <svg viewBox="0 0 600 130" style={{ width: '100%', display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img" aria-label={scene === 'young' ? 'Schéma du montage : laser, deux fentes, écran' : 'Schéma du montage : source de lumière, réseau, écran'}>
      <rect x="12" y="52" width="104" height="26" rx="4" fill="#1e293b"/><text x="64" y="70" fontSize="12" fontWeight="700" fill="white" textAnchor="middle">{source === 'mercure' ? 'lampe Hg' : source === 'blanche' ? 'lumière blanche' : 'laser'}</text>
      <line x1="116" y1="65" x2={ox} y2="65" stroke={col} strokeWidth="3"/>
      {scene === 'young' ? <g fill="#475569"><rect x={ox - 4} y="10" width="8" height="42"/><rect x={ox - 4} y="58" width="8" height="14"/><rect x={ox - 4} y="78" width="8" height="42"/></g>
        : <g fill="#475569"><rect x={ox - 4} y="10" width="8" height="110"/>{[...Array(9)].map((_, i) => <rect key={i} x={ox - 7} y={30 + i * 8} width="14" height="3" fill="#cbd5e1"/>)}</g>}
      <path d={`M${ox},65 L${ex},20 L${ex},110 Z`} fill={col} opacity="0.2"/>
      <line x1={ex} y1="10" x2={ex} y2="120" stroke="#0f172a" strokeWidth="4"/><text x={ex + 8} y="20" fontSize="12" fill="#334155">écran</text>
      <g stroke="#334155" strokeWidth="1.2" fill="none"><line x1={ox} y1="122" x2={ex} y2="122"/><line x1={ox} y1="116" x2={ox} y2="128"/><line x1={ex} y1="116" x2={ex} y2="128"/></g>
      <text x={(ox + ex) / 2} y="116" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">D</text>
      <text x={ox + 12} y={scene === 'young' ? 68 : 40} fontSize="13" fontWeight="700" fill="#0f172a">{scene === 'young' ? 'l' : 'pas a'}</text>
      <text x="4" y="12" fontSize="11" fill="#64748b">schéma non à l’échelle</text>
    </svg>);
}

// ---------- défis ----------
const nouveauPas = () => ({ pas: tire([2.0, 2.5, 3.0, 4.0, 5.0]), lam: tire([405, 532, 650]) });
const nouvelleLigne = () => { const i = Math.floor(Math.random() * M.RAIES_MERCURE.length); return { idx: i, lam: M.RAIES_MERCURE[i] }; };
const nouvellesFentes = () => ({ l: tire([0.20, 0.25, 0.30, 0.40, 0.50]), lam: tire([532, 650]) });
const nomRaie = nm => nm < 420 ? 'violette' : nm < 470 ? 'bleue' : nm < 570 ? 'verte' : 'jaune';
const WY = 40, WR = 400;                  // demi-largeurs d’image (mm) : Young et réseau

export function SimulationInterferences({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('interferences-guide-v1'));
  useSignalerMode(mode);
  const [suiviFentes, noterFentes] = useCompteurDefi(), [suiviPas, noterPas] = useCompteurDefi(), [suiviRaie, noterRaie] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('interferences-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('fentes');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('cuve');
  const [cuve, setCuve] = useState(PRESET_CUVE), [P, setP] = useState(M_DEPART);
  const [vue, setVue] = useState('ondes'), [lignes, setLignes] = useState(false);
  const [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; } });
  const [yz, setYz] = useState({ a: 40, l: 300, lam: 532, D: 2.5, expo: 2, x1: -10, x2: 10 });
  const [rz, setRz] = useState({ pas: 3.3, source: 'laser', lam: 532, D: 1, expo: 2, x1: -100, x2: 100 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const setY = f => setYz(z => ({ ...z, ...f })), setR = f => setRz(z => ({ ...z, ...f }));
  const dd = enDefi && defi ? defi : null;
  const sceneEff = dd ? (dd.type === 'fentes' ? 'young' : 'reseau') : scene;

  // ---------- grandeurs effectives (le défi impose certaines valeurs cachées) ----------
  const Y = dd?.type === 'fentes' ? { ...yz, a: 40, l: dd.l * 1e3, lam: dd.lam } : yz;
  const R = dd?.type === 'pas' ? { ...rz, pas: dd.pas, source: 'laser', lam: dd.lam } : dd?.type === 'raie' ? { ...rz, pas: 2.0, source: 'mercure' } : rz;
  const x1 = sceneEff === 'young' ? yz.x1 : rz.x1, x2 = sceneEff === 'young' ? yz.x2 : rz.x2;
  const W = sceneEff === 'young' ? WY : WR;
  const dx = dPointe(W);
  const Lmes = Math.abs(x2 - x1);                                                           // mm
  const setX = (i, v) => (sceneEff === 'young' ? setYz : setRz)(z => ({ ...z, [i === 1 ? 'x1' : 'x2']: v }));

  // Young
  const iY = M.interfrange(Y.l * 1e-6, Y.lam * 1e-9, Y.D) * 1e3;                            // mm
  const nY = 6;
  const lCalc = Lmes > 0 ? M.distanceFentes(Lmes / nY * 1e-3, Y.lam * 1e-9, Y.D) * 1e6 : NaN;  // µm, avec n = 6 interfranges
  const incY = Lmes > 0 ? M.incertitudeFentes({ l: lCalc * 1e-6, d: Lmes * 1e-3, D: Y.D, lambda: Y.lam * 1e-9, dd: Math.SQRT2 * dx * 1e-3, dD, dLambda: dLaser(Y.lam) * 1e-9 }) : null;
  // réseau
  const kMax = Math.max(1, M.ordreMax(R.source === 'mercure' ? Math.max(...M.RAIES_MERCURE) * 1e-9 : R.lam * 1e-9, R.pas * 1e-6));
  const xk = (k, nm) => M.positionOrdre(k, nm * 1e-9, R.pas * 1e-6, R.D) * 1e3;                     // mm
  const lamMes = R.source === 'mercure' ? 546.1 : R.lam;
  const xMes = Lmes / 2;
  const thMes = Math.atan2(xMes, R.D * 1e3);
  const aMes = Lmes > 0 ? M.pasDepuisOrdre(1, R.lam * 1e-9, thMes) * 1e6 : NaN;               // µm, ordre 1
  const lamRaieMes = Lmes > 0 ? M.lambdaDepuisOrdre(1, R.pas * 1e-6, thMes) * 1e9 : NaN;           // nm, ordre 1
  const incR = Lmes > 0 ? M.incertitudePas({ k: 1, lambda: 1e-6, x: xMes * 1e-3, D: R.D, dx: Math.SQRT2 * dx * 1e-3 / 2, dD, dLambda: 0.01e-6 }) : null;
  const relR = incR ? incR.rel : 0, relY = incY ? incY.rel : 0;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const [r1, r2] = M.distancesSources(cuve.s, P.x, P.y), delta = Math.abs(r2 - r1);
  const v = M.celeriteCuve(cuve.lam), tauMs = M.retardCuve(cuve.lam, r1, r2) * 1e3, tauT = delta / cuve.lam, nature = M.natureInterference(tauT);
  const cuveBase = scene === 'cuve' && cuve.s === 6 && cuve.lam === 2;
  const youngBase = scene === 'young' && yz.a === 40 && yz.l === 300 && yz.lam === 532 && yz.D === 2.5;
  const reseauBase = scene === 'reseau' && rz.pas === 3.3 && rz.lam === 532 && rz.D === 1 && rz.source === 'laser';
  const tolPt = 1.2 * dx;
  const pointeYoung = (() => { if (!youngBase) return false; const near = x => Math.abs(x / iY - Math.round(x / iY)) * iY <= tolPt; return near(yz.x1) && near(yz.x2) && Math.abs(Lmes / iY - nY) < 0.25; })();
  const x1k = M.positionOrdre(1, 532e-9, 3.3e-6, 1) * 1e3;
  const pointeReseau = reseauBase && Math.abs(rz.x1 + x1k) <= tolPt && Math.abs(rz.x2 - x1k) <= tolPt;
  const xVert = M.positionOrdre(1, 546.1e-9, 3.3e-6, 1) * 1e3;
  const reseauHg = scene === 'reseau' && rz.pas === 3.3 && rz.source === 'mercure' && rz.D === 1;
  const pointeVert = reseauHg && Math.abs(rz.x1 + xVert) <= tolPt && Math.abs(rz.x2 - xVert) <= tolPt;
  const lamVertMes = Lmes > 0 ? M.lambdaDepuisOrdre(1, 3.3e-6, Math.atan2(Lmes / 2, 1000)) * 1e9 : NaN;
  const aMesG = Lmes > 0 ? M.pasDepuisOrdre(1, 532e-9, Math.atan2(Lmes / 2, 1000)) * 1e6 : NaN;
  const ETAPES = [
    { id: 'sources', titre: 'Deux sources, une seule fréquence', focus: ['scene'],
      texte: <>Dans cette <strong>cuve à ondes</strong> (vue de dessus), deux vibreurs <strong>S₁</strong> et <strong>S₂</strong> frappent l’eau, reliés au <strong>même générateur</strong> : ils vibrent à 20{NB}Hz, en même temps. Les cercles qui s’étalent sont les crêtes des deux ondes.</>,
      tache: { type: 'qcm', q: 'Deux ondes de même fréquence et de déphasage constant sont dites…', options: ['synchrones', 'sinusoïdales', 'indépendantes'], bonne: 0,
        expl: 'Des ondes synchrones ont la même fréquence et un déphasage constant. Pour en obtenir, on partage une seule source en deux, ici avec un seul générateur pour les deux vibreurs.', indice: "Pour obtenir des interférences stables, il faut un déphasage constant entre les ondes." } },
    { id: 'amplitude', titre: 'Où l’eau est-elle agitée ?', focus: ['scene', 'reglages'],
      texte: <>Les deux ondes se <strong>superposent</strong>. Affichez la vue « amplitude » : plus c’est foncé, plus l’eau est agitée en ce point.</>,
      tache: { type: 'action', ok: scene === 'cuve' && vue === 'amplitude', label: 'Afficher l’amplitude', faire: () => { setScene('cuve'); setCuve(PRESET_CUVE); setVue('amplitude'); }, consigne: 'Cliquez sur « Voir l’amplitude » dans les réglages' } },
    { id: 'franges', titre: 'Des zones agitées, des zones calmes', focus: ['scene'],
      texte: <>On voit une alternance de bandes agitées (foncées) et calmes (claires) : ce sont des <strong>franges d’interférences</strong>. Dans une zone calme, les deux ondes se retrouvent exactement opposées.</>,
      tache: { type: 'qcm', q: 'Dans une zone calme, les deux ondes arrivent…', options: ['en phase', 'en opposition de phase', 'avec la même amplitude mais à des instants sans rapport'], bonne: 1,
        expl: 'Quand deux ondes arrivent en opposition de phase (une crête sur un creux), elles se compensent : l’interférence est destructive. Quand elles arrivent en phase, elles s’ajoutent : l’interférence est constructive.', indice: "Zone calme : les ondes s’annulent. S’ajoutent-elles ou se retranchent-elles ?" } },
    { id: 'axe', titre: 'Un point sur l’axe de symétrie', focus: ['scene', 'sonde'],
      texte: <>Le point <strong>M</strong> (jaune) est le point d’observation. Faites-le glisser, ou utilisez les curseurs de position. Placez-le <strong>sur l’axe de symétrie</strong> des deux sources (<em>y</em> = 0).</>,
      tache: { type: 'action', ok: cuveBase && Math.abs(P.y) < 0.4, bloque: cuveBase ? null : 'Remettez d’abord s = 6 cm et λ = 2 cm avec le bouton « Rétablir » au-dessus de la cuve.', label: 'Placer M sur l’axe', faire: () => { setScene('cuve'); setCuve(PRESET_CUVE); setVue('amplitude'); setP({ x: 14, y: 0 }); }, consigne: 'Placez M sur l’axe (y = 0)' } },
    { id: 'axeretard', titre: 'Le retard sur l’axe', focus: ['sonde'],
      texte: <>Les distances <em>r</em>₁ = S₁M et <em>r</em>₂ = S₂M sont affichées dans « Mesures ». Le <strong>retard</strong> τ de l’onde la plus lointaine est le temps qu’elle met à parcourir la distance supplémentaire |<em>r</em>₂ − <em>r</em>₁|.</>,
      tache: { type: 'qcm', q: 'Sur l’axe de symétrie, le retard entre les deux ondes est…', options: ['nul : les deux ondes arrivent en phase', 'égal à une demi-période', 'égal à une période, ce qui donne une interférence destructive'], bonne: 0,
        expl: 'Sur l’axe, r₁ = r₂ : les deux ondes parcourent la même distance et arrivent en même temps. Le retard est nul, donc l’interférence est constructive (τ = 0 est un multiple de la période).', indice: "Sur l’axe de symétrie, le point est à la même distance des deux sources." } },
    { id: 'placer', titre: 'Un autre point', focus: ['scene', 'sonde'],
      texte: <>Placez maintenant M sur un point où la différence de distances est de <strong>3{NB}cm</strong> environ (r₂ − r₁ = 3{NB}cm). Le bouton le fait pour vous.</>,
      tache: { type: 'action', ok: cuveBase && Math.abs(delta - 3) < 0.3, bloque: cuveBase ? null : 'Remettez d’abord s = 6 cm et λ = 2 cm.', label: 'Placer M (δ = 3 cm)', faire: () => { setScene('cuve'); setCuve(PRESET_CUVE); setP({ x: 14, y: M.yPourDelta(6, 3, 14) }); }, consigne: 'Placez M pour que |r₂ − r₁| ≈ 3 cm' } },
    { id: 'delta', titre: 'Différence de distances', focus: ['sonde'],
      texte: <>Lisez <em>r</em>₁ et <em>r</em>₂ dans « Mesures » et calculez la <strong>différence de distances</strong> δ = |<em>r</em>₂ − <em>r</em>₁|.</>,
      tache: { type: 'num', q: 'Différence de distances δ', unite: 'cm', vrai: delta, tol: 0.06, affiche: v => nbf(v, 1), cs: 2,
        bloque: cuveBase && Math.abs(delta - 3) < 0.3 ? null : 'Placez d’abord M avec le bouton « Rétablir le point M » au-dessus de la cuve.',
        calcul: () => [`r₁ = ${nbf(r1, 2)} cm ; r₂ = ${nbf(r2, 2)} cm.`, `δ = ${nbf(r2, 2)} − ${nbf(r1, 2)} = ${nbf(delta, 2)} cm.`],
        pieges: [[r1 + r2, 'Vous avez additionné les deux distances. La différence de distances est r₂ − r₁.']],
        expl: `δ = |r₂ − r₁| ≈ ${nbf(delta, 1)} cm.`, indice: "δ = |d₂ − d₁| : mesurez la distance du point à chaque source." } },
    { id: 'tau', titre: 'Le retard τ', focus: ['sonde'],
      texte: <>Les ondes se propagent à la célérité <em>v</em> = <em>λ</em> × <em>f</em> = 2{NB}cm × 20{NB}Hz = 0,40{NB}m/s. Calculez le retard τ = δ / <em>v</em>, en millisecondes.</>,
      tache: { type: 'num', q: 'Retard τ', unite: 'ms', vrai: delta * 1e-2 / 0.4 * 1e3, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        bloque: cuveBase && Math.abs(delta - 3) < 0.3 ? null : 'Placez d’abord M avec le bouton « Rétablir le point M » au-dessus de la cuve.',
        calcul: () => ['Hypothèse : la célérité est la même dans toute la cuve (eau de profondeur constante).', `Unités SI : δ = ${nbf(delta, 1)} cm = ${nbf(delta * 1e-2, 3)} m ; v = 0,40 m/s.`, `τ = ${nbf(delta * 1e-2, 3)} / 0,40 = ${nbf(delta * 1e-2 / 0.4, 3)} s = ${nbf(delta * 1e-2 / 0.4 * 1e3, 0)} ms.`],
        pieges: [[delta * 1e-2 / 0.4, 'Vous avez donné τ en secondes. L’unité demandée est la milliseconde.'], [delta / 0.4 * 1e3, 'Convertissez δ en mètres avant de diviser par v (en m/s).']],
        expl: 'τ = δ / v = 0,030 / 0,40 = 0,075 s = 75 ms (valeurs pour δ = 3,0 cm).', indice: "τ = δ ÷ v, avec δ en mètres et v la célérité de l’onde." } },
    { id: 'nature', titre: 'Constructive ou destructive ?', focus: ['sonde'],
      texte: <>La période des ondes est <em>T</em> = 1 / <em>f</em> = 50{NB}ms. Comparez le retard τ = 75{NB}ms à <em>T</em>. Les interférences sont constructives si τ = <em>k</em>·<em>T</em> et destructives si τ = <em>k</em>·<em>T</em> + <em>T</em>/2 (<em>k</em> entier).</>,
      tache: { type: 'qcm', q: 'Au point M, où τ = 75 ms et T = 50 ms, l’interférence est…', options: ['constructive', 'destructive', 'ni l’une ni l’autre exactement'], bonne: 1,
        expl: '75 ms = 50 ms + 25 ms = 1 × T + T/2 : le retard vaut une période plus une demi-période, donc l’interférence est destructive. On le vérifie sur la vue « amplitude » : M est dans une zone claire (calme).', indice: "Calculez τ ÷ T : un nombre entier donne une interférence constructive, un demi-entier une destructive." } },
    { id: 'constructive', titre: 'Chercher une frange agitée', focus: ['scene', 'sonde'],
      retenirTitre: 'À RETENIR : INTERFÉRENCES DE DEUX ONDES SYNCHRONES',
      retenir: <>
        <svg viewBox="0 0 360 170" role="img" aria-label="Interférences de deux ondes synchrones : les sources S1 et S2 sont séparées de s ; au point M, les deux ondes ont parcouru les distances r1 et r2 ; la différence de distances delta vaut r2 moins r1 en valeur absolue ; sur l’axe de symétrie, delta est nul et les ondes sont en phase" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block', margin: '0 auto 6px' }}>
          <line x1="30" y1="85" x2="330" y2="85" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" /><text x="236" y="102" fontSize="10.5" fill="#64748b">axe de symétrie</text>
          <circle cx="40" cy="55" r="7" fill="#0072b2" /><text x="26" y="44" fontSize="12.5" fontWeight="700" fill="#0072b2">S₁</text>
          <circle cx="40" cy="115" r="7" fill="#d55e00" /><text x="26" y="140" fontSize="12.5" fontWeight="700" fill="#d55e00">S₂</text>
          <line x1="40" y1="55" x2="230" y2="42" stroke="#0072b2" strokeWidth="2.5" /><line x1="40" y1="115" x2="230" y2="42" stroke="#d55e00" strokeWidth="2.5" />
          <circle cx="230" cy="42" r="6" fill="#eab308" stroke="#92400e" strokeWidth="1.5" /><text x="240" y="40" fontSize="13" fontWeight="700" fill="#92400e">M</text>
          <text x="120" y="38" fontSize="12" fontWeight="700" fill="#0072b2">r₁</text><text x="120" y="102" fontSize="12" fontWeight="700" fill="#d55e00">r₂</text>
          <text x="8" y="164" fontSize="11.5" fill="#334155">δ = |r₂ − r₁|  ;  τ = δ / v</text>
        </svg>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Interférence</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Retard</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Différence de distances</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Ondes</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>constructive (frange agitée)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>τ = k·T</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>δ = k·λ</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>en phase</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>destructive (zone calme)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>τ = k·T + T/2</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>δ = (k + ½)·λ</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>en opposition de phase</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Deux ondes <strong>synchrones</strong> (même fréquence, déphasage constant) qui se superposent <strong>interfèrent</strong> ; k est un entier.</li>
          <li>Le retard vient de la différence de distances : τ = δ / v, avec v = λ × f et T = 1 / f.</li>
          <li>Sur l’<strong>axe de symétrie</strong>, δ = 0 : interférence constructive.</li>
        </ul>
      </>,
      texte: <>Placez M sur une autre <strong>frange agitée</strong> que celle de l’axe : un point où le retard est une période (τ = <em>T</em>), c’est-à-dire δ = <em>λ</em> = 2{NB}cm.</>,
      tache: { type: 'action', ok: cuveBase && nature === 'constructive' && Math.abs(P.y) > 1, bloque: cuveBase ? null : 'Remettez d’abord s = 6 cm et λ = 2 cm.', label: 'Placer M (δ = λ)', faire: () => { setCuve(PRESET_CUVE); setScene('cuve'); setP({ x: 14, y: M.yPourDelta(6, 2, 14) }); }, consigne: 'Placez M sur une frange agitée, hors de l’axe' } },
    { id: 'lignes', titre: 'Les lignes d’interférence', focus: ['reglages', 'scene'],
      texte: <>Affichez les <strong>lignes d’interférence</strong> : en trait plein, les franges constructives (δ = 0, <em>λ</em>, 2<em>λ</em>…) ; en tirets, les destructives (δ = <em>λ</em>/2, 3<em>λ</em>/2…).</>,
      tache: { type: 'action', ok: lignes, label: 'Afficher les lignes', faire: () => { setLignes(true); setScene('cuve'); }, consigne: 'Affichez les lignes d’interférence' } },
    { id: 'ecart', titre: 'Écarter les sources', focus: ['reglages', 'scene'],
      texte: <>Réglez la distance entre les sources sur <em>s</em> = 10{NB}cm (curseur). Observez les franges.</>,
      tache: { type: 'action', ok: scene === 'cuve' && cuve.s >= 9.5, label: 'Régler s = 10 cm', faire: () => { setScene('cuve'); setCuve(c => ({ ...c, s: 10 })); }, consigne: 'Réglez s à 10 cm' } },
    { id: 'effet', titre: 'Effet de la distance entre les sources', focus: ['scene'],
      texte: <>Comparez avec <em>s</em> = 6{NB}cm.</>,
      tache: { type: 'qcm', q: 'Quand on éloigne les sources l’une de l’autre, les franges…', options: ['se resserrent et sont plus nombreuses', 's’écartent et sont moins nombreuses', 'ne changent pas'], bonne: 0,
        expl: 'Plus les sources sont éloignées, plus la différence de distances varie vite quand M se déplace : on passe plus vite d’une frange à l’autre. L’interfrange diminue.', indice: "Essayez dans la simulation : comparez le nombre de franges pour deux écartements." } },
    { id: 'young', titre: 'La lumière aussi interfère', focus: ['scene', 'reglages'],
      texte: <>Un <strong>laser</strong> (<em>λ</em> = 532{NB}nm) éclaire deux fentes très fines, séparées de <em>l</em> = 300{NB}µm. Chaque fente est une source secondaire : les deux ondes sont synchrones, car elles viennent du même laser. L’écran est à <em>D</em> = 2,50{NB}m.</>,
      tache: { type: 'action', ok: youngBase, label: 'Passer aux fentes de Young', faire: () => { setScene('young'); setYz({ a: 40, l: 300, lam: 532, D: 2.5, expo: 2, x1: -10, x2: 10 }); }, consigne: 'Fentes de Young : l = 300 µm, λ = 532 nm, D = 2,50 m' } },
    { id: 'figure', titre: 'Lire la figure', focus: ['ecran'],
      texte: <>On voit des <strong>franges brillantes</strong> régulièrement espacées. Leur éclat diminue de part et d’autre du centre : c’est l’<strong>enveloppe de diffraction</strong> (tirets sur la courbe).</>,
      tache: { type: 'qcm', q: 'Pourquoi les franges sont-elles de moins en moins brillantes quand on s’éloigne du centre ?', options: ['parce que chaque fente diffracte la lumière : l’éclairement décroît selon la figure de diffraction d’une fente', 'parce que le laser s’affaiblit', 'parce que les deux ondes ne sont plus synchrones'], bonne: 0,
        expl: 'Chaque fente, très fine, diffracte la lumière : sa figure de diffraction impose l’éclairement maximal de chaque frange (l’enveloppe). Les interférences, elles, créent les franges à l’intérieur de cette enveloppe.', indice: "Pensez à la diffraction par chacune des fentes : elle répartit inégalement la lumière." } },
    { id: 'pointer', titre: 'Mesurer plusieurs interfranges', focus: ['ecran', 'mesures'],
      texte: <>L’<strong>interfrange</strong> <em>i</em> est la distance entre deux franges brillantes consécutives. Pour la mesurer précisément, on mesure plusieurs interfranges d’un coup : placez le repère 1 au centre d’une frange brillante et le repère 2 au centre de la <strong>6ᵉ frange</strong> suivante (6 interfranges plus loin).</>,
      tache: { type: 'action', ok: pointeYoung, bloque: youngBase ? null : 'Revenez au réglage de base avec le bouton « Rétablir le réglage » sous l’image.', label: 'Placer pour moi', consigne: 'Repères sur deux franges brillantes séparées de 6 interfranges', faire: () => setYz(z => ({ ...z, x1: -3 * iY, x2: 3 * iY })) } },
    { id: 'interfrange', titre: 'Calculer l’interfrange', focus: ['mesures'],
      texte: <>Lisez la distance <em>d</em> entre vos repères dans « Mesures », puis calculez l’interfrange <em>i</em> = <em>d</em> / 6.</>,
      tache: { type: 'num', q: 'Interfrange i', unite: 'mm', vrai: Lmes / nY, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        bloque: pointeYoung ? null : 'Placez d’abord les repères (étape précédente).',
        calcul: () => [`d = ${nbf(Lmes, 1)} mm sur 6 interfranges.`, `i = ${nbf(Lmes, 1)} / 6 = ${nbf(Lmes / nY, 2)} mm.`],
        pieges: [[Lmes, 'Vous avez donné la distance entre les repères : il faut la diviser par le nombre d’interfranges (6).']],
        expl: `i = d / 6 ≈ ${nbf(Lmes / nY, 2)} mm.`, indice: "i = largeur de plusieurs interfranges ÷ leur nombre." } },
    { id: 'dependance', titre: 'De quoi dépend l’interfrange ?', focus: ['reglages'],
      texte: <>Pour des fentes de Young, l’interfrange est <strong>i = λ·D / l</strong>. Essayez les curseurs <em>l</em> et <em>D</em>, puis répondez.</>,
      tache: { type: 'qcm', q: 'Si l’on rapproche les deux fentes (l diminue), l’interfrange…', options: ['augmente', 'diminue', 'reste le même'], bonne: 0,
        expl: 'Avec i = λD/l, l’interfrange est inversement proportionnel à l : si l diminue, i augmente. C’est cohérent avec la cuve : sources plus rapprochées, franges plus larges.', indice: "i = λD ÷ l : que devient i quand l diminue ?" } },
    { id: 'calcl', titre: 'La distance entre les fentes', focus: ['mesures'],
      texte: <>Revenez au réglage de base si besoin. Avec <em>i</em> = <em>d</em> / 6, déduisez la distance <em>l</em> entre les fentes : isolez <em>l</em> dans <em>i</em> = <em>λ</em>·<em>D</em> / <em>l</em> et calculez-la en micromètres (<em>λ</em> = 532{NB}nm, <em>D</em> = 2,50{NB}m).</>,
      tache: { type: 'num', q: 'Distance l entre les fentes', unite: 'µm', vrai: lCalc, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        bloque: pointeYoung ? null : 'Placez d’abord les repères (étape « Mesurer plusieurs interfranges »).',
        calcul: () => ['Hypothèses : écran loin des fentes ; petits angles (ici θ ≈ 10⁻³ rad).', `Unités SI : λ = 532 × 10⁻⁹ m ; D = 2,50 m ; i = ${nbf(Lmes / nY, 2)} × 10⁻³ m.`,
          `l = λD / i = 532 × 10⁻⁹ × 2,50 / (${nbf(Lmes / nY, 2)} × 10⁻³) = ${nbf(lCalc * 1e-6 * 1e4, 2)} × 10⁻⁴ m = ${nbf(lCalc, 0)} µm.`],
        pieges: [[lCalc * 1e-6, 'Le résultat est à donner en micromètres (1 µm = 10⁻⁶ m).'], [lCalc / 1000, 'Vous avez donné l en millimètres ; l’unité demandée est le micromètre.']],
        expl: 'l = λD/i ≈ 300 µm : les deux fentes sont distantes d’environ un tiers de millimètre (valeur exacte de la simulation : 300 µm ; l’écart vient du pointé).', indice: "l = λD ÷ i, avec toutes les longueurs dans la même unité." } },
    { id: 'pourquoi6', titre: 'Pourquoi six interfranges ?', focus: ['incert'],
      retenirTitre: 'À RETENIR : LES FENTES DE YOUNG',
      retenir: <>
        <Formule><mi>i</mi><mo>=</mo><mfrac><mrow><mi>λ</mi><mo>×</mo><mi>D</mi></mrow><mi>l</mi></mfrac><mspace width="1.5em"/><mi>l</mi><mo>=</mo><mfrac><mrow><mi>λ</mi><mo>×</mo><mi>D</mi></mrow><mi>i</mi></mfrac></Formule>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Chaque fente est une <strong>source secondaire</strong> ; les deux ondes sont synchrones car elles viennent du même laser.</li>
          <li>L’<strong>interfrange i</strong> est la distance entre deux franges brillantes consécutives ; elle <strong>augmente</strong> si les fentes se rapprochent (l diminue) ou si l’écran s’éloigne (D augmente).</li>
          <li>L’éclat des franges décroît loin du centre : c’est l’<strong>enveloppe de diffraction</strong> de chaque fente.</li>
          <li>On mesure <strong>6 interfranges</strong> : l’incertitude de pointé est la même, mais elle pèse moins sur une grande distance ; i = d / 6.</li>
        </ul>
      </>,
      texte: <>Le panneau « Incertitude » donne le poids de chaque source d’erreur sur <em>l</em>. L’incertitude de pointé d’un repère est la même quelle que soit la distance mesurée.</>,
      tache: { type: 'qcm', q: 'Pourquoi mesure-t-on 6 interfranges plutôt qu’un seul ?', options: ['l’incertitude de pointé est la même, mais elle pèse moins sur une grande distance : l’incertitude relative sur i diminue', 'parce que l’interfrange change d’une frange à l’autre', 'pour que la mesure soit plus rapide'], bonne: 0,
        expl: 'Chaque repère est pointé à ± 3 pixels près. Sur une distance 6 fois plus grande, cette incertitude pèse 6 fois moins en valeur relative : on gagne en précision.', indice: "L’erreur de pointé est la même pour 1 ou 6 interfranges. Que devient son poids relatif ?" } },
    { id: 'reseau', titre: 'Beaucoup de fentes : le réseau', focus: ['scene', 'reglages'],
      texte: <>Un <strong>réseau</strong> est une plaque portant un très grand nombre de traits fins, parallèles et équidistants. La distance entre deux traits voisins est le <strong>pas</strong> <em>a</em> du réseau. Ici <em>a</em> = 3,3{NB}µm (environ 300 traits par mm), éclairé par le laser vert à <em>D</em> = 1,00{NB}m.</>,
      tache: { type: 'action', ok: reseauBase, label: 'Passer au réseau', faire: () => { setScene('reseau'); setRz({ pas: 3.3, source: 'laser', lam: 532, D: 1, expo: 2, x1: -100, x2: 100 }); }, consigne: 'Réseau de 3,3 µm, laser vert, D = 1,00 m' } },
    { id: 'interet', titre: 'Pourquoi un réseau ?', focus: ['ecran'],
      texte: <>Comparez cette figure à celle des deux fentes : les taches sont <strong>fines, bien séparées et lumineuses</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est l’intérêt d’un réseau par rapport à deux fentes pour mesurer une longueur d’onde ?', options: ['les taches sont plus fines et plus lumineuses, donc plus faciles à pointer avec précision', 'le réseau supprime la diffraction', 'le réseau permet d’utiliser une lumière non monochromatique sans aucun effet'], bonne: 0,
        expl: 'Avec N traits, les ondes de tous les traits ne s’ajoutent en phase que dans des directions bien précises : les taches sont d’autant plus fines et lumineuses que N est grand. Le pointé est donc plus précis.', indice: "Un réseau compte des centaines de fentes : que deviennent les taches ?" } },
    { id: 'ordres', titre: 'Les ordres de diffraction', focus: ['ecran', 'mesures'],
      texte: <>Les taches sont numérotées par leur <strong>ordre</strong> <em>k</em> : <em>k</em> = 0 au centre, <em>k</em> = ±1 de part et d’autre, etc. Placez le repère 1 sur la tache d’ordre <strong>−1</strong> et le repère 2 sur celle d’ordre <strong>+1</strong>.</>,
      tache: { type: 'action', ok: pointeReseau, bloque: reseauBase ? null : 'Revenez au réglage de base avec le bouton « Rétablir le réglage » sous l’image.', label: 'Placer pour moi', consigne: 'Repères sur les taches d’ordre −1 et +1', faire: () => setRz(z => ({ ...z, x1: -x1k, x2: x1k })) } },
    { id: 'theta', titre: 'L’angle de déviation', focus: ['mesures'],
      texte: <>La distance entre les deux repères (lue dans « Mesures ») vaut 2<em>x</em>₁. L’écran est à <em>D</em> = 1,00{NB}m. L’angle <em>θ</em>₁ entre la tache centrale et la tache d’ordre 1 vérifie tan <em>θ</em>₁ = <em>x</em>₁ / <em>D</em>. Calculez-le, en degrés.</>,
      tache: { type: 'num', q: 'Angle θ₁', unite: '°', vrai: deg(Math.atan2(Lmes / 2, 1000)), tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        bloque: pointeReseau ? null : 'Placez d’abord les repères (étape précédente).',
        calcul: () => [`x₁ = ${nbf(Lmes / 2, 1)} mm = ${nbf(Lmes / 2 / 1000, 3)} m ; D = 1,00 m.`, `tan θ₁ = ${nbf(Lmes / 2 / 1000, 3)} / 1,00 donc θ₁ = ${nbf(deg(Math.atan2(Lmes / 2, 1000)), 1)}° (calculatrice en degrés).`],
        pieges: [[Math.atan2(Lmes / 2, 1000), 'Votre calculatrice est en radians : l’angle demandé est en degrés.'], [deg(Math.atan2(Lmes, 1000)), 'Vous avez utilisé la distance entre les deux repères : x₁ est la moitié.']],
        expl: `θ₁ = ${nbf(deg(Math.atan2(Lmes / 2, 1000)), 1)}°.`, indice: "tan θ = (L ÷ 2) ÷ D : utilisez la touche arctan de la calculatrice." } },
    { id: 'pas', titre: 'Le pas du réseau', focus: ['mesures'],
      texte: <>La <strong>formule des réseaux</strong> relie l’angle de déviation <em>θ</em><sub>k</sub> de l’ordre <em>k</em>, la longueur d’onde et le pas : <strong>sin θ<sub>k</sub> = k·λ / a</strong>. Pour <em>k</em> = 1 et <em>λ</em> = 532{NB}nm, calculez le pas <em>a</em>, en micromètres.</>,
      tache: { type: 'num', q: 'Pas a du réseau', unite: 'µm', vrai: aMesG, tol: 0.03, affiche: v => nbf(v, 2), cs: 3,
        bloque: pointeReseau ? null : 'Placez d’abord les repères (étape « Les ordres de diffraction »).',
        calcul: () => ['Hypothèse : formule des réseaux, valable sans approximation des petits angles.', `a = kλ / sin θ₁ = 1 × 532 × 10⁻⁹ / sin(${nbf(deg(Math.atan2(Lmes / 2, 1000)), 1)}°) = ${nbf(aMesG * 1e-6 * 1e6, 2)} × 10⁻⁶ m = ${nbf(aMesG, 2)} µm.`],
        pieges: [[aMesG * 1e-6, 'Le résultat est à donner en micromètres.'], [532e-9 * Math.sin(Math.atan2(Lmes / 2, 1000)) * 1e6, 'Vous avez multiplié λ par sin θ₁ : la formule des réseaux est sin θ₁ = λ / a, donc a = λ / sin θ₁.'], [532e-9 / Math.cos(Math.atan2(Lmes / 2, 1000)) * 1e6, 'Utilisez le sinus de θ₁ (formule des réseaux), pas son cosinus.'], [aMesG / 1000, 'Vérifiez l’unité : le résultat est à donner en micromètres.']],
        expl: `a = λ / sin θ₁ ≈ ${nbf(aMesG, 1)} µm (valeur exacte de la simulation : 3,3 µm), soit environ 300 traits par millimètre.`, indice: "a = λ ÷ sin θ₁ (ordre 1)." } },
    { id: 'ordremax', titre: 'Combien d’ordres ?', focus: ['ecran'],
      texte: <>Un ordre n’existe que si sin θ<sub>k</sub> = k·λ / a est inférieur à 1. Calculez l’ordre maximal <em>k</em> théorique avec <em>λ</em> = 532{NB}nm et <em>a</em> = 3,3{NB}µm.</>,
      tache: { type: 'num', q: 'Ordre maximal observable', unite: '', vrai: 6, tol: 0.001, affiche: v => nbf(v, 0), cs: 1,
        calcul: () => ['Condition : k λ / a < 1, donc k < a / λ.', 'a / λ = 3,3 × 10⁻⁶ / 532 × 10⁻⁹ ≈ 6,2 : le plus grand entier strictement inférieur est k = 6.'],
        pieges: [[6.2, 'Un ordre est un nombre entier : prenez la partie entière.']],
        expl: 'k < a/λ ≈ 6,2 : les ordres vont théoriquement de −6 à +6. En pratique, les ordres élevés sont très écartés, presque rasants, peu lumineux, et sortent de l’image (écran plan) : on n’en voit ici que quelques-uns.', indice: "sin θ ne peut pas dépasser 1 : p ≤ a ÷ λ. Gardez la partie entière." } },
    { id: 'blanche', titre: 'Et en lumière blanche ?', focus: ['reglages', 'ecran'],
      retenirTitre: 'À RETENIR : LE RÉSEAU',
      retenir: <>
        <Formule><mi>sin</mi><msub><mi>θ</mi><mi>k</mi></msub><mo>=</mo><mfrac><mrow><mi>k</mi><mo>×</mo><mi>λ</mi></mrow><mi>a</mi></mfrac><mspace width="1.5em"/><mi>tan</mi><msub><mi>θ</mi><mn>1</mn></msub><mo>=</mo><mfrac><msub><mi>x</mi><mn>1</mn></msub><mi>D</mi></mfrac></Formule>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Un <strong>réseau</strong> est une plaque portant un très grand nombre de traits fins, parallèles et équidistants ; le <strong>pas a</strong> est la distance entre deux traits voisins (3,3 µm ≈ 300 traits / mm).</li>
          <li>Par rapport à deux fentes, les taches sont <strong>fines, bien séparées et lumineuses</strong> : plus faciles à pointer.</li>
          <li>Les taches sont numérotées par leur <strong>ordre k</strong> (k = 0 au centre, ± 1, ± 2…) ; un ordre n’existe que si k·λ / a &lt; 1, donc k &lt; a / λ.</li>
        </ul>
      </>,
      texte: <>Remplacez le laser par une <strong>lumière blanche</strong> (toutes les couleurs). Observez la tache centrale et les ordres 1 et 2.</>,
      tache: { type: 'action', ok: scene === 'reseau' && rz.source === 'blanche', label: 'Lumière blanche', faire: () => { setScene('reseau'); setR({ source: 'blanche' }); }, consigne: 'Choisissez « Lumière blanche »' } },
    { id: 'dispersion', titre: 'Le réseau disperse la lumière', focus: ['ecran'],
      texte: <>Les ordres 1, 2… sont étalés en <strong>spectres</strong> : chaque longueur d’onde interfère de façon constructive dans une direction qui lui est propre. La tache centrale (<em>k</em> = 0) reste blanche.</>,
      tache: { type: 'qcm', q: 'Dans le spectre d’ordre 1, quelle couleur est la plus éloignée du centre ?', options: ['le rouge (λ la plus grande)', 'le violet (λ la plus petite)', 'toutes les couleurs sont à la même distance'], bonne: 0,
        expl: 'D’après sin θ₁ = λ / a, plus λ est grande, plus θ₁ est grand : le rouge (≈ 700 nm) est plus dévié que le violet (≈ 400 nm). C’est l’inverse d’un prisme. Un réseau sépare donc les longueurs d’onde : c’est le principe du spectrophotomètre à réseau.', indice: "sin θ = λ ÷ a : θ augmente avec λ." } },
    { id: 'mercure', titre: 'Une lampe à vapeur de mercure', focus: ['reglages', 'ecran'],
      texte: <>Une lampe à vapeur de mercure n’émet que quelques <strong>raies</strong> (longueurs d’onde bien précises). Choisissez-la : vous voyez 4 raies dans chaque ordre. Le réseau (3,3{NB}µm) est celui qu’on a mesuré.</>,
      tache: { type: 'action', ok: reseauHg, label: 'Lampe à mercure', faire: () => { setScene('reseau'); setRz({ pas: 3.3, source: 'mercure', lam: 532, D: 1, expo: 2, x1: -100, x2: 100 }); }, consigne: 'Choisissez « Lampe à mercure » (réseau 3,3 µm, D = 1,00 m)' } },
    { id: 'raie', titre: 'Mesurer une longueur d’onde', focus: ['ecran', 'mesures'],
      retenirTitre: 'À RETENIR : MESURER UNE LONGUEUR D’ONDE',
      retenir: <>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li>Pointer les taches d’ordre −1 et +1 : la distance entre les repères vaut 2x₁.</li>
          <li>Calculer θ₁ = arctan(x₁ / D) (en degrés).</li>
          <li>En déduire λ = a·sin θ₁ / k (avec k = 1) ; convertir en nm.</li>
        </ol>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Pointer un <strong>ordre élevé</strong> (ou plusieurs ordres) réduit l’incertitude relative sur θ, donc sur λ.</li>
          <li>Garder la même unité pour a et D ; λ s’exprime ici en nanomètres (1 µm = 1 000 nm).</li>
        </ul>
      </>,
      texte: <>Placez les repères sur la raie <strong>verte</strong> d’ordre −1 et d’ordre +1, puis calculez sa longueur d’onde avec <em>a</em> = 3,3{NB}µm et <em>D</em> = 1,00{NB}m : <em>λ</em> = <em>a</em>·sin θ₁ (<em>k</em> = 1).</>,
      tache: { type: 'num', q: 'Longueur d’onde λ de la raie verte', unite: 'nm', vrai: lamVertMes, tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        bloque: reseauHg ? (pointeVert ? null : 'Placez d’abord les repères sur la raie verte d’ordre ±1 avec le bouton « Rétablir le réglage » au-dessus de l’image.') : 'Choisissez d’abord la lampe à mercure (étape précédente).',
        calcul: () => [`Distance entre les repères : ${nbf(Lmes, 1)} mm donc x₁ = ${nbf(Lmes / 2, 1)} mm ; D = 1,00 m ; θ₁ = ${nbf(deg(Math.atan2(Lmes / 2, 1000)), 1)}°.`, `λ = a sin θ₁ = 3,3 × 10⁻⁶ × sin(${nbf(deg(Math.atan2(Lmes / 2, 1000)), 1)}°) = ${nbf(lamVertMes, 0)} × 10⁻⁹ m = ${nbf(lamVertMes, 0)} nm.`],
        pieges: [[lamVertMes * 1e-9, 'Le résultat est à donner en nanomètres.'], [3.3e-6 * Math.sin(Math.atan2(Lmes, 1000)) * 1e9, 'Vous avez utilisé la distance entre les deux repères au lieu de x₁ (sa moitié) pour calculer l’angle.']],
        expl: `λ ≈ ${nbf(lamVertMes, 0)} nm : c’est bien une raie verte (valeur exacte de la raie du mercure : 546 nm).`, indice: "λ = a·sin θ ÷ p, avec p = 1." } },
    { id: 'spectro', titre: 'Le spectrophotomètre à réseau', focus: [],
      retenirTitre: 'À RETENIR : LE RÉSEAU DISPERSE LA LUMIÈRE',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Ordre</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Aspect</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Explication</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>k = 0</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>blanche</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>tache centrale, toutes les couleurs superposées</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>k = ±1, ±2…</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>spectres étalés</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>chaque λ est déviée d’un angle différent : sin θ<sub>k</sub> = k·λ / a</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>même ordre</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>rouge plus éloigné du centre que le violet</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>λ plus grande → θ plus grand</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Une lampe à vapeur (mercure) n’émet que des <strong>raies</strong> : quelques longueurs d’onde bien précises, qui donnent des taches colorées séparées.</li>
          <li>Dans un <strong>spectrophotomètre</strong>, le réseau sépare les longueurs d’onde : une fente ne laisse passer qu’une petite plage, choisie en tournant le réseau.</li>
        </ul>
      </>,
      texte: <>Dans un spectrophotomètre, la lumière de la lampe est d’abord étalée en spectre par un <strong>réseau</strong>. Une fente ne laisse passer qu’une petite plage de longueurs d’onde à la fois (on tourne le réseau pour choisir laquelle) ; cette lumière traverse ensuite l’échantillon, puis arrive sur le détecteur.</>,
      tache: { type: 'qcm', q: 'Quel est le rôle du réseau dans un spectrophotomètre ?', options: ['séparer les longueurs d’onde de la lumière blanche pour choisir celle qui traverse l’échantillon', 'absorber la lumière que l’échantillon n’absorbe pas', 'augmenter l’intensité de la lumière'], bonne: 0,
        expl: 'Le réseau disperse la lumière : à chaque longueur d’onde correspond une direction. En tournant le réseau, on envoie la longueur d’onde choisie vers la fente de sortie, puis vers l’échantillon et enfin vers le détecteur.', indice: "Le réseau disperse la lumière : que fait-il aux différentes longueurs d’onde ?" } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenirTitre: 'À RETENIR : LE BILAN',
      retenir: <>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Interférences</strong> : ondes synchrones ; constructives si τ = k·T (δ = k·λ), destructives si τ = k·T + T/2 ; τ = δ / v.</li>
          <li><strong>Fentes de Young</strong> : i = λ·D / l, sous l’enveloppe de diffraction ; on mesure plusieurs interfranges.</li>
          <li><strong>Réseau</strong> de pas a : sin θ<sub>k</sub> = k·λ / a ; il disperse la lumière blanche en spectres.</li>
          <li>Plusieurs interfranges ou un ordre élevé réduisent l’incertitude relative.</li>
        </ul>
      </>,
      texte: <>Vous savez interpréter une figure d’interférences, relier retard et distance, et mesurer une distance entre fentes, un pas de réseau ou une longueur d’onde. Essayez maintenant les défis.</>, tache: null },
  ];
  const idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const IDS = ETAPES.map(e => e.id), apres = id => !enGuide || etape > IDS.indexOf(id);      // en parcours guidé, une grandeur n’est affichée qu’après l’étape où l’élève la calcule
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const rendreBase = () => {
    if (idE === 'axe' || idE === 'placer' || idE === 'constructive') setCuve(PRESET_CUVE);
    if (['pointer', 'interfrange', 'calcl', 'pourquoi6'].includes(idE)) { setScene('young'); setYz({ a: 40, l: 300, lam: 532, D: 2.5, expo: 2, x1: -3 * iY, x2: 3 * iY }); }
    if (['ordres', 'theta', 'pas'].includes(idE)) { setScene('reseau'); setRz({ pas: 3.3, source: 'laser', lam: 532, D: 1, expo: 2, x1: -x1k, x2: x1k }); }
    if (idE === 'raie') { setScene('reseau'); setRz({ pas: 3.3, source: 'mercure', lam: 532, D: 1, expo: 2, x1: -xVert, x2: xVert }); }
  };
  const etapeARetablir = enGuide && ['pointer', 'interfrange', 'calcl', 'pourquoi6', 'ordres', 'theta', 'pas', 'raie'].includes(idE);
  const retabliOk = idE === 'raie' ? pointeVert : ['ordres', 'theta', 'pas'].includes(idE) ? pointeReseau : pointeYoung;

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(type) {
    const base = { type, reps: {}, verifie: false };
    if (type === 'fentes') setDefi({ ...base, ...nouvellesFentes() });
    else if (type === 'pas') setDefi({ ...base, ...nouveauPas() });
    else setDefi({ ...base, ...nouvelleLigne() });
    if (type === 'fentes') setYz(z => ({ ...z, D: 2.5, x1: -10, x2: 10 })); else setRz(z => ({ ...z, D: 1, x1: -100, x2: 100 }));
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') { setScene('cuve'); setCuve(PRESET_CUVE); setP(M_DEPART); setVue('ondes'); setLignes(false); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const tolDefi = rel => Math.min(0.1, Math.max(0.04, 2 * rel));
  const reponseDefi = defi && (defi.type === 'fentes' ? defi.l * 1e3 : defi.type === 'pas' ? defi.pas : defi.lam);
  const verifier = () => {
    const x = lireNombre(defi.type === 'raie' ? defi.reps.l : defi.reps.a);
    const rel = defi.type === 'fentes' ? relY : relR;
    const imprecis = rel > 0.08, ok = !imprecis && isFinite(x) && proche(x, reponseDefi, tolDefi(rel));
    setDefi(d => ({ ...d, verifie: true, snapRel: rel, ok, imprecis }));
    (defi.type === 'fentes' ? noterFentes : defi.type === 'pas' ? noterPas : noterRaie)(ok);
  };
  const champReponse = (cle, unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('it-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['fentes', 'Distance entre les fentes'], ['pas', 'Pas du réseau'], ['raie', 'Raie du mercure']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'fentes' ? 'Défi : quelle est la distance entre les deux fentes ?' : defi.type === 'pas' ? 'Défi : quel est le pas du réseau ?' : `Défi : quelle est la longueur d’onde de la raie ${nomRaie(defi.lam)} ?`}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'fentes' && <>Un laser (<em>λ</em> = {defi.lam}{NB}nm) éclaire deux fentes fines de largeur 40{NB}µm dont on ignore l’écartement <em>l</em>. Choisissez <em>D</em>, mesurez plusieurs interfranges, puis déduisez <em>l</em> avec <em>i</em> = <em>λ</em>·<em>D</em> / <em>l</em>.</>}
        {defi.type === 'pas' && <>Un laser (<em>λ</em> = {defi.lam}{NB}nm) éclaire un réseau dont on ignore le pas <em>a</em>. Choisissez <em>D</em>, repérez deux ordres symétriques, de préférence les ordres 1 ou 2 (les plus lumineux, comptés depuis le centre), mesurez l’angle de déviation et déduisez <em>a</em> avec sin <em>θ</em><sub>k</sub> = <em>k</em>·<em>λ</em> / <em>a</em>.</>}
        {defi.type === 'raie' && <>Une lampe à vapeur de mercure éclaire un réseau de pas <em>a</em> = 2,0{NB}µm (500 traits par mm). Mesurez l’angle de déviation de la raie <strong>{nomRaie(defi.lam)}</strong> (dans chaque ordre, de la plus proche du centre à la plus éloignée : violette, bleue, verte, jaune) (ordre 1 ou 2, les plus lumineux, comptés depuis le centre) et déduisez sa longueur d’onde avec <em>λ</em> = <em>a</em>·sin <em>θ</em><sub>k</sub> / <em>k</em>.</>}
      </div>
      {defi.type === 'fentes' && champReponse('a', 'µm', 'Distance l entre les fentes')}
      {defi.type === 'pas' && champReponse('a', 'µm', 'Pas a du réseau')}
      {defi.type === 'raie' && champReponse('l', 'nm', 'Longueur d’onde de la raie')}
      {defi.type === 'fentes' && <IndiceDefi cache={false}>Interfrange i = distance mesurée ÷ nombre d’interfranges ; puis l = λD ÷ i.</IndiceDefi>}
      {defi.type === 'pas' && <IndiceDefi cache={false}>Mesurez l’angle θ d’un ordre p (tan θ = distance au centre ÷ D) : a = p·λ ÷ sin θ.</IndiceDefi>}
      {defi.type === 'raie' && <IndiceDefi cache={false}>λ = a·sin θ ÷ p, avec θ l’angle de déviation de la raie à l’ordre p.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="it-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.imprecis ? '✗ Votre mesure est trop imprécise (incertitude relative supérieure à 8 %) : éloignez l’écran, mesurez plus d’interfranges ou un ordre plus élevé, puis recommencez.' : defi.ok ? `✓ Correct. Valeur de la simulation : ${defi.type === 'fentes' ? nbf(defi.l * 1e3, 0) + ' µm' : defi.type === 'pas' ? nbf(defi.pas, 1) + ' µm' : nbf(defi.lam, 1) + ' nm'}.`
          : (defi.type === 'fentes' ? '✗ Vérifiez : l = λ·D / i, avec i = d / n (n = nombre d’interfranges comptés entre les repères), les repères sur les centres de franges brillantes, et les unités (µm).'
            : defi.type === 'pas' ? '✗ Vérifiez : θ = arctan(x/D) avec x la distance du centre à la tache (la moitié de la distance entre les repères), l’ordre k de la tache (comptez depuis le centre), a = kλ / sin θ, en µm.'
              : '✗ Vérifiez : θ = arctan(x/D), l’ordre k de la raie (comptez depuis le centre), λ = a·sin θ / k, en nm. La raie demandée est la ' + nomRaie(defi.lam) + '.')}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Ondes synchrones, monochromatiques</strong> : même fréquence, déphasage constant (une seule source divisée en deux). Les deux vibreurs sont supposés <strong>en phase</strong>.</li>
      <li><strong>Cuve</strong> : deux sources ponctuelles, ondes circulaires dont l’amplitude décroît en 1/√r, célérité uniforme (profondeur constante), sans réflexion sur les bords. Fréquence 20 Hz (affichage ralenti). La nature « constructive » ou « destructive » est affichée avec une tolérance de 0,1 T sur le retard.</li>
      <li><strong>Fentes de Young</strong> : deux fentes fines identiques (largeur 40 µm), écran loin (D ≫ l²/λ), petits angles : i = λD/l (erreur négligeable ici, θ ≈ 10⁻³ rad). Chaque fente diffracte la lumière : la figure est le produit d’une enveloppe de diffraction et de franges d’interférences.</li>
      <li><strong>Réseau</strong> : N = 30 traits éclairés (un vrai réseau en éclaire des milliers, les taches seraient bien plus fines), traits identiques, équidistants, de largeur 0,3 a. La formule des réseaux sin θ<sub>k</sub> = kλ/a est exacte, sans approximation des petits angles.</li>
      <li><strong>Lampe à mercure</strong> : quatre raies de longueurs d’onde connues {enDefi ? '(à déterminer par la mesure dans le défi)' : '(404,7 ; 435,8 ; 546,1 et 578,0 nm)'} ; le doublet jaune est représenté par une seule raie, à sa valeur moyenne.</li>
      <li><strong>Incertitudes</strong> : pointé de chaque repère à ± 3 pixels de l’image (hypothèse de la simulation), D au mètre ruban à ± 2 mm, longueur d’onde du laser à ± 1 % (notice), pas du réseau annoncé à ± 1 %. Type B : loi rectangulaire (u = demi-étendue / √3), sources indépendantes, les deux pointés indépendants. Le critère de compatibilité 2u suppose un coefficient d’élargissement k = 2 (environ 95 % de confiance pour une loi normale ; davantage pour une loi rectangulaire).</li>
      <li><strong>Affichages</strong> : la vue « amplitude » de la cuve est normalisée localement (elle montre le contraste des franges, pas la décroissance de l’onde avec la distance). Faire varier λ à fréquence fixe revient à changer la célérité des ondes (par exemple la profondeur de l’eau). Dans le montage de Young, les maxima des franges les plus éloignées sont légèrement décalés vers le centre par l’enveloppe de diffraction : l’effet est faible avec des fentes de 40 µm.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const colCourbe = sceneEff === 'young' ? `rgb(${M.rgbLambda(Y.lam).map(c => Math.round(c * 200)).join(',')})` : (sceneEff === 'reseau' && R.source === 'laser') ? `rgb(${M.rgbLambda(R.lam).map(c => Math.round(c * 200)).join(',')})` : '#334155';
  const cfgEcran = useMemo(() => {
    if (sceneEff === 'young') {
      const A = Y.a * 1e-6, L = Y.l * 1e-6, la = Y.lam * 1e-9, rgb = M.rgbLambda(Y.lam);
      return { W: WY, couleurCourbe: colCourbe, aria: dd ? 'Figure d’interférences : franges brillantes régulièrement espacées' : `Figure d’interférences : franges brillantes régulièrement espacées de ${nbf(iY, 1)} millimètres environ`,
        rgbAt: xmm => { const I = M.intensiteEcranYoung(A, L, la, Y.D, xmm * 1e-3), vv = 1 - Math.exp(-Y.expo * 4 * I); return [rgb[0] * vv, rgb[1] * vv, rgb[2] * vv]; },
        profil: xmm => M.intensiteEcranYoung(A, L, la, Y.D, xmm * 1e-3), enveloppe: xmm => M.intFente(A, la, xmm * 1e-3 / Math.hypot(xmm * 1e-3, Y.D)) };
    }
    const pas = R.pas * 1e-6, raies = R.source === 'laser' ? [R.lam] : R.source === 'mercure' ? M.RAIES_MERCURE : Array.from({ length: 31 }, (_, i) => 400 + 10 * i);
    return { W: WR, couleurCourbe: colCourbe, aria: R.source === 'laser' ? 'Figure donnée par un réseau : taches fines régulièrement réparties de part et d’autre de la tache centrale' : R.source === 'mercure' ? 'Spectre de raies du mercure donné par un réseau : quatre raies colorées dans chaque ordre' : 'Spectres de la lumière blanche donnés par un réseau : tache centrale blanche et spectres colorés de part et d’autre',
      rgbAt: xmm => { const c = M.couleurReseau(raies, pas, 30, R.D, xmm * 1e-3, R.source === 'blanche' ? rz.expo / 8 : rz.expo / (R.source === 'mercure' ? 2 : 1)); return c; },
      profil: R.source === 'blanche' ? null : xmm => raies.reduce((s, nm) => s + M.intensiteEcranReseau(pas, 30, M.LARGEUR_TRAIT * pas, nm * 1e-9, R.D, xmm * 1e-3), 0) / raies.length,
      enveloppe: R.source === 'laser' ? xmm => M.intFente(M.LARGEUR_TRAIT * pas, R.lam * 1e-9, xmm * 1e-3 / Math.hypot(xmm * 1e-3, R.D)) : null,
      legende: R.source === 'mercure' ? 'intensité (moyenne des quatre raies)' : null };
  }, [sceneEff, Y.a, Y.l, Y.lam, Y.D, Y.expo, R.pas, R.source, R.lam, R.D, rz.expo, colCourbe, iY, dd]);
  const cfgFinal = { ...cfgEcran, x1, x2, setX };
  const lienBase = (
    etapeARetablir && !retabliOk && <button onClick={rendreBase} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>Rétablir le réglage{idE === 'raie' ? ' (lampe à mercure, repères sur la raie verte)' : ' (repères placés)'}</button>);
  const mDelta3 = cuveBase && Math.abs(delta - 3) < 0.3;
  const reglesCuve = enGuide && (['axe', 'placer', 'constructive'].includes(idE) && !cuveBase
    ? <button onClick={() => { setScene('cuve'); setCuve(PRESET_CUVE); }} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>Rétablir s = 6 cm et λ = 2 cm</button>
    : ['delta', 'tau'].includes(idE) && !mDelta3 && <button onClick={() => { setScene('cuve'); setCuve(PRESET_CUVE); setP({ x: 14, y: M.yPourDelta(6, 3, 14) }); }} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>Rétablir le point M (δ = 3 cm)</button>);
  const zoneScene = sceneEff === 'cuve' ? (
    <CuveDeux s={cuve.s} lam={cuve.lam} vue={vue} anim={anim} lignes={lignes} P={P} setP={setP}/>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Montage scene={sceneEff} source={R.source} lam={sceneEff === 'young' ? Y.lam : R.lam} D={sceneEff === 'young' ? Y.D : R.D}/>
      <div style={cadre('ecran')}><Ecran cfg={cfgFinal}/></div>
      <div role="group" aria-label="Placer les repères" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px' }}>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Placer les repères (curseurs, ou flèches du clavier)</div>
        {[[1, 'Repère 1 (orange)', x1, '#b45309'], [2, 'Repère 2 (bleu)', x2, '#0e7490']].map(([i, n, vv, c]) => <label key={i} style={{ display: 'block', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}><span style={{ fontWeight: 700 }}>{n} : {nbf(vv, 1)}{NB}mm</span>
          <input type="range" aria-label={n} aria-valuetext={`${nbf(vv, 1)} millimètres`} min={-W} max={W} step={W / 200} value={vv} onChange={e => setX(i, parseFloat(e.target.value))} style={{ display: 'block', width: '100%', minHeight: 32, accentColor: c }}/></label>)}
      </div>
    </div>);
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['cuve', 'Cuve à deux sources'], ['young', 'Fentes de Young'], ['reseau', 'Réseau']].map(([k, l]) => <button key={k} onClick={() => setScene(k)} aria-pressed={scene === k} style={stylePetitBouton(scene === k, '#0e7490')}>{l}</button>)}
      </div>}
      {reglesCuve}{lienBase}
      {zoneScene}
      {sceneEff === 'cuve' && <>
        <div role="group" aria-label="Position du point M" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px', marginTop: 8 }}>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Position du point M (glisser sur la cuve, ou curseurs)</div>
          {[['x', 'Distance aux sources', P.x, 2, 35], ['y', 'Hauteur (0 = axe)', P.y, -11, 11]].map(([k, n, vv, mn, mx]) => <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: KIT.txt }}><span style={{ minWidth: 150, fontWeight: 700 }}>{n}</span>
            <input type="range" aria-label={n} aria-valuetext={`${nbf(vv, 1)} centimètres`} min={mn} max={mx} step={0.1} value={vv} onChange={e => setP(p => ({ ...p, [k]: parseFloat(e.target.value) }))} style={{ flex: 1, minHeight: 32 }}/></label>)}
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Vue de dessus. {vue === 'amplitude' ? '« Amplitude » : plus c’est foncé, plus l’eau est agitée.' : 'Clair : crête ; sombre : creux (mouvement ralenti).'} Traits pleins : franges constructives ; tirets : destructives.</div></>}
      {sceneEff !== 'cuve' && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{sceneEff === 'young' ? 'Pointez le centre des franges brillantes avec les curseurs sous l’image (ou en faisant glisser les repères).' : 'Les graduations de la règle sont en millimètres. Chaque tache est un ordre k ; k = 0 au centre.'}</div>}
    </div>);

  const reglages = sceneEff === 'cuve' ? (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Distance s entre les sources" valeur={cuve.s} onChange={v => setCuve(c => ({ ...c, s: v }))} min={2} max={10} pas={0.5} unite="cm" decimales={1} couleur="#475569"/>
      <Curseur nom="Longueur d’onde λ" valeur={cuve.lam} onChange={v => setCuve(c => ({ ...c, lam: v }))} min={0.8} max={3} pas={0.1} unite="cm" decimales={1} couleur="#0e7490"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <button onClick={() => setVue(x => x === 'ondes' ? 'amplitude' : 'ondes')} title="Basculer entre les ondes et l’amplitude" aria-pressed={vue === 'amplitude'} style={stylePetitBouton(vue === 'amplitude', '#0e7490')}>Voir l’amplitude</button>
        <button onClick={() => setLignes(x => !x)} aria-pressed={lignes} style={stylePetitBouton(lignes, '#0f172a')}>Lignes d’interférence</button>
        <button onClick={() => setAnim(x => !x)} disabled={vue === 'amplitude'} aria-pressed={!anim} style={stylePetitBouton(!anim, '#475569')}>Figer l’animation</button>
      </div>
    </div>
  ) : sceneEff === 'young' ? (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        <Curseur nom="Distance l entre les fentes" valeur={yz.l} onChange={v => setY({ l: v })} min={100} max={600} pas={10} unite="µm" decimales={0} couleur="#475569"/>
        <Curseur nom="Largeur de chaque fente" valeur={yz.a} onChange={v => setY({ a: v })} min={30} max={150} pas={5} unite="µm" decimales={0} couleur="#475569"/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{[[405, 'violet'], [532, 'vert'], [650, 'rouge']].map(([nm, n]) => <button key={nm} onClick={() => setY({ lam: nm })} aria-pressed={yz.lam === nm} style={stylePetitBouton(yz.lam === nm, '#0e7490')}>{n} {nm}{NB}nm</button>)}</div>
      </>}
      {enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Laser de longueur d’onde <em>λ</em> = {Y.lam}{NB}nm (notice : ± 1 %). Fentes de largeur 40 µm. Écartement <em>l</em> inconnu.</div>}
      <Curseur nom="Distance fentes – écran D" valeur={yz.D} onChange={v => setY({ D: v })} min={1} max={5} pas={0.25} unite="m" decimales={2} couleur="#b45309"/>
      <Curseur nom="Exposition" valeur={yz.expo} onChange={v => setY({ expo: v })} min={0.5} max={6} pas={0.5} unite="" decimales={1} couleur="#475569"/>
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        <Curseur nom="Pas a du réseau" valeur={rz.pas} onChange={v => setR({ pas: v })} min={1.5} max={8} pas={0.1} unite="µm" decimales={1} couleur="#475569"/>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Source de lumière</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{[['laser', 'Laser'], ['blanche', 'Lumière blanche'], ['mercure', 'Lampe à mercure']].map(([k, n]) => <button key={k} onClick={() => setR({ source: k })} aria-pressed={rz.source === k} style={stylePetitBouton(rz.source === k, '#0e7490')}>{n}</button>)}</div>
        {rz.source === 'laser' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{[[405, 'violet'], [532, 'vert'], [650, 'rouge']].map(([nm, n]) => <button key={nm} onClick={() => setR({ lam: nm })} aria-pressed={rz.lam === nm} style={stylePetitBouton(rz.lam === nm, '#0e7490')}>{n} {nm}{NB}nm</button>)}</div>}
      </>}
      {enDefi && defi?.type === 'pas' && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Laser de longueur d’onde <em>λ</em> = {R.lam}{NB}nm (notice : ± 1 %). Pas <em>a</em> inconnu.</div>}
      {enDefi && defi?.type === 'raie' && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Lampe à mercure ; réseau de pas <em>a</em> = 2,0 µm (étiquette : ± 1 %).</div>}
      <Curseur nom="Distance réseau – écran D" valeur={rz.D} onChange={v => setR({ D: v })} min={0.3} max={1.5} pas={0.05} unite="m" decimales={2} couleur="#b45309"/>
      <Curseur nom="Exposition" valeur={rz.expo} onChange={v => setR({ expo: v })} min={0.5} max={6} pas={0.5} unite="" decimales={1} couleur="#475569"/>
    </div>
  );

  const mesures = sceneEff === 'cuve' ? (
    <div style={{ ...styleBoite, ...cadre('sonde'), ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures au point M</div>
      <LigneMesure nom="Distance r₁ = S₁M" valeur={`${nbf(r1, 2)}${NB}cm`}/>
      <LigneMesure nom="Distance r₂ = S₂M" valeur={`${nbf(r2, 2)}${NB}cm`}/>
      {apres('delta') && <LigneMesure nom="Différence δ = |r₂ − r₁|" valeur={`${nbf(delta, 2)}${NB}cm`} couleur="#b45309"/>}
      <LigneMesure nom="Célérité v = λ × f (f = 20 Hz)" valeur={`${nbf(v, 2)}${NB}m/s`}/>
      {apres('tau') && <LigneMesure nom="Retard τ = δ / v" valeur={`${nbf(tauMs, 0)}${NB}ms`} couleur="#b45309"/>}
      <LigneMesure nom="Période T = 1 / f" valeur={`${nbf(M.T_CUVE * 1e3, 0)}${NB}ms`}/>
      {apres('nature') && <><LigneMesure nom="Rapport τ / T" valeur={nbf(tauT, 2)}/>
        <LigneMesure nom="Interférence en M" valeur={nature} couleur={nature === 'constructive' ? '#15803d' : nature === 'destructive' ? '#b91c1c' : KIT.txt}/></>}
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Repère 1 (orange)" valeur={`${nbf(x1, 1)}${NB}mm`} couleur="#b45309"/>
      <LigneMesure nom="Repère 2 (bleu)" valeur={`${nbf(x2, 1)}${NB}mm`} couleur="#0e7490"/>
      <LigneMesure nom="Distance d entre les repères" valeur={`${nbf(Lmes, 1)}${NB}mm`}/>
      {sceneEff === 'young' && !enDefi && apres('interfrange') && <LigneMesure nom="Interfrange i = d / 6 (6 interfranges)" valeur={`${nbf(Lmes / nY, 2)}${NB}mm`} couleur="#15803d"/>}
      {sceneEff === 'young' && !enDefi && apres('calcl') && <LigneMesure nom="l calculé = λ D / i" valeur={isFinite(lCalc) ? `${nbf(lCalc, 0)}${NB}µm` : '–'} couleur="#15803d"/>}
      {sceneEff === 'reseau' && !enDefi && apres('theta') && <LigneMesure nom="θ₁ = arctan(d / 2D)" valeur={`${nbf(deg(thMes), 1)}${NB}°`} couleur="#15803d"/>}
      {sceneEff === 'reseau' && !enDefi && rz.source === 'laser' && apres('pas') && <LigneMesure nom="a = λ / sin θ₁ (ordre 1)" valeur={isFinite(aMes) ? `${nbf(aMes, 2)}${NB}µm` : '–'} couleur="#15803d"/>}
      {sceneEff === 'reseau' && !enDefi && rz.source === 'mercure' && apres('raie') && <LigneMesure nom="λ = a sin θ₁ (ordre 1)" valeur={isFinite(lamRaieMes) ? `${nbf(lamRaieMes, 0)}${NB}nm` : '–'} couleur="#15803d"/>}
      {mode === 'explore' && sceneEff === 'young' && <LigneMesure nom="i prévu par la formule" valeur={`${nbf(iY, 2)}${NB}mm`} couleur="#15803d"/>}
      {mode === 'explore' && sceneEff === 'reseau' && rz.source === 'laser' && <LigneMesure nom="Ordre maximal (k λ / a < 1)" valeur={`${kMax}`}/>}
    </div>
  );
  const incertBox = sceneEff !== 'cuve' && !(sceneEff === 'reseau' && R.source === 'blanche') && (sceneEff === 'young' ? incY : incR) && (() => {
    const young = sceneEff === 'young', inc = young ? incY : incR, nom = young ? 'l' : (dd?.type === 'raie' || rz.source === 'mercure' ? 'λ' : 'a');
    const lignesInc = young
      ? [['d (2 pointés)', `${nbf(Math.SQRT2 * dx, 2)} mm`, inc.uL / (Lmes * 1e-3), inc.part[0], '#b45309'], ['D (ruban)', `${nbf(dD * 1e3, 0)} mm`, inc.uD / Y.D, inc.part[1], '#b45309'], ['λ (notice)', `${nbf(dLaser(Y.lam), 1)} nm`, inc.uLa / (Y.lam * 1e-9), inc.part[2], '#0e7490']]
      : [[R.source === 'mercure' ? 'pas a (étiquette)' : 'λ (notice)', R.source === 'mercure' ? '± 1 %' : `${nbf(dLaser(R.lam), 1)} nm`, 0.01 / Math.sqrt(3), inc.part[0], '#0e7490'],
        ['x (2 pointés)', `${nbf(Math.SQRT2 * dx / 2, 2)} mm`, Math.sqrt(inc.part[1] * inc.rel ** 2), inc.part[1], '#b45309'], ['D (ruban)', `${nbf(dD * 1e3, 0)} mm`, Math.sqrt(inc.part[2] * inc.rel ** 2), inc.part[2], '#b45309']];
    const absolu = young ? lCalc : (R.source === 'mercure' ? lamRaieMes : aMes), unite = young ? 'µm' : (R.source === 'mercure' ? 'nm' : 'µm');
        return (
      <div style={{ ...styleBoite, ...cadre('incert') }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Incertitude sur {nom}{enDefi ? ' (relative)' : ''}</div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>Type B : u = demi-étendue / √3. Sources supposées indépendantes.</div>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Source</th><th style={{ padding: '2px 4px' }}>± demi-étendue</th><th style={{ padding: '2px 4px' }}>u / valeur</th><th style={{ padding: '2px 4px' }}>poids</th></tr></thead>
          <tbody>{lignesInc.map(([n, dem, r, p, c]) => (
            <tr key={n} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 600 }}>{n}</td><td style={{ padding: '3px 4px' }}>{dem}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(r * 100, 2)} %</td>
              <td style={{ padding: '3px 4px', minWidth: 90 }}><div style={{ background: '#e2e8f0', borderRadius: 4, height: 10 }}><div style={{ width: `${Math.round(p * 100)}%`, background: c, height: '100%', borderRadius: 4 }}/></div><span style={{ fontSize: 11.5 }}>{Math.round(p * 100)} %</span></td></tr>))}</tbody>
        </table>
        <div style={{ marginTop: 6 }}>
          <LigneMesure nom={`u(${nom}) / ${nom}`} valeur={`${nbf(inc.rel * 100, 2)} %`}/>
          {!enDefi && !enGuide && <LigneMesure nom={`u(${nom})`} valeur={isFinite(absolu) ? `${nbf(absolu * inc.rel, absolu * inc.rel < 1 ? 2 : absolu * inc.rel < 10 ? 1 : 0)}${NB}${unite}` : '–'} couleur="#15803d"/>}
          {enDefi && <LigneMesure nom="Intervalle ± 2 u / valeur" valeur={`${nbf(2 * inc.rel * 100, 1)} %`}/>}
        </div>
      </div>);
  })();

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Cuve : placez M sur chaque frange agitée en suivant une ligne en trait plein. Que vaut le retard τ en fonction de <em>k</em> ?</li>
        <li>Cuve : augmentez λ jusqu’à ce que λ dépasse la distance s entre les sources. Que devient la figure ? Pourquoi ?</li>
        <li>Young : doublez la distance l entre les fentes. Comment varie l’interfrange ? Et si vous passez du laser rouge au laser violet ?</li>
        <li>Young : changez la largeur a des fentes. Qu’est-ce qui change, les franges ou l’enveloppe ?</li>
        <li>Réseau : diminuez le pas a. Les ordres se rapprochent-ils ou s’écartent-ils ? Combien d’ordres restent visibles ?</li>
        <li>Réseau : cherchez le pas pour lequel un seul ordre (k = ±1) reste observable avec le laser vert.</li>
        <li>Réseau : éclairez en lumière blanche. L’ordre 2 se recouvre-t-il avec l’ordre 3 ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>interférences : superposition d’ondes synchrones ; constructive si τ = kT, destructive si τ = kT + T/2</li>
        <li>fentes de Young : i = λ D / l</li>
        <li>réseau : sin θ<sub>k</sub> = k λ / a ; il disperse la lumière blanche</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .it-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .it-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .it-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .it-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .it-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .it-l1.cote .it-carte { order: 2; } .it-l1.cote .it-main { order: 1; } }
        @media (max-width: 900px) { .it-l1.cote, .it-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Interférences et réseaux</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Deux ondes <strong>synchrones</strong> qui se superposent <strong>interfèrent</strong> : l’amplitude est maximale là où elles arrivent en phase, minimale là où elles arrivent en opposition de phase. On l’observe avec des ondes à la surface de l’eau comme avec la lumière (fentes de Young, réseau).</div>
      <div className={`it-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="it-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="it-carte">{panneauHypo}</div> : null}
        <div className="it-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'fentes' ? suiviFentes : defi.type === 'pas' ? suiviPas : suiviRaie}/></div>}
          <div className={`it-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}{incertBox}</div>
          </div>
        </div>
      </div>
      {!enDefi && <div className="it-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="it-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
