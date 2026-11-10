// Sélectivités stéréochimiques (BTS) : addition syn ou anti, stéréosélectivité, stéréospécificité.
import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { ALCENES, REACTIFS, RES, resultat, NOM_TYPE } from "./seleModele";
import { AnimAddition } from "./AnimAddition";

const SIM_ID = 98;
declarerDefis(SIM_ID, [['principal', 'Syn ou anti, sélectivités']]);
const NOIR = '#0f172a', BRUN = '#9a3412', BLEU = '#1d4ed8', VERT = '#15803d', ROUGE = '#dc2626', VIOLET = '#7c3aed';
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
const seg = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
const COUL = { Br2: BRUN, OsO4: VIOLET, H2: VERT };

function texteEtat(re, u) {
  const R = REACTIFS[re];
  if (re === 'Br2') return u < 0.35 ? <>Br₂ s'approche d'une face de l'alcène.</> : u < 0.6 ? <><strong>Ion bromonium</strong> : le pont Br⁺ occupe la face supérieure ; Br⁻ est parti.</> : <>Br⁻ attaque par la <strong>face opposée</strong> : les deux Br sont de part et d'autre du plan : <strong>addition anti</strong>.</>;
  if (re === 'OsO4') return u < 0.35 ? <>OsO₄ s'approche d'une face de l'alcène.</> : u < 0.6 ? <>Les deux liaisons C–O se forment <strong>en même temps, du même côté</strong> : on obtient un ester osmique cyclique, à cinq atomes.</> : <>L'hydrolyse libère le diol : les deux groupes OH restent sur la <strong>même face</strong> : <strong>addition syn</strong>.</>;
  return u < 0.35 ? <>H₂ est adsorbé à la surface du palladium : les atomes H sont liés au métal.</> : u < 0.6 ? <>L'alcène se fixe sur le métal par <strong>une face</strong> ; les deux H sont du côté du métal.</> : <>Les deux H sont transférés vers l'alcène <strong>par la même face</strong> : <strong>addition syn</strong>.</>;
}

