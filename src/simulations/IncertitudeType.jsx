import { useState, useMemo, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, lireNombre } from "../commun";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { Pic } from "../Pictos";

const SIM_ID = 78;
declarerDefis(SIM_ID, [['principal', 'Écrire un résultat avec son incertitude-type']]);

// ====================================================
// SIM 78 — ÉCRIRE UN RÉSULTAT AVEC SON INCERTITUDE-TYPE (TSTL)
// ====================================================
// Idée : l'élève écrit « résultat + incertitude-type » (incertitude de type A : dispersion de n mesures), puis découvre par la simulation
// que l'intervalle x̄ ± u NE garantit PAS que la valeur vraie s'y trouve. Convention d'arrondi de la classe :
//   u commence par 1, 2, 3 ou 4 → 2 chiffres significatifs ; u commence par 5, 6, 7, 8 ou 9 → 1 chiffre significatif ;
//   le résultat est arrondi à la même décimale que u.

const COULEUR = '#0f766e', ROUGE = '#b91c1c';

// ── Calcul ──
const rng = graine => { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// Écart aléatoire d'écart-type 1 selon la loi : normale, rectangulaire ou triangulaire
function tire(r, loi) {
  if (loi === 'rect') return (2 * r() - 1) * Math.sqrt(3);
  if (loi === 'tri') return (r() + r() - 1) * Math.sqrt(6);
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}
const stats = v => {
  const n = v.length, m = v.reduce((s, x) => s + x, 0) / n;
  const s = Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1));
  return { n, m, s, u: s / Math.sqrt(n) };
};
const serie = (r, n, vrai, sigma, biais, loi) => Array.from({ length: n }, () => vrai + biais + sigma * tire(r, loi));
const eleves100 = (graine, n, vrai, sigma, biais, loi) => { const r = rng(graine); return Array.from({ length: 100 }, () => { const { m, u } = stats(serie(r, n, vrai, sigma, biais, loi)); return { m, u }; }); };

// Convention d'arrondi de la classe
const csDe = u => { const e = Math.floor(Math.log10(u)); return Math.floor(u / 10 ** e + 1e-9) <= 4 ? 2 : 1; };
const decDe = u => Math.max(0, csDe(u) - 1 - Math.floor(Math.log10(u)));
const fr = (x, d) => x.toFixed(d).replace('.', ',');
const nbDec = s => { const t = String(s).trim().replace('.', ','); return t.includes(',') ? t.split(',')[1].replace(/\D.*$/, '').length : 0; };
const ecriture = ({ m, u }) => { const d = decDe(u); return { d, x: fr(m, d), u: fr(u, d), cs: csDe(u) }; };

// ── Graphique : un intervalle par « élève » ──
function Intervalles({ liste, k, vrai }) {
  const bas = Math.min(...liste.map(e => e.m - k * e.u)), haut = Math.max(...liste.map(e => e.m + k * e.u));
  const marge = (haut - bas) * 0.05 + 1e-12, a = Math.min(bas, vrai) - marge, b = Math.max(haut, vrai) + marge;
  const X = x => 20 + (x - a) / (b - a) * 560, H = 4.2;
  const dehors = liste.filter(e => Math.abs(e.m - vrai) > k * e.u).length;
  return (
    <div>
      <svg role="img" aria-label={`100 intervalles : ${100 - dehors} contiennent la valeur vraie`} viewBox={`0 0 600 ${liste.length * H + 30}`} style={{ width: '100%', background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8 }}>
        {liste.map((e, i) => {
          const ok = Math.abs(e.m - vrai) <= k * e.u, y = 8 + i * H;
          return <g key={i}><line x1={X(e.m - k * e.u)} x2={X(e.m + k * e.u)} y1={y} y2={y} stroke={ok ? COULEUR : ROUGE} strokeWidth="2.2"/><circle cx={X(e.m)} cy={y} r="1.5" fill={ok ? COULEUR : ROUGE}/></g>;
        })}
        <line x1={X(vrai)} x2={X(vrai)} y1="2" y2={liste.length * H + 14} stroke="#0f172a" strokeDasharray="4 3"/>
        <text x={X(vrai)} y={liste.length * H + 26} fontSize="11.5" textAnchor="middle" fill="#0f172a">valeur vraie (cachée à l’élève)</text>
      </svg>
      <div data-compte-int style={{ fontSize: 14, color: KIT.txt, marginTop: 4 }}>
        <b style={{ color: COULEUR }}>{100 - dehors}</b> intervalles sur 100 contiennent la valeur vraie ; <b style={{ color: ROUGE }}>{dehors}</b> ne la contiennent pas.
      </div>
    </div>);
}

