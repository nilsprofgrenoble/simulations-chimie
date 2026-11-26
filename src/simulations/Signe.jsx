import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./signeModele";
import { SigneExplore } from "./SigneExplore";
import { QCM } from "./signeQcm";
import { SceneBilan, SvgSigne, SvgEquation, SvgDeltaT, SvgModes, SvgBilanSigne } from "./SigneSchemas";

const SIM_ID = 238, CLE_GUIDE = 'signe-guide-v1';
declarerDefis(SIM_ID, [['bloc', 'Bilan d’énergie d’un bloc'], ['air', 'Changer de système : l’air de la pièce']]);

// ====================================================
//  SIM 238 — CONSERVATION DE L'ÉNERGIE : BILAN ET SIGNE DES TRANSFERTS (TSTL, enseignement PCM, partie « Énergie »).
//  Une seule idée : la variation de l'énergie stockée par un système est la somme algébrique des transferts d'énergie ; un transfert est compté + s'il est reçu, − s'il est cédé,
//  donc son signe dépend du système choisi. Puissance d'un transfert P = |E| ÷ Δt ; ΔU = m·c·ΔT (relation donnée).
//  Aucune situation du Moodle : batterie, résistance chauffante dans un bloc de cuivre, air de la pièce (valeurs inventées).
//  Capacités visées (jamais affichées) : distinguer, dans un bilan d'énergie, la variation de l'énergie du système et les transferts d'énergie (travail, transfert thermique) ; algébriser les transferts ; exploiter la conservation de l'énergie.
//  Modèle : signeModele.js (test node). QCM : signeQcm.js. Schémas : SigneSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '') + nbf(Math.abs(v), 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + `${NB}J`;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', violet: '#6d28d9' };
const P = M.PARCOURS;

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);

