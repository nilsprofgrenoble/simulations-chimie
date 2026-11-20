import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, ExempleResolu } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./niveauSonore2gtModele";
import { QCM } from "./niveauSonore2gtQcm";
import { FicheChaine, FicheEchelle, FichePlus10, FicheSources, FicheDistance, FicheDangers, FicheProtections, FicheSmartphone } from "./NiveauSonore2gtFiches";
import { EchelleDb, SceneAmplitude, SceneDeuxSonometres, SceneSources, SceneDistance, SceneDangers, SceneDurees, SceneConcert,
  SceneSmartphone, SceneEscalier, SceneSonometreFictif } from "./NiveauSonore2gtScenes";

const SIM_ID = 192, CLE_GUIDE = 'niveau-sonore-2gt-guide-v1';
declarerDefis(SIM_ID, [['classer', 'Classer des sons et comparer leurs intensités'], ['exposition', 'Cette exposition est-elle risquée ?']]);

// ====================================================
//  SIM 192 — NIVEAU SONORE ET DANGERS DE L'EXPOSITION (2GT, thème « Ondes et signaux », partie « Émission et perception d'un son »).
//  Une idée par étape : amplitude → intensité → niveau en dB (qualitatif) ; lire une échelle NON linéaire (+ 10 dB ≈ × 10, deux sources ≈ + 3 dB,
//  la distance atténue) ; dangers de l'exposition (fatigue auditive, acouphènes, surdité), durée d'exposition, protections ; mesurer avec un smartphone.
//  AUCUNE formule du niveau sonore, aucun logarithme affiché (hors programme de 2GT) : seulement des repères d'ordre de grandeur.
//  Capacités visées (jamais affichées à l'élève) : relier qualitativement intensité sonore et niveau d'intensité sonore ; exploiter une échelle de
//  niveau d'intensité sonore et citer les dangers inhérents à l'exposition sonore ; enregistrer et caractériser un son (niveau en dB) avec un smartphone.
//  Aucun son n'est produit (pas de Web Audio) : le « sonomètre » est fictif. Modèle : niveauSonore2gtModele.js (testé).
// ====================================================

const NB = ' ';
const nbf = M.nbf, marqueursSons = M.marqueursSons;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const entier = x => Math.round(x).toLocaleString('fr-FR').replace(/[\u202f\u00a0 ]/g, NB);
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const ID_POOL = ['chuchote', 'biblio', 'conv', 'aspi', 'rue', 'tondeuse', 'casque', 'avion'];
const COULEUR_VERDICT = { sous: '#15803d', dans: '#b45309', 'au-dessus': '#b91c1c', hors: '#991b1b', danger: '#7f1d1d' };
const FOND_VERDICT = { sous: '#f0fdf4', dans: '#fffbeb', 'au-dessus': '#fef2f2', hors: '#fef2f2', danger: '#fee2e2' };
// facteur d'intensité du sonomètre fictif : entier à partir de 10, sinon décimales françaises (0,25 ; 0,0039)
const facteurTxt = x => (x >= 10 ? entier(x) : x.toLocaleString('fr-FR', { maximumSignificantDigits: 2 }).replace(/[\u202f\u00a0 ]/g, NB));
const LIBELLE_VERDICT = { sous: 'Sous le repère de 85 dB pour cette durée ; moins fort, c’est toujours mieux', dans: 'Dans la durée repère : à ne pas répéter sans pause', 'au-dessus': 'Au-dessus de la durée repère : risque pour l’audition' };

