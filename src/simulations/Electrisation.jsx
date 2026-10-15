import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, Curseur, LigneMesure, lireProgression } from "../commun";
import { NB } from "./Distillation";

// ====================================================
//  SIM 51 — ÉLECTRISATION ET INFLUENCE ÉLECTROSTATIQUE (1G, chapitre 8B)
//  Frottement (transfert d'électrons), interaction entre corps chargés (expériences B et C du cours),
//  influence sur une boule neutre puis contact (expérience A). Modèle du cours : seuls les électrons se déplacent.
// ====================================================

const SIM = 51;
const ROUGE = '#dc2626', BLEU = '#2563eb', ORANGE = '#c2410c', VERT = '#16a34a', VIOLET = '#7c3aed';

declarerDefis(SIM, [
  ['frottement', 'Frottement : charges de la tige et du tissu'],
  ['interaction', 'Interaction : signe de la charge de la tige'],
  ['influence', 'Influence puis contact d’une boule neutre'],
]);

// signe = signe de la charge de la tige après frottement avec le tissu (ordre donné par l'expérience, pas calculé)
const TIGES = {
  verre: { nom: 'en verre', court: 'verre', couleur: '#bfdbfe', signe: 1 },
  ebonite: { nom: 'en ébonite', court: 'ébonite', couleur: '#64748b', signe: -1 },
  pp: { nom: 'en polypropylène (paille)', court: 'polypropylène', couleur: '#fde68a', signe: -1 },
};
const NMAX = 6;           // nombre maximal d'électrons transférés sur le dessin
const Q_ROD = 3;          // charge dessinée d'une tige frottée (en e)
const Q_CONTACT = 2;      // charge prise par la boule au contact (en e)
const sgn = q => (q > 0 ? '+' : q < 0 ? '−' : '');
const chg = q => (q === 0 ? '0' : `${sgn(q)}${Math.abs(q)}${NB}e`);
const tire = t => t[Math.floor(Math.random() * t.length)];

// ---------- dessin : une charge (disque rouge « + » ou bleu « − »), déplaçable avec transition ----------
function Charge({ x, y, s, r = 6, fantome, anim }) {
  if (fantome) return <circle cx={x} cy={y} r={r} fill="none" stroke={BLEU} strokeWidth="1.2" strokeDasharray="2.5 2.5" opacity="0.6"/>;
  const col = s > 0 ? ROUGE : BLEU, a = r * 0.5;
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: anim ? 'transform 0.8s ease' : 'none' }}>
      <circle r={r} fill={col} stroke="white" strokeWidth="0.8"/>
      <path d={s > 0 ? `M${-a},0H${a}M0,${-a}V${a}` : `M${-a},0H${a}`} stroke="white" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
    </g>);
}
function Inconnue({ x, y, r = 6 }) {
  return <g><circle cx={x} cy={y} r={r} fill="#cbd5e1" stroke="white" strokeWidth="0.8"/><text x={x} y={y + 3.5} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#475569">?</text></g>;
}
// Grille de charges d'un corps : nR charges + (rouges, en damier) et nB charges − (bleues)
function grille(nc, nl, x0, y0, dx, dy, nR, nB) {
  const slots = [];
  for (let r = 0; r < nl; r++) for (let c = 0; c < nc; c++) slots.push({ x: x0 + c * dx, y: y0 + r * dy, chk: (c + r) % 2 === 0 });
  const A = slots.filter(s => s.chk), B = slots.filter(s => !s.chk);
  const reste = [...B, ...A.slice(nR)];
  return [...A.slice(0, nR).map(s => ({ x: s.x, y: s.y, s: 1 })), ...reste.slice(0, nB).map(s => ({ x: s.x, y: s.y, s: -1 }))];
}
function fleche(x, y, dir, len, col, ep = 3, cle) {
  const x2 = x + dir * len, t = 10, w = 5.5, bx = x2 - dir * t;
  return <g key={cle}><line x1={x} y1={y} x2={bx} y2={y} stroke={col} strokeWidth={ep} strokeLinecap="round"/>
    <path d={`M${x2},${y} L${bx},${y - w} L${bx},${y + w} z`} fill={col}/></g>;
}
function etiquetteVec(x, y, lettre, indice, col, cle, taille = 14) {
  const w = taille * 0.4, h = y - taille * 0.95;
  return <g key={cle}><text x={x} y={y} textAnchor="middle" fontSize={taille} fontWeight="800" fill={col}>{lettre}
    {indice && <tspan fontSize={taille * 0.72} dy={taille * 0.28}>{indice}</tspan>}</text>
    <line x1={x - w} y1={h} x2={x + w - 2} y2={h} stroke={col} strokeWidth="1.4"/><path d={`M${x + w + 1},${h} l-4.5,-2.6 l0,5.2 z`} fill={col}/></g>;
}

// ---------- physique qualitative ----------
// Intensité relative (0 à 1) en fonction de la distance d (cm) : 1 au contact, décroissante
const proxim = (d, d0) => 1 / (1 + ((d - d0) / 3) ** 2);
// Interaction boule / tige : { type: 'attr' | 'rep' | 'aucune', amp, phi }
function interBoule(s, Q, d) {
  const f = proxim(d, 1);
  if (s === 0) return { type: 'aucune', amp: 0, phi: 0 };
  if (Q === 0) return { type: 'attr', amp: 0.6 * f, phi: f, influence: true };
  return { type: Q * s > 0 ? 'rep' : 'attr', amp: f, phi: f };
}

// ---------- défis ----------
function nouveauDefi(type) {
  if (type === 'frottement') return { type, tige: tire(['verre', 'ebonite', 'pp']), n: tire([3, 4, 5, 6]), reps: {}, verifie: false };
  if (type === 'interaction') return { type, tige: tire(['verre', 'ebonite', 'pp']), paille: tire([1, -1]), reps: {}, verifie: false };
  return { type, tige: tire(['verre', 'ebonite']), reps: {}, verifie: false };
}
const TITRES_DEFIS = { frottement: 'Frottement', interaction: 'Signe de la tige', influence: 'Influence et contact' };

