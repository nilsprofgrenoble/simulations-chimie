// Vue — simulation « Épaississants associatifs : ASE, HASE, HEUR » (BTS MDC, formulation).
// Modèle pur : epaisseursAssociatifsModele.js ; tests : epaisseursAssociatifsModele.test.mjs ;
// banque d'exercices : BanqueRheologieBTS.js.
// Aucune bibliothèque externe : scène moléculaire en SVG, courbes en canvas 2D natif.
// Parcours guidé progressif : à chaque étape, seuls les éléments utiles sont à l'écran.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, Curseur, LigneMesure, ARetenir, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { SceneMoleculaire, LegendeScene, IconeGant, IconeCrochet, IconeParticule } from "./EpaisseursScene";
import {
  PARAMS, ZONES, zoneDeGradient,
  lambdaStatio, cinetiqueReseau, etaStatio, etaInstantane,
  simulerRappe, hysteresisMoyenne, simuler3ITT,
  tirerFicheTDS, questionsDefi, etaPeinture, evaluerPeinture, DOSES_REF, PEINTURES_MESUREES, GAMMAS_PEINTURES,
} from "./epaisseursAssociatifsModele";

const SIM_ID = 100;
declarerDefis(SIM_ID, [["principal", "Lire une fiche d’épaississant"]]);

const GAMMA_MIN = 0.01;
const GAMMA_MAX = 10000;

const INFOS_FAMILLE = {
  ase: { nom: "ASE", bouton: "ASE", produit: "un ASE : acrylique alcali-gonflable, sans modification hydrophobe", couleur: "#0d9488" },
  hase: { nom: "HASE", bouton: "Thixol 53 L", produit: "un HASE : acrylique associatif", couleur: "#1d4ed8" },
  heur: { nom: "HEUR", bouton: "Coapur 3025", produit: "un HEUR : polyuréthane éthoxylé associatif", couleur: "#b45309" },
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
  const carte = (titre, icone, cle) => (
    <button type="button" aria-pressed={groupe === cle} onClick={() => setGroupe(cle)} style={{
      flex: "1 1 140px", minWidth: 120, padding: 10, borderRadius: 10, cursor: "pointer",
      border: groupe === cle ? "2px solid #1d4ed8" : "1px solid #cbd5e1", background: "#fff",
    }}>
      <div style={{ display: "flex", justifyContent: "center" }}>{icone}</div>
      <div style={{ fontWeight: 600, fontSize: 13, color: KIT.txt }}>{titre}</div>
    </button>
  );
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "stretch" }}>
        {carte("Gant de baseball", <IconeGant />, "gant")}
        {carte("Crochet", <IconeCrochet />, "crochet")}
        {carte("Particule (TiO₂)", <IconeParticule />, "particule")}
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
// Graphiques : le canevas prend la largeur réelle de l’écran (police 12 px et marges en pixels réels),
// donc lisible sur téléphone ; plus haut en proportion quand l’écran est étroit.
// ---------------------------------------------------------------------------

function Toile({ dessiner, ratio, aria }) {
  const boite = useRef(null);
  const canvas = useRef(null);
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    const el = boite.current;
    const mesurer = () => setLargeur(Math.round(el.getBoundingClientRect().width));
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const etroit = largeur > 0 && largeur < 520;
  const hauteur = Math.round(largeur * (etroit ? Math.max(ratio, 0.8) : ratio));
  useEffect(() => {
    if (!largeur) return;
    const c = canvas.current;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(largeur * dpr); c.height = Math.round(hauteur * dpr);
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 1; ctx.globalAlpha = 1; ctx.setLineDash([]); ctx.lineCap = "butt";
    ctx.clearRect(0, 0, largeur, hauteur);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, largeur, hauteur);
    ctx.font = "12px sans-serif";
    dessiner(ctx, largeur, hauteur, etroit);
  }, [dessiner, largeur, hauteur, etroit]);
  return (
    <div ref={boite} style={{ width: "100%" }}>
      <canvas ref={canvas} role="img" aria-label={aria} style={{ width: largeur || "100%", height: hauteur || 0, display: "block", borderRadius: 10, border: "1px solid #cbd5e1" }} />
    </div>);
}

// ---------------------------------------------------------------------------
// Courbe η(γ̇) en log-log, avec les bandes de gradient.
// ---------------------------------------------------------------------------

