import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices, fmt, lireNombre, proche } from "../commun";
import { SchemaChateau, COUL, H_FOND, H_TROP, ecrireTransfert, lireTransfert, effacerTransfert } from "./chateauEau";

// ====================================================
// POINT DE FONCTIONNEMENT D'UNE RÉGULATION PROPORTIONNELLE (Terminale STL)
// Même maquette que « Régulation TOR, P et PI » : le château d'eau (réservoir de 30 à 36 m, pompe, abonnés).
// Là, on regarde le niveau évoluer dans le temps ; ici, on cherche directement le niveau où il finit par se stabiliser.
// ====================================================

// ── Le modèle (fonctions pures) ──
// Régulateur P pur, sans décalage : Y = Kp (consigne − H), borné entre 0 et 100 % ; la pompe donne Q = Qmax × Y / 100.
const qRegul = (H, c, Kp, Qmax) => Math.min(Qmax, Math.max(0, Qmax * Kp * (c - H) / 100));
// Équilibre : S dH/dt = Q_pompe − Q_puisage = 0, soit Q_pompe(H) = Qp. Le débit de puisage est imposé par les abonnés (indépendant de H).
function equilibre({ consigne, Kp, Qmax, Qp }) {
  const Xp = 100 / Kp;                                                           // bande proportionnelle (m)
  const QpMax = Math.min(Qmax, Qmax * Kp * (consigne - H_FOND) / 100);           // puisage que le régulateur peut compenser sans que le réservoir se vide
  if (Qp <= 0) return { cas: 'ok', H: consigne, Y: 0, ES: 0, Xp, QpMax };
  if (Qp >= Qmax) return { cas: 'sature', H: H_FOND, Y: 100, ES: consigne - H_FOND, Xp, QpMax };
  const Y = Qp / Qmax * 100, ES = Y / Kp, Hth = consigne - ES;
  if (Hth < H_FOND) return { cas: 'vide', H: H_FOND, Hth, Y, ES, Xp, QpMax };
  return { cas: 'ok', H: Hth, Y, ES, Xp, QpMax };
}

function Hypotheses() {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Régime permanent</strong> : on cherche l'équilibre, où le niveau ne varie plus, donc où le débit de la pompe est égal au débit de puisage (S dH/dt = 0). La façon dont le niveau y arrive, et la stabilité de la boucle, ne sont pas étudiées ici : c'est l'objet de « Régulation TOR, P et PI ».</li>
      <li><strong>Puisage imposé par les abonnés</strong> : c'est un débit donné (en m³/h), indépendant de la hauteur d'eau.</li>
      <li><strong>Réservoir entre 30 m (fond) et 36 m (trop-plein)</strong>, de section constante. Un équilibre calculé sous 30 m n'existe pas : le réservoir se vide. La consigne est limitée à 36 m, donc le niveau d'équilibre ne peut pas déborder.</li>
      <li><strong>Pompe à vitesse variable idéale, capteur parfait</strong> : le débit est proportionnel à la commande (Q = Q<sub>max</sub> × Y / 100), indépendant du niveau (on ignore la courbe de la pompe), et le capteur mesure H sans erreur ni retard.</li>
      <li><strong>Régulateur proportionnel pur</strong> : Y = K<sub>p</sub> × (consigne − H), borné entre 0 et 100 %. Il n'y a pas de décalage de commande : Y = 0 quand H atteint la consigne. La bande proportionnelle est X<sub>p</sub> = 100 / K<sub>p</sub>.</li>
      <li><strong>Une seule perturbation</strong> : le débit de puisage.</li>
    </ul>
  );
}

