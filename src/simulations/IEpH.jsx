import { useState, useEffect, useRef, useMemo } from "react";
import { TabBtn, cardStyle, KIT, Section, styleBoite, CarteParcours, useEtatPersistant, styleBouton, ORANGE_GUIDE, avecIndices, fmt, lireNombre, proche } from "../commun";

// ════════════════════════════════════════════════════════════════
//  SIMULATION 29 — Courbes i = f(E) et diagramme E-pH
//  Faisceau de courbes i = f(E) à plusieurs pH, vue 3D (E, pH, i),
//  coupe à un pH donné, et diagramme E-pH correspondant.
// ════════════════════════════════════════════════════════════════
const FT = 8.314 * 298.15 / 96485;      // RT/F à 25 °C
const NERNST = FT * Math.LN10;          // 0,0592 V
const E_MIN = -1.2, E_MAX = 2.4, I_CLIP = 1.5;
const PH_FAISCEAU = [0, 2, 4, 6, 8, 10, 12, 14];
const SURT_O2 = 0.5;                    // surtension d'oxydation de l'eau sur platine (V)

// Potentiel apparent (V/ESH) des deux couples en fonction du pH
const E_H2 = pH => -NERNST * pH;                         // 2 H⁺ + 2 e⁻ = H₂   (p(H₂) = 1 bar)
const E_O2 = pH => 1.23 - NERNST * pH;                   // O₂ + 4 H⁺ + 4 e⁻ = 2 H₂O  (thermodynamique)
const FER_PH_MAX = 2;                                    // au-delà, Fe(III) précipite : modèle non valable
const E_FE = () => 0.77;                                 // Fe³⁺ + e⁻ = Fe²⁺, indépendant du pH tant qu'aucune espèce ne précipite
// Benzoquinone / hydroquinone : Q + 2 H⁺ + 2 e⁻ = QH₂, avec pKa(QH₂) = 9,9 et pKa(QH⁻) = 11,6
const PKA1 = 9.9, PKA2 = 11.6, E0_Q = 0.699;
const E_Q = pH => { const h = Math.pow(10, -pH), K1 = Math.pow(10, -PKA1), K2 = Math.pow(10, -PKA2);
  return E0_Q - NERNST * pH - (NERNST / 2) * Math.log10(1 + K1 / h + K1 * K2 / (h * h)); };

const COUPLES = {
  aucun: { nom: "Aucun (solvant seul)", n: 0 },
  fe: { nom: "Fe³⁺/Fe²⁺", n: 1, E: E_FE, phMax: FER_PH_MAX, couleur: "#c0392b" },
  q: { nom: "Benzoquinone / hydroquinone", n: 2, E: E_Q, couleur: "#16a34a" },
};

// Courant total i(E, pH). Les deux formes du couple sont à la même concentration (palier = 1 u.a. de chaque côté).
function courant(E, pH, couple) {
  let i = 0;
  const v = Math.exp(2 * (E - 1.23 - SURT_O2 + NERNST * pH) / FT);   // mur d'oxydation de l'eau
  i += 100 * v / (5000 + v);
  const w = Math.exp(-2 * (E - E_H2(pH)) / FT);                      // mur de réduction de l'eau
  i -= 100 * w / (5000 + w);
  const c = typeof couple === "string" ? COUPLES[couple] : couple;
  if (c && c.n > 0 && (c.phMax === undefined || pH <= c.phMax)) {
    const k = Math.exp(c.n * (E - c.E(pH)) / FT);
    i += k / (1 + k) - 1 / (1 + k);        // palier +1 (oxydation du réducteur) et −1 (réduction de l'oxydant)
  }
  return i;
}
const clip = v => Math.max(-I_CLIP, Math.min(I_CLIP, v));


