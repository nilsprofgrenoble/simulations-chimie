// Vue — simulation « Lasure alkyde : séchage oxydant et peau en pot » (BTS MDC, formulation).
// Modèle pur : lasureModele.js ; tests : lasureModele.test.mjs ; dessins : LasureScene.jsx.
// Une seule échelle de temps logarithmique (1 min → 3 mois) pilote la coupe du film et la coupe du pot.
// Parcours guidé progressif : à chaque étape, seuls les éléments utiles sont à l'écran.

import { useEffect, useMemo, useRef, useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, Curseur, LigneMesure, ARetenir, fmt, IndiceDefi } from "../commun";
import { SceneFilm, LegendeFilm, ScenePot, GrapheLog, CarteCompromis, T_MIN, T_MAX, tDepuisU, uDepuisT, REPERES, formatTemps } from "./LasureScene";
import {
  PARAMS, trajectoireFilm, etatFilmA, simulerPot, etatPotA, jourPeauRapide,
  evaluerFormule, respecteCahier, PLAGE_SICCATIF, CAHIERS_DEFI,
} from "./lasureModele";

const SIM_ID = 101;
const CLE = "lasure-v1";
declarerDefis(SIM_ID, [["principal", "Cahier des charges d’une lasure"]]);

// Les quatre formules du TP (siccatif %, anti-peau %)
const FORMULES_TP = [
  { nom: "F-/-", si: 1, ap: 0, p12: 27, p14: 117 },
  { nom: "F-/+", si: 1, ap: 0.3, p12: 16, p14: 113 },
  { nom: "F+/-", si: 2, ap: 0, p12: 42, p14: 137 },
  { nom: "F+/+", si: 2, ap: 0.3, p12: 33, p14: 135 },
];

const jourTexte = (j) => (j === Infinity ? "plus de 3 mois" : `${Math.round(j)} j`);

// ---------------------------------------------------------------------------
// Banc : état partagé (temps log, composition) + lecture automatique.
// ---------------------------------------------------------------------------

function useBanc(init) {
  const [s, setS] = useState({ u: 0, joue: false, wft: 200, si: 2, ap: 0, ...init });
  const reduit = useMemo(() => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  }, []);
  const raf = useRef(0);
  useEffect(() => {
    if (!s.joue) return undefined;
    let dernier = performance.now();
    const pas = (now) => {
      const dt = now - dernier; dernier = now;
      setS((x) => {
        if (!x.joue) return x;
        const u = Math.min(1, x.u + dt / 20000);
        return u >= 1 ? { ...x, u: 1, joue: false } : { ...x, u };
      });
      raf.current = requestAnimationFrame(pas);
    };
    raf.current = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf.current);
  }, [s.joue]);
  const set = (p) => setS((x) => ({ ...x, ...p }));
  return {
    ...s, reduit, set,
    lecture: () => setS((x) => ({ ...x, joue: !x.joue, u: !x.joue && x.u >= 0.999 ? 0 : x.u })),
  };
}

// ---------------------------------------------------------------------------
// Commandes (temps + curseurs)
// ---------------------------------------------------------------------------

function CommandeTemps({ b, jours = false }) {
  const t = tDepuisU(b.u);
  return (
    <div style={{ ...styleBoite, padding: "10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {!b.reduit && (
          <button type="button" onClick={b.lecture} style={stylePetitBouton(b.joue, "#f5a31a")} aria-label={b.joue ? "Pause" : "Lecture"}>
            {b.joue ? "❚❚ Pause" : "▶ Lecture"}
          </button>
        )}
        <div style={{ fontWeight: 800, fontSize: 18, color: KIT.txt }}>Temps écoulé : {formatTemps(t)}</div>
      </div>
      <input type="range" min={0} max={1000} step={1} value={Math.round(b.u * 1000)} aria-label="Temps écoulé (échelle logarithmique)"
        onChange={(x) => b.set({ u: x.target.value / 1000, joue: false })} style={{ width: "100%", accentColor: "#f5a31a", marginTop: 6 }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: KIT.txt2 }}>
        <span>1 min</span><span>échelle logarithmique</span><span>3 mois</span>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
        {REPERES.map((r) => (
          <button key={r.lib} type="button" onClick={() => b.set({ u: uDepuisT(r.t), joue: false })} style={stylePetitBouton(false, "#334155")}>{r.lib}</button>
        ))}
      </div>
      {jours && null}
    </div>
  );
}

