import { useState, useRef, useMemo } from "react";
import { cardStyle, useEtatPersistant, styleBouton, stylePetitBouton, styleBoite, LigneMesure, avecIndices } from "../commun";
import {
  lireNombre, ecrire, lectureInverse, ecrireAvecIncertitude, uniteQuotient, diagnostics, testDispersion, analyserTexte,
  versCSV, versTexteTableur, echelle,
} from "./grapheurModele";
import { evaluerColonnes, serieDe, ajuster, NB_PARAMETRES, echelleLog, penteLocale, penteFonction } from "./grapheurCalculs";
import "./Grapheur.css";

// ====================================================
//  GRAPHEUR DE MESURES (page 124 : réservé à l'administrateur pour l'instant, menu « Outils »)
//  Un outil de traitement de mesures pour les lycéens, dans l'esprit de Regressi / LatisPro : tableau de mesures (colonnes saisies ou calculées
//  par une formule) → graphique (réticule, tangente, barres d'incertitude, échelles linéaires ou logarithmiques) → modèle
//  (proportionnel, affine, parabole, exponentielles) avec incertitudes-types, écarts au modèle et hypothèses du calcul.
//  Fonctionne sans réseau, sans compte ; les données restent sur l'appareil. Calculs : grapheurModele.js et grapheurCalculs.js (testés).
// ====================================================

const CLE_OUTIL = 'grapheur-outil-v1';
const NBSP = ' ';
const BLEU = '#1d4ed8', ORANGE = '#d9730d', VERT = '#15803d', GRIS = '#64748b', VIOLET = '#7c3aed';

// Exemples (mesures fictives, bruit réaliste) pour essayer l'outil
const EXEMPLES = {
  beer: { nom: 'Étalonnage au spectrophotomètre (loi de Beer-Lambert)', colonnes: [{ nom: 'C', unite: 'mmol/L' }, { nom: 'A', unite: '' }],
    lignes: [['0,050', '0,112'], ['0,100', '0,218'], ['0,200', '0,447'], ['0,300', '0,655'], ['0,400', '0,884']], modele: 'proportionnel' },
  condo: { nom: 'Décharge d’un condensateur (avec une colonne calculée ln U)', colonnes: [{ nom: 't', unite: 's' }, { nom: 'U', unite: 'V' }, { nom: 'lnU', unite: '', formule: 'ln(U)' }],
    lignes: [['0,0', '6,00'], ['0,5', '3,62'], ['1,0', '2,16'], ['1,5', '1,29'], ['2,0', '0,82'], ['2,5', '0,52'], ['3,0', '0,27'], ['3,5', '0,16'], ['4,0', '0,13']], modele: 'exponentielle' },
  chute: { nom: 'Chute libre (position en fonction du temps)', colonnes: [{ nom: 't', unite: 's' }, { nom: 'z', unite: 'm' }],
    lignes: [['0,1', '0,045'], ['0,2', '0,201'], ['0,3', '0,452'], ['0,4', '0,775'], ['0,5', '1,223'], ['0,6', '1,767']], modele: 'parabole' },
};
const VIDE = { colonnes: [{ nom: 'x', unite: '' }, { nom: 'y', unite: '' }], lignes: Array.from({ length: 6 }, () => ['', '']), modele: 'aucun' };
const MODELES = [['aucun', 'Aucun modèle'], ['proportionnel', 'Proportionnel'], ['affine', 'Affine'], ['parabole', 'Parabole'], ['exponentielle', 'Exponentielle'], ['exponentielle-asymptote', 'Expo. avec asymptote']];

const nomAxe = c => c.unite ? `${c.nom} (${c.unite})` : c.nom;
const SUPER = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '-': '⁻' };
// unité « uy · ux^(−p) » : « m·s⁻² », « s⁻¹ »…
function unitePuissance(uy, ux, p) {
  const sup = n => String(n).split('').map(c => SUPER[c] || c).join('');
  const bas = ux ? (p === 0 ? '' : ux + sup(-p)) : '';
  return [uy, bas].filter(Boolean).join('·');
}

// ── Axes ────────────────────────────────────────────────────────────────────────────────────────
// Un axe : bornes (en unités de position : valeur, ou log10(valeur)), graduations, conversions
function axe(vals, log) {
  const lo0 = Math.min(...vals), hi0 = Math.max(...vals);
  if (log) {
    const l = echelleLog(lo0, hi0);
    return { log: true, lo: l.min, hi: l.max, tr: Math.log10, inv: v => 10 ** v,
      ticks: l.graduations.map(g => ({ pos: Math.log10(g.v), label: g.principale || l.max - l.min <= 1 ? ecrire(g.v, 3) : null })) };
  }
  const e = echelle(lo0, hi0, 5);
  return { log: false, lo: e.min, hi: e.max, tr: v => v, inv: v => v, ticks: e.graduations.map(g => ({ pos: g, label: ecrire(g, 3) })) };
}

