import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { useState, useRef, useEffect } from "react";
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
  ['electroscope', 'Électroscope : état des feuilles'],
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
const Q_ELE = 4;          // charge prise par l'électroscope au contact (en e)
const QR_ELE = 6;         // charge de la tige neuve utilisée avec l'électroscope (en e) ; au contact elle en cède Q_ELE à l'électroscope (conservation)
const K_INF = 3.5;        // charge déplacée vers les feuilles (ou vers la sphère) par une tige à distance minimale
// Électroscope : charge des feuilles ql (en e) = part de la charge nette + effet d'influence ; ouverture schématique
// qt : charge (valeur absolue) portée par la tige ; l'influence est proportionnelle à cette charge
function modeleEle(s, Q, d, qt = QR_ELE) {
  const phi = proxim(d, 1), ql = 0.5 * Q + s * phi * K_INF * qt / QR_ELE;
  return { phi, ql, theta: Math.min(40, 11 * Math.max(0, Math.abs(ql) - 0.5)) };
}
const sgn = q => (q > 0 ? '+' : q < 0 ? '−' : '');
const chg = q => (q === 0 ? '0' : `${sgn(q)}${Math.abs(q)}${NB}e`);
const tire = t => t[Math.floor(Math.random() * t.length)];

// ---------- dessin : une charge (disque rouge « + » ou bleu « − »), déplaçable avec transition ----------
function Charge({ x, y, s, r = 6, fantome, anim, vis = true }) {
  if (fantome) return <circle cx={x} cy={y} r={r} fill="none" stroke={BLEU} strokeWidth="1.2" strokeDasharray="2.5 2.5" opacity="0.6"/>;
  const col = s > 0 ? ROUGE : BLEU, a = r * 0.5;
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, opacity: typeof vis === 'number' ? vis : vis ? 1 : 0, transition: typeof vis === 'number' ? 'none' : `${anim ? 'transform 0.8s ease, ' : ''}opacity 0.35s ease` }}>
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
// Intensité relative de l'interaction pour un intervalle de « gap » pixels entre les deux corps (1 au contact)
const ampl = (gap, pxcm) => proxim(1 + Math.max(0, gap) / pxcm, 1);
// Coefficient signé de l'interaction boule / tige : > 0 attraction, < 0 répulsion ; 0,6 pour la seule influence
const coefBoule = (s, Q) => (s === 0 ? 0 : Q === 0 ? 0.6 : Q * s > 0 ? -1 : 1);

