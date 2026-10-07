import { useState, useEffect, useRef } from "react";
import { cardStyle, fmt, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE } from "../commun";

// ====================================================
// FORMULATION ET SÉCHAGE D'UNE PEINTURE (BTS Métiers de la chimie)
// D'après le sujet de CCF « changement de la résine Vinnapas » : une base blanche mate, que l'on reformule avec la résine
// Orgal PST 50A en gardant le même extrait sec, la même CPV et la même CPVC ; correction du dosage du dispersant ;
// prises d'huile des fiches techniques et prises d'huile mesurées ; TMFF, agent de coalescence et COV.
// ====================================================

const RHO_HUILE = 0.93;   // g/mL, huile de lin
const RESINES = {
  vinnapas: { nom: 'Vinnapas EP 3360', nature: 'copolymère acétate de vinyle – éthylène', es: 60, rhoSec: 1.0, rhoHumide: 1.07, tmff: 2, tg: 10 },
  orgal: { nom: 'Orgal PST 50A', nature: 'copolymère styrène – acrylique', es: 50, rhoSec: 1.03, rhoHumide: 1.03, tmff: 20, tg: 20 },
};
// Prises d'huile (g d'huile pour 100 g de poudre) : annoncées par les fiches techniques, et mesurées sur nos poudres
const POUDRES = {
  tio2: { nom: 'TiO₂', role: 'pigment', rho: 4.1, phFiche: 19, phMesuree: 26 },
  caco3: { nom: 'CaCO₃ léger', role: 'charge', rho: 2.75, phFiche: 18, phMesuree: 49 },
};
// Additifs : extrait sec (%), densité ; le DPnB est un volatil (composé organique volatil)
const ADDITIFS = {
  foamex: { nom: 'Foamex (antimousse)', es: 20, rho: 1.0 },
  coadis: { nom: 'Coadis BR3 (dispersant)', es: 40, rho: 1.22 },
  dpnb: { nom: 'DPnB (agent de coalescence)', es: 0, rho: 0.91, cov: true },
  thixol: { nom: 'Thixol 53L (épaississant pseudoplastique)', es: 30, rho: 1.06 },
  coapur: { nom: 'Coapur 3025 (épaississant newtonien)', es: 25, rho: 1.04 },
};
// Formule de référence (Document 1 du sujet)
export const FORMULE_REF = { resine: 'vinnapas', eau: 105.3, tio2: 54, caco3: 54, liant: 74.7, foamex: 1.35, coadis: 0.18, dpnb: 4.5, thixol: 1.35, coapur: 2.7 };

// ── Les calculs, avec leurs hypothèses (voir l'encadré) ──
export function proprietes(f, { ph = 'mesuree', phPerso = null, efficacite = 3 } = {}) {
  const R = RESINES[f.resine];
  const masses = { eau: f.eau, tio2: f.tio2, caco3: f.caco3, liant: f.liant, ...Object.fromEntries(Object.keys(ADDITIFS).map(k => [k, f[k]])) };
  const mTot = Object.values(masses).reduce((s, m) => s + (m || 0), 0);
  const mSecLiant = f.liant * R.es / 100;
  const mSecAdd = Object.entries(ADDITIFS).reduce((s, [k, a]) => s + (f[k] || 0) * a.es / 100, 0);
  const mSec = f.tio2 + f.caco3 + mSecLiant + mSecAdd;
  const ES = mSec / mTot * 100;
  const vPulv = f.tio2 / POUDRES.tio2.rho + f.caco3 / POUDRES.caco3.rho;
  const vLiantSec = mSecLiant / R.rhoSec;
  const CPV = vPulv / (vPulv + vLiantSec) * 100;
  const phT = phPerso ? phPerso.tio2 : ph === 'fiche' ? POUDRES.tio2.phFiche : POUDRES.tio2.phMesuree;
  const phC = phPerso ? phPerso.caco3 : ph === 'fiche' ? POUDRES.caco3.phFiche : POUDRES.caco3.phMesuree;
  const vHuile = (f.tio2 * phT + f.caco3 * phC) / 100 / RHO_HUILE;
  const CPVC = vPulv / (vPulv + vHuile) * 100;
  const lambda = CPV / CPVC;
  const vTot = f.eau / 1 + f.tio2 / POUDRES.tio2.rho + f.caco3 / POUDRES.caco3.rho + f.liant / R.rhoHumide + Object.entries(ADDITIFS).reduce((s, [k, a]) => s + (f[k] || 0) / a.rho, 0);
  const densite = mTot / vTot;
  const COV = (f.dpnb || 0) / (vTot / 1000);                        // g/L
  const coadisActif = (f.coadis || 0) * ADDITIFS.coadis.es / 100 / ((f.tio2 + f.caco3) || 1) * 100;   // % de matière active / pulvérulents
  const pctCoalescent = mSecLiant > 0 ? (f.dpnb || 0) / mSecLiant * 100 : 0;                         // % de coalescent / polymère sec
  const tmff = R.tmff - efficacite * pctCoalescent;                  // modèle linéaire : hypothèse
  return { mTot, mSec, ES, vPulv, vLiantSec, CPV, CPVC, lambda, vHuile, densite, COV, coadisActif, pctCoalescent, tmff, R, phT, phC };
}
export function aspect(l) {
  if (l < 0.5) return { nom: 'brillant', color: '#0f766e' };
  if (l < 0.8) return { nom: 'satiné', color: '#b45309' };
  if (l <= 1) return { nom: 'mat', color: '#7c2d12' };
  return { nom: 'mat, poreux (liant insuffisant)', color: '#b91c1c' };
}

