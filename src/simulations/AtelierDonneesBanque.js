// ====================================================
//  ATELIER « EXTRAIRE LES DONNÉES D'UN ÉNONCÉ » — BANQUE D'ÉNONCÉS
// ====================================================
// Chaque énoncé est un petit problème de TSTL dont les nombres sont tirés au hasard. Il est construit par build(p, q) :
//   • texte : liste de morceaux de texte et de « données » cliquables {t: identifiant}
//   • tokens : pour chaque donnée, ce qu'elle représente (quoi), son affichage (aff) et la valeur à utiliser dans le calcul (use : val + unité)
//   • utiles : identifiants des données utiles POUR LA QUESTION posée (une même donnée peut être utile à une question et inutile à une autre)
//   • raisons : pour chaque donnée inutile, pourquoi elle l'est
//   • derivees : grandeurs à calculer avant d'appliquer la formule (surface, écart de température, section…)
//   • cherche : la grandeur cherchée (bonne réponse) et des propositions fausses plausibles
//   • manque : l'information qui n'est pas dans l'énoncé et qu'il faudra calculer ou chercher (facultatif)
//   • solution : le calcul final (affiché seulement dans le parcours guidé, pour montrer à quoi servent les données)
// Aucune de ces fonctions ne dépend de React : elles sont testables seules.

import { ACIDES as AAM, ORDRE as AAM_ORDRE } from "./aminoAcidesModele";
import { IONS as CDT_IONS } from "./conductimetrieModele";
import * as ACF from "./acideFaibleModele";
import * as PRE from "./predoTstlModele";
import * as TMP from "./tamponTstlModele";
import * as CO2 from "./co2DissousModele";
const CDT_SELS = [{ nom: 'chlorure de sodium', f: 'NaCl', cat: 'Na', an: 'Cl' }, { nom: 'nitrate de sodium', f: 'NaNO₃', cat: 'Na', an: 'NO3' }, { nom: 'éthanoate de sodium', f: 'CH₃COONa', cat: 'Na', an: 'AcO' }];
const tire = t => t[Math.floor(Math.random() * t.length)];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci3 = x => { const [m, e] = Number(x).toExponential(2).split('e'); return `${Number(m).toLocaleString('fr-FR')} × 10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
export const nb = (x, d = null) => (d == null
  ? (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e7) ? sci3(x) : Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: 4 }))
  : Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const NB = s => s.replace(/ /g, ' ');                       // espace insécable : une donnée ne se coupe pas en fin de ligne
const sg = x => (x < 0 ? '−' + nb(Math.abs(x)) : nb(x));          // nombre avec « vrai » signe moins
const T = id => ({ t: id });
const sciR = x => { const [m, e] = Number(x).toExponential(1).split('e'); return `${m.replace('.', ',')} × 10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };   // 2 chiffres significatifs, notation scientifique
const tok = (aff, quoi, val, u) => ({ aff: NB(aff), quoi, use: { val, u } });

export const ENONCES = [
  // ───────────────────────────── 0. Projecteur de diapositives (1G : lentille mince)
  {
    id: 'lum1-projecteur', domaine: 'Lentille mince', titre: 'Un projecteur de diapositives', noms: ['Position de l’écran', 'Hauteur de l’image'],
    gen: () => { const f = tire([80, 100, 120]), k = tire([1.5, 2, 3]); return { f, d: Math.round(f * k / 10), AB: tire([24, 36]), P: tire([150, 250]) }; },
    build: (p, q) => {
      const f = p.f / 1000, d = p.d / 100, OA = -d, OAp = 1 / (1 / f + 1 / OA), gam = OAp / OA, AB = p.AB / 1000;
      const tokens = {
        f: tok(`${p.f} mm`, 'Distance focale de la lentille', f, 'm'),
        d: tok(`${p.d} cm`, 'Distance entre la diapositive et la lentille (diapositive avant la lentille : OA = −d)', d, 'm'),
        P: tok(`${p.P} W`, 'Puissance de la lampe', p.P, 'W'),
      };
      const debut = ['Un projecteur contient une lentille mince convergente de distance focale ', T('f'), '. La diapositive est placée à ', T('d'),
        ' devant la lentille, et la lampe qui l’éclaire a une puissance de ', T('P'), '. On cherche à obtenir une image nette sur un écran, de l’autre côté de la lentille. '];
      const derivees = [{ id: 'OA', nom: 'Position OA de la diapositive (algébrique, origine O)', expr: 'OA = −d', val: OA, u: 'm' }];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'À quelle distance de la lentille faut-il placer l’écran ?'],
        utiles: ['f', 'd'],
        raisons: { P: 'La puissance de la lampe donne la luminosité de l’image, pas sa position.' },
        cherche: { bonne: 'La position OA′ de l’image (en m)', faux: ['Le grandissement γ de la lentille (sans unité)', 'La vergence C de la lentille (en δ)', 'La hauteur de l’image A′B′ (en m)'] },
        manque: null, solution: { txt: '1/OA′ = 1/f′ + 1/OA (relation de conjugaison)', val: OAp, u: 'm' } };
      tokens.AB = tok(`${p.AB} mm`, 'Hauteur de la diapositive', AB, 'm');
      return { tokens, derivees: [...derivees, { id: 'OAp', nom: 'Position OA′ de l’image', expr: '1/OA′ = 1/f′ + 1/OA', val: OAp, u: 'm' }],
        texte: [...debut, 'Les diapositives mesurent ', T('AB'), ' de haut. Quelle est la hauteur de l’image sur l’écran ?'],
        utiles: ['f', 'd', 'AB'],
        raisons: { P: 'La puissance de la lampe donne la luminosité de l’image, pas sa taille.' },
        cherche: { bonne: 'La hauteur algébrique A′B′ de l’image (en m)', faux: ['La position OA′ de l’image (en m)', 'La vergence C de la lentille (en δ)', 'Le grandissement γ de la lentille (sans unité)'] },
        manque: null, solution: { txt: 'A′B′ = γ × AB avec γ = OA′ / OA', val: gam * AB, u: 'm' } };
    },
  },
  // ───────────────────────────── Effet Doppler (TSTL) : un chariot sur un rail
  {
    id: 'dop-chariot', domaine: 'Ondes', titre: 'Un chariot sur un rail', noms: ['Vitesse du chariot', 'Décalage Doppler prévu'],
    gen: () => { const fe = tire([25000, 40000]), v = tire([0.2, 0.3, 0.4, 0.6, 0.8, 1.0]); return { fe, v, df: Math.round(fe * v / 340), L: tire([1.2, 1.5, 2.0]), m: tire([250, 400, 500]) }; },
    build: (p, q) => {
      const c = 340;
      const tokens = {
        fe: tok(`${nb(p.fe / 1000, 0)} kHz`, 'Fréquence de l’onde émise par l’émetteur', p.fe, 'Hz'),
        c: tok(`${c} m/s`, 'Célérité du son dans l’air du laboratoire', c, 'm·s⁻¹'),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du rail', p.L, 'm'),
        m: tok(`${p.m} g`, 'Masse du chariot', p.m / 1000, 'kg'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' roule à vitesse constante sur un rail de ', T('L'), ' de long. Il porte un émetteur ultrasonore de fréquence ', T('fe'),
        ', et se rapproche d’un récepteur fixe. La célérité du son dans l’air est ', T('c'), '. '];
      if (q === 0) {
        tokens.df = tok(`${p.df} Hz`, 'Décalage Doppler lu sur le spectre (écart entre la fréquence reçue et la fréquence émise)', p.df, 'Hz');
        return { tokens, derivees: [{ id: 'rap', nom: 'Rapport δf / f_e (égal à v / c)', expr: 'δf / f_e', val: p.df / p.fe, u: '' }],
          texte: [...debut, 'Sur le spectre du signal reçu, le décalage Doppler lu vaut ', T('df'), '. À quelle vitesse roule le chariot ?'],
          utiles: ['fe', 'c', 'df'],
          raisons: { L: 'La longueur du rail ne joue pas dans l’effet Doppler : seule la vitesse compte, pas la distance parcourue.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
          cherche: { bonne: 'La vitesse v du chariot (en m/s)', faux: ['La fréquence reçue f_r (en Hz)', 'La longueur d’onde émise λ (en m)', 'La durée de l’enregistrement T (en s)'] },
          manque: null, solution: { txt: 'v = c × δf / f_e (v très inférieure à c)', val: 340 * p.df / p.fe, u: 'm/s' } };
      }
      tokens.v = tok(`${nb(p.v, 2)} m/s`, 'Vitesse du chariot', p.v, 'm·s⁻¹');
      return { tokens, derivees: [{ id: 'rap', nom: 'Rapport v / c', expr: 'v / c', val: p.v / c, u: '' }],
        texte: [...debut, 'Le chariot roule à ', T('v'), '. Quel décalage Doppler s’attend-on à lire sur le spectre ?'],
        utiles: ['fe', 'c', 'v'],
        raisons: { L: 'La longueur du rail ne joue pas dans l’effet Doppler.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
        cherche: { bonne: 'Le décalage Doppler δf (en Hz)', faux: ['La vitesse v du chariot (en m/s)', 'La fréquence reçue f_r (en Hz)', 'La durée du trajet sur le rail (en s)'] },
        manque: null, solution: { txt: 'δf = f_e × v / c (v très inférieure à c)', val: p.fe * p.v / c, u: 'Hz' } };
    },
  },
  // ───────────────────────────── Effet Doppler (TG) : un laser sur un chariot
  {
    id: 'dopg-laser', domaine: 'Ondes', titre: 'Un laser sur un chariot', noms: ['Décalage Doppler du laser', 'Vitesse du chariot'],
    gen: () => ({ lam: tire([532, 633, 650]), v: tire([0.2, 0.5, 1.0, 2.0]), P: tire([1, 5]), m: tire([250, 400, 500]) }),
    build: (p, q) => {
      const c = 3e8, lam = p.lam * 1e-9, fe = c / lam, df = fe * p.v / c;
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de la lumière émise', lam, 'm'),
        c: tok('3,00 × 10⁸ m/s', 'Célérité de la lumière', c, 'm·s⁻¹'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P / 1000, 'W'),
        m: tok(`${p.m} g`, 'Masse du chariot', p.m / 1000, 'kg'),
      };
      const debut = ['Une diode laser de puissance ', T('P'), ' est fixée sur un chariot de masse ', T('m'), ' qui roule à vitesse constante vers un récepteur fixe. La lumière émise a pour longueur d’onde ', T('lam'),
        ' ; la célérité de la lumière est ', T('c'), '. La vitesse du chariot est très inférieure à celle de la lumière. '];
      const derivees = [{ id: 'fe', nom: 'Fréquence émise f_e', expr: 'f_e = c / λ', val: fe, u: 'Hz' }];
      if (q === 0) {
        tokens.v = tok(`${nb(p.v, 1)} m/s`, 'Vitesse du chariot', p.v, 'm·s⁻¹');
        return { tokens, derivees, texte: [...debut, 'Le chariot roule à ', T('v'), '. Quel décalage Doppler observe-t-on sur la fréquence de la lumière reçue ?'],
          utiles: ['lam', 'c', 'v'],
          raisons: { P: 'La puissance du laser donne l’intensité lumineuse, pas la fréquence : elle n’intervient pas dans le décalage.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
          cherche: { bonne: 'Le décalage Doppler δf (en Hz)', faux: ['La fréquence émise f_e uniquement (en Hz)', 'La vitesse du chariot (en m/s)', 'Le décalage relatif δf / f_e (sans unité)'] },
          manque: null, solution: { txt: 'f_e = c / λ puis δf = f_e × v / c', val: df, u: 'Hz' } };
      }
      const dfAff = Number((df / 1e6).toFixed(2));
      tokens.df = tok(`${nb(dfAff, 2)} MHz`, 'Décalage Doppler mesuré sur la lumière reçue', dfAff * 1e6, 'Hz');
      return { tokens, derivees, texte: [...debut, 'On mesure un décalage Doppler de ', T('df'), '. À quelle vitesse roule le chariot ?'],
        utiles: ['lam', 'c', 'df'],
        raisons: { P: 'La puissance du laser n’intervient pas dans le décalage de fréquence.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
        cherche: { bonne: 'La vitesse v du chariot (en m/s)', faux: ['La fréquence émise f_e (en Hz)', 'La fréquence reçue f_r (en Hz)', 'L’énergie d’un photon (en J)'] },
        manque: null, solution: { txt: 'f_e = c / λ puis v = c × δf / f_e', val: c * dfAff * 1e6 / fe, u: 'm/s' } };
    },
  },
  // ───────────────────────────── Cinétique (TG) : vitesse volumique et loi d’ordre 1
  {
    id: 'cinv-vitesse', domaine: 'Cinétique : vitesse volumique et ordre 1', titre: 'Vitesse volumique à partir d’un tableau de mesures', noms: ['Disparition d’un réactif', 'Apparition d’un produit'],
    gen: () => { const c1 = tire([0.080, 0.100, 0.120, 0.150]), t1 = tire([2, 4, 5]), dt = tire([3, 4, 5, 6]), kk = tire([0.05, 0.08, 0.10]);
      const c2 = Number((c1 * Math.exp(-kk * dt)).toFixed(3)); return { c1, c2, t1, t2: t1 + dt, V: tire([100, 250, 500]), T: tire([25, 30, 35]) }; },
    build: (p, q) => {
      const tokens = {
        t1: tok(`${p.t1},0 min`, 'Premier instant de mesure', p.t1, 'min'), t2: tok(`${p.t2},0 min`, 'Second instant de mesure', p.t2, 'min'),
        V: tok(`${p.V} mL`, 'Volume du mélange réactionnel', p.V, 'mL'), T: tok(`${p.T} °C`, 'Température du bain thermostaté', p.T, '°C'),
      };
      const debut = ['Une transformation totale est suivie dans un bain thermostaté à ', T('T'), ' ; le mélange réactionnel a un volume de ', T('V'), '. '];
      const raisons = { V: 'Le volume n’intervient pas : la vitesse volumique se calcule avec des concentrations (déjà ramenées au litre).', T: 'La température est constante : elle ne sert pas à calculer la vitesse volumique entre deux instants.' };
      if (q === 0) {
        tokens.c1 = tok(`${nb(p.c1, 3)} mol/L`, 'Concentration du réactif au premier instant', p.c1, 'mol·L⁻¹');
        tokens.c2 = tok(`${nb(p.c2, 3)} mol/L`, 'Concentration du réactif au second instant', p.c2, 'mol·L⁻¹');
        return { tokens, derivees: ['Δc = c₂ − c₁', 'Δt = t₂ − t₁'], texte: [...debut, 'La concentration du réactif vaut ', T('c1'), ' à l’instant ', T('t1'), ' et ', T('c2'), ' à l’instant ', T('t2'), '. Quelle est la vitesse volumique moyenne de disparition du réactif entre ces deux instants ?'],
          utiles: ['c1', 'c2', 't1', 't2'], raisons,
          cherche: { bonne: 'La vitesse volumique moyenne de disparition v (en mol·L⁻¹·min⁻¹)', faux: ['La constante de vitesse k (en min⁻¹)', 'Le temps de demi-réaction (en min)', 'La quantité de réactif consommée (en mol)'] },
          manque: null, solution: { txt: 'v = −Δc / Δt = (c₁ − c₂) / (t₂ − t₁)', val: (p.c1 - p.c2) / (p.t2 - p.t1), u: 'mol·L⁻¹·min⁻¹' } };
      }
      tokens.p1 = tok(`${nb(p.c1, 3)} mol/L`, 'Concentration du produit au premier instant', p.c1, 'mol·L⁻¹');
      tokens.p2 = tok(`${nb(p.c1 + p.c1 - p.c2, 3)} mol/L`, 'Concentration du produit au second instant', p.c1 + p.c1 - p.c2, 'mol·L⁻¹');
      return { tokens, derivees: ['Δc = c₂ − c₁', 'Δt = t₂ − t₁'], texte: [...debut, 'La concentration d’un produit vaut ', T('p1'), ' à l’instant ', T('t1'), ' et ', T('p2'), ' à l’instant ', T('t2'), '. Quelle est la vitesse volumique moyenne d’apparition de ce produit entre ces deux instants ?'],
        utiles: ['p1', 'p2', 't1', 't2'], raisons,
        cherche: { bonne: 'La vitesse volumique moyenne d’apparition v (en mol·L⁻¹·min⁻¹)', faux: ['La constante de vitesse k (en min⁻¹)', 'Le temps de demi-réaction (en min)', 'La quantité de produit formée (en mol)'] },
        manque: null, solution: { txt: 'v = Δc / Δt = (c₂ − c₁) / (t₂ − t₁)', val: (p.c1 - p.c2) / (p.t2 - p.t1), u: 'mol·L⁻¹·min⁻¹' } };
    },
  },
  {
    id: 'cinv-k', domaine: 'Cinétique : vitesse volumique et ordre 1', titre: 'Constante k d’une loi d’ordre 1', noms: ['Avec le graphique de ln c', 'Avec v et c à un instant'],
    gen: () => ({ l1: tire([-3.22, -3.00, -2.53]), k: tire([0.05, 0.08, 0.10, 0.15]), t2: tire([6, 8, 10]), c: tire([20, 30, 40, 50]), kv: tire([0.08, 0.12, 0.15, 0.20]), V: tire([100, 250, 500]), T: tire([25, 30, 35]) }),
    build: (p, q) => {
      const debut = ['La disparition d’un réactif suit une loi de vitesse d’ordre 1 (v = k × c) dans un bain thermostaté à ', T('T'), ', le volume du mélange étant de ', T('V'), '. '];
      const tokens = { T: tok(`${p.T} °C`, 'Température du bain', p.T, '°C'), V: tok(`${p.V} mL`, 'Volume du mélange', p.V, 'mL') };
      const raisons = { T: 'La température est constante pendant le suivi : elle fixe la valeur de k mais ne sert pas à la calculer ici.', V: 'Le volume du mélange n’intervient pas dans le calcul de k.' };
      if (q === 0) {
        const l2 = Number((p.l1 - p.k * p.t2).toFixed(2));
        tokens.l1 = tok(`${nb(p.l1, 2)}`, 'ln(c / c°) à t = 0', p.l1, ''); tokens.l2 = tok(`${nb(l2, 2)}`, 'ln(c / c°) au second instant', l2, ''); tokens.t2 = tok(`${p.t2},0 min`, 'Second instant', p.t2, 'min');
        return { tokens, derivees: ['pente = Δ ln(c / c°) / Δt'], texte: [...debut, 'Sur le graphique de ln(c / c°) en fonction du temps, la droite passe par le point (0 ; ', T('l1'), ') et par le point (', T('t2'), ' ; ', T('l2'), '). Quelle est la constante de vitesse k ?'],
          utiles: ['l1', 'l2', 't2'], raisons,
          cherche: { bonne: 'La constante de vitesse k (en min⁻¹), opposée de la pente de la droite', faux: ['La vitesse volumique v (en mol·L⁻¹·min⁻¹)', 'La concentration initiale c₀ (en mol/L)', 'Le temps de demi-réaction (en min)'] },
          manque: null, solution: { txt: 'k = −pente = −(l₂ − l₁) / t₂', val: (p.l1 - l2) / p.t2, u: 'min⁻¹' } };
      }
      const v = Number((p.kv * p.c).toFixed(2));
      tokens.c = tok(`${p.c},0 mmol/L`, 'Concentration à un instant', p.c, 'mmol·L⁻¹'); tokens.v = tok(`${nb(v, 2)} mmol·L⁻¹·min⁻¹`, 'Vitesse volumique de disparition au même instant', v, 'mmol·L⁻¹·min⁻¹');
      return { tokens, derivees: [], texte: [...debut, 'À un instant donné, la concentration du réactif est ', T('c'), ' et la vitesse volumique de disparition vaut ', T('v'), '. Quelle est la constante de vitesse k ?'],
        utiles: ['c', 'v'], raisons,
        cherche: { bonne: 'La constante de vitesse k (en min⁻¹)', faux: ['Le temps de demi-réaction (en min)', 'La concentration initiale c₀ (en mol/L)', 'La pente de la tangente à la courbe c(t)'] },
        manque: null, solution: { txt: 'k = v / c', val: v / p.c, u: 'min⁻¹' } };
    },
  },
  // ───────────────────────────── Radioactivité (TG) : activité et datation
  {
    id: 'rad-activite', domaine: 'Radioactivité : décroissance et demi-vie', titre: 'Activité d’un échantillon d’iode 131', noms: ['Activité initiale', 'Constante radioactive λ'],
    gen: () => { const th = tire([4, 6, 8, 10]), N0 = tire([2.0e7, 4.0e7, 5.0e7, 8.0e7]); return { th, N0, lam: Number((Math.LN2 / (th * 86400)).toPrecision(2)), m: tire([12, 25, 40]) }; },
    build: (p, q) => {
      const tokens = {
        th: tok(`${p.th},0 jours`, 'Demi-vie de l’iode 131 (valeur utilisée)', p.th, 'j'),
        N0: tok(`${sciR(p.N0)} noyaux`, 'Nombre de noyaux radioactifs à l’instant initial', p.N0, ''),
        m: tok(`${p.m} g`, 'Masse du flacon qui contient l’échantillon', p.m, 'g'),
      };
      const raisons = { m: 'La masse du flacon n’intervient ni dans λ ni dans l’activité : l’activité dépend du nombre de noyaux et de λ.' };
      const debut = ['Un échantillon d’iode 131 est conservé dans un flacon de masse ', T('m'), '. À l’instant initial, il contient ', T('N0'), '. '];
      if (q === 0) {
        tokens.lam = tok(`${sciR(p.lam)} s⁻¹`, 'Constante radioactive de l’iode 131', p.lam, 's⁻¹');
        return { tokens, derivees: [], texte: [...debut, 'La constante radioactive de l’iode 131 vaut ', T('lam'), ' (sa demi-vie est de ', T('th'), '). Quelle est l’activité initiale de l’échantillon ?'],
          utiles: ['N0', 'lam'], raisons: { ...raisons, th: 'λ est déjà donnée en s⁻¹ : la demi-vie n’est pas nécessaire pour calculer A₀.' },
          cherche: { bonne: 'L’activité initiale A₀ (en Bq)', faux: ['La demi-vie de l’échantillon (en jours)', 'Le nombre de noyaux restant après une demi-vie', 'L’âge de l’échantillon (en années)'] },
          manque: null, solution: { txt: 'A₀ = λ·N₀', val: p.lam * p.N0, u: 'Bq' } };
      }
      return { tokens, derivees: ['t½ en secondes : t½ × 86 400 s par jour'], texte: [...debut, 'La demi-vie de l’iode 131 vaut ', T('th'), '. On veut calculer sa constante radioactive λ, en s⁻¹.'],
        utiles: ['th'], raisons: { ...raisons, N0: 'λ est une caractéristique du noyau : elle ne dépend pas du nombre de noyaux de l’échantillon.' },
        cherche: { bonne: 'La constante radioactive λ (en s⁻¹)', faux: ['L’activité initiale A₀ (en Bq)', 'Le nombre de noyaux restant après une demi-vie', 'L’âge de l’échantillon (en années)'] },
        manque: null, solution: { txt: 'λ = ln 2 / t½, avec t½ converti en secondes', val: Math.LN2 / (p.th * 86400), u: 's⁻¹' } };
    },
  },
  {
    id: 'rad-age', domaine: 'Radioactivité : décroissance et demi-vie', titre: 'Dater un échantillon avec le carbone 14', noms: ['Avec le nombre de noyaux', 'Avec le pourcentage restant'],
    gen: () => { const N0 = tire([8.0e6, 6.4e6, 9.6e6]), n = tire([2, 3, 4]); return { N0, n, N: N0 / 2 ** n, f: tire([80, 70, 60, 45, 35]), m: tire([15, 30, 50]), z: tire([1.5, 2.0, 3.0]) }; },
    build: (p, q) => {
      const tokens = {
        th: tok('5 730 ans', 'Demi-vie du carbone 14', 5730, 'ans'),
        m: tok(`${p.m} g`, 'Masse de l’échantillon prélevé', p.m, 'g'),
        z: tok(`${nb(p.z, 1)} m`, 'Profondeur de la fouille où l’échantillon a été trouvé', p.z, 'm'),
      };
      const raisons = { m: 'La masse prélevée n’intervient pas : seule la fraction de carbone 14 restante compte.', z: 'La profondeur de la fouille ne sert pas à calculer l’âge avec la décroissance du carbone 14.' };
      const debut = ['Un échantillon organique de masse ', T('m'), ' a été trouvé à ', T('z'), ' de profondeur. La demi-vie du carbone 14 est de ', T('th'), '. '];
      if (q === 0) {
        tokens.N0 = tok(`${sciR(p.N0)} noyaux`, 'Nombre de noyaux de carbone 14 dans un échantillon vivant de même masse', p.N0, '');
        tokens.N = tok(`${sciR(p.N)} noyaux`, 'Nombre de noyaux de carbone 14 mesuré dans l’échantillon', p.N, '');
        return { tokens, derivees: ['nombre de demi-vies : n tel que N₀ / N = 2ⁿ'], texte: [...debut, 'Un échantillon vivant de même masse contient ', T('N0'), ' de carbone 14 ; on en mesure ', T('N'), ' dans l’échantillon. Quel est l’âge de l’échantillon ?'],
          utiles: ['th', 'N0', 'N'], raisons,
          cherche: { bonne: 'L’âge de l’échantillon (en années)', faux: ['La constante radioactive λ (en s⁻¹)', 'L’activité de l’échantillon (en Bq)', 'Le nombre de noyaux disparus (en nombre de noyaux)'] },
          manque: null, solution: { txt: 'N₀ / N = 2ⁿ, âge = n × t½', val: p.n * 5730, u: 'ans' } };
      }
      tokens.f = tok(`${p.f} %`, 'Pourcentage de carbone 14 restant par rapport à un échantillon vivant', p.f, '%');
      return { tokens, derivees: ['λ = ln 2 / t½', 'rapport N₀ / N = 100 / pourcentage restant'], texte: [...debut, 'On mesure ', T('f'), ' du carbone 14 d’un échantillon vivant. Quel est l’âge de l’échantillon ?'],
        utiles: ['th', 'f'], raisons,
        cherche: { bonne: 'L’âge de l’échantillon (en années)', faux: ['La constante radioactive λ (en s⁻¹)', 'L’activité de l’échantillon (en Bq)', 'Le nombre de noyaux disparus (en nombre de noyaux)'] },
        manque: null, solution: { txt: 't = (t½ / ln 2) × ln(N₀ / N)', val: (5730 / Math.LN2) * Math.log(100 / p.f), u: 'ans' } };
    },
  },
  // ───────────────────────────── Équilibre chimique (TG) : Qr, K, taux d'avancement final
  {
    id: 'equ-sapp-qr', domaine: 'Équilibre chimique : Qr, K et taux d’avancement', titre: 'Quotient de réaction et taux d’avancement d’un mélange acide-base', noms: ['Quotient de réaction du mélange', 'Taux d’avancement final'],
    gen: () => { const v = [0.050, 0.10, 0.20, 0.40], c0 = tire([0.10, 0.20, 0.40]); return { a: tire(v), b: tire(v), c: tire(v), d: tire(v), K: tire([0.10, 5.0, 25]), V: tire([100, 250, 500]), c0, cf: c0 * tire([0.25, 0.5, 0.75]) }; },
    build: (p, q) => {
      const tokens = {
        K: tok(`${nb(p.K)}`, 'Constante d’équilibre de la réaction à la température de l’expérience', p.K, ''),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
      };
      const rK = 'K sert à comparer Qr au système (sens d’évolution) ; elle n’intervient pas dans le calcul de Qr ni dans celui de τ.';
      const rV = 'Les concentrations sont déjà données : le volume de la solution n’intervient ni dans Qr ni dans τ.';
      const debut = ['On étudie la réaction CH₃COOH + HCOO⁻ ⇌ CH₃COO⁻ + HCOOH dans ', T('V'), ' d’eau, de constante d’équilibre ', T('K'), '. '];
      if (q === 0) {
        tokens.a = tok(`${nb(p.a, 3)} mol/L`, 'Concentration de CH₃COOH', p.a, 'mol/L'); tokens.b = tok(`${nb(p.b, 3)} mol/L`, 'Concentration de HCOO⁻', p.b, 'mol/L');
        tokens.c = tok(`${nb(p.c, 3)} mol/L`, 'Concentration de CH₃COO⁻', p.c, 'mol/L'); tokens.d = tok(`${nb(p.d, 3)} mol/L`, 'Concentration de HCOOH', p.d, 'mol/L');
        return { tokens, derivees: [], texte: [...debut, 'Dans un mélange, [CH₃COOH] = ', T('a'), ', [HCOO⁻] = ', T('b'), ', [CH₃COO⁻] = ', T('c'), ' et [HCOOH] = ', T('d'), '. Quel est le quotient de réaction du mélange ?'],
          utiles: ['a', 'b', 'c', 'd'], raisons: { K: rK, V: rV },
          cherche: { bonne: 'Le quotient de réaction Qr (sans unité)', faux: ['La constante d’équilibre K', 'Le taux d’avancement final τ', 'L’avancement maximal (en mol)'] },
          manque: null, solution: { txt: 'Qr = ([CH₃COO⁻] × [HCOOH]) / ([CH₃COOH] × [HCOO⁻])', val: p.c * p.d / (p.a * p.b), u: '' } };
      }
      tokens.c0 = tok(`${nb(p.c0, 3)} mol/L`, 'Concentration initiale de CH₃COOH et de HCOO⁻ (identiques, sans produit au départ)', p.c0, 'mol/L');
      tokens.cf = tok(`${nb(p.cf, 3)} mol/L`, 'Concentration de CH₃COO⁻ à l’état final', p.cf, 'mol/L');
      return { tokens, derivees: ['avancement maximal : x_max = c₀ × V (réactif limitant), avancement final : x_f = [CH₃COO⁻] × V'], texte: [...debut, 'On part de ', T('c0'), ' de CH₃COOH et de HCOO⁻, sans produit. À l’état final, [CH₃COO⁻] = ', T('cf'), '. Quel est le taux d’avancement final ?'],
        utiles: ['c0', 'cf'], raisons: { K: rK, V: 'Le volume se simplifie : τ = x_f / x_max = ([CH₃COO⁻] × V) / (c₀ × V).' },
        cherche: { bonne: 'Le taux d’avancement final τ (sans unité)', faux: ['Le quotient de réaction à l’état final', 'La concentration finale en CH₃COOH (en mol/L)', 'L’avancement final x_f (en mol)'] },
        manque: null, solution: { txt: 'τ = x_f / x_max = [CH₃COO⁻]_f / c₀', val: p.cf / p.c0, u: '' } };
    },
  },
  {
    id: 'equ-sapp-etat', domaine: 'Équilibre chimique : Qr, K et taux d’avancement', titre: 'État initial ou état final : quelles données pour K et pour le sens ?', noms: ['Constante d’équilibre K', 'Quotient de réaction au départ'],
    gen: () => { const mel = tire([[0.20, 0.10, 0.10, 0.050], [0.10, 0.10, 0.20, 0.20], [0.40, 0.20, 0.050, 0.050], [0.40, 0.10, 0.10, 0.20]]), T25 = tire([20, 25, 30]); return { mel, T25 }; },
    build: (p, q) => {
      const [a0, b0, c0, d0] = p.mel;
      // état final de la réaction CH₃COOH + HCOO⁻ ⇌ CH₃COO⁻ + HCOOH (K = 0,10) : (c0 + x)(d0 + x) = K (a0 − x)(b0 − x), soit (1 − K) x² + (c0 + d0 + K (a0 + b0)) x + c0 d0 − K a0 b0 = 0
      const K = 0.10, A2 = 1 - K, B2 = c0 + d0 + K * (a0 + b0), C2 = c0 * d0 - K * a0 * b0, x = (-B2 + Math.sqrt(B2 * B2 - 4 * A2 * C2)) / (2 * A2);
      const r3 = v => Math.round(v * 1000) / 1000, fin = [a0 - x, b0 - x, c0 + x, d0 + x].map(r3);
      const noms = ['CH₃COOH', 'HCOO⁻', 'CH₃COO⁻', 'HCOOH'], ini = [a0, b0, c0, d0];
      const tokens = { T: tok(`${p.T25} °C`, 'Température du mélange (constante)', p.T25, '°C') };
      ['a', 'b', 'c', 'd'].forEach((k, i) => { tokens[k + 'i'] = tok(`${nb(ini[i], 3)} mol/L`, `Concentration initiale de ${noms[i]}`, ini[i], 'mol/L'); tokens[k + 'f'] = tok(`${nb(fin[i], 3)} mol/L`, `Concentration de ${noms[i]} à l’état final`, fin[i], 'mol/L'); });
      const debut = ['On étudie CH₃COOH + HCOO⁻ ⇌ CH₃COO⁻ + HCOOH à la température constante de ', T('T'), '. Concentrations initiales : [CH₃COOH] = ', T('ai'), ', [HCOO⁻] = ', T('bi'), ', [CH₃COO⁻] = ', T('ci'), ', [HCOOH] = ', T('di'),
        '. Concentrations à l’état final : [CH₃COOH] = ', T('af'), ', [HCOO⁻] = ', T('bf'), ', [CH₃COO⁻] = ', T('cf'), ', [HCOOH] = ', T('df'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la constante d’équilibre K de cette réaction ?'],
        utiles: ['af', 'bf', 'cf', 'df'], raisons: { T: 'La température est constante : elle n’intervient pas dans le calcul, elle indique seulement que K ne change pas.', ai: 'À l’état final, K = Qr : seules les concentrations finales servent ; les concentrations initiales donnent un Qr de départ, qui n’est pas K.', bi: 'Les concentrations initiales ne donnent pas K : à l’état final, K = Qr calculé avec la composition finale.', ci: 'Les concentrations initiales ne donnent pas K : à l’état final, K = Qr calculé avec la composition finale.', di: 'Les concentrations initiales ne donnent pas K : à l’état final, K = Qr calculé avec la composition finale.' },
        cherche: { bonne: 'La constante d’équilibre K (sans unité)', faux: ['Le quotient de réaction au départ', 'Le taux d’avancement final', 'La température d’équilibre'] },
        manque: null, solution: { txt: 'K = Qr à l’état final = ([CH₃COO⁻] × [HCOOH]) / ([CH₃COOH] × [HCOO⁻]), concentrations finales', val: (fin[2] * fin[3]) / (fin[0] * fin[1]), u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le quotient de réaction du mélange au départ (pour prévoir son sens d’évolution) ?'],
        utiles: ['ai', 'bi', 'ci', 'di'], raisons: { T: 'La température est constante : elle n’intervient pas dans le calcul de Qr.', af: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.', bf: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.', cf: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.', df: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.' },
        cherche: { bonne: 'Le quotient de réaction Qr du mélange de départ (sans unité)', faux: ['La constante d’équilibre K', 'Le quotient de réaction à l’état final', 'Le taux d’avancement final'] },
        manque: null, solution: { txt: 'Qr = ([CH₃COO⁻] × [HCOOH]) / ([CH₃COOH] × [HCOO⁻]), concentrations initiales', val: (c0 * d0) / (a0 * b0), u: '' } };
    },
  },
  // ───────────────────────────── Acide faible (TSTL, PCM) : coefficient de dissociation, conservation de la matière, Ka, pKa
  {
    id: 'dissoc-sapp-alpha', domaine: 'Acide faible, coefficient de dissociation et Ka', titre: 'Coefficient de dissociation d’un acide faible', noms: ['Coefficient de dissociation', 'Concentration en acide restant'],
    gen: () => { const c = tire(ACF.CANDIDATS.filter(x => ACF.mesure(x.id, x.C).alpha >= 0.08)); return { C: c.C, pH: ACF.mesure(c.id, c.C).pH, V: tire([100, 200, 250]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration en soluté apporté de l’acide', p.C, 'mol/L'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        V: tok(`${p.V} mL`, 'Volume de la solution préparée', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['On prépare ', T('V'), ' d’une solution d’un acide faible AH, de concentration en soluté apporté ', T('C'), ', à ', T('T'), '. Le pH-mètre indique ', T('pH'), '. '];
      const h = 10 ** -p.pH;
      if (q === 0) return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH)'], texte: [...debut, 'Quel est le coefficient de dissociation α de cet acide ?'],
        utiles: ['C', 'pH'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas dans le calcul de α.', T: 'La température est constante : elle n’intervient pas dans le calcul de α.' },
        cherche: { bonne: 'Le coefficient de dissociation α de l’acide (sans unité)', faux: ['La constante d’acidité Ka de l’acide (sans unité)', 'Le pKa de l’acide (sans unité)', 'La concentration en ions oxonium [H₃O⁺] (en mol/L)'] },
        manque: null, solution: { txt: 'α = [A⁻] divisé par C₀, avec [A⁻] = [H₃O⁺] = 10^(−pH)', val: h / p.C, u: '' } };
      return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH)'], texte: [...debut, 'Quelle est la concentration en acide AH restant dans la solution ?'],
        utiles: ['C', 'pH'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas.', T: 'La température est constante : elle n’intervient pas dans la conservation de la matière.' },
        cherche: { bonne: 'La concentration en acide restant [AH] (en mol/L)', faux: ['La concentration en base conjuguée [A⁻] (en mol/L)', 'La concentration en soluté apporté C₀ (en mol/L)', 'Le coefficient de dissociation α (sans unité)'] },
        manque: null, solution: { txt: '[AH] = C₀ − [A⁻] (conservation de la matière)', val: p.C - h, u: 'mol/L' } };
    },
  },
  {
    id: 'dissoc-sapp-ka', domaine: 'Acide faible, coefficient de dissociation et Ka', titre: 'Constante d’acidité et pKa d’un couple acide-base', noms: ['Constante d’acidité', 'pKa'],
    gen: () => { const c = tire(ACF.CANDIDATS), m = ACF.mesure(c.id, c.C); return { C: c.C, pH: m.pH, M: tire([46, 60, 74, 122]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration en soluté apporté de l’acide', p.C, 'mol/L'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        M: tok(`${p.M} g/mol`, 'Masse molaire de l’acide', p.M, 'g/mol'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un acide faible AH, de masse molaire ', T('M'), ', est dissous dans l’eau à ', T('T'), ' avec une concentration en soluté apporté de ', T('C'), '. Le pH-mètre indique ', T('pH'), '. '];
      const h = 10 ** -p.pH, Ka = h * h / (p.C - h);
      const raisons = { M: 'La masse molaire sert à convertir une masse en quantité de matière : ici la concentration est déjà donnée.', T: 'La température est constante : elle n’intervient pas dans le calcul, elle indique seulement que Ka garde sa valeur.' };
      if (q === 0) return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH) ; [AH] = C₀ − [H₃O⁺]'], texte: [...debut, 'Quelle est la constante d’acidité Ka du couple AH / A⁻ ?'],
        utiles: ['C', 'pH'], raisons,
        cherche: { bonne: 'La constante d’acidité Ka (sans unité)', faux: ['Le coefficient de dissociation α (sans unité)', 'Le pKa du couple (sans unité)', 'La concentration en acide restant [AH] (en mol/L)'] },
        manque: null, solution: { txt: 'Ka = [H₃O⁺]² divisé par (C₀ − [H₃O⁺]), avec [H₃O⁺] = 10^(−pH)', val: Ka, u: '' } };
      return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH) ; [AH] = C₀ − [H₃O⁺] ; Ka'], texte: [...debut, 'Quel est le pKa du couple AH / A⁻ ?'],
        utiles: ['C', 'pH'], raisons,
        cherche: { bonne: 'Le pKa du couple, pKa = −log Ka (sans unité)', faux: ['La constante d’acidité Ka du couple (sans unité)', 'Le pH de la solution (sans unité)', 'Le coefficient de dissociation α (sans unité)'] },
        manque: null, solution: { txt: 'pKa = −log Ka, après calcul de Ka = [H₃O⁺]² divisé par (C₀ − [H₃O⁺])', val: -Math.log10(Ka), u: '' } };
    },
  },
  // ───────────────────────────── pH, pKa et prédominance (TSTL, PCM) : rapport des concentrations, indicateur coloré, Beer-Lambert
  {
    id: 'predo-sapp-rapport', domaine: 'pH, pKa et diagramme de prédominance', titre: 'Rapport des concentrations d’un couple acide-base', noms: ['Rapport des concentrations', 'Concentration de la base'],
    gen: () => { const c = tire(PRE.CANDIDATS_RATIO); return { id: c.id, C: c.C, pH: c.pH, V: tire([50, 100, 250]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const cp = PRE.COUPLES[p.id];
      const tokens = {
        pKa: tok(`${nb(cp.pKa, 1)}`, 'pKa du couple AH / A⁻', cp.pKa, ''),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution (imposé par un tampon)', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale du couple [AH] + [A⁻]', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Une solution de volume ', T('V'), ', à ', T('T'), ', contient un couple acide/base AH / A⁻ de pKa ', T('pKa'), ', avec une concentration totale ', T('C'), '. Son pH est imposé à ', T('pH'), '. '];
      const r = 10 ** (p.pH - cp.pKa), A = p.C * r / (1 + r);
      const raisons = { V: 'Le volume ne change pas les concentrations : il n’intervient pas dans le calcul.', T: 'La température est constante : elle indique seulement que le pKa garde sa valeur.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le rapport [A⁻] sur [AH] des concentrations des deux formes ?'],
        utiles: ['pKa', 'pH'], raisons: { ...raisons, C: 'La concentration totale ne change pas le rapport des deux formes : seuls le pH et le pKa le fixent.' },
        cherche: { bonne: 'Le rapport [A⁻] sur [AH] (sans unité)', faux: ['Le pKa du couple (sans unité)', 'La concentration totale C du couple (en mol/L)', 'Le pH de la solution (sans unité)'] },
        manque: null, solution: { txt: '[A⁻] sur [AH] = 10^(pH − pKa)', val: r, u: '' } };
      return { tokens, derivees: ['rapport [A⁻] sur [AH] = 10^(pH − pKa)'], texte: [...debut, 'Quelle est la concentration de la forme basique A⁻ ?'],
        utiles: ['pKa', 'pH', 'C'], raisons,
        cherche: { bonne: 'La concentration de la base [A⁻] (en mol/L)', faux: ['La concentration de l’acide [AH] (en mol/L)', 'La concentration totale C du couple (en mol/L)', 'Le rapport [A⁻] sur [AH] (sans unité)'] },
        manque: null, solution: { txt: '[A⁻] = C × r divisée par (1 + r), avec r = 10^(pH − pKa)', val: A, u: 'mol/L' } };
    },
  },
  {
    id: 'predo-sapp-beer', domaine: 'pH, pKa et diagramme de prédominance', titre: 'Spectrophotométrie d’un indicateur coloré', noms: ['Concentration de la forme basique', 'pKa de l’indicateur'],
    gen: () => { const u = PRE.tirageIndicateur(); return { ...u, lam: tire([520, 560, 590, 620]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C)} mol/L`, 'Concentration totale de l’indicateur HInd + Ind⁻', p.C, 'mol/L'),
        eps: tok(`${nb(p.eps)} L·mol⁻¹·cm⁻¹`, 'Coefficient d’absorption molaire ε de Ind⁻', p.eps, 'L/(mol·cm)'),
        l: tok(`${nb(p.l, 2)} cm`, 'Longueur de la cuve ℓ', p.l, 'cm'),
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de mesure (seule Ind⁻ absorbe)', p.lam, 'nm'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        A: tok(`${nb(p.abs, 3)}`, 'Absorbance A mesurée', p.abs, ''),
      };
      const debut = ['Une solution d’indicateur coloré HInd / Ind⁻ de concentration totale ', T('C'), ' est étudiée à la longueur d’onde ', T('lam'), ', où seule la forme basique Ind⁻ absorbe, dans une cuve de longueur ', T('l'), ' ; ε vaut ', T('eps'), '. Le pH-mètre indique ', T('pH'), ' et l’absorbance mesurée est ', T('A'), '. '];
      const Ind = p.abs / (p.eps * p.l), r = Ind / (p.C - Ind);
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration de la forme basique [Ind⁻] ?'],
        utiles: ['A', 'eps', 'l'], raisons: { C: 'La concentration totale n’est pas nécessaire pour appliquer la loi de Beer-Lambert à Ind⁻ seule.', lam: 'La longueur d’onde est déjà choisie : elle ne se calcule pas, elle sert seulement à savoir que Ind⁻ est seule à absorber.', pH: 'Le pH ne sert pas à convertir une absorbance en concentration.' },
        cherche: { bonne: 'La concentration de la forme basique [Ind⁻] (en mol/L)', faux: ['La concentration totale C de l’indicateur (en mol/L)', 'Le coefficient d’absorption molaire ε (en L/(mol·cm))', 'Le pKa de l’indicateur (sans unité)'] },
        manque: null, solution: { txt: '[Ind⁻] = A divisée par (ε × ℓ)', val: Ind, u: 'mol/L' } };
      return { tokens, derivees: ['[Ind⁻] = A divisée par (ε × ℓ) ; [HInd] = C − [Ind⁻]'], texte: [...debut, 'Quel est le pKa de l’indicateur ?'],
        utiles: ['C', 'eps', 'l', 'pH', 'A'], raisons: { lam: 'La longueur d’onde sert seulement à savoir que Ind⁻ absorbe seule : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le pKa du couple HInd / Ind⁻, pKa = pH − log(r), avec r = [Ind⁻] sur [HInd] (sans unité)', faux: ['La concentration de la forme basique [Ind⁻] (en mol/L)', 'Le pH de la solution (sans unité)', 'Le rapport [Ind⁻] sur [HInd] (sans unité)'] },
        manque: null, solution: { txt: 'pKa = pH − log(r) où r = [Ind⁻] sur [HInd], avec [Ind⁻] = A divisée par (ε × ℓ) et [HInd] = C − [Ind⁻]', val: p.pH - Math.log10(r), u: '' } };
    },
  },
  // ───────────────────────────── Solution tampon (TSTL, PCM) : choix du couple, préparation, ajout d'acide ou de base
  {
    id: 'tampstl-sapp-prepa', domaine: 'Solution tampon : choix du couple et préparation', titre: 'Préparer une solution tampon de pH donné', noms: ['Rapport des quantités base sur acide', 'Volume de solution de base conjuguée'],
    gen: () => { const t = TMP.tiragePrep(); return { id: t.coupleId, pH: t.pH, V: t.V, C: t.C, T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const cp = TMP.COUPLES[p.id], r = 10 ** (p.pH - cp.pKa);
      const tokens = {
        pKa: tok(`${nb(cp.pKa, 1)}`, 'pKa du couple AH / A⁻', cp.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH visé pour le tampon', p.pH, ''),
        V: tok(`${p.V} mL`, 'Volume de tampon à préparer', p.V, 'mL'),
        C: tok(`${nb(p.C, 2)} mol/L`, 'Concentration commune des deux solutions de départ', p.C, 'mol/L'),
        T: tok(`${p.T} °C`, 'Température de travail', p.T, '°C'),
      };
      const debut = ['On veut préparer un volume ', T('V'), ' de solution tampon de pH ', T('pH'), ', à ', T('T'), ', avec le couple acide/base AH / A⁻ de pKa ', T('pKa'), ', en mélangeant une solution de AH et une solution de A⁻ (sel de sodium), toutes deux de même concentration ', T('C'), '. '];
      const raisons = { T: 'La température est constante : elle indique seulement que le pKa garde sa valeur.', C: 'Les deux solutions ont la même concentration : le rapport des quantités est le rapport des volumes, la valeur de la concentration ne sert pas.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel doit être le rapport n(A⁻) sur n(AH) des quantités de matière à mélanger ?'],
        utiles: ['pKa', 'pH'], raisons: { ...raisons, V: 'Le volume ne change pas le rapport des quantités : il intervient seulement pour répartir les volumes.' },
        cherche: { bonne: 'Le rapport n(A⁻) sur n(AH) (sans unité)', faux: ['Le volume de solution de A⁻ à prélever (en mL)', 'Le pKa du couple (sans unité)', 'La concentration commune des solutions (en mol/L)'] },
        manque: null, solution: { txt: 'n(A⁻) sur n(AH) = 10^(pH − pKa)', val: r, u: '' } };
      return { tokens, derivees: ['rapport n(A⁻) sur n(AH) = 10^(pH − pKa) = rapport des volumes'], texte: [...debut, 'Quel volume de la solution de A⁻ faut-il prélever ?'],
        utiles: ['pKa', 'pH', 'V'], raisons,
        cherche: { bonne: 'Le volume de la solution de A⁻ à prélever (en mL)', faux: ['Le volume de la solution de AH à prélever (en mL)', 'Le rapport n(A⁻) sur n(AH) (sans unité)', 'La quantité de matière de A⁻ (en mmol)'] },
        manque: null, solution: { txt: 'V(A⁻) = V × r divisé par (1 + r), avec r = 10^(pH − pKa)', val: p.V * r / (1 + r), u: 'mL' } };
    },
  },
  {
    id: 'tampstl-sapp-ajout', domaine: 'Solution tampon : choix du couple et préparation', titre: 'pH d’un tampon après l’ajout d’un acide ou d’une base fort', noms: ['Quantité de base après réaction', 'pH du tampon après l’ajout'],
    gen: () => { const a = TMP.tirageAjout(); return { id: a.coupleId, nA: a.nA, nAH: a.nAH, x: a.x, sens: a.sens, V: tire([50, 100, 200]) }; },
    build: (p, q) => {
      const cp = TMP.COUPLES[p.id], b = TMP.bilan({ nA: p.nA, nAH: p.nAH, nAcide: p.sens === 'acide' ? p.x : 0, nBase: p.sens === 'base' ? p.x : 0 });
      const tokens = {
        pKa: tok(`${nb(cp.pKa, 1)}`, 'pKa du couple AH / A⁻', cp.pKa, ''),
        nA: tok(`${nb(p.nA, 1)} mmol`, 'Quantité de base A⁻ dans le tampon', p.nA, 'mmol'),
        nAH: tok(`${nb(p.nAH, 1)} mmol`, 'Quantité d’acide AH dans le tampon', p.nAH, 'mmol'),
        x: tok(`${nb(p.x, 1)} mmol`, p.sens === 'acide' ? 'Quantité d’ions H₃O⁺ ajoutée (acide fort)' : 'Quantité d’ions HO⁻ ajoutée (base forte)', p.x, 'mmol'),
        V: tok(`${p.V} mL`, 'Volume du tampon', p.V, 'mL'),
      };
      const debut = ['Un tampon de volume ', T('V'), ' contient ', T('nA'), ' de base A⁻ et ', T('nAH'), ' d’acide AH, avec un pKa de ', T('pKa'), '. On y ajoute ', T('x'), p.sens === 'acide' ? ' d’ions H₃O⁺, qui réagissent totalement sur A⁻. ' : ' d’ions HO⁻, qui réagissent totalement sur AH. '];
      const raisons = { V: 'Le volume se simplifie dans le rapport des quantités de matière : il ne sert pas ici.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de base A⁻ reste-t-il après la réaction ?'],
        utiles: ['nA', 'x'], raisons: { ...raisons, pKa: 'Le pKa ne sert pas pour un bilan de matière.', nAH: p.sens === 'acide' ? 'L’acide AH n’est pas consommé par un acide fort : il en est formé.' : 'L’acide AH est consommé, mais la quantité de A⁻ ne dépend que de ce qui est formé.' },
        cherche: { bonne: 'La quantité de A⁻ après la réaction (en mmol)', faux: ['La quantité d’acide AH après la réaction (en mmol)', 'Le pH du tampon après la réaction (sans unité)', 'Le rapport n(A⁻) sur n(AH) (sans unité)'] },
        manque: null, solution: { txt: p.sens === 'acide' ? 'n(A⁻) final = n(A⁻) − quantité d’ions H₃O⁺ ajoutée' : 'n(A⁻) final = n(A⁻) + quantité d’ions HO⁻ ajoutée', val: b.nA, u: 'mmol' } };
      return { tokens, derivees: ['bilan de matière : n(A⁻) et n(AH) après la réaction'], texte: [...debut, 'Quel est le pH du tampon après l’ajout ?'],
        utiles: ['pKa', 'nA', 'nAH', 'x'], raisons,
        cherche: { bonne: 'Le pH du tampon après l’ajout (sans unité)', faux: ['La quantité de A⁻ après la réaction (en mmol)', 'Le rapport n(A⁻) sur n(AH) après la réaction (sans unité)', 'Le pH initial du tampon (sans unité)'] },
        manque: null, solution: { txt: 'pH = pKa + log(n(A⁻) sur n(AH)), avec les quantités après la réaction', val: cp.pKa + Math.log10(b.nA / b.nAH), u: '' } };
    },
  },
  // ───────────────────────────── CO₂ dissous (TSTL, PCM) : loi de Henry, pH de l'eau, milieu de pH imposé
  {
    id: 'co2dis-sapp-eau', domaine: 'CO₂ dissous : couples et solubilité', titre: 'Eau en équilibre avec un gaz contenant du CO₂', noms: ['Concentration en CO₂ dissous', 'pH de l’eau'],
    gen: () => { const t = CO2.tirageEau(); return { P: t.P, T: t.T, V: tire([50, 100, 250]) }; },
    build: (p, q) => {
      const a = CO2.A_T[p.T], c = a * p.P, fP = p.P < 1 ? nb(p.P, 1) : nb(p.P, 0);
      const tokens = {
        P: tok(`${fP} kPa`, 'Pression partielle du CO₂ dans le gaz', p.P, 'kPa'),
        a: tok(`${nb(a, 2)} mmol·L⁻¹·kPa⁻¹`, 'Coefficient de solubilité du CO₂ à cette température', a, 'mmol/L/kPa'),
        pKa: tok('6,35', 'pKa du couple CO₂,H₂O / HCO₃⁻', CO2.PKA1, ''),
        T: tok(`${p.T} °C`, 'Température de l’eau', p.T, '°C'),
        V: tok(`${p.V} mL`, 'Volume d’eau dans le flacon', p.V, 'mL'),
      };
      const debut = ['Un flacon de volume d’eau ', T('V'), ', à ', T('T'), ', est en équilibre avec un gaz dont la pression partielle en CO₂ vaut ', T('P'), '. Le coefficient de solubilité du CO₂ vaut ', T('a'), ' et le pKa du couple CO₂,H₂O / HCO₃⁻ vaut ', T('pKa'), '. '];
      const raisons = { V: 'Le volume d’eau ne change pas la concentration à l’équilibre : elle ne dépend que de a et de la pression partielle.', T: 'La température a servi à fixer la valeur de a, déjà donnée : elle n’intervient plus dans le calcul.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en CO₂ dissous ?'],
        utiles: ['a', 'P'], raisons: { ...raisons, pKa: 'Le pKa sert à calculer le pH, pas la concentration en CO₂ dissous.' },
        cherche: { bonne: 'La concentration en CO₂ dissous [CO₂] (en mmol/L)', faux: ['Le pH de l’eau à l’équilibre (sans unité)', 'La quantité de CO₂ dissous dans le flacon (en mmol)', 'La concentration en ions HCO₃⁻ (en mmol/L)'] },
        manque: null, solution: { txt: '[CO₂] = a × P(CO₂) (loi de Henry)', val: c, u: 'mmol/L' } };
      return { tokens, derivees: ['[CO₂] = a × P(CO₂), à convertir en mol/L (1 mmol/L = 10⁻³ mol/L)'], texte: [...debut, 'Quel est le pH de l’eau ?'],
        utiles: ['a', 'P', 'pKa'], raisons,
        cherche: { bonne: 'Le pH de l’eau à l’équilibre (sans unité)', faux: ['La concentration en CO₂ dissous (en mmol/L)', 'La concentration en ions H₃O⁺ (en mol/L)', 'Le pKa du couple (sans unité)'] },
        manque: null, solution: { txt: 'pH = ½ (pKa − log [CO₂]), avec [CO₂] en mol/L', val: CO2.pHFormule(c), u: '' } };
    },
  },
  {
    id: 'co2dis-sapp-milieu', domaine: 'CO₂ dissous : couples et solubilité', titre: 'CO₂ dans un milieu de pH imposé', noms: ['Concentration en HCO₃⁻', 'Rapport du carbone dissous total à [CO₂]'],
    gen: () => { const t = CO2.tirageMilieu(); return { P: t.P, T: t.T, pH: t.pH, V: tire([100, 250, 500]) }; },
    build: (p, q) => {
      const a = CO2.A_T[p.T], m = CO2.milieu(p.P, p.T, p.pH), fP = p.P < 1 ? nb(p.P, 2) : nb(p.P, 0);
      const tokens = {
        P: tok(`${fP} kPa`, 'Pression partielle du CO₂ dans le gaz', p.P, 'kPa'),
        a: tok(`${nb(a, 2)} mmol·L⁻¹·kPa⁻¹`, 'Coefficient de solubilité du CO₂', a, 'mmol/L/kPa'),
        pH: tok(`${nb(p.pH, 1)}`, 'pH imposé au milieu', p.pH, ''),
        pKa1: tok('6,35', 'pKa1 du couple CO₂,H₂O / HCO₃⁻', CO2.PKA1, ''),
        pKa2: tok('10,3', 'pKa2 du couple HCO₃⁻ / CO₃²⁻', CO2.PKA2, ''),
        T: tok(`${p.T} °C`, 'Température du milieu', p.T, '°C'),
        V: tok(`${p.V} mL`, 'Volume du milieu', p.V, 'mL'),
      };
      const debut = ['Un milieu de volume ', T('V'), ' dont le pH est maintenu à ', T('pH'), ' est en équilibre, à ', T('T'), ', avec un gaz de pression partielle en CO₂ ', T('P'), '. On donne a = ', T('a'), ', pKa1 = ', T('pKa1'), ' et pKa2 = ', T('pKa2'), '. '];
      const raisons = { V: 'Le volume du milieu ne change pas les concentrations à l’équilibre : il n’intervient pas.', T: 'La température a servi à fixer la valeur de a, déjà donnée : elle n’intervient plus dans le calcul.' };
      if (q === 0) return { tokens, derivees: ['[CO₂] = a × P(CO₂)'], texte: [...debut, 'Quelle est la concentration en ions HCO₃⁻ ?'],
        utiles: ['a', 'P', 'pH', 'pKa1'], raisons: { ...raisons, pKa2: 'Le pKa2 concerne le couple HCO₃⁻ / CO₃²⁻ : il ne sert pas pour [HCO₃⁻].' },
        cherche: { bonne: 'La concentration en ions HCO₃⁻ (en mmol/L)', faux: ['La concentration en CO₂ dissous (en mmol/L)', 'La concentration en ions CO₃²⁻ (en mmol/L)', 'Le rapport [HCO₃⁻] sur [CO₂] (sans unité)'] },
        manque: null, solution: { txt: '[HCO₃⁻] = [CO₂] × 10^(pH − pKa1), avec [CO₂] = a × P(CO₂)', val: m.hco3, u: 'mmol/L' } };
      return { tokens, derivees: ['[HCO₃⁻] = [CO₂] × 10^(pH − pKa1) et [CO₃²⁻] = [HCO₃⁻] × 10^(pH − pKa2)'], texte: [...debut, 'Combien de fois le carbone inorganique dissous total C_T = [CO₂] + [HCO₃⁻] + [CO₃²⁻] dépasse-t-il [CO₂] ?'],
        utiles: ['pH', 'pKa1', 'pKa2'], raisons: { ...raisons, a: 'La valeur de a et la pression se simplifient dans le rapport C_T sur [CO₂] : elles ne servent pas.', P: 'La valeur de a et la pression se simplifient dans le rapport C_T sur [CO₂] : elles ne servent pas.' },
        cherche: { bonne: 'Le rapport C_T sur [CO₂] (sans unité)', faux: ['Le carbone dissous total C_T (en mmol/L)', 'Le rapport [HCO₃⁻] sur [CO₂] (sans unité)', 'La concentration en CO₂ dissous (en mmol/L)'] },
        manque: null, solution: { txt: 'C_T sur [CO₂] = 1 + 10^(pH − pKa1) + 10^(2 pH − pKa1 − pKa2)', val: m.solub, u: '' } };
    },
  },
  // ───────────────────────────── Force des acides (TG) : K_A, pH, taux d'avancement
  {
    id: 'fab-sapp-ka', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Estimer la constante d’acidité d’un acide à partir du pH', noms: ['Constante d’acidité', 'Concentration en ions oxonium'],
    gen: () => { const pKa = tire([4.2, 4.4, 4.6, 4.8, 5.0]), C = tire([0.010, 0.020, 0.050, 0.10]), Ka = 10 ** -pKa, x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2, pH = Math.round(-Math.log10(x) * 100) / 100; return { C, pH, V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration apportée de l’acide', p.C, 'mol/L'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        V: tok(`${p.V} mL`, 'Volume de la solution préparée', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['On prépare ', T('V'), ' d’une solution d’un acide faible, de concentration apportée ', T('C'), ', à ', T('T'), '. Le pH-mètre indique ', T('pH'), '. '];
      const h = 10 ** -p.pH;
      if (q === 0) return { tokens, derivees: ['[H₃O⁺] = 10^(−pH) = [A⁻] ; [AH] = C − [H₃O⁺]'], texte: [...debut, 'Quelle est la constante d’acidité K_A de cet acide ?'],
        utiles: ['C', 'pH'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas dans le calcul de K_A.', T: 'La température est constante : elle n’intervient pas dans le calcul, elle indique seulement que K_A garde sa valeur.' },
        cherche: { bonne: 'La constante d’acidité K_A (sans unité)', faux: ['Le taux d’avancement final τ (sans unité)', 'Le produit ionique de l’eau K_e (sans unité)', 'Le pK_A de l’acide (sans unité)'] },
        manque: null, solution: { txt: 'K_A = [H₃O⁺]² / (C − [H₃O⁺]), avec [H₃O⁺] = 10^(−pH)', val: h * h / (p.C - h), u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en ions oxonium de la solution ?'],
        utiles: ['pH'], raisons: { C: 'La concentration apportée sert à calculer K_A ou τ, pas [H₃O⁺] : celle-ci se déduit du pH seul.', V: 'Le volume ne change pas le pH : il n’intervient pas.', T: 'La température est constante : elle n’intervient pas dans la relation entre pH et [H₃O⁺].' },
        cherche: { bonne: 'La concentration en ions oxonium [H₃O⁺] (en mol/L)', faux: ['La constante d’acidité K_A de l’acide (sans unité)', 'Le taux d’avancement final τ de la solution', 'La concentration en ions hydroxyde [HO⁻] de la solution (en mol/L)'] },
        manque: null, solution: { txt: '[H₃O⁺] = 10^(−pH)', val: h, u: 'mol/L' } };
    },
  },
  {
    id: 'fab-sapp-compar', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Comparer la force de deux acides', noms: ['Constante d’acidité de l’acide A', 'Taux d’avancement de l’acide B'],
    gen: () => {
      const fa = (pKa, C) => { const Ka = 10 ** -pKa, x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2; return Math.round(-Math.log10(x) * 100) / 100; };
      const pA = tire([4.0, 4.2, 4.4]), pB = tire([4.6, 4.8, 5.0]), CA = tire([0.010, 0.020, 0.050]), CB = tire([0.010, 0.020, 0.050, 0.10]);
      return { CA, CB, pHA: fa(pA, CA), pHB: fa(pB, CB), V: tire([100, 200, 250]) };
    },
    build: (p, q) => {
      const tokens = {
        CA: tok(`${nb(p.CA, 3)} mol/L`, 'Concentration apportée de l’acide A', p.CA, 'mol/L'), pHA: tok(`${nb(p.pHA, 2)}`, 'pH de la solution de l’acide A', p.pHA, ''),
        CB: tok(`${nb(p.CB, 3)} mol/L`, 'Concentration apportée de l’acide B', p.CB, 'mol/L'), pHB: tok(`${nb(p.pHB, 2)}`, 'pH de la solution de l’acide B', p.pHB, ''),
        V: tok(`${p.V} mL`, 'Volume prélevé pour chaque mesure de pH', p.V, 'mL'),
      };
      const debut = ['On compare deux acides faibles à 25 °C. L’acide A, de concentration apportée ', T('CA'), ', donne un pH de ', T('pHA'), '. L’acide B, de concentration apportée ', T('CB'), ', donne un pH de ', T('pHB'), '. On prélève ', T('V'), ' de chaque solution pour mesurer le pH. '];
      const hA = 10 ** -p.pHA, hB = 10 ** -p.pHB;
      if (q === 0) return { tokens, derivees: ['[H₃O⁺] = 10^(−pH) pour l’acide A'], texte: [...debut, 'Quelle est la constante d’acidité K_A de l’acide A ?'],
        utiles: ['CA', 'pHA'], raisons: { CB: 'Ces données sont celles de l’acide B : elles ne servent pas pour K_A de l’acide A.', pHB: 'Ce pH est celui de l’acide B : il ne sert pas pour K_A de l’acide A.', V: 'Le volume prélevé ne change ni le pH ni les concentrations : il n’intervient pas.' },
        cherche: { bonne: 'La constante d’acidité K_A de l’acide A (sans unité)', faux: ['La constante d’acidité K_A de l’acide B (sans unité)', 'Le taux d’avancement final de l’acide A (sans unité)', 'Le pK_A de l’acide A (sans unité)'] },
        manque: null, solution: { txt: 'K_A = [H₃O⁺]² / (C − [H₃O⁺]), avec [H₃O⁺] = 10^(−pH) de l’acide A', val: hA * hA / (p.CA - hA), u: '' } };
      return { tokens, derivees: ['[H₃O⁺] = 10^(−pH) pour l’acide B'], texte: [...debut, 'Quel est le taux d’avancement final de l’acide B ?'],
        utiles: ['CB', 'pHB'], raisons: { CA: 'Ces données sont celles de l’acide A : elles ne servent pas pour l’acide B.', pHA: 'Ce pH est celui de l’acide A : il ne sert pas pour l’acide B.', V: 'Le volume prélevé ne change ni le pH ni les concentrations : il n’intervient pas (le volume se simplifie dans τ).' },
        cherche: { bonne: 'Le taux d’avancement final τ de l’acide B (sans unité)', faux: ['Le taux d’avancement final τ de l’acide A (sans unité)', 'La constante d’acidité K_A de l’acide B (sans unité)', 'La concentration en ions oxonium de l’acide A (mol/L)'] },
        manque: null, solution: { txt: 'τ = [H₃O⁺] / C, avec [H₃O⁺] = 10^(−pH) de l’acide B', val: hB / p.CB, u: '' } };
    },
  },
  // ───────────────────────────── Couples acide-base (TG) : rapport des formes, pourcentages
  {
    id: 'pdi-sapp-couple', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Composition d’un couple acide-base à un pH donné', noms: ['Rapport des deux formes', 'Concentration de la forme basique'],
    gen: () => { const pKa = tire([3.75, 4.20, 4.76, 9.20]), d = tire([-1, -0.5, 0.5, 1, 1.5]); return { pKa, pH: Math.round((pKa + d) * 10) / 10, C: tire([0.010, 0.020, 0.050, 0.10]), V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        pKa: tok(`${nb(p.pKa, 2)}`, 'pKA du couple acide-base', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la solution', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale du couple (AH + A⁻)', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un couple acide-base AH / A⁻ de pKA égal à ', T('pKa'), ' est en solution à pH = ', T('pH'), ' ; sa concentration totale (AH + A⁻) est ', T('C'), ', dans un volume de ', T('V'), ' à ', T('T'), '. '];
      const r = 10 ** (p.pH - p.pKa);
      if (q === 0) return { tokens, derivees: ['frac([A⁻]|[AH]) = 10^(pH − pK_A)'], texte: [...debut, 'Quel est le rapport frac([A⁻]|[AH]) ?'],
        utiles: ['pKa', 'pH'], raisons: { C: 'La concentration totale ne change pas le rapport des deux formes : elle fixe seulement leurs valeurs.', V: 'Le volume n’intervient pas dans le rapport de deux concentrations.', T: 'La température est constante : elle n’intervient pas dans le calcul, elle suppose que pKA garde sa valeur.' },
        cherche: { bonne: 'Le rapport frac([A⁻]|[AH]) (sans unité)', faux: ['La concentration de A⁻ (en mol/L)', 'Le pourcentage de la forme AH (en %)', 'Le produit ionique de l’eau Ke (sans unité)'] },
        manque: null, solution: { txt: 'frac([A⁻]|[AH]) = 10^(pH − pK_A)', val: r, u: '' } };
      return { tokens, derivees: ['[A⁻] = frac(C · r|1 + r) avec r = 10^(pH − pK_A)'], texte: [...debut, 'Quelle est la concentration de la forme basique A⁻ ?'],
        utiles: ['pKa', 'pH', 'C'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas ici.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Concentration de la forme basique A⁻ (mol/L)', faux: ['Le rapport frac([A⁻]|[AH]) des deux formes (sans unité)', 'La concentration en ions oxonium (en mol/L)', 'Le pourcentage de forme basique (en %)'] },
        manque: null, solution: { txt: '[A⁻] = frac(C · r|1 + r), avec r = 10^(pH − pK_A)', val: p.C * r / (1 + r), u: 'mol/L' } };
    },
  },
  {
    id: 'pdi-sapp-indic', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Teinte d’un indicateur coloré à un pH donné', noms: ['Rapport des formes de l’indicateur', 'Pourcentage de la forme basique'],
    gen: () => { const pKa = tire([4.6, 6.8, 8.8, 11.0]), d = tire([-2, -1.5, -1, 1, 1.5, 2]); return { pKa, pH: Math.round((pKa + d) * 10) / 10, mi: tire([2, 5, 10]), T: tire([20, 25, 30]), V: tire([5, 10, 20]) }; },
    build: (p, q) => {
      const tokens = {
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKA de l’indicateur coloré', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la solution', p.pH, ''),
        mi: tok(`${p.mi} gouttes`, 'Nombre de gouttes d’indicateur versées', p.mi, ''),
        V: tok(`${p.V} mL`, 'Volume de solution testée', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un indicateur coloré HIn / In⁻ de pKA égal à ', T('pKa'), ' est ajouté (', T('mi'), ') à ', T('V'), ' d’une solution de pH ', T('pH'), ' à ', T('T'), '. '];
      const r = 10 ** (p.pH - p.pKa);
      if (q === 0) return { tokens, derivees: ['frac([In⁻]|[HIn]) = 10^(pH − pK_A)'], texte: [...debut, 'Quel est le rapport frac([In⁻]|[HIn]) ?'],
        utiles: ['pKa', 'pH'], raisons: { mi: 'Le nombre de gouttes fixe la quantité d’indicateur, pas le rapport de ses deux formes.', V: 'Le volume ne change pas un rapport de concentrations : il n’intervient pas.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le rapport frac([In⁻]|[HIn]) (sans unité)', faux: ['Le pourcentage de la forme HIn (en %)', 'La largeur de la zone de virage (en unités de pH)', 'La concentration de In⁻ (en mol/L)'] },
        manque: null, solution: { txt: 'frac([In⁻]|[HIn]) = 10^(pH − pK_A)', val: r, u: '' } };
      return { tokens, derivees: ['r = frac([In⁻]|[HIn]) = 10^(pH − pK_A)'], texte: [...debut, 'Quel est le pourcentage de la forme basique In⁻ ?'],
        utiles: ['pKa', 'pH'], raisons: { mi: 'Le nombre de gouttes ne modifie pas la proportion entre les deux formes.', V: 'Le volume n’intervient pas dans un pourcentage.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le pourcentage de forme basique In⁻ (en %)', faux: ['Le rapport frac([In⁻]|[HIn]) (sans unité)', 'Le pourcentage de la forme acide HIn (en %)', 'Le pH de début de virage (sans unité)'] },
        manque: null, solution: { txt: '% In⁻ = 100 × r / (1 + r), avec r = 10^(pH − pK_A)', val: 100 * r / (1 + r), u: '%' } };
    },
  },
  // ───────────────────────────── Solution tampon (TG) : ajout d'acide, composition à préparer
  {
    id: 'tmp-sapp-ajout', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Ajout d’acide dans une solution tampon', noms: ['Quantité d’ions oxonium ajoutés', 'Quantité de base A⁻ restante'],
    gen: () => { const n0 = tire([10, 15, 20, 25]); return { n0, nAH: n0, nA: n0, V: tire([100, 150, 200]), Ca: tire([0.10, 0.20, 0.50]), Va: tire([2.0, 5.0, 10.0]), pKa: tire([4.76, 9.20]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        nAH: tok(`${nb(p.nAH, 1)} mmol`, 'Quantité d’acide faible AH dans le tampon', p.nAH, 'mmol'),
        nA: tok(`${nb(p.nA, 1)} mmol`, 'Quantité de base conjuguée A⁻ dans le tampon', p.nA, 'mmol'),
        V: tok(`${p.V} mL`, 'Volume du tampon', p.V, 'mL'),
        Ca: tok(`${nb(p.Ca, 2)} mol/L`, 'Concentration de l’acide fort versé', p.Ca, 'mol/L'),
        Va: tok(`${nb(p.Va, 1)} mL`, 'Volume d’acide fort versé', p.Va, 'mL'),
        pKa: tok(`${nb(p.pKa, 2)}`, 'pKA du couple du tampon', p.pKa, ''),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un tampon de ', T('V'), ' contient ', T('nAH'), ' d’acide faible AH et ', T('nA'), ' de sa base conjuguée A⁻ (pKA = ', T('pKa'), ', à ', T('T'), '). On y verse ', T('Va'), ' d’acide chlorhydrique de concentration ', T('Ca'), '. '];
      const nH = p.Ca * p.Va;
      if (q === 0) return { tokens, derivees: ['n(H₃O⁺) = C × V'], texte: [...debut, 'Quelle quantité d’ions oxonium a-t-on versée ?'],
        utiles: ['Ca', 'Va'], raisons: { nAH: 'La quantité d’acide du tampon n’intervient pas dans la quantité d’ions versés.', nA: 'La quantité de base du tampon n’intervient pas dans la quantité d’ions versés.', V: 'Le volume du tampon ne change pas la quantité d’acide versée.', pKa: 'Le pKA n’intervient pas dans une quantité de matière versée.', T: 'La température est constante : elle n’intervient pas dans ce calcul.' },
        cherche: { bonne: 'La quantité d’ions oxonium versés (en mmol)', faux: ['Le pH du tampon après l’ajout (sans unité)', 'La concentration de l’acide faible AH (en mol/L)', 'Le volume total de la solution (en mL)'] },
        manque: null, solution: { txt: 'n(H₃O⁺) = C × V', val: nH, u: 'mmol' } };
      return { tokens, derivees: ['n(H₃O⁺) versé = C × V', 'n(A⁻) restant = n(A⁻) initial − n(H₃O⁺) versé'], texte: [...debut, 'Quelle quantité de base A⁻ reste-t-il après la réaction avec l’acide versé ?'],
        utiles: ['nA', 'Ca', 'Va'], raisons: { nAH: 'La forme acide AH n’est pas consommée par un acide : elle n’intervient pas dans la quantité de A⁻ restante.', V: 'Le volume du tampon ne change pas les quantités de matière.', pKa: 'Le pKA n’intervient pas dans un bilan de quantités de matière.', T: 'La température est constante : elle n’intervient pas dans ce bilan.' },
        cherche: { bonne: 'La quantité de base A⁻ restante (en mmol)', faux: ['La quantité d’acide AH formée (en mmol)', 'La quantité d’ions oxonium versés (en mmol)', 'Le pH du tampon après l’ajout (sans unité)'] },
        manque: null, solution: { txt: 'n(A⁻) = n(A⁻) initial − C × V', val: p.nA - nH, u: 'mmol' } };
    },
  },
  {
    id: 'tmp-sapp-prepa', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Préparer un tampon de pH donné', noms: ['Rapport des quantités à introduire', 'Quantité de base A⁻ à introduire'],
    gen: () => { const pKa = tire([4.76, 9.20]), d = tire([-0.7, -0.5, -0.3, 0.3, 0.5, 0.7]); return { pKa, pH: Math.round((pKa + d) * 10) / 10, nAH: tire([10, 20, 25, 50]), V: tire([100, 250, 500]), Cs: tire([0.10, 0.50, 1.0]) }; },
    build: (p, q) => {
      const tokens = {
        pKa: tok(`${nb(p.pKa, 2)}`, 'pKA du couple acide-base choisi', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH visé pour le tampon', p.pH, ''),
        nAH: tok(`${p.nAH} mmol`, 'Quantité d’acide faible AH introduite', p.nAH, 'mmol'),
        V: tok(`${p.V} mL`, 'Volume du tampon à préparer', p.V, 'mL'),
        Cs: tok(`${nb(p.Cs, 2)} mol/L`, 'Concentration de la solution de base A⁻ disponible', p.Cs, 'mol/L'),
      };
      const debut = ['On veut préparer ', T('V'), ' d’un tampon de pH ', T('pH'), ' avec un couple acide-base de pKA égal à ', T('pKa'), '. On introduit ', T('nAH'), ' d’acide faible AH ; la base conjuguée A⁻ est disponible en solution à ', T('Cs'), '. '];
      const r = 10 ** (p.pH - p.pKa);
      if (q === 0) return { tokens, derivees: ['n(A⁻) / n(AH) = 10^(pH − pKA)'], texte: [...debut, 'Quel rapport n(A⁻) / n(AH) faut-il réaliser ?'],
        utiles: ['pKa', 'pH'], raisons: { nAH: 'La quantité d’acide fixe la valeur de n(A⁻), mais pas le rapport demandé.', V: 'Le volume ne change pas un rapport de quantités de matière.', Cs: 'La concentration de la solution de base n’intervient pas dans le rapport.' },
        cherche: { bonne: 'Le rapport n(A⁻) / n(AH) (sans unité)', faux: ['La quantité de A⁻ à introduire (en mmol)', 'Le volume de solution de base à verser (en mL)', 'La concentration de AH dans le tampon (en mol/L)'] },
        manque: null, solution: { txt: 'n(A⁻) / n(AH) = 10^(pH − pKA)', val: r, u: '' } };
      return { tokens, derivees: ['n(A⁻) = n(AH) × 10^(pH − pKA)'], texte: [...debut, 'Quelle quantité de base A⁻ faut-il introduire ?'],
        utiles: ['pKa', 'pH', 'nAH'], raisons: { V: 'Le volume du tampon ne change pas le rapport des quantités ni n(A⁻).', Cs: 'La concentration de la solution de base ne sert qu’à convertir n(A⁻) en volume, ce que l’on ne demande pas ici.' },
        cherche: { bonne: 'La quantité de base A⁻ à introduire (en mmol)', faux: ['Le rapport n(A⁻) / n(AH) (sans unité)', 'Le volume de solution de base à verser (en mL)', 'La concentration de A⁻ dans le tampon (en mol/L)'] },
        manque: null, solution: { txt: 'n(A⁻) = n(AH) × 10^(pH − pKA)', val: p.nAH * r, u: 'mmol' } };
    },
  },
  // ───────────────────────────── Acides α-aminés (TG, sim 134) : rapport des formes et pourcentages près d’une frontière
  {
    id: 'aam-sapp-cation', domaine: 'Acides α-aminés : forme selon le pH', titre: 'Cation et zwitterion d’un acide α-aminé', noms: ['Rapport zwitterion / cation', 'Pourcentage de cation'],
    gen: () => { const a = AAM[tire(AAM_ORDRE)], d = tire([-1, -0.5, 0.5, 1, 1.5]); return { ac: a.id, pKa1: a.pKa1, pKa2: a.pKa2, pH: Math.round((a.pKa1 + d) * 10) / 10, C: tire([0.010, 0.020, 0.050, 0.10]), V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const a = AAM[p.ac];
      const tokens = {
        pKa1: tok(`${nb(p.pKa1, 2)}`, 'pKA1 du couple cation / zwitterion (groupe –COOH)', p.pKa1, ''),
        pKa2: tok(`${nb(p.pKa2, 2)}`, 'pKA2 du couple zwitterion / anion (groupe –NH₃⁺)', p.pKa2, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH imposé à la solution', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale en acide α-aminé', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Pour la ', a.nom, ', les constantes d’acidité sont pKA1 = ', T('pKa1'), ' et pKA2 = ', T('pKa2'), '. La solution, de concentration totale ', T('C'), ' et de volume ', T('V'), ' à ', T('T'), ', a un pH imposé égal à ', T('pH'), '. '];
      const r = 10 ** (p.pH - p.pKa1);
      if (q === 0) return { tokens, derivees: ['[zwitterion] / [cation] = 10^(pH − pKA1)'], texte: [...debut, 'Quel est le rapport [zwitterion] / [cation] ?'],
        utiles: ['pKa1', 'pH'], raisons: { pKa2: 'pKA2 est trop éloigné du pH : près de pKA1, on lit seulement le couple cation / zwitterion.', C: 'La concentration totale ne change pas le rapport des deux formes : elle fixe seulement leurs valeurs.', V: 'Le volume n’intervient pas dans un rapport de deux concentrations.', T: 'La température est constante : elle suppose seulement que pKA garde sa valeur.' },
        cherche: { bonne: 'Le rapport [zwitterion] / [cation] (sans unité)', faux: ['La concentration du zwitterion (en mol/L)', 'Le pourcentage de cation (en %)', 'Le pH de la solution (sans unité)'] },
        manque: null, solution: { txt: '[zwitterion] / [cation] = 10^(pH − pKA1)', val: r, u: '' } };
      return { tokens, derivees: ['% cation = 100 / (1 + r) avec r = 10^(pH − pKA1)'], texte: [...debut, 'Quel pourcentage de l’acide α-aminé est sous forme de cation ? (la forme anionique est négligeable à ce pH)'],
        utiles: ['pKa1', 'pH'], raisons: { pKa2: 'pKA2 est trop éloigné du pH : l’anion est négligeable, on ne lit que le couple 1.', C: 'Un pourcentage ne dépend pas de la concentration totale.', V: 'Le volume ne change pas une proportion.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le pourcentage de cation (en %)', faux: ['Le rapport [zwitterion] / [cation] (sans unité)', 'La concentration du cation (en mol/L)', 'Le pourcentage d’anion (en %)'] },
        manque: null, solution: { txt: '% cation = 100 / (1 + r), avec r = 10^(pH − pKA1)', val: 100 / (1 + r), u: '%' } };
    },
  },
  {
    id: 'aam-sapp-anion', domaine: 'Acides α-aminés : forme selon le pH', titre: 'Zwitterion et anion d’un acide α-aminé en solution basique', noms: ['Rapport anion / zwitterion', 'Concentration de l’anion'],
    gen: () => { const a = AAM[tire(AAM_ORDRE)], d = tire([-1.5, -1, -0.5, 0.5, 1]); return { ac: a.id, pKa1: a.pKa1, pKa2: a.pKa2, pH: Math.round((a.pKa2 + d) * 10) / 10, C: tire([0.010, 0.020, 0.050, 0.10]), V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const a = AAM[p.ac];
      const tokens = {
        pKa1: tok(`${nb(p.pKa1, 2)}`, 'pKA1 du couple cation / zwitterion (groupe –COOH)', p.pKa1, ''),
        pKa2: tok(`${nb(p.pKa2, 2)}`, 'pKA2 du couple zwitterion / anion (groupe –NH₃⁺)', p.pKa2, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH imposé à la solution', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale en acide α-aminé', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Pour la ', a.nom, ', les constantes d’acidité sont pKA1 = ', T('pKa1'), ' et pKA2 = ', T('pKa2'), '. La solution, de concentration totale ', T('C'), ' et de volume ', T('V'), ' à ', T('T'), ', a un pH imposé égal à ', T('pH'), '. '];
      const r = 10 ** (p.pH - p.pKa2);
      if (q === 0) return { tokens, derivees: ['[anion] / [zwitterion] = 10^(pH − pKA2)'], texte: [...debut, 'Quel est le rapport [anion] / [zwitterion] ?'],
        utiles: ['pKa2', 'pH'], raisons: { pKa1: 'pKA1 est trop éloigné du pH : près de pKA2, on lit seulement le couple zwitterion / anion.', C: 'La concentration totale ne change pas le rapport des deux formes.', V: 'Le volume n’intervient pas dans un rapport de deux concentrations.', T: 'La température est constante : elle suppose seulement que pKA garde sa valeur.' },
        cherche: { bonne: 'Le rapport [anion] / [zwitterion] (sans unité)', faux: ['La concentration de l’anion (en mol/L)', 'Le pourcentage de zwitterion (en %)', 'Le pH de la solution (sans unité)'] },
        manque: null, solution: { txt: '[anion] / [zwitterion] = 10^(pH − pKA2)', val: r, u: '' } };
      return { tokens, derivees: ['[anion] = C × r / (1 + r) avec r = 10^(pH − pKA2)'], texte: [...debut, 'Quelle est la concentration de l’anion ? (la forme cationique est négligeable à ce pH)'],
        utiles: ['pKa2', 'pH', 'C'], raisons: { pKa1: 'pKA1 est trop éloigné du pH : le cation est négligeable, on ne lit que le couple 2.', V: 'Le volume ne change pas les concentrations : il n’intervient pas ici.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'La concentration de l’anion (en mol/L)', faux: ['Le rapport [anion] / [zwitterion] (sans unité)', 'La concentration en ions oxonium (en mol/L)', 'Le pourcentage d’anion (en %)'] },
        manque: null, solution: { txt: '[anion] = C × r / (1 + r), avec r = 10^(pH − pKA2)', val: p.C * r / (1 + r), u: 'mol/L' } };
    },
  },
  // ───────────────────────────── Conductimétrie (TG, sim 135) : conductivité d’une solution et titrage conductimétrique
  {
    id: 'cdt-sapp-sel', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Conductivité d’une solution de sel', noms: ['Conductivité de la solution', 'Concentration à partir de la conductivité'],
    gen: () => { const s = tire(CDT_SELS); return { s, C: tire([0.0020, 0.0030, 0.0040, 0.0050, 0.0080]), V: tire([100, 250, 500]) }; },
    build: (p, q) => {
      const s = p.s, lc = CDT_IONS[s.cat].lambda, la = CDT_IONS[s.an].lambda, somme = lc + la;
      const sigma = Math.round(somme * p.C * 1000 * 10) / 10;
      const tokens = {
        lc: tok(`${nb(lc, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${CDT_IONS[s.cat].f} à 25 °C`, lc, 'mS·m²·mol⁻¹'),
        la: tok(`${nb(la, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${CDT_IONS[s.an].f} à 25 °C`, la, 'mS·m²·mol⁻¹'),
        C: tok(`${nb(p.C, 4)} mol/L`, 'Concentration en soluté apporté', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        sigma: tok(`${nb(sigma, 1)} mS·m⁻¹`, 'Conductivité mesurée à 25 °C', sigma, 'mS·m⁻¹'),
      };
      const debut = ['Une solution de ', s.nom, ' (', s.f, ', totalement dissocié en ', CDT_IONS[s.cat].f, ' et ', CDT_IONS[s.an].f, ') est diluée : ', 'λ(', CDT_IONS[s.cat].f, ') = ', T('lc'), ' et λ(', CDT_IONS[s.an].f, ') = ', T('la'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'cm', nom: 'Concentration en mol·m⁻³ (1 mol/L = 1 000 mol·m⁻³)', expr: 'c × 1 000', val: p.C * 1000, u: 'mol·m⁻³' }], texte: [...debut, 'La solution, de concentration ', T('C'), ', occupe un volume de ', T('V'), '. Quelle est sa conductivité ?'],
        utiles: ['lc', 'la', 'C'], raisons: { V: 'Le volume ne change pas la concentration, donc pas la conductivité : σ dépend des concentrations, pas de la quantité de solution.' },
        cherche: { bonne: 'La conductivité σ (en mS·m⁻¹)', faux: ['La concentration du soluté (en mol/L)', 'La conductivité ionique molaire du soluté (en mS·m²·mol⁻¹)', 'La résistance électrique de la cellule (en Ω)'] },
        manque: null, solution: { txt: 'σ = (λ(cation) + λ(anion)) × c, avec c en mol·m⁻³', val: somme * p.C * 1000, u: 'mS·m⁻¹' } };
      return { tokens, derivees: [{ id: 'som', nom: 'Somme des conductivités ioniques molaires', expr: 'λ(cation) + λ(anion)', val: somme, u: 'mS·m²·mol⁻¹' }], texte: [...debut, 'La conductivité mesurée vaut ', T('sigma'), ' ; le volume de solution est ', T('V'), '. Quelle est la concentration du soluté ?'],
        utiles: ['lc', 'la', 'sigma'], raisons: { V: 'Le volume ne change pas une concentration : on la déduit de σ et des conductivités ioniques molaires.' },
        cherche: { bonne: 'La concentration du soluté (en mol/L)', faux: ['La conductivité de la solution (en mS·m⁻¹)', 'La quantité de soluté dissous (en mmol)', 'La conductivité ionique molaire de la solution (en mS·m²·mol⁻¹)'] },
        manque: null, solution: { txt: 'c = σ / (λ(cation) + λ(anion)) = en mol·m⁻³, soit en mol/L après division par 1 000', val: sigma / somme / 1000, u: 'mol/L' } };
    },
  },
  {
    id: 'cdt-sapp-equiv', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Volume équivalent d’un titrage conductimétrique', noms: ['Concentration de l’acide', 'Quantité d’ions HO⁻ versée à l’équivalence'],
    gen: () => ({ cB: tire([0.050, 0.100, 0.200]), VA: tire([10.0, 20.0, 25.0]), VE: tire([8.0, 10.5, 12.0, 14.5, 16.0]), eau: tire([150, 180, 190]) }),
    build: (p, q) => {
      const tokens = {
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de la prise d’essai d’acide', p.VA, 'mL'),
        eau: tok(`${p.eau} mL`, 'Volume d’eau ajouté avant le titrage', p.eau, 'mL'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, 'Concentration de la solution d’hydroxyde de sodium', p.cB, 'mol/L'),
        VE: tok(`${nb(p.VE, 1)} mL`, 'Volume équivalent lu à la rupture de pente de la courbe', p.VE, 'mL'),
      };
      const debut = ['On titre une prise d’essai de ', T('VA'), ' d’acide chlorhydrique, de concentration cA inconnue, diluée dans ', T('eau'), ' d’eau, par une solution d’hydroxyde de sodium de concentration ', T('cB'), '. Le suivi de la conductivité donne une rupture de pente pour un volume versé ', T('VE'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'nHO', nom: 'Quantité d’ions HO⁻ versée à l’équivalence', expr: 'n(HO⁻) = cB × VE', val: p.cB * p.VE, u: 'mmol' }], texte: [...debut, 'Quelle est la concentration cA de l’acide ?'],
        utiles: ['VA', 'cB', 'VE'], raisons: { eau: 'L’eau ajoutée dilue l’acide mais ne change pas sa quantité de matière : elle ne sert pas au calcul de cA.' },
        cherche: { bonne: 'La concentration cA de l’acide (en mol/L)', faux: ['La quantité d’acide titré (en mmol)', 'La concentration de la solution de soude (en mol/L)', 'La concentration de l’acide après dilution (en mol/L)'] },
        manque: null, solution: { txt: 'cA = cB × VE / VA (quantités égales à l’équivalence)', val: p.cB * p.VE / p.VA, u: 'mol/L' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle quantité d’ions HO⁻ a-t-on versée à l’équivalence ?'],
        utiles: ['cB', 'VE'], raisons: { VA: 'La prise d’essai sert à calculer la concentration de l’acide, pas la quantité de HO⁻ versée.', eau: 'L’eau de dilution ne contient pas d’ions HO⁻ : elle n’intervient pas.' },
        cherche: { bonne: 'La quantité n(HO⁻) versée (en mmol)', faux: ['La concentration en ions HO⁻ dans le bécher (en mol/L)', 'La quantité d’ions H₃O⁺ restants (en mmol)', 'Le volume équivalent (en mL)'] },
        manque: null, solution: { txt: 'n(HO⁻) = cB × VE (mol/L × mL = mmol)', val: p.cB * p.VE, u: 'mmol' } };
    },
  },
  {
    id: 'cdt-sapp-pente', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Variation de la conductivité en cours de titrage', noms: ['Variation de σ avant l’équivalence', 'Variation de σ après l’équivalence'],
    gen: () => ({ dn: tire([0.10, 0.20, 0.30, 0.50]), Vt: tire([200, 210, 220, 250]), acide: tire(['chlorhydrique', 'nitrique']) }),
    build: (p, q) => {
      const an = p.acide === 'chlorhydrique' ? 'Cl' : 'NO3', I = CDT_IONS;
      const tokens = {
        dn: tok(`${nb(p.dn, 2)} mmol`, 'Quantité d’ions HO⁻ ajoutée', p.dn, 'mmol'),
        Vt: tok(`${p.Vt} mL`, 'Volume total de la solution (supposé constant)', p.Vt, 'mL'),
        lH: tok(`${nb(I.H3O.lambda, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de H₃O⁺', I.H3O.lambda, 'mS·m²·mol⁻¹'),
        lNa: tok(`${nb(I.Na.lambda, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de Na⁺', I.Na.lambda, 'mS·m²·mol⁻¹'),
        lHO: tok(`${nb(I.HO.lambda, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de HO⁻', I.HO.lambda, 'mS·m²·mol⁻¹'),
        lAn: tok(`${nb(I[an].lambda, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${I[an].f}`, I[an].lambda, 'mS·m²·mol⁻¹'),
      };
      const fac = 1000 * p.dn / p.Vt;
      const debut = ['On titre une solution d’acide ', p.acide, ' par la soude (Na⁺, HO⁻). Conductivités ioniques molaires à 25 °C : λ(H₃O⁺) = ', T('lH'), ', λ(Na⁺) = ', T('lNa'), ', λ(HO⁻) = ', T('lHO'), ' et λ(', I[an].f, ') = ', T('lAn'), '. On ajoute ', T('dn'), ' d’ions HO⁻ ; le volume total, ', T('Vt'), ', est supposé constant. '];
      if (q === 0) return { tokens, derivees: [{ id: 'dc', nom: 'Variation de concentration en mol·m⁻³ (1 mmol/mL = 1 000 mol·m⁻³)', expr: 'Δc = 1 000 × Δn / Vt', val: fac, u: 'mol·m⁻³' }], texte: [...debut, 'Avant l’équivalence, chaque ion HO⁻ réagit avec un ion H₃O⁺ et un ion Na⁺ apparaît. Quelle est la variation de la conductivité ?'],
        utiles: ['lH', 'lNa', 'dn', 'Vt'], raisons: { lHO: 'Avant l’équivalence, HO⁻ est consommé : il ne reste pas en solution, sa conductivité ionique molaire n’intervient pas.', lAn: 'L’ion spectateur ne change pas : sa concentration reste la même (à volume constant).' },
        cherche: { bonne: 'La variation Δσ de la conductivité (en mS·m⁻¹)', faux: ['La conductivité σ finale de la solution (en mS·m⁻¹)', 'La variation de la quantité d’ions Na⁺ (en mmol)', 'La variation du pH de la solution (sans unité)'] },
        manque: null, solution: { txt: 'Δσ = (λ(Na⁺) − λ(H₃O⁺)) × Δc, avec Δc = Δn / Vt en mol·m⁻³', val: (I.Na.lambda - I.H3O.lambda) * fac, u: 'mS·m⁻¹' } };
      return { tokens, derivees: [{ id: 'dc', nom: 'Variation de concentration en mol·m⁻³ (1 mmol/mL = 1 000 mol·m⁻³)', expr: 'Δc = 1 000 × Δn / Vt', val: fac, u: 'mol·m⁻³' }], texte: [...debut, 'Après l’équivalence, les ions HO⁻ ajoutés ne réagissent plus : ils s’accumulent avec les ions Na⁺ correspondants. Quelle est la variation de la conductivité ?'],
        utiles: ['lNa', 'lHO', 'dn', 'Vt'], raisons: { lH: 'Après l’équivalence, il n’y a plus d’ions H₃O⁺ à consommer : cet ion n’intervient pas dans la variation.', lAn: 'L’ion spectateur ne change pas : sa concentration reste la même (à volume constant).' },
        cherche: { bonne: 'La variation Δσ de la conductivité (en mS·m⁻¹)', faux: ['La conductivité σ finale de la solution (en mS·m⁻¹)', 'La variation de la quantité d’ions HO⁻ (en mmol)', 'La variation du volume équivalent (en mL)'] },
        manque: null, solution: { txt: 'Δσ = (λ(Na⁺) + λ(HO⁻)) × Δc, avec Δc = Δn / Vt en mol·m⁻³', val: (I.Na.lambda + I.HO.lambda) * fac, u: 'mS·m⁻¹' } };
    },
  },
  {
    id: 'cdt-sapp-compo', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Composition après l’équivalence d’un titrage', noms: ['Quantité d’ions HO⁻ restants', 'Concentration en ions HO⁻'],
    gen: () => ({ cA: tire([0.040, 0.050, 0.060]), VA: 20.0, cB: 0.100, VB: tire([14.0, 16.0, 18.0]), eau: tire([150, 180]) }),
    build: (p, q) => {
      const tokens = {
        cA: tok(`${nb(p.cA, 3)} mol/L`, 'Concentration de l’acide chlorhydrique titré', p.cA, 'mol/L'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de la prise d’essai d’acide', p.VA, 'mL'),
        eau: tok(`${p.eau} mL`, 'Volume d’eau ajouté avant le titrage', p.eau, 'mL'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, 'Concentration de la solution d’hydroxyde de sodium', p.cB, 'mol/L'),
        VB: tok(`${nb(p.VB, 1)} mL`, 'Volume de soude versé', p.VB, 'mL'),
      };
      const reste = p.cB * p.VB - p.cA * p.VA, Vt = p.VA + p.eau + p.VB;
      const debut = ['Une prise d’essai de ', T('VA'), ' d’acide chlorhydrique à ', T('cA'), ' est diluée dans ', T('eau'), ' d’eau, puis titrée par de la soude à ', T('cB'), '. On a versé ', T('VB'), ' de soude, soit plus que le volume équivalent (la transformation est totale). '];
      if (q === 0) return { tokens, derivees: [{ id: 'nH', nom: 'Quantité initiale d’ions H₃O⁺', expr: 'n(H₃O⁺) = cA × VA', val: p.cA * p.VA, u: 'mmol' }, { id: 'nB', nom: 'Quantité d’ions HO⁻ versée', expr: 'n(HO⁻) = cB × VB', val: p.cB * p.VB, u: 'mmol' }], texte: [...debut, 'Quelle quantité d’ions HO⁻ reste-t-il dans le bécher ?'],
        utiles: ['cA', 'VA', 'cB', 'VB'], raisons: { eau: 'L’eau de dilution ne change pas les quantités de matière : elle intervient seulement dans les concentrations.' },
        cherche: { bonne: 'La quantité n(HO⁻) restante (en mmol)', faux: ['La concentration en HO⁻ dans le bécher (en mol/L)', 'La quantité d’ions H₃O⁺ du départ (en mmol)', 'La quantité d’ions HO⁻ versés (en mmol)'] },
        manque: null, solution: { txt: 'n(HO⁻) restant = cB × VB − cA × VA', val: reste, u: 'mmol' } };
      return { tokens, derivees: [{ id: 'nres', nom: 'Quantité d’ions HO⁻ restants', expr: 'n(HO⁻) = cB × VB − cA × VA', val: reste, u: 'mmol' }, { id: 'Vt', nom: 'Volume total du bécher', expr: 'VA + volume d’eau + VB', val: Vt, u: 'mL' }], texte: [...debut, 'Quelle est la concentration en ions HO⁻ dans le bécher ?'],
        utiles: ['cA', 'VA', 'eau', 'cB', 'VB'], raisons: {},
        cherche: { bonne: 'La concentration en HO⁻ (en mol/L)', faux: ['La quantité d’ions HO⁻ restants (en mmol)', 'La concentration de la soude versée (en mol/L)', 'La concentration en ions Na⁺ (en mol/L)'] },
        manque: null, solution: { txt: '[HO⁻] = (cB × VB − cA × VA) / (VA + volume d’eau + VB) ; mmol / mL = mol/L', val: reste / Vt, u: 'mol/L' } };
    },
  },
  // ───────────────────────────── Conductimétrie (TG, sim 136) : étalonnage, conductance et constante de cellule
  {
    id: 'etl-sapp-cellule', domaine: 'Conductimétrie : étalonnage et conductance', titre: 'Constante de cellule et conductivité d’une solution', noms: ['Constante de la cellule', 'Conductivité d’une solution à partir de sa conductance'],
    gen: () => { const k = tire([50, 60, 80, 100]); return { k, Ge: Number((141 / k).toPrecision(3)), Gx: tire([0.60, 0.85, 1.20, 1.55]) }; },
    build: (p, q) => {
      const tokens = {
        sE: tok('141 mS·m⁻¹', 'Conductivité de la solution étalon de chlorure de potassium (écrite sur le flacon)', 141, 'mS·m⁻¹'),
        Ge: tok(`${nb(p.Ge, 3)} mS`, 'Conductance de la solution étalon, mesurée avec la cellule', p.Ge, 'mS'),
        Gx: tok(`${nb(p.Gx, 2)} mS`, 'Conductance de la solution à étudier, mesurée avec la même cellule', p.Gx, 'mS'),
        k: tok(`${p.k} m⁻¹`, 'Constante de la cellule', p.k, 'm⁻¹'),
      };
      const debut = ['Un conductimètre mesure une conductance G ; la conductivité σ s’en déduit grâce à la constante de cellule k. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La cellule plonge dans une solution étalon de conductivité ', T('sE'), ' : elle affiche ', T('Ge'), '. Avec la même cellule, une autre solution affiche ', T('Gx'), '. Quelle est la constante de la cellule ?'],
        utiles: ['sE', 'Ge'], raisons: { Gx: 'La conductance de la solution étudiée ne sert pas à étalonner la cellule : l’étalonnage utilise la solution de conductivité connue.' },
        cherche: { bonne: 'La constante de cellule k (en m⁻¹)', faux: ['La conductivité de la solution étudiée (en mS·m⁻¹)', 'La concentration de la solution étudiée (en mmol/L)', 'La conductance de la cellule dans l’air (en mS)'] },
        manque: null, solution: { txt: 'k = σ(étalon) / G(étalon) (des mS·m⁻¹ divisés par des mS donnent des m⁻¹)', val: 141 / p.Ge, u: 'm⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'La cellule, de constante ', T('k'), ', plonge dans une solution étalon de conductivité ', T('sE'), ' (conductance ', T('Ge'), ') puis dans une solution à étudier. Cette dernière affiche ', T('Gx'), '. Quelle est sa conductivité ?'],
        utiles: ['k', 'Gx'], raisons: { sE: 'La conductivité de l’étalon a déjà servi à déterminer k : elle ne sert pas à calculer celle de la solution étudiée.', Ge: 'La conductance de l’étalon a déjà servi à déterminer k : elle n’intervient plus.' },
        cherche: { bonne: 'La conductivité σ de la solution étudiée (en mS·m⁻¹)', faux: ['La constante de cellule k (en m⁻¹)', 'La concentration de la solution étudiée (en mmol/L)', 'La conductance de la solution à 25 °C (en mS)'] },
        manque: null, solution: { txt: 'σ = k × G (des m⁻¹ multipliés par des mS donnent des mS·m⁻¹)', val: p.k * p.Gx, u: 'mS·m⁻¹' } };
    },
  },
  {
    id: 'etl-sapp-droite', domaine: 'Conductimétrie : étalonnage et conductance', titre: 'Doser avec une droite d’étalonnage', noms: ['Concentration lue sur la droite d’étalonnage', 'Concentration de la solution avant dilution'],
    gen: () => ({ a: tire([0.095, 0.120, 0.155, 0.210]), G: tire([0.45, 0.62, 0.78, 0.93]), F: tire([10, 20, 25, 50]) }),
    build: (p, q) => {
      const tokens = {
        a: tok(`${nb(p.a, 3)} mS par mmol/L`, 'Coefficient directeur de la droite d’étalonnage G = a × c (droite passant par l’origine)', p.a, 'mS·L·mmol⁻¹'),
        G: tok(`${nb(p.G, 2)} mS`, 'Conductance de la solution diluée, mesurée avec la même cellule que les étalons', p.G, 'mS'),
        F: tok(`${p.F}`, 'Facteur de dilution (volume final divisé par volume prélevé)', p.F, ''),
      };
      const debut = ['On trace la droite d’étalonnage G = a × c avec des étalons dilués (c inférieure à 10 mmol/L) : son coefficient directeur vaut ', T('a'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La solution diluée affiche ', T('G'), ', mesurée avec la même cellule. Le facteur de dilution est ', T('F'), '. Quelle est la concentration de la solution diluée ?'],
        utiles: ['a', 'G'], raisons: { F: 'Le facteur de dilution sert à remonter à la solution de départ, pas à lire la concentration de la solution diluée.' },
        cherche: { bonne: 'La concentration de la solution diluée (en mmol/L)', faux: ['La concentration de la solution de départ (en mol/L)', 'La conductivité de la solution diluée (en mS·m⁻¹)', 'La constante de la cellule (en m⁻¹)'] },
        manque: null, solution: { txt: 'c = G / a (G en mS, a en mS par mmol/L, donc c en mmol/L)', val: p.G / p.a, u: 'mmol/L' } };
      return { tokens, derivees: [{ id: 'cd', nom: 'Concentration de la solution diluée', expr: 'c′ = G / a', val: p.G / p.a, u: 'mmol/L' }], texte: [...debut, 'La solution étudiée a été diluée ', T('F'), ' fois ; la solution diluée affiche ', T('G'), '. Quelle est la concentration de la solution de départ ?'],
        utiles: ['a', 'G', 'F'], raisons: {},
        cherche: { bonne: 'La concentration de la solution de départ (en mol/L)', faux: ['La concentration de la solution diluée (en mmol/L)', 'La conductance de la solution de départ (en mS)', 'La quantité de soluté dans la solution diluée (en mmol)'] },
        manque: null, solution: { txt: 'c(S) = F × G / a, en mmol/L, puis ÷ 1 000 pour obtenir des mol/L', val: p.F * p.G / p.a / 1000, u: 'mol/L' } };
    },
  },
  // ───────────────────────────── Pile (TG) : capacité à partir de la constitution initiale, durée de fonctionnement
  {
    id: 'pil-sapp-capacite', domaine: 'Piles : fonctionnement et capacité', titre: 'Capacité d’une pile zinc-cuivre', noms: ['Quantité d’ions cuivre initiale', 'Capacité électrique de la pile'],
    gen: () => ({ c: tire([0.050, 0.10, 0.20]), V: tire([50, 100, 150]), m: tire([3.0, 4.0, 5.0]), V2: tire([100, 150, 200]), U: tire([1.08, 1.10]), T: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        c: tok(`${nb(p.c, 2)} mol/L`, 'Concentration de la solution de sulfate de cuivre', p.c, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de la solution de sulfate de cuivre', p.V / 1000, 'L'),
        m: tok(`${nb(p.m, 1)} g`, 'Masse de la partie immergée de la lame de zinc', p.m, 'g'),
        M: tok('65,4 g/mol', 'Masse molaire du zinc', 65.4, 'g/mol'),
        V2: tok(`${p.V2} mL`, 'Volume de la solution de sulfate de zinc', p.V2 / 1000, 'L'),
        U: tok(`${nb(p.U, 2)} V`, 'Tension à vide mesurée', p.U, 'V'),
        T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
        F: tok('9,65 × 10⁴ C/mol', 'Charge d’une mole d’électrons (constante de Faraday)', 96500, 'C/mol'),
      };
      const debut = ['Une pile est formée d’une lame de cuivre plongeant dans ', T('V'), ' de solution de sulfate de cuivre à ', T('c'), ', et d’une lame de zinc (partie immergée : ', T('m'), ' ; M(Zn) = ', T('M'),
        ') plongeant dans ', T('V2'), ' de solution de sulfate de zinc. Un pont salin relie les deux solutions ; à ', T('T'), ', sa tension à vide vaut ', T('U'),
        '. Réaction de fonctionnement : Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s) ; F = ', T('F'), '. '];
      const nCu = p.c * p.V / 1000;
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité d’ions Cu²⁺ la pile contient-elle au départ ?'],
        utiles: ['c', 'V'], raisons: { m: 'La masse de zinc concerne l’autre réactif, pas les ions Cu²⁺.', M: 'La masse molaire du zinc ne sert qu’à calculer la quantité de zinc.', V2: 'Ce volume est celui de la solution de sulfate de zinc, pas de la solution d’ions Cu²⁺.', U: 'La tension à vide ne renseigne pas sur une quantité de matière.', T: 'La température n’intervient pas dans le calcul d’une quantité de matière.', F: 'La constante de Faraday sert à passer aux charges électriques, pas à compter les ions.' },
        cherche: { bonne: 'La quantité initiale d’ions Cu²⁺ (en mol)', faux: ['La capacité électrique de la pile (en C)', 'La quantité de zinc de la lame (en mol)', 'La concentration finale en ions Zn²⁺ (en mol/L)'] },
        manque: null, solution: { txt: 'n(Cu²⁺) = c × V', val: nCu, u: 'mol' } };
      return { tokens, derivees: [{ id: 'nCu', nom: 'Quantité initiale d’ions Cu²⁺', expr: 'n(Cu²⁺) = c × V', val: nCu, u: 'mol' }, { id: 'nZn', nom: 'Quantité initiale de zinc', expr: 'n(Zn) = frac(m|M)', val: p.m / 65.4, u: 'mol' }, { id: 'ne', nom: 'Quantité d’électrons échangés (réactif limitant)', expr: 'n(e⁻) = 2 × x_max', val: 2 * Math.min(nCu, p.m / 65.4), u: 'mol' }], texte: [...debut, 'Quelle est la capacité électrique de cette pile ?'],
        utiles: ['c', 'V', 'm', 'M', 'F'], raisons: { V2: 'Le volume de la solution de sulfate de zinc ne change pas la quantité des réactifs Zn et Cu²⁺.', U: 'La tension à vide ne dépend pas de la quantité de réactifs : elle ne sert pas à calculer la capacité.', T: 'La température n’intervient pas dans le bilan de matière.' },
        cherche: { bonne: 'La capacité Q de la pile (en C)', faux: ['La tension à vide de la pile (en V)', 'La quantité initiale d’ions Cu²⁺ (en mol)', 'La masse de cuivre déposée (en g)'] },
        manque: null, solution: { txt: 'Q = n(e⁻) × F = 2 × x_max × F', val: 2 * Math.min(nCu, p.m / 65.4) * 96500, u: 'C' } };
    },
  },
  {
    id: 'pil-sapp-duree', domaine: 'Piles : fonctionnement et capacité', titre: 'Combien de temps la pile fonctionnera-t-elle ?', noms: ['Durée de fonctionnement', 'Charge déjà débitée'],
    gen: () => ({ Q: tire([1200, 1900, 2900, 3900]), I: tire([20, 40, 50, 80]), t: tire([2.0, 3.0, 4.0]), U: tire([1.10, 0.78, 1.53]), mp: tire([180, 250, 320]) }),
    build: (p, q) => {
      const tokens = {
        Q: tok(`${nb(p.Q)} C`, 'Capacité électrique de la pile', p.Q, 'C'),
        I: tok(`${p.I} mA`, 'Intensité du courant débité (constante)', p.I / 1000, 'A'),
        t: tok(`${nb(p.t, 1)} h`, 'Durée de fonctionnement déjà écoulée', p.t * 3600, 's'),
        U: tok(`${nb(p.U, 2)} V`, 'Tension à vide de la pile', p.U, 'V'),
        mp: tok(`${p.mp} g`, 'Masse totale du montage', p.mp, 'g'),
      };
      const debut = ['Une pile de laboratoire a une capacité de ', T('Q'), ' et une tension à vide de ', T('U'), ' ; le montage complet pèse ', T('mp'), '. Elle alimente un petit moteur et débite un courant d’intensité constante ', T('I'), '. Elle fonctionne déjà depuis ', T('t'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'IA', nom: 'Intensité du courant en ampères', expr: 'I = frac(I (en mA)|1000)', val: p.I / 1000, u: 'A' }], texte: [...debut, 'Quelle est la durée totale de fonctionnement de la pile, depuis sa mise en service ?'],
        utiles: ['Q', 'I'], raisons: { t: 'La durée déjà écoulée ne change pas la durée totale de fonctionnement.', U: 'La tension à vide n’intervient pas dans la relation Q = I × Δt.', mp: 'La masse du montage n’intervient pas dans la durée de fonctionnement.' },
        cherche: { bonne: 'La durée totale de fonctionnement (en s)', faux: ['La charge déjà débitée par la pile (en C)', 'L’énergie stockée dans la pile au départ (en J)', 'La tension aux bornes du moteur (en V)'] },
        manque: null, solution: { txt: 'Δt = frac(Q|I)', val: p.Q / (p.I / 1000), u: 's' } };
      return { tokens, derivees: [{ id: 'IA', nom: 'Intensité du courant en ampères', expr: 'I = frac(I (en mA)|1000)', val: p.I / 1000, u: 'A' }, { id: 'ts', nom: 'Durée écoulée en secondes', expr: 'Δt = 3 600 × durée en h', val: p.t * 3600, u: 's' }], texte: [...debut, 'Quelle charge électrique la pile a-t-elle déjà débitée ?'],
        utiles: ['I', 't'], raisons: { Q: 'La capacité est la charge maximale ; on demande ici la charge réellement débitée jusqu’à maintenant.', U: 'La tension à vide n’intervient pas dans la relation Q = I × Δt.', mp: 'La masse du montage n’intervient pas dans la charge débitée.' },
        cherche: { bonne: 'La charge déjà débitée (en C)', faux: ['La durée totale de fonctionnement (en h)', 'La capacité électrique de la pile (en C)', 'L’intensité maximale du courant (en A)'] },
        manque: null, solution: { txt: 'Q = I × Δt', val: (p.I / 1000) * p.t * 3600, u: 'C' } };
    },
  },
  // ───────────────────────────── Électrolyse (TG) : zingage d'une pièce, recharge d'un accumulateur
  {
    id: 'ely-sapp-zingage', domaine: 'Électrolyse : forcer le sens d’évolution', titre: 'Déposer du zinc par électrolyse', noms: ['Charge électrique passée', 'Quantité de zinc déposé'],
    gen: () => ({ I: tire([0.20, 0.50, 1.0]), t: tire([10, 20, 30]), U: tire([2.5, 3.0]), S: tire([12, 20, 25]), c: tire([0.50, 1.0]), Vb: tire([1.0, 2.0]) }),
    build: (p, q) => {
      const tokens = {
        I: tok(`${nb(p.I, 2)} A`, 'Intensité du courant (constante)', p.I, 'A'),
        t: tok(`${p.t} min`, 'Durée de l’électrolyse', p.t * 60, 's'),
        U: tok(`${nb(p.U, 1)} V`, 'Tension du générateur', p.U, 'V'),
        S: tok(`${p.S} cm²`, 'Surface de la pièce à recouvrir', p.S, 'cm²'),
        c: tok(`${nb(p.c, 2)} mol/L`, 'Concentration du bain de sulfate de zinc', p.c, 'mol/L'),
        Vb: tok(`${nb(p.Vb, 1)} L`, 'Volume du bain', p.Vb, 'L'),
        M: tok('65,4 g/mol', 'Masse molaire du zinc', 65.4, 'g/mol'),
        F: tok('9,65 × 10⁴ C/mol', 'Charge d’une mole d’électrons (constante de Faraday)', 96500, 'C/mol'),
      };
      const debut = ['Pour protéger de la corrosion une pièce d’acier de ', T('S'), ', on la recouvre de zinc par électrolyse (zingage). La pièce, reliée à la borne − d’un générateur réglé sur ', T('U'), ', plonge dans ', T('Vb'),
        ' d’une solution de sulfate de zinc à ', T('c'), '. Le générateur fait passer un courant d’intensité constante ', T('I'), ' pendant ', T('t'), '. Sur la pièce : Zn²⁺(aq) + 2 e⁻ → Zn(s) ; M(Zn) = ', T('M'), ' ; F = ', T('F'), '. '];
      const Q = p.I * p.t * 60;
      const rU = 'La tension du générateur doit être assez grande pour forcer la réaction, mais elle n’intervient pas dans le calcul des quantités.';
      const rS = 'La surface de la pièce fixe l’épaisseur du dépôt, pas la quantité de zinc déposé.';
      const rc = 'La concentration du bain ne limite pas le dépôt tant qu’il reste des ions Zn²⁺ (le bain en contient beaucoup).';
      const rV = 'Le volume du bain ne limite pas le dépôt : il reste largement assez d’ions Zn²⁺.';
      if (q === 0) return { tokens, derivees: [{ id: 'ts', nom: 'Durée en secondes', expr: 'Δt = 60 × durée en min', val: p.t * 60, u: 's' }], texte: [...debut, 'Quelle charge électrique a traversé le circuit pendant l’électrolyse ?'],
        utiles: ['I', 't'], raisons: { U: rU, S: rS, c: rc, Vb: rV, M: 'La masse molaire ne sert qu’à calculer une masse de zinc, non demandée ici.', F: 'La constante de Faraday sert à passer de la charge aux quantités de matière, pas à calculer la charge.' },
        cherche: { bonne: 'La charge électrique Q passée (en C)', faux: ['La quantité de zinc déposé (en mol)', 'L’épaisseur du dépôt de zinc (en µm)', 'L’énergie fournie par le générateur (en J)'] },
        manque: null, solution: { txt: 'Q = I × Δt', val: Q, u: 'C' } };
      return { tokens, derivees: [{ id: 'Q', nom: 'Charge électrique passée', expr: 'Q = I × Δt', val: Q, u: 'C' }, { id: 'ne', nom: 'Quantité d’électrons échangés', expr: 'n(e⁻) = frac(Q|F)', val: Q / 96500, u: 'mol' }], texte: [...debut, 'Quelle quantité de zinc s’est déposée sur la pièce ?'],
        utiles: ['I', 't', 'F'], raisons: { U: rU, S: rS, c: rc, Vb: rV, M: 'La masse molaire ne sert qu’à passer à la masse de zinc ; on demande ici une quantité de matière.' },
        cherche: { bonne: 'La quantité de zinc déposé (en mol)', faux: ['La masse de zinc déposé (en g)', 'La charge électrique passée (en C)', 'La quantité d’ions Zn²⁺ restant dans le bain (en mol)'] },
        manque: null, solution: { txt: 'n(Zn) = frac(n(e⁻)|2) = frac(I × Δt|2 F)', val: Q / (2 * 96500), u: 'mol' } };
    },
  },
  {
    id: 'ely-sapp-recharge', domaine: 'Électrolyse : forcer le sens d’évolution', titre: 'Recharger un accumulateur zinc-cuivre', noms: ['Durée de la recharge', 'Masse de zinc reformé'],
    gen: () => ({ Q: tire([1200, 1930, 2900]), I: tire([0.10, 0.20, 0.25]), UG: tire([1.6, 1.8]), Tp: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        Q: tok(`${nb(p.Q)} C`, 'Charge déjà débitée par l’accumulateur', p.Q, 'C'),
        I: tok(`${nb(p.I, 2)} A`, 'Intensité du courant de charge (constante)', p.I, 'A'),
        E: tok('1,10 V', 'Tension à vide de l’accumulateur', 1.10, 'V'),
        UG: tok(`${nb(p.UG, 1)} V`, 'Tension du générateur', p.UG, 'V'),
        Tp: tok(`${p.Tp} °C`, 'Température de la salle', p.Tp, '°C'),
        M: tok('65,4 g/mol', 'Masse molaire du zinc', 65.4, 'g/mol'),
        F: tok('9,65 × 10⁴ C/mol', 'Charge d’une mole d’électrons (constante de Faraday)', 96500, 'C/mol'),
      };
      const debut = ['Un accumulateur zinc-cuivre, de tension à vide ', T('E'), ', a débité une charge de ', T('Q'), '. Pour le recharger complètement, il faut faire repasser la même charge en sens inverse : on le relie à un générateur de tension ', T('UG'),
        ' qui fait passer un courant constant ', T('I'), '. Pendant la charge, sur la lame de zinc : Zn²⁺(aq) + 2 e⁻ → Zn(s) ; M(Zn) = ', T('M'), ' ; F = ', T('F'), '. La salle est à ', T('Tp'), '. '];
      const rE = 'La tension à vide sert seulement à vérifier que le générateur peut forcer la charge (tension du générateur plus grande) ; elle n’entre pas dans le calcul.';
      const rUG = 'La tension du générateur doit dépasser la tension à vide, mais elle n’intervient pas dans les relations Q = I × Δt et n(e⁻) = frac(Q|F).';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de temps dure la recharge complète ?'],
        utiles: ['Q', 'I'], raisons: { E: rE, UG: rUG, Tp: 'La température n’intervient pas dans la relation entre charge, intensité et durée.', M: 'La masse molaire ne sert qu’à calculer une masse de zinc.', F: 'La constante de Faraday sert à passer aux quantités de matière, pas à calculer une durée.' },
        cherche: { bonne: 'La durée de la recharge complète (en s)', faux: ['La masse de zinc reformé (en g)', 'L’énergie stockée pendant la charge (en J)', 'L’intensité nécessaire pour recharger en 1 h (en A)'] },
        manque: null, solution: { txt: 'Δt = frac(Q|I)', val: p.Q / p.I, u: 's' } };
      return { tokens, derivees: [{ id: 'ne', nom: 'Quantité d’électrons à faire repasser', expr: 'n(e⁻) = frac(Q|F)', val: p.Q / 96500, u: 'mol' }, { id: 'nZn', nom: 'Quantité de zinc reformé', expr: 'n(Zn) = frac(n(e⁻)|2)', val: p.Q / 2 / 96500, u: 'mol' }], texte: [...debut, 'Quelle masse de zinc se reforme sur la lame pendant la recharge complète ?'],
        utiles: ['Q', 'M', 'F'], raisons: { I: 'L’intensité fixe la durée de la recharge, pas la quantité de zinc reformé, qui ne dépend que de la charge à faire repasser.', E: rE, UG: rUG, Tp: 'La température n’intervient pas dans le bilan de matière.' },
        cherche: { bonne: 'La masse de zinc reformé (en g)', faux: ['La durée de la recharge (en h)', 'La quantité d’électrons échangés (en mol)', 'La masse de cuivre déposé (en g)'] },
        manque: null, solution: { txt: 'm(Zn) = frac(Q|2 F) × M', val: p.Q / 2 / 96500 * 65.4, u: 'g' } };
    },
  },
  // ───────────────────────────── Titrage pH-métrique (TG) : concentration et composition
  {
    id: 'titph-ca', domaine: 'Titrage pH-métrique', titre: 'Contrôle d’une solution d’acide', noms: ['Concentration de l’acide', 'Volume équivalent attendu'],
    gen: () => ({ CA: tire([0.050, 0.060, 0.080, 0.100]), VA: tire([10.0, 20.0, 25.0]), pKa: tire([3.75, 4.2, 4.8]), prix: tire([12, 18, 25]) }),
    build: (p, q) => {
      const CB = 0.100, VE = p.CA * p.VA / CB;
      const tokens = {
        CB: tok('0,100 mol/L', 'Concentration de la solution de soude', CB, 'mol·L⁻¹'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume d’acide prélevé à la pipette', p.VA, 'mL'),
        pKa: tok(nb(p.pKa, 2), 'pK_A du couple de l’acide', p.pKa, ''),
        prix: tok(`${p.prix} €`, 'Prix de la burette', p.prix, '€'),
      };
      const debut = ['Un technicien contrôle une solution d’acide monoprotique faible (réaction totale avec les ions HO⁻). Il prélève ', T('VA'), ' d’acide (burette achetée ', T('prix'), ') et le titre par une solution d’hydroxyde de sodium de concentration ', T('CB'), ' ; le pK_A du couple est ', T('pKa'), '. '];
      const raisons = { pKa: 'Le pK_A ne sert ni à relier les quantités à l’équivalence ni à calculer V_E ou C_A ; il sert à prévoir le pH.', prix: 'Le prix du matériel n’intervient pas dans le calcul.' };
      if (q === 0) {
        const VEaff = Number(VE.toFixed(1));
        tokens.VE = tok(`${nb(VEaff, 1)} mL`, 'Volume équivalent repéré sur la courbe', VEaff, 'mL');
        return { tokens, derivees: [], texte: [...debut, 'Le maximum de la dérivée du pH est obtenu pour un volume de soude ', T('VE'), '. Quelle est la concentration de la solution d’acide ?'],
          utiles: ['CB', 'VA', 'VE'], raisons,
          cherche: { bonne: 'La concentration C_A de l’acide (en mol/L)', faux: ['La quantité de soude versée (en mmol)', 'Le pH à l’équivalence', 'La constante K de la réaction de titrage'] },
          manque: null, solution: { txt: 'C_A × V_A = C_B × V_E, donc C_A = C_B × V_E / V_A', val: CB * VEaff / p.VA, u: 'mol/L' } };
      }
      tokens.CA = tok(`${nb(p.CA, 3)} mol/L`, 'Concentration annoncée sur l’étiquette', p.CA, 'mol·L⁻¹');
      return { tokens, derivees: [], texte: [...debut, 'L’étiquette annonce une concentration ', T('CA'), '. Quel volume de soude doit-on verser pour atteindre l’équivalence ?'],
        utiles: ['CB', 'VA', 'CA'], raisons,
        cherche: { bonne: 'Le volume équivalent V_E (en mL)', faux: ['Le pH à l’équivalence', 'La quantité d’acide restant à V_E (en mmol)', 'Le volume d’eau à ajouter'] },
        manque: null, solution: { txt: 'V_E = C_A × V_A / C_B', val: VE, u: 'mL' } };
    },
  },
  {
    id: 'titph-compo', domaine: 'Titrage pH-métrique', titre: 'Composition en cours de titrage', noms: ['Acide restant', 'Excès de soude'],
    gen: () => ({ CA: tire([0.050, 0.080, 0.100]), VA: tire([10.0, 20.0]), T: tire([20, 25, 30]), Ka: tire([3.75, 4.2, 4.8]) }),
    build: (p, q) => {
      const CB = 0.100, n0 = p.CA * p.VA, VE = n0 / CB;
      const tokens = {
        CA: tok(`${nb(p.CA, 3)} mol/L`, 'Concentration de l’acide', p.CA, 'mol·L⁻¹'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume d’acide dans l’erlenmeyer', p.VA, 'mL'),
        CB: tok('0,100 mol/L', 'Concentration de la soude', CB, 'mol·L⁻¹'),
        T: tok(`${p.T} °C`, 'Température du laboratoire', p.T, '°C'),
        Ka: tok(nb(p.Ka, 2), 'pK_A du couple de l’acide', p.Ka, ''),
      };
      const debut = ['Dans un erlenmeyer, ', T('VA'), ' d’une solution d’acide faible de concentration ', T('CA'), ' est titré par une solution d’hydroxyde de sodium de concentration ', T('CB'), '. La température du laboratoire est ', T('T'), ' et le pK_A du couple vaut ', T('Ka'), '. La transformation est totale. '];
      const raisons = { T: 'La température n’intervient pas dans un bilan de quantités de matière pour une transformation totale.', Ka: 'Le pK_A permet de prévoir le pH, pas de faire le bilan des quantités de matière.' };
      if (q === 0) {
        const VB = Number((VE / 2).toFixed(1));
        tokens.VB = tok(`${nb(VB, 1)} mL`, 'Volume de soude versé', VB, 'mL');
        return { tokens, derivees: [], texte: [...debut, 'On a versé ', T('VB'), ' de soude, soit moins que le volume équivalent. Quelle quantité d’acide reste-t-il dans l’erlenmeyer ?'],
          utiles: ['CA', 'VA', 'CB', 'VB'], raisons,
          cherche: { bonne: 'La quantité d’acide restant (en mmol)', faux: ['Le pH de la solution', 'La quantité d’ions HO⁻ en excès (en mmol)', 'Le volume équivalent V_E (en mL)'] },
          manque: null, solution: { txt: 'n(acide) restant = C_A V_A − C_B V_B', val: n0 - CB * VB, u: 'mmol' } };
      }
      const VB = Number((VE + 5).toFixed(1));
      tokens.VB = tok(`${nb(VB, 1)} mL`, 'Volume de soude versé', VB, 'mL');
      return { tokens, derivees: [], texte: [...debut, 'On a versé ', T('VB'), ' de soude, soit plus que le volume équivalent. Quelle quantité d’ions HO⁻ est en excès ?'],
        utiles: ['CA', 'VA', 'CB', 'VB'], raisons,
        cherche: { bonne: 'La quantité d’ions HO⁻ en excès (en mmol)', faux: ['La quantité d’acide restant (en mmol)', 'Le pH de la solution', 'La concentration de l’acide (en mol/L)'] },
        manque: null, solution: { txt: 'n(HO⁻) en excès = C_B V_B − C_A V_A', val: CB * VB - n0, u: 'mmol' } };
    },
  },
  // ───────────────────────────── 0 bis. Examen d'un objet à la loupe (TSTL : œil et loupe)
  {
    id: 'oeil-loupe-timbre', domaine: 'Œil et loupe', titre: 'Un philatéliste examine un timbre', noms: ['Grossissement', 'Diamètre apparent'],
    gen: () => ({ f: tire([2.5, 4, 5, 8]), AB: tire([0.3, 0.5, 0.8]), prix: tire([12, 18, 25]) }),
    build: (p, q) => {
      const f = p.f / 100, dm = 0.25, AB = p.AB / 100, G = dm / f, thp = AB / f;
      const tokens = {
        f: tok(`${p.f} cm`, 'Distance focale de la loupe', f, 'm'),
        dm: tok('25 cm', 'Distance minimale de vision distincte de l’œil', dm, 'm'),
        prix: tok(`${p.prix} €`, 'Prix de la loupe', p.prix, '€'),
      };
      const debut = ['Un philatéliste utilise une loupe, modélisée par une lentille mince convergente de distance focale ', T('f'), ', achetée ', T('prix'),
        '. Il place le timbre dans le plan focal objet de la loupe et l’observe avec un œil sans défaut de vision ; sans loupe, il le regarderait à la distance minimale de vision distincte ', T('dm'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De combien l’angle sous lequel il voit le timbre est-il multiplié grâce à la loupe ?'],
        utiles: ['f', 'dm'], raisons: { prix: 'Le prix n’intervient pas dans la physique de la loupe.' },
        cherche: { bonne: 'Le grossissement G de la loupe (sans unité)', faux: ['La position OA′ de l’image (en m)', 'Le diamètre apparent θ′ de l’image (en rad)', 'La vergence de la loupe (en δ)'] },
        manque: null, solution: { txt: 'G = dm / f′', val: G, u: '' } };
      tokens.AB = tok(`${p.AB} cm`, 'Hauteur du détail observé sur le timbre', AB, 'm');
      return { tokens, derivees: [], texte: [...debut, 'Le détail observé mesure ', T('AB'), ' de haut. Sous quel angle le philatéliste voit-il ce détail à travers la loupe ?'],
        utiles: ['f', 'AB'], raisons: { prix: 'Le prix n’intervient pas dans la physique de la loupe.', dm: 'La distance minimale de vision distincte sert pour l’œil nu, pas pour l’image à l’infini donnée par la loupe.' },
        cherche: { bonne: 'Le diamètre apparent θ′ de l’image (en rad)', faux: ['Le grossissement G de la loupe (sans unité)', 'La position OA′ de l’image (en m)', 'La hauteur A′B′ de l’image (en m)'] },
        manque: null, solution: { txt: 'θ′ ≈ AB / f′ (petits angles)', val: thp, u: 'rad' } };
    },
  },
  // ───────────────────────────── 0 ter. Observation au microscope (TSTL)
  {
    id: 'microsc-fibre', domaine: 'Microscope', titre: 'Un technicien observe une fibre', noms: ['Grossissement', 'Taille de l’image intermédiaire'],
    gen: () => ({ f1: tire([20, 10, 8]), f2: tire([25, 20, 50]), AB: tire([10, 20, 30, 40]), prix: tire([450, 900, 1500]) }),
    build: (p, q) => {
      const D = 160, dm = 250, G = D * dm / (p.f1 * p.f2), A1B1 = D / p.f1 * p.AB / 1000;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        D: tok('160 mm', 'Intervalle optique F₁′F₂', 0.16, 'm'),
        dm: tok('250 mm', 'Distance minimale de vision distincte', 0.25, 'm'),
        prix: tok(`${p.prix} €`, 'Prix du microscope', p.prix, '€'),
      };
      const debut = ['Un technicien examine une fibre au microscope, modélisé par deux lentilles minces convergentes : un objectif de distance focale ', T('f1'), ' et un oculaire de distance focale ', T('f2'),
        '. L’intervalle optique est ', T('D'), ' ; le microscope, acheté ', T('prix'), ', est mis au point (image définitive à l’infini). L’œil nu verrait la fibre à ', T('dm'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De combien l’angle sous lequel il voit la fibre est-il multiplié grâce au microscope ?'],
        utiles: ['f1', 'f2', 'D', 'dm'], raisons: { prix: 'Le prix n’intervient pas dans la physique du microscope.' },
        cherche: { bonne: 'Le grossissement G du microscope (sans unité)', faux: ['Le grandissement γ₁ de l’objectif seul', 'La distance O₁A₁ entre objectif et image intermédiaire (en m)', 'Le diamètre apparent θ₂ de l’image (en rad)'] },
        manque: null, solution: { txt: 'G = Δ·dm / (f₁′ f₂′)', val: G, u: '' } };
      tokens.AB = tok(`${p.AB} µm`, 'Taille du détail observé sur la fibre', p.AB * 1e-6, 'm');
      return { tokens, derivees: [], texte: [...debut, 'Le détail observé mesure ', T('AB'), '. Quelle est la taille de l’image intermédiaire qu’en donne l’objectif ?'],
        utiles: ['f1', 'D', 'AB'], raisons: { f2: 'L’oculaire n’intervient pas dans la taille de l’image intermédiaire.', dm: 'La distance minimale de vision distincte sert pour l’œil nu, pas pour l’image donnée par l’objectif.', prix: 'Le prix n’intervient pas dans la physique du microscope.' },
        cherche: { bonne: 'La taille A₁B₁ de l’image intermédiaire (en mm)', faux: ['Le grossissement G du microscope (sans unité)', 'Le diamètre apparent θ₂ de l’image définitive (en rad)', 'La distance objet–objectif (en mm)'] },
        manque: null, solution: { txt: 'A₁B₁ = |γ₁| × AB = (Δ / f₁′) × AB', val: A1B1, u: 'mm' } };
    },
  },
  {
    id: 'microsc-mise-au-point-reglage', domaine: 'Microscope', titre: 'Un étudiant règle son microscope', noms: ['Position de l’image intermédiaire', 'Grandissement de l’objectif'],
    gen: () => ({ f1: tire([20, 10, 8]), f2: tire([25, 20, 50]), grad: tire([4, 6, 8]), nom: tire([100, 200, 300]) }),
    build: (p, q) => {
      const D = 160, g = D / p.f1, O1A1 = p.f1 + D;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        D: tok('160 mm', 'Intervalle optique F₁′F₂', 0.16, 'm'),
        nom: tok(`${p.nom} g`, 'Masse du microscope', p.nom / 1000, 'kg'),
      };
      const debut = ['Un étudiant règle un microscope formé d’un objectif de distance focale ', T('f1'), ' et d’un oculaire de distance focale ', T('f2'), '. L’intervalle optique est ', T('D'),
        ' et la masse du microscope vaut ', T('nom'), '. Il tourne la molette jusqu’à ce que l’image définitive soit à l’infini. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'À quelle distance de l’objectif se forme alors l’image intermédiaire ?'],
        utiles: ['f1', 'D'], raisons: { f2: 'Une fois A₁ en F₂, la distance O₁A₁ ne dépend que de f₁′ et de Δ.', nom: 'La masse du microscope n’intervient pas.' },
        cherche: { bonne: 'La distance O₁A₁ (en m)', faux: ['Le grossissement G du microscope (sans unité)', 'La distance objet–objectif (en m)', 'La taille de l’image intermédiaire (en m)'] },
        manque: null, solution: { txt: 'O₁A₁ = f₁′ + Δ', val: O1A1 / 1000, u: 'm' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le grandissement de l’objectif ?'],
        utiles: ['f1', 'D'], raisons: { f2: 'L’oculaire n’intervient pas dans le grandissement de l’objectif.', nom: 'La masse du microscope n’intervient pas.' },
        cherche: { bonne: 'Le grandissement γ₁ de l’objectif (sans unité, avec son signe)', faux: ['Le grossissement G du microscope (sans unité)', 'La distance O₁A₁ (en m)', 'La vergence de l’objectif (en δ)'] },
        manque: null, solution: { txt: 'γ₁ = −Δ / f₁′', val: -g, u: '' } };
    },
  },
  // ───────────────────────────── 0 quater. Lunette astronomique (TSTL)
  {
    id: 'lunet-astre', domaine: 'Lunette astronomique', titre: 'Un amateur observe un astre', noms: ['Grossissement', 'Image intermédiaire'],
    gen: () => ({ f1: tire([600, 800, 1000, 1200]), f2: tire([10, 20, 25, 40]), th: tire([1.5, 2, 3, 4]), D: tire([80, 100, 150]) }),
    build: (p, q) => {
      const G = p.f1 / p.f2, A1B1 = p.f1 * p.th / 1000;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        D: tok(`${p.D} mm`, 'Diamètre de l’objectif', p.D / 1000, 'm'),
      };
      const debut = ['Un amateur observe un astre avec une lunette afocale, modélisée par deux lentilles minces convergentes : un objectif de distance focale ', T('f1'), ' et de diamètre ', T('D'), ', et un oculaire de distance focale ', T('f2'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De combien l’angle sous lequel il voit l’astre est-il multiplié grâce à la lunette ?'],
        utiles: ['f1', 'f2'], raisons: { D: 'Le diamètre de l’objectif joue sur la luminosité et la résolution, pas sur le grossissement.' },
        cherche: { bonne: 'Le grossissement G de la lunette (sans unité)', faux: ['La distance O₁O₂ entre les lentilles (en m)', 'La taille A₁B₁ de l’image intermédiaire (en m)', 'Le diamètre apparent θ₂ de l’image (en rad)'] },
        manque: null, solution: { txt: 'G = f₁′ / f₂′', val: G, u: '' } };
      tokens.th = tok(`${p.th} mrad`, 'Diamètre apparent de l’astre', p.th / 1000, 'rad');
      return { tokens, derivees: [], texte: [...debut, 'L’astre a un diamètre apparent de ', T('th'), '. Quelle est la taille de l’image intermédiaire formée par l’objectif ?'],
        utiles: ['f1', 'th'], raisons: { f2: 'L’oculaire n’intervient pas dans la taille de l’image intermédiaire.', D: 'Le diamètre de l’objectif ne change pas la taille de l’image intermédiaire.' },
        cherche: { bonne: 'La taille A₁B₁ de l’image intermédiaire (en mm)', faux: ['Le grossissement G de la lunette (sans unité)', 'Le diamètre apparent θ₂ de l’image définitive (en rad)', 'La distance O₁O₂ entre les lentilles (en mm)'] },
        manque: null, solution: { txt: 'A₁B₁ = f₁′ × θ₀ (petits angles)', val: A1B1, u: 'mm' } };
    },
  },
  {
    id: 'lunet-reglage', domaine: 'Lunette astronomique', titre: 'Un élève règle sa lunette', noms: ['Distance entre les lentilles', 'Diamètre apparent de l’image'],
    gen: () => ({ f1: tire([600, 800, 1000, 1200]), f2: tire([10, 20, 25, 40]), th: tire([1.5, 2, 3, 4]), m: tire([300, 450, 600]) }),
    build: (p, q) => {
      const d = p.f1 + p.f2, th2 = p.th * p.f1 / p.f2;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        m: tok(`${p.m} g`, 'Masse de l’oculaire et de son support', p.m / 1000, 'kg'),
      };
      const debut = ['Un élève monte une lunette avec un objectif de distance focale ', T('f1'), ' et un oculaire de distance focale ', T('f2'), ' (l’oculaire et son support pèsent ', T('m'), '). Il vise un astre lointain et règle la lunette pour observer sans accommoder. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle distance sépare alors l’objectif et l’oculaire ?'],
        utiles: ['f1', 'f2'], raisons: { m: 'La masse de l’oculaire n’intervient pas.' },
        cherche: { bonne: 'La distance O₁O₂ entre l’objectif et l’oculaire (en m)', faux: ['Le grossissement G de la lunette (sans unité)', 'La taille A₁B₁ de l’image intermédiaire (en m)', 'La vergence de l’oculaire (en δ)'] },
        manque: null, solution: { txt: 'O₁O₂ = f₁′ + f₂′', val: d / 1000, u: 'm' } };
      tokens.th = tok(`${p.th} mrad`, 'Diamètre apparent de l’astre', p.th / 1000, 'rad');
      return { tokens, derivees: [], texte: [...debut, 'L’astre a un diamètre apparent de ', T('th'), '. Sous quel angle voit-il l’image définitive ?'],
        utiles: ['f1', 'f2', 'th'], raisons: { m: 'La masse de l’oculaire n’intervient pas.' },
        cherche: { bonne: 'Le diamètre apparent θ₂ de l’image définitive (en rad)', faux: ['Le grossissement G de la lunette (sans unité)', 'La taille A₁B₁ de l’image intermédiaire (en m)', 'La distance O₁O₂ (en m)'] },
        manque: null, solution: { txt: 'θ₂ = G × θ₀ = (f₁′ / f₂′) × θ₀', val: th2 / 1000, u: 'rad' } };
    },
  },
  // ───────────────────────────── 0 quinquies. Chiralité et configuration R/S (TSTL, PCM)
  {
    id: 'chir-halogenes', domaine: 'Chiralité et configuration R/S', titre: 'Classer les groupes d’un carbone asymétrique (halogènes)', noms: ['Priorité 1', 'Priorité 3'],
    gen: () => { const at = [['F', 9], ['Cl', 17], ['Br', 35], ['I', 53]]; const L = [...at].sort(() => Math.random() - 0.5).slice(0, 3); return { L, M: tire([120, 165, 200, 255]), Teb: tire([40, 80, 110]) }; },
    build: (p, q) => {
      const tri = [...p.L].sort((a, b) => b[1] - a[1]);
      const tokens = {
        a: tok(`Z = ${p.L[0][1]}`, `Numéro atomique de ${p.L[0][0]}`, p.L[0][1], ''),
        b: tok(`Z = ${p.L[1][1]}`, `Numéro atomique de ${p.L[1][0]}`, p.L[1][1], ''),
        c: tok(`Z = ${p.L[2][1]}`, `Numéro atomique de ${p.L[2][0]}`, p.L[2][1], ''),
        M: tok(`${p.M} g/mol`, 'Masse molaire de la molécule', p.M, 'g/mol'),
        Teb: tok(`${p.Teb} °C`, 'Température d’ébullition', p.Teb, '°C'),
      };
      const debut = ['Un carbone asymétrique est lié à un atome d’hydrogène et à trois atomes d’halogène : ', p.L[0][0], ' (', T('a'), '), ', p.L[1][0], ' (', T('b'), ') et ', p.L[2][0], ' (', T('c'), '). La molécule a une masse molaire de ', T('M'), ' et bout à ', T('Teb'), '. On classe les quatre groupes avec les règles de Cahn, Ingold et Prelog. '];
      const raisons = { M: 'La masse molaire ne sert pas à classer les groupes.', Teb: 'La température d’ébullition ne sert pas à classer les groupes.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le numéro atomique de l’atome de priorité 1 ?'], utiles: ['a', 'b', 'c'], raisons,
        cherche: { bonne: 'Le numéro atomique Z de l’atome de priorité 1 (sans unité)', faux: ['La masse molaire de la molécule (en g/mol)', 'La somme des trois numéros atomiques (sans unité)', 'Le nombre de groupes différents autour du carbone (sans unité)'] },
        manque: null, solution: { txt: 'priorité 1 = plus grand Z', val: tri[0][1], u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le numéro atomique de l’atome de priorité 3 ?'], utiles: ['a', 'b', 'c'], raisons,
        cherche: { bonne: 'Le numéro atomique Z de l’atome de priorité 3 (sans unité)', faux: ['La température d’ébullition de la molécule (en °C)', 'Le numéro atomique de l’atome de priorité 1 (sans unité)', 'Le numéro atomique de l’hydrogène (sans unité)'] },
        manque: null, solution: { txt: 'priorité 3 = plus petit Z des trois (H est le n°4)', val: tri[2][1], u: '' } };
    },
  },
  {
    id: 'chir-heteroatomes', domaine: 'Chiralité et configuration R/S', titre: 'Classer les groupes d’un carbone asymétrique (O, N, C)', noms: ['Priorité 1', 'Priorité 3'],
    gen: () => ({ M: tire([75, 89, 105, 119]), F: tire([150, 190, 230, 260]) }),
    build: (p, q) => {
      const tokens = {
        o: tok('Z = 8', 'Numéro atomique de O', 8, ''),
        n: tok('Z = 7', 'Numéro atomique de N', 7, ''),
        c: tok('Z = 6', 'Numéro atomique de C', 6, ''),
        M: tok(`${p.M} g/mol`, 'Masse molaire', p.M, 'g/mol'),
        F: tok(`${p.F} °C`, 'Température de fusion', p.F, '°C'),
      };
      const debut = ['Dans une molécule de formule CH₃–CH(NH₂)–CH₂OH, le carbone asymétrique est lié à un groupe NH₂ (atome lié : N, ', T('n'), '), à un groupe CH₂OH (atome lié : C, ', T('c'), '), à un groupe CH₃ (atome lié : C) et à H. L’atome O a pour numéro atomique ', T('o'), '. La molécule a une masse molaire de ', T('M'), ' et fond à ', T('F'), '. '];
      const raisons = { M: 'La masse molaire ne sert pas à classer les groupes.', F: 'La température de fusion ne sert pas à classer les groupes.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le numéro atomique de l’atome lié au C* du groupe de priorité 1 ?'], utiles: ['n', 'c'], raisons: { ...raisons, o: 'L’atome O n’est pas lié directement au C* : il est dans le groupe CH₂OH, au deuxième rang.' },
        cherche: { bonne: 'Le numéro atomique Z de l’atome lié au C* dans le groupe de priorité 1 (sans unité)', faux: ['Le numéro atomique de l’atome O du groupe CH₂OH (sans unité)', 'La masse molaire de la molécule (en g/mol)', 'Le numéro atomique de H (sans unité)'] },
        manque: null, solution: { txt: 'NH₂ : l’atome lié est N, Z = 7, le plus grand des atomes liés (N, C, C, H)', val: 7, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'CH₂OH et CH₃ sont tous deux liés par C : quel est le numéro atomique de l’atome commun qui les met à égalité ?'], utiles: ['c'], raisons: { ...raisons, n: 'N est l’atome lié de NH₂, groupe déjà classé 1er.', o: 'O est un voisin du carbone de CH₂OH : il sert au deuxième rang, pas à l’égalité.' },
        cherche: { bonne: 'Le numéro atomique Z de l’atome lié qui est le même pour CH₂OH et CH₃ (sans unité)', faux: ['Le numéro atomique de l’atome O (sans unité)', 'Le numéro atomique de N (sans unité)', 'La température de fusion de la molécule (en °C)'] },
        manque: null, solution: { txt: 'C : Z = 6, pour CH₂OH et CH₃ ; on compare ensuite leurs voisins', val: 6, u: '' } };
    },
  },
  // ───────────────────────────── 1. Mur (transferts thermiques)
  {
    id: 'paroi', domaine: 'Transferts thermiques', titre: 'Les pertes thermiques d’un mur', noms: ['Puissance perdue', 'Coût de l’énergie perdue'],
    gen: () => ({ e: tire([15, 20, 25, 30]), L: tire([3, 4, 5, 6]), h: 2.5, lam: 0.25, Ti: tire([19, 20, 21]), Te: tire([-5, -2, 0, 2, 5]),
      an: tire([1975, 1985, 1995, 2005]), prix: 0.17, dur: 24 }),
    build: (p, q) => {
      const S = p.L * p.h, dT = p.Ti - p.Te, e = p.e / 100;
      const tokens = {
        an: tok(`${p.an}`, 'Année de construction', p.an, ''),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du mur', p.L, 'm'),
        h: tok(`${nb(p.h, 1)} m`, 'Hauteur du mur', p.h, 'm'),
        e: tok(`${p.e} cm`, 'Épaisseur du mur', e, 'm'),
        lam: tok(`${nb(p.lam, 2)} W·m⁻¹·K⁻¹`, 'Conductivité thermique de la brique', p.lam, 'W·m⁻¹·K⁻¹'),
        Ti: tok(`${sg(p.Ti)} °C`, 'Température intérieure', p.Ti, '°C'),
        Te: tok(`${sg(p.Te)} °C`, 'Température extérieure', p.Te, '°C'),
        prix: tok(`${nb(p.prix, 2)} € par kWh`, 'Prix de l’électricité', p.prix, '€·kWh⁻¹'),
      };
      const debut = ['Un mur de brique, construit en ', T('an'), ', mesure ', T('L'), ' de long et ', T('h'), ' de haut. Son épaisseur est de ', T('e'),
        ' et la conductivité thermique de la brique vaut ', T('lam'), '. La température de l’air est de ', T('Ti'), ' à l’intérieur et de ', T('Te'),
        ' à l’extérieur. L’électricité coûte ', T('prix'), '. On suppose le régime permanent, un mur sans porte ni fenêtre, et des faces à la température de l’air de chaque côté. '];
      const derivees = [
        { id: 'S', nom: 'Surface S du mur', expr: 'S = longueur × hauteur', val: S, u: 'm²' },
        { id: 'dT', nom: 'Écart de température ΔT', expr: 'ΔT = T_int − T_ext', val: dT, u: 'K' },
      ];
      const P = p.lam * S * dT / e;
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quelle est la puissance thermique perdue à travers ce mur ?'],
        utiles: ['L', 'h', 'e', 'lam', 'Ti', 'Te'],
        raisons: { an: 'La date de construction n’intervient pas dans la loi de la conduction thermique.', prix: 'Le prix servirait à calculer un coût, pas une puissance.' },
        cherche: { bonne: 'La puissance thermique P perdue par le mur (en W)', faux: ['La résistance thermique R_th du mur (en K·W⁻¹)', 'L’énergie perdue en une journée (en kWh)', 'Le flux thermique surfacique φ à travers le mur (en W·m⁻²)'] },
        manque: null, solution: { txt: 'P = λ·S·ΔT / e', val: P, u: 'W' } };
      tokens.dur = tok(`${p.dur} heures`, 'Durée', p.dur, 'h');
      return { tokens, derivees, texte: [...debut, 'Les températures restent constantes et l’énergie perdue est compensée par un chauffage électrique. Quel est le coût de l’énergie perdue à travers ce mur pendant ', T('dur'), ' ?'],
        utiles: ['L', 'h', 'e', 'lam', 'Ti', 'Te', 'prix', 'dur'],
        raisons: { an: 'La date de construction n’intervient ni dans la puissance perdue ni dans son coût.' },
        cherche: { bonne: 'Le coût de l’énergie thermique perdue (en €)', faux: ['La puissance thermique P perdue par le mur (en W)', 'La résistance thermique R_th du mur (en K·W⁻¹)', 'L’énergie thermique perdue pendant cette durée (en kWh)'] },
        manque: null, solution: { txt: 'coût = P × durée × prix, avec P = λ·S·ΔT / e', val: P / 1000 * p.dur * p.prix, u: '€' } };
    },
  },
  // ───────────────────────────── 2. Conduite (transport des fluides)
  {
    id: 'conduite', domaine: 'Transport des fluides', titre: 'Une pompe et sa conduite', noms: ['Vitesse de l’eau', 'Masse d’eau refoulée'],
    gen: () => ({ D: tire([50, 63, 80, 100]), Lc: tire([60, 120, 200]), Q: tire([6, 9, 12]), Pel: tire([1.1, 1.5, 2.2]) }),
    build: (p, q) => {
      const tokens = {
        Pel: tok(`${nb(p.Pel, 1)} kW`, 'Puissance électrique de la pompe', p.Pel * 1000, 'W'),
        D: tok(`${p.D} mm`, 'Diamètre intérieur de la conduite', p.D / 1000, 'm'),
        Lc: tok(`${p.Lc} m`, 'Longueur de la conduite', p.Lc, 'm'),
        Q: tok(`${p.Q} m³·h⁻¹`, 'Débit volumique', p.Q / 3600, 'm³·s⁻¹'),
      };
      const debut = ['Une pompe de puissance électrique ', T('Pel'), ' refoule de l’eau dans une conduite cylindrique de diamètre intérieur ', T('D'),
        ' et de longueur ', T('Lc'), '. La conduite est pleine, l’eau est incompressible et l’écoulement est permanent ; le débit volumique est de ', T('Q'), '. '];
      const S = Math.PI * (p.D / 1000) ** 2 / 4;
      if (q === 0) return { tokens, texte: [...debut, 'Quelle est la vitesse moyenne de l’eau dans la conduite ?'],
        utiles: ['D', 'Q'],
        raisons: { Pel: 'La puissance de la pompe n’intervient pas dans la relation entre débit, section et vitesse.', Lc: 'La longueur de la conduite compte pour les pertes de charge (frottements), pas pour la vitesse de l’eau.' },
        derivees: [{ id: 'S', nom: 'Section S de la conduite', expr: 'S = π·D² / 4', val: S, u: 'm²' }],
        cherche: { bonne: 'La vitesse moyenne v de l’eau (en m·s⁻¹)', faux: ['Le débit massique de l’eau (en kg·s⁻¹)', 'La perte de charge dans la conduite (en Pa)', 'La puissance hydraulique de la pompe (en W)'] },
        manque: null,
        solution: { txt: 'v = Q / S', val: (p.Q / 3600) / S, u: 'm·s⁻¹' } };
      tokens.tdur = tok('1 heure', 'Durée', 3600, 's');
      return { tokens, texte: [...debut, 'Quelle masse d’eau la pompe refoule-t-elle en ', T('tdur'), ' ?'],
        utiles: ['Q', 'tdur'],
        raisons: { Pel: 'La puissance de la pompe ne donne pas la masse d’eau déplacée.', D: 'Le diamètre n’intervient pas : le débit est déjà donné.', Lc: 'La longueur de la conduite n’intervient pas dans la masse d’eau refoulée.' },
        derivees: [{ id: 'V', nom: 'Volume V d’eau refoulé', expr: 'V = Q × durée', val: p.Q, u: 'm³' }],
        cherche: { bonne: 'La masse m d’eau refoulée (en kg)', faux: ['Le débit massique de l’eau (en kg·s⁻¹)', 'La vitesse moyenne de l’eau (en m·s⁻¹)', 'Le volume d’eau contenu dans la conduite (en m³)'] },
        manque: { bonne: 'Il manque la masse volumique de l’eau', faux: ['Il manque le débit volumique de l’eau', 'Il ne manque que la durée de refoulement', 'Il ne manque aucune donnée pour ce calcul'],
          expl: `Pour passer d’un volume à une masse, il faut la masse volumique : m = ρ·V, avec ρ = 1000 kg·m⁻³ pour l’eau. L’énoncé ne la donne pas. En revanche, le débit volumique (${tokens.Q.aff}) et la durée (${tokens.tdur.aff}) y figurent bien : V = Q × durée.` },
        solution: { txt: 'm = ρ·Q·durée', val: 1000 * p.Q, u: 'kg' } };
    },
  },
  // ───────────────────────────── 3. Dosage d'un comprimé (chimie analytique)
  {
    id: 'aspirine', domaine: 'Chimie', titre: 'Dosage d’un comprimé d’aspirine', noms: ['Concentration de la solution', 'Masse d’acide dans le comprimé'],
    gen: () => {
      const [VA, cB] = tire([[20, 0.1], [20, 0.05], [10, 0.05]]), m = tire([480, 500]), Vf = 100;
      const VE = Math.round(((m / 180) * (VA / Vf) / cB) * 10) / 10;
      return { mc: tire([0.6, 0.65, 0.7]), M: 180, Vf, VA, cB, VE };
    },
    build: (p, q) => {
      const tokens = {
        mc: tok(`${nb(p.mc, 2)} g`, 'Masse du comprimé', p.mc, 'g'),
        M: tok(`${p.M} g·mol⁻¹`, 'Masse molaire de l’acide', p.M, 'g·mol⁻¹'),
        Vf: tok(`${nb(p.Vf, 1)} mL`, 'Volume de la fiole jaugée', p.Vf / 1000, 'L'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de solution titré', p.VA / 1000, 'L'),
        cB: tok(`${nb(p.cB, 3)} mol·L⁻¹`, 'Concentration de la soude', p.cB, 'mol·L⁻¹'),
        pH: tok('8,2 à 10', 'Zone de virage de l’indicateur', 8.2, 'pH'),
        VE: tok(`${nb(p.VE, 1)} mL`, 'Volume de soude versé à l’équivalence', p.VE / 1000, 'L'),
      };
      const texte = ['Un comprimé d’aspirine, de masse ', T('mc'), ', contient de l’acide acétylsalicylique (noté AH, de masse molaire ', T('M'),
        ') et des excipients, qui ne réagissent pas avec la soude. Le comprimé est broyé puis l’acide est entièrement dissous dans un mélange eau–éthanol, dans une fiole jaugée de ', T('Vf'),
        ' (solution S₀). On prélève ', T('VA'), ' de S₀ que l’on titre avec une solution de soude (Na⁺ + HO⁻) de concentration ', T('cB'),
        ', en présence de phénolphtaléine (zone de virage de pH ', T('pH'), '). L’équivalence est repérée pour un volume de soude versé de ', T('VE'), '. ',
        q === 0 ? 'Quelle est la concentration en acide acétylsalicylique de la solution S₀ ?' : 'Quelle masse d’acide acétylsalicylique contient un comprimé ?'];
      const manque = null;
      const c0 = p.cB * p.VE / p.VA;
      if (q === 0) return { tokens, texte, utiles: ['VA', 'cB', 'VE'], derivees: [], manque,
        raisons: { mc: 'La masse du comprimé servirait à calculer un pourcentage en masse, pas la concentration de S₀.', M: 'La masse molaire servirait à passer d’une quantité de matière à une masse : ce n’est pas demandé ici.',
          Vf: 'Le volume de la fiole servirait à calculer la quantité de matière totale ; la concentration, elle, se déduit du titrage de la prise.', pH: 'La zone de virage sert à choisir l’indicateur, pas à calculer une concentration.' },
        cherche: { bonne: 'La concentration c₀ en AH de S₀ (en mol·L⁻¹)', faux: ['La masse d’acide AH dans le comprimé (en g)', 'La quantité de matière de soude versée (en mol)', 'Le pourcentage en masse d’acide dans le comprimé'] },
        solution: { txt: 'c₀ = c_B·V_E / V_A', val: c0, u: 'mol·L⁻¹' } };
      return { tokens, texte, utiles: ['Vf', 'VA', 'cB', 'VE', 'M'], derivees: [], manque,
        raisons: { mc: 'La masse du comprimé entier n’intervient pas : on cherche la masse d’acide, qu’on déduit de la concentration, du volume de la fiole et de la masse molaire.', pH: 'La zone de virage sert à choisir l’indicateur, pas à calculer une masse.' },
        cherche: { bonne: 'La masse m d’acide AH dans le comprimé (en g)', faux: ['La concentration c₀ en AH de S₀ (en mol·L⁻¹)', 'Le pourcentage en masse d’acide dans le comprimé', 'La quantité de matière de soude versée (en mol)'] },
        solution: { txt: 'm = c₀·V_f·M avec c₀ = c_B·V_E / V_A', val: c0 * (p.Vf / 1000) * p.M, u: 'g' } };
    },
  },
  // ───────────────────────────── 4. CAN (transmission de signaux numériques)
  {
    id: 'can', domaine: 'Transmission de signaux numériques', titre: 'Un capteur et son convertisseur', noms: ['Quantum du CAN', 'Plus petite variation détectable'],
    gen: () => {
      const [vmin, vmax] = tire([[0, 5], [-5, 5], [0, 3.3], [-2.5, 2.5]]);
      return { n: tire([8, 10, 12, 16]), vmin, vmax, fe: tire([1, 10, 100]), sens: tire([10, 20]) };
    },
    build: (p, q) => {
      const E = p.vmax - p.vmin, N = 2 ** p.n, qt = E / N;
      const tokens = {
        sens: tok(`${p.sens} mV·°C⁻¹`, 'Sensibilité du capteur', p.sens / 1000, 'V·°C⁻¹'),
        n: tok(`${p.n} bits`, 'Nombre de bits du CAN', p.n, 'bits'),
        vmin: tok(`${sg(p.vmin)} V`, 'Tension minimale de la plage d’entrée', p.vmin, 'V'),
        vmax: tok(`${sg(p.vmax)} V`, 'Tension maximale de la plage d’entrée', p.vmax, 'V'),
        fe: tok(`${p.fe} Hz`, 'Fréquence d’échantillonnage', p.fe, 'Hz'),
      };
      const debut = ['Un capteur de température délivre une tension proportionnelle à la température, avec une sensibilité de ', T('sens'),
        '. Cette tension est numérisée par un convertisseur analogique-numérique (CAN) de ', T('n'), ' dont la plage d’entrée va de ', T('vmin'), ' à ', T('vmax'),
        '. La fréquence d’échantillonnage est de ', T('fe'), '. On suppose le capteur parfaitement linéaire et le CAN idéal (sa plage d’entrée est découpée en 2ⁿ intervalles égaux, un pour chaque valeur numérique possible). '];
      const derivees = [
        { id: 'E', nom: 'Étendue de la plage d’entrée', expr: 'étendue = V_max − V_min', val: E, u: 'V' },
        { id: 'N', nom: 'Nombre de valeurs numériques possibles', expr: 'N = 2^n', val: N, u: '' },
      ];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quel est le quantum q du CAN (le plus petit écart de tension qu’il distingue) ?'], utiles: ['n', 'vmin', 'vmax'],
        raisons: { sens: 'La sensibilité du capteur sert à convertir une tension en température, pas à calculer le quantum du CAN.', fe: 'La fréquence d’échantillonnage fixe le nombre de mesures par seconde, pas la finesse de la numérisation.' },
        cherche: { bonne: 'Le quantum q du convertisseur (en V)', faux: ['La plus petite variation de température détectable (en °C)', 'La durée minimale entre deux mesures successives (en s)', 'Le nombre de valeurs numériques que le CAN peut fournir (sans unité)'] },
        manque: null, solution: { txt: 'q = (V_max − V_min) / 2^n', val: qt, u: 'V' } };
      return { tokens, texte: [...debut, 'Quelle est la plus petite variation de température que cette chaîne de mesure peut détecter ?'], utiles: ['sens', 'n', 'vmin', 'vmax'],
        derivees: [...derivees, { id: 'q', nom: 'Quantum q du CAN', expr: 'q = étendue / N', val: qt, u: 'V' }],
        raisons: { fe: 'La fréquence d’échantillonnage fixe le nombre de mesures par seconde, pas la plus petite variation détectable.' },
        cherche: { bonne: 'La plus petite variation de température détectable (en °C)', faux: ['Le quantum q du convertisseur, plus petit écart de tension distingué (en V)', 'La durée minimale entre deux mesures successives (en s)', 'La plage de températures que le capteur peut mesurer (en °C)'] },
        manque: null, solution: { txt: 'Δθ = q / sensibilité', val: qt / (p.sens / 1000), u: '°C' } };
    },
  },
  // ───────────────────────────── 5. Échangeur (transferts thermiques)
  {
    id: 'echangeur', domaine: 'Transferts thermiques', titre: 'Un échangeur eau chaude – eau froide', noms: ['Puissance cédée par l’eau chaude', 'Température de sortie de l’eau froide'],
    schema: (p, b, q) => ({ type: 'echangeur', qc: b.tokens.qc.aff, Tce: b.tokens.Tce.aff, Tcs: b.tokens.Tcs.aff, qf: b.tokens.qf.aff, Tfe: b.tokens.Tfe.aff, Tfs: q === 1 ? '?' : '' }),
    gen: () => {
      for (;;) {
        const p = { qc: tire([0.2, 0.3, 0.4]), Tce: tire([70, 80, 90]), Tcs: tire([50, 55, 60]), qf: tire([0.3, 0.5]), Tfe: tire([10, 15, 20]) };
        const Tfs = p.Tfe + p.qc * (p.Tce - p.Tcs) / p.qf;
        if (Tfs < p.Tcs - 3) return p;                              // résultat physiquement cohérent quel que soit le sens des écoulements
      }
    },
    build: (p, q) => {
      const tokens = {
        qc: tok(`${nb(p.qc, 2)} kg·s⁻¹`, 'Débit massique de l’eau chaude', p.qc, 'kg·s⁻¹'),
        Tce: tok(`${p.Tce} °C`, 'Température d’entrée de l’eau chaude', p.Tce, '°C'),
        Tcs: tok(`${p.Tcs} °C`, 'Température de sortie de l’eau chaude', p.Tcs, '°C'),
        c: tok('4,18 kJ·kg⁻¹·K⁻¹', 'Capacité thermique massique de l’eau', 4180, 'J·kg⁻¹·K⁻¹'),
        qf: tok(`${nb(p.qf, 2)} kg·s⁻¹`, 'Débit massique de l’eau froide', p.qf, 'kg·s⁻¹'),
        Tfe: tok(`${p.Tfe} °C`, 'Température d’entrée de l’eau froide', p.Tfe, '°C'),
      };
      const debut = ['Dans un échangeur thermique, de l’eau chaude, de débit massique ', T('qc'), ', entre à ', T('Tce'), ' et ressort à ', T('Tcs'),
        '. De l’eau froide, de débit massique ', T('qf'), ', entre à ', T('Tfe'), '. La capacité thermique massique de l’eau vaut ', T('c'),
        ' (supposée constante sur la plage de température ; l’eau reste liquide, sans changement d’état). L’échangeur fonctionne en régime permanent et les pertes thermiques vers l’extérieur sont négligées. '];
      const dTc = p.Tce - p.Tcs, P = p.qc * 4180 * dTc;
      const derivees = [{ id: 'dTc', nom: 'Variation de température de l’eau chaude', expr: 'ΔT = T_entrée − T_sortie', val: dTc, u: 'K' }];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quelle puissance thermique l’eau chaude cède-t-elle ?'], utiles: ['qc', 'Tce', 'Tcs', 'c'],
        raisons: { qf: 'Le débit de l’eau froide ne change pas l’énergie cédée par l’eau chaude.', Tfe: 'La température d’entrée de l’eau froide ne change pas l’énergie cédée par l’eau chaude.' },
        cherche: { bonne: 'La puissance thermique cédée par l’eau chaude (en W)', faux: ['L’énergie thermique cédée en une heure (en kJ)', 'La température de sortie de l’eau froide (en °C)', 'La variation de température de l’eau chaude (en K)'] },
        manque: null, solution: { txt: 'P = q_m,chaud · c · (T_entrée − T_sortie)', val: P, u: 'W' } };
      return { tokens, derivees: [...derivees, { id: 'P', nom: 'Puissance cédée par l’eau chaude', expr: 'P = q_m · c · ΔT', val: P, u: 'W' }],
        texte: [...debut, 'Quelle est la température de sortie de l’eau froide ?'], utiles: ['qc', 'Tce', 'Tcs', 'c', 'qf', 'Tfe'], raisons: {},
        cherche: { bonne: 'La température de sortie de l’eau froide (en °C)', faux: ['La puissance thermique cédée par l’eau chaude (en W)', 'La variation de température de l’eau chaude (en K)', 'La température moyenne dans l’échangeur (en °C)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la capacité thermique massique de l’eau', 'Il manque la température d’entrée de l’eau froide', 'Il ne manque que la surface d’échange'],
          expl: `Tout est dans l’énoncé : la capacité thermique massique de l’eau (${tokens.c.aff}), le débit de l’eau froide (${tokens.qf.aff}) et sa température d’entrée (${tokens.Tfe.aff}). Les pertes étant négligées, la puissance reçue par l’eau froide est celle que cède l’eau chaude (P_reçue = P_cédée) : ni la surface d’échange ni le coefficient U ne sont nécessaires.` },
        solution: { txt: 'T_sortie,froid = T_entrée,froid + P / (q_m,froid · c)', val: p.Tfe + P / (p.qf * 4180), u: '°C' } };
    },
  },
  // ───────────────────────────── 6. Beer-Lambert (spectrophotométrie)
  {
    id: 'beer', domaine: 'Chimie', titre: 'Une solution de permanganate', noms: ['Concentration', 'Transmittance'],
    gen: () => ({ lam: tire([520, 525, 530]), l: tire([1, 2]), A: tire([0.25, 0.452, 0.6, 0.8]), eps: 2400, theta: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de la mesure', p.lam, 'nm'),
        l: tok(`${nb(p.l, 1)} cm`, 'Largeur de la cuve', p.l, 'cm'),
        A: tok(`${nb(p.A, 3)}`, 'Absorbance', p.A, ''),
        eps: tok('2,4×10³ L·mol⁻¹·cm⁻¹', 'Coefficient d’absorption molaire', p.eps, 'L·mol⁻¹·cm⁻¹'),
        theta: tok(`${p.theta} °C`, 'Température de la solution', p.theta, '°C'),
      };
      const debut = ['On mesure l’absorbance d’une solution aqueuse de permanganate de potassium à ', T('lam'), ' avec un spectrophotomètre, dans une cuve de largeur ', T('l'),
        '. On lit A = ', T('A'), '. À cette longueur d’onde, le coefficient d’absorption molaire des ions permanganate vaut ε = ', T('eps'), '. La solution est à ', T('theta'), '. La mesure est faite contre un blanc (solvant seul), avec une lumière monochromatique, et seuls les ions permanganate absorbent à cette longueur d’onde. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en ions permanganate de la solution (en mol·L⁻¹), en supposant la solution assez diluée pour que la loi de Beer-Lambert soit vérifiée ?'], utiles: ['A', 'l', 'eps'],
        raisons: { lam: 'La longueur d’onde est déjà « contenue » dans la valeur de ε donnée pour cette longueur d’onde.', theta: 'La température n’apparaît pas dans la loi de Beer-Lambert (son effet éventuel sur ε est négligé ici).' },
        cherche: { bonne: 'La concentration c en ions permanganate (en mol·L⁻¹)', faux: ['La transmittance T de la solution (en %)', 'La concentration en masse de permanganate (en g·L⁻¹)', 'La quantité de matière de permanganate dans la cuve (en mol)'] },
        manque: null, solution: { txt: 'c = A / (ε·ℓ)', val: p.A / (p.eps * p.l), u: 'mol·L⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la transmittance de la solution, c’est-à-dire la proportion de la lumière incidente qui la traverse (en %) ?'], utiles: ['A'],
        raisons: { lam: 'La longueur d’onde n’intervient pas pour passer de l’absorbance à la transmittance.', l: 'La largeur de la cuve est déjà prise en compte dans l’absorbance mesurée.',
          eps: 'ε et ℓ relient l’absorbance à la concentration ; ici on passe directement de A à T.', theta: 'La température n’intervient pas dans la relation entre absorbance et transmittance.' },
        cherche: { bonne: 'La transmittance T de la solution (en %)', faux: ['La concentration c en ions permanganate (en mol·L⁻¹)', 'La proportion de lumière absorbée par la solution (en %)', 'L’intensité lumineuse incidente (en W·m⁻²)'] },
        manque: null, solution: { txt: 'T = 10^(−A)', val: 100 * 10 ** (-p.A), u: '%' } };
    },
  },
  // ───────────────────────────── 7. Réservoir (statique des fluides)
  {
    id: 'reservoir', domaine: 'Transport des fluides', titre: 'Un réservoir d’eau', noms: ['Pression au fond', 'Masse d’eau contenue'],
    gen: () => ({ rho: 1000, h: tire([2, 3, 4, 5]), D: tire([1, 2, 3]), Patm: tire([1010, 1013, 1020]) }),
    build: (p, q) => {
      const tokens = {
        rho: tok(`${nb(p.rho)} kg·m⁻³`, 'Masse volumique de l’eau', p.rho, 'kg·m⁻³'),
        h: tok(`${nb(p.h, 1)} m`, 'Hauteur d’eau', p.h, 'm'),
        D: tok(`${nb(p.D, 1)} m`, 'Diamètre du réservoir', p.D, 'm'),
        Patm: tok(`${p.Patm} hPa`, 'Pression atmosphérique', p.Patm * 100, 'Pa'),
      };
      const debut = ['Un réservoir cylindrique, ouvert à l’air libre, contient de l’eau au repos (de masse volumique ', T('rho'), ') sur une hauteur de ', T('h'),
        '. Son diamètre est de ', T('D'), '. La pression atmosphérique vaut ', T('Patm'), '. '];
      const S = Math.PI * p.D ** 2 / 4;
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la pression absolue au fond du réservoir ?'], utiles: ['rho', 'h', 'Patm'],
        raisons: { D: 'La pression hydrostatique ne dépend que de la hauteur d’eau : le diamètre n’intervient pas.' },
        cherche: { bonne: 'La pression absolue au fond du réservoir (en Pa)', faux: ['La force exercée par l’eau sur le fond (en N)', 'La masse d’eau contenue dans le réservoir (en kg)', 'La pression due uniquement au poids de l’eau, sans la pression atmosphérique (en Pa)'] },
        manque: { bonne: 'Il manque l’intensité de la pesanteur g', faux: ['Il manque la masse volumique de l’eau', 'Il ne manque que la viscosité de l’eau', 'Il ne manque aucune donnée pour ce calcul'],
          expl: `La relation fondamentale de l’hydrostatique, P = P_atm + ρ·g·h, fait intervenir g, que l’énoncé ne donne pas (g = 9,81 N·kg⁻¹ sur Terre). Contrairement à π, g n’est pas une constante mathématique : elle dépend de l’astre, donc l’énoncé doit la préciser. La masse volumique (${tokens.rho.aff}), la hauteur d’eau (${tokens.h.aff}) et la pression atmosphérique (${tokens.Patm.aff}) y figurent bien ; la viscosité n’intervient pas pour un fluide au repos.` },
        solution: { txt: 'P_fond − P_atm = ρ·g·h  (ΔP = ρ·g·Δz), donc P_fond = P_atm + ρ·g·h', val: p.Patm * 100 + p.rho * 9.81 * p.h, u: 'Pa' } };
      return { tokens, texte: [...debut, 'Quelle est la masse d’eau contenue dans le réservoir ?'], utiles: ['rho', 'h', 'D'],
        derivees: [{ id: 'S', nom: 'Section S du réservoir', expr: 'S = π·D² / 4', val: S, u: 'm²' }, { id: 'V', nom: 'Volume V d’eau', expr: 'V = S × h', val: S * p.h, u: 'm³' }],
        raisons: { Patm: 'La pression atmosphérique ne change pas la masse d’eau contenue.' },
        cherche: { bonne: 'La masse m d’eau contenue dans le réservoir (en kg)', faux: ['La pression absolue au fond du réservoir (en Pa)', 'Le poids de l’eau (en N)', 'Le débit d’eau nécessaire pour remplir le réservoir (en m³·s⁻¹)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la masse volumique de l’eau', 'Il manque le diamètre du réservoir', 'Il ne manque que l’intensité de la pesanteur g'],
          expl: `Tout est dans l’énoncé : la masse volumique (${tokens.rho.aff}), la hauteur d’eau (${tokens.h.aff}) et le diamètre (${tokens.D.aff}) pour calculer le volume V = π·D²/4 × h (π est une constante mathématique). On cherche une masse, pas un poids : g n’intervient pas (m = ρ·V).` },
        solution: { txt: 'm = ρ·V = ρ·S·h', val: p.rho * S * p.h, u: 'kg' } };
    },
  },
  // ───────────────────────────── Régulation
  {
    id: 'regulP', domaine: 'Régulation', titre: 'Régulation proportionnelle du niveau d’un réservoir', noms: ['Commande nécessaire', 'Écart statique', 'Niveau en régime permanent'],
    schema: (p, b) => ({ type: 'regul', Qmax: b.tokens.Qmax.aff, Qp: b.tokens.Qp.aff, hc: b.tokens.hc.aff, Kp: b.tokens.Kp.aff }),
    gen: () => ({ hc: tire([3, 4, 5]), Kp: tire([50, 80, 100, 150]), Qmax: tire([100, 120, 150]), Qp: tire([30, 36, 45, 60]), S: tire([2, 3, 4]), Ti: tire([20, 50, 100]) }),
    build: (p, q) => {
      const Y = p.Qp / p.Qmax * 100, e = Y / p.Kp;
      const tokens = {
        S: tok(`${p.S} m²`, 'Section du réservoir', p.S, 'm²'),
        Qmax: tok(`${p.Qmax} m³·h⁻¹`, 'Débit maximal de la pompe (commande de 100 %)', p.Qmax, 'm³·h⁻¹'),
        Qp: tok(`${p.Qp} m³·h⁻¹`, 'Débit de soutirage', p.Qp, 'm³·h⁻¹'),
        hc: tok(`${p.hc} m`, 'Consigne de niveau', p.hc, 'm'),
        Kp: tok(`${p.Kp} %·m⁻¹`, 'Gain proportionnel du régulateur', p.Kp, '%·m⁻¹'),
        Ti: tok(`${p.Ti} h`, 'Temps intégral (indiqué sur la fiche du régulateur)', p.Ti, 'h'),
      };
      const debut = ['Un réservoir de section ', T('S'), ' est rempli par une pompe dont le débit est proportionnel à la commande Y (100 % ↔ ', T('Qmax'), '). Un soutirage constant de ', T('Qp'),
        ' vide le réservoir.\n\nLe régulateur proportionnel calcule Y = K_p × (consigne − H), où H est le niveau du liquide dans le réservoir, sans commande de base (Y est limitée entre 0 et 100 %), avec K_p = ', T('Kp'), ' ; la consigne est de ', T('hc'), '.\n\nLa fiche du régulateur (réglable en PI) indique un temps intégral de ', T('Ti'), ', mais l’action intégrale est désactivée : le régulateur est utilisé en proportionnel seul.\n\nLe capteur de niveau et la pompe sont supposés parfaits (sans retard). On admet que le niveau finit par se stabiliser. '];
      const rS = 'La section règle la vitesse d’évolution du niveau, pas sa valeur en régime permanent.', rTi = 'Le régulateur est proportionnel seul : sa loi Y = K_p × (consigne − H) ne contient pas de temps intégral, ce réglage ne sert pas dans ce calcul.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'En régime permanent, quelle commande Y le régulateur doit-il envoyer à la pompe ?'], utiles: ['Qmax', 'Qp'],
        raisons: { S: rS, hc: 'La consigne intervient dans le calcul de l’écart, pas dans la commande nécessaire pour compenser le soutirage.', Kp: 'Le gain relie la commande à l’écart de niveau, mais ne dit pas quelle commande est nécessaire.', Ti: rTi },
        cherche: { bonne: 'La commande Y envoyée à la pompe (en %)', faux: ['Le niveau de liquide en régime permanent (en m)', 'L’écart entre la consigne et le niveau (en m)', 'La durée de vidange du réservoir sans pompe (en h)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le débit maximal de la pompe', 'Il manque le débit de soutirage', 'Il ne manque que la masse volumique du liquide'],
          expl: `Tout est dans l’énoncé : le débit maximal de la pompe (${tokens.Qmax.aff} pour 100 %) et le débit de soutirage (${tokens.Qp.aff}). En régime permanent, le niveau est stable, donc le débit de la pompe est égal au soutirage : Y/100 × Q_max = Q_p. La masse volumique n’intervient pas : les deux débits sont déjà des débits volumiques.` },
        solution: { txt: 'Y = Q_p / Q_max × 100', val: Y, u: '%' } };
      if (q === 1) return { tokens, texte: [...debut, 'Quel est l’écart statique, c’est-à-dire l’écart (consigne − niveau) qui subsiste en régime permanent ?'], utiles: ['Qmax', 'Qp', 'Kp'],
        derivees: [{ id: 'Y', nom: 'Commande nécessaire', expr: 'Y = Q_p / Q_max × 100', val: Y, u: '%' }],
        raisons: { S: rS, hc: 'L’écart ne dépend pas de la valeur de la consigne, seulement de la commande à fournir et du gain.', Ti: rTi },
        cherche: { bonne: 'L’écart statique entre la consigne et le niveau (en m)', faux: ['La commande Y (en %)', 'Le niveau de liquide (en m)', 'Le temps pour atteindre le régime permanent (en h)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le gain proportionnel du régulateur', 'Il manque le débit maximal de la pompe', 'Il ne manque que la hauteur du réservoir'],
          expl: `Tout est dans l’énoncé : le gain K_p (${tokens.Kp.aff}), ainsi que le débit maximal de la pompe (${tokens.Qmax.aff}) et le débit de soutirage (${tokens.Qp.aff}) qui donnent la commande Y. Le régulateur ne fournit Y que s’il y a un écart : écart = Y / K_p. La hauteur du réservoir n’intervient pas.` },
        solution: { txt: 'écart = Y / K_p', val: e, u: 'm' } };
      return { tokens, texte: [...debut, 'Quel est le niveau du liquide en régime permanent ?'], utiles: ['Qmax', 'Qp', 'Kp', 'hc'],
        derivees: [{ id: 'Y', nom: 'Commande nécessaire', expr: 'Y = Q_p / Q_max × 100', val: Y, u: '%' }, { id: 'e', nom: 'Écart statique', expr: 'écart = Y / K_p', val: e, u: 'm' }],
        raisons: { S: rS, Ti: rTi },
        cherche: { bonne: 'Le niveau H en régime permanent (en m)', faux: ['L’écart statique (en m)', 'La commande Y (en %)', 'Le volume de liquide contenu dans le réservoir (en m³)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la consigne de niveau', 'Il manque le gain proportionnel du régulateur', 'Il ne manque que le débit de soutirage'],
          expl: `Tout est dans l’énoncé : la consigne (${tokens.hc.aff}), le gain K_p (${tokens.Kp.aff}), le débit maximal de la pompe (${tokens.Qmax.aff}) et le débit de soutirage (${tokens.Qp.aff}). Un régulateur proportionnel (sans action intégrale) laisse le niveau sous la consigne (le soutirage demande une commande non nulle) : H = consigne − écart.` },
        solution: { txt: 'H = consigne − écart', val: p.hc - e, u: 'm' } };
    },
  },
  {
    id: 'premord', domaine: 'Régulation', titre: 'Réponse d’un capteur de température (1er ordre)', noms: ['Temps de réponse à 5 %', 'Température lue après une durée t'],
    gen: () => {
      const tau = tire([15, 20, 30, 40]), k = tire([1, 2, 4]);   // jamais t = 3τ : ce serait la réponse du temps de réponse à 5 %
      return { tau, T0: tire([15, 20, 25]), Tf: tire([60, 80, 100]), t: tau * k, res: tire([0.1, 0.5]), m: tire([12, 15, 20]) };
    },
    build: (p, q) => {
      const tokens = {
        tau: tok(`${p.tau} s`, 'Constante de temps du capteur', p.tau, 's'),
        T0: tok(`${p.T0} °C`, 'Température initiale du capteur', p.T0, '°C'),
        Tf: tok(`${p.Tf} °C`, 'Température du bain', p.Tf, '°C'),
        res: tok(`${nb(p.res, 1)} °C`, 'Résolution de l’afficheur', p.res, '°C'),
        m: tok(`${p.m} g`, 'Masse du capteur', p.m, 'g'),
      };
      const debut = ['Un capteur de température se comporte comme un système du 1er ordre de constante de temps ', T('tau'), '. À l’instant initial, il est à ', T('T0'), ' et on le plonge dans un bain maintenu à ', T('Tf'),
        '. L’afficheur a une résolution de ', T('res'), ' et le capteur a une masse de ', T('m'), '. '];
      const rRes = 'La résolution de l’afficheur ne change pas la réponse du capteur : elle limite seulement le nombre de chiffres affichés, pas la température réelle.', rM = 'La masse est déjà prise en compte dans la constante de temps donnée.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le temps de réponse à 5 % du capteur, c’est-à-dire la durée au bout de laquelle il a atteint 95 % de la variation totale de température ?'], utiles: ['tau'],
        raisons: { T0: 'Un temps de réponse à 5 % ne dépend pas des températures de départ et d’arrivée.', Tf: 'Un temps de réponse à 5 % ne dépend pas des températures de départ et d’arrivée.', res: rRes, m: rM },
        cherche: { bonne: 'Le temps de réponse à 5 % du capteur (en s)', faux: ['La température du capteur au bout d’une durée τ (en °C)', 'La fréquence de coupure du capteur (en Hz)', 'La durée pour atteindre 99 % de la variation (en s)'] },
        manque: null,
        solution: { txt: `t₅ % = τ·ln 20 ≈ 3 × τ (valeur exacte ${nb(Math.log(20) * p.tau, 3)} s, arrondie à 3τ = ${3 * p.tau} s)`, val: 3 * p.tau, u: 's' } };
      tokens.t = tok(`${p.t} s`, 'Durée écoulée depuis l’immersion', p.t, 's');
      const f = 1 - Math.exp(-p.t / p.tau), dT = p.Tf - p.T0;
      return { tokens, texte: [...debut, 'Quelle est la température réelle du capteur ', T('t'), ' après l’immersion ?'], utiles: ['tau', 'T0', 'Tf', 't'],
        derivees: [{ id: 'dT', nom: 'Écart total à parcourir', expr: 'ΔT = T_f − T_0', val: dT, u: '°C' }, { id: 'f', nom: 'Fraction de l’écart atteinte', expr: 'f = 1 − e^(−t/τ)', val: f, u: '' }],
        raisons: { res: rRes, m: rM },
        cherche: { bonne: 'La température réelle du capteur à l’instant t (en °C)', faux: ['Le temps de réponse à 5 % (en s)', 'La vitesse de variation de la température à l’instant t (en °C·s⁻¹)', 'La durée pour atteindre 99 % de la variation (en s)'] },
        manque: null,
        solution: { txt: 'T = T_0 + (T_f − T_0)·(1 − e^(−t/τ))', val: p.T0 + dT * f, u: '°C' } };
    },
  },
  // ───────────────────────────── Distillation
  {
    id: 'distil', domaine: 'Distillation', titre: 'Distillation d’un mélange eau–éthanol', noms: ['Volume d’éthanol présent', 'Rendement de la distillation'],
    gen: () => {
      const V = tire([200, 250, 300, 400, 500]), x = tire([10, 12, 15, 20]), y = tire([80, 85, 90]), P = tire([400, 500, 600]);
      const Vd = Math.round(V * x / 100 * tire([0.6, 0.7, 0.75, 0.8]) / (y / 100));
      return { V, x, y, P, Vd, Te: 78.4 };
    },
    build: (p, q) => {
      const tokens = {
        V: tok(`${p.V} mL`, 'Volume du mélange initial', p.V, 'mL'),
        x: tok(`${p.x} %`, 'Proportion d’éthanol dans le mélange (en volume)', p.x, '%'),
        P: tok(`${p.P} W`, 'Puissance du chauffe-ballon', p.P, 'W'),
        Te: tok(`${nb(p.Te, 1)} °C`, 'Température d’ébullition de l’éthanol', p.Te, '°C'),
        Vd: tok(`${p.Vd} mL`, 'Volume de distillat recueilli', p.Vd, 'mL'),
        y: tok(`${p.y} %`, 'Proportion d’éthanol dans le distillat (en volume)', p.y, '%'),
      };
      const debut = ['On distille avec une colonne (distillation fractionnée) ', T('V'), ' d’un mélange eau–éthanol qui contient ', T('x'), ' d’éthanol en volume. Le chauffe-ballon a une puissance de ', T('P'),
        '. L’éthanol bout à ', T('Te'), ' (l’eau à 100 °C). On recueille ', T('Vd'), ' d’un distillat qui contient ', T('y'), ' d’éthanol en volume (pourcentages mesurés à la même température). L’éthanol qui n’est pas dans le distillat reste dans le ballon. '];
      const Vi = p.V * p.x / 100, Vr = p.Vd * p.y / 100;
      const rTemp = 'La température d’ébullition explique la séparation, mais n’entre pas dans le calcul d’un volume ou d’un rendement.';
      const rPuis = 'La puissance de chauffe fixe la vitesse de chauffage (donc la durée de la distillation), pas les volumes.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel volume d’éthanol contenait le mélange initial ?'], utiles: ['V', 'x'],
        raisons: { P: rPuis, Te: rTemp, Vd: 'Le distillat est ce que l’on récupère après la distillation : il ne dit pas ce qu’il y avait au départ.', y: 'La pureté du distillat concerne ce que l’on récupère, pas le mélange initial.' },
        cherche: { bonne: 'Le volume d’éthanol présent dans le mélange initial (en mL)', faux: ['Le volume d’éthanol récupéré dans le distillat (en mL)', 'Le rendement de la distillation, part d’éthanol récupérée (en %)', 'La masse d’éthanol présente dans le mélange initial (en g)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le volume du mélange initial', 'Il manque la proportion d’éthanol dans le mélange', 'Il ne manque que la masse volumique de l’éthanol'],
          expl: `Tout est dans l’énoncé : le volume du mélange (${tokens.V.aff}) et sa proportion d’éthanol en volume (${tokens.x.aff}). Un pourcentage en volume s’applique à un volume : V_éthanol = x × V. Aucune masse volumique n’est nécessaire.` },
        solution: { txt: 'V_éthanol = (x / 100) × V', val: Vi, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quel est le rendement de la distillation (volume d’éthanol récupéré par rapport au volume d’éthanol présent) ?'], utiles: ['V', 'x', 'Vd', 'y'],
        derivees: [{ id: 'Vi', nom: 'Volume d’éthanol présent au départ', expr: 'V_i = V × x / 100', val: Vi, u: 'mL' }, { id: 'Vr', nom: 'Volume d’éthanol dans le distillat', expr: 'V_r = V_distillat × y / 100', val: Vr, u: 'mL' }],
        raisons: { P: rPuis, Te: rTemp },
        cherche: { bonne: 'Le rendement : éthanol récupéré / éthanol présent (en %)', faux: ['Le rendement : volume de distillat / volume de mélange initial (en %)', 'Le volume d’éthanol récupéré dans le distillat (en mL)', 'Le volume d’éthanol non récupéré dans le distillat (en mL)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le volume de distillat recueilli', 'Il manque la proportion d’éthanol dans le distillat', 'Il ne manque que la masse volumique de l’éthanol'],
          expl: `Tout est dans l’énoncé : pour l’éthanol présent au départ, le volume du mélange (${tokens.V.aff}) et sa proportion d’éthanol (${tokens.x.aff}) ; pour l’éthanol récupéré, le volume de distillat (${tokens.Vd.aff}) et sa proportion d’éthanol (${tokens.y.aff}). Ces quantités d’éthanol se calculent à partir de volumes et de pourcentages en volume (aucune masse volumique n’est nécessaire) ; le rendement est leur rapport.` },
        solution: { txt: 'η = V_r / V_i × 100', val: Vr / Vi * 100, u: '%' } };
    },
  },
  // ───────────────────────────── Évaporation et cristallisation
  {
    id: 'cristal', domaine: 'Évaporation et cristallisation', titre: 'Refroidir une solution saturée de nitrate de potassium', noms: ['Masse dissoute à 60 °C', 'Masse de cristaux obtenue'],
    gen: () => ({ me: tire([100, 150, 200, 250]), s60: tire([108, 110, 112]), s20: tire([31, 32, 33]), dur: tire([30, 45, 60]), mb: tire([80, 120, 150]) }),
    build: (p, q) => {
      const tokens = {
        me: tok(`${p.me} g`, 'Masse d’eau', p.me, 'g'),
        mb: tok(`${p.mb} g`, 'Masse du bécher vide', p.mb, 'g'),
        s60: tok(`${p.s60} g pour 100 g d’eau`, 'Solubilité du nitrate de potassium à 60 °C', p.s60, 'g pour 100 g d’eau'),
        s20: tok(`${p.s20} g pour 100 g d’eau`, 'Solubilité du nitrate de potassium à 20 °C', p.s20, 'g pour 100 g d’eau'),
        dur: tok(`${p.dur} minutes`, 'Durée du refroidissement', p.dur, 'min'),
      };
      const debut = ['On prépare à 60 °C une solution saturée de nitrate de potassium dans ', T('me'), ' d’eau, dans un bécher de masse ', T('mb'), ' (vide). À 60 °C, la solubilité du nitrate de potassium est de ',
        T('s60'), ' ; à 20 °C, elle est de ', T('s20'), '. On refroidit la solution lentement jusqu’à 20 °C en ', T('dur'), '. '];
      const m60 = p.s60 * p.me / 100, m20 = p.s20 * p.me / 100;
      const rB = 'Le bécher n’intervient pas dans la quantité de soluté dissous.', rD = 'La durée du refroidissement ne change pas les masses à l’équilibre.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle masse de nitrate de potassium est dissoute dans la solution à 60 °C ?'], utiles: ['me', 's60'],
        raisons: { mb: rB, dur: rD, s20: 'Cette solubilité concerne 20 °C : la solution de départ est à 60 °C.' },
        cherche: { bonne: 'La masse de nitrate de potassium dissoute à 60 °C (en g)', faux: ['La masse de cristaux formés au refroidissement (en g)', 'La masse de nitrate de potassium encore dissoute à 20 °C (en g)', 'La masse totale de solution (en g)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la masse d’eau de la solution', 'Il manque la solubilité du nitrate de potassium à 60 °C', 'Il ne manque que la masse molaire du nitrate de potassium'],
          expl: `Tout est dans l’énoncé : la masse d’eau (${tokens.me.aff}) et la solubilité à 60 °C (${tokens.s60.aff}). La solubilité est proportionnelle à la masse d’eau : on ramène la valeur donnée « pour 100 g d’eau » à la masse d’eau de l’énoncé. La masse molaire n’intervient pas : on raisonne en masses.` },
        solution: { txt: 'm_dissoute(60 °C) = s₆₀ × m_eau / 100', val: m60, u: 'g' } };
      return { tokens, texte: [...debut, 'On suppose que la solution est de nouveau saturée à 20 °C et qu’il n’y a pas d’évaporation. Quelle masse de cristaux obtient-on à 20 °C ?'], utiles: ['me', 's60', 's20'],
        derivees: [{ id: 'm60', nom: 'Masse dissoute à 60 °C', expr: 'm₆₀ = s₆₀ × m_eau / 100', val: m60, u: 'g' }, { id: 'm20', nom: 'Masse encore dissoute à 20 °C', expr: 'm₂₀ = s₂₀ × m_eau / 100', val: m20, u: 'g' }],
        raisons: { mb: rB, dur: rD },
        cherche: { bonne: 'La masse de cristaux formés au refroidissement (en g)', faux: ['La masse de nitrate de potassium dissoute à 60 °C (en g)', 'La masse de nitrate de potassium encore dissoute à 20 °C (en g)', 'La masse totale de solution à 60 °C (en g)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la solubilité du nitrate de potassium à 20 °C', 'Il manque la masse d’eau de la solution', 'Il ne manque que la masse volumique de la solution'],
          expl: `Tout est dans l’énoncé : la masse d’eau (${tokens.me.aff}), la solubilité à 60 °C (${tokens.s60.aff}) et la solubilité à 20 °C (${tokens.s20.aff}). Ce qui cristallise est la différence entre la masse dissoute à 60 °C et celle qui peut encore l’être à 20 °C. La masse volumique de la solution n’intervient pas.` },
        solution: { txt: 'm_cristaux = m₆₀ − m₂₀', val: m60 - m20, u: 'g' } };
    },
  },
  // ───────────────────────────── Mesure et incertitudes (TSTL)
  {
    id: 'incertA', domaine: 'Mesure et incertitudes', titre: 'Incertitude d’une série de mesures répétées', noms: ['Incertitude-type de la moyenne', 'Incertitude élargie', 'Borne haute de l’intervalle'],
    gen: () => { const n = tire([9, 16, 25]), u0 = tire([0.03, 0.04, 0.05]); return { n, s: Math.round(u0 * Math.sqrt(n) * 100) / 100, xm: tire([12.4, 15.2, 18.6, 20.3, 22.7, 24.1]), k: 2, res: tire([0.01, 0.02]), dur: tire([10, 15, 20]) }; },
    build: (p, q) => {
      const u = p.s / Math.sqrt(p.n), U = p.k * u;
      const tokens = {
        n: tok(`${p.n}`, 'Nombre de mesures de la série', p.n, ''),
        xm: tok(`${nb(p.xm, 1)} mL`, 'Moyenne des mesures', p.xm, 'mL'),
        s: tok(`${nb(p.s, 2)} mL`, 'Écart-type expérimental de la série', p.s, 'mL'),
        k: tok('k = 2', 'Facteur d’élargissement', p.k, ''),
        res: tok(`${nb(p.res, 2)} mL`, 'Résolution de la burette', p.res, 'mL'),
        dur: tok(`${p.dur} min`, 'Durée de la série', p.dur, 'min'),
      };
      const debut = ['On répète ', T('n'), ' fois le titrage d’une même solution, dans les mêmes conditions.\n\nLe volume équivalent moyen est ', T('xm'), ' et l’écart-type expérimental de la série vaut ', T('s'),
        '.\n\nLa burette (numérique) a une résolution de ', T('res'), ' ; la série a duré ', T('dur'), '. On élargit l’incertitude avec ', T('k'), ', valeur prise par convention : elle donne un niveau de confiance proche de 95 % si les mesures sont indépendantes et suivent une loi normale (hypothèses faites ici). Le niveau réel est un peu plus faible pour un petit nombre de mesures (un facteur de Student serait plus rigoureux) ; on garde ici la valeur conventionnelle. '];
      const ur = p.res / Math.sqrt(6), pc = (Math.sqrt(1 + (ur / u) ** 2) - 1) * 100;   // deux lectures de burette, loi rectangulaire : u_res = r / (2√3) par lecture
      const rRes0 = `La résolution de la burette est une autre source d’incertitude (type B) : pour deux lectures, u_res = r / √6 ≈ ${nb(ur, 3)} mL. Ajoutée en quadrature à u ≈ ${nb(u, 3)} mL, elle ne la modifierait que d’environ ${nb(pc, 1)} % : négligeable devant la dispersion, donc on se limite ici à l’incertitude de type A, u = s / √n.`;
      const rRes = q === 0 ? rRes0 : q === 1 ? rRes0.replace('on se limite ici à l’incertitude de type A, u = s / √n.', 'on calcule U = k × u avec l’incertitude de type A seule.') : rRes0.replace('on se limite ici à l’incertitude de type A, u = s / √n.', 'l’intervalle x̄ ± U se calcule avec l’incertitude de type A seule.');
      const rDur = 'La durée de la série n’intervient pas dans le calcul de l’incertitude.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est l’incertitude-type de type A, u, de la moyenne de la série ?'], utiles: ['s', 'n'],
        raisons: { xm: 'La valeur de la moyenne ne change pas l’incertitude : elle dépend de la dispersion et du nombre de mesures.', k: 'Le facteur d’élargissement sert pour l’incertitude élargie, pas pour l’incertitude-type.', res: rRes, dur: rDur },
        cherche: { bonne: 'L’incertitude-type u de la moyenne (en mL)', faux: ['L’incertitude élargie U (en mL)', 'L’incertitude relative u / x̄ (sans unité)', 'La variance de la série (en mL²)'] },
        manque: null, solution: { txt: 'u = s / √n', val: u, u: 'mL' } };
      if (q === 1) return { tokens, texte: [...debut, 'Quelle est l’incertitude élargie U associée à la moyenne de la série, obtenue à partir de l’incertitude-type de type A ?'], utiles: ['s', 'n', 'k'],
        derivees: [{ id: 'u', nom: 'Incertitude-type de la moyenne', expr: 'u = s / √n', val: u, u: 'mL' }],
        raisons: { xm: 'La moyenne ne sert pas à calculer l’incertitude.', res: rRes, dur: rDur },
        cherche: { bonne: 'L’incertitude élargie U de la moyenne (en mL)', faux: ['L’incertitude-type u de la moyenne (en mL)', 'La borne basse x̄ − U de l’intervalle (en mL)', 'L’incertitude relative U / x̄ (en %)'] },
        manque: null, solution: { txt: 'U = k × u', val: U, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quelle est la borne haute de l’intervalle x̄ ± U (x̄ : volume moyen de la série ; U : incertitude élargie associée à cette moyenne, obtenue à partir de l’incertitude-type de type A) ?'], utiles: ['xm', 's', 'n', 'k'],
        derivees: [{ id: 'u', nom: 'Incertitude-type de la moyenne', expr: 'u = s / √n', val: u, u: 'mL' }, { id: 'U', nom: 'Incertitude élargie', expr: 'U = k × u', val: U, u: 'mL' }],
        raisons: { res: rRes, dur: rDur },
        cherche: { bonne: 'La plus grande valeur de l’intervalle centré sur x̄ (en mL)', faux: ['La plus petite valeur de l’intervalle centré sur x̄ (en mL)', 'La demi-largeur de l’intervalle centré sur x̄ (en mL)', 'La largeur totale de l’intervalle centré sur x̄ (en mL)'] },
        manque: null, solution: { txt: 'x̄ + U', val: p.xm + U, u: 'mL' } };
    },
  },
  {
    id: 'compatS', domaine: 'Mesure et incertitudes', titre: 'Une mesure et sa valeur de référence', noms: ['Écart à la référence', 'Compatibilité avec la référence'],
    gen: () => {
      const cref = tire([0.05, 0.1, 0.2]), sg_ = tire([-1, 1]), compat = Math.random() < 0.5;   // un tirage sur deux compatible ; jamais proche du seuil 2
      for (;;) {
        const d = tire([0.001, 0.002, 0.003, 0.004, 0.006]), u = tire([0.001, 0.002, 0.003]), r = d / u;
        if (compat ? r <= 1.51 : r >= 2.5) return { cref, x: Math.round((cref + sg_ * d) * 1000) / 1000, d, u, n: tire([20, 25, 30, 40]), theta: tire([20, 22, 25]) };
      }
    },
    build: (p, q) => {
      const tokens = {
        x: tok(`${nb(p.x, 3)} mol·L⁻¹`, 'Concentration mesurée', p.x, 'mol·L⁻¹'),
        u: tok(`${nb(p.u, 3)} mol·L⁻¹`, 'Incertitude-type de la mesure', p.u, 'mol·L⁻¹'),
        cref: tok(`${nb(p.cref, 3)} mol·L⁻¹`, 'Valeur de référence (solution étalon)', p.cref, 'mol·L⁻¹'),
        n: tok(`${p.n} dosages`, 'Nombre de dosages de la série', p.n, ''),
        theta: tok(`${p.theta} °C`, 'Température du laboratoire', p.theta, '°C'),
      };
      const debut = ['On dose une solution étalon et on trouve ', T('x'), ', avec une incertitude-type ', T('u'), ' (déjà calculée à partir de ', T('n'), '). La valeur de référence de l’étalon est ', T('cref'),
        '. Le laboratoire est à ', T('theta'), '. '];
      const rN = 'Le nombre de dosages a déjà servi à calculer l’incertitude-type, qui est donnée.', rT = 'La température n’intervient pas dans la comparaison.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’écart entre la mesure et la référence ?'], utiles: ['x', 'cref'],
        raisons: { u: 'L’incertitude-type sert à juger l’écart, pas à le calculer.', n: rN, theta: rT },
        cherche: { bonne: 'L’écart |x − x_ref| entre mesure et référence (en mol·L⁻¹)', faux: ['L’incertitude élargie U de la mesure (en mol·L⁻¹)', 'Le rapport de l’écart à l’incertitude-type (sans unité)', 'L’erreur relative de la mesure par rapport à la référence (en %)'] },
        manque: null, solution: { txt: '|x − x_ref|', val: p.d, u: 'mol·L⁻¹' } };
      return { tokens, texte: [...debut, 'La mesure est-elle compatible avec la référence ? (On admet que les résultats suivent une loi normale, que la valeur de référence est connue avec une incertitude négligeable et que le nombre de dosages est assez grand pour que l’incertitude donnée soit bien connue. On applique le critère usuel : la mesure est jugée compatible si l’écart normalisé est au plus égal à 2 ; si la mesure et la référence étaient réellement en accord, un écart normalisé supérieur à 2 apparaîtrait moins d’une fois sur vingt environ.)'], utiles: ['x', 'cref', 'u'],
        derivees: [{ id: 'e', nom: 'Écart à la référence', expr: '|x − x_ref|', val: p.d, u: 'mol·L⁻¹' }, { id: 'r', nom: 'Écart rapporté à l’incertitude-type', expr: '|x − x_ref| / u', val: p.d / p.u, u: '' }],
        raisons: { n: 'Le nombre de dosages a déjà servi à calculer l’incertitude-type, qui est donnée ; on le suppose assez grand (20 dosages ou plus) pour que le seuil 2 convienne : avec peu de dosages, le seuil serait plus grand.', theta: rT },
        cherche: { bonne: 'Si la mesure est compatible avec la référence (oui ou non)', faux: ['L’écart |x − x_ref| entre mesure et référence (en mol·L⁻¹)', 'L’incertitude élargie U de la mesure (en mol·L⁻¹)', 'Le pourcentage d’erreur par rapport à la référence (en %)'] },
        manque: null, solution: { txt: `écart normalisé = |x − x_ref| / u = ${nb(p.d / p.u, 2)} ; seuil 2 : ${p.d / p.u <= 2 ? 'rapport au plus égal à 2, la mesure est compatible avec la référence (réponse : oui)' : 'rapport supérieur à 2, la mesure n’est pas compatible avec la référence (réponse : non)'}`, val: p.d / p.u, u: '' } };
    },
  },

  // ───────────────────────────── Contrôle des systèmes (TSTL) : moteur pas à pas et champ magnétique
  {
    id: 'moteurPas', domaine: 'Contrôle des systèmes', titre: 'Un moteur pas à pas piloté par un programme', noms: ['Angle d’un pas', 'Fréquence des pas', 'Vitesse de rotation', 'Rotation obtenue'],
    gen: () => ({ N: tire([20, 48, 200]), D: tire([4, 5, 8, 10]), Np: tire([100, 200, 400, 600]), U: tire([12, 24]), R: tire([8, 10, 20]) }),
    build: (p, q) => {
      const f = 1000 / p.D;
      const tokens = {
        N: tok(`${p.N} pas par tour`, 'Nombre de pas pour faire un tour complet', p.N, 'pas/tour'),
        D: tok(`${p.D} ms`, 'Attente entre deux pas dans le programme (instruction delay)', p.D, 'ms'),
        Np: tok(`${p.Np} pas`, 'Nombre de pas commandés par le programme', p.Np, 'pas'),
        U: tok(`${p.U} V`, 'Tension d’alimentation', p.U, 'V'),
        R: tok(`${p.R} Ω`, 'Résistance d’une bobine', p.R, 'Ω'),
      };
      const debut = ['Un moteur pas à pas fait ', T('N'), '. Un programme allume les bobines pas après pas, en attendant ', T('D'), ' entre deux pas, et commande ', T('Np'),
        ' au total. Le moteur est alimenté sous ', T('U'), ' et chaque bobine a une résistance de ', T('R'), '. On suppose que chaque instruction fait avancer le rotor d’un pas entier, sans pas manqué, et que le temps d’exécution des instructions est négligeable. '];
      const rU = 'La tension d’alimentation fixe le couple disponible, pas l’angle ni la fréquence des pas.', rR = 'La résistance des bobines fixe le courant, pas l’angle ni la fréquence des pas.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De quel angle tourne le rotor à chaque pas ?'], utiles: ['N'],
        raisons: { D: 'Le délai fixe la vitesse, pas l’angle d’un pas.', Np: 'Le nombre de pas commandés dit combien de pas on fait, pas de quel angle chacun tourne.', U: rU, R: rR },
        cherche: { bonne: 'L’angle d’un pas (en °)', faux: ['La vitesse de rotation (en tr/min)', 'La fréquence des pas (en Hz)', 'Le nombre de tours effectués'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le nombre de pas pour faire un tour complet', 'Il manque le nombre de pas commandés par le programme', 'Il ne manque que la masse du rotor'],
          expl: `Tout est dans l’énoncé : le rotor fait ${tokens.N.aff}. Un tour complet fait 360° et se décompose en N pas égaux. Le nombre de pas commandés (${tokens.Np.aff}) est aussi donné, mais il ne sert pas pour l’angle d’un seul pas.` },
        solution: { txt: 'α = 360° / N', val: 360 / p.N, u: '°' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'Combien de pas le moteur fait-il par seconde ?'], utiles: ['D'],
        raisons: { N: 'Le nombre de pas par tour ne change pas le nombre de pas par seconde.', Np: 'Le nombre total de pas ne donne pas le rythme auquel ils s’enchaînent.', U: rU, R: rR },
        cherche: { bonne: 'La fréquence des pas (en pas par seconde)', faux: ['La vitesse de rotation (en tr/min)', 'La durée totale du programme (en s)', 'L’angle d’un pas (en °)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque l’attente entre deux pas dans le programme', 'Il manque le nombre de pas pour faire un tour complet', 'Il ne manque que le couple résistant'],
          expl: `Tout est dans l’énoncé : l’attente entre deux pas (${tokens.D.aff}). Un pas dure D millisecondes et 1 s = 1 000 ms : en 1 000 ms, on fait 1 000 / D pas. Le nombre de pas par tour (${tokens.N.aff}) est donné, mais il ne sert pas pour compter les pas par seconde.` },
        solution: { txt: 'f = 1 000 / D (D en ms)', val: f, u: 'pas/s' } };
      if (q === 2) return { tokens, texte: [...debut, 'Quelle est la vitesse de rotation du moteur, en tours par minute ?'], utiles: ['N', 'D'],
        derivees: [{ id: 'f', nom: 'Fréquence des pas', expr: 'f = 1 000 / D', val: f, u: 'pas/s' }],
        raisons: { Np: 'Le nombre total de pas ne change pas la vitesse, seulement la durée de la rotation.', U: 'La tension d’alimentation fixe le couple disponible, pas la vitesse de rotation : celle-ci dépend du rythme des pas.', R: 'La résistance des bobines fixe le courant, pas la vitesse de rotation : celle-ci dépend du rythme des pas.' },
        cherche: { bonne: 'La vitesse de rotation n (en tr/min)', faux: ['La fréquence des pas (en Hz)', 'Le nombre de tours effectués', 'L’angle tourné en un pas (en °)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le nombre de pas pour faire un tour complet', 'Il manque l’attente entre deux pas dans le programme', 'Il ne manque que le courant dans les bobines'],
          expl: `Tout est dans l’énoncé : l’attente entre deux pas (${tokens.D.aff}) et le nombre de pas par tour (${tokens.N.aff}). f = 1 000 / D pas par seconde ; ÷ N pas par tour = f/N tours par seconde ; × 60 (1 min = 60 s) pour passer en tours par minute.` },
        solution: { txt: 'n = 60 × f / N', val: 60 * f / p.N, u: 'tr/min' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de tours le rotor fait-il au total ?'], utiles: ['N', 'Np'],
        raisons: { D: 'Le délai fixe la vitesse, pas le nombre de tours : il change seulement la durée.', U: 'La tension ne change pas le nombre de tours : il ne dépend que du nombre de pas commandés et du nombre de pas par tour.', R: 'La résistance des bobines ne change pas le nombre de tours : il ne dépend que du nombre de pas commandés et du nombre de pas par tour.' },
        cherche: { bonne: 'Le nombre de tours effectués', faux: ['La vitesse de rotation (en tr/min)', 'La durée du programme (en s)', 'L’angle d’un pas (en °)'] },
        manque: null, solution: { txt: 'tours = N_p / N', val: p.Np / p.N, u: 'tours' } };
    },
  },
  {
    id: 'champB', domaine: 'Contrôle des systèmes', titre: 'Une boussole près d’un aimant', noms: ['Champ total', 'Déviation de l’aiguille', 'Champ de l’aimant plus loin'],
    schema: (p, b) => ({ type: 'boussole', r1: b.tokens.r1.aff, Ba: b.tokens.Ba.aff, BT: b.tokens.BT.aff }),
    gen: () => {
      const Ba = tire([10, 20, 40, 60, 160]), r1 = tire([8, 10, 12]);
      return { BT: 20, Ba, mT: tire([true, false]), r1, r2: r1 * tire([2, 3]), T: tire([19, 21, 23]) };
    },
    build: (p, q) => {
      const tokens = {
        BT: tok('20 µT', 'Composante horizontale du champ magnétique terrestre', p.BT, 'µT'),
        Ba: tok(p.mT ? `${nb(p.Ba / 1000, 3)} mT` : `${p.Ba} µT`, 'Champ de l’aimant à la distance r₁', p.Ba, 'µT'),
        r1: tok(`${p.r1} cm`, 'Distance boussole – aimant', p.r1, 'cm'),
        r2: tok(`${p.r2} cm`, 'Nouvelle distance boussole – aimant', p.r2, 'cm'),
        T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
      };
      const debut = ['Une boussole est placée à une distance r₁ = ', T('r1'), ' du centre d’un aimant droit, sur l’axe de cet aimant, orienté perpendiculairement à la direction du nord.\n\nSur l’axe d’un aimant droit, le champ de l’aimant est dirigé selon cet axe : il est donc perpendiculaire à la composante horizontale du champ de la Terre.\n\nÀ cet endroit, le champ de l’aimant vaut ',
        T('Ba'), ' et la composante horizontale du champ de la Terre vaut ', T('BT'), '.\n\nOn néglige tout autre champ magnétique. La salle est à ', T('T'), '. On pourra éloigner la boussole à une distance r₂ = ', T('r2'), ' ; tant que la distance reste grande devant la taille de l’aimant, son champ décroît comme 1/r³. '];
      const rT = 'La température n’intervient pas ici.';
      const rr1 = 'La distance est déjà contenue dans la valeur du champ de l’aimant donnée à cet endroit.', rr2 = 'Cette distance ne concerne pas cette question : le champ utilisé est celui donné à r₁.';
      const Bt = Math.hypot(p.BT, p.Ba);
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le champ magnétique total à l’endroit de la boussole (placée à r₁) ?'], utiles: ['BT', 'Ba'],
        raisons: { r1: rr1, r2: rr2, T: rT },
        cherche: { bonne: 'L’intensité du champ magnétique total (en µT)', faux: ['L’angle de déviation de l’aiguille (en °)', 'Le champ de l’aimant à la distance r₂ (en µT)', 'Le champ total à la distance r₂ (en µT)'] },
        manque: null,
        solution: { txt: 'B = √(B_T² + B_a²) (les deux champs sont perpendiculaires : côtés d’un triangle rectangle)', val: Bt, u: 'µT' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'De quel angle l’aiguille de la boussole dévie-t-elle par rapport au nord ?'], utiles: ['BT', 'Ba'],
        raisons: { r1: rr1, r2: rr2, T: rT },
        cherche: { bonne: 'L’angle de déviation α de l’aiguille (en °)', faux: ['L’intensité du champ total (en µT)', 'Le champ de l’aimant à la distance r₂ (en µT)', 'L’angle entre le champ de l’aimant et le champ de la Terre (en °)'] },
        manque: null,
        solution: { txt: 'α = arctan(B_a / B_T) (l’aiguille se place selon le champ total : tan α = B_a / B_T)', val: Math.atan(p.Ba / p.BT) * 180 / Math.PI, u: '°' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le champ de l’aimant lorsque la boussole est à la distance r₂ ?'], utiles: ['Ba', 'r1', 'r2'],
        raisons: { BT: 'Le champ de la Terre ne dépend pas de la distance à l’aimant, et on cherche le champ de l’aimant seul.', T: rT },
        cherche: { bonne: 'Le champ magnétique de l’aimant à la distance r₂ (en µT)', faux: ['Le champ magnétique total à la distance r₂ (en µT)', 'La déviation de l’aiguille de la boussole à r₂ (en °)', 'La variation du champ de l’aimant entre r₁ et r₂ (en µT)'] },
        manque: null, solution: { txt: 'B₂ = B_a × (r₁ / r₂)³', val: p.Ba * (p.r1 / p.r2) ** 3, u: 'µT' } };
    },
  },

  // ───────────────────────────── Mouvement et vitesse (seconde)
  {
    id: 'trajet', domaine: 'Mouvement et vitesse', titre: 'Un trajet en train', noms: ['Vitesse moyenne du train', 'Durée d’un autre trajet'],
    gen: () => { const v = tire([80, 100, 120, 150]), dur = tire([90, 120, 150, 180]), h0 = tire([7, 8, 9, 14]), m0 = tire([0, 15, 30, 45]);
      return { v, dur, h0, m0, d: v * dur / 60, pass: tire([180, 240, 320, 410]), prix: tire([24, 32, 45]) }; },
    build: (p, q) => {
      const hm = min => `${Math.floor(min / 60) % 24} h ${String(min % 60).padStart(2, '0')}`;
      const dep = p.h0 * 60 + p.m0, arr = dep + p.dur;
      const tokens = {
        d: tok(`${p.d} km`, 'Distance parcourue par le train', p.d, 'km'),
        dep: tok(hm(dep), 'Heure de départ', dep / 60, 'h'),
        arr: tok(hm(arr), 'Heure d’arrivée', arr / 60, 'h'),
        pass: tok(`${p.pass} passagers`, 'Nombre de passagers', p.pass, ''),
        prix: tok(`${p.prix} €`, 'Prix du billet', p.prix, '€'),
      };
      if (q === 0) return { tokens,
        derivees: [{ id: 'dt', nom: 'Durée Δt du trajet', expr: 'Δt = heure d’arrivée − heure de départ', val: p.dur / 60, u: 'h' }],
        texte: ['Un train part de la gare à ', T('dep'), ' et arrive à destination à ', T('arr'), '. Il transporte ', T('pass'), ' et parcourt ', T('d'), '. Le billet coûte ', T('prix'), '. Quelle est la vitesse moyenne du train ?'],
        utiles: ['d', 'dep', 'arr'],
        raisons: { pass: 'Le nombre de passagers ne change pas la vitesse du train dans cet exercice.', prix: 'Le prix du billet n’a aucun rapport avec la vitesse.' },
        cherche: { bonne: 'La vitesse moyenne v du train (en km·h⁻¹)', faux: ['La vitesse maximale atteinte par le train (en km·h⁻¹)', 'La durée du trajet (en h)', 'L’accélération du train (en m·s⁻²)'] },
        manque: null, solution: { txt: 'v = d / Δt', val: p.v, u: 'km·h⁻¹' } };
      tokens.v = tok(`${p.v} km·h⁻¹`, 'Vitesse moyenne d’un autre train', p.v, 'km·h⁻¹'); delete tokens.arr;
      return { tokens, derivees: [],
        texte: ['Un autre train roule à la vitesse moyenne de ', T('v'), '. Il part à ', T('dep'), ' avec ', T('pass'), ' et doit parcourir ', T('d'), '. Le billet coûte ', T('prix'), '. Combien de temps dure ce trajet ?'],
        utiles: ['v', 'd'],
        raisons: { dep: 'L’heure de départ permettrait de calculer l’heure d’arrivée, mais on demande seulement la durée.', pass: 'Le nombre de passagers ne change pas la durée du trajet.', prix: 'Le prix du billet n’a aucun rapport avec la durée.' },
        cherche: { bonne: 'La durée Δt de ce trajet du train (en h)', faux: ['L’heure d’arrivée du train (en h)', 'La vitesse du train à l’arrivée (en km·h⁻¹)', 'L’accélération du train au départ (en m·s⁻²)'] },
        manque: null, solution: { txt: 'Δt = d / v', val: p.dur / 60, u: 'h' } };
    },
  },
  {
    id: 'course', domaine: 'Mouvement et vitesse', titre: 'Une course à pied ou à vélo', noms: ['Vitesse en m·s⁻¹', 'Distance parcourue en roulant'],
    gen: () => { const [d, t] = tire([[5, 28], [6, 33], [8, 42], [10, 55]]); return { d, t, v: tire([15, 20, 25, 30]), tv: tire([30, 45, 90]), age: tire([17, 24, 31, 45]), dos: tire([128, 245, 316, 470]) }; },
    build: (p, q) => {
      const tokens = {
        age: tok(`${p.age} ans`, 'Âge de la personne', p.age, 'ans'),
        dos: tok(`n° ${p.dos}`, 'Numéro de dossard', p.dos, ''),
      };
      if (q === 0) {
        tokens.d = tok(`${p.d} km`, 'Distance parcourue', p.d * 1000, 'm');
        tokens.t = tok(`${p.t} min`, 'Durée de la course', p.t * 60, 's');
        return { tokens, derivees: [],
          texte: ['Un coureur de ', T('age'), ' porte le dossard ', T('dos'), '. Il parcourt ', T('d'), ' en ', T('t'), '. Quelle est sa vitesse moyenne, en mètres par seconde ?'],
          utiles: ['d', 't'],
          raisons: { age: 'L’âge du coureur ne change pas le calcul de sa vitesse.', dos: 'Le numéro de dossard sert à identifier le coureur, pas à calculer sa vitesse.' },
          cherche: { bonne: 'La vitesse moyenne v du coureur (en m·s⁻¹)', faux: ['L’accélération moyenne du coureur (en m·s⁻²)', 'La durée pour courir 1 km à cette allure (en s)', 'L’énergie dépensée par le coureur (en J)'] },
          manque: null, solution: { txt: 'v = d / Δt, avec d en m et Δt en s', val: p.d * 1000 / (p.t * 60), u: 'm·s⁻¹' } };
      }
      tokens.v = tok(`${p.v} km·h⁻¹`, 'Vitesse du cycliste', p.v, 'km·h⁻¹');
      tokens.tv = tok(`${p.tv} min`, 'Durée du trajet à vélo', p.tv / 60, 'h');
      return { tokens, derivees: [],
        texte: ['Un cycliste de ', T('age'), ' roule à la vitesse constante de ', T('v'), ' pendant ', T('tv'), '. Il porte le dossard ', T('dos'), '. Quelle distance parcourt-il, en kilomètres ?'],
        utiles: ['v', 'tv'],
        raisons: { age: 'L’âge du cycliste ne change pas la distance parcourue.', dos: 'Le numéro de dossard sert à identifier le cycliste, pas à calculer une distance.' },
        cherche: { bonne: 'La distance d parcourue par le cycliste (en km)', faux: ['L’accélération du cycliste (en m·s⁻²)', 'La durée pour parcourir 1 km à cette vitesse (en min)', 'Le nombre de tours de roue'] },
        manque: null, solution: { txt: 'd = v × Δt, avec Δt en h', val: p.v * p.tv / 60, u: 'km' } };
    },
  },
  // ───────────────────────────── Interactions et champs (1re spécialité)
  {
    id: 'gravi', domaine: 'Interactions et champs', titre: 'Interaction gravitationnelle', noms: ['Force entre deux satellites', 'Champ de gravitation d’une planète'],
    gen: () => { const [M, ex, R] = tire([[6.42, 23, 3390], [4.87, 24, 6052], [5.97, 24, 6371]]); return { M, ex, R, m1: tire([2, 5, 8]), m2: tire([3, 4, 6]), d: tire([10, 20, 50]), an: tire([1999, 2008, 2015]),
      h: tire([200, 400, 800]), m: tire([50, 70, 90]), G: 6.674e-11 }; },
    build: (p, q) => {
      const sci = x => nb(Number((x).toPrecision(3))).replace('.', ',');
      const tokens = { G: tok('G = 6,674 × 10⁻¹¹ N·m²·kg⁻²', 'Constante de gravitation universelle', p.G, 'N·m²·kg⁻²') };
      if (q === 0) {
        tokens.m1 = tok(`${p.m1} tonnes`, 'Masse du satellite 1', p.m1 * 1000, 'kg');
        tokens.m2 = tok(`${p.m2} tonnes`, 'Masse du satellite 2', p.m2 * 1000, 'kg');
        tokens.d = tok(`${p.d} m`, 'Distance entre les centres des satellites', p.d, 'm');
        tokens.an = tok(`${p.an}`, 'Année de lancement', p.an, '');
        return { tokens, derivees: [],
          texte: ['Deux satellites, lancés en ', T('an'), ', ont pour masses ', T('m1'), ' et ', T('m2'), '. Leurs centres sont distants de ', T('d'), '. On les assimile à des points (leur taille est négligeable devant la distance). On donne ', T('G'), '. Quelle est la valeur de la force d’attraction gravitationnelle entre eux ?'],
          utiles: ['G', 'm1', 'm2', 'd'],
          raisons: { an: 'L’année de lancement n’intervient pas dans la loi de la gravitation.' },
          cherche: { bonne: 'La force gravitationnelle F entre les deux satellites (en N)', faux: ['Le champ de gravitation créé par un satellite (en N·kg⁻¹)', 'Le poids d’un satellite sur la Terre (en N)', 'La force exercée par la Terre sur un satellite (en N)'] },
          manque: null, solution: { txt: 'F = G·m₁·m₂ / d²', val: p.G * p.m1 * p.m2 * 1e6 / (p.d * p.d), u: 'N' } };
      }
      tokens.M = tok(`${sci(p.M)} × 10${p.ex === 23 ? '²³' : '²⁴'} kg`, 'Masse de la planète', p.M * Math.pow(10, p.ex), 'kg');
      tokens.R = tok(`${p.R} km`, 'Rayon de la planète', p.R * 1000, 'm');
      tokens.h = tok(`${p.h} km`, 'Altitude du point étudié', p.h * 1000, 'm');
      tokens.m = tok(`${p.m} kg`, 'Masse d’une sonde posée sur le sol', p.m, 'kg');
      return { tokens,
        derivees: [{ id: 'd', nom: 'Distance d au centre de la planète', expr: 'd = rayon + altitude', val: (p.R + p.h) * 1000, u: 'm' }],
        texte: ['Une planète sphérique de masse ', T('M'), ' a un rayon de ', T('R'), '. Une sonde de ', T('m'), ' est posée sur le sol. On donne ', T('G'), '. Quelle est la valeur du champ de gravitation créé par la planète en un point situé à ', T('h'), ' d’altitude (au-dessus du sol) ?'],
        utiles: ['G', 'M', 'R', 'h'],
        raisons: { m: 'Le champ de gravitation créé par la planète ne dépend pas de la masse de la sonde qui s’y trouve.' },
        cherche: { bonne: 'Le champ de gravitation g créé par la planète (en N·kg⁻¹)', faux: ['La force de gravitation subie par la sonde (en N)', 'L’intensité de la pesanteur à la surface de la planète (en N·kg⁻¹)', 'La distance d du point au centre de la planète (en m)'] },
        manque: null, solution: { txt: 'g = G·M / d², avec d = R + h', val: p.G * p.M * Math.pow(10, p.ex) / Math.pow((p.R + p.h) * 1000, 2), u: 'N·kg⁻¹' } };
    },
  },
  {
    id: 'electro', domaine: 'Interactions et champs', titre: 'Interaction électrostatique', noms: ['Force entre deux charges', 'Force dans un champ uniforme'],
    gen: () => ({ q1: tire([2, 4, 5]), q2: tire([3, 6, 8]), d: tire([2, 4, 5]), U: tire([100, 200, 300]), e: tire([2, 4, 5]), q: tire([2, 5, 10]), mp: tire([20, 50, 100]) }),
    build: (p, q) => {
      const tokens = {};
      if (q === 0) {
        tokens.k = tok('k = 9,0 × 10⁹ N·m²·C⁻²', 'Constante de la loi de Coulomb', 9.0e9, 'N·m²·C⁻²');
        tokens.q1 = tok(`${p.q1} nC`, 'Charge de la bille 1', p.q1 * 1e-9, 'C');
        tokens.q2 = tok(`${p.q2} nC`, 'Charge de la bille 2', p.q2 * 1e-9, 'C');
        tokens.d = tok(`${p.d} cm`, 'Distance entre les billes', p.d * 1e-2, 'm');
        tokens.mp = tok(`${p.mp} g`, 'Masse de chaque bille', p.mp * 1e-3, 'kg');
        return { tokens, derivees: [],
          texte: ['Deux petites billes de ', T('mp'), ' portent des charges de ', T('q1'), ' et ', T('q2'), '. Leurs centres sont distants de ', T('d'), '. On donne ', T('k'), '. Les billes sont assimilées à des charges ponctuelles placées dans l’air (assimilé au vide). Quelle est la valeur de la force électrostatique entre les billes ?'],
          utiles: ['k', 'q1', 'q2', 'd'],
          raisons: { mp: 'La masse des billes n’intervient pas dans la loi de Coulomb (elle servirait pour calculer leur poids ou leur accélération).' },
          cherche: { bonne: 'La force électrostatique F entre les deux billes (en N)', faux: ['Le champ électrique créé par une bille (en V·m⁻¹)', 'La force gravitationnelle entre les deux billes (en N)', 'Le poids des billes (en N)'] },
          manque: null, solution: { txt: 'F = k·|q₁·q₂| / d²', val: 9.0e9 * p.q1 * 1e-9 * p.q2 * 1e-9 / Math.pow(p.d * 1e-2, 2), u: 'N' } };
      }
      tokens.U = tok(`${p.U} V`, 'Tension entre les plaques', p.U, 'V');
      tokens.e = tok(`${p.e} mm`, 'Distance entre les plaques', p.e * 1e-3, 'm');
      tokens.q = tok(`${p.q} nC`, 'Charge de la petite boule', p.q * 1e-9, 'C');
      tokens.mp = tok(`${p.mp} mg`, 'Masse de la petite boule', p.mp * 1e-6, 'kg');
      return { tokens,
        derivees: [{ id: 'E', nom: 'Valeur du champ électrique E entre les plaques', expr: 'E = U / distance', val: p.U / (p.e * 1e-3), u: 'V·m⁻¹' }],
        texte: ['Deux plaques parallèles, distantes de ', T('e'), ', sont reliées à un générateur qui impose une tension de ', T('U'), '. Une petite boule de ', T('mp'), ', portant une charge de ', T('q'), ', est placée entre les plaques. On néglige les effets de bord : le champ est uniforme entre les plaques. Quelle est la valeur de la force électrique qu’elle subit ?'],
        utiles: ['U', 'e', 'q'],
        raisons: { mp: 'La masse de la boule n’intervient pas dans la force électrique F = q·E (elle servirait pour son poids).' },
        cherche: { bonne: 'La force électrique F subie par la boule (en N)', faux: ['Le champ électrique E entre les plaques (en V·m⁻¹)', 'Le poids de la boule (en N)', 'L’énergie potentielle électrique de la boule (en J)'] },
        manque: null, solution: { txt: 'F = q·E, avec E = U / distance', val: p.q * 1e-9 * p.U / (p.e * 1e-3), u: 'N' } };
    },
  },
  // ───────────────────────────── Seconde et première : « de quelle grandeur s'agit-il ? » (masse ou volume, kg ou g, mL ou L, min ou h…)
  {
    id: 'rho2', domaine: 'Solutions et concentration', titre: 'La masse volumique d’un liquide', noms: ['Masse volumique du liquide', 'Masse d’un volume de liquide'],
    gen: () => { const liq = tire([['de l’huile', 0.92], ['de l’éthanol', 0.79], ['du glycérol', 1.26], ['du sirop', 1.30]]); const V = tire([20, 25, 40, 50]), mv = tire([45, 52, 60]);
      return { nom: liq[0], rho: liq[1], V, mv, mt: Math.round((mv + liq[1] * V) * 10) / 10, T: tire([18, 20, 22]), VL: tire([0.25, 0.5, 1.5, 2]) }; },
    build: (p, q) => {
      const tokens = { T: tok(`${p.T} °C`, 'Température du laboratoire', p.T, '°C') };
      if (q === 0) {
        tokens.mv = tok(`${nb(p.mv, 1)} g`, 'Masse de l’éprouvette vide', p.mv, 'g');
        tokens.mt = tok(`${nb(p.mt, 1)} g`, 'Masse de l’éprouvette contenant le liquide', p.mt, 'g');
        tokens.V = tok(`${p.V} mL`, 'Volume de liquide dans l’éprouvette', p.V, 'mL');
        return { tokens, derivees: [{ id: 'm', nom: 'Masse m du liquide seul', expr: 'm = masse avec le liquide − masse de l’éprouvette vide', val: Math.round((p.mt - p.mv) * 10) / 10, u: 'g' }],
          texte: ['Pour déterminer la masse volumique d’un liquide, on pèse une éprouvette graduée vide : ', T('mv'), '. On y verse du liquide jusqu’à lire ', T('V'), ', et on pèse l’ensemble : ', T('mt'), '. La température du laboratoire est de ', T('T'), '. Quelle est la masse volumique de ce liquide (en g·mL⁻¹) ?'],
          utiles: ['mv', 'mt', 'V'],
          raisons: { T: 'On mesure directement m et V : la température ne figure pas dans la formule ρ = m / V. Elle précise seulement à quelle température la valeur de ρ est valable (un volume varie un peu avec la température).' },
          cherche: { bonne: 'La masse volumique ρ du liquide (en g·mL⁻¹)', faux: ['La masse m du liquide seul (en g)', 'Le poids du liquide (en N)', 'La quantité de matière de liquide (en mol)'] },
          manque: null, solution: { txt: 'ρ = m / V, avec m = m_avec liquide − m_éprouvette', val: (p.mt - p.mv) / p.V, u: 'g·mL⁻¹' } };
      }
      delete tokens.T;
      tokens.rho = tok(`${nb(p.rho, 2)} g·mL⁻¹`, 'Masse volumique du liquide', p.rho, 'g·mL⁻¹');
      tokens.VL = tok(`${nb(p.VL, 2)} L`, 'Volume de liquide à peser', p.VL * 1000, 'mL');
      tokens.mv = tok(`${nb(p.mv, 1)} g`, 'Masse du flacon vide', p.mv, 'g');
      return { tokens, derivees: [],
        texte: ['La masse volumique ' + p.nom + ' vaut ', T('rho'), '. Un technicien en verse ', T('VL'), ' dans un flacon vide de masse ', T('mv'), '. Quelle est la masse de liquide versé (en g) ?'],
        utiles: ['rho', 'VL'],
        raisons: { mv: 'La masse du flacon vide ne compte pas : on demande la masse du liquide seul.' },
        cherche: { bonne: 'La masse m de liquide versé (en g)', faux: ['La masse totale flacon + liquide (en g)', 'Le poids du liquide (en N)', 'La quantité de matière de liquide (en mol)'] },
        manque: null, solution: { txt: 'm = ρ × V (avec V converti en mL)', val: p.rho * p.VL * 1000, u: 'g' } };
    },
  },
  {
    id: 'conc2', domaine: 'Solutions et concentration', titre: 'Préparer une solution de sel', noms: ['Concentration en masse de la solution', 'Masse de sel à peser'],
    gen: () => { const Vf = tire([100, 250, 500]); return { m: tire([2, 5, 10, 15]), Vf, Vi: Math.round(Vf * tire([0.4, 0.6])), t: tire([9, 20, 40]), M: 58.5 }; },
    build: (p, q) => {
      const tokens = { M: tok('58,5 g·mol⁻¹', 'Masse molaire du chlorure de sodium', p.M, 'g·mol⁻¹') };
      if (q === 0) {
        tokens.m = tok(`${p.m} g`, 'Masse de sel pesée', p.m, 'g');
        tokens.Vi = tok(`${p.Vi} mL`, 'Volume d’eau versé pour dissoudre le sel', p.Vi / 1000, 'L');
        tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution (fiole jaugée)', p.Vf / 1000, 'L');
        return { tokens, derivees: [],
          texte: ['Un élève pèse ', T('m'), ' de chlorure de sodium. Il les dissout dans environ ', T('Vi'), ' d’eau distillée dans une fiole jaugée de ', T('Vf'), ', puis complète avec de l’eau jusqu’au trait de jauge. Données : masse molaire du chlorure de sodium ', T('M'), '. Quelle est la concentration en masse de la solution (en g·L⁻¹) ?'],
          utiles: ['m', 'Vf'],
          raisons: { Vi: 'C’est le volume d’eau versé au début, pas le volume de la solution : le volume de la solution, c’est celui de la fiole jaugée (jusqu’au trait de jauge).', M: 'La masse molaire sert à calculer une concentration en quantité de matière (mol·L⁻¹), pas une concentration en masse.' },
          cherche: { bonne: 'La concentration en masse t de la solution (en g·L⁻¹)', faux: ['La quantité de matière de sel dissous (en mol)', 'La masse volumique de la solution (en g·L⁻¹)', 'La concentration en quantité de matière (en mol·L⁻¹)'] },
          manque: null, solution: { txt: 't = m / V (avec V converti en L)', val: p.m / (p.Vf / 1000), u: 'g·L⁻¹' } };
      }
      tokens.t = tok(`${p.t} g·L⁻¹`, 'Concentration en masse souhaitée', p.t, 'g·L⁻¹');
      tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution à préparer (fiole jaugée)', p.Vf / 1000, 'L');
      tokens.Vi = tok(`${p.Vi} mL`, 'Volume d’eau versé pour dissoudre le sel', p.Vi / 1000, 'L');
      return { tokens, derivees: [],
        texte: ['On veut préparer une solution de chlorure de sodium de concentration en masse ', T('t'), ', dans une fiole jaugée de ', T('Vf'), '. On dissoudra d’abord le sel dans environ ', T('Vi'), ' d’eau. Données : masse molaire du chlorure de sodium ', T('M'), '. Quelle masse de sel faut-il peser (en g) ?'],
        utiles: ['t', 'Vf'],
        raisons: { Vi: 'C’est le volume d’eau versé au début : la solution finale fait le volume de la fiole jaugée.', M: 'La masse molaire n’intervient pas : la concentration est donnée en masse, pas en quantité de matière.' },
        cherche: { bonne: 'La masse de chlorure de sodium solide nécessaire (en g)', faux: ['La quantité de matière de sel à peser (en mol)', 'La masse volumique de la solution (en g·L⁻¹)', 'La concentration en quantité de matière (en mol·L⁻¹)'] },
        manque: null, solution: { txt: 'm = t × V (avec V converti en L)', val: p.t * p.Vf / 1000, u: 'g' } };
    },
  },
  {
    id: 'poids2', domaine: 'Forces et principe d’inertie', titre: 'Le poids d’un objet', noms: ['Poids sur la Terre', 'Poids sur un autre astre'],
    gen: () => { const a = tire([['la Lune', 1.6], ['Mars', 3.7], ['Vénus', 8.9]]); const mat = tire([['fer', 7.9], ['aluminium', 2.7], ['cuivre', 9.0], ['laiton', 8.5]]); const mg = tire([250, 350, 500, 650, 750, 900]);
      return { astre: a[0], ga: a[1], mat: mat[0], mg, V: Math.round(mg / mat[1]), mk: tire([2.4, 3.5, 12, 60]) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { mg: tok(`${p.mg} g`, 'Masse de l’objet', p.mg / 1000, 'kg'), g: tok('g = 9,81 N·kg⁻¹', 'Intensité de la pesanteur sur Terre', 9.81, 'N·kg⁻¹'), V: tok(`${p.V} cm³`, 'Volume de l’objet', p.V, 'cm³') };
        return { tokens, derivees: [],
          texte: ['Un objet en ' + p.mat + ' de ', T('mg'), ' et de volume ', T('V'), ' est accroché à un dynamomètre sur Terre. Donnée : intensité de la pesanteur sur Terre, ', T('g'), '. Quel est le poids de l’objet (en N) ?'],
          utiles: ['mg', 'g'],
          raisons: { V: 'Le volume de l’objet n’intervient pas dans le calcul du poids : c’est la masse (en kg) qui compte.' },
          cherche: { bonne: 'Le poids P de l’objet suspendu au dynamomètre (en N)', faux: ['La masse volumique de l’objet (en g·cm⁻³)', 'L’énergie potentielle de pesanteur de l’objet (en J)', 'Le poids de l’objet s’il était sur la Lune (en N)'] },
          manque: null, solution: { txt: 'P = m × g (avec m convertie en kg)', val: p.mg / 1000 * 9.81, u: 'N' } };
      }
      const tokens = { mk: tok(`${nb(p.mk)} kg`, 'Masse de l’objet', p.mk, 'kg'), ga: tok(`${nb(p.ga, 1)} N·kg⁻¹`, 'Intensité de la pesanteur sur ' + p.astre, p.ga, 'N·kg⁻¹'), g: tok('9,81 N·kg⁻¹', 'Intensité de la pesanteur sur Terre', 9.81, 'N·kg⁻¹') };
      const sur = p.astre === 'Mars' || p.astre === 'Vénus' ? 'sur ' + p.astre : 'sur la Lune';
      return { tokens, derivees: [],
        texte: ['Un objet de ', T('mk'), ' est envoyé ' + sur + ', où l’intensité de la pesanteur vaut ', T('ga'), '. Sur Terre, elle vaut ', T('g'), '. Quel est le poids de l’objet ' + sur + ' (en N) ?'],
        utiles: ['mk', 'ga'],
        raisons: { g: 'La valeur de g sur Terre ne sert pas : on cherche le poids ' + sur + ', où la pesanteur est différente.' },
        cherche: { bonne: 'Le poids P de l’objet ' + sur + ' (en N)', faux: ['La variation de poids de l’objet entre la Terre et ' + sur.replace('sur ', '') + ' (en N)', 'Le poids de l’objet sur Terre (en N)', 'L’énergie potentielle de l’objet à 1 m du sol (en J)'] },
        manque: null, solution: { txt: 'P = m × g (avec g de ' + p.astre + ')', val: p.mk * p.ga, u: 'N' } };
    },
  },
  {
    id: 'chute2', domaine: 'Forces et principe d’inertie', titre: 'Une chronophotographie de chute libre', noms: ['Vitesse de la bille en M₃', 'Variation de vitesse entre deux photos'],
    gen: () => { const tau = tire([0.10, 0.20, 0.25]); return { tau, d: Math.round(39.2 * tau * tau * 100) / 100, H: Math.round(313.6 * tau * tau * 10) / 10, m: tire([20, 50, 100]),
      v1: Math.round(29.4 * tau * 100) / 100, v2: Math.round(39.2 * tau * 100) / 100 }; },
    build: (p, q) => {
      const tokens = { tau: tok(`${nb(p.tau, 2)} s`, 'Durée entre deux photos successives', p.tau, 's'), m: tok(`${p.m} g`, 'Masse de la bille', p.m / 1000, 'kg') };
      const debut = ['Une bille est lâchée sans vitesse initiale et filmée en chute libre : une photo est prise toutes les ', T('tau'), '. La bille a une masse de ', T('m'), '. '];
      if (q === 0) {
        tokens.d = tok(`${nb(p.d, 2)} m`, 'Distance entre les positions M₂ et M₄', p.d, 'm');
        tokens.H = tok(`${nb(p.H, 1)} m`, 'Hauteur totale de chute sur les 9 photos', p.H, 'm');
        return { tokens, derivees: [{ id: 'dur', nom: 'Durée entre M₂ et M₄ (deux intervalles)', expr: '2 × τ', val: 2 * p.tau, u: 's' }],
          texte: [...debut, 'Sur les 9 photos, la hauteur totale de chute est ', T('H'), ', et la distance M₂M₄ vaut ', T('d'), '. Quelle est la valeur de la vitesse de la bille au point M₃ (en m/s) ?'],
          utiles: ['tau', 'd'],
          raisons: { H: 'La hauteur totale de chute ne sert pas : la vitesse en M₃ se déduit de la distance M₂M₄ et de la durée correspondante.', m: 'La masse de la bille n’intervient pas pour déduire une vitesse d’une chronophotographie.' },
          cherche: { bonne: 'La valeur de la vitesse v de la bille au point M₃ (en m/s)', faux: ['La valeur de la variation de vitesse Δv entre deux photos (en m/s)', 'La valeur du poids de la bille (en N)', 'La durée totale de la chute (en s)'] },
          manque: null, solution: { txt: 'v ≈ M₂M₄ / (2τ)', val: p.d / (2 * p.tau), u: 'm/s' } };
      }
      tokens.v1 = tok(`${nb(p.v1, 2)} m/s`, 'Valeur de la vitesse à une photo', p.v1, 'm/s');
      tokens.v2 = tok(`${nb(p.v2, 2)} m/s`, 'Valeur de la vitesse à la photo suivante', p.v2, 'm/s');
      return { tokens, derivees: [],
        texte: [...debut, 'La valeur de sa vitesse est ', T('v1'), ' à une photo, puis ', T('v2'), ' à la photo suivante, vers le bas dans les deux cas. Quelle est la valeur de la variation de vitesse Δv entre ces deux photos (en m/s) ?'],
        utiles: ['v1', 'v2'],
        raisons: { tau: 'La durée entre deux photos ne sert pas pour la valeur de Δv : on compare simplement les deux vitesses.', m: 'La masse de la bille n’intervient pas dans la variation de vitesse (frottements négligés).' },
        cherche: { bonne: 'La valeur de la variation de vitesse Δv entre les deux photos (en m/s)', faux: ['La valeur moyenne de la vitesse entre les deux photos (en m/s)', 'La distance parcourue entre les deux photos (en m)', 'La valeur du poids de la bille (en N)'] },
        manque: null, solution: { txt: 'Δv = v₂ − v₁ (même sens)', val: p.v2 - p.v1, u: 'm/s' } };
    },
  },
  {
    id: 'vitesse2', domaine: 'Mouvement et vitesse', titre: 'La vitesse d’un cycliste', noms: ['Vitesse moyenne', 'Durée du trajet'],
    gen: () => { const [d, t] = tire([[6, 20], [9, 20], [9, 25], [3, 10], [4.5, 15], [15, 40], [12, 25]]); const [v, tt] = tire([[18, 200], [21.6, 300], [25.2, 400], [28.8, 600]]);
      return { d, t, m: tire([65, 72, 80]), v, dm: Math.round(v / 3.6 * tt) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { d: tok(`${nb(p.d)} km`, 'Distance parcourue', p.d * 1000, 'm'), t: tok(`${p.t} min`, 'Durée du trajet', p.t * 60, 's'), m: tok(`${p.m} kg`, 'Masse du cycliste', p.m, 'kg') };
        return { tokens, derivees: [],
          texte: ['Un cycliste de ', T('m'), ' parcourt ', T('d'), ' en ', T('t'), '. Quelle est sa vitesse moyenne (en m·s⁻¹) ?'],
          utiles: ['d', 't'],
          raisons: { m: 'La masse du cycliste ne sert pas à calculer sa vitesse : c’est une masse, pas une distance ni une durée.' },
          cherche: { bonne: 'La vitesse moyenne v du cycliste (en m·s⁻¹)', faux: ['L’accélération moyenne du cycliste (en m·s⁻²)', 'La distance qu’il parcourrait en une heure à cette vitesse (en km)', 'L’énergie cinétique du cycliste (en J)'] },
          manque: null, solution: { txt: 'v = d / Δt (d en m, Δt en s)', val: p.d * 1000 / (p.t * 60), u: 'm·s⁻¹' } };
      }
      const tokens = { dm: tok(`${p.dm} m`, 'Distance à parcourir', p.dm, 'm'), v: tok(`${nb(p.v)} km·h⁻¹`, 'Vitesse moyenne du cycliste', p.v / 3.6, 'm·s⁻¹'), m: tok(`${p.m} kg`, 'Masse du cycliste', p.m, 'kg') };
      return { tokens, derivees: [],
        texte: ['Un cycliste de ', T('m'), ' doit parcourir ', T('dm'), ' à la vitesse moyenne de ', T('v'), '. Quelle est la durée du trajet (en s) ?'],
        utiles: ['dm', 'v'],
        raisons: { m: 'La masse du cycliste n’intervient pas : on cherche une durée à partir d’une distance et d’une vitesse.' },
        cherche: { bonne: 'La durée Δt du trajet (en s)', faux: ['L’accélération moyenne du cycliste (en m·s⁻²)', 'La distance parcourue en 10 s à cette vitesse (en m)', 'L’énergie cinétique du cycliste (en J)'] },
        manque: null, solution: { txt: 'Δt = d / v (v convertie en m·s⁻¹)', val: p.dm / (p.v / 3.6), u: 's' } };
    },
  },
  {
    id: 'ohm2', domaine: 'Circuits électriques', titre: 'Un résistor dans un circuit', noms: ['Tension aux bornes du résistor', 'Intensité du courant'],
    gen: () => ({ R: tire([1.0, 2.2, 4.7]), I: tire([1, 2]), Rm: tire([470, 1000, 2200]), U: tire([3, 6, 9]), L: tire([20, 40]) }),
    build: (p, q) => {
      if (q === 0) {
        const tokens = { R: tok(`${nb(p.R, 1)} kΩ`, 'Résistance du résistor', p.R * 1000, 'Ω'), I: tok(`${p.I} mA`, 'Intensité du courant', p.I / 1000, 'A'), L: tok(`${p.L} cm`, 'Longueur du fil de connexion', p.L / 100, 'm') };
        return { tokens, derivees: [],
          texte: ['Un résistor ohmique de résistance ', T('R'), ' est traversé par un courant d’intensité ', T('I'), '. Il est relié au circuit par un fil de ', T('L'), '. Quelle est la tension à ses bornes (en V) ?'],
          utiles: ['R', 'I'],
          raisons: { L: 'La longueur du fil est une longueur : elle n’apparaît pas dans la loi d’Ohm U = R × I (et la résistance de ce fil est négligeable devant celle du résistor).' },
          cherche: { bonne: 'La différence de potentiel aux bornes du résistor (en V)', faux: ['La puissance reçue par le résistor (en W)', 'L’énergie reçue par le résistor en 1 min (en J)', 'La charge traversant le résistor en 1 min (en C)'] },
          manque: null, solution: { txt: 'U = R × I (R en Ω, I en A)', val: p.R * 1000 * p.I / 1000, u: 'V' } };
      }
      const tokens = { U: tok(`${p.U} V`, 'Tension aux bornes du résistor', p.U, 'V'), Rm: tok(`${p.Rm} Ω`, 'Résistance du résistor', p.Rm, 'Ω'), L: tok(`${p.L} cm`, 'Longueur du fil de connexion', p.L / 100, 'm') };
      return { tokens, derivees: [],
        texte: ['Un générateur impose une tension de ', T('U'), ' aux bornes d’un résistor ohmique de résistance ', T('Rm'), ', relié par un fil de ', T('L'), '. Quelle est l’intensité du courant qui traverse le résistor (en mA) ?'],
        utiles: ['U', 'Rm'],
        raisons: { L: 'La longueur du fil n’intervient pas dans la loi d’Ohm (et la résistance de ce fil est négligeable devant celle du résistor).' },
        cherche: { bonne: 'Le courant électrique dans le résistor (en mA)', faux: ['La puissance reçue par le résistor (en W)', 'L’énergie reçue par le résistor en 1 min (en J)', 'La charge traversant le résistor en 1 min (en C)'] },
        manque: null, solution: { txt: 'I = U / R (R en Ω, I d’abord en A puis en mA)', val: p.U / p.Rm * 1000, u: 'mA' } };
    },
  },
  {
    id: 'indice2', domaine: 'Lumière', titre: 'Indice de réfraction et vitesse de la lumière', noms: ['Indice de réfraction', 'Vitesse de la lumière dans le milieu'],
    gen: () => ({ milieu: tire([['un bloc de verre', 200000, 1.5, [2, 5, 10]], ['un bloc de verre crown', 197000, 1.52, [2, 5, 10]], ['une cuve remplie d’eau', 225000, 1.33, [5, 10, 20]], ['un diamant', 124000, 2.42, [0.5, 1]]]) }),
    build: (p, q) => {
      const [obj, vkm, n, eps] = p.milieu, ep = tire(eps);
      const tokens = { c: tok('c = 3,00 × 10⁸ m·s⁻¹', 'Vitesse de la lumière dans le vide', 3.0e8, 'm·s⁻¹'), ep: tok(`${nb(ep)} cm`, 'Épaisseur traversée', ep / 100, 'm') };
      if (q === 0) {
        tokens.v = tok(`${nb(vkm)} km·s⁻¹`, 'Vitesse de la lumière dans le milieu', vkm * 1000, 'm·s⁻¹');
        return { tokens, derivees: [],
          texte: ['Un faisceau lumineux traverse un échantillon de milieu transparent inconnu, d’épaisseur ', T('ep'), '. Dans ce milieu, la lumière se propage à la vitesse de ', T('v'), '. On donne ', T('c'), '. Quel est l’indice de réfraction du milieu ?'],
          utiles: ['c', 'v'],
          raisons: { ep: 'L’épaisseur traversée n’intervient pas dans l’indice (elle servirait à calculer une durée de traversée).' },
          cherche: { bonne: 'L’indice de réfraction n du milieu (sans unité)', faux: ['La longueur d’onde de la lumière dans le milieu (en nm)', 'La durée de la traversée du milieu (en s)', 'L’angle de réfraction (en °)'] },
          manque: null, solution: { txt: 'n = c / v (v convertie en m·s⁻¹)', val: 3.0e8 / (vkm * 1000), u: '' } };
      }
      tokens.n = tok(`n = ${nb(n, 2)}`, 'Indice de réfraction du milieu', n, '');
      return { tokens, derivees: [],
        texte: ['Un faisceau lumineux traverse ' + obj + ' sur une épaisseur de ', T('ep'), '. Le milieu a pour ', T('n'), ' (pour la lumière utilisée). On donne ', T('c'), '. Quelle est la vitesse de la lumière dans ce milieu (en m·s⁻¹) ?'],
        utiles: ['c', 'n'],
        raisons: { ep: 'L’épaisseur traversée n’intervient pas : la vitesse dépend seulement de l’indice du milieu.' },
        cherche: { bonne: 'La vitesse v de la lumière dans le milieu (en m·s⁻¹)', faux: ['La durée de la traversée du milieu (en s)', 'La longueur d’onde de la lumière dans le milieu (en nm)', 'La fréquence de la lumière (en Hz)'] },
        manque: null, solution: { txt: 'v = c / n', val: 3.0e8 / n, u: 'm·s⁻¹' } };
    },
  },
  {
    id: 'snell2', domaine: 'Lumière', titre: 'Réfraction : loi de Snell-Descartes', noms: ['Angle de réfraction', 'Indice du second milieu'],
    schema: (p, b) => b.dansTexte.has('n2') ? { type: 'optique', cas: 'dioptre', n1: 1.0, n2: p.n2, i: p.i1 } : { type: 'optique', cas: 'dioptre', n1: 1.0, n2: null, inconnu: 'n2', i: p.i1, i2: p.i2 },
    gen: () => { const m = tire([['l’eau', 1.33], ['le verre', 1.50], ['le plexiglas', 1.49]]); const i1 = tire([20, 30, 45, 60]); const n2 = m[1];
      return { milieu: m[0], n2, i1, lam: tire([532, 633, 650]), i2: Math.round(Math.asin(Math.sin(i1 * Math.PI / 180) / n2) * 180 / Math.PI * 10) / 10 }; },
    build: (p, q) => {
      const tokens = { n1: tok('n₁ = 1,00', 'Indice de réfraction de l’air', 1.0, ''), i1: tok(`${p.i1}°`, 'Angle d’incidence', p.i1, '°'), lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm') };
      if (q === 0) {
        tokens.n2 = tok(`n₂ = ${nb(p.n2, 2)}`, 'Indice de réfraction du second milieu', p.n2, '');
        return { tokens, derivees: [],
          texte: ['Un faisceau laser de longueur d’onde ', T('lam'), ' passe de l’air (', T('n1'), ') vers ' + p.milieu + ' (', T('n2'), ') avec un angle d’incidence de ', T('i1'), '. Les angles sont mesurés par rapport à la normale à la surface. Quel est l’angle de réfraction ?'],
          utiles: ['n1', 'n2', 'i1'],
          raisons: { lam: 'Les indices sont déjà donnés pour cette radiation : la longueur d’onde n’apparaît pas dans la loi n₁ sin i₁ = n₂ sin i₂.' },
          cherche: { bonne: 'L’angle de réfraction i₂ dans le second milieu (en °)', faux: ['L’angle de réflexion (en °)', 'La déviation i₁ − i₂ du rayon (en °)', 'La vitesse de la lumière dans le second milieu (en m·s⁻¹)'] },
          manque: null, solution: { txt: 'sin i₂ = n₁ × sin i₁ / n₂ ; on en déduit i₂ avec la touche sin⁻¹ de la calculatrice (mode degrés)', val: p.i2, u: '°' } };
      }
      tokens.i2 = tok(`${nb(p.i2, 1)}°`, 'Angle de réfraction', p.i2, '°');
      return { tokens, derivees: [],
        texte: ['Un faisceau laser de longueur d’onde ', T('lam'), ' passe de l’air (', T('n1'), ') vers un milieu transparent inconnu avec un angle d’incidence de ', T('i1'), '. L’angle de réfraction mesuré vaut ', T('i2'), '. Les angles sont mesurés par rapport à la normale à la surface. Quel est l’indice de ce milieu ?'],
        utiles: ['n1', 'i1', 'i2'],
        raisons: { lam: 'La longueur d’onde n’apparaît pas dans la loi n₁ sin i₁ = n₂ sin i₂ : l’indice trouvé vaut pour cette radiation.' },
        cherche: { bonne: 'L’indice de réfraction n₂ du milieu inconnu (sans unité)', faux: ['L’angle de réflexion (en °)', 'La vitesse de la lumière dans le milieu (en m·s⁻¹)', 'La longueur d’onde de la lumière dans le milieu (en nm)'] },
        manque: null, solution: { txt: 'n₂ = n₁ × sin i₁ / sin i₂', val: Math.sin(p.i1 * Math.PI / 180) / Math.sin(p.i2 * Math.PI / 180), u: '' } };
    },
  },
  {
    id: 'noyau2', domaine: 'Matière à l’échelle microscopique', titre: 'Le noyau d’un atome', noms: ['Nombre de neutrons', 'Charge électrique du noyau'],
    gen: () => ({ at: tire([['lithium', 3, 7], ['fluor', 9, 19], ['sodium', 11, 23], ['aluminium', 13, 27], ['phosphore', 15, 31], ['chlore', 17, 35], ['potassium', 19, 39], ['fer', 26, 56], ['cuivre', 29, 63]]) }),
    build: (p, q) => {
      const [nom, Z, A] = p.at;
      const tokens = { A: tok(`${A}`, 'Nombre de nucléons de l’atome', A, ''), Z: tok(`${Z}`, 'Numéro atomique (nombre de protons)', Z, ''), e: tok('e = 1,6 × 10⁻¹⁹ C', 'Charge élémentaire', 1.6e-19, 'C'), mp: tok('1,67 × 10⁻²⁷ kg', 'Masse d’un nucléon', 1.67e-27, 'kg') };
      const base = ['Un atome ' + (/^[aeiouyéèh]/.test(nom) ? 'd’' : 'de ') + nom + ' contient ', T('A'), ' nucléons (les particules du noyau) dont ', T('Z'), ' protons. '];
      if (q === 0) return { tokens, derivees: [],
        texte: [...base, 'La charge d’un proton est égale à la charge élémentaire (', T('e'), ') et le neutron n’a pas de charge ; la masse d’un nucléon vaut ', T('mp'), '. Quel est le nombre de neutrons de son noyau ?'],
        utiles: ['A', 'Z'],
        raisons: { e: 'La charge élémentaire sert à calculer une charge électrique, pas un nombre de particules.', mp: 'La masse d’un nucléon sert à calculer une masse, pas un nombre de particules.' },
        cherche: { bonne: 'Le nombre N de neutrons du noyau', faux: ['La charge électrique du noyau (en C)', 'Le nombre d’électrons de l’atome neutre', 'La masse du noyau (en kg)'] },
        manque: null, solution: { txt: 'N = A − Z', val: A - Z, u: '' } };
      return { tokens, derivees: [],
        texte: [...base, 'La charge d’un proton est égale à la charge élémentaire (', T('e'), ') et le neutron n’a pas de charge ; la masse d’un nucléon vaut ', T('mp'), '. Quelle est la charge électrique du noyau (en C) ?'],
        utiles: ['Z', 'e'],
        raisons: { A: 'Le nombre de nucléons compte aussi les neutrons, qui n’ont pas de charge : seul le nombre de protons intervient.', mp: 'La masse d’un nucléon n’intervient pas dans le calcul d’une charge.' },
        cherche: { bonne: 'La charge électrique Q du noyau (en C)', faux: ['Le nombre de neutrons du noyau', 'La masse du noyau (en kg)', 'La charge électrique de l’atome (en C)'] },
        manque: null, solution: { txt: 'Q = Z × e', val: Z * 1.6e-19, u: 'C' } };
    },
  },
  {
    id: 'dissol2', domaine: 'Cohésion et solubilité', titre: 'Dissoudre un soluté : quantité de matière et concentration', noms: ['Concentration en quantité de matière', 'Masse de soluté à peser'],
    gen: () => { const s = tire([['chlorure de sodium', 58.5], ['glucose', 180], ['saccharose', 342], ['chlorure de potassium', 74.6]]);
      return { nom: s[0], M: s[1], m: tire([2, 5, 10]), Vf: tire([100, 250, 500]), c: tire([0.05, 0.1, 0.2]), Ve: tire([50, 60, 80]), T: tire([18, 20, 25]) }; },
    build: (p, q) => {
      const tokens = { M: tok(`${nb(p.M)} g·mol⁻¹`, 'Masse molaire du ' + p.nom, p.M, 'g·mol⁻¹'), T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'), Ve: tok(`${p.Ve} mL`, 'Volume d’eau versé pour dissoudre', p.Ve / 1000, 'L') };
      if (q === 0) {
        tokens.m = tok(`${p.m} g`, 'Masse de soluté pesée', p.m, 'g');
        tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution (fiole jaugée)', p.Vf / 1000, 'L');
        return { tokens, derivees: [{ id: 'n', nom: 'Quantité de matière n de soluté', expr: 'n = m / M', val: p.m / p.M, u: 'mol' }],
          texte: ['On dissout ', T('m'), ' de ' + p.nom + ' (', T('M'), ') dans environ ', T('Ve'), ' d’eau, puis on complète à ', T('Vf'), ' avec de l’eau distillée dans une fiole jaugée. La température de la solution est de ', T('T'), '. Quelle est la concentration en quantité de matière du soluté dans la solution (en mol·L⁻¹) ?'],
          utiles: ['m', 'M', 'Vf'],
          raisons: { Ve: 'C’est le volume d’eau versé au début : la solution finale a le volume de la fiole jaugée.', T: 'La température n’est pas une donnée de la formule c = n / V.' },
          cherche: { bonne: 'La concentration c en quantité de matière (en mol·L⁻¹)', faux: ['La quantité de matière n de soluté (en mol)', 'La concentration en masse t du soluté (en g·L⁻¹)', 'La solubilité du soluté dans l’eau (en g·L⁻¹)'] },
          manque: null, solution: { txt: 'c = n / V avec n = m / M (V converti en L)', val: p.m / p.M / (p.Vf / 1000), u: 'mol·L⁻¹' } };
      }
      tokens.c = tok(`${nb(p.c, 2)} mol·L⁻¹`, 'Concentration souhaitée', p.c, 'mol·L⁻¹');
      tokens.Vf = tok(`${p.Vf} mL`, 'Volume de solution à préparer', p.Vf / 1000, 'L');
      return { tokens, derivees: [{ id: 'n', nom: 'Quantité de matière n de soluté à dissoudre', expr: 'n = c × V', val: p.c * p.Vf / 1000, u: 'mol' }],
        texte: ['On veut préparer une solution de ' + p.nom + ' de concentration ', T('c'), ' dans une fiole jaugée de ', T('Vf'), '. La solution est à ', T('T'), '. On dissout d’abord le soluté dans environ ', T('Ve'), ' d’eau. Donnée : ', T('M'), '. Quelle masse de soluté faut-il peser (en g) ?'],
        utiles: ['c', 'Vf', 'M'],
        raisons: { Ve: 'C’est le volume d’eau versé au début, pas le volume de la solution.', T: 'La température ne joue aucun rôle dans le calcul de la masse à peser.' },
        cherche: { bonne: 'La masse m de soluté à peser (en g)', faux: ['La quantité de matière n de soluté (en mol)', 'La concentration en masse t (en g·L⁻¹)', 'La solubilité du soluté dans l’eau (en g·L⁻¹)'] },
        manque: null, solution: { txt: 'm = n × M avec n = c × V (V converti en L)', val: p.c * (p.Vf / 1000) * p.M, u: 'g' } };
    },
  },
  {
    id: 'ener2', domaine: 'Énergie électrique', titre: 'Énergie et effet Joule', noms: ['Énergie consommée', 'Puissance dissipée par effet Joule'],
    gen: () => ({ P: tire([800, 1500, 2000]), dmin: tire([15, 30, 45, 90]), prix: 0.25, R: tire([1.0, 2.2, 4.7]), I: tire([1, 2, 5]), L: tire([6, 9, 12]) }),
    build: (p, q) => {
      if (q === 0) {
        const tokens = { P: tok(`${p.P} W`, 'Puissance de l’appareil', p.P / 1000, 'kW'), d: tok(`${p.dmin} min`, 'Durée de fonctionnement', p.dmin / 60, 'h'), prix: tok(`${nb(p.prix, 2)} € par kWh`, 'Prix de l’électricité', p.prix, '€·kWh⁻¹') };
        return { tokens, derivees: [],
          texte: ['Un four électrique de puissance ', T('P'), ' (supposée constante) fonctionne pendant ', T('d'), '. L’électricité coûte ', T('prix'), '. Quelle énergie électrique a-t-il consommée (en kWh) ?'],
          utiles: ['P', 'd'],
          raisons: { prix: 'Le prix servirait à calculer le coût de l’énergie, pas l’énergie elle-même.' },
          cherche: { bonne: 'L’énergie électrique E consommée (en kWh)', faux: ['L’énergie consommée en une heure de fonctionnement (en kWh)', 'Le coût de l’énergie consommée (en €)', 'L’intensité du courant dans le four (en A)'] },
          manque: null, solution: { txt: 'E = P × Δt (P en kW, Δt en h)', val: p.P / 1000 * p.dmin / 60, u: 'kWh' } };
      }
      const tokens = { R: tok(`${nb(p.R, 1)} kΩ`, 'Résistance du résistor', p.R * 1000, 'Ω'), I: tok(`${p.I} mA`, 'Intensité du courant', p.I / 1000, 'A'), L: tok(`${p.L} mm`, 'Longueur du résistor', p.L / 1000, 'm') };
      return { tokens, derivees: [],
        texte: ['Un résistor de résistance ', T('R'), ' et de longueur ', T('L'), ' est traversé par un courant continu d’intensité ', T('I'), '. Quelle puissance dissipe-t-il par effet Joule (en W) ?'],
        utiles: ['R', 'I'],
        raisons: { L: 'La longueur ne compte pas ici : la résistance R est déjà donnée, et P = R × I².' },
        cherche: { bonne: 'La puissance P dissipée par effet Joule (en W)', faux: ['La tension U aux bornes du résistor (en V)', 'L’énergie dissipée en une heure (en kWh)', 'La résistivité du matériau du résistor (en Ω·m)'] },
        manque: null, solution: { txt: 'P = R × I² (R en Ω, I en A)', val: p.R * 1000 * Math.pow(p.I / 1000, 2), u: 'W' } };
    },
  },
  {
    id: 'meca2', domaine: 'Mécanique', titre: 'Énergie cinétique et travail', noms: ['Énergie cinétique', 'Travail d’une force'],
    gen: () => { const [mt, L] = tire([[0.8, 3.6], [0.95, 3.8], [1.1, 4.0], [1.2, 4.2], [1.35, 4.4], [1.5, 4.6]]); let F; do F = tire([0.5, 0.8, 1.2, 1.5, 2, 3]); while (F === mt);   // F ≠ m : deux données de même valeur se confondraient
    return { mt, L, v: tire([36, 54, 72, 90, 108, 126]), F, d: tire([50, 80, 120, 200, 300]), a: tire([0, 30, 45, 60]) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { m: tok(`${nb(p.mt)} t`, 'Masse du véhicule', p.mt * 1000, 'kg'), v: tok(`${p.v} km·h⁻¹`, 'Vitesse du véhicule', p.v / 3.6, 'm·s⁻¹'), L: tok(`${nb(p.L)} m`, 'Longueur du véhicule', p.L, 'm') };
        return { tokens, derivees: [],
          texte: ['Un véhicule de ', T('m'), ' et de ', T('L'), ' de long roule à ', T('v'), ' (dans le référentiel terrestre ; on le modélise par un point matériel en translation). Quelle est son énergie cinétique (en J) ?'],
          utiles: ['m', 'v'],
          raisons: { L: 'La longueur du véhicule n’intervient pas dans Ec = ½ m v².' },
          cherche: { bonne: 'L’énergie cinétique Ec du véhicule (en J)', faux: ['La puissance du moteur du véhicule (en W)', 'Le travail de la force motrice (en J)', 'L’énergie potentielle de pesanteur du véhicule (en J)'] },
          manque: null, solution: { txt: 'Ec = ½ × m × v² (m en kg, v en m·s⁻¹)', val: 0.5 * p.mt * 1000 * Math.pow(p.v / 3.6, 2), u: 'J' } };
      }
      const tokens = { F: tok(`${nb(p.F)} kN`, 'Valeur de la force', p.F * 1000, 'N'), d: tok(`${p.d} cm`, 'Distance parcourue', p.d / 100, 'm'), a: tok(`${p.a}°`, 'Angle entre la force et le déplacement', p.a, '°'), mt: tok(`${nb(p.mt)} t`, 'Masse de l’objet déplacé', p.mt * 1000, 'kg') };
      return { tokens, derivees: [],
        texte: ['Une force constante de valeur ', T('F'), ' agit sur un objet de ', T('mt'), ' qui se déplace en ligne droite de ', T('d'), '. L’angle entre la force et le déplacement est de ', T('a'), '. Quel est le travail de la force pendant ce déplacement (en J) ?'],
        utiles: ['F', 'd', 'a'],
        raisons: { mt: 'La masse de l’objet n’intervient pas dans W = F × d × cos α.' },
        cherche: { bonne: 'Le travail W de la force (en J)', faux: ['L’énergie cinétique de l’objet (en J)', 'La puissance de la force (en W)', 'L’énergie potentielle de pesanteur (en J)'] },
        manque: null, solution: { txt: 'W = F × d × cos α (F en N, d en m)', val: p.F * 1000 * p.d / 100 * Math.cos(p.a * Math.PI / 180), u: 'J' } };
    },
  },
  {
    id: 'hydrodist', domaine: 'Distillation', titre: 'Hydrodistillation d’une huile essentielle de lavande', noms: ['Rendement d’extraction', 'Volume d’huile essentielle', 'Énergie dépensée par gramme d’huile'],
    schema: (p, b) => ({ type: 'hydrodistillation', mp: b.tokens.mp.aff, Veau: b.tokens.Veau.aff, P: b.tokens.P.aff, T: b.dansTexte.has('T') ? b.tokens.T.aff : '', mh: b.dansTexte.has('mh') ? b.tokens.mh.aff : '' }),
    gen: () => {
      const mp = tire([20, 25, 30, 40, 50]), eta = tire([0.6, 0.8, 1.0, 1.2, 1.5]);
      const P = tire(mp <= 25 ? [9, 12] : [12, 15]), t = tire([2, 2.5, 3]), Veau = tire([60, 80, 100]);
      // énergie électrique disponible (kWh) ; il faut chauffer l’eau de 20 à 100 °C puis en vaporiser Vh, avec ≥ 30 % de pertes
      const Vh = tire([4, 6, 8, 10, 12].filter(v => Veau * 0.0929 + v * 0.628 <= 0.7 * P * t));
      return { mp, mh: Math.round(mp * 10 * eta), Veau, P, t, T: tire([98, 99]), rho: tire([0.88, 0.89, 0.90]), Vh };
    },
    build: (p, q) => {
      const tokens = {
        mp: tok(`${p.mp} kg`, 'Masse de fleurs fraîches', p.mp * 1000, 'g'),
        Veau: tok(`${p.Veau} L`, 'Volume d’eau chargé dans l’alambic', p.Veau, 'L'),
        P: tok(`${p.P} kW`, 'Puissance électrique de chauffe', p.P, 'kW'),
        t: tok(`${nb(p.t, 1)} h`, 'Durée de la distillation', p.t, 'h'),
        T: tok(`${p.T} °C`, 'Température de la vapeur en tête de colonne', p.T, '°C'),
        mh: tok(`${p.mh} g`, 'Masse d’huile essentielle recueillie', p.mh, 'g'),
        rho: tok(`${nb(p.rho, 2)} g·mL⁻¹`, 'Masse volumique de l’huile essentielle', p.rho, 'g·mL⁻¹'),
        Vh: tok(`${p.Vh} L`, 'Volume d’hydrolat recueilli', p.Vh, 'L'),
      };
      const debut = ['Un producteur extrait l’huile essentielle de lavande par hydrodistillation. Il charge l’alambic avec ', T('mp'), ' de fleurs fraîches et ', T('Veau'), ' d’eau, puis chauffe avec une résistance électrique de puissance ', T('P'),
        ' (supposée constante) pendant ', T('t'), '. La vapeur en tête de colonne est à ', T('T'), '. Dans l’essencier, il recueille ', T('mh'), ' d’huile essentielle, de masse volumique ', T('rho'),
        ', en plus de ', T('Vh'), ' d’hydrolat (l’eau aromatique). '];
      const rEau = 'Le volume d’eau chargé n’entre pas dans le calcul demandé : la masse d’huile recueillie est donnée directement, il n’y a pas à la déduire de l’eau chargée.';
      const rT = 'La température de la vapeur explique le procédé (le mélange eau–huile bout sous 100 °C), mais n’entre pas dans le calcul demandé.';
      const rHyd = 'L’hydrolat est la phase aqueuse du distillat : il ne donne pas la quantité d’huile essentielle, qui est comptée à part.';
      const rMp = 'La masse de fleurs sert à comparer l’huile obtenue à la matière végétale, pas à calculer un volume ni une énergie.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le rendement massique d’extraction, c’est-à-dire la masse d’huile essentielle recueillie par rapport à la masse de fleurs fraîches ?'], utiles: ['mp', 'mh'],
        raisons: { Veau: rEau, P: 'La puissance de chauffe détermine l’énergie dépensée, pas la quantité d’huile extraite.', t: 'La durée de distillation n’apparaît pas dans un rapport de masses.', T: rT, rho: 'La masse volumique servirait à passer d’une masse à un volume : ici on compare deux masses.', Vh: rHyd },
        cherche: { bonne: 'Le rendement massique : masse d’huile / masse de fleurs fraîches (en %)', faux: ['La teneur en huile de l’hydrolat : masse d’huile / volume d’hydrolat (en g·L⁻¹)', 'La masse d’huile obtenue par litre d’eau chargée (en g·L⁻¹)', 'Le volume d’huile essentielle recueillie (en mL)'] },
        manque: null,
        solution: { txt: 'η = m_huile / m_fleurs × 100', val: p.mh / (p.mp * 1000) * 100, u: '%' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'Quel volume occupe l’huile essentielle recueillie dans l’essencier ?'], utiles: ['mh', 'rho'],
        raisons: { mp: rMp, Veau: rEau, P: 'La puissance de chauffe n’a aucun lien avec le volume d’huile recueillie.', t: 'La durée de distillation n’intervient pas dans le calcul d’un volume à partir d’une masse.', T: rT, Vh: rHyd },
        cherche: { bonne: 'Le volume d’huile essentielle recueillie (en mL)', faux: ['La masse d’huile essentielle recueillie (en g)', 'Le volume total du distillat, huile et hydrolat (en L)', 'La masse volumique de l’hydrolat (en g·mL⁻¹)'] },
        manque: null,
        solution: { txt: 'V = m_huile / ρ', val: p.mh / p.rho, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quelle énergie électrique a été dépensée, en moyenne, pour obtenir un gramme d’huile essentielle ?'], utiles: ['P', 't', 'mh'],
        derivees: [{ id: 'E', nom: 'Énergie électrique dépensée E', expr: 'E = P × Δt', val: p.P * p.t, u: 'kWh' }],
        raisons: { mp: rMp, Veau: rEau, T: rT, rho: 'La masse volumique de l’huile ne sert pas à calculer une énergie.', Vh: rHyd },
        cherche: { bonne: 'L’énergie électrique dépensée par gramme d’huile essentielle (en Wh·g⁻¹)', faux: ['L’énergie électrique totale dépensée (en kWh)', 'L’énergie électrique dépensée par kilogramme de fleurs (en kWh·kg⁻¹)', 'La puissance moyenne de chauffe par gramme d’huile (en W·g⁻¹)'] },
        manque: null,
        solution: { txt: 'e = P × Δt / m_huile', val: p.P * p.t * 1000 / p.mh, u: 'Wh·g⁻¹' } };
    },
  },
  // ───────────────────────────── Évaporation et cristallisation : évaporateur industriel
  {
    id: 'crist-evaporateur', domaine: 'Évaporation et cristallisation', titre: 'Concentrer un jus sucré dans un évaporateur', noms: ['Débit de saccharose entrant', 'Débit d’eau évaporée', 'Masse d’eau évaporée sur une campagne'],
    schema: (p, b) => ({ type: 'evaporateur', q1: b.tokens.q1.aff, w1: b.tokens.w1.aff, w2: b.tokens.w2.aff, Pv: b.tokens.Pv.aff }),
    gen: () => ({ q1: tire([8, 10, 12, 15, 20]), w1: tire([10, 12, 15, 18]), w2: tire([60, 65]), S: tire([150, 200, 250, 300]), Pv: tire([2, 2.5, 3]), th: tire([75, 85, 95]), dur: tire([8, 12, 24]) }),
    build: (p, q) => {
      const tokens = {
        q1: tok(`${p.q1} t·h⁻¹`, 'Débit massique de jus à l’entrée', p.q1, 't·h⁻¹'),
        w1: tok(`${p.w1} %`, 'Teneur en saccharose du jus d’entrée (en masse)', p.w1, '%'),
        w2: tok(`${p.w2} %`, 'Teneur en saccharose du sirop de sortie (en masse)', p.w2, '%'),
        S: tok(`${p.S} m²`, 'Surface d’échange de l’évaporateur', p.S, 'm²'),
        Pv: tok(`${nb(p.Pv, 1)} bar`, 'Pression de la vapeur de chauffe', p.Pv, 'bar'),
        th: tok(`${p.th} °C`, 'Température d’ébullition du jus dans l’évaporateur', p.th, '°C'),
      };
      const debut = ['Dans une sucrerie, un évaporateur fonctionne en continu et en régime permanent. Il reçoit un jus sucré (solution aqueuse de saccharose) au débit massique de ', T('q1'), ', qui contient ', T('w1'),
        ' de saccharose en masse. Il en sort un sirop concentré à ', T('w2'), ' de saccharose en masse, et de la vapeur d’eau pure.\n\nL’évaporateur a une surface d’échange de ', T('S'), ' ; il est chauffé par de la vapeur sous ', T('Pv'),
        ' et le jus y bout à ', T('th'), '. Le saccharose n’est pas entraîné avec la vapeur et ne cristallise pas. '];
      const qs = p.q1 * p.w1 / 100, q2 = qs / (p.w2 / 100), qe = p.q1 - q2;
      const rTher = 'Les caractéristiques thermiques de l’évaporateur (surface, pression de chauffe, température) fixent la puissance et la vitesse d’évaporation, pas le bilan de matière.';
      const rW2 = 'La teneur du sirop de sortie sert à calculer ce qui sort, pas la quantité de saccharose qui entre.';
      const rThermique = { S: rTher, Pv: rTher, th: rTher };
      const dQs = { id: 'qs', nom: 'Débit massique de saccharose (le même à l’entrée et à la sortie)', expr: 'q_saccharose = q₁ × w₁ / 100', val: qs, u: 't·h⁻¹' };
      const dQ2 = { id: 'q2', nom: 'Débit massique de sirop de sortie', expr: 'q₂ = q_saccharose / (w₂ / 100)', val: q2, u: 't·h⁻¹' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le débit massique de saccharose qui entre dans l’évaporateur ?'], utiles: ['q1', 'w1'],
        raisons: { w2: rW2, ...rThermique },
        cherche: { bonne: 'Le débit massique de saccharose dans le jus d’entrée (en t·h⁻¹)', faux: ['Le débit massique d’eau dans le jus d’entrée (en t·h⁻¹)', 'Le débit massique de sirop à la sortie (en t·h⁻¹)', 'Le débit massique d’eau évaporée (en t·h⁻¹)'] },
        manque: null, solution: { txt: 'q_saccharose = q₁ × w₁ / 100', val: qs, u: 't·h⁻¹' } };
      if (q === 1) return { tokens, derivees: [dQs, dQ2], texte: [...debut, 'Quel est le débit massique d’eau évaporée ?'], utiles: ['q1', 'w1', 'w2'],
        raisons: rThermique,
        cherche: { bonne: 'Le débit massique d’eau évaporée (en t·h⁻¹)', faux: ['Le débit massique de sirop à la sortie (en t·h⁻¹)', 'Le débit massique de saccharose dans le jus (en t·h⁻¹)', 'Le débit massique d’eau contenue dans le jus d’entrée (en t·h⁻¹)'] },
        manque: null, solution: { txt: 'q_évaporée = q₁ − q₂, avec q₂ = q₁ × w₁ / w₂', val: qe, u: 't·h⁻¹' } };
      tokens.dur = tok(`${p.dur} heures`, 'Durée de fonctionnement de la campagne', p.dur, 'h');
      return { tokens, derivees: [dQs, dQ2, { id: 'qe', nom: 'Débit massique d’eau évaporée', expr: 'q_évaporée = q₁ − q₂', val: qe, u: 't·h⁻¹' }],
        texte: [...debut, 'L’évaporateur fonctionne sans interruption pendant ', T('dur'), '. Quelle masse d’eau a-t-il évaporée pendant cette durée ?'], utiles: ['q1', 'w1', 'w2', 'dur'],
        raisons: rThermique,
        cherche: { bonne: 'La masse d’eau évaporée pendant la durée de fonctionnement (en t)', faux: ['Le débit massique d’eau évaporée (en t·h⁻¹)', 'La masse de sirop produite pendant la durée de fonctionnement (en t)', 'La masse de jus traitée pendant la durée de fonctionnement (en t)'] },
        manque: null, solution: { txt: 'm_évaporée = (q₁ − q₁ × w₁ / w₂) × durée', val: qe * p.dur, u: 't' } };
    },
  },
  // ───────────────────────────── Transport des fluides : statique des fluides (capteur de pression, cuve d’huile)
  {
    id: 'flu-statique', domaine: 'Transport des fluides', titre: 'Un capteur de pression au fond d’une cuve d’huile', noms: ['Hauteur d’huile dans la cuve', 'Force sur la trappe de vidange', 'Baisse de pression pendant la vidange'],
    schema: (p, b, q) => ({ type: 'cuveHuile', hInconnue: q === 0, P: b.tokens.P.aff, rho: b.tokens.rho.aff, d: b.tokens.d ? b.tokens.d.aff : null }),
    gen: () => ({ rho: tire([910, 915, 920, 925]), g: 9.81, P: tire([0.20, 0.25, 0.30, 0.35, 0.40, 0.45]), th: tire([15, 20, 25]), Vc: tire([10, 15, 20, 30]),
      Patm: tire([1005, 1013, 1020]), d: tire([100, 150, 200, 250]), dh: tire([0.5, 0.8, 1.0, 1.2, 1.5]) }),
    build: (p, q) => {
      const tokens = {
        rho: tok(`${p.rho} kg·m⁻³`, 'Masse volumique de l’huile', p.rho, 'kg·m⁻³'),
        g: tok(`${nb(p.g, 2)} N·kg⁻¹`, 'Intensité de la pesanteur', p.g, 'N·kg⁻¹'),
        P: tok(`${nb(p.P, 2)} bar`, 'Pression relative indiquée par le capteur', p.P * 1e5, 'Pa'),
        th: tok(`${p.th} °C`, 'Température de l’huile', p.th, '°C'),
        Vc: tok(`${p.Vc} m³`, 'Volume total de la cuve', p.Vc, 'm³'),
        Patm: tok(`${p.Patm} hPa`, 'Pression atmosphérique', p.Patm * 100, 'Pa'),
      };
      const debut = ['Une cuve cylindrique, ouverte à l’air libre et de volume total ', T('Vc'), ', contient une huile végétale au repos, de masse volumique ', T('rho'), ' à ', T('th'),
        ' (supposée uniforme dans toute l’huile).\n\nUn capteur de pression relative (il mesure l’écart avec la pression atmosphérique, qui vaut ', T('Patm'), ' ce jour-là) est fixé au fond de la cuve et indique ', T('P'),
        '. L’intensité de la pesanteur vaut ', T('g'), '. '];
      const rTh = 'La température intervient seulement par la valeur de la masse volumique, qui est déjà donnée pour cette température.';
      const rVc = 'Le volume total de la cuve ne donne pas la hauteur d’huile : il faudrait aussi connaître la section de la cuve, et elle n’est pas nécessaire ici.';
      const rPatm = 'Le capteur indique une pression relative : la pression atmosphérique est déjà retranchée, elle n’intervient donc pas.';
      const rRhoG = 'La pression est déjà donnée : ρ et g serviraient à la calculer à partir d’une hauteur, ce qui n’est pas demandé.';
      const Prel = p.P * 1e5;
      if (q === 0) return { tokens, texte: [...debut, 'Quelle est la hauteur d’huile au-dessus du capteur ?'], utiles: ['rho', 'g', 'P'],
        derivees: [{ id: 'Pa', nom: 'Pression relative en pascals', expr: 'P_rel = P(en bar) × 10⁵   (1 bar = 10⁵ Pa)', val: Prel, u: 'Pa' }],
        raisons: { th: rTh, Vc: rVc, Patm: rPatm },
        cherche: { bonne: 'La hauteur h d’huile au-dessus du capteur (en m)', faux: ['La pression absolue au fond de la cuve (en Pa)', 'Le volume d’huile contenu dans la cuve (en m³)', 'La masse d’huile contenue dans la cuve (en kg)'] },
        manque: null, solution: { txt: 'h = P_rel / (ρ·g), avec P_rel en pascals', val: Prel / (p.rho * p.g), u: 'm' } };
      if (q === 1) {
        tokens.d = tok(`${p.d} mm`, 'Diamètre de la trappe de vidange', p.d / 1000, 'm');
        return { tokens, texte: [...debut, 'Une trappe de vidange horizontale, de forme circulaire et de diamètre ', T('d'), ', est située au fond de la cuve, à la hauteur du capteur ; sous la trappe, l’air est à la pression atmosphérique. Le poids de la trappe est négligé. Quelle est la valeur de la force pressante résultante qui s’exerce sur la trappe ?'],
          utiles: ['P', 'd'],
          derivees: [{ id: 'Pa', nom: 'Pression relative en pascals', expr: 'P_rel = P(en bar) × 10⁵   (1 bar = 10⁵ Pa)', val: Prel, u: 'Pa' }, { id: 'S', nom: 'Section S de la trappe', expr: 'S = π·d² / 4', val: Math.PI * (p.d / 1000) ** 2 / 4, u: 'm²' }],
          raisons: { rho: rRhoG, g: rRhoG, th: rTh, Vc: 'Le volume de la cuve ne donne pas la force sur la trappe : celle-ci ne dépend que de la pression au fond et de la surface de la trappe.',
            Patm: 'La pression atmosphérique s’exerce aussi sous la trappe : elle se compense, et le capteur la retranche déjà. Seule la pression relative compte.' },
          cherche: { bonne: 'La force pressante résultante F sur la trappe (en N)', faux: ['La pression relative exercée sur la trappe (en Pa)', 'Le poids de l’huile contenue dans la cuve (en N)', 'La force pressante exercée par la seule atmosphère sur la trappe (en N)'] },
          manque: null, solution: { txt: 'F = P_rel × S, avec S = π·d² / 4', val: Prel * Math.PI * (p.d / 1000) ** 2 / 4, u: 'N' } };
      }
      tokens.dh = tok(`${nb(p.dh, 1)} m`, 'Baisse du niveau d’huile', p.dh, 'm');
      return { tokens, texte: [...debut, 'Pendant la vidange, le niveau d’huile baisse de ', T('dh'), ' (la masse volumique de l’huile ne change pas). De combien diminue la pression indiquée par le capteur ?'],
        utiles: ['rho', 'g', 'dh'], derivees: [],
        raisons: { P: 'La valeur de la pression lue au départ ne sert pas : on cherche une variation, qui ne dépend que de la variation de hauteur.', th: rTh, Vc: 'Le volume total de la cuve n’intervient pas dans la variation de pression due à une variation de hauteur.', Patm: rPatm },
        cherche: { bonne: 'La diminution ΔP de la pression indiquée par le capteur (en mbar)', faux: ['La nouvelle pression relative indiquée par le capteur (en mbar)', 'La masse d’huile évacuée pendant la vidange (en kg)', 'Le volume d’huile évacué pendant la vidange (en m³)'] },
        manque: null, solution: { txt: 'ΔP = ρ·g·Δh (en pascals ; 1 mbar = 100 Pa)', val: p.rho * p.g * p.dh / 100, u: 'mbar' } };
    },
  },
  // ───────────────────────────── Transport des fluides : débits massique et volumique (fût sur une balance)
  {
    id: 'flu-debit', domaine: 'Transport des fluides', titre: 'Contrôler le débit d’une pompe doseuse avec une balance', noms: ['Débit massique de la pompe', 'Masse volumique du liquide', 'Débit volumique de la pompe'],
    gen: () => {
      const rho = tire([1040, 1080, 1100, 1140]), V = tire([20, 25, 30, 40, 50]), mv = tire([1.8, 2.2, 2.5, 3.0]);
      const mnet = Math.round(rho * V / 100) / 10;                 // masse de liquide (kg), exacte à 0,1 kg près
      return { rho, V, mv, mt: Math.round((mv + mnet) * 10) / 10, dt: tire([2, 3, 4, 5]), Bmax: tire([100, 150]), Pm: tire([0.25, 0.37, 0.55]), th: tire([15, 20, 25]) };
    },
    build: (p, q) => {
      const tokens = {
        Pm: tok(`${nb(p.Pm, 2)} kW`, 'Puissance du moteur de la pompe', p.Pm, 'kW'),
        Bmax: tok(`${p.Bmax} kg`, 'Portée maximale de la balance', p.Bmax, 'kg'),
        mv: tok(`${nb(p.mv, 1)} kg`, 'Masse du fût vide', p.mv, 'kg'),
        th: tok(`${p.th} °C`, 'Température de la saumure', p.th, '°C'),
        dt: tok(`${p.dt} min`, 'Durée de remplissage', p.dt * 60, 's'),
        mt: tok(`${nb(p.mt, 1)} kg`, 'Masse indiquée par la balance en fin de remplissage (fût compris)', p.mt, 'kg'),
      };
      const debut = ['Pour contrôler le débit d’une pompe doseuse (moteur de puissance ', T('Pm'), '), un opérateur la fait remplir un fût posé sur une balance de portée maximale ', T('Bmax'),
        '. Le fût vide a été pesé : ', T('mv'), '. Le liquide pompé est une saumure (solution aqueuse de chlorure de sodium) à ', T('th'),
        '. L’opérateur déclenche le chronomètre au démarrage de la pompe et l’arrête au bout de ', T('dt'), ' : la balance indique alors ', T('mt'), ', fût compris. On suppose le débit constant pendant le remplissage. '];
      const rB = 'La portée maximale indique seulement jusqu’à quelle masse la balance peut mesurer : ce n’est pas une mesure du liquide.';
      const rPm = 'La puissance du moteur ne donne pas la quantité de liquide débitée : ici, le débit se déduit directement de la pesée et du chronomètre.';
      const rTh = 'La température n’intervient pas dans un rapport entre masses, volumes et durées déjà mesurés.';
      const mnet = Math.round((p.mt - p.mv) * 10) / 10, Qm = mnet / (p.dt * 60);
      const dM = { id: 'm', nom: 'Masse m de saumure recueillie', expr: 'm = m_balance − m_fût', val: mnet, u: 'kg' };
      if (q === 0) return { tokens, derivees: [dM], texte: [...debut, 'Quel est le débit massique de la pompe ?'], utiles: ['mv', 'mt', 'dt'],
        raisons: { Pm: rPm, Bmax: rB, th: rTh },
        cherche: { bonne: 'Le débit massique q_m de la pompe (en kg·s⁻¹)', faux: ['Le débit volumique de la pompe (en m³·h⁻¹)', 'La masse de saumure recueillie (en kg)', 'La masse volumique de la saumure (en kg·m⁻³)'] },
        manque: null, solution: { txt: 'q_m = (m_balance − m_fût) / Δt', val: Qm, u: 'kg·s⁻¹' } };
      if (q === 1) {
        tokens.V = tok(`${p.V} L`, 'Volume de saumure lu sur le fût gradué', p.V / 1000, 'm³');
        return { tokens, derivees: [dM], texte: [...debut, 'Le niveau de la saumure dans le fût se trouve alors au repère ', T('V'), '. Quelle est la masse volumique de la saumure ?'], utiles: ['mv', 'mt', 'V'],
          raisons: { Pm: 'La puissance du moteur ne renseigne ni sur la masse ni sur le volume de liquide recueilli : la masse volumique se déduit de la pesée et du volume lu sur le fût.', Bmax: rB, th: rTh, dt: 'La durée de remplissage donne un débit, pas la masse volumique, qui ne relie que la masse et le volume du liquide recueilli.' },
          cherche: { bonne: 'La masse volumique ρ de la saumure (en kg·m⁻³)', faux: ['Le débit massique de la pompe (en kg·s⁻¹)', 'La masse de saumure recueillie (en kg)', 'Le volume massique de la saumure (en m³·kg⁻¹)'] },
          manque: null, solution: { txt: 'ρ = m / V, avec m = m_balance − m_fût', val: p.rho, u: 'kg·m⁻³' } };
      }
      return { tokens, derivees: [dM, { id: 'qm', nom: 'Débit massique de la pompe', expr: 'q_m = m / Δt', val: Qm, u: 'kg·s⁻¹' }],
        texte: [...debut, 'Quel est le débit volumique de la pompe ?'], utiles: ['mv', 'mt', 'dt'],
        raisons: { Pm: rPm, Bmax: rB, th: 'La température ne permettrait de lire la masse volumique d’une saumure dans une table qu’avec sa concentration, qui n’est pas donnée : elle ne remplace pas la donnée manquante.' },
        cherche: { bonne: 'Le débit volumique q_V de la pompe (en m³·h⁻¹)', faux: ['Le débit massique de la pompe (en kg·s⁻¹)', 'La masse volumique de la saumure (en kg·m⁻³)', 'Le volume de saumure recueilli (en m³)'] },
        manque: { bonne: 'Il manque la masse volumique de la saumure', faux: ['Il manque la durée de remplissage', 'Il manque la masse du fût vide', 'Il ne manque aucune donnée pour ce calcul'],
          expl: `Pour passer d’un débit massique à un débit volumique, il faut la masse volumique : q_V = q_m / ρ. L’énoncé ne la donne pas, et ne donne pas non plus le volume recueilli. Elle peut se mesurer en lisant le volume sur le fût et en calculant ρ = m / V. La masse du fût vide (${tokens.mv.aff}), la masse finale (${tokens.mt.aff}) et la durée (${tokens.dt.aff}) y figurent bien : elles donnent le débit massique.` },
        solution: { txt: `q_V = q_m / ρ (ici ρ = ${nb(p.rho)} kg·m⁻³, valeur à mesurer ; 1 m³·s⁻¹ = 3 600 m³·h⁻¹)`, val: Qm / p.rho * 3600, u: 'm³·h⁻¹' } };
    },
  },
  // ───────────────────────────── Transport des fluides : conservation du débit dans une réduction de section
  {
    id: 'flu-section', domaine: 'Transport des fluides', titre: 'Une conduite d’eau qui se rétrécit', noms: ['Débit volumique dans la conduite', 'Vitesse dans la partie étroite', 'Durée de remplissage d’un bassin'],
    schema: (p, b) => ({ type: 'conduiteConvergent', D1: b.tokens.D1.aff, L: b.tokens.L.aff, P1: b.tokens.P1.aff, v1: b.tokens.v1.aff, D2: b.tokens.D2.aff }),
    gen: () => {
      const [D1, D2] = tire([[80, 40], [80, 50], [100, 50], [100, 65], [125, 65], [125, 80], [150, 80], [150, 100]]);
      const v1 = tire([0.5, 0.8, 1.0, 1.2, 1.5].filter(v => v * (D1 / D2) ** 2 <= 6));
      return { D1, D2, v1, P1: tire([2, 2.5, 3, 4]), L: tire([30, 50, 80]), th: tire([10, 15, 20]), Vr: tire([30, 60, 100]) };
    },
    build: (p, q) => {
      const tokens = {
        th: tok(`${p.th} °C`, 'Température de l’eau', p.th, '°C'),
        D1: tok(`${p.D1} mm`, 'Diamètre intérieur de la conduite amont', p.D1 / 1000, 'm'),
        L: tok(`${p.L} m`, 'Longueur de la conduite amont', p.L, 'm'),
        P1: tok(`${nb(p.P1, 1)} bar`, 'Pression de l’eau dans la conduite amont', p.P1 * 1e5, 'Pa'),
        v1: tok(`${nb(p.v1, 1)} m·s⁻¹`, 'Vitesse moyenne de l’eau dans la conduite amont', p.v1, 'm·s⁻¹'),
        D2: tok(`${p.D2} mm`, 'Diamètre intérieur de la conduite étroite', p.D2 / 1000, 'm'),
      };
      const debut = ['De l’eau, à ', T('th'), ', circule en régime permanent dans une conduite cylindrique pleine, de diamètre intérieur ', T('D1'), ' et de longueur ', T('L'), '. Sa pression y vaut ', T('P1'),
        ' et sa vitesse moyenne ', T('v1'), '. La conduite se raccorde ensuite, par un convergent, à une conduite plus étroite de diamètre intérieur ', T('D2'),
        '. L’eau est considérée comme incompressible et sa vitesse comme uniforme sur chaque section. '];
      const S1 = Math.PI * (p.D1 / 1000) ** 2 / 4, S2 = Math.PI * (p.D2 / 1000) ** 2 / 4, Q = p.v1 * S1;
      const rP = 'Pour un liquide incompressible en régime permanent, la conservation du débit ne fait pas intervenir la pression (celle-ci intervient dans le bilan d’énergie de Bernoulli).';
      const rL = 'La longueur de la conduite joue sur les pertes de charge, pas sur le lien entre débit, section et vitesse.';
      const rTh = 'La température n’intervient pas ici : l’eau est supposée incompressible, sa masse volumique est constante.';
      const dS1 = { id: 'S1', nom: 'Section S₁ de la conduite amont', expr: 'S₁ = π·D₁² / 4', val: S1, u: 'm²' };
      const dS2 = { id: 'S2', nom: 'Section S₂ de la conduite étroite', expr: 'S₂ = π·D₂² / 4', val: S2, u: 'm²' };
      if (q === 0) return { tokens, derivees: [dS1], texte: [...debut, 'Quel est le débit volumique de l’eau dans la conduite ?'], utiles: ['D1', 'v1'],
        raisons: { th: rTh, L: rL, P1: rP, D2: 'Le diamètre de la conduite plus étroite sert à calculer la vitesse dans cette partie, pas le débit, qui est le même dans toute la conduite.' },
        cherche: { bonne: 'Le débit volumique Q_V de l’eau (en m³·h⁻¹)', faux: ['La vitesse moyenne de l’eau dans la conduite étroite (en m·s⁻¹)', 'Le débit massique de l’eau (en kg·s⁻¹)', 'La section de la conduite amont (en m²)'] },
        manque: null, solution: { txt: 'Q_V = v₁ × S₁', val: Q * 3600, u: 'm³·h⁻¹' } };
      if (q === 1) return { tokens, derivees: [dS1, dS2], texte: [...debut, 'Quelle est la vitesse moyenne de l’eau dans la conduite étroite ?'], utiles: ['D1', 'v1', 'D2'],
        raisons: { th: rTh, L: rL, P1: rP },
        cherche: { bonne: 'La vitesse moyenne v₂ de l’eau dans la conduite étroite (en m·s⁻¹)', faux: ['Le débit volumique de l’eau dans la conduite étroite (en m³·h⁻¹)', 'La pression de l’eau dans la conduite étroite (en bar)', 'Le rapport S₁/S₂ des sections (sans unité)'] },
        manque: null, solution: { txt: 'Q_V = v₁·S₁ = v₂·S₂, donc v₂ = v₁·S₁ / S₂', val: p.v1 * S1 / S2, u: 'm·s⁻¹' } };
      tokens.Vr = tok(`${p.Vr} m³`, 'Volume du bassin à remplir', p.Vr, 'm³');
      return { tokens, derivees: [dS1, { id: 'Q', nom: 'Débit volumique de l’eau', expr: 'Q_V = v₁ × S₁', val: Q, u: 'm³·s⁻¹' }],
        texte: [...debut, 'Toute cette eau est envoyée dans un bassin vide de volume ', T('Vr'), '. Quelle est la durée nécessaire pour le remplir ?'], utiles: ['D1', 'v1', 'Vr'],
        raisons: { th: rTh, L: rL, P1: rP, D2: 'Le diamètre de la conduite plus étroite n’intervient pas : le débit est le même dans les deux conduites, on le calcule avec la conduite dont on connaît la vitesse.' },
        cherche: { bonne: 'La durée de remplissage du bassin (en h)', faux: ['Le débit volumique de l’eau (en m³·h⁻¹)', 'La masse d’eau contenue dans le bassin plein (en kg)', 'La vitesse moyenne de l’eau dans la conduite étroite (en m·s⁻¹)'] },
        manque: null, solution: { txt: 't = V_bassin / Q_V, avec Q_V = v₁ × S₁', val: p.Vr / Q / 3600, u: 'h' } };
    },
  },
  // ───────────────────────────── Transport des fluides : bilan d’énergie, puissance hydraulique et rendement d’une pompe
  {
    id: 'flu-pompe', domaine: 'Transport des fluides', titre: 'Une pompe qui alimente un château d’eau', noms: ['Hauteur manométrique totale', 'Puissance hydraulique', 'Rendement du groupe motopompe'],
    schema: (p, b) => ({ type: 'pompeChateau', dz: b.tokens.dz.aff, L: b.tokens.L.aff, dp: b.tokens.dp.aff, Q: b.tokens.Q.aff }),
    gen: () => {
      const rho = 1000, g = 9.81, dz = tire([15, 20, 25, 30, 40]), dp = tire([0.5, 0.8, 1.0, 1.5, 2.0]), Q = tire([20, 30, 40, 60]), eta0 = tire([0.5, 0.55, 0.6, 0.65, 0.7, 0.75]);
      const Ph = rho * g * (Q / 3600) * (dz + dp * 1e5 / (rho * g));
      return { rho, g, dz, dp, Q, Pel: Math.ceil(Ph / eta0 / 100) / 10, L: tire([50, 100, 200, 400]), th: tire([10, 15, 20]), Patm: tire([1005, 1013, 1020]) };
    },
    build: (p, q) => {
      const tokens = {
        rho: tok(`${nb(p.rho)} kg·m⁻³`, 'Masse volumique de l’eau', p.rho, 'kg·m⁻³'),
        th: tok(`${p.th} °C`, 'Température de l’eau', p.th, '°C'),
        dz: tok(`${p.dz} m`, 'Dénivelé entre les deux surfaces libres', p.dz, 'm'),
        Patm: tok(`${p.Patm} hPa`, 'Pression atmosphérique', p.Patm * 100, 'Pa'),
        L: tok(`${p.L} m`, 'Longueur de la conduite', p.L, 'm'),
        dp: tok(`${nb(p.dp, 1)} bar`, 'Perte de charge totale de la conduite (exprimée en pression)', p.dp * 1e5, 'Pa'),
        Q: tok(`${p.Q} m³·h⁻¹`, 'Débit volumique', p.Q / 3600, 'm³·s⁻¹'),
        Pel: tok(`${nb(p.Pel, 1)} kW`, 'Puissance électrique absorbée par le groupe motopompe', p.Pel * 1000, 'W'),
        g: tok(`${nb(p.g, 2)} N·kg⁻¹`, 'Intensité de la pesanteur', p.g, 'N·kg⁻¹'),
      };
      const debut = ['Une pompe aspire de l’eau (masse volumique ', T('rho'), ', température ', T('th'), ') dans un bassin et la refoule dans un château d’eau dont la surface libre est ', T('dz'),
        ' plus haut que celle du bassin.\n\nLes deux surfaces libres sont à l’air libre (pression atmosphérique ', T('Patm'), ') et l’eau y est pratiquement immobile.\n\nLes frottements dans la conduite, de longueur ', T('L'),
        ', provoquent une perte de charge totale de ', T('dp'), ' pour le débit de ', T('Q'), ' choisi.\n\nLe groupe motopompe absorbe une puissance électrique de ', T('Pel'), '. On prendra g = ', T('g'), '. '];
      const J = p.dp * 1e5 / (p.rho * p.g), H = p.dz + J, Ph = p.rho * p.g * (p.Q / 3600) * H;
      const rL = 'La longueur de la conduite explique l’origine des pertes de charge, mais celles-ci sont déjà données : elle n’intervient pas dans le calcul.';
      const rTh = 'La température n’intervient pas ici : seule compte la masse volumique de l’eau, qui est donnée.';
      const rPatm = 'Les deux surfaces libres sont à la même pression atmosphérique : elle s’élimine dans le bilan d’énergie entre les deux surfaces.';
      const dJ = { id: 'J', nom: 'Perte de charge exprimée en hauteur d’eau', expr: 'J = Δp_J / (ρ·g)', val: J, u: 'm' };
      const dH = { id: 'H', nom: 'Hauteur manométrique totale H', expr: 'H = Δz + Δp_J / (ρ·g)', val: H, u: 'm' };
      if (q === 0) return { tokens, derivees: [dJ], texte: [...debut, 'Quelle hauteur manométrique totale H, exprimée en mètres d’eau, la pompe doit-elle fournir ?'], utiles: ['rho', 'g', 'dz', 'dp'],
        raisons: { th: rTh, Patm: rPatm, L: rL, Q: 'Le débit sert à calculer une puissance ; la perte de charge est déjà donnée pour ce débit.', Pel: 'La puissance électrique sert à calculer un rendement, pas la hauteur que doit fournir la pompe.' },
        cherche: { bonne: 'La hauteur manométrique totale H que la pompe doit fournir (en m)', faux: ['La hauteur géométrique de refoulement seule, sans les pertes de charge (en m)', 'La puissance hydraulique communiquée à l’eau (en W)', 'Le débit volumique de la pompe (en m³·h⁻¹)'] },
        manque: null, solution: { txt: 'H = Δz + Δp_J / (ρ·g)  (bilan d’énergie entre les deux surfaces libres)', val: H, u: 'm' } };
      if (q === 1) return { tokens, derivees: [dJ, dH], texte: [...debut, 'Quelle puissance hydraulique la pompe communique-t-elle à l’eau ?'], utiles: ['rho', 'g', 'dz', 'dp', 'Q'],
        raisons: { th: rTh, Patm: rPatm, L: rL, Pel: 'La puissance électrique absorbée sert à calculer le rendement ; la puissance communiquée à l’eau se calcule sans elle.' },
        cherche: { bonne: 'La puissance hydraulique P_h communiquée à l’eau (en W)', faux: ['La puissance électrique absorbée par le groupe (en W)', 'La hauteur manométrique totale de la pompe (en m)', 'L’énergie communiquée à l’eau en une heure (en kWh)'] },
        manque: null, solution: { txt: 'P_h = ρ·g·Q_V·H, avec H = Δz + Δp_J / (ρ·g)', val: Ph, u: 'W' } };
      return { tokens, derivees: [dJ, dH, { id: 'Ph', nom: 'Puissance hydraulique communiquée à l’eau', expr: 'P_h = ρ·g·Q_V·H', val: Ph, u: 'W' }],
        texte: [...debut, 'Quel est le rendement global du groupe motopompe ?'], utiles: ['rho', 'g', 'dz', 'dp', 'Q', 'Pel'],
        raisons: { th: rTh, Patm: rPatm, L: rL },
        cherche: { bonne: 'Le rendement global η du groupe motopompe (en %)', faux: ['La puissance hydraulique communiquée à l’eau (en W)', 'La puissance perdue dans le groupe motopompe (en W)', 'La hauteur manométrique totale de la pompe (en m)'] },
        manque: null, solution: { txt: 'η = P_h / P_él × 100, avec P_h = ρ·g·Q_V·H et H = Δz + Δp_J / (ρ·g)', val: Ph / (p.Pel * 1000) * 100, u: '%' } };
    },
  },
  // ───────────────────────────── Ondes (TSTL) : diffraction, interférences, réseaux
  {
    id: 'ondDiffraction', domaine: 'Ondes', titre: 'Largeur d’une fente par diffraction', noms: ['Angle d’ouverture', 'Largeur de la fente'],
    gen: () => { const lam = tire([532, 633, 650]), a = tire([40, 50, 60, 80, 100]), D = tire([1.5, 2.0, 2.5, 3.0]); return { lam, a, D, L: Math.round(2 * lam * 1e-9 * D / (a * 1e-6) * 1e4) / 10, P: tire([1, 5]) }; },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P, 'mW'),
        D: tok(`${nb(p.D, 1)} m`, 'Distance entre la fente et l’écran', p.D, 'm'),
        L: tok(`${nb(p.L, 1)} mm`, 'Largeur de la tache centrale', p.L, 'mm'),
      };
      const theta = p.L * 1e-3 / (2 * p.D);
      const debut = ['Un laser de longueur d’onde ', T('lam'), ' et de puissance ', T('P'), ' éclaire une fente fine et verticale. Sur un écran placé à ', T('D'), ' de la fente, la tache centrale de diffraction, mesurée entre ses deux premières extinctions, a une largeur ', T('L'),
        '. Les angles sont petits : on prend tan θ ≈ θ, avec θ en radian ; l’angle d’ouverture θ est la demi-largeur angulaire de la tache centrale, vue depuis la fente, et on admet θ = λ / a pour une fente de largeur a. '];
      const rP = 'La puissance du laser change l’éclat de la figure, pas ses dimensions.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’angle d’ouverture θ de la figure ?'], utiles: ['L', 'D'],
        raisons: { lam: 'La longueur d’onde servira ensuite à relier θ à la largeur de la fente, mais elle n’intervient pas pour obtenir θ à partir de la géométrie.', P: rP },
        cherche: { bonne: 'L’angle d’ouverture θ de la figure (en rad)', faux: ['La largeur a de la fente (en µm)', 'La largeur L de la tache centrale (en mm)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'θ = L / (2D)', val: theta, u: 'rad' } };
      return { tokens, texte: [...debut, 'Quelle est la largeur a de la fente ?'], utiles: ['lam', 'L', 'D'],
        derivees: [{ id: 'theta', nom: 'Angle d’ouverture', expr: 'θ = L / (2D)', val: theta, u: 'rad' }],
        raisons: { P: rP },
        cherche: { bonne: 'La largeur a de la fente (en µm)', faux: ['L’angle d’ouverture θ de la figure (en rad)', 'La largeur L de la tache centrale (en mm)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'a = λ / θ = 2λD / L', val: p.lam * 1e-9 / theta * 1e6, u: 'µm' } };
    },
  },
  {
    id: 'ondYoung', domaine: 'Ondes', titre: 'Franges de Young : interfrange et distance entre les fentes', noms: ['Interfrange', 'Distance entre les fentes'],
    gen: () => {
      for (;;) {
        const lam = tire([532, 633, 650]), l = tire([200, 250, 300, 400, 500]), a = tire([30, 40, 50]), D = tire([1.5, 2.0, 2.5, 3.0]), N = tire([7, 9, 11]);
        if ((N - 1) / 2 > 0.6 * l / a) continue;                       // les franges comptées restent bien lumineuses, dans la tache centrale de diffraction
        const i = lam * 1e-9 * D / (l * 1e-6) * 1e3;                   // mm
        return { lam, l, a, D, N, X: Math.round((N - 1) * i * 10) / 10 };
      }
    },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        a: tok(`${p.a} µm`, 'Largeur de chaque fente', p.a, 'µm'),
        D: tok(`${nb(p.D, 1)} m`, 'Distance entre les fentes et l’écran', p.D, 'm'),
        N: tok(`${p.N} franges brillantes`, 'Nombre de franges brillantes comptées', p.N, ''),
        X: tok(`${nb(p.X, 1)} mm`, 'Distance entre le centre de la première et celui de la dernière frange comptée', p.X, 'mm'),
      };
      const i = p.X / (p.N - 1);
      const debut = ['Un laser de longueur d’onde ', T('lam'), ' éclaire deux fentes identiques, de largeur ', T('a'), ' chacune, séparées par une distance l. L’écran est à ', T('D'), ' des fentes. On compte ', T('N'), ' consécutives, régulièrement espacées (la lumière diffractée par chaque fente étale la figure, mais on n’en tient pas compte ici) ; la distance entre le centre de la première et celui de la dernière vaut ', T('X'), '. '];
      const rA = 'La largeur de chaque fente règle l’étendue de la zone éclairée (diffraction par chaque fente), pas l’écart entre deux franges voisines.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’interfrange i (distance entre deux franges brillantes consécutives) ?'], utiles: ['X', 'N'],
        raisons: { lam: 'La longueur d’onde permettrait de calculer l’interfrange si l était connue ; ici l’interfrange est mesurée directement sur l’écran.', a: rA, D: 'La distance fentes-écran ne sert pas à mesurer une distance déjà relevée sur l’écran.' },
        cherche: { bonne: 'L’interfrange i (en mm)', faux: ['La distance l entre les deux fentes (en µm)', 'La distance X divisée par le nombre N de franges (en mm)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'i = X / (N − 1) : N franges délimitent N − 1 interfranges', val: i, u: 'mm' } };
      return { tokens, texte: [...debut, 'Quelle est la distance l entre les deux fentes ?'], utiles: ['lam', 'D', 'X', 'N'],
        derivees: [{ id: 'i', nom: 'Interfrange', expr: 'i = X / (N − 1)', val: i, u: 'mm' }],
        raisons: { a: rA },
        cherche: { bonne: 'La distance l entre les deux fentes (en µm)', faux: ['L’interfrange i (en mm)', 'La largeur a de chaque fente (en µm)', 'La distance D entre les fentes et l’écran (en m)'] },
        manque: null, solution: { txt: 'l = λ·D / i', val: p.lam * 1e-9 * p.D / (i * 1e-3) * 1e6, u: 'µm' } };
    },
  },
  {
    id: 'ondReseau', domaine: 'Ondes', titre: 'Un réseau éclairé par un laser', noms: ['Angle de déviation de l’ordre 1', 'Pas du réseau', 'Longueur d’onde du laser'],
    gen: () => {
      const lam = tire([405, 532, 650]), n = tire([200, 250, 400, 500]), D = tire([1.0, 1.5]), a = 1e3 / n;           // a en µm
      const th = Math.asin(lam * 1e-3 / a);                                                                               // sin θ₁ = λ / a (λ en nm, a en µm : facteur 10⁻³)
      return { lam, n, D, a, x1: Math.round(D * Math.tan(th) * 1e3) / 10, P: tire([1, 5]) };                              // x₁ en cm, au mm près
    },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        n: tok(`${p.n} traits par mm`, 'Nombre de traits par millimètre du réseau', p.n, 'mm⁻¹'),
        D: tok(`${nb(p.D, 1)} m`, 'Distance entre le réseau et l’écran', p.D, 'm'),
        x1: tok(`${nb(p.x1, 1)} cm`, 'Distance entre la tache d’ordre 1 et la tache centrale', p.x1, 'cm'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P, 'mW'),
      };
      const th = Math.atan(p.x1 * 1e-2 / p.D), s1 = Math.sin(th);
      const rP = 'La puissance du laser change l’éclat des taches, pas leur position.';
      const entete = ['Un laser éclaire sous incidence normale un réseau, placé à ', T('D'), ' d’un écran. '];
      if (q === 0) return { tokens: { D: tokens.D, x1: tokens.x1, P: tokens.P }, derivees: [], texte: [...entete, 'Le laser a une puissance ', T('P'), '. La tache d’ordre 1 est à ', T('x1'), ' de la tache centrale (ordre 0). Quel est l’angle de déviation θ₁ de l’ordre 1 (en degré) ? '],
        utiles: ['x1', 'D'], raisons: { P: rP },
        cherche: { bonne: 'L’angle de déviation θ₁ de l’ordre 1 (en degré)', faux: ['Le pas a du réseau (en µm)', 'La distance x₁ entre les deux taches (en cm)', 'Le sinus de l’angle θ₁ (sans unité)'] },
        manque: null, solution: { txt: 'tan θ₁ = x₁ / D, donc θ₁ = arctan(x₁ / D)', val: th * 180 / Math.PI, u: '°' } };
      if (q === 1) return { tokens: { lam: tokens.lam, D: tokens.D, x1: tokens.x1, P: tokens.P }, texte: [...entete, 'Le laser a une longueur d’onde ', T('lam'), ' et une puissance ', T('P'), '. La tache d’ordre 1 est à ', T('x1'), ' de la tache centrale (ordre 0). Quel est le pas a du réseau, sachant que sin θ₁ = λ / a pour l’ordre 1 ? '],
        utiles: ['lam', 'x1', 'D'], derivees: [{ id: 'th', nom: 'Angle de déviation de l’ordre 1', expr: 'θ₁ = arctan(x₁ / D)', val: th * 180 / Math.PI, u: '°' }],
        raisons: { P: rP },
        cherche: { bonne: 'Le pas a du réseau (en µm)', faux: ['L’angle de déviation θ₁ de l’ordre 1 (en degré)', 'Le nombre de traits par millimètre du réseau (en mm⁻¹)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'a = λ / sin θ₁', val: p.lam * 1e-9 / s1 * 1e6, u: 'µm' } };
      return { tokens: { n: tokens.n, D: tokens.D, x1: tokens.x1, P: tokens.P }, texte: [...entete, 'Le réseau comporte ', T('n'), '. Le laser a une puissance ', T('P'), ' ; sa longueur d’onde est inconnue. La tache d’ordre 1 est à ', T('x1'), ' de la tache centrale (ordre 0). Quelle est la longueur d’onde λ du laser, sachant que sin θ₁ = λ / a pour l’ordre 1 ? '],
        utiles: ['n', 'x1', 'D'], derivees: [{ id: 'a', nom: 'Pas du réseau', expr: 'a = 1 / n', val: 1e3 / p.n, u: 'µm' }, { id: 'th', nom: 'Angle de déviation de l’ordre 1', expr: 'θ₁ = arctan(x₁ / D)', val: th * 180 / Math.PI, u: '°' }],
        raisons: { P: rP },
        cherche: { bonne: 'La longueur d’onde λ du laser (en nm)', faux: ['Le pas a du réseau (en µm)', 'L’angle de déviation θ₁ de l’ordre 1 (en degré)', 'La fréquence du laser (en Hz)'] },
        manque: null, solution: { txt: 'λ = a·sin θ₁', val: 1e3 / p.n * s1 * 1e3, u: 'nm' } };
    },
  },
  {
    id: 'abTampon', domaine: 'Acides et bases', titre: 'Solution tampon : pH et concentration', noms: ['pH du tampon', 'Concentration en ion éthanoate'],
    gen: () => ({ m1: tire([1.50, 3.00, 6.00]), m2: tire([2.05, 4.10, 8.20, 12.30]), V: tire([100, 200, 250, 500]), pKa: 4.8, Mh: 60.05, Mn: 82.03, prix: tire([4, 6, 9]) }),
    build: (p, q) => {
      const tokens = {
        m1: tok(`${nb(p.m1, 2)} g`, 'Masse d’acide éthanoïque dissoute', p.m1, 'g'),
        m2: tok(`${nb(p.m2, 2)} g`, 'Masse d’éthanoate de sodium dissous', p.m2, 'g'),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKa du couple CH₃COOH / CH₃COO⁻', p.pKa, ''),
        Mh: tok(`${nb(p.Mh, 2)} g·mol⁻¹`, 'Masse molaire de l’acide éthanoïque', p.Mh, 'g/mol'),
        Mn: tok(`${nb(p.Mn, 2)} g·mol⁻¹`, 'Masse molaire de l’éthanoate de sodium', p.Mn, 'g/mol'),
        prix: tok(`${p.prix} € le kilogramme`, 'Prix de l’éthanoate de sodium', p.prix, '€/kg'),
      };
      const nAH = p.m1 / p.Mh, nA = p.m2 / p.Mn, ph = p.pKa + Math.log10(nA / nAH);
      const debut = ['On prépare une solution tampon en dissolvant ', T('m1'), ' d’acide éthanoïque et ', T('m2'), ' d’éthanoate de sodium dans de l’eau, pour obtenir un volume ', T('V'), ' de solution. Le pKa du couple acide éthanoïque / ion éthanoate vaut ', T('pKa'), ' à 25 °C. Les masses molaires sont : ', T('Mh'), ' pour l’acide éthanoïque et ', T('Mn'), ' pour l’éthanoate de sodium. Ce dernier coûte ', T('prix'), '. '];
      const rP = 'Le prix n’a aucune influence sur la grandeur cherchée.';
      if (q === 0) return { tokens, derivees: [
          { id: 'nAH', nom: 'Quantité d’acide éthanoïque', expr: 'n(AH) = m₁ / M(AH)', val: nAH, u: 'mol' },
          { id: 'nA', nom: 'Quantité d’ion éthanoate', expr: 'n(A⁻) = m₂ / M(A⁻)', val: nA, u: 'mol' }],
        texte: [...debut, 'Quel est le pH du tampon ?'], utiles: ['m1', 'm2', 'pKa', 'Mh', 'Mn'],
        raisons: { V: 'Le pH ne dépend que du rapport [A⁻] / [AH], égal à n(A⁻) / n(AH) : le volume se simplifie.', prix: rP },
        cherche: { bonne: 'Le pH du tampon', faux: ['La concentration en acide éthanoïque (en mol·L⁻¹)', 'La concentration en ion éthanoate (en mol·L⁻¹)', 'La quantité de matière totale (en mol)'] },
        manque: null, solution: { txt: 'pH = pKa + log(n(A⁻) / n(AH))', val: ph, u: '' } };
      return { tokens, texte: [...debut, 'Quelle est la concentration en ion éthanoate dans la solution ?'], utiles: ['m2', 'Mn', 'V'],
        derivees: [{ id: 'nA', nom: 'Quantité d’ion éthanoate', expr: 'n(A⁻) = m₂ / M(A⁻)', val: nA, u: 'mol' }],
        raisons: { m1: 'La masse d’acide éthanoïque sert à calculer [AH] et le pH, pas [A⁻].', pKa: 'Le pKa sert à calculer un pH, pas une concentration.', Mh: 'Cette masse molaire sert à calculer la quantité d’acide, qui n’intervient pas ici.', prix: rP },
        cherche: { bonne: 'La concentration en ion éthanoate (en mol·L⁻¹)', faux: ['La concentration en acide éthanoïque (en mol·L⁻¹)', 'Le pH du tampon', 'La quantité de matière d’ion éthanoate (en mol)'] },
        manque: null, solution: { txt: '[A⁻] = n(A⁻) / V', val: nA / (p.V * 1e-3), u: 'mol/L' } };
    },
  },
  {
    id: 'estRendement', domaine: 'Synthèse organique', titre: 'Estérification : réactif limitant et rendement', noms: ['Quantité d’ester obtenue', 'Rendement'],
    gen: () => {
      const Va = tire([10, 12, 15]), Vb = tire([15, 20, 25]), eta = tire([0.50, 0.55, 0.60, 0.65]);
      const na = Va * 1.05 / 60.05, nb_ = Vb * 0.80 / 60.10, nlim = Math.min(na, nb_);
      return { Va, Vb, m: Math.round(eta * nlim * 102.13 * 10) / 10, t: tire([60, 90, 120]) };
    },
    build: (p, q) => {
      const tokens = {
        Va: tok(`${p.Va} mL`, 'Volume d’acide éthanoïque', p.Va, 'mL'),
        Vb: tok(`${p.Vb} mL`, 'Volume de propan-1-ol', p.Vb, 'mL'),
        ra: tok('1,05 g·mL⁻¹', 'Masse volumique de l’acide éthanoïque', 1.05, 'g/mL'),
        rb: tok('0,80 g·mL⁻¹', 'Masse volumique du propan-1-ol', 0.80, 'g/mL'),
        Ma: tok('60,05 g·mol⁻¹', 'Masse molaire de l’acide éthanoïque', 60.05, 'g/mol'),
        Mb: tok('60,10 g·mol⁻¹', 'Masse molaire du propan-1-ol', 60.10, 'g/mol'),
        Me: tok('102,13 g·mol⁻¹', 'Masse molaire de l’éthanoate de propyle', 102.13, 'g/mol'),
        m: tok(`${nb(p.m, 1)} g`, 'Masse d’ester pur obtenue', p.m, 'g'),
        t: tok(`${p.t} minutes`, 'Durée du chauffage à reflux', p.t, 'min'),
      };
      const na = p.Va * 1.05 / 60.05, nb_ = p.Vb * 0.80 / 60.10, nlim = Math.min(na, nb_), ne = p.m / 102.13;
      const debut = ['On chauffe à reflux, pendant ', T('t'), ', ', T('Va'), ' d’acide éthanoïque (masse volumique ', T('ra'), ', masse molaire ', T('Ma'), ') avec ', T('Vb'), ' de propan-1-ol (masse volumique ', T('rb'), ', masse molaire ', T('Mb'), '), en présence d’acide sulfurique. Après lavage, séchage et distillation, on obtient ', T('m'), ' d’éthanoate de propyle pur (masse molaire ', T('Me'), '). L’équation est CH₃COOH + C₃H₇OH = CH₃COOC₃H₇ + H₂O. '];
      const rT = 'La durée du chauffage n’intervient pas dans un bilan de matière.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de matière d’ester a-t-on obtenue ?'], utiles: ['m', 'Me'],
        raisons: { Va: 'Les volumes de réactifs servent à calculer la quantité maximale d’ester, pas la quantité obtenue.', Vb: 'Les volumes de réactifs servent à calculer la quantité maximale d’ester, pas la quantité obtenue.', ra: 'Cette masse volumique sert à calculer la quantité d’acide, qui n’intervient pas ici.', rb: 'Cette masse volumique sert à calculer la quantité d’alcool, qui n’intervient pas ici.', Ma: 'Cette masse molaire sert à calculer la quantité d’acide, qui n’intervient pas ici.', Mb: 'Cette masse molaire sert à calculer la quantité d’alcool, qui n’intervient pas ici.', t: rT },
        cherche: { bonne: 'La quantité de matière d’ester obtenue (en mol)', faux: ['Le rendement de la synthèse (en %)', 'La quantité maximale d’ester (en mol)', 'La masse maximale d’ester (en g)'] },
        manque: null, solution: { txt: 'n(ester) = m / M(ester)', val: ne, u: 'mol' } };
      return { tokens, texte: [...debut, 'Quel est le rendement de la synthèse ?'], utiles: ['Va', 'Vb', 'ra', 'rb', 'Ma', 'Mb', 'm', 'Me'],
        derivees: [
          { id: 'na', nom: 'Quantité d’acide', expr: 'n(acide) = ρ·V / M', val: na, u: 'mol' },
          { id: 'nb', nom: 'Quantité d’alcool', expr: 'n(alcool) = ρ·V / M', val: nb_, u: 'mol' },
          { id: 'ne', nom: 'Quantité d’ester obtenue', expr: 'n(ester) = m / M', val: ne, u: 'mol' }],
        raisons: { t: rT },
        cherche: { bonne: 'Le rendement de la synthèse (en %)', faux: ['La quantité d’ester obtenue (en mol)', 'La masse maximale d’ester (en g)', 'La constante d’équilibre K de la réaction'] },
        manque: null, solution: { txt: 'η = n(ester obtenu) / n(réactif limitant)', val: ne / nlim * 100, u: '%' } };
    },
  },
  // ───────────────────────────── pH et concentration en ions oxonium (TG)
  {
    id: 'phc-ph-hcl', domaine: 'pH et concentration en ions oxonium', titre: 'Une solution d’acide chlorhydrique', noms: ['pH de la solution', 'Concentration en ions oxonium'],
    gen: () => ({ m: tire([1.5, 2.0, 2.5, 4.0, 5.0, 8.0]), n: tire([2, 3, 4]), pH: Math.round((1.2 + Math.random() * 4.3) * 100) / 100, V: tire([100, 250, 500]), prix: tire([8, 12, 15]) }),
    build: (p, q) => {
      const C = Number(`${p.m}e-${p.n}`), c0 = 1;
      const tokens = {
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
        prix: tok(`${p.prix} €`, 'Prix du flacon d’acide', p.prix, '€'),
        c0: tok('1 mol/L', 'Concentration standard c°', c0, 'mol·L⁻¹'),
      };
      const raisons = { V: 'Le pH ne dépend que de la concentration en ions oxonium, pas du volume de solution.', prix: 'Le prix du flacon n’intervient pas dans le calcul.' };
      if (q === 0) {
        tokens.C = tok(`${nb(p.m, 1)} × 10${p.n === 2 ? '⁻²' : p.n === 3 ? '⁻³' : '⁻⁴'} mol/L`, 'Concentration en soluté apporté (acide fort : [H₃O⁺] = C)', C, 'mol·L⁻¹');
        return { tokens, derivees: [], texte: ['Un technicien prépare ', T('V'), ' d’une solution d’acide chlorhydrique (acide fort, totalement dissocié) de concentration en soluté apporté ', T('C'), ', à partir d’un flacon payé ', T('prix'), '. La concentration standard est ', T('c0'), '. Quel est le pH de la solution ?'],
          utiles: ['C', 'c0'], raisons,
          cherche: { bonne: 'Le pH de la solution', faux: ['La concentration en ions oxonium (en mol/L)', 'Le volume d’acide à prélever (en mL)', 'La quantité de matière de HCl (en mmol)'] },
          manque: null, solution: { txt: 'pH = −log([H₃O⁺] / c°) avec [H₃O⁺] = C', val: -Math.log10(C / c0), u: '' } };
      }
      tokens.pH = tok(nb(p.pH, 2), 'pH lu sur le pH-mètre', p.pH, '');
      return { tokens, derivees: [], texte: ['Un pH-mètre plongé dans ', T('V'), ' d’une solution d’acide chlorhydrique (flacon payé ', T('prix'), ') indique pH = ', T('pH'), '. La concentration standard est ', T('c0'), '. Quelle est la concentration en ions oxonium de la solution ?'],
        utiles: ['pH', 'c0'], raisons,
        cherche: { bonne: 'La concentration en ions oxonium [H₃O⁺] (en mol/L)', faux: ['Le pH de la solution', 'Le volume d’acide chlorhydrique (en mL)', 'La concentration en ions chlorure après dilution'] },
        manque: null, solution: { txt: '[H₃O⁺] = c° × 10^(−pH)', val: c0 * 10 ** -p.pH, u: 'mol/L' } };
    },
  },
  {
    id: 'phc-dilution-ph', domaine: 'pH et concentration en ions oxonium', titre: 'Dilution d’une solution d’acide chlorhydrique', noms: ['pH après dilution', 'Facteur de dilution'],
    gen: () => { const [V1, V2] = tire([[10.0, 100], [1.0, 100], [5.0, 500], [10.0, 1000], [1.0, 1000], [2.0, 200]]); const pHmax = Math.min(3.5, 6 - Math.log10(V2 / V1)); /* pH final ≤ 6 : au-delà, l’autoprotolyse de l’eau fausse pH = −log c */ return { pH0: Math.round((1.5 + Math.random() * (pHmax - 1.5)) * 100) / 100, V1, V2, duree: tire([2, 5, 10]), prix: tire([6, 9, 14]) }; },
    build: (p, q) => {
      const F = p.V2 / p.V1;
      const tokens = {
        V1: tok(`${nb(p.V1, 1)} mL`, 'Volume de solution prélevé à la pipette jaugée', p.V1, 'mL'),
        V2: tok(`${p.V2} mL`, 'Volume de la fiole jaugée', p.V2, 'mL'),
        duree: tok(`${p.duree} min`, 'Durée d’agitation de la fiole', p.duree, 'min'),
        prix: tok(`${p.prix} €`, 'Prix de la pipette', p.prix, '€'),
      };
      const debut = ['On prélève ', T('V1'), ' d’une solution d’acide chlorhydrique avec une pipette jaugée (', T('prix'), '), qu’on place dans une fiole jaugée de ', T('V2'), ' ; on complète avec de l’eau distillée puis on agite pendant ', T('duree'), '. '];
      const raisons = { duree: 'La durée d’agitation n’intervient pas dans le calcul du facteur de dilution ni du pH.', prix: 'Le prix du matériel n’intervient pas dans le calcul.' };
      if (q === 0) {
        tokens.pH0 = tok(nb(p.pH0, 2), 'pH de la solution avant dilution', p.pH0, '');
        return { tokens, derivees: [{ id: 'F', nom: 'Facteur de dilution F', expr: 'F = V₂ / V₁', val: F, u: '' }], texte: [...debut, 'Avant la dilution, le pH de la solution vaut ', T('pH0'), '. Quel est le pH de la solution diluée ?'],
          utiles: ['pH0', 'V1', 'V2'], raisons,
          cherche: { bonne: 'Le pH de la solution diluée', faux: ['Le facteur de dilution F', 'La concentration en ions oxonium avant dilution (en mol/L)', 'Le volume d’eau ajouté (en mL)'] },
          manque: null, solution: { txt: 'pH final = pH initial + log F, avec F = V₂ / V₁', val: p.pH0 + Math.log10(F), u: '' } };
      }
      tokens.pH0 = tok(nb(p.pH0, 2), 'pH de la solution avant dilution', p.pH0, '');
      return { tokens, derivees: [], texte: [...debut, 'Le pH de la solution avant dilution vaut ', T('pH0'), '. Quel est le facteur de dilution ?'],
        utiles: ['V1', 'V2'], raisons: { ...raisons, pH0: 'Le facteur de dilution ne dépend que des volumes prélevé et final, pas du pH.' },
        cherche: { bonne: 'Le facteur de dilution F (sans unité)', faux: ['Le pH de la solution diluée', 'La concentration finale en ions oxonium (en mol/L)', 'Le volume d’eau ajouté (en mL)'] },
        manque: null, solution: { txt: 'F = V₂ / V₁', val: F, u: '' } };
    },
  },
  // ───────────────────────────── Plans d'expériences (BTS) : plan de mélange, rouge à lèvres
  {
    id: 'pmel-melange', domaine: 'Plans', titre: 'Un rouge à lèvres à trois corps gras', noms: ['Fraction de cire d’abeille', 'Écart au milieu du mélange AB'],
    gen: () => {
      const m = tire([[1.088, 0.704, 1.408], [1.2, 0.8, 1.0], [0.9, 1.1, 1.0], [1.5, 0.5, 1.0]]);
      const y = tire([[5, 2, 8], [5, 3, 7], [4, 2, 6]]);
      return { mA: m[0], mB: m[1], mC: m[2], T: tire([70, 80, 85]), yA: y[0], yB: y[1], yAB: y[2] };
    },
    build: (p, q) => {
      const tot = p.mA + p.mB + p.mC, xC = p.mC / tot, ecart = p.yAB - (p.yA + p.yB) / 2;
      const tokens = {
        mA: tok(`${nb(p.mA)} g`, 'Masse de cire de candelilla (A)', p.mA, 'g'),
        mB: tok(`${nb(p.mB)} g`, 'Masse d’huile de ricin (B)', p.mB, 'g'),
        mC: tok(`${nb(p.mC)} g`, 'Masse de cire d’abeille (C)', p.mC, 'g'),
        T: tok(`${p.T} °C`, 'Température de coulée', p.T, '°C'),
      };
      const debut = ['Pour un rouge à lèvres, on mélange ', T('mA'), ' de cire de candelilla (A), ', T('mB'), ' d’huile de ricin (B) et ', T('mC'), ' de cire d’abeille (C), coulés à ', T('T'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'tot', nom: 'Masse totale des corps gras', expr: 'm_A + m_B + m_C', val: tot, u: 'g' }],
        texte: [...debut, 'On veut décrire la composition par les fractions massiques. Quelle est la fraction de cire d’abeille ?'],
        utiles: ['mA', 'mB', 'mC'],
        raisons: { T: 'La température de coulée ne change pas la composition du mélange.' },
        cherche: { bonne: 'La fraction massique x_C de cire d’abeille (sans unité)', faux: ['La masse totale des corps gras (en g)', 'Le rapport m_C / m_B (sans unité)', 'La masse de cire d’abeille à ajouter (en g)'] },
        manque: null, solution: { txt: 'x_C = m_C / (m_A + m_B + m_C)', val: xC, u: '' } };
      tokens.yA = tok(`${p.yA}`, 'Note du jury pour A pur (sur 10)', p.yA, '');
      tokens.yB = tok(`${p.yB}`, 'Note du jury pour B pur (sur 10)', p.yB, '');
      tokens.yAB = tok(`${p.yAB}`, 'Note du jury pour le mélange à parts égales de A et B (sur 10)', p.yAB, '');
      return { tokens, derivees: [{ id: 'moy', nom: 'Moyenne des notes de A et B purs', expr: '(y_A + y_B) / 2', val: (p.yA + p.yB) / 2, u: '' }],
        texte: ['Le jury note les mélanges sur 10. La cire de candelilla seule (A) obtient ', T('yA'), ', l’huile de ricin seule (B) obtient ', T('yB'), ', et le mélange à parts égales de A et B obtient ', T('yAB'), '. La formule de référence utilise ', T('mA'), ' de A, ', T('mB'), ' de B et ', T('mC'), ' de C, coulés à ', T('T'), '. On cherche l’écart au milieu pour savoir si A et B interagissent.'],
        utiles: ['yA', 'yB', 'yAB'],
        raisons: { mA: 'Les masses de la formule de référence donnent sa composition ; l’écart au milieu n’utilise que les trois notes.', mB: 'Les masses de la formule de référence donnent sa composition ; l’écart au milieu n’utilise que les trois notes.', mC: 'Les masses de la formule de référence donnent sa composition ; l’écart au milieu n’utilise que les trois notes.', T: 'La température de coulée est la même pour tous les essais : elle n’intervient pas.' },
        cherche: { bonne: 'L’écart au milieu : note du mélange moins moyenne des notes des deux corps purs (en points)', faux: ['La moyenne des trois notes (en points)', 'La somme des notes de A et de B (en points)', 'Le rapport de la note du mélange à celle de A (sans unité)'] },
        manque: null, solution: { txt: 'écart = y_AB − (y_A + y_B) / 2', val: ecart, u: '' } };
    },
  },
  // ───────────────────────────── Plans d'expériences (BTS) : plan factoriel 2^k, flan au chocolat
  {
    id: 'pfac-flan', domaine: 'Plans', titre: 'Un plan factoriel sur un flan au chocolat', noms: ['Nombre d’essais du plan complet', 'Coefficient d’un facteur'],
    gen: () => {
      const c = tire([{ nom: 'la recette végétale (+1)', nomm: 'la recette animale (−1)', rep: 'la note moyenne du jury', mp: 2.375, mm: 6.25, d: 3 },
        { nom: 'la température de 102 °C (+1)', nomm: 'la température de 75 °C (−1)', rep: 'la viscosité moyenne', mp: 5309.5, mm: 1486.25, d: 2 }]);
      return { k: tire([3, 4]), c };
    },
    build: (p, q) => {
      const N = 2 ** p.k, a = (p.c.mp - p.c.mm) / 2;
      const tokens = {
        k: tok(`${p.k} facteurs`, 'Nombre de facteurs étudiés', p.k, ''),
        niv: tok('deux niveaux', 'Nombre de niveaux de chaque facteur', 2, ''),
        duree: tok('20 min', 'Durée de cuisson, identique pour tous les essais', 20, 'min'),
      };
      if (q === 0) return { tokens, derivees: [],
        texte: ['On étudie ', T('k'), ' sur un flan au chocolat. Chaque facteur est testé à ', T('niv'), ' (niveau bas −1, niveau haut +1) et la cuisson dure toujours ', T('duree'), '. On réalise toutes les combinaisons de niveaux. Combien d’essais comporte ce plan complet ?'],
        utiles: ['k', 'niv'],
        raisons: { duree: 'La durée de cuisson est fixée, elle ne change pas le nombre de combinaisons.' },
        cherche: { bonne: 'Le nombre d’essais du plan complet (sans unité)', faux: ['Le nombre de degrés de liberté du modèle (sans unité)', 'Le nombre d’interactions doubles (sans unité)', 'La durée totale de cuisson (en min)'] },
        manque: null, solution: { txt: 'N = 2^k (niveaux^facteurs)', val: N, u: '' } };
      tokens.mp = tok(`${nb(p.c.mp, p.c.d === 3 ? 3 : 1)}`, `Moyenne de ${p.c.rep} sur les 4 essais où le facteur est au niveau haut (+1)`, p.c.mp, '');
      tokens.mm = tok(`${nb(p.c.mm, p.c.d === 3 ? 2 : 2)}`, `Moyenne de ${p.c.rep} sur les 4 essais où le facteur est au niveau bas (−1)`, p.c.mm, '');
      return { tokens, derivees: [],
        texte: ['Dans le plan complet à ', T('k'), ' (', T('niv'), '), on regroupe les essais selon le niveau d’un facteur. ', T('mp'), ' est la moyenne de ' + p.c.rep + ' pour ' + p.c.nom + ', et ', T('mm'), ' la moyenne pour ' + p.c.nomm + '. La cuisson dure ', T('duree'), '. Quel est le coefficient de ce facteur dans le modèle ?'],
        utiles: ['mp', 'mm'],
        raisons: { k: 'Le nombre de facteurs ne sert pas : le coefficient se calcule à partir des deux moyennes.', niv: 'Le nombre de niveaux (2) est déjà pris en compte dans le codage −1 / +1.', duree: 'La durée de cuisson est identique pour tous les essais.' },
        cherche: { bonne: 'Le coefficient du facteur : demi-écart entre les deux moyennes', faux: ['L’effet total du facteur : écart entre les deux moyennes', 'La moyenne générale de tous les essais', 'Le nombre d’essais du plan'] },
        manque: null, solution: { txt: 'a = (Moy⁺ − Moy⁻) / 2', val: a, u: '' } };
    },
  },
];

// Mélange reproductible (pour que l’ordre des propositions ne change pas à chaque affichage)
export function melange(tab, graine) {
  const a = tab.slice(); let s = (graine * 2654435761) >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Symbole de chaque donnée tel qu'il apparaît dans la formule (affiché à côté du nom de la grandeur)
const SYMBOLES = {
  'flu-statique': { rho: 'ρ', g: 'g', P: 'P_rel', th: 'θ', Vc: 'V_cuve', Patm: 'P_atm', d: 'd', dh: 'Δh' },
  'flu-debit': { mv: 'm_fût', mt: 'm_balance', dt: 'Δt', V: 'V', Bmax: 'm_max', Pm: 'P_moteur', th: 'θ' },
  'flu-section': { D1: 'D₁', D2: 'D₂', v1: 'v₁', P1: 'P₁', L: 'L', th: 'θ', Vr: 'V_bassin' },
  'flu-pompe': { rho: 'ρ', g: 'g', dz: 'Δz', dp: 'Δp_J', Q: 'Q_V', Pel: 'P_él', L: 'L', th: 'θ', Patm: 'P_atm' },
  hydrodist: { mp: 'm_fleurs', Veau: 'V_eau', P: 'P', t: 'Δt', T: 'θ', mh: 'm_huile', rho: 'ρ', Vh: 'V_hydrolat' },
  'crist-evaporateur': { q1: 'q₁', w1: 'w₁', w2: 'w₂', S: 'S', Pv: 'P', th: 'θ', dur: 'Δt' },
  paroi: { an: '', L: 'L', h: 'h', e: 'e', lam: 'λ', Ti: 'T_int', Te: 'T_ext', prix: 'prix', dur: 'durée' },
  conduite: { Pel: 'P_él', D: 'D', Lc: 'L', Q: 'Q_V', tdur: 'Δt' },
  aspirine: { mc: 'm_comprimé', M: 'M', Vf: 'V_f', VA: 'V_A', cB: 'c_B', pH: 'pH', VE: 'V_E' },
  can: { sens: 's', n: 'n', vmin: 'V_min', vmax: 'V_max', fe: 'f_e' },
  echangeur: { qc: 'q_m,chaud', Tce: 'T_ce', Tcs: 'T_cs', c: 'c', qf: 'q_m,froid', Tfe: 'T_fe' },
  beer: { lam: 'λ', l: 'ℓ', A: 'A', eps: 'ε', theta: 'θ' },
  reservoir: { rho: 'ρ', h: 'h', D: 'D', Patm: 'P_atm' },
  regulP: { hc: 'consigne', Kp: 'K_p', Qmax: 'Q_max', Qp: 'Q_p', S: 'S', Ti: 'T_i' },
  premord: { tau: 'τ', T0: 'T₀', Tf: 'T_f', t: 't', res: '', m: 'm' },
  incertA: { n: 'n', xm: 'x̄', s: 's', k: 'k', res: '', dur: '' },
  compatS: { x: 'x', u: 'u', cref: 'x_ref', n: '', theta: '' },
  moteurPas: { N: 'N', D: 'D', Np: 'N_p', U: 'U', R: 'R' },
  champB: { BT: 'B_T', Ba: 'B_a', r1: 'r₁', r2: 'r₂', T: 'θ' },
  rho2: { T: '', mv: 'm_vide', mt: 'm_avec liquide', V: 'V', rho: 'ρ', VL: 'V' },
  conc2: { M: 'M', m: 'm', Vi: 'V_eau', Vf: 'V', t: 't' },
  poids2: { mg: 'm', g: 'g', V: 'V', mk: 'm', ga: 'g' },
  vitesse2: { d: 'd', t: 'Δt', m: 'm', dm: 'd', v: 'v' },
  ohm2: { R: 'R', I: 'I', L: 'ℓ', U: 'U', Rm: 'R' },
  indice2: { c: 'c', ep: 'e', v: 'v', n: 'n' },
  snell2: { n1: 'n₁', i1: 'i₁', lam: 'λ', n2: 'n₂', i2: 'i₂' },
  noyau2: { A: 'A', Z: 'Z', e: 'e', mp: 'm_nucléon' },
  dissol2: { M: 'M', T: '', Ve: 'V_eau', m: 'm', Vf: 'V', c: 'c' },
  ener2: { P: 'P', d: 'Δt', prix: 'prix', R: 'R', I: 'I', L: 'ℓ' },
  meca2: { m: 'm', v: 'v', L: 'ℓ', F: 'F', d: 'd', a: 'α', mt: 'm' },
  distil: { V: 'V', x: 'x', y: 'y', Vd: 'V_distillat', Te: 'θ_éb', P: 'P' },
  cristal: { me: 'm_eau', mb: 'm_bécher', s60: 's₆₀', s20: 's₂₀', dur: 'Δt' },
};
export function nouvelEnonce(id, q, forceParams) {
  const def = ENONCES.find(e => e.id === id);
  const p = forceParams || def.gen();
  const b = def.build(p, q);
  b.dansTexte = new Set(b.texte.filter(m => typeof m !== 'string').map(m => m.t));
  b.schema = def.schema ? def.schema(p, b, q) : null;
  Object.entries(b.tokens).forEach(([k, t]) => { t.sym = (SYMBOLES[id] || {})[k] || ''; });
  return { id, q, p, b, graine: 1 + Math.floor(Math.random() * 99999) };
}
