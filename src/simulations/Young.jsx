import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, indicesProfond, lireNombre, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as Y from "./youngModele";
import { QCM_PARCOURS as Q } from "./youngQcm";
import { MontageYoung, EcranYoung, CarteDelta, CarteConditions, CarteInterfrange, CarteNInterfranges, CartePointe, CarteEffets } from "./youngSchemas";

const SIM_ID = 182, CLE_GUIDE = 'young-tg-guide-v1';
declarerDefis(SIM_ID, [['lambda', 'Retrouver la longueur d’onde du laser'], ['a', 'Retrouver la distance entre les trous']]);

// ====================================================
// SIM 182 — TROUS D'YOUNG : LIEUX D'INTERFÉRENCES ET INTERFRANGE (TG spé PC, « Caractériser les phénomènes ondulatoires »)
//  Capacités visées (jamais affichées à l'élève) : prévoir les lieux d'interférences constructives et destructives dans le cas des trous d'Young,
//  l'expression linéarisée δ = a x / D étant donnée ; établir l'expression de l'interfrange ; l'exploiter, avec mesure de N interfranges sur une image.
//  Modèle : youngModele.js (test : youngModele.test.mjs), qui s'appuie sur ondesModele.js (simulations TSTL 83 et 84, non modifiées).
// ====================================================

const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const IDS = ['dispositif', 'chemins', 'lineaire', 'nature', 'lieux', 'interfrange', 'calcul-i', 'pointer', 'mesure-i', 'pourquoi', 'lambda', 'effet-a', 'bilan'];
const I_ROUGE = Y.interfrange(650, 0.5, 2.5), I_VERT = Y.interfrange(532, 0.5, 2.5);
const REP0 = { x1: -6, x2: 6 };
// repères posés sur des franges brillantes pour des réglages donnés (exploration) : N = 4 interfranges (2 si l'écran n'en montre pas davantage), symétriques autour de O
const repCale = (lam, a, D) => { const nM = Y.nMax(lam, a, D), N = Math.min(4, nM), i = Y.interfrange(lam, a, D); return N < 1 ? { rep: REP0, N: 1 } : { rep: { x1: r1(-N / 2 * i), x2: r1(N / 2 * i) }, N }; };
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const r1 = v => Math.round(v * 10) / 10, borne = v => Math.max(-Y.DEMI_FENETRE, Math.min(Y.DEMI_FENETRE, r1(v)));
const fr = (h, b) => `frac(${h}|${b})`;
const FIntervalle = (
  <FormuleEnLigne><mi>i</mi><mo>=</mo><msub><mi>x</mi><mrow><mi>k</mi><mo>+</mo><mn>1</mn></mrow></msub><mo>−</mo><msub><mi>x</mi><mi>k</mi></msub></FormuleEnLigne>);

// ---------- repères : curseur, boutons − / + et valeur ----------
function ReglageRepere({ nom, valeur, onChange, c }) {
  const btn = { ...stylePetitBouton(false), minWidth: 42, minHeight: 42, fontSize: 20, lineHeight: 1 };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: KIT.txt2, fontWeight: 700 }}><span style={{ color: c }}>{nom}</span><span style={{ color: KIT.txt }}>{nbf(valeur, 1)}{NB}mm</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" aria-label={`Reculer ${nom} de 0,1 mm`} onClick={() => onChange(valeur - Y.PAS_REPERE)} style={btn}>−</button>
        <input type="range" min={-Y.DEMI_FENETRE} max={Y.DEMI_FENETRE} step={Y.PAS_REPERE} value={valeur} aria-label={nom} aria-valuetext={`${nbf(valeur, 1)} millimètres`} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1, minWidth: 0, accentColor: c }}/>
        <button type="button" aria-label={`Avancer ${nom} de 0,1 mm`} onClick={() => onChange(valeur + Y.PAS_REPERE)} style={btn}>+</button>
      </div>
    </div>);
}
function PanneauRepere({ x1, x2, setX, retablir, aide, children }) {
  return (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Repères</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>{aide || 'Chaque repère se déplace par pas de 0,1 mm (boutons − et +, ou curseur) : placez-le au centre d’une frange brillante.'}</div>
      <ReglageRepere nom="Repère 1 (trait plein)" valeur={x1} onChange={v => setX(1, v)} c="#b45309"/>
      <ReglageRepere nom="Repère 2 (tirets)" valeur={x2} onChange={v => setX(2, v)} c="#0e7490"/>
      <button type="button" onClick={retablir} style={{ ...styleBouton(false), marginBottom: 6 }}><Pic n="refresh"/>Rétablir les repères</button>
      <LigneMesure nom="Distance d entre les repères" valeur={`${nbf(Math.abs(x2 - x1), 1)}${NB}mm`}/>
      {children}
    </div>);
}

