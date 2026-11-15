import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./vitesseOrdre1Modele";
import { SvgMontage, SvgVitesse, SvgDemiReaction, SvgLoiOrdre1, SvgTestOrdre1, SvgIntervalle } from "./vitesseOrdre1Schemas";

const SIM_ID = 122, CLE_GUIDE = 'vitesse-ordre1-tg-guide-v1';
declarerDefis(SIM_ID, [['vit', 'Quelle est la vitesse volumique à un instant donné ?'], ['ordre', 'Quelle série suit une loi d’ordre 1, et quelle est sa constante k ?']]);

// ====================================================
//  SIM 121 — CINÉTIQUE : VITESSE VOLUMIQUE, TEMPS DE DEMI-RÉACTION ET LOI D’ORDRE 1 (TG spé PC, thème « Constitution et transformations de la matière »)
//  Une seule idée : exploiter l’évolution temporelle d’une concentration c(t). (1) vitesse volumique = −dc/dt (tangente), (2) temps de demi-réaction,
//  (3) test de la loi d’ordre 1 (v/c constant, ln c affine, t½ constant), (4) honnêteté sur les mesures bruitées.
//  Situation : hydrolyse du 2-chloro-2-méthylpropane suivie par conductimétrie. Modèle : vitesseOrdre1Modele.js. Situations originales.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nouvelleGraine = () => 1 + Math.floor(Math.random() * 900000);
const PRESET = { type: 'A', c0: 40.0, k: 0.150, t: 0, tang: false, sigma: 0, graine: 7, dt: 4, sel: 0, niv: false, modele: false };
const SIGMA_GUIDE = 0.4, SIGMA_DEFI = 0.3;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };
const Sub = ({ children }) => <tspan baselineShift="sub" fontSize="0.75em">{children}</tspan>;
const cadreGraphe = { width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` };

// ---------- graphe c = f(t) ----------
function CourbeC({ pts, P, t, cLu, ideal, tang, fen, niv, modele }) {
  const W = 480, H = 300, mx = 46, my = 14, bas = H - 44, ymax = Math.ceil(P.c0 / 10) * 10;
  const X = u => mx + (W - mx - 12) * u / M.DUREE, Y = c => bas - (bas - my) * c / ymax;
  const ligne = (f, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const u = M.DUREE * i / n; return `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(f(u)).toFixed(1)}`; }).join('');
  const ticksC = []; for (let c = 0; c <= ymax; c += 10) ticksC.push(c);
  const tEnd = tang ? Math.min(tang.tB, M.DUREE) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={cadreGraphe} role="img"
      aria-label={`Concentration du réactif en fonction du temps, de ${nbf(P.c0, 1)} millimoles par litre à t égal 0 jusqu’à ${nbf(pts[pts.length - 1].cm, 1)} à ${M.DUREE} minutes. Le point orange est à t égal ${nbf(t, 1)} minutes, c égal ${nbf(cLu, 1)}${tang ? ' ; la tangente en ce point est tracée' : ''}${fen ? ' ; une sécante entre deux points est tracée' : ''}.`}>
      <defs><clipPath id="vo-clip"><rect x={mx} y={my - 4} width={W - mx - 10} height={bas - my + 4}/></clipPath></defs>
      <line x1={mx} y1={bas} x2={W - 10} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {[0, 5, 10, 15, 20].map(u => <text key={u} x={X(u)} y={bas + 16} fontSize="12.5" textAnchor="middle" fill="#334155">{u}</text>)}
      {ticksC.map(c => <g key={c}><line x1={mx} y1={Y(c)} x2={W - 10} y2={Y(c)} stroke="#eef2f7"/><text x={mx - 6} y={Y(c) + 4} fontSize="12.5" textAnchor="end" fill="#334155">{c}</text></g>)}
      <text x={(mx + W) / 2} y={H - 8} fontSize="12.5" textAnchor="middle" fill="#334155">temps t (min)</text>
      <text x="13" y={(my + bas) / 2} fontSize="12.5" fill="#334155" transform={`rotate(-90 13 ${(my + bas) / 2})`} textAnchor="middle">c (mmol/L)</text>
      {niv.map(({ c, vert: v0, hz, n }) => { const tn = M.tempsPour(P, c), vert = v0 && tn <= M.DUREE; return (
        <g key={n}>
          {hz && <><line x1={mx} y1={Y(c)} x2={vert ? X(tn) : W - 10} y2={Y(c)} stroke={COL.gris} strokeDasharray="4 3"/>
            <text x={W - 14} y={Y(c) - 4} fontSize="11.5" textAnchor="end" fill="#475569">{n === 0 ? '' : <>c<tspan baselineShift="sub" fontSize="0.75em">0</tspan>/{2 ** n} = {nbf(c, 1)}</>}</text></>}
          {vert && <line x1={X(tn)} y1={Y(c)} x2={X(tn)} y2={bas} stroke={COL.gris} strokeDasharray="4 3"/>}
        </g>); })}
      {niv.filter(q => q.vert && M.tempsPour(P, q.c) <= M.DUREE).map((q, i, l) => { const t0 = i ? M.tempsPour(P, l[i - 1].c) : 0, t1 = M.tempsPour(P, q.c); return (
        <g key={q.n}><line x1={X(t0) + 2} y1={bas - 4} x2={X(t1) - 2} y2={bas - 4} stroke={COL.vert} strokeWidth="2.6"/><text x={(X(t0) + X(t1)) / 2} y={bas - 10} fontSize="12" fontWeight="700" fill={COL.vert} textAnchor="middle">t<Sub>½</Sub></text></g>); })}
      {(modele || ideal) && <path d={ligne(u => M.conc(P, u))} fill="none" stroke={COL.bleu} strokeWidth={ideal ? 2.4 : 1.6} opacity={ideal ? 1 : 0.7} strokeDasharray={ideal ? undefined : '5 3'}/>}
      {pts.map(p => <circle key={p.t} cx={X(p.t)} cy={Y(p.cm)} r={ideal ? 2.4 : 3.2} fill={COL.bleu} opacity={ideal ? 0.8 : 0.9}/>)}
      {tang && <g clipPath="url(#vo-clip)">
        <line x1={X(0)} y1={Y(tang.cA)} x2={X(tEnd)} y2={Y(Math.max(0, tang.cA - tang.v * tEnd))} stroke={COL.orange} strokeWidth="2" strokeDasharray="6 3"/>
        <circle cx={X(0)} cy={Y(tang.cA)} r="4.5" fill="white" stroke={COL.orange} strokeWidth="2"/>
        {tang.tB <= M.DUREE && <circle cx={X(tang.tB)} cy={bas} r="4.5" fill="white" stroke={COL.orange} strokeWidth="2"/>}
      </g>}
      {tang && tang.cA <= ymax && <text x={X(0) + 9} y={Y(tang.cA) < my + 14 ? Y(tang.cA) + 16 : Y(tang.cA) - 7} fontSize="12" fontWeight="700" fill={COL.orange}>A (0 ; {nbf(tang.cA, 1)})</text>}
      {tang && tang.tB <= M.DUREE && <text x={Math.min(X(tang.tB), W - 62)} y={bas - 8} fontSize="12" fontWeight="700" fill={COL.orange} textAnchor="middle">B ({nbf(tang.tB, 1)} ; 0)</text>}
      {fen && <g>
        <line x1={X(fen.a.t)} y1={Y(fen.a.cm)} x2={X(fen.b.t)} y2={Y(fen.b.cm)} stroke={COL.violet} strokeWidth="2"/>
        <circle cx={X(fen.a.t)} cy={Y(fen.a.cm)} r="6.5" fill="none" stroke={COL.violet} strokeWidth="2"/><circle cx={X(fen.b.t)} cy={Y(fen.b.cm)} r="6.5" fill="none" stroke={COL.violet} strokeWidth="2"/>
      </g>}
      <line x1={X(t)} y1={my} x2={X(t)} y2={bas} stroke={COL.orange} strokeWidth="1.3" strokeDasharray="3 3"/>
      <circle cx={X(t)} cy={Y(cLu)} r="6" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5"/>
    </svg>);
}

// ---------- petits graphes de l’exploration et du parcours ----------
function GrapheVC({ pts, P, exact, dt, t }) {
  const W = 330, H = 250, mx = 44, my = 14, bas = H - 40;
  const donnees = useMemo(() => (exact ? pts.map(p => ({ t: p.t, c: M.conc(P, p.t), v: M.vit(P, p.t) })) : M.vitessesFenetre(pts, dt)), [pts, exact, dt, P]);
  const cmax = Math.ceil(P.c0 / 10) * 10, v0 = M.vit(P, 0), vmax = Math.ceil(v0 * 1.05), pasV = vmax > 8 ? 2 : 1;
  const X = c => mx + (W - mx - 10) * c / cmax, Y = v => bas - (bas - my) * Math.max(0, v) / vmax;
  const ticks = []; for (let v = 0; v <= vmax + 1e-9; v += pasV) ticks.push(v);
  const cur = donnees.reduce((m, q) => (Math.abs(q.t - t) < Math.abs(m.t - t) ? q : m), donnees[0]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={cadreGraphe} role="img"
      aria-label="Vitesse volumique de disparition en fonction de la concentration. La droite en pointillés passe par l’origine et par le premier point : si les points s’alignent sur elle, v est proportionnelle à c.">
      <line x1={mx} y1={bas} x2={W - 8} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {[0, 10, 20, 30, 40, 50, 60].filter(c => c <= cmax).map(c => <text key={c} x={X(c)} y={bas + 15} fontSize="12" textAnchor="middle" fill="#334155">{c}</text>)}
      {ticks.map(v => <g key={v}><line x1={mx} y1={Y(v)} x2={W - 8} y2={Y(v)} stroke="#eef2f7"/><text x={mx - 6} y={Y(v) + 4} fontSize="12" textAnchor="end" fill="#334155">{v}</text></g>)}
      <text x={(mx + W) / 2} y={H - 6} fontSize="12" textAnchor="middle" fill="#334155">c (mmol/L)</text>
      <text x="12" y={(my + bas) / 2} fontSize="12" fill="#334155" transform={`rotate(-90 12 ${(my + bas) / 2})`} textAnchor="middle">v (mmol·L⁻¹·min⁻¹)</text>
      <line x1={X(0)} y1={Y(0)} x2={X(P.c0)} y2={Y(v0)} stroke={COL.gris} strokeWidth="1.6" strokeDasharray="5 3"/>
      {donnees.map(q => <circle key={q.t} cx={X(q.c)} cy={Y(q.v)} r="3" fill={COL.bleu} opacity="0.85"/>)}
      {cur && <circle cx={X(cur.c)} cy={Y(cur.v)} r="6" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5"/>}
    </svg>);
}

function GrapheV({ pts, P, dt, t, exact }) {
  const W = 330, H = 250, mx = 44, my = 14, bas = H - 40;
  const donnees = useMemo(() => (exact ? pts.map(p => ({ t: p.t, v: M.vit(P, p.t) })) : M.vitessesFenetre(pts, dt)), [pts, exact, dt, P]);
  const v0 = M.vit(P, 0), vmax = Math.ceil(v0 * 1.05), pasV = vmax > 8 ? 2 : 1;
  const X = u => mx + (W - mx - 10) * u / M.DUREE, Y = v => bas - (bas - my) * Math.max(0, v) / vmax;
  const ticks = []; for (let v = 0; v <= vmax + 1e-9; v += pasV) ticks.push(v);
  const ligne = Array.from({ length: 81 }, (_, i) => { const u = M.DUREE * i / 80; return `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(M.vit(P, u)).toFixed(1)}`; }).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={cadreGraphe} role="img" aria-label="Vitesse volumique de disparition en fonction du temps : elle diminue au cours du temps. Les points sont estimés par sécantes ; la courbe en pointillés est celle du modèle.">
      <line x1={mx} y1={bas} x2={W - 8} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {[0, 5, 10, 15, 20].map(u => <text key={u} x={X(u)} y={bas + 15} fontSize="12" textAnchor="middle" fill="#334155">{u}</text>)}
      {ticks.map(v => <g key={v}><line x1={mx} y1={Y(v)} x2={W - 8} y2={Y(v)} stroke="#eef2f7"/><text x={mx - 6} y={Y(v) + 4} fontSize="12" textAnchor="end" fill="#334155">{v}</text></g>)}
      <text x={(mx + W) / 2} y={H - 6} fontSize="12" textAnchor="middle" fill="#334155">t (min)</text>
      <text x="12" y={(my + bas) / 2} fontSize="12" fill="#334155" transform={`rotate(-90 12 ${(my + bas) / 2})`} textAnchor="middle">v (mmol·L⁻¹·min⁻¹)</text>
      <path d={ligne} fill="none" stroke={COL.gris} strokeWidth="1.6" strokeDasharray="5 3"/>
      {donnees.map(q => <circle key={q.t} cx={X(q.t)} cy={Y(q.v)} r="3" fill={COL.bleu} opacity="0.85"/>)}
      <line x1={X(t)} y1={my} x2={X(t)} y2={bas} stroke={COL.orange} strokeWidth="1.2" strokeDasharray="3 3"/>
    </svg>);
}

function GrapheLn({ pts, P, ajust, montrerAjust, t }) {
  const W = 330, H = 250, mx = 46, my = 14, bas = H - 40, haut = Math.ceil(M.lnc(P.c0) + 0.3), bot = -7.5;
  const X = u => mx + (W - mx - 10) * u / M.DUREE, Y = y => my + (bas - my) * (haut - y) / (haut - bot);
  const vis = pts.filter(p => p.cm >= 1.0), ticks = []; for (let y = bot + 0.5; y <= haut + 1e-9; y += 1) ticks.push(y);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={cadreGraphe} role="img"
      aria-label={`Logarithme népérien de c sur c° en fonction du temps, avec c° égal 1 mole par litre. ${montrerAjust && ajust ? `La droite d’ajustement a pour pente ${nbf(ajust.pente, 3)} par minute.` : ''} Les points qui sont des droites traduisent une loi d’ordre 1.`}>
      <line x1={mx} y1={bas} x2={W - 8} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {[0, 5, 10, 15, 20].map(u => <text key={u} x={X(u)} y={bas + 15} fontSize="12" textAnchor="middle" fill="#334155">{u}</text>)}
      {ticks.map(y => <g key={y}><line x1={mx} y1={Y(y)} x2={W - 8} y2={Y(y)} stroke="#eef2f7"/><text x={mx - 6} y={Y(y) + 4} fontSize="12" textAnchor="end" fill="#334155">{nbf(y, 1).replace('-', '−')}</text></g>)}
      <text x={(mx + W) / 2} y={H - 6} fontSize="12" textAnchor="middle" fill="#334155">t (min)</text>
      <text x="12" y={(my + bas) / 2} fontSize="12" fill="#334155" transform={`rotate(-90 12 ${(my + bas) / 2})`} textAnchor="middle">ln(c / c°), c° = 1 mol/L</text>
      {montrerAjust && ajust && <line x1={X(0)} y1={Y(ajust.ordonnee)} x2={X(M.DUREE)} y2={Y(ajust.ordonnee + ajust.pente * M.DUREE)} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="5 3"/>}
      {vis.map(p => <circle key={p.t} cx={X(p.t)} cy={Y(M.lnc(p.cm))} r="3" fill={COL.bleu} opacity="0.85"/>)}
      <line x1={X(t)} y1={my} x2={X(t)} y2={bas} stroke={COL.orange} strokeWidth="1.2" strokeDasharray="3 3"/>
    </svg>);
}

// ====================================================
export function SimulationVitesseOrdre1() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviV, noterV] = useCompteurDefi(), [suiviO, noterO] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('vit');
  const [hypoOuv, setHypoOuv] = useState(false), [pyOuv, setPyOuv] = useState(false), [optOuv, setOptOuv] = useState(false);
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['montage', 'courbe', 'deltac', 'signe', 'tangente', 'pente', 'pente12', 'diminue', 'demi', 'demi2', 'demi3', 'vc', 'kconst', 'ln', 'autre', 'compB', 'conclB', 'bruit', 'bravo'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- grandeurs effectives ----------
  const sigma = dd ? SIGMA_DEFI : ti.sigma;
  const P = dd ? (dd.type === 'ordre' ? dd.series[ti.sel] : dd.P) : { type: ti.type, c0: ti.c0, k: ti.k };
  const graine = dd ? dd.graine + (dd.type === 'ordre' ? ti.sel : 0) : ti.graine;
  const { type: pType, c0: pC0, k: pK } = P;
  const pts = useMemo(() => M.serie({ type: pType, c0: pC0, k: pK }, sigma, graine), [pType, pC0, pK, sigma, graine]);
  const ideal = sigma === 0;
  const tc = ideal ? ti.t : Math.round(ti.t / M.PAS) * M.PAS;
  const iC = Math.round(tc / M.PAS), cLu = ideal ? M.conc(P, tc) : pts[iC].cm;
  const dt = ti.dt, fen = (() => { const a = pts[iC - Math.round(dt / 2 / M.PAS)], b = pts[iC + Math.round(dt / 2 / M.PAS)]; return a && b && iC - Math.round(dt / 2 / M.PAS) >= 0 ? { a: { t: a.t, cm: a.cm }, b: { t: b.t, cm: b.cm }, v: (a.cm - b.cm) / (b.t - a.t) } : null; })();
  const vLu = M.vit(P, tc), thP = M.th1(P);
  const tangObj = ti.tang && !dd ? M.tangente(P, tc) : null;
  const ajust = useMemo(() => M.ajustementLn(pts, 1.0), [pts]);

  // niveaux de demi-réaction (traits horizontaux et, une fois la question passée, verticaux)
  const niveaux = (() => {
    const L = [];
    const regle = [['demi', 1], ['demi2', 2], ['demi3', 3]];
    if (enGuide) { regle.forEach(([id, n]) => { if (deja(id)) L.push({ n, c: P.c0 / 2 ** n, hz: true, vert: apres(id) }); }); }
    else if (ti.niv && !(dd && dd.type === 'vit')) [1, 2, 3].forEach(n => L.push({ n, c: P.c0 / 2 ** n, hz: true, vert: !dd || dd.type !== 'ordre' }));
    return L;
  })();
  const niv = niveaux;

  // ---------- états attendus (rétablissements du parcours) ----------
  const attendu = {
    pente: { t: 4, tang: true }, pente12: { t: 12, tang: true }, compB: { type: 'B' }, conclB: { type: 'B' },
    bruit: { type: 'A', sigma: SIGMA_GUIDE, t: 6 },
  }[idE] || null;
  const conforme = !attendu || ((attendu.t == null || Math.abs(ti.t - attendu.t) < 0.05) && (attendu.tang == null || ti.tang === attendu.tang) && (!attendu.type || ti.type === attendu.type) && (attendu.sigma == null || ti.sigma === attendu.sigma));
  const bloque = conforme ? null : 'Rétablissez d’abord la situation avec le bouton au-dessus du graphique.';
  const retablir = () => setT({ ...attendu, ...(attendu.sigma != null ? { graine: 7 } : {}) });
  const libelleRetablir = attendu && `Rétablir : ${attendu.type === 'B' ? 'réaction B' : attendu.type === 'A' ? 'réaction A avec mesures bruitées' : ''}${attendu.t != null && !attendu.type ? `curseur à t = ${nbf(attendu.t, 1)} min` : ''}${attendu.tang ? ', tangente tracée' : ''}`;

  const v6 = M.vit({ type: 'A', c0: 40, k: 0.15 }, 6);
  const ETAPES = [
    { id: 'montage', titre: 'La transformation suivie', focus: ['scene'],
      texte: <>On étudie l’<strong>hydrolyse du 2-chloro-2-méthylpropane</strong> (CH₃)₃C–Cl, noté RCl, dans un mélange d’eau et de propanone maintenu à température constante ; son équation est écrite en haut de l’écran. La transformation est totale. À <em>t</em> = 0, la concentration en RCl est <em>c</em><sub>0</sub> = 40,0{NB}mmol·L⁻¹ (soit 0,0400{NB}mol·L⁻¹). Une cellule de conductimétrie plonge dans le bécher : le schéma montre le même bécher à <em>t</em> = 0 et à <em>t</em> = 10{NB}min.</>,
      tache: { type: 'qcm', q: 'Pourquoi la conductimétrie convient-elle pour suivre cette transformation ?', options: ['la conductivité augmente, car des ions H₃O⁺ et Cl⁻ se forment au fur et à mesure que RCl disparaît', 'la conductivité diminue, car le réactif RCl disparaît', 'la conductivité ne change pas : elle sert seulement à contrôler la température'], bonne: 0,
        expl: 'RCl est une molécule neutre : elle ne conduit pas le courant. La transformation forme des ions (un H₃O⁺ et un Cl⁻ pour chaque RCl consommé) : la conductivité augmente avec leur concentration. Après étalonnage, on en déduit la concentration c(t) du réactif, qui est la grandeur étudiée dans la suite.',
        indice: 'Cherchez les espèces chargées dans l’équation : qui permet le passage du courant dans une solution ?' } },
    { id: 'courbe', titre: 'La courbe c = f(t)', focus: ['courbe', 'mesures'],
      texte: <>Après étalonnage du conductimètre, on connaît la concentration <em>c</em> du réactif RCl à chaque instant : un point toutes les 0,5{NB}min. Le curseur de temps déplace le point orange ; la ligne « Mesures » donne <em>t</em> et <em>c</em>. Placez le curseur à <em>t</em> = 4,0{NB}min.</>,
      tache: { type: 'action', ok: Math.abs(ti.t - 4) < 0.05, label: 'Placer le curseur à 4,0 min', faire: () => setT({ t: 4 }), consigne: 'Réglez le temps sur 4,0 min' } },
    { id: 'deltac', titre: 'Une vitesse volumique moyenne', focus: ['mesures'],
      texte: <>Entre <em>t</em><sub>1</sub> = 4,0{NB}min et <em>t</em><sub>2</sub> = 6,0{NB}min, la concentration passe de <em>c</em><sub>1</sub> = 22,0{NB}mmol·L⁻¹ à <em>c</em><sub>2</sub> = 16,3{NB}mmol·L⁻¹. La <strong>vitesse volumique moyenne de disparition</strong> du réactif sur cet intervalle est
        <Formule><mi>v</mi><mo>=</mo><mo>−</mo><mfrac><mrow><mi mathvariant="normal">Δ</mi><mi>c</mi></mrow><mrow><mi mathvariant="normal">Δ</mi><mi>t</mi></mrow></mfrac></Formule>
        avec Δ<em>c</em> = <em>c</em><sub>2</sub> − <em>c</em><sub>1</sub> et Δ<em>t</em> = <em>t</em><sub>2</sub> − <em>t</em><sub>1</sub>.</>,
      tache: { type: 'num', q: 'Vitesse volumique moyenne de disparition de RCl entre 4,0 et 6,0 min', unite: 'mmol·L⁻¹·min⁻¹', vrai: 2.85, tol: 0.04, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Δc = c₂ − c₁ = 16,3 − 22,0 = −5,7 mmol·L⁻¹ ; Δt = 6,0 − 4,0 = 2,0 min.', 'v = −Δc / Δt = 5,7 / 2,0 = 2,85 mmol·L⁻¹·min⁻¹, soit environ 2,9 mmol·L⁻¹·min⁻¹ (2 chiffres significatifs).'],
        pieges: [[-2.85, 'Une vitesse volumique de disparition est positive : Δc est négatif, donc −Δc/Δt est positif.'], [5.7, 'Il faut diviser par Δt = 2,0 min.'], [0.351, 'Le rapport est inversé : v = −Δc / Δt.']],
        expl: 'v = −Δc / Δt = −(16,3 − 22,0) / (6,0 − 4,0) = 2,85 mmol·L⁻¹·min⁻¹ ≈ 2,9 mmol·L⁻¹·min⁻¹.', indice: 'Calculez d’abord Δc (valeur finale moins valeur initiale), puis Δt, puis v = −Δc / Δt.' } },
    { id: 'signe', titre: 'Pourquoi un signe moins ?', focus: [],
      texte: <>Dans le calcul précédent, Δ<em>c</em> = −5,7{NB}mmol·L⁻¹ est <strong>négatif</strong> (RCl disparaît), mais la vitesse volumique trouvée, 2,9{NB}mmol·L⁻¹·min⁻¹, est positive.</>,
      tache: { type: 'qcm', q: 'Pourquoi définit-on la vitesse volumique de disparition par v = −Δc / Δt ?', options: ['c diminue (Δc < 0) : le signe − rend la vitesse volumique de disparition positive', 'pour convertir les minutes en secondes', 'parce que la vitesse volumique d’un réactif est toujours négative'], bonne: 0,
        expl: 'Un réactif disparaît : sa concentration diminue, Δc < 0. Le signe − compense pour que la vitesse volumique de disparition soit une grandeur positive. (Pour un produit qui apparaît, Δc > 0 et on écrit v = +Δc / Δt.)', indice: 'Regardez le signe de Δc quand un réactif est consommé.' } },
    { id: 'tangente', titre: 'La vitesse volumique à un instant', focus: ['courbe'],
      texte: <>La vitesse moyenne dépend de l’intervalle choisi. Pour la vitesse volumique à <strong>un instant</strong> <em>t</em>, on fait tendre Δ<em>t</em> vers 0 : c’est la dérivée
        <Formule><mi>v</mi><mo>=</mo><mo>−</mo><mfrac><mrow><mi mathvariant="normal">d</mi><mi>c</mi></mrow><mrow><mi mathvariant="normal">d</mi><mi>t</mi></mrow></mfrac></Formule>
        c’est-à-dire l’<strong>opposée de la pente de la tangente</strong> à la courbe en ce point. Cliquez sur « Tracer la tangente » sous le graphique : elle est tracée à <em>t</em> = 4,0{NB}min.</>,
      tache: { type: 'action', ok: ti.tang && Math.abs(ti.t - 4) < 0.05, label: 'Tracer la tangente à 4,0 min', faire: () => setT({ t: 4, tang: true }), consigne: 'Tracez la tangente à t = 4,0 min (bouton sous le graphique)' } },
    { id: 'pente', titre: 'Lire la pente de la tangente', focus: ['courbe'],
      texte: <>La tangente à <em>t</em> = 4,0{NB}min coupe l’axe des concentrations au point A (<em>t</em> = 0 ; <em>c</em> = 35,1{NB}mmol·L⁻¹) et l’axe des temps au point B (<em>t</em> = 10,7{NB}min ; <em>c</em> = 0). Sa pente vaut (0 − 35,1) / (10,7 − 0).</>,
      tache: { type: 'num', q: 'Vitesse volumique de disparition de RCl à t = 4,0 min', unite: 'mmol·L⁻¹·min⁻¹', vrai: 3.29, tol: 0.04, affiche: v => nbf(v, 1), cs: 2, bloque,
        calcul: () => ['Pente de la tangente = (0 − 35,1) / (10,7 − 0) = −3,28 mmol·L⁻¹·min⁻¹ : elle est négative car c diminue.', 'v = −(pente) = +3,3 mmol·L⁻¹·min⁻¹ (3,29 avec les valeurs non arrondies).'],
        pieges: [[-3.29, 'La pente de la tangente est négative, mais la vitesse volumique de disparition est positive : v = −(pente).'], [0.305, 'Le rapport est inversé : la pente est (variation de c) / (variation de t).'], [35.1, '35,1 mmol/L est la concentration en A (ordonnée à l’origine de la tangente), pas la pente.']],
        expl: 'v = −(0 − 35,1) / (10,7 − 0) ≈ 3,3 mmol·L⁻¹·min⁻¹ : c’est plus que la valeur moyenne 2,9 entre 4 et 6 min, car on est au début de l’intervalle, où la courbe est plus raide.', indice: 'La pente d’une droite vaut (variation de c) / (variation de t) entre deux de ses points ; v est l’opposée de cette pente.' } },
    { id: 'pente12', titre: 'Et plus tard ?', focus: ['courbe'],
      texte: <>Placez le curseur à <em>t</em> = 12,0{NB}min : la tangente est bien moins inclinée. Elle coupe l’axe des concentrations en A (0 ; 18,5{NB}mmol·L⁻¹) et l’axe des temps en B (18,7{NB}min ; 0).</>,
      tache: { type: 'num', q: 'Vitesse volumique de disparition de RCl à t = 12,0 min', unite: 'mmol·L⁻¹·min⁻¹', vrai: 0.992, tol: 0.04, affiche: v => nbf(v, 2), cs: 2, bloque,
        calcul: () => ['Pente de la tangente = (0 − 18,5) / (18,7 − 0) = −0,989 mmol·L⁻¹·min⁻¹.', 'v = −(pente) = 0,99 mmol·L⁻¹·min⁻¹.'],
        pieges: [[-0.992, 'La vitesse volumique de disparition est positive : v = −(pente de la tangente).'], [1.01, 'Le rapport est inversé.'], [18.5, '18,5 mmol/L est la concentration en A, pas la pente.']],
        expl: 'v = 18,5 / 18,7 ≈ 0,99 mmol·L⁻¹·min⁻¹ : plus de trois fois plus petite qu’à 4 min.', indice: 'Même méthode qu’à 4,0 min : v est l’opposée de la pente (variation de c) / (variation de t) entre A et B.' } },
    { id: 'diminue', titre: 'Comment la vitesse évolue-t-elle ?', focus: [],
      texte: <>À <em>t</em> = 4,0{NB}min, <em>v</em> = 3,3{NB}mmol·L⁻¹·min⁻¹ et <em>c</em> = 22,0{NB}mmol·L⁻¹. À <em>t</em> = 12,0{NB}min, <em>v</em> = 0,99{NB}mmol·L⁻¹·min⁻¹ et <em>c</em> = 6,6{NB}mmol·L⁻¹.</>,
      tache: { type: 'qcm', q: 'Comment la vitesse volumique de disparition évolue-t-elle au cours du temps ?', options: ['elle diminue, en même temps que la concentration du réactif', 'elle reste constante : la transformation avance au même rythme', 'elle augmente, car il se forme de plus en plus d’ions'], bonne: 0,
        expl: 'v passe de 3,3 à 0,99 mmol·L⁻¹·min⁻¹ : elle diminue quand RCl, de moins en moins concentré, disparaît. La tangente est de plus en plus plate. On va maintenant tester le lien précis entre v et c.', indice: 'Comparez les deux valeurs de v données et la pente des deux tangentes.' },
      retenirTitre: 'À RETENIR : LA VITESSE VOLUMIQUE DE DISPARITION',
      retenir: <>
        <SvgVitesse/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>v = −dc/dt : l’opposée de la pente de la tangente</strong> à la courbe c = f(t). Valeur approchée : v ≈ −Δc/Δt sur un petit intervalle. Unité : mol·L⁻¹·s⁻¹ (ou mmol·L⁻¹·min⁻¹).</li>
          <li>Exemple de la simulation : v = 3,3 mmol·L⁻¹·min⁻¹ à 4 min, 0,99 à 12 min. <strong>La vitesse volumique diminue</strong> : le réactif est consommé.</li>
          <li><strong>Idée fausse</strong> : « la vitesse reste constante ». <strong>Vrai</strong> : la courbe c(t) s’aplatit, la tangente aussi.</li>
        </ul></> },
    { id: 'demi', titre: 'Le temps de demi-réaction', focus: ['courbe'],
      texte: <>Le <strong>temps de demi-réaction</strong> <em>t</em><sub>½</sub> est la durée au bout de laquelle la concentration du réactif limitant a diminué de moitié (transformation totale). Ici <em>c</em><sub>0</sub> = 40,0{NB}mmol·L⁻¹ : un trait en pointillés marque <em>c</em><sub>0</sub>/2 = 20,0{NB}mmol·L⁻¹. Déplacez le curseur de temps jusqu’à ce trait.</>,
      tache: { type: 'num', q: 'Temps de demi-réaction t½', unite: 'min', vrai: 4.62, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['t½ est l’instant où c = c₀/2 = 20,0 mmol·L⁻¹ (en partant de t = 0).', 'Lecture : c = 20,0 mmol·L⁻¹ pour t ≈ 4,6 min.'],
        pieges: [[20, '20,0 mmol/L est la concentration c₀/2, pas la durée.'], [9.24, 'À 9,2 min, la concentration est c₀/4 : il y a eu deux demi-réactions. t½ correspond à la première.']],
        expl: 't½ ≈ 4,6 min : au bout de 4,6 min, il reste la moitié de RCl.', indice: 'Déplacez le curseur de temps jusqu’à ce que le point orange touche le trait c₀/2 = 20,0 mmol/L, puis lisez t.' } },
    { id: 'demi2', titre: 'La deuxième demi-réaction', focus: ['courbe'],
      texte: <>À <em>t</em> = 4,6{NB}min, <em>c</em> = 20,0{NB}mmol·L⁻¹ (= <em>c</em><sub>0</sub>/2). Un second trait marque <em>c</em><sub>0</sub>/4 = 10,0{NB}mmol·L⁻¹. Cherchez l’instant où la concentration l’atteint, puis calculez la durée de cette <strong>deuxième</strong> demi-réaction (de <em>c</em><sub>0</sub>/2 à <em>c</em><sub>0</sub>/4).</>,
      tache: { type: 'num', q: 'Durée de la deuxième demi-réaction (de 20,0 à 10,0 mmol/L)', unite: 'min', vrai: 4.62, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['La concentration atteint 10,0 mmol/L à t ≈ 9,2 min.', 'Durée = 9,2 − 4,6 = 4,6 min.'],
        pieges: [[9.24, '9,2 min est l’instant où c = c₀/4 ; la durée est la différence avec l’instant précédent (4,6 min).']],
        expl: 'La durée est 9,2 − 4,6 = 4,6 min : la même que pour la première demi-réaction.', indice: 'Durée = (instant où c = 10,0) − (instant où c = 20,0, soit 4,6 min).' } },
    { id: 'demi3', titre: 'Prévoir la suite', focus: ['courbe'],
      texte: <>Les deux premières demi-réactions durent chacune 4,6{NB}min. Un troisième trait marque <em>c</em><sub>0</sub>/8 = 5,0{NB}mmol·L⁻¹ ; la concentration vaut 10,0{NB}mmol·L⁻¹ à <em>t</em> = 9,2{NB}min.</>,
      tache: { type: 'qcm', q: 'Combien de temps faut-il, à partir de là, pour passer de 10,0 à 5,0 mmol/L ?', options: ['4,6 min, comme pour les deux premières : t½ est constant', '9,2 min : il faut deux fois plus de temps, car la réaction ralentit', '2,3 min : il reste moins de réactif à consommer'], bonne: 0,
        expl: 'Pour cette transformation, t½ ne dépend pas de la concentration de départ : chaque demi-réaction dure 4,6 min (on lit c = 5,0 mmol/L à 13,9 min = 3 × 4,6). La vitesse diminue, mais la quantité à consommer diminue dans la même proportion.', indice: 'Comparez la durée des deux demi-réactions que vous venez de mesurer.' } },
    { id: 'vc', titre: 'Un lien entre v et c ?', focus: ['graphes'],
      texte: <>Un graphique v = f(c) apparaît (un point par instant). On donne la relation à tester <strong>v = k × c</strong>, où k est une constante. Si elle est vraie, le rapport v / c est constant. À <em>t</em> = 4,0{NB}min : <em>v</em> = 3,29{NB}mmol·L⁻¹·min⁻¹ et <em>c</em> = 22,0{NB}mmol·L⁻¹.</>,
      tache: { type: 'num', q: 'Rapport v / c à t = 4,0 min', unite: 'min⁻¹', vrai: 0.150, tol: 0.03, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => ['v / c = 3,29 / 22,0 = 0,1495 (mmol·L⁻¹·min⁻¹ divisé par mmol·L⁻¹ : l’unité restante est min⁻¹).', 'v / c ≈ 0,150 min⁻¹.'],
        pieges: [[6.69, 'Le rapport est inversé : on demande v / c.'], [3.29 * 22.0, 'On divise v par c, on ne les multiplie pas.']],
        expl: 'v / c = 3,29 / 22,0 ≈ 0,150 min⁻¹.', indice: 'Divisez v par c : l’unité du résultat est min⁻¹.' },
      retenirTitre: 'À RETENIR : LE TEMPS DE DEMI-RÉACTION',
      retenir: <>
        <SvgDemiReaction/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>t½ : durée au bout de laquelle la concentration du réactif limitant est divisée par 2</strong> (transformation totale).</li>
          <li>Ici : 40,0 → 20,0 → 10,0 → 5,0 mmol/L, <strong>chaque fois en 4,6 min</strong>. Pour cette loi, t½ ne dépend pas de la concentration de départ.</li>
          <li>Moyen de s’en souvenir : <strong>« ordre 1 : même durée pour chaque division par 2 »</strong>. Après n demi-réactions, il reste c₀ / 2ⁿ.</li>
        </ul></> },
    { id: 'kconst', titre: 'Le test se poursuit', focus: ['graphes'],
      texte: <>À <em>t</em> = 12,0{NB}min : <em>v</em> = 0,992{NB}mmol·L⁻¹·min⁻¹ et <em>c</em> = 6,61{NB}mmol·L⁻¹, donc <em>v</em> / <em>c</em> = 0,150{NB}min⁻¹ : la même valeur qu’à 4,0{NB}min. Les points du graphique v = f(c) sont alignés sur une droite qui passe par l’origine.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['v est proportionnelle à c : v = k × c avec k = 0,150 min⁻¹ ; la loi de vitesse est d’ordre 1', 'la vitesse est constante au cours du temps', 'la concentration est proportionnelle au temps'], bonne: 0,
        expl: 'Le rapport v / c reste égal à 0,150 min⁻¹ à des instants très différents : la vitesse volumique est proportionnelle à la concentration. C’est une loi de vitesse d’ordre 1, v = k × c ; k est la constante de vitesse (en min⁻¹).', indice: 'Si v / c est constant, que peut-on dire de v par rapport à c ?' } },
    { id: 'ln', titre: 'Un autre test : ln c en fonction de t', focus: ['graphes'],
      texte: <>Si <em>v</em> = −d<em>c</em>/d<em>t</em> = <em>k</em> × <em>c</em>, on montre que <em>c</em>(<em>t</em>) = <em>c</em><sub>0</sub> e<sup>−<em>k</em>·<em>t</em></sup> (solution donnée), donc ln(<em>c</em> / <em>c</em>°) = ln(<em>c</em><sub>0</sub> / <em>c</em>°) − <em>k</em> · <em>t</em>, avec <em>c</em>° = 1{NB}mol·L⁻¹ : c’est une <strong>droite de pente −<em>k</em></strong>. Le graphique ln(<em>c</em> / <em>c</em>°) = f(<em>t</em>) apparaît avec sa droite d’ajustement. Sur la droite : ln(<em>c</em> / <em>c</em>°) = −3,22 à <em>t</em> = 0 et −4,72 à <em>t</em> = 10,0{NB}min.</>,
      tache: { type: 'num', q: 'Pente de la droite ln(c / c°) = f(t)', unite: 'min⁻¹', vrai: -0.150, tol: 0.03, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => ['Pente = [ln(c/c°) à 10,0 min − ln(c/c°) à 0] / (10,0 − 0) = (−4,72 − (−3,22)) / 10,0.', 'Pente = −1,50 / 10,0 = −0,150 min⁻¹ : la pente est négative. Donc k = 0,150 min⁻¹, comme avec v / c.'],
        pieges: [[0.150, 'ln c diminue quand t augmente : la pente est négative (elle vaut −k).'], [-6.67, 'Le rapport est inversé : pente = Δ(ln c) / Δt.'], [-1.5, 'Il faut diviser par Δt = 10,0 min.']],
        expl: 'Pente = −0,150 min⁻¹, donc k = 0,150 min⁻¹ : la même valeur que par le rapport v / c. Les points sont alignés : c’est la signature d’une loi d’ordre 1.', indice: 'Pente = (variation de ln(c/c°)) / (variation de t) entre les deux points donnés.' } },
    { id: 'autre', titre: 'Un autre comportement', focus: ['courbe'],
      texte: <>Toutes les transformations ne suivent pas une loi d’ordre 1. Une autre transformation, <strong>B</strong>, part de la même concentration <em>c</em><sub>0</sub> = 40,0{NB}mmol·L⁻¹ et sa première demi-réaction dure aussi 4,6{NB}min. Choisissez la <strong>réaction B</strong> (boutons sous le graphique) et comparez.</>,
      tache: { type: 'action', ok: ti.type === 'B', label: 'Choisir la réaction B', faire: () => setT({ type: 'B' }), consigne: 'Choisissez la réaction B (boutons sous le graphique)' },
      retenirTitre: 'À RETENIR : LA LOI DE VITESSE D’ORDRE 1',
      retenir: <>
        <SvgLoiOrdre1/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Ordre 1 : v = k × c.</strong> Alors c(t) = c₀ e<sup>−kt</sup>, <strong>ln(c/c°) est une droite de pente −k</strong>, et t½ = ln 2 / k (k en min⁻¹ ou s⁻¹).</li>
          <li>Exemple de la simulation : k = 0,150 min⁻¹, t½ = ln 2 / 0,150 = 4,6 min, trouvé aussi sur la courbe.</li>
          <li>Moyen de s’en souvenir : <strong>« ordre 1 : v ∝ c, ln c affine, t½ constant »</strong>.</li>
        </ul></> },
    { id: 'compB', titre: 'Les demi-réactions de B', focus: ['courbe'],
      texte: <>Pour la réaction B, <em>c</em> = 20,0{NB}mmol·L⁻¹ à <em>t</em> = 4,6{NB}min. Cherchez l’instant où <em>c</em> atteint 10,0{NB}mmol·L⁻¹ (second trait) et calculez la durée de la deuxième demi-réaction.</>,
      tache: { type: 'num', q: 'Durée de la deuxième demi-réaction de B (de 20,0 à 10,0 mmol/L)', unite: 'min', vrai: 9.24, tol: 0.04, affiche: v => nbf(v, 1), cs: 2, bloque,
        calcul: () => ['Pour B, c = 10,0 mmol/L à t ≈ 13,9 min.', 'Durée = 13,9 − 4,6 = 9,3 min environ (9,24 min avec les valeurs exactes) : le double de la première.'],
        pieges: [[13.86, '13,9 min est l’instant où c = c₀/4 ; la durée est la différence avec 4,6 min.'], [4.62, '4,6 min est la durée de la première demi-réaction. Lisez la deuxième sur la courbe de B.']],
        expl: 'Pour B : 4,6 min puis 9,2 min : t½ n’est pas constant, il double à chaque fois.', indice: 'Durée = (instant où c = 10,0) − 4,6 min.' } },
    { id: 'conclB', titre: 'B suit-elle l’ordre 1 ?', focus: ['graphes'],
      texte: <>Pour la réaction B : les durées de demi-réaction valent 4,6{NB}min puis 9,2{NB}min, le rapport <em>v</em> / <em>c</em> diminue (0,216 puis 0,108{NB}min⁻¹ quand <em>c</em> passe de 40,0 à 20,0{NB}mmol·L⁻¹) et les points de ln(<em>c</em> / <em>c</em>°) = f(<em>t</em>) ne sont pas alignés.</>,
      tache: { type: 'qcm', q: 'La réaction B suit-elle une loi de vitesse d’ordre 1 ?', options: ['non : t½ n’est pas constant, v / c n’est pas constant et ln c n’est pas une droite', 'oui : sa première demi-réaction dure 4,6 min, comme pour A', 'oui : sa concentration décroît au cours du temps'], bonne: 0,
        expl: 'Un seul test négatif suffit pour écarter l’ordre 1, et ici les trois le sont. La première demi-réaction de B est identique à celle de A : il faut comparer plusieurs demi-réactions, pas une seule. (Pour B, v est proportionnelle à c² : ce n’est pas au programme.)', indice: 'Comparez, pour A et pour B, la constance de t½, celle de v / c et l’allure de ln c.' } },
    { id: 'bruit', titre: 'Des mesures bruitées', focus: ['courbe', 'mesures'],
      texte: <>Dans une vraie expérience, chaque mesure est entachée d’un petit écart aléatoire (ici σ = 0,4{NB}mmol·L⁻¹). Revenez à la <strong>réaction A</strong> et à <em>t</em> = 6,0{NB}min (bouton ci-dessus). On estime <em>v</em> avec deux points écartés de Δ<em>t</em> et centrés sur <em>t</em> : <em>v</em> ≈ −(<em>c</em><sub>2</sub> − <em>c</em><sub>1</sub>) / Δ<em>t</em>. Le tableau donne l’estimation pour quatre valeurs de Δ<em>t</em> ; « Nouvelle série » refait l’expérience. Valeur exacte du modèle, inconnue en pratique : {nbf(v6, 2)}{NB}mmol·L⁻¹·min⁻¹.</>,
      tache: { type: 'qcm', q: 'Quel intervalle Δt donne le meilleur compromis ?', options: ['Δt = 4 min : assez grand pour que le bruit compte peu, assez petit pour que la courbe reste presque une droite', 'Δt = 1 min : plus l’intervalle est petit, plus on se rapproche de la tangente', 'Δt = 8 min : plus l’intervalle est grand, plus la mesure est précise'], bonne: 0, bloque,
        expl: 'Avec Δt = 1 min, l’écart dû au bruit atteint environ 23 % : les estimations varient beaucoup d’une série à l’autre. Avec Δt = 8 min, le bruit pèse peu (3 %) mais la courbure fausse la sécante d’environ 6 %. Δt = 4 min : environ 6 % de bruit et 1,5 % de courbure.', indice: 'Refaites plusieurs séries et regardez comment varient les estimations pour chaque Δt, et si elles s’écartent systématiquement de 2,44.' },
      retenirTitre: 'À RETENIR : TESTER L’ORDRE 1',
      retenir: <>
        <SvgTestOrdre1/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Trois tests</strong> pour savoir si c(t) suit une loi d’ordre 1 : t½ constant ; ln(c/c°) = f(t) est une droite ; v / c est constant.</li>
          <li><strong>Un seul test négatif suffit pour rejeter l’ordre 1</strong>. Comparer au moins deux demi-réactions : la première seule ne prouve rien.</li>
          <li><strong>Idée fausse</strong> : « la courbe décroît, donc c’est d’ordre 1 ». <strong>Vrai</strong> : A et B décroissent toutes deux, une seule suit l’ordre 1.</li>
        </ul></> },
    { id: 'bravo', titre: 'Bilan', focus: [],
      texte: <>Vous savez déterminer une vitesse volumique de disparition à partir d’une courbe, lire un temps de demi-réaction, et tester si une évolution suit une loi d’ordre 1. Passez à l’exploration (autres constantes, bruit, quatre graphiques) ou tentez les deux défis.</>, tache: null,
      retenirTitre: 'À RETENIR : ESTIMER UNE VITESSE SUR DES MESURES BRUITÉES',
      retenir: <>
        <SvgIntervalle/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Mesures bruitées : v ≈ −Δc/Δt sur un intervalle ni trop petit, ni trop grand.</strong> Δt petit : le bruit domine (u(v) ≈ √2·σ / Δt). Δt grand : la courbure fausse la valeur.</li>
          <li>Exemple (σ = 0,4 mmol/L, v = 2,4 à 6 min) : Δt = 1 min → ± 23 %, Δt = 4 min → ± 6 %.</li>
          <li><strong>Une valeur sans incertitude est incomplète</strong> : donner v avec 2 chiffres significatifs et une marge de quelques pour cent.</li>
        </ul></> },
  ];
  // La carte « vitesse volumique » conclut la question de l’étape « diminue » : elle s’affiche à l’étape suivante. Les autres cartes sont déjà posées sur l’étape qui suit leur question.
  [['diminue', 'demi']].forEach(([de, vers]) => {
    const a = ETAPES.find(e => e.id === de), b = ETAPES.find(e => e.id === vers);
    b.retenir = a.retenir; b.retenirTitre = a.retenirTitre; delete a.retenir; delete a.retenirTitre;
  });
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const donneesDefi = type => {
    const graineD = nouvelleGraine();
    if (type === 'vit') {
      for (;;) {
        const c0 = tire([40, 45, 50, 55, 60]), k = tire([0.10, 0.12, 0.14, 0.16, 0.18, 0.20]), tc = tire([4, 5, 6, 7, 8]), p = { type: 'A', c0, k };
        if (M.vit(p, tc) >= 2.0) return { type, P: p, tc, graine: graineD };
      }
    }
    const c0 = tire([40, 50, 60]), kA = tire([0.12, 0.14, 0.16, 0.18, 0.20]), ths = melange([3.5, 4, 5, 6]).slice(0, 2), idxA = Math.floor(Math.random() * 3);
    const series = [0, 1, 2].map(i => (i === idxA ? { type: 'A', c0, k: kA } : { type: 'B', c0, k: Math.LN2 / ths.pop() }));
    return { type, series, idxA, kA, graine: graineD };
  };
  const nouveauDefi = type => {
    const d = donneesDefi(type);
    setDefi({ ...d, type, reps: {}, choix: null, verifie: false });
    setTi(s => ({ ...s, ...PRESET, dt: 4, sel: 0, t: type === 'vit' ? d.tc : 0 }));
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const vVraiDefi = defi && defi.type === 'vit' ? M.vit(defi.P, defi.tc) : null;
  const verifier = () => {
    if (defi.type === 'vit') {
      const x = lireNombre(defi.reps.v), ok = isFinite(x) && Math.abs(x - vVraiDefi) <= 0.15 * vVraiDefi;
      setDefi(d => ({ ...d, verifie: true, ok })); noterV(ok);
    } else {
      const okS = defi.choix === defi.idxA, x = lireNombre(defi.reps.k), okK = isFinite(x) && proche(x, defi.kA, 0.08);
      setDefi(d => ({ ...d, verifie: true, okS, okK, ok: okS && okK })); noterO(okS && okK);
    }
  };
  const champ = (cle, label, unite, largeur = 90) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('vo-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: largeur, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? ((cle === 'v' ? defi.ok : defi.okK) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['vit', 'Vitesse volumique à un instant'], ['ordre', 'Ordre 1 ou non ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'vit' ? 'Défi : vitesse volumique de disparition à un instant donné' : 'Défi : quelle série suit une loi d’ordre 1 ?'}</div>
      {defi.type === 'vit' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>La concentration d’un réactif est suivie au cours du temps ; les mesures sont <strong>bruitées</strong> (σ = 0,3{NB}mmol·L⁻¹). Estimez la vitesse volumique de disparition à <strong><em>t</em> = {defi.tc},0{NB}min</strong> : choisissez l’intervalle Δ<em>t</em> (boutons sous le graphique), relevez les deux points entourés de la sécante dans « Mesures », puis calculez <em>v</em> = −Δ<em>c</em>/Δ<em>t</em>. Donnez le résultat avec 2 chiffres significatifs ; une marge de ± 15 % est acceptée à cause du bruit.</div>
        {champ('v', 'Vitesse volumique v', 'mmol·L⁻¹·min⁻¹', 100)}
        <IndiceDefi cache={false}>Choisissez Δ<em>t</em> de 4 min environ (ni trop petit : le bruit domine, ni trop grand : la courbure fausse la valeur). Relevez <em>c</em><sub>1</sub> à <em>t</em><sub>1</sub> = <em>t</em> − Δ<em>t</em>/2 et <em>c</em><sub>2</sub> à <em>t</em><sub>2</sub> = <em>t</em> + Δ<em>t</em>/2, puis <em>v</em> = (<em>c</em><sub>1</sub> − <em>c</em><sub>2</sub>) / (<em>t</em><sub>2</sub> − <em>t</em><sub>1</sub>).</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>Trois séries de mesures bruitées (σ = 0,3{NB}mmol·L⁻¹) de la même concentration initiale <em>c</em><sub>0</sub> = <strong>{nbf(defi.series[0].c0, 1)}{NB}mmol·L⁻¹</strong> : une seule suit une loi de vitesse d’ordre 1. Affichez chaque série (boutons sous le graphique), utilisez les traits de demi-réaction et le graphique de ln(<em>c</em> / <em>c</em>°), puis indiquez la série d’ordre 1 et sa constante <em>k</em> (2 chiffres significatifs, marge de ± 8 %).</div>
        <div role="group" aria-label="Série d’ordre 1" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>La série d’ordre 1 est :</span>
          {[0, 1, 2].map(i => <button key={i} onClick={() => setDefi(d => ({ ...d, choix: i, verifie: false }))} aria-pressed={defi.choix === i} style={stylePetitBouton(defi.choix === i, '#475569')}>n° {i + 1}</button>)}
        </div>
        {champ('k', 'Constante k de cette série', 'min⁻¹', 90)}
        <IndiceDefi cache={false}>Pour chaque série, comparez les durées de la 1ʳᵉ et de la 2ᵉ demi-réaction (traits de demi-réaction) : elles sont égales pour l’ordre 1. Pour la série d’ordre 1, <em>k</em> = ln 2 / <em>t</em><sub>½</sub> avec <em>t</em><sub>½</sub> en minutes (ou l’opposé de la pente de ln(<em>c</em> / <em>c</em>°)).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="vo-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'vit'
          ? (defi.ok ? `✓ Correct. La valeur du modèle est ${nbf(vVraiDefi, 2)} mmol·L⁻¹·min⁻¹ (marge acceptée : ± 15 %).` : '✗ Vérifiez : v = −Δc/Δt avec Δc = c₂ − c₁ (négatif), des points écartés de 4 min environ et centrés sur l’instant demandé ; v est positive.')
          : (defi.ok ? `✓ Correct. La série n° ${defi.idxA + 1} est d’ordre 1, avec k = ${nbf(defi.kA, 2)} min⁻¹ (t½ = ${nbf(Math.LN2 / defi.kA, 1)} min).`
            : <>{defi.okS ? `✓ La série n° ${defi.idxA + 1} est bien d’ordre 1.` : '✗ Série : pour l’ordre 1, les durées de demi-réaction successives sont égales et ln(c/c°) est une droite.'}{' '}{defi.okK ? '✓ Constante k correcte.' : '✗ Constante : k = ln 2 / t½ (t½ en min), à ± 8 % près.'}</>)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Réaction et suivi</strong> : hydrolyse du 2-chloro-2-méthylpropane, (CH₃)₃C–Cl + 2 H₂O → (CH₃)₃C–OH + H₃O⁺ + Cl⁻, dans un mélange eau–propanone ; suivi par conductimétrie. La valeur de <em>k</em> est choisie pour la simulation (ordre de grandeur plausible pour une séance de quelques dizaines de minutes), ce n’est pas une valeur mesurée sur un montage précis.</li>
      <li><strong>Température constante</strong> (bain thermostaté) et <strong>volume constant</strong> : <em>k</em> dépend de la température ; une dérive changerait <em>k</em> au cours de l’expérience. Pas d’évaporation de la propanone.</li>
      <li><strong>Réaction unique et totale</strong> : on néglige toute réaction parasite (une élimination est possible en réalité). Le réactif limitant est RCl ; l’eau, solvant en grand excès, a une concentration quasi constante : c’est pourquoi la loi est d’ordre 1 par rapport à RCl.</li>
      <li><strong>Suivi idéal</strong> : la conductivité est supposée proportionnelle à la concentration des ions formés (loi de Kohlrausch, solution diluée) et l’étalonnage supposé parfait : on dispose directement de <em>c</em>(<em>t</em>) = <em>c</em><sub>0</sub> (σ<sub>∞</sub> − σ) / (σ<sub>∞</sub> − σ<sub>0</sub>). Un vrai conductimètre dérive et dépend de la température.</li>
      <li><strong>Bruit éventuel</strong> : écart aléatoire centré, de même écart-type σ pour tous les points, indépendant d’un point à l’autre (loi normale) ; mesures arrondies au 0,1{NB}mmol·L⁻¹. En réalité, le bruit peut varier avec la concentration ou présenter des dérives. Les premières étapes du parcours utilisent des données sans bruit pour isoler la notion.</li>
      <li><strong>Validité de la loi d’ordre 1</strong> : pour la réaction A, <em>v</em> = <em>k</em> · <em>c</em> est supposée vraie pendant tout le suivi, avec <em>k</em> constante (le milieu ne change pas de polarité au fur et à mesure que les ions se forment). La réaction B est un <strong>contre-exemple construit</strong> (vitesse proportionnelle à <em>c</em>² ; sa première demi-réaction dure autant que celle de A) pour montrer qu’une courbe décroissante ne suffit pas à conclure.</li>
      <li><strong>Temps de demi-réaction</strong> : défini pour une transformation totale par <em>c</em> = <em>c</em><sub>0</sub>/2 ; il ne se lit pas de la même façon pour une transformation non totale.</li>
      <li><strong>Vitesse volumique</strong> : c’est la dérivée temporelle de la concentration, −d<em>c</em>/d<em>t</em> ; la « vitesse de réaction » (dérivée de l’avancement) n’est pas utilisée ici. En pratique on l’estime par une sécante sur un intervalle Δ<em>t</em> : un petit Δ<em>t</em> amplifie le bruit (u(<em>v</em>) ≈ √2 σ / Δ<em>t</em>), un grand Δ<em>t</em> écarte la sécante de la tangente.</li>
      <li><strong>Limites du modèle</strong> : durée de 20{NB}min, un point toutes les 0,5{NB}min, un seul réactif suivi ; les facteurs cinétiques, la catalyse et le mécanisme réactionnel ne sont pas traités ici. Le test de l’ordre 1 se fait sur la durée du suivi : il ne prouve pas la validité de la loi hors de cette plage.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- contrôles sous le graphique ----------
  const boutonRetablir = (txt, f) => <button onClick={f} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>{txt}</button>;
  const montrerTang = (enGuide && deja('tangente')) || enExplore;
  const montrerType = (enGuide && deja('autre')) || enExplore;
  const montrerBruit = (enGuide && deja('bruit')) || enExplore;
  const montrerFen = (enGuide && idE === 'bruit') || enExplore || (dd && dd.type === 'vit');
  const pasT = ideal ? 0.1 : M.PAS;
  const optionsExplore = enExplore && (<>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      {[0, 0.2, 0.4, 0.8].map(sg => <button key={sg} onClick={() => setT({ sigma: sg })} aria-pressed={ti.sigma === sg} style={stylePetitBouton(ti.sigma === sg, '#b91c1c')}>{sg ? `σ = ${nbf(sg, 1)}` : 'sans bruit'}</button>)}
      {ti.sigma > 0 && <button onClick={() => setT({ graine: nouvelleGraine() })} style={stylePetitBouton(false, '#475569')}><Pic n="refresh"/>Nouvelle série</button>}
    </div>
    <div role="group" aria-label="Intervalle Δt" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Intervalle Δt</span>
      {M.DT_OPTIONS.map(d => <button key={d} onClick={() => setT({ dt: d })} aria-pressed={ti.dt === d} style={stylePetitBouton(ti.dt === d, COL.violet)}>{d} min</button>)}
    </div></>);
  const controles = (
    <div style={{ marginTop: 8 }}>
      <Curseur nom="Temps t" valeur={tc} onChange={v => setT({ t: Math.max(0, Math.min(M.DUREE, Math.round(v / pasT) * pasT)) })} min={0} max={M.DUREE} pas={pasT} unite="min" decimales={1} couleur="#b45309"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {montrerTang && !dd && <button onClick={() => setT({ tang: !ti.tang })} aria-pressed={ti.tang} style={stylePetitBouton(ti.tang, '#b45309')}>{ti.tang ? 'Masquer la tangente' : 'Tracer la tangente'}</button>}
        {montrerType && !dd && <span role="group" aria-label="Réaction étudiée" style={{ display: 'inline-flex', gap: 6 }}>
          {[['A', 'Réaction A'], ['B', 'Réaction B']].map(([k, l]) => <button key={k} onClick={() => setT({ type: k })} aria-pressed={ti.type === k} style={stylePetitBouton(ti.type === k, '#0f766e')}>{l}</button>)}</span>}
        {dd && dd.type === 'ordre' && <span role="group" aria-label="Série affichée" style={{ display: 'inline-flex', gap: 6 }}>
          {[0, 1, 2].map(i => <button key={i} onClick={() => setT({ sel: i })} aria-pressed={ti.sel === i} style={stylePetitBouton(ti.sel === i, '#0f766e')}>Série {i + 1}</button>)}</span>}
        {dd && dd.type === 'ordre' && <button onClick={() => setT({ niv: !ti.niv })} aria-pressed={ti.niv} style={stylePetitBouton(ti.niv, '#475569')}>Traits de demi-réaction</button>}
      </div>
      {enExplore && <div style={{ marginTop: 8 }}><Section titre="Plus d’options : demi-réactions, modèle, bruit, intervalle Δt" ouvert={optOuv} onBascule={() => setOptOuv(o => !o)}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setT({ niv: !ti.niv })} aria-pressed={ti.niv} style={stylePetitBouton(ti.niv, '#475569')}>Demi-réactions</button>
          <button onClick={() => setT({ modele: !ti.modele })} aria-pressed={ti.modele} style={stylePetitBouton(ti.modele, '#475569')}>Courbe du modèle</button>
        </div>
        {optionsExplore}
      </Section></div>}
      {!enExplore && montrerBruit && !dd && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <button onClick={() => setT({ sigma: ti.sigma ? 0 : SIGMA_GUIDE })} aria-pressed={ti.sigma > 0} style={stylePetitBouton(ti.sigma > 0, '#b91c1c')}>{ti.sigma ? 'Mesures bruitées' : 'Rendre les mesures bruitées'}</button>
        {ti.sigma > 0 && <button onClick={() => setT({ graine: nouvelleGraine() })} style={stylePetitBouton(false, '#475569')}><Pic n="refresh"/>Nouvelle série</button>}
      </div>}
      {!enExplore && montrerFen && !ideal && <div role="group" aria-label="Intervalle Δt" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Intervalle Δt</span>
        {M.DT_OPTIONS.map(d => <button key={d} onClick={() => setT({ dt: d })} aria-pressed={ti.dt === d} style={stylePetitBouton(ti.dt === d, COL.violet)}>{d} min</button>)}
      </div>}
    </div>);

  // ---------- tableau des estimations (étape « bruit ») ----------
  const tableEstim = enGuide && deja('bruit') && !ideal && (
    <div style={{ marginTop: 8 }}>
      <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Intervalle Δt</th><th style={{ padding: '2px 4px' }}>v estimée à t = 6,0 min</th></tr></thead>
        <tbody>{[1, 2, 4, 8].map(d => { const q = M.vitesseFenetre(pts, 6, d); return (
          <tr key={d} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 600 }}>{d} min</td><td style={{ padding: '3px 4px', fontFamily: 'monospace', fontWeight: 700 }}>{q ? `${nbf(q.v, 2)} mmol·L⁻¹·min⁻¹` : '—'}</td></tr>); })}</tbody>
      </table>
    </div>);

  // ---------- zones ----------
  const equation = (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Transformation étudiée (totale, à température constante)</div>
      <div role="math" aria-label="2-chloro-2-méthylpropane plus deux eau donne 2-méthylpropan-2-ol plus ion oxonium plus ion chlorure" style={{ fontSize: 17, fontWeight: 600, color: KIT.txt, lineHeight: 1.7, margin: '4px 0 6px' }}>
        <span style={{ whiteSpace: 'nowrap' }}>(CH<sub>3</sub>)<sub>3</sub>C–Cl + 2{NB}H<sub>2</sub>O</span>{' '}<span style={{ whiteSpace: 'nowrap' }}>→ (CH<sub>3</sub>)<sub>3</sub>C–OH</span>{' '}<span style={{ whiteSpace: 'nowrap' }}>+ H<sub>3</sub>O<sup>+</sup> + Cl<sup>−</sup></span>
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.5 }}>Le réactif suivi, (CH₃)₃C–Cl, est noté RCl ; sa concentration initiale est c<sub>0</sub> = {nbf(dd ? P.c0 : ti.c0, 1)}{NB}mmol/L.</div>
    </div>);
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {equation}
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le montage : suivi par conductimétrie</div>
      <SvgMontage/>
    </div>);
  const graphiqueCourbe = (!enGuide || deja('courbe')) && (
    <div style={{ ...styleBoite, ...cadre('courbe') }}>
      {enGuide && attendu && !conforme && boutonRetablir(libelleRetablir, retablir)}
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Concentration du réactif RCl : c = f(t){dd ? '' : P.type === 'B' ? ' (réaction B)' : ''}{dd && dd.type === 'ordre' ? ` (série ${ti.sel + 1})` : ''}</div>
      <CourbeC pts={pts} P={P} t={tc} cLu={cLu} ideal={ideal} tang={tangObj} fen={montrerFen && !ideal ? fen : null} niv={niv} modele={enExplore && ti.modele}/>
      {controles}
      {tableEstim}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>{ideal ? 'Données sans bruit : un point toutes les 0,5 min.' : `Points mesurés bruités (σ = ${nbf(sigma, 1)} mmol/L).`} Le point orange suit le curseur de temps.{!ideal && montrerFen ? ' Sécante en violet.' : ''}</div>
    </div>);
  const montrerGraphes = (!enGuide || deja('vc')) && !(dd && dd.type === 'vit');
  const exactVC = ideal;
  const graphiqueVC = montrerGraphes && (
    <div style={{ ...styleBoite, ...cadre('graphes') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Test : v = f(c)</div>
      <GrapheVC pts={pts} P={P} exact={exactVC} dt={dt} t={tc}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Pointillés : droite passant par l’origine et le premier point. Points alignés sur elle ⇒ v proportionnelle à c.{!ideal ? ` Vitesses estimées par sécante (Δt = ${dt} min).` : ''}</div>
    </div>);
  const graphiqueLn = (!enGuide || deja('ln')) && !(dd && dd.type === 'vit') && (
    <div style={{ ...styleBoite, ...cadre('graphes') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Test : ln(c / c°) = f(t)</div>
      <GrapheLn pts={pts} P={P} ajust={ajust} montrerAjust={!dd} t={tc}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>c° = 1 mol/L ; c est converti en mol/L. {dd ? 'Points alignés ⇒ loi d’ordre 1.' : 'Pointillés orange : droite d’ajustement (moindres carrés).'} {!ideal ? 'Les points de concentration inférieure à 1 mmol/L ne sont pas tracés (bruit relatif trop grand).' : ''}</div>
    </div>);
  const graphiqueV = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Vitesse volumique : v = f(t)</div>
      <GrapheV pts={pts} P={P} exact={ideal} dt={dt} t={tc}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Points : v estimée par sécante (Δt = {dt} min) ; pointillés : modèle.</div>
    </div>);

  // ---------- mesures ----------
  const ln = M.lnc(Math.max(cLu, 0.05));
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Temps t" valeur={`${nbf(tc, 1)}${NB}min`}/>
      <LigneMesure nom="Concentration c" valeur={`${nbf(cLu, 1)}${NB}mmol/L`} couleur="#b45309"/>
      {dd && dd.type === 'vit' && fen && <>
        <LigneMesure nom="Point 1 : t₁ ; c₁" valeur={`${nbf(fen.a.t, 1)}${NB}min ; ${nbf(fen.a.cm, 1)}${NB}mmol/L`} couleur={COL.violet}/>
        <LigneMesure nom="Point 2 : t₂ ; c₂" valeur={`${nbf(fen.b.t, 1)}${NB}min ; ${nbf(fen.b.cm, 1)}${NB}mmol/L`} couleur={COL.violet}/></>}
      {!dd && ((enGuide && apres('pente12')) || enExplore) && (ideal || enExplore) && <LigneMesure nom={ideal ? 'v = −dc/dt (tangente)' : 'v exacte du modèle'} valeur={`${nbf(vLu, 2)}${NB}mmol·L⁻¹·min⁻¹`} couleur="#15803d"/>}
      {!dd && !ideal && fen && ((enGuide && deja('bruit')) || enExplore) && <LigneMesure nom={`v estimée (sécante, Δt = ${dt} min)`} valeur={`${nbf(fen.v, 2)}${NB}mmol·L⁻¹·min⁻¹`} couleur={COL.violet}/>}
      {!dd && !ideal && enExplore && <LigneMesure nom="incertitude due au bruit √2·σ/Δt" valeur={`± ${nbf(M.incertitudeVitesse(sigma, dt), 2)}${NB}mmol·L⁻¹·min⁻¹`}/>}
      {!dd && ((enGuide && apres('demi')) || enExplore) && <LigneMesure nom="t½ de la 1ʳᵉ demi-réaction" valeur={`${nbf(thP, 2)}${NB}min`} couleur="#15803d"/>}
      {!dd && ((enGuide && apres('kconst')) || enExplore) && ideal && <LigneMesure nom="Rapport v / c" valeur={`${nbf(vLu / M.conc(P, tc), 3)}${NB}min⁻¹`}/>}
      {!dd && ((enGuide && apres('ln')) || enExplore) && <LigneMesure nom="ln(c / c°), c° = 1 mol/L" valeur={nbf(ln, 2).replace('-', '−')}/>}
      {!dd && ((enGuide && apres('ln')) || enExplore) && ajust && <LigneMesure nom="Pente de la droite d’ajustement" valeur={`${nbf(ajust.pente, 3).replace('-', '−')}${NB}min⁻¹`}/>}
      {enExplore && ajust && <LigneMesure nom="Qualité de l’alignement r²" valeur={nbf(ajust.r2, 4)}/>}
      {enExplore && P.type === 'A' && <LigneMesure nom="Constante k = ln 2 / t½" valeur={`${nbf(P.k, 3)}${NB}min⁻¹`}/>}
    </div>);

  // ---------- exploration : réglages, essais, retenir, Python ----------
  const reglages = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages de l’expérience</div>
      <Curseur nom="Concentration initiale c₀" valeur={ti.c0} onChange={v => setT({ c0: v })} min={20} max={60} pas={5} unite="mmol/L" decimales={1} couleur="#475569"/>
      <Curseur nom={ti.type === 'A' ? 'Constante de vitesse k' : 'k équivalent (t½ de la 1ʳᵉ demi-réaction = ln 2 / k)'} valeur={ti.k} onChange={v => setT({ k: Math.round(v * 100) / 100 })} min={0.06} max={0.20} pas={0.01} unite="min⁻¹" decimales={2} couleur="#475569"/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.5 }}>Réaction A : v = k × c. Réaction B : v = c² / (c₀ · t<sub>½,1</sub>), c’est-à-dire proportionnelle à c² ; sa 1ʳᵉ demi-réaction dure autant que celle de A.</div>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Réaction A : doublez c₀ (20 → 40 mmol/L) en laissant k fixe. Que deviennent t½ et la vitesse initiale ? Que concluez-vous sur t½ pour l’ordre 1 ?</li>
        <li>Même chose avec la réaction B : t½ ne dépend-il pas de c₀ ?</li>
        <li>Augmentez k de 0,10 à 0,20 min⁻¹ : comment varient t½ et la pente de la droite ln c ?</li>
        <li>Activez le bruit (σ = 0,8) et estimez v à t = 6 min pour Δt = 1, 4 et 8 min. Refaites plusieurs séries : quelle valeur de Δt est la plus stable ? la moins biaisée ?</li>
        <li>Avec du bruit, la droite ln c reste-t-elle une droite ? À partir de quelle concentration les points s’écartent-ils ? Pourquoi les derniers points sont-ils les plus dispersés ?</li>
      </ul>
    </div>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>vitesse volumique de disparition : v = −dc/dt, opposée de la pente de la tangente (≈ −Δc/Δt sur un petit intervalle)</li>
        <li>temps de demi-réaction : c = c₀/2 (transformation totale)</li>
        <li>ordre 1 : v = k·c ⇔ c = c₀e<sup>−kt</sup> ⇔ ln c affine de pente −k ⇔ t½ = ln 2 / k constant</li>
        <li>mesures bruitées : Δt ni trop petit (bruit), ni trop grand (courbure) ; un seul test négatif rejette l’ordre 1</li>
      </ul>
    </ARetenir>);
  const codePython = enExplore && pyOuv && (() => {
    const tt = pts.map(p => p.t), cc = pts.map(p => p.cm), m = Math.round(dt / 2 / M.PAS);
    return `import numpy as np
