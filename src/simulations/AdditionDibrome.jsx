// Addition de Br₂ sur un alcène (BTS) : ion bromonium, addition anti, stéréospécificité.
import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { ALCENES, activiteOptique } from "./brModele";
import { AnimAddition } from "./AnimAddition";

const SIM_ID = 96;
declarerDefis(SIM_ID, [['principal', 'Addition du dibrome']]);
const NOIR = '#0f172a', BRUN = '#9a3412', BLEU = '#1d4ed8', ROUGE = '#dc2626';
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
const seg = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));

function etat(u, syn) {
  if (u < 0.35) return <>Le dibrome Br₂, <strong>polarisable</strong>, s'approche de la double liaison C=C, riche en électrons (nucléophile). La molécule Br–Br se polarise.</>;
  if (u < 0.55) return <><strong>Étape 1</strong> : le doublet π attaque Br (δ+) ; Br⁻ part. Il se forme l'<strong>ion bromonium</strong> : un pont Br⁺ à trois chaînons, d'un seul côté du plan de l'alcène.</>;
  if (syn) return u < 0.62 ? <>Br⁻ s'approche…</> : <><strong>Impossible :</strong> Br⁻ ne peut pas attaquer du côté du pont (la face est occupée par Br⁺ et la liaison qui doit se rompre est du côté opposé). Seule la face opposée est accessible.</>;
  return <><strong>Étape 2</strong> : Br⁻ attaque l'un des deux carbones par la <strong>face opposée</strong> au pont, en repoussant le pont (comme une SN2 intramoléculaire). Les deux Br se retrouvent de part et d'autre du plan : <strong>addition anti</strong>.</>;
}

