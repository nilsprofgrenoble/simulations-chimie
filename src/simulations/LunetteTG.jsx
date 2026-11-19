import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./lunetteTGModele";
import { QCM_PARCOURS as Q } from "./lunetteTGQcm";
import { SceneLunetteTG, SvgTrianglesCarte, SvgFicheCarte } from "./LunetteTGSchemas";

const SIM_ID = 171, CLE_GUIDE = 'lunettetg-guide-v1';
declarerDefis(SIM_ID, [['fiche', 'Régler la lunette d’une fiche commerciale'], ['oculaire', 'Choisir l’oculaire pour un grossissement donné']]);

// ====================================================
// SIM 171 — LUNETTE AFOCALE : SCHÉMA, FAISCEAU ÉMERGENT, GROSSISSEMENT
//  (TG spé PC, « Ondes et signaux », partie « Former des images et décrire la lumière par un flux de photons », A) Former des images).
//  Une seule idée : représenter le schéma d'une lunette afocale (objectif, oculaire), le faisceau émergent issu d'un point objet « à l'infini »,
//  établir G = θ′/θ = f′obj/f′oc (petits angles) et exploiter la fiche d'une lunette du commerce.
//  Capacités visées (jamais affichées à l'élève) : représenter le schéma d'une lunette afocale ; représenter le faisceau émergent issu d'un point
//  objet à l'infini ; établir l'expression du grossissement ; exploiter les données d'une lunette commerciale ; (expérimental) vérifier la position de
//  l'image intermédiaire.
//  Différences avec la sim 120 (TSTL, « La lunette astronomique ») : pas de vergence de sortie ni d'œil myope ni de vis fine ; ici on CONSTRUIT le schéma
//  (faisceau parallèle hors axe, image intermédiaire dans le plan focal, faisceau émergent d'angle θ′) et on ÉTABLIT G par deux triangles.
//  Modèle de calcul et de tracé : lunetteTGModele.js (modèle propre, sans rien importer de la sim 120).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const IDS = ['etoile', 'incline', 'oculaire', 'afocal', 'distance', 'theta', 'thetap', 'gexpr', 'gnum', 'thetapnum', 'fiche', 'fiche-g', 'bilan'];
const BLEU = '#0369a1';
const F1E = 300, F2E = 50, TH0 = 0.5;     // lunette d'étude du parcours (G = 6, dessinée à l'échelle) et angle θ de départ

// ---------- MathML ----------
const fObj = <msubsup><mi>f</mi><mtext>obj</mtext><mo>′</mo></msubsup>;
const fOc = <msubsup><mi>f</mi><mtext>oc</mtext><mo>′</mo></msubsup>;
const th = <mi>θ</mi>, thp = <msup><mi>θ</mi><mo>′</mo></msup>;
const A1B1 = <mrow><msub><mi>A</mi><mn>1</mn></msub><msub><mi>B</mi><mn>1</mn></msub></mrow>;
const FO = <FormuleEnLigne>{fObj}</FormuleEnLigne>, FC = <FormuleEnLigne>{fOc}</FormuleEnLigne>;
const FGdef = <Formule><mi>G</mi><mo>=</mo><mfrac>{thp}{th}</mfrac></Formule>;
const FRetenir = <Formule><mi>θ</mi><mo>≈</mo><mfrac>{A1B1}{fObj}</mfrac><mspace width="1.2em"/>{thp}<mo>≈</mo><mfrac>{A1B1}{fOc}</mfrac></Formule>;
const FGfinal = <Formule><mi>G</mi><mo>=</mo><mfrac>{thp}{th}</mfrac><mo>=</mo><mfrac>{fObj}{fOc}</mfrac></Formule>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
// fraction en ligne (vraie barre) ; haut et bas sont des éléments MathML (jamais de « _ » dans un frac(...) de texte)
const mf = (haut, bas) => <mfrac><mrow>{haut}</mrow><mrow>{bas}</mrow></mfrac>;
const fr = (haut, bas) => <FormuleEnLigne>{mf(haut, bas)}</FormuleEnLigne>;
const GRAND = <FormuleEnLigne><mi>G</mi></FormuleEnLigne>;
const TH = <FormuleEnLigne>{th}</FormuleEnLigne>, THP = <FormuleEnLigne>{thp}</FormuleEnLigne>;

