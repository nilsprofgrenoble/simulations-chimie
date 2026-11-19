import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, Vec, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./geometrieModele";
import { QCM } from "./geometrieQcm";
import { Vue3D, Lewis, Cram, ChiBarres, EchelleDeltaChi, SceneDoublets, COL } from "./geometrieScenes";
import { SvgDoublets, SvgFormes, SvgCram, SvgLiaison, SvgPolaire } from "./geometrieSchemas";

const SIM_ID = 155, CLE_GUIDE = 'geometrie-polarite-1g-guide-v1';
declarerDefis(SIM_ID, [['geometrie', 'Quelle est la géométrie de cette entité ?'], ['polarite', 'Cette molécule est-elle polaire ?']]);

// ====================================================
//  SIM 155 — GÉOMÉTRIE, ÉLECTRONÉGATIVITÉ ET POLARITÉ D'UNE ENTITÉ (1G spé PC, thème « Constitution et transformations de la matière »,
//  partie « Structure des entités », chapitre « De la structure à la polarité d'une entité »).
//  Part d'un schéma de Lewis fourni (affiché) : (1) géométrie par la méthode VSEPR (AXₙEₘ, un seul atome central), représentation de Cram ;
//  (2) électronégativité, polarisation d'une liaison (Δχ, seuils CONVENTIONNELS du cours) ; (3) polarité d'une molécule par les barycentres G⁺ et G⁻.
//  Le modèle est dans geometrieModele.js (testé). Les entités « au-delà du programme » ne servent qu'en exploration et en défi.
//  Capacités visées (jamais affichées à l'élève) : interpréter la géométrie d'une entité à partir de son schéma de Lewis ; utiliser des modèles
//  moléculaires pour visualiser la géométrie ; déterminer le caractère polaire d'une liaison à partir des électronégativités ; déterminer le
//  caractère polaire ou apolaire d'une entité à partir de sa géométrie et de la polarité de ses liaisons.
// ====================================================

const NB = ' ';
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const tire = t => t[Math.floor(Math.random() * t.length)];
const lienTxt = l => `${l.a}${l.o === 2 ? '=' : l.o === 3 ? '≡' : '–'}${l.b}`;
const FD = <Formule><mi>Δχ</mi><mo>=</mo><mo>|</mo><mi>χ</mi><mo>(</mo><mi>A</mi><mo>)</mo><mo>−</mo><mi>χ</mi><mo>(</mo><mi>B</mi><mo>)</mo><mo>|</mo></Formule>;
const E = M.entite;
const NOTATIONS = ['AX₂E₀', 'AX₂E₂', 'AX₃E₀', 'AX₃E₁', 'AX₄E₀'];
const VUE_EX = { NH3: { ry: 25, rx: 25 }, 'H3O+': { ry: 40, rx: 25 }, 'NH4+': { ry: 0, rx: 10 }, CH4: { ry: 0, rx: 10 }, CH3Cl: { ry: 0, rx: 10 } };   // vues de départ sans recouvrement d’atomes
const DEFI_GEO = ['H2O', 'NH3', 'CH4', 'CO2', 'H3O+', 'NH4+', 'CH2O', 'CCl4', 'HCN', 'CH3Cl'];
const DEFI_POL = ['HCl', 'H2O', 'CO2', 'NH3', 'CH4', 'O2', 'N2', 'CCl4', 'CH2O', 'HCN', 'CH3Cl'];

const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);

