// Vue — simulation « Courbes d'écoulement et de viscosité : lire un rhéogramme » (BTS MDC, formulation).
// Modèle pur : rheoCourbesModele.js ; test : rheoCourbesModele.test.mjs ; exercices : BanqueRheologieBTS.js.
// Parcours guidé progressif (au plus trois zones d'information à l'écran), exploration allégée, défi « fluide mystère ».
// Données des peintures A et B : mesures réelles de Nils (viscosimètre Lamy RM 100+, mobile MSR3, rampe aller-retour).

import { useEffect, useMemo, useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, fmt, lireNombre, proche, IndiceDefi, avecIndices } from "../commun";
import { Pic } from "../Pictos";
import { puces } from "./Travail";
import { Graphe, Legende, FCisaillement, FViscosimetre, FTroisComportements, FSeuil, FSeuilBas, FBoucle } from "./RheoCourbesGraphes";
import {
  PRODUITS, COULEURS, GAMMAS_PEINTURES, PEINTURES_MESUREES, tauHB, etaHB, typeDe, nomDuType, TYPES, rampe, tauMesure, tauRheometre, GAMMAS_RHEO, SEUIL_B_LU,
  ajusterHB, ecartRelatif, tirerFluideMystere, ordreOptions, gradientsLog,
} from "./rheoCourbesModele";

const SIM_ID = 217;
declarerDefis(SIM_ID, [["principal", "Le fluide mystère"]]);

const NB = " ";
const GD = <mover><mi>γ</mi><mo>˙</mo></mover>;
const FLUIDES = { ...PRODUITS, mystere: { nom: "Fluide X", tau0: 20, K: 1.5, n: 0.55, type: "plastique-non-ideal", thixo: 0 } };
const GRILLE_LIN = Array.from({ length: 61 }, (_, i) => i * 5); // 0 … 300 s⁻¹
const GRILLE_LOG = gradientsLog(0.001, 1000, 90);
const V = (s) => avecIndices(s);
const sig3 = (x) => String(+x.toPrecision(3)).replace(".", ",");

// ---------------------------------------------------------------------------
// Courbes d'un fluide du modèle (contrainte en Pa, viscosité en mPa·s)
// ---------------------------------------------------------------------------
function courbesModele(p, log, bas = false) {
  const grille = (log ? GRILLE_LOG : GRILLE_LIN).filter((g) => log && !bas ? g >= 0.1 : true);
  const tau = grille.map((g) => [g, tauHB(g, p)]);
  const eta = grille.filter((g) => g >= (log ? 0.1 : 1)).map((g) => [g, etaHB(g, p) * 1000]);
  return { tau, eta };
}

function CurseurGradient({ i, setI }) {
  const g = GAMMAS_PEINTURES[i];
  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: KIT.txt2 }}>
        Gradient de vitesse γ̇ = <span style={{ color: KIT.txt }}>{g}{NB}s⁻¹</span>
        <input type="range" min={0} max={GAMMAS_PEINTURES.length - 1} step={1} value={i} onChange={(e) => setI(parseInt(e.target.value, 10))}
          aria-label="Gradient de vitesse" style={{ width: "100%", accentColor: "#0284c7", display: "block", minHeight: 30 }} />
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau « fluide du modèle » : une courbe d'écoulement, puis la courbe de viscosité quand l'étape s'en sert.
// ---------------------------------------------------------------------------
function PanneauFluide({ ids, sel, setSel, gi, setGi, viscosite, anonyme = false, mesureEta = true }) {
  const id = ids.includes(sel) ? sel : ids[0];
  const p = FLUIDES[id];
  const c = useMemo(() => courbesModele(p, false), [p]);
  const g = GAMMAS_PEINTURES[gi];
  const col = COULEURS[id] || COULEURS.mystere;
  return (
    <div>
      {ids.length > 1 && (
        <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>
          Produit étudié
          <select value={id} onChange={(e) => setSel(e.target.value)} aria-label="Produit étudié"
            style={{ display: "block", width: "100%", minHeight: 42, fontSize: 16, padding: "6px 8px", borderRadius: 10, border: `1px solid ${KIT.bord}`, marginTop: 2 }}>
            {ids.map((k) => <option key={k} value={k}>{FLUIDES[k].nom}</option>)}
          </select>
        </label>
      )}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: KIT.txt }}>{anonyme ? "Courbe d’écoulement du fluide X" : `Courbe d’écoulement : ${p.nom}`}</div>
      <Graphe aria={`Courbe d'écoulement, contrainte en fonction du gradient, ${p.nom}`} series={[{ pts: c.tau, c: col }]}
        x0={0} x1={300} xTitre="γ̇ (s⁻¹)" yTitre="τ (Pa)" reperes={[{ x: g, y: tauHB(g, p), c: col }]} />
      {viscosite && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, margin: "10px 0 2px", color: KIT.txt }}>Courbe de viscosité</div>
          <Graphe aria={`Courbe de viscosité, viscosité en fonction du gradient, ${p.nom}`} series={[{ pts: c.eta, c: col }]}
            x0={0} x1={300} xTitre="γ̇ (s⁻¹)" yTitre="η (mPa·s)" reperes={[{ x: g, y: etaHB(g, p) * 1000, c: col }]} />
        </>
      )}
      <CurseurGradient i={gi} setI={setGi} />
      <LigneMesure nom="γ̇" valeur={`${g}${NB}s⁻¹`} />
      <LigneMesure nom="τ" valeur={`${fmt(tauHB(g, p), 1)}${NB}Pa`} couleur={col} />
      {mesureEta && <LigneMesure nom="η" valeur={`${fmt(etaHB(g, p) * 1000, 0)}${NB}mPa·s`} couleur={col} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau « peintures mesurées » : données réelles, échelle logarithmique, boucle aller-retour.
// ---------------------------------------------------------------------------
function donneesPeintures(avecRetour) {
  const tau = {}, eta = {};
  ["A", "B"].forEach((k) => {
    ["aller", "retour"].forEach((sens) => {
      tau[k + sens] = GAMMAS_PEINTURES.map((g, i) => [g, (PEINTURES_MESUREES[k][sens][i] / 1000) * g]);
      eta[k + sens] = GAMMAS_PEINTURES.map((g, i) => [g, PEINTURES_MESUREES[k][sens][i]]);
    });
  });
  return { tau, eta, avecRetour };
}
function SeriesPeintures(d, avecRetour) {
  const s = [];
  ["A", "B"].forEach((k) => {
    s.push({ pts: d[k + "aller"], c: COULEURS[k], marq: true });
    if (avecRetour) s.push({ pts: d[k + "retour"], c: COULEURS[k], marq: true, tirets: true });
  });
  return s;
}


// ---------------------------------------------------------------------------
// Panneau « rhéomètre » : mesures réelles du viscosimètre (γ̇ ≥ 1 s⁻¹) + points SIMULÉS aux très bas gradients.
// ---------------------------------------------------------------------------
const TAU_RHEO = { A: tauRheometre("A"), B: tauRheometre("B") };
const nombreFr = (x, d = 1) => x.toFixed(d).replace(".", ",");
function PanneauRheometre({ avecA }) {
  const cles = avecA ? ["A", "B"] : ["B"];
  const sTau = [], sEta = [];
  cles.forEach((k) => {
    const reel = GAMMAS_PEINTURES.map((g, i) => [g, (PEINTURES_MESUREES[k].aller[i] / 1000) * g]);
    const sim = GAMMAS_RHEO.map((g, i) => [g, TAU_RHEO[k][i]]);
    sTau.push({ pts: reel, c: COULEURS[k], marq: true }, { pts: sim, c: COULEURS[k], marq: true, tirets: true });
    sEta.push({ pts: reel.map(([g, t]) => [g, t / g]), c: COULEURS[k], marq: true }, { pts: sim.map(([g, t]) => [g, t / g]), c: COULEURS[k], marq: true, tirets: true });
  });
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: KIT.txt }}>Courbe d’écoulement aux très bas gradients (échelle logarithmique en γ̇)</div>
      <Graphe aria="Courbe d'écoulement des peintures aux très bas gradients : contrainte en fonction du gradient, échelle logarithmique en gradient" series={sTau}
        xLog x0={0.001} x1={10} y0={0} y1={60} xTitre="γ̇ (s⁻¹)" yTitre="τ (Pa)" />
      <div style={{ fontWeight: 700, fontSize: 14, margin: "10px 0 2px", color: KIT.txt }}>Courbe de viscosité (échelles logarithmiques)</div>
      <Graphe aria="Courbe de viscosité des peintures aux très bas gradients : viscosité en fonction du gradient, échelles logarithmiques" series={sEta}
        xLog yLog x0={0.001} x1={1000} y0={0.1} y1={100000} xTitre="γ̇ (s⁻¹)" yTitre="η (Pa·s)" />
      <Legende items={[
        ...cles.map((k) => ({ c: COULEURS[k], nom: `Peinture ${k} : viscosimètre (mesures réelles)` })),
        ...cles.map((k) => ({ c: COULEURS[k], nom: `Peinture ${k} : rhéomètre (points simulés)`, tirets: true })),
      ]} />
    </div>
  );
}

