// Scènes de la simulation 196 « Corps pur ou mélange : température de changement d'état » (2GT).
// Schémas SVG : textes de 18 (viewBox de 480) à 13,5 (viewBox de 300), plafonnés à maxWidth 480 (scènes) ou 320 (cartes) ; couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
// Les disques sont des entités (schéma simplifié, pas à l'échelle) ; les dessins ne sont pas des photographies ; les courbes sont idéales (sans bruit de mesure).
import { KIT } from "../commun";
import * as M from "./corpsPur2gtModele";
import { COL } from "./changementEtat2gtCouleurs";
import { stl, PUR, MEL } from "./corpsPur2gtCouleurs";

const Tete = ({ x, y, c = COL.gris, dir = 'droite' }) => (dir === 'haut' ? <polygon points={`${x},${y} ${x - 6},${y + 10} ${x + 6},${y + 10}`} fill={c} />
  : dir === 'bas' ? <polygon points={`${x},${y} ${x - 6},${y - 10} ${x + 6},${y - 10}`} fill={c} />
  : <polygon points={`${x},${y} ${x - 10},${y - 6} ${x - 10},${y + 6}`} fill={c} />);

// Un nuage de disques dans une boîte : points = [[x, y, couleur], ...] (coordonnées de la boîte de 100 × 100)
export function Disques({ points, x = 0, y = 0, taille = 100, rayon = 9 }) {
  const k = taille / 100;
  return <g transform={`translate(${x} ${y}) scale(${k})`}>{points.map(([px, py, c], i) => <circle key={i} cx={px} cy={py} r={rayon} fill={c.fond} stroke={c.trait} strokeWidth="1.8" />)}</g>;
}
// ---------- étape 1 : un seul type d'entité ou plusieurs ----------
export function SceneMicro() {
  const cadre = (x, titre, sous, pts) => (
    <g><rect x={x} y={8} width={222} height={226} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <Disques points={pts} x={x + 36} y={18} taille={150} />
      <text x={x + 111} y={196} textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>{titre}</text>
      <text x={x + 111} y={222} textAnchor="middle" fontSize="18" fill={COL.gris}>{sous}</text></g>);
  return (
    <svg viewBox="0 0 480 242" style={stl()} role="img" aria-label="Deux schémas simplifiés des entités (sans respecter l’échelle). À gauche, un lingot d’or pur : toutes les entités sont identiques, une seule espèce chimique. À droite, de l’air : des entités de plusieurs sortes mélangées (diazote en bleu, dioxygène en rouge, une autre en vert), plusieurs espèces chimiques.">
      {cadre(8, 'un lingot d’or pur', 'une seule sorte', PUR)}{cadre(250, 'l’air', 'plusieurs sortes', MEL)}
    </svg>);
}

// ---------- étape 2 : un liquide ou plusieurs matières visibles ----------
export function SceneHomHet() {
  const verre = (x, titre, sous, contenu) => (
    <g><rect x={x} y={8} width={222} height={226} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <g transform={`translate(${x + 56} 20)`}>
        <path d="M0 0h110l-12 130H12z" fill="#f8fafc" stroke="#0284c7" strokeWidth="3" strokeLinejoin="round" />
        {contenu}
      </g>
      <text x={x + 111} y={196} textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>{titre}</text>
      <text x={x + 111} y={222} textAnchor="middle" fontSize="18" fill={COL.gris}>{sous}</text></g>);
  return (
    <svg viewBox="0 0 480 242" style={stl()} role="img" aria-label="Deux verres. À gauche, de l’eau et du sirop de menthe bien mélangés : un seul liquide vert est visible, c’est un mélange homogène. À droite, de l’eau et de l’huile : deux couches séparées sont visibles, c’est un mélange hétérogène.">
      {verre(8, 'eau et sirop', 'un seul liquide visible', <path d="M8 38h94l-9 90H17z" fill="#86efac" />)}
      {verre(250, 'eau et huile', 'deux couches visibles', <g><path d="M13 78h84l-5 50H17z" fill="#7dd3fc" /><path d="M8 38h94l-4 40H12z" fill="#fde047" /></g>)}
    </svg>);
}

