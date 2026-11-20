import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./iccModele";
import { QCM_PARCOURS as Q } from "./iccQcm";
import { SvgCylindre, SvgPesees, SvgHisto, SvgComparaison, SvgCartePythagore, SvgCarteDominant, SvgCarteMonteCarlo, SvgCarteEcriture, SvgCarteZ, SvgCarteQueFaire, COLI } from "./iccSchemas";

const SIM_ID = 185, CLE_GUIDE = 'incertitudes-composees-tg-guide-v1';
declarerDefis(SIM_ID, [['principal', 'Composer les incertitudes et comparer à la référence']]);

// ====================================================
// SIM 185 — INCERTITUDES-TYPES COMPOSÉES ET COMPARAISON À UNE VALEUR DE RÉFÉRENCE
//  (TG spé PC, rubrique « Mesure et incertitudes »).
//  Capacités visées (jamais affichées à l'élève) : évaluer, à l'aide d'une formule fournie, l'incertitude-type d'une grandeur s'exprimant en fonction d'autres grandeurs
//  d'incertitudes-types connues ; capacité numérique : simuler un processus aléatoire illustrant la détermination d'une grandeur avec incertitudes-types composées ;
//  écrire le résultat avec un nombre adapté de chiffres significatifs ; comparer le résultat à une valeur de référence avec |m_mes − m_ref| / u(m).
//  Modèle : iccModele.js (test : iccModele.test.mjs). Hypothèses : voir l'en-tête du modèle et le panneau « Hypothèses de travail ».
// ====================================================

const nbf = (v, d = 2) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const A = M.parcoursCas(false), B = M.parcoursCas(true);
const IDS = ['situation', 'diff', 'rel', 'abs', 'dominant', 'mc', 'N', 'loi', 'ecriture', 'compare', 'amelio', 'conclu', 'bilan'];
const DEC = { rho: [3, 3], res: [1, 2] };               // décimales d'affichage de la valeur calculée et de u (Mesures et exploration)
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const fN = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const ecr = r => r.texte;

// ---------- calcul d'un tirage complet, gardé en mémoire (N = 100 000 reste instantané d'un rendu à l'autre) ----------
const CACHE = new Map();
function simuler(sit, vals, loi, N, graine) {
  const cle = [sit.id, loi, N, graine, ...sit.grandeurs.map(g => `${vals[g.id].val}/${vals[g.id].u}`)].join('|');
  if (!CACHE.has(cle)) {
    if (CACHE.size > 12) CACHE.delete(CACHE.keys().next().value);
    const v = M.tirages(sit, vals, loi, N, graine), G = M.G0(sit, vals), uF = M.uFormule(sit, vals);
    CACHE.set(cle, { v, G, uF, h: M.histogramme(v, G, uF), sd: M.ecartType(v), moy: M.moyenne(v) });
  }
  return CACHE.get(cle);
}

// ---------- formules (MathML) ----------
const mi = t => <mi>{t}</mi>;
const sub = (a, b) => <msub><mi>{a}</mi><mn>{b}</mn></msub>;
const U = x => <><mi>u</mi><mo>(</mo>{x}<mo>)</mo></>;
const carre = x => <msup><mrow><mo>(</mo>{x}<mo>)</mo></mrow><mn>2</mn></msup>;
const fr = (a, b) => <mfrac><mrow>{a}</mrow><mrow>{b}</mrow></mfrac>;
const FDiff = <Formule>{U(mi('m'))}<mo>=</mo><msqrt><mrow>{carre(U(sub('m', 1)))}<mo>+</mo>{carre(U(sub('m', 2)))}</mrow></msqrt></Formule>;
const FQuot = <Formule>{fr(U(mi('ρ')), mi('ρ'))}<mo>=</mo><msqrt><mrow>{carre(mi('A'))}<mo>+</mo>{carre(mi('B'))}<mo>+</mo>{carre(mi('C'))}</mrow></msqrt></Formule>;
const FQuotDef = <Formule>{mi('A')}<mo>=</mo>{fr(U(mi('m')), mi('m'))}<mtext>{'\u00a0\u00a0;\u00a0\u00a0'}</mtext>{mi('B')}<mo>=</mo><mn>2</mn>{fr(U(mi('d')), mi('d'))}</Formule>;
const FQuotDef2 = <Formule>{mi('C')}<mo>=</mo>{fr(U(mi('h')), mi('h'))}</Formule>;
const FRho = <Formule>{mi('ρ')}<mo>=</mo>{fr(<><mn>4</mn><mi>m</mi></>, <><mi>π</mi><msup><mi>d</mi><mn>2</mn></msup><mi>h</mi></>)}</Formule>;
const FZ = <Formule><mi>z</mi><mo>=</mo>{fr(<><mo>|</mo><msub><mi>ρ</mi><mtext>mes</mtext></msub><mo>−</mo><msub><mi>ρ</mi><mtext>ref</mtext></msub><mo>|</mo></>, U(mi('ρ')))}</Formule>;
const FRelAbs = <Formule>{fr(U(mi('G')), mi('G'))}<mo>=</mo><msqrt><mrow>{carre(fr(U(mi('x')), mi('x')))}<mo>+</mo>{carre(fr(U(mi('y')), mi('y')))}</mrow></msqrt></Formule>;
void FRelAbs;

const COLONNE_TXT = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };

