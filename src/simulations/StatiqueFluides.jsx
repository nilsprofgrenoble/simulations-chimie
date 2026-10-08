import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, fmt, lireNombre, proche } from "../commun";
import { polyReg, evalPoly } from "./QuantumCAN";

// ====================================================
//  SIM 26 — STATIQUE DES FLUIDES : P = f(h) ET HAUTEUR D'EAU D'UN RÉCIPIENT INCONNU
// ====================================================

// ── Modèle (fonctions pures) ──
// Statique des fluides : pression absolue à la profondeur h : P = Patm + ρ g h.
// Hypothèses : liquide incompressible, de masse volumique uniforme ; g = 9,81 m/s² ; température constante.
const G = 9.81;
const FLUIDES = {
  eau:   { nom: 'Eau', rho: 1000 },
  sel:   { nom: 'Eau saturée en sel (NaCl)', rho: 1200 },
  huile: { nom: 'Huile végétale', rho: 920 },
};
const HEAU_CM = 40;   // hauteur d'eau dans l'éprouvette : profondeur maximale de l'embout
const HC_CM = 60;     // hauteur du récipient inconnu
const H_GUIDE = 0.37; // hauteur d'eau (m) du récipient inconnu dans le parcours guidé

// Pression absolue (Pa) à la profondeur d (m) sous la surface libre
const pressionPa = (patmHpa, rho, d) => patmHpa * 100 + rho * G * Math.max(0, d);
// Le manomètre affiche la pression absolue en hPa, avec une résolution de 1 hPa
const affichage = pa => Math.round(pa / 100);

