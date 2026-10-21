import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { useState, Children, Fragment, cloneElement, isValidElement } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, lireProgression, fmt, sci } from "../commun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 52 — MOUVEMENT D'UN SYSTÈME : VARIATION DU VECTEUR VITESSE ET FORCES (1G, chapitre 10)
//  Chronophotographies (positions fournies par un modèle), vecteurs vitesse v_[i] ≈ A(i−1)A(i+1)/2τ,
//  variation Δv = v_(i+k) − v_(i−k), relation approchée ΣF ≈ m·Δv/Δt ; méthode d'Euler pour prédire le mouvement.
// ====================================================

const SIM = 52;
// indices entre crochets : A_[i−1], v_[i+k] … (avecIndices ne gère pas les indices contenant « + »)
const idx = t => { if (typeof t !== 'string' || !t.includes('_[')) return t;
  const r = []; t.split(/(_\[[^\]]*\])/).forEach((m, q) => { const g = /^_\[([^\]]*)\]$/.exec(m); r.push(g ? <sub key={q}>{g[1]}</sub> : m); }); return <>{r}</>; };
const idxDeep = n => { if (typeof n === 'string') return idx(n); if (Array.isArray(n)) return Children.map(n, idxDeep);
  if (isValidElement(n) && (typeof n.type === 'string' || n.type === Fragment) && n.props.children != null)
    return cloneElement(n, undefined, ...Children.toArray(n.props.children).map(idxDeep)); return n; };
const G0 = 9.8;
const ROUGE = '#dc2626', VERT = '#16a34a', BLEU = '#2563eb', ORANGE = '#c2410c', VIOLET = '#7c3aed', NOIR = '#0f172a', GRIS = '#64748b';

declarerDefis(SIM, [
  ['force', 'Trouver la force à partir du mouvement'],
  ['delta', 'Prédire la variation de vitesse'],
  ['masse', 'Rôle de la masse'],
]);

// ---------- constantes de la Lune ----------
const JOUR = 86400, MT = 5.972e24, ML = 7.3477e22, GC = 6.67e-11, RL = 3.844e8, TL = (27 + 7 / 24 + 43 / 1440) * JOUR;
const OM = 2 * Math.PI / TL;

// ---------- scénarios : le mouvement exact est fourni par un modèle (choix pédagogique) ----------
const Fo = (k, fx, fy, col) => ({ k, fx, fy, col });
const U_SI = { Lf: 1, Lu: 'm', Vf: 1, Vu: 'm/s', Tf: 1, Tu: 's', Fu: 'N' };
const U_LUNE = { Lf: 1e-3, Lu: 'km', Vf: 1e-3, Vu: 'km/s', Tf: 1 / JOUR, Tu: 'jours', Fu: 'N' };

const SCEN = {
  chute: { label: 'Chute libre', icone: '⬇️', def: { m: 0.1 }, params: ['m'],
    build: p => ({ m: p.m, tau: 0.12, N: 12, U: U_SI, decal: [1, 0], taille: 9, aff: 'bille de masse m',
      exact: t => ({ x: 0, y: -0.5 * G0 * t * t, vx: 0, vy: -G0 * t }),
      forces: () => [Fo('P', 0, -p.m * G0, ROUGE)] }) },
  vertical: { label: 'Lancer vertical', icone: '⬆️', def: { m: 0.1 }, params: ['m'],
    build: p => ({ m: p.m, tau: 0.12, N: 12, U: U_SI, decal: [1, 0], taille: 3.2, aff: 'bille de masse m',
      exact: t => ({ x: 0, y: 5 * t - 0.5 * G0 * t * t, vx: 0, vy: 5 - G0 * t }),
      forces: () => [Fo('P', 0, -p.m * G0, ROUGE)] }) },
  biais: { label: 'Lancer en biais', icone: '↗️', def: { m: 0.1 }, params: ['m'],
    build: p => ({ m: p.m, tau: 0.12, N: 12, U: U_SI, decal: null, taille: 3.6, aff: 'bille de masse m',
      exact: t => ({ x: 2.8 * t, y: 4.2 * t - 0.5 * G0 * t * t, vx: 2.8, vy: 4.2 - G0 * t }),
      forces: () => [Fo('P', 0, -p.m * G0, ROUGE)] }) },
  mobile: { label: 'Mobile tiré par un fil', icone: '🛷', def: { m: 0.5, F: 0.5 }, params: ['m', 'F'],
    build: p => { const a = p.F / p.m; return { m: p.m, tau: 0.1, N: 12, U: U_SI, decal: [0, 1], taille: 1.3, aff: 'mobile auto-porteur (coussin d’air, frottements négligeables)',
      exact: t => ({ x: 0.4 * t + 0.5 * a * t * t, y: 0, vx: 0.4 + a * t, vy: 0 }),
      forces: () => [Fo('P', 0, -p.m * G0, ROUGE), Fo('R', 0, p.m * G0, BLEU), Fo('T', p.F, 0, ORANGE)] }; } },
  plan: { label: 'Plan incliné', icone: '📐', def: { m: 0.5, alpha: 25 }, params: ['m', 'alpha'],
    build: p => { const al = p.alpha * Math.PI / 180, a = G0 * Math.sin(al), c = Math.cos(al), s = Math.sin(al);
      return { m: p.m, tau: 0.2, N: 12, U: U_SI, decal: [s, c], taille: 1.6, aff: 'solide sur un plan incliné (sans frottement)',
        exact: t => ({ x: 0.5 * a * t * t * c, y: -0.5 * a * t * t * s, vx: a * t * c, vy: -a * t * s }),
        forces: () => [Fo('P', 0, -p.m * G0, ROUGE), Fo('R', p.m * G0 * c * s, p.m * G0 * c * c, BLEU)] }; } },
  parachute: { label: 'Parachutiste', icone: '🪂', def: { m: 100 }, params: [],
    build: () => { const vt = 6, v0 = 15, a0 = 0.5 * Math.log((v0 / vt + 1) / (v0 / vt - 1)), m = 100, k = G0 / vt;
      return { m, tau: 0.3, N: 12, U: U_SI, decal: [1, 0], taille: 40, aff: 'parachutiste + parachute (m = 100 kg)',
        exact: t => ({ x: 0, y: -(vt * vt / G0) * Math.log(Math.sinh(k * t + a0) / Math.sinh(a0)), vx: 0, vy: -vt / Math.tanh(k * t + a0) }),
        forces: s => [Fo('P', 0, -m * G0, ROUGE), Fo('f', 0, m * G0 * (s.vy / vt) ** 2, BLEU)] }; } },
  lune: { label: 'La Lune autour de la Terre', icone: '🌙', def: { m: ML }, params: [],
    build: () => ({ m: ML, tau: JOUR, N: 14, U: U_LUNE, decal: null, taille: 2 * RL, aff: 'la Lune (orbite circulaire, référentiel géocentrique)', terre: true,
      exact: t => ({ x: RL * Math.cos(OM * t), y: RL * Math.sin(OM * t), vx: -RL * OM * Math.sin(OM * t), vy: RL * OM * Math.cos(OM * t) }),
      forces: s => { const r = Math.hypot(s.x, s.y), f = GC * ML * MT / (r * r); return [Fo('F', -f * s.x / r, -f * s.y / r, ROUGE)]; } }) },
};
const ORDRE = ['chute', 'vertical', 'biais', 'mobile', 'plan', 'parachute', 'lune'];
const construire = e => SCEN[e.id].build(e);
const hyp = (x, y) => Math.hypot(x, y);
const somme = fl => ({ x: fl.reduce((a, f) => a + f.fx, 0), y: fl.reduce((a, f) => a + f.fy, 0) });

