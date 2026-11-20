/* eslint-disable no-irregular-whitespace -- espaces insécables écrites telles quelles devant les unités et autour du signe = */
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./nucleaire2gtModele";
import { QCM } from "./nucleaire2gtQcm";
import { COL } from "./nucleaire2gtCouleurs";
import { SceneIsoH, SceneQuatre, ScenePhysChim, SceneFusionFission, SceneFusion, SceneFission, SceneChaine, SceneEnergie, SceneBilan, Nx, EqNucleaire, EqNucleaireEnLigne,
  ListeEcritures, SituationAffiche, RangeeIsotopes, DessinReaction } from "./Nucleaire2gtScenes";
import { FicheIsotopes, FicheNatures, FicheFusion, FicheFission, FicheChaine, FicheReconnaitre } from "./Nucleaire2gtFiches";

const SIM_ID = 203, CLE_GUIDE = 'nucleaire-2gt-guide-v1';
declarerDefis(SIM_ID, [['isotopes', 'Trouver les isotopes d’un noyau dans une liste'], ['nature', 'Reconnaître la nature d’une transformation']]);

// ====================================================
//  SIM 203 — TRANSFORMATION NUCLÉAIRE : ISOTOPES, SOLEIL ET CENTRALES (2GT spé PC, « Constitution et transformations de la matière », D « Transformation nucléaire »).
//  Prérequis : simulation 195 (transformation physique), 179 (transformation chimique), 202 (le noyau : Z, A, écriture ZAX) ; le parcours rappelle en une phrase ce qu'il utilise de Z et A.
//  Suite : TG 123 et 184 (radioactivité, désintégrations, demi-vie) : NON anticipées ici. Une seule idée : une transformation nucléaire modifie les NOYAUX (l'élément change), à la différence
//  d'une transformation chimique (atomes conservés) ou physique (molécules conservées) ; elle libère beaucoup d'énergie (fusion dans le Soleil, fission dans les centrales).
//  Parcours (10 étapes) : isotopes (1), même A (1), physique ou chimique (1), fusion et fission (1), écriture d'une fusion (1), fission (1), chaîne énergétique d'une centrale (1),
//  comparaison avec la combustion (1), reconnaître l'écriture (1), bilan (1). Modèle : nucleaire2gtModele.js (testé), mise en page : nucleaire2gtDispo.js (testée).
//  Capacités visées (jamais affichées à l'élève) : identifier des isotopes ; relier l'énergie du Soleil et d'une centrale à des réactions nucléaires ; identifier la nature physique, chimique ou
//  nucléaire d'une transformation à partir d'une description ou d'une écriture. Hors programme, non traité dans le parcours : établir la conservation de A et de Z, désintégrations, demi-vie,
//  E = mc², déchets et sûreté (exploration, balisé).
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const R = M.REACTIONS;
const legendeNoyaux = (
  <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 13.5, color: KIT.txt2, marginTop: 6 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill={COL.proton} stroke={COL.protonTrait} strokeWidth="1.5" /><path d="M4.5 8H11.5M8 4.5V11.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>proton</span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#fff" stroke={COL.gris} strokeWidth="1.5" /></svg>neutron</span>
  </div>);

