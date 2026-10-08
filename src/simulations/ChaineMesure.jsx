import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, fmt, lireNombre, proche } from "../commun";

// ── Modèle (fonctions pures) ──
// Caractéristique de la photorésistance : points de mesure (éclairement en lx, résistance en Ω).
// Hypothèse : entre deux points, interpolation linéaire en échelle log-log (ln Rp en fonction de ln E) ;
// au-dessous de 11 lx et au-dessus de 1590 lx, on garde la valeur du point extrême (pas de mesure).
const DONNEES_RP = [[11, 5600], [70, 2500], [200, 1540], [360, 1210], [470, 1010], [680, 790], [880, 581], [1050, 387], [1590, 346]];
export const rpDe = e => {
  if (e <= DONNEES_RP[0][0]) return DONNEES_RP[0][1];
  const dernier = DONNEES_RP[DONNEES_RP.length - 1];
  if (e >= dernier[0]) return dernier[1];
  for (let i = 0; i < DONNEES_RP.length - 1; i++) {
    const [e1, r1] = DONNEES_RP[i], [e2, r2] = DONNEES_RP[i + 1];
    if (e >= e1 && e <= e2) {
      const t = (Math.log(e) - Math.log(e1)) / (Math.log(e2) - Math.log(e1));
      return Math.round(Math.exp(Math.log(r1) + (Math.log(r2) - Math.log(r1)) * t));
    }
  }
  return dernier[1];
};
// Pont diviseur alimenté en 5 V, tension prise aux bornes de R (la photorésistance est côté 5 V)
const urDe = (Rp, R) => 5 * R / (Rp + R);
// CAN idéal à n bits, référence 5 V : N = partie entière de Ur / 5 × (2ⁿ − 1)
const nDe = (Ur, bits) => Math.floor(Ur / 5 * (Math.pow(2, bits) - 1) + 1e-9);
const SEUIL_BAS = 393, SEUIL_HAUT = 491;   // valeurs par défaut de l'algorithme (10 bits)
const PRESETS_E = [12, 70, 200, 470, 1050, 1500];

// ============================================================
//  SIMULATION 8 — Chaîne de mesure / capteur de lumière
// ============================================================