function PanneauPeintures({ retour, logX, setLogX, logY, setLogY, avecLog }) {
  const dt = useMemo(() => donneesPeintures(retour).tau, [retour]);
  const de = useMemo(() => donneesPeintures(retour).eta, [retour]);
  const xr = logX ? { x0: 1, x1: 1000 } : { x0: 0, x1: 300 };
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: KIT.txt }}>Courbes d’écoulement des peintures A et B</div>
      <Graphe aria="Courbes d'écoulement mesurées des peintures A et B : contrainte en fonction du gradient" series={SeriesPeintures(dt, retour)}
        xLog={logX} {...xr} xTitre="γ̇ (s⁻¹)" yTitre="τ (Pa)" />
      <div style={{ fontWeight: 700, fontSize: 14, margin: "10px 0 2px", color: KIT.txt }}>Courbes de viscosité des peintures A et B</div>
      <Graphe aria="Courbes de viscosité mesurées des peintures A et B : viscosité en fonction du gradient" series={SeriesPeintures(de, retour)}
        xLog={logX} yLog={logY} {...xr} xTitre="γ̇ (s⁻¹)" yTitre="η (mPa·s)" />
      <Legende items={[
        { c: COULEURS.A, nom: "Peinture A (aller)" }, { c: COULEURS.B, nom: "Peinture B (aller)" },
        ...(retour ? [{ c: COULEURS.A, nom: "A (retour)", tirets: true }, { c: COULEURS.B, nom: "B (retour)", tirets: true }] : []),
      ]} />
      {avecLog && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <button type="button" style={stylePetitBouton(logX, "#334155")} aria-pressed={logX} onClick={() => setLogX(!logX)}>γ̇ en échelle logarithmique</button>
          <button type="button" style={stylePetitBouton(logY, "#334155")} aria-pressed={logY} onClick={() => setLogY(!logY)}>η en échelle logarithmique</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hypothèses de travail (visibles en exploration, en défi et à la fin du parcours)
// ---------------------------------------------------------------------------
function Hypotheses() {
  return (
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
      {puces(
        <>Le modèle des courbes est celui de <strong>Herschel-Bulkley</strong> : τ = τ₀ + K·γ̇<sup>n</sup>. Il décrit les produits <em>stationnaires</em> (on attend que la mesure se stabilise à chaque palier). Les valeurs des produits (glycérol, shampooing, boue…) sont des ordres de grandeur illustratifs, pas des données de fabricant.</>,
        <>Écoulement <strong>laminaire et homogène</strong>, sans glissement sur les parois, <strong>température constante</strong> : la viscosité d’un produit réel dépend aussi de la température.</>,
        <>Le <strong>seuil d’écoulement est apparent</strong> : un produit réel garde une viscosité très grande, mais finie, sous le seuil. Sa valeur dépend de la technique de mesure et des gradients atteints ; avec le viscosimètre seul (pas sous 1 s⁻¹), elle ne peut être qu’<strong>extrapolée</strong> vers γ̇ → 0 ; aux très bas gradients, on la lit sur un <strong>palier</strong> de contrainte.</>,
        <>La <strong>thixotropie</strong> est décrite par un seul paramètre de structure (destruction proportionnelle à γ̇, reconstruction lente au repos) : une représentation simple, qui reproduit la boucle aller-retour sans prétendre décrire tous les produits.</>,
        <>Les mesures des peintures A et B sont <strong>réelles</strong> (viscosimètre Lamy RM 100+, mobile MSR3, température ambiante ≈ 22,5 °C), à raison d’une mesure par palier de 2 s : aucune incertitude n’est annoncée, les écarts de quelques pour cent ne sont pas interprétés.</>,
        <>Les points de <strong>rhéomètre</strong> (γ̇ de 0,001 à 0,5 s⁻¹) sont <strong>simulés</strong> : inventés à partir d’un modèle cohérent avec les mesures réelles, avec un petit bruit. Ils illustrent ce que donnerait un rhéomètre ; ce ne sont pas des mesures.</>,
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exploration libre : un produit du modèle ou une peinture mesurée, avec ses réglages repliés.
// ---------------------------------------------------------------------------
const NOMS_PRODUITS = { ...Object.fromEntries(Object.entries(PRODUITS).map(([k, v]) => [k, v.nom])), A: "Mesures : peinture A", B: "Mesures : peinture B" };

function Exploration() {
  const [prod, setProd] = useState("shampooing");
  const [p, setP] = useState({ ...PRODUITS.shampooing });
  const [boucle, setBoucle] = useState(false);
  const [logX, setLogX] = useState(false);
  const [logY, setLogY] = useState(false);
  const [gi, setGi] = useState(4);
  const [rheo, setRheo] = useState(false);
  const [ouvReglages, setOuvReglages] = useState(false);
  const [ouvEssayer, setOuvEssayer] = useState(false);
  const [ouvRetenir, setOuvRetenir] = useState(false);
  const mesure = prod === "A" || prod === "B";
  const changer = (k) => {
    setProd(k);
    setP(k === "A" || k === "B" ? { tau0: 0, K: 10, n: 0.8, thixo: 0 } : { ...PRODUITS[k] });
  };
  const g = GAMMAS_PEINTURES[gi];
  const bas = mesure && rheo;
  const logXe = logX || bas;
  const modele = useMemo(() => courbesModele(p, logXe, bas), [p, logXe, bas]);
  const r = useMemo(() => rampe(p), [p]);
  const xr = logXe ? { x0: bas ? 0.001 : 0.1, x1: 1000 } : { x0: 0, x1: 300 };
  const col = mesure ? COULEURS[prod] : COULEURS[prod] || COULEURS.mystere;

  const sTau = [], sEta = [];
  if (mesure) {
    const d = donneesPeintures(boucle);
    sTau.push({ pts: d.tau[prod + "aller"], c: col, marq: true });
    sEta.push({ pts: d.eta[prod + "aller"], c: col, marq: true });
    if (boucle) { sTau.push({ pts: d.tau[prod + "retour"], c: col, marq: true, tirets: true }); sEta.push({ pts: d.eta[prod + "retour"], c: col, marq: true, tirets: true }); }
    if (bas) {
      const sim = GAMMAS_RHEO.map((gg, i) => [gg, TAU_RHEO[prod][i]]);
      sTau.push({ pts: sim, c: "#0f172a", marq: true, tirets: true });
      sEta.push({ pts: sim.map(([gg, t]) => [gg, (t / gg) * 1000]), c: "#0f172a", marq: true, tirets: true });
    }
    sTau.push({ pts: modele.tau, c: COULEURS.modele, tirets: true, ep: 2.2 });
    sEta.push({ pts: modele.eta, c: COULEURS.modele, tirets: true, ep: 2.2 });
  } else {
    sTau.push({ pts: modele.tau, c: col });
    sEta.push({ pts: modele.eta, c: col });
    if (boucle) {
      const pt = r.gammas.map((x, i) => [x, r.aller[i]]), pr = r.gammas.map((x, i) => [x, r.retour[i]]);
      sTau.push({ pts: pt, c: "#0f172a", marq: true, ep: 1.6 }, { pts: pr, c: "#ea580c", marq: true, tirets: true, ep: 1.6 });
      sEta.push({ pts: pt.map(([x, t]) => [x, (t / x) * 1000]), c: "#0f172a", marq: true, ep: 1.6 }, { pts: pr.map(([x, t]) => [x, (t / x) * 1000]), c: "#ea580c", marq: true, tirets: true, ep: 1.6 });
    }
  }
  const aller = mesure ? [...(bas ? TAU_RHEO[prod] : []), ...tauMesure(prod, "aller")] : null;
  const gammasAj = bas ? [...GAMMAS_RHEO, ...GAMMAS_PEINTURES] : GAMMAS_PEINTURES;
  const ecart = mesure ? ecartRelatif(gammasAj, aller, p) : null;
  const comportement = nomDuType(typeDe(p)) + (p.thixo > 0 && !mesure ? " · thixotrope" : "");
  const maj = (cle) => (v) => setP((q) => ({ ...q, [cle]: v }));
  const resume = `τ₀ = ${fmt(p.tau0, 1)} Pa · K = ${fmt(p.K, 2)} · n = ${fmt(p.n, 2)}${mesure ? "" : ` · thixotropie ${fmt(p.thixo, 2)}`}`;
  const curseur = (nom, v, f, min, max, pas, aide) => (
    <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: KIT.txt2, fontWeight: 700 }}>
      {nom} <span style={{ color: KIT.txt }}>{fmt(v, pas < 0.1 ? 2 : 1)}</span>
      <input type="range" min={min} max={max} step={pas} value={v} onChange={(e) => f(parseFloat(e.target.value))} aria-label={nom}
        style={{ width: "100%", display: "block", minHeight: 30, accentColor: "#0284c7" }} />
      <span style={{ fontWeight: 400, fontSize: 13 }}>{aide}</span>
    </label>
  );
  return (
    <div style={{ marginTop: 10 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>
        Produit étudié
        <select value={prod} onChange={(e) => changer(e.target.value)} aria-label="Produit étudié"
          style={{ display: "block", width: "100%", minHeight: 42, fontSize: 16, padding: "6px 8px", borderRadius: 10, border: `1px solid ${KIT.bord}`, marginTop: 2 }}>
          {Object.entries(NOMS_PRODUITS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
      </label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
        <button type="button" style={stylePetitBouton(boucle, "#ea580c")} aria-pressed={boucle} onClick={() => setBoucle(!boucle)}>Montée puis descente de γ̇ (aller-retour)</button>
        <button type="button" style={stylePetitBouton(logXe, "#334155")} aria-pressed={logXe} onClick={() => setLogX(!logX)}>γ̇ en échelle logarithmique</button>
        <button type="button" style={stylePetitBouton(logY, "#334155")} aria-pressed={logY} onClick={() => setLogY(!logY)}>η en échelle logarithmique</button>
        {mesure && <button type="button" style={stylePetitBouton(rheo, "#0f172a")} aria-pressed={rheo} onClick={() => setRheo(!rheo)}>Ajouter les points de rhéomètre (simulés)</button>}
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>
        {mesure ? (bas ? "Points colorés : mesures réelles du viscosimètre. Points noirs en tirets : rhéomètre, SIMULÉ (aux très bas gradients). Tirets verts : le modèle que vous réglez." : "Points : mesures réelles. Tirets verts : le modèle de Herschel-Bulkley que vous réglez.") : "Courbe : le modèle. Avec l’aller-retour : points noirs à la montée, points orange creux à la descente."}
      </div>
      <Graphe aria="Courbe d'écoulement : contrainte en fonction du gradient" series={sTau} xLog={logX} {...xr} xTitre="γ̇ (s⁻¹)" yTitre="τ (Pa)"
        reperes={mesure ? [] : [{ x: g, y: tauHB(g, p), c: col }]} />
      <div style={{ height: 8 }} />
      <Graphe aria="Courbe de viscosité : viscosité en fonction du gradient" series={sEta} xLog={logX} yLog={logY} {...xr} xTitre="γ̇ (s⁻¹)" yTitre="η (mPa·s)"
        reperes={mesure ? [] : [{ x: g, y: etaHB(g, p) * 1000, c: col }]} />
      {!mesure && <CurseurGradient i={gi} setI={setGi} />}
      <div style={{ marginTop: 6 }}>
        {!mesure && <LigneMesure nom="τ" valeur={`${fmt(tauHB(g, p), 1)}${NB}Pa`} couleur={col} />}
        {!mesure && <LigneMesure nom="η" valeur={`${fmt(etaHB(g, p) * 1000, 0)}${NB}mPa·s`} couleur={col} />}
        {!mesure && <LigneMesure nom="Comportement" valeur={comportement} />}
        {mesure && <LigneMesure nom="Écart moyen modèle / mesures" valeur={`${fmt(ecart * 100, 1)}${NB}%`} couleur={ecart < 0.05 ? "#15803d" : "#b45309"} />}
      </div>
      <Section titre={`Régler le modèle · ${resume}`} ouvert={ouvReglages} onBascule={() => setOuvReglages((o) => !o)}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8 }}>Le modèle de Herschel-Bulkley : τ = τ₀ + K·γ̇<sup>n</sup>. Chaque réglage change la forme des courbes.</div>
        {curseur("Seuil d’écoulement τ₀ (Pa)", p.tau0, maj("tau0"), 0, 40, 0.5, "Contrainte à dépasser pour que le produit coule. 0 : pas de seuil.")}
        {curseur("Consistance K (Pa·sⁿ)", p.K, maj("K"), 0.02, 20, 0.02, "Plus K est grand, plus le produit est épais.")}
        {curseur("Indice n (sans unité)", p.n, maj("n"), 0.3, 1.6, 0.01, "n = 1 : newtonien · n < 1 : rhéofluidifiant · n > 1 : rhéoépaississant.")}
        {!mesure && curseur("Thixotropie (0 = aucune)", p.thixo, maj("thixo"), 0, 0.6, 0.05, "Active l’aller-retour : plus la valeur est grande, plus le retour passe sous l’aller.")}
        {mesure && (
          <button type="button" style={styleBouton(false, "#16a34a")} onClick={() => { const a = ajusterHB(gammasAj, aller); setP({ tau0: a.tau0, K: +a.K.toFixed(2), n: +a.n.toFixed(2), thixo: 0 }); }}>
            Ajuster automatiquement (courbe aller)
          </button>
        )}
        <div style={{ fontSize: 13, color: "#92400e", marginTop: 6 }}>Hors référentiel : l’ajustement d’un modèle sur des mesures (Herschel-Bulkley) prolonge le programme, qui demande d’identifier le comportement sur le rhéogramme.</div>
      </Section>
      <Section titre="À essayer" ouvert={ouvEssayer} onBascule={() => setOuvEssayer((o) => !o)}>
        {puces(
          "Sélectionne le glycérol, puis le shampooing : que devient la courbe de viscosité quand le comportement n’est plus newtonien ?",
          "Pour la boue, passe γ̇ en échelle logarithmique : que devient η quand γ̇ devient très petit ? Pourquoi dit-on que le produit « ne s’écoule pas » sous le seuil ?",
          "Choisis la peinture B et lance « Ajuster automatiquement » : quelle valeur de τ₀ obtiens-tu ? Et pour la peinture A ? Que conclus-tu sur leur comportement ?",
          "Active l’aller-retour et augmente la thixotropie du shampooing : de quelle quantité la viscosité à 1 s⁻¹ baisse-t-elle au retour ?",
        )}
      </Section>
      <Section titre="À retenir" ouvert={ouvRetenir} onBascule={() => setOuvRetenir((o) => !o)}>
        <FTroisComportements />
        {puces(
          <>Un fluide <strong>newtonien</strong> a une viscosité constante ; un fluide <strong>plastique</strong> ne s’écoule qu’au-delà d’une <strong>contrainte seuil</strong> τ₀ ; un fluide <strong>thixotrope</strong> a une courbe retour sous la courbe aller.</>,
          <>η = τ / γ̇ : sur la courbe d’écoulement, c’est la pente de la droite qui joint l’origine au point.</>,
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Défi : « fluide mystère » tiré au hasard
// ---------------------------------------------------------------------------
function VoletDefi({ onValide }) {
  const nouveau = () => ({ f: tirerFluideMystere(), permut: Math.floor(Math.random() * 5) });
  const [t, setT] = useState(nouveau);
  const { f } = t;
  const [qType, setQType] = useState(null);
  const [qThixo, setQThixo] = useState(null);
  const [saisie, setSaisie] = useState("");
  const [verifie, setVerifie] = useState(false);
  const types = useMemo(() => ordreOptions(TYPES.map((x) => x.id), f.type, t.permut), [f, t.permut]);
  const optionsThixo = ["Oui : retour sous l’aller", "Non : courbes superposées"];
  const bonneThixo = f.thixotrope ? 0 : 1;
  const justes = {
    type: qType === types.bonne,
    thixo: qThixo === bonneThixo,
    eta: proche(lireNombre(saisie), f.etaVraie, 0.05),
  };
  const tous = justes.type && justes.thixo && justes.eta;
  const reinit = () => { setT(nouveau()); setQType(null); setQThixo(null); setSaisie(""); setVerifie(false); };
  const serieA = f.gammas.map((g, i) => [g, f.aller[i]]);
  const serieR = f.gammas.map((g, i) => [g, f.retour[i]]);
  const bloc = (cle, q, options, val, set, bonne, indice) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{q}</div>
      {options.map((o, i) => (
        <button key={i} type="button" style={{ ...stylePetitBouton(val === i, verifie && i === bonne ? "#15803d" : "#64748b"), display: "block", width: "100%", textAlign: "left", marginBottom: 4, minHeight: 36 }}
          onClick={() => { set(i); setVerifie(false); }}>
          {verifie && i === bonne ? "✓ " : val === i && verifie ? "✗ " : ""}{o}
        </button>
      ))}
      {verifie && <div style={{ fontSize: 13.5, color: justes[cle] ? "#15803d" : "#b91c1c" }}>{justes[cle] ? "Bien vu !" : "La bonne réponse est signalée en vert."}</div>}
      <IndiceDefi cache={verifie && justes[cle]}>{indice}</IndiceDefi>
    </div>
  );
  return (
    <div style={styleBoite}>
      <div style={{ fontWeight: 600 }}>Un fluide mystère vient d’être mesuré au viscosimètre : montée de γ̇ puis descente</div>
      <Graphe aria="Courbe d'écoulement du fluide mystère : contrainte en fonction du gradient, à la montée et à la descente"
        series={[{ pts: serieA, c: "#0f172a", marq: true }, { pts: serieR, c: "#ea580c", marq: true, tirets: true }]}
        x0={0} x1={300} xTitre="γ̇ (s⁻¹)" yTitre="τ (Pa)" />
      <Legende items={[{ c: "#0f172a", nom: "montée de γ̇ (aller)" }, { c: "#ea580c", nom: "descente de γ̇ (retour)", tirets: true }]} />
      <table style={{ borderCollapse: "collapse", margin: "8px auto", fontSize: 13.5 }}>
        <tbody>
          <tr>{["γ̇ (s⁻¹)", "τ aller (Pa)", "τ retour (Pa)"].map((h) => <th key={h} style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", background: "#f1f5f9" }}>{h}</th>)}</tr>
          {f.gammas.map((g, i) => (
            <tr key={g}>
              <td style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", textAlign: "center", fontWeight: 700 }}>{g}</td>
              <td style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", textAlign: "center" }}>{sig3(f.aller[i])}</td>
              <td style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", textAlign: "center" }}>{sig3(f.retour[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" style={{ ...styleBouton(false), marginTop: 4 }} onClick={reinit}><Pic n="refresh" />Nouveau fluide</button>
      <div style={{ marginTop: 10 }}>
        {bloc("type", "Quel est le comportement de ce fluide ?", types.options.map(nomDuType), qType, setQType, types.bonne,
          "Regarde la courbe de montée : passe-t-elle par l’origine ? Est-ce une droite ? Sinon, s’incurve-t-elle vers le bas (η diminue) ou vers le haut (η augmente) ?")}
        {bloc("thixo", "Ce fluide est-il thixotrope ?", optionsThixo, qThixo, setQThixo, bonneThixo,
          "Compare, pour un même γ̇, la contrainte à la montée et à la descente : un fluide thixotrope donne un retour nettement sous l’aller.")}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Calculer la viscosité du fluide à γ̇ = {f.gq}{NB}s⁻¹ (valeur de la montée), en Pa·s</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input value={saisie} onChange={(e) => { setSaisie(e.target.value); setVerifie(false); }} inputMode="decimal" aria-label="Viscosité en pascal-seconde"
              placeholder="Réponse" style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #cbd5e1", width: 140, fontSize: 16 }} />
            <span style={{ fontSize: 13, color: KIT.txt2 }}>Pa·s, 2 chiffres significatifs</span>
          </div>
          {verifie && <div style={{ fontSize: 13.5, color: justes.eta ? "#15803d" : "#b91c1c" }}>{justes.eta ? "Bien vu !" : `Attendu : environ ${fmt(f.etaVraie, 2)}${NB}Pa·s.`}</div>}
          <IndiceDefi cache={verifie && justes.eta}>
            η = τ / γ̇ : lis τ à la montée dans le tableau pour ce gradient, divise par γ̇. Une réponse à 5 % près est acceptée (arrondi à 2 chiffres significatifs).
          </IndiceDefi>
        </div>
      </div>
      <button type="button" style={styleBouton(true, "#16a34a")} onClick={() => { setVerifie(true); onValide(tous); }}>✓ Vérifier</button>
      <div style={{ marginTop: 8, fontSize: 14, color: KIT.txt }}>
        {verifie ? (tous ? "🎉 Trois réponses exactes : ce fluide n’a plus de secret pour toi." : `Score : ${Object.values(justes).filter(Boolean).length} / 3. Relance un nouveau fluide pour retenter.`)
          : "Réponds aux trois questions, puis vérifie."}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export function SimulationRheoCourbes() {
  const [mode, setMode] = useState(() => modeOuverture("rheo-courbes-v1"));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant("rheo-courbes-v1", { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [gi, setGi] = useState(2);
  const [fluide, setFluide] = useState("glycerol");
  const [giX, setGiX] = useState(4);
  const [rpm, setRpm] = useState(100);
  const [logX, setLogX] = useState(false);
  const [logY, setLogY] = useState(false);
  const [ouvHyp, setOuvHyp] = useState(false);
  // Sur téléphone, la consigne passe avant le graphique : l’élève lit la question puis regarde.
  const [etroit, setEtroit] = useState(() => typeof window !== "undefined" && window.innerWidth < 720);
  useEffect(() => {
    const maj = () => setEtroit(window.innerWidth < 720);
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);

  const etapes = [
    {
      titre: "Gradient, contrainte, viscosité",
      texte: <>
        {V("Un fluide est cisaillé entre un plan fixe et un plan mobile de surface S, tiré par une force tangentielle vec(F) qui lui donne la vitesse vec(v). Les couches de fluide glissent les unes sur les autres. ")}
        On définit le <strong>gradient de vitesse</strong> γ̇ (en s⁻¹), la <strong>contrainte de cisaillement</strong> τ (en Pa) et la <strong>viscosité dynamique</strong> η (en Pa·s). Un viscosimètre mesure, pour une huile, τ = 25{NB}Pa pour un gradient γ̇ = 2,0{NB}s⁻¹.
      </>,
      tache: {
        type: "num", q: "Viscosité dynamique η de cette huile", unite: "mPa·s", vrai: 12500, tol: 0.05, affiche: (v) => fmt(v, 0), cs: 3,
        calcul: () => ["η = τ / γ̇ = 25 Pa ÷ 2,0 s⁻¹ = 12,5 Pa·s.", "Conversion : 1 Pa·s = 1 000 mPa·s, donc η = 12 500 mPa·s."],
        pieges: [[12.5, "C’est la bonne valeur, mais en Pa·s. Convertissez en mPa·s : 1 Pa·s = 1 000 mPa·s."], [0.08, "Vous avez divisé γ̇ par τ. La viscosité est τ divisée par γ̇."]],
        expl: <>η = τ / γ̇ = 25 / 2,0 = 12,5 Pa·s = 12 500 mPa·s.</>,
        indice: "η = τ / γ̇, avec τ en Pa et γ̇ en s⁻¹ : le résultat est en Pa·s. Puis 1 Pa·s = 1 000 mPa·s.",
      },
    },
    {
      titre: "Le viscosimètre",
      retenirTitre: "Gradient, contrainte et viscosité",
      retenir: <>
        <FCisaillement maxWidth={300} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <Formule>{GD}<mo>=</mo><mfrac><mi>v</mi><mi>e</mi></mfrac><mspace width="1em" /><mi>τ</mi><mo>=</mo><mfrac><mi>F</mi><mi>S</mi></mfrac><mspace width="1em" /><mi>η</mi><mo>=</mo><mfrac><mi>τ</mi>{GD}</mfrac></Formule>
        </div>
        {puces(<>γ̇ en <strong>s⁻¹</strong>, τ en <strong>Pa</strong>, η en <strong>Pa·s</strong> (1 Pa·s = 1 000 mPa·s).</>, <>La <strong>viscosité cinématique</strong> ν = η / ρ s’exprime en m²·s⁻¹ (ρ : masse volumique).</>)}
      </>,
      texte: "Dans un viscosimètre rotatif, le moteur impose la vitesse de rotation N du mobile : elle fixe le gradient γ̇ (pour ce mobile, γ̇ = 0,30 × N, avec N en tr/min). Le capteur mesure ce qu’il faut fournir pour maintenir cette rotation. Déplace le curseur de vitesse.",
      tache: {
        type: "qcm", q: "Pour obtenir la contrainte τ, quelle grandeur le viscosimètre mesure-t-il ?",
        options: ["Le couple exercé sur le mobile", "La température de l’échantillon", "La masse volumique du fluide", "La durée d’un tour du mobile"], bonne: 0,
        indice: "Le moteur impose N, donc γ̇. Il reste à mesurer ce que le fluide oppose à la rotation du mobile : un effet de force, donc de moment de force.",
        expl: <>Le fluide freine le mobile : le capteur mesure le <strong>couple</strong> C nécessaire pour maintenir la rotation, et on en déduit τ. C’est le principe de la viscosimétrie rotative (viscosimètre Lamy RM 100+).</>,
      },
    },
    {
      titre: "Un fluide newtonien",
      texte: "Voici la courbe d’écoulement τ(γ̇) du glycérol, un liquide pur. Déplace le curseur de gradient et regarde la contrainte τ et la viscosité η dans les mesures.",
      tache: {
        type: "qcm", q: "Sur sa courbe d’écoulement, comment se reconnaît un fluide newtonien ?",
        options: ["Une droite qui passe par l’origine", "Une droite qui part du haut du graphique", "Une courbe qui s’incurve vers le bas", "Une courbe qui s’incurve vers le haut"], bonne: 0,
        indice: "Lis η pour γ̇ = 4 s⁻¹ puis γ̇ = 80 s⁻¹ : change-t-elle ? Que dire alors du rapport τ / γ̇ ?",
        expl: <>Pour le glycérol, η reste égale à 1 400 mPa·s quel que soit γ̇ : τ = η × γ̇ est proportionnelle à γ̇. La courbe d’écoulement est une <strong>droite passant par l’origine</strong>, de pente η : c’est le comportement <strong>newtonien</strong>.</>,
      },
    },
    {
      titre: "Un fluide pseudoplastique",
      texte: "Sélectionne maintenant le shampooing et compare avec le glycérol. La courbe de viscosité η(γ̇) apparaît sous la courbe d’écoulement.",
      tache: {
        type: "qcm", q: "Quand γ̇ augmente, comment varie la viscosité du shampooing ?",
        options: ["Elle diminue : la courbe d’écoulement s’incurve", "Elle reste constante : la courbe est une droite", "Elle augmente : la courbe s’incurve vers le haut", "Elle diminue, mais la courbe reste une droite"], bonne: 0,
        indice: "Lis η pour γ̇ = 1 s⁻¹ puis pour γ̇ = 300 s⁻¹. Compare la pente de la courbe d’écoulement près de l’origine et plus loin.",
        expl: <>La viscosité du shampooing chute quand γ̇ augmente : il est <strong>pseudoplastique</strong> (on dit aussi <strong>rhéofluidifiant</strong>). La pente de la courbe d’écoulement, c’est la viscosité : elle diminue, donc la courbe s’incurve vers le bas.</>,
      },
    },
    {
      titre: "Un fluide rhéoépaississant",
      texte: "La fécule de maïs mélangée à l’eau fait l’inverse du shampooing. Sélectionne-la et regarde ses deux courbes.",
      tache: {
        type: "qcm", q: "Quel comportement montre la fécule de maïs dans l’eau ?",
        options: ["Rhéoépaississant : η augmente avec γ̇", "Pseudoplastique : η diminue quand γ̇ augmente", "Newtonien : η ne dépend pas du gradient γ̇", "Plastique idéal : τ₀ > 0 et η constante"], bonne: 0,
        indice: "Lis η à γ̇ = 4 s⁻¹ puis à γ̇ = 300 s⁻¹ : dans quel sens varie-t-elle ?",
        expl: <>La viscosité augmente avec γ̇ : la courbe d’écoulement s’incurve vers le haut. C’est un fluide <strong>rhéoépaississant</strong>.</>,
      },
    },
    {
      titre: "La contrainte seuil",
      retenirTitre: "Newtonien, pseudoplastique, rhéoépaississant",
      retenir: <>
        <FTroisComportements />
        {puces(<>Newtonien : <strong>droite par l’origine</strong>, η constante (glycérol, eau).</>, <>Pseudoplastique : la pente de τ(γ̇), donc η, <strong>diminue</strong> quand γ̇ monte (shampooing, peinture).</>, <>Rhéoépaississant : η <strong>augmente</strong> avec γ̇ (fécule de maïs dans l’eau).</>)}
      </>,
      texte: "Une boue de forage ne coule que si on la pousse assez fort. Sélectionne-la et regarde où sa courbe d’écoulement coupe l’axe des τ.",
      tache: {
        type: "qcm", q: "Que représente l’ordonnée à l’origine τ₀ de la courbe d’écoulement de la boue ?",
        options: ["Le seuil : en dessous, le produit ne s’écoule pas", "Une contrainte maximale : au-dessus, le produit casse", "La viscosité du produit lorsque γ̇ tend vers zéro", "Le gradient à partir duquel le produit s’écoule"], bonne: 0,
        indice: "La courbe démarre à τ₀ pour γ̇ = 0 : que se passe-t-il si la contrainte appliquée est plus petite que τ₀ ?",
        expl: <>τ₀ est la <strong>contrainte seuil</strong> : tant que τ reste inférieure, le produit se comporte comme un solide et ne s’écoule pas. Cette courbe est une droite décalée : c’est un fluide <strong>plastique idéal</strong> (modèle de Bingham).</>,
      },
    },
    {
      titre: "Identifier un comportement",
      retenirTitre: "Les fluides à seuil",
      retenir: <>
        <FSeuil />
        {puces(<><strong>Plastique idéal</strong> : une droite qui ne passe pas par l’origine (seuil τ₀, puis viscosité constante).</>, <><strong>Plastique non idéal</strong> : un seuil τ₀, puis une courbe qui s’incurve (η diminue quand γ̇ augmente).</>, <>Sous le seuil, le produit ne coule pas : c’est lui qui fait tenir un ketchup ou une peinture sur un mur.</>)}
      </>,
      texte: "Voici les deux courbes d’un fluide X dont on ignore tout. Utilise ce que tu viens de voir : forme de la courbe d’écoulement, ordonnée à l’origine, évolution de la viscosité.",
      tache: {
        type: "qcm", q: "Quel est le comportement du fluide X ?",
        options: TYPES.map((t) => t.nom), bonne: 2,
        indice: "Deux questions : la courbe d’écoulement part-elle de l’origine ? est-ce une droite ? La courbe de viscosité, elle, diminue-t-elle ?",
        expl: <>La courbe d’écoulement <strong>ne passe pas par l’origine</strong> (seuil τ₀ ≈ 20 Pa) et <strong>s’incurve</strong>, et η diminue quand γ̇ augmente : plastique non idéal (rhéofluidifiant à seuil).</>,
      },
    },
    {
      titre: "Deux peintures mesurées",
      texte: "Voici de vraies mesures faites au viscosimètre sur deux peintures murales blanches, vendues pour le même usage mais à des prix très différents : gradient de 1 à 300 s⁻¹ (courbe « aller »). Compare-les, puis teste l’échelle logarithmique en γ̇ et en η. Pour la peinture B, on lit η(1 s⁻¹) = 28 000 mPa·s et η(300 s⁻¹) = 816 mPa·s.",
      tache: {
        type: "num", q: "Rapport η(1 s⁻¹) / η(300 s⁻¹) de la peinture B", unite: "(sans unité)", vrai: 28000 / 816, tol: 0.05, affiche: (v) => fmt(v, 1), cs: 2,
        calcul: () => ["Données lues : η(1 s⁻¹) = 28 000 mPa·s et η(300 s⁻¹) = 816 mPa·s (même unité, le rapport n’a pas d’unité).", `Rapport = 28 000 ÷ 816 ≈ ${fmt(28000 / 816, 1)}.`],
        pieges: [[816 / 28000, "Vous avez inversé le rapport : il faut η à 1 s⁻¹ divisée par η à 300 s⁻¹."]],
        expl: <>La viscosité de la peinture B est divisée par environ 34 entre 1 et 300 s⁻¹ (pour la A, par environ 21) : les deux peintures sont <strong>rhéofluidifiantes</strong>. La courbe de B ne part pas de l’origine : un <em>seuil apparent</em> de l’ordre de 13 Pa (extrapolé : à confirmer aux très bas gradients, à l’étape suivante) en ferait un plastique non idéal, alors que celui de A est faible.</>,
        indice: "Lis les deux viscosités dans l’énoncé : « η(1 s⁻¹) = 28 000 mPa·s et η(300 s⁻¹) = 816 mPa·s ». Un rapport de deux grandeurs de même unité n’a pas d’unité.",
      },
    },
    {
      titre: "Descendre sous 1 s⁻¹ : le rhéomètre",
      texte: <>
        Ton viscosimètre ne descend pas sous 1 s⁻¹, alors qu’un <strong>rhéomètre</strong> peut aller jusqu’à 0,001 s⁻¹. Pour voir ce qui se passe aux très bas gradients, on complète les mesures réelles par des points de rhéomètre <strong>simulés</strong> (inventés, en tirets), cohérents avec elles. Pour la peinture B, la contrainte vaut {nombreFr(TAU_RHEO.B[0])}{NB}Pa à 0,001{NB}s⁻¹, {nombreFr(TAU_RHEO.B[1])}{NB}Pa à 0,002{NB}s⁻¹ et {nombreFr(TAU_RHEO.B[2])}{NB}Pa à 0,005{NB}s⁻¹.
      </>,
      tache: {
        type: "num", q: "Palier de contrainte de la peinture B quand γ̇ tend vers 0 (moyenne des trois valeurs données)", unite: "Pa", vrai: SEUIL_B_LU, tol: 0.06, affiche: (v) => fmt(v, 1), cs: 3,
        calcul: () => [`Moyenne = (${nombreFr(TAU_RHEO.B[0])} + ${nombreFr(TAU_RHEO.B[1])} + ${nombreFr(TAU_RHEO.B[2])}) ÷ 3 = ${nombreFr(SEUIL_B_LU)} Pa.`, "Cette valeur est le seuil d’écoulement apparent τ₀ de la peinture B."],
        pieges: [[TAU_RHEO.B[0] + TAU_RHEO.B[1] + TAU_RHEO.B[2], "Vous avez additionné les trois valeurs : divisez par 3 pour la moyenne."], [0, "La contrainte ne tend pas vers zéro : la courbe reste sur un palier."]],
        expl: <>Aux très bas gradients, la contrainte de B ne tend <strong>pas vers 0</strong> : elle reste sur un <strong>palier d’environ {fmt(SEUIL_B_LU, 0)}{NB}Pa</strong>. C’est la <strong>contrainte seuil</strong> apparente τ₀ : en dessous, la peinture ne coule pas, ce qui l’empêche de couler sur le mur ou de sédimenter dans le pot. Avec le seul viscosimètre, on ne pouvait que l’<em>extrapoler</em> : des seuils de 10 à 15 Pa ajustent aussi bien les mesures à γ̇ ≥ 1 s⁻¹.</>,
        indice: "Additionne les trois contraintes, puis divise par 3. Le résultat est en Pa.",
      },
    },
    {
      titre: "Seuil ou pas ?",
      retenirTitre: "Lire un seuil d’écoulement",
      retenir: <>
        <FSeuilBas />
        {puces(<>Un <strong>seuil</strong> se lit aux <strong>très bas gradients</strong> : la contrainte cesse de baisser et reste sur un <strong>palier τ₀</strong>.</>, <>Sans seuil, τ tend vers <strong>0</strong> quand γ̇ tend vers 0.</>, <>Un viscosimètre qui ne descend pas sous 1 s⁻¹ ne donne qu’un seuil <strong>extrapolé</strong> ; un rhéomètre le <strong>mesure</strong>.</>)}
      </>,
      texte: <>La peinture A est maintenant tracée aussi : ses points de rhéomètre sont inventés comme ceux de B. Aux très bas gradients, sa contrainte vaut {nombreFr(TAU_RHEO.A[0], 2)}{NB}Pa à 0,001{NB}s⁻¹, {nombreFr(TAU_RHEO.A[1], 2)}{NB}Pa à 0,002{NB}s⁻¹ et {nombreFr(TAU_RHEO.A[2], 2)}{NB}Pa à 0,005{NB}s⁻¹. Regarde aussi la courbe de viscosité.</>,
      tache: {
        type: "qcm", q: "Que peut-on dire de la peinture A aux très bas gradients ?",
        options: ["Sa contrainte tend vers 0 : pas de seuil d’écoulement", "Sa contrainte garde un palier non nul : elle a un seuil de 15 Pa", "Sa viscosité reste constante sur toute la plage de γ̇ mesurée", "Elle a le même seuil que la peinture B, car les deux sont rhéofluidifiantes"], bonne: 0,
        indice: "Compare la peinture A à la B : que vaut τ pour A quand γ̇ devient très petit ? Reste-t-elle sur un palier ?",
        expl: <>Pour A, τ continue de diminuer avec γ̇ et tend vers <strong>0</strong> : pas de seuil, et sa viscosité tend vers un palier aux très bas gradients. Pour B, la viscosité <strong>augmente sans limite</strong> quand γ̇ diminue (courbe de pente −1 en échelles logarithmiques : η = τ₀ / γ̇) : c’est la signature d’un seuil.</>,
      },
    },
    {
      titre: "La boucle aller-retour",
      texte: "Après la montée de γ̇ jusqu’à 300 s⁻¹, on l’a redescendu jusqu’à 1 s⁻¹ (courbe « retour », en tirets, avec des points creux). Compare l’aller et le retour pour chaque peinture.",
      tache: {
        type: "qcm", q: "Les courbes aller et retour ne sont pas superposées. Comment l’interpréter ?",
        options: ["Thixotrope : la structure se reconstruit lentement", "Rhéoépaississant : le cisaillement augmente la viscosité", "Thixotrope : la peinture sèche pendant la mesure", "Newtonien : la viscosité dépend de l’échantillon"], bonne: 0,
        indice: "Au retour, la viscosité est plus faible qu’à l’aller pour le même γ̇ : la peinture « se souvient » du cisaillement subi. Que s’est-il passé dans sa structure ?",
        expl: <>Le cisaillement fort détruit la structure du produit ; elle ne se reconstruit pas instantanément. Au retour, la viscosité est donc plus faible qu’à l’aller : le comportement est <strong>thixotrope</strong>. Une peinture qui sèche donnerait une viscosité plus grande, pas plus petite.</>,
      },
    },
    {
      titre: "Mesurer l’écart",
      retenirTitre: "Thixotropie",
      retenir: <>
        <FBoucle />
        {puces(<>Un fluide <strong>thixotrope</strong> : sa viscosité baisse sous cisaillement et ne revient que <strong>lentement</strong> au repos.</>, <>Sur le rhéogramme : la courbe <strong>retour passe sous la courbe aller</strong>.</>, <>Idée fausse : « il y a un seuil, donc c’est thixotrope ». Vrai : la thixotropie est un effet du <strong>temps</strong>, pas du seuil.</>)}
      </>,
      texte: "Pour la peinture B, à γ̇ = 1 s⁻¹ : η = 28 000 mPa·s à l’aller et η = 20 300 mPa·s au retour. Quantifie l’écart.",
      tache: {
        type: "num", q: "Perte relative de viscosité de la peinture B à 1 s⁻¹ (retour par rapport à l’aller)", unite: "%", vrai: ((28000 - 20300) / 28000) * 100, tol: 0.05, affiche: (v) => fmt(v, 1), cs: 2,
        calcul: () => ["Perte = (η aller − η retour) ÷ η aller = (28 000 − 20 300) ÷ 28 000 = 7 700 ÷ 28 000 ≈ 0,275.", "En pourcentage : 27,5 %."],
        pieges: [[0.275, "Vous avez donné la fraction ; multipliez par 100 pour l’exprimer en %."], [72.5, "C’est le rapport η retour / η aller. La perte est ce qui manque : 100 % moins cette valeur."]],
        expl: <>La viscosité à 1 s⁻¹ a baissé d’environ 27 % au retour : la structure détruite par le cisaillement n’est pas encore reconstruite. Pour la peinture A, la perte est plus faible (environ 17 %).</>,
        indice: "Perte relative = (η aller − η retour) ÷ η aller. Exprime-la en pourcentage.",
      },
    },
    {
      titre: "Le bilan",
      texte: <>
        Tu sais lire un rhéogramme. Retiens les <strong>deux courbes</strong> et leur lien : η = τ / γ̇.
        {puces(
          <>Sur la courbe d’écoulement : droite par l’origine, newtonien ; courbe qui s’incurve vers le bas, pseudoplastique ; vers le haut, rhéoépaississant.</>,
          <>Une courbe qui ne part pas de l’origine : fluide plastique (idéal si la courbe est droite, non idéal sinon).</>,
          <>Aux très bas gradients, un seuil se lit sur un palier de contrainte (τ ne tend pas vers 0).</>,
          <>Aller et retour non superposés : thixotrope.</>,
        )}
        Passe à l’exploration pour ajuster un modèle sur les mesures des peintures, ou au défi pour identifier un fluide mystère.
      </>,
    },
  ];

  const dernier = etapes.length - 1;
  const finParcours = !!(guide.reussies && guide.reussies[dernier - 1]) || guide.etape >= dernier;
  const fin = guide.etape >= dernier
    ? <button type="button" style={styleBouton(true, "#16a34a")} onClick={() => setMode("explore")}>Passer à l’exploration ▶</button>
    : null;

  const panneauGuide = () => {
    const e = Math.min(guide.etape, etapes.length - 1);
    if (e === 0) return <FCisaillement />;
    if (e === 1) return (
      <div>
        <FViscosimetre />
        <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: KIT.txt2 }}>
          Vitesse de rotation N = <span style={{ color: KIT.txt }}>{rpm}{NB}tr/min</span>
          <input type="range" min={0} max={1000} step={10} value={rpm} onChange={(ev) => setRpm(parseInt(ev.target.value, 10))} aria-label="Vitesse de rotation"
            style={{ width: "100%", display: "block", minHeight: 30, accentColor: "#0284c7" }} />
        </label>
        <LigneMesure nom="γ̇ = 0,30 × N" valeur={`${fmt(0.3 * rpm, 0)}${NB}s⁻¹`} />
      </div>
    );
    if (e >= 2 && e <= 5) {
      const ids = e === 2 ? ["glycerol"] : e === 3 ? ["glycerol", "shampooing"] : e === 4 ? ["glycerol", "shampooing", "fecule"] : ["glycerol", "shampooing", "fecule", "boue"];
      return <PanneauFluide ids={ids} sel={fluide} setSel={setFluide} gi={gi} setGi={setGi} viscosite={e >= 3} />;
    }
    if (e === 6) return <PanneauFluide ids={["mystere"]} sel="mystere" setSel={() => {}} gi={giX} setGi={setGiX} viscosite anonyme mesureEta={false} />;
    if (e === 8 || e === 9) return <PanneauRheometre avecA={e >= 9} />;
    return <PanneauPeintures retour={e >= 10} logX={logX} setLogX={setLogX} logY={logY} setLogY={setLogY} avecLog={e >= 7} />;
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Courbes d’écoulement et de viscosité : lire un rhéogramme</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>

      {mode === "guide" && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start", marginTop: 10 }}>
          <div style={{ flex: "2 1 420px", minWidth: 280, order: etroit ? 2 : 1 }}>{panneauGuide()}</div>
          <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 10, order: etroit ? 1 : 2 }}>
            <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={fin} />
          </div>
        </div>
      )}

      {mode === "explore" && <Exploration />}

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
