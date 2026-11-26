import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, accepte, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./sensEvolutionModele";
const { plageJauge, puissanceTexte } = M;
import { QCM_PARCOURS as Q } from "./sensEvolutionQcm";
import { SceneReaction, Jauge, FlaconH2O2, SvgGammaCarte, SvgKCarte, SvgQrKCarte, SvgConcCarte, SvgBlocageCarte } from "./sensEvolutionSchemas";

const SIM_ID = 293, CLE_GUIDE = 'sens-evolution-tstl-guide-v1';
declarerDefis(SIM_ID, [['k', 'Calculer la constante d’équilibre'], ['sens', 'Prévoir le sens d’évolution']]);

// ====================================================
// SIM 293 — PRÉVOIR LE SENS D'ÉVOLUTION : Qr, K ET POTENTIELS STANDARDS (TSTL SPCL, chapitre « Oxydo-réduction »).
//  Capacités visées (jamais affichées à l'élève) : calculer une constante d'équilibre à partir des potentiels standards ; prévoir le sens d'évolution
//  spontanée avec les potentiels ou le quotient de réaction ; confronter aux résultats expérimentaux pour repérer un blocage cinétique.
//  Modèle : sensEvolutionModele.js (K = 10^(N ΔE° / 0,06), Qr, comparaison, évolution jusqu'à l'équilibre). Situations originales (aucune du Moodle).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = M.COUPLES;
const CONC_LISTE = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001];
const DUREE = 6500;                                                  // durée de l'animation d'évolution (ms)
const IDS = ['echelle', 'equation', 'K', 'totale', 'qr', 'sens', 'evolue', 'inverse', 'potentiels', 'bloque', 'conclure', 'bilan'];
const PZC = M.paire('zn', 'cu'), PAG = M.paire(...M.GUIDE.ag), PINV = M.paire(...M.GUIDE.inv);
const C_ZC = M.concParDefaut(PZC), EVAG = M.evolution(PAG, M.GUIDE.agC);
const demi = c => `${c.ox} + ${c.n > 1 ? c.n + ' ' : ''}e⁻ ⇌ ${c.red}`;
const E_AG_INV = 0.80 + M.PENTE * M.log10(0.010);                  // E(Ag⁺ / Ag) pour [Ag⁺] = 0,010 mol/L : 0,68 V
const depOf = (ev, tau) => (ev.x ? M.etatTau(ev, tau).x / ev.x : 0);

const SelectGen = ({ nom, valeur, onChange, options, aide }) => (
  <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>{avecIndices(nom)}
    <select value={valeur} onChange={e => onChange(e.target.value)} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', marginTop: 2 }}>
      {options.map(([v, l, off]) => <option key={v} value={v} disabled={off}>{l}</option>)}
    </select>{aide && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{aide}</span>}</label>);
const SelectConc = ({ espece, valeur, onChange }) => (
  <SelectGen nom={`Concentration [${espece}]`} valeur={String(valeur)} onChange={v => onChange(Number(v))} options={CONC_LISTE.map(c => [String(c), `${M.concTexte(c)} mol/L`])}/>);

