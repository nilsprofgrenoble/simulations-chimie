import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, proche } from "../commun";
import { Fiole } from "./solutionsVue";
import { fr, SOLUTES, soluteDe, concentration, massePeser, dissolution, teinte } from "./solutionsModele";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 61 — DISSOLUTION ET CONCENTRATION EN MASSE (2GT, « Constitution et transformations de la matière »)
//  Soluté / solvant / solution ; t = m / V ; calcul de la masse à peser ; protocole de la fiole jaugée ; saturation.
//  Hypothèses : le volume de la solution est celui de la fiole ; dissolution complète jusqu'à la solubilité à 20 °C ;
//  masse pesée exacte ; le nombre de points dessinés n'est pas proportionnel au nombre réel de particules (il y en a des milliards de milliards).
// ====================================================

const SIM = 61;
declarerDefis(SIM, [
  ['masse', 'Calculer la masse à peser'],
  ['conc', 'Calculer une concentration'],
  ['sature', 'Tout se dissout-il ?'],
]);
const TITRES = { masse: 'Masse à peser', conc: 'Concentration en masse', sature: 'Saturation' };
const VERT = '#15803d', ORANGE = '#b45309';
const alea = l => l[Math.floor(Math.random() * l.length)];
const VOLUMES = [50, 100, 200, 250, 500];
const DEFAUT = { sol: 'KMnO4', V: 250, m: 0.1 };

