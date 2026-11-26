import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, Formule, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./hookModele";
import { QCM } from "./hookQcm";
import { SceneRessort, SceneSpectreIR, SvgCarteHooke, SvgCarteZones, SvgCarteBilanIR } from "./HookSchemas";
import { SceneMolecule, BarreAnim } from "./HookAnim";
import { reduitMouvement } from "./hookHorloge";
import * as H from "./hookModes";
import { SceneCuveIR, SceneSpectreTir, PanneauScenariosIR, CommandesTiragesIR } from "./HookTirages";
import { useTiragesIR } from "./hookTiragesHook";
import { useProgres } from "./frxTiragesHook";
import { legendePhase, scenarioVisible, evenementDemo, scenario, texteEvenement, indice as indiceT, estimee, probaTransmis } from "./hookTirages";

const SIM_ID = 304, CLE_GUIDE = 'ir-guide-v1';
declarerDefis(SIM_ID, [['hooke', 'Du ressort au nombre d’onde'], ['bande', 'Attribuer une bande']]);

// ====================================================
//  SIM 304 — INFRAROUGE : DE LA LIAISON-RESSORT AU SPECTRE (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : relier le nombre d'onde d'une bande d'absorption IR à la nature de la liaison (loi de Hooke :
//  rigidité, masses), à la conjugaison et à la liaison hydrogène ; lire un spectre IR (zone des groupes caractéristiques, zone d'empreinte).
//  Modèle : hookModele.js. Schémas : HookSchemas.jsx.
// ====================================================

const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = '\u00a0';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const sci = (v, d = 2) => { const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e; return `${fr(m, d)}·10${String(e).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`; };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['ressort', 'mu', 'hooke', 'masse', 'multiplicite', 'conjugaison', 'hydrogene', 'lecture', 'zones', 'co2', 'bilan'];
const BASE = { k: 500, choix: '', modeCO2: 'antisym' };
const DEPART = { ressort: { k: 500 }, lecture: { choix: '' } };
const arrondi3 = v => Number(Number(v).toPrecision(3));
const num2 = s => parseFloat(String(s).replace(/\s|\u00a0/g, '').replace(',', '.').replace('−', '-'));
const fsig = s => `${Math.round(s)}${NB}cm⁻¹`;
const MU_CH = M.masseReduite(12, 1), MU_CO_KG = 1.14e-26, S_CO = M.sigmaDeMuKg(1200, MU_CO_KG);
const OMEGA = Math.sqrt(1200 / MU_CO_KG);
const Fh = <Formule><mi>σ</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><mi>π</mi><mi>c</mi></mrow></mfrac><msqrt><mfrac><mi>k</mi><mi>μ</mi></mfrac></msqrt></Formule>;
const Fmu = <FormuleEnLigne><mi>μ</mi><mo>=</mo><mfrac><mrow><msub><mi>m</mi><mn>1</mn></msub><mo>·</mo><msub><mi>m</mi><mn>2</mn></msub></mrow><mrow><msub><mi>m</mi><mn>1</mn></msub><mo>+</mo><msub><mi>m</mi><mn>2</mn></msub></mrow></mfrac></FormuleEnLigne>;
const BANDES_TROIS = [{ sigma: 1000, larg: 40, prof: 0.7 }, { sigma: 1650, larg: 30, prof: 0.7 }, { sigma: 2200, larg: 28, prof: 0.7 }];
const BANDES_MASSE = [{ sigma: 1000, larg: 40, prof: 0.7 }, { sigma: 2950, larg: 45, prof: 0.7 }];
const BANDES_LECT = M.MOLECULES.propanone.bandes;

