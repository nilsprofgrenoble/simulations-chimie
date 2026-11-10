// Mécanismes réactionnels : addition de HBr sur le but-2-ène (deux étapes, carbocation, stéréochimie).
// Tout est piloté par la coordonnée de réaction u (voir mecaModele.js).
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { JALONS, energie, vitesse, EA1, EA2, DELTA_E, E_CARBOCATION, PRODUITS, descripteurProduit } from "./mecaModele";
import { Mol2D } from "./MecaVue2D";
import { DessinFleches } from "./MecaDessin";

const Vue3D = lazy(() => import("./MecaVue3D"));

const SIM_ID = 92;
declarerDefis(SIM_ID, [['principal', 'Mécanismes réactionnels']]);

const proches = (u, k, t = 0.04) => Math.abs(u - k) < t;

// ── Texte qui accompagne l'animation ──
function legende(u) {
  if (u < 0.05) return "Réactifs : le but-2-ène est riche en électrons (sa liaison π, en violet, est un doublet facile à déplacer). Dans HBr, l'atome H est δ+ (pauvre en électrons) et Br est δ− (riche en électrons). Ici, H est l'électrophile : c'est une addition électrophile.";
  if (u < 0.22) return "Le doublet de la liaison π part vers l'atome H, très pauvre en électrons. En même temps, la liaison H–Br s'allonge.";
  if (u < 0.28) return "État de transition 1 : le sommet de la « montagne ». H est à moitié lié au carbone et à moitié lié à Br. C'est un instant, pas une molécule que l'on peut isoler.";
  if (u < 0.47) return "La liaison H–Br est rompue : le doublet qui la formait reste sur Br, qui devient l'ion Br⁻. Le carbone voisin n'a plus que 6 électrons : c'est un carbocation C⁺, avec une lacune (carré bleu).";
  if (u < 0.53) return "Carbocation + ion Br⁻ : c'est l'intermédiaire, dans un creux du profil. Le site électrophile est C⁺ (il lui manque un doublet) ; le nucléophile est Br⁻, qui porte quatre doublets non liants.";
  if (u < 0.72) return "Br⁻ s'approche de C⁺ en dirigeant l'un de ses doublets non liants vers la lacune. Ce n'est pas C⁺ qui « attaque » Br⁻ : c'est le doublet de Br⁻ qui va chercher le site pauvre en électrons.";
  if (u < 0.78) return "État de transition 2 : le doublet de Br⁻ est à moitié partagé avec C. La barrière est faible : la rencontre de deux ions de charges opposées est très rapide.";
  if (u < 0.95) return "Le doublet de Br⁻ devient la liaison C–Br. Le carbone retrouve 8 électrons et redevient tétraédrique : la molécule sort du plan.";
  return "Produit : le 2-bromobutane. Le carbone C2 est maintenant asymétrique (quatre groupes différents) : la molécule n'est plus plane, Br est devant ou derrière le plan.";
}