// ---------- courbe : distance G⁺G⁻ en fonction de l'angle d'une molécule AX₂ fictive ----------
function CourbeAngle({ paire, angle }) {
  const P = id => M.polarite(M.moleculeAX2(paire, id));
  const polarisee = P(120).nPolarisees > 0;
  const W = 320, H = 172, x0 = 44, x1 = 300, y0 = 132, y1 = 28, dmax = paire.d * Math.cos(30 * Math.PI / 180);
  const X = a => x0 + (x1 - x0) * (a - 60) / 120, Y = d => y0 - (y0 - y1) * d / dmax;
  const pts = []; for (let a = 60; a <= 180; a += 5) pts.push(`${X(a)},${Y(P(a).norme)}`);
  const d = P(angle).norme;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Distance entre G⁺ et G⁻ en fonction de l’angle X–A–X : elle diminue quand l’angle augmente et s’annule à 180 degrés. Angle choisi : ${angle} degrés.`} width="100%" style={{ display: 'block', maxWidth: 400, margin: '0 auto', background: '#fff', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <text x="10" y="18" fontSize="14" fontWeight="700" fill={KIT.txt}>Distance G⁺G⁻ selon l’angle X–A–X</text>
      <line x1={x0} y1={y0} x2={x1 + 6} y2={y0} stroke="#475569" strokeWidth="1.5"/><line x1={x0} y1={y0} x2={x0} y2={y1 - 4} stroke="#475569" strokeWidth="1.5"/>
      {[60, 90, 120, 150, 180].map(a => <g key={a}><line x1={X(a)} y1={y0} x2={X(a)} y2={y0 + 5} stroke="#475569"/><text x={X(a)} y={y0 + 20} textAnchor="middle" fontSize="13" fill={KIT.txt}>{a}°</text></g>)}
      <text x={x0 - 6} y={y1 + 4} textAnchor="end" fontSize="13" fill={KIT.txt}>{nbf(dmax, 2)}</text><text x={x0 - 6} y={y0 + 4} textAnchor="end" fontSize="13" fill={KIT.txt}>0</text>
      <text x="8" y={(y0 + y1) / 2 + 4} fontSize="13" fill={KIT.txt2} transform={`rotate(-90 12 ${(y0 + y1) / 2})`} textAnchor="middle">distance (Å)</text>
      {polarisee ? <>
        <polyline points={pts.join(' ')} fill="none" stroke={COL.orange} strokeWidth="3"/>
        <line x1={X(paire.reel)} y1={y0} x2={X(paire.reel)} y2={y1 + 2} stroke={COL.vert} strokeWidth="1.8" strokeDasharray="4 3"/>
        <text x={X(paire.reel) + (paire.reel > 150 ? -6 : 6)} y={y1 + 12} textAnchor={paire.reel > 150 ? 'end' : 'start'} fontSize="13" fontWeight="700" fill={COL.vert}>angle réel</text>
        <circle cx={X(angle)} cy={Y(d)} r="6.5" fill="#fff" stroke={COL.noir} strokeWidth="2.6"/>
      </> : <text x={(x0 + x1) / 2} y="78" textAnchor="middle" fontSize="14" fontWeight="700" fill={KIT.txt}>Aucune liaison polarisée : pas de G⁺ ni de G⁻</text>}
    </svg>);
}

// ====================================================
export function SimulationGeometriePolarite() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviG, noterG] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('geometrie');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ti, setTi] = useState({ nD: 4, cacheNL: false });
  const [ex, setEx] = useState({ objet: 'entite', ent: 'H2O', nl: true, charges: true, G: true, paire: 'OH', angle: 105, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['d2', 'd34', 'axe', 'eau', 'nh3', 'co2', 'cram', 'chi', 'dchi', 'liaison', 'pco2', 'ph2o', 'pnh3'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);

  const ETAPES = [
    { id: 'd2', titre: 'Des doublets qui se repoussent', focus: ['scene'],
      texte: <>Autour d’un atome central A, les électrons de valence sont groupés en <strong>doublets</strong> (liants ou non liants). Chaque doublet est chargé négativement : deux doublets se repoussent, comme deux aimants présentés par le même pôle. C’est le principe du modèle <strong>VSEPR</strong> (répulsion des doublets de la couche de valence). Ici, deux doublets sont placés au hasard autour de A : prévoyez l’angle qu’ils formeront une fois la répulsion terminée.</>,
      tache: { type: 'qcm', ...QCM.d2 } },
    { id: 'd34', titre: 'Trois, puis quatre doublets', focus: ['scene'],
      texte: <>Choisissez 2, 3 ou 4 doublets avec les boutons du cadre du modèle. Les doublets restent dans l’espace à trois dimensions : faites tourner le modèle pour le voir sous tous ses côtés.</>,
      tache: { type: 'qcm', ...QCM.d4 } },
    { id: 'axe', titre: 'Lire un schéma de Lewis : la notation AXₙEₘ', focus: ['scene'],
      retenirTitre: 'À RETENIR : LES DOUBLETS SE REPOUSSENT',
      retenir: <>
        <SvgDoublets/>
        <ul style={liste}>
          <li><strong>Les doublets d’un atome central A se repoussent</strong> : ils s’écartent au maximum, en trois dimensions (modèle VSEPR).</li>
          <li><strong>Moyen de s’en souvenir</strong> : 2 doublets → 180° ; 3 → 120° ; 4 → 109,5°. Plus il y a de doublets, plus l’angle se resserre.</li>
          <li><strong>Idée fausse</strong> : « le méthane est plat comme son schéma de Lewis ». <strong>Vrai</strong> : le schéma de Lewis est à plat, la molécule est dans l’espace.</li>
        </ul></>,
      texte: <>Pour appliquer le modèle, on part du <strong>schéma de Lewis</strong> de la molécule (donné ici). On note <strong>A</strong> l’atome central, <strong>X</strong> les <em>n</em> atomes liés à A et <strong>E</strong> les <em>m</em> doublets non liants de A : la molécule est de type <strong>AXₙEₘ</strong>. Attention : le schéma de Lewis est dessiné à plat, avec des angles de 90° ou de 180° choisis pour la lisibilité : il ne montre pas la forme réelle de la molécule.</>,
      tache: { type: 'qcm', ...QCM.axe } },
    { id: 'eau', titre: 'De l’arrangement des doublets à la forme', focus: ['scene'],
      texte: <>Les <em>n</em> + <em>m</em> doublets de l’atome central s’écartent au maximum. Pour l’eau, voici les 4 doublets qui entourent l’atome O. Mais la <strong>forme d’une molécule</strong> est celle que dessinent ses <strong>atomes</strong> : les atomes H apparaîtront après votre réponse.</>,
      tache: { type: 'qcm', ...QCM.eau } },
    { id: 'nh3', titre: 'Un doublet non liant sur l’atome central', focus: ['scene'],
      texte: <>Voici le schéma de Lewis de l’ammoniac NH₃ (atome central N). Déterminez le type AXₙEₘ puis la forme de la molécule.</>,
      tache: { type: 'qcm', ...QCM.nh3 } },
    { id: 'co2', titre: 'Et avec des liaisons doubles ?', focus: ['scene'],
      texte: <>Voici le schéma de Lewis du dioxyde de carbone CO₂ (atome central C). Règle du modèle : une liaison double ou triple ne définit qu’<strong>une seule direction</strong> autour de A, elle compte donc pour <strong>un seul</strong> X.</>,
      tache: { type: 'qcm', ...QCM.co2 } },
    { id: 'cram', titre: 'Dessiner une molécule en 3D sur une feuille', focus: ['scene'],
      retenirTitre: 'À RETENIR : DE AXₙEₘ À LA FORME',
      retenir: <>
        <SvgFormes/>
        <ul style={liste}>
          <li><strong>On compte tous les doublets, on nomme la forme avec les atomes.</strong> <em>n</em> + <em>m</em> donne l’arrangement des doublets (2, 3 ou 4) ; les atomes X donnent la forme de la molécule.</li>
          <li>Exemples de la simulation : H₂O est AX₂E₂, <strong>coudée</strong> (≈ 105°) ; NH₃ est AX₃E₁, <strong>pyramidale</strong> (≈ 107°) ; CO₂ est AX₂E₀, <strong>linéaire</strong> (180°).</li>
          <li><strong>Piège</strong> : une liaison double ou triple ne compte que pour un X. <strong>Idée fausse</strong> : « H₂O est linéaire parce qu’on écrit H–O–H ».</li>
        </ul></>,
      texte: <>Pour représenter une molécule en 3D sur une feuille, on utilise la <strong>représentation de Cram</strong> : un trait plein est dans le plan de la feuille, un triangle plein pointe <strong>vers l’avant</strong> (vers vous). Voici le méthane CH₄ ainsi représenté ; son modèle 3D apparaîtra après votre réponse.</>,
      tache: { type: 'qcm', ...QCM.cram } },
    { id: 'chi', titre: 'Quel atome attire le plus les électrons ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA REPRÉSENTATION DE CRAM',
      retenir: <>
        <SvgCram/>
        <ul style={liste}>
          <li><strong>Trait plein</strong> : dans le plan de la feuille. <strong>Triangle plein</strong> : vers l’avant. <strong>Pointillés</strong> : vers l’arrière.</li>
          <li>Exemple de la simulation : CH₄ a 2 liaisons dans le plan, 1 devant, 1 derrière.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « plein = devant, pointillés = caché derrière ». <strong>Idée fausse</strong> : les pointillés ne signalent pas une liaison plus faible.</li>
        </ul></>,
      texte: <>Dans une liaison covalente, deux atomes partagent un doublet, mais pas toujours à égalité. L’<strong>électronégativité</strong> χ mesure la tendance d’un atome à attirer vers lui les électrons d’une liaison. Les valeurs ci-dessous sont celles du cours (échelle de Pauling arrondie à 0,1 près) ; d’autres tables donnent des valeurs un peu différentes.</>,
      tache: { type: 'qcm', ...QCM.chi } },
    { id: 'dchi', titre: 'Comparer deux électronégativités', focus: ['scene'],
      texte: <>On compare les deux atomes d’une liaison par l’écart d’électronégativité (toujours positif).{FD}Dans ce cours, on retient une <strong>convention</strong> (pas une loi de la nature) : Δχ ≤ 0,4 : liaison non polarisée ; 0,4 &lt; Δχ &lt; 1,7 : liaison polarisée ; Δχ &gt; 1,7 : liaison ionique. Le programme demande seulement de comparer les électronégativités : ces seuils sont un choix de ce cours. On donne χ(O) = 3,5 et χ(H) = 2,2.</>,
      tache: { type: 'num', q: 'Calculez Δχ pour la liaison O–H.', carnet: 'Δχ de la liaison O–H', unite: '', vrai: 1.3, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Δχ = |χ(O) − χ(H)| (valeur absolue : un écart est toujours positif).', 'Δχ = 3,5 − 2,2 = 1,3.'],
        pieges: [[5.7, 'Il faut soustraire les deux électronégativités (un écart), pas les additionner.'], [-1.3, 'Δχ est une valeur absolue : le résultat est positif.'], [0.8, 'Vous avez utilisé χ(N) ou χ(Cl) : pour O–H, χ(O) = 3,5.']],
        expl: 'Δχ(O–H) = 3,5 − 2,2 = 1,3 : supérieur à 0,4 et inférieur à 1,7, donc la liaison O–H est polarisée.', indice: 'Δχ = |χ(O) − χ(H)| : soustrayez la plus petite valeur à la plus grande.' } },
    { id: 'liaison', titre: 'Liaison polarisée ou non ?', focus: ['scene'],
      texte: <>Dans une liaison polarisée, le doublet est en moyenne plus proche de l’atome le plus électronégatif, qui porte une charge partielle négative −δ ; l’autre atome porte +δ. On a trouvé Δχ(O–H) = 1,3 à l’étape précédente. Autres valeurs : χ(C) = 2,5 ; χ(N) = 3,0 ; χ(Cl) = 3,0.</>,
      tache: { type: 'qcm', ...QCM.liaison } },
    { id: 'pco2', titre: 'Des liaisons polarisées, une molécule polaire ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : ÉLECTRONÉGATIVITÉ ET LIAISON POLARISÉE',
      retenir: <>
        <SvgLiaison/>
        <ul style={liste}>
          <li><strong>L’atome le plus électronégatif attire le doublet</strong> : il porte la charge partielle −δ, l’autre +δ.</li>
          <li><strong>Convention du cours</strong> (pas une loi) : Δχ ≤ 0,4 non polarisée ; 0,4 &lt; Δχ &lt; 1,7 polarisée ; Δχ &gt; 1,7 ionique.</li>
          <li>H–Cl (Δχ = 0,8) et O–H (Δχ = 1,3) sont polarisées ; Na–Cl (Δχ = 2,1 avec χ(Na) = 0,9, exemple du cours) est ionique. <strong>Idée fausse</strong> : « deux atomes différents donnent toujours une liaison polarisée ».</li>
        </ul></>,
      texte: <>Une molécule peut avoir des liaisons polarisées. Pour savoir si elle est polaire, on repère le <strong>barycentre G⁺</strong> des charges partielles positives et le <strong>barycentre G⁻</strong> des charges partielles négatives : s’ils sont <strong>confondus</strong>, la molécule est apolaire ; s’ils sont <strong>distincts</strong>, elle est polaire. Le dioxyde de carbone est linéaire (O–C–O à 180°) ; χ(C) = 2,5 et χ(O) = 3,5 donnent Δχ = 1,0 : les deux liaisons C=O sont polarisées, comme le montrent les charges partielles dessinées. Quand G⁺ et G⁻ sont distincts, on dessine le moment dipolaire <Vec n="p"/>, un vecteur orienté <strong>de G⁻ vers G⁺</strong>.</>,
      tache: { type: 'qcm', ...QCM.co2p } },
    { id: 'ph2o', titre: 'Et la molécule d’eau ?', focus: ['scene'],
      texte: <>L’eau est coudée (angle H–O–H d’environ 105°) et Δχ(O–H) = 1,3 : les deux liaisons O–H sont polarisées. Le schéma de gauche montre l’eau, celui de droite rappelle le dioxyde de carbone avec ses points G⁺ et G⁻.</>,
      tache: { type: 'qcm', ...QCM.h2o } },
    { id: 'pnh3', titre: 'Appliquer toute la méthode', focus: ['scene'],
      retenirTitre: 'À RETENIR : MOLÉCULE POLAIRE OU APOLAIRE',
      retenir: <>
        <SvgPolaire/>
        <ul style={liste}>
          <li><strong>Polaire</strong> : G⁺ et G⁻ distincts ; le moment dipolaire vec(p) va de G⁻ vers G⁺. <strong>Apolaire</strong> : G⁺ et G⁻ confondus, ou aucune liaison polarisée.</li>
          <li><strong>Idée fausse</strong> : « liaisons polarisées ⇒ molécule polaire ». <strong>Vrai</strong> : il faut la géométrie ET les liaisons (CO₂ apolaire, H₂O polaire).</li>
        </ul></>,
      texte: <>Méthode : (1) schéma de Lewis, type AXₙEₘ, forme ; (2) Δχ de chaque liaison ; (3) G⁺ et G⁻ sont-ils confondus ? L’ammoniac NH₃ est pyramidal (AX₃E₁) ; χ(N) = 3,0 et χ(H) = 2,2, donc Δχ(N–H) = 0,8 : les trois liaisons N–H sont polarisées.</>,
      tache: { type: 'qcm', ...QCM.nh3p } },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    const liste = type === 'geometrie' ? DEFI_GEO : DEFI_POL;
    setDefi(d => { let e; do { e = tire(liste); } while (d && d.type === type && d.ent === e && liste.length > 1); return { type, ent: e, reps: {}, verifie: false, ok: false }; });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const setRep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const verifier = () => {
    const e = E(defi.ent), P = M.polarite(e);
    const ok = defi.type === 'geometrie'
      ? defi.reps.axe === M.notationAXE(e) && defi.reps.forme === e.forme
      : defi.reps.forme === e.forme && defi.reps.liaisons === (P.nPolarisees ? 'oui' : 'aucune') && defi.reps.pol === (P.polaire ? 'polaire' : 'apolaire');
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'geometrie' ? noterG : noterP)(ok);
  };
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const choix = (cle, label, options) => etiquette(label,
    <select value={defi.reps[cle] ?? ''} onChange={x => setRep(cle, x.target.value)} style={sel}>
      <option value="">— choisir —</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>);
  const chiTxt = e => [...new Set(e.atomes.map(a => a.s))].map(s => `χ(${s}) = ${nbf(M.CHI[s], 1)}`).join(' ; ');
  const voletDefi = defi && (() => {
    const e = E(defi.ent), P = M.polarite(e), complet = defi.type === 'geometrie' ? defi.reps.axe && defi.reps.forme : defi.reps.forme && defi.reps.liaisons && defi.reps.pol;
    return (
      <div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['geometrie', 'Géométrie'], ['polarite', 'Polaire ou apolaire ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'geometrie' ? 'Défi : quelle est la géométrie de cette entité ?' : 'Défi : cette molécule est-elle polaire ?'}</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
          {defi.type === 'geometrie'
            ? <>Voici le schéma de Lewis de {e.charge ? 'l’ion' : 'la molécule'} <strong>{e.nom} {e.f}</strong>{e.centre != null ? <> (atome central {e.atomes[e.centre].s})</> : null}. Donnez son type AXₙEₘ et sa forme.</>
            : <>Voici le schéma de Lewis de la molécule <strong>{e.nom} {e.f}</strong>. Électronégativités : {chiTxt(e)}. Donnez sa forme, dites si elle a des liaisons polarisées (convention : Δχ &gt; 0,4) puis si elle est polaire.</>}
          {!e.programme && <div style={{ marginTop: 4, fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '3px 8px' }}>Entité au-delà du programme : le raisonnement est exactement le même.</div>}
        </div>
        {defi.type === 'geometrie' ? <>
          {choix('axe', 'Type AXₙEₘ de l’atome central', NOTATIONS.map(x => [x, x]))}
          {choix('forme', 'Forme de l’entité (les atomes seulement)', M.FORMES.map(x => [x, x]))}
          <IndiceDefi cache={false}>n = nombre d’atomes liés à l’atome central (une liaison double ou triple compte pour un seul), m = nombre de doublets non liants de cet atome. Avec n + m, trouvez l’arrangement des doublets, puis ne gardez que les atomes pour nommer la forme.</IndiceDefi>
        </> : <>
          {choix('forme', 'Forme de la molécule', M.FORMES.map(x => [x, x]))}
          {choix('liaisons', 'Liaisons polarisées ?', [['aucune', 'aucune liaison polarisée'], ['oui', 'au moins une liaison polarisée']])}
          {choix('pol', 'La molécule est…', [['polaire', 'polaire'], ['apolaire', 'apolaire']])}
          <IndiceDefi cache={false}>Calculez Δχ pour chaque liaison (valeurs données). S’il n’y a aucune liaison polarisée, la molécule est apolaire. Sinon, placez les charges partielles sur la forme de la molécule et cherchez si G⁺ et G⁻ sont confondus.</IndiceDefi>
        </>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          <button onClick={verifier} disabled={!complet} style={{ ...styleBouton(true, '#15803d'), opacity: complet ? 1 : 0.5 }}>Vérifier</button>
          <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
          {defi.ok
            ? (defi.type === 'geometrie'
              ? `✓ Correct. ${e.centre != null ? `${M.notationAXE(e)} : n + m = ${e.n + e.m} doublets, arrangement ${M.arrangement(e.n + e.m)} ; ` : ''}forme ${e.forme}${M.angleXAX(e) !== 180 ? ` (angle ≈ ${nbf(M.angleXAX(e), 1)}°)` : ' (angle de 180°)'}.`
              : `✓ Correct. ${P.nPolarisees ? `${P.nPolarisees} liaison${P.nPolarisees > 1 ? 's' : ''} polarisée${P.nPolarisees > 1 ? 's' : ''}, forme ${e.forme} : ${P.raison}` : 'Aucune liaison polarisée'} : la molécule est ${P.polaire ? 'polaire' : 'apolaire'}.`)
            : defi.type === 'geometrie' ? '✗ Pas encore. Comptez n (atomes liés à l’atome central) et m (ses doublets non liants), puis nommez la forme avec les atomes seulement.'
              : '✗ Pas encore. Calculez Δχ de chaque liaison, déterminez la forme, puis cherchez si G⁺ et G⁻ sont confondus.'}
        </div>}
      </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>VSEPR est un modèle</strong>, pas la réalité : on traite les doublets comme des zones chargées négativement qui se repoussent. Il est ici limité aux entités à <strong>un seul atome central</strong> (n + m = 2, 3 ou 4).</li>
      <li><strong>Angles</strong> : en première approximation, liants et non liants ne sont pas distingués (109,5° pour 4 doublets). Les angles affichés sont des valeurs expérimentales arrondies : H₂O 104,5° ; NH₃ 107° ; H₃O⁺ environ 110°. Dans H₂O et NH₃, les doublets non liants repoussent un peu plus fort que les liants : les angles sont un peu plus petits que 109,5°.</li>
      <li><strong>Schéma de Lewis</strong> : dessiné à plat, avec des angles de 90° ou 180° choisis pour la lisibilité ; il ne renseigne pas sur la forme.</li>
      <li><strong>Électronégativité</strong> : valeurs du tableau du cours (échelle de Pauling arrondie à 0,1 près : H 2,2 ; C 2,5 ; N 3,0 ; O 3,5 ; Cl 3,0). D’autres tables donnent O 3,44 ou Cl 3,16 : les conclusions de cette simulation (liaison polarisée ou non) restent les mêmes.</li>
      <li><strong>Seuils 0,4 et 1,7 : conventions de ce cours, pas des lois.</strong> La réalité est un passage continu de la liaison covalente à la liaison ionique ; la liaison C–H est par exemple très faiblement polarisée, mais classée « non polarisée » par convention. Le programme demande seulement de comparer les électronégativités.</li>
      <li><strong>Charges partielles</strong> : on attribue la même charge ±δ à chaque liaison polarisée (modèle qualitatif) ; en réalité δ dépend de Δχ et de la molécule.</li>
      <li><strong>G⁺ et G⁻</strong> : barycentres de charges partielles égales. La polarité réelle se mesure par le moment dipolaire (en debye), grandeur hors programme ; le vecteur <Vec n="p"/> dessiné va de G⁻ vers G⁺.</li>
      <li><strong>Polarité</strong> : définie ici pour une <strong>molécule neutre isolée</strong> ; pour un ion, on s’arrête à la géométrie et aux liaisons. Les entités « au-delà du programme » (CCl₄, CH₃Cl, CH₂O, HCN) servent seulement en exploration et en défi.</li>
      <li><strong>Molécule fictive AX₂</strong> (exploration) : expérience de pensée où l’on plie une molécule pour voir l’effet de l’angle ; seules les valeurs « angle réel » correspondent à de vraies molécules.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const eau = E('H2O');
  const eauDoublets = { atomes: [eau.atomes[eau.centre]], liaisons: [], centre: 0, nonLiants: [] };
  const eauLobes = [...eau.liaisons.map(([i, j]) => { const q = eau.atomes[j === eau.centre ? i : j].p, n = Math.hypot(...q); return { d: q.map(x => x / n) }; }), ...eau.nonLiants.map(d => ({ d }))];
  const nh3 = E('NH3'), co2 = E('CO2'), ch4 = E('CH4');
  const sceneGuide = (() => {
    switch (idE) {
      case 'd2': return boite('Deux doublets autour de l’atome A', <SceneDoublets key="n2" n={2}/>, cadre('scene'));
      case 'd34': return boite('Des doublets autour de l’atome A',
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }} role="group" aria-label="Nombre de doublets">
            <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Nombre de doublets :</span>
            {[2, 3, 4].map(n => <button key={n} aria-pressed={ti.nD === n} onClick={() => setT({ nD: n })} style={{ ...stylePetitBouton(ti.nD === n, '#6d28d9'), minHeight: 42, minWidth: 48, fontSize: 15 }}>{n}</button>)}
          </div>
          <SceneDoublets key={`n${ti.nD}`} n={ti.nD}/>
        </>, cadre('scene'));
      case 'axe': return boite('Schéma de Lewis de l’eau H₂O', <><Lewis ent={eau} maxWidth={300}/><div style={{ marginTop: 6 }}>{aide('Les traits entre atomes sont les doublets liants ; les traits placés sur un atome sont ses doublets non liants.')}</div></>, cadre('scene'));
      case 'eau': return boite('Les 4 doublets de l’atome O',
        <>
          {fait('eau')
            ? <Vue3D ent={eau} showNL={!ti.cacheNL} aria="Modèle 3D de la molécule d’eau : l’atome d’oxygène au centre, deux atomes d’hydrogène et deux doublets non liants en violet, disposés vers les sommets d’un tétraèdre." h={235} vue0={{ ry: -28, rx: 12 }}/>
            : <Vue3D ent={eauDoublets} lobes={eauLobes} aria="Atome d’oxygène au centre entouré de quatre doublets d’électrons dirigés vers les sommets d’un tétraèdre." h={235} vue0={{ ry: -28, rx: 12 }}/>}
          {fait('eau') && <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: 14, fontWeight: 700, color: KIT.txt2, minHeight: 36 }}>
            <input type="checkbox" checked={ti.cacheNL} onChange={x => setT({ cacheNL: x.target.checked })}/>Cacher les doublets non liants (ne voir que les atomes)</label>}
        </>, cadre('scene'));
      case 'nh3': return boite('Schéma de Lewis de l’ammoniac NH₃',
        <><Lewis ent={nh3} maxWidth={300}/>
          {fait('nh3') && <div style={{ marginTop: 10 }}><Vue3D ent={nh3} showNL aria="Modèle 3D de l’ammoniac : l’azote au sommet d’une pyramide dont la base est formée par les trois atomes d’hydrogène, doublet non liant en violet." h={225} vue0={{ ry: 25, rx: 25 }}/></div>}</>, cadre('scene'));
      case 'co2': return boite('Schéma de Lewis du dioxyde de carbone CO₂',
        <><Lewis ent={co2} maxWidth={300}/>
          {fait('co2') && <div style={{ marginTop: 10 }}><Vue3D ent={co2} aria="Modèle 3D du dioxyde de carbone : trois atomes alignés O, C, O." h={170} vue0={{ ry: -28, rx: 12 }}/></div>}</>, cadre('scene'));
      case 'cram': return fait('cram') ? (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {boite('Le méthane CH₄ en 3D', <Vue3D ent={ch4} aria="Modèle 3D du méthane : un atome de carbone au centre et quatre atomes d’hydrogène aux sommets d’un tétraèdre." h={225} vue0={{ ry: -30, rx: 14 }}/>, cadre('scene'))}
          {boite('Sa représentation de Cram', <Cram ent={ch4} maxWidth={300} legende/>, cadre('scene'))}
        </div>) : boite('Représentation de Cram du méthane CH₄', <Cram ent={ch4} maxWidth={300} legende={false}/>, cadre('scene'));
      case 'chi': return boite('Électronégativités', <ChiBarres surligne={['H', 'Cl']}/>, cadre('scene'));
      case 'dchi': return boite('Électronégativités et seuils du cours',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><ChiBarres surligne={['O', 'H']}/><EchelleDeltaChi/></div>, cadre('scene'));
      case 'liaison': return boite('Électronégativités et seuils du cours',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><ChiBarres/>
          <EchelleDeltaChi marques={fait('liaison') ? [{ d: 0.3, etiq: 'C–H' }, { d: 0.8, etiq: 'N–H' }, { d: 0.8, etiq: 'H–Cl' }, { d: 1.3, etiq: 'O–H' }] : []}/></div>, cadre('scene'));
      case 'pco2': return boite('Le dioxyde de carbone : charges partielles',
        <><Vue3D ent={co2} charges G={fait('pco2')} aria="Modèle 3D de CO₂ avec les charges partielles : moins delta sur chaque oxygène, plus deux delta sur le carbone." h={190} vue0={{ ry: -25, rx: 12 }}/>
          {fait('pco2') && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt }}>G⁻ (milieu des deux O) et G⁺ (carbone) sont au même endroit : les deux points sont confondus.</div>}</>, cadre('scene'));
      case 'ph2o': return (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {boite('L’eau : charges partielles', <><Vue3D ent={eau} charges G={fait('ph2o')} aria="Modèle 3D de l’eau avec les charges partielles : moins deux delta sur l’oxygène, plus delta sur chaque hydrogène." h={225} vue0={{ ry: -22, rx: 10 }}/>
            {fait('ph2o') && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt }}>G⁺ (entre les deux H) et G⁻ (sur O) sont distincts : le moment dipolaire <Vec n="p"/> va de G⁻ vers G⁺.</div>}</>, cadre('scene'))}
          {boite('Rappel : le dioxyde de carbone', <Vue3D ent={co2} charges G aria="Modèle 3D de CO₂ avec G plus et G moins confondus." h={190} vue0={{ ry: -25, rx: 12 }} commandes={false}/>, {})}
        </div>);
      case 'pnh3': return boite('L’ammoniac : charges partielles',
        <><Vue3D ent={nh3} charges showNL G={fait('pnh3')} aria="Modèle 3D de l’ammoniac avec les charges partielles : moins trois delta sur l’azote, plus delta sur chaque hydrogène." h={235} vue0={{ ry: 25, rx: 25 }}/>
          {fait('pnh3') && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt }}>G⁺ (centre du triangle des trois H) et G⁻ (sur N) sont distincts : NH₃ est polaire.</div>}</>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const entEx = E(ex.ent), PEx = M.polarite(entEx);
  const paire = M.PAIRES_AX2.find(p => p.id === ex.paire), molFict = M.moleculeAX2(paire, ex.angle), PF = M.polarite(molFict);
  const groupes = (() => { const g = {}; PEx.liaisons.forEach(l => { const k = `${lienTxt(l)}|${l.d}|${l.t}`; g[k] = { ...l, n: (g[k]?.n || 0) + 1 }; }); return Object.values(g); })();
  const optsEnt = (ids, label) => <optgroup label={label}>{ids.map(id => <option key={id} value={id}>{E(id).nom} {E(id).f}</option>)}</optgroup>;
  const objets = [['entite', 'Une entité réelle'], ['angle', 'Plier une molécule AX₂']];
  const explEntite = (<>
    <div className="gp-ex">
      <div className="gp-ex-scene">{boite(`${entEx.nom} ${entEx.f}`,
        <Vue3D key={ex.ent} ent={entEx} showNL={ex.nl} charges={ex.charges} G={ex.G && PEx.polaire !== null} aria={`Modèle 3D de ${entEx.nom} ${entEx.f}, ${entEx.forme} ; faites-le tourner.`} h={240} vue0={VUE_EX[ex.ent] || { ry: -30, rx: 13 }}/>)}</div>
      <div className="gp-ex-reglages">{boite('Réglages', <>
        {etiquette('Entité étudiée', <select value={ex.ent} onChange={x => setE({ ent: x.target.value })} style={sel}>
          {optsEnt(['H2', 'O2', 'N2', 'HCl'], 'Molécules à deux atomes')}{optsEnt(['H2O', 'CO2', 'NH3', 'CH4'], 'Molécules polyatomiques')}{optsEnt(['H3O+', 'NH4+'], 'Ions polyatomiques')}{optsEnt(['CCl4', 'CH3Cl', 'CH2O', 'HCN'], 'Au-delà du programme')}</select>)}
        {aide('Faites glisser le modèle pour le tourner. Les cases ci-dessous affichent ou cachent chaque information.')}
        {[['nl', 'Doublets non liants de l’atome central', entEx.nonLiants.length > 0], ['charges', 'Charges partielles +δ et −δ', true], ['G', 'Points G⁺, G⁻ et moment dipolaire', PEx.polaire !== null]].map(([k, l, ok]) =>
          <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, minHeight: 36, color: ok ? KIT.txt : '#94a3b8' }}><input type="checkbox" disabled={!ok} checked={ok && ex[k]} onChange={x => setE({ [k]: x.target.checked })}/>{l}</label>)}
        {!entEx.programme && <div style={{ fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '3px 8px', marginTop: 6 }}>Entité au-delà du programme : le raisonnement est le même.</div>}
        <Section titre="Autres représentations : Lewis et Cram" ouvert={!!ex.ouv.rep} onBascule={() => ouvrir('rep')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Lewis ent={entEx} maxWidth={260}/>{entEx.cram && <Cram ent={entEx} maxWidth={260} legende={false}/>}</div>
        </Section>
      </>)}</div>
      <div className="gp-ex-mesures">{boite('Ce que dit le modèle', <>
        <LigneMesure nom="Entité" valeur={`${entEx.nom} ${entEx.f}`}/>
        <LigneMesure nom="Type VSEPR" valeur={entEx.centre != null ? `${M.notationAXE(entEx)} (n + m = ${entEx.n + entEx.m})` : 'deux atomes : alignés'} couleur={COL.violet}/>
        <LigneMesure nom="Forme" valeur={entEx.forme} couleur={COL.orange}/>
        {entEx.centre != null && <LigneMesure nom="Angle X–A–X" valeur={`≈ ${nbf(M.angleXAX(entEx), 1)}${NB}°`}/>}
        {groupes.map(g => <LigneMesure key={`${lienTxt(g)}${g.d}`} nom={`Liaison ${lienTxt(g)}${g.n > 1 ? ` (× ${g.n})` : ''} : Δχ = ${nbf(g.d, 1)}`} valeur={M.LIBELLE_LIAISON[g.t]} couleur={g.t === 'non' ? COL.vert : COL.bleu}/>)}
        {entEx.charge ? <LigneMesure nom="Charge de l’ion" valeur={`${entEx.charge > 0 ? '+' : '−'}${Math.abs(entEx.charge)}`} couleur={COL.rouge}/> : null}
        <LigneMesure nom="Polarité de l’entité" valeur={PEx.polaire === null ? 'ion : non traitée' : PEx.polaire ? 'polaire' : 'apolaire'} couleur={PEx.polaire ? COL.rouge : COL.vert}/>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>{PEx.raison}.</div>
      </>)}</div>
    </div>
  </>);
  const explAngle = (<>
    <div className="gp-ex">
      <div className="gp-ex-scene">{boite('Une molécule AX₂ que l’on plie (expérience de pensée)',
        <Vue3D ent={molFict} charges G aria={`Molécule fictive AX₂ avec les liaisons ${paire.nom}, angle ${ex.angle} degrés, avec charges partielles et points G plus et G moins.`} h={225} vue0={{ ry: 0, rx: 0 }} commandes={false}/>)}</div>
      <div className="gp-ex-reglages">{boite('Réglages', <>
        {etiquette('Liaisons de la molécule', <select value={ex.paire} onChange={x => { const p = M.PAIRES_AX2.find(q => q.id === x.target.value); setE({ paire: p.id, angle: Math.round(p.reel) }); }} style={sel}>{M.PAIRES_AX2.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}</select>)}
        <Curseur nom="Angle X–A–X" valeur={ex.angle} onChange={v => setE({ angle: Math.round(v) })} min={60} max={180} pas={1} unite="°" decimales={0} couleur={COL.orange}/>
        <button onClick={() => setE({ angle: Math.round(paire.reel) })} style={stylePetitBouton(false, '#475569')}>Revenir à l’angle réel ({nbf(paire.reel, paire.reel % 1 ? 1 : 0)}{NB}°)</button>
        {aide('On garde les mêmes liaisons et on ne change que l’angle : regardez G⁺, G⁻ et la distance qui les sépare. Seul l’angle réel correspond à une vraie molécule.')}
      </>)}</div>
      <div className="gp-ex-mesures">{boite('Mesures et courbe', <>
        <LigneMesure nom="Liaisons" valeur={M.LIBELLE_LIAISON[PF.liaisons[0].t]}/>
        <LigneMesure nom="Δχ de la liaison" valeur={nbf(PF.liaisons[0].d, 1)}/>
        <LigneMesure nom="Distance G⁺G⁻" valeur={PF.Gplus ? `${nbf(PF.norme, 2)}${NB}Å` : '—'} couleur={COL.orange}/>
        <LigneMesure nom="Molécule" valeur={PF.polaire ? 'polaire' : 'apolaire'} couleur={PF.polaire ? COL.rouge : COL.vert}/>
        <div style={{ marginTop: 8 }}><CourbeAngle paire={paire} angle={ex.angle}/></div>
      </>)}</div>
    </div>
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Comparez CO₂ et H₂O : leurs liaisons sont toutes polarisées. Qu’est-ce qui rend l’une apolaire et l’autre polaire ?</li>
      <li>Comparez CH₄ et CCl₄ : les deux sont apolaires. Pour CH₄, il n’y a aucune liaison polarisée ; pour CCl₄, il y en a quatre. Pourquoi CCl₄ est-il quand même apolaire ?</li>
      <li>Passez de NH₃ à NH₄⁺, puis de H₂O à H₃O⁺ : que devient la forme quand un doublet non liant devient un doublet liant ?</li>
      <li>Choisissez CH₃Cl et CCl₄ : les atomes sont les mêmes en grande partie, la forme aussi. Pourquoi l’un est-il polaire et l’autre non ?</li>
      <li>Dans « Plier une molécule AX₂ », choisissez les liaisons O–H et faites varier l’angle : à quel angle la molécule serait-elle apolaire ? Et avec les liaisons C–H ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>AXₙEₘ : n atomes liés à l’atome central (une liaison double ou triple compte pour un), m doublets non liants ; n + m = 2, 3 ou 4 doublets (180°, 120°, 109,5°)</li>
        <li>forme = celle des atomes : AX₂E₀ linéaire, AX₂E₂ coudée, AX₃E₀ trigonale plane, AX₃E₁ pyramidale, AX₄E₀ tétraédrique</li>
        <li>Δχ = |χ(A) − χ(B)| ; convention du cours : ≤ 0,4 non polarisée, entre 0,4 et 1,7 polarisée, &gt; 1,7 ionique</li>
        <li>molécule polaire : G⁺ et G⁻ distincts (vec(p) de G⁻ vers G⁺) ; apolaire : confondus ou aucune liaison polarisée</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .gp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .gp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .gp-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .gp-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .gp-l1.cote .gp-carte { order: 2; } .gp-l1.cote .gp-main { order: 1; }
          .gp-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .gp-ex > .gp-ex-scene { grid-column: 1; grid-row: 1; } .gp-ex > .gp-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .gp-ex > .gp-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .gp-l1.cote { grid-template-columns: minmax(0, 1fr); } .gp-l1.scene-d-abord .gp-main { order: -1; } }
        @media (prefers-reduced-motion: no-preference) { .gp-in { animation: gp-fondu 0.35s ease-out; } @keyframes gp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Géométrie, électronégativité et polarité d’une entité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>À partir du <strong>schéma de Lewis</strong>, on prévoit la <strong>forme</strong> d’une entité (méthode VSEPR), puis, avec l’<strong>électronégativité</strong> des atomes, on décide si ses liaisons sont polarisées et si la molécule est <strong>polaire</strong>.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {etiquette('Que voulez-vous étudier ?', <select value={ex.objet} onChange={x => setE({ objet: x.target.value })} style={sel}>{objets.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
        </div>
        {ex.objet === 'entite' ? explEntite : explAngle}
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`gp-l1${enGuide || enDefi ? ' cote' : ''}${enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].retenir ? ' scene-d-abord' : ''}`}>
          {enGuide ? <div className="gp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="gp-carte gp-hypo-defi">{panneauHypo}</div> : null}
          <div className="gp-main">
            {enDefi && defi && <div className="gp-in" key={`${defi.type}-${defi.ent}`} style={{ marginBottom: 12 }}>{boite('Schéma de Lewis fourni', <Lewis ent={E(defi.ent)} maxWidth={300}/>)}</div>}
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'geometrie' ? suiviG : suiviP}/></div>}
            {enDefi && defi && defi.ok && <div className="gp-in" style={{ marginTop: 12 }}>{boite(`Le modèle 3D de ${E(defi.ent).nom}`, <Vue3D key={defi.ent} ent={E(defi.ent)} showNL={E(defi.ent).nonLiants.length > 0} charges={defi.type === 'polarite'} G={defi.type === 'polarite'} aria={`Modèle 3D de ${E(defi.ent).nom} ${E(defi.ent).f}.`} h={225}/>)}</div>}
            {enGuide && <div className="gp-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && fait('pnh3') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
