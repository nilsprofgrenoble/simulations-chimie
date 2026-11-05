import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef, useCallback } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, sci } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./sonModele";

const SIM_ID = 87;
declarerDefis(SIM_ID, [['freq', 'Quelle est la fréquence fondamentale du son ?'], ['timbre', 'Quel son a la même hauteur mais un autre timbre ?'], ['niveau', 'Quel niveau sonore dans une autre situation ?']]);

// ====================================================
//  SIM 87 — SON : spectre, hauteur, timbre et niveau sonore
//  Scène « Spectre et timbre » : somme de sinusoïdes (fondamental + 6 harmoniques), évolution temporelle avec repères de mesure de la période, spectre en amplitude, lecture audio facultative.
//  Scène « Niveau sonore » : source ponctuelle isotrope, I = P / (4π r²), L = 10 log (I / I0), plusieurs sources identiques.
//  Pas d’animation : rien à adapter pour prefers-reduced-motion.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const nbm = (v, d = 0) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\u202f/g, '\u00a0');
const COUL = '#0e7490', COUL_B = '#b45309';
const BASE_SY = { preset: 'pur', f1: 500, a: M.PRESETS.pur.a.slice(), u0: 0, fen: 20, t1: 0.6, t2: 9.4, n: 3 };
const NV_BASE = { k: -3, r: 1, n: 1 };
const T_PLACE = { t1: 2, t2: 8 };
const memeSy = (x, b) => x.preset === b.preset && x.f1 === b.f1 && x.u0 === b.u0 && x.fen === b.fen && x.a.every((v, i) => Math.abs(v - b.a[i]) < 1e-9);
const memeNv = (x, b) => x.k === b.k && x.r === b.r && x.n === b.n;
const syDe = (preset, f1 = 500, plus = {}) => ({ ...BASE_SY, preset, f1, a: M.PRESETS[preset].a.slice(), ...plus });
const ecartMax = (t, pas) => Math.abs(t / pas - Math.round(t / pas)) * pas;

// Capacité du référentiel rattachée à une étape ou à un défi
const Cap = ({ children }) => <div style={{ marginTop: 8, fontSize: 12.5, color: '#475569', borderLeft: `3px solid ${ORANGE_GUIDE}`, paddingLeft: 8, lineHeight: 1.45 }}><strong>Capacité visée :</strong> {children}</div>;
const CAP = {
  grandeurs: 'caractériser une onde progressive sinusoïdale par ses grandeurs : fréquence, période, amplitude.',
  harm: 'exploiter le spectre d’une onde périodique : relation entre les fréquences du fondamental et des harmoniques.',
  continue: 'exploiter le spectre d’une onde périodique : interprétation de la composante de fréquence nulle.',
  pur: 'distinguer à partir d’un spectre un son pur d’un son complexe.',
  hauteur: 'caractériser un son par sa hauteur et son timbre.',
  puissance: 'exprimer la relation de proportionnalité entre la puissance moyenne transportée et le carré de l’amplitude.',
  niveau: 'exploiter l’expression du niveau d’intensité sonore en décibel (dB).',
  numerique: 'capacité numérique : visualiser une somme de signaux sinusoïdaux de fréquences multiples de celle du fondamental.',
};

// Profils d'écoute « son naturel » : attaque (s), vibrato [Hz, amplitude en cents], souffle. Ils ne changent pas le spectre affiché (régime établi).
const PROFILS_AUDIO = {
  pur: { att: 0.02 },
  creux: { att: 0.06 },
  flute: { att: 0.07, vib: [4.8, 6], vibDelai: 0.3, souffle: 0.05 },
  clarinette: { att: 0.03 },
  violon: { att: 0.09, vib: [5.5, 14], vibDelai: 0.35 },
};

// ---------- lecture audio en direct (jamais au chargement ; volume plafonné ; arrêt après 60 s) ----------
// Le son suit les réglages pendant l'écoute : 8 oscillateurs permanents dont on change fréquence et amplitude, un bruit, un souffle.
const NB_OSC = 8, ARRET_S = 60;
function useAudio() {
  const ctxRef = useRef(null), gRef = useRef(null), minuteurRef = useRef(null);
  const [joue, setJoue] = useState(false), [erreur, setErreur] = useState('');
  const armer = useCallback(arreterFn => { clearTimeout(minuteurRef.current); minuteurRef.current = setTimeout(arreterFn, ARRET_S * 1000); }, []);
  const arreter = useCallback(() => {
    clearTimeout(minuteurRef.current);
    const g = gRef.current; gRef.current = null;
    if (g) { try { const now = g.ctx.currentTime; g.master.gain.cancelScheduledValues(now); g.master.gain.setValueAtTime(g.master.gain.value, now); g.master.gain.linearRampToValueAtTime(0, now + 0.12); setTimeout(() => g.noeuds.forEach(n => { try { n.stop(); } catch { /* déjà arrêté */ } }), 200); } catch { /* rien */ } }
    setJoue(false);
  }, []);
  useEffect(() => () => { clearTimeout(minuteurRef.current); try { (gRef.current?.noeuds || []).forEach(n => n.stop()); ctxRef.current && ctxRef.current.close(); } catch { /* rien */ } }, []);
  // applique l'état (composantes, volume, timbre) au graphe audio ; tc = constante de temps du lissage
  const appliquer = useCallback((e, tc, debut = false) => {
    const g = gRef.current; if (!g) return;
    const now = g.ctx.currentTime, P = e.naturel && !e.bruit ? PROFILS_AUDIO[e.cle] : null, att = P ? P.att : 0.05;
    const valides = e.comps.filter(c => c.f >= 20 && c.f <= 12000).slice(0, NB_OSC), somme = valides.reduce((a, c) => a + c.a, 0) || 1;
    g.master.gain.setTargetAtTime(0.2 * e.vol / 100, now, debut ? att / 3 : tc);
    g.osc.forEach((x, i) => {
      const c = valides[i], retard = debut && P ? att * 0.35 * i : 0;
      if (c) x.o.frequency.setTargetAtTime(c.f, now, tc);
      x.g.gain.setTargetAtTime(e.bruit || !c ? 0 : c.a / somme, now + retard, debut ? att / 3 : tc);
      x.lfo.frequency.setTargetAtTime(P && P.vib ? P.vib[0] : 5, now, tc);
      x.lg.gain.setTargetAtTime(P && P.vib ? P.vib[1] : 0, now + (debut && P && P.vib ? P.vibDelai || 0.2 : 0), debut ? 0.3 : tc);
    });
    g.bruitG.gain.setTargetAtTime(e.bruit ? 0.5 : 0, now, tc);
    g.souffleG.gain.setTargetAtTime(P && P.souffle ? P.souffle : 0, now, tc);
    g.bp.frequency.setTargetAtTime(Math.min(8000, 2 * (valides[0]?.f || 500)), now, tc);
  }, []);
  const demarrer = useCallback(e => {
    arreter(); setErreur('');
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { setErreur('Ce navigateur ne sait pas jouer de son.'); return; }
      const ctx = ctxRef.current || (ctxRef.current = new AC());
      if (ctx.state === 'suspended') ctx.resume();
      const master = ctx.createGain(), noeuds = []; master.gain.value = 0; master.connect(ctx.destination);
      const osc = Array.from({ length: NB_OSC }, () => {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        g.gain.value = 0; lg.gain.value = 0; lfo.frequency.value = 5; lfo.connect(lg); lg.connect(o.detune); o.connect(g); g.connect(master); o.start(); lfo.start(); noeuds.push(o, lfo);
        return { o, g, lfo, lg };
      });
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const mkBruit = () => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); noeuds.push(s); return s; };
      const bruitG = ctx.createGain(); bruitG.gain.value = 0; mkBruit().connect(bruitG); bruitG.connect(master);
      const bp = ctx.createBiquadFilter(), souffleG = ctx.createGain(); bp.type = 'bandpass'; bp.Q.value = 0.8; souffleG.gain.value = 0; mkBruit().connect(bp); bp.connect(souffleG); souffleG.connect(master);
      gRef.current = { ctx, master, osc, bruitG, souffleG, bp, noeuds };
      appliquer(e, 0.03, true); armer(arreter); setJoue(true);
    } catch { setErreur('Le son ne peut pas être joué sur cet appareil.'); }
  }, [arreter, appliquer, armer]);
  const maj = useCallback(e => { if (!gRef.current) return; appliquer(e, 0.03); armer(arreter); }, [appliquer, armer, arreter]);
  return { joue, demarrer, maj, arreter, erreur };
}

