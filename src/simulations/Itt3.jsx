// Vue — simulation « Thixotropie : le test 3ITT » (BTS MDC, formulation).
// Modèle pur : itt3Modele.js ; données réelles : itt3Donnees.js ; test : itt3Modele.test.mjs ; exercices : itt3Exos.js, Itt3Realiser.jsx.
// Parcours guidé progressif (au plus trois zones d'information dans les trois premières étapes), exploration allégée
// (points d'abord, modèle en option), défi « peinture mystère ».

import { useEffect, useMemo, useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { puces } from "./Travail";
import { Graphe, Legende } from "./RheoCourbesGraphes";
import { FTroisIntervalles, FMethodes, FCompromis } from "./Itt3Graphes";
import {
  DONNEES_3ITT, PARAMS_3ITT, COULEURS, D1, D2, D3, G_BAS, G_HAUT, serieModele, etaRef, regenPct, tempsRegen, pente,
  tirerPeintureMystere, ordreOptions, NOMS_VERDICT, SEUIL_RAPIDE, SEUIL_LENT,
} from "./itt3Modele";

const SIM_ID = 218;
declarerDefis(SIM_ID, [["principal", "La peinture mystère"]]);

const NB = " ";
const virg = (x, d = 0) => fmt(x, d);
const milliers = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
const DEBUT3 = D1 + D2;

// Gradient imposé (en escalier) pour le graphe du haut.
const ESCALIER = [[0, G_BAS], [D1, G_BAS], [D1, G_HAUT], [DEBUT3, G_HAUT], [DEBUT3, G_BAS], [DEBUT3 + D3, G_BAS]];
const TEMPS = DONNEES_3ITT.A.map((q) => q[0]); // mêmes instants pour A et B

// ---------------------------------------------------------------------------
// Graphes du test : gradient imposé et viscosité mesurée.
// ---------------------------------------------------------------------------
function GraphesITT({ cles, avecEta, tc, ligne25, yLog, xMax = DEBUT3 + D3, serieExtra = [] }) {
  const t = TEMPS[tc];
  const sEta = [];
  cles.forEach((k) => sEta.push({ pts: DONNEES_3ITT[k], c: COULEURS[k], marq: true, pointsSeuls: true }));
  if (ligne25) sEta.push({ pts: [[DEBUT3, ligne25], [xMax, ligne25]], c: "#7c3aed", tirets: true, ep: 2 });
  serieExtra.forEach((s) => sEta.push(s));
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: KIT.txt }}>Gradient de vitesse imposé au cours du temps</div>
      <Graphe aria="Gradient de vitesse imposé au cours du temps : 1 s⁻¹ pendant 20 s, 256 s⁻¹ pendant 20 s, puis 1 s⁻¹ pendant 80 s" series={[{ pts: ESCALIER, c: COULEURS.fort, ep: 3 }]}
        x0={0} x1={xMax} y0={0.5} y1={1000} yLog xTitre="t (s)" yTitre="γ̇ (s⁻¹)" vh={200} reperes={avecEta ? [{ x: t, y: t > D1 && t <= DEBUT3 ? G_HAUT : G_BAS, c: COULEURS.fort }] : []} />
      {avecEta && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, margin: "10px 0 2px", color: KIT.txt }}>Viscosité mesurée</div>
          <Graphe aria="Viscosité mesurée au cours du temps pendant les trois intervalles du test 3ITT" series={sEta} x0={0} x1={xMax} yLog={yLog}
            {...(yLog ? { y0: 100, y1: 100000 } : { y0: 0, y1: 30000 })} xTitre="t (s)" yTitre="η (mPa·s)"
            reperes={cles.map((k) => { const e = DONNEES_3ITT[k][tc][1]; return { x: t, y: e, c: COULEURS[k] }; })} />
          <Legende items={[
            ...cles.map((k) => ({ c: COULEURS[k], nom: `Peinture ${k} (mesures)` })),
            ...(ligne25 ? [{ c: "#7c3aed", nom: "25 % de ηref", tirets: true }] : []),
          ]} />
        </>
      )}
    </div>
  );
}

