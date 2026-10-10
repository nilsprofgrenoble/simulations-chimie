import { useState, useEffect, useRef, useMemo } from "react";
import { TabBtn, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, styleBoite, Section, ORANGE_GUIDE, avecIndices, fmt, lireNombre, proche } from "../commun";

export function SchemaElectro({ mode, x, deltaEmV = 100, lentMsg = null, dyn = null }) {
  // Le modèle est maintenant continu : seuls l'instant exact de l'équivalence et l'absence de Fe³⁺ restent « mal définis »
  const undef = x <= 0.001 || Math.abs(x - 1) <= 0.001;
  const apresEq = x > 1.001;
  const fx = v => v.toFixed(Math.abs(v - 1) < 0.01 ? 4 : 2);

  const couleurSolution = x < 0.999 ? "#a8d8ff" : x < 1.001 ? "#e6f0ff" : "#fff0c0";

  // Potentiel d'équilibre exact (le même que celui du graphique i = f(E))
  const Eexact = () => { const q = concEquilibre(x); return q.E === null ? "—" : q.E.toFixed(3); };
  const nernstFer = Eexact, nernstCer = Eexact;

  const labelPotentiel = () => {
    if (undef) return { ligne1: "⚠ Potentiel E mal défini !", ligne2: "" };
    if (!apresEq) return {
      ligne1: "E°(Fe³⁺/Fe²⁺) + 0,06·log([Fe³⁺]/[Fe²⁺])",
      ligne2: `E = ${nernstFer()} V/ESH`
    };
    return {
      ligne1: "E°(Ce⁴⁺/Ce³⁺) + 0,06·log([Ce⁴⁺]/[Ce³⁺])",
      ligne2: `E = ${nernstCer()} V/ESH`
    };
  };

  const { ligne1, ligne2 } = labelPotentiel();

  return (
    <svg viewBox="0 0 320 400" style={{ width: "100%", minHeight: 380, display: "block" }}>

       
      {/* ── Mode potentiométrie i=0 : ET + ER + Voltmètre ── */}
      {mode === "pot0" && <>

        {/* Électrode de travail ET */}
        <rect x="108" y="100" width="10" height="115" rx="2" fill="#888"/>
        <text x="113" y="93" textAnchor="middle" fontSize="14" fill="#555" fontWeight="bold">ET</text>

        {/* Électrode de référence ER */}
        <rect x="200" y="100" width="10" height="115" rx="2" fill="#e9a824"/>
        <text x="205" y="93" textAnchor="middle" fontSize="14" fill="#b07800" fontWeight="bold">ER</text>

        {/* ── Bécher ── */}
        <rect x="60" y="155" width="200" height="120" fill={couleurSolution} opacity="0.65"/>
        <line x1="60"  y1="125" x2="60"  y2="275" stroke="#5599bb" strokeWidth="2"/>
        <line x1="260" y1="125" x2="260" y2="275" stroke="#5599bb" strokeWidth="2"/>
        <line x1="60"  y1="275" x2="260" y2="275" stroke="#5599bb" strokeWidth="2"/>

        {/* Contenu bécher */}
        <text x="160" y="205" textAnchor="middle" fontSize="15" fill="#334" fontWeight="bold">
          {x <= 0.001 ? "Fe²⁺" : x < 0.999 ? "Fe²⁺ + Fe³⁺" : x < 1.001 ? "Fe³⁺ + Ce³⁺" : "Fe³⁺ + Ce³⁺ + Ce⁴⁺"}
        </text>
        <text x="160" y="223" textAnchor="middle" fontSize="13" fill="#555">{`x = ${fx(x)}`}</text>

        {/* Potentiel de Nernst sous le bécher */}
        <text x="160" y="295" textAnchor="middle" fontSize="12"
          fill={undef || lentMsg ? "#c0392b" : "#1a7a3a"} fontWeight={undef || lentMsg ? "bold" : "normal"}>
          {lentMsg ? `⚠ ${lentMsg}` : undef ? "⚠ Potentiel E mal défini !" : "E ="}
        </text>
        {!undef && !lentMsg && (
          <text x="160" y="312" textAnchor="middle" fontSize="11" fill="#1a7a3a">
            {ligne1}
          </text>
        )}
        {ligne2 !== "" && !lentMsg && (
          <text x="160" y="330" textAnchor="middle" fontSize="14" fill="#1a7a3a" fontWeight="bold">
            {ligne2}
          </text>
        )}

        {/* Fil ET vers voltmètre */}
        <line x1="113" y1="100" x2="113" y2="65" stroke="#333" strokeWidth="2"/>
        <line x1="113" y1="65" x2="136" y2="65" stroke="#333" strokeWidth="2"/>

        {/* Fil ER vers voltmètre */}
        <line x1="205" y1="100" x2="205" y2="65" stroke="#b07800" strokeWidth="2"/>
        <line x1="205" y1="65" x2="184" y2="65" stroke="#b07800" strokeWidth="2"/>

        {/* Voltmètre */}
        <circle cx="160" cy="65" r="26" fill="white" stroke="#333" strokeWidth="2"/>
        <text x="160" y="71" textAnchor="middle" fontSize="20" fill="#333" fontWeight="bold">V</text>

        
      </>}

      {mode === "courant" && <>

        {/* ── Label générateur AU DESSUS ── */}
        <text x="160" y="16" textAnchor="middle" fontSize="13" fill="#a00" fontWeight="bold">Géné. i = 10 µA</text>

        {/* ── Générateur centré sur les fils ── */}
        <rect x="118" y="22" width="84" height="28" rx="6" fill="#ffe0e0" stroke="#c0392b" strokeWidth="1.5"/>
        <text x="136" y="40" textAnchor="middle" fontSize="13" fill="#c0392b" fontWeight="bold">+</text>
        <text x="184" y="40" textAnchor="middle" fontSize="13" fill="#1a6eb5" fontWeight="bold">−</text>

        {/* ── EI1 à gauche (anode +) ── */}
        <rect x="55" y="95" width="10" height="175" rx="2" fill="#c0392b"/>
        <text x="70" y="88" textAnchor="start" fontSize="14" fill="#c0392b" fontWeight="bold">EI1</text>
        <text x="70" y="75" textAnchor="start" fontSize="13" fill="#c0392b">+</text>

        {/* ── EI2 à droite (cathode -) ── */}
        <rect x="253" y="95" width="10" height="175" rx="2" fill="#1a6eb5"/>
        <text x="248" y="88" textAnchor="end" fontSize="14" fill="#1a6eb5" fontWeight="bold">EI2</text>
        <text x="248" y="75" textAnchor="end" fontSize="13" fill="#1a6eb5">−</text>

        {/* ── Fils générateur ── */}
        {/* EI1 → borne + géné (fil rouge) */}
        <line x1="60"  y1="95" x2="60"  y2="36" stroke="#c0392b" strokeWidth="2"/>
        <line x1="60"  y1="36" x2="118" y2="36" stroke="#c0392b" strokeWidth="2"/>
        {/* borne - géné → EI2 (fil bleu) */}
        <line x1="202" y1="36" x2="258" y2="36" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="36" x2="258" y2="95" stroke="#1a6eb5" strokeWidth="2"/>

        {/* ── Flèches sens courant i (sens inverse des électrons) ── */}
        {/* Courant descend géné → EI1 (côté gauche) */}
        <polygon points="56,82 64,82 60,92" fill="#c0392b"/>
        {/* Courant monte EI2 → géné (côté droit) */}
        <polygon points="254,62 262,62 258,52" fill="#1a6eb5"/>
        {/* Courant fil horizontal géné → gauche */}
        <polygon points="98,32 98,40 88,36" fill="#c0392b"/>
        {/* Courant fil horizontal droite → géné */}
        <polygon points="232,32 232,40 222,36" fill="#1a6eb5"/>

        {/* ── Flèches électrons (verticales, en pointillé, à l'extérieur) ── */}
        {/* Gauche de EI1 : électrons montent (sens inverse du courant) */}
        <line x1="44" y1="95" x2="44" y2="58" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="40,62 48,62 44,52" fill="#666"/>
        <text x="36" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>

        {/* Droite de EI2 : électrons descendent */}
        <line x1="274" y1="58" x2="274" y2="95" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="270,88 278,88 274,98" fill="#666"/>
        <text x="282" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>

        {/* ── Bécher ── */}
        <rect x="35" y="195" width="248" height="110" fill={couleurSolution} opacity="0.65"/>
        <line x1="35"  y1="165" x2="35"  y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="283" y1="165" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="35"  y1="305" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>

        {/* Contenu bécher */}
        <text x="159" y="248" textAnchor="middle" fontSize="15" fill="#334" fontWeight="bold">
          {x <= 0.001 ? "Fe²⁺" : x < 0.999 ? "Fe²⁺ + Fe³⁺" : x < 1.001 ? "Fe³⁺ + Ce³⁺" : "Fe³⁺ + Ce³⁺ + Ce⁴⁺"}
        </text>
        <text x="159" y="266" textAnchor="middle" fontSize="13" fill="#555">{`x = ${fx(x)}`}</text>

        {/* ── Voltmètre ΔE centré entre EI1 et EI2 ── */}
        <circle cx="159" cy="130" r="24" fill="white" stroke="#333" strokeWidth="2"/>
        <text x="159" y="126" textAnchor="middle" fontSize="13" fill="#333" fontWeight="bold">V</text>
        <text x="159" y="141" textAnchor="middle" fontSize="11" fill="#333">ΔE</text>
        {/* Fil voltmètre → EI1 */}
        <line x1="135" y1="130" x2="65"  y2="130" stroke="#333" strokeWidth="1.5" strokeDasharray="4,3"/>
        {/* Fil voltmètre → EI2 */}
        <line x1="183" y1="130" x2="253" y2="130" stroke="#333" strokeWidth="1.5" strokeDasharray="4,3"/>

        {/* ── Réactions juste sous chaque électrode ── */}
        {/* EI1 anode (oxydation, rouge) */}
        <text x="60" y="322" textAnchor="middle" fontSize="12" fill="#c0392b" fontWeight="bold">
          {dyn ? dyn.ra : x < 0.98 ? "Fe²⁺→Fe³⁺" : "Ce³⁺→Ce⁴⁺"}
        </text>
        {/* EI2 cathode (réduction, bleu) */}
        <text x="258" y="322" textAnchor="middle" fontSize="12" fill="#1a6eb5" fontWeight="bold">
          {dyn ? dyn.rc : x <= 0.02 ? "H⁺→H₂" : x < 0.98 ? "Fe³⁺→Fe²⁺" : x < 1.02 ? "Fe³⁺→Fe²⁺" : "Ce⁴⁺→Ce³⁺"}
        </text>

        
      </>}

      {/* ── Mode ampérométrie ── */}
      {mode === "ampero" && <>

        {/* ── Label générateur AU DESSUS ── */}
        <text x="160" y="16" textAnchor="middle" fontSize="13" fill="#7a4f00" fontWeight="bold">{`Géné. ΔE = ${deltaEmV} mV`}</text>

        {/* ── Générateur de tension ── */}
        <rect x="118" y="22" width="84" height="28" rx="6" fill="#ffe0a0" stroke="#e9a824" strokeWidth="1.5"/>
        <text x="136" y="40" textAnchor="middle" fontSize="13" fill="#c0392b" fontWeight="bold">+</text>
        <text x="184" y="40" textAnchor="middle" fontSize="13" fill="#1a6eb5" fontWeight="bold">−</text>

        {/* ── EI1 à gauche (anode +) ── */}
        <rect x="55" y="95" width="10" height="175" rx="2" fill="#c0392b"/>
        <text x="70" y="88" textAnchor="start" fontSize="14" fill="#c0392b" fontWeight="bold">EI1</text>
        <text x="70" y="75" textAnchor="start" fontSize="13" fill="#c0392b">+</text>

        {/* ── EI2 à droite (cathode -) ── */}
        <rect x="235" y="95" width="10" height="175" rx="2" fill="#1a6eb5"/>
        <text x="230" y="88" textAnchor="end" fontSize="14" fill="#1a6eb5" fontWeight="bold">EI2</text>
        <text x="230" y="75" textAnchor="end" fontSize="13" fill="#1a6eb5">−</text>

        {/* ── Fils circuit ── */}
        {/* EI1 → borne + géné (fil rouge) */}
        <line x1="60"  y1="95" x2="60"  y2="36" stroke="#c0392b" strokeWidth="2"/>
        <line x1="60"  y1="36" x2="118" y2="36" stroke="#c0392b" strokeWidth="2"/>
        {/* borne - géné → ampèremètre (fil bleu) */}
        {/* borne - géné → ampèremètre */}
        <line x1="202" y1="36" x2="258" y2="36" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="36" x2="258" y2="53" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="89" x2="258" y2="95" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="95" x2="240" y2="95" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="240" y1="95" x2="240" y2="105" stroke="#1a6eb5" strokeWidth="2"/>
        {/* ampèremètre → EI2 */}
        <line x1="258" y1="36" x2="258" y2="60" stroke="#1a6eb5" strokeWidth="2"/>
        <line x1="258" y1="82" x2="258" y2="95" stroke="#1a6eb5" strokeWidth="2"/>

        {/* ── Ampèremètre sur le fil EI2 ── */}
        <circle cx="258" cy="71" r="18" fill="white" stroke="#1a6eb5" strokeWidth="2"/>
        <text x="258" y="76" textAnchor="middle" fontSize="15" fill="#1a6eb5" fontWeight="bold">A</text>

        {/* ── Flèches sens courant i ── */}
        {/* Courant descend géné → EI1 (côté gauche) */}
        <polygon points="56,82 64,82 60,92" fill="#c0392b"/>
        {/* Courant fil horizontal gauche */}
        <polygon points="98,32 98,40 88,36" fill="#c0392b"/>
        {/* Courant fil horizontal droite — INVERSÉ (va vers la droite) */}
        <polygon points="222,32 222,40 232,36" fill="#1a6eb5"/>

        {/* ── Flèches électrons (verticales, pointillé, extérieur) ── */}
        {/* Gauche de EI1 : électrons montent */}
        <line x1="44" y1="95" x2="44" y2="58" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="40,62 48,62 44,52" fill="#666"/>
        <text x="36" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>
        {/* Droite de EI2 : électrons descendent */}
        <line x1="280" y1="58" x2="280" y2="95" stroke="#666" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="276,88 284,88 280,98" fill="#666"/>
        <text x="290" y="80" textAnchor="middle" fontSize="11" fill="#666">e⁻</text>

        {/* ── Bécher ── */}
        <rect x="35" y="195" width="248" height="110" fill={couleurSolution} opacity="0.65"/>
        <line x1="35"  y1="165" x2="35"  y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="283" y1="165" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>
        <line x1="35"  y1="305" x2="283" y2="305" stroke="#5599bb" strokeWidth="2"/>

        {/* Contenu bécher */}
        <text x="159" y="248" textAnchor="middle" fontSize="15" fill="#334" fontWeight="bold">
          {x <= 0.001 ? "Fe²⁺" : x < 0.999 ? "Fe²⁺ + Fe³⁺" : x < 1.001 ? "Fe³⁺ + Ce³⁺" : "Fe³⁺ + Ce³⁺ + Ce⁴⁺"}
        </text>
        <text x="159" y="266" textAnchor="middle" fontSize="13" fill="#555">{`x = ${fx(x)}`}</text>

        {/* ── Réactions aux électrodes ── */}
        {/* EI1 anode (oxydation, rouge) */}
        <text x="60" y="322" textAnchor="middle" fontSize="12" fill="#c0392b" fontWeight="bold">
          {(dyn ? dyn.rien : x <= 0.02 || Math.abs(x - 1) <= 0.02) ? "" : dyn ? dyn.ra : x < 0.98 ? "Fe²⁺→Fe³⁺" : "Ce³⁺→Ce⁴⁺"}
        </text>
        {/* EI2 cathode (réduction, bleu) */}
        <text x="258" y="322" textAnchor="middle" fontSize="12" fill="#1a6eb5" fontWeight="bold">
          {(dyn ? dyn.rien : x <= 0.02 || Math.abs(x - 1) <= 0.02) ? "" : dyn ? dyn.rc : x < 0.98 ? "Fe³⁺→Fe²⁺" : "Ce⁴⁺→Ce³⁺"}
        </text>
        {/* Pas de réaction à x=0 et x=1 */}
        {(dyn ? dyn.rien : (x <= 0.02 || Math.abs(x - 1) <= 0.02)) && (
          <text x="159" y="322" textAnchor="middle" fontSize="12" fill="#888" fontStyle="italic">
            {dyn ? "i ≈ 0 : pas de réaction" : "Pas de réactions !"}
          </text>
        )}

      </>}

      {/* Légende mode */}
      <text x="160" y="388" textAnchor="middle" fontSize="13" fill="#666" fontStyle="italic">
        {mode === "pot0" ? "Potentiométrie — i = 0" :
         mode === "courant" ? "Potentiométrie — i imposé" :
         "Ampérométrie — ΔE imposé"}
      </text>
    </svg>
  );
}

