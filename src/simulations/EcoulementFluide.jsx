import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./berModele";
import { QCM_PARCOURS as Q } from "./berQcm";
import { SceneTuyau, BarresBernoulli, SceneReservoir, SvgCartePermanent, SvgCarteDebit, SvgCarteBernoulli, SvgCarteQualitatif, SvgCarteVenturi, SvgCarteTorricelli } from "./berSchemas";

const SIM_ID = 214, CLE_GUIDE = 'ecoulement-tg-guide-v2';
declarerDefis(SIM_ID, [['prevoir', 'Prévoir vitesse et pression dans un col'], ['colonnes', 'Retrouver un débit avec un tube de Venturi']]);

// ====================================================
// SIM 214 — ÉCOULEMENT D'UN FLUIDE : DÉBIT, RELATION DE BERNOULLI, EFFET VENTURI
//  (TG spé PC, « Mouvement et interactions », 3. Modéliser l'écoulement d'un fluide).
//  Capacités visées (jamais affichées à l'élève) : exploiter la conservation du débit volumique pour déterminer la vitesse d'un fluide incompressible ;
//  exploiter la relation de Bernoulli, fournie, qualitativement puis quantitativement (écoulement incompressible, permanent) ; effet Venturi ;
//  mettre en œuvre un dispositif (tube de Venturi, tubes manométriques) pour étudier l'écoulement et tester la relation.
//  Prolonge les simulations TSTL « Débits massique et volumique » (27), « Débit et vitesse d'écoulement » (28) et « Circuit hydraulique » (17, avec pertes de charge)
//  et la simulation 1G « Statique des fluides : pression et profondeur » (163). Modèle : berModele.js (test : berModele.test.mjs).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const nbm = v => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');          // 3 864 → « 3 864 » (espace fine insécable)
const SUPE = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sciFr = (v, cs = 2) => { const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e; return `${nbf(m, cs - 1)}${NB}×${NB}10${String(e).split('').map(c => SUPE[c]).join('')}`; };
const BLEU = '#0369a1', VERT = '#15803d';
const IDS = ['permanent', 'debit', 'conservation', 'prevoir', 'termes', 'qualitatif', 'difference', 'altitude', 'venturi', 'reservoir', 'torricelli', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
// valeurs du parcours (toutes redonnées dans les énoncés qui les utilisent)
const DA = 20, DB = 12, VA = 1.0, VB_AFF = 2.78, PRA = 6000, H_RES = 1.8;
const Q0 = M.debit(VA, DA), VB0 = M.vitesse(Q0, DB);                      // 3,14 × 10⁻⁴ m³·s⁻¹ ; 2,78 m·s⁻¹
const DP0 = M.deltaP(VA, VB_AFF) / 1000;                                   // 3,36 kPa (avec v_B arrondie à 2,78, valeur affichée)
const DH0 = DP0 * 1000 / (M.RHO * M.G) * 100;                              // 34 cm
const DZ_ALT = 0.3, DPZ0 = M.deltaP(VA, VB_AFF, 0, DZ_ALT) / 1000;           // 6,31 kPa : col surélevé de 0,30 m
const VT0 = M.torricelli(H_RES);                                           // 5,9 m·s⁻¹

// ---------- formules (MathML) ----------
const sub = (l, i) => <msub><mi>{l}</mi><mi>{i}</mi></msub>;
const sup2 = l => <msup><mi>{l}</mi><mn>2</mn></msup>;
const demi = <mfrac><mn>1</mn><mn>2</mn></mfrac>, rho = <mi>ρ</mi>, g = <mi>g</mi>;
const cin = v => <mrow>{demi}{rho}{sup2(v)}</mrow>;
const Pm = <mi>P</mi>;
const FQ = <Formule><mi>Q</mi><mo>=</mo><mi>S</mi><mo>×</mo><mi>v</mi></Formule>;
const FS = <Formule><mi>S</mi><mo>=</mo><mfrac><mrow><mi>π</mi><mo>×</mo>{sup2('d')}</mrow><mn>4</mn></mfrac></Formule>;
const FCons = <Formule>{sub('S', 'A')}<mo>×</mo>{sub('v', 'A')}<mo>=</mo>{sub('S', 'B')}<mo>×</mo>{sub('v', 'B')}<mo>=</mo><mi>Q</mi></Formule>;
const bernGen = <><mi>P</mi><mo>+</mo>{cin('v')}<mo>+</mo>{rho}{g}<mi>z</mi><mo>=</mo><mtext>constante</mtext></>;
const FBern = <Formule compact={<><FormuleEnLigne>{bernGen}</FormuleEnLigne>{' '}le long d’une ligne de courant</>}>{bernGen}</Formule>;
const bernAB = <>{sub('P', 'A')}<mo>+</mo><mrow>{demi}{rho}<msubsup><mi>v</mi><mi>A</mi><mn>2</mn></msubsup></mrow><mo>+</mo>{rho}{g}{sub('z', 'A')}<mo>=</mo>{sub('P', 'B')}<mo>+</mo><mrow>{demi}{rho}<msubsup><mi>v</mi><mi>B</mi><mn>2</mn></msubsup></mrow><mo>+</mo>{rho}{g}{sub('z', 'B')}</>;
const sommeGen = <><mi>P</mi><mo>+</mo>{cin('v')}<mo>+</mo>{rho}{g}<mi>z</mi></>;
const FBernDeuxPoints = <Formule compact={<><FormuleEnLigne>{sommeGen}</FormuleEnLigne>{' '}prend la même valeur en A et en B</>}>{bernAB}</Formule>;
const dPexpr = <>{sub('P', 'A')}<mo>−</mo>{sub('P', 'B')}<mo>=</mo>{demi}{rho}<mo>(</mo><msubsup><mi>v</mi><mi>B</mi><mn>2</mn></msubsup><mo>−</mo><msubsup><mi>v</mi><mi>A</mi><mn>2</mn></msubsup><mo>)</mo></>;
const FDeltaP = <Formule>{dPexpr}</Formule>;
const FDeltaPz = <Formule compact={<><FormuleEnLigne>{sub('P', 'A')}<mo>−</mo>{sub('P', 'B')}</FormuleEnLigne>{' '}= terme cinétique + terme d’altitude</>}>{dPexpr}<mo>+</mo>{rho}{g}<mo>(</mo>{sub('z', 'B')}<mo>−</mo>{sub('z', 'A')}<mo>)</mo></Formule>;
const eDeltaP = <FormuleEnLigne>{dPexpr}</FormuleEnLigne>;
const FHorizontal = <Formule compact={<><FormuleEnLigne><mi>P</mi><mo>+</mo>{cin('v')}</FormuleEnLigne>{' '}prend la même valeur en A et en B</>}>{sub('P', 'A')}<mo>+</mo><mrow>{demi}{rho}<msubsup><mi>v</mi><mi>A</mi><mn>2</mn></msubsup></mrow><mo>=</mo>{sub('P', 'B')}<mo>+</mo><mrow>{demi}{rho}<msubsup><mi>v</mi><mi>B</mi><mn>2</mn></msubsup></mrow></Formule>;
const FTorri = <Formule><mi>ρ</mi><mi>g</mi><mi>h</mi><mo>=</mo>{demi}{rho}<msubsup><mi>v</mi><mi>B</mi><mn>2</mn></msubsup></Formule>;
const FStat = <Formule><mi>P</mi><mo>−</mo>{sub('P', 'atm')}<mo>=</mo>{rho}{g}<mi>h</mi></Formule>;
const eRacine = c => <FormuleEnLigne><msqrt>{c}</msqrt></FormuleEnLigne>;
const eVT = <FormuleEnLigne>{sub('v', 'B')}<mo>=</mo><msqrt><mn>2</mn><mi>g</mi><mi>h</mi></msqrt></FormuleEnLigne>;
const eCin = <FormuleEnLigne>{cin('v')}</FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const eQ = <FormuleEnLigne><mi>Q</mi><mo>=</mo><mi>S</mi><mo>×</mo><mi>v</mi></FormuleEnLigne>;
const eCons = <FormuleEnLigne>{sub('S', 'A')}<mo>×</mo>{sub('v', 'A')}<mo>=</mo>{sub('S', 'B')}<mo>×</mo>{sub('v', 'B')}</FormuleEnLigne>;
const eBernGen = <FormuleEnLigne>{bernGen}</FormuleEnLigne>;
const eStat = <FormuleEnLigne><mi>P</mi><mo>−</mo>{sub('P', 'atm')}<mo>=</mo>{rho}{g}<mi>h</mi></FormuleEnLigne>;
const eTorri = <FormuleEnLigne><mi>ρ</mi><mi>g</mi><mi>h</mi><mo>=</mo>{demi}{rho}<msubsup><mi>v</mi><mi>B</mi><mn>2</mn></msubsup></FormuleEnLigne>;

// ---------- commandes de l'exploration : menu + boutons − / + ----------
const menuStyle = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, flex: 1, minWidth: 0, boxSizing: 'border-box' };
const lblMenu = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
function Choix({ nom, valeur, options, format, onChange, ok }) {
  const i = options.indexOf(valeur), btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 42, minWidth: 46, fontSize: 18, lineHeight: 1 };
  const voisin = s => { for (let k = i + s; k >= 0 && k < options.length; k += s) if (ok(options[k])) return options[k]; return null; };
  const moins = voisin(-1), plus = voisin(1);
  return (
    <label style={lblMenu}>{avecIndices(nom)}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
        <button type="button" aria-label={`Diminuer : ${nom.replace(/_/g, ' ')}`} disabled={moins == null} onClick={() => onChange(moins)} style={{ ...btn, opacity: moins == null ? 0.4 : 1 }}>−</button>
        <select value={valeur} onChange={e => onChange(Number(e.target.value))} style={menuStyle}>
          {options.map(o => <option key={o} value={o} disabled={o !== valeur && !ok(o)}>{format(o)}</option>)}</select>
        <button type="button" aria-label={`Augmenter : ${nom.replace(/_/g, ' ')}`} disabled={plus == null} onClick={() => onChange(plus)} style={{ ...btn, opacity: plus == null ? 0.4 : 1 }}>+</button>
      </div>
    </label>);
}