// ---------- calculs : positions (éventuellement bruitées), vecteurs vitesse, variation Δv ----------
const alea = (j, a) => { const x = Math.sin(j * 12.9898 + a * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
function analyser(S, bruit) {
  const pts = Array.from({ length: S.N }, (_, j) => {
    const t = j * S.tau, e = S.exact(t);
    return { t, e, x: e.x + bruit * 0.01 * S.taille * alea(j, 1), y: e.y + bruit * 0.01 * S.taille * alea(j, 2) };
  });
  const v = pts.map((p, j) => (j === 0 || j === S.N - 1 ? null :
    { x: (pts[j + 1].x - pts[j - 1].x) / (2 * S.tau), y: (pts[j + 1].y - pts[j - 1].y) / (2 * S.tau) }));
  return { pts, v };
}
function dvEn(A, S, i, k) {
  const a = A.v[i + k], b = A.v[i - k];
  return a && b ? { x: a.x - b.x, y: a.y - b.y, dt: 2 * k * S.tau } : null;
}
function euler(S, dt) {
  const T = (S.N - 1) * S.tau, e0 = S.exact(0);
  let { x, y, vx, vy } = e0;
  const sortie = [{ x, y }], n = Math.round(T / dt);
  for (let q = 0; q < n; q++) {
    const F = somme(S.forces({ x, y, vx, vy })), ax = F.x / S.m, ay = F.y / S.m;
    x += vx * dt; y += vy * dt; vx += ax * dt; vy += ay * dt;      // la position utilise la vitesse du début du pas
    sortie.push({ x, y });
  }
  return sortie;
}
const FCIN_LUNE = (() => { const S = SCEN.lune.build({}), A = analyser(S, 0), d = dvEn(A, S, 5, 1); return S.m * hyp(d.x, d.y) / d.dt; })();
const F_GRAV_LUNE = GC * ML * MT / (RL * RL);

// ---------- mise en forme ----------
const vir = s => String(s).replace('.', ',');
const nb = x => { if (!isFinite(x)) return '—'; const a = Math.abs(x); if (a === 0) return '0'; if (a >= 1e5 || a < 1e-2) return sci(x, 3);
  return fmt(x, a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3); };
const nice = x => { const e = 10 ** Math.floor(Math.log10(x)), m = x / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };
function direction(x, y) {
  if (hyp(x, y) < 1e-12) return '—';
  const ang = Math.atan2(y, x) * 180 / Math.PI, a = (ang + 360) % 360, noms = ['➡ vers la droite', '↗ vers le haut et la droite', '⬆ vers le haut', '↖ vers le haut et la gauche', '⬅ vers la gauche', '↙ vers le bas et la gauche', '⬇ vers le bas', '↘ vers le bas et la droite'];
  return `${noms[Math.round(a / 45) % 8]} (${Math.round(ang)}°)`;
}
const angleEntre = (a, b) => { const na = hyp(a.x, a.y), nbb = hyp(b.x, b.y); if (na < 1e-12 || nbb < 1e-12) return NaN;
  return Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / (na * nbb)))) * 180 / Math.PI; };

// ---------- dessin ----------
function Fleche({ x1, y1, x2, y2, col, w = 2.4, dash, op = 1 }) {
  const L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 2) return null;
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, t = Math.min(9, L * 0.5), hw = 4.4, bx = x2 - ux * t, by = y2 - uy * t;
  return <g opacity={op}><line x1={x1} y1={y1} x2={bx} y2={by} stroke={col} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round"/>
    <path d={`M${x2},${y2} L${bx - uy * hw},${by + ux * hw} L${bx + uy * hw},${by - ux * hw} z`} fill={col}/></g>;
}
const EF = [2, 1, 0.5, 0.25, 0.1];

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
function nouveauDefi(type) {
  const sg = tire([1, -1]);
  if (type === 'force') return { type, m: tire([0.3, 0.4, 0.5, 0.6, 0.8]), F: sg * tire([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.9]), reps: {}, verifie: false };
  if (type === 'delta') return { type, m: tire([0.2, 0.25, 0.4, 0.5]), F: sg * tire([0.3, 0.4, 0.6, 0.8, 1]), reps: {}, verifie: false };
  const m1 = tire([0.2, 0.25, 0.3, 0.4]), r = tire([2, 3, 4]);
  return tire([true, false]) ? { type: 'masse', m1, m2: m1 * r, F: tire([0.4, 0.6, 0.8]), sys: 1, reps: {}, verifie: false }
    : { type: 'masse', m1: m1 * r, m2: m1, F: tire([0.4, 0.6, 0.8]), sys: 1, reps: {}, verifie: false };
}
const TITRES_DEFIS = { force: 'Trouver la force', delta: 'Prédire Δv', masse: 'Rôle de la masse' };
const scDefi = d => d.type === 'masse' ? { id: 'mobile', m: d.sys === 1 ? d.m1 : d.m2, F: d.F } : d.type === 'delta' ? { id: 'mobile', m: d.m, F: d.F, k: 2 } : { id: 'mobile', m: d.m, F: d.F };
function evaluer(d) {
  const r = d.reps;
  if (d.type === 'force') {
    const x = lireNombre(r.F), okN = isFinite(x) && proche(x, Math.abs(d.F), 0.06), okS = r.sens === (d.F > 0 ? 'droite' : 'gauche');
    return { ok: okN && okS, lignes: [
      [okN, okN ? 'Norme correcte.' : 'Norme : calculez m·‖Δv‖/Δt (lisez ‖Δv‖ et Δt dans le tableau ; m est donnée).'],
      [okS, okS ? 'Sens correct.' : 'Sens : la force a le même sens que Δv (construisez Δv avec le bouton « Construction de Δv »).']] };
  }
  if (d.type === 'delta') {
    const v = Math.abs(d.F) * 0.4 / d.m, x = lireNombre(r.dv), okN = isFinite(x) && proche(x, v, 0.04), okS = r.sens === (d.F > 0 ? 'droite' : 'gauche');
    return { ok: okN && okS, lignes: [
      [okN, okN ? 'Norme correcte.' : 'Norme : Δv ≈ ΣF·Δt / m, avec Δt = 0,40 s.'],
      [okS, okS ? 'Sens correct.' : 'Sens : Δv a le sens de la force.']] };
  }
  const rapport = d.m2 / d.m1, x = lireNombre(r.rap), okN = isFinite(x) && proche(x, rapport, 0.05), okQ = r.q === (d.m1 < d.m2 ? 1 : 2);
  return { ok: okN && okQ, lignes: [
    [okN, okN ? 'Rapport correct.' : `Rapport : à force et durée identiques, Δv est inversement proportionnel à m ; ‖Δv₁‖/‖Δv₂‖ = m₂/m₁.`],
    [okQ, okQ ? 'Bon système.' : 'Le système le moins massif (le moins inerte) subit la plus grande variation de vitesse.']] };
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
      <span>{avecIndices(lab)}</span>
      <input value={defi.reps[k] ?? ''} aria-label={lab} onChange={e => rep(k, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verifier(); }}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const titre = t => <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{t}</div>;
  const q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{avecIndices(t)}</div>;
  const txt = { fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const sens = [['droite', 'vers la droite'], ['gauche', 'vers la gauche']];
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES_DEFIS).map(([t, l]) =>
          <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}
      </div>
      {defi.type === 'force' && <>
        {titre('🎯 Défi : quelle force agit sur le mobile ?')}
        <div style={txt}>Un mobile auto-porteur de masse <strong>m = {vir(defi.m.toFixed(2))} kg</strong> glisse sur une table horizontale (frottements négligeables). Un fil exerce sur lui une <strong>force horizontale constante</strong>{' '}
          qu’on ne connaît pas (elle est cachée). Étudiez la chronophotographie : choisissez un point, lisez ‖Δv‖ et Δt dans le tableau, puis donnez la norme et le sens de la force.</div>
        {saisie('F', 'N', 'Norme de la force :')}
        {q('Sens de la force')}{choix('sens', sens)}
      </>}
      {defi.type === 'delta' && <>
        {titre('🎯 Défi : prédire Δv avant de voir')}
        <div style={txt}>Un mobile auto-porteur de masse <strong>m = {vir(defi.m.toFixed(2))} kg</strong> est tiré par un fil avec une force horizontale constante de norme <strong>{vir(Math.abs(defi.F).toFixed(1))} N</strong>,
          <strong> {defi.F > 0 ? 'vers la droite' : 'vers la gauche'}</strong>. Quelle variation de vitesse subit-il pendant Δt = 0,40 s ? Le mouvement ne s’affiche qu’après votre réponse.</div>
        {saisie('dv', 'm/s', 'Norme de Δv :')}
        {q('Sens de Δv')}{choix('sens', sens)}
      </>}
      {defi.type === 'masse' && <>
        {titre('🎯 Défi : le rôle de la masse')}
        <div style={txt}>Deux mobiles auto-porteurs, de masses <strong>m₁ = {vir(defi.m1.toFixed(2))} kg</strong> et <strong>m₂ = {vir(defi.m2.toFixed(2))} kg</strong>, sont tirés avec la même force
          de <strong>{vir(defi.F.toFixed(1))} N</strong> pendant la même durée. Passez de l’un à l’autre avec les boutons, comparez ‖Δv‖ au même point, puis répondez.</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[1, 2].map(s => <button key={s} onClick={() => setDefi(d => ({ ...d, sys: s }))} style={stylePetitBouton(defi.sys === s, VIOLET)}>Mobile {s}</button>)}</div>
        {saisie('rap', '', 'Rapport ‖Δv₁‖ / ‖Δv₂‖ =')}
        {q('Le mobile qui subit la plus grande variation de vitesse est…')}{choix('q', [[1, 'le mobile 1'], [2, 'le mobile 2']])}
      </>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !solution && <button onClick={voirSolution} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], i) => <div key={i} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'force' && <>ΣF ≈ m·‖Δv‖/Δt = {vir(defi.m.toFixed(2))} × ‖Δv‖ / Δt = <strong>{vir(Math.abs(defi.F).toFixed(1))} N</strong>, dans le sens de Δv : {defi.F > 0 ? 'vers la droite' : 'vers la gauche'}.</>}
        {defi.type === 'delta' && <>Δv ≈ ΣF·Δt / m = {vir(Math.abs(defi.F).toFixed(1))} × 0,40 / {vir(defi.m.toFixed(2))} = <strong>{vir((Math.abs(defi.F) * 0.4 / defi.m).toFixed(2))} m/s</strong>, dans le sens de la force.</>}
        {defi.type === 'masse' && <>Δv ≈ ΣF·Δt/m : à ΣF et Δt identiques, ‖Δv‖ est inversement proportionnel à m. ‖Δv₁‖/‖Δv₂‖ = m₂/m₁ = <strong>{vir((defi.m2 / defi.m1).toFixed(2))}</strong> ; c’est le mobile le plus léger qui varie le plus.</>}
      </div>}
    </div>);
}

