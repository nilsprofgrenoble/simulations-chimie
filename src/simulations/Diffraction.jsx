import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef, useMemo, useDeferredValue } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./ondesModele";

const SIM_ID = 83;
declarerDefis(SIM_ID, [['fil', 'Le fil est-il conforme à l’annonce ?'], ['laser', 'Quelle est la couleur du laser ?']]);

// ====================================================
//  SIM 83 — DIFFRACTION DES ONDES : cuve à ondes, puis laser sur une fente, un fil ou un trou ; mesure d’une dimension et incertitude
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fn = v => nbf(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
const deg = r => r / M.RAD;

// ---------- cuve à ondes ----------
const CUVE = { W: 600, H: 360, PXCM: 20, MUR: 160, GX: 200, GY: 120 };          // 30 cm × 18 cm ; mur à 8 cm du bord gauche ; grille de calcul 200 × 120
const PRESETS_CUVE = { a: 6, lam: 1 };

function CuveOndes({ a, lam, vue, anim, angle }) {
  const ref = useRef(null);
  const aD = useDeferredValue(a), lD = useDeferredValue(lam);
  // Les amplitudes complexes sont recalculées seulement quand a ou λ changent ; l’animation ne fait ensuite qu’une rotation de phase
  const champ = useMemo(() => {
    const dx = (CUVE.W - CUVE.MUR) / CUVE.PXCM / CUVE.GX, dy = CUVE.H / CUVE.PXCM / CUVE.GY;
    const xs = Array.from({ length: CUVE.GX }, (_, i) => (i + 0.5) * dx), ys = Array.from({ length: CUVE.GY }, (_, j) => (j + 0.5) * dy - CUVE.H / CUVE.PXCM / 2);
    return M.champCuve({ a: aD, lambda: lD, xs, ys, N: Math.max(16, Math.min(80, Math.round(aD / lD * 8))) });
  }, [aD, lD]);
  const t = useRef(0);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(CUVE.W, CUVE.H), d = img.data;
    const k = 2 * Math.PI / lD, w = 2 * Math.PI * 0.6;                                   // 0,6 Hz affiché : un cycle lent, lisible
    let raf, dernier = performance.now();
    const dessine = () => {
      const ph = w * t.current, c = Math.cos(ph), s = Math.sin(ph);
      for (let y = 0; y < CUVE.H; y++) {
        const jy = Math.min(CUVE.GY - 1, Math.floor(y / CUVE.H * CUVE.GY)), yy = (y + 0.5 - CUVE.H / 2) / CUVE.PXCM;
        for (let x = 0; x < CUVE.W; x++) {
          let v;
          const o = (y * CUVE.W + x) * 4;
          if (x < CUVE.MUR) {                                                                      // avant le mur : onde plane incidente
            const xx = (x - CUVE.MUR) / CUVE.PXCM;
            v = vue === 'intensite' ? 0.5 : Math.cos(k * xx - ph);
            if (vue === 'intensite') { d[o] = 224; d[o + 1] = 232; d[o + 2] = 240; d[o + 3] = 255; continue; }
          } else {
            const jx = Math.min(CUVE.GX - 1, Math.floor((x - CUVE.MUR) / (CUVE.W - CUVE.MUR) * CUVE.GX)), i = jy * CUVE.GX + jx;
            if (vue === 'intensite') {
              const I = champ.re[i] ** 2 + champ.im[i] ** 2, g = Math.min(1, Math.sqrt(I) / 1.15);
              d[o] = 235 - 190 * g; d[o + 1] = 242 - 130 * g; d[o + 2] = 250 - 30 * g; d[o + 3] = 255; continue;
            }
            v = champ.re[i] * c + champ.im[i] * s;
          }
          const q = Math.max(-1, Math.min(1, v / 1.15)) * 0.5 + 0.5;                                // 0 (creux) → 1 (crête)
          d[o] = 40 + 195 * q; d[o + 1] = 100 + 140 * q; d[o + 2] = 160 + 90 * q; d[o + 3] = 255;
        }
      }
      // mur : deux blocs de part et d’autre de l’ouverture
      const yh = aD * CUVE.PXCM / 2, y0 = CUVE.H / 2 - yh, y1 = CUVE.H / 2 + yh;
      for (let y = 0; y < CUVE.H; y++) if (y < y0 || y > y1) for (let x = CUVE.MUR - 5; x < CUVE.MUR + 5; x++) { const o = (y * CUVE.W + x) * 4; d[o] = 71; d[o + 1] = 85; d[o + 2] = 105; d[o + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    };
    const boucle = now => { if (anim) t.current += Math.min(0.05, (now - dernier) / 1000); dernier = now; dessine(); raf = anim ? requestAnimationFrame(boucle) : null; };
    if (anim) raf = requestAnimationFrame(boucle); else dessine();
    return () => raf && cancelAnimationFrame(raf);
  }, [champ, lD, vue, anim, aD]);
  const th = M.demiOuvertureCuve(a, lam), cx = CUVE.MUR, cy = CUVE.H / 2;
  return (
    <div style={{ position: 'relative', lineHeight: 0 }}>
      <canvas ref={ref} width={CUVE.W} height={CUVE.H} style={{ width: '100%', borderRadius: 8, display: 'block', background: '#e0e8f0' }}
        role="img" aria-label={`Cuve à ondes vue de dessus : une onde plane arrive de la gauche sur un mur percé d’une ouverture de ${nbf(a, 1)} cm ; longueur d’onde ${nbf(lam, 2)} cm`}/>
      <svg viewBox={`0 0 ${CUVE.W} ${CUVE.H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {angle && lam < a && <g stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" fill="none">
          <line x1={cx} y1={cy} x2={cx + 300 * Math.cos(th)} y2={cy - 300 * Math.sin(th)}/><line x1={cx} y1={cy} x2={cx + 300 * Math.cos(th)} y2={cy + 300 * Math.sin(th)}/>
          <path d={`M${cx + 70},${cy} A70,70 0 0 0 ${cx + 70 * Math.cos(th)},${cy - 70 * Math.sin(th)}`}/>
          <text x={cx + 78} y={cy - 12} fill="#dc2626" fontSize="18" fontWeight="700" stroke="none">θ</text></g>}
        <g stroke="#0f172a" strokeWidth="1.5" fill="none"><line x1="20" y1="342" x2={20 + lam * CUVE.PXCM} y2="342"/><line x1="20" y1="336" x2="20" y2="348"/><line x1={20 + lam * CUVE.PXCM} y1="336" x2={20 + lam * CUVE.PXCM} y2="348"/></g>
        <text x={20 + lam * CUVE.PXCM / 2} y="330" fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">λ</text>
        <g stroke="#0f172a" strokeWidth="1.5"><line x1={cx + 14} y1={cy - a * CUVE.PXCM / 2} x2={cx + 14} y2={cy + a * CUVE.PXCM / 2}/><line x1={cx + 8} y1={cy - a * CUVE.PXCM / 2} x2={cx + 20} y2={cy - a * CUVE.PXCM / 2}/><line x1={cx + 8} y1={cy + a * CUVE.PXCM / 2} x2={cx + 20} y2={cy + a * CUVE.PXCM / 2}/></g>
        <text x={cx + 26} y={cy + 5} fontSize="15" fontWeight="700" fill="#0f172a">a</text>
      </svg>
    </div>);
}

// ---------- laser, objet, écran ----------
const LASERS = [{ nm: 405, nom: 'violet' }, { nm: 532, nom: 'vert' }, { nm: 650, nom: 'rouge' }];
const ZOOMS = [{ W: 60, nom: '× 1' }, { W: 20, nom: '× 3' }, { W: 6, nom: '× 10' }];          // demi-largeur de l’image de l’écran (mm)
const IMG = { W: 600, H: 140 };
const dLambda = lam => 0.01 * lam;                       // notice du laser : ± 1 % (demi-étendue, nm)
const dD = 2e-3;                                          // mètre ruban : ± 2 mm sur D
const dPointe = W => W / 100;                             // pointage d’une extinction : ± 3 pixels de l’image (mm)
const OBJETS = [['fente', 'Fente'], ['fil', 'Fil'], ['trou', 'Trou circulaire']];

function Ecran({ L }) {
  const { objet, a, lam, D, expo, zoom, x1, x2, setX, mesure, montrerPrevu, noms } = L;
  const W = ZOOMS[zoom].W, mmpx = W / (IMG.W / 2);
  const ref = useRef(null), glisse = useRef(null);
  const rgb = useMemo(() => L.gris ? [0.8, 0.8, 0.8] : M.rgbLambda(lam), [lam, L.gris]);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(IMG.W, IMG.H), d = img.data;
    const A = a * 1e-6, la = lam * 1e-9, prof = new Float32Array(IMG.W);
    if (objet !== 'trou') for (let x = 0; x < IMG.W; x++) prof[x] = M.intensiteEcran(objet, A, la, D, (x - IMG.W / 2 + 0.5) * mmpx * 1e-3);
    for (let y = 0; y < IMG.H; y++) for (let x = 0; x < IMG.W; x++) {
      const I = objet === 'trou' ? M.intensiteEcran('trou', A, la, D, (x - IMG.W / 2 + 0.5) * mmpx * 1e-3, (y - IMG.H / 2 + 0.5) * mmpx * 1e-3) : prof[x];
      const v = 1 - Math.exp(-expo * 4 * I), o = (y * IMG.W + x) * 4;
      d[o] = 255 * rgb[0] * v; d[o + 1] = 255 * rgb[1] * v; d[o + 2] = 255 * rgb[2] * v; d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [objet, a, lam, D, expo, W, rgb, mmpx]);
  const px = mm => IMG.W / 2 + mm / mmpx;
  const versMm = e => { const r = ref.current.getBoundingClientRect(); return Math.max(-W, Math.min(W, ((e.clientX - r.left) / r.width * IMG.W - IMG.W / 2) * mmpx)); };
  // graduations de la règle (mm) : pas adapté au cadrage
  const pas = W >= 40 ? 2 : W >= 12 ? 1 : 0.2, etiq = W >= 40 ? 10 : W >= 12 ? 5 : 1;
  const ticks = []; for (let m = -Math.floor(W / pas) * pas; m <= W + 1e-9; m += pas) ticks.push(Math.round(m / pas) * pas);
  const Lp = M.largeurTache(objet, a * 1e-6, lam * 1e-9, D) * 1e3;                       // mm
  // profil d’intensité (courbe) sous l’image
  const courbe = useMemo(() => {
    const A = a * 1e-6, la = lam * 1e-9; let dd = '';
    for (let x = 0; x <= IMG.W; x += 2) { const I = M.intensiteEcran(objet, A, la, D, (x - IMG.W / 2) * mmpx * 1e-3, 0); dd += `${x ? 'L' : 'M'}${x},${(58 - 54 * Math.min(1, I)).toFixed(1)} `; }
    return dd;
  }, [objet, a, lam, D, mmpx]);
  const mk = (xm, col, i) => (
    <g key={i} className="df-rep" style={{ cursor: 'ew-resize' }} onPointerDown={e => { glisse.current = i; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); }}>
      <line x1={px(xm)} y1="0" x2={px(xm)} y2={IMG.H} stroke="#fff" strokeWidth="5"/><line x1={px(xm)} y1="0" x2={px(xm)} y2={IMG.H} stroke={col} strokeWidth="2.5"/><text x={px(xm) + 9} y="22" fontSize="15" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="3" paintOrder="stroke">{i}</text><rect x={px(xm) - 30} y="0" width="60" height={IMG.H} fill="transparent"/>
      <path d={`M${px(xm) - 6},0 L${px(xm) + 6},0 L${px(xm)},9 z`} fill={col}/></g>);
  return (
    <div>
      <div style={{ position: 'relative', lineHeight: 0 }}>
        <canvas ref={ref} width={IMG.W} height={IMG.H} style={{ width: '100%', display: 'block', borderRadius: '8px 8px 0 0', background: '#000' }}
          role="img" aria-label={`Figure de diffraction d’un laser ${noms.laser} par ${noms.objet}, sur un écran`}/>
        <svg aria-hidden="true" viewBox={`0 0 ${IMG.W} ${IMG.H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
          onPointerMove={e => { if (glisse.current != null) setX(glisse.current, versMm(e)); }} onPointerUp={() => { glisse.current = null; }} onPointerLeave={() => { glisse.current = null; }}>
          {mesure && [mk(x1, '#f59e0b', 1), mk(x2, '#22d3ee', 2)]}
        </svg>
      </div>
      <svg viewBox={`0 0 ${IMG.W} 34`} style={{ width: '100%', display: 'block', background: '#f1f5f9' }} aria-label="Règle graduée en millimètres">
        {ticks.map(m => { const big = Math.abs(m / etiq - Math.round(m / etiq)) < 1e-6; return <g key={m}><line x1={px(m)} y1="0" x2={px(m)} y2={big ? 12 : 6} stroke="#475569" strokeWidth="1"/>
          {big && px(m) > 14 && px(m) < IMG.W - 22 && <text x={px(m)} y="26" fontSize="11" textAnchor="middle" fill="#334155">{String(m).replace('.', ',')}</text>}</g>; })}
        <text x={IMG.W - 4} y="10" fontSize="11" textAnchor="end" fill="#334155">mm</text>
      </svg>
      <svg viewBox={`0 0 ${IMG.W} 64`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: '0 0 8px 8px', borderTop: '1px solid #e2e8f0' }} role="img" aria-label="Profil d’intensité lumineuse le long de l’écran">
        <path d={courbe} fill="none" stroke={`rgb(${rgb.map(c => Math.round(c * 200)).join(',')})`} strokeWidth="2"/>
        <line x1="0" y1="58" x2={IMG.W} y2="58" stroke="#94a3b8" strokeWidth="0.8"/>
        <text x="6" y="14" fontSize="11" fill="#475569">intensité</text>
        {montrerPrevu && <g stroke="#15803d" strokeDasharray="4 3" strokeWidth="1.5"><line x1={px(-Lp / 2)} y1="4" x2={px(-Lp / 2)} y2="58"/><line x1={px(Lp / 2)} y1="4" x2={px(Lp / 2)} y2="58"/></g>}
      </svg>
    </div>);
}

function Montage({ objet, a, lam, D, gris }) {
  const col = `rgb(${(gris ? [0.6, 0.6, 0.6] : M.rgbLambda(lam)).map(c => Math.round(c * 230)).join(',')})`;
  const ox = 230, ex = 500;
  return (
    <svg viewBox="0 0 600 130" style={{ width: '100%', display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img" aria-label="Schéma du montage : laser, objet diffractant, écran">
      <rect x="20" y="52" width="70" height="26" rx="4" fill="#1e293b"/><text x="55" y="70" fontSize="12" fontWeight="700" fill="white" textAnchor="middle">laser</text>
      <line x1="90" y1="65" x2={ox} y2="65" stroke={col} strokeWidth="3"/>
      {objet === 'fente' && <g fill="#475569"><rect x={ox - 4} y="10" width="8" height="48"/><rect x={ox - 4} y="72" width="8" height="48"/></g>}
      {objet === 'fil' && <g><rect x={ox - 3} y="58" width="6" height="14" fill="#475569"/><text x={ox + 10} y="48" fontSize="12" fill="#334155">fil</text></g>}
      {objet === 'trou' && <g fill="#475569"><rect x={ox - 4} y="10" width="8" height="48"/><rect x={ox - 4} y="72" width="8" height="48"/><circle cx={ox} cy="65" r="6" fill="#f8fafc" stroke="#475569"/></g>}
      <path d={`M${ox},65 L${ex},48 L${ex},82 Z`} fill={col} opacity="0.22"/>
      <line x1={ex} y1="10" x2={ex} y2="120" stroke="#0f172a" strokeWidth="4"/><text x={ex + 8} y="20" fontSize="12" fill="#334155">écran</text>
      <g stroke="#334155" strokeWidth="1.2" fill="none"><line x1={ox} y1="122" x2={ex} y2="122"/><line x1={ox} y1="116" x2={ox} y2="128"/><line x1={ex} y1="116" x2={ex} y2="128"/></g>
      <text x={(ox + ex) / 2} y="116" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">D</text>
      <g stroke="#dc2626" strokeWidth="2"><line x1={ex - 12} y1="48" x2={ex - 12} y2="82"/><line x1={ex - 18} y1="48" x2={ex - 6} y2="48"/><line x1={ex - 18} y1="82" x2={ex - 6} y2="82"/></g>
      <text x={ex - 24} y="69" fontSize="13" fontWeight="700" fill="#dc2626" textAnchor="end">L</text>
      <text x={ox + 10} y="96" fontSize="13" fontWeight="700" fill="#0f172a">{objet === 'trou' ? 'd' : 'a'}</text>
      <text x="4" y="12" fontSize="11" fill="#64748b">schéma non à l’échelle</text>
    </svg>);
}

// ---------- défis : données tirées au hasard ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const NOMINAUX = [150, 200, 250, 300];                    // µm : diamètres annoncés par le fabricant (fil)
const nouveauFil = () => {
  const nom = tire(NOMINAUX), ecart = tire([0.0, 0.0, 0.07, -0.07, 0.1, -0.1]);       // écarts nuls ou détectables : un écart de 1 % serait inférieur à la résolution du protocole
  return { nom, vrai: nom * (1 + ecart) };
};
const nouveauLaser = () => tire([405, 473, 532, 594, 635, 650]);

export function SimulationDiffraction({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('diffraction-guide-v1'));
  useSignalerMode(mode);
  const [suiviFil, noterFil] = useCompteurDefi(), [suiviLaser, noterLaser] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('diffraction-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('cuve');
  const [cuve, setCuve] = useState(() => mode === 'guide' && guide.etape === 0 ? { a: 10, lam: 1 } : PRESETS_CUVE);
  const [vue, setVue] = useState('ondes'), [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; } }), [angle, setAngle] = useState(false);
  const [lz, setLz] = useState({ objet: 'fente', a: 100, lam: 532, D: 2, expo: 2, zoom: 0, x1: -6, x2: 6 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const setL = f => setLz(l => ({ ...l, ...f }));
  const setX = (i, v) => setLz(l => ({ ...l, [i === 1 ? 'x1' : 'x2']: v }));

  // en défi, les données viennent du défi
  const dd = enDefi && defi ? defi : null;
  const objetEff = dd ? dd.objet : lz.objet, aEff = dd ? dd.a : lz.a, lamEff = dd ? dd.lam : lz.lam;
  const W = ZOOMS[lz.zoom].W;
  const A = aEff * 1e-6, la = lamEff * 1e-9;
  const Lp = M.largeurTache(objetEff, A, la, lz.D) * 1e3;                          // mm (valeur « vraie » du modèle)
  const Lmes = Math.abs(lz.x2 - lz.x1);                                              // mm (lue par l’élève)
  const dx = dPointe(W), dLm = Math.SQRT2 * dx;                                        // demi-étendue sur L : deux pointés indépendants
  const aCalc = Lmes > 0 ? M.tailleDepuisL(objetEff, Lmes * 1e-3, la, lz.D) * 1e6 : NaN;     // µm, avec les données de l’énoncé (λ, D)
  const inc = Lmes > 0 ? M.incertitudeTaille({ a: aCalc * 1e-6, L: Lmes * 1e-3, D: lz.D, lambda: la, dL: dLm * 1e-3, dD, dLambda: (enDefi && defi?.type === 'laser' ? 0.005 * lamEff : dLambda(lamEff)) * 1e-9 }) : null;
  const horsCadre = Lp / 2 > W;
  const noms = { laser: M.nomCouleur(lamEff), objet: objetEff === 'fente' ? 'une fente' : objetEff === 'fil' ? 'un fil' : 'un trou circulaire' };

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const aEx = 100e-6, lEx = 532e-9, DEx = 2;
  const surLaser = scene === 'laser';
  const laserDeBase = surLaser && lz.objet === 'fente' && lz.a === 100 && lz.lam === 532 && lz.D === 2 && lz.zoom === 0;
  const tolPointe = 1.2 * dx;
  const pointe = Math.abs(lz.x1 + Lp / 2) <= tolPointe && Math.abs(lz.x2 - Lp / 2) <= tolPointe;
  const poidsTxt = p => p.map(x => Math.round(100 * x)).join(' % ; ') + ' %';
  const ETAPES = [
    { id: 'onde', titre: 'Une onde rencontre une ouverture', focus: ['scene'],
      texte: <>Dans cette <strong>cuve à ondes</strong> (vue de dessus), une onde plane arrive de la gauche sur un mur percé d’une ouverture de largeur <em>a</em>. Ici <em>a</em> = 10{NB}cm, très grande devant la longueur d’onde <em>λ</em> = 1{NB}cm.</>,
      tache: { type: 'qcm', q: 'Derrière une ouverture aussi large, les ondes…', options: ['continuent presque tout droit, en un faisceau de la largeur de l’ouverture', 'repartent dans toutes les directions', 'sont arrêtées par le mur'], bonne: 0,
        expl: 'Quand l’ouverture est très grande devant la longueur d’onde, l’onde passe presque sans être déviée : on peut décrire sa propagation par un faisceau rectiligne. Seuls les bords s’étalent un peu.' } },
    { id: 'reduire', titre: 'Rétrécir l’ouverture', focus: ['scene', 'reglages'],
      texte: <>Gardez <em>λ</em> = 1{NB}cm et réduisez l’ouverture à <em>a</em> = 2{NB}cm.</>,
      tache: { type: 'action', ok: scene === 'cuve' && cuve.a <= 2.5 && Math.abs(cuve.lam - 1) < 0.15, label: 'Régler a = 2 cm', faire: () => { setScene('cuve'); setCuve({ a: 2, lam: 1 }); }, consigne: 'Réglez l’ouverture à 2 cm' } },
    { id: 'etale', titre: 'Les ondes s’étalent', focus: ['scene'],
      texte: <>Les ondes ne restent plus dans le prolongement de l’ouverture : elles <strong>se diffractent</strong>. Comparez avec l’étape précédente.</>,
      tache: { type: 'qcm', q: 'Quand on rétrécit l’ouverture, la zone atteinte derrière le mur…', options: ['s’élargit : la diffraction est plus marquée', 'se rétrécit', 'ne change pas'], bonne: 0,
        expl: 'Plus l’ouverture est petite, plus les ondes s’étalent. La diffraction est un étalement des directions de propagation qui apparaît quand une onde est limitée par une ouverture ou un obstacle.' } },
    { id: 'lambda', titre: 'Et si on change la longueur d’onde ?', focus: ['reglages'],
      texte: <>Prenez <em>a</em> = 4{NB}cm, puis comparez <em>λ</em> = 1{NB}cm et <em>λ</em> = 2{NB}cm.</>,
      tache: { type: 'qcm', q: 'Pour une ouverture donnée, plus la longueur d’onde est grande…', options: ['plus la diffraction est importante', 'moins la diffraction est importante', 'la diffraction ne dépend pas de λ'], bonne: 0,
        expl: 'La diffraction dépend du rapport entre la longueur d’onde λ et la taille a de l’ouverture. Elle est d’autant plus marquée que λ est grande ou que a est petite.' } },
    { id: 'regler', titre: 'Afficher l’ouverture angulaire', focus: ['scene', 'reglages'],
      texte: <>Réglez <em>a</em> = 4{NB}cm et <em>λ</em> = 1{NB}cm, puis affichez la <strong>écart angulaire θ</strong> (traits rouges) : c’est l’écart angulaire qui limite la zone où l’onde est intense.</>,
      tache: { type: 'action', ok: scene === 'cuve' && Math.abs(cuve.a - 4) < 0.15 && Math.abs(cuve.lam - 1) < 0.1 && angle && vue === 'intensite', label: 'Régler et afficher θ',
        faire: () => { setScene('cuve'); setCuve({ a: 4, lam: 1 }); setAngle(true); setVue('intensite'); }, consigne: 'a = 4 cm, λ = 1 cm, vue « Amplitude », écart angulaire affichée' } },
    { id: 'theta', titre: 'L’angle d’ouverture', focus: ['mesures'],
      texte: <>Pour les petits angles, l’écart angulaire est donné par <strong>θ = λ / a</strong> (en radians, <em>λ</em> et <em>a</em> dans la même unité). Calculez-la pour ce réglage (<em>a</em> = 4{NB}cm ; <em>λ</em> = 1{NB}cm).</>,
      tache: { type: 'num', q: 'Écart angulaire θ', unite: 'rad', vrai: 0.25, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        bloque: scene === 'cuve' && Math.abs(cuve.a - 4) < 0.15 && Math.abs(cuve.lam - 1) < 0.1 ? null : 'Réglez d’abord a = 4 cm et λ = 1 cm (étape précédente).',
        calcul: () => ['Hypothèse : petits angles, donc θ ≈ λ / a.', 'λ et a sont déjà dans la même unité (le centimètre), le rapport n’a pas d’unité.', 'θ = 1 / 4 = 0,25 rad.'],
        pieges: [[14.3, 'Vous avez donné l’angle en degrés. La relation θ = λ/a donne des radians : θ = 0,25 rad (≈ 14°).'], [4, 'Division à l’envers : θ = λ / a, pas a / λ.']],
        expl: 'θ = λ / a = 1 / 4 = 0,25 rad, soit environ 14°. Les traits rouges tracés par la simulation (arcsin λ/a ≈ 14,5°) confirment que θ ≈ λ/a est une bonne approximation ici.' } },
    { id: 'porte', titre: 'On entend derrière une porte, mais on ne voit pas', focus: [],
      texte: <>Une voix a une longueur d’onde d’environ 0,5{NB}m ; la lumière visible, d’environ 0,5{NB}µm. La porte ouverte mesure 0,9{NB}m de large.</>,
      tache: { type: 'qcm', q: 'Pourquoi entend-on quelqu’un parler derrière la porte sans le voir ?', options: ['le son se diffracte beaucoup (λ comparable à a), la lumière presque pas (λ ≪ a)', 'le son est plus rapide que la lumière', 'la lumière est absorbée par le mur'], bonne: 0,
        expl: 'Pour le son, λ ≈ 0,5 m est du même ordre que l’ouverture : il s’étale largement et contourne l’embrasure. Pour la lumière, λ ≈ 0,5 µm est un million de fois plus petite que la porte : la diffraction est invisible.' } },
    { id: 'laser', titre: 'La lumière aussi se diffracte', focus: ['scene', 'reglages'],
      texte: <>Pour voir la diffraction de la lumière, il faut une ouverture très fine, de l’ordre de 0,1{NB}mm. Passez au <strong>laser</strong> : un laser vert (<em>λ</em> = 532{NB}nm) éclaire une fente de largeur <em>a</em> = 100{NB}µm ; l’écran est à <em>D</em> = 2,00{NB}m.</>,
      tache: { type: 'action', ok: laserDeBase, label: 'Passer au laser', faire: () => { setScene('laser'); setLz(l => ({ ...l, objet: 'fente', a: 100, lam: 532, D: 2, expo: 2, zoom: 0, x1: -6, x2: 6 })); }, consigne: 'Laser vert, fente de 100 µm, écran à 2,00 m' } },
    { id: 'figure', titre: 'Lire la figure de diffraction', focus: ['ecran'],
      texte: <>La figure comporte une <strong>tache centrale</strong> très lumineuse, bordée de zones sombres (<strong>extinctions</strong>, ou minima d’intensité), puis de <strong>taches secondaires</strong> beaucoup moins lumineuses.</>,
      tache: { type: 'qcm', q: 'La largeur L de la tache centrale se mesure…', options: ['entre les deux extinctions qui l’encadrent', 'entre les deux taches secondaires les plus lumineuses', 'du bord de l’écran à la tache'], bonne: 0,
        expl: 'La tache centrale est limitée par les deux premières extinctions : L est la distance entre leurs centres. On pointe les minima, pas les bords flous de la tache.' } },
    { id: 'pointer', titre: 'Pointer les extinctions', focus: ['ecran', 'mesures'],
      texte: <>Faites glisser les deux repères (orange et bleu) sur le <strong>centre</strong> des deux premières extinctions, de part et d’autre de la tache centrale. Pointez les minima de la courbe d’intensité sous l’image (les creux), et non le bord de la tache lumineuse, qui paraît plus étroite à cause de la saturation.</>,
      tache: { type: 'action', ok: laserDeBase && pointe, bloque: laserDeBase ? null : 'Revenez au réglage de base avec le bouton « Rétablir le réglage » sous les onglets.', consigne: 'Placez les deux repères sur les centres des deux premières extinctions', label: 'Placer pour moi', faire: () => setLz(l => ({ ...l, x1: -Lp / 2, x2: Lp / 2 })) } },
    { id: 'lireL', titre: 'La largeur de la tache centrale', focus: ['mesures'],
      texte: <>Lisez dans « Mesures » la largeur <em>L</em> entre vos deux repères.</>,
      tache: { type: 'num', q: 'Largeur L de la tache centrale', unite: 'mm', vrai: Lmes, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        bloque: laserDeBase && pointe ? null : 'Placez d’abord les repères sur les extinctions (étape précédente) ou utilisez le bouton « Rétablir le réglage ».',
        aide: 'C’est une lecture, sans calcul : recopiez la valeur de L affichée dans « Mesures », en millimètres.', pieges: [[Lmes / 10, 'Vous avez donné L en centimètres. L’unité demandée est le millimètre.']],
        expl: `L ≈ ${nbf(Lmes, 1)} mm (valeur lue entre vos deux repères).` } },
    { id: 'calculA', titre: 'En déduire la largeur de la fente', focus: ['mesures'],
      texte: <>Pour une fente de largeur <em>a</em>, la tache centrale a pour largeur <strong>L = 2 λ D / a</strong>. Isolez <em>a</em> et calculez-la en micromètres (<em>λ</em> = 532{NB}nm, <em>D</em> = 2,00{NB}m, <em>L</em> = {nbf(Lmes, 1)}{NB}mm mesurée à l’étape précédente).</>,
      tache: { type: 'num', q: 'Largeur a de la fente', unite: 'µm', vrai: aCalc, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        bloque: laserDeBase && pointe ? null : 'Placez d’abord les repères sur les extinctions.',
        calcul: () => ['Hypothèses : petits angles et écran loin de la fente. La relation L = 2λD/a donne a = 2λD / L.',
          `Unités SI : λ = 532 nm = 532 × 10⁻⁹ m ; D = 2,00 m ; L = ${nbf(Lmes, 1)} mm = ${nbf(Lmes, 1)} × 10⁻³ m.`,
          `a = 2 × 532 × 10⁻⁹ × 2,00 / (${nbf(Lmes, 1)} × 10⁻³) = ${nbf(aCalc * 1e-6 * 1e4, 2)} × 10⁻⁴ m = ${nbf(aCalc, 0)} µm.`],
        pieges: [[aCalc / 2, 'Il manque le facteur 2 : L = 2λD/a, donc a = 2λD/L.'], [aCalc * 1e-6, 'Vérifiez l’unité : le résultat est à donner en micromètres (1 µm = 10⁻⁶ m).'], [aCalc * 2, 'Un facteur 2 en trop : a = 2λD/L.']],
        expl: 'a = 2λD/L : la fente mesure environ un dixième de millimètre (valeur exacte : 100 µm ; l’écart vient du pointé).' } },
    { id: 'fil', titre: 'Et si c’était un fil ?', focus: ['reglages', 'ecran'],
      texte: <>Remplacez la fente par un <strong>fil</strong> de même diamètre (100{NB}µm) et comparez les deux figures.</>,
      tache: { type: 'action', ok: surLaser && lz.objet === 'fil' && lz.a === 100 && lz.lam === 532 && lz.D === 2, label: 'Mettre un fil de 100 µm', faire: () => { setScene('laser'); setL({ objet: 'fil', a: 100, lam: 532, D: 2 }); }, consigne: 'Choisissez « Fil », 100 µm' } },
    { id: 'babinet', titre: 'Un obstacle, une ouverture', focus: ['ecran'],
      texte: <>La figure est la même qu’avec une fente dont la largeur <em>a</em> est égale au diamètre du fil (sauf au centre, où passe aussi la lumière non diffractée).</>,
      tache: { type: 'qcm', q: 'Que peut-on en conclure ?', options: ['un obstacle donne la même figure qu’une ouverture de mêmes dimensions : on peut mesurer le diamètre d’un fil comme la largeur d’une fente', 'le fil ne diffracte pas la lumière', 'le fil donne une figure deux fois plus large'], bonne: 0,
        expl: 'Un obstacle et une ouverture de même taille et de même forme donnent la même figure de diffraction. On mesure donc un fil avec la même relation L = 2λD/a.' } },
    { id: 'trou', titre: 'Un trou circulaire', focus: ['reglages', 'ecran'],
      texte: <>Prenez maintenant un <strong>trou circulaire</strong> de diamètre <em>d</em> = 100{NB}µm. Observez la figure : disque central entouré d’anneaux.</>,
      tache: { type: 'action', ok: surLaser && lz.objet === 'trou' && lz.a === 100 && lz.lam === 532 && lz.D === 2, label: 'Mettre un trou de 100 µm', faire: () => { setScene('laser'); setL({ objet: 'trou', a: 100, lam: 532, D: 2 }); }, consigne: 'Choisissez « Trou circulaire », 100 µm' } },
    { id: 'trouL', titre: 'Le diamètre de la tache centrale', focus: ['mesures'],
      texte: <>Pour un trou circulaire, la tache centrale (disque d’Airy) a pour diamètre <strong>L = 2,44 λ D / d</strong>. Calculez-le pour ce réglage (<em>λ</em> = 532{NB}nm, <em>D</em> = 2,00{NB}m, <em>d</em> = 100{NB}µm), en millimètres.</>,
      tache: { type: 'num', q: 'Diamètre L de la tache centrale', unite: 'mm', vrai: M.largeurTrou(100e-6, 532e-9, 2) * 1e3, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['Hypothèses : petits angles, écran loin du trou. Relation donnée : L = 2,44 λ D / d.', 'Unités SI : λ = 532 × 10⁻⁹ m ; D = 2,00 m ; d = 100 × 10⁻⁶ m.',
          'L = 2,44 × 532 × 10⁻⁹ × 2,00 / (100 × 10⁻⁶) = 2,60 × 10⁻² m = 26,0 mm.'],
        pieges: [[21.3, 'Ici l’objet est un trou circulaire : le coefficient est 2,44 et non 2.'], [26000, 'Vérifiez les unités : le résultat est à donner en millimètres.']],
        expl: 'L = 2,44 × 532 × 10⁻⁹ × 2,00 / (100 × 10⁻⁶) ≈ 26,0 mm : plus large qu’avec une fente de même dimension (21,3 mm).' } },
    { id: 'poids', titre: 'D’où vient l’incertitude ?', focus: ['incert'],
      texte: <>Revenez à la fente de 100{NB}µm (bouton ci-dessous). Le panneau « Incertitude » donne le poids de chaque source (pointé de <em>L</em>, mesure de <em>D</em>, longueur d’onde du laser) dans l’incertitude-type sur <em>a</em>.</>,
      tache: { type: 'action', ok: laserDeBase && pointe, label: 'Revenir à la fente et pointer', faire: () => { setScene('laser'); { const Lf = M.largeurFente(100e-6, 532e-9, 2) * 1e3; setL({ objet: 'fente', a: 100, lam: 532, D: 2, zoom: 0, x1: -Lf / 2, x2: Lf / 2 }); }; }, consigne: 'Fente de 100 µm, repères sur les extinctions' } },
    { id: 'quoi', titre: 'Améliorer le protocole', focus: ['incert'],
      texte: <>Ici, le pointé de <em>L</em> contribue pour l’essentiel à l’incertitude.</>,
      tache: { type: 'qcm', q: 'Quelle modification diminue le plus l’incertitude relative sur a ?', options: ['rapprocher l’écran de la fente, pour que la figure soit plus lumineuse', 'éloigner l’écran de la fente, pour que L augmente', 'prendre un laser de longueur d’onde plus petite, pour que λ soit plus précise'], bonne: 1,
        expl: 'L est proportionnel à D : en éloignant l’écran, L augmente alors que l’incertitude de pointé reste la même, donc l’incertitude relative u(L)/L diminue. Vous pouvez le vérifier avec le curseur de D, en vérifiant que les extinctions restent dans l’image.' } },
    { id: 'ua', titre: 'L’incertitude-type sur a', focus: ['incert', 'mesures'],
      texte: <>Les sources d’erreur sur <em>L</em>, <em>D</em> et <em>λ</em> sont indépendantes : <strong>u(a)/a = √[ (u(L)/L)² + (u(D)/D)² + (u(λ)/λ)² ]</strong>. Calculez u(a) à partir des trois « u / valeur » du panneau « Incertitude »{isFinite(aCalc) ? <>, avec <em>a</em> = {nbf(aCalc, 0)}{NB}µm (étape « En déduire la largeur de la fente »)</> : null}.</>,
      tache: { type: 'num', q: 'Incertitude-type u(a)', unite: 'µm', vrai: inc ? inc.u * 1e6 : 1, tol: 0.1, affiche: v => nbf(v, 1), cs: 2,
        bloque: laserDeBase && pointe ? null : 'Placez d’abord les repères sur les extinctions (fente de 100 µm, D = 2,00 m, zoom × 1).',
        calcul: () => inc ? ['Hypothèses : sources d’erreur indépendantes, lois rectangulaires (u = demi-étendue / √3).',
          `u(L)/L = ${nbf(inc.uL / (Lmes * 1e-3) * 100, 2)} % ; u(D)/D = ${nbf(inc.uD / lz.D * 100, 3)} % ; u(λ)/λ = ${nbf(inc.uLa / la * 100, 2)} %.`,
          `u(a)/a = √(${nbf(inc.uL / (Lmes * 1e-3) * 100, 2)}² + ${nbf(inc.uD / lz.D * 100, 3)}² + ${nbf(inc.uLa / la * 100, 2)}²) = ${nbf(inc.rel * 100, 2)} %`,
          `u(a) = ${nbf(aCalc, 1)} × ${nbf(inc.rel, 4)} = ${nbf(inc.u * 1e6, 1)} µm.`] : [],
        pieges: [[inc ? aCalc * (inc.uL / (Lmes * 1e-3) + inc.uD / lz.D + inc.uLa / la) : 1, 'Vous avez additionné les incertitudes relatives. Elles se combinent en quadrature : racine de la somme des carrés.']],
        expl: inc ? `u(a) ≈ ${nbf(inc.u * 1e6, 1)} µm, soit ${nbf(inc.rel * 100, 1)} % de a. On écrit a = ${nbf(aCalc, 0)} µm avec u(a) = ${Number((inc.u * 1e6).toPrecision(1)).toString().replace('.', ',')} µm (u arrondie à un chiffre significatif).` : '' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>la diffraction est un étalement des directions de propagation d’une onde limitée par une ouverture ou un obstacle ; elle concerne les ondes mécaniques comme la lumière</li>
        <li>elle est d’autant plus marquée que la longueur d’onde est grande ou l’objet petit : θ ≈ λ / a</li>
        <li>fente ou fil de largeur a : L = 2 λ D / a ; trou circulaire de diamètre d : L = 2,44 λ D / d</li>
        <li>un obstacle donne la même figure qu’une ouverture de mêmes dimensions</li>
        <li>L, D et λ sont mesurés avec une incertitude : on la combine, et on améliore le protocole en agissant sur la source qui domine</li></ul>,
      texte: <>Vous savez reconnaître la diffraction, prévoir l’effet de <em>λ</em> et de <em>a</em>, et mesurer une dimension avec son incertitude. Essayez maintenant les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(type) {
    if (type === 'fil') { const f = nouveauFil(); setDefi({ type, objet: 'fil', a: f.vrai, nom: f.nom, lam: 650, reps: {}, verifie: false }); setL({ D: 2, zoom: 0, expo: 2, x1: -6, x2: 6 }); }
    else { setDefi({ type, objet: 'fente', a: 100, nom: 100, lam: nouveauLaser(), reps: {}, verifie: false }); setL({ D: 2, zoom: 0, expo: 2, x1: -6, x2: 6 }); }
  }
  const [typeDefi, setTypeDefi] = useState('fil');
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') { if (!defi) nouveauDefi(typeDefi); setScene('laser'); }
    if (md === 'guide') { setScene('cuve'); setCuve({ a: 10, lam: 1 }); setAngle(false); setVue('ondes'); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const dres = (() => {
    if (!defi || !defi.verifie) return null;
    const x = lireNombre(defi.reps.a), v = defi.reps.v;
    if (defi.type === 'fil') {
      const u = defi.snapU, aOk = isFinite(x) && proche(x, defi.a, Math.max(0.04, 2 * (defi.snapRel || 0)));
      const attendu = aOk && u != null ? M.compatible(x * 1e-6, defi.nom * 1e-6, u) : null;     // verdict tiré de la mesure de l’élève et de l’incertitude affichée
      const vOk = attendu != null && ((v === 'oui') === attendu);
      return { aOk, vOk, ok: aOk && vOk, attendu, u };
    }
    const lm = lireNombre(defi.reps.l), lOk = isFinite(lm) && proche(lm, defi.lam, Math.max(0.04, 2 * (defi.snapRel || 0))), cOk = lOk && (v === M.nomCouleur(lm) || v === M.nomCouleur(defi.lam));
    return { lOk, cOk, ok: lOk && cOk };
  })();
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => choisirDefi('fil')} aria-pressed={!!(defi.type === 'fil')} style={stylePetitBouton(defi.type === 'fil', '#0369a1')}>Le fil et l’annonce</button>
        <button onClick={() => choisirDefi('laser')} aria-pressed={!!(defi.type === 'laser')} style={stylePetitBouton(defi.type === 'laser', '#0369a1')}>La couleur du laser</button>
      </div>
      {defi.type === 'fil' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : le fil est-il conforme à l’annonce ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
          Le fabricant annonce un diamètre de <strong>{defi.nom}{NB}µm</strong>. Éclairez le fil avec le laser (<em>λ</em> = {defi.lam}{NB}nm), choisissez <em>D</em> et le zoom, pointez les extinctions, puis calculez le diamètre mesuré. Comparez-le à l’annonce avec l’écart normalisé : |a<sub>mes</sub> − a<sub>annoncé</sub>| / u(a) ≤ 2.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Diamètre mesuré</span>
          <input value={defi.reps.a ?? ''} aria-label="Diamètre mesuré" onKeyDown={e => e.key === 'Enter' && document.getElementById('df-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, a: e.target.value }, verifie: false }))}
            style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${dres ? (dres.aOk ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>µm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Mesure compatible avec l’annonce ?</span>
          {[['oui', 'Oui'], ['non', 'Non']].map(([v, l]) => <button key={v} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, v }, verifie: false }))} aria-pressed={!!(defi.reps.v === v)} style={stylePetitBouton(defi.reps.v === v, '#0369a1')}>{l}</button>)}
        </div>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est la couleur du laser ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
          La fente fait exactement <strong>100{NB}µm</strong>. Mesurez la largeur de la tache centrale pour une distance <em>D</em> de votre choix, puis déduisez la longueur d’onde du laser (et sa couleur). L’écran est ici en niveaux de gris : seule la mesure vous renseigne.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Longueur d’onde</span>
          <input value={defi.reps.l ?? ''} aria-label="Longueur d’onde" onKeyDown={e => e.key === 'Enter' && document.getElementById('df-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, l: e.target.value }, verifie: false }))}
            style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${dres ? (dres.lOk ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>nm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Couleur</span>
          {['violet', 'bleu', 'vert', 'jaune', 'orange', 'rouge'].map(c => <button key={c} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, v: c }, verifie: false }))} aria-pressed={!!(defi.reps.v === c)} style={stylePetitBouton(defi.reps.v === c, '#0369a1')}>{c}</button>)}
        </div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="df-verif" onClick={() => { setDefi(d => ({ ...d, verifie: true, snapU: inc ? inc.u : null, snapRel: inc ? inc.rel : 0 })); const x = lireNombre(defi.reps.a), lm = lireNombre(defi.reps.l), v = defi.reps.v;
          if (defi.type === 'fil') noterFil(isFinite(x) && proche(x, defi.a, Math.max(0.04, 2 * (inc ? inc.rel : 0))) && inc != null && (v === 'oui') === M.compatible(x * 1e-6, defi.nom * 1e-6, inc.u));
          else noterLaser(isFinite(lm) && proche(lm, defi.lam, Math.max(0.04, 2 * (inc ? inc.rel : 0))) && (v === M.nomCouleur(lm) || v === M.nomCouleur(defi.lam))); }} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {dres && defi.type === 'fil' && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
        <div style={{ color: dres.aOk ? '#15803d' : '#dc2626' }}>{dres.aOk ? '✓ Diamètre mesuré correct.' : '✗ Diamètre : revoyez le pointé de L (centres des extinctions) et la relation a = 2λD / L. Vérifiez les unités.'}</div>
        {dres.aOk && <div style={{ color: dres.vOk ? '#15803d' : '#dc2626' }}>{dres.vOk ? '✓ Conclusion cohérente avec le critère 2 u(a).' : `✗ Conclusion : comparez |a mesuré − ${defi.nom}| à 2 u(a) = ${dres.u != null ? nbf(2 * dres.u * 1e6, 1) : '?'} µm (panneau « Incertitude »).`}</div>}
        {dres.ok && <div style={{ color: KIT.txt2, fontWeight: 400 }}>Diamètre réel du fil dans la simulation : {nbf(defi.a, 1)} µm (annonce : {defi.nom} µm). {Math.abs(defi.a - defi.nom) < 0.2
          ? (dres.attendu ? 'Le fil est conforme à l’annonce.' : 'Le fil est en réalité conforme à l’annonce : l’écart que vous avez trouvé vient d’un pointé imprécis.')
          : (dres.attendu ? `Votre pointé était trop imprécis pour voir l’écart réel (${nbf(Math.abs(defi.a - defi.nom), 0)} µm, soit ${nbf(Math.abs(defi.a - defi.nom) / defi.nom * 100, 0)} %) : un zoom plus fort ou un écran plus éloigné diminue l’incertitude.` : 'Votre mesure n’est pas compatible avec l’annonce : l’écart est supérieur à 2 u(a).')}</div>}
      </div>}
      {dres && defi.type === 'laser' && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
        <div style={{ color: dres.lOk ? '#15803d' : '#dc2626' }}>{dres.lOk ? '✓ Longueur d’onde correcte.' : '✗ Longueur d’onde : λ = a L / (2 D). Attention aux unités (L en mm, a en µm, résultat en nm).'}</div>
        <div style={{ color: dres.cOk ? '#15803d' : '#dc2626' }}>{dres.cOk ? '✓ Couleur correcte.' : '✗ Couleur : le visible va du violet (≈ 400 nm) au rouge (≈ 700 nm).'}</div>
        {dres.ok && <div style={{ color: KIT.txt2, fontWeight: 400 }}>Le laser émettait à {defi.lam}{NB}nm.</div>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Onde monochromatique et cohérente</strong> : un laser, ou un seul générateur dans la cuve. Une lumière blanche donnerait des figures colorées et plus confuses.</li>
      <li><strong>Figure à l’infini</strong> (Fraunhofer) : l’écran est loin de l’objet, D ≫ a²/λ. Pour a = 0,1 mm et λ = 532 nm, a²/λ ≈ 2 cm : très bien vérifié avec un écran à 1 – 4 m ; moins bien pour a = 0,4 mm avec D = 0,5 m.</li>
      <li><strong>Petits angles</strong> : θ ≈ λ/a et L = 2λD/a. L’approximation devient mauvaise si a n’est pas grand devant λ (pour a = 2λ, L est sous-estimé d’environ 13 %). Avec un laser et a ≥ 20 µm, λ/a est inférieur à 0,04 : l’approximation est excellente.</li>
      <li><strong>Objets idéaux</strong> : fente infiniment haute, fil parfaitement cylindrique, trou parfaitement circulaire, bords nets. Un fil réel n’a pas un diamètre rigoureusement constant.</li>
      <li><strong>Cuve à ondes</strong> : modèle de Huygens-Fresnel à deux dimensions (chaque point de l’ouverture émet une ondelette), sans amortissement ni réflexion sur les bords, et sans facteur d’inclinaison. L’ouverture est observée de près (champ proche) : θ = arcsin(λ/a) ne décrit que le champ lointain, d’où le passage au laser.</li>
      <li><strong>Incertitudes</strong> : pointé de chaque extinction à ± 3 pixels de l’image, D au mètre ruban à ± 2 mm, longueur d’onde du laser à ± 1 % d’après la notice. Chaque grandeur est supposée uniformément répartie dans son intervalle (u = demi-étendue / √3) et les trois sources sont supposées indépendantes. L’incertitude due au modèle lui-même (petits angles) est négligée. Les deux pointés sont indépendants : u(L) = √2 × u(pointé).</li>
      <li><strong>Comparaison à l’annonce</strong> : la valeur du fabricant est traitée comme exacte (aucune tolérance donnée). Le critère |écart| ≤ 2 u(a) correspond à un coefficient d’élargissement k = 2, soit environ 95 % de confiance si la loi de la grandeur combinée est proche d’une loi normale. Les ± 3 px de pointé sont une hypothèse de la simulation. Dans le défi « couleur », la fente est supposée connue à ± 0,5 µm.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- panneaux ----------
  const zoneScene = scene === 'cuve' ? (
    <CuveOndes a={cuve.a} lam={cuve.lam} vue={vue} anim={anim} angle={angle}/>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Montage objet={objetEff} a={aEff} lam={lamEff} D={lz.D} gris={enDefi && defi?.type === 'laser'}/>
      <div style={cadre('ecran')}>
        <Ecran L={{ ...lz, objet: objetEff, a: aEff, lam: lamEff, setX, mesure: true, gris: enDefi && defi?.type === 'laser', montrerPrevu: mode === 'explore', noms: { laser: enDefi && defi?.type === 'laser' ? 'monochrome' : noms.laser, objet: noms.objet } }}/>
      </div>
      <div role="group" aria-label="Placer les repères" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px' }}>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Placer les repères (curseurs, ou flèches du clavier)</div>
        {[[1, 'Repère 1 (orange)', lz.x1, '#b45309'], [2, 'Repère 2 (bleu)', lz.x2, '#0e7490']].map(([i, n, v, c]) => <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: KIT.txt }}><span style={{ minWidth: 112, fontWeight: 700 }}>{n}</span>
          <input type="range" aria-label={n} aria-valuetext={`${nbf(v, 2)} millimètres`} min={-W} max={W} step={W / 300} value={v} onChange={e => setX(i, parseFloat(e.target.value))} style={{ flex: 1, minHeight: 32, accentColor: c }}/></label>)}
      </div>
      {!horsCadre && lz.D < 5 * A * A / la && <div style={{ fontSize: 13, color: '#9a3412', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '5px 8px' }}>L’écran est assez proche de l’objet : la figure n’est plus tout à fait « à l’infini » (il faudrait D ≫ a²/λ). Éloignez l’écran.</div>}
      {horsCadre && <div style={{ fontSize: 13, color: '#9a3412', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '5px 8px' }}>Les premières extinctions sortent de l’image : diminuez le zoom ou rapprochez l’écran.</div>}
      {Lp < 6 * dx && !horsCadre && <div style={{ fontSize: 13, color: '#9a3412', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '5px 8px' }}>La tache est très étroite par rapport à l’image : augmentez le zoom ou éloignez l’écran pour la pointer précisément.</div>}
    </div>);
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setScene('cuve')} aria-pressed={!!(scene === 'cuve')} style={stylePetitBouton(scene === 'cuve', '#0e7490')}>Cuve à ondes</button>
        <button onClick={() => setScene('laser')} aria-pressed={!!(scene === 'laser')} style={stylePetitBouton(scene === 'laser', '#0e7490')}>Laser et écran</button>
      </div>}
      {enGuide && [9, 10, 11, 16, 17, 18].includes(etape) && !(laserDeBase && (etape === 9 || pointe)) && <button onClick={() => { const Lf = M.largeurFente(100e-6, 532e-9, 2) * 1e3; setScene('laser'); setLz(l => ({ ...l, objet: 'fente', a: 100, lam: 532, D: 2, zoom: 0, expo: 2, x1: etape === 9 ? -6 : -Lf / 2, x2: etape === 9 ? 6 : Lf / 2 })); }} style={{ ...styleBouton(true, '#f59e0b'), marginBottom: 8 }}>Rétablir le réglage (fente 100 µm, D = 2,00 m{etape === 9 ? '' : ', repères placés'})</button>}
      {zoneScene}
      {scene === 'cuve' && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Vue de dessus : l’onde plane arrive de la gauche. Clair : crête ; sombre : creux. « Amplitude » : plus c’est foncé, plus l’onde est ample en ce point.</div>}
      {scene === 'laser' && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Pointez les extinctions avec les curseurs sous l’image (ou en faisant glisser les repères). Les graduations de la règle sont en millimètres.</div>}
    </div>);
  const reglages = scene === 'cuve' ? (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom={'Largeur de l’ouverture a'} valeur={cuve.a} onChange={v => setCuve(c => ({ ...c, a: v }))} min={1} max={14} pas={0.5} unite="cm" decimales={1} couleur="#475569"/>
      <Curseur nom={'Longueur d’onde λ'} valeur={cuve.lam} onChange={v => setCuve(c => ({ ...c, lam: v }))} min={0.5} max={4} pas={0.25} unite="cm" decimales={2} couleur="#0e7490"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <button onClick={() => setVue(v => v === 'ondes' ? 'intensite' : 'ondes')} aria-pressed={!!(vue === 'intensite')} style={stylePetitBouton(vue === 'intensite', '#0e7490')}>{vue === 'intensite' ? 'Voir les ondes' : 'Voir l’amplitude'}</button>
        <button onClick={() => setAngle(x => !x)} aria-pressed={!!(angle)} style={stylePetitBouton(angle, '#dc2626')}>{angle ? 'Masquer θ' : 'Afficher l’écart angulaire θ'}</button>
        <button onClick={() => setAnim(x => !x)} disabled={vue === 'intensite'} aria-pressed={!!(!anim)} style={stylePetitBouton(!anim, '#475569')}>{anim ? 'Figer' : 'Animer'}</button>
      </div>
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Objet diffractant</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{OBJETS.map(([v, l]) => <button key={v} onClick={() => setL({ objet: v })} aria-pressed={!!(lz.objet === v)} style={stylePetitBouton(lz.objet === v, '#475569')}>{l}</button>)}</div>
        <Curseur nom={lz.objet === 'trou' ? 'Diamètre d' : lz.objet === 'fil' ? 'Diamètre a du fil' : 'Largeur a de la fente'} valeur={lz.a} onChange={v => setL({ a: v })} min={20} max={400} pas={5} unite="µm" decimales={0} couleur="#475569"/>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Laser</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{LASERS.map(l => <button key={l.nm} onClick={() => setL({ lam: l.nm })} aria-pressed={!!(lz.lam === l.nm)} style={stylePetitBouton(lz.lam === l.nm, '#0e7490')}>{l.nom} {l.nm}{NB}nm</button>)}</div>
        <Curseur nom={'Longueur d’onde λ'} valeur={lz.lam} onChange={v => setL({ lam: v })} min={400} max={700} pas={1} unite="nm" decimales={0} couleur="#0e7490"/>
      </>}
      {enDefi && defi?.type === 'fil' && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Laser rouge, <em>λ</em> = {defi.lam}{NB}nm (notice : ± 1 %).</div>}
      {enDefi && defi?.type === 'laser' && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Longueur d’onde inconnue ; fente de 100 µm à ± 0,5 µm près.</div>}
      <Curseur nom={'Distance objet – écran D'} valeur={lz.D} onChange={v => setL({ D: v })} min={0.5} max={5} pas={0.25} unite="m" decimales={2} couleur="#b45309"/>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Cadrage de l’image (zoom)</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{ZOOMS.map((z, i) => <button key={z.W} onClick={() => setL({ zoom: i })} aria-pressed={!!(lz.zoom === i)} style={stylePetitBouton(lz.zoom === i, '#475569')}>{z.nom} (± {z.W}{NB}mm)</button>)}</div>
      <Curseur nom={'Exposition'} valeur={lz.expo} onChange={v => setL({ expo: v })} min={0.5} max={10} pas={0.5} unite="" decimales={1} couleur="#475569"/>
    </div>
  );
  const mesures = scene === 'cuve' ? (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Longueur d’onde λ" valeur={`${nbf(cuve.lam, 2)}${NB}cm`}/>
      <LigneMesure nom="Largeur a de l’ouverture" valeur={`${nbf(cuve.a, 1)}${NB}cm`}/>
      {!(enGuide && etape === 5) && <LigneMesure nom="Rapport λ / a" valeur={nbf(cuve.lam / cuve.a, 2)} couleur="#dc2626"/>}
      {!(enGuide && etape === 5) && <>
      <LigneMesure nom="Écart angulaire θ ≈ λ / a" valeur={cuve.lam <= cuve.a ? `${nbf(cuve.lam / cuve.a, 2)}${NB}rad` : '–'}/>
      <LigneMesure nom="θ en degrés (exacte : arcsin λ/a)" valeur={cuve.lam < cuve.a ? `${nbf(deg(M.thetaExact(cuve.a, cuve.lam)), 0)}${NB}°` : '– (aucune extinction)'}/>
      </>}
      {cuve.lam / cuve.a > 0.5 && <div style={{ fontSize: 12.5, color: '#9a3412', marginTop: 4 }}>Quand λ n’est plus petite devant a, l’approximation θ ≈ λ / a n’est plus bonne.</div>}
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Repère 1 (orange)" valeur={`${nbf(lz.x1, W >= 20 ? 1 : 2)}${NB}mm`} couleur="#b45309"/>
      <LigneMesure nom="Repère 2 (bleu)" valeur={`${nbf(lz.x2, W >= 20 ? 1 : 2)}${NB}mm`} couleur="#0e7490"/>
      <LigneMesure nom="Largeur L entre les repères" valeur={`${nbf(Lmes, W >= 20 ? 1 : 2)}${NB}mm`}/>
      {!enDefi && !(enGuide && etape === 11) && <LigneMesure nom={objetEff === 'trou' ? 'd calculé = 2,44 λ D / L' : 'a calculé = 2 λ D / L'} valeur={isFinite(aCalc) ? `${nbf(aCalc, 1)}${NB}µm` : '–'} couleur="#15803d"/>}
      {mode === 'explore' && <LigneMesure nom="L prévu par la formule" valeur={`${nbf(Lp, 2)}${NB}mm`} couleur="#15803d"/>}
    </div>
  );
  const incertBox = scene === 'laser' && inc && (
    <div style={{ ...styleBoite, ...cadre('incert') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enDefi && defi?.type === 'laser' ? 'Incertitude relative sur λ (due à L, D et a)' : `Incertitude sur ${objetEff === 'trou' ? 'd' : 'a'}`}</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>Type B : u = demi-étendue / √3. Sources supposées indépendantes.</div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Source</th><th style={{ padding: '2px 4px' }}>± demi-étendue</th><th style={{ padding: '2px 4px' }}>u / valeur</th><th style={{ padding: '2px 4px' }}>poids</th></tr></thead>
        <tbody>
          {[['L (2 pointés)', `${nbf(dLm, 2)} mm`, inc.uL / (Lmes * 1e-3), inc.part[0], '#f59e0b'],
            ['D (ruban)', `${nbf(dD * 1e3, 0)} mm`, inc.uD / lz.D, inc.part[1], '#b45309'],
            [enDefi && defi?.type === 'laser' ? 'a (fente)' : 'λ (notice)', enDefi && defi?.type === 'laser' ? '± 0,5 µm' : `${nbf(dLambda(lamEff), 1)} nm`, inc.uLa / la, inc.part[2], '#0e7490']].map(([n, d, r, p, c]) => (
            <tr key={n} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 600 }}>{n}</td><td style={{ padding: '3px 4px' }}>{d}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(r * 100, 2)} %</td>
              <td style={{ padding: '3px 4px', minWidth: 90 }}><div style={{ background: '#e2e8f0', borderRadius: 4, height: 10 }}><div style={{ width: `${Math.round(p * 100)}%`, background: c, height: '100%', borderRadius: 4 }}/></div><span style={{ fontSize: 11.5 }}>{Math.round(p * 100)} %</span></td></tr>))}
        </tbody>
      </table>
      <div style={{ marginTop: 6 }}>
        {enDefi && defi?.type === 'laser' && <LigneMesure nom="u(λ) / λ" valeur={`${nbf(inc.rel * 100, 2)} %`}/>}
        {!(enDefi && defi?.type === 'laser') && !(enGuide && etape === 18) && <><LigneMesure nom={`u(${objetEff === 'trou' ? 'd' : 'a'}) / ${objetEff === 'trou' ? 'd' : 'a'}`} valeur={`${nbf(inc.rel * 100, 2)} %`}/>
        <LigneMesure nom={`u(${objetEff === 'trou' ? 'd' : 'a'})`} valeur={`${nbf(inc.u * 1e6, 1)}${NB}µm`} couleur="#15803d"/></>}
        {enDefi && defi?.type === 'fil' && <LigneMesure nom="Intervalle ± 2 u" valeur={`${nbf(2 * inc.u * 1e6, 1)}${NB}µm`}/>}
      </div>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Cuve : fixez <em>a</em> et augmentez <em>λ</em> jusqu’à ce que λ dépasse <em>a</em> : que devient la zone derrière le mur ?</li>
        <li>Cuve : cherchez deux réglages différents qui donnent la même ouverture θ. Que remarquez-vous sur le rapport λ / a ?</li>
        <li>Laser : doublez la largeur de la fente. Comment varie L ? Et si vous passez du laser rouge au laser violet ?</li>
        <li>Laser : éloignez l’écran de 1 m à 4 m : que devient L ? Que devient le poids de L dans l’incertitude ?</li>
        <li>Laser : comparez fente, fil et trou de même dimension. Qu’est-ce qui distingue le trou ?</li>
        <li>Laser : mettez une fente de 20 µm : où sont maintenant les premières extinctions ? Que faire pour les voir dans l’image ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>diffraction : étalement des directions d’une onde limitée par une ouverture ou un obstacle (ondes mécaniques et lumineuses)</li>
        <li>d’autant plus marquée que λ est grande ou que a est petit : θ ≈ λ / a</li>
        <li>fente ou fil : L = 2 λ D / a ; trou circulaire : L = 2,44 λ D / d</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .df-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .df-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .df-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .df-rep:focus { outline: none; } .df-rep:focus-visible line { stroke-width: 5; } .df-rep:focus-visible path { transform-box: fill-box; transform-origin: center; transform: scale(1.8); }
        .df-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .df-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .df-l1.cote, .df-pri { grid-template-columns: minmax(0, 1fr); } .df-l1 .df-carte { order: -1; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Diffraction des ondes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une onde limitée par une <strong>ouverture</strong> ou un <strong>obstacle</strong> s’étale : c’est la <strong>diffraction</strong>. Elle dépend du rapport entre la longueur d’onde <em>λ</em> et la taille <em>a</em> de l’objet. On l’observe avec des ondes mécaniques comme avec la lumière.</div>
      <div className={`df-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'fil' ? suiviFil : suiviLaser} /></></div>}
          <div className={`df-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}{incertBox}</div>
          </div>
        </div>
        {enGuide ? <div className="df-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
          : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="df-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="df-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