// ---------- étape 7 : un thermomètre gradué (la valeur lue, sans la zone de précision) ----------
export function SceneThermometre({ lue = 56, prec = 1, titre = null }) {
  const x0 = 40, x1 = 440, bas = lue - 5, haut = lue + 5, X = T => x0 + (T - bas) / (haut - bas) * (x1 - x0), yT = 78;
  const graduations = [];
  for (let T = Math.ceil(bas); T <= haut + 1e-9; T += 1) graduations.push(T);
  return (
    <svg viewBox="0 0 480 190" style={stl()} role="img" aria-label={`Un thermomètre gradué tous les degrés Celsius. La valeur lue est ${lue} degrés Celsius. Précision du thermomètre : plus ou moins ${prec} degré Celsius.`}>
      <rect x={x0 - 10} y={yT - 16} width={x1 - x0 + 20} height={32} rx="16" fill="#f1f5f9" stroke="#475569" strokeWidth="2.5" />
      <rect x={x0 - 6} y={yT - 8} width={X(lue) - x0 + 6} height={16} rx="8" fill="#ef4444" />
      {graduations.map(T => <g key={T}><line x1={X(T)} y1={yT + 16} x2={X(T)} y2={yT + 30} stroke={COL.encre} strokeWidth="2" />
        {T % 2 === 0 && <text x={X(T)} y={yT + 54} textAnchor="middle" fontSize="18" fill={COL.encre}>{M.nombreFR(T)}</text>}</g>)}
      <Tete x={X(lue)} y={yT - 20} c={COL.orange} dir="bas" />
      <text x={X(lue)} y={yT - 36} textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.orange}>valeur lue : {M.nombreFR(lue)}&nbsp;°C</text>
      <text x={240} y={178} textAnchor="middle" fontSize="19" fontWeight="700" fill={COL.encre}>{titre || `précision du thermomètre : ± ${M.nombreFR(prec)}\u00a0°C`}</text>
    </svg>);
}