// ====================================================
export function SimulationIncertitudesComposees() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ regl: false, mes: false, python: false, essayer: false, retenir: false });
  const [gm, setGm] = useState({ lance: false, N: M.N_DEFAUT, graine: 1, loi: 'normale', loiChoisie: false });       // simulation du parcours guidé
  const [ex, setEx] = useState({ sit: 'rho', N: M.N_DEFAUT, loi: 'normale', graine: 1, us: {} });                      // exploration
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)], rang = id => IDS.indexOf(id);

  // ---------- exploration : valeurs courantes ----------
  const sitE = M.SITUATIONS[ex.sit], valsE = M.valsDe(sitE);
  sitE.grandeurs.forEach(g => { if (ex.us[g.id] != null) valsE[g.id] = { val: g.val, u: ex.us[g.id] }; });
  const simE = simuler(sitE, valsE, ex.loi, ex.N, ex.graine);
  const [dG, dU] = DEC[ex.sit];
  const uRelE = M.uRelFormule(sitE, valsE), contribE = M.contributions(sitE, valsE).sort((a, b) => b.part - a.part);
  const ecritE = M.resultat(simE.G, simE.uF, sitE.unite), zE = M.zDe(simE.G, sitE.ref, simE.uF);
  const setU = (id, u) => setEx(s => ({ ...s, us: { ...s.us, [id]: u } }));
  const lancer = () => setEx(s => ({ ...s, graine: s.graine + 1 }));

  // ---------- parcours guidé : simulation (cas A : règle graduée) ----------
  const simG = gm.lance ? simuler(A.sit, A.vals, gm.loi, gm.N, gm.graine) : null;
  const lancerG = () => setGm(s => ({ ...s, lance: true, graine: s.graine + 1 }));

  // ---------- étapes du parcours ----------
  const ETAPES_BRUT = [
    { id: 'situation', titre: 'Une grandeur calculée à partir de mesures',
      texte: <>On veut identifier le métal d’un cylindre en calculant sa masse volumique à partir de trois mesures : sa masse m, son diamètre d et sa hauteur h.{FRho}Valeurs mesurées : m = 69,0{NB}g ; d = 2,00{NB}cm ; h = 8,00{NB}cm. Chaque mesure a sa propre incertitude-type u. Ici, elles seront données.</>,
      tache: { type: 'qcm', q: 'La masse volumique ρ est calculée à partir de m, d et h. Que peut-on dire de son incertitude-type u(ρ) ?', ...Q.situation,
        expl: 'Chaque grandeur mesurée apporte sa propre incertitude, qui se répercute sur le résultat calculé : u(ρ) dépend des trois. Elle n’est pas égale à la somme u(m) + u(d) + u(h), qui additionnerait des grammes et des centimètres ; elle n’est pas nulle (un résultat calculé hérite des incertitudes des mesures) ; et elle ne dépend pas de la seule balance : d et h comptent aussi.',
        indice: 'ρ est calculée avec des valeurs qui ont chacune une incertitude : que devient l’incertitude du résultat ?' } },
    { id: 'diff', titre: 'La somme et la différence',
      texte: <>La masse m n’est pas lue directement : on pèse la coupelle seule, m₁ = 12,4{NB}g, puis la coupelle avec le cylindre, m₂ = 81,4{NB}g, et m = m₂ − m₁ = 69,0{NB}g. Chaque pesée a une incertitude-type u = 0,03{NB}g (type B : balance de résolution 0,1{NB}g, demi-largeur a = 0,05{NB}g, u = frac(a|√3) ≈ 0,029{NB}g, arrondie par excès). On suppose les deux pesées indépendantes. Pour une somme ou une différence de grandeurs indépendantes, la formule fournie est :{FDiff}</>,
      tache: { type: 'num', carnet: false, q: 'Calculez u(m), en g (2 chiffres significatifs)', unite: 'g', vrai: M.uSomme([0.03, 0.03]), tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['Hypothèse : les deux pesées sont indépendantes (l’arrondi de l’affichage d’une pesée ne dépend pas de l’autre).', 'u(m) = √(u(m₁)² + u(m₂)²) = √(0,03² + 0,03²) = √0,0018.', `u(m) = ${nbf(M.uSomme([0.03, 0.03]), 3)} g : l’incertitude de la différence est plus grande que celle d’une pesée, mais plus petite que la somme 0,06 g.`],
        pieges: [[0.06, 'Vous avez additionné les incertitudes : pour des grandeurs indépendantes, elles se composent en quadrature (racine de la somme des carrés).'], [0.03, 'Vous avez gardé l’incertitude d’une seule pesée : les deux pesées interviennent.'], [0.0018, 'Il manque la racine carrée : 0,0018 est la somme des carrés.']],
        expl: `u(m) = √(0,03² + 0,03²) = ${nbf(M.uSomme([0.03, 0.03]), 3)} g.`,
        indice: 'Élevez chaque incertitude au carré, additionnez, puis prenez la racine carrée.' } },
    { id: 'rel', titre: 'Le produit et le quotient',
      texte: <>On retient u(m) = 0,042{NB}g. Le diamètre et la hauteur sont mesurés à la règle graduée au millimètre : demi-graduation a = 0,05{NB}cm, soit u = frac(a|√3) ≈ 0,029{NB}cm, arrondie par excès : u(d) = 0,03{NB}cm et u(h) = 0,03{NB}cm. Valeurs mesurées : m = 69,0{NB}g ; d = 2,00{NB}cm ; h = 8,00{NB}cm. Les trois mesures sont indépendantes. Comme ρ est un produit et un quotient, la formule fournie porte sur les incertitudes <strong>relatives</strong> ; le facteur 2 vient de l’exposant de d dans ρ :{FQuot}avec :{FQuotDef}{FQuotDef2}</>,
      tache: { type: 'num', carnet: false, q: 'Calculez l’incertitude relative frac(u(ρ)|ρ), en % (2 chiffres significatifs)', unite: '%', vrai: 100 * M.uRelFormule(A.sit, A.vals), tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Rapports : frac(u(m)|m) = frac(0,042|69,0) = 0,061 % ; 2 frac(u(d)|d) = 2 × frac(0,03|2,00) = 3,0 % ; frac(u(h)|h) = frac(0,03|8,00) = 0,375 %.', `Composition : √(0,061² + 3,0² + 0,375²) % = ${nbf(100 * M.uRelFormule(A.sit, A.vals), 2)} %.`, 'Le terme du diamètre est de loin le plus grand : il fixe presque à lui seul le résultat.'],
        pieges: [[100 * Math.sqrt(0.042 ** 2 / 69 ** 2 + (0.03 / 2) ** 2 + (0.03 / 8) ** 2), 'Vous avez oublié le facteur 2 : d est élevé au carré dans ρ, son incertitude relative compte deux fois.'], [100 * (0.042 / 69 + 0.06 / 2 + 0.03 / 8), 'Vous avez additionné les incertitudes relatives : elles se composent en quadrature (racine de la somme des carrés).'], [M.uRelFormule(A.sit, A.vals), 'C’est l’incertitude relative en valeur décimale : elle est demandée en pourcentage (multipliez par 100).']],
        expl: `frac(u(ρ)|ρ) = √(0,061² + 3,0² + 0,375²) % = ${nbf(100 * M.uRelFormule(A.sit, A.vals), 1)} %.`,
        indice: 'Calculez les trois rapports u sur la valeur (le deuxième avec le facteur 2), mettez-les au carré, additionnez, puis prenez la racine carrée.' } },
    { id: 'abs', titre: 'Composer les incertitudes-types',
      texte: <>La valeur calculée est ρ = {fr_t('4 × 69,0', 'π × 2,00² × 8,00')} = 2,7454{NB}g/cm³ (calculatrice), et l’incertitude relative trouvée à l’étape précédente est frac(u(ρ)|ρ) ≈ 0,0302. On garde les chiffres de la calculatrice : on n’arrondit qu’à l’écriture finale.</>,
      tache: { type: 'num', carnet: false, q: 'Calculez l’incertitude-type u(ρ), en g/cm³ (2 chiffres significatifs)', unite: 'g/cm³', vrai: A.u, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => [`u(ρ) = ρ × frac(u(ρ)|ρ) = 2,7454 × ${nbf(M.uRelFormule(A.sit, A.vals), 4)} = ${nbf(A.u, 4)} g/cm³.`, 'On repasse de l’incertitude relative à l’incertitude-type en multipliant par la valeur calculée.'],
        pieges: [[100 * M.uRelFormule(A.sit, A.vals), 'C’est l’incertitude relative en % : multipliez l’incertitude relative (0,0302) par la valeur ρ pour obtenir u(ρ) en g/cm³.'], [M.uRelFormule(A.sit, A.vals), 'C’est l’incertitude relative : multipliez-la par ρ = 2,7454 g/cm³.']],
        expl: `u(ρ) = 2,7454 × ${nbf(M.uRelFormule(A.sit, A.vals), 4)} = ${nbf(A.u, 3)} g/cm³.`,
        indice: 'u(ρ) = ρ multiplié par l’incertitude relative.' } },
    { id: 'dominant', titre: 'Quelle grandeur améliorer ?',
      retenirTitre: 'Composer les incertitudes-types', retenir: <>
        <SvgCartePythagore/>
        <ul style={UL}>
          <li>Somme ou différence : <strong>u(G)² = u(x)² + u(y)²</strong>. Produit ou quotient : on compose les incertitudes <strong>relatives</strong> ; un exposant p multiplie frac(u(x)|x) par |p|.</li>
          <li>Moyen de s’en souvenir : <strong>« Pythagore : on additionne les carrés »</strong>. Idée fausse : « u(G) = u(x) + u(y) ». Vrai : u(G) est plus petite que la somme.</li>
        </ul></>,
      texte: <>Pour améliorer le protocole, on ne peut changer qu’un seul instrument. Rappel des données : m = 69,0{NB}g avec u(m) = 0,042{NB}g ; d = 2,00{NB}cm avec u(d) = 0,03{NB}cm (règle graduée) ; h = 8,00{NB}cm avec u(h) = 0,03{NB}cm (règle graduée). ρ est proportionnelle à <FormuleEnLigne>{fr(mi('m'), <><msup><mi>d</mi><mn>2</mn></msup><mi>h</mi></>)}</FormuleEnLigne>.</>,
      tache: { type: 'qcm', q: 'Pour réduire le plus u(ρ), quelle grandeur faut-il mesurer avec un meilleur instrument ?', ...Q.dominant,
        expl: 'Les trois termes valent 0,06 % (masse), 3,0 % (diamètre, comptée deux fois à cause de l’exposant 2) et 0,38 % (hauteur) : en quadrature, le diamètre fournit plus de 98 % de la somme des carrés. Améliorer la balance (0,06 %) ou la hauteur (0,38 %) ne change presque rien ; les trois ne pèsent pas autant. Ce n’est pas la grandeur la plus grande (h) qui domine, mais celle dont l’incertitude relative pondérée est la plus grande.',
        indice: 'Comparez les trois termes u sur la valeur, le deuxième avec le facteur 2, et regardez lequel est le plus grand.' } },
    { id: 'mc', titre: 'Simuler un processus aléatoire',
      retenirTitre: 'Le plus grand terme domine', retenir: <>
        <SvgCarteDominant/>
        <ul style={UL}>
          <li>Les termes se composent en quadrature : <strong>le plus grand domine</strong>, les petits deviennent négligeables.</li>
          <li>Moyen de s’en souvenir : <strong>« on améliore le plus gros terme »</strong>. Idée fausse : « il faut tout mesurer avec le meilleur instrument ». Vrai : un instrument plus précis sur un petit terme ne sert presque à rien.</li>
        </ul></>,
      texte: <>Autre façon de trouver u(ρ) : <strong>simuler</strong>. À chaque tirage, l’ordinateur choisit au hasard une valeur de m, de d et de h autour des valeurs mesurées (hypothèse : loi normale, écart-type égal à u, grandeurs indépendantes), puis calcule ρ. Avec N tirages, on obtient N valeurs de ρ, dont on trace l’histogramme. On reprend le cas de la règle graduée : u(ρ) = {nbf(A.u, 3)}{NB}g/cm³ d’après la formule.</>,
      tache: { type: 'action', ok: gm.lance, label: `Lancer N = ${fN(1000)} tirages`, faire: () => setGm(s => ({ ...s, lance: true, N: 1000, graine: s.graine + 1 })) } },
    { id: 'N', titre: 'Combien de tirages ?',
      texte: <>Le menu « Nombre de tirages N » propose 10, 100, 1 000 et 100 000 tirages, et « Relancer » refait un nouveau tirage au hasard. Essayez N = 10 puis N = 100 000, en relançant plusieurs fois, et observez l’écart-type des tirages (en bas du graphique), à comparer à u(ρ) = {nbf(A.u, 3)}{NB}g/cm³.</>,
      tache: { type: 'qcm', q: 'Quand N augmente (en relançant plusieurs fois), que devient l’écart-type des tirages ?', ...Q.N,
        expl: `Pour N petit, l’écart-type change beaucoup d’un essai à l’autre ; quand N grandit, il se stabilise près de la valeur de la formule, ${nbf(A.u, 3)} g/cm³. Il ne tend pas vers 0 : N est le nombre de tirages simulés, pas le nombre de mesures ; plus de tirages précisent l’estimation de u(ρ), ils ne rendent pas la mesure plus précise. Il n’augmente pas non plus avec N, et il ne vaut pas toujours ${nbf(A.u, 3)} g/cm³ : pour N = 10, il fluctue.`,
        indice: 'Relancez plusieurs fois avec N = 10, puis avec N = 100 000 : l’écart-type varie-t-il autant d’un essai à l’autre ?' } },
    { id: 'loi', titre: 'La loi des tirages',
      texte: <>Jusqu’ici, chaque grandeur est tirée selon une loi normale. On peut aussi la tirer selon une loi <strong>rectangulaire</strong> (toutes les valeurs d’un intervalle équiprobables) de même écart-type u : la demi-largeur vaut alors a = √3 × u. Choisissez la loi dans le menu « Loi des tirages », avec N = 100 000, et comparez les deux histogrammes.</>,
      tache: { type: 'qcm', q: 'Quand on passe de la loi normale à la loi rectangulaire, avec le même u pour chaque grandeur, que change-t-on ?', ...Q.loi,
        expl: 'La loi des tirages est un modèle : elle change la forme de l’histogramme (ici, avec le diamètre qui domine, le sommet devient plus plat). L’écart-type des tirages reste proche de u(ρ), car les deux lois ont été choisies avec le même écart-type u, et la formule de composition ne contient que les incertitudes-types, pas la loi. L’écart-type n’est donc pas doublé, et l’histogramme ne reste pas toujours en forme de cloche.',
        indice: 'Les deux lois ont le même écart-type u. Qu’est-ce qui peut alors différer entre les deux histogrammes ?' } },
    { id: 'ecriture', titre: 'Écrire le résultat',
      retenirTitre: 'Simuler un processus aléatoire', retenir: <>
        <SvgCarteMonteCarlo/>
        <ul style={UL}>
          <li><strong>Tirer au hasard, calculer, recommencer N fois</strong> : l’écart-type des N valeurs de G donne u(G) (si les incertitudes relatives sont petites).</li>
          <li>Moyen de s’en souvenir : <strong>« N tirages ≠ N mesures »</strong>. Idée fausse : « avec 100 000 tirages, la mesure est plus précise ». Vrai : on estime mieux u(G), on ne la réduit pas.</li>
          <li>La loi des tirages (normale, rectangulaire…) est un modèle : elle change la forme de l’histogramme, pas l’écart-type choisi.</li>
        </ul></>,
      texte: <>Sur la calculatrice : ρ = 2,7454{NB}g/cm³ et u(ρ) = 0,0830{NB}g/cm³. Règles de la classe (celles de première) : u s’écrit avec <strong>1 chiffre significatif, arrondie par excès</strong> (2 chiffres si le premier est 1), pour ne pas sous-estimer l’incertitude ; la valeur est arrondie à <strong>la même décimale</strong> que u ; l’unité est toujours écrite.</>,
      tache: { type: 'qcm', q: 'Quelle écriture du résultat respecte ces règles ?', ...Q.ecriture,
        expl: 'u = 0,0830 s’arrondit par excès à 0,09 (un seul chiffre significatif : 0,09), donc ρ s’écrit avec deux décimales : 2,75 (de 2,7454), et l’unité est écrite : 2,75 ± 0,09 g/cm³. Écrire tous les chiffres de la calculatrice (2,7454 ± 0,0830) suggère une précision que la mesure n’a pas ; 2,7 ne s’écrit pas à la même décimale que u ; et sans unité, le résultat n’a pas de sens.',
        indice: 'Arrondissez d’abord u (1 chiffre significatif, par excès), puis arrondissez ρ à la même décimale.' } },
    { id: 'compare', titre: 'Comparer à une valeur de référence',
      retenirTitre: 'Écrire le résultat', retenir: <>
        <SvgCarteEcriture/>
        <ul style={UL}>
          <li><strong>u d’abord, puis la valeur à la même décimale</strong>, avec l’unité : G ± u.</li>
          <li>Moyen de s’en souvenir : <strong>« la décimale de u commande »</strong>. Idée fausse : « plus de chiffres = plus de précision ». Vrai : les chiffres en trop sont du bruit.</li>
        </ul></>,
      texte: <>On compare le résultat à la valeur de référence de l’aluminium pur, ρ_ref = 2,70{NB}g/cm³ (table, supposée connue sans incertitude), avec le quotient{FZ}où ρ_mes est le résultat et u(ρ) son incertitude-type. Convention d’usage : si z est inférieur à 2, on dit que le résultat est <strong>compatible</strong> avec la référence. On garde les valeurs de la calculatrice : ρ_mes = 2,7454{NB}g/cm³ et u(ρ) = 0,0830{NB}g/cm³. La scène place le résultat et la référence sur un axe.</>,
      tache: { type: 'num', carnet: false, q: 'Calculez z (sans unité, 2 chiffres significatifs)', unite: '', vrai: A.z, tol: 0.1, affiche: v => nbf(v, 2),
        calcul: () => ['Écart : |2,7454 − 2,70| = 0,0454 g/cm³.', `z = ${'0,0454'} divisé par 0,0830 = ${nbf(A.z, 2)} (avec le résultat écrit 2,75 ± 0,09, on trouve 0,56 : même conclusion).`, 'z < 2 : le résultat est compatible avec la référence (convention d’usage).'],
        pieges: [[0.0454, 'C’est l’écart seul, en g/cm³ : il faut le diviser par l’incertitude-type u(ρ).'], [0.083 / 0.0454, 'Le quotient est à l’envers : c’est l’écart divisé par u(ρ).'], [0.0454 / 2.7454, 'On divise par l’incertitude-type u(ρ), pas par la valeur mesurée.']],
        expl: `z = 0,0454 divisé par 0,0830 = ${nbf(A.z, 2)} : l’écart vaut environ une demi-incertitude, très en dessous du seuil usuel de 2.`,
        indice: 'Écart en valeur absolue entre ρ_mes et ρ_ref, divisé par u(ρ).' } },
    { id: 'amelio', titre: 'Un protocole amélioré',
      texte: <>On refait la mesure en changeant seulement l’instrument du diamètre : un pied à coulisse au 1/20 (a = 0,025{NB}mm, soit u(d) = 0,0014{NB}cm), avec d = 2,000{NB}cm. Les autres grandeurs sont inchangées (la hauteur reste mesurée à la règle). La formule donne alors, avec les chiffres de la calculatrice, ρ_mes = 2,7454{NB}g/cm³ et u(ρ) = {nbf(B.u, 5)}{NB}g/cm³, soit, une fois écrit, ρ = 2,745 ± 0,012{NB}g/cm³. La référence est toujours ρ_ref = 2,70{NB}g/cm³.</>,
      tache: { type: 'num', carnet: false, q: 'Calculez le nouveau quotient z (sans unité, 2 chiffres significatifs)', unite: '', vrai: B.z, tol: 0.1, affiche: v => nbf(v, 2),
        calcul: () => ['Écart : |2,7454 − 2,70| = 0,0454 g/cm³ (inchangé).', `z = 0,0454 divisé par ${nbf(B.u, 5)} = ${nbf(B.z, 2)} (avec le résultat écrit 2,745 ± 0,012, on trouve 3,75 : même conclusion).`, 'z est maintenant nettement supérieur à 2 : l’incertitude a diminué, l’écart est resté le même.'],
        pieges: [[0.0454, 'C’est l’écart seul : il faut le diviser par l’incertitude-type u(ρ).'], [A.z, 'C’est le quotient obtenu avec la règle graduée : ici l’incertitude-type u(ρ) est beaucoup plus petite.'], [B.u / 0.0454, 'Le quotient est à l’envers : c’est l’écart divisé par u(ρ).']],
        expl: `z = 0,0454 divisé par ${nbf(B.u, 5)} = ${nbf(B.z, 2)} : le même écart de 0,0454 g/cm³ représente maintenant environ quatre incertitudes.`,
        indice: 'Même écart qu’avant, divisé par la nouvelle incertitude-type u(ρ).' } },
    { id: 'conclu', titre: 'Que conclure ?',
      retenirTitre: 'Comparer à une référence : le quotient z', retenir: <>
        <SvgCarteZ/>
        <ul style={UL}>
          <li>z = <strong>écart divisé par u</strong> : « combien d’incertitudes séparent le résultat de la référence ».</li>
          <li>z inférieur à 2 : compatible ; sinon, à discuter. <strong>Le seuil 2 est une convention d’usage</strong>, pas une loi de la nature ; la référence est supposée connue sans incertitude.</li>
          <li>Moyen de s’en souvenir : <strong>« petit z : pas de désaccord détecté »</strong>. Idée fausse : « z inférieur à 2 prouve que le résultat est juste ». Vrai : cela dépend aussi de la taille de u.</li>
        </ul></>,
      texte: <>Avec la règle graduée : z ≈ {nbf(A.z, 2)}, compatible. Avec le pied à coulisse : z ≈ {nbf(B.z, 1)}, bien au-delà de 2. C’est le même cylindre et la même valeur de référence : seule l’incertitude a changé.</>,
      tache: { type: 'qcm', q: 'Avec le pied à coulisse, z est nettement plus grand que 2. Que faire ?', ...Q.conclu,
        expl: 'Un z grand est un signal : la mesure plus précise révèle un désaccord que la première, trop incertaine, masquait. On cherche une cause non prise en compte : erreur systématique (étalonnage, zéro du pied à coulisse), référence mal adaptée (ici le cylindre peut être en alliage d’aluminium, un peu plus dense que l’aluminium pur) ou incertitude oubliée. Agrandir u pour repasser sous 2, refaire la mesure jusqu’à obtenir z inférieur à 2, ou déclarer la table fausse sans preuve, serait tricher avec le critère.',
        indice: 'z grand signifie que l’écart n’est pas expliqué par l’incertitude retenue. Que cherche-t-on alors : à changer le critère, ou à comprendre l’origine de l’écart ?' } },
    { id: 'bilan', titre: 'Bilan : quand z est grand',
      retenirTitre: 'Quand z est grand', retenir: <>
        <SvgCarteQueFaire/>
        <ul style={UL}>
          <li>z nettement supérieur à 2 : <strong>on cherche la cause</strong> (erreur systématique, référence adaptée ?, incertitude oubliée ?), on ne maquille pas u.</li>
          <li>Moyen de s’en souvenir : <strong>« z grand : on enquête, on ne triche pas »</strong>. Idée fausse : « un grand u rend la mesure meilleure ». Vrai : il rend seulement le test moins exigeant.</li>
        </ul></>,
      texte: <>Vous savez composer des incertitudes-types avec les formules fournies (somme, produit, exposant), repérer la grandeur qui domine, simuler un processus aléatoire pour retrouver u(G), écrire un résultat avec un nombre adapté de chiffres significatifs et le comparer à une valeur de référence avec le quotient z, en sachant que le seuil de 2 est une convention. Relisez les hypothèses ci-dessous (indépendance des grandeurs, loi des tirages, approximation linéaire), puis explorez ou relevez le défi.</>, tache: null },
  ];

  const ETAPES = ETAPES_BRUT.map(e => ({ ...e, texte: indicesProfond(e.texte), ...(e.retenir ? { retenir: indicesProfond(e.retenir) } : {}) }));

  // ════════════════ DÉFI ════════════════
  const nouveauDefi = () => setDefi({ d: M.tirageDefi(), rep: { u: '', z: '', compat: null, ecr: null }, options: null, verifie: false, bons: {}, echecs: 0 });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(); }
  const majRep = f => setDefi(s => ({ ...s, rep: { ...s.rep, ...f }, verifie: false }));
  const optionsEcriture = d => {
    // quatre écritures : la bonne, trop de chiffres, décimale différente, unité absente ; ordre fixé par la valeur de G (stable pour un tirage)
    const r = d.ecrit, un = d.sit.unite, dd = r.d, f = (x, k) => nbf(x, k), nbsp = ' ';
    const bonne = `${f(r.m, dd)}${nbsp}±${nbsp}${f(r.u, dd)}${nbsp}${un}`;
    const opts = [[bonne, true], [`${f(d.G, dd + 3)}${nbsp}±${nbsp}${f(d.u, dd + 3)}${nbsp}${un}`, false], [`${f(r.m, Math.max(dd - 1, 0))}${nbsp}±${nbsp}${f(r.u, dd)}${nbsp}${un}`, false], [`${f(r.m, dd)}${nbsp}±${nbsp}${f(r.u, dd)}`, false]];
    const k = Math.floor(d.G * 1000) % 4; return opts.map((_, i) => opts[(i + k) % 4]);
  };
  const verifierDefi = () => {
    const d = defi.d, u = lireNombre(defi.rep.u), z = lireNombre(defi.rep.z);
    const okU = isFinite(u) && Math.abs(u - d.u) <= 0.06 * d.u, okZ = isFinite(z) && Math.abs(z - d.z) <= M.tolZ(d.z);
    const okC = defi.rep.compat != null && defi.rep.compat === d.compat;
    const opts = defi.options || optionsEcriture(d), okE = defi.rep.ecr != null && !!opts[defi.rep.ecr]?.[1];
    const tout = okU && okZ && okC && okE;
    noterD(tout); setDefi(s => ({ ...s, options: opts, verifie: true, bons: { u: okU, z: okZ, compat: okC, ecr: okE }, echecs: s.echecs + (tout ? 0 : 1) }));
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const champ = (cle, label, unite, aria) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4, fontSize: 14 }}>
      <span style={{ minWidth: 70 }}>{avecIndices(label)}</span>
      <input value={defi.rep[cle]} aria-label={aria} inputMode="decimal" onChange={e => majRep({ [cle]: e.target.value })} onKeyDown={e => e.key === 'Enter' && document.getElementById('icc-verif')?.click()}
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, fontSize: 14, border: `1.5px solid ${defi.verifie ? (defi.bons[cle] ? '#15803d' : '#dc2626') : KIT.bord}` }}/>
      <span>{unite}</span>
      {defi.verifie && <span style={{ fontWeight: 700, color: defi.bons[cle] ? '#15803d' : '#dc2626' }}>{defi.bons[cle] ? '✓' : '✗'}</span>}
    </div>);
  const choixDefi = (cle, titre, options) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ ...lbl, fontWeight: 700 }}>{avecIndices(titre)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {options.map((o, i) => <button key={i} type="button" aria-pressed={defi.rep[cle] === i} onClick={() => majRep({ [cle]: i })} style={{ ...stylePetitBouton(defi.rep[cle] === i, '#0369a1'), textAlign: 'left', fontSize: 14, padding: '7px 10px' }}>{avecIndices(o)}</button>)}
      </div>
      {defi.verifie && <span style={{ fontWeight: 700, color: defi.bons[cle] ? '#15803d' : '#dc2626' }}>{defi.bons[cle] ? '✓' : '✗'}</span>}
    </div>);
  const donneesDefi = d => d.type === 'res'
    ? <>On mesure une résistance. Tension : <b>U = {nbf(d.vals.U.val, 2)}{NB}V</b> avec <b>u(U) = {nbf(d.vals.U.u, 2)}{NB}V</b> ; intensité : <b>I = {nbf(d.vals.I.val, 1)}{NB}mA</b> avec <b>u(I) = {nbf(d.vals.I.u, 1)}{NB}mA</b> (mesures indépendantes). La résistance est R = {avecIndices('frac(1 000 U|I)')} (U en V, I en mA, R en Ω). Valeur de référence : <b>{d.refNom}</b>.</>
    : <>On mesure un cylindre : masse <b>m = {nbf(d.vals.m.val, 1)}{NB}g</b> (<b>u(m) = {nbf(d.vals.m.u, 2)}{NB}g</b>), diamètre <b>d = {nbf(d.vals.d.val, 2)}{NB}cm</b> (<b>u(d) = {nbf(d.vals.d.u, 2)}{NB}cm</b>), hauteur <b>h = {nbf(d.vals.h.val, 2)}{NB}cm</b> (<b>u(h) = {nbf(d.vals.h.u, 2)}{NB}cm</b>), mesures indépendantes. La masse volumique est ρ = {avecIndices('frac(4 m|π d² h)')} (en g/cm³). Valeur de référence : <b>{nbf(d.ref, 2)}{NB}g/cm³</b>, {d.refNom}.</>;
  const sym = d => (d.type === 'res' ? 'R' : 'ρ'), uniteG = d => (d.type === 'res' ? 'Ω' : 'g/cm³');
  const revele = defi && (defi.echecs >= 3 || (defi.verifie && Object.values(defi.bons).every(Boolean)));
  const voletDefi = defi && (() => {
    const d = defi.d, s = sym(d), un = uniteG(d), reussi = defi.verifie && Object.values(defi.bons).every(Boolean);
    const opts = defi.options || optionsEcriture(d);
    return (<div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : composer les incertitudes et comparer</div>
      <div style={{ ...lbl, marginBottom: 8 }}>{donneesDefi(d)} La formule fournie est {avecIndices(d.type === 'res' ? 'frac(u(R)|R) = √(frac(u(U)|U)² + frac(u(I)|I)²)' : 'frac(u(ρ)|ρ) = √(frac(u(m)|m)² + (2 frac(u(d)|d))² + frac(u(h)|h)²)')}. Gardez 4 chiffres significatifs dans vos calculs. Tolérance : 6{NB}% sur u, et 10{NB}% (ou 0,12) sur z.</div>
      {champ('u', `u(${s})`, `${un} (non arrondie, au moins 4 chiffres significatifs)`, `Incertitude-type u de ${s}`)}
      <IndiceDefi cache={!!defi.bons.u}>{avecIndices(`Calculez ${s} = ${d.type === 'res' ? 'frac(1 000 U|I)' : 'frac(4 m|π d² h)'}, puis les incertitudes relatives de chaque grandeur (avec le facteur de l’exposant), composez-les en quadrature et multipliez par ${s}.`)}</IndiceDefi>
      {champ('z', 'z', '(sans unité, calculé avec les valeurs non arrondies)', 'Quotient z de comparaison')}
      <IndiceDefi cache={!!defi.bons.z}>{avecIndices(`z = frac(écart|u(${s})), où l’écart est la valeur absolue de la différence entre ${s} et la valeur de référence ; reprenez ${s} et u(${s}) non arrondies.`)}</IndiceDefi>
      {choixDefi('compat', 'Avec le seuil usuel z < 2, le résultat est-il compatible avec la référence ?', ['compatible', 'pas compatible'])}
      {(defi.bons.u || reussi) && (<>
        {choixDefi('ecr', 'Quelle est l’écriture correcte du résultat ?', opts.map(o => o[0]))}
      </>)}
      {!(defi.bons.u || reussi) && <div style={{ ...lbl, color: KIT.txt2 }}>Une dernière question (écriture du résultat) apparaît quand u est juste.</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="icc-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && !reussi && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#b91c1c' }}>Pas encore : les réponses marquées ✗ sont à revoir (un indice est disponible pour chaque question de calcul).</div>}
      {reussi && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#15803d' }}>✓ Bravo : tout est juste.</div>}
      {revele && <div style={{ ...lbl, marginTop: 8, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '6px 8px' }}>
        <b>Correction.</b> {avecIndices(`u(${s}) = ${nbf(d.u, 4)} ${un} (incertitude relative ${nbf(100 * d.u / d.G, 2)} %) ; ${s} = ${nbf(d.G, 4)} ${un} ; z = ${nbf(d.z, 2)}, donc ${d.compat ? 'compatible' : 'pas compatible'} (seuil conventionnel 2) ; écriture : ${ecr(d.ecrit)}. Hypothèses : mesures indépendantes, incertitudes relatives petites, référence supposée exacte.`)}</div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Grandeurs d’entrée indépendantes</strong> : l’erreur sur l’une n’influence pas l’erreur sur les autres. Si elles dépendent les unes des autres (même instrument, même étalonnage défectueux), la formule de composition ne s’applique plus telle quelle.</li>
      <li><strong>Loi des tirages</strong> : chaque grandeur est tirée selon une loi normale ou rectangulaire, de même écart-type u. C’est un modèle, pas une certitude : la loi change la forme de l’histogramme de G, pas la formule de composition, qui ne contient que les incertitudes-types.</li>
      <li><strong>Approximation linéaire</strong> : la formule de composition remplace G par son approximation linéaire autour des valeurs mesurées ; elle est exacte pour une somme ou une différence, et valable pour un produit ou un quotient si les incertitudes relatives sont petites (quelques %). Avec une incertitude relative de 12{NB}% sur le diamètre ou de 15{NB}% sur l’intensité, l’écart-type des tirages dépasse la formule de 5 à 15{NB}% selon la loi (mesuré : environ +14{NB}% et +11{NB}% en loi normale, +7{NB}% et +5,5{NB}% en loi rectangulaire) et la moyenne des tirages s’écarte de la valeur calculée : essayez-le en exploration. Au-delà, la simulation devient peu fiable (valeurs proches de zéro au dénominateur) : les curseurs sont donc limités.</li>
      <li><strong>Seuil de comparaison</strong> : « z inférieur à 2 ⇒ compatible » est une convention d’usage, pas une loi de la nature. La valeur de référence est supposée connue sans incertitude. « Compatible » ne veut pas dire « prouvé » : une grande incertitude rend la compatibilité plus facile.</li>
      <li><strong>Incertitude-type et écart-type</strong> : on assimile l’incertitude-type à un écart-type. Pas d’intervalle de confiance élargi ici.</li>
      <li><strong>Erreurs systématiques</strong> non prises en compte : un instrument mal étalonné décale tous les résultats sans changer u (voir l’étape « Que conclure ? »).</li>
      <li><strong>Conventions et données</strong> : type B par u = a/√3 avec a la demi-résolution (balance au 0,1 g : a = 0,05 g ; règle au mm : a = 0,5 mm) ; u arrondie par excès à 1 chiffre significatif (2 si le premier est 1), valeur arrondie à la même décimale (règles de première ; d’autres conventions existent) ; z calculé avec les valeurs non arrondies. Valeurs de référence tabulées (aluminium pur : 2,70 g/cm³) et valeurs de mesure : ordres de grandeur illustratifs.</li>
      <li><strong>N tirages</strong> : N est le nombre de tirages simulés, sans lien avec le nombre de mesures réalisées au laboratoire.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défi</button>
    </span>);

  // ---------- scène du parcours ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const statsSim = (sim, sit, dG2, dU2, avecMoy) => (
    <div style={{ ...COLONNE_TXT, marginTop: 6 }}>
      <div>{avecIndices(`N = ${fN(sim.v.length)} tirages · écart-type des tirages : `)}<b>{nbf(sim.sd, dU2)}{NB}{sit.unite}</b></div>
      <div>{avecIndices(`u(${sit.sym}) donnée par la formule : `)}<b>{nbf(sim.uF, dU2)}{NB}{sit.unite}</b></div>
      {avecMoy && <div>{avecIndices(`moyenne des tirages : `)}<b>{nbf(sim.moy, dG2)}{NB}{sit.unite}</b>{avecIndices(` (valeur calculée : ${nbf(sim.G, dG2)} ${sit.unite})`)}</div>}
    </div>);
  const commandesG = (<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 8 }}>
    <label style={{ ...lbSel, margin: 0, flex: '1 1 150px' }}>Nombre de tirages N
      <select value={gm.N} onChange={e => setGm(s => ({ ...s, N: +e.target.value, lance: true }))} style={{ ...menu, marginTop: 2 }}>{M.N_CHOIX.map(n => <option key={n} value={n}>{fN(n)}</option>)}</select></label>
    {rang(idEtape) >= rang('loi') && <label style={{ ...lbSel, margin: 0, flex: '1 1 150px' }}>Loi des tirages
      <select value={gm.loi} onChange={e => setGm(s => ({ ...s, loi: e.target.value, lance: true }))} style={{ ...menu, marginTop: 2 }}><option value="normale">normale</option><option value="rect">rectangulaire</option></select></label>}
    <button type="button" onClick={lancerG} style={{ ...styleBouton(false), minHeight: 42 }}><Pic n="refresh"/>Relancer</button>
  </div>);
  const sceneGuide = (() => {
    const k = rang(idEtape);
    if (k === rang('diff')) return <div style={styleBoite}><SvgPesees/></div>;
    if (k <= rang('dominant')) return <div style={styleBoite}><SvgCylindre/></div>;
    if (k <= rang('ecriture')) {
      const vide = !simG;
      return (<div style={styleBoite}>
        <SvgHisto h={vide ? M.histogramme(new Float64Array(0), A.G, A.u) : simG.h} centre={A.G} u={A.u} unite={A.sit.unite} sym="ρ" idPrefixe="g" vide={vide}
          label="Histogramme des valeurs de ρ calculées à chaque tirage, avec la bande ρ ± u donnée par la formule"/>
        {simG && statsSim(simG, A.sit, 3, 3, false)}
        {k >= rang('N') && commandesG}
      </div>);
    }
    if (k <= rang('conclu')) {
      const lignes = [{ nom: 'règle graduée pour d', m: A.G, u: A.u }, ...(k >= rang('amelio') ? [{ nom: 'pied à coulisse pour d', m: B.G, u: B.u }] : [])];
      return <div style={styleBoite}><SvgComparaison lignes={lignes} valRef={A.sit.ref} lo={2.56} hi={2.84} dec={2}/></div>;
    }
    return null;
  })();

  // ---------- exploration ----------
  const resumeU = sitE.grandeurs.map(g => `u(${g.sym}) = ${nbf(valsE[g.id].u, 3).replace(/0+$/, '').replace(/,$/, '')} ${g.unite}`).join(' · ');
  const regU = g => {
    const u = valsE[g.id].u, rel = 100 * u / g.val, bas = g.pas, haut = g.umax, deb = Math.max(bas, Math.round((u - g.pas) / g.pas) * g.pas), fin = Math.min(haut, Math.round((u + g.pas) / g.pas) * g.pas);
    return (<div key={g.id} style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, gap: 6 }}><span>{avecIndices(`u(${g.sym}) : ${g.nom}`)}</span><span style={{ color: KIT.txt, whiteSpace: 'nowrap' }}>{nbf(u, 3)}{NB}{g.unite} ({nbf(rel, 1)}{NB}%)</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" aria-label={`Diminuer u(${g.sym})`} onClick={() => setU(g.id, Number(deb.toFixed(6)))} style={{ ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 }}>−</button>
        <input type="range" min={bas} max={haut} step={g.pas} value={u} aria-label={`Incertitude-type de ${g.nom}`} onChange={e => setU(g.id, parseFloat(e.target.value))} style={{ flex: 1, accentColor: COLI.bleu, minWidth: 0 }}/>
        <button type="button" aria-label={`Augmenter u(${g.sym})`} onClick={() => setU(g.id, Number(fin.toFixed(6)))} style={{ ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 }}>+</button>
      </div></div>);
  };
  const reglages = enExplore && (
    <div style={styleBoite} className="icc-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez la situation et le nombre de tirages : le graphique montre les valeurs de {sitE.sym} obtenues quand chaque grandeur mesurée est tirée au hasard autour de sa valeur.</div>
      <label style={lbSel}>Situation
        <select value={ex.sit} onChange={e => setEx({ sit: e.target.value, N: ex.N, loi: ex.loi, graine: ex.graine, us: {} })} style={{ ...menu, marginTop: 2 }}>{M.IDS_SIT.map(id => <option key={id} value={id}>{M.SITUATIONS[id].nom}</option>)}</select></label>
      <label style={lbSel}>Nombre de tirages N
        <select value={ex.N} onChange={e => setEx(s => ({ ...s, N: +e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.N_CHOIX.map(n => <option key={n} value={n}>{fN(n)}</option>)}</select></label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button type="button" onClick={lancer} style={stylePetitBouton(false)}><Pic n="refresh"/>Relancer (nouveaux tirages)</button>
      </div>
      <Section titre={`Incertitudes et loi : ${ex.loi === 'rect' ? 'loi rectangulaire' : 'loi normale'} · ${resumeU}`} ouvert={ouv.regl} onBascule={() => setOuv(o => ({ ...o, regl: !o.regl }))}>
        <div style={aide}>Chaque curseur règle l’incertitude-type d’une grandeur mesurée ; − et + la changent d’un pas. La loi décrit comment les valeurs sont tirées autour de la valeur mesurée (même écart-type dans les deux cas).</div>
        <label style={lbSel}>Loi des tirages
          <select value={ex.loi} onChange={e => setEx(s => ({ ...s, loi: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="normale">normale (cloche)</option><option value="rect">rectangulaire (toutes les valeurs de l’intervalle équiprobables)</option></select></label>
        {sitE.grandeurs.map(regU)}
        <button type="button" onClick={() => setEx(s => ({ ...s, us: {} }))} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir les incertitudes de départ</button>
      </Section>
    </div>);
  const sceneExplore = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>Histogramme des {fN(ex.N)} valeurs de {sitE.sym} calculées, une par tirage ({sitE.nom.toLowerCase()}).</div>
      <SvgHisto h={simE.h} centre={simE.G} u={simE.uF} moy={simE.moy} unite={sitE.unite} sym={sitE.sym} idPrefixe="e" label={`Histogramme de ${simE.v.length} valeurs de ${sitE.sym} simulées`}/>
      {statsSim(simE, sitE, dG, dU, true)}
      {simE.hors > 0 || simE.h.hors > 0 ? <div style={{ ...aide, marginTop: 4 }}>{simE.h.hors} tirage{simE.h.hors > 1 ? 's' : ''} hors du cadre du graphique (comptés dans l’écart-type).</div> : null}
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <Section titre={`Résultats : ${sitE.sym} = ${nbf(simE.G, dG)} ${sitE.unite} · u(${sitE.sym}) = ${nbf(simE.uF, dU)} ${sitE.unite} (${nbf(100 * uRelE, 1)} %)`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>Valeur calculée, incertitude par la formule, puis par la simulation, grandeur dominante, résultat écrit et comparaison à la référence.</div>
        <LigneMesure nom={`${sitE.sym} calculée`} valeur={`${nbf(simE.G, dG)} ${sitE.unite}`}/>
        <LigneMesure nom={`u(${sitE.sym}) par la formule`} valeur={`${nbf(simE.uF, dU)} ${sitE.unite}`}/>
        <LigneMesure nom="incertitude relative" valeur={`${nbf(100 * uRelE, 2)} %`}/>
        <LigneMesure nom="écart-type des tirages" valeur={`${nbf(simE.sd, dU)} ${sitE.unite}`}/>
        <LigneMesure nom="écart simulation / formule" valeur={`${simE.sd >= simE.uF ? '+' : '−'}${nbf(100 * Math.abs(simE.sd - simE.uF) / simE.uF, 1)} %`}/>
        <LigneMesure nom="moyenne des tirages" valeur={`${nbf(simE.moy, dG)} ${sitE.unite}`}/>
        <LigneMesure nom="grandeur dominante" valeur={`${contribE[0].sym} (${nbf(100 * contribE[0].part, 0)} % des carrés)`}/>
        <LigneMesure nom="résultat écrit" valeur={ecr(ecritE)}/>
        <LigneMesure nom={`référence (${sitE.refNom})`} valeur={`${nbf(sitE.ref, dG === 3 ? 2 : 1)} ${sitE.unite}`}/>
        <LigneMesure nom="z" valeur={nbf(zE, 2)}/>
        <div style={{ ...aide, marginTop: 6 }}>{avecIndices(zE < M.SEUIL_Z ? 'z est inférieur à 2 : compatible, par convention d’usage.' : 'z dépasse 2 : écart à discuter (le seuil est une convention).')}</div>
      </Section>
    </div>);
  const python = enExplore && (
    <div style={styleBoite}>
      <Section titre="Programme Python correspondant (à lire, non exécuté ici)" ouvert={ouv.python} onBascule={() => setOuv(o => ({ ...o, python: !o.python }))}>
        <div style={aide}>Ce programme réalise la même simulation que le graphique, avec les réglages choisis ci-dessus. Il se lance dans un éditeur Python avec numpy : il affiche la moyenne et l’écart-type des N valeurs de {sitE.sym} (l’écart-type est proche de u({sitE.sym})).</div>
        <pre aria-label="Programme Python" style={{ margin: 0, padding: '8px 10px', background: '#0f172a', color: '#e2e8f0', borderRadius: 10, fontSize: 13, lineHeight: 1.5, overflowX: 'auto', whiteSpace: 'pre' }}>{M.codePython(sitE, valsE, ex.loi, ex.N)}</pre>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        {indicesProfond(<>
          <li>Situation « masse volumique » : doublez u(d) puis u(m) : lequel change le plus u(ρ) ? Pourquoi ?</li>
          <li>Passez N de 10 à 100 000, en relançant plusieurs fois : que devient la fluctuation de l’écart-type des tirages ? Et u(ρ) donnée par la formule ?</li>
          <li>Choisissez la loi rectangulaire, avec N = 100 000 : que devient la forme de l’histogramme ? et l’écart-type des tirages ?</li>
          <li>Situation « résistance » : portez u(I) à son maximum (environ 15 % de I) : l’écart entre la simulation et la formule apparaît-il ? Dans quel sens ? La moyenne des tirages vaut-elle encore la valeur calculée ?</li>
          <li>Rendez toutes les incertitudes très petites : z grandit-il ou diminue-t-il pour un même écart ? Que dit-on d’un résultat très précis éloigné de la référence ?</li>
        </>)}
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        {indicesProfond(<ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Somme ou différence (indépendantes) : u(G)² = u(x)² + u(y)²</li>
          <li>Produit ou quotient : frac(u(G)|G) = √(frac(u(x)|x)² + frac(u(y)|y)²), exposant p : facteur |p|</li>
          <li>Le plus grand terme domine : on améliore l’instrument qui pèse le plus</li>
          <li>Simulation : tirer, calculer, recommencer N fois ; écart-type des N valeurs ≈ u(G) ; N ≠ nombre de mesures</li>
          <li>Écriture : u par excès (1 chiffre significatif, 2 si le premier est 1), valeur à la même décimale, unité</li>
          <li>Comparaison : z = frac(écart|u) ; z inférieur à 2 : compatible (convention) ; z grand : on cherche la cause</li>
        </ul>)}
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .icc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .icc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .icc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .icc-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .icc-l1.cote .icc-carte { order: 2; } .icc-l1.cote .icc-main { order: 1; }
          .icc-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .icc-ex > * { grid-column: 1; } .icc-ex > .icc-ctrl { grid-column: 2; grid-row: 1 / span 5; }
          .icc-df { grid-template-columns: minmax(0, 3fr) minmax(320px, 2fr); } }
        @media (max-width: 900px) { .icc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .icc-in { animation: icc-fondu 0.35s ease-out; } @keyframes icc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Incertitudes-types composées et valeur de référence</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une grandeur calculée à partir de mesures hérite de leurs incertitudes : on les compose avec une formule, on les retrouve par simulation, puis on compare le résultat à une valeur de référence.</div>
      {enGuide && <div className="icc-l1 cote">
        <div className="icc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="icc-main">{sceneGuide && <div className="icc-in" key={'s-' + (sceneGuide ? (rang(idEtape) <= rang('dominant') ? (idEtape === 'diff' ? 'p' : 'c') : rang(idEtape) <= rang('ecriture') ? 'h' : 'k') : 'x')}>{sceneGuide}</div>}</div>
      </div>}
      {enDefi && defi && <div className="icc-df">
        <div><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviD}/></div></div>
        <div>{panneauHypo}</div>
      </div>}
      {enExplore && <div className="icc-ex">
        <div>{sceneExplore}</div>
        <div className="icc-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{python}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}

// fraction écrite en MathML au fil d'un texte du parcours (numérateur et dénominateur en texte simple)
function fr_t(haut, bas) { return <math style={{ fontSize: '1.05em', whiteSpace: 'nowrap' }}><mfrac><mrow><mtext>{haut.replace(/ /g, ' ')}</mtext></mrow><mrow><mtext>{bas.replace(/ /g, ' ')}</mtext></mrow></mfrac></math>; }