// ---------- paramètres du dessin ----------
const { dMin, dMax } = M;
const ariaScene = (f1, f2, d, theta, montre) => `Schéma de la lunette : objectif de distance focale ${f1} millimètres${montre.ocu ? ` et oculaire de ${f2} millimètres, distants de ${d} millimètres` : ''}, avec le faisceau de rayons parallèles issu d'une étoile${montre.incl ? ` hors de l'axe, inclinée de ${nbf(theta, 2)} degré` : ' sur l\'axe'}${montre.ocu ? `. Le faisceau émergent est ${M.natureFaisceau(d, f1, f2)}` : ''}. Dessin déformé verticalement.`;
// indications écrites sous le dessin
const legendeDe = (f1, f2, ocu) => { const g = M.geometrie(f1, f2, M.dAfocal(f1, f2), 0.5); return [`dessin déformé verticalement (angles ×${M.Q_VERT})`, ...(ocu && g.plafonne ? [`rapport des focales dessiné : ${M.G_DESSIN_MAX} (limité)`] : [])]; };

// ---------- cartes « À retenir » ----------
const montreCarteA = { axe: true, foyers: 1 }, montreCarteB = { axe: true, incl: true, foyers: 1, plan: true, image: true, angles: 1 };
const montreCarteC = { incl: true, ocu: true, plan: true, image: true, foyers: 2, angles: 2, ref: true }, montreCarteAfocal = { incl: true, ocu: true, plan: true, image: true, foyers: 2 };
const SceneCarte = ({ montre, aria }) => <SceneLunetteTG f1={F1E} f2={F2E} d={M.dAfocal(F1E, F2E)} theta={TH0} montre={{ ...montre, etiqFoyers: false }} aria={aria} legende={['dessin déformé verticalement', `(angles ×${M.Q_VERT})`]} svgId="carte" carte/>;
const RETENIR = {
  etoile: <>
    <SceneCarte montre={montreCarteA} aria="Objectif et faisceau de rayons parallèles à l’axe issu d’une étoile sur l’axe : les rayons convergent au foyer image F′ de l’objectif"/>
    <ul style={ULS}>
      <li>Une étoile est si loin que ses rayons arrivent <strong>parallèles entre eux</strong> : c’est un objet « à l’infini ».</li>
      <li>Sur l’axe, ils sont parallèles à l’axe et convergent au <strong>foyer image F′</strong> de l’objectif, à la distance {FO} de lui. Exemple : {FO} = 300{NB}mm, F′ est à 300{NB}mm.</li>
      <li><strong>Mémo</strong> : « parallèles à l’axe, ils se croisent au foyer image ». Idée fausse : « ils se croisent sur la lentille ». Vrai : au foyer image F′.</li>
    </ul></>,
  incline: <>
    <SceneCarte montre={montreCarteB} aria="Faisceau incliné de l’angle θ : les rayons parallèles convergent en B1 dans le plan focal image de l’objectif, hors de l’axe ; A1B1 est l’image intermédiaire"/>
    <ul style={ULS}>
      <li>Un faisceau parallèle <strong>incliné de θ</strong> converge en B₁, dans le <strong>plan focal image</strong> (plan perpendiculaire à l’axe qui contient F′).</li>
      <li>Le rayon qui passe par le centre O de l’objectif n’est pas dévié : il donne la direction à tracer. A₁B₁ (avec A₁ en F′) est l’<strong>image intermédiaire</strong> : réelle et renversée.</li>
      <li><strong>Mémo</strong> : « objet à l’infini, image dans le plan focal ». Idée fausse : « l’image se forme toujours sur l’axe ». Vrai : hors de l’axe pour un objet hors de l’axe.</li>
    </ul></>,
  afocal: <>
    <SceneCarte montre={montreCarteAfocal} aria="Lunette afocale : le foyer image de l’objectif coïncide avec le foyer objet de l’oculaire ; les rayons du faisceau émergent sont parallèles entre eux"/>
    <ul style={ULS}>
      <li>Lunette <strong>afocale</strong> : le foyer image F′obj de l’objectif (cercle) coïncide avec le foyer objet Foc de l’oculaire (carré). Donc O₁O₂ = {FO} + {FC}.</li>
      <li>A₁B₁ est dans le plan focal objet de l’oculaire : le faisceau émergent est <strong>parallèle</strong> (rayons parallèles entre eux, inclinés sur l’axe). Exemple : {FO} = 300{NB}mm et {FC} = 50{NB}mm donnent O₁O₂ = 350{NB}mm.</li>
      <li><strong>Mémo</strong> : « les deux foyers se touchent ». Idée fausse : « les deux lentilles se touchent ». Vrai : elles sont distantes de {FO} + {FC}.</li>
    </ul></>,
  gnum: <>
    <SvgTrianglesCarte/>
    {FRetenir}{FGfinal}
    <ul style={ULS}>
      <li>Les deux triangles partagent le côté A₁B₁ (petits angles : angles en radian) : la base la plus courte, {FC}, donne le plus grand angle, donc θ′ &gt; θ.</li>
      <li>Exemple : {FO} = 1000{NB}mm et {FC} = 25{NB}mm donnent G = 40. Le grossissement n’a pas d’unité.</li>
      <li><strong>Mémo</strong> : « G est le rapport de la focale de l’objectif sur celle de l’oculaire ». Idée fausse : « G = {fr(fOc, fObj)} ». Vrai : l’objectif a la plus grande focale, donc G &gt; 1.</li>
    </ul></>,
  fiche: <>
    <SvgFicheCarte/>
    <ul style={ULS}>
      <li>« 70/700 » indique le <strong>diamètre</strong> de l’objectif (70{NB}mm) puis sa <strong>distance focale</strong> {FO} (700{NB}mm). Le diamètre règle la lumière recueillie ; il ne sert pas à calculer G.</li>
      <li>Exemple avec l’oculaire de {FC} = 25{NB}mm : G = <FormuleEnLigne><mfrac><mn>700</mn><mn>25</mn></mfrac></FormuleEnLigne> = 28 et O₁O₂ = 725{NB}mm. Changer d’oculaire change G et O₁O₂.</li>
      <li><strong>Mémo</strong> : « le diamètre donne la lumière ; le rapport des focales, objectif sur oculaire, donne le grossissement ».</li>
    </ul></>,
  bilan: <>
    <SceneCarte montre={montreCarteC} aria="Bilan : lunette afocale, faisceau émergent parallèle incliné de θ prime, rayon issu de B1 passant par O2"/>
    <ul style={ULS}>
      <li><strong>Construire</strong> : faisceau parallèle incliné de θ, image B₁ dans le plan focal image de l’objectif ; afocale : F′obj = Foc, O₁O₂ = {FO} + {FC}.</li>
      <li><strong>Faisceau émergent</strong> : parallèle au rayon issu de B₁ qui passe par O₂, incliné de θ′. Établir G : θ ≈ {fr(A1B1, fObj)} et θ′ ≈ {fr(A1B1, fOc)}, donc <strong>G = {fr(thp, th)} = {fr(fObj, fOc)}</strong>.</li>
      <li>Exemple : {fr(<mn>300</mn>, <mn>50</mn>)} = 6, et θ = 0,50° donne θ′ = 3,0°. Idée fausse : « un grand diamètre grossit plus ». Vrai : il éclaire plus, G dépend des focales.</li>
    </ul></>,
};

const menuStyle = { width: '100%', minHeight: 42, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: '#fff', color: KIT.txt };
const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };

// curseur de distance O1O2 + boutons − / + de 1 mm (1 mm ≈ 2 px : le curseur seul est difficile à régler) ; « depart » : bouton qui rétablit la distance de départ
function ReglageDistance({ valeur, onChange, min, max, depart }) {
  const pas = dx => onChange(Math.max(min, Math.min(max, valeur + dx)));
  return (
    <div>
      <Curseur nom="Distance O₁O₂ entre l’objectif et l’oculaire" valeur={valeur} onChange={onChange} min={min} max={max} pas={1} unite="mm" decimales={0} couleur="#15803d"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => pas(-1)} aria-label="Diminuer la distance de 1 millimètre" style={stylePetitBouton(false, '#15803d')}>− 1 mm</button>
        <button onClick={() => pas(1)} aria-label="Augmenter la distance de 1 millimètre" style={stylePetitBouton(false, '#15803d')}>+ 1 mm</button>
        {depart != null && <button onClick={() => onChange(depart)} style={stylePetitBouton(false, '#475569')}>Rétablir la distance de départ</button>}
      </div>
    </div>);
}

export function SimulationLunetteTG() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviO, noterO] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('fiche');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ affichage: false, essayer: false, retenir: false });
  const [pg, setPg] = useState({ th: TH0, d: M.dAfocal(F1E, F2E) });                                     // parcours : angle θ et distance O1O2
  const [ex, setEx] = useState({ f1: 300, f2: 50, th: TH0, d: M.dAfocal(300, 50), axe: false, foyers: true, angles: true, ref: false });   // exploration
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- valeurs de départ de chaque étape du parcours ----------
  const DEPART = { oculaire: { th: TH0, d: M.dAfocal(F1E, F2E) + 40 }, afocal: { d: M.dAfocal(F1E, F2E) }, theta: { th: TH0, d: M.dAfocal(F1E, F2E) } };
  useEffect(() => {
    if (!enGuide) return;
    const id = IDS[Math.min(guide.etape, IDS.length - 1)];
    const dep = DEPART[id] || (guide.etape >= IDS.indexOf('thetap') ? { th: TH0, d: M.dAfocal(F1E, F2E) } : null);
    if (dep) setPg(p => ({ ...p, ...dep }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  // ---------- paramètres affichés ----------
  const dd = enDefi && defi ? defi : null;
  let f1, f2, d, theta;
  if (enGuide) { f1 = F1E; f2 = F2E; d = pg.d; theta = pg.th; }
  else if (dd) { f1 = dd.f1; f2 = dd.type === 'oculaire' ? (dd.ok ? dd.f2 : Math.max(5, Math.round(dd.f1 / 8))) : dd.f2; d = dd.type === 'oculaire' ? M.dAfocal(dd.f1, f2) : dd.d; theta = TH0; }
  else { f1 = ex.f1; f2 = ex.f2; d = ex.d; theta = ex.th; }
  const afo = M.afocale(d, f1, f2), nature = M.natureFaisceau(d, f1, f2);
  const taille = M.tailleImage(f1, theta), thetaP = M.thetaPrimeDeg(f1, f2, theta), G = M.grossissement(f1, f2);

  // ---------- étapes du parcours ----------
  const ETAPES_BASE = [
    { id: 'etoile', titre: 'Une étoile très lointaine', focus: ['scene'],
      texte: <>Une lunette astronomique commence par une grande lentille mince convergente : l’<strong>objectif</strong>, de distance focale {FO}. Une étoile est si éloignée que les rayons qui en arrivent sont <strong>parallèles entre eux</strong> : on parle d’objet « à l’infini ». Ici, l’étoile est sur l’axe optique (tirets) : ses rayons sont parallèles à l’axe.</>,
      tache: { type: 'qcm', q: 'Après l’objectif, où se croisent ces rayons parallèles à l’axe ?', ...Q.etoile,
        indice: 'Un faisceau de rayons parallèles à l’axe optique converge en un point particulier de l’axe, lié à la distance focale de la lentille.',
        expl: 'Des rayons parallèles à l’axe convergent au foyer image F′ de la lentille, situé sur l’axe à la distance f′ de celle-ci.' } },
    { id: 'incline', titre: 'Une étoile hors de l’axe', focus: ['scene', 'commandes'],
      retenirTitre: 'À RETENIR : OBJET À L’INFINI SUR L’AXE', retenir: RETENIR.etoile,
      texte: <>Une autre étoile est vue dans une direction qui fait un angle <strong>θ</strong> avec l’axe : ses rayons sont encore parallèles entre eux, mais inclinés de θ (trait plein). Choisissez θ dans le menu et observez le nouveau faisceau. Le dessin est déformé verticalement : l’angle θ y est agrandi environ 9 fois.</>,
      tache: { type: 'qcm', q: 'Où se croisent les rayons du faisceau incliné ?', ...Q.incline,
        indice: 'Les rayons sont parallèles entre eux : ils convergent dans un plan perpendiculaire à l’axe, le même que pour le faisceau de l’axe. Un rayon passe par le centre de la lentille sans être dévié : où coupe-t-il ce plan ?',
        expl: 'Un faisceau de rayons parallèles, même incliné, converge dans le plan focal image de la lentille. Il converge en un point B₁ hors de l’axe, alors que le faisceau parallèle à l’axe converge en F′, sur l’axe.' } },
    { id: 'oculaire', titre: 'Ajouter l’oculaire', focus: ['scene', 'commandes'],
      retenirTitre: 'À RETENIR : UN FAISCEAU INCLINÉ CONVERGE DANS LE PLAN FOCAL', retenir: RETENIR.incline,
      texte: <>Le faisceau incliné donne un point B₁ dans le plan focal image (pointillés). Le segment A₁B₁ est l’<strong>image intermédiaire</strong>. Pour l’observer, on ajoute une seconde lentille mince convergente, de petite distance focale {FC} : l’<strong>oculaire</strong>. Réglez la distance O₁O₂ entre les lentilles (curseur, ou boutons − et + pour avancer de 1{NB}mm) pour que le faisceau qui sort de l’oculaire soit formé de <strong>rayons parallèles</strong> : l’œil l’observe alors sans effort.</>,
      tache: { type: 'action', ok: enGuide && afo, consigne: 'Réglez la distance O₁O₂ pour que le faisceau émergent soit parallèle.' } },
    { id: 'afocal', titre: 'Lunette afocale', focus: ['scene'],
      texte: <>Quand le faisceau émergent est parallèle, la lunette est dite <strong>afocale</strong>. Deux points sont maintenant repérés sur le schéma : le foyer image F′obj de l’objectif (cercle) et le foyer objet Foc de l’oculaire (carré). Observez où se trouve l’image intermédiaire A₁B₁ par rapport à l’oculaire.</>,
      tache: { type: 'qcm', q: 'Pourquoi le faisceau qui sort de l’oculaire est-il alors parallèle ?', ...Q.afocal,
        indice: 'Un objet placé dans le plan focal objet d’une lentille donne une image à l’infini, donc un faisceau émergent de rayons parallèles.',
        expl: 'Dans une lunette afocale, le foyer image de l’objectif coïncide avec le foyer objet de l’oculaire : l’image intermédiaire A₁B₁, dans le plan focal image de l’objectif, est aussi dans le plan focal objet de l’oculaire. L’oculaire en donne une image à l’infini : le faisceau émergent est parallèle.' } },
    { id: 'distance', titre: 'Distance entre les lentilles', focus: [],
      texte: <>Une autre lunette afocale a un objectif de distance focale {FO} = 900{NB}mm et un oculaire de distance focale {FC} = 40{NB}mm. Quelle distance O₁O₂ doit séparer les deux lentilles ?</>,
      tache: { type: 'num', q: 'Distance O₁O₂ entre l’objectif et l’oculaire, en mm', unite: 'mm', vrai: 940, tol: 0.005, affiche: v => nbf(v, 0), carnet: 'Distance O₁O₂ de la lunette 900 et 40',
        calcul: () => ['Lunette afocale : le foyer image de l’objectif et le foyer objet de l’oculaire sont confondus.', 'O₁O₂ = O₁F′obj + FocO₂ = f′_obj + f′_oc = 900 + 40 = 940 mm.'],
        pieges: [[860, 'Vous avez soustrait : F′obj est entre O₁ et O₂, la distance O₁O₂ est la somme des deux distances focales.'], [900, 'Vous avez oublié f′_oc : O₁O₂ = f′_obj + f′_oc.'], [22.5, 'Vous avez divisé : une distance entre lentilles s’obtient en additionnant les distances focales.']],
        expl: 'O₁O₂ = f′_obj + f′_oc = 900 + 40 = 940 mm.', indice: 'Les foyers F′obj et Foc sont confondus : O₁O₂ = O₁F′obj + FocO₂, avec O₁F′obj = f′_obj et FocO₂ = f′_oc.' } },
    { id: 'theta', titre: 'L’angle θ dans un triangle', focus: ['scene'],
      retenirTitre: 'À RETENIR : LUNETTE AFOCALE', retenir: RETENIR.afocal,
      texte: <>On revient à la lunette d’étude : {FO} = 300{NB}mm et {FC} = 50{NB}mm, afocale. Le rayon central du faisceau passe par O₁ sans être dévié et atteint B₁. Le triangle O₁A₁B₁ (en orange) est rectangle en A₁ et son angle en O₁ est θ. Avec les petits angles (tan θ ≈ θ, θ en radian), on lit θ dans ce triangle.</>,
      tache: { type: 'qcm', q: 'Quelle expression de θ lit-on dans le triangle O₁A₁B₁ ?', ...Q.theta,
        indice: 'tan θ = frac(côté opposé|côté adjacent). Ici, le côté opposé à θ est A₁B₁ ; le côté adjacent est O₁A₁, de longueur égale à une distance focale.',
        expl: <>tan θ = {fr(A1B1, <mrow><msub><mi>O</mi><mn>1</mn></msub><msub><mi>A</mi><mn>1</mn></msub></mrow>)} avec O₁A₁ = {FO} (A₁ est en F′obj). Pour un petit angle, tan θ ≈ θ, donc θ ≈ {fr(A1B1, fObj)}.</> } },
    { id: 'thetap', titre: 'L’angle θ′ dans l’autre triangle', focus: ['scene'],
      texte: <>Les rayons issus de B₁ traversent l’oculaire. B₁ est dans le plan focal objet de l’oculaire : le rayon qui passe par O₂ n’est pas dévié (pointillés), et tout le faisceau émergent lui est <strong>parallèle</strong>, donc incliné de θ′ sur l’axe. Le triangle O₂A₁B₁ est rectangle en A₁, d’angle θ′ en O₂.</>,
      tache: { type: 'qcm', q: 'Quelle expression de θ′ lit-on dans le triangle O₂A₁B₁ (petits angles) ?', ...Q.thetap,
        indice: 'Même raisonnement que pour θ : tan θ′ = frac(côté opposé|côté adjacent). Le côté adjacent est maintenant O₂A₁, de longueur égale à une distance focale de l’oculaire.',
        expl: <>tan θ′ = {fr(A1B1, <mrow><msub><mi>O</mi><mn>2</mn></msub><msub><mi>A</mi><mn>1</mn></msub></mrow>)} avec O₂A₁ = {FC} (A₁ est en Foc). Pour un petit angle, θ′ ≈ {fr(A1B1, fOc)}.</> } },
    { id: 'gexpr', titre: 'Le grossissement G', focus: ['scene'],
      texte: <>Le <strong>grossissement</strong> compare l’angle θ′ sous lequel on voit l’étoile avec la lunette à l’angle θ sous lequel on la voit à l’œil nu : {FGdef}Remplacez θ et θ′ par leurs expressions : A₁B₁ est la même longueur dans les deux triangles.</>,
      tache: { type: 'qcm', q: 'Que devient G en fonction des distances focales ?', ...Q.gexpr,
        indice: <>{GRAND} = {fr(thp, th)} avec θ′ = {fr(A1B1, fOc)} et θ = {fr(A1B1, fObj)}. Diviser par une fraction revient à multiplier par son inverse.</>,
        expl: <>{GRAND} = {fr(thp, th)} = {fr(mf(A1B1, fOc), mf(A1B1, fObj))} = {fr(fObj, fOc)} : A₁B₁ se simplifie.</> } },
    { id: 'gnum', titre: 'Calcul du grossissement', focus: ['mesures'],
      retenirTitre: 'À RETENIR : ÉTABLIR LE GROSSISSEMENT', retenir: RETENIR.gnum,
      texte: <>Pour la lunette d’étude, {FO} = 300{NB}mm et {FC} = 50{NB}mm. Calculez son grossissement G.</>,
      tache: { type: 'num', q: 'Grossissement G de la lunette d’étude (sans unité)', unite: '', vrai: 6, tol: 0.02, affiche: v => nbf(v, 1), carnet: 'Grossissement G de la lunette d’étude',
        calcul: () => [<>{GRAND} = {fr(fObj, fOc)} = {fr(<mn>300</mn>, <mn>50</mn>)}, les deux distances focales étant dans la même unité (mm).</>, 'G = 6,0 (sans unité).'],
        pieges: [[0.1667, 'Vous avez calculé le rapport inverse (f′_oc sur f′_obj) : l’objectif a la plus grande focale, donc G est supérieur à 1.'], [15000, 'Vous avez multiplié les deux distances focales : G est leur rapport.'], [250, 'Vous avez soustrait : G est le rapport des distances focales, pas leur différence.'], [350, 'Vous avez additionné : 350 mm est la distance O₁O₂, pas le grossissement.']],
        expl: <>{GRAND} = {fr(<mn>300</mn>, <mn>50</mn>)} = 6,0 : l’étoile est vue sous un angle 6 fois plus grand.</>, indice: <>{GRAND} = {fr(fObj, fOc)}, les deux distances focales dans la même unité : le résultat n’a pas d’unité.</> } },
    { id: 'thetapnum', titre: 'L’angle du faisceau émergent', focus: ['scene', 'mesures'],
      texte: <>Pour la lunette d’étude, G = 6,0. À l’œil nu, l’étoile est vue sous l’angle θ = 0,50°. Sous quel angle θ′ voit-on le faisceau émergent ?</>,
      tache: { type: 'num', q: 'Angle θ′ du faisceau émergent, en degrés', unite: '°', vrai: 3, tol: 0.03, affiche: v => nbf(v, 1), carnet: 'Angle θ′ du faisceau émergent (lunette d’étude)',
        calcul: () => [<>{GRAND} = {fr(thp, th)} donc θ′ = G × θ.</>, 'θ′ = 6,0 × 0,50° = 3,0° (pas besoin de convertir en radian : G est un rapport).'],
        pieges: [[0.0833, 'Vous avez divisé θ par G : θ′ = G × θ, puisque la lunette agrandit l’angle.'], [6.5, 'Vous avez additionné : θ′ = G × θ, pas G + θ.'], [0.052, 'Valeur de θ′ en radian : l’énoncé demande des degrés (3,0° ≈ 0,052 rad).'], [0.5, 'C’est l’angle à l’œil nu θ : le faisceau émergent est incliné de θ′ = G × θ.']],
        expl: 'θ′ = G × θ = 6,0 × 0,50° = 3,0°.', indice: <>{GRAND} = {fr(thp, th)}, donc θ′ = G × θ. Le résultat s’exprime dans la même unité que θ.</> } },
    { id: 'fiche', titre: 'Lire la fiche d’une lunette', focus: ['fiche'],
      texte: <>Une lunette du commerce porte l’indication « 70/700 ». Elle est livrée avec deux oculaires, de distances focales 25{NB}mm et 10{NB}mm.</>,
      tache: { type: 'qcm', q: 'Que signifient les nombres 70 et 700 ?', ...Q.fiche,
        indice: 'Un objectif est une grande lentille, mais son diamètre est bien plus petit que sa distance focale.',
        expl: '70/700 : diamètre de l’objectif (70 mm) puis distance focale de l’objectif (700 mm). Le diamètre n’intervient pas dans le grossissement.' } },
    { id: 'fiche-g', titre: 'Grossissement avec un oculaire donné', focus: ['fiche'],
      retenirTitre: 'À RETENIR : LIRE LA FICHE D’UNE LUNETTE', retenir: RETENIR.fiche,
      texte: <>La lunette 70/700 a un objectif de distance focale {FO} = 700{NB}mm. On la munit de l’oculaire de {FC} = 10{NB}mm. Calculez son grossissement.</>,
      tache: { type: 'num', q: 'Grossissement G de la lunette avec l’oculaire de 10 mm (sans unité)', unite: '', vrai: 70, tol: 0.02, affiche: v => nbf(v, 0), carnet: 'Grossissement de la lunette 70/700 (oculaire de 10 mm)',
        calcul: () => [<>{GRAND} = {fr(fObj, fOc)} = {fr(<mn>700</mn>, <mn>10</mn>)}, avec les deux distances focales en mm.</>, 'G = 70 (le diamètre de 70 mm n’intervient pas).'],
        pieges: [[7, 'Vous avez utilisé le diamètre de l’objectif (70 mm) au lieu de sa distance focale (700 mm).'], [0.0143, 'Vous avez calculé le rapport inverse (f′_oc sur f′_obj) : G est le rapport de la focale de l’objectif sur celle de l’oculaire.'], [7000, 'Vous avez multiplié les deux distances focales : G est leur rapport.'], [710, 'Vous avez additionné : 710 mm est la distance O₁O₂, pas le grossissement.']],
        expl: <>{GRAND} = {fr(<mn>700</mn>, <mn>10</mn>)} = 70 : avec l’oculaire de 10 mm, le grossissement est de 70.</>, indice: <>{GRAND} = {fr(fObj, fOc)}. L’objectif a pour distance focale 700 mm (le premier nombre de la fiche est un diamètre).</> } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : LA LUNETTE AFOCALE', retenir: RETENIR.bilan,
      texte: <>Vous savez construire le schéma d’une lunette afocale et son faisceau émergent, établir {GRAND} = {fr(thp, th)} = {fr(fObj, fOc)} et exploiter la fiche d’une lunette du commerce. Passez à l’exploration (menus d’objectif et d’oculaire, angle, mesure de G) puis aux défis.</>,
      tache: null },
  ];
  // retour ciblé (selon l'option choisie) sous le texte de l'étape, après une mauvaise réponse à un QCM
  const ETAPES = ETAPES_BASE.map((et, i) => {
    const t = et.tache;
    if (!t || t.type !== 'qcm' || !t.retours || !enGuide) return et;
    const rep = guide.reps ? guide.reps[i] : undefined, msg = guide.verifs && guide.verifs[i] && Number.isInteger(rep) && rep !== t.bonne ? t.retours[rep] : null;
    return msg ? { ...et, texte: <>{et.texte}<div role="status" style={{ marginTop: 8, fontSize: 14, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '6px 8px' }}><strong>À propos de votre choix : </strong>{avecIndices(msg)}</div></> } : et;
  });
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'fiche') { const t = M.tirageFiche(), e0 = Math.round(t.f2 * (Math.random() < 0.5 ? -0.5 : 0.9)); setDefi({ type, ...t, d: t.f1 + t.f2 + e0, rep: '', verifie: false, essais: 0 }); }
    else { const t = M.tirageOculaire(); setDefi({ type, ...t, rep: '', verifie: false, ok: false, essais: 0 }); }
  };
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const verifier = () => {
    const x = lireNombre(defi.rep);
    if (defi.type === 'fiche') {
      const ok1 = M.afocale(defi.d, defi.f1, defi.f2), ok2 = isFinite(x) && proche(x, defi.G, M.TOL_G), ok = ok1 && ok2;
      setDefi(s => ({ ...s, verifie: true, ok, ok1, ok2, essais: ok ? s.essais : s.essais + 1 })); noterF(ok);
    } else {
      const ok = isFinite(x) && proche(x, defi.f2, M.TOL_F2);
      setDefi(s => ({ ...s, verifie: true, ok, essais: ok ? s.essais : s.essais + 1 })); noterO(ok);
    }
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{avecIndices(label)}</span>
      <input value={defi.rep} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('lt-verif')?.click()} onChange={e => setDefi(s => ({ ...s, rep: e.target.value, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['fiche', 'Fiche d’une lunette'], ['oculaire', 'Choisir l’oculaire']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'fiche' ? 'Défi : régler la lunette de la fiche et trouver son grossissement' : 'Défi : quel oculaire pour ce grossissement ?'}</div>
      {defi.type === 'fiche' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Fiche d’une lunette du commerce : <strong>« {defi.D}/{defi.f1} »</strong>, livrée avec un oculaire de distance focale <strong>{FC} = {defi.f2}{NB}mm</strong>. (1) Réglez la distance O₁O₂ pour que la lunette soit afocale. (2) Donnez son grossissement G, avec 2 chiffres significatifs (marge acceptée : 5{NB}%).</div>
        <ReglageDistance valeur={defi.d} onChange={x => setDefi(s => ({ ...s, d: x, verifie: false }))} min={dMin(defi.f1, defi.f2)} max={dMax(defi.f1, defi.f2)}/>
        <IndiceDefi cache={defi.ok}>Lunette afocale : le foyer image de l’objectif coïncide avec le foyer objet de l’oculaire, donc O₁O₂ = f′_obj + f′_oc (même unité) : le faisceau émergent doit être parallèle.</IndiceDefi>
        <div style={{ marginTop: 8 }}>{champ('(2) Grossissement G =', '')}</div>
        <IndiceDefi cache={defi.ok}>{GRAND} = {fr(thp, th)} = {fr(fObj, fOc)}. Dans « D/f′ », le premier nombre est le diamètre de l’objectif ; c’est le second qui est sa distance focale.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>L’objectif d’une lunette a pour distance focale <strong>{FO} = {defi.f1}{NB}mm</strong>. On veut un grossissement <strong>G = {defi.G}</strong>. Quelle distance focale {FC} (en mm) doit avoir l’oculaire ? (marge acceptée : 5{NB}%).</div>
        {champ('Distance focale de l’oculaire f′_oc =', 'mm')}
        <IndiceDefi cache={defi.ok}>{GRAND} = {fr(fObj, fOc)} : isolez f′_oc, avec f′_obj en mm. L’oculaire a la plus petite distance focale des deux lentilles.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="lt-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'fiche'
          ? <>{defi.ok1 ? '✓ Distance : la lunette est afocale.' : '✗ Distance : la lunette n’est pas afocale, le faisceau émergent n’est pas parallèle.'}<br/>{defi.ok2 ? '✓ Grossissement correct.' : '✗ Grossissement : revoyez la relation entre G et les distances focales.'}
              {(defi.ok || defi.essais >= 2) && <><br/>{avecIndices(`Valeurs : O₁O₂ = f′_obj + f′_oc = ${defi.f1 + defi.f2} mm ; G = frac(${defi.f1}|${defi.f2}) = ${nbf(defi.G, defi.G % 1 ? 1 : 0)}.`)}</>}</>
          : <>{defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}{defi.ok || defi.essais >= 2
              ? <>{FC} = {fr(fObj, <mi>G</mi>)} = {fr(<mn>{defi.f1}</mn>, <mn>{defi.G}</mn>)} = {defi.f2} mm.</> : 'Isolez f′oc dans la relation entre G et les distances focales, puis vérifiez à nouveau (l’indice peut vous aider).'}</>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Lentilles minces, conditions de Gauss</strong> : l’objectif et l’oculaire sont deux lentilles minces convergentes, lumière monochromatique. Les vrais objectifs et oculaires sont des associations de lentilles ; défauts (aberrations) et diffraction ne sont pas modélisés.</li>
      <li><strong>Objet très éloigné</strong> : un astre est « à l’infini ». Un point sur l’axe envoie des rayons parallèles à l’axe ; un point hors de l’axe, vu sous l’angle θ, envoie des rayons parallèles inclinés de θ.</li>
      <li><strong>Petits angles</strong> : tan θ ≈ θ (θ en radian). On pose alors A₁B₁ = f′_obj × θ, θ′ = {fr(A1B1, fOc)} et G = {fr(thp, th)} = {fr(fObj, fOc)}. Cette approximation devient peu fiable quand θ′ dépasse une vingtaine de degrés : l’exploration affiche alors le grossissement exact (calculé avec les tangentes) et l’écart avec le rapport des focales.</li>
      <li><strong>Signes</strong> : θ et θ′ sont des mesures d’angle positives. L’image vue dans la lunette est renversée (le grossissement algébrique est négatif) : ce point n’est pas traité ici.</li>
      <li><strong>Lunette afocale</strong> : F′obj et Foc confondus, donc O₁O₂ = f′_obj + f′_oc. Le curseur avance par pas de 1 mm : on considère le faisceau parallèle à 2 mm près (au-delà, il est dessiné convergent ou divergent). Si la distance est différente, le faisceau émergent est convergent ou divergent.</li>
      <li><strong>Valeurs</strong> : les angles θ proposés (0,2° à 1°) sont de l’ordre de grandeur du diamètre apparent de la Lune (0,5°) ; les focales et les fiches « D/f′ » (70/700…) sont des ordres de grandeur typiques de lunettes d’amateur, pas des données d’un constructeur. L’œil, supposé au repos (observation à l’infini), n’est pas modélisé.</li>
      <li><strong>Dessin</strong> : tracé de rayons exact pour une lunette dont les focales sont dessinées dans le rapport G, mais le rapport est limité à 6 pour que l’oculaire reste lisible (une indication le signale). Les angles sont <strong>agrandis verticalement d’un facteur 9</strong> : les foyers, les plans focaux et le rapport des tangentes (donc G) sont conservés, pas les angles eux-mêmes ni l’échelle verticale.</li>
      <li><strong>Hors périmètre</strong> : luminosité (diamètre de l’objectif), résolution, champ, lunette de Galilée et télescope ne sont pas traités ici.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  let montre;
  if (enGuide) {
    montre = { noms: true, axe: idx <= 1, incl: idx >= 1, ocu: idx >= 2, plan: idx >= 2, image: idx >= 2, foyers: idx === 1 ? 1 : idx >= 3 ? 2 : 0,
      tri: idx === 5 ? 1 : idx === 6 ? 2 : 0, etiqFoyers: !(idx === 5 || idx === 6), attenue: idx === 5 || idx === 6, angles: idx >= 7 ? 2 : idx === 6 ? 2 : idx === 5 ? 1 : 0, ref: idx === 6 };
  } else if (dd) {
    montre = dd.type === 'fiche' ? { incl: true, ocu: true, plan: true, image: true } : { incl: true, plan: true, image: true, ocu: dd.ok, foyers: dd.ok ? 2 : 0 };
  } else montre = { axe: ex.axe, incl: true, ocu: true, plan: ex.foyers, image: true, foyers: ex.foyers ? 2 : 0, angles: ex.angles ? 2 : 0, ref: ex.ref };
  const leg = montre.incl ? legendeDe(f1, f2, montre.ocu && !(dd && dd.type === 'oculaire' && !dd.ok)) : [];
  const scene = <SceneLunetteTG f1={f1} f2={f2} d={d} theta={theta} montre={montre} aria={ariaScene(f1, f2, d, theta, montre)} legende={leg}/>;
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Une étoile très lointaine envoie des rayons parallèles. Réglez la lunette et suivez le faisceau jusqu’à l’œil.</div>}
      {dd && <div style={aide}>{dd.type === 'fiche' ? 'Le faisceau émergent est ' + nature + '.' : 'Seul l’objectif est dessiné : l’oculaire apparaît quand le défi est réussi.'}</div>}
      {scene}
    </div>);

  // ---------- commandes du parcours ----------
  const surFiche = enGuide && (idx === 10 || idx === 11);
  const boxFiche = surFiche && (
    <div style={{ ...styleBoite, ...cadre('fiche') }}>
      <div style={titreCarte}>Fiche de la lunette</div>
      <div style={{ fontSize: 16, color: KIT.txt, lineHeight: 1.7 }}>Lunette du commerce : <strong>« 70/700 »</strong><br/>Oculaires livrés : <strong>25{NB}mm</strong> et <strong>10{NB}mm</strong></div>
      <div style={aide}>Pas de schéma ici : cette lunette n’est pas la lunette d’étude.</div>
    </div>);
  const boxCommandes = enGuide && !surFiche && deja('incline') && (
    <div style={{ ...styleBoite, ...cadre('commandes') }}>
      <div style={titreCarte}>Réglages</div>
      <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>Angle θ de l’étoile hors axe
        <select value={pg.th} onChange={e => setPg(p => ({ ...p, th: Number(e.target.value) }))} style={{ ...menuStyle, marginTop: 2 }} aria-label="Angle θ de l’étoile hors axe">
          {M.THETAS.map(t => <option key={t} value={t}>{nbf(t, 2)} °</option>)}
        </select>
      </label>
      {deja('oculaire') && <ReglageDistance valeur={pg.d} onChange={x => setPg(p => ({ ...p, d: x }))} min={dMin(F1E, F2E)} max={dMax(F1E, F2E)} depart={idx === 2 ? DEPART.oculaire.d : undefined}/>}
    </div>);

  // ---------- mesures du parcours ----------
  const lignesGuide = [
    ['Objectif f′_obj', `${nbf(f1, 0)}${NB}mm`, null], ['Oculaire f′_oc', `${nbf(f2, 0)}${NB}mm`, null], ['Distance O₁O₂', `${nbf(d, 0)}${NB}mm`, null],
    ['Angle θ de l’étoile', `${nbf(theta, 2)}${NB}°`, null], ['Faisceau émergent', nature, afo ? '#15803d' : '#b91c1c'],
  ];
  if (deja('theta')) lignesGuide.push(['Image intermédiaire A₁B₁', `${nbf(taille, 1)}${NB}mm`, '#b45309']);
  if (apres('gnum')) lignesGuide.push(['Grossissement G = frac(θ′|θ)', afo ? nbf(G, 1) : 'à régler (afocale)', '#b45309']);
  if (apres('thetapnum')) lignesGuide.push(['Angle θ′ du faisceau émergent', afo ? `${nbf(thetaP, 1)}${NB}°` : 'à régler (afocale)', '#7c3aed']);
  const boxMesuresGuide = enGuide && !surFiche && deja('oculaire') && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Mesures</div>
      {lignesGuide.map(([n, v, c]) => <LigneMesure key={n} nom={n} valeur={v} couleur={c || undefined}/>)}
    </div>);

  // ---------- exploration ----------
  const majEx = patch => setEx(s => { const n = { ...s, ...patch }; return { ...n, d: Math.max(dMin(n.f1, n.f2), Math.min(dMax(n.f1, n.f2), n.d)) }; });
  const valable = M.petitsAnglesValables(ex.f1, ex.f2, ex.th), ecartPA = M.ecartPetitsAngles(ex.f1, ex.f2, ex.th);
  const exAfo = M.afocale(ex.d, ex.f1, ex.f2);
  const reglagesEx = (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez les deux lentilles et l’angle de l’étoile, puis réglez la distance entre elles jusqu’à ce que le faisceau émergent soit parallèle.</div>
      <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>Objectif : distance focale f′<sub>obj</sub>
        <select value={ex.f1} onChange={e => majEx({ f1: Number(e.target.value) })} style={{ ...menuStyle, marginTop: 2 }}>{M.OBJECTIFS.map(v => <option key={v} value={v}>{v} mm</option>)}</select></label>
      <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>Oculaire : distance focale f′<sub>oc</sub>
        <select value={ex.f2} onChange={e => majEx({ f2: Number(e.target.value) })} style={{ ...menuStyle, marginTop: 2 }}>{M.OCULAIRES.map(v => <option key={v} value={v}>{v} mm</option>)}</select></label>
      <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>Angle θ de l’étoile hors axe
        <select value={ex.th} onChange={e => majEx({ th: Number(e.target.value) })} style={{ ...menuStyle, marginTop: 2 }}>{M.THETAS.map(v => <option key={v} value={v}>{nbf(v, 2)} °</option>)}</select></label>
      <ReglageDistance valeur={ex.d} onChange={x => majEx({ d: x })} min={dMin(ex.f1, ex.f2)} max={dMax(ex.f1, ex.f2)}/>
      <div style={{ marginBottom: 8 }}><button onClick={() => majEx({ d: M.dAfocal(ex.f1, ex.f2) })} style={styleBouton(false)}>Mise au point (lunette afocale)</button></div>
      <Section titre="Affichage du schéma" ouvert={ouv.affichage} onBascule={() => setOuv(o => ({ ...o, affichage: !o.affichage }))}>
        {[['axe', 'Ajouter le faisceau d’une étoile sur l’axe (tirets)'], ['foyers', 'Repérer les foyers et le plan focal image'], ['angles', 'Marquer les angles θ et θ′'], ['ref', 'Tracer le rayon issu de B₁ qui passe par O₂ (pointillés)']].map(([k, l]) => (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: KIT.txt, marginBottom: 6, minHeight: 28, cursor: 'pointer' }}><input type="checkbox" checked={ex[k]} onChange={e => setEx(s => ({ ...s, [k]: e.target.checked }))}/>{l}</label>))}
      </Section>
    </div>);
  const mesuresEx = (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Le grossissement se mesure avec les deux angles, une fois la lunette afocale.</div>
      <LigneMesure nom="Distance O₁O₂" valeur={`${nbf(ex.d, 0)}${NB}mm`}/>
      <LigneMesure nom="Écart à la lunette afocale" valeur={`${nbf(M.ecart(ex.d, ex.f1, ex.f2), 0)}${NB}mm`} couleur={exAfo ? '#15803d' : '#b91c1c'}/>
      <LigneMesure nom="Faisceau émergent" valeur={M.natureFaisceau(ex.d, ex.f1, ex.f2)} couleur={exAfo ? '#15803d' : '#b91c1c'}/>
      <LigneMesure nom="Image intermédiaire A₁B₁" valeur={`${nbf(M.tailleImage(ex.f1, ex.th), 2)}${NB}mm`} couleur="#b45309"/>
      <LigneMesure nom="Position de A₁B₁ (depuis l’objectif)" valeur={`${nbf(ex.f1, 0)}${NB}mm`} couleur="#b45309"/>
      <LigneMesure nom="Angle θ (à l’œil nu)" valeur={`${nbf(ex.th, 2)}${NB}°`}/>
      <LigneMesure nom="Angle θ′ (petits angles)" valeur={exAfo ? `${nbf(M.thetaPrimeDeg(ex.f1, ex.f2, ex.th), 1)}${NB}°${valable ? '' : `${NB}(hors petits angles)`}` : 'lunette à régler'} couleur={exAfo && !valable ? '#b91c1c' : '#7c3aed'}/>
      <LigneMesure nom="Angle θ′ exact (tangentes)" valeur={exAfo ? `${nbf(M.thetaPrimeExacteDeg(ex.f1, ex.f2, ex.th), 1)}${NB}°` : 'lunette à régler'} couleur="#7c3aed"/>
      <LigneMesure nom="Grossissement mesuré frac(θ′|θ)" valeur={exAfo ? nbf(M.grossissementExact(ex.f1, ex.f2, ex.th), 1) : 'lunette à régler'} couleur="#b45309"/>
      <LigneMesure nom={<>Rapport {fr(fObj, fOc)}</>} valeur={nbf(M.grossissement(ex.f1, ex.f2), 1)} couleur="#b45309"/>
      <LigneMesure nom="Petits angles" valeur={valable ? 'valables' : 'hors validité'} couleur={valable ? '#15803d' : '#b91c1c'}/>
      <LigneMesure nom="Écart des deux grossissements" valeur={`${nbf(ecartPA * 100, valable ? 1 : 0)}${NB}%`} couleur={valable ? '#15803d' : '#b91c1c'}/>
      {!valable && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6, lineHeight: 1.5 }}>Hors petits angles : θ′ dépasse 20°, donc tan θ′ ≈ θ′ n’est plus fiable. Le grossissement mesuré s’écarte du rapport des focales.</div>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Faites la mise au point : où est l’image intermédiaire A₁B₁ par rapport à F′obj et à Foc ?</li>
        <li>Changez d’oculaire sans toucher à la distance O₁O₂ : le faisceau reste-t-il parallèle ? De combien faut-il corriger O₁O₂ ?</li>
        <li>Comparez le grossissement mesuré {fr(thp, th)} et le rapport {fr(fObj, fOc)} pour θ = 0,2° puis θ = 1°, avec f′_obj = 700 mm et f′_oc = 10 mm : que se passe-t-il ?</li>
        <li>Pour quelle combinaison d’objectif et d’oculaire le grossissement est-il le plus grand ? le plus petit ?</li>
        <li>Mêmes focales, angle θ plus grand : comment changent A₁B₁ et θ′ ? Et G ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Objet à l’infini : rayons parallèles ; sur l’axe, ils convergent en F′ ; inclinés de θ, ils convergent en B₁ dans le plan focal image</li>
          <li>Lunette afocale : F′obj = Foc, O₁O₂ = f′_obj + f′_oc, faisceau émergent parallèle, incliné de θ′</li>
          <li>Petits angles : θ ≈ {fr(A1B1, fObj)} et θ′ ≈ {fr(A1B1, fOc)}</li>
          <li>Grossissement : {GRAND} = {fr(thp, th)} = {fr(fObj, fOc)}, sans unité</li>
          <li>Fiche « D/f′ » : diamètre puis distance focale de l’objectif ; le diamètre ne change pas G</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .lt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .lt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .lt-col { display: flex; flex-direction: column; gap: 12px; }
        .lt-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .lt-l1.cote .lt-carte { order: 2; } .lt-l1.cote .lt-main { order: 1; }
          .lt-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .lt-ex > * { grid-column: 1; } .lt-ex > .lt-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .lt-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .lt-in { animation: lt-fondu 0.35s ease-out; } @keyframes lt-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Lunette afocale : schéma, faisceau émergent, grossissement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Comment une lunette astronomique grossit-elle un astre lointain ? Construisez le schéma d’une lunette <strong>afocale</strong>, suivez le <strong>faisceau émergent</strong> et établissez son <strong>grossissement</strong>.</div>
      {!enExplore && <div className="lt-l1 cote">
        {enGuide ? <div className="lt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="lt-carte">{panneauHypo}</div> : null}
        <div className="lt-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'fiche' ? suiviF : suiviO}/></div>}
          <div className="lt-col">
            {boxFiche && <div className="lt-in">{boxFiche}</div>}
            {(!enDefi || defi) && !surFiche && <div className="lt-in">{boxScene}</div>}
            {boxCommandes && <div className="lt-in">{boxCommandes}</div>}
            {boxMesuresGuide && <div className="lt-in">{boxMesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="lt-ex">
        <div>{boxScene}</div>
        <div className="lt-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
