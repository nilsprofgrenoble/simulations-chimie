import { useState, useRef } from "react";
import { useSignalerMode, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, styleBouton, stylePetitBouton, styleBoite, LigneMesure,
  ORANGE_GUIDE, avecIndices, BoutonsModes } from "../commun";
import {
  lireNombre, ecrire, regressionAffine, regressionProportionnelle, lectureInverse, ecrireAvecIncertitude, arrondirResultat,
  uniteQuotient, diagnostics, analyserTexte, serieXY, versCSV, versTexteTableur, echelle,
} from "./grapheurModele";
import "./Grapheur.css";

// ====================================================
//  GRAPHEUR (page 124, hors menu : ouverte par ?sim=124)
//  Outil de traitement de mesures pour les lycéens : tableau → nuage de points → modèle (proportionnel ou affine) →
//  écarts au modèle (résidus) et hypothèses → lecture inverse. Fonctionne sans réseau, sans compte ; les données restent sur l'appareil.
//  Parcours guidé : l'étalonnage d'un spectrophotomètre (loi de Beer-Lambert, 1re spé PC). Exploration libre : ses propres données.
//  Les calculs sont dans grapheurModele.js (testé contre les valeurs certifiées NIST).
// ====================================================

const CLE_GUIDE = 'grapheur-guide-v1';
const CLE_LIBRE = 'grapheur-libre-v1';
const NBSP = ' ';

// Gamme étalon du parcours : permanganate de potassium à 525 nm, cuve de 1 cm. Données simulées (mesures fictives, bruit réaliste de quelques millièmes).
const COLONNES_BEER = [{ nom: 'C', unite: 'mmol/L' }, { nom: 'A', unite: '' }];
const LIGNES_BEER = [['0,050', '0,112'], ['0,100', '0,218'], ['0,200', '0,447'], ['0,300', '0,655'], ['0,400', '0,884']];
const A_ECHANTILLON = 0.536;

const BLEU = '#1d4ed8', ORANGE = '#d9730d', VERT = '#15803d', GRIS = '#64748b';

// ── Graphique ──────────────────────────────────────────────────────────────────────────────────
const nomAxe = (c) => c.unite ? `${c.nom} (${c.unite})` : c.nom;

function geometrie(x, y, modele) {
  let xmin = Math.min(...x), xmax = Math.max(...x), ymin = Math.min(...y), ymax = Math.max(...y);
  if (modele) { ymin = Math.min(ymin, modele.b); }
  const ex = echelle(xmin, xmax, 5), ey = echelle(ymin, ymax, 5);
  return { ex, ey };
}

