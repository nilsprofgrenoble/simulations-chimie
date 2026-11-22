import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, ExempleResolu, Formule, VoirSolution, BoiteSolution } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mesureIncertitude2gtModele";
import { QCM } from "./mesureIncertitude2gtQcm";
import { FicheIntervalle, FicheCalcul, FicheBaisser, FicheEcriture, FicheCompatible, FicheSysteme } from "./MesureIncertitude2gtFiches";
import { SceneAxe, SceneCalculU, SceneNombre, SceneArrondi, SceneEcriture, SceneBilanMesure } from "./MesureIncertitude2gtScenes";

const SIM_ID = 194, CLE_GUIDE = 'mesure-incertitude-2gt-guide-v1';
declarerDefis(SIM_ID, [['ecrire', 'Écrire le résultat d’une série de mesures'], ['compatible', 'Ce résultat est-il compatible avec la référence ?']]);

// ====================================================
//  SIM 194 — MESURE : INCERTITUDE-TYPE, ÉCRITURE DU RÉSULTAT ET COMPARAISON À UNE RÉFÉRENCE (2GT, thème « Mesure et incertitudes »).
//  Une idée par étape : la moyenne ; l'incertitude-type u = zone des valeurs raisonnables ; petit u / grand u ; u = s ÷ √n (règle DONNÉE) ;
//  l'effet du nombre de mesures ; l'effet de l'instrument ; arrondir u ; écrire le résultat ; comparer qualitativement à une référence ;
//  ce que u ne dit pas (erreur systématique). Hypothèses explicites (panneau) : mesures indépendantes, même mesurande, dispersion symétrique,
//  instrument non biaisé ; u = s ÷ √n non démontrée ; comparaison qualitative (pas de critère chiffré).
//  Capacités visées (jamais affichées à l'élève) : expliquer qualitativement la signification d'une incertitude-type et l'évaluer par une
//  approche statistique ; écrire, avec un nombre adapté de chiffres significatifs, le résultat d'une mesure ; comparer qualitativement un résultat
//  à une valeur de référence. Même convention d'arrondi que la sim 161 (1G) : u sur 1 chiffre significatif (2 si le premier est 1), par excès.
//  Toutes les valeurs sont FICTIVES (simulées). Modèle : mesureIncertitude2gtModele.js (testé).
// ====================================================

const NB = ' ';
const COL = M.COL;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const fr3 = x => (isFinite(x) ? Number(x).toPrecision(3).replace('.', ',') : '—');      // 3 chiffres significatifs, virgule française
const LIBELLE_COMPAT = { compatible: 'Compatible : la référence est dans l’intervalle', non: 'Pas compatible : la référence est loin de l’intervalle' };
const FormuleU = () => <Formule><mi>u</mi><mo>=</mo><mfrac><mi>s</mi><msqrt><mi>n</mi></msqrt></mfrac></Formule>;
// axe adapté à la situation ET à l'instrument (il se resserre pour un meilleur instrument) : couvre le décalage, graduations « rondes »
function axeAuto(sit, instr) {
  const sg = instr.sigma, lo = sit.ref - 3.4 * sg, hi = sit.ref + 3.4 * sg + sit.biais, brut = (hi - lo) / 5;
  const e = Math.pow(10, Math.floor(Math.log10(brut))), pas = [1, 2, 5, 10].map(k => k * e).find(p => p >= brut - 1e-12);
  return { min: Number((Math.floor(lo / pas + 1e-9) * pas).toFixed(8)), max: Number((Math.ceil(hi / pas - 1e-9) * pas).toFixed(8)), pas, dec: Math.max(0, -Math.floor(Math.log10(pas) + 1e-9)) };
}