export function SimulationEcoulementFluide() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('prevoir');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ tuyau: false, ecoul: false, pression: false, reservoir: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ ...M.REGLAGE_DEPART, hR: 1.0, dOr: 10 });                        // exploration
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  // ---------- étape du parcours ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'permanent', titre: 'Écoulement permanent et ligne de courant', focus: ['scene'],
      texte: <>De l’eau circule dans un tuyau horizontal. L’écoulement est dit <strong>permanent</strong> (ou stationnaire) quand, en chaque point, la vitesse et la pression du fluide ne dépendent pas du temps. Une <strong>ligne de courant</strong> est une courbe tangente, en chaque point, au vecteur vitesse vec(v) des particules de fluide ; trois lignes de courant sont tracées sur le schéma. L’eau est supposée <strong>incompressible</strong> : sa masse volumique ρ reste constante.</>,
      tache: { type: 'qcm', q: 'Que signifie « écoulement permanent » ?', options: Q.permanent.options, bonne: 0,
        expl: 'Permanent signifie que l’écoulement ne change pas au cours du temps : en un point fixe, la vitesse (et la pression) restent les mêmes. Une particule de fluide, elle, peut accélérer en passant dans un rétrécissement : la vitesse varie d’un point à l’autre, mais pas au cours du temps en un même point. La vitesse n’est donc pas la même partout, et la pression non plus.',
        indice: 'Imaginez deux photographies de l’écoulement prises à deux instants différents : que voit-on de changé en un point fixe du tuyau ?' } },
    { id: 'debit', titre: 'Le débit volumique', focus: ['scene'],
      retenirTitre: 'Régime permanent et ligne de courant',
      retenir: <>
        <SvgCartePermanent/>
        <ul style={ULS}>
          <li><strong>Permanent</strong> : en un point donné, vec(v) et P ne changent pas au cours du temps.</li>
          <li><strong>Ligne de courant</strong> : courbe tangente à vec(v) en chaque point.</li>
          <li>Moyen de s’en souvenir : <strong>« la même photo à tout instant »</strong>. Idée fausse : « la vitesse est la même partout dans le tuyau ». Vrai : elle peut varier d’un point à un autre, mais pas au cours du temps en un point.</li>
        </ul></>,
      texte: <>Le <strong>débit volumique</strong> Q est le volume de fluide qui traverse une section du tuyau par unité de temps. Pour une section d’aire S traversée à la vitesse moyenne v (supposée la même en tout point de la section) :{FQ}L’aire S d’une section circulaire de diamètre d vaut :{FS}Ici, le tuyau a un diamètre intérieur d = 20{NB}mm et l’eau y circule à la vitesse v = 1,0{NB}m·s⁻¹ (ordre de grandeur d’un tuyau domestique).</>,
      tache: { type: 'num', q: 'Débit volumique Q, en m³·s⁻¹ (2 chiffres significatifs ; écrivez par exemple 3,5e-4 pour 3,5 × 10⁻⁴)', unite: 'm³·s⁻¹', vrai: Q0, tol: 0.05, affiche: v => sciFr(v), cs: 2, carnet: 'Débit volumique Q',
        calcul: () => ['d = 20 mm = 0,020 m, donc S = frac(π × d²|4) = frac(π × (0,020 m)²|4) = 3,14 × 10⁻⁴ m².', 'Q = S × v = 3,14 × 10⁻⁴ m² × 1,0 m·s⁻¹ = 3,1 × 10⁻⁴ m³·s⁻¹ (soit environ 19 L·min⁻¹). Hypothèse : vitesse uniforme sur la section.'],
        pieges: [[Q0 * 4, 'Vous avez pris S = π × d² : il manque le facteur 1/4 (S = π × d² divisé par 4, ou π × r² avec r = d/2).'], [Q0 * 1e6, 'Vous n’avez pas converti le diamètre en mètres : 20 mm = 0,020 m.'], [M.lmin(Q0), 'Vous avez donné le débit en L·min⁻¹ : la réponse est attendue en m³·s⁻¹.'], [Q0 / 4, 'Vous avez divisé deux fois par 2 le diamètre : le rayon est d/2, et c’est lui qu’on élève au carré, avec π.']],
        expl: <>S = <FormuleEnLigne><mfrac><mrow><mi>π</mi><mo>×</mo>{sup2('d')}</mrow><mn>4</mn></mfrac></FormuleEnLigne> = 3,14 × 10⁻⁴{NB}m² ; Q = S × v = 3,1 × 10⁻⁴{NB}m³·s⁻¹ (environ 19{NB}L·min⁻¹).</>,
        indice: 'Convertissez d en mètres, calculez l’aire S du disque (π × d² divisé par 4), puis multipliez par v = 1,0 m·s⁻¹.' } },
    { id: 'conservation', titre: 'Le débit se conserve dans un rétrécissement', focus: ['scene'],
      texte: <>L’eau est incompressible et l’écoulement permanent : aucun fluide ne s’accumule dans le tuyau, donc le même volume traverse chaque section par seconde. Le débit volumique <strong>se conserve</strong> :{FCons}Le tuyau précédent (d_A = 20{NB}mm, v_A = 1,0{NB}m·s⁻¹, Q = 3,1 × 10⁻⁴{NB}m³·s⁻¹) se rétrécit en un col de diamètre d_B = 12{NB}mm.</>,
      tache: { type: 'num', q: 'Vitesse v_B de l’eau dans le col, en m·s⁻¹ (3 chiffres significatifs)', unite: 'm·s⁻¹', vrai: VB0, tol: 0.05, affiche: v => nbf(v, 2), cs: 3, carnet: 'Vitesse v_B dans le col',
        calcul: () => ['S_A = frac(π × (0,020 m)²|4) = 3,14 × 10⁻⁴ m² et S_B = frac(π × (0,012 m)²|4) = 1,13 × 10⁻⁴ m².', 'v_B = frac(Q|S_B) = frac(3,14 × 10⁻⁴ m³·s⁻¹|1,13 × 10⁻⁴ m²) = 2,78 m·s⁻¹ : la vitesse augmente quand la section diminue.'],
        pieges: [[VA * DB / DA, 'Le rapport est inversé : quand la section diminue, la vitesse augmente (S_A × v_A = S_B × v_B).'], [VA * DA / DB, 'Vous avez utilisé le rapport des diamètres : le débit fait intervenir les SECTIONS, proportionnelles au carré du diamètre.'], [VA * (DB / DA) ** 2, 'Le rapport des sections est inversé : v_B = v_A × S_A divisée par S_B (plus grande que v_A).']],
        expl: 'S_A × v_A = S_B × v_B donne v_B = v_A × frac(S_A|S_B) = v_A × frac(d_A²|d_B²) = 1,0 × frac(20²|12²) = 2,78 m·s⁻¹.',
        indice: 'S_A × v_A = S_B × v_B : isolez v_B. Les sections sont proportionnelles au carré des diamètres, donc S_A divisée par S_B = d_A² divisé par d_B².' } },
    { id: 'prevoir', titre: 'Prévoir sans calculer', focus: ['scene'],
      texte: <>Un autre tuyau d’eau, de diamètre 40{NB}mm, se resserre en un col de diamètre 20{NB}mm : <strong>le diamètre est divisé par 2</strong> (voir le schéma). Le débit reste le même.</>,
      tache: { type: 'qcm', q: 'Que devient la vitesse de l’eau entre le grand tuyau et le col ?', options: Q.prevoir.options, bonne: 0,
        expl: 'La section est proportionnelle au carré du diamètre : diamètre divisé par 2, section divisée par 4. Comme S × v est constant, la vitesse est multipliée par 4. « Elle double » confond le diamètre et la section (c’est le cas d’une section divisée par 2). « Divisée par 4 » inverse le sens : un col plus étroit accélère l’eau. « Multipliée par 8 » ferait intervenir le cube du diamètre, qui est celui du volume, pas celui de la section.',
        indice: 'S est proportionnelle à d², et S × v reste constant. Si d est divisé par 2, par combien S est-elle divisée ?' } },
    { id: 'termes', titre: 'Les termes de la relation de Bernoulli', focus: ['scene'],
      retenirTitre: 'Débit volumique et conservation',
      retenir: <>
        <SvgCarteDebit/>
        <ul style={ULS}>
          <li><strong>Q = S × v</strong> (m³·s⁻¹) ; fluide incompressible en régime permanent : <strong>S_A × v_A = S_B × v_B</strong>.</li>
          <li>La section varie comme <strong>d²</strong> : diamètre divisé par 2, section divisée par 4, vitesse multipliée par 4.</li>
          <li>Moyen de s’en souvenir : <strong>« moins de place, plus vite »</strong>. Idée fausse : « la vitesse est inversement proportionnelle au diamètre ». Vrai : au carré du diamètre.</li>
        </ul></>,
      texte: <>Pour un fluide incompressible en écoulement permanent, <strong>non visqueux</strong> et qui n’échange pas d’énergie (ni pompe ni turbine), la <strong>relation de Bernoulli</strong> est fournie. Elle relie la pression P, la vitesse v et l’altitude z (axe vertical vers le haut) en tout point d’une même ligne de courant :{FBern}Avec ρ = 1000{NB}kg·m⁻³ et g = 9,81{NB}N·kg⁻¹, chaque terme est une pression, en pascals (Pa) : P (pression statique), {eCin} (pression cinétique) et ρ g z (pression de pesanteur). Dans le col du tuyau, v_B = 2,78{NB}m·s⁻¹ (étape 3).</>,
      tache: { type: 'num', q: <>Pression cinétique au col, <FormuleEnLigne>{demi}{rho}<msubsup><mi>v</mi><mi>B</mi><mn>2</mn></msubsup></FormuleEnLigne> pour v_B = 2,78 m·s⁻¹, en pascals (3 chiffres significatifs)</>, unite: 'Pa', vrai: M.pCin(VB_AFF), tol: 0.05, affiche: v => nbm(v), cs: 3, carnet: 'Pression cinétique au col',
        calcul: () => ['½ρv_B² = ½ × 1000 kg·m⁻³ × (2,78 m·s⁻¹)² = 500 × 7,73 = 3 864 Pa.', 'Unité : kg·m⁻³ × m²·s⁻² = kg·m⁻¹·s⁻² = Pa (1 Pa = 1 N·m⁻²).'],
        pieges: [[M.pCin(VB_AFF) * 2, 'Vous avez oublié le facteur ½ : la pression cinétique est ½ × ρ × v².'], [M.RHO * VB_AFF / 2, 'Vous n’avez pas élevé la vitesse au carré : c’est ½ × ρ × v² (et non ½ × ρ × v).'], [M.RHO * VB_AFF * VB_AFF * M.G / 2, 'Vous avez multiplié par g : g n’intervient que dans le terme ρ g z (pression de pesanteur).']],
        expl: <>½ρv_B² = 0,5 × 1000 × 2,78² = 3 864{NB}Pa, soit 3,86{NB}kPa : la pression cinétique est un terme de même nature que la pression P.</>,
        indice: 'Calculez v_B² (en m²·s⁻²), multipliez par ρ = 1000 kg·m⁻³, puis par ½. Le résultat est en pascals.' } },
    { id: 'qualitatif', titre: 'Conduite horizontale : que devient la pression ?', focus: ['scene'],
      retenirTitre: 'La relation de Bernoulli',
      retenir: <>
        <SvgCarteBernoulli/>
        <ul style={ULS}>
          <li><strong>P + ½ρv² + ρgz = constante</strong> le long d’une ligne de courant ; chaque terme est une pression (Pa).</li>
          <li>Conditions : fluide incompressible, écoulement permanent, <strong>sans viscosité</strong> (pas de pertes de charge) et sans pompe ni turbine.</li>
          <li>Moyen de s’en souvenir : <strong>« trois pressions dont la somme ne change pas »</strong>. Idée fausse : « Bernoulli s’applique toujours ». Vrai : c’est un modèle, qui néglige les frottements.</li>
        </ul></>,
      texte: <>La conduite est <strong>horizontale</strong> : les points A et B sont à la même altitude, donc les termes ρ g z_A et ρ g z_B sont égaux et se simplifient. La relation de Bernoulli entre A et B :{FBernDeuxPoints}se réduit alors à :{FHorizontal}Au col, la vitesse est plus grande qu’à l’entrée (v_B = 2,78{NB}m·s⁻¹ contre v_A = 1,0{NB}m·s⁻¹).</>,
      tache: { type: 'qcm', q: 'Que prévoit la relation de Bernoulli pour la pression P_B au col, comparée à la pression P_A à l’entrée ?', options: Q.qualitatif.options, bonne: 0,
        expl: 'Avec z_A = z_B : P_A − P_B = ½ρ(v_B² − v_A²). Comme v_B > v_A, le second membre est positif : P_B est plus petite que P_A. Le débit est conservé (S × v constant), mais cela ne dit rien d’une conservation de la pression : P_B n’est pas égale à P_A. Il n’est pas nécessaire de connaître P_A pour comparer les deux pressions, seulement les vitesses. Attention : la relation relie P et v, elle n’en fait pas une cause de l’autre.',
        indice: 'Écrivez la différence P_A − P_B à partir de l’égalité, puis regardez son signe en comparant v_B² et v_A².' } },
    { id: 'difference', titre: 'Calculer la différence de pression', focus: ['scene'],
      retenirTitre: 'Vitesse et pression en conduite horizontale',
      retenir: <>
        <SvgCarteQualitatif/>
        <ul style={ULS}>
          <li>Conduite horizontale : <strong>P + ½ρv² = constante</strong>. Là où v est plus grande, P est plus petite : la relation les relie.</li>
          <li>Écart de pression entre deux points : <strong>P_A − P_B = ½ρ(v_B² − v_A²)</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« la pression cinétique et la pression statique varient en sens opposé, leur somme reste constante »</strong>. Idée fausse : « Q constant donc P constante ». Vrai : Q se conserve, pas P.</li>
        </ul></>,
      texte: <>Passons au quantitatif. Pour z_A = z_B, la relation de Bernoulli donne l’écart de pression entre A et B :{FDeltaP}Données : ρ = 1000{NB}kg·m⁻³, v_A = 1,0{NB}m·s⁻¹ et v_B = 2,78{NB}m·s⁻¹ (étape 3).</>,
      tache: { type: 'num', q: 'Différence de pression P_A − P_B, en kPa (3 chiffres significatifs)', unite: 'kPa', vrai: DP0, tol: 0.05, affiche: v => nbf(v, 2), cs: 3, carnet: 'Différence de pression P_A − P_B',
        calcul: () => ['P_A − P_B = ½ρ(v_B² − v_A²) = 0,5 × 1000 × (2,78² − 1,0²) = 500 × (7,73 − 1,00).', 'P_A − P_B = 500 × 6,73 = 3 364 Pa = 3,36 kPa : P_B est inférieure à P_A de 3,36 kPa (hypothèses : z_A = z_B, fluide non visqueux).'],
        pieges: [[M.pCin(VB_AFF) / 1000, 'Vous avez oublié de retrancher la pression cinétique en A : il faut ½ρ(v_B² − v_A²), pas seulement ½ρ v_B².'], [M.pCin(VB_AFF - VA) / 1000, 'Vous avez élevé l’écart des vitesses au carré : il faut l’écart des CARRÉS, v_B² − v_A².'], [-DP0, 'Le signe est faux : P_A − P_B est positif, car la pression est plus grande à l’entrée qu’au col.'], [DP0 * 2, 'Vous avez oublié le facteur ½ de la pression cinétique.']],
        expl: <>P_A − P_B = ½ρ(v_B² − v_A²) = 0,5 × 1000 × (7,73 − 1,00) = 3 364{NB}Pa = 3,36{NB}kPa.</>,
        indice: 'Calculez d’abord v_B² − v_A² (en m²·s⁻²), multipliez par ρ = 1000 kg·m⁻³ puis par ½ ; le résultat est en pascals, à convertir en kPa.' } },
    { id: 'altitude', titre: 'Un col surélevé', focus: ['scene'],
      texte: <>On monte maintenant le même tuyau avec le col B <strong>0,30{NB}m plus haut</strong> que l’entrée A (axe vertical z vers le haut, z_A = 0). Les altitudes ne sont plus égales : le terme ρ g z ne se simplifie plus. Avec v_A = 1,0{NB}m·s⁻¹ et v_B = 2,78{NB}m·s⁻¹ (étape 3), la relation de Bernoulli entre A et B donne :{FDeltaPz}avec ρ = 1000{NB}kg·m⁻³ et g = 9,81{NB}N·kg⁻¹.</>,
      tache: { type: 'num', q: 'Différence de pression P_A − P_B avec le col surélevé de 0,30 m, en kPa (3 chiffres significatifs)', unite: 'kPa', vrai: DPZ0, tol: 0.05, affiche: v => nbf(v, 2), cs: 3, carnet: 'Différence de pression P_A − P_B (col surélevé)',
        calcul: () => ['Terme cinétique : ½ρ(v_B² − v_A²) = 0,5 × 1000 × (2,78² − 1,0²) = 3 364 Pa.', 'Terme d’altitude : ρ g (z_B − z_A) = 1000 × 9,81 × 0,30 = 2 943 Pa.', 'P_A − P_B = 3 364 + 2 943 = 6 307 Pa = 6,31 kPa : la pression baisse à cause de l’accélération ET de la montée (hypothèses : fluide non visqueux, régime permanent).'],
        pieges: [[DP0, 'Vous avez oublié le terme d’altitude ρ g (z_B − z_A) : le col est surélevé, il faut l’ajouter.'], [(M.deltaP(VA, VB_AFF) - M.pPes(DZ_ALT)) / 1000, 'Le signe du terme d’altitude est faux : monter fait baisser la pression en B, donc l’écart P_A − P_B augmente.'], [M.pPes(DZ_ALT) / 1000, 'Vous n’avez gardé que le terme d’altitude : il faut aussi la variation de pression cinétique.'], [(DP0 * 1000 + M.RHO * DZ_ALT) / 1000, 'Dans ρ g Δz, il faut multiplier par g = 9,81 N·kg⁻¹ (ρ g z est une pression en Pa).']],
        expl: <>P<sub>A</sub> − P<sub>B</sub> = ½ρ(v<sub>B</sub>² − v<sub>A</sub>²) + ρ g (z<sub>B</sub> − z<sub>A</sub>) = 3 364 + 2 943 = 6 307{NB}Pa = <b>6,31{NB}kPa</b>.</>,
        indice: 'P_A − P_B = ½ρ(v_B² − v_A²) + ρ g (z_B − z_A). Calculez chaque terme en pascals (le premier a été trouvé à l’étape précédente : 3,36 kPa), puis additionnez.' } },
    { id: 'venturi', titre: 'L’effet Venturi', focus: ['scene'],
      texte: <>Un <strong>tube de Venturi</strong> est une conduite horizontale munie d’un col et de tubes verticaux ouverts à l’air libre (tubes manométriques) en A et en B. La hauteur h de la colonne de liquide au-dessus de l’axe du tuyau mesure la pression (statique des fluides, vue en première) :{FStat}où P_atm est la pression atmosphérique. On raisonne donc sur la pression relative P − P_atm, celle que lit un tube ouvert. Avec le tuyau horizontal de l’étape 7 (P_A − P_B = 3,36{NB}kPa), la pression est plus faible au col : sa colonne est plus basse. Les deux colonnes sont séparées de Δh, avec P_A − P_B = ρ g Δh (ρ = 1000{NB}kg·m⁻³, g = 9,81{NB}N·kg⁻¹).</>,
      tache: { type: 'num', q: 'Écart Δh entre les deux colonnes, en cm (2 chiffres significatifs)', unite: 'cm', vrai: DH0, tol: 0.05, affiche: v => nbf(v, 0), cs: 2, carnet: 'Écart Δh entre les colonnes',
        calcul: () => ['P_A − P_B = 3,36 kPa = 3 360 Pa et P_A − P_B = ρ g Δh.', 'Δh = frac(P_A − P_B|ρ g) = frac(3 360 Pa|1000 kg·m⁻³ × 9,81 N·kg⁻¹) = 0,34 m = 34 cm : la colonne du col est 34 cm plus basse que celle de l’entrée.'],
        pieges: [[DH0 / 100, 'Vous avez donné Δh en mètres : la réponse est attendue en centimètres.'], [DP0 * 1000 / M.G / 100, 'Vous avez oublié de diviser par ρ : Δh = (P_A − P_B) divisée par ρ g.'], [DP0 * 1000 / M.RHO * 100, 'Vous avez oublié de diviser par g : Δh = (P_A − P_B) divisée par ρ g.']],
        expl: <>Δh = <FormuleEnLigne><mfrac><mrow>{sub('P', 'A')}<mo>−</mo>{sub('P', 'B')}</mrow><mrow>{rho}{g}</mrow></mfrac></FormuleEnLigne> = <FormuleEnLigne><mfrac><mrow><mn>3360</mn></mrow><mrow><mn>1000</mn><mo>×</mo><mn>9,81</mn></mrow></mfrac></FormuleEnLigne> = 0,34{NB}m = 34{NB}cm. Dans un vrai tube de Venturi, la pression ne se rétablit pas complètement après le col (pertes de charge) : ce modèle les néglige.</>,
        indice: 'P_A − P_B = ρ g Δh : isolez Δh (en mètres, avec P en pascals), puis convertissez en centimètres.' } },
    { id: 'reservoir', titre: 'Un réservoir qui se vide', focus: ['scene'],
      retenirTitre: 'Tube de Venturi et colonnes manométriques',
      retenir: <>
        <SvgCarteVenturi/>
        <ul style={ULS}>
          <li><strong>Effet Venturi</strong> : au col, v est plus grande et P plus petite ; la colonne du tube manométrique y est plus basse.</li>
          <li>Les colonnes mesurent la pression : <strong>P − P_atm = ρ g h</strong>, donc <strong>P_A − P_B = ρ g Δh</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« col étroit, colonne basse »</strong>. Idée fausse : « la pression se rétablit exactement après le col ». Vrai : seulement sans frottements (modèle) ; dans un vrai tube, les pertes de charge la rétablissent mal.</li>
        </ul></>,
      texte: <>Un grand réservoir d’eau, ouvert en haut, se vide par un petit orifice B percé dans sa paroi, à la profondeur h = 1,8{NB}m sous la surface A de l’eau. On applique la relation de Bernoulli le long d’une ligne de courant de A à B (écoulement permanent, fluide non visqueux). Les altitudes vérifient z_A − z_B = h. Quelles simplifications de la relation de Bernoulli peut-on faire ?</>,
      tache: { type: 'qcm', q: 'Quelles simplifications entre A et B ?', options: Q.reservoir.options, bonne: 0,
        expl: 'La surface libre et le jet sont à l’air libre : P_A = P_B = P_atm. Le débit se conserve : S_A × v_A = S_B × v_B, et S_A est très grande devant S_B, donc v_A est négligeable devant v_B. Il reste ρ g z_A = ρ g z_B + ½ρ v_B², soit ρ g h = ½ρ v_B². Les pressions ne sont pas nulles : à l’air libre, P = P_atm, pas 0. La vitesse v_A n’égale pas v_B, qui est bien plus grande (section de l’orifice bien plus petite), et c’est le contraire de v_B négligeable.',
        indice: 'Surface libre et orifice sont tous deux ouverts sur l’air. Comparez ensuite la section du réservoir à celle de l’orifice : que dit la conservation du débit pour v_A et v_B ?' } },
    { id: 'torricelli', titre: 'Vitesse de sortie de l’eau', focus: ['scene'],
      texte: <>La surface libre et le jet sortent à l’air libre, à la pression atmosphérique P_atm : P_A = P_B. Le réservoir est large devant l’orifice : la surface descend très lentement et v_A est négligeable devant v_B. Avec z_A − z_B = h et z_A − z_B = h, la relation de Bernoulli devient :{FTorri}Le réservoir contient de l’eau (ρ = 1000{NB}kg·m⁻³) ; la profondeur de l’orifice est h = 1,8{NB}m et g = 9,81{NB}N·kg⁻¹.</>,
      tache: { type: 'num', q: 'Vitesse v_B de sortie de l’eau, en m·s⁻¹ (2 chiffres significatifs)', unite: 'm·s⁻¹', vrai: VT0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2, carnet: 'Vitesse de sortie v_B',
        calcul: () => [<>ρ g h = ½ρ v_B² : ρ se simplifie et v_B² = 2 g h.</>, <>v_B = <FormuleEnLigne><msqrt><mn>2</mn><mo>×</mo><mn>9,81</mn><mo>×</mo><mn>1,8</mn></msqrt></FormuleEnLigne> = <FormuleEnLigne><msqrt><mn>35,3</mn></msqrt></FormuleEnLigne> = 5,9 m·s⁻¹ (environ 21 km·h⁻¹).</>],
        pieges: [[2 * M.G * H_RES, 'Vous n’avez pas pris la racine carrée : on obtient v_B² = 2 g h, pas v_B.'], [Math.sqrt(M.G * H_RES), 'Vous avez oublié le facteur 2 : v_B² = 2 g h.'], [Math.sqrt(M.G * H_RES / 2), 'Le facteur 2 est au mauvais endroit : de ρ g h = ½ρ v_B², on tire v_B² = 2 g h.']],
        expl: <>De ρ g h = ½ρ v_B² : v_B² = 2 g h, soit v_B = {eRacine(<><mn>2</mn><mo>×</mo><mn>9,81</mn><mo>×</mo><mn>1,8</mn></>)} = 5,9{NB}m·s⁻¹, indépendante de ρ : un liquide plus dense ne sortirait pas plus vite.</>,
        indice: 'Simplifiez par ρ pour obtenir v_B² = 2 g h, puis prenez la racine carrée (g = 9,81 N·kg⁻¹ = 9,81 m·s⁻², h = 1,8 m).' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'Vidange d’un réservoir (formule de Torricelli)',
      retenir: <>
        <SvgCarteTorricelli/>
        <ul style={ULS}>
          <li><strong>v² = 2 g h</strong>, soit <FormuleEnLigne><mi>v</mi><mo>=</mo><msqrt><mn>2</mn><mi>g</mi><mi>h</mi></msqrt></FormuleEnLigne>, si la surface libre et le jet sont à l’air libre et si la surface descend très lentement ; elle <strong>ne dépend pas de ρ</strong>.</li>
          <li>Même vitesse qu’en chute libre d’une hauteur h : <strong>« l’eau sort comme une pierre lâchée de la surface »</strong>.</li>
          <li>Idée fausse : « un liquide plus dense sort plus vite ». Vrai : ρ se simplifie dans ρ g h = ½ρ v².</li>
        </ul></>,
      texte: <>Vous savez utiliser la conservation du débit volumique pour trouver une vitesse, lire les trois termes de la relation de Bernoulli (fournie), prévoir puis calculer l’écart de pression dans un col (effet Venturi) et retrouver la vitesse de vidange d’un réservoir. Ces résultats reposent sur des hypothèses précises (fluide incompressible, régime permanent, <strong>pas de viscosité</strong> : voir « Hypothèses de travail ») : ce n’est pas une loi générale. Pour aller plus loin avec les pertes de charge, voyez en terminale technologique « Débits massique et volumique », « Débit et vitesse d’écoulement » et « Circuit hydraulique ». Passez à l’exploration (tuyau, col, dénivelé, trois points de mesure) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'prevoir') setDefi({ ...M.tiragePrevoir(), type, rep: '', rep2: '', rep3: '', verifie: false, essais: 0 });
    else setDefi({ ...M.tirageColonnes(), type, rep: '', rep2: '', rep3: '', verifie: false, essais: 0 });
  };
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const TOL_DEFI = { prevoir: [0.05, 0.06, 0.08], colonnes: [0.05, 0.06, 0.10] };
  const verifier = () => {
    const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a), T = TOL_DEFI[defi.type];
    const att = defi.type === 'prevoir' ? [defi.qVB, defi.qDP, defi.qPB] : [defi.qDP, defi.qVA, defi.qQ];
    const [ok1, ok2, ok3] = [defi.rep, defi.rep2, defi.rep3].map((r, k) => pr(lireNombre(r || ''), att[k], T[k]));
    const ok = ok1 && ok2 && ok3;
    setDefi(d => ({ ...d, verifie: true, ok, ok1, ok2, ok3, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'prevoir' ? noterP : noterC)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite, okCle) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria.replace(/_/g, ' ')} onKeyDown={e => e.key === 'Enter' && document.getElementById('ber-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi[okCle] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['prevoir', 'Prévoir v et P dans un col'], ['colonnes', 'Retrouver un débit (Venturi)']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'prevoir' ? 'Défi : prévoir la vitesse et la pression dans le col d’un tuyau' : 'Défi : retrouver le débit grâce aux tubes manométriques d’un Venturi'}</div>
      {defi.type === 'prevoir' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>De l’eau (ρ = 1000{NB}kg·m⁻³, g = 9,81{NB}N·kg⁻¹) s’écoule en régime permanent, sans pertes de charge, dans un tuyau d’entrée de diamètre d_A = <strong>{defi.dA}{NB}mm</strong> qui se resserre en un col de diamètre d_B = <strong>{defi.dB}{NB}mm</strong>. Le débit vaut Q = <strong>{nbf(defi.q, 0)}{NB}L·min⁻¹</strong>. {defi.dz > 0 ? <>Le col est <strong>{nbf(defi.dz, 2)}{NB}m plus haut</strong> que l’entrée.</> : <>Le tuyau est horizontal.</>} La pression à l’entrée dépasse la pression atmosphérique de <strong>{defi.PrA}{NB}kPa</strong> (P_A − P_atm = {defi.PrA}{NB}kPa). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Vitesse v_B de l’eau dans le col (marge acceptée : 5{NB}%). Gardez un chiffre de plus dans vos calculs intermédiaires.</div>
        {champ('v_B', 'rep', 'm·s⁻¹', 'ok1')}
        <IndiceDefi cache={false}>Convertissez Q en m³·s⁻¹ (1 L = 10⁻³ m³ ; 1 min = 60 s) et d_B en mètres, calculez S_B = π × d_B² divisé par 4, puis v_B = Q divisé par S_B.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Différence de pression P_A − P_B (marge acceptée : 6{NB}%).</div>
        {champ('P_A − P_B', 'rep2', 'kPa', 'ok2')}
        <IndiceDefi cache={false}>Calculez aussi v_A = Q divisé par S_A. Avec z_A = 0 et z_B = {nbf(defi.dz, 2)}{NB}m : P_A − P_B = ½ρ(v_B² − v_A²) + ρ g z_B. Résultat en pascals, à convertir en kPa.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> De combien la pression au col dépasse-t-elle la pression atmosphérique, P_B − P_atm ? (utilisez P_A − P_atm = {defi.PrA}{NB}kPa et le résultat de la question 2 ; marge acceptée : 8{NB}%).</div>
        {champ('P_B − P_atm', 'rep3', 'kPa', 'ok3')}
        <IndiceDefi cache={false}>P_B − P_atm = (P_A − P_atm) − (P_A − P_B) : soustrayez l’écart de pression de la question 2.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un tube de Venturi horizontal (eau, ρ = 1000{NB}kg·m⁻³, g = 9,81{NB}N·kg⁻¹) a une entrée de diamètre d_A = <strong>{defi.dA}{NB}mm</strong> et un col de diamètre d_B = <strong>{defi.dB}{NB}mm</strong>. Des tubes manométriques ouverts indiquent, au-dessus de l’axe du tuyau, <strong>h_A = {nbf(defi.hA, 2)}{NB}m</strong> en A et <strong>h_B = {nbf(defi.hB, 2)}{NB}m</strong> en B (écoulement permanent, sans pertes de charge). Le débit est inconnu : retrouvez-le. Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Écart de pression P_A − P_B (marge acceptée : 5{NB}%). Gardez un chiffre de plus dans vos calculs intermédiaires.</div>
        {champ('P_A − P_B', 'rep', 'kPa', 'ok1')}
        <IndiceDefi cache={false}>Pour chaque tube, P − P_atm = ρ g h : P_A − P_B = ρ g (h_A − h_B). Résultat en pascals, à convertir en kPa.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Vitesse v_A à l’entrée (utilisez le résultat de la question 1 ; marge acceptée : 6{NB}%).</div>
        {champ('v_A', 'rep2', 'm·s⁻¹', 'ok2')}
        <IndiceDefi cache={false}>P_A − P_B = ½ρ(v_B² − v_A²) et la conservation du débit donne v_B = v_A × (d_A divisé par d_B)². Remplacez v_B, puis isolez v_A.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Débit volumique Q, en L·min⁻¹ (marge acceptée : 10{NB}%).</div>
        {champ('Q', 'rep3', 'L·min⁻¹', 'ok3')}
        <IndiceDefi cache={false}>Q = S_A × v_A, avec S_A = π × d_A² divisé par 4 (d_A en mètres) ; 1 m³·s⁻¹ = 60 000 L·min⁻¹.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ber-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : `✗ Pas tout à fait (question 1 ${defi.ok1 ? 'juste' : 'à revoir'}, question 2 ${defi.ok2 ? 'juste' : 'à revoir'}, question 3 ${defi.ok3 ? 'juste' : 'à revoir'}). `}
        {defi.ok || (defi.essais || 0) >= 3
          ? <span style={{ fontWeight: 400 }}>{defi.type === 'prevoir'
            ? `v_B = ${nbf(defi.qVB, 2)} m·s⁻¹ ; P_A − P_B = ${nbf(defi.qDP, 1)} kPa ; P_B − P_atm = ${nbf(defi.qPB, 1)} kPa (v_A = ${nbf(defi.vA, 2)} m·s⁻¹).`
            : `P_A − P_B = ρ g (h_A − h_B) = ${nbf(defi.qDP, 2)} kPa ; v_A = ${nbf(defi.qVA, 2)} m·s⁻¹ ; Q = ${nbf(defi.qQ, 1)} L·min⁻¹.`}</span>
          : <span style={{ fontWeight: 400 }}>Revoyez les conversions (L·min⁻¹ en m³·s⁻¹, mm en m), le carré des diamètres et le signe des écarts, puis vérifiez à nouveau (les indices peuvent vous aider).</span>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Fluide</strong> : de l’eau, <strong>incompressible</strong> (ρ constante). ρ = 1000 kg·m⁻³ est une valeur tabulée usuelle (ordre de grandeur) ; g = 9,81 N·kg⁻¹ ; pression atmosphérique P_atm = 1,01 × 10⁵ Pa (valeur usuelle).</li>
      <li><strong>Écoulement</strong> : <strong>permanent</strong> ; vitesse supposée <strong>uniforme sur chaque section</strong> (vitesse moyenne) ; les points A, B, C sont pris sur la même ligne de courant, l’axe du tuyau.</li>
      <li><strong>Pas de viscosité, pas de pertes de charge</strong> : c’est une <strong>hypothèse du modèle</strong>, pas une loi générale. En réalité, la pression ne se rétablit pas complètement après un col (ici le modèle donne P_C = P_A). Le régime turbulent et les frottements sont hors programme et ne sont pas traités.</li>
      <li><strong>Pas d’échange d’énergie</strong> : ni pompe, ni turbine, ni échange thermique.</li>
      <li><strong>Relation de Bernoulli</strong> : P + ½ρv² + ρgz = constante le long d’une ligne de courant ; elle est fournie, non démontrée. Convention : z est l’altitude, axe vertical orienté vers le haut ; v est la norme de la vitesse (le vecteur est noté vec(v)) ; P est la pression absolue.</li>
      <li><strong>Pressions et tubes manométriques</strong> : les barres montrent P − P_atm (la même constante P_atm est retranchée partout, la somme reste constante). Un tube ouvert indique h = (P − P_atm) divisée par ρ g au-dessus de l’axe. Les réglages sont limités pour que la pression reste supérieure à P_atm au col (aucune aspiration d’air) et la vitesse inférieure à 6 m·s⁻¹ ; la vaporisation de l’eau (cavitation) est hors programme et n’est pas modélisée.</li>
      <li><strong>Valeurs fournies</strong> : les diamètres, vitesses et pressions proposés sont des ordres de grandeur d’un tuyau d’eau et d’un banc d’essai de laboratoire, non des mesures. Les valeurs des panneaux Mesures sont calculées par le modèle.</li>
      <li><strong>Réservoir</strong> : surface libre et jet à P_atm ; la vitesse de la surface est négligée (vérifié : moins de 2 % de v_B pour les orifices proposés) ; le jet suit une parabole (sans frottement de l’air).</li>
      <li><strong>Hors périmètre</strong> : viscosité, nombre de Reynolds, pertes de charge, compressibilité (gaz), cavitation. La simulation TSTL « Circuit hydraulique » traite les pertes de charge.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène du parcours ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const ARIA_TUYAU = 'Un tuyau horizontal dans lequel l’eau s’écoule de la gauche vers la droite, avec des lignes de courant';
  const sceneGuide = (() => {
    if (!enGuide) return null;
    if (idx === I.permanent) return <SceneTuyau p={{ dA: DA, dB: DA, vA: VA }} aria={`${ARIA_TUYAU} : le tuyau a une section constante.`}/>;
    if (idx === I.debit) return <SceneTuyau p={{ dA: DA, dB: DA, vA: VA }} diam={['A']} fleches={['A']} aria={`${ARIA_TUYAU}, de diamètre 20 millimètres ; le vecteur vitesse est représenté.`}/>;
    if (idx === I.conservation) return <SceneTuyau p={{ dA: DA, dB: DB, vA: VA }} diam={['A', 'B']} fleches={['A']} noms={['A', 'B']} aria={`${ARIA_TUYAU}, qui passe de 20 à 12 millimètres de diamètre au point B ; le vecteur vitesse en A est représenté.`}/>;
    if (idx === I.prevoir) return <SceneTuyau p={{ dA: 40, dB: 20, vA: 0.5 }} diam={['A', 'B']} noms={['A', 'B']} aria={`${ARIA_TUYAU}, qui passe de 40 à 20 millimètres de diamètre : le diamètre est divisé par 2.`}/>;
    if (idx === I.venturi) return <SceneTuyau p={{ dA: DA, dB: DB, vA: VA, PrA: PRA }} tubes={['A', 'B']} noms={['A', 'B']} diam={['A', 'B']} repereA aria="Un tube de Venturi horizontal avec deux tubes manométriques ouverts en A et en B : la colonne de liquide est plus basse en B, dans le col, qu’en A. Un trait pointillé prolonge le niveau de la colonne en A."/>;
    if (idx === I.altitude) return <SceneTuyau p={{ dA: DA, dB: DB, vA: VA, dz: DZ_ALT }} diam={['A', 'B']} noms={['A', 'B']} axeZ aria={`${ARIA_TUYAU}, dont le col B est 0,30 mètre plus haut que l’entrée A ; l’axe z = 0 passe par l’entrée.`}/>;
    if (idx === I.reservoir || idx === I.torricelli || idx === I.bilan) return <SceneReservoir h={H_RES} dOr={10} airLibre={idx !== I.reservoir} aria="Un réservoir ouvert rempli d’eau, dont l’eau sort par un orifice B situé à 1,8 mètre sous la surface libre A ; le jet est dessiné avec son vecteur vitesse."/>;
    return <SceneTuyau p={{ dA: DA, dB: DB, vA: VA }} diam={['A', 'B']} fleches={['A', 'B']} noms={['A', 'B']} aria={`${ARIA_TUYAU}, qui passe de 20 à 12 millimètres de diamètre au point B ; les vecteurs vitesse en A et en B sont à l’échelle.`}/>;
  })();
  const boxSceneGuide = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  // ---------- scène du défi ----------
  const sceneDefi = dd && (dd.type === 'prevoir'
    ? <SceneTuyau p={{ dA: dd.dA, dB: dd.dB, vA: 1, dz: dd.dz }} diam={['A', 'B']} noms={['A', 'B']} axeZ aria={`Un tuyau d’eau de diamètre ${dd.dA} millimètres à l’entrée A qui se resserre en un col B de diamètre ${dd.dB} millimètres${dd.dz > 0 ? `, situé ${nbf(dd.dz, 2)} mètre plus haut que l’entrée` : ''}.`}/>
    : <SceneTuyau p={{ dA: dd.dA, dB: dd.dB, vA: dd.qVA, PrA: dd.hA * M.RHO * M.G }} tubes={['A', 'B']} noms={['A', 'B']} diam={['A', 'B']} valeursH={{ A: dd.hA, B: dd.hB }} courant={false} aria={`Un tube de Venturi horizontal avec deux tubes manométriques : la colonne mesure ${nbf(dd.hA, 2)} mètre en A et ${nbf(dd.hB, 2)} mètre en B.`}/>);

  // ---------- exploration ----------
  const pEx = { dA: ex.dA, dB: ex.dB, vA: ex.vA, dz: ex.dz, PrA: ex.PrA };
  const VEx = M.pointsVenturi(pEx);
  const okReglage = cle => o => M.valide({ ...pEx, [cle]: o });
  const maj = f => setEx(s => ({ ...s, ...f }));
  const retablir = () => setEx(s => ({ ...s, ...M.REGLAGE_DEPART }));
  const kPa = x => nbf(x / 1000, 2);
  const tabMesures = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Valeurs calculées en A, B et C à partir des réglages. P est la pression absolue ; h est la hauteur de la colonne du tube manométrique au-dessus de l’axe du tuyau.</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, color: KIT.txt }}>
          <thead><tr style={{ textAlign: 'right', color: KIT.txt2 }}><th style={{ textAlign: 'left', padding: '4px 4px' }}> </th>{VEx.pts.map(q => <th key={q.nom} style={{ padding: '4px 4px' }}>{q.nom}</th>)}</tr></thead>
          <tbody>
            {[['Diamètre d (mm)', q => nbf(q.d, 0)], ['Section S (cm²)', q => nbf(q.S * 1e4, 2)], ['Vitesse v (m·s⁻¹)', q => nbf(q.v, 2)], ['Altitude z (m)', q => nbf(q.z, 2)], ['Pression P (kPa)', q => nbf(q.P / 1000, 1)], ['Colonne h (m)', q => nbf(q.h, 2)]].map(([n, f]) =>
              <tr key={n} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '5px 4px', color: KIT.txt2, fontWeight: 600 }}>{n}</td>{VEx.pts.map(q => <td key={q.nom} style={{ padding: '5px 4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{f(q)}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <LigneMesure nom="Débit volumique Q" valeur={`${sciFr(VEx.q, 3)}${NB}m³·s⁻¹`} couleur="#b45309"/>
      <LigneMesure nom="Q en litres par minute" valeur={`${nbf(M.lmin(VEx.q), 1)}${NB}L·min⁻¹`} couleur="#b45309"/>
      <LigneMesure nom="Somme P − P_atm + ½ρv² + ρgz, la même en A, B et C" valeur={`${kPa(VEx.constante)}${NB}kPa`} couleur={BLEU}/>
    </div>);
  const hR = ex.hR, dOr = ex.dOr, vR = M.torricelli(hR), qR = M.aire(dOr) * vR, vSurf = M.vSurface(hR, dOr, M.D_RESERVOIR);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages du tube de Venturi</div>
      <div style={aide}>Choisissez les diamètres, la vitesse d’entrée, la pression et l’altitude du col. Les valeurs qui feraient sortir du domaine du modèle (pression trop faible au col ou vitesse supérieure à 6 m·s⁻¹) sont grisées.</div>
      <Section titre={`Tuyau : entrée ${ex.dA} mm · col ${ex.dB} mm`} ouvert={ouv.tuyau} onBascule={() => setOuv(o => ({ ...o, tuyau: !o.tuyau }))}>
        <div style={aide}>{avecIndices('Le diamètre de l’entrée (A) et celui du col (B) fixent les sections S_A et S_B ; la sortie (C) a le même diamètre que l’entrée.')}</div>
        <Choix nom="Diamètre d_A à l’entrée" valeur={ex.dA} options={M.MENUS.dA} format={v => `${v} mm`} onChange={v => maj({ dA: v })} ok={okReglage('dA')}/>
        <Choix nom="Diamètre d_B du col" valeur={ex.dB} options={M.MENUS.dB} format={v => `${v} mm`} onChange={v => maj({ dB: v })} ok={okReglage('dB')}/>
      </Section>
      <Section titre={`Écoulement : vitesse d’entrée ${nbf(ex.vA, 1)} m·s⁻¹ · Q = ${nbf(M.lmin(VEx.q), 1)} L·min⁻¹`} ouvert={ouv.ecoul} onBascule={() => setOuv(o => ({ ...o, ecoul: !o.ecoul }))}>
        <div style={aide}>{avecIndices('La vitesse à l’entrée fixe le débit Q = S_A × v_A, puis les vitesses ailleurs (conservation du débit).')}</div>
        <Choix nom="Vitesse v_A à l’entrée" valeur={ex.vA} options={M.MENUS.vA} format={v => `${nbf(v, 1)} m·s⁻¹`} onChange={v => maj({ vA: v })} ok={okReglage('vA')}/>
      </Section>
      <Section titre={`Pression et altitude : ${nbf(ex.PrA / 1000, 0)} kPa · col ${nbf(ex.dz, 2)} m`} ouvert={ouv.pression} onBascule={() => setOuv(o => ({ ...o, pression: !o.pression }))}>
        <div style={aide}>La pression à l’entrée est donnée au-dessus de la pression atmosphérique. Monter le col de dz fait intervenir le terme ρ g z de la relation de Bernoulli.</div>
        <Choix nom="Pression P_A − P_atm à l’entrée" valeur={ex.PrA} options={M.MENUS.PrA} format={v => `${nbf(v / 1000, 0)} kPa`} onChange={v => maj({ PrA: v })} ok={okReglage('PrA')}/>
        <Choix nom="Altitude z_B du col (au-dessus de l’entrée)" valeur={ex.dz} options={M.MENUS.dz} format={v => `${nbf(v, 2)} m`} onChange={v => maj({ dz: v })} ok={okReglage('dz')}/>
      </Section>
      <button onClick={retablir} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir les réglages de départ</button>
    </div>);
  const sceneEx = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>Une eau circule de gauche à droite dans un tube à section variable (A : entrée, B : col, C : sortie). Les tubes verticaux ouverts à l’air libre mesurent la pression ; les flèches orange sont les vecteurs vitesse, à l’échelle. Les colonnes ont une échelle propre à chaque réglage (la plus haute remplit le tube) : comparez-les entre elles, pas d’un réglage à l’autre.</div>
      <SceneTuyau p={pEx} tubes={['A', 'B', 'C']} noms={['A', 'B', 'C']} diam={['A', 'B', 'C']} fleches axeZ aria={`Un tube à section variable avec trois tubes manométriques ouverts, en A (entrée, diamètre ${ex.dA} mm), B (col, ${ex.dB} mm) et C (sortie). Hauteurs des colonnes : ${nbf(VEx.pts[0].h, 2)} m en A, ${nbf(VEx.pts[1].h, 2)} m en B, ${nbf(VEx.pts[2].h, 2)} m en C ; vitesses : ${nbf(VEx.pts[0].v, 2)}, ${nbf(VEx.pts[1].v, 2)} et ${nbf(VEx.pts[2].v, 2)} mètres par seconde.`}/>
    </div>);
  const barresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Les trois termes de la relation de Bernoulli</div>
      <div style={aide}>En chaque point, les trois pressions s’empilent : leur somme est la même en A, B et C (trait pointillé).</div>
      <BarresBernoulli p={pEx} aria={`Barres empilées en A, B et C : pression P moins P atm, terme rho g z et pression cinétique un demi rho v au carré, dont la somme vaut ${kPa(VEx.constante)} kilopascals aux trois points.`}/>
    </div>);
  const reservoirEx = enExplore && (
    <Section titre={`Réservoir qui se vide : h = ${nbf(hR, 1)} m · orifice ${dOr} mm`} ouvert={ouv.reservoir} onBascule={() => setOuv(o => ({ ...o, reservoir: !o.reservoir }))}>
      <div style={aide}>Un réservoir ouvert se vide par un orifice B, à la profondeur h sous la surface libre A. La relation de Bernoulli donne la vitesse de sortie (formule de Torricelli).</div>
      <SceneReservoir h={hR} dOr={dOr} aria={`Un réservoir ouvert d’eau avec un orifice de ${dOr} millimètres à ${nbf(hR, 1)} mètre sous la surface libre ; vitesse de sortie ${nbf(vR, 2)} mètres par seconde.`}/>
      <Choix nom="Profondeur h de l’orifice" valeur={hR} options={M.HAUTEURS_RESERVOIR} format={v => `${nbf(v, 1)} m`} onChange={v => maj({ hR: v })} ok={() => true}/>
      <Choix nom="Diamètre de l’orifice" valeur={dOr} options={M.ORIFICES} format={v => `${v} mm`} onChange={v => maj({ dOr: v })} ok={() => true}/>
      <LigneMesure nom="Vitesse de sortie v_B" valeur={`${nbf(vR, 2)}${NB}m·s⁻¹`} couleur={BLEU}/>
      <LigneMesure nom="Débit de sortie Q" valeur={`${nbf(M.lmin(qR), 2)}${NB}L·min⁻¹`}/>
      <LigneMesure nom="Vitesse de descente de la surface (réservoir de 400 mm)" valeur={`${nbf(vSurf * 1000, 2)}${NB}mm·s⁻¹`}/>
      <div style={aide}>{avecIndices('La surface descend bien plus lentement que l’eau ne sort : v_A est négligeable devant v_B, comme le suppose la formule.')}</div>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>{avecIndices('Diminuez le diamètre du col : comment changent la vitesse v_B, la colonne en B et l’écart avec la colonne en A ?')}</li>
        <li>Choisissez un col plus large que l’entrée : la pression au col devient-elle plus grande ou plus petite qu’en A ?</li>
        <li>Comparez la hauteur de la colonne en C et en A : que dit le modèle ? Qu’observerait-on dans un vrai tube (pertes de charge) ?</li>
        <li>{avecIndices('Soulevez le col (altitude z_B) : la somme des trois barres change-t-elle ? Quelle barre se modifie en B ?')}</li>
        <li>Doublez la vitesse d’entrée : par combien est multipliée la pression cinétique ? Et l’écart de pression A–B ?</li>
        <li>Dans le réservoir, doublez h : par combien la vitesse de sortie est-elle multipliée ? Et si on change le diamètre de l’orifice ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Débit volumique : {eQ} ; conservation : {eCons}</li>
          <li>Relation de Bernoulli (fournie) : {eBernGen} le long d’une ligne de courant</li>
          <li>Conduite horizontale : {eDeltaP}</li>
          <li>Tubes manométriques : {eStat} ; écart entre deux colonnes : P_A − P_B = ρ g Δh</li>
          <li>Vidange d’un réservoir : {eTorri}, soit {eVT}</li>
          <li>Hypothèses : fluide incompressible, régime permanent, sans viscosité, sans pompe ni turbine</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ber-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ber-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ber-col { display: flex; flex-direction: column; gap: 12px; }
        .ber-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .ber-l1.cote .ber-carte { order: 2; } .ber-l1.cote .ber-main { order: 1; }
          .ber-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .ber-ex > * { grid-column: 1; } .ber-ex > .ber-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .ber-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ber-in { animation: ber-fondu 0.35s ease-out; } @keyframes ber-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Écoulement d’un fluide : débit, relation de Bernoulli, effet Venturi</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>De l’eau qui s’écoule dans un tuyau se déplace plus vite dans une partie étroite{(enGuide && !deja('termes')) ? '.' : <> ; la relation de Bernoulli (fournie) relie alors pression, vitesse et altitude le long d’une ligne de courant.</>}</div>
      {!enExplore && <div className="ber-l1 cote">
        {enGuide ? <div className="ber-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ber-carte">{panneauHypo}</div> : null}
        <div className="ber-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'prevoir' ? suiviP : suiviC}/></div>}
          <div className="ber-col">
            {boxSceneGuide && <div className="ber-in">{boxSceneGuide}</div>}
            {enDefi && defi && <div className="ber-in"><div style={styleBoite}>{sceneDefi}</div></div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="ber-ex">
        <div>{sceneEx}</div>
        <div className="ber-ctrl">{reglagesEx}</div>
        <div>{barresEx}</div>
        <div>{tabMesures}</div>
        <div>{reservoirEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