// ════════════════ ANIMATION DU SÉCHAGE ════════════════
// Trois temps : évaporation de l'eau ; rapprochement et contact des particules ; déformation et coalescence (si T ≥ TMFF)
function AnimationSechage({ progres, T, tmff, lambda }) {
  const W = 560, H = 210, base = 180;
  const filme = T >= tmff;
  const r = rngFixe(5);
  const latex = Array.from({ length: 26 }, (_, k) => ({ x: 30 + (k % 13) * 40 + (k > 12 ? 20 : 0), y0: 40 + r() * 100, y1: base - 14 - (k > 12 ? 24 : 0) }));
  const pig = Array.from({ length: Math.round(6 + 10 * Math.min(1.2, lambda)) }, () => ({ x: 20 + r() * 520, y0: 50 + r() * 100, y1: base - 10 - r() * 34 }));
  const e1 = Math.min(1, progres / 0.45), e2 = Math.max(0, Math.min(1, (progres - 0.45) / 0.3)), e3 = Math.max(0, Math.min(1, (progres - 0.75) / 0.25));
  const niveauEau = 30 + e1 * (base - 30 - 50);
  const poreux = lambda > 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Séchage du film de peinture" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      <rect x="0" y={base} width={W} height={H - base} fill="#cbd5e1"/>
      <text x={W - 10} y={base + 20} fontSize="12" fill={KIT.txt2} textAnchor="end">support</text>
      {e1 < 1 && <rect x="0" y={niveauEau} width={W} height={base - niveauEau} fill="#dbeafe" opacity={0.85 * (1 - e2)}/>}
      {e3 > 0 && filme && <rect x="0" y={base - 48} width={W} height="48" fill="#e2e8f0" opacity={e3 * (poreux ? 0.6 : 0.95)}/>}
      {latex.map((p, k) => {
        const y = p.y0 + (p.y1 - p.y0) * Math.min(1, e1 * 1.1);
        const rx = 15 + (filme ? 6 * e2 : 0), ry = 15 - (filme ? 6 * e2 : 0);
        return <ellipse key={k} cx={p.x} cy={y} rx={rx} ry={ry} fill="#bfdbfe" stroke="#1e3a8a" strokeWidth="1.2" opacity={filme ? 1 - 0.75 * e3 : 1}/>;
      })}
      {pig.map((p, k) => <circle key={k} cx={p.x} cy={p.y0 + (p.y1 - p.y0) * Math.min(1, e1 * 1.1)} r="4.5" fill="#f8fafc" stroke="#475569" strokeWidth="1"/>)}
      {!filme && e2 > 0.6 && [80, 210, 330, 460].map((x, k) => <polyline key={k} points={`${x},${base - 50} ${x + 8},${base - 30} ${x - 4},${base - 15} ${x + 5},${base}`} fill="none" stroke="#b91c1c" strokeWidth="2.5" opacity={(e2 - 0.6) / 0.4}/>)}
      {poreux && e3 > 0.5 && [60, 150, 260, 380, 490].map((x, k) => <circle key={k} cx={x} cy={base - 26} r="5" fill="white" stroke="#b91c1c" strokeDasharray="2 2"/>)}
      <text x="10" y="18" fontSize="13" fontWeight="700" fill={KIT.txt}>
        {progres < 0.45 ? '1. L’eau s’évapore' : progres < 0.75 ? '2. Les particules se touchent' : filme ? '3. Elles se déforment et fusionnent : film continu' : '3. Trop froid (T < TMFF) : elles ne fusionnent pas, le film se fissure'}
      </text>
      <text x={W - 10} y="36" fontSize="12" fill={KIT.txt2} textAnchor="end">T = {fmt(T, 0)} °C ; TMFF = {tmff < 0 ? '< 0' : fmt(tmff, 0)} °C</text>
      <g transform={`translate(10, ${H - 6})`}><circle cx="4" cy="-4" r="4" fill="#bfdbfe" stroke="#1e3a8a"/><text x="12" y="0" fontSize="11" fill={KIT.txt2}>particule de liant (latex)</text>
        <circle cx="170" cy="-4" r="4" fill="#f8fafc" stroke="#475569"/><text x="178" y="0" fontSize="11" fill={KIT.txt2}>pigment ou charge</text></g>
    </svg>
  );
}
function rngFixe(g) { let a = g >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ════════════════ MESURE DE LA PRISE D'HUILE (méthode à la spatule, ISO 787-5) ════════════════
function MesurePriseHuile({ poudre, onResultat }) {
  const P = POUDRES[poudre], mPoudre = 10;
  const [huile, setHuile] = useState(0);
  const [msg, setMsg] = useState(null);
  useEffect(() => { setHuile(0); setMsg(null); }, [poudre]);
  const rapport = huile / mPoudre * 100 / P.phMesuree;
  const etat = rapport < 0.75 ? { t: 'poudre encore sèche', c: '#e5e7eb' } : rapport < 0.96 ? { t: 'grumeaux humides, qui ne se tiennent pas', c: '#fef3c7' }
    : rapport <= 1.04 ? { t: 'pâte lisse et cohérente, qui ne se brise pas', c: '#fde68a' } : { t: 'pâte trop fluide : le point final est dépassé', c: '#fca5a5' };
  function ajouter(m) { setHuile(h => Math.round((h + m) * 100) / 100); setMsg(null); }
  function conclure() {
    if (rapport < 0.96) { setMsg({ ok: false, t: 'Pas encore : la pâte n’est pas cohérente.' }); return; }
    if (rapport > 1.04) { setMsg({ ok: false, t: 'Le point final est dépassé : recommencez, en finissant goutte à goutte.' }); return; }
    const ph = huile / mPoudre * 100; setMsg({ ok: true, t: `Prise d’huile = ${fmt(huile, 2)} g / ${mPoudre} g × 100 = ${fmt(ph, 1)} g pour 100 g.` }); onResultat(ph);
  }
  return (
    <div>
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>{mPoudre} g de {P.nom} sur une plaque de verre ; on ajoute de l'huile de lin et on malaxe à la spatule.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 90, height: 56, borderRadius: '50% 50% 40% 40%', background: etat.c, border: `2px solid ${KIT.txt2}` }}/>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{etat.t}</div><div style={{ fontSize: 13, color: KIT.txt2 }}>huile ajoutée : {fmt(huile, 2)} g</div></div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <button onClick={() => ajouter(1)} style={stylePetitBouton(false)}>+ 1 g</button>
        <button onClick={() => ajouter(0.2)} style={stylePetitBouton(false)}>+ 0,2 g</button>
        <button onClick={() => ajouter(0.03)} style={stylePetitBouton(false)}>💧 1 goutte</button>
        <button onClick={conclure} style={stylePetitBouton(true, ORANGE_GUIDE)}>C'est le point final</button>
        <button onClick={() => { setHuile(0); setMsg(null); }} style={stylePetitBouton(false)}>↺ Recommencer</button>
      </div>
      {msg && <div style={{ fontSize: 13.5, fontWeight: 700, color: msg.ok ? '#15803d' : '#b91c1c', marginTop: 6 }}>{msg.ok ? '✅ ' : '❌ '}{msg.t}</div>}
    </div>
  );
}

function Hypotheses() {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>CPVC estimée par la prise d'huile</strong> : on suppose que le liant se comporte comme l'huile de lin vis-à-vis des pulvérulents. C'est une approximation
        classique ; la vraie CPVC d'une peinture en émulsion est souvent un peu plus basse.</li>
      <li><strong>Volumes additifs</strong> : le volume du film sec est la somme des volumes des pulvérulents et du liant sec ; on néglige le volume sec des additifs.</li>
      <li><strong>Masses volumiques</strong> : celles des pulvérulents sont des masses volumiques <em>vraies</em> (pas apparentes) ; pour les liants secs, on prend 1,0
        (Vinnapas) et 1,03 (Orgal), d'après les documents fournis.</li>
      <li><strong>Seuils de λ</strong> (brillant &lt; 0,5 ; satiné ; mat ≥ 0,8 ; poreux &gt; 1) : indicatifs, ils varient selon les pigments et les liants.</li>
      <li><strong>Agent de coalescence</strong> : le DPnB est compté comme volatil (il quitte le film après sa formation) et comme COV. L'abaissement de la TMFF est
        modélisé comme proportionnel à sa teneur (en % du polymère sec) : c'est une <em>hypothèse</em> ; l'efficacité réelle dépend du couple résine-coalescent
        et se mesure au banc TMFF (ISO 2115).</li>
    </ul>
  );
}

