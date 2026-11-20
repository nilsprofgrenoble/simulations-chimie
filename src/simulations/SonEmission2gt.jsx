import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, ExempleResolu } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./sonEmission2gtModele";
import { QCM } from "./sonEmission2gtQcm";
import { FicheVibration, FicheProche, FicheCaisse, FicheMilieu, FicheVitesse, FicheVitesses } from "./SonEmission2gtFiches";
import { DiapasonAnime, AirAnime, CaisseAnime, ClocheAnime, CourseAnime, MicrosAnime, SceneDeuxMicros, SceneOrage, SceneConversion, SceneVitesses } from "./SonEmission2gtScenes";

const SIM_ID = 191, CLE_GUIDE = 'son-emission-2gt-guide-v1';
declarerDefis(SIM_ID, [['mesure', 'Mesurer la vitesse du son'], ['prevoir', 'Prévoir une distance ou un retard']]);

// ====================================================
//  SIM 191 — LE SON : ÉMISSION ET PROPAGATION (2GT, thème « Ondes et signaux », partie « Émission et perception d'un son »).
//  Une seule idée : un son naît d'une vibration, se propage de proche en proche dans un milieu matériel (pas dans le vide) à une vitesse
//  finie (≈ 340 m/s dans l'air), que l'on mesure avec v = d / Δt. Parcours de 12 étapes : vibration, particules, caisse de résonance, vide,
//  milieux (ordre seulement), retard, calcul de v, cohérence avec la valeur connue, éclair et tonnerre, conversion m/s → km/h, comparaison de vitesses.
//  La période, la fréquence, la hauteur et le niveau sonore font l'objet d'autres simulations (pas de longueur d'onde ici).
//  Capacités visées (jamais affichées à l'élève) : décrire l'émission d'un signal sonore par la mise en vibration d'un objet et l'intérêt d'une
//  caisse de résonance ; expliquer le rôle du milieu matériel ; citer une valeur approchée de la vitesse du son dans l'air et la comparer à d'autres
//  vitesses ; mesurer la vitesse d'un signal sonore. Modèle : sonEmission2gtModele.js (testé).
//  Suite directe : 1G, sim 150 (célérité et retard).
// ====================================================

const NB = ' ';
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };

// ---------- formules (MathML) ----------
const FV = <Formule><mi>v</mi><mo>=</mo><mfrac><mi>d</mi><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></Formule>;
const FD = <Formule><mi>d</mi><mo>=</mo><mi>v</mi><mo>×</mo><mrow><mi>Δ</mi><mi>t</mi></mrow></Formule>;

const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div className="se2-bx" style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);

