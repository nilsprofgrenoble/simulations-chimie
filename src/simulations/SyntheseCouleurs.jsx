import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./synthCouleurModele";
import { QCM } from "./synthCouleurQcm";
import { SvgSpectre, SvgCones, BarresCones, SvgCarteCones, SvgCarteAdditive, SvgCarteSoustractive, SvgCarteChoix } from "./SyntheseSchemas";
import { SceneLampes, SceneCoupe, SceneFiltres } from "./SyntheseScenes";

const C = M.C, SIM_ID = 299, CLE_GUIDE = 'syn-guide-v1';
declarerDefis(SIM_ID, [['appariement', 'Reproduire une lumière avec les trois lampes'], ['recette', 'Retrouver une teinte avec des pigments']]);

// ====================================================
//  SIM 299 — SYNTHÈSE ADDITIVE ET SYNTHÈSE SOUSTRACTIVE (BTS MDC, Formulation, « Aspect »)
//  Capacités visées (jamais affichées à l'élève) : expliquer le résultat d'un mélange de lumières colorées dans des cas simples ; expliquer la synthèse
//  additive et les anomalies de la vision colorée à partir de la théorie de Young ; expliquer le résultat d'un mélange de teintes dans des cas simples.
//  Modèle : synthCouleurModele.js (lumières, cônes, filtres, peintures). Schémas : SyntheseSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8', gris: '#475569' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const n0 = v => String(Math.round(v)).replace('-', '−');
const pct = v => `${n0(v * 100)} %`;
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['lampes', 'jaune', 'cones', 'appar', 'compl', 'anomalie', 'filtre', 'serie', 'peinture', 'moyenne', 'blanc', 'modele', 'bilan'];
const BASE = { r: 1, v: 0, b: 0, pj: 0.5, pc: 0.5, pb: 0, filtre: 'jaune', cf: 0.8, oeil: 'normal' };
const DEPART = { lampes: { r: 1, v: 0, b: 0 }, appar: { r: 0.3, v: 0.3, b: 0 }, compl: { r: 1, v: 1, b: 0.3 }, filtre: { filtre: 'jaune', cf: 0.8 }, peinture: { pj: 0.5, pc: 0.5 }, blanc: { pj: 0.5, pc: 0.5, pb: 0 } };
const COUL_FILTRE = { jaune: '#b45309', magenta: '#a21caf', cyan: '#0e7490' };
const NOMS_PIG = { jaune: 'jaune', magenta: 'magenta', cyan: 'cyan' };
const LAMBDAS = M.LAMBDAS, iL = l => LAMBDAS.indexOf(l);
const JAUNE = M.equivalentRV(M.JAUNE.lam, M.JAUNE.Y), SP_JAUNE = M.spectreMono(M.JAUNE.lam, M.JAUNE.Y), SP_MIX = M.spectreRVB(JAUNE.r, JAUNE.v, 0);
const CIBLE = JAUNE.mono;   // réponses L, M, S de la lumière jaune à 580 nm
const DEUT = M.paireDeuteranope();
const LAM_SERIE = 510, TJ = M.transmittance({ jaune: 1 })[iL(LAM_SERIE)], TC = M.transmittance({ cyan: 1 })[iL(LAM_SERIE)];
const arr2 = v => Math.round(v * 100) / 100;
const Pastille = ({ css, nom, hauteur = 44 }) => (<div style={{ flex: 1, minWidth: 0 }}><div aria-hidden="true" style={{ height: hauteur, borderRadius: 8, background: css, border: '1.5px solid #334155' }}/>{nom && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3, textAlign: 'center' }}>{nom}</div>}</div>);
const Ligne = ({ children }) => <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>{children}</div>;
const dominante = s => { const c = M.chroma(s), l = C.lireChromaticite(c.x, c.y); return l.blanc ? 'blanc' : l.pourpre ? 'pourpre' : `${n0(l.dominante)} nm`; };

