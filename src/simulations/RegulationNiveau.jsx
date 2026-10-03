import { useState, useEffect, useMemo, useRef } from "react";
import { cardStyle, fmt, CarteParcours, Cadre, useEtatPersistant, KIT, styleBouton, stylePetitBouton,
  styleBoite, Section, LigneMesure, Curseur, BoutonsModes, lireNombre, proche, sci, avecIndices } from "../commun";

// ====================================================
// RÉGULATION DU NIVEAU D'UN CHÂTEAU D'EAU — TOR, P, PI (Terminale STL)
// Modèle : S · dH/dt = Q_pompe − Q_puisage, réservoir entre 30 m (fond) et 36 m (trop-plein).
// Section S = 720 m², calée sur le graphique du programme Python de l'activité « TOR château d'eau ».
// ====================================================

const S = 720;                  // m², section du réservoir
const H_FOND = 30, H_TROP = 36; // m, fond et trop-plein du réservoir
const H0 = 33;                  // m, hauteur initiale
const DT = 0.05;                // h, pas de calcul
const CONSO = 150;              // L par jour et par habitant (notre-environnement.gouv.fr, 2020)

// Profil de consommation sur une journée (moyenne 1) : creux la nuit, pics le matin et le soir
const PROFIL_JOUR = (() => {
  const brut = Array.from({ length: 24 }, (_, h) =>
    0.35 + 1.1 * Math.exp(-((h - 8) ** 2) / 3) + 0.9 * Math.exp(-((h - 20) ** 2) / 3) + (h >= 9 && h <= 18 ? 0.55 : 0));
  const m = brut.reduce((a, b) => a + b, 0) / 24;
  return brut.map(x => x / m);
})();
function debitPuisage(t, Qp, profil) {
  if (profil === 'journee') {
    const h = t % 24, i = Math.floor(h), f = h - i;
    return Qp * (PROFIL_JOUR[i] * (1 - f) + PROFIL_JOUR[(i + 1) % 24] * f);
  }
  if (profil === 'incendie') return Qp + (t >= 200 && t < 206 ? 120 : 0);
  return Qp;
}

// Simulation complète sur la durée choisie
function simuler(p) {
  const { mode, hBas, hHaut, consigne, Kp, Ti, Qmax, Qp, profil, retard, duree } = p;
  const n = Math.round(duree / DT), nRet = Math.round(retard / DT);
  let H = H0, Y = 0, integ = 0, perdu = 0, penurie = 0, demarrages = 0, marche = 0, yPrec = 0;
  const histH = [], pts = [];
  for (let k = 0; k <= n; k++) {
    const t = k * DT;
    histH.push(H);
    const Hmes = histH[Math.max(0, histH.length - 1 - nRet)];
    // Régulateur
    if (mode === 'tor') {
      // « ≥ » et « ≤ » plutôt que « > » et « < » : le niveau ne peut pas dépasser le trop-plein (36 m) ni descendre sous le fond
      // (30 m) ; avec des seuils réglés exactement sur ces valeurs, une comparaison stricte ne basculerait jamais.
      if (Hmes >= hHaut) Y = 0; else if (Hmes <= hBas) Y = 100;
    } else {
      const e = consigne - Hmes;
      const Yc = Kp * e + (mode === 'pi' ? (Kp / Ti) * integ : 0);
      // Anti-emballement : on cesse d'intégrer quand la commande est en butée et que l'écart l'y pousse encore
      if (mode === 'pi' && !((Yc >= 100 && e > 0) || (Yc <= 0 && e < 0))) integ += e * DT;
      Y = Math.min(100, Math.max(0, Yc));
    }
    if (Y > 0 && yPrec === 0) demarrages++;
    yPrec = Y;
    const Qpompe = Qmax * Y / 100;
    const Qdem = debitPuisage(t, Qp, profil);
    if (k % 10 === 0) pts.push({ t, H, Qpompe, Qp: Qdem, Y });
    marche += (Y / 100) * DT;
    // Bilan de matière sur le réservoir
    let Hn = H + (Qpompe - Qdem) * DT / S;
    if (Hn > H_TROP) { perdu += (Hn - H_TROP) * S; Hn = H_TROP; }
    if (Hn < H_FOND) { penurie += DT; Hn = H_FOND; }
    H = Hn;
  }
  // Régime établi en TOR : cycles complets entre deux démarrages
  const fronts = [];
  for (let i = 1; i < pts.length; i++) if (pts[i].Y > 0 && pts[i - 1].Y === 0) fronts.push(i);
  let utilisation = null, periode = null;
  if (fronts.length >= 2) {
    const a = fronts[0], b = fronts[fronts.length - 1];
    let on = 0;
    for (let i = a; i < b; i++) on += pts[i].Y / 100;
    utilisation = on / (b - a);
    periode = (pts[b].t - pts[a].t) / (fronts.length - 1);
  }
  const fin = pts.filter(q => q.t >= duree - 24);
  const Hfin = fin.reduce((s, q) => s + q.H, 0) / Math.max(1, fin.length);
  const apres = pts.filter(q => q.t >= 72);
  const ecartMax = apres.length ? Math.max(...apres.map(q => Math.abs(q.H - consigne))) : null;
  return { pts, perdu, penurie, demarrages, utilisation, periode, Hfin, ecartMax };
}

// Seuils d'alerte : on ignore les dépassements infimes dus au pas de calcul quand un seuil est réglé pile sur 30 ou 36 m
const COUL = { eau: '#2563eb', pompe: '#16a34a', puisage: '#dc2626', consigne: '#ea580c', seuil: '#7c3aed' };

