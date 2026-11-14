import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Formule, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { nbf, tire, Schema, Fl, T, TV, TL, puces, ROUGE, VERT, BLEU, ORANGE, NOIR, GRIS } from "./Travail";
import * as M from "./pointageModele";

const SIM_ID = 108;
declarerDefis(SIM_ID, [['perte', 'Mesurer la perte d’énergie mécanique']]);

// ====================================================
//  SIM 108 — POINTAGE D'UN FILM ET BILAN ÉNERGÉTIQUE (1G, chapitre 12, capacité numérique)
//  Film virtuel (pendule) → pointage image par image → pixels → mètres → v (différence centrée) → Ec, Epp, Em avec incertitude.
//  Sources : film virtuel, fichier CSV (Fizziq, tableur), vidéo de l'élève (traitée dans le navigateur, jamais envoyée).
// ====================================================
const TAU = 0.033, MASSE = 0.020, L_PEND = 0.6, ECH = 0.0025;          // s, kg, m, m par pixel (étalon : 0,50 m = 200 px)
const PX = { pivot: [300, 40], bas: [300, 40 + L_PEND / ECH], etalon: [[60, 372], [260, 372]] };
const Ind = ({ b, i }) => <>{b}<sub>{i}</sub></>;
const tel = (v, d) => Number(nbf(v, d).replace(',', '.'));

// données de référence du parcours guidé : pointage « de qualité » (au millimètre) d'un pendule filmé à 30 images par seconde
const REF = M.arrondiPointage(M.filmPendule({ L: L_PEND, theta0: 35, tau: TAU, n: 48, amort: 0 }));
const I1 = 10, I2 = 36;                                                  // images étudiées (i et i2)
const ligne = (pts, i) => ({ t: tel(pts[i].t, 3), x: tel(pts[i].x, 3), y: tel(pts[i].y, 3) });
const vTab = (pts, i, tau) => Math.hypot(tel(pts[i + 1].x, 3) - tel(pts[i - 1].x, 3), tel(pts[i + 1].y, 3) - tel(pts[i - 1].y, 3)) / (2 * tau);

const CODE = `import numpy as np
m = 0.020            # masse (kg)
g = 9.8              # N/kg
tau = 0.033          # durée entre deux images (s)
# x, y : listes des positions (en m) lues dans le tableau

for i in range(1, len(x) - 1):
    d = np.sqrt((x[i+1] - x[i-1])**2 + (y[i+1] - y[i-1])**2)
    v = d / (2 * tau)
    Ec = 0.5 * m * v**2
    Epp = m * g * y[i]
    Em = Ec + Epp
    u_Em = 0.07 * Em`;

// ---------- scène du film virtuel (pendule) ----------
function FilmVirtuel({ i, points, onPoint, avecEtalon = true }) {
  const th = REF_FILM[i].theta, [px0, py0] = PX.pivot, bx = px0 + L_PEND / ECH * Math.sin(th), by = py0 + L_PEND / ECH * Math.cos(th);
  const clic = e => { const r = e.currentTarget.getBoundingClientRect(); onPoint && onPoint({ px: (e.clientX - r.left) * 600 / r.width, py: (e.clientY - r.top) * 400 / r.height }); };
  return (
    <svg viewBox="0 0 600 400" onClick={clic} style={{ width: '100%', display: 'block', background: '#f8fafc', borderRadius: 8, cursor: onPoint ? 'crosshair' : 'default', touchAction: 'manipulation' }} role="img"
      aria-label={`Image ${i + 1} d’un film d’un pendule de 60 centimètres ; un étalon de 50 centimètres mesure 200 pixels${onPoint ? ' ; cliquez au centre de la boule pour la pointer' : ''}`}>
      <line x1="230" y1={py0} x2="370" y2={py0} stroke={NOIR} strokeWidth="5"/>
      <line x1={px0} y1={py0} x2={bx} y2={by} stroke={GRIS} strokeWidth="2"/>
      <circle cx={bx} cy={by} r="15" fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
      {avecEtalon && <g><line x1={PX.etalon[0][0]} y1={PX.etalon[0][1]} x2={PX.etalon[1][0]} y2={PX.etalon[1][1]} stroke={ORANGE} strokeWidth="4"/>
        <line x1={PX.etalon[0][0]} y1="362" x2={PX.etalon[0][0]} y2="382" stroke={ORANGE} strokeWidth="3"/><line x1={PX.etalon[1][0]} y1="362" x2={PX.etalon[1][0]} y2="382" stroke={ORANGE} strokeWidth="3"/>
        <text x="160" y="358" textAnchor="middle" fontSize="19" fontWeight="700" fill={ORANGE}>étalon : 0,50 m</text></g>}
      {points.map((p, k) => p && <g key={k} stroke={ROUGE} strokeWidth="2"><line x1={p.px - 6} y1={p.py - 6} x2={p.px + 6} y2={p.py + 6}/><line x1={p.px - 6} y1={p.py + 6} x2={p.px + 6} y2={p.py - 6}/></g>)}
      <text x="12" y="26" fontSize="18" fontWeight="700" fill={NOIR}>image n° {i + 1} · t = {nbf(i * TAU, 3)} s</text>
    </svg>);
}
const REF_FILM = M.filmPendule({ L: L_PEND, theta0: 35, tau: TAU, n: 48, amort: 0 });