const nomCouple = c => c.nom;
function HypothesesIEpH({ defaut = false, focus = false }) {
  const [ouvert, setOuvert] = useState(defaut);
  const li = (t, dd) => <li style={{ marginBottom: 4 }}><strong>{t}</strong> {dd}</li>;
  return (
    <div style={focus ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {}}>
      <Section titre="Hypothèses de travail du modèle" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
          {li("Systèmes rapides, courants limites de diffusion :", "chaque couple donne une vague de Nernst centrée sur son potentiel, avec un palier proportionnel à la concentration (ici : les deux formes à la même concentration, paliers de ± 1 u.a.). Courant en unités arbitraires.")}
          {li("Les potentiels sont en V/ESH, à 25 °C ;", "activités assimilées aux concentrations, pas de chute ohmique.")}
          {li("Solvant :", "les murs sont ceux de l’eau, H⁺/H₂ (E = −0,059·pH) et O₂/H₂O (E = 1,23 − 0,059·pH). L’oxydation de l’eau est en réalité lente sur platine : le mur observé est décalé d’environ 0,5 V (surtension choisie, qualitative). Le domaine d’inertie a donc une largeur de 1,73 V, quel que soit le pH.")}
          {li("Benzoquinone / hydroquinone :", "Q + 2 H⁺ + 2 e⁻ = QH₂, E° = 0,70 V/ESH ; pente −0,059 V par unité de pH, puis rupture de pente aux pKa de l’hydroquinone (9,9 et 11,6). Tracé thermodynamique : en milieu très basique, la benzoquinone n’est pas stable.")}
          {li("Fe³⁺/Fe²⁺ :", "E° = 0,77 V/ESH, sans H⁺ dans la demi-équation, donc indépendant du pH. Le modèle n’est valable que pour pH ≤ 2 : pour c = 0,01 mol/L et Ks(Fe(OH)₃) ≈ 10⁻³⁸, Fe(III) commence à précipiter vers pH 2 (Fe(II) ne précipiterait que vers pH 7–8 avec Ks(Fe(OH)₂) ≈ 10⁻¹⁵) : au-delà, Fe(III) et Fe(II) précipitent en hydroxydes, la concentration en solution chute et le diagramme E-pH réel est tout autre. La vague n’est donc pas tracée au-delà. (Dans la simulation « Titrages électrochimiques », E°′ = 0,68 V en milieu sulfurique : valeur apparente, à cause de la complexation.)")}
          {li("La vue 3D est un outil de visualisation :", "les courbes sont écrêtées à ± 1,5 u.a. pour que les murs du solvant n’écrasent pas le reste.")}
        </ul>
      </Section>
    </div>
  );
}