// animation de l'évolution : τ de 0 à 1
function useAnimation(reduit) {
  const [tau, setTau] = useState(0), [marche, setMarche] = useState(false);
  useEffect(() => {
    if (!marche) return undefined;
    let id; const t0 = performance.now();
    const pas = t => { const v = Math.min(1, (t - t0) / DUREE); setTau(v); if (v < 1) id = requestAnimationFrame(pas); else setMarche(false); };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [marche]);
  const lancer = () => { if (reduit || (typeof window !== 'undefined' && window.__PARCOURS_TEST__)) { setTau(1); setMarche(false); } else { setTau(0); setMarche(true); } };
  const remise = () => { setMarche(false); setTau(0); };
  return { tau, marche, lancer, remise };
}

// détail de calcul de Qr (pour les corrections) : Qr = [produits]^coef / [réactifs]^coef avec les valeurs
function detailQr(p, c) {
  const sup = n => (n > 1 ? [...String(n)].map(x => '⁰¹²³⁴⁵⁶⁷⁸⁹'[x]).join('') : '');
  const num = p.especes.filter(s => s.coef > 0 && !s.solide).map(s => `${M.concTexte(c[s.e])}${sup(s.coef)}`), den = p.especes.filter(s => s.coef < 0 && !s.solide).map(s => `${M.concTexte(c[s.e])}${sup(s.coef)}`);
  const lit = p.especes.filter(s => !s.solide).map(s => s);
  const formule = `Qr = ${lit.filter(s => s.coef > 0).map(s => `[${s.e}]${sup(s.coef)}`).join(' × ') || '1'} / ( ${lit.filter(s => s.coef < 0).map(s => `[${s.e}]${sup(s.coef)}`).join(' × ')} )`;
  return `${formule} (les solides valent 1) = ${num.join(' × ') || '1'} / ( ${den.join(' × ')} ) = ${puissanceTexte(M.logQ(p, c))}`;
}

// ====================================================
export function SimulationSensEvolution() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviK, noterK] = useCompteurDefi(), [suiviS, noterS] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('k');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false, h2o2: false });
  const [reduit] = useState(mouvementReduit);
  const anim = useAnimation(reduit);
  const [cat, setCat] = useState(false);
  const [ex, setEx] = useState({ a: 'cu', b: 'ag', c: M.concParDefaut(M.paire('cu', 'ag')) });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const { tau, marche, lancer, remise } = anim;

  // ---------- étapes ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const reussie = !!(guide.reussies && guide.reussies[etape]);
  const ETAPES = [
    { id: 'echelle', titre: 'Quelle réaction prévoir ?',
      texte: <>Un bécher contient une lame de zinc, une lame de cuivre et une solution avec des ions Zn²⁺ et Cu²⁺. Quatre espèces peuvent réagir : les oxydants Cu²⁺ et Zn²⁺, les réducteurs Cu et Zn. Pour savoir lesquelles réagissent, on compare les <strong>potentiels standards</strong> E° (potentiel d’un couple à 1 mol/L) : E°(Cu²⁺ / Cu) = <strong>0,34 V</strong> et E°(Zn²⁺ / Zn) = <strong>−0,76 V</strong>. Plus E° est grand, plus l’oxydant du couple est fort ; plus E° est petit, plus son réducteur est fort.</>,
      tache: { type: 'qcm', q: 'Quelle réaction se produit spontanément entre ces espèces ?', ...Q.echelle,
        expl: 'Cu²⁺ est l’oxydant du couple de plus grand E° (0,34 V) et Zn le réducteur du couple de plus petit E° (−0,76 V) : l’oxydant le plus fort réagit avec le réducteur le plus fort. Bilan : Cu²⁺ + Zn → Cu + Zn²⁺. C’est la règle du gamma (γ).',
        indice: 'Cherchez l’oxydant le plus fort (E° le plus grand) et le réducteur le plus fort (E° le plus petit) : ce sont eux qui réagissent ensemble.' } },
    { id: 'equation', titre: 'Écrire l’équation de la réaction',
      retenirTitre: 'À retenir : la règle du gamma', retenir: <>
        <SvgGammaCarte/>
        <Ul>
          <li>On classe les couples par <strong>E° croissants</strong> : l’<strong>oxydant le plus fort</strong> (E° le plus grand) réagit avec le <strong>réducteur le plus fort</strong> (E° le plus petit).</li>
          <li>La règle du γ donne le sens attendu dans les <strong>conditions standard</strong> (espèces dissoutes vers 1 mol/L).</li>
          <li>Moyen de s’en souvenir : <strong>« le fort oxydant prend à le fort réducteur »</strong>. Idée fausse : « deux oxydants réagissent entre eux » : il faut un oxydant et un réducteur.</li>
        </Ul></>,
      texte: <>On étudie maintenant les couples <strong>Ag⁺ / Ag</strong> (E° = 0,80 V ; Ag⁺ + e⁻ ⇌ Ag, soit n&nbsp;=&nbsp;1 électron) et <strong>Cu²⁺ / Cu</strong> (E° = 0,34 V ; Cu²⁺ + 2 e⁻ ⇌ Cu, soit n&nbsp;=&nbsp;2 électrons). Le bécher contient une lame d’argent, une lame de cuivre, des ions Ag⁺ et des ions Cu²⁺. Le couple Ag⁺ / Ag a le plus grand E° : Ag⁺ est l’oxydant qui réagit, avec le cuivre. On écrit l’équation en équilibrant les électrons échangés ; <strong>N</strong> désigne leur nombre dans l’équation écrite.</>,
      tache: { type: 'qcm', q: 'Quelle équation bilan écrit-on pour cette réaction ?', ...Q.equation,
        expl: 'Chaque atome de cuivre cède 2 électrons (Cu → Cu²⁺ + 2 e⁻) et chaque ion Ag⁺ en capte 1 (Ag⁺ + e⁻ → Ag) : il faut 2 Ag⁺ pour 1 Cu. Équation : 2 Ag⁺ + Cu ⇌ 2 Ag + Cu²⁺, avec N = 2 électrons échangés.',
        indice: 'Équilibrez les électrons : le cuivre en cède 2, un ion Ag⁺ n’en capte qu’un. De combien d’ions Ag⁺ a-t-on besoin ?' } },
    { id: 'K', titre: 'Calculer la constante d’équilibre',
      texte: <>La <strong>constante d’équilibre K</strong> de la réaction se calcule avec les potentiels standards : à l’équilibre, les deux couples ont le même potentiel, et la relation de Nernst donne <strong>log K = N × (E°₁ − E°₂) / 0,06</strong>, où E°₁ est le plus grand des deux E°, E°₂ le plus petit et N le nombre d’électrons échangés dans l’équation écrite. Ici : 2 Ag⁺ + Cu ⇌ 2 Ag + Cu²⁺, avec E°₁ = 0,80 V (Ag⁺ / Ag), E°₂ = 0,34 V (Cu²⁺ / Cu) et N = 2. K est sans unité.</>,
      tache: { type: 'num', q: 'Calculez log K pour cette réaction', unite: '', vrai: PAG.logK, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['N = 2 ; E°₁ − E°₂ = 0,80 − 0,34 = 0,46 V.', `log K = 2 × 0,46 / 0,06 = ${nbf(PAG.logK, 1)}, soit K ≈ ${puissanceTexte(PAG.logK)}.`],
        pieges: [[0.46 / 0.06, 'Vous avez oublié N : log K = N × (E°₁ − E°₂) / 0,06, avec N = 2 électrons échangés.'], [PAG.K, 'Vous avez donné K : la question porte sur son logarithme décimal, log K.'], [-PAG.logK, 'Signe inversé : E°₁ est le plus grand potentiel, donc E°₁ − E°₂ est positif.'], [0.46 / 0.06 * 0.06, 'Vous avez multiplié par 0,06 au lieu de diviser : log K = N (E°₁ − E°₂) / 0,06.']],
        expl: `log K = 2 × (0,80 − 0,34) / 0,06 = ${nbf(PAG.logK, 1)}.`,
        indice: 'Calculez la différence E°₁ − E°₂ en volts, multipliez-la par N = 2, puis divisez par 0,06.' } },
    { id: 'totale', titre: 'Que signifie un K très grand ?',
      retenirTitre: 'À retenir : la constante K', retenir: <>
        <SvgKCarte/>
        <Ul>
          <li><strong>log K = N × (E°₁ − E°₂) / 0,06</strong> (25 °C), avec E°₁ {'>'} E°₂ et N le nombre d’électrons échangés dans l’équation écrite.</li>
          <li>Si K {'>'} 10⁴, la transformation est <strong>quasi totale</strong> ; si K {'<'} 10⁻⁴, elle est quasi inexistante ; entre les deux, on obtient un équilibre.</li>
          <li>Moyen de s’en souvenir : <strong>« N fois l’écart d’E°, sur 0,06 »</strong>. Idée fausse : « un K grand veut dire une réaction rapide » : K ne renseigne jamais sur la durée.</li>
        </Ul></>,
      texte: <>La constante vaut K = 10<sup>{nbf(PAG.logK, 1)}</sup> ≈ {puissanceTexte(PAG.logK)}. L’axe logarithmique ci-contre repère K. Le bécher part de [Ag⁺] = 0,10 mol/L et [Cu²⁺] = 0,10 mol/L, avec du cuivre solide en excès (le réactif limitant est donc Ag⁺).</>,
      tache: { type: 'qcm', q: 'Que prévoit une constante K ≈ 2×10¹⁵ pour la transformation ?', ...Q.totale,
        expl: 'K est très supérieur à 10⁴ : la transformation est quasi totale, il ne reste à l’équilibre que des traces du réactif limitant Ag⁺. Mais K ne dit rien de la durée : une transformation peut avoir un très grand K et être très lente (on le verra avec l’eau oxygénée).',
        indice: 'Plus K est grand, plus l’équilibre est déplacé vers les produits. K donne-t-il une information sur la vitesse ?' } },
    { id: 'qr', titre: 'Le quotient de réaction Qr',
      texte: <>Pour savoir dans quel sens évolue un système, on calcule le <strong>quotient de réaction Qr</strong> avec les concentrations du moment. Il s’écrit comme K : <strong>produits au numérateur, réactifs au dénominateur</strong>, chaque concentration (en mol/L) à la puissance de son coefficient dans l’équation ; les <strong>solides valent 1</strong>. Ici, dans l’état initial : [Ag⁺] = 0,10 mol/L et [Cu²⁺] = 0,10 mol/L. Qr est sans unité.</>,
      tache: { type: 'num', q: 'Calculez Qr dans l’état initial pour 2 Ag⁺ + Cu ⇌ 2 Ag + Cu²⁺', unite: '', vrai: 10, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Les solides Ag et Cu valent 1 : Qr = [Cu²⁺] / [Ag⁺]² (le coefficient de Ag⁺ est 2).', 'Qr = 0,10 / (0,10)² = 0,10 / 0,010 = 10.'],
        pieges: [[1, 'Vous avez oublié l’exposant 2 de [Ag⁺] : le coefficient stœchiométrique de Ag⁺ est 2, donc [Ag⁺] est élevé au carré.'], [0.1, 'Le quotient est inversé : les produits (ici Cu²⁺) sont au numérateur et les réactifs (Ag⁺) au dénominateur.'], [100, 'Vous avez mis [Ag⁺]² au numérateur : Cu²⁺ est un produit, Ag⁺ un réactif.']],
        expl: 'Qr = [Cu²⁺] / [Ag⁺]² = 0,10 / 0,010 = 10.',
        indice: 'Qr = [Cu²⁺] / [Ag⁺]² (les solides valent 1). Calculez d’abord [Ag⁺]² = (0,10)².' } },
    { id: 'sens', titre: 'Dans quel sens évolue le système ?',
      texte: <>Le système n’est à l’équilibre que si Qr = K, et il évolue spontanément pour que <strong>Qr se rapproche de K</strong>. L’axe logarithmique repère maintenant Qr = 10 et K ≈ {puissanceTexte(PAG.logK)}. Rappel : Qr = [Cu²⁺] / [Ag⁺]² ; dans le sens direct, Ag⁺ est consommé et Cu²⁺ se forme.</>,
      tache: { type: 'qcm', q: 'Dans quel sens évolue le système, et pourquoi ?', ...Q.sens,
        expl: 'Qr (10) est très inférieur à K (2×10¹⁵) : Qr doit augmenter pour atteindre K. Comme Qr = [Cu²⁺] / [Ag⁺]², il augmente quand Cu²⁺ se forme et que Ag⁺ disparaît : c’est le sens direct.',
        indice: 'Qr doit se rapprocher de K : doit-il augmenter ou diminuer ? Dans Qr = [Cu²⁺] / [Ag⁺]², que fait Qr quand [Cu²⁺] augmente et [Ag⁺] diminue ?' } },
    { id: 'evolue', titre: 'Laisser le système évoluer',
      retenirTitre: 'À retenir : comparer Qr et K', retenir: <>
        <SvgQrKCarte/>
        <Ul>
          <li><strong>Qr = [produits]^coef / [réactifs]^coef</strong> (solides : 1), calculé avec les concentrations du moment.</li>
          <li><strong>Qr {'<'} K</strong> : sens direct ; <strong>Qr = K</strong> : équilibre ; <strong>Qr {'>'} K</strong> : sens inverse. Qr évolue toujours vers K.</li>
          <li>Moyen de s’en souvenir : <strong>« Qr plus petit que K : on avance »</strong>. Idée fausse : « le système évolue vers l’équilibre en annulant Qr » : il évolue vers Qr = K, pas vers zéro.</li>
        </Ul></>,
      texte: <>Lancez l’évolution : Ag⁺ réagit avec le cuivre, de l’argent se dépose sur la lame d’argent, la lame de cuivre s’amincit et la solution se teinte en bleu avec Cu²⁺. Suivez la bille bleue Qr sur l’axe : elle avance vers K et s’arrête quand Qr = K. L’animation est schématique : sa durée n’a pas de signification physique.</>,
      tache: { type: 'action', ok: tau >= 1, label: marche ? 'Évolution en cours…' : tau >= 1 ? 'Évolution terminée' : 'Laisser évoluer', faire: () => { if (!marche) lancer(); }, consigne: 'Lancez l’évolution et attendez que Qr atteigne K' } },
    { id: 'inverse', titre: 'Quand le sens inverse l’emporte',
      texte: <>Autre cas : les couples <strong>Ag⁺ / Ag</strong> (E° = 0,80 V) et <strong>Fe³⁺ / Fe²⁺</strong> (E° = 0,77 V, avec Fe³⁺ + e⁻ ⇌ Fe²⁺). Ag⁺ est l’oxydant du plus grand E° : la règle du γ prévoit Ag⁺ + Fe²⁺ ⇌ Ag + Fe³⁺, avec N = 1 et log K = 1 × (0,80 − 0,77) / 0,06 = 0,50, soit <strong>K = 3,2</strong>. Le bécher (solution acide, lame d’argent) contient : [Ag⁺] = 0,010 mol/L, [Fe²⁺] = 0,10 mol/L et [Fe³⁺] = 0,10 mol/L. Qr = [Fe³⁺] / ( [Ag⁺] × [Fe²⁺] ) (les solides valent 1).</>,
      tache: { type: 'qcm', q: 'Dans quel sens évolue ce système ?', ...Q.inverse,
        expl: 'Qr = 0,10 / (0,010 × 0,10) = 100 est supérieur à K = 3,2 : Qr doit diminuer, donc Fe³⁺ est consommé et l’argent se redissout (Ag⁺ se forme) : sens inverse. Comme K est proche de 1, la règle du γ ne suffit plus : les concentrations décident.',
        indice: 'Calculez Qr = [Fe³⁺] / ( [Ag⁺] × [Fe²⁺] ) avec les valeurs de la légende du schéma, puis comparez-le à K = 3,2.' } },
    { id: 'potentiels', titre: 'Le même verdict avec les potentiels',
      retenirTitre: 'À retenir : les concentrations peuvent renverser le sens', retenir: <>
        <SvgConcCarte/>
        <Ul>
          <li>La règle du γ donne le sens à 1 mol/L ; quand K est <strong>proche de 1</strong> (E° voisins), les <strong>concentrations</strong> peuvent <strong>renverser le sens</strong>.</li>
          <li>On peut comparer les potentiels de Nernst des deux couples : l’oxydant du couple de <strong>plus grand E</strong> réagit. Les verdicts « E₁ {'>'} E₂ » et « Qr {'<'} K » sont équivalents.</li>
          <li>Moyen de s’en souvenir : <strong>« le plus haut potentiel gagne, avec les vraies concentrations »</strong>. Idée fausse : « le sens ne dépend que des E° » : il dépend aussi des concentrations.</li>
        </Ul></>,
      texte: <>On retrouve ce verdict avec les potentiels de Nernst. Le couple Fe³⁺ / Fe²⁺ : [Fe³⁺] = [Fe²⁺], donc E(Fe³⁺ / Fe²⁺) = 0,77 + 0,06 × log 1 = <strong>0,77 V</strong>. Pour Ag⁺ / Ag (E° = 0,80 V, n = 1), dans la solution à [Ag⁺] = 0,010 mol/L, le solide vaut 1 : E(Ag⁺ / Ag) = E° + (0,06 / 1) × log [Ag⁺].</>,
      tache: { type: 'num', q: 'Calculez le potentiel E(Ag⁺ / Ag) dans cette solution', unite: 'V', vrai: E_AG_INV, tol: 0.015, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['log(0,010) = −2.', 'E = 0,80 + 0,06 × (−2) = 0,68 V.', 'E(Ag⁺ / Ag) = 0,68 V est inférieur à E(Fe³⁺ / Fe²⁺) = 0,77 V : c’est Fe³⁺ l’oxydant le plus fort. Il réagit avec l’argent : sens inverse, comme avec Qr et K.'],
        pieges: [[0.80, 'Vous avez donné E° : [Ag⁺] = 0,010 mol/L n’est pas 1 mol/L, le logarithme n’est pas nul.'], [0.92, 'Signe du logarithme inversé : [Ag⁺] < 1 mol/L, donc log [Ag⁺] est négatif et E est plus petit que E°.']],
        expl: 'E(Ag⁺ / Ag) = 0,80 + 0,06 × log(0,010) = 0,68 V, inférieur à E(Fe³⁺ / Fe²⁺) = 0,77 V : le sens inverse l’emporte.',
        indice: 'Calculez log de [Ag⁺] = 0,010, multipliez par 0,06 / 1 puis ajoutez E° = 0,80 V.' } },
    { id: 'bloque', titre: 'Prévu mais non observé',
      texte: <>L’eau oxygénée H₂O₂ est à la fois l’oxydant du couple H₂O₂ / H₂O (E° = 1,78 V) et le réducteur du couple O₂ / H₂O₂ (E° = 0,68 V) : elle peut réagir sur elle-même, 2 H₂O₂ → O₂ + 2 H₂O. Avec N = 2, log K = 2 × (1,78 − 0,68) / 0,06 = {nbf(M.H2O2.logK, 1)} : <strong>K ≈ 5×10³⁶</strong>, immense. Pourtant le flacon reste limpide, sans bulle, pendant des mois. Ajoutez maintenant un peu de dioxyde de manganèse MnO₂ solide et observez.</>,
      tache: { type: 'action', ok: cat, label: cat ? 'Catalyseur ajouté' : 'Ajouter le catalyseur', faire: () => setCat(true), consigne: 'Ajoutez le catalyseur au flacon' } },
    { id: 'conclure', titre: 'Interpréter l’expérience',
      texte: <>Dès l’ajout de MnO₂, l’eau oxygénée se transforme : des bulles de dioxygène se dégagent. MnO₂ est retrouvé intact à la fin et la constante K de la réaction n’a pas changé : seule la vitesse a changé.</>,
      tache: { type: 'qcm', q: 'Comment interpréter l’absence de bulles avant l’ajout du catalyseur ?', ...Q.conclure,
        expl: 'K et Qr indiquent seulement le sens d’évolution possible. Avec un K aussi grand, la transformation est thermodynamiquement favorable, mais elle est extrêmement lente sans catalyseur : c’est un blocage cinétique. Un catalyseur accélère la réaction sans modifier K.',
        indice: 'Un catalyseur modifie-t-il la constante d’équilibre ? Que faut-il en déduire sur l’absence de bulles sans catalyseur ?' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : prévoir n’est pas observer', retenir: <>
        <SvgBlocageCarte/>
        <Ul>
          <li><strong>K</strong> (à partir des E°) dit jusqu’où la transformation peut aller ; <strong>Qr comparé à K</strong> dit dans quel sens elle évolue.</li>
          <li>Ni K ni Qr ne renseignent sur la <strong>vitesse</strong> : une transformation prévue mais non observée est un <strong>blocage cinétique</strong> (un catalyseur ou la chaleur peut le lever).</li>
          <li>Moyen de s’en souvenir : <strong>« K et Qr : le sens ; pas la vitesse »</strong>. Idée fausse : « si rien ne se passe, la réaction est impossible » : elle peut seulement être très lente.</li>
        </Ul></>,
      texte: <>Vous savez prévoir une réaction avec la règle du γ, calculer K à partir des potentiels standards, comparer Qr à K pour trouver le sens d’évolution (ou comparer les potentiels de Nernst) et repérer un blocage cinétique. Passez à l’exploration pour tester d’autres couples et d’autres concentrations, ou relevez les défis.</> },
  ];

  // ---------- état affiché dans la scène (parcours guidé) ----------
  const etG = M.etatTau(EVAG, tau);
  const sit = (() => {
    switch (idE) {
      case 'echelle': return { p: PZC, c: C_ZC, dir: null, dep: 0 };
      case 'evolue': return { p: PAG, c: etG.c, dir: tau > 0 ? 'direct' : null, dep: depOf(EVAG, tau) };
      case 'inverse': case 'potentiels': return { p: PINV, c: M.GUIDE.invC, dir: null, dep: 0 };
      case 'bloque': case 'conclure': case 'bilan': return null;
      default: return { p: PAG, c: M.GUIDE.agC, dir: null, dep: 0 };
    }
  })();
  const jaugeG = (() => {
    const lkA = PAG.logK, [loA, hiA] = plageJauge(M.logQ(PAG, M.GUIDE.agC), lkA), lkI = PINV.logK, lqI = M.logQ(PINV, M.GUIDE.invC), [loI, hiI] = plageJauge(lqI, lkI);
    switch (idE) {
      case 'totale': return { logK: lkA, logQ: M.logQ(PAG, M.GUIDE.agC), lo: loA, hi: hiA, montrerQ: false, zones: false };
      case 'qr': return { logK: lkA, logQ: M.logQ(PAG, M.GUIDE.agC), lo: loA, hi: hiA, montrerQ: reussie, zones: false };
      case 'sens': return { logK: lkA, logQ: M.logQ(PAG, M.GUIDE.agC), lo: loA, hi: hiA, zones: reussie };
      case 'evolue': return { logK: lkA, logQ: etG.logQ, lo: loA, hi: hiA, zones: true, fleche: tau < 1 };
      case 'inverse': return { logK: lkI, logQ: lqI, lo: loI, hi: hiI, montrerQ: reussie, zones: reussie, fleche: reussie };
      case 'potentiels': return { logK: lkI, logQ: lqI, lo: loI, hi: hiI, zones: true, fleche: true };
      default: return null;
    }
  })();

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'k' ? { type, ...M.tirageDefiK(), rep: '', verifie: false } : { type, ...M.tirageDefiSens(), rep: '', choix: '', verifie: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const verifier = () => {
    const d = defi; let diag = { msg: '' }, ok = false;
    const v = lireNombre(d.rep), p = d.p;
    if (d.type === 'k') {
      const vrai = p.logK, tol = M.tolLogK(vrai), n1 = p.ox1.n, n2 = p.red2.n, dE = p.ox1.E0 - p.red2.E0;
      if (!isFinite(v)) diag = { msg: 'Entrez un nombre (par exemple 15,3), le logarithme décimal de K.' };
      else if (Math.abs(v - vrai) <= tol) ok = true;
      else {
        const essais = [
          [dE / M.PENTE, 'Vous avez oublié N : log K = N × (E°₁ − E°₂) / 0,06, avec N le nombre d’électrons échangés dans l’équation écrite.'],
          [n1 !== p.N ? n1 * dE / M.PENTE : null, `Vous avez pris N = ${n1} (électrons du couple ${p.ox1.nom}) : N est le nombre d’électrons de l’équation écrite, ici ${p.N}.`],
          [n2 !== p.N && n2 !== 1 ? n2 * dE / M.PENTE : null, `Vous avez pris N = ${n2} (électrons du couple ${p.red2.nom}) : N est le nombre d’électrons de l’équation écrite, ici ${p.N}.`],
          [-vrai, 'Signe inversé : E°₁ est le plus grand des deux potentiels standards, donc E°₁ − E°₂ est positif.'],
          [p.K, 'Vous avez donné K : la question porte sur log K.'],
        ].filter(([val]) => val != null && isFinite(val));
        const trouve = essais.find(([val]) => Math.abs(val - vrai) > tol && Math.abs(v - val) <= Math.max(0.06, 0.03 * Math.abs(val)));
        diag = trouve ? { msg: trouve[1] } : { msg: `Votre valeur est ${v < vrai ? 'trop petite' : 'trop grande'}. Refaites le calcul : log K = N × (E°₁ − E°₂) / 0,06.` };
      }
    } else {
      const qrVrai = M.quotient(p, d.c), sensVrai = M.sens(p, d.c);
      const okQ = isFinite(v) && v > 0 && accepte(v, d.rep, qrVrai, 0.05), okS = d.choix === sensVrai;
      ok = okQ && okS;
      if (!isFinite(v) || v <= 0) diag = { msg: 'Entrez un nombre positif pour Qr (par exemple 12 ou 3,5×10⁻³).' };
      else if (!okQ) {
        const sansExp = p.especes.reduce((s, x) => (x.solide ? s : s * Math.pow(d.c[x.e], Math.sign(x.coef))), 1);
        const essais = [[1 / qrVrai, 'Le quotient est inversé : produits au numérateur, réactifs au dénominateur.'], [p.a !== 1 || p.b !== 1 ? sansExp : null, 'Vérifiez les exposants : chaque concentration est élevée à la puissance de son coefficient dans l’équation.']].filter(([val]) => val != null && isFinite(val));
        const trouve = essais.find(([val]) => Math.abs(val - qrVrai) > 0.05 * qrVrai && Math.abs(v - val) <= 0.06 * Math.abs(val));
        const lkE = p.logK, coherent = d.choix && ((v < p.K ? 'direct' : 'inverse') === d.choix);
        diag = { msg: `${trouve ? trouve[1] : `Qr n’est pas correct : il est ${v < qrVrai ? 'trop petit' : 'trop grand'}. Calculez [produits]^coef / [réactifs]^coef avec les concentrations du schéma (les solides valent 1).`}${d.choix ? (coherent ? ` Votre conclusion est cohérente avec votre valeur de Qr (comparée à K = ${puissanceTexte(lkE)}), mais Qr est faux.` : '') : ''}` };
      } else if (!okS) {
        diag = { msg: !d.choix ? 'Choisissez le sens d’évolution.' : `Qr = ${puissanceTexte(Math.log10(qrVrai))} est correct, mais la conclusion non : il faut comparer Qr à K = ${puissanceTexte(p.logK)}. Si Qr < K le système évolue dans le sens direct ; si Qr > K, dans le sens inverse.` };
      }
    }
    setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
    (d.type === 'k' ? noterK : noterS)(ok);
  };
  const correction = d => {
    const p = d.p;
    if (d.type === 'k') return `Équation : ${M.equationTexte(p, false)} ; N = ${p.N}. log K = ${p.N} × (${nbf(p.ox1.E0, 2)} − (${nbf(p.red2.E0, 2)})) / 0,06 = ${nbf(p.logK, 1)}, soit K ≈ ${puissanceTexte(p.logK)} (marge acceptée : environ ± ${nbf(M.tolLogK(p.logK), 1)}).`;
    const s = M.sens(p, d.c), txt = { direct: 'sens direct (Qr < K)', inverse: 'sens inverse (Qr > K)', equilibre: 'équilibre' }[s];
    return `${detailQr(p, d.c)}. K = ${puissanceTexte(p.logK)} : ${txt}.`;
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const demiEq = c => <li key={c.id}><strong>{c.nom}</strong> : {demi(c)} (n = {c.n}), E° = <strong>{nbf(c.E0, 2)} V</strong></li>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['k', 'Calculer log K'], ['sens', 'Prévoir le sens']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'k' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est la constante d’équilibre ?</div>
        <div style={{ ...lbl, marginBottom: 6 }}>Deux couples sont en présence (25 °C) :</div>
        <ul style={{ ...lbl, margin: '0 0 8px', paddingLeft: 18 }}>{[defi.p.ox1, defi.p.red2].sort(() => 0).map(demiEq)}</ul>
        <div style={{ ...lbl, marginBottom: 8 }}>L’oxydant du couple de plus grand E° réagit avec le réducteur de l’autre couple. Écrivez l’équation (en équilibrant les électrons), puis calculez <strong>log K</strong> de la réaction. Donnez-le avec 3 chiffres significatifs.</div>
        <IndiceDefi cache={false}>log K = N × (E°₁ − E°₂) / 0,06 : E°₁ est le plus grand potentiel standard et N le nombre d’électrons de l’équation écrite (le plus petit multiple commun des deux n).</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : dans quel sens évolue le système ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Le schéma indique la composition du bécher (25 °C ; les métaux sont présents). Équation (sens direct) : <strong>{avecIndices(M.equationTexte(defi.p))}</strong> ; log K = <strong>{nbf(defi.p.logK, 2)}</strong>, soit K ≈ {puissanceTexte(defi.p.logK)}. Calculez Qr, puis donnez le sens d’évolution du système.</div>
        <IndiceDefi cache={false}>Qr = [produits]^coef / [réactifs]^coef avec les concentrations du schéma ; les solides valent 1. Si Qr {'<'} K le système évolue dans le sens direct ; si Qr {'>'} K, dans le sens inverse.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>{defi.type === 'k' ? 'log K =' : 'Qr ='}</span>
        <input value={defi.rep} aria-label={defi.type === 'k' ? 'logarithme décimal de K' : 'quotient de réaction Qr'} onKeyDown={e => e.key === 'Enter' && document.getElementById('sev-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
          style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      </div>
      {defi.type === 'sens' && <div style={{ maxWidth: 360, margin: '0 0 8px' }}>
        <SelectGen nom="Sens d’évolution" valeur={defi.choix} onChange={v => setDefi(d => ({ ...d, choix: v, verifie: false, corr: false }))}
          options={[['', 'Choisissez…'], ['direct', 'sens direct (de gauche à droite)'], ['inverse', 'sens inverse (de droite à gauche)'], ['equilibre', 'équilibre : aucune évolution']]}/></div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="sev-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? correction(defi) : defi.diag.msg))}
        {!defi.ok && defi.diag.msg && !/^(Entrez|Choisissez)/.test(defi.diag.msg) && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 42 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(correction(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température : 25 °C.</strong> Le coefficient <strong>0,06 V</strong> est un arrondi de (R T / F) ln 10 = 0,0592 V.</li>
      <li><strong>K est un ordre de grandeur.</strong> Les E° sont tabulés au centivolt : une erreur de 0,01 V sur un écart de potentiels change log K de 0,3 pour N = 2. Deux chiffres significatifs sur K n’ont donc pas de sens expérimental.</li>
      <li><strong>Activités assimilées aux concentrations</strong> (solutions diluées, au plus 1 mol/L) ; les solides (métaux) sont purs et présents en excès : leur quantité ne limite jamais la transformation et leur « concentration » vaut 1 dans Qr.</li>
      <li><strong>Sens d’évolution spontanée :</strong> Qr {'<'} K donne le sens direct, Qr {'>'} K le sens inverse ; Qr = K est l’état d’équilibre. Ce critère ne dit rien de la vitesse.</li>
      <li><strong>Animation schématique :</strong> la concentration du réactif limitant décroît de façon exponentielle jusqu’à l’équilibre ; la durée affichée n’a aucune valeur physique, et le modèle ne décrit pas la cinétique.</li>
      <li><strong>Solutions acides :</strong> pour Fe³⁺ / Fe²⁺ on suppose une solution suffisamment acide pour qu’aucun hydroxyde de fer ne précipite et que les ions ne soient pas oxydés par l’air.</li>
      <li><strong>Eau oxygénée :</strong> E°(H₂O₂ / H₂O) = 1,78 V et E°(O₂ / H₂O₂) = 0,68 V (valeurs tabulées arrondies) ; les ions H⁺ s’éliminent dans 2 H₂O₂ → O₂ + 2 H₂O, K ≈ 5×10³⁶. La stabilité du flacon est un blocage cinétique ; le catalyseur MnO₂ accélère la réaction sans modifier K.</li>
      <li><strong>Schéma :</strong> chaque point représente une quantité relative d’ions (échelle logarithmique de 1 mmol/L à 1 mol/L) ; les cristaux d’argent sont schématiques.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const pEx = useMemo(() => M.paire(ex.a, ex.b), [ex.a, ex.b]);
  const evEx = useMemo(() => M.evolution(pEx, ex.c), [pEx, ex.c]);
  const etEx = M.etatTau(evEx, tau);
  const lqEx = M.logQ(pEx, ex.c), sensEx = M.sens(pEx, ex.c), potEx = M.potentiels(pEx, ex.c);
  const [loEx, hiEx] = plageJauge(lqEx, pEx.logK);
  const majConc = (e, v) => { remise(); setEx(s => ({ ...s, c: { ...s.c, [e]: v } })); };
  const changerCouple = (cle, id) => {
    remise();
    setEx(s => {
      let a = cle === 'a' ? id : s.a, b = cle === 'b' ? id : s.b;
      if (a === b) { const autre = M.ORDRE.find(x => x !== a); if (cle === 'a') b = autre; else a = autre; }
      const p = M.paire(a, b), c = {}; for (const e of p.dissoutes) c[e] = s.c[e] ?? 0.10;
      return { a, b, c };
    });
  };
  const verdictTxt = { direct: 'sens direct : Qr < K', inverse: 'sens inverse : Qr > K', equilibre: 'équilibre : Qr = K' }[sensEx];
  const controlesEx = (
    <div style={styleBoite}>
      <SelectGen nom="Couple 1" valeur={ex.a} onChange={v => changerCouple('a', v)} options={M.ORDRE.map(id => [id, `${C[id].nom} (E° = ${nbf(C[id].E0, 2)} V)`])}/>
      <SelectGen nom="Couple 2" valeur={ex.b} onChange={v => changerCouple('b', v)} options={M.ORDRE.map(id => [id, `${C[id].nom} (E° = ${nbf(C[id].E0, 2)} V)`, id === ex.a])}/>
      <div style={aide}>Les deux couples sont dans le bécher avec leurs métaux solides (s’il y en a) ; le simulateur prévoit la réaction.</div>
      {pEx.dissoutes.map(e => <SelectConc key={e} espece={e} valeur={ex.c[e]} onChange={v => majConc(e, v)}/>)}
      <div style={aide}>Chaque menu fixe la concentration initiale de l’ion ; l’axe et le verdict se mettent à jour.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" disabled={marche || sensEx === 'equilibre'} onClick={lancer} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42, opacity: marche || sensEx === 'equilibre' ? 0.6 : 1 }}>{marche ? 'Évolution en cours…' : 'Laisser évoluer'}</button>
        {tau > 0 && <button type="button" onClick={remise} style={{ ...styleBouton(false), minHeight: 42 }}><Pic n="refresh"/>État initial</button>}
      </div>
      {sensEx === 'equilibre' && <div style={{ ...aide, marginTop: 6 }}>Le système est déjà à l’équilibre : il n’évolue pas.</div>}
    </div>);
  const mesuresEx = (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={{ ...aide, marginBottom: 8 }}>Équation (sens direct) : <strong style={{ color: KIT.txt }}>{avecIndices(M.equationTexte(pEx))}</strong></div>
      <LigneMesure nom={`N (électrons échangés) ; log K = N (E°₁ − E°₂) / 0,06`} valeur={`N = ${pEx.N} ; log K = ${nbf(pEx.logK, 1)}`}/>
      <LigneMesure nom="Constante d’équilibre K" valeur={puissanceTexte(pEx.logK)} couleur="#b45309"/>
      <LigneMesure nom={tau > 0 ? 'Quotient de réaction Qr (en cours)' : 'Quotient de réaction Qr'} valeur={puissanceTexte(etEx.logQ)} couleur="#0369a1"/>
      <LigneMesure nom="Verdict (Qr comparé à K)" valeur={tau >= 1 ? 'équilibre atteint : Qr = K' : verdictTxt}/>
      <LigneMesure nom={`E(${pEx.ox1.nom}) − E(${pEx.red2.nom}) (Nernst)`} valeur={`${nbf(potEx.E1, 2)} − (${nbf(potEx.E2, 2)}) = ${nbf(potEx.E1 - potEx.E2, 2)} V`}/>
    </div>);
  const h2o2Ex = (
    <Section titre={`Confrontation à l’expérience : eau oxygénée · catalyseur : ${cat ? 'ajouté' : 'non'}`} ouvert={ouv.h2o2} onBascule={() => setOuv(o => ({ ...o, h2o2: !o.h2o2 }))}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}><FlaconH2O2 catalyseur={cat} afficherK anime={!reduit}/></div>
      <div style={aide}>2 H₂O₂ → O₂ + 2 H₂O : log K = 2 × (1,78 − 0,68) / 0,06 = {nbf(M.H2O2.logK, 1)}. La transformation est prévue mais ne s’observe pas sans catalyseur : K et Qr ne donnent pas la vitesse.</div>
      <button type="button" onClick={() => setCat(c => !c)} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42 }}>{cat ? 'Retirer le catalyseur' : 'Ajouter le catalyseur MnO₂'}</button>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez Zn²⁺ / Zn et Cu²⁺ / Cu : lancez l’évolution. Que valent les concentrations à la fin ? Comparez Qr final et K.</li>
        <li>Choisissez Ag⁺ / Ag et Fe³⁺ / Fe²⁺ : trouvez des concentrations qui donnent le sens inverse, puis une composition proche de l’équilibre (Qr ≈ K). Que vaut alors E₁ − E₂ ?</li>
        <li>Pour quelle paire de couples K est-il le plus petit ? Le plus grand ? Classez les paires par log K : lesquelles donnent une transformation quasi totale ?</li>
        <li>Peut-on inverser le sens pour Zn²⁺ / Zn et Cu²⁺ / Cu avec les concentrations proposées (de 1 mmol/L à 1 mol/L) ? Pourquoi ?</li>
        <li>Dans la rubrique de l’eau oxygénée : que change l’ajout du catalyseur à la valeur de K ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Règle du γ : l’oxydant le plus fort (E° grand) réagit avec le réducteur le plus fort (E° petit), à 1 mol/L</li>
          <li>log K = N (E°₁ − E°₂) / 0,06 ; K {'>'} 10⁴ : transformation quasi totale</li>
          <li>Qr = [produits]^coef / [réactifs]^coef (solides : 1) ; Qr {'<'} K : sens direct, Qr {'>'} K : sens inverse, Qr = K : équilibre</li>
          <li>Si K est proche de 1, les concentrations peuvent renverser le sens ; E₁ − E₂ = (0,06 / N) log(K / Qr)</li>
          <li>K et Qr donnent le sens, jamais la vitesse : prévu mais non observé = blocage cinétique</li>
        </ul>
      </ARetenir>
    </Section>);

  // ---------- scène selon le mode ----------
  const dd = enDefi && defi ? defi : null;
  const sceneDefi = dd && dd.type === 'sens' ? { p: dd.p, c: dd.c, dir: null, dep: 0 } : null;
  const dirEx = tau > 0 && sensEx !== 'equilibre' ? sensEx : null;
  const sceneEx = { p: pEx, c: etEx.c, dir: dirEx, dep: depOf(evEx, tau) };
  const sc = enGuide ? sit : enExplore ? sceneEx : sceneDefi;
  const boxScene = sc && (<div style={styleBoite}><SceneReaction p={sc.p} c={sc.c} dir={sc.dir} dep={sc.dep} anime={!reduit}/></div>);
  const jaugeDefi = dd && dd.type === 'sens' ? { logK: dd.p.logK, logQ: M.logQ(dd.p, dd.c), ...(() => { const [lo, hi] = plageJauge(M.logQ(dd.p, dd.c), dd.p.logK); return { lo, hi }; })(), montrerQ: !!dd.verifie, zones: !!dd.verifie, fleche: !!dd.verifie } : null;
  const jaugeEx = { logK: pEx.logK, logQ: etEx.logQ, lo: loEx, hi: hiEx, zones: true, fleche: tau < 1 && sensEx !== 'equilibre' };
  const jg = enGuide ? jaugeG : enExplore ? jaugeEx : jaugeDefi;
  const boxJauge = jg && (<div style={styleBoite}><div style={titreCarte}>Qr et K sur un axe logarithmique</div>
    <Jauge logK={jg.logK} logQ={jg.logQ} lo={jg.lo} hi={jg.hi} zones={jg.zones} fleche={jg.fleche} montrerQ={jg.montrerQ !== false}/></div>);
  const boxFlacon = enGuide && (idE === 'bloque' || idE === 'conclure') && (
    <div style={styleBoite}><FlaconH2O2 catalyseur={cat} afficherK anime={!reduit}/></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sev-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sev-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sev-col { display: flex; flex-direction: column; gap: 12px; }
        .sev-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .sev-sc { max-width: 520px; margin: 0 auto; width: 100%; }
        @media (min-width: 901px) { .sev-l1.cote .sev-carte { order: 2; } .sev-l1.cote .sev-main { order: 1; }
          .sev-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .sev-ex > * { grid-column: 1; } .sev-ex > .sev-ctrl-col { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .sev-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sev-in { animation: sev-fondu 0.35s ease-out; } @keyframes sev-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Prévoir le sens d’évolution : Qr, K et potentiels standards</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Les <strong>potentiels standards</strong> donnent la <strong>constante d’équilibre K</strong> ; en la comparant au <strong>quotient de réaction Qr</strong>, on prévoit le sens d’évolution, puis on confronte la prévision à l’expérience.</div>
      {!enExplore && <div className={enGuide ? 'sev-l1 cote' : 'sev-l1'}>
        {enGuide ? <div className="sev-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="sev-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'k' ? suiviK : suiviS}/></div>}
          <div className="sev-col">
            {boxScene && <div className="sev-in sev-sc">{boxScene}</div>}
            {boxJauge && <div className="sev-in sev-sc">{boxJauge}</div>}
            {boxFlacon && <div className="sev-in sev-sc">{boxFlacon}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="sev-ex">
        <div className="sev-sc">{boxScene}</div>
        <div className="sev-ctrl-col">{controlesEx}</div>
        <div className="sev-sc">{boxJauge}</div>
        <div>{mesuresEx}</div>
        <div style={styleBoite}>{h2o2Ex}</div>
        <div>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