// ====================================================
export function SimulationMesureIncertitude2gt() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviE, noterE, vueE] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('ecrire');
  const [ex, setEx] = useState({ sit: 'piece', ii: 1, n: 9, graine: 7, biais: false, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });

  // ---------- étapes du parcours ----------
  const IDS = ['moyenne', 'intervalle', 'enmots', 'calcul', 'nombre', 'instrument', 'arrondi', 'resultat', 'comparer', 'systematique', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);
  const GM = M.G;

  const ETAPES = [
    { id: 'moyenne', titre: 'Plusieurs mesures, une moyenne', focus: ['scene'],
      texte: <>Quand on mesure plusieurs fois la même grandeur, avec le même instrument, on ne trouve pas toujours exactement la même valeur. Pour résumer la série, on calcule sa <strong>moyenne</strong> : on additionne toutes les mesures, puis on divise la somme par le nombre de mesures.
        <ExempleResolu>On chronomètre quatre fois la chute d’une bille : 0,62{NB}s ; 0,66{NB}s ; 0,64{NB}s ; 0,64{NB}s. Somme : 2,56{NB}s. Moyenne : 2,56 ÷ 4 = <strong>0,64{NB}s</strong>.</ExempleResolu>
        À vous : on pèse cinq fois la même pièce. Les mesures sont <strong>7,52{NB}g ; 7,48{NB}g ; 7,50{NB}g ; 7,53{NB}g ; 7,47{NB}g</strong>.</>,
      tache: { type: 'num', q: 'Quelle est la moyenne de ces cinq masses ?', carnet: 'Moyenne des cinq pesées', unite: 'g', vrai: GM.moyenne.m, tol: 0.001, affiche: v => M.fmt(v, 2),
        calcul: () => ['Somme : 7,52 + 7,48 + 7,50 + 7,53 + 7,47 = 37,50 g.', 'Nombre de mesures : 5. Moyenne : 37,50 ÷ 5 = 7,50 g.'],
        pieges: [[37.5, 'C’est la somme des mesures. Il faut ensuite la diviser par le nombre de mesures.'], [9.375, 'Vous avez divisé par 4. Il y a cinq mesures : divisez par 5.']],
        expl: 'On additionne les cinq masses (37,50 g) puis on divise par 5 : la moyenne est 7,50 g.', indice: 'Additionnez les cinq masses, puis divisez le résultat par le nombre de pesées (5).' } },
    { id: 'intervalle', titre: 'Quelles valeurs sont possibles ?', focus: ['scene'],
      texte: <>Les mesures varient : on ne peut donc pas affirmer « la durée vaut exactement 0,64{NB}s ». On donne la moyenne et un « doute » : l’<strong>incertitude-type</strong>, notée <strong>u</strong>. Elle fixe la <strong>zone des valeurs que l’on peut raisonnablement attribuer</strong> à la grandeur : de « moyenne − u » à « moyenne + u ».
        <ExempleResolu>Pour la chute de la bille : moyenne 0,64{NB}s et u = 0,02{NB}s. La zone va de 0,64 − 0,02 = 0,62{NB}s à 0,64 + 0,02 = 0,66{NB}s. La valeur 0,65{NB}s est raisonnable ; la valeur 0,80{NB}s ne l’est pas.</ExempleResolu>
        À vous : on a mesuré plusieurs fois la longueur d’une feuille. Sur l’axe : la moyenne (trait noir). La zone orange apparaîtra après votre réponse.</>,
      tache: { type: 'qcm', ...QCM.intervalle } },
    { id: 'enmots', titre: 'Petite ou grande incertitude ?', focus: ['scene'],
      retenirTitre: 'À retenir : la zone des valeurs raisonnables', retenir: <FicheIntervalle/>,
      texte: <>La largeur de la zone, de « moyenne − u » à « moyenne + u », traduit la qualité de la connaissance de la valeur : il suffit de comparer les zones de deux résultats.
        <ExempleResolu>Deux résultats pour la même durée : (12,5 ± 0,1){NB}s va de 12,4{NB}s à 12,6{NB}s ; (12,5 ± 0,5){NB}s va de 12,0{NB}s à 13,0{NB}s. Les deux ont la même moyenne, mais la zone du second est cinq fois plus large.</ExempleResolu>
        À vous : Alice et Bob ont mesuré la même pièce (voir les deux zones sur l’axe).</>,
      tache: { type: 'qcm', ...QCM.enmots } },
    { id: 'calcul', titre: 'Calculer l’incertitude-type', focus: ['scene'],
      texte: <>Comment trouver u ? On répète la mesure <strong>n</strong> fois. La calculatrice (ou le tableur) donne l’<strong>écart-type s</strong> de la série : il mesure l’éparpillement des mesures. Puis on utilise cette règle, admise en Seconde :
        <FormuleU/>
        où √n est la racine carrée du nombre de mesures (touche « √ » de la calculatrice). Dans une moyenne, les écarts en plus et en moins se compensent en partie : c’est pourquoi u est plus petite que s. <em>Règle admise : on suppose les mesures indépendantes, faites au hasard autour d’une valeur centrale.</em>
        <ExempleResolu>On a fait n = 4 mesures de durée, avec s = 0,12{NB}s. √4 = 2, donc u = 0,12 ÷ 2 = <strong>0,06{NB}s</strong>.</ExempleResolu>
        À vous : on pèse n = 9 fois une pièce ; la calculatrice donne s = 0,30{NB}g.</>,
      tache: { type: 'num', q: 'Quelle est l’incertitude-type u ?', carnet: 'Incertitude-type u (9 pesées)', unite: 'g', vrai: GM.calcul.u, tol: 0.05, affiche: v => M.fmt(v, 2),
        calcul: () => ['Nombre de mesures : n = 9, donc √9 = 3.', 'u = s ÷ √n = 0,30 ÷ 3 = 0,10 g.', 'Hypothèses : mesures indépendantes, faites dans les mêmes conditions ; la règle u = s ÷ √n est admise (non démontrée en Seconde).'],
        pieges: [[0.30, 'C’est la valeur de s. Il reste à la diviser par √n.'], [0.0333, 'Vous avez divisé par n (9) au lieu de √n (3).'], [0.9, 'Vous avez multiplié par √n au lieu de diviser.']],
        expl: 'u = s ÷ √n = 0,30 ÷ √9 = 0,30 ÷ 3 = 0,10 g.', indice: 'Calculez d’abord √9, puis divisez s par ce nombre.' } },
    { id: 'nombre', titre: 'Plus de mesures, u plus petite', focus: ['scene'],
      retenirTitre: 'À retenir : de s à u', retenir: <FicheCalcul/>,
      texte: <>Avec n = 9 pesées, on a trouvé u = 0,10{NB}g. Peut-on réduire ce doute ? Oui, en faisant plus de mesures avec le même instrument et le même protocole… mais la règle u = s ÷ √n montre que cela baisse lentement.
        <ExempleResolu>Avec s = 0,12{NB}s : pour n = 4 mesures, u = 0,12 ÷ 2 = 0,06{NB}s. Pour n = 16 mesures, u = 0,12 ÷ 4 = 0,03{NB}s. Avec 4 fois plus de mesures (même instrument, même protocole), u est 2 fois plus petite.</ExempleResolu>
        À vous : on a n = 9 pesées et u = 0,10{NB}g. On voudrait une incertitude <strong>2 fois plus petite</strong>, soit 0,05{NB}g.</>,
      tache: { type: 'num', q: 'Combien de mesures faut-il faire en tout ?', carnet: 'Nombre de mesures pour u = 0,05 g', unite: 'mesures', vrai: GM.nombre.n1, tol: 0, affiche: v => String(v),
        calcul: () => ['Diviser u par 2 demande 4 fois plus de mesures (comme de 4 à 16 dans l’exemple).', 'Nombre de mesures : 9 × 4 = 36. Vérification : √36 = 6, donc u = 0,30 ÷ 6 = 0,05 g.'],
        pieges: [[18, 'Vous avez seulement doublé le nombre de mesures (9 × 2). Pour diviser u par 2, il faut 4 fois plus de mesures.'], [81, 'Vous avez multiplié 9 par 9. Il faut multiplier par 4 (car 2 × 2 = 4).'], [4.5, 'Vous avez divisé n par 2 : avec moins de mesures, u augmenterait.']],
        expl: '4 fois plus de mesures divisent u par 2 : 9 × 4 = 36 mesures.', indice: 'Dans l’exemple, on passe de 4 à 16 mesures pour diviser u par 2. Par quel nombre a-t-on multiplié n ?' } },
    { id: 'instrument', titre: 'Le rôle de l’instrument', focus: ['scene'],
      texte: <>Le nombre de mesures n’est pas le seul levier : l’<strong>instrument</strong> et la manière de faire (le <strong>protocole</strong>) changent l’éparpillement des mesures, donc s, donc u.
        <ExempleResolu>On chronomètre 9 fois la chute d’une bille. Avec un chronomètre à main, s = 0,06{NB}s : u = 0,06 ÷ 3 = 0,02{NB}s. Avec des capteurs de lumière, s = 0,012{NB}s : u = 0,012 ÷ 3 = 0,004{NB}s.</ExempleResolu>
        À vous : on pèse neuf fois la même pièce avec deux balances, A et B. Voici leurs mesures.</>,
      tache: { type: 'qcm', ...QCM.instrument } },
    { id: 'arrondi', titre: 'Arrondir u', focus: ['scene'],
      retenirTitre: 'À retenir : deux façons de réduire u', retenir: <FicheBaisser/>,
      texte: <>La calculatrice donne beaucoup de chiffres (0,0347…). Mais u est un doute : les chiffres en trop n’ont aucun sens. Règle : on garde <strong>un seul chiffre significatif</strong> (le premier chiffre qui n’est pas zéro), et on arrondit <strong>vers le haut</strong>, par prudence : mieux vaut ne pas sous-estimer le doute. Cas particulier : si ce premier chiffre est 1, on garde deux chiffres (0,0143 → 0,015). C’est la convention de la classe : d’autres existent.
        <ExempleResolu>u = 0,0347{NB}g. Le premier chiffre qui compte est 3, donc un seul chiffre : 0,03{NB}g ; on arrondit vers le haut : <strong>0,04{NB}g</strong>.</ExempleResolu>
        À vous : la calculatrice affiche une autre incertitude-type.</>,
      tache: { type: 'qcm', ...QCM.arrondi } },
    { id: 'resultat', titre: 'Écrire le résultat', focus: ['scene'],
      texte: <>On écrit le résultat avec la moyenne <strong>arrondie à la même décimale que u</strong> : le résultat ne peut pas être plus précis que son doute. On met l’unité à la fin : <strong>(valeur ± u) unité</strong>.
        <ExempleResolu>Moyenne 7,5043{NB}g et u = 0,0347{NB}g. D’abord u : 0,04{NB}g (au centième). La moyenne s’arrête aussi au centième : 7,50{NB}g (le zéro final reste). Résultat : <strong>m = (7,50 ± 0,04){NB}g</strong>.</ExempleResolu>
        À vous : on a mesuré une durée, la calculatrice donne ces deux nombres.</>,
      tache: { type: 'qcm', ...QCM.resultat } },
    { id: 'comparer', titre: 'Comparer à une valeur de référence', focus: ['scene'],
      retenirTitre: 'À retenir : écrire le résultat', retenir: <FicheEcriture/>,
      texte: <>Parfois on connaît une <strong>valeur de référence</strong> (écrite sur une étiquette, donnée par le fabricant, dans un tableau). On compare sans calcul compliqué : la référence est-elle dans la zone de « moyenne − u » à « moyenne + u » ? Si oui, le résultat est <strong>compatible</strong> avec la référence. Si elle est nettement en dehors, il n’est <strong>pas compatible</strong>. Entre les deux (la référence est un peu en dehors de la zone, mais pas loin), on ne peut pas conclure : il faut plus de mesures.
        <ExempleResolu>On mesure la concentration d’une solution : (4,95 ± 0,05){NB}g/L, et l’étiquette annonce 5,20{NB}g/L. La zone va de 4,90{NB}g/L à 5,00{NB}g/L : 5,20{NB}g/L est loin en dehors, le résultat n’est <strong>pas compatible</strong> avec l’étiquette.</ExempleResolu>
        À vous : une feuille mesure (29,67 ± 0,05){NB}cm ; le fabricant annonce 29,70{NB}cm.</>,
      tache: { type: 'qcm', ...QCM.compare } },
    { id: 'systematique', titre: 'Ce que u ne dit pas', focus: ['scene'],
      retenirTitre: 'À retenir : compatible ou pas ?', retenir: <FicheCompatible/>,
      texte: <>Un instrument peut être <strong>mal réglé</strong> : toutes les mesures sont alors fausses de la même façon : c’est une <strong>erreur systématique</strong>.
        <ExempleResolu>Un chronomètre à main est toujours déclenché 0,2{NB}s trop tard : toutes les durées sont trop courtes de 0,2{NB}s. Elles restent pourtant très proches les unes des autres.</ExempleResolu>
        À vous : Marie pèse neuf fois la même pièce. Elle trouve <strong>(7,650 ± 0,005){NB}g</strong> ; le fabricant annonce 7,50{NB}g. Voici ses mesures.</>,
      tache: { type: 'qcm', ...QCM.systematique } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : ce que u ne voit pas', retenir: <FicheSysteme/>,
      texte: <>Vous savez maintenant résumer une série de mesures : la moyenne, puis l’incertitude-type u = s ÷ √n (plus de mesures ou un meilleur instrument font baisser u), l’écriture (valeur ± u) unité avec les bons arrondis, et la comparaison à une référence (compatible si elle est dans la zone). Mais u ne détecte pas un instrument décalé. Testez-vous avec les défis, ou explorez librement des séries simulées.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'ecrire'
    ? { type, ...M.tirerDefiEcrire(defi && defi.type === 'ecrire' ? defi : null), reps: {}, verifie: false, solution: false }
    : { type, ...M.tirerDefiCompare(defi && defi.type === 'compatible' ? defi : null), reps: {}, verifie: false, solution: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const defiEcrire = defi && defi.type === 'ecrire';
  const verifier = () => {
    if (defiEcrire) {
      const r = M.verifierEcrire(defi, defi.reps.u ?? '', defi.reps.m ?? '', lireNombre);
      setDefi(d => ({ ...d, verifie: true, ...r })); noterE(r.ok);
    } else {
      const ok = defi.reps.verdict === defi.cas;
      setDefi(d => ({ ...d, verifie: true, ok })); noterC(ok);
    }
  };
  const bordure = (d, ok) => `1.5px solid ${d.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`;
  const champ = (cle, label, ok, unite) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, marginBottom: 6, color: KIT.txt }}>
      <span style={{ minWidth: 150 }}>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('mi2-verif')?.click()}
        onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: bordure(defi, ok), fontSize: 14 }}/><span>{unite}</span>
    </label>);
  const retourEcrire = d => {
    if (d.ok) {
      const bon = M.ecrireResultat(d.m, d.u, d.sit.unite).texte, usuelSeul = Math.abs(lireNombre(d.reps.u) - d.uu) < 1e-9 && Math.abs(d.ua - d.uu) > 1e-9;
      return `✓ Correct : ${d.sit.sym} = ${bon}.${usuelSeul ? ` Votre u est arrondie au plus proche : accepté, mais la convention de la classe arrondit vers le haut (${M.fmt(d.ua, d.d)}).` : ''}`;
    }
    const x = lireNombre(d.reps.u), proche5 = isFinite(x) && Math.abs(x - d.u) <= 0.06 * d.u + 1e-9;
    const msgU = !d.okU ? (d.zeroU ? `u est bonne, mais écrivez-la avec ${d.d} décimale${d.d > 1 ? 's' : ''}, zéro final compris.` : proche5 ? 'u est bien calculée, mais mal arrondie : un seul chiffre significatif, vers le haut (deux chiffres si le premier est 1).' : `Vérifiez le calcul de u = s ÷ √n (ici √${d.n} = ${M.fmt(Math.sqrt(d.n), Number.isInteger(Math.sqrt(d.n)) ? 0 : 3)}), puis l’arrondi.`) : '';
    const msgM = !d.okM ? (d.zeroM ? `La valeur est bonne, mais il manque des chiffres : gardez le zéro final, la valeur s’écrit avec ${d.d} décimale${d.d > 1 ? 's' : ''} comme u.` : `La valeur doit s’arrêter à la même décimale que u (${d.d} décimale${d.d > 1 ? 's' : ''}).`) : '';
    return `✗ ${[msgU, msgM].filter(Boolean).join(' ')}`;
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ecrire', 'Écrire le résultat'], ['compatible', 'Compatible ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defiEcrire ? 'Défi : écrire le résultat d’une série de mesures' : 'Défi : ce résultat est-il compatible avec la référence ?'}</div>
      {defiEcrire ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On mesure {defi.sit.mesurande}. Instrument utilisé : {defi.instr.nom}. La série de <strong>{defi.n} mesures</strong> donne, avec la calculatrice : moyenne = <strong>{M.fmt(defi.m, defi.dm)}{NB}{defi.sit.unite}</strong> et écart-type s = <strong>{fr3(defi.s)}{NB}{defi.sit.unite}</strong>. Calculez u = s ÷ √n, puis écrivez le résultat : u avec la règle d’arrondi, et la valeur au même rang décimal (les zéros finals comptent : 7,50 n’est pas 7,5).</div>
        {champ('u', 'u arrondie', defi.okU, defi.sit.unite)}
        {champ('m', `Valeur (moyenne) arrondie`, defi.okM, defi.sit.unite)}
        <IndiceDefi cache={false}>u = s ÷ √n. On garde un seul chiffre significatif, arrondi vers le haut (deux chiffres si le premier est 1). Puis on arrondit la moyenne à la même décimale que u, en gardant les zéros finals.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On a mesuré {defi.sit.mesurande}. Instrument utilisé : {defi.instr.nom} ({defi.n} mesures). Résultat : <strong>{defi.sit.sym} = {M.ecrireResultat(defi.m, defi.u, defi.sit.unite).texte}</strong>. {defi.sit.refTxt.charAt(0).toUpperCase() + defi.sit.refTxt.slice(1)}. Ce résultat est-il compatible avec la référence ?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
          {['compatible', 'non'].map(v => <button key={v} aria-pressed={defi.reps.verdict === v} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, verdict: v }, verifie: false }))} style={{ ...styleBouton(defi.reps.verdict === v, '#0ea5e9'), textAlign: 'left', padding: '7px 10px' }}>{LIBELLE_COMPAT[v]}</button>)}
        </div>
        <IndiceDefi cache={false}>Calculez la zone de m − u à m + u. La valeur de référence est-elle entre ces deux bornes, ou nettement en dehors ?</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <button id="mi2-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        <VoirSolution visible={defiEcrire && !(defi.verifie && defi.ok) && !defi.solution} onClick={() => { vueE(); setDefi(d => ({ ...d, solution: true })); }}/>
      </div>
      {defiEcrire && defi.solution && <BoiteSolution>u = s ÷ √n = {fr3(defi.s)} ÷ √{defi.n} ≈ {fr3(defi.s / Math.sqrt(defi.n))}{NB}{defi.sit.unite}. On garde un seul chiffre significatif, arrondi vers le haut (deux si le premier est 1) : u = <strong>{M.fmt(defi.ua, defi.d)}{NB}{defi.sit.unite}</strong>. La moyenne s’arrête à la même décimale : <strong>{M.fmt(defi.ma, defi.d)}{NB}{defi.sit.unite}</strong>. Résultat : <strong>{defi.sit.sym} = {M.ecrireResultat(defi.m, defi.u, defi.sit.unite).texte}</strong>.</BoiteSolution>}
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defiEcrire ? retourEcrire(defi)
          : (defi.ok ? `✓ Correct : la zone va de ${M.fmt(defi.m - defi.u, defi.d)} à ${M.fmt(defi.m + defi.u, defi.d)} ${defi.sit.unite} ; la référence ${M.fmt(defi.sit.ref, 2)} ${defi.sit.unite} est ${defi.cas === 'compatible' ? 'dans la zone : compatible.' : 'loin en dehors : pas compatible.'}`
            : `✗ Calculez les bornes : de ${M.fmt(defi.m - defi.u, defi.d)} à ${M.fmt(defi.m + defi.u, defi.d)} ${defi.sit.unite}. Où se trouve la référence (${M.fmt(defi.sit.ref, 2)} ${defi.sit.unite}) ? Dans la zone, ou nettement en dehors ?`)}
      </div>}
    </div>);
  const axeDefiCompare = defi && !defiEcrire && defi.verifie && (() => {
    const e = defi.ecart, marge = Math.max(4 * defi.u, e + 2 * defi.u), pas = (() => { const brut = 2 * marge / 5, k = Math.pow(10, Math.floor(Math.log10(brut))); return [1, 2, 5, 10].map(f => f * k).find(p => p >= brut - 1e-12); })();
    const min = Math.floor((Math.min(defi.m, defi.sit.ref) - marge) / pas) * pas, max = Math.ceil((Math.max(defi.m, defi.sit.ref) + marge) / pas) * pas;
    return boite('La zone et la référence', <SceneAxe lignes={[{ nom: M.ecrireResultat(defi.m, defi.u, defi.sit.unite).texte, m: defi.m, u: defi.u }]} min={Number(min.toFixed(8))} max={Number(max.toFixed(8))} pas={pas} dec={Math.max(0, -Math.floor(Math.log10(pas) + 1e-9))}
      titre={`${defi.sit.nom.toLowerCase()} (${defi.sit.unite})`} reference={defi.sit.ref} refTxt="référence" aria="Axe gradué : zone du résultat en orange et valeur de référence en vert."/>);
  })();

  // ---------- hypothèses ----------
  // Chaque hypothèse n'apparaît dans le parcours guidé qu'une fois l'étape qui s'en sert atteinte (pas de fuite de réponse) ;
  // en exploration, en défi et au bilan, tout est visible.
  const iE = IDS.indexOf(idE), vu = id => !enGuide || idE === 'bilan' || iE >= IDS.indexOf(id), toutVu = !enGuide || idE === 'bilan' || fait('systematique');
  const lesHypotheses = [
    [vu('calcul'), <li key="h1"><strong>Mesures indépendantes, de la même grandeur</strong> : chaque mesure est refaite dans les mêmes conditions, sans se copier sur la précédente. Si l’on change la situation (température, personne qui mesure…), la règle ne s’applique plus telle quelle.</li>],
    [vu('calcul'), <li key="h2"><strong>Écarts au hasard, des deux côtés</strong> : les mesures se répartissent autour d’une valeur centrale, en plus et en moins, avec plus de valeurs près du centre que loin. La simulation les tire ainsi (une répartition « en cloche ») : c’est un modèle, pas une certitude. Pour une telle répartition, la vraie valeur est dans la zone m ± u environ 2 fois sur 3 : « raisonnablement » ne veut pas dire « à coup sûr ».</li>],
    [vu('calcul'), <li key="h3"><strong>u = s ÷ √n est une règle admise</strong>, qu’on utilise sans la démontrer. s est l’écart-type de la série, donné par la calculatrice. Avec très peu de mesures (3 ou 4), s lui-même est mal connu : u change beaucoup d’une série à l’autre.</li>],
    [vu('nombre'), <li key="h4"><strong>u ne baisse pas sans fin</strong> : 4 fois plus de mesures divisent u par 2 seulement si l’on garde le même instrument et le même protocole. Et l’instrument a une graduation limitée : sa résolution fixe un minimum.{toutVu && ' Un défaut de réglage, lui, ne disparaît pas en refaisant des mesures.'}</li>],
    [vu('arrondi'), <li key="h5"><strong>Écriture du résultat : convention de la classe</strong> (usuelle, mais d’autres existent) : u sur 1 chiffre significatif (2 si le premier chiffre est 1), arrondie vers le haut ; la valeur arrondie à la même décimale. C’est la même convention qu’en Première. Les calculs intermédiaires gardent un chiffre de plus : on n’arrondit qu’à la fin.</li>],
    [toutVu, <li key="h6"><strong>Instrument bien réglé</strong> : la règle suppose qu’il n’y a pas de défaut de réglage (zéro décalé, mauvais étalonnage). Si l’instrument est décalé, toutes les mesures le sont ; u reste petite et ne détecte pas ce décalage (voir « décalage » en exploration).</li>],
    [vu('comparer'), <li key="h7"><strong>Comparaison simple, sans calcul chiffré</strong> : « compatible » = la référence est dans la zone de m − u à m + u. « Pas compatible » = elle en est nettement éloignée ; dans la simulation, cela veut dire à plus d’environ 3 fois u de la moyenne : c’est un choix de la simulation, pas une règle du programme. Entre les deux, il y a une zone grise où l’on ne conclut pas : il faudrait plus de mesures. Elle existe parce que, même sans aucun défaut, la référence sort de la zone m ± u environ 1 fois sur 3 : sortir un peu de la zone ne prouve rien. Et « compatible » ne prouve pas que la valeur mesurée est égale à la référence, qui peut elle aussi avoir une incertitude.</li>],
    [!enGuide || idE === 'bilan', <li key="h8"><strong>Tout est fictif</strong> : les instruments, les séries de mesures et les valeurs de référence sont inventés ou simulés (aucune expérience réelle).</li>],
  ];
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>{lesHypotheses.filter(h => h[0]).map(h => h[1])}</ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const DONNEES_A = [7.6, 7.4, 7.5, 7.7, 7.3, 7.5, 7.6, 7.4, 7.5], DONNEES_B = [7.51, 7.49, 7.50, 7.52, 7.48, 7.50, 7.51, 7.49, 7.50];
  const DONNEES_MARIE = [7.64, 7.66, 7.65, 7.65, 7.67, 7.63, 7.65, 7.66, 7.64];
  const sceneGuide = (() => {
    switch (idE) {
      case 'moyenne': return boite('Cinq pesées de la même pièce', <SceneAxe lignes={[{ nom: 'Cinq pesées', valeurs: GM.moyenne.valeurs, res: 0.01, m: fait('moyenne') ? GM.moyenne.m : undefined }]} min={7.4} max={7.6} pas={0.05} dec={2} titre="masse (g)"
        aria="Cinq mesures de la masse d’une pièce, placées sur un axe gradué en grammes."/>, cadre('scene'));
      case 'intervalle': return boite('La longueur d’une feuille', <SceneAxe lignes={[fait('intervalle') ? { nom: '29,70 ± 0,05 cm', m: GM.intervalle.m, u: GM.intervalle.u } : { nom: 'Moyenne 29,70 cm', m: GM.intervalle.m }]} min={29.4} max={30.0} pas={0.1} dec={2} titre="longueur (cm)"
        aria={fait('intervalle') ? 'Axe gradué de 29,40 à 30,00 centimètres : la moyenne 29,70 en trait noir, la zone des valeurs raisonnables en orange.' : 'Axe gradué de 29,40 à 30,00 centimètres : la moyenne 29,70 en trait noir.'}/>, cadre('scene'));
      case 'enmots': return boite('Deux résultats pour la même pièce', <SceneAxe lignes={[{ nom: 'Alice : (7,50 ± 0,02) g', m: 7.5, u: 0.02 }, { nom: 'Bob : (7,50 ± 0,10) g', m: 7.5, u: 0.1 }]} min={7.2} max={7.8} pas={0.1} dec={2} titre="masse (g)"
        aria="Deux zones orange sur le même axe, centrées sur 7,50 grammes : la zone d’Alice est étroite, celle de Bob est large."/>, cadre('scene'));
      case 'calcul': return boite('De la série à l’incertitude-type', <SceneCalculU n={GM.calcul.n} s={GM.calcul.s} unite="g" inconnu={!fait('calcul')} u={GM.calcul.u}/>, cadre('scene'));
      case 'nombre': return boite('Un exemple : plus de mesures', <SceneNombre/>, cadre('scene'));
      case 'instrument': return boite('Neuf pesées avec chaque balance', <SceneAxe lignes={[{ nom: 'Balance A', valeurs: DONNEES_A, res: 0.1, couleur: COL.bleu }, { nom: 'Balance B', valeurs: DONNEES_B, res: 0.01, couleur: COL.vert }]} min={7.3} max={7.7} pas={0.1} dec={2} titre="masse (g)"
        aria="Deux lignes de points sur le même axe en grammes : les neuf mesures de la balance A sont étalées, celles de la balance B sont resserrées autour de 7,50."/>, cadre('scene'));
      case 'arrondi': return boite('Un nombre trop long', <SceneArrondi texte="0,0623" rang={3} unite="s"/>, cadre('scene'));
      case 'resultat': return boite('Deux nombres, un résultat', <SceneEcriture m="12,3846" u="0,0482" unite="s" sym="t"/>, cadre('scene'));
      case 'comparer': return boite('Un exemple, puis votre cas', <>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt2, margin: '0 0 4px' }}>Exemple : la concentration</div>
        <SceneAxe lignes={[{ nom: '4,95 ± 0,05 g/L', m: 4.95, u: 0.05 }]} min={4.8} max={5.3} pas={0.1} dec={2} titre="concentration (g/L)" reference={5.2} refTxt="étiquette 5,20" aria="Axe en g/L : zone orange autour de 4,95 et valeur de l’étiquette 5,20 en vert, loin de la zone."/>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt2, margin: '10px 0 4px' }}>À vous : la feuille{fait('comparer') ? '' : ' (la référence apparaîtra après votre réponse)'}</div>
        <SceneAxe lignes={[{ nom: '29,67 ± 0,05 cm', m: 29.67, u: 0.05 }]} min={29.55} max={29.85} pas={0.05} dec={2} titre="longueur (cm)" reserveRef reference={fait('comparer') ? 29.7 : undefined} refTxt="référence 29,70" aria={fait('comparer') ? 'Axe en centimètres : zone orange autour de 29,67 et valeur de référence 29,70 en vert.' : 'Axe en centimètres : zone orange autour de 29,67. La référence apparaîtra après votre réponse.'}/>
      </>, cadre('scene'));
      case 'systematique': return boite('Les neuf pesées de Marie', <SceneAxe lignes={[{ nom: 'Marie', valeurs: DONNEES_MARIE, res: 0.01, m: 7.65, u: 0.005 }]} min={7.4} max={7.8} pas={0.1} dec={2} titre="masse (g)" reference={7.5} refTxt="référence 7,50"
        aria="Axe en grammes : neuf mesures très groupées autour de 7,65, une très petite zone orange, et la valeur de référence 7,50 en vert, loin de ces mesures."/>, cadre('scene'));
      case 'bilan': return boite('Les cinq étapes d’un résultat de mesure', <SceneBilanMesure/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const sit = M.SITUATIONS[ex.sit], instr = sit.instruments[Math.min(ex.ii, sit.instruments.length - 1)];
  const serie = M.tirerSerie(sit, instr, ex.n, ex.graine, ex.biais), st = M.stats(serie), axe = axeAuto(sit, instr);
  const res = M.ecrireResultat(st.m, st.u, sit.unite), verdict = M.verdictCompat(res.m, res.u, sit.ref);
  const reglages = (<>
    {etiquette('Ce qu’on mesure', <select value={ex.sit} onChange={x => setE({ sit: x.target.value, ii: 1 })} style={sel}>{M.IDS_SITUATIONS.map(id => <option key={id} value={id}>{M.SITUATIONS[id].nom}</option>)}</select>)}
    {etiquette('Instrument', <select value={ex.ii} onChange={x => setE({ ii: Number(x.target.value) })} style={sel}>{sit.instruments.map((i, k) => <option key={i.id} value={k}>{i.nom}</option>)}</select>)}
    {etiquette('Nombre de mesures n', <select value={ex.n} onChange={x => setE({ n: Number(x.target.value) })} style={sel}>{M.NB_MESURES.map(n => <option key={n} value={n}>{n} mesures</option>)}</select>)}
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.4 }}>
      <input type="checkbox" checked={ex.biais} onChange={x => setE({ biais: x.target.checked })} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }}/>
      <span>Instrument décalé (erreur systématique) : {sit.biaisTxt}</span></label>
    <button onClick={() => setE({ graine: ex.graine + 1 })} style={{ ...styleBouton(false), marginBottom: 8 }}><Pic n="refresh"/>Refaire une série de mesures</button>
    {aide('Choisissez ce qu’on mesure, l’instrument et le nombre de mesures : une série fictive est simulée. Chaque clic sur « Refaire » donne une autre série. Attention : les graduations de l’axe s’adaptent à l’instrument.')}
  </>);
  const mesures = (<>
    <LigneMesure nom="Nombre de mesures n" valeur={`${st.n}`}/>
    <LigneMesure nom="Moyenne" valeur={`${M.fmt(st.m, instr.dec + 2)}${NB}${sit.unite}`}/>
    <LigneMesure nom="Écart-type s (éparpillement)" valeur={`${fr3(st.s)}${NB}${sit.unite}`}/>
    <LigneMesure nom="Incertitude-type u = s ÷ √n" valeur={`${fr3(st.u)}${NB}${sit.unite}`} couleur={COL.orange}/>
    <LigneMesure nom="Résultat écrit" valeur={`${sit.sym} = ${res.texte}`} couleur={COL.vert}/>
    <LigneMesure nom="Valeur de référence" valeur={`${M.fmt(sit.ref, 2)}${NB}${sit.unite}`}/>
    <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: verdict === 'compatible' ? '#15803d' : verdict === 'non' ? '#b91c1c' : '#b45309' }} role="status" aria-live="polite">
      {verdict === 'limite' ? 'Cas limite : la référence est proche de la zone sans y être. On ne tranche pas : il faudrait faire plus de mesures.' : `${LIBELLE_COMPAT[verdict]}.`}
      {verdict === 'non' && ex.biais && <span style={{ fontWeight: 400, color: KIT.txt }}> L’instrument est décalé : u est restée petite, elle n’a pas détecté le décalage.</span>}
    </div>
    {aide(`Pour diviser u par 2, il faudrait environ ${st.n * 4} mesures (4 fois plus), avec le même instrument et le même protocole. ${sit.refTxt.charAt(0).toUpperCase() + sit.refTxt.slice(1)}.`)}
  </>);
  const tableau = (
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
      {aide(`Les ${st.n} valeurs lues (${sit.unite}), dans l’ordre des mesures, arrondies à la graduation de l’instrument :`)}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>{serie.map((v, i) => <span key={i} style={{ whiteSpace: 'nowrap' }}>{M.fmt(v, instr.dec)}</span>)}</div>
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Gardez le même instrument et passez de 4 mesures à 16, puis à 100. De combien u est-elle divisée quand n est multiplié par 4 ?</li>
      <li>Gardez n et changez d’instrument : quelle différence voyez-vous sur les barres et sur u ?</li>
      <li>Cliquez plusieurs fois sur « Refaire une série » : la moyenne et u changent un peu. Avec n = 3, u est-elle aussi stable qu’avec n = 100 ?</li>
      <li>Cochez « Instrument décalé » avec n = 100 : que devient u ? Que devient la comparaison à la référence ? Refaire des mesures change-t-il quelque chose ?</li>
      <li>Écrivez le résultat à la main d’après la moyenne et u, puis comparez avec « Résultat écrit ».</li>
    </ul>);
  const retenirExplore = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>u = s ÷ √n : la zone des valeurs raisonnables va de m − u à m + u</li>
        <li>4 fois plus de mesures (même instrument, même protocole) ⇒ u divisée par 2, sans que u puisse baisser indéfiniment ; un meilleur instrument fait baisser s, donc u</li>
        <li>résultat : (valeur ± u) unité, u sur 1 chiffre significatif (2 si le premier est 1), valeur à la même décimale</li>
        <li>référence dans la zone ⇒ compatible ; nettement en dehors ⇒ pas compatible</li>
        <li>un instrument décalé donne des mesures groupées mais fausses : u ne le détecte pas</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mi2-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mi2-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mi2-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .mi2-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .mi2-l1.cote .mi2-carte { order: 2; } .mi2-l1.cote .mi2-main { order: 1; }
          .mi2-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .mi2-ex > .mi2-ex-scene { grid-column: 1; grid-row: 1; } .mi2-ex > .mi2-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .mi2-ex > .mi2-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .mi2-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mi2-in { animation: mi2-fondu 0.35s ease-out; } @keyframes mi2-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mesure : incertitude-type et résultat</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une mesure n’est jamais exacte. On apprend à dire de combien on doute (l’<strong>incertitude-type</strong>), à écrire le résultat, et à le comparer à une valeur connue. Toutes les valeurs sont fictives.</div>
      {enExplore ? <>
        <div className="mi2-ex">
          <div className="mi2-ex-scene">{boite(`${sit.nom} : ${instr.nom}`, <SceneAxe lignes={[{ nom: `${st.n} mesures`, valeurs: serie, res: instr.res, m: res.m, u: res.u, couleur: COL.bleu }]} min={axe.min} max={axe.max} pas={axe.pas} dec={axe.dec} titre={`${sit.nom.toLowerCase()} (${sit.unite})`} reference={sit.ref} refTxt="référence" mode="barres" aria={`Histogramme de ${st.n} mesures simulées, moyenne en trait noir, zone de la moyenne moins u à la moyenne plus u en orange, valeur de référence en vert.`}/>)}</div>
          <div className="mi2-ex-reglages">{boite('Réglages', reglages)}</div>
          <div className="mi2-ex-mesures">{boite('Mesures', mesures)}</div>
        </div>
        <Section titre={`Les ${st.n} valeurs de la série`} ouvert={!!ex.ouv.valeurs} onBascule={() => ouvrir('valeurs')}>{tableau}</Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`mi2-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="mi2-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="mi2-carte mi2-hypo-defi">{panneauHypo}</div> : null}
          <div className="mi2-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defiEcrire ? suiviE : suiviC}/></div>}
            {enDefi && defi && axeDefiCompare && <div className="mi2-in" key={defi.cle}>{axeDefiCompare}</div>}
            {enGuide && <div className="mi2-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && iE >= IDS.indexOf('calcul') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