function Graphique({ x, y, cx, cy, modele, lecture, svgRef }) {
  const W = 360, H = 270, ml = 58, mr = 12, mt = 14, mb = 52;
  if (x.length === 0) return <div className="gr-vide">Aucun point à tracer : complétez le tableau.</div>;
  const { ex, ey } = geometrie(x, y, modele);
  const px = v => ml + (v - ex.min) / (ex.max - ex.min) * (W - ml - mr);
  const py = v => H - mb - (v - ey.min) / (ey.max - ey.min) * (H - mt - mb);
  const yModele = v => modele.a * v + modele.b;
  const lecY = lecture && isFinite(lecture.y0) && lecture.y0 >= ey.min && lecture.y0 <= ey.max;
  const resume = `Nuage de ${x.length} points : ${nomAxe(cy)} en fonction de ${nomAxe(cx)}.${modele ? ' Une droite modèle est tracée.' : ''}`;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resume} className="gr-svg" xmlns="http://www.w3.org/2000/svg" fontFamily="sans-serif">
      <rect x="0" y="0" width={W} height={H} fill="white"/>
      {ex.graduations.map(g => <g key={`x${g}`}>
        <line x1={px(g)} x2={px(g)} y1={mt} y2={H - mb} stroke="#e2e8f0" strokeWidth="1"/>
        <text x={px(g)} y={H - mb + 19} fontSize="15" fill="#334155" textAnchor="middle">{ecrire(g, 3)}</text></g>)}
      {ey.graduations.map(g => <g key={`y${g}`}>
        <line x1={ml} x2={W - mr} y1={py(g)} y2={py(g)} stroke="#e2e8f0" strokeWidth="1"/>
        <text x={ml - 6} y={py(g) + 4.5} fontSize="15" fill="#334155" textAnchor="end">{ecrire(g, 3)}</text></g>)}
      <line x1={ml} x2={W - mr} y1={H - mb} y2={H - mb} stroke="#334155" strokeWidth="1.5"/>
      <line x1={ml} x2={ml} y1={mt} y2={H - mb} stroke="#334155" strokeWidth="1.5"/>
      <text x={(ml + W - mr) / 2} y={H - 6} fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">{nomAxe(cx)}</text>
      <text transform={`translate(15 ${(mt + H - mb) / 2}) rotate(-90)`} fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">{nomAxe(cy)}</text>
      {modele && <line x1={px(ex.min)} y1={py(yModele(ex.min))} x2={px(ex.max)} y2={py(yModele(ex.max))} stroke={ORANGE} strokeWidth="2.5" clipPath="url(#gr-zone)"/>}
      <clipPath id="gr-zone"><rect x={ml} y={mt} width={W - ml - mr} height={H - mt - mb}/></clipPath>
      {lecY && <g>
        <line x1={ml} x2={lecture.x0 != null ? px(lecture.x0) : W - mr} y1={py(lecture.y0)} y2={py(lecture.y0)} stroke={VERT} strokeWidth="1.8" strokeDasharray="5 4"/>
        {lecture.x0 != null && isFinite(lecture.x0) && <line x1={px(lecture.x0)} x2={px(lecture.x0)} y1={py(lecture.y0)} y2={H - mb} stroke={VERT} strokeWidth="1.8" strokeDasharray="5 4"/>}
        {lecture.x0 != null && isFinite(lecture.x0)
          ? (() => {
            const lignesEt = String(lecture.etiquette).split('\n');
            const droite = px(lecture.x0) + 8 + 84 <= W - mr;
            return <text x={droite ? px(lecture.x0) + 8 : px(lecture.x0) - 8} y={H - mb - 12 - 18 * (lignesEt.length - 1)} fontSize="15" fontWeight="700" fill={VERT} textAnchor={droite ? 'start' : 'end'}>
              {lignesEt.map((l, i) => <tspan key={i} x={droite ? px(lecture.x0) + 8 : px(lecture.x0) - 8} dy={i === 0 ? 0 : 18}>{l}</tspan>)}</text>;
          })()
          : <text x={ml + 8} y={py(lecture.y0) - 7} fontSize="15" fontWeight="700" fill={VERT}>{lecture.etiquette}</text>}
        </g>}
      {x.map((v, i) => <g key={i}>
        <circle cx={px(v)} cy={py(y[i])} r="5" fill={BLEU} stroke="white" strokeWidth="1.5"/>
        <title>{`${cx.nom} = ${ecrire(v, 4)} ; ${cy.nom} = ${ecrire(y[i], 4)}`}</title></g>)}
    </svg>
  );
}