import matplotlib.pyplot as plt

t = np.array([${tt.join(', ')}])      # min
c = np.array([${cc.join(', ')}])      # mmol/L

m = ${m}   # nombre de points de chaque côté : intervalle Δt = ${dt} min
v = (c[:-2*m] - c[2*m:]) / (t[2*m:] - t[:-2*m])    # v = −Δc/Δt, centrée sur t[m:-m]
tv, cv = t[m:-m], c[m:-m]

ok = c > 1.0                                        # points assez grands devant le bruit
pente, ordonnee = np.polyfit(t[ok], np.log(c[ok] / 1000), 1)    # ln(c/c°) = f(t), c° = 1 mol/L
print("k d'après ln c :", round(-pente, 3), "min-1")
print("v / c :", np.round(v / cv, 3))               # constant ⇒ v = k·c

fig, ax = plt.subplots(1, 3, figsize=(12, 3.5))
ax[0].plot(t, c, "o"); ax[0].set(xlabel="t (min)", ylabel="c (mmol/L)")
ax[1].plot(cv, v, "o"); ax[1].set(xlabel="c (mmol/L)", ylabel="v (mmol/L/min)")
ax[2].plot(t[ok], np.log(c[ok] / 1000), "o"); ax[2].set(xlabel="t (min)", ylabel="ln(c/c°)")
plt.tight_layout(); plt.show()`;
  })();
  const blocPython = enExplore && (
    <div style={styleBoite}>
      <Section titre="Le même traitement avec Python (capacité numérique)" ouvert={pyOuv} onBascule={() => setPyOuv(o => !o)}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Programme qui trace c(t), v = f(c) et ln c = f(t) pour la série affichée, estime v par sécante, ajuste ln c et teste si v / c est constant.</div>
        <pre style={{ margin: 0, padding: 10, background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 8, fontSize: 12, overflowX: 'auto', lineHeight: 1.45 }}><code>{codePython}</code></pre>
      </Section>
    </div>);

  const titreSim = 'Cinétique : vitesse volumique, temps de demi-réaction et loi d’ordre 1';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .vo-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .vo-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .vo-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .vo-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(260px, 1fr); margin-bottom: 12px; }
        .vo-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .vo-l1.cote .vo-carte { order: 2; } .vo-l1.cote .vo-main { order: 1; } }
        @media (max-width: 900px) { .vo-l1.cote, .vo-pri { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .vo-in { animation: vo-fondu 0.35s ease-out; } @keyframes vo-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>{titreSim}</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>À partir de la <strong>courbe d’évolution d’une concentration</strong>, on détermine une <strong>vitesse volumique</strong> et un <strong>temps de demi-réaction</strong>, puis on teste si l’évolution suit une <strong>loi de vitesse d’ordre 1</strong>.</div>
      <div className={`vo-l1${!enExplore ? ' cote' : ''}`}>
        {enGuide ? <div className="vo-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="vo-carte">{panneauHypo}</div> : null}
        <div className="vo-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'vit' ? suiviV : suiviO}/></div>}
          {dd ? <div style={{ ...styleBoite, marginBottom: 12 }}>{equation}</div> : <div style={{ marginBottom: 12 }}>{sceneBox}</div>}
          <div className={`vo-pri${!enExplore ? ' pile' : ''}`}>
            {graphiqueCourbe && <div className="vo-in">{graphiqueCourbe}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(!enGuide || deja('courbe')) && <div className="vo-in">{mesures}</div>}
              {enExplore && reglages}
            </div>
          </div>
          <div className="vo-l2">
            {graphiqueVC && <div className="vo-in">{graphiqueVC}</div>}
            {graphiqueLn && <div className="vo-in">{graphiqueLn}</div>}
            {graphiqueV}
          </div>
        </div>
      </div>
      {enExplore && <div className="vo-l2">{aEssayer}{retenirExplore}</div>}
      {blocPython}
      {!enDefi && (!enGuide || deja('bravo')) && <div className="vo-l2">{panneauHypo}</div>}
    </div>
  );
}