function Dissolution({ P }) {
  const s = soluteDe(P.sol), d = dissolution(P.m, P.V, s.sol), t = d.t;
  const pts = P.m <= 0 ? 0 : Math.round(60 + 160 * Math.pow(d.dissous / d.max, 0.3));
  return (
    <svg viewBox="0 0 560 300" width="100%" role="img" aria-label={`Fiole de ${P.V} mL contenant ${fr(P.m, 2)} g de ${s.nom}`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <Fiole cx={122} niveau={1} couleur={s.couleur} alpha={teinte(s.id === 'KMnO4' ? t : t / 40)} pts={pts} solide={d.sature ? Math.min(1, 0.3 + d.solide / d.max) : 0} volume={P.V} id="d" pale couleurPts={s.point}/>
      <g fontSize="14" fill="#0f172a">
        <text x="248" y="36" fontWeight="800">Soluté : {s.court}</text><text x="248" y="54" fontSize="12.5" fill={KIT.txt2}>{s.nom}</text>
        <text x="248" y="76">Solvant : eau</text>
        <text x="248" y="96">Solution : {s.court} dans l’eau</text>
        <line x1="248" y1="108" x2="540" y2="108" stroke={KIT.bord} strokeWidth="1.5"/>
        <text x="248" y="128">masse dissoute m = <tspan fontWeight="800">{fr(d.dissous, 2)} g</tspan></text>
        <text x="248" y="152">volume V = <tspan fontWeight="800">{P.V} mL</tspan> = {fr(P.V / 1000, 3)} L</text>
        <text x="248" y="184" fontSize="14.5" fontWeight="800" fill="#0f766e">t = m / V = {fr(d.dissous, 2)} / {fr(P.V / 1000, 3)} = {fr(t, t < 1 ? 2 : 1)} g/L</text>
        <text x="248" y="212" fontSize="13" fill={KIT.txt2}>Solubilité à 20 °C : environ {s.sol} g/L</text>
        <text x="248" y="232" fontSize="13" fill={KIT.txt2}>→ au plus {fr(d.max, 1)} g dissous dans {P.V} mL</text>
        {d.sature && <text x="248" y="262" fontSize="13.5" fontWeight="800" fill={ORANGE}>⚠ Saturée : {fr(d.solide, 1)} g restent solides</text>}
        {!d.sature && P.m > 0 && <text x="248" y="262" fontSize="14" fontWeight="700" fill={VERT}>✓ Tout le solide est dissous</text>}
      </g>
      <text x="548" y="292" textAnchor="end" fontSize="10.5" fill="#64748b">le nombre de points n’est pas à l’échelle</text>
    </svg>);
}

// ---------- protocole : fiole jaugée, étape par étape ----------
const PROTO = [
  { n: 1, txt: 'Peser le soluté dans une capsule', pq: 'On pèse la masse calculée avec la balance.' },
  { n: 2, txt: 'Introduire le soluté dans la fiole (avec un entonnoir)', pq: 'Tout le solide doit passer dans la fiole.' },
  { n: 3, txt: 'Rincer la capsule et l’entonnoir avec de l’eau distillée, puis remplir la fiole à moitié environ', pq: 'Le rinçage récupère les dernières traces de soluté. On ne remplit qu’à moitié : on garde la place d’agiter et de faire ensuite l’ajustement exact du volume.' },
  { n: 4, txt: 'Agiter doucement en cercles (sans bouchon) pour dissoudre', pq: 'Le solide se dissout : il est réparti dans tout le liquide.' },
  { n: 5, txt: 'Ajuster au trait de jauge avec la pissette puis la pipette plastique (œil en face, bas du ménisque sur le trait)', pq: 'Le volume de la solution vaut maintenant exactement le volume de la fiole : c’est le V de la formule t = m / V.' },
  { n: 6, txt: 'Boucher puis retourner la fiole plusieurs fois', pq: 'La solution devient homogène : sa concentration est la même partout.' },
];
const ORDRE_BOUTONS = [4, 1, 6, 3, 5, 2];
function Protocole({ P, proto, setProto }) {
  const s = soluteDe(P.sol), n = proto.n, d = dissolution(P.m, P.V, s.sol), t = d.t;
  const clic = k => {
    if (k === n + 1) setProto({ n: k, msg: { ok: true, t: PROTO[k - 1].pq }, err: proto.err });
    else if (k <= n) setProto(p => ({ ...p, msg: { ok: false, t: 'Cette étape est déjà faite.' } }));
    else setProto(p => ({ ...p, err: p.err + 1, msg: { ok: false, t: 'Pas encore ! Quelle étape doit-on avoir faite avant celle-ci ?' } }));
  };
  const niveau = n >= 5 ? 1 : n >= 3 ? 0.5 : 0, dissous = n >= 4;
  return (
    <div>
      <svg viewBox="0 0 560 300" width="100%" role="img" aria-label="Fiole jaugée et balance" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
        <Fiole cx={122} niveau={niveau} couleur={s.couleur} alpha={teinte(s.id === 'KMnO4' ? t : t / 40)} pts={dissous ? Math.round(60 + 160 * Math.pow(d.dissous / d.max, 0.3)) : 0} solide={n >= 2 && !dissous ? 0.6 : 0} bouchon={n >= 6} volume={P.V} id="p" pale couleurPts={s.point}/>
        <g>
          <rect x="340" y="226" width="170" height="44" rx="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5"/>
          <rect x="356" y="236" width="76" height="22" rx="3" fill="#0f172a"/>
          <text x="394" y="253" textAnchor="middle" fontSize="14" fontWeight="800" fill="#4ade80">{n === 1 ? `${fr(P.m, 2)} g` : '0,00 g'}</text>
          <rect x="408" y="206" width="70" height="14" rx="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2"/>
          {n === 1 && <path d="M 428 206 Q 443 186 458 206 Z" fill={s.couleur || '#94a3b8'} stroke="#0f172a" strokeWidth="1"/>}
          <text x="425" y="290" textAnchor="middle" fontSize="12" fill={KIT.txt2}>balance et capsule</text>
        </g>
        <text x="548" y="24" textAnchor="end" fontSize="13" fontWeight="700" fill="#334155">Étape {n} / 6</text>
      </svg>
      <div style={{ fontSize: 13.5, fontWeight: 700, margin: '8px 0 4px', color: KIT.txt }}>Cliquez sur la <em>prochaine</em> étape du protocole :</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ORDRE_BOUTONS.map(k => { const fait = k <= n; return <button key={k} onClick={() => clic(k)} style={{ ...stylePetitBouton(false, '#0f766e'), textAlign: 'left', background: fait ? '#dcfce7' : 'white', borderColor: fait ? '#16a34a' : KIT.bord, fontWeight: 600 }}>{fait ? '✅ ' : ''}{PROTO[k - 1].txt}</button>; })}
      </div>
      {proto.msg && <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: proto.msg.ok ? VERT : '#b91c1c', lineHeight: 1.5 }}>{proto.msg.ok ? '✅ ' : '❌ '}{proto.msg.t}</div>}
      {n === 6 && <div style={{ marginTop: 6, fontSize: 14, color: VERT, fontWeight: 700 }}>🎉 Solution prête : {fr(t, 2)} g/L ({P.V} mL).</div>}
      <button onClick={() => setProto({ n: 0, msg: null, err: 0 })} style={{ ...styleBouton(false), marginTop: 6 }}>🔄 Recommencer</button>
    </div>);
}