// ====================================================
export function SimulationSonEmission2gt() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviM, noterM] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('mesure');
  const [ex, setEx] = useState({ milieu: 'air', d: 340, temp: 20, comparer: true, ouv: {} });
  const [vibre, setVibre] = useState(true), [airCloche, setAirCloche] = useState(100), [dMicros, setDMicros] = useState(34);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['vibre', 'proche', 'caisse', 'vide', 'milieux', 'retard', 'vitesse', 'valeur', 'eclair', 'unites', 'comparer', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant

  const ETAPES = [
    { id: 'vibre', titre: 'D’où vient un son ?', focus: ['scene'],
      texte: <>Frappons un <strong>diapason</strong> (une fourche en métal) : ses deux branches <strong>vibrent</strong>. Une <strong>vibration</strong>, c’est un mouvement de va-et-vient très rapide. Le haut-parleur vibre aussi : sa membrane avance et recule.
        Appuyez sur le bouton sous le schéma pour poser un doigt sur le diapason, puis pour le frapper de nouveau.</>,
      tache: { type: 'qcm', ...QCM.vibre } },
    { id: 'proche', titre: 'Le son avance de proche en proche', focus: ['scene'],
      retenirTitre: 'À retenir : un son naît d’une vibration',
      retenir: <FicheVibration/>,
      texte: <>L’air est fait de minuscules <strong>particules</strong> (des molécules), très nombreuses. Le haut-parleur qui vibre pousse les particules voisines, qui poussent leurs voisines, et ainsi de suite jusqu’à l’oreille.
        Sur le schéma, chaque point est une particule d’air (le dessin les agrandit et en montre très peu). Le trait pointillé marque la <strong>place de repos</strong> de la particule orange. Suivez-la des yeux pendant que le son passe.</>,
      tache: { type: 'qcm', ...QCM.proche } },
    { id: 'caisse', titre: 'La caisse de résonance', focus: ['scene'],
      retenirTitre: 'À retenir : la vibration avance de proche en proche',
      retenir: <FicheProche/>,
      texte: <>Une corde de guitare toute seule est très fine : on l’entend à peine. Sur une guitare, la corde est fixée à une grosse boîte creuse en bois, la <strong>caisse de résonance</strong>. Avec la caisse, le son est beaucoup plus fort. Comparez les deux dessins.</>,
      tache: { type: 'qcm', ...QCM.caisse } },
    { id: 'vide', titre: 'Un son dans le vide ?', focus: ['scene'],
      retenirTitre: 'À retenir : la caisse de résonance',
      retenir: <FicheCaisse/>,
      texte: <>Dans la cloche en verre, un réveil sonne. Une pompe retire l’air peu à peu : à la fin il n’y a presque plus de matière (de gaz), c’est ce qu’on appelle le <strong>vide</strong>. Le réveil, lui, continue de vibrer.
        Avec le curseur, réglez la quantité d’air restant dans la cloche et observez le son qui arrive à l’auditeur, à gauche.</>,
      tache: { type: 'qcm', ...QCM.vide } },
    { id: 'milieux', titre: 'Facultatif : air, eau, métal', focus: ['scene'],
      retenirTitre: 'À retenir : le milieu matériel',
      retenir: <FicheMilieu/>,
      texte: <>Étape facultative : vous pouvez la passer. Un <strong>milieu matériel</strong> est de la matière : un gaz (l’air), un liquide (l’eau) ou un solide (l’acier). On tape à gauche de trois tubes de <strong>1{NB}000{NB}m</strong>, l’un rempli d’air, l’autre d’eau, le troisième en acier. Le chrono de chaque tube s’arrête quand le son arrive au bout. Regardez la course (elle est au ralenti) : <strong>le son arrive d’abord par l’acier, puis par l’eau, puis par l’air</strong>. Le son se propage dans les solides, les liquides et les gaz, mais pas à la même vitesse. Seul l’ordre compte : les valeurs ne sont pas à retenir.</>,
      tache: null },
    { id: 'retard', titre: 'Le retard du son', focus: ['scene'],
      texte: <>Le son n’arrive pas instantanément : il met un peu de temps. Ce temps de parcours entre deux points s’appelle le <strong>retard</strong>, noté <strong>Δt</strong> (on lit « delta t »). Ici, un haut-parleur émet un son bref. Un chronomètre démarre quand le son passe au <strong>micro 1</strong> et s’arrête quand il passe au <strong>micro 2</strong> : il affiche le retard Δt. La distance entre les deux micros se note <strong>d</strong>.
        Changez d avec le curseur et regardez, au ralenti, le chronomètre.</>,
      tache: { type: 'qcm', ...QCM.retard } },
    { id: 'vitesse', titre: 'Calculer la vitesse du son', focus: ['scene'],
      texte: <>La <strong>vitesse</strong> du son dit combien de mètres le son parcourt en 1 seconde. On la calcule avec la distance d (en mètres) et le retard Δt (en secondes) :{FV}
        <ExempleResolu>Deux micros sont distants de 17{NB}m et le chronomètre affiche 0,050{NB}s. v = 17{NB}m ÷ 0,050{NB}s = <strong>340{NB}m/s</strong> : le son avance de 340{NB}mètres chaque seconde. Les mètres sont divisés par des secondes : on obtient des mètres par seconde (m/s).</ExempleResolu>
        À vous : un autre jour, les micros sont distants de <strong>34{NB}m</strong>. Le chronomètre ne donne que les centièmes de seconde : il affiche <strong>Δt = 0,11{NB}s</strong>.</>,
      tache: { type: 'num', q: 'Quelle vitesse du son trouvez-vous ? Donnez 2 chiffres significatifs.', carnet: 'Vitesse du son mesurée', unite: 'm/s', vrai: M.vitesse(34, 0.11), tol: 0.05, affiche: v => M.nb(v, 2),
        calcul: () => ['v = d ÷ Δt, avec d en mètres et Δt en secondes (déjà le cas ici).', 'v = 34 m ÷ 0,11 s ≈ 309 m/s, soit 310 m/s avec 2 chiffres significatifs.', 'Hypothèse : le son avance en ligne droite, à vitesse constante, entre les deux micros.'],
        pieges: [[340, 'Vous avez recopié 340 m/s, la valeur de l’exemple. Refaites le calcul avec les données de cet énoncé : d = 34 m et Δt = 0,11 s.', 0.01], [34 * 0.11, 'Vous avez multiplié (34 × 0,11). Pour une vitesse, on divise la distance par la durée.'], [0.11 / 34, 'La division est à l’envers : on divise la distance (34 m) par la durée (0,11 s).']],
        expl: 'v = 34 m ÷ 0,11 s ≈ 309 m/s, soit environ 310 m/s.', indice: 'v = d ÷ Δt : divisez 34 (mètres) par 0,11 (secondes). Arrondissez à 2 chiffres significatifs.' } },
    { id: 'valeur', titre: 'La vitesse du son dans l’air', focus: ['scene'],
      retenirTitre: 'À retenir : mesurer la vitesse du son',
      retenir: <FicheVitesse/>,
      texte: <>En refaisant ces mesures avec soin, on trouve toujours à peu près la même valeur : <strong>le son va à environ 340{NB}m/s dans l’air à 20{NB}°C</strong>. C’est la valeur à connaître. (Elle change un peu avec la température.)
        Notre mesure donne 310{NB}m/s, un peu différente de 340{NB}m/s.</>,
      tache: { type: 'qcm', ...QCM.valeur } },
    { id: 'eclair', titre: 'Éclair et tonnerre', focus: ['scene'],
      texte: <>Pendant un orage, on voit l’éclair tout de suite, car la lumière va incroyablement vite. Mais on entend le tonnerre plus tard : le retard Δt est le temps que le son met pour venir jusqu’à nous. Avec v{NB}={NB}340{NB}m/s, on retrouve la distance de l’éclair :{FD}
        <ExempleResolu>Le tonnerre arrive 3,0{NB}s après l’éclair. d = 340{NB}m/s × 3,0{NB}s = 1{NB}020{NB}m, soit environ <strong>1,0{NB}km</strong>. (1{NB}km = 1{NB}000{NB}m.)</ExempleResolu>
        À vous : cette fois le tonnerre arrive <strong>7,0{NB}s</strong> après l’éclair.</>,
      tache: { type: 'num', q: 'À quelle distance l’éclair a-t-il frappé ? Répondez en kilomètres, avec 2 chiffres significatifs.', carnet: 'Distance de l’éclair', unite: 'km', vrai: M.distance(M.V_AIR, 7.0) / 1000, tol: 0.05, affiche: v => M.nb(v, 2),
        calcul: () => ['d = v × Δt, avec v = 340 m/s et Δt = 7,0 s.', 'd = 340 m/s × 7,0 s = 2 380 m.', '2 380 m = 2,38 km, soit 2,4 km avec 2 chiffres significatifs.', 'Hypothèse : la lumière arrive tout de suite ; le son va en ligne droite à 340 m/s.'],
        pieges: [[7.0 / 340, 'Vous avez divisé 7,0 par 340. Pour trouver la distance, on multiplie la vitesse du son par le retard.'], [340 / 7.0, 'Vous avez divisé 340 par 7,0. Pour trouver la distance, on multiplie la vitesse par le retard.']],
        expl: 'd = 340 m/s × 7,0 s = 2 380 m, soit environ 2,4 km.', indice: 'd = v × Δt : multipliez 340 (m/s) par 7,0 (s) : vous obtenez des mètres. Puis convertissez en kilomètres (1 km = 1 000 m).' } },
    { id: 'unites', titre: 'Des m/s aux km/h', focus: ['scene'],
      texte: <>Les vitesses s’écrivent en m/s ou en km/h. Pour passer de <strong>m/s</strong> à <strong>km/h</strong>, on <strong>multiplie par 3,6</strong> (1{NB}km = 1{NB}000{NB}m et 1{NB}h = 3{NB}600{NB}s, et 3{NB}600 ÷ 1{NB}000 = 3,6). Pour passer de km/h à m/s, on divise par 3,6.
        <ExempleResolu>Un cycliste roule à 10{NB}m/s : 10 × 3,6 = <strong>36{NB}km/h</strong>.</ExempleResolu>
        À vous : la vitesse du son dans l’air, <strong>340{NB}m/s</strong>.</>,
      tache: { type: 'num', q: 'Quelle est la vitesse du son en km/h ? Donnez 2 chiffres significatifs.', carnet: 'Vitesse du son en km/h', unite: 'km/h', vrai: M.kmhDepuisMs(340), tol: 0.05, affiche: v => M.nb(v, 2),
        calcul: () => ['m/s → km/h : on multiplie par 3,6.', '340 m/s × 3,6 = 1 224 km/h.', 'Avec 2 chiffres significatifs : 1 200 km/h.'],
        pieges: [[340 / 3.6, 'Vous avez divisé par 3,6. Pour passer de m/s à km/h, on multiplie par 3,6 : un kilomètre par heure est une vitesse plus petite qu’un mètre par seconde, donc le nombre de km/h est plus grand.'], [340 * 60, 'Vous avez multiplié par 60 au lieu de 3,6. 1 m/s = 3,6 km/h.']],
        expl: '340 × 3,6 = 1 224 km/h, soit environ 1 200 km/h.', indice: 'Pour passer de m/s à km/h, multipliez par 3,6. Exemple : 10 m/s = 36 km/h.' } },
    { id: 'comparer', titre: 'Comparer des vitesses', focus: ['scene'],
      texte: <>Voici des vitesses courantes. Pour comparer deux vitesses, il faut les écrire <strong>dans la même unité</strong>. Le son dans l’air : 340{NB}m/s, soit environ 1{NB}200{NB}km/h. La lumière, elle, est hors échelle : elle va environ 900{NB}000 fois plus vite que le son.</>,
      tache: { type: 'qcm', ...QCM.comparer } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : comparer des vitesses',
      retenir: <FicheVitesses/>,
      texte: <>Un son naît d’une <strong>vibration</strong>, il avance de proche en proche dans un <strong>milieu matériel</strong> (pas dans le vide), à environ <strong>340{NB}m/s dans l’air</strong>. On mesure sa vitesse avec v = d ÷ Δt. Testez-vous avec les défis, ou explorez librement.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'mesure' ? { type, ...M.tirerDefiMesure(defi && defi.type === 'mesure' ? defi : null) } : { type, ...M.tirerDefiPrevoir(defi && defi.type === 'prevoir' ? defi : null) }), reps: {}, verifie: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const defiMesure = defi && defi.type === 'mesure';
  const margeTxt = defi ? (defiMesure ? `${(defi.tol * 100).toFixed(1).replace('.', ',')}` : '6') : '';
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, defiMesure ? defi.tol : 0.06);
    const recopie = !!defiMesure && !ok && isFinite(x) && Math.abs(x - defi.nominal) / defi.nominal <= 0.01;
    setDefi(d => ({ ...d, verifie: true, ok, recopie })); (defi.type === 'mesure' ? noterM : noterP)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('se2-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const milDefi = defiMesure ? M.milieu(defi.mid) : null;
  const dtTxtDefi = defiMesure ? `${M.nb(defi.dt, 2)}${NB}s` : '';
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['mesure', 'Mesurer la vitesse du son'], ['prevoir', 'Prévoir une distance ou un retard']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defiMesure ? 'Défi : quelle est la vitesse du son ?' : 'Défi : prévoir une distance ou un retard'}</div>
      {defiMesure ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un haut-parleur émet un son bref dans {milDefi.nom} (mesures fictives). Les deux micros sont distants de <strong>d = {M.longueur(defi.d)}</strong> et le chronomètre affiche <strong>Δt = {dtTxtDefi}</strong>. Quelle est la vitesse du son dans ce milieu ? Donnez-la en m/s avec 2 chiffres significatifs.</div>
        {champ('Vitesse du son v', 'm/s')}
        <IndiceDefi cache={false}>v = frac(d|Δt), avec d en mètres et Δt en secondes. Si d est donnée en kilomètres, convertissez-la d’abord (1 km = 1{NB}000 m).</IndiceDefi>
      </> : defi.cas === 'orage' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Pendant un orage, le tonnerre arrive <strong>Δt = {M.nb(defi.dt, 2)}{NB}s</strong> après l’éclair. On prend v = 340{NB}m/s pour le son ; la lumière arrive tout de suite. À quelle distance l’éclair a-t-il frappé ? Répondez en <strong>kilomètres</strong> avec 2 chiffres significatifs.</div>
        {champ('Distance de l’éclair d', 'km')}
        <IndiceDefi cache={false}>d = v × Δt : multipliez la vitesse du son (340 m/s) par le retard (en secondes). Le résultat est en mètres : convertissez en kilomètres (1 km = 1{NB}000 m).</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un feu d’artifice explose à <strong>d = {M.nbf(defi.dkm, 2)}{NB}km</strong> de vous. On prend v = 340{NB}m/s pour le son ; la lumière arrive tout de suite. Au bout de combien de temps entendez-vous le bruit ? Répondez en <strong>secondes</strong> avec 2 chiffres significatifs.</div>
        {champ('Retard du bruit Δt', 's')}
        <IndiceDefi cache={false}>Δt = frac(d|v) : convertissez d en mètres (1 km = 1{NB}000 m), puis divisez par la vitesse du son (340 m/s). Le résultat est en secondes.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="se2-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defiMesure ? `✓ Correct : v = d ÷ Δt = ${M.longueur(defi.d)} ÷ ${dtTxtDefi} ≈ ${M.nb(defi.vrai, 2)}${NB}m/s (marge acceptée : ± ${margeTxt}${NB}%).`
          : defi.cas === 'orage' ? `✓ Correct : d = 340 m/s × ${M.nb(defi.dt, 2)} s ≈ ${M.nb(defi.vrai, 2)} km (marge acceptée : ± 6 %).`
            : `✓ Correct : Δt = ${M.nb(defi.dkm * 1000, 3)} m ÷ 340 m/s ≈ ${M.nb(defi.vrai, 2)} s (marge acceptée : ± 6 %).`)
          : defiMesure ? (defi.recopie ? `✗ Vous avez recopié la valeur connue (${M.nb(defi.nominal, 2)}${NB}m/s). Ici, calculez avec les données de l’énoncé : v = d ÷ Δt.` : '✗ Vérifiez : v = d ÷ Δt, avec d en mètres et Δt en secondes (pas l’inverse).')
            : defi.cas === 'orage' ? '✗ Vérifiez : d = v × Δt, puis convertissez les mètres en kilomètres (÷ 1 000).'
              : '✗ Vérifiez : Δt = d ÷ v, avec d en mètres (1 km = 1 000 m) et v = 340 m/s.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Vitesse du son dans l’air</strong> : prise égale à 340 m/s, valeur arrondie valable vers 20 °C. Elle dépend de la température (environ 0,6 m/s de plus par degré : voir l’exploration, hors programme) ; l’humidité et la pression sont négligées.</li>
      <li><strong>Eau et acier</strong> : 1{NB}500 m/s et 5{NB}000 m/s sont des ordres de grandeur arrondis (les vraies valeurs varient avec la température et la nature du matériau). Il ne faut pas les retenir : seul compte l’ordre « air, eau, acier ».</li>
      <li><strong>Propagation en ligne droite, sans vent, dans un milieu uniforme</strong>, à vitesse constante. Le son s’affaiblit en s’éloignant, mais sa vitesse ne change pas.</li>
      <li><strong>Instants lus avec l’incertitude du chronomètre</strong> : environ 0,01 s dans le parcours. C’est pourquoi une mesure donne « à peu près » 340 m/s, pas exactement. Les mesures du parcours et des défis sont fictives (choisies pour le calcul).</li>
      <li><strong>Éclair et tonnerre</strong> : la lumière (3,0 × 10⁸ m/s) est supposée arriver instantanément ; on ne tient pas compte du trajet courbe réel du son ni des échos.</li>
      <li><strong>Particules d’air et cloche</strong> : le dessin montre très peu de particules, très agrandies, au ralenti. Avec une vraie pompe, il reste toujours un peu d’air et le son passe aussi par le socle : on idéalise.</li>
      <li><strong>Chiffres significatifs</strong> : les résultats ont 2 chiffres significatifs ; les réponses sont acceptées avec une marge de 5 % dans le parcours, de 6 % dans les défis de prévision et d’environ 2,5 à 5 % dans le défi de mesure (jamais plus stricte que l’arrondi).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => setE({ ouv: { ...ex.ouv, hypo: !ex.ouv.hypo } })}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const LANES3 = ['air', 'eau', 'acier'].map(id => M.milieu(id));
  const sceneGuide = (() => {
    switch (idE) {
      case 'vibre': return boite('Des objets qui vibrent', <>
        <DiapasonAnime vibre={vibre}/>
        <div style={{ marginTop: 8, textAlign: 'center' }}><button onClick={() => setVibre(v => !v)} style={styleBouton(true, vibre ? '#475569' : '#0369a1')}>{vibre ? '✋ Poser un doigt sur le diapason' : '🔨 Frapper le diapason'}</button></div></>, cadre('scene'));
      case 'proche': return boite('Des particules d’air', <AirAnime/>, cadre('scene'));
      case 'caisse': return boite('Une corde seule, puis avec une caisse', <CaisseAnime/>, cadre('scene'));
      case 'vide': return boite('Un réveil sous une cloche', <>
        <ClocheAnime air={airCloche}/>
        <div style={{ marginTop: 8 }}><Curseur nom="Air restant dans la cloche" valeur={airCloche} onChange={setAirCloche} min={0} max={100} pas={10} unite="%" decimales={0} couleur="#0369a1"/></div></>, cadre('scene'));
      case 'milieux': return boite('Une course de sons', <>
        <CourseAnime lanes={LANES3} d={1000}/>
        {aide('Valeurs approximatives : air 340 m/s, eau 1\u00a0500 m/s, acier 5\u00a0000 m/s (ordres de grandeur, à ne pas retenir).')}</>, cadre('scene'));
      case 'retard': return boite('Deux micros et un chronomètre', <>
        <MicrosAnime d={dMicros}/>
        <div style={{ marginTop: 8 }}><Curseur nom="Distance d entre les micros" valeur={dMicros} onChange={setDMicros} min={17} max={85} pas={17} unite="m" decimales={0} couleur="#b45309"/></div></>, cadre('scene'));
      case 'vitesse': return boite('Une mesure avec deux micros', <SceneDeuxMicros d={34} mode="fixe" dtTxt={`0,11${NB}s`}/>, cadre('scene'));
      case 'valeur': return boite('Notre mesure', <SceneDeuxMicros d={34} mode="fixe" dtTxt={`0,11${NB}s`} vTxt={`v mesurée ≈ 310${NB}m/s`}/>, cadre('scene'));
      case 'eclair': return boite('Un orage au loin', <SceneOrage source="eclair" dtTxt={`7,0${NB}s`} dTxt={fait('eclair') ? `${M.nb(M.distance(M.V_AIR, 7.0) / 1000, 2).replace('.', ',')}${NB}km` : null}/>, cadre('scene'));
      case 'unites': return boite('Deux règles : m/s et km/h', <SceneConversion/>, cadre('scene'));
      case 'comparer': return boite('Des vitesses courantes', <SceneVitesses lignes={['pieton', 'velo', 'son', 'lumiere']}/>, cadre('scene'));
      case 'bilan': return boite('Le son et d’autres vitesses', <SceneVitesses lignes={['voiture', 'avion', 'son', 'lumiere']}/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const mil = M.milieu(ex.milieu), vAir = M.vAirTemperature(ex.temp);
  const vSel = ex.milieu === 'air' ? vAir : mil.v;
  const lanesEx = [{ ...mil, v: vSel }];
  const avecAir = ex.comparer && ex.milieu !== 'air' && ex.milieu !== 'vide';
  if (avecAir) lanesEx.push({ ...M.milieu('air'), v: vAir });
  const TXT_T = { 0: '0 °C (hiver)', 20: '20 °C (valeur du parcours)', 30: '30 °C (été)' };
  const exReglages = (<>
    {etiquette('Milieu où le son se propage', <select value={ex.milieu} onChange={x => setE({ milieu: x.target.value })} style={sel}>
      {M.MILIEUX.map(m => <option key={m.id} value={m.id}>{m.Nom}{m.v ? ` (environ ${M.entier(m.id === 'air' ? vAir : m.v)} m/s)` : ' (aucune matière)'}</option>)}</select>)}
    <Curseur nom="Distance parcourue d" valeur={ex.d} onChange={v => setE({ d: v })} min={10} max={3000} pas={10} unite="m" decimales={0} couleur="#b45309"/>
    {aide('Choisissez un milieu et une distance : la scène montre le son qui parcourt cette distance (au ralenti) et le chronomètre indique le retard.')}
    <Section titre={`Comparer avec l’air : ${ex.comparer ? 'oui' : 'non'}`} ouvert={!!ex.ouv.comp} onBascule={() => ouvrir('comp')}>
      {etiquette('Afficher aussi le son dans l’air', <select value={ex.comparer ? 'oui' : 'non'} onChange={x => setE({ comparer: x.target.value === 'oui' })} style={sel}><option value="oui">oui</option><option value="non">non</option></select>)}
      {aide('Utile pour voir de combien le son est plus rapide dans l’eau ou l’acier que dans l’air.')}
    </Section>
    <Section titre={`Pour aller plus loin (hors programme) : air à ${ex.temp} °C`} ouvert={!!ex.ouv.temp} onBascule={() => ouvrir('temp')}>
      {etiquette('Température de l’air', <select value={ex.temp} onChange={x => setE({ temp: Number(x.target.value) })} style={sel}>{[0, 20, 30].map(T => <option key={T} value={T}>{TXT_T[T]}</option>)}</select>)}
      {aide('La vitesse du son dans l’air change un peu avec la température : environ 0,6 m/s de plus par degré. Seul le 20 °C est à connaître.')}
    </Section>
  </>);
  const exMesures = (<>
    <LigneMesure nom="Distance d" valeur={M.longueur(ex.d, 3)}/>
    <LigneMesure nom={`Vitesse du son dans ${mil.nom}`} valeur={vSel ? `${M.entier(vSel)}${NB}m/s` : 'aucune : pas de matière'} couleur={COL.orange}/>
    <LigneMesure nom="Retard Δt = d ÷ v" valeur={vSel ? M.duree(M.retard(ex.d, vSel), 2) : 'jamais : le son ne passe pas'} couleur={COL.vert}/>
    {avecAir && <LigneMesure nom="Retard dans l’air" valeur={M.duree(M.retard(ex.d, vAir), 2)} couleur={COL.bleu}/>}
    {avecAir && <LigneMesure nom="Comparé à l’air" valeur={`environ ${M.nb(vSel / vAir, 2)} fois plus rapide`} couleur={COL.violet}/>}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Air : doublez la distance. Que devient le retard ? Et si la distance est divisée par trois ?</li>
      <li>Réglez 1{NB}000 m et comparez l’air, l’eau et l’acier : quel retard dans chaque milieu ?</li>
      <li>Choisissez « Vide ». Que se passe-t-il ? Pourquoi ?</li>
      <li>Pour d = 340 m dans l’air, lisez le retard. Retrouvez la vitesse en calculant d ÷ Δt.</li>
      <li>Un orage : le tonnerre arrive 5 s après l’éclair. À quelle distance est-il ? Vérifiez en réglant la distance jusqu’à lire un retard de 5 s.</li>
      <li>Plus loin : comparez l’air à 0 °C et à 30 °C pour 1{NB}000 m. Le retard change-t-il beaucoup ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>un son naît d’une vibration et se propage de proche en proche dans un milieu matériel (pas dans le vide)</li>
        <li>vitesse du son dans l’air : environ 340 m/s (≈ 1{NB}200 km/h) à 20 °C</li>
        <li>v = d ÷ Δt ; d = v × Δt ; Δt = d ÷ v (d en m, Δt en s, v en m/s)</li>
        <li>m/s → km/h : × 3,6 ; km/h → m/s : ÷ 3,6</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .se2-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .se2-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .se2-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 600px) { .se2-bx { padding: 10px 6px !important; } }
        @media (max-width: 900px) { .se2-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .se2-l1.cote .se2-carte { order: 2; } .se2-l1.cote .se2-main { order: 1; }
          .se2-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .se2-ex > .se2-ex-scene { grid-column: 1; grid-row: 1; } .se2-ex > .se2-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .se2-ex > .se2-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .se2-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .se2-in { animation: se2-fondu 0.35s ease-out; } @keyframes se2-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Le son : émission et propagation</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un son naît d’une <strong>vibration</strong>, qui se transmet de proche en proche dans l’air (ou un autre milieu), à une vitesse que l’on peut <strong>mesurer</strong>.</div>
      {enExplore ? <>
        <div className="se2-ex">
          <div className="se2-ex-scene">{boite(`Un son parcourt ${M.longueur(ex.d)}`, <CourseAnime lanes={lanesEx} d={ex.d} titre={false}/>)}</div>
          <div className="se2-ex-reglages">{boite('Réglages', exReglages)}</div>
          <div className="se2-ex-mesures">{boite('Mesures et calculs', exMesures)}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`se2-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="se2-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="se2-carte se2-hypo-defi">{panneauHypo}</div> : null}
          <div className="se2-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defiMesure ? suiviM : suiviP}/></div>}
            {enDefi && defi && <div className="se2-in" key={`${defi.type}-${defi.d ?? defi.dt ?? defi.dkm}`}>{boite(defiMesure ? 'Le dispositif de mesure' : defi.cas === 'orage' ? 'Un orage au loin' : 'Un feu d’artifice',
              defiMesure ? <SceneDeuxMicros d={defi.d} mode="fixe" dtTxt={dtTxtDefi} milieuId={defi.mid}/>
                : defi.cas === 'orage' ? <SceneOrage source="eclair" dtTxt={`${M.nb(defi.dt, 2)}${NB}s`} dTxt={null}/>
                  : <SceneOrage source="feu" dtTxt={null} dTxt={`${M.nbf(defi.dkm, 2)}${NB}km`}/>)}</div>}
            {enGuide && <div className="se2-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