// ====================================================
export function SimulationSigne() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('bloc');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ sys: 'bloc', W: 800, f: 0.5, dt: 40 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['origine', 'modes', 'sens', 'signe', 'autre', 'bilan', 'sensvar', 'deltaT', 'regime', 'puissance', 'total', 'fin'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];

  const ETAPES = [
    { id: 'origine', titre: 'Qu’est-ce qui fait varier l’énergie ?', focus: ['scene'],
      texte: <>Une <strong>batterie</strong> alimente une résistance chauffante placée dans un <strong>bloc de cuivre</strong>. Le bloc s’échauffe : l’énergie qu’il stocke (son <strong>énergie interne</strong>) augmente. Il cède aussi de la chaleur à l’<strong>air de la pièce</strong>. Selon le principe de <strong>conservation de l’énergie</strong>, l’énergie stockée par un système ne varie que par des échanges avec d’autres systèmes.</>,
      tache: { type: 'qcm', q: 'D’où vient l’augmentation de l’énergie interne du bloc ?', ...QCM.origine,
        expl: 'L’énergie se conserve : si l’énergie stockée par un système varie, cela résulte uniquement de transferts entre lui et les autres systèmes. Ici, le bloc reçoit un travail électrique de la batterie.', indice: 'Peut-on créer de l’énergie à partir de rien ? Que dit la conservation de l’énergie sur l’origine d’une variation ?' } },
    { id: 'modes', titre: 'Deux modes de transfert', focus: ['scene'],
      texte: <>Un système échange de l’énergie avec l’extérieur de deux façons : par <strong>travail</strong>, noté <strong>W</strong> (force, courant électrique), ou par <strong>transfert thermique</strong>, noté <strong>Q</strong> (conduction, convection, rayonnement). Ils se mesurent en joules (J). Sur le schéma, les flèches ont une épaisseur proportionnelle à l’énergie transférée.</>,
      tache: { type: 'qcm', q: 'Comment la batterie transfère-t-elle de l’énergie au bloc ?', ...QCM.mode,
        expl: 'Un courant électrique circule dans la résistance : la batterie cède de l’énergie au bloc par travail électrique W. L’énergie cédée par le bloc à l’air plus froid est, elle, un transfert thermique Q.', indice: 'Quel phénomène assure le transfert d’énergie entre un générateur et un récepteur électrique ?' } },
    { id: 'sens', titre: 'Dans quel sens ?', focus: ['scene'],
      texte: <>Le bloc de cuivre est plus chaud que l’air de la pièce. Le transfert thermique entre les deux systèmes se fait toujours spontanément du corps le plus chaud vers le corps le plus froid.</>,
      tache: { type: 'qcm', q: 'Dans quel sens va le transfert thermique Q entre le bloc et l’air ?', ...QCM.sens,
        expl: 'Le transfert thermique va du système le plus chaud (le bloc) vers le plus froid (l’air) : le bloc cède de l’énergie, l’air en reçoit.', indice: 'Entre deux corps de températures différentes, dans quel sens la chaleur se propage-t-elle spontanément ?' } },
    { id: 'signe', titre: 'Le signe d’un transfert', focus: ['scene', 'mesures'],
      texte: <>Une énergie transférée est une <strong>valeur algébrique</strong> : on la compte <strong>positivement</strong> si le système l’<strong>reçoit</strong>, <strong>négativement</strong> s’il la <strong>cède</strong>. Le bloc cède à l’air un transfert thermique de valeur absolue <strong>|Q| = {P.Q} J</strong>. On étudie le système « le bloc de cuivre ».</>,
      tache: { type: 'num', q: 'Valeur algébrique de Q pour le bloc, en joules (J)', unite: 'J', vrai: -P.Q, tol: 0.02, affiche: v => String(Math.round(v)).replace('-', '−'), cs: 3,
        pieges: [[P.Q, 'Le bloc cède cette énergie à l’air : un transfert cédé par le système est compté négativement.']],
        calcul: () => [`le bloc cède ${P.Q} J : Q = −${P.Q} J.`],
        expl: `Le bloc cède de l’énergie : Q = −${P.Q} J.`, indice: 'Reçu : signe +. Cédé : signe −. Le bloc reçoit-il ou cède-t-il ce transfert thermique ?' } },
    { id: 'autre', titre: 'Le signe dépend du système', focus: ['scene'],
      retenirTitre: 'À retenir : le signe d’un transfert',
      retenir: <>
        <SvgSigne/>
        <ul style={puces}>
          <li>Un transfert est <strong>positif</strong> pour le système qui le <strong>reçoit</strong>, <strong>négatif</strong> pour celui qui le <strong>cède</strong>.</li>
          <li>Exemple : 500 J du corps chaud au corps froid : Q = −500 J pour le chaud, Q = +500 J pour le froid.</li>
          <li>Moyen de s’en souvenir : <strong>« reçu +, cédé −, selon le système »</strong>.</li>
        </ul></>,
      texte: <>Le même transfert thermique de {P.Q} J va du bloc vers l’air. Pour le bloc, on a trouvé Q = −{P.Q} J. On étudie maintenant le système « <strong>l’air de la pièce</strong> » : c’est lui qui reçoit ce transfert.</>,
      tache: { type: 'qcm', q: 'Quelle est la valeur algébrique de ce transfert thermique pour l’air ?', ...QCM.autre,
        expl: `Le transfert vaut ${P.Q} J en valeur absolue ; l’air le reçoit : il est compté positivement, +${P.Q} J. Le signe dépend du système étudié.`, indice: 'L’air reçoit-il ou cède-t-il cette énergie ? Reçu : +, cédé : −.' } },
    { id: 'bilan', titre: 'Le bilan d’énergie', focus: ['scene', 'mesures'],
      texte: <>Pour un système, la <strong>variation de l’énergie stockée ΔE</strong> est égale à la <strong>somme algébrique des transferts</strong> : ΔE = W + Q + … On étudie le bloc de cuivre : il reçoit le travail électrique <strong>W = +{P.W} J</strong> et cède le transfert thermique <strong>Q = −{P.Q} J</strong>. Son énergie stockée est de l’énergie interne : on note ΔU sa variation.</>,
      tache: { type: 'num', q: 'Variation d’énergie interne ΔU du bloc, en joules (J)', unite: 'J', vrai: P.W - P.Q, tol: 0.02, affiche: v => String(Math.round(v)), cs: 3,
        pieges: [[P.W + P.Q, 'Q est négatif pour le bloc (il cède de l’énergie) : il faut soustraire |Q| et non l’ajouter.'], [P.W, 'Il faut aussi tenir compte du transfert thermique cédé à l’air.'], [-(P.W - P.Q), 'Le signe est inversé : le bloc reçoit plus qu’il ne cède, ΔU est positive.']],
        calcul: () => [`ΔU = W + Q = (+${P.W}) + (−${P.Q}) = +${P.W - P.Q} J.`],
        expl: `ΔU = +${P.W} − ${P.Q} = +${P.W - P.Q} J.`, indice: 'ΔU = somme algébrique des transferts : travail reçu (+) et transfert thermique cédé (−).' } },
    { id: 'sensvar', titre: 'Que devient la température ?', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : l’équation de conservation',
      retenir: <>
        <SvgEquation/>
        <ul style={puces}>
          <li>La variation de l’énergie stockée est la <strong>somme algébrique des transferts</strong> : ΔE = W + Q + …</li>
          <li>Exemple : +200 J reçus et −50 J cédés donnent ΔE = +150 J : l’énergie stockée augmente.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui rentre moins ce qui sort »</strong>.</li>
        </ul></>,
      texte: <>Vous avez trouvé <strong>ΔU = +{P.W - P.Q} J</strong> pour le bloc de cuivre. On suppose qu’il n’y a pas de changement d’état.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de la température du bloc ?', ...QCM.sensvar,
        expl: 'Pour un solide sans changement d’état, l’énergie interne augmente quand la température augmente : ΔU > 0 signifie que la température du bloc monte.', indice: 'Pour un système sans changement d’état, une énergie interne qui augmente correspond à une température qui…' } },
    { id: 'deltaT', titre: 'De l’énergie à la température', focus: ['scene', 'mesures'],
      texte: <>Pour un système sans changement d’état, la variation d’énergie interne est liée à la variation de température par <strong>ΔU = m × c × ΔT</strong>, avec la masse <strong>m</strong> en kg, la <strong>capacité thermique massique c</strong> en J·kg⁻¹·K⁻¹ et ΔT en kelvins. Pour le bloc de cuivre : <strong>m = {nbf(M.MASSE, 2)} kg</strong>, <strong>c = {M.CAPA} J·kg⁻¹·K⁻¹</strong> et <strong>ΔU = +{P.dU} J</strong>.</>,
      tache: { type: 'num', q: 'Variation de température ΔT du bloc, en kelvins (K)', unite: 'K', vrai: P.dT, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.dU / M.MASSE, 'Il faut aussi diviser par la capacité thermique massique c.'], [P.dU / M.CAPA, 'Il faut aussi diviser par la masse m du bloc.'], [P.dU * M.MASSE * M.CAPA, 'Il faut diviser ΔU par m × c, pas le multiplier.']],
        calcul: () => [`ΔU = m × c × ΔT, donc ΔT = ΔU ÷ (m × c) = ${P.dU} ÷ (${nbf(M.MASSE, 2)} × ${M.CAPA}) = ${nbf(P.dT, 1)} K.`],
        expl: `ΔT = ${P.dU} ÷ (${nbf(M.MASSE, 2)} × ${M.CAPA}) = ${nbf(P.dT, 1)} K.`, indice: 'Isolez ΔT : ΔT = ΔU ÷ (m × c).' } },
    { id: 'regime', titre: 'Température constante', focus: ['scene'],
      retenirTitre: 'À retenir : de l’énergie à la température',
      retenir: <>
        <SvgDeltaT/>
        <ul style={puces}>
          <li>Sans changement d’état : <strong>ΔU = m × c × ΔT</strong>. ΔU positive : la température monte ; ΔU négative : elle baisse.</li>
          <li>Exemple : 0,10 kg d’eau, ΔT = +2 K : ΔU = 0,10 × 4180 × 2 ≈ 840 J.</li>
          <li>Moyen de s’en souvenir : <strong>« ΔU et ΔT ont le même signe »</strong>.</li>
        </ul></>,
      texte: <>Après un long moment, la température du bloc se stabilise : le bloc reçoit toujours le travail électrique <strong>W = +{P.W} J</strong> (pendant une certaine durée) mais il cède maintenant à l’air un transfert thermique <strong>|Q| = {P.W} J</strong>, de même valeur.</>,
      tache: { type: 'qcm', q: 'Que fait l’énergie interne du bloc ?', ...QCM.regime,
        expl: 'ΔU = W + Q = (+800) + (−800) = 0 : l’énergie interne ne varie pas, donc la température reste constante, même si le bloc continue de recevoir du travail.', indice: 'Calculez la somme algébrique des deux transferts : W + Q.' } },
    { id: 'puissance', titre: 'La puissance d’un transfert', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : travail, transfert thermique et puissance',
      retenir: <>
        <SvgModes/>
        <ul style={puces}>
          <li>Deux modes de transfert : le <strong>travail W</strong> et le <strong>transfert thermique Q</strong>. La puissance d’un transfert est <strong>P = |E| ÷ Δt</strong>, en watts.</li>
          <li>Exemple : 600 J transférés en 20 s donnent P = 30 W.</li>
          <li>Moyen de s’en souvenir : <strong>« la puissance est toujours positive »</strong>.</li>
        </ul></>,
      texte: <>La <strong>puissance</strong> d’un transfert est l’énergie transférée par unité de temps, en valeur absolue : <strong>P = |Q| ÷ Δt</strong>, avec Δt en secondes. Le bloc cède à l’air un transfert thermique de valeur absolue <strong>|Q| = {P.Q} J</strong> en <strong>Δt = {P.dt} s</strong>.</>,
      tache: { type: 'num', q: 'Puissance du transfert thermique, en watts (W)', unite: 'W', vrai: P.Q / P.dt, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.Q * P.dt, 'Il faut diviser l’énergie par la durée, pas la multiplier.'], [-P.Q / P.dt, 'Une puissance est positive : on utilise la valeur absolue de l’énergie transférée.']],
        calcul: () => [`P = |Q| ÷ Δt = ${P.Q} ÷ ${P.dt} = ${nbf(P.Q / P.dt, 1)} W.`],
        expl: `P = ${P.Q} ÷ ${P.dt} = ${nbf(P.Q / P.dt, 1)} W.`, indice: 'P = |Q| ÷ Δt, avec |Q| en joules et Δt en secondes.' } },
    { id: 'total', titre: 'Tous les systèmes ensemble', focus: ['scene'],
      texte: <>Revenons à la situation du début : la batterie cède <strong>{P.W} J</strong> par travail électrique, le bloc cède <strong>{P.Q} J</strong> à l’air. Pour chaque système, ΔE est la somme algébrique de ses transferts : <strong>batterie −{P.W} J</strong>, <strong>bloc +{P.dU} J</strong>, <strong>air +{P.Q} J</strong>.</>,
      tache: { type: 'qcm', q: 'Que vaut la somme des trois variations d’énergie stockée ?', ...QCM.total,
        expl: `−${P.W} + ${P.dU} + ${P.Q} = 0 : l’énergie se conserve ; l’énergie perdue par la batterie est gagnée par le bloc et par l’air.`, indice: `Additionnez −${P.W}, +${P.dU} et +${P.Q}.` } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : bilan',
      retenir: <>
        <SvgBilanSigne/>
        <ul style={puces}>
          <li><strong>ΔE = W + Q + …</strong> : somme algébrique des transferts, reçu +, cédé −, selon le système choisi.</li>
          <li>Exemple : −600 J, +400 J et +200 J : la somme est nulle, l’énergie se conserve.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qu’un système perd, un autre le gagne »</strong>.</li>
        </ul></>,
      texte: <>Vous savez que la variation d’énergie stockée d’un système est la somme algébrique des transferts, que le signe dépend du système choisi, qu’une température constante correspond à ΔU = 0, et que ΔU = m·c·ΔT. Explorez en changeant de système, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- scène du parcours ----------
  const sceneGuide = (() => {
    if (idEtape === 'regime') return { W: P.W, Q: P.W, sel: null, vals: false };
    if (idEtape === 'signe') return { W: P.W, Q: P.Q, sel: 'bloc', vals: false };
    if (idEtape === 'autre') return { W: P.W, Q: P.Q, sel: 'air', vals: false };
    if (idEtape === 'bilan' || idEtape === 'sensvar' || idEtape === 'deltaT') return { W: P.W, Q: P.Q, sel: 'bloc', vals: false };
    if (idEtape === 'fin') return { W: P.W, Q: P.Q, sel: 'bloc', vals: true };
    return { W: P.W, Q: P.Q, sel: null, vals: false };
  })();

  // ---------- exploration ----------
  const Q = ti.f * ti.W, trs = M.transferts(ti.sys, ti.W, ti.f), dE = M.somme(ti.sys, ti.W, ti.f), sysX = M.SYSTEMES.find(s => s.id === ti.sys);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'bloc' ? { ...M.tirageDefiA(), reps: { u: '', t: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { s: '', p: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'bloc') {
      const u = lireNombre(defi.reps.u), t = lireNombre(defi.reps.t);
      const okU = isFinite(u) && proche(u, defi.dU, 0.03), okT = isFinite(t) && proche(t, defi.dT, 0.06);
      setDefi(x => ({ ...x, verifie: true, ok: okU && okT, okU, okT })); noterA(okU && okT);
    } else {
      const s = lireNombre(defi.reps.s), p = lireNombre(defi.reps.p);
      const okS = isFinite(s) && proche(s, defi.somme, 0.03), okP = isFinite(p) && proche(p, defi.P, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok: okS && okP, okS, okP })); noterB(okS && okP);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('sgn-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  const diagnosticA = () => {
    const x = defi, msgs = [], u = lireNombre(x.reps.u), t = lireNombre(x.reps.t);
    if (!isFinite(u)) msgs.push('Variation d’énergie interne : écrivez un nombre (virgule ou point).');
    else if (!x.okU) {
      if (proche(u, x.W + x.Q, 0.03)) msgs.push('Variation d’énergie interne : le transfert thermique est cédé par le bloc, donc négatif : ΔU = W − |Q| et non W + |Q|.');
      else if (proche(u, x.W, 0.03)) msgs.push('Variation d’énergie interne : il faut aussi tenir compte du transfert thermique cédé à l’air.');
      else if (proche(u, -x.dU, 0.03)) msgs.push('Variation d’énergie interne : le signe est inversé : le bloc reçoit plus qu’il ne cède, ΔU est positive.');
      else if (proche(u, x.Q, 0.03)) msgs.push('Variation d’énergie interne : cette valeur est le transfert thermique cédé ; ΔU est la somme algébrique du travail reçu et de ce transfert.');
      else msgs.push(`Variation d’énergie interne : ΔU = W + Q = (+${x.W}) + (−${x.Q}) en joules. Votre valeur est ${u > x.dU ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(t)) msgs.push('Variation de température : écrivez un nombre (virgule ou point).');
    else if (!x.okT) {
      if (proche(t, x.dU / x.m, 0.06)) msgs.push('Variation de température : il faut aussi diviser par la capacité thermique massique c.');
      else if (proche(t, x.dU / x.c, 0.06)) msgs.push('Variation de température : il faut aussi diviser par la masse m du bloc.');
      else if (proche(t, (x.W + x.Q) / (x.m * x.c), 0.06)) msgs.push('Variation de température : votre calcul utilise W + |Q| ; le transfert thermique cédé se soustrait.');
      else if (isFinite(u) && !x.okU && proche(t, u / (x.m * x.c), 0.06)) msgs.push('Variation de température : votre calcul est cohérent avec votre ΔU, mais celui-ci n’est pas le bon.');
      else msgs.push(`Variation de température : ΔT = ΔU ÷ (m × c) = ${x.dU} ÷ (${nbf(x.m, 2)} × ${x.c}), en K. Votre valeur est ${t > x.dT ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, msgs = [], s = lireNombre(x.reps.s), p = lireNombre(x.reps.p);
    if (!isFinite(s)) msgs.push('Transfert reçu par l’air : écrivez un nombre (virgule ou point).');
    else if (!x.okS) {
      if (proche(s, -x.Q, 0.03)) msgs.push('Transfert reçu par l’air : l’air reçoit cette énergie, donc le transfert est positif pour lui (le signe négatif était celui du bloc).');
      else msgs.push(`Transfert reçu par l’air : le bloc cède ${x.Q} J, l’air les reçoit : Q = +${x.Q} J. Votre valeur est ${s > x.somme ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(p)) msgs.push('Puissance : écrivez un nombre (virgule ou point).');
    else if (!x.okP) {
      if (proche(p, x.Q * x.dt, 0.05)) msgs.push('Puissance : il faut diviser l’énergie par la durée, pas la multiplier.');
      else if (proche(p, -x.P, 0.05)) msgs.push('Puissance : une puissance est positive : on utilise la valeur absolue de l’énergie transférée.');
      else if (proche(p, x.Q / (x.dt / 60), 0.05)) msgs.push('Puissance : la durée doit être en secondes (elle est donnée en secondes, ne la convertissez pas).');
      else msgs.push(`Puissance : P = |Q| ÷ Δt = ${x.Q} ÷ ${x.dt}, en W. Votre valeur est ${p > x.P ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'bloc'
    ? `ΔU = W + Q = (+${defi.W}) + (−${defi.Q}) = +${defi.dU} J (le bloc reçoit W et cède Q). ΔT = ΔU ÷ (m × c) = ${defi.dU} ÷ (${nbf(defi.m, 2)} × ${defi.c}) ≈ ${fmt2(defi.dT)} K. Une erreur fréquente : ajouter |Q| au lieu de le soustraire.`
    : `Le bloc cède ${defi.Q} J : pour l’air, qui les reçoit, le transfert est positif : Q = +${defi.Q} J. Puissance : P = |Q| ÷ Δt = ${defi.Q} ÷ ${defi.dt} ≈ ${fmt2(defi.P)} W.`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['bloc', 'Bilan d’énergie d’un bloc'], ['air', 'Changer de système']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'bloc' ? 'Défi : bilan d’énergie d’un bloc' : 'Défi : changer de système'}</div>
      {defi.type === 'bloc' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un bloc de cuivre de masse <strong>{nbf(defi.m, 2)} kg</strong> reçoit un travail électrique <strong>W = +{defi.W} J</strong> et cède à l’air un transfert thermique de valeur absolue <strong>{defi.Q} J</strong>. Capacité thermique massique du cuivre : <strong>c = {defi.c} J·kg⁻¹·K⁻¹</strong> (pas de changement d’état). Calculez la <strong>variation d’énergie interne ΔU</strong> (en J) et la <strong>variation de température ΔT</strong> (en K). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>ΔU (J) =</span>{champ('u', 'Variation d’énergie interne en joules', defi.verifie && defi.okU)}
          <span>ΔT (K) =</span>{champ('t', 'Variation de température en kelvins', defi.verifie && defi.okT)}
        </div>
        <IndiceDefi cache={false}>ΔU = somme algébrique des transferts : travail reçu (+) et transfert thermique cédé (−). Puis ΔU = m × c × ΔT, donc ΔT = ΔU ÷ (m × c).</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un bloc de cuivre cède à l’air de la pièce un transfert thermique de valeur absolue <strong>{defi.Q} J</strong>, en <strong>{defi.dt} s</strong>. On étudie le système <strong>« l’air de la pièce »</strong>. Donnez la <strong>valeur algébrique du transfert thermique</strong> qu’il reçoit (en J, avec son signe) et la <strong>puissance</strong> de ce transfert (en W). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Q (J) =</span>{champ('s', 'Transfert thermique reçu par l’air en joules, avec son signe', defi.verifie && defi.okS)}
          <span>P (W) =</span>{champ('p', 'Puissance du transfert en watts', defi.verifie && defi.okP)}
        </div>
        <IndiceDefi cache={false}>Reçu par le système : signe +. Cédé : signe −. La puissance est P = |Q| ÷ Δt, toujours positive, avec Δt en secondes.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="sgn-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'bloc' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Trois systèmes</strong> seulement : la batterie, le bloc de cuivre et l’air de la pièce. On ne considère que le travail électrique W et le transfert thermique Q entre eux.</li>
      <li><strong>Le travail électrique est cédé par la batterie</strong> puis reçu en totalité par le bloc ; la part de W cédée ensuite à l’air est choisie par l’utilisateur.</li>
      <li><strong>Pas de changement d’état</strong> : ΔU = m × c × ΔT, avec m et c constants (bloc de cuivre de 0,50 kg, c = 385 J·kg⁻¹·K⁻¹).</li>
      <li><strong>Pas de calcul de la température de l’air ni de l’état de la batterie</strong> : on ne donne que le sens de variation de leur énergie stockée.</li>
      <li><strong>Convention</strong> : un transfert est positif s’il est reçu par le système étudié, négatif s’il est cédé.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (travail, part cédée, durées) : ce ne sont pas des mesures.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const sceneProps = enExplore ? { W: ti.W, Q, sel: ti.sys, vals: true } : sceneGuide;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Trois systèmes qui échangent de l’énergie' : 'Une batterie, un bloc de cuivre, l’air'}</div>
      <SceneBilan {...sceneProps}/>
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="sgn-s" label="Système étudié" valeur={ti.sys} onChange={v => setTi(s => ({ ...s, sys: v }))} options={M.SYSTEMES.map(s => [s.id, s.nom.charAt(0).toUpperCase() + s.nom.slice(1)])}/>
      <Sel id="sgn-w" label="Travail électrique cédé par la batterie" valeur={ti.W} onChange={v => setTi(s => ({ ...s, W: Number(v) }))} options={M.W_VALEURS.map(v => [v, `${v} J`])}/>
      <Sel id="sgn-f" label="Part de ce travail cédée à l’air par le bloc" valeur={ti.f} onChange={v => setTi(s => ({ ...s, f: Number(v) }))} options={M.F_VALEURS.map(v => [v, `${Math.round(100 * v)} %`])}/>
      <Sel id="sgn-t" label="Durée" valeur={ti.dt} onChange={v => setTi(s => ({ ...s, dt: Number(v) }))} options={[10, 20, 40, 60].map(v => [v, `${v} s`])}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Changez de système : les flèches reçues deviennent vertes, les flèches cédées rouges, et les signes changent. La batterie, le bloc et l’air échangent la même énergie.</div>
    </div>);
  const mesures = (enExplore || (enGuide && deja('signe'))) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? `Bilan pour ${sysX.nom}` : 'Valeurs de la situation'}</div>
      {enExplore ? <>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Transferts avec leur signe (système étudié : {sysX.nom}), pendant {ti.dt} s.</div>
        {trs.map((t, i) => <LigneMesure key={i} nom={`${t.type === 'W' ? 'Travail' : 'Transfert thermique'} (${t.val > 0 ? 'reçu' : t.val < 0 ? 'cédé' : 'nul'})`} valeur={t.val === 0 ? `0${NB}J` : sg(t.val)} couleur={t.val > 0 ? COL.vert : t.val < 0 ? COL.rouge : COL.gris}/>)}
        <LigneMesure nom="Somme = variation de l’énergie stockée ΔE" valeur={dE === 0 ? `0${NB}J` : sg(dE)} couleur={COL.violet}/>
        <LigneMesure nom={`Énergie stockée (${sysX.stocke})`} valeur={M.sens(dE)}/>
        {ti.sys === 'bloc' && <LigneMesure nom="Variation de température ΔT du bloc" valeur={`${dE >= 0 ? '+' : '−'}${nbf(Math.abs(M.deltaT(dE)), 1)}${NB}K`}/>}
        {trs.map((t, i) => <LigneMesure key={`p${i}`} nom={`Puissance du ${t.type === 'W' ? 'travail' : 'transfert thermique'}`} valeur={`${nbf(M.puissance(t.val, ti.dt), 1)}${NB}W`}/>)}
      </> : <>
        {deja('bilan') && <LigneMesure nom="Travail électrique reçu par le bloc" valeur={`W = +${P.W}${NB}J`} couleur={COL.vert}/>}
        <LigneMesure nom="Transfert thermique cédé par le bloc" valeur={`|Q| = ${P.Q}${NB}J`} couleur={COL.rouge}/>
        {deja('deltaT') && <LigneMesure nom="Bloc de cuivre" valeur={`${nbf(M.MASSE, 2)}${NB}kg ; c = ${M.CAPA}`}/>}
        {deja('puissance') && <LigneMesure nom="Durée du transfert" valeur={`Δt = ${P.dt}${NB}s`}/>}
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Étudiez « le bloc », puis « l’air de la pièce », puis « la batterie » sans changer les autres réglages : que remarquez-vous sur les signes de W et de Q ?</li>
      <li>Réglez la part cédée à l’air sur 100 % : que devient l’énergie stockée par le bloc ? Et sa température ?</li>
      <li>Réglez la part cédée sur 0 % : que devient l’énergie stockée par l’air ?</li>
      <li>Pour un même réglage, additionnez la variation d’énergie stockée de la batterie, du bloc et de l’air. Que trouvez-vous, quelle que soit la combinaison ?</li>
      <li>Doublez la durée : quelles grandeurs changent, lesquelles ne changent pas (énergies, puissances) ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>La variation d’énergie stockée est la somme algébrique des transferts : ΔE = W + Q + …</li>
        <li>Reçu : signe +. Cédé : signe −. Le signe dépend du système étudié.</li>
        <li>La somme des ΔE de tous les systèmes qui échangent est nulle : l’énergie se conserve</li>
        <li>Sans changement d’état : ΔU = m × c × ΔT ; ΔU = 0 correspond à une température constante</li>
        <li>Puissance d’un transfert : P = |E| ÷ Δt, toujours positive</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sgn-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sgn-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sgn-col { display: flex; flex-direction: column; gap: 12px; }
        .sgn-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .sgn-l1.cote .sgn-carte { order: 2; } .sgn-l1.cote .sgn-main { order: 1; }
          .sgn-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .sgn-ex > * { grid-column: 1; }
          .sgn-ex > .sgn-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .sgn-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sgn-in { animation: sgn-fondu 0.35s ease-out; } @keyframes sgn-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Conservation de l’énergie : bilan et signe des transferts</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>L’énergie stockée par un système ne varie que par des <strong>transferts</strong> : sa variation est leur <strong>somme algébrique</strong>. Un transfert est <strong>positif</strong> s’il est reçu, <strong>négatif</strong> s’il est cédé : le signe dépend du système étudié.</div>
      {!enExplore && <div className={`sgn-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="sgn-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="sgn-carte">{panneauHypo}</div>}
        <div className="sgn-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'bloc' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="sgn-col">
            <div className="sgn-in">{scene}</div>
            {mesures && <div className="sgn-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <SigneExplore ti={ti} setTi={setTi}/>
        <div style={{ margin: '12px 0' }}>
          <Section titre={`Réglages précis et mesures : ${sysX.nom} · W = ${ti.W} J · ${Math.round(100 * ti.f)} % cédé à l’air`} ouvert={!!ouv.precis} onBascule={() => bascule('precis')}>
            <div className="sgn-ex">
              {scene}
              <div className="sgn-reg">{reglages}</div>
              {mesures}
            </div>
          </Section>
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