// ── Profil d'énergie ──
function Profil({ u, setU, montrerE }) {
  const W = 340, H = 205, mx = 34, my = 22, bas = H - 34;
  const xs = k => mx + k * (W - mx - 12);
  const E0 = -90, E1 = 125;
  const ys = e => my + (E1 - e) / (E1 - E0) * (bas - my);
  const pts = []; for (let i = 0; i <= 120; i++) { const k = i / 120; pts.push(`${xs(k).toFixed(1)},${ys(energie(k)).toFixed(1)}`); }
  const place = { R: [0, 'start', 16], ET1: [0, 'middle', -9], CB: [0, 'middle', 17], ET2: [0, 'middle', -9], P: [0, 'end', 16] };
  const toucher = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = (e.clientX - r.left) / r.width * W;
    setU(Math.max(0, Math.min(1, (k - mx) / (W - mx - 12))));
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 440, display: 'block', touchAction: 'none', cursor: 'pointer' }} onClick={toucher} role="img" aria-label="Profil énergétique de la réaction">
      <line x1={mx} y1={ys(E0)} x2={mx} y2={my - 10} stroke="#94a3b8" /><line x1={mx} y1={bas} x2={W - 8} y2={bas} stroke="#94a3b8" />
      <text x={mx - 6} y={my - 4} fontSize="10" textAnchor="start" fill="#64748b">Énergie</text>
      <text x={W - 8} y={H - 6} fontSize="10" textAnchor="end" fill="#64748b">avancement de la réaction →</text>
      <line x1={mx} y1={ys(0)} x2={W - 12} y2={ys(0)} stroke="#cbd5e1" strokeDasharray="3 4" />
      <polyline points={pts.join(' ')} fill="none" stroke={"#0284c7"} strokeWidth="2.8" />
      {JALONS.map(j => {
        const [, anc, dy] = place[j.id];
        return (<g key={j.id}>
          <circle cx={xs(j.u)} cy={ys(j.E)} r="3.5" fill="white" stroke={"#0284c7"} strokeWidth="2" />
          <text x={xs(j.u) + (anc === 'start' ? -2 : anc === 'end' ? 2 : 0)} y={ys(j.E) + dy} fontSize="11" fontWeight="700" textAnchor={anc} fill="#334155">{j.court}</text>
          {montrerE && <text x={xs(j.u) + (anc === 'start' ? -2 : anc === 'end' ? 2 : 0)} y={ys(j.E) + dy + (dy > 0 ? 12 : -12)} fontSize="10" textAnchor={anc} fill="#64748b">{j.E} kJ/mol</text>}
        </g>);
      })}
      <circle cx={xs(u)} cy={ys(energie(u))} r="7.5" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
    </svg>
  );
}

function Stereo2Faces({ numC = false }) {
  const items = [[1, 'Br arrive par l’avant'], [-1, 'Br arrive par l’arrière']];
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {items.map(([f, nom]) => (
        <div key={f} style={{ flex: '1 1 160px', textAlign: 'center' }}>
          <Mol2D u={1} face={f} petit numC={numC} titre={`Produit : ${nom}`} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>{nom} → ({descripteurProduit(f)})</div>
        </div>))}
    </div>
  );
}