// ====================================================
export function SimulationNiveauSonore2gt() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('classer');
  const [ex, setEx] = useState({ a: 10, n: 1, r: 1, jL: 85, jT: 60, ouv: { echelle: true } });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });

  // ---------- étapes du parcours ----------
  const IDS = ['amplitude', 'niveau', 'lire', 'plus10', 'inverse', 'deuxsources', 'distance', 'dangers', 'duree', 'protections', 'smartphone', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);

  const ETAPES = [
    { id: 'amplitude', titre: 'Un son plus ou moins fort', focus: ['scene'],
      texte: <>Un haut-parleur, une corde de guitare ou un diapason qui vibre fait vibrer l’air : c’est un son. L’<strong>amplitude</strong> est la taille de cette vibration : sur la courbe tracée par un micro, c’est la hauteur du dessin. L’<strong>intensité</strong> d’un son est l’énergie du son qui arrive à l’oreille : elle dit s’il est faible ou fort.
        <ExempleResolu>Une corde de guitare pincée doucement vibre peu : petite amplitude, son faible. Pincée fort, elle vibre beaucoup : grande amplitude, son plus fort. La note est la même (aiguë ou grave) : seule l’amplitude change.</ExempleResolu>
        À vous : trois sons C, D et E ont la même note, mais pas la même amplitude.</>,
      tache: { type: 'qcm', ...QCM.amplitude } },
    { id: 'niveau', titre: 'Mesurer la force d’un son : le décibel', focus: ['scene'],
      texte: <>Un <strong>sonomètre</strong> est un appareil qui mesure la force d’un son. Il affiche le <strong>niveau d’intensité sonore</strong> (ou niveau sonore), en <strong>décibels</strong>, de symbole <strong>dB</strong>. Plus le son est intense, plus ce nombre est grand.
        <ExempleResolu>Dans une bibliothèque, le sonomètre affiche 40{NB}dB. Quand un camion passe dans la rue, il affiche 80{NB}dB. Le son du camion est plus intense : son niveau en dB est plus grand.</ExempleResolu>
        À vous : un même haut-parleur, à la même distance du sonomètre, joue deux sons A et B.</>,
      tache: { type: 'qcm', ...QCM.niveau } },
    { id: 'lire', titre: 'Lire l’échelle des niveaux sonores', focus: ['scene'],
      retenirTitre: 'À retenir : du son au décibel', retenir: <FicheChaine/>,
      texte: <>Voici l’<strong>échelle des niveaux sonores</strong> : plus un son est haut sur l’échelle, plus il est fort. Le <strong>seuil d’audition</strong> est le niveau du son le plus faible que l’on puisse entendre : 0{NB}dB. Les valeurs de l’échelle sont des <strong>ordres de grandeur</strong> : elles varient d’une dizaine de dB selon les situations.
        <ExempleResolu>Le chuchotement est placé à 30{NB}dB et la conversation à 60{NB}dB. Comme 60 est plus grand que 30, la conversation est un son plus fort que le chuchotement.</ExempleResolu>
        À vous : l’aspirateur est placé sur l’échelle par le rond rouge. Les nombres écrits sont de 20{NB}dB en 20{NB}dB, avec un petit trait tous les 10{NB}dB.</>,
      tache: { type: 'num', q: 'Quel est le niveau sonore de l’aspirateur ?', carnet: 'Niveau sonore de l’aspirateur', unite: 'dB', vrai: 70, tol: 0.03, affiche: v => nbf(v, 0),
        calcul: () => ['Le rond rouge est entre les nombres 60 et 80, juste au milieu.', 'Le niveau de l’aspirateur est donc 70 dB (ordre de grandeur).'],
        pieges: [[60, 'C’est le niveau de la conversation. Le rond de l’aspirateur est un cran plus haut sur l’échelle.'], [80, 'C’est le nombre suivant. Regardez : le rond est entre 60 et 80, au milieu.'], [7, 'Vous avez oublié le zéro : les niveaux s’écrivent 60, 70, 80… : le rond est à 70, pas à 7.']],
        expl: 'Sur l’échelle, l’aspirateur est à 70 dB : un cran au-dessus de la conversation (60 dB).', indice: 'Repérez le rond rouge, puis suivez-le jusqu’à l’axe gradué : entre quels nombres se trouve-t-il ?' } },
    { id: 'plus10', titre: 'Une échelle qui multiplie : + 10 dB', focus: ['scene'],
      retenirTitre: 'À retenir : l’échelle des niveaux sonores', retenir: <FicheEchelle/>,
      texte: <>Attention : l’échelle des dB n’est pas régulière comme une règle. Le son qui fait mal (120{NB}dB) est <strong>mille milliards de fois</strong> plus intense que le plus faible que l’on entend (0{NB}dB) ! Les décibels « écrasent » ces écarts énormes. Repère : <strong>+ 10{NB}dB ≈ une intensité environ 10 fois plus grande</strong> (et non « 10 % de plus »).
        <ExempleResolu>De 30{NB}dB à 40{NB}dB, on ajoute 10{NB}dB : l’intensité est multipliée par 10. De 30{NB}dB à 50{NB}dB, on ajoute 10{NB}dB deux fois : 10 × 10 = <strong>100 fois</strong> plus intense.</ExempleResolu>
        À vous : un son passe de <strong>40{NB}dB à 70{NB}dB</strong>.</>,
      tache: { type: 'num', q: 'Par combien l’intensité du son a-t-elle été multipliée ?', carnet: 'Facteur d’intensité de 40 dB à 70 dB', unite: 'fois', vrai: 1000, tol: 0.01, affiche: v => entier(v),
        calcul: () => ['De 40 dB à 70 dB, on ajoute 30 dB, soit trois fois 10 dB.', 'Chaque + 10 dB multiplie l’intensité par 10 : 10 × 10 × 10 = 1000.'],
        pieges: [[30, 'Vous avez pris l’écart en dB (70 − 40 = 30) pour un nombre de fois. Chaque tranche de 10 dB multiplie l’intensité par 10.'], [3, 'Il y a bien 3 tranches de 10 dB, mais chacune multiplie par 10 : il faut calculer 10 × 10 × 10.'], [100, 'Vous avez compté 2 tranches de 10 dB ; il y en a 3 entre 40 et 70 : 10 × 10 × 10.'], [1.75, 'Vous avez divisé 70 par 40. Sur l’échelle des dB, on compte des tranches de 10 dB, chacune multipliant l’intensité par 10.']],
        expl: '70 − 40 = 30 dB = 3 × 10 dB, donc intensité × 10 × 10 × 10 = × 1000.', indice: 'Combien de tranches de 10 dB y a-t-il entre 40 dB et 70 dB ? Chaque tranche multiplie l’intensité par 10.' } },
    { id: 'inverse', titre: 'Du facteur au niveau', focus: ['scene'],
      texte: <>On peut aussi faire le chemin dans l’autre sens : une intensité multipliée par 10 fait <strong>monter le niveau de 10{NB}dB</strong>. Ce sont les <em>intensités</em> que l’on multiplie, jamais les niveaux en dB.
        <ExempleResolu>Une conversation fait 60{NB}dB. Un son 10 fois plus intense fait 60 + 10 = <strong>70{NB}dB</strong>.</ExempleResolu>
        À vous : le son A est à <strong>50{NB}dB</strong>. Le son B est <strong>100 fois</strong> plus intense que le son A.</>,
      tache: { type: 'num', q: 'Quel est le niveau sonore du son B ?', carnet: 'Niveau du son B (100 fois plus intense)', unite: 'dB', vrai: 70, tol: 0.03, affiche: v => nbf(v, 0),
        calcul: () => ['Multiplier l’intensité par 100, c’est la multiplier par 10 puis encore par 10.', 'Chaque × 10 ajoute 10 dB : 50 + 10 + 10 = 70 dB.'],
        pieges: [[5000, 'Vous avez multiplié le niveau par 100. On multiplie les intensités, pas les niveaux : chaque × 10 en intensité ajoute 10 dB.'], [150, 'Vous avez ajouté 100 dB. Un facteur 100 correspond à deux fois × 10, donc à deux fois + 10 dB.'], [60, 'Vous n’avez compté qu’un seul × 10. Un facteur 100, c’est 10 × 10 : deux fois + 10 dB.']],
        expl: '× 100 = × 10 puis × 10 : le niveau monte de 10 dB deux fois, donc 50 + 20 = 70 dB.', indice: '100 = 10 × 10. Chaque fois que l’intensité est multipliée par 10, le niveau monte de 10 dB.' } },
    { id: 'deuxsources', titre: 'Deux sources en même temps', focus: ['scene'],
      retenirTitre: 'À retenir : un zéro de plus tous les + 10 dB', retenir: <FichePlus10/>,
      texte: <>Deux sources sonores identiques qui jouent en même temps apportent <strong>deux fois plus d’intensité</strong> (× 2). Repère : <strong>une intensité × 2 correspond à environ + 3{NB}dB</strong>. Les niveaux ne s’additionnent donc pas !
        <ExempleResolu>Une enceinte seule fait 60{NB}dB. Deux enceintes identiques qui jouent chacune de leur côté : intensité × 2, soit environ 60 + 3 = <strong>63{NB}dB</strong> (et non 120{NB}dB).</ExempleResolu>
        À vous : une moto fait <strong>80{NB}dB</strong>. Deux motos identiques roulent côte à côte.</>,
      tache: { type: 'qcm', ...QCM.deuxsources } },
    { id: 'distance', titre: 'S’éloigner de la source', focus: ['scene'],
      retenirTitre: 'À retenir : deux sources, environ + 3 dB', retenir: <FicheSources/>,
      texte: <>Un son se propage dans l’air autour de sa source. Que devient son niveau quand on s’éloigne ?
        <ExempleResolu>Devant une cloche qui sonne, un sonomètre placé à 1{NB}m affiche 80{NB}dB ; un second sonomètre, placé à 10{NB}m, affiche 60{NB}dB.</ExempleResolu>
        À vous : une enceinte, un sonomètre à 1{NB}m qui affiche <strong>90{NB}dB</strong> et un second sonomètre à <strong>4{NB}m</strong>.</>,
      tache: { type: 'qcm', ...QCM.distance } },
    { id: 'dangers', titre: 'Les dangers d’un son trop fort', focus: ['scene'],
      retenirTitre: 'À retenir : plus on s’éloigne, plus le niveau baisse', retenir: <FicheDistance/>,
      texte: <>Un son trop fort ou trop long abîme l’oreille, souvent <strong>sans douleur</strong>. Trois mots à connaître : la <strong>fatigue auditive</strong> (on entend moins bien pendant un moment, puis l’audition revient), les <strong>acouphènes</strong> (des sifflements ou des bourdonnements dans l’oreille, sans source de bruit autour) et la <strong>surdité</strong> (une perte d’audition qui ne revient pas).
        <ExempleResolu>Après un match très bruyant, Sam entend « comme dans du coton » pendant deux heures, puis tout redevient normal : c’est une fatigue auditive, temporaire.</ExempleResolu>
        À vous : le cas d’une personne qui travaille depuis des années dans le bruit.</>,
      tache: { type: 'qcm', ...QCM.dangers } },
    { id: 'duree', titre: 'Le niveau et la durée comptent', focus: ['scene'],
      texte: <>Le danger dépend du niveau <strong>et</strong> du temps passé à l’entendre. À partir de <strong>85{NB}dB</strong> environ, plus le son est fort, moins on doit y rester longtemps <strong>par jour</strong> (le temps compte sur toute la journée, en additionnant les expositions). Le graphique donne des <strong>durées repères</strong> : ce sont des repères de prévention, pas des seuils médicaux exacts.
        <ExempleResolu>À 91{NB}dB, la durée repère est de 2{NB}h. Un élève y reste 3{NB}h : 3{NB}h est plus long que 2{NB}h, il dépasse le repère. S’il n’y restait que 1{NB}h, il serait dans le repère.</ExempleResolu>
        À vous : un concert à <strong>100{NB}dB</strong>, où Léa reste <strong>2{NB}h</strong>.</>,
      tache: { type: 'qcm', ...QCM.duree } },
    { id: 'protections', titre: 'Se protéger', focus: ['scene'],
      retenirTitre: 'À retenir : plus fort, moins longtemps', retenir: <FicheDangers/>,
      texte: <>Pour protéger ses oreilles, le but est toujours le même : <strong>diminuer le niveau sonore qui arrive à l’oreille</strong>.
        <ExempleResolu>Pour tondre la pelouse (environ 90{NB}dB), on porte un casque de protection auditive : le niveau qui arrive à l’oreille est plus faible.</ExempleResolu>
        À vous : on est dans un concert à 100{NB}dB.</>,
      tache: { type: 'qcm', ...QCM.protections } },
    { id: 'smartphone', titre: 'Mesurer un niveau sonore avec un smartphone', focus: ['scene'],
      retenirTitre: 'À retenir : se protéger', retenir: <FicheProtections/>,
      texte: <>Un smartphone peut servir de sonomètre : une application utilise son micro et affiche un niveau en dB. C’est pratique pour <strong>comparer des lieux</strong>, mais ce n’est pas un vrai sonomètre : la valeur dépend du téléphone, de l’application et de la façon de le tenir.
        <ExempleResolu>Dans la cour, l’application affiche 68{NB}dB ; dans le couloir calme, 45{NB}dB. On peut dire que la cour est nettement plus bruyante que le couloir.</ExempleResolu>
        À vous : on mesure dans la cantine.</>,
      tache: { type: 'qcm', ...QCM.smartphone } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : mesurer avec un smartphone', retenir: <FicheSmartphone/>,
      texte: <>Vous savez maintenant lire une échelle de niveaux sonores, vous savez qu’elle n’est pas régulière (+ 10{NB}dB ≈ 10 fois plus intense ; deux sources ≈ + 3{NB}dB), que la distance atténue le son, et que le niveau <em>et</em> la durée comptent pour protéger ses oreilles. Testez-vous avec les défis, ou explorez librement le sonomètre fictif.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'classer'
    ? { type, ...M.tirerDefiClasser(defi && defi.type === 'classer' ? defi : null), choix: [], reps: {}, verifie: false }
    : { type, ...M.tirerDefiExposition(defi && defi.type === 'exposition' ? defi : null), reps: {}, verifie: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'classer') {
      const ok1 = defi.choix.length === 4 && defi.choix.every((id, i) => id === defi.ordre[i]);
      const x = lireNombre(defi.reps.v), ok2 = isFinite(x) && proche(x, defi.facteur, 0.01);
      setDefi(d => ({ ...d, verifie: true, ok1, ok2, ok: ok1 && ok2 })); noterC(ok1 && ok2);
    } else {
      const ok = defi.reps.verdict === defi.cas;
      setDefi(d => ({ ...d, verifie: true, ok })); noterE(ok);
    }
  };
  const bordure = (d, ok) => `1.5px solid ${d.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`;
  const defiClasser = defi && defi.type === 'classer';
  const txtExposition = d => {
    const t = M.formatDuree(d.t);
    switch (d.contexte) {
      case 'concert': return <>Pendant un concert, le niveau sonore est de <strong>{d.L}{NB}dB</strong>. Marie y reste <strong>{t}</strong>.</>;
      case 'casque': return <>Un élève écoute de la musique au casque. Le niveau est de <strong>{d.L}{NB}dB</strong> pendant <strong>{t}</strong>.</>;
      case 'atelier': return <>Dans un atelier, une machine produit <strong>{d.L}{NB}dB</strong>. Un ouvrier travaille à côté, sans protection, pendant <strong>{t}</strong>.</>;
      default: return <>Dans une salle de sport très bruyante, le niveau est de <strong>{d.L}{NB}dB</strong>. Un entraîneur y reste <strong>{t}</strong>.</>;
    }
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['classer', 'Classer des sons'], ['exposition', 'Exposition risquée ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defiClasser ? 'Défi : classer des sons et comparer leurs intensités' : 'Défi : cette exposition est-elle risquée ?'}</div>
      {defiClasser ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Quatre sons sont à classer d’après l’échelle. <strong>1.</strong> Cliquez sur les sons du <strong>plus faible au plus fort</strong>. <strong>2.</strong> Combien de fois le son le plus fort est-il plus intense que le plus faible ? (Rappel : + 10{NB}dB ≈ × 10.)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {defi.sons.map(id => { const pris = defi.choix.includes(id); return <button key={id} disabled={pris} onClick={() => setDefi(d => ({ ...d, choix: [...d.choix, id], verifie: false }))} style={{ ...stylePetitBouton(false, '#0369a1'), minHeight: 40, opacity: pris ? 0.45 : 1 }}>{M.son(id).court}</button>; })}
        </div>
        <div style={{ fontSize: 14, marginBottom: 8, color: KIT.txt }}>
          Votre classement (du plus faible au plus fort) : <strong>{defi.choix.length ? defi.choix.map((id, i) => `${i + 1}. ${M.son(id).court}`).join(' ; ') : '—'}</strong>{' '}
          <button onClick={() => setDefi(d => ({ ...d, choix: [], verifie: false }))} style={{ ...stylePetitBouton(false, '#475569'), marginLeft: 4 }}>Effacer</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Le plus fort est</span>
          <input value={defi.reps.v ?? ''} aria-label="Nombre de fois plus intense" onKeyDown={e => e.key === 'Enter' && document.getElementById('ns2-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: bordure(defi, defi.ok2), fontSize: 14 }}/><span>fois plus intense que le plus faible</span>
        </div>
        <IndiceDefi cache={false}>Lisez le niveau de chaque son sur l’échelle et classez les nombres. Pour la seconde question, calculez l’écart en dB entre le son le plus fort et le plus faible : chaque tranche de 10 dB multiplie l’intensité par 10.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>{txtExposition(defi)} D’après les repères du graphique, cette exposition (cumulée sur la journée) est-elle risquée ?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
          {['sous', 'dans', 'au-dessus'].map(v => <button key={v} aria-pressed={defi.reps.verdict === v} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, verdict: v }, verifie: false }))} style={{ ...styleBouton(defi.reps.verdict === v, '#0ea5e9'), textAlign: 'left', padding: '7px 10px' }}>{LIBELLE_VERDICT[v]}</button>)}
        </div>
        <IndiceDefi cache={false}>D’abord, le niveau est-il inférieur à 85 dB ? Sinon, cherchez sa ligne sur le graphique pour lire la durée repère, puis comparez-la à la durée de l’exposition (convertissez les heures en minutes si besoin : 1 h = 60 min).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <button id="ns2-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defiClasser
          ? (defi.ok ? `✓ Correct : ${defi.ordre.map(id => `${M.son(id).court} (${M.son(id).db} dB)`).join(' < ')} ; l’écart est de ${defi.ecart} dB, soit ${entier(defi.facteur)} fois plus intense.`
            : !defi.ok1 ? '✗ Vérifiez le classement : le plus faible est en bas de l’échelle, le plus fort en haut. Cliquez les 4 sons dans l’ordre.'
              : '✗ Le classement est bon. Vérifiez le nombre de fois : écart en dB entre le plus fort et le plus faible, puis une multiplication par 10 pour chaque tranche de 10 dB.')
          : (defi.ok ? (defi.cas === 'sous' ? `✓ Correct : ${defi.L} dB est sous le repère de 85 dB ; moins fort, c’est toujours mieux.` : defi.cas === 'dans' ? `✓ Correct : à ${defi.L} dB, la durée repère est de ${M.formatDuree(defi.D)} et l’exposition dure ${M.formatDuree(defi.t)} : c’est dans la durée repère.` : `✓ Correct : à ${defi.L} dB, la durée repère est de ${M.formatDuree(defi.D)} et l’exposition dure ${M.formatDuree(defi.t)} : elle dépasse le repère.`)
            : '✗ Vérifiez : sous 85 dB, on est sous le repère ; à partir de 85 dB, comparez la durée de l’exposition à la durée repère de ce niveau.')}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>L’échelle des dB est un repère</strong> : la perception réelle dépend de la fréquence du son (l’oreille n’entend pas toutes les notes avec la même sensibilité) et de la personne. Les sonomètres tiennent compte de cela avec des décibels « pondérés » (dB(A)), qui ne sont pas au programme de la Seconde.</li>
      <li><strong>Niveaux typiques = ordres de grandeur</strong> : chuchotement ≈ 30{NB}dB, conversation ≈ 60{NB}dB (50 à 65{NB}dB selon les sources), rue à fort trafic ≈ 80{NB}dB, casque à fort volume ou concert ≈ 100{NB}dB, seuil de douleur ≈ 120{NB}dB (120 à 130{NB}dB). Ils varient d’une dizaine de dB selon les situations.</li>
      <li><strong>Règles « repères »</strong> : + 10{NB}dB ≈ intensité × 10 et + 3{NB}dB ≈ intensité × 2 sont des approximations d’ordre de grandeur (en réalité × 2 correspond à + 3,01{NB}dB). Elles servent à comparer des sons, pas à calculer précisément. « Deux sources identiques → × 2 » suppose deux sources indépendantes : deux enceintes qui jouent exactement le même signal peuvent donner jusqu’à + 6{NB}dB.</li>
      <li><strong>Durées d’exposition = repères indicatifs de prévention</strong>, pas des seuils médicaux garantis : 85{NB}dB(A) sur 8{NB}h est la valeur d’action supérieure du Code du travail (les premières actions de prévention commencent dès 80{NB}dB(A)) (INRS) ; l’OMS donne environ 15 minutes par jour à 100{NB}dB. Les repères cités s’arrêtent à 100{NB}dB : au-delà, aucune durée n’est donnée et il faut éviter, se protéger. Sous 85{NB}dB, on est sous le repère, mais moins fort reste toujours mieux. Les durées sont cumulées sur la journée. Entre 85 et 100{NB}dB, on divise la durée par 2 chaque fois que le niveau monte de 3{NB}dB. La sensibilité de l’oreille varie d’une personne à l’autre : mieux vaut rester bien en dessous, et l’absence de douleur ne prouve pas l’absence de dégâts.</li>
      <li><strong>Sonomètre fictif (exploration)</strong> : aucun son n’est produit. Sources identiques, au même endroit, en plein air (ni mur ni sol qui réfléchit le son). Pour une amplitude de 1 (unité arbitraire), une source à 1{NB}m donne 50{NB}dB. Au-delà du programme de la Seconde : l’intensité varie comme le carré de l’amplitude, et chaque fois que la distance double, le niveau baisse d’environ 6{NB}dB.</li>
      <li><strong>Smartphone</strong> : valeur à quelques dB près ; le micro est peu fiable pour des sons très faibles ou très forts. On s’en sert pour comparer des lieux, pas pour des mesures de précision.</li>
      <li><strong>Sécurité</strong> : ne cherchez jamais à « tester » un son très fort. Si vous entendez des sifflements ou si votre audition baisse après un concert, parlez-en à un médecin.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const sceneGuide = (() => {
    switch (idE) {
      case 'amplitude': return boite('Trois sons enregistrés par un micro', <SceneAmplitude/>, cadre('scene'));
      case 'niveau': return boite('Deux sons mesurés par un sonomètre', <SceneDeuxSonometres a={{ nom: 'Son A', valeur: 50 }} b={{ nom: 'Son B', valeur: 70 }}/>, cadre('scene'));
      case 'lire': return boite('L’échelle des niveaux sonores', <EchelleDb marqueurs={[{ db: 30, nom: 'chuchotement' }, { db: 60, nom: 'conversation' }, { db: 70, nom: 'aspirateur', cache: !fait('lire') }]}/>, cadre('scene'));
      case 'plus10': return boite('Un exemple : de marche en marche', <SceneEscalier/>, cadre('scene'));
      case 'inverse': return boite('Un son 100 fois plus intense', <SceneDeuxSonometres a={{ nom: 'Son A', valeur: 50 }} b={{ nom: 'Son B, 100 × plus fort', valeur: 70, inconnu: !fait('inverse') }} legende="Même haut-parleur, même distance"/>, cadre('scene'));
      case 'deuxsources': return boite('Une moto, puis deux', <SceneSources L1={80} L2={83} inconnu={!fait('deuxsources')}/>, cadre('scene'));
      case 'distance': return boite('Un sonomètre de plus en plus loin', <SceneDistance L1={90} L2={78} inconnu={!fait('distance')}/>, cadre('scene'));
      case 'dangers': return boite('Les conséquences d’un son trop fort', <SceneDangers/>, cadre('scene'));
      case 'duree': return boite('Combien de temps peut-on rester ?', <SceneDurees/>, cadre('scene'));
      case 'protections': return boite('Un concert', <SceneConcert/>, cadre('scene'));
      case 'smartphone': return boite('Un smartphone qui mesure', <SceneSmartphone valeur={76}/>, cadre('scene'));
      case 'bilan': return boite('L’échelle des niveaux sonores', <EchelleDb marqueurs={marqueursSons(['seuil', 'chuchote', 'conv', 'rue', 'casque', 'douleur'])}/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const L = M.niveauSonometre(ex.a, ex.r, ex.n), Lr = Math.round(L);
  const proc = M.SONS.reduce((best, s) => (Math.abs(s.db - L) < Math.abs(best.db - L) ? s : best), M.SONS[0]);
  const ressemble = Math.abs(proc.db - L) <= 7 ? proc.court : null;
  const jv = M.verdict(ex.jL, ex.jT), jD = M.dureeRepere(ex.jL);
  const reglages = (<>
    <Curseur nom="Amplitude de la vibration (unité arbitraire)" valeur={ex.a} onChange={v => setE({ a: v })} min={1} max={100} pas={1} decimales={0} couleur="#0369a1"/>
    {etiquette('Nombre de sources identiques', <select value={ex.n} onChange={x => setE({ n: Number(x.target.value) })} style={sel}>{M.NB_SOURCES.map(n => <option key={n} value={n}>{n} source{n > 1 ? 's' : ''}</option>)}</select>)}
    {etiquette('Distance du sonomètre à la source', <select value={ex.r} onChange={x => setE({ r: Number(x.target.value) })} style={sel}>{M.DISTANCES.map(d => <option key={d} value={d}>{d} m</option>)}</select>)}
    {aide('Réglez la vibration, le nombre de sources et la distance : le sonomètre fictif affiche le niveau correspondant. Aucun son n’est produit.')}
  </>);
  const mesures = (<>
    <LigneMesure nom="Amplitude" valeur={`${ex.a}${NB}(unité arbitraire)`}/>
    <LigneMesure nom="Intensité (par rapport à la référence)" valeur={`× ${facteurTxt(M.intensiteRelative(ex.a, ex.r, ex.n))}`} couleur={COL.orange}/>
    <LigneMesure nom="Niveau lu sur le sonomètre" valeur={`≈ ${Lr}${NB}dB`} couleur={COL.vert}/>
    {ressemble && <LigneMesure nom="Cela ressemble à" valeur={ressemble}/>}
    {aide('La référence est une source d’amplitude 1 à 1 m (50 dB).')}
  </>);
  const jauge = (<>
    <Curseur nom="Niveau sonore" valeur={ex.jL} onChange={v => setE({ jL: v })} min={30} max={130} pas={1} unite="dB" decimales={0} couleur="#b45309"/>
    {etiquette('Durée d’exposition', <select value={ex.jT} onChange={x => setE({ jT: Number(x.target.value) })} style={sel}>{[1, 5, 15, 30, 60, 120, 240, 480].map(t => <option key={t} value={t}>{M.formatDuree(t)}</option>)}</select>)}
    <button onClick={() => setE({ jL: Math.min(130, Math.max(30, Lr)) })} style={{ ...stylePetitBouton(false, '#475569'), marginBottom: 8 }}>Prendre le niveau du sonomètre ({Lr}{NB}dB)</button>
    <div style={{ background: FOND_VERDICT[jv], border: `2px solid ${COULEUR_VERDICT[jv]}`, borderRadius: 12, padding: '8px 12px', fontSize: 14, lineHeight: 1.5, color: KIT.txt }} role="status" aria-live="polite">
      <strong style={{ color: COULEUR_VERDICT[jv] }}>{jv === 'danger' ? 'Danger' : jv === 'hors' ? 'Au-delà des repères' : jv === 'sous' ? 'Sous les repères' : jv === 'dans' ? 'Dans les repères' : 'Au-dessus des repères'}</strong>{' : '}{M.TEXTE_VERDICT[jv]}
      {(jv === 'hors' || jv === 'danger')
        ? <div style={{ marginTop: 4 }}>À {ex.jL}{NB}dB, <strong>aucune durée repère</strong> n’est indiquée.</div>
        : <div style={{ marginTop: 4 }}>Durée repère à {ex.jL}{NB}dB (cumulée sur la journée) : <strong>{isFinite(jD) ? `environ ${M.formatDuree(jD < 10 ? jD : Math.round(jD))}` : 'pas de durée repère sous 85 dB'}</strong>. Votre exposition : <strong>{M.formatDuree(ex.jT)}</strong>.</div>}
      {isFinite(jD) && jv !== 'danger' && jv !== 'hors' && <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, marginTop: 6, overflow: 'hidden' }} aria-hidden="true"><div style={{ width: `${Math.min(100, ex.jT / jD * 100)}%`, height: '100%', background: COULEUR_VERDICT[jv] }}/></div>}
    </div>
    {aide('Repères de prévention indicatifs, pas des seuils médicaux exacts, valables par jour (exposition cumulée). Les repères cités s’arrêtent à 100 dB. La barre se remplit quand la durée approche (ou dépasse) la durée repère.')}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Amplitude : passez de 1 à 10, puis à 100. Le niveau est-il multiplié par 100 ? De combien de dB monte-t-il à chaque fois que l’amplitude est multipliée par 10 ?</li>
      <li>Sources : passez de 1 à 2, 4 puis 8 sources. Que se passe-t-il pour le niveau à chaque doublement ?</li>
      <li>Distance : éloignez le sonomètre de 1 m à 2 m, 4 m, 8 m, 16 m. Le niveau varie-t-il de la même façon à chaque doublement ?</li>
      <li>Trouvez un réglage qui dépasse 85 dB. Cliquez sur « Prendre le niveau du sonomètre » : combien de temps peut-on rester là, d’après les repères ?</li>
      <li>Avec la jauge, comparez 91 dB pendant 1 h et 100 dB pendant 1 h. Que changent 9 dB de plus ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>amplitude ↑ ⇒ intensité ↑ ⇒ niveau en dB ↑</li>
        <li>+ 10{NB}dB ≈ intensité × 10 ; deux sources identiques ≈ + 3{NB}dB</li>
        <li>plus on s’éloigne de la source, plus le niveau baisse</li>
        <li>à partir de 85{NB}dB, la durée d’exposition compte : 3{NB}dB de plus, durée repère ÷ 2</li>
        <li>dangers : fatigue auditive, acouphènes, surdité ; protections : baisser, s’éloigner, bouchons, pauses</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ns2-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ns2-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ns2-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .ns2-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .ns2-l1.cote .ns2-carte { order: 2; } .ns2-l1.cote .ns2-main { order: 1; }
          .ns2-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .ns2-ex > .ns2-ex-scene { grid-column: 1; grid-row: 1; } .ns2-ex > .ns2-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .ns2-ex > .ns2-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .ns2-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ns2-in { animation: ns2-fondu 0.35s ease-out; } @keyframes ns2-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Niveau sonore et dangers de l’exposition</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un sonomètre mesure la force d’un son en <strong>décibels</strong>. Cette échelle est particulière : on apprend à la lire, et à protéger ses oreilles.</div>
      {enExplore ? <>
        <div className="ns2-ex">
          <div className="ns2-ex-scene">{boite('Le sonomètre fictif', <SceneSonometreFictif a={ex.a} r={ex.r} n={ex.n} L={L}/>)}</div>
          <div className="ns2-ex-reglages">{boite('Réglages', reglages)}</div>
          <div className="ns2-ex-mesures">{boite('Mesures', mesures)}</div>
        </div>
        <Section titre={`Où se place ce son sur l’échelle ? ≈ ${Lr} dB`} ouvert={!!ex.ouv.echelle} onBascule={() => ouvrir('echelle')}>
          <EchelleDb marqueurs={marqueursSons(M.SONS.map(s => s.id))} niveau={Lr}/>
        </Section>
        <Section titre={`Jauge de risque : ${ex.jL} dB pendant ${M.formatDuree(ex.jT)}`} ouvert={!!ex.ouv.jauge} onBascule={() => ouvrir('jauge')}>{jauge}</Section>
        <Section titre="Les durées repères" ouvert={!!ex.ouv.durees} onBascule={() => ouvrir('durees')}><SceneDurees surligne={ex.jL >= 85 && ex.jL <= M.NIVEAU_MAX_REPERES ? M.DUREES.map(d => d[0]).reduce((b, n) => (Math.abs(n - ex.jL) < Math.abs(b - ex.jL) ? n : b), 85) : null}/></Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`ns2-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="ns2-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ns2-carte ns2-hypo-defi">{panneauHypo}</div> : null}
          <div className="ns2-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defiClasser ? suiviC : suiviE}/></div>}
            {enDefi && defi && <div className="ns2-in" key={defi.type + (defi.cle || `${defi.L}-${defi.t}`)}>{defiClasser
              ? boite('L’échelle des niveaux sonores', <EchelleDb marqueurs={marqueursSons(ID_POOL)} hauteur={520}/>)
              : boite('Durées repères', <SceneDurees surligne={defi.L >= 85 ? defi.L : null}/>)}</div>}
            {enGuide && <div className="ns2-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
