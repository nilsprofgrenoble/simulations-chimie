import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useMemo, useRef, useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond, Frac } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./oseModele";
import { SceneChariot, BarresEnergie, GrapheEnergie, MiniEnergie } from "./OseScene";
import { SvgEnergiesCarte, SvgPertesCarte, SvgEntretienCarte, SvgAnalogieEnergieCarte } from "./OseSchemas";
import { Chips, useLecture, BarreLecture, useEtroit, nbf } from "./exploAnim";

// ====================================================
// SIM 322 — « Énergie d'un oscillateur et entretien des oscillations » (terminale STL, SPCL, Ondes, séquence 1 : aux sources des ondes, les phénomènes oscillants).
//  Une idée : un oscillateur échange de l'énergie entre une forme potentielle (ressort, condensateur) et une forme cinétique (masse, bobine) ; les frottements en dissipent,
//  et un dispositif d'entretien apporte à chaque période l'énergie perdue.
//  Capacités visées (jamais affichées à l'élève) : échanges d'énergie en mécanique et en électricité ; rôle d'un dispositif d'entretien ; analogies mécanique-électricité.
//  Hors périmètre : oscillations forcées et résonance (sim 323), équations différentielles, énergie d'un pendule. Modèle : oseModele.js.
// ====================================================
const VIOLET = '#7c3aed';
const SIM_ID = 322, CLE_GUIDE = 'ose-guide-v1';
declarerDefis(SIM_ID, [['courbe', 'Quelle courbe est quelle énergie ?'], ['dissipee', 'Calculer l’énergie dissipée']]);
const IDS = ['mouvement', 'ep', 'ec', 'echange', 'periode', 'frottements', 'bilan', 'entretien', 'puissance', 'analogie', 'fin'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const B = (ep, ec, em, q, w) => ({ ep, ec, em, q, w });
// Configuration de la scène à chaque étape : barres d'énergie, graphe, curseurs. Les éléments introduits restent visibles ensuite.
const DEF = {
  mouvement: { bars: B(0, 0, 0, 0, 0), graph: null },
  ep: { bars: B(1, 0, 0, 0, 0), graph: null },
  ec: { bars: B(1, 1, 0, 0, 0), graph: null },
  echange: { bars: B(1, 1, 1, 0, 0), graph: null },
  periode: { bars: B(1, 1, 1, 0, 0), graph: B(1, 1, 1, 0, 0) },
  frottements: { bars: B(1, 1, 1, 1, 0), graph: B(1, 1, 1, 0, 0), ctrlZ: true, zeta: 0 },
  bilan: { bars: B(1, 1, 1, 1, 0), graph: B(1, 1, 1, 0, 0), ctrlZ: true, zeta: 0.1 },
  entretien: { bars: B(1, 1, 1, 1, 1), graph: B(1, 1, 1, 0, 0), ctrlZ: true, ctrlC: true, zeta: 0.1 },
  puissance: { bars: B(1, 1, 1, 1, 1), graph: B(1, 1, 1, 0, 0), ctrlZ: true, ctrlC: true, zeta: 0.1 },
  analogie: { bars: B(1, 1, 1, 1, 1), graph: B(1, 1, 1, 0, 0), ctrlZ: true, ctrlC: true, zeta: 0.1 },
};
const etiquetteZ = z => (z < 0.005 ? 'aucun' : z < 0.12 ? 'faible' : z < 0.22 ? 'moyen' : 'fort');
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const nbs = (v, d = 2) => nbf(v, d);

// ---------- scène : chariot, barres d'énergie, graphe et commandes (état local : on repart de la configuration de l'étape à chaque étape) ----------
function PanneauEnergie({ cfg, onEvent, complet = false }) {
  const [x0, setX0] = useState(0.8), [zeta, setZeta] = useState(cfg.zeta ?? 0), [c, setC] = useState(0);
  const racine = useRef(null), etroit = useEtroit(racine, 640);
  const tFin = M.REGLAGES.tFin, L = useLecture(tFin, true);
  const S = useMemo(() => M.serie(M.REGLAGES.f0, zeta, c, tFin), [zeta, c, tFin]);
  const tm = Math.max(0, Math.min(Number.isFinite(L.t) ? L.t : 0, tFin)), i = Math.max(0, Math.min(S.n, Math.round(tm / S.dt))), vide = Math.abs(x0) < 0.05;
  const x = x0 * S.x[i], vit = x0 * (S.x[Math.min(S.n, i + 1)] - S.x[Math.max(0, i - 1)]);
  const ev = (zz, cc) => { onEvent && onEvent('lache'); if (zz > 0 && cc < 0.05) onEvent && onEvent('perte'); if (zz > 0 && cc > 0.95) onEvent && onEvent('entretien'); };
  const lacher = () => { L.demarrer(); ev(zeta, c); };
  const deplacer = v => { setX0(v); L.reset(); };
  const changerZ = v => { setZeta(v); L.demarrer(); ev(v, c); };
  const changerC = v => { setC(v); L.demarrer(); ev(zeta, v); };
  const bars = cfg.bars, g = cfg.graph;
  const aria = `Un chariot relié à un ressort oscille autour de sa position d’équilibre${zeta > 0 ? ', avec des frottements' : ''}${c > 0 ? ' et un dispositif d’entretien' : ''}.`;
  return (
    <div ref={racine}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ ...styleBoite, flex: '1 1 320px', minWidth: 0, padding: 6 }}>
          <SceneChariot x={vide ? x0 : x} zeta={zeta} c={c} vitesse={vit} afficheAmort={!!(cfg.ctrlZ || complet)} afficheEntretien={!!(cfg.ctrlC || complet)} aria={aria} onDrag={deplacer} onRelease={lacher} indice={!L.touche}/>
        </div>
        {bars && Object.values(bars).some(Boolean) && <div style={{ ...styleBoite, flex: '1 1 250px', minWidth: 0, padding: 6 }}>
          <BarresEnergie ep={vide ? 0 : S.ep[i]} ec={vide ? 0 : S.ec[i]} em={vide ? 0 : S.em[i]} q={vide ? 0 : S.q[i]} w={vide ? 0 : S.w[i]} montrer={bars}/>
        </div>}
      </div>
      {g && <div style={{ ...styleBoite, padding: 6, marginTop: 10, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}><GrapheEnergie S={S} t={tm} tFin={tFin} montrer={g} etroit={etroit}/></div>}
      {complet ? <BarreLecture L={{ ...L, demarrer: lacher }} tFin={tFin} libelle="▶ Lâcher"/> : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {L.joue ? <button type="button" onClick={() => L.setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
            : <button type="button" onClick={lacher} style={styleBouton(true, VIOLET)}>{L.fin ? '↻ Rejouer' : '▶ Lâcher le chariot'}</button>}
        </div>)}
      {(cfg.ctrlZ || complet) && <div style={{ marginTop: 10, maxWidth: 520 }}>
        <label htmlFor="ose-z" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Frottements : {etiquetteZ(zeta)}</label>
        <input id="ose-z" type="range" min={0} max={0.3} step={0.05} value={zeta} aria-label="Frottements" onChange={ev2 => changerZ(Number(ev2.target.value))} style={{ width: '100%', minHeight: 32 }}/>
      </div>}
      {(cfg.ctrlC || complet) && <div style={{ marginTop: 10, maxWidth: 520 }}>
        <label htmlFor="ose-c" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Entretien : {Math.round(c * 100)} % des pertes compensées</label>
        <input id="ose-c" type="range" min={0} max={1} step={0.05} value={c} aria-label="Entretien" onChange={ev2 => changerC(Number(ev2.target.value))} style={{ width: '100%', minHeight: 32 }}/>
        {zeta === 0 && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 2 }}>Sans frottements, il n’y a rien à compenser : réglez d’abord des frottements.</div>}
      </div>}
      {complet && <Chips items={[['Énergie mécanique Em', `${nbf(S.em[i] * 100, 0)} % de E₀`, VIOLET], ['Dissipée', `${S.q[i] > 3 ? '> 300' : nbf(S.q[i] * 100, 0)} % de E₀`, '#dc2626'], ['Apportée', `${S.w[i] > 3 ? '> 300' : nbf(S.w[i] * 100, 0)} % de E₀`, '#15803d']]}/>}
    </div>);
}