function evaluer(defi) {
  const r = defi.reps;
  if (defi.type === 'frottement') {
    const s = TIGES[defi.tige].signe, n = defi.n, a = lireNombre(r.qT), b = lireNombre(r.qC);
    const okA = isFinite(a) && a === s * n, okB = isFinite(b) && b === -s * n;
    const aide = s > 0 ? 'La tige a perdu des électrons : elle est chargée positivement.' : 'La tige a gagné des électrons : elle est chargée négativement.';
    return { ok: okA && okB, lignes: [
      [okA, okA ? 'Charge de la tige correcte.' : isFinite(a) && Math.abs(a) === n ? `Le nombre d’électrons est bon, mais pas le signe. ${aide}` : `Charge de la tige : comptez les électrons qui ont changé de corps. ${aide}`],
      [okB, okB ? 'Charge du tissu correcte.' : 'Charge du tissu : ce que la tige a perdu, le tissu l’a gagné (et inversement). La charge totale tige + tissu reste nulle.']] };
  }
  if (defi.type === 'interaction') {
    const s = TIGES[defi.tige].signe, attr = s * defi.paille < 0;
    const okS = r.signe === (s > 0 ? '+' : '-'), okM = r.mvt === (s > 0 ? 'perdu' : 'gagne');
    return { ok: okS && okM, lignes: [
      [okS, okS ? 'Signe de la tige correct.' : `Signe : la paille est ${defi.paille > 0 ? 'positive' : 'négative'} et la tige ${attr ? 's’approche d’elle (attraction : charges de signes opposés)' : 'la repousse (répulsion : charges de même signe)'}. Revoyez le sens du déplacement.`],
      [okM, okM ? 'Bilan en électrons correct.' : 'Une tige chargée positivement a perdu des électrons ; une tige chargée négativement en a gagné (seuls les électrons se déplacent).']] };
  }
  const s = TIGES[defi.tige].signe;
  const attendu = { q1: s > 0 ? '-' : '+', q2: 'attr', q3: s > 0 ? '+' : '-', q4: 'rep' };
  const msg = {
    q1: s > 0 ? 'La tige chargée + attire les électrons libres de la boule : la face proche se charge −, la face éloignée +.' : 'La tige chargée − repousse les électrons libres de la boule : la face proche se charge +, la face éloignée −.',
    q2: 'Les charges de signe opposé, plus proches de la tige, l’emportent sur celles de même signe, plus éloignées : la boule est attirée, bien que neutre au total.',
    q3: s > 0 ? 'Au contact, des électrons passent de la boule à la tige (chargée +) : la boule perd des électrons et devient +.' : 'Au contact, des électrons passent de la tige (chargée −) à la boule : la boule gagne des électrons et devient −.',
    q4: 'La boule et la tige ont maintenant des charges de même signe : elles se repoussent.' };
  const lignes = ['q1', 'q2', 'q3', 'q4'].map(k => [r[k] === attendu[k], r[k] === attendu[k] ? `Question ${k[1]} : correct.` : `Question ${k[1]} : ${msg[k]}`]);
  return { ok: lignes.every(l => l[0]), lignes };
}