// ── Graphique ──────────────────────────────────────────────────────────────────────────────────
const W = 360, H = 270, ML = 58, MR = 12, MT = 14, MB = 52;
function Graphique({ s, cx, cy, modele, logx, logy, outil, ret, tang, lecture, onPoser, svgRef }) {
  const idx = s.x.map((_, i) => i).filter(i => (!logx || s.x[i] > 0) && (!logy || s.y[i] > 0));
  if (idx.length === 0) return <div className="gr-vide">Aucun point à tracer : complétez le tableau{(logx || logy) ? ' (une échelle logarithmique n’accepte que des valeurs positives)' : ''}.</div>;
  const bas = i => (logy && s.y[i] - s.u[i] <= 0 ? s.y[i] : s.y[i] - s.u[i]);
  const ax = axe(idx.map(i => s.x[i]), logx), ay = axe(idx.flatMap(i => [bas(i), s.y[i] + s.u[i]]), logy);
  const px = v => ML + (ax.tr(v) - ax.lo) / (ax.hi - ax.lo) * (W - ML - MR);
  const py = v => H - MB - (ay.tr(v) - ay.lo) / (ay.hi - ay.lo) * (H - MT - MB);
  const borne = v => Math.max(-5000, Math.min(5000, v));
  let trace = '';
  if (modele) {
    let debut = true;
    for (let i = 0; i <= 160; i++) {
      const xv = ax.inv(ax.lo + (ax.hi - ax.lo) * i / 160), yv = modele.f(xv);
      if (!isFinite(yv) || (logy && yv <= 0)) { debut = true; continue; }
      trace += `${debut ? 'M' : 'L'}${px(xv).toFixed(1)} ${borne(py(yv)).toFixed(1)} `; debut = false;
    }
  }
  const cliquer = ev => {
    const el = svgRef.current; if (!el || !outil) return;
    const r = el.getBoundingClientRect(), vx = (ev.clientX - r.left) / r.width * W, vy = (ev.clientY - r.top) / r.height * H;
    if (vx < ML || vx > W - MR || vy < MT || vy > H - MB) return;
    const x = ax.inv(ax.lo + (vx - ML) / (W - ML - MR) * (ax.hi - ax.lo)), y = ay.inv(ay.hi - (vy - MT) / (H - MT - MB) * (ay.hi - ay.lo));
    let proche = idx[0], dmin = Infinity;
    idx.forEach(i => { const d = (px(s.x[i]) - vx) ** 2 + (py(s.y[i]) - vy) ** 2; if (d < dmin) { dmin = d; proche = i; } });
    onPoser({ x, y, i: proche });
  };
  const lecY = lecture && isFinite(lecture.y0) && lecture.y0 >= ay.lo && lecture.y0 <= ay.hi;
  const resume = `Nuage de ${idx.length} points : ${nomAxe(cy)} en fonction de ${nomAxe(cx)}.${modele ? ' Une courbe modèle est tracée.' : ''}`;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resume} className={`gr-svg${outil ? ' gr-svg-actif' : ''}`} xmlns="http://www.w3.org/2000/svg" fontFamily="sans-serif"
      onPointerDown={cliquer} onPointerMove={ev => { if (ev.pointerType === 'mouse' && outil === 'reticule') cliquer(ev); }}>
      <rect x="0" y="0" width={W} height={H} fill="white"/>
      <clipPath id="gr-zone"><rect x={ML} y={MT} width={W - ML - MR} height={H - MT - MB}/></clipPath>
      {ax.ticks.map((g, k) => <g key={`x${k}`}>
        <line x1={px(ax.inv(g.pos))} x2={px(ax.inv(g.pos))} y1={MT} y2={H - MB} stroke={g.label ? '#e2e8f0' : '#f1f5f9'} strokeWidth="1"/>
        {g.label && <text x={px(ax.inv(g.pos))} y={H - MB + 19} fontSize="15" fill="#334155" textAnchor="middle">{g.label}</text>}</g>)}
      {ay.ticks.map((g, k) => <g key={`y${k}`}>
        <line x1={ML} x2={W - MR} y1={py(ay.inv(g.pos))} y2={py(ay.inv(g.pos))} stroke={g.label ? '#e2e8f0' : '#f1f5f9'} strokeWidth="1"/>
        {g.label && <text x={ML - 6} y={py(ay.inv(g.pos)) + 4.5} fontSize="15" fill="#334155" textAnchor="end">{g.label}</text>}</g>)}
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#334155" strokeWidth="1.5"/>
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="#334155" strokeWidth="1.5"/>
      <text x={(ML + W - MR) / 2} y={H - 6} fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">{nomAxe(cx)}{logx ? ' — échelle log' : ''}</text>
      <text transform={`translate(15 ${(MT + H - MB) / 2}) rotate(-90)`} fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">{nomAxe(cy)}{logy ? ' — log' : ''}</text>
      {modele && <path d={trace} fill="none" stroke={ORANGE} strokeWidth="2.5" clipPath="url(#gr-zone)"/>}
      {tang && !logx && !logy && <line x1={px(ax.inv(ax.lo))} y1={borne(py(tang.y0 + tang.pente * (ax.inv(ax.lo) - tang.x0)))} x2={px(ax.inv(ax.hi))} y2={borne(py(tang.y0 + tang.pente * (ax.inv(ax.hi) - tang.x0)))}
        stroke={VIOLET} strokeWidth="2" strokeDasharray="6 4" clipPath="url(#gr-zone)"/>}
      {tang && <circle cx={px(tang.x0)} cy={py(tang.y0)} r="6" fill="none" stroke={VIOLET} strokeWidth="2.5"/>}
      {lecY && <g>
        <line x1={ML} x2={lecture.x0 != null ? px(lecture.x0) : W - MR} y1={py(lecture.y0)} y2={py(lecture.y0)} stroke={VERT} strokeWidth="1.8" strokeDasharray="5 4"/>
        {lecture.x0 != null && isFinite(lecture.x0) && <line x1={px(lecture.x0)} x2={px(lecture.x0)} y1={py(lecture.y0)} y2={H - MB} stroke={VERT} strokeWidth="1.8" strokeDasharray="5 4"/>}
      </g>}
      {ret && ret.x >= ax.inv(ax.lo) && ret.x <= ax.inv(ax.hi) && <g stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3">
        <line x1={px(ret.x)} x2={px(ret.x)} y1={MT} y2={H - MB}/><line x1={ML} x2={W - MR} y1={py(ret.y)} y2={py(ret.y)}/></g>}
      {idx.map(i => <g key={i}>
        {s.u[i] > 0 && <g stroke={BLEU} strokeWidth="1.6">
          <line x1={px(s.x[i])} x2={px(s.x[i])} y1={borne(py(s.y[i] + s.u[i]))} y2={borne(py(bas(i)))}/>
          <line x1={px(s.x[i]) - 4} x2={px(s.x[i]) + 4} y1={borne(py(s.y[i] + s.u[i]))} y2={borne(py(s.y[i] + s.u[i]))}/>
          <line x1={px(s.x[i]) - 4} x2={px(s.x[i]) + 4} y1={borne(py(bas(i)))} y2={borne(py(bas(i)))}/></g>}
        <circle cx={px(s.x[i])} cy={py(s.y[i])} r="5" fill={BLEU} stroke="white" strokeWidth="1.5"/>
        <title>{`${cx.nom} = ${ecrire(s.x[i], 4)} ; ${cy.nom} = ${ecrire(s.y[i], 4)}`}</title></g>)}
    </svg>
  );
}