// ---------- graphique : évolution temporelle ----------
const GT = { W: 520, H: 262, L: 44, R: 16, T: 12, B: 46 };
function Temps({ u, fen, t1, t2, avecRepères, aria }) {
  const ym = M.echelleY(u);
  const w = GT.W - GT.L - GT.R, h = GT.H - GT.T - GT.B;
  const X = t => GT.L + (t / fen) * w, Y = v => GT.T + (ym - v) / (2 * ym) * h;
  const pas = fen <= 10 ? 1 : fen <= 20 ? 2 : 5, ticks = Array.from({ length: Math.floor(fen / pas) + 1 }, (_, i) => i * pas);
  const N = u.length - 1;
  const pts = Array.from(u, (v, i) => `${X(fen * i / N).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${GT.W} ${GT.H}`} role="img" aria-label={aria} style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      {Array.from({ length: 2 * Math.floor(ym / (ym > 4 ? 2 : 1)) + 1 }, (_, i) => (i - Math.floor(ym / (ym > 4 ? 2 : 1))) * (ym > 4 ? 2 : 1)).map(v => <g key={v}><line x1={GT.L} x2={GT.W - GT.R} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={v === 0 ? 1.4 : 1}/><text x={GT.L - 6} y={Y(v) + 4} fontSize="12" textAnchor="end" fill="#475569">{v}</text></g>)}
      {ticks.map(t => <g key={t}><line x1={X(t)} x2={X(t)} y1={GT.T} y2={GT.T + h} stroke="#f1f5f9"/><text x={X(t)} y={GT.H - 26} fontSize="13" textAnchor="middle" fill="#475569">{t}</text></g>)}
      <text x={GT.L + w / 2} y={GT.H - 6} fontSize="13" textAnchor="middle" fill="#334155">temps t (ms)</text>
      <text x={12} y={GT.T + h / 2} fontSize="13" textAnchor="middle" fill="#334155" transform={`rotate(-90 12 ${GT.T + h / 2})`}>tension u (u.a.)</text>
      <polyline points={pts} fill="none" stroke={COUL} strokeWidth="1.8" strokeLinejoin="round"/>
      {avecRepères && [[t1, '1', COUL_B], [t2, '2', '#1d4ed8']].map(([t, n, c]) => <g key={n}>
        <line x1={X(t)} x2={X(t)} y1={GT.T} y2={GT.T + h} stroke={c} strokeWidth="1.8" strokeDasharray="5 4"/>
        <circle cx={X(t)} cy={GT.T + 10} r="9" fill={c}/><text x={X(t)} y={GT.T + 14.5} fontSize="13" fontWeight="700" textAnchor="middle" fill="white">{n}</text></g>)}
    </svg>);
}

// ---------- graphique : spectre en amplitude ----------
function Spectre({ comps, u0, fmax, type, H = 222, etiquettes = true, aria, W = 520 }) {
  const L = 44, R = 26, T = 16, B = 46, w = W - L - R, h = H - T - B, YM = 1.1;
  const X = f => L + (f / fmax) * w, Y = a => T + h - (a / YM) * h;
  const pas = fmax / 5, ticks = Array.from({ length: 6 }, (_, i) => i * pas);
  const lignes = type === 'bruit' ? comps.filter(c => c.f <= fmax) : comps;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      {[0, 0.5, 1].map(a => <g key={a}><line x1={L} x2={W - R} y1={Y(a)} y2={Y(a)} stroke={a === 0 ? '#94a3b8' : '#e2e8f0'}/><text x={L - 6} y={Y(a) + 4} fontSize="12" textAnchor="end" fill="#475569">{nbf(a, a === 0.5 ? 1 : 0)}</text></g>)}
      {ticks.map(f => <g key={f}><line x1={X(f)} x2={X(f)} y1={T + h} y2={T + h + 4} stroke="#64748b"/><text x={X(f)} y={H - 26} fontSize="12" textAnchor={f === 0 ? 'start' : 'middle'} fill="#475569">{nbm(Math.round(f))}</text></g>)}
      <text x={L + w / 2} y={H - 6} fontSize="13" textAnchor="middle" fill="#334155">fréquence (Hz)</text>
      <text x={12} y={T + h / 2} fontSize="13" textAnchor="middle" fill="#334155" transform={`rotate(-90 12 ${T + h / 2})`}>amplitude (u.a.)</text>
      {u0 !== 0 && <g><line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(Math.min(YM, Math.abs(u0)))} stroke="#b45309" strokeWidth="4" strokeLinecap="round"/>{etiquettes && <text x={X(0) + 8} y={Y(Math.min(YM, Math.abs(u0))) + 4} fontSize="12" fill="#b45309" fontWeight="700">0 Hz</text>}</g>}
      {lignes.map((c, i) => <g key={i}>
        <line x1={X(c.f)} x2={X(c.f)} y1={Y(0)} y2={Y(Math.min(YM, c.a))} stroke={COUL} strokeWidth={type === 'bruit' ? 1.6 : 4} strokeLinecap="round"/>
        {etiquettes && type !== 'bruit' && <text x={X(c.f)} y={Y(Math.min(YM, c.a)) - 5} fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="600">{nbm(Math.round(c.f))}</text>}</g>)}
    </svg>);
}

// ---------- scène du niveau sonore ----------
const GN = { W: 520, H: 300 };
function SceneNiveau({ P, r, n, L, cacheL }) {
  const Xr = x => 70 + 400 * Math.log10(x) / Math.log10(50), echelle = [1, 2, 5, 10, 20, 50];
  const XL = d => 30 + (d / 130) * 460;
  return (
    <svg viewBox={`0 0 ${GN.W} ${GN.H}`} role="img" aria-label={`Source sonore de puissance ${nbm(P * 1000, 3)} milliwatt, ${n} source${n > 1 ? 's' : ''}, sonomètre à ${nbf(r, 1)} mètres${cacheL ? '' : `, niveau ${nbf(L, 1)} décibels`}`} style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <text x="14" y="22" fontSize="14" fontWeight="700" fill="#0f172a">Source et sonomètre (échelle de distance logarithmique)</text>
      <line x1="70" x2="470" y1="92" y2="92" stroke="#94a3b8" strokeWidth="2"/>
      {echelle.map(d => <g key={d}><line x1={Xr(d)} x2={Xr(d)} y1="88" y2="98" stroke="#64748b"/><text x={Xr(d)} y="116" fontSize="12" textAnchor="middle" fill="#475569">{d} m</text></g>)}
      {Array.from({ length: Math.min(n, 10) }, (_, i) => <circle key={i} cx={26 + (i % 5) * 8} cy={i < 5 ? 82 : 102} r="7" fill={COUL} stroke="white" strokeWidth="1.5"/>)}
      <text x="14" y="132" fontSize="12" fill="#334155">{n} source{n > 1 ? 's' : ''}</text>
      <g transform={`translate(${Xr(r)} 92)`}><rect x="-12" y="-36" width="24" height="38" rx="5" fill="#334155"/><rect x="-8" y="-31" width="16" height="10" rx="2" fill="#a7f3d0"/><circle cx="0" cy="-10" r="4" fill="#94a3b8"/><line x1="0" x2="0" y1="2" y2="12" stroke="#334155" strokeWidth="3"/></g>
      <text x={Math.min(Xr(r), 440)} y="46" fontSize="13" fontWeight="700" textAnchor="middle" fill={COUL_B}>r = {nbf(r, 1)}{NB}m</text>
      <text x="14" y="160" fontSize="14" fontWeight="700" fill="#0f172a">Niveau d’intensité sonore</text>
      {[[0, 60, '#bbf7d0'], [60, 85, '#fde68a'], [85, 120, '#fdba74'], [120, 130, '#fca5a5']].map(([a, b, c]) => <rect key={a} x={XL(a)} y="184" width={XL(b) - XL(a)} height="22" fill={c}/>)}
      {[[0, '0'], [60, '60'], [85, '85'], [120, '120']].map(([d, l]) => <g key={d}><line x1={XL(d)} x2={XL(d)} y1="184" y2="212" stroke="#475569"/><text x={XL(d)} y="226" fontSize="12.5" textAnchor="middle" fill="#334155">{l} dB</text></g>)}
      <text x={XL(0)} y="245" fontSize="11.5" fill="#475569">seuil d’audition</text>
      <text x={XL(60)} y="245" fontSize="11.5" textAnchor="middle" fill="#475569">conversation</text>
      <text x={XL(85)} y="258" fontSize="11.5" textAnchor="middle" fill="#475569">risque si exposition prolongée</text>
      <text x={XL(120)} y="245" fontSize="11.5" textAnchor="middle" fill="#475569">douleur</text>
      {!cacheL && L >= 0 && L <= 130 && <g><path d={`M ${XL(L)} 182 l -7 -12 h 14 z`} fill="#0f172a"/><text x={Math.max(60, Math.min(XL(L), 470))} y="282" fontSize="15" fontWeight="700" textAnchor="middle" fill="#0f172a">L = {nbf(L, 1)}{NB}dB</text></g>}
      {cacheL && <text x="260" y="282" fontSize="13" textAnchor="middle" fill="#64748b">Le niveau s’affichera après votre calcul.</text>}
    </svg>);
}

