// Vue — simulation « Épaississants associatifs : ASE, HASE, HEUR » (BTS MDC, formulation).
// Modèle pur : epaisseursAssociatifsModele.js ; tests : epaisseursAssociatifsModele.test.mjs ;
// banque d'exercices : BanqueRheologieBTS.js.
// Aucune bibliothèque externe : scène moléculaire en SVG, courbes en canvas 2D natif.
// Parcours guidé progressif : à chaque étape, seuls les éléments utiles sont à l'écran.

import { useEffect, useMemo, useRef, useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import {
  PARAMS, ZONES, zoneDeGradient, fractionIonisee,
  lambdaStatio, cinetiqueReseau, etaStatio, etaInstantane,
  simulerRappe, hysteresisMoyenne, simuler3ITT,
  construireScene, majLiaisons, tirerFicheTDS, questionsDefi,
} from "./epaisseursAssociatifsModele";

const SIM_ID = 100;
declarerDefis(SIM_ID, [["principal", "Lire une fiche d’épaississant"]]);

const GAMMA_MIN = 0.01;
const GAMMA_MAX = 10000;

const INFOS_FAMILLE = {
  ase: { nom: "ASE", produit: "acrylique alcali-gonflable", couleur: "#0d9488" },
  hase: { nom: "HASE", produit: "Thixol 53 L (acrylique associatif)", couleur: "#1d4ed8" },
  heur: { nom: "HEUR", produit: "Coapur 3025 (polyuréthane)", couleur: "#b45309" },
};

// Test 3ITT de référence (HASE), calculé par le modèle une fois pour toutes :
const ITT_HASE = simuler3ITT({ famille: "hase" });

// ---------------------------------------------------------------------------
// Fiches techniques (étape 1 du parcours).
// ---------------------------------------------------------------------------

function FichesTDS() {
  const fiche = (nom, type, citations, couleur) => (
    <div style={{ flex: "1 1 230px", minWidth: 230, background: "#fff", border: `2px solid ${couleur}`, borderRadius: 14, padding: "10px 12px" }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: couleur }}>{nom}</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>{type}</div>
      {citations.map((c, i) => (
        <div key={i} style={{ fontSize: 14, color: KIT.txt, marginBottom: 4 }}>{c}</div>
      ))}
    </div>
  );
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Deux fiches techniques du même fournisseur</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {fiche("Coapur 3025", "Modificateur de rhéologie polyuréthane non ionique",
          ["« Pure Newtonian rheology »", "« Excellent film build, spatter resistance and levelling »"], INFOS_FAMILLE.heur.couleur)}
        {fiche("Thixol 53 L", "Épaississant acrylique associatif",
          ["« Strongly pseudoplastic »", "« Prevents settling and sagging without affecting levelling »"], INFOS_FAMILLE.hase.couleur)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atelier « construire les molécules » (sélection puis placement, compatible
// tactile : pas de glisser-déposer natif, on tape le motif puis la case).
// ---------------------------------------------------------------------------

const MOTIFS = [
  { id: "mma", nom: "Acide méthacrylique", formule: "CH₂=C(CH₃)–COOH" },
  { id: "ea", nom: "Acrylate d’éthyle", formule: "CH₂=CH–COOC₂H₅" },
  { id: "c12", nom: "Acrylate à longue chaîne", formule: "CH₂=CH–COOC₁₂H₂₅" },
  { id: "peg", nom: "Motif éthoxylé", formule: "–O–CH₂–CH₂–O–" },
  { id: "urethane", nom: "Motif uréthane", formule: "–O–CO–NH–" },
  { id: "c11", nom: "Alcool gras C₁₁", formule: "–O–C₁₁H₂₃" },
];

const CIBLES = {
  hase: {
    titre: "HASE (type Thixol 53 L)",
    slots: [
      { id: "acide", lib: "Motif acide" },
      { id: "squelette", lib: "Motif acrylate" },
      { id: "hydrophobe", lib: "Modification hydrophobe" },
    ],
    correct: { acide: "mma", squelette: "ea", hydrophobe: "c12" },
  },
  heur: {
    titre: "HEUR (type Coapur 3025)",
    slots: [
      { id: "etoxy", lib: "Motif éthoxylé" },
      { id: "urethane", lib: "Motif uréthane" },
      { id: "hydrophobe", lib: "Modification hydrophobe" },
    ],
    correct: { etoxy: "peg", urethane: "urethane", hydrophobe: "c11" },
  },
};

function montagesSontCorrects(montages) {
  return Object.keys(CIBLES).every((fam) =>
    CIBLES[fam].slots.every((slot) => montages[fam][slot.id] === CIBLES[fam].correct[slot.id]));
}

function AtelierMotifs({ montages, setMontages }) {
  const [selection, setSelection] = useState(null);
  const motifDe = (id) => MOTIFS.find((m) => m.id === id);
  const place = (id) => Object.values(montages.hase).includes(id) || Object.values(montages.heur).includes(id);
  const placer = (fam, slot) => {
    const nouveau = { hase: { ...montages.hase }, heur: { ...montages.heur } };
    if (selection) {
      // Un motif ne sert qu’une fois : on le déplace s’il était déjà placé.
      for (const f of ["hase", "heur"]) {
        for (const s of Object.keys(nouveau[f])) if (nouveau[f][s] === selection) delete nouveau[f][s];
      }
      nouveau[fam][slot] = selection;
      setSelection(null);
    } else {
      delete nouveau[fam][slot]; // taper une case pleine sans motif sélectionné la vide
    }
    setMontages(nouveau);
  };
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: "1 1 240px", minWidth: 240 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Motifs disponibles</div>
          {MOTIFS.map((m) => (
            <button key={m.id} type="button" aria-pressed={selection === m.id} onClick={() => setSelection(selection === m.id ? null : m.id)}
              style={{
                display: "block", width: "100%", textAlign: "left", cursor: "pointer", marginBottom: 6,
                padding: "8px 10px", borderRadius: 8, color: KIT.txt, fontSize: 13,
                border: selection === m.id ? "2px solid #1d4ed8" : "1px solid #cbd5e1",
                background: selection === m.id ? "#eff6ff" : "#f8fafc",
                opacity: place(m.id) && selection !== m.id ? 0.55 : 1,
              }}>
              <div style={{ fontWeight: 600 }}>{m.nom}</div>
              <div style={{ fontSize: 12, color: KIT.txt2 }}>{m.formule}</div>
            </button>
          ))}
          <div style={{ fontSize: 12.5, color: KIT.txt2 }}>
            Tape un motif pour le sélectionner, puis tape une case pour le placer.
            Chaque motif ne sert qu’une fois. Une case pleine se vide si on la tape sans motif sélectionné.
          </div>
        </div>
        {["hase", "heur"].map((fam) => (
          <div key={fam} style={{ flex: "1 1 240px", minWidth: 240 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{CIBLES[fam].titre}</div>
            {CIBLES[fam].slots.map((slot) => {
              const id = montages[fam][slot.id];
              const correct = id === CIBLES[fam].correct[slot.id];
              return (
                <button key={slot.id} type="button" onClick={() => placer(fam, slot.id)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", marginBottom: 6,
                    padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                    border: id ? (correct ? "2px solid #15803d" : "1px solid #f59e0b") : "1px dashed #94a3b8",
                    background: id ? (correct ? "#f0fdf4" : "#fffbeb") : "#ffffff",
                  }}>
                  <div style={{ fontSize: 12, color: KIT.txt2 }}>{slot.lib}</div>
                  {id ? (
                    <div style={{ fontWeight: 600, fontSize: 13, color: correct ? "#15803d" : "#92400e" }}>
                      {motifDe(id).nom}
                      {correct && slot.id === "hydrophobe" ? " : c’est la modification hydrophobe" : ""}
                      {!correct ? " : à revoir" : ""}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#64748b" }}>…</div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <button type="button" style={{ ...styleBouton(false), marginTop: 6 }} onClick={() => setMontages({ hase: {}, heur: {} })}>
        <Pic n="refresh" />Tout effacer
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau « gants et crochets » : qui peut interagir avec qui ?
// ---------------------------------------------------------------------------

function PanneauLiaisons() {
  const [groupe, setGroupe] = useState(null);
  const textes = {
    gant: "Le gant peut attraper une particule (liaison associative, forte, difficile à défaire) OU un autre gant (liaison auto-associante, lâche, facile à défaire).",
    crochet: "Le crochet ne s’accroche qu’à un autre crochet (liaison auto-associante, lâche). Il n’a aucune prise sur une particule de charge.",
    particule: "Une particule ne se fait attraper que par un gant (liaison associative). Un crochet n’a aucune prise sur elle.",
  };
  const carte = (titre, forme, couleur, cle) => (
    <button type="button" aria-pressed={groupe === cle} onClick={() => setGroupe(cle)} style={{
      flex: "1 1 140px", minWidth: 120, padding: 10, borderRadius: 10, cursor: "pointer",
      border: groupe === cle ? "2px solid #1d4ed8" : "1px solid #cbd5e1", background: "#fff",
    }}>
      <div style={{ fontSize: 34, lineHeight: 1, color: couleur }}>{forme}</div>
      <div style={{ fontWeight: 600, fontSize: 13, color: KIT.txt }}>{titre}</div>
    </button>
  );
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "stretch" }}>
        {carte("Gant de baseball", "🧤", "#b45309", "gant")}
        {carte("Crochet", "🪝", "#7c3aed", "crochet")}
        {carte("Particule (TiO₂)", "⚪", "#64748b", "particule")}
      </div>
      <div style={{ marginTop: 8, padding: 8, background: "#eff6ff", borderRadius: 8, fontSize: 13.5, color: KIT.txt }}>
        {groupe ? textes[groupe] : "Tape un groupe hydrophobe ou une particule pour voir avec quoi il peut interagir."}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: KIT.txt2 }}>
        Convention du TP : elle simplifie une réalité plus nuancée (voir les hypothèses de travail en fin de parcours).
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scène moléculaire : dessin SVG réutilisant les codes visuels de la simulation
// « Séchage d'une peinture » (peintureSchema.jsx) — charges rouges cerclées,
// chaînes bleues « liant », figure + figcaption à pastilles. Toutes les liaisons
// INTERMOLÉCULAIRES sont en pointillés (longs = associatives, serrés =
// auto-associantes) et peuvent être masquées d'un clic : on voit alors la
// peinture « nue », chaînes et particules seules.
// ---------------------------------------------------------------------------

const STYLE_SCENE = {
  charge: { fond: "#dc2626", bord: "#7f1d1d" }, // mêmes codes que « pigments et charges » du séchage
  polymere: "#4aa3d8",                         // bleu « liant » du séchage
  gant: "#b45309",
  crochet: "#7c3aed",
  assoc: "#0f172a",                            // liaison associative (forte) : longs pointillés
  auto: "#64748b",                             // liaison auto-associante (lâche) : pointillés serrés
  crochetLiaison: "#a855f7",
};

const Pastille = ({ fond, bord, ligne, pointille }) => {
  if (ligne) {
    return <span style={{ display: "inline-block", width: 22, height: 0, borderTop: `2px ${pointille} ${fond}`, verticalAlign: 3, marginRight: 4 }} />;
  }
  return <span style={{ display: "inline-block", width: 11, height: 11, borderRadius: "50%", background: fond, border: `1px solid ${bord || fond}`, verticalAlign: -1, marginRight: 4 }} />;
};

function SceneMoleculaire({ famille, gamma, lambda, doseForte = false, pH = 8.5, masquerLiaisons = false }) {
  const scene = useMemo(
    () => construireScene({ famille, gonflement: famille === "ase" ? fractionIonisee(pH) : 1 }),
    [famille, pH],
  );
  const liaisons = useMemo(
    () => majLiaisons(scene, { gamma, lambda, doseForte }),
    [scene, gamma, lambda, doseForte],
  );
  // Étiquettes « gant » / « crochet » : une seule par type, sous le premier rencontré.
  const premiers = {};
  for (const ch of scene.chaines) for (const g of ch.groupes) if (!(g.type in premiers)) premiers[g.type] = g;
  // Flèches de cisaillement : longueur selon γ̇.
  const amp = (Math.log10(Math.max(gamma, GAMMA_MIN)) + 2) * 4;
  const fleche = (y, s) => (
    <g stroke="#94a3b8" strokeWidth="2" fill="none">
      <line x1={scene.L / 2 - amp * s} y1={y} x2={scene.L / 2 + amp * s} y2={y} />
      <line x1={scene.L / 2 + amp * s} y1={y} x2={scene.L / 2 + amp * s - 8 * s} y2={y - 5 * s} />
    </g>
  );
  return (
    <figure style={{ margin: "10px 0 0", width: "min(100%, 900px)" }}>
      <svg viewBox={`0 0 ${scene.L} ${scene.H}`} role="img"
        aria-label="Scène moléculaire : chaînes de polymère portant des gants ou des crochets, particules de charge, liaisons intermoléculaires en pointillés"
        style={{ width: "100%", display: "block", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6 }}>
        <rect x="0" y="0" width={scene.L} height={scene.H} fill="#f8fafc" />
        {fleche(26, 1)}
        {fleche(scene.H - 26, -1)}
        {/* Liaisons intermoléculaires : toutes en pointillés, masquables. */}
        {!masquerLiaisons && (
          <g>
            {liaisons.auto.map((l, i) => (
              <line key={"a" + i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y}
                stroke={STYLE_SCENE.auto} strokeWidth="2" strokeDasharray="2 6" />
            ))}
            {liaisons.crochet.map((l, i) => (
              <line key={"k" + i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y}
                stroke={STYLE_SCENE.crochetLiaison} strokeWidth="2" strokeDasharray="2 6" />
            ))}
            {liaisons.assoc.map((l, i) => (
              <line key={"s" + i} x1={l.g.x} y1={l.g.y} x2={l.part.x} y2={l.part.y}
                stroke={STYLE_SCENE.assoc} strokeWidth="3" strokeDasharray="8 5" />
            ))}
          </g>
        )}
        {/* Chaînes de polymère (bleu « liant ») et groupes hydrophobes étiquetés. */}
        {scene.chaines.map((ch, ic) => (
          <g key={"ch" + ic}>
            <path d={"M" + ch.points.map((p) => `${p.x},${p.y}`).join(" L")} fill="none"
              stroke={STYLE_SCENE.polymere} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {ch.groupes.map((g, ig) => g.type === "gant" ? (
              <g key={"g" + ig}>
                <circle cx={g.x} cy={g.y} r="9" fill={STYLE_SCENE.gant} />
                {[-0.7, 0, 0.7].map((a, k) => (
                  <circle key={k} cx={g.x + 6.5 * a} cy={g.y - 9} r="4.5" fill={STYLE_SCENE.gant} />
                ))}
                {premiers.gant === g && (
                  <text x={g.x} y={g.y + 34} fontSize="13" fontWeight="700" textAnchor="middle" fill={STYLE_SCENE.gant}>gant</text>
                )}
              </g>
            ) : (
              <g key={"h" + ig}>
                <path d={`M${g.x + 8.25},${g.y - 5.65} A10 10 0 1 1 ${g.x - 8.9},${g.y - 4.5}`}
                  fill="none" stroke={STYLE_SCENE.crochet} strokeWidth="4" strokeLinecap="round" />
                <line x1={g.x - 4} y1={g.y + 10} x2={g.x - 4} y2={g.y + 18} stroke={STYLE_SCENE.crochet} strokeWidth="4" strokeLinecap="round" />
                {premiers.crochet === g && (
                  <text x={g.x} y={g.y + 34} fontSize="13" fontWeight="700" textAnchor="middle" fill={STYLE_SCENE.crochet}>crochet</text>
                )}
              </g>
            ))}
          </g>
        ))}
        {/* Particules : mêmes codes que « pigments et charges » du séchage. */}
        {scene.particules.map((p, i) => (
          <g key={"p" + i}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={STYLE_SCENE.charge.fond} stroke={STYLE_SCENE.charge.bord} strokeWidth="1.5" />
            <text x={p.x} y={p.y + 5} fontSize="13" fontWeight="700" textAnchor="middle"
              fill="#ffffff" stroke="#7f1d1d" strokeWidth="0.5" paintOrder="stroke">{p.nom}</text>
          </g>
        ))}
      </svg>
      <figcaption style={{ fontSize: 13, color: KIT.txt, marginTop: 4, lineHeight: 1.5 }}>
        <b>Comment lire la scène :</b> des chaînes de polymère (bleu) nagent dans la peinture.
        Elles portent des <b style={{ color: STYLE_SCENE.gant }}>gants</b> (qui attrapent une particule,
        liaison associative forte, ou un autre gant, liaison auto-associante lâche) et des
        <b style={{ color: STYLE_SCENE.crochet }}> crochets</b> (qui ne s’accrochent qu’entre eux, jamais à une particule).
        Toutes les liaisons intermoléculaires sont en pointillés : monte γ̇ et regarde lesquelles cèdent.
        <span style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4, fontSize: 12, color: KIT.txt2 }}>
          <span><Pastille fond={STYLE_SCENE.charge.fond} bord={STYLE_SCENE.charge.bord} /> pigments et charges</span>
          <span><Pastille fond={STYLE_SCENE.polymere} /> chaîne de polymère</span>
          <span><Pastille fond={STYLE_SCENE.gant} /> gant</span>
          <span><Pastille fond={STYLE_SCENE.crochet} /> crochet</span>
          <span><Pastille ligne fond={STYLE_SCENE.assoc} pointille="dashed" /> liaison associative (forte)</span>
          <span><Pastille ligne fond={STYLE_SCENE.auto} pointille="dotted" /> liaison auto-associante (lâche)</span>
        </span>
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Courbe η(γ̇) en log-log, avec les bandes de gradient.
// ---------------------------------------------------------------------------

function CourbeLogLog({ series, gammaCur = null }) {
  const refCanvas = useRef(null);
  useEffect(() => {
    const canvas = refCanvas.current;
    const ctx = canvas.getContext("2d");
    const L = 1000, H = 400;
    const marge = { g: 58, d: 14, h: 34, b: 40 };
    const xMin = Math.log10(GAMMA_MIN), xMax = Math.log10(GAMMA_MAX);
    let etaMin = Infinity, etaMax = -Infinity;
    for (const s of series) for (const p of s.points) { etaMin = Math.min(etaMin, p.eta); etaMax = Math.max(etaMax, p.eta); }
    let yMin = Math.max(Math.log10(etaMin) - 0.3, 2);
    let yMax = Math.log10(etaMax) + 0.3;
    if (yMax - yMin < 1.3) { // courbe presque plate : on garde au moins une décade et demie d’échelle
      const m = (yMax + yMin) / 2;
      yMin = m - 0.65; yMax = m + 0.65;
    }
    const px = (g) => marge.g + (Math.log10(g) - xMin) / (xMax - xMin) * (L - marge.g - marge.d);
    const py = (eta) => H - marge.b - (Math.log10(eta) - yMin) / (yMax - yMin) * (H - marge.h - marge.b);
    ctx.clearRect(0, 0, L, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, L, H);
    // Bandes de gradient.
    const teintes = ["#fefce8", "#f0fdf4", "#eff6ff", "#faf5ff"];
    ZONES.forEach((z, i) => {
      ctx.fillStyle = teintes[i];
      ctx.fillRect(px(z.min), marge.h, px(z.max) - px(z.min), H - marge.h - marge.b);
    });
    // Grille et graduations.
    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#475569";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    for (let d = -2; d <= 4; d++) {
      const g = Math.pow(10, d);
      const x = px(g);
      ctx.beginPath(); ctx.moveTo(x, marge.h); ctx.lineTo(x, H - marge.b); ctx.stroke();
      ctx.fillText(fmt(g, d < 0 ? -d : 0), x, H - marge.b + 16);
    }
    ctx.textAlign = "right";
    for (let d = Math.ceil(yMin); d <= Math.floor(yMax); d++) {
      const y = py(Math.pow(10, d));
      ctx.beginPath(); ctx.moveTo(marge.g, y); ctx.lineTo(L - marge.d, y); ctx.stroke();
      ctx.fillText(fmt(Math.pow(10, d), 0), marge.g - 6, y + 4);
    }
    // Noms des zones (abrégés).
    ctx.textAlign = "center";
    ctx.fillStyle = "#334155";
    const nomsZones = ["Sédimentation", "Affaissement / nivellement", "Mélange", "Application"];
    ZONES.forEach((z, i) => {
      const x = (px(z.min) + px(z.max)) / 2;
      if (x > marge.g + 30 && x < L - marge.d - 30) ctx.fillText(nomsZones[i], x, marge.h - 8);
    });
    // Courbes.
    for (const s of series) {
      ctx.beginPath();
      ctx.strokeStyle = s.couleur;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(s.tirets || []);
      s.points.forEach((p, i) => {
        const x = px(p.gamma), y = py(Math.max(p.eta, Math.pow(10, yMin)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Curseur de gradient courant.
    if (gammaCur) {
      const x = px(gammaCur);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x, marge.h); ctx.lineTo(x, H - marge.b); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "#334155";
    ctx.textAlign = "left";
    ctx.fillText("γ̇ (s⁻¹)", L - 70, H - 6);
    ctx.save();
    ctx.translate(14, 60);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("η (mPa·s)", 0, 0);
    ctx.restore();
  }, [series, gammaCur]);
  return <canvas ref={refCanvas} width={1000} height={400} role="img" aria-label="Courbe de la viscosité η en fonction du gradient de vitesse γ̇, échelles logarithmiques"
    style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid #cbd5e1" }} />;
}

// ---------------------------------------------------------------------------
// Courbe 3ITT : η en fonction du temps.
// ---------------------------------------------------------------------------

function Courbe3ITT({ points }) {
  const refCanvas = useRef(null);
  useEffect(() => {
    const canvas = refCanvas.current;
    const ctx = canvas.getContext("2d");
    const L = 1000, H = 340;
    const tMax = points[points.length - 1].t;
    const etaMax = Math.max(...points.map((p) => p.eta)) * 1.12;
    const marge = { g: 62, d: 14, h: 20, b: 36 };
    const px = (t) => marge.g + t / tMax * (L - marge.g - marge.d);
    const py = (eta) => H - marge.b - eta / etaMax * (H - marge.h - marge.b);
    ctx.clearRect(0, 0, L, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, L, H);
    const phases = [{ de: 0, a: 20, coul: "#f1f5f9" }, { de: 20, a: 40, coul: "#fee2e2" }, { de: 40, a: 120, coul: "#f1f5f9" }];
    for (const ph of phases) {
      ctx.fillStyle = ph.coul;
      ctx.fillRect(px(ph.de), marge.h, px(ph.a) - px(ph.de), H - marge.h - marge.b);
    }
    ctx.fillStyle = "#475569";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    for (const t of [0, 20, 40, 120]) ctx.fillText(fmt(t, 0) + " s", px(t), H - marge.b + 16);
    ctx.textAlign = "right";
    ctx.strokeStyle = "#e2e8f0";
    const pas = etaMax / 4;
    for (let i = 0; i <= 4; i++) {
      const y = py(pas * i);
      ctx.beginPath(); ctx.moveTo(marge.g, y); ctx.lineTo(L - marge.d, y); ctx.stroke();
      ctx.fillText(fmt(pas * i, 0), marge.g - 6, y + 4);
    }
    ctx.beginPath();
    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 2.5;
    points.forEach((p, i) => {
      const x = px(p.t), y = py(p.eta);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "#334155";
    ctx.textAlign = "left";
    ctx.fillText("t (s)", L - 60, H - 4);
    ctx.fillText("η (mPa·s)", 14, 34);
  }, [points]);
  return <canvas ref={refCanvas} width={1000} height={340} role="img" aria-label="Courbe de la viscosité η en fonction du temps pendant le test en trois intervalles"
    style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid #cbd5e1" }} />;
}

// ---------------------------------------------------------------------------
// Zoom moléculaire + curseur de gradient (utilisé en guide et en exploration).
// Les options montrerCourbe / montrerLambda servent au parcours guidé progressif.
// ---------------------------------------------------------------------------

function ZoomGradient({ famille, setFamille, gamma, setGamma, pH = 8.5, setPH, doseForte = false, setDoseForte,
  onHautGradient, famillesDispos, montrerCourbe = true, montrerLambda = true }) {
  const cin = cinetiqueReseau(famille, doseForte);
  const [masquerLiaisons, setMasquerLiaisons] = useState(false);
  const lambda = cin ? lambdaStatio(gamma, cin) : 1;
  const eta = etaInstantane(famille, gamma, lambda, { pH, doseForte });
  const serieStatio = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 90; i++) {
      const g = GAMMA_MIN * Math.pow(GAMMA_MAX / GAMMA_MIN, i / 90);
      points.push({ gamma: g, eta: etaStatio(famille, g, { pH, doseForte }) });
    }
    return { points, couleur: INFOS_FAMILLE[famille].couleur, libelle: INFOS_FAMILLE[famille].nom };
  }, [famille, pH, doseForte]);
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {(famillesDispos || ["hase", "heur", "ase"]).map((f) => (
          <button key={f} type="button" style={stylePetitBouton(famille === f, INFOS_FAMILLE[f].couleur)}
            aria-pressed={famille === f} onClick={() => setFamille(f)}>{INFOS_FAMILLE[f].nom}</button>
        ))}
        <span style={{ fontSize: 12.5, color: KIT.txt2 }}>{INFOS_FAMILLE[famille].produit}</span>
        {famille === "heur" && setDoseForte && (
          <button type="button" style={stylePetitBouton(doseForte, "#7c3aed")} aria-pressed={doseForte}
            onClick={() => setDoseForte(!doseForte)}>dose forte</button>
        )}
      </div>
      {famille === "ase" && setPH && (
        <div style={{ marginTop: 8, fontSize: 13, color: KIT.txt2 }}>
          pH du milieu : {fmt(pH, 1)}
          <input type="range" min={3} max={9} step={0.1} value={pH} aria-label="pH du milieu"
            onChange={(e) => setPH(Number(e.target.value))} style={{ width: "100%", maxWidth: 320, marginLeft: 10 }} />
          <span> livré à pH 3, épaissit une fois neutralisé (pH 8-9)</span>
        </div>
      )}
      <SceneMoleculaire famille={famille} gamma={gamma} lambda={lambda} doseForte={doseForte} pH={pH} masquerLiaisons={masquerLiaisons} />
      <button type="button" style={{ ...stylePetitBouton(masquerLiaisons, "#64748b"), marginTop: 8 }} aria-pressed={masquerLiaisons}
        onClick={() => setMasquerLiaisons((m) => !m)}>
        {masquerLiaisons ? "Afficher les liaisons" : "Masquer les liaisons"}
      </button>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 13.5, color: KIT.txt2 }}>
          Gradient de vitesse γ̇ = {fmt(gamma, gamma < 10 ? 2 : 0)} s⁻¹ · zone : {zoneDeGradient(gamma)}
        </div>
        <input type="range" min={Math.log10(GAMMA_MIN)} max={Math.log10(GAMMA_MAX)} step={0.01}
          value={Math.log10(gamma)} style={{ width: "100%" }} aria-label="Gradient de vitesse γ̇ (échelle logarithmique)"
          onChange={(e) => {
            const g = Math.pow(10, Number(e.target.value));
            setGamma(g);
            if (onHautGradient && g >= 1000) onHautGradient();
          }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <LigneMesure nom="γ̇ (s⁻¹)" valeur={fmt(gamma, gamma < 10 ? 2 : 0)} couleur="#dc2626" />
        <LigneMesure nom="η (mPa·s)" valeur={fmt(eta, 0)} couleur={INFOS_FAMILLE[famille].couleur} />
        {cin && montrerLambda && <LigneMesure nom="λ (réseau reconstruit)" valeur={fmt(lambda, 2)} couleur="#7c3aed" />}
      </div>
      {montrerCourbe && (
        <>
          <div style={{ marginTop: 8 }}>
            <CourbeLogLog series={[serieStatio]} gammaCur={gamma} />
          </div>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
            Courbe : viscosité en régime permanent. La ligne rouge pointillée suit le curseur γ̇.
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Banc d’exploration : rampe aller-retour et test 3ITT.
// En parcours guidé, la régénération M1 est masquée tant que l’élève ne l’a pas calculée.
// ---------------------------------------------------------------------------

function BancExploration({ famille, doseForte, pH, avecITT = true, masquerRegeneration = false }) {
  const cleReglage = `${famille}|${doseForte}|${pH}`;
  const [mesure, setMesure] = useState({ cle: cleReglage, rampe: null, itt: null });
  // Les courbes ne suivent plus si le réglage change : on les ignore.
  const rampe = mesure.cle === cleReglage ? mesure.rampe : null;
  const itt = mesure.cle === cleReglage ? mesure.itt : null;
  const setRampe = (r) => setMesure({ cle: cleReglage, rampe: r, itt: null });
  const setItt = (i) => setMesure({ cle: cleReglage, rampe: null, itt: i });
  const lancerRampe = () => { setRampe(simulerRappe({ famille, doseForte, pH })); };
  const lancer3ITT = () => { setItt(simuler3ITT({ famille, doseForte, pH })); };
  const series = [];
  if (rampe) {
    series.push({ points: rampe.montee, couleur: "#1d4ed8", tirets: [], libelle: "montée" });
    series.push({ points: rampe.descente, couleur: "#dc2626", tirets: [8, 6], libelle: "descente" });
  }
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="button" style={styleBouton(true)} onClick={lancerRampe}>Rampe aller-retour</button>
        {avecITT && <button type="button" style={styleBouton(true)} onClick={lancer3ITT}>Test 3ITT</button>}
        {(rampe || itt) && (
          <button type="button" style={stylePetitBouton(false, "#64748b")} onClick={() => setRampe(null)}>Effacer</button>
        )}
      </div>
      {rampe && (
        <div style={{ marginTop: 8 }}>
          <CourbeLogLog series={series} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            <LigneMesure nom="Hystérésis moyenne (mPa·s)" valeur={fmt(hysteresisMoyenne(rampe), 0)} couleur="#dc2626" />
          </div>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
            Montée en bleu plein, descente en rouge pointillé. Une descente sous la montée, c’est de la thixotropie :
            les liaisons cassées au cisaillement ne se sont pas encore reformées.
          </div>
        </div>
      )}
      {itt && (
        <div style={{ marginTop: 8 }}>
          <Courbe3ITT points={itt.points} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            <LigneMesure nom="η initiale (mPa·s)" valeur={fmt(itt.etaRef, 0)} couleur="#1d4ed8" />
            <LigneMesure nom="η finale (mPa·s)" valeur={fmt(itt.etaFinal, 0)} couleur="#7c3aed" />
            {!masquerRegeneration && (
              <LigneMesure nom="Régénération M1 (%)" valeur={fmt(itt.regeneration, 1)} couleur={itt.regeneration > 99 ? "#15803d" : "#b45309"} />
            )}
          </div>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
            20 s à γ̇ = 1 s⁻¹, 20 s à 256 s⁻¹, 80 s à 1 s⁻¹. Régénération = η finale / η initiale × 100 (méthode M1).
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volet défi : une fiche tirée au hasard, un tableau de mesures, quatre questions.
// ---------------------------------------------------------------------------

function VoletDefi({ onValide }) {
  const [defi, setDefi] = useState(() => questionsDefi(tirerFicheTDS()));
  const [choix, setChoix] = useState({ q1: null, q2: null, q4: null });
  const [saisie, setSaisie] = useState("");
  const [verifie, setVerifie] = useState(false);
  const justes = useMemo(() => ({
    q1: choix.q1 === defi.q1.bonne,
    q2: choix.q2 === defi.q2.bonne,
    q3: proche(lireNombre(saisie), defi.q3.vrai, 0.05),
    q4: choix.q4 === defi.q4.bonne,
  }), [choix, saisie, defi]);
  const toutesJustes = justes.q1 && justes.q2 && justes.q3 && justes.q4;
  const reinitialiser = () => {
    setDefi(questionsDefi(tirerFicheTDS()));
    setChoix({ q1: null, q2: null, q4: null });
    setSaisie("");
    setVerifie(false);
  };
  const indices = {
    q1: "Repère les mots d’architecture : « alcali-gonflable », « acrylique associatif », « polyuréthane ». Le profil annoncé (« newtonien », « pseudoplastique ») décrit le produit, pas sa famille.",
    q2: "Compare les deux viscosités du tableau : une viscosité qui ne change pas quand γ̇ augmente est celle d’un produit newtonien ; une viscosité qui baisse nettement, celle d’un produit rhéofluidifiant.",
    q4: "Un polymère sans modification hydrophobe ne peut faire aucune liaison associative.",
  };
  const blocQcm = (cle, q) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.q}</div>
      {q.options.map((o, i) => (
        <button key={i} type="button" style={{
          ...stylePetitBouton(choix[cle] === i, verifie && i === q.bonne ? "#15803d" : "#64748b"),
          display: "block", width: "100%", textAlign: "left", marginBottom: 4,
        }} onClick={() => { setChoix((c) => ({ ...c, [cle]: i })); setVerifie(false); }}>
          {verifie && i === q.bonne ? "✓ " : choix[cle] === i && verifie ? "✗ " : ""}{o}
        </button>
      ))}
      {verifie && <div style={{ fontSize: 13.5, color: justes[cle] ? "#15803d" : "#b91c1c" }}>
        {justes[cle] ? "Bien vu !" : "La bonne réponse est signalée en vert."}
      </div>}
      <IndiceDefi cache={verifie && justes[cle]}>{indices[cle]}</IndiceDefi>
    </div>
  );
  return (
    <div style={styleBoite}>
      <div style={{ fontWeight: 600 }}>Fiche technique tirée au hasard</div>
      <div style={{ background: "#fffbeb", borderRadius: 8, padding: 10, marginTop: 6, fontSize: 14, color: KIT.txt }}>
        <div style={{ fontWeight: 700 }}>« {defi.fiche.nom} »</div>
        <div>« {defi.fiche.extraits[0]} »</div>
        <div>« {defi.fiche.extraits[1]} »</div>
        <table style={{ borderCollapse: "collapse", marginTop: 8, fontSize: 13.5 }}>
          <tbody>
            <tr>
              <th style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", background: "#f1f5f9" }}>γ̇ (s⁻¹)</th>
              <th style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", background: "#f1f5f9" }}>η (mPa·s)</th>
            </tr>
            {defi.fiche.mesures.map((m) => (
              <tr key={m.gamma}>
                <td style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", textAlign: "center", fontWeight: 700 }}>{fmt(m.gamma, 0)}</td>
                <td style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", textAlign: "center" }}>{fmt(m.eta, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" style={{ ...styleBouton(false), marginTop: 8 }} onClick={reinitialiser}><Pic n="refresh" />Nouvelles données</button>
      <div style={{ marginTop: 10 }}>
        {blocQcm("q1", defi.q1)}
        {blocQcm("q2", defi.q2)}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{defi.q3.q}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input value={saisie} onChange={(e) => { setSaisie(e.target.value); setVerifie(false); }} inputMode="decimal" aria-label="Rapport des viscosités"
              placeholder="Réponse" style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #cbd5e1", width: 140 }} />
            <span style={{ fontSize: 13, color: KIT.txt2 }}>(sans unité)</span>
          </div>
          {verifie && <div style={{ fontSize: 13.5, color: justes.q3 ? "#15803d" : "#b91c1c" }}>
            {justes.q3 ? "Bien vu !" : `Attendu : environ ${fmt(defi.q3.vrai, 2)}.`}
          </div>}
          <IndiceDefi cache={verifie && justes.q3}>
            Rapport = η(1 s⁻¹) divisée par η(100 s⁻¹) : lis les deux valeurs du tableau. Un arrondi à 2 chiffres significatifs est accepté (5 % près).
          </IndiceDefi>
        </div>
        {blocQcm("q4", defi.q4)}
      </div>
      <button type="button" style={styleBouton(true, "#16a34a")} onClick={() => { setVerifie(true); onValide(toutesJustes); }}>✓ Vérifier</button>
      <div style={{ marginTop: 8, fontSize: 14, color: KIT.txt }}>
        {verifie ? (toutesJustes ? "🎉 Quatre réponses exactes : cette fiche n’a plus de secret pour toi."
          : `Score : ${[justes.q1, justes.q2, justes.q3, justes.q4].filter(Boolean).length} / 4. Relance de nouvelles données pour retenter.`)
          : "Réponds aux quatre questions, puis vérifie."}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hypothèses de travail (panneau obligatoire, visible en exploration, en défi
// et à la fin du parcours guidé).
// ---------------------------------------------------------------------------

function Hypotheses() {
  return (
    <ul style={{ margin: "6px 0", paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li>Milieu (eau + polymère hors réseau) traité newtonien : η<sub>inf</sub> = {fmt(PARAMS.hase.etaInf, 0)} mPa·s.</li>
      <li>Notre Thixol 53 L (HASE) : tout le réseau auto-associé est résumé dans un paramètre de structure λ,
        avec dλ/dt = (1 − λ)/τ − k·γ̇·λ (cassage rapide, reformation lente : τ = {fmt(PARAMS.hase.tauRec, 0)} s).
        La rhéofluidification et la thixotropie sortent de cette seule équation.</li>
      <li>Le HASE est modélisé neutralisé (pH 8-9, état d’emploi). Comme l’ASE, il est livré à pH acide (pH 3 pour le Thixol) :
        sa dépendance au pH n’est pas modélisée, seule celle de l’ASE l’est.</li>
      <li>Notre Coapur 3025 (HEUR) : liaisons gant-particule tenues, donc η quasi constant (variation &lt; 8 %) ;
        à dose forte, un réseau auto-associé s’ajoute (τ = {fmt(PARAMS.heur.tauRecAuto, 0)} s).</li>
      <li>Chaque modèle décrit un PRODUIT, pas une architecture : selon les fonctions chimiques greffées
        (densité de greffons, nature des gants et des crochets, masse), un autre HASE ou un autre HEUR
        aurait un autre profil.</li>
      <li>ASE : gonflement par neutralisation (fraction ionisée 1/(1 + 10<sup>pKa − pH</sup>), pKa = {fmt(PARAMS.ase.pKa, 1)}) ;
        pas de modification hydrophobe, donc aucune liaison associative.</li>
      <li>Calibration : les fiches techniques donnent des viscosités Brookfield à 10 et 100 tr/min
        (environ 9 000 et 1 500 mPa·s pour le Thixol). Le modèle en reprend l’ordre de grandeur
        (environ 11 000 mPa·s à 1 s⁻¹ et 1 500 mPa·s à 100 s⁻¹) et le rapport de 6 à 7. La conversion tr/min → s⁻¹
        dépend du mobile et de la géométrie : ce n’est pas une équivalence exacte, la courbe n’est pas un ajustement des mesures.</li>
      <li>Gants et crochets : c’est la convention du TP. En réalité, les groupes hydrophobes d’un HASE ou d’un HEUR
        peuvent aussi s’adsorber sur les particules ; la distinction « le crochet ne touche jamais une particule » est une simplification pédagogique.</li>
      <li>Rampe : chaque gradient est maintenu 0,8 s. Test 3ITT : 20 s à 1 s⁻¹, 20 s à 256 s⁻¹, 80 s à 1 s⁻¹.</li>
      <li>La scène moléculaire est un dessin pédagogique : une chaîne réelle porte des milliers de motifs,
        et les échelles de taille et de temps ne sont pas réalistes.</li>
      <li>En exploration, λ affiché correspond au régime permanent du gradient choisi ;
        la mémoire du réseau se voit sur la rampe aller-retour et le test 3ITT.</li>
    </ul>
  );
}

const RETENIR_ESSENTIEL = (
  <>
    <div>🧤 Liaison associative = gant + particule : forte, difficile à défaire.</div>
    <div>🪝 Liaison auto-associante = gant + gant ou crochet + crochet : lâche, facile à défaire.
      Dans la convention du TP, le crochet ne touche jamais une particule.</div>
    <div>Architecture ≠ comportement : « HASE » ou « HEUR » désigne un squelette et un greffon,
      pas un profil. Ce sont les fonctions chimiques portées qui décident.</div>
    <div>Notre Thixol 53 L (HASE) : surtout des liaisons auto-associantes → η forte à bas gradient,
      effondrée à haut gradient, thixotrope.</div>
    <div>Notre Coapur 3025 (HEUR) : liaisons gant-particule tenues → η quasi constante,
      pas thixotrope (sauf dose forte).</div>
    <div>ASE : pas de modification hydrophobe → épaissit par gonflement après neutralisation (pH 8-9).</div>
  </>
);

// ---------------------------------------------------------------------------
// Composant principal.
// ---------------------------------------------------------------------------

export function SimulationEpaisseursAssociatifs() {
  const [mode, setMode] = useState(() => modeOuverture("epaisseurs-v1"));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant("epaisseurs-v1", { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [montages, setMontages] = useState({ hase: {}, heur: {} });
  const [aExploreHaut, setAExploreHaut] = useState(false);
  const [gammaGuide, setGammaGuide] = useState(0.1);
  const [familleGuide, setFamilleGuide] = useState("hase");
  const [familleExplo, setFamilleExplo] = useState("hase");
  const [gammaExplo, setGammaExplo] = useState(0.1);
  const [pHExplo, setPHExplo] = useState(8.5);
  const [doseForteExplo, setDoseForteExplo] = useState(false);
  const [ouvHyp, setOuvHyp] = useState(false);

  const montagesOK = montagesSontCorrects(montages);

  const etapes = [
    {
      titre: "Lire deux fiches techniques",
      texte: "Voici les fiches de deux additifs rhéologiques du même fournisseur. Lis-les avec attention : " +
        "les mots anglais disent le comportement du produit.",
      tache: {
        type: "qcm",
        q: "D’après ces fiches, lequel offre une viscosité indépendante du gradient de vitesse ?",
        options: ["Le Thixol 53 L", "Le Coapur 3025", "Les deux", "Aucun des deux"],
        bonne: 1,
        indice: "« Pure Newtonian » signifie : η constant, quel que soit γ̇. Cherche cette expression dans les fiches.",
        expl: <>Le Coapur 3025 est annoncé « pure Newtonian » : η ne dépend pas de γ̇.
          Le Thixol 53 L, lui, est « strongly pseudoplastic » : η s’effondre quand γ̇ monte.</>,
      },
    },
    {
      titre: "Construire les molécules",
      texte: "Un HASE se synthétise à partir de l’acide méthacrylique et de l’acrylate d’éthyle, " +
        "puis on greffe un acrylate à longue chaîne carbonée : la modification hydrophobe. " +
        "Un HEUR enchaîne des motifs éthoxylés (polyoxyéthylène) reliés par des motifs uréthane, terminés par une longue chaîne grasse.",
      tache: {
        type: "action",
        ok: montagesOK,
        label: "Le faire pour moi",
        faire: () => setMontages({ hase: { ...CIBLES.hase.correct }, heur: { ...CIBLES.heur.correct } }),
        consigne: "Assemble les deux molécules avec les bons motifs, à l’aide de l’atelier.",
        indice: "Dans chaque molécule, un seul motif est hydrophobe : celui qui porte la longue chaîne carbonée. Les autres motifs construisent le squelette hydrophile.",
      },
    },
    {
      titre: "Gants et crochets",
      texte: "Sur un épaississant associatif, les modifications hydrophobes ne se ressemblent pas toutes. " +
        "Dans le TP, on les dessine comme des gants de baseball ou comme des crochets. " +
        "Touche chacun dans le panneau pour voir avec quoi il peut interagir, puis réponds.",
      tache: {
        type: "qcm",
        q: "Un groupe hydrophobe de type crochet peut-il interagir avec une particule de TiO₂ ?",
        options: ["Oui : c’est une liaison associative", "Non : il ne s’associe qu’avec un autre groupe hydrophobe", "Oui, mais seulement à pH 8-9", "Non, il ne peut s’associer avec rien du tout"],
        bonne: 1,
        indice: "Teste le gant, le crochet et la particule dans le panneau : qui peut attraper qui ?",
        expl: <>Le crochet ne s’accroche qu’à un autre crochet : ces interactions sont lâches et faciles à défaire.
          Seuls les gants attrapent les particules (liaison associative, forte).</>,
      },
    },
    {
      titre: "Monter le gradient",
      texte: "Voici le zoom sur la peinture. À bas gradient, le réseau du HASE est intact : " +
        "la peinture tient au mur et la charge ne sédimente pas. Monte le curseur " +
        "jusqu’à la zone d’application (au-delà de 1 000 s⁻¹) et regarde quelles liaisons lâchent.",
      tache: {
        type: "action",
        ok: aExploreHaut,
        label: "Le faire pour moi",
        faire: () => { setGammaGuide(2000); setAExploreHaut(true); },
        consigne: "Monte le curseur γ̇ au-delà de 1 000 s⁻¹, puis compare le Thixol (HASE) et le Coapur (HEUR).",
        indice: "Sur la scène, regarde quelles liaisons cèdent en premier : les pointillés serrés entre gants (auto-associantes, lâches) ou les longs pointillés gant-particule (associatives, fortes) ?",
      },
    },
    {
      titre: "Viscosité à bas gradient",
      texte: "Le gradient est faible dans le pot (sédimentation : 0,01-0,1 s⁻¹) et sur le mur frais " +
        "(affaissement et nivellement : 0,1-3 s⁻¹). La courbe η(γ̇) apparaît : compare les deux produits dans ces zones.",
      tache: {
        type: "qcm",
        q: "Lequel assure une forte viscosité à bas gradient et empêche la sédimentation en pot ?",
        options: ["Le Coapur 3025 (HEUR)", "Le Thixol 53 L (HASE)", "Les deux également", "Aucun des deux"],
        bonne: 1,
        indice: "Descends le curseur γ̇ sous 0,1 s⁻¹ et compare les viscosités affichées pour chacun des deux produits.",
        expl: <>À bas gradient, le réseau auto-associé du Thixol est intact : η est forte.
          Sa fiche l’annonce : « prevents settling and sagging ». Le Coapur, quasi newtonien,
          garde une viscosité moyenne : il n’est pas fait pour ça.</>,
      },
    },
    {
      titre: "Viscosité à haut gradient",
      texte: "Au rouleau ou au pinceau, on impose γ̇ ≈ 500-10 000 s⁻¹ : c’est la zone d’application. " +
        "Une viscosité bien réglée là, c’est moins d’éclaboussures et un bon pouvoir garnissant.",
      tache: {
        type: "qcm",
        q: "Lequel ajuste la viscosité à haut gradient (application au rouleau) ?",
        options: ["Le Coapur 3025 (HEUR)", "Le Thixol 53 L (HASE)", "Les deux également", "Aucun des deux"],
        bonne: 0,
        indice: "Remonte le curseur γ̇ vers 1 000-10 000 s⁻¹ et compare les viscosités affichées.",
        expl: <>Sa fiche l’annonce : « spatter resistance », « film build », « levelling ».
          Le Coapur, notre HEUR, garde sa viscosité car ses liaisons gant-particule tiennent bon.
          Le Thixol, notre HASE, a cassé son réseau : sa viscosité s’est effondrée.</>,
      },
    },
    {
      titre: "Qui est thixotrope ?",
      texte: "Thixotrope, c’est une viscosité qui met du temps à revenir après un cisaillement. " +
        "Lance la rampe aller-retour pour chaque produit : on monte γ̇, puis on le redescend. " +
        "Regarde la valeur de λ, la part du réseau reconstruit, et compare la montée et la descente.",
      tache: {
        type: "qcm",
        q: "Lequel des deux apporte de la thixotropie ?",
        options: ["Le Coapur 3025 (HEUR)", "Le Thixol 53 L (HASE)", "Les deux", "Aucun des deux"],
        bonne: 1,
        indice: "Sur la rampe, la descente est-elle superposée à la montée ? Qui doit reformer des liaisons, et à quelle vitesse ?",
        expl: <>Les liaisons auto-associantes du Thixol cassent à haut gradient et mettent du temps à se reformer :
          la viscosité revient lentement, c’est la thixotropie. Le Coapur, à dose normale, ne casse rien :
          sa structure ne dépend pas du gradient, aucune raison d’être thixotrope.</>,
      },
    },
    {
      titre: "Architecture et comportement",
      texte: "Attention, une idée reçue à démonter : « HASE » ou « HEUR » ne décrit pas un comportement, " +
        "mais une architecture : le squelette du polymère et la façon d’y greffer les motifs hydrophobes. " +
        "Le profil rhéologique vient des fonctions chimiques portées : nature des greffons " +
        "(gants ou crochets), densité de greffage, masse du polymère. Dans ce TP, notre HASE Thixol 53 L est " +
        "pseudoplastique thixotrope et notre HEUR Coapur 3025 quasi newtonien ; mais des produits d’une même famille " +
        "peuvent avoir des profils différents.",
      tache: {
        type: "qcm",
        q: "Que détermine le sigle « HASE » ou « HEUR » d’un épaississant ?",
        options: [
          "Un profil imposé : un HASE est toujours pseudoplastique et thixotrope",
          "Une architecture : squelette et greffage des motifs hydrophobes, pas un comportement",
          "Rien : c’est un simple nom commercial sans lien avec la chimie",
          "La viscosité à bas gradient, fixée par la famille",
        ],
        bonne: 1,
        indice: "Relis les deux fiches : les comportements annoncés (« pseudoplastique », « newtonien ») sont des propriétés de ces produits précis. Que reste-t-il alors derrière le sigle ?",
        expl: <>« HASE » et « HEUR » décrivent l’architecture (squelette acrylique ou polyuréthane, motifs
          éthoxylés, greffons hydrophobes). Le comportement vient des fonctions chimiques effectivement
          portées. D’où l’intérêt de lire la fiche technique du produit plutôt que de se fier au sigle.</>,
      },
    },
    {
      titre: "Mesurer la régénération",
      texte: "Le test en trois intervalles (3ITT) cisaille la peinture : 20 s à γ̇ = 1 s⁻¹, " +
        "20 s à 256 s⁻¹, puis 80 s de repos à 1 s⁻¹. Garde le Thixol (HASE) sélectionné, lance le test, puis calcule la régénération.",
      tache: {
        type: "num",
        q: `Le test affiche η initiale = ${fmt(ITT_HASE.etaRef, 0)} mPa·s et η finale (t = 120 s) = ${fmt(ITT_HASE.etaFinal, 0)} mPa·s. Calculer la régénération M1 (η finale / η initiale × 100).`,
        unite: "%",
        vrai: ITT_HASE.regeneration,
        tol: 0.04,
        detail: true,
        expl: <>Régénération = η finale / η initiale × 100 : {fmt(ITT_HASE.etaFinal, 0)} / {fmt(ITT_HASE.etaRef, 0)} × 100 = {fmt(ITT_HASE.regeneration, 1)} %.
          Le réseau n’est pas entièrement reconstruit après 80 s.</>,
        calcul: () => [
          `η finale / η initiale = ${fmt(ITT_HASE.etaFinal, 0)} / ${fmt(ITT_HASE.etaRef, 0)} = ${fmt(ITT_HASE.etaFinal / ITT_HASE.etaRef, 3)}`,
          `× 100 : ${fmt(ITT_HASE.regeneration, 1)} %`,
        ],
        pieges: [
          [100, "Non : 100 % voudrait dire que toutes les liaisons se sont reformées en 80 s. Elles sont lentes !"],
          [ITT_HASE.etaFinal / ITT_HASE.etaRef, "Pense à multiplier par 100 pour exprimer le résultat en pourcentage."],
        ],
        indice: "Applique la définition de M1 avec les deux valeurs de l’énoncé.",
      },
    },
    {
      titre: "Le formulateur",
      texte: "Un formulateur veut une peinture mate : une tenue en pot sans sédimentation, " +
        "pas d’affaissement sur le mur, mais aussi zéro éclaboussure au rouleau et un film bien garni.",
      tache: {
        type: "qcm",
        q: "Que recommandent les fiches des deux produits ?",
        options: ["Le Thixol 53 L seul, à forte dose", "Le Coapur 3025 seul, à forte dose", "La combinaison des deux", "Aucun épaississant"],
        bonne: 2,
        indice: "Chaque additif couvre sa zone de gradient : bas gradient pour l’un, haut gradient pour l’autre.",
        expl: <>Le Thixol couvre le bas gradient (pot, mur frais), le Coapur le haut gradient (application).
          Combiner les deux permet à chaque produit de faire ce qu’il sait faire.</>,
      },
    },
  ];

  const dernier = etapes.length - 1;
  const finParcours = !!(guide.reussies && guide.reussies[dernier]);
  const fin = finParcours
    ? <button type="button" style={styleBouton(true, "#16a34a")} onClick={() => setMode("explore")}>Passer à l’exploration ▶</button>
    : null;
  const regenReussie = !!(guide.reussies && guide.reussies[8]);

  // Panneau de gauche selon l’étape : on n’introduit un élément que lorsqu’une étape s’en sert.
  const panneauGuide = () => {
    const e = Math.min(guide.etape, etapes.length - 1);
    if (e === 0) return <FichesTDS />;
    if (e === 1) return <AtelierMotifs montages={montages} setMontages={setMontages} />;
    if (e === 2) return <PanneauLiaisons />;
    return (
      <>
        <ZoomGradient famille={familleGuide} setFamille={setFamilleGuide}
          famillesDispos={["hase", "heur"]}
          gamma={gammaGuide} setGamma={setGammaGuide} onHautGradient={() => setAExploreHaut(true)}
          montrerCourbe={e >= 4} montrerLambda={e >= 6} />
        {e >= 6 && (
          <BancExploration famille={familleGuide} doseForte={false} pH={8.5}
            avecITT={e >= 8} masquerRegeneration={!regenReussie} />
        )}
      </>
    );
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Épaississants associatifs : ASE, HASE, HEUR</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>

      {mode === "guide" && (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start", marginTop: 10 }}>
            <div style={{ flex: "2 1 420px", minWidth: 280 }}>{panneauGuide()}</div>
            <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 10 }}>
              <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={fin} />
            </div>
          </div>
          {finParcours && (
            <div style={{ marginTop: 10 }}>
              <ARetenir titre="À RETENIR">{RETENIR_ESSENTIEL}</ARetenir>
            </div>
          )}
        </>
      )}

      {mode === "explore" && (
        <>
          <ZoomGradient
            famille={familleExplo} setFamille={setFamilleExplo}
            famillesDispos={["hase", "heur", "ase"]}
            gamma={gammaExplo} setGamma={setGammaExplo}
            pH={pHExplo} setPH={setPHExplo}
            doseForte={doseForteExplo} setDoseForte={setDoseForteExplo}
          />
          <BancExploration famille={familleExplo} doseForte={doseForteExplo} pH={pHExplo} />
          <div style={{ marginTop: 10 }}>
            <ARetenir titre="À RETENIR">{RETENIR_ESSENTIEL}</ARetenir>
          </div>
        </>
      )}

      {mode === "defi" && (
        <div style={{ ...styleBoite, marginTop: 10 }}>
          <VoletDefi onValide={(ok) => noterDefi(ok)} />
          <SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} />
        </div>
      )}

      {(mode !== "guide" || finParcours) && (
        <div style={{ ...styleBoite, marginTop: 12 }}>
          <Section titre="Hypothèses de travail" ouvert={ouvHyp} onBascule={() => setOuvHyp((o) => !o)}>
            <Hypotheses />
          </Section>
        </div>
      )}
    </div>
  );
}