// Écarts au modèle : un bâton par point, même échelle horizontale que le graphique ; bande ±2·s
function Residus({ s, modele, cx, cy, logx }) {
  const Wr = 360, Hr = 152, ml = 66, mr = 12, mt = 12, mb = 42;
  const idx = s.x.map((_, i) => i).filter(i => !logx || s.x[i] > 0);
  if (!idx.length) return null;
  const ex = axe(idx.map(i => s.x[i]), logx);
  const r = modele.residus;
  const rmax = Math.max(...r.map(Math.abs), 2 * modele.sr, 1e-12) * 1.15;
  const px = v => ml + (ex.tr(v) - ex.lo) / (ex.hi - ex.lo) * (Wr - ml - mr);
  const py = v => mt + (rmax - v) / (2 * rmax) * (Hr - mt - mb);
  return (
    <svg viewBox={`0 0 ${Wr} ${Hr}`} role="img" aria-label={`Écarts entre les mesures de ${cy.nom} et le modèle, en fonction de ${cx.nom}`} className="gr-svg gr-svg-res" xmlns="http://www.w3.org/2000/svg" fontFamily="sans-serif">
      <rect x="0" y="0" width={Wr} height={Hr} fill="white"/>
      <rect x={ml} y={py(2 * modele.sr)} width={Wr - ml - mr} height={py(-2 * modele.sr) - py(2 * modele.sr)} fill="#fef3c7"/>
      <text x={Wr - mr - 4} y={py(2 * modele.sr) + 13} fontSize="14.5" fill="#92400e" textAnchor="end">bande ±2 s</text>
      <line x1={ml} x2={Wr - mr} y1={py(0)} y2={py(0)} stroke="#334155" strokeWidth="1.5"/>
      <line x1={ml} x2={ml} y1={mt} y2={Hr - mb} stroke="#334155" strokeWidth="1.5"/>
      <text x={ml - 6} y={py(0) + 4.5} fontSize="15" fill="#334155" textAnchor="end">0</text>
      <text x={ml - 6} y={mt + 10} fontSize="15" fill="#334155" textAnchor="end">+{ecrire(rmax / 1.15, 2)}</text>
      <text x={ml - 6} y={Hr - mb} fontSize="15" fill="#334155" textAnchor="end">−{ecrire(rmax / 1.15, 2)}</text>
      {ex.ticks.filter(g => g.label).map((g, k) => <text key={k} x={px(ex.inv(g.pos))} y={Hr - mb + 18} fontSize="15" fill="#334155" textAnchor="middle">{g.label}</text>)}
      <text x={(ml + Wr - mr) / 2} y={Hr - 4} fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">{nomAxe(cx)}</text>
      {idx.map(i => <g key={i}>
        <line x1={px(s.x[i])} x2={px(s.x[i])} y1={py(0)} y2={py(r[i])} stroke={ORANGE} strokeWidth="2"/>
        <circle cx={px(s.x[i])} cy={py(r[i])} r="4.5" fill={ORANGE} stroke="white" strokeWidth="1.2"/>
        <title>{`écart = ${ecrire(r[i], 3)}`}</title></g>)}
    </svg>
  );
}