export function SimulationOse() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vus, setVus] = useState({});
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('courbe');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const ev = k => setVus(v => (v[k] ? v : { ...v, [k]: true }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'mouvement', titre: 'Un chariot qui oscille',
      texte: <>Un chariot peut rouler sur un rail horizontal ; il est relié à un <strong>ressort</strong>. Écarté de sa <strong>position d’équilibre</strong> puis lâché, il <strong>oscille</strong>. La position <strong>x</strong> est l’écart par rapport à l’équilibre (x &gt; 0 vers la droite). Pendant ce mouvement, de l’<strong>énergie</strong> se transforme : c’est ce que nous allons suivre.</>,
      tache: { type: 'action', ok: !!vus.lache, consigne: vus.lache ? '✓ Vous avez lâché le chariot : il oscille autour de sa position d’équilibre.' : 'Tirez le chariot vers la gauche ou vers la droite avec le doigt ou la souris, puis lâchez-le (ou cliquez sur « Lâcher le chariot »).' } },
    { id: 'ep', titre: 'L’énergie du ressort',
      texte: <>Un ressort étiré ou comprimé emmagasine de l’énergie : c’est l’<strong>énergie potentielle élastique</strong>, <strong>Ep = ½ k x²</strong>, où <strong>k</strong> est la raideur du ressort (en N/m) et <strong>x</strong> son allongement ou son raccourcissement (en <strong>mètres</strong>). Une barre Ep apparaît : plus on écarte le chariot, plus elle est grande.</>,
      tache: { type: 'num', q: 'Un ressort de raideur k = 40 N/m est allongé de x = 5,0 cm. Quelle énergie potentielle élastique Ep emmagasine-t-il ?', unite: 'J', vrai: 0.05, tol: 0.03, affiche: v => nbs(v, 3), cs: 2, carnet: false,
        calcul: () => ['Conversion : x = 5,0 cm = 0,050 m.', 'Ep = frac(1|2) × k × x² = frac(1|2) × 40 × 0,050² = 0,050 J.'],
        pieges: [[500, 'Vous avez gardé x en centimètres : convertissez-le en mètres (5,0 cm = 0,050 m) avant de calculer.'], [0.1, 'Vous avez oublié le facteur ½ : Ep = ½ k x².'], [1, 'Vous n’avez pas élevé x au carré : Ep = ½ k x², pas ½ k x.']],
        expl: 'x = 0,050 m ; Ep = ½ × 40 × 0,050² = 0,050 J.', indice: 'Convertissez x en mètres, élevez-le au carré, multipliez par k, puis par ½ : Ep = ½ k x².' } },
    { id: 'ec', titre: 'L’énergie du chariot en mouvement',
      texte: <>Un objet en mouvement possède de l’<strong>énergie cinétique</strong> : <strong>Ec = ½ m v²</strong>, où <strong>m</strong> est la masse (en kg) et <strong>v</strong> la vitesse (en m/s). Une barre Ec apparaît : elle est grande quand le chariot va vite, nulle quand il s’arrête un instant.</>,
      tache: { type: 'num', q: 'Un chariot de masse m = 0,50 kg se déplace à la vitesse v = 0,40 m/s. Quelle est son énergie cinétique Ec ?', unite: 'J', vrai: 0.04, tol: 0.03, affiche: v => nbs(v, 3), cs: 2, carnet: false,
        calcul: () => ['Ec = frac(1|2) × m × v² = frac(1|2) × 0,50 × 0,40².', 'Ec = 0,040 J.'],
        pieges: [[0.08, 'Vous avez oublié le facteur ½ : Ec = ½ m v².'], [0.1, 'Vous n’avez pas élevé v au carré : Ec = ½ m v², pas ½ m v.']],
        expl: 'Ec = ½ × 0,50 × 0,40² = 0,040 J.', indice: 'Élevez la vitesse au carré, multipliez par la masse, puis par ½ : Ec = ½ m v².' } },
    { id: 'echange', titre: 'Un échange d’énergie',
      texte: <>Une troisième barre, <strong>Em</strong>, indique l’<strong>énergie mécanique</strong> : la somme <strong>Em = Ec + Ep</strong>. Lâchez le chariot et regardez les barres Ep et Ec pendant le mouvement : l’énergie passe d’une forme à l’autre.</>,
      tache: { type: 'qcm', q: 'Le chariot passe par sa position d’équilibre, à sa vitesse maximale. Quelle forme d’énergie est alors maximale ?', options: ['l’énergie potentielle élastique du ressort', 'l’énergie cinétique du chariot', 'les deux formes, avec la même valeur', 'aucune, car toute l’énergie est nulle'], bonne: 1,
        expl: 'À l’équilibre, le ressort n’est ni étiré ni comprimé (Ep = 0) et la vitesse est maximale : toute l’énergie est cinétique.', indice: 'À l’équilibre, x = 0 : que vaut Ep = ½ k x² ? Et la barre Ec à cet instant ?' } },
    { id: 'periode', titre: 'Sans frottements, l’énergie se conserve',
      retenirTitre: 'À retenir : Ec et Ep s’échangent', retenir: <><SvgEnergiesCarte/><ul style={ULS}>
        <li><strong>Ep = ½ k x²</strong> est maximale à l’élongation maximale, nulle à l’équilibre.</li>
        <li><strong>Ec = ½ m v²</strong> est maximale à l’équilibre, nulle quand le chariot s’arrête.</li>
        <li>Sans frottements, <strong>Em = Ec + Ep</strong> reste constante.</li></ul></>,
      texte: <>Les graphes de Ec, Ep et Em apparaissent. Sans frottements, rien n’est perdu : <strong>Em reste constante</strong>, et l’énergie passe sans cesse du ressort au chariot et inversement. L’énergie cinétique est maximale à chaque passage par l’équilibre, donc <strong>deux fois par période</strong> du mouvement.</>,
      tache: { type: 'qcm', q: 'Un chariot oscille avec une période T = 0,80 s, sans frottements. Quelle est la période de variation de son énergie cinétique ?', options: ['0,20 s', '0,40 s', '0,80 s', '1,6 s'], bonne: 1,
        expl: 'Ec passe par son maximum à chaque passage par l’équilibre, soit deux fois par période : sa période est T / 2 = 0,40 s.', indice: 'Combien de fois le chariot passe-t-il par l’équilibre pendant une période ? Comptez les maxima de Ec sur le graphe.' } },
    { id: 'frottements', titre: 'Les frottements dissipent de l’énergie',
      texte: <>En réalité, des <strong>frottements</strong> existent toujours (un amortisseur les représente ici). Un curseur <strong>Frottements</strong> et une barre <strong>Pertes</strong> apparaissent. Réglez des frottements <strong>faibles</strong>, puis lâchez le chariot : regardez Em.</>,
      tache: { type: 'action', ok: !!vus.perte, consigne: vus.perte ? '✓ Avec des frottements, l’énergie mécanique Em diminue : la barre Pertes augmente d’autant.' : 'Réglez des frottements (curseur), puis lâchez le chariot et observez la barre Em et la barre Pertes.' } },
    { id: 'bilan', titre: 'Le bilan d’énergie',
      texte: <>Avec des frottements, l’énergie mécanique <strong>diminue</strong> : <strong>Em(t) = E₀ − énergie dissipée</strong>, où <strong>E₀</strong> est l’énergie mécanique initiale. L’énergie perdue n’a pas disparu : elle est <strong>dissipée</strong> sous forme de <strong>chaleur</strong> (échauffement de l’amortisseur, du ressort, de l’air).</>,
      tache: { type: 'num', q: 'Un chariot a une énergie mécanique initiale de 0,050 J. Après deux oscillations, il ne lui reste que 0,018 J d’énergie mécanique. Quelle énergie a été dissipée ?', unite: 'J', vrai: 0.032, tol: 0.03, affiche: v => nbs(v, 3), cs: 2, carnet: false,
        calcul: () => ['L’énergie dissipée est la diminution de l’énergie mécanique.', 'Edissipée = 0,050 − 0,018 = 0,032 J.'],
        pieges: [[0.068, 'Vous avez additionné : l’énergie dissipée est la différence entre l’énergie initiale et l’énergie restante.'], [0.018, 'Vous avez donné l’énergie restante : la question porte sur l’énergie perdue, dissipée.']],
        expl: 'Edissipée = E₀ − Em = 0,050 − 0,018 = 0,032 J.', indice: 'L’énergie dissipée est ce qui manque : énergie initiale moins énergie mécanique restante.' } },
    { id: 'entretien', titre: 'Entretenir les oscillations',
      retenirTitre: 'À retenir : les frottements dissipent l’énergie', retenir: <><SvgPertesCarte/><ul style={ULS}>
        <li>Avec des frottements, <strong>Em diminue</strong> au cours du temps.</li>
        <li>L’énergie perdue est <strong>dissipée</strong> sous forme de chaleur.</li>
        <li>Em(t) = E₀ − énergie dissipée.</li></ul></>,
      texte: <>Pour que les oscillations durent, un <strong>dispositif d’entretien</strong> (ici un électroaimant) <strong>pousse le chariot dans le sens de son mouvement</strong> et lui apporte de l’énergie : la barre <strong>Apport</strong> augmente. Un curseur <strong>Entretien</strong> règle la part des pertes compensée. Réglez des frottements, mettez l’entretien au maximum (100 %), puis lâchez le chariot.</>,
      tache: { type: 'action', ok: !!vus.entretien, consigne: vus.entretien ? '✓ Entretien à 100 % : Em reste constante, l’amplitude ne diminue plus.' : 'Réglez des frottements, mettez l’entretien à 100 %, puis lâchez le chariot et regardez la courbe Em.' } },
    { id: 'puissance', titre: 'L’énergie à apporter',
      texte: <>Quand l’entretien compense <strong>exactement</strong> les pertes, l’énergie apportée à chaque période est égale à l’énergie dissipée pendant cette période : l’amplitude reste constante. Rappel : la <strong>puissance moyenne</strong> est l’énergie divisée par la durée : <strong>P = <Frac haut={<>E</>} bas={<>Δt</>} /></strong> (P en watts, E en joules, Δt en secondes).</>,
      tache: { type: 'num', q: 'Un oscillateur dissipe 0,0040 J à chaque période, de durée T = 0,50 s. Quelle puissance moyenne l’entretien doit-il fournir pour garder l’amplitude constante ?', unite: 'mW', vrai: 8, tol: 0.03, affiche: v => nbs(v, 1), cs: 2, carnet: false,
        calcul: () => ['L’entretien apporte 0,0040 J par période de 0,50 s.', 'P = frac(0,0040 J|0,50 s) = 0,0080 W = 8,0 mW.'],
        pieges: [[0.008, 'Vous avez donné la valeur en watts : le résultat est demandé en milliwatts (1 W = 1 000 mW).'], [2, 'Vous avez multiplié l’énergie par la durée : la puissance est l’énergie divisée par la durée.']],
        expl: 'P = frac(E|Δt) = frac(0,0040 J|0,50 s) = 0,0080 W = 8,0 mW.', indice: 'P = frac(E|Δt), avec E l’énergie apportée par période et Δt la durée d’une période. Convertissez les watts en milliwatts.' } },
    { id: 'analogie', titre: 'La même chose en électricité',
      retenirTitre: 'À retenir : entretenir des oscillations', retenir: <><SvgEntretienCarte/><ul style={ULS}>
        <li>Le dispositif d’entretien apporte à chaque période l’énergie dissipée.</li>
        <li>Alors <strong>Em reste constante</strong> et l’amplitude aussi.</li>
        <li>Il compense les pertes : il ne remplace pas l’oscillateur.</li></ul></>,
      texte: <>Un circuit <strong>LC</strong> (une <strong>bobine</strong> d’inductance <strong>L</strong> et un <strong>condensateur</strong> de capacité <strong>C</strong>) échange lui aussi de l’énergie. Le condensateur stocke l’énergie <strong>½ C u²</strong> (<strong>u</strong> : tension à ses bornes) comme le ressort stocke Ep ; la bobine stocke <strong>½ L i²</strong> (<strong>i</strong> : intensité du courant) comme le chariot stocke Ec. La résistance du circuit dissipe l’énergie, comme les frottements.</>,
      tache: { type: 'qcm', q: 'Dans un circuit LC, à l’instant où la tension aux bornes du condensateur est nulle, où est stockée l’énergie du circuit ?', options: ['dans le condensateur, qui est chargé au maximum', 'dans la bobine, où l’intensité est maximale', 'à parts égales dans la bobine et le condensateur', 'nulle part : l’énergie du circuit est nulle'], bonne: 1,
        expl: 'u = 0 : le condensateur ne stocke plus d’énergie (½ C u² = 0), donc toute l’énergie est dans la bobine, où l’intensité est maximale. C’est l’analogue du chariot à l’équilibre.', indice: 'Comparez avec le chariot à l’équilibre : x = 0 correspond à u = 0. Où est alors l’énergie (Ec ou Ep) ?' } },
    { id: 'fin', titre: 'Le bilan',
      retenirTitre: 'À retenir : l’analogie mécanique-électricité', retenir: <><SvgAnalogieEnergieCarte/><ul style={ULS}>
        <li>Condensateur (½ C u²) ↔ ressort (Ep) ; bobine (½ L i²) ↔ masse en mouvement (Ec).</li>
        <li>Résistance ↔ frottements : elle dissipe l’énergie.</li>
        <li>L’entretien apporte à chaque période l’énergie dissipée.</li></ul></>,
      texte: <>Vous savez suivre les échanges d’énergie d’un oscillateur : Ep et Ec, la conservation de Em sans frottements, les pertes avec des frottements, puis le rôle de l’entretien. La suite : explorez librement, ou relevez les défis.</>,
      tache: null },
  ];

  // ---------- défis ----------
  const nouveauDefi = type => {
    if (type === 'courbe') { const d = M.tirageCourbe(); setDefi({ genre: 'courbe', d, S: M.serie(d.f0, d.zeta, 0, d.tFin, 0.02), choix: null, verifie: false, corr: false }); }
    else setDefi({ genre: 'dissipee', d: M.tirageDissipee(), saisie: '', verifie: false, corr: false });
  };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, VIOLET)}><Pic n="target"/>Défis</button>
    </span>);
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const verifierC = () => { const r = M.diagCourbe(defi.d, defi.choix); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterC(r.ok); };
  const verifierD = () => { const r = M.diagDissipee(defi.d, defi.saisie); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterD(r.ok); };
  const lettres = 'ABC';
  const boutons = (verifier, genre) => (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
    <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
    <button onClick={() => nouveauDefi(genre)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
    {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
  </div>);
  const voletDefi = defi && (() => {
    if (defi.genre === 'courbe') {
      const { cands, bonne, cible } = defi.d;
      return (<div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle courbe est quelle énergie ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Un chariot est lâché sans vitesse, avec des frottements. Les trois courbes montrent, à la même échelle, ses trois énergies Ec, Ep et Em en fonction du temps (dans un ordre quelconque). <strong>Cliquez sur la courbe qui représente {M.NOMS_E[cible]}.</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {cands.map((c, i) => { const col = defi.verifie ? (i === bonne ? '#15803d' : defi.choix === i ? '#dc2626' : KIT.bord) : defi.choix === i ? '#ea580c' : KIT.bord;
            return (<button key={i} type="button" aria-pressed={defi.choix === i} aria-label={`Courbe ${lettres[i]}`} onClick={() => modifie({ choix: i })}
              style={{ border: `2.5px solid ${col}`, borderRadius: 12, background: defi.choix === i && !defi.verifie ? '#fff7ed' : '#fff', padding: 4, cursor: 'pointer', minHeight: 44, font: 'inherit', display: 'block', width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: col === KIT.bord ? KIT.txt2 : col, textAlign: 'left', padding: '0 4px' }}>Courbe {lettres[i]}{defi.choix === i ? (defi.verifie && i !== bonne ? ' ✗' : ' ✓') : ''}</div>
              <MiniEnergie S={defi.S} cle={c} aria={`Courbe ${lettres[i]} : énergie en fonction du temps`}/></button>); })}
        </div>
        <IndiceDefi cache={false}>Le chariot est lâché sans vitesse : à t = 0, Ec = 0 et toute l’énergie est potentielle. Ec et Ep oscillent ; Em = Ec + Ep ne s’annule jamais et diminue à cause des frottements.</IndiceDefi>
        {boutons(verifierC, 'courbe')}
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : la courbe ${lettres[bonne]} représente ${M.NOMS_E[cible]}.` : `✗ ${defi.r.msg}`}</div>}
        {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
          {cands.map((c, i) => <div key={i}><strong>Courbe {lettres[i]}</strong> : {c === 'ec' ? 'part de zéro et oscille : énergie cinétique.' : c === 'ep' ? 'part de son maximum et oscille jusqu’à zéro : énergie potentielle.' : 'décroît sans s’annuler : énergie mécanique Ec + Ep, qui diminue à cause des frottements.'}</div>)}</div>}
      </div>);
    }
    const { k, x0, x1, Q } = defi.d;
    return (<div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : calculer l’énergie dissipée</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Un chariot est relié à un ressort de raideur <strong>k = {k} N/m</strong>. On le lâche sans vitesse à l’élongation <strong>x₀ = {nbs(x0, 1)} cm</strong>. À cause des frottements, après plusieurs oscillations, l’amplitude n’est plus que <strong>x₁ = {nbs(x1, 1)} cm</strong>. <strong>Calculez l’énergie dissipée</strong> entre ces deux instants, en millijoules (mJ), avec 2 chiffres significatifs.</div>
      <div style={{ marginTop: 8, maxWidth: 260 }}>
        <label htmlFor="ose-q" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Énergie dissipée (mJ)</label>
        <input id="ose-q" type="text" inputMode="decimal" value={defi.saisie} onChange={e => modifie({ saisie: e.target.value })} placeholder="ex. 12" style={{ font: 'inherit', fontSize: 16, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, width: '100%', boxSizing: 'border-box' }}/>
      </div>
      <IndiceDefi cache={false}>À l’amplitude maximale, toute l’énergie est potentielle : Ep = ½ k x², avec x en mètres. L’énergie dissipée est la différence entre l’énergie mécanique initiale (en x₀) et l’énergie mécanique finale (en x₁). 1 J = 1 000 mJ.</IndiceDefi>
      {boutons(verifierD, 'dissipee')}
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : l’énergie dissipée vaut environ ${nbs(Q, Q < 10 ? 1 : 0)} mJ.` : `✗ ${defi.r.msg}`}</div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Ep initiale = <Frac haut={<>1</>} bas={<>2</>} /> × {k} × ({nbs(x0 / 100, 3)})² = {nbs(0.5 * k * (x0 / 100) ** 2 * 1000, 1)} mJ ; Ep finale = <Frac haut={<>1</>} bas={<>2</>} /> × {k} × ({nbs(x1 / 100, 3)})² = {nbs(0.5 * k * (x1 / 100) ** 2 * 1000, 1)} mJ. Énergie dissipée = <strong>{nbs(Q, 1)} mJ</strong>.</div>}
    </div>);
  })();

  // ---------- hypothèses, pistes, rappels ----------
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle</strong> : oscillateur linéaire (faibles amplitudes), lâché <strong>sans vitesse initiale</strong>. Le chariot roule sans frottement sur le rail : seuls les frottements de l’amortisseur dissipent l’énergie. Le circuit LC obéit aux mêmes équations.</li>
      <li><strong>Frottements</strong> : force proportionnelle à la vitesse ; le curseur règle un coefficient sans unité (valeurs faibles : les oscillations subsistent). Les énergies sont exprimées en pourcentage de l’énergie initiale E₀ = ½ k x₀².</li>
      <li><strong>Entretien</strong> : le dispositif exerce une force proportionnelle à la vitesse, dans le sens du mouvement. Le curseur règle la part des pertes compensée ; à 100 %, l’énergie apportée par période est égale à l’énergie dissipée et l’amplitude reste constante. On ne considère pas d’apport supérieur aux pertes (l’amplitude augmenterait jusqu’à une limite non linéaire).</li>
      <li><strong>Pertes</strong> : l’énergie dissipée est comptée cumulée depuis le lâcher ; avec un entretien, elle peut dépasser E₀ (la barre est alors pleine).</li>
      <li><strong>Valeurs</strong> : période de 1,0 s et durées choisies pour la lisibilité de l’animation, sans prétendre reproduire un appareil précis.</li>
    </ul>)}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Sans frottements, quand Ep est maximale, que vaut Ec ? Et quand Ec est maximale ?</li>
        <li>Écartez le chariot deux fois moins : par combien l’énergie initiale est-elle divisée (Ep = ½ k x²) ?</li>
        <li>Ajoutez des frottements : Em diminue-t-elle régulièrement, ou par paliers ?</li>
        <li>Mettez un entretien de 50 % : l’amplitude diminue-t-elle plus lentement ? Et à 100 % ?</li>
        <li>Avec un entretien de 100 %, comparez la barre Apport et la barre Pertes : que remarquez-vous ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Ep = ½ k x² (ressort), Ec = ½ m v² (masse) ; Em = Ec + Ep.</li>
        <li>Sans frottements, Em est constante : Ec et Ep s’échangent, deux fois par période.</li>
        <li>Avec des frottements, Em diminue : Em(t) = E₀ − énergie dissipée (chaleur).</li>
        <li>L’entretien apporte à chaque période l’énergie dissipée : Em et l’amplitude restent constantes.</li>
        <li>Circuit LC : condensateur ½ C u² (comme Ep), bobine ½ L i² (comme Ec), résistance (comme les frottements).</li>
      </ul>)}
    </Section>);

  const cfg = enGuide ? DEF[idE === 'fin' ? 'analogie' : idE] : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sl-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
        @media (max-width: 900px) { .sl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sl-in { animation: sl-fondu 0.35s ease-out; } @keyframes sl-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Énergie d’un oscillateur et entretien des oscillations</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un chariot au bout d’un ressort, un circuit électrique : en oscillant, ils <strong>échangent de l’énergie</strong>. Où va l’énergie perdue ? Comment <strong>entretenir</strong> les oscillations ?</div>
      {!enExplore && <div className={`sl-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'courbe' ? suiviC : suiviD}/></div>}
          {enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[['courbe', 'Quelle courbe ?'], ['dissipee', 'Énergie dissipée']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, VIOLET)}>{l}</button>)}</div>}
          {enGuide && cfg && <div className="sl-in" key={`s${idE}`}><PanneauEnergie cfg={cfg} onEvent={ev}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <div style={{ maxWidth: 920, margin: '0 auto' }}><PanneauEnergie cfg={{ bars: B(1, 1, 1, 1, 1), graph: B(1, 1, 1, 0, 0), ctrlZ: true, ctrlC: true, zeta: 0.1 }} complet onEvent={ev}/></div>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