// Mouvement d'un corps mobile (boule suspendue, ou paille qui roule) : x en pixels, positif vers la tige.
// La force dépend de l'écart restant (gap0 − x) ; rappel du pendule (omega2), frottement visqueux (c), adhérence éventuelle.
// Valeur qui rejoint progressivement sa cible (lissage exponentiel, tau en secondes) : évite les sauts d'une image à l'autre
function useLisse(cible, tau = 0.14) {
  const [v, setV] = useState(cible), st = useRef({ v: cible, c: cible });
  useEffect(() => {
    st.current.c = cible;
    let raf, t0 = performance.now();
    const tick = t => {
      const s = st.current, dt = Math.min(0.05, (t - t0) / 1000);
      t0 = t;
      s.v += (s.c - s.v) * (1 - Math.exp(-dt / tau));
      if (Math.abs(s.c - s.v) < 0.002) { s.v = s.c; setV(s.v); return; }
      setV(s.v);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cible, tau]);
  return v;
}
// Positions animées d'une liste de points {x, y, o} : chacun rejoint sa cible en glissant (lissage exponentiel) ;
// c'est ce qui fait voyager visiblement chaque électron d'une zone à l'autre.
function useTrajets(cibles, tau = 0.3) {
  const [pos, setPos] = useState(cibles), st = useRef({ p: cibles.map(c => ({ ...c })), c: cibles });
  useEffect(() => {
    const S = st.current; S.c = cibles;
    let raf, t0 = performance.now();
    const tick = t => {
      const dt = Math.min(0.05, (t - t0) / 1000), k = 1 - Math.exp(-dt / tau);
      t0 = t;
      let bouge = false, change = false;
      S.p = S.p.map((q, i) => {
        const c = S.c[i], dx = c.x - q.x, dy = c.y - q.y, dof = c.o - q.o;
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dof) < 0.01) { if (dx || dy || dof) change = true; return { ...c }; }
        bouge = true; change = true;
        return { x: q.x + dx * k, y: q.y + dy * k, o: q.o + dof * k * 1.5 };
      });
      if (change) setPos(S.p);
      if (bouge) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cibles, tau]);
  return pos;
}
function useMobile(par) {
  const [x, setX] = useState(0);
  const st = useRef({ x: 0, v: 0, aff: 0 }), p = useRef(par);
  useEffect(() => { p.current = par; });
  useEffect(() => {
    let raf, t0 = performance.now();
    const tick = t => {
      const dt = Math.min(0.05, (t - t0) / 1000);
      t0 = t;
      const q = p.current, s = st.current, n = Math.max(1, Math.ceil(dt * 200));
      for (let i = 0; i < n; i++) {
        const h = dt / n, F = q.coef * q.F0 * ampl(q.gap0 - s.x, q.pxcm);
        if (q.statique && Math.abs(s.v) < 1e-3 && Math.abs(F) < q.statique) { s.v = 0; }          // la force ne vainc pas l'adhérence
        else { s.v += (F - q.omega2 * s.x - q.c * s.v) * h; s.x += s.v * h; }
        if (s.x >= q.gap0) {                                                                       // la tige arrête le corps
          s.x = q.gap0;
          if (s.v > 0) { if (q.coef > 0 && q.auto && q.onContact) q.onContact(); s.v = 0; }
        }
        if (s.x <= q.xmin) { s.x = q.xmin; if (s.v < 0) s.v = 0; }
      }
      if (Math.abs(s.x - s.aff) > 0.05) { s.aff = s.x; setX(s.x); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const reset = () => { st.current.x = 0; st.current.v = 0; st.current.aff = 0; setX(0); };
  return [x, reset];
}

// ---------- défis ----------
function nouveauDefi(type) {
  if (type === 'frottement') return { type, tige: tire(['verre', 'ebonite', 'pp']), n: tire([3, 4, 5, 6]), reps: {}, verifie: false };
  if (type === 'interaction') return { type, tige: tire(['verre', 'ebonite', 'pp']), paille: tire([1, -1]), reps: {}, verifie: false };
  return { type, tige: tire(['verre', 'ebonite']), reps: {}, verifie: false };
}
const TITRES_DEFIS = { frottement: 'Frottement', interaction: 'Signe de la tige', influence: 'Influence et contact', electroscope: 'Électroscope' };

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
  if (defi.type === 'electroscope') {
    const s = TIGES[defi.tige].signe;
    const attendu = { e1: 'ecartent', e2: s > 0 ? '+' : '-', e3: 'restent', e4: 'rapprochent' };
    const msg = {
      e1: 'La tige chargée déplace les électrons libres du métal : les feuilles se chargent toutes deux du même signe que la tige et se repoussent.',
      e2: s > 0 ? 'La tige + attire les électrons vers la sphère : les feuilles, privées d’électrons, sont chargées +.' : 'La tige − repousse les électrons vers les feuilles : elles se chargent −.',
      e3: 'Au contact, l’électroscope a gagné ou perdu des électrons : il reste chargé, donc les feuilles gardent des charges de même signe et restent écartées.',
      e4: 'Une tige de signe opposé attire (ou repousse) les électrons dans l’autre sens : les feuilles perdent leur excès de charge et se rapprochent.' };
    const lignes = ['e1', 'e2', 'e3', 'e4'].map(k => [r[k] === attendu[k], r[k] === attendu[k] ? `Question ${k[1]} : correct.` : `Question ${k[1]} : ${msg[k]}`]);
    return { ok: lignes.every(l => l[0]), lignes };
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
      {defi.type === 'electroscope' && <>
        {titre('🎯 Défi : les feuilles de l’électroscope')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          On approche d’un électroscope neutre une tige frottée <strong>chargée {s > 0 ? 'positivement' : 'négativement'}</strong> (sans contact). Puis on touche la sphère avec la tige et on l’éloigne.
          Enfin, on approche de l’électroscope une tige de <strong>signe opposé</strong>. <em>Prédisez avant de regarder.</em></div>
        {q('1. Tige approchée sans contact : les feuilles…')}
        {choix('e1', [['ecartent', 's’écartent'], ['fermees', 'restent fermées']])}
        {q('2. À ce moment, les feuilles sont chargées…')}
        {choix('e2', [['+', '+'], ['-', '−'], ['0', 'elles sont neutres']])}
        {q('3. Après le contact, la tige éloignée : les feuilles…')}
        {choix('e3', [['restent', 'restent écartées'], ['ferment', 'se referment']])}
        {q('4. On approche (à quelques cm) une tige de signe opposé : les feuilles…')}
        {choix('e4', [['rapprochent', 'se rapprochent'], ['ecartent', 's’écartent davantage']])}
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
        {defi.type === 'electroscope' && <>1. La tige {s > 0 ? '+ attire les électrons vers la sphère : les feuilles perdent des électrons et deviennent +' : '− repousse les électrons vers les feuilles : elles deviennent −'} ; les deux feuilles ont le même signe et se repoussent : elles s’écartent.
          {' '}3. Au contact, l’électroscope {s > 0 ? 'perd des électrons (passés sur la tige) : il est chargé +' : 'gagne des électrons : il est chargé −'} ; il le reste après l’éloignement de la tige, donc les feuilles restent écartées.
          {' '}4. La tige de signe opposé fait revenir des électrons vers les feuilles (ou les en chasse) : leur excès de charge disparaît et elles se rapprochent. Si on s’approche encore, elles peuvent se rouvrir avec la charge opposée.</>}
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
  const [inter, setInter] = useState({ tige: 'neutre', paille: -1, d: 10 });
  const [infl, setInfl] = useState({ tige: 'verre', d: 12, Q: 0 });
  const [ele, setEle] = useState({ tige: 'verre', d: 12, Q: 0 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const okVerre = frot.tige === 'verre' && frot.n >= 4;
  const okEbo = frot.tige === 'ebonite' && frot.n >= 4;
  const okB = inter.tige === 'ebonite' && inter.paille < 0 && inter.d <= 6;
  const okC = inter.tige === 'verre' && inter.paille < 0 && inter.d <= 6;
  const okDech = inter.tige === 'verre' && inter.paille < 0 && !!inter.neut;
  const okInf1 = infl.tige === 'verre' && infl.Q === 0 && infl.d >= 10;
  const okInf2 = infl.tige === 'verre' && infl.Q === 0 && infl.d <= 5;
  const okContact = infl.tige === 'verre' && infl.Q === Q_CONTACT;
  const okRepouss = okContact && infl.d >= 2;
  const okContactEbo = infl.tige === 'ebonite' && infl.Q === -Q_CONTACT;
  const sEl = TIGES[ele.tige].signe, qTig = ele.Q * sEl > 0 ? QR_ELE - Math.abs(ele.Q) : QR_ELE, EM = modeleEle(sEl, ele.Q, ele.d, qTig);
  const dAff = useLisse(ele.d), QAff = useLisse(ele.Q), qTigAff = useLisse(qTig), sElAff = useLisse(sEl);
  const EMa = modeleEle(sElAff, QAff, dAff, qTigAff);
  const okE1 = ele.tige === 'verre' && ele.Q === 0 && ele.d >= 10;
  const okE2 = ele.tige === 'verre' && ele.Q === 0 && ele.d <= 4;
  const okE3 = ele.tige === 'verre' && ele.Q === 0 && ele.d >= 10;
  const okE4 = ele.tige === 'verre' && ele.Q === Q_ELE;
  const okE5 = okE4 && ele.d >= 10;
  const okE6 = ele.tige === 'ebonite' && ele.Q === Q_ELE && EM.theta === 0;
  const okE7 = ele.tige === 'ebonite' && ele.Q === Q_ELE && EM.ql < -1 && EM.theta > 8;
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
    { id: 'dech', titre: 'Le contact : dé-électrisation', onglet: 'interaction', focus: ['reglages', 'scene'],
      texte: <>Gardez la tige <strong>en verre</strong> à 6 cm ou moins et laissez la paille la toucher (bouton « Replacer la paille » pour recommencer). Regardez les électrons.</>,
      tache: { type: 'action', ok: okDech, label: 'Paille au contact de la tige en verre', faire: () => { replacerPaille(); setInter({ tige: 'verre', paille: -1, d: 5 }); }, consigne: 'Paille au contact de la tige en verre' } },
    { id: 'dechq', titre: 'Après le contact', onglet: 'interaction', focus: ['scene', 'bilan'],
      texte: <>Lisez le bilan : que sont devenues les charges ?</>,
      tache: { type: 'qcm', q: 'Après le contact, la paille et la tige en verre sont…', options: ['toutes deux neutres : les électrons en excès de la paille sont passés sur la tige, qui en manquait', 'toutes deux encore chargées, la paille toujours −', 'toutes deux chargées +'], bonne: 0,
        expl: 'La paille avait des électrons en excès, la tige en manquait : au contact, ils passent de la paille à la tige. Les charges opposées se compensent : c’est la dé-électrisation. Plus de charge, plus de force : la paille ne bouge plus.' } },
    { id: 'inf1', titre: 'Expérience A : une boule neutre', onglet: 'influence', focus: ['reglages', 'scene'],
      texte: <>Une boule d’aluminium, <strong>neutre</strong>, est suspendue à un fil. Ses électrons sont libres de se déplacer (c’est un métal). Éloignez la tige en verre chargée (10 cm ou plus).</>,
      tache: { type: 'action', ok: okInf1, label: 'Tige en verre loin (≥ 10 cm), boule neutre', faire: () => setInfl({ tige: 'verre', d: 12, Q: 0 }), consigne: 'Tige en verre à 10 cm ou plus, boule neutre' } },
    { id: 'inf2', titre: 'Approcher la tige', onglet: 'influence', focus: ['reglages', 'scene'],
      texte: <>Approchez la tige en verre (5 cm ou moins), sans toucher la boule. Regardez comment les charges se déplacent et comment la boule réagit.</>,
      tache: { type: 'action', ok: okInf2, label: 'Tige en verre à 5 cm', faire: () => setInfl({ tige: 'verre', d: 5, Q: 0 }), consigne: 'Tige en verre à 5 cm ou moins, boule toujours neutre' } },
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
    { id: 'e1', titre: 'L’électroscope neutre', onglet: 'electroscope', focus: ['scene'],
      texte: <>L’électroscope est un appareil qui révèle la charge électrique : une sphère métallique, une tige métallique et deux fines feuilles métalliques, le tout relié (on les dessine avec leurs charges).
        Il est <strong>neutre</strong> et la tige en verre frottée est loin.</>,
      tache: { type: 'action', ok: okE1, label: 'Électroscope neutre, tige en verre loin', faire: () => setEle({ tige: 'verre', d: 12, Q: 0 }), consigne: 'Tige en verre à 10 cm ou plus, électroscope neutre' } },
    { id: 'e1q', titre: 'Feuilles fermées', onglet: 'electroscope', focus: ['scene', 'bilan'],
      texte: <>Observez les feuilles.</>,
      tache: { type: 'qcm', q: 'Pourquoi les feuilles de l’électroscope neutre restent-elles fermées ?', options: ['chaque feuille est neutre : il n’y a aucune charge à repousser', 'les feuilles sont trop lourdes', 'la sphère est chargée négativement'], bonne: 0,
        expl: 'Le métal contient autant de charges + que de charges − en chaque endroit : aucune force électrostatique n’écarte les feuilles.' } },
    { id: 'e2', titre: 'Approcher la tige (sans contact)', onglet: 'electroscope', focus: ['reglages', 'scene'],
      texte: <>Approchez la tige en verre chargée + (4 cm ou moins), sans toucher la sphère.</>,
      tache: { type: 'action', ok: okE2, label: 'Tige en verre à 4 cm ou moins', faire: () => setEle({ tige: 'verre', d: 3, Q: 0 }), consigne: 'Tige en verre à 4 cm ou moins, sans contact' } },
    { id: 'e2q', titre: 'Pourquoi les feuilles s’écartent', onglet: 'electroscope', focus: ['scene', 'bilan'],
      texte: <>Regardez où sont allés les électrons libres du métal.</>,
      tache: { type: 'qcm', q: 'Les feuilles s’écartent parce que…', options: ['les électrons sont attirés vers la sphère par la tige + ; les deux feuilles, privées d’électrons, sont chargées + et se repoussent', 'la tige a cédé ses électrons aux feuilles', 'la gravitation de la tige attire les feuilles'], bonne: 0,
        expl: 'C’est l’influence électrostatique. Les deux feuilles portent des charges de même signe : elles se repoussent. La charge totale de l’électroscope reste nulle.' } },
    { id: 'e3', titre: 'Éloigner la tige', onglet: 'electroscope', focus: ['reglages', 'scene'],
      texte: <>Éloignez la tige (10 cm ou plus), toujours sans contact.</>,
      tache: { type: 'action', ok: okE3, label: 'Tige éloignée (≥ 10 cm), sans contact', faire: () => setEle({ tige: 'verre', d: 12, Q: 0 }), consigne: 'Tige en verre éloignée, électroscope toujours neutre' } },
    { id: 'e3q', titre: 'Sans contact : retour à la normale', onglet: 'electroscope', focus: ['scene'],
      texte: <>Que deviennent les feuilles ?</>,
      tache: { type: 'qcm', q: 'Quand on éloigne la tige sans contact, les feuilles…', options: ['se referment : les électrons reviennent et l’électroscope est resté neutre', 'restent écartées : il est maintenant chargé', 'se rapprochent puis s’écartent'], bonne: 0,
        expl: 'Aucun électron n’a quitté l’électroscope : ils se sont seulement déplacés. Sans la tige, les charges se répartissent à nouveau uniformément.' } },
    { id: 'e4', titre: 'Toucher la sphère', onglet: 'electroscope', focus: ['reglages', 'scene'],
      texte: <>Cliquez sur « Toucher la sphère avec la tige ». Observez le sens du transfert d’électrons : de l’électroscope vers la tige. La tige, déficitaire en électrons, en récupère : elle perd donc une partie de sa charge +.</>,
      tache: { type: 'action', ok: okE4, label: 'Sphère touchée par la tige en verre', faire: () => setEle({ tige: 'verre', d: 1, Q: Q_ELE }), consigne: 'Contact entre la tige en verre et la sphère' } },
    { id: 'e4q', titre: 'La charge de l’électroscope', onglet: 'electroscope', focus: ['bilan'],
      texte: <>Lisez le bilan : au contact, des électrons sont passés de l’électroscope à la tige.</>,
      tache: { type: 'num', q: 'Charge de l’électroscope après le contact', unite: 'e (avec son signe)', vrai: Q_ELE, tol: 0.01, affiche: v => `+${v}`, cs: 1,
        bloque: okE4 ? null : 'Faites d’abord le contact avec la tige en verre (étape précédente).',
        pieges: [[-Q_ELE, 'Le signe : l’électroscope a perdu des électrons, il est donc positif.']],
        expl: `L’électroscope a perdu ${Q_ELE} électrons : q = +${Q_ELE}·e.` } },
    { id: 'e5', titre: 'Écarter la tige', onglet: 'electroscope', focus: ['reglages', 'scene'],
      texte: <>Éloignez la tige (10 cm ou plus) : l’électroscope est maintenant chargé.</>,
      tache: { type: 'action', ok: okE5, label: 'Tige éloignée, électroscope chargé +', faire: () => setEle({ tige: 'verre', d: 12, Q: Q_ELE }), consigne: 'Électroscope chargé +, tige à 10 cm ou plus' } },
    { id: 'e5q', titre: 'Les feuilles restent écartées', onglet: 'electroscope', focus: ['scene'],
      texte: <>Contrairement à l’influence seule, les feuilles restent ouvertes.</>,
      tache: { type: 'qcm', q: 'Pourquoi les feuilles restent-elles écartées, la tige étant loin ?', options: ['l’électroscope est chargé + (il a perdu des électrons) : les deux feuilles portent des charges de même signe', 'les feuilles gardent la mémoire de la tige', 'elles sont attirées par l’air'], bonne: 0,
        expl: 'L’électroscope porte maintenant un excès de charges + réparti sur sa sphère, sa tige et ses feuilles. Les feuilles, de même signe, se repoussent durablement.' } },
    { id: 'e6', titre: 'Une tige de signe opposé', onglet: 'electroscope', focus: ['reglages', 'scene'],
      texte: <>Choisissez la tige <strong>en ébonite</strong> (chargée −) et approchez-la lentement jusqu’à ce que les feuilles se referment (vers 3 à 4 cm).</>,
      tache: { type: 'action', ok: okE6, label: 'Tige en ébonite à 3 cm', faire: () => setEle({ tige: 'ebonite', d: 3, Q: Q_ELE }), consigne: 'Feuilles refermées, tige en ébonite' } },
    { id: 'e6q', titre: 'Pourquoi se referment-elles ?', onglet: 'electroscope', focus: ['scene', 'bilan'],
      texte: <>La tige négative repousse les électrons libres.</>,
      tache: { type: 'qcm', q: 'Les feuilles se referment parce que…', options: ['les électrons repoussés par la tige − descendent vers les feuilles et compensent leurs charges +', 'la tige en ébonite a neutralisé l’électroscope par contact', 'les feuilles ont perdu leurs protons'], bonne: 0,
        expl: 'Un électroscope chargé + voit ses feuilles se refermer quand on approche une tige −. Si on la rapproche encore, il arrive trop d’électrons : les feuilles se rouvrent, chargées −.' } },
    { id: 'e7', titre: 'Encore plus près', onglet: 'electroscope', focus: ['reglages', 'scene'],
      texte: <>Rapprochez encore la tige en ébonite (2 cm ou moins).</>,
      tache: { type: 'action', ok: okE7, label: 'Tige en ébonite à 1 cm', faire: () => setEle({ tige: 'ebonite', d: 1, Q: Q_ELE }), consigne: 'Feuilles écartées à nouveau, tige en ébonite très proche' } },
    { id: 'e7q', titre: 'Les feuilles se rouvrent', onglet: 'electroscope', focus: ['bilan'],
      texte: <>Lisez le bilan : la charge des feuilles a changé de signe.</>,
      tache: { type: 'qcm', q: 'Les feuilles sont maintenant chargées…', options: ['négativement : trop d’électrons ont été repoussés vers elles', 'positivement, comme l’électroscope', 'elles sont neutres'], bonne: 0,
        expl: 'La charge nette de l’électroscope reste +4 e, mais les feuilles portent un excès d’électrons : les charges + ont été attirées vers la sphère par la tige −.' } },
    { id: 'bravo', titre: 'Bravo !', onglet: 'electroscope', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>Un corps est neutre quand il contient autant de charges + que de charges −.</li>
        <li>On l’électrise en lui faisant gagner ou perdre des électrons ; seuls les électrons se déplacent, les protons restent fixes.</li>
        <li>Deux corps de même signe se repoussent, de signes opposés s’attirent.</li>
        <li>Un corps neutre conducteur est attiré par un corps chargé : c’est l’influence (charges séparées, charge totale nulle).</li>
        <li>Au contact, la boule prend la charge de même signe que la tige : elle est ensuite repoussée.</li>
        <li>Les feuilles d’un électroscope s’écartent quand elles portent des charges de même signe. Chargé par contact, il le reste ; une tige de signe opposé les rapproche.</li></ul>,
      texte: <>Vous savez interpréter les expériences d’électrisation. Essayez maintenant les défis.</>, tache: null },
  ];
  const ongletGuide = ETAPES[Math.min(etape, ETAPES.length - 1)].onglet;
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ MODES ET DÉFIS ════════════════
  const figee = enDefi && (defi.type === 'influence' || defi.type === 'electroscope') && !defi.reussi && !defi.solution;     // défi 3 : on prédit avant de voir
  const cache = enDefi ? { bilan: defi.type === 'frottement' || defi.type === 'interaction' || figee, reglages: defi.type === 'frottement', figee } : {};

  // ════════════════ MOUVEMENTS (paille qui roule, boule qui se balance) ════════════════
  const sIn = inter.tige === 'neutre' ? 0 : TIGES[inter.tige].signe;
  const neut = !!inter.neut;                                               // contact réalisé : charges opposées neutralisées (dé-électrisation)
  const forceBrute = sIn === 0 ? 0 : sIn * inter.paille < 0 ? 1 : -1;      // +1 attraction, −1 répulsion
  const forceIn = neut ? 0 : forceBrute;
  const gapP0 = 14 + (inter.d - 2) * 14;
  const [xP, replacerPaille] = useMobile({ gap0: gapP0, coef: forceIn, F0: 600, omega2: 0, c: 6, pxcm: 14, statique: 50, xmin: -90,
    auto: !enDefi && !(enGuide && etape < ETAPES.findIndex(e => e.id === 'dech')),                    // pas de contact « surprise » avant l'étape du contact
    onContact: () => setInter(i => (i.neut ? i : { ...i, neut: true })) });
  const progNeut = useLisse(neut ? 1 : 0, 0.4);                                                        // avancement du transfert d'électrons
  const sBo = TIGES[infl.tige].signe, coefB = coefBoule(sBo, infl.Q), gapB0 = (infl.d - 1) * 12;
  const contactAuto = !figee && !(enGuide && etape < ETAPES.findIndex(e => e.id === 'contact'));    // pas de contact « surprise » avant l'étape du contact
  const [xB] = useMobile({ gap0: gapB0, coef: coefB, F0: 500, omega2: 9, c: 2.5, pxcm: 12, xmin: -80, auto: contactAuto,
    onContact: () => setInfl(i => (i.Q === TIGES[i.tige].signe * Q_CONTACT ? i : { ...i, Q: TIGES[i.tige].signe * Q_CONTACT })) });


  const ongletDefi = !defi ? 'frottement' : defi.type;
  const ongletAff = enGuide ? ongletGuide : enDefi ? ongletDefi : tab;
  function lancerDefi(type) {
    const dd = nouveauDefi(type);
    setDefi(dd);
    if (type === 'frottement') setFrot({ tige: dd.tige, n: dd.n });
    else if (type === 'interaction') { setInter({ tige: dd.tige, paille: dd.paille, d: 10 }); replacerPaille(); }
    else if (type === 'influence') setInfl({ tige: dd.tige, d: 12, Q: 0 });
    else setEle({ tige: dd.tige, d: 12, Q: 0 });
  }
  function changerMode(md) {
    if (mode === 'defi' && md !== 'defi') { setFrot({ tige: 'verre', n: 0 }); setInter({ tige: 'neutre', paille: -1, d: 10 }); setInfl({ tige: 'verre', d: 12, Q: 0 }); setEle({ tige: 'verre', d: 12, Q: 0 }); }
    setMode(md);
    if (md === 'defi') lancerDefi(defi ? defi.type : 'frottement');
  }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);
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
  const scInteraction = (() => {
    const W = 640, H = 270, xs0 = 150, gap0 = gapP0, xs = xs0 + xP, xr = xs0 + 28 + gap0;
    const fort = forceIn !== 0 && ampl(gap0 - xP, 14) > 0.08;
    // Charges de base (sans les électrons « voyageurs ») : la paille − garde 8 électrons, la tige − en garde 8 ; + : 3 électrons manquent.
    // Les 3 électrons en excès (paille − ou tige −) sont dessinés à part : au contact avec un corps de charge opposée, ils passent de l'un à l'autre.
    const pS = nb => grille(3, 7, xs - 16, 78, 16, 26, 8, nb), pT = nb => grille(5, 4, xr + 28, 123, 36, 12.5, 8, nb);
    const sp = inter.paille, tigeVisible = inter.tige !== 'neutre';
    const paille = pS(sp < 0 ? 8 : 8 - Q_ROD);
    const tige = pT(sIn > 0 ? 8 - Q_ROD : 8);
    const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - Math.sin(Math.PI * k) * 16 });
    const voyage = (i, de, vers) => lerp(de, vers, Math.max(0, Math.min(1, progNeut * 1.3 - i * 0.12)));
    const extraP = pS(8 + Q_ROD).slice(8), manqP = pS(8).slice(8 - Q_ROD), extraT = pT(8 + Q_ROD).slice(8), manqT = pT(8).slice(8 - Q_ROD);
    const voyageurs = [];
    if (sp < 0) for (let i = 0; i < Q_ROD; i++) voyageurs.push(sIn > 0 && tigeVisible && !cache.bilan ? voyage(i, extraP[i], manqT[i]) : extraP[i]);
    if (sp > 0 && sIn < 0 && !cache.bilan) for (let i = 0; i < Q_ROD; i++) voyageurs.push(voyage(i, extraT[i], manqP[i]));
    if (sp < 0 && sIn < 0 && !cache.bilan) for (let i = 0; i < Q_ROD; i++) voyageurs.push(extraT[i]);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img"
        aria-label="Une paille chargée posée sur deux barres de verre et une tige frottée que l’on approche">
        <rect x="30" y="96" width="590" height="11" rx="5" fill="#bfdbfe" stroke="#0f172a" strokeWidth="1"/>
        <rect x="30" y="196" width="590" height="11" rx="5" fill="#bfdbfe" stroke="#0f172a" strokeWidth="1"/>
        <text x="620" y="90" textAnchor="end" fontSize="11" fill="#475569">barres de verre</text>
        <rect x={xs - 28} y="50" width="56" height="190" rx="18" fill="#fde68a" stroke="#0f172a" strokeWidth="1.5" opacity="0.7"/>
        <text x={xs} y="256" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">paille ({neut ? 'neutre' : inter.paille > 0 ? '+' : '−'})</text>
        {paille.map((c, i) => <Charge key={`p${i}`} x={c.x} y={c.y} s={c.s} r={5.5}/>)}
        <rect x={xr} y="116" width="200" height="58" rx="14" fill={inter.tige === 'neutre' || cache.bilan ? '#e2e8f0' : TIGES[inter.tige].couleur} stroke="#0f172a" strokeWidth="1.5" opacity="0.65"/>
        {inter.tige !== 'neutre' && (cache.bilan
          ? grille(5, 4, xr + 28, 123, 36, 12.5, 8, 6).map((c, i) => <Inconnue key={`h${i}`} x={c.x} y={c.y} r={5.5}/>)
          : tige.map((c, i) => <Charge key={`t${i}`} x={c.x} y={c.y} s={c.s} r={5.5}/>))}
        <text x={xr + 100} y="226" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">
          {inter.tige === 'neutre' ? 'tige non frottée (neutre)' : cache.bilan ? 'tige frottée : charge inconnue' : `tige ${TIGES[inter.tige].nom} frottée (${neut ? 'neutre' : sIn > 0 ? '+' : '−'})`}</text>
        {voyageurs.map((c, i) => <Charge key={`v${i}`} x={c.x} y={c.y} s={-1} r={5.5}/>)}
        {neut && <text x="400" y="24" textAnchor="middle" fontSize="13" fontWeight="700" fill="#15803d">Contact : les électrons passent d’un corps à l’autre, les deux deviennent neutres.</text>}
        {fort && <g>
          {fleche(xs - forceIn * 23, 30, forceIn, 46, ROUGE, 3.2, 'f1')}{etiquetteVec(xs, 18, 'F', 'tige/paille', ROUGE, 'e1', 13)}
          {fleche(xr + 100 + forceIn * 23, 30, -forceIn, 46, ORANGE, 3.2, 'f2')}{etiquetteVec(xr + 100, 18, 'F', 'paille/tige', ORANGE, 'e2', 13)}
        </g>}
        {sIn === 0 && <text x="400" y="60" textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">Tige neutre : aucune interaction électrostatique (modèle).</text>}
      </svg>);
  })();

  // ════════════════ SCÈNE 3 : INFLUENCE ET CONTACT (expérience A) ════════════════
  const dEff = 1 + Math.max(0, gapB0 - xB) / 12;                // distance effective boule–tige (cm), au contact : 1
  const IB = { type: coefB > 0 ? 'attr' : coefB < 0 ? 'rep' : 'aucune', amp: Math.abs(coefB) * proxim(dEff, 1), phi: coefB === 0 ? 0 : proxim(dEff, 1), influence: infl.Q === 0 && coefB > 0 };
  const repInf = (() => {
    const W = 640, H = 312, px = 200, R = 56, L = 168, xrod = 256 + gapB0;
    const dx = xB;
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
    // chaque électron garde son identité (indice k) ; coordonnées relatives au centre de la boule, pour suivre son balancement.
    // Un électron cédé à la tige (ou pris à la tige) voyage vers/depuis la tige.
    const cibles = elec.map((e, k) => {
      const q = place(e, true);
      if (visibles.some(o => o.k === k)) return { x: q.x - xb, y: q.y - yb, o: 1 };
      return { x: xrod + 12 - xb, y: 182 + (k % 3) * 8 - yb, o: 0 };
    });
    return { W, H, px, R, xrod, xb, yb, prot, place, cibles };
  })();
  const ePosI = useTrajets(repInf.cibles);
  const scInfluence = (() => {
    const { W, H, R, xrod, xb, yb, prot, place } = repInf;
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
        {ePosI.map((q, k) => <Charge key={`be${k}`} x={xb + q.x} y={yb + q.y} s={-1} r={5} vis={q.o}/>)}
        <text x={xb} y={yb + R + 17} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">boule d’aluminium{infl.Q !== 0 ? ` (${sgn(infl.Q)})` : ' (neutre)'}</text>
        {IB.type !== 'aucune' && dEff < 9 && <g>
          {fleche(xb, 294, gaucheAttr ? 1 : -1, 42, ROUGE, 3.2, 'f1')}{etiquetteVec(xb + (gaucheAttr ? 21 : -21), 284, 'F', 'tige/boule', ROUGE, 'e1', 13)}
          {fleche(xrod + 100, 294, gaucheAttr ? -1 : 1, 42, ORANGE, 3.2, 'f2')}{etiquetteVec(xrod + 100 + (gaucheAttr ? -21 : 21), 284, 'F', 'boule/tige', ORANGE, 'e2', 13)}
        </g>}
        {cache.figee && <text x="430" y="60" textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">Prédisez avant de regarder (voir le défi).</text>}
      </svg>);
  })();

  // ════════════════ SCÈNE 4 : ÉLECTROSCOPE ════════════════
  const repEle = (() => {
    const W = 480, H = 335, cx = 150, cy = 84, R = 36, xr = cx + R + 4 + (dAff - 1) * 8;
    const NP = 14, PL = 6, total = NP - ele.Q;                       // protons : sphère 5, tige 3, feuilles 6
    let El = Math.max(0, Math.min(10, 2 * Math.round((PL - EMa.ql) / 2)));
    El = Math.min(El, total - 0);
    if (El % 2) El -= 1;
    const reste = total - El, Et = Math.min(8, Math.round(reste * 3 / 8)), Es = reste - Et;
    // sphère : 5 protons sur un cercle intérieur, électrons à côté (puis sur un cercle extérieur), décalés par l'influence
    const decal = sElAff * EMa.phi * 0.3 * R, cote = [];
    for (let k = 0; k < 5; k++) { const a = (18 + 72 * k) * Math.PI / 180; cote.push({ x: Math.cos(a) * 0.5 * R, y: Math.sin(a) * 0.5 * R, p: true }); }
    const eS = [];
    for (let k = 0; k < 10; k++) {
      const a = k < 5 ? (18 + 72 * k + 40) * Math.PI / 180 : (k * 51 + 10) * Math.PI / 180, r = k < 5 ? 0.62 * R : 0.78 * R;
      eS.push({ x: Math.cos(a) * r + decal, y: Math.sin(a) * r });
    }
    const placeS = q => { let { x, y } = q; const r = Math.hypot(x, y), rm = 0.84 * R; if (r > rm) { x *= rm / r; y *= rm / r; } return { x: cx + x, y: cy + y }; };
    // feuilles
    const piv = { x: cx, y: 238 }, Lf = 68, th = EMa.theta * Math.PI / 180;
    // un électron = une identité (indice i) : feuilles d'abord, puis tige, puis sphère ; les derniers sont partis dans la tige (ou en viennent)
    const folles = sg => ({ x: Math.sin(th) * sg, y: Math.cos(th) });
    const cibles = Array.from({ length: 18 }, (_, i) => {
      if (i < El) {
        const sg = i % 2 ? 1 : -1, j = i >> 1, f = [0.18, 0.4, 0.62, 0.84, 1.0][j], dir = folles(sg), perp = { x: dir.y, y: -dir.x };
        return { x: piv.x + dir.x * Lf * f - sg * perp.x * 5.8, y: piv.y + dir.y * Lf * f - sg * perp.y * 5.8, o: 1 };
      }
      if (i < El + Et) return { x: cx + 3.5, y: 132 + 12.5 * (Et - 1 - (i - El)), o: 1 };
      if (i < total) { const c = placeS(eS[i - El - Et] || eS[0]); return { x: c.x, y: c.y, o: 1 }; }
      return { x: xr + 8, y: cy - 8 + (i % 3) * 8, o: 0 };
    });
    return { W, H, cx, cy, R, xr, El, piv, Lf, th, cote, placeS, cibles };
  })();
  const ePos = useTrajets(repEle.cibles);
  const scElectroscope = (() => {
    const { W, H, cx, cy, R, xr, El, piv, Lf, th, cote, placeS } = repEle;
    const feuille = sg => {
      const dir = { x: sg * Math.sin(th), y: Math.cos(th) }, perp = { x: dir.y, y: -dir.x };
      const pts = [];
      [0.3, 0.62, 0.94].forEach((f, i) => pts.push(<Charge key={`fp${sg}${i}`} s={1} r={4.4} x={piv.x + dir.x * Lf * f + sg * perp.x * 5.8} y={piv.y + dir.y * Lf * f + sg * perp.y * 5.8}/>));
      return <g key={`feuille${sg}`}><line x1={piv.x} y1={piv.y} x2={piv.x + dir.x * (Lf + 5)} y2={piv.y + dir.y * (Lf + 5)} stroke="#94a3b8" strokeWidth="7" strokeLinecap="round"/>{pts}</g>;
    };
    const tigeCh = grille(5, 4, xr + 16, 62, 22, 12.5, 8, sEl > 0 ? 8 - qTig : 8 + qTig);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img"
        aria-label="Un électroscope à feuilles et une tige chargée que l’on approche de sa sphère">
        <rect x={cx - 70} y="158" width="140" height="158" rx="12" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5"/>
        <rect x={cx - 20} y="150" width="40" height="12" rx="3" fill="#475569"/>
        <rect x={cx - 9} y="118" width="18" height="120" rx="4" fill="#d1d5db" stroke="#0f172a" strokeWidth="1.2"/>
        <rect x={xr} y="55" width="120" height="58" rx="14" fill={TIGES[ele.tige].couleur} stroke="#0f172a" strokeWidth="1.5" opacity="0.65"/>
        {tigeCh.map((c, i) => <Charge key={`t${i}`} x={c.x} y={c.y} s={c.s} r={5.2}/>)}
        <text x={xr + 60} y="132" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">tige {TIGES[ele.tige].court} ({sEl > 0 ? '+' : '−'})</text>
        <circle cx={cx} cy={cy} r={R} fill="#d1d5db" stroke="#0f172a" strokeWidth="1.8"/>
        {cote.map((q, i) => { const c = placeS(q); return <Charge key={`sp${i}`} x={c.x} y={c.y} s={1} r={4.8}/>; })}
        {[0, 1, 2].map(i => <Charge key={`tp${i}`} x={cx - 3.5} y={134 + 34 * i} s={1} r={4.4}/>)}
        {feuille(-1)}{feuille(1)}
        {ePos.map((q, i) => <Charge key={`el${i}`} x={q.x} y={q.y} s={-1} r={4.6} vis={q.o}/>)}
        <circle cx={piv.x} cy={piv.y} r="3.5" fill="#0f172a"/>
        <text x={cx - R - 6} y={cy + 4} textAnchor="end" fontSize="12" fill="#334155">sphère</text>
        <text x={cx + 76} y="196" fontSize="12" fill="#334155">tige métallique</text>
        <text x={cx + 76} y="300" fontSize="12" fill="#334155">feuilles</text>
        <text x={cx} y="332" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">électroscope{ele.Q !== 0 ? ` (${sgn(ele.Q)})` : ' (neutre)'}</text>
        {cache.figee && <text x="340" y="255" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#64748b">Prédisez avant de regarder</text>}
      </svg>);
  })();

  // ════════════════ PANNEAUX ════════════════
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {ongletAff === 'frottement' && scFrottement}
      {ongletAff === 'interaction' && scInteraction}
      {ongletAff === 'influence' && scInfluence}
      {ongletAff === 'electroscope' && scElectroscope}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        <span style={{ color: ROUGE, fontWeight: 700 }}>●+</span> proton (fixe) · <span style={{ color: BLEU, fontWeight: 700 }}>●−</span> électron (mobile).
        {' '}Quelques charges seulement sont dessinées : dans la réalité, il y en a un nombre énorme (une tige frottée porte de l’ordre de 10¹⁰ électrons en excès ou en défaut).
      </div>
    </div>);

  const choixTige = (etat, setEtat, avecNeutre, reinit) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {Object.entries(TIGES).filter(([k]) => reinit || k !== 'pp').map(([k, t]) =>
        <button key={k} onClick={() => setEtat(e => ({ ...e, tige: k, ...(reinit ? { n: 0 } : {}), ...(e.neut !== undefined ? { neut: false } : {}) }))} style={stylePetitBouton(etat.tige === k, VIOLET)}>{t.court}</button>)}
      {avecNeutre && <button onClick={() => setEtat(e => ({ ...e, tige: 'neutre', ...(e.neut !== undefined ? { neut: false } : {}) }))} style={stylePetitBouton(etat.tige === 'neutre', VIOLET)}>tige non frottée</button>}
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
        <Curseur nom="Distance entre la paille et la tige (au départ)" valeur={inter.d} onChange={v => setInter(i => ({ ...i, d: v, neut: false }))} min={2} max={14} pas={1} unite="cm" couleur={VIOLET}/>
        <button onClick={() => { replacerPaille(); setInter(i => ({ ...i, neut: false })); }} style={styleBouton(false)}>↩ Replacer la paille</button>
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
      {ongletAff === 'electroscope' && (cache.figee ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Répondez aux quatre questions, puis cliquez sur « Vérifier » : l’expérience pourra alors être rejouée ici.</div> : <>
        {!enDefi && <>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Tige</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {['verre', 'ebonite'].map(k => <button key={k} onClick={() => setEle(i => ({ ...i, tige: k }))} style={stylePetitBouton(ele.tige === k, VIOLET)}>{TIGES[k].court}</button>)}
          </div></>}
        <Curseur nom="Distance entre la sphère et la tige" valeur={ele.d} onChange={v => setEle(i => ({ ...i, d: v }))} min={1} max={12} pas={1} unite="cm" couleur={VIOLET}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setEle(i => ({ ...i, d: 1, Q: sEl * Q_ELE }))} style={styleBouton(true, VERT)}>✋ Toucher la sphère avec la tige</button>
          <button onClick={() => setEle(i => ({ ...i, Q: 0 }))} style={styleBouton(false)}>↺ Décharger l’électroscope</button>
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>Décharger : on touche la sphère avec la main, les charges en excès s’écoulent vers le sol.</div>
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
        {bilanTxt('Charge de la paille', neut ? 'nulle (neutralisée)' : inter.paille < 0 ? 'négative' : 'positive', neut ? undefined : inter.paille < 0 ? BLEU : ROUGE)}
        {bilanTxt('Charge de la tige', inter.tige === 'neutre' || neut ? 'nulle' : sIn > 0 ? 'positive' : 'négative', neut ? undefined : sIn > 0 ? ROUGE : sIn < 0 ? BLEU : undefined)}
        {bilanTxt('Interaction', sIn === 0 ? 'aucune' : neut ? 'aucune (plus de charges)' : forceIn > 0 ? 'attractive' : 'répulsive')}
        {bilanTxt('Mouvement de la paille', sIn === 0 ? 'immobile' : neut ? 'immobile (paille et tige neutres)' : forceIn > 0 ? (gapP0 - xP < 1 ? 'collée à la tige' : 600 * ampl(gapP0 - xP, 14) < 50 ? 'immobile (force trop faible)' : 'vers la tige') : (xP <= -89 ? 'au bout des barres' : 600 * ampl(gapP0 - xP, 14) < 50 ? 'immobile' : 'à l’opposé de la tige'))}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Si la tige est assez proche, la paille roule jusqu’à la toucher (ou s’éloigne). Trop loin, la force ne suffit pas à la faire rouler. Si les charges sont opposées, le contact les neutralise : c’est la dé-électrisation.</div>
      </>}
      {ongletAff === 'influence' && <>
        {bilanTxt('Charge de la tige', sBo > 0 ? 'positive' : 'négative', sBo > 0 ? ROUGE : BLEU)}
        {bilanTxt('Charge totale de la boule', infl.Q === 0 ? '0 (neutre)' : chg(infl.Q), infl.Q > 0 ? ROUGE : infl.Q < 0 ? BLEU : undefined)}
        {bilanTxt('Face proche de la tige', IB.phi > 0.15 ? (sBo > 0 ? 'plutôt −' : 'plutôt +') : 'répartition uniforme')}
        {bilanTxt('Face éloignée', IB.phi > 0.15 ? (sBo > 0 ? 'plutôt +' : 'plutôt −') : 'répartition uniforme')}
        {bilanTxt('Interaction boule / tige', IB.type === 'aucune' ? 'aucune' : dEff >= 10 ? 'négligeable' : IB.type === 'attr' ? (IB.influence ? 'attractive (influence)' : 'attractive') : 'répulsive')}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{infl.Q !== 0 ? `La boule a ${infl.Q > 0 ? 'perdu' : 'gagné'} ${Math.abs(infl.Q)} électrons au contact.` : 'Aucun électron n’a quitté la boule : ils se sont seulement déplacés.'}</div>
      </>}
      {ongletAff === 'electroscope' && <>
        {bilanTxt('Charge de la tige', chg(sEl * qTig), sEl > 0 ? ROUGE : BLEU)}
        {bilanTxt('Charge totale de l’électroscope', ele.Q === 0 ? '0 (neutre)' : chg(ele.Q), ele.Q > 0 ? ROUGE : ele.Q < 0 ? BLEU : undefined)}
        {bilanTxt('Charge des feuilles', Math.abs(EM.ql) <= 0.5 ? 'quasi nulle' : EM.ql > 0 ? 'positive' : 'négative', Math.abs(EM.ql) <= 0.5 ? undefined : EM.ql > 0 ? ROUGE : BLEU)}
        {bilanTxt('Feuilles', EM.theta === 0 ? 'fermées' : EM.theta < 12 ? 'peu écartées' : EM.theta < 25 ? 'écartées' : 'très écartées')}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{ele.Q !== 0 ? `L’électroscope a ${ele.Q > 0 ? 'perdu' : 'gagné'} ${Math.abs(ele.Q)} électrons au contact ; la tige en a ${ele.Q > 0 ? 'gagné' : 'cédé'} autant : la charge totale est conservée.` : 'Aucun électron n’a quitté l’électroscope : ils se sont seulement déplacés.'} Les deux feuilles, de même signe, se repoussent.</div>
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
      <li><strong>Dé-électrisation</strong> : on suppose que la paille et la tige portent des charges opposées égales : au contact, elles se neutralisent complètement. En réalité, ce sont des isolants : le transfert est local et souvent partiel.</li>
      <li><strong>Électroscope</strong> : les charges se répartissent entre la sphère, la tige et les feuilles ; le dessin donne aux feuilles environ la moitié de l’excès de charge, ce qui est schématique (en réalité, c’est la forme de l’appareil qui décide). L’angle des feuilles, calculé à partir de leur charge, est qualitatif : l’écart réel résulte d’un équilibre entre le poids des feuilles et leur répulsion. Au contact, l’électroscope prend 4 charges élémentaires sur le dessin.</li>
      <li><strong>Mouvements</strong> : la boule et la paille bougent selon un modèle simple (force qui diminue quand la distance augmente, rappel du fil pour la boule, frottement pour la paille). Les valeurs sont qualitatives : seuls le sens du mouvement et le fait qu’il y ait contact ou non sont significatifs. Une boule neutre est attirée jusqu’au contact si la tige est assez proche (environ 4 cm ou moins sur le dessin), puis elle prend la charge de la tige et est repoussée. La paille roule jusqu’à la tige si elle est assez proche et s’arrête à son contact (on ne simule pas d’échange de charge à ce moment).</li>
      <li><strong>Forces</strong> : seul le <em>sens</em> (attraction ou répulsion) est exact ; la norme suit la loi de Coulomb (voir la simulation « Deux corps en interaction »). Une tige non frottée est supposée sans effet : on néglige la polarisation d’un isolant.</li>
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
        <li>Électroscope : chargez-le par contact avec le verre, puis approchez l’ébonite doucement. À quelle distance les feuilles se referment-elles ? Que se passe-t-il si on s’approche encore ?</li>
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
        <li>électroscope : les feuilles, chargées du même signe, se repoussent ; une tige de signe opposé les rapproche</li>
      </ul>
    </ARetenir>);

  const onglets = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 10px' }}>
      {[['frottement', '🧤 Frottement'], ['interaction', '↔️ Interaction (exp. B et C)'], ['influence', '⚪ Influence et contact (exp. A)'], ['electroscope', '🔬 Électroscope']].map(([k, l]) =>
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