function Formulation({ b, show, siBornes = [0.5, 3], apBornes = [0, 1.2], siPas = 0.1, apPas = 0.05 }) {
  return (
    <div style={{ ...styleBoite, padding: "10px 14px" }}>
      {show.wft && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Épaisseur humide :</span>
          {[50, 200].map((w) => (
            <button key={w} type="button" aria-pressed={b.wft === w} onClick={() => b.set({ wft: w })} style={stylePetitBouton(b.wft === w, "#7c2d12")}>{w} µm</button>
          ))}
        </div>
      )}
      {show.si && (
        <Curseur nom="Siccatif (141 Z), % de la formule" valeur={b.si} onChange={(v) => b.set({ si: v })}
          min={siBornes[0]} max={siBornes[1]} pas={siPas} decimales={1} unite="%" couleur="#2563eb" />
      )}
      {show.ap && (
        <Curseur nom="Anti-peau (DEHA), % de la formule" valeur={b.ap} onChange={(v) => b.set({ ap: v })}
          min={apBornes[0]} max={apBornes[1]} pas={apPas} decimales={2} unite="%" couleur="#16a34a" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Banc complet : scène + mesures + (option) graphe
// ---------------------------------------------------------------------------

function BancLasure({ b, scene, show, siBornes, apBornes, siPas, apPas, defi = false, cible = null, graphe = false, noteHors = false }) {
  const t = tDepuisU(b.u);
  const traj = useMemo(() => trajectoireFilm({ si: b.si, ap: b.ap, wft: b.wft, tMax: T_MAX, n: 220 }), [b.si, b.ap, b.wft]);
  const etat = useMemo(() => etatFilmA(traj, t), [traj, t]);
  const trajPot = useMemo(() => (scene === "pot" ? simulerPot({ si: b.si, ap: b.ap, jours: 90, n: 140 }) : null), [scene, b.si, b.ap]);
  const etatPot = trajPot ? etatPotA(trajPot, t / 24) : null;
  const jPeau = useMemo(() => (scene === "pot" ? jourPeauRapide(b.si, b.ap, 90) : null), [scene, b.si, b.ap]);
  const grille = useMemo(() => {
    if (scene !== "compromis") return null;
    const pts = [];
    for (let si = 1.6; si <= 2.401; si += 0.2) for (let ap = 0; ap <= 1.001; ap += 0.1) pts.push(evaluerFormule(+si.toFixed(1), +ap.toFixed(2)));
    return pts;
  }, [scene]);
  const tp = useMemo(() => (scene === "compromis" ? FORMULES_TP.map((f) => ({ nom: f.nom, ...evaluerFormule(f.si, f.ap) })) : null), [scene]);
  const courant = useMemo(() => (scene === "compromis" ? evaluerFormule(b.si, b.ap) : null), [scene, b.si, b.ap]);
  const rapport = b.si > 0 ? b.ap / b.si : 0;
  const hors = noteHors && (b.si < 1 || b.si > 2 || b.ap > 0.3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {scene === "film" && (
        <>
          <SceneFilm etat={etat} si={b.si} ap={b.ap} wft={b.wft} couches={show.couches || {}} />
          <LegendeFilm couches={show.couches || {}} />
        </>
      )}
      {scene === "pot" && etatPot && <ScenePot etatPot={etatPot} ap={b.ap} jours={t / 24} />}
      {scene === "compromis" && grille && (
        <CarteCompromis points={grille} formulesTP={tp} courant={courant} cible={cible} />
      )}

      {scene !== "compromis" && <CommandeTemps b={b} />}
      {(show.wft || show.si || show.ap) && <Formulation b={b} show={show} siBornes={siBornes} apBornes={apBornes} siPas={siPas} apPas={apPas} />}
      {hors && (
        <div style={{ fontSize: 13, color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "5px 9px" }}>
          Hors du domaine du TP (1 à 2 % de siccatif, 0 à 0,3 % d’anti-peau) : le modèle extrapole, à discuter.
        </div>
      )}

      {scene === "film" && (
        <div style={{ ...styleBoite, padding: "8px 14px" }}>
          <LigneMesure nom="White spirit restant" valeur={`${fmt(etat.solvant * 100, 0)} %`} />
          <LigneMesure nom="Épaisseur du film" valeur={`${fmt(etat.epaisseur, 0)} µm`} />
          {show.reticulation && <LigneMesure nom="Réticulation (X)" valeur={`${fmt(etat.X * 100, 0)} %`} couleur="#ea580c" />}
          {show.persoz && (b.wft === 200
            ? <LigneMesure nom="Dureté Persoz" valeur={`${fmt(etat.durete, 0)} s`} couleur="#7c2d12" />
            : <div style={{ fontSize: 12.5, color: KIT.txt2, paddingTop: 4 }}>La dureté Persoz n’est calibrée que pour le film de 200 µm.</div>)}
          {show.antipeauLecture && <LigneMesure nom="Anti-peau restant" valeur={`${fmt(etat.antiPeau, 2)} %`} couleur="#16a34a" />}
          {show.phi && <LigneMesure nom="Siccatif actif (φ)" valeur={`${fmt(etat.phi * 100, 0)} %`} couleur="#2563eb" />}
          {show.rapport && <LigneMesure nom="R = %AP / %Si" valeur={fmt(rapport, 2)} />}
        </div>
      )}
      {scene === "pot" && etatPot && (
        <div style={{ ...styleBoite, padding: "8px 14px" }}>
          <LigneMesure nom="Anti-peau en surface (rel. au départ)" valeur={b.ap > 0 ? `${fmt((etatPot.cSurface / b.ap) * 100, 0)} %` : "0 (aucun)"} couleur="#16a34a" />
          <LigneMesure nom="Réticulation en surface (X)" valeur={`${fmt(etatPot.xSurface * 100, 0)} %`} couleur="#ea580c" />
          <LigneMesure nom="Peau" valeur={etatPot.peauMm >= 0.1 ? `${fmt(etatPot.peauMm, 1)} mm` : "pas de peau"} couleur="#7c2d12" />
          {show.rapport && <LigneMesure nom="R = %AP / %Si" valeur={fmt(rapport, 2)} />}
          {show.peauPrevue && <LigneMesure nom="Peau prévue après" valeur={jourTexte(jPeau)} />}
        </div>
      )}
      {scene === "compromis" && courant && (
        <div style={{ ...styleBoite, padding: "8px 14px" }}>
          <LigneMesure nom="Dureté Persoz à 12 h" valeur={`${courant.p} s`} couleur="#7c2d12" />
          <LigneMesure nom="Peau en pot après" valeur={jourTexte(courant.j)} />
        </div>
      )}

      {graphe && scene === "film" && b.wft === 200 && (
        <GrapheLog titre="Dureté Persoz en fonction du temps" yLabel="dureté Persoz (s)" yMax={150}
          series={[{ pts: traj.filter((e) => e.t >= T_MIN).map((e) => [e.t, e.durete]), couleur: "#7c2d12", nom: "modèle" }]}
          tCurseur={t}
          reperes={FORMULES_TP.flatMap((f) => [
            { t: 12, v: f.p12, couleur: "#7c3aed" },
            { t: 336, v: f.p14, couleur: "#7c3aed" },
          ])} />
      )}
      {graphe && scene === "film" && b.wft === 200 && <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Ronds violets : mesures du TP (F-/-, F-/+, F+/-, F+/+) à 12 h et à 14 j.</div>}
      {graphe && scene === "pot" && trajPot && (
        <GrapheLog titre="Anti-peau et réticulation en surface du pot" yLabel="fraction (0 à 1)" yMax={1}
          series={[
            { pts: trajPot.filter((e) => e.jour * 24 >= T_MIN).map((e) => [e.jour * 24, b.ap > 0 ? e.cSurface / b.ap : 0]), couleur: "#16a34a", nom: "anti-peau en surface" },
            { pts: trajPot.filter((e) => e.jour * 24 >= T_MIN).map((e) => [e.jour * 24, e.xSurface]), couleur: "#ea580c", nom: "réticulation X" },
          ]}
          seuil={{ valeur: PARAMS.xPeau, lib: "seuil de peau (X = 0,3)", couleur: "#b91c1c" }}
          tCurseur={t} />
      )}
      {defi && null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Textes
// ---------------------------------------------------------------------------

const RETENIR = (
  <>
    <div>Une lasure alkyde sèche en <strong>deux temps</strong> : le white spirit s’évapore (séchage physique, quelques heures), puis la résine <strong>réticule par oxydation</strong> pendant des jours.</div>
    <div>Le dioxygène attaque les C=C des acides gras ; le <strong>siccatif</strong> (Co/Zr/Ca) catalyse cette réaction radicalaire.</div>
    <div>L’<strong>anti-peau</strong> (DEHA, volatil) bride le siccatif dans le pot fermé, puis s’évapore du film mince : le siccatif devient actif.</div>
    <div>Compromis du formulateur : plus de siccatif sèche plus vite mais fait « peau » plus tôt ; plus d’anti-peau protège le pot mais ralentit le séchage.</div>
  </>
);

function Hypotheses() {
  const li = (t) => <li style={{ marginBottom: 4 }}>{t}</li>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.5 }}>
      {li("Modèle phénoménologique, calé sur les mesures du TP (4 formules, dureté Persoz à 12 h et 14 j) : c’est un calage, pas une validation.")}
      {li("White spirit : évaporation exponentielle (constante de temps 2 h pour 200 µm, proportionnelle à l’épaisseur humide). Valeur choisie pour la lisibilité du séchage physique.")}
      {li("Réticulation : loi autocatalytique dX/dt = k·[Si]·φ·(ε + X)·(1 − X)³, proportionnelle à la disponibilité en dioxygène (film mince : O₂ non limitant).")}
      {li("Anti-peau : le siccatif actif est réduit d’un facteur φ = 1/(1 + R/r½), avec R = %AP/%Si. Le départ du DEHA est modélisé par une exponentielle (3 h pour 200 µm). Cette durée et r½ ne sont pas identifiables séparément avec 4 formules.")}
      {li("Dureté Persoz : linéaire en X entre la dureté « physique » (7 s) et 143 s. Calée sur le film de 200 µm uniquement.")}
      {li("Température : 20 °C seulement. Aucun effet de l’humidité ni du support.")}
      {li("Pot : diffusion de Fick 1D du DEHA (D ≈ 10⁻¹¹ m²/s, ordre de grandeur Stokes-Einstein), perte à la surface vers l’air du pot ; dioxygène disponible sur les 0,3 mm du haut seulement.")}
      {li("Critère de peau : couche continue de réticulation X ≥ 0,3 en surface. Paramètres de surface calés sur 4 observations du TP : au-delà de 3 mois, rien n’est affirmé.")}
      {li("Le TP utilise 1 % de siccatif, sous la plage conseillée par le fournisseur (1,6 à 2,4 % de la formule d’après les 4 à 6 g de 141 Z pour 100 g de résine sèche).")}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Défi
// ---------------------------------------------------------------------------

function VoletDefi({ onValide }) {
  const [cdc, setCdc] = useState(() => CAHIERS_DEFI[Math.floor(Math.random() * CAHIERS_DEFI.length)]);
  const b = useBanc({ si: 2, ap: 0.3 });
  const [bilan, setBilan] = useState(null);
  const nouveau = () => {
    const autres = CAHIERS_DEFI.filter((c) => c !== cdc);
    setCdc(autres[Math.floor(Math.random() * autres.length)]);
    setBilan(null);
  };
  const verifier = () => {
    const ev = evaluerFormule(b.si, b.ap);
    const jours = ev.j === Infinity ? Infinity : Math.round(ev.j);
    const ok = respecteCahier(b.si, b.ap, cdc);
    setBilan({ ok, durete: ev.p >= cdc.p, peau: jours >= cdc.j, ev, si: b.si, ap: b.ap });
    onValide(ok);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...styleBoite, background: "white", border: "2px solid #0ea5e9" }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Cahier des charges de la lasure</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          <li>dureté Persoz à 12 h d’au moins <strong>{cdc.p} s</strong> (film de 200 µm) ;</li>
          <li>pas de peau en pot avant <strong>{cdc.j} jours</strong> ;</li>
          <li>siccatif entre <strong>{PLAGE_SICCATIF[0]} et {PLAGE_SICCATIF[1]} %</strong> de la formule (plage du fournisseur).</li>
        </ul>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Place la formule dans la zone verte de la carte, puis vérifie.</div>
      </div>
      <CarteCompromis points={useMemo(() => {
        const pts = [];
        for (let si = 1.6; si <= 2.401; si += 0.2) for (let ap = 0; ap <= 1.001; ap += 0.1) pts.push(evaluerFormule(+si.toFixed(1), +ap.toFixed(2)));
        return pts;
      }, [])} formulesTP={[]} courant={evaluerFormule(b.si, b.ap)} cible={cdc} />
      <Formulation b={b} show={{ si: true, ap: true }} siBornes={PLAGE_SICCATIF} apBornes={[0, 1]} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={verifier} style={styleBouton(true, "#16a34a")}>✓ Vérifier ma formule</button>
        <button type="button" onClick={nouveau} style={styleBouton(false)}>Nouveau cahier des charges</button>
      </div>
      <IndiceDefi cache={!!(bilan && bilan.ok)}>
        Le siccatif accélère la dureté mais fait aussi « peau » plus tôt ; l’anti-peau fait l’inverse. Regarde comment le point se déplace sur la carte quand tu bouges chaque curseur.
      </IndiceDefi>
      {bilan && (
        <div style={{ ...styleBoite, background: bilan.ok ? "#f0fdf4" : "#fef2f2", borderColor: bilan.ok ? "#86efac" : "#fca5a5" }}>
          <div style={{ fontWeight: 800, color: bilan.ok ? "#15803d" : "#b91c1c" }}>
            {bilan.ok ? "Cahier des charges respecté." : "Cahier des charges non respecté."}
          </div>
          <div style={{ fontSize: 14, color: KIT.txt, marginTop: 4 }}>
            Pour {fmt(bilan.si, 1)} % de siccatif et {fmt(bilan.ap, 2)} % d’anti-peau : dureté Persoz à 12 h = <strong>{bilan.ev.p} s</strong> ({bilan.durete ? "ok" : `il en faut ${cdc.p}`}),
            peau après <strong>{jourTexte(bilan.ev.j)}</strong> ({bilan.peau ? "ok" : `il en faut ${cdc.j}`}).
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function SimulationLasure() {
  const [mode, setMode] = useState(() => modeOuverture(CLE));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const bg = useBanc({});
  const bx = useBanc({ si: 2, ap: 0.3, u: uDepuisT(12) });
  const [sceneX, setSceneX] = useState("film");
  const [ouvHyp, setOuvHyp] = useState(false);
  const [etroit, setEtroit] = useState(() => typeof window !== "undefined" && window.innerWidth < 720);
  useEffect(() => {
    const maj = () => setEtroit(window.innerWidth < 720);
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);

  const e = Math.min(guide.etape, 11);
  // Réglages de départ de chaque étape
  const setGuideBanc = bg.set;
  useEffect(() => {
    const t = (h) => uDepuisT(h);
    const defauts = {
      0: { wft: 200, si: 2, ap: 0, u: 0 },
      1: { wft: 200, si: 2, ap: 0, u: t(12) },
      2: { wft: 200, si: 2, ap: 0, u: t(1) },
      3: { wft: 200, si: 2, ap: 0, u: t(12) },
      4: { wft: 200, si: 1, ap: 0, u: t(12) },
      5: { wft: 200, si: 2, ap: 0, u: t(12) },
      6: { wft: 200, si: 2, ap: 0, u: t(24) },
      8: { wft: 200, si: 2, ap: 0, u: t(24) },
      9: { wft: 200, si: 2, ap: 0.3, u: t(12) },
      10: { wft: 200, si: 2, ap: 0.3, u: t(24) },
      11: { wft: 200, si: 2, ap: 0.3, u: t(12) },
    };
    if (defauts[e]) setGuideBanc({ ...defauts[e], joue: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e]);

  // Pot du banc guidé (pour juger les actions des étapes de pot)
  const potGuide = useMemo(() => ((e === 6 || e === 8) ? simulerPot({ si: bg.si, ap: bg.ap, jours: 90, n: 140 }) : null), [e, bg.si, bg.ap]);
  const etatPotGuide = potGuide ? etatPotA(potGuide, tDepuisU(bg.u) / 24) : null;
  const cdcGuide = { p: 30, j: 45 };
  const rapportTP = 0.3 / 2;

  const etapes = [
    {
      titre: "Un film humide qui s’évapore",
      texte: "Tu viens d’étaler la lasure : un film de 200 µm. Fais défiler le temps (de 1 minute à 3 mois, sur une échelle logarithmique) et regarde la coupe du film : le fond bleu est le solvant (white spirit), les traits noirs sont les chaînes de résine.",
      tache: {
        type: "qcm", q: "Pendant les premières heures, qu’est-ce qui fait diminuer l’épaisseur du film ?", bonne: 0,
        options: ["Le white spirit s’évapore (séchage physique)", "La résine alkyde s’évapore", "Le film réticule et se contracte", "Le siccatif se décompose"],
        expl: "Le solvant (white spirit) s’évapore : c’est le séchage physique. Il ne forme aucune liaison.",
        indice: "Regarde la ligne « White spirit restant » pendant la première heure.",
      },
    },
    {
      titre: "50 µm ou 200 µm ?",
      texte: "Compare deux épaisseurs humides : choisis 50 µm puis 200 µm et regarde le white spirit restant à 12 h.",
      tache: {
        type: "qcm", q: "Un film plus mince que 200 µm sèche physiquement…", bonne: 0,
        options: ["plus vite : le solvant a moins d’épaisseur à traverser", "moins vite : il y a moins de résine", "à la même vitesse", "plus vite, mais seulement la nuit"],
        expl: "Le temps d’évaporation augmente avec l’épaisseur humide (dans le modèle, il lui est proportionnel).",
        indice: "Compare le « White spirit restant » à 1 h pour 50 µm et 200 µm.",
      },
    },
    {
      titre: "Le film continue de durcir pendant des jours",
      texte: "Reviens à 200 µm. Une fois le solvant parti, la résine n’est pas encore dure : des liaisons entre les chaînes se forment. Regarde la dureté Persoz et la réticulation évoluer sur plusieurs jours.",
      tache: {
        type: "qcm", q: "Après évaporation complète du solvant (12 h), la dureté Persoz…", bonne: 0,
        options: ["continue d’augmenter pendant des jours", "reste constante", "diminue", "devient nulle"],
        expl: "La dureté croît jusqu’à plus de 100 s en deux semaines : c’est le séchage chimique (réticulation), très lent.",
        indice: "Place le curseur à 1 jour puis à 14 jours.",
      },
    },
    {
      titre: "Le dioxygène fait le travail",
      texte: "La résine alkyde porte des chaînes d’acides gras insaturés (liaisons C=C). Le dioxygène de l’air les attaque par une réaction radicalaire en chaîne, catalysée par le siccatif (sels de cobalt, zirconium, calcium) : les chaînes se relient par des ponts –O– (cercles rouges).",
      tache: {
        type: "qcm", q: "Quel est le mode de séchage chimique d’une lasure alkyde ?", bonne: 0,
        options: ["Oxydation des C=C des acides gras par O₂, catalysée par le siccatif", "Évaporation de l’eau puis coalescence des particules", "Réaction avec un durcisseur isocyanate", "Photopolymérisation sous UV"],
        expl: "C’est une autoxydation radicalaire : le dioxygène est un réactif, le siccatif un catalyseur.",
        indice: "Regarde les ponts –O– (cercles rouges) apparaître entre les chaînes.",
      },
    },
    {
      titre: "Plus de siccatif, plus vite",
      texte: "Le curseur de siccatif règle la quantité de catalyseur (141 Z). Le TP compare 1 % et 2 %. Mesure la dureté à 12 h pour 1 % puis pour 2 %.",
      tache: {
        type: "qcm", q: "Avec 2 % de siccatif au lieu de 1 %, la dureté à 12 h est…", bonne: 0,
        options: ["plus élevée : la réticulation est plus rapide", "plus faible", "identique", "plus élevée, mais seulement après 14 jours"],
        expl: "Plus de catalyseur accélère la réticulation. C’est ce que mesure le TP (27 s contre 42 s sans anti-peau).",
        indice: "Compare la ligne « Dureté Persoz » aux deux positions du curseur.",
      },
    },
    {
      titre: "L’anti-peau ralentit le séchage… volontairement",
      texte: "Dans le pot fermé, il faut empêcher la lasure de réticuler. On ajoute un anti-peau : ici la N,N-diéthylhydroxylamine (DEHA). Elle se lie au métal du siccatif et le désactive, tant qu’elle est présente. Mets 0,3 % et regarde la dureté à 12 h.",
      tache: {
        type: "qcm", q: "Pourquoi l’anti-peau doit-il être volatil ?", bonne: 0,
        options: ["Pour s’évaporer du film mince après l’application et libérer le siccatif", "Pour accélérer l’évaporation du white spirit", "Pour augmenter la dureté finale", "Pour réticuler avec la résine"],
        expl: "Dans le pot fermé il reste en solution et protège ; dans le film mince il s’évapore et le siccatif devient actif. Mais pendant ce temps le séchage est retardé.",
        indice: "Regarde les croissants verts autour des points bleus : que deviennent-ils avec le temps ?",
      },
    },
    {
      titre: "Dans le pot fermé, sans anti-peau",
      texte: "Même lasure (2 % de siccatif) dans un pot fermé : 30 mm de liquide et un peu d’air au-dessus. Fais défiler le temps jusqu’à voir apparaître la peau.",
      tache: {
        type: "action", ok: !!(etatPotGuide && etatPotGuide.peauMm >= 0.1),
        consigne: "Avance le temps jusqu’à ce qu’une peau se forme en surface.",
      },
    },
    {
      titre: "Pourquoi seulement en surface ?",
      texte: "Le pot est fermé, mais il contient un peu d’air. Regarde où se trouve la peau.",
      tache: {
        type: "qcm", q: "Pourquoi la peau se forme-t-elle en surface et non dans la masse ?", bonne: 0,
        options: ["Seule la surface est au contact du dioxygène de l’air du pot", "Le white spirit s’y évapore et durcit la résine", "Le siccatif sédimente vers le haut", "La surface est plus froide"],
        expl: "Sans dioxygène, pas de réticulation : la masse du liquide reste fluide.",
        indice: "Quel réactif faut-il pour que le siccatif agisse ?",
      },
    },
    {
      titre: "Ajouter de l’anti-peau",
      texte: "Le DEHA se trouve dans toute la masse, diffuse lentement vers la surface et s’y échappe dans l’air du pot. Tant qu’il reste assez de DEHA en surface, le siccatif est bridé. Règle l’anti-peau pour qu’il n’y ait pas de peau avant 30 jours.",
      tache: {
        type: "action", ok: !!(etatPotGuide && tDepuisU(bg.u) / 24 >= 30 && etatPotGuide.peauMm < 0.1),
        consigne: "Règle l’anti-peau, puis avance le temps jusqu’à 30 jours : il ne doit pas y avoir de peau.",
        indice: "Quelques dixièmes de pour cent suffisent.",
      },
    },
    {
      titre: "Un rapport qui compte",
      texte: "Ce qui compte pour le siccatif, c’est la quantité d’anti-peau par rapport à lui : R = %AP / %Si. Plus R est grand, plus le siccatif est bridé.",
      tache: {
        type: "num", q: "Calcule R pour la formule F+/+ du TP (siccatif 2 %, anti-peau 0,3 %).", unite: "", vrai: rapportTP, tol: 0.03,
        pieges: [[1 / rapportTP, "Vous avez inversé le rapport : c’est %AP divisé par %Si."], [0.6, "Vous avez multiplié au lieu de diviser."], [0.3, "Vous avez recopié l’anti-peau : il faut le diviser par le siccatif."]],
        expl: "R = 0,3 / 2 = 0,15.",
        calcul: ["R = %AP / %Si", "R = 0,3 / 2 = 0,15"],
      },
    },
    {
      titre: "Trop de siccatif : la peau",
      texte: "Mets 2 % de siccatif et 0,3 % d’anti-peau, puis 2,4 % de siccatif sans changer l’anti-peau, et regarde R et le délai de peau prévu.",
      tache: {
        type: "qcm", q: "On augmente le siccatif sans toucher à l’anti-peau. Dans le pot…", bonne: 0,
        options: ["la peau apparaît plus tôt : R diminue, le siccatif est moins bridé", "la peau apparaît plus tard", "rien ne change", "la peau devient plus épaisse mais apparaît au même moment"],
        expl: "Plus de catalyseur pour la même quantité d’anti-peau : R baisse, le siccatif échappe plus vite au DEHA.",
        indice: "Observe « Peau prévue après » quand tu passes de 2 % à 2,4 %.",
      },
    },
    {
      titre: "Le compromis du formulateur",
      texte: "Cette carte montre toutes les formules : à droite, elles sèchent vite ; en haut, le pot reste sans peau longtemps. Les points violets sont les formules du TP. Cahier des charges : dureté Persoz ≥ 30 s à 12 h, pas de peau avant 45 jours, siccatif entre 1,6 et 2,4 %.",
      tache: {
        type: "action", ok: respecteCahier(bg.si, bg.ap, cdcGuide),
        consigne: "Place le point dans la zone verte.",
        indice: "À siccatif donné, un peu plus d’anti-peau repousse la peau mais ralentit la dureté.",
      },
    },
  ];

  const dernier = etapes.length - 1;
  const finParcours = !!(guide.reussies && guide.reussies[dernier]);
  const fin = finParcours
    ? <button type="button" style={styleBouton(true, "#16a34a")} onClick={() => setMode("explore")}>Passer à l’exploration ▶</button>
    : null;

  // Panneau de gauche selon l’étape : on n’introduit un élément que lorsqu’une étape s’en sert.
  const panneauGuide = () => {
    if (e <= 5) {
      return (
        <BancLasure b={bg} scene="film"
          show={{
            wft: e === 1, si: e === 4, ap: e === 5,
            couches: { liaisons: e >= 2, o2: e >= 3, siccatif: e >= 3, antipeau: e >= 5 },
            reticulation: e >= 2, persoz: e >= 2, antipeauLecture: e === 5,
          }}
          apBornes={[0, 0.6]} siBornes={[0.5, 3]} />
      );
    }
    if (e <= 10) {
      return (
        <BancLasure b={bg} scene="pot"
          show={{ ap: e >= 8, si: e === 10, rapport: e >= 10, peauPrevue: e === 10 }}
          apBornes={[0, 1]} siBornes={[1.6, 2.4]} />
      );
    }
    return (
      <BancLasure b={bg} scene="compromis" show={{ si: true, ap: true }} siBornes={PLAGE_SICCATIF} apBornes={[0, 1]} cible={cdcGuide} />
    );
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Lasure alkyde : séchage oxydant et peau en pot</h2>
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
          {finParcours && <div style={{ marginTop: 10 }}><ARetenir titre="À RETENIR">{RETENIR}</ARetenir></div>}
        </>
      )}

      {mode === "explore" && (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {[["film", "Le film appliqué"], ["pot", "Le pot fermé"], ["compromis", "Le compromis"]].map(([k, lib]) => (
              <button key={k} type="button" aria-pressed={sceneX === k} style={stylePetitBouton(sceneX === k, "#334155")} onClick={() => setSceneX(k)}>{lib}</button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <BancLasure b={bx} scene={sceneX} graphe noteHors
              show={{
                wft: true, si: true, ap: true,
                couches: { liaisons: true, o2: true, siccatif: true, antipeau: true },
                reticulation: true, persoz: true, antipeauLecture: true, phi: true, rapport: true, peauPrevue: true,
              }}
              siBornes={[0.5, 3]} apBornes={[0, 1.2]} />
          </div>
          <div style={{ ...styleBoite, marginTop: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
              <li>Reproduis les quatre formules du TP (1 ou 2 % de siccatif, 0 ou 0,3 % d’anti-peau) et compare aux points violets.</li>
              <li>Dans le pot, cherche l’anti-peau qui repousse la peau au-delà de 3 mois pour 1,6 % de siccatif.</li>
              <li>Sur la carte, trouve toutes les formules qui sèchent à 30 s en 12 h sans peau avant 45 jours.</li>
            </ul>
          </div>
          <div style={{ marginTop: 10 }}><ARetenir titre="À RETENIR">{RETENIR}</ARetenir></div>
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

export default SimulationLasure;
