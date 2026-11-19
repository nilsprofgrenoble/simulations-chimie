import { useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, IndiceDefi, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./couleursModele";
import { QCM } from "./couleursQcm";
import { C, texteSur } from "./couleursStyle";
import { Disques, BandesTrois, ScenePixels, SceneOeil, SceneObjet, SceneFiltres, ModelesDeux } from "./couleursScenes";
import { SvgAdditive, SvgComplementaires, SvgSoustractive, SvgModeles, SvgObjet, SvgPhenomenes } from "./couleursSchemas";

const SIM_ID = 160, CLE_GUIDE = 'couleurs-1g-guide-v1';
declarerDefis(SIM_ID, [['programme', 'Prévoir la couleur perçue d’un objet éclairé'], ['noir', 'Rendre un objet noir avec la bonne lumière'], ['hors', 'Au-delà du programme : doser trois lampes pour une nuance']]);

// ====================================================
//  SIM 160 — COULEURS (1G spé PC, thème « Ondes et signaux », partie « Couleurs » ; hors lentille).
//  Une seule idée : prévoir une couleur avec le bon modèle (synthèse additive pour des lumières qui s'ajoutent, soustractive pour des filtres,
//  encres ou objets qui retirent des radiations), puis la couleur perçue d'un objet à partir de la lumière reçue et de l'absorption, la diffusion
//  et la transmission. MODÈLE À TROIS BANDES (rouge, vert, bleu) : voir couleursModele.js (testé) et le panneau d'hypothèses.
//  Parcours : 12 étapes (œil, synthèse additive, couleurs complémentaires, filtres et synthèse soustractive, choix du modèle, objet opaque en
//  lumière blanche puis colorée, verre transparent, citron noir). La simulation Beer-Lambert (10) traite l'absorption quantitative : lien seulement.
//  Capacités visées (jamais affichées à l'élève) : choisir le modèle de la synthèse additive ou soustractive selon la situation ; interpréter la couleur
//  perçue d'un objet à partir de la lumière incidente et des phénomènes d'absorption, de diffusion et de transmission ; prévoir le résultat de la
//  superposition de lumières colorées et l'effet de filtres colorés ; illustrer les synthèses et la couleur des objets.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const CV = M.COULEURS;
const BLANC = [1, 1, 1], NOIR = [0, 0, 0];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const NOMS_PERCUS = ['noir', 'rouge', 'vert', 'bleu', 'jaune', 'cyan', 'magenta', 'blanc'];
const tire = t => t[Math.floor(Math.random() * t.length)];
const intens = p => p.map(x => x / 100);
// couleurs de lumières proposées à l'étape des complémentaires
const CHOIX_COMPL = [['rouge', 'rouge'], ['vert', 'verte'], ['jaune', 'jaune'], ['cyan', 'cyan'], ['magenta', 'magenta']];
const FILTRES_GUIDE = [['jaune', 'filtre jaune'], ['cyan', 'filtre cyan'], ['magenta', 'filtre magenta']];

// tirages des défis
const OBJETS_DEFI = M.OBJETS.filter(o => !['papier', 'ardoise'].includes(o.id));
function tirerProgramme(exclu) {
  for (let k = 0; k < 40; k++) { const o = tire(OBJETS_DEFI), l = tire(M.LUMIERES); if (!exclu || exclu.o !== o.id || exclu.l !== l.id) return { o: o.id, l: l.id }; }
  return { o: OBJETS_DEFI[0].id, l: 'blanche' };
}
const tirerNoir = exclu => tire(OBJETS_DEFI.filter(o => o.id !== exclu));
const tirerCible = exclu => tire(M.CIBLES.filter(c => c.id !== exclu));

// ====================================================
export function SimulationCouleurs() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviN, noterN] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('programme');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [lg, setLg] = useState([false, false, false]), [vus, setVus] = useState([]);
  const [cb, setCb] = useState('rouge');
  const [ft, setFt] = useState('jaune'), [fvus, setFvus] = useState(['jaune']);
  const [ex, setEx] = useState({ lum: [100, 100, 100], obj: 'citron', ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  const IDS = ['oeil', 'rv', 'lampes', 'pixels', 'compl', 'filtres', 'superpose', 'modele', 'opaque', 'coloree', 'verre', 'ballon'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const reussie = !!(guide.reussies && guide.reussies[etape]);

  // ---------- réglages des étapes ----------
  const lampesVec = lg.map((on, i) => (on ? [CV.rouge, CV.vert, CV.bleu][i] : NOIR));
  const centre = M.nomCouleur(M.additif(...lampesVec));
  const basculer = i => {
    const n = lg.map((x, k) => (k === i ? !x : x));
    const nom = M.nomCouleur(M.additif(...n.map((on, k) => (on ? [CV.rouge, CV.vert, CV.bleu][k] : NOIR))));
    setLg(n);
    setVus(v => (v.includes(nom) ? v : [...v, nom]));
  };
  const OBJECTIF = ['jaune', 'cyan', 'magenta', 'blanc'];
  const lampesOk = OBJECTIF.every(n => vus.includes(n));
  const complNom = M.nomCouleur(M.additif(CV.bleu, CV[cb]));
  const complOk = complNom === 'blanc';
  const choisirFiltre = f => { setFt(f); setFvus(v => (v.includes(f) ? v : [...v, f])); };
  const filtresOk = FILTRES_GUIDE.every(([f]) => fvus.includes(f));
  const J = CV.jaune, Cy = CV.cyan;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'oeil', titre: 'L’œil et la couleur', focus: ['scene'],
      texte: <><strong>Pour comprendre</strong> (au-delà des capacités exigibles) : la rétine, au fond de l’œil, contient des cellules sensibles à la lumière. Les <strong>bâtonnets</strong> servent surtout quand il fait sombre et ne distinguent pas les couleurs. Les <strong>cônes</strong> servent en pleine lumière : il en existe <strong>trois types</strong>, qui réagissent surtout au rouge, au vert ou au bleu. (Schéma simplifié, pas à l’échelle.)</>,
      tache: { type: 'qcm', ...QCM.oeil } },
    { id: 'rv', titre: 'Deux lampes sur un écran', focus: ['scene'],
      texte: <>Dans une pièce sans autre lumière, une <strong>lampe rouge</strong> et une <strong>lampe verte</strong> éclairent le même écran blanc, à pleine puissance. Leurs deux disques lumineux se <strong>superposent</strong> au centre.</>,
      tache: { type: 'qcm', ...QCM.rv } },
    { id: 'lampes', titre: 'Trois lampes à régler', focus: ['scene'],
      texte: <>On ajoute une <strong>lampe bleue</strong>. Allume ou éteins les trois lampes avec les boutons sous le dessin et regarde la couleur de la zone au centre, là où les trois disques se superposent. Il reste à obtenir du jaune, du cyan, du magenta et du blanc. On résume toute lumière par trois radiations : rouge, vert, bleu (modèle simplifié).</>,
      tache: { type: 'action', ok: lampesOk, consigne: 'Obtiens successivement du jaune, du cyan, du magenta et du blanc au centre.' } },
    { id: 'pixels', titre: 'Au microscope, un écran', focus: ['scene'],
      texte: <>Vu de très près, un écran de télévision est un quadrillage de <strong>pixels</strong>, chacun formé de trois <strong>sous-pixels</strong> : un rouge, un vert, un bleu. À distance normale, l’œil ne les distingue plus et perçoit leur somme. Une zone de l’écran affiche du <strong>jaune</strong>.</>,
      tache: { type: 'qcm', ...QCM.pixels } },
    { id: 'compl', titre: 'Deux lumières qui font du blanc', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA SYNTHÈSE ADDITIVE',
      retenir: <>
        <SvgAdditive/>
        <ul style={liste}>
          <li><strong>Synthèse additive</strong> : on ajoute des lumières (écrans, projecteurs). Primaires : <strong>rouge, vert, bleu</strong>.</li>
          <li>Exemple : rouge + vert = jaune ; les trois ensemble = blanc ; aucune lumière = noir.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « additive : on ajoute, on éclaircit ».</li>
          <li><strong>Idée fausse</strong> : « rouge + vert = marron, comme avec des peintures ». <strong>Vrai</strong> : avec des lumières, rouge + vert = jaune.</li>
        </ul></>,
      texte: <>Deux lumières colorées sont dites <strong>complémentaires</strong> quand leur superposition donne du <strong>blanc</strong>. Un écran est éclairé par une lumière <strong>bleue</strong> et par une seconde lumière dont tu choisis la couleur. Trouve celle qui donne du blanc.</>,
      tache: { type: 'action', ok: complOk, consigne: 'Choisis la seconde lumière pour que la zone commune soit blanche.' } },
    { id: 'filtres', titre: 'Un filtre devant la lampe', focus: ['scene'],
      retenirTitre: 'À RETENIR : COULEURS COMPLÉMENTAIRES',
      retenir: <>
        <SvgComplementaires/>
        <ul style={liste}>
          <li>Deux couleurs sont <strong>complémentaires</strong> si leurs lumières, ajoutées, donnent du blanc : rouge–cyan, vert–magenta, bleu–jaune.</li>
          <li>Exemple : bleu + jaune (= rouge + vert) = rouge + vert + bleu = blanc.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « la complémentaire d’une primaire, ce sont les deux autres ensemble ».</li>
          <li><strong>Idée fausse</strong> : « la complémentaire du bleu est le rouge ». <strong>Vrai</strong> : c’est le jaune (rouge + vert).</li>
        </ul></>,
      texte: <>Un <strong>filtre coloré</strong> est une plaque transparente qui laisse passer certaines radiations et <strong>absorbe</strong> les autres. On le place devant une lampe de lumière blanche (rouge + vert + bleu). Essaie les trois filtres et compare la lumière reçue et la lumière transmise.</>,
      tache: { type: 'action', ok: filtresOk, consigne: 'Essaie le filtre jaune, le filtre cyan et le filtre magenta.' } },
    { id: 'superpose', titre: 'Deux filtres l’un derrière l’autre', focus: ['scene'],
      texte: <>Un filtre jaune laisse passer le rouge et le vert. Un filtre cyan laisse passer le vert et le bleu. On place le filtre jaune, puis le filtre cyan, sur le trajet d’une lumière blanche.</>,
      tache: { type: 'qcm', ...QCM.superpose } },
    { id: 'modele', titre: 'Quel modèle choisir ?', focus: ['scene'],
      texte: <>Pour prévoir une couleur, on choisit un modèle : on <strong>additionne</strong> des lumières émises (synthèse additive) ou on <strong>retire</strong> des radiations à une lumière blanche (synthèse soustractive).</>,
      tache: { type: 'qcm', ...QCM.modele } },
    { id: 'opaque', titre: 'Une tomate en lumière blanche', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA SYNTHÈSE SOUSTRACTIVE',
      retenir: <>
        <SvgSoustractive/>
        <ul style={liste}>
          <li><strong>Synthèse soustractive</strong> : filtres, encres ou peintures <strong>retirent</strong> des radiations à une lumière blanche. Primaires : <strong>cyan, magenta, jaune</strong>.</li>
          <li>Exemple : jaune + cyan = vert ; les trois = noir.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « soustractive : on retire, on assombrit ».</li>
          <li><strong>Idée fausse</strong> : « deux filtres donnent plus de lumière qu’un seul ». <strong>Vrai</strong> : chaque filtre ajouté laisse passer moins de lumière.</li>
        </ul></>,
      texte: <>Une tomate éclairée en lumière blanche paraît <strong>rouge</strong>. La lumière blanche contient du rouge, du vert et du bleu. Un objet opaque <strong>absorbe</strong> une partie de la lumière reçue et <strong>diffuse</strong> le reste dans toutes les directions : c’est la lumière diffusée qui arrive à l’œil. Dans notre modèle simplifié, chaque radiation (rouge, vert, bleu) est soit entièrement diffusée, soit entièrement absorbée.</>,
      tache: { type: 'qcm', ...QCM.opaque } },
    { id: 'coloree', titre: 'Un citron sous une lumière rouge', focus: ['scene'],
      retenirTitre: 'À RETENIR : CHOISIR LE MODÈLE',
      retenir: <>
        <SvgModeles/>
        <ul style={liste}>
          <li>Source qui <strong>émet</strong> de la lumière : synthèse <strong>additive</strong> (R, V, B). Matière qui <strong>absorbe</strong> de la lumière blanche : synthèse <strong>soustractive</strong> (C, M, J).</li>
          <li>Exemple : un écran de téléphone s’explique en additif ; une imprimante (cyan, magenta, jaune, noir) en soustractif.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « je regarde une source : j’additionne ; je regarde une surface : je soustrais ».</li>
          <li><strong>Idée fausse</strong> : « un seul modèle suffit pour toutes les situations ». <strong>Vrai</strong> : on choisit le modèle selon la situation.</li>
        </ul></>,
      texte: <>Un citron éclairé en lumière blanche paraît jaune : il diffuse le rouge et le vert, et absorbe le bleu. On l’éclaire maintenant avec une lampe qui n’envoie que du <strong>rouge</strong>, dans une pièce sans autre lumière.</>,
      tache: { type: 'qcm', ...QCM.coloree } },
    { id: 'verre', titre: 'Un verre coloré devant une lampe', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA COULEUR D’UN OBJET',
      retenir: <>
        <SvgObjet/>
        <ul style={liste}>
          <li>Lumière diffusée = lumière reçue <strong>moins</strong> lumière absorbée : l’œil ne voit que ce que l’objet <strong>renvoie</strong>. Un objet rouge diffuse le rouge et absorbe le vert et le bleu (dans le modèle idéal à trois bandes, il absorbe la complémentaire de sa couleur).</li>
          <li>Exemple : le citron (jaune) absorbe le bleu ; sous une lumière rouge, il paraît rouge.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « on ne voit que ce qui est renvoyé ».</li>
          <li><strong>Idée fausse</strong> : « un objet a une couleur propre, toujours la même ». <strong>Vrai</strong> : sa couleur dépend de la lumière qui l’éclaire.</li>
        </ul></>,
      texte: <>Un <strong>verre rouge</strong> est transparent : il <strong>transmet</strong> le rouge et absorbe le vert et le bleu. On l’éclaire avec une lampe qui n’envoie que du <strong>vert</strong>, puis on regarde de l’autre côté du verre.</>,
      tache: { type: 'qcm', ...QCM.verre } },
    { id: 'ballon', titre: 'Choisir une lampe pour un ballon', focus: ['scene'],
      retenirTitre: 'À RETENIR : ABSORPTION, DIFFUSION, TRANSMISSION',
      retenir: <>
        <SvgPhenomenes/>
        <ul style={liste}>
          <li><strong>Absorbée</strong> : l’énergie lumineuse est transformée en chaleur. <strong>Diffusée</strong> : renvoyée dans toutes les directions (on voit l’objet). <strong>Transmise</strong> : elle traverse un milieu transparent.</li>
          <li>Exemple : un verre vert transmet le vert et absorbe le rouge et le bleu.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « absorbé = chaleur, diffusé = vu, transmis = traversé ».</li>
          <li><strong>Idée fausse</strong> : « un filtre coloré ajoute de la couleur à la lumière ». <strong>Vrai</strong> : il ne fait que retirer des radiations.</li>
        </ul></>,
      texte: <>Un ballon paraît <strong>magenta</strong> en lumière blanche. On dispose de quatre lampes, qui n’envoient chacune qu’une seule couleur, et d’une pièce sans autre lumière. On veut que le ballon paraisse <strong>noir</strong>.</>,
      tache: { type: 'qcm', ...QCM.ballon } },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'noir') setDefi({ type, o: tirerNoir(defi && defi.o).id, choix: '', verifie: false, ok: false });
    else if (type === 'hors') { const c = tirerCible(defi && defi.cible); setDefi({ type, cible: c.id, reg: [0, 0, 0], verifie: false, ok: false }); }
    else setDefi({ type, ...tirerProgramme(defi && defi.type === 'programme' ? defi : null), choix: '', verifie: false, ok: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const objD = defi && defi.type !== 'hors' ? M.objet(defi.o) : null;
  const lumD = defi && defi.type === 'programme' ? M.lumiere(defi.l) : null;
  const cibleD = defi && defi.type === 'hors' ? M.CIBLES.find(c => c.id === defi.cible) : null;
  const percueD = defi && defi.type === 'programme' ? M.couleurPercue(lumD.v, objD.v) : null;
  const verifierDefi = () => {
    if (defi.type === 'programme') { const ok = defi.choix === percueD; setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok); }
    else if (defi.type === 'noir') { const ok = M.couleurPercue(M.lumiere(defi.choix).v, objD.v) === 'noir'; setDefi(d => ({ ...d, verifie: true, ok })); noterN(ok); }
    else { const ok = M.dosageJuste(defi.reg, cibleD.v); setDefi(d => ({ ...d, verifie: true, ok })); noterH(ok); }
  };
  const peutVerifier = defi && (defi.type === 'hors' ? defi.reg.some(x => x > 0) : !!defi.choix);
  const nomObjetBlanc = o => M.nomCouleur(o.v);
  const etiquette = (t, corps) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{t}{corps}</label>;
  const pastille = (c, texte, nomPastille, w = 110) => <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: w, height: 40, borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: M.rgb(c), fontSize: 13, fontWeight: 700, color: texteSur(c) }} role="img" aria-label={nomPastille}>{texte}</div>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['programme', 'Prévoir la couleur'], ['noir', 'Rendre l’objet noir'], ['hors', 'Au-delà du programme']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'programme' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle couleur perçue ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
          {cap(objD.nom)}, de couleur <strong>{nomObjetBlanc(objD)}</strong> en lumière blanche, est éclairé uniquement par une <strong>{lumD.nom}</strong>, dans une pièce sans autre lumière. De quelle couleur paraît-il ?</div>
        <SceneObjet lum={lumD.v} prop={objD.v} propBlanc={objD.v} forme={objD.forme} revele={defi.verifie} nom={objD.court} nomLampe={`lampe ${lumD.court}`}/>
        <div style={{ marginTop: 8 }}>{etiquette('Couleur perçue', <select value={defi.choix} onChange={x => setDefi(d => ({ ...d, choix: x.target.value, verifie: false }))} style={sel} aria-label="Couleur perçue"><option value="">Choisis…</option>{NOMS_PERCUS.map(n => <option key={n} value={n}>{n}</option>)}</select>)}</div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Écris les radiations (rouge, vert, bleu) que l’objet diffuse (il absorbe la complémentaire de sa couleur), puis celles que la lampe envoie. L’objet ne renvoie que les radiations qui sont dans les deux listes.</IndiceDefi>
      </>}
      {defi.type === 'noir' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : fais disparaître l’objet</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
          {cap(objD.nom)} paraît <strong>{nomObjetBlanc(objD)}</strong> en lumière blanche. Avec quelle lumière (une seule couleur à la fois, dans une pièce sans autre lumière) paraît-il <strong>noir</strong> ?</div>
        <div style={{ marginBottom: 8 }}>{etiquette('Lumière à utiliser', <select value={defi.choix} onChange={x => setDefi(d => ({ ...d, choix: x.target.value, verifie: false }))} style={sel} aria-label="Lumière à utiliser"><option value="">Choisis…</option>{M.LUMIERES.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}</select>)}</div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>L’objet absorbe la complémentaire de sa couleur. Cherche une lumière qui ne contient que des radiations absorbées par l’objet.</IndiceDefi>
      </>}
      {defi.type === 'hors' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi au-delà du programme : doser les trois lampes</div>
        <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '5px 8px', marginBottom: 8, lineHeight: 1.5 }}><strong>Au-delà du programme</strong> : le cours traite les lumières primaires à pleine puissance ; ici, on règle aussi des intensités intermédiaires.</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Une lampe rouge, une verte et une bleue éclairent un écran blanc. Règle leurs intensités (à 10 % près) pour obtenir la couleur cible.</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Couleur cible</div>{pastille(intens(cibleD.v), '', `Couleur cible : ${cibleD.nom}`, 110)}<div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 2 }}>{cibleD.nom}</div></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Ton mélange</div>{pastille(intens(defi.reg), '', 'Ton mélange', 110)}</div>
        </div>
        {['rouge', 'verte', 'bleue'].map((n, i) => <Curseur key={n} nom={`Lampe ${n}`} valeur={defi.reg[i]} min={0} max={100} pas={10} unite="%" couleur={C.bandes[i]} onChange={v => setDefi(d => ({ ...d, reg: d.reg.map((x, k) => (k === i ? v : x)), verifie: false }))}/>)}
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Chaque lampe apporte sa part de la couleur : une couleur très claire ou grisée contient un peu des trois lampes ; un orange contient beaucoup de rouge, un peu de vert et pas de bleu.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="co-verif" onClick={verifierDefi} disabled={!peutVerifier} style={{ ...styleBouton(true, '#15803d'), opacity: peutVerifier ? 1 : 0.5 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouvelle question</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
        {defi.type === 'programme' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : {percueD}. <span style={{ fontWeight: 400, color: KIT.txt }}>{M.phrase(lumD.v, objD.v, false)}</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>Compare les radiations envoyées par la lampe avec celles que l’objet diffuse : l’objet ne renvoie que les radiations communes aux deux.</span></div>)}
        {defi.type === 'noir' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct. <span style={{ fontWeight: 400, color: KIT.txt }}>{cap(objD.court)} absorbe {M.listeBandes(M.complementaire(objD.v))} ; sous la {M.lumiere(defi.choix).nom}, il ne diffuse rien. Autres bonnes réponses possibles : {M.lumieresNoires(objD).filter(l => l.id !== defi.choix).map(l => l.nom).join(', ') || 'aucune'}.</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore : sous la {M.lumiere(defi.choix).nom}, l’objet paraît {M.couleurPercue(M.lumiere(defi.choix).v, objD.v)}. <span style={{ fontWeight: 400, color: KIT.txt }}>Cherche une lumière dont toutes les radiations sont absorbées.</span></div>)}
        {defi.type === 'hors' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : la cible est obtenue avec environ {cibleD.v[0]} % de rouge, {cibleD.v[1]} % de vert et {cibleD.v[2]} % de bleu.</div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore : compare les deux pastilles et ajuste une lampe à la fois.</div>)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle à trois bandes</strong> : toute lumière est résumée par trois intensités (rouge R, vert V, bleu B, entre 0 et 1). Les vrais spectres sont <strong>continus</strong> (de 400 à 800 nm environ) ; ici, on garde trois zones seulement : bleu vers 400–500 nm, vert vers 500–600 nm, rouge vers 600–800 nm (repères approximatifs).</li>
      <li><strong>Objets et filtres idéaux</strong> : on suppose qu’une bande est soit entièrement renvoyée (ou transmise), soit entièrement absorbée. Un vrai objet renvoie un peu de toutes les radiations : un citron sous une lumière bleue paraît très sombre, pas parfaitement noir.</li>
      <li><strong>Couleurs de l’écran</strong> : les couleurs affichées par le simulateur sont une <strong>illustration</strong>. Elles ne reproduisent pas exactement les couleurs réelles et varient d’un écran à l’autre.</li>
      <li><strong>Couleur perçue</strong> : elle dépend aussi de l’œil et du cerveau. Un jaune obtenu en ajoutant du rouge et du vert n’a pas le même spectre qu’un jaune formé d’une seule radiation, mais l’œil perçoit une couleur identique. Les bâtonnets, l’adaptation à la lumière et le daltonisme ne sont pas traités.</li>
      <li><strong>Lumière blanche</strong> : on la représente par les trois bandes à égale intensité (blanc idéal). Les lampes sont supposées pures (une seule bande, ou une somme de bandes).</li>
      <li><strong>Diffusion</strong> : on suppose l’objet opaque et mat ; on ne tient pas compte des reflets brillants ni de l’angle d’observation. Dans un verre, on néglige la diffusion.</li>
      <li><strong>Au-delà du programme</strong> (exploration et dernier défi seulement) : les intensités intermédiaires, qui donnent des nuances (orange, rose, gris…). L’échelle d’intensité est linéaire ici ; la perception réelle de la luminosité ne l’est pas.</li>
      <li><strong>Absorption quantitative</strong> : la dépendance de l’absorption avec la concentration (loi de Beer-Lambert) est traitée dans la <a href="?sim=10">simulation Beer-Lambert</a>.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const bandesObjet = (lum, prop, transparent, rev) => {
    const b = M.bilan(lum, prop);
    return <div style={{ marginTop: 8 }}><BandesTrois groupes={[{ titre: 'Reçue', v: b.recue }, { titre: 'Absorbée', v: rev ? b.absorbee : null }, { titre: transparent ? 'Transmise' : 'Diffusée', v: rev ? b.renvoyee : null }]}/></div>;
  };
  const boutonsCouleur = (liste, courant, onChoix, vusListe) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {liste.map(([id, nom]) => <button key={id} onClick={() => onChoix(id)} aria-pressed={courant === id} style={{ ...styleBouton(courant === id, '#0369a1'), minHeight: 42 }}>{vusListe && vusListe.includes(id) && courant !== id ? '✓ ' : ''}{nom}</button>)}
    </div>);
  const sceneGuide = (() => {
    if (!idE) return null;
    if (idE === 'oeil') return boite('Dans l’œil', <><SceneOeil/>{aide('Schéma simplifié, pas à l’échelle.')}</>, cadre('scene'));
    if (idE === 'rv') return boite('Deux lampes, un écran', <><Disques id="g-rv" sources={[CV.rouge, CV.vert]} noms={['lampe rouge', 'lampe verte']} masque={!reussie} hauteur={236} label="Une lampe rouge et une lampe verte éclairent un écran blanc : les deux disques se superposent ; la couleur de la zone commune est à trouver."/>
      {aide(reussie ? 'Écran blanc, pièce dans le noir : dans la zone commune, les deux lumières arrivent ensemble à l’œil.' : 'Écran blanc, pièce dans le noir. La zone commune est cachée (?) jusqu’à ta réponse.')}</>, cadre('scene'));
    if (idE === 'lampes') return boite('Trois lampes sur un écran', <>
      <Disques id="g-3" sources={lampesVec} noms={['lampe rouge', 'lampe verte', 'lampe bleue']} label="Trois lampes rouge, verte et bleue éclairent un écran blanc ; les disques se superposent."/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {['rouge', 'verte', 'bleue'].map((n, i) => <button key={n} onClick={() => basculer(i)} aria-pressed={lg[i]} style={{ ...styleBouton(lg[i], C.bandes[i]), minHeight: 42 }}>Lampe {n} : {lg[i] ? 'allumée' : 'éteinte'}</button>)}
        <button onClick={() => setLg([false, false, false])} style={{ ...styleBouton(false), minHeight: 42 }}>Rétablir</button>
      </div>
      <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>Couleur au centre (zone commune des lampes allumées) : <strong>{centre}</strong>. Trouvées : {OBJECTIF.map(n => `${vus.includes(n) ? '✓' : '○'} ${n}`).join(', ')}.</div></>, cadre('scene'));
    if (idE === 'pixels') return boite('Quatre pixels vus à la loupe', <><ScenePixels cible={CV.jaune} revele={reussie}/>{aide(reussie ? 'Les sous-pixels allumés sont en couleur, les éteints sont sombres.' : 'L’état des sous-pixels est caché (gris) jusqu’à ta réponse.')}</>, cadre('scene'));
    if (idE === 'compl') return boite('Une lumière bleue et une lumière à choisir', <>
      <Disques id="g-c" sources={[CV.bleu, CV[cb]]} noms={['lumière bleue', `lumière ${CHOIX_COMPL.find(c => c[0] === cb)[1]}`]} hauteur={236} label="Une lumière bleue et une seconde lumière choisie éclairent un écran blanc : on observe la couleur de la zone commune."/>
      {boutonsCouleur(CHOIX_COMPL, cb, setCb)}
      <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: complOk ? '#15803d' : KIT.txt, fontWeight: complOk ? 700 : 400 }}>Couleur de la zone commune : <strong>{complNom}</strong>.{complOk ? ' La lumière choisie est la complémentaire du bleu.' : ''}</div></>, cadre('scene'));
    if (idE === 'filtres') { const f = CV[ft], sortie = M.traverse(BLANC, f); return boite('Un filtre sur une lumière blanche', <>
      <SceneFiltres filtres={[f]} noms={[`filtre ${ft}`]}/>
      {boutonsCouleur(FILTRES_GUIDE, ft, choisirFiltre, fvus)}
      <div style={{ marginTop: 8 }}><BandesTrois groupes={[{ titre: 'Reçue', v: BLANC }, { titre: 'Transmise', v: sortie }]}/></div>
      <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>Le filtre {ft} laisse passer : <strong>{M.listeBandes(sortie)}</strong> ; il absorbe : <strong>{M.listeBandes(M.absorbe(BLANC, f))}</strong>. R = rouge, V = vert, B = bleu.</div></>, cadre('scene')); }
    if (idE === 'superpose') return boite('Deux filtres sur le trajet de la lumière', <><SceneFiltres filtres={[J, Cy]} noms={['filtre jaune', 'filtre cyan']} revele={reussie}/>{aide(reussie ? 'Seule la radiation transmise par les deux filtres arrive jusqu’à l’écran.' : 'La couleur qui sort du second filtre est cachée (?) jusqu’à ta réponse.')}</>, cadre('scene'));
    if (idE === 'modele') return boite('Deux façons de former une couleur', <ModelesDeux/>, cadre('scene'));
    if (idE === 'opaque') return boite('Une tomate éclairée en lumière blanche', <><SceneObjet lum={BLANC} prop={M.objet('tomate').v} propBlanc={M.objet('tomate').v} forme="rond" revele={reussie} nom="tomate" nomLampe="lampe blanche"/>{bandesObjet(BLANC, M.objet('tomate').v, false, reussie)}</>, cadre('scene'));
    if (idE === 'coloree') return boite('Un citron éclairé en rouge', <><SceneObjet lum={CV.rouge} prop={M.objet('citron').v} propBlanc={M.objet('citron').v} forme="citron" revele={reussie} nom="citron" nomLampe="lampe rouge"/>{bandesObjet(CV.rouge, M.objet('citron').v, false, reussie)}</>, cadre('scene'));
    if (idE === 'verre') return boite('Un verre rouge éclairé en vert', <><SceneObjet lum={CV.vert} prop={CV.rouge} propBlanc={CV.rouge} transparent revele={reussie} nom="verre rouge" nomLampe="lampe verte"/>{bandesObjet(CV.vert, CV.rouge, true, reussie)}</>, cadre('scene'));
    if (idE === 'ballon') return boite('Un ballon éclairé en lumière blanche', <><SceneObjet lum={BLANC} prop={M.objet('ballon-magenta').v} propBlanc={M.objet('ballon-magenta').v} forme="ballon" revele={reussie} nom="ballon magenta" nomLampe="lampe blanche"/>{bandesObjet(BLANC, M.objet('ballon-magenta').v, false, reussie)}</>, cadre('scene'));
    return null;
  })();

  // ════════════════ EXPLORATION ════════════════
  const setE = f => setEx(s => ({ ...s, ...f }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const lumX = intens(ex.lum);
  const presetX = M.LUMIERES.find(l => l.v.every((x, i) => Math.round(x * 100) === ex.lum[i]));
  const eteinte = ex.lum.every(x => x === 0);
  const opaqueX = M.objet(ex.obj), verreX = M.verre(ex.obj), transX = !!verreX;
  const propX = transX ? verreX.v : opaqueX.v, nomX = transX ? verreX.court : opaqueX.court;
  const bX = M.bilan(lumX, propX);
  const exReglages = (<>
    {etiquette('Lumière envoyée', <select value={eteinte ? 'eteinte' : presetX ? presetX.id : 'perso'} onChange={x => { const v = x.target.value; if (v === 'eteinte') setE({ lum: [0, 0, 0] }); else if (v !== 'perso') setE({ lum: M.lumiere(v).v.map(y => y * 100) }); }} style={sel} aria-label="Lumière envoyée">
      {M.LUMIERES.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}<option value="eteinte">aucune lumière</option>{!presetX && !eteinte && <option value="perso">réglage personnalisé</option>}</select>)}
    {etiquette('Objet ou verre éclairé', <select value={ex.obj} onChange={x => setE({ obj: x.target.value })} style={sel} aria-label="Objet ou verre éclairé">
      <optgroup label="Objets opaques">{M.OBJETS.map(o => <option key={o.id} value={o.id}>{o.court}</option>)}</optgroup>
      <optgroup label="Verres et filtres transparents">{M.VERRES.map(o => <option key={o.id} value={o.id}>{o.court}</option>)}</optgroup></select>)}
    {aide('Choisis une lumière et un objet : le dessin montre la lumière reçue, absorbée et renvoyée par l’objet, et la couleur perçue.')}
    <div style={{ marginTop: 8 }}><Section titre={`Régler chaque lampe (${ex.lum.join(" / ")} %)`} ouvert={!!ex.ouv.lampes} onBascule={() => ouvrir('lampes')}>
      {aide('La lumière envoyée est la somme de trois lampes (rouge, verte, bleue). Une intensité intermédiaire donne une nuance (hors programme).')}
      {['rouge', 'verte', 'bleue'].map((n, i) => <Curseur key={n} nom={`Lampe ${n}`} valeur={ex.lum[i]} min={0} max={100} pas={10} unite="%" couleur={C.bandes[i]} onChange={v => setE({ lum: ex.lum.map((x, k) => (k === i ? v : x)) })}/>)}
    </Section></div>
  </>);
  const exScene = (<>
    <SceneObjet lum={lumX} prop={propX} propBlanc={propX} forme={transX ? 'rond' : opaqueX.forme} transparent={transX} revele nom={nomX} nomLampe="lampe"/>
    <div style={{ marginTop: 8 }}><BandesTrois groupes={[{ titre: 'Reçue', v: bX.recue }, { titre: 'Absorbée', v: bX.absorbee }, { titre: transX ? 'Transmise' : 'Diffusée', v: bX.renvoyee }]}/></div>
    <div role="status" aria-live="polite" style={{ marginTop: 8, padding: '8px 10px', background: 'white', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, fontSize: 14.5, lineHeight: 1.55 }}>
      {M.phrase(lumX, propX, transX)}</div>
    {aide('R = rouge, V = vert, B = bleu. Les hauteurs montrent l’intensité de chaque bande (modèle simplifié). Les couleurs de l’écran sont une illustration, et les noms des nuances sont approximatifs.')}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Éclaire la tomate en lumière verte, puis en lumière jaune : que se passe-t-il ? Pourquoi ?</li>
      <li>Cherche toutes les lumières qui rendent le ballon cyan noir.</li>
      <li>Éclaire la feuille blanche avec la lumière jaune, puis règle les lampes (rouge et verte à fond, bleue à 0) : le résultat est-il le même ?</li>
      <li>Éclaire un filtre jaune, puis un filtre cyan, avec une lumière blanche : quelles radiations chacun laisse-t-il passer ? Essaie ensuite en lumière rouge.</li>
      <li>Au-delà du programme : règle chaque lampe à 50 % et éclaire la feuille blanche. Quelle nuance obtiens-tu ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir titre="À RETENIR : LA COULEUR D’UN OBJET">
      <SvgObjet/>
      <ul style={liste}>
        <li>Lumière diffusée = lumière reçue <strong>moins</strong> lumière absorbée. Un objet rouge diffuse le rouge et absorbe le vert et le bleu (dans le modèle idéal à trois bandes).</li>
        <li><strong>Moyen de s’en souvenir</strong> : « on ne voit que ce qui est renvoyé ».</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .co-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .co-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .co-hypo-defi { order: 2; } }
        .co-l1.cote .co-carte { order: 2; } .co-l1.cote .co-main { order: 1; }
        @media (min-width: 901px) { .co-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
          .co-ex { grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr); } .co-ex > .co-ex-scene { grid-column: 1; grid-row: 1; } .co-ex > .co-ex-reglages { grid-column: 2; grid-row: 1; } }
        @media (prefers-reduced-motion: no-preference) { .co-in { animation: co-fondu 0.35s ease-out; } @keyframes co-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Couleurs : lumières, filtres et couleur des objets</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {!enGuide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Pour prévoir une couleur, on choisit un modèle : on <strong>additionne</strong> des lumières (écrans, projecteurs) ou on <strong>retire</strong> des radiations à la lumière blanche (filtres, encres, objets). La couleur d’un objet dépend de la lumière qui l’éclaire.</div>}
      {enExplore ? <>
        <div className="co-ex">
          <div className="co-ex-reglages">{boite('Lumière et objet', exReglages)}</div>
          <div className="co-ex-scene">{boite(`Éclairage de : ${nomX}`, exScene)}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`co-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="co-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="co-carte co-hypo-defi">{panneauHypo}</div> : null}
          <div className="co-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'programme' ? suiviP : defi.type === 'noir' ? suiviN : suiviH}/></div>}
            {enGuide && <div className="co-in" key={idE}>{sceneGuide}</div>}
            {enGuide && (idE === 'ballon' || guide.fini) && <div style={{ marginTop: 12 }}>{panneauHypo}</div>}
          </div>
        </div>
      </>}
    </div>
  );
}