// ════════════════ SIMULATION ════════════════
export function SimulationPeinture() {
  const [mode, setMode] = useState('guide');
  // Trois parcours distincts, chacun avec sa progression mémorisée
  const [parc, setParc] = useEtatPersistant('peinture-parcours-choix', 1);
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [g1, setG1] = useEtatPersistant('peinture-guide-p1', VIDE), [g2, setG2] = useEtatPersistant('peinture-guide-p2', VIDE), [g3, setG3] = useEtatPersistant('peinture-guide-p3', VIDE);
  const guide = parc === 1 ? g1 : parc === 2 ? g2 : g3, setGuide = parc === 1 ? setG1 : parc === 2 ? setG2 : setG3;
  const [f, setF] = useState({ ...FORMULE_REF });
  const [phMode, setPhMode] = useState('mesuree');
  const [mesPH, setMesPH] = useEtatPersistant('peinture-ph-v1', { tio2: null, caco3: null });
  const [poudreMesure, setPoudreMesure] = useState('tio2');
  const [T, setT] = useState(20);
  const [efficacite, setEfficacite] = useState(3);
  const [progres, setProgres] = useState(0), [anime, setAnime] = useState(false);
  const [vuAnimation, setVuAnimation] = useState({});
  const [ouverts, setOuverts] = useState({ formule: true, resultats: true, hypo: true, sechage: true });
  const [defi, setDefi] = useState(null);
  const refA = useRef(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;

  // ── Les valeurs de référence du parcours ──
  const refFiche = proprietes(FORMULE_REF, { ph: 'fiche' }), refMes = proprietes(FORMULE_REF, { ph: 'mesuree' });
  const phEleve = mesPH.tio2 && mesPH.caco3 ? { tio2: mesPH.tio2, caco3: mesPH.caco3 } : null;
  const refEleve = phEleve ? proprietes(FORMULE_REF, { phPerso: phEleve }) : refMes;
  const mSecV = FORMULE_REF.liant * RESINES.vinnapas.es / 100, vSecV = mSecV / RESINES.vinnapas.rhoSec;
  const mOrgal = vSecV * RESINES.orgal.rhoSec / (RESINES.orgal.es / 100);
  const fOrgalSansEau = { ...FORMULE_REF, resine: 'orgal', liant: mOrgal };
  const mSecOrgal = proprietes({ ...fOrgalSansEau, eau: 0 }).mSec;
  const mTotCible = mSecOrgal / (refMes.ES / 100);
  const eauOrgal = mTotCible - (proprietes({ ...fOrgalSansEau, eau: 0 }).mTot);
  const coadisCible = 0.00175 * (FORMULE_REF.tio2 + FORMULE_REF.caco3) / (ADDITIFS.coadis.es / 100);
  const fOrgal = { ...fOrgalSansEau, eau: eauOrgal, coadis: coadisCible };
  const pOrgal = proprietes(fOrgal, { efficacite });

  // ── La formule affichée et ses propriétés ──
  // Ordre des étapes dans les trois parcours (les étapes des parcours précédents sont considérées comme faites)
  const ORDRE = [P1_IDS, P2_IDS, P3_IDS];
  const loc = id => ORDRE[parc - 1].indexOf(id);
  const avant = id => ORDRE.slice(0, parc - 1).some(l => l.includes(id));
  // Dans le parcours 2, la formule Orgal n'apparaît qu'après son calcul, et le Coadis corrigé qu'après le sien
  const fAff = !enGuide ? f : parc === 1 ? FORMULE_REF : parc === 3 ? fOrgal
    : (etape >= loc('cpvcInchangee') ? { ...fOrgal, coadis: etape > loc('coadisNouveau') ? coadisCible : FORMULE_REF.coadis } : FORMULE_REF);
  const phAff = !enGuide ? phMode : parc === 1 && etape < loc('cpvcReelle') ? 'fiche' : 'mesuree';
  const p = proprietes(fAff, { ph: phAff, phPerso: enGuide && phAff === 'mesuree' ? phEleve : null, efficacite });
  const asp = aspect(p.lambda);

  // Animation du séchage (6 s)
  useEffect(() => {
    if (!anime) return;
    const t0 = performance.now();
    const pas = now => { const x = Math.min(1, (now - t0) / 6000); setProgres(x); if (x < 1) refA.current = requestAnimationFrame(pas); else setAnime(false); };
    refA.current = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(refA.current);
  }, [anime]);
  function lancerSechage() { setProgres(0); setAnime(true); setVuAnimation(v => ({ ...v, [`${etape}-${T}-${fmt(p.tmff, 0)}`]: true, [etape]: { T, tmff: p.tmff } })); }

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const TOUTES = [
    { id: 'contexte', titre: 'Changer de résine', focus: [],
      texte: <>Votre laboratoire fabrique une base de peinture blanche <strong>mate</strong> avec la résine Vinnapas EP 3360, qui risque de manquer. Il faut la
        reformuler avec la résine <strong>Orgal PST 50A</strong>, en respectant le même cahier des charges : peinture mate (λ = CPV / CPVC ≥ 0,8), monocouche
        (extrait sec ES &gt; 50 %), et COV &lt; 30 g/L. La formule de référence est dans le cadre « Formule ».</>, tache: null },
    { id: 'roles', titre: 'Le rôle des matières premières', focus: ['formule'],
      texte: <>Chaque matière première a un rôle : solvant (eau), liant (la résine), pigment (TiO₂, qui donne l'opacité et le blanc), charge (CaCO₃), additifs.</>,
      tache: { type: 'qcm', q: 'Quel est le rôle du DPnB ?', options: ['Agent de coalescence : il aide les particules de liant à fusionner pour former un film continu, puis s’évapore', 'Pigment', 'Dispersant : il aide à disperser les poudres'], bonne: 0 } },
    { id: 'es', titre: 'L’extrait sec', focus: ['formule'],
      texte: <>L'extrait sec est la part de la masse qui reste après séchage : les pulvérulents, la partie sèche du liant (60 % pour la Vinnapas) et des additifs.
        Le DPnB, lui, est un volatil : il ne compte pas dans l'extrait sec. (Attention : l'outil tableur le compte à 100 %, ce qui donne 53,3 %.)</>,
      tache: { type: 'num', q: 'Extrait sec de la formule de référence', unite: '%', vrai: refMes.ES, tol: 0.01, affiche: x => fmt(x, 1),
        pieges: [[proprietes({ ...FORMULE_REF, dpnb: 0 }).ES * 0 + (refMes.mSec + FORMULE_REF.dpnb) / refMes.mTot * 100, 'Vous avez compté le DPnB dans l’extrait sec : c’est un volatil.']] } },
    { id: 'cpv', titre: 'La CPV', focus: ['formule'],
      texte: <>La concentration pigmentaire volumique CPV = V(pulvérulents) / [V(pulvérulents) + V(liant sec)]. Les volumes se calculent avec les masses volumiques
        <strong> vraies</strong> : TiO₂ 4,1 ; CaCO₃ 2,75 ; liant sec ≈ 1.</>,
      tache: { type: 'num', q: 'CPV de la formule de référence', unite: '%', vrai: refMes.CPV, tol: 0.01, affiche: x => fmt(x, 1) } },
    { id: 'cpvcFiche', titre: 'La CPVC d’après les fiches techniques', focus: ['formule'],
      texte: <>La CPV critique s'estime avec la prise d'huile : CPVC = V(pulvérulents) / [V(pulvérulents) + V(huile)], avec V(huile) = m × prise d'huile / 100 / 0,93.
        Les fiches techniques annoncent : TiO₂ {POUDRES.tio2.phFiche} g et CaCO₃ {POUDRES.caco3.phFiche} g d'huile pour 100 g.</>,
      tache: { type: 'num', q: 'CPVC d’après les fiches techniques', unite: '%', vrai: refFiche.CPVC, tol: 0.01, affiche: x => fmt(x, 1) } },
    { id: 'prevision', titre: 'L’aspect prévu', focus: ['resultats'],
      texte: <>λ = CPV / CPVC = {fmt(refFiche.lambda, 2)}.</>,
      tache: { type: 'qcm', q: 'D’après les fiches techniques, la peinture devrait être…', options: ['satinée (λ < 0,8), donc non conforme au cahier des charges', 'mate', 'poreuse'], bonne: 0 } },
    { id: 'surprise', titre: 'On fabrique, on applique… elle est mate !', focus: [],
      texte: <>La peinture fabriquée et appliquée est pourtant bien <strong>mate</strong>. La CPV est sûre : elle ne dépend que des masses et des masses volumiques.</>,
      tache: { type: 'qcm', q: 'Que soupçonner ?', options: ['Les prises d’huile réelles de nos poudres sont plus grandes que celles des fiches : la CPVC réelle est plus basse', 'La CPV est fausse', 'L’applicateur s’est trompé'], bonne: 0,
        expl: 'Une fiche technique décrit un produit type, parfois un autre grade ; un lot réel peut être très différent. Il faut le mesurer.' } },
    { id: 'mesureTio2', titre: 'Mesurer la prise d’huile du TiO₂', focus: ['mesure'],
      texte: <>Méthode à la spatule (ISO 787-5) : on ajoute l'huile de lin et on malaxe, jusqu'à obtenir une pâte lisse et cohérente, qui ne se brise pas. Utilisez le
        cadre « Mesure de la prise d'huile » sous le schéma.</>,
      tache: { type: 'action', ok: mesPH.tio2 != null, consigne: mesPH.tio2 != null ? `✅ Prise d’huile du TiO₂ : ${fmt(mesPH.tio2, 1)} g / 100 g` : 'Mesurez la prise d’huile du TiO₂.' } },
    { id: 'mesureCaco3', titre: 'Mesurer la prise d’huile du CaCO₃', focus: ['mesure'],
      texte: <>Même mesure avec le carbonate de calcium (choisissez la poudre dans le cadre).</>,
      tache: { type: 'action', ok: mesPH.caco3 != null, consigne: mesPH.caco3 != null ? `✅ Prise d’huile du CaCO₃ : ${fmt(mesPH.caco3, 1)} g / 100 g` : 'Mesurez la prise d’huile du CaCO₃.' } },
    { id: 'cpvcReelle', titre: 'La vraie CPVC', focus: ['resultats'],
      texte: <>Recalculez la CPVC avec vos prises d'huile mesurées{phEleve ? ` (${fmt(phEleve.tio2, 1)} et ${fmt(phEleve.caco3, 1)} g / 100 g)` : ''}.</>,
      tache: { type: 'num', q: 'CPVC avec les prises d’huile mesurées', unite: '%', vrai: refEleve.CPVC, tol: 0.015, affiche: x => fmt(x, 1) } },
    { id: 'lambdaReel', titre: 'L’aspect réel', focus: ['resultats'],
      texte: <>Avec la vraie CPVC.</>,
      tache: { type: 'num', q: 'λ = CPV / CPVC', unite: '', vrai: refEleve.lambda, tol: 0.02, affiche: x => fmt(x, 2),
        expl: 'λ ≥ 0,8 : la peinture est bien mate, comme constaté. Ce sont les prises d’huile mesurées qu’il faut utiliser.' } },
    { id: 'orgal', titre: 'La masse d’Orgal', focus: ['formule'],
      texte: <>Pour garder la même CPV, il faut le même <strong>volume de liant sec</strong> : la Vinnapas en apporte {fmt(mSecV, 2)} g (60 % de 74,7 g), soit
        {' '}{fmt(vSecV, 2)} mL. L'Orgal est à 50 % d'extrait sec, avec une densité sèche de 1,03.</>,
      tache: { type: 'num', q: 'Masse d’Orgal PST 50A à introduire', unite: 'g', vrai: mOrgal, tol: 0.01, affiche: x => fmt(x, 1),
        pieges: [[mSecV / 0.5, 'C’est le volume de liant sec qu’il faut conserver, pas sa masse : tenez compte de la densité sèche 1,03.'], [74.7 * 60 / 50, 'Même raisonnement : c’est le volume sec qui compte, avec la densité sèche.']] } },
    { id: 'eau', titre: 'L’eau à ajuster', focus: ['formule'],
      texte: <>L'Orgal apporte plus d'eau que la Vinnapas. Pour garder le même extrait sec ({fmt(refMes.ES, 1)} %), la masse totale doit valoir
        m(sèche) / ES, et l'eau ajoutée complète.</>,
      tache: { type: 'num', q: 'Masse d’eau à ajouter dans la nouvelle formule', unite: 'g', vrai: eauOrgal, tol: 0.015, affiche: x => fmt(x, 1) } },
    { id: 'cpvcInchangee', titre: 'Et la CPVC ?', focus: ['resultats'],
      texte: <>La nouvelle formule s'affiche dans le cadre « Formule ».</>,
      tache: { type: 'qcm', q: 'Pourquoi la CPVC ne change-t-elle pas avec la nouvelle résine ?', options: ['Elle ne dépend que des pulvérulents (leurs volumes et leurs prises d’huile)', 'Parce que la résine est la même', 'Elle change'], bonne: 0 } },
    { id: 'coadisDiag', titre: 'Le problème de dispersion', focus: ['formule'],
      texte: <>Les opérateurs voient se former des amas de poudre pendant la dispersion. La fiche du Coadis BR3 recommande 0,15 à 0,20 % de <strong>matière active</strong>
        (son extrait sec : 40 %) rapportée à la masse des pigments. On le rapporte ici aux 108 g de pulvérulents. La formule de référence contient 0,18 g de Coadis.</>,
      tache: { type: 'num', q: 'Teneur actuelle en matière active de Coadis, en % des pulvérulents', unite: '%', vrai: 0.18 * 0.4 / 108 * 100, tol: 0.03, affiche: x => fmt(x, 3),
        pieges: [[0.18 / 108 * 100, 'Seule la matière active compte : 40 % de 0,18 g.']],
        expl: 'C’est 2 à 3 fois moins que le minimum recommandé : les poudres sont mal défloculées, d’où les amas.' } },
    { id: 'coadisNouveau', titre: 'Corriger le dosage', focus: ['formule'],
      texte: <>Visez le milieu de la fourchette, 0,175 % de matière active.</>,
      tache: { type: 'num', q: 'Masse de Coadis BR3 à introduire', unite: 'g', vrai: coadisCible, tol: 0.03, affiche: x => fmt(x, 2) } },
    { id: 'tmff', titre: 'La température minimale de formation de film', focus: ['sechage'],
      texte: <>Un latex ne forme un film continu que si ses particules, une fois l'eau évaporée, se déforment et fusionnent : il faut que la température soit au-dessus
        de la <strong>TMFF</strong>. Vinnapas : TMFF ≈ 2 °C ; Orgal : TMFF ≈ 20 °C. Dans le cadre « Séchage », réglez T = 10 °C, mettez le DPnB à 0 (case « sans
        coalescent ») et lancez le séchage.</>,
      tache: { type: 'qcm', q: 'Avec l’Orgal, sans coalescent, appliqué à 10 °C…', options: ['le film se fissure ou reste poudreux : les particules ne fusionnent pas', 'le film est parfait', 'la peinture devient brillante'], bonne: 0 } },
    { id: 'coalescent', titre: 'Le rôle de l’agent de coalescence', focus: ['sechage'],
      texte: <>Le DPnB ramollit temporairement les particules de liant : il abaisse la TMFF, puis s'évapore lentement. La fiche de la Vinnapas précise qu'elle « n'a besoin
        d'aucun agent de coalescence » (TMFF ≈ 2 °C).</>,
      tache: { type: 'qcm', q: 'Que conclure pour la formule ?', options: ['Avec l’Orgal, le coalescent devient nécessaire ; avec la Vinnapas, il était superflu', 'Le coalescent est inutile dans les deux cas', 'Il faut le remplacer par de l’eau'], bonne: 0,
        expl: 'Le coalescent a un prix : c’est un COV. Il faut en mettre assez pour former le film à la température d’application la plus basse prévue, mais pas plus.' } },
    { id: 'cov', titre: 'Les COV', focus: ['resultats'],
      texte: <>La teneur en COV est la masse de composés organiques volatils par litre de peinture. Ici, seul le DPnB est un COV. La densité de la peinture vaut environ
        {' '}{fmt(pOrgal.densite, 2)}, et sa masse totale {fmt(pOrgal.mTot, 1)} g.</>,
      tache: { type: 'num', q: 'Teneur en COV de la nouvelle formule', unite: 'g/L', vrai: pOrgal.COV, tol: 0.04, affiche: x => fmt(x, 0),
        pieges: [[4.5 / pOrgal.mTot * 1000, 'C’est par litre, et non par kilogramme : divisez par le volume (masse / densité).']] } },
    { id: 'hypotheses', titre: 'Les hypothèses du modèle', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Laquelle de ces affirmations est une hypothèse du calcul de la CPVC ?', options: ['Le liant se comporte comme l’huile de lin vis-à-vis des poudres', 'La CPVC est mesurée directement', 'Les additifs sont des pigments'], bonne: 0,
        expl: 'D’où l’importance de vérifier l’aspect sur la peinture réelle : le calcul n’est qu’une prévision.' } },
    { id: 'bravo1', titre: 'Bravo !', focus: [],
      texte: <>Vous savez prévoir l'aspect d'une peinture, et vous savez qu'une fiche technique ne remplace pas une mesure sur les matières premières réellement
        utilisées. Parcours suivant : « Changer de résine ».</>, tache: null },
    { id: 'intro2', titre: 'Changer de résine', focus: ['formule'],
      texte: <>La base de référence (résine Vinnapas EP 3360) est mate : ES = {fmt(refMes.ES, 1)} %, CPV = {fmt(refMes.CPV, 1)} %, CPVC = {fmt(refMes.CPVC, 1)} % avec les prises
        d'huile mesurées. Il faut la reformuler avec l'<strong>Orgal PST 50A</strong>, en gardant le même extrait sec, la même CPV et la même CPVC. On en profite
        pour corriger un défaut de dispersion signalé par les opérateurs.</>, tache: null },
    { id: 'bravo2', titre: 'Bravo !', focus: [],
      texte: <>La nouvelle formule a le même extrait sec, la même CPV et la même CPVC que la référence, et un dispersant correctement dosé. Parcours suivant :
        « Former le film », pour vérifier qu'elle séchera correctement.</>, tache: null },
    { id: 'intro3', titre: 'Former le film', focus: ['sechage'],
      texte: <>La nouvelle base est formulée avec l'Orgal PST 50A. Reste à vérifier qu'une fois appliquée, elle formera bien un film continu, et qu'elle respecte
        la limite de COV (&lt; 30 g/L).</>, tache: null },
    { id: 'bravo3', titre: 'Bravo !', focus: [],
      texte: <>Vous avez relié la TMFF de la résine, le rôle de l'agent de coalescence et la teneur en COV. En exploration libre, modifiez librement la formule ;
        le défi vous demande de respecter tout le cahier des charges.</>, tache: null },
  ];
  const ETAPES = ORDRE[parc - 1].map(id => TOUTES.find(e => e.id === id));
  const idx = loc;
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vu = id => !enGuide || avant(id) || (loc(id) >= 0 && etape >= loc(id));
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3 } : {});

  // ── Le séchage : formule affichée, éventuellement sans coalescent ──
  const [sansCoalescent, setSansCoalescent] = useState(false);
  const pSech = proprietes({ ...fAff, dpnb: sansCoalescent ? 0 : fAff.dpnb }, { efficacite });

  // ════════════════ BLOCS ════════════════
  const cell = { padding: '3px 6px', border: `1px solid ${KIT.bord}`, fontSize: 13.5, textAlign: 'center' };
  const editable = !enGuide;
  const champ = (k, dec = 2) => editable
    ? <input type="number" step="0.1" value={f[k]} aria-label={`Masse ${k}`} onChange={e => { const x = lireNombre(e.target.value); setF(o => ({ ...o, [k]: isFinite(x) && x >= 0 ? x : 0 })); }}
      style={{ width: 80, fontSize: 13.5, padding: '2px 5px', border: `1.5px solid ${KIT.bord}`, borderRadius: 5 }}/>
    : fmt(fAff[k], dec);
  const blocFormule = (
    <div style={{ ...styleBoite, ...cadre('formule') }}>
      <Section titre={`Formule (${fmt(p.mTot, 1)} g)`} ouvert={ouverts.formule} onBascule={() => setOuverts(o => ({ ...o, formule: !o.formule }))}>
        {editable && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Résine :</span>
          {Object.entries(RESINES).map(([k, r]) => <button key={k} onClick={() => setF(o => ({ ...o, resine: k }))} style={stylePetitBouton(f.resine === k, '#0f766e')}>{r.nom}</button>)}
          <button onClick={() => setF({ ...FORMULE_REF })} style={stylePetitBouton(false)}>↺ formule de référence</button>
          <button onClick={() => setF({ ...fOrgal })} style={stylePetitBouton(false)}>formule Orgal corrigée</button>
        </div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
            <thead><tr><th style={cell}>Matière première</th><th style={cell}>Rôle</th><th style={cell}>Données</th><th style={cell}>Masse (g)</th></tr></thead>
            <tbody>
              <tr><td style={cell}>Eau</td><td style={cell}>solvant</td><td style={cell}>—</td><td style={cell}>{champ('eau', 1)}</td></tr>
              {['tio2', 'caco3'].map(k => <tr key={k}><td style={cell}>{POUDRES[k].nom}</td><td style={cell}>{POUDRES[k].role}</td>
                <td style={cell}>ρ = {fmt(POUDRES[k].rho, 2)} ; prise d'huile : fiche {POUDRES[k].phFiche}{vu('mesureCaco3') ? `, mesurée ${POUDRES[k].phMesuree}` : ''}</td><td style={cell}>{champ(k, 1)}</td></tr>)}
              <tr><td style={cell}>{p.R.nom}</td><td style={cell}>liant</td><td style={cell}>ES {p.R.es} % ; ρ sec {fmt(p.R.rhoSec, 2)} ; TMFF {p.R.tmff} °C</td><td style={cell}>{champ('liant', 1)}</td></tr>
              {Object.entries(ADDITIFS).map(([k, a]) => <tr key={k}><td style={cell}>{a.nom}</td><td style={cell}>additif</td><td style={cell}>{a.cov ? 'volatil (COV)' : `ES ${a.es} %`} ; ρ {fmt(a.rho, 2)}</td><td style={cell}>{champ(k, 2)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
  const montre = id => !enGuide || avant(id) || (loc(id) >= 0 && etape > loc(id));
  const resultats = (
    <div style={{ ...styleBoite, ...cadre('resultats') }}>
      <Section titre="Propriétés calculées" ouvert={ouverts.resultats} onBascule={() => setOuverts(o => ({ ...o, resultats: !o.resultats }))}>
        {editable && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Prises d'huile :</span>
          <button onClick={() => setPhMode('fiche')} style={stylePetitBouton(phMode === 'fiche', '#334155')}>fiches techniques</button>
          <button onClick={() => setPhMode('mesuree')} style={stylePetitBouton(phMode === 'mesuree', '#334155')}>mesurées sur nos poudres</button>
        </div>}
        <LigneMesure nom="Extrait sec ES" valeur={montre('es') ? `${fmt(p.ES, 1)} %` : '?'} couleur={p.ES > 50 ? '#15803d' : '#b91c1c'}/>
        <LigneMesure nom="CPV" valeur={montre('cpv') ? `${fmt(p.CPV, 1)} %` : '?'}/>
        <LigneMesure nom={`CPVC (prises d'huile ${phAff === 'fiche' ? 'des fiches' : 'mesurées'} : ${fmt(p.phT, 0)} et ${fmt(p.phC, 0)})`} valeur={montre(phAff === 'fiche' ? 'cpvcFiche' : 'cpvcReelle') ? `${fmt(p.CPVC, 1)} %` : '?'}/>
        <LigneMesure nom="λ = CPV / CPVC" valeur={montre(phAff === 'fiche' ? 'cpvcFiche' : 'lambdaReel') ? `${fmt(p.lambda, 2)} : ${asp.nom}` : '?'} couleur={asp.color}/>
        <LigneMesure nom="Dispersant : matière active / pulvérulents" valeur={montre('coadisDiag') ? `${fmt(p.coadisActif, 3)} % (recommandé : 0,15 à 0,20 %)` : '?'} couleur={p.coadisActif >= 0.15 && p.coadisActif <= 0.2 ? '#15803d' : '#b91c1c'}/>
        <LigneMesure nom="Densité de la peinture" valeur={fmt(p.densite, 2)}/>
        <LigneMesure nom="COV" valeur={montre('cov') ? `${fmt(p.COV, 0)} g/L` : '?'} couleur={p.COV < 30 ? '#15803d' : '#b91c1c'}/>
      </Section>
    </div>
  );
  const blocMesure = (enGuide ? parc === 1 && vu('mesureTio2') && etape <= idx('cpvcReelle') : true) && (
    <div style={{ ...styleBoite, ...cadre('mesure') }} data-apparait={`${idx('mesureTio2')}`}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mesure de la prise d'huile</div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        {Object.entries(POUDRES).map(([k, q]) => <button key={k} onClick={() => setPoudreMesure(k)} style={stylePetitBouton(poudreMesure === k, '#334155')}>{q.nom}</button>)}
      </div>
      <MesurePriseHuile poudre={poudreMesure} onResultat={ph => setMesPH(m => ({ ...m, [poudreMesure]: Math.round(ph * 10) / 10 }))}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>Résultats : TiO₂ {mesPH.tio2 != null ? fmt(mesPH.tio2, 1) : '—'} ; CaCO₃ {mesPH.caco3 != null ? fmt(mesPH.caco3, 1) : '—'} g d'huile pour 100 g (fiches : {POUDRES.tio2.phFiche} et {POUDRES.caco3.phFiche}).</div>
    </div>
  );
  const blocSechage = vu('tmff') && (
    <div style={{ ...styleBoite, ...cadre('sechage') }} data-apparait={`${idx('tmff')}`}>
      <Section titre="Séchage du film" ouvert={ouverts.sechage} onBascule={() => setOuverts(o => ({ ...o, sechage: !o.sechage }))}>
        <AnimationSechage progres={progres} T={T} tmff={pSech.tmff} lambda={pSech.lambda}/>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <button onClick={lancerSechage} style={styleBouton(true, '#2563eb')}>▶ Lancer le séchage</button>
          <label style={{ display: 'flex', gap: 6, fontSize: 14, color: KIT.txt }}><input type="checkbox" checked={sansCoalescent} onChange={e => setSansCoalescent(e.target.checked)}/> sans coalescent (DPnB = 0)</label>
        </div>
        <Curseur nom="Température de séchage T" valeur={T} onChange={setT} min={0} max={30} pas={1} unite="°C" couleur="#0f766e"/>
        <LigneMesure nom={`TMFF de la résine (${pSech.R.nom})`} valeur={`${pSech.R.tmff} °C`}/>
        <LigneMesure nom="Coalescent / polymère sec" valeur={`${fmt(pSech.pctCoalescent, 1)} %`}/>
        <LigneMesure nom="TMFF estimée de la peinture" valeur={pSech.tmff < 0 ? 'inférieure à 0 °C' : `${fmt(pSech.tmff, 0)} °C`} couleur={T >= pSech.tmff ? '#15803d' : '#b91c1c'}/>
        {!enGuide && <Curseur nom="Hypothèse : abaissement de la TMFF par % de coalescent" valeur={efficacite} onChange={setEfficacite} min={0.5} max={5} pas={0.5} unite="°C" decimales={1} couleur="#7c3aed"/>}
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>L'abaissement de la TMFF par le coalescent est une hypothèse de modèle ({fmt(efficacite, 1)} °C par % du polymère sec) : on la vérifie au banc TMFF.</div>
      </Section>
    </div>
  );
  const blocHypo = (vu('hypotheses') || (enGuide && parc === 3)) && (
    <div style={{ ...styleBoite, ...cadre('hypo') }} data-apparait={`${idx('hypotheses')}`}>
      <Section titre="Hypothèses de travail" ouvert={ouverts.hypo} onBascule={() => setOuverts(o => ({ ...o, hypo: !o.hypo }))}><Hypotheses/></Section>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() { setDefi({ tApp: [5, 8, 10, 12][Math.floor(Math.random() * 4)] }); setF({ ...FORMULE_REF, resine: 'orgal', liant: 80 }); setPhMode('mesuree'); }
  const voletDefi = defi && (() => {
    const q = proprietes(f, { ph: 'mesuree', efficacite });
    const C = [
      { ok: f.resine === 'orgal', t: 'Résine Orgal PST 50A' },
      { ok: q.lambda >= 0.8 && q.lambda <= 1, t: `Mate, sans être poreuse : 0,8 ≤ λ ≤ 1 (λ = ${fmt(q.lambda, 2)})` },
      { ok: q.ES > 50, t: `Monocouche : ES > 50 % (ES = ${fmt(q.ES, 1)} %)` },
      { ok: q.COV < 30, t: `COV < 30 g/L (${fmt(q.COV, 0)} g/L)` },
      { ok: q.coadisActif >= 0.15 && q.coadisActif <= 0.2, t: `Dispersant : 0,15 à 0,20 % de matière active (${fmt(q.coadisActif, 3)} %)` },
      { ok: q.tmff <= defi.tApp, t: `Film formé à ${defi.tApp} °C, la température d'application la plus basse prévue (TMFF estimée : ${q.tmff < 0 ? '< 0' : fmt(q.tmff, 0)} °C)` },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>Formulez une base blanche avec l'<strong>Orgal PST 50A</strong>, qui respecte tout le cahier des charges, pour une application jusqu'à
          <strong> {defi.tApp} °C</strong>. Bonus : utilisez le moins de coalescent possible (COV minimal). Modifiez les masses dans le cadre « Formule ».</div>
        {C.map((c, k) => <div key={k} style={{ fontSize: 14, color: KIT.txt }}>{c.ok ? '✅' : '❌'} {c.t}</div>)}
        {C.every(c => c.ok) && <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>Cahier des charges respecté ! Pouvez-vous encore réduire le DPnB ?</div>}
        <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Une autre température d'application</button>
      </div>
    );
  })();

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi') nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pe-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pe-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .pe-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Formulation et séchage d'une peinture</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {enGuide && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Parcours :</span>
        {[[1, '1. Prévoir l’aspect'], [2, '2. Changer de résine'], [3, '3. Former le film']].map(([k, n]) =>
          <button key={k} onClick={() => setParc(k)} style={styleBouton(parc === k, ORANGE_GUIDE)}>{n}{[g1, g2, g3][k - 1].etape > 0 ? ` (étape ${[g1, g2, g3][k - 1].etape + 1})` : ''}</button>)}
      </div>}
      <div className="pe-l1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{blocFormule}{blocMesure}</div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? <div style={styleBoite}>{voletDefi}</div> : resultats}
      </div>
      <div className="pe-l2">
        {(enGuide || enDefi) && resultats}
        {blocSechage}
        {blocHypo}
      </div>
    </div>
  );
}

// Les trois parcours
const P1_IDS = ['contexte', 'roles', 'es', 'cpv', 'cpvcFiche', 'prevision', 'surprise', 'mesureTio2', 'mesureCaco3', 'cpvcReelle', 'lambdaReel', 'hypotheses', 'bravo1'];
const P2_IDS = ['intro2', 'orgal', 'eau', 'cpvcInchangee', 'coadisDiag', 'coadisNouveau', 'bravo2'];
const P3_IDS = ['intro3', 'tmff', 'coalescent', 'cov', 'bravo3'];