// ── Résultat de l'ajustement ───────────────────────────────────────────────────────────────────
function parametres(id, m, cx, cy) {
  const uy = cy.unite, ux = cx.unite;
  if (id === 'proportionnel') return { eq: `${cy.nom}${NBSP}=${NBSP}k${NBSP}×${NBSP}${cx.nom}`, liste: [{ nom: 'k', val: m.a, u: m.ua, unite: uniteQuotient(uy, ux) }] };
  if (id === 'affine') return { eq: `${cy.nom}${NBSP}=${NBSP}a${NBSP}×${NBSP}${cx.nom}${NBSP}+${NBSP}b`, liste: [{ nom: 'a', val: m.a, u: m.ua, unite: uniteQuotient(uy, ux) }, { nom: 'b', val: m.b, u: m.ub, unite: uy }] };
  if (id === 'parabole') return { eq: `${cy.nom}${NBSP}=${NBSP}a${NBSP}×${NBSP}${cx.nom}²${NBSP}+${NBSP}b${NBSP}×${NBSP}${cx.nom}${NBSP}+${NBSP}c`,
    liste: [{ nom: 'a', val: m.p[0], u: m.u[0], unite: unitePuissance(uy, ux, 2) }, { nom: 'b', val: m.p[1], u: m.u[1], unite: unitePuissance(uy, ux, 1) }, { nom: 'c', val: m.p[2], u: m.u[2], unite: uy }] };
  const tau = { nom: 'τ = 1/|k|', val: m.tau, u: m.utau, unite: ux };
  if (id === 'exponentielle') return { eq: `${cy.nom}${NBSP}=${NBSP}A${NBSP}×${NBSP}exp(k${NBSP}×${NBSP}${cx.nom})`,
    liste: [{ nom: 'A', val: m.A, u: m.uA, unite: uy }, { nom: 'k', val: m.k, u: m.uk, unite: unitePuissance('', ux, 1) }, tau] };
  return { eq: `${cy.nom}${NBSP}=${NBSP}y₀${NBSP}+${NBSP}A${NBSP}×${NBSP}exp(k${NBSP}×${NBSP}${cx.nom})`,
    liste: [{ nom: 'y₀', val: m.y0, u: m.uy0, unite: uy }, { nom: 'A', val: m.A, u: m.uA, unite: uy }, { nom: 'k', val: m.k, u: m.uk, unite: unitePuissance('', ux, 1) }, tau] };
}
function PanneauResultat({ id, modele, cx, cy }) {
  const { eq, liste } = parametres(id, modele, cx, cy);
  return (
    <div className="gr-resultat" data-resultat="1">
      <div className="gr-titre-bloc">Résultat de l’ajustement</div>
      <div className="gr-eq">{eq}</div>
      {liste.map(p => <LigneMesure key={p.nom} nom={p.nom} valeur={ecrireAvecIncertitude(p.val, p.u, p.unite)} couleur={ORANGE}/>)}
      <LigneMesure nom="s (écart-type des écarts)" valeur={`${ecrire(modele.sr, 2)}${cy.unite ? NBSP + cy.unite : ''}`}/>
      {id !== 'proportionnel' && isFinite(modele.r2) && <LigneMesure nom="R²" valeur={ecrire(modele.r2, 5)}/>}
      <div className="gr-note">Les valeurs après « ± » sont des incertitudes-types u. Un R² proche de 1 ne prouve pas que le modèle convient : regardez les écarts.</div>
    </div>
  );
}

// Hypothèses : modèles linéaires → diagnostics testés (grapheurModele) ; autres modèles → liste adaptée
function hypotheses(id, s, m) {
  let L;
  if (id === 'proportionnel' || id === 'affine') L = diagnostics(s.x, s.y, m);
  else {
    L = [{ id: 'independance', statut: 'info', titre: 'Mesures indépendantes', texte: 'Chaque mesure est supposée ne pas dépendre des précédentes. Le grapheur ne peut pas le vérifier.' }];
    if (m.ddl <= 2) L.push({ id: 'points', statut: 'doute', titre: 'Assez de points pour ce modèle', texte: `Il y a ${m.n} points pour ${NB_PARAMETRES[id]} paramètres : seulement ${m.ddl} degré${m.ddl > 1 ? 's' : ''} de liberté. Le modèle passe presque par tous les points, quelle que soit sa pertinence ; les incertitudes sont très peu fiables.` });
    else L.push({ id: 'points', statut: 'ok', titre: 'Assez de points pour ce modèle', texte: `${m.n} points pour ${NB_PARAMETRES[id]} paramètres : ${m.ddl} degrés de liberté.` });
    L.push({ id: 'modele', statut: 'info', titre: 'Le modèle est le bon', texte: 'Le grapheur ne sait pas dire si ce modèle est le bon. Regardez les écarts : un motif régulier (une courbe, des signes qui alternent) trahit un mauvais choix. Le choix doit aussi être justifié par la physique, pas seulement par la valeur de s.' });
    const d = testDispersion(s.x, m.residus);
    L.push(d ? { id: 'dispersion', statut: d.inegale ? 'doute' : 'ok', titre: 'Même dispersion pour tous les points', texte: d.inegale ? `Les écarts semblent plus grands d’un côté de la gamme que de l’autre (rapport ≈ ${ecrire(d.rapport, 2)}). Les incertitudes sont à prendre avec prudence.` : `Les écarts ont des tailles comparables sur toute la gamme (rapport ≈ ${ecrire(d.rapport, 2)}).` }
      : { id: 'dispersion', statut: 'info', titre: 'Même dispersion pour tous les points', texte: 'Avec moins de 6 points, on ne peut pas tester que tous les points sont aussi précis.' });
    L.push({ id: 'abscisse', statut: 'info', titre: 'L’incertitude sur x est négligeable', texte: 'Seules les incertitudes sur y sont prises en compte, ce qui suppose x connu bien plus précisément que y.' });
    if (id !== 'parabole') L.push({ id: 'lineaire', statut: 'info', titre: 'Incertitudes des paramètres : approximation', texte: 'Pour une exponentielle, les incertitudes viennent d’une linéarisation autour de la solution trouvée (comme dans Regressi ou Python/scipy). Elles sont fiables si le modèle est bon et le bruit faible ; sinon, elles sont indicatives.' });
    L.push({ id: 'loi', statut: 'info', titre: 'Les écarts suivent une loi normale', texte: 'Lire « ± » comme « environ 68 % de confiance » suppose des écarts normaux ; avec ' + m.n + ' points, cela reste approximatif.' });
  }
  if (s.u.some(v => v > 0)) {
    L.push({ id: 'ajustement', statut: 'info', titre: 'Barres d’incertitude et ajustement', texte: 'Les barres d’incertitude sont tracées mais n’interviennent pas dans le calcul : l’ajustement donne le même poids à tous les points (moindres carrés ordinaires). Un ajustement pondéré n’est pas encore proposé.' });
    const pairs = m.residus.map((r, i) => [r, s.u[i]]).filter(([, u]) => u > 0);
    const hors = pairs.filter(([r, u]) => Math.abs(r) > 2 * u).length;
    const admis = pairs.length >= 10 ? 1 : 0;
    L.push({ id: 'barres', statut: hors > admis ? 'doute' : 'ok', titre: 'Écarts au modèle compatibles avec les barres',
      texte: hors > admis ? `${hors} point${hors > 1 ? 's' : ''} sur ${pairs.length} s’écarte${hors > 1 ? 'nt' : ''} du modèle de plus de 2 fois son incertitude (seuil de 2 : convention). Soit le modèle ne convient pas, soit les incertitudes sont sous-estimées.`
        : `Les écarts au modèle sont, pour presque tous les points, inférieurs à 2 fois l’incertitude indiquée (seuil de 2 : convention). Si tous les écarts sont bien plus petits que les barres, ces dernières sont peut-être surestimées.` });
  }
  return L;
}

