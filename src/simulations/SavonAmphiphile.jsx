import { useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./savonModele";
import { QCM } from "./savonQcm";
import { C } from "./savonCouleurs";
import { FormuleSemi, MoleculeSvg, SceneTubes, SceneInterface, SceneVolume, SceneGoutte, SceneLavage } from "./SavonScenes";
import { SvgAmphiphile, SvgSurface, SvgMicelle, SvgLavage, SvgApplications } from "./SavonSchemas";

const SIM_ID = 158, CLE_GUIDE = 'savon-1g-guide-v1';
declarerDefis(SIM_ID, [['programme', 'Classer une entité : hydrophile, lipophile ou amphiphile'], ['hors', 'Au-delà du programme : eau dure, acide ou salée']]);

// ====================================================
//  SIM 158 — SAVONS ET AMPHIPHILIE : POURQUOI UN SAVON LAVE (1G spé PC, thème « Constitution et transformations de la matière »,
//  partie « Cohésion, dissolution, solubilité »). Une seule idée : un savon est une espèce amphiphile (chaîne carbonée apolaire +
//  groupe carboxylate polaire) ; à l'interface puis en micelles, elle piège la salissure grasse, qui part au rinçage.
//  Prolonge la simulation 53 (solubilité et miscibilité) et la 155 (polarité) sans les modifier. Le modèle est dans savonModele.js (testé).
//  Hors de cette simulation : concentration micellaire critique (BTS), saponification (TP de synthèse).
//  Capacité visée (jamais affichée à l'élève) : expliquer le caractère amphiphile et les propriétés lavantes d'un savon à partir de la
//  formule semi-développée de ses entités ; citer des applications usuelles de tensioactifs.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const Tete = ({ children }) => <strong style={{ color: C.tete }}>{children}</strong>;
const Queue = ({ children }) => <strong style={{ color: C.queue }}>{children}</strong>;
const ST = M.entite('stearate');
const NOM_CAR = { amphiphile: 'amphiphile', hydrophile: 'hydrophile', lipophile: 'lipophile' };
const FEED_ORIENT = {
  plat: 'Les ions sont posés à plat sur l’eau. Comment se placent-ils vraiment ?',
  'queue-eau': 'Pas stable : les chaînes apolaires, insolubles dans l’eau, sont entourées de molécules d’eau et les têtes polaires sont dans l’air. Les ions se retournent.',
  'tete-eau': 'Voilà la disposition réelle : les têtes COO⁻ sont entourées d’eau, les chaînes apolaires dépassent dans l’air.',
};

// tirage d'une entité de défi : on tire d'abord le caractère (pour équilibrer les trois cas), puis l'entité
const POOL_DEFI = M.ENTITES.filter(e => e.id !== 'nacl');
function tirerEntite(exclu) {
  const cars = ['amphiphile', 'hydrophile', 'lipophile'], car = cars[Math.floor(Math.random() * 3)];
  const possibles = POOL_DEFI.filter(e => M.classer(e).caractere === car && e.id !== exclu);
  const l = possibles.length ? possibles : POOL_DEFI.filter(e => e.id !== exclu);
  return l[Math.floor(Math.random() * l.length)];
}
function melanger(t) { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function tirerMilieu(exclu) {
  const l = M.MILIEUX.filter(m => m.id !== exclu && m.id !== 'douce'), m = l[Math.floor(Math.random() * l.length)];
  return { milieu: m.id, options: melanger([m.bonne, ...m.faux]) };
}

// agents de l'exploration « Laver une salissure » : (entité, variante de dessin)
const AGENTS = [['stearate', 'savon'], ['palmitate', 'savon'], ['laurate', 'savon'], ['oleate', 'savon'], ['acetate', 'court'], ['nacl', 'sel'], ['acide-stearique', 'acide']];
const VERDICT_AGENT = {
  savon: 'Amphiphile à tête chargée : les chaînes s’insèrent dans la salissure, les têtes restent côté eau, la salissure est piégée puis emportée.',
  court: 'La chaîne est trop courte : l’ion reste dissous dans l’eau, il ne s’insère pas dans la salissure. Elle ne part pas.',
  sel: 'Les ions Na⁺ et Cl⁻ sont hydrophiles et n’ont aucune partie lipophile : ils ne s’accrochent pas à la salissure. Elle ne part pas.',
  acide: 'Tête COOH non chargée : cette espèce est presque insoluble dans l’eau et reste en amas. Elle ne forme pas de micelles et ne lave pas.',
};

// ====================================================
export function SimulationSavonAmphiphile() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('programme');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [agite, setAgite] = useState(false);
  const [orient, setOrient] = useState('plat');
  const [lav, setLav] = useState({ stade: 0, max: 0 });
  const [ex, setEx] = useState({ id: 'stearate', agent: 0, salissure: 'grasse', stade: 0, milieu: 'dure', ouv: { lavage: false } });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  const IDS = ['constat', 'tube-savon', 'formule', 'polaire', 'courte', 'orientation', 'micelle', 'insertion', 'lavage', 'rincage', 'applications', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'constat', titre: 'Huile et eau dans un tube', focus: ['scene'],
      texte: <>On verse de l’huile dans de l’eau, puis on laisse reposer : le tube A montre <strong>deux couches séparées</strong>. L’huile se place au-dessus de l’eau. Un savon, lui, permet de laver des taches d’huile avec de l’eau : il faudra comprendre comment.</>,
      tache: { type: 'qcm', ...QCM.constat } },
    { id: 'tube-savon', titre: 'Ajouter un peu de liquide vaisselle', focus: ['scene'],
      texte: <>Le tube B est identique au tube A, avec en plus quelques gouttes de <strong>liquide vaisselle</strong> (un mélange d’espèces voisines des savons, appelées <strong>tensioactifs</strong>). On agite les deux tubes et on observe, d’abord le tube A, puis le tube B.</>,
      tache: { type: 'action', label: 'Agiter les deux tubes', faire: () => setAgite(true), ok: agite, consigne: 'Compare les deux tubes : dans le tube B, que sont devenues les deux couches ?' } },
    { id: 'formule', titre: 'Un savon : l’ion stéarate', focus: ['scene'],
      texte: <>Dans le tube B, l’huile reste dispersée un bon moment en fines gouttelettes : c’est <strong>une émulsion</strong>. Pour comprendre pourquoi, regardons un savon de près. Le savon d’usage contient des ions comme l’<strong>ion stéarate</strong>, de formule semi-développée <strong>CH₃–(CH₂)₁₆–COO⁻</strong>. Il est associé à un ion Na⁺ (le contre-ion), qui ne joue aucun rôle dans le lavage. Le groupe (CH₂)₁₆ est répété 16 fois, le dessin en zigzag en donne une autre représentation : un sommet par atome de carbone.</>,
      tache: { type: 'num', q: <>Combien d’atomes de carbone compte l’ion stéarate ?</>, carnet: 'Atomes de carbone de l’ion stéarate', unite: 'atomes', vrai: 18, tol: 0.001, affiche: v => String(v),
        calcul: () => ['Dans CH₃–(CH₂)₁₆–COO⁻ : 1 carbone dans CH₃, 16 carbones dans (CH₂)₁₆ et 1 carbone dans COO⁻.', '1 + 16 + 1 = 18 atomes de carbone (le zigzag a bien 18 sommets).'],
        pieges: [[17, 'Tu as oublié le carbone du groupe COO⁻ : il fait partie de la formule.'], [16, 'Tu n’as compté que les groupes CH₂ : il faut aussi le carbone de CH₃ et celui de COO⁻.'], [34, 'Chaque groupe CH₂ ne contient qu’un seul atome de carbone (deux atomes d’hydrogène, pas deux carbones).']],
        expl: '1 (CH₃) + 16 (CH₂) + 1 (COO⁻) = 18 atomes de carbone.', indice: 'Additionne les carbones de CH₃, ceux des 16 groupes CH₂ (un carbone par groupe) et celui du groupe COO⁻.' } },
    { id: 'polaire', titre: 'Deux parties dans une même entité', focus: ['scene'],
      texte: <>L’ion stéarate se compose de <strong>deux parties</strong> : le groupe <strong>COO⁻</strong> (groupe carboxylate) et la <strong>chaîne carbonée</strong> CH₃–(CH₂)₁₆. Elles n’ont pas les mêmes propriétés vis-à-vis de l’eau : il faut repérer laquelle est polaire.</>,
      tache: { type: 'qcm', ...QCM.polaire } },
    { id: 'courte', titre: 'Comparer deux ions à tête identique', focus: ['scene'],
      retenirTitre: 'À RETENIR : UNE ESPÈCE AMPHIPHILE',
      retenir: <>
        <SvgAmphiphile/>
        <ul style={liste}>
          <li><strong>Amphiphile</strong> = une <strong>tête polaire hydrophile</strong> (elle aime l’eau) + une <strong>chaîne apolaire lipophile</strong> (elle aime les graisses).</li>
          <li>Exemple : ion stéarate, tête COO⁻ chargée, chaîne de 17 carbones (plus le carbone de COO⁻, soit 18 en tout) ; les liaisons C–C et C–H sont apolaires : la chaîne est insoluble dans l’eau.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « la tête aime l’eau, la queue aime le gras ».</li>
          <li><strong>Idée fausse</strong> : « la chaîne C–H attire un peu l’eau ». <strong>Vrai</strong> : elle est apolaire et insoluble dans l’eau.</li>
        </ul></>,
      texte: <>Ici, la tête est en bleu, la chaîne en orange. Compare l’ion stéarate avec l’<strong>ion éthanoate</strong> (ou acétate) CH₃–COO⁻ : sa tête est la même.</>,
      tache: { type: 'qcm', ...QCM.courte } },
    { id: 'orientation', titre: 'À la surface de l’eau', focus: ['scene'],
      texte: <>Dans de l’eau, les ions carboxylate arrivent à la surface. Chaque ion a une partie qui aime l’eau et une partie qui la fuit. Place-les comme ils se placent vraiment : choisis l’orientation avec les deux boutons sous le dessin.</>,
      tache: { type: 'action', ok: orient === 'tete-eau', consigne: 'Oriente les ions : tête dans l’eau ou chaîne dans l’eau ?' } },
    { id: 'micelle', titre: 'Plus de savon : dans le volume de l’eau', focus: ['scene'],
      retenirTitre: 'À RETENIR : À LA SURFACE DE L’EAU',
      retenir: <>
        <SvgSurface/>
        <ul style={liste}>
          <li>Les ions se placent à la surface de l’eau : <strong>tête dans l’eau, queue hors de l’eau</strong> (dans l’air, ou dans l’huile s’il y en a une).</li>
          <li>Exemple : dans le tube B, les molécules de tensioactif se placent autour des gouttelettes d’huile, ce qui les empêche de se regrouper.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « la tête plonge, la queue dépasse ».</li>
          <li><strong>Idée fausse</strong> : « les ions flottent au hasard ». <strong>Vrai</strong> : à une interface eau/air ou eau/huile, les ions s’orientent ainsi.</li>
        </ul></>,
      texte: <>Quand il y a davantage de savon, tous les ions ne trouvent plus de place à la surface : ceux qui restent dans l’eau, avec leur chaîne apolaire en contact avec les molécules d’eau, s’<strong>assemblent</strong> d’une façon particulière : on parle de <strong>micelles</strong>. (Ici, on décrit une micelle sans compter les ions : c’est un modèle qualitatif.)</>,
      tache: { type: 'qcm', ...QCM.micelle } },
    { id: 'insertion', titre: 'Une goutte d’huile et des ions', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA MICELLE',
      retenir: <>
        <SvgMicelle/>
        <ul style={liste}>
          <li>Dans l’eau, les ions forment des <strong>micelles</strong> : <strong>têtes dehors (côté eau), chaînes dedans (à l’abri de l’eau)</strong>.</li>
          <li>Exemple : une micelle de savon est à peu près sphérique ; on ne retient ni son nombre d’ions ni sa taille (modèle qualitatif).</li>
          <li><strong>Moyen de s’en souvenir</strong> : « têtes dehors, queues dedans ».</li>
          <li><strong>Idée fausse</strong> : « les chaînes sont au contact de l’eau ». <strong>Vrai</strong> : les chaînes sont au centre, les têtes seules touchent l’eau.</li>
        </ul></>,
      texte: <>Voici une goutte d’huile, c’est-à-dire une <strong>salissure grasse</strong> : ses molécules sont apolaires. Des ions carboxylate se trouvent autour, sans orientation précise pour l’instant.</>,
      tache: { type: 'qcm', ...QCM.insertion } },
    { id: 'lavage', titre: 'Suivre un lavage pas à pas', focus: ['scene'],
      texte: <>Avec ce que tu viens de voir, le lavage d’une tache grasse se déroule en quatre stades. Fais avancer le curseur jusqu’au dernier stade et lis ce qui se passe à chacun.</>,
      tache: { type: 'action', ok: lav.max >= 3, consigne: 'Avance le curseur du stade 1 jusqu’au stade 4 (au rinçage).' } },
    { id: 'rincage', titre: 'Pourquoi la tache part au rinçage', focus: ['scene'],
      texte: <>À la fin du lavage, la salissure grasse se trouve au centre d’une micelle, au milieu des chaînes carbonées des ions. Le tissu est propre.</>,
      tache: { type: 'qcm', ...QCM.rincage } },
    { id: 'applications', titre: 'Des tensioactifs partout', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE LAVAGE EN TROIS TEMPS',
      retenir: <>
        <SvgLavage/>
        <ul style={liste}>
          <li>Salissure grasse (apolaire) : les <strong>chaînes s’insèrent</strong> dans la goutte, les <strong>têtes restent côté eau</strong> ; la salissure se détache et se retrouve <strong>piégée dans une micelle</strong>, dispersée dans l’eau, puis <strong>emportée au rinçage</strong>.</li>
          <li>Exemple : dans le tube B, les gouttelettes d’huile sont entourées de molécules de tensioactif, ce qui les garde dispersées dans l’eau.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « insérer, détacher, rincer ».</li>
          <li><strong>Idée fausse</strong> : « le savon dissout ou détruit l’huile ». <strong>Vrai</strong> : l’huile reste intacte ; elle est seulement entourée et emportée.</li>
        </ul></>,
      texte: <>Les espèces amphiphiles ne servent pas qu’à laver : on les appelle des <strong>tensioactifs</strong>. Pense à la mayonnaise, mélange d’huile et d’eau qui ne se sépare pas.</>,
      tache: { type: 'qcm', ...QCM.applications } },
    { id: 'bilan', titre: 'Bilan : reconnaître une espèce amphiphile', focus: ['scene'],
      retenirTitre: 'À RETENIR : LES TENSIOACTIFS AU QUOTIDIEN',
      retenir: <>
        <SvgApplications/>
        <ul style={liste}>
          <li>Les <strong>tensioactifs</strong> sont des espèces amphiphiles : <strong>lessives, gels douche, shampoings, produits vaisselle, cosmétiques</strong> et émulsifiants alimentaires (<strong>lécithine</strong> du jaune d’œuf).</li>
          <li>Les savons s’obtiennent à partir de corps gras : c’est l’objet d’un TP de synthèse.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « une tête, une queue, mille usages ».</li>
          <li><strong>Idée fausse</strong> : « un tensioactif ne sert qu’à laver ». <strong>Vrai</strong> : il sert aussi à émulsionner (mayonnaise) et à former des mousses.</li>
        </ul></>,
      texte: <>Dernier test : reconnaître une entité amphiphile à partir de sa formule semi-développée.</>,
      tache: { type: 'qcm', ...QCM.bilan } },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'hors') setDefi({ type, ...tirerMilieu(defi && defi.milieu), choix: null, verifie: false, ok: false });
    else setDefi({ type, id: tirerEntite(defi && defi.id).id, car: '', nC: '', verifie: false, ok: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const entD = defi && defi.type === 'programme' ? M.entite(defi.id) : null;
  const milD = defi && defi.type === 'hors' ? M.milieu(defi.milieu) : null;
  const verifierDefi = () => {
    if (defi.type === 'programme') {
      const okCar = defi.car === M.classer(entD).caractere, okNC = lireNombre(defi.nC) === M.nbAtomes(entD, 'C'), ok = okCar && okNC;
      setDefi(d => ({ ...d, verifie: true, ok, okCar, okNC })); noterP(ok);
    } else {
      const ok = defi.choix === milD.bonne;
      setDefi(d => ({ ...d, verifie: true, ok })); noterH(ok);
    }
  };
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['programme', 'Classer une entité'], ['hors', 'Au-delà du programme']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'programme' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : classe l’entité {entD.id === 'nacl' ? '' : <>« {entD.court} »</>}</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
          {entD.nom}. Formule semi-développée : <span style={{ whiteSpace: 'nowrap' }}><FormuleSemi e={entD} colore={false} taille={17}/></span>. Est-elle hydrophile, lipophile ou amphiphile ? Dis aussi combien d’atomes de carbone compte la formule.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Caractère de l’entité
            <select value={defi.car} onChange={x => setDefi(d => ({ ...d, car: x.target.value, verifie: false }))} style={sel} aria-label="Caractère de l’entité">
              <option value="">Choisis…</option><option value="hydrophile">hydrophile</option><option value="lipophile">lipophile (hydrophobe)</option><option value="amphiphile">amphiphile</option></select></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14.5 }}>
            <span>Atomes de carbone de la formule</span>
            <input value={defi.nC} inputMode="numeric" aria-label="Nombre d’atomes de carbone" onChange={x => setDefi(d => ({ ...d, nC: x.target.value, verifie: false }))}
              style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.okNC ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }}/></label>
        </div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Cherche d’abord une partie polaire (groupe COO⁻, COOH, OH, ions) et une chaîne carbonée apolaire d’au moins 8 atomes de carbone dans cette simulation (lipophile). Les deux ensemble : amphiphile ; l’un des deux seulement : hydrophile (polaire) ou lipophile (chaîne). Pour compter les carbones, additionne ceux de CH₃, de chaque CH₂ (ou CH=CH) et du groupe COO⁻ ou COOH.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi au-delà du programme : un savon dans {milD.nom}</div>
        <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '5px 8px', marginBottom: 8, lineHeight: 1.5 }}><strong>Au-delà du programme</strong> : cette question dépasse le lycée, pour s’entraîner.</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On lave avec du savon (stéarate de sodium) dans {milD.nom}. Le savon y lave-t-il aussi bien que dans une eau douce ?</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>Ta réponse
          <select value={defi.choix ?? ''} onChange={x => setDefi(d => ({ ...d, choix: x.target.value, verifie: false }))} style={sel} aria-label="Ta réponse">
            <option value="">Choisis…</option>{defi.options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Pense à ce qui arrive aux ions carboxylate R–COO⁻ dans ce milieu : restent-ils libres et dissous pour former des micelles ?</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="sv-verif" onClick={verifierDefi} disabled={defi.type === 'programme' ? !defi.car || defi.nC === '' : !defi.choix} style={{ ...styleBouton(true, '#15803d'), opacity: (defi.type === 'programme' ? !defi.car || defi.nC === '' : !defi.choix) ? 0.5 : 1 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouvelle question</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
        {defi.type === 'programme' ? (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : {M.NOM_CARACTERE[M.classer(entD).caractere]}, {M.nbAtomes(entD, 'C')} atomes de carbone. <span style={{ fontWeight: 400, color: KIT.txt }}>{M.justification(entD)}</span></div>
          : <>
            {!defi.okCar && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Caractère : cherche la partie polaire et la chaîne carbonée longue (8 carbones ou plus dans cette simulation).</div>}
            {!defi.okNC && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Carbones : compte ceux de la chaîne (CH₃, CH₂, CH=CH) puis celui du groupe COO⁻ ou COOH.</div>}</>)
          : (defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct. <span style={{ fontWeight: 400, color: KIT.txt }}>{milD.expl}</span></div> : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore : regarde ce que devient l’ion carboxylate dans ce milieu.</div>)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle qualitatif</strong> : la tête (point bleu) et la queue (trait orange) schématisent les deux parties de l’ion. Les dessins ne sont pas à l’échelle et les ions sont immobiles ; la simulation ne calcule aucune grandeur.</li>
      <li><strong>Chaîne « longue »</strong> : on la dit lipophile à partir de 8 atomes de carbone environ. C’est un repère de choix pour classer les entités de la simulation, pas une loi : la limite réelle dépend de la tête et du milieu.</li>
      <li><strong>Polarité</strong> : le groupe COO⁻ est polaire parce qu’il est chargé ; les liaisons C–C et C–H sont apolaires (écart d’électronégativité de 0,35 entre C et H, inférieur à 0,4 selon la convention de cours), donc la chaîne l’est aussi.</li>
      <li><strong>Micelle</strong> : on la décrit seulement qualitativement (têtes côté eau, chaînes au centre). On ne cherche ni le nombre d’ions, ni la forme exacte, ni la concentration à partir de laquelle elles se forment : cela relève d’études plus avancées.</li>
      <li><strong>Savon</strong> : sel de sodium (ou de potassium) d’un acide gras ; dans un savon, ce sont les ions carboxylate qui agissent ; le contre-ion Na⁺ ou K⁺ ne joue aucun rôle. Le liquide vaisselle est un mélange de tensioactifs, pas un savon au sens strict, mais il agit de la même façon.</li>
      <li><strong>Salissures</strong> : la salissure grasse est apolaire ; la salissure ionique (une particule chargée) n’est traitée que dans l’exploration, avec un modèle simplifié à deux couches d’ions.</li>
      <li><strong>Amphiphile « faible »</strong> : un acide gras ou un alcool à longue chaîne possède deux parties, mais sa tête non chargée est peu hydrophile : il est presque insoluble dans l’eau et ne lave pas comme un savon.</li>
      <li><strong>Au-delà du programme</strong> (exploration et défi seulement) : eau dure (ions Ca²⁺ et Mg²⁺), eau acide, eau très salée.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const boutonsOrient = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      <button onClick={() => setOrient('tete-eau')} aria-pressed={orient === 'tete-eau'} style={{ ...styleBouton(orient === 'tete-eau', '#0369a1'), minHeight: 42 }}>Têtes dans l’eau</button>
      <button onClick={() => setOrient('queue-eau')} aria-pressed={orient === 'queue-eau'} style={{ ...styleBouton(orient === 'queue-eau', '#0369a1'), minHeight: 42 }}>Chaînes dans l’eau</button>
    </div>);
  const messageOrient = <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: orient === 'tete-eau' ? '#15803d' : KIT.txt, fontWeight: orient === 'plat' ? 400 : 700 }}>{FEED_ORIENT[orient]}</div>;
  const sceneStade = (
    <>
      <SceneLavage stade={lav.stade} salissure="grasse" agent="savon"/>
      <div style={{ marginTop: 8 }}>
        <Curseur nom="Stade du lavage" valeur={lav.stade + 1} min={1} max={4} pas={1} unite="sur 4" onChange={v => setLav(l => ({ stade: v - 1, max: Math.max(l.max, v - 1) }))} couleur="#0369a1"/>
        <div role="status" aria-live="polite" style={{ fontSize: 14, lineHeight: 1.5, color: KIT.txt }}><strong>{M.STADES[lav.stade].titre}.</strong> {M.STADES[lav.stade].txt}</div>
      </div>
    </>);
  const sceneGuide = (() => {
    if (!idE) return null;
    if (idE === 'constat') return boite('Un tube à essais', <><SceneTubes/>{aide('Le tube A contient de l’eau (en bas) et de l’huile (en haut), après repos.')}</>, cadre('scene'));
    if (idE === 'tube-savon') return boite('Deux tubes à essais', <><SceneTubes avecB agite={agite}/>{agite && <div role="status" style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>Tube A : deux couches nettes. Tube B : l’huile reste <strong>dispersée en fines gouttelettes</strong> dans l’eau et se sépare beaucoup plus lentement.</div>}</>, cadre('scene'));
    if (idE === 'formule' || idE === 'polaire') return boite(`Formule de l’ion stéarate`, <>
      <div style={{ marginBottom: 8, textAlign: 'center' }}><FormuleSemi e={ST} colore={false}/></div>
      <MoleculeSvg e={ST} colore={false}/>{aide('Zigzag : chaque sommet est un atome de carbone, les atomes d’hydrogène de la chaîne ne sont pas dessinés.')}</>, cadre('scene'));
    if (idE === 'courte') return boite('Deux ions à comparer', <>
      {['stearate', 'acetate'].map(id => { const e = M.entite(id); return (
        <div key={id} style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 4, fontSize: 14, color: KIT.txt2 }}>{e.nom}</div>
          <div style={{ marginBottom: 4 }}><FormuleSemi e={e} colore taille={17}/></div>
          <MoleculeSvg e={e} colore etiquettes neutre={!(guide.reussies && guide.reussies[etape])} maxWidth={380}/></div>); })}</>, cadre('scene'));
    if (idE === 'orientation') return boite('Ions à la surface de l’eau', <><SceneInterface orient={orient}/>{boutonsOrient}{messageOrient}</>, cadre('scene'));
    if (idE === 'micelle') return boite('Du savon dans l’eau', <><SceneVolume/>{aide('Les ions sont dispersés dans l’eau, orientés au hasard.')}</>, cadre('scene'));
    if (idE === 'insertion') return boite('Une goutte d’huile dans l’eau', <><SceneGoutte/>{aide('La goutte d’huile est entourée d’ions carboxylate.')}</>, cadre('scene'));
    if (idE === 'lavage') return boite('Lavage d’une tache grasse', sceneStade, cadre('scene'));
    if (idE === 'rincage') return boite('Au rinçage', <><SceneLavage stade={3} salissure="grasse" agent="savon"/>{aide('Au centre de la micelle : l’huile, entourée des chaînes carbonées des ions.')}</>, cadre('scene'));
    if (idE === 'applications') return boite('Le tube B, avec du liquide vaisselle', <><SceneTubes avecB agite/>{aide('Les tensioactifs maintiennent l’huile dispersée dans l’eau.')}</>, cadre('scene'));
    return null;
  })();

  // ════════════════ EXPLORATION ════════════════
  const setE = f => setEx(s => ({ ...s, ...f }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const eX = M.entite(ex.id), cX = M.classer(eX);
  const [idAg, varAg] = AGENTS[ex.agent], eAg = M.entite(idAg);
  const savons = M.ENTITES.filter(e => M.classer(e).savon), autres = M.ENTITES.filter(e => !M.classer(e).savon);
  const optsGroupe = (t, l) => <optgroup label={t}>{l.map(e => <option key={e.id} value={e.id}>{e.court} : {e.id === 'nacl' ? 'sel' : M.semi(e)}</option>)}</optgroup>;
  const exReglages = (<>
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>Entité à étudier
      <select value={ex.id} onChange={x => setE({ id: x.target.value })} style={sel}>{optsGroupe('Savons (ions carboxylate)', savons)}{optsGroupe('Autres entités', autres)}</select></label>
    {aide('Choisis une entité : le dessin montre ses deux parties (bleu = tête polaire, orange = chaîne apolaire) et le caractère s’en déduit.')}
  </>);
  const ligne = (q, oui, txt) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 14.5, lineHeight: 1.5, marginBottom: 4 }}>
      <span style={{ fontWeight: 800, color: oui ? C.vert : C.rouge, minWidth: 18 }}>{oui ? '✓' : '✗'}</span><span><strong>{q}</strong> {txt}</span></div>);
  const exScene = (<>
    <div style={{ textAlign: 'center', marginBottom: 6 }}><FormuleSemi e={eX} colore/></div>
    <MoleculeSvg e={eX} colore etiquettes/>
    <div style={{ marginTop: 10 }}>
      {ligne('Partie polaire (hydrophile) :', cX.polaire, cX.polaire ? { 'COO-': 'groupe COO⁻, chargé', COOH: 'groupe COOH', OH: 'groupe OH', ions: 'deux ions' }[eX.tete] : 'aucune')}
      {ligne('Chaîne lipophile (au moins 8 carbones dans cette simulation) :', cX.longue, `${M.carbonesChaine(eX)} atome${M.carbonesChaine(eX) > 1 ? 's' : ''} de carbone`)}
    </div>
    <div role="status" aria-live="polite" style={{ marginTop: 6, padding: '8px 10px', background: 'white', border: `1.5px solid ${cX.caractere === 'amphiphile' ? C.vert : KIT.bord}`, borderRadius: 10, fontSize: 14.5, lineHeight: 1.55 }}>
      <strong>{eX.court.charAt(0).toUpperCase() + eX.court.slice(1)} : {M.NOM_CARACTERE[cX.caractere]}.</strong> {M.justification(eX)}</div>
  </>);
  const exLavage = (<>
    {aide('Choisis ce que tu mets dans l’eau et la salissure, puis fais avancer le lavage. Parmi les entités proposées ici, seul un ion carboxylate à longue chaîne (un savon) emporte la salissure.')}
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Dans l’eau
        <select value={ex.agent} onChange={x => setE({ agent: +x.target.value, stade: 0 })} style={sel}>{AGENTS.map(([id], k) => <option key={id} value={k}>{M.entite(id).court}</option>)}</select></label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Salissure
        <select value={ex.salissure} onChange={x => setE({ salissure: x.target.value, stade: 0 })} style={sel}><option value="grasse">grasse (huile, apolaire)</option><option value="ionique">minérale (grain chargé, schéma simplifié)</option></select></label>
    </div>
    <SceneLavage stade={varAg === 'savon' ? ex.stade : 0} salissure={ex.salissure} agent={varAg}/>
    {varAg === 'savon' ? <div style={{ marginTop: 8 }}>
      <Curseur nom="Stade du lavage" valeur={ex.stade + 1} min={1} max={4} pas={1} unite="sur 4" onChange={v => setE({ stade: v - 1 })} couleur="#0369a1"/>
      <div role="status" aria-live="polite" style={{ fontSize: 14, lineHeight: 1.5, color: KIT.txt }}><strong>{M.STADES[ex.stade].titre}.</strong> {ex.salissure === 'grasse' ? M.STADES[ex.stade].txt
        : [ 'Le grain, chargé positivement, est collé au tissu. Il ne se dissout pas.', 'Les têtes COO⁻ (négatives) sont attirées par le grain : une première couche d’ions se forme, chaînes apolaires vers l’extérieur.', 'Une seconde couche d’ions, têtes vers l’eau, isole les chaînes de la première couche : le grain se détache, entouré d’une double couche.', 'La particule, qui présente des têtes à l’eau, est dispersée dans l’eau et emportée au rinçage.' ][ex.stade]}</div>
      {ex.salissure === 'ionique' && aide('Modèle simplifié à deux couches, propre au cours : le détail de ces assemblages va au-delà de la capacité exigible.')}
    </div> : <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}><strong>{eAg.court} : pas de lavage.</strong> {VERDICT_AGENT[varAg]}</div>}
  </>);
  const mX = M.milieu(ex.milieu);
  const exHors = (<>
    <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '5px 8px', marginBottom: 8, lineHeight: 1.5 }}><strong>Au-delà du programme</strong> : ces effets ne sont pas exigibles en première.</div>
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>Le savon est utilisé dans
      <select value={ex.milieu} onChange={x => setE({ milieu: x.target.value })} style={sel}>{M.MILIEUX.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></label>
    <div style={{ fontSize: 14, lineHeight: 1.55, color: KIT.txt }}>{mX.expl}</div>
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Compare le laurate, le palmitate et le stéarate : combien de carbones ? Le caractère change-t-il ?</li>
      <li>L’acide stéarique a la même chaîne que le stéarate : pourquoi n’est-il pas un savon ?</li>
      <li>Compare l’éthanol et le dodécan-1-ol : tous deux ont un groupe OH. Qu’est-ce qui change ?</li>
      <li>Dans « Laver une salissure », essaie l’ion éthanoate : pourquoi la tache reste-t-elle collée au tissu ?</li>
      <li>Au-delà du programme : pourquoi un savon lave-t-il mal dans une eau dure ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir titre="À RETENIR : LES TENSIOACTIFS AU QUOTIDIEN">
      <SvgApplications/>
      <ul style={liste}>
        <li>Les <strong>tensioactifs</strong> sont des espèces amphiphiles : lessives, gels douche, shampoings, produits vaisselle, cosmétiques, émulsifiants alimentaires (lécithine).</li>
        <li><strong>Moyen de s’en souvenir</strong> : « une tête, une queue, mille usages ».</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sv-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .sv-hypo-defi { order: 2; } .sv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        .sv-l1.cote .sv-carte { order: 2; } .sv-l1.cote .sv-main { order: 1; }
        @media (min-width: 901px) { .sv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); } .sv-l1.cote .sv-carte { order: 2; } .sv-l1.cote .sv-main { order: 1; }
          .sv-ex { grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr); } .sv-ex > .sv-ex-scene { grid-column: 1; grid-row: 1; } .sv-ex > .sv-ex-reglages { grid-column: 2; grid-row: 1; } }
        @media (prefers-reduced-motion: no-preference) { .sv-in { animation: sv-fondu 0.35s ease-out; } @keyframes sv-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Savons et amphiphilie : pourquoi un savon lave</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {!enGuide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un savon se compose d’ions à <Queue>longue chaîne carbonée apolaire</Queue> et à <Tete>tête polaire</Tete> : on dit qu’il est <strong>amphiphile</strong>. C’est cette double nature qui lui permet de décrocher une salissure grasse et de l’emporter avec l’eau.</div>}
      {enExplore ? <>
        <div className="sv-ex">
          <div className="sv-ex-reglages">{boite('Choix de l’entité', exReglages)}</div>
          <div className="sv-ex-scene">{boite(`Entité : ${eX.nom}`, exScene)}</div>
        </div>
        <Section titre="Laver une salissure" ouvert={!!ex.ouv.lavage} onBascule={() => ouvrir('lavage')}>{exLavage}</Section>
        <Section titre="Au-delà du programme : eau dure, acide ou salée" ouvert={!!ex.ouv.hors} onBascule={() => ouvrir('hors')}>{exHors}</Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`sv-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="sv-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="sv-carte sv-hypo-defi">{panneauHypo}</div> : null}
          <div className="sv-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'programme' ? suiviP : suiviH}/></div>}
            {enGuide && <div className="sv-in" key={idE}>{sceneGuide}</div>}
            {enGuide && (idE === 'bilan' || guide.fini) && <div style={{ marginTop: 12 }}>{panneauHypo}</div>}
          </div>
        </div>
      </>}
    </div>
  );
}