export function Simulation5() {
  const [mode, setMode] = useState('guide');                // guide | explore | defi
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true });
  const [regul, setRegul] = useState('tor');                // tor | p | pi
  const [hBas, setHBas] = useState(31);
  const [hHaut, setHHaut] = useState(33);
  const [consigne, setConsigne] = useState(33);
  const [Kp, setKp] = useState(20);
  const [Ti, setTi] = useState(50);
  const [Qmax, setQmax] = useState(100);
  const [Qp, setQp] = useState(20);
  const [profil, setProfil] = useState('constant');
  const [retard, setRetard] = useState(0);
  const [duree, setDuree] = useState(1000);
  const [tCur, setTCur] = useState(null);                   // instant affiché sur le schéma (null = fin)
  const [lecture, setLecture] = useState(false);
  const [survol, setSurvol] = useState(null);
  const [guide, setGuide] = useEtatPersistant('reg-niveau-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide';
  const sim = useMemo(() => simuler({ mode: regul, hBas, hHaut, consigne, Kp, Ti, Qmax, Qp, profil, retard, duree }),
    [regul, hBas, hHaut, consigne, Kp, Ti, Qmax, Qp, profil, retard, duree]);
  const tAff = tCur == null ? duree : Math.min(tCur, duree);
  const ptCur = sim.pts[Math.min(sim.pts.length - 1, Math.round(tAff / (DT * 10)))];

  // Lecture animée : le schéma suit la simulation dans le temps (20 s pour toute la durée)
  const refDuree = useRef(duree); refDuree.current = duree;
  useEffect(() => {
    if (!lecture) return;
    let prec = performance.now(), id;
    const pas = now => {
      const dt = (now - prec) / 1000; prec = now;
      let fini = false;
      setTCur(t => {
        const n = (t == null ? 0 : t) + dt * refDuree.current / 20;
        if (n >= refDuree.current) { fini = true; return refDuree.current; }
        return n;
      });
      if (fini) setLecture(false); else id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [lecture]);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const vu = k => !enGuide || etape >= k;
  const rev = { seuils: vu(7), puisage: vu(12), regul: vu(16), kp: vu(16), ti: vu(20), mesuresTor: vu(15) };
  const seuilsOk = Math.abs(hBas - 30) < 0.05 && Math.abs(hHaut - 36) < 0.05;
  const qp45 = Math.abs(Qp - 45) < 0.5 || Math.abs(Qp - 44) < 0.5;
  const enP = regul === 'p', enPI = regul === 'pi';
  const codeTOR = (
    <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, overflowX: 'auto', margin: '6px 0' }}>{
`Qv_pompe_new = (
    A if H > B else
    C if H < D else
    Qv_pompe )`}</pre>
  );
  const ETAPES = [
    { titre: 'Le château d’eau', focus: ['reservoir', 'pompe', 'maison'],
      texte: <>Un château d'eau stocke l'eau potable en hauteur pour la distribuer sous pression. Une <strong>pompe</strong> (B) monte
        l'eau jusqu'au <strong>réservoir</strong> (A) ; l'eau redescend ensuite par gravité vers les habitations, où les abonnés
        ouvrent leurs <strong>robinets</strong> (C). Le réservoir sert de <strong>tampon</strong> entre le débit demandé par les abonnés
        (débit de puisage Q<sub>v,puisage</sub>) et le débit fourni par la pompe (Q<sub>v,pompe</sub>) : il évite de démarrer la
        pompe trop souvent, et garde une réserve en cas d'incendie.</>, tache: null },
    { titre: 'La boucle de régulation (1/3)', focus: ['reservoir'],
      texte: <>On veut contrôler la hauteur d'eau dans le réservoir. Un capteur la mesure ; le régulateur commande la pompe.</>,
      tache: { type: 'qcm', q: 'Quelle est la grandeur réglée ?', options: ['La hauteur d’eau H du réservoir', 'Le débit de la pompe', 'Le débit de puisage'], bonne: 0,
        expl: 'C’est la grandeur que l’on veut maintenir : la hauteur d’eau.' } },
    { titre: 'La boucle de régulation (2/3)', focus: ['pompe'],
      texte: <>Pour agir sur la hauteur d'eau, le régulateur dispose d'un seul moyen.</>,
      tache: { type: 'qcm', q: 'Quelle est la grandeur réglante ?', options: ['La hauteur d’eau H du réservoir', 'Le débit de la pompe', 'Le débit de puisage'], bonne: 1,
        expl: 'Le régulateur agit sur la pompe : c’est son débit qui permet de corriger la hauteur.' } },
    { titre: 'La boucle de régulation (3/3)', focus: ['maison'],
      texte: <>Les abonnés ouvrent et ferment leurs robinets quand ils le veulent.</>,
      tache: { type: 'qcm', q: 'Quelle est la grandeur perturbatrice ?', options: ['La hauteur d’eau H du réservoir', 'Le débit de la pompe', 'Le débit de puisage'], bonne: 2,
        expl: 'Le débit de puisage fait varier la hauteur sans que le régulateur le décide.' } },
    { titre: 'La régulation tout-ou-rien', focus: ['pompe'],
      texte: <>Le haut du réservoir est à <strong>36 m</strong> du sol, le bas à <strong>30 m</strong>. La pompe est régulée en
        <strong> tout-ou-rien</strong> (TOR) : si l'eau atteint le haut du réservoir, on arrête la pompe ; si elle atteint le bas, on la démarre.</>,
      tache: { type: 'qcm', q: 'En TOR, quelles valeurs peut prendre la commande de l’actionneur ?', options: ['Deux valeurs : 0 % et 100 %', 'Toutes les valeurs entre 0 % et 100 %'], bonne: 0 } },
    { titre: 'Les seuils (1/2)', focus: ['reservoir'],
      texte: <>La régulation TOR utilise deux seuils de hauteur.</>,
      tache: { type: 'num', q: 'Hauteur du seuil haut, à ne pas dépasser', unite: 'm', vrai: 36, tol: 0.01,
        pieges: [[30, 'Ça, c’est le seuil bas.'], [6, 'On demande la hauteur par rapport au sol, pas la hauteur d’eau dans le réservoir.']] } },
    { titre: 'Les seuils (2/2)', focus: ['reservoir'],
      texte: <>Et le niveau ne doit pas descendre sous le fond du réservoir.</>,
      tache: { type: 'num', q: 'Hauteur du seuil bas', unite: 'm', vrai: 30, tol: 0.01, pieges: [[36, 'Ça, c’est le seuil haut.']] } },
    { titre: 'Régler la simulation', focus: ['reservoir'],
      texte: <>Les réglages des seuils sont apparus sous le schéma. Au départ, ils sont réglés sur 31 et 33 m : le réservoir n'est pas
        bien utilisé. Réglez le seuil bas sur <strong>30 m</strong> et le seuil haut sur <strong>36 m</strong>, et regardez les courbes changer.</>,
      tache: { type: 'action', ok: seuilsOk, consigne: `Seuil bas : ${fmt(hBas, 1)} m ${Math.abs(hBas - 30) < 0.05 ? '✅' : '⬜'}   Seuil haut : ${fmt(hHaut, 1)} m ${Math.abs(hHaut - 36) < 0.05 ? '✅' : '⬜'}` } },
    { titre: 'Le débit de la pompe', focus: ['pompe'],
      texte: <>Lisez la courbe verte du débit de la pompe (en bas) : quand la pompe tourne, elle fonctionne à son débit maximal.</>,
      tache: { type: 'num', q: <>Débit maximal de la pompe Q<sub>v,pompe,MAX</sub></>, unite: 'm³/h', vrai: Qmax, tol: 0.02 } },
    { titre: 'Le programme de régulation', focus: [],
      texte: <>Dans le programme Python de la régulation, le débit de la pompe à l'instant suivant s'écrit :{codeTOR}
        Autrement dit : le débit vaut A si H &gt; B, C si H &lt; D, et sinon il ne change pas.</>,
      tache: { type: 'qcm', q: 'Quelle est la bonne façon de compléter A, B, C et D ?',
        options: ['A = Qv_pompe_MIN ; B = H_seuil_haut ; C = Qv_pompe_MAX ; D = H_seuil_bas',
          'A = Qv_pompe_MAX ; B = H_seuil_haut ; C = Qv_pompe_MIN ; D = H_seuil_bas',
          'A = Qv_pompe_MIN ; B = H_seuil_bas ; C = Qv_pompe_MAX ; D = H_seuil_haut'], bonne: 0,
        expl: 'Au-dessus du seuil haut on arrête la pompe, sous le seuil bas on la démarre, et entre les deux on garde l’état précédent : c’est ce qui crée les cycles.' } },
    { titre: 'La consommation d’une ville', focus: ['maison'],
      texte: <>En 2020, en France, la consommation d'eau potable était de l'ordre de <strong>150 L par jour et par personne</strong>
        (notre-environnement.gouv.fr). Le château d'eau alimente une ville de <strong>7200 habitants</strong>.</>,
      tache: { type: 'num', q: 'Consommation de la ville par jour', unite: 'm³', vrai: 7200 * 0.15, tol: 0.01,
        pieges: [[7200 * 150, 'Convertissez en m³ : 1 m³ = 1000 L.']] } },
    { titre: 'Le débit de puisage', focus: ['maison'],
      texte: <>On suppose que la consommation est la même à toute heure de la journée.</>,
      tache: { type: 'num', q: <>Débit de puisage Q<sub>v,puisage</sub></>, unite: 'm³/h', vrai: 45, tol: 0.01,
        pieges: [[1080 * 24, 'Il y a 24 heures dans une journée : on divise.']] } },
    { titre: 'Régler le puisage', focus: ['maison'],
      texte: <>Le réglage du débit de puisage est apparu. Réglez-le sur la valeur que vous venez de calculer.</>,
      tache: { type: 'action', ok: qp45 && seuilsOk, consigne: `Débit de puisage : ${fmt(Qp, 0)} m³/h${seuilsOk ? '' : ' (vérifiez aussi les seuils : 30 et 36 m)'}` } },
    { titre: 'Le taux d’utilisation de la pompe', focus: ['pompe'],
      texte: <>Sur un cycle, la pompe tourne pendant une durée t<sub>marche</sub>, puis reste arrêtée. Le taux d'utilisation vaut
        t<sub>marche</sub> / durée d'un cycle. Survolez les courbes pour lire les instants précis.</>,
      tache: { type: 'num', q: 'Taux d’utilisation de la pompe sur un cycle (à 1 % près)', unite: '%', vrai: (sim.utilisation || 0.45) * 100, tol: 0.05,
        aide: 'Repérez deux démarrages successifs de la pompe, et la durée pendant laquelle elle tourne entre les deux.' } },
    { titre: 'Pourquoi cette valeur ?', focus: ['pompe', 'maison'],
      texte: <>Comparez le taux d'utilisation au rapport Q<sub>v,puisage</sub> / Q<sub>v,pompe,MAX</sub> = 45 / 100.</>,
      tache: { type: 'qcm', q: 'Le taux d’utilisation est égal à ce rapport. Pourquoi ?',
        options: ['Sur un cycle complet, le volume pompé est égal au volume puisé', 'C’est une coïncidence', 'Parce que les seuils sont à 30 et 36 m'], bonne: 0,
        expl: 'Au bout d’un cycle, le niveau revient au même point : la pompe a fourni exactement ce que la ville a consommé. Le taux ne dépend donc pas des seuils.' } },
    { titre: 'Rapprocher les seuils ?', focus: ['reservoir'],
      texte: <>Les mesures (nombre de démarrages, durée d'un cycle) sont apparues sous le schéma. Essayez des seuils plus proches, par
        exemple 32 et 34 m, puis revenez à 30 et 36 m.</>,
      tache: { type: 'qcm', q: 'Si l’on rapproche les seuils…', options: ['la pompe démarre plus souvent, et s’use plus vite', 'la pompe tourne plus longtemps au total', 'le niveau devient instable'], bonne: 0,
        expl: 'Les cycles sont plus courts, mais le taux d’utilisation reste le même. Le réservoir joue moins bien son rôle de tampon.' } },
    { titre: 'La régulation proportionnelle', focus: ['pompe'],
      texte: <>Avec une pompe à vitesse variable, on peut faire mieux que tout-ou-rien. En régulation <strong>proportionnelle</strong> (P),
        la commande est proportionnelle à l'écart entre la consigne et la mesure : Y = K<sub>p</sub> × (consigne − H). Les réglages
        sont apparus : passez en mode <strong>P</strong>, avec une consigne de 33 m et K<sub>p</sub> = 20 %/m.</>,
      tache: { type: 'qcm', q: 'Où le niveau se stabilise-t-il ?', options: ['Exactement à la consigne', 'Un peu en dessous de la consigne', 'Il ne se stabilise jamais'], bonne: 1,
        bloque: !enP ? 'Passez d’abord en régulation P.' : null,
        expl: 'C’est l’écart statique, typique de la régulation proportionnelle.' } },
    { titre: 'L’écart statique (1/2)', focus: ['pompe'],
      texte: <>Quand le niveau est stable, le débit de la pompe compense exactement le débit de puisage ({fmt(Qp, 0)} m³/h, sur une
        pompe de {fmt(Qmax, 0)} m³/h au maximum).</>,
      tache: { type: 'num', q: 'Valeur de la commande Y une fois le niveau stabilisé', unite: '%', vrai: Qp / Qmax * 100, tol: 0.02 } },
    { titre: 'L’écart statique (2/2)', focus: ['reservoir'],
      texte: <>On a Y = K<sub>p</sub> × (consigne − H), avec K<sub>p</sub> = {fmt(Kp, 0)} %/m.</>,
      tache: { type: 'num', q: 'Écart statique : consigne − H', unite: 'm', vrai: (Qp / Qmax * 100) / Kp, tol: 0.03,
        bloque: !enP ? 'Restez en régulation P.' : null,
        pieges: [[(Qp / Qmax * 100) * Kp, 'C’est Y divisé par Kp.']] } },
    { titre: 'Augmenter le gain', focus: ['reservoir'],
      texte: <>Augmentez K<sub>p</sub>, par exemple à 80 %/m, et observez le niveau.</>,
      tache: { type: 'qcm', q: 'Quand Kp augmente, l’écart statique…', options: ['diminue', 'augmente', 'ne change pas'], bonne: 0,
        expl: 'Mais il ne s’annule jamais. Et dans un vrai système, avec des retards de mesure, un gain trop fort fait osciller le niveau (essayez le retard en exploration libre).' } },
    { titre: 'La régulation proportionnelle-intégrale', focus: ['pompe'],
      texte: <>Le régulateur <strong>PI</strong> ajoute une action intégrale : tant qu'il reste un écart, la commande continue d'évoluer.
        Le réglage du temps intégral est apparu : passez en mode <strong>PI</strong> (K<sub>p</sub> = 20 %/m, T<sub>i</sub> = 50 h).</>,
      tache: { type: 'qcm', q: 'Que devient l’écart statique ?', options: ['Il disparaît : le niveau rejoint la consigne', 'Il double', 'Il ne change pas'], bonne: 0,
        bloque: !enPI ? 'Passez d’abord en régulation PI.' : Math.abs(Kp - 20) > 0.5 ? 'Remettez Kp sur 20 %/m.' : null } },
    { titre: 'Le réglage du temps intégral', focus: ['reservoir'],
      texte: <>Gardez K<sub>p</sub> = 20 %/m. Diminuez T<sub>i</sub>, par exemple à 5 h, puis augmentez-le à 200 h.</>,
      tache: { type: 'qcm', q: 'Avec un Ti trop petit…', options: ['le niveau oscille et dépasse la consigne', 'le niveau ne bouge plus', 'l’écart statique revient'], bonne: 0,
        bloque: !enPI ? 'Restez en régulation PI.' : Math.abs(Kp - 20) > 0.5 ? 'Remettez Kp sur 20 %/m.' : null,
        expl: 'Une action intégrale trop forte fait osciller ; trop faible, elle met longtemps à corriger. Régler un PI, c’est trouver le compromis.' } },
    { titre: 'Bilan', focus: [],
      texte: <>Le TOR est simple et robuste, mais la pompe fonctionne par cycles. Le P donne une commande progressive, avec un écart
        statique. Le PI supprime cet écart, mais doit être bien réglé pour ne pas osciller.</>,
      tache: { type: 'qcm', q: 'Pour une pompe qui ne peut être qu’en marche ou à l’arrêt, quelle régulation utiliser ?', options: ['TOR', 'P', 'PI'], bonne: 0,
        expl: 'Les régulations P et PI demandent un actionneur capable de prendre toutes les valeurs entre 0 et 100 % (pompe à vitesse variable).' } },
    { titre: 'Bravo !', focus: [],
      texte: <>Vous savez identifier les grandeurs d'une boucle de régulation, et comparer les régulations TOR, P et PI. Explorez
        librement (consommation variable sur la journée, incendie, retard de mesure…) ou relevez le défi.</>, tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);

  // ════════════════ SCHÉMA DU CHÂTEAU D'EAU ════════════════
  const yH = h => 300 - (h - 26) * 22;            // 26 m → 300 px ; 38 m → 36 px
  const Hc = ptCur ? ptCur.H : H0, Yc = ptCur ? ptCur.Y : 0;
  const schema = (
    <svg viewBox="0 0 232 400" role="img" aria-label="Château d'eau, pompe et habitations" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[28, 30, 32, 34, 36, 38].map(h => (
        <g key={h}><line x1="30" y1={yH(h)} x2="36" y2={yH(h)} stroke={KIT.txt2}/><text x="26" y={yH(h) + 4} fontSize="13.5" fill={KIT.txt2} textAnchor="end">{h}</text></g>
      ))}
      <text x="4" y="24" fontSize="13.5" fill={KIT.txt2}>h (m)</text>
      {/* réservoir */}
      <rect x="58" y={yH(H_TROP)} width="100" height={yH(H_FOND) - yH(H_TROP)} fill="#f1f5f9" stroke={KIT.txt} strokeWidth="2.5"/>
      <rect x="60" y={yH(Math.min(H_TROP, Hc))} width="96" height={Math.max(0, yH(H_FOND) - yH(Math.min(H_TROP, Hc)))} fill="#93c5fd"/>
      <line x1="58" y1={yH(Hc)} x2="158" y2={yH(Hc)} stroke={COUL.eau} strokeWidth="2"/>
      {regul === 'tor' ? [[hHaut, 'seuil haut'], [hBas, 'seuil bas']].map(([h, n]) => (
        <g key={n}><line x1="50" y1={yH(h)} x2="166" y2={yH(h)} stroke={COUL.seuil} strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x="168" y={yH(h) + 4} fontSize="13" fill={COUL.seuil}>{n}</text></g>
      )) : (
        <g><line x1="50" y1={yH(consigne)} x2="166" y2={yH(consigne)} stroke={COUL.consigne} strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x="168" y={yH(consigne) + 4} fontSize="13" fill={COUL.consigne}>consigne</text></g>
      )}
      <text x="116" y={yH(H_TROP) - 6} fontSize="14.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">A · réservoir</text>
      {/* tour et canalisations */}
      <rect x="93" y={yH(H_FOND)} width="30" height={360 - yH(H_FOND)} fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/>
      <polyline points={`54,360 48,360 48,${yH(H_TROP) - 10} 70,${yH(H_TROP) - 10} 70,${yH(H_TROP) + 8}`} fill="none" stroke={Yc > 0 ? COUL.pompe : '#94a3b8'} strokeWidth="4"/>
      <polyline points={`142,${yH(H_FOND)} 142,360 200,360 200,344`} fill="none" stroke={COUL.puisage} strokeWidth="4"/>
      {/* pompe */}
      <circle cx="40" cy="360" r="13" fill={Yc > 0 ? '#dcfce7' : 'white'} stroke={KIT.txt} strokeWidth="2"/>
      <text x="40" y="365" fontSize="14.5" fontWeight="800" fill={KIT.txt} textAnchor="middle">B</text>
      <text x="40" y="390" fontSize="13.5" fill={KIT.txt} textAnchor="middle">{regul === 'tor' ? (Yc > 0 ? 'pompe ON' : 'pompe OFF') : `pompe ${fmt(Yc, 0)} %`}</text>
      {/* maison et robinet */}
      <polygon points="182,320 200,304 218,320" fill="#fed7aa" stroke={KIT.txt} strokeWidth="1.5"/>
      <rect x="185" y="320" width="30" height="24" fill="#fff7ed" stroke={KIT.txt} strokeWidth="1.5"/>
      <text x="200" y="337" fontSize="13.5" fontWeight="800" fill={KIT.txt} textAnchor="middle">C</text>
      <text x="200" y="390" fontSize="13.5" fill={KIT.txt} textAnchor="middle">abonnés</text>
      <text x="116" y="378" fontSize="13" fill={KIT.txt2} textAnchor="middle">t = {fmt(tAff, 0)} h</text>
      {sim.perdu > 20 && <text x="108" y={yH(H_TROP) - 20} fontSize="13.5" fontWeight="800" fill="#b91c1c" textAnchor="middle">débordement !</text>}
      {sim.penurie > 1 && <text x="108" y={yH(H_FOND) + 16} fontSize="13.5" fontWeight="800" fill="#b91c1c" textAnchor="middle">réservoir vide !</text>}
      <Cadre actif={hl('reservoir')} x={46} y={yH(H_TROP) - 22} w={130} h={yH(H_FOND) - yH(H_TROP) + 30}/>
      <Cadre actif={hl('pompe')} x={14} y={340} w={54} h={58}/>
      <Cadre actif={hl('maison')} x={176} y={296} w={54} h={102}/>
    </svg>
  );

  // ════════════════ COURBES H(t) ET Q(t) ════════════════
  const W = 470, gx = 46, dx = 10, HH = 200, HQ = 120, gap = 34;
  const X = t => gx + (t / duree) * (W - gx - dx);
  const hMin = 28, hMax = 38;
  const YH = h => 12 + (1 - (h - hMin) / (hMax - hMin)) * (HH - 24);
  const qMax = Math.max(100, Qmax, ...sim.pts.map(q => q.Qp)) * 1.05;
  const YQ = q => HH + gap + (1 - q / qMax) * (HQ - 12) + 4;
  const chemin = (f, g) => sim.pts.map((q, i) => `${i ? 'L' : 'M'}${X(q.t).toFixed(1)},${g(f(q)).toFixed(1)}`).join(' ');
  const pasT = duree <= 200 ? 50 : duree <= 500 ? 100 : 200;
  const refSvg = useRef(null);
  function survoler(ev) {
    const r = refSvg.current.getBoundingClientRect();
    const xs = (ev.clientX - r.left) / r.width * W;
    const t = Math.min(duree, Math.max(0, (xs - gx) / (W - gx - dx) * duree));
    setSurvol(sim.pts[Math.min(sim.pts.length - 1, Math.round(t / (DT * 10)))]);
  }
  const courbes = (
    <div>
      <svg ref={refSvg} viewBox={`0 0 ${W} ${HH + gap + HQ + 42}`} onMouseMove={survoler} onMouseLeave={() => setSurvol(null)}
        role="img" aria-label="Hauteur d'eau et débits en fonction du temps"
        style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}`, cursor: 'crosshair' }}>
        {[28, 30, 32, 34, 36, 38].map(h => (
          <g key={h}><line x1={gx} y1={YH(h)} x2={W - dx} y2={YH(h)} stroke="#e2e8f0"/><text x={gx - 5} y={YH(h) + 4} fontSize="13" fill={KIT.txt2} textAnchor="end">{h}</text></g>
        ))}
        {Array.from({ length: Math.floor(duree / pasT) + 1 }, (_, k) => k * pasT).map(t => (
          <g key={t}>
            <line x1={X(t)} y1={8} x2={X(t)} y2={HH + gap + HQ + 4} stroke="#f1f5f9"/>
            <text x={X(t)} y={HH + gap + HQ + 20} fontSize="13" fill={KIT.txt2} textAnchor="middle">{t}</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100, 150, 200].filter(q => q <= qMax).map(q => (
          <g key={`q${q}`}><line x1={gx} y1={YQ(q)} x2={W - dx} y2={YQ(q)} stroke="#e2e8f0"/><text x={gx - 5} y={YQ(q) + 4} fontSize="13" fill={KIT.txt2} textAnchor="end">{q}</text></g>
        ))}
        <rect x={gx} y={YH(H_TROP)} width={W - gx - dx} height={YH(H_FOND) - YH(H_TROP)} fill="#dbeafe" opacity="0.35"/>
        {regul === 'tor' ? <>
          <line x1={gx} y1={YH(hHaut)} x2={W - dx} y2={YH(hHaut)} stroke={COUL.seuil} strokeDasharray="5 4"/>
          <line x1={gx} y1={YH(hBas)} x2={W - dx} y2={YH(hBas)} stroke={COUL.seuil} strokeDasharray="5 4"/>
        </> : <line x1={gx} y1={YH(consigne)} x2={W - dx} y2={YH(consigne)} stroke={COUL.consigne} strokeDasharray="5 4"/>}
        <path d={chemin(q => q.H, YH)} fill="none" stroke={COUL.eau} strokeWidth="2.2"/>
        <path d={chemin(q => q.Qp, YQ)} fill="none" stroke={COUL.puisage} strokeWidth="1.8" strokeDasharray={profil === 'constant' ? '6 4' : 'none'}/>
        <path d={chemin(q => q.Qpompe, YQ)} fill="none" stroke={COUL.pompe} strokeWidth="2.2"/>
        <line x1={gx} y1={HH} x2={W - dx} y2={HH} stroke={KIT.txt}/><line x1={gx} y1={8} x2={gx} y2={HH} stroke={KIT.txt}/>
        <line x1={gx} y1={HH + gap + HQ + 4} x2={W - dx} y2={HH + gap + HQ + 4} stroke={KIT.txt}/><line x1={gx} y1={HH + gap} x2={gx} y2={HH + gap + HQ + 4} stroke={KIT.txt}/>
        <text x={13} y={HH / 2} fontSize="13.5" fontWeight="700" fill={COUL.eau} transform={`rotate(-90 13 ${HH / 2})`} textAnchor="middle">H (m)</text>
        <text x={13} y={HH + gap + HQ / 2} fontSize="13.5" fontWeight="700" fill={COUL.pompe} transform={`rotate(-90 13 ${HH + gap + HQ / 2})`} textAnchor="middle">débits (m³/h)</text>
        <text x={(gx + W - dx) / 2} y={HH + gap + HQ + 38} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">temps t (h)</text>
        <g transform={`translate(${W - dx - 170} ${HH + gap + 14})`}>
          <rect x="-6" y="-15" width="172" height="22" rx="4" fill="white" opacity="0.85"/>
          <line x1="0" y1="-4" x2="16" y2="-4" stroke={COUL.pompe} strokeWidth="2.2"/><text x="20" y="0" fontSize="13" fill={KIT.txt}>pompe</text>
          <line x1="80" y1="-4" x2="96" y2="-4" stroke={COUL.puisage} strokeWidth="2"/><text x="100" y="0" fontSize="13" fill={KIT.txt}>puisage</text>
        </g>
        <line x1={X(tAff)} y1={8} x2={X(tAff)} y2={HH + gap + HQ + 4} stroke="#f59e0b" strokeWidth="1.5"/>
        {survol && <line x1={X(survol.t)} y1={8} x2={X(survol.t)} y2={HH + gap + HQ + 4} stroke={KIT.txt} strokeDasharray="3 3"/>}
      </svg>
      <div style={{ fontSize: 13, color: KIT.txt, marginTop: 4, minHeight: 20, fontFamily: 'monospace' }}>
        {survol ? `t = ${fmt(survol.t, 1)} h   H = ${fmt(survol.H, 2)} m   pompe = ${fmt(survol.Qpompe, 1)} m³/h   puisage = ${fmt(survol.Qp, 1)} m³/h`
          : 'Survolez les courbes pour lire les valeurs.'}
      </div>
    </div>
  );

  // ════════════════ VOLETS ════════════════
  const commandes = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={() => { if (!lecture) setTCur(0); setLecture(l => !l); }} style={styleBouton(true, lecture ? '#d97706' : '#2563eb')}>
          {lecture ? '⏸ Pause' : '▶ Rejouer dans le temps'}</button>
        <button onClick={() => { setLecture(false); setTCur(null); }} style={styleBouton(false)}>⏭ Voir la fin</button>
      </div>
      {rev.regul && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Type de régulation</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['tor', 'Tout-ou-rien'], ['p', 'P'], ['pi', 'PI']].map(([k, n]) =>
              <button key={k} onClick={() => setRegul(k)} style={stylePetitBouton(regul === k, '#7c3aed')}>{n}</button>)}
          </div>
        </div>
      )}
      {rev.seuils && regul === 'tor' && <>
        <Curseur nom="Seuil haut" valeur={hHaut} onChange={v => setHHaut(Math.max(v, hBas + 0.5))} min={28} max={38} pas={0.5} unite="m" decimales={1} couleur={COUL.seuil}/>
        <Curseur nom="Seuil bas" valeur={hBas} onChange={v => setHBas(Math.min(v, hHaut - 0.5))} min={26} max={36} pas={0.5} unite="m" decimales={1} couleur={COUL.seuil}/>
      </>}
      {rev.regul && regul !== 'tor' && <Curseur nom="Consigne" valeur={consigne} onChange={setConsigne} min={30} max={36} pas={0.5} unite="m" decimales={1} couleur={COUL.consigne}/>}
      {rev.kp && regul !== 'tor' && <Curseur nom="Gain proportionnel Kp" valeur={Kp} onChange={setKp} min={2} max={200} pas={1} unite="%/m" couleur="#7c3aed"/>}
      {rev.ti && regul === 'pi' && <Curseur nom="Temps intégral Ti" valeur={Ti} onChange={setTi} min={2} max={300} pas={1} unite="h" couleur="#7c3aed"/>}
      {rev.puisage && <Curseur nom="Débit de puisage (moyen)" valeur={Qp} onChange={setQp} min={0} max={95} pas={1} unite="m³/h" couleur={COUL.puisage}/>}
      {!enGuide && <>
        <Curseur nom="Débit maximal de la pompe" valeur={Qmax} onChange={setQmax} min={50} max={200} pas={5} unite="m³/h" couleur={COUL.pompe}/>
        <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Consommation des abonnés</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['constant', 'constante'], ['journee', 'journée type'], ['incendie', 'incendie à t = 200 h']].map(([k, n]) =>
            <button key={k} onClick={() => setProfil(k)} style={stylePetitBouton(profil === k, COUL.puisage)}>{n}</button>)}
        </div>
        <Curseur nom="Retard de la mesure" valeur={retard} onChange={setRetard} min={0} max={8} pas={0.5} unite="h" decimales={1} couleur="#334155"/>
        <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Durée simulée</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[200, 500, 1000].map(d => <button key={d} onClick={() => { setDuree(d); setTCur(null); }} style={stylePetitBouton(duree === d, '#334155')}>{d} h</button>)}
        </div>
      </>}
      {enGuide && !rev.seuils && <div style={{ fontSize: 13, color: KIT.txt2 }}>Les réglages apparaîtront au fil du parcours.</div>}
    </>
  );
  const mesures = (
    <>
      <LigneMesure nom={`Hauteur d'eau à t = ${fmt(tAff, 0)} h`} valeur={`${fmt(Hc, 2)} m`} couleur={COUL.eau}/>
      {regul === 'tor' && rev.mesuresTor && <>
        <LigneMesure nom="Démarrages de la pompe" valeur={`${sim.demarrages} en ${duree} h`} couleur={COUL.pompe}/>
        <LigneMesure nom="Durée d'un cycle" valeur={sim.periode ? `${fmt(sim.periode, 0)} h` : '—'} couleur={COUL.pompe}/>
        {!enGuide && <LigneMesure nom="Taux d'utilisation de la pompe" valeur={sim.utilisation != null ? `${fmt(sim.utilisation * 100, 1)} %` : '—'} couleur={COUL.pompe}/>}
      </>}
      {regul !== 'tor' && <>
        <LigneMesure nom="Niveau moyen sur les dernières 24 h" valeur={`${fmt(sim.Hfin, 2)} m`} couleur={COUL.eau}/>
        {!enGuide && <LigneMesure nom="Écart consigne − niveau final" valeur={`${fmt(consigne - sim.Hfin, 2)} m`} couleur={COUL.consigne}/>}
        {!enGuide && <LigneMesure nom="Écart maximal après 72 h" valeur={sim.ecartMax != null ? `${fmt(sim.ecartMax, 2)} m` : '—'} couleur={COUL.consigne}/>}
      </>}
      {sim.perdu > 20 && <LigneMesure nom="Eau perdue par débordement" valeur={`${fmt(sim.perdu, 0)} m³`} couleur="#b91c1c"/>}
      {sim.penurie > 1 && <LigneMesure nom="Durée où le réservoir est vide" valeur={`${fmt(sim.penurie, 1)} h`} couleur="#b91c1c"/>}
    </>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi(type) {
    setLecture(false); setTCur(null);
    if (type === 'ville') {
      const hab = Math.round((3000 + Math.random() * 12000) / 100) * 100;
      setDefi({ type, hab, reps: {}, verifie: false });
      setRegul('tor'); setProfil('constant'); setQmax(100); setHBas(31); setHHaut(33); setQp(20); setRetard(0); setDuree(1000);
    } else {
      const moy = Math.round(30 + Math.random() * 30);
      setDefi({ type, moy, valide: null });
      setRegul('pi'); setProfil('journee'); setQp(moy); setQmax(100); setConsigne(33); setKp(5); setTi(200); setRetard(1); setDuree(500);
    }
  }
  const qVille = defi && defi.type === 'ville' ? defi.hab * CONSO / 1000 / 24 : null;
  const questionsVille = defi && defi.type === 'ville' ? [
    { id: 'v', q: `Consommation journalière de ${defi.hab.toLocaleString('fr-FR')} habitants`, unite: 'm³', vrai: defi.hab * CONSO / 1000 },
    { id: 'q', q: 'Débit de puisage moyen', unite: 'm³/h', vrai: qVille },
    { id: 'u', q: 'Taux d’utilisation de la pompe (seuils 30 et 36 m, pompe de 100 m³/h)', unite: '%', vrai: qVille },
  ] : [];
  const justeV = q => { const x = lireNombre(defi.reps[q.id]); return isFinite(x) && proche(x, q.vrai, 0.03); };
  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => nouveauDefi('ville')} style={styleBouton(defi?.type === 'ville', '#0ea5e9')}>🏙️ Une nouvelle ville (TOR)</button>
        <button onClick={() => nouveauDefi('pi')} style={styleBouton(defi?.type === 'pi', '#0ea5e9')}>🎛️ Régler le PI</button>
      </div>
      {!defi && <div style={{ fontSize: 14, color: KIT.txt2 }}>Choisissez un défi.</div>}
      {defi && defi.type === 'ville' && <>
        <div style={{ fontSize: 15, color: KIT.txt, lineHeight: 1.6 }}>
          Le château d'eau alimente maintenant une ville de <strong>{defi.hab.toLocaleString('fr-FR')} habitants</strong> (150 L par jour et
          par personne, consommation constante). Faites les calculs, puis réglez la simulation pour vérifier vos résultats.
        </div>
        {questionsVille.map((q, k) => {
          const ok = defi.verifie && justeV(q);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`}
                  onChange={x => { const v = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 120 }}/>
                <span style={{ fontSize: 13, color: KIT.txt2 }}>{q.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Valeur attendue : {sci(q.vrai)} {q.unite}</div>}
            </div>
          );
        })}
        <div><button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button></div>
      </>}
      {defi && defi.type === 'pi' && <>
        <div style={{ fontSize: 15, color: KIT.txt, lineHeight: 1.6 }}>
          La pompe est maintenant à vitesse variable, régulée en <strong>PI</strong>. La consommation suit une <strong>journée type</strong>
          (pics le matin et le soir, {defi.moy} m³/h en moyenne) et la mesure du niveau a <strong>1 h de retard</strong>.
          Mission : après les 72 premières heures, garder le niveau le plus près possible de la consigne (33 m), sans débordement
          ni pénurie. Réglez K<sub>p</sub> et T<sub>i</sub>, puis validez. 🥉 écart maximal sous 0,5 m · 🥈 sous 0,3 m · 🥇 sous 0,2 m.
        </div>
        <div><button onClick={() => {
          const sain = sim.perdu <= 20 && sim.penurie <= 1, e = sim.ecartMax;
          const medaille = !sain || e == null ? null : e <= 0.2 ? '🥇 or' : e <= 0.3 ? '🥈 argent' : e <= 0.5 ? '🥉 bronze' : null;
          setDefi(d => ({ ...d, valide: { ecart: e, sain, medaille, meilleure: d.valide && d.valide.ecart != null ? Math.min(d.valide.meilleure ?? 9, e) : e } }));
        }} style={styleBouton(true, '#16a34a')}>✓ Valider mon réglage</button></div>
        {defi.valide && <div style={{ fontSize: 14.5, fontWeight: 700, color: defi.valide.medaille ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>
          {!defi.valide.sain ? '❌ Le réservoir déborde ou se vide : ce réglage n’est pas acceptable.'
            : defi.valide.medaille ? `✅ Médaille ${defi.valide.medaille} : écart maximal de ${fmt(defi.valide.ecart, 2)} m.${defi.valide.medaille.includes('or') ? ' Bravo ! 🎉' : ' Pouvez-vous faire mieux ?'}`
              : `❌ Écart maximal de ${fmt(defi.valide.ecart, 2)} m : c’est trop. Essayez d’augmenter Kp, ou de réduire Ti… sans faire osciller.`}
          {defi.valide.meilleure != null && <div style={{ fontSize: 13, fontWeight: 400, color: KIT.txt2 }}>Votre meilleur écart sur ce défi : {fmt(defi.valide.meilleure, 2)} m</div>}
        </div>}
      </>}
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi('ville');
    if (m === 'guide') { setProfil('constant'); setQmax(100); setRetard(0); setDuree(1000); }
  }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rn-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .rn-schema { display: grid; gap: 10px; grid-template-columns: minmax(170px, 230px) minmax(0, 1fr); align-items: start; }
        .rn-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .rn-l1 { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 560px) { .rn-schema { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Régulation du niveau d'un château d'eau · TOR, P et PI</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className="rn-l1">
        <div style={styleBoite}>
          <div className="rn-schema">
            <div>{schema}</div>
            <div>{courbes}</div>
          </div>
          <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
            {enGuide ? <>L'élément encadré en orange est celui dont parle l'étape en cours. La bande bleue des courbes représente le réservoir (de 30 à 36 m).</>
              : <>La bande bleue des courbes représente le réservoir (de 30 à 36 m). Le trait orange vertical indique l'instant affiché sur le schéma.</>}
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div>
            : <div style={styleBoite}>
              <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
                <li>En TOR, rapprochez les seuils : que deviennent le nombre de démarrages et le taux d'utilisation ?</li>
                <li>Passez en « journée type » : le TOR suit-il encore ? Et un PI ?</li>
                <li>Déclenchez l'incendie : le réservoir tient-il le coup ?</li>
                <li>En P, augmentez fortement K<sub>p</sub> avec un retard de mesure de 4 h.</li>
                <li>En PI, cherchez le T<sub>i</sub> le plus petit qui n'oscille pas trop.</li>
              </ul>
            </div>}
      </div>
      <div className="rn-l2">
        <Section titre="Commandes" ouvert={ouverts.commandes} onBascule={() => setOuverts(o => ({ ...o, commandes: !o.commandes }))}>{commandes}</Section>
        <Section titre="Mesures" ouvert={ouverts.mesures} onBascule={() => setOuverts(o => ({ ...o, mesures: !o.mesures }))}>{mesures}</Section>
      </div>
    </div>
  );
}