// =====================================================================================================
export function SimulationMouvementSysteme() {
  const [mode, setMode] = useState(() => modeOuverture('mouvement-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('mouvement-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [tab, setTab] = useState('chrono');
  const etatInit = id => ({ id, ...SCEN[id].def, k: 1, i: 5, bruit: 0, aff: { v: true, dv: false, F: false, cmp: false }, etape: 0 });
  const [sc, setSc] = useState(() => ({ ...etatInit('chute'), ef: 1 }));
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const maj = patch => setSc(s => ({ ...s, ...patch }));
  const choisir = id => setSc(s => ({ ...s, ...etatInit(id), aff: s.aff }));

  // état effectif (les défis imposent le scénario) et calculs
  const eff = enDefi ? { ...sc, ...scDefi(defi), bruit: 0 } : sc;
  const S = construire(eff), A = analyser(S, eff.bruit), U = S.U;
  const k = eff.k, iMn = k + 1, iMx = S.N - 2 - k, i = Math.max(iMn, Math.min(iMx, eff.i));
  const vp = A.v[i + k], vm = A.v[i - k];
  const dv = dvEn(A, S, i, k), nDv = hyp(dv.x, dv.y);
  const fl = S.forces(A.pts[i].e), SF = somme(fl), nSF = hyp(SF.x, SF.y);
  const cmp = { x: S.m * dv.x / dv.dt, y: S.m * dv.y / dv.dt }, nCmp = hyp(cmp.x, cmp.y);
  const figee = enDefi && defi.type === 'delta' && !defi.reussi && !defi.solution;
  const cache = { vec: figee, F: enDefi && defi.type !== 'masse' && !(defi.type === 'delta' && (defi.reussi || defi.solution)) && !(defi.type === 'force' && (defi.reussi || defi.solution)) ? true : false, cmp: enDefi };
  const aff = enDefi ? { ...eff.aff, v: !figee || false, dv: figee ? false : eff.aff.dv, F: !cache.F && eff.aff.F, cmp: false } : eff.aff;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const est = (id, extra = true) => sc.id === id && extra;
  const okConstr = est('chute', sc.etape >= 3);
  const okMasseC = est('chute', sc.m >= 0.2);
  const okVert = est('vertical', sc.aff.dv);
  const okBiais = est('biais', sc.aff.dv);
  const okInertie = est('mobile', sc.F === 0);
  const okMasseM = est('mobile', sc.F >= 0.4 && sc.m <= 0.25);
  const okPlan = est('plan', sc.aff.F);
  const okPara = est('parachute', sc.aff.dv);
  const okLune = est('lune', sc.etape >= 3 && sc.k === 1);
  const okLuneK = est('lune', sc.k === 3);
  const okEuler = tab === 'euler' && sc.id === 'lune' && sc.ef >= 3;
  const ETAPES = [
    { id: 'intro', titre: 'Une chute filmée', onglet: 'chrono', focus: ['scene'],
      texte: <>Une bille de 100 g est lâchée sans vitesse initiale. On la photographie toutes les 0,12 s (chronophotographie). Les croix sont ses positions A_[0], A_[1], …
        Les flèches <strong style={{ color: VERT }}>vertes</strong> sont les vecteurs vitesse : v_[i] ≈ A_[i−1]A_[i+1] / (2τ).</>,
      tache: { type: 'qcm', q: 'Au cours de la chute, le vecteur vitesse…', options: ['varie : sa norme augmente (sa direction reste verticale)', 'reste constant', 'change de direction'], bonne: 0,
        expl: 'Les flèches s’allongent d’une image à l’autre : la vitesse augmente. Le vecteur vitesse varie donc, alors que la direction ne change pas.' } },
    { id: 'constr', titre: 'Construire Δv', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>La variation du vecteur vitesse entre deux dates voisines est Δv_[i] = v_[i+1] − v_[i−1]. Dans « Construction de Δv », cliquez sur ▶ jusqu’à l’étape 3 : on recopie v_[i+1] au point A_[i], on lui ajoute − v_[i−1],
        et Δv relie l’origine à l’extrémité. C’est la méthode de la fiche.</>,
      tache: { type: 'action', ok: okConstr, label: 'Construire Δv au point A5', faire: () => setSc(s => ({ ...s, ...etatInit('chute'), i: 5, etape: 3, aff: { ...s.aff, dv: true } })), consigne: 'Construction de Δv terminée (étape 3 sur 3)' } },
    { id: 'constrq', titre: 'Direction de Δv', onglet: 'chrono', focus: ['scene'],
      texte: <>Observez la flèche rouge Δv.</>,
      tache: { type: 'qcm', q: 'Le vecteur Δv est…', options: ['vertical, vers le bas', 'vertical, vers le haut', 'horizontal'], bonne: 0,
        expl: 'Comme v augmente vers le bas, la différence v_après − v_avant pointe vers le bas : Δv est vertical, dirigé vers le bas.' } },
    { id: 'normdv', titre: 'Norme de Δv', onglet: 'chrono', focus: ['bilan'],
      texte: <>Lisez dans le tableau la norme ‖Δv‖ au point A5.</>,
      tache: { type: 'num', q: 'Norme ‖Δv‖ (en m/s)', unite: 'm/s', vrai: 2 * G0 * 0.12, tol: 0.03, affiche: v => vir(v.toFixed(2)), cs: 2,
        bloque: okConstr ? null : 'Faites d’abord la construction (étape précédente).',
        expl: 'Δv = g·Δt = 9,8 × 0,24 ≈ 2,35 m/s : la vitesse augmente de 2,35 m/s en 0,24 s (Δt = 2τ).' } },
    { id: 'force1', titre: 'Quelle force ?', onglet: 'chrono', focus: ['scene'],
      texte: <>Les frottements de l’air sont négligeables pour cette bille.</>,
      tache: { type: 'qcm', q: 'La force responsable de la variation de vitesse est…', options: ['le poids P de la bille (vertical, vers le bas)', 'le poids et une poussée dans le sens du mouvement', 'aucune force : la vitesse change toute seule'], bonne: 0,
        expl: 'La bille n’est soumise qu’à son poids. Le vecteur Δv a le même direction et le même sens que cette force.' } },
    { id: 'loi', titre: 'La relation ΣF ≈ m·Δv/Δt', onglet: 'chrono', focus: ['bilan'],
      texte: <>Le tableau donne la masse (m = 0,100 kg), ‖Δv‖ et Δt = 2τ. Calculez m·‖Δv‖/Δt, puis comparez avec le poids de la bille.</>,
      tache: { type: 'num', q: 'm·‖Δv‖ / Δt (en N)', unite: 'N', vrai: 0.1 * G0, tol: 0.03, affiche: v => vir(v.toFixed(2)), cs: 2,
        expl: 'On trouve 0,98 N, soit exactement le poids P = m·g = 0,100 × 9,8. Pour un système de masse m : ΣF ≈ m·Δv/Δt.' } },
    { id: 'masseC', titre: 'Et si la bille était plus lourde ?', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>Avec le curseur de masse, prenez une bille de 0,3 kg ou plus et regardez ce que devient Δv.</>,
      tache: { type: 'action', ok: okMasseC, label: 'Bille de 0,30 kg', faire: () => maj({ m: 0.3 }), consigne: 'Masse de la bille ≥ 0,2 kg' } },
    { id: 'masseCq', titre: 'Masse et chute libre', onglet: 'chrono', focus: ['bilan'],
      texte: <>Comparez ‖Δv‖ et m‖Δv‖/Δt : le poids a changé.</>,
      tache: { type: 'qcm', q: 'Quand la masse change, en chute libre, ‖Δv‖…', options: ['ne change pas : le poids augmente comme la masse, donc ΣF/m reste égal à g', 'augmente avec la masse', 'diminue avec la masse'], bonne: 0,
        expl: 'P = m·g et Δv ≈ (ΣF/m)·Δt = g·Δt : la masse se simplifie. Tous les corps tombent pareil en l’absence de frottements.' } },
    { id: 'vert', titre: 'Lancer vers le haut', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>La bille est maintenant lancée vers le haut à 5 m/s. Choisissez « Lancer vertical » et affichez les flèches Δv (case « variation Δv »).</>,
      tache: { type: 'action', ok: okVert, label: 'Lancer vertical, avec Δv', faire: () => setSc(s => ({ ...s, ...etatInit('vertical'), aff: { ...s.aff, dv: true } })), consigne: 'Lancer vertical, flèches Δv affichées' } },
    { id: 'vertq', titre: 'v et Δv : deux choses différentes', onglet: 'chrono', focus: ['scene'],
      texte: <>Les vitesses vont d’abord vers le haut, puis vers le bas. Et Δv ?</>,
      tache: { type: 'qcm', q: 'Pendant la montée, Δv est…', options: ['vers le bas, comme pendant la descente', 'vers le haut, comme la vitesse', 'nul au début'], bonne: 0,
        expl: 'Pendant la montée la vitesse diminue : v_après est plus petit que v_avant, donc Δv pointe vers le bas. Δv (et la force) sont identiques tout au long du mouvement, alors que v change de sens.' } },
    { id: 'biais', titre: 'Lancer en biais', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>La bille est lancée obliquement. Choisissez « Lancer en biais », avec les flèches Δv.</>,
      tache: { type: 'action', ok: okBiais, label: 'Lancer en biais, avec Δv', faire: () => setSc(s => ({ ...s, ...etatInit('biais'), aff: { ...s.aff, dv: true } })), consigne: 'Lancer en biais, flèches Δv affichées' } },
    { id: 'biaisq', titre: 'Vitesse oblique, Δv vertical', onglet: 'chrono', focus: ['scene'],
      texte: <>La vitesse est oblique, mais regardez les flèches rouges.</>,
      tache: { type: 'qcm', q: 'Dans ce mouvement, les vecteurs Δv sont…', options: ['tous verticaux, vers le bas, de même longueur', 'tangents à la trajectoire', 'de plus en plus longs'], bonne: 0,
        expl: 'Il n’existe pas de lien simple entre v et ΣF, mais Δv a toujours la direction de ΣF : ici le poids, vertical et constant. Δv est donc le même en chaque point.' } },
    { id: 'inertie', titre: 'Sans force : le principe d’inertie', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>Un mobile auto-porteur glisse sur une table (coussin d’air). Choisissez « Mobile tiré par un fil » et réglez la force du fil sur <strong>0 N</strong>.</>,
      tache: { type: 'action', ok: okInertie, label: 'Mobile sans fil (F = 0)', faire: () => setSc(s => ({ ...s, ...etatInit('mobile'), F: 0, aff: { ...s.aff, dv: true } })), consigne: 'Mobile, force du fil = 0 N' } },
    { id: 'inertieq', titre: 'Vitesse constante', onglet: 'chrono', focus: ['scene', 'bilan'],
      texte: <>Les positions sont régulièrement espacées.</>,
      tache: { type: 'qcm', q: 'Sans force du fil (P et R se compensent), le vecteur Δv est…', options: ['nul : le mouvement est rectiligne et uniforme', 'dirigé vers l’avant', 'dirigé vers le bas'], bonne: 0,
        expl: 'ΣF = 0 (P et R se compensent) donc Δv = 0 : v est constant. C’est le principe d’inertie : on n’a pas besoin de force pour maintenir un mouvement.' } },
    { id: 'masseM', titre: 'Le rôle de la masse', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>On tire le mobile avec le fil. Réglez la force à 0,5 N et la masse à 0,5 kg, notez ‖Δv‖, puis passez à <strong>0,2 kg</strong> (même force).</>,
      tache: { type: 'action', ok: okMasseM, label: 'Mobile de 0,2 kg tiré par 0,5 N', faire: () => setSc(s => ({ ...s, ...etatInit('mobile'), F: 0.5, m: 0.2, aff: { ...s.aff, dv: true } })), consigne: 'Mobile de masse ≤ 0,25 kg, force ≥ 0,4 N' } },
    { id: 'masseMq', titre: 'Plus léger : plus de variation', onglet: 'chrono', focus: ['bilan'],
      texte: <>Comparez avec le cas 0,5 kg (‖Δv‖ ≈ 0,24 m/s au point A5 pour k = 1).</>,
      tache: { type: 'qcm', q: 'À force et durée identiques, un mobile 2,5 fois plus léger subit une variation de vitesse…', options: ['2,5 fois plus grande', '2,5 fois plus petite', 'identique'], bonne: 0,
        expl: 'Δv ≈ ΣF·Δt / m : Δv est inversement proportionnel à la masse. Le plus léger (le moins inerte) varie le plus.' } },
    { id: 'plan', titre: 'Deux forces non colinéaires', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>Un solide glisse sur un plan incliné sans frottement. Il subit son poids P et la réaction R du plan. Choisissez « Plan incliné » et affichez les <strong>forces</strong> (cases « forces » et « variation Δv »).</>,
      tache: { type: 'action', ok: okPlan, label: 'Plan incliné, avec les forces', faire: () => setSc(s => ({ ...s, ...etatInit('plan'), aff: { ...s.aff, F: true, dv: true } })), consigne: 'Plan incliné, forces affichées' } },
    { id: 'planq', titre: 'Somme vectorielle', onglet: 'chrono', focus: ['scene', 'bilan'],
      texte: <>P et R ne sont pas colinéaires. La flèche noire est leur somme ΣF.</>,
      tache: { type: 'qcm', q: 'La somme ΣF et le vecteur Δv sont…', options: ['colinéaires, de même sens, dirigés le long de la pente vers le bas', 'perpendiculaires', 'dirigés comme le poids'], bonne: 0,
        expl: 'ΣF = P + R est dirigée le long de la pente (norme m·g·sin α). Δv a la même direction et le même sens que ΣF, quelle que soit la façon dont on construit la somme.' } },
    { id: 'para', titre: 'Le parachutiste', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>Après l’ouverture du parachute, le frottement de l’air dépend de la vitesse. Choisissez « Parachutiste » et affichez les flèches Δv.</>,
      tache: { type: 'action', ok: okPara, label: 'Parachutiste, avec Δv', faire: () => setSc(s => ({ ...s, ...etatInit('parachute'), aff: { ...s.aff, dv: true, F: true } })), consigne: 'Parachutiste, flèches Δv affichées' } },
    { id: 'paraq', titre: 'Vitesse limite', onglet: 'chrono', focus: ['scene'],
      texte: <>Les flèches Δv rétrécissent, jusqu’à presque disparaître.</>,
      tache: { type: 'qcm', q: 'Quand Δv devient presque nul, la somme des forces…', options: ['est presque nulle : le frottement compense le poids, la vitesse devient constante', 'vaut le poids', 'est dirigée vers le haut'], bonne: 0,
        expl: 'La force de frottement augmente avec la vitesse jusqu’à compenser le poids : ΣF = 0, donc Δv = 0. Le mouvement devient rectiligne et uniforme (vitesse limite).' } },
    { id: 'lune', titre: 'La Lune autour de la Terre', onglet: 'chrono', focus: ['reglages', 'scene'],
      texte: <>La Lune se déplace d’environ une position par jour. Choisissez « La Lune autour de la Terre » et terminez la construction de Δv (3 étapes).</>,
      tache: { type: 'action', ok: okLune, label: 'Construire Δv pour la Lune', faire: () => setSc(s => ({ ...s, ...etatInit('lune'), etape: 3, aff: { ...s.aff, dv: true } })), consigne: 'Lune : construction de Δv terminée' } },
    { id: 'luneq', titre: 'Où pointe Δv ?', onglet: 'chrono', focus: ['scene'],
      texte: <>La vitesse de la Lune a une norme presque constante, mais elle change…</>,
      tache: { type: 'qcm', q: 'Le vecteur Δv est dirigé…', options: ['vers la Terre', 'vers l’avant, le long de la trajectoire', 'à l’opposé de la Terre'], bonne: 0,
        expl: 'La direction de v change : Δv pointe vers l’intérieur de l’orbite, donc vers la Terre. C’est bien la direction de la force de gravitation exercée par la Terre.' } },
    { id: 'lunef', titre: 'La force exercée par la Terre', onglet: 'chrono', focus: ['bilan'],
      texte: <>La masse de la Lune est m = 7,35×10²² kg. Calculez m·‖Δv‖/Δt avec les valeurs du tableau (attention aux unités : km/s et jours ; passez en m/s et en s).</>,
      tache: { type: 'num', q: 'm·‖Δv‖ / Δt (en N)', unite: 'N', vrai: FCIN_LUNE, tol: 0.04, affiche: v => sci(v, 2), cs: 2,
        bloque: okLune ? null : 'Faites d’abord la construction pour la Lune.',
        expl: `On trouve ≈ 2,0×10²⁰ N. La loi de gravitation donne G·m_L·m_T/R² = ${sci(F_GRAV_LUNE, 2)} N : les deux méthodes sont d’accord, ce qui confirme la relation ΣF ≈ m·Δv/Δt.` } },
    { id: 'dt', titre: 'Et si Δt est grand ?', onglet: 'chrono', focus: ['reglages', 'bilan'],
      texte: <>Avec « Écart entre les dates », prenez k = 3 (Δt = 6 jours) et regardez l’écart relatif entre m·Δv/Δt et ΣF dans le tableau.</>,
      tache: { type: 'action', ok: okLuneK, label: 'Lune avec k = 3', faire: () => maj({ k: 3, i: 5 }), consigne: 'Lune, k = 3' } },
    { id: 'dtq', titre: 'Plus Δt est petit, mieux c’est', onglet: 'chrono', focus: ['bilan'],
      texte: <>L’écart a augmenté (autour de 8 %).</>,
      tache: { type: 'qcm', q: 'La relation ΣF ≈ m·Δv/Δt est d’autant mieux vérifiée que…', options: ['Δt est petit', 'Δt est grand', 'la masse est grande'], bonne: 0,
        expl: 'Sur un intervalle long, la force a le temps de changer de direction : on moyenne. Pour Δt infiniment petit, la relation devient exacte : c’est la deuxième loi de Newton.' } },
    { id: 'euler', titre: 'Prédire le mouvement', onglet: 'euler', focus: ['reglages', 'scene'],
      texte: <>Au lieu d’analyser un mouvement, on peut le <strong>calculer</strong> : v(t+Δt) = v(t) + (ΣF/m)·Δt, puis la position avec v. C’est la méthode d’Euler. Dans l’onglet « Prédire », choisissez la Lune et un pas de calcul petit (au plus un quart de jour).</>,
      tache: { type: 'action', ok: okEuler, label: 'Calculer l’orbite avec un petit pas', faire: () => { setTab('euler'); setSc(s => ({ ...s, ...etatInit('lune'), ef: 3 })); }, consigne: 'Onglet « Prédire », Lune, pas ≤ 0,25 jour' } },
    { id: 'eulerq', titre: 'Le pas de calcul', onglet: 'euler', focus: ['scene'],
      texte: <>Essayez aussi le pas d’un jour ou de deux jours : la trajectoire calculée s’écarte de la vraie orbite.</>,
      tache: { type: 'qcm', q: 'Avec un pas de calcul trop grand, la trajectoire calculée…', options: ['s’éloigne de la vraie orbite (l’erreur s’accumule)', 'reste identique', 'devient plus précise'], bonne: 0,
        expl: 'Pendant un pas, on suppose la force constante. Si le pas est grand, cette erreur s’accumule à chaque étape : la Lune calculée s’éloigne de la Terre. Avec un petit pas, on retrouve l’orbite.' } },
    { id: 'bravo', titre: 'Bravo !', onglet: 'chrono', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>Δv_[i] = v_[i+1] − v_[i−1] se construit par une soustraction de vecteurs (v_[i+1] + (−v_[i−1])), au point A_[i].</li>
        <li>ΣF ≈ m·Δv/Δt : Δv a la direction et le sens de ΣF.</li>
        <li>Δv = 0 si et seulement si ΣF = 0 : principe d’inertie.</li>
        <li>v et ΣF n’ont pas de lien de direction ; Δv et ΣF, si.</li>
        <li>À même force, le moins massif varie le plus : Δv ∝ 1/m.</li>
        <li>Plus Δt est petit, mieux la relation est vérifiée.</li></ul>,
      texte: <>Vous savez relier le mouvement d’un système et les forces qu’il subit. Essayez maintenant les défis.</>, tache: null },
  ];
  const ETAPES_I = ETAPES.map(e => ({ ...e, titre: idxDeep(e.titre), texte: idxDeep(e.texte), retenir: idxDeep(e.retenir) }));
  const ongletGuide = ETAPES[Math.min(etape, ETAPES.length - 1)].onglet;
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  function lancerDefi(type) { setDefi(nouveauDefi(type)); setSc(s => ({ ...s, i: 5, k: 1, etape: 0 })); }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') lancerDefi(defi ? defi.type : 'force');
  }
  const ongletAff = enGuide ? ongletGuide : mode === 'defi' ? 'chrono' : tab;

  // ════════════════ SCÈNE ════════════════
  const W = 640, H = 430, P = 62;
  const fabriquerGeo = pts => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
    const bw = x1 - x0, bh = y1 - y0, s = Math.min(bw > 0 ? (W - 2 * P) / bw : Infinity, bh > 0 ? (H - 2 * P) / bh : Infinity), s2 = isFinite(s) ? s : 1;
    const xc = (x0 + x1) / 2, yc = (y0 + y1) / 2;
    return { s: s2, X: x => W / 2 + (x - xc) * s2, Y: y => H / 2 - (y - yc) * s2 };
  };
  const croix = (x, y, cle, sel) => <g key={cle}><path d={`M${x - 4.5},${y - 4.5} L${x + 4.5},${y + 4.5} M${x - 4.5},${y + 4.5} L${x + 4.5},${y - 4.5}`} stroke={sel ? ORANGE : BLEU} strokeWidth={sel ? 2.6 : 2} strokeLinecap="round"/></g>;
  const base = [...A.pts, ...(S.terre ? [{ x: 0, y: 0 }, { x: RL, y: 0 }, { x: -RL, y: 0 }, { x: 0, y: RL }, { x: 0, y: -RL }] : [])];

  const scChrono = (() => {
    const g = fabriquerGeo(base), X = g.X, Y = g.Y;
    const Vmax = Math.max(1e-9, ...A.v.filter(Boolean).map(v => hyp(v.x, v.y)));
    let Dmax = 0; for (let j = iMn; j <= iMx; j++) { const d = dvEn(A, S, j, k); Dmax = Math.max(Dmax, hyp(d.x, d.y)); }
    const vn = nice(Math.max(Vmax, Dmax) * S.U.Vf), kv = 60 / (vn / S.U.Vf);
    let Fm = 0; for (let j = iMn; j <= iMx; j++) { const f = S.forces(A.pts[j].e); Fm = Math.max(Fm, hyp(somme(f).x, somme(f).y), ...f.map(q => hyp(q.fx, q.fy))); }
    const fn = nice(Math.max(Fm, 1e-12)), kf = 60 / fn;
    const u = S.decal ? [S.decal[0], -S.decal[1]] : [0, 0], dec = d => [u[0] * d, u[1] * d];
    const pas = eff.etape;
    const ai = A.pts[i], ax = X(ai.x), ay = Y(ai.y);
    const o = dec(0);
    const tipv = [ax + o[0] + vp.x * kv, ay + o[1] - vp.y * kv];
    const tipm = [tipv[0] - vm.x * kv, tipv[1] + vm.y * kv];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img"
        aria-label={`Chronophotographie : ${SCEN[eff.id].label}`}>
        {S.terre && <g><circle cx={X(0)} cy={Y(0)} r={RL * g.s} fill="none" stroke="#cbd5e1" strokeDasharray="4 4"/><circle cx={X(0)} cy={Y(0)} r="11" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.5"/>
          <text x={X(0)} y={Y(0) + 26} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0369a1">Terre</text></g>}
        {A.pts.map((p, j) => <text key={`l${j}`} x={X(p.x) - 12} y={Y(p.y) - 7} textAnchor="end" fontSize="10" fill={GRIS}>A<tspan fontSize="8" dy="2">{j}</tspan></text>)}
        {A.pts.map((p, j) => croix(X(p.x), Y(p.y), `c${j}`, j === i - k || j === i || j === i + k))}
        {/* flèches vitesse */}
        {aff.v && !figee && A.v.map((v, j) => v && <Fleche key={`v${j}`} x1={X(A.pts[j].x) + dec(10)[0]} y1={Y(A.pts[j].y) + dec(10)[1]}
          x2={X(A.pts[j].x) + dec(10)[0] + v.x * kv} y2={Y(A.pts[j].y) + dec(10)[1] - v.y * kv} col={VERT} w={j === i - k || j === i + k ? 3 : 2} op={pas > 0 && j !== i - k && j !== i + k ? 0.35 : 1}/>)}
        {/* flèches Δv */}
        {aff.dv && !figee && Array.from({ length: iMx - iMn + 1 }, (_, q) => iMn + q).map(j => { const d = dvEn(A, S, j, k);
          return <Fleche key={`d${j}`} x1={X(A.pts[j].x) + dec(24)[0]} y1={Y(A.pts[j].y) + dec(24)[1]} x2={X(A.pts[j].x) + dec(24)[0] + d.x * kv} y2={Y(A.pts[j].y) + dec(24)[1] - d.y * kv}
            col={ROUGE} w={j === i ? 3.6 : 2.4} op={j === i ? 1 : 0.8}/>; })}
        {/* forces */}
        {aff.F && !cache.F && Array.from({ length: iMx - iMn + 1 }, (_, q) => iMn + q).map(j => { const f = S.forces(A.pts[j].e), s = somme(f), x0 = X(A.pts[j].x) + dec(-12)[0], y0 = Y(A.pts[j].y) + dec(-12)[1];
          return <g key={`f${j}`}>{j === i && f.map((q, n) => f.length > 1 && <Fleche key={n} x1={x0} y1={y0} x2={x0 + q.fx * kf} y2={y0 - q.fy * kf} col={q.col} w={2} dash="5 3"/>)}
            <Fleche x1={x0} y1={y0} x2={x0 + s.x * kf} y2={y0 - s.y * kf} col={NOIR} w={j === i ? 3.6 : 2.2} op={j === i ? 1 : 0.8}/></g>; })}
        {aff.cmp && !cache.cmp && !figee && <Fleche x1={ax + dec(-26)[0]} y1={ay + dec(-26)[1]} x2={ax + dec(-26)[0] + cmp.x * kf} y2={ay + dec(-26)[1] - cmp.y * kf} col={VIOLET} w={3} dash="2 3"/>}
        {/* construction de Δv */}
        {pas >= 1 && !figee && <g>
          <Fleche x1={ax} y1={ay} x2={tipv[0]} y2={tipv[1]} col={VERT} w={3.4}/>
          <text x={(ax + tipv[0]) / 2 + 8} y={(ay + tipv[1]) / 2 - 4} fontSize="12" fontWeight="700" fill={VERT}>v<tspan fontSize="9" dy="2">i+{k}</tspan></text>
          {pas >= 2 && <Fleche x1={tipv[0]} y1={tipv[1]} x2={tipm[0]} y2={tipm[1]} col={VERT} w={3.4} dash="6 3"/>}
          {pas >= 2 && <text x={(tipv[0] + tipm[0]) / 2 + 8} y={(tipv[1] + tipm[1]) / 2 + 12} fontSize="12" fontWeight="700" fill={VERT}>−v<tspan fontSize="9" dy="2">i−{k}</tspan></text>}
          {pas >= 3 && <Fleche x1={ax} y1={ay} x2={tipm[0]} y2={tipm[1]} col={ROUGE} w={4}/>}
          {pas >= 3 && <text x={(ax + tipm[0]) / 2 - 10} y={(ay + tipm[1]) / 2} textAnchor="end" fontSize="13" fontWeight="800" fill={ROUGE}>Δv<tspan fontSize="9" dy="2">i</tspan></text>}
        </g>}
        {/* légende : échelles */}
        <g transform={`translate(14,${H - 44})`}>
          <rect x="-6" y="-18" width={200} height="58" rx="6" fill="white" opacity="0.85" stroke="#e2e8f0"/>
          <Fleche x1={0} y1={0} x2={60} y2={0} col={VERT} w={2.6}/><text x="68" y="4" fontSize="11.5" fill={NOIR}>{nb(vn)} {S.U.Vu} (v et Δv)</text>
          <Fleche x1={0} y1={22} x2={60} y2={22} col={NOIR} w={2.6}/><text x="68" y="26" fontSize="11.5" fill={NOIR}>{nb(fn)} {S.U.Fu} (forces)</text>
        </g>
        <text x={W - 10} y="20" textAnchor="end" fontSize="12.5" fontWeight="700" fill={NOIR}>{SCEN[eff.id].label} : τ = {nb(S.tau * S.U.Tf)} {S.U.Tu}</text>
        {figee && <text x={W / 2} y={H - 14} textAnchor="middle" fontSize="13" fontWeight="700" fill={GRIS}>Prédisez avant de regarder.</text>}
      </svg>);
  })();

  const dtE = EF[sc.ef] * S.tau, trajE = euler(S, dtE), ex = A.pts.map(p => ({ x: p.e.x, y: p.e.y }));
  const scEuler = (() => {
    const g = fabriquerGeo([...ex, ...trajE, ...(S.terre ? [{ x: 0, y: 0 }, { x: RL, y: 0 }, { x: -RL, y: 0 }, { x: 0, y: RL }, { x: 0, y: -RL }] : [])]), X = g.X, Y = g.Y;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fafaf9', borderRadius: 8 }} role="img" aria-label="Trajectoire calculée par la méthode d’Euler">
        {S.terre && <g><circle cx={X(0)} cy={Y(0)} r={RL * g.s} fill="none" stroke="#cbd5e1" strokeDasharray="4 4"/><circle cx={X(0)} cy={Y(0)} r="11" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.5"/>
          <text x={X(0)} y={Y(0) + 26} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0369a1">Terre</text></g>}
        <polyline points={trajE.map(p => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke={ORANGE} strokeWidth="2.2"/>
        {trajE.map((p, q) => (trajE.length <= 60 || q % Math.ceil(trajE.length / 60) === 0) && <circle key={`e${q}`} cx={X(p.x)} cy={Y(p.y)} r="2.6" fill={ORANGE}/>)}
        {ex.map((p, j) => croix(X(p.x), Y(p.y), `x${j}`, false))}
        <text x={W - 10} y="20" textAnchor="end" fontSize="12.5" fontWeight="700" fill={NOIR}>{SCEN[eff.id].label}</text>
        <g transform={`translate(14,${H - 44})`}><rect x="-6" y="-18" width={236} height="58" rx="6" fill="white" opacity="0.85" stroke="#e2e8f0"/>
          <path d="M-3,-3 L3,3 M-3,3 L3,-3" transform="translate(4,0)" stroke={BLEU} strokeWidth="2"/><text x="16" y="4" fontSize="11.5" fill={NOIR}>mouvement exact (chronophotographie)</text>
          <circle cx="4" cy="22" r="3" fill={ORANGE}/><text x="16" y="26" fontSize="11.5" fill={NOIR}>calcul : v(t+Δt) = v(t) + ΣF/m·Δt</text></g>
      </svg>);
  })();
  const dEuler = hyp(trajE[trajE.length - 1].x - ex[ex.length - 1].x, trajE[trajE.length - 1].y - ex[ex.length - 1].y);
  const rEuler = S.terre ? hyp(trajE[trajE.length - 1].x, trajE[trajE.length - 1].y) / RL : null;

  // vue zoomée de la construction (espace des vitesses, origine en A_i)
  const zoom = ongletAff !== 'euler' && !figee && eff.etape > 0 && (() => {
    const ZW = 640, ZH = 300, Z = 34, pas = eff.etape, V = U.Vf;
    const tip = { x: vp.x - vm.x, y: vp.y - vm.y };
    const pts = [{ x: 0, y: 0 }, vp, vm, tip];
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sc = Math.min((ZW - 2 * Z - 40) / Math.max(x1 - x0, 1e-12), (ZH - 2 * Z) / Math.max(y1 - y0, 1e-12)), xc = (x0 + x1) / 2, yc = (y0 + y1) / 2;
    const X = x => ZW / 2 + (x - xc) * sc, Y = y => ZH / 2 - (y - yc) * sc;
    const o = [X(0), Y(0)], P = [X(vp.x), Y(vp.y)], M = [X(vm.x), Y(vm.y)], T = [X(tip.x), Y(tip.y)];
    const dx = T[0] - o[0], dy = T[1] - o[1], dl = Math.hypot(dx, dy) || 1, nx = dy / dl * 22, ny = -dx / dl * 22;   // décalage latéral pour que les flèches colinéaires restent lisibles
    const t = (x, y, txt, col) => <text x={x} y={y} fontSize="14" fontWeight="800" fill={col}>{txt}</text>;
    return (
      <svg viewBox={`0 0 ${ZW} ${ZH}`} style={{ width: '100%', display: 'block', background: '#fffbeb', borderRadius: 8, marginTop: 8, border: '1px solid #fde68a' }} role="img" aria-label="Construction de Δv, vue agrandie">
        <text x="10" y="20" fontSize="12.5" fontWeight="700" fill={NOIR}>Construction de Δv au point A<tspan fontSize="9" dy="3">{i}</tspan><tspan dy="-3"> (vue agrandie, origine en A</tspan><tspan fontSize="9" dy="3">{i}</tspan><tspan dy="-3">)</tspan></text>
        <circle cx={o[0]} cy={o[1]} r="4.5" fill={NOIR}/>
        {pas < 2 && <Fleche x1={o[0]} y1={o[1]} x2={M[0]} y2={M[1]} col={VERT} w={2} dash="3 3" op={0.55}/>}
        {pas < 2 && t(M[0] + 6, M[1] - 6, <>v<tspan fontSize="10" dy="3">i−{k}</tspan></>, VERT)}
        <Fleche x1={o[0]} y1={o[1]} x2={P[0]} y2={P[1]} col={VERT} w={3.4}/>
        {t(P[0] + 8, P[1] - 6, <>v<tspan fontSize="10" dy="3">i+{k}</tspan></>, VERT)}
        {pas >= 2 && <line x1={P[0]} y1={P[1]} x2={P[0] + nx} y2={P[1] + ny} stroke={VERT} strokeWidth="1.4" strokeDasharray="2 3"/>}
        {pas >= 2 && <Fleche x1={P[0] + nx} y1={P[1] + ny} x2={T[0] + nx} y2={T[1] + ny} col={VERT} w={3.4} dash="7 4"/>}
        {pas >= 2 && <line x1={T[0] + nx} y1={T[1] + ny} x2={T[0]} y2={T[1]} stroke={VERT} strokeWidth="1.4" strokeDasharray="2 3"/>}
        {pas >= 2 && t((P[0] + T[0]) / 2 + nx + 8, (P[1] + T[1]) / 2 + ny + 4, <>−v<tspan fontSize="10" dy="3">i−{k}</tspan></>, VERT)}
        {pas >= 3 && <Fleche x1={o[0]} y1={o[1]} x2={T[0]} y2={T[1]} col={ROUGE} w={4.4}/>}
        {pas >= 3 && t((o[0] + T[0]) / 2 - 38, (o[1] + T[1]) / 2 - 4, <>Δv<tspan fontSize="10" dy="3">i</tspan></>, ROUGE)}
        <text x={ZW - 10} y={ZH - 10} textAnchor="end" fontSize="11.5" fill={GRIS}>échelle : la flèche v<tspan fontSize="9" dy="3">i+{k}</tspan><tspan dy="-3"> mesure {nb(hyp(vp.x, vp.y) * V)} {S.U.Vu}</tspan></text>
      </svg>);
  })();
  // ════════════════ PANNEAUX ════════════════
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {ongletAff === 'euler' ? scEuler : scChrono}
      {zoom}
      {idxDeep(<div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        Système : {S.aff}. Positions A_[i] obtenues par un modèle (référentiel galiléen), une image toutes les τ.
        {' '}<span style={{ color: VERT, fontWeight: 700 }}>→</span> vitesse · <span style={{ color: ROUGE, fontWeight: 700 }}>→</span> variation Δv · <span style={{ color: NOIR, fontWeight: 700 }}>→</span> somme des forces.
      </div>)}
    </div>);

  const paramsUI = SCEN[eff.id].params;
  const cases = [['v', 'vecteurs vitesse v'], ['dv', 'variation Δv'], ['F', 'forces et leur somme ΣF'], ['cmp', 'comparer m·Δv/Δt et ΣF']];
  const reglages = ongletAff === 'euler' ? (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Système</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {ORDRE.map(id => <button key={id} onClick={() => choisir(id)} style={stylePetitBouton(sc.id === id, VIOLET)}>{SCEN[id].icone} {SCEN[id].label}</button>)}</div>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Pas de calcul Δt</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {EF.map((f, q) => <button key={q} onClick={() => maj({ ef: q })} style={stylePetitBouton(sc.ef === q, '#0ea5e9')}>{vir(nb(f * S.tau * S.U.Tf))} {S.U.Tu}</button>)}</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.5 }}>À chaque pas : <strong>v(t+Δt) = v(t) + (ΣF/m)·Δt</strong>, puis <strong>position(t+Δt) = position(t) + v(t)·Δt</strong>.
        La force est recalculée à chaque pas à partir de la position et de la vitesse.</div>
    </div>) : (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Mouvement étudié</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {ORDRE.map(id => <button key={id} onClick={() => choisir(id)} style={stylePetitBouton(sc.id === id, VIOLET)}>{SCEN[id].icone} {SCEN[id].label}</button>)}</div>
        {paramsUI.includes('m') && <Curseur nom="Masse m" valeur={sc.m} onChange={v => maj({ m: v })} min={eff.id === 'chute' || eff.id === 'vertical' || eff.id === 'biais' ? 0.05 : eff.id === 'plan' ? 0.1 : 0.2}
          max={eff.id === 'mobile' || eff.id === 'plan' ? 1 : 0.5} pas={eff.id === 'chute' || eff.id === 'vertical' || eff.id === 'biais' ? 0.05 : 0.1} unite="kg" decimales={2} couleur={VIOLET}/>}
        {paramsUI.includes('F') && <Curseur nom="Force du fil F" valeur={sc.F} onChange={v => maj({ F: v })} min={0} max={1} pas={0.1} unite="N" decimales={1} couleur={VIOLET}/>}
        {paramsUI.includes('alpha') && <Curseur nom="Angle du plan α" valeur={sc.alpha} onChange={v => maj({ alpha: v })} min={10} max={40} pas={5} unite="°" couleur={VIOLET}/>}
      </>}
      <Curseur nom="Point étudié A_i" valeur={i} onChange={v => maj({ i: v })} min={iMn} max={iMx} pas={1} couleur="#0284c7"/>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Écart entre les dates : Δt = 2k·τ</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[1, 2, 3].map(q => <button key={q} onClick={() => setSc(s => ({ ...s, k: q, i: Math.max(q + 1, Math.min(S.N - 2 - q, s.i)) }))} style={stylePetitBouton(k === q, '#0ea5e9')}>k = {q} (Δt = {nb(2 * q * S.tau * S.U.Tf)} {S.U.Tu})</button>)}</div>
      {!enDefi && <Curseur nom="Bruit de pointage (comme sur une vraie vidéo)" valeur={sc.bruit} onChange={v => maj({ bruit: v })} min={0} max={3} pas={0.5} unite="%" decimales={1} couleur={GRIS}/>}
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Afficher</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
        {cases.filter(([c]) => !(cache.F && (c === 'F')) && !(cache.cmp && c === 'cmp')).map(([c, l]) =>
          <label key={c} style={{ fontSize: 14, color: KIT.txt, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!(aff[c])} disabled={c === 'v' && figee} onChange={e => setSc(s => ({ ...s, aff: { ...s.aff, [c]: e.target.checked } }))} style={{ marginRight: 6 }}/>{l}</label>)}
      </div>
      {idxDeep(<div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Construction de Δv_[i] = v_[i+k] − v_[i−k] <span style={{ fontWeight: 400 }}>(étape {eff.etape} sur 3)</span></div>)}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => maj({ etape: Math.max(0, eff.etape - 1) })} style={stylePetitBouton(false, '#334155')}>◀</button>
        <button onClick={() => maj({ etape: Math.min(3, eff.etape + 1) })} style={stylePetitBouton(true, '#334155')}>▶</button>
        <button onClick={() => maj({ etape: 0 })} style={stylePetitBouton(false, '#334155')}>effacer</button>
      </div>
      {idxDeep(<div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>1 : on place v_[i+k] en A_[i] ; 2 : on ajoute −v_[i−k] à la suite ; 3 : Δv_[i] relie A_[i] à l’extrémité.</div>)}
    </div>);

  const ligne = (n, v, c) => <LigneMesure nom={idx(n)} valeur={v} couleur={c}/>;
  const ang = angleEntre(dv, SF), ecart = nSF > 1e-12 ? Math.abs(nCmp - nSF) / nSF * 100 : NaN;
  const mesures = !figee && ongletAff !== 'euler' && (
    <div style={{ ...styleBoite, ...cadre('bilan') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures au point A<sub>{i}</sub></div>
      {ligne('Masse m', `${nb(S.m)} kg`)}
      {ligne('Dates t_[i−k] et t_[i+k]', `${nb(A.pts[i - k].t * S.U.Tf)} et ${nb(A.pts[i + k].t * S.U.Tf)} ${S.U.Tu}`)}
      {ligne('Durée Δt', `${nb(dv.dt * S.U.Tf)} ${S.U.Tu}`)}
      {ligne('Vitesse ‖v_[i−k]‖', `${nb(hyp(vm.x, vm.y) * S.U.Vf)} ${S.U.Vu}`, VERT)}
      {ligne('Vitesse ‖v_[i+k]‖', `${nb(hyp(vp.x, vp.y) * S.U.Vf)} ${S.U.Vu}`, VERT)}
      {ligne('Norme ‖Δv‖', `${nb(nDv * S.U.Vf)} ${S.U.Vu}`, ROUGE)}
      {ligne('Direction de Δv', direction(dv.x, dv.y), ROUGE)}
      {!cache.cmp && ligne('m·‖Δv‖ / Δt', `${nb(nCmp)} N`, VIOLET)}
      {!cache.F && ligne('Somme des forces ‖ΣF‖', `${nb(nSF)} N`)}
      {!cache.F && ligne('Direction de ΣF', direction(SF.x, SF.y))}
      {!cache.F && !cache.cmp && ligne('Écart relatif m·Δv/Δt par rapport à ΣF', isFinite(ecart) ? `${vir(ecart.toFixed(1))} %` : '—')}
      {!cache.F && !cache.cmp && ligne('Angle entre Δv et ΣF', isFinite(ang) ? `${vir(ang.toFixed(1))}°` : '—')}
      {idxDeep(<div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Vitesses calculées sur les positions : v_[j] ≈ A_[j−1]A_[j+1] / (2τ). Le tableau change quand on déplace le point étudié ou la valeur de k.</div>)}
    </div>);
  const mesuresEuler = ongletAff === 'euler' && (
    <div style={{ ...styleBoite, ...cadre('bilan') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Écart avec le mouvement exact</div>
      {ligne('Pas de calcul Δt', `${nb(dtE * S.U.Tf)} ${S.U.Tu}`)}
      {ligne('Nombre de pas', String(trajE.length - 1))}
      {ligne('Écart à la date finale', `${nb(dEuler * S.U.Lf)} ${S.U.Lu}`)}
      {rEuler != null && ligne('Rayon final calculé / rayon réel', vir(rEuler.toFixed(2)))}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Plus le pas est petit, plus le calcul colle au mouvement. Pour la Lune, un pas trop grand « éloigne » le satellite.</div>
    </div>);

  const onglets = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 10px' }}>
      {[['chrono', '📸 Chronophotographie : Δv et forces'], ['euler', '🧮 Prédire le mouvement (Euler)']].map(([c, l]) =>
        <button key={c} onClick={() => setTab(c)} style={stylePetitBouton(tab === c, '#334155')}>{l}</button>)}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Point matériel</strong> : chaque système est réduit à son centre d’inertie, dont on étudie le mouvement.</li>
      <li><strong>Positions fournies par un modèle</strong> (chute libre, parabole, orbite circulaire…) : ce n’est pas une mesure. Ce choix permet de voir que Δv est constant (ou varie régulièrement) sans être gêné par les erreurs. Une vraie vidéo pointée est bruitée : le curseur « bruit de pointage » le montre, et Δv, qui est une double différence, y est très sensible.</li>
      <li><strong>Vitesse</strong> : v_[i] ≈ A_[i−1]A_[i+1] / (2τ) est une vitesse <em>moyenne</em> sur 2τ, pas la vitesse instantanée (valable si τ est petit devant la durée de variation).</li>
      <li><strong>Relation approchée</strong> : ΣF ≈ m·Δv/Δt avec Δt = 2k·τ. Elle est exacte quand Δt tend vers 0 (deuxième loi de Newton) ; l’écart croît avec Δt si la force varie.</li>
      <li><strong>Référentiel galiléen</strong> : le référentiel terrestre pour les mouvements près du sol ; le référentiel géocentrique pour la Lune. On suppose que ces référentiels sont galiléens (approximation).</li>
      <li><strong>Pesanteur</strong> : g = 9,8 N/kg, uniforme ; frottements de l’air négligés, sauf pour le parachutiste.</li>
      <li><strong>Parachutiste</strong> : frottement modélisé par f = m·g·(v/v_lim)² avec v_[lim] = 6 m/s. Ce modèle est simple ; la valeur réelle dépend de la forme du parachute et de l’air.</li>
      <li><strong>Lune</strong> : orbite circulaire, mouvement uniforme, seule la gravitation de la Terre est prise en compte (on néglige le Soleil).</li>
      <li><strong>Mobile et plan incliné</strong> : frottements négligeables (coussin d’air, plan lisse) ; la réaction du support est normale au support.</li>
      <li><strong>Méthode d’Euler</strong> : pendant un pas, la force est supposée constante ; la position est mise à jour avec la vitesse du <em>début</em> du pas. L’erreur s’accumule quand le pas est grand.</li>
      <li><strong>Échelles</strong> : la flèche de vitesse (et de Δv) et la flèche de force n’ont pas la même échelle ; elles sont indiquées dans la légende.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{idxDeep(hypotheses)}</Section>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Chute, lancer vertical, lancer en biais : comparez la direction de v et celle de Δv. Laquelle ne change jamais ?</li>
        <li>Mobile : mettez F = 0 puis augmentez F. Quand Δv est-il nul ? Que se passe-t-il si on divise la masse par deux ?</li>
        <li>Plan incliné : faites varier l’angle. Comment évolue ‖ΣF‖ ?</li>
        <li>Parachutiste : à quel moment Δv est-il presque nul ? Que valent alors P et f ?</li>
        <li>Lune : passez de k = 1 à k = 3. Que devient l’écart entre m·Δv/Δt et ΣF ?</li>
        <li>Ajoutez du bruit de pointage (3 %) : les flèches Δv restent-elles « propres » ? Que faudrait-il faire pour mieux les voir ?</li>
        <li>Onglet « Prédire » : calculez l’orbite de la Lune avec un pas d’un jour, puis de 0,1 jour.</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>ΣF ≈ m·Δv/Δt : Δv a la direction et le sens de ΣF</li>
        <li>Δv = 0 si et seulement si ΣF = 0 (principe d’inertie)</li>
        <li>v et ΣF n’ont pas de lien de direction ; Δv et ΣF, si</li>
        <li>à même force, le moins massif varie le plus : Δv ∝ 1/m</li>
        <li>plus Δt est petit, mieux la relation est vérifiée</li>
      </ul>
    </ARetenir>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mv-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .mv-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .mv-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .mv-l1.cote, .mv-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mouvement d’un système : variation de vitesse et forces</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le vecteur vitesse d’un système change quand les forces ne se compensent pas. À partir d’une chronophotographie, on construit
        la variation Δv entre deux dates voisines et on la relie à la somme des forces : ΣF ≈ m·Δv/Δt.</div>
      {mode === 'explore' && onglets}
      <div className={`mv-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}>
            <VoletDefi defi={defi} setDefi={setDefi} changerType={t => setDefi(nouveauDefi(t)) || setSc(s => ({ ...s, i: 5, k: 1, etape: 0 }))}/></div>}
          <div className={`mv-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}{mesuresEuler}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES_I} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="mv-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="mv-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