// ── Parcours guidé ──
function etapesGuide(st, regler) {
  const { alc, re } = st;
  const ici = (a, r, consigne) => ({ type: 'action', ok: alc === a && re === r, faire: () => regler(a, r), label: 'Le faire pour moi', consigne, indice: 'Utilise les menus « Alcène » et « Réactif ».' });
  return [
    { titre: 'Syn ou anti ?', texte: <>Quand un réactif s'additionne sur une double liaison, les deux groupes se fixent soit sur la <strong>même face</strong> du plan de l'alcène (addition <strong>syn</strong>), soit sur des faces <strong>opposées</strong> (addition <strong>anti</strong>).</>,
      tache: { type: 'qcm', q: 'Deux groupes qui se fixent de part et d’autre du plan de l’alcène : c’est une addition …', options: ['syn', 'anti', 'en 1,4'], bonne: 1, indice: 'Anti = opposé.', expl: <><strong>Anti</strong> : faces opposées. <strong>Syn</strong> : même face.</> } },
    { titre: 'L’addition de Br₂ sur le (Z)-but-2-ène', texte: <>Choisis le (Z)-but-2-ène avec Br₂ et anime. Rappel : Br₂ passe par un ion bromonium, puis Br⁻ attaque par la face opposée.</>, tache: ici('Z', 'Br2', 'Choisis le (Z)-but-2-ène et Br₂.') },
    { titre: 'Un racémique', texte: <>L'addition est <strong>anti</strong>. Les deux faces de l'alcène étant équivalentes, deux énantiomères se forment en proportions égales.</>,
      tache: { type: 'qcm', q: 'Quel est le résultat de l’addition de Br₂ sur le (Z)-but-2-ène ?', options: ['Un mélange racémique (2R,3R) + (2S,3S)', 'Le composé méso (2R,3S)', 'Un seul énantiomère'], bonne: 0, indice: 'Anti sur (Z).', expl: <>Anti sur le (Z) donne le <strong>racémique</strong>.</> } },
    { titre: 'Un autre réactif : addition syn', texte: <>Remplace Br₂ par <strong>OsO₄</strong> (dihydroxylation). Il forme un ester cyclique : les deux liaisons C–O se créent en même temps, du même côté : c'est une addition <strong>syn</strong>.</>, tache: ici('Z', 'OsO4', 'Choisis le (Z)-but-2-ène et OsO₄.') },
    { titre: 'Même alcène, autre produit', texte: <>Compare avec le résultat précédent : le <strong>même alcène</strong> donne maintenant un autre stéréoisomère, parce que la réaction est <strong>syn</strong> au lieu d'<strong>anti</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est le résultat de la dihydroxylation syn du (Z)-but-2-ène ?', options: ['Le butane-2,3-diol méso (2R,3S)', 'Un mélange racémique (2R,3R) + (2S,3S)', 'Le butane-1,2-diol'], bonne: 0, indice: 'Syn sur (Z) : l’inverse de anti sur (Z).', expl: <>Syn sur le (Z) donne le <strong>méso</strong> : l'inverse de l'addition anti, qui donnait le racémique.</> } },
    { titre: 'Changer de stéréoisomère de départ', texte: <>Passe au <strong>(E)-but-2-ène</strong> avec OsO₄.</>, tache: ici('E', 'OsO4', 'Choisis le (E)-but-2-ène et OsO₄.') },
    { titre: 'Stéréospécificité', texte: <>Avec OsO₄ : (Z) donne le méso et (E) donne le racémique. Un stéréoisomère de départ différent donne un stéréoisomère d'arrivée différent.</>,
      tache: { type: 'qcm', q: 'Comment appelle-t-on une réaction dont chaque stéréoisomère de départ donne un stéréoisomère différent ?', options: ['Stéréospécifique', 'Chimiosélective', 'Régiosélective'], bonne: 0, indice: 'Elle dépend entièrement de la configuration de départ.', expl: <>C'est une réaction <strong>stéréospécifique</strong> : la configuration du produit est dictée par celle du réactif et par le mode d'addition (syn ou anti).</> } },
    { titre: 'Un cas stéréosélectif', texte: <>Passe au <strong>1,2-diméthylcyclohexène</strong> avec H₂/Pd. Les deux H se fixent sur la même face (syn). Le produit peut exister sous forme cis ou trans.</>, tache: ici('cyc', 'H2', 'Choisis le 1,2-diméthylcyclohexène et H₂/Pd.') },
    { titre: 'Stéréosélectivité', texte: <>La réaction pourrait donner le cis ou le trans ; elle donne essentiellement le <strong>cis</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi parle-t-on ici de stéréosélectivité plutôt que de stéréospécificité ?', options: ['La réaction forme un stéréoisomère (cis) de préférence à l’autre, possible lui aussi', 'Il y a deux stéréoisomères de départ qui donnent deux produits différents', 'La réaction donne un mélange en parts égales'], bonne: 0, indice: 'Un seul stéréoisomère est formé, alors que deux sont possibles.', expl: <>La réaction est <strong>stéréosélective</strong> : elle forme majoritairement le <strong>cis</strong> alors que le trans existe. On ne compare pas ici deux stéréoisomères de départ.</> } },
    { titre: 'Ce qu’il faut distinguer', texte: <>Une réaction <strong>stéréospécifique</strong> est forcément stéréosélective (un produit différent pour chaque réactif) ; l'inverse n'est pas vrai.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces affirmations est correcte ?', options: ['Toute réaction stéréospécifique est stéréosélective, mais pas l’inverse', 'Toute réaction stéréosélective est stéréospécifique', 'Les deux mots sont synonymes'], bonne: 0, indice: 'Pense à l’exemple du cyclohexène : stéréosélectif, mais un seul réactif.', expl: <>Stéréospécifique ⊂ stéréosélective : la spécificité est un cas particulier, où chaque réactif donne un produit différent.</> } },
    { titre: 'Bilan', texte: <>Tu sais utiliser syn/anti pour prévoir le produit.</>,
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>Syn</strong> : même face (OsO₄, H₂/Pd). <strong>Anti</strong> : faces opposées (Br₂ par l'ion bromonium).</li>
        <li>Sur le but-2-ène : anti donne (Z) → racémique, (E) → méso ; syn donne (Z) → méso, (E) → racémique.</li>
        <li><strong>Stéréosélective</strong> : un stéréoisomère formé de préférence. <strong>Stéréospécifique</strong> : à chaque stéréoisomère de départ correspond un stéréoisomère d'arrivée.</li>
      </ul> },
  ];
}

// ── Défi ──
function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const COMBOS = Object.keys(RES).filter(k => RES[k].type !== 'sans').map(k => k.split('|'));
function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), [a, re] = COMBOS[Math.floor(r() * COMBOS.length)], X = RES[`${a}|${re}`], R = REACTIFS[re], A = ALCENES[a];
  const resOpts = [...new Set([X.resultat, 'racémique', 'méso', 'cis (méso)', 'trans (racémique)'].filter(o => A.cyc ? /^(cis|trans)/.test(o) : /^(racémique|méso)/.test(o)))];
  const Q = [
    { id: 'mode', type: 'qcm', q: `Le ${A.nom} réagit avec ${R.nom}. L’addition est-elle syn ou anti ?`, options: ['Syn', 'Anti', 'Ni l’une ni l’autre'], bonne: R.mode === 'syn' ? 0 : 1, detail: `${R.court} s'additionne en ${R.mode} (${R.inter}).` },
    { id: 'res', type: 'qcm', q: 'Quel est le résultat stéréochimique ?', options: resOpts, bonne: resOpts.indexOf(X.resultat), detail: `${R.court} (${R.mode}) sur ${A.nom} donne : ${X.resultat}.` },
    { id: 'nb', type: 'num', q: 'Combien de stéréoisomères distincts de produit forme-t-on ?', unite: '', vrai: X.n, tol: 0.02, detail: `${X.n} stéréoisomère${X.n > 1 ? 's' : ''} : ${X.resultat}.` },
    { id: 'type', type: 'qcm', q: 'Quel qualificatif convient à cette réaction ?', options: ['Stéréospécifique', 'Stéréosélective sans être stéréospécifique', 'Ni stéréosélective ni stéréospécifique'], bonne: X.type === 'specifique' ? 0 : 1,
      detail: X.type === 'specifique' ? 'Les deux stéréoisomères du but-2-ène donnent des produits différents : stéréospécifique.' : 'Un stéréoisomère est formé de préférence, mais on ne compare pas deux stéréoisomères de départ : stéréosélective.' },
  ];
  return { Q, reps: {}, verifie: false, scen: { a, re } };
}
const INDICE_Q = { mode: 'Br₂ : ion bromonium ; OsO₄ et H₂/Pd : deux liaisons créées du même côté.', res: 'Appliquez syn ou anti sur le stéréoisomère de départ.', nb: 'Un racémique : 2 ; un méso ou un cis : 1.', type: 'Compare : deux réactifs de départ stéréoisomères ou un seul ?' };

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les résultats sont ceux des <strong>modèles classiques</strong> : addition anti par l'ion bromonium, addition syn concertée pour OsO₄ (ester cyclique) et pour l'hydrogénation sur métal.</li>
    <li>Les deux faces de l'alcène sont attaquées avec la <strong>même probabilité</strong> (pas de substituant chiral, pas de catalyseur chiral).</li>
    <li>L'<strong>hydrogénation du but-2-ène</strong> donne du butane, qui n'a pas de stéréoisomère : la question ne se pose pas. Pour le 1,2-diméthylcyclohexène, on suppose que l'addition syn l'emporte largement (cis).</li>
    <li>L'animation est une <strong>vue de côté schématique</strong> ; elle ne représente ni l'énergie ni les orbitales.</li>
    <li>La dihydroxylation par OsO₄ est donnée en exemple : KMnO₄ froid et dilué donne le même résultat syn, avec un rendement moindre.</li>
  </ul>
);

