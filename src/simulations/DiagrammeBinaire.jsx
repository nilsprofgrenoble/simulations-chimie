import { useSignalerMode } from "../suivi";
import { useState, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { MELANGES, Teb, Tros, yEq, equilibreA, wDe } from "./distillationModele";
import { Diagramme, Pastilles, nf, pct, NB, Xi, XiS } from "./Distillation";

// ====================================================
//  SIM 42 — DIAGRAMME BINAIRE ISOBARE : domaines, courbes d'ébullition et de rosée, azéotrope
// ====================================================

const X0 = () => <>x<sub>A,0</sub></>;
const nomPhase = { L: 'liquide homogène', V: 'vapeur homogène', LV: 'liquide + vapeur' };

// Cylindre à piston mobile : la pression reste égale à la pression atmosphérique, c'est le VOLUME qui change.
// Le nombre total de molécules dessinées est constant (NTOT) : seule leur répartition entre liquide et vapeur change.
const NTOT = 24;
function Recipient({ m, e, z, anim }) {
  const nA = Math.round(NTOT * z);
  let nV = e.phase === 'L' ? 0 : e.phase === 'V' ? NTOT : Math.min(NTOT - 1, Math.max(1, Math.round(e.phi * NTOT)));
  let nAV = 0;
  if (nV > 0) nAV = e.phase === 'V' ? nA : Math.min(nA, nV, Math.max(nA - (NTOT - nV), 0, Math.round(nV * e.yV)));
  const nL = NTOT - nV, nAL = nA - nAV;
  const hLiq = nL > 0 ? 10 + 4.4 * nL : 0, hGaz = 20 + 7 * nV;
  const yL = 230 - hLiq, yP = 230 - hLiq - hGaz;
  const xLiq = nL > 0 ? e.xL : null, yVap = nV > 0 ? e.yV : null;
  return (
    <svg viewBox="0 0 330 322" style={{ width: '100%', maxWidth: 360, display: 'block', margin: '0 auto' }} role="img" aria-label="Cylindre à piston mobile contenant le mélange liquide et vapeur, à pression constante">
      <defs><marker id="rf-p" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L5,10 L10,0 z" fill="#475569"/></marker></defs>
      <rect x="41" y="44" width="168" height="186" fill="white"/>
      {hLiq > 0 && <rect x="41.5" y={yL} width="167" height={hLiq - 1.5} fill="rgba(147,197,253,0.35)"/>}
      {nL > 0 && <Pastilles x={46} y={yL + 5} w={158} h={Math.max(14, hLiq - 12)} comp={nAL / nL} n={nL} graine={2} anim={anim} cA={m.coulA} cB={m.coulB} r={4}/>}
      {nV > 0 && <Pastilles x={46} y={yP + 4} w={158} h={Math.max(14, hGaz - 8)} comp={nAV / nV} n={nV} graine={5} anim={anim} cA={m.coulA} cB={m.coulB} r={4}/>}
      <path d="M40 30 L40 230 L210 230 L210 30" fill="none" stroke="#475569" strokeWidth="2.5"/>
      {e.phase === 'LV' && <line x1="40" x2="210" y1={yL} y2={yL} stroke="#64748b" strokeDasharray="4 3"/>}
      {/* piston mobile et pression atmosphérique */}
      <rect x="41" y={yP - 10} width="168" height="10" fill="#94a3b8" stroke="#475569" strokeWidth="1.5"/>
      <line x1="125" x2="125" y1={yP - 10} y2="10" stroke="#475569" strokeWidth="3"/>
      <rect x="105" y="2" width="40" height="12" fill="#cbd5e1" stroke="#475569"/>
      <text x="125" y="-0.5" textAnchor="middle" fontSize="0"> </text>
      <text x="225" y={yP - 2} fontSize="11" fill="#334155">piston mobile</text>
      <text x="225" y="12" fontSize="11" fontWeight="700" fill="#0f172a">P = P<tspan fontSize="8.5" dy="3">atm</tspan><tspan dy="-3"> (constante)</tspan></text>
      {xLiq != null && <g><text x="222" y={Math.min(224, yL + hLiq / 2 - 4)} fontSize="12.5" fontWeight="700" fill="#1d4ed8">liquide</text>
        <text x="222" y={Math.min(224, yL + hLiq / 2 + 12)} fontSize="12" fill="#0f172a">x<XiS e="L" suffix={`${NB}=${NB}${nf(xLiq)}`}/></text></g>}
      {yVap != null && <g><text x="222" y={yP + 26} fontSize="12.5" fontWeight="700" fill="#b91c1c">vapeur</text>
        <text x="222" y={yP + 42} fontSize="12" fill="#0f172a">x<XiS e="V" suffix={`${NB}=${NB}${nf(yVap)}`}/></text></g>}
      <text x="125" y="250" textAnchor="middle" fontSize="12" fill="#334155">{e.phase === 'LV' ? 'mélange : ' : 'mélange : '}x<tspan fontSize="8.5" dy="3">A,0</tspan><tspan dy="-3">{` = ${nf(z)}`}</tspan> · {NTOT} molécules</text>
      <text x="125" y="268" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">{nomPhase[e.phase]}</text>
      <text x="125" y="286" textAnchor="middle" fontSize="10.5" fill="#64748b">volumes pas à l’échelle (vapeur ≈ 1 000 × liquide)</text>
      <g transform="translate(70 296)"><circle cx="6" cy="6" r="4" fill={m.coulA} stroke="#0f172a" strokeWidth="0.5"/><text x="16" y="10" fontSize="11" fill="#0f172a">{m.A}</text>
        <circle cx="106" cy="6" r="4" fill={m.coulB} stroke="#0f172a" strokeWidth="0.5"/><text x="116" y="10" fontSize="11" fill="#0f172a">{m.B}</text></g>
    </svg>
  );
}

// Courbe d'analyse thermique : T en fonction de la proportion de mélange vaporisé
function Analyse({ m, z, T, e }) {
  const W = 330, H = 210, L = 44, R = 12, Tp = 24, Bt = 36, w = W - L - R, h = H - Tp - Bt;
  const Tb = e.Tb, Td = e.Td, TA = Teb(m, 1);
  const lo = Math.floor((Math.min(Tb, TA) - 5) / 5) * 5, hi = Math.ceil((Math.max(Td, TA) + 5) / 5) * 5;
  const px = u => L + u * w, py = t => Tp + (hi - t) / (hi - lo) * h;
  const pts = [];
  for (let k = 0; k <= 60; k++) { const t = Tb + (Td - Tb) * k / 60, q = equilibreA(m, z, t); pts.push([q.phi, t]); }
  const ph = e.phase === 'LV' ? e.phi : (e.phase === 'V' ? 1 : 0);
  const ts = []; for (let t = lo; t <= hi; t += (hi - lo > 40 ? 10 : 5)) ts.push(t);
  const constant = e.constant;
  return (
    <div style={{ ...styleBoite, padding: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Analyse thermique : T pendant la vaporisation</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Température en fonction de la proportion vaporisée">
        <rect x={L} y={Tp} width={w} height={h} fill="white" stroke="#94a3b8"/>
        {ts.map(t => <g key={t}><line x1={L} x2={L + w} y1={py(t)} y2={py(t)} stroke="#eef2f7"/><text x={L - 5} y={py(t) + 4} textAnchor="end" fontSize="10.5" fill="#334155">{t}</text></g>)}
        {[0, 0.5, 1].map(u => <text key={u} x={px(u)} y={Tp + h + 13} textAnchor="middle" fontSize="10.5" fill="#334155">{pct(u)}</text>)}
        <text x={L + w / 2} y={H - 5} textAnchor="middle" fontSize="11" fill="#0f172a">proportion vaporisée (% de la quantité de matière)</text>
        <line x1={px(0)} x2={px(1)} y1={py(TA)} y2={py(TA)} stroke="#64748b" strokeWidth="2" strokeDasharray="5 3"/>
        <text x={px(0.02)} y={py(TA) - 5} fontSize="10.5" fill="#475569">{m.A} pur : T constante ({nf(TA, 1)}{NB}°C)</text>
        {constant ? <line x1={px(0)} x2={px(1)} y1={py(Tb)} y2={py(Tb)} stroke="#7c3aed" strokeWidth="2.6"/>
          : <polyline fill="none" stroke="#7c3aed" strokeWidth="2.6" points={pts.map(([u, t]) => `${px(u).toFixed(1)},${py(t).toFixed(1)}`).join(' ')}/>}
        <text x={px(0.5)} y={Tp + 12} textAnchor="middle" fontSize="10.5" fill="#6d28d9" fontWeight="700">{constant ? 'azéotrope : comme un corps pur' : 'mélange : T qui monte'}</text>
        <circle cx={px(ph)} cy={py(Math.min(hi, Math.max(lo, T)))} r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

export function SimulationDiagramme({ naviguer }) {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('diagramme-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [mel, setMel] = useState('ew');
  const [z, setZ] = useState(0.2);
  const [T, setT] = useState(75);
  const [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } });
  const m = MELANGES[mel];
  const enGuide = mode === 'guide';
  const Tlo = Math.floor(Math.min(...m.T) - 4), Thi = Math.ceil(Math.max(...m.T) + 4);
  const e = equilibreA(m, z, T);
  const lien = e.phase === 'LV' ? { xL: e.xL, yV: e.yV, T } : null;
  const regler = (k, zz, tt) => { setMel(k); setZ(zz); setT(tt); };

  const G = useMemo(() => {
    const ew = MELANGES.ew, z0 = 0.2, e0 = equilibreA(ew, z0, 87);
    return { z0, Tb: Teb(ew, z0), Td: Tros(ew, z0), xL: e0.xL, yV: e0.yV, wV: wDe(ew, e0.yV), Taz: ew.az[1], zaz: ew.az[0] };
  }, []);
  const etape = guide.etape;
  const ici = (k, zz, tt) => mel === k && Math.abs(z - zz) < 1e-9 && Math.abs(T - tt) < 0.05;
  const ETAPES = [
    { id: 'pur', titre: 'Corps pur ou mélange ?', focus: ['analyse'],
      texte: <>Le graphique « Analyse thermique » montre la température d’un liquide qui bout. En pointillés : l’éthanol <strong>pur</strong>, dont la température reste constante pendant toute l’ébullition. En violet : un <strong>mélange</strong> d’eau et d’éthanol, dont la température change.</>,
      tache: { type: 'qcm', q: 'Comment reconnaît-on un mélange d’un corps pur pendant l’ébullition ?', options: ['La température du mélange augmente pendant que le liquide bout', 'La température du mélange est constante, comme celle d’un corps pur', 'Le mélange ne bout pas'], bonne: 0,
        expl: 'Un corps pur bout à température constante. Un mélange bout sur un intervalle de température : la première bulle apparaît à la température d’ébullition, la dernière goutte disparaît à la température de rosée.' } },
    { id: 'regler', titre: 'Régler le mélange', focus: ['reglages'],
      texte: <>Un mélange eau – éthanol avec <strong>20 % de molécules d’éthanol</strong> (<X0/> = 0,20), à 75 °C et sous 1,013 bar. L’abscisse du diagramme est la fraction molaire du composé le plus volatil : ici l’éthanol.</>,
      tache: { type: 'action', ok: ici('ew', 0.2, 75), label: <>Régler <X0/> = 0,20 et T = 75 °C</>, faire: () => regler('ew', 0.2, 75), consigne: ici('ew', 0.2, 75) ? null : 'Cliquez pour régler le mélange' } },
    { id: 'domaine1', titre: 'Dans quel domaine ?', focus: ['diagramme', 'recipient'],
      texte: <>Le losange orange est le point (composition globale <X0/> ; température T). Les deux courbes séparent trois domaines : <strong>liquide</strong> en bas, <strong>vapeur</strong> en haut, <strong>liquide + vapeur</strong> entre les deux courbes.</>,
      tache: { type: 'qcm', q: 'À 75 °C, le mélange est…', options: ['un liquide homogène (en dessous de la courbe d’ébullition)', 'un mélange de liquide et de vapeur', 'une vapeur homogène'], bonne: 0,
        expl: 'Le point est sous la courbe d’ébullition : tout est liquide. Dans le récipient, il n’y a qu’une phase, de composition 0,20.' } },
    { id: 'ebullition', titre: 'La première bulle', focus: ['diagramme'],
      texte: <>Augmentez la température avec le curseur : à partir de quelle température apparaît la première bulle de vapeur ? C’est la température où le point touche la <strong style={{ color: '#2563eb' }}>courbe d’ébullition</strong> (bleue).</>,
      tache: { type: 'num', q: 'Température d’ébullition commençante du mélange', unite: '°C', vrai: G.Tb, tol: 0.015, affiche: x => nf(x, 1),
        bloque: mel === 'ew' && Math.abs(z - 0.2) < 1e-9 ? null : 'Réglez d’abord le mélange (étape 2).',
        pieges: [[78.4, 'C’est l’éthanol pur. Le mélange contient 80 % d’eau : il commence à bouillir plus haut.'], [100, 'C’est l’eau pure : le mélange commence à bouillir plus bas.']],
        expl: 'Environ 83 °C : entre les températures d’ébullition de l’éthanol (78 °C) et de l’eau (100 °C), plus près de l’éthanol qui est volatil.' } },
    { id: 'regler2', titre: 'Dans le fuseau', focus: ['reglages'],
      texte: <>Réglez maintenant la température à <strong>87 °C</strong> : le point est entre les deux courbes.</>,
      tache: { type: 'action', ok: ici('ew', 0.2, 87), label: 'Régler T = 87 °C', faire: () => regler('ew', 0.2, 87), consigne: ici('ew', 0.2, 87) ? null : 'Réglez T = 87 °C (curseur ou bouton)' } },
    { id: 'deux', titre: 'Deux phases en équilibre', focus: ['recipient', 'diagramme'],
      texte: <>À 87 °C, deux phases coexistent : le liquide et la vapeur sont à <strong>la même température</strong>, mais <strong>n’ont pas la même composition</strong>. On lit la composition de chacune <strong>à l’horizontale</strong> : sur la courbe d’ébullition pour le liquide (point bleu), sur la courbe de rosée pour la vapeur (point rouge).</>,
      tache: { type: 'num', q: <>Fraction molaire <Xi e="L"/> en éthanol du liquide</>, unite: '', vrai: G.xL, tol: 0.12, affiche: x => nf(x), cs: 3,
        bloque: ici('ew', 0.2, 87) ? null : 'Réglez d’abord T = 87 °C.',
        expl: 'x ≈ 0,093 : le liquide est devenu plus pauvre en éthanol que le mélange initial (0,20), parce que la vapeur a emporté de l’éthanol.' } },
    { id: 'vapeur', titre: 'La composition de la vapeur', focus: ['diagramme'],
      texte: <>Lisez maintenant la composition de la <strong>vapeur</strong> en équilibre, sur la courbe de rosée (rouge), à la même température.</>,
      tache: { type: 'num', q: <>Fraction molaire <Xi e="V"/> en éthanol de la vapeur</>, unite: '', vrai: G.yV, tol: 0.08, affiche: x => nf(x), cs: 3,
        bloque: ici('ew', 0.2, 87) ? null : 'Réglez d’abord T = 87 °C.',
        expl: 'y ≈ 0,43 : la vapeur est beaucoup plus riche en éthanol que le liquide (0,093). C’est le principe de la distillation.' } },
    { id: 'riche', titre: 'Liquide ou vapeur ?', focus: ['recipient'],
      texte: <>Comparez x (liquide) et y (vapeur) sur le diagramme et sur les points du récipient.</>,
      tache: { type: 'qcm', q: 'La phase la plus riche en composé volatil (l’éthanol) est…', options: ['la vapeur', 'le liquide', 'aucune : les deux ont la même composition'], bonne: 0,
        expl: 'La vapeur est toujours enrichie en composé volatil par rapport au liquide avec lequel elle est en équilibre (sauf à l’azéotrope).' } },
    { id: 'massique', titre: 'Fraction massique de la vapeur', focus: [],
      texte: <>Le diagramme donne des fractions <strong>molaires</strong>. Convertissez <Xi e="V"/> en fraction <strong>massique</strong> w<sub>A</sub>, avec M<sub>A</sub> = 46 g·mol⁻¹ (éthanol) et M<sub>B</sub> = 18 g·mol⁻¹ (eau) :
        <div style={{ textAlign: 'center', fontSize: 16, margin: '8px 0 0' }}>w<sub>A</sub> = <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}><span style={{ borderBottom: '1.5px solid #0f172a', padding: '0 4px' }}>y<sub>A</sub> × M<sub>A</sub></span><span style={{ padding: '0 4px' }}>y<sub>A</sub> × M<sub>A</sub> + (1 − y<sub>A</sub>) × M<sub>B</sub></span></span></div></>,
      tache: { type: 'num', q: <>Fraction massique w<sub>A</sub> de la vapeur (<Xi e="V"/> = 0,428)</>, unite: '', vrai: G.wV, tol: 0.03, affiche: x => nf(x), cs: 3,
        indice: 'Numérateur : 0,428 × 46 ≈ 19,7. Dénominateur : 19,7 + 0,572 × 18.',
        pieges: [[0.428, 'C’est la fraction molaire. L’éthanol est plus lourd que l’eau : sa fraction massique est plus grande.']],
        expl: 'w ≈ 0,66 : dans 100 g de vapeur, environ 66 g d’éthanol, alors que seulement 43 molécules sur 100 sont de l’éthanol.' } },
    { id: 'rosee', titre: 'La dernière goutte', focus: ['diagramme'],
      texte: <>Montez encore la température jusqu’à ce que le point sorte du fuseau par le haut : il n’y a plus de liquide, seulement de la vapeur de composition 0,20. C’est la <strong>température de rosée</strong> (courbe rouge).</>,
      tache: { type: 'num', q: 'Température à laquelle disparaît la dernière goutte de liquide', unite: '°C', vrai: G.Td, tol: 0.015, affiche: x => nf(x, 1),
        pieges: [[G.Tb, 'C’est la température de la première bulle. On cherche celle de la dernière goutte (courbe de rosée).']],
        expl: 'Environ 94 °C : l’ébullition de ce mélange s’étale entre 83 et 94 °C, alors qu’un corps pur bout à température constante.' } },
    { id: 'azeo', titre: 'Un mélange particulier : l’azéotrope', focus: ['reglages', 'diagramme', 'analyse'],
      texte: <>Réglez <X0/> = 0,90 : les deux courbes se touchent. Pour cette composition, le mélange <strong>bout à température constante</strong> et la vapeur a <strong>la même composition que le liquide</strong> : on dit qu’il se comporte comme un corps pur, c’est un <strong>azéotrope</strong>. Regardez aussi l’analyse thermique.</>,
      tache: { type: 'action', ok: mel === 'ew' && Math.abs(z - 0.9) < 1e-9, label: <>Régler <X0/> = 0,90</>, faire: () => regler('ew', 0.9, 78.2), consigne: mel === 'ew' && Math.abs(z - 0.9) < 1e-9 ? null : 'Réglez z = 0,90' } },
    { id: 'taz', titre: 'La température de l’azéotrope', focus: ['diagramme'],
      texte: <>Lisez la température à laquelle bout l’azéotrope eau – éthanol. Elle est plus basse que celle des deux corps purs.</>,
      tache: { type: 'num', q: 'Température d’ébullition de l’azéotrope', unite: '°C', vrai: G.Taz, tol: 0.01, affiche: x => nf(x, 1),
        bloque: mel === 'ew' && Math.abs(z - 0.9) < 1e-9 ? null : <>Réglez d’abord <X0/> = 0,90.</>,
        expl: 'Environ 78,2 °C, avec 90 % de molécules d’éthanol : c’est un azéotrope à minimum de température. On ne peut pas séparer ce mélange par distillation au-delà de cette composition.' } },
    { id: 'max', titre: 'Un azéotrope à maximum', focus: ['reglages', 'diagramme'],
      texte: <>Passez au mélange <strong>chloroforme – acétone</strong>. Ici, la courbe a un maximum : l’azéotrope bout à une température <em>plus haute</em> que les deux corps purs.</>,
      tache: { type: 'action', ok: mel === 'ca', label: 'Changer de mélange', faire: () => regler('ca', 0.2, 63), consigne: mel === 'ca' ? null : 'Choisissez chloroforme – acétone' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>courbe d’ébullition : 1ʳᵉ bulle ; courbe de rosée : dernière goutte</li>
        <li>deux courbes → trois domaines : liquide, liquide + vapeur, vapeur</li>
        <li>à l’horizontale, liquide et vapeur ont la même T mais pas la même composition</li>
        <li>la vapeur est plus riche en composé volatil</li>
        <li>azéotrope : T constante, <Xi e="V"/> = <Xi e="L"/>, comme un corps pur (minimum ou maximum)</li></ul>,
      texte: <>Vous savez lire un diagramme binaire isobare : domaines, températures d’ébullition et de rosée, composition du liquide et de la vapeur, azéotrope. La simulation suivante utilise ce diagramme pour comprendre la distillation.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    const k = tire(['ew', 'bt', 'ca']), mm = MELANGES[k];
    let zz, Tt, q;
    for (let essai = 0; essai < 200; essai++) {
      zz = tire([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
      if (mm.az && Math.abs(zz - mm.az[0]) < 0.1) continue;
      const a = Teb(mm, zz), b = Tros(mm, zz);
      if (b - a < 1.5) continue;
      Tt = Math.round((a + (b - a) * tire([0.3, 0.5, 0.7])) * 2) / 2;
      q = equilibreA(mm, zz, Tt); if (q.phase === 'LV') break;
    }
    setDefi({ k, z: zz, T: Tt, reps: {}, verifie: false });
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi();
    if (md === 'guide') regler('ew', 0.2, 75);
  }
  const voletDefi = defi && (() => {
    const mm = MELANGES[defi.k], q = equilibreA(mm, defi.z, defi.T);
    const Q = [
      { id: 'q1', q: <>Température d’ébullition commençante du mélange</>, unite: '°C', vrai: q.Tb, tol: 0.015, aff: nf(q.Tb, 1) },
      { id: 'q2', q: <>Température de rosée du mélange (disparition de la dernière goutte)</>, unite: '°C', vrai: q.Td, tol: 0.015, aff: nf(q.Td, 1) },
      { id: 'q3', q: <>À {nf(defi.T, 1)}{NB}°C : fraction molaire <Xi e="L"/> du <strong>liquide</strong></>, unite: '', vrai: q.xL, tol: 0.12, aff: nf(q.xL) },
      { id: 'q4', q: <>À {nf(defi.T, 1)}{NB}°C : fraction molaire <Xi e="V"/> de la <strong>vapeur</strong></>, unite: '', vrai: q.yV, tol: 0.08, aff: nf(q.yV) },
      { id: 'q5', q: <>À {nf(defi.T, 1)}{NB}°C : fraction <strong>massique</strong> w<sub>A</sub> de la vapeur (M<sub>A</sub> = {mm.MA} g·mol⁻¹, M<sub>B</sub> = {mm.MB} g·mol⁻¹)</>, unite: '', vrai: wDe(mm, q.yV), tol: 0.06, aff: nf(wDe(mm, q.yV)) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          Un mélange <strong>{mm.nom}</strong> de composition globale <strong><X0/>{NB}={NB}{nf(defi.z, 2)}</strong> en {mm.A} (composé A, le plus volatil) est chauffé sous 1,013 bar jusqu’à <strong>{nf(defi.T, 1)}{NB}°C</strong>. Le losange orange indique le mélange. Répondez avec 3 chiffres significatifs.
        </div>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {qu.q}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={ev => { const v = ev.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 120 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff}{qu.unite ? NB + qu.unite : ''}</div>}
            </div>);
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
        </div>
      </div>);
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Diagramme isobare</strong> : pression constante de 1,013 bar. À une autre pression, les courbes se déplacent (en particulier, les températures baissent sous pression réduite).</li>
      <li><strong>Mélange binaire</strong> : deux constituants seulement, sans autre espèce dissoute.</li>
      <li><strong>Équilibre liquide-vapeur atteint</strong> : on suppose le chauffage assez lent pour que les deux phases soient en équilibre, à la même température. C’est ce qui permet de lire x et y sur la même horizontale.</li>
      <li><strong>Pression constante, volume variable</strong> : le mélange est dans un cylindre fermé par un piston mobile, qui garde la pression égale à la pression atmosphérique. Quand le liquide se vaporise, c’est le <em>volume</em> qui augmente (une mole de vapeur occupe environ 1 000 fois le volume d’une mole de liquide). Le nombre total de molécules ne change pas (24 dessinées) : seule leur répartition liquide / vapeur varie. Le schéma n’est pas à l’échelle.</li>
      <li><strong>Mélange homogène</strong> : chaque phase a une composition uniforme.</li>
      <li><strong>Fractions molaires</strong> : l’axe horizontal donne x (liquide) ou y (vapeur), fractions <em>molaires</em> du composé le plus volatil. La fraction massique w se calcule ensuite avec les masses molaires.</li>
      <li><strong>Modèle thermodynamique</strong> : les courbes sont celles d’un modèle ajusté sur des mesures (précision environ 1 °C et 0,01 en composition) ; chloroforme – acétone est plus approximatif. Une lecture sur un graphique papier est moins précise que les valeurs du modèle.</li>
      <li><strong>Proportion vaporisée</strong> : calculée avec la règle des moments (hors programme) ; elle ne sert qu’à placer le point sur l’analyse thermique et à dessiner les niveaux dans le récipient.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
      {naviguer && <button onClick={() => naviguer(41)} style={styleBouton(false, '#0f766e')}>🧪 Distillation</button>}
    </span>);

  const dMel = defi ? MELANGES[defi.k] : null;
  const eD = defi ? equilibreA(dMel, defi.z, defi.T) : null;
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {Object.values(MELANGES).map(o => <button key={o.id} disabled={enGuide && mel !== o.id && ETAPES[Math.min(etape, ETAPES.length - 1)].id !== 'max'}
          onClick={() => regler(o.id, Math.min(0.99, Math.max(0.01, o.x0 < 0.1 ? 0.2 : o.x0)), Math.round((Teb(o, o.x0 < 0.1 ? 0.2 : o.x0) - 3) * 2) / 2)}
          style={stylePetitBouton(mel === o.id, '#0891b2')}>{o.nom}</button>)}
      </div>
      <Curseur nom={<><X0/> : composition globale ({m.A})</>} valeur={z} onChange={v => setZ(Math.round(v * 100) / 100)} min={0} max={1} pas={0.01} decimales={2} couleur="#0891b2"/>
      <Curseur nom="T : température" valeur={T} onChange={setT} min={Tlo} max={Thi} pas={0.1} unite="°C" decimales={1} couleur="#ea580c"/>
      <label style={{ fontSize: 12.5, color: KIT.txt2, display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={anim} onChange={ev => setAnim(ev.target.checked)}/> animer</label>
    </div>);
  const mesures = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Lectures</div>
      <LigneMesure nom="domaine" valeur={nomPhase[e.phase]}/>
      <LigneMesure nom="T_ébullition commençante" valeur={`${nf(e.Tb, 1)}${NB}°C`} couleur="#1d4ed8"/>
      <LigneMesure nom="T_rosée" valeur={`${nf(e.Td, 1)}${NB}°C`} couleur="#b91c1c"/>
      {e.xL != null && <LigneMesure nom={<><Xi e="L"/> (liquide)</>} valeur={nf(e.xL)} couleur="#1d4ed8"/>}
      {e.yV != null && <LigneMesure nom={<><Xi e="V"/> (vapeur)</>} valeur={nf(e.yV)} couleur="#b91c1c"/>}
      {e.xL != null && <LigneMesure nom="w_A (liquide)" valeur={nf(wDe(m, e.xL))}/>}
      {e.yV != null && <LigneMesure nom="w_A (vapeur)" valeur={nf(wDe(m, e.yV))}/>}
      {e.phase === 'LV' && !e.constant && <LigneMesure nom="proportion vaporisée" valeur={`${pct(e.phi)}${NB}%`}/>}
      {e.constant && <div style={{ fontSize: 12.5, color: '#6d28d9', marginTop: 4 }}>Azéotrope : ébullition à température constante, <Xi e="V"/> = <Xi e="L"/>.</div>}
    </div>);

  const diag = mode === 'defi' && defi ? (
    <div style={styleBoite}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Diagramme isobare {dMel.nom} (1,013 bar)</div>
      <Diagramme m={dMel} pt={{ xB: defi.z }} N={0} escalierVisible={false} pointZ={{ x: defi.z, T: defi.T }}/>
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('diagramme') }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Diagramme isobare {m.nom} (1,013 bar)</div>
      <Diagramme m={m} pt={{ xB: z }} N={0} escalierVisible={false} pointZ={{ x: z, T }} lien={lien}/>
      <div style={{ fontSize: 12, color: KIT.txt2 }}>Losange orange : le mélange (<X0/> ; T). Segment violet : liquide et vapeur à la même température.</div>
    </div>);

  void eD;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .db-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .db-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .db-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .db-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr); }
        .db-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .db-l1.cote, .db-pri { grid-template-columns: minmax(0, 1fr); } }
        @keyframes dist-ja { 0%,100% { transform: translate(0,0); } 50% { transform: translate(2px,-3px); } }
        @keyframes dist-jb { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-2px,2px); } }
        .dist-a { animation: dist-ja 1.3s ease-in-out infinite; }
        .dist-b { animation: dist-jb 1.7s ease-in-out infinite; }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Diagramme binaire isobare</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>À une température donnée, le liquide et la vapeur d’un mélange ne contiennent pas les mêmes proportions de chaque composé : le diagramme permet de lire ces deux compositions (fractions <strong>molaires</strong> x et y).</div>
      <div className={`db-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {mode === 'defi' && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}</div>}
          {mode !== 'defi' ? (
            <div className={`db-pri${mode !== 'explore' ? ' pile' : ''}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ ...styleBoite, ...cadre('recipient') }}><Recipient m={m} e={e} z={z} anim={anim}/></div>
                {mesures}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{diag}{reglages}</div>
            </div>
          ) : diag}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? panneauHypo : null}
      </div>
      {mode !== 'defi' && (
        <div className="db-l2">
          <div style={{ ...cadre('analyse'), maxWidth: 460 }}><Analyse m={m} z={z} T={T} e={e}/></div>
          {mode === 'explore' && panneauHypo}
        </div>
      )}
      {mode === 'explore' && (
        <div className="db-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Montez T lentement pour <X0/> = 0,20 : à quelles températures apparaissent la première bulle et la dernière goutte ?</li>
              <li>À T fixée dans le fuseau, comparez x (liquide) et y (vapeur). Quelle phase est la plus riche en composé volatil ?</li>
              <li>Augmentez <X0/> : comment évoluent les températures d’ébullition et de rosée ? Que valent-elles pour <X0/> = 0 et <X0/> = 1 ?</li>
              <li>Eau – éthanol : réglez <X0/> = 0,90 (azéotrope). Que deviennent le fuseau et l’analyse thermique ?</li>
              <li>Comparez les deux types d’azéotrope : eau – éthanol (minimum) et chloroforme – acétone (maximum).</li>
              <li>Comparez w et x pour la vapeur : pourquoi diffèrent-ils ?</li>
            </ul>
          </div>
          <ARetenir>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>courbe d’ébullition : 1ʳᵉ bulle ; courbe de rosée : dernière goutte</li>
              <li>liquide et vapeur à la même T, mais x ≠ y ; la vapeur est plus riche en composé volatil</li>
              <li>un mélange bout sur un intervalle de température, un corps pur ou un azéotrope à T constante</li>
            </ul>
          </ARetenir>
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