// ── Parcours guidé ──
function etapesGuide(u, setU, ouvrirDessin, reussi) {
  const va = (k, t = 0.04) => ({ ok: proches(u, k, t), label: 'Le faire pour moi', faire: () => setU(k) });
  return [
    { titre: 'Les réactifs', texte: <>On fait réagir le <strong>but-2-ène</strong> (CH₃–CH=CH–CH₃) avec le <strong>bromure d'hydrogène</strong> HBr. Regarde le schéma : la double liaison contient une liaison π (en violet), riche en électrons. Dans HBr, le brome attire les électrons de la liaison : il est <strong>δ−</strong>, et l'hydrogène est <strong>δ+</strong>.</>,
      tache: { type: 'qcm', q: 'Quel atome de HBr est pauvre en électrons (δ+) ?', options: ['L’atome de brome', 'L’atome d’hydrogène'], bonne: 1, indice: 'Le brome est plus électronégatif que l’hydrogène : il attire les électrons de la liaison.', expl: <>Le brome, plus électronégatif, attire le doublet de la liaison H–Br : il est δ−, et H est δ+. C'est H qui sera attaqué par le doublet π.</> } },
    { titre: 'Quel type de réaction ?', texte: <>Deux molécules se fixent sur la double liaison : la double liaison disparaît et deux atomes s'ajoutent. On parle de <strong>réaction d'addition</strong>. Ici, c'est H (δ+, pauvre en électrons) qui est attaqué en premier : on parle d'<strong>addition électrophile</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est le type de cette réaction ?', options: ['Une substitution', 'Une addition électrophile', 'Une élimination'], bonne: 1, indice: 'Regarde ce qui arrive à la double liaison : elle disparaît-elle, ou se remplace-t-elle ?', expl: <>Dans une addition, la double liaison disparaît et deux atomes s'ajoutent. Dans une substitution, un atome en remplace un autre ; dans une élimination, une molécule part.</> } },
    { titre: 'Qu\'est-ce qu\'une flèche courbe ?', texte: <>Amène la bille au sommet de la première bosse (ET₁). Des <strong>flèches courbes</strong> rouges apparaissent : elles montrent le déplacement d'un <strong>doublet d'électrons</strong>, de sa source (le début de la flèche) vers sa destination (la pointe).</>,
      tache: { type: 'action', ...va(0.25), consigne: 'Place la bille sur ET₁ (curseur ou clic sur la courbe).', indice: 'Fais glisser le curseur jusqu’à ce que la bille soit au sommet de la première bosse.' } },
    { titre: 'Le sens de la flèche', texte: <>À l'état de transition 1, la première flèche part de la liaison π et pointe vers l'atome H.</>,
      tache: { type: 'qcm', q: 'Que représente le début d’une flèche courbe ?', options: ['La position de départ d’un atome', 'La source d’un doublet d’électrons (liaison ou doublet non liant)', 'Le sens du mouvement de la molécule entière'], bonne: 1, indice: 'Une flèche courbe ne suit pas des atomes : elle suit des électrons.', expl: <>Une flèche courbe décrit le déplacement d'un doublet d'électrons. Les atomes bougent <em>ensuite</em>, parce que les liaisons changent.</> } },
    { titre: 'À toi de dessiner : l\'étape 1', texte: <>Ouvre l'atelier de dessin et trace les <strong>deux flèches courbes</strong> de l'étape 1. Clique sur le <strong>début</strong> de la flèche (une liaison ou un doublet non liant), puis sur sa <strong>destination</strong>, puis sur « Vérifier ».</>,
      tache: { type: 'action', ok: !!reussi[1], label: 'Ouvrir l\'atelier de dessin', faire: () => ouvrirDessin(1), consigne: 'Trace les deux flèches de l\'étape 1, puis clique sur « Vérifier ».', indice: 'Une flèche part toujours d\'un doublet d\'électrons. Quel doublet est riche en électrons et va vers l\'atome δ+ ? Et le doublet de la liaison H–Br, où va-t-il quand cette liaison se rompt ?' } },
    { titre: 'Le carbocation', texte: <>Place la bille dans le creux central. La liaison H–Br est rompue : Br est resté avec le doublet, c'est l'ion <strong>Br⁻</strong> (quatre doublets non liants). Le carbone voisin ne possède plus que 6 électrons : c'est un <strong>carbocation C⁺</strong>. Le carré bleu marque sa <strong>lacune électronique</strong>.</>,
      tache: { type: 'action', ...va(0.5), consigne: 'Place la bille sur le carbocation (intermédiaire).', indice: 'Cherche le creux entre les deux bosses.' } },
    { titre: 'Qui attaque qui ?', texte: <>Un <strong>nucléophile</strong> possède un doublet à donner ; un <strong>électrophile</strong> a une lacune à combler. Avance doucement vers ET₂ et observe l'ion Br⁻ : l'un de ses doublets se dirige vers la lacune.</>,
      tache: { type: 'qcm', q: 'Dans l’étape 2, qu’est-ce qui se passe ?', options: ['Le carbocation C⁺ se déplace vers Br⁻ pour l’attaquer', 'Un doublet non liant de Br⁻ attaque le carbone C⁺ (la lacune)', 'Un atome H quitte le carbone pour rejoindre Br⁻'], bonne: 1, indice: 'Qui possède un doublet à donner ? Qui a une lacune à combler ?', expl: <>Br⁻ est le <strong>nucléophile</strong> (doublet non liant), C⁺ est l'<strong>électrophile</strong> (lacune). C'est le doublet de Br⁻ qui devient la liaison C–Br.</> } },
    { titre: 'À toi de dessiner : l\'étape 2', texte: <>Retourne dans l'atelier de dessin, choisis « Étape 2 » et trace la flèche courbe de l'attaque de Br⁻ sur le carbocation.</>,
      tache: { type: 'action', ok: !!reussi[2], label: 'Ouvrir l\'atelier de dessin', faire: () => ouvrirDessin(2), consigne: 'Trace la flèche de l\'étape 2, puis clique sur « Vérifier ».', indice: 'Qui possède un doublet à donner ? Qui a une lacune à combler ? La flèche va du premier vers le second.' } },
    { titre: 'Lire le profil : la barrière de l’étape 1', texte: <>L'énergie d'activation d'une étape est la hauteur à gravir entre le départ de l'étape et son sommet. Pour l'étape 1, il faut passer de <strong>0 kJ/mol</strong> (réactifs) au sommet ET₁. Active « Montrer les énergies » pour lire les valeurs.</>,
      tache: { type: 'num', q: 'Quelle est l’énergie d’activation de l’étape 1 ?', unite: 'kJ/mol', vrai: EA1, tol: 0.02, cs: 3, indice: 'Énergie du sommet ET₁ moins énergie des réactifs.', calcul: () => [`E(ET₁) − E(réactifs) = ${JALONS[1].E} − ${JALONS[0].E} = ${EA1} kJ/mol`], pieges: [[JALONS[1].E - E_CARBOCATION, 'Tu as pris le carbocation comme départ : l’étape 1 part des réactifs.']] } },
    { titre: 'L’étape la plus lente', texte: <>L'étape 2 démarre depuis le carbocation (60 kJ/mol) et monte jusqu'à ET₂ (70 kJ/mol).</>,
      tache: { type: 'num', q: 'Quelle est l’énergie d’activation de l’étape 2 ?', unite: 'kJ/mol', vrai: EA2, tol: 0.02, cs: 2, indice: 'Même méthode, mais le départ de l’étape 2 est le carbocation.', calcul: () => [`E(ET₂) − E(carbocation) = ${JALONS[3].E} − ${E_CARBOCATION} = ${EA2} kJ/mol`], pieges: [[JALONS[3].E, 'Tu as pris les réactifs comme départ : l’étape 2 part du carbocation.']] } },
    { titre: 'Quelle étape décide de la vitesse ?', texte: <>Plus la barrière est haute, plus l'étape est difficile à franchir, donc lente.</>,
      tache: { type: 'qcm', q: 'Quelle étape limite la vitesse de la réaction ?', options: ['L’étape 1 (barrière la plus haute)', 'L’étape 2 (c’est la dernière)', 'Les deux ont la même vitesse'], bonne: 0, indice: 'Compare les deux énergies d’activation.', expl: <>Ea₁ = 100 kJ/mol est bien supérieure à Ea₂ = 10 kJ/mol : l'étape 1 est l'étape lente. Le carbocation, une fois formé, réagit presque aussitôt.</> } },
    { titre: 'Bilan énergétique', texte: <>Place la bille sur le produit. La réaction libère-t-elle de l'énergie ? Compare l'énergie du produit à celle des réactifs.</>,
      tache: { type: 'num', q: 'Quelle est la variation d’énergie entre réactifs et produit ?', unite: 'kJ/mol', vrai: DELTA_E, tol: 0.02, cs: 2, indice: 'Énergie finale moins énergie initiale (le signe compte).', calcul: () => [`E(produit) − E(réactifs) = ${JALONS[4].E} − ${JALONS[0].E} = ${DELTA_E} kJ/mol`] } },
    { titre: 'Devant ou derrière le plan ?', texte: <>Le carbocation est plan : Br⁻ peut arriver <strong>par l'avant</strong> ou <strong>par l'arrière</strong>. Les deux faces sont équivalentes. Observe les deux produits.</>,
      tache: { type: 'qcm', q: 'Si Br⁻ attaque autant par l’avant que par l’arrière, que obtient-on ?', options: ['Un seul produit', 'Deux énantiomères en quantités égales (mélange racémique)', 'Deux isomères en proportions très différentes'], bonne: 1, indice: 'Les deux faces sont identiques par symétrie : elles sont attaquées avec la même probabilité.', expl: <>Les deux produits sont images l'un de l'autre dans un miroir (énantiomères). Chaque face étant attaquée 1 fois sur 2, on obtient 50 % de (R) et 50 % de (S) : un mélange racémique.</> } },
    { titre: 'Bilan', texte: <>Tu sais lire un mécanisme : les <strong>flèches courbes</strong> suivent les doublets, du <strong>nucléophile</strong> (doublet) vers l'<strong>électrophile</strong> (lacune).</>,
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Addition électrophile de HBr sur une double liaison, en deux étapes : formation du <strong>carbocation</strong> (lente), puis attaque de Br⁻ (rapide).</li>
        <li>Une flèche courbe va d'un doublet vers un site pauvre en électrons.</li>
        <li>Le carbocation est un <strong>intermédiaire</strong> (creux), un état de transition est un <strong>sommet</strong>.</li>
        <li>Face plane attaquée de chaque côté : <strong>mélange racémique</strong>.</li>
      </ul> },
  ];
}

// ── Défi : questions calculées par le modèle ──
function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function melange(arr, r) { const a = arr.map((v, i) => [v, i]); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed);
  const i = Math.floor(r() * 4), j = i + 1 + Math.floor(r() * (4 - i)), A = JALONS[i], B = JALONS[j];
  const q1 = { id: 'delta', type: 'num', q: `Lis le profil d’énergie : de quelle quantité l’énergie varie-t-elle en passant de « ${A.nom} » à « ${B.nom} » ?`, unite: 'kJ/mol', vrai: B.E - A.E, tol: 0.02, detail: `E(${B.court}) − E(${A.court}) = ${B.E} − ${A.E} = ${B.E - A.E} kJ/mol.` };
  const etape = r() < 0.5 ? 1 : 2;
  const opts = [['le but-2-ène (sa liaison π)', 1], ['la molécule HBr', 0], ['l’ion Br⁻', 2], ['le carbocation', 0]];
  const mel = melange(opts, r);
  const q2 = { id: 'nuc', type: 'qcm', q: `Dans l’étape ${etape} du mécanisme, quelle espèce est le nucléophile (celle qui fournit le doublet) ?`, options: mel.map(([[t]]) => t), bonne: mel.findIndex(([[, e]]) => e === etape), detail: etape === 1 ? 'Dans l’étape 1, le doublet π du but-2-ène attaque l’atome H.' : 'Dans l’étape 2, un doublet non liant de Br⁻ attaque C⁺.' };
  const rel = melange([['des énantiomères', 1], ['des diastéréoisomères', 0], ['des isomères de constitution', 0], ['la même molécule', 0]], r);
  const q3 = { id: 'stereo', type: 'qcm', q: 'Br⁻ attaque le carbocation plan par l’avant ou par l’arrière. Les deux produits obtenus sont :', options: rel.map(([[t]]) => t), bonne: rel.findIndex(([[, e]]) => e === 1), detail: `Les produits sont (${PRODUITS[1].cip}) et (${PRODUITS[-1].cip}) : images l’un de l’autre dans un miroir.` };
  const e4 = r() < 0.5 ? 1 : 2;
  const q4 = { id: 'ea', type: 'num', q: `Quelle est l’énergie d’activation de l’étape ${e4} ?`, unite: 'kJ/mol', vrai: e4 === 1 ? EA1 : EA2, tol: 0.02, detail: e4 === 1 ? 'E(ET₁) − E(réactifs) = 100 − 0.' : 'E(ET₂) − E(carbocation) = 70 − 60.' };
  return { Q: [q1, q2, q3, q4], reps: {}, verifie: false };
}
const INDICE_Q = {
  delta: 'Énergie de l’arrivée moins énergie du départ : un nombre négatif signifie que l’énergie diminue.',
  nuc: 'Le nucléophile donne un doublet ; l’électrophile a une lacune ou un site δ+.',
  stereo: 'Pense à tes deux mains : même forme, mais non superposables.',
  ea: 'Énergie du sommet de l’étape moins énergie de son point de départ.',
};

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les énergies (0 ; 100 ; 60 ; 70 ; −65 kJ/mol) sont des <strong>ordres de grandeur arrondis</strong>, choisis pour illustrer le mécanisme : ce ne sont pas des mesures précises.</li>
    <li>Le mouvement des atomes est <strong>interpolé</strong> entre des géométries typiques : ce n'est pas un calcul de dynamique moléculaire.</li>
    <li>Les atomes sont dessinés avec des rayons réduits en 3D, pour garder la scène lisible (pas à l'échelle des rayons de van der Waals).</li>
    <li>Aucun catalyseur n'est représenté : HBr s'additionne seul sur l'alcène.</li>
    <li>On ne représente que la réaction avec HBr non solvaté ; dans un solvant, le carbocation et Br⁻ seraient entourés de molécules de solvant.</li>
    <li>Le carbocation est supposé plan ; les deux faces sont attaquées avec la <strong>même probabilité</strong> (molécule sans élément de chiralité préalable).</li>
    <li>Les flèches courbes ne sont affichées qu'aux états clés (réactifs, ET₁, carbocation, ET₂), où les doublets concernés sont bien placés.</li>
  </ul>
);