// ---------- défis ----------
function nouveauDefi(type, prec) {
  const sol = alea(SOLUTES.map(s => s.id)), V = alea(VOLUMES);
  const tl = { KMnO4: [0.2, 0.4, 0.5, 1, 2], CuSO4: [5, 10, 20, 40], NaCl: [5, 9, 20, 50] }[sol], t = alea(tl), s = soluteDe(sol);
  const base = { type, sol, V, t, reps: {}, verifie: false, solution: false };
  if (type === 'masse') return { ...base, m: massePeser(t, V) };
  if (type === 'conc') return { ...base, m: massePeser(t, V) };
  const max = s.sol * V / 1000, f = alea([0.4, 0.6, 1.5, 1.8]), m = Math.round(max * f * 10) / 10;
  void prec;
  return { ...base, m, max };
}
function evaluer(d) {
  if (d.type === 'masse') { const x = lireNombre(d.reps.v), ok = isFinite(x) && proche(x, d.m, 0.02); return { ok, lignes: [[ok, ok ? 'Masse correcte.' : 'Revois : m = t × V, avec V en litres (mL ÷ 1000).']] }; }
  if (d.type === 'conc') { const x = lireNombre(d.reps.v), ok = isFinite(x) && proche(x, d.t, 0.02); return { ok, lignes: [[ok, ok ? 'Concentration correcte.' : 'Revois : t = m / V, avec V en litres (mL ÷ 1000).']] }; }
  const sat = d.m > d.max, o1 = d.reps.sat === sat; let o2 = true;
  const lignes = [[o1, o1 ? 'Bonne réponse sur la saturation.' : sat ? 'La masse dépasse ce que l’eau peut dissoudre : la solution sera saturée.' : 'La masse reste sous la limite : tout se dissout.']];
  if (sat) { const x = lireNombre(d.reps.v); o2 = isFinite(x) && proche(x, d.m - d.max, 0.04); lignes.push([o2, o2 ? 'Masse de solide restant correcte.' : `Revois : solide restant = masse introduite − masse maximale dissoute.`]); }
  return { ok: o1 && o2, lignes };
}
function VoletDefi({ defi, setDefi, changerType }) {
  const res = defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok, s = soluteDe(defi.sol);
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const champ = (u) => <label style={{ fontSize: 14, fontWeight: 600 }}>Réponse : <input value={defi.reps.v || ''} onChange={e => rep('v', e.target.value)} inputMode="decimal" aria-label="Votre réponse" style={{ width: 90, padding: '5px 8px', fontSize: 15, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> {u}</label>;
  const sat = defi.type === 'sature' && defi.m > defi.max;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'masse' && <><div style={txt}>🎯 On veut préparer <strong>{defi.V} mL</strong> d’une solution de {s.nom} ({s.court}) de concentration en masse <strong>{fr(defi.t, defi.t < 1 ? 2 : 0)} g/L</strong>. Quelle masse de soluté faut-il peser ?</div>{champ('g')}</>}
      {defi.type === 'conc' && <><div style={txt}>🎯 On dissout <strong>{fr(defi.m, 2)} g</strong> de {s.nom} ({s.court}) dans de l’eau, pour obtenir <strong>{defi.V} mL</strong> de solution. Quelle est sa concentration en masse ?</div>{champ('g/L')}</>}
      {defi.type === 'sature' && <><div style={txt}>🎯 On introduit <strong>{fr(defi.m, 1)} g</strong> de {s.nom} ({s.court}) dans une fiole de <strong>{defi.V} mL</strong> d’eau. Solubilité à 20 °C : environ <strong>{s.sol} g/L</strong>.</div>
        <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>Tout le solide se dissout-il ?</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>{[[false, 'Oui, tout se dissout'], [true, 'Non, il reste du solide']].map(([v, l]) => <button key={String(v)} onClick={() => rep('sat', v)} style={stylePetitBouton(defi.reps.sat === v, '#0ea5e9')}>{l}</button>)}</div>
        {defi.reps.sat === true && champ('g de solide restant')}</>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'masse' && <>m = t × V = {fr(defi.t, defi.t < 1 ? 2 : 0)} × {fr(defi.V / 1000, 3)} = <strong>{fr(defi.m, 3)} g</strong>.</>}
        {defi.type === 'conc' && <>t = m / V = {fr(defi.m, 2)} / {fr(defi.V / 1000, 3)} = <strong>{fr(defi.t, defi.t < 1 ? 2 : 0)} g/L</strong>.</>}
        {defi.type === 'sature' && <>Masse maximale dissoute : {s.sol} × {fr(defi.V / 1000, 3)} = {fr(defi.max, 1)} g. {sat ? <>Comme {fr(defi.m, 1)} g {'>'} {fr(defi.max, 1)} g, il reste <strong>{fr(defi.m - defi.max, 1)} g</strong> de solide.</> : <>Comme {fr(defi.m, 1)} g {'<'} {fr(defi.max, 1)} g, tout se dissout.</>}</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationDissolution() {
  const [mode, setMode] = useState(() => modeOuverture('dissolution-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('dissolution-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [P, setP] = useState(DEFAUT);
  const [atelier, setAtelier] = useState('dissolution');
  const [proto, setProto] = useState({ n: 0, msg: null, err: 0 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const s = soluteDe(P.sol);
  const Pdefi = enDefi && defi.type === 'sature' && defi.verifie ? { sol: defi.sol, V: defi.V, m: defi.m } : null;

  const voir = (params, at = 'dissolution') => { setP({ ...DEFAUT, ...params }); setAtelier(at); setProto({ n: 0, msg: null, err: 0 }); };
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const tC = concentration(P.m, P.V);
  const ETAPES = [
    { id: 'vocab', titre: 'Soluté, solvant, solution', depart: () => voir({ sol: 'KMnO4', V: 250, m: 0.1 }),
      texte: <>Le permanganate de potassium KMnO₄ est un <strong>solide violet</strong>. Quand on le met dans l’eau, il se <strong>dissout</strong> : l’eau devient violette.
        <ExempleResolu>L’<strong>eau</strong> est le <strong>solvant</strong> (le liquide dans lequel on dissout). Le <strong>permanganate</strong> est le <strong>soluté</strong> (ce qui est dissous). Le mélange obtenu est une <strong>solution</strong> (ici, une solution <em>aqueuse</em> car le solvant est l’eau).
          {bouton('Voir la fiole', () => voir({ sol: 'KMnO4', V: 250, m: 0.1 }))}</ExempleResolu>
        À vous : on dissout du sucre dans de l’eau.</>,
      tache: { type: 'qcm', q: 'Dans une eau sucrée, quel est le soluté ?', options: ['le sucre', 'l’eau', 'l’eau sucrée', 'il n’y en a pas'], bonne: 0, expl: 'Le soluté est ce qui est dissous : le sucre. L’eau est le solvant, l’eau sucrée est la solution.' } },
    { id: 'conc', titre: 'La concentration en masse', depart: () => voir({ sol: 'NaCl', V: 500, m: 2 }),
      texte: <>Une solution plus ou moins « chargée » en soluté se décrit par sa <strong>concentration en masse</strong> <em>t</em> : la masse de soluté dissous dans <strong>1 litre</strong> de solution.
        <ExempleResolu><strong>t = m / V</strong> (m en g, V en L, t en g/L). On dissout 2 g de sel dans une solution de 500 mL = 0,500 L : t = 2 / 0,500 = <strong>4 g/L</strong>. Attention : on convertit les mL en L (÷ 1000).
          {bouton('Voir la fiole', () => voir({ sol: 'NaCl', V: 500, m: 2 }))}</ExempleResolu>
        À vous : on dissout 0,60 g de sulfate de cuivre dans une solution de 200 mL.</>,
      tache: { type: 'num', q: 'Quelle est la concentration en masse de cette solution ?', unite: 'g/L', vrai: 3, tol: 0.02, affiche: x => String(x), pieges: [[0.003, 'Pense à convertir 200 mL en litres : 200 mL = 0,200 L.'], [0.12, 'Pour t on divise la masse par le volume (t = m / V), on ne multiplie pas.']], expl: 't = 0,60 / 0,200 = 3,0 g/L.' } },
    { id: 'masse', titre: 'Quelle masse faut-il peser ?', depart: () => voir({ sol: 'NaCl', V: 200, m: 1 }),
      texte: <>En pratique, on connaît la concentration voulue et le volume : il faut trouver la <strong>masse à peser</strong>. On inverse la formule : <strong>m = t × V</strong>. On peut aussi raisonner en phrases avec un produit en croix.
        <ExempleResolu>On veut 200 mL de solution de sel à 5 g/L. « 1 L contient 5 g, donc 0,200 L contient 5 × 0,200 = <strong>1,0 g</strong>. » (m = t × V = 5 × 0,200 = 1,0 g)
          {bouton('Voir la fiole', () => voir({ sol: 'NaCl', V: 200, m: 1 }))}</ExempleResolu>
        À vous : la solution (S) du TP, de permanganate de potassium à 0,40 g/L, en fiole de 250 mL.</>,
      tache: { type: 'num', q: 'Quelle masse de KMnO₄ faut-il peser pour préparer 250 mL de solution à 0,40 g/L ?', unite: 'g', vrai: 0.1, tol: 0.03, affiche: x => String(x), pieges: [[100, 'Tu as multiplié 0,40 par 250 sans convertir : 250 mL = 0,250 L.'], [1.6, 'Pour m on multiplie t par V (0,40 × 0,250), on ne divise pas.']], expl: 'm = t × V = 0,40 × 0,250 = 0,10 g.' } },
    { id: 'regler', titre: 'Essayez avec la fiole', depart: () => voir({ sol: 'KMnO4', V: 250, m: 0.5 }),
      texte: <>Réglez la masse pour obtenir exactement la solution du TP. Observez la <strong>couleur</strong> : plus la solution est concentrée, plus elle est foncée.</>,
      tache: { type: 'action', ok: enGuide && P.sol === 'KMnO4' && P.V === 250 && Math.abs(tC - 0.4) < 0.005, consigne: 'Choisissez KMnO₄, fiole de 250 mL, et réglez la masse pour obtenir t = 0,40 g/L.' } },
    { id: 'protocole', titre: 'Le protocole de la fiole jaugée', depart: () => voir({ sol: 'KMnO4', V: 250, m: 0.1 }, 'protocole'),
      texte: <>Pour que la formule <em>t = m / V</em> soit juste, le volume de la solution doit être <strong>exactement</strong> celui de la fiole. D’où un protocole précis. Réalisez-le dans l’ordre : en cas d’erreur, le message vous aide.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'protocole' && proto.n === 6, consigne: 'Cliquez sur les 6 étapes dans le bon ordre.' } },
    { id: 'pourquoi', titre: 'Pourquoi remplir à moitié ?', depart: null,
      texte: <>Dans le protocole, on remplit la fiole <strong>à moitié environ</strong>, on agite, puis on ajuste au trait.</>,
      tache: { type: 'qcm', q: 'Pourquoi ne remplit-on pas tout de suite jusqu’au trait de jauge ?', options: ['Pour pouvoir agiter, puis ajuster le volume exactement au trait avec la pissette', 'Pour économiser l’eau distillée', 'Parce que le solide ne se dissout qu’à moitié', 'Parce qu’il faut laisser du solide au fond'], bonne: 0, expl: 'Une fiole pleine ne peut plus être agitée sans déborder. On dissout d’abord, puis on complète au trait : le volume est alors exactement celui de la fiole.' } },
    { id: 'saturation', titre: '★ Peut-on tout dissoudre ?', depart: () => voir({ sol: 'NaCl', V: 100, m: 50 }),
      texte: <>On ne peut pas dissoudre n’importe quelle masse : l’eau a une <strong>limite</strong>. Au-delà, le soluté ne se dissout plus et reste <strong>solide</strong> au fond : la solution est <strong>saturée</strong>. Cette limite, la <strong>solubilité</strong>, dépend du soluté (environ 360 g/L pour le sel à 20 °C).
        <ExempleResolu>Dans 100 mL d’eau, au plus 360 × 0,100 = <strong>36 g</strong> de sel se dissolvent. Avec 50 g, il en reste 14 g sous forme solide.
          {bouton('Voir la fiole', () => voir({ sol: 'NaCl', V: 100, m: 50 }))}</ExempleResolu></>,
      tache: { type: 'qcm', q: 'On introduit 20 g de sel dans 100 mL d’eau (limite : 36 g). Que se passe-t-il ?', options: ['Tout se dissout : la solution n’est pas saturée', 'Il reste 20 g de sel solide', 'La solution est saturée', 'Le sel ne se dissout pas du tout'], bonne: 0, expl: '20 g < 36 g : tout se dissout, la solution n’est pas saturée.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Soluté (dissous) + solvant (dissolvant) = <strong>solution</strong>.</li>
        <li><strong>t = m / V</strong> : g/L = g ÷ L. On convertit les mL en L.</li>
        <li>Masse à peser : <strong>m = t × V</strong>.</li>
        <li>Fiole jaugée : on ajuste au trait pour que V soit exact. Au-delà de la solubilité, la solution est saturée.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type, prec) { setDefi(nouveauDefi(type, prec)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'masse', null); }

  const maxM = Math.round(s.sol * P.V / 1000 * 1.6 * 100) / 100, pasM = maxM > 30 ? 0.5 : maxM > 3 ? 0.05 : 0.01;
  const controles = (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Soluté :</span>
        {SOLUTES.map(x => <button key={x.id} onClick={() => setP(p => ({ ...p, sol: x.id, m: Math.min(p.m, Math.round(x.sol * p.V / 1000 * 1.6 * 100) / 100) }))} style={stylePetitBouton(P.sol === x.id, '#0f766e')}>{x.court}</button>)}
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginLeft: 8 }}>Fiole :</span>
        {[50, 100, 250, 500].map(v => <button key={v} onClick={() => setP(p => ({ ...p, V: v }))} style={stylePetitBouton(P.V === v, '#0f766e')}>{v} mL</button>)}</div>
      <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>Masse pesée : <strong>{fr(P.m, 2)} g</strong>
        <input type="range" min="0" max={maxM} step={pasM} value={Math.min(P.m, maxM)} aria-label="Masse de soluté en grammes" onChange={e => setP(p => ({ ...p, m: +e.target.value }))} style={{ width: '100%' }}/></label>
      <label style={{ fontSize: 13.5, fontWeight: 600 }}>ou tapez la masse : <input type="number" min="0" step="0.01" value={P.m} aria-label="Masse tapée en grammes" onChange={e => setP(p => ({ ...p, m: Math.max(0, +e.target.value || 0) }))} style={{ width: 80, padding: '3px 6px' }}/> g</label>
    </div>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Volume de la solution = volume de la fiole</strong> : c’est ce que garantit l’ajustement au trait de jauge. Sans fiole jaugée, le volume de la solution n’est pas exactement celui de l’eau ajoutée.</li>
      <li><strong>Dissolution complète</strong> jusqu’à la <strong>solubilité</strong> (valeurs approchées à 20 °C : KMnO₄ 64 g/L ; CuSO₄ 200 g/L ; NaCl 360 g/L). Au-delà, l’excès reste solide. La solubilité dépend de la température.</li>
      <li><strong>Masse pesée sans incertitude</strong> : dans la réalité, la balance et la fiole ont une précision limitée.</li>
      <li><strong>Points dessinés</strong> : ils sont schématiques. Dans 1 mL d’eau, il y a des milliards de milliards de particules : on n’en dessine que quelques dizaines.</li>
      <li><strong>Couleur</strong> : une solution plus concentrée est plus foncée (la teinte dessinée est proportionnelle à t pour les faibles concentrations). Le sel dissous est incolore : l’eau salée garde sa teinte.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['dissolution', '🧪 Dissoudre'], ['protocole', '🥼 Protocole de la fiole']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'dissolution' ? <><Dissolution P={P}/>{controles}</> : <><Protocole P={P} proto={proto} setProto={setProto}/>{controles}</>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez la masse sans changer le volume : que devient t ? Et si vous doublez le volume sans changer la masse ?</li>
        <li>Pour 250 mL à 0,40 g/L de KMnO₄, calculez la masse puis vérifiez avec le curseur.</li>
        <li>Choisissez NaCl, fiole de 100 mL, et montez la masse : à partir de quelle masse la solution est-elle saturée ?</li>
        <li>Comparez la couleur de KMnO₄ à 0,1 g/L et à 0,4 g/L. Et le sel : change-t-il la couleur de l’eau ?</li>
        <li>Faites le protocole en vous trompant exprès : que dit le message ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>soluté + solvant = solution</li><li>t = m / V (g/L) ; m = t × V</li><li>au-delà de la solubilité : solution saturée</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dl-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .dl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Dissolution et concentration en masse</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Dissoudre un solide dans l’eau, c’est préparer une <strong>solution</strong>. Apprenez à calculer sa <strong>concentration en masse</strong>, la <strong>masse à peser</strong> et à suivre le <strong>protocole de la fiole jaugée</strong>.</div>
      <div className={`dl-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={t2 => lancer(t2, defi)}/></div>}
          {enDefi && Pdefi && <div style={styleBoite}><Dissolution P={Pdefi}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="dl-l2">{panneauHypo}</div>}
      {enExplore && <div className="dl-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