// ---------- courbe de température en fonction du temps ----------
// points : [[t, T], ...] ; tMax, yMin, yMax : bornes ; tPas, yPas : graduations ; surligne : [t1, t2] (zone d'ébullition, colorée) ;
// refs : lignes horizontales [{ T, label, couleur }] ; curseur : { t, T } ; cacheEchelleX : n'affiche pas les dates
export function CourbeT({ points, tMax = 20, yMin = 0, yMax = 110, tPas = 5, yPas = 20, ymineur = 10, surligne = null, refs = [], curseur = null, titre = '', ariaLabel = '', couleur = COL.bleu, tMin = 0, hauteur = 300, tMineur = 1 }) {
  const x0 = 78, x1 = 458, y0 = 16, y1 = hauteur - 66;
  const X = t => x0 + (t - tMin) / (tMax - tMin) * (x1 - x0), Y = T => y1 - (T - yMin) / (yMax - yMin) * (y1 - y0);
  const pts = points.filter(([t]) => t >= tMin - 1e-9);
  const d = pts.map(([t, T], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(T).toFixed(1)}`).join(' ');
  const gT = [], gY = [], gM = [], gV = [];
  for (let t = tMin; t <= tMax + 1e-9; t += tPas) gT.push(t);
  for (let T = yMin; T <= yMax + 1e-9; T += yPas) gY.push(T);
  if (tMineur) for (let t = tMin; t <= tMax + 1e-9; t += tMineur) gV.push(t);
  if (ymineur) for (let T = yMin; T <= yMax + 1e-9; T += ymineur) gM.push(T);
  return (
    <svg viewBox={`0 0 480 ${hauteur}`} style={stl()} role="img" aria-label={ariaLabel || titre || 'Courbe de température en fonction du temps'}>
      {gM.map(T => <line key={`m${T}`} x1={x0} y1={Y(T)} x2={x1} y2={Y(T)} stroke="#e2e8f0" strokeWidth="1.2" />)}
      {gV.map(t => <line key={`v${t}`} x1={X(t)} y1={y0} x2={X(t)} y2={y1} stroke="#eef2f7" strokeWidth="1.2" />)}
      {surligne && <rect x={X(surligne[0])} y={y0} width={X(surligne[1]) - X(surligne[0])} height={y1 - y0} fill="#fef3c7" opacity="0.7" />}
      <line x1={x0} y1={y1} x2={x1 + 8} y2={y1} stroke={COL.encre} strokeWidth="2" /><line x1={x0} y1={y1} x2={x0} y2={y0 - 6} stroke={COL.encre} strokeWidth="2" />
      <Tete x={x1 + 14} y={y1} c={COL.encre} dir="droite" /><Tete x={x0} y={y0 - 12} c={COL.encre} dir="haut" />
      {gT.map(t => <g key={`t${t}`}><line x1={X(t)} y1={y1} x2={X(t)} y2={y1 + 7} stroke={COL.encre} strokeWidth="2" /><text x={X(t)} y={y1 + 28} textAnchor="middle" fontSize="18" fill={COL.encre}>{M.nombreFR(t)}</text></g>)}
      {gY.map(T => <g key={`y${T}`}><line x1={x0 - 7} y1={Y(T)} x2={x0} y2={Y(T)} stroke={COL.encre} strokeWidth="2" /><text x={x0 - 11} y={Y(T) + 6} textAnchor="end" fontSize="18" fill={COL.encre}>{M.nombreFR(T)}</text></g>)}
      {refs.map(({ T, label, couleur: c = COL.orange }) => <g key={`r${T}`}><line x1={x0} y1={Y(T)} x2={x1} y2={Y(T)} stroke={c} strokeWidth="2.5" strokeDasharray="8 6" />
        <text x={x1 - 4} y={Y(T) - 8} textAnchor="end" fontSize="18" fontWeight="800" fill={c}>{label}</text></g>)}
      <clipPath id={`cp-clip-${hauteur}-${tMin}-${yMin}`}><rect x={x0} y={y0 - 6} width={x1 - x0 + 4} height={y1 - y0 + 6} /></clipPath>
      <path clipPath={`url(#cp-clip-${hauteur}-${tMin}-${yMin})`} d={d} fill="none" stroke={couleur} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      {curseur && <g><line x1={X(curseur.t)} y1={Y(curseur.T)} x2={X(curseur.t)} y2={y1} stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4" />
        <line x1={x0} y1={Y(curseur.T)} x2={X(curseur.t)} y2={Y(curseur.T)} stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4" />
        <circle cx={X(curseur.t)} cy={Y(curseur.T)} r={8} fill={COL.orange} stroke="white" strokeWidth="2.5" /></g>}
      <text x={(x0 + x1) / 2} y={y1 + 56} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>temps (min)</text>
      <text transform={`translate(20 ${(y0 + y1) / 2}) rotate(-90)`} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>température (°C)</text>
    </svg>);
}
// Courbe d'un profil de chauffage, avec les réglages d'affichage les plus courants
export function CourbeProfil({ pr, surligne = false, curseurT = null, refs = [], tMax = 20, ariaLabel = '', ...reste }) {
  const pts = M.courbe(pr);
  const cur = curseurT == null ? null : { t: curseurT, T: M.temperature(pr, curseurT) };
  return <CourbeT points={pts} tMax={tMax} surligne={surligne ? [pr.tDeb, pr.tFin] : null} curseur={cur} refs={refs} ariaLabel={ariaLabel} {...reste} />;
}

// ---------- tableau des valeurs de référence (pression atmosphérique normale) ----------
export function TableauRef({ lignes = M.LISTE_CORPS, fusion = true }) {
  const cel = { padding: '5px 8px', border: `1px solid ${KIT.bord}`, fontSize: 15, textAlign: 'center', color: KIT.txt };
  const th = { ...cel, background: '#f1f5f9', fontWeight: 700 };
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }} data-tableau-ref="1">
      <caption style={{ captionSide: 'top', fontSize: 13.5, color: KIT.txt2, textAlign: 'left', paddingBottom: 4 }}>Valeurs de référence, à la pression atmosphérique normale</caption>
      <thead><tr><th style={th}>corps pur</th>{fusion && <th style={th}>température de fusion</th>}<th style={th}>température d’ébullition</th></tr></thead>
      <tbody>{lignes.map(c => <tr key={c.id}><td style={{ ...cel, fontWeight: 700, textAlign: 'left' }}>{c.nom} ({c.f})</td>{fusion && <td style={cel}>{M.temp(c.Tfus)}</td>}<td style={cel}>{M.temp(c.Tvap)}</td></tr>)}</tbody>
    </table>);
}