export function SimulationInfrarouge() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState({ onglet: 'liaison', liaison: 'CO2', k: 1200, mol: 'propanone', sous: 'schema', bande: 0, x: 0, mol2: 'H2O', mode2: 'sym' });
  const [anime, setAnime] = useState(() => !reduitMouvement());
  const tir = useTiragesIR();
  const demoEv = tir.demo ? evenementDemo(tir.demo.sc, tir.mol) : null;
  const progAuto = useProgres(tir.demo ? 1000000 + tir.demo.cle : tir.t.etat.nEnv * 1000 + tir.rejeu % 1000, tir.demo ? tir.dureeDemo : tir.dureeAnim, tir.demo ? !reduitMouvement() : tir.anime);
  const progT = tir.manuel ?? progAuto, lotT = !demoEv && tir.t.etat.lot > 1;
  const dAff = demoEv ?? (lotT ? null : tir.t.etat.dernier), pAff = lotT ? 1 : progT;
  const [ouv, setOuv] = useState({});
  const [suiviH, noterH] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('hooke');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'ressort', titre: 'Une liaison est un ressort', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Dans une molécule, les atomes vibrent autour de leur position d’équilibre, comme deux masses reliées par un <strong>ressort</strong>. La « raideur » <strong>k</strong> du ressort (en N/m) mesure la rigidité de la liaison. Déplacez le curseur de raideur : le ressort oscille plus ou moins vite (animation ralentie) et la bande d’absorption se déplace sur le spectre. La fréquence de vibration ν et le nombre d’onde σ sont proportionnels : ν = c·σ.</>,
      tache: { type: 'qcm', q: 'Quand la liaison devient plus rigide (k augmente), le nombre d’onde de sa bande…', ...QCM.ressort,
        expl: 'Un ressort plus raide oscille plus vite : la fréquence de vibration augmente, donc le nombre d’onde σ aussi.', indice: 'Déplacez le curseur vers la droite : regardez la vitesse du ressort et la ligne « Nombre d’onde ».' } },
    { id: 'mu', titre: 'La masse réduite', focus: ['scene'],
      texte: <>Deux atomes de masses m₁ et m₂ vibrent comme une seule masse effective, la <strong>masse réduite</strong> {Fmu}. Ici la liaison C–H : m(C) = 12{NB}u et m(H) = 1{NB}u.</>,
      tache: { type: 'num', q: 'Masse réduite μ de la liaison C–H', unite: 'u', vrai: arrondi3(MU_CH), tol: 0.05, affiche: v => fr(v, 2), cs: 3,
        calcul: () => [`μ = (12 × 1) / (12 + 1) = 12 / 13 ≈ ${fr(MU_CH, 2)} u.`, 'La masse réduite est toujours plus petite que la plus légère des deux masses : ici elle est proche de celle de l’hydrogène.'],
        pieges: [[6.5, 'Vous avez fait la moyenne des deux masses : la formule est le produit divisé par la somme.'], [13, 'Vous avez donné la somme des masses : il faut le produit divisé par la somme.'], [12, 'Vous avez donné le produit sans diviser par la somme des masses.']],
        expl: 'μ = m₁·m₂ / (m₁ + m₂) = 12 / 13 ≈ 0,92 u. Un atome très léger comme H impose sa masse : μ est proche de 1 u.', indice: 'Produit des masses divisé par leur somme.' } },
    { id: 'hooke', titre: 'La loi de Hooke', retenirTitre: 'À retenir : la loi de Hooke', retenir: <SvgCarteHooke/>, focus: ['scene'],
      texte: <>Le nombre d’onde de la bande est donné par {Fh} avec k en N/m, μ en kg, c = 3,00·10⁸{NB}m/s, σ en cm⁻¹ (1{NB}m⁻¹ = 10⁻²{NB}cm⁻¹). Liaison <strong>C=O</strong> : k = 1200{NB}N/m et μ = 1,14·10⁻²⁶{NB}kg.</>,
      tache: { type: 'num', q: 'Nombre d’onde σ de la bande C=O', unite: 'cm⁻¹', vrai: arrondi3(S_CO), tol: 0.05, affiche: v => String(Math.round(v)), cs: 3,
        calcul: () => [`√(k/μ) = √(1200 / 1,14·10⁻²⁶) = ${sci(OMEGA)} rad/s.`, `σ = ${sci(OMEGA)} / (2π × 3,00·10⁸) = ${sci(OMEGA / (2 * Math.PI * 3e8))} m⁻¹ = ${fr(S_CO, 0)} cm⁻¹.`, 'Hypothèse : oscillateur harmonique. La valeur tabulée (1715 cm⁻¹) est proche : le modèle est bon pour l’ordre de grandeur.'],
        pieges: [[OMEGA / (2 * Math.PI * 3e8), 'Vous avez laissé σ en m⁻¹ : 1 m⁻¹ = 10⁻² cm⁻¹, donc divisez par 100.'], [OMEGA / (3e8 * 100), 'Vous avez oublié le facteur 2π au dénominateur.'], [OMEGA, 'C’est la pulsation √(k/μ) en rad/s : divisez par 2π·c pour obtenir un nombre d’onde.'], [OMEGA / (2 * Math.PI * 3e8) * 100 * 100, 'Vous avez converti dans le mauvais sens : 1 m⁻¹ = 10⁻² cm⁻¹.']],
        expl: 'σ = √(k/μ) / (2πc) ≈ 1,73·10³ cm⁻¹, très proche de la bande C=O d’une cétone (1715 cm⁻¹).', indice: 'Calculez √(k/μ), divisez par 2π·c, puis convertissez les m⁻¹ en cm⁻¹.' } },
    { id: 'masse', titre: 'Pourquoi C–H absorbe plus haut que C–C ?', focus: ['scene'],
      texte: <>Sur ce spectre schématique, la bande C–C est vers 1000{NB}cm⁻¹ et la bande C–H vers 2950{NB}cm⁻¹, alors que les raideurs sont du même ordre (k ≈ 400 à 500{NB}N/m).</>,
      tache: { type: 'qcm', q: 'Quelle est l’explication ?', ...QCM.masse,
        expl: 'À k voisin, σ varie comme 1/√μ : avec l’hydrogène, μ ≈ 0,92 u au lieu de 6 u pour C–C, ce qui multiplie σ par √(6/0,92) ≈ 2,5.', indice: 'Comparez les masses réduites : μ(C–H) = 0,92 u et μ(C–C) = 6 u.' } },
    { id: 'multiplicite', titre: 'Simple, double, triple', focus: ['scene'],
      texte: <>Entre deux atomes de carbone, plus la liaison est multiple, plus elle est rigide : k ≈ 360{NB}N/m pour C–C, 960{NB}N/m pour C=C et 1560{NB}N/m pour C≡C. Les trois ont la même masse réduite (6{NB}u).</>,
      tache: { type: 'qcm', q: 'Parmi C–C, C=C et C≡C, laquelle absorbe au nombre d’onde le plus élevé ?', ...QCM.multiplicite,
        expl: 'À μ fixée, σ augmente avec √k : C≡C (2200 cm⁻¹) > C=C (1650 cm⁻¹) > C–C (1000 cm⁻¹).', indice: 'À masse réduite égale, la plus rigide vibre le plus vite.' } },
    { id: 'conjugaison', titre: 'L’effet de la conjugaison', focus: ['scene'],
      texte: <>Dans une cétone non conjuguée la bande C=O est à 1715{NB}cm⁻¹ (repère rouge). Quand C=O est conjuguée avec une liaison C=C, ses électrons se délocalisent : la liaison C=O ressemble un peu plus à une liaison simple, donc son k diminue légèrement.</>,
      tache: { type: 'qcm', q: 'La bande C=O d’une cétone conjuguée se trouve…', ...QCM.conjugaison,
        expl: 'La conjugaison affaiblit un peu la liaison C=O (k plus faible) : la bande est décalée vers les petits nombres d’onde, d’environ 10 à 30 cm⁻¹ (ici 1690 cm⁻¹).', indice: 'k plus faible : le nombre d’onde diminue.' } },
    { id: 'hydrogene', titre: 'La liaison hydrogène', focus: ['scene'],
      texte: <>Un alcool dilué dans un solvant apolaire absorbe vers 3620{NB}cm⁻¹ avec une bande <strong>fine</strong> (O–H libre). Dans l’alcool pur, les O–H sont liés entre eux par des liaisons hydrogène : l’atome H est retenu par un autre oxygène, la liaison O–H s’affaiblit, et il existe beaucoup d’environnements différents.</>,
      tache: { type: 'qcm', q: 'Pour O–H lié par liaison hydrogène, la bande est…', ...QCM.hydrogene,
        expl: 'La liaison O–H affaiblie vibre moins vite (σ plus bas, 3200 à 3400 cm⁻¹) et la diversité des environnements élargit la bande : large et décalée.', indice: 'Liaison affaiblie : σ diminue ; plusieurs environnements : bande élargie.' } },
    { id: 'lecture', titre: 'Lire un spectre', retenirTitre: 'À retenir : où lit-on chaque liaison ?', retenir: <SvgCarteZones/>, focus: ['scene', 'curseur'],
      texte: <>Voici le spectre de la propanone. Sa bande la plus intense est à <strong>1715{NB}cm⁻¹</strong> (repère rouge). Choisissez dans la liste la liaison responsable.</>,
      tache: { type: 'action', ok: vie.choix === 'CO2', label: 'Choisir la liaison C=O', faire: () => setVie(v => ({ ...v, choix: 'CO2' })), consigne: 'Sélectionnez la liaison correspondant à la bande à 1715 cm⁻¹' } },
    { id: 'zones', titre: 'Les deux zones du spectre', focus: ['scene'],
      texte: <>Un spectre IR se lit en deux parties : au-dessus de 1500{NB}cm⁻¹, les bandes des liaisons caractéristiques (O–H, N–H, C–H, C≡C, C=O, C=C) ; sous 1500{NB}cm⁻¹, la <strong>zone d’empreinte</strong> (zone grisée), très riche et propre à chaque molécule.</>,
      tache: { type: 'qcm', q: 'Pour repérer les groupes caractéristiques d’une molécule, on regarde surtout…', ...QCM.zones,
        expl: 'Les groupes caractéristiques absorbent au-dessus de 1500 cm⁻¹ ; la zone d’empreinte, trop chargée pour être attribuée bande à bande, sert à comparer deux spectres.', indice: 'Les bandes caractéristiques sont isolées, la zone d’empreinte est chargée.' } },
    { id: 'co2', titre: 'Vibrer sans absorber', focus: ['scene', 'curseur'],
      texte: <>La molécule de dioxyde de carbone O=C=O possède trois mouvements de vibration. Choisissez-les un par un et comparez : le mouvement des atomes, la jauge de <strong>variation du moment dipolaire</strong> et la présence d’une bande à ce nombre d’onde sur le spectre (repère rouge).</>,
      tache: { type: 'qcm', q: 'Le mouvement symétrique de CO₂ (1388 cm⁻¹) ne donne aucune bande IR parce que…', ...QCM.co2,
        expl: 'Dans ce mouvement les deux liaisons C=O s’allongent et se raccourcissent ensemble : leurs variations de moment dipolaire se compensent, le moment dipolaire de la molécule reste nul. Sans variation, pas d’interaction avec le champ électrique de l’onde, donc pas d’absorption IR.', indice: 'Choisissez le mouvement symétrique et regardez le point de la jauge : bouge-t-il ?' } },
    { id: 'bilan', titre: 'Le bilan : de la liaison au spectre', focus: [],
      retenirTitre: 'À retenir : liaison hydrogène et conjugaison', retenir: <><SvgCarteBilanIR/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>σ augmente avec k (liaison rigide) et diminue avec μ (atomes lourds).</li><li>Au-dessus de 1500 cm⁻¹ : groupes caractéristiques ; en dessous : empreinte.</li><li>ν = c·σ ; une vibration n’absorbe en IR que si elle fait varier le moment dipolaire (CO₂ symétrique : aucune bande).</li></ul></>,
      texte: <>Vous savez relier le nombre d’onde d’une bande à la raideur et aux masses de la liaison (loi de Hooke), prévoir l’effet de la multiplicité, de la conjugaison et de la liaison hydrogène, et lire un spectre en deux zones. Vous savez aussi pourquoi un mouvement de vibration ne donne pas forcément une bande. En exploration, comparez des liaisons, des molécules et l’effet de la concentration sur O–H ; les défis testent le calcul de σ et l’attribution d’une bande. Pour la suite : comparer des spectres.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, ORDRE.length - 1);
    if (ni !== Math.min(guide.etape, ORDRE.length - 1)) setVie(() => ({ ...BASE, ...(DEPART[ORDRE[ni]] ?? {}) }));
    setGuide(nv);
  };
  const sc = idE;
  const sigK = M.sigmaHooke(vie.k, M.masseReduite(12, 12)), mdCO2 = H.mode('CO2', vie.modeCO2);
  const noteAnim = `Animation ralentie ${sci(M.ralenti(1000), 0)} fois : 1 oscillation par seconde pour σ = 1000${NB}cm⁻¹. La vraie vibration est des milliers de milliards de fois plus rapide.`;
  const at = (s, m) => ({ lab: s, m });
  const sceneGuide = !enGuide ? null
    : sc === 'ressort' ? <><SceneRessort a={at('C', 12)} b={at('C', 12)} k={vie.k} anime={anime}/><div style={{ height: 6 }}/><SceneSpectreIR bandes={[{ sigma: sigK, larg: 30, prof: 0.8 }]} marque={sigK}/></>
    : sc === 'mu' ? <SceneRessort a={at('C', 12)} b={at('H', 1)} k={480} anime={anime}/>
    : sc === 'hooke' ? <SceneRessort a={at('C', 12)} b={at('O', 16)} k={1200} anime={anime}/>
    : sc === 'masse' ? <SceneSpectreIR bandes={BANDES_MASSE} etiquettes={[[1000, 'C–C'], [2950, 'C–H']]}/>
    : sc === 'multiplicite' ? <SceneSpectreIR bandes={BANDES_TROIS} etiquettes={[[1000, 'C–C'], [1650, 'C=C'], [2200, 'C≡C']]}/>
    : sc === 'conjugaison' ? <SceneSpectreIR bandes={M.MOLECULES.propanone.bandes.slice(0, 2)} marque={1715} etiquettes={[[1715, 'C=O', 0, 'start']]}/>
    : sc === 'hydrogene' ? <SceneSpectreIR bandes={M.MOLECULES.ethanol_dilue.bandes} etiquettes={[[3620, 'O–H libre', 6, 'start']]}/>
    : sc === 'lecture' ? <SceneSpectreIR bandes={BANDES_LECT} marque={1715}/>
    : sc === 'zones' ? <SceneSpectreIR bandes={M.MOLECULES.propanone.bandes}/>
    : sc === 'co2' ? <><SceneMolecule molId="CO2" modeId={vie.modeCO2} anime={anime}/><div style={{ height: 6 }}/><SceneSpectreIR bandes={H.bandesMolecule('CO2')} marque={mdCO2.sigma} marqueLabel={H.actifIR('CO2', vie.modeCO2) ? null : `${mdCO2.sigma} · aucune bande`} marqueCouleur={H.actifIR('CO2', vie.modeCO2) ? '#dc2626' : '#64748b'}/></>
    : null;
  const MES_GUIDE = { ressort: [['Raideur k', `${vie.k}${NB}N/m`], ['Nombre d’onde σ de la bande', fsig(sigK)], ['Fréquence ν = c·σ', `${sci(M.nuHz(sigK), 2)}${NB}Hz`], ['Période T = 1/ν', `${fr(M.periodeFs(sigK), 1)}${NB}fs`]],
    co2: [['Mouvement', mdCO2.nom], ['Nombre d’onde σ', fsig(mdCO2.sigma)], ['Fréquence ν = c·σ', `${sci(M.nuHz(mdCO2.sigma), 2)}${NB}Hz`]] };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab_, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: '#0f766e' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && sc === 'ressort' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{curs('ir-k', `Raideur k : ${vie.k} N/m`, vie.k, 100, 1600, 50, ev => setVie(v => ({ ...v, k: parseInt(ev.target.value, 10) })), 'Le ressort est de plus en plus épais quand la liaison est plus rigide.')}</div>
    : enGuide && sc === 'co2' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{selecteur('ir-co2', 'Mouvement de CO₂', vie.modeCO2, ev => setVie(v => ({ ...v, modeCO2: ev.target.value })), H.MOLS.CO2.modes.map(m => ({ id: m.id, nom: `${m.nom}` })))}</div>
    : enGuide && sc === 'lecture' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{selecteur('ir-ch', 'Liaison responsable de la bande à 1715 cm⁻¹', vie.choix, ev => setVie(v => ({ ...v, choix: ev.target.value })), M.LIAISONS.map(l => ({ id: l.id, nom: l.nom })), 'Choisir…')}</div> : null;
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}{['ressort', 'mu', 'hooke', 'co2'].includes(sc) && <BarreAnim anime={anime} onBascule={() => setAnime(a => !a)} note={noteAnim}/>}</div>;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'hooke' ? { ...M.tirageDefiHooke(Math.random), rep1: '', verifie: false } : { ...M.tirageDefiBande(Math.random), rep1: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => {
    let ok;
    if (defi.kind === 'hooke') { ok = Math.abs(num2(defi.rep1) - defi.sigma) <= 0.05 * defi.sigma; noterH(ok); }
    else { ok = defi.rep1 === defi.l.id; noterB(ok); }
    setDefi(x => ({ ...x, verifie: true, ok }));
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['hooke', 'Du ressort au σ'], ['bande', 'Attribuer une bande']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'hooke' ? 'Défi : du ressort au nombre d’onde' : 'Défi : attribuer une bande'}</div>
      {defi.kind === 'hooke' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Une liaison entre un atome de masse <strong>{M.MASSE[defi.l.a]}{NB}u</strong> et un atome de masse <strong>{M.MASSE[defi.l.b]}{NB}u</strong> a une raideur <strong>k = {defi.k}{NB}N/m</strong>. Calculez le nombre d’onde de sa bande d’absorption (u = 1,66·10⁻²⁷{NB}kg ; c = 3,00·10⁸{NB}m/s ; 3 chiffres significatifs ; précision attendue : 5 %).</div>
        <div style={{ marginTop: 8 }}><label htmlFor="ir-d1" style={libelle}>Nombre d’onde σ (cm⁻¹)</label><input id="ir-d1" inputMode="decimal" value={defi.rep1} onChange={ev => maj({ rep1: ev.target.value })} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div></>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Un spectre IR présente une bande à <strong>σ = {defi.sigma}{NB}cm⁻¹</strong>. À quelle liaison l’attribuer ?</div>
        {selecteur('ir-d2', 'Liaison', defi.rep1, ev => maj({ rep1: ev.target.value }), defi.choix.map(l => ({ id: l.id, nom: l.nom })), 'Choisir…')}</>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'hooke'
        ? <>μ = m₁·m₂/(m₁ + m₂) en u, à convertir en kg ; σ = √(k/μ) / (2π·c) en m⁻¹, puis en cm⁻¹ (÷ 100).</>
        : <>Au-dessus de 1500 cm⁻¹ : O–H et N–H vers 3400 à 3600, C–H vers 2950, C≡C vers 2200, C=O vers 1715. Les liaisons légères (H) et rigides (multiples) absorbent haut.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'hooke' ? <>Réponse : σ ≈ {fr(defi.sigma, 0)}{NB}cm⁻¹ (μ = {fr(defi.mu, 2)}{NB}u).</> : <>Réponse : {defi.l.nom}.</>}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const lia = M.liaison(ex.liaison), mu = M.masseReduite(M.MASSE[lia.a], M.MASSE[lia.b]), sigE = M.sigmaHooke(ex.k, mu);
  const molec = M.MOLECULES[ex.mol], bd = molec.bandes[Math.min(ex.bande, molec.bandes.length - 1)];
  const bandesH = M.bandesEthanol(ex.x);
  const mol2 = H.MOLS[ex.mol2], md2 = H.mode(ex.mol2, ex.mode2) ?? mol2.modes[0], act2 = H.actifIR(mol2.id, md2.id);
  const tours2 = M.nuHz(md2.sigma);
  const noteRot = `Animation ralentie ${sci(tours2 / H.TOURS_ANIM, 0)} fois : la molécule fait environ ${sci(tours2, 1)} tours par seconde en réalité, 0,5 ici. Au même ralenti que les vibrations (${sci(M.ralenti(1000), 0)}), elle ferait un tour en ${fr(1 / M.fAnim(md2.sigma), 0)}${NB}s.`;
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{ex.onglet === 'liaison' ? 'Réglez la liaison' : ex.onglet === 'spectre' ? (ex.sous === 'tirages' ? 'Réglez l’échantillon et la source' : 'Choisissez une molécule') : ex.onglet === 'molecules' ? 'Choisissez une molécule et un mouvement' : 'Faites varier la concentration'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.onglet === 'liaison' ? 'Choisissez une liaison, puis modifiez sa raideur : le nombre d’onde calculé par la loi de Hooke est comparé à la valeur tabulée.'
        : ex.onglet === 'spectre' && ex.sous === 'tirages' ? 'Chaque photon traverse l’échantillon ou y est absorbé, au hasard : la probabilité d’être absorbé est 1 − T(σ). Le spectre se trace en comptant les photons transmis.'
        : ex.onglet === 'spectre' ? 'Spectres schématiques en transmittance. Choisissez une bande : sa liaison et son énergie sont indiquées dans les mesures.'
        : ex.onglet === 'molecules' ? 'Regardez les atomes bouger et la jauge : le point suit la variation du moment dipolaire. Sans variation, pas de bande IR.'
        : 'Plus l’alcool est concentré, plus les groupes O–H sont liés entre eux par liaison hydrogène.'}</div>
      {ex.onglet === 'liaison' && <>
        {selecteur('ir-el', 'Liaison', ex.liaison, ev => { const l = M.liaison(ev.target.value); setEx(e => ({ ...e, liaison: l.id, k: l.k })); }, M.LIAISONS.map(l => ({ id: l.id, nom: l.nom })))}
        {curs('ir-ek', `Raideur k : ${ex.k} N/m`, ex.k, 100, 1800, 20, ev => setEx(e => ({ ...e, k: parseInt(ev.target.value, 10) })), 'Réglé sur la valeur typique de la liaison choisie.')}</>}
      {ex.onglet === 'spectre' && ex.sous === 'tirages' && <>
        {selecteur('ir-tm', 'Molécule', ex.mol, ev => { setEx(e => ({ ...e, mol: ev.target.value, bande: 0 })); tir.regler({ mol: ev.target.value }); }, Object.entries(M.MOLECULES).map(([id, m]) => ({ id, nom: m.nom })))}
        {selecteur('ir-tmode', 'Nombre d’onde des photons', tir.t.mode, ev => tir.regler({ mode: ev.target.value }), [{ id: 'hasard', nom: 'Tiré au hasard entre 500 et 4000 cm⁻¹' }, { id: 'choisi', nom: 'Choisi par vous' }])}
        {tir.t.mode === 'choisi' && curs('ir-ts', `σ des photons : ${tir.t.sigma} cm⁻¹`, tir.t.sigma, 500, 4000, 5, ev => tir.regler({ sigma: parseInt(ev.target.value, 10) }), 'Placez σ sur une bande pour voir presque tous les photons absorbés, entre deux bandes pour les voir traverser.')}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 14, color: KIT.txt }}><input type="checkbox" checked={tir.t.courbe} onChange={ev => tir.regler({ courbe: ev.target.checked })} style={{ width: 20, height: 20 }}/>Afficher le spectre attendu (pointillés)</label></>}
      {ex.onglet === 'spectre' && ex.sous !== 'tirages' && <>
        {selecteur('ir-em', 'Molécule', ex.mol, ev => { setEx(e => ({ ...e, mol: ev.target.value, bande: 0 })); tir.regler({ mol: ev.target.value }); }, Object.entries(M.MOLECULES).map(([id, m]) => ({ id, nom: m.nom })))}
        {selecteur('ir-eb', 'Bande étudiée', ex.bande, ev => setEx(e => ({ ...e, bande: parseInt(ev.target.value, 10) })), molec.bandes.map((b, i) => ({ id: i, nom: `${b.sigma} cm⁻¹${b.lie ? ' : ' + M.liaison(b.lie).nom : ''}` })))}</>}
      {ex.onglet === 'molecules' && <>
        {selecteur('ir-m2', 'Molécule', ex.mol2, ev => setEx(e => ({ ...e, mol2: ev.target.value, mode2: H.MOLS[ev.target.value].modes[0].id })), Object.values(H.MOLS).map(m => ({ id: m.id, nom: m.nom })))}
        {selecteur('ir-mm', 'Mouvement', md2.id, ev => setEx(e => ({ ...e, mode2: ev.target.value })), mol2.modes.map(m => ({ id: m.id, nom: m.nom })))}</>}
      {ex.onglet === 'hydrogene' && curs('ir-ex', `Part de O–H liés : ${Math.round(ex.x * 100)} %`, ex.x, 0, 1, 0.05, ev => setEx(e => ({ ...e, x: parseFloat(ev.target.value) })), 'De 0 % (alcool très dilué) à 100 % (alcool pur).')}
    </div>);
  const pilules = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {[['liaison', 'Une liaison'], ['spectre', 'Un spectre'], ['hydrogene', 'Liaison hydrogène'], ['molecules', 'Molécules en mouvement']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, onglet: k }))} aria-pressed={ex.onglet === k} style={stylePetitBouton(ex.onglet === k, '#0f766e')}>{l}</button>)}
    </div>);
  const sousPilules = ex.onglet === 'spectre' && (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Afficher :</span>
      {[['schema', 'Spectre schématique'], ['tirages', 'Tirages au hasard']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, sous: k }))} aria-pressed={ex.sous === k} style={stylePetitBouton(ex.sous === k, '#334155')}>{l}</button>)}
    </div>);
  const voletScene = (
    <div style={styleBoite}>
      {pilules}{sousPilules}
      {ex.onglet === 'liaison' ? <><SceneRessort a={at(lia.a, M.MASSE[lia.a])} b={at(lia.b, M.MASSE[lia.b])} k={ex.k} anime={anime}/><div style={{ height: 6 }}/><SceneSpectreIR bandes={[{ sigma: sigE, larg: lia.larg, prof: 0.8 }]} marque={lia.tab}/><BarreAnim anime={anime} onBascule={() => setAnime(a => !a)} note={noteAnim}/></>
        : ex.onglet === 'spectre' && ex.sous === 'tirages' ? <>
          <div aria-hidden="true" style={{ fontSize: 14.5, fontWeight: 700, color: '#115e59', minHeight: 44, lineHeight: 1.4, marginBottom: 4 }}>{lotT ? 'Les photons défilent trop vite pour être animés un par un : voici le bilan du dernier paquet. « × 10 » et « × 100 » montrent chaque photon.' : (demoEv ? 'Scénario seul. ' : '') + legendePhase(dAff, pAff)}</div>
          <div className="ir-at">
            <SceneCuveIR d={dAff} p={pAff}/>
            <PanneauScenariosIR etat={tir.t.etat} params={tir.t} mol={tir.mol} courant={lotT ? -1 : scenarioVisible(dAff, pAff)} demo={tir.demo} prog={progT} tir={tir}/>
          </div>
          <div role="status" aria-live={tir.lecture ? 'off' : 'polite'} style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, margin: '4px 0 8px', minHeight: 42 }}>{lotT ? `Bilan du dernier paquet de ${tir.t.etat.lotRes.n} photons : ${tir.t.etat.lotRes.abs} absorbés, ${tir.t.etat.lotRes.n - tir.t.etat.lotRes.abs} transmis.` : `${dAff ? `Scénario ${scenario(dAff) + 1} sur 2 : ` : ''}${texteEvenement(dAff)}.`}</div>
          <SceneSpectreTir etat={tir.t.etat} mol={tir.mol} params={tir.t}/><div style={{ marginTop: 10 }}><CommandesTiragesIR tir={tir}/></div></>
        : ex.onglet === 'spectre' ? <SceneSpectreIR bandes={molec.bandes} marque={bd.sigma}/>
        : ex.onglet === 'molecules' ? <>
          <SceneMolecule molId={mol2.id} modeId={md2.id} anime={anime}/><div style={{ height: 6 }}/>
          {md2.rot ? <div style={{ ...styleBoite, fontSize: 13.5, lineHeight: 1.5, color: KIT.txt }}>{act2 ? <>La raie de rotation (σ ≈ {md2.sigma}{NB}cm⁻¹) est <strong>hors du spectre tracé</strong> (500 à 4000{NB}cm⁻¹) : elle se trouve dans l’infrarouge lointain, bien moins énergétique que la vibration.</> : <>N₂ n’a <strong>aucun moment dipolaire permanent</strong> : sa rotation ne change rien pour l’onde, aucune raie d’absorption.</>}</div>
            : <SceneSpectreIR bandes={H.bandesMolecule(mol2.id)} marque={md2.sigma} marqueLabel={act2 ? null : `${md2.sigma} · aucune bande`} marqueCouleur={act2 ? '#dc2626' : '#64748b'}/>}
          <BarreAnim anime={anime} onBascule={() => setAnime(a => !a)} note={md2.rot ? noteRot : noteAnim}/></>
        : <SceneSpectreIR bandes={bandesH} etiquettes={ex.x < 0.8 ? [[3620, 'libre', 4, 'start']] : []}/>}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {ex.onglet === 'liaison' ? <>
        <LigneMesure nom="Masse réduite μ" valeur={`${fr(mu, 2)}${NB}u`}/><LigneMesure nom="σ (loi de Hooke)" valeur={fsig(sigE)}/>
        <LigneMesure nom="σ tabulé (repère rouge)" valeur={fsig(lia.tab)}/><LigneMesure nom="Longueur d’onde" valeur={`${fr(M.lamUm(sigE), 2)}${NB}µm`}/>
        <LigneMesure nom="Énergie du photon" valeur={`${fr(sigE * 1.2431e-4, 3)}${NB}eV`}/>
        <LigneMesure nom="Fréquence ν = c·σ" valeur={`${sci(M.nuHz(sigE), 2)}${NB}Hz`}/><LigneMesure nom="Période T = 1/ν" valeur={`${fr(M.periodeFs(sigE), 1)}${NB}fs`}/></>
      : ex.onglet === 'spectre' && ex.sous === 'tirages' ? <>
        <LigneMesure nom="Photons envoyés" valeur={`${tir.t.etat.nEnv}`}/><LigneMesure nom="Photons absorbés" valeur={`${tir.t.etat.nAbs}`}/>
        <LigneMesure nom="Photons transmis (comptés)" valeur={`${tir.t.etat.nEnv - tir.t.etat.nAbs}`}/>
        <LigneMesure nom="Transmis / envoyés (tous σ)" valeur={tir.t.etat.nEnv ? `${fr(100 * (tir.t.etat.nEnv - tir.t.etat.nAbs) / tir.t.etat.nEnv, 0)}${NB}%` : '—'}/>
        {tir.t.mode === 'choisi' && (() => { const i = indiceT(tir.t.sigma), n = tir.t.etat.env[i], te = estimee(tir.t.etat, i); return <>
          <LigneMesure nom={`Photons envoyés vers ${tir.t.sigma}${NB}cm⁻¹ (case de 25)`} valeur={`${n}`}/>
          <LigneMesure nom="Transmittance mesurée (transmis / envoyés)" valeur={te == null ? '—' : `${fr(te, 0)}${NB}%`}/>
          <LigneMesure nom="Transmittance du spectre schématique" valeur={`${fr(100 * probaTransmis(tir.mol, tir.t), 0)}${NB}%`}/></>; })()}</>
      : ex.onglet === 'spectre' ? <>
        <LigneMesure nom="Nombre d’onde" valeur={fsig(bd.sigma)}/><LigneMesure nom="Liaison" valeur={bd.lie ? M.liaison(bd.lie).nom : 'zone d’empreinte (non attribuée)'}/>
        <LigneMesure nom="Aspect de la bande" valeur={bd.large ? 'large' : 'fine'}/><LigneMesure nom="Transmittance au minimum" valeur={`${fr(100 * M.transmittance(molec.bandes, bd.sigma), 0)}${NB}%`}/>
        <LigneMesure nom="Zone" valeur={bd.sigma >= 1500 ? 'groupes caractéristiques' : 'empreinte'}/></>
      : ex.onglet === 'molecules' ? <>
        <LigneMesure nom="Mouvement" valeur={md2.nom}/>
        <LigneMesure nom={md2.rot ? 'σ de la raie de rotation (J = 4 → 5)' : 'Nombre d’onde σ'} valeur={fsig(md2.sigma)}/>
        <LigneMesure nom="Fréquence ν = c·σ" valeur={`${sci(M.nuHz(md2.sigma), 2)}${NB}Hz`}/>
        <LigneMesure nom={md2.rot ? 'Tours par seconde (réels)' : 'Période T = 1/ν'} valeur={md2.rot ? `${sci(M.nuHz(md2.sigma), 1)}` : `${fr(M.periodeFs(md2.sigma), 1)}${NB}fs`}/>
        <LigneMesure nom="Moment dipolaire" valeur={md2.rot ? (act2 ? 'permanent : il tourne avec la molécule' : 'nul : rien ne tourne pour l’onde') : (act2 ? 'varie pendant le mouvement' : 'reste nul pendant le mouvement')}/>
        <LigneMesure nom="Bande IR" valeur={act2 ? (md2.rot ? 'oui, dans l’IR lointain' : 'oui, à ce nombre d’onde') : 'aucune'}/></>
      : <>
        <LigneMesure nom="Part de O–H liés" valeur={`${Math.round(ex.x * 100)}${NB}%`}/>
        <LigneMesure nom="Bande O–H libre" valeur={ex.x < 0.95 ? `3620${NB}cm⁻¹, fine` : 'quasi absente'}/><LigneMesure nom="Bande O–H liée" valeur={ex.x > 0.05 ? `vers 3340${NB}cm⁻¹, large` : 'quasi absente'}/></>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Une liaison : comparez C–H, C–O et O–H. Qui absorbe le plus haut ? Qui a la plus petite masse réduite ?</li>
      <li>Une liaison : pour C≡C, réglez k comme celui d’une double puis d’une simple liaison. Que devient σ ?</li>
      <li>Un spectre : cherchez la bande C=O dans les trois molécules qui en ont. Quel effet a la conjugaison ?</li>
      <li>Tirages : envoyez 100 puis 1000 photons au hasard. Que devient le spectre quand le nombre de photons augmente ? Pourquoi ?</li>
      <li>Tirages : choisissez σ sur la bande C=O de la propanone puis entre deux bandes. Quelle fraction des photons est transmise dans chaque cas ?</li>
      <li>Un spectre : l’éthanol pur et l’éthanol dilué diffèrent-ils au-dessus ou en dessous de 1500 cm⁻¹ ?</li>
      <li>Liaison hydrogène : à quelle part de O–H liés la bande libre devient-elle presque invisible ?</li>
      <li>Molécules en mouvement : comparez les trois mouvements de CO₂ puis de H₂O. Lesquels donnent une bande ? Pourquoi N₂ n’absorbe-t-il pas ?</li>
      <li>Molécules en mouvement : pour HCl, comparez la vibration et la rotation (σ, énergie, domaine spectral).</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>σ = (1/2πc)·√(k/μ) : σ augmente avec k, diminue avec μ</li>
        <li>ν = c·σ : fréquence de vibration et nombre d’onde sont proportionnels</li>
        <li>Un mouvement n’absorbe en IR que s’il fait varier le moment dipolaire (CO₂ symétrique, N₂ : aucune bande)</li>
        <li>μ = m₁·m₂/(m₁ + m₂) : H léger → σ élevé (C–H ≈ 2950 cm⁻¹)</li>
        <li>C–C ≈ 1000 ; C=C ≈ 1650 ; C≡C ≈ 2200 ; C=O ≈ 1715 cm⁻¹</li>
        <li>Conjugaison : C=O baissé de 10 à 30 cm⁻¹</li>
        <li>O–H libre : 3620 cm⁻¹, fine ; O–H lié : 3200 à 3400 cm⁻¹, large</li>
        <li>Au-dessus de 1500 cm⁻¹ : groupes caractéristiques ; en dessous : empreinte</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle</strong> : oscillateur harmonique à deux masses, σ = (1/2πc)·√(k/μ). Il donne l’ordre de grandeur (écarts de quelques % avec les valeurs tabulées) mais ignore l’anharmonicité et le couplage entre liaisons.</li>
      <li><strong>Raideurs</strong> : valeurs typiques arrondies (par exemple 1200 N/m pour C=O, 480 N/m pour C–H) ; elles varient avec l’environnement de la liaison.</li>
      <li><strong>Tirages</strong> : chaque photon est absorbé avec la probabilité 1 − T(σ), T étant la transmittance du spectre schématique ; photons indépendants, une seule absorption par photon, détecteur parfait, pas de diffusion. Le spectre se trace case par case (25 cm⁻¹) en comptant transmis / envoyés ; avec peu de photons il est bruité (écart relatif d’environ 1/√N).</li>
      <li><strong>Constantes</strong> : c = 3,00·10⁸ m/s ; u = 1,66·10⁻²⁷ kg ; E(eV) = 1,243·10⁻⁴ × σ(cm⁻¹).</li>
      <li><strong>Spectres</strong> : schématiques (bandes gaussiennes, intensités et largeurs choisies pour l’illustration) ; en vrai, les bandes ont des profils plus complexes.</li>
      <li><strong>Liaison hydrogène</strong> : modélisée par une bande large centrée sur 3340 cm⁻¹ dont l’intensité croît avec la part de O–H liés ; la position exacte dépend du composé.</li>
      <li><strong>Animations</strong> : ralenties d’un facteur constant (1 oscillation par seconde pour 1000 cm⁻¹) car la vraie vibration dure quelques dizaines de femtosecondes. Amplitudes exagérées, mouvements de H₂O et CO₂ dessinés de façon simplifiée (symétrie, centre de masse fixe), charges partielles arbitraires : la jauge indique si le moment dipolaire varie, pas l’intensité de la bande. Rotation : raie J = 4 → 5, σ = 2B(J + 1) avec B = 10,6 cm⁻¹ pour HCl et 2,0 cm⁻¹ pour N₂.</li>
      <li><strong>Hors modèle</strong> : vibrations de déformation, harmoniques, couplages de Fermi, intensités quantitatives.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ir-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ir-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ir-col { display: flex; flex-direction: column; gap: 12px; }
        .ir-at { display: grid; gap: 10px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .ir-at { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); } }
        .ir-sc { transition: background 0.3s, transform 0.3s; } .ir-sc.on { transform: scale(1.02); font-weight: 600; }
        @media (prefers-reduced-motion: reduce) { .ir-sc { transition: none; } .ir-sc.on { transform: none; } }
        .ir-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .ir-l1.cote .ir-carte { order: 2; } .ir-l1.cote .ir-main { order: 1; }
          .ir-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .ir-ex > * { grid-column: 1; }
          .ir-ex > .ir-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .ir-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ir-in { animation: ir-fondu 0.35s ease-out; } @keyframes ir-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .ir-l1 *, .ir-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Infrarouge : de la liaison-ressort au spectre</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une liaison chimique vibre comme un <strong>ressort</strong> : sa raideur et la masse des atomes fixent le <strong>nombre d’onde</strong> du photon absorbé. La loi de Hooke explique pourquoi chaque liaison absorbe à un endroit précis du spectre infrarouge, et comment la conjugaison et la liaison hydrogène le modifient.</div>
      {enGuide && <div className="ir-l1 cote">
        <div className="ir-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="ir-main">
          <div className="ir-col">
            {sceneBloc && <div className="ir-in">{sceneBloc}</div>}
            {curseurGuide && <div className="ir-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="ir-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'hooke' ? suiviH : suiviB}/></div>}
      {enExplore && <>
        <div className="ir-ex">
          {voletScene}
          <div className="ir-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
