import { useState, useEffect, useRef } from "react";
import { cardStyle, fmt, sci, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices } from "../commun";
import { V_BURETTE, seuilVisible, couleurSolution, ContexteBanc, SchemaBurette, OutilTitrageGeneral } from "./titrageCommun";

// ====================================================
// TITRAGE DIRECT (1re spé PC) — TP « Titrage du diiode contenu dans le Lugol »
// Réaction de titrage : 2 S₂O₃²⁻ + I₂ → S₄O₆²⁻ + 2 I⁻ (rapide et totale), repérage colorimétrique de l'équivalence.
// Exploration : titrage pour toute réaction, et le banc du diiode par le thiosulfate.
// ====================================================

const M_I2 = 253.8;          // g/mol
const ETIQUETTE = 1.00;      // g de diiode pour 100 mL de Lugol

function modeleLugol({ t = ETIQUETTE, VA = 10, cB = 0.05 }) {
  const cA = t * 10 / M_I2;                       // mol/L (t g pour 100 mL)
  const nI2 = cA * VA / 1000;
  return { t, VA, cB, cA, nI2, Veq: 2 * nI2 / cB * 1000 };
}
function erlenLugol(mod, VB) {
  const nI2 = Math.max(0, mod.nI2 - mod.cB * VB / 1000 / 2);
  return { nI2, cI2: nI2 / ((mod.VA + VB) / 1000), nThio: Math.max(0, mod.cB * VB / 1000 - 2 * mod.nI2) };
}

