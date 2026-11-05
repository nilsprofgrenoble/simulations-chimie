import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./echoModele";

const SIM_ID = 88;
declarerDefis(SIM_ID, [['distance', 'Quelle est la distance de l’obstacle ?'], ['celerite', 'Quelle est la célérité du son dans ce gaz ?'],
  ['profondeur', 'À quelle profondeur se trouve l’organe ?'], ['frequence', 'Quelle fréquence minimale sépare les deux détails ?']]);

// ====================================================
//  SIM 88 — ÉCHOGRAPHE : capteur de distance à ultrasons (retard, célérité, température, gaz) puis échographe unidimensionnel
//  (échos aux interfaces, coefficients R et T, absorption, résolution et choix de la fréquence).
//  Capacités du référentiel STL (Terminale, Ondes) : voir la ligne « Capacité » de chaque étape et de chaque défi.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const tire = t => t[Math.floor(Math.random() * t.length)];
const alea = (a, b, pas) => Math.round((a + Math.random() * (b - a)) / pas) * pas;
const arr = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
const ORG = M.MILIEUX.organe.v;
const TAU = Math.PI * 2;
const LETTRES = 'abcdefghij';

// Sur téléphone, les figures gardent une largeur lisible et défilent horizontalement dans leur cadre
const Defile = ({ min = 480, children }) => <div style={{ overflowX: 'auto', maxWidth: '100%' }}><div style={{ minWidth: min }}>{children}</div></div>;