// ── Tableau de données ─────────────────────────────────────────────────────────────────────────
function Tableau({ colonnes, lignes, valeurs, erreurs, editable, onCellule, onEntete, onAjouter, onSupprimer, onAjouterColonne, onSupprimerColonne }) {
  return (
    <div className="gr-tableau-zone">
      <table className="gr-tableau" data-tableau-donnees="1">
        <thead>
          <tr>
            {colonnes.map((c, j) => <th key={j} scope="col">
              {editable
                ? <div className="gr-entete">
                  <div className="gr-entete-l">
                    <input aria-label={`Nom de la colonne ${j + 1}`} value={c.nom} onChange={e => onEntete(j, { nom: e.target.value })} className="gr-in gr-in-nom"/>
                    {colonnes.length > 2 && <button onClick={() => onSupprimerColonne(j)} aria-label={`Supprimer la colonne ${c.nom || j + 1}`} className="gr-sup" title="Supprimer cette colonne">✕</button>}
                  </div>
                  <input aria-label={`Unité de la colonne ${j + 1}`} value={c.unite} placeholder="unité" onChange={e => onEntete(j, { unite: e.target.value })} className="gr-in gr-in-unite"/>
                  {c.formule !== undefined && <input aria-label={`Formule de la colonne ${c.nom || j + 1}`} value={c.formule} placeholder="formule, ex. ln(U)" onChange={e => onEntete(j, { formule: e.target.value })} className={`gr-in gr-in-formule${erreurs[j] ? ' gr-invalide' : ''}`} spellCheck={false}/>}
                  {erreurs[j] && <div className="gr-err-formule" role="alert">{erreurs[j]}</div>}
                </div>
                : <>{avecIndices(c.nom)}{c.unite && <span className="gr-unite"> ({c.unite})</span>}</>}
            </th>)}
            {editable && <th aria-hidden="true" className="gr-th-vide"/>}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => <tr key={i}>
            {colonnes.map((c, j) => <td key={j}>
              {!editable ? l[j]
                : c.formule !== undefined
                  ? <span className="gr-calcule" title="Valeur calculée par la formule">{Number.isFinite(valeurs[j][i]) ? ecrire(valeurs[j][i], 5) : '—'}</span>
                  : <input inputMode="decimal" aria-label={`${c.nom || 'colonne ' + (j + 1)}, ligne ${i + 1}`} value={l[j] ?? ''} onChange={e => onCellule(i, j, e.target.value)}
                    className={`gr-in gr-in-cel${(l[j] ?? '') !== '' && !isFinite(lireNombre(l[j])) ? ' gr-invalide' : ''}`}/>}
            </td>)}
            {editable && <td className="gr-td-sup"><button onClick={() => onSupprimer(i)} aria-label={`Supprimer la ligne ${i + 1}`} className="gr-sup" title="Supprimer cette ligne">✕</button></td>}
          </tr>)}
        </tbody>
      </table>
      {editable && <div className="gr-ligne-btn">
        <button onClick={onAjouter} style={stylePetitBouton(false, '#1a7abf')}>+ Ligne</button>
        <button onClick={() => onAjouterColonne(false)} style={stylePetitBouton(false, '#1a7abf')}>+ Colonne</button>
        <button onClick={() => onAjouterColonne(true)} style={stylePetitBouton(false, VIOLET)} title="Une colonne calculée à partir des autres, par une formule">+ Colonne calculée</button>
      </div>}
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


