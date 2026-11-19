/* eslint-disable no-irregular-whitespace -- espaces insécables écrits tels quels devant les unités */
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, Curseur, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./newtonModele";
import { QCM_PARCOURS as Q } from "./newtonQcm";
import { SceneNewton, SceneTrain, BandeauSomme, SvgBilanCarte, SvgSommeAccCarte, SvgSens1Carte, SvgSens2Carte, SvgEquilibreCarte, SvgGalileenCarte } from "./newtonSchemas";
import { nbf, nbm, nbs, nomForce } from "./newtonOutils";

const SIM_ID = 168, CLE_GUIDE = 'newton-tg-guide-v1';
declarerDefis(SIM_ID, [['acc', 'De la somme des forces à l’accélération'], ['forces', 'Du mouvement à la force inconnue']]);

// ====================================================
// SIM 168 — DEUXIÈME LOI DE NEWTON : DE LA SOMME DES FORCES À L'ACCÉLÉRATION DU CENTRE DE MASSE
//  (TG spé PC, partie « Relier les actions appliquées à un système à son mouvement », sous-partie « Deuxième loi de Newton »).
//  Une seule idée : Σ vec(F) = m vec(a)_G, dans les deux sens du raisonnement (forces → accélération ; mouvement → forces), équilibre comme cas particulier.
//  Capacités visées (jamais affichées à l'élève) : justifier qualitativement la position du centre de masse (donnée) ; discuter qualitativement du caractère galiléen
//  d'un référentiel ; utiliser la deuxième loi pour déterminer le vecteur accélération du centre de masse, ou la somme des forces, à partir d'éléments cinématiques.
//  Modèle : newtonModele.js (test : newtonModele.test.mjs).
// ====================================================

const g1 = v => nbf(v, 1);
const IDS = ['centre', 'bilan', 'loi', 'proj', 'acc', 'vertical', 'fil', 'freinage', 'cinema', 'cabT', 'equilibre', 'galileen', 'terrestre', 'bilanFin'];

// ---------- formules (MathML) ----------
const VecA = <msub><mover><mi>a</mi><mo>→</mo></mover><mi>G</mi></msub>;
const VecSF = <><mo>∑</mo><mover><mi>F</mi><mo>→</mo></mover></>;
const FLoi = <Formule>{VecSF}<mo>=</mo><mi>m</mi><mo>×</mo>{VecA}</Formule>;
const FAccel = <Formule>{VecA}<mo>=</mo><mfrac><mrow>{VecSF}</mrow><mi>m</mi></mfrac></Formule>;
const FProjX = <Formule><mo>∑</mo><msub><mi>F</mi><mi>x</mi></msub><mo>=</mo><mi>m</mi><mo>×</mo><msub><mi>a</mi><mi>x</mi></msub></Formule>;
const FProjY = <Formule><mo>∑</mo><msub><mi>F</mi><mi>y</mi></msub><mo>=</mo><mi>m</mi><mo>×</mo><msub><mi>a</mi><mi>y</mi></msub></Formule>;
const FDv = <Formule>{VecA}<mo>=</mo><mfrac><mrow><mi>Δ</mi><mover><mi>v</mi><mo>→</mo></mover></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac><mo>=</mo><mfrac><mrow><msub><mover><mi>v</mi><mo>→</mo></mover><mn>2</mn></msub><mo>−</mo><msub><mover><mi>v</mi><mo>→</mo></mover><mn>1</mn></msub></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></Formule>;
const FTcab = <Formule><mi>T</mi><mo>=</mo><mi>P</mi><mo>+</mo><mi>m</mi><mo>×</mo><msub><mi>a</mi><mi>y</mi></msub><mo>=</mo><mi>m</mi><mo>×</mo><mo>(</mo><mi>g</mi><mo>+</mo><msub><mi>a</mi><mi>y</mi></msub><mo>)</mo></Formule>;
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- situations du parcours ----------
const R0 = { m: 1.5, T: 7.5, alpha: 0, f: 3.0 };
const FR0 = M.forcesRail(R0), FR1 = FR0.filter(f => f.id !== 'f');
const S0 = M.somme(FR0), A0 = M.acceleration(FR0, R0.m);
const CAB = { m: 800, v1: 0, v2: 1.6, dt: 2.0 }, aCab = M.accDepuisVitesses(CAB.v1, CAB.v2, CAB.dt), TCab = M.filDepuisA({ m: CAB.m, ay: aCab });
const FIL = { m: 0.5, T: 6.0 }, aFil = M.bilan('fil', FIL).a.y;
const PARA = { m: 80 }, fPara = M.chuteDepuisA({ m: PARA.m, ay: 0 });
const SCENES = {
  centre: { kind: 'rail', forces: [], charge: true },
  bilan: { kind: 'rail', forces: [], fil: true },
  loi: { kind: 'rail', forces: FR1, fil: true },
  proj: { kind: 'rail', forces: FR0, valeursDe: ['T', 'f'] },
  acc: { kind: 'rail', forces: FR0, valeursDe: ['T', 'f'], bandeau: { S: S0, a: A0 } },
  vertical: { kind: 'rail', forces: FR0, valeursDe: ['T', 'f'], bandeau: { S: S0, a: A0 } },
  fil: { kind: 'fil', forces: M.forcesFil(FIL), valeursDe: ['T'] },
  freinage: { kind: 'cabine', forces: [], vit: [{ i: '', y: 1.5, txt: 'diminue' }] },
  cinema: { kind: 'cabine', forces: [], vit: [{ i: '1', y: CAB.v1, txt: '0' }, { i: '2', y: CAB.v2, txt: nbf(CAB.v2, 1) }] },
  cabT: { kind: 'cabine', forces: [{ id: 'P', x: 0, y: -CAB.m * M.G }, { id: 'T', x: 0, y: 1 }], inconnue: 'T' },
  equilibre: { kind: 'chute', forces: [{ id: 'P', x: 0, y: -PARA.m * M.G }, { id: 'f', x: 0, y: 1 }], inconnue: 'f' },
};
const legende = (kind, forces, inconnue) => {
  const ids = [...new Set(forces.map(f => f.id))];
  return ids.length ? <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.6, marginTop: 2 }}>{ids.map((id, k) => <span key={id}>{k ? ' · ' : ''}<span style={{ whiteSpace: 'nowrap' }}>{avecIndices(`vec(${id})`)}{'\u00a0'}{nomForce(kind, id)}</span></span>)}{inconnue ? ' (flèche en pointillés, coupée : intensité à trouver, sa longueur ne signifie rien)' : ''} · croix : centre de masse G</div> : <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 2 }}>La croix marque le centre de masse G.</div>;
};