export function Simulation8({ plotlyReady }) {
  const [mode, setMode] = useState('explore');             // on arrive sur l'exploration libre
  const [guide, setGuide] = useEtatPersistant('cm-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const enGuide = mode === 'guide';
  const [E, setE]                   = useState(500);
  const [bits, setBits]             = useState(10);
  const [R, setR]                   = useState(1000);
  const [activeBlock, setActiveBlock] = useState("capteur");
  const [pharesOn, setPharesOn]     = useState(false);
  const [pharesEtat, setPharesEtat] = useState("OFF");
  const [canInput, setCanInput]     = useState("Ur");
  const [algoN1, setAlgoN1]         = useState(SEUIL_BAS);
  const [algoEtat1, setAlgoEtat1]   = useState("HIGH");
  const [algoN2, setAlgoN2]         = useState(SEUIL_HAUT);
  const [algoEtat2, setAlgoEtat2]   = useState("LOW");

  const plotRef = useRef(null);

  const calcRp = rpDe;

  // ── Calculs chaîne ──
  const Rp   = calcRp(E);
  const Ur   = urDe(Rp, R);
  const Nmax = Math.pow(2, bits) - 1;
  const N    = nDe(Ur, bits);

  // ── Valeurs CAN ──
  const canMax    = canInput==="Ur" ? 5 : canInput==="Rp" ? 10000 : 1500;
  const canUnite  = canInput==="Ur" ? "V" : canInput==="Rp" ? "Ω" : "lx";
  const canValReel = canInput==="Ur" ? Ur : canInput==="Rp" ? Rp : E;
  const canVal5V   = canInput==="Ur" ? Ur : canInput==="Rp" ? Rp/10000*5 : E/1500*5;
  const NcanVal    = Math.floor(canVal5V / 5 * Nmax + 1e-9);
  const quantum    = canMax / Nmax;

  // ── Algorithme phares ──
  useEffect(() => {
    if (!pharesOn) { setPharesEtat("OFF"); return; }
    if (N < algoN1) {
      setPharesEtat(algoEtat1 === "HIGH" ? "ON" : "OFF");
    } else if (N > algoN2) {
      setPharesEtat(algoEtat2 === "HIGH" ? "ON" : "OFF");
    }
    // Entre les deux seuils : l'état reste inchangé (mémoire)
  }, [N, pharesOn, algoN1, algoN2, algoEtat1, algoEtat2]);

  const ledOn = pharesOn && pharesEtat === "ON";

  // ── Animation soleil ──
  const nuagePct      = 1 - Math.min(E, 1500) / 1500;
  const soleilOpacity = E < 10 ? 0 : 0.3 + (1-nuagePct)*0.7;
  const cielColor     = E < 10
    ? "#0a0a2e"
    : `rgb(${Math.round(55+(1-nuagePct)*80)},${Math.round(100+(1-nuagePct)*80)},${Math.round(180+(1-nuagePct)*40)})`;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const R0 = 1000, B0 = 10;                                   // scénario du parcours : R = 1000 Ω, CAN 10 bits
  const Rp200 = rpDe(200), Ur200 = urDe(Rp200, R0), N200 = nDe(Ur200, B0), q10 = 5000 / (Math.pow(2, B0) - 1);
  const Rp70 = rpDe(70), N70 = nDe(urDe(Rp70, R0), B0), Rp470 = rpDe(470), N470 = nDe(urDe(Rp470, R0), B0);
  const reglage200 = E === 200 && R === R0 && bits === B0;
  const ETAPES = [
    { id: 'chaine', titre: 'La chaîne de mesure', focus: ['source', 'capteur', 'conditionneur', 'can', 'arduino'], bloc: 'capteur',
      texte: <>Une voiture allume ses phares quand il fait sombre. Pour cela, une carte Arduino traite une mesure d'éclairement : <strong>capteur</strong> (photorésistance), <strong>conditionneur</strong> (pont diviseur),
        <strong> convertisseur analogique-numérique</strong> (CAN), puis <strong>traitement</strong> (algorithme). Chaque maillon transforme la grandeur : E → Rp → Ur → N.</>,
      tache: { type: 'qcm', q: 'Quelle est la grandeur physique que l’on cherche à mesurer ?', options: ['L’éclairement E, en lux', 'La résistance Rp de la photorésistance', 'Le nombre N donné par le CAN'], bonne: 0,
        expl: 'Rp, Ur et N ne sont que des images successives de l’éclairement E.' } },
    { id: 'capteur', titre: 'Le capteur', focus: ['source', 'capteur', 'graph'], bloc: 'capteur',
      texte: <>La photorésistance change de résistance quand elle est éclairée. Le graphique donne sa caractéristique Rp = f(E) (les points sont des mesures). Choisissez un éclairement de 200 lx.</>,
      tache: { type: 'action', ok: E === 200, label: '☁ Choisir E = 200 lx', faire: () => setE(200), consigne: E === 200 ? null : `Éclairement : ${E} lx → 200 lx` } },
    { id: 'rp', titre: 'Lire la caractéristique', focus: ['graph', 'capteur'], bloc: 'capteur',
      texte: <>Le point bleu repère l'état actuel du capteur sur la courbe. Lisez sa résistance sur l'axe vertical (les pointillés vous aident).</>,
      tache: { type: 'num', q: 'Résistance Rp de la photorésistance pour E = 200 lx', unite: 'Ω', vrai: Rp200, tol: 0.03, affiche: x => fmt(x, 0),
        bloque: E !== 200 ? 'Réglez d’abord E = 200 lx à l’étape précédente.' : null,
        expl: `Rp ≈ ${fmt(Rp200, 0)} Ω.` } },
    { id: 'sens', titre: 'Sens de variation', focus: ['graph', 'source'], bloc: 'capteur',
      texte: <>Déplacez le curseur de la source lumineuse et observez le point sur la courbe.</>,
      tache: { type: 'qcm', q: 'Quand l’éclairement augmente, la résistance de la photorésistance…', options: ['diminue', 'augmente', 'reste constante'], bonne: 0,
        expl: 'La lumière libère des porteurs de charge : la résistance baisse, d’où le nom de photorésistance.' } },
    { id: 'condit', titre: 'Le conditionneur', focus: ['conditionneur', 'graph'], bloc: 'conditionneur',
      texte: <>La carte Arduino ne sait pas mesurer une résistance. On place la photorésistance dans un <strong>pont diviseur de tension</strong> alimenté en 5 V : Ur = 5 × R / (R<sub>p</sub> + R), avec R = 1000 Ω.</>,
      tache: { type: 'qcm', q: 'À quoi sert le conditionneur ?', options: ['À transformer la variation de résistance en variation de tension, que le CAN sait mesurer', 'À rendre le capteur plus sensible à la lumière', 'À allumer les phares'], bonne: 0,
        expl: 'Le CAN d’une entrée analogique de l’Arduino mesure des tensions entre 0 et 5 V.' } },
    { id: 'ur', titre: 'Calculer la tension', focus: ['conditionneur', 'graph'], bloc: 'conditionneur',
      texte: <>Pour E = 200 lx, vous connaissez Rp. Calculez Ur avec la formule du pont diviseur (R = 1000 Ω).</>,
      tache: { type: 'num', q: 'Tension Ur', unite: 'V', vrai: Ur200, tol: 0.01, affiche: x => fmt(x, 2),
        bloque: !(E === 200 && R === R0) ? 'Gardez E = 200 lx et R = 1000 Ω.' : null,
        expl: `Ur = 5 × 1000 / (${fmt(Rp200, 0)} + 1000) = ${fmt(Ur200, 2)} V.` } },
    { id: 'can', titre: 'Le convertisseur analogique-numérique', focus: ['can', 'graph'], bloc: 'can',
      texte: <>Le CAN convertit la tension Ur (de 0 à 5 V) en un <strong>nombre entier N</strong>. Avec n bits, N peut prendre 2<sup>n</sup> valeurs, de 0 à 2<sup>n</sup> − 1. Choisissez 10 bits dans la liste au-dessus du graphique (c'est le CAN d'une carte Arduino Uno).</>,
      tache: { type: 'num', q: 'Combien de valeurs différentes N peut-il prendre avec 10 bits ?', unite: 'valeurs', vrai: 1024, tol: 0.0005, affiche: x => fmt(x, 0),
        bloque: bits !== B0 ? 'Choisissez 10 bits dans la liste.' : null, expl: '2¹⁰ = 1024 valeurs, de 0 à 1023.' } },
    { id: 'quantum', titre: 'Le quantum', focus: ['can', 'graph'], bloc: 'can',
      texte: <>Le <strong>quantum</strong> q est la variation de tension qui fait changer N d'une unité. Dans ce modèle, N va de 0 à 2<sup>n</sup> − 1 pour une tension de 0 à 5 V, donc <strong>q = 5 / (2<sup>n</sup> − 1)</strong>.</>,
      tache: { type: 'num', q: 'Quantum q pour 10 bits', unite: 'mV', vrai: q10, tol: 0.01, affiche: x => fmt(x, 2),
        bloque: bits !== B0 ? 'Choisissez 10 bits dans la liste.' : null, expl: `q = 5 / 1023 = ${fmt(q10 / 1000, 5)} V = ${fmt(q10, 2)} mV.` } },
    { id: 'n', titre: 'Le nombre N', focus: ['can', 'graph'], bloc: 'can',
      texte: <>Le CAN calcule N = Ur / 5 × (2<sup>n</sup> − 1), tronqué à l'entier inférieur. Reprenez Ur = {fmt(Ur200, 2)} V (E = 200 lx).</>,
      tache: { type: 'num', q: 'Nombre N donné par le CAN', unite: '', vrai: N200, tol: 0.004, affiche: x => fmt(x, 0),
        bloque: !reglage200 ? 'Gardez E = 200 lx, R = 1000 Ω et 10 bits.' : null,
        expl: `N = ${fmt(Ur200, 3)} / 5 × 1023 ≈ ${fmt(N200, 0)}.` } },
    { id: 'arduino', titre: 'Le traitement : allumer les phares', focus: ['arduino', 'montage'], bloc: 'arduino',
      texte: <>Le programme compare N à deux seuils, <strong>{SEUIL_BAS}</strong> et <strong>{SEUIL_HAUT}</strong>. Si N est inférieur au seuil bas, il met la sortie 8 à HIGH (la LED s'allume) ; s'il est supérieur au seuil haut, il la met à LOW. Choisissez E = 70 lx, puis activez les phares (bouton à gauche).</>,
      tache: { type: 'action', ok: E === 70 && pharesOn, label: '🌆 Choisir E = 70 lx', faire: () => setE(70),
        consigne: [E !== 70 && 'Éclairement : 70 lx', !pharesOn && 'Phares : activez-les (bouton « Activer phares »)'].filter(Boolean).join('\n') || null } },
    { id: 'allume', titre: 'Phares allumés ?', focus: ['arduino', 'montage'], bloc: 'arduino',
      texte: <>À 70 lx, Rp = {fmt(Rp70, 0)} Ω, donc N = {fmt(N70, 0)}.</>,
      tache: { type: 'qcm', q: 'Que fait le programme ?', options: [`Il allume les phares, car N = ${N70} est inférieur à ${SEUIL_BAS}`, `Il éteint les phares, car N = ${N70} est inférieur à ${SEUIL_BAS}`, `Il laisse les phares éteints, car N est inférieur à ${SEUIL_HAUT}`], bonne: 0,
        expl: 'Il fait sombre : la photorésistance a une grande résistance, donc Ur et N sont faibles.' } },
    { id: 'monte200', titre: 'Un peu plus de lumière', focus: ['source', 'arduino'], bloc: 'arduino',
      texte: <>Gardez les phares activés, allumés, et passez à E = 200 lx (N = {fmt(N200, 0)}).</>,
      tache: { type: 'action', ok: E === 200 && pharesOn && ledOn, label: '☁ Choisir E = 200 lx', faire: () => setE(200),
        consigne: (E === 200 && pharesOn && ledOn) ? null : (!(pharesOn && (ledOn || E === 70)) ? 'Les phares doivent d’abord être allumés : revenez à 70 lx avec les phares activés, puis passez à 200 lx.' : `Éclairement : ${E} lx → 200 lx`) } },
    { id: 'hyst', titre: 'Entre les deux seuils', focus: ['arduino', 'montage'], bloc: 'arduino',
      texte: <>N = {fmt(N200, 0)} est compris entre {SEUIL_BAS} et {SEUIL_HAUT} : ni inférieur au seuil bas, ni supérieur au seuil haut.</>,
      tache: { type: 'qcm', q: 'Que deviennent les phares ?', options: ['Ils restent dans l’état précédent (allumés)', 'Ils s’éteignent', 'On ne peut pas savoir'], bonne: 0,
        expl: 'Aucune condition n’est vraie : la sortie garde sa valeur précédente. C’est une hystérésis.' } },
    { id: 'eteint', titre: 'Plein jour', focus: ['source', 'arduino'], bloc: 'arduino',
      texte: <>Passez à E = 470 lx (Rp = {fmt(Rp470, 0)} Ω, N = {fmt(N470, 0)}).</>,
      tache: { type: 'action', ok: E === 470 && pharesOn && !ledOn, label: '🌤 Choisir E = 470 lx', faire: () => setE(470),
        consigne: (E === 470 && pharesOn && !ledOn) ? null : (!pharesOn ? 'Les phares doivent rester activés.' : `Éclairement : ${E} lx → 470 lx`) } },
    { id: 'pourquoi', titre: 'Pourquoi deux seuils ?', focus: ['arduino'], bloc: 'arduino',
      texte: <>On aurait pu comparer N à un seul seuil.</>,
      tache: { type: 'qcm', q: `Pourquoi utiliser deux seuils (${SEUIL_BAS} et ${SEUIL_HAUT}) ?`, options: ['Pour éviter que les phares clignotent quand l’éclairement fluctue autour d’un seuil', 'Pour mesurer deux éclairements différents', 'Parce que le CAN a deux entrées'], bonne: 0,
        expl: 'Avec un seul seuil, le moindre nuage ou le bruit de mesure ferait basculer les phares en permanence.' } },
    { id: 'hypotheses', titre: 'Sur quoi repose ce modèle ?', focus: ['hypo'], bloc: 'conditionneur',
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse justifie la formule du pont diviseur Ur = 5 R / (Rp + R) ?', options: ['L’entrée du CAN ne prélève pas de courant sur le pont', 'La photorésistance a une résistance constante', 'La tension d’alimentation est inférieure à 5 V'], bonne: 0,
        expl: 'Si l’entrée du CAN laissait passer un courant non négligeable, il faudrait en tenir compte dans le calcul de Ur.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [], bloc: 'capteur',
      texte: <>Vous savez suivre une grandeur à travers une chaîne de mesure : E → Rp → Ur → N, puis décision. En exploration libre, changez R et le nombre de bits : que deviennent le quantum et la
        sensibilité ?</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const passe = id => !enGuide || etape > idx(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  useEffect(() => { if (enGuide) setActiveBlock(ETAPES[Math.min(etape, ETAPES.length - 1)].bloc); }, [enGuide, etape]); // eslint-disable-line
  const vRp = passe('rp') ? `Rp = ${Rp.toLocaleString()} Ω` : 'Rp = ?';
  const vUr = passe('ur') ? `Ur = ${Ur.toFixed(3)} V` : 'Ur = ?';
  const vN = passe('n') ? `N = ${N}` : 'N = ?';
  const montreQuantum = passe('quantum'), montreN = passe('n');

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    setDefi({ E: tire([70, 200, 360, 470, 680, 880]), R: tire([470, 1000, 2200, 4700]), bits: tire([8, 10, 12]), reps: {}, verifie: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') { setE(500); setR(R0); setBits(B0); setCanInput('Ur'); setPharesOn(false); setAlgoN1(SEUIL_BAS); setAlgoN2(SEUIL_HAUT); setAlgoEtat1('HIGH'); setAlgoEtat2('LOW'); }
  }
  const voletDefi = defi && (() => {
    const rp = rpDe(defi.E), ur = urDe(rp, defi.R), n = nDe(ur, defi.bits), q = 5000 / (Math.pow(2, defi.bits) - 1);
    const Q = [
      { id: 'rp', q: 'Résistance Rp de la photorésistance (à lire sur la caractéristique)', unite: 'Ω', vrai: rp, tol: 0.03, aff: fmt(rp, 0) },
      { id: 'ur', q: 'Tension Ur du pont diviseur', unite: 'V', vrai: ur, tol: 0.01, aff: fmt(ur, 3) },
      { id: 'q', q: 'Quantum q du CAN', unite: 'mV', vrai: q, tol: 0.01, aff: fmt(q, 3) },
      { id: 'n', q: 'Nombre N donné par le CAN', unite: '', vrai: n, tol: 0.004, aff: fmt(n, 0) },
      { id: 'u2', q: 'Tension Ur’ que la carte déduit de N (Ur’ = N × q)', unite: 'V', vrai: n * q / 1000, tol: 0.004, aff: fmt(n * q / 1000, 3) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          La photorésistance reçoit un éclairement de <strong>{defi.E} lx</strong>. Elle est montée en pont diviseur avec <strong>R = {fmt(defi.R, 0)} Ω</strong> (alimentation 5 V), et la tension Ur est lue par un CAN <strong>{defi.bits} bits</strong> de référence 5 V.
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappels : Ur = 5 R / (Rp + R) ; N = Ur / 5 × (2<sup>n</sup> − 1) tronqué ; q = 5 / (2<sup>n</sup> − 1).</div>
          <button onClick={() => { setE(defi.E); setR(defi.R); setBits(defi.bits); setCanInput('Ur'); setActiveBlock('capteur'); setMode('explore'); }}
            style={{ ...stylePetitBouton(false, '#334155'), marginTop: 6 }}>🔍 Régler l’exploration sur ces valeurs</button>
        </div>
        {Q.map((q, k) => {
          const rep = defi.reps[q.id] || '', ok = proche(lireNombre(rep), q.vrai, q.tol);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.aff} {q.unite}</div>}
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
      <li><strong>Photorésistance</strong> : la caractéristique Rp(E) est donnée par 9 points de mesure ; entre deux points, on interpole linéairement en échelle log-log. En dessous de 11 lx (resp. au-dessus de 1590 lx), Rp garde la valeur du point extrême. La température, la couleur de la lumière et le temps de réponse sont ignorés, et l'éclairement est uniforme sur le capteur.</li>
      <li><strong>Alimentation et résistance R</strong> : alimentation 5 V parfaite et stable ; R exacte (tolérance ignorée).</li>
      <li><strong>Pont diviseur non chargé</strong> : l'entrée du CAN ne prélève pas de courant, donc Ur = 5 R / (R<sub>p</sub> + R). La photorésistance est reliée au 5 V, la résistance R à la masse, et Ur est prise aux bornes de R.</li>
      <li><strong>CAN idéal à n bits, référence 5 V</strong> : N = Ur / 5 × (2<sup>n</sup> − 1), tronqué à l'entier inférieur (comme sur une carte Arduino), et quantum q = 5 / (2<sup>n</sup> − 1). Pas de bruit ni d'erreur de gain ou de décalage. Le CAN réel d'une carte Uno est à 10 bits et convertit sur 1024 pas : l'écart avec ce modèle est d'au plus un pas.</li>
      <li><strong>Algorithme</strong> : N est comparé à deux seuils (hystérésis) ; entre les deux seuils, la sortie 8 garde son état précédent. Les phares sont éteints au départ. Le délai de 5 s entre deux lectures n'est pas simulé.</li>
    </ul>
  );

  // ── Plotly ──
  useEffect(() => {
    if (!window.Plotly || !plotRef.current || !plotlyReady) return;

    if (activeBlock==="capteur") {
      const Es  = Array.from({length:300},(_,i)=>i*5+5);
      const Rps = Es.map(calcRp);
      window.Plotly.react(plotRef.current,[
        {x:Es,y:Rps,mode:'lines',line:{color:'#f4a261',width:2.5},name:'Rp(E)'},
        {x:DONNEES_RP.map(d=>d[0]),y:DONNEES_RP.map(d=>d[1]),mode:'markers',marker:{color:'#f4a261',size:7,line:{color:'#b45309',width:1}},name:'points mesurés'},
        {x:[E],y:[Rp],mode:'markers',marker:{color:'#2a6099',size:12,symbol:'diamond'},name:'Point courant'},
        {x:[0,E],y:[Rp,Rp],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
        {x:[E,E],y:[0,Rp],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
      ],{
        xaxis:{title:'Éclairement E (lx)',range:[0,1600]},
        yaxis:{title:'Résistance Rp (Ω)',range:[0,8000]},
        margin:{t:20,b:50,l:70,r:20},
        paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fafcff',
        legend:{orientation:'h',y:-0.3},autosize:true,
      },{displayModeBar:false,responsive:true});
    }

    if (activeBlock==="conditionneur") {
      const Rps = Array.from({length:300},(_,i)=>i*35);
      const Urs = Rps.map(rp=>5*R/(rp+R));
      window.Plotly.react(plotRef.current,[
        {x:Rps,y:Urs,mode:'lines',line:{color:'#e9a824',width:2.5},name:'Ur(Rp)'},
        {x:[Rp],y:[Ur],mode:'markers',marker:{color:'#2a6099',size:12,symbol:'diamond'},name:'Point courant'},
        {x:[0,Rp],y:[Ur,Ur],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
        {x:[Rp,Rp],y:[0,Ur],mode:'lines',line:{dash:'dot',color:'#888',width:1},showlegend:false},
      ],{
        xaxis:{title:'Résistance Rp (Ω)',range:[0,10500]},
        yaxis:{title:'Tension Ur (V)',range:[0,5.2]},
        margin:{t:20,b:50,l:70,r:20},
        paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fafcff',
        legend:{orientation:'h',y:-0.3},autosize:true,
      },{displayModeBar:false,responsive:true});
    }

    if (activeBlock==="can") {
      window.Plotly.react(plotRef.current, [
        {x:[`${canInput} (${canUnite})`], y:[canValReel],
         type:'bar', marker:{color:'#e9a824'},
         name:`${canInput} = ${canValReel.toFixed(canInput==="Ur"?3:0)} ${canUnite}`, yaxis:'y'},
        {x:['N'], y:[NcanVal],
         type:'bar', marker:{color:'#2a6099'},
         name:`N = ${NcanVal}`, yaxis:'y2'},
      ], {
        yaxis:{
          title:`${canInput} (${canUnite})`,
          range:[0, canMax*1.05],
          side:'left',
          showgrid:false,
          ticklen:5,
          tickcolor:'#333',
          tickvals: Array.from({length:6}, (_,i) => Math.round(i*canMax/5*100)/100),
        },
        yaxis2:{
          title:`N (0 à ${Nmax})`,
          range:[0, Nmax*1.15],
          overlaying:'y',
          side:'right',
          showgrid:false,
          ticklen:5,
          tickcolor:'#333',
          tickvals: Array.from({length:6}, (_,i) => Math.round(i*Nmax/5)),
        },
        margin:{t:40, b:100, l:70, r:70},
        paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff',
        legend:{orientation:'h', y:-0.35}, showlegend:true, autosize:true,
        barmode:'group',
        annotations:[
          {
            x:`${canInput} (${canUnite})`,
            y: canValReel + canMax*0.08,
            text:`${canValReel.toFixed(canInput==="Ur"?3:0)} ${canUnite}`,
            showarrow:false,
            font:{size:12, color:'#e9a824', weight:600},
            yref:'y',
          },
          {
            x:'N',
            y: NcanVal + Nmax*0.08,
            text:montreN ? `${NcanVal}` : '',
            showarrow:false,
            font:{size:12, color:'#2a6099', weight:600},
            yref:'y2',
          },
          {
            x:0.5, y:-0.35, xref:'paper', yref:'paper',
            text: montreQuantum ? `⚡ Quantum = ${quantum.toFixed(canInput==="Ur"?4:1)} ${canUnite}/pas` : '',
            showarrow:false, font:{size:12, color:'#2a9d8f'}, xanchor:'center'
          },
        ]
      }, {displayModeBar:false, responsive:true});
    }

  },[E,R,bits,activeBlock,canInput,plotlyReady,montreN,montreQuantum]);

  // ── SVG Soleil ──
  const SoleilSVG = (
    <svg viewBox="0 0 240 120" style={{width:"100%",display:"block"}}>
      <rect x="0" y="0" width="240" height="120" fill={cielColor}/>
      {E<80 && [[20,15],[60,25],[120,10],[180,20],[210,35],[40,45],[160,12],[90,40]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.5" fill="white" opacity={Math.max(0,1-E/80)}/>
      ))}
      {E>5 && Array.from({length:12},(_,i)=>{
        const a=i*30*Math.PI/180,r1=28,r2=42;
        return <line key={i} x1={70+r1*Math.cos(a)} y1={60+r1*Math.sin(a)}
          x2={70+r2*Math.cos(a)} y2={60+r2*Math.sin(a)}
          stroke="#FFD700" strokeWidth="3" strokeLinecap="round" opacity={soleilOpacity}/>;
      })}
      {E>5 && <>
        <circle cx="70" cy="60" r="25"
          fill={`rgb(${Math.round(255*E/1500)},${Math.round(229*E/1500)},0)`}
          opacity={soleilOpacity}/>
        <circle cx="70" cy="60" r="18" fill="#FFE500" opacity={soleilOpacity}/>
      </>}
      {nuagePct>0.05 && <g transform={`translate(${240-nuagePct*200},25)`} opacity={Math.min(nuagePct*2,1)}>
        <ellipse cx="55" cy="25" rx="42" ry="22" fill="white" opacity="0.92"/>
        <ellipse cx="32" cy="33" rx="30" ry="18" fill="white" opacity="0.92"/>
        <ellipse cx="78" cy="33" rx="28" ry="16" fill="white" opacity="0.92"/>
        <ellipse cx="55" cy="37" rx="48" ry="14" fill="white" opacity="0.92"/>
      </g>}
      {nuagePct>0.35 && <g transform={`translate(${240-nuagePct*160},5)`} opacity={Math.min((nuagePct-0.35)*2,1)}>
        <ellipse cx="45" cy="22" rx="38" ry="20" fill="#e0e0e0" opacity="0.95"/>
        <ellipse cx="25" cy="30" rx="26" ry="14" fill="#e0e0e0" opacity="0.95"/>
        <ellipse cx="68" cy="30" rx="24" ry="13" fill="#e0e0e0" opacity="0.95"/>
        <ellipse cx="45" cy="34" rx="42" ry="12" fill="#e0e0e0" opacity="0.95"/>
      </g>}
      {nuagePct>0.65 && <g transform={`translate(${240-nuagePct*130},35)`} opacity={Math.min((nuagePct-0.65)*3,1)}>
        <ellipse cx="40" cy="20" rx="35" ry="18" fill="#bbb" opacity="0.95"/>
        <ellipse cx="22" cy="28" rx="24" ry="12" fill="#bbb" opacity="0.95"/>
        <ellipse cx="60" cy="28" rx="22" ry="11" fill="#bbb" opacity="0.95"/>
        <ellipse cx="40" cy="32" rx="38" ry="10" fill="#bbb" opacity="0.95"/>
      </g>}
      <text x="165" y="108" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold"
        style={{textShadow:"1px 1px 3px rgba(0,0,0,0.8)"}}>E = {E} lx</text>
    </svg>
  );

  // ── SVG Montage Arduino (fixe) ──
  const MontageSVG = (
    <div style={{position:"relative"}}>
      <img src="/simulations-chimie/schemaarduino.PNG"
        style={{width:"100%", display:"block"}}
        alt="Schéma montage Arduino"/>

      {/* LED — toujours visible */}
      <div style={{
        position:"absolute",
        top:"10%", left:"86%",
        width:18, height:18,
        borderRadius:"50%",
        background: ledOn ? "#FFD700" : "#555",
        boxShadow: ledOn ? "0 0 14px 7px rgba(255,215,0,0.6)" : "none",
        border:"2px solid #888",
        transition:"all 0.3s"
      }}/>
      {/* Label ON/OFF juste à droite de la LED */}
      <div style={{
        position:"absolute",
        top:"10%", left:"91%",
        fontSize:11, fontWeight:"bold",
        color: ledOn ? "#e65100" : "#666",
        background:"rgba(255,255,255,0.85)",
        padding:"2px 5px", borderRadius:4,
        transition:"all 0.3s"
      }}>
        {ledOn ? "💡ON" : "OFF"}
      </div>
    </div>
  );


  // ── Styles blocs ──
  const blockBtn = (key, color, title, sub, val) => (
    <div onClick={()=>setActiveBlock(key)} style={{
      padding:"8px 12px", borderRadius:8,
      border:`2px solid ${activeBlock===key?color:'#ddd'}`,
      cursor:"pointer", background:activeBlock===key?color+'18':'white',
      transition:"all 0.2s", textAlign:"center", userSelect:"none", width:"100%", ...cadre(key),
    }}>
      <div style={{fontWeight:600,fontSize:13}}>{title}</div>
      <div style={{fontSize:11,color:"#888"}}>{sub}</div>
      <div style={{fontSize:12,color,fontWeight:600}}>{val}</div>
    </div>
  );

  const exploration = (
    <div style={{display:"flex",flexDirection:"column",gap:14,
      fontFamily:"Inter, system-ui, Arial",fontSize:14}}>

      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>

        {/* ── COLONNE GAUCHE ── */}
        <div style={{flex:"0 0 260px",display:"flex",flexDirection:"column",gap:10}}>

          {/* Source lumineuse */}
          <div style={{...cardStyle, ...cadre('source')}}>
            {SoleilSVG}
            <input type="range" min="0" max="100" step="1"
              value={Math.round(Math.sqrt((E-12)/1488)*100)}
              onChange={e=>{const v=parseFloat(e.target.value)/100;setE(Math.round(v*v*1488+12));}}
              style={{width:"100%",accentColor:"#f4a261",marginTop:6}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888"}}>
              <span>12 lx (nuit)</span>
              <span>1500 lx (soleil)</span>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6}}>
              {PRESETS_E.map(v=>(
                <button key={v} onClick={()=>setE(v)} style={{padding:"2px 7px",fontSize:11.5,borderRadius:5,cursor:"pointer",
                  border:`1px solid ${E===v?"#f4a261":"#ccc"}`,background:E===v?"#f4a261":"white",color:E===v?"white":"#333",fontWeight:600}}>{v} lx</button>
              ))}
            </div>
          </div>

          {/* Chaîne verticale */}
          <div style={{...cardStyle,display:"flex",flexDirection:"column",
            alignItems:"center",gap:4}}>
            {blockBtn("capteur","#f4a261","📡 Capteur","photorésistance",vRp)}
            <div style={{fontSize:22,color:"#333"}}>↓</div>
            {blockBtn("conditionneur","#e9a824","⚡ Conditionneur",`pont diviseur R=${R}Ω`,vUr)}
            <div style={{fontSize:22,color:"#333"}}>↓</div>
            {blockBtn("can","#2a6099","🔢 CAN Arduino",`${bits} bits (0 à ${Nmax})`,vN)}
            <div style={{fontSize:22,color:"#333"}}>↓</div>
            {blockBtn("arduino","#2a9d8f","🤖 Traitement","algorithme phares",
              pharesOn?(ledOn?"Sortie 8 : HIGH 💡":"Sortie 8 : LOW"):"inactif")}
            <button onClick={()=>setPharesOn(v=>!v)}
              style={{marginTop:6, padding:"4px 12px", borderRadius:6,
                border:"none", cursor:"pointer", fontWeight:600, fontSize:12,
                width:"100%",
                background: pharesOn ? "#f4a261" : "#eee",
                color: pharesOn ? "white" : "#333"}}>
              {pharesOn ? "🔦 Phares activés" : "🔦 Activer phares"}
            </button>
          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div style={{flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:12}}>

          {/* Montage Arduino TOUJOURS EN HAUT */}
          <div style={{...cardStyle, ...cadre('montage')}}>
            <div style={{fontWeight:600, color:"#445", marginBottom:8}}>
              Montage Arduino
            </div>
            {MontageSVG}
          </div>

          {/* Graphique EN BAS — change selon bloc actif */}
          {activeBlock!=="arduino" && (
            <div style={{...cardStyle, overflow:"hidden", ...cadre('graph')}}>
              <div style={{fontWeight:600, color:"#445", marginBottom:6,
                display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                {activeBlock==="capteur" && "Caractéristique — Rp = f(E)"}
                {activeBlock==="conditionneur" && <>
                  <span>Caractéristique — Ur = f(Rp)</span>
                  <span style={{fontSize:12, color:"#888"}}>R =</span>
                  <input type="number" value={R} onChange={e=>setR(parseFloat(e.target.value))}
                    step="100" min="100" max="10000"
                    style={{width:75, fontSize:12, padding:"2px 6px", borderRadius:4, border:"1px solid #ccc"}}/>
                  <span style={{fontSize:12, color:"#888"}}>Ω</span>
                </>}
                {activeBlock==="can" && <>
                  <span>Conversion CAN</span>
                  <select value={bits} onChange={e=>setBits(parseInt(e.target.value))}
                    style={{fontSize:12, padding:"2px 4px", borderRadius:4, border:"1px solid #ccc"}}>
                    <option value={1}>1 bit (0-1)</option>
                    <option value={2}>2 bits (0-3)</option>
                    <option value={4}>4 bits (0-15)</option>
                    <option value={8}>8 bits (0-255)</option>
                    <option value={10}>10 bits (0-1023)</option>
                    <option value={12}>12 bits (0-4095)</option>
                  </select>
                  <span style={{fontSize:12, color:"#888"}}>Entrée :</span>
                  <select value={canInput} onChange={e=>setCanInput(e.target.value)}
                    style={{fontSize:12, padding:"2px 4px", borderRadius:4, border:"1px solid #ccc"}}>
                    <option value="Ur">Ur (V)</option>
                    <option value="Rp">Rp (Ω)</option>
                    <option value="E">E (lx)</option>
                  </select>
                </>}
              </div>
              <div ref={plotRef} style={{height: activeBlock==="arduino" ? 0 : 280, overflow:"hidden"}}/>
              {activeBlock==="conditionneur" && (
                <div style={{marginTop:8, padding:"10px 14px", borderRadius:6,
                  background:"#fffbf0", border:"1px solid #e9a824", fontSize:13}}>
                  <strong>Pont diviseur de tension :</strong><br/>
                  <span style={{fontFamily:"monospace", fontSize:15, color:"#e9a824"}}>
                    Ur = 5 × R / (Rp + R)
                  </span><br/>
                  <span style={{color:"#888", fontSize:12}}>
                    R={R}Ω, Rp={Rp.toLocaleString()}Ω → <strong>Ur = {Ur.toFixed(3)} V</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Algorithme — seulement si traitement actif ET phares activés */}
          {activeBlock==="arduino" && pharesOn && (
            <div style={{...cardStyle, ...cadre('arduino')}}>
              <div style={{fontWeight:600, color:"#445", marginBottom:10}}>
                Algorithme de contrôle
              </div>
              <div style={{fontFamily:"monospace", fontSize:12, lineHeight:2,
                background:"#1e1e2e", color:"#cdd6f4", padding:12, borderRadius:8}}>
                <div style={{color:"#89b4fa"}}>boucle infinie :</div>
                <div style={{paddingLeft:16}}>
                  <span style={{color:"#cba6f7"}}>Si </span>N &lt;&nbsp;
                  <input type="number" value={algoN1}
                    onChange={e=>setAlgoN1(parseInt(e.target.value))}
                    style={{width:65, background:"#313244", color:"#f38ba8",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}/>
                  <span style={{color:"#cba6f7"}}> alors </span>sortie 8 =&nbsp;
                  <select value={algoEtat1} onChange={e=>setAlgoEtat1(e.target.value)}
                    style={{background:"#313244", color:"#a6e3a1",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}>
                    <option value="HIGH">HIGH</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div style={{paddingLeft:16}}>
                  <span style={{color:"#cba6f7"}}>Si </span>N &gt;&nbsp;
                  <input type="number" value={algoN2}
                    onChange={e=>setAlgoN2(parseInt(e.target.value))}
                    style={{width:65, background:"#313244", color:"#f38ba8",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}/>
                  <span style={{color:"#cba6f7"}}> alors </span>sortie 8 =&nbsp;
                  <select value={algoEtat2} onChange={e=>setAlgoEtat2(e.target.value)}
                    style={{background:"#313244", color:"#a6e3a1",
                      border:"1px solid #45475a", borderRadius:4, padding:"1px 4px",
                      fontFamily:"monospace", fontSize:12}}>
                    <option value="HIGH">HIGH</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div style={{paddingLeft:16, color:"#6c7086"}}>délai 5s → relancer boucle</div>
              </div>
              <div style={{marginTop:8, padding:"8px 12px", borderRadius:6,
                background:ledOn?"#fff3e0":"#f5f5f5",
                border:`1px solid ${ledOn?"#f4a261":"#ddd"}`,
                fontSize:12, fontWeight:600, color:ledOn?"#e65100":"#888"}}>
                {ledOn
                  ? `💡 Phares ALLUMÉS — N=${N} < ${algoN1}`
                  : N>algoN2
                    ? `💡 Phares ÉTEINTS — N=${N} > ${algoN2}`
                    : `⏳ En attente — N=${N} (entre ${algoN1} et ${algoN2})`}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const [hypoOuv, setHypoOuv] = useState(true);
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cm-l1.cote { grid-template-columns: minmax(0, 2.1fr) minmax(300px, 1fr); align-items: start; }
        .cm-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 960px) { .cm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Chaîne de mesure : de l'éclairement au nombre N</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`cm-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : exploration}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && (
        <div className="cm-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Faites varier E : comment évoluent Rp, Ur et N ?</li>
              <li>Changez R : où la tension Ur varie-t-elle le plus quand E change ? Pour quel éclairement le capteur est-il le plus sensible ?</li>
              <li>Diminuez le nombre de bits : que devient le quantum ? Pourquoi N ne distingue-t-il plus deux éclairements voisins ?</li>
              <li>Activez les phares et cherchez les éclairements où ils s'allument et s'éteignent.</li>
              <li>Rapprochez les deux seuils : que se passe-t-il quand l'éclairement fluctue ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