// ── Comparaison de modèles ─────────────────────────────────────────────────────────────────────
function Comparaison({ s, cy, courant, onChoisir }) {
  const lignes = ['proportionnel', 'affine', 'parabole', 'exponentielle', 'exponentielle-asymptote'].map(id => ({ id, nom: MODELES.find(m => m[0] === id)[1], m: ajuster(id, s.x, s.y) }));
  return (
    <div>
      <div className="gr-titre-bloc">Comparer les modèles sur ces mêmes points</div>
      <div className="gr-tableau-zone">
        <table className="gr-tableau"><thead><tr><th>Modèle</th><th>Paramètres</th><th>s{cy.unite ? ` (${cy.unite})` : ''}</th><th/></tr></thead>
          <tbody>{lignes.map(l => <tr key={l.id} className={l.id === courant ? 'gr-ligne-courante' : ''}>
            <td style={{ textAlign: 'left' }}>{l.nom}</td><td>{NB_PARAMETRES[l.id]}</td><td>{l.m ? ecrire(l.m.sr, 2) : '—'}</td>
            <td>{l.m && l.id !== courant && <button onClick={() => onChoisir(l.id)} style={stylePetitBouton(false, ORANGE)}>Utiliser</button>}</td></tr>)}</tbody></table>
      </div>
      <div className="gr-note">Attention : un modèle avec plus de paramètres colle presque toujours mieux aux points, sans être meilleur. Le choix du modèle se justifie d’abord par la physique (quelle loi attend-on ?), puis par les écarts ; un s plus petit ne suffit pas.</div>
    </div>
  );
}

const PREMIERES_LETTRES = ['x', 'y', 'z', 't', 'u', 'v', 'w', 'p', 'q', 'r', 's', 'a', 'b', 'c'];
const departDe = ex => ({ colonnes: ex.colonnes, lignes: ex.lignes, modele: ex.modele, ix: 0, iy: 1, iu: -1, logx: false, logy: false, yEch: '' });