export function SimulationSyntheseStereo() {
  const [mode, setMode] = useState(() => modeOuverture('sele-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('sele-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [alc, setAlc] = useState('Z');
  const [re, setRe] = useState('Br2');
  const [u, setU] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const regler = (a, r) => { setAlc(a); setRe(r); setU(0); setLecture(false); };
  const X = resultat(alc, re), R = REACTIFS[re], A = ALCENES[alc];

  useEffect(() => {
    if (!lecture) return;
    let raf, t0 = null, u0 = u >= 0.999 ? 0 : u;
    const pas = ts => { if (t0 === null) t0 = ts; const nv = Math.min(1, u0 + (ts - t0) / 6000); setU(nv); if (nv >= 1) { setLecture(false); return; } raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);   // eslint-disable-line react-hooks/exhaustive-deps

  const etapes = etapesGuide({ alc, re }, regler);
  const finParcours = guide.etape >= etapes.length;
  const juste = k => k.type === 'num' ? proche(lireNombre(df.reps[k.id] ?? ''), k.vrai, k.tol) : df.reps[k.id] === k.bonne;
  const menu = { fontSize: 14, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: 'white', color: KIT.txt, width: '100%' };
  const fini = u >= 0.999;

  const visuel = (
    <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Alcène
          <select value={alc} onChange={e => regler(e.target.value, re)} style={menu} aria-label="Alcène">
            {Object.values(ALCENES).map(a => <option key={a.cle} value={a.cle}>{a.nom}</option>)}</select></label>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Réactif
          <select value={re} onChange={e => regler(alc, e.target.value)} style={menu} aria-label="Réactif">
            {Object.values(REACTIFS).map(r => <option key={r.cle} value={r.cle}>{r.nom}</option>)}</select></label>
        <div style={{ fontSize: 13.5, color: KIT.txt }}>Mode d'addition : <strong style={{ color: COUL[re] }}>{R.mode}</strong> ({R.inter}).</div>
      </div>
      <AnimAddition alc={alc} re={re} u={u} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
        <input type="range" min={0} max={1000} step={1} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(+e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ flex: 1 }} />
      </div>
      <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }} aria-live="polite">{texteEtat(re, u)}</div>
      {fini && <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>Produit : <strong>{X.produit}</strong> — {X.resultat}{X.desc.length > 0 && !/^(cis|trans)/.test(X.desc[0]) ? ` ${X.desc.join(' + ')}` : ''}.</div>}
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Situation : <strong>{ALCENES[df.scen.a].nom}</strong> + <strong>{REACTIFS[df.scen.re].nom}</strong>. <button onClick={() => regler(df.scen.a, df.scen.re)} style={stylePetitBouton(false, '#b45309')}>Régler la simulation</button></div>
      {df.Q.map((k, i) => {
        const ok = juste(k);
        return (
          <div key={k.id} style={{ borderLeft: `3px solid ${df.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{i + 1}. {avecIndices(k.q)}</div>
            <IndiceDefi cache={df.verifie && ok}>{avecIndices(INDICE_Q[k.id])}</IndiceDefi>
            {k.type === 'qcm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {k.options.map((o, j) => (
                  <button key={j} onClick={() => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [k.id]: j } }))}
                    style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${df.reps[k.id] === j ? '#0284c7' : KIT.bord}`, background: df.reps[k.id] === j ? '#e0f2fe' : 'white', color: KIT.txt }}>{o}</button>))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={df.reps[k.id] ?? ''} onChange={e => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [k.id]: e.target.value } }))} inputMode="decimal" aria-label={k.q}
                  style={{ width: 90, padding: '6px 8px', fontSize: 14, borderRadius: 8, border: `1.5px solid ${KIT.bord}` }} />
              </div>)}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>{k.type === 'num' && <>Réponse attendue : <strong>{fmt(k.vrai, 0)}</strong> — </>}{avecIndices(k.detail)}</div>}
          </div>);
      })}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { noterDefi(df.Q.every(juste)); setDf(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => setDf(defi())} style={styleBouton(false)}><Pic n="refresh" />Nouvelles données</button>
        {df.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{df.Q.filter(juste).length} / {df.Q.length} réponses justes</span>}
      </div>
    </div>
  );

  // Tableau comparatif des résultats pour l'alcène choisi
  const comparatif = (
    <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.6 }}>
      {Object.values(REACTIFS).map(r => { const x = resultat(alc, r.cle); return <div key={r.cle} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', borderBottom: `1px dashed ${KIT.bord}` }}><span style={{ color: COUL[r.cle], fontWeight: 700 }}>{r.court} ({r.mode})</span><span>{x.resultat}</span></div>; })}
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Syn ou anti ? Stéréosélectivité et stéréospécificité</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Bilan de la réaction</div>
            <LigneMesure nom="Produit" valeur={X.produit} couleur="#475569" />
            <LigneMesure nom="Résultat" valeur={X.resultat} couleur={COUL[re]} />
            <LigneMesure nom="Stéréoisomères distincts" valeur={String(X.n)} couleur="#0284c7" />
            <LigneMesure nom="Qualificatif" valeur={NOM_TYPE[X.type]} couleur="#ea580c" />
            <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, margin: '10px 0 4px' }}>Avec le {A.nom}, selon le réactif :</div>
            {comparatif}
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Syn : même face (OsO₄, H₂/Pd). Anti : faces opposées (Br₂). Stéréospécifique : chaque stéréoisomère de départ donne un stéréoisomère différent ; stéréosélectif : un stéréoisomère est formé de préférence.</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