const LOIS = [['normale', 'normale'], ['rect', 'rectangulaire'], ['tri', 'triangulaire']];
const VRAI0 = 0.125, SIGMA0 = 0.005, N0 = 10;

export function SimulationIncertitudeType() {
  const [mode, setMode] = useState(() => modeOuverture('incertitude-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('incertitude-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  // Réglages (en exploration) ; en parcours guidé, seuls k et le biais bougent, à la demande des étapes
  const [n, setN] = useState(N0);
  const [sigma, setSigma] = useState(SIGMA0);
  const [biais, setBiais] = useState(0);
  const [k, setK] = useState(1);
  const [loi, setLoi] = useState('normale');
  const [graine, setGraine] = useState(11);
  const [serieVue, setSerieVue] = useState(false);
  const [simVue, setSimVue] = useState(false);

  const mesures = useMemo(() => serie(rng(7), N0, VRAI0, SIGMA0, 0, 'normale').map(x => Math.round(x * 1e4) / 1e4), []);
  const st = useMemo(() => stats(mesures), [mesures]);
  const ec = ecriture(st);
  const eleves = useMemo(() => eleves100(graine, n, VRAI0, sigma, biais, loi), [graine, n, sigma, biais, loi]);
  const enGuide = mode === 'guide';
  const e0 = guide.etape;

  // ── Défi : une série tirée au hasard, à écrire correctement ──
  function nouveauDefi() {
    const r = Math.random, vrai = Math.round((0.05 + r() * 0.45) * 1000) / 1000, sig = vrai * (0.015 + r() * 0.05), nn = 5 + Math.floor(r() * 6);
    const v = serie(r, nn, vrai, sig, 0, 'normale').map(x => Math.round(x * 1e4) / 1e4);
    setDefi({ v, s: stats(v), x: '', u: '', verifie: false });
  }
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi(); }
  // Ouverture directe en mode défi (mission d'un escape game) : le défi doit être tiré comme au clic sur l'onglet « Défi »
  useEffect(() => { if (mode === 'defi' && !defi) changerMode('defi'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const verifDefi = () => {
    const w = ecriture(defi.s), x = lireNombre(defi.x), u = lireNombre(defi.u);
    const ok = Math.abs(x - lireNombre(w.x)) < 1e-9 && Math.abs(u - lireNombre(w.u)) < 1e-9 && nbDec(defi.x) === w.d && nbDec(defi.u) === w.d;
    noterDefi(ok); setDefi(d => ({ ...d, verifie: true, ok, w }));
  };

  // ── Parcours guidé ──
  const candidates = [ec.x, fr(st.m, ec.d + 2)];
  const phrase = (x, u, fin = ' mol/L') => `La concentration c de la solution est ${x} mol/L (moyenne de ${N0} mesures) avec une incertitude-type de ${u}${fin}.`;
  const ETAPES = [
    { id: 'objectif', titre: 'Que doit-on écrire ?', texte: <>Un dosage répété {N0} fois ne donne pas {N0} fois la même valeur. On résume ces mesures par <strong>un résultat</strong> (la moyenne) accompagné de <strong>son incertitude-type</strong> u, qui décrit la dispersion. Au niveau STL, on attend une phrase du type : « le résultat est … avec une incertitude-type de … ».</>,
      tache: { type: 'qcm', q: 'Que représente l’incertitude-type u dans cette phrase ?', options: ['La dispersion des résultats de la méthode', 'L’écart entre mon résultat et la valeur vraie', 'La précision de la calculatrice'], bonne: 0, expl: 'u décrit à quel point les mesures se dispersent. Elle ne dit pas, à elle seule, où est la valeur vraie.' } },
    { id: 'mesures', titre: 'Les mesures', texte: <>Faites {N0} dosages d’une même solution. Chaque mesure est un peu différente : c’est la <strong>dispersion</strong>.</>,
      tache: { type: 'action', ok: serieVue, label: `Faire ${N0} mesures →`, faire: () => setSerieVue(true) } },
    { id: 'u', titre: 'Calculer l’incertitude-type', texte: <>La calculatrice donne la moyenne x̄ = {st.m.toFixed(6).replace('.', ',')} mol/L et l’écart-type s = {st.s.toFixed(6).replace('.', ',')} mol/L. L’incertitude-type <strong>de la moyenne</strong> est u = s / √n, avec n = {N0}.</>,
      tache: { type: 'num', q: 'Calculez u = s / √n', unite: 'mol/L', vrai: st.u, tol: 0.02, affiche: x => fr(x, 6), aide: 'Écrivez au moins 3 chiffres significatifs.', indice: 'Divisez s par la racine carrée de 10 (≈ 3,162).', expl: `u = ${fr(st.s, 6)} / √${N0} = ${fr(st.u, 6)} mol/L.` } },
    { id: 'arrondi', titre: 'Arrondir u', texte: <>Un résultat ne s’écrit pas avec tous les chiffres de la calculatrice. Règle de la classe : si u commence par <strong>1, 2, 3 ou 4</strong>, on garde <strong>2 chiffres significatifs</strong> ; s’il commence par <strong>5, 6, 7, 8 ou 9</strong>, on en garde <strong>1</strong>.</>,
      tache: { type: 'qcm', q: `u = ${fr(st.u, 6)} mol/L. Quelle écriture respecte la règle ?`, options: [`${ec.u} mol/L`, `${fr(st.u, ec.d + 2)} mol/L`, `${fr(st.u, Math.max(ec.d - 1, 0))} mol/L`], bonne: 0, expl: `Le premier chiffre significatif de u est ${String(ec.u).replace(/^0,0*/, '')[0]} : on garde ${ec.cs} chiffre${ec.cs > 1 ? 's' : ''} significatif${ec.cs > 1 ? 's' : ''}.` } },
    { id: 'moyenne', titre: 'Arrondir le résultat', texte: <>Le résultat s’arrondit <strong>à la même décimale que u</strong> : ici u s’écrit avec {ec.d} décimales, le résultat aussi.</>,
      tache: { type: 'qcm', q: `x̄ = ${fr(st.m, 6)} mol/L. Quelle écriture est cohérente avec u = ${ec.u} mol/L ?`, options: [`${ec.x} mol/L`, `${candidates[1]} mol/L`, `${fr(st.m, Math.max(ec.d - 1, 0))} mol/L`], bonne: 0, expl: `On garde ${ec.d} décimales, comme pour u : ${ec.x} mol/L.` } },
    { id: 'phrase', titre: 'Écrire la phrase', texte: <>Il reste à écrire une phrase complète : le <strong>résultat avec son unité</strong>, <strong>d’où il vient</strong> (moyenne de {N0} mesures, ou mesurage unique) et <strong>l’incertitude-type avec son unité</strong>. L’écriture « c = 0,125 ± 0,008 mol/L » est courante, mais elle fait croire à tort que la valeur vraie est à coup sûr dans l’intervalle.</>,
      tache: { type: 'qcm', q: 'Quelle phrase est correcte ?', options: [phrase(ec.x, ec.u), phrase(fr(st.m, ec.d + 2), ec.u), phrase(fr(st.m, Math.max(ec.d - 1, 0)), ec.u), `c = ${ec.x} ± ${ec.u}`], bonne: 0, expl: 'Résultat et u ont la même décimale, les unités sont présentes, la nature de u est dite (incertitude-type).' } },
    { id: 'pari', titre: 'Un pari', texte: <>Votre phrase est écrite. Question : <strong>la valeur vraie de la concentration est-elle forcément dans l’intervalle [x̄ − u ; x̄ + u] ?</strong> Imaginez 100 élèves qui refont le même dosage, chacun avec sa propre phrase (sa propre moyenne et son propre u).</>,
      tache: { type: 'qcm', q: 'Sur 100 élèves, combien auront la valeur vraie dans leur intervalle [x̄ − u ; x̄ + u] ?', options: ['À peu près 2 sur 3 (environ 65)', 'Les 100 : l’intervalle contient forcément la valeur vraie', 'Environ la moitié (50)', 'Seulement 5 ou 6'], bonne: 0, expl: 'On va le vérifier avec la simulation à l’étape suivante.' } },
    { id: 'revele', titre: 'On refait l’expérience 100 fois', texte: <>Chaque trait est l’intervalle [x̄ − u ; x̄ + u] d’un élève. La ligne noire est la valeur vraie, connue de la simulation seulement.</>,
      tache: { type: 'action', ok: simVue, label: 'Simuler 100 élèves →', faire: () => { setK(1); setBiais(0); setSimVue(true); } } },
    { id: 'conclu', titre: 'Ce que l’on constate', texte: <>Environ <strong>2 intervalles sur 3</strong> contiennent la valeur vraie : un tiers ne la contient pas. Avec seulement {N0} mesures, c’est même un peu moins de 2 sur 3.</>,
      tache: { type: 'qcm', q: 'Quelle phrase est vraie ?', options: ['La valeur vraie est probablement proche de x̄, mais rien ne garantit qu’elle soit dans [x̄ − u ; x̄ + u]', 'La valeur vraie est toujours dans [x̄ − u ; x̄ + u]', 'u est l’écart entre x̄ et la valeur vraie'], bonne: 0, expl: 'u décrit la dispersion de la méthode, pas l’erreur réelle commise sur ce résultat.' } },
    { id: 'k2', titre: 'Un intervalle plus large', texte: <>Doublez la largeur : utilisez [x̄ − 2u ; x̄ + 2u]. C’est ce que l’on fait pour comparer une mesure à une référence (règle « écart ≤ 2u »).</>,
      tache: { type: 'action', ok: simVue && k === 2, label: 'Passer à 2u', faire: () => setK(2) } },
    { id: 'biais', titre: 'Et s’il y a une erreur systématique ?', texte: <>Supposons maintenant que la burette soit mal étalonnée : toutes les mesures sont décalées de +0,010 mol/L. Les mesures restent regroupées, donc u reste petite… mais le résultat est faux.</>,
      tache: { type: 'action', ok: simVue && biais > 0, label: 'Ajouter un défaut de burette (+0,010 mol/L)', faire: () => { setBiais(0.01); setK(1); } } },
    { id: 'biais-q', titre: 'Plus de mesures, plus juste ?', texte: <>Regardez le graphique : avec la burette décalée, presque tous les intervalles ratent la valeur vraie. On pense alors à faire plus de mesures pour réduire u.</>,
      tache: { type: 'qcm', q: 'Avec la burette décalée, si l’on fait 100 mesures au lieu de 10, la valeur vraie sera-t-elle plus souvent dans l’intervalle ?', options: ['Non : u diminue, mais le décalage reste ; les intervalles ratent encore plus souvent la valeur vraie', 'Oui : plus de mesures corrigent tout', 'Oui, mais seulement pour 2u'], bonne: 0, expl: 'Répéter les mesures réduit la dispersion, jamais une erreur systématique. Seul un meilleur étalonnage la corrige.' } },
    { id: 'bilan', titre: 'Bilan', texte: <>Voici ce qu’il faut savoir écrire et comprendre.</>,
      retenirTitre: 'À RETENIR',
      retenir: <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>On donne <b>un résultat x</b> (moyenne de n mesures, ou mesurage unique) <b>et son incertitude-type u</b>, avec l’unité, dans une phrase.</li>
        <li>u : 2 chiffres significatifs si elle commence par 1 à 4, 1 chiffre sinon ; x est arrondi à la même décimale.</li>
        <li>Ma meilleure estimation est x ; la dispersion de ma méthode est u.</li>
        <li>Rien ne garantit que la valeur vraie soit dans [x − u ; x + u] (environ 2 fois sur 3 seulement).</li>
        <li>Une erreur systématique n’est pas contenue dans u : plus de mesures ne la corrigent pas.</li>
      </ul> },
  ];

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Les mesures sont <b>indépendantes</b> et obtenues dans les mêmes conditions.</li>
      <li>Seule la <b>dispersion aléatoire</b> est prise en compte : c’est une incertitude de <b>type A</b>. Une erreur systématique n’y figure pas (voir l’étape du défaut de burette).</li>
      <li>Les proportions « 2 sur 3 » (pour ±u) et « environ 9 sur 10 » (pour ±2u) valent pour des écarts de loi <b>à peu près normale</b>. Avec peu de mesures, elles sont un peu plus faibles, car l’écart-type lui-même est estimé.</li>
      <li>u = s / √n est l’incertitude-type <b>de la moyenne</b> ; pour un mesurage unique, on prendrait s.</li>
    </ul>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
    </span>);

  // ── Panneaux ──
  const tableau = (v, titre) => (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 14.5, color: KIT.txt, marginBottom: 6 }}>{titre}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {v.map((x, i) => <span key={i} style={{ fontFamily: 'monospace', fontSize: 13.5, background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 6, padding: '2px 7px' }}>{fr(x, 4)}</span>)}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>en mol/L</div>
    </div>);
  const resume = (s, e, montreU = true) => (
    <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
      <div>n = {s.n} · x̄ = {s.m.toFixed(6).replace('.', ',')} mol/L · s = {s.s.toFixed(6).replace('.', ',')} mol/L</div>
      {montreU && <div>u = s / √n = <b>{s.u.toFixed(6).replace('.', ',')}</b> mol/L {e && <>→ <b>{e.u}</b> mol/L ({e.cs} chiffre{e.cs > 1 ? 's' : ''} significatif{e.cs > 1 ? 's' : ''}) ; x̄ → <b>{e.x}</b> mol/L</>}</div>}
    </div>);
  const graphique = (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 14.5, color: KIT.txt, marginBottom: 6 }}>100 élèves refont le dosage : intervalle [x̄ − {k === 2 ? '2u' : 'u'} ; x̄ + {k === 2 ? '2u' : 'u'}]</div>
      <Intervalles liste={eleves} k={k} vrai={VRAI0}/>
      {mode === 'explore' || (enGuide && e0 >= 8) ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <button onClick={() => setK(1)} style={stylePetitBouton(k === 1, COULEUR)}>± u</button>
          <button onClick={() => setK(2)} style={stylePetitBouton(k === 2, COULEUR)}>± 2u</button>
          <button onClick={() => setGraine(g => g + 1)} style={stylePetitBouton(false)}>🎲 Refaire</button>
        </div>) : null}
    </div>);
  const reglages = (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 14.5, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {[['Nombre de mesures n', n, setN, 2, 50, 1, v => v], ['Dispersion des mesures σ (mol/L)', sigma, setSigma, 0.001, 0.02, 0.001, v => fr(v, 3)], ['Défaut systématique (mol/L)', biais, setBiais, 0, 0.02, 0.001, v => fr(v, 3)]].map(([nom, val, f, mi, ma, pas, aff]) => (
        <label key={nom} style={{ display: 'block', fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>{nom} : <b>{aff(val)}</b>
          <input type="range" min={mi} max={ma} step={pas} value={val} onChange={e => f(parseFloat(e.target.value))} style={{ width: '100%', accentColor: COULEUR }}/></label>))}
      <div style={{ fontSize: 13.5, color: KIT.txt }}>Loi des écarts :{' '}
        {LOIS.map(([c, l]) => <button key={c} onClick={() => setLoi(c)} style={{ ...stylePetitBouton(loi === c, COULEUR), marginRight: 4 }}>{l}</button>)}</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Pour aller plus loin : avec une loi rectangulaire ou triangulaire, les proportions changent pour une seule mesure, mais plus on moyenne de mesures, plus la loi de la moyenne ressemble à une loi normale.</div>
    </div>);

  const voletDefi = defi && (
    <div data-defi>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, color: KIT.txt }}><Pic n="target"/>Défi : écris le résultat</h3>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8 }}>Voici une série de dosages. Donne le résultat <b>x̄</b> et son incertitude-type <b>u</b>, avec le bon arrondi (règle de la classe : 2 chiffres significatifs pour u si elle commence par 1 à 4, sinon 1 ; x̄ à la même décimale).</div>
      {tableau(defi.v, `${defi.v.length} mesures de concentration`)}
      <div style={{ ...styleBoite, margin: '8px 0', fontSize: 14, color: KIT.txt }}>La calculatrice donne : x̄ = {defi.s.m.toFixed(6).replace('.', ',')} mol/L ; s = {defi.s.s.toFixed(6).replace('.', ',')} mol/L ; n = {defi.s.n}. Rappel : u = s / √n.</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['x', 'Résultat x̄'], ['u', 'Incertitude-type u']].map(([c, l]) => (
          <label key={c} style={{ fontSize: 14, color: KIT.txt }}>{l} :{' '}
            <input aria-label={l} value={defi[c]} onChange={e => { const val = e.target.value; setDefi(d => ({ ...d, [c]: val, verifie: false })); }} onKeyDown={e => { if (e.key === 'Enter') verifDefi(); }}
              style={{ fontSize: 15, padding: '4px 8px', width: 110, borderRadius: 6, border: `1.5px solid ${KIT.bord}`, color: KIT.txt }}/> mol/L</label>))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button onClick={verifDefi} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && (defi.ok
        ? <div style={{ marginTop: 8, color: '#15803d', fontWeight: 700 }}><Pic n="ok"/>Bravo ! La phrase : « le résultat est {defi.w.x} mol/L avec une incertitude-type de {defi.w.u} mol/L ».</div>
        : <div style={{ marginTop: 8, color: ROUGE, fontWeight: 700 }}><Pic n="ko"/>Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>Vérifie u = s / √n, le nombre de chiffres significatifs de u (selon son premier chiffre), puis que x̄ a la même décimale que u. Attendu : x̄ = {defi.w.x} et u = {defi.w.u} mol/L.</span></div>)}
    </div>);

  const montreSerie = mode === 'explore' || (enGuide && e0 >= 1 && serieVue) || (enGuide && e0 > 1);
  const montreResume = mode === 'explore' || (enGuide && e0 >= 2);
  const montreGraphe = mode === 'explore' || (enGuide && e0 >= 7 && simVue);
  const explorePanneaux = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {mode === 'explore' && <div style={{ fontSize: 14, color: KIT.txt2 }}>Une série de {N0} dosages (en mol/L), puis 100 « élèves » qui refont l’expérience : l’intervalle [x̄ − u ; x̄ + u] contient-il la valeur vraie ?</div>}
      {montreSerie && tableau(mesures, `${N0} mesures de concentration`)}
      {montreResume && resume(st, enGuide && e0 < 6 ? null : ec, !enGuide || e0 >= 3)}
      {mode === 'explore' && reglages}
      {montreGraphe && graphique}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .in-l1 { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        .in-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (max-width: 960px) { .in-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Écrire un résultat avec son incertitude-type</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`in-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi}/></></div> : explorePanneaux}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : null}
      </div>
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
      {mode === 'explore' && (
        <div style={{ ...styleBoite, marginTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
            <li>Passez de ± u à ± 2u : combien d’intervalles contiennent la valeur vraie ?</li>
            <li>Augmentez n : u diminue-t-elle ? La proportion d’intervalles « justes » change-t-elle ?</li>
            <li>Ajoutez un défaut systématique, puis augmentez n : que deviennent les intervalles ?</li>
            <li>Changez la loi des écarts : la proportion pour ± u change-t-elle quand n est grand ?</li>
          </ul>
        </div>)}
    </div>
  );
}