// ── Parcours guidé ──
function etapesGuide(st, regler) {
  const { alc } = st;
  const ici = k => ({ type: 'action', ok: alc === k, faire: () => regler(k), label: 'Le faire pour moi', consigne: `Choisis ${ALCENES[k].nom}.`, indice: 'Utilise le menu « Alcène ».' });
  return [
    { titre: 'Le test au dibrome', texte: <>L'eau de dibrome est <strong>brune</strong>. Mélangée à un alcène, elle se <strong>décolore</strong> : les doubles liaisons C=C réagissent avec Br₂ par addition, et il ne reste plus de dibrome coloré.</>,
      retenirTitre: 'À RETENIR : LE TEST AU DIBROME',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Réactif</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Observation</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Conclusion</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>eau de dibrome (brune)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>se décolore aussitôt</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>présence d’une double liaison C=C (alcène)</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>eau de dibrome (brune)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>reste brune</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>pas de C=C (liaisons simples seulement)</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Br₂ s’additionne sur C=C : il est consommé et la couleur disparaît.</li>
        </ul>
      </>,
      tache: { type: 'qcm', q: 'On ajoute de l’eau de dibrome à un composé, elle se décolore aussitôt. Ce composé contient probablement …', options: ['Une double liaison C=C', 'Seulement des liaisons simples C–C et C–H', 'Un groupe hydroxyle –OH'], bonne: 0, indice: 'Br₂ s’additionne sur la double liaison : il disparaît du mélange.', expl: <>Br₂ s'additionne sur C=C : le dibrome est consommé et la couleur brune disparaît. C'est un <strong>test caractéristique des alcènes</strong>.</> } },
    { titre: 'Le (Z)-but-2-ène', texte: <>Place-toi sur un alcène simple : le <strong>(Z)-but-2-ène</strong>, où les deux CH₃ sont du même côté de la double liaison.</>, tache: ici('Z') },
    { titre: 'Un pont bromonium', texte: <>Lance l'animation. Br₂ ne se fixe pas simplement sur un carbone : le doublet π attaque Br et forme un <strong>pont à trois chaînons</strong>, l'ion bromonium, qui est un intermédiaire.</>,
      retenirTitre: 'À RETENIR : LE MÉCANISME EN DEUX ÉTAPES',
      retenir: <>
        <svg viewBox="0 0 420 150" role="img" aria-label="Mécanisme de l’addition de Br₂ sur un alcène : le doublet π de la double liaison forme avec un atome de brome un pont à trois chaînons, l’ion bromonium, puis l’ion bromure Br⁻ ouvre le pont par la face opposée ; les deux atomes de brome se retrouvent de part et d’autre du plan : addition anti" style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto 6px' }}>
          <text x="10" y="18" fontSize="12" fontWeight="700" fill="#334155">① alcène + Br₂</text><text x="150" y="18" fontSize="12" fontWeight="700" fill="#334155">② ion bromonium</text><text x="300" y="18" fontSize="12" fontWeight="700" fill="#334155">③ produit</text>
          <text x="52" y="52" textAnchor="middle" fontSize="12" fill="#d55e00">Br–Br</text><line x1="35" y1="92" x2="75" y2="92" stroke="#334155" strokeWidth="2.5" /><line x1="35" y1="98" x2="75" y2="98" stroke="#334155" strokeWidth="2.5" /><text x="28" y="118" fontSize="12" fill="#334155">C</text><text x="72" y="118" fontSize="12" fill="#334155">C</text>
          <line x1="110" y1="95" x2="140" y2="95" stroke="#334155" strokeWidth="2" /><polygon points="140,91 148,95 140,99" fill="#334155" />
          <polygon points="170,100 230,100 200,58" fill="none" stroke="#0072b2" strokeWidth="2.5" /><text x="200" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="#d55e00">Br⁺</text><text x="160" y="118" fontSize="12" fill="#334155">C</text><text x="226" y="118" fontSize="12" fill="#334155">C</text><text x="250" y="62" fontSize="12" fontWeight="700" fill="#d55e00">Br⁻</text>
          <line x1="250" y1="95" x2="282" y2="95" stroke="#334155" strokeWidth="2" /><polygon points="282,91 290,95 282,99" fill="#334155" />
          <line x1="310" y1="95" x2="370" y2="95" stroke="#334155" strokeWidth="2.5" /><text x="302" y="118" fontSize="12" fill="#334155">C</text><text x="366" y="118" fontSize="12" fill="#334155">C</text>
          <line x1="320" y1="95" x2="320" y2="62" stroke="#334155" strokeWidth="2" /><text x="320" y="54" textAnchor="middle" fontSize="12" fontWeight="700" fill="#d55e00">Br</text><line x1="360" y1="95" x2="360" y2="128" stroke="#334155" strokeWidth="2" /><text x="360" y="142" textAnchor="middle" fontSize="12" fontWeight="700" fill="#d55e00">Br</text>
        </svg>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Étape 1</strong> : le doublet π attaque Br₂, le pont bromonium se forme sur <strong>une face</strong> de l’alcène.</li>
          <li><strong>Étape 2</strong> : Br⁻ ouvre le pont par la face <strong>opposée</strong> (comme une SN2) : addition <strong>anti</strong>.</li>
        </ul>
      </>,
      tache: { type: 'qcm', q: 'Pourquoi le pont bromonium est-il formé d’un seul côté du plan de l’alcène ?', options: ['Br₂ arrive par une face de l’alcène : le pont se forme de ce côté', 'Br⁺ passe à travers le plan de l’alcène', 'Les deux Br s’additionnent en même temps sur les deux faces'], bonne: 0, indice: 'Br₂ s’approche de la liaison π par le haut ou par le bas.', expl: <>Br₂ s'approche de la double liaison par <strong>une face</strong> : Br⁺ forme le pont de ce côté, et Br⁻ part. Cela décide de la suite : une face est occupée, l'autre est libre.</> } },
    { titre: 'L’attaque de Br⁻', texte: <>Dans la seconde étape, Br⁻ ouvre le pont. Teste dans la simulation : choisis « même face que le pont » puis « face opposée ».</>,
      tache: { type: 'qcm', q: 'Par quelle face Br⁻ attaque-t-il l’ion bromonium ?', options: ['Par la face opposée au pont (attaque « par l’arrière »)', 'Par la même face que le pont', 'Indifféremment, par l’une ou l’autre face'], bonne: 0, indice: 'Comparer avec la SN2 : le nucléophile attaque du côté opposé au groupe partant.', expl: <>Br⁻ attaque <strong>par l'arrière</strong>, du côté opposé au pont, qui joue le rôle de groupe partant. Les deux Br sont donc de part et d'autre du plan de l'ancienne double liaison : <strong>addition anti</strong>.</> } },
    { titre: 'Combien de produits avec le (Z) ?', texte: <>Le dibrome peut attaquer la face supérieure ou la face inférieure du (Z)-but-2-ène avec la <strong>même probabilité</strong>. Change de face dans la simulation et observe le produit.</>,
      tache: { type: 'qcm', q: 'Quel est le produit de l’addition de Br₂ sur le (Z)-but-2-ène ?', options: ['Un mélange racémique de (2R,3R)- et (2S,3S)-2,3-dibromobutane', 'Le composé méso (2R,3S)-2,3-dibromobutane', 'Un seul énantiomère (2R,3R)'], bonne: 0, indice: 'Les deux faces sont équiprobables et donnent chacune un énantiomère.', expl: <>Selon la face attaquée, on obtient (2R,3R) ou (2S,3S), en proportions égales : un <strong>racémique</strong>, sans pouvoir rotatoire.</> } },
    { titre: 'Le (E)-but-2-ène', texte: <>Change d'alcène : le <strong>(E)-but-2-ène</strong> a ses deux CH₃ de part et d'autre de la double liaison.</>, tache: ici('E') },
    { titre: 'Stéréospécificité', texte: <>La même addition anti, appliquée à l'autre stéréoisomère, donne un produit <strong>différent</strong> : on dit que la réaction est <strong>stéréospécifique</strong>.</>,
      retenirTitre: 'À RETENIR : RACÉMIQUE, MÉSO, STÉRÉOSPÉCIFIQUE',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Terme</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Définition</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>À retenir</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>racémique</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>mélange en proportions égales de deux énantiomères</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>sans pouvoir rotatoire</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>composé méso</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>molécule à plan de symétrie, bien que portant des carbones asymétriques</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>achiral, sans activité optique</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>réaction stéréospécifique</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>chaque stéréoisomère de départ donne un stéréoisomère d’arrivée différent</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>ici : addition anti de Br₂</td></tr>
          </tbody>
        </table>
      </>,
      tache: { type: 'qcm', q: 'Quel est le produit de l’addition de Br₂ sur le (E)-but-2-ène ?', options: ['Le composé méso (2R,3S)-2,3-dibromobutane', 'Un mélange racémique (2R,3R) + (2S,3S)', 'Un mélange des trois stéréoisomères'], bonne: 0, indice: 'Les deux faces donnent ici le même composé : il possède un plan de symétrie.', expl: <>L'addition anti sur le (E) donne le composé <strong>méso</strong>, quelle que soit la face attaquée : il possède un plan de symétrie, donc aucune activité optique et un seul produit.</> } },
    { titre: 'Le cyclohexène', texte: <>Sur un alcène cyclique, la même règle s'applique : les deux Br sont de part et d'autre du plan du cycle.</>, tache: ici('cyclo') },
    { titre: 'Cis ou trans ?', texte: <>Compare la configuration relative des deux Br.</>,
      tache: { type: 'qcm', q: 'Quel stéréoisomère de 1,2-dibromocyclohexane obtient-on ?', options: ['Le trans (racémique de (1R,2R) et (1S,2S))', 'Le cis (méso)', 'Un mélange de cis et de trans à parts égales'], bonne: 0, indice: 'Addition anti : les deux Br sont de part et d’autre du cycle.', expl: <>L'addition anti place les deux Br de part et d'autre du plan moyen du cycle : on obtient le <strong>trans</strong>, racémique.</> } },
    { titre: 'Bilan', texte: <>Tu sais prévoir le produit de l'addition de Br₂ sur un alcène.</>,
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Alcène + Br₂ (anti)</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Produit</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Stéréochimie</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>(Z)-but-2-ène</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>2,3-dibromobutane</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>racémique (2R,3R) + (2S,3S)</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>(E)-but-2-ène</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>2,3-dibromobutane</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>composé méso (2R,3S)</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>cyclohexène</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>1,2-dibromocyclohexane</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>trans (racémique de (1R,2R) et (1S,2S))</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>L’eau de dibrome est décolorée par les alcènes : test de la double liaison.</li>
          <li>Mécanisme en deux étapes : <strong>ion bromonium</strong> (pont), puis ouverture par Br⁻ <strong>par la face opposée</strong>.</li>
          <li><strong>Addition anti</strong>, donc stéréospécifique : un stéréoisomère de départ différent donne un produit différent.</li>
        </ul>
      </> },
  ];
}

function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), cle = ['cyclo', 'Z', 'E'][Math.floor(r() * 3)], A = ALCENES[cle];
  const Q = [
    { id: 'inter', type: 'qcm', q: `Le ${A.nom} réagit avec Br₂. Quel intermédiaire se forme dans la première étape ?`, options: ['Un carbocation secondaire', 'Un ion bromonium (pont)', 'Un radical'], bonne: 1, detail: 'Br₂ polarisé forme un pont Br⁺ avec la double liaison : l\'ion bromonium.' },
    { id: 'config', type: 'qcm', q: 'Comment les deux atomes de brome se placent-ils par rapport au plan de l’ancienne double liaison ?', options: ['Du même côté (addition syn)', 'De part et d’autre (addition anti)', 'Les deux orientations en parts égales'], bonne: 1, detail: 'Br⁻ attaque la face opposée au pont : addition anti.' },
    { id: 'produit', type: 'qcm', q: `Quel est le résultat stéréochimique pour le ${A.nom} ?`, options: ['Un mélange racémique', 'Un composé méso', 'Un seul énantiomère pur'], bonne: A.resultat === 'racémique' ? 0 : 1, detail: A.resultat === 'racémique' ? `Les deux faces donnent chacune un énantiomère : racémique ${A.descripteurs.join(' + ')}.` : 'Les deux faces donnent le même composé méso (plan de symétrie).' },
    { id: 'nb', type: 'num', q: `Combien de stéréoisomères différents obtient-on à partir du ${A.nom} (en comptant les deux faces d’attaque) ?`, unite: '', vrai: A.nbStereo, tol: 0.02, detail: `${A.nbStereo} : ${A.descripteurs.join(' et ')}.` },
  ];
  return { Q, reps: {}, verifie: false, cle };
}
const INDICE_Q = { inter: 'Le doublet π attaque Br et un pont à trois chaînons se forme.', config: 'Br⁻ attaque du côté opposé au pont.', produit: 'Les deux faces donnent-elles le même produit ?', nb: 'Compte les stéréoisomères distincts : un racémique en compte deux, un méso un seul.' };

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les résultats stéréochimiques sont ceux du modèle classique de l'<strong>ion bromonium</strong>, qui explique l'addition anti observée.</li>
    <li>Les deux faces de l'alcène sont attaquées avec la <strong>même probabilité</strong> par Br₂ (pas de substituant chiral, pas de catalyseur).</li>
    <li>L'animation est une <strong>vue de côté schématique</strong> : elle ne représente pas les orbitales ni l'énergie, et les positions des atomes sont interpolées.</li>
    <li>Dans l'eau de dibrome, l'eau peut elle-même ouvrir le pont et donner une halogénohydrine ; la simulation ne traite que l'addition de Br⁻.</li>
  </ul>
);

export function SimulationAdditionDibrome() {
  const [mode, setMode] = useState(() => modeOuverture('br-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('br-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [alc, setAlc] = useState('Z');
  const [face, setFace] = useState('dessus');
  const [syn, setSyn] = useState(false);
  const [u, setU] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const A = ALCENES[alc];
  const regler = k => { setAlc(k); setU(0); setLecture(false); };

  useEffect(() => {
    if (!lecture) return;
    let raf, t0 = null, u0 = u >= 0.999 ? 0 : u;
    const pas = ts => {
      if (t0 === null) t0 = ts;
      const nv = Math.min(1, u0 + (ts - t0) / 6000);
      setU(nv);
      if (nv >= 1) { setLecture(false); return; }
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);   // eslint-disable-line react-hooks/exhaustive-deps

  const etapes = etapesGuide({ alc }, regler);
  const finParcours = guide.etape >= etapes.length;
  const juste = k => k.type === 'num' ? proche(lireNombre(df.reps[k.id] ?? ''), k.vrai, k.tol) : df.reps[k.id] === k.bonne;
  const menu = { fontSize: 14, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: 'white', color: KIT.txt, width: '100%' };
  const fini = u >= 0.999 && !syn;
  const enantio = A.resultat === 'racémique' ? A.descripteurs[face === 'dessus' ? 0 : 1] : A.descripteurs[0];

  const visuel = (
    <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Alcène
          <select value={alc} onChange={e => regler(e.target.value)} style={menu} aria-label="Alcène">
            {Object.values(ALCENES).map(a => <option key={a.cle} value={a.cle}>{a.nom}</option>)}</select></label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Br₂ attaque la :</span>
          <button onClick={() => { setFace('dessus'); setU(0); }} style={stylePetitBouton(face === 'dessus', '#0284c7')}>face supérieure</button>
          <button onClick={() => { setFace('dessous'); setU(0); }} style={stylePetitBouton(face === 'dessous', '#0284c7')}>face inférieure</button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Br⁻ attaque :</span>
          <button onClick={() => { setSyn(false); setU(0); }} style={stylePetitBouton(!syn, '#16a34a')}>face opposée au pont</button>
          <button onClick={() => { setSyn(true); setU(0); }} style={stylePetitBouton(syn, ROUGE)}>même face que le pont</button>
        </div>
      </div>
      <AnimAddition alc={alc} re="Br2" u={u} face={face} syn={syn} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
        <input type="range" min={0} max={1000} step={1} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(+e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ flex: 1 }} />
      </div>
      <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }} aria-live="polite">{etat(u, syn)}</div>
      {fini && <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
        Produit : <strong>{A.produit}</strong>. Les deux Br sont de part et d'autre du plan : addition <strong>anti</strong>.
        {A.resultat === 'racémique' ? <> Cette face donne l'énantiomère <strong>{enantio}</strong> ; l'autre face donne l'autre énantiomère, en proportion égale : <strong>mélange racémique</strong>.</> : <> Quelle que soit la face, on obtient le même composé <strong>méso {A.descripteurs[0]}</strong>.</>}
      </div>}
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Alcène de ce défi : <strong>{ALCENES[df.cle].nom}</strong>. <button onClick={() => regler(df.cle)} style={stylePetitBouton(false, '#b45309')}>Choisir cet alcène</button></div>
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

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Addition du dibrome sur un alcène</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Bilan de l'addition</div>
            <LigneMesure nom="Produit" valeur={A.produit} couleur="#475569" />
            <LigneMesure nom="Stéréoisomères obtenus" valeur={String(A.nbStereo)} couleur="#0284c7" />
            <LigneMesure nom="Résultat" valeur={A.resultat} couleur="#ea580c" />
            <LigneMesure nom="Descripteurs" valeur={A.descripteurs.join(' + ')} couleur="#475569" />
            <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 8, lineHeight: 1.55 }}>Activité optique : <strong>{activiteOptique(A)}</strong>.</div>
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Ion bromonium, puis ouverture par Br⁻ par la face opposée : addition anti, stéréospécifique. (Z) donne un racémique, (E) donne le méso.</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