// ============================================================
//  SIMULATION 3 — Titrages électrochimiques
// ============================================================

// Concentrations (en unités de c) des quatre espèces pour un avancement x quelconque.
// Au lieu de poser à zéro les espèces « absentes » (ce qui rend le saut de potentiel à l'équivalence
// impossible à représenter), on écrit l'équilibre rédox : Fe³⁺ + Ce³⁺ ⇌ Fe²⁺ + Ce⁴⁺.
// Bilan d'électrons : (Fe³⁺ formé) = (Ce⁴⁺ consommé), soit  x = α(E) / β(E)
//   α(E) : fraction de Fe en Fe³⁺ ;  β(E) : fraction de Ce en Ce³⁺ ;  fonction croissante de E → inversion par dichotomie.
const FT = 8.314 * 298.15 / 96485;
let _cacheConc = { x: null, v: null };
function concEquilibre(x) {
  if (_cacheConc.x === x) return _cacheConc.v;
  let v;
  if (x <= 0) v = { Fe2: 1, Fe3: 0, Ce3: 0, Ce4: 0, E: null };
  else {
    const alpha = E => 1 / (1 + Math.exp(-(E - 0.68) / FT)), beta = E => 1 / (1 + Math.exp((E - 1.44) / FT));
    let lo = -0.6, hi = 2.1;
    for (let k = 0; k < 90; k++) { const m = (lo + hi) / 2; if (alpha(m) / beta(m) < x) lo = m; else hi = m; }
    const E = (lo + hi) / 2, a = alpha(E), b = beta(E);
    v = { Fe2: 1 - a, Fe3: a, Ce3: b * x, Ce4: (1 - b) * x, E };
  }
  _cacheConc = { x, v };
  return v;
}