// ── Vue : réglages, 3D, coupe, diagramme E-pH ──
export function VueIEpH({ plotlyReady, e, set, opts = {}, focus = [] }) {
  const { pH, couple, vue3d } = e;
  const o = { reglages: true, choixCouple: true, choixVue: true, g3d: true, coupe: true, diag: true, valeurs: true, couplesDispo: ["aucun", "fe", "q"], ...opts };
  const ref3D = useRef(null), refCoupe = useRef(null), refDiag = useRef(null);
  const cp = typeof couple === "string" ? COUPLES[couple] : couple;
  const coupleActif = cp.n > 0 && (cp.phMax === undefined || pH <= cp.phMax);
  const halo = id => focus.includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const Egrid = useMemo(() => { const a = []; for (let v = E_MIN; v <= E_MAX + 1e-9; v += 0.02) a.push(parseFloat(v.toFixed(3))); return a; }, []);
  const okAt = q => !(cp.n > 0 && cp.phMax !== undefined && q > cp.phMax);

  useEffect(() => {
    if (!window.Plotly) return;
    if (o.g3d && ref3D.current) {
      const traces = [];
      if (vue3d !== "faisceau") {
        const Es = [], phs = [];
        for (let v = E_MIN; v <= E_MAX + 1e-9; v += 0.04) Es.push(parseFloat(v.toFixed(3)));
        for (let q = 0; q <= 14.001; q += 0.5) phs.push(q);
        traces.push({ type: "surface", x: Es, y: phs, z: phs.map(q => Es.map(v => clip(courant(v, q, okAt(q) ? couple : "aucun")))),
          surfacecolor: phs.map(q => Es.map(() => q)), colorscale: "Viridis", cmin: 0, cmax: 14, showscale: false, opacity: 0.88,
          contours: { z: { show: true, usecolormap: false, color: "#334155", width: 1, start: -1.5, end: 1.5, size: 0.5 } },
          hoverinfo: "skip", showlegend: false });
      }
      if (vue3d !== "surface") PH_FAISCEAU.forEach(q => {
        traces.push({ type: "scatter3d", mode: "lines", x: Egrid, y: Egrid.map(() => q), z: Egrid.map(v => clip(courant(v, q, okAt(q) ? couple : "aucun"))),
          line: { width: 4, color: `hsl(${Math.round(230 - q * 16)},65%,45%)` }, hoverinfo: "skip", showlegend: false });
      });
      traces.push({ type: "scatter3d", mode: "lines", x: Egrid, y: Egrid.map(() => pH), z: Egrid.map(v => clip(courant(v, pH, couple))),
        line: { width: 8, color: "#e63946" }, showlegend: false, hovertemplate: "E = %{x:.2f} V/ESH<br>i = %{z:.2f} u.a.<extra></extra>" });
      try {
        window.Plotly.react(ref3D.current, traces, {
          scene: { xaxis: { title: "E (V/ESH)", range: [E_MIN, E_MAX] }, yaxis: { title: "pH", range: [0, 14] }, zaxis: { title: "i (u.a.)", range: [-I_CLIP, I_CLIP] },
            aspectmode: "manual", aspectratio: { x: 1.6, y: 1.2, z: 0.8 }, camera: { eye: { x: 1.5, y: -1.9, z: 0.9 } } },
          margin: { t: 0, b: 0, l: 0, r: 0 }, paper_bgcolor: "rgba(0,0,0,0)", autosize: true,
        }, { displayModeBar: false, responsive: true });
      } catch (err) { /* WebGL indisponible */ }
    }
    if (o.coupe && refCoupe.current) {
      const Ez = Egrid.map(v => courant(v, pH, couple));
      window.Plotly.react(refCoupe.current, [
        { x: Egrid, y: Ez.map(clip), mode: "lines", line: { color: "#e63946", width: 2.5 }, showlegend: false, hovertemplate: "E = %{x:.2f}<br>i = %{y:.2f}<extra></extra>" },
      ], {
        xaxis: { title: "E (V/ESH)", range: [E_MIN, E_MAX], zeroline: false }, yaxis: { title: "i (u.a.)", range: [-I_CLIP, I_CLIP] },
        shapes: [{ type: "line", x0: E_MIN, x1: E_MAX, y0: 0, y1: 0, line: { color: "#999", width: 1 } },
          { type: "rect", x0: E_H2(pH), x1: E_O2(pH) + SURT_O2, y0: -I_CLIP, y1: I_CLIP, fillcolor: "rgba(34,197,94,0.07)", line: { width: 0 }, layer: "below" }],
        margin: { t: 10, b: 45, l: 55, r: 15 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true,
      }, { displayModeBar: false, responsive: true });
    }
    if (o.diag && refDiag.current) {
      const pHs = []; for (let q = 0; q <= 14.001; q += 0.1) pHs.push(parseFloat(q.toFixed(2)));
      const d = [
        { x: pHs, y: pHs.map(E_H2), mode: "lines", name: "H⁺/H₂", line: { color: "#1a6eb5" } },
        { x: pHs, y: pHs.map(E_O2), mode: "lines", name: "O₂/H₂O (thermodynamique)", line: { color: "#c0392b", dash: "dash" } },
        { x: pHs, y: pHs.map(q => E_O2(q) + SURT_O2), mode: "lines", name: "mur observé sur Pt (+0,5 V)", line: { color: "#c0392b", dash: "dot" } },
      ];
      if (cp.n > 0) {
        const pm = cp.phMax === undefined ? 14 : cp.phMax, ps = pHs.filter(q => q <= pm + 1e-9);
        d.push({ x: ps, y: ps.map(cp.E), mode: "lines", name: cp.nom, line: { color: cp.couleur || "#16a34a", width: 3 } });
      }
      d.push({ x: [pH, pH], y: [E_MIN, E_MAX], mode: "lines", line: { color: "#e63946", width: 1.5, dash: "dot" }, showlegend: false, hoverinfo: "skip" });
      window.Plotly.react(refDiag.current, d, {
        xaxis: { title: "pH", range: [0, 14] }, yaxis: { title: "E (V/ESH)", range: [E_MIN, E_MAX] },
        shapes: couple === "fe" ? [{ type: "rect", x0: FER_PH_MAX, x1: 14, y0: E_MIN, y1: E_MAX, fillcolor: "rgba(148,163,184,0.18)", line: { width: 0 }, layer: "below" }] : [],
        annotations: couple === "fe" ? [{ x: (FER_PH_MAX + 14) / 2, y: 1.9, text: "Fe(III) précipite (Fe(OH)₃) :<br>modèle non valable", showarrow: false, font: { size: 11, color: "#475569" } }] : [],
        margin: { t: 10, b: 45, l: 55, r: 15 }, legend: { orientation: "h", y: -0.32, font: { size: 11 } },
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true,
      }, { displayModeBar: false, responsive: true });
    }
  }, [pH, couple, vue3d, plotlyReady, Egrid, o.g3d, o.coupe, o.diag]);

  const noms = { aucun: "Aucun (solvant seul)", fe: "Fe³⁺/Fe²⁺", q: "Benzoquinone / hydroquinone" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {o.reglages && <div style={{ ...styleBoite, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, padding: 3, ...halo("ph") }}>
          <strong>pH =</strong>
          <input type="range" min="0" max="14" step="0.1" value={pH} aria-label="Curseur du pH" onChange={ev => set({ pH: parseFloat(ev.target.value) })} style={{ width: 200, accentColor: "#e63946" }}/>
          <input type="number" min="0" max="14" step="0.1" value={pH} aria-label="pH" onChange={ev => { const v = parseFloat(ev.target.value); if (isFinite(v)) set({ pH: Math.min(14, Math.max(0, v)) }); }}
            style={{ width: 64, padding: "3px 6px", borderRadius: 4, border: "1px solid #ccc", fontWeight: 700 }}/>
        </span>
        {o.choixCouple && <span style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", padding: 3, ...halo("couple") }}>
          <strong>Couple :</strong>
          {o.couplesDispo.map(k => <TabBtn key={k} active={couple === k} color={COUPLES[k].couleur || "#475569"} onClick={() => set({ couple: k })}>{noms[k]}</TabBtn>)}
        </span>}
        {o.choixVue && o.g3d && <span style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", padding: 3, ...halo("vue3d") }}>
          <strong>Vue 3D :</strong>
          {[["faisceau", "Faisceau"], ["surface", "Surface"], ["les deux", "Les deux"]].map(([k, l]) =>
            <TabBtn key={k} active={vue3d === k} color="#334155" onClick={() => set({ vue3d: k })}>{l}</TabBtn>)}
        </span>}
      </div>}
      <div className="iep-l">
        {o.g3d && <div style={{ ...cardStyle, ...halo("g3d") }}>
          <div style={{ fontWeight: 600, color: "#445", marginBottom: 4 }}>Courants i en fonction de E et du pH (vue 3D, à faire tourner)</div>
          <div ref={ref3D} style={{ height: 460 }}/>
          <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>La courbe rouge épaisse correspond au pH choisi ; les autres (couleur selon le pH) forment le faisceau ; la surface relie toutes les courbes (couleur selon le pH, lignes de niveau tous les 0,5 u.a.). Les vagues d’un couple dont la demi-équation fait intervenir H⁺ se décalent quand le pH change : c’est la trace de la droite du diagramme E-pH.</div>
        </div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, ...(o.g3d ? {} : { gridColumn: "1 / -1" }) }}>
          {o.coupe && <div style={{ ...cardStyle, ...halo("coupe") }}>
            <div style={{ fontWeight: 600, color: "#445", marginBottom: 4 }}>Coupe à pH = {pH.toFixed(1)}</div>
            <div ref={refCoupe} style={{ height: 230 }}/>
            <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
              Zone verte : domaine d’inertie du solvant{o.valeurs && <>, de {E_H2(pH).toFixed(2)} à {(E_O2(pH) + SURT_O2).toFixed(2)} V/ESH</>}.
              {o.valeurs && coupleActif && <> Couple {cp.nom} : E = {cp.E(pH).toFixed(2)} V/ESH.</>}
              {cp.n > 0 && !coupleActif && <> <strong style={{ color: "#b91c1c" }}>Fe(III) précipite à ce pH : modèle non valable, vague non tracée.</strong></>}
            </div>
          </div>}
          {o.diag && <div style={{ ...cardStyle, ...halo("diag") }}>
            <div style={{ fontWeight: 600, color: "#445", marginBottom: 4 }}>Diagramme E-pH correspondant</div>
            <div ref={refDiag} style={{ height: 300 }}/>
          </div>}
        </div>
      </div>
    </div>
  );
}