// ── Graphique : débits en fonction de la hauteur d'eau ──
function GraphePF({ c, Kp, Qmax, Qp, eq, showPuisage, showRegul, showPoint, showXp }) {
  const W = 420, Hg = 372, l = 54, r = 14, t = 44, b = 90, hMin = 26, hMax = 38;
  const qTop = Math.ceil(Math.max(Qmax, Qp, 100) * 1.1 / 20) * 20;
  const X = h => l + (h - hMin) / (hMax - hMin) * (W - l - r), Y = q => t + (1 - q / qTop) * (Hg - t - b);
  const pas = qTop > 160 ? 50 : 25;
  const xp = 100 / Kp;
  const brisures = [hMin, c - xp, c, hMax].filter(h => h >= hMin && h <= hMax).sort((p, q) => p - q);
  const regul = brisures.map(h => `${X(h).toFixed(1)},${Y(qRegul(h, c, Kp, Qmax)).toFixed(1)}`).join(' ');
  const bas = Hg - b;
  return (
    <svg viewBox={`0 0 ${W} ${Hg}`} role="img" aria-label="Débit demandé à la pompe et débit de puisage en fonction de la hauteur d'eau"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {Array.from({ length: Math.floor(qTop / pas) + 1 }, (_, k) => k * pas).map(q => (
        <g key={q}><line x1={l} y1={Y(q)} x2={W - r} y2={Y(q)} stroke="#e2e8f0"/><text x={l - 5} y={Y(q) + 4} fontSize="13" fill={KIT.txt2} textAnchor="end">{q}</text></g>
      ))}
      {[26, 28, 30, 32, 34, 36, 38].map(h => (
        <g key={h}><line x1={X(h)} y1={t} x2={X(h)} y2={bas} stroke="#f1f5f9"/><text x={X(h)} y={bas + 16} fontSize="13" fill={KIT.txt2} textAnchor="middle">{h}</text></g>
      ))}
      <rect x={X(H_FOND)} y={t} width={X(H_TROP) - X(H_FOND)} height={bas - t} fill="#dbeafe" opacity="0.35"/>
      <text x={X(H_FOND) + 4} y={t + 13} fontSize="12" fill={COUL.eau}>réservoir (30 à 36 m)</text>
      <line x1={X(c)} y1={t} x2={X(c)} y2={bas} stroke={COUL.consigne} strokeWidth="1.5" strokeDasharray="5 4"/>
      <text x={X(c) - 4} y={t + 28} fontSize="12.5" fill={COUL.consigne} textAnchor="end">consigne</text>
      {showRegul && <polyline points={regul} fill="none" stroke={COUL.pompe} strokeWidth="2.6"/>}
      {showPuisage && <line x1={l} y1={Y(Qp)} x2={W - r} y2={Y(Qp)} stroke={COUL.puisage} strokeWidth="2.2" strokeDasharray="6 4"/>}
      {showPoint && eq.cas === 'ok' && <g>
        <line x1={X(eq.H)} y1={Y(Qp)} x2={X(eq.H)} y2={bas} stroke={KIT.txt} strokeDasharray="3 3"/>
        <circle cx={X(eq.H)} cy={Y(Qp)} r="6.5" fill={KIT.txt} stroke="white" strokeWidth="2"/>
        {eq.ES > 0.02 && <g>
          <line x1={X(eq.H)} y1={bas - 10} x2={X(c)} y2={bas - 10} stroke="#15803d" strokeWidth="2" markerStart="url(#pf-fl-g)" markerEnd="url(#pf-fl-d)"/>
          <text x={(X(eq.H) + X(c)) / 2} y={bas - 16} fontSize="12.5" fontWeight="700" fill="#15803d" textAnchor="middle">ES</text>
        </g>}
      </g>}
      {showPoint && eq.cas === 'vide' && eq.Hth >= hMin && <g>
        <circle cx={X(eq.Hth)} cy={Y(Qp)} r="6" fill="white" stroke={KIT.txt} strokeWidth="2"/>
        <text x={X(eq.Hth)} y={Y(Qp) - 11} fontSize="12" fill="#b91c1c" textAnchor="middle">hors réservoir</text>
      </g>}
      {showXp && <g>
        <line x1={X(Math.max(hMin, c - xp))} y1={bas + 52} x2={X(c)} y2={bas + 52} stroke="#7c3aed" strokeWidth="2"/>
        <line x1={X(c)} y1={bas + 47} x2={X(c)} y2={bas + 57} stroke="#7c3aed" strokeWidth="2"/>
        {c - xp >= hMin && <line x1={X(c - xp)} y1={bas + 47} x2={X(c - xp)} y2={bas + 57} stroke="#7c3aed" strokeWidth="2"/>}
        <text x={(X(Math.max(hMin, c - xp)) + X(c)) / 2} y={bas + 74} fontSize="12.5" fill="#7c3aed" textAnchor="middle">X<tspan fontSize="10" dy="3">p</tspan><tspan dy="-3"> = 100 / Kp = {fmt(xp, 1)} m{c - xp < hMin ? ' (déborde à gauche)' : ''}</tspan></text>
      </g>}
      <line x1={l} y1={bas} x2={W - r} y2={bas} stroke={KIT.txt}/><line x1={l} y1={t} x2={l} y2={bas} stroke={KIT.txt}/>
      <text x={14} y={(t + bas) / 2} fontSize="13.5" fontWeight="700" fill={KIT.txt} transform={`rotate(-90 14 ${(t + bas) / 2})`} textAnchor="middle">débit (m³/h)</text>
      <text x={(l + W - r) / 2} y={bas + 31} fontSize="13.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">hauteur d'eau H (m)</text>
      {(showRegul || showPuisage) && <g transform={`translate(${l} 16)`}>
        {showRegul && <><line x1="0" y1="-4" x2="16" y2="-4" stroke={COUL.pompe} strokeWidth="2.6"/><text x="21" y="0" fontSize="12.5" fill={KIT.txt}>demandé à la pompe</text></>}
        {showPuisage && <><line x1="176" y1="-4" x2="192" y2="-4" stroke={COUL.puisage} strokeWidth="2.2" strokeDasharray="6 4"/><text x="197" y="0" fontSize="12.5" fill={KIT.txt}>débit de puisage</text></>}
      </g>}
      <defs>
        <marker id="pf-fl-d" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#15803d" strokeWidth="1.6"/></marker>
        <marker id="pf-fl-g" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M8 1L2 5L8 9" fill="none" stroke="#15803d" strokeWidth="1.6"/></marker>
      </defs>
    </svg>
  );
}

