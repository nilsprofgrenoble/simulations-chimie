import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, avecIndices, ARetenir, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./brnModele";
import { QCM_PARCOURS as Q } from "./brnQcm";
import { SceneLewis, SceneCouple, SceneFormules, SceneMelange, SceneCouples, DessinMol, SvgCoupleCarte, SvgCarboxyleCarte, SvgAmineCarte, SvgEquationCarte, SvgAmphotereCarte, emprise, COL } from "./brnSchemas";

const SIM_ID = 188, CLE_GUIDE = 'brn-tg-guide-v1';
declarerDefis(SIM_ID, [['equation', 'Écrire l’équation d’une réaction acide-base'], ['lewis', 'Compléter un schéma de Lewis']]);

// ====================================================
// SIM 188 — TRANSFERTS DE H⁺ : ACIDES CARBOXYLIQUES, CARBOXYLATES, AMINES, IONS AMMONIUM
//  (TG spé PC, « Déterminer la composition d’un système », partie A : modéliser des transformations acide-base par des transferts d’ion hydrogène H⁺).
//  Capacités visées (jamais affichées à l’élève) : identifier un transfert de H⁺, les couples acide-base et établir l’équation d’une réaction acide-base ;
//  représenter le schéma de Lewis et la formule semi-développée d’un acide carboxylique, d’un ion carboxylate, d’une amine et d’un ion ammonium ; identifier une espèce amphotère.
//  Modèle : brnModele.js (test : brnModele.test.mjs).
// ====================================================
const IDS = ['role', 'demi', 'ou', 'retire', 'doublet', 'amine', 'capte', 'azote', 'equation', 'eau', 'amphotere', 'bilan'];
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const de = nom => (/^[aeiouyhéèêâîôû]/i.test(nom) ? 'de l’' : 'de la ') + nom;
const cp = id => M.couplePar(id), esp = id => M.espece(id);
const F = id => esp(id).formule;

// animation d'un paramètre u vers une cible (0 ou 1) ; sans animation si l'utilisateur préfère moins de mouvement
function useTransition(cible, duree = 950) {
  const [u, setU] = useState(cible), ref = useRef(cible);
  useEffect(() => {
    const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf, t0 = null; const u0 = ref.current;
    const pas = t => {
      if (t0 === null) t0 = t;
      const k = reduit ? 1 : Math.min(1, (t - t0) / duree), e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k), v = u0 + (cible - u0) * e;
      ref.current = v; setU(v); if (k < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [cible, duree]);
  return u;
}

// atomes et charge d'une liste de termes : « C 2 · H 7 · N 1 · O 2 », charge « +1 »
const ORDRE_EL = ['C', 'H', 'N', 'O'];
const ligneBilan = termes => { const b = M.bilan(termes); return { atomes: ORDRE_EL.filter(e => b.atomes[e]).map(e => `${e}${NB}${b.atomes[e]}`).join(' · '), charge: M.chargeTxt(b.charge) }; };
const Eq = ({ t, taille = 17 }) => <span style={{ fontWeight: 800, fontSize: taille, whiteSpace: 'nowrap' }}>{t}</span>;
const phr = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };

// légende des conventions de dessin (non fondée sur la couleur seule)
const LegendeLewis = () => (<div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6, marginTop: 4 }}>
  Un <strong>trait</strong> entre deux atomes : un doublet liant (deux traits : liaison double). Un <strong>petit tiret</strong> à côté d’un atome : un doublet non liant. Un <strong>cercle avec + ou −</strong> : la charge portée par l’atome.</div>);

// ====================================================
const tire = t => t[Math.floor(Math.random() * t.length)];
const melanger = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function SceneDefiLewis({ cible }) {
  const g = M.sansReponse(cible), e = esp(cible.id), [x0, x1, y0, y1] = emprise(g), s = Math.min(1.1, 150 / Math.max(1, y1 - y0)), cx = 200 - ((x0 + x1) / 2) * s, cy = 100 - ((y0 + y1) / 2) * s, el = g.atomes[cible.i].el;
  return (<svg viewBox="0 0 400 220" width="100%" role="img" aria-label={`Schéma de Lewis ${de(e.nom)} ; l’atome ${el} entouré en tirets est à compléter.`} style={{ maxWidth: 420, display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 10 }}>
    <DessinMol g={g} cx={cx} cy={cy} s={s} halo={[cible.i]} sansCharge={[cible.i]} idp="d"/>
    <text x="200" y="206" fontSize="16" textAnchor="middle" fill={COL.gris}>schéma de Lewis (angles non réels)</text>
  </svg>);
}