// ---------- courbes Ec, Epp, Em (avec barres d'incertitude sur Em) ----------
function Courbes({ B }) {
  if (!B.length) return null;
  const W = 600, H = 220, mx = 46, my = 14, tmax = B[B.length - 1].t, emax = Math.max(...B.map(b => Math.max(b.Em + b.uEm, b.Epp, b.Ec))) * 1.08;
  const X = t => mx + (t / tmax) * (W - mx - 10), Y = e => H - 30 - (e / emax) * (H - 30 - my);
  const ligneSvg = (k, c) => <polyline fill="none" stroke={c} strokeWidth="2.5" points={B.map(b => `${X(b.t)},${Y(b[k])}`).join(' ')}/>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fff', borderRadius: 8 }} role="img"
      aria-label="Courbes de l’énergie cinétique, de l’énergie potentielle et de l’énergie mécanique en fonction du temps, avec des barres d’incertitude sur l’énergie mécanique">
      <line x1={mx} y1={H - 30} x2={W - 10} y2={H - 30} stroke={GRIS}/><line x1={mx} y1={my} x2={mx} y2={H - 30} stroke={GRIS}/>
      <text x={W - 12} y={H - 10} textAnchor="end" fontSize="13" fill={GRIS}>t (s)</text><text x="6" y="22" fontSize="13" fill={GRIS}>E (mJ)</text>
      {[0, 0.5, 1].map(f => <g key={f}><line x1={mx - 4} y1={Y(f * emax)} x2={mx} y2={Y(f * emax)} stroke={GRIS}/><text x={mx - 7} y={Y(f * emax) + 4} textAnchor="end" fontSize="12" fill={GRIS}>{nbf(f * emax * 1000, 0)}</text></g>)}
      {ligneSvg('Epp', VERT)}{ligneSvg('Ec', BLEU)}
      {B.filter((_, k) => k % 3 === 0).map(b => <g key={b.i} stroke="#334155" strokeWidth="1.5"><line x1={X(b.t)} y1={Y(b.Em - b.uEm)} x2={X(b.t)} y2={Y(b.Em + b.uEm)}/><circle cx={X(b.t)} cy={Y(b.Em)} r="3.5" fill="#334155"/></g>)}
      <g fontSize="13" fontWeight="700"><text x={W - 150} y={my + 10} fill={VERT}>E pp</text><text x={W - 110} y={my + 10} fill={BLEU}>E c</text><text x={W - 70} y={my + 10} fill="#334155">E m ± u</text></g>
    </svg>);
}

// ---------- schémas des cartes ----------
const SchemaEchelle = () => (
  <Schema aria="Un étalon de 0,50 mètre mesure 200 pixels sur l'image : un pixel vaut 0,0025 mètre ; une distance de 100 pixels vaut 0,25 mètre" h={150}>
    <line x1="30" y1="60" x2="230" y2="60" stroke={ORANGE} strokeWidth="5"/><line x1="30" y1="48" x2="30" y2="72" stroke={ORANGE} strokeWidth="3"/><line x1="230" y1="48" x2="230" y2="72" stroke={ORANGE} strokeWidth="3"/>
    <T x={40} y={44} c={ORANGE} w={700} s={12.5}>étalon : 200 px = 0,50 m</T>
    <T x={10} y={104} s={13} w={700}>échelle = 0,50 m ÷ 200 px = 0,0025 m/px</T><T x={10} y={126} s={12} c={GRIS} w={500}>distance en m = distance en px × échelle</T>
    <T x={10} y={20} s={12.5} w={700}>Pointer = relever des coordonnées, puis convertir</T>
  </Schema>);
const SchemaVitesse = () => (
  <Schema aria="Trois positions successives de la bille M(i-1), M(i), M(i+1) ; la vitesse au point M(i) est la distance M(i-1)M(i+1) divisée par deux fois la durée entre deux images" h={150}>
    <path d="M30,110 Q180,10 330,110" fill="none" stroke="#94a3b8" strokeDasharray="4 4"/>
    {[[70, 80], [180, 52], [290, 80]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="7" fill={k === 1 ? ORANGE : '#fde68a'} stroke={NOIR} strokeWidth="2"/>)}
    <line x1="70" y1="80" x2="290" y2="80" stroke={BLEU} strokeWidth="2.5"/>
    <T x={36} y={104} s={11.5} w={700}>M(i−1)</T><T x={156} y={44} s={11.5} w={700} c={ORANGE}>M(i)</T><T x={262} y={104} s={11.5} w={700}>M(i+1)</T>
    <TL x={10} y={20} s={12.5} segs={[{ v: 'v' }, ' en M(i) ≈ M(i−1)M(i+1) ÷ (2τ)']}/><T x={10} y={140} s={11.5} c={GRIS} w={500}>deux intervalles de temps : 2τ (τ = 0,033 s)</T>
  </Schema>);
const SchemaBilanP = () => (
  <Schema aria="Trois barres au même instant : énergie potentielle, énergie cinétique, et leur somme l'énergie mécanique avec une barre d'incertitude" h={150}>
    <rect x="40" y="50" width="50" height="70" fill={VERT} opacity="0.85"/><rect x="140" y="95" width="50" height="25" fill={BLEU} opacity="0.85"/><rect x="240" y="40" width="50" height="80" fill="#475569" opacity="0.85"/>
    <line x1="265" y1="26" x2="265" y2="54" stroke={NOIR} strokeWidth="2.5"/><line x1="258" y1="26" x2="272" y2="26" stroke={NOIR} strokeWidth="2.5"/><line x1="258" y1="54" x2="272" y2="54" stroke={NOIR} strokeWidth="2.5"/>
    <T x={44} y={138} w={700} c={VERT} s={12}>E pp = m g y</T><T x={140} y={138} w={700} c={BLEU} s={12}>E c = ½ m v²</T><T x={236} y={138} w={700} s={12}>E m ± u(E m)</T>
    <T x={4} y={14} s={12.5} w={700}>E m = E c + E pp ; u(E m) = 7 % de E m</T>
  </Schema>);
const SchemaCompat = () => (
  <Schema aria="Deux mesures d'énergie mécanique avec leurs barres d'incertitude qui se recouvrent : elles sont compatibles, l'énergie mécanique est conservée à l'incertitude près" h={150}>
    <line x1="60" y1="120" x2="330" y2="120" stroke={GRIS}/>
    {[[110, 70, 'E m (1)'], [250, 78, 'E m (2)']].map(([x, y, n]) => <g key={n}><line x1={x} y1={y - 26} x2={x} y2={y + 26} stroke="#334155" strokeWidth="3"/><circle cx={x} cy={y} r="5" fill="#334155"/><T x={x - 22} y={138} s={12} w={700}>{n}</T></g>)}
    <line x1="40" y1="52" x2="340" y2="52" stroke={VERT} strokeDasharray="4 4"/>
    <T x={6} y={16} s={12.5} w={700}>|écart| ≤ √(u₁² + u₂²) ⇒ compatibles</T><T x={6} y={34} s={11.5} c={GRIS} w={500}>conservation vérifiée à l’incertitude près</T>
  </Schema>);