export function SimulationSyntheseCouleurs() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState({ vol: 'lumieres', r: 0.7, v: 0.35, b: 0, cible: 0, lamCible: 580, support: 'peinture', pj: 0.5, pm: 0, pc: 0.5, pb: 0, pn: 0, modele: 'ks' });
  const [ouv, setOuv] = useState({});
  const [suiviA, noterA] = useCompteurDefi(), [suiviR, noterR] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('appariement');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const patch = (c) => M.cssPeinture(c), lab = r => M.labPeinture(r), chroma = (L) => Math.hypot(L.a, L.b);

  // ---------- parcours ----------
  const mixV = M.spectreRVB(vie.r, vie.v, vie.b), repV = M.reponses(mixV);
  const okAppar = Math.abs(repV.L - CIBLE.L) <= 0.04 * CIBLE.L && Math.abs(repV.M - CIBLE.M) <= 0.04 * CIBLE.M && Math.abs(repV.S - CIBLE.S) <= 2;
  const cW = C.BLANC_XY, cV = M.chroma(mixV), okCompl = Math.abs(cV.x - cW.x) <= 0.012 && Math.abs(cV.y - cW.y) <= 0.012;
  const ETAPES = [
    { id: 'lampes', titre: 'Trois lampes, un spectre', focus: ['scene', 'curseur'],
      texte: <>Une <strong>lampe à LED</strong> n’émet pas toutes les longueurs d’onde : son <strong>spectre</strong> montre la lumière émise pour chaque longueur d’onde. Ici, trois lampes : une <strong>rouge</strong>, une <strong>verte</strong>, une <strong>bleue</strong>. Réglez leur intensité avec les curseurs et regardez le spectre de la lumière obtenue en les allumant ensemble (courbe noire).</>,
      tache: { type: 'qcm', q: 'On allume seulement les lampes rouge et verte. Le spectre de la lumière obtenue est…', ...QCM.lampes,
        expl: 'Quand on superpose des lumières, leurs spectres s’additionnent longueur d’onde par longueur d’onde : on garde les deux bosses, rouge et verte. C’est le principe de la synthèse additive.', indice: 'Allumez uniquement le rouge et le vert avec les curseurs et regardez la courbe noire.' } },
    { id: 'jaune', titre: 'Deux lumières jaunes ?', focus: ['scene', 'mesures'],
      texte: <>Voici deux lumières. La première vient des lampes <strong>rouge et verte</strong> ({pct(JAUNE.r)} et {pct(JAUNE.v)}). La seconde est une lumière <strong>monochromatique de 580 nm</strong> (lampe à vapeur de sodium, laser). Regardez leurs spectres, puis leurs coordonnées de chromaticité (x ; y) dans les mesures.</>,
      tache: { type: 'qcm', q: 'Que montre cette comparaison ?', ...QCM.jaune,
        expl: 'Les spectres sont très différents (deux bosses d’un côté, un pic étroit de l’autre) et pourtant les deux lumières ont presque les mêmes coordonnées (x ; y) : elles paraissent de la même couleur. Voir la couleur ne permet donc pas de retrouver le spectre.', indice: 'Comparez la forme des deux spectres, puis les valeurs de x et de y.' } },
    { id: 'cones', titre: 'Trois types de cônes : la théorie de Young', focus: ['scene', 'mesures'],
      texte: <>L’œil a trois types de cônes, <strong>L</strong>, <strong>M</strong> et <strong>S</strong>, sensibles aux grandes, moyennes et courtes longueurs d’onde (<strong>théorie de Young</strong>). Chaque type fait la somme, sur toutes les longueurs d’onde, de la lumière reçue pondérée par sa sensibilité : il ne transmet au cerveau qu’<strong>un seul nombre</strong>. Les barres donnent ces trois nombres pour les deux lumières de l’étape précédente.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’œil voit-il la même couleur pour ces deux lumières ?', ...QCM.cones,
        expl: 'La couleur perçue ne dépend que des trois nombres (L, M, S). Les deux lumières, de spectres différents, donnent les mêmes réponses des cônes : l’œil ne peut pas les distinguer. La synthèse additive est une propriété de l’œil, pas de la lumière.', indice: 'Comparez les barres des deux lumières, cône par cône.' } },
    { id: 'appar', titre: 'Reproduire la lumière jaune avec les lampes',
      retenirTitre: 'À retenir : trois cônes, trois nombres', retenir: <SvgCarteCones/>, focus: ['scene', 'curseur', 'mesures'],
      texte: <>On veut <strong>reproduire la lumière jaune de 580 nm</strong> avec la lampe rouge et la lampe verte (la bleue reste éteinte), de façon que les <strong>barres L, M et S</strong> des deux lumières soient les mêmes. C’est l’<strong>expérience d’appariement</strong> qui a permis de définir l’observateur standard. Réglez les deux curseurs jusqu’à ce que les barres coïncident.</>,
      tache: { type: 'action', ok: okAppar, label: 'Faire coïncider les réponses L, M et S (à 4 % près)', faire: () => setVie(v => ({ ...v, r: arr2(JAUNE.r), v: arr2(JAUNE.v), b: 0 })), consigne: 'Réglez les lampes rouge et verte pour que les barres L et M des deux lumières soient égales à 4 % près' } },
    { id: 'compl', titre: 'Deux lumières complémentaires : du blanc', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Deux lumières sont <strong>complémentaires</strong> quand leur somme donne du <strong>blanc</strong>. Le jaune des lampes rouge et verte (à fond) a-t-il une complémentaire parmi les trois lampes ? Réglez la lampe <strong>bleue</strong> jusqu’à obtenir le blanc de la lumière du jour D65, de coordonnées <strong>(0,313 ; 0,329)</strong> : l’écart doit être inférieur à 0,012 sur x et sur y.</>,
      tache: { type: 'action', ok: okCompl, label: 'Obtenir le blanc D65 avec la lampe bleue', faire: () => setVie(v => ({ ...v, r: 1, v: 1, b: 1 })), consigne: 'Réglez la lampe bleue pour que x et y soient proches de 0,313 et 0,329' } },
    { id: 'anomalie', titre: 'Un œil sans cônes M : le daltonisme',
      retenirTitre: 'À retenir : la synthèse additive', retenir: <><SvgCarteAdditive/>
        <ul style={puces}><li>Les spectres des lumières s’ajoutent ; l’œil les résume en trois nombres.</li><li>Primaires : rouge, vert, bleu. Deux lumières complémentaires donnent du blanc.</li></ul></>, focus: ['scene', 'curseur', 'mesures'],
      texte: <>Certaines personnes n’ont pas de cônes <strong>M</strong> (<strong>deutéranopie</strong>) : leur œil n’a plus que deux nombres. Voici deux lumières bien différentes pour un œil normal, un <strong>orange</strong> (610 nm) et un <strong>vert-jaune</strong> (545 nm), réglées pour avoir la <strong>même réponse L</strong>. Basculez entre l’œil normal et l’œil sans cônes M.</>,
      tache: { type: 'qcm', q: 'Pourquoi un œil sans cônes M confond-il ces deux lumières ?', ...QCM.anomalie,
        expl: 'Les deux lumières ont la même réponse L et une réponse S négligeable : elles ne diffèrent que par la réponse M. Sans cônes M, l’information qui les distingue est perdue. Cette confusion rouge-vert est la plus fréquente des anomalies de la vision colorée.', indice: 'Observez les barres : lesquelles sont égales, laquelle diffère ?' } },
    { id: 'filtre', titre: 'Un filtre retire de la lumière', focus: ['scene', 'curseur'],
      texte: <>Passons à la <strong>synthèse soustractive</strong>. Un <strong>filtre coloré</strong> placé devant une lampe blanche ne crée pas de lumière : il en <strong>absorbe</strong> une partie. Sa <strong>transmittance</strong> T est la fraction de la lumière transmise, longueur d’onde par longueur d’onde (courbe). Choisissez un filtre et réglez sa concentration.</>,
      tache: { type: 'qcm', q: 'Un filtre jaune, éclairé en lumière blanche,…', ...QCM.filtre,
        expl: 'La courbe de transmittance du filtre jaune est basse pour les courtes longueurs d’onde (bleu) et proche de 1 au-delà : le filtre absorbe le bleu et transmet le vert et le rouge, dont la somme donne du jaune.', indice: 'Regardez où la courbe est basse et où elle est proche de 1, sur le spectre coloré sous le graphique.' } },
    { id: 'serie', titre: 'Deux filtres l’un derrière l’autre', focus: ['scene', 'mesures'],
      texte: <>On place le filtre <strong>jaune</strong> puis le filtre <strong>cyan</strong>, chacun à la concentration maximale, devant la lampe. À {LAM_SERIE} nm, le premier laisse passer la fraction <strong>{fr(arr2(TJ), 2)}</strong> de la lumière, le second <strong>{fr(arr2(TC), 2)}</strong>. Les absorbances s’additionnent : la lumière subit successivement les deux filtres.</>,
      tache: { type: 'num', q: 'Transmittance T des deux filtres en série à 510 nm', unite: '', vrai: arr2(TJ) * arr2(TC), tol: 0.04, affiche: v => fr(v, 2), cs: 2,
        calcul: () => [`Chaque filtre transmet une fraction de la lumière qui arrive sur lui : T₁ = ${fr(arr2(TJ), 2)} puis T₂ = ${fr(arr2(TC), 2)}.`, `T = T₁ × T₂ = ${fr(arr2(TJ), 2)} × ${fr(arr2(TC), 2)} ≈ ${fr(arr2(TJ) * arr2(TC), 2)}. Hypothèse : on néglige les réflexions sur les faces des filtres.`],
        pieges: [[arr2(TJ) + arr2(TC), 'Vous avez additionné les transmittances. Les transmittances se multiplient (les absorbances, elles, s’additionnent).'], [(arr2(TJ) + arr2(TC)) / 2, 'Vous avez fait la moyenne. La lumière passe d’abord le premier filtre, puis le second : on multiplie.']],
        expl: 'La lumière qui sort du premier filtre est ensuite réduite par le second : on multiplie les transmittances, T = T₁ × T₂. Les deux filtres absorbent chacun une partie différente du spectre, il ne reste que le vert.', indice: 'Le second filtre ne reçoit que la fraction T₁ de la lumière, et n’en transmet la fraction T₂.' } },
    { id: 'peinture', titre: 'Une peinture : des pigments qui absorbent et diffusent', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Une couche de peinture n’est pas un filtre : la lumière y entre, est <strong>diffusée</strong> par les pigments, en partie <strong>absorbée</strong>, et ressort vers l’œil. Sa couleur dépend de sa <strong>réflectance</strong> R(λ). La théorie de <strong>Kubelka-Munk</strong> relie R au rapport <strong>K/S</strong> (absorption sur diffusion). Mélangez un pigment jaune et un pigment cyan : regardez la réflectance du mélange (courbe verte).</>,
      tache: { type: 'qcm', q: 'Quand on mélange deux pigments, quelle grandeur s’additionne ?', ...QCM.peinture,
        expl: 'Ce sont les pouvoirs absorbants K/S des pigments, pondérés par leurs concentrations, qui s’additionnent. La réflectance, elle, ne s’additionne pas : elle se déduit du K/S total. Le mélange jaune + cyan absorbe le bleu et le rouge : il ne reste que le vert.', indice: 'Pensez aux absorbances des filtres : ce qui s’additionne, c’est ce qui est absorbé.' } },
    { id: 'moyenne', titre: 'Pourquoi pas la moyenne des réflectances ?',
      retenirTitre: 'À retenir : la synthèse soustractive', retenir: <><SvgCarteSoustractive/>
        <ul style={puces}><li>Une peinture ou un filtre retire de la lumière : primaires cyan, magenta, jaune.</li><li>Ce sont les absorptions (A, K/S) qui s’additionnent : les transmittances se multiplient.</li></ul></>, focus: ['scene', 'mesures'],
      texte: <>On pourrait croire que le mélange de deux peintures a pour réflectance la <strong>moyenne</strong> des réflectances de chaque peinture. Comparez cette prévision (courbe en pointillés, pastille de gauche) avec le calcul par K/S (courbe pleine, pastille de droite), pour 50 % de pigment jaune et 50 % de pigment cyan.</>,
      tache: { type: 'qcm', q: 'Avec la moyenne des réflectances, on obtiendrait un vert…', ...QCM.moyenne,
        expl: 'La moyenne donne une réflectance élevée partout : un vert pâle, presque gris. Le calcul par K/S additionne les absorptions : chaque pigment retire sa part de lumière et le vert est bien plus sombre et saturé (C* plus grand).', indice: 'Comparez L* (clarté) et C* (saturation) dans les mesures.' } },
    { id: 'blanc', titre: 'Éclaircir avec du blanc', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Le pigment <strong>blanc</strong> (dioxyde de titane) n’absorbe presque pas : il <strong>diffuse</strong> la lumière. Ajouter du blanc à un mélange vert augmente la diffusion S, donc diminue K/S. Réglez la quantité de blanc et observez <strong>L*</strong> (clarté) et <strong>C*</strong> (saturation) du mélange.</>,
      tache: { type: 'qcm', q: 'On ajoute du pigment blanc à une peinture verte. Que deviennent L* et C* ?', ...QCM.blanc,
        expl: 'Plus de diffusion, K/S plus petit : la réflectance augmente partout, donc L* augmente ; l’écart entre les longueurs d’onde absorbées et renvoyées se réduit, donc la couleur est moins saturée (C* diminue). C’est le principe d’une teinte claire.', indice: 'Faites passer le blanc de 0 à 100 % et lisez L* et C*.' } },
    { id: 'modele', titre: 'Additive ou soustractive : quel modèle choisir ?', focus: [],
      texte: <>Dans la synthèse <strong>additive</strong>, on <strong>ajoute des lumières</strong> : les spectres s’additionnent. Dans la synthèse <strong>soustractive</strong>, un filtre, un pigment ou un colorant <strong>retire</strong> de la lumière à une lumière blanche : les absorptions s’additionnent et les transmittances se multiplient. Pour choisir, on se demande : y a-t-il <strong>plusieurs sources</strong> qui émettent, ou <strong>une seule lumière</strong> qui traverse ou éclaire un objet ?</>,
      tache: { type: 'qcm', q: 'Dans quelle situation la synthèse additive s’applique-t-elle ?', ...QCM.modele,
        expl: 'La synthèse additive concerne les sources de lumière qu’on superpose (projecteurs, pixels d’un écran). Les filtres, peintures et encres retirent de la lumière : synthèse soustractive.', indice: 'Cherchez la situation où deux sources de lumière éclairent la même zone.' } },
    { id: 'bilan', titre: 'Le bilan : additive et soustractive', focus: [],
      retenirTitre: 'À retenir : choisir le modèle', retenir: <><SvgCarteChoix/>
        <ul style={puces}><li>Additive : on ajoute des lumières ; l’œil ne garde que trois nombres (L, M, S).</li><li>Soustractive : on retire de la lumière ; on additionne les absorptions (A, K/S).</li><li>Même couleur ne veut pas dire même spectre.</li></ul></>,
      texte: <>Vous savez expliquer le résultat d’un mélange de lumières, relier la synthèse additive aux trois types de cônes et au daltonisme, puis expliquer le mélange de filtres et de pigments (additivité de l’absorption, rôle du blanc). En exploration, mélangez lumières, filtres et peintures ; les défis testent la reproduction d’une lumière et d’une teinte.</> },
  ];
  const IDS = ORDRE, etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => ({ ...BASE, ...(DEPART[IDS[ni]] ?? {}) }));
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE;
  const spectresLampes = (r, v, b, ymax = 24) => (<SvgSpectre ymax={ymax} yTitre="intensité" label="Spectre des trois lampes et de la lumière obtenue"
    courbes={[{ v: M.spectreRVB(r, 0, 0), col: COL.rouge, w: 1.8, dash: '5 3', nom: r > 0.08 ? 'rouge' : '', dy: -6 }, { v: M.spectreRVB(0, v, 0), col: COL.vert, w: 1.8, dash: '5 3', nom: v > 0.08 ? 'verte' : '', dy: -6 }, { v: M.spectreRVB(0, 0, b), col: COL.bleu, w: 1.8, dash: '5 3', nom: b > 0.08 ? 'bleue' : '', dy: -6 },
      { v: M.spectreRVB(r, v, b), col: '#0f172a', w: 3, fill: '#94a3b8', fillOpacity: 0.3 }]}/>);
  const filtreC = { [vie.filtre]: vie.cf };
  const Tf = M.transmittance(filtreC);
  const Tj1 = M.transmittance({ jaune: 1 }), Tc1 = M.transmittance({ cyan: 1 }), Tjc1 = Tj1.map((v, i) => v * Tc1[i]);
  const RJ = M.reflPeinture({ jaune: vie.pj }), RC = M.reflPeinture({ cyan: vie.pc }), RM = M.reflPeinture({ jaune: vie.pj, cyan: vie.pc, blanc: vie.pb });
  const RMOY = M.reflMoyenne({ jaune: 0.5, cyan: 0.5 }), RKM = M.reflPeinture({ jaune: 0.5, cyan: 0.5 });
  const RSB = M.reflPeinture({ jaune: vie.pj, cyan: vie.pc }), labM = lab(RM), labMoy = lab(RMOY), labKM = lab(RKM);
  const dpO = DEUT.co, dpV = DEUT.cg;
  const sceneGuide = !enGuide ? null
    : sc === 'lampes' ? <><SceneLampes r={vie.r} v={vie.v} b={vie.b}/><div style={{ height: 6 }}/>{spectresLampes(vie.r, vie.v, vie.b)}</>
    : sc === 'jaune' ? <><Ligne><Pastille css={M.cssLumiere(SP_MIX)} nom="rouge + verte" hauteur={30}/><Pastille css={M.cssLumiere(SP_JAUNE)} nom="monochromatique 580 nm" hauteur={30}/></Ligne>
        <SvgSpectre ymax={32} yTitre="intensité" label="Spectres du mélange rouge et vert, et de la lumière de 580 nm" courbes={[{ v: SP_MIX, col: COL.orange, w: 2.6, fill: COL.orange, nom: 'rouge + verte', l: 625, dy: -7 }, { v: SP_JAUNE, col: '#4c1d95', w: 2.6, nom: '580 nm', l: 580, dy: -6 }]}/></>
    : sc === 'cones' ? <><SvgCones marques={[{ l: 580, txt: '580 nm' }]}/><div style={{ height: 8 }}/><BarresCones a={JAUNE.mix} b={JAUNE.mono} nomA="rouge + verte" nomB="580 nm" ymax={60}/></>
    : sc === 'appar' ? <><SceneLampes r={vie.r} v={vie.v} b={vie.b}/><Ligne><Pastille css={M.cssLumiere(mixV)} nom="mélange rouge + verte" hauteur={28}/><Pastille css={M.cssLumiere(SP_JAUNE)} nom="lumière jaune de 580 nm" hauteur={28}/></Ligne><BarresCones a={repV} b={CIBLE} nomA="rouge + verte" nomB="580 nm" ymax={60}/></>
    : sc === 'compl' ? <><SceneLampes r={vie.r} v={vie.v} b={vie.b}/><Ligne><Pastille css={M.cssLumiere(mixV)} nom="lumière obtenue" hauteur={30}/><Pastille css="#ffffff" nom="blanc D65" hauteur={30}/></Ligne>{spectresLampes(vie.r, vie.v, vie.b)}</>
    : sc === 'anomalie' ? <><Ligne><Pastille css={M.cssLumiere(DEUT.orange)} nom="orange, 610 nm" hauteur={28}/><Pastille css={M.cssLumiere(DEUT.vert)} nom="vert-jaune, 545 nm" hauteur={28}/></Ligne>
        <BarresCones a={dpO} b={dpV} nomA="orange" nomB="vert-jaune" ymax={60} masqueM={vie.oeil === 'sansM'} label="Réponses des cônes aux deux lumières"/>
        {vie.oeil === 'sansM' && <div style={{ fontSize: 13.5, color: COL.rouge, marginTop: 4, fontWeight: 700, textAlign: 'center' }}>Sans cônes M, les deux lumières ne diffèrent plus que par un nombre égal : elles sont confondues.</div>}</>
    : sc === 'filtre' ? <><SceneFiltres filtres={[{ nom: `filtre ${vie.filtre} (${pct(vie.cf)})`, T: Tf, col: COUL_FILTRE[vie.filtre] }]}/><Ligne><Pastille css="#ffffff" nom="lampe blanche" hauteur={28}/><Pastille css={M.cssFiltre(Tf)} nom="après le filtre" hauteur={28}/></Ligne>
        <SvgSpectre graduations yTitre="transmittance" label="Transmittance du filtre" courbes={[{ v: Tf, col: COUL_FILTRE[vie.filtre], w: 3, fill: COUL_FILTRE[vie.filtre], nom: '', l: 600 }]}/></>
    : sc === 'serie' ? <><SceneFiltres filtres={[{ nom: 'filtre jaune', T: Tj1, col: COUL_FILTRE.jaune }, { nom: 'filtre cyan', T: Tc1, col: COUL_FILTRE.cyan }]}/><Ligne><Pastille css={M.cssFiltre(Tj1)} nom="filtre jaune" hauteur={26}/><Pastille css={M.cssFiltre(Tc1)} nom="filtre cyan" hauteur={26}/><Pastille css={M.cssFiltre(Tjc1)} nom="les deux" hauteur={26}/></Ligne>
        <SvgSpectre graduations yTitre="transmittance" marques={[{ l: LAM_SERIE, txt: `${LAM_SERIE} nm` }]} label="Transmittance des filtres jaune et cyan, et des deux en série"
          courbes={[{ v: Tj1, col: COUL_FILTRE.jaune, w: 2.4, dash: '7 4', nom: 'jaune', l: 640, dy: -8 }, { v: Tc1, col: COUL_FILTRE.cyan, w: 2.4, dash: '2 3', nom: 'cyan', l: 440, dy: -8 }, { v: Tjc1, col: COL.vert, w: 3.4, fill: COL.vert, nom: 'les deux', l: 560, dy: -8 }]}/></>
    : sc === 'peinture' ? <><SceneCoupe R={RSB} css={patch(RSB)} pig={{ jaune: vie.pj, cyan: vie.pc }}/><Ligne><Pastille css={patch(RJ)} nom="pigment jaune" hauteur={26}/><Pastille css={patch(RC)} nom="pigment cyan" hauteur={26}/><Pastille css={patch(RSB)} nom="mélange" hauteur={26}/></Ligne>
        <SvgSpectre graduations yTitre="réflectance" label="Réflectance des pigments jaune et cyan, et du mélange" courbes={[{ v: RJ, col: COUL_FILTRE.jaune, w: 2.2, dash: '7 4', nom: 'jaune', l: 640, dy: -8 }, { v: RC, col: COUL_FILTRE.cyan, w: 2.2, dash: '2 3', nom: 'cyan', l: 440, dy: -8 }, { v: RSB, col: COL.vert, w: 3.4, fill: COL.vert, nom: 'mélange', l: 540, dy: -8 }]}/></>
    : sc === 'moyenne' ? <><Ligne><Pastille css={patch(RMOY)} nom="moyenne des réflectances" hauteur={30}/><Pastille css={patch(RKM)} nom="calcul par K/S" hauteur={30}/></Ligne>
        <SvgSpectre graduations yTitre="réflectance" label="Réflectance du mélange : moyenne et Kubelka-Munk" courbes={[{ v: RMOY, col: COL.gris, w: 2.6, dash: '7 4', nom: 'moyenne', l: 540, dy: -8 }, { v: RKM, col: COL.vert, w: 3.4, fill: COL.vert, nom: 'K/S', l: 540, dy: 16 }]}/></>
    : sc === 'blanc' ? <><SceneCoupe R={RM} css={patch(RM)} pig={{ jaune: vie.pj, cyan: vie.pc, blanc: vie.pb }}/><Ligne><Pastille css={patch(RSB)} nom="sans blanc" hauteur={28}/><Pastille css={patch(RM)} nom="avec le blanc" hauteur={28}/></Ligne>
        <SvgSpectre graduations yTitre="réflectance" label="Réflectance du mélange vert avec du pigment blanc" courbes={[{ v: RSB, col: COL.gris, w: 2.2, dash: '7 4', nom: 'sans blanc', l: 540, dy: 16 }, { v: RM, col: COL.vert, w: 3.4, fill: COL.vert, nom: 'avec blanc', l: 540, dy: -8 }]}/></>
    : null;
  const MES_GUIDE = {
    jaune: [['x ; y, rouge + verte', `${fr(M.chroma(SP_MIX).x, 3)} ; ${fr(M.chroma(SP_MIX).y, 3)}`], ['x ; y, 580 nm', `${fr(M.chroma(SP_JAUNE).x, 3)} ; ${fr(M.chroma(SP_JAUNE).y, 3)}`]],
    cones: [['Réponses L ; M ; S, rouge + verte', `${fr(JAUNE.mix.L, 1)} ; ${fr(JAUNE.mix.M, 1)} ; ${fr(JAUNE.mix.S, 1)}`], ['Réponses L ; M ; S, 580 nm', `${fr(JAUNE.mono.L, 1)} ; ${fr(JAUNE.mono.M, 1)} ; ${fr(JAUNE.mono.S, 1)}`]],
    appar: [['L ; M ; S, rouge + verte', `${fr(repV.L, 1)} ; ${fr(repV.M, 1)} ; ${fr(repV.S, 1)}`], ['L ; M ; S, 580 nm', `${fr(CIBLE.L, 1)} ; ${fr(CIBLE.M, 1)} ; ${fr(CIBLE.S, 1)}`]],
    compl: [['x ; y de la lumière', `${fr(cV.x, 3)} ; ${fr(cV.y, 3)}`], ['x ; y du blanc D65', '0,313 ; 0,329']],
    anomalie: [['L ; M ; S, orange', `${fr(dpO.L, 1)} ; ${fr(dpO.M, 1)} ; ${fr(dpO.S, 1)}`], ['L ; M ; S, vert-jaune', `${fr(dpV.L, 1)} ; ${fr(dpV.M, 1)} ; ${fr(dpV.S, 1)}`], ['Dominante, œil normal', `${dominante(DEUT.orange)} et ${dominante(DEUT.vert)}`]],
    serie: [['T à 510 nm, filtre jaune', fr(arr2(TJ), 2)], ['T à 510 nm, filtre cyan', fr(arr2(TC), 2)]],
    peinture: [['L* ; a* ; b* du mélange', `${fr(lab(RSB).L)} ; ${fr(lab(RSB).a)} ; ${fr(lab(RSB).b)}`]],
    moyenne: [['L* ; C*, moyenne des réflectances', `${fr(labMoy.L)} ; ${fr(chroma(labMoy))}`], ['L* ; C*, calcul par K/S', `${fr(labKM.L)} ; ${fr(chroma(labKM))}`]],
    blanc: [['Blanc ajouté', pct(vie.pb)], ['L* ; C*, sans blanc', `${fr(lab(RSB).L)} ; ${fr(chroma(lab(RSB)))}`], ['L* ; C*, avec le blanc', `${fr(labM.L)} ; ${fr(chroma(labM))}`]],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab_, val, min, max, step, onCh, aide, couleur = '#7c3aed') => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: couleur }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const setV = k => ev => setVie(s => ({ ...s, [k]: parseFloat(ev.target.value) }));
  const curseurGuide = enGuide && ['lampes', 'appar', 'compl', 'anomalie', 'filtre', 'peinture', 'blanc'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {(sc === 'lampes' || sc === 'appar') && <>
        {curs('sy-r', `Lampe rouge : ${pct(vie.r)}`, vie.r, 0, 1, 0.01, setV('r'), null, COL.rouge)}
        {curs('sy-v', `Lampe verte : ${pct(vie.v)}`, vie.v, 0, 1, 0.01, setV('v'), null, COL.vert)}
        {sc === 'lampes' && curs('sy-b', `Lampe bleue : ${pct(vie.b)}`, vie.b, 0, 1, 0.01, setV('b'), null, COL.bleu)}
        {sc === 'appar' && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>La lampe bleue reste éteinte. Les barres des deux lumières se lisent cône par cône.</div>}</>}
      {sc === 'compl' && <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5 }}>Lampes rouge et verte : à fond (jaune).</div>
        {curs('sy-bc', `Lampe bleue : ${pct(vie.b)}`, vie.b, 0, 1, 0.01, setV('b'), '0 % : lampe éteinte ; 100 % : à fond.', COL.bleu)}</>}
      {sc === 'anomalie' && <><div style={libelle}>Œil</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[['normal', 'Œil normal (L, M, S)'], ['sansM', 'Sans cônes M (deutéranope)']].map(([id, l]) => <button key={id} onClick={() => setVie(v => ({ ...v, oeil: id }))} aria-pressed={vie.oeil === id} style={stylePetitBouton(vie.oeil === id, '#7c3aed')}>{l}</button>)}</div></>}
      {sc === 'filtre' && <>{selecteur('sy-filtre', 'Filtre', vie.filtre, ev => setVie(v => ({ ...v, filtre: ev.target.value })), [{ id: 'jaune', nom: 'Filtre jaune' }, { id: 'magenta', nom: 'Filtre magenta' }, { id: 'cyan', nom: 'Filtre cyan' }])}
        {curs('sy-cf', `Concentration du filtre : ${pct(vie.cf)}`, vie.cf, 0, 1, 0.01, setV('cf'), '0 % : pas de filtre.')}</>}
      {sc === 'peinture' && <>
        {curs('sy-pj', `Pigment jaune : ${pct(vie.pj)}`, vie.pj, 0, 1, 0.01, setV('pj'), null, COL.orange)}
        {curs('sy-pc', `Pigment cyan : ${pct(vie.pc)}`, vie.pc, 0, 1, 0.01, setV('pc'), null, '#0e7490')}</>}
      {sc === 'blanc' && curs('sy-pb', `Pigment blanc : ${pct(vie.pb)}`, vie.pb, 0, 1, 0.01, setV('pb'), '50 % de jaune et 50 % de cyan, avec du blanc en plus.', COL.gris)}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'appariement' ? { kind, ...M.tirageAppariement(Math.random), dr: 0, dv: 0, db: 0, verifie: false } : { kind, ...M.tirageRecette(Math.random), dj: 0, dm: 0, dc: 0, dw: 0, verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(d => ({ ...d, ...f, verifie: false }));
  const obt = defi && (defi.kind === 'appariement' ? M.chroma(M.spectreRVB(defi.dr, defi.dv, defi.db)) : null);
  const labD = defi && defi.kind === 'recette' ? lab(M.reflPeinture({ jaune: defi.dj, magenta: defi.dm, cyan: defi.dc, blanc: defi.dw })) : null;
  const ecartD = labD ? C.deltaE76(labD, defi.lab) : null;
  const verifier = () => {
    let ok;
    if (defi.kind === 'appariement') { ok = Math.hypot(obt.x - defi.x, obt.y - defi.y) <= 0.012 && Math.abs(obt.Y - defi.Y) <= 0.06 * defi.Y; noterA(ok); }
    else { ok = ecartD <= 4; noterR(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['appariement', 'Reproduire une lumière'], ['recette', 'Retrouver une teinte']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'appariement' ? 'Défi : reproduire une lumière avec les trois lampes' : 'Défi : retrouver une teinte avec des pigments'}</div>
      {defi.kind === 'appariement' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>La lumière cible a pour coordonnées <strong>x = {fr(defi.x, 3)}</strong>, <strong>y = {fr(defi.y, 3)}</strong> et pour luminance <strong>Y = {fr(defi.Y, 0)}</strong>. Réglez les trois lampes pour obtenir x et y à 0,012 près et Y à 6 % près.</div>
        <Ligne><Pastille css={C.cssXY(defi.x, defi.y, defi.Y)} nom="cible" hauteur={34}/><Pastille css={M.cssLumiere(M.spectreRVB(defi.dr, defi.dv, defi.db))} nom="ma lumière" hauteur={34}/></Ligne>
        {curs('sy-dr', `Lampe rouge : ${pct(defi.dr)}`, defi.dr, 0, 1, 0.01, ev => maj({ dr: parseFloat(ev.target.value) }), null, COL.rouge)}
        {curs('sy-dv', `Lampe verte : ${pct(defi.dv)}`, defi.dv, 0, 1, 0.01, ev => maj({ dv: parseFloat(ev.target.value) }), null, COL.vert)}
        {curs('sy-db', `Lampe bleue : ${pct(defi.db)}`, defi.db, 0, 1, 0.01, ev => maj({ db: parseFloat(ev.target.value) }), null, COL.bleu)}
        <div style={{ marginTop: 8 }}><LigneMesure nom="Vos lampes : x ; y ; Y" valeur={`${fr(obt.x, 3)} ; ${fr(obt.y, 3)} ; ${fr(obt.Y, 0)}`}/></div></>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>La teinte cible a pour coordonnées <strong>L* = {fr(defi.lab.L)}</strong>, <strong>a* = {fr(defi.lab.a)}</strong>, <strong>b* = {fr(defi.lab.b)}</strong>. Elle a été obtenue avec <strong>deux pigments</strong> parmi le jaune, le magenta et le cyan, éventuellement avec du blanc. Réglez les concentrations pour que l’écart ΔE*ab soit inférieur à 4.</div>
        <Ligne><Pastille css={C.cssDeLab(defi.lab)} nom="cible" hauteur={34}/><Pastille css={patch(M.reflPeinture({ jaune: defi.dj, magenta: defi.dm, cyan: defi.dc, blanc: defi.dw }))} nom="mon mélange" hauteur={34}/></Ligne>
        {curs('sy-dj', `Pigment jaune : ${pct(defi.dj)}`, defi.dj, 0, 1, 0.01, ev => maj({ dj: parseFloat(ev.target.value) }), null, COL.orange)}
        {curs('sy-dm', `Pigment magenta : ${pct(defi.dm)}`, defi.dm, 0, 1, 0.01, ev => maj({ dm: parseFloat(ev.target.value) }), null, '#a21caf')}
        {curs('sy-dc', `Pigment cyan : ${pct(defi.dc)}`, defi.dc, 0, 1, 0.01, ev => maj({ dc: parseFloat(ev.target.value) }), null, '#0e7490')}
        {curs('sy-dw', `Pigment blanc : ${pct(defi.dw)}`, defi.dw, 0, 1, 0.01, ev => maj({ dw: parseFloat(ev.target.value) }), null, COL.gris)}
        <div style={{ marginTop: 8 }}><LigneMesure nom="Votre mélange : L* ; a* ; b*" valeur={`${fr(labD.L)} ; ${fr(labD.a)} ; ${fr(labD.b)}`}/><LigneMesure nom="Écart ΔE*ab à la cible" valeur={fr(ecartD)} couleur={ecartD <= 4 ? COL.vert : COL.rouge}/></div></>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'appariement'
        ? <>Commencez par x et y (la teinte), puis ajustez Y (la clarté) en gardant les proportions. Un point loin du blanc fait intervenir surtout une ou deux lampes.</>
        : <>Repérez d’abord le signe de a* et de b* : a* positif rapproche du magenta, b* positif du jaune, a* négatif du vert-cyan. Ajoutez du blanc pour augmenter L*.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'appariement' && <>Les réglages cachés étaient {pct(defi.r)} de rouge, {pct(defi.v)} de vert et {pct(defi.b)} de bleu.</>}
        {defi.kind === 'recette' && <>La recette cachée : {['jaune', 'magenta', 'cyan', 'blanc'].filter(k => defi.recette[k] > 0).map(k => `${k} ${pct(defi.recette[k])}`).join(', ')}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const setE = k => ev => setEx(e => ({ ...e, [k]: parseFloat(ev.target.value) }));
  const spE = M.spectreRVB(ex.r, ex.v, ex.b), repE = M.reponses(spE), cE = M.chroma(spE);
  const spCible = ex.cible ? M.spectreMono(ex.lamCible, M.JAUNE.Y) : null, repCible = spCible ? M.reponses(spCible) : null;
  const cEx = { jaune: ex.pj, magenta: ex.pm, cyan: ex.pc, blanc: ex.pb, noir: ex.pn };
  const REx = ex.modele === 'moy' ? M.reflMoyenne(cEx) : M.reflPeinture(cEx);
  const filtreEx = M.transmittance({ jaune: ex.pj, magenta: ex.pm, cyan: ex.pc });
  const labEx = lab(REx);
  const lumieres = ex.vol === 'lumieres';
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{lumieres ? 'Réglez les lampes' : ex.support === 'filtre' ? 'Réglez les filtres' : 'Réglez le mélange de pigments'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{lumieres
        ? 'Chaque curseur règle l’intensité d’une lampe. Le spectre de la lumière obtenue est la somme des trois spectres ; l’œil la résume en trois nombres L, M, S. Vous pouvez la comparer à une lumière monochromatique.'
        : ex.support === 'filtre' ? 'Chaque curseur règle la concentration d’un colorant dans un filtre placé devant une lampe blanche. Les absorbances s’additionnent : les transmittances se multiplient.'
        : 'Chaque curseur règle la concentration d’un pigment dans une couche de peinture. Les K/S s’additionnent ; le blanc ajoute de la diffusion ; le noir de l’absorption.'}</div>
      {lumieres ? <>
        {curs('sy-er', `Lampe rouge : ${pct(ex.r)}`, ex.r, 0, 1, 0.01, setE('r'), null, COL.rouge)}
        {curs('sy-ev', `Lampe verte : ${pct(ex.v)}`, ex.v, 0, 1, 0.01, setE('v'), null, COL.vert)}
        {curs('sy-eb', `Lampe bleue : ${pct(ex.b)}`, ex.b, 0, 1, 0.01, setE('b'), null, COL.bleu)}
        <Section titre={ex.cible ? `Lumière à comparer : ${n0(ex.lamCible)} nm` : 'Comparer à une lumière monochromatique'} ouvert={!!ouv.cible} onBascule={() => bascule('cible')}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: KIT.txt, minHeight: 42 }}><input type="checkbox" checked={!!ex.cible} onChange={ev => setEx(e => ({ ...e, cible: ev.target.checked ? 1 : 0 }))} style={{ width: 20, height: 20 }}/>Afficher une lumière monochromatique</label>
          {ex.cible ? curs('sy-el', `Longueur d’onde : ${n0(ex.lamCible)} nm`, ex.lamCible, 450, 650, 5, setE('lamCible'), 'Essayez de la reproduire avec les trois lampes.') : null}
        </Section></>
      : <>
        {selecteur('sy-sup', 'Support', ex.support, ev => setEx(e => ({ ...e, support: ev.target.value })), [{ id: 'peinture', nom: 'Couche de peinture (réflectance)' }, { id: 'filtre', nom: 'Filtre devant une lampe (transmittance)' }])}
        {curs('sy-pj', `Jaune : ${pct(ex.pj)}`, ex.pj, 0, 1, 0.01, setE('pj'), null, COL.orange)}
        {curs('sy-pm', `Magenta : ${pct(ex.pm)}`, ex.pm, 0, 1, 0.01, setE('pm'), null, '#a21caf')}
        {curs('sy-pc', `Cyan : ${pct(ex.pc)}`, ex.pc, 0, 1, 0.01, setE('pc'), null, '#0e7490')}
        {ex.support === 'peinture' && <>
          {curs('sy-pb', `Blanc : ${pct(ex.pb)}`, ex.pb, 0, 1, 0.01, setE('pb'), null, COL.gris)}
          {curs('sy-pn', `Noir : ${pct(ex.pn)}`, ex.pn, 0, 1, 0.01, setE('pn'), null, '#0f172a')}
          {selecteur('sy-mod', 'Calcul du mélange', ex.modele, ev => setEx(e => ({ ...e, modele: ev.target.value })), [{ id: 'ks', nom: 'Additivité de K/S (Kubelka-Munk)' }, { id: 'moy', nom: 'Moyenne des réflectances (modèle faux, pour comparer)' }])}</>}
        <button onClick={() => setEx(e => ({ ...e, pj: 0, pm: 0, pc: 0, pb: 0, pn: 0 }))} style={{ ...styleBouton(false), marginTop: 10 }}>Tout remettre à zéro</button></>}
    </div>);
  const voletExplore = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['lumieres', 'Lumières (additive)'], ['pigments', 'Filtres et peintures (soustractive)']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, vol: k }))} aria-pressed={ex.vol === k} style={stylePetitBouton(ex.vol === k, '#7c3aed')}>{l}</button>)}
      </div>
      {lumieres ? <>
        <SceneLampes r={ex.r} v={ex.v} b={ex.b}/>
        <Ligne><Pastille css={M.cssLumiere(spE)} nom="lumière obtenue" hauteur={28}/>{spCible && <Pastille css={M.cssLumiere(spCible)} nom={`monochromatique ${n0(ex.lamCible)} nm`} hauteur={28}/>}</Ligne>
        <SvgSpectre ymax={Math.max(24, spCible ? 32 : 0)} yTitre="intensité" label="Spectre de la lumière obtenue"
          courbes={[{ v: M.spectreRVB(ex.r, 0, 0), col: COL.rouge, w: 1.6, dash: '5 3' }, { v: M.spectreRVB(0, ex.v, 0), col: COL.vert, w: 1.6, dash: '5 3' }, { v: M.spectreRVB(0, 0, ex.b), col: COL.bleu, w: 1.6, dash: '5 3' }, ...(spCible ? [{ v: spCible, col: '#4c1d95', w: 2.4 }] : []), { v: spE, col: '#0f172a', w: 3, fill: '#94a3b8', fillOpacity: 0.3 }]}/>
        <div style={{ height: 8 }}/>
        <BarresCones a={repE} b={repCible ?? undefined} nomA="lumière obtenue" nomB={`${n0(ex.lamCible)} nm`} ymax={60}/></>
      : ex.support === 'filtre' ? <>
        <SceneFiltres filtres={[['jaune', ex.pj], ['magenta', ex.pm], ['cyan', ex.pc]].filter(([, c]) => c > 0.001).map(([n, c]) => ({ nom: `filtre ${n} (${pct(c)})`, T: M.transmittance({ [n]: c }), col: COUL_FILTRE[n] }))}/>
        <Ligne><Pastille css="#ffffff" nom="lampe blanche" hauteur={28}/><Pastille css={M.cssFiltre(filtreEx)} nom="après les filtres" hauteur={28}/></Ligne>
        <SvgSpectre graduations yTitre="transmittance" label="Transmittance des filtres" courbes={[{ v: M.transmittance({ jaune: ex.pj }), col: COUL_FILTRE.jaune, w: 1.6, dash: '5 3' }, { v: M.transmittance({ magenta: ex.pm }), col: COUL_FILTRE.magenta, w: 1.6, dash: '5 3' }, { v: M.transmittance({ cyan: ex.pc }), col: COUL_FILTRE.cyan, w: 1.6, dash: '5 3' }, { v: filtreEx, col: '#0f172a', w: 3, fill: '#94a3b8', fillOpacity: 0.3 }]}/></>
      : <>
        <SceneCoupe R={REx} css={patch(REx)} pig={{ jaune: ex.pj, magenta: ex.pm, cyan: ex.pc, blanc: ex.pb, noir: ex.pn }}/>
        <Ligne><Pastille css={patch(REx)} nom={ex.modele === 'moy' ? 'mélange (moyenne : modèle faux)' : 'mélange'} hauteur={28}/></Ligne>
        <SvgSpectre graduations yTitre="réflectance" label="Réflectance du mélange de pigments" courbes={[{ v: REx, col: '#0f172a', w: 3, fill: '#94a3b8', fillOpacity: 0.3 }]}/></>}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lumieres ? <>
        <LigneMesure nom="x ; y ; Y" valeur={`${fr(cE.x, 3)} ; ${fr(cE.y, 3)} ; ${fr(cE.Y, 0)}`}/>
        <LigneMesure nom="Longueur d’onde dominante" valeur={dominante(spE)}/>
        <LigneMesure nom="Réponses L ; M ; S" valeur={`${fr(repE.L, 1)} ; ${fr(repE.M, 1)} ; ${fr(repE.S, 1)}`}/>
        {repCible && <LigneMesure nom={`L ; M ; S, ${n0(ex.lamCible)} nm`} valeur={`${fr(repCible.L, 1)} ; ${fr(repCible.M, 1)} ; ${fr(repCible.S, 1)}`}/>}</>
      : ex.support === 'filtre' ? <>
        <LigneMesure nom="Transmittance à 450 ; 550 ; 650 nm" valeur={[450, 550, 650].map(l => fr(filtreEx[iL(l)], 2)).join(' ; ')}/>
        <LigneMesure nom="Luminance de la lumière transmise (Y, blanc = 100)" valeur={fr(C.xyz(filtreEx, 'D65').Y, 0)}/></>
      : <>
        <LigneMesure nom="L* ; a* ; b*" valeur={`${fr(labEx.L)} ; ${fr(labEx.a)} ; ${fr(labEx.b)}`}/>
        <LigneMesure nom="C* (saturation)" valeur={fr(chroma(labEx))}/>
        <LigneMesure nom="Réflectance à 450 ; 550 ; 650 nm" valeur={[450, 550, 650].map(l => fr(REx[iL(l)], 2)).join(' ; ')}/></>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Lumières : allumez les lampes deux à deux. Quelles couleurs obtient-on ? Que devient le spectre ?</li>
      <li>Affichez la lumière monochromatique de 580 nm et reproduisez-la avec le rouge et le vert. Y arrive-t-on avec 500 nm ? avec 460 nm ? Pourquoi ?</li>
      <li>Cherchez deux réglages différents qui donnent la même couleur : leurs spectres sont-ils identiques ?</li>
      <li>Filtres : mettez du jaune puis du magenta. Quelle couleur transmise ? Comparez avec la peinture jaune + magenta.</li>
      <li>Peintures : mélangez jaune, magenta et cyan à parts égales : que devient la couleur ? Remplacez par la moyenne des réflectances : que change-t-on ?</li>
      <li>Ajoutez du blanc, puis du noir, à un mélange : comment varient L* et C* ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Additive : les spectres s’ajoutent ; l’œil ne garde que trois nombres (L, M, S)</li>
        <li>Primaires additives : rouge, vert, bleu ; complémentaires : somme = blanc</li>
        <li>Soustractive : on retire de la lumière ; T = T₁ × T₂ ; K/S s’additionne</li>
        <li>Primaires soustractives : cyan, magenta, jaune ; tout ensemble : presque noir</li>
        <li>Blanc : diffuse, éclaircit et désature ; noir : absorbe</li>
        <li>Même couleur ne veut pas dire même spectre</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Lampes</strong> : trois LED à bande large, de spectre gaussien (rouge 625 nm, verte 545 nm, bleue 460 nm), étalonnées pour que les trois lampes à fond donnent le blanc D65. Valeurs illustratives, pas des lampes du commerce. Les coordonnées x, y, Y viennent de l’observateur standard CIE 1931 (2°).</li>
      <li><strong>Cônes</strong> : les trois courbes L, M, S sont obtenues à partir des fonctions colorimétriques CIE par la transformation de Hunt-Pointer-Estevez ; c’est une approximation des vraies sensibilités des cônes. La réponse d’un type de cône est la somme, sur les longueurs d’onde, du spectre pondéré par sa sensibilité (unités arbitraires). On suppose la perception décrite par ces trois nombres seulement (théorie trichromatique de Young) ; les phénomènes d’adaptation, de contraste et de constance des couleurs ne sont pas modélisés.</li>
      <li><strong>Appariement</strong> : trois lampes réelles ne reproduisent que les couleurs de leur triangle dans le diagramme de chromaticité (voir la simulation sur le diagramme) : une lumière monochromatique saturée comme 500 nm ou 460 nm demanderait une lampe « négative ».</li>
      <li><strong>Daltonisme</strong> : modèle simplifié d’un œil sans réponse M ; dans la deutéranopie réelle, les cônes M contiennent le pigment des cônes L. Deux lumières sont confondues quand les deux nombres restants (L, S) sont égaux ; les différences de luminosité perçue ne sont pas modélisées.</li>
      <li><strong>Filtres</strong> : absorbance additive (loi de Beer-Lambert, A = Σ cᵢ·aᵢ(λ)), transmittance T = 10<sup>−A</sup> ; réflexions sur les faces des filtres négligées ; lampe D65.</li>
      <li><strong>Peintures</strong> : couche opaque (théorie de Kubelka-Munk) : R = 1 + K/S − √((K/S)² + 2K/S). On suppose que le pouvoir diffusant S ne dépend pas de la longueur d’onde et que K est proportionnel à la concentration de chaque pigment ; le blanc ajoute seulement de la diffusion (S = 1 + 8 × concentration de blanc), le noir de l’absorption. Les réflexions spéculaires de surface sont négligées. Les courbes des pigments sont illustratives (pigments imaginaires), pas des mesures.</li>
      <li><strong>Couleurs affichées</strong> : un écran ne reproduit pas toutes les couleurs, et sa teinte réelle dépend de son réglage. Les valeurs chiffrées (x, y, L*, a*, b*) font foi, pas la couleur de la pastille.</li>
      <li><strong>Hors modèle</strong> : fluorescence, diffusion dans les filtres, effets d’éclairage et métamérisme des objets (voir la simulation « Éclairage et métamérisme »), pigments à effet.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sy-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sy-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sy-col { display: flex; flex-direction: column; gap: 12px; }
        .sy-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .sy-l1.cote .sy-carte { order: 2; } .sy-l1.cote .sy-main { order: 1; }
          .sy-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .sy-ex > * { grid-column: 1; }
          .sy-ex > .sy-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .sy-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sy-in { animation: sy-fondu 0.35s ease-out; } @keyframes sy-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .sy-l1 *, .sy-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Synthèse additive et synthèse soustractive</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On <strong>ajoute des lumières</strong> (écrans, projecteurs : synthèse <strong>additive</strong>) ou on <strong>retire de la lumière</strong> avec des filtres, des pigments, des encres (synthèse <strong>soustractive</strong>). On voit ce qui s’additionne dans chaque cas, pourquoi l’œil confond des lumières de spectres différents, et comment prévoir la teinte d’un mélange.</div>
      {enGuide && <div className="sy-l1 cote">
        <div className="sy-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="sy-main">
          <div className="sy-col">
            {sceneBloc && <div className="sy-in">{sceneBloc}</div>}
            {curseurGuide && <div className="sy-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="sy-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'appariement' ? suiviA : suiviR}/></div>}
      {enExplore && <>
        <div className="sy-ex">
          {voletExplore}
          <div className="sy-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