// ====================================================
export function SimulationNewton() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviF, noterF] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('acc');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ regl: false, essayer: false, retenir: false });
  const PRE = { rail: { m: 1.5, T: 7.5, alpha: 0, f: 3.0, a: 3.0 }, fil: { m: 0.5, T: 6.0, a: 2.2 }, cabine: { m: 800, T: 8480, a: 0.8 }, chute: { m: 80, f: 784, a: 0 } };
  const [ex, setEx] = useState({ sc: 'rail', sens: 'forces', ...PRE.rail });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));
  const choisirSc = sc => setEx(s => ({ sc, sens: s.sens, ...PRE[sc] }));

  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];

  // ---------- exploration : bilan calculé ----------
  const { sc: scE, sens } = ex, kE = scE === 'rail' ? 'rail' : scE;
  // chariot : en partant du mouvement, le freinage est permis tant que la tension reste positive (T = m a_x + f >= 0)
  const aMinRail = scE === 'rail' ? -Math.min(3, Math.floor(ex.f / ex.m / 0.25 + 1e-9) * 0.25) : 0;
  const aEff = scE === 'rail' ? Math.max(ex.a, aMinRail) : ex.a;
  const pEx = (() => {
    if (scE === 'rail') return { m: ex.m, alpha: ex.alpha, f: ex.f, T: sens === 'forces' ? ex.T : M.railDepuisA({ m: ex.m, alpha: ex.alpha, f: ex.f, ax: aEff }) };
    if (scE === 'chute') return { m: ex.m, f: sens === 'forces' ? ex.f : M.chuteDepuisA({ m: ex.m, ay: ex.a }) };
    return { m: ex.m, T: sens === 'forces' ? ex.T : M.filDepuisA({ m: ex.m, ay: ex.a }) };
  })();
  const bE = M.bilan(scE, pEx);
  const equilibre = M.estEquilibre(bE.S, ex.m);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'centre', titre: 'Le système et son centre de masse', focus: ['scene'],
      texte: <>Un chariot de laboratoire roule sur un rail. On le modélise par un seul point : son <strong>centre de masse G</strong> (la croix sur le schéma). La deuxième loi de Newton permet de prévoir le mouvement de G. Ici, le chariot porte une charge lourde sur sa moitié gauche ; la position de G est donnée sur le schéma. En Première, vous avez relié la variation du vecteur vitesse à la somme des forces ; ici, on le fait avec la masse et avec des valeurs.</>,
      tache: { type: 'qcm', q: 'Pourquoi G est-il placé à gauche du milieu du chariot ?', ...Q.centre,
        expl: 'G est une sorte de « moyenne » des positions de la matière, pondérée par la masse : il se rapproche de l’endroit où il y a le plus de masse. Sans charge, un chariot homogène aurait G en son milieu.',
        indice: 'Si on posait la même charge à droite, où irait G ? Il se rapproche de la partie la plus massive du système.' } },
    { id: 'bilan', titre: 'Faire le bilan des forces', focus: ['scene'],
      texte: <>Le chariot est maintenant tiré vers la droite par un fil horizontal ; on néglige les frottements. Chaque action sur le système se représente par une <strong>force</strong>, dont le vecteur part de G. Une force vient d’un contact (le fil, le rail) ou d’une action à distance (le poids, dû à la Terre).</>,
      tache: { type: 'qcm', q: 'Quelles forces s’exercent sur le chariot ?', ...Q.bilan,
        expl: 'Le poids (action à distance de la Terre), la réaction du rail (contact, perpendiculaire au rail) et la tension du fil (contact). La vitesse n’est pas une force : il n’existe pas de « force de mouvement ».',
        indice: 'Cherchez ce qui touche le chariot (contact) et l’action à distance de la Terre. Une vitesse n’est pas une action.' } },
    { id: 'loi', titre: 'La deuxième loi de Newton', focus: ['scene'],
      retenirTitre: 'À RETENIR : FAIRE LE BILAN DES FORCES', retenir: <>
        <SvgBilanCarte/>
        <ul style={UL}>
          <li><strong>Une action = une flèche</strong>, tracée depuis G : le poids vec(P) vers le bas, la réaction vec(R) du support perpendiculaire au support, la tension vec(T) le long du fil ; s’il y a des frottements, vec(f) est opposée au mouvement.</li>
          <li>Exemple de la simulation : chariot sur un rail tiré par un fil, avec poids, réaction et tension (frottements négligés).</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui touche + la Terre »</strong>. Idée fausse : « il y a une force dans le sens du mouvement ». Vrai : la vitesse n’est pas une force.</li>
        </ul></>,
      texte: <>Voici le bilan : le poids vec(P), la réaction vec(R) du rail et la tension vec(T) du fil. Dans un référentiel galiléen, la <strong>deuxième loi de Newton</strong> relie la somme des forces à l’accélération du centre de masse : {FLoi}où m est la masse du système (en kg), constante, et vec(a)_G le vecteur accélération de G (en m/s²).</>,
      tache: { type: 'qcm', q: 'La somme Σ vec(F) est dirigée vers la droite (seule la tension a une composante horizontale). Le vecteur accélération vec(a)_G du centre de masse est…', ...Q.loi,
        expl: 'La masse m est positive : vec(a)_G s’obtient en divisant Σ vec(F) par m, il a donc la même direction et le même sens que Σ vec(F), ici vers la droite. Ce n’est pas le mouvement qui fixe le sens de l’accélération, mais la somme des forces.',
        indice: 'Dans Σ vec(F) = m × vec(a)_G, on multiplie le vecteur accélération par la masse m. Que change un nombre positif à la direction et au sens d’un vecteur ?' } },
    { id: 'proj', titre: 'Projeter sur un axe : les signes', focus: ['scene'],
      retenirTitre: 'À RETENIR : SOMME DES FORCES ET ACCÉLÉRATION', retenir: <>
        <SvgSommeAccCarte/>
        <ul style={UL}>
          <li>{FLoi}</li>
          <li>Comme m &gt; 0, vec(a)_G a <strong>la même direction et le même sens</strong> que Σ vec(F). Exemple : une somme de 8 N dirigée vers le bas pour une masse de 2 kg donne 4 m/s², vers le bas.</li>
          <li>Moyen de s’en souvenir : <strong>« la somme des forces et l’accélération pointent du même côté »</strong>. Idée fausse : « l’accélération est dans le sens du mouvement ». Vrai : elle est dans le sens de Σ vec(F).</li>
        </ul></>,
      texte: <>Le chariot roule vers la droite ; le rail frotte un peu : une force de frottement vec(f), horizontale et vers la gauche, s’ajoute. Données : m = 1,5 kg ; T = 7,5{NB}N ; f = 3,0{NB}N ; g = 9,8{NB}m/s². On projette sur l’axe Ox (horizontal, orienté vers la droite) : une force vers la droite compte <strong>positivement</strong>, vers la gauche <strong>négativement</strong>. Le poids et la réaction sont verticaux : leurs composantes sur Ox sont nulles.</>,
      tache: { type: 'num', carnet: false, q: 'Composante ΣF_x de la somme des forces sur l’axe Ox (en N)', unite: 'N', vrai: S0.x, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Projection sur Ox : ΣF_x = T_x + f_x + P_x + R_x.', 'T_x = +7,5 N (vers la droite) ; f_x = −3,0 N (vers la gauche) ; P_x = R_x = 0 (verticales).', `ΣF_x = 7,5 − 3,0 = ${nbf(S0.x, 1)} N.`],
        pieges: [[R0.T + R0.f, 'Le frottement est vers la gauche, donc négatif sur Ox : il se retranche (7,5 − 3,0).'], [R0.T, 'Vous avez oublié le frottement : il agit aussi sur le chariot.'], [-S0.x, 'Le signe est inversé : la tension (vers la droite, donc positive) l’emporte sur le frottement.']],
        expl: `ΣF_x = 7,5 − 3,0 = ${nbf(S0.x, 1)} N, positif : la somme des forces est dirigée vers la droite.`,
        indice: 'Écrivez chaque composante avec son signe : + pour une force vers la droite, − pour une force vers la gauche, 0 pour une force verticale. Puis additionnez.' } },
    { id: 'acc', titre: 'Calculer l’accélération', focus: ['scene', 'bandeau'],
      texte: <>Vous avez trouvé ΣF_x = {nbf(S0.x, 1)}{NB}N. Le bandeau sous le schéma montre Σ vec(F) et vec(a)_G : même direction, même sens. La deuxième loi, projetée sur Ox, s’écrit : {FProjX}La masse du chariot est m = 1,5{NB}kg.</>,
      tache: { type: 'num', carnet: false, q: 'Composante a_x de l’accélération du centre de masse (en m/s²)', unite: 'm/s²', vrai: A0.x, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Projection de la deuxième loi sur Ox : ΣF_x = m × a_x, donc a_x = frac(ΣF_x|m).', `a_x = frac(${nbf(S0.x, 1)}|1,5) = ${nbf(A0.x, 1)} m/s² (des newtons divisés par des kilogrammes donnent des m/s²).`, 'a_x est positif : vec(a)_G est dirigé vers la droite, comme Σ vec(F).'],
        pieges: [[S0.x * R0.m, 'Il faut diviser par la masse, pas multiplier : a_x = frac(ΣF_x|m).'], [S0.x, 'Vous avez oublié de diviser par la masse m = 1,5 kg.'], [R0.m / S0.x, 'Le rapport est inversé : a_x est ΣF_x divisée par m.']],
        expl: `a_x = frac(${nbf(S0.x, 1)}|1,5) = ${nbf(A0.x, 1)} m/s².`,
        indice: 'ΣF_x = m × a_x : isolez a_x. Les newtons divisés par des kilogrammes donnent des m/s².' } },
    { id: 'vertical', titre: 'Et verticalement ?', focus: ['scene'],
      texte: <>Le chariot reste sur le rail : il ne monte ni ne descend, donc a_y = 0 (axe Oy vertical, vers le haut). La deuxième loi projetée sur Oy donne {FProjY}avec a_y = 0. On rappelle m = 1,5{NB}kg et g = 9,8{NB}m/s².</>,
      tache: { type: 'num', carnet: false, q: 'Intensité R de la réaction du rail (en N)', unite: 'N', vrai: R0.m * M.G, tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['Projection sur Oy : R − P = m × a_y = 0, car a_y = 0.', `R = P = m × g = 1,5 × 9,8 = ${nbf(R0.m * M.G, 1)} N.`],
        pieges: [[R0.m, 'Vous avez donné la masse (en kg) : il faut calculer le poids P = m × g, en newtons.'], [M.G, 'C’est g : il faut multiplier par la masse, R = P = m × g.'], [0, 'La réaction n’est pas nulle : elle compense le poids puisque a_y = 0.']],
        expl: `R = P = 1,5 × 9,8 = ${nbf(R0.m * M.G, 1)} N.`,
        indice: 'Si a_y = 0, alors ΣF_y = R − P = 0. Calculez le poids P = m × g avec m en kg.' } },
    { id: 'fil', titre: 'Un fil qui tire vers le haut', focus: ['scene'],
      texte: <>Une masse m = 0,50{NB}kg est accrochée à un fil. Le fil exerce sur elle une tension T = 6,0{NB}N (g = 9,8{NB}m/s²). On choisit un axe Oy vertical orienté vers le <strong>haut</strong> : le poids vec(P) a pour composante −P, la tension vec(T) a pour composante +T.</>,
      tache: { type: 'num', carnet: false, q: 'Composante a_y de l’accélération (en m/s², axe Oy vers le haut)', unite: 'm/s²', vrai: aFil, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['ΣF_y = T − P = T − m × g = 6,0 − 0,50 × 9,8 = 6,0 − 4,9 = 1,1 N.', `a_y = frac(ΣF_y|m) = frac(1,1|0,50) = ${nbf(aFil, 1)} m/s² : positif, donc vers le haut.`],
        pieges: [[-aFil, 'Le signe est inversé : la tension (+6,0 N) est plus grande que le poids (4,9 N), donc ΣF_y est positif.'], [FIL.T / FIL.m, 'Vous avez oublié le poids : ΣF_y = T − P.'], [(FIL.T + FIL.m * M.G) / FIL.m, 'Le poids est dirigé vers le bas : sa composante est négative, il se retranche.'], [FIL.T - FIL.m * M.G, 'Vous avez oublié de diviser par la masse : a_y = frac(ΣF_y|m).']],
        expl: `a_y = frac(6,0 − 4,9|0,50) = ${nbf(aFil, 1)} m/s², vers le haut.`,
        indice: 'Projetez sur Oy (vers le haut) : ΣF_y = T − P, avec P = m × g. Puis a_y = frac(ΣF_y|m).' } },
    { id: 'freinage', titre: 'Vitesse et accélération : ne pas confondre', focus: ['scene'],
      retenirTitre: 'À RETENIR : DES FORCES À L’ACCÉLÉRATION', retenir: <>
        <SvgSens1Carte/>
        <ul style={UL}>
          <li>Pour aller des forces à l’accélération : <strong>bilan, axe, signes</strong>, puis division par la masse : {FAccel}</li>
          <li>Exemple de la simulation : T = 7,5 N et f = 3,0 N donnent ΣF_x = 4,5 N ; avec m = 1,5 kg, a_x = frac(4,5|1,5) = 3,0 m/s².</li>
          <li>Moyen de s’en souvenir : <strong>« bilan, axe, signes, puis ÷ m »</strong>. Idée fausse : « on additionne les intensités sans les signes ». Vrai : une force opposée à l’axe a une composante négative.</li>
        </ul></>,
      texte: <>Une cabine d’ascenseur monte, puis ralentit jusqu’à l’arrêt à l’étage. Son vecteur vitesse vec(v) est dirigé vers le haut (flèche grise). Ne confondez pas le sens du mouvement et le sens de l’accélération : c’est la somme des forces qui fixe celui de vec(a)_G.</>,
      tache: { type: 'qcm', q: 'Pendant le freinage, le vecteur accélération vec(a)_G de la cabine est dirigé…', ...Q.freinage,
        expl: 'La vitesse diminue : le vecteur vitesse varie vers le bas (Δvec(v) est vers le bas), donc vec(a)_G est vers le bas, alors que la cabine monte. Σ vec(F) est donc aussi vers le bas : la tension du câble est plus petite que le poids.',
        indice: 'Quand une vitesse diminue, le vecteur variation de vitesse est opposé au vecteur vitesse. L’accélération a le sens de cette variation.' } },
    { id: 'cinema', titre: 'Du mouvement à l’accélération', focus: ['scene'],
      texte: <>On part maintenant du mouvement. Une cabine de masse m = 800{NB}kg démarre vers le haut. Un capteur donne sa vitesse : vec(v)_1 à t = 0, puis vec(v)_2 deux secondes plus tard. Les forces sont constantes, donc l’accélération l’est aussi : {FDv}Tout est vertical : on utilise les composantes sur Oy (vers le haut) : v₁ = 0 et v₂ = 1,6{NB}m/s, avec Δt = 2,0{NB}s.</>,
      tache: { type: 'num', carnet: false, q: 'Composante a_y de l’accélération de la cabine (en m/s²)', unite: 'm/s²', vrai: aCab, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Les forces sont constantes : a_y = frac(v₂ − v₁|Δt).', `a_y = frac(1,6 − 0|2,0) = ${nbf(aCab, 2)} m/s² : positif, donc vers le haut.`],
        pieges: [[CAB.v2 * CAB.dt, 'Il faut diviser Δv par Δt, pas le multiplier.'], [CAB.dt / CAB.v2, 'Le rapport est inversé : a_y est Δv divisée par Δt.'], [CAB.v2, 'Vous avez oublié de diviser par la durée Δt = 2,0 s.']],
        expl: `a_y = frac(1,6 − 0|2,0) = ${nbf(aCab, 2)} m/s², vers le haut.`,
        indice: 'a_y = frac(v₂ − v₁|Δt) : v en m/s et Δt en s donnent des m/s².' } },
    { id: 'cabT', titre: 'De l’accélération à la force inconnue', focus: ['scene'],
      texte: <>La cabine de 800{NB}kg a une accélération vec(a)_G dirigée vers le haut, de composante a_y = {nbf(aCab, 2)}{NB}m/s² (étape précédente). Elle subit son poids vec(P) et la tension vec(T) du câble (flèche en pointillés : on ne connaît pas encore son intensité). On projette Σ vec(F) = m vec(a)_G sur Oy (vers le haut) : T − P = m × a_y. Prenez g = 9,8{NB}m/s².</>,
      tache: { type: 'num', carnet: false, q: 'Intensité T de la tension du câble (en N)', unite: 'N', vrai: TCab, tol: 0.05, affiche: v => nbm(v), cs: 3,
        calcul: () => ['Projection sur Oy : T − P = m × a_y, donc T = P + m × a_y = m × (g + a_y).', `T = 800 × (9,8 + ${nbf(aCab, 2)}) = 800 × ${nbf(9.8 + aCab, 2)} = ${nbm(TCab)} N.`, 'T est plus grande que le poids (7 840 N) : la cabine accélère vers le haut.'],
        pieges: [[CAB.m * aCab, 'Vous avez calculé m × a_y, c’est-à-dire ΣF_y : il faut y ajouter le poids, T = P + m × a_y.'], [CAB.m * M.G, 'C’est le poids seul : la cabine accélère vers le haut, donc T est plus grande que P.'], [CAB.m * (M.G - aCab), 'Le signe est inversé : a_y est vers le haut, donc T = m × (g + a_y).']],
        expl: `T = 800 × (9,8 + ${nbf(aCab, 2)}) = ${nbm(TCab)} N.`,
        indice: 'Isolez T dans T − P = m × a_y, avec P = m × g. Gardez au moins 4 chiffres significatifs dans le calcul, puis arrondissez le résultat.' } },
    { id: 'equilibre', titre: 'Un parachutiste à vitesse constante', focus: ['scene'],
      retenirTitre: 'À RETENIR : DU MOUVEMENT AUX FORCES', retenir: <>
        <SvgSens2Carte/>
        <ul style={UL}>
          <li>Pour aller du mouvement aux forces : on calcule <strong>d’abord vec(a)_G</strong> à partir de la variation Δvec(v) de la vitesse pendant Δt : {FDv}<strong>puis</strong> Σ vec(F) = m vec(a)_G, enfin la force inconnue par le bilan : {FTcab}</li>
          <li>Exemple de la simulation : cabine de 800 kg, a_y = 0,80 m/s² vers le haut, donc T = 8 480 N, plus grande que P = 7 840 N.</li>
          <li>Moyen de s’en souvenir : <strong>« d’abord vec(a)_G, puis Σ vec(F), puis la force qui manque »</strong>. Idée fausse : « T = m × a_y ». Vrai : T − P = m × a_y, donc T = P + m × a_y.</li>
        </ul></>,
      texte: <>Un parachutiste de masse m = 80{NB}kg (équipement compris) descend en ligne droite, <strong>à vitesse constante</strong>, voile ouverte. Il subit son poids vec(P) et le frottement vec(f) de l’air, tous deux verticaux (axe Oy vers le haut). On connaît son mouvement et on cherche une force. On prend g = 9,8{NB}m/s².</>,
      tache: { type: 'num', carnet: false, q: 'Intensité f du frottement de l’air (en N)', unite: 'N', vrai: fPara, tol: 0.05, affiche: v => nbm(v), cs: 2,
        calcul: () => ['Vitesse constante : le vecteur vitesse ne varie pas, donc vec(a)_G est nul et Σ vec(F) aussi. Projection sur Oy (vers le haut) : ΣF_y = f − P = 0.', `f = P = m × g = 80 × 9,8 = ${nbm(fPara)} N.`],
        pieges: [[PARA.m, 'C’est la masse en kg : il faut calculer le poids P = m × g, en newtons.'], [PARA.m / M.G, 'Il faut multiplier la masse par g, pas la diviser.'], [0, 'À vitesse constante, la somme des forces est nulle : le frottement compense le poids, il n’est pas nul.']],
        expl: `f = P = 80 × 9,8 = ${nbm(fPara)} N.`,
        indice: 'Que vaut le vecteur accélération quand la vitesse est constante ? Que devient alors Σ vec(F) = m × vec(a)_G, et que valent f et P l’une par rapport à l’autre ?' } },
    { id: 'galileen', titre: 'Dans quel référentiel ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : ÉQUILIBRE', retenir: <>
        <SvgEquilibreCarte/>
        <ul style={UL}>
          <li>Si la somme Σ vec(F) est nulle, alors vec(a)_G est nul : le vecteur vitesse ne varie pas. Le système est <strong>immobile ou en mouvement rectiligne uniforme</strong> (principe d’inertie, cas particulier de la deuxième loi).</li>
          <li>Exemple de la simulation : parachutiste de 80 kg, f = P = 784 N.</li>
          <li>Moyen de s’en souvenir : <strong>« vitesse constante ⇒ somme nulle »</strong>. Idée fausse : « s’il avance, une force le pousse dans son sens ». Vrai : sans variation de vitesse, les forces se compensent.</li>
        </ul></>,
      texte: <>La deuxième loi de Newton s’applique dans un référentiel <strong>galiléen</strong>. Une bille est posée sur le sol parfaitement lisse d’un wagon qui démarre : le wagon accélère par rapport à la voie. Le poids de la bille et la réaction du sol se compensent : aucune force horizontale ne s’exerce sur elle. Vue depuis la voie, la bille garde son vecteur vitesse ; vue depuis le wagon, elle recule.</>,
      tache: { type: 'qcm', q: 'Dans quel référentiel peut-on appliquer la deuxième loi à cette bille ?', ...Q.galileen,
        expl: 'Σ vec(F) est nulle, donc la loi prévoit un vecteur vitesse constant : c’est ce qu’on observe depuis la voie, dont le référentiel convient. Depuis le wagon, la bille accélère alors que Σ vec(F) est nulle : la loi n’y est pas applicable, ce référentiel accéléré n’est pas galiléen.',
        indice: 'Dans quel référentiel le mouvement observé est-il en accord avec Σ vec(F) = m × vec(a)_G, sachant que Σ vec(F) est nulle ?' } },
    { id: 'terrestre', titre: 'Le référentiel terrestre est-il galiléen ?', focus: [],
      texte: <>Reprenons le chariot de l’étape 1 : il roule quelques secondes sur le rail du laboratoire. On étudie son mouvement dans le référentiel du laboratoire (le <strong>référentiel terrestre</strong>). La Terre tourne sur elle-même, et autour du Soleil.</>,
      tache: { type: 'qcm', q: 'Peut-on appliquer la deuxième loi de Newton à ce mouvement dans le référentiel terrestre ?', ...Q.terrestre,
        expl: 'Le référentiel terrestre n’est pas rigoureusement galiléen, mais pendant quelques secondes la rotation de la Terre est sans effet mesurable sur le mouvement : on le suppose galiléen. Pour un mouvement qui dure des heures ou qui s’étend sur de grandes distances (masses d’air d’un cyclone), l’approximation ne serait plus valable.',
        indice: 'De quel angle la Terre tourne-t-elle en quelques secondes ? Cela change-t-il visiblement le mouvement du chariot ?' } },
    { id: 'bilanFin', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : RÉFÉRENTIEL GALILÉEN', retenir: <>
        <SvgGalileenCarte/>
        <ul style={UL}>
          <li>La deuxième loi s’utilise dans un <strong>référentiel galiléen</strong>. Le référentiel terrestre peut être supposé galiléen pour une étude courte (quelques secondes) ; un référentiel qui accélère (train qui démarre) ne l’est pas.</li>
          <li>Exemple de la simulation : une bille posée dans un wagon qui accélère recule sans qu’aucune force horizontale ne s’exerce sur elle.</li>
          <li>Moyen de s’en souvenir : <strong>« référentiel accéléré ⇒ la loi ne marche plus »</strong>. Idée fausse : « la deuxième loi vaut dans tous les référentiels ». Vrai : seulement dans les référentiels galiléens.</li>
        </ul></>,
      texte: <>Vous savez faire le bilan des forces, projeter avec les signes et appliquer Σ vec(F) = m vec(a)_G dans les deux sens : des forces vers l’accélération, et du mouvement vers la force inconnue. Vous savez aussi reconnaître un équilibre et discuter du référentiel. Passez à l’exploration (chariot incliné, masse suspendue, cabine, parachutiste, dans les deux sens du raisonnement) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { const t = type === 'acc' ? M.tirageDefiAcc() : M.tirageDefiForces(); setDefi({ ...t, sit: t.type, type, rep: '', verifie: false }); };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const procheTol = (x, v, t) => isFinite(x) && Math.abs(x - v) <= t * Math.abs(v);
  const TOL = { acc: 0.07, forces: 0.06 };
  const verifier = () => {
    const ok = procheTol(lireNombre(defi.rep), defi.vrai, TOL[defi.type]);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'acc' ? noterA : noterF)(ok);
  };
  const dd = enDefi && defi ? defi : null;
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const mDef = d => (d.m < 10 ? nbf(d.m, 2) : nbm(d.m)), TDef = d => (d.sit === 'cabine' ? nbm(d.T) : nbf(d.T, 1));
  const enonceDefi = d => {
    if (d.type === 'acc') {
      const fin = <>Déterminez la composante {avecIndices(`a_${d.composante}`)} de vec(a)_G sur l’axe {d.composante === 'x' ? 'Ox (horizontal, vers la droite)' : 'Oy (vertical, vers le haut)'}, avec 2 chiffres significatifs (marge acceptée : 7{NB}% de la valeur ; une valeur négative est possible).</>;
      if (d.sit === 'rail') return <>Un chariot de masse <strong>m = {nbf(d.m, 1)}{NB}kg</strong> roule vers la droite sur un rail horizontal. Le fil exerce une tension <strong>T = {nbf(d.T, 1)}{NB}N</strong>{d.alpha ? <>, le fil étant incliné de <strong>α = {d.alpha}°</strong> au-dessus de l’horizontale</> : ' (fil horizontal)'}. Les frottements valent <strong>f = {nbf(d.f, 1)}{NB}N</strong>{d.f === 0 ? ' (négligeables)' : ''}, opposés au mouvement. On prend g = 9,8{NB}m/s². {fin}</>;
      if (d.sit === 'fil') return <>Une masse <strong>m = {mDef(d)}{NB}kg</strong> est accrochée à un fil qui exerce sur elle une tension <strong>T = {TDef(d)}{NB}N</strong>. On prend g = 9,8{NB}m/s². {fin}</>;
      return <>Une cabine d’ascenseur de masse <strong>m = {mDef(d)}{NB}kg</strong> est suspendue à un câble qui exerce une tension <strong>T = {TDef(d)}{NB}N</strong>. On prend g = 9,8{NB}m/s². {fin}</>;
    }
    return d.sit === 'cabine'
      ? <>Une cabine de masse <strong>m = {nbm(d.m)}{NB}kg</strong> {d.phase === 'demarrage' ? 'démarre vers le haut' : 'monte puis s’arrête'}. Sa vitesse (verticale, vers le haut) passe de <strong>v₁ = {nbf(d.v1, 1)}{NB}m/s</strong> à <strong>v₂ = {nbf(d.v2, 1)}{NB}m/s</strong> en <strong>Δt = {nbf(d.dt, 1)}{NB}s</strong>, avec des forces constantes. Elle est soumise à son poids vec(P) et à la tension vec(T) du câble. On prend g = 9,8{NB}m/s². Déterminez l’intensité T de la tension, avec 2 chiffres significatifs (marge acceptée : 6{NB}% de la valeur).</>
      : <>Un chariot de masse <strong>m = {nbf(d.m, 1)}{NB}kg</strong> roule vers la droite sur un rail horizontal, tiré par un fil horizontal. Les frottements valent <strong>f = {nbf(d.f, 1)}{NB}N</strong>. Sa vitesse passe de <strong>v₁ = {nbf(d.v1, 2)}{NB}m/s</strong> à <strong>v₂ = {nbf(d.v2, 2)}{NB}m/s</strong> (vers la droite) en <strong>Δt = {nbf(d.dt, 1)}{NB}s</strong>, avec des forces constantes. Déterminez l’intensité T de la tension du fil, avec 2 chiffres significatifs (marge acceptée : 6{NB}% de la valeur).</>;
  };
  const indiceDefi = d => (d.type === 'acc'
    ? 'Faites le bilan des forces, puis projetez sur l’axe avec les signes : un poids vers le bas est négatif sur Oy, une force vers la droite positive sur Ox (composante T × cos α pour un fil incliné). La composante de vec(a)_G est la composante de Σ vec(F) divisée par m. Gardez 4 chiffres significatifs dans les calculs intermédiaires (T − P annule presque les deux termes) et arrondissez seulement le résultat.'
    : (d.sit === 'cabine' ? 'Calculez d’abord a_y = frac(v₂ − v₁|Δt) (avec son signe), puis projetez sur Oy : T − P = m × a_y, donc T = m × (g + a_y). Gardez 4 chiffres significatifs dans les calculs intermédiaires.'
      : 'Calculez d’abord a_x = frac(v₂ − v₁|Δt), puis projetez sur Ox : T − f = m × a_x, donc T = m × a_x + f. Gardez 4 chiffres significatifs dans les calculs intermédiaires.'));
  const solutionDefi = d => {
    if (d.type === 'acc') {
      const S = d.composante === 'x' ? d.S.x : d.S.y;
      const calc = d.sit === 'rail' ? `${nbf(d.T, 1)} × cos ${d.alpha}° − ${nbf(d.f, 1)}` : `${TDef(d)} − ${mDef(d)} × 9,8`;
      return `ΣF_${d.composante} = ${calc} = ${nbf(S, 2)} N ; a_${d.composante} = frac(ΣF_${d.composante}|m) = ${nbf(d.vrai, 2)} m/s² (${d.vrai > 0 ? 'dans le sens de l’axe' : 'dans le sens opposé à l’axe'}).`;
    }
    return d.sit === 'cabine'
      ? `a_y = frac(${nbf(d.v2, 1)} − ${nbf(d.v1, 1)}|${nbf(d.dt, 1)}) = ${nbf(d.a, 3)} m/s² ; T = m × (g + a_y) = ${nbm(d.m)} × (9,8 + ${nbf(d.a, 3)}) = ${nbm(d.vrai)} N.`
      : `a_x = frac(${nbf(d.v2, 2)} − ${nbf(d.v1, 2)}|${nbf(d.dt, 1)}) = ${nbf(d.a, 3)} m/s² ; T = m × a_x + f = ${nbf(d.m, 1)} × ${nbf(d.a, 3)} + ${nbf(d.f, 1)} = ${nbf(d.vrai, 2)} N.`;
  };
  const sceneDefi = d => {
    if (d.type === 'acc') return { kind: d.sit, forces: d.forces, valeursDe: d.sit === 'rail' ? ['T', 'f'] : ['T'], alpha: d.alpha || 0, fil: d.sit === 'rail' };
    return d.sit === 'cabine'
      ? { kind: 'cabine', forces: [{ id: 'P', x: 0, y: -d.m * M.G }, { id: 'T', x: 0, y: 1 }], inconnue: 'T', vit: [{ i: '1', y: d.v1, txt: nbf(d.v1, 1) }, { i: '2', y: d.v2, txt: nbf(d.v2, 1) }] }
      : { kind: 'rail', forces: [...M.forcesRail({ m: d.m, T: 0, f: d.f }).filter(f => f.id !== 'T'), { id: 'T', x: 1, y: 0 }], inconnue: 'T', valeursDe: ['f'], fil: true };
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['acc', 'Des forces à l’accélération'], ['forces', 'Du mouvement à la force']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'acc' ? 'Défi : quelle est l’accélération du centre de masse ?' : 'Défi : quelle est la force inconnue ?'}</div>
      <div style={{ ...lbl, marginBottom: 8 }}>{indicesProfond(enonceDefi(defi))}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>{defi.type === 'acc' ? avecIndices(`a_${defi.composante}`) : 'T'} =</span>
        <input value={defi.rep} aria-label="Votre réponse" onKeyDown={e => e.key === 'Enter' && document.getElementById('nw-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false }))} inputMode="decimal"
          style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{defi.type === 'acc' ? 'm/s²' : 'N'}</span>
      </div>
      <IndiceDefi cache={defi.verifie && defi.ok}>{indiceDefi(defi)}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="nw-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {(defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ')}{avecIndices(solutionDefi(defi))}</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Point matériel</strong> : le système (chariot, cabine, parachutiste) est modélisé par son centre de masse G, dont la position est donnée ; on ne traite ni les rotations ni les déformations.</li>
      <li><strong>Référentiel galiléen</strong> : le référentiel terrestre est supposé galiléen pendant la durée de l’étude (quelques secondes) ; la rotation de la Terre est négligée. Un référentiel accéléré (wagon qui démarre) ne l’est pas.</li>
      <li><strong>Forces constantes</strong> pendant l’étude : l’accélération est alors constante et le quotient de Δv par Δt la donne exactement (sinon on n’obtiendrait qu’une valeur moyenne).</li>
      <li><strong>Masse constante</strong> et g = 9,8 m/s² : poids P = m × g. Résultats donnés avec 2 ou 3 chiffres significatifs ; gardez 4 chiffres dans les calculs intermédiaires.</li>
      <li><strong>Chariot</strong> : le fil est supposé de masse négligeable ; les frottements f sont réglés directement, opposés au mouvement (le chariot roule vers la droite) et indépendants de la vitesse ; la résistance de l’air est négligée.</li>
      <li><strong>Cabine et masse suspendue</strong> : la tension est supposée constante pendant l’étude ; la cabine est un solide (occupants compris, masse totale).</li>
      <li><strong>Parachutiste</strong> : le frottement de l’air est réglé directement ; en réalité il dépend de la vitesse (non traité ici).</li>
      <li><strong>Axes</strong> : Ox horizontal vers la droite, Oy vertical vers le haut ; les composantes sont algébriques (le signe donne le sens par rapport à l’axe).</li>
      <li><strong>Hors programme, non traité</strong> : forces d’inertie dans un référentiel non galiléen, moment des forces, systèmes de plusieurs corps.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène affichée selon le mode ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const scGuide = enGuide ? SCENES[idEtape] : null;
  const boxScene = (() => {
    if (enGuide && idEtape === 'galileen') return <div style={{ ...styleBoite, ...cadre('scene') }}><SceneTrain/></div>;
    if (enGuide && !scGuide) return null;
    if (enGuide) {
      return (<div style={{ ...styleBoite, ...cadre('scene') }}>
        <SceneNewton {...scGuide}/>{legende(scGuide.kind, scGuide.forces, scGuide.inconnue)}
      </div>);
    }
    if (dd) { const s = sceneDefi(dd); return (<div style={styleBoite}><SceneNewton {...s}/>{legende(s.kind, s.forces, s.inconnue)}</div>); }
    return (<div style={styleBoite}>
      <div style={aide}>Le schéma montre la situation choisie : les forces sont des flèches tracées depuis le centre de masse G, à l’échelle indiquée en bas.</div>
      <SceneNewton kind={kE} forces={bE.forces} valeursDe={bE.forces.map(f => f.id)} alpha={scE === 'rail' ? ex.alpha : 0} fil={scE === 'rail'}/>{legende(kE, bE.forces, null)}
    </div>);
  })();
  const boxBandeau = (enGuide && scGuide && scGuide.bandeau) ? (
    <div style={{ ...styleBoite, ...cadre('bandeau') }}><div style={aide}>{avecIndices('Σ vec(F) (trait épais) et vec(a)_G (pointillés) : même direction, même sens (longueurs tracées avec des échelles différentes).')}</div>
      <BandeauSomme kind="rail" S={scGuide.bandeau.S} nul={M.estEquilibre(scGuide.bandeau.S, R0.m)}/></div>) : null;

  // ---------- réglages de l'exploration ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const mg = ex.m * M.G;
  const resume = (() => {
    const base = `${nbf(ex.m, ex.m < 10 ? 2 : 0)}${NB}kg`.replace(',00', ',0');
    if (sens === 'forces') return scE === 'rail' ? `${base} · T = ${g1(ex.T)} N · f = ${g1(ex.f)} N · α = ${ex.alpha}°` : scE === 'chute' ? `${base} · f = ${nbm(ex.f)} N` : `${base} · T = ${scE === 'cabine' ? nbm(ex.T) : g1(ex.T)} N`;
    return `${base} · a_${scE === 'rail' ? 'x' : 'y'} = ${nbf(aEff, 2)} m/s²${scE === 'rail' ? ` · f = ${g1(ex.f)} N · α = ${ex.alpha}°` : ''}`;
  })();
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const curseurM = scE === 'rail' ? { min: 1, max: 3, pas: 0.5, d: 1, u: 'kg' } : scE === 'fil' ? { min: 0.2, max: 1, pas: 0.1, d: 1, u: 'kg' } : scE === 'cabine' ? { min: 400, max: 1200, pas: 100, d: 0, u: 'kg' } : { min: 50, max: 100, pas: 5, d: 0, u: 'kg' };
  const changerM = v => {
    if (scE === 'rail' || sens === 'mouvement') setE({ m: v });
    else if (scE === 'chute') setE({ m: v, f: Math.round(v * M.G) });
    else setE({ m: v, T: Math.round(v * M.G * (scE === 'fil' ? 10 : 1)) / (scE === 'fil' ? 10 : 1) });
  };
  const fMin = scE === 'fil' ? Math.max(0, Math.round((mg - 6) * 10) / 10) : scE === 'cabine' ? Math.max(0, Math.round((mg - 1500) / 50) * 50) : 0;
  const fMax = scE === 'fil' ? Math.round((mg + 6) * 10) / 10 : scE === 'cabine' ? Math.round((mg + 1500) / 50) * 50 : Math.round(1.3 * mg / 10) * 10;
  const equilibrer = () => { if (sens === 'mouvement') setE({ a: 0 }); else if (scE === 'rail') setE({ T: ex.f / Math.cos(ex.alpha * Math.PI / 180) }); else if (scE === 'chute') setE({ f: Math.round(mg) }); else setE({ T: Math.round(mg * 100) / 100 }); };
  const reglages = enExplore && (
    <div style={styleBoite} className="nw-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez la situation et le sens du raisonnement ; les flèches du schéma et les mesures suivent.</div>
      <label style={lbSel}>Situation
        <select value={scE} onChange={e => choisirSc(e.target.value)} style={{ ...menu, marginTop: 2 }}>{Object.entries(M.SCEN).map(([id, s]) => <option key={id} value={id}>{s.nom}</option>)}</select></label>
      <label style={lbSel}>Je pars de…
        <select value={sens} onChange={e => setE({ sens: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          <option value="forces">des forces connues</option>
          <option value="mouvement">du mouvement connu</option></select></label>
      <div style={{ ...aide, marginTop: -2 }}>{sens === 'forces' ? 'Forces connues : on cherche l’accélération.' : 'Mouvement connu : on cherche la force inconnue.'}</div>
      <Section titre={avecIndices(`Réglages : ${resume}`)} ouvert={ouv.regl} onBascule={() => setOuv(o => ({ ...o, regl: !o.regl }))}>
        <Curseur nom="Masse m" valeur={ex.m} onChange={changerM} min={curseurM.min} max={curseurM.max} pas={curseurM.pas} unite="kg" decimales={curseurM.d} couleur="#0369a1"/>
        {sens === 'forces' && scE === 'rail' && <Curseur nom="Tension T du fil" valeur={ex.T} onChange={v => setE({ T: v })} min={0} max={10} pas={0.5} unite="N" decimales={1} couleur={'#0369a1'}/>}
        {sens === 'forces' && (scE === 'fil' || scE === 'cabine') && <Curseur nom="Tension T" valeur={Math.min(fMax, Math.max(fMin, ex.T))} onChange={v => setE({ T: v })} min={fMin} max={fMax} pas={scE === 'fil' ? 0.1 : 50} unite="N" decimales={scE === 'fil' ? 1 : 0} couleur="#0369a1"/>}
        {sens === 'forces' && scE === 'chute' && <Curseur nom="Frottement f de l’air" valeur={Math.min(fMax, ex.f)} onChange={v => setE({ f: v })} min={0} max={fMax} pas={10} unite="N" decimales={0} couleur="#b45309"/>}
        {sens === 'mouvement' && <Curseur nom={scE === 'rail' ? 'Accélération a_x (vers la droite)' : 'Accélération a_y (vers le haut)'} valeur={aEff} onChange={v => setE({ a: v })} min={scE === 'rail' ? aMinRail : scE === 'chute' ? -9.8 : scE === 'cabine' ? -2 : -4} max={scE === 'rail' ? 3 : scE === 'chute' ? 3 : scE === 'cabine' ? 2 : 4} pas={scE === 'chute' ? 0.2 : scE === 'rail' ? 0.25 : 0.1} unite="m/s²" decimales={2} couleur="#6d28d9"/>}
        {scE === 'rail' && <Curseur nom="Angle α du fil au-dessus de l’horizontale" valeur={ex.alpha} onChange={v => setE({ alpha: v })} min={0} max={40} pas={5} unite="°" decimales={0} couleur="#0369a1"/>}
        {scE === 'rail' && <Curseur nom="Frottements f (opposés au mouvement)" valeur={ex.f} onChange={v => setE({ f: v })} min={0} max={5} pas={0.5} unite="N" decimales={1} couleur="#b45309"/>}
        <div style={aide}>{avecIndices(sens === 'forces' ? 'Les forces règlent l’accélération : on obtient vec(a)_G en divisant Σ vec(F) par m.' : 'Le mouvement (l’accélération) règle la force inconnue : T ou f se déduit de Σ vec(F) = m vec(a)_G.')}</div>
      </Section>
      <button onClick={equilibrer} style={styleBouton(false)}>Mettre à l’équilibre (a = 0)</button>
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Axes : Ox vers la droite, Oy vers le haut ; les composantes sont algébriques.</div>
      <LigneMesure nom="Composante ΣF_x" valeur={`${nbs(bE.S.x)}${NB}N`} couleur="#0f172a"/>
      <LigneMesure nom="Composante ΣF_y" valeur={`${nbs(bE.S.y)}${NB}N`} couleur="#0f172a"/>
      <LigneMesure nom="Composante a_x" valeur={`${nbs(bE.a.x)}${NB}m/s²`} couleur="#6d28d9"/>
      <LigneMesure nom="Composante a_y" valeur={`${nbs(bE.a.y)}${NB}m/s²`} couleur="#6d28d9"/>
      {bE.forces.filter(f => Math.hypot(f.x, f.y) > 1e-9).map(f => <LigneMesure key={f.id} nom={`Norme ${f.id} de vec(${f.id}) (${nomForce(kE, f.id)})`} valeur={`${nbs(Math.hypot(f.x, f.y))}${NB}N`}/>)}
      <div style={{ fontSize: 13.5, marginTop: 6, padding: '4px 8px', borderRadius: 6, background: equilibre ? '#f0fdf4' : '#fffbeb', border: `1px solid ${equilibre ? '#86efac' : '#fcd34d'}`, color: KIT.txt, lineHeight: 1.5 }}>
        {equilibre ? avecIndices('✓ Σ vec(F) est nulle donc vec(a)_G est nul : le vecteur vitesse ne varie pas (repos ou mouvement rectiligne uniforme).') : avecIndices('Σ vec(F) n’est pas nulle : vec(a)_G a la même direction et le même sens que Σ vec(F), la vitesse varie.')}</div>
    </div>);
  const bandeauEx = enExplore && (<div style={styleBoite}><div style={aide}>{avecIndices('Σ vec(F) (trait épais) et vec(a)_G (pointillés) : même direction, même sens ; les longueurs suivent les valeurs, avec des échelles différentes (N et m/s²).')}</div><BandeauSomme kind={kE} S={bE.S} nul={equilibre}/></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Chariot, T = f : que devient a_G ? Le chariot s’arrête-t-il ? (pensez au principe d’inertie)</li>
        <li>Doublez la masse du chariot sans toucher aux forces : que devient a_x ? Et si vous gardez a_x, comment doit changer T ?</li>
        <li>Incliner le fil (α) : que deviennent ΣF_x et la réaction R du rail ? Pourquoi R diminue-t-elle ?</li>
        <li>Masse suspendue : réglez T pour avoir a_y = 0, puis augmentez T. Dans quel sens va vec(a)_G ? Le poids a-t-il changé ?</li>
        <li>Cabine : partez du mouvement connu avec a_y négatif (freinage en montée) : T est-elle plus grande ou plus petite que le poids ?</li>
        <li>Parachutiste : réglez f = 0 (chute libre), puis mettez à l’équilibre. Que vaut a_G dans chaque cas ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Deuxième loi de Newton, dans un référentiel galiléen : Σ vec(F) = m × vec(a)_G</li>
          <li>vec(a)_G a la même direction et le même sens que Σ vec(F) (m &gt; 0), pas forcément ceux du mouvement</li>
          <li>Projection sur un axe : ΣF_x = m × a_x ; une force opposée à l’axe a une composante négative</li>
          <li>Forces connues : on divise Σ vec(F) par m pour obtenir vec(a)_G ; mouvement connu : vec(a)_G est le quotient de Δvec(v) par Δt, puis Σ vec(F) = m × vec(a)_G</li>
          <li>Σ vec(F) nulle ⇒ vec(a)_G nul : repos ou mouvement rectiligne uniforme (principe d’inertie)</li>
          <li>Référentiel terrestre supposé galiléen pour une étude courte ; un référentiel accéléré ne l’est pas</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .nw-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .nw-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .nw-col { display: flex; flex-direction: column; gap: 12px; }
        .nw-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .nw-l1.cote .nw-carte { order: 2; } .nw-l1.cote .nw-main { order: 1; }
          .nw-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .nw-ex > * { grid-column: 1; } .nw-ex > .nw-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .nw-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .nw-in { animation: nw-fondu 0.35s ease-out; } @keyframes nw-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Deuxième loi de Newton</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>{avecIndices('La somme des forces Σ vec(F) fixe l’accélération du centre de masse : Σ vec(F) = m vec(a)_G. On l’utilise dans les deux sens : des forces vers le mouvement, et du mouvement vers les forces.')}</div>
      {!enExplore && <div className="nw-l1 cote">
        {enGuide ? <div className="nw-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="nw-carte">{panneauHypo}</div> : null}
        <div className="nw-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'acc' ? suiviA : suiviF}/></div>}
          <div className="nw-col">
            {boxScene && <div className="nw-in" key={enGuide ? 's-' + idEtape : 'd'}>{boxScene}</div>}
            {boxBandeau && <div className="nw-in">{boxBandeau}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="nw-ex">
        <div>{boxScene}</div>
        <div className="nw-ctrl">{reglages}</div>
        <div>{bandeauEx}</div>
        <div>{mesures}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilanFin' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