export function SimulationNucleaire() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviN, noterN] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('isotopes');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [ex, setEx] = useState({ Z: 6, sit: 'soleil', ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['isotopes', 'memeA', 'physchim', 'nucleaire', 'ecriture', 'fission', 'chaine', 'energie', 'ecritures', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const ETAPES = [
    { id: 'isotopes', titre: 'Un même élément, plusieurs noyaux', focus: ['scene'],
      texte: <>Le centre d’un atome s’appelle le <strong>noyau</strong>. Il est formé de <strong>protons</strong> (disques rouges) et de <strong>neutrons</strong> (disques blancs), que l’on appelle des <strong>nucléons</strong>. Son symbole porte deux nombres : <strong>A</strong>, le nombre de nucléons (en haut), et <strong>Z</strong>, le nombre de protons (en bas). Z décide de l’élément : tous les noyaux d’hydrogène ont Z{NB}={NB}1.
        <ExempleResolu>Le schéma montre trois noyaux d’hydrogène. Tous ont 1 proton (Z{NB}={NB}1), mais pas le même nombre de neutrons : A{NB}={NB}1, 2 ou 3. On les appelle des <strong>isotopes</strong> : ce sont des noyaux du même élément, avec des nombres de nucléons A différents.</ExempleResolu>
        À vous : le carbone.</>,
      tache: { type: 'qcm', ...QCM.iso1 } },
    { id: 'memeA', titre: 'Même A, même élément ?', focus: ['scene'],
      texte: <>Attention : deux noyaux qui ont le même nombre de nucléons A ne sont pas forcément du même élément. Ce qui compte pour reconnaître un élément, c’est le nombre de protons. Sur le schéma, comptez les disques rouges de chaque noyau.</>,
      tache: { type: 'qcm', ...QCM.iso2 } },
    { id: 'physchim', titre: 'Transformation physique ou chimique ?', focus: ['scene'],
      texte: <>Vous connaissez deux sortes de transformations. Dans une transformation <strong>physique</strong> (changement d’état, dissolution), les molécules sont les mêmes avant et après : seul leur rangement ou leur mélange change. Dans une transformation <strong>chimique</strong>, des molécules disparaissent et d’autres apparaissent, mais les <strong>atomes</strong> sont conservés : ils sont seulement réarrangés.
        <ExempleResolu>Du méthane brûle : les molécules de méthane et de dioxygène disparaissent, des molécules de dioxyde de carbone et d’eau apparaissent. Les atomes de carbone, d’hydrogène et d’oxygène sont les mêmes avant et après (schéma du bas) : la transformation est chimique.</ExempleResolu>
        À vous : une autre situation.</>,
      tache: { type: 'qcm', ...QCM.physchim },
      retenirTitre: 'Les isotopes',
      retenir: <><FicheIsotopes />
        <ul style={liste}>
          <li><strong>Phrase-clé : iso = même, topos = place.</strong> Des isotopes occupent la même case du tableau périodique : même Z, donc même élément.</li>
          <li><strong>Idée fausse</strong> : « même A, donc même élément ». <strong>Vrai</strong> : c’est Z qui fait l’élément ; le carbone 14 et l’azote 14 ont le même A, mais ce sont deux éléments différents.</li>
        </ul>{renvoi}</> },
    { id: 'nucleaire', titre: 'Quand ce sont les noyaux qui changent', focus: ['scene'],
      texte: <>Il existe une troisième sorte de transformation : la transformation <strong>nucléaire</strong>. Ici, ce sont les <strong>noyaux</strong> eux-mêmes qui changent : l’élément chimique change. Il y en a deux types. Dans une <strong>fusion</strong>, de petits noyaux s’assemblent en un noyau plus gros. Dans une <strong>fission</strong>, un gros noyau se casse en noyaux plus petits. Dans les deux cas, beaucoup d’énergie est libérée, sous forme de lumière et de chaleur.
        <ExempleResolu>Une bougie qui brûle ne change pas les noyaux : c’est une transformation chimique. Quand un gros noyau se casse en noyaux plus petits, comme dans le schéma du bas, c’est une fission.</ExempleResolu>
        À vous : le Soleil.</>,
      tache: { type: 'qcm', ...QCM.soleil } },
    { id: 'ecriture', titre: 'Lire l’écriture d’une fusion', focus: ['scene'],
      texte: <>Une transformation nucléaire s’écrit avec les symboles des noyaux. Le <strong>neutron</strong>, sans charge, s’écrit <Nx Z={0} A={1} /> : A{NB}={NB}1 et Z{NB}={NB}0. Voici une réaction de fusion. C’est un <strong>exemple simplifié</strong> : plus simple que celles du Soleil, mais de même nature (assemblage de noyaux) :
        <EqNucleaire r={R.dt} />
        La simulation a vérifié que, des deux côtés de la flèche, le nombre de nucléons est le même (2{NB}+{NB}3{NB}={NB}4{NB}+{NB}1) et le nombre de protons aussi (1{NB}+{NB}1{NB}={NB}2{NB}+{NB}0) : vous n’avez pas à le faire, seulement à lire l’écriture. La question porte sur d’autres noyaux, obtenus par fission de l’uranium 235.</>,
      tache: { type: 'qcm', ...QCM.isoEcriture },
      retenirTitre: 'Trois natures de transformation',
      retenir: <><FicheNatures />
        <ul style={liste}>
          <li><strong>Phrase-clé : de plus en plus profond.</strong> Physique : les molécules ne changent pas. Chimique : les molécules changent, pas les atomes. Nucléaire : même les noyaux changent.</li>
          <li><strong>Exemple</strong> : la glace qui fond, le méthane qui brûle, l’hydrogène qui devient de l’hélium dans le Soleil.</li>
        </ul>{renvoi}</> },
    { id: 'fission', titre: 'La fission dans une centrale', focus: ['scene'],
      texte: <>Dans une centrale nucléaire, c’est la <strong>fission</strong> qui est utilisée. Un neutron frappe un gros noyau d’uranium 235 (l’uranium naturel contient surtout de l’uranium 238, un autre isotope de l’uranium). Le noyau se casse en deux noyaux plus petits et libère de l’énergie, ainsi que de nouveaux neutrons. Voici une écriture de cette fission (un <strong>exemple simplifié</strong> : l’uranium 235 peut aussi donner d’autres noyaux) :
        <EqNucleaire r={R.fissionSr} />
        Un nombre écrit devant un symbole dit combien de fois il apparaît : « 3 <Nx Z={1} A={1} /> » voudrait dire trois noyaux d’hydrogène 1. Le schéma montre la fission ; les neutrons y sont agrandis pour qu’on les voie.</>,
      tache: { type: 'num', q: <>Combien de neutrons sont libérés par cette fission ? (Ceux qui apparaissent après la flèche.)</>, carnet: false, unite: 'neutrons', vrai: 2, tol: 0, affiche: v => String(v),
        calcul: () => ['À droite de la flèche, on lit : un noyau de strontium, un noyau de xénon, puis « 2 » devant le symbole du neutron.', 'Il y a donc 2 neutrons libérés.'],
        pieges: [[1, 'C’est le neutron de gauche, celui qui arrive sur l’uranium. On demande ceux qui sont libérés, à droite de la flèche.'], [3, 'Vous avez compté le neutron de gauche en plus des deux de droite.'], [0, 'Il y a bien des neutrons après la flèche : regardez le dernier terme.']],
        expl: 'À droite de la flèche : strontium 94, xénon 140 et « 2 » neutrons. Le neutron de gauche est celui qui déclenche la fission, il n’est pas libéré.', indice: 'Cherche le symbole du neutron après la flèche et le nombre écrit devant lui.' },
      retenirTitre: 'La fusion',
      retenir: <><FicheFusion />
        <ul style={liste}>
          <li><strong>Phrase-clé : fusion = on assemble.</strong> De petits noyaux (ici deux isotopes de l’hydrogène) donnent un noyau plus gros (l’hélium).</li>
          <li><strong>Dans les étoiles</strong>, dont le Soleil : l’hydrogène se transforme en hélium par fusion (en plusieurs étapes, plus complexes que l’exemple écrit) ; l’énergie libérée est rayonnée sous forme de lumière.</li>
        </ul>{renvoi}</> },
    { id: 'chaine', titre: 'De la fission à l’électricité', focus: ['scene'],
      texte: <>L’énergie libérée par la fission sert à produire de l’électricité. Dans le cœur du réacteur, les noyaux d’uranium se cassent. L’énergie libérée est transférée à de l’eau, qui devient de la vapeur. La vapeur fait tourner une turbine, qui entraîne un alternateur : celui-ci produit l’électricité. Le schéma, <strong>simplifié</strong>, montre cette chaîne ; la forme d’énergie de l’eau chauffée est cachée.</>,
      tache: { type: 'qcm', ...QCM.chaine },
      retenirTitre: 'La fission',
      retenir: <><FicheFission />
        <ul style={liste}>
          <li><strong>Phrase-clé : fission = on casse.</strong> Un neutron frappe un gros noyau d’uranium 235, qui se casse en deux noyaux plus petits et libère de l’énergie.</li>
          <li><strong>Dans une centrale</strong> : on utilise la fission, pas une combustion. L’uranium ne brûle pas : ses noyaux se cassent.</li>
        </ul>{renvoi}</> },
    { id: 'energie', titre: 'Casser un noyau ou brûler du charbon', focus: ['scene'],
      texte: <>Brûler du charbon est une transformation chimique : des atomes se réarrangent, les noyaux restent les mêmes. Casser un noyau d’uranium est une transformation nucléaire. Pour la même masse de combustible, une transformation nucléaire libère beaucoup plus d’énergie qu’une transformation chimique. Il n’y a pas de valeur à retenir : seulement cette idée.</>,
      tache: { type: 'qcm', ...QCM.energie },
      retenirTitre: 'La chaîne d’une centrale',
      retenir: <><FicheChaine />
        <ul style={liste}>
          <li><strong>Phrase-clé : nucléaire, thermique, mouvement, électrique.</strong> L’énergie change de forme à chaque étage de la centrale.</li>
          <li><strong>Exemple</strong> : la chaleur du réacteur transforme l’eau en vapeur ; la vapeur met la turbine en mouvement.</li>
        </ul>{renvoi}</> },
    { id: 'ecritures', titre: 'Reconnaître la nature d’une écriture', focus: ['scene'],
      texte: <>Une écriture permet de reconnaître la nature d’une transformation. Dans une transformation <strong>physique</strong>, la même formule est écrite des deux côtés, avec des états différents : (s), (l) ou (g). Dans une transformation <strong>chimique</strong>, les formules de molécules changent, mais les atomes sont les mêmes. Dans une transformation <strong>nucléaire</strong>, on écrit des symboles de noyaux, avec A et Z.
        <ExempleResolu>N₂(l) → N₂(g) : même formule, états différents, c’est une transformation physique. <EqNucleaireEnLigne r={R.dd} /> : des symboles de noyaux dont l’élément change, c’est une transformation nucléaire.</ExempleResolu>
        À vous : voici trois écritures.</>,
      tache: { type: 'qcm', ...QCM.ecritures } },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>Dans une transformation <strong>physique</strong>, les molécules sont les mêmes avant et après ; dans une transformation <strong>chimique</strong>, les molécules changent mais les atomes sont conservés ; dans une transformation <strong>nucléaire</strong>, les noyaux changent et l’élément aussi. Des <strong>isotopes</strong> ont le même Z et des A différents. Le Soleil brille grâce à la <strong>fusion</strong> ; une centrale utilise la <strong>fission</strong>. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'Reconnaître une écriture',
      retenir: <><FicheReconnaitre />
        <ul style={liste}>
          <li><strong>Phrase-clé : états, molécules ou noyaux ?</strong> Des états (s), (l), (g) : physique. Des molécules : chimique. Des noyaux avec A et Z : nucléaire.</li>
          <li><strong>Idée fausse</strong> : « une équation compliquée est forcément nucléaire ». <strong>Vrai</strong> : seuls les symboles de noyaux (A, Z) signalent une transformation nucléaire.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'isotopes') setDefi({ type, ...M.tirerDefiIsotopes(prec && prec.type === 'isotopes' ? prec : null), choix: [], verifie: false });
    else setDefi({ type, s: M.tirerSituation(prec && prec.type === 'nature' ? prec.s : null), rep: '', verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const basculer = k => setDefi(d => ({ ...d, choix: d.choix.includes(k) ? d.choix.filter(x => x !== k) : [...d.choix, k], verifie: false }));
  const verifier = () => {
    if (defi.type === 'isotopes') { const v = M.verifierIsotopes(defi, defi.choix); setDefi(d => ({ ...d, verifie: true, ok: v.ok, v })); noterI(v.ok); }
    else { const ok = defi.rep === defi.s.nature; setDefi(d => ({ ...d, verifie: true, ok })); noterN(ok); }
  };
  const nomK = k => { const [Z, A] = k.split('-').map(Number); return `${M.nomEl(Z)} ${A}`; };
  const messageIsotopes = d => {
    if (d.ok) return `✓ Correct : ${[...d.bonnes].map(nomK).join(', ')} ${d.bonnes.size > 1 ? 'ont' : 'a'} le même Z que ${M.nomNoyau(d.cible)} (Z${NB}=${NB}${d.cible.Z}) et un A différent.`;
    const dits = [];
    if (d.v.intrus.length) dits.push(`à retirer : ${d.v.intrus.map(nomK).join(', ')} (un autre élément : Z différent de ${d.cible.Z})`);
    if (d.v.manquants.length) dits.push(`il manque encore ${d.v.manquants.length} noyau${d.v.manquants.length > 1 ? 'x' : ''} : cherchez ceux qui ont le même Z que la cible`);
    return `✗ Pas encore : ${dits.join(' ; ')}.`;
  };
  const messageNature = d => {
    const bon = M.nature(d.s.nature);
    if (d.ok) return `✓ Correct : transformation ${bon.nom}. ${d.s.pourquoi}`;
    return `✗ Pas encore. ${d.rep ? `Ce n’est pas une transformation ${M.nature(d.rep).nom} : ` : ''}demandez-vous ce qui est conservé avant et après (les molécules, les atomes, les noyaux). Réponse : transformation ${bon.nom}. ${d.s.pourquoi}`;
  };
  const champDefiIsotopes = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Le noyau cible est <Nx Z={d.cible.Z} A={d.cible.A} />. Cochez <strong>tous les noyaux de la liste qui sont des isotopes</strong> de ce noyau.</div>
      <div role="group" aria-label="Noyaux de la liste" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 8 }}>
        {d.candidats.map(n => { const k = M.cle(n), on = d.choix.includes(k); return (
          <button key={k} onClick={() => basculer(k)} aria-pressed={on} aria-label={`noyau ${M.symbole(n)}`} style={{ minHeight: 52, fontSize: 20, borderRadius: 10, border: `2px solid ${on ? '#0369a1' : KIT.bord}`, background: on ? '#e0f2fe' : 'white', cursor: 'pointer', color: KIT.txt }}>
            <Nx Z={n.Z} A={n.A} /></button>); })}
      </div>
      <IndiceDefi cache={false}>Des isotopes ont le même Z (le nombre écrit en bas à gauche du symbole) : c’est le même élément. Seul le nombre de nucléons A est différent. Attention aux noyaux qui ont le même A que la cible, mais un autre Z.</IndiceDefi>
    </>);
  const champDefiNature = d => (
    <>
      <div style={{ marginBottom: 8 }}><SituationAffiche s={d.s} /></div>
      <label style={etiquette}>Nature de la transformation
        <select value={d.rep} onChange={e => setDefi(x => ({ ...x, rep: e.target.value, verifie: false }))} style={sel}>
          <option value="">— choisir —</option>{M.NATURES.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}</select></label>
      <IndiceDefi cache={false}>Demandez-vous ce qui est conservé : les molécules (physique), les atomes sans leurs molécules (chimique), ou rien de tout cela parce que les noyaux changent (nucléaire). Une écriture avec A et Z signale des noyaux.</IndiceDefi>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['isotopes', 'Trouver les isotopes'], ['nature', 'Reconnaître la nature']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'isotopes' ? 'Défi : les isotopes d’un noyau' : 'Défi : la nature d’une transformation'}</div>
      {defi.type === 'isotopes' ? champDefiIsotopes(defi) : champDefiNature(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="nu-verif" onClick={verifier} disabled={defi.type === 'nature' ? !defi.rep : !defi.choix.length} style={{ ...styleBouton(true, '#15803d'), opacity: (defi.type === 'nature' ? !defi.rep : !defi.choix.length) ? 0.5 : 1 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'isotopes' ? messageIsotopes(defi) : messageNature(defi)}</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Qualitatif</strong> : on identifie des isotopes, on reconnaît la nature d’une transformation, on relie l’énergie du Soleil et des centrales à des réactions nucléaires. Aucun calcul d’énergie, aucune valeur à retenir.</li>
      <li><strong>Schémas non à l’échelle</strong> : un noyau est environ 100 000 fois plus petit que son atome. Les noyaux sont dessinés « à plat », avec le bon nombre de protons (rouges) et de neutrons (blancs), mais leur taille et leur arrangement sont schématiques. Les neutrons de la fission sont agrandis.</li>
      <li><strong>Écritures à lire</strong> : les écritures de fusion et de fission sont données ; la simulation a vérifié que le nombre de nucléons A et le nombre de protons Z sont les mêmes avant et après. Vous n’avez pas à le démontrer.</li>
      <li><strong>Fusion</strong> : l’exemple écrit (deutérium et tritium) est plus simple que ce qui se passe dans le Soleil, où l’hydrogène se transforme en hélium en plusieurs étapes.</li>
      <li><strong>Fission</strong> : parmi les nombreuses issues possibles, deux sont écrites (strontium et xénon ; krypton et baryum). Le schéma d’une centrale est simplifié : on ne distingue pas les différents circuits d’eau.</li>
      <li><strong>Trois natures</strong> : physique (mêmes molécules : changement d’état, dissolution), chimique (molécules différentes, mêmes atomes), nucléaire (noyaux modifiés). C’est un classement de ce qui est conservé, pas une description complète.</li>
      <li><strong>Hors du parcours</strong> : déchets, sûreté, réaction en chaîne et désintégrations sont seulement évoqués dans « Au-delà du parcours » (exploration).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const sceneGuide = (() => {
    switch (idE) {
      case 'isotopes': return boite('Trois noyaux d’hydrogène (schéma non à l’échelle)', <SceneIsoH />, cadre('scene'));
      case 'memeA': return boite('Quatre noyaux', <SceneQuatre />, cadre('scene'));
      case 'physchim': return boite('Deux transformations', <ScenePhysChim />, cadre('scene'));
      case 'nucleaire': return boite('Fusion et fission (noyaux dessinés sans leur symbole)', <><SceneFusionFission />{legendeNoyaux}</>, cadre('scene'));
      case 'ecriture': return boite('Une réaction de fusion (schéma non à l’échelle)', <><SceneFusion />{legendeNoyaux}</>, cadre('scene'));
      case 'fission': return boite('Une réaction de fission (neutrons agrandis, schéma non à l’échelle)', <><SceneFission />{legendeNoyaux}</>, cadre('scene'));
      case 'chaine': return boite('Dans une centrale nucléaire (schéma simplifié)', <SceneChaine />, cadre('scene'));
      case 'energie': return boite('Deux combustibles', <SceneEnergie />, cadre('scene'));
      case 'ecritures': return boite('Trois écritures', <ListeEcritures />, cadre('scene'));
      case 'bilan': return boite('Les trois natures de transformation', <SceneBilan />, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const ELEM_EX = M.Z_LISTE.filter(Z => M.ISOTOPES[Z].length >= 2);
  const iso = M.isotopesDe(ex.Z), sit = M.situation(ex.sit), nat = M.nature(sit.nature), cons = M.CONSERVE[sit.nature];
  const rx = sit.reaction ? R[sit.reaction] : null, bil = rx ? M.bilan(rx) : null;
  const dessinSit = rx ? <DessinReaction id={rx.id} /> : sit.id === 'soleil' ? <DessinReaction id="dt" /> : sit.id === 'centrale' ? <DessinReaction id="fissionSr" /> : null;
  const noteDessin = !rx && dessinSit ? <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Exemple d’une réaction {sit.id === 'soleil' ? 'de fusion, plus simple que celles du Soleil' : 'de fission'}.</div> : null;
  const explorIsotopes = (
    <div style={{ ...styleBoite, marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Les isotopes d’un élément</div>
      <label style={etiquette}>Élément chimique
        <select value={ex.Z} onChange={e => setEx(s => ({ ...s, Z: Number(e.target.value) }))} style={sel}>{ELEM_EX.map(Z => <option key={Z} value={Z}>{M.nomEl(Z)} ({M.sym(Z)})</option>)}</select></label>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Choisissez un élément : ses isotopes naturels les plus courants sont dessinés avec leurs protons (rouges) et leurs neutrons (blancs). Schéma non à l’échelle : les noyaux lourds sont dessinés avec tous leurs nucléons, trop petits pour être comptés.</div>
      <RangeeIsotopes Z={ex.Z} />
      <div style={{ marginTop: 8 }}>
        <LigneMesure nom="Nombre de protons Z (le même pour tous)" valeur={String(ex.Z)} couleur={COL.proton} />
        <LigneMesure nom="Nombres de nucléons A" valeur={iso.map(n => n.A).join(` ; `)} />
      </div>
    </div>);
  const explorTransfo = (
    <div style={{ ...styleBoite, marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>La nature d’une transformation</div>
      <label style={etiquette}>Situation
        <select value={ex.sit} onChange={e => setEx(s => ({ ...s, sit: e.target.value }))} style={sel}>{M.SITUATIONS.map(s => <option key={s.id} value={s.id}>{s.court}</option>)}</select></label>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Choisissez une situation : la simulation donne sa nature, ce qui est conservé et pourquoi.</div>
      <SituationAffiche s={sit} />
      {dessinSit && <div style={{ marginTop: 8 }}>{dessinSit}{noteDessin}</div>}
      <div style={{ marginTop: 8 }}>
        <LigneMesure nom="Nature" valeur={nat.nom} couleur={sit.nature === 'nucleaire' ? COL.orange : sit.nature === 'chimique' ? COL.vert : COL.bleu} />
        <LigneMesure nom="Molécules avant et après" valeur={cons.molecules ? 'les mêmes' : 'différentes'} couleur={cons.molecules ? COL.vert : COL.rouge} />
        <LigneMesure nom="Atomes (éléments) avant et après" valeur={cons.atomes ? 'les mêmes' : 'différents'} couleur={cons.atomes ? COL.vert : COL.rouge} />
        <LigneMesure nom="Noyaux avant et après" valeur={cons.noyaux ? 'les mêmes' : 'différents'} couleur={cons.noyaux ? COL.vert : COL.rouge} />
        {bil && <>
          <LigneMesure nom="Nucléons A (avant → après)" valeur={`${bil.A[0]} → ${bil.A[1]}`} />
          <LigneMesure nom="Protons Z (avant → après)" valeur={`${bil.Z[0]} → ${bil.Z[1]}`} />
        </>}
      </div>
      <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6, lineHeight: 1.55 }}><strong>Pourquoi ?</strong> {sit.pourquoi}</div>
      {rx && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>La simulation a vérifié que A et Z sont les mêmes de chaque côté ; il n’y a rien à démontrer.</div>}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Choisissez le carbone, puis l’oxygène : combien d’isotopes chacun a-t-il ? Quel nombre reste le même ?</li>
      <li>Choisissez l’uranium : en quoi les noyaux dessinés se ressemblent-ils, en quoi diffèrent-ils ?</li>
      <li>Parmi les situations, lesquelles sont nucléaires ? Quel point commun ont leurs lignes « Noyaux avant et après » ?</li>
      <li>Comparez « Du méthane qui brûle » et « Le cœur du Soleil » : qu’est-ce qui est conservé dans l’un et pas dans l’autre ?</li>
      <li>Pour une réaction nucléaire, regardez les lignes « Nucléons A » et « Protons Z » : que remarquez-vous ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>isotopes : même Z (même élément), A différent</li>
        <li>physique : mêmes molécules ; chimique : mêmes atomes ; nucléaire : les noyaux changent</li>
        <li>fusion : de petits noyaux s’assemblent (étoiles, dont le Soleil) ; fission : un gros noyau se casse (centrales)</li>
        <li>une écriture avec des symboles de noyaux (A et Z) est nucléaire</li>
        <li>un noyau libère bien plus d’énergie qu’une molécule qui brûle</li>
      </ul>
    </ARetenir>);
  const auDela = (
    <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.6 }}>
      <div style={{ color: KIT.txt2, marginBottom: 6 }}>Au-delà du parcours : ces notions ne sont pas à connaître en Seconde (aucune question).</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li><strong>Déchets et sûreté</strong> : les noyaux produits par la fission sont souvent radioactifs. Ils forment des déchets qu’il faut stocker en sécurité pendant très longtemps. Une centrale est entourée de dispositifs de sûreté.</li>
        <li><strong>Réaction en chaîne</strong> : les neutrons libérés par une fission peuvent en provoquer d’autres. Dans un réacteur, on contrôle leur nombre pour que la puissance reste stable.</li>
        <li><strong>Ordre de grandeur</strong> : par kilogramme de combustible, la fission de l’uranium 235 libère plusieurs millions de fois plus d’énergie que la combustion du charbon (à ne pas retenir ; ce chiffre suppose que tous les noyaux se cassent, ce qui n’est pas le cas dans un réacteur).</li>
        <li><strong>Radioactivité</strong> : certains noyaux instables se désintègrent tout seuls en émettant une particule. Les équations de désintégration et la demi-vie sont au programme de Terminale.</li>
        <li><strong>Dans le Soleil</strong> : la fusion de l’hydrogène en hélium se fait en plusieurs étapes (des protons s’assemblent, ce qui est plus complexe que l’exemple écrit). La fusion du deutérium et du tritium est étudiée sur Terre pour produire de l’énergie.</li>
      </ul>
    </div>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .nu-math math { font-family: 'Nunito', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif !important; font-size: 1.15em; }
        .nu-l1 math, .nu-math math { color: #0f172a; }
        .nu-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .nu-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .nu-l1.cote .nu-carte { order: 2; } .nu-l1.cote .nu-main { order: 1; } }
        @media (max-width: 900px) { .nu-l1.cote { grid-template-columns: minmax(0, 1fr); } .nu-l1.cote .nu-main { order: 1; } .nu-l1.cote .nu-carte { order: 2; } .nu-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .nu-in { animation: nu-fondu 0.35s ease-out; } @keyframes nu-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Transformation nucléaire : isotopes, Soleil et centrales</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Dans une transformation <strong>nucléaire</strong>, ce sont les <strong>noyaux</strong> des atomes qui changent. Ici, tout est qualitatif et les schémas ne sont pas à l’échelle (un noyau est environ 100{NB}000 fois plus petit que son atome) : aucun calcul d’énergie n’est demandé.</div>
      {enExplore ? <>
        {explorIsotopes}
        {explorTransfo}
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Au-delà du parcours" ouvert={!!ex.ouv.audela} onBascule={() => ouvrir('audela')}>{auDela}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`nu-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="nu-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="nu-carte nu-hypo-defi">{panneauHypo}</div> : null}
          <div className="nu-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'isotopes' ? suiviI : suiviN} /></div>}
            {enGuide && <div className="nu-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