export function SimulationGrapheur() {
  const [etat, setEtat] = useEtatPersistant(CLE_OUTIL, departDe(EXEMPLES.beer));
  const [outil, setOutil] = useState(null);
  const [retBrut, setRet] = useState(null), [tangBrut, setTang] = useState(null);
  const [onglet, setOnglet] = useState('resultat');
  const [ouvert, setOuvert] = useState({ import: false, export: false, aide: false });
  const svgRef = useRef(null);
  const { colonnes, lignes } = etat;
  const maj = f => setEtat(e => ({ ...e, ...f(e) }));
  const { valeurs, erreurs } = useMemo(() => evaluerColonnes(colonnes, lignes), [colonnes, lignes]);
  const nc = colonnes.length;
  const ix = Math.min(etat.ix, nc - 1), iy = Math.min(etat.iy, nc - 1), iu = etat.iu >= 0 && etat.iu < nc ? etat.iu : -1;
  const s = useMemo(() => serieDe(valeurs, ix, iy, iu), [valeurs, ix, iy, iu]);
  const id = etat.modele;
  const m = useMemo(() => (id === 'aucun' || s.x.length === 0 ? null : ajuster(id, s.x, s.y)), [id, s]);
  const cx = colonnes[ix], cy = colonnes[iy];
  const lineaire = id === 'proportionnel' || id === 'affine';
  const yEch = lireNombre(etat.yEch);
  const lec = m && lineaire && isFinite(yEch) ? lectureInverse(m, yEch) : null;
  // le réticule et la tangente n'ont de sens que pour les axes et le modèle avec lesquels ils ont été posés
  const cle = `${ix}|${iy}|${id}|${!!etat.logx}|${!!etat.logy}`;
  const ret = retBrut && retBrut.cle === cle ? retBrut : null, tang = tangBrut && tangBrut.cle === cle ? tangBrut : null;

  const poser = ({ x, y, i }) => {
    if (outil === 'reticule') setRet({ cle, x, y });
    else if (outil === 'tangente') {
      if (m) { const p = penteFonction(m.f, x, (Math.max(...s.x) - Math.min(...s.x)) * 1e-4); if (p != null) setTang({ cle, x0: x, y0: m.f(x), pente: p, source: 'modèle' }); }
      else { const p = penteLocale(s.x, s.y, i); if (p != null) setTang({ cle, x0: s.x[i], y0: s.y[i], pente: p, source: 'points' }); }
    }
  };
  const choisirOutil = o => { setOutil(prev => (prev === o ? null : o)); setRet(null); setTang(null); };

  const lignesCompletes = lignes.map((_, i) => colonnes.map((_c, j) => (Number.isFinite(valeurs[j][i]) ? String(valeurs[j][i]) : '')));
  const nomFichier = ext => `grapheur-${cy?.nom || 'y'}-${cx?.nom || 'x'}.${ext}`.replace(/[^\w.-]+/g, '_');
  const ajouterColonne = calculee => maj(e => {
    const pris = new Set(e.colonnes.map(c => c.nom));
    const nom = PREMIERES_LETTRES.find(n => !pris.has(n)) || `c${e.colonnes.length + 1}`;
    return { colonnes: [...e.colonnes, calculee ? { nom, unite: '', formule: '' } : { nom, unite: '' }], lignes: e.lignes.map(l => [...l, '']) };
  });
  const supprimerColonne = j => maj(e => ({ colonnes: e.colonnes.filter((_, a) => a !== j), lignes: e.lignes.map(l => l.filter((_, a) => a !== j)), ix: 0, iy: Math.min(1, e.colonnes.length - 2), iu: -1, modele: 'aucun' }));
  const charger = ex => maj(() => departDe(ex));
  const unitePente = uniteQuotient(cy.unite, cx.unite);
  const optionsCol = (avecAucune) => <>{avecAucune && <option value={-1}>aucune</option>}{colonnes.map((c, j) => <option key={j} value={j}>{c.nom || `colonne ${j + 1}`}</option>)}</>;

  return (
    <div className="gr-racine" style={{ ...cardStyle, textAlign: 'left' }}>
      <div className="gr-haut">
        <select aria-label="Charger un exemple" value="" onChange={ev => { const k = ev.target.value; if (k === 'vide') charger(VIDE); else if (EXEMPLES[k]) charger(EXEMPLES[k]); }} className="gr-select">
          <option value="">Charger un exemple…</option>
          {Object.entries(EXEMPLES).map(([k, ex]) => <option key={k} value={k}>{ex.nom}</option>)}
          <option value="vide">Tableau vide</option>
        </select>
        <button className="gr-bascule gr-aide-btn" aria-expanded={ouvert.aide} onClick={() => setOuvert(o => ({ ...o, aide: !o.aide }))}>? Aide</button>
      </div>
      {ouvert.aide && <div className="gr-aide">
        <p><strong>Colonne calculée</strong> : cliquez sur « + Colonne calculée » puis écrivez une formule avec les noms des colonnes situées à sa gauche, par exemple <code>ln(U)</code>, <code>m*g*h</code> ou <code>sqrt(x^2+y^2)</code>.</p>
        <p>Opérations : <code>+ − * / ^</code> et parenthèses. Fonctions : <code>log</code> (décimal), <code>ln</code>, <code>exp</code>, <code>sqrt</code>, <code>abs</code>, <code>sin</code>, <code>cos</code>, <code>tan</code> (en radians), constante <code>pi</code>. La virgule ou le point sont acceptés pour les décimales.</p>
        <p><strong>Graphique</strong> : « Réticule » donne les coordonnées du point touché ; « Tangente » trace la tangente au modèle (ou aux points voisins s’il n’y a pas de modèle). Pour afficher des barres d’incertitude, mettez les incertitudes dans une colonne et choisissez-la sous le tableau.</p>
      </div>}

      <div className="gr-l2">
        <div className="gr-col">
          <div style={styleBoite}>
            <details open className="gr-details-tab">
              <summary className="gr-titre-bloc">Tableau de mesures ({s.x.length} point{s.x.length > 1 ? 's' : ''} exploitable{s.x.length > 1 ? 's' : ''})</summary>
              <Tableau colonnes={colonnes} lignes={lignes} valeurs={valeurs} erreurs={erreurs} editable
                onCellule={(i, j, v) => maj(e => ({ lignes: e.lignes.map((r, a) => (a === i ? r.map((c, b) => (b === j ? v : c)) : r)) }))}
                onEntete={(j, p) => maj(e => ({ colonnes: e.colonnes.map((c, a) => (a === j ? { ...c, ...p } : c)) }))}
                onAjouter={() => maj(e => ({ lignes: [...e.lignes, e.colonnes.map(() => '')] }))}
                onSupprimer={i => maj(e => ({ lignes: e.lignes.filter((_, a) => a !== i) }))}
                onAjouterColonne={ajouterColonne} onSupprimerColonne={supprimerColonne}/>
              {nc > 2 && <div className="gr-choix-axes">
                <label>Abscisse : <select value={ix} onChange={ev => maj(() => ({ ix: Number(ev.target.value) }))}>{optionsCol(false)}</select></label>
                <label>Ordonnée : <select value={iy} onChange={ev => maj(() => ({ iy: Number(ev.target.value) }))}>{optionsCol(false)}</select></label>
                <label>Incertitude sur y : <select value={iu} onChange={ev => maj(() => ({ iu: Number(ev.target.value) }))}>{optionsCol(true)}</select></label>
              </div>}
            </details>
          </div>
          <div style={styleBoite}>
            <button className="gr-bascule" aria-expanded={ouvert.import} onClick={() => setOuvert(o => ({ ...o, import: !o.import }))}><span>Importer ou coller des données</span><span aria-hidden="true">{ouvert.import ? '▲' : '▼'}</span></button>
            {ouvert.import && <Import onUtiliser={lu => maj(() => ({ colonnes: lu.colonnes, lignes: lu.brutes, ix: 0, iy: Math.min(1, lu.colonnes.length - 1), iu: -1, modele: 'aucun', yEch: '', logx: false, logy: false }))}/>}
          </div>
          <div style={styleBoite}>
            <button className="gr-bascule" aria-expanded={ouvert.export} onClick={() => setOuvert(o => ({ ...o, export: !o.export }))}><span>Enregistrer, copier, imprimer</span><span aria-hidden="true">{ouvert.export ? '▲' : '▼'}</span></button>
            {ouvert.export && <div className="gr-export">
              <button onClick={() => telecharger(nomFichier('csv'), '\uFEFF' + versCSV(colonnes, lignesCompletes, true), 'text/csv;charset=utf-8')} style={stylePetitBouton(false, '#1a7abf')}>CSV (français : ; et virgule)</button>
              <button onClick={() => telecharger(nomFichier('csv'), versCSV(colonnes, lignesCompletes, false), 'text/csv;charset=utf-8')} style={stylePetitBouton(false, '#1a7abf')}>CSV (international : , et point)</button>
              <button onClick={() => { try { navigator.clipboard.writeText(versTexteTableur(colonnes, lignesCompletes)); } catch { /* copie impossible */ } }} style={stylePetitBouton(false, '#1a7abf')}>Copier pour un tableur</button>
              <button onClick={() => telechargerPNG(svgRef.current, nomFichier('png'))} style={stylePetitBouton(false, '#1a7abf')}>Image du graphique (PNG)</button>
              <button onClick={() => window.print()} style={stylePetitBouton(false, '#1a7abf')}>Imprimer / PDF</button>
            </div>}
          </div>
        </div>

        <div className="gr-col">
          <div style={styleBoite}>
            <div className="gr-modeles" role="group" aria-label="Choix du modèle">
              {MODELES.map(([k, nom]) => <button key={k} onClick={() => maj(() => ({ modele: k }))} aria-pressed={id === k} style={stylePetitBouton(id === k, ORANGE)}>{nom}</button>)}
            </div>
            {id === 'aucun' && s.x.length > 0 && <div className="gr-note">Regardez d’abord le nuage de points : quelle forme dessinent-ils ? Puis choisissez un modèle, en vous appuyant sur la physique.</div>}
            {id !== 'aucun' && s.x.length > 0 && !m && <div className="gr-avert">⚠ Impossible d’ajuster ce modèle : pas assez de points ({NB_PARAMETRES[id] + 1} au minimum), ou ils ne permettent pas ce calcul (par exemple tous les x sont égaux).</div>}
            <Graphique s={s} cx={cx} cy={cy} modele={m} logx={etat.logx} logy={etat.logy} outil={outil} ret={ret} tang={tang} svgRef={svgRef} onPoser={poser}
              lecture={lec ? { y0: yEch, x0: lec.x0 } : null}/>
            <div className="gr-barre-outils">
              <button onClick={() => choisirOutil('reticule')} aria-pressed={outil === 'reticule'} style={stylePetitBouton(outil === 'reticule', GRIS)}>✛ Réticule</button>
              <button onClick={() => choisirOutil('tangente')} aria-pressed={outil === 'tangente'} style={stylePetitBouton(outil === 'tangente', VIOLET)}>⟋ Tangente</button>
              <label className="gr-case"><input type="checkbox" checked={!!etat.logx} onChange={ev => maj(() => ({ logx: ev.target.checked }))}/> x en log</label>
              <label className="gr-case"><input type="checkbox" checked={!!etat.logy} onChange={ev => maj(() => ({ logy: ev.target.checked }))}/> y en log</label>
            </div>
            {outil === 'reticule' && <div className="gr-lecture-outil" aria-live="polite">{ret
              ? <>{cx.nom}{NBSP}={NBSP}{ecrire(ret.x, 4)}{cx.unite ? NBSP + cx.unite : ''} ; {cy.nom}{NBSP}={NBSP}{ecrire(ret.y, 4)}{cy.unite ? NBSP + cy.unite : ''}{m && isFinite(m.f(ret.x)) && <> ; modèle en {cx.nom}{NBSP}={NBSP}{ecrire(ret.x, 4)} : {ecrire(m.f(ret.x), 4)}{cy.unite ? NBSP + cy.unite : ''}</>}</>
              : 'Touchez ou survolez le graphique pour lire des coordonnées.'}</div>}
            {outil === 'tangente' && <div className="gr-lecture-outil" aria-live="polite">{(etat.logx || etat.logy)
              ? 'La tangente n’est pas tracée en échelle logarithmique : décochez « en log ».'
              : tang ? <>Tangente en {cx.nom}{NBSP}={NBSP}{ecrire(tang.x0, 4)} : pente{NBSP}={NBSP}{ecrire(tang.pente, 4)}{unitePente ? NBSP + unitePente : ''} <span className="gr-note">({tang.source === 'modèle' ? 'dérivée du modèle' : 'calculée avec le point et ses deux voisins'})</span></>
                : `Touchez le graphique${m ? '' : ' près d’un point'} pour tracer la tangente.`}</div>}
          </div>

          {m && <div style={styleBoite}>
            <div className="gr-modeles" role="group" aria-label="Affichage">
              {[['resultat', 'Résultat'], ['ecarts', 'Écarts'], ['hypotheses', 'Hypothèses'], ['comparer', 'Comparer']].map(([k, nom]) =>
                <button key={k} onClick={() => setOnglet(k)} aria-pressed={onglet === k} style={stylePetitBouton(onglet === k, '#1a7abf')}>{nom}</button>)}
            </div>
            {onglet === 'resultat' && <>
              <PanneauResultat id={id} modele={m} cx={cx} cy={cy}/>
              {lineaire && <div className="gr-lecture">
                <label htmlFor="gr-yech" className="gr-label">Lecture sur le modèle : valeur mesurée de {cy.nom}{cy.unite ? ` (${cy.unite})` : ''}</label>
                <input id="gr-yech" inputMode="decimal" value={etat.yEch} onChange={ev => maj(() => ({ yEch: ev.target.value }))} placeholder="ex. 0,536" className="gr-in gr-in-cel"/>
                {lec && <div className="gr-eq" data-lecture-resultat="1">{cx.nom}{NBSP}={NBSP}{ecrireAvecIncertitude(lec.x0, lec.u, cx.unite)}</div>}
                {etat.yEch && !isFinite(yEch) && <div className="gr-avert">⚠ Ce n’est pas un nombre.</div>}
              </div>}
            </>}
            {onglet === 'ecarts' && <>
              <div className="gr-titre-bloc">Écarts entre les mesures et le modèle</div>
              <Residus s={s} modele={m} cx={cx} cy={cy} logx={etat.logx}/></>}
            {onglet === 'hypotheses' && <BandeauHypotheses liste={hypotheses(id, s, m)}/>}
            {onglet === 'comparer' && <Comparaison s={s} cy={cy} courant={id} onChoisir={k => maj(() => ({ modele: k }))}/>}
          </div>}
        </div>
      </div>
      <p className="gr-bas">Vos données restent sur cet appareil : rien n’est envoyé sur Internet.</p>
    </div>
  );
}