function CurseurTemps({ tc, setTc, cles }) {
  const t = TEMPS[tc];
  const intervalle = t <= D1 ? "intervalle 1" : t <= DEBUT3 ? "intervalle 2" : "intervalle 3";
  const g = t <= D1 || t > DEBUT3 ? G_BAS : G_HAUT;
  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: KIT.txt2 }}>
        Instant t = <span style={{ color: KIT.txt }}>{virg(t, 1)}{NB}s</span> ({intervalle})
        <input type="range" min={0} max={TEMPS.length - 1} step={1} value={tc} onChange={(e) => setTc(parseInt(e.target.value, 10))} aria-label="Instant de la mesure"
          style={{ width: "100%", display: "block", minHeight: 30, accentColor: "#0284c7" }} />
      </label>
      <LigneMesure nom="γ̇ imposé" valeur={`${g}${NB}s⁻¹`} couleur={COULEURS.fort} />
      {cles.map((k) => <LigneMesure key={k} nom={`η de la peinture ${k}`} valeur={`${milliers(DONNEES_3ITT[k][tc][1])}${NB}mPa·s`} couleur={COULEURS[k]} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hypothèses de travail
// ---------------------------------------------------------------------------
function Hypotheses() {
  return (
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
      {puces(
        <>Les mesures des peintures A et B sont <strong>réelles</strong> (viscosimètre Lamy RM 100+, mobile MSR3, température ambiante ≈ 22,5 °C) : γ̇ = 1 s⁻¹ pendant 20 s, 256 s⁻¹ pendant 20 s, puis 1 s⁻¹ pendant 80 s. Les premiers points (viscosité négative) sont un artefact de mesure, écartés. Aucune incertitude n’est annoncée.</>,
        <>La <strong>viscosité de référence</strong> ηref est celle du dernier point de l’intervalle 1. Les temps de régénération sont comptés <strong>depuis le début de l’intervalle 3</strong> (t = 40 s) et interpolés linéairement entre deux points de mesure (un point toutes les 3,8 s environ).</>,
        <>Le <strong>modèle</strong> décrit la structure de la peinture par un seul paramètre λ (1 : structure intacte, 0 : détruite) : le cisaillement la détruit, le repos la reconstruit. La structure ajoute une contrainte τs, qui pèse beaucoup à bas gradient et peu à fort gradient. Les paramètres sont choisis pour retrouver l’allure des mesures, ce n’est pas une identification rigoureuse.</>,
        <>Les repères « régénération trop rapide (t50 ≤ {SEUIL_RAPIDE}{NB}s) », « équilibrée » et « trop lente (t50 &gt; {SEUIL_LENT}{NB}s) » de l’exploration et du défi sont des <strong>ordres de grandeur pédagogiques</strong>, pas des normes : le bon compromis dépend de la peinture, de l’épaisseur appliquée et de l’outil.</>,
        <>En industrie, le 3ITT se réalise surtout avec un <strong>rhéomètre rotatif</strong> (vitesses imposées, changements très rapides entre intervalles, température régulée) ; un viscosimètre rotatif à vitesse imposée peut aussi le réaliser. Les gradients et les durées varient d’un laboratoire à l’autre : <strong>on ne compare que des essais faits avec la même méthode</strong> (mêmes γ̇, mêmes durées, même température).</>,
        <>Température constante, échantillon homogène, pas de glissement à la paroi.</>,
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exploration libre : points mesurés d'abord, courbe du modèle en option.
// ---------------------------------------------------------------------------
const NOMS_SOURCES = { A: "Peinture A (mesures réelles)", B: "Peinture B (mesures réelles)", AB: "Peinture A et B superposées (mesures)", sim: "Peinture simulée (modèle seul)" };
const tregDe = (p) => 1 / (p.kr + p.kd);
const paramsDe = (r, n) => ({ K: r.K, n, tauS: r.tauS, kr: 1 / (1.2 * r.treg), kd: 1 / (1.2 * r.treg) / 5 });
const reglagesDe = (k) => (k === "sim" ? { K: 1, tauS: 18, treg: 20 } : { K: PARAMS_3ITT[k].K, tauS: PARAMS_3ITT[k].tauS, treg: Math.round(tregDe(PARAMS_3ITT[k])) });
const nA = (x, d = 1) => (x == null ? "—" : `${virg(x, d)}`);

function Exploration() {
  const [src, setSrc] = useState("A");
  const [reg, setReg] = useState(reglagesDe("A"));
  const [gh, setGh] = useState(G_HAUT);
  const [d2, setD2] = useState(D2);
  const [pts, setPts] = useState(true);
  const [mod, setMod] = useState(false);
  const [tM1, setTM1] = useState(80);
  const [logY, setLogY] = useState(false);
  const [ouvOptions, setOuvOptions] = useState(false);
  const [ouvEssayer, setOuvEssayer] = useState(false);
  const [ouvRetenir, setOuvRetenir] = useState(false);
  const reel = src !== "sim";
  const dbl = src === "AB";
  const cles = dbl ? ["A", "B"] : reel ? [src] : [];
  const n = reel && !dbl ? PARAMS_3ITT[src].n : 0.95;
  const changer = (k) => { setSrc(k); setReg(reglagesDe(k === "AB" ? "A" : k)); setPts(k !== "sim"); setMod(k === "sim"); };
  const optsTest = reel ? {} : { g2: gh, d2 };
  const d2e = reel ? D2 : d2;
  const debut3 = D1 + d2e;
  const modele = useMemo(() => serieModele(paramsDe(reg, n), { pas: 0.5, ...optsTest }), [reg, n, gh, d2, reel]); // eslint-disable-line react-hooks/exhaustive-deps
  const serie = reel ? DONNEES_3ITT[dbl ? "A" : src] : modele; // série dont on lit M1, M2, M3
  const xMax = debut3 + D3;
  const col = reel && !dbl ? COULEURS[src] : COULEURS.modele;
  const sEta = [];
  if (reel && pts) cles.forEach((k) => sEta.push({ pts: DONNEES_3ITT[k], c: COULEURS[k], marq: true, pointsSeuls: true }));
  if (mod && !dbl) sEta.push({ pts: modele, c: COULEURS.modele, tirets: true, ep: 2.6 });
  const grad = [[0, G_BAS], [D1, G_BAS], [D1, reel ? G_HAUT : gh], [debut3, reel ? G_HAUT : gh], [debut3, G_BAS], [xMax, G_BAS]];
  const ref = etaRef(serie, D1);
  const resultats = (s) => ({ ref: etaRef(s, D1), m1: regenPct(s, tM1, D1, d2e), t25: tempsRegen(s, 25, D1, d2e), t50: tempsRegen(s, 50, D1, d2e), pente: pente(s, 5, 25, D1, d2e) });
  const rS = resultats(serie), rM = dbl ? resultats(DONNEES_3ITT.B) : mod && reel ? resultats(modele) : null;
  const maj = (cle) => (v) => setReg((q) => ({ ...q, [cle]: v }));
  const etat = (actif) => ({ ...stylePetitBouton(actif, "#0f766e"), minHeight: 38 });
  const curseur = (nom, v, f, min, max, pas, aide, unite = "") => (
    <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: KIT.txt2, fontWeight: 700 }}>
      {nom} <span style={{ color: KIT.txt }}>{fmt(v, pas < 0.1 ? 2 : pas < 1 ? 1 : 0)}{unite}</span>
      <input type="range" min={min} max={max} step={pas} value={v} onChange={(e) => f(parseFloat(e.target.value))} aria-label={nom}
        style={{ width: "100%", display: "block", minHeight: 30, accentColor: "#0284c7" }} />
      <span style={{ fontWeight: 400, fontSize: 13 }}>{aide}</span>
    </label>
  );
  const ligneRes = (nom, a, b, unite) => (
    <tr key={nom}>
      <td style={{ padding: "3px 6px", color: KIT.txt2 }}>{nom}</td>
      <td style={{ padding: "3px 6px", fontWeight: 700, textAlign: "right", fontFamily: "monospace" }}>{a}{a !== "—" ? `${NB}${unite}` : ""}</td>
      {rM && <td style={{ padding: "3px 6px", fontWeight: 700, textAlign: "right", fontFamily: "monospace", color: dbl ? COULEURS.B : COULEURS.modele }}>{b}{b !== "—" ? `${NB}${unite}` : ""}</td>}
    </tr>
  );
  return (
    <div style={{ marginTop: 10 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>
        Peinture étudiée
        <select value={src} onChange={(e) => changer(e.target.value)} aria-label="Peinture étudiée"
          style={{ display: "block", width: "100%", minHeight: 42, fontSize: 16, padding: "6px 8px", borderRadius: 10, border: `1px solid ${KIT.bord}`, marginTop: 2 }}>
          {Object.entries(NOMS_SOURCES).map(([k, nom]) => <option key={k} value={k}>{nom}</option>)}
        </select>
      </label>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: KIT.txt }}>Gradient imposé</div>
      <Graphe aria="Gradient de vitesse imposé au cours du temps" series={[{ pts: grad, c: COULEURS.fort, ep: 3 }]} x0={0} x1={xMax} y0={0.5} y1={1000} yLog xTitre="t (s)" yTitre="γ̇ (s⁻¹)" vh={170} />
      <div style={{ fontWeight: 700, fontSize: 14, margin: "8px 0 2px", color: KIT.txt }}>Viscosité au cours du temps</div>
      <Graphe aria="Viscosité au cours du temps : points mesurés et modèle" series={sEta} x0={0} x1={xMax} yLog={logY} {...(logY ? { y0: 100, y1: 100000 } : { y0: 0, y1: 30000 })} xTitre="t (s)" yTitre="η (mPa·s)" />
      <Legende items={[
        ...(reel && pts ? cles.map((k) => ({ c: COULEURS[k], nom: dbl ? `Peinture ${k} (points)` : "Points mesurés" })) : []),
        ...(mod && !dbl ? [{ c: COULEURS.modele, nom: "Courbe du modèle", tirets: true }] : []),
      ]} />
      <div style={{ fontSize: 13.5, color: KIT.txt2, margin: "6px 0 4px" }}>
        Un <strong>point</strong> est une mesure ; la <strong>courbe</strong> est un modèle qui essaie de passer au plus près des points.
      </div>
      <div role="group" aria-label="Éléments affichés" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {reel && <button type="button" style={etat(pts)} aria-pressed={pts} onClick={() => setPts(!pts)}>Points de mesure</button>}
        {!dbl && <button type="button" style={etat(mod)} aria-pressed={mod} onClick={() => setMod(!mod)}>Courbe du modèle</button>}
        <button type="button" style={etat(logY)} aria-pressed={logY} onClick={() => setLogY(!logY)}>η en échelle logarithmique</button>
      </div>

      <div style={{ ...styleBoite, marginTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Résultats du test {reel ? "(lus sur les mesures)" : "(lus sur le modèle)"}</div>
        <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: KIT.txt2 }}>
          M1 : instant t après le début de l’intervalle 3 = <span style={{ color: KIT.txt }}>{tM1}{NB}s</span>
          <input type="range" min={5} max={80} step={1} value={tM1} onChange={(e) => setTM1(parseInt(e.target.value, 10))} aria-label="Instant pour la méthode M1"
            style={{ width: "100%", display: "block", minHeight: 30, accentColor: "#0284c7" }} />
        </label>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <tbody>
            {rM && <tr><td /><td style={{ textAlign: "right", fontSize: 13, color: dbl ? COULEURS.A : col, fontWeight: 700 }}>{dbl ? "Peinture A" : "Mesures"}</td><td style={{ textAlign: "right", fontSize: 13, color: dbl ? COULEURS.B : COULEURS.modele, fontWeight: 700 }}>{dbl ? "Peinture B" : "Modèle"}</td></tr>}
            {ligneRes("ηref (fin de l’intervalle 1)", milliers(rS.ref), rM ? milliers(rM.ref) : "—", "mPa·s")}
            {ligneRes("M1 : régénération à cet instant", nA(rS.m1, 0), rM ? nA(rM.m1, 0) : "—", "%")}
            {ligneRes("M2 : temps pour 25 %", nA(rS.t25), rM ? nA(rM.t25) : "—", "s")}
            {ligneRes("M2 : temps pour 50 %", nA(rS.t50), rM ? nA(rM.t50) : "—", "s")}
            {ligneRes("M3 : pente entre 5 s et 25 s", rS.pente == null ? "—" : milliers(rS.pente), rM && rM.pente != null ? milliers(rM.pente) : "—", "mPa·s/s")}
          </tbody>
        </table>
        {ref && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Temps comptés depuis le début de l’intervalle 3 (t = {debut3}{NB}s), par interpolation entre deux points.</div>}
      </div>

      {mod && !dbl && (
        <div style={{ ...styleBoite, marginTop: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Régler le modèle de structure</div>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8 }}>{reel ? "Modifie les réglages jusqu’à ce que la courbe passe au plus près des points." : "Modifie les réglages : le test se recalcule."}</div>
          {curseur("Structure τs (Pa)", reg.tauS, maj("tauS"), 5, 40, 0.5, "Contrainte que la structure ajoute au repos : plus elle est grande, plus la peinture est visqueuse au repos.")}
          {curseur("Temps de régénération (s)", reg.treg, maj("treg"), 5, 120, 1, "Durée caractéristique de reconstruction de la structure : petit = régénération rapide.", " s")}
          {curseur("Viscosité sans structure K (Pa·sⁿ)", reg.K, maj("K"), 0.3, 3, 0.05, "Viscosité de la peinture quand sa structure est détruite : elle fixe le creux de l’intervalle 2.")}
        </div>
      )}

      {!reel && (
        <Section titre={`Réglages du test · γ̇ fort ${gh} s⁻¹ · intervalle 2 de ${d2} s`} ouvert={ouvOptions} onBascule={() => setOuvOptions((o) => !o)}>
          {curseur("Gradient fort (s⁻¹)", gh, setGh, 50, 500, 10, "Plus il est fort, plus la structure est détruite.")}
          {curseur("Durée de l’intervalle 2 (s)", d2, setD2, 5, 40, 1, "Un cisaillement plus court détruit moins la structure.")}
        </Section>
      )}
      <Section titre="À essayer" ouvert={ouvEssayer} onBascule={() => setOuvEssayer((o) => !o)}>
        {puces(
          "Choisis « A et B superposées » : les deux séries sur le même graphique et leurs résultats côte à côte. Leurs M1 et leurs temps t25 et t50 sont proches. Qu’est-ce qui les distingue ? Regarde ηref et la pente M3.",
          "Choisis la peinture simulée : diminue le temps de régénération. Que deviennent t25 et t50 ? Quel défaut risque-t-on pour une peinture qui se régénère très vite ?",
          "Pour la peinture simulée, raccourcis l’intervalle 2 à 5 s : que devient la viscosité au début de l’intervalle 3 ? Que conclus-tu sur la destruction de la structure ?",
          "Pour la peinture A, active le modèle et augmente la structure τs : que deviennent ηref et la hauteur de la remontée ?",
        )}
      </Section>
      <Section titre="À retenir" ouvert={ouvRetenir} onBascule={() => setOuvRetenir((o) => !o)}>
        <FTroisIntervalles />
        {puces(
          <>Test 3ITT : intervalle 1 au repos (ηref), intervalle 2 à fort gradient (structure détruite), intervalle 3 au repos (la structure se reconstruit).</>,
          <>Régénération : M1 (% de ηref à un instant), M2 (temps pour 25 % ou 50 %), M3 (pente de η(t)).</>,
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Défi : « peinture mystère »
// ---------------------------------------------------------------------------
function VoletDefi({ onValide }) {
  const nouveau = () => ({ f: tirerPeintureMystere(), permut: Math.floor(Math.random() * 3) });
  const [t, setT] = useState(nouveau);
  const { f } = t;
  const [saisie1, setSaisie1] = useState("");
  const [saisie2, setSaisie2] = useState("");
  const [qV, setQV] = useState(null);
  const [verifie, setVerifie] = useState(false);
  const verdicts = useMemo(() => ordreOptions(["rapide", "equilibree", "lente"], f.verdict, t.permut), [f, t.permut]);
  const justes = {
    m1: proche(lireNombre(saisie1), f.m1, 0.05),
    t50: proche(lireNombre(saisie2), f.t50, 0.15),
    verdict: qV === verdicts.bonne,
  };
  const tous = justes.m1 && justes.t50 && justes.verdict;
  const reinit = () => { setT(nouveau()); setSaisie1(""); setSaisie2(""); setQV(null); setVerifie(false); };
  const pointsAff = f.table.map(([tr, e]) => [DEBUT3 + tr, e]);
  const entree = (valeur, set, nom, unite, indice, ok, attendu) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{nom}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input value={valeur} onChange={(e) => { set(e.target.value); setVerifie(false); }} inputMode="decimal" aria-label={nom}
          placeholder="Réponse" style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #cbd5e1", width: 140, fontSize: 16 }} />
        <span style={{ fontSize: 13, color: KIT.txt2 }}>{unite}</span>
      </div>
      {verifie && <div style={{ fontSize: 13.5, color: ok ? "#15803d" : "#b91c1c" }}>{ok ? "Bien vu !" : `Attendu : environ ${attendu}.`}</div>}
      <IndiceDefi cache={verifie && ok}>{indice}</IndiceDefi>
    </div>
  );
  return (
    <div style={styleBoite}>
      <div style={{ fontWeight: 600 }}>Une peinture inconnue passe le test 3ITT : γ̇ = 1 s⁻¹ pendant 20 s, 256 s⁻¹ pendant 20 s, puis 1 s⁻¹ pendant 80 s</div>
      <div style={{ fontSize: 14, margin: "6px 0" }}>Viscosité de référence (fin de l’intervalle 1) : <strong>ηref = {milliers(f.ref)}{NB}mPa·s</strong>. Viscosité mesurée dans l’intervalle 3 :</div>
      <Graphe aria="Viscosité mesurée dans l'intervalle 3 du test 3ITT de la peinture mystère" series={[{ pts: pointsAff, c: "#0f172a", marq: true, pointsSeuls: true }, { pts: [[DEBUT3, f.ref], [DEBUT3 + D3, f.ref]], c: "#64748b", tirets: true, ep: 2 }]}
        x0={DEBUT3} x1={DEBUT3 + D3} y0={0} y1={Math.ceil((f.ref * 1.1) / 5000) * 5000} xTitre="t (s)" yTitre="η (mPa·s)" />
      <Legende items={[{ c: "#0f172a", nom: "Mesures" }, { c: "#64748b", nom: "ηref", tirets: true }]} />
      <table style={{ borderCollapse: "collapse", margin: "8px auto", fontSize: 13.5 }}>
        <tbody>
          <tr>{["t depuis le début de l’intervalle 3 (s)", "η (mPa·s)"].map((h) => <th key={h} style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", background: "#f1f5f9" }}>{h}</th>)}</tr>
          {f.table.map(([tr, e]) => (
            <tr key={tr}>
              <td style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", textAlign: "center", fontWeight: 700 }}>{tr}</td>
              <td style={{ border: `1px solid ${KIT.bord}`, padding: "3px 8px", textAlign: "center" }}>{milliers(e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" style={{ ...styleBouton(false), marginTop: 4 }} onClick={reinit}><Pic n="refresh" />Nouvelle peinture</button>
      <div style={{ marginTop: 10 }}>
        {entree(saisie1, setSaisie1, "Méthode M1 : régénération à 40 s après le début de l’intervalle 3, en % de ηref", "%, 2 chiffres significatifs", "M1 = η(40 s) / ηref × 100. Lis η dans le tableau pour t = 40 s. Une réponse à 5 % près est acceptée.", justes.m1, `${fmt(f.m1, 0)}${NB}%`)}
        {entree(saisie2, setSaisie2, "Méthode M2 : temps pour atteindre 50 % de ηref, en secondes depuis le début de l’intervalle 3", "s, 2 chiffres significatifs", "Calcule 50 % de ηref, repère dans le tableau les deux instants qui l’encadrent, puis interpole linéairement. Une réponse à 15 % près est acceptée.", justes.t50, `${fmt(f.t50, 0)}${NB}s`)}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Que prévoir à l’application ? (repères : t50 ≤ {SEUIL_RAPIDE}{NB}s trop rapide ; entre {SEUIL_RAPIDE} et {SEUIL_LENT}{NB}s équilibrée ; au-delà de {SEUIL_LENT}{NB}s trop lente)</div>
          {verdicts.options.map((o, i) => (
            <button key={o} type="button" style={{ ...stylePetitBouton(qV === i, verifie && i === verdicts.bonne ? "#15803d" : "#64748b"), display: "block", width: "100%", textAlign: "left", marginBottom: 4, minHeight: 36 }}
              onClick={() => { setQV(i); setVerifie(false); }}>
              {verifie && i === verdicts.bonne ? "✓ " : qV === i && verifie ? "✗ " : ""}{NOMS_VERDICT[o]}
            </button>
          ))}
          {verifie && <div style={{ fontSize: 13.5, color: justes.verdict ? "#15803d" : "#b91c1c" }}>{justes.verdict ? "Bien vu !" : "La bonne réponse est signalée en vert."}</div>}
          <IndiceDefi cache={verifie && justes.verdict}>Compare le temps t50 que tu as trouvé aux repères : trop court, la structure se reconstruit avant que la peinture ait pu s’étaler ; trop long, la peinture coule avant de se figer.</IndiceDefi>
        </div>
      </div>
      <button type="button" style={styleBouton(true, "#16a34a")} onClick={() => { setVerifie(true); onValide(tous); }}>✓ Vérifier</button>
      <div style={{ marginTop: 8, fontSize: 14, color: KIT.txt }}>
        {verifie ? (tous ? "🎉 Trois réponses exactes : tu sais lire un test 3ITT." : `Score : ${Object.values(justes).filter(Boolean).length} / 3. Relance une nouvelle peinture pour retenter.`)
          : "Réponds aux trois questions, puis vérifie."}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export function SimulationITT3() {
  const [mode, setMode] = useState(() => modeOuverture("itt3-v1"));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant("itt3-v1", { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [tc, setTc] = useState(() => TEMPS.findIndex((q) => q >= 10));
  const [yLog, setYLog] = useState(false);
  const [ouvHyp, setOuvHyp] = useState(false);
  const [etroit, setEtroit] = useState(() => typeof window !== "undefined" && window.innerWidth < 720);
  useEffect(() => {
    const maj = () => setEtroit(window.innerWidth < 720);
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);

  const A = DONNEES_3ITT.A, B = DONNEES_3ITT.B;
  const refA = etaRef(A), refB = etaRef(B);
  const m1A = 100 * (13810 / 16210);
  const penteA = (11750 - 3730) / (66.7 - 47.6);
  const penteB = (17790 - 3810) / (66.7 - 47.6);

  const etapes = [
    {
      titre: "Un test en trois intervalles",
      texte: <>
        Au cours de sa vie, une peinture subit des cisaillements très différents : au repos dans le pot, étalée au pinceau ou au rouleau, puis de nouveau au repos sur le mur. Le test <strong>3ITT</strong> (<em>three interval thixotropy</em>) imite cela avec trois intervalles de gradient de vitesse γ̇ : 1{NB}s⁻¹ pendant 20{NB}s, puis 256{NB}s⁻¹ pendant 20{NB}s, puis 1{NB}s⁻¹ pendant 80{NB}s.
      </>,
      tache: {
        type: "qcm", q: "À quelle étape de la vie de la peinture correspond l’intervalle 2, à γ̇ = 256 s⁻¹ ?",
        options: ["Le pinceau ou le rouleau qui étale la peinture", "Le stockage du pot, au repos pendant des mois", "Le séchage de la couche sur le mur, au repos", "Le mélange du pot avec un bâton avant ouverture"], bonne: 0,
        indice: "Un fort gradient de vitesse correspond à un fort cisaillement : quel geste cisaille fortement la peinture ?",
        expl: <>Au pinceau, au rouleau ou au pistolet, la peinture est <strong>fortement cisaillée</strong> : c’est l’intervalle 2. Les intervalles 1 et 3 imitent le repos, avant et après l’application.</>,
      },
    },
    {
      titre: "La viscosité de la peinture A",
      texte: "Voici de vraies mesures de la peinture A (un point par mesure). Déplace le curseur de temps et regarde la viscosité η dans chacun des trois intervalles. Utilise l’échelle logarithmique si tu veux voir tout le test.",
      tache: {
        type: "qcm", q: "Que devient la viscosité de la peinture A quand γ̇ passe de 1 à 256 s⁻¹ (début de l’intervalle 2) ?",
        options: ["Elle chute d’un facteur de l’ordre de 15", "Elle reste à peu près constante", "Elle augmente, car la peinture est plus agitée", "Elle double environ"], bonne: 0,
        indice: "Lis η à la fin de l’intervalle 1 (t = 19 s) puis au début de l’intervalle 2 (t = 21 s), et fais le rapport.",
        expl: <>La viscosité passe d’environ 16 000 à environ 1 000 mPa·s : elle est <strong>divisée par 15 à 17</strong>. La peinture est rhéofluidifiante, et sa structure est détruite par le fort cisaillement.</>,
      },
    },
    {
      titre: "La régénération",
      texte: <>Regarde l’intervalle 3 : le gradient revient à 1{NB}s⁻¹, comme dans l’intervalle 1. Au début de l’intervalle 3 (t ≈ 44{NB}s), la viscosité n’est que d’environ 2{NB}650{NB}mPa·s, contre 16{NB}210{NB}mPa·s à la fin de l’intervalle 1 ; puis elle remonte.</>,
      tache: {
        type: "qcm", q: "Pourquoi la viscosité est-elle d’abord si faible à γ̇ = 1 s⁻¹ dans l’intervalle 3 ?",
        options: ["La structure n’est pas encore reconstruite", "La température a beaucoup augmenté pendant l’intervalle 2", "L’appareil de mesure est déréglé par le fort gradient", "La peinture a séché et sa viscosité a diminué"], bonne: 0,
        indice: "Le gradient est le même que dans l’intervalle 1. Qu’est-ce qui a changé dans la peinture pendant l’intervalle 2 ? (La température reste voisine de 22,8 °C.)",
        expl: <>Le fort cisaillement a <strong>détruit la structure</strong> de la peinture ; elle ne se reconstruit pas instantanément. La viscosité remonte donc <strong>progressivement</strong> : c’est la <strong>thixotropie</strong>. Cette régénération est ce que le test 3ITT permet de mesurer.</>,
      },
    },
    {
      titre: "La viscosité de référence",
      retenirTitre: "Le test 3ITT",
      retenir: <>
        <FTroisIntervalles />
        {puces(<>Intervalle 1 : <strong>repos</strong> à γ̇ faible. Intervalle 2 : <strong>fort gradient</strong>, la structure est détruite. Intervalle 3 : retour au <strong>repos</strong>, la structure se reconstruit plus ou moins vite.</>, <>Un fluide <strong>thixotrope</strong> : sa viscosité baisse sous cisaillement et ne remonte que <strong>lentement</strong> au repos.</>)}
      </>,
      texte: "Pour mesurer la régénération, on la compare à la viscosité de référence ηref : celle de la fin de l’intervalle 1, quand la peinture est au repos. Place le curseur de temps sur le dernier point de l’intervalle 1 (t = 19 s) et lis la viscosité de la peinture A.",
      tache: {
        type: "num", q: "Viscosité de référence ηref de la peinture A", unite: "mPa·s", vrai: refA, tol: 0.03, affiche: (v) => milliers(v), cs: 3,
        calcul: () => ["ηref est la viscosité mesurée au dernier point de l’intervalle 1 (t = 19 s).", `ηref = ${milliers(refA)} mPa·s.`],
        pieges: [[refA / 1000, "C’est la bonne valeur, mais en Pa·s. Exprimez-la en mPa·s : 1 Pa·s = 1 000 mPa·s."]],
        expl: <>ηref = {milliers(refA)}{NB}mPa·s. On la prend en <strong>fin d’intervalle 1</strong> parce que la peinture est alors au repos, sa structure intacte : c’est l’état auquel elle doit revenir.</>,
        indice: "Mets le curseur de temps sur t = 19 s (dernier point de l’intervalle 1) et lis la viscosité de la peinture A dans les mesures.",
      },
    },
    {
      titre: "M1 : le pourcentage de régénération",
      texte: <>On exprime la régénération en pourcentage de ηref, à un instant choisi. Pour la peinture A : ηref = {milliers(refA)}{NB}mPa·s ; 80{NB}s après le début de l’intervalle 3 (t = 120{NB}s), la viscosité mesurée est η = 13{NB}810{NB}mPa·s.</>,
      tache: {
        type: "num", q: "Régénération de la peinture A à t = 120 s (méthode M1)", unite: "%", vrai: m1A, tol: 0.03, affiche: (v) => fmt(v, 0), cs: 2,
        calcul: () => [`Régénération = η ÷ ηref × 100 = 13 810 ÷ 16 210 × 100 ≈ ${fmt(m1A, 1)} %.`],
        pieges: [[(16210 / 13810) * 100, "Vous avez inversé le rapport : il faut η mesurée divisée par ηref."], [100 - m1A, "C’est la part de viscosité qui manque. La régénération est la part retrouvée : η ÷ ηref."], [m1A / 100, "Vous avez donné la fraction ; multipliez par 100 pour l’exprimer en %."]],
        expl: <>La peinture A a retrouvé environ <strong>{fmt(m1A, 0)}{NB}%</strong> de sa viscosité de référence au bout de 80{NB}s : la régénération est presque, mais pas tout à fait, complète.</>,
        indice: "Régénération (%) = η ÷ ηref × 100, avec η = 13 810 mPa·s et ηref = 16 210 mPa·s (même unité).",
      },
    },
    {
      titre: "M2 : le temps de régénération",
      texte: <>On cherche maintenant <strong>quand</strong> la viscosité atteint 25 % de ηref. Pour la peinture A : 25 % de {milliers(refA)}{NB}mPa·s = 4{NB}052{NB}mPa·s (ligne en tirets). Avance le curseur de temps dans l’intervalle 3 et repère les deux points qui encadrent cette valeur, puis interpole. Le temps se compte <strong>depuis le début de l’intervalle 3</strong>, soit t = 40{NB}s.</>,
      tache: {
        type: "num", q: "Temps pour atteindre 25 % de ηref (peinture A), compté depuis le début de l’intervalle 3", unite: "s", vrai: 8, tol: 0.2, affiche: (v) => fmt(v, 0), cs: 1,
        calcul: () => ["La viscosité atteint 4 052 mPa·s entre t = 43,8 s (2 650 mPa·s) et t = 47,6 s (3 730 mPa·s) puis t = 51,4 s (6 750 mPa·s) : vers t ≈ 48 s.", "Temps compté depuis le début de l’intervalle 3 : 48 − 40 ≈ 8 s."],
        pieges: [[48, "Vous avez lu l’instant sur l’axe (t ≈ 48 s). Il faut compter depuis le début de l’intervalle 3 : retranchez 40 s."]],
        expl: <>25 % de ηref sont atteints vers t ≈ 48{NB}s, donc environ <strong>8{NB}s</strong> après le début de l’intervalle 3. On note t<sub>25</sub> ≈ 8{NB}s.</>,
        indice: "Cherche l’instant où η = 4 052 mPa·s (ligne en tirets), lis-le sur l’axe des temps, puis retire 40 s (début de l’intervalle 3).",
      },
    },
    {
      titre: "M3 : la pente de remontée",
      texte: <>La troisième méthode mesure la <strong>vitesse</strong> de régénération : la pente de η(t). Pour la peinture A, η passe de 3{NB}730{NB}mPa·s à t = 47,6{NB}s à 11{NB}750{NB}mPa·s à t = 66,7{NB}s.</>,
      tache: {
        type: "num", q: "Pente moyenne de η(t) pour la peinture A entre ces deux instants (méthode M3)", unite: "mPa·s/s", vrai: penteA, tol: 0.05, affiche: (v) => fmt(v, 0), cs: 2,
        calcul: () => ["Δη = 11 750 − 3 730 = 8 020 mPa·s ; Δt = 66,7 − 47,6 = 19,1 s.", `Pente = Δη ÷ Δt = 8 020 ÷ 19,1 ≈ ${fmt(penteA, 0)} mPa·s/s.`],
        pieges: [[8020, "Vous avez calculé Δη, sans le diviser par la durée Δt."], [1 / penteA, "Vous avez inversé le rapport : la pente est Δη divisé par Δt."]],
        expl: <>La viscosité de la peinture A remonte d’environ <strong>{fmt(penteA, 0)}{NB}mPa·s par seconde</strong> sur cette fenêtre. Plus la pente est grande, plus la peinture se reconstruit vite.</>,
        indice: "Pente = (η finale − η initiale) ÷ (t final − t initial) = Δη ÷ Δt, avec η en mPa·s et t en s.",
      },
    },
    {
      titre: "Comparer avec la peinture B",
      retenirTitre: "Mesurer la régénération",
      retenir: <>
        <FMethodes />
        <Formule><mi>R</mi><mo>=</mo><mfrac><mrow><mi>η</mi><mo>(</mo><mi>t</mi><mo>)</mo></mrow><msub><mi>η</mi><mi>ref</mi></msub></mfrac><mo>×</mo><mn>100</mn><mspace width="1.2em" /><mi>pente</mi><mo>=</mo><mfrac><mrow><mi>Δ</mi><mi>η</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></Formule>
        {puces(<>ηref : viscosité à la <strong>fin de l’intervalle 1</strong>. Les temps se comptent depuis le <strong>début de l’intervalle 3</strong>.</>, <>M1, M2 et M3 décrivent la même régénération sous trois angles : où en est-elle, quand atteint-elle un niveau, à quelle vitesse monte-t-elle.</>)}
      </>,
      texte: <>Les mesures de la peinture B s’ajoutent. Mêmes calculs : ηref(B) = {milliers(refB)}{NB}mPa·s ; M1 à 80{NB}s : 91{NB}% (contre 85{NB}% pour A) ; t<sub>25</sub> ≈ 9{NB}s et t<sub>50</sub> ≈ 14{NB}s (A : 8{NB}s et 13,5{NB}s) ; pente entre 47,6 et 66,7{NB}s : {fmt(penteB, 0)}{NB}mPa·s/s (A : {fmt(penteA, 0)}{NB}mPa·s/s).</>,
      tache: {
        type: "qcm", q: "Les pourcentages et les temps de régénération de A et B sont proches. Qu’est-ce qui les distingue le plus ?",
        options: ["B est plus visqueuse au repos et remonte plus vite (pente plus forte)", "A se régénère nettement plus vite que B, d’après les temps t25 et t50 mesurés", "B ne se régénère presque pas : 91 % reste très insuffisant", "Rien : les deux peintures ont exactement le même comportement"], bonne: 0,
        indice: "Compare ηref et les pentes M3 des deux peintures, pas seulement les pourcentages.",
        expl: <>Les % (85 et 91 %) et les temps (8 et 9 s, 13,5 et 14 s) sont voisins. Mais B est <strong>plus visqueuse au repos</strong> (24 600 contre 16 200 mPa·s) et sa viscosité <strong>remonte plus vite</strong> en valeur absolue (pente environ {fmt(penteB, 0)} contre {fmt(penteA, 0)}{NB}mPa·s/s).</>,
      },
    },
    {
      titre: "Nivellement ou affaissement ?",
      texte: "Après l’application, la peinture doit se régénérer assez lentement pour que les traces de pinceau s’effacent, mais assez vite pour ne pas couler sur le mur. Le temps de régénération doit donc être un compromis.",
      tache: {
        type: "qcm", q: "Une peinture retrouve presque instantanément sa structure après l’application. Quel défaut risque-t-on ?",
        options: ["Un mauvais nivellement : les traces de pinceau restent", "Un affaissement : la peinture coule sur le mur", "Une sédimentation des pigments dans le pot", "Un séchage beaucoup trop lent de la couche"], bonne: 0,
        indice: "Si la structure se reforme tout de suite, la peinture se fige avant d’avoir pu s’étaler : que reste-t-il de la trace du pinceau ?",
        expl: <>Une régénération <strong>trop rapide</strong> fige la peinture avant qu’elle ait pu s’étaler : les traces de pinceau (« cordage ») restent. Une régénération <strong>trop lente</strong> laisse la peinture couler : c’est l’affaissement.</>,
      },
    },
    {
      titre: "Conclure sur A et B",
      retenirTitre: "Nivellement ou affaissement",
      retenir: <>
        <FCompromis />
        {puces(<>Régénération <strong>trop rapide</strong> : nivellement insuffisant, traces de pinceau.</>, <>Régénération <strong>trop lente</strong> : la peinture s’affaisse, l’épaisseur de couche est insuffisante.</>, <>Il faut un <strong>compromis</strong> : le test 3ITT permet de comparer des peintures.</>)}
      </>,
      texte: "Tu as maintenant les résultats des deux peintures : A se régénère un peu plus lentement que B (pente M3 plus faible) et est moins visqueuse au repos ; B se régénère plus vite en valeur absolue, sans être trop rapide.",
      tache: {
        type: "qcm", q: "Que peut-on conclure sur le comportement des deux peintures à l’application ?",
        options: ["A nivelle mieux, mais s’affaisse davantage que B", "B nivelle mieux que A et s’affaisse davantage", "A et B nivellent exactement de la même façon", "A est trop rapide et B est trop lente"], bonne: 0,
        indice: "Une régénération plus lente laisse plus de temps pour s’étaler (nivellement) mais augmente le risque de coulure (affaissement).",
        expl: <>La peinture <strong>A</strong>, qui se reconstruit plus lentement, a sans doute <strong>un meilleur nivellement</strong> mais <strong>une plus grande tendance à l’affaissement</strong>. La <strong>B</strong> se restructure plus vite, sans être trop rapide. C’est une évaluation qualitative : seule l’application réelle tranche.</>,
      },
    },
    {
      titre: "Le bilan",
      texte: <>
        Tu sais lire un test 3ITT. Retiens la démarche :
        {puces(
          <>Trois intervalles : repos (ηref), fort gradient (structure détruite), repos (régénération).</>,
          <>Régénération : <strong>M1</strong> (% de ηref à un instant), <strong>M2</strong> (temps pour 25 % ou 50 %), <strong>M3</strong> (pente de η(t)).</>,
          <>Un compromis : trop rapide, mauvais nivellement ; trop lente, affaissement.</>,
          <>Industrie : surtout un rhéomètre rotatif ; on ne compare que des essais faits avec la même méthode (mêmes γ̇ et mêmes durées).</>,
        )}
        Passe à l’exploration pour tester un modèle sur les mesures, ou au défi pour analyser une peinture mystère.
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
    if (e === 0) return <GraphesITT cles={[]} avecEta={false} tc={tc} yLog={false} />;
    const cles = e >= 7 ? ["A", "B"] : ["A"];
    return (
      <div>
        <GraphesITT cles={cles} avecEta tc={tc} yLog={yLog} ligne25={e === 5 ? 0.25 * refA : null} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <button type="button" style={stylePetitBouton(yLog, "#334155")} aria-pressed={yLog} onClick={() => setYLog(!yLog)}>η en échelle logarithmique</button>
        </div>
        <CurseurTemps tc={tc} setTc={setTc} cles={cles} />
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Thixotropie : le test 3ITT</h2>
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