// ---------- schéma du capteur (animation ralentie, non à l’échelle des temps) ----------
function Trajet({ d, anim }) {
  const ref = useRef(null);
  const xo = 70 + d / 4 * 470;
  useEffect(() => {
    const c = ref.current; if (!c) return;
    let raf, t0 = performance.now();
    const pose = u => {                                    // u ∈ [0,1[ : aller puis retour
      const aller = u < 0.5, p = aller ? u * 2 : (u - 0.5) * 2;
      c.setAttribute('cx', aller ? 58 + p * (xo - 62) : xo - 4 - p * (xo - 62)); c.setAttribute('cy', aller ? 34 : 56); c.setAttribute('fill', aller ? '#b45309' : '#0e7490');
    };
    if (!anim) { pose(0.25); return; }
    const boucle = now => { pose(((now - t0) / 3200) % 1); raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [xo, anim]);
  return (
    <svg viewBox="0 0 600 100" role="img" aria-label={`Schéma : le capteur envoie une salve vers un obstacle situé à ${nbf(d, 2)} mètres ; la salve revient après réflexion`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <rect x="22" y="26" width="30" height="42" rx="5" fill="#334155"/><text x="37" y="84" fontSize="11.5" textAnchor="middle" fill={KIT.txt2}>capteur</text>
      <rect x={xo} y="20" width="12" height="64" fill="#94a3b8" stroke="#475569"/><text x={xo + 6} y="96" fontSize="11.5" textAnchor="middle" fill={KIT.txt2}>obstacle</text>
      <line x1="56" y1="34" x2={xo - 4} y2="34" stroke="#b45309" strokeWidth="1.5" strokeDasharray="5 4"/><line x1={xo - 4} y1="56" x2="56" y2="56" stroke="#0e7490" strokeWidth="1.5" strokeDasharray="5 4"/>
      <line x1="56" y1="17" x2={xo} y2="17" stroke={KIT.txt} strokeWidth="1"/><text x={(56 + xo) / 2} y="13" fontSize="12" textAnchor="middle" fill={KIT.txt}>d = {nbf(d, 2)} m</text>
      <circle ref={ref} r="6" cx="58" cy="34" fill="#b45309"/>
    </svg>);
}

// ---------- oscillogramme du capteur ----------
const SC = { X0: 10, L: 580, H: 176, YC: 78 };
function Oscillo({ tb, te, amp, r1, r2, setR }) {
  const x = t => SC.X0 + t / tb * SC.L;
  const paquet = (t0, a, dur) => Array.from({ length: 81 }, (_, i) => { const u = i / 80; return `${x(t0 + u * dur).toFixed(1)},${(SC.YC - a * Math.sin(Math.PI * u) ** 0.7 * Math.sin(TAU * 14 * u) * 66).toFixed(1)}`; }).join(' ');
  const dur = Math.max(0.3, tb * 0.02);
  const clic = e => {
    const b = e.currentTarget.getBoundingClientRect(), t = Math.min(tb, Math.max(0, ((e.clientX - b.left) / b.width * 600 - SC.X0) / SC.L * tb));
    setR(Math.abs(t - r1) <= Math.abs(t - r2) ? 1 : 2, Math.round(t / (tb / 400)) * (tb / 400));
  };
  const pas = tb / 10;
  return (
    <svg viewBox={`0 0 600 ${SC.H + 24}`} role="img" aria-label={`Oscillogramme : salve émise à 0 milliseconde, écho reçu à ${nbf(te, 2)} millisecondes`} onClick={clic} style={{ width: '100%', display: 'block', background: '#0f172a', borderRadius: 10, cursor: 'crosshair', touchAction: 'manipulation' }}>
      {Array.from({ length: 11 }, (_, i) => <g key={i}><line x1={x(i * pas)} x2={x(i * pas)} y1="6" y2={SC.H} stroke="#1e293b"/><text x={x(i * pas)} y={SC.H + 15} fontSize="11" textAnchor={i === 0 ? 'start' : i === 10 ? 'end' : 'middle'} fill="#cbd5e1">{nbf(i * pas, pas < 2 ? 1 : 0)}</text></g>)}
      <text x="594" y="16" fontSize="11" textAnchor="end" fill="#94a3b8">t (ms)</text>
      <line x1={SC.X0} x2="590" y1={SC.YC} y2={SC.YC} stroke="#334155"/>
      <polyline points={paquet(0, 1, dur)} fill="none" stroke="#fbbf24" strokeWidth="1.4"/>
      {te <= tb - dur && <polyline points={paquet(te, amp, dur)} fill="none" stroke="#38bdf8" strokeWidth="1.4"/>}
      {te > tb - dur && <text x="300" y="40" fontSize="13" textAnchor="middle" fill="#fca5a5">L’écho arrive après la fin de l’écran : choisissez une base de temps plus longue.</text>}
      <text x={x(0) + 14} y="22" fontSize="11.5" fill="#fbbf24">émission</text>
      {te <= tb - dur && <text x={Math.min(x(te) + 4, 540)} y="22" fontSize="11.5" fill="#38bdf8">écho</text>}
      {[[r1, '#fb923c', 'repère 1'], [r2, '#60a5fa', 'repère 2']].map(([r, c, n]) => <g key={n}><line x1={x(r)} x2={x(r)} y1="6" y2={SC.H} stroke={c} strokeWidth="1.6" strokeDasharray="4 3"/><text x={x(r) + (x(r) > 520 ? -4 : 4)} y={SC.H - 6} fontSize="11" textAnchor={x(r) > 520 ? 'end' : 'start'} fill={c}>{n}</text></g>)}
    </svg>);
}

// ---------- balayage A de l’échographe (niveau en dB en fonction du retard) ----------
const EC = { X0: 46, L: 546, TMAX: 110, TOP: 20, HH: 150 };
const xT = t => EC.X0 + t / EC.TMAX * EC.L, yL = L => EC.TOP + Math.min(100, Math.max(0, -L)) / 100 * EC.HH;
function Echogramme({ lst, f, r1, r2 }) {
  const yB = EC.TOP + EC.HH;
  return (
    <svg viewBox="0 0 600 248" role="img" aria-label={`Balayage A : ${lst.filter(e => e.detecte).length} échos détectés sur ${lst.length}, niveaux en décibels en fonction du retard en microsecondes`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      {[0, -20, -40, -60, -80, -100].map(L => <g key={L}><line x1={EC.X0} x2={EC.X0 + EC.L} y1={yL(L)} y2={yL(L)} stroke="#e2e8f0"/><text x={EC.X0 - 5} y={yL(L) + 4} fontSize="11" textAnchor="end" fill={KIT.txt2}>{L}</text></g>)}
      <text x="6" y="11" fontSize="11" fill={KIT.txt2}>niveau (dB)</text>
      <line x1={EC.X0} x2={EC.X0 + EC.L} y1={yL(M.SEUIL_DB)} y2={yL(M.SEUIL_DB)} stroke="#dc2626" strokeDasharray="5 3"/>
      <text x={EC.X0 + EC.L - 2} y={yL(M.SEUIL_DB) - 4} fontSize="11" textAnchor="end" fill="#b91c1c">seuil de détection : {M.SEUIL_DB}{NB}dB</text>
      <line x1={EC.X0} x2={EC.X0 + EC.L} y1={yB} y2={yB} stroke={KIT.txt2}/>
      {Array.from({ length: 12 }, (_, i) => i * 10).map(t => <g key={t}><line x1={xT(t)} x2={xT(t)} y1={yB} y2={yB + 4} stroke={KIT.txt2}/><text x={xT(t)} y={yB + 16} fontSize="11" textAnchor="middle" fill={KIT.txt2}>{t}</text></g>)}
      <text x={EC.X0 - 5} y={yB + 16} fontSize="11" textAnchor="end" fill={KIT.txt2}>t (µs)</text>
      {[0, 2, 4, 6, 8].map(p => { const t = 2 * p * 1e-2 / M.V_APPAREIL * 1e6; return <g key={p}><line x1={xT(t)} x2={xT(t)} y1={yB + 20} y2={yB + 24} stroke="#64748b"/><text x={xT(t)} y={yB + 36} fontSize="11" textAnchor="middle" fill="#64748b">{p}</text></g>; })}
      <text x={EC.X0 - 5} y={yB + 36} fontSize="10.5" textAnchor="end" fill="#64748b">cm*</text>
      {lst.map((e, i) => { const X = xT(e.t * 1e6), Y = yL(e.niveau), c = e.detecte ? '#0e7490' : '#94a3b8';
        return <g key={e.id}><line x1={X} x2={X} y1={yB} y2={Y} stroke={c} strokeWidth={e.detecte ? 2.4 : 1.6} strokeDasharray={e.detecte ? null : '3 3'}/>
          <circle cx={X} cy={Y} r={e.detecte ? 3.2 : 2.4} fill={e.detecte ? c : 'white'} stroke={c}/><text x={X} y={Math.max(10, Y - 6)} fontSize="12" fontWeight="700" textAnchor="middle" fill={e.detecte ? '#0f172a' : '#64748b'}>{LETTRES[i]}</text></g>; })}
      <rect x={EC.X0} y="216" width={EC.L} height="22" fill="#0f172a" rx="3"/>
      {lst.filter(e => e.detecte).map(e => { const v = Math.round(70 + 185 * Math.min(1, Math.max(0, (e.niveau + 80) / 70))), w = Math.max(2, 2.355 / f / EC.TMAX * EC.L); return <rect key={e.id} x={xT(e.t * 1e6) - w / 2} y="216" width={w} height="22" fill={`rgb(${v},${v},${v})`}/>; })}
      <text x={EC.X0 + 6} y="231" fontSize="11" fill="#cbd5e1">image 1D reconstruite (profondeur calculée avec 1540{NB}m/s)</text>
      {[[r1, '#ea580c'], [r2, '#2563eb']].map(([r, c], k) => <line key={k} x1={xT(r)} x2={xT(r)} y1={EC.TOP} y2={yB} stroke={c} strokeWidth="1.6" strokeDasharray="4 3"/>)}
      <text x="592" y="246" fontSize="10" textAnchor="end" fill="#64748b">* profondeur calculée avec v = 1540 m/s</text>
    </svg>);
}

// ---------- zoom sur les deux détails ----------
const ZL = { X0: 36, L: 556, W: 7 };
function Zoom({ lst, f, u1, u2, sMasque }) {
  const d1 = lst.find(e => e.id === 'detail1'), d2 = lst.find(e => e.id === 'detail2');
  if (!d1) return null;
  const t1 = d1.t * 1e6, t2 = d2.t * 1e6, tc = (t1 + t2) / 2, t0 = tc - ZL.W / 2, det = d1.detecte;
  const x = t => ZL.X0 + (t - t0) / ZL.W * ZL.L, y = a => 142 - a / 2.1 * 118;
  const courbe = Array.from({ length: 281 }, (_, i) => { const t = t0 + i / 280 * ZL.W; return `${x(t).toFixed(1)},${y(M.enveloppe(t, [t1, t2], f)).toFixed(1)}`; }).join(' ');
  const lamT = 2 / f;                                                   // µs : écart de temps qui correspond à s = λ
  const sep = M.separables(M.ecartTemps(1, ORG) > 0 ? (t2 - t1) / 2 * ORG * 1e-6 * 1e3 : 0, M.longueurOnde(ORG, f));
  const ticks = Array.from({ length: 9 }, (_, i) => Math.ceil(t0) + i).filter(t => t >= t0 && t <= t0 + ZL.W);
  return (
    <svg viewBox="0 0 600 190" role="img" aria-label={`Zoom sur les deux détails : ${sep ? 'deux pics distincts' : 'un seul pic'}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <line x1={ZL.X0} x2={ZL.X0 + ZL.L} y1="142" y2="142" stroke={KIT.txt2}/>
      {ticks.map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1="142" y2="146" stroke={KIT.txt2}/><text x={x(t)} y="158" fontSize="11" textAnchor="middle" fill={KIT.txt2}>{t}</text></g>)}
      <text x={ZL.X0 - 4} y="158" fontSize="11" textAnchor="end" fill={KIT.txt2}>t (µs)</text>
      <text x="6" y="12" fontSize="11" fill={KIT.txt2}>amplitude (unité arbitraire, détails supposés identiques)</text>
      <polyline points={courbe} fill="none" stroke={det ? '#0e7490' : '#94a3b8'} strokeWidth="2.2" strokeDasharray={det ? null : '5 4'}/>
      {!sMasque && [t1, t2].map((t, k) => <path key={k} d={`M${x(t) - 5},142 L${x(t) + 5},142 L${x(t)},134 Z`} fill="#b45309"/>)}
      <g><line x1={x(tc) - lamT / 2 / ZL.W * ZL.L} x2={x(tc) + lamT / 2 / ZL.W * ZL.L} y1="30" y2="30" stroke="#7c3aed" strokeWidth="2"/>
        <text x={x(tc)} y="24" fontSize="11.5" textAnchor="middle" fill="#6d28d9">écart qui correspond à s = λ ({nbf(M.longueurOnde(ORG, f), 2)}{NB}mm)</text></g>
      {[[u1, '#ea580c'], [u2, '#2563eb']].map(([u, c], k) => <line key={k} x1={x(t0 + u)} x2={x(t0 + u)} y1="38" y2="142" stroke={c} strokeWidth="1.6" strokeDasharray="4 3"/>)}
      <text x="300" y="178" fontSize="12" textAnchor="middle" fill={KIT.txt}>{det ? (sep ? 'Deux pics distincts : les détails sont séparés.' : 'Un seul pic : les détails ne sont pas séparés.') : 'Échos sous le seuil de détection : on ne voit rien.'}</text>
    </svg>);
}

export function SimulationEchographe() {
  const [mode, setMode] = useState(() => modeOuverture('echographe-guide-v1'));
  useSignalerMode(mode);
  const [sDis, nDis] = useCompteurDefi(), [sCel, nCel] = useCompteurDefi(), [sPro, nPro] = useCompteurDefi(), [sFre, nFre] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('echographe-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('distance');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('capteur');
  const [cap, setCap] = useState({ d: 1.2, T: 20, gaz: 'air', tb: 20 }), [rc, setRc] = useState({ r1: 2, r2: 12 });
  const [eco, setEco] = useState({ f: 5, gel: true, s: 0.8 }), [ra, setRa] = useState({ r1: 8, r2: 30 }), [uz, setUz] = useState({ u1: 1.5, u2: 5.5 });
  const [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; } });
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const dd = enDefi && defi ? defi : null;
  const sceneEff = dd ? (['distance', 'celerite'].includes(dd.type) ? 'capteur' : 'echo') : scene;

  // ---------- grandeurs effectives (le défi impose des valeurs cachées) ----------
  const C = dd?.type === 'distance' ? { ...cap, d: dd.d, T: dd.T, gaz: 'air' } : dd?.type === 'celerite' ? { ...cap, d: dd.dref, T: dd.T, gaz: dd.gaz } : cap;
  const gaz = M.GAZ[C.gaz], vC = M.celeriteGaz(C.T, gaz), teMs = M.retardAllerRetour(C.d, vC) * 1e3, ampE = Math.min(0.95, 0.8 / (1 + 0.5 * C.d * C.d));
  const EP = dd?.type === 'profondeur' ? { ...M.EP_DEFAUT, graisse: dd.graisse, muscle: dd.muscle } : M.EP_DEFAUT;
  const E = { f: eco.f, gel: dd ? true : eco.gel, s: dd?.type === 'frequence' ? dd.s : eco.s };
  const lst = M.echos({ ep: EP, gel: E.gel, fMHz: E.f, sDetail: E.s });
  const eFond = lst.find(e => e.id === 'fond');
  const lamOrg = M.longueurOnde(ORG, E.f);
  const setR = (i, t) => setRc(r => ({ ...r, [i === 1 ? 'r1' : 'r2']: t }));
  const dtMes = Math.abs(rc.r2 - rc.r1), dtMesUs = Math.abs(ra.r2 - ra.r1), dzMes = Math.abs(uz.u2 - uz.u1);
  const tolPt = 0.01 * C.tb, tolUs = 0.7;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const capBase = scene === 'capteur' && cap.d === 1.2 && cap.T === 20 && cap.gaz === 'air' && cap.tb === 20;
  const teBase = M.retardAllerRetour(1.2, M.celeriteGaz(20)) * 1e3;
  const pointeCap = capBase && Math.abs(rc.r1) <= tolPt && Math.abs(rc.r2 - teBase) <= tolPt;
  const echoBase = scene === 'echo' && eco.f === 5 && eco.gel;
  const tOrgBase = M.echos({ fMHz: 5 }).find(e => e.id === 'muscle/organe').t * 1e6;
  const pointeEcho = echoBase && Math.abs(ra.r1) <= tolUs && Math.abs(ra.r2 - tOrgBase) <= tolUs;
  const v340 = M.distanceAffichee(M.retardAllerRetour(1.2, M.celeriteGaz(0)));
  const cap1 = t => <div style={{ fontSize: 12.5, color: '#475569', marginTop: 6, lineHeight: 1.4 }}>Capacité du référentiel : {t}</div>;
  const baseCap = () => { setScene('capteur'); setCap({ d: 1.2, T: 20, gaz: 'air', tb: 20 }); };
  const baseEcho = () => { setScene('echo'); setEco(e => ({ ...e, f: 5, gel: true })); };
  const ETAPES = [
    { id: 'principe', titre: 'Mesurer une durée', focus: ['scene'],
      texte: <>Un <strong>capteur de distance à ultrasons</strong> (télémètre, aide au stationnement) contient un émetteur et un récepteur côte à côte. Il envoie une brève salve d’ultrasons, qui se réfléchit sur un obstacle et revient. Le schéma montre le trajet (animation ralentie).{cap1('concevoir et mettre en œuvre un protocole pour mesurer un retard et une célérité.')}</>,
      tache: { type: 'qcm', q: 'Que mesure directement le capteur ?', options: ['la durée entre l’émission de la salve et sa réception', 'la distance de l’obstacle', 'la célérité des ultrasons'], bonne: 0,
        expl: 'Le capteur ne mesure qu’une durée : le retard Δt de l’écho. La distance s’en déduit par un calcul, avec une célérité supposée connue.' } },
    { id: 'trajet', titre: 'Un aller et un retour', focus: ['scene'],
      texte: <>L’obstacle est à <em>d</em> = 1,20{NB}m du capteur.{cap1('exploiter la relation entre durée de propagation, distance et célérité.')}</>,
      tache: { type: 'qcm', q: 'Quelle distance la salve parcourt-elle entre l’émission et la réception ?', options: ['2 d', 'd', 'd / 2'], bonne: 0,
        expl: 'La salve va jusqu’à l’obstacle (d) puis revient (d) : le trajet total est 2d, donc Δt = 2d / v.' } },
    { id: 'oscillo', titre: 'Lire le retard', focus: ['scene', 'reglages'],
      texte: <>L’oscillogramme montre la salve émise à <em>t</em> = 0 et l’écho reçu plus tard. Placez le <strong>repère 1</strong> (orange) au début de la salve émise et le <strong>repère 2</strong> (bleu) au début de l’écho. On peut cliquer sur l’écran ou utiliser les curseurs.</>,
      tache: { type: 'action', ok: pointeCap, label: 'Placer pour moi (réglage de départ)', faire: () => { baseCap(); setRc({ r1: 0, r2: teBase }); }, consigne: 'Repère 1 sur l’émission, repère 2 sur l’écho' } },
    { id: 'lecture', titre: 'Le retard Δt', focus: ['mesures'],
      texte: <>Lisez dans « Mesures » la durée entre vos deux repères : c’est le retard <strong>Δt</strong> de l’écho.</>,
      tache: { type: 'num', q: 'Retard Δt', unite: 'ms', vrai: dtMes, tol: 0.02, affiche: v => nbf(v, 1), cs: 2, bloque: pointeCap ? null : 'Placez d’abord les repères (étape précédente).',
        calcul: () => [`Repère 1 : ${nbf(rc.r1, 2)} ms ; repère 2 : ${nbf(rc.r2, 2)} ms.`, `Δt = ${nbf(rc.r2, 2)} − ${nbf(rc.r1, 2)} = ${nbf(dtMes, 2)} ms.`], expl: `Δt ≈ ${nbf(dtMes, 1)} ms.` } },
    { id: 'celerite', titre: 'Déduire la célérité', focus: ['mesures'],
      texte: <>Votre mesure : Δt = <strong>{nbf(dtMes, 2)}{NB}ms</strong>. On a mesuré au mètre ruban <em>d</em> = 1,200{NB}m. Avec Δt = 2<em>d</em> / <em>v</em>, calculez la célérité <em>v</em> des ultrasons dans l’air de la salle. C’est un <strong>étalonnage</strong>.{cap1('concevoir et mettre en œuvre un protocole pour mesurer un retard et une célérité.')}</>,
      tache: { type: 'num', q: 'Célérité v', unite: 'm/s', vrai: 2.4 / (dtMes * 1e-3), tol: 0.02, affiche: v => nbf(v, 0), cs: 3, bloque: pointeCap ? null : 'Placez d’abord les repères.',
        calcul: () => ['Hypothèse : célérité uniforme sur tout le trajet (air à température uniforme).', `Unités SI : Δt = ${nbf(dtMes, 2)} ms = ${nbf(dtMes * 1e-3, 5)} s ; d = 1,200 m.`, `v = 2d / Δt = 2 × 1,200 / ${nbf(dtMes * 1e-3, 5)} = ${nbf(2.4 / (dtMes * 1e-3), 0)} m/s.`],
        pieges: [[1.2 / (dtMes * 1e-3), 'Vous avez utilisé d au lieu de 2d : la salve fait un aller-retour.'], [2.4 / dtMes, 'Convertissez Δt en secondes avant de diviser.']],
        expl: 'v ≈ 343 m/s : valeur du modèle de l’air à 20 °C (343,0 m/s). La mesure donne la célérité sans connaître la température.' } },
    { id: 'temperature', titre: 'Et s’il fait plus froid ?', focus: ['reglages', 'scene'],
      texte: <>Le modèle du <strong>gaz parfait</strong> fournit la relation (admise ici) <em>v</em> = √(<em>γ</em>·<em>R</em>·<em>T</em> / <em>M</em>), avec <em>R</em> = 8,314{NB}J·mol⁻¹·K⁻¹, <em>T</em> en kelvin, <em>γ</em> = 1,40 et <em>M</em> = 29{NB}g/mol pour l’air. Abaissez la température à <strong>0 °C</strong> (l’obstacle reste à 1,20{NB}m).{cap1('étudier l’influence d’un paramètre sur la vitesse de propagation des ondes acoustiques.')}</>,
      tache: { type: 'action', ok: scene === 'capteur' && cap.T === 0 && cap.d === 1.2 && cap.gaz === 'air', label: 'Régler 0 °C', faire: () => { setScene('capteur'); setCap({ d: 1.2, T: 0, gaz: 'air', tb: 20 }); }, consigne: 'Température réglée à 0 °C' } },
    { id: 'influence', titre: 'Le retard a changé', focus: ['scene'],
      texte: <>Observez l’écho : il est arrivé à un autre instant que pour 20 °C.</>,
      tache: { type: 'qcm', q: 'À 0 °C, par rapport à 20 °C, le retard de l’écho est…', options: ['plus grand', 'plus petit', 'le même'], bonne: 0,
        expl: 'Quand la température baisse, la célérité diminue (v varie comme √T). Le trajet 2d est le même, donc le retard Δt = 2d / v augmente : environ 7,25 ms au lieu de 7,00 ms.' } },
    { id: 'formule', titre: 'Calculer v à 0 °C', focus: ['mesures'],
      texte: <>Calculez la célérité des ultrasons dans l’air à 0 °C avec la relation <em>v</em> = √(<em>γ</em>·<em>R</em>·<em>T</em> / <em>M</em>), où <em>R</em> = 8,314{NB}J·mol⁻¹·K⁻¹, <em>γ</em> = 1,40 et <em>M</em> = 29{NB}g/mol.</>,
      tache: { type: 'num', q: 'Célérité v à 0 °C', unite: 'm/s', vrai: M.celeriteGaz(0), tol: 0.005, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['Hypothèses : air = gaz parfait ; γ et M constants ; T en kelvin.', 'T = 0 + 273,15 = 273,15 K ; M = 0,029 kg/mol (unités SI).', `v = √(1,40 × 8,314 × 273,15 / 0,029) = √(${nbf(1.4 * 8.314 * 273.15 / 0.029, 0)}) = ${nbf(M.celeriteGaz(0), 1)} m/s.`],
        pieges: [[Math.sqrt(1.4 * 8.314 * 273.15 / 29), 'M doit être en kg/mol (0,029) et non en g/mol.'], [1.4 * 8.314 * 273.15 / 0.029, 'Il manque la racine carrée : v = √(γRT / M).']],
        expl: `v = ${nbf(M.celeriteGaz(0), 1)} m/s à 0 °C, contre ${nbf(M.celeriteGaz(20), 1)} m/s à 20 °C.` } },
    { id: 'erreur', titre: 'Un capteur réglé sur 340 m/s', focus: ['mesures'],
      texte: <>Beaucoup de capteurs calculent <em>d</em> = <em>v</em><sub>0</sub>·Δt / 2 avec une célérité fixe <em>v</em><sub>0</sub> = 340{NB}m/s, valable vers 20 °C. Vous avez calculé à l’étape précédente <em>v</em> = {nbf(M.celeriteGaz(0), 1)}{NB}m/s à 0 °C, donc un retard réel de {nbf(2.4 / M.celeriteGaz(0) * 1e3, 2)}{NB}ms. L’obstacle est réellement à 1,200{NB}m. Quelle distance le capteur affiche-t-il ?{cap1('exploiter la relation entre durée de propagation, distance et célérité.')}</>,
      tache: { type: 'num', q: 'Distance affichée', unite: 'm', vrai: v340, tol: 0.002, affiche: v => nbf(v, 3), cs: 4,
        calcul: () => [`Retard réel à 0 °C : Δt = 2 × 1,200 / ${nbf(M.celeriteGaz(0), 1)} = ${nbf(2.4 / M.celeriteGaz(0) * 1e3, 3)} ms.`, `Distance affichée : d = 340 × ${nbf(2.4 / M.celeriteGaz(0), 6)} / 2 = ${nbf(v340, 3)} m.`],
        pieges: [[1.2, 'Le capteur n’affiche pas la vraie distance : il utilise une célérité fausse à 0 °C.']],
        expl: `Le capteur affiche ${nbf(v340, 3)} m au lieu de 1,200 m, soit une erreur de ${nbf((v340 - 1.2) * 100, 1)} cm (${nbf((v340 / 1.2 - 1) * 100, 1)} %) : il surestime parce que la célérité réelle est plus faible que 340 m/s.` } },
    { id: 'gaz', titre: 'Changer de gaz', focus: ['reglages', 'scene'],
      texte: <>Remplissez maintenant l’espace d’<strong>hélium</strong> (<em>M</em> = 4,0{NB}g/mol, <em>γ</em> = 1,67), à 20 °C, obstacle à 1,20{NB}m.{cap1('comparer la célérité du son dans différents milieux.')}</>,
      tache: { type: 'action', ok: scene === 'capteur' && cap.gaz === 'he' && cap.T === 20 && cap.d === 1.2, label: 'Passer à l’hélium', faire: () => { setScene('capteur'); setCap({ d: 1.2, T: 20, gaz: 'he', tb: 20 }); }, consigne: 'Gaz : hélium' } },
    { id: 'gazqcm', titre: 'Dans l’hélium', focus: ['scene'],
      texte: <>Comparez la position de l’écho avec celle obtenue dans l’air.</>,
      tache: { type: 'qcm', q: 'Dans l’hélium, le retard de l’écho est…', options: ['plus petit : les ultrasons y vont plus vite', 'plus grand : l’hélium est plus léger', 'identique : seule la température compte'], bonne: 0,
        expl: 'La célérité dépend de la nature du gaz. L’hélium a une masse molaire très faible (4 g/mol contre 29 g/mol), donc v est bien plus grande : environ 1 010 m/s, le retard est trois fois plus petit.' } },
    { id: 'milieux', titre: 'Gaz, liquides, solides', focus: ['scene'],
      texte: <>Ordres de grandeur à 20 °C : <strong>gaz</strong> (air) 343{NB}m/s ; <strong>liquides</strong> (eau, huile) environ 1{NB}400 à 1{NB}500{NB}m/s ; <strong>solides</strong> (acier, verre) environ 5{NB}000 à 6{NB}000{NB}m/s. Le son se propage en général plus vite dans un solide que dans un liquide, et plus vite dans un liquide que dans un gaz.</>,
      tache: { type: 'qcm', q: 'Quel est l’ordre de grandeur de la célérité du son dans l’eau ?', options: ['environ 1 500 m/s', 'environ 340 m/s', 'environ 6 000 m/s'], bonne: 0,
        expl: 'Dans l’eau, le son va environ quatre fois plus vite que dans l’air : de l’ordre de 1 500 m/s. C’est aussi l’ordre de grandeur de la célérité dans les tissus mous du corps humain, qui sont majoritairement constitués d’eau (le muscle en contient environ 75 %).' } },
    { id: 'sonde', titre: 'L’échographe : le même principe', focus: ['scene', 'reglages'],
      texte: <>Un échographe applique le même principe pour voir à l’intérieur du corps : la sonde émet une impulsion d’ultrasons (de 1 à 15{NB}MHz), qui traverse des tissus et revient partiellement à chaque changement de milieu. Commençons par poser la sonde <strong>directement sur la peau</strong>, sans gel, à 4{NB}MHz.{cap1('illustrer le principe d’un échographe unidimensionnel.')}</>,
      tache: { type: 'action', ok: scene === 'echo' && !eco.gel, label: 'Passer à l’échographe (sans gel)', faire: () => { setScene('echo'); setEco(e => ({ ...e, f: 4, gel: false })); }, consigne: 'Échographe, sonde sans gel' } },
    { id: 'interface', titre: 'Où se forme un écho ?', focus: ['scene'],
      texte: <>Le <strong>balayage A</strong> montre le niveau de chaque écho (en dB, 0{NB}dB étant l’onde émise) en fonction du retard. Chaque pic est repéré par une lettre. Les pics en pointillés sont sous le seuil de détection du récepteur.{cap1('expliquer les principes physiques de l’échographie.')}</>,
      tache: { type: 'qcm', q: 'Où se forme un écho ?', options: ['à l’interface entre deux milieux différents', 'partout dans le tissu, uniformément', 'uniquement à la surface de la peau'], bonne: 0,
        expl: 'À chaque interface entre deux milieux, une partie de l’énergie est réfléchie (écho) et le reste est transmis. Les pics du balayage correspondent aux interfaces : peau, graisse, muscle, organe…' } },
    { id: 'sansgel', titre: 'Sans gel', focus: ['tableau', 'scene'],
      texte: <>Sans gel, l’interface air/peau a un coefficient énergétique de réflexion <em>R</em> = 0,99 (tableau « Interfaces »). Presque toute l’énergie est renvoyée à la surface. Observez le balayage : les échos plus profonds sont affaiblis, et certains passent sous le seuil de détection.{cap1('exploiter les coefficients énergétiques de réflexion et de transmission en incidence normale.')}</>,
      tache: { type: 'num', q: 'Quel pourcentage de l’énergie pénètre dans la peau ?', unite: '%', vrai: 1, tol: 0.05, affiche: v => nbf(v, 0),
        calcul: () => ['À une interface, R + T = 1.', 'T = 1 − R = 1 − 0,99 = 0,01 soit 1 %.'], pieges: [[99, 'Ces 99 % sont l’énergie réfléchie (R). L’énergie transmise est T = 1 − R.']],
        expl: 'T = 1 − R = 0,01 : seulement 1 % de l’énergie entre dans le corps.' } },
    { id: 'perte', titre: 'Aller et retour', focus: ['tableau', 'scene'],
      texte: <>L’énergie qui doit entrer dans la peau puis en ressortir traverse l’interface air/peau <strong>deux fois</strong> : à l’aller et au retour, avec <em>T</em> = 0,01 à chaque traversée. Le niveau de l’écho s’exprime en décibels : <em>L</em> = 10·log(énergie reçue / énergie émise).</>,
      tache: { type: 'num', q: 'De combien de décibels tous les échos situés sous la peau sont-ils affaiblis par la traversée aller-retour de l’interface air/peau ?', unite: 'dB', vrai: 40, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Fraction de l’énergie conservée à l’aller puis au retour : T² = 0,01² = 10⁻⁴.', 'L = 10 × log(10⁻⁴) = −40 dB : l’affaiblissement est de 40 dB.'],
        pieges: [[20, 'Vous n’avez compté qu’une traversée (10 log 0,01 = −20 dB) : il y en a deux, à l’aller et au retour.'], [4, 'Le niveau s’exprime avec 10 log (énergie), et il y a deux traversées : 10 × log(10⁻⁴).']],
        expl: 'Tous les échos situés sous la peau sont 40 dB plus faibles qu’avec du gel (en comparant les niveaux dans le tableau, à 4 MHz). L’écho de l’interface muscle/organe, celui des détails et celui du fond passent alors sous le seuil de −80 dB : sans gel, on ne voit pas l’organe.' } },
    { id: 'gel', titre: 'Avec du gel', focus: ['reglages', 'scene'],
      texte: <>Le gel remplace l’air entre la sonde et la peau. Pour l’interface gel/peau, <em>R</em> = 0,02 donc <em>T</em> = 0,98 : presque tout entre dans la peau. Activez le gel.</>,
      tache: { type: 'action', ok: scene === 'echo' && eco.gel, label: 'Mettre du gel', faire: () => { setScene('echo'); setEco(e => ({ ...e, gel: true })); }, consigne: 'Gel activé' } },
    { id: 'hauteur', titre: 'Lire un pic', focus: ['scene', 'tableau'],
      texte: <>Les échos sont maintenant tous détectés (à 4{NB}MHz). Comparez leurs niveaux dans le balayage et dans le tableau des échos.</>,
      tache: { type: 'qcm', q: 'De quoi dépend le niveau d’un écho ?', options: ['du coefficient R de l’interface et de l’absorption subie sur le trajet aller-retour', 'uniquement de la profondeur de l’interface', 'de la célérité dans le milieu'], bonne: 0,
        expl: 'Un écho est d’autant plus fort que R est grand, et d’autant plus faible que l’onde a été absorbée en chemin. C’est pourquoi les échos profonds sont plus faibles que les échos superficiels.' } },
    { id: 'pointer', titre: 'Pointer l’entrée de l’organe', focus: ['scene', 'tableau'],
      texte: <>Réglez 5{NB}MHz. Le tableau des échos donne l’interface de chaque lettre. Placez le repère 1 sur l’émission (0{NB}µs) et le repère 2 sur l’écho de l’interface <strong>muscle / organe</strong>.</>,
      tache: { type: 'action', ok: pointeEcho, label: 'Placer pour moi (5 MHz, avec gel)', faire: () => { baseEcho(); setRa({ r1: 0, r2: tOrgBase }); }, consigne: 'Repère 1 sur 0 µs, repère 2 sur l’écho muscle / organe' } },
    { id: 'profondeur', titre: 'La profondeur de l’organe', focus: ['mesures'],
      texte: <>Un échographe ne connaît pas la célérité de chaque tissu : il utilise une valeur moyenne <em>v</em> = 1{NB}540{NB}m/s pour toutes les profondeurs. Votre mesure : Δt = <strong>{nbf(dtMesUs, 1)}{NB}µs</strong>. Calculez la profondeur de l’interface muscle/organe avec <em>d</em> = <em>v</em>·Δt / 2.{cap1('exploiter la relation entre durée de propagation, distance et célérité pour décrire le principe de l’échographie.')}</>,
      tache: { type: 'num', q: 'Profondeur calculée', unite: 'cm', vrai: M.V_APPAREIL * dtMesUs * 1e-6 / 2 * 100, tol: 0.02, affiche: v => nbf(v, 2), cs: 3, bloque: pointeEcho ? null : 'Placez d’abord les repères (étape précédente).',
        calcul: () => ['Hypothèse : célérité moyenne 1 540 m/s partout (valeur de l’appareil).', `Δt = ${nbf(dtMesUs, 1)} µs = ${nbf(dtMesUs * 1e-6, 7)} s.`, `d = 1 540 × ${nbf(dtMesUs * 1e-6, 7)} / 2 = ${nbf(M.V_APPAREIL * dtMesUs * 1e-6 / 2, 4)} m = ${nbf(M.V_APPAREIL * dtMesUs * 1e-6 / 2 * 100, 2)} cm.`],
        pieges: [[M.V_APPAREIL * dtMesUs * 1e-6 * 100, 'Vous avez oublié de diviser par 2 : l’onde fait un aller-retour.'], [M.V_APPAREIL * dtMesUs * 1e-6 / 2, 'Le résultat est demandé en centimètres.']],
        expl: `d ≈ ${nbf(M.V_APPAREIL * dtMesUs * 1e-6 / 2 * 100, 2)} cm. L’organe est en réalité à 3,50 cm : l’écart vient de ce que la célérité varie un peu d’un tissu à l’autre.` } },
    { id: 'absorption', titre: 'L’absorption', focus: ['tableau'],
      texte: <>Même sans interface, tout milieu <strong>absorbe</strong> l’onde, d’autant plus que la fréquence est élevée. Le coefficient d’absorption du muscle est 1,1{NB}dB·cm⁻¹ par MHz, soit <strong>5,5{NB}dB·cm⁻¹ à 5{NB}MHz</strong>. L’atténuation en dB est proportionnelle à la distance parcourue, aller et retour compris.{cap1('exploiter le coefficient d’absorption d’une onde acoustique dans un milieu.')}</>,
      tache: { type: 'num', q: 'Atténuation due à une couche de muscle de 2,0 cm, aller-retour compris', unite: 'dB', vrai: 22, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Hypothèse : coefficient constant dans la couche, l’onde la traverse deux fois (aller et retour).', 'Distance parcourue : 2 × 2,0 = 4,0 cm.', 'Atténuation : 5,5 dB/cm × 4,0 cm = 22 dB.'],
        pieges: [[11, 'Vous n’avez compté que l’aller : l’onde traverse la couche deux fois.'], [5.5 * 2.0 * 2 / 2 * 0.5, 'Multipliez le coefficient en dB/cm par la distance totale parcourue.']],
        expl: '22 dB d’atténuation : l’énergie qui revient n’est plus que 0,6 % de celle qui était entrée dans le muscle (22 dB = 10^−2,2).' } },
    { id: 'hautefreq', titre: 'Monter en fréquence', focus: ['reglages', 'scene'],
      texte: <>Réglez maintenant la fréquence à <strong>10{NB}MHz</strong>. Observez les échos profonds.</>,
      tache: { type: 'action', ok: scene === 'echo' && eco.gel && eco.f >= 10, label: 'Régler 10 MHz', faire: () => { setScene('echo'); setEco(e => ({ ...e, f: 10, gel: true })); }, consigne: 'Fréquence : 10 MHz' } },
    { id: 'pourquoi', titre: 'Des échos qui disparaissent', focus: ['scene'],
      texte: <>À 10{NB}MHz, les échos de l’organe et du fond ont disparu.</>,
      tache: { type: 'qcm', q: 'Pourquoi ?', options: ['l’absorption augmente avec la fréquence : ces échos passent sous le seuil de détection', 'les ultrasons ne sont plus réfléchis à haute fréquence', 'la célérité a diminué'], bonne: 0,
        expl: 'Le coefficient d’absorption croît avec la fréquence. À 10 MHz, l’atténuation aller-retour jusqu’à l’organe dépasse ce que le récepteur peut détecter : la pénétration est limitée.' } },
    { id: 'lambda', titre: 'La longueur d’onde', focus: ['mesures'],
      texte: <>La plus petite structure qu’on peut distinguer est de l’ordre de la longueur d’onde <em>λ</em> = <em>v</em> / <em>f</em> dans le milieu : c’est la <strong>résolution</strong>. Dans l’organe, <em>v</em> = 1{NB}590{NB}m/s. Calculez <em>λ</em> à 5{NB}MHz.{cap1('associer la résolution de l’image à la longueur d’onde dans le milieu.')}</>,
      tache: { type: 'num', q: 'Longueur d’onde λ à 5 MHz', unite: 'mm', vrai: M.longueurOnde(ORG, 5), tol: 0.02, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['Unités SI : f = 5 MHz = 5 × 10⁶ Hz ; v = 1 590 m/s.', `λ = v / f = 1 590 / 5 × 10⁶ = ${nbf(M.longueurOnde(ORG, 5) * 1e-3, 7)} m = ${nbf(M.longueurOnde(ORG, 5), 3)} mm.`],
        pieges: [[M.longueurOnde(ORG, 5) * 1e-3, 'Le résultat est demandé en millimètres.'], [1590 / 5, 'Convertissez 5 MHz en hertz (5 × 10⁶ Hz).']],
        expl: 'λ ≈ 0,32 mm : on ne peut guère distinguer des détails plus petits que cette taille.' } },
    { id: 'detailsbas', titre: 'Deux petits détails', focus: ['scene', 'reglages', 'zoom'],
      texte: <>Deux petits détails (calcifications) se trouvent dans l’organe, séparés de <em>s</em> = 0,8{NB}mm. Le zoom les montre. Réglez la fréquence à <strong>1{NB}MHz</strong>.</>,
      tache: { type: 'action', ok: scene === 'echo' && eco.gel && eco.f === 1 && eco.s === 0.8, label: 'Régler 1 MHz', faire: () => { setScene('echo'); setEco({ f: 1, gel: true, s: 0.8 }); }, consigne: 'Fréquence : 1 MHz, s = 0,8 mm' } },
    { id: 'separation', titre: 'Un seul pic', focus: ['zoom'],
      texte: <>À 1{NB}MHz, la longueur d’onde dans l’organe est 1,59{NB}mm. Sur le zoom, les deux échos se recouvrent.</>,
      tache: { type: 'qcm', q: 'Pourquoi voit-on un seul pic ?', options: ['l’écart s (0,8 mm) est inférieur à la longueur d’onde (1,59 mm) : les échos se recouvrent', 'les détails sont trop absorbés', 'le fond de l’organe masque les détails'], bonne: 0,
        expl: 'Dans cette simulation, deux détails sont séparés si leur écart s est au moins égal à λ. Ici s < λ : les deux échos ne se distinguent pas.' } },
    { id: 'fmin', titre: 'Séparer les détails', focus: ['mesures'],
      texte: <>Quelle est la fréquence minimale pour que les deux détails (<em>s</em> = 0,8{NB}mm, dans l’organe où <em>v</em> = 1{NB}590{NB}m/s) soient séparés ? On écrit la condition <em>λ</em> ≤ <em>s</em>. Vérifiez ensuite avec le curseur de fréquence.</>,
      tache: { type: 'num', q: 'Fréquence minimale', unite: 'MHz', vrai: M.frequenceMin(0.8, ORG), tol: 0.02, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Condition : λ = v / f ≤ s donc f ≥ v / s.', 'Unités SI : s = 0,8 mm = 0,8 × 10⁻³ m.', `f = 1 590 / 0,8 × 10⁻³ = ${nbf(M.frequenceMin(0.8, ORG) * 1e6, 0)} Hz = ${nbf(M.frequenceMin(0.8, ORG), 2)} MHz.`],
        pieges: [[M.frequenceMin(0.8, ORG) * 1e6, 'Le résultat est demandé en mégahertz (1 MHz = 10⁶ Hz).']],
        expl: 'f ≥ 2,0 MHz environ. Autour de 2 MHz, les deux pics commencent à se séparer sur le zoom ; au-dessus, le creux entre eux se creuse.' } },
    { id: 'compromis', titre: 'Un compromis', focus: ['reglages'],
      texte: <>On veut voir l’organe et son fond (à 7{NB}cm de profondeur) avec une résolution d’environ 0,5{NB}mm. Une résolution de 0,5{NB}mm demande <em>f</em> ≥ 3,2{NB}MHz. Mais l’écho du fond n’est plus détecté au-delà d’environ 5,6{NB}MHz (testez-le avec le curseur).{cap1('associer la résolution de l’image à la longueur d’onde dans le milieu ; exploiter le coefficient d’absorption.')}</>,
      tache: { type: 'qcm', q: 'Quelle fréquence choisir ?', options: ['entre 3,2 et 5,6 MHz : λ assez petite et écho du fond encore détecté', '15 MHz : c’est la longueur d’onde la plus petite', '1 MHz : c’est la fréquence la moins absorbée'], bonne: 0,
        expl: 'Augmenter la fréquence améliore la résolution (λ plus petite) mais diminue la pénétration (absorption plus forte). On choisit un compromis selon la profondeur de l’organe : fréquence plus élevée pour les organes superficiels, plus basse pour les organes profonds.' } },
    { id: 'fin', titre: 'Ce que vous savez faire', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>le capteur mesure un <strong>retard</strong> : Δt = 2d / v ; la distance se déduit d’une célérité supposée connue</li>
        <li>dans un gaz parfait, v = √(γRT / M) : elle augmente avec la température et diminue avec la masse molaire</li>
        <li>ordres de grandeur : gaz ≈ 340 m/s, liquides ≈ 1 500 m/s, solides ≈ 5 000 à 6 000 m/s</li>
        <li>à une interface, R + T = 1 ; un écho naît à chaque changement de milieu ; le gel supprime l’interface air/peau</li>
        <li>l’absorption atténue l’onde (en dB, proportionnellement à la distance et, ici, à la fréquence)</li>
        <li>résolution ≈ λ = v / f : fréquence élevée = meilleure résolution mais moindre pénétration</li></ul>,
      texte: <>Vous savez mesurer un retard, en déduire une distance ou une célérité, et expliquer le principe d’un échographe, ses limites et le choix de la fréquence. Explorez librement, puis essayez les défis.</>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const apres = id => !enGuide || etape > IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const rendreBase = () => {
    if (['oscillo', 'lecture', 'celerite'].includes(idE)) { baseCap(); setRc({ r1: 0, r2: teBase }); }
    if (['pointer', 'profondeur'].includes(idE)) { baseEcho(); setRa({ r1: 0, r2: tOrgBase }); }
  };
  const aRetablir = enGuide && (['oscillo', 'lecture', 'celerite'].includes(idE) ? !(idE === 'oscillo' ? capBase : pointeCap) : ['pointer', 'profondeur'].includes(idE) ? !(idE === 'pointer' ? echoBase : pointeEcho) : false);

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(type) {
    const base = { type, reps: {}, verifie: false };
    if (type === 'distance') setDefi({ ...base, T: Math.round(alea(-10, 35, 1)), d: arr(alea(0.6, 2.8, 0.01), 2) });
    else if (type === 'celerite') { const g = tire(['air', 'air', 'co2', 'he']); setDefi({ ...base, gaz: g, T: g === 'air' ? Math.round(alea(-5, 30, 1)) : 20, dref: arr(alea(0.8, 2.4, 0.01), 2) }); }
    else if (type === 'profondeur') setDefi({ ...base, graisse: arr(alea(0.8, 2.0, 0.1), 1), muscle: arr(alea(1.2, 3.0, 0.1), 1) });
    else setDefi({ ...base, s: arr(alea(0.4, 1.0, 0.05), 2) });
    setCap(c => ({ ...c, tb: 20 })); setRc({ r1: 2, r2: 12 }); setRa({ r1: 8, r2: 30 });
    if (type === 'frequence') setEco(e => ({ ...e, f: 5 }));
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') { baseCap(); setRc({ r1: 2, r2: 12 }); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const relLecture = (0.01 * C.tb * Math.SQRT2 / Math.sqrt(3)) / Math.max(dtMes, 1e-6);       // u(Δt)/Δt : pointé ± 1 % de la base de temps, loi rectangulaire, deux pointés indépendants
  const verite = !defi ? NaN : defi.type === 'distance' ? defi.d : defi.type === 'celerite' ? M.celeriteGaz(defi.T, M.GAZ[defi.gaz])
    : defi.type === 'profondeur' ? M.profondeurApparente(M.echos({ ep: { ...M.EP_DEFAUT, graisse: defi.graisse, muscle: defi.muscle }, fMHz: 5 }).find(e => e.id === 'muscle/organe').t) : M.frequenceMin(defi.s, ORG);
  const tolDefi = !defi ? 0 : defi.type === 'profondeur' ? 0.04 : defi.type === 'frequence' ? 0.06 : Math.min(0.1, Math.max(0.04, 2 * relLecture));
  const verifier = () => {
    const x = lireNombre(defi.reps.a), imprecis = ['distance', 'celerite'].includes(defi.type) && relLecture > 0.08;
    const ok = !imprecis && isFinite(x) && proche(x, verite, tolDefi);
    setDefi(d => ({ ...d, verifie: true, ok, imprecis }));
    ({ distance: nDis, celerite: nCel, profondeur: nPro, frequence: nFre })[defi.type](ok);
  };
  const champReponse = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.a ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('ec-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, a: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const TITRES = { distance: ['Distance d’un obstacle', 'Défi : à quelle distance se trouve l’obstacle ?', 'm', 'Distance d'], celerite: ['Célérité du son', 'Défi : quelle est la célérité du son dans ce gaz ?', 'm/s', 'Célérité v'],
    profondeur: ['Profondeur d’un organe', 'Défi : à quelle profondeur se trouve l’entrée de l’organe ?', 'cm', 'Profondeur'], frequence: ['Fréquence minimale', 'Défi : quelle fréquence minimale sépare les deux détails ?', 'MHz', 'Fréquence minimale'] };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l[0]}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{TITRES[defi.type][1]}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'distance' && <>Un capteur à ultrasons (40 kHz) vise un obstacle dont on ignore la distance. L’air est à <strong>{defi.T}{NB}°C</strong>. Mesurez le retard Δt de l’écho (choisissez une base de temps adaptée), calculez la célérité avec le modèle du gaz parfait (γ = 1,40 ; M = 29 g/mol), puis la distance. <span style={{ color: '#475569' }}>Capacité : exploiter la relation entre durée, distance et célérité ; étudier l’influence de la température.</span></>}
        {defi.type === 'celerite' && <>Le capteur est placé à <strong>{nbf(defi.dref, 2)}{NB}m</strong> d’un obstacle, dans un récipient rempli d’un gaz inconnu (air, dioxyde de carbone ou hélium, à une température inconnue). Mesurez le retard et déduisez la célérité du son. <span style={{ color: '#475569' }}>Capacité : concevoir et mettre en œuvre un protocole pour mesurer un retard et une célérité.</span></>}
        {defi.type === 'profondeur' && <>Un patient a une couche de graisse et une couche de muscle d’épaisseurs inconnues sous la peau. Avec le gel et une fréquence de votre choix, repérez l’écho de l’interface <strong>muscle / organe</strong> et calculez sa profondeur avec la célérité moyenne de l’appareil (1{NB}540{NB}m/s), telle que l’affiche l’échographe (tolérance ± 4 %). <span style={{ color: '#475569' }}>Capacité : exploiter la relation entre durée, distance et célérité pour décrire le principe de l’échographie.</span></>}
        {defi.type === 'frequence' && <>Deux détails sont séparés d’une distance inconnue dans l’organe (célérité 1{NB}590{NB}m/s). Trouvez la <strong>fréquence minimale</strong> qui permet de les distinguer sur le zoom, en vérifiant que l’écho du fond de l’organe reste détecté. Vous pouvez mesurer l’écart des pics sur le zoom, ou chercher la fréquence au curseur. <span style={{ color: '#475569' }}>Capacité : associer la résolution de l’image à la longueur d’onde dans le milieu.</span></>}
      </div>
      {champReponse(TITRES[defi.type][2], TITRES[defi.type][3])}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ec-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.imprecis ? '✗ Votre lecture du retard est trop imprécise (plus de 8 % d’incertitude de pointé) : choisissez une base de temps plus courte pour que l’écho occupe l’écran, puis recommencez.'
          : defi.ok ? `✓ Correct. Valeur de la simulation : ${defi.type === 'distance' ? nbf(defi.d, 2) + ' m. Un capteur réglé sur 340 m/s aurait affiché ' + nbf(M.distanceAffichee(M.retardAllerRetour(defi.d, M.celeriteGaz(defi.T))), 2) + ' m.'
            : defi.type === 'celerite' ? nbf(verite, 0) + ' m/s (' + M.GAZ[defi.gaz].nom + (defi.gaz === 'air' ? ' à ' + defi.T + ' °C' : '') + ').'
              : defi.type === 'profondeur' ? nbf(verite, 2) + ' cm (profondeur calculée avec 1 540 m/s). La profondeur réelle est ' + nbf(0.3 + defi.graisse + defi.muscle, 2) + ' cm : l’écart vient des célérités propres à chaque tissu.'
                : nbf(verite, 2) + ' MHz (s = ' + nbf(defi.s, 2) + ' mm, donc λ = s). L’écho du fond reste détecté jusqu’à ' + nbf(M.fMaxFond(), 1) + ' MHz.'}`
            : (defi.type === 'distance' ? '✗ Vérifiez : v = √(γRT/M) avec T en kelvin et M en kg/mol, Δt lu entre le début de l’émission et le début de l’écho, puis d = vΔt / 2 (aller-retour), en mètres.'
              : defi.type === 'celerite' ? '✗ Vérifiez : v = 2d / Δt, avec Δt en secondes et d la distance donnée (le trajet total est 2d).'
                : defi.type === 'profondeur' ? '✗ Vérifiez : repère 1 sur l’émission (0 µs), repère 2 sur l’écho de l’interface muscle / organe (la quatrième lettre du balayage), puis d = 1 540 × Δt / 2, en centimètres.'
                  : '✗ Vérifiez : les détails sont séparés quand λ = v / f est inférieure ou égale à l’écart s. Cherchez la fréquence à laquelle le creux apparaît entre les deux pics, ou mesurez leur écart de temps Δt sur le zoom (s = vΔt / 2) puis f = v / s.')}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Gaz</strong> : gaz parfait, v = √(γRT / M) avec T en kelvin, γ et M constants. Air : γ = 1,40 et M = 29 g/mol (343 m/s à 20 °C) ; dioxyde de carbone : γ = 1,30 et M = 44 g/mol ; hélium : γ = 1,67 et M = 4,0 g/mol. L’humidité de l’air est négligée.</li>
      <li><strong>Capteur</strong> : onde plane, célérité uniforme sur le trajet, obstacle perpendiculaire au faisceau, échos ponctuels. <strong>Incertitudes</strong> (mêmes conventions que les autres simulations d’ondes) : chaque pointé est connu à ± 1 % de la base de temps (demi-largeur) ; loi rectangulaire, u = demi-étendue / √3 ; les deux pointés sont indépendants, donc u(Δt) = √2 × u(pointé). Dans le défi, la tolérance est le double de l’incertitude relative, entre 4 % et 10 %. L’amplitude de l’écho à l’oscilloscope est en unité arbitraire (elle décroît avec la distance, sans échelle). La salve de 40 kHz est dessinée très étirée ; l’animation du schéma est ralentie et ne respecte pas l’échelle des temps.</li>
      <li><strong>Tissus</strong> : couches planes parallèles en incidence normale ; célérités arrondies (gel 1 500, peau 1 540, graisse 1 450, muscle 1 580, organe 1 590 m/s) ; l’appareil suppose 1 540 m/s partout pour calculer les profondeurs.</li>
      <li><strong>Réflexion</strong> : les coefficients R des interfaces sont des <strong>données arrondies</strong> de la simulation, du bon ordre de grandeur (ils ne sont pas calculés) ; T = 1 − R. Un écho est la fraction R de l’énergie qui arrive à l’interface ; l’énergie transmise subit les pertes de chaque interface traversée, à l’aller et au retour.</li>
      <li><strong>Absorption</strong> : coefficient proportionnel à la fréquence (en dB·cm⁻¹ par MHz : peau 1,5 ; graisse 0,6 ; muscle 1,1 ; organe 0,7), atténuation comptée aller-retour. Le récepteur détecte un écho si son niveau, relatif à l’onde émise, est au moins de −80 dB. Les diffusions, la divergence du faisceau et la compensation de gain de l’appareil ne sont pas modélisées.</li>
      <li><strong>Résolution</strong> : dans cette simulation, chaque écho a une enveloppe gaussienne de durée σ = 1/f, soit une résolution <strong>axiale</strong> (en profondeur) d’environ λ/2 ; deux détails identiques, alignés dans l’axe du faisceau, sont séparés si leur écart s est au moins égal à la longueur d’onde (critère simplifié, qui dépend en réalité du nombre d’oscillations de l’impulsion). La résolution <strong>latérale</strong> (liée à la diffraction et à la largeur du faisceau) n’est pas modélisée.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['capteur', 'Capteur de distance à ultrasons'], ['echo', 'Échographe 1D']].map(([k, l]) => <button key={k} onClick={() => setScene(k)} aria-pressed={scene === k} style={stylePetitBouton(scene === k, '#0e7490')}>{l}</button>)}
      </div>}
      {aRetablir && <button onClick={rendreBase} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>Rétablir le réglage de l’étape</button>}
      {sceneEff === 'capteur' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Defile min={420}><Trajet d={C.d} anim={anim}/></Defile>
          <Defile><Oscillo tb={C.tb} te={teMs} amp={ampE} r1={rc.r1} r2={rc.r2} setR={setR}/></Defile>
          <div role="group" aria-label="Placer les repères" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px' }}>
            <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Placer les repères (curseurs, clic sur l’écran ou flèches du clavier)</div>
            {[[1, 'Repère 1 (orange)', rc.r1, '#b45309'], [2, 'Repère 2 (bleu)', rc.r2, '#0e7490']].map(([i, n, vv, c]) => <label key={i} style={{ display: 'block', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}><span style={{ fontWeight: 700, color: c }}>{n}</span> : {nbf(vv, 2)}{NB}ms
              <input type="range" aria-label={n} aria-valuetext={`${nbf(vv, 2)} millisecondes`} min={0} max={C.tb} step={C.tb / 400} value={vv} onChange={e => setR(i, parseFloat(e.target.value))} style={{ display: 'block', width: '100%', minHeight: 32, accentColor: c }}/></label>)}
          </div>
        </div>) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Defile><Echogramme lst={lst} f={E.f} r1={ra.r1} r2={ra.r2}/></Defile>
          <div role="group" aria-label="Placer les repères du balayage" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px' }}>
            <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Repères du balayage A (en µs)</div>
            {[[1, 'Repère 1 (orange)', ra.r1, '#ea580c'], [2, 'Repère 2 (bleu)', ra.r2, '#2563eb']].map(([i, n, vv, c]) => <label key={i} style={{ display: 'block', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}><span style={{ fontWeight: 700, color: c }}>{n}</span> : {nbf(vv, 1)}{NB}µs
              <input type="range" aria-label={n} aria-valuetext={`${nbf(vv, 1)} microsecondes`} min={0} max={EC.TMAX} step={0.1} value={vv} onChange={e => setRa(r => ({ ...r, [i === 1 ? 'r1' : 'r2']: parseFloat(e.target.value) }))} style={{ display: 'block', width: '100%', minHeight: 32, accentColor: c }}/></label>)}
          </div>
          <div style={cadre('zoom')}><Defile><Zoom lst={lst} f={E.f} u1={uz.u1} u2={uz.u2} sMasque={dd?.type === 'frequence'}/></Defile></div>
          <div role="group" aria-label="Mesurer l’écart entre les deux pics du zoom" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px' }}>
            <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Repères du zoom (fenêtre de 7 µs)</div>
            {[[1, 'Repère 1', uz.u1, '#ea580c'], [2, 'Repère 2', uz.u2, '#2563eb']].map(([i, n, vv, c]) => <label key={i} style={{ display: 'block', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}><span style={{ fontWeight: 700, color: c }}>{n}</span>
              <input type="range" aria-label={`${n} du zoom`} aria-valuetext={`${nbf(vv, 2)} microsecondes depuis le début de la fenêtre`} min={0} max={7} step={0.01} value={vv} onChange={e => setUz(u => ({ ...u, [i === 1 ? 'u1' : 'u2']: parseFloat(e.target.value) }))} style={{ display: 'block', width: '100%', minHeight: 32, accentColor: c }}/></label>)}
          </div>
        </div>)}
    </div>);

  const reglages = sceneEff === 'capteur' ? (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!dd && <>
        <Curseur nom="Distance d du capteur à l’obstacle" valeur={cap.d} onChange={v => setCap(c => ({ ...c, d: v }))} min={0.2} max={4} pas={0.05} unite="m" decimales={2} couleur="#475569"/>
        <Curseur nom="Température de l’air" valeur={cap.T} onChange={v => setCap(c => ({ ...c, T: v }))} min={-20} max={40} pas={1} unite="°C" decimales={0} couleur="#b45309"/>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Gaz</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{Object.entries(M.GAZ).map(([k, g]) => <button key={k} onClick={() => setCap(c => ({ ...c, gaz: k }))} aria-pressed={cap.gaz === k} style={stylePetitBouton(cap.gaz === k, '#0e7490')}>{g.nom}</button>)}</div>
      </>}
      {dd?.type === 'distance' && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8 }}>Air à <strong>{dd.T}{NB}°C</strong> ; distance inconnue.</div>}
      {dd?.type === 'celerite' && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8 }}>Distance capteur – obstacle : <strong>{nbf(dd.dref, 2)}{NB}m</strong> ; gaz et température inconnus.</div>}
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Base de temps (largeur de l’écran)</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{[5, 10, 20, 40].map(b => <button key={b} onClick={() => { setCap(c => ({ ...c, tb: b })); setRc(r => ({ r1: Math.min(r.r1, b), r2: Math.min(r.r2, b) })); }} aria-pressed={cap.tb === b} style={stylePetitBouton(cap.tb === b, '#475569')}>{b}{NB}ms</button>)}</div>
      <button onClick={() => setAnim(x => !x)} aria-pressed={!anim} style={stylePetitBouton(!anim, '#475569')}>Figer l’animation</button>
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!dd && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setEco(e => ({ ...e, gel: !e.gel }))} aria-pressed={eco.gel} style={stylePetitBouton(eco.gel, '#0e7490')}>{eco.gel ? 'Gel : oui' : 'Gel : non (sonde sur la peau)'}</button></div>}
      {dd && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8 }}>Gel appliqué. {dd.type === 'profondeur' ? 'Épaisseurs de graisse et de muscle inconnues.' : 'Écart entre les détails inconnu.'}</div>}
      <Curseur nom="Fréquence de la sonde" valeur={eco.f} onChange={v => setEco(e => ({ ...e, f: v }))} min={1} max={15} pas={dd?.type === 'frequence' ? 0.1 : 0.5} unite="MHz" decimales={1} couleur="#0e7490"/>
      {!dd && <Curseur nom="Écart s entre les deux détails" valeur={eco.s} onChange={v => setEco(e => ({ ...e, s: v }))} min={0.2} max={2} pas={0.1} unite="mm" decimales={1} couleur="#475569"/>}
    </div>
  );

  const mesures = sceneEff === 'capteur' ? (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Repère 1 (orange)" valeur={`${nbf(rc.r1, 2)}${NB}ms`} couleur="#b45309"/>
      <LigneMesure nom="Repère 2 (bleu)" valeur={`${nbf(rc.r2, 2)}${NB}ms`} couleur="#0e7490"/>
      <LigneMesure nom="Retard Δt entre les repères" valeur={`${nbf(dtMes, 2)}${NB}ms`}/>
      {!dd && apres('celerite') && <LigneMesure nom="v = 2d / Δt (d connue)" valeur={dtMes > 0 ? `${nbf(2 * C.d / (dtMes * 1e-3), 0)}${NB}m/s` : '–'} couleur="#15803d"/>}
      {!dd && !enGuide && <LigneMesure nom="v du modèle √(γRT/M)" valeur={`${nbf(vC, 1)}${NB}m/s`}/>}
      {!dd && !enGuide && <LigneMesure nom="Retard attendu 2d / v" valeur={`${nbf(teMs, 2)}${NB}ms`}/>}
      {!dd && !enGuide && <LigneMesure nom="Distance affichée avec 340 m/s" valeur={`${nbf(M.distanceAffichee(teMs * 1e-3), 3)}${NB}m`} couleur="#b45309"/>}
      {dd && <LigneMesure nom="u(Δt) / Δt (pointé)" valeur={`± ${nbf(relLecture * 100, 1)} %`}/>}
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('mesures'), ...cadre('tableau') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Échos du balayage</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Pic</th><th style={{ padding: '2px 4px' }}>Interface</th><th style={{ padding: '2px 4px' }}>Niveau</th>{!enGuide && !dd && <th style={{ padding: '2px 4px' }}>Retard</th>}</tr></thead>
          <tbody>{lst.map((e, i) => <tr key={e.id} style={{ borderTop: `1px dashed ${KIT.bord}`, color: e.detecte ? KIT.txt : '#94a3b8' }}>
            <td style={{ padding: '3px 4px', fontWeight: 700 }}>{LETTRES[i]}</td><td style={{ padding: '3px 4px' }}>{e.nom}</td>
            <td style={{ padding: '3px 4px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{nbf(e.niveau, 0)}{NB}dB{e.detecte ? '' : ' ✗'}</td>
            {!enGuide && !dd && <td style={{ padding: '3px 4px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{nbf(e.t * 1e6, 1)}{NB}µs</td>}</tr>)}</tbody>
        </table>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 6px' }}>✗ : écho sous le seuil de détection ({M.SEUIL_DB}{NB}dB).</div>
      <LigneMesure nom="Repère 1 (orange)" valeur={`${nbf(ra.r1, 1)}${NB}µs`} couleur="#ea580c"/>
      <LigneMesure nom="Repère 2 (bleu)" valeur={`${nbf(ra.r2, 1)}${NB}µs`} couleur="#2563eb"/>
      <LigneMesure nom="Retard Δt entre les repères" valeur={`${nbf(dtMesUs, 1)}${NB}µs`}/>
      {apres('profondeur') && <LigneMesure nom="d = 1540 × Δt / 2" valeur={`${nbf(M.V_APPAREIL * dtMesUs * 1e-6 / 2 * 100, 2)}${NB}cm`} couleur="#15803d"/>}
      <LigneMesure nom="Écart Δt des pics (zoom)" valeur={`${nbf(dzMes, 2)}${NB}µs`}/>
      {(!enGuide || apres('fmin')) && <LigneMesure nom="s = v Δt / 2 (v = 1590 m/s)" valeur={`${nbf(ORG * dzMes * 1e-6 / 2 * 1e3, 2)}${NB}mm`} couleur="#15803d"/>}
      {apres('lambda') && <LigneMesure nom="λ = v / f dans l’organe" valeur={`${nbf(lamOrg, 2)}${NB}mm`} couleur="#15803d"/>}
      {(!enGuide || apres('compromis')) && !dd && <LigneMesure nom="Fréquence maxi pour voir le fond" valeur={`${nbf(M.fMaxFond(EP, E.gel), 1)}${NB}MHz`}/>}
      {dd?.type === 'frequence' && <LigneMesure nom="Écho du fond" valeur={eFond?.detecte ? 'détecté' : 'non détecté'} couleur={eFond?.detecte ? '#15803d' : '#b91c1c'}/>}
    </div>
  );
  const tableau = sceneEff === 'echo' && (
    <div style={{ ...styleBoite, ...cadre('tableau') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Données des milieux</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Milieu</th><th style={{ padding: '2px 4px' }}>v (m/s)</th><th style={{ padding: '2px 4px' }}>α à 1 MHz</th><th style={{ padding: '2px 4px' }}>α à {nbf(E.f, 1)} MHz</th></tr></thead>
          <tbody>{Object.entries(M.MILIEUX).map(([k, m]) => <tr key={k} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px' }}>{m.nom}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{m.v}</td>
            <td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(m.alpha1, 1)}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(M.alpha(k, E.f), 1)}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '2px 0 6px' }}>α : coefficient d’absorption en dB·cm⁻¹ (à 1 MHz : dB·cm⁻¹·MHz⁻¹).</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '6px 0 2px' }}>Interfaces : coefficient de réflexion R</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Interface</th><th style={{ padding: '2px 4px' }}>R</th><th style={{ padding: '2px 4px' }}>T = 1 − R</th></tr></thead>
          <tbody>{Object.entries(M.R_INTERFACE).map(([k, R]) => <tr key={k} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px' }}>{k}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(R, 3)}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(1 - R, 3)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Capteur : faites varier la distance. Le retard est-il proportionnel à d ? Tracez Δt en fonction de d pour quelques valeurs.</li>
        <li>Capteur : à quelle température la distance affichée avec 340 m/s est-elle exacte ? Quelle erreur à −20 °C ?</li>
        <li>Capteur : comparez le retard dans l’air, le dioxyde de carbone et l’hélium. Quel gaz donne la célérité la plus grande ? Pourquoi (masse molaire) ?</li>
        <li>Échographe : retirez le gel. De combien de décibels l’écho du fond change-t-il ? Que vaut T à l’interface air/peau ?</li>
        <li>Échographe : à quelle fréquence l’écho du fond disparaît-il ? Et l’écho de l’entrée de l’organe ?</li>
        <li>Échographe : pour s = 0,5 mm puis s = 1,5 mm, cherchez la fréquence minimale qui sépare les deux détails. Vérifiez f = v / s.</li>
        <li>Échographe : vers quelle valeur de s la fréquence minimale dépasse-t-elle la fréquence maximale utilisable pour voir le fond ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>retard d’un écho : Δt = 2d / v ; dans un gaz parfait, v = √(γRT / M)</li>
        <li>à une interface : R + T = 1 ; l’absorption atténue l’onde (en dB, proportionnellement à la distance)</li>
        <li>résolution ≈ λ = v / f : fréquence élevée = meilleure résolution, moins de pénétration</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ec-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ec-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ec-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .ec-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .ec-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .ec-l1.cote .ec-carte { order: 2; } .ec-l1.cote .ec-main { order: 1; } }
        @media (max-width: 900px) { .ec-l1.cote, .ec-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Échographe : écho, célérité et résolution</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une onde ultrasonore se réfléchit sur un obstacle : le <strong>retard</strong> de l’écho donne la distance (Δt = 2d / v). Un échographe utilise le même principe, mais dans des tissus qui <strong>réfléchissent</strong>, <strong>transmettent</strong> et <strong>absorbent</strong> les ultrasons.</div>
      <div className={`ec-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="ec-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ec-carte">{panneauHypo}</div> : null}
        <div className="ec-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={{ distance: sDis, celerite: sCel, profondeur: sPro, frequence: sFre }[defi.type]}/></div>}
          <div className={`ec-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}{!enDefi || sceneEff === 'echo' ? tableau : null}</div>
          </div>
        </div>
      </div>
      {!enDefi && <div className="ec-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="ec-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
