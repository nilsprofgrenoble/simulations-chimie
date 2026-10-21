import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, avecIndices } from "../commun";
import { fr, courbeCorps, intensiteCorps, lambdaMax, tempDepuisLmax, rgbLambda, css, couleurCorps, couleurVue, courbeCorpsTerre, ETOILES, GAZ, gaz, couleurLampe, raieProche } from "./spectresModele";

// ====================================================
//  SIM 66 — SPECTRES D'ÉMISSION (2GT, « Ondes et signaux »)
//  Atelier 1 : corps chaud (spectre continu, couleur et température). Atelier 2 : lampes à décharge (spectres de raies, identification d'un gaz).
//  Atelier 3 : étoiles (température de surface à partir du maximum du spectre).
//  Hypothèses : voir la liste « Hypothèses de travail » ci-dessous.
// ====================================================

const SIM = 66;
declarerDefis(SIM, [
  ['gaz', 'Identifier un gaz'],
  ['comparer', 'Comparer deux étoiles'],
  ['temperature', 'Température d’une étoile'],
]);
const TITRES = { gaz: 'Identifier un gaz', comparer: 'Comparer deux étoiles', temperature: 'Température d’une étoile' };
const VERT = '#15803d', ORANGE = '#b45309';
const alea = l => l[Math.floor(Math.random() * l.length)];
const nm = x => `${fr(x, Math.abs(x - Math.round(x)) < 0.05 ? 0 : 1)} nm`;