export function Simulation6({ naviguer }) {
  const [tr] = useState(lireTransfert);                       // réglages venus de « Régulation TOR, P et PI », s'il y en a
  useEffect(() => { if (tr) effacerTransfert(); }, []);
  const [mode, setMode] = useState("explore");               // on arrive sur l'exploration libre
  const [guide, setGuide] = useEtatPersistant("pf-guide-v2", { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true, boucle: true, hypo: true });
  const [consigne, setConsigne] = useState(tr ? tr.consigne : 33);
  const [Kp, setKp] = useState(tr ? tr.Kp : 20);
  const [Qmax, setQmax] = useState(tr ? tr.Qmax : 100);
  const [Qp, setQp] = useState(tr ? tr.Qp : 20);

  const enGuide = mode === 'guide';
  const etape = guide.etape;
  const eq = equilibre({ consigne, Kp, Qmax, Qp });
  const Yschema = eq.cas === 'vide' ? Math.min(100, Kp * (consigne - H_FOND)) : eq.Y;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ES80 = Qp / Qmax * 100 / 80;
  const ETAPES = [
    { id: 'chateau', titre: 'Le château d’eau de la régulation', focus: ['reservoir', 'pompe', 'maison'],
      texte: <>C'est la maquette de la simulation « Régulation TOR, P et PI » : une pompe (B) remplit le réservoir (A), et les abonnés (C) puisent de l'eau. Ici, on ne regarde pas
        le niveau évoluer dans le temps : on cherche le <strong>niveau où il finit par se stabiliser</strong>, avec une régulation proportionnelle (P). Le niveau est entre 30 m (fond) et 36 m (trop-plein).</>,
      tache: { type: 'qcm', q: 'Quelle est la grandeur réglée ?', options: ['La hauteur d’eau H du réservoir', 'Le débit de la pompe', 'Le débit de puisage'], bonne: 0,
        expl: 'C’est la grandeur que l’on veut maintenir : la hauteur d’eau.' } },
    { id: 'grandeurs', titre: 'Qui agit sur quoi ?', focus: ['pompe', 'maison'],
      texte: <>Le régulateur dispose d'un seul moyen d'agir. Les abonnés, eux, ouvrent leurs robinets quand ils le veulent.</>,
      tache: { type: 'qcm', q: 'Quelle est la grandeur perturbatrice ?', options: ['Le débit de la pompe', 'Le débit de puisage', 'La consigne'], bonne: 1,
        expl: 'Le débit de puisage fait varier le niveau sans que le régulateur l’ait décidé. Le régulateur, lui, agit sur le débit de la pompe (grandeur réglante).' } },
    { id: 'equilibre', titre: 'Qu’est-ce que l’équilibre ?', focus: ['maison'],
      texte: <>Le niveau est stable quand l'eau qui entre est égale à l'eau qui sort : S · dH/dt = Q<sub>pompe</sub> − Q<sub>puisage</sub> = 0. Le débit de puisage vaut
        ici {fmt(Qp, 0)} m³/h (par exemple, une ville de 7200 habitants).</>,
      tache: { type: 'num', q: 'Débit que doit fournir la pompe à l’équilibre', unite: 'm³/h', vrai: Qp, tol: 0.01 } },
    { id: 'commande', titre: 'La commande nécessaire', focus: ['pompe'],
      texte: <>La pompe fournit au maximum Q<sub>max</sub> = {fmt(Qmax, 0)} m³/h pour une commande Y = 100 %. Son débit est proportionnel à la commande : Q = Q<sub>max</sub> × Y / 100.</>,
      tache: { type: 'num', q: 'Commande Y nécessaire à l’équilibre', unite: '%', vrai: Qp / Qmax * 100, tol: 0.02, affiche: x => fmt(x, 1),
        expl: `Y = ${fmt(Qp, 0)} / ${fmt(Qmax, 0)} × 100 = ${fmt(Qp / Qmax * 100, 1)} %.` } },
    { id: 'regulateur', titre: 'Le régulateur proportionnel', focus: ['graph', 'params'],
      texte: <>Le régulateur P commande la pompe d'après l'écart : <strong>Y = K<sub>p</sub> × (consigne − H)</strong>, borné entre 0 et 100 %. La courbe verte donne le débit
        que le régulateur demande à la pompe pour chaque hauteur d'eau. Consigne : {fmt(consigne, 0)} m ; K<sub>p</sub> = {fmt(Kp, 0)} %/m.</>,
      tache: { type: 'num', q: `Débit demandé à la pompe quand H = ${fmt(consigne - 2, 0)} m`, unite: 'm³/h', vrai: qRegul(consigne - 2, consigne, Kp, Qmax), tol: 0.02, affiche: x => fmt(x, 1),
        expl: `Y = ${fmt(Kp, 0)} × 2 = ${fmt(Math.min(100, Kp * 2), 0)} %, soit ${fmt(qRegul(consigne - 2, consigne, Kp, Qmax), 1)} m³/h.` } },
    { id: 'xp', titre: 'La bande proportionnelle', focus: ['graph'],
      texte: <>La <strong>bande proportionnelle</strong> X<sub>p</sub> est la variation de hauteur qui fait passer la commande de 0 à 100 % : X<sub>p</sub> = 100 / K<sub>p</sub>. Elle est
        tracée en violet sous le graphique.</>,
      tache: { type: 'num', q: <>Bande proportionnelle X<sub>p</sub></>, unite: 'm', vrai: 100 / Kp, tol: 0.01, affiche: x => fmt(x, 1),
        expl: `Xp = 100 / ${fmt(Kp, 0)} = ${fmt(100 / Kp, 1)} m.` } },
    { id: 'fond', titre: 'La pompe peut-elle tourner à fond ?', focus: ['graph', 'reservoir'],
      texte: <>La commande atteint 100 % quand H est à X<sub>p</sub> sous la consigne, soit à {fmt(consigne - 100 / Kp, 0)} m. Or le réservoir s'arrête à 30 m.</>,
      tache: { type: 'num', q: 'Commande Y du régulateur quand le réservoir est presque vide (H = 30 m)', unite: '%', vrai: Math.min(100, Kp * (consigne - H_FOND)), tol: 0.02, affiche: x => fmt(x, 0),
        expl: `Y = ${fmt(Kp, 0)} × (${fmt(consigne, 0)} − 30) = ${fmt(Kp * (consigne - H_FOND), 0)} %${Kp * (consigne - H_FOND) > 100 ? ', limité à 100 %' : ''} : le régulateur ne demande jamais plus à ce niveau.` } },
    { id: 'point', titre: 'Le point de fonctionnement', focus: ['graph', 'reservoir'],
      texte: <>La droite rouge est le débit de puisage. À l'équilibre, la pompe fournit ce que les abonnés puisent : le niveau est donné par l'<strong>intersection</strong> de la courbe verte et
        de la droite rouge, appelée <strong>point de fonctionnement</strong>. Lisez la hauteur d'eau correspondante.</>,
      tache: { type: 'num', q: 'Hauteur d’eau H au point de fonctionnement', unite: 'm', vrai: eq.H, tol: 0.003, affiche: x => fmt(x, 2),
        bloque: eq.cas !== 'ok' ? 'Avec ces réglages, il n’y a pas de point de fonctionnement dans le réservoir.' : null,
        expl: `H = ${fmt(consigne, 0)} − ${fmt(eq.ES, 2)} = ${fmt(eq.H, 2)} m.` } },
    { id: 'es', titre: 'L’écart statique', focus: ['graph'],
      texte: <>L'écart entre la consigne et le niveau d'équilibre s'appelle l'<strong>écart statique</strong> ES = consigne − H. C'est celui que l'on observe à la fin de la simulation de
        régulation en mode P.</>,
      tache: { type: 'num', q: 'Écart statique ES', unite: 'm', vrai: eq.ES, tol: 0.03, affiche: x => fmt(x, 2),
        bloque: eq.cas !== 'ok' ? 'Avec ces réglages, il n’y a pas de point de fonctionnement dans le réservoir.' : null,
        expl: `ES = Y / K_p = ${fmt(eq.Y, 1)} / ${fmt(Kp, 0)} = ${fmt(eq.ES, 2)} m.` } },
    { id: 'pourquoi', titre: 'Pourquoi un écart ?', focus: ['pompe'],
      texte: <>Réfléchissez : que commande le régulateur quand H est exactement égal à la consigne ?</>,
      tache: { type: 'qcm', q: 'Pourquoi le niveau ne peut-il pas atteindre la consigne ?', options: ['À H = consigne, le régulateur commande Y = 0 : la pompe s’arrête alors que les abonnés continuent de puiser', 'La pompe est trop petite', 'La consigne est mal choisie'], bonne: 0,
        expl: 'Un régulateur proportionnel n’agit que s’il y a un écart. Pour fournir le débit qui compense le puisage, il lui faut donc un écart non nul.' } },
    { id: 'kp', titre: 'Augmenter le gain', focus: ['params'],
      texte: <>Dans « Commandes », réglez K<sub>p</sub> = 80 %/m : la courbe verte devient plus raide.</>,
      tache: { type: 'action', ok: Math.abs(Kp - 80) < 0.5, consigne: Math.abs(Kp - 80) < 0.5 ? null : `Gain K_p : ${fmt(Kp, 0)} %/m → 80 %/m` } },
    { id: 'kpES', titre: 'Effet sur l’écart statique', focus: ['graph'],
      texte: <>Observez le point de fonctionnement : il s'est rapproché de la consigne.</>,
      tache: { type: 'num', q: 'Écart statique ES avec K_p = 80 %/m', unite: 'm', vrai: ES80, tol: 0.04, affiche: x => fmt(x, 2),
        bloque: Math.abs(Kp - 80) > 0.5 ? 'Réglez d’abord Kp = 80 %/m à l’étape précédente.' : null,
        expl: `ES = ${fmt(Qp / Qmax * 100, 1)} / 80 = ${fmt(ES80, 2)} m : il a diminué, mais il n’est pas nul. En revanche, avec un retard de mesure, un gain trop élevé fait osciller le niveau : essayez-le dans « Régulation TOR, P et PI ».` } },
    { id: 'vide', titre: 'Un puisage trop fort', focus: ['params', 'graph'],
      texte: <>Remettez K<sub>p</sub> = 20 %/m, puis réglez le débit de puisage à <strong>70 m³/h</strong>.</>,
      tache: { type: 'qcm', q: 'Que montre le graphique ?', options: ['Les deux courbes se coupent sous 30 m, hors du réservoir : même à H = 30 m, le régulateur ne demande que 60 m³/h, moins que le puisage, donc le réservoir se vide', 'Le niveau se stabilise un peu plus bas', 'La pompe est trop petite : elle ne peut pas dépasser 70 m³/h'], bonne: 0,
        bloque: !(Math.abs(Kp - 20) < 0.5 && Math.abs(Qp - 70) < 0.5) ? 'Réglez Kp = 20 %/m et un puisage de 70 m³/h.' : null,
        expl: 'La pompe pourrait fournir jusqu’à 100 m³/h, mais le régulateur, avec ce gain, ne la commande qu’à 60 % au fond du réservoir.' } },
    { id: 'kpFort', titre: 'Le gain, remède au réservoir vide', focus: ['params', 'graph'],
      texte: <>Gardez le puisage à 70 m³/h et réglez K<sub>p</sub> = 40 %/m.</>,
      tache: { type: 'num', q: 'Hauteur d’eau H au point de fonctionnement', unite: 'm', vrai: 33 - 70 / 40, tol: 0.003, affiche: x => fmt(x, 2),
        bloque: !(Math.abs(Kp - 40) < 0.5 && Math.abs(Qp - 70) < 0.5 && Math.abs(consigne - 33) < 0.05) ? 'Réglez Kp = 40 %/m, un puisage de 70 m³/h et une consigne de 33 m.' : null,
        expl: 'ES = 70 / 40 = 1,75 m : le point de fonctionnement est maintenant dans le réservoir (H = 31,25 m).' } },
    { id: 'dynamique', titre: 'Et dans le temps ?', focus: [],
      texte: <>Dans la simulation « Régulation TOR, P et PI », en mode P et avec les mêmes réglages, le niveau finit par se stabiliser exactement au point de fonctionnement. Le point de
        fonctionnement donne le résultat final ; la simulation montre le chemin pour y arriver.
        {naviguer && <div style={{ marginTop: 8 }}><button onClick={() => { ecrireTransfert({ consigne, Kp, Qmax, Qp }); naviguer(5); }} style={stylePetitBouton(true, '#2563eb')}>⏱ Voir la régulation dans le temps</button></div>}</>,
      tache: null },
    { id: 'limite', titre: 'La limite du régulateur P', focus: [],
      texte: <>Un régulateur P seul ne peut pas supprimer l'écart statique, tant que le puisage n'est pas nul.</>,
      tache: { type: 'qcm', q: 'Que faut-il ajouter pour annuler cet écart en régime permanent ?', options: ['Une action intégrale (régulateur PI)', 'Une pompe plus puissante', 'Rien : c’est impossible'], bonne: 0,
        expl: 'L’action intégrale continue d’augmenter la commande tant que l’écart n’est pas nul : on la rencontre avec le régulateur PI.' } },
    { id: 'hypotheses', titre: 'Sur quoi repose ce modèle ?', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse est faite sur le débit de puisage ?', options: ['Il est imposé par les abonnés, indépendant de la hauteur d’eau', 'Il dépend de la hauteur d’eau (loi de Torricelli)', 'Il est réglé par le régulateur'], bonne: 0,
        expl: 'Le niveau d’équilibre vient donc de la seule pompe : c’est elle qui doit compenser le puisage.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez construire un point de fonctionnement, en déduire le niveau d'équilibre et l'écart statique, et expliquer l'effet de K<sub>p</sub> et du puisage. En exploration libre,
        changez les réglages, puis comparez avec « Régulation TOR, P et PI ».</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vu = id => !enGuide || etape >= idx(id);
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    let d;
    do { d = { c: tire([32, 33, 34, 35]), Kp: tire([10, 20, 40, 80]), Qp: tire([20, 30, 45, 60]) }; } while (d.c - d.Qp / d.Kp < H_FOND + 0.5);
    setDefi({ ...d, reps: {}, verifie: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') { setConsigne(33); setKp(20); setQmax(100); setQp(45); }
  }
  const voletDefi = defi && (() => {
    const e = equilibre({ consigne: defi.c, Kp: defi.Kp, Qmax: 100, Qp: defi.Qp });
    const Q = [
      { id: 'y', q: 'Commande Y nécessaire à l’équilibre', unite: '%', vrai: e.Y, tol: 0.01, aff: fmt(e.Y, 1) },
      { id: 'xp', q: 'Bande proportionnelle X_p', unite: 'm', vrai: e.Xp, tol: 0.01, aff: fmt(e.Xp, 2) },
      { id: 'es', q: 'Écart statique ES', unite: 'm', vrai: e.ES, tol: 0.03, aff: fmt(e.ES, 2) },
      { id: 'h', q: 'Hauteur d’eau H au point de fonctionnement', unite: 'm', vrai: e.H, tol: 0.003, aff: fmt(e.H, 2) },
      { id: 'kp', q: 'Valeur minimale de K_p pour que l’écart statique soit au plus de 0,5 m (même puisage)', unite: '%/m', vrai: e.Y / 0.5, tol: 0.02, aff: fmt(e.Y / 0.5, 0) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          Le château d'eau est régulé en P : consigne <strong>{defi.c} m</strong>, gain <strong>K<sub>p</sub> = {defi.Kp} %/m</strong>, pompe de <strong>100 m³/h</strong> au maximum, débit de puisage <strong>{defi.Qp} m³/h</strong>.
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappels : Q<sub>pompe</sub> = Q<sub>puisage</sub> à l'équilibre ; Q<sub>pompe</sub> = Q<sub>max</sub> × Y / 100 ; Y = K<sub>p</sub> × (consigne − H).</div>
          <button onClick={() => { setConsigne(defi.c); setKp(defi.Kp); setQmax(100); setQp(defi.Qp); setMode('explore'); }} style={{ ...stylePetitBouton(false, '#334155'), marginTop: 6 }}>🔍 Régler l’exploration sur ces valeurs</button>
        </div>
        {Q.map((q, k) => {
          const rep = defi.reps[q.id] || '', ok = proche(lireNombre(rep), q.vrai, q.tol);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.aff} {q.unite}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
        </div>
      </div>
    );
  })();

  // ════════════════ BLOCS ════════════════
  const maquette = (
    <div style={{ ...styleBoite, ...cadre('graph') }}>
      <div className="pf-schema">
        <div style={cadre('reservoir')}><SchemaChateau regul="p" consigne={consigne} H={eq.H} Y={Yschema} hl={hl}/></div>
        <div>
          <GraphePF c={consigne} Kp={Kp} Qmax={Qmax} Qp={Qp} eq={eq} showPuisage={vu('equilibre')} showRegul={vu('regulateur')} showPoint={vu('point')} showXp={vu('xp')}/>
          {eq.cas === 'vide' && vu('point') && <div style={{ marginTop: 6, fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '5px 8px', lineHeight: 1.5 }}>
            ⚠ Les deux courbes se coupent sous le fond du réservoir (H = {fmt(eq.Hth, 1)} m) : <strong>il n'y a pas de point de fonctionnement dans le réservoir, qui se vide</strong>. À H = 30 m, le régulateur ne
            demande que {fmt(eq.QpMax, 0)} m³/h, moins que le puisage ({fmt(Qp, 0)} m³/h). Il faut augmenter K<sub>p</sub> ou diminuer le puisage.</div>}
          {eq.cas === 'sature' && vu('point') && <div style={{ marginTop: 6, fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '5px 8px', lineHeight: 1.5 }}>
            ⚠ Le débit de puisage ({fmt(Qp, 0)} m³/h) atteint ou dépasse le débit maximal de la pompe ({fmt(Qmax, 0)} m³/h) : <strong>aucun équilibre n'est possible</strong>, le réservoir se vide.</div>}
        </div>
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
        {enGuide ? <>L'élément encadré en orange est celui dont parle l'étape en cours.</> : <>Le schéma montre le château d'eau à l'équilibre. La bande bleue du graphique représente le réservoir (de 30 à 36 m).</>}
      </div>
    </div>
  );
  const commandes = (
    <>
      {!enGuide && <Curseur nom="Consigne" valeur={consigne} onChange={setConsigne} min={30} max={36} pas={0.5} unite="m" decimales={1} couleur={COUL.consigne}/>}
      {vu('regulateur') && <Curseur nom="Gain proportionnel Kp" valeur={Kp} onChange={setKp} min={2} max={200} pas={1} unite="%/m" couleur="#7c3aed"/>}
      {vu('equilibre') && <Curseur nom="Débit de puisage" valeur={Qp} onChange={setQp} min={0} max={95} pas={1} unite="m³/h" couleur={COUL.puisage}/>}
      {!enGuide && <Curseur nom="Débit maximal de la pompe" valeur={Qmax} onChange={setQmax} min={50} max={200} pas={5} unite="m³/h" couleur={COUL.pompe}/>}
      {enGuide && !vu('regulateur') && <div style={{ fontSize: 13, color: KIT.txt2 }}>Les réglages apparaîtront au fil du parcours.</div>}
    </>
  );
  const mesures = (
    <>
      {(!enGuide || etape > idx('commande')) && <LigneMesure nom="Commande nécessaire Y" valeur={`${fmt(eq.Y, 1)} %`} couleur={COUL.pompe}/>}
      {(!enGuide || etape > idx('xp')) && <LigneMesure nom="Bande proportionnelle X_p = 100 / K_p" valeur={`${fmt(eq.Xp, 2)} m`} couleur="#7c3aed"/>}
      {eq.cas === 'ok' && (!enGuide || etape > idx('point')) && <>
        <LigneMesure nom="Hauteur d'eau à l'équilibre H" valeur={`${fmt(eq.H, 2)} m`} couleur={COUL.eau}/>
        {(!enGuide || etape > idx('es')) && <LigneMesure nom="Écart statique ES = consigne − H" valeur={`${fmt(eq.ES, 2)} m`} couleur={COUL.consigne}/>}
      </>}
      {eq.cas !== 'ok' && (!enGuide || etape > idx('point')) && <LigneMesure nom="Hauteur d'eau à l'équilibre H" valeur="aucune : le réservoir se vide" couleur="#b91c1c"/>}
      {(!enGuide || etape > idx('fond')) && <><LigneMesure nom="Puisage maximal compensable" valeur={`${fmt(eq.QpMax, 0)} m³/h`} couleur={COUL.puisage}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Puisage maximal compensable : au fond du réservoir (30 m), le régulateur commande Y = K<sub>p</sub> × (consigne − 30), limité à 100 % ; au-delà de ce débit, le réservoir se vide.</div></>}
      {!enGuide && naviguer && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => { ecrireTransfert({ consigne, Kp, Qmax, Qp }); naviguer(5); }} style={stylePetitBouton(true, '#2563eb')}>⏱ Voir la régulation dans le temps</button>
        </div>
      )}
    </>
  );
  const boucle = (
    <div style={{ ...styleBoite, ...cadre('boucle') }}>
      <Section titre="Boucle de régulation" ouvert={ouverts.boucle} onBascule={() => setOuverts(o => ({ ...o, boucle: !o.boucle }))}>
          <svg viewBox="0 0 500 180" role="img" aria-label="Boucle de régulation" style={{width:"100%", maxWidth: 760, margin: "0 auto", display:"block"}}>

           {/* Silhouette opérateur — déplacée à côté de Y(%) */}
            <g transform="translate(5, 55) scale(0.028)">
              <g transform="translate(0,1280) scale(0.1,-0.1)" fill="#1a6eb5" stroke="none">
                <path d="M3027 12784 c-290 -52 -544 -220 -705 -463 -134 -204 -189 -425 -170
                -681 30 -386 296 -743 659 -886 143 -56 212 -68 389 -69 168 0 209 6 340 47
                263 83 515 309 630 562 124 273 129 581 13 856 -73 174 -231 368 -378 465
                -233 154 -520 216 -778 169z"/>
                <path d="M1920 10435 c-8 -2 -49 -9 -90 -15 -106 -17 -265 -71 -371 -126 -394
                -204 -653 -566 -731 -1024 -10 -59 -13 -445 -13 -1815 l0 -1740 22 -71 c71
                -223 311 -355 546 -300 161 38 267 129 328 281 l24 60 3 1553 2 1552 110 0
                110 0 2 -4152 3 -4153 21 -61 c59 -169 154 -284 295 -353 190 -93 392 -93 586
                0 152 73 269 220 314 394 10 40 14 536 16 2472 l3 2423 105 0 105 0 0 -2407
                c0 -2080 2 -2418 15 -2478 61 -293 341 -494 655 -471 260 18 457 165 538 401
                l27 80 3 4153 2 4153 108 -3 107 -3 5 -1555 c4 -1101 8 -1564 16 -1585 75
                -204 232 -315 447 -315 234 0 413 158 447 395 8 58 10 541 8 1770 -3 1588 -5
                1696 -22 1785 -110 572 -500 992 -1046 1128 l-105 26 -1290 2 c-709 1 -1297 1
                -1305 -1z"/>
              </g>
            </g>

            {/* Signal commande Y — à droite de la silhouette */}
            <text x="42" y="62" fontSize="11" fill="#1a6eb5" fontWeight="bold">signal de</text>
            <text x="42" y="75" fontSize="11" fill="#1a6eb5" fontWeight="bold">commande</text>
            <text x="42" y="88" fontSize="11" fill="#1a6eb5" fontWeight="bold">Y (%)</text>
            {/* Flèche Y vers actionneur */}
            <line x1="90" y1="90" x2="130" y2="90" stroke="#1a6eb5" strokeWidth="1.5" markerEnd="url(#arr6)"/>

            {/* Actionneur */}
            <rect x="130" y="72" width="90" height="36" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
            <text x="175" y="88" textAnchor="middle" fontSize="12" fill="#333">Actionneur</text>
            <text x="175" y="102" textAnchor="middle" fontSize="10" fill="#555">(pompe)</text>

            {/* Grandeur réglante Q — décalée vers le haut */}
            <text x="228" y="58" fontSize="10" fill="#1a6eb5">grandeur</text>
            <text x="228" y="70" fontSize="10" fill="#1a6eb5">réglante</text>
            <text x="228" y="82" fontSize="10" fill="#1a6eb5">Q (m³/h)</text>
            {/* Fil actionneur → système, s'arrête au bord du cadre */}
            <line x1="220" y1="90" x2="270" y2="90" stroke="#333" strokeWidth="1.5" markerEnd="url(#arr6)"/>

            {/* Débit de puisage Qp */}
            <text x="320" y="18" textAnchor="middle" fontSize="10" fill="#333">Débit de</text>
            <text x="320" y="30" textAnchor="middle" fontSize="10" fill="#333">puisage Qp</text>
            <line x1="320" y1="32" x2="320" y2="72" stroke="#333" strokeWidth="1.5" markerEnd="url(#arr6)"/>

            {/* Système à régler */}
            <rect x="270" y="72" width="100" height="36" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
            <text x="320" y="88" textAnchor="middle" fontSize="12" fill="#333">Système à</text>
            <text x="320" y="102" textAnchor="middle" fontSize="10" fill="#555">régler</text>

            {/* Grandeur réglée H — fil s'arrête au bord droit du système */}
            <line x1="370" y1="90" x2="435" y2="90" stroke="#333" strokeWidth="1.5"/>
            <text x="438" y="80" fontSize="11" fill="#e63946" fontWeight="bold">grandeur</text>
            <text x="438" y="92" fontSize="11" fill="#e63946" fontWeight="bold">réglée</text>
            <text x="438" y="104" fontSize="11" fill="#e63946" fontWeight="bold">H (m)</text>

            {/* Retour — fil descend de 90 à 145, puis va jusqu'au bord droit du capteur */}
            <line x1="400" y1="90" x2="400" y2="145" stroke="#333" strokeWidth="1.5"/>
            <line x1="400" y1="145" x2="220" y2="145" stroke="#333" strokeWidth="1.5"/>

            {/* Capteur */}
            <rect x="130" y="127" width="90" height="36" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
            <text x="175" y="143" textAnchor="middle" fontSize="11" fill="#333">Capteur</text>
            <text x="175" y="157" textAnchor="middle" fontSize="10" fill="#555">(niveau)</text>

            {/* Fil capteur → signal mesure avec flèche à gauche */}
            <line x1="130" y1="145" x2="42" y2="145" stroke="#333" strokeWidth="1.5" markerStart="url(#arr6left)"/>

            {/* Signal mesure X */}
            <text x="42" y="125" fontSize="11" fill="#e63946" fontWeight="bold">signal de</text>
            <text x="42" y="138" fontSize="11" fill="#e63946" fontWeight="bold">mesure X (%)</text>

            <defs>
              <marker id="arr6" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#333" strokeWidth="1.5"/>
              </marker>
              <marker id="arr6left" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M8 1L2 5L8 9" fill="none" stroke="#333" strokeWidth="1.5"/>
              </marker>
            </defs>
          </svg>
      </Section>
    </div>
  );
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={ouverts.hypo} onBascule={() => setOuverts(o => ({ ...o, hypo: !o.hypo }))}><Hypotheses/></Section>
    </div>
  );
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2.3fr) minmax(290px, 1fr); }
        .pf-schema { display: grid; gap: 10px; grid-template-columns: minmax(165px, 210px) minmax(0, 1fr); align-items: start; }
        .pf-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .pf-l1 { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 560px) { .pf-schema { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Point de fonctionnement d'une régulation P</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className="pf-l1">
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : maquette}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div><Hypotheses/></div>
            : <div style={styleBoite}>
              <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
                <li>Augmentez K<sub>p</sub> : que devient l'écart statique ?</li>
                <li>Augmentez le débit de puisage : où se déplace le point de fonctionnement ?</li>
                <li>Cherchez le débit de puisage à partir duquel le réservoir se vide.</li>
                <li>Passez dans « Régulation TOR, P et PI » avec les mêmes réglages : le niveau final est-il celui du point de fonctionnement ?</li>
                <li>Y a-t-il des oscillations ? Pas ici : on ne regarde que l'équilibre. Elles n'apparaissent que dans « Régulation TOR, P et PI », avec un retard de mesure.</li>
              </ul>
            </div>}
      </div>
      {mode !== 'defi' && (
        <div className="pf-l2">
          <Section titre="Commandes" ouvert={ouverts.commandes} onBascule={() => setOuverts(o => ({ ...o, commandes: !o.commandes }))}>{commandes}</Section>
          <Section titre="Mesures" ouvert={ouverts.mesures} onBascule={() => setOuverts(o => ({ ...o, mesures: !o.mesures }))}>{mesures}</Section>
        </div>
      )}
      {mode !== 'defi' && <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>{boucle}{panneauHypo}</div>}
    </div>
  );
}