// ── Composant principal ──
export function SimulationMecanismesReactionnels() {
  const [mode, setMode] = useState(() => modeOuverture('meca-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('meca-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [u, setU] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [vue, setVue] = useState('2d');
  const [etapeDessin, setEtapeDessin] = useState(1);
  const [reussiDessin, setReussiDessin] = useState({});
  const [face, setFace] = useState(1);
  const [montrerE, setMontrerE] = useState(false);
  const [fleches, setFleches] = useState(true);
  const [numC, setNumC] = useState(false);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const ref = useRef(u); ref.current = u;

  useEffect(() => {
    if (!lecture) return;
    let raf, t0 = performance.now();
    const pas = t => {
      const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
      const nv = ref.current + vitesse(ref.current) * dt;
      if (nv >= 1) { setU(1); setLecture(false); return; }
      setU(nv); raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);

  const ouvrirDessin = n => { setLecture(false); setEtapeDessin(n); setVue('dessin'); };
  const etapes = etapesGuide(u, k => { setLecture(false); setU(k); }, ouvrirDessin, reussiDessin);
  const iStereo = etapes.findIndex(e => e.titre === 'Devant ou derrière le plan ?');
  const finParcours = guide.etape >= etapes.length;
  const juste = q => q.type === 'num' ? proche(lireNombre(df.reps[q.id] ?? ''), q.vrai, q.tol) : df.reps[q.id] === q.bonne;

  const visuel = (
    <div style={{ flex: '1 1 340px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setVue('2d')} style={stylePetitBouton(vue === '2d', '#0284c7')}>Vue 2D</button>
        <button onClick={() => setVue('3d')} style={stylePetitBouton(vue === '3d', '#0284c7')}>Vue 3D</button>
        <button onClick={() => { setLecture(false); setVue('dessin'); }} style={stylePetitBouton(vue === 'dessin', '#b91c1c')}>✏️ Dessiner les flèches</button>
        {vue !== 'dessin' && <label style={{ fontSize: 13, color: KIT.txt, display: 'flex', alignItems: 'center', gap: 4 }}>
          Br⁻ arrive par :
          <select value={face} onChange={e => setFace(+e.target.value)} style={{ fontSize: 13 }}>
            <option value={1}>l’avant</option><option value={-1}>l’arrière</option>
          </select>
        </label>}
      </div>
      {vue === 'dessin' ? <DessinFleches etape={etapeDessin} setEtape={setEtapeDessin} onReussite={n => setReussiDessin(r => ({ ...r, [n]: true }))} /> : <>
      {vue === '2d'
        ? <Mol2D u={u} face={face} avecFleches={fleches} numC={numC} />
        : <Suspense fallback={<div style={{ padding: 20, fontSize: 14 }}>Chargement de la 3D…</div>}><Vue3D u={u} face={face} /></Suspense>}
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55, background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px' }}>{legende(u)}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
        {JALONS.map(j => <button key={j.id} onClick={() => { setLecture(false); setU(j.u); }} style={stylePetitBouton(proches(u, j.u, 0.02), '#b45309')}>{j.court}</button>)}
      </div>
      <input type="range" min={0} max={1000} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ width: '100%' }} />
      <Profil u={u} setU={k => { setLecture(false); setU(k); }} montrerE={montrerE} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: KIT.txt }}>
        <label><input type="checkbox" checked={montrerE} onChange={e => setMontrerE(e.target.checked)} /> Montrer les énergies</label>
        {vue === '2d' && <label><input type="checkbox" checked={numC} onChange={e => setNumC(e.target.checked)} /> Numéroter les carbones</label>}
        {vue === '2d' && <label><input type="checkbox" checked={fleches} onChange={e => setFleches(e.target.checked)} /> Flèches courbes (aux états clés)</label>}
      </div>
      </>}
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Utilise le schéma, les flèches courbes et le profil d'énergie pour répondre.</div>
      {df.Q.map((q, k) => {
        const ok = juste(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${df.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
            <IndiceDefi cache={df.verifie && ok}>{avecIndices(INDICE_Q[q.id])}</IndiceDefi>
            {q.type === 'qcm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: i } }))}
                    style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${df.reps[q.id] === i ? '#0284c7' : KIT.bord}`, background: df.reps[q.id] === i ? '#e0f2fe' : 'white', color: KIT.txt }}>{o}</button>))}
                {df.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={df.reps[q.id] || ''} placeholder="?" aria-label={`Réponse au défi ${k + 1}`}
                  onChange={e => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: e.target.value } }))}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130 }} />
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.unite}</span>
                {df.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>)}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>{q.type === 'num' && <>Réponse attendue : <strong>{fmt(q.vrai, 0)} {q.unite}</strong> — </>}{avecIndices(q.detail)}</div>}
          </div>);
      })}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { noterDefi(df.Q.every(juste)); setDf(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => setDf(defi())} style={styleBouton(false)}><Pic n="refresh" />Nouvelles données</button>
        {df.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{df.Q.filter(juste).length} / {df.Q.length} réponses justes</span>}
      </div>
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Mécanismes réactionnels</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <>
            <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />
            {guide.etape >= iStereo && <div style={styleBoite}><Stereo2Faces numC={numC} /></div>}
          </>}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mesures sur le profil</div>
            <LigneMesure nom="Énergie à cet instant (kJ/mol)" valeur={fmt(energie(u), 0)} couleur="#b45309" />
            <LigneMesure nom="Ea étape 1 (kJ/mol)" valeur={fmt(EA1, 0)} couleur="#0284c7" />
            <LigneMesure nom="Ea étape 2 (kJ/mol)" valeur={fmt(EA2, 0)} couleur="#0284c7" />
            <LigneMesure nom="Bilan réactifs → produit (kJ/mol)" valeur={fmt(DELTA_E, 0)} couleur="#16a34a" />
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, margin: '10px 0 6px' }}>Deux faces d'attaque, deux énantiomères</div>
            <Stereo2Faces numC={numC} />
            <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Chaque face est attaquée avec la même probabilité : on obtient 50 % de (R) et 50 % de (S), un <strong>mélange racémique</strong>.</div>
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Les flèches courbes suivent les doublets d'électrons, du nucléophile vers l'électrophile.</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