export function Simulation2() {
  const [mode, setMode] = useState('explore');   // on arrive sur l'exploration libre
  const [onglet, setOnglet] = useState('general');
  const [guide, setGuide] = useEtatPersistant('titrage-direct-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [mes, setMes] = useEtatPersistant('titrage-direct-mesures-v1', { Vrapide: null, Ve: null });
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true });
  const [VB, setVB] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const [thiodene, setThiodene] = useState(false);
  const [declare, setDeclare] = useState(null);
  const [tExp, setTExp] = useState(ETIQUETTE), [VAExp, setVAExp] = useState(10), [cBExp, setCBExp] = useState(0.05);
  const [leg, setLeg] = useState({ l1: '', l2: '', l3: '', A: '', B: '', verif: false });
  const [sit, setSit] = useState({ verif: false });
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;
  const params = enGuide ? {} : enDefi && defi ? { t: defi.t } : { t: tExp, VA: VAExp, cB: cBExp };
  const mod = modeleLugol(params);
  const er = erlenLugol(mod, VB);
  const coul = couleurSolution(er.cI2, thiodene, mod.cA * 0.99);
  const visible = er.cI2 > seuilVisible(thiodene);

  // Écoulement de la burette (0,6 mL/s robinet ouvert)
  const refOuvert = useRef(ouvert); refOuvert.current = ouvert;
  useEffect(() => {
    if (!ouvert) return;
    let prec = performance.now(), id;
    const pas = now => {
      const dt = Math.min(0.1, (now - prec) / 1000); prec = now;
      setVB(v => { const nv = Math.min(V_BURETTE, v + 0.6 * dt); if (nv >= V_BURETTE) setOuvert(false); return nv; });
      if (refOuvert.current) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [ouvert]);
  function verser(dv) { setOuvert(false); setVB(v => Math.min(V_BURETTE, Math.round((v + dv) * 100) / 100)); setDeclare(null); }
  function nouveauTitrage() { setOuvert(false); setVB(0); setThiodene(false); setDeclare(null); }
  useEffect(() => { nouveauTitrage(); }, [mode, params.t, params.VA, params.cB]);

  // ── Valeurs du TP ──
  const ref = modeleLugol({});
  const Ve = mes.Ve ?? ref.Veq;                       // le volume mesuré par l'élève sert dans les calculs
  const nThioE = ref.cB * Ve / 1000, nI2E = nThioE / 2, cAE = nI2E / (ref.VA / 1000), mE = cAE * 0.100 * M_I2;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'contexte', titre: 'Le Lugol', focus: [],
      texte: <>Le Lugol est un antiseptique qui contient du diiode I₂. Son étiquette indique <strong>1,00 g de diiode pour 100 mL</strong>.
        Pour le vérifier, on fait un <strong>titrage direct</strong> : on fait réagir le diiode avec des ions thiosulfate de concentration
        connue, jusqu'à ce que tout le diiode ait réagi.
        <div style={{ textAlign: 'center', fontFamily: 'Georgia, serif', fontSize: 17, margin: '6px 0' }}>2 S₂O₃²⁻ + I₂ → S₄O₆²⁻ + 2 I⁻</div>
        Cette réaction est rapide et totale. Seul le diiode est coloré (rouge à jaune selon sa concentration).</>, tache: null },
    { id: 'burette', titre: 'Qui va où ?', focus: ['burette', 'erlen'],
      texte: <>On connaît précisément la concentration du thiosulfate (c<sub>B</sub> = 0,0500 mol/L) ; on cherche celle du diiode du Lugol.</>,
      tache: { type: 'qcm', q: 'Quelle solution met-on dans la burette ?', options: ['Le thiosulfate : c’est la solution titrante, de concentration connue', 'Le Lugol : c’est la solution titrée', 'Peu importe'], bonne: 0,
        expl: 'La solution titrée (le Lugol) est prélevée à la pipette jaugée et placée dans l’erlenmeyer : V_A = 10,0 mL.' } },
    { id: 'schema', titre: 'Le schéma du titrage', focus: ['burette', 'erlen', 'agitateur'],
      texte: <>Légendez le montage (repères 1, 2 et 3) et indiquez le contenu de la burette et de l'erlenmeyer, dans le cadre « Légendes » sous le schéma.</>,
      tache: { type: 'action', ok: leg.verif && legOk(leg), consigne: leg.verif && legOk(leg) ? null : 'Choisissez toutes les légendes, puis vérifiez.' } },
    { id: 'rapide', titre: 'Un titrage rapide', focus: ['burette', 'erlen'],
      texte: <>Les commandes sont apparues. Versez le thiosulfate assez vite (robinet ouvert), et arrêtez dès que la solution est
        <strong> pratiquement incolore</strong>. Cliquez alors sur « La solution est décolorée ». Ce premier essai donne une valeur approchée.</>,
      tache: { type: 'action', ok: mes.Vrapide != null, consigne: mes.Vrapide != null ? `✅ V_B,e ≈ ${fmt(mes.Vrapide, 1)} mL` : `Versé : ${fmt(VB, 2)} mL` } },
    { id: 'situations', titre: 'Avant, à et après l’équivalence', focus: ['erlen'],
      texte: <>Le tableau des trois situations est apparu sous le schéma. Pour chacune, indiquez la couleur, le réactif limitant et le
        réactif en excès.</>,
      tache: { type: 'action', ok: sit.verif && situationsOk(sit), consigne: sit.verif && situationsOk(sit) ? null : 'Remplissez le tableau, puis vérifiez.' } },
    { id: 'equiv', titre: 'L’équivalence', focus: [],
      texte: <>À l'équivalence, les deux réactifs sont limitants : il n'en reste plus aucun.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce que l’équivalence ?', options: ['Le moment où l’on a versé juste assez de thiosulfate pour faire réagir tout le diiode', 'Le moment où la burette est vide', 'Le moment où l’on a versé autant de thiosulfate que de Lugol'], bonne: 0,
        expl: 'À l’équivalence, les réactifs ont été introduits dans les proportions stœchiométriques.' } },
    { id: 'precis', titre: 'Un titrage précis', focus: ['burette', 'erlen'],
      texte: <>Nouveau titrage. Versez rapidement jusqu'à environ <strong>{mes.Vrapide != null ? `${fmt(Math.max(0, mes.Vrapide - 1), 1)} mL` : 'V_B,e − 1 mL'}</strong>,
        puis ajoutez le <strong>thiodène</strong> : il forme avec le diiode un composé bleu très foncé, qui disparaît brutalement à l'équivalence.
        Finissez <strong>goutte à goutte</strong> (1 goutte ≈ 0,05 mL ≈ 1 graduation), puis cliquez sur « C'est l'équivalence ! ».</>,
      tache: { type: 'action', ok: mes.Ve != null, consigne: mes.Ve != null ? `✅ V_B,e = ${fmt(mes.Ve, 2)} mL` : `Versé : ${fmt(VB, 2)} mL${thiodene ? ' ; thiodène ajouté' : ''}` } },
    { id: 'relation', titre: 'La relation à l’équivalence', focus: [],
      texte: <>À l'équivalence : n<sub>initial</sub>(I₂) / 1 = n<sub>versé,e</sub>(S₂O₃²⁻) / 2.</>,
      tache: { type: 'qcm', q: 'Pourquoi divise-t-on n(S₂O₃²⁻) par 2 ?', options: ['Il faut 2 ions thiosulfate pour 1 molécule de diiode', 'Parce que la burette fait 25 mL', 'Parce que le thiosulfate est dilué'], bonne: 0 } },
    { id: 'nThio', titre: 'Le thiosulfate versé', focus: ['burette'],
      texte: <>Avec votre mesure V<sub>B,e</sub> = {fmt(Ve, 2)} mL et c<sub>B</sub> = 0,0500 mol/L.</>,
      tache: { type: 'num', q: 'Quantité de thiosulfate versée à l’équivalence n_versé,e(S₂O₃²⁻)', unite: 'mol', vrai: nThioE, tol: 0.02,
        pieges: [[nThioE * 1000, 'Le volume doit être en litres.']], aide: 'Écriture scientifique acceptée : 4,5e-4 par exemple.' } },
    { id: 'nI2', titre: 'Le diiode titré', focus: ['erlen'],
      texte: <>On utilise la relation à l'équivalence.</>,
      tache: { type: 'num', q: 'Quantité de diiode n_initial(I₂) dans l’erlenmeyer', unite: 'mol', vrai: nI2E, tol: 0.02,
        pieges: [[nThioE * 2, 'C’est n(S₂O₃²⁻) / 2, et non × 2.'], [nThioE, 'Pensez au coefficient 2 devant S₂O₃²⁻.']] } },
    { id: 'cA', titre: 'La concentration du Lugol', focus: ['erlen'],
      texte: <>Ce diiode était contenu dans V<sub>A</sub> = 10,0 mL de Lugol.</>,
      tache: { type: 'num', q: 'Concentration en diiode c_A du Lugol', unite: 'mol/L', vrai: cAE, tol: 0.02,
        pieges: [[cAE / 1000, 'Le volume doit être en litres : 10,0 mL = 0,0100 L.']] } },
    { id: 'litteral', titre: 'Pour les plus à l’aise : en une seule formule', focus: [],
      texte: <>On peut regrouper les trois calculs précédents en une seule expression littérale.</>,
      tache: { type: 'qcm', q: 'Quelle expression donne c_A ?', options: ['c_A = c_B × V_B,e / (2 × V_A)', 'c_A = 2 × c_B × V_B,e / V_A', 'c_A = c_B × V_A / (2 × V_B,e)'], bonne: 0 } },
    { id: 'masse', titre: 'Comparer à l’étiquette', focus: [],
      texte: <>M(I₂) = 253,8 g/mol.</>,
      tache: { type: 'num', q: 'Masse de diiode dans 100 mL de Lugol', unite: 'g', vrai: mE, tol: 0.02,
        pieges: [[mE * 10, 'Dans 100 mL = 0,100 L, et non 1 L.'], [cAE * M_I2, 'C’est la masse dans 1 L : prenez 100 mL.']] } },
    { id: 'conclusion', titre: 'L’étiquette est-elle juste ?', focus: [],
      texte: <>Vous trouvez {fmt(mE, 2)} g pour 100 mL, soit un écart de {fmt(Math.abs(mE - 1) * 100, 1)} % avec l'étiquette.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['Le résultat est en accord avec l’étiquette, aux erreurs de mesure près', 'L’étiquette est fausse', 'On ne peut rien conclure'], bonne: Math.abs(mE - 1) <= 0.05 ? 0 : 1,
        expl: 'Un écart de quelques pourcents vient de la lecture de la burette (à une goutte près), de la pipette et de la concentration du thiosulfate.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez réalisé un titrage direct complet. En exploration libre, un onglet permet de simuler le titrage de n'importe
        quelle réaction, et l'exemple du Lugol propose tous les réglages. La simulation « Titrage en retour » montre une autre façon de
        doser : on titre l'excès d'un réactif.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);
  const vu = id => !enGuide || etape >= idx(id);
  const passe = id => !enGuide || etape > idx(id);          // étape dépassée (toujours vrai hors parcours guidé)
  useEffect(() => { if (enGuide && (etape === idx('rapide') || etape === idx('precis'))) nouveauTitrage(); }, [etape, enGuide]);

  function decolore() {             // titrage rapide : il suffit d'avoir décoloré la solution
    setOuvert(false);
    if (visible) { setDeclare({ ok: false, msg: 'La solution est encore colorée : continuez à verser.' }); return; }
    setDeclare({ ok: true, msg: `Solution décolorée à ${fmt(VB, 1)} mL : c'est une valeur approchée (vous avez sans doute un peu dépassé).` });
    if (enGuide) setMes(x => ({ ...x, Vrapide: Math.round(VB * 10) / 10 }));
  }
  function declarer() {             // titrage précis : à deux gouttes près
    setOuvert(false);
    const ecart = VB - mod.Veq;
    const r = visible ? { ok: false, msg: 'Pas encore : il reste du diiode, la solution est encore colorée.' }
      : ecart > 0.12 ? { ok: false, msg: `Vous avez dépassé l’équivalence de ${fmt(ecart, 2)} mL. Recommencez, en finissant goutte à goutte.` }
        : enGuide && etape === idx('precis') && !thiodene ? { ok: false, msg: 'Pour un titrage précis, ajoutez le thiodène avant de finir goutte à goutte. Recommencez.' }
          : { ok: true, msg: `Équivalence repérée : V_B,e = ${fmt(VB, 2)} mL.` };
    setDeclare(r);
    if (r.ok && enGuide) setMes(x => ({ ...x, Ve: Math.round(VB * 100) / 100 }));
    if (r.ok && enDefi) setDefi(d => ({ ...d, Vmes: Math.round(VB * 100) / 100 }));
  }

  // ════════════════ LÉGENDES ET TABLEAU DES TROIS SITUATIONS ════════════════
  const bord = ok => ({ fontSize: 14, padding: '3px 5px', border: `1.5px solid ${ok === true ? '#16a34a' : ok === false ? '#dc2626' : KIT.bord}`, borderRadius: 5 });
  const BONNES_LEG = { l1: 'burette graduée', l2: 'erlenmeyer', l3: 'agitateur magnétique', A: 'lugol', B: 'thio' };
  const CHOIX_LEG = {
    l1: ['burette graduée', 'pipette jaugée', 'éprouvette graduée'], l2: ['erlenmeyer', 'bécher', 'fiole jaugée'], l3: ['agitateur magnétique', 'balance', 'plaque chauffante'],
    A: [['lugol', 'Lugol (I₂), V_A = 10,0 mL, c_A inconnue'], ['thio', 'thiosulfate (S₂O₃²⁻), c_B = 0,0500 mol/L']],
    B: [['thio', 'thiosulfate (S₂O₃²⁻), c_B = 0,0500 mol/L'], ['lugol', 'Lugol (I₂), V_A = 10,0 mL, c_A inconnue']],
  };
  const NOMS_LEG = { l1: 'Repère 1', l2: 'Repère 2', l3: 'Repère 3', A: 'Erlenmeyer (solution A)', B: 'Burette (solution B)' };
  const legendes = (
    <div>
      {Object.keys(CHOIX_LEG).map(k => (
        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 14, color: KIT.txt, flexWrap: 'wrap' }}>
          <span style={{ minWidth: 150, fontWeight: 700 }}>{NOMS_LEG[k]}</span>
          <select value={leg[k]} aria-label={`Légende ${NOMS_LEG[k]}`} onChange={e => { const v = e.target.value; setLeg(x => ({ ...x, [k]: v, verif: false })); }}
            style={{ ...bord(leg.verif ? leg[k] === BONNES_LEG[k] : undefined), maxWidth: 300 }}>
            <option value="">?</option>
            {CHOIX_LEG[k].map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      ))}
      <button onClick={() => setLeg(x => ({ ...x, verif: true }))} style={stylePetitBouton(true, '#16a34a')}>Vérifier</button>
      {leg.verif && <span style={{ marginLeft: 8 }}>{legOk(leg) ? '✅ Schéma complété' : '❌ Une légende est à revoir'}</span>}
    </div>
  );
  const COLS = [['avant', <>V<sub>B</sub> &lt; V<sub>B,e</sub></>], ['a', <>V<sub>B</sub> = V<sub>B,e</sub>{mes.Vrapide != null ? ` ≈ ${fmt(mes.Vrapide, 1)} mL` : ''}</>], ['apres', <>V<sub>B</sub> &gt; V<sub>B,e</sub></>]];
  const LIGNES = [['couleur', 'Couleur dans l’erlenmeyer', ['jaune à rouge-orangé', 'incolore', 'bleue']],
    ['limitant', 'Réactif(s) limitant(s)', ['I₂', 'S₂O₃²⁻', 'les deux']], ['exces', 'Réactif en excès', ['I₂', 'S₂O₃²⁻', 'aucun']]];
  const cell = { padding: '5px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 14 };
  const tableau = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
        <thead><tr><th style={cell}/>{COLS.map(([k, t]) => <th key={k} style={cell}>{t}</th>)}</tr></thead>
        <tbody>
          {LIGNES.map(([l, nom, opts]) => (
            <tr key={l}><td style={{ ...cell, fontWeight: 700, textAlign: 'left' }}>{nom}</td>
              {COLS.map(([c]) => {
                const cle = `${l}-${c}`;
                return <td key={c} style={cell}>
                  <select value={sit[cle] || ''} aria-label={`${nom} ${c}`} onChange={e => { const v = e.target.value; setSit(x => ({ ...x, [cle]: v, verif: false })); }}
                    style={bord(sit.verif ? sit[cle] === BONNES_SIT[cle] : undefined)}>
                    <option value="">?</option>{opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select></td>;
              })}</tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 6 }}>
        <button onClick={() => setSit(x => ({ ...x, verif: true }))} style={stylePetitBouton(true, '#16a34a')}>Vérifier le tableau</button>
        {sit.verif && <span style={{ marginLeft: 8 }}>{situationsOk(sit) ? '✅ Tableau juste' : '❌ Une case est à revoir'}</span>}
      </div>
    </div>
  );

  // ════════════════ SCHÉMA, COMMANDES, MESURES ════════════════
  const schema = <SchemaBurette V2={VB} ouvert={ouvert} coul={coul} indicateur={thiodene ? 'avec thiodène' : null} hl={hl}
    etiquetteBurette={passe('schema') ? 'S₂O₃²⁻' : '?'}/>;   // en parcours, le contenu de la burette est l'objet des étapes « Qui va où ? » et « schéma »
  const commandes = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => { setDeclare(null); setOuvert(o => !o); }} style={styleBouton(true, ouvert ? '#dc2626' : '#16a34a')}>{ouvert ? '⏹ Fermer le robinet' : '▶ Ouvrir le robinet'}</button>
        <button onClick={() => verser(1)} style={styleBouton(false)}>+ 1 mL</button>
        <button onClick={() => verser(0.1)} style={styleBouton(false)}>+ 0,1 mL</button>
        <button onClick={() => verser(0.05)} style={styleBouton(false)}>💧 1 goutte</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {enGuide && etape === idx('rapide')
          ? <button onClick={decolore} style={styleBouton(true, ORANGE_GUIDE)}>🎯 La solution est décolorée</button>
          : <button onClick={declarer} style={styleBouton(true, ORANGE_GUIDE)}>🎯 C'est l'équivalence !</button>}
        <button onClick={nouveauTitrage} style={styleBouton(false)}>↺ Nouveau titrage</button>
        {vu('precis') && <button onClick={() => setThiodene(a => !a)} style={styleBouton(thiodene, '#4338ca')}>{thiodene ? 'Thiodène ajouté' : '🧪 Ajouter le thiodène'}</button>}
      </div>
      {declare && <div style={{ fontSize: 14, fontWeight: 700, color: declare.ok ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>{declare.ok ? '✅ ' : '❌ '}{declare.msg}</div>}
      {mode === 'explore' && <div style={{ marginTop: 8 }}>
        <Curseur nom="Diiode du Lugol (masse pour 100 mL)" valeur={tExp} onChange={setTExp} min={0.2} max={2} pas={0.05} unite="g" decimales={2} couleur="#e63946"/>
        <Curseur nom="Volume de Lugol prélevé V_A" valeur={VAExp} onChange={setVAExp} min={2} max={20} pas={1} unite="mL" couleur="#e63946"/>
        <Curseur nom="Concentration du thiosulfate c_B" valeur={cBExp * 1000} onChange={v => setCBExp(v / 1000)} min={10} max={100} pas={5} unite="mmol/L" couleur="#e63946"/>
      </div>}
    </>
  );
  const mesures = (
    <>
      <LigneMesure nom="Volume versé (lu sur la burette)" valeur={vu('rapide') ? `${fmt(VB, 2)} mL` : '—'} couleur="#0284c7"/>
      {mode === 'explore' && <>
        <LigneMesure nom="Concentration du Lugol c_A" valeur={`${sci(mod.cA, 3)} mol/L`}/>
        <LigneMesure nom="n(I₂) initial dans l'erlenmeyer" valeur={`${sci(mod.nI2, 3)} mol`}/>
        <LigneMesure nom="n(I₂) restant" valeur={`${sci(er.nI2, 3)} mol`} couleur="#c2410c"/>
        <LigneMesure nom="n(S₂O₃²⁻) en excès" valeur={`${sci(er.nThio, 3)} mol`}/>
        <LigneMesure nom="Volume équivalent" valeur={`${fmt(mod.Veq, 2)} mL`}/>
        {mod.Veq > V_BURETTE && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6 }}>Le volume équivalent dépasse la burette de 25 mL : prélevez moins de Lugol, ou prenez un thiosulfate plus concentré.</div>}
      </>}
    </>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi(type) {
    const r = Math.random();
    const t = type === 'autre' ? Math.round((0.5 + r * 1.0) * 100) / 100 : [0.88, 0.92, 0.97, 0.99, 1.00, 1.02, 1.04, 1.09, 1.13][Math.floor(r * 9)];
    setDefi({ type, t, reps: {}, verifie: false, Vmes: null });
  }
  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => nouveauDefi('autre')} style={styleBouton(defi?.type === 'autre', '#0ea5e9')}>🏷️ Le Lugol d'un autre fabricant</button>
        <button onClick={() => nouveauDefi('controle')} style={styleBouton(defi?.type === 'controle', '#0ea5e9')}>🏭 Contrôle qualité</button>
      </div>
      {defi && <>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          {defi.type === 'autre' ? 'Un autre fabricant ne donne pas la concentration de son Lugol.' : 'Un flacon annonce 1,00 g de diiode pour 100 mL. Le fabricant tolère un écart de 5 %.'}
          {' '}Même protocole que le TP : V<sub>A</sub> = 10,0 mL, thiosulfate à c<sub>B</sub> = 0,0500 mol/L. Titrez (le thiodène est disponible), puis calculez.
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: defi.Vmes != null ? '#15803d' : KIT.txt2 }}>
          {defi.Vmes != null ? `Votre volume équivalent : ${fmt(defi.Vmes, 2)} mL` : 'Repérez d’abord l’équivalence avec les commandes de la burette.'}
        </div>
        {[{ id: 'c', q: 'Concentration en diiode c_A', unite: 'mol/L' }, { id: 'm', q: 'Masse de diiode pour 100 mL', unite: 'g' },
          ...(defi.type === 'controle' ? [{ id: 'conf', q: 'Le flacon est-il conforme ? (oui ou non)', unite: '' }] : [])].map((q, k) => {
          const cVrai = defi.Vmes != null ? 0.05 * defi.Vmes / 2 / 10 : defi.t * 10 / M_I2;
          const vrai = q.id === 'c' ? cVrai : cVrai * 0.1 * M_I2;
          const ok = q.id === 'conf' ? (defi.reps.conf || '').trim().toLowerCase() === (Math.abs(defi.t - 1) <= 0.05 ? 'oui' : 'non')
            : proche(lireNombre(defi.reps[q.id] || ''), vrai, 0.03);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const v = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 120 }}/>
                <span style={{ fontSize: 13, color: KIT.txt2 }}>{q.unite}</span>{defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.id === 'conf' ? (Math.abs(defi.t - 1) <= 0.05 ? 'oui' : 'non') : `${q.id === 'c' ? sci(vrai, 3) : fmt(vrai, 3)} ${q.unite}`}</div>}
            </div>
          );
        })}
        <div><button onClick={() => setDefi(d => ({ ...d, verifie: true }))} disabled={defi.Vmes == null} style={{ ...styleBouton(defi.Vmes != null, '#16a34a'), opacity: defi.Vmes != null ? 1 : 0.5 }}>✓ Vérifier</button></div>
        {defi.verifie && <div style={{ fontSize: 13, color: KIT.txt2 }}>Valeur réelle : {fmt(defi.t, 2)} g pour 100 mL. Votre résultat dépend de la précision de votre lecture de V<sub>B,e</sub>.</div>}
      </>}
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi('autre'); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const vueBanc = mode !== 'explore' || onglet === 'banc';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .td-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .td-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .td-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Titrage direct</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {mode === 'explore' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['general', '📋 Titrage pour toute réaction'], ['banc', '🧪 Exemple du dosage du diiode par le thiosulfate']].map(([k, n]) =>
            <button key={k} onClick={() => setOnglet(k)} style={stylePetitBouton(onglet === k, '#e63946')}>{n}</button>)}
        </div>
      )}
      {mode === 'explore' && onglet === 'general' && <OutilTitrageGeneral/>}
      {vueBanc && <>
        <div className="td-l1">
          <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Exemple : le dosage du diiode du Lugol par le thiosulfate</div>
            {schema}
            {/* l'équation support du titrage, toujours sous le schéma ; hors parcours, aussi le contenu de l'erlenmeyer et de la burette */}
            <ContexteBanc
              erlen={!enGuide && <>V<sub>A</sub> = {mode === 'explore' ? fmt(VAExp, 0) : '10,0'} mL de Lugol (diiode I₂, concentration c<sub>A</sub> à déterminer), avec un barreau aimanté.</>}
              burette={!enGuide && <>le thiosulfate de sodium (2 Na⁺ + S₂O₃²⁻), à c<sub>B</sub> = {mode === 'explore' ? fmt(cBExp, 4) : '0,0500'} mol/L.</>}
              equations={[['Réaction support du titrage (rapide, totale)', <>2 S₂O₃²⁻<sub>(aq)</sub> + I₂<sub>(aq)</sub> → S₄O₆²⁻<sub>(aq)</sub> + 2 I⁻<sub>(aq)</sub></>]]}/>
            <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
              Le zoom permet de lire le volume versé au dixième de millilitre ; la burette est graduée tous les 0,05 mL, soit environ une goutte.
            </div>
          </div>
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : enDefi ? <div style={styleBoite}>{voletDefi}</div>
              : <div style={styleBoite}>
                <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
                  <li>Titrez sans thiodène, puis avec : où voyez-vous le mieux l'équivalence ?</li>
                  <li>Doublez le volume de Lugol prélevé : que devient le volume équivalent ?</li>
                  <li>Quelle concentration de thiosulfate choisir pour que l'équivalence tombe vers 15 mL ?</li>
                </ul>
              </div>}
        </div>
        <div className="td-l2">
          <div data-apparait={`${idx('rapide')} ${idx('precis')}`}>
            <Section titre="Commandes de la burette" ouvert={ouverts.commandes} onBascule={() => setOuverts(o => ({ ...o, commandes: !o.commandes }))}>
              {enGuide && !vu('rapide') ? <div style={{ fontSize: 13, color: KIT.txt2 }}>Les commandes apparaîtront au fil du parcours.</div> : commandes}
            </Section>
          </div>
          <div><Section titre="Mesures" ouvert={ouverts.mesures} onBascule={() => setOuverts(o => ({ ...o, mesures: !o.mesures }))}>{mesures}</Section></div>
          {enGuide && vu('schema') && etape <= idx('rapide') && <div style={styleBoite} data-apparait={`${idx('schema')}`}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Légendes du schéma</div>
            {legendes}
          </div>}
          {enGuide && vu('situations') && etape <= idx('equiv') && <div style={{ ...styleBoite, gridColumn: '1 / -1' }} data-apparait={`${idx('situations')}`}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Les trois situations</div>
            {tableau}
          </div>}
        </div>
      </>}
    </div>
  );
}

// ── Réponses attendues des légendes et du tableau des trois situations ──
const BONNES_SIT = {
  'couleur-avant': 'jaune à rouge-orangé', 'couleur-a': 'incolore', 'couleur-apres': 'incolore',
  'limitant-avant': 'S₂O₃²⁻', 'limitant-a': 'les deux', 'limitant-apres': 'I₂',
  'exces-avant': 'I₂', 'exces-a': 'aucun', 'exces-apres': 'S₂O₃²⁻',
};
function situationsOk(sit) { return Object.keys(BONNES_SIT).every(k => sit[k] === BONNES_SIT[k]); }
function legOk(leg) { return leg.l1 === 'burette graduée' && leg.l2 === 'erlenmeyer' && leg.l3 === 'agitateur magnétique' && leg.A === 'lugol' && leg.B === 'thio'; }