// Écarts au modèle : un bâton par point, à la même échelle horizontale que le graphique ; bande ±2·s_r
function Residus({ x, modele, cx, cy }) {
  const W = 360, H = 152, ml = 66, mr = 12, mt = 12, mb = 42;
  const { ex } = geometrie(x, x, null);
  const r = modele.residus;
  const rmax = Math.max(...r.map(Math.abs), 2 * modele.sr, 1e-12) * 1.15;
  const px = v => ml + (v - ex.min) / (ex.max - ex.min) * (W - ml - mr);
  const py = v => mt + (rmax - v) / (2 * rmax) * (H - mt - mb);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Écarts entre les mesures de ${cy.nom} et le modèle, en fonction de ${cx.nom}`} className="gr-svg gr-svg-res" xmlns="http://www.w3.org/2000/svg" fontFamily="sans-serif">
      <rect x="0" y="0" width={W} height={H} fill="white"/>
      <rect x={ml} y={py(2 * modele.sr)} width={W - ml - mr} height={py(-2 * modele.sr) - py(2 * modele.sr)} fill="#fef3c7"/>
      <text x={W - mr - 4} y={py(2 * modele.sr) + 13} fontSize="14.5" fill="#92400e" textAnchor="end">bande ±2 s</text>
      <line x1={ml} x2={W - mr} y1={py(0)} y2={py(0)} stroke="#334155" strokeWidth="1.5"/>
      <line x1={ml} x2={ml} y1={mt} y2={H - mb} stroke="#334155" strokeWidth="1.5"/>
      <text x={ml - 6} y={py(0) + 4.5} fontSize="15" fill="#334155" textAnchor="end">0</text>
      <text x={ml - 6} y={mt + 10} fontSize="15" fill="#334155" textAnchor="end">+{ecrire(rmax / 1.15, 2)}</text>
      <text x={ml - 6} y={H - mb} fontSize="15" fill="#334155" textAnchor="end">−{ecrire(rmax / 1.15, 2)}</text>
      {ex.graduations.map(g => <text key={g} x={px(g)} y={H - mb + 18} fontSize="15" fill="#334155" textAnchor="middle">{ecrire(g, 3)}</text>)}
      <text x={(ml + W - mr) / 2} y={H - 4} fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">{nomAxe(cx)}</text>
      {x.map((v, i) => <g key={i}>
        <line x1={px(v)} x2={px(v)} y1={py(0)} y2={py(r[i])} stroke={ORANGE} strokeWidth="2"/>
        <circle cx={px(v)} cy={py(r[i])} r="4.5" fill={ORANGE} stroke="white" strokeWidth="1.2"/>
        <title>{`écart = ${ecrire(r[i], 3)}`}</title></g>)}
    </svg>
  );
}

// ── Résultat et hypothèses ─────────────────────────────────────────────────────────────────────
function PanneauResultat({ modele, cx, cy, avecR2 }) {
  const prop = modele.type === 'proportionnel';
  const uA = uniteQuotient(cy.unite, cx.unite);
  return (
    <div className="gr-resultat" data-resultat="1">
      <div className="gr-titre-bloc">Résultat de l’ajustement</div>
      <div className="gr-eq">{prop ? <>{cy.nom}{NBSP}={NBSP}k{NBSP}×{NBSP}{cx.nom}</> : <>{cy.nom}{NBSP}={NBSP}a{NBSP}×{NBSP}{cx.nom}{NBSP}+{NBSP}b</>}</div>
      <LigneMesure nom={prop ? 'k' : 'a'} valeur={ecrireAvecIncertitude(modele.a, modele.ua, uA)} couleur={ORANGE}/>
      {!prop && <LigneMesure nom="b" valeur={ecrireAvecIncertitude(modele.b, modele.ub, cy.unite)} couleur={ORANGE}/>}
      <LigneMesure nom="s (écart-type des écarts)" valeur={`${ecrire(modele.sr, 2)}${cy.unite ? NBSP + cy.unite : ''}`}/>
      {avecR2 && !prop && isFinite(modele.r2) && <LigneMesure nom="R²" valeur={ecrire(modele.r2, 5)}/>}
      <div className="gr-note">Les valeurs après « ± » sont des incertitudes-types u. {avecR2 && !prop ? 'Un R² proche de 1 ne prouve pas que le modèle convient : regardez les écarts.' : ''}</div>
    </div>
  );
}

const ICONES = { ok: ['✔', '#15803d', 'testée, compatible'], doute: ['⚠', '#b45309', 'testée, douteuse'], info: ['ⓘ', '#475569', 'non testable ici : à discuter'] };
function BandeauHypotheses({ liste }) {
  return (
    <div className="gr-hyp" data-bandeau-hypotheses="1">
      <div className="gr-titre-bloc">Hypothèses de ce calcul</div>
      <ul className="gr-hyp-liste">
        {liste.map(h => {
          const [pic, coul, etat] = ICONES[h.statut];
          return (
            <li key={h.id}>
              <details open={h.statut === 'doute'}>
                <summary><span aria-hidden="true" style={{ color: coul, fontWeight: 800, marginRight: 6 }}>{pic}</span><strong>{h.titre}</strong>
                  <span className="gr-etat" style={{ color: coul }}> — {etat}</span></summary>
                <p>{h.texte}</p>
              </details>
            </li>);
        })}
      </ul>
    </div>
  );
}

// ── Tableau de données ─────────────────────────────────────────────────────────────────────────
function Tableau({ colonnes, lignes, editable, onCellule, onEntete, onAjouter, onSupprimer }) {
  return (
    <div className="gr-tableau-zone">
      <table className="gr-tableau" data-tableau-donnees="1">
        <thead>
          <tr>
            {colonnes.map((c, j) => <th key={j} scope="col">
              {editable
                ? <div className="gr-entete"><input aria-label={`Nom de la colonne ${j + 1}`} value={c.nom} onChange={e => onEntete(j, { nom: e.target.value })} className="gr-in gr-in-nom"/>
                  <input aria-label={`Unité de la colonne ${j + 1}`} value={c.unite} placeholder="unité" onChange={e => onEntete(j, { unite: e.target.value })} className="gr-in gr-in-unite"/></div>
                : <>{avecIndices(c.nom)}{c.unite && <span className="gr-unite"> ({c.unite})</span>}</>}
            </th>)}
            {editable && <th aria-hidden="true" className="gr-th-vide"/>}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => <tr key={i}>
            {colonnes.map((c, j) => <td key={j}>
              {editable
                ? <input inputMode="decimal" aria-label={`${c.nom || 'colonne ' + (j + 1)}, ligne ${i + 1}`} value={l[j] ?? ''} onChange={e => onCellule(i, j, e.target.value)}
                  className={`gr-in gr-in-cel${(l[j] ?? '') !== '' && !isFinite(lireNombre(l[j])) ? ' gr-invalide' : ''}`}/>
                : l[j]}
            </td>)}
            {editable && <td className="gr-td-sup"><button onClick={() => onSupprimer(i)} aria-label={`Supprimer la ligne ${i + 1}`} className="gr-sup" title="Supprimer cette ligne">✕</button></td>}
          </tr>)}
        </tbody>
      </table>
      {editable && <button onClick={onAjouter} style={stylePetitBouton(false, '#1a7abf')}>+ Ajouter une ligne</button>}
    </div>
  );
}

// ── Import : collage depuis un tableur, ou fichier CSV / TXT ─────────────────────────────────────
function Import({ onUtiliser }) {
  const [texte, setTexte] = useState('');
  const [lu, setLu] = useState(null);
  const analyser = t => setLu(t.trim() ? analyserTexte(t) : null);
  const fichier = async e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try { const t = await f.text(); setTexte(t); analyser(t); } catch { setLu({ ok: false, raison: 'Ce fichier ne peut pas être lu comme du texte.' }); }
    e.target.value = '';
  };
  return (
    <div className="gr-import">
      <label htmlFor="gr-coller" className="gr-label">Collez ici des cellules copiées depuis un tableur (Excel, LibreOffice, Google Sheets), ou le contenu d’un fichier CSV :</label>
      <textarea id="gr-coller" value={texte} onChange={e => { setTexte(e.target.value); analyser(e.target.value); }} rows={4} className="gr-zone-texte"
        placeholder={'C (mmol/L)\tA\n0,05\t0,112\n0,10\t0,218'} spellCheck={false}/>
      <div className="gr-ligne-btn">
        <label className="gr-fichier">📂 Ouvrir un fichier (.csv, .txt)
          <input type="file" accept=".csv,.txt,.tsv,text/plain,text/csv" onChange={fichier}/></label>
      </div>
      {lu && !lu.ok && <div className="gr-erreur" role="alert">{lu.raison}</div>}
      {lu && lu.ok && <div className="gr-apercu" data-apercu-import="1">
        <div className="gr-note">J’ai reconnu : séparateur « {lu.nomSeparateur} » ; décimale : {lu.decimale === 'aucune' ? 'entiers' : lu.decimale} ; {lu.entete ? 'première ligne = noms des colonnes' : 'pas de ligne de noms'} ;
          {' '}{lu.lignes.length} ligne{lu.lignes.length > 1 ? 's' : ''} × {lu.colonnes.length} colonne{lu.colonnes.length > 1 ? 's' : ''}.</div>
        {lu.avertissements.map((a, i) => <div key={i} className="gr-avert">⚠ {a}</div>)}
        <Tableau colonnes={lu.colonnes} lignes={lu.brutes.slice(0, 6)} editable={false}/>
        {lu.lignes.length > 6 && <div className="gr-note">… et {lu.lignes.length - 6} autre(s) ligne(s).</div>}
        <button onClick={() => { onUtiliser(lu); setTexte(''); setLu(null); }} style={styleBouton(true, '#16a34a')}>✓ Utiliser ces données</button>
      </div>}
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────────────────────
function telecharger(nom, contenu, type) {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function telechargerPNG(svg, nom) {
  if (!svg) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = 1000; c.height = Math.round(1000 * 270 / 360);
    const g = c.getContext('2d');
    g.fillStyle = 'white'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(b => { if (b) { const url = URL.createObjectURL(b); const a = document.createElement('a'); a.href = url; a.download = nom; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); } }, 'image/png');
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}

// ════════════════ PARCOURS GUIDÉ : étalonnage d'un spectrophotomètre ════════════════
function construireEtapes({ k, uk, eps, cEch, uEch, ajuste, ajuster, aEch }) {
  const kTxt = arrondirResultat(k, uk).valeur;
  const aTxt = ecrire(aEch, 3);
  return [
    { titre: 'Les mesures', texte: 'Au TP, on a préparé cinq solutions de permanganate de potassium dont on connaît la concentration C, puis on a mesuré l’absorbance A de chacune à 525 nm, dans une cuve de 1 cm. Voici le tableau de mesures.',
      tache: { type: 'num', q: 'Quelle absorbance A a-t-on mesurée pour la solution la plus concentrée ?', vrai: 0.884, tol: 0.003, unite: '', carnet: false,
        aide: 'Cherchez la plus grande valeur de C, et lisez A sur la même ligne.',
        indice: 'La solution la plus concentrée est celle qui a la plus grande valeur de C : regardez la dernière ligne du tableau.',
        expl: 'C = 0,400 mmol/L est la plus grande concentration ; son absorbance est A = 0,884.',
        pieges: [[0.4, 'C’est la concentration (0,400 mmol/L) ; on cherche l’absorbance A, dans l’autre colonne.']] } },
    { titre: 'Le nuage de points', texte: 'Chaque ligne du tableau devient un point du graphique : la concentration C est en abscisse, l’absorbance A en ordonnée.',
      tache: { type: 'qcm', q: 'Que remarque-t-on sur la disposition des points ?', bonne: 0,
        options: ['Ils sont presque alignés, le long d’une droite qui passe près de l’origine', 'Ils dessinent une courbe qui s’aplatit vers la droite', 'Ils sont dispersés : A ne dépend pas de C'],
        indice: 'Imaginez une règle posée sur le graphique : les points restent-ils proches de la règle ?',
        expl: 'Plus C augmente, plus A augmente, et les points sont presque alignés : A semble proportionnelle à C.' } },
    { titre: 'Choisir un modèle', texte: 'On choisit le modèle avant de demander à l’ordinateur de calculer, et on sait dire pourquoi. Ici, la loi de Beer-Lambert relie A et C : A = ε × ℓ × C, où ℓ = 1 cm est la largeur de la cuve.',
      tache: { type: 'qcm', q: 'Quel modèle choisir pour A en fonction de C ?', bonne: 0,
        options: ['Proportionnel : A = k × C', 'Affine : A = k × C + b, avec b quelconque', 'Exponentiel : A = A₀ × e^(−C/τ)'],
        indice: 'Que vaut l’absorbance d’une solution qui ne contient aucune espèce colorée (C = 0) ?',
        expl: 'Sans espèce colorée, A = 0 : la droite passe par l’origine. On choisit donc A = k × C, ce qui est aussi ce que prévoit la loi de Beer-Lambert.' } },
    { titre: 'Ajuster le modèle', texte: 'L’ordinateur cherche la droite A = k × C qui passe au plus près des points : c’est la méthode des moindres carrés. Elle minimise la somme des carrés des écarts verticaux entre les points et la droite.',
      tache: { type: 'action', label: 'Ajuster A = k × C', faire: ajuster, ok: ajuste, consigne: ajuste ? 'La droite est tracée : elle passe près des cinq points.' : undefined } },
    { titre: 'Le coefficient k', texte: `L’ordinateur donne k = (${kTxt} ± ${arrondirResultat(k, uk).u}) L·mmol⁻¹, avec son incertitude-type. Ce coefficient regroupe ε et ℓ : k = ε × ℓ.`,
      tache: { type: 'num', q: 'Calculez ε, en L·mol⁻¹·cm⁻¹, sachant que k = ' + kTxt + ' L·mmol⁻¹ et ℓ = 1 cm', vrai: eps, tol: 0.02, unite: 'L·mol⁻¹·cm⁻¹',
        carnet: 'Coefficient d’absorption molaire ε', indice: 'ε = k / ℓ. Attention aux unités : 1 mmol = 10⁻³ mol, donc 1 L·mmol⁻¹ = 1000 L·mol⁻¹.',
        expl: 'ε = k / ℓ ≈ ' + ecrire(eps, 3) + ' L·mol⁻¹·cm⁻¹.',
        calcul: () => ['k = ε × ℓ, donc ε = k / ℓ', `ε = ${kTxt} L·mmol⁻¹ / 1 cm = ${kTxt} L·mmol⁻¹·cm⁻¹`, `1 L·mmol⁻¹ = 1000 L·mol⁻¹, donc ε ≈ ${ecrire(eps, 3)} L·mol⁻¹·cm⁻¹`],
        pieges: [[k, 'Il manque la conversion des mmol en mol : multipliez par 1000.']] } },
    { titre: 'Vérifier le modèle', texte: 'Un bon ajustement ne se juge pas seulement à l’œil. Sous le graphique, un bâton montre pour chaque point l’écart entre la mesure et la droite. Le bandeau « Hypothèses » liste ce que le calcul suppose et ce que le logiciel a pu vérifier.',
      tache: { type: 'qcm', q: 'Les écarts sont-ils répartis au hasard de part et d’autre de 0 ?', bonne: 0,
        options: ['Oui : des écarts positifs et négatifs se mélangent, sans courbe ni tendance', 'Non : les écarts dessinent une courbe en arc', 'Non : les écarts grandissent régulièrement quand C augmente'],
        indice: 'Si le modèle était mauvais, les écarts auraient un motif (tous positifs au milieu, négatifs aux extrémités…).',
        expl: 'Les écarts changent de signe et restent de l’ordre de quelques millièmes d’absorbance : aucun motif net. Le modèle A = k × C convient pour cette gamme.' } },
    { titre: 'Lire la concentration inconnue', texte: `On mesure, dans les mêmes conditions, l’absorbance d’une solution de permanganate de concentration inconnue : A = ${aTxt}. On cherche la concentration C pour laquelle la droite donne cette absorbance (trait vert).`,
      tache: { type: 'num', q: 'Quelle est la concentration C de cette solution, en mmol/L ?', vrai: cEch, tol: 0.03, unite: 'mmol/L', cs: 2, carnet: 'Concentration de la solution inconnue C',
        indice: `A = k × C, donc C = A / k, avec A = ${aTxt} et k = ${kTxt} L·mmol⁻¹.`,
        expl: `C = A / k ≈ ${ecrire(cEch, 3)} mmol/L.`,
        calcul: () => ['A = k × C, donc C = A / k', `C = ${aTxt} / ${kTxt} L·mmol⁻¹ = ${ecrire(cEch, 3)} mmol/L`],
        pieges: [[aEch * k, 'Vous avez multiplié A par k : il faut diviser, car A = k × C.']] } },
    { titre: 'Bilan', texte: `Résultat : C = ${ecrireAvecIncertitude(cEch, uEch, 'mmol/L')}, où ce qui suit ± est l’incertitude-type. Elle vient de deux causes : la dispersion des points autour de la droite, et l’incertitude sur k. Ce résultat vaut si les hypothèses du bandeau sont acceptables : la droite passe par l’origine, les mesures sont indépendantes et l’absorbance reste dans la zone où la loi de Beer-Lambert s’applique (A ≲ 1). Vous pouvez maintenant essayer vos propres données dans l’exploration libre.` },
  ];
}

// ════════════════ PAGE ════════════════
export function SimulationGrapheur() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [libre, setLibre] = useEtatPersistant(CLE_LIBRE, { colonnes: COLONNES_BEER, lignes: LIGNES_BEER, modele: 'aucun', ix: 0, iy: 1, yEch: '' });
  const [ouvert, setOuvert] = useState({ import: false, export: false });
  const svgRef = useRef(null);
  const enGuide = mode === 'guide';

  // ── Parcours guidé : modèle proportionnel sur la gamme étalon ──
  const gx = LIGNES_BEER.map(l => lireNombre(l[0])), gy = LIGNES_BEER.map(l => lireNombre(l[1]));
  const mG = regressionProportionnelle(gx, gy);
  const lecG = lectureInverse(mG, A_ECHANTILLON);
  const e = Math.min(guide.etape, 7);
  const ajuste = !!(guide.reps && guide.reps.aj);
  const etapes = construireEtapes({ k: mG.a, uk: mG.ua, eps: mG.a * 1000, cEch: lecG.x0, uEch: lecG.u, aEch: A_ECHANTILLON, ajuste,
    ajuster: () => setGuide(g => ({ ...g, reps: { ...g.reps, aj: true } })) });
  const finParcours = <button onClick={() => setMode('explore')} style={styleBouton(true, ORANGE_GUIDE)}>Explorer avec mes données ▶</button>;
  const modeleVu = e >= 4 || (e === 3 && ajuste);

  // ── Exploration libre : données de l'élève ──
  const { colonnes, lignes } = libre;
  const ix = Math.min(libre.ix, colonnes.length - 1), iy = Math.min(libre.iy, colonnes.length - 1);
  const { x, y } = serieXY(lignes, ix, iy);
  const mL = libre.modele === 'proportionnel' ? regressionProportionnelle(x, y) : libre.modele === 'affine' ? regressionAffine(x, y) : null;
  const yEch = lireNombre(libre.yEch);
  const lecL = mL && isFinite(yEch) ? lectureInverse(mL, yEch) : null;
  const majLibre = f => setLibre(l => ({ ...l, ...f(l) }));
  const utiliser = lu => majLibre(() => ({ colonnes: lu.colonnes, lignes: lu.brutes, ix: 0, iy: 1, modele: 'aucun', yEch: '' }));
  const nomFichier = (ext) => `grapheur-${(colonnes[iy]?.nom || 'y')}-${(colonnes[ix]?.nom || 'x')}.${ext}`.replace(/[^\w.-]+/g, '_');

  return (
    <div className="gr-racine" style={{ ...cardStyle, textAlign: 'left' }}>
      <div className="gr-haut">
        <BoutonsModes mode={mode} setMode={setMode} modes={['guide', 'explore']}/>
      </div>

      {enGuide ? (
        <div className="gr-l1">
          <div className="gr-col">
            <div style={styleBoite}>
              <details key={e >= 1 ? 'replie' : 'ouvert'} open={e === 0} className="gr-details-tab">
                <summary className="gr-titre-bloc">Gamme étalon de permanganate de potassium (525 nm, cuve de 1 cm)</summary>
                <Tableau colonnes={COLONNES_BEER} lignes={LIGNES_BEER} editable={false}/>
              </details>
            </div>
            {e >= 1 && <div style={styleBoite}>
              <Graphique x={gx} y={gy} cx={COLONNES_BEER[0]} cy={COLONNES_BEER[1]} modele={modeleVu ? mG : null}
                lecture={e >= 6 ? { y0: A_ECHANTILLON, x0: e >= 7 ? lecG.x0 : null, etiquette: e >= 7 ? `C ≈ ${ecrire(lecG.x0, 3)}\nmmol/L` : `A = ${ecrire(A_ECHANTILLON, 3)}` } : null}/>
              {e >= 5 && <div style={{ marginTop: 8 }}>
                <div className="gr-titre-bloc">Écarts entre les mesures et la droite</div>
                <Residus x={gx} modele={mG} cx={COLONNES_BEER[0]} cy={COLONNES_BEER[1]}/></div>}
            </div>}
            {e >= 4 && <div style={styleBoite}><PanneauResultat modele={mG} cx={COLONNES_BEER[0]} cy={COLONNES_BEER[1]}/></div>}
            {e >= 5 && <div style={styleBoite}><BandeauHypotheses liste={diagnostics(gx, gy, mG)}/></div>}
          </div>
          <div className="gr-carte"><CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        </div>
      ) : (
        <div className="gr-l2">
          <div className="gr-col">
            <div style={styleBoite}>
              <div className="gr-titre-bloc">Mes mesures</div>
              <Tableau colonnes={colonnes} lignes={lignes} editable
                onCellule={(i, j, v) => majLibre(l => ({ lignes: l.lignes.map((r, a) => a === i ? r.map((c, b) => b === j ? v : c) : r) }))}
                onEntete={(j, p) => majLibre(l => ({ colonnes: l.colonnes.map((c, a) => a === j ? { ...c, ...p } : c) }))}
                onAjouter={() => majLibre(l => ({ lignes: [...l.lignes, l.colonnes.map(() => '')] }))}
                onSupprimer={i => majLibre(l => ({ lignes: l.lignes.filter((_, a) => a !== i) }))}/>
              {colonnes.length > 2 && <div className="gr-choix-axes">
                <label>En abscisse : <select value={ix} onChange={ev => majLibre(() => ({ ix: Number(ev.target.value) }))}>{colonnes.map((c, j) => <option key={j} value={j}>{c.nom || `colonne ${j + 1}`}</option>)}</select></label>
                <label>En ordonnée : <select value={iy} onChange={ev => majLibre(() => ({ iy: Number(ev.target.value) }))}>{colonnes.map((c, j) => <option key={j} value={j}>{c.nom || `colonne ${j + 1}`}</option>)}</select></label>
              </div>}
            </div>
            <div style={styleBoite}>
              <button className="gr-bascule" aria-expanded={ouvert.import} onClick={() => setOuvert(o => ({ ...o, import: !o.import }))}><span>Importer ou coller des données</span><span aria-hidden="true">{ouvert.import ? '▲' : '▼'}</span></button>
              {ouvert.import && <Import onUtiliser={utiliser}/>}
            </div>
          </div>
          <div className="gr-col">
            <div style={styleBoite}>
              <div className="gr-modeles" role="group" aria-label="Choix du modèle">
                {[['aucun', 'Aucun modèle'], ['proportionnel', 'Proportionnel y = k·x'], ['affine', 'Affine y = a·x + b']].map(([id, nom]) =>
                  <button key={id} onClick={() => majLibre(() => ({ modele: id }))} aria-pressed={libre.modele === id} style={stylePetitBouton(libre.modele === id, ORANGE)}>{nom}</button>)}
              </div>
              {libre.modele === 'aucun' && x.length > 0 && <div className="gr-note">Regardez d’abord le nuage de points : les points semblent-ils alignés ? Sur une droite qui passe par l’origine ? Puis choisissez un modèle.</div>}
              {x.length > 0 && x.length < (libre.modele === 'affine' ? 3 : 2) && libre.modele !== 'aucun' && <div className="gr-avert">⚠ Pas assez de points pour ce modèle.</div>}
              <Graphique x={x} y={y} cx={colonnes[ix]} cy={colonnes[iy]} modele={mL} svgRef={svgRef}
                lecture={lecL ? { y0: yEch, x0: lecL.x0, etiquette: `${colonnes[ix].nom} ≈ ${ecrire(lecL.x0, 3)}${colonnes[ix].unite ? '\n' + colonnes[ix].unite : ''}` } : null}/>
              {mL && <div style={{ marginTop: 8 }}>
                <div className="gr-titre-bloc">Écarts entre les mesures et le modèle</div>
                <Residus x={x} modele={mL} cx={colonnes[ix]} cy={colonnes[iy]}/></div>}
            </div>
            {mL && <div style={styleBoite}>
              <PanneauResultat modele={mL} cx={colonnes[ix]} cy={colonnes[iy]} avecR2/>
              <div className="gr-lecture">
                <label htmlFor="gr-yech" className="gr-label">Lecture sur le modèle : valeur mesurée de {colonnes[iy].nom}{colonnes[iy].unite ? ` (${colonnes[iy].unite})` : ''}</label>
                <input id="gr-yech" inputMode="decimal" value={libre.yEch} onChange={ev => majLibre(() => ({ yEch: ev.target.value }))} placeholder="ex. 0,536" className="gr-in gr-in-cel"/>
                {lecL && <div className="gr-eq" data-lecture-resultat="1">{colonnes[ix].nom}{NBSP}={NBSP}{ecrireAvecIncertitude(lecL.x0, lecL.u, colonnes[ix].unite)}</div>}
                {libre.yEch && !isFinite(yEch) && <div className="gr-avert">⚠ Ce n’est pas un nombre.</div>}
              </div>
            </div>}
            {mL && <div style={styleBoite}><BandeauHypotheses liste={diagnostics(x, y, mL)}/></div>}
            <div style={styleBoite}>
              <button className="gr-bascule" aria-expanded={ouvert.export} onClick={() => setOuvert(o => ({ ...o, export: !o.export }))}><span>Enregistrer, copier, imprimer</span><span aria-hidden="true">{ouvert.export ? '▲' : '▼'}</span></button>
              {ouvert.export && <div className="gr-export">
                <button onClick={() => telecharger(nomFichier('csv'), '﻿' + versCSV(colonnes, lignes, true), 'text/csv;charset=utf-8')} style={stylePetitBouton(false, '#1a7abf')}>CSV (français : ; et virgule)</button>
                <button onClick={() => telecharger(nomFichier('csv'), versCSV(colonnes, lignes, false), 'text/csv;charset=utf-8')} style={stylePetitBouton(false, '#1a7abf')}>CSV (international : , et point)</button>
                <button onClick={() => { try { navigator.clipboard.writeText(versTexteTableur(colonnes, lignes)); } catch { /* copie impossible */ } }} style={stylePetitBouton(false, '#1a7abf')}>Copier pour un tableur</button>
                <button onClick={() => telechargerPNG(svgRef.current, nomFichier('png'))} style={stylePetitBouton(false, '#1a7abf')}>Image du graphique (PNG)</button>
                <button onClick={() => window.print()} style={stylePetitBouton(false, '#1a7abf')}>Imprimer / PDF</button>
              </div>}
            </div>
          </div>
        </div>
      )}
      <p className="gr-bas">Vos données restent sur cet appareil : rien n’est envoyé sur Internet.</p>
    </div>
  );
}