// ── Modèle courant-potentiel ──────────────────────────────────────────────
// Courants limites de diffusion proportionnels aux concentrations (ilim = 1 u.a. pour c = 1).
// Couple rapide : vague de Nernst. Couple lent : vague décalée de ±η autour de E°′ et étalée (α = 0,5),
// représentation qualitative d'une cinétique de transfert d'électrons lente (Butler-Volmer simplifié).
const ILIM = 1, ILIM_SLVT = 100, E_FE = 0.68, E_CE = 1.44;
const IA_CALC = 0.02, IC_CALC = -0.02;     // courants imposés (u.a.) pour la courbe de suivi

export function creerModele(lent = "aucun", eta = 0.25) {
  const pf = lent === "fe" ? { eta, al: 0.5 } : { eta: 0, al: 1 };
  const pc = lent === "ce" ? { eta, al: 0.5 } : { eta: 0, al: 1 };
  const wa = (E, E0, cR, p) => { const k = Math.exp(p.al * (E - E0 - p.eta) / FT); return ILIM * cR * k / (1 + k); };
  const wc = (E, E0, cO, p) => { const k = Math.exp(-p.al * (E - E0 + p.eta) / FT); return -ILIM * cO * k / (1 + k); };
  const ia_slvt = E => { const v = Math.exp(2 * (E - 1.23 - 0.5) / FT); return ILIM_SLVT * v / (5000 + v); };
  const ic_slvt = E => { const v = Math.exp(-2 * E / FT); return -ILIM_SLVT * v / (5000 + v); };
  const Fe_a = (E, xv) => wa(E, E_FE, concEquilibre(xv).Fe2, pf);
  const Fe_c = (E, xv) => wc(E, E_FE, concEquilibre(xv).Fe3, pf);
  const Ce_a = (E, xv) => wa(E, E_CE, concEquilibre(xv).Ce3, pc);
  const Ce_c = (E, xv) => wc(E, E_CE, concEquilibre(xv).Ce4, pc);
  const signal = (E, xv) => Fe_a(E, xv) + Fe_c(E, xv) + Ce_a(E, xv) + Ce_c(E, xv) + ia_slvt(E) + ic_slvt(E);

  // i(E) est croissante : la racine de i(E) = cible est unique (dichotomie)
  const findEforI = (xv, target) => {
    let lo = -0.2, hi = 1.8;
    if ((signal(lo, xv) - target) * (signal(hi, xv) - target) > 0) return null;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (signal(mid, xv) - target < 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  // Deux électrodes identiques, ΔE imposée : i(Ea) + i(Ec) = 0 avec Ea − Ec = ΔE
  const findIforDeltaE = (xv, dE) => {
    let lo = -0.2, hi = 1.8 - dE;
    const g = Ec => signal(Ec + dE, xv) + signal(Ec, xv);
    if (g(lo) * g(hi) > 0) return null;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (g(mid) < 0) lo = mid; else hi = mid; }
    const Ec = (lo + hi) / 2, Ea = Ec + dE, iv = Math.abs(signal(Ea, xv));
    return { Ea, Ec, ia: iv, ic: -iv };
  };
  // Plage de potentiels où |i| < 0,02 : si elle est large, le potentiel « à courant nul » est mal défini
  const zoneZero = xv => {
    const lo = findEforI(xv, -0.02), hi = findEforI(xv, 0.02);
    return lo === null || hi === null ? null : { lo, hi, mil: (lo + hi) / 2 };
  };
  const reactions = (E, sens, xv) => {
    const t = sens > 0
      ? [[Fe_a(E, xv), "Fe²⁺→Fe³⁺"], [Ce_a(E, xv), "Ce³⁺→Ce⁴⁺"], [ia_slvt(E), "H₂O→O₂"]]
      : [[Fe_c(E, xv), "Fe³⁺→Fe²⁺"], [Ce_c(E, xv), "Ce⁴⁺→Ce³⁺"], [ic_slvt(E), "H⁺→H₂"]];
    const tot = t.reduce((s, [v]) => s + Math.abs(v), 0) || 1;
    return t.filter(([v]) => Math.abs(v) / tot >= 0.15).map(([, n]) => n).join(" + ");
  };
  const moyenne = (f, Emin, Emax, step = 0.02) => {
    const v = []; for (let e = Emin; e <= Emax; e += step) v.push(f(e));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const annotations = xv => {
    const anns = [], seuil = 0.03, q = concEquilibre(xv);
    const y_H2c = moyenne(E => ic_slvt(E), -0.18, -0.10);
    if (Math.abs(y_H2c) > seuil) anns.push({ E: -0.05, y: y_H2c / 2, text: "H₂ ← H⁺", color: "#1a6eb5" });
    // une vague : on place l'étiquette à mi-hauteur du palier, sur le niveau des autres contributions
    const vague = (conc, E0, p, sens, f, text) => {
      if (conc <= seuil) return;
      const Em = sens > 0 ? E0 + p.eta : E0 - p.eta;
      if (Em > 1.7 || Em < -0.1) return;
      const d = p.al < 1 ? 0.3 : 0.2, Ep = sens > 0 ? Em + d : Em - d;
      anns.push({ E: Em, y: signal(Ep, xv) - f(Ep, xv) + sens * conc * ILIM / 2, text, color: sens > 0 ? "#c0392b" : "#1a6eb5" });
    };
    vague(q.Fe3, E_FE, pf, -1, Fe_c, "Fe²⁺ ← Fe³⁺");
    vague(q.Ce4, E_CE, pc, -1, Ce_c, "Ce³⁺ ← Ce⁴⁺");
    vague(q.Fe2, E_FE, pf, +1, Fe_a, "Fe²⁺ → Fe³⁺");
    vague(q.Ce3, E_CE, pc, +1, Ce_a, "Ce³⁺ → Ce⁴⁺");
    const y_O2 = moyenne(E => ia_slvt(E), 1.75, 1.78);
    if (Math.abs(y_O2) > seuil) anns.push({ E: 1.73, y: signal(1.765, xv) - ia_slvt(1.765) + y_O2 / 2, text: "H₂O → O₂", color: "#c0392b" });
    return anns;
  };
  return { signal, findEforI, findIforDeltaE, zoneZero, reactions, annotations };
}

const ETAT_VUE = { x: 0, mode: "pot0", deltaEmV: 100, lent: "aucun", eta: 0.25, showReactions: false };

// ── Hypothèses de travail ──
function HypothesesElectro({ defaut = false, focus = false }) {
  const [ouvert, setOuvert] = useState(defaut);
  const li = (t, d) => <li style={{ marginBottom: 4 }}><strong>{t}</strong> {d}</li>;
  return (
    <div style={focus ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10, marginBottom: 8 } : { marginBottom: 8 }}>
      <Section titre="Hypothèses de travail du modèle" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
          {li("Le courant limite de diffusion est proportionnel à la concentration", "de l’espèce électroactive : la hauteur d’un palier mesure la concentration à l’électrode (même coefficient de diffusion pour toutes les espèces, solution agitée).")}
          {li("Couples « rapides » :", "le transfert d’électrons est assez rapide pour que la vague soit centrée sur le potentiel d’équilibre (loi de Nernst), sans surtension.")}
          {li("Couple supposé « lent » (hypothèse fictive, pour comparaison) :", "les couples Fe³⁺/Fe²⁺ et Ce⁴⁺/Ce³⁺ sont en réalité rapides. Si l’un d’eux était lent, il faudrait une surtension η pour que le courant apparaisse : la vague d’oxydation est décalée vers les potentiels plus élevés, celle de réduction vers les potentiels plus bas, et elles sont étalées. C’est une représentation qualitative (η et l’étalement sont choisis, non calculés).")}
          {li("Potentiels E°′ apparents", "dans l’acide sulfurique : 0,68 V/ESH pour Fe³⁺/Fe²⁺ et 1,44 V/ESH pour Ce⁴⁺/Ce³⁺. Activités assimilées aux concentrations.")}
          {li("Pas de chute ohmique, dilution négligée,", "température 25 °C. Le courant est en unités arbitraires (u.a.) ; les valeurs numériques ne sont pas des intensités réelles.")}
          {li("Les « murs » du solvant", "(oxydation de l’eau vers 1,7 V, réduction des H⁺ vers 0 V) sont schématiques : leur position dépend de l’électrode et du milieu.")}
          {li("Le milieu est supposé à l’équilibre rédox", "à chaque instant : la composition (Fe²⁺, Fe³⁺, Ce³⁺, Ce⁴⁺) est celle de l’équilibre Fe³⁺ + Ce³⁺ ⇌ Fe²⁺ + Ce⁴⁺ pour l’avancement x choisi.")}
        </ul>
      </Section>
    </div>
  );
}

// ── Vue complète : courbe i = f(E), commande de x, modes de titrage, courbe de suivi, schéma ──
export function VueElectro({ plotlyReady, e, set, opts = {}, focus = [] }) {
  const { x, mode, deltaEmV, lent, eta, showReactions } = e;
  const o = { slider: true, reactions: true, modes: true, lent: true, suivi: true, schema: true, points: true, delta: true, ...opts };
  const M = useMemo(() => creerModele(lent, eta), [lent, eta]);
  const plotIERef = useRef(null), plotRightRef = useRef(null);
  const halo = id => focus.includes(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const dE = deltaEmV / 1000;
  const lentOn = lent !== "aucun";
  const nomLent = lent === "fe" ? "Fe³⁺/Fe²⁺" : "Ce⁴⁺/Ce³⁺";

  useEffect(() => {
    if (!window.Plotly) return;
    // Courbe i = f(E)
    const Ev = [], Iv = [];
    for (let v = -0.2; v <= 1.8001; v += 0.01) { Ev.push(v); Iv.push(M.signal(v, x)); }
    const dataIE = [{ x: Ev, y: Iv, mode: "lines", name: "i(E)", line: { color: "steelblue" }, showlegend: false }];
    const shapes = [];
    if (o.points) {
      if (mode === "pot0") {
        if (lentOn) {
          const z = M.zoneZero(x);
          if (z) {
            shapes.push({ type: "line", x0: z.lo, x1: z.hi, y0: 0, y1: 0, line: { width: 4, color: "#e9a824" } });
            dataIE.push({ x: [z.mil], y: [0], mode: "markers", marker: { size: 9, color: "#e9a824", line: { color: "black", width: 1 } }, showlegend: false });
          }
        } else {
          const Ez = M.findEforI(x, 0);
          if (Ez !== null) dataIE.push({ x: [Ez], y: [0], mode: "markers", marker: { size: 10, color: "black" }, showlegend: false });
        }
      }
      if (mode === "courant") {
        const Ea = M.findEforI(x, IA_CALC * 2.5), Ec = M.findEforI(x, IC_CALC * 2.5);   // 0,05 u.a. affiché
        if (Ea !== null && Ec !== null) {
          dataIE.push({ x: [Ea], y: [IA_CALC * 2.5], mode: "markers", marker: { color: "black", size: 8 }, showlegend: false });
          dataIE.push({ x: [Ec], y: [IC_CALC * 2.5], mode: "markers", marker: { color: "black", size: 8 }, showlegend: false });
          shapes.push({ type: "line", x0: -0.2, x1: 1.8, y0: IA_CALC * 2.5, y1: IA_CALC * 2.5, line: { dash: "dot", color: "gray" } });
          shapes.push({ type: "line", x0: -0.2, x1: 1.8, y0: IC_CALC * 2.5, y1: IC_CALC * 2.5, line: { dash: "dot", color: "gray" } });
          shapes.push({ type: "line", x0: Ea, x1: Ec, y0: 0, y1: 0, line: { width: 3 } });
        }
      }
      if (mode === "ampero") {
        const res = M.findIforDeltaE(x, dE);
        if (res) {
          dataIE.push({ x: [res.Ea], y: [res.ia], mode: "markers", marker: { color: "red", size: 9 }, name: "anode", showlegend: false });
          dataIE.push({ x: [res.Ec], y: [res.ic], mode: "markers", marker: { color: "blue", size: 9 }, name: "cathode", showlegend: false });
          shapes.push({ type: "line", x0: res.Ea, x1: res.Ec, y0: 0, y1: 0, line: { width: 3, color: "orange" } });
          shapes.push({ type: "line", x0: -0.2, x1: 1.8, y0: res.ia, y1: res.ia, line: { dash: "dot", color: "red" } });
        }
      }
    }
    const annotations = showReactions ? M.annotations(x).map(a => ({
      x: a.E, y: a.y, text: a.text, showarrow: false, font: { color: a.color, size: 11 },
      bgcolor: "rgba(255,255,255,0.82)", bordercolor: a.color, borderwidth: 1, borderpad: 3, xanchor: "center" })) : [];
    if (plotIERef.current)
      window.Plotly.react(plotIERef.current, dataIE, {
        xaxis: { title: "E (V/ESH)", range: [-0.2, 1.8] }, yaxis: { title: "i (u.a.)", range: [-1.5, 1.5] },
        shapes, annotations, margin: { t: 20, b: 50, l: 60, r: 20 },
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true,
      }, { displayModeBar: false, responsive: true });

    // Courbe de suivi
    if (!o.suivi || !plotRightRef.current) return;
    const grille = new Set();
    for (let k = 0; k <= 200; k++) grille.add(parseFloat((k * 0.01).toFixed(6)));
    for (let k = 2; k <= 6; k++) { const d = Math.pow(10, -k); [1 - d, 1 + d, 1 - d * 3, 1 + d * 3].forEach(v => grille.add(parseFloat(v.toFixed(8)))); }
    grille.add(1);
    const X = [], Y = [], Ylo = [], Yhi = [], Yn = [];
    for (const xv of [...grille].sort((a, b) => a - b)) {
      if (mode === "pot0") {
        if (lentOn) {
          const z = M.zoneZero(xv);
          if (z) { X.push(xv); Y.push(z.mil); Ylo.push(z.lo); Yhi.push(z.hi); const q = concEquilibre(xv); Yn.push(q.E); }
        } else { const E = M.findEforI(xv, 0); if (E !== null) { X.push(xv); Y.push(E); } }
      } else if (mode === "courant") {
        const Ea = M.findEforI(xv, IA_CALC), Ec = M.findEforI(xv, IC_CALC);
        if (Ea !== null && Ec !== null) { X.push(xv); Y.push(Math.abs(Ec - Ea)); }
      } else {
        const r = M.findIforDeltaE(xv, dE); if (r) { X.push(xv); Y.push(r.ia); }
      }
    }
    let data;
    if (mode === "pot0" && lentOn) {
      data = [
        { x: X, y: Ylo, mode: "lines", line: { width: 0 }, showlegend: false, hoverinfo: "skip" },
        { x: X, y: Yhi, mode: "lines", line: { width: 0 }, fill: "tonexty", fillcolor: "rgba(233,168,36,0.35)", name: "plage où |i| < 0,02", showlegend: true },
        { x: X, y: Yn, mode: "lines", line: { color: "#16a34a", dash: "dot" }, name: "E de Nernst (couple rapide)", showlegend: true },
      ];
    } else {
      data = [{ x: X, y: Y, mode: "lines", line: { color: "steelblue" }, showlegend: false }];
    }
    let yPoint = null;
    if (o.points) {
      if (mode === "pot0") yPoint = lentOn ? (M.zoneZero(x) || {}).mil ?? null : M.findEforI(x, 0);
      else if (mode === "courant") { const Ea = M.findEforI(x, IA_CALC), Ec = M.findEforI(x, IC_CALC); if (Ea !== null && Ec !== null) yPoint = Math.abs(Ec - Ea); }
      else { const r = M.findIforDeltaE(x, dE); if (r) yPoint = r.ia; }
    }
    if (yPoint !== null) data.push({ x: [x], y: [yPoint], mode: "markers", marker: { size: 10, color: "black" }, showlegend: false });
    window.Plotly.react(plotRightRef.current, data, {
      xaxis: { title: "x (avancement)" },
      yaxis: { title: mode === "pot0" ? "E (V/ESH)" : mode === "courant" ? "ΔE (V)" : "i (u.a.)" },
      margin: { t: 20, b: 50, l: 60, r: 20 }, legend: { orientation: "h", y: -0.3, font: { size: 11 } },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "#fafcff", autosize: true,
    }, { displayModeBar: false, responsive: true });
  }, [x, mode, deltaEmV, showReactions, M, plotlyReady, o.suivi, o.points]);

  // Informations pour le schéma
  const { lentMsg, dyn } = useMemo(() => {
    if (!lentOn && mode !== "ampero") return { lentMsg: null, dyn: null };
    if (mode === "pot0") { const z = M.zoneZero(x); return { lentMsg: !z || z.hi - z.lo > 0.05 ? "E mal défini (couple lent)" : null, dyn: null }; }
    if (mode === "courant") {
      const Ea = M.findEforI(x, IA_CALC), Ec = M.findEforI(x, IC_CALC);
      return { lentMsg: null, dyn: Ea === null || Ec === null ? null : { ra: M.reactions(Ea, 1, x), rc: M.reactions(Ec, -1, x), rien: false } };
    }
    const r = M.findIforDeltaE(x, dE);
    return { lentMsg: null, dyn: r ? { ra: M.reactions(r.Ea, 1, x), rc: M.reactions(r.Ec, -1, x), rien: r.ia < 0.02 } : null };
  }, [x, mode, dE, M, lentOn]);

  const yLabel = mode === "pot0" ? "E = f(x)" : mode === "courant" ? "ΔE = f(x)" : "i = f(x)";
  const ligne2 = o.modes || o.suivi || o.schema || o.lent;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "Inter, system-ui, Arial", fontSize: 14 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: "#445" }}>i = f(E) — dosage Fe²⁺ par Ce⁴⁺</span>
          {o.slider && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: 3, ...halo("x") }}>
              <span style={{ fontSize: 13 }}>x =</span>
              <input type="range" min="0" max="2" step="0.001" value={x} aria-label="Curseur du titrage"
                onChange={ev => set({ x: parseFloat(ev.target.value) })} style={{ width: 180, accentColor: "#e9a824" }}/>
              <input type="number" min="0" max="2" step="0.0001" value={x} aria-label="Avancement x"
                onChange={ev => { const v = parseFloat(ev.target.value); if (isFinite(v)) set({ x: Math.min(2, Math.max(0, v)) }); }}
                style={{ width: 84, padding: "3px 6px", borderRadius: 4, border: "1px solid #ccc", fontSize: 13, fontWeight: 700 }}/>
            </span>
          )}
          {o.reactions && (
            <button onClick={() => set({ showReactions: !showReactions })}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #aaa", cursor: "pointer", fontSize: 12,
                background: showReactions ? "#e9a824" : "#f5f5f5", color: showReactions ? "white" : "#333", ...(o.slider ? {} : { marginLeft: "auto" }), ...halo("reactions") }}>
              {showReactions ? "Masquer réactions" : "Afficher réactions"}
            </button>
          )}
        </div>
        <div style={halo("ie")}><div ref={plotIERef} style={{ height: 300 }}/></div>
        <div style={{ fontSize: 12.5, color: "#334155", marginTop: 4, lineHeight: 1.5 }}>
          <strong>Axe E :</strong> potentiels exprimés par rapport à l’électrode standard à hydrogène (ESH), avec E°′(Fe³⁺/Fe²⁺) = 0,68 V/ESH et E°′(Ce⁴⁺/Ce³⁺) = 1,44 V/ESH (milieu acide sulfurique).
          Avec une électrode de référence réelle, on lit E<sub>mesuré</sub> = E<sub>ESH</sub> − E<sub>réf</sub> : E<sub>réf</sub> ≈ +0,24 V/ESH pour l’ECS, ≈ +0,20 V/ESH pour Ag/AgCl saturée. Le courant i est en unités arbitraires (i &gt; 0 : oxydation à l’électrode ; i &lt; 0 : réduction).
        </div>
      </div>
      {ligne2 && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}>
            {o.modes && (
              <div style={{ ...cardStyle, ...halo("modes") }}>
                <div style={{ fontWeight: 600, color: "#445", marginBottom: 10 }}>Mode de titrage</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <TabBtn active={mode === "pot0"} color="#2a9d8f" onClick={() => set({ mode: "pot0" })}>Potentiométrie i = 0</TabBtn>
                  <TabBtn active={mode === "courant"} color="#e63946" onClick={() => set({ mode: "courant" })}>Potentiométrie i = qq µA</TabBtn>
                  <TabBtn active={mode === "ampero"} color="#e9a824" onClick={() => set({ mode: "ampero" })}>Ampérométrie ΔE = qq mV</TabBtn>
                </div>
                {mode === "ampero" && o.delta && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: 3, ...halo("delta") }}>
                    <span style={{ fontSize: 13 }}>ΔE imposé :</span>
                    <input type="range" min="10" max="1000" step="10" value={deltaEmV} aria-label="Tension imposée ΔE"
                      onChange={ev => set({ deltaEmV: parseInt(ev.target.value) })} style={{ flex: 1, accentColor: "#e9a824" }}/>
                    <strong style={{ minWidth: 65 }}>{deltaEmV} mV</strong>
                  </div>
                )}
              </div>
            )}
            {o.lent && (
              <div style={{ ...cardStyle, ...halo("lent") }}>
                <div style={{ fontWeight: 600, color: "#445", marginBottom: 8 }}>Et si un couple était lent ? (situation fictive)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <TabBtn active={lent === "aucun"} color="#475569" onClick={() => set({ lent: "aucun" })}>Réel : couples rapides</TabBtn>
                  {(o.lentChoix || ["fe", "ce"]).includes("fe") && <TabBtn active={lent === "fe"} color="#9333ea" onClick={() => set({ lent: "fe" })}>Fe³⁺/Fe²⁺ supposé lent</TabBtn>}
                  {(o.lentChoix || ["fe", "ce"]).includes("ce") && <TabBtn active={lent === "ce"} color="#9333ea" onClick={() => set({ lent: "ce" })}>Ce⁴⁺/Ce³⁺ supposé lent</TabBtn>}
                </div>
                {lentOn && o.etaSlider !== false && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 13 }}>Surtension η :</span>
                    <input type="range" min="0.1" max="0.4" step="0.05" value={eta} aria-label="Surtension η"
                      onChange={ev => set({ eta: parseFloat(ev.target.value) })} style={{ flex: 1, accentColor: "#9333ea" }}/>
                    <strong style={{ minWidth: 60 }}>{Math.round(eta * 1000)} mV</strong>
                  </div>
                )}
                {lentOn && <div style={{ fontSize: 12.5, color: "#334155", marginTop: 6, lineHeight: 1.45 }}>
                  Situation imaginaire : en réalité, les couples Fe³⁺/Fe²⁺ et Ce⁴⁺/Ce³⁺ sont rapides sur platine. On suppose ici que {nomLent} serait lent, pour voir ce que deviendraient les courbes et le choix de la méthode. Les vagues d’oxydation et de réduction sont alors décalées de ± η autour de E°′ et étalées (représentation qualitative). L’autre couple reste rapide.
                </div>}
              </div>
            )}
            {o.suivi && (
              <div style={{ ...cardStyle, flex: 1, ...halo("suivi") }}>
                <div style={{ fontWeight: 600, color: "#445", marginBottom: 6 }}>{yLabel}</div>
                <div ref={plotRightRef} style={{ height: 300 }}/>
                {lentOn && mode === "pot0" && <div style={{ fontSize: 12.5, color: "#334155", marginTop: 4 }}>
                  Avec un couple lent, il n’y a plus un potentiel où i s’annule, mais une plage où le courant reste quasi nul : la mesure à i = 0 n’est plus fiable.
                </div>}
              </div>
            )}
          </div>
          {o.schema && (
            <div style={{ flex: "0 0 420px", minWidth: 380, ...halo("schema") }}>
              <div style={{ ...cardStyle, height: "100%" }}>
                <SchemaElectro mode={mode} x={x} deltaEmV={deltaEmV} lentMsg={lentMsg} dyn={dyn}/>
                <div style={{ marginTop: 10, background: "white", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", fontSize: 14, color: "#0f172a", lineHeight: 1.5 }}>
                  <strong>Réaction support du titrage :</strong>{" "}
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 16, whiteSpace: "nowrap" }}>Fe²⁺<sub>(aq)</sub> + Ce⁴⁺<sub>(aq)</sub> → Fe³⁺<sub>(aq)</sub> + Ce³⁺<sub>(aq)</sub></span>
                  <div style={{ fontSize: 12.5, color: "#334155" }}>Dans le bécher : les ions Fe²⁺ (espèce titrée). Dans la burette : les ions Ce⁴⁺ (titrant).</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  EXPLORATION LIBRE
// ════════════════════════════════════════════════════════════════
function ExplorationElectro({ plotlyReady }) {
  const [e, setE] = useState(ETAT_VUE);
  const set = f => setE(s => ({ ...s, ...f }));
  return (
    <div>
      <HypothesesElectro/>
      <VueElectro plotlyReady={plotlyReady} e={e} set={set}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PARCOURS GUIDÉ
// ════════════════════════════════════════════════════════════════
function ParcoursElectro({ plotlyReady, changerMode }) {
  const [guide, setGuide] = useEtatPersistant("electro-guide-v1", { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [e, setE] = useState(ETAT_VUE);
  const set = f => setE(s => ({ ...s, ...f }));
  const etape = guide.etape;
  const pres = (v, c, t = 0.03) => Math.abs(v - c) <= t;
  const placer = (c, lib) => ({ label: `Placer x = ${lib}`, faire: () => set({ x: c }) });
  const ETAPES = [
    { id: "principe", titre: "Le titrage étudié", focus: [],
      texte: <>On titre des ions Fe²⁺ (dans le bécher) par une solution d’ions Ce⁴⁺ (dans la burette). L’avancement <strong>x</strong> du titrage est la quantité de Ce⁴⁺ versée rapportée à la quantité initiale de Fe²⁺ : x = 0 au départ, x = 1 à l’équivalence, x &gt; 1 après. Ici, on suit le titrage grâce aux <strong>courbes courant-potentiel</strong> i = f(E).</>,
      tache: { type: "qcm", q: "Quelle est la réaction support du titrage ?", options: ["Fe²⁺ + Ce⁴⁺ → Fe³⁺ + Ce³⁺", "Fe³⁺ + Ce³⁺ → Fe²⁺ + Ce⁴⁺", "Fe²⁺ + Ce³⁺ → Fe³⁺ + Ce²⁺"], bonne: 0,
        expl: "Fe²⁺ est oxydé en Fe³⁺ et Ce⁴⁺ est réduit en Ce³⁺ : l’oxydant le plus fort (couple de E° le plus élevé) réagit avec le réducteur le plus fort." } },
    { id: "axe", titre: "Lire une courbe i = f(E)", focus: ["ie"],
      texte: <>Le graphique donne le courant i qui traverserait une électrode de platine plongée dans la solution, en fonction de son potentiel E. L’axe des potentiels est exprimé <strong>par rapport à l’électrode standard à hydrogène (ESH)</strong> (la note sous le graphique donne les conversions pour ECS ou Ag/AgCl). Le courant est en unités arbitraires.</>,
      tache: { type: "qcm", q: "Un point de la courbe situé au-dessous de l’axe (i < 0) correspond à…", options: ["une réduction à l’électrode", "une oxydation à l’électrode", "l’absence de réaction"], bonne: 0,
        expl: "Par convention, un courant anodique (i > 0) correspond à une oxydation, un courant cathodique (i < 0) à une réduction." } },
    { id: "solvant", titre: "Le domaine d’inertie électrochimique", focus: ["ie"],
      texte: <>Aux potentiels très faibles (vers 0 V/ESH) et très élevés (vers 1,7 V/ESH), le courant augmente brutalement même sans espèce dissoute supplémentaire.</>,
      tache: { type: "qcm", q: "À quoi sont dues ces deux montées de courant ?", options: ["À la réduction (vers 0 V) et à l’oxydation (vers 1,7 V) du solvant, l’eau", "À la présence d’ions Ce⁴⁺", "À un défaut de l’électrode"], bonne: 0,
        expl: "Entre ces deux « murs », le solvant est électrochimiquement inerte : c’est le domaine de potentiel où l’on peut observer les espèces dissoutes." } },
    { id: "hypo", titre: "Sur quoi repose le modèle ?", focus: ["hypo"],
      texte: <>Lisez l’encadré « Hypothèses de travail ». Les courbes sont constituées de <strong>vagues</strong> qui se terminent par un <strong>palier</strong> : le courant limite de diffusion.</>,
      tache: { type: "qcm", q: "Pourquoi le courant atteint-il un palier ?", options: ["Le courant est limité par l’arrivée de l’espèce à l’électrode, par diffusion ; il est proportionnel à sa concentration", "L’électrode est saturée de platine", "Le générateur ne peut pas fournir plus de courant"], bonne: 0 } },
    { id: "x0", titre: "Au départ : x = 0", focus: ["ie", "x"], vue: { slider: true },
      texte: <>Le curseur de <strong>x</strong> apparaît. À x = 0, le bécher ne contient que des ions Fe²⁺.</>,
      tache: { type: "qcm", q: "Que représente la vague (montée de courant positif) vers 0,68 V ?", options: ["L’oxydation de Fe²⁺ en Fe³⁺", "La réduction de Fe³⁺ en Fe²⁺", "L’oxydation de l’eau"], bonne: 0,
        expl: "Elle est centrée sur le potentiel standard apparent du couple Fe³⁺/Fe²⁺ (0,68 V/ESH). Il n’y a pas de vague de réduction : il n’y a pas encore de Fe³⁺." } },
    { id: "x25", titre: "Un quart du titrage", focus: ["x", "ie"], vue: { slider: true },
      texte: <>Déplacez le curseur pour obtenir x = 0,25. Une partie du Fe²⁺ a été oxydée en Fe³⁺ par les ions Ce⁴⁺ versés.</>,
      tache: { type: "action", ok: pres(e.x, 0.25), ...placer(0.25, "0,25"), consigne: "Placez x à 0,25 (à 0,03 près)." } },
    { id: "ratio", titre: "La hauteur des paliers", focus: ["ie"], vue: { slider: true },
      texte: <>À x = 0,25, la courbe présente deux vagues autour de 0,68 V : une vague d’oxydation de Fe²⁺ (au-dessus de l’axe) et une vague de réduction de Fe³⁺ (au-dessous). Survolez la courbe avec la souris pour lire les valeurs des paliers.</>,
      tache: { type: "num", q: "Rapport (hauteur du palier de Fe²⁺ oxydé) / (hauteur du palier de Fe³⁺ réduit)", unite: "", vrai: 3, tol: 0.1, affiche: v => fmt(v, 1),
        aide: "Comparez les deux paliers en valeur absolue.",
        expl: "Les hauteurs de paliers sont proportionnelles aux concentrations : [Fe²⁺]/[Fe³⁺] = (1 − x)/x = 0,75/0,25 = 3.",
        pieges: [[0.333, "Rapport inversé : le palier de Fe²⁺ est au numérateur."]] } },
    { id: "reactions", titre: "Afficher les réactions", focus: ["reactions"], vue: { slider: true, reactions: true },
      texte: <>Le bouton « Afficher réactions » étiquette chaque vague avec la réaction qui a lieu à l’électrode.</>,
      tache: { type: "action", ok: e.showReactions, label: "Afficher les réactions", faire: () => set({ showReactions: true }), consigne: "Affichez les réactions." } },
    { id: "lecture", titre: "Lire les réactions", focus: ["ie"], vue: { slider: true, reactions: true },
      texte: <>Lisez les étiquettes : le sens de la flèche indique la transformation.</>,
      tache: { type: "qcm", q: "Que se passe-t-il au niveau de la vague située sous l’axe, vers 0,68 V ?", options: ["Fe³⁺ est réduit en Fe²⁺", "Fe²⁺ est oxydé en Fe³⁺", "Ce⁴⁺ est réduit en Ce³⁺"], bonne: 0,
        expl: "i < 0 : réduction. L’espèce réduite est l’oxydant du couple présent à cette tension : Fe³⁺." } },
    { id: "pot0", titre: "Potentiométrie à courant nul", focus: ["ie", "x", "suivi"], vue: { slider: true, reactions: true, suivi: true },
      texte: <>En potentiométrie à <strong>i = 0</strong>, une électrode de platine et une électrode de référence, reliées à un voltmètre de très grande résistance, ne laissent passer aucun courant. Le potentiel mesuré est celui pour lequel la courbe i = f(E) coupe l’axe i = 0 (point noir). Observez comment il évolue avec x (courbe E = f(x) en dessous). Placez x = 0,75.</>,
      tache: { type: "action", ok: pres(e.x, 0.75), ...placer(0.75, "0,75"), consigne: "Placez x à 0,75 (à 0,03 près)." } },
    { id: "pot0q", titre: "Évolution du potentiel", focus: ["suivi", "ie"], vue: { slider: true, reactions: true, suivi: true },
      texte: <>Le potentiel d’équilibre d’un couple dépend du rapport [Ox]/[Red] (loi de Nernst).</>,
      tache: { type: "qcm", q: "Quand x passe de 0,25 à 0,75, le potentiel mesuré (point noir sur l’axe i = 0)…", options: ["augmente", "diminue", "reste constant"], bonne: 0,
        expl: "Le rapport [Fe³⁺]/[Fe²⁺] augmente, donc E = E°′ + 0,06·log([Fe³⁺]/[Fe²⁺]) augmente." } },
    { id: "equiv", titre: "À l’équivalence", focus: ["x", "ie"], vue: { slider: true, reactions: true, suivi: true },
      texte: <>Amenez x au voisinage de 1. Tout le Fe²⁺ a été oxydé en Fe³⁺, et tout le Ce⁴⁺ versé a été réduit en Ce³⁺.</>,
      tache: { type: "action", ok: pres(e.x, 1, 0.02), ...placer(1, "1"), consigne: "Placez x entre 0,98 et 1,02." } },
    { id: "especes", titre: "Que reste-t-il ?", focus: ["ie"], vue: { slider: true, reactions: true, suivi: true },
      texte: <>Observez les vagues à l’équivalence.</>,
      tache: { type: "qcm", q: "Quelles espèces électroactives sont présentes à l’équivalence ?", options: ["Fe³⁺ (réductible) et Ce³⁺ (oxydable)", "Fe²⁺ et Ce⁴⁺", "Fe²⁺ et Fe³⁺"], bonne: 0,
        expl: "La réaction du titrage est quasi totale : il ne reste ni titré (Fe²⁺) ni titrant (Ce⁴⁺), seulement les produits Fe³⁺ et Ce³⁺. Entre les deux vagues, le courant est presque nul sur une large plage de potentiels." } },
    { id: "saut", titre: "Le saut de potentiel", focus: ["suivi"], vue: { slider: true, reactions: true, suivi: true },
      texte: <>Faites varier x un peu avant puis un peu après l’équivalence (par exemple de 0,98 à 1,02) en regardant la courbe E = f(x) et le point noir.</>,
      tache: { type: "qcm", q: "Comment repère-t-on l’équivalence sur la courbe E = f(x) ?", options: ["Par un saut brusque de potentiel de plusieurs centaines de mV", "Par un minimum du potentiel", "Par un palier horizontal"], bonne: 0,
        expl: "Le potentiel passe d’une valeur imposée par le couple Fe³⁺/Fe²⁺ à une valeur imposée par Ce⁴⁺/Ce³⁺. L’équivalence est le milieu du saut (méthode des tangentes ou dérivée)." } },
    { id: "courant", titre: "Potentiométrie à courant imposé", focus: ["modes", "schema"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Deuxième méthode : on impose un petit courant (de l’ordre de quelques µA) entre <strong>deux électrodes de platine identiques</strong> et on mesure la différence de potentiel ΔE entre elles. L’électrode qui reçoit le courant (anode) est le siège d’une oxydation, l’autre (cathode) d’une réduction. Choisissez ce mode et placez x à 0,5.</>,
      tache: { type: "action", ok: e.mode === "courant" && pres(e.x, 0.5, 0.1), label: "Mode courant imposé, x = 0,5", faire: () => set({ mode: "courant", x: 0.5 }), consigne: "Choisissez « Potentiométrie i = qq µA » et placez x entre 0,4 et 0,6." } },
    { id: "courantAvant", titre: "ΔE avant l’équivalence", focus: ["ie", "suivi"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Les deux points noirs sont les potentiels pris par les deux électrodes pour que le courant imposé (+ et −) circule. Le segment qui les relie représente ΔE.</>,
      tache: { type: "qcm", q: "Avant l’équivalence, pourquoi ΔE est-elle très petite ?", options: ["Les deux formes (Fe²⁺ et Fe³⁺) d’un même couple sont présentes : oxydation et réduction se font toutes deux autour de 0,68 V", "Le générateur impose une faible tension", "Il n’y a aucune réaction aux électrodes"], bonne: 0 } },
    { id: "courantEq", titre: "ΔE à l’équivalence", focus: ["suivi", "schema"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Placez x au voisinage de 1 et regardez ΔE ainsi que les réactions aux électrodes dans le schéma.</>,
      tache: { type: "qcm", q: "Pourquoi ΔE devient-elle très grande à l’équivalence ?", options: ["Il ne reste plus de couple dont les deux formes sont présentes : l’anode et la cathode utilisent deux couples différents (ou le solvant), à des potentiels éloignés", "Le courant imposé augmente", "Les électrodes se polarisent à cause du dépôt de platine"], bonne: 0,
        expl: "À l’équivalence, il faut oxyder Ce³⁺ (vers 1,4 V) à l’anode et réduire Fe³⁺ (vers 0,7 V) à la cathode : ΔE saute de quelques mV à plusieurs centaines de mV." } },
    { id: "ampero", titre: "Ampérométrie à tension imposée", focus: ["modes", "delta"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Troisième méthode (biampérométrie) : on impose cette fois une <strong>petite tension ΔE</strong> (100 mV) entre deux électrodes identiques et on mesure le <strong>courant</strong>. Choisissez ce mode, avec ΔE = 100 mV et x = 0,5.</>,
      tache: { type: "action", ok: e.mode === "ampero" && e.deltaEmV === 100 && pres(e.x, 0.5, 0.1), label: "Mode ampérométrie, x = 0,5", faire: () => set({ mode: "ampero", deltaEmV: 100, x: 0.5 }), consigne: "Choisissez « Ampérométrie », ΔE = 100 mV, x entre 0,4 et 0,6." } },
    { id: "amperoAvant", titre: "Un courant circule", focus: ["ie"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Le point rouge (anode) et le point bleu (cathode) sont séparés de ΔE = 100 mV. Leur courant est le même au signe près.</>,
      tache: { type: "qcm", q: "Pourquoi un courant circule-t-il malgré une si faible tension ?", options: ["Les deux formes d’un même couple rapide (Fe²⁺ et Fe³⁺) sont présentes : l’une est oxydée à l’anode et l’autre réduite à la cathode", "100 mV suffisent à oxyder l’eau", "Le courant vient de la pile Fe/Ce"], bonne: 0 } },
    { id: "amperoEq", titre: "Et à l’équivalence ?", focus: ["ie", "suivi"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Placez x à 1 (en ampérométrie, ΔE = 100 mV) et regardez où se trouvent les points rouge et bleu.</>,
      tache: { type: "qcm", q: "Pourquoi le courant est-il pratiquement nul à l’équivalence ?", options: ["Aucun couple n’a ses deux formes présentes, et 100 mV ne suffisent pas pour oxyder Ce³⁺ et réduire Fe³⁺ en même temps", "Les électrodes sont déconnectées", "Fe²⁺ et Ce⁴⁺ sont en excès"], bonne: 0,
        expl: "Il faudrait ΔE ≈ 0,7 V pour atteindre les deux vagues. C’est le principe de la biampérométrie : le courant s’annule à l’équivalence." } },
    { id: "forme", titre: "Allure de la courbe i = f(x)", focus: ["suivi"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Faites varier x de 0 à 2 en observant la courbe de suivi.</>,
      tache: { type: "qcm", q: "Quelle est l’allure de la courbe i = f(x) ?", options: ["Elle monte, puis diminue jusqu’à zéro à x = 1, puis remonte", "Elle augmente puis reste constante", "Elle présente un saut brusque à x = 1"], bonne: 0,
        expl: "Avant l’équivalence, le courant est limité par l’espèce la moins concentrée du couple Fe (Fe²⁺ puis Fe³⁺) ; après, par celle du couple Ce. Il est nul quand aucun couple n’a ses deux formes." } },
    { id: "deltaTrop", titre: "Choisir ΔE", focus: ["delta", "ie"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Que se passe-t-il si l’on impose une tension plus grande ? Placez ΔE à 800 mV et x à 1.</>,
      tache: { type: "action", ok: e.mode === "ampero" && e.deltaEmV >= 700 && pres(e.x, 1, 0.02), label: "ΔE = 800 mV, x = 1", faire: () => set({ mode: "ampero", deltaEmV: 800, x: 1 }), consigne: "Choisissez ΔE ≥ 700 mV et x entre 0,98 et 1,02." } },
    { id: "deltaTropQ", titre: "Une tension trop grande", focus: ["ie", "suivi"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true },
      texte: <>Comparez avec ce que vous avez vu à 100 mV.</>,
      tache: { type: "qcm", q: "Que devient le courant à l’équivalence avec ΔE = 800 mV ?", options: ["Il n’est plus nul : cette tension suffit à oxyder Ce³⁺ à l’anode et réduire Fe³⁺ à la cathode, donc l’équivalence n’est plus repérable", "Il reste nul, car l’équivalence est toujours à i = 0", "Il double"], bonne: 0,
        expl: "Pour repérer l’équivalence, ΔE doit être assez grande pour faire passer un courant avant et après, mais assez petite pour rester inférieure à l’écart entre les vagues de Fe³⁺ et de Ce³⁺." } },
    { id: "lent1", titre: "Un couple lent", focus: ["lent", "ie"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true, lent: true, lentChoix: ["fe"], etaSlider: false },
      texte: <>Jusqu’ici, les deux couples étaient <strong>rapides</strong> : les vagues sont centrées sur E°′. Un couple <strong>lent</strong> demande une surtension pour réagir. Attention : le fer et le cérium sont en réalité rapides ; on <strong>imagine</strong> ici que Fe³⁺/Fe²⁺ serait lent, pour comprendre l’effet de la cinétique. Choisissez « Fe³⁺/Fe²⁺ supposé lent » (η = 250 mV) et placez x à 0,5, en mode ampérométrie, ΔE = 100 mV.</>,
      tache: { type: "action", ok: e.lent === "fe" && e.mode === "ampero" && e.deltaEmV === 100 && pres(e.x, 0.5, 0.1), label: "Couple Fe lent, ampéro, 100 mV, x = 0,5", faire: () => set({ lent: "fe", eta: 0.25, mode: "ampero", deltaEmV: 100, x: 0.5 }), consigne: "Fe³⁺/Fe²⁺ supposé lent, mode ampérométrie, ΔE = 100 mV, x entre 0,4 et 0,6." } },
    { id: "lent2", titre: "Les vagues d’un couple lent", focus: ["ie"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true, lent: true, lentChoix: ["fe"], etaSlider: false },
      texte: <>Comparez la courbe à celle obtenue avec les couples rapides. Les deux formes du fer sont toujours présentes (x = 0,5) mais le courant mesuré est très faible.</>,
      tache: { type: "qcm", q: "Comment se déforment les vagues d’un couple lent ?", options: ["Elles s’écartent : l’oxydation a lieu à un potentiel plus élevé que E°′ et la réduction à un potentiel plus bas, et elles s’étalent", "Elles se rapprochent de E°′", "Leur palier devient plus haut"], bonne: 0,
        expl: "Le courant limite (hauteur du palier) ne change pas, mais il faut une surtension η pour l’atteindre. Avec ΔE = 100 mV < 2η, les deux électrodes ne peuvent pas atteindre simultanément les vagues d’oxydation et de réduction : le courant est quasi nul." } },
    { id: "lent3", titre: "Potentiométrie avec un couple lent", focus: ["suivi", "schema"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true, lent: true, lentChoix: ["fe"], etaSlider: false },
      texte: <>Passez en mode « Potentiométrie i = 0 », avec x = 0,5, et observez la courbe E = f(x) : une plage orangée apparaît.</>,
      tache: { type: "action", ok: e.lent === "fe" && e.mode === "pot0" && pres(e.x, 0.5, 0.1), label: "Mode i = 0, x = 0,5", faire: () => set({ mode: "pot0", x: 0.5 }), consigne: "Mode « Potentiométrie i = 0 », x entre 0,4 et 0,6, couple Fe lent." } },
    { id: "lent3q", titre: "Un potentiel mal défini", focus: ["suivi", "ie"], vue: { slider: true, reactions: true, suivi: true, modes: true, schema: true, lent: true, lentChoix: ["fe"], etaSlider: false },
      texte: <>Le segment orangé sur la courbe i = f(E) est la plage de potentiels où |i| &lt; 0,02. La courbe verte pointillée de E = f(x) montre le potentiel que donnerait un couple rapide.</>,
      tache: { type: "qcm", q: "Pourquoi la potentiométrie à i = 0 est-elle mal adaptée à un couple lent ?", options: ["Le courant reste quasi nul sur une large plage de potentiels : le potentiel mesuré n’est plus fixé par la loi de Nernst et n’est pas reproductible", "Le potentiel mesuré est toujours exactement celui de Nernst", "La burette est mal étalonnée"], bonne: 0,
        expl: "Sans courant, l’électrode ne « sent » pas le couple lent : son potentiel dérive vers des valeurs imprévisibles (potentiel mixte). On préfère alors imposer un courant ou une tension." } },
    { id: "choix", titre: "Justifier le choix de la méthode", focus: [],
      texte: <>Vous devez titrer un réducteur dont le couple est <strong>lent</strong> avec un titrant dont le couple est rapide. Les courbes i = f(E) montrent que ce couple ne donne du courant que si l’on impose une surtension.</>,
      tache: { type: "qcm", q: "Quelle méthode est la moins adaptée ?", options: ["La potentiométrie à courant nul", "La potentiométrie à courant imposé", "L’ampérométrie à tension imposée, avec ΔE supérieure à l’écart entre les vagues du couple lent"], bonne: 0,
        expl: "En imposant un courant ou une tension suffisante, on force le passage du courant malgré la lenteur du couple. À i = 0, aucune de ces contraintes ne s’exerce." } },
    { id: "bravo", titre: "Bravo !", focus: [],
      texte: <>Vous savez relier les courbes i = f(E) aux trois méthodes de titrage, et justifier le choix d’un courant ou d’une tension imposés. Retournez en exploration libre pour tester les deux couples lents et toutes les valeurs de ΔE, ou relevez le défi.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(s => s.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  // les éléments de l'interface apparaissent au fur et à mesure du parcours
  const vue = { slider: false, reactions: false, suivi: false, modes: false, schema: false, lent: false, points: etape >= idx("pot0"), ...(et.vue || {}) };
  const fin = (
    <span style={{ display: "flex", gap: 6 }}>
      <button onClick={() => changerMode("explore")} style={styleBouton(true, "#334155")}>🔍 Explorer</button>
      <button onClick={() => changerMode("defi")} style={styleBouton(true, "#0ea5e9")}>🎯 Défi</button>
    </span>
  );
  return (
    <div className="el-l1">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <VueElectro plotlyReady={plotlyReady} e={e} set={set} opts={vue} focus={et.focus}/>
        {etape >= idx("hypo") && <HypothesesElectro defaut={et.focus.includes("hypo")} focus={et.focus.includes("hypo")} key={String(et.focus.includes("hypo"))}/>}
      </div>
      <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={fin}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  DÉFI : lire des courbes i = f(E) inconnues / choisir une méthode
// ════════════════════════════════════════════════════════════════
const alea = (a, b) => a + Math.random() * (b - a);
const choix = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function campagneLecture() {
  const apres = Math.random() < 0.4;
  const x = apres ? choix([1.25, 1.5, 1.75]) : choix([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]);
  const CFe = choix([0.05, 0.1, 0.2]), VFe = choix([10, 20, 25]), CCe = choix([0.05, 0.1, 0.2]);
  return { type: "lecture", x, apres, CFe, VFe, CCe, Veq: CFe * VFe / CCe, reps: {}, choix: {}, verifie: false };
}
// ΔE valides : courant notable avant et après l'équivalence, nul à l'équivalence
const SCENARIOS = {
  aucun: { eta: 0.25, cand: [10, 100, 800, 1200] },
  fe2: { lent: "fe", eta: 0.2, cand: [100, 300, 500, 800] },
  fe3: { lent: "fe", eta: 0.3, cand: [100, 300, 600, 1000] },
};
export function deltaValide(sc, dMV) {
  const M = creerModele(sc.lent || "aucun", sc.eta), d = dMV / 1000;
  const i = xv => (M.findIforDeltaE(xv, d) || { ia: 0 }).ia;
  return i(0.5) >= 0.15 && i(1.5) >= 0.15 && i(1) <= 0.02;
}
function campagneProtocole() {
  const cle = choix(Object.keys(SCENARIOS)), sc = SCENARIOS[cle];
  return { type: "protocole", cle, sc, reps: {}, choix: {}, verifie: false, vue: { ...ETAT_VUE, lent: sc.lent || "aucun", eta: sc.eta, mode: "ampero", x: 0.5, deltaEmV: 100 } };
}

function DefiElectro({ plotlyReady }) {
  const [defi, setDefi] = useState(() => campagneLecture());
  const [e, setE] = useState(() => ({ ...ETAT_VUE, x: defi.x || 0.5 }));
  const nouveau = f => { const d = f(); setDefi(d); setE(d.type === "lecture" ? { ...ETAT_VUE, x: d.x } : d.vue); };
  const maj = f => setDefi(d => ({ ...d, verifie: false, ...f(d) }));
  const set = f => setE(s => ({ ...s, ...f }));
  let Q = [], enonce = null, vueOpts;
  if (defi.type === "lecture") {
    const { x, apres, CFe, VFe, CCe, Veq } = defi, V = x * Veq;
    const r = apres ? x - 1 : x / (1 - x);
    Q = [
      { id: "pos", q: "À quel stade du titrage correspond cette courbe ?", choix: ["Avant l’équivalence", "À l’équivalence", "Après l’équivalence"], vrai: apres ? 2 : 0 },
      apres
        ? { id: "r", q: "Rapport de la hauteur de la vague du Ce⁴⁺ (réduction, vers 1,44 V) à celle de la vague du Ce³⁺ (oxydation)", vrai: r, tol: 0.1, aff: fmt(r, 2) }
        : { id: "r", q: "Rapport de la hauteur du palier de Fe³⁺ (réduction) à celle du palier de Fe²⁺ (oxydation)", vrai: r, tol: 0.1, aff: fmt(r, 2) },
      { id: "x", q: "Avancement x du titrage", vrai: x, tol: 0.06, aff: fmt(x, 2) },
      { id: "V", q: "Volume de solution de Ce⁴⁺ versé", vrai: V, tol: 0.07, aff: fmt(V, 1), u: "mL" },
    ];
    vueOpts = { slider: false, reactions: false, modes: false, lent: false, suivi: false, schema: false, points: false };
    enonce = <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
      On titre {VFe} mL d’une solution de Fe²⁺ à {fmt(CFe, 2)} mol/L par une solution de Ce⁴⁺ à {fmt(CCe, 2)} mol/L. La courbe i = f(E) ci-dessous a été relevée à un certain stade du titrage (x inconnu). Survolez la courbe pour lire les valeurs du courant.
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Indice : les hauteurs de paliers sont proportionnelles aux concentrations.</div>
    </div>;
  } else {
    const sc = defi.sc;
    const [d1, d2, d3, d4] = sc.cand, bon = sc.cand.findIndex(d => deltaValide(sc, d));
    const ordre = defi.ordre || (defi.ordre = melange([0, 1, 2, 3]));
    Q = [
      { id: "pot", q: "La potentiométrie à courant nul permet-elle de suivre ce titrage de façon fiable ?", choix: ["Oui", "Non, le potentiel est mal défini (couple lent)"], vrai: sc.lent ? 1 : 0 },
      { id: "delta", q: "En biampérométrie, quelle tension ΔE imposée convient (courant notable avant et après l’équivalence, nul à l’équivalence) ?", choix: ordre.map(i => `${sc.cand[i]} mV`), vrai: ordre.indexOf(bon) },
      { id: "why", q: "Pourquoi ne faut-il pas choisir une tension beaucoup plus grande ?", choix: ["Le courant ne s’annulerait plus à l’équivalence : la tension suffirait à oxyder Ce³⁺ et réduire Fe³⁺", "Le courant limite de diffusion diminuerait", "Le solvant serait toujours réduit"], vrai: 0 },
    ];
    vueOpts = { slider: true, reactions: true, modes: true, delta: true, lent: true, lentChoix: [], etaSlider: false, suivi: true, schema: false, points: true };
    enonce = <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
      On souhaite suivre le titrage de Fe²⁺ par Ce⁴⁺ avec des électrodes de platine {sc.lent ? <>dans une situation <strong>imaginaire</strong> où le couple Fe³⁺/Fe²⁺ serait <strong>lent</strong> (surtension d’environ {Math.round(sc.eta * 1000)} mV)</> : <>dans le cas où les deux couples sont <strong>rapides</strong></>}.
      Utilisez la simulation (curseur de x, mode de titrage, ΔE) pour choisir la méthode et la tension imposée.
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Dans cette situation, le caractère rapide ou lent du couple est une donnée.</div>
    </div>;
  }
  const juste = q => q.choix ? defi.choix[q.id] === q.vrai : proche(lireNombre(defi.reps[q.id] || ""), q.vrai, q.tol);
  return (
    <div className="el-l1">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => nouveau(campagneLecture)} style={styleBouton(defi.type === "lecture", "#2a9d8f")}>📈 Lire les courbes</button>
          <button onClick={() => nouveau(campagneProtocole)} style={styleBouton(defi.type === "protocole", "#6a4c93")}>🛠️ Choisir la méthode</button>
        </div>
        <div style={styleBoite}>{enonce}</div>
        <VueElectro key={defi.type + (defi.x || defi.cle)} plotlyReady={plotlyReady} e={e} set={set} opts={vueOpts}/>
        <HypothesesElectro/>
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
          <button onClick={() => nouveau(defi.type === "lecture" ? campagneLecture : campagneProtocole)} style={styleBouton(false)}>🔄 Nouvelles données</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIMULATION 3 : trois façons de travailler
// ════════════════════════════════════════════════════════════════
export function Simulation3({ plotlyReady }) {
  const [mode, setMode] = useState("explore");   // on arrive sur l'exploration libre
  useEffect(() => { if (mode === "explore") { const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120); return () => clearTimeout(t); } }, [mode]);
  return (
    <div style={{ ...cardStyle, textAlign: "left" }}>
      <style>{`
        .el-l1 { display: grid; align-items: start; gap: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (max-width: 900px) { .el-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={() => setMode("guide")} style={styleBouton(mode === "guide", ORANGE_GUIDE)}>🧭 Parcours guidé</button>
        <button onClick={() => setMode("explore")} style={styleBouton(mode === "explore", "#334155")}>🔍 Exploration libre</button>
        <button onClick={() => setMode("defi")} style={styleBouton(mode === "defi", "#0ea5e9")}>🎯 Défi</button>
      </div>
      <div style={{ display: mode === "explore" ? "block" : "none" }}><ExplorationElectro plotlyReady={plotlyReady}/></div>
      {mode === "guide" && <ParcoursElectro plotlyReady={plotlyReady} changerMode={setMode}/>}
      {mode === "defi" && <DefiElectro plotlyReady={plotlyReady}/>}
    </div>
  );
}