export function SimulationTransfertsH() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviE, noterE] = useCompteurDefi(), [suiviL, noterL] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('equation');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ deux: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ couple: 'ethanoique', sens: 0, c1: 'ethanoique', c2: 'ammonium' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const fait = k => !!(guide.reps && guide.reps[k]);
  const marquer = k => setGuide(e => ({ ...e, reps: { ...e.reps, [k]: true } }));

  // animations : parcours (étapes « retire » et « capte ») et exploration
  const uRetire = useTransition(fait('f_retire') ? 1 : 0), uCapte = useTransition(fait('f_capte') ? 0 : 1);
  const uEx = useTransition(ex.sens);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'role', titre: 'Un acide cède H⁺, une base le capte',
      texte: <>Selon Brønsted, un <strong>acide</strong> est une espèce chimique capable de <strong>céder</strong> un ion hydrogène H⁺, et une <strong>base</strong> une espèce capable d’en <strong>capter</strong> un. Par exemple, dans l’ion ammonium NH₄⁺, un atome d’hydrogène peut partir sous forme de H⁺ : c’est ce que montre la figure. Un acide et la base qu’il donne forment un <strong>couple acide-base</strong>, que l’on écrit « acide / base ».</>,
      tache: { type: 'qcm', q: 'Autre transformation : l’acide méthanoïque HCOOH se transforme en ion méthanoate HCOO⁻ en libérant un ion H⁺. Quel est le rôle de HCOOH, et comment s’écrit le couple ?', ...Q.role,
        expl: 'HCOOH cède un H⁺ : c’est un acide, et HCOO⁻ est sa base conjuguée. Le couple s’écrit en plaçant l’acide avant la base : HCOOH / HCOO⁻. Dire que HCOOH est une base serait confondre « céder » et « capter » ; écrire HCOO⁻ / HCOOH inverse l’ordre convenu (acide d’abord).',
        indice: 'Qui perd H⁺ ? Une espèce qui cède H⁺ est un acide. Dans « acide / base », on écrit l’acide en premier.' } },
    { id: 'demi', titre: 'Écrire le passage de l’acide à sa base',
      texte: <>L’acide éthanoïque CH₃COOH appartient au couple CH₃COOH / CH₃COO⁻ (ion éthanoate). Quand il cède un H⁺, il se transforme en sa base conjuguée. Comme dans toute transformation chimique, les atomes et la charge électrique se conservent : on les compte de chaque côté de la flèche. Remarque : H⁺ est écrit ici pour suivre le transfert ; en solution, il ne reste jamais seul.</>,
      tache: { type: 'qcm', q: 'Quelle écriture traduit correctement ce passage ?', ...Q.demi,
        expl: 'À gauche : 4 atomes d’hydrogène et la charge 0. CH₃COO⁻ + H⁺ contient 3 + 1 = 4 atomes d’hydrogène et la charge (−1) + (+1) = 0 : tout est conservé. Sans la charge − de l’ion éthanoate, ou avec H à la place de H⁺, la charge n’est pas conservée ; avec 2 H⁺, il y aurait 5 atomes d’hydrogène à droite pour 4 à gauche.',
        indice: 'Comptez à gauche et à droite : les atomes d’hydrogène, puis la charge totale. Les deux doivent être égaux.' } },
    { id: 'ou', titre: 'Quel atome d’hydrogène part ?',
      retenirTitre: 'Acide, base et couple', retenir: <>
        <SvgCoupleCarte/>
        <ul style={UL}>
          <li>Un <strong>acide</strong> cède H⁺, une <strong>base</strong> capte H⁺ ; le couple s’écrit <strong>acide / base</strong>.</li>
          <li>Les deux espèces d’un couple ne diffèrent que par <strong>un H⁺</strong> : les atomes et la charge se conservent.</li>
          <li>Moyen de s’en souvenir : <strong>« l’acide donne, la base prend »</strong>. Idée fausse : « une base est une espèce qui libère HO⁻ ». Vrai : une base capte H⁺.</li>
        </ul></>,
      texte: <>Voici le schéma de Lewis de l’acide éthanoïque. Le groupe d’atomes –COOH s’appelle le groupe carboxyle ; CH₃– est le groupe méthyle. Le schéma est une écriture : les angles ne sont pas ceux de la molécule.<LegendeLewis/></>,
      tache: { type: 'qcm', q: 'Parmi les quatre atomes d’hydrogène, lequel peut être cédé sous forme de H⁺ ?', ...Q.ou,
        expl: 'C’est l’hydrogène lié à l’oxygène du groupe carboxyle : la liaison O–H est polarisée (l’oxygène est plus électronégatif que l’hydrogène) et se rompt facilement en H⁺. Les trois hydrogènes du groupe méthyle, liés au carbone, ne sont pas cédés : les quatre H ne sont pas équivalents. Un atome d’hydrogène peut bien se détacher sous forme de H⁺, c’est justement un transfert acide-base.',
        indice: 'Regardez à quel atome chacun des quatre H est lié : carbone ou oxygène ? L’oxygène attire plus les électrons que l’hydrogène.' } },
    { id: 'retire', titre: 'H⁺ part : que reste-t-il ?',
      texte: <>L’hydrogène du groupe carboxyle part sous forme d’ion H⁺, c’est-à-dire <strong>sans les électrons</strong> de la liaison O–H qu’il partageait. Appuyez sur le bouton et observez ce qui arrive à l’atome d’oxygène : ses doublets, sa charge.</>,
      tache: { type: 'action', label: 'Retirer H⁺ du groupe carboxyle', faire: () => marquer('f_retire'), ok: fait('f_retire'), consigne: 'Observez l’atome d’oxygène : combien de doublets non liants porte-t-il maintenant, et quelle charge ?' } },
    { id: 'doublet', titre: 'Le doublet de la liaison O–H',
      texte: <>H⁺ est parti sans aucun électron : le doublet de la liaison O–H est resté sur l’oxygène et forme maintenant un doublet non liant. La figure montre l’ion éthanoate CH₃COO⁻ et un ion H⁺ libre. Pour savoir si un atome est chargé, on compare ses électrons à ceux de l’atome seul : on lui attribue 1 électron par liaison et 2 par doublet non liant.</>,
      tache: { type: 'qcm', q: 'L’oxygène qui portait H a maintenant 1 liaison et 3 doublets non liants. Combien d’électrons lui attribue-t-on, et quelle est sa charge ?', ...Q.doublet,
        expl: 'On attribue à l’atome 1 électron par liaison et 2 par doublet non liant : 1 + 3 × 2 = 7 électrons. L’atome d’oxygène seul en a 6 : il a un électron de plus, donc il est chargé − (charge = 6 − 7 = −1). Dans l’acide, il avait 2 liaisons et 2 doublets : 2 + 2 × 2 = 6 électrons, donc aucune charge. Le nombre 8 est celui de l’octet (chaque liaison compte alors pour 2) : il ne sert pas à calculer la charge.',
        indice: 'Charge = électrons de valence de l’atome seul (6 pour O) − (liaisons + 2 × doublets non liants).' } },
    { id: 'amine', titre: 'L’amine : un doublet pour capter H⁺',
      retenirTitre: 'Acide carboxylique et ion carboxylate', retenir: <>
        <SvgCarboxyleCarte/>
        <ul style={UL}>
          <li>Acide carboxylique : groupe <strong>–COOH</strong> (liaisons C=O et O–H). Formule semi-développée : CH₃–C(=O)–OH.</li>
          <li>Il cède H⁺ de la liaison <strong>O–H</strong> ; le doublet reste sur O : ion carboxylate <strong>–COO⁻</strong>, CH₃–C(=O)–O⁻.</li>
          <li>Moyen de s’en souvenir : <strong>« H⁺ part, le doublet reste »</strong>. Dans l’ion, les deux oxygènes jouent en réalité un rôle équivalent ; on n’en dessine qu’une écriture.</li>
        </ul></>,
      texte: <>Une base doit pouvoir <strong>capter</strong> un ion H⁺ : il lui faut pour cela un doublet non liant pour former la nouvelle liaison. Voici la méthylamine CH₃NH₂, une amine : c’est la base du couple CH₃NH₃⁺ / CH₃NH₂.</>,
      tache: { type: 'qcm', q: 'Quel atome de la méthylamine peut capter un ion H⁺ ?', ...Q.amine,
        expl: 'L’azote porte un doublet non liant, qui peut former une liaison avec H⁺. Un atome d’hydrogène n’a aucun doublet non liant (une seule liaison, le duet est atteint) ; le carbone a déjà quatre liaisons et aucun doublet non liant ; et une molécule neutre peut très bien capter H⁺ : c’est ce que font les bases comme l’ammoniac NH₃.',
        indice: 'Cherchez, sur le schéma, un atome qui porte un doublet non liant (un petit tiret à côté de l’atome).' } },
    { id: 'capte', titre: 'H⁺ arrive sur l’azote',
      texte: <>La méthylamine rencontre un ion H⁺. H⁺ n’a aucun électron : la liaison N–H qui se forme est faite avec le doublet non liant de l’azote. Appuyez sur le bouton et observez l’atome d’azote.</>,
      tache: { type: 'action', label: 'Faire arriver H⁺ sur l’azote', faire: () => marquer('f_capte'), ok: fait('f_capte'), consigne: 'Observez l’atome d’azote : combien de liaisons a-t-il maintenant ? Reste-t-il un doublet non liant ?' } },
    { id: 'azote', titre: 'L’ion ammonium',
      texte: <>H⁺ s’est fixé : la figure montre l’ion méthylammonium CH₃NH₃⁺, l’acide du couple CH₃NH₃⁺ / CH₃NH₂. Dans l’ion, l’atome d’azote a quatre liaisons ; chaque liaison apporte un électron à l’azote. On rappelle que l’atome d’azote seul a 5 électrons de valence.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’atome d’azote porte-t-il la charge + ?', ...Q.azote,
        expl: 'Dans l’ion, l’azote possède 4 électrons (un par liaison, aucun doublet non liant) : un de moins que les 5 de l’atome N seul, donc il est chargé +. L’hydrogène ajouté est lié par un doublet comme les autres : il ne porte pas la charge. Et l’azote n’a pas perdu d’hydrogène : il en a gagné un ; le carbone n’est pour rien dans la charge.',
        indice: 'Charge = électrons de valence de l’atome seul − (nombre de liaisons + 2 × doublets non liants). Ici : 5 − (4 + 2 × 0).' } },
    { id: 'equation', titre: 'Écrire une réaction acide-base',
      retenirTitre: 'L’amine et l’ion ammonium', retenir: <>
        <SvgAmineCarte/>
        <ul style={UL}>
          <li>Amine : l’azote porte un <strong>doublet non liant</strong> (R–NH₂). Elle capte H⁺ avec ce doublet : ion ammonium R–NH₃⁺.</li>
          <li>Dans l’ion : <strong>4 liaisons et plus de doublet non liant</strong> sur N, qui porte la charge +.</li>
          <li>Moyen de s’en souvenir : <strong>« le doublet de N attrape H⁺ »</strong>. Idée fausse : « la charge + est sur l’hydrogène ajouté ». Vrai : elle est portée par N.</li>
        </ul></>,
      texte: <>On mélange de l’acide éthanoïque CH₃COOH et de l’ammoniac NH₃. Couples en jeu : CH₃COOH / CH₃COO⁻ et NH₄⁺ / NH₃. Dans une <strong>réaction acide-base</strong>, un ion H⁺ passe de l’acide d’un couple à la base de l’autre couple.</>,
      tache: { type: 'qcm', q: 'Quelle est l’équation de la réaction ?', ...Q.equation,
        expl: 'L’acide du couple 1 (CH₃COOH) cède H⁺ à la base du couple 2 (NH₃) : CH₃COOH + NH₃ → CH₃COO⁻ + NH₄⁺. Atomes et charge sont conservés (7 H, charge 0). Écrire NH₄ sans charge, ou CH₃COOH₂⁺ et NH₂⁻ (la mauvaise espèce reçoit H⁺, ces espèces ne sont pas dans les couples donnés), est faux ; l’équation inversée part des espèces CH₃COO⁻ et NH₄⁺, alors que le mélange contient CH₃COOH et NH₃.',
        indice: 'Écrivez en premier les deux réactifs du mélange. Retirez H⁺ à l’acide pour obtenir sa base ; ajoutez H⁺ à la base pour obtenir son acide ; vérifiez les atomes et la charge.' } },
    { id: 'eau', titre: 'L’eau, acide ou base ?',
      retenirTitre: 'Équation d’une réaction acide-base', retenir: <>
        <SvgEquationCarte/>
        <ul style={UL}>
          <li>L’acide du couple 1 cède H⁺ à la base du couple 2 : <strong>acide 1 + base 2 → base 1 + acide 2</strong>.</li>
          <li>On vérifie toujours les <strong>atomes</strong> et la <strong>charge</strong> de chaque côté.</li>
          <li>Moyen de s’en souvenir : <strong>« un H⁺ cédé = un H⁺ capté »</strong>. Idée fausse : « les deux réactifs sont des acides ». Vrai : un acide et une base.</li>
        </ul></>,
      texte: <>L’eau appartient à deux couples : H₃O⁺ / H₂O et H₂O / HO⁻. On dissout de la méthylamine CH₃NH₂ (couple CH₃NH₃⁺ / CH₃NH₂) dans l’eau : l’eau intervient dans la réaction.</>,
      tache: { type: 'qcm', q: 'Quelle est l’équation de la réaction, et quel rôle joue l’eau ?', ...Q.eau,
        expl: 'CH₃NH₂ est une base : elle capte H⁺, que doit céder un acide. Ici, c’est l’eau, acide du couple H₂O / HO⁻ : CH₃NH₂ + H₂O → CH₃NH₃⁺ + HO⁻. L’eau ne peut pas être la base, puisque la base est CH₃NH₂ ; l’équation avec H₃O⁺ ne conserve pas les atomes d’hydrogène (7 à gauche, 9 à droite) ; celle sans charges oublie que CH₃NH₃⁺ et HO⁻ sont des ions.',
        indice: 'Ajoutez H⁺ à la base CH₃NH₂ pour obtenir son acide. D’où vient ce H⁺ ? Le couple de l’eau où H₂O est l’acide est H₂O / HO⁻.' } },
    { id: 'amphotere', titre: 'Espèce amphotère',
      texte: <>Une espèce est <strong>amphotère</strong> si elle est à la fois l’acide d’un couple et la base d’un autre couple. Voici quatre couples, dont deux liés à l’acide carbonique : CO₂,H₂O / HCO₃⁻ et HCO₃⁻ / CO₃²⁻ (CO₂,H₂O désigne le dioxyde de carbone dissous).</>,
      tache: { type: 'qcm', q: 'Laquelle de ces espèces est amphotère ?', ...Q.amphotere,
        expl: 'L’ion hydrogénocarbonate HCO₃⁻ est la base du couple CO₂,H₂O / HCO₃⁻ (il capte H⁺) et l’acide du couple HCO₃⁻ / CO₃²⁻ (il cède H⁺) : il figure dans deux couples avec deux rôles différents. CO₃²⁻, CH₃COO⁻ et HO⁻ n’apparaissent chacun que comme base, dans un seul couple de la liste.',
        indice: 'Cherchez une espèce qui figure dans deux couples de la liste, une fois à gauche (acide) et une fois à droite (base).' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Espèce amphotère', retenir: <>
        <SvgAmphotereCarte/>
        <ul style={UL}>
          <li>Une espèce <strong>amphotère</strong> est l’acide d’un couple <strong>et</strong> la base d’un autre.</li>
          <li>Exemples : <strong>H₂O</strong> (H₃O⁺ / H₂O et H₂O / HO⁻) et <strong>HCO₃⁻</strong> (CO₂,H₂O / HCO₃⁻ et HCO₃⁻ / CO₃²⁻).</li>
          <li>Moyen de s’en souvenir : <strong>« deux couples, deux rôles »</strong>. Les acides α-aminés sont eux aussi amphotères (simulation sur les acides α-aminés).</li>
        </ul></>,
      texte: <>Vous savez repérer un transfert d’ion H⁺, écrire les couples acide-base et l’équation d’une réaction acide-base, représenter le schéma de Lewis d’un acide carboxylique et de son ion carboxylate, d’une amine et de son ion ammonium, et reconnaître une espèce amphotère. Passez à l’exploration (tous les couples) ou relevez les deux défis.</>, tache: null },
  ];

  // ---------- scène du parcours ----------
  const sceneGuide = (() => {
    switch (idEtape) {
      case 'role': return <SceneFormules gauche="NH₄⁺" droite="NH₃ + H⁺" etiqG="ion ammonium" etiqD="ammoniac et ion H⁺"/>;
      case 'demi': return <SceneFormules gauche="CH₃COOH" droite="?" etiqG="acide éthanoïque" etiqD="sa base conjuguée"/>;
      case 'ou': return <><SceneLewis id="CH3COOH"/><LegendeLewis/></>;
      case 'retire': return <SceneCouple couple={cp('ethanoique')} u={uRetire}/>;
      case 'doublet': return <SceneCouple couple={cp('ethanoique')} u={1} sansChargeSite/>;
      case 'amine': return <SceneLewis id="CH3NH2"/>;
      case 'capte': return <SceneCouple couple={cp('methylammonium')} u={uCapte}/>;
      case 'azote': return <SceneLewis id="CH3NH3+"/>;
      case 'equation': return <SceneMelange a="CH3COOH" b="NH3"/>;
      case 'eau': return <SceneMelange a="CH3NH2" b="H2O"/>;
      case 'amphotere': case 'bilan': return <SceneCouples ids={[cp('carbonique'), cp('hydrogenocarbonate'), cp('ethanoique'), cp('eau-hydroxyde')]}/>;
      default: return null;
    }
  })();

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'equation') { const r = tire(M.REACTIONS_DEFI); setDefi({ type, r, ordre: melanger([r.reactifs[0].id, r.reactifs[1].id]), acide: '', p1: '', p2: '', essais: 0, retour: '', ok: false, revele: false }); }
    else { const cible = tire(M.CIBLES_LEWIS); setDefi({ type, cible, lp: '', ch: '', essais: 0, retour: '', ok: false, revele: false }); }
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const maj = f => setDefi(d => ({ ...d, ...f, retour: '', ok: false }));
  const verifierEquation = () => {
    const d = defi, vrais = d.r.produits.map(x => x.id).sort(), saisis = [d.p1, d.p2].sort();
    const acideOk = d.acide === d.r.c1.acide, prodOk = d.p1 && d.p2 && JSON.stringify(vrais) === JSON.stringify(saisis);
    if (!d.acide || !d.p1 || !d.p2) { setDefi(x => ({ ...x, retour: 'Choisissez l’acide et les deux produits avant de vérifier.' })); return; }
    const ok = acideOk && prodOk; let retour = '';
    if (!ok) {
      const termes = [{ id: d.p1, n: 1 }, { id: d.p2, n: 1 }], bp = M.bilan(termes), br = M.bilan(d.r.reactifs);
      const atomesOk = [...new Set([...Object.keys(bp.atomes), ...Object.keys(br.atomes)])].every(e => (bp.atomes[e] || 0) === (br.atomes[e] || 0)), chargeOk = bp.charge === br.charge;
      if (!acideOk) retour = 'Le réactif que vous désignez comme acide ne convient pas : l’acide est celui qui cède H⁺.';
      else if (!atomesOk) retour = 'Vos produits ne conservent pas les atomes : comptez les hydrogènes de chaque côté.';
      else if (!chargeOk) retour = 'Vos produits ne conservent pas la charge : additionnez les charges de chaque côté.';
      else retour = 'Atomes et charge sont conservés, mais ces produits ne correspondent pas à un transfert de H⁺ entre les deux couples.';
    }
    setDefi(x => ({ ...x, essais: x.essais + 1, ok, retour, revele: ok || x.essais + 1 >= 3 })); noterE(ok);
  };
  const verifierLewis = () => {
    const d = defi, rep = M.reponseLewis(d.cible);
    if (d.lp === '' || d.ch === '') { setDefi(x => ({ ...x, retour: 'Choisissez le nombre de doublets non liants et la charge.' })); return; }
    const lpOk = +d.lp === rep.lp, chOk = +d.ch === rep.charge, ok = lpOk && chOk;
    let retour = '';
    if (!ok) {
      if (!lpOk) retour = 'Le nombre de doublets non liants n’est pas bon : l’atome doit être entouré de 8 électrons (chaque liaison compte pour 2, chaque doublet non liant aussi).';
      else retour = 'Le nombre de doublets est bon, mais pas la charge : comparez les électrons de valence de l’atome seul à ceux qu’il possède dans l’édifice.';
    }
    setDefi(x => ({ ...x, essais: x.essais + 1, ok, retour, revele: ok || x.essais + 1 >= 3 })); noterL(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const listeEsp = M.TOUTES_ESPECES.map(e => e.id).sort((a, b) => F(a).localeCompare(F(b)));
  const choixEsp = (valeur, onChange, nom) => (<select value={valeur} aria-label={nom} onChange={e => onChange(e.target.value)} style={menu}><option value="">choisir…</option>{listeEsp.map(id => <option key={id} value={id}>{F(id)}</option>)}</select>);

  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['equation', 'Écrire l’équation'], ['lewis', 'Compléter un schéma de Lewis']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'equation' ? (() => {
        const r = defi.r, [x, y] = defi.ordre, couplesEnJeu = M.COUPLES.filter(c => [x, y].some(id => id === c.acide || id === c.base));
        return (<>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : l’équation d’une réaction acide-base</div>
          <div style={{ ...lbl, marginBottom: 8 }}>On mélange <strong>{F(x)}</strong> ({esp(x).nom}) et <strong>{F(y)}</strong> ({esp(y).nom}). Couples acide-base en jeu : {couplesEnJeu.map(c => c.texte).join(' ; ')}. Un des deux réactifs cède H⁺ à l’autre : écrivez l’équation de la réaction.</div>
          <label style={lbSel}>Quel réactif joue le rôle d’acide ?
            <select value={defi.acide} aria-label="Réactif qui joue le rôle d’acide" onChange={e => maj({ acide: e.target.value })} style={{ ...menu, marginTop: 2 }}><option value="">choisir…</option>{defi.ordre.map(id => <option key={id} value={id}>{F(id)}</option>)}</select></label>
          <IndiceDefi cache={defi.ok}>Un acide est une espèce qui cède H⁺ : cherchez, dans les couples donnés, quel réactif est écrit à gauche du « / » (côté acide).</IndiceDefi>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <label style={lbSel}>Produit 1{choixEsp(defi.p1, v => maj({ p1: v }), 'Produit 1')}</label>
            <label style={lbSel}>Produit 2{choixEsp(defi.p2, v => maj({ p2: v }), 'Produit 2')}</label>
          </div>
          <IndiceDefi cache={defi.ok}>Retirez H⁺ à l’acide pour obtenir sa base conjuguée, puis ajoutez H⁺ à l’autre réactif (la base) pour obtenir son acide conjugué. Vérifiez les atomes et la charge.</IndiceDefi>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <button onClick={verifierEquation} style={styleBouton(true, '#15803d')}>Vérifier</button>
            <button onClick={() => nouveauDefi('equation')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
          </div>
          {(defi.retour || defi.ok) && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#b91c1c' }}>{defi.ok ? '✓ Correct. ' : '✗ '}{defi.retour}</div>}
          {defi.revele && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt, lineHeight: 1.6 }}>Équation : <Eq t={M.texteReaction(r)} taille={15}/>. {F(r.c1.acide)} est l’acide (couple {r.c1.texte}) et {F(r.c2.base)} est la base (couple {r.c2.texte}) : un H⁺ passe de l’un à l’autre.</div>}
        </>);
      })() : (() => {
        const c = defi.cible, g = M.sansReponse(c), e = esp(c.id), el = g.atomes[c.i].el;
        return (<>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : compléter un schéma de Lewis</div>
          <div style={{ ...lbl, marginBottom: 6 }}>Schéma {de(e.nom)} : les doublets non liants et la charge de l’atome entouré en tirets ({el}) ont été effacés. Électrons de valence de l’atome seul : H 1 ; C 4 ; N 5 ; O 6.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={lbSel}>Doublets non liants sur l’atome {el}
              <select value={defi.lp} aria-label="Nombre de doublets non liants" onChange={e2 => maj({ lp: e2.target.value })} style={{ ...menu, marginTop: 2 }}><option value="">choisir…</option>{[0, 1, 2, 3].map(k => <option key={k} value={k}>{k}</option>)}</select></label>
            <label style={lbSel}>Charge de l’atome {el}
              <select value={defi.ch} aria-label="Charge de l’atome" onChange={e2 => maj({ ch: e2.target.value })} style={{ ...menu, marginTop: 2 }}><option value="">choisir…</option>{[['-1', '−1 (−)'], ['0', '0 (aucune)'], ['1', '+1 (+)']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          </div>
          <IndiceDefi cache={defi.ok}>Comptez les liaisons de l’atome (une double liaison compte 2). Il doit être entouré de 8 électrons : 2 par liaison et 2 par doublet non liant. Charge = électrons de valence de l’atome seul − (liaisons + 2 × doublets non liants).</IndiceDefi>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <button onClick={verifierLewis} style={styleBouton(true, '#15803d')}>Vérifier</button>
            <button onClick={() => nouveauDefi('lewis')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
          </div>
          {(defi.retour || defi.ok) && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#b91c1c' }}>{defi.ok ? '✓ Correct. ' : '✗ '}{defi.retour}</div>}
          {defi.revele && (() => { const rep = M.reponseLewis(c), b = M.nbLiaisons(e.graphe, c.i); return <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt, lineHeight: 1.6 }}>L’atome {el} a {b} liaison{b > 1 ? 's' : ''} et {rep.lp} doublet{rep.lp > 1 ? 's' : ''} non liant{rep.lp > 1 ? 's' : ''} : {2 * b + 2 * rep.lp} électrons autour de lui. Charge : {M.VALENCE[el]} − ({b} + 2 × {rep.lp}) = {M.chargeTxt(rep.charge)}.</div>; })()}
        </>);
      })()}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle de Brønsted</strong> : un acide cède un ion H⁺, une base le capte ; les deux espèces d’un couple acide / base ne diffèrent que par un H⁺ (atomes et charge conservés).</li>
      <li><strong>H⁺ écrit seul</strong> : H⁺ n’existe pas seul en solution. On l’écrit pour suivre le transfert (demi-équation) ; dans une réaction acide-base, il passe d’un acide à une base, ce qui fait apparaître ou consommer H₃O⁺ (ion oxonium) et H₂O.</li>
      <li><strong>Flèche des équations</strong> : la flèche → donne le sens du transfert étudié. Elle ne dit pas si la transformation est totale ou limitée : cela dépend des constantes d’acidité (Ka, simulation sur la force des acides), qui ne sont pas utilisées ici.</li>
      <li><strong>Schéma de Lewis</strong> : seuls les électrons de valence sont représentés ; octet (duet pour H) ; un trait = un doublet liant, un tiret = un doublet non liant ; la charge est portée par l’atome concerné. Le schéma est une écriture : les angles et les distances du dessin ne sont pas ceux de la molécule, et les atomes sont disposés pour la lisibilité.</li>
      <li><strong>Ion carboxylate (et ion carbonate)</strong> : on dessine une seule écriture (C=O d’un côté, O⁻ de l’autre). En réalité, les deux oxygènes terminaux jouent un rôle équivalent ; la mésomérie (formes limites) n’est pas au programme et n’est pas traitée.</li>
      <li><strong>Couples utilisés</strong> : H₃O⁺ / H₂O, H₂O / HO⁻, CO₂,H₂O / HCO₃⁻, HCO₃⁻ / CO₃²⁻, CH₃COOH / CH₃COO⁻, HCOOH / HCOO⁻, NH₄⁺ / NH₃, CH₃NH₃⁺ / CH₃NH₂ (les formules sont toujours fournies). CO₂,H₂O désigne le dioxyde de carbone dissous, parfois écrit H₂CO₃ : son schéma de Lewis n’est pas demandé.</li>
      <li><strong>Hors du sujet de cette simulation</strong> : valeurs de pKA, Ka, diagrammes de prédominance (voir la simulation sur la force des acides) ; flèches courbes et mécanismes (voir la simulation sur les mécanismes) ; acides α-aminés (renvoi vers la simulation dédiée).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const cE = cp(ex.couple), lewisE = M.aLewis(cE), AE = esp(cE.acide), BE = esp(cE.base);
  const demi = (() => {
    const hp = [{ id: cE.acide, n: 1 }], dr = [{ id: cE.base, n: 1 }];
    const a = M.bilan(hp), b = M.bilan(dr);
    const aAt = Object.entries(a.atomes), bAt = { ...b.atomes, H: (b.atomes.H || 0) + 1 };
    return { atomes: ORDRE_EL.filter(e => a.atomes[e]).map(e => `${e}${NB}${a.atomes[e]}`).join(' · '), atomesDroite: ORDRE_EL.filter(e => bAt[e]).map(e => `${e}${NB}${bAt[e]}`).join(' · '), ok: aAt.every(([e, k]) => bAt[e] === k) && a.charge === b.charge + 1, ca: a.charge, cb: b.charge };
  })();
  const rE = M.reaction(cp(ex.c1), cp(ex.c2)), conservation = M.conserve(rE), lr = ligneBilan(rE.reactifs), lpr = ligneBilan(rE.produits);
  const menuCouple = (valeur, onChange, nom) => (<select value={valeur} aria-label={nom} onChange={e => onChange(e.target.value)} style={menu}>{M.COUPLES.map(c => <option key={c.id} value={c.id}>{c.texte}</option>)}</select>);
  const sceneExplore = (<div style={styleBoite}>
    <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le schéma montre le couple choisi : appuyez sur le bouton pour retirer ou ajouter l’ion H⁺.</div>
    {lewisE ? <SceneCouple couple={cE} u={uEx}/> : <SceneFormules gauche={AE.formule} droite={`${BE.formule} + H⁺`} etiqG={AE.nom} etiqD="base conjuguée et ion H⁺" fleche="cède H⁺"/>}
    {lewisE ? <LegendeLewis/> : <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Le schéma de Lewis des espèces de l’acide carbonique (CO₂,H₂O, HCO₃⁻, CO₃²⁻) n’est pas demandé au programme : seule l’écriture du transfert est donnée.</div>}
  </div>);
  const boutonsEx = (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
    <button type="button" onClick={() => setEx(s => ({ ...s, sens: s.sens === 0 ? 1 : 0 }))} disabled={!lewisE} style={{ ...styleBouton(true, '#0369a1'), opacity: lewisE ? 1 : 0.5 }}>{ex.sens === 0 ? 'Retirer H⁺ (acide → base)' : 'Ajouter H⁺ (base → acide)'}</button>
    <button type="button" onClick={() => setEx(s => ({ ...s, sens: 0 }))} disabled={!lewisE || ex.sens === 0} style={{ ...stylePetitBouton(false), opacity: lewisE && ex.sens !== 0 ? 1 : 0.5 }}><Pic n="refresh"/>Rétablir l’acide</button>
  </div>);
  const reglagesEx = (
    <div style={styleBoite} className="brn-ctrl">
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Réglages</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Choisissez un couple acide / base : le schéma montre l’acide ; le bouton fait partir ou arriver l’ion H⁺.</div>
      <label style={lbSel}>Couple acide / base
        {menuCouple(ex.couple, v => setEx(s => ({ ...s, couple: v, sens: 0 })), 'Couple acide-base')}</label>
      {boutonsEx}
      <div style={{ ...phr, marginBottom: 4 }}>Demi-équation : <Eq t={`${AE.formule} → ${BE.formule} + H⁺`} taille={16}/></div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Atomes : {demi.atomes} à gauche, {demi.atomesDroite} à droite. Charge : {M.chargeTxt(demi.ca)} à gauche, {M.chargeTxt(demi.cb)} + (+1) = {M.chargeTxt(demi.cb + 1)} à droite. {demi.ok ? '✓ Tout est conservé.' : '✗ Non conservé.'}</div>
      {AE.sd && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6 }}>Formules semi-développées : acide {AE.sd} ; base {BE.sd}.</div>}
    </div>);
  const deuxCouples = (
    <div style={styleBoite}>
      <Section titre={`Réaction entre deux couples : ${F(cp(ex.c1).acide)} + ${F(cp(ex.c2).base)}`} ouvert={ouv.deux} onBascule={() => setOuv(o => ({ ...o, deux: !o.deux }))}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Choisissez l’acide d’un premier couple et la base d’un second couple : l’équation de la réaction acide-base s’écrit, avec la vérification des atomes et de la charge.</div>
        <label style={lbSel}>Couple 1 (on prend son acide, qui cède H⁺){menuCouple(ex.c1, v => setEx(s => ({ ...s, c1: v })), 'Couple 1')}</label>
        <label style={lbSel}>Couple 2 (on prend sa base, qui capte H⁺){menuCouple(ex.c2, v => setEx(s => ({ ...s, c2: v })), 'Couple 2')}</label>
        {ex.c1 === ex.c2 ? <div style={{ ...phr, color: '#b45309' }}>Choisissez deux couples différents : un couple réagit avec lui-même sans rien changer.</div> : <>
          <div style={{ ...phr, marginBottom: 4 }}>Équation : <Eq t={M.texteReaction(rE)} taille={16}/></div>
          <div style={{ ...phr, color: KIT.txt2 }}>H⁺ passe de {F(rE.c1.acide)} (acide du couple 1) à {F(rE.c2.base)} (base du couple 2).</div>
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6, marginTop: 6 }}>Réactifs : {lr.atomes} ; charge {lr.charge}. Produits : {lpr.atomes} ; charge {lpr.charge}. {conservation.atomes && conservation.charge ? '✓ Atomes et charge conservés.' : '✗ Non conservé.'}</div></>}
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Pour chaque couple, retirez H⁺ : combien de doublets non liants l’atome concerné gagne-t-il ? Sa charge change-t-elle de combien ?</li>
        <li>Comparez le couple CH₃COOH / CH₃COO⁻ et le couple CH₃NH₃⁺ / CH₃NH₂ : d’où part le H⁺ dans l’un, où se fixe-t-il dans l’autre ?</li>
        <li>Dans « Réaction entre deux couples », choisissez H₂O / HO⁻ pour le couple 1 et H₃O⁺ / H₂O pour le couple 2 : quel rôle joue l’eau de chaque côté ?</li>
        <li>Trouvez deux espèces qui apparaissent dans deux couples de la liste : que peut-on dire de leur rôle ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Acide : cède H⁺ ; base : capte H⁺ ; couple acide / base : deux espèces qui diffèrent d’un H⁺</li>
          <li>Acide carboxylique R–COOH → ion carboxylate R–COO⁻ : H⁺ part de O–H, le doublet reste sur O</li>
          <li>Amine R–NH₂ + H⁺ → ion ammonium R–NH₃⁺ : le doublet non liant de N fait la liaison, N⁺ a 4 liaisons</li>
          <li>Réaction acide-base : acide 1 + base 2 → base 1 + acide 2 ; atomes et charge conservés</li>
          <li>Espèce amphotère : acide d’un couple et base d’un autre (H₂O, HCO₃⁻)</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .brn-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .brn-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .brn-col { display: flex; flex-direction: column; gap: 12px; }
        .brn-df { display: block; margin-bottom: 12px; } .brn-df > * { margin-bottom: 12px; }
        @media (max-width: 900px) { .brn-l1.scene-haut .brn-main { order: -1; } }
        .brn-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .brn-l1.cote .brn-carte { order: 2; } .brn-l1.cote .brn-main { order: 1; }
          .brn-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .brn-df > * { margin-bottom: 0; } .brn-df-scene { grid-column: 1; grid-row: 1 / span 2; } .brn-df-volet { grid-column: 2; grid-row: 1; } .brn-df-hypo { grid-column: 2; grid-row: 2; }
          .brn-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .brn-ex > * { grid-column: 1; } .brn-ex > .brn-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .brn-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .brn-in { animation: brn-fondu 0.35s ease-out; } @keyframes brn-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Transferts de H⁺ : acides, bases et schémas de Lewis</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>{avecIndices('Un acide cède un ion H⁺, une base le capte : on le suit sur les schémas de Lewis des acides carboxyliques, des ions carboxylate, des amines et des ions ammonium.')}</div>
      {enGuide && <div className={`brn-l1 cote${idEtape === 'retire' || idEtape === 'capte' ? ' scene-haut' : ''}`}>
        <div className="brn-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="brn-main">
          <div className="brn-col">
            {sceneGuide && <div className="brn-in" key={'s-' + idEtape}><div style={styleBoite}>{sceneGuide}</div></div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div className="brn-df">
        <div className="brn-df-scene brn-in" key={'d' + defi.type}>{defi.type === 'equation'
          ? <div style={styleBoite}><SceneMelange a={defi.ordre[0]} b={defi.ordre[1]} aria="Les deux réactifs du mélange."/></div>
          : <div style={styleBoite}><SceneDefiLewis cible={defi.cible}/><LegendeLewis/></div>}</div>
        <div className="brn-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'equation' ? suiviE : suiviL}/></div></div>
        <div className="brn-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="brn-ex">
        <div>{sceneExplore}</div>
        <div className="brn-ctrl">{reglagesEx}</div>
        <div>{deuxCouples}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