export function SimulationSon() {
  const [mode, setMode] = useState(() => modeOuverture('son-guide-v1'));
  useSignalerMode(mode);
  const [suiviFreq, noterFreq] = useCompteurDefi(), [suiviTimbre, noterTimbre] = useCompteurDefi(), [suiviNiv, noterNiv] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('son-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('freq');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('synthe');
  const [sy, setSy] = useState(BASE_SY), [nv, setNv] = useState(NV_BASE);
  const [vol, setVol] = useState(50);
  const [naturel, setNaturel] = useState(true);
  const audio = useAudio();
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const dd = enDefi && defi ? defi : null;
  const setS = f => setSy(s => ({ ...s, ...f }));

  // ---------- grandeurs effectives (le défi « fréquence » impose un son dont le fondamental est caché) ----------
  const cfg = dd?.type === 'freq' ? { preset: dd.timbre, f1: dd.f1, a: M.PRESETS[dd.timbre].a, u0: 0 } : { preset: sy.preset, f1: sy.f1, a: sy.a, u0: sy.u0 };
  const type = M.typeDe(cfg.preset);
  const fen = sy.fen;
  const u = M.echantillons(cfg, fen, 2400), comps = M.composantes(cfg);       // calcul léger (au plus 60 composantes × 2 400 points)
  const fmax = M.fmaxSpectre(type === 'bruit' ? 7 * cfg.f1 : Math.max(...comps.map(c => c.f), cfg.f1));
  const t1 = Math.min(sy.t1, fen), t2 = Math.min(sy.t2, fen);
  const d = Math.abs(t2 - t1), nP = sy.n;
  const Tmes = d > 0 ? M.periodeDepuisRepères(t1, t2, nP) : NaN, fmes = d > 0 ? M.frequenceDepuisPeriode(Tmes) : NaN;
  const P = M.puissanceRelative(cfg), Pref = 0.5, dL = M.niveauRelatif(P, Pref);
  const Pw = 10 ** nv.k, I = M.intensite(Pw, nv.r, nv.n), L = M.niveau(I);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const synthe = scene === 'synthe';
  const pointe = synthe && memeSy(sy, BASE_SY) && Math.abs(d - 6) <= 0.12 && ecartMax(t1, 2) <= 0.12 && ecartMax(t2, 2) <= 0.12;
  const cible = { pur: { scene: 'synthe', sy: BASE_SY }, repere: { scene: 'synthe', sy: { ...BASE_SY, ...T_PLACE }, pointe: true }, vio: { scene: 'synthe', sy: syDe('violon', 500, T_PLACE) }, vio1000: { scene: 'synthe', sy: syDe('violon', 1000, T_PLACE) }, nv: { scene: 'niveau', nv: NV_BASE } };
  const okCible = c => scene === c.scene && (!c.sy || memeSy(sy, c.sy)) && (!c.nv || memeNv(nv, c.nv)) && (!c.pointe || pointe);
  const ampOk = synthe && M.typeDe(sy.preset) === 'periodique' && sy.f1 === 500 && sy.u0 === 0 && Math.abs(sy.a[0] - 0.5) < 0.01 && sy.a.slice(1).every(x => x === 0);
  const bloqueRepere = pointe ? null : 'Placez d’abord les repères (étape « Mesurer trois périodes »), ou utilisez le bouton « Rétablir ».';
  const IIe = M.intensite(1e-3, 1), LL = M.niveauSource(1e-3, 1), L2 = M.niveauSource(1e-3, 2), Ln = M.niveauSource(1e-3, 1, 2);
  const ETAPES = [
    { id: 'pur', titre: 'Un son pur', focus: ['temps', 'spectre'], cible: cible.pur,
      texte: <>Un diapason émet un son très proche d’un <strong>son pur</strong> : la pression de l’air varie de façon <strong>sinusoïdale</strong>. Ici, on affiche (en unités arbitraires) la tension <em>u</em> qui commande un haut-parleur : en haut en fonction du temps, en bas son <strong>spectre</strong>, c’est-à-dire l’amplitude de chacune de ses composantes sinusoïdales selon leur fréquence.<Cap>{CAP.pur}</Cap></>,
      tache: { type: 'qcm', q: 'Que montre le spectre d’un son pur ?', options: ['une seule raie, à la fréquence du son', 'une raie à la fréquence du son et une raie à chacun de ses multiples', 'une multitude de raies sans lien entre elles'], bonne: 0,
        expl: 'Un son pur est une sinusoïde : il n’a qu’une seule composante, donc une seule raie dans son spectre.' } },
    { id: 'repere', titre: 'Mesurer trois périodes', focus: ['temps', 'mesures'], cible: cible.pur,
      texte: <>La <strong>période</strong> <em>T</em> est la durée d’un motif complet. Pour la mesurer précisément, on mesure la durée de <strong>plusieurs</strong> périodes d’un coup : placez le repère 1 sur un maximum de la courbe et le repère 2 sur le maximum situé <strong>3 périodes</strong> plus loin.<Cap>{CAP.grandeurs}</Cap></>,
      tache: { type: 'action', ok: pointe, bloque: null, label: 'Placer pour moi', consigne: 'Repères sur deux maximums séparés de 3 périodes', faire: () => { setScene('synthe'); setSy({ ...BASE_SY, ...T_PLACE }); } } },
    { id: 'mesureT', titre: 'Calculer la période', focus: ['mesures'], cible: cible.repere,
      texte: <>Lisez la durée <em>d</em> entre les repères dans « Mesures » (ici <em>d</em> = {nbf(d, 2)}{NB}ms). Elle correspond à 3 périodes : calculez <em>T</em> = <em>d</em> / 3.<Cap>{CAP.grandeurs}</Cap></>,
      tache: { type: 'num', q: 'Période T', unite: 'ms', vrai: d / 3, tol: 0.02, affiche: v => nbf(v, 2), bloque: bloqueRepere,
        calcul: () => [`d = ${nbf(d, 2)} ms pour 3 périodes.`, `T = ${nbf(d, 2)} / 3 = ${nbf(d / 3, 2)} ms.`],
        pieges: [[d, 'Vous avez donné la durée des trois périodes : divisez-la par 3.']],
        expl: `T = d / 3 ≈ ${nbf(d / 3, 2)} ms.` } },
    { id: 'freq', titre: 'Calculer la fréquence', focus: ['mesures', 'spectre'], cible: cible.repere,
      texte: <>La <strong>fréquence</strong> est le nombre de périodes par seconde : <em>f</em> = 1 / <em>T</em>, avec <em>T</em> en secondes. Avec <em>T</em> = {nbf(d / 3, 2)}{NB}ms (étape précédente), calculez <em>f</em>, puis comparez avec la position de la raie sur le spectre.<Cap>{CAP.grandeurs}</Cap></>,
      tache: { type: 'num', q: 'Fréquence f', unite: 'Hz', vrai: 1000 / (d / 3), tol: 0.02, affiche: v => nbf(v, 0), bloque: bloqueRepere,
        calcul: () => [`T = ${nbf(d / 3, 2)} ms = ${nbf(d / 3 * 1e-3, 4)} s.`, `f = 1 / T = 1 / ${nbf(d / 3 * 1e-3, 4)} = ${nbf(1000 / (d / 3), 0)} Hz.`],
        pieges: [[1 / (d / 3), 'T est en millisecondes : convertissez-la en secondes avant de calculer 1 / T.'], [1 / (d / 3) * 1000 * 1000, 'Vérifiez la conversion : 1 ms = 10⁻³ s.']],
        expl: 'f = 1 / T = 500 Hz. Le spectre confirme : la raie est à 500 Hz.' } },
    { id: 'violon', titre: 'Un son complexe', focus: ['reglages', 'temps', 'spectre'],
      texte: <>Un instrument réel n’émet pas un son pur. Affichez le son d’un <strong>violon</strong>, joué avec le même fondamental (500{NB}Hz) : la courbe n’est plus sinusoïdale et le spectre comporte plusieurs raies.<Cap>{CAP.pur}</Cap></>,
      tache: { type: 'action', ok: synthe && sy.preset === 'violon' && sy.f1 === 500, label: 'Jouer le violon', consigne: 'Choisissez le timbre « Violon » à 500 Hz', faire: () => { setScene('synthe'); setSy(syDe('violon', 500, T_PLACE)); } } },
    { id: 'periodeC', titre: 'La période d’un son complexe', focus: ['temps'], cible: cible.vio,
      texte: <>Les repères sont sur deux maximums séparés de trois motifs. Même si le signal est complexe, il se répète : il est <strong>périodique</strong>.<Cap>{CAP.harm}</Cap></>,
      tache: { type: 'qcm', q: 'Quelle est la période du signal du violon ?', options: ['2,0 ms, la période du fondamental', '1,0 ms, la moitié de celle du fondamental', 'Il n’a pas de période'], bonne: 0,
        expl: 'Le signal est la somme de sinusoïdes dont les fréquences sont des multiples de 500 Hz. Toutes se retrouvent identiques au bout de 2 ms, durée du motif commun : le signal a la période du fondamental.' } },
    { id: 'harm3', titre: 'Les harmoniques', focus: ['spectre'], cible: cible.vio,
      texte: <>Le spectre d’un son périodique contient le <strong>fondamental</strong>, de fréquence <em>f</em><sub>1</sub>, et des <strong>harmoniques</strong> de fréquences multiples : <em>f</em><sub>n</sub> = <em>n</em> × <em>f</em><sub>1</sub> (<em>n</em> = 2, 3, 4…).<Cap>{CAP.harm}</Cap></>,
      tache: { type: 'num', q: 'Fréquence de l’harmonique de rang 3', unite: 'Hz', vrai: 1500, tol: 0.001, affiche: v => nbf(v, 0), bloque: okCible(cible.vio) ? null : 'Affichez d’abord le violon à 500 Hz (bouton « Rétablir »).',
        calcul: () => ['f₃ = 3 × f₁ = 3 × 500 = 1 500 Hz.'], pieges: [[1000, '1 000 Hz est l’harmonique de rang 2 : le rang 3 correspond à 3 × f₁.'], [2000, '2 000 Hz est l’harmonique de rang 4.']],
        expl: 'f₃ = 3 × 500 = 1 500 Hz : on la lit sur le spectre, troisième raie.' } },
    { id: 'hauteur', titre: 'Monter le fondamental', focus: ['reglages', 'spectre'],
      texte: <>Réglez le fondamental sur <strong>1 000{NB}Hz</strong> avec le curseur, en gardant le timbre « Violon ».<Cap>{CAP.hauteur}</Cap></>,
      tache: { type: 'action', ok: synthe && sy.preset === 'violon' && sy.f1 >= 950, label: 'Régler f₁ = 1 000 Hz', consigne: 'Fondamental à 1 000 Hz, timbre Violon', faire: () => { setScene('synthe'); setSy(syDe('violon', 1000, T_PLACE)); } } },
    { id: 'hauteur2', titre: 'La hauteur', focus: ['spectre', 'temps'], cible: cible.vio1000,
      texte: <>Le son est passé de 500 à 1 000{NB}Hz. Comparez les deux situations : la période a été divisée par deux, les raies se sont écartées, mais leurs <strong>amplitudes relatives</strong> sont restées les mêmes.<Cap>{CAP.hauteur}</Cap></>,
      tache: { type: 'qcm', q: 'Quand le fondamental passe de 500 à 1 000 Hz, le son est perçu…', options: ['plus aigu, avec le même timbre', 'plus grave, avec le même timbre', 'plus aigu, avec un timbre différent'], bonne: 0,
        expl: 'La hauteur d’un son est modélisée par la fréquence de son fondamental : plus elle est élevée, plus le son est aigu. Les amplitudes relatives des harmoniques n’ont pas changé, donc le timbre non plus.' } },
    { id: 'clarinette', titre: 'Même note, autre instrument', focus: ['reglages', 'spectre'],
      texte: <>Passez à la <strong>clarinette</strong>, toujours à 1 000{NB}Hz : même note que le violon, instrument différent.<Cap>{CAP.hauteur}</Cap></>,
      tache: { type: 'action', ok: synthe && sy.preset === 'clarinette' && sy.f1 === 1000, label: 'Jouer la clarinette', consigne: 'Timbre « Clarinette » à 1 000 Hz', faire: () => { setScene('synthe'); setSy(syDe('clarinette', 1000, T_PLACE)); } } },
    { id: 'timbre', titre: 'Le timbre', focus: ['spectre', 'temps'],
      texte: <>Comparez le spectre de la clarinette à celui du violon : le fondamental est au même endroit, mais les raies suivantes n’ont pas les mêmes amplitudes (ici, seuls les harmoniques impairs sont présents).<Cap>{CAP.hauteur}</Cap></>,
      tache: { type: 'qcm', q: 'Deux instruments jouent la même note. Qu’est-ce qui distingue leurs spectres ?', options: ['les amplitudes des harmoniques : c’est le timbre', 'la fréquence du fondamental : c’est la hauteur', 'la durée de la période'], bonne: 0,
        expl: 'Même hauteur : même fondamental, donc même période. Le timbre est lié à la forme du signal, c’est-à-dire aux amplitudes relatives des harmoniques.' } },
    { id: 'continue', titre: 'La raie à 0 Hz', focus: ['reglages', 'spectre'],
      texte: <>Ajoutez une <strong>composante continue</strong> <em>u</em><sub>0</sub> = 1 avec le curseur : le signal est décalé vers le haut. Une nouvelle raie apparaît à 0{NB}Hz.<Cap>{CAP.continue}</Cap></>,
      tache: { type: 'action', ok: synthe && sy.u0 >= 0.5, label: 'Ajouter u₀ = 1', consigne: 'Composante continue u₀ = 1', faire: () => { setScene('synthe'); setSy(s => ({ ...s, u0: 1 })); } } },
    { id: 'continue2', titre: 'Interpréter la raie à 0 Hz', focus: ['spectre', 'temps'],
      texte: <>Observez la courbe : elle oscille toujours à la même fréquence, mais autour d’une valeur différente.<Cap>{CAP.continue}</Cap></>,
      tache: { type: 'qcm', q: 'Que représente la raie à 0 Hz ?', options: ['la valeur moyenne du signal (composante continue), qui ne produit pas de son (seules les variations de pression sont perçues)', 'un harmonique très grave', 'une erreur de mesure'], bonne: 0,
        expl: 'Une composante de fréquence nulle ne varie pas : c’est la valeur moyenne du signal. Elle ne fait pas vibrer l’air : seules les variations de pression sont perçues, donc cette composante ne s’entend pas et n’apporte aucune puissance acoustique.' } },
    { id: 'nonper', titre: 'Un son non périodique', focus: ['reglages', 'spectre', 'temps'],
      texte: <>Affichez maintenant un <strong>son non périodique</strong> : ses composantes ont des fréquences sans rapport simple entre elles.<Cap>{CAP.pur}</Cap></>,
      tache: { type: 'action', ok: synthe && sy.preset === 'nonper', label: 'Afficher le son non périodique', consigne: 'Timbre « Son non périodique »', faire: () => { setScene('synthe'); setSy(syDe('nonper', 500, T_PLACE)); } } },
    { id: 'nonper2', titre: 'Pas de motif qui se répète', focus: ['spectre', 'temps'],
      texte: <>Cherchez un motif qui se répète exactement dans la courbe : il n’y en a pas. Dans le spectre, les raies ne sont pas aux multiples d’une même fréquence.<Cap>{CAP.pur}</Cap></>,
      tache: { type: 'qcm', q: 'Un signal dont le spectre n’est pas formé de multiples d’une même fréquence est…', options: ['non périodique : sans hauteur bien définie (une cloche, très inharmonique, reste pourtant musicale : la frontière n’est pas nette)', 'périodique, de période 2 ms', 'un son pur'], bonne: 0,
        expl: 'Une onde périodique donne une hauteur bien définie : son spectre est fait d’un fondamental et de ses harmoniques. Ici ce n’est pas le cas : on perçoit un son sans hauteur précise. Certains sons presque non périodiques, comme celui d’une cloche, restent musicaux, mais leur hauteur est moins nette.' } },
    { id: 'amplitude', titre: 'Diviser l’amplitude par 2', focus: ['reglages', 'mesures'],
      texte: <>Revenez au son pur de 500{NB}Hz et réglez son amplitude <em>a</em><sub>1</sub> sur 0,5 (au lieu de 1). La puissance acoustique moyenne relative P<sub>rel</sub> = Σ <em>a</em>²/2 apparaît dans « Mesures » : pour <em>a</em><sub>1</sub> = 1, elle vaut 0,50.<Cap>{CAP.puissance}</Cap></>,
      tache: { type: 'action', ok: ampOk, label: 'Régler a₁ = 0,5', consigne: 'Son pur de 500 Hz, amplitude a₁ = 0,5', faire: () => { setScene('synthe'); setSy({ ...BASE_SY, ...T_PLACE, a: [0.5, 0, 0, 0, 0, 0] }); } } },
    { id: 'puissance', titre: 'Amplitude et puissance', focus: ['mesures'],
      texte: <>Comparez la puissance moyenne relative actuelle (P<sub>rel</sub> = {nbf(P, 3)}) à celle du son pur d’amplitude 1 (0,50). L’amplitude a été multipliée par 0,5.<Cap>{CAP.puissance}</Cap></>,
      tache: { type: 'num', q: 'Rapport P(a₁ = 0,5) / P(a₁ = 1)', unite: '', vrai: P / Pref, tol: 0.001, affiche: v => nbf(v, 2), bloque: ampOk ? null : 'Réglez d’abord a₁ = 0,5 sur un son pur de 500 Hz (étape précédente).',
        calcul: () => [`Prel vaut ${nbf(P, 3)} pour a₁ = 0,5 et 0,50 pour a₁ = 1.`, `Rapport : ${nbf(P, 3)} / 0,50 = ${nbf(P / Pref, 2)}.`],
        pieges: [[0.5, 'La puissance moyenne est proportionnelle au carré de l’amplitude : (0,5)² = 0,25, et non 0,5.']],
        expl: 'P est proportionnelle à A² : en multipliant A par 0,5, on multiplie P par 0,5² = 0,25. La puissance est divisée par 4 : elle ne varie pas proportionnellement à l’amplitude.' } },
    { id: 'niveau', titre: 'Le niveau d’intensité sonore', focus: ['scene'],
      texte: <>L’oreille n’est pas proportionnelle à la puissance reçue : on décrit le « volume sonore » par le <strong>niveau d’intensité sonore</strong> <em>L</em>, en décibels : <em>L</em> = 10 × log(<em>I</em> / <em>I</em><sub>0</sub>), avec <em>I</em><sub>0</sub> = 1,0 × 10⁻¹²{NB}W·m⁻². L’<strong>intensité</strong> <em>I</em> est la puissance reçue par unité de surface : <em>I</em> = <em>P</em> / <em>S</em>. Hypothèse : source ponctuelle qui émet de la même façon dans toutes les directions, en champ libre (sans sol ni mur réfléchissant), donc <em>S</em> = 4π<em>r</em>². La source émet <em>P</em> = 1,0{NB}mW.<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'action', ok: scene === 'niveau' && memeNv(nv, NV_BASE), label: 'Afficher la source (1 mW, à 1 m)', consigne: 'Source de 1,0 mW, sonomètre à 1,0 m', faire: () => { setScene('niveau'); setNv(NV_BASE); } } },
    { id: 'surface', titre: 'La surface de la sphère', focus: ['scene'], cible: cible.nv,
      texte: <>À 1,00{NB}m de la source, la puissance se répartit sur une sphère de rayon <em>r</em> = 1,00{NB}m. Calculez son aire <em>S</em> = 4π<em>r</em>² (<em>r</em> = 1,00{NB}m).<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'num', q: 'Aire S de la sphère', unite: 'm²', vrai: M.surfaceSphere(1), tol: 0.005, affiche: v => nbf(v, 2), cs: 3, bloque: okCible(cible.nv) ? null : 'Affichez d’abord la source de 1 mW à 1 m (bouton « Rétablir »).',
        calcul: () => ['S = 4π r² = 4 × π × (1,00)² = 12,57 m².'], pieges: [[Math.PI, 'Le disque a pour aire πr² ; la sphère a pour aire 4πr².']],
        expl: 'S = 4π r² ≈ 12,57 m².' } },
    { id: 'I', titre: 'L’intensité sonore', focus: ['scene'], cible: cible.nv,
      texte: <>Calculez l’intensité <em>I</em> = <em>P</em> / <em>S</em> à 1,00{NB}m, avec <em>P</em> = 1,0 × 10⁻³{NB}W et <em>S</em> = 12,57{NB}m² (étape précédente).<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'num', q: 'Intensité I', unite: 'W·m⁻²', vrai: IIe, tol: 0.01, affiche: v => sci(v, 3), cs: 3, aide: 'Écrivez par exemple 7,96e-5 pour 7,96 × 10⁻⁵.', bloque: okCible(cible.nv) ? null : 'Affichez d’abord la source de 1 mW à 1 m (bouton « Rétablir »).',
        calcul: () => ['I = P / S = 1,0 × 10⁻³ / 12,57 = 7,96 × 10⁻⁵ W·m⁻².'], pieges: [[1e-3, 'Vous avez donné la puissance : l’intensité est une puissance par unité de surface, divisez par S.']],
        expl: 'I = P / S ≈ 7,96 × 10⁻⁵ W·m⁻².' } },
    { id: 'L', titre: 'Le niveau en décibels', focus: ['scene'], cible: cible.nv,
      texte: <>Calculez <em>L</em> = 10 × log(<em>I</em> / <em>I</em><sub>0</sub>) avec <em>I</em> = 7,96 × 10⁻⁵{NB}W·m⁻² (étape précédente) et <em>I</em><sub>0</sub> = 1,0 × 10⁻¹²{NB}W·m⁻² (touche « log » de la calculatrice).<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'num', q: 'Niveau L', unite: 'dB', vrai: LL, tol: 0.004, affiche: v => nbf(v, 1), cs: 2, bloque: okCible(cible.nv) ? null : 'Affichez d’abord la source de 1 mW à 1 m (bouton « Rétablir »).',
        calcul: () => ['I / I₀ = 7,96 × 10⁻⁵ / 1,0 × 10⁻¹² = 7,96 × 10⁷.', 'L = 10 × log(7,96 × 10⁷) = 10 × 7,90 = 79,0 dB.'],
        pieges: [[10 * Math.log10(IIe), 'Vous avez oublié de diviser par I₀ avant de prendre le logarithme.'], [Math.log10(IIe / M.I0), 'Il manque le facteur 10 : L = 10 × log(I / I₀).']],
        expl: 'L = 10 × log(I / I₀) ≈ 79,0 dB.' } },
    { id: 'dist', titre: 'Doubler la distance', focus: ['reglages', 'scene'],
      texte: <>Placez maintenant le sonomètre à <strong>2,0{NB}m</strong> de la source. Pensez à ce que devient la surface sur laquelle la puissance se répartit.<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'action', ok: scene === 'niveau' && memeNv(nv, { ...NV_BASE, r: 2 }), label: 'Placer le sonomètre à 2 m', consigne: 'Distance r = 2,0 m, une seule source de 1 mW', faire: () => { setScene('niveau'); setNv({ ...NV_BASE, r: 2 }); } } },
    { id: 'L2', titre: 'Le niveau à 2 m', focus: ['scene'],
      texte: <>Refaites le calcul à <em>r</em> = 2,0{NB}m, avec toujours <em>P</em> = 1,0 × 10⁻³{NB}W : <em>S</em> = 4π<em>r</em>², puis <em>I</em>, puis <em>L</em>. (À 1,0{NB}m, vous aviez trouvé <em>L</em> = 79,0{NB}dB.)<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'num', q: 'Niveau L à 2,0 m', unite: 'dB', vrai: L2, tol: 0.004, affiche: v => nbf(v, 1), cs: 2, bloque: memeNv(nv, { ...NV_BASE, r: 2 }) && scene === 'niveau' ? null : 'Placez d’abord le sonomètre à 2 m (étape précédente, bouton « Rétablir »).',
        calcul: () => ['S = 4π × (2,0)² = 50,27 m².', 'I = 1,0 × 10⁻³ / 50,27 = 1,99 × 10⁻⁵ W·m⁻².', 'L = 10 × log(1,99 × 10⁻⁵ / 1,0 × 10⁻¹²) = 10 × log(1,99 × 10⁷) = 73,0 dB.'],
        pieges: [[LL / 2, 'Le niveau n’est pas divisé par 2 quand la distance double : refaites le calcul avec la nouvelle surface.']],
        expl: 'À 2,0 m : I ≈ 1,99 × 10⁻⁵ W·m⁻², donc L ≈ 73,0 dB, soit 6 dB de moins qu’à 1 m.' } },
    { id: 'dist3', titre: 'Chaque doublement de distance', focus: ['scene'],
      texte: <>Comparez les niveaux à 1,0{NB}m (79,0{NB}dB) et à 2,0{NB}m (73,0{NB}dB). La surface est multipliée par 4 quand la distance double, donc l’intensité est divisée par 4.<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'qcm', q: 'Quand on double la distance à une source ponctuelle (champ libre), le niveau…', options: ['diminue d’environ 6 dB', 'est divisé par 2', 'diminue d’environ 3 dB'], bonne: 0,
        expl: 'I est divisée par 4, donc L diminue de 10 × log(4) ≈ 6,0 dB, quelle que soit la distance de départ.' } },
    { id: 'sources', titre: 'Deux sources identiques', focus: ['reglages', 'scene'],
      texte: <>Revenez à 1,0{NB}m et ajoutez une deuxième source identique, au même endroit. Les deux sources sont indépendantes : leurs <strong>puissances s’ajoutent</strong>.<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'action', ok: scene === 'niveau' && memeNv(nv, { k: -3, r: 1, n: 2 }), label: 'Mettre deux sources', consigne: 'Deux sources de 1 mW, sonomètre à 1,0 m', faire: () => { setScene('niveau'); setNv({ k: -3, r: 1, n: 2 }); } } },
    { id: 'Ln', titre: 'Le niveau de deux sources', focus: ['scene'],
      texte: <>La puissance totale est doublée. À 1,0{NB}m, une seule source donnait <em>I</em> = 7,96 × 10⁻⁵{NB}W·m⁻² et <em>L</em> = 79,0{NB}dB. Calculez le niveau avec les deux sources (on additionne les <em>intensités</em>, pas les niveaux).<Cap>{CAP.niveau}</Cap></>,
      tache: { type: 'num', q: 'Niveau L pour deux sources', unite: 'dB', vrai: Ln, tol: 0.004, affiche: v => nbf(v, 1), cs: 2, bloque: scene === 'niveau' && memeNv(nv, { k: -3, r: 1, n: 2 }) ? null : 'Mettez d’abord deux sources à 1 m (étape précédente, bouton « Rétablir »).',
        calcul: () => ['I totale = 2 × 7,96 × 10⁻⁵ = 1,59 × 10⁻⁴ W·m⁻².', 'L = 10 × log(1,59 × 10⁻⁴ / 1,0 × 10⁻¹²) = 10 × log(1,59 × 10⁸) = 82,0 dB.'],
        pieges: [[2 * LL, 'On n’additionne pas les niveaux en décibels : on additionne les intensités, puis on calcule le niveau.'], [LL, 'Il faut tenir compte de la deuxième source : la puissance totale est doublée.']],
        expl: 'L = 10 × log(2I / I₀) = 79,0 + 10 × log 2 ≈ 82,0 dB : deux sources identiques ajoutent environ 3 dB.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR',
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>son pur : sinusoïde, une seule raie au spectre ; <em>f</em> = 1 / <em>T</em></li>
        <li>son musical : onde périodique ; spectre = fondamental <em>f</em><sub>1</sub> + harmoniques <em>n</em> × <em>f</em><sub>1</sub></li>
        <li>hauteur = fréquence du fondamental ; timbre = amplitudes relatives des harmoniques</li>
        <li>puissance moyenne ∝ amplitude² (amplitude × 2 : puissance × 4, soit + 6 dB)</li>
        <li><em>L</em> = 10 log(<em>I</em> / <em>I</em><sub>0</sub>) ; <em>I</em> = <em>P</em> / 4π<em>r</em>² ; distance × 2 : − 6 dB ; deux sources identiques : + 3 dB</li></ul>,
      texte: <>Vous savez lire un son sur sa courbe et sur son spectre, distinguer hauteur et timbre, et calculer un niveau sonore. Essayez maintenant les défis.<Cap>{CAP.numerique}</Cap></>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), apres = id => !enGuide || etape > IDS.indexOf(id), depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const cibleEtape = enGuide ? ETAPES[Math.min(etape, ETAPES.length - 1)].cible : null;
  const etapeARetablir = cibleEtape && !okCible(cibleEtape);
  const rendreBase = () => { if (cibleEtape.scene) setScene(cibleEtape.scene); if (cibleEtape.sy) setSy(cibleEtape.sy); if (cibleEtape.nv) setNv(cibleEtape.nv); };
  // en parcours guidé, le niveau et l’intensité ne sont affichés qu’une fois les calculs faits par l’élève
  const afficheL = !enGuide || (etape > IDS.indexOf('Ln'));
  const afficheI = !enGuide || etape > IDS.indexOf('Ln');

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(t) {
    const base = { type: t, reps: {}, verifie: false };
    if (t === 'freq') { const x = M.nouveauDefiFreq(); setDefi({ ...base, ...x }); setSy(s => ({ ...s, fen: 20, t1: 1, t2: 11, n: 3 })); }
    else if (t === 'timbre') setDefi({ ...base, ...M.nouveauDefiTimbre(), choix: null });
    else setDefi({ ...base, ...M.nouveauDefiNiveau() });
    audio.arreter();
  }
  function changerMode(md) {
    setMode(md); audio.arreter();
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') { setScene('synthe'); setSy(BASE_SY); setNv(NV_BASE); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'freq') {
      const x = lireNombre(defi.reps.f), ok = isFinite(x) && proche(x, defi.f1, 0.04);
      setDefi(v => ({ ...v, verifie: true, ok })); noterFreq(ok);
    } else if (defi.type === 'timbre') {
      const ok = defi.choix === defi.bonne; setDefi(v => ({ ...v, verifie: true, ok })); noterTimbre(ok);
    } else {
      const x = lireNombre(defi.reps.L), ok = isFinite(x) && Math.abs(x - defi.vrai) <= 0.5;
      setDefi(v => ({ ...v, verifie: true, ok })); noterNiv(ok);
    }
  };
  const champ = (cle, unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <label htmlFor={`so-${cle}`}>{label}</label>
      <input id={`so-${cle}`} value={defi.reps[cle] ?? ''} onKeyDown={e => e.key === 'Enter' && document.getElementById('so-verif')?.click()} onChange={e => setDefi(v => ({ ...v, reps: { ...v.reps, [cle]: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['freq', 'Fréquence du son'], ['timbre', 'Hauteur et timbre'], ['niveau', 'Niveau sonore']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'freq' ? 'Défi : quelle est la fréquence fondamentale de ce son ?' : defi.type === 'timbre' ? 'Défi : lequel de ces sons a la même hauteur que le son de référence, mais un timbre différent ?' : 'Défi : quel niveau sonore dans cette nouvelle situation ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'freq' && <>Le fondamental de ce son est caché et le spectre est masqué. Placez les repères sur des maximums, comptez le nombre de périodes entre eux (curseur « périodes comptées »), puis calculez la fréquence : <em>f</em> = 1 / <em>T</em>. Indice : comptez des <strong>motifs complets</strong> qui se répètent, pas des pics (un motif peut contenir plusieurs pics). <Cap>{CAP.grandeurs}</Cap></>}
        {defi.type === 'timbre' && <>Trois sons (A, B, C) sont comparés à un son de référence par leurs spectres. Rappel : la hauteur est donnée par le fondamental, le timbre par les amplitudes relatives des harmoniques. <Cap>{CAP.hauteur}</Cap></>}
        {defi.type === 'niveau' && <>{defi.r1 !== undefined
          ? <>Un sonomètre placé à <em>r</em><sub>1</sub> = {nbf(defi.r1, 0)}{NB}m d’une source sonore ponctuelle indique <em>L</em><sub>1</sub> = {defi.L1}{NB}dB. Quel niveau indiquerait-il à <em>r</em><sub>2</sub> = {nbf(defi.r2, 0)}{NB}m (même source, en champ libre (sans sol ni mur réfléchissant)) ? Répondez en dB, à 0,5 dB près. </>
          : <>Une machine, seule, produit un niveau <em>L</em><sub>1</sub> = {defi.L1}{NB}dB en un point. On place {defi.n} machines identiques et indépendantes au même endroit. Quel est le niveau en ce même point ? Répondez en dB, à 0,5 dB près. </>}<Cap>{CAP.niveau}</Cap></>}
      </div>
      {defi.type === 'freq' && champ('f', 'Hz', 'Fréquence fondamentale')}
      {defi.type === 'timbre' && <div role="radiogroup" aria-label="Son recherché" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {defi.cands.map(c => <button key={c.id} role="radio" aria-checked={defi.choix === c.id} onClick={() => setDefi(v => ({ ...v, choix: c.id, verifie: false }))} style={stylePetitBouton(defi.choix === c.id, '#0369a1')}>Son {c.id}</button>)}</div>}
      {defi.type === 'niveau' && champ('L', 'dB', 'Niveau cherché')}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="so-verif" onClick={verifier} disabled={defi.type === 'timbre' && !defi.choix} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'freq' ? `✓ Correct. Le fondamental était de ${defi.f1} Hz (période ${nbf(1000 / defi.f1, 2)} ms).` : defi.type === 'timbre' ? `✓ Correct : le son ${defi.bonne} a le même fondamental que la référence (${defi.ref.f} Hz) et des harmoniques d’amplitudes différentes.` : `✓ Correct : ${nbf(defi.vrai, 1)} dB.`)
          : defi.type === 'freq' ? '✗ Vérifiez : f = 1 / T avec T = d / n (n périodes entre les repères, repères sur des maximums), d en ms, donc T en s. L’unité attendue est le hertz.'
            : defi.type === 'timbre' ? '✗ La hauteur est donnée par le fondamental (la première raie) : cherchez le son dont le fondamental est à la même fréquence que celui de la référence. Le timbre est différent si les amplitudes des harmoniques ne sont pas les mêmes.'
              : defi.r1 !== undefined ? '✗ Vérifiez : l’intensité varie en 1 / r², donc L varie de −20 × log(r₂ / r₁). Doubler la distance fait perdre environ 6 dB.' : '✗ Vérifiez : on additionne les intensités (les puissances), pas les niveaux : L = L₁ + 10 × log(n).'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Signal</strong> : tension <em>u</em> en unités arbitraires qui commande un haut-parleur, variations de pression de l’air proportionnelles aux variations de <em>u</em> autour de <em>u</em><sub>0</sub> (pas de distorsion) ; une composante continue ne fait pas vibrer l’air. Les composantes sont toutes <strong>en phase</strong> à l’instant 0.</li>
      <li><strong>Écoute</strong> : avec « Son naturel », le son joué ajoute une attaque progressive, et selon l’instrument un vibrato ou un léger souffle. Le son suit en direct les réglages que vous modifiez pendant l’écoute (arrêt automatique après 60 s). Ces effets ne figurent pas sur le spectre affiché, qui décrit le son établi. En décochant « Son naturel », on entend exactement la somme des harmoniques affichés.</li>
      <li><strong>Timbres</strong> : les amplitudes des harmoniques sont des valeurs choisies pour illustrer, pas des mesures d’instruments réels. Un vrai instrument a des amplitudes qui varient dans le temps.</li>
      <li><strong>Son non périodique</strong> : fréquences égales à <em>f</em><sub>1</sub> multiplié par √1, √2, √5, √7, √11 et √13, sans rapport simple entre elles. <strong>Bruit</strong> : 60 composantes de fréquences et de phases choisies au hasard (le spectre d’un vrai bruit est continu).</li>
      <li><strong>Spectre</strong> : amplitude de chaque composante (raies), pas la transformée de Fourier d’un enregistrement. La raie à 0 Hz représente la valeur moyenne <em>u</em><sub>0</sub> du signal.</li>
      <li><strong>Mesure de la période</strong> : chaque repère est pointé à ± 0,05 ms près (demi-largeur = pas du curseur). Incertitude de type B, loi <strong>rectangulaire</strong> : u = demi-étendue / √3 pour un pointé ; les deux pointés sont indépendants, donc u(<em>d</em>) = √2 × 0,05 / √3 ms ≈ 0,04 ms ; l’incertitude relative sur <em>T</em> = <em>d</em> / <em>n</em> est u(<em>d</em>) / <em>d</em> (le nombre <em>n</em> est compté exactement). Mesurer plusieurs périodes d’un coup réduit l’incertitude relative.</li>
      <li><strong>Puissance relative</strong> : P<sub>rel</sub> = Σ <em>a</em>²/2 pour les composantes qui varient (moyenne sur un nombre entier de périodes) : la composante continue <em>u</em><sub>0</sub> n’en fait pas partie, car elle ne fait pas vibrer l’air. Elle est proportionnelle à la puissance acoustique moyenne ; l’unité est arbitraire, la référence est 0,50 (son pur d’amplitude 1).</li>
      <li><strong>Niveau d’intensité sonore</strong> : <em>L</em> = 10 log(<em>I</em> / <em>I</em><sub>0</sub>), avec <em>I</em><sub>0</sub> = 1,0 × 10⁻¹² W·m⁻². Source <strong>ponctuelle et isotrope</strong>, en <strong>champ libre</strong> (ni sol, ni murs, ni absorption par l’air), donc <em>I</em> = <em>P</em> / 4π<em>r</em>². Plusieurs sources identiques placées au même point sont <strong>indépendantes</strong> : leurs puissances s’ajoutent (deux sources de même fréquence et en phase pourraient interférer, ce qui n’est pas modélisé).</li>
      <li><strong>Écoute</strong> : le « bruit » entendu est un bruit blanc (spectre continu), alors que l’écran montre 60 raies. Le volume réel dépend de votre appareil ; il est plafonné ici. L’amplitude à l’écran n’est pas étalonnée en décibels, et on ne tient pas compte de la sensibilité de l’oreille selon la fréquence.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène « spectre et timbre » ----------
  const cleSon = dd?.type === 'freq' ? dd.timbre : sy.preset;
  const aProfil = !!PROFILS_AUDIO[cleSon] && type !== 'bruit';
  const etatSon = { comps, bruit: type === 'bruit', vol, naturel, cle: cleSon };
  const cleComps = comps.map(c => `${Math.round(c.f * 100)}:${Math.round(c.a * 1000)}`).join('|');
  const etatRef = useRef(etatSon), { joue: sonJoue, maj: majSon } = audio;
  useEffect(() => { etatRef.current = etatSon; });
  useEffect(() => { if (sonJoue) majSon(etatRef.current); }, [sonJoue, majSon, cleComps, vol, naturel, cleSon, type]);
  const ecoute = (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={() => (audio.joue ? audio.arreter() : audio.demarrer(etatSon))} aria-pressed={audio.joue} style={stylePetitBouton(audio.joue, COUL)}><Pic n="signal"/>{audio.joue ? 'Arrêter le son' : 'Écouter'}</button>
      <label style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>Volume
        <input type="range" min="10" max="100" step="10" value={vol} onChange={e => setVol(parseInt(e.target.value, 10))} aria-label="Volume d’écoute" aria-valuetext={`${vol} pour cent`} style={{ width: 90 }}/></label>
      {aProfil && <label style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={naturel} onChange={e => setNaturel(e.target.checked)}/>Son naturel</label>}
      {audio.erreur && <span role="status" style={{ fontSize: 12.5, color: '#b91c1c' }}>{audio.erreur}</span>}
    </div>);
  const barreEcoute = ((dd ? dd.type === 'freq' : scene === 'synthe')) && (
    <div className="so-barre" role="group" aria-label="Écoute du son">{ecoute}</div>);
  const boiteTemps = (
    <div style={{ ...styleBoite, ...cadre('temps') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Évolution temporelle <span style={{ fontWeight: 600, fontSize: 13, color: KIT.txt2 }}>({dd?.type === 'freq' ? 'son à identifier' : M.PRESETS[sy.preset]?.nom || 'Réglage personnel'}{dd || type !== 'periodique' ? '' : ' · son périodique'})</span></div>
      <Temps u={u} fen={fen} t1={t1} t2={t2} avecRepères aria={`Évolution de la tension en fonction du temps sur ${fen} millisecondes, ${type === 'bruit' ? 'signal irrégulier' : type === 'nonper' ? 'signal qui ne se répète pas' : 'signal périodique'}`}/>
      <div role="group" aria-label="Placer les repères" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px', marginTop: 8 }}>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Placer les repères (curseurs, ou flèches du clavier)</div>
        {[['t1', 'Repère 1 (orange)', t1, COUL_B], ['t2', 'Repère 2 (bleu)', t2, '#1d4ed8']].map(([k, n, vv, c]) => <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: KIT.txt, marginTop: 4 }}><span style={{ fontWeight: 700, minWidth: 130 }}>{n}</span>
          <input type="range" aria-label={n} aria-valuetext={`${nbf(vv, 2)} millisecondes`} min={0} max={fen} step={0.05} value={vv} onChange={e => setS({ [k]: parseFloat(e.target.value) })} style={{ flex: 1, minHeight: 32, accentColor: c }}/></label>)}
      </div>
    </div>);
  const masqueSpectre = dd?.type === 'freq';
  const boiteSpectre = (
    <div style={{ ...styleBoite, ...cadre('spectre') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Spectre en amplitude</div>
      {masqueSpectre ? <div style={{ fontSize: 14, color: KIT.txt2, padding: '18px 8px', textAlign: 'center', border: `1px dashed ${KIT.bord}`, borderRadius: 10 }}>Spectre masqué dans ce défi : mesurez la période sur la courbe.</div>
        : <Spectre comps={comps} u0={cfg.u0} fmax={fmax} type={type} aria={type === 'bruit' ? 'Spectre d’un bruit : de nombreuses raies de fréquences quelconques' : `Spectre : ${comps.length} raie${comps.length > 1 ? 's' : ''}${type === 'periodique' ? `, fondamental à ${cfg.f1} hertz` : ', fréquences sans rapport simple'}`}/>}
      {!masqueSpectre && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{type === 'periodique' ? 'Les raies sont aux multiples de la fréquence du fondamental (étiquettes en Hz).' : type === 'nonper' ? 'Les fréquences des raies n’ont pas de rapport simple entre elles.' : 'Les fréquences et les phases sont quelconques.'}</div>}
    </div>);
  const boutonRetablir = etapeARetablir && <button onClick={rendreBase} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>Rétablir le réglage de cette étape</button>;
  const sceneSynthe = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{boutonRetablir}<div style={{ ...styleBoite, ...cadre('reglages') }}>{dd?.type === 'freq' ? null : <>
    <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Timbre</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {Object.entries(M.PRESETS).map(([k, p]) => <button key={k} onClick={() => setSy(s => ({ ...s, preset: k, a: p.a.slice() }))} aria-pressed={sy.preset === k} style={stylePetitBouton(sy.preset === k, COUL)}>{k === 'pur' ? 'Son pur' : k === 'creux' ? 'Fondamental faible' : k === 'nonper' ? 'Non périodique' : p.nom.split(' (')[0]}</button>)}</div>
      </>}</div>{boiteTemps}{boiteSpectre}</div>);

  const reglagesSynthe = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {dd?.type === 'freq' ? <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8 }}>Son de timbre {M.PRESETS[dd.timbre].nom.toLowerCase()}, fondamental inconnu.</div> : <>
        <Curseur nom="Fréquence du fondamental f1" valeur={sy.f1} onChange={v => setS({ f1: v })} min={100} max={1000} pas={10} unite="Hz" decimales={0} couleur={COUL}/>
        {sy.preset !== 'bruit' && <>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>{type === 'nonper' ? 'Amplitudes des 6 composantes' : 'Amplitudes du fondamental et des harmoniques'}</div>
          <div className="so-amp">{sy.a.map((v, i) => <Curseur key={i} nom={type === 'nonper' ? `Composante ${i + 1}` : i === 0 ? 'a1 (fondamental)' : `a${i + 1} (rang ${i + 1})`} valeur={v} onChange={x => setSy(s => ({ ...s, preset: s.preset === 'nonper' ? 'nonper' : 'perso', a: s.a.map((y, j) => (j === i ? x : y)) }))} min={0} max={1} pas={0.05} decimales={2} couleur={COUL}/>)}</div>
          <Curseur nom="Composante continue u0" valeur={sy.u0} onChange={v => setS({ u0: v })} min={0} max={1} pas={0.1} unite="" decimales={1} couleur="#b45309"/></>}
      </>}
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Fenêtre de temps affichée</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{[10, 20, 40].map(x => <button key={x} onClick={() => setS({ fen: x, t1: Math.min(sy.t1, x), t2: Math.min(sy.t2, x) })} aria-pressed={sy.fen === x} style={stylePetitBouton(sy.fen === x, '#475569')}>{x} ms</button>)}</div>
    </div>);

  const mesuresSynthe = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Repère 1 (orange)" valeur={`${nbf(t1, 2)}${NB}ms`} couleur={COUL_B}/>
      <LigneMesure nom="Repère 2 (bleu)" valeur={`${nbf(t2, 2)}${NB}ms`} couleur="#1d4ed8"/>
      <LigneMesure nom="Durée d entre les repères" valeur={`${nbf(d, 2)}${NB}ms`}/>
      {!enGuide && <Curseur nom="Nombre de périodes comptées entre les repères" valeur={sy.n} onChange={v => setS({ n: v })} min={1} max={20} pas={1} decimales={0} couleur="#475569"/>}
      {!dd && apres('mesureT') && <LigneMesure nom={`Période T = d / ${nP}`} valeur={d > 0 ? `${nbf(Tmes, 2)}${NB}ms` : '–'} couleur="#15803d"/>}
      {!dd && apres('freq') && <LigneMesure nom="Fréquence f = 1 / T" valeur={d > 0 ? `${nbf(fmes, 0)}${NB}Hz` : '–'} couleur="#15803d"/>}
      {!dd && !enGuide && d > 0 && <LigneMesure nom="Incertitude relative sur T" valeur={`${nbf(M.incertitudeRelPeriode(0.05, d) * 100, 1)} %`}/>}
      {!dd && mode === 'explore' && type === 'periodique' && <LigneMesure nom="Fondamental réglé f1" valeur={`${sy.f1}${NB}Hz`}/>}
      {!dd && depuis('amplitude') && <LigneMesure nom="Puissance acoustique relative Σ a²/2" valeur={nbf(P, 3)} couleur={COUL}/>}
      {!dd && depuis('amplitude') && <LigneMesure nom="Référence : son pur, a1 = 1" valeur="0,500"/>}
      {!dd && apres('niveau') && <LigneMesure nom="Variation de niveau (relative à la référence)" valeur={`${dL >= 0 ? '+' : '−'}${nbf(Math.abs(dL), 1)}${NB}dB`} couleur="#15803d"/>}
    </div>);

  // ---------- scène « niveau sonore » ----------
  const sceneNiveau = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {boutonRetablir}
      <SceneNiveau P={Pw} r={nv.r} n={nv.n} L={L} cacheL={!afficheL}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Source ponctuelle, en champ libre (sans sol ni mur réfléchissant). Chaque source émet la puissance acoustique <em>P</em> indiquée.</div>
    </div>);
  const reglagesNiveau = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>Puissance P d’une source</span><span style={{ color: KIT.txt }}>10<sup>{nv.k}</sup>{NB}W</span></div>
        <input type="range" min={-6} max={0} step={1} value={nv.k} onChange={e => setNv(x => ({ ...x, k: parseInt(e.target.value, 10) }))} aria-label="Puissance d’une source (exposant de 10, en watts)" aria-valuetext={`10 puissance ${nv.k} watt`} style={{ width: '100%', accentColor: COUL }}/>
      </div>
      <Curseur nom="Distance r à la source" valeur={nv.r} onChange={v => setNv(s => ({ ...s, r: v }))} min={1} max={50} pas={0.5} unite="m" decimales={1} couleur="#b45309"/>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Nombre de sources identiques</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[1, 2, 3, 4, 10].map(x => <button key={x} onClick={() => setNv(s => ({ ...s, n: x }))} aria-pressed={nv.n === x} style={stylePetitBouton(nv.n === x, COUL)}>{x}</button>)}</div>
    </div>);
  const mesuresNiveau = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Puissance totale n × P" valeur={`${nbm(nv.n * Pw * 1000, 3)}${NB}mW`}/>
      <LigneMesure nom="Distance r" valeur={`${nbf(nv.r, 1)}${NB}m`}/>
      <LigneMesure nom="Surface S = 4π r²" valeur={`${nbf(M.surfaceSphere(nv.r), 2)}${NB}m²`}/>
      {afficheI && <LigneMesure nom="Intensité I = n P / S" valeur={`${sci(I, 3)}${NB}W·m⁻²`} couleur="#15803d"/>}
      {afficheL && <LigneMesure nom="Niveau L = 10 log(I / I0)" valeur={`${nbf(L, 1)}${NB}dB`} couleur="#15803d"/>}
      {!enGuide && <LigneMesure nom="Seuil I0" valeur={`1,0 × 10⁻¹²${NB}W·m⁻²`}/>}
    </div>);

  // ---------- défis « timbre » et « niveau » : vues dédiées ----------
  const vueTimbre = dd?.type === 'timbre' && (() => {
    const tous = [{ id: 'Réf.', ...dd.ref }, ...dd.cands], fm = M.fmaxSpectre(6 * Math.max(...tous.map(c => c.f)) * 0.78);
    return (
      <div className="so-mini">{tous.map(c => {
        const cs = M.composantes({ preset: c.timbre, f1: c.f, a: M.PRESETS[c.timbre].a, u0: 0 });
        return (<div key={c.id} style={{ ...styleBoite, padding: '10px 12px', outline: dd.choix === c.id ? '3px solid #0369a1' : 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{c.id === 'Réf.' ? 'Son de référence' : `Son ${c.id}`}</div>
          <Spectre comps={cs} u0={0} fmax={fm} type="periodique" H={170} W={400} aria={`Spectre du ${c.id === 'Réf.' ? 'son de référence' : `son ${c.id}`} : fondamental à ${c.f} hertz`}/></div>);
      })}</div>);
  })();
  const vueNiveau = dd?.type === 'niveau' && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Situation de départ</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div role="img" aria-label={`Sonomètre : ${dd.L1} décibels`} style={{ background: '#0f172a', color: '#a7f3d0', fontFamily: 'monospace', fontSize: 30, fontWeight: 700, borderRadius: 10, padding: '10px 18px', letterSpacing: 1 }}>{dd.L1}{NB}dB</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, flex: '1 1 220px' }}>{dd.r1 !== undefined ? <>mesuré à {nbf(dd.r1, 0)}{NB}m de la source.</> : <>niveau produit par une machine seule.</>}</div>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 8 }}>Source ponctuelle, champ libre, sources indépendantes (voir les hypothèses de travail).</div>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Mesurez la période d’un son complexe : change-t-elle quand on modifie les amplitudes des harmoniques ?</li>
        <li>Mettez le fondamental à 100 Hz puis à 1 000 Hz avec le timbre violon : qu’est-ce qui reste identique sur le spectre (les rapports d’amplitudes) ?</li>
        <li>Choisissez « Fondamental faible » : la période du signal est-elle celle du fondamental ou celle de l’harmonique le plus fort ?</li>
        <li>Réglez deux harmoniques à 0 pour obtenir une clarinette : quels rangs sont absents ?</li>
        <li>Doublez l’amplitude de tous les harmoniques : par combien la puissance est-elle multipliée ?</li>
        <li>Écoutez le son pur, puis le violon à la même fréquence : qu’est-ce qui change à l’oreille ?</li>
        <li>Niveau sonore : à quelle distance une source de 1 mW tombe-t-elle sous 60 dB ? Et si on met 10 sources ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>son pur : une raie ; son musical : fondamental <em>f</em><sub>1</sub> et harmoniques <em>n</em> <em>f</em><sub>1</sub></li>
        <li>hauteur : fondamental ; timbre : amplitudes relatives des harmoniques</li>
        <li>puissance moyenne ∝ amplitude²</li>
        <li><em>L</em> = 10 log(<em>I</em> / <em>I</em><sub>0</sub>) ; <em>I</em> = <em>P</em> / 4π<em>r</em>² ; distance × 2 : − 6 dB ; deux sources : + 3 dB</li>
      </ul>
    </ARetenir>);

  const zoneScene = dd ? (dd.type === 'freq' ? sceneSynthe : dd.type === 'timbre' ? vueTimbre : vueNiveau) : scene === 'synthe' ? sceneSynthe : sceneNiveau;
  const colDroite = dd ? (dd.type === 'freq' ? <>{reglagesSynthe}{mesuresSynthe}</> : null) : scene === 'synthe' ? <>{reglagesSynthe}{mesuresSynthe}</> : <>{reglagesNiveau}{mesuresNiveau}</>;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .so-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .so-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .so-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .so-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .so-pri.pile { grid-template-columns: minmax(0, 1fr); }
        .so-barre { position: sticky; bottom: 0; z-index: 20; background: #fff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -2px 10px rgba(15, 23, 42, .12); margin-top: 8px; }
        .so-amp { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 12px; }
        .so-mini { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        @media (min-width: 901px) { .so-l1.cote .so-carte { order: 2; } .so-l1.cote .so-main { order: 1; } }
        @media (max-width: 900px) { .so-l1.cote, .so-pri { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 520px) { .so-amp, .so-mini { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Son : spectre, hauteur, timbre et niveau sonore</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un son est une onde périodique ou non : on le décrit par sa <strong>courbe</strong> (évolution temporelle), son <strong>spectre</strong> (fréquences des composantes), sa <strong>hauteur</strong> (fondamental), son <strong>timbre</strong> (amplitudes des harmoniques) et son <strong>niveau</strong> en décibels.</div>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {[['synthe', 'Spectre et timbre'], ['niveau', 'Niveau sonore']].map(([k, l]) => <button key={k} onClick={() => { setScene(k); audio.arreter(); }} aria-pressed={scene === k} style={stylePetitBouton(scene === k, COUL)}>{l}</button>)}
      </div>}
      <div className={`so-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="so-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="so-carte">{panneauHypo}</div> : null}
        <div className="so-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'freq' ? suiviFreq : defi.type === 'timbre' ? suiviTimbre : suiviNiv}/></div>}
          <div className={`so-pri${mode !== 'explore' || !colDroite ? ' pile' : ''}`}>
            <div>{zoneScene}</div>
            {colDroite && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{colDroite}</div>}
          </div>
        </div>
      </div>
      {!enDefi && <div className="so-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="so-l2">{aEssayer}{retenir}</div>}
      {barreEcoute}
    </div>
  );
}