export function SimulationPointage() {
  const [mode, setMode] = useState(() => modeOuverture('pointage-guide-v1'));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('pointage-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [img, setImg] = useState(0), [points, setPoints] = useState([]);
  const [source, setSource] = useState('film');                        // film | csv | video
  const [csv, setCsv] = useState(''), [masseExp, setMasseExp] = useState('0,020'), [fps, setFps] = useState('30');
  const [codeOuv, setCodeOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;

  // pointage de l'élève sur le film virtuel → mètres (origine au point le plus bas, échelle de l'étalon)
  const pointsM = points.map((p, k) => p && { i: k, t: k * TAU, ...M.pxVersMetres(p, { echelle: ECH, origine: PX.bas }) }).filter(Boolean);
  const pointer = p => { setPoints(a => { const b = [...a]; b[img] = p; return b; }); setImg(i => Math.min(REF_FILM.length - 1, i + 1)); };
  const nbPointes = points.filter(Boolean).length;
  const remplir = () => { const b = REF_FILM.map(f => ({ px: PX.pivot[0] + (f.x / ECH) + (Math.random() - 0.5) * 3, py: PX.bas[1] - f.y / ECH + (Math.random() - 0.5) * 3 })); setPoints(b); };

  // données d'analyse selon le mode
  const m = lireNombre(masseExp); const masse = isFinite(m) && m > 0 ? m : MASSE;
  let donnees = [], tau = TAU;
  if (enDefi && defi) { donnees = defi.pts; tau = TAU; }
  else if (enGuide) { donnees = REF; }
  else if (source === 'film') donnees = pointsM.length >= 3 ? pointsM : [];
  else if (source === 'csv') { donnees = M.lireCSV(csv); tau = M.pasDeTemps(donnees); }
  const B = donnees.length >= 3 && isFinite(tau) && tau > 0 ? M.bilan(donnees, enGuide || enDefi ? (defi?.m ?? MASSE) : masse, tau) : [];

  // valeurs du guidé
  const rA = ligne(REF, I1 - 1), rB = ligne(REF, I1), rC = ligne(REF, I1 + 1);
  const v1 = vTab(REF, I1, TAU), Ec1 = M.ecin(MASSE, tel(v1, 3)), Epp1 = M.epp(MASSE, rB.y), Em1 = Ec1 + Epp1;
  const v2 = vTab(REF, I2, TAU), Ec2 = M.ecin(MASSE, tel(v2, 3)), Epp2 = M.epp(MASSE, tel(REF[I2].y, 3)), Em2 = Ec2 + Epp2;
  const uEm1 = 0.07 * tel(Em1, 4), uEm2 = 0.07 * tel(Em2, 4), seuil = Math.hypot(uEm1, uEm2), ecart = Math.abs(Em1 - Em2);

  const tabLignes = (ls) => (
    <table style={{ borderCollapse: 'collapse', fontSize: 13.5, margin: '6px 0' }}><thead><tr>{['image', 't (s)', 'x (m)', 'y (m)'].map(h => <th key={h} style={{ border: `1px solid ${KIT.bord}`, padding: '2px 8px', background: '#f1f5f9' }}>{h}</th>)}</tr></thead>
      <tbody>{ls.map(([lab, r]) => <tr key={lab}>{[lab, nbf(r.t, 3), nbf(r.x, 3), nbf(r.y, 3)].map((c, k) => <td key={k} style={{ border: `1px solid ${KIT.bord}`, padding: '2px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{c}</td>)}</tr>)}</tbody></table>);
  const rC2 = ligne(REF, I2), rD2 = ligne(REF, I2 + 1);

  const ETAPES = [
    { id: 'film', titre: 'Pointer une image', focus: ['scene'],
      texte: <>Un pendule a été filmé à 30 images par seconde. <strong>Pointer</strong>, c’est cliquer au centre de la boule sur chaque image : le logiciel relève alors ses coordonnées en pixels. Pointez au moins 4 images (l’image suivante s’affiche après chaque clic).</>,
      tache: { type: 'action', ok: nbPointes >= 4, label: 'Pointer 4 images pour moi (démonstration)', faire: () => { const b = REF_FILM.slice(0, 4).map(f => ({ px: PX.pivot[0] + f.x / ECH, py: PX.bas[1] - f.y / ECH })); setPoints(b); setImg(4); }, consigne: `${nbPointes} image(s) pointée(s) sur 4 demandées` } },
    { id: 'echelle', titre: 'Des pixels aux mètres', focus: ['scene'],
      retenirTitre: 'À RETENIR : POINTER ET CONVERTIR',
      retenir: <><SchemaEchelle/>{puces(<>Le pointage donne des <strong>pixels</strong>. Un <strong>étalon</strong> (objet de longueur connue filmé dans le même plan) donne l’<strong>échelle</strong> : mètres par pixel.</>, <>Exemple : 0,50 m ↔ 200 px ⇒ 0,0025 m/px ; 100 px ↔ 0,25 m.</>, <>Il faut aussi choisir une <strong>origine</strong> et l’axe y <strong>vers le haut</strong> pour que E<sub>pp</sub> = m g y ait un sens.</>, <><strong>Piège</strong> : l’étalon doit être dans le plan du mouvement, sinon l’échelle est fausse.</>)}</>,
      texte: <>Sur l’image, l’étalon orange mesure 200 pixels et représente 0,50{NB}m.</>,
      tache: { type: 'num', q: 'Échelle : nombre de mètres par pixel', unite: 'm/px', vrai: ECH, tol: 0.02, affiche: v => nbf(v, 4), cs: 2,
        calcul: () => ['échelle = longueur réelle ÷ longueur en pixels = 0,50 ÷ 200 = 0,0025 m/px.'], pieges: [[200 / 0.5, 'Vous avez inversé : on cherche des mètres par pixel.']],
        expl: 'échelle = 0,50 / 200 = 0,0025 m/px (soit 2,5 mm par pixel).', indice: 'échelle = longueur réelle (m) ÷ longueur en pixels.' } },
    { id: 'vit', titre: 'La vitesse à partir des positions', focus: ['table'],
      retenirTitre: 'À RETENIR : LA VITESSE PAR DIFFÉRENCE CENTRÉE',
      retenir: <><SchemaVitesse/>{puces(<>Pas de capteur de vitesse : on la <strong>calcule</strong> à partir des positions successives.</>, <>En M<sub>i</sub> : <strong>v ≈ M<sub>i−1</sub>M<sub>i+1</sub> ÷ (2τ)</strong>, avec τ la durée entre deux images.</>, <>Exemple : 0,60 m parcourus en 2 intervalles de 0,033 s ⇒ v ≈ 9,1 m/s.</>, <><strong>Idée fausse</strong> : « diviser par τ ». <strong>Vrai</strong> : M<sub>i−1</sub>M<sub>i+1</sub> couvre <strong>deux</strong> intervalles : on divise par 2τ.</>)}</>,
      texte: <>Voici 3 images consécutives (τ = 0,033{NB}s) :{tabLignes([[I1, rA], [I1 + 1, rB], [I1 + 2, rC]])}Calculez la norme <em>v</em> de la vitesse <strong>vec(v)</strong> à l’image {I1 + 1} avec <strong>v ≈ M<sub>i−1</sub>M<sub>i+1</sub> ÷ (2τ)</strong>, où M<sub>i−1</sub>M<sub>i+1</sub> = √[(x<sub>i+1</sub> − x<sub>i−1</sub>)² + (y<sub>i+1</sub> − y<sub>i−1</sub>)²].</>,
      tache: { type: 'num', q: `Vitesse v à l’image ${I1 + 1}`, unite: 'm/s', vrai: v1, tol: 0.03, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => [`Δx = ${nbf(rC.x, 3)} − ${nbf(rA.x, 3)} = ${nbf(rC.x - rA.x, 3)} m ; Δy = ${nbf(rC.y, 3)} − ${nbf(rA.y, 3)} = ${nbf(rC.y - rA.y, 3)} m.`, `M(i−1)M(i+1) = √(Δx² + Δy²) = ${nbf(Math.hypot(rC.x - rA.x, rC.y - rA.y), 4)} m.`, `v = ${nbf(Math.hypot(rC.x - rA.x, rC.y - rA.y), 4)} ÷ (2 × 0,033) = ${nbf(v1, 3)} m/s.`],
        pieges: [[Math.hypot(rC.x - rA.x, rC.y - rA.y) / TAU, 'Vous avez divisé par τ : la distance M(i−1)M(i+1) correspond à deux intervalles, donc 2τ.'], [Math.hypot(rC.x - rB.x, rC.y - rB.y) / TAU, 'Vous avez utilisé deux positions voisines : prenez M(i−1) et M(i+1), de part et d’autre.']],
        expl: `v = M(i−1)M(i+1) / (2τ) = ${nbf(v1, 3)} m/s.`, indice: 'v = √(Δx² + Δy²) ÷ (2τ), avec Δx = x(i+1) − x(i−1) et τ = 0,033 s.' } },
    { id: 'ec', titre: 'L’énergie cinétique', focus: ['table'],
      texte: <>À l’image {I1 + 1}, la masse de la boule est <em>m</em> = 0,020{NB}kg et <em>v</em> = {nbf(v1, 3)}{NB}m/s.</>,
      tache: { type: 'num', q: `Énergie cinétique à l’image ${I1 + 1}`, unite: 'J', vrai: Ec1, tol: 0.03, affiche: v => nbf(v, 4), cs: 2,
        calcul: () => [`E_c = ½ m v² = ½ × 0,020 × ${nbf(tel(v1, 3), 3)}² = ${nbf(Ec1, 4)} J.`], pieges: [[0.020 * tel(v1, 3), 'Vous avez oublié de mettre la vitesse au carré (et le facteur ½).']],
        expl: `E_c = ½ m v² = ${nbf(Ec1, 4)} J.`, indice: 'E_c = ½ × m × v², avec m en kg et v en m/s.' } },
    { id: 'epp', titre: 'L’énergie potentielle', focus: ['table'],
      texte: <>À l’image {I1 + 1}, la boule est à y = {nbf(rB.y, 3)}{NB}m au-dessus de l’origine (point le plus bas). Avec <em>g</em> = 9,8{NB}N/kg et <em>m</em> = 0,020{NB}kg :</>,
      tache: { type: 'num', q: `Énergie potentielle de pesanteur à l’image ${I1 + 1}`, unite: 'J', vrai: Epp1, tol: 0.03, affiche: v => nbf(v, 4), cs: 2,
        calcul: () => [`E_pp = m g y = 0,020 × 9,8 × ${nbf(rB.y, 3)} = ${nbf(Epp1, 4)} J.`], pieges: [[0.020 * rB.y, 'Vous avez oublié g.']],
        expl: `E_pp = m g y = ${nbf(Epp1, 4)} J.`, indice: 'E_pp = m × g × y (y est mesuré à partir de l’origine, vers le haut).' } },
    { id: 'em', titre: 'L’énergie mécanique et son incertitude', focus: ['table'],
      retenirTitre: 'À RETENIR : ÉNERGIE MÉCANIQUE ET INCERTITUDE',
      retenir: <><SchemaBilanP/>{puces(<><strong>E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub></strong> : on la calcule image par image.</>, <>Une mesure s’écrit avec son <strong>incertitude</strong> : ici u(E<sub>m</sub>) = 7 % de E<sub>m</sub> (hypothèse de l’activité, voir « Hypothèses »).</>, <>Exemple : E<sub>m</sub> = 21 mJ ⇒ u ≈ 1,5 mJ.</>, <><strong>Idée fausse</strong> : « deux valeurs différentes d’E<sub>m</sub> prouvent qu’elle n’est pas conservée ». <strong>Vrai</strong> : il faut comparer l’écart à l’incertitude.</>)}</>,
      texte: <>À l’image {I1 + 1} : <Ind b="E" i="c"/> = {nbf(Ec1, 4)}{NB}J et <Ind b="E" i="pp"/> = {nbf(Epp1, 4)}{NB}J.</>,
      tache: { type: 'num', q: `Énergie mécanique à l’image ${I1 + 1}`, unite: 'J', vrai: Em1, tol: 0.03, affiche: v => nbf(v, 4), cs: 2,
        calcul: () => [`E_m = E_c + E_pp = ${nbf(Ec1, 4)} + ${nbf(Epp1, 4)} = ${nbf(Em1, 4)} J.`], pieges: [],
        expl: `E_m = ${nbf(Em1, 4)} J.`, indice: 'E_m = E_c + E_pp.' } },
    { id: 'incert', titre: 'L’incertitude sur E_m', focus: ['table'],
      texte: <>On prend u(<Ind b="E" i="m"/>) = 7 % de <Ind b="E" i="m"/> (hypothèse de l’activité : elle regroupe la lecture du pointage, l’échelle et le calcul de la vitesse). À l’image {I1 + 1}, <Ind b="E" i="m"/> = {nbf(Em1, 4)}{NB}J.</>,
      tache: { type: 'num', q: `Incertitude u(E_m) à l’image ${I1 + 1}`, unite: 'J', vrai: uEm1, tol: 0.03, affiche: v => nbf(v, 5), cs: 2,
        calcul: () => [`u(E_m) = 0,07 × ${nbf(tel(Em1, 4), 4)} = ${nbf(uEm1, 5)} J.`], pieges: [[tel(Em1, 4) / 0.07, 'Vous avez divisé par 0,07 au lieu de multiplier.']],
        expl: `u(E_m) = 0,07 × E_m = ${nbf(uEm1, 5)} J.`, indice: 'u(E_m) = 0,07 × E_m.' } },
    { id: 'compat', titre: 'L’énergie mécanique se conserve-t-elle ?', focus: ['courbes'],
      retenirTitre: 'À RETENIR : COMPATIBILITÉ',
      retenir: <><SchemaCompat/>{puces(<>Deux valeurs sont <strong>compatibles</strong> si leur écart est inférieur à l’incertitude composée : <strong>|E<sub>m1</sub> − E<sub>m2</sub>| ≤ √(u₁² + u₂²)</strong> (incertitudes supposées indépendantes).</>, <>Compatibles ⇒ on ne peut pas dire que E<sub>m</sub> a changé : <strong>conservation à l’incertitude près</strong>.</>, <>Exemple : écart 0,3 mJ, incertitude composée 2 mJ ⇒ compatibles.</>)}</>,
      texte: <>À l’image {I2 + 1}, <Ind b="E" i="m"/> = {nbf(Em2, 4)}{NB}J, avec u = {nbf(uEm2, 5)}{NB}J. À l’image {I1 + 1} : <Ind b="E" i="m"/> = {nbf(Em1, 4)}{NB}J, u = {nbf(uEm1, 5)}{NB}J. L’écart vaut {nbf(ecart, 5)}{NB}J et l’incertitude composée √(u₁² + u₂²) = {nbf(seuil, 5)}{NB}J.</>,
      tache: { type: 'qcm', q: 'Les deux valeurs d’énergie mécanique sont…', options: ['compatibles : E_m est conservée à l’incertitude près', 'incompatibles : E_m a diminué', 'impossibles à comparer'], bonne: 0,
        expl: `L’écart (${nbf(ecart, 5)} J) est inférieur à l’incertitude composée (${nbf(seuil, 5)} J) : compatibles. Le pendule, très peu amorti sur un tour, conserve son énergie mécanique à l’incertitude près.`, indice: 'Comparez l’écart |E_m1 − E_m2| à √(u₁² + u₂²).' } },
    { id: 'py1', titre: 'Automatiser avec Python', focus: ['code'],
      texte: <>On refait ce calcul pour toutes les images avec un script. Dans la ligne <code>v = d / (___)</code>, d est la distance M<sub>i−1</sub>M<sub>i+1</sub> en mètres.</>,
      tache: { type: 'qcm', q: 'Que faut-il écrire à la place de ___ ?', options: ['2 * tau', 'tau', '2 / tau'], bonne: 0,
        expl: 'v = d / (2 τ) : la distance M(i−1)M(i+1) correspond à deux intervalles de temps.', indice: 'Relisez la carte sur la différence centrée : on divise par 2τ.' } },
    { id: 'py2', titre: 'Une ligne du script', focus: ['code'],
      texte: <>La liste <code>y</code> contient les altitudes en mètres ; l’indice <code>i</code> repère l’image.</>,
      tache: { type: 'qcm', q: 'Quelle ligne calcule l’énergie potentielle de pesanteur ?', options: ['Epp = m * g * y[i]', 'Epp = m * g * x[i]', 'Epp = 0.5 * m * y[i]**2'], bonne: 0,
        expl: 'E_pp = m g y : y[i] est l’altitude à l’image i (jamais x, qui est l’abscisse).', indice: 'E_pp = m × g × altitude.' } },
    { id: 'py3', titre: 'Pourquoi range(1, len(x) − 1) ?', focus: ['code'],
      texte: <>Dans la boucle du script, <code>i</code> ne prend pas toutes les valeurs de 0 à len(x) − 1.</>,
      tache: { type: 'qcm', q: 'Pourquoi la boucle commence-t-elle à 1 et s’arrête avant la dernière image ?', options: ['la différence centrée a besoin de l’image précédente et de l’image suivante', 'la première et la dernière image ne sont pas pointées', 'pour aller plus vite'], bonne: 0,
        expl: 'v(i) utilise x[i−1] et x[i+1] : il faut une image avant et une image après, donc on perd la première et la dernière.', indice: 'Quelles positions utilise la formule de v(i) ?' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenirTitre: 'À RETENIR : LE BILAN',
      retenir: <>{puces(<><strong>Pointer</strong> (pixels) ⇒ <strong>échelle</strong> (m/px) ⇒ x, y en mètres.</>, <><strong>v ≈ M<sub>i−1</sub>M<sub>i+1</sub> ÷ 2τ</strong>, puis E<sub>c</sub> = ½ m v², E<sub>pp</sub> = m g y, E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub>.</>, <>Toujours donner l’<strong>incertitude</strong> et <strong>comparer</strong> les écarts à celle-ci.</>, <>Un tableur ou Python font les mêmes calculs, image par image.</>)}</>,
      texte: <>Vous savez exploiter un pointage pour un bilan énergétique. En exploration, pointez vous-même le film, importez un fichier CSV ou chargez votre propre vidéo.</>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const apres = id => !enGuide || etape > IDS.indexOf(id), depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défi</button>
    </span>);

  // ════════════════ DÉFI ════════════════
  const nouveauDefi = () => {
    const mm = tire([0.015, 0.02, 0.025]), amort = tire([0.25, 0.35, 0.45]), pts = M.arrondiPointage(M.filmPendule({ L: L_PEND, theta0: tire([30, 35, 40]), tau: TAU, n: 48, amort }));
    const a = 6, b = 40, Bt = M.bilan(pts, mm, TAU), ea = Bt[a - 1], eb = Bt[b - 1];
    const calc = i => { const r = [i - 1, i, i + 1].map(k => ligne(pts, k)); const v = Math.hypot(r[2].x - r[0].x, r[2].y - r[0].y) / (2 * TAU); return { r, Em: M.ecin(mm, tel(v, 3)) + M.epp(mm, r[1].y) }; };
    const A = calc(a), Bc = calc(b);
    setDefi({ m: mm, pts, a, b, A, B: Bc, vrai: 100 * (A.Em - Bc.Em) / A.Em, reps: {}, verifie: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(); }
  const verifier = () => {
    const x = lireNombre(defi.reps.r), ok = isFinite(x) && proche(x, defi.vrai, 0.07);
    setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok);
  };
  const voletDefi = defi && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle part de l’énergie mécanique a été perdue ?</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>{indicesProfond(<>Un pendule amorti (boule de {nbf(defi.m * 1000, 0)}{NB}g) a été filmé et pointé (τ = 0,033{NB}s, origine au point le plus bas). Voici deux triplets d’images consécutives.
        {tabLignes([[defi.a, defi.A.r[0]], [defi.a + 1, defi.A.r[1]], [defi.a + 2, defi.A.r[2]]])}{tabLignes([[defi.b, defi.B.r[0]], [defi.b + 1, defi.B.r[1]], [defi.b + 2, defi.B.r[2]]])}
        Calculez l’énergie mécanique à l’image {defi.a + 1} et à l’image {defi.b + 1} (vitesse par différence centrée, <em>g</em> = 9,8{NB}N/kg), puis le <strong>pourcentage perdu</strong> (E<sub>m</sub>(image {defi.a + 1}) − E<sub>m</sub>(image {defi.b + 1})) ÷ E<sub>m</sub>(image {defi.a + 1}) × 100. Donnez le résultat avec 2 chiffres significatifs.</>)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>Part d’énergie mécanique perdue</span>
        <input value={defi.reps.r ?? ''} aria-label="Part d’énergie perdue" onKeyDown={e => e.key === 'Enter' && document.getElementById('pt-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { r: e.target.value }, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>%</span>
      </div>
      <IndiceDefi cache={false}>{'Pour chaque triplet : v = √(Δx² + Δy²) ÷ (2τ), E_c = ½ m v², E_pp = m g y (image du milieu), E_m = E_c + E_pp. Puis perte (%) = (E_m1 − E_m2) ÷ E_m1 × 100. Gardez 3 chiffres en intermédiaire.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pt-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct : ${nbf(defi.vrai, 1)} % de l’énergie mécanique a été perdue. L’écart dépasse l’incertitude de 7 % par mesure : la perte est significative.` : '✗ Vérifiez : v = √(Δx² + Δy²) ÷ (2τ) ; E_m = ½ m v² + m g y pour chacune des deux images ; perte = (E_m1 − E_m2) ÷ E_m1 × 100 ; m en kg.'}
      </div>}
    </div>);

  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Pointage</strong> : le clic est au centre de la boule, à quelques pixels près (résolution : 1 pixel ≈ 2,5 mm ici). Ce défaut de pointage est une incertitude de <strong>type B</strong> (estimée, non répétée).</li>
      <li><strong>Échelle</strong> : l’étalon est dans le plan du mouvement et perpendiculaire à l’axe de la caméra (pas de perspective).</li>
      <li><strong>Vitesse</strong> : v ≈ M<sub>i−1</sub>M<sub>i+1</sub> ÷ (2τ) est une vitesse <em>moyenne</em> sur 2τ, assimilée à la vitesse instantanée en M<sub>i</sub> ; l’erreur est faible tant que la trajectoire est peu courbée sur 2τ. Si les points « partent dans tous les sens », on peut élargir l’intervalle ou lisser les positions, à condition de le dire.</li>
      <li><strong>Incertitude sur E<sub>m</sub></strong> : u(E<sub>m</sub>) = 7 % de E<sub>m</sub> est une <strong>valeur de travail</strong> (elle regroupe pointage, échelle et calcul de v) ; elle n’est pas démontrée ici. Deux valeurs sont dites compatibles si leur écart ≤ √(u₁² + u₂²), ce qui suppose les erreurs <strong>indépendantes</strong> et à peu près normales (facteur d’élargissement 1 : niveau de confiance ≈ 68 %).</li>
      <li><strong>Masse</strong> : m = 0,020 kg donnée sans incertitude ; g = 9,8 N/kg ; E<sub>pp</sub> = 0 à l’origine choisie.</li>
      <li><strong>Vidéo personnelle</strong> : elle est lue dans votre navigateur et n’est jamais envoyée sur Internet. Le nombre d’images par seconde doit être celui du film (30 ou 60 en général).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  // ════════════════ AFFICHAGE ════════════════
  const filmBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {mode === 'explore' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['film', 'Film virtuel'], ['csv', 'Fichier CSV'], ['video', 'Ma vidéo']].map(([k, l]) => <button key={k} onClick={() => setSource(k)} aria-pressed={source === k} style={stylePetitBouton(source === k, '#0e7490')}>{l}</button>)}</div>}
      {(enGuide || source === 'film') && !enDefi && <div>
        <FilmVirtuel i={img} points={points} onPoint={enGuide && idE !== 'film' ? null : pointer}/>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <button onClick={() => setImg(i => Math.max(0, i - 1))} style={styleBouton(false)}>◀</button>
          <input type="range" min="0" max={REF_FILM.length - 1} value={img} aria-label="Numéro de l’image" onChange={e => setImg(parseInt(e.target.value))} style={{ flex: 1, minWidth: 120, minHeight: 32 }}/>
          <button onClick={() => setImg(i => Math.min(REF_FILM.length - 1, i + 1))} style={styleBouton(false)}>▶</button>
          {mode === 'explore' && <button onClick={remplir} style={styleBouton(false)}>Pointage de référence</button>}
          {mode === 'explore' && <button onClick={() => { setPoints([]); setImg(0); }} style={styleBouton(false)}><Pic n="refresh"/>Effacer</button>}
        </div>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>{nbPointes} image(s) pointée(s) sur {REF_FILM.length}</div>
      </div>}
      {mode === 'explore' && source === 'csv' && <div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Collez un tableau (colonnes <strong>t, x, y</strong> en s et m ; séparateur virgule, point-virgule ou tabulation) ou importez un fichier exporté de Fizziq ou d’un tableur.</div>
        <textarea value={csv} onChange={e => setCsv(e.target.value)} aria-label="Contenu du fichier CSV" rows={7} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: 13, padding: 6, borderRadius: 6, border: `1.5px solid ${KIT.bord}` }} placeholder={'#,t,x,y\n0,0.000,0.342,0.107\n1,0.033,0.331,0.098'}/>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
          <label style={{ ...styleBouton(false), display: 'inline-block' }}>Importer un fichier<input type="file" accept=".csv,.txt,text/csv,text/plain" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) f.text().then(setCsv); }}/></label>
          <button onClick={() => setCsv(['#,t,x,y', ...REF.map(p => `${p.i},${p.t.toFixed(3)},${p.x.toFixed(3)},${p.y.toFixed(3)}`)].join('\n'))} style={styleBouton(false)}>Exemple</button>
        </div>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>{donnees.length} ligne(s) lue(s){donnees.length > 1 && isFinite(tau) ? ` · τ = ${nbf(tau, 3)} s` : ''}</div>
      </div>}
      {mode === 'explore' && source === 'video' && <VideoPointage fps={fps} setFps={setFps} onDonnees={d => setVideoPts(d)} />}
    </div>);
  const [videoPts, setVideoPts] = useState([]);
  if (!enGuide && !enDefi && source === 'video') { donnees = videoPts; tau = 1 / (lireNombre(fps) || 30); }
  const B2 = donnees.length >= 3 && isFinite(tau) && tau > 0 ? M.bilan(donnees, enGuide || enDefi ? (defi?.m ?? MASSE) : masse, tau) : [];

  const montrerTable = enGuide ? depuis('vit') : mode === 'explore';
  const montrerCourbes = enGuide ? depuis('compat') : mode === 'explore';
  const tableau = (montrerTable && B2.length > 0 && !enDefi) && (
    <div style={{ ...styleBoite, ...cadre('table') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Résultats image par image</div>
      <div style={{ overflowX: 'auto', maxHeight: 260 }}><table style={{ borderCollapse: 'collapse', fontSize: 12.5, width: '100%' }}>
        <thead><tr>{['image', 't (s)', 'x (m)', 'y (m)', 'v (m/s)', ...(depuis('ec') ? ['E_c (mJ)'] : []), ...(depuis('epp') ? ['E_pp (mJ)'] : []), ...(depuis('em') ? ['E_m (mJ)'] : []), ...(depuis('incert') ? ['u (mJ)'] : [])].map(h => <th key={h} style={{ border: `1px solid ${KIT.bord}`, padding: '2px 6px', background: '#f1f5f9', position: 'sticky', top: 0 }}>{avecIndices(h)}</th>)}</tr></thead>
        <tbody>{B2.filter((_, k) => !enGuide || k >= I1 - 2 && k <= I1 + 2 || mode !== 'guide').map(b => <tr key={b.i}>{[b.i + 1, nbf(b.t, 3), nbf(b.x, 3), nbf(b.y, 3), (!enGuide || apres('vit') || b.i !== I1) ? nbf(b.v, 3) : '?',
          ...(depuis('ec') && (!enGuide || apres('ec') || b.i !== I1) ? [nbf(b.Ec * 1000, 2)] : depuis('ec') ? ['?'] : []),
          ...(depuis('epp') && (!enGuide || apres('epp') || b.i !== I1) ? [nbf(b.Epp * 1000, 2)] : depuis('epp') ? ['?'] : []),
          ...(depuis('em') && (!enGuide || apres('em') || b.i !== I1) ? [nbf(b.Em * 1000, 2)] : depuis('em') ? ['?'] : []),
          ...(depuis('incert') && (!enGuide || apres('incert') || b.i !== I1) ? [nbf(b.uEm * 1000, 2)] : depuis('incert') ? ['?'] : [])]
          .map((c, k) => <td key={k} style={{ border: `1px solid ${KIT.bord}`, padding: '2px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{c}</td>)}</tr>)}</tbody></table></div>
    </div>);
  const courbes = montrerCourbes && B2.length > 0 && !enDefi && <div style={{ ...styleBoite, ...cadre('courbes') }}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Énergies en fonction du temps</div><Courbes B={B2}/></div>;
  const codeBox = (enGuide ? depuis('py1') : mode === 'explore') && (
    <div style={{ ...styleBoite, ...cadre('code') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le même calcul en Python</div>
      <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12.5, lineHeight: 1.5, background: '#0f172a', color: '#e2e8f0', padding: 10, borderRadius: 8 }}>{enGuide && etape <= IDS.indexOf('py3') ? CODE.replace('v = d / (2 * tau)', idE === 'py1' ? 'v = d / (___)' : 'v = d / (2 * tau)').replace('Epp = m * g * y[i]', idE === 'py2' ? '___' : 'Epp = m * g * y[i]') : CODE}</pre>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Code affiché à titre de modèle : il n’est pas exécuté sur le site. Vous pouvez le copier dans Capytale ou Thonny.</div>
    </div>);
  const reglMasse = mode === 'explore' && source !== 'film' && (
    <div style={styleBoite}><label style={{ fontSize: 14, color: KIT.txt }}>Masse m (kg) : <input value={masseExp} onChange={e => setMasseExp(e.target.value)} aria-label="Masse en kilogrammes" style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/></label></div>);
  const reglMasseFilm = mode === 'explore' && source === 'film' && (
    <div style={styleBoite}><label style={{ fontSize: 14, color: KIT.txt }}>Masse m (kg) : <input value={masseExp} onChange={e => setMasseExp(e.target.value)} aria-label="Masse en kilogrammes" style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/></label></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pt-col { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 901px) { .pt-l1.cote .pt-carte { order: 2; } .pt-l1.cote .pt-main { order: 1; } }
        @media (max-width: 900px) { .pt-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Pointage d’un film et bilan énergétique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>À partir d’un film : <strong>pointer</strong> la position image par image, la <strong>convertir</strong> en mètres, <strong>calculer</strong> la vitesse puis les énergies, et <strong>comparer</strong> les écarts à l’incertitude.</div>
      <div className={`pt-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="pt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="pt-carte">{panneauHypo}</div> : null}
        <div className="pt-main"><div className="pt-col">
          {enDefi && defi && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.perte`} etat={suiviP}/></div>}
          {!enDefi && filmBox}
          {reglMasse}{reglMasseFilm && source === 'film' ? reglMasseFilm : null}
          {tableau}{courbes}{codeBox}
        </div></div>
      </div>
      {(mode === 'explore' || (enGuide && etape >= ETAPES.length - 1)) && panneauHypo}
      {mode === 'explore' && <div style={{ marginTop: 12 }}><ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>échelle (m/px) = longueur réelle ÷ longueur en pixels</li><li>v ≈ M<sub>i−1</sub>M<sub>i+1</sub> ÷ (2τ) ; E<sub>c</sub> = ½ m v² ; E<sub>pp</sub> = m g y ; E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub></li><li>compatibles si |E<sub>m1</sub> − E<sub>m2</sub>| ≤ √(u₁² + u₂²)</li></ul></ARetenir></div>}
    </div>
  );
}

// ---------- pointage d'une vidéo personnelle (traitée dans le navigateur) ----------
function VideoPointage({ fps, setFps, onDonnees }) {
  const [src, setSrc] = useState(null), [phase, setPhase] = useState('echelle'), [cal, setCal] = useState([]), [longueur, setLongueur] = useState('0,50');
  const [origine, setOrigine] = useState(null), [pts, setPts] = useState([]), [k, setK] = useState(0);
  const vid = useRef(null);
  const nfps = lireNombre(fps) || 30, ech = (() => { const L = lireNombre(longueur); if (cal.length < 2 || !isFinite(L)) return null; return M.echelle(L, Math.hypot(cal[1].px - cal[0].px, cal[1].py - cal[0].py)); })();
  useEffect(() => () => src && URL.revokeObjectURL(src), [src]);
  useEffect(() => { if (vid.current && src) { try { vid.current.currentTime = k / nfps; } catch { /* vidéo pas prête */ } } }, [k, nfps, src]);
  useEffect(() => { if (ech && origine) onDonnees(pts.map((p, i) => p && { i, t: i / nfps, ...M.pxVersMetres(p, { echelle: ech, origine: [origine.px, origine.py] }) }).filter(Boolean)); else onDonnees([]); }, [pts, ech, origine, nfps]);
  const clic = e => {
    const v = vid.current; if (!v || !v.videoWidth) return;
    const r = v.getBoundingClientRect(), p = { px: (e.clientX - r.left) * v.videoWidth / r.width, py: (e.clientY - r.top) * v.videoHeight / r.height };
    if (phase === 'echelle') { const c = [...cal, p].slice(-2); setCal(c); if (c.length === 2) setPhase('origine'); }
    else if (phase === 'origine') { setOrigine(p); setPhase('pointage'); }
    else { setPts(a => { const b = [...a]; b[k] = p; return b; }); setK(i => i + 1); }
  };
  const v = vid.current;
  const marque = (p, c) => v && v.videoWidth && p ? <circle key={`${p.px}-${p.py}`} cx={p.px} cy={p.py} r={Math.max(4, v.videoWidth / 160)} fill="none" stroke={c} strokeWidth={Math.max(2, v.videoWidth / 400)}/> : null;
  const consigne = { echelle: '1. Cliquez sur les deux extrémités d’un objet de longueur connue (étalon), puis indiquez sa longueur.', origine: '2. Cliquez sur l’origine (par exemple le point le plus bas de la trajectoire).', pointage: '3. Cliquez au centre de l’objet sur chaque image (l’image suivante s’affiche seule).' }[phase];
  return (
    <div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Chargez une vidéo de votre appareil. <strong>Elle reste sur votre appareil</strong> : elle n’est jamais envoyée sur Internet.</div>
      <label style={{ ...styleBouton(true, '#0e7490'), display: 'inline-block' }}>Choisir une vidéo<input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setSrc(URL.createObjectURL(f)); setPhase('echelle'); setCal([]); setOrigine(null); setPts([]); setK(0); } }}/></label>
      {src && <div style={{ marginTop: 8 }}>
        <div style={{ position: 'relative' }}>
          <video ref={vid} src={src} muted playsInline preload="auto" onLoadedData={() => setK(0)} style={{ width: '100%', display: 'block', borderRadius: 8, background: '#000' }}/>
          <svg viewBox={`0 0 ${v?.videoWidth || 1} ${v?.videoHeight || 1}`} onClick={clic} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }} role="img" aria-label="Zone de pointage sur la vidéo">
            {cal.map(p => marque(p, '#f97316'))}{origine && marque(origine, '#22c55e')}{pts.map(p => marque(p, '#ef4444'))}
          </svg>
        </div>
        <div style={{ fontSize: 13.5, color: KIT.txt, margin: '6px 0' }}>{consigne}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 14 }}>
          <label>Longueur de l’étalon (m) <input value={longueur} onChange={e => setLongueur(e.target.value)} style={{ width: 64, padding: '3px 6px' }}/></label>
          <label>Images par seconde <input value={fps} onChange={e => setFps(e.target.value)} style={{ width: 52, padding: '3px 6px' }}/></label>
          <button onClick={() => setK(i => Math.max(0, i - 1))} style={styleBouton(false)}>◀</button><span>image {k + 1}</span><button onClick={() => setK(i => i + 1)} style={styleBouton(false)}>▶</button>
          <button onClick={() => { setPts([]); setK(0); setCal([]); setOrigine(null); setPhase('echelle'); }} style={styleBouton(false)}><Pic n="refresh"/>Tout recommencer</button>
        </div>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>{ech ? `échelle : ${nbf(ech, 5)} m/px` : 'échelle non définie'} · {pts.filter(Boolean).length} point(s)</div>
      </div>}
    </div>);
}