const ETAT0 = { pH: 0, couple: "aucun", vue3d: "faisceau" };
const CSS = `.iep-l { display: grid; gap: 12px; grid-template-columns: minmax(0,1.4fr) minmax(300px,1fr); align-items: start; }
  .iep-g { display: grid; gap: 12px; grid-template-columns: minmax(0,2fr) minmax(300px,1fr); align-items: start; }
  @media (max-width: 900px) { .iep-l, .iep-g { grid-template-columns: minmax(0,1fr); } }`;

function ExplorationIEpH({ plotlyReady }) {
  const [e, setE] = useState(ETAT0);
  const set = f => setE(x => ({ ...x, ...f }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <HypothesesIEpH/>
      <VueIEpH plotlyReady={plotlyReady} e={e} set={set}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PARCOURS GUIDÉ
// ════════════════════════════════════════════════════════════════
function ParcoursIEpH({ plotlyReady, changerMode }) {
  const [guide, setGuide] = useEtatPersistant("iepH-guide-v1", { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [e, setE] = useState(ETAT0);
  const set = f => setE(x => ({ ...x, ...f }));
  const etape = guide.etape;
  const pres = (v, c, t = 0.3) => Math.abs(v - c) <= t;
  const V = { reglages: true, choixCouple: false, choixVue: false, g3d: false, diag: false, valeurs: false };
  const ETAPES = [
    { id: "coupe", titre: "Le courant à un pH donné", focus: ["coupe"], vue: { reglages: false },
      texte: <>Le graphique montre le courant i traversant une électrode de platine plongée dans une solution aqueuse, en fonction de son potentiel E (V/ESH). Ici, il n’y a <strong>aucune espèce dissoute</strong> : seul le solvant, l’eau, réagit. Le courant est en unités arbitraires.</>,
      tache: { type: "qcm", q: "Que représente la zone verte (où le courant est nul) ?", options: ["Le domaine d’inertie électrochimique de l’eau : aucune réaction du solvant", "Le domaine où l’électrode est détériorée", "Le domaine où l’on observe le fer"], bonne: 0,
        expl: "En dessous, l’eau est réduite en H₂ ; au-dessus, elle est oxydée en O₂. Entre les deux, on peut observer des espèces dissoutes sans que le solvant ne gêne." } },
    { id: "ph", titre: "Faire varier le pH", focus: ["ph", "coupe"], vue: V,
      texte: <>Un curseur de pH apparaît. Réglez-le à <strong>pH = 7</strong> et observez le déplacement de la zone verte par rapport à pH = 0.</>,
      tache: { type: "action", ok: pres(e.pH, 7), label: "Placer pH = 7", faire: () => set({ pH: 7 }), consigne: "Placez le pH à 7 (à 0,3 près)." } },
    { id: "mur1", titre: "Le mur de la réduction de l’eau", focus: ["coupe"], vue: V,
      texte: <>La limite inférieure correspond à la réduction des ions H⁺ en dihydrogène : 2 H⁺ + 2 e⁻ = H₂. Avec p(H₂) = 1 bar, la loi de Nernst donne E = E° + 0,059·log[H⁺] = <strong>−0,059·pH</strong> (E° = 0 V/ESH).</>,
      tache: { type: "num", q: "Potentiel de ce mur à pH = 7", unite: "V/ESH", vrai: -0.414, tol: 0.03, affiche: v => fmt(v, 2),
        aide: "E = −0,059 × pH.", pieges: [[0.414, "Le signe : plus le pH augmente, plus le potentiel diminue."]] } },
    { id: "hypo", titre: "Le mur de l’oxydation de l’eau", focus: ["hypo", "coupe"], vue: V,
      texte: <>La limite supérieure correspond à O₂ + 4 H⁺ + 4 e⁻ = 2 H₂O, de potentiel E = 1,23 − 0,059·pH. Lisez l’encadré « Hypothèses de travail » : sur platine, l’oxydation de l’eau est <strong>lente</strong>.</>,
      tache: { type: "qcm", q: "Pourquoi le mur observé est-il situé environ 0,5 V plus haut que le potentiel thermodynamique ?", options: ["L’oxydation de l’eau est lente sur platine : il faut une surtension pour que le courant apparaisse", "Le platine réagit avec l’eau", "La loi de Nernst n’est pas valable pour l’oxygène"], bonne: 0,
        expl: "C’est la surtension de l’oxydation de l’eau. Dans ce modèle, elle est choisie de façon qualitative (0,5 V)." } },
    { id: "largeur", titre: "La largeur du domaine d’inertie", focus: ["coupe"], vue: V,
      texte: <>Le mur supérieur observé est à E = 1,23 + 0,5 − 0,059·pH. Calculez la largeur du domaine entre les deux murs.</>,
      tache: { type: "num", q: "Largeur du domaine d’inertie à pH = 7", unite: "V", vrai: 1.73, tol: 0.02, affiche: v => fmt(v, 2),
        aide: "Mur supérieur − mur inférieur.", pieges: [[1.23, "Il faut tenir compte de la surtension de 0,5 V."]] } },
    { id: "largeur2", titre: "Et à un autre pH ?", focus: ["coupe", "ph"], vue: V,
      texte: <>Déplacez le curseur de pH et observez la zone verte.</>,
      tache: { type: "qcm", q: "Quand le pH varie, la largeur du domaine d’inertie…", options: ["reste la même : les deux murs se décalent de la même valeur", "augmente avec le pH", "diminue avec le pH"], bonne: 0,
        expl: "Les deux murs ont la même pente (−0,059 V par unité de pH) : le domaine se translate sans changer de largeur (1,73 V)." } },
    { id: "faisceau", titre: "Toutes les courbes à la fois", focus: ["g3d"], vue: { ...V, g3d: true },
      texte: <>Voici maintenant une vue en 3D : chaque courbe i = f(E) correspond à un pH différent (de 0 à 14, couleur selon le pH). Faites tourner la figure avec la souris. La courbe rouge épaisse est celle du pH choisi.</>,
      tache: { type: "qcm", q: "Comment évolue l’ensemble du domaine d’inertie quand le pH augmente ?", options: ["Il se décale en bloc vers les potentiels plus faibles", "Il se décale vers les potentiels plus élevés", "Il ne bouge pas"], bonne: 0 } },
    { id: "diag", titre: "Le diagramme E-pH", focus: ["diag"], vue: { ...V, g3d: true, diag: true },
      texte: <>Un graphique apparaît : on y reporte, en fonction du pH, les potentiels des murs. C’est la vue de dessus de la figure 3D.</>,
      tache: { type: "qcm", q: "Que représentent les deux droites parallèles en traits pleins ou pointillés rouges et bleus ?", options: ["Les limites du domaine d’inertie de l’eau, qui se déplacent avec le pH", "Les potentiels de l’électrode de référence", "Les concentrations en H⁺ et en OH⁻"], bonne: 0,
        expl: "Le diagramme E-pH de l’eau est ainsi la trace, sur le plan (pH, E), des murs du solvant." } },
    { id: "surface", titre: "Une surface", focus: ["vue3d", "g3d"], vue: { ...V, g3d: true, diag: true, choixVue: true },
      texte: <>Choisissez la vue « Surface » : toutes les courbes sont reliées en une surface i(E, pH). Les plateaux représentent les zones sans réaction, les montées brutales les murs de l’eau.</>,
      tache: { type: "action", ok: e.vue3d !== "faisceau", label: "Afficher la surface", faire: () => set({ vue3d: "surface" }), consigne: "Choisissez « Surface » ou « Les deux »." } },
    { id: "fe", titre: "Un couple sans H⁺ : Fe³⁺/Fe²⁺", focus: ["couple", "diag"], vue: { ...V, g3d: true, diag: true, choixVue: true, choixCouple: true, couplesDispo: ["aucun", "fe"] },
      texte: <>Ajoutons des ions fer : Fe³⁺ + e⁻ = Fe²⁺, E° = 0,77 V/ESH. Cette demi-équation <strong>ne fait pas intervenir H⁺</strong>. Choisissez ce couple et un pH de 1.</>,
      tache: { type: "action", ok: e.couple === "fe" && pres(e.pH, 1, 0.5), label: "Fe³⁺/Fe²⁺, pH = 1", faire: () => set({ couple: "fe", pH: 1 }), consigne: "Choisissez Fe³⁺/Fe²⁺ avec un pH entre 0,5 et 1,5." } },
    { id: "feq", titre: "Vague du fer et pH", focus: ["coupe", "diag"], vue: { ...V, g3d: true, diag: true, choixVue: true, choixCouple: true, couplesDispo: ["aucun", "fe"], coupe: true },
      texte: <>Faites varier le pH de 0 à 2 en regardant la vague de Fe³⁺/Fe²⁺ sur la coupe, et la droite correspondante sur le diagramme E-pH.</>,
      tache: { type: "qcm", q: "Que fait la vague de Fe³⁺/Fe²⁺ quand le pH augmente de 0 à 2 ?", options: ["Elle ne bouge pas : le potentiel du couple ne dépend pas du pH", "Elle se décale vers les potentiels plus faibles, comme les murs de l’eau", "Elle disparaît"], bonne: 0,
        expl: "Le potentiel d’un couple dont la demi-équation ne contient pas H⁺ est indépendant du pH : droite horizontale dans le diagramme E-pH." } },
    { id: "feLim", titre: "Pourquoi s’arrêter à pH 2 ?", focus: ["diag"], vue: { ...V, g3d: true, diag: true, choixVue: true, choixCouple: true, couplesDispo: ["aucun", "fe"], valeurs: true },
      texte: <>Réglez le pH au-dessus de 2 : la vague n’est plus tracée et une zone grisée apparaît dans le diagramme.</>,
      tache: { type: "qcm", q: "Pourquoi la vague du fer n’est-elle plus tracée au-delà de pH 2 ?", options: ["Fe(III) précipite en hydroxyde Fe(OH)₃ : le modèle de vagues d’espèces dissoutes n’est plus valable", "Le fer est réduit par l’eau", "Le courant devient infini"], bonne: 0,
        expl: "Un solide ne diffuse pas vers l’électrode : la concentration en fer dissous devient très faible et le palier de courant s’effondre. Il faudrait alors un autre modèle." } },
    { id: "q", titre: "Un couple avec H⁺ : benzoquinone / hydroquinone", focus: ["couple", "coupe", "diag"], vue: { ...V, g3d: true, diag: true, choixVue: true, choixCouple: true, valeurs: true },
      texte: <>La demi-équation est Q + 2 H⁺ + 2 e⁻ = QH₂ (E° = 0,70 V/ESH à pH 0). Cette fois, H⁺ intervient. Choisissez ce couple et un pH de 5.</>,
      tache: { type: "action", ok: e.couple === "q" && pres(e.pH, 5, 0.5), label: "Benzoquinone, pH = 5", faire: () => set({ couple: "q", pH: 5 }), consigne: "Choisissez Benzoquinone / hydroquinone avec un pH entre 4,5 et 5,5." } },
    { id: "pente", titre: "La pente de la droite", focus: ["diag"], vue: { ...V, g3d: true, diag: true, choixVue: true, choixCouple: true, valeurs: true },
      texte: <>Pour une demi-équation Ox + m H⁺ + n e⁻ = Red, la loi de Nernst donne E = E° − (0,059·m/n)·pH. Ici m = 2 et n = 2.</>,
      tache: { type: "num", q: "Pente de la droite E = f(pH) du couple Q/QH₂ (en V par unité de pH)", unite: "V/pH", vrai: -0.059, tol: 0.03, affiche: v => fmt(v, 3),
        aide: "−0,059 × m / n.", pieges: [[-0.118, "Il faut diviser par n, le nombre d’électrons échangés."], [-0.0295, "m vaut 2 et n vaut 2."]] } },
    { id: "rupture", titre: "Une rupture de pente", focus: ["diag"], vue: { ...V, g3d: true, diag: true, choixVue: true, choixCouple: true, valeurs: true },
      texte: <>Augmentez le pH jusqu’à 12 : la droite du couple Q/QH₂ change de pente vers pH 10.</>,
      tache: { type: "qcm", q: "Quelle est l’origine de cette rupture de pente ?", options: ["L’hydroquinone est une espèce acide (pKa = 9,9) : au-delà, sa forme basique devient majoritaire et la demi-équation fait intervenir moins de H⁺", "L’électrode se détériore", "La benzoquinone précipite"], bonne: 0,
        expl: "Une rupture de pente dans un diagramme E-pH signale un changement d’espèce prédominante : ici, un couple acide-base." } },
    { id: "prevoir", titre: "Thermodynamique et cinétique", focus: [], vue: { ...V, g3d: true, diag: true, choixVue: true, choixCouple: true, valeurs: true },
      texte: <>À pH 0, le couple MnO₄⁻/Mn²⁺ a un potentiel de 1,51 V/ESH, supérieur à celui du couple O₂/H₂O (1,23 V à pH 0). Pourtant, les solutions de permanganate acidifiées se conservent plusieurs jours.</>,
      tache: { type: "qcm", q: "Comment l’expliquer ?", options: ["Thermodynamiquement, MnO₄⁻ peut oxyder l’eau, mais la réaction est cinétiquement très lente", "MnO₄⁻ est moins oxydant que O₂", "L’eau ne peut jamais être oxydée"], bonne: 0,
        expl: "Même raison que le mur de l’eau, décalé de 0,5 V : l’oxydation de l’eau est lente. Un couple situé entre le potentiel thermodynamique et le mur observé ne l’oxyde pas en pratique." } },
    { id: "bravo", titre: "Bravo !", focus: [],
      texte: <>Vous savez relier les courbes i = f(E) au diagramme E-pH : les murs de l’eau et les couples avec H⁺ se décalent avec le pH, les couples sans H⁺ non, et une rupture de pente signale un changement d’espèce. En exploration libre, jouez avec la surface ; dans le défi, un couple inconnu vous attend.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(s => s.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vue = { ...V, ...(et.vue || {}) };
  const fin = (
    <span style={{ display: "flex", gap: 6 }}>
      <button onClick={() => changerMode("explore")} style={styleBouton(true, "#334155")}>🔍 Explorer</button>
      <button onClick={() => changerMode("defi")} style={styleBouton(true, "#0ea5e9")}>🎯 Défi</button>
    </span>
  );
  return (
    <div className="iep-g">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <VueIEpH plotlyReady={plotlyReady} e={e} set={set} opts={vue} focus={et.focus}/>
        {etape >= idx("hypo") && <HypothesesIEpH defaut={et.focus.includes("hypo")} focus={et.focus.includes("hypo")} key={String(et.focus.includes("hypo"))}/>}
      </div>
      <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={fin}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  DÉFI : un couple fictif de demi-équation Ox + m H⁺ + n e⁻ = Red
// ════════════════════════════════════════════════════════════════
const choix = t => t[Math.floor(Math.random() * t.length)];
function campagne() {
  for (;;) { const d = campagneBrute(); if (Math.abs(d.E(d.pH)) > 0.1) return d; }
}
function campagneBrute() {
  const [m, n] = choix([[1, 1], [2, 2], [3, 2], [4, 2], [1, 2], [2, 1], [8, 5]]);
  const E0 = choix([-0.6, -0.2, 0.1, 0.45, 0.8, 1.2, 1.6, 2.0]);
  const pH = choix([2, 3, 4, 5, 6, 8, 9, 10]);
  const E = q => E0 - NERNST * m / n * q;
  return { m, n, E0, pH, E, reps: {}, choix: {}, verifie: false,
    couple: { nom: "Couple fictif", n, E, couleur: "#16a34a" } };
}
const noms = (m, n) => `Ox + ${m > 1 ? m + " " : ""}H⁺ + ${n > 1 ? n + " " : ""}e⁻ = Red`;

function DefiIEpH({ plotlyReady }) {
  const [defi, setDefi] = useState(() => campagne());
  const [e, setE] = useState(() => ({ ...ETAT0, pH: defi.pH, couple: defi.couple }));
  const set = f => setE(x => ({ ...x, ...f }));
  const nouveau = () => { const d = campagne(); setDefi(d); setE({ ...ETAT0, pH: d.pH, couple: d.couple }); };
  const maj = f => setDefi(d => ({ ...d, verifie: false, ...f(d) }));
  const { m, n, E0, pH, E } = defi;
  const Ec = E(pH), bas = E_H2(pH), haut = E_O2(pH) + SURT_O2;
  const pos = Ec < bas ? 1 : Ec > haut ? 2 : 0;
  const Q = [
    { id: "pente", q: "Pente de la droite E = f(pH) de ce couple (en V par unité de pH)", vrai: -NERNST * m / n, tol: 0.03, aff: fmt(-NERNST * m / n, 3), u: "V/pH" },
    { id: "E", q: `Potentiel E du couple à pH = ${pH}`, vrai: Ec, tol: 0.02, aff: fmt(Ec, 2), u: "V/ESH" },
    { id: "bas", q: `Potentiel du mur H⁺/H₂ à pH = ${pH}`, vrai: bas, tol: 0.02, aff: fmt(bas, 2), u: "V/ESH" },
    { id: "pos", q: `À pH = ${pH}, où se situe ce couple par rapport au domaine d’inertie de l’eau (mur supérieur observé : E = 1,73 − 0,059·pH) ?`,
      choix: ["Dans le domaine : sa vague est observable", "Au-dessous du mur H⁺/H₂", "Au-dessus du mur supérieur observé"], vrai: pos },
    { id: "dec", q: `De combien le potentiel du couple varie-t-il quand le pH passe de ${pH} à ${pH + 2} ?`, vrai: -2 * NERNST * m / n, tol: 0.03, aff: fmt(-2 * NERNST * m / n, 3), u: "V" },
  ];
  const juste = q => q.choix ? defi.choix[q.id] === q.vrai : proche(lireNombre(defi.reps[q.id] || ""), q.vrai, q.tol);
  return (
    <div className="iep-g">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <div style={styleBoite}>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
            Un couple <strong>fictif</strong> a pour demi-équation <strong>{noms(m, n)}</strong> et pour potentiel standard E° = {fmt(E0, 2)} V/ESH à pH 0. On suppose qu’il est rapide, sans précipitation ni rupture de pente (aucune espèce acido-basique), et que ses deux formes sont à la même concentration. Le potentiel du couple est celui de la loi de Nernst. La vue ci-dessous représente ce couple (pour vérifier vos résultats).
          </div>
        </div>
        <VueIEpH key={m + "-" + n + "-" + E0} plotlyReady={plotlyReady} e={e} set={set} opts={{ choixCouple: false, valeurs: false }}/>
        <HypothesesIEpH/>
      </div>
      <div style={{ ...styleBoite, display: "flex", flexDirection: "column", gap: 10, alignSelf: "start", position: "sticky", top: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>Questions</div>
        {Q.map((q, i) => {
          const ok = defi.verifie && juste(q);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? "#16a34a" : "#dc2626") : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{i + 1}. {avecIndices(q.q)}</div>
              {q.choix ? (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {q.choix.map((c, k) => <button key={k} onClick={() => maj(d => ({ choix: { ...d.choix, [q.id]: k } }))} style={{ ...styleBouton(defi.choix[q.id] === k, "#0ea5e9"), padding: "4px 9px", fontSize: 13, textAlign: "left" }}>{c}</button>)}
                  {defi.verifie && <span>{ok ? "✅" : "❌"}</span>}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input value={defi.reps[q.id] || ""} placeholder="?" aria-label={`Réponse ${i + 1}`} onChange={ev => { const v = ev.target.value; maj(d => ({ reps: { ...d.reps, [q.id]: v } })); }}
                    style={{ fontSize: 14, padding: "4px 8px", border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                  <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.u}</span>
                  {defi.verifie && <span>{ok ? "✅" : "❌"}</span>}
                </div>
              )}
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.choix ? q.choix[q.vrai] : `${q.aff} ${q.u || ""}`}</div>}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, "#16a34a")}>✓ Vérifier</button>
          <button onClick={nouveau} style={styleBouton(false)}>🔄 Nouvelles données</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIMULATION 29 : trois façons de travailler
// ════════════════════════════════════════════════════════════════
export function SimulationIEpH({ plotlyReady }) {
  const [mode, setMode] = useState("explore");
  useEffect(() => { if (mode === "explore") { const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120); return () => clearTimeout(t); } }, [mode]);
  return (
    <div style={{ ...cardStyle, textAlign: "left" }}>
      <style>{CSS}</style>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={() => setMode("guide")} style={styleBouton(mode === "guide", ORANGE_GUIDE)}>🧭 Parcours guidé</button>
        <button onClick={() => setMode("explore")} style={styleBouton(mode === "explore", "#334155")}>🔍 Exploration libre</button>
        <button onClick={() => setMode("defi")} style={styleBouton(mode === "defi", "#0ea5e9")}>🎯 Défi</button>
      </div>
      <div style={{ display: mode === "explore" ? "block" : "none" }}><ExplorationIEpH plotlyReady={plotlyReady}/></div>
      {mode === "guide" && <ParcoursIEpH plotlyReady={plotlyReady} changerMode={setMode}/>}
      {mode === "defi" && <DefiIEpH plotlyReady={plotlyReady}/>}
    </div>
  );
}