// ---------- spectrogramme (intensité en fonction de la longueur d'onde) ----------
function Spectro({ xmin = 200, xmax = 1000, courbe, courbe2, raies, etiq, curseur, compact, titre, w = 700 }) {
  const H = compact ? 92 : 250, X0 = 46, X1 = w - 14, Y0 = compact ? 8 : 14, Y1 = compact ? 66 : 196;
  const X = x => X0 + (x - xmin) / (xmax - xmin) * (X1 - X0), Y = v => Y1 - v * (Y1 - Y0);
  const graduations = []; for (let x = Math.ceil(xmin / 100) * 100; x <= xmax; x += 100) graduations.push(x);
  const bandes = []; for (let x = Math.max(xmin, 380); x < Math.min(xmax, 780); x += 5) bandes.push(x);
  return (
    <svg viewBox={`0 0 ${w} ${H}`} width="100%" role="img" aria-label={titre || 'Spectrogramme : intensité lumineuse en fonction de la longueur d’onde'} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      {xmin < 400 && <rect x={X(xmin)} y={Y0} width={X(400) - X(xmin)} height={Y1 - Y0} fill="#ede9fe" opacity="0.7"/>}
      {xmax > 800 && <rect x={X(800)} y={Y0} width={X(xmax) - X(800)} height={Y1 - Y0} fill="#fee2e2" opacity="0.7"/>}
      {!compact && xmin < 400 && <text x={(X(xmin) + X(400)) / 2} y={Y0 + 14} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#6d28d9">ultraviolet</text>}
      {!compact && xmax > 800 && <text x={(X(800) + X(xmax)) / 2} y={Y0 + 14} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#b91c1c">infrarouge</text>}
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="#0f172a" strokeWidth="2"/><line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="#0f172a" strokeWidth="2"/>
      {graduations.map(x => <g key={x}><line x1={X(x)} y1={Y1} x2={X(x)} y2={Y1 + 5} stroke="#0f172a"/><text x={X(x)} y={Y1 + (compact ? 17 : 36)} textAnchor="middle" fontSize="11.5" fill="#334155">{x}</text></g>)}
      {!compact && <><text x={(X0 + X1) / 2} y={H - 4} textAnchor="middle" fontSize="12.5" fontWeight="700">longueur d’onde λ (nm)</text>
        <text x="12" y={(Y0 + Y1) / 2} fontSize="12.5" fontWeight="700" transform={`rotate(-90 12 ${(Y0 + Y1) / 2})`} textAnchor="middle">intensité</text>
        {bandes.map(x => <rect key={x} x={X(x)} y={Y1 + 8} width={X(x + 5) - X(x) + 0.5} height="10" fill={css(rgbLambda(x + 2.5))}/>)}</>}
      {courbe && <><path d={`M ${X(courbe[0][0])} ${Y1} ` + courbe.map(([x, v]) => `L ${X(x)} ${Y(v)}`).join(' ') + ` L ${X(courbe[courbe.length - 1][0])} ${Y1} Z`} fill="#0072b2" opacity="0.18"/>
        <polyline points={courbe.map(([x, v]) => `${X(x)},${Y(v)}`).join(' ')} fill="none" stroke="#0072b2" strokeWidth="3" strokeLinejoin="round"/></>}
      {courbe2 && <polyline points={courbe2.map(([x, v]) => `${X(x)},${Y(v)}`).join(' ')} fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="6 5"/>}
      {raies && raies.filter(([x]) => x >= xmin && x <= xmax).map(([x, v]) => <line key={x} x1={X(x)} y1={Y1} x2={X(x)} y2={Y(v)} stroke={css(rgbLambda(x))} strokeWidth={compact ? 3 : 4} strokeLinecap="round"/>)}
      {raies && raies.filter(([x]) => x >= xmin && x <= xmax).map(([x, v]) => <line key={`c${x}`} x1={X(x)} y1={Y1} x2={X(x)} y2={Y(v)} stroke="#0f172a" strokeWidth="0.8" opacity="0.6"/>)}
      {etiq && raies && raies.filter(([x]) => etiq.includes(x)).map(([x, v]) => <text key={`e${x}`} x={X(x)} y={Y(v) - 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#0f172a" stroke="#fff" strokeWidth="3" paintOrder="stroke">{fr(x, 1)}</text>)}
      {curseur != null && curseur >= xmin && curseur <= xmax && <g><line x1={X(curseur)} y1={Y0} x2={X(curseur)} y2={Y1} stroke="#d55e00" strokeWidth="2" strokeDasharray="6 4"/>
        <text x={X(curseur) + (curseur > (xmin + xmax) * 0.8 ? -6 : 6)} y={Y0 + (compact ? 10 : 30)} textAnchor={curseur > (xmin + xmax) * 0.8 ? 'end' : 'start'} fontSize="12.5" fontWeight="800" fill="#d55e00">{fr(curseur, 0)} nm</text></g>}
      {titre && compact && <text x={X1 - 4} y={Y0 + 12} textAnchor="end" fontSize="13" fontWeight="800" fill="#0f172a">{titre}</text>}
    </svg>);
}

// ---------- ce que l'on voit sur l'écran (400–800 nm) ----------
function Bande({ T, raies, nom }) {
  const xs = []; for (let x = 400; x < 780; x += 4) xs.push(x);
  let m = 0; if (T != null) for (const x of xs) m = Math.max(m, intensiteCorps(x, T));
  const lum = T != null ? Math.min(1, 0.25 + (T - 500) / 1500) : 1;
  return (
    <svg viewBox="0 0 700 56" width="100%" role="img" aria-label={`Spectre sur l’écran : ${nom || ''}`} style={{ display: 'block', borderRadius: 8, background: '#000' }}>
      {T != null && T >= 500 && xs.map(x => <rect key={x} x={(x - 400) / 400 * 700} y="0" width="8" height="56" fill={css(rgbLambda(x + 2))} opacity={Math.min(1, Math.sqrt(intensiteCorps(x, T) / m)) * lum}/>)}
      {raies && raies.filter(([x]) => x >= 400 && x <= 800).map(([x, v]) => <rect key={x} x={(x - 400) / 400 * 700 - 2} y="0" width="4" height="56" fill={css(rgbLambda(x))} opacity={0.45 + 0.55 * v}/>)}
      <text x="8" y="50" fontSize="12" fontWeight="700" fill="#fff" opacity="0.9" stroke="#000" strokeWidth="3" paintOrder="stroke">{nom}</text>
      <text x="692" y="50" fontSize="11" fill="#fff" opacity="0.8" textAnchor="end">400 nm → 800 nm</text>
    </svg>);
}

// ---------- tableau des spectres de gaz (comme la fiche du TP) ----------
function TableauGaz() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 6 }}>
      {GAZ.map(g => <Spectro key={g.id} xmin={340} xmax={800} raies={g.raies} etiq={g.etiq} compact titre={g.nom} w={400}/>)}
    </div>);
}

// ---------- graphique température = f(λ du maximum) ----------
function Wien({ marque }) {
  const X = l => 46 + (l - 250) / 750 * 330, Y = t => 190 - (t - 1000) / 11000 * 170, pts = [];
  for (let l = 250; l <= 1000; l += 10) { const t = tempDepuisLmax(l); if (t >= 1000 && t <= 12000) pts.push([X(l), Y(t)]); }
  return (
    <svg viewBox="0 0 400 230" width="100%" role="img" aria-label="Température d’un corps chaud en fonction de la longueur d’onde du maximum d’intensité" style={{ display: 'block', maxWidth: 440, background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      {[2000, 4000, 6000, 8000, 10000, 12000].map(t => <g key={t}><line x1="46" y1={Y(t)} x2="376" y2={Y(t)} stroke="#e2e8f0"/><text x="42" y={Y(t) + 4} textAnchor="end" fontSize="10.5" fill="#334155">{t}</text></g>)}
      {[300, 400, 500, 600, 700, 800, 900, 1000].map(l => <g key={l}><line x1={X(l)} y1="20" x2={X(l)} y2="190" stroke="#e2e8f0"/><text x={X(l)} y="205" textAnchor="middle" fontSize="10.5" fill="#334155">{l}</text></g>)}
      <line x1="46" y1="190" x2="376" y2="190" stroke="#0f172a" strokeWidth="2"/><line x1="46" y1="20" x2="46" y2="190" stroke="#0f172a" strokeWidth="2"/>
      <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#009e73" strokeWidth="3"/>
      {marque != null && marque >= 250 && marque <= 1000 && <line x1={X(marque)} y1="20" x2={X(marque)} y2="190" stroke="#d55e00" strokeWidth="1.5" strokeDasharray="5 4"/>}
      <text x="211" y="224" textAnchor="middle" fontSize="11.5" fontWeight="700">λ du maximum (nm)</text>
      <text x="10" y="14" fontSize="11.5" fontWeight="700">température (°C)</text>
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'gaz') return { ...base, g: alea(GAZ).id };
  if (type === 'comparer') { for (;;) { const A = alea([3000, 4000, 5000, 6000, 7000, 8000]), B = alea([3000, 4000, 5000, 6000, 7000, 8000]); if (Math.abs(A - B) >= 1000) return { ...base, A, B, rep: A > B ? 'A' : 'B' }; } }
  return { ...base, T: alea([3500, 4500, 5500, 6500, 7500]) };
}
function evaluer(d) {
  if (d.type === 'temperature') { const x = lireNombre(d.reps.v), ok = isFinite(x) && Math.abs(x - d.T) <= 500; return { ok, lignes: [[ok, ok ? 'Température correcte (à 500 °C près).' : 'Relève d’abord λ du maximum avec le curseur, puis lis la température sur la courbe verte (axes : λ en abscisse, température en ordonnée).']] }; }
  const bon = d.type === 'gaz' ? d.g : d.rep, ok = d.reps.d === bon;
  return { ok, lignes: [[ok, ok ? 'Bonne réponse.' : d.type === 'gaz' ? 'Compare la position et la couleur des raies avec le tableau : chaque gaz a ses propres raies.' : 'Plus un corps est chaud, plus le maximum de son spectre est vers le violet (petite longueur d’onde).']] };
}
function VoletDefi({ defi, setDefi, changerType }) {
  const res = defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const choix = opts => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{opts.map(([v, l]) => <button key={v} onClick={() => rep('d', v)} style={stylePetitBouton(defi.reps.d === v, '#0ea5e9')}>{l}</button>)}</div>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'gaz' && <><div style={txt}>🎯 Une lampe à décharge contient un <strong>gaz inconnu</strong>. Observez son spectre (en bas de la page, avec le curseur pour lire les longueurs d’onde), comparez-le au <strong>tableau des spectres</strong> et identifiez le gaz.</div>
        {choix(GAZ.map(g => [g.id, g.nom]))}</>}
      {defi.type === 'comparer' && <><div style={txt}>🎯 Voici les spectres de deux étoiles. Laquelle a la <strong>température de surface la plus élevée</strong> ?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8, marginBottom: 8 }}>
          {[['A', defi.A], ['B', defi.B]].map(([k, T]) => <div key={k}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Étoile {k}</div><Spectro courbe={courbeCorps(T)} compact titre={`étoile ${k}`}/></div>)}</div>
        {choix([['A', 'L’étoile A'], ['B', 'L’étoile B']])}</>}
      {defi.type === 'temperature' && <><div style={txt}>🎯 Voici le spectre d’une étoile. Avec le curseur, relevez la longueur d’onde du <strong>maximum d’intensité</strong>, puis lisez sur la courbe verte la <strong>température de surface</strong>.</div>
        <label style={{ fontSize: 14, fontWeight: 600 }}>T = <input value={defi.reps.v || ''} onChange={e => rep('v', e.target.value)} inputMode="decimal" aria-label="Votre réponse" style={{ width: 90, padding: '5px 8px', fontSize: 15, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> °C</label></>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'gaz' && <>Le gaz est le <strong>{gaz(defi.g).nom.toLowerCase()}</strong> : ses raies sont à {gaz(defi.g).etiq.map(x => nm(x)).join(', ')}.</>}
        {defi.type === 'comparer' && <>L’étoile <strong>{defi.rep}</strong> est la plus chaude : le maximum de son spectre est plus proche du violet (λ plus petite : {nm(lambdaMax(Math.max(defi.A, defi.B)))} contre {nm(lambdaMax(Math.min(defi.A, defi.B)))}).</>}
        {defi.type === 'temperature' && <>Le maximum est à λ ≈ <strong>{nm(lambdaMax(defi.T))}</strong> : sur la courbe, cela correspond à T ≈ <strong>{defi.T} °C</strong> (à 500 °C près).</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationSpectres() {
  const [mode, setMode] = useState(() => modeOuverture('spectres-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('spectres-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('chaud');
  const [T, setT] = useState(3000);
  const [G, setG] = useState('mercure');
  const [Et, setEt] = useState('soleil');
  const [terre, setTerre] = useState(true);
  const [cur, setCur] = useState(550);
  const [blanche, setBlanche] = useState(false);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const g = gaz(G), etoile = ETOILES.find(e => e.id === Et);
  const Teff = atelier === 'etoiles' ? etoile.T : T;

  const voirC = t => { setAtelier('chaud'); setT(t); };
  const voirG = (id, c = 550, b = false) => { setAtelier('decharge'); setG(id); setCur(c); setBlanche(b); };
  const voirE = (id, c = 550) => { setAtelier('etoiles'); setEt(id); setCur(c); };
  const ETAPES = [
    { id: 'spectre', titre: 'La lumière blanche est un mélange', depart: () => voirC(3000),
      texte: <>Un <strong>prisme</strong> ou un <strong>réseau</strong> permet de séparer les couleurs d’une lumière : c’est la <strong>dispersion</strong>. Ce que l’on obtient s’appelle un <strong>spectre</strong>. Chaque couleur pure est une <strong>radiation</strong>, repérée par sa <strong>longueur d’onde λ</strong> en nanomètres (nm). Le bandeau noir montre ce que l’on voit sur l’écran.
        <ExempleResolu>L’œil ne voit que de <strong>400 nm</strong> (violet) à <strong>800 nm</strong> (rouge). Au-dessous de 400 nm : <strong>ultraviolet</strong> (UV). Au-dessus de 800 nm : <strong>infrarouge</strong> (IR). On ne les voit pas.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Quelle longueur d’onde correspond à une radiation <strong>visible</strong> ?', options: ['550 nm', '200 nm', '1 000 nm', '2 000 nm'], bonne: 0, expl: '550 nm est entre 400 et 800 nm : c’est une radiation visible (verte). 200 nm est dans l’UV, 1 000 nm dans l’IR.' } },
    { id: 'froid', titre: 'Un corps un peu chaud', depart: () => voirC(700),
      texte: <>Tout objet <strong>dense</strong> (solide, liquide) assez chaud émet de la lumière : par exemple le filament d’une lampe ou un fer chauffé. Réglez la température avec le curseur, comme avec le <strong>rhéostat</strong> du TP. Ici : 700 °C. Son spectre est <strong>continu</strong> : toutes les couleurs sont présentes, mais pas avec la même intensité.</>,
      tache: { type: 'qcm', q: 'À 700 °C, de quelle couleur est la lumière perçue ?', options: ['Rouge sombre', 'Bleue', 'Blanche', 'Verte'], bonne: 0, expl: 'À basse température, le spectre est surtout fait de radiations rouges (et infrarouges) : la lumière est rouge sombre.' } },
    { id: 'chaud', titre: 'En chauffant davantage', depart: () => voirC(1500),
      texte: <>Augmentez la température petit à petit jusqu’à <strong>8 000 °C</strong>. Regardez la couleur de la lampe et le spectre.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'chaud' && T >= 7500, consigne: 'Réglez une température d’au moins 7 500 °C.' } },
    { id: 'chaud2', titre: 'Plus chaud, plus de violet', depart: null,
      texte: <>Quand la température monte, le spectre <strong>s’enrichit en radiations vers le violet</strong> et la couleur perçue passe du <strong>rouge</strong> au <strong>jaune</strong>, puis au <strong>blanc</strong>, puis au <strong>bleu</strong> pour les étoiles les plus chaudes. Le <strong>maximum</strong> de la courbe se déplace vers les petites longueurs d’onde.</>,
      tache: { type: 'qcm', q: 'Un corps devient plus chaud. Le maximum de son spectre se déplace…', options: ['vers le violet (λ plus petite)', 'vers le rouge (λ plus grande)', 'il ne bouge pas', 'il disparaît'], bonne: 0, expl: 'Plus T augmente, plus le maximum se déplace vers le violet : λ du maximum diminue.' } },
    { id: 'ir', titre: 'Un objet « froid » brille quand même', depart: () => voirC(300),
      texte: <>À <strong>300 °C</strong>, un objet n’est plus visible dans le noir… pourtant il émet : le maximum de son spectre est dans l’<strong>infrarouge</strong> (au-delà de 800 nm). Une caméra infrarouge le voit. Il faut environ <strong>500 °C</strong> pour que l’œil perçoive une lueur rouge sombre.</>,
      tache: { type: 'qcm', q: 'Pourquoi un objet à 300 °C n’émet-il pas de lumière visible ?', options: ['Ses radiations sont dans l’infrarouge (> 800 nm)', 'Il n’émet rien du tout', 'Ses radiations sont dans l’ultraviolet', 'Il est trop petit'], bonne: 0, expl: 'Il émet, mais dans l’infrarouge, que l’œil ne voit pas.' } },
    { id: 'etoile', titre: 'La couleur d’une étoile', depart: () => voirE('betel'),
      texte: <>Les étoiles sont des corps très chauds : leur couleur dépend de leur <strong>température de surface</strong>. Sélectionnez les étoiles (couleurs perçues depuis la Terre) : <strong>Bételgeuse</strong> (3 000 °C) est rouge, <strong>le Soleil</strong> (5 700 °C) est jaune, <strong>Sirius</strong> (8 000 °C) est blanche, <strong>Rigel</strong> (10 000 °C) est bleue.</>,
      tache: { type: 'qcm', q: 'Entre Véga (étoile blanche) et Arcturus (étoile rouge), laquelle est la plus chaude ?', options: ['Véga, l’étoile blanche', 'Arcturus, l’étoile rouge', 'Elles ont la même température', 'On ne peut pas savoir'], bonne: 0, expl: 'Rouge → peu chaud ; jaune → plus chaud ; blanc → encore plus chaud ; bleu → le plus chaud.' } },
    { id: 'atmos', titre: 'Le Soleil est-il jaune ?', depart: () => { voirE('soleil'); setTerre(true); },
      texte: <>Depuis la <strong>Terre</strong>, le Soleil nous paraît <strong>jaune</strong>. Mais vu depuis l’<strong>espace</strong> (par les astronautes), il est <strong>blanc</strong> ! L’<strong>atmosphère</strong> diffuse surtout les radiations bleues (c’est pour cela que le ciel est bleu) : la lumière du Soleil qui nous arrive a perdu du bleu et paraît plus jaune. Décochez « vue depuis la Terre » pour comparer.
        <ExempleResolu>Plus le Soleil est bas sur l’horizon, plus il traverse d’atmosphère : il devient orange puis rouge au coucher.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Pourquoi le Soleil paraît-il jaune depuis le sol ?', options: ['L’atmosphère diffuse surtout les radiations bleues', 'Le Soleil change de température', 'L’atmosphère émet de la lumière jaune', 'Le Soleil est vraiment jaune'], bonne: 0, expl: 'L’atmosphère retire du bleu à la lumière du Soleil : elle paraît plus jaune. Vu de l’espace, le Soleil est blanc.' } },
    { id: 'lmax', titre: 'Lire la température d’une étoile', depart: () => voirE('soleil', 485),
      texte: <>Le <strong>maximum</strong> du spectre du Soleil est à environ <strong>485 nm</strong> (curseur orange). Sur la <strong>courbe verte</strong> (dessinée dans l’atelier « Étoiles »), on lit la température qui correspond : on part de λ sur l’axe horizontal, on monte jusqu’à la courbe, puis on lit la température sur l’axe vertical.</>,
      tache: { type: 'num', q: 'Pour λ du maximum = 485 nm, quelle est la température de surface (en °C) ?', unite: '°C', vrai: 5700, tol: 0.08, affiche: x => String(x), pieges: [[485, 'C’est la longueur d’onde ! Il faut lire la température sur l’axe vertical.']], expl: 'On lit environ 5 700 °C : c’est bien la température de surface du Soleil.' } },
    { id: 'raies', titre: 'Un gaz chaud et dilué : des raies', depart: () => voirG('mercure', 546.1),
      texte: <>Un <strong>gaz sous faible pression</strong> excité par une décharge électrique (lampe à décharge) n’émet pas un spectre continu : son spectre est fait de <strong>raies colorées</strong> bien séparées sur fond noir. Ici : une lampe au <strong>mercure</strong>.</>,
      tache: { type: 'qcm', q: 'Le spectre d’une lampe à décharge est…', options: ['un spectre de raies, avec seulement quelques radiations', 'un spectre continu', 'un spectre sans aucune radiation', 'toujours blanc'], bonne: 0, expl: 'Le gaz n’émet que quelques radiations bien précises : un spectre de raies (discontinu).' } },
    { id: 'mono', titre: 'Une seule radiation', depart: () => voirG('sodium', 589.3),
      texte: <>La lampe au <strong>sodium</strong> (éclairage de certaines rues) n’a qu’<strong>une raie</strong> jaune. On dit que sa lumière est <strong>monochromatique</strong> (une seule radiation). La lumière de la lampe au mercure, avec plusieurs raies, est <strong>polychromatique</strong>.</>,
      tache: { type: 'qcm', q: 'La lumière du sodium (une seule raie) est…', options: ['monochromatique', 'polychromatique', 'blanche', 'un spectre continu'], bonne: 0, expl: 'Une seule radiation : monochromatique.' } },
    { id: 'lecture', titre: 'Lire la longueur d’onde d’une raie', depart: () => voirG('sodium', 560),
      texte: <>Avec le curseur orange, placez le trait sur la raie : l’appareil vous indique sa longueur d’onde. Pour un spectrogramme papier, on lit sur l’axe horizontal.</>,
      tache: { type: 'num', q: 'Quelle est la longueur d’onde (en nm) de la raie du sodium ?', unite: 'nm', vrai: 589, tol: 0.01, affiche: x => String(x), pieges: [], expl: 'La raie du sodium est à 589 nm (jaune).' } },
    { id: 'identite', titre: 'Chaque gaz a ses raies', depart: () => voirG('cadmium', 480),
      texte: <>Chaque élément chimique possède <strong>son propre spectre de raies</strong> : c’est sa « carte d’identité ». Comparez les gaz du <strong>tableau des spectres</strong> (en bas). Ici : le <strong>cadmium</strong> (raies à 468, 480, 508 et 643 nm).</>,
      tache: { type: 'qcm', q: 'Que permet un spectre de raies ?', options: ['Identifier l’élément chimique présent dans la lampe', 'Mesurer la température de la lampe', 'Savoir si la lampe est chaude', 'Voir la forme de l’atome'], bonne: 0, expl: 'Les raies sont caractéristiques de l’élément : on identifie un gaz en comparant ses raies à celles d’un tableau.' } },
    { id: 'mystere', titre: 'À vous : quel est ce gaz ?', depart: () => { setAtelier('decharge'); setG('zinc'); setCur(500); setBlanche(false); },
      texte: <>Un gaz mystère donne le spectre ci-dessous. Relevez ses raies (curseur) et comparez avec le tableau des spectres.</>,
      tache: { type: 'qcm', q: 'Les raies sont à 468, 472, 481 et 637 nm. Quel est le gaz ?', options: ['Zinc', 'Cadmium', 'Hélium', 'Sodium'], bonne: 0, expl: 'Ce sont les raies du zinc (468 ; 472 ; 481 ; 637 nm). Le cadmium a des raies à 468, 480, 508 et 643 nm.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Visible : <strong>400 à 800 nm</strong> (violet → rouge). Au-dessous : UV ; au-dessus : IR.</li>
        <li><strong>Corps chaud</strong> (dense) : spectre <strong>continu</strong>. Plus il est chaud, plus il est riche en violet : rouge → jaune → blanc → bleu.</li>
        <li><strong>Gaz sous faible pression</strong> : spectre de <strong>raies</strong>, propre à chaque élément chimique.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) {
    const d = nouveauDefi(type); setDefi(d);
    if (type === 'gaz') { setAtelier('decharge'); setG(d.g); setCur(550); setBlanche(true); }
    if (type === 'temperature') { setAtelier('etoiles'); setCur(550); }
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'gaz'); else if (md === 'explore') setAtelier('chaud'); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Corps chaud</strong> : on le modélise comme un corps idéal (« corps noir ») dont le spectre est donné par la <strong>loi de Planck</strong>, à température uniforme. Les vrais filaments et les vraies étoiles s’en écartent un peu (raies d’absorption dans les étoiles, température non uniforme…).</li>
      <li><strong>Courbes normalisées</strong> : chaque courbe est tracée avec son maximum à la même hauteur, pour voir sa <strong>forme</strong>. Un corps plus chaud émet en réalité <strong>beaucoup plus</strong> de lumière : la hauteur absolue n’est pas représentée.</li>
      <li><strong>Températures en °C</strong> (comme dans le cours). Pour trouver le maximum du spectre, on utilise la loi de Wien λ<sub>max</sub> × T = 2,898×10⁶ nm·K avec T en kelvin (T = θ + 273) ; en Seconde, on la remplace par la <strong>courbe verte</strong> à lire.</li>
      <li><strong>Couleurs perçues</strong> : classes simplifiées du cours (rouge, jaune, blanche, bleue). En réalité la couleur varie de façon continue et dépend de l’œil et de l’écran. Les températures des étoiles sont des valeurs <strong>arrondies</strong> du cours.</li>
      <li><strong>Vue depuis la Terre ou l’espace</strong> : l’atmosphère est modélisée par la seule diffusion de Rayleigh (masse d’air 2, astre à 30° au-dessus de l’horizon) ; la couleur « depuis l’espace » est obtenue avec un décalage empirique d’environ 1 500 °C. Les classes de couleur du cours correspondent à une observation depuis la Terre.</li>
      <li><strong>Visible : 400–800 nm</strong> (valeurs du cours ; l’œil voit un peu moins : environ 380 à 780 nm). À l’écran les couleurs sont approximatives, et une couleur n’est pas une mesure.</li>
      <li><strong>Lampes à décharge</strong> : gaz sous <strong>faible pression</strong>, excité électriquement. Positions des raies = valeurs relevées sur les spectrogrammes du TP ; <strong>intensités relatives approximatives</strong> ; largeur des raies due à l’appareil. Pour le néon, seules les raies principales et quelques raies secondaires sont dessinées.</li>
      <li><strong>Couleur d’une lampe à décharge</strong> : addition des couleurs de ses raies visibles (approximation). Les raies UV (&lt; 400 nm) ne se voient pas.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const curseur = <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>Curseur de lecture : <strong>λ = {fr(cur, 0)} nm</strong>
    <input type="range" min={atelier === 'decharge' ? 340 : 200} max={atelier === 'decharge' ? 800 : 1000} step="1" value={cur} aria-label="Curseur de longueur d’onde" onChange={e => setCur(+e.target.value)} style={{ width: '100%' }}/></label>;
  const rep = atelier === 'decharge' ? raieProche(g, cur) : null;
  const gazCache = enDefi && defi.type === 'gaz';
  const ChaudPanel = (
    <div>
      <Spectro courbe={courbeCorps(T)}/>
      <div style={{ marginTop: 6 }}><Bande T={T} nom="spectre sur l’écran"/></div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: css(couleurCorps(T).rgb), border: '3px solid #0f172a', flexShrink: 0 }} aria-hidden="true"/>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Couleur perçue : <strong>{couleurCorps(T).nom}</strong><br/>Maximum du spectre : <strong>λ ≈ {nm(lambdaMax(T))}</strong>{lambdaMax(T) > 800 ? ' (infrarouge)' : lambdaMax(T) < 400 ? ' (ultraviolet)' : ' (visible)'}</div></div>
      <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block', marginTop: 8 }}>Température du corps (rhéostat) : <strong>{T} °C</strong>
        <input type="range" min="300" max="10000" step="100" value={T} aria-label="Température du corps" onChange={e => setT(+e.target.value)} style={{ width: '100%' }}/></label>
    </div>);
  const vue = couleurVue(etoile.T, terre);
  const EtoilePanel = (
    <div>
      <Spectro courbe={terre ? courbeCorpsTerre(etoile.T) : courbeCorps(etoile.T)} courbe2={terre ? courbeCorps(etoile.T) : null} curseur={cur}/>
      {terre && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>Trait plein : lumière reçue au sol. Pointillés : lumière à l’entrée de l’atmosphère. L’atmosphère retire surtout les radiations bleues.</div>}
      <div style={{ marginTop: 6 }}><Bande T={etoile.T} nom={etoile.nom}/></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Étoile :</span>
        {ETOILES.map(e => <button key={e.id} onClick={() => setEt(e.id)} style={stylePetitBouton(Et === e.id, '#334155')}>{e.nom}</button>)}
        <button onClick={() => setTerre(t => !t)} style={stylePetitBouton(terre, '#0369a1')}>{terre ? '☑' : '☐'} vue depuis la Terre</button></div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: css(vue.rgb), border: '3px solid #0f172a', flexShrink: 0 }} aria-hidden="true"/>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Température de surface : <strong>{etoile.T} °C</strong><br/>Couleur perçue {terre ? 'depuis la Terre' : 'depuis l’espace'} : <strong>{vue.nom}</strong></div></div>
      <div style={{ marginTop: 4 }}>{curseur}</div>
      <div style={{ marginTop: 8 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Température en fonction de la longueur d’onde du maximum</div><Wien marque={cur}/></div>
    </div>);
  const DechargePanel = (
    <div>
      {blanche && <div style={{ marginBottom: 4 }}><Bande T={5700} nom="lumière blanche (lampe à incandescence)"/></div>}
      <Bande raies={g.raies} nom={gazCache ? 'gaz inconnu' : `lampe à décharge : ${g.nom.toLowerCase()}`}/>
      <div style={{ marginTop: 6 }}><Spectro xmin={340} xmax={800} raies={g.raies} curseur={cur}/></div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: css(couleurLampe(g)), border: '3px solid #0f172a', flexShrink: 0 }} aria-hidden="true"/>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Couleur perçue de la lampe (approximative)<br/>{rep != null ? <>Curseur sur une raie : <strong>λ = {fr(rep, 1)} nm</strong></> : <span style={{ color: KIT.txt2 }}>Placez le curseur sur une raie pour lire sa longueur d’onde.</span>}</div></div>
      <div style={{ marginTop: 4 }}>{curseur}</div>
      {!gazCache && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Gaz :</span>
        {GAZ.map(x => <button key={x.id} onClick={() => setG(x.id)} style={stylePetitBouton(G === x.id, '#0f766e')}>{x.nom}</button>)}
        <button onClick={() => setBlanche(b => !b)} style={stylePetitBouton(blanche, '#334155')}>{blanche ? '☑' : '☐'} comparer à la lumière blanche</button></div>}
      <div style={{ marginTop: 10 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tableau des spectres (longueurs d’onde en nm)</div><TableauGaz/></div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['chaud', '🔥 Corps chaud'], ['decharge', '💡 Lampe à décharge'], ['etoiles', '⭐ Étoiles']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'chaud' ? ChaudPanel : atelier === 'decharge' ? DechargePanel : EtoilePanel}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Corps chaud : à partir de quelle température la lampe devient-elle visible ?</li>
        <li>Comparez le spectre à 3 000 °C et à 8 000 °C : où est le maximum ?</li>
        <li>Lampe à décharge : quels gaz ont une raie à peu près à la même longueur d’onde ?</li>
        <li>Cochez « comparer à la lumière blanche » : que remarquez-vous ?</li>
        <li>Étoiles : lisez λ du maximum de Rigel avec le curseur. Est-elle dans le visible ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>Visible : 400 à 800 nm</li><li>Corps chaud : spectre continu, plus chaud → plus de violet</li><li>Gaz basse pression : spectre de raies (propre à chaque élément)</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);
  const defiZone = enDefi && (defi.type === 'gaz' ? <div style={styleBoite}>{DechargePanel}</div> : defi.type === 'temperature' ? <div style={styleBoite}>{EtoilePanelDefi(defi, cur, setCur)}</div> : null);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sp-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .sp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Spectres d’émission : corps chauds et lampes à décharge</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Pourquoi une étoile est-elle rouge ou bleue ? Comment reconnaître le gaz d’une lampe sans l’ouvrir ? Étudiez les <strong>spectres</strong> de la lumière émise par un corps chaud ou par un gaz.</div>
      <div className={`sp-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancer}/></div>}
          {defiZone}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="sp-l2">{panneauHypo}</div>}
      {enExplore && <div className="sp-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}

// panneau du défi « température d'une étoile » : spectre d'une étoile à température cachée
function EtoilePanelDefi(defi, cur, setCur) {
  return (
    <div>
      <Spectro courbe={courbeCorps(defi.T)} curseur={cur}/>
      <div style={{ marginTop: 6 }}><Bande T={defi.T} nom="étoile inconnue"/></div>
      <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block', marginTop: 8 }}>Curseur de lecture : <strong>λ = {fr(cur, 0)} nm</strong>
        <input type="range" min="200" max="1000" step="1" value={cur} aria-label="Curseur de longueur d’onde" onChange={e => setCur(+e.target.value)} style={{ width: '100%' }}/></label>
      <div style={{ marginTop: 8 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Température en fonction de la longueur d’onde du maximum</div><Wien marque={cur}/></div>
    </div>);
}