function CourbeLogLog({ series, gammaCur = null, cibles = [] }) {
  const dessiner = useCallback((ctx, L, H, etroit) => {
    const marge = { g: 54, d: 10, h: 38, b: 38 };
    const xMin = Math.log10(GAMMA_MIN), xMax = Math.log10(GAMMA_MAX);
    let etaMin = Infinity, etaMax = -Infinity;
    for (const s of series) for (const p of s.points) { etaMin = Math.min(etaMin, p.eta); etaMax = Math.max(etaMax, p.eta); }
    for (const c of cibles) { etaMin = Math.min(etaMin, c.min); etaMax = Math.max(etaMax, c.max); }
    let yMin = Math.max(Math.log10(etaMin) - 0.3, 2);
    let yMax = Math.log10(etaMax) + 0.3;
    if (yMax - yMin < 1.3) { // courbe presque plate : on garde au moins une décade et demie d’échelle
      const m = (yMax + yMin) / 2;
      yMin = m - 0.65; yMax = m + 0.65;
    }
    const px = (g) => marge.g + (Math.log10(g) - xMin) / (xMax - xMin) * (L - marge.g - marge.d);
    const py = (eta) => H - marge.b - (Math.log10(eta) - yMin) / (yMax - yMin) * (H - marge.h - marge.b);
    const teintes = ["#fefce8", "#f0fdf4", "#eff6ff", "#faf5ff"];
    ZONES.forEach((z, i) => {
      ctx.fillStyle = teintes[i];
      ctx.fillRect(px(z.min), marge.h, px(z.max) - px(z.min), H - marge.h - marge.b);
    });
    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    for (let d = -2; d <= 4; d++) {
      const g = Math.pow(10, d);
      const x = px(g);
      ctx.beginPath(); ctx.moveTo(x, marge.h); ctx.lineTo(x, H - marge.b); ctx.stroke();
      if (!etroit || d % 2 === 0) ctx.fillText(fmt(g, d < 0 ? -d : 0), Math.min(x, L - 22), H - marge.b + 15);
    }
    ctx.textAlign = "right";
    for (let d = Math.ceil(yMin); d <= Math.floor(yMax); d++) {
      const y = py(Math.pow(10, d));
      ctx.beginPath(); ctx.moveTo(marge.g, y); ctx.lineTo(L - marge.d, y); ctx.stroke();
      ctx.fillText(fmt(Math.pow(10, d), 0), marge.g - 5, y + 4);
    }
    // Noms des zones : la version la plus longue qui tient dans la bande.
    ctx.textAlign = "center";
    ctx.fillStyle = "#334155";
    const noms = [["Sédimentation", "Pot"], ["Affaissement / nivellement", "Mur frais", "Mur"], ["Mélange", "Mél."], ["Application", "Appl."]];
    ZONES.forEach((z, i) => {
      const x0 = Math.max(px(z.min), marge.g), x1 = Math.min(px(z.max), L - marge.d);
      const nom = noms[i].find((n) => ctx.measureText(n).width <= x1 - x0 - 4);
      if (nom) ctx.fillText(nom, (x0 + x1) / 2, marge.h - 6);
    });
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
    // Cibles du cahier des charges : barre verticale verte (respectée) ou rouge (non respectée).
    for (const c of cibles) {
      const x = px(c.gamma);
      ctx.strokeStyle = c.ok ? "#16a34a" : "#dc2626";
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(x, py(c.max)); ctx.lineTo(x, py(c.min)); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (gammaCur) {
      const x = px(gammaCur);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x, marge.h); ctx.lineTo(x, H - marge.b); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "#334155";
    ctx.textAlign = "right";
    ctx.fillText("γ̇ (s⁻¹)", L - 4, H - 4);
    ctx.textAlign = "left";
    ctx.fillText("η (mPa·s)", 4, 12);
  }, [series, gammaCur, cibles]);
  return <Toile dessiner={dessiner} ratio={0.4} aria="Courbe de la viscosité η en fonction du gradient de vitesse γ̇, échelles logarithmiques" />;
}

// ---------------------------------------------------------------------------
// Courbe 3ITT : η en fonction du temps.
// ---------------------------------------------------------------------------

function Courbe3ITT({ points }) {
  const dessiner = useCallback((ctx, L, H) => {
    const tMax = points[points.length - 1].t;
    const etaMax = Math.max(...points.map((p) => p.eta)) * 1.12;
    const marge = { g: 46, d: 10, h: 22, b: 30 };
    const px = (t) => marge.g + t / tMax * (L - marge.g - marge.d);
    const py = (eta) => H - marge.b - eta / etaMax * (H - marge.h - marge.b);
    const phases = [{ de: 0, a: 20, coul: "#f1f5f9" }, { de: 20, a: 40, coul: "#fee2e2" }, { de: 40, a: 120, coul: "#f1f5f9" }];
    for (const ph of phases) {
      ctx.fillStyle = ph.coul;
      ctx.fillRect(px(ph.de), marge.h, px(ph.a) - px(ph.de), H - marge.h - marge.b);
    }
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    for (const t of [0, 20, 40, 120]) ctx.fillText(fmt(t, 0) + " s", Math.min(Math.max(px(t), marge.g + 8), L - 18), H - marge.b + 15);
    ctx.textAlign = "right";
    ctx.strokeStyle = "#e2e8f0";
    const pas = etaMax / 4;
    for (let i = 0; i <= 4; i++) {
      const y = py(pas * i);
      ctx.beginPath(); ctx.moveTo(marge.g, y); ctx.lineTo(L - marge.d, y); ctx.stroke();
      ctx.fillText(fmt(pas * i, 0), marge.g - 5, y + 4);
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
    ctx.textAlign = "right";
    ctx.fillText("t (s)", L - 4, H - 4);
    ctx.textAlign = "left";
    ctx.fillText("η (mPa·s)", 4, 12);
  }, [points]);
  return <Toile dessiner={dessiner} ratio={0.34} aria="Courbe de la viscosité η en fonction du temps pendant le test en trois intervalles" />;
}

// ---------------------------------------------------------------------------
// Courbe d’écoulement : contrainte de cisaillement τ = η·γ̇ en fonction de γ̇ (axes linéaires).
// Newtonien : droite passant par l’origine ; pseudoplastique : courbe qui s’incurve vers l’axe de γ̇.
// ---------------------------------------------------------------------------

function CourbeEcoulement({ series, gammaMax, gammaCur = null }) {
  const dessiner = useCallback((ctx, L, H) => {
    const marge = { g: 46, d: 12, h: 24, b: 30 };
    let tauMax = 0;
    for (const s of series) for (const p of s.points) tauMax = Math.max(tauMax, p.tau);
    const pasBrut = tauMax / 4;
    const dec = Math.pow(10, Math.floor(Math.log10(pasBrut)));
    const pasTau = [1, 2, 5, 10].map((m) => m * dec).find((v) => v >= pasBrut);
    const yMax = pasTau * Math.ceil(tauMax / pasTau - 1e-9);
    const px = (g) => marge.g + g / gammaMax * (L - marge.g - marge.d);
    const py = (t) => H - marge.b - t / yMax * (H - marge.h - marge.b);
    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "right";
    for (let t = 0; t <= yMax + 1e-9; t += pasTau) {
      const y = py(t);
      ctx.beginPath(); ctx.moveTo(marge.g, y); ctx.lineTo(L - marge.d, y); ctx.stroke();
      ctx.fillText(fmt(t, 0), marge.g - 5, y + 4);
    }
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const g = gammaMax * i / 5;
      const x = px(g);
      ctx.beginPath(); ctx.moveTo(x, marge.h); ctx.lineTo(x, H - marge.b); ctx.stroke();
      ctx.fillText(fmt(g, 0), Math.min(x, L - 14), H - marge.b + 15);
    }
    for (const s of series) {
      ctx.beginPath();
      ctx.strokeStyle = s.couleur;
      ctx.lineWidth = 2.5;
      s.points.forEach((p, i) => {
        const x = px(p.gamma), y = py(p.tau);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    if (gammaCur && gammaCur <= gammaMax) {
      const x = px(gammaCur);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x, marge.h); ctx.lineTo(x, H - marge.b); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "#334155";
    ctx.textAlign = "right";
    ctx.fillText("γ̇ (s⁻¹)", L - 4, H - 4);
    ctx.textAlign = "left";
    ctx.fillText("τ (Pa)", 4, 12);
  }, [series, gammaMax, gammaCur]);
  return <Toile dessiner={dessiner} ratio={0.36} aria="Courbe d’écoulement : contrainte de cisaillement τ en fonction du gradient de vitesse γ̇, axes linéaires" />;
}

// ---------------------------------------------------------------------------
// Zoom moléculaire + curseur de gradient (utilisé en guide et en exploration).
// Les options montrerCourbe / montrerLambda servent au parcours guidé progressif.
// ---------------------------------------------------------------------------

function ZoomGradient({ famille, setFamille, gamma, setGamma, pH = 8.5, setPH, doseForte = false, setDoseForte,
  onHautGradient, famillesDispos, montrerCourbe = true, montrerLambda = true, montrerEcoulement = false }) {
  const [gMaxEcoul, setGMaxEcoul] = useState(100);
  const cin = cinetiqueReseau(famille, doseForte);
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
  const serieEcoulement = useMemo(() => {
    const fams = famille === "ase" ? ["ase"] : ["hase", "heur"];
    return fams.map((f) => {
      const points = [];
      for (let i = 0; i <= 120; i++) {
        const g = gMaxEcoul * i / 120;
        const gg = Math.max(g, 1e-4);
        points.push({ gamma: g, tau: etaStatio(f, gg, { pH, doseForte: f === famille && doseForte }) * g / 1000 });
      }
      return { points, couleur: INFOS_FAMILLE[f].couleur };
    });
  }, [famille, pH, doseForte, gMaxEcoul]);
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {(famillesDispos || ["hase", "heur", "ase"]).map((f) => (
          <button key={f} type="button" style={stylePetitBouton(famille === f, INFOS_FAMILLE[f].couleur)}
            aria-pressed={famille === f} onClick={() => setFamille(f)}>{INFOS_FAMILLE[f].bouton}</button>
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
      <SceneMoleculaire famille={famille} gamma={gamma} lambda={lambda} doseForte={doseForte} pH={pH} />
      <LegendeScene famille={famille} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        <button type="button" style={stylePetitBouton(false, "#0369a1")} onClick={() => setGamma(0.1)}>Au repos dans le pot (0,1 s⁻¹)</button>
        <button type="button" style={stylePetitBouton(false, "#0369a1")} onClick={() => { setGamma(2000); if (onHautGradient) onHautGradient(); }}>À l’application (2 000 s⁻¹)</button>
      </div>
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
      {montrerEcoulement && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: KIT.txt }}>Courbe d’écoulement τ = f(γ̇)</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", margin: "4px 0" }}>
            <span style={{ fontSize: 13, color: KIT.txt2 }}>Échelle de γ̇ :</span>
            {[10, 100, 1000].map((g) => (
              <button key={g} type="button" style={stylePetitBouton(gMaxEcoul === g, "#475569")} aria-pressed={gMaxEcoul === g}
                onClick={() => setGMaxEcoul(g)}>0 à {fmt(g, 0)} s⁻¹</button>
            ))}
          </div>
          <CourbeEcoulement series={serieEcoulement} gammaMax={gMaxEcoul} gammaCur={gamma} />
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
            τ = η × γ̇ (en Pa). {famille === "ase" ? "" : "Bleu : Thixol 53 L (HASE) ; orange : Coapur 3025 (HEUR)."} Axes linéaires.
          </div>
        </div>
      )}
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
// Atelier du formulateur : doses de Thixol 53 L et de Coapur 3025, cahier des charges d’une peinture mate.
// ---------------------------------------------------------------------------

function AtelierFormulateur({ doses, setDoses }) {
  const res = useMemo(() => evaluerPeinture(doses), [doses]);
  const serie = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 90; i++) {
      const g = GAMMA_MIN * Math.pow(GAMMA_MAX / GAMMA_MIN, i / 90);
      points.push({ gamma: g, eta: etaPeinture(g, doses) });
    }
    const reelles = ["A", "B"].map((k, i) => ({
      points: GAMMAS_PEINTURES.map((g, j) => ({ gamma: g, eta: PEINTURES_MESUREES[k].aller[j] })),
      couleur: i ? "#7c3aed" : "#64748b", tirets: i ? [2, 3] : [8, 4], libelle: PEINTURES_MESUREES[k].nom,
    }));
    return [{ points, couleur: "#0f172a", libelle: "peinture" }, ...reelles];
  }, [doses]);
  const cibles = res.filter((c) => c.gamma).map((c) => ({ gamma: c.gamma, min: c.min, max: c.max, ok: c.ok }));
  const nOk = res.filter((c) => c.ok).length;
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Atelier du formulateur : peinture mate</div>
      <Curseur nom="Thixol 53 L (HASE), % sec sur la formule" valeur={doses.thixol} onChange={(v) => setDoses({ ...doses, thixol: v })}
        min={0} max={1} pas={0.05} unite="%" decimales={2} couleur={INFOS_FAMILLE.hase.couleur} />
      <Curseur nom="Coapur 3025 (HEUR), % sec sur la formule" valeur={doses.coapur} onChange={(v) => setDoses({ ...doses, coapur: v })}
        min={0} max={3} pas={0.1} unite="%" decimales={1} couleur={INFOS_FAMILLE.heur.couleur} />
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>
        Doses de référence du modèle : {fmt(DOSES_REF.thixol, 1)} % de Thixol et {fmt(DOSES_REF.coapur, 1)} % de Coapur (fiches : Thixol en général moins de 0,5 % ; Coapur de 0,5 à 1,5 % en association, de 1 à 3 % seul).
      </div>
      <div role="list" aria-label="Cahier des charges" style={{ display: "grid", gap: 4 }}>
        {res.map((c) => (
          <div role="listitem" key={c.id} style={{
            display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", padding: "6px 8px", borderRadius: 8,
            background: c.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${c.ok ? "#86efac" : "#fca5a5"}`,
          }}>
            <span aria-hidden="true" style={{ fontWeight: 800, color: c.ok ? "#15803d" : "#b91c1c" }}>{c.ok ? "✓" : "✗"}</span>
            <span style={{ flex: "1 1 220px", fontSize: 13.5, color: KIT.txt }}>{c.texte}</span>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: c.ok ? "#15803d" : "#b91c1c" }}>
              {c.id === "thixo" ? `${fmt(c.valeur, 0)} %` : `${fmt(c.valeur, 0)} mPa·s`}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 700, margin: "8px 0", color: nOk === 4 ? "#15803d" : KIT.txt }}>
        {nOk === 4 ? "Cahier des charges respecté : 4 critères sur 4." : `${nOk} critère${nOk > 1 ? "s" : ""} sur 4 respecté${nOk > 1 ? "s" : ""}.`}
      </div>
      <CourbeLogLog series={serie} cibles={cibles} />
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
        Trait plein noir : ta peinture (modèle). Tirets longs gris : peinture A mesurée ; pointillés violets : peinture B mesurée
        (viscosimètre LAMY RM100+, mobile MS-R3, de 1 à 300 s⁻¹, branche aller). Barres : plage visée pour chaque critère (verte si respectée, rouge sinon).
        Le critère d’application vise une peinture plus visqueuse à haut gradient que A et B (environ 0,85 Pa·s à 300 s⁻¹).
      </div>
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
      <li>Les profils modélisés sont ceux des deux produits du TP (Thixol 53 L, un HASE, et Coapur 3025, un HEUR), lus sur leurs fiches techniques :
        « HASE » et « HEUR » sont des familles chimiques, pas des comportements. Un autre HASE ou un autre HEUR peut avoir un profil différent : le modèle n’est pas une loi générale.</li>
      <li>ASE : gonflement par neutralisation (fraction ionisée 1/(1 + 10<sup>pKa − pH</sup>), pKa = {fmt(PARAMS.ase.pKa, 1)}) ;
        pas de modification hydrophobe, donc aucune liaison associative.</li>
      <li>Calibration : les fiches techniques donnent des viscosités Brookfield à 10 et 100 tr/min
        (environ 9 000 et 1 500 mPa·s pour le Thixol). Le modèle en reprend l’ordre de grandeur
        (environ 11 000 mPa·s à 1 s⁻¹ et 1 500 mPa·s à 100 s⁻¹) et le rapport de 6 à 7. La conversion tr/min → s⁻¹
        dépend du mobile et de la géométrie : ce n’est pas une équivalence exacte, la courbe n’est pas un ajustement des mesures.</li>
      <li>Gants et crochets : c’est la convention de dessin du TP. Le Thixol (HASE) est dessiné avec des crochets (liaisons auto-associantes seulement),
        le Coapur (HEUR) avec des gants (liaisons associatives avec les particules, auto-associantes entre gants).
        En réalité, les groupes hydrophobes peuvent aussi s’adsorber sur les particules de liant : le dessin est une simplification pédagogique.</li>
      <li>Le liant (bleu) est un latex : une dispersion aqueuse (on dit aussi émulsion) de très petites particules de polymère. Il est dessiné comme décor, hors échelle : ses particules ne participent pas aux liaisons du modèle.</li>
      <li>Courbe d’écoulement : τ = η × γ̇ avec η la viscosité en régime permanent du modèle (axes linéaires).</li>
      <li>Atelier du formulateur : les effets du Thixol et du Coapur sont supposés s’additionner (les fiches disent seulement qu’ils se combinent bien)
        et proportionnels aux doses. Les courbes de référence correspondent à {fmt(DOSES_REF.thixol, 1)} % de Thixol et {fmt(DOSES_REF.coapur, 1)} % de Coapur secs sur la formule ;
        le niveau de viscosité du Coapur est un choix du modèle.</li>
      <li>Les quatre critères du cahier des charges sont des ordres de grandeur pédagogiques, pas des normes ni des valeurs de la fiche.
        Ceux de bas gradient (mur frais) encadrent deux peintures du commerce mesurées ; celui de haut gradient est fixé au-dessus d’elles (haut de gamme).
        La tenue en pot (0,1 s⁻¹) n’a pas pu être mesurée (le viscosimètre ne descend pas sous 1 s⁻¹) : sa limite est une estimation.</li>
      <li>Comparaison avec les peintures A et B : une vraie peinture contient en plus du latex, des pigments et des charges qui lui donnent une viscosité de base, et sa viscosité continue de baisser
        jusqu’à 300 s⁻¹ (pente d’environ –0,5 à –0,6 en log-log). Le modèle s’aplatit vers 100 s⁻¹ : les courbes ne se superposent pas, seules les ordres de grandeur sont comparables.
        Les peintures A et B ont aussi une hystérésis (retour à 1 s⁻¹ à 83 % et 72 % de l’aller), du même ordre que la régénération du test 3ITT (environ 80 %), mais ce n’est pas le même protocole.</li>
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
    <div>« HASE » et « HEUR » sont des familles chimiques. Les profils ci-dessous sont ceux de nos deux produits : pour une autre référence, on lit sa fiche technique.</div>
    <div>🧤 Liaison associative = gant + particule : forte, difficile à défaire.</div>
    <div>🪝 Liaison auto-associante = gant + gant ou crochet + crochet : lâche, facile à défaire.
      Dans la convention du TP, le crochet ne touche jamais une particule.</div>
    <div>Notre Thixol 53 L (HASE) : surtout des liaisons auto-associantes → η forte à bas gradient,
      effondrée à haut gradient, thixotrope.</div>
    <div>Notre Coapur 3025 (HEUR) : liaisons gant-particule tenues → η quasi constante (fluide newtonien : courbe d’écoulement en droite),
      pas thixotrope à dose normale ; à forte dose, des liaisons auto-associantes le rendent un peu thixotrope.</div>
    <div>Thixol 53 L pour le bas gradient (pot, mur frais), Coapur 3025 pour le haut gradient (application) : les deux se combinent.</div>
    <div>ASE : pas de modification hydrophobe → épaissit par gonflement après neutralisation (pH 8-9).</div>
  </>
);

// ---------------------------------------------------------------------------
// Composant principal.
// ---------------------------------------------------------------------------

export function SimulationEpaisseursAssociatifs() {
  const [mode, setMode] = useState(() => modeOuverture("epaisseurs-v2"));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant("epaisseurs-v2", { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [montages, setMontages] = useState({ hase: {}, heur: {} });
  const [aExploreHaut, setAExploreHaut] = useState(false);
  const [gammaGuide, setGammaGuide] = useState(0.1);
  const [familleGuide, setFamilleGuide] = useState("hase");
  const [familleExplo, setFamilleExplo] = useState("hase");
  const [gammaExplo, setGammaExplo] = useState(0.1);
  const [pHExplo, setPHExplo] = useState(8.5);
  const [doseForteExplo, setDoseForteExplo] = useState(false);
  const [ouvHyp, setOuvHyp] = useState(false);
  const [doseForteGuide, setDoseForteGuide] = useState(false);
  const [doses, setDoses] = useState({ thixol: 0.2, coapur: 0 });
  const [volet, setVolet] = useState("meca");
  // Sur téléphone, la consigne passe avant le schéma : l’élève lit la question puis regarde.
  const [etroit, setEtroit] = useState(() => typeof window !== "undefined" && window.innerWidth < 720);
  useEffect(() => {
    const maj = () => setEtroit(window.innerWidth < 720);
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);
  const [pHGuide, setPHGuide] = useState(8.5);

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
      texte: "Les modifications hydrophobes sont dessinées de deux façons dans le TP : comme des gants de baseball " +
        "ou comme des crochets. Touche chacun dans le panneau pour voir avec quoi il peut interagir, puis réponds.",
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
      texte: "Voici un zoom sur la peinture. Le Thixol 53 L (HASE) est dessiné avec des crochets : deux crochets s’accrochent comme deux maillons. " +
        "Le Coapur 3025 (HEUR) est dessiné avec des gants : un gant tient une particule comme un gant de baseball tient une balle. " +
        "Le compteur sous le dessin donne le nombre de liaisons en place. Clique sur « À l’application » (ou monte le curseur au-delà de 1 000 s⁻¹) et regarde ce qui se passe pour chaque produit.",
      tache: {
        type: "action",
        ok: aExploreHaut,
        label: "Le faire pour moi",
        faire: () => { setGammaGuide(2000); setAExploreHaut(true); },
        consigne: "Monte le curseur γ̇ au-delà de 1 000 s⁻¹, puis compare le Thixol (HASE) et le Coapur (HEUR).",
        indice: "Compare le compteur de liaisons pour chaque produit à γ̇ = 0,1 s⁻¹ puis à γ̇ = 2 000 s⁻¹ : lequel perd presque toutes ses liaisons ? Lequel garde presque les mêmes ?",
      },
    },
    {
      titre: "Viscosité à bas gradient",
      texte: "Le gradient est faible dans le pot (sédimentation : 0,01-0,1 s⁻¹) et sur le mur frais " +
        "(affaissement et nivellement : 0,1-3 s⁻¹). La courbe de viscosité η(γ̇) apparaît : compare les deux produits dans ces zones.",
      tache: {
        type: "qcm",
        q: "Lequel assure une forte viscosité à bas gradient et empêche la sédimentation en pot ?",
        options: ["Le Coapur 3025 (HEUR)", "Le Thixol 53 L (HASE)", "Les deux également", "Aucun des deux"],
        bonne: 1,
        indice: "Descends le curseur γ̇ sous 0,1 s⁻¹ et compare les viscosités affichées pour chacun des deux produits.",
        expl: <>À bas gradient, les liaisons entre crochets du Thixol sont toutes en place : la résistance à l’écoulement est forte.
          Sa fiche l’annonce : « prevents settling and sagging ». Le Coapur offre une viscosité moyenne : il n’est pas fait pour ça.</>,
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
          Le Coapur garde sa viscosité car ses liaisons gant-particule tiennent bon.
          Le Thixol a vu ses liaisons se rompre : sa viscosité s’est effondrée.</>,
      },
    },
    {
      titre: "Courbe d’écoulement",
      texte: "Le programme demande d’identifier un comportement sur deux courbes : la courbe de viscosité η(γ̇), que tu viens d’utiliser, " +
        "et la courbe d’écoulement τ(γ̇), où τ = η × γ̇ est la contrainte de cisaillement. La deuxième apparaît sous la première, avec les deux produits. " +
        "Teste les trois échelles de γ̇.",
      tache: {
        type: "qcm",
        q: "Sur la courbe d’écoulement, comment se reconnaît le Thixol 53 L, produit rhéofluidifiant ?",
        options: [
          "Une droite passant par l’origine",
          "Une courbe qui s’incurve : la pente (donc la viscosité) diminue quand γ̇ augmente",
          "Une courbe dont la pente augmente quand γ̇ augmente",
          "Une droite horizontale",
        ],
        bonne: 1,
        indice: "La pente de la courbe d’écoulement, c’est la viscosité. Compare la pente du Thixol près de l’origine et plus loin.",
        expl: <>Un fluide newtonien (Coapur) donne une droite passant par l’origine : sa pente η est constante.
          Pour le Thixol, la pente (η) diminue quand γ̇ augmente : c’est la courbe d’un fluide rhéofluidifiant (pseudoplastique).</>,
      },
    },
    {
      titre: "Qui est thixotrope ?",
      texte: "Thixotrope, c’est une viscosité qui met du temps à revenir après un cisaillement. " +
        "Lance la rampe aller-retour pour chaque produit : on monte γ̇, puis on le redescend. " +
        "Regarde la valeur de λ, la part de liaisons en place, et compare la montée et la descente.",
      tache: {
        type: "qcm",
        q: "À dose normale, lequel des deux apporte de la thixotropie ?",
        options: ["Le Coapur 3025 (HEUR)", "Le Thixol 53 L (HASE)", "Les deux", "Aucun des deux"],
        bonne: 1,
        indice: "Sur la rampe, la descente est-elle superposée à la montée ? Qui doit reformer des liaisons, et à quelle vitesse ?",
        expl: <>Les liaisons auto-associantes du Thixol cassent à haut gradient et mettent du temps à se reformer :
          la viscosité revient lentement, c’est la thixotropie. La structure du Coapur ne dépend pas du gradient :
          aucune raison d’être thixotrope.</>,
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
      titre: "Pour aller plus loin : le HEUR à forte dose",
      texte: "Le Coapur 3025 n’est pas thixotrope à dose normale. Mais utilisé à forte concentration, " +
        "des gants de molécules voisines peuvent s’attraper entre eux. Sélectionne le Coapur (HEUR), " +
        "active « dose forte », puis lance la rampe aller-retour.",
      tache: {
        type: "qcm",
        q: "Pourquoi le Coapur devient-il alors un peu thixotrope ?",
        options: [
          "Des liaisons auto-associantes entre molécules d’épaississant, lâches, se rompent sous cisaillement et se reforment lentement",
          "Les liaisons gant-particule se rompent toutes à haut gradient",
          "Il se transforme en HASE",
          "Il ne devient pas thixotrope",
        ],
        bonne: 0,
        indice: "Quelles liaisons se rompent au cisaillement et mettent du temps à se reformer ? Regarde la scène avec la dose forte.",
        expl: <>À forte concentration, un HEUR peut former des liaisons auto-associantes entre molécules d’épaississant :
          comme pour le HASE, elles se rompent à haut gradient et se reforment lentement, d’où la thixotropie.</>,
      },
    },
    {
      titre: "Le non-associatif : l’ASE",
      texte: "Un ASE (alcali-gonflable) n’a pas de modification hydrophobe : c’est un épaississant non associatif. " +
        "Il est livré à pH acide et épaissit quand on neutralise. Choisis l’ASE, puis fais varier le pH du milieu.",
      tache: {
        type: "qcm",
        q: "Pourquoi un ASE n’épaissit-il qu’après neutralisation (pH 8-9) ?",
        options: [
          "Les groupes acide carboxylique s’ionisent : les charges se repoussent, la chaîne se déploie et gonfle",
          "Les gants se mettent à s’attraper entre eux",
          "L’acide réagit avec le TiO₂",
          "La neutralisation le rend hydrophobe",
        ],
        bonne: 0,
        indice: "Que deviennent les groupes –COOH quand on ajoute une base ? Que font des charges de même signe ?",
        expl: <>La neutralisation transforme –COOH en –COO⁻ : les charges négatives se repoussent, la chaîne se déploie et gonfle,
          ce qui augmente la viscosité. Pas de liaisons associatives ici : c’est un mode d’action différent.</>,
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
          Les fiches proposent d’ailleurs cette combinaison, comme dans la formulation de la peinture mate de la simulation « Peinture à l’eau ».</>,
      },
    },
    {
      titre: "Régler les doses",
      texte: "À toi de formuler : règle la dose de Thixol 53 L et celle de Coapur 3025 pour respecter les quatre critères du cahier des charges d’une peinture mate. " +
        "Les valeurs de viscosité et la courbe se mettent à jour quand tu bouges les curseurs.",
      tache: {
        type: "action",
        ok: evaluerPeinture(doses).every((c) => c.ok),
        label: "Le faire pour moi",
        faire: () => setDoses({ thixol: 0.6, coapur: 0.6 }),
        consigne: "Obtiens les quatre critères au vert : tenue en pot, mur frais, application et nivellement.",
        indice: "Règle d’abord le Thixol pour la viscosité à bas gradient (0,1 et 1 s⁻¹), puis ajoute du Coapur pour remonter la viscosité à 300 s⁻¹, sans dépasser la limite à 1 s⁻¹.",
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
    if (e === 12) return <AtelierFormulateur doses={doses} setDoses={setDoses} />;
    const dispos = e >= 10 ? ["hase", "heur", "ase"] : ["hase", "heur"];
    const fam = dispos.includes(familleGuide) ? familleGuide : "hase";
    return (
      <>
        <ZoomGradient famille={fam} setFamille={setFamilleGuide}
          famillesDispos={dispos}
          gamma={gammaGuide} setGamma={setGammaGuide} onHautGradient={() => setAExploreHaut(true)}
          doseForte={e >= 9 && doseForteGuide} setDoseForte={e >= 9 ? setDoseForteGuide : undefined}
          pH={pHGuide} setPH={e >= 10 ? setPHGuide : undefined}
          montrerCourbe={e >= 4} montrerEcoulement={e >= 6} montrerLambda={e >= 7} />
        {e >= 7 && (
          <BancExploration famille={fam} doseForte={e >= 9 && doseForteGuide} pH={pHGuide}
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
            <div style={{ flex: "2 1 420px", minWidth: 280, order: etroit ? 2 : 1 }}>{panneauGuide()}</div>
            <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 10, order: etroit ? 1 : 2 }}>
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" style={stylePetitBouton(volet === "meca", "#334155")} aria-pressed={volet === "meca"} onClick={() => setVolet("meca")}>Comprendre : zoom moléculaire et courbes</button>
            <button type="button" style={stylePetitBouton(volet === "formulateur", "#334155")} aria-pressed={volet === "formulateur"} onClick={() => setVolet("formulateur")}>Formuler : atelier du formulateur</button>
          </div>
          {volet === "formulateur" ? <AtelierFormulateur doses={doses} setDoses={setDoses} /> : (
            <>
              <ZoomGradient
                famille={familleExplo} setFamille={setFamilleExplo}
                famillesDispos={["hase", "heur", "ase"]}
                gamma={gammaExplo} setGamma={setGammaExplo}
                pH={pHExplo} setPH={setPHExplo}
                doseForte={doseForteExplo} setDoseForte={setDoseForteExplo}
                montrerEcoulement
              />
              <BancExploration famille={familleExplo} doseForte={doseForteExplo} pH={pHExplo} />
            </>
          )}
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