function VoletDefi({ defi, setDefi, changerType }) {
  const cle = `${SIM}:defi.${defi.type}`;
  const res = defi.verifie ? evaluer(defi) : null;
  const reussi = !!res && res.ok;
  const suivi = useSuivi(cle, reussi);
  const solution = !!defi.solution;
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true, reussi: evaluer(d).ok || d.reussi })); };
  const voirSolution = () => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); };
  const prog = lireProgression();
  const choix = (k, options) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{options.map(([v, l]) =>
      <button key={v} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>);
  const saisie = (k, unite, lab) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
      <span>{lab}</span>
      <input value={defi.reps[k] ?? ''} aria-label={lab} onChange={e => rep(k, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verifier(); }}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const titre = t => <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{t}</div>;
  const q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const s = TIGES[defi.tige].signe;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES_DEFIS).map(([t, l]) =>
          <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}
      </div>
      {defi.type === 'frottement' && <>
        {titre('🎯 Défi : les charges après frottement')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Une tige <strong>{TIGES[defi.tige].nom}</strong> vient d’être frottée avec un tissu. Observez sur le dessin les électrons qui ont changé de corps
          (au départ, chaque corps compte 8 charges + et 8 charges −). Donnez la charge de la tige et celle du tissu, en unités de e (avec le signe).</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saisie('qT', 'e', 'Charge de la tige')}{saisie('qC', 'e', 'Charge du tissu')}
        </div>
      </>}
      {defi.type === 'interaction' && <>
        {titre('🎯 Défi : quel est le signe de la tige ?')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Une paille chargée <strong>{defi.paille > 0 ? 'positivement' : 'négativement'}</strong> peut rouler sur deux barres de verre. On en approche une tige frottée dont on ne connaît pas la charge
          (charges cachées). Rapprochez la tige avec le curseur et observez la paille. Quel est le signe de la charge de la tige ?</div>
        {q('La charge de la tige est…')}
        {choix('signe', [['+', 'positive'], ['-', 'négative']])}
        {q('Pendant le frottement, la tige a… des électrons.')}
        {choix('mvt', [['gagne', 'gagné'], ['perdu', 'perdu']])}
      </>}
      {defi.type === 'influence' && <>
        {titre('🎯 Défi : prédire les quatre étapes')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Une tige frottée <strong>chargée {s > 0 ? 'positivement' : 'négativement'}</strong> est approchée d’une boule d’aluminium neutre suspendue à un fil, puis mise en contact avec elle,
          puis écartée. <em>Prédisez</em> avant de regarder : l’expérience ne s’affiche qu’après votre réponse.</div>
        {q('1. Tige approchée (sans contact) : la face de la boule tournée vers la tige est…')}
        {choix('q1', [['+', 'chargée +'], ['-', 'chargée −'], ['0', 'neutre']])}
        {q('2. Avant le contact, la tige et la boule…')}
        {choix('q2', [['attr', 's’attirent'], ['rep', 'se repoussent'], ['aucune', 'n’interagissent pas']])}
        {q('3. Après le contact, la boule est…')}
        {choix('q3', [['+', 'chargée +'], ['-', 'chargée −'], ['0', 'neutre']])}
        {q('4. Après le contact, la tige et la boule…')}
        {choix('q4', [['attr', 's’attirent'], ['rep', 'se repoussent'], ['aucune', 'n’interagissent pas']])}
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <button onClick={verifier} style={styleBouton(true, VERT)}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau défi</button>
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
        {res.lignes.map(([ok, t], i) => <div key={i} style={{ color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✓' : '✗'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: '#15803d', marginTop: 4 }}>🎉 Défi réussi !</div>}
        {!res.ok && !solution && <button onClick={voirSolution} style={{ marginTop: 4, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>}
      {solution && <div style={{ ...styleBoite, marginTop: 8, fontSize: 13.5, lineHeight: 1.6, background: '#fffbeb', borderColor: '#fcd34d' }}>
        {defi.type === 'frottement' && <>La tige {TIGES[defi.tige].nom} {s > 0 ? 'a perdu' : 'a gagné'} {defi.n} électron{defi.n > 1 ? 's' : ''} : sa charge est {chg(s * defi.n)}. Le tissu a fait l’inverse : {chg(-s * defi.n)}.
          La charge totale reste nulle : les électrons ne se créent pas, ils passent d’un corps à l’autre.</>}
        {defi.type === 'interaction' && <>La paille est {defi.paille > 0 ? 'positive' : 'négative'} et elle {s * defi.paille < 0 ? 's’approche de la tige : attraction, donc charges de signes opposés' : 'est repoussée par la tige : répulsion, donc charges de même signe'}.
          La tige est donc {s > 0 ? 'positive : elle a perdu des électrons' : 'négative : elle a gagné des électrons'}.</>}
        {defi.type === 'influence' && <>1. {s > 0 ? 'Les électrons libres de la boule sont attirés par la tige + : face proche −, face éloignée +.' : 'Les électrons libres de la boule sont repoussés par la tige − : face proche +, face éloignée −.'}
          {' '}2. Les charges proches (de signe opposé à la tige) l’emportent : la boule est attirée. 3. Au contact, {s > 0 ? 'des électrons passent de la boule à la tige : la boule devient +' : 'des électrons passent de la tige à la boule : la boule devient −'}.
          {' '}4. Boule et tige ont des charges de même signe : elles se repoussent.</>}
      </div>}
    </div>);
}

export function SimulationElectrisation() {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('electrisation-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [tab, setTab] = useState('frottement');
  const [frot, setFrot] = useState({ tige: 'verre', n: 0 });
  const [inter, setInter] = useState({ tige: 'ebonite', paille: -1, d: 10 });
  const [infl, setInfl] = useState({ tige: 'verre', d: 12, Q: 0 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const okVerre = frot.tige === 'verre' && frot.n >= 4;
  const okEbo = frot.tige === 'ebonite' && frot.n >= 4;
  const okB = inter.tige === 'ebonite' && inter.paille < 0 && inter.d <= 6;
  const okC = inter.tige === 'verre' && inter.paille < 0 && inter.d <= 6;
  const okInf1 = infl.tige === 'verre' && infl.Q === 0 && infl.d >= 10;
  const okInf2 = infl.tige === 'verre' && infl.Q === 0 && infl.d <= 4;
  const okContact = infl.tige === 'verre' && infl.Q === Q_CONTACT;
  const okRepouss = okContact && infl.d >= 2;
  const okContactEbo = infl.tige === 'ebonite' && infl.Q === -Q_CONTACT;
  const ETAPES = [
    { id: 'neutre', titre: 'Un corps neutre', onglet: 'frottement', focus: ['scene'],
      texte: <>Tous les objets qui nous entourent sont électriquement neutres. Sur le dessin, la tige et le tissu contiennent chacun 8 charges <strong style={{ color: ROUGE }}>+</strong> (protons, fixes dans les noyaux)
        et 8 charges <strong style={{ color: BLEU }}>−</strong> (électrons). <em>Dans la réalité, il y en a des milliards de milliards : le dessin n’en montre que quelques-unes.</em></>,
      tache: { type: 'qcm', q: 'Un objet est neutre parce que…', options: ['il contient autant de charges + que de charges − : elles se compensent', 'il ne contient aucune charge électrique', 'ses électrons sont immobiles'], bonne: 0,
        expl: 'Un objet neutre n’est pas un objet sans charges : la somme des charges positives (protons) et négatives (électrons) est nulle.' } },
    { id: 'frotterVerre', titre: 'Frotter une tige en verre', onglet: 'frottement', focus: ['reglages', 'scene'],
      texte: <>Choisissez la tige <strong>en verre</strong> et cliquez sur « Frotter » (au moins 4 fois). Chaque clic fait passer un électron d’un corps à l’autre sur le dessin.</>,
      tache: { type: 'action', ok: okVerre, label: 'Tige en verre frottée 4 fois', faire: () => setFrot({ tige: 'verre', n: 4 }), consigne: 'Tige en verre, au moins 4 frottements' } },
    { id: 'signeVerre', titre: 'Le signe de la tige', onglet: 'frottement', focus: ['scene', 'bilan'],
      texte: <>Observez quel corps a perdu des électrons et lisez le bilan.</>,
      tache: { type: 'qcm', q: 'Après frottement, la tige en verre est chargée…', options: ['positivement : elle a perdu des électrons', 'négativement : elle a gagné des électrons', 'positivement : elle a gagné des protons'], bonne: 0,
        expl: 'Le tissu arrache des électrons au verre. Le verre, qui a perdu des charges négatives, est chargé positivement. Les protons, eux, ne bougent pas.' } },
    { id: 'compte', titre: 'Compter la charge', onglet: 'frottement', focus: ['bilan'],
      texte: <>La charge de la tige s’exprime en nombre de charges élémentaires e. Une tige neutre qui perd n électrons porte la charge +n·e.</>,
      tache: { type: 'num', q: 'Charge de la tige en verre après vos frottements', unite: 'e (avec son signe)', vrai: frot.n, tol: 0.01, affiche: v => String(v), cs: 1,
        bloque: okVerre ? null : 'Frottez d’abord la tige en verre au moins 4 fois (étape précédente).',
        pieges: [[-frot.n, 'Le signe : la tige a perdu des électrons, elle est donc positive.']],
        expl: `La tige a perdu ${frot.n} électrons : q = +${frot.n}·e.` } },
    { id: 'tissu', titre: 'Et le tissu ?', onglet: 'frottement', focus: ['bilan', 'scene'],
      texte: <>Regardez la charge du tissu et la charge totale du système {'{'}tige + tissu{'}'}.</>,
      tache: { type: 'qcm', q: 'Le tissu est…, et la charge totale du système {tige + tissu} vaut…', options: ['chargé négativement ; la charge totale reste nulle', 'chargé positivement ; la charge totale vaut 0', 'neutre ; la charge totale est positive'], bonne: 0,
        expl: 'Le tissu a gagné les électrons perdus par la tige : il est négatif. Rien ne se crée : la charge totale reste nulle, les électrons ont seulement changé de corps.' } },
    { id: 'ebonite', titre: 'Une tige en ébonite', onglet: 'frottement', focus: ['reglages', 'scene'],
      texte: <>Passez à la tige <strong>en ébonite</strong> et frottez-la au moins 4 fois. Observez le sens du transfert.</>,
      tache: { type: 'action', ok: okEbo, label: 'Tige en ébonite frottée 4 fois', faire: () => setFrot({ tige: 'ebonite', n: 4 }), consigne: 'Tige en ébonite, au moins 4 frottements' } },
    { id: 'signeEbo', titre: 'Un transfert en sens inverse', onglet: 'frottement', focus: ['scene', 'bilan', 'serie'],
      texte: <>Cette fois, c’est le tissu qui cède des électrons. Le cadre « Série d’électrisation » donne l’ordre utilisé : il vient de l’expérience.</>,
      tache: { type: 'qcm', q: 'Avec l’ébonite, après frottement…', options: ['l’ébonite est négative et le tissu positif', 'l’ébonite est positive et le tissu négatif', 'les deux corps sont négatifs'], bonne: 0,
        expl: 'L’ébonite (comme le polypropylène de la paille) gagne des électrons : elle est négative. Le tissu, qui en a cédé, est positif.' } },
    { id: 'seuls', titre: 'Qui se déplace ?', onglet: 'frottement', focus: [],
      texte: <>Revoyez les deux frottements.</>,
      tache: { type: 'qcm', q: 'Lors de l’électrisation par frottement (modèle du cours)…', options: ['seuls les électrons se déplacent ; les protons restent fixes', 'seuls les protons se déplacent', 'protons et électrons se déplacent'], bonne: 0,
        expl: 'Les protons sont liés aux noyaux, qui ne quittent pas leur matériau. Seuls les électrons, bien moins liés, passent d’un corps à l’autre.' } },
    { id: 'interB', titre: 'Expérience B : ébonite et paille', onglet: 'interaction', focus: ['reglages', 'scene'],
      texte: <>Une paille en polypropylène, frottée, est chargée négativement. Elle repose sur deux barres de verre et peut rouler. Approchez-en la tige <strong>en ébonite</strong> frottée
        (curseur de distance : 6 cm ou moins).</>,
      tache: { type: 'action', ok: okB, label: 'Tige en ébonite à 6 cm ou moins', faire: () => setInter({ tige: 'ebonite', paille: -1, d: 5 }), consigne: 'Tige en ébonite, distance ≤ 6 cm' } },
    { id: 'obsB', titre: 'Deux charges négatives', onglet: 'interaction', focus: ['scene'],
      texte: <>Observez le mouvement de la paille et le sens des deux forces.</>,
      tache: { type: 'qcm', q: 'La tige en ébonite (−) et la paille (−)…', options: ['se repoussent', 's’attirent', 'n’interagissent pas'], bonne: 0,
        expl: 'Deux corps chargés de même signe se repoussent : la paille est repoussée par la tige.' } },
    { id: 'interC', titre: 'Expérience C : verre et paille', onglet: 'interaction', focus: ['reglages', 'scene'],
      texte: <>Remplacez la tige par la tige <strong>en verre</strong> frottée.</>,
      tache: { type: 'action', ok: okC, label: 'Tige en verre à 6 cm ou moins', faire: () => setInter({ tige: 'verre', paille: -1, d: 5 }), consigne: 'Tige en verre, distance ≤ 6 cm' } },
    { id: 'obsC', titre: 'Deux charges de signes opposés', onglet: 'interaction', focus: ['scene'],
      texte: <>Que fait la paille ?</>,
      tache: { type: 'qcm', q: 'La tige en verre (+) et la paille (−)…', options: ['s’attirent', 'se repoussent', 'n’interagissent pas'], bonne: 0,
        expl: 'Deux corps de charges opposées s’attirent. Contrairement à la gravitation, toujours attractive, l’interaction électrostatique peut être attractive ou répulsive.' } },
    { id: 'recip', titre: 'Deux forces', onglet: 'interaction', focus: ['scene'],
      texte: <>Comme pour la gravitation (simulation « Deux corps en interaction »), l’interaction est modélisée par deux forces. Comparez les deux flèches.</>,
      tache: { type: 'qcm', q: 'La force exercée par la tige sur la paille et celle exercée par la paille sur la tige ont…', options: ['la même norme et des sens opposés', 'des normes différentes : la tige est plus grosse', 'le même sens'], bonne: 0,
        expl: 'Principe des actions réciproques : F(tige/paille) = −F(paille/tige). La loi de Coulomb donne leur norme (voir la simulation sur les deux corps).' } },
    { id: 'inf1', titre: 'Expérience A : une boule neutre', onglet: 'influence', focus: ['reglages', 'scene'],
      texte: <>Une boule d’aluminium, <strong>neutre</strong>, est suspendue à un fil. Ses électrons sont libres de se déplacer (c’est un métal). Éloignez la tige en verre chargée (10 cm ou plus).</>,
      tache: { type: 'action', ok: okInf1, label: 'Tige en verre loin (≥ 10 cm), boule neutre', faire: () => setInfl({ tige: 'verre', d: 12, Q: 0 }), consigne: 'Tige en verre à 10 cm ou plus, boule neutre' } },
    { id: 'inf2', titre: 'Approcher la tige', onglet: 'influence', focus: ['reglages', 'scene'],
      texte: <>Approchez la tige en verre (4 cm ou moins), sans toucher la boule. Regardez comment les charges de la boule se déplacent.</>,
      tache: { type: 'action', ok: okInf2, label: 'Tige en verre à 4 cm ou moins', faire: () => setInfl({ tige: 'verre', d: 3, Q: 0 }), consigne: 'Tige en verre à 4 cm ou moins, boule toujours neutre' } },
    { id: 'face', titre: 'Les électrons libres', onglet: 'influence', focus: ['scene', 'bilan'],
      texte: <>La tige est chargée +.</>,
      tache: { type: 'qcm', q: 'La face de la boule tournée vers la tige est chargée…', options: ['négativement : les électrons libres sont attirés par la tige', 'positivement : les électrons sont repoussés', 'elle reste neutre'], bonne: 0,
        expl: 'Les électrons libres de l’aluminium sont attirés par la tige positive et s’accumulent sur la face proche. La face éloignée, privée d’électrons, est chargée +.' } },
    { id: 'totale', titre: 'La charge totale de la boule', onglet: 'influence', focus: ['bilan'],
      texte: <>Aucun électron n’a quitté la boule : ils se sont seulement déplacés à l’intérieur.</>,
      tache: { type: 'qcm', q: 'La charge totale de la boule est…', options: ['nulle : seule la répartition des charges a changé', 'négative, car la face proche est négative', 'positive, car la tige est positive'], bonne: 0,
        expl: 'On parle d’électrisation par influence : la boule reste neutre au total, mais ses deux faces sont chargées de signes opposés.' } },
    { id: 'attrA', titre: 'Pourquoi une boule neutre est-elle attirée ?', onglet: 'influence', focus: ['scene'],
      texte: <>Regardez le fil : la boule est attirée par la tige.</>,
      tache: { type: 'qcm', q: 'Pourquoi la boule neutre est-elle attirée ?', options: ['les charges − de la face proche, plus près de la tige, sont plus attirées que les charges + éloignées ne sont repoussées', 'la boule porte une charge totale négative', 'c’est la force de gravitation de la tige'], bonne: 0,
        expl: 'La force diminue avec la distance : l’attraction exercée sur la face proche (charges −) l’emporte sur la répulsion exercée sur la face éloignée (charges +).' } },
    { id: 'contact', titre: 'Mettre en contact', onglet: 'influence', focus: ['reglages', 'scene'],
      texte: <>Cliquez sur « Toucher la boule avec la tige ». Observez le sens du transfert d’électrons.</>,
      tache: { type: 'action', ok: okContact, label: 'Boule touchée par la tige en verre', faire: () => setInfl({ tige: 'verre', d: 1, Q: Q_CONTACT }), consigne: 'Contact entre la tige en verre et la boule' } },
    { id: 'qnet', titre: 'La charge de la boule', onglet: 'influence', focus: ['bilan'],
      texte: <>Lisez le bilan : au contact, la boule a perdu des électrons.</>,
      tache: { type: 'num', q: 'Charge de la boule après le contact', unite: 'e (avec son signe)', vrai: Q_CONTACT, tol: 0.01, affiche: v => `+${v}`, cs: 1,
        bloque: okContact ? null : 'Faites d’abord le contact avec la tige en verre (étape précédente).',
        pieges: [[-Q_CONTACT, 'Le signe : la boule a perdu des électrons (qui sont passés sur la tige), elle est donc positive.']],
        expl: `La boule a perdu ${Q_CONTACT} électrons, passés sur la tige : q = +${Q_CONTACT}·e.` } },
    { id: 'repouss', titre: 'Écarter la tige', onglet: 'influence', focus: ['reglages', 'scene'],
      texte: <>Écartez un peu la tige (au moins 2 cm) et observez le fil.</>,
      tache: { type: 'action', ok: okRepouss, label: 'Tige écartée (≥ 2 cm), boule chargée +', faire: () => setInfl({ tige: 'verre', d: 4, Q: Q_CONTACT }), consigne: 'Boule chargée +, tige à 2 cm ou plus' } },
    { id: 'rep2', titre: 'Après le contact', onglet: 'influence', focus: ['scene'],
      texte: <>La boule est maintenant chargée au total.</>,
      tache: { type: 'qcm', q: 'Après le contact, la boule est… par la tige.', options: ['repoussée : elle et la tige portent des charges de même signe', 'attirée, comme avant le contact', 'ni attirée ni repoussée'], bonne: 0,
        expl: 'La boule et la tige sont maintenant toutes deux positives : elles se repoussent. C’est la « violente répulsion » observée dans l’expérience.' } },
    { id: 'contactEbo', titre: 'Avec une tige négative', onglet: 'influence', focus: ['reglages', 'scene'],
      texte: <>Déchargez la boule (« Décharger la boule »), choisissez la tige <strong>en ébonite</strong> et touchez la boule avec la tige.</>,
      tache: { type: 'action', ok: okContactEbo, label: 'Boule touchée par la tige en ébonite', faire: () => setInfl({ tige: 'ebonite', d: 1, Q: -Q_CONTACT }), consigne: 'Contact entre la tige en ébonite et la boule' } },
    { id: 'qEbo', titre: 'Le signe de la boule', onglet: 'influence', focus: ['bilan'],
      texte: <>Cette fois, le transfert d’électrons se fait de la tige vers la boule.</>,
      tache: { type: 'qcm', q: 'Après contact avec la tige en ébonite, la boule est…', options: ['chargée négativement : elle a gagné des électrons', 'chargée positivement : elle a perdu des électrons', 'neutre'], bonne: 0,
        expl: 'La tige négative a cédé des électrons à la boule : la boule est négative, et se repousse avec la tige.' } },
    { id: 'bravo', titre: 'Bravo !', onglet: 'influence', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>Un corps est neutre quand il contient autant de charges + que de charges −.</li>
        <li>On l’électrise en lui faisant gagner ou perdre des électrons ; seuls les électrons se déplacent, les protons restent fixes.</li>
        <li>Deux corps de même signe se repoussent, de signes opposés s’attirent.</li>
        <li>Un corps neutre conducteur est attiré par un corps chargé : c’est l’influence (charges séparées, charge totale nulle).</li>
        <li>Au contact, la boule prend la charge de même signe que la tige : elle est ensuite repoussée.</li></ul>,
      texte: <>Vous savez interpréter les expériences d’électrisation. Essayez maintenant les défis.</>, tache: null },
  ];
  const ongletGuide = ETAPES[Math.min(etape, ETAPES.length - 1)].onglet;
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ MODES ET DÉFIS ════════════════
  const ongletDefi = !defi ? 'frottement' : defi.type;
  const ongletAff = enGuide ? ongletGuide : enDefi ? ongletDefi : tab;
  function lancerDefi(type) {
    const dd = nouveauDefi(type);
    setDefi(dd);
    if (type === 'frottement') setFrot({ tige: dd.tige, n: dd.n });
    else if (type === 'interaction') setInter({ tige: dd.tige, paille: dd.paille, d: 10 });
    else setInfl({ tige: dd.tige, d: 12, Q: 0 });
  }
  function changerMode(md) {
    if (mode === 'defi' && md !== 'defi') { setFrot({ tige: 'verre', n: 0 }); setInter({ tige: 'ebonite', paille: -1, d: 10 }); setInfl({ tige: 'verre', d: 12, Q: 0 }); }
    setMode(md);
    if (md === 'defi') lancerDefi(defi ? defi.type : 'frottement');
  }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);
  const figee = enDefi && defi.type === 'influence' && !defi.reussi && !defi.solution;     // défi 3 : on prédit avant de voir
  const cache = enDefi ? { bilan: defi.type === 'frottement' || defi.type === 'interaction' || figee, reglages: defi.type === 'frottement', figee } : {};

  // ════════════════ SCÈNE 1 : FROTTEMENT ════════════════
  const FW = 640, FH = 270;
  const sFr = TIGES[frot.tige].signe, nFr = frot.n;
  const tf = nFr * sFr;                                       // charge de la tige (en e)
  const scFrottement = (() => {
    const colX = c => 100 + 62 * c, ordre = [1, 3, 5, 7, 0, 2, 4, 6];
    // tige : lignes 48, 70, 92 (la ligne du bas reçoit les électrons gagnés) ; tissu : lignes 168, 190, 212 (celle du haut les reçoit)
    const objets = {
      tige: { lignes: [48, 70, 92], extra: 2, base: [0, 1] },
      tissu: { lignes: [168, 190, 212], extra: 0, base: [1, 2] },
    };
    const donneur = sFr > 0 ? 'tige' : 'tissu', receveur = sFr > 0 ? 'tissu' : 'tige';
    const pos = (o, k, elec) => {                               // emplacement du proton (ou de l'électron) n° k d'un corps neutre
      const r = o.lignes[o.base[k < 4 ? 0 : 1]], j = k < 4 ? 2 * k : 2 * (k - 4) + 1;
      return { x: colX(elec ? (k < 4 ? j + 1 : j - 1) : j), y: r };
    };
    const el = [];
    ['tige', 'tissu'].forEach(nom => {
      const o = objets[nom];
      for (let k = 0; k < 8; k++) {
        const pp = pos(o, k, false), ee = pos(o, k, true);
        el.push(<Charge key={`${nom}-p${k}`} x={pp.x} y={pp.y} s={1}/>);
        if (nom === donneur) {
          const dest = objets[receveur].lignes[objets[receveur].extra];
          if (k < nFr) el.push(<Charge key={`g-${k}`} x={ee.x} y={ee.y} s={-1} fantome/>);
          el.push(<Charge key={`mv-${k}`} x={k < nFr ? colX(ordre[k]) : ee.x} y={k < nFr ? dest : ee.y} s={-1} anim/>);
        } else el.push(<Charge key={`${nom}-e${k}`} x={ee.x} y={ee.y} s={-1}/>);
      }
    });
    return (
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img"
        aria-label={`Frottement d’une tige ${TIGES[frot.tige].nom} avec un tissu : ${nFr} électron${nFr > 1 ? 's' : ''} transféré${nFr > 1 ? 's' : ''}`}>
        <rect x="50" y="30" width="540" height="84" rx="22" fill={TIGES[frot.tige].couleur} stroke="#0f172a" strokeWidth="1.5" opacity="0.55"/>
        <rect x="50" y="150" width="540" height="84" rx="10" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.8"/>
        <text x="58" y="24" fontSize="13.5" fontWeight="700" fill="#0f172a">Tige {TIGES[frot.tige].nom}</text>
        <text x="58" y="145" fontSize="13.5" fontWeight="700" fill="#0f172a">Tissu (peau de chat)</text>
        <text x="582" y="24" textAnchor="end" fontSize="14" fontWeight="800" fill={cache.bilan ? '#64748b' : tf > 0 ? ROUGE : tf < 0 ? BLEU : '#0f172a'}>{cache.bilan ? 'q = ?' : `q = ${chg(tf)}`}</text>
        <text x="582" y="145" textAnchor="end" fontSize="14" fontWeight="800" fill={cache.bilan ? '#64748b' : tf < 0 ? ROUGE : tf > 0 ? BLEU : '#0f172a'}>{cache.bilan ? 'q = ?' : `q = ${chg(-tf)}`}</text>
        {el}
        {nFr > 0 && <g><path d={`M320,${sFr > 0 ? 120 : 144} v${sFr > 0 ? 24 : -24}`} stroke="#0f172a" strokeWidth="2"/>
          <text x="332" y="136" fontSize="12.5" fontWeight="700" fill="#0f172a">{nFr} électron{nFr > 1 ? 's' : ''} {sFr > 0 ? '↓' : '↑'}</text></g>}
        <text x="320" y="258" textAnchor="middle" fontSize="12" fill="#334155">Les protons (+) ne bougent pas. Cercle en pointillés : place laissée vide par un électron.</text>
      </svg>);
  })();

  // ════════════════ SCÈNE 2 : INTERACTION (expériences B et C) ════════════════
  const sIn = inter.tige === 'neutre' ? 0 : TIGES[inter.tige].signe;
  const forceIn = sIn === 0 ? 0 : sIn * inter.paille < 0 ? 1 : -1;      // +1 attraction, −1 répulsion
  const scInteraction = (() => {
    const W = 640, H = 270, xs0 = 150, gap0 = 14 + (inter.d - 2) * 14, f = proxim(inter.d, 2);
    let dx = forceIn * f * 46;
    if (dx > 0) dx = Math.min(dx, gap0 - 3);
    const xs = xs0 + dx, xr = xs0 + 28 + gap0;
    const paille = grille(3, 7, xs - 16, 78, 16, 26, 8, inter.paille < 0 ? 8 + Q_ROD : 8 - Q_ROD);
    const tige = grille(5, 4, xr + 28, 123, 36, 12.5, 8, sIn > 0 ? 8 - Q_ROD : 8 + Q_ROD);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img"
        aria-label="Une paille chargée posée sur deux barres de verre et une tige frottée que l’on approche">
        <rect x="30" y="96" width="590" height="11" rx="5" fill="#bfdbfe" stroke="#0f172a" strokeWidth="1"/>
        <rect x="30" y="196" width="590" height="11" rx="5" fill="#bfdbfe" stroke="#0f172a" strokeWidth="1"/>
        <text x="620" y="90" textAnchor="end" fontSize="11" fill="#475569">barres de verre</text>
        <rect x={xs - 28} y="50" width="56" height="190" rx="18" fill="#fde68a" stroke="#0f172a" strokeWidth="1.5" opacity="0.7"/>
        <text x={xs} y="256" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">paille ({inter.paille > 0 ? '+' : '−'})</text>
        {paille.map((c, i) => <Charge key={`p${i}`} x={c.x} y={c.y} s={c.s} r={5.5}/>)}
        <rect x={xr} y="116" width="200" height="58" rx="14" fill={inter.tige === 'neutre' || cache.bilan ? '#e2e8f0' : TIGES[inter.tige].couleur} stroke="#0f172a" strokeWidth="1.5" opacity="0.65"/>
        {inter.tige !== 'neutre' && (cache.bilan
          ? grille(5, 4, xr + 28, 123, 36, 12.5, 8, 6).map((c, i) => <Inconnue key={`h${i}`} x={c.x} y={c.y} r={5.5}/>)
          : tige.map((c, i) => <Charge key={`t${i}`} x={c.x} y={c.y} s={c.s} r={5.5}/>))}
        <text x={xr + 100} y="226" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">
          {inter.tige === 'neutre' ? 'tige non frottée (neutre)' : cache.bilan ? 'tige frottée : charge inconnue' : `tige ${TIGES[inter.tige].nom} frottée (${sIn > 0 ? '+' : '−'})`}</text>
        {forceIn !== 0 && <g>
          {fleche(xs - forceIn * 23, 30, forceIn, 46, ROUGE, 3.2, 'f1')}{etiquetteVec(xs, 18, 'F', 'tige/paille', ROUGE, 'e1', 13)}
          {fleche(xr + 100 + forceIn * 23, 30, -forceIn, 46, ORANGE, 3.2, 'f2')}{etiquetteVec(xr + 100, 18, 'F', 'paille/tige', ORANGE, 'e2', 13)}
        </g>}
        {sIn === 0 && <text x="400" y="60" textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">Tige neutre : aucune interaction électrostatique (modèle).</text>}
      </svg>);
  })();

  // ════════════════ SCÈNE 3 : INFLUENCE ET CONTACT (expérience A) ════════════════
  const sBo = TIGES[infl.tige].signe;
  const IB = interBoule(sBo, infl.Q, infl.d);
  const scInfluence = (() => {
    const W = 640, H = 312, px = 200, R = 56, L = 168, xrod = 260 + (infl.d - 1) * 12;
    let dx = (IB.type === 'attr' ? 1 : IB.type === 'rep' ? -1 : 0) * IB.amp * 34;
    if (dx > 0) dx = Math.min(dx, 2 + (infl.d - 1) * 12);
    const xb = px + dx, yb = 14 + Math.sqrt(L * L - dx * dx);  // centre de la boule
    // charges de la boule : 6 protons fixes + (6 − Q) électrons, déplacés par influence
    const prot = [], elec = [];
    for (let k = 0; k < 6; k++) {
      const a = (15 + 60 * k) * Math.PI / 180;
      prot.push({ x: Math.cos(a) * 0.5 * R, y: Math.sin(a) * 0.5 * R });
      elec.push({ x: Math.cos(a) * 0.5 * R + Math.cos(a + 0.7) * 0.2 * R, y: Math.sin(a) * 0.5 * R + Math.sin(a + 0.7) * 0.2 * R });
    }
    [1.31, 4.45].forEach(a => elec.push({ x: Math.cos(a) * 0.62 * R, y: Math.sin(a) * 0.62 * R }));
    const retirer = [2, 5, 1, 4, 0, 3];
    const visibles = infl.Q >= 0 ? elec.slice(0, 6).map((e, k) => ({ e, k })).filter(o => !retirer.slice(0, infl.Q).includes(o.k))
      : elec.slice(0, 6 - infl.Q).map((e, k) => ({ e, k }));
    const decal = sBo * IB.phi * 0.62 * R * (IB.type === 'aucune' ? 0 : 1);
    const place = (p, mobile) => {
      let x = p.x + (mobile ? decal : 0), y = p.y;
      const r = Math.hypot(x, y), rm = 0.82 * R;
      if (r > rm) { x *= rm / r; y *= rm / r; }
      return { x: xb + x, y: yb + y };
    };
    const tigeCh = grille(5, 4, xrod + 28, 162, 36, 12.5, 8, sBo > 0 ? 8 - Q_ROD : 8 + Q_ROD);
    const gaucheAttr = IB.type === 'attr';
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img"
        aria-label="Une boule d’aluminium suspendue à un fil et une tige chargée que l’on approche">
        <line x1="150" y1="14" x2="250" y2="14" stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/>
        <rect x={xrod} y="153" width="200" height="58" rx="14" fill={TIGES[infl.tige].couleur} stroke="#0f172a" strokeWidth="1.5" opacity="0.65"/>
        {tigeCh.map((c, i) => <Charge key={`t${i}`} x={c.x} y={c.y} s={c.s} r={5.5}/>)}
        <text x={xrod + 100} y="233" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">tige {TIGES[infl.tige].nom} frottée ({sBo > 0 ? '+' : '−'})</text>
        <line x1="200" y1="14" x2={xb} y2={yb - R} stroke="#0f172a" strokeWidth="1.5"/>
        <circle cx={xb} cy={yb} r={R} fill="#d1d5db" stroke="#0f172a" strokeWidth="1.8"/>
        {prot.map((p, i) => { const q = place(p, false); return <Charge key={`bp${i}`} x={q.x} y={q.y} s={1} r={5}/>; })}
        {elec.map((e, k) => { const vis = visibles.some(o => o.k === k); const q = place(e, true); return vis ? <Charge key={`be${k}`} x={q.x} y={q.y} s={-1} r={5}/> : null; })}
        <text x={xb} y={yb + R + 17} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">boule d’aluminium{infl.Q !== 0 ? ` (${sgn(infl.Q)})` : ' (neutre)'}</text>
        {IB.type !== 'aucune' && infl.d < 11 && <g>
          {fleche(xb, 294, gaucheAttr ? 1 : -1, 42, ROUGE, 3.2, 'f1')}{etiquetteVec(xb + (gaucheAttr ? 21 : -21), 284, 'F', 'tige/boule', ROUGE, 'e1', 13)}
          {fleche(xrod + 100, 294, gaucheAttr ? -1 : 1, 42, ORANGE, 3.2, 'f2')}{etiquetteVec(xrod + 100 + (gaucheAttr ? -21 : 21), 284, 'F', 'boule/tige', ORANGE, 'e2', 13)}
        </g>}
        {cache.figee && <text x="430" y="60" textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">Prédisez avant de regarder (voir le défi).</text>}
      </svg>);
  })();

  // ════════════════ PANNEAUX ════════════════
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {ongletAff === 'frottement' && scFrottement}
      {ongletAff === 'interaction' && scInteraction}
      {ongletAff === 'influence' && scInfluence}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        <span style={{ color: ROUGE, fontWeight: 700 }}>●+</span> proton (fixe) · <span style={{ color: BLEU, fontWeight: 700 }}>●−</span> électron (mobile).
        {' '}Quelques charges seulement sont dessinées : dans la réalité, il y en a un nombre énorme (une tige frottée porte de l’ordre de 10¹⁰ électrons en excès ou en défaut).
      </div>
    </div>);

  const choixTige = (etat, setEtat, avecNeutre, reinit) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {Object.entries(TIGES).filter(([k]) => reinit || k !== 'pp').map(([k, t]) =>
        <button key={k} onClick={() => setEtat(e => ({ ...e, tige: k, ...(reinit ? { n: 0 } : {}) }))} style={stylePetitBouton(etat.tige === k, VIOLET)}>{t.court}</button>)}
      {avecNeutre && <button onClick={() => setEtat(e => ({ ...e, tige: 'neutre' }))} style={stylePetitBouton(etat.tige === 'neutre', VIOLET)}>tige non frottée</button>}
    </div>);

  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {ongletAff === 'frottement' && (cache.reglages ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Pendant le défi, le frottement est déjà fait.</div> : <>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Matière de la tige</div>
        {choixTige(frot, setFrot, false, true)}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFrot(f => ({ ...f, n: Math.min(NMAX, f.n + 1) }))} disabled={nFr >= NMAX} style={styleBouton(true, VERT)}>🧤 Frotter (+1 passage)</button>
          <button onClick={() => setFrot(f => ({ ...f, n: 0 }))} style={styleBouton(false)}>↺ Objets neutres</button>
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>À chaque passage, un électron change de corps sur le dessin (en réalité, des milliards).</div>
      </>)}
      {ongletAff === 'interaction' && <>
        {!enDefi && <>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Tige approchée de la paille</div>
          {choixTige(inter, setInter, true, false)}
          <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>La paille en polypropylène, frottée, est chargée négativement.</div></>}
        <Curseur nom="Distance entre la paille et la tige" valeur={inter.d} onChange={v => setInter(i => ({ ...i, d: v }))} min={2} max={14} pas={1} unite="cm" couleur={VIOLET}/>
      </>}
      {ongletAff === 'influence' && (cache.figee ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Répondez aux quatre questions, puis cliquez sur « Vérifier » : l’expérience pourra alors être rejouée ici.</div> : <>
        {!enDefi && <>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Tige</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {['verre', 'ebonite'].map(k => <button key={k} onClick={() => setInfl(i => ({ ...i, tige: k }))} style={stylePetitBouton(infl.tige === k, VIOLET)}>{TIGES[k].court}</button>)}
          </div></>}
        <Curseur nom="Distance entre la boule et la tige" valeur={infl.d} onChange={v => setInfl(i => ({ ...i, d: v }))} min={1} max={12} pas={1} unite="cm" couleur={VIOLET}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setInfl(i => ({ ...i, d: 1, Q: sBo * Q_CONTACT }))} style={styleBouton(true, VERT)}>✋ Toucher la boule avec la tige</button>
          <button onClick={() => setInfl(i => ({ ...i, Q: 0 }))} style={styleBouton(false)}>↺ Décharger la boule</button>
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>Décharger : on touche la boule avec la main, ses charges en excès s’écoulent vers le sol.</div>
      </>)}
    </div>);

  const bilanTxt = (nom, v, c) => <LigneMesure nom={nom} valeur={v} couleur={c}/>;
  const mesures = !cache.bilan && (
    <div style={{ ...styleBoite, ...cadre('bilan') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Bilan des charges</div>
      {ongletAff === 'frottement' && <>
        {bilanTxt('Électrons transférés (dessin)', String(nFr))}
        {bilanTxt('Corps qui a perdu des électrons', nFr === 0 ? '—' : sFr > 0 ? 'la tige' : 'le tissu')}
        {bilanTxt('Charge de la tige', chg(tf), tf > 0 ? ROUGE : tf < 0 ? BLEU : undefined)}
        {bilanTxt('Charge du tissu', chg(-tf), tf < 0 ? ROUGE : tf > 0 ? BLEU : undefined)}
        {bilanTxt('Charge totale tige + tissu', '0')}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Ordre de grandeur réel : 1 nC correspond à environ 6 × 10⁹ électrons. Une tige frottée porte quelques nC.</div>
      </>}
      {ongletAff === 'interaction' && <>
        {bilanTxt('Charge de la paille', inter.paille < 0 ? 'négative' : 'positive', inter.paille < 0 ? BLEU : ROUGE)}
        {bilanTxt('Charge de la tige', inter.tige === 'neutre' ? 'nulle' : sIn > 0 ? 'positive' : 'négative', sIn > 0 ? ROUGE : sIn < 0 ? BLEU : undefined)}
        {bilanTxt('Interaction', sIn === 0 ? 'aucune' : forceIn > 0 ? 'attractive' : 'répulsive')}
        {bilanTxt('Mouvement de la paille', sIn === 0 ? 'immobile' : forceIn > 0 ? 'vers la tige' : 'à l’opposé de la tige')}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Le déplacement dessiné est schématique : seul son sens est à retenir.</div>
      </>}
      {ongletAff === 'influence' && <>
        {bilanTxt('Charge de la tige', sBo > 0 ? 'positive' : 'négative', sBo > 0 ? ROUGE : BLEU)}
        {bilanTxt('Charge totale de la boule', infl.Q === 0 ? '0 (neutre)' : chg(infl.Q), infl.Q > 0 ? ROUGE : infl.Q < 0 ? BLEU : undefined)}
        {bilanTxt('Face proche de la tige', IB.phi > 0.15 ? (sBo > 0 ? 'plutôt −' : 'plutôt +') : 'répartition uniforme')}
        {bilanTxt('Face éloignée', IB.phi > 0.15 ? (sBo > 0 ? 'plutôt +' : 'plutôt −') : 'répartition uniforme')}
        {bilanTxt('Interaction boule / tige', IB.type === 'aucune' ? 'aucune' : infl.d >= 11 ? 'négligeable' : IB.type === 'attr' ? (IB.influence ? 'attractive (influence)' : 'attractive') : 'répulsive')}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{infl.Q !== 0 ? `La boule a ${infl.Q > 0 ? 'perdu' : 'gagné'} ${Math.abs(infl.Q)} électrons au contact.` : 'Aucun électron n’a quitté la boule : ils se sont seulement déplacés.'}</div>
      </>}
    </div>);

  const serie = ongletAff === 'frottement' && !cache.bilan && (
    <div style={{ ...styleBoite, ...cadre('serie') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Série d’électrisation</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: ROUGE }}><span>+</span><span style={{ color: BLEU }}>−</span></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          {[['verre', 'verre'], ['tissu', 'tissu (peau de chat)'], ['ebonite', 'ébonite'], ['pp', 'polypropylène']].map(([k, l]) => (
            <div key={k} style={{ padding: '3px 8px', borderRadius: 6, border: `1.5px solid ${frot.tige === k ? VIOLET : KIT.bord}`, background: frot.tige === k ? '#f5f3ff' : 'white', fontWeight: frot.tige === k || k === 'tissu' ? 700 : 500 }}>{l}</div>))}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Plus un matériau est haut, plus il cède facilement ses électrons à un matériau situé plus bas. Cet ordre est donné par l’expérience : on ne le calcule pas.</div>
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Seuls les électrons se déplacent</strong> : c’est le modèle du programme. Les protons, liés aux noyaux, restent fixes. L’« électron arraché » est une représentation commode : en pratique, ce sont surtout des charges de surface, et pour les polymères les mécanismes (transferts d’électrons, d’ions ou de matière) sont plus complexes.</li>
      <li><strong>Le signe après frottement est empirique</strong> : on adopte l’ordre du cours (le verre cède des électrons au tissu ; l’ébonite et le polypropylène en gagnent). Les séries publiées ne concordent pas toujours (par exemple pour le verre et les fourrures) et le résultat dépend du tissu, de l’état de surface et de l’humidité.</li>
      <li><strong>Un petit nombre de charges</strong> est dessiné (8 de chaque signe, quelques électrons transférés) pour qu’on puisse les voir. Dans la réalité, une tige frottée porte de l’ordre de 10¹⁰ électrons en excès ou en défaut, soit quelques nanocoulombs.</li>
      <li><strong>Isolants et conducteurs</strong> : la tige (verre, ébonite, plastique) est isolante, donc ses charges restent là où le frottement les a déposées. La boule d’aluminium et le métal en général sont conducteurs : leurs électrons libres peuvent se déplacer dans tout le métal.</li>
      <li><strong>Influence</strong> : la répartition des charges dans la boule est schématique. Si on éloigne la tige sans contact, la boule redevient uniformément neutre.</li>
      <li><strong>Contact</strong> : on suppose que la boule prend, au contact, une charge de même signe que la tige (ici 2 charges élémentaires sur le dessin). La tige isolante, très chargée, n’en perd qu’une infime partie.</li>
      <li><strong>Forces</strong> : seul le <em>sens</em> (attraction ou répulsion) est exact. Les déplacements et les flèches sont schématiques ; la norme de la force suit la loi de Coulomb (voir la simulation « Deux corps en interaction »). Une tige non frottée est supposée sans effet : on néglige la polarisation d’un isolant.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Frottement : comparez le verre et l’ébonite. Quel corps perd des électrons dans chaque cas ? Que vaut toujours la charge totale tige + tissu ?</li>
        <li>Interaction : testez les trois tiges (y compris non frottée) avec la paille négative. Dans quels cas la paille est-elle attirée ? repoussée ?</li>
        <li>Influence : approchez la tige sans contact, puis éloignez-la. Que devient la boule ? Pourquoi est-elle attirée alors qu’elle est neutre ?</li>
        <li>Touchez la boule avec la tige en verre, puis approchez la tige en ébonite : que se passe-t-il ? Et avec la tige en verre ?</li>
        <li>Pourquoi ne peut-on pas électriser une tige en métal tenue à la main ? (Réfléchissez au rôle du conducteur.)</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>on électrise un corps en lui faisant gagner (charge −) ou perdre (charge +) des électrons ; les protons restent fixes</li>
        <li>deux corps de même signe se repoussent, de signes opposés s’attirent</li>
        <li>influence : un corps neutre conducteur est attiré par un corps chargé (charge totale nulle, mais charges séparées)</li>
        <li>au contact avec un corps chargé, il prend une charge de même signe, puis il est repoussé</li>
      </ul>
    </ARetenir>);

  const onglets = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 10px' }}>
      {[['frottement', '🧤 Frottement'], ['interaction', '↔️ Interaction (exp. B et C)'], ['influence', '⚪ Influence et contact (exp. A)']].map(([k, l]) =>
        <button key={k} onClick={() => setTab(k)} style={stylePetitBouton(tab === k, '#334155')}>{l}</button>)}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .el-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .el-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .el-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .el-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .el-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .el-l1.cote, .el-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Électrisation et influence électrostatique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une tige frottée acquiert une charge électrique : des électrons passent d’un corps à l’autre. Deux corps chargés s’attirent ou se repoussent,
        et un corps neutre peut lui-même être attiré (influence).</div>
      {mode === 'explore' && onglets}
      <div className={`el-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}>
            <VoletDefi defi={defi} setDefi={setDefi} changerType={lancerDefi}/></div>}
          <div className={`el-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      <div className="el-l2">{serie}</div>
      {!enDefi && <div className="el-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="el-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