// ====================================================
export function SimulationYoung() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviL, noterL] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('lambda');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ mes: false, rep: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ lam: 650, a: 0.5, D: 2.5, N: 4 });
  const [rep, setRep] = useState(() => mode === 'explore' ? repCale(650, 0.5, 2.5).rep : REP0);
  const majEx = patch => { const e = { ...ex, ...patch }, c = repCale(e.lam, e.a, e.D); setEx({ ...e, N: c.N }); setRep(c.rep); };
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idx = Math.min(etape, IDS.length - 1), idEtape = IDS[idx];
  const apres = id => !enGuide || etape > IDS.indexOf(id);
  const setX = (i, v) => setRep(r => ({ ...r, [i === 1 ? 'x1' : 'x2']: borne(v) }));

  // ---------- grandeurs du parcours ----------
  const pointeOK = Y.ecartCentre(rep.x1, I_VERT) <= 0.12 * I_VERT && Y.ecartCentre(rep.x2, I_VERT) <= 0.12 * I_VERT && Math.abs(Math.abs(rep.x2 - rep.x1) / I_VERT - 8) < 0.25;
  const dG = r1(Math.abs(rep.x2 - rep.x1)), iMes = dG / 8, iMesAff = Math.round(iMes * 100) / 100;
  const lamMes = Y.lamDepuisI(iMesAff, 0.5, 2.5);
  const placerRepere = () => setRep({ x1: r1(-4 * I_VERT), x2: r1(4 * I_VERT) });
  const bloquePointe = pointeOK ? null : 'Placez d’abord les repères (étape « Mesurer plusieurs interfranges ») : le bouton « Placer les repères pour moi » ci-dessous le fait.';

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'dispositif', titre: 'Un laser, deux trous',
      texte: <>Un laser éclaire une plaque opaque percée de deux trous très fins, S₁ et S₂, distants de a = 0,50{NB}mm. Un écran est placé à la distance D = 2,50{NB}m de la plaque : c’est le dispositif des <strong>trous d’Young</strong>. Le laser rouge a pour longueur d’onde λ = 650{NB}nm. Chaque trou, très petit, diffracte la lumière : il renvoie de la lumière dans toutes les directions de l’écran.</>,
      tache: { type: 'qcm', q: 'Pourquoi les deux ondes issues de S₁ et de S₂ peuvent-elles interférer ?', ...Q.dispositif,
        expl: 'Les deux trous sont éclairés par le même laser : ils reçoivent la même onde au même instant et se comportent comme deux sources synchrones (même fréquence, déphasage constant, ici nul). Deux lampes indépendantes, même de même couleur, émettent des ondes dont la phase varie au hasard : aucune figure stable. Être une onde ne suffit pas : il faut des ondes synchrones. Enfin l’air ne synchronise rien.',
        indice: 'Pour obtenir une figure stable, il faut des ondes synchrones : même fréquence et déphasage constant. D’où viennent les deux ondes ?' } },
    { id: 'chemins', titre: 'La différence de chemin',
      texte: <>Un point M de l’écran est repéré par son abscisse x, mesurée depuis le centre O de l’écran (positive vers le haut). L’onde issue de S₁ parcourt la distance r₁ = S₁M, celle issue de S₂ parcourt r₂ = S₂M. Leur <strong>différence de chemin</strong> est δ = r₂ − r₁. En M, l’interférence est constructive (frange brillante) si δ = kλ, destructive (frange sombre) si δ = (k + ½)λ, avec k entier.</>,
      tache: { type: 'qcm', q: 'Au point O, centre de l’écran (x = 0), que valent δ et la nature de l’interférence ?', ...Q.chemins,
        expl: 'O est sur la médiatrice de S₁S₂ : r₁ = r₂, donc δ = 0 = 0 × λ. C’est la condition δ = kλ avec k = 0 : interférence constructive, frange brillante au centre. Une frange sombre exigerait δ = frac(λ|2), ce qui n’est pas le cas. Enfin δ n’est pas la distance a entre les trous : c’est la différence des distances parcourues jusqu’à M.',
        indice: 'Au centre de l’écran, comparez les distances r₁ et r₂ : O est sur l’axe de symétrie du montage.' } },
    { id: 'lineaire', titre: 'Une expression simple de δ',
      texte: <>Quand l’écran est très loin des trous (D ≫ a) et que M reste près du centre (x ≪ D), un calcul géométrique donne l’<strong>expression linéarisée</strong> de la différence de chemin, admise ici : δ = {fr('a × x', 'D')}, avec a, x et D exprimés dans la même unité. Pour le point M du schéma : a = 0,50{NB}mm, D = 2,50{NB}m et x = 1,6{NB}mm.</>,
      tache: { type: 'num', q: 'Différence de chemin δ au point M, en nanomètres', unite: 'nm', carnet: 'Différence de chemin δ en M', vrai: Y.deltaLin(0.5, 1.6, 2.5), tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Conversions : a = 0,50 mm = 0,50 × 10⁻³ m ; x = 1,6 mm = 1,6 × 10⁻³ m ; D = 2,50 m.', `δ = ${fr('0,50 × 10⁻³ × 1,6 × 10⁻³', '2,50')} = 3,2 × 10⁻⁷ m = 320 nm (1 nm = 10⁻⁹ m).`, 'Hypothèses : D ≫ a et x ≪ D (ici D est 5 000 fois plus grand que a).'],
        pieges: [[0.32, 'Vous avez gardé le résultat en micromètres : 3,2 × 10⁻⁷ m = 0,32 µm = 320 nm.'], [3.2e-7, 'Vous avez donné δ en mètres : la réponse est attendue en nanomètres (1 nm = 10⁻⁹ m).'], [2000, 'Vous avez multiplié par D au lieu de diviser : δ = frac(a × x|D).'], [3.2e-4, 'Vous avez donné δ en millimètres : il faut le convertir en nanomètres.']],
        expl: `δ = ${fr('a × x', 'D')} = ${fr('0,50 × 10⁻³ × 1,6 × 10⁻³', '2,50')} = 3,2 × 10⁻⁷ m = 320 nm.`,
        indice: 'Convertissez a et x en mètres (1 mm = 10⁻³ m), appliquez δ = frac(a × x|D), puis convertissez le résultat en nanomètres (1 nm = 10⁻⁹ m).' } },
    { id: 'nature', titre: 'Frange brillante ou sombre ?',
      retenirTitre: 'Différence de chemin et validité', retenir: <><CarteDelta/>
        <ul style={UL}><li>Différence de chemin des deux ondes en M : <strong>δ = r₂ − r₁</strong>, et en pratique δ = {fr('a × x', 'D')} (même unité pour a, x et D).</li>
          <li>Valable si <strong>D ≫ a</strong> et <strong>x ≪ D</strong> : l’écran est loin et M près du centre.</li>
          <li>Moyen de s’en souvenir : <strong>« δ grandit comme x »</strong> (δ est proportionnel à x, nul au centre).</li></ul></>,
      texte: <>Au point M précédent, δ = 320{NB}nm. Le laser rouge a pour longueur d’onde λ = 650{NB}nm. Comparez δ à λ : l’interférence est constructive si δ = kλ, destructive si δ = (k + ½)λ.</>,
      tache: { type: 'qcm', q: 'Au point M (δ = 320 nm, λ = 650 nm), l’interférence est…', ...Q.nature,
        expl: 'Le rapport δ sur λ vaut 320 sur 650, soit environ 0,49, presque frac(1|2) : δ = (k + ½)λ avec k = 0. L’interférence est destructive : M est sur la première frange sombre à côté de la frange centrale. Ce n’est pas δ = λ (320 nm est la moitié de 650 nm). Un δ non nul ne suffit pas à rendre l’interférence constructive : il faut δ = kλ. Et « δ inférieur à λ » ne suffit pas à annuler les ondes : il faut δ = (k + ½)λ.',
        indice: 'Calculez le rapport δ divisé par λ, puis comparez-le à un entier (k) ou à un demi-entier (k + ½).' } },
    { id: 'lieux', titre: 'Où sont les franges brillantes ?',
      retenirTitre: 'Constructive ou destructive', retenir: <><CarteConditions/>
        <ul style={UL}><li><strong>Constructive</strong> (frange brillante) : δ = kλ ; <strong>destructive</strong> (frange sombre) : δ = (k + ½)λ, avec k entier.</li>
          <li>Au centre O, δ = 0 : frange brillante (k = 0).</li>
          <li>Moyen de s’en souvenir : <strong>« un nombre entier de λ : on s’ajoute ; un demi en plus : on s’annule »</strong>.</li></ul></>,
      texte: <>Une frange brillante est centrée en un point où δ = kλ (k entier relatif : k = 0 pour la frange centrale, k = ±1, ±2… pour les suivantes). Combinez cette condition avec δ = {fr('a × x', 'D')} pour trouver l’abscisse x_k du centre de la k-ième frange brillante.</>,
      tache: { type: 'qcm', q: 'Quelle est l’abscisse x_k de la k-ième frange brillante ?', ...Q.lieux,
        expl: 'La condition δ = kλ avec δ = frac(a × x_k|D) donne frac(a × x_k|D) = kλ, donc x_k = k × frac(λ × D|a). Les autres expressions échangent λ, a et D, ou élèvent a au carré : elles ne sont pas des longueurs ou donnent des positions absurdes (λ × a divisé par D est de l’ordre de 10⁻¹⁰ m ici). On vérifie aussi que x_0 = 0 : frange brillante au centre.',
        indice: 'Écrivez δ = kλ, remplacez δ par frac(a × x|D), puis isolez x : multipliez par D et divisez par a.' } },
    { id: 'interfrange', titre: 'L’interfrange',
      texte: <>L’<strong>interfrange</strong> i est la distance entre les centres de deux franges brillantes consécutives, par exemple celles d’ordres k et k + 1 : {FIntervalle}. On utilise x_k = k × {fr('λ × D', 'a')} pour la frange k et la même expression pour la frange k + 1.</>,
      tache: { type: 'qcm', q: 'Quelle est l’expression de l’interfrange i ?', ...Q.interfrange,
        expl: 'On calcule la différence : (k + 1) × frac(λ × D|a) − k × frac(λ × D|a) = frac(λ × D|a). Le numéro k disparaît : l’interfrange est la même partout, les franges sont régulièrement espacées (la dernière proposition est donc fausse). Les deux autres échangent λ, a et D, ce qui ne donne pas une longueur de l’ordre du millimètre.',
        indice: 'Développez (k + 1) × frac(λ × D|a) − k × frac(λ × D|a) : mettez frac(λ × D|a) en facteur.' } },
    { id: 'calcul-i', titre: 'Prévoir l’interfrange',
      retenirTitre: 'L’interfrange', retenir: <><CarteInterfrange/>
        <ul style={UL}><li>Interfrange : distance entre deux franges brillantes consécutives, <strong>i = {fr('λ × D', 'a')}</strong>, la même partout.</li>
          <li>Une frange sombre se trouve au milieu entre deux franges brillantes : x = (k + ½) × i.</li>
          <li>Moyen de s’en souvenir : <strong>« λ et D agrandissent, a rétrécit »</strong> (i est proportionnel à λ et D, inversement proportionnel à a).</li></ul></>,
      texte: <>Rappel : i = {fr('λ × D', 'a')}, avec λ = 650{NB}nm, a = 0,50{NB}mm et D = 2,50{NB}m. Calculez l’interfrange attendue sur l’écran, en millimètres.</>,
      tache: { type: 'num', q: 'Interfrange i attendue, en millimètres', unite: 'mm', carnet: 'Interfrange prévue (laser rouge)', vrai: I_ROUGE, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Conversions : λ = 650 nm = 650 × 10⁻⁹ m ; a = 0,50 mm = 0,50 × 10⁻³ m ; D = 2,50 m.', `i = ${fr('650 × 10⁻⁹ × 2,50', '0,50 × 10⁻³')} = 3,25 × 10⁻³ m = 3,25 mm.`, 'Hypothèses : D ≫ a et x ≪ D (expression linéarisée de δ), onde monochromatique.'],
        pieges: [[3.25e-3, 'Votre valeur est i en mètres (3,25 × 10⁻³ m) : la réponse est attendue en millimètres. Vérifiez aussi que a a bien été converti en mètres.'], [3250, 'Vous n’avez pas converti λ en mètres : 650 nm = 650 × 10⁻⁹ m.']],
        expl: `i = ${fr('λ × D', 'a')} = ${fr('650 × 10⁻⁹ × 2,50', '0,50 × 10⁻³')} = 3,25 × 10⁻³ m = 3,25 mm.`,
        indice: 'Convertissez λ et a en mètres (1 nm = 10⁻⁹ m ; 1 mm = 10⁻³ m), calculez i en mètres, puis convertissez en millimètres.' } },
    { id: 'pointer', titre: 'Mesurer plusieurs interfranges',
      texte: <>On remplace le laser rouge par un autre laser, de longueur d’onde inconnue ; a = 0,50{NB}mm et D = 2,50{NB}m ne changent pas. L’écran montre la figure obtenue (en bas : l’éclairement, maximal au centre de chaque frange brillante). Pour gagner en précision, on ne mesure pas un seul interfrange mais plusieurs d’un coup : pointez avec le repère 1 une frange brillante, puis avec le repère 2 une autre frange brillante séparée de la première par <strong>8 interfranges</strong> (on compte les intervalles entre franges).</>,
      tache: { type: 'action', ok: pointeOK, label: 'Placer les repères pour moi', faire: placerRepere, consigne: 'Repères au centre de deux franges brillantes séparées de 8 interfranges' } },
    { id: 'mesure-i', titre: 'Calculer l’interfrange mesurée',
      retenirTitre: 'Mesurer N interfranges', retenir: <><CarteNInterfranges/>
        <ul style={UL}><li>Entre deux repères placés sur des franges brillantes, il y a <strong>N interfranges</strong> : d = N × i, donc <strong>i = {fr('d', 'N')}</strong>.</li>
          <li>On compte les interfranges (pas les franges) : 8 interfranges relient 9 franges.</li>
          <li>Moyen de s’en souvenir : <strong>« on mesure grand, on divise par N »</strong>.</li></ul></>,
      texte: <>Lisez dans « Repères » la distance d entre vos deux repères : elle correspond à 8 interfranges. Calculez l’interfrange mesurée i = {fr('d', '8')}, en millimètres.</>,
      tache: { type: 'num', q: 'Interfrange mesurée i, en millimètres', unite: 'mm', carnet: 'Interfrange mesurée (laser vert)', vrai: iMes, tol: 0.03, affiche: v => nbf(v, 2), cs: 3, bloque: bloquePointe,
        calcul: () => [`d = ${nbf(dG, 1)} mm pour 8 interfranges.`, `i = ${fr(nbf(dG, 1) + ' mm', '8')} = ${nbf(iMes, 2)} mm.`],
        pieges: [[dG, 'Vous avez donné la distance d entre les repères : il faut la diviser par le nombre d’interfranges (8).'], [dG / 9, 'Entre 9 franges brillantes (la première et la dernière comprises) il y a 8 interfranges, pas 9 : divisez par 8.'], [dG / 7, 'Il y a 8 interfranges entre les repères : divisez par 8.']],
        expl: `i = ${fr('d', '8')} = ${fr(nbf(dG, 1) + ' mm', '8')} = ${nbf(iMes, 2)} mm.`,
        indice: 'Entre les deux repères, il y a 8 interfranges : divisez la distance d par 8.' } },
    { id: 'pourquoi', titre: 'Pourquoi plusieurs interfranges ?',
      texte: <>Chaque repère est placé avec une incertitude de pointé d’environ 0,3{NB}mm sur la distance d (ordre de grandeur propre à cette simulation, le même quelle que soit la distance mesurée). Vous avez mesuré d pour 8 interfranges ; vous auriez pu mesurer un seul interfrange.</>,
      tache: { type: 'qcm', q: 'Pourquoi mesure-t-on 8 interfranges plutôt qu’un seul ?', ...Q.pourquoi,
        expl: 'L’erreur de pointé est la même (environ 0,3 mm) : sur un seul interfrange (environ 3 mm) elle représente 10 % de la mesure, sur 8 interfranges (environ 21 mm) elle ne pèse plus que 1 à 2 %. L’interfrange ne change pas d’une frange à l’autre (les franges sont régulières) : il n’y a rien à moyenner. L’éclat des franges lointaines est le même ici, et la formule vaut aussi pour un seul interfrange.',
        indice: 'L’erreur de pointé est la même pour 1 ou 8 interfranges. Comparez-la à la distance mesurée dans chaque cas : quel est son poids relatif ?' } },
    { id: 'lambda', titre: 'Retrouver la longueur d’onde',
      retenirTitre: 'Pourquoi mesurer plusieurs interfranges ?', retenir: <><CartePointe/>
        <ul style={UL}><li>L’erreur de pointé est <strong>la même</strong> quelle que soit la distance mesurée ; plus d est grande, plus cette erreur pèse <strong>peu en valeur relative</strong>.</li>
          <li>Exemple de la simulation : 0,3 mm d’erreur pèse environ 10 % sur 1 interfrange (environ 3 mm), environ 1 % sur 8 interfranges (environ 21 mm).</li>
          <li>Moyen de s’en souvenir : <strong>« mesurer loin, c’est mesurer juste »</strong>.</li></ul></>,
      texte: <>Votre mesure : i = {nbf(iMesAff, 2)}{NB}mm. D’après i = {fr('λ × D', 'a')}, on a λ = {fr('i × a', 'D')}, avec a = 0,50{NB}mm et D = 2,50{NB}m. Calculez la longueur d’onde du laser, en nanomètres. Valeurs de référence : la lumière visible va d’environ 400{NB}nm (violet) à 800{NB}nm (rouge profond).</>,
      tache: { type: 'num', q: 'Longueur d’onde λ du laser, en nanomètres', unite: 'nm', carnet: 'Longueur d’onde mesurée λ', vrai: lamMes, tol: 0.05, affiche: v => nbf(v, 0), cs: 2, bloque: bloquePointe,
        calcul: () => [`Conversions : i = ${nbf(iMesAff, 2)} mm = ${nbf(iMesAff, 2)} × 10⁻³ m ; a = 0,50 × 10⁻³ m ; D = 2,50 m.`, `λ = ${fr(nbf(iMesAff, 2) + ' × 10⁻³ × 0,50 × 10⁻³', '2,50')} = ${nbf(lamMes * 1e-9 * 1e7, 2)} × 10⁻⁷ m = ${nbf(lamMes, 0)} nm.`, 'Le résultat est dans le domaine visible (400 à 800 nm) et la lumière observée est verte.'],
        pieges: [[lamMes * 1e-9, 'Vous avez donné λ en mètres : la réponse est attendue en nanomètres.'], [lamMes / 1000, 'Vous avez donné λ en micromètres : la réponse est attendue en nanomètres.'], [lamMes * 1000, 'Vérifiez la conversion de a (mm) et de i (mm) en mètres : λ doit rester dans le domaine visible.']],
        expl: `λ = ${fr('i × a', 'D')} = ${fr(nbf(iMesAff, 2) + ' × 10⁻³ × 0,50 × 10⁻³', '2,50')} = ${nbf(lamMes, 0)} nm, voisin de 530 nm : un laser vert.`,
        indice: 'Isolez λ dans i = frac(λ × D|a), convertissez i et a en mètres, calculez, puis exprimez λ en nanomètres.' } },
    { id: 'effet-a', titre: 'Rapprocher les trous',
      texte: <>La notice du laser indique λ = 532{NB}nm. On remplace la plaque par une autre dont les trous sont plus rapprochés : a′ = 0,20{NB}mm (λ = 532{NB}nm et D = 2,50{NB}m inchangés). Calculez la nouvelle interfrange i′, en millimètres.</>,
      tache: { type: 'num', q: 'Nouvelle interfrange i′, en millimètres', unite: 'mm', carnet: 'Interfrange i′ pour a′ = 0,20 mm', vrai: Y.interfrange(532, 0.2, 2.5), tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Conversions : λ = 532 × 10⁻⁹ m ; a′ = 0,20 × 10⁻³ m ; D = 2,50 m.', `i′ = ${fr('532 × 10⁻⁹ × 2,50', '0,20 × 10⁻³')} = 6,65 × 10⁻³ m ≈ 6,7 mm.`],
        pieges: [[6.65e-3, 'Vous avez donné i′ en mètres : la réponse est attendue en millimètres.'], [2.66 * 0.2 / 0.5, 'Vous avez fait varier i comme a : i est inversement proportionnel à a, donc il augmente quand a diminue.'], [2.66, 'a a changé : l’interfrange change aussi (i est inversement proportionnel à a).']],
        expl: `i′ = ${fr('λ × D', 'a′')} = ${fr('532 × 10⁻⁹ × 2,50', '0,20 × 10⁻³')} = 6,65 × 10⁻³ m ≈ 6,7 mm : a est divisé par 2,5, donc i est multiplié par 2,5.`,
        indice: 'Utilisez i′ = frac(λ × D|a′) avec λ et a′ en mètres, puis convertissez le résultat en millimètres.' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Ce qui fait varier l’interfrange', retenir: <><CarteEffets/>
        <ul style={UL}><li><strong>i = {fr('λ × D', 'a')}</strong> : i augmente si λ augmente, si D augmente, ou si a diminue.</li>
          <li>Exemple de la simulation : a divisé par 2,5 (de 0,50 mm à 0,20 mm), i multiplié par 2,5.</li>
          <li>Moyen de s’en souvenir : <strong>« trous rapprochés, franges écartées »</strong>. Idée fausse : « plus les trous sont écartés, plus les franges sont larges ». Vrai : c’est l’inverse.</li></ul></>,
      texte: <>Vous savez prévoir où se forment les franges brillantes et sombres (δ = kλ ou δ = (k + ½)λ avec δ = {fr('a × x', 'D')}), établir l’interfrange i = {fr('λ × D', 'a')}, la mesurer sur N interfranges pour limiter l’erreur de pointé, et en déduire λ, a ou D. Les deux images ci-dessous (même λ et même D) comparent a = 0,50{NB}mm et a′ = 0,20{NB}mm. Passez à l’exploration (autre couleur, autre a, autre D) ou relevez les défis.</>, tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi({ ...Y.tirageDefi(type), type, x1: REP0.x1, x2: REP0.x2, rep: '', verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setRep(REP0);
    if (md === 'explore') { const c = repCale(650, 0.5, 2.5); setEx({ lam: 650, a: 0.5, D: 2.5, N: c.N }); setRep(c.rep); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const setXD = (i, v) => setDefi(d => ({ ...d, [i === 1 ? 'x1' : 'x2']: borne(v) }));
  const verifierDefi = () => {
    const x = lireNombre(defi.rep), ok = isFinite(x) && Math.abs(x - defi.vrai) <= Y.TOL_DEFI * defi.vrai;
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'lambda' ? noterL : noterA)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['lambda', 'Retrouver λ'], ['a', 'Retrouver a']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'lambda' ? 'Défi : retrouver la longueur d’onde du laser' : 'Défi : retrouver la distance entre les trous'}</div>
      <div style={{ ...lbl, marginBottom: 8 }}>
        {defi.type === 'lambda'
          ? <>Un laser de longueur d’onde inconnue éclaire deux trous distants de <strong>a = {nbf(defi.a, 2)}{NB}mm</strong> ; l’écran est à <strong>D = {nbf(defi.D, 2)}{NB}m</strong>. Placez les repères sur deux franges brillantes (au moins 5 interfranges d’écart), puis déterminez la longueur d’onde λ, avec 2 chiffres significatifs (marge acceptée : 8{NB}% de la valeur).</>
          : <>Un laser de longueur d’onde <strong>λ = {defi.lam}{NB}nm</strong> éclaire deux trous dont on ignore la distance a ; l’écran est à <strong>D = {nbf(defi.D, 2)}{NB}m</strong>. Placez les repères sur deux franges brillantes (au moins 5 interfranges d’écart), puis déterminez la distance a entre les trous, avec 2 chiffres significatifs (marge acceptée : 8{NB}% de la valeur).</>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>{defi.type === 'lambda' ? 'Longueur d’onde λ =' : 'Distance a entre les trous ='}</span>
        <input value={defi.rep} aria-label="Votre réponse" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('you-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false }))}
          style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{defi.type === 'lambda' ? 'nm' : 'mm'}</span>
      </div>
      <IndiceDefi cache={defi.verifie && defi.ok}>{indicesProfond(defi.type === 'lambda'
        ? <>Comptez N interfranges entre vos repères, puis i = {fr('d', 'N')} (en mm) ; ensuite λ = {fr('i × a', 'D')} avec i et a convertis en mètres ; exprimez λ en nanomètres.</>
        : <>Comptez N interfranges entre vos repères, puis i = {fr('d', 'N')} (en mm) ; ensuite a = {fr('λ × D', 'i')} avec λ et i convertis en mètres ; exprimez a en millimètres.</>)}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="you-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct. Valeur de la simulation : ${defi.type === 'lambda' ? `${defi.lam} nm` : `${nbf(defi.a, 2)} mm`}.`
          : (defi.type === 'lambda' ? '✗ Pas tout à fait. Vérifiez : repères au centre de deux franges brillantes, N compté entre les repères (nombre d’interfranges, pas de franges), i = d sur N en mm, λ = i a sur D avec des longueurs en mètres, résultat en nm.'
            : '✗ Pas tout à fait. Vérifiez : repères au centre de deux franges brillantes, N compté entre les repères (nombre d’interfranges, pas de franges), i = d sur N en mm, a = λ D sur i avec des longueurs en mètres, résultat en mm.')}</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Onde</strong> : lumière monochromatique (laser), onde sinusoïdale progressive ; les deux trous S₁ (en haut) et S₂ (en bas) sont éclairés en phase par le même laser. Pas de lumière blanche.</li>
      <li><strong>Trous</strong> : supposés ponctuels et identiques. Dans la réalité, chaque trou diffracte la lumière et l’éclairement des franges décroît loin du centre (enveloppe de diffraction) : ici cette enveloppe est <strong>ignorée</strong>, toutes les franges ont le même éclat. L’image montre des bandes rectilignes (comme pour deux fentes fines) ; pour de vrais trous ponctuels, les franges seraient de petits arcs ou points.</li>
      <li><strong>Expression linéarisée de δ</strong> : δ = {fr('a × x', 'D')} est admise (donnée par le programme). Elle suppose D ≫ a et x ≪ D (petits angles). Sur cette simulation (a ≤ 1 mm, D ≥ 1 m, |x| ≤ 20 mm) elle diffère de la valeur exacte r₂ − r₁ de moins de 0,03 %.</li>
      <li><strong>Conventions</strong> : x est une abscisse algébrique (positive vers le haut) mesurée depuis le centre O de l’écran, sur la médiatrice de S₁S₂ ; δ = r₂ − r₁ est positive pour x &gt; 0 ; k est un entier relatif (k = 0 : frange centrale) ; x_k = k × i est le centre de la frange brillante d’ordre k. L’interfrange i est comptée en valeur positive.</li>
      <li><strong>Milieu</strong> : air, supposé homogène, d’indice 1 ; écran plan, parallèle à la plaque.</li>
      <li><strong>Mesures sur l’image</strong> : l’incertitude de pointé de chaque repère (environ 0,3 mm) est un ordre de grandeur propre à la simulation. Les incertitudes ne sont pas composées ici. Pour déduire λ, a ou D, on utilise i = {fr('λ × D', 'a')} avec les autres grandeurs prises comme exactes.</li>
      <li><strong>Valeurs de référence</strong> (ordres de grandeur typiques) : lumière visible de 400 nm (violet) à 800 nm (rouge profond) ; laser vert 532 nm ; laser rouge 633 à 650 nm ; trous distants de 0,1 à 1 mm ; écran à 1 à 3 m.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scènes ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const legEcran = <div style={{ ...aide, marginTop: 6 }}>Figure d’interférences sur l’écran, vue de face ; x est mesuré en millimètres depuis le centre O. En bas : l’éclairement le long de l’écran.</div>;
  const sceneGuide = (() => {
    if (idx <= 6) return <div style={styleBoite}><MontageYoung mode={idx === 0 ? 'simple' : 'chemins'} lam={650}/></div>;
    if (idx <= 10) return <div style={styleBoite}><EcranYoung lam={532} a={0.5} D={2.5} x1={rep.x1} x2={rep.x2} mono aria="Figure d’interférences en niveaux de gris : franges claires régulièrement espacées, avec les deux repères"/>{legEcran}</div>;
    if (idx === 11) return <div style={styleBoite}><div style={titreCarte}>a = 0,50 mm</div><EcranYoung lam={532} a={0.5} D={2.5} repere={false} profil={false} aria="Figure d’interférences pour a égal à 0,50 millimètre"/><div style={{ ...aide, marginTop: 6 }}>Image obtenue avec la plaque d’origine (λ = 532 nm, D = 2,50 m).</div></div>;
    return (<div style={styleBoite}>
      <div style={titreCarte}>a = 0,50 mm</div><EcranYoung lam={532} a={0.5} D={2.5} repere={false} profil={false} aria="Figure d’interférences pour a égal à 0,50 millimètre"/>
      <div style={{ ...titreCarte, marginTop: 10 }}>a′ = 0,20 mm</div><EcranYoung lam={532} a={0.2} D={2.5} repere={false} profil={false} aria="Figure d’interférences pour a prime égal à 0,20 millimètre : franges plus écartées"/>
      <div style={{ ...aide, marginTop: 6 }}>Mêmes λ = 532 nm et D = 2,50 m ; seule la distance entre les trous change.</div></div>);
  })();
  const panneauGuide = enGuide && idx >= 7 && idx <= 10 && (
    <PanneauRepere x1={rep.x1} x2={rep.x2} setX={setX} retablir={() => setRep(REP0)}>
      {apres('mesure-i') && <LigneMesure nom="Interfrange mesurée i = frac(d|8)" valeur={`${nbf(iMesAff, 2)}${NB}mm`} couleur="#15803d"/>}
      {idx >= 8 && !pointeOK && <button type="button" onClick={placerRepere} style={{ ...styleBouton(true, '#b45309'), marginTop: 8 }}>Placer les repères pour moi</button>}
    </PanneauRepere>);

  // ---------- défi : scène ----------
  const sceneDefi = defi && (
    <div style={styleBoite}><EcranYoung lam={defi.lam} a={defi.a} D={defi.D} x1={defi.x1} x2={defi.x2} mono={defi.type === 'lambda' && !(defi.verifie && defi.ok)} aria="Figure d’interférences : franges brillantes régulièrement espacées, avec les deux repères"/>{legEcran}</div>);

  // ---------- exploration ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const iE = Y.interfrange(ex.lam, ex.a, ex.D), nMaxE = Math.max(1, Math.min(14, Y.nMax(ex.lam, ex.a, ex.D))), Nsel = Math.min(ex.N, nMaxE);
  const mesurable = Y.nMax(ex.lam, ex.a, ex.D) >= 2, tropDense = iE < 0.7;
  const dE = Math.abs(rep.x2 - rep.x1), iMesE = dE / Nsel, lamMesE = Y.lamDepuisI(iMesE, ex.a, ex.D);
  const LAMS = [405, 450, 500, 532, 590, 633, 650, 700, 780];
  const sceneExplore = (
    <div style={styleBoite}>
      <div style={aide}>Le schéma rappelle le montage ; l’image dessous est celle de l’écran pour les réglages choisis (laser, distance a entre les trous, distance D à l’écran).</div>
      <MontageYoung mode="simple" lam={ex.lam}/>
      <div style={{ height: 10 }}/>
      <EcranYoung lam={ex.lam} a={ex.a} D={ex.D} x1={rep.x1} x2={rep.x2} repere={ouv.rep} aria={`Figure d’interférences pour λ = ${ex.lam} nm, a = ${nbf(ex.a, 2)} mm et D = ${nbf(ex.D, 2)} m`}/>
      {legEcran}
      {tropDense && <div role="status" style={{ ...aide, color: '#b45309', fontWeight: 600 }}>À cette densité (environ {Y.nbBrillantes(ex.lam, ex.a, ex.D)} franges brillantes) l’écran ne résout plus les franges : elles se brouillent à l’œil, et seule la formule permet de les prévoir.</div>}
      {!mesurable && <div role="status" style={{ ...aide, color: '#b45309', fontWeight: 600 }}>Moins de 2 franges brillantes visibles : le mode « Mesurer sur l’image » n’est pas possible avec ces réglages.</div>}
    </div>);
  const reglages = (
    <div style={styleBoite} className="you-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez la couleur du laser, la distance a entre les deux trous et la distance D entre la plaque et l’écran : l’image se redessine aussitôt.</div>
      <label style={lbSel}>Longueur d’onde λ du laser
        <select value={ex.lam} onChange={e => majEx({ lam: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{LAMS.map(v => <option key={v} value={v}>{`${v} nm (${Y.nom(v)})`}</option>)}</select></label>
      <label style={lbSel}>Distance a entre les deux trous
        <select value={ex.a} onChange={e => majEx({ a: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0].map(v => <option key={v} value={v}>{nbf(v, 2)} mm</option>)}</select></label>
      <label style={lbSel}>Distance D entre la plaque et l’écran
        <select value={ex.D} onChange={e => majEx({ D: +e.target.value })} style={{ ...menu, marginTop: 2 }}>{[1.0, 1.5, 2.0, 2.5, 3.0].map(v => <option key={v} value={v}>{nbf(v, 2)} m</option>)}</select></label>
      <button type="button" onClick={() => majEx({ lam: 650, a: 0.5, D: 2.5 })} style={{ ...styleBouton(false), marginBottom: 4 }}><Pic n="refresh"/>Rétablir (650 nm ; 0,50 mm ; 2,50 m)</button>
    </div>);
  const mesures = (
    <div style={styleBoite}>
      <Section titre={`Prévisions : i = ${nbf(iE, 2)} mm`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>Valeurs données par les formules du cours pour les réglages choisis (la distance x est comptée depuis le centre O).</div>
        <LigneMesure nom="Interfrange i = frac(λ × D|a)" valeur={`${nbf(iE, 2)}${NB}mm`} couleur="#15803d"/>
        <LigneMesure nom="Frange brillante k = 1 : x_1" valeur={`${nbf(iE, 2)}${NB}mm`}/>
        <LigneMesure nom="Première frange sombre (k = 0)" valeur={`${nbf(iE / 2, 2)}${NB}mm`}/>
        <LigneMesure nom="Franges brillantes visibles" valeur={`${Y.nbBrillantes(ex.lam, ex.a, ex.D)}`}/>
      </Section>
    </div>);
  const mesurer = (
    <Section titre={`Mesurer sur l’image : d = ${nbf(dE, 1)} mm`} ouvert={ouv.rep} onBascule={() => setOuv(o => ({ ...o, rep: !o.rep }))}>
      <PanneauRepere x1={rep.x1} x2={rep.x2} setX={setX} retablir={() => setRep(REP0)} aide="Placez chaque repère au centre d’une frange brillante (pas de 0,1 mm), indiquez combien d’interfranges les séparent, et comparez avec la prévision.">
        <label style={{ ...lbSel, marginTop: 8 }}>Nombre N d’interfranges entre les repères
          <select value={Nsel} onChange={e => setEx(s => ({ ...s, N: +e.target.value }))} style={{ ...menu, marginTop: 2 }}>{Array.from({ length: nMaxE }, (_, k) => k + 1).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
        <LigneMesure nom="Interfrange mesurée i = frac(d|N)" valeur={mesurable ? `${nbf(iMesE, 2)}${NB}mm` : '—'} couleur="#15803d"/>
        <LigneMesure nom="Longueur d’onde déduite λ = frac(i × a|D)" valeur={mesurable ? `${nbf(lamMesE, 0)}${NB}nm` : '—'}/>
        <div style={aide}>Comparez avec la valeur réglée ({ex.lam} nm) : un écart de quelques pour cent vient du pointé ; un écart important vient d’un N erroné ou de repères mal placés.</div>
      </PanneauRepere>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Passez de 650 nm à 450 nm sans changer a ni D : que devient l’interfrange ? Dans quel rapport environ ?</li>
        <li>Divisez a par 2 : que devient l’interfrange ? Et si vous doublez D ?</li>
        <li>Avec les réglages de départ, repérez la première frange sombre : à quelle fraction de l’interfrange est-elle du centre ?</li>
        <li>Placez les repères sur deux franges brillantes éloignées de N interfranges : retrouvez-vous la longueur d’onde réglée ? Que se passe-t-il avec N = 1 ?</li>
        <li>Choisissez a = 1,00 mm, D = 1,00 m et 405 nm : les franges restent-elles faciles à distinguer ? Pourquoi mesure-t-on alors un grand nombre d’interfranges ?</li>
        <li>Choisissez a = 0,10 mm, D = 3,00 m et 780 nm : combien de franges brillantes voit-on sur l’écran ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Deux trous éclairés par le même laser : deux sources synchrones et en phase</li>
          <li>Différence de chemin : δ = r₂ − r₁ ≈ {fr('a × x', 'D')} (D ≫ a et x ≪ D)</li>
          <li>Brillante : δ = kλ, donc x_k = k × {fr('λ × D', 'a')} ; sombre : δ = (k + ½)λ</li>
          <li>Interfrange : i = {fr('λ × D', 'a')}, la même pour toutes les franges</li>
          <li>Mesure : i = {fr('d', 'N')} avec N interfranges entre deux franges brillantes ; plus N est grand, plus l’erreur relative est petite</li>
          <li>i augmente avec λ et D, diminue quand a augmente</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .you-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .you-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .you-col { display: flex; flex-direction: column; gap: 12px; }
        .you-df { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; } .you-df > * { min-width: 0; }
        .you-df-scene { order: 1; } .you-df-rep { order: 2; } .you-df-volet { order: 3; } .you-df-hypo { order: 4; }
        @media (min-width: 901px) { .you-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .you-df > * { order: 0; }
          .you-df-scene { grid-column: 1; grid-row: 1 / span 3; } .you-df-volet { grid-column: 2; grid-row: 1; } .you-df-rep { grid-column: 2; grid-row: 2; } .you-df-hypo { grid-column: 2; grid-row: 3; } }
        .you-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .you-l1.cote .you-carte { order: 2; } .you-l1.cote .you-main { order: 1; }
          .you-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .you-ex > * { grid-column: 1; } .you-ex > .you-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .you-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .you-in { animation: you-fondu 0.35s ease-out; } @keyframes you-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Trous d’Young et interfrange</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Deux trous éclairés par un même laser donnent sur l’écran des franges brillantes et sombres régulièrement espacées. On prévoit leur position avec la différence de chemin δ et on en déduit l’interfrange.</div>
      {enGuide && <div className="you-l1 cote">
        <div className="you-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="you-main"><div className="you-col">
          <div className="you-in" key={'s-' + (idx <= 6 ? idx : idx <= 10 ? 7 : idx)}>{sceneGuide}</div>
          {panneauGuide}
        </div></div>
      </div>}
      {enDefi && defi && <div className="you-df">
        <div className="you-df-scene you-in" key={'d' + defi.type + defi.lam + defi.a + defi.D}>{sceneDefi}</div>
        <div className="you-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'lambda' ? suiviL : suiviA}/></div></div>
        <div className="you-df-rep"><PanneauRepere x1={defi.x1} x2={defi.x2} setX={setXD} retablir={() => setDefi(d => ({ ...d, x1: REP0.x1, x2: REP0.x2 }))}/></div>
        <div className="you-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="you-ex">
        <div>{sceneExplore}</div>
        <div className="you-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{mesurer}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