export function SimulationStatiqueFluides({ plotlyReady }) {
  const [mode, setMode] = useState('explore');                  // on arrive sur l'exploration libre
  const [guide, setGuide] = useEtatPersistant('fluides-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [fluide, setFluide] = useState('eau');
  const [patm, setPatm] = useState(1013);
  const [hCm, setHCm] = useState(0);                           // profondeur de l'embout dans l'éprouvette
  const [mesures, setMesures] = useState([]);                  // [{ h (cm), p (hPa) }]
  const [modele, setModele] = useState(0);                     // 0 : aucun, 1 : linéaire, 2 : ordre 2
  const [zCm, setZCm] = useState(0);                           // position de l'embout dans le récipient inconnu (sous le bord)
  const [Hinc, setHinc] = useState(H_GUIDE);                   // hauteur d'eau du récipient inconnu (m)
  const [revele, setRevele] = useState(false);
  const plotRef = useRef(null);
  const enGuide = mode === 'guide';
  const rho = FLUIDES[fluide].rho;

  // Lecture du manomètre dans l'éprouvette, puis dans le récipient inconnu
  const lecture = h => affichage(pressionPa(patm, rho, h / 100));
  const pLue = lecture(hCm);
  const profondeurInc = zCm / 100 - (HC_CM / 100 - Hinc);      // profondeur de l'embout sous la surface libre (m)
  const pLueInc = affichage(pressionPa(patm, rho, profondeurInc));

  // Régression sur les mesures : P (Pa) en fonction de h (m)
  const ordre = modele || 1;
  const fit = useMemo(() => {
    if (mesures.length < ordre + 2) return null;
    const xs = mesures.map(m => m.h / 100), ys = mesures.map(m => m.p * 100);
    const r = polyReg(xs, ys, ordre);
    return r.coeffs.every(isFinite) ? r : null;
  }, [mesures, ordre]);
  const fit1 = useMemo(() => {
    if (mesures.length < 3) return null;
    const r = polyReg(mesures.map(m => m.h / 100), mesures.map(m => m.p * 100), 1);
    return r.coeffs.every(isFinite) ? r : null;
  }, [mesures]);
  const a1 = fit1 ? fit1.coeffs[1] : NaN, b1 = fit1 ? fit1.coeffs[0] : NaN;
  const profEstimee = fit1 && pLueInc * 100 > b1 ? (pLueInc * 100 - b1) / a1 * 100 : null;   // cm, par la droite d'étalonnage

  function releverPoint() {
    setMesures(ms => [...ms.filter(m => m.h !== hCm), { h: hCm, p: pLue }].sort((u, v) => u.h - v.h));
  }
  function mesuresAuto() {
    setMesures(Array.from({ length: 10 }, (_, i) => ({ h: i * 3, p: lecture(i * 3) })));
  }

  // ── Graphique P = f(h) ──
  useEffect(() => {
    if (!window.Plotly || !plotRef.current || !plotlyReady) return;
    const traces = [{ x: mesures.map(m => m.h / 100), y: mesures.map(m => m.p * 100), mode: 'markers', name: 'mesures',
      marker: { color: '#0369a1', size: 9, line: { color: 'white', width: 1.5 } },
      hovertemplate: 'h = %{x:.3f} m<br>P = %{y:.0f} Pa<extra></extra>' }];
    if (modele && fit) {
      const xs = Array.from({ length: 41 }, (_, i) => i * HEAU_CM / 100 / 40);
      traces.push({ x: xs, y: xs.map(x => evalPoly(fit.coeffs, x)), mode: 'lines', name: modele === 1 ? 'modèle linéaire' : 'modèle d’ordre 2',
        line: { color: '#e76f51', width: 2.5 }, hoverinfo: 'skip' });
    }
    window.Plotly.react(plotRef.current, traces, {
      xaxis: { title: 'Profondeur h (m)', range: [-0.01, 0.42], dtick: 0.05, gridcolor: 'rgba(0,0,0,0.08)', zeroline: false,
        showspikes: true, spikemode: 'across', spikesnap: 'cursor', spikethickness: 1, spikedash: 'dot', spikecolor: '#64748b' },
      yaxis: { title: 'Pression absolue P (Pa)', gridcolor: 'rgba(0,0,0,0.08)', zeroline: false, exponentformat: 'none', separatethousands: true,
        showspikes: true, spikemode: 'across', spikesnap: 'cursor', spikethickness: 1, spikedash: 'dot', spikecolor: '#64748b' },
      margin: { t: 14, b: 50, l: 80, r: 14 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#fafcff',
      legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(255,255,255,0.8)' }, showlegend: true, hovermode: 'closest', autosize: true,
    }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, mode, mesures, modele, fit]); // eslint-disable-line

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const eauRef = fluide === 'eau' && patm === 1013;
  const P0 = affichage(pressionPa(1013, 1000, 0)), P15 = affichage(pressionPa(1013, 1000, 0.15));
  const PincGuide = affichage(pressionPa(1013, 1000, H_GUIDE));
  const HfitGuide = fit1 && modele === 1 ? (PincGuide * 100 - b1) / a1 * 100 : NaN;
  const ETAPES = [
    { id: 'objectif', titre: 'Que cherche-t-on ?', focus: ['manip'],
      texte: <>On plonge l'embout d'un <strong>manomètre</strong> dans une éprouvette d'eau, à des profondeurs h croissantes, pour établir la relation entre la <strong>pression</strong> de l'eau et la <strong>profondeur</strong>. Le manomètre indique la pression <strong>absolue</strong>.</>,
      tache: { type: 'qcm', q: 'Quelle pression indique le manomètre quand l’embout est à la surface de l’eau (h = 0) ?', options: ['La pression atmosphérique', '0 Pa', 'La pression due à l’eau seule'], bonne: 0,
        expl: 'À la surface, il n’y a pas encore d’eau au-dessus de l’embout : seule l’atmosphère pèse. Une pression absolue ne vaut zéro que dans le vide.' } },
    { id: 'patm', titre: 'Relever la pression atmosphérique', focus: ['manip'],
      texte: <>Réglez la profondeur de l'embout à <strong>h = 0</strong> (à la surface) et lisez la pression indiquée par le manomètre.</>,
      tache: { type: 'num', q: 'Pression atmosphérique indiquée', unite: 'hPa', vrai: P0, tol: 0.001, affiche: x => fmt(x, 0),
        bloque: !(eauRef && hCm === 0) ? 'Réglez h = 0 cm (eau, Patm = 1013 hPa).' : null,
        expl: `Patm = ${P0} hPa.` } },
    { id: 'unites', titre: 'Attention aux unités', focus: ['manip'],
      texte: <>Le manomètre donne des hectopascals, mais le Pascal est l'unité du Système international : 1 hPa = 100 Pa.</>,
      tache: { type: 'num', q: 'Pression atmosphérique en pascals', unite: 'Pa', vrai: P0 * 100, tol: 0.001, affiche: x => fmt(x, 0),
        expl: `${P0} hPa = ${P0} × 100 = ${fmt(P0 * 100, 0)} Pa. Pour le graphique, on utilisera P en Pa et h en m.` } },
    { id: 'plonger', titre: 'Plonger l’embout', focus: ['manip'],
      texte: <>Plongez l'embout à <strong>h = 15 cm</strong> sous la surface et observez le manomètre.</>,
      tache: { type: 'action', ok: hCm === 15, label: 'Plonger à h = 15 cm', faire: () => setHCm(15), consigne: hCm === 15 ? null : `Profondeur : ${hCm} cm → 15 cm` } },
    { id: 'delta', titre: 'L’effet de l’eau', focus: ['manip'],
      texte: <>La pression a augmenté par rapport à la surface : c'est l'effet de l'eau située au-dessus de l'embout.</>,
      tache: { type: 'num', q: 'Augmentation de pression entre h = 0 et h = 15 cm', unite: 'Pa', vrai: (P15 - P0) * 100, tol: 0.01, affiche: x => fmt(x, 0),
        bloque: !(eauRef && hCm === 15) ? 'Gardez l’eau, Patm = 1013 hPa, et h = 15 cm.' : null,
        expl: `${P15} − ${P0} = ${P15 - P0} hPa, soit ${fmt((P15 - P0) * 100, 0)} Pa. Environ 1 hPa par centimètre d'eau.` } },
    { id: 'mesures', titre: 'Faire une série de mesures', focus: ['manip', 'mesures'],
      texte: <>Dans le TP, on relève environ une dizaine de mesures de la pression en fonction de la profondeur (par exemple tous les 3 cm). Ici, la série est faite automatiquement. Remarquez que l'affichage du manomètre est arrondi à 1 hPa.</>,
      tache: { type: 'action', ok: mesures.length >= 8 && eauRef, label: 'Relever 10 mesures (tous les 3 cm)', faire: () => mesuresAuto(),
        consigne: mesures.length >= 8 ? null : 'Cliquez pour relever la série de mesures' } },
    { id: 'allure', titre: 'Tracer P = f(h)', focus: ['courbe'],
      texte: <>Le graphique donne la pression absolue P (en Pa) en fonction de la profondeur h (en m).</>,
      tache: { type: 'qcm', q: 'Comment se placent les points ?', options: ['Alignés sur une droite qui ne passe pas par l’origine', 'Alignés sur une droite qui passe par l’origine', 'Sur une courbe qui s’aplatit'], bonne: 0,
        expl: 'P augmente proportionnellement à h (relation affine), mais pas de zéro : à h = 0, P vaut la pression atmosphérique.' } },
    { id: 'modele', titre: 'Choisir un modèle', focus: ['courbe'],
      texte: <>Choisissez le modèle le plus pertinent. Vous pouvez comparer le modèle linéaire (P = a·h + b) et le modèle d'ordre 2 : le second ne s'améliore guère et ajoute un terme inutile.</>,
      tache: { type: 'action', ok: modele === 1, label: 'Choisir le modèle linéaire', faire: () => setModele(1), consigne: modele === 1 ? null : 'Choisissez « Linéaire » sous le graphique' } },
    { id: 'pente', titre: 'Interpréter la pente', focus: ['courbe'],
      texte: <>Le modèle est de la forme P = a·h + b. Comparez avec la loi de la statique des fluides : P = Patm + ρ·g·h.</>,
      tache: { type: 'qcm', q: 'Que représente la pente a de la droite ?', options: ['ρ × g (masse volumique × intensité de la pesanteur)', 'La pression atmosphérique', 'La profondeur maximale'], bonne: 0,
        expl: 'En identifiant P = a·h + b et P = Patm + ρ·g·h : a = ρ·g (en Pa/m) et b = Patm.' } },
    { id: 'rho', titre: 'Masse volumique du liquide', focus: ['courbe'],
      texte: <>Avec g = 9,81 m/s², déduisez la masse volumique ρ = a / g à partir de la pente de votre droite.</>,
      tache: { type: 'num', q: 'Masse volumique ρ du liquide', unite: 'kg/m³', vrai: a1 / G, tol: 0.02, affiche: x => fmt(x, 0),
        bloque: !(modele === 1 && fit1) ? 'Affichez le modèle linéaire (étape précédente).' : null,
        expl: `ρ = ${fmt(a1, 0)} / 9,81 ≈ ${fmt(a1 / G, 0)} kg/m³ : on retrouve la masse volumique de l'eau (1 000 kg/m³), à l'arrondi du manomètre près.` } },
    { id: 'ordonnee', titre: 'Ordonnée à l’origine', focus: ['courbe'],
      texte: <>Comparez l'ordonnée à l'origine b du modèle avec la valeur lue au tout début.</>,
      tache: { type: 'qcm', q: 'Que représente l’ordonnée à l’origine b ?', options: ['La pression atmosphérique (pression à h = 0)', 'La pression au fond de l’éprouvette', 'La masse volumique de l’eau'], bonne: 0,
        expl: `b ≈ ${fmt(b1, 0)} Pa, soit ${fmt(b1 / 100, 0)} hPa : c'est la pression atmosphérique relevée à l'étape 2.` } },
    { id: 'inconnu', titre: 'Un récipient inconnu', focus: ['cuve'],
      texte: <>Voici un récipient <strong>opaque</strong> contenant de l'eau. On ne voit pas le niveau H de l'eau, mais on peut y descendre l'embout du manomètre (maintenant étalonné). Où faut-il le placer pour en déduire H ?</>,
      tache: { type: 'qcm', q: 'Où placer l’embout du manomètre ?', options: ['Au fond du récipient : sa profondeur sous la surface est alors égale à H', 'À la surface, au niveau du bord supérieur', 'À mi-hauteur du récipient'], bonne: 0,
        expl: 'Au fond, la profondeur de l’embout sous la surface libre est exactement la hauteur d’eau H. Au bord supérieur, on lit seulement Patm. À mi-hauteur, on ne connaît pas la profondeur sous la surface.' } },
    { id: 'placer', titre: 'Placer le manomètre', focus: ['cuve'],
      texte: <>Descendez l'embout jusqu'au fond du récipient.</>,
      tache: { type: 'action', ok: zCm === HC_CM, label: 'Placer l’embout au fond', faire: () => setZCm(HC_CM), consigne: zCm === HC_CM ? null : 'Descendez l’embout jusqu’au fond' } },
    { id: 'lireP', titre: 'Lire la pression', focus: ['cuve'],
      texte: <>Lisez la pression indiquée par le manomètre, embout au fond du récipient.</>,
      tache: { type: 'num', q: 'Pression lue au fond', unite: 'hPa', vrai: PincGuide, tol: 0.001, affiche: x => fmt(x, 0),
        bloque: !(zCm === HC_CM && eauRef && Hinc === H_GUIDE) ? 'Placez l’embout au fond du récipient (eau, Patm = 1013 hPa).' : null,
        expl: `${PincGuide} hPa : bien plus que la pression atmosphérique, donc l'embout est sous l'eau.` } },
    { id: 'H', titre: 'En déduire la hauteur d’eau', focus: ['cuve', 'courbe'],
      texte: <>Avec votre modèle linéaire P = a·h + b, calculez la profondeur h qui correspond à la pression lue : h = (P − b) / a. Attention aux unités (P en Pa, h en m). Donnez H en centimètres.</>,
      tache: { type: 'num', q: 'Hauteur d’eau H dans le récipient', unite: 'cm', vrai: HfitGuide, tol: 0.03, affiche: x => fmt(x, 0),
        bloque: !(modele === 1 && fit1 && zCm === HC_CM) ? 'Gardez le modèle linéaire et l’embout au fond.' : null,
        expl: `h = (${fmt(PincGuide * 100, 0)} − ${fmt(b1, 0)}) / ${fmt(a1, 0)} ≈ ${fmt(HfitGuide, 1)} cm. Le niveau réel (${fmt(H_GUIDE * 100, 0)} cm) est maintenant révélé sur le schéma : l'écart vient surtout de l'arrondi du manomètre à 1 hPa, soit environ 1 cm d'eau.` } },
    { id: 'hypotheses', titre: 'Sur quoi repose ce modèle ?', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse est faite sur le liquide ?', options: ['Il est incompressible : sa masse volumique est la même à toutes les profondeurs', 'Sa température change avec la profondeur', 'Il est en écoulement vers le fond'], bonne: 0,
        expl: 'Sans cette hypothèse, la pression ne serait plus proportionnelle à la profondeur. Pour un liquide sur quelques dizaines de centimètres, elle est très bien vérifiée.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez établi la loi de la statique des fluides à partir de mesures, identifié la pente (ρ·g) et l'ordonnée à l'origine (Patm), puis utilisé le modèle pour trouver la hauteur d'eau d'un récipient opaque. En exploration libre, changez de liquide : que deviennent la pente et l'ordonnée à l'origine ?</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const passe = id => !enGuide || etape > idx(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const Hfait = enGuide && (passe('H') || !!guide.verifs[idx('H')]);
  const niveauVisible = revele || Hfait;
  const estimationVisible = !enGuide || Hfait;

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    setDefi({ fluide: tire(['eau', 'sel', 'huile']), patm: tire([1000, 1004, 1008, 1013, 1017, 1021, 1025]), H: tire([22, 27, 31, 36, 42, 47]), reps: {}, verifie: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') { setFluide('eau'); setPatm(1013); setHCm(0); setMesures([]); setModele(0); setZCm(0); setHinc(H_GUIDE); setRevele(false); }
  }
  const voletDefi = defi && (() => {
    const rh = FLUIDES[defi.fluide].rho, H = defi.H / 100;
    const L = d => affichage(pressionPa(defi.patm, rh, d));
    const hs = [0, 10, 20, 30, 40], Pf = L(H);
    const Q = [
      { id: 'p0', q: 'Pression atmosphérique (pression à h = 0)', unite: 'hPa', vrai: L(0), tol: 0.001, aff: fmt(L(0), 0) },
      { id: 'a', q: 'Pente a de la droite P = f(h)', unite: 'Pa/m', vrai: rh * G, tol: 0.04, aff: `${fmt(rh * G, 0)} (±4 %)` },
      { id: 'rho', q: 'Masse volumique ρ du liquide', unite: 'kg/m³', vrai: rh, tol: 0.05, aff: `${fmt(rh, 0)} (±5 %)` },
      { id: 'H', q: `Un manomètre posé au fond d’un récipient contenant ce liquide indique ${Pf} hPa. Hauteur de liquide H ?`, unite: 'cm', vrai: defi.H, tol: 2 / defi.H, aff: `${fmt(defi.H, 0)} (±2 cm)` },
      { id: 'pr', q: 'Pression que l’on lirait à 25 cm de profondeur', unite: 'hPa', vrai: defi.patm + rh * G * 0.25 / 100, tol: 0.002, aff: fmt(defi.patm + rh * G * 0.25 / 100, 1) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          On étalonne un manomètre dans une éprouvette contenant un <strong>liquide inconnu</strong> : pression lue (en hPa) pour cinq profondeurs.
          <table style={{ borderCollapse: 'collapse', margin: '8px 0', fontSize: 13.5, fontFamily: 'monospace' }}>
            <thead><tr><th style={{ padding: '3px 10px', borderBottom: `1px solid ${KIT.bord}` }}>h (cm)</th>{hs.map(h => <th key={h} style={{ padding: '3px 10px', borderBottom: `1px solid ${KIT.bord}` }}>{h}</th>)}</tr></thead>
            <tbody><tr><td style={{ padding: '3px 10px', fontWeight: 700 }}>P (hPa)</td>{hs.map(h => <td key={h} style={{ padding: '3px 10px', textAlign: 'center' }}>{L(h / 100)}</td>)}</tr></tbody>
          </table>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappels : P = Patm + ρ·g·h ; g = 9,81 m/s² ; 1 hPa = 100 Pa.</div>
          <button onClick={() => { setFluide(defi.fluide); setPatm(defi.patm); setMesures([]); setModele(0); setHCm(0); setHinc(defi.H / 100); setZCm(0); setRevele(false); setMode('explore'); }}
            style={{ ...stylePetitBouton(false, '#334155'), marginTop: 6 }}>🔍 Reproduire cette expérience dans l’exploration</button>
        </div>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(qu.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff} {qu.unite}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
        </div>
      </div>
    );
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Liquide au repos et incompressible</strong> : sa masse volumique ρ est la même à toutes les profondeurs (eau : 1 000 kg/m³, valeur arrondie ; environ 998 kg/m³ à 20 °C), sa température est uniforme et constante.</li>
      <li><strong>Loi de la statique des fluides</strong> : P = Patm + ρ·g·h, avec g = 9,81 m/s² uniforme. La pression atmosphérique agit sur toute la surface libre et reste constante pendant la manip (sa variation sur 60 cm de hauteur est négligée).</li>
      <li><strong>Manomètre</strong> : il mesure la pression absolue à l'embout, sans défaut de justesse, et l'affichage est arrondi à 1 hPa (soit environ 1 cm d'eau). L'air emprisonné dans l'embout, la tension superficielle et le temps de réponse sont ignorés.</li>
      <li><strong>Profondeur</strong> : h est mesurée de la surface libre jusqu'à l'ouverture de l'embout, et connue exactement.</li>
      <li><strong>Récipient inconnu</strong> : la hauteur d'eau H se déduit de la pression lue embout au fond, par l'étalonnage fait dans l'éprouvette (même liquide, même Patm, même température).</li>
    </ul>
  );
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );

  // ── Schémas ──
  const Manometre = ({ valeur, x = 8, y = 14 }) => (
    <g>
      <rect x={x} y={y} width="112" height="76" rx="8" fill="#1e293b"/>
      <rect x={x + 8} y={y + 8} width="96" height="38" rx="4" fill="#bbf7d0"/>
      <text x={x + 14} y={y + 35} textAnchor="start" fontSize="24" fontFamily="monospace" fontWeight="700" fill="#064e3b">{valeur}</text>
      <text x={x + 100} y={y + 40} textAnchor="end" fontSize="9" fill="#064e3b">hPa</text>
      <text x={x + 56} y={y + 66} textAnchor="middle" fontSize="10" fill="#cbd5e1">manomètre</text>
    </g>
  );
  const PX = 7;                                          // éprouvette : 7 px par cm
  const yEau = 100, yTip = yEau + hCm * PX;
  const schemaEprouvette = (
    <svg viewBox="0 0 330 400" style={{ width: '100%', maxWidth: 330, display: 'block' }} role="img" aria-label="Éprouvette d'eau et embout du manomètre">
      <rect x="166" y={yEau} width="68" height={380 - yEau} fill="rgba(56,189,248,0.35)"/>
      <path d="M165,65 V380 H235 V65" fill="none" stroke="#475569" strokeWidth="2.5"/>
      <line x1="165" y1={yEau} x2="235" y2={yEau} stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,3"/>
      <text x="170" y={yEau + 13} fontSize="9.5" fill="#0284c7">surface</text>
      {/* règle des profondeurs */}
      {Array.from({ length: 9 }, (_, i) => i * 5).map(d => (
        <g key={d}>
          <line x1="236" y1={yEau + d * PX} x2={d % 10 === 0 ? 248 : 243} y2={yEau + d * PX} stroke="#64748b" strokeWidth="1"/>
          {d % 10 === 0 && <text x="252" y={yEau + d * PX + 4} fontSize="11" fill="#334155">{d}</text>}
        </g>
      ))}
      <text x="290" y="96" fontSize="11" fill="#334155" textAnchor="middle">h (cm)</text>
      {/* tube de la sonde */}
      <path d={`M120,${52} H200 V${yTip}`} fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round"/>
      <circle cx="200" cy={yTip} r="5.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5"/>
      {hCm > 0 && <>
        <line x1="200" y1={yTip} x2="250" y2={yTip} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3,2"/>
        <text x="262" y={yTip + 15} fontSize="12" fontWeight="700" fill="#b45309">{fmt(hCm, 1)} cm</text>
      </>}
      <Manometre valeur={pLue}/>
    </svg>
  );
  const PXC = 5, yRim = 60, yFond = yRim + HC_CM * PXC, yTipC = yRim + zCm * PXC;
  const yNiveau = yFond - Hinc * 100 * PXC;
  const schemaCuve = (
    <svg viewBox="0 0 330 400" style={{ width: '100%', maxWidth: 330, display: 'block' }} role="img" aria-label="Récipient opaque et embout du manomètre">
      <rect x="150" y={yRim} width="100" height={yFond - yRim} fill={niveauVisible ? '#f8fafc' : '#cbd5e1'}/>
      {niveauVisible && <>
        <rect x="150" y={yNiveau} width="100" height={yFond - yNiveau} fill="rgba(56,189,248,0.35)"/>
        <line x1="150" y1={yNiveau} x2="250" y2={yNiveau} stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,3"/>
        <text x="200" y={yNiveau - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0284c7">H = {fmt(Hinc * 100, 0)} cm</text>
      </>}
      {!niveauVisible && <text x="200" y={(yRim + yFond) / 2} textAnchor="middle" fontSize="38" fontWeight="700" fill="#94a3b8">?</text>}
      <path d={`M149,${yRim - 8} V${yFond} H251 V${yRim - 8}`} fill="none" stroke="#475569" strokeWidth="2.5"/>
      <text x="200" y={yFond + 18} textAnchor="middle" fontSize="10.5" fill="#475569">récipient opaque</text>
      {Array.from({ length: 7 }, (_, i) => i * 10).map(z => (
        <g key={z}>
          <line x1="252" y1={yRim + z * PXC} x2="262" y2={yRim + z * PXC} stroke="#64748b" strokeWidth="1"/>
          <text x="266" y={yRim + z * PXC + 4} fontSize="10.5" fill="#334155">{z}</text>
        </g>
      ))}
      <text x="296" y={yRim - 28} fontSize="10.5" fill="#334155" textAnchor="middle">z (cm)</text>
      <text x="296" y={yRim - 17} fontSize="9" fill="#64748b" textAnchor="middle">sous le bord</text>
      <path d={`M120,52 H200 V${yTipC}`} fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round"/>
      <circle cx="200" cy={yTipC} r="5.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5"/>
      <Manometre valeur={pLueInc}/>
    </svg>
  );

  const TXT = KIT.txt, TXT2 = '#475569';
  const inp = { fontSize: 13, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, background: 'white', color: TXT, width: 80 };
  const lab = { fontSize: 12, color: TXT2, fontWeight: 600 };
  const equation = fit && modele ? (modele === 1
    ? <>P = <strong>{fmt(fit.coeffs[1], 0)}</strong> × h + <strong>{fmt(fit.coeffs[0], 0)}</strong></>
    : <>P = {fmt(fit.coeffs[2], 0)} × h² + {fmt(fit.coeffs[1], 0)} × h + {fmt(fit.coeffs[0], 0)}</>) : null;

  const exploration = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── MANIP : ÉPROUVETTE ET MANOMÈTRE ── */}
      <div style={{ ...styleBoite, ...cadre('manip') }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 8 }}>Manip : pression en fonction de la profondeur</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 250px', maxWidth: 330 }}>{schemaEprouvette}</div>
          <div style={{ flex: '1 1 230px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={lab}>Profondeur de l'embout h : <strong style={{ color: '#b45309' }}>{fmt(hCm, 1)} cm</strong></span>
              <input type="range" min="0" max={HEAU_CM} step="0.5" value={hCm} onChange={e => setHCm(parseFloat(e.target.value))}
                aria-label="Profondeur de l'embout" style={{ accentColor: '#f59e0b', width: '100%' }}/>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={releverPoint} style={stylePetitBouton(true, '#0369a1')}>📌 Relever le point</button>
              <button onClick={mesuresAuto} style={stylePetitBouton(false, '#0369a1')}>⚡ 10 mesures (tous les 3 cm)</button>
              <button onClick={() => { setMesures([]); setModele(0); }} style={stylePetitBouton(false, '#64748b')}>🗑 Effacer</button>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={lab}>Liquide</span>
                <select value={fluide} onChange={e => { setFluide(e.target.value); setMesures([]); setModele(0); }} style={{ ...inp, width: 'auto' }} aria-label="Liquide">
                  {Object.entries(FLUIDES).map(([k, f]) => <option key={k} value={k}>{f.nom}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={lab}>Patm du jour (hPa)</span>
                <input type="number" min="950" max="1060" step="1" value={patm}
                  onChange={e => { setPatm(Math.max(950, Math.min(1060, Math.round(parseFloat(e.target.value) || 1013)))); setMesures([]); setModele(0); }} style={inp}/>
              </label>
            </div>
            <div style={{ fontSize: 12.5, color: TXT2, lineHeight: 1.5 }}>Le manomètre affiche la pression <em>absolue</em>, arrondie à 1 hPa.</div>
          </div>
        </div>
      </div>

      {/* ── MESURES + COURBE ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ ...styleBoite, flex: '0 1 260px', ...cadre('mesures') }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 }}>Mesures</div>
          {mesures.length === 0 ? <div style={{ fontSize: 13, color: TXT2 }}>Aucune mesure : plongez l'embout puis « Relever le point ».</div> : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'monospace' }}>
                <thead><tr style={{ color: TXT2 }}>
                  <th style={{ padding: '3px 4px', textAlign: 'right' }}>h (cm)</th><th style={{ padding: '3px 4px', textAlign: 'right' }}>P (hPa)</th>
                  <th style={{ padding: '3px 4px', textAlign: 'right' }}>h (m)</th><th style={{ padding: '3px 4px', textAlign: 'right' }}>P (Pa)</th></tr></thead>
                <tbody>{mesures.map(m => (
                  <tr key={m.h} style={{ borderTop: `1px dashed ${KIT.bord}` }}>
                    <td style={{ padding: '3px 4px', textAlign: 'right' }}>{fmt(m.h, 1)}</td><td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 700 }}>{m.p}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right' }}>{fmt(m.h / 100, 3)}</td><td style={{ padding: '3px 4px', textAlign: 'right' }}>{m.p * 100}</td></tr>))}</tbody>
              </table>
            </div>)}
        </div>
        <div style={{ ...styleBoite, flex: '1 1 340px', minWidth: 0, ...cadre('courbe') }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 4 }}>Pression absolue en fonction de la profondeur</div>
          <div ref={plotRef} style={{ width: '100%', height: 320 }}/>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
            <span style={lab}>Modèle :</span>
            <button onClick={() => setModele(modele === 1 ? 0 : 1)} disabled={!fit1} style={{ ...stylePetitBouton(modele === 1, '#e76f51'), opacity: fit1 ? 1 : 0.5 }}>Linéaire</button>
            <button onClick={() => setModele(modele === 2 ? 0 : 2)} disabled={mesures.length < 4} style={{ ...stylePetitBouton(modele === 2, '#e76f51'), opacity: mesures.length >= 4 ? 1 : 0.5 }}>Ordre 2</button>
            {!fit1 && <span style={{ fontSize: 12, color: TXT2 }}>(au moins 3 mesures)</span>}
          </div>
          {equation && (
            <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
              {equation} <span style={{ color: TXT2, fontFamily: 'sans-serif', fontSize: 12 }}>(P en Pa, h en m)</span>
              <div style={{ color: '#b45309', fontWeight: 700 }}>R² = {fit.r2.toFixed(5)}</div>
            </div>)}
        </div>
      </div>

      {/* ── RÉCIPIENT INCONNU ── */}
      <div style={{ ...styleBoite, ...cadre('cuve') }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 8 }}>Récipient inconnu : quelle est la hauteur d'eau ?</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 250px', maxWidth: 330 }}>{schemaCuve}</div>
          <div style={{ flex: '1 1 230px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={lab}>Position de l'embout z (sous le bord) : <strong style={{ color: '#b45309' }}>{zCm} cm</strong></span>
              <input type="range" min="0" max={HC_CM} step="1" value={zCm} onChange={e => setZCm(parseInt(e.target.value, 10))}
                aria-label="Position de l'embout dans le récipient" style={{ accentColor: '#f59e0b', width: '100%' }}/>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setZCm(HC_CM)} style={stylePetitBouton(false, '#0369a1')}>⬇ Placer au fond</button>
              <button onClick={() => setRevele(r => !r)} style={stylePetitBouton(revele, '#64748b')}>{revele ? '🙈 Cacher le niveau' : '👁 Révéler le niveau'}</button>
              <button onClick={() => { setHinc(Math.round((0.15 + Math.random() * 0.4) * 100) / 100); setRevele(false); setZCm(0); }} style={stylePetitBouton(false, '#64748b')}>🔄 Autre récipient</button>
            </div>
            <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
              Pression lue : <strong>{pLueInc} hPa</strong>
            </div>
            {estimationVisible && (modele === 1 && profEstimee != null ? (
              <div style={{ ...styleBoite, background: 'white', fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
                Profondeur de l'embout sous la surface, d'après votre droite : h = (P − b) / a = <strong>{fmt(profEstimee, 1)} cm</strong>
                <div style={{ fontSize: 12.5, color: TXT2 }}>C'est la hauteur d'eau H seulement si l'embout est au fond.</div>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: TXT2 }}>Étalonnez le manomètre (mesures, modèle linéaire) pour déduire la profondeur de la pression lue.</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sf-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sf-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 960px) { .sf-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Statique des fluides : P = f(h) et hauteur d'eau</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`sf-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : exploration}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && (
        <div className="sf-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Relevez une dizaine de points et modélisez : que valent la pente et l'ordonnée à l'origine ? Que représentent-elles ?</li>
              <li>Changez de liquide : que deviennent la pente et l'ordonnée à l'origine ?</li>
              <li>Dans le récipient inconnu, placez l'embout au bord, à mi-hauteur puis au fond : que lit-on, et que peut-on en déduire ?</li>
              <li>Comparez le niveau trouvé avec le niveau réel (« Révéler le niveau ») : d'où vient l'écart ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
