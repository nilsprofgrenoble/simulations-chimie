import { useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ARetenir, IndiceDefi, Formule, FormuleEnLigne, lireNombre, proche } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./photonModele";
import { QCM } from "./photonQcm";
import { COL } from "./photonStyle";
import { SceneOnde, SceneSpectre, SceneChaine, SvgLambdaNu, SvgLog, SvgDomaines, SvgPrefixes, SvgModeles, SvgEnergie } from "./photonSchemas";

const SIM_ID = 164, CLE_GUIDE = 'photon-1g-guide-v1';
declarerDefis(SIM_ID, [['domaine', 'Identifier le domaine d’une onde'], ['energie', 'Calculer l’énergie d’un photon en eV'], ['hors', 'Au-delà du programme : photons émis par seconde']]);

// ====================================================
//  SIM 164 — LUMIÈRE : DOMAINES SPECTRAUX ET ÉNERGIE D'UN PHOTON (1G spé PC, « Ondes et signaux », partie « Modèles ondulatoire et particulaire de la lumière »).
//  Une seule idée : situer une onde électromagnétique sur l'échelle (logarithmique) des longueurs d'onde et des fréquences, passer de λ à ν (λ = c/ν),
//  puis associer à la lumière des photons d'énergie E = h·ν = h·c/λ, exprimée en joules et en électronvolts.
//  NON TRAITÉ ICI (autre simulation) : niveaux d'énergie, absorption et émission, spectres de raies.
//  Modèle : photonModele.js (testé). HYPOTHÈSES (panneau d'hypothèses et étapes) : vide ; bornes des domaines = repères conventionnels ;
//  le photon est un modèle ; énergie d'UN photon de fréquence unique ; c = 3,00×10⁸ m·s⁻¹, h = 6,63×10⁻³⁴ J·s, 1 eV = 1,60×10⁻¹⁹ J (3 chiffres significatifs).
//  Capacités visées (jamais affichées à l'élève) : utiliser une échelle de fréquences ou de longueurs d'onde pour identifier un domaine spectral ;
//  citer l'ordre de grandeur des fréquences ou des longueurs d'onde utilisées dans différents domaines ; λ = c/ν ; E = h·ν = h·c/λ ; conversion J ↔ eV ;
//  comprendre qualitativement les modèles ondulatoire et particulaire et leur complémentarité.
//  Parcours : 13 étapes ; 6 cartes « À retenir » ; trois défis (domaine, énergie en eV, au-delà du programme : photons par seconde).
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const NB = ' ';
const IDS = ['onde', 'echelle', 'domLambda', 'domNu', 'appli', 'conv', 'nu', 'lambdaWifi', 'photon', 'eJoule', 'eEv', 'compare', 'inverse'];

// ───────────── Formules (MathML) ─────────────
const FLambda = <Formule><mi>λ</mi><mo>=</mo><mfrac><mi>c</mi><mi>ν</mi></mfrac></Formule>;
const FLamNu = <Formule><mi>λ</mi><mo>=</mo><mfrac><mi>c</mi><mi>ν</mi></mfrac><mspace width="1.5em"/><mi>ν</mi><mo>=</mo><mfrac><mi>c</mi><mi>λ</mi></mfrac></Formule>;
const FEnergie = <Formule><mi>E</mi><mo>=</mo><mi>h</mi><mo>·</mo><mi>ν</mi><mo>=</mo><mfrac><mrow><mi>h</mi><mo>·</mo><mi>c</mi></mrow><mi>λ</mi></mfrac></Formule>;
const FEnLigne = <FormuleEnLigne><mi>E</mi><mo>=</mo><mi>h</mi><mo>·</mo><mi>ν</mi><mo>=</mo><mfrac><mrow><mi>h</mi><mo>·</mo><mi>c</mi></mrow><mi>λ</mi></mfrac></FormuleEnLigne>;
const FLambdaLigne = <FormuleEnLigne><mi>λ</mi><mo>=</mo><mfrac><mi>c</mi><mi>ν</mi></mfrac></FormuleEnLigne>;
const FNuLigne = <FormuleEnLigne><mi>ν</mi><mo>=</mo><mfrac><mi>c</mi><mi>λ</mi></mfrac></FormuleEnLigne>;
const FLogCarte = <Formule><mtext>{"1\u00a0graduation"}</mtext><mo>=</mo><mo>×</mo><mn>10</mn></Formule>;

// ───────────── Tableaux de bornes (repères conventionnels) ─────────────
const BORNES_NU = { radio: 'ν < 1 GHz', micro: '1 GHz à 300 GHz', ir: '300 GHz à 385 THz', vis: '385 à 750 THz', uv: '750 THz à 30 PHz', x: '30 PHz à 30 EHz', gamma: 'ν > 30 EHz' };
const th = { textAlign: 'left', padding: '4px 6px', fontSize: 12.5, color: KIT.txt2, borderBottom: `1.5px solid ${KIT.bord}`, fontWeight: 700 };
const td = { padding: '4px 6px', fontSize: 13, color: KIT.txt, borderBottom: `1px solid ${KIT.bord}`, verticalAlign: 'top' };
function TableauBornes({ avecNu }) {
  return (
    <div data-bornes="1" style={{ marginTop: 8, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <caption style={{ captionSide: 'top', textAlign: 'left', fontSize: 12.5, color: KIT.txt2, paddingBottom: 3 }}>Repères conventionnels (les bornes varient un peu selon les sources)</caption>
        <thead><tr><th style={th}>Domaine</th><th style={{ ...th, color: COL.lam }}>Longueur d’onde λ</th>{avecNu && <th style={{ ...th, color: COL.nu }}>Fréquence ν</th>}</tr></thead>
        <tbody>
          {M.DOMAINES.map(d => (
            <tr key={d.id}>
              <td style={{ ...td, fontWeight: 700 }}><span aria-hidden="true" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, marginRight: 5, background: d.id === 'vis' ? 'linear-gradient(90deg,#dc2626,#eab308,#22c55e,#3b82f6,#7c3aed)' : d.couleur }}/>{d.court === 'gamma' ? 'rayons gamma' : d.court}</td>
              <td style={td}>{d.borne}</td>
              {avecNu && <td style={td}>{BORNES_NU[d.id]}</td>}
            </tr>))}
        </tbody>
      </table>
    </div>);
}
function TableauApplications() {
  const lignes = ['fm', 'wifi', 'four', 'tele', 'bronz', 'xray', 'gamma'].map(id => M.APPLICATIONS.find(a => a.id === id));
  const donnee = a => (a.id === 'fm' ? 'ν ≈ 100 MHz' : a.id === 'wifi' ? 'ν = 2,4 GHz' : a.id === 'four' ? 'ν = 2,45 GHz' : a.id === 'tele' ? 'λ ≈ 940 nm' : a.id === 'bronz' ? 'λ ≈ 350 nm' : a.id === 'xray' ? 'λ ≈ 0,1 nm' : 'λ ≈ 1 pm');
  return (
    <div style={{ marginTop: 8, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th style={th}>Application</th><th style={th}>Onde utilisée (ordre de grandeur)</th></tr></thead>
        <tbody>{lignes.map(a => <tr key={a.id}><td style={{ ...td, fontWeight: 700 }}>{a.nom}</td><td style={td}>{donnee(a)}</td></tr>)}</tbody>
      </table>
    </div>);
}
function TableauPhotons() {
  const l = [['Radio FM', 'ν = 1,00×10⁸ Hz', 'λ ≈ 3,00 m'], ['Lumière verte', 'ν = 5,64×10¹⁴ Hz', 'λ = 532 nm'], ['Rayons X', 'ν = 3,00×10¹⁸ Hz', 'λ = 0,100 nm']];
  return (
    <div style={{ marginTop: 8, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th style={th}>Photon</th><th style={{ ...th, color: COL.nu }}>Fréquence</th><th style={{ ...th, color: COL.lam }}>Longueur d’onde</th></tr></thead>
        <tbody>{l.map(r => <tr key={r[0]}><td style={{ ...td, fontWeight: 700 }}>{r[0]}</td><td style={td}>{r[1]}</td><td style={td}>{r[2]}</td></tr>)}</tbody>
      </table>
    </div>);
}

// Faisceau d'un pointeur laser (scène de l'étape sur les deux modèles)
function SceneLaser() {
  return (
    <svg viewBox="0 0 400 150" style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto' }} role="img" aria-label="Un pointeur laser vert envoie un faisceau lumineux de longueur d’onde 532 nanomètres sur un mur.">
      <rect x="20" y="52" width="96" height="30" rx="9" fill="#334155"/>
      <rect x="100" y="58" width="22" height="18" rx="4" fill="#64748b"/>
      <circle cx="46" cy="67" r="4.5" fill="#f87171"/>
      <line x1="124" y1="67" x2="334" y2="67" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.9"/>
      <line x1="124" y1="67" x2="334" y2="67" stroke="#bbf7d0" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="342" y="20" width="22" height="110" rx="4" fill="#e2e8f0" stroke="#94a3b8"/>
      <circle cx="342" cy="67" r="8" fill="#22c55e"/>
      <text x="70" y="108" textAnchor="middle" fontSize="13" fill={COL.encre} fontFamily="system-ui, sans-serif">pointeur laser</text>
      <text x="228" y="46" textAnchor="middle" fontSize="13" fill={COL.encre} fontFamily="system-ui, sans-serif">faisceau vert, λ = 532 nm</text>
      <text x="353" y="146" textAnchor="middle" fontSize="13" fill={COL.encre} fontFamily="system-ui, sans-serif">mur</text>
    </svg>);
}

// ───────────── Curseur de repère (échelle logarithmique) ─────────────
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
function Repere({ valeur, onChange, titre, texteValeur, aideTexte }) {
  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>{titre}{texteValeur && <span style={{ color: KIT.txt, marginLeft: 8 }}>{texteValeur}</span>}</label>
      {/* le curseur va dans le sens de l'axe du schéma : à droite = λ plus petite (donc ν plus grande) */}
      <input type="range" min={-M.LOG_MAX} max={-M.LOG_MIN} step={0.05} value={-valeur} onChange={x => onChange(-parseFloat(x.target.value))}
        aria-label={titre} aria-valuetext={texteValeur || 'position du repère sur l’échelle'} style={{ width: '100%', accentColor: COL.repere, height: 32 }}/>
      {aideTexte && aide(aideTexte)}
    </div>);
}

// ====================================================
export function SimulationPhoton() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('domaine');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [pl, setPl] = useState(-1.5);                                       // repère de l'étape « échelle »
  const [ex, setEx] = useState({ lg: Math.log10(532e-9), ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const reussie = !!(guide.reussies && guide.reussies[etape]);
  const placeOk = Math.abs(pl - Math.log10(10e-6)) <= 0.25;
  const setE = f => setEx(s => ({ ...s, ...f }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'onde', titre: 'Une onde et ses deux grandeurs',
      texte: <>Les ondes radio, la lumière visible, les rayons X… sont toutes des <strong>ondes électromagnétiques</strong>. Elles se propagent même dans le <strong>vide</strong>, à la même célérité c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹ (dans l’air, c est la même à 0,03 % près). Une onde périodique a une <strong>fréquence</strong> ν (nombre de périodes par seconde, en hertz) et une <strong>longueur d’onde</strong> λ (distance parcourue par l’onde pendant une période, en mètres).</>,
      tache: { type: 'qcm', ...QCM.onde } },
    { id: 'echelle', titre: 'Lire une échelle logarithmique',
      retenirTitre: 'Longueur d’onde et fréquence',
      retenir: <>
        <SvgLambdaNu/>
        {FLambda}
        <ul style={liste}>
          <li>Dans le vide : λ = c ÷ ν, avec c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹ ; λ en mètres, ν en hertz.</li>
          <li>Exemple : ν = 1,0{NB}GHz donne λ = 0,30{NB}m.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « l’une monte, l’autre descend ».</li>
          <li><strong>Idée fausse</strong> : « plus la fréquence est grande, plus la longueur d’onde est grande ». <strong>Vrai</strong> : λ et ν varient en sens contraire.</li>
        </ul></>,
      texte: <>Les longueurs d’onde des ondes électromagnétiques vont de plus de 1{NB}km à moins de 1{NB}pm : l’écart est énorme. On les représente sur une <strong>échelle logarithmique</strong> : entre deux traits successifs, la valeur est <strong>multipliée par 10</strong> (ou divisée par 10 dans l’autre sens). Ici, de « 1{NB}mm » à « 1{NB}µm », il y a trois pas, donc un facteur 1 000. Les longueurs d’onde diminuent vers la droite.</>,
      tache: { type: 'action', ok: placeOk, consigne: 'Place le repère orange sur λ = 10 µm.' } },
    { id: 'domLambda', titre: 'Où se place cette longueur d’onde ?',
      retenirTitre: 'Lire une échelle logarithmique',
      retenir: <>
        <SvgLog/>
        {FLogCarte}
        <ul style={liste}>
          <li>Sur une échelle logarithmique, les pas réguliers sont des <strong>multiplications</strong>, pas des additions.</li>
          <li>Exemple : de 1{NB}mm à 1{NB}µm, trois traits : 1 mm → 100 µm → 10 µm → 1 µm (÷ 10 à chaque trait).</li>
          <li><strong>Moyen de s’en souvenir</strong> : « on compte les facteurs 10, pas les unités ».</li>
          <li><strong>Idée fausse</strong> : « le milieu de l’axe, entre 1 mm et 1 µm, vaut 0,5 mm ». <strong>Vrai</strong> : il vaut environ 30 µm.</li>
        </ul></>,
      texte: <>Chaque domaine du spectre correspond à une plage de longueurs d’onde. Les <strong>bornes</strong> du tableau sont des <strong>repères conventionnels</strong> : elles varient un peu selon les sources, et un domaine ne s’arrête pas net à sa borne. Le repère orange est placé sur la longueur d’onde de l’onde étudiée.</>,
      tache: { type: 'qcm', ...QCM.domLambda } },
    { id: 'domNu', titre: 'Repérer avec la fréquence',
      texte: <>L’axe du haut donne les <strong>fréquences</strong> : 1{NB}MHz = 10⁶{NB}Hz, 1{NB}GHz = 10⁹{NB}Hz, 1{NB}THz = 10¹²{NB}Hz. La fréquence augmente vers la droite, alors que la longueur d’onde diminue. Le tableau donne maintenant aussi les bornes en fréquence.</>,
      tache: { type: 'qcm', ...QCM.domNu } },
    { id: 'appli', titre: 'Des ondes autour de nous',
      texte: <>Voici des ordres de grandeur d’ondes électromagnétiques utilisées dans la vie courante ou en médecine. Les valeurs sont approchées : elles varient d’un appareil à l’autre.</>,
      tache: { type: 'qcm', ...QCM.appli } },
    { id: 'conv', titre: 'Changer d’unité',
      retenirTitre: 'Les sept domaines du spectre',
      retenir: <>
        <SvgDomaines/>
        <div style={{ textAlign: 'center', fontSize: 13.5, margin: '6px 0 0' }}><strong>radio · micro-ondes · infrarouge · visible · ultraviolet · X · gamma</strong></div>
        <ul style={liste}>
          <li>Du plus grand λ (haut) au plus petit (bas) ; les bornes sont des repères conventionnels.</li>
          <li>Exemple : le wifi (2,4{NB}GHz) est dans les micro-ondes.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « infra = en dessous du rouge, ultra = au-delà du violet ».</li>
          <li><strong>Idée fausse</strong> : « les rayons X ont de grandes longueurs d’onde ». <strong>Vrai</strong> : leur λ est très petite (moins de 10{NB}nm).</li>
        </ul></>,
      texte: <>Un pointeur laser vert émet une lumière de longueur d’onde λ = 532{NB}nm. Les formules du cours demandent des grandeurs en unités du Système international : la longueur d’onde doit être en mètres (1{NB}nm = 10⁻⁹{NB}m).</>,
      tache: { type: 'num', q: 'Longueur d’onde λ du laser, en mètres', unite: 'm', vrai: 5.32e-7, tol: 0.01, cs: 3, affiche: v => M.sci(v), carnet: 'Longueur d’onde du laser',
        aide: 'Écris la réponse en notation scientifique, par exemple 4,5e-8 ou 4,5×10⁻⁸.',
        calcul: () => ['1 nm = 10⁻⁹ m.', 'λ = 532 × 10⁻⁹ m = 5,32 × 10⁻⁷ m.'],
        pieges: [[5.32e-6, 'Vous avez converti avec 10⁻⁶ (micromètres) : 1 nm vaut un milliardième de mètre, soit 10⁻⁹ m.'], [532, 'La valeur est encore en nanomètres : convertissez-la en mètres.'], [5.32e11, 'Vous avez multiplié par 10⁹ : un nanomètre est plus petit qu’un mètre, il faut multiplier par 10⁻⁹.'], [5.32e-4, 'Vous avez converti avec 10⁻³ (millimètres) : 1 nm = 10⁻⁹ m.']],
        indice: 'Un nanomètre est un milliardième de mètre : 1 nm = 10⁻⁹ m. Multiplie 532 par 10⁻⁹.',
        expl: 'λ = 532 × 10⁻⁹ m = 5,32 × 10⁻⁷ m.' } },
    { id: 'nu', titre: 'Calculer une fréquence',
      texte: <>Le laser émet dans le vide une lumière de longueur d’onde λ = 5,32{NB}×{NB}10⁻⁷{NB}m (étape précédente). On donne c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹. Calcule la fréquence ν de cette lumière.</>,
      tache: { type: 'num', q: 'Fréquence ν de la lumière du laser, en hertz', unite: 'Hz', vrai: M.nuDeLambda(5.32e-7), tol: 0.01, cs: 3, affiche: v => M.sci(v), carnet: 'Fréquence du laser',
        aide: 'Écris la réponse en notation scientifique, par exemple 4,5e9.',
        calcul: () => ['Dans le vide : ν = frac(c|λ).', 'ν = frac(3,00 × 10⁸ m·s⁻¹|5,32 × 10⁻⁷ m) ≈ 5,64 × 10¹⁴ Hz.'],
        pieges: [[1.77e-15, 'Vous avez calculé λ ÷ c : la fréquence est c ÷ λ.'], [160, 'Vous avez multiplié c par λ : la fréquence est c ÷ λ.'], [5.64e5, 'La longueur d’onde n’a pas été convertie en mètres (532 nm = 5,32 × 10⁻⁷ m).'], [5.64e-4, 'Vous avez converti la longueur d’onde dans le mauvais sens (× 10⁹ au lieu de × 10⁻⁹).']],
        indice: 'ν = c ÷ λ, avec c = 3,00 × 10⁸ m·s⁻¹ et λ en mètres.',
        expl: 'ν = c ÷ λ = 3,00 × 10⁸ ÷ 5,32 × 10⁻⁷ ≈ 5,64 × 10¹⁴ Hz, soit environ 564 THz.' } },
    { id: 'lambdaWifi', titre: 'Calculer une longueur d’onde',
      texte: <>Une borne wifi récente émet à la fréquence ν = 6,0{NB}GHz (1{NB}GHz = 10⁹{NB}Hz). Calcule sa longueur d’onde dans le vide, en <strong>centimètres</strong> (1{NB}cm = 10⁻²{NB}m).</>,
      tache: { type: 'num', q: 'Longueur d’onde λ du wifi, en centimètres', unite: 'cm', vrai: 5.0, tol: 0.03, affiche: v => M.dec(v, 2), carnet: 'Longueur d’onde du wifi',
        calcul: () => ['ν = 6,0 GHz = 6,0 × 10⁹ Hz.', 'λ = frac(c|ν) = frac(3,00 × 10⁸|6,0 × 10⁹) = 0,050 m = 5,0 cm.'],
        pieges: [[5.0e7, 'La fréquence n’a pas été convertie en hertz : 6,0 GHz = 6,0 × 10⁹ Hz.'], [5.0e9, 'La fréquence n’a pas été convertie en hertz (et le résultat est en cm).'], [0.05, 'Valeur juste mais en mètres : la réponse est demandée en centimètres (1 m = 100 cm).'], [20, 'Vous avez calculé ν ÷ c : la longueur d’onde est c ÷ ν.']],
        indice: 'Convertis d’abord ν en hertz (1 GHz = 10⁹ Hz), puis λ = c ÷ ν en mètres, puis convertis en centimètres.',
        expl: 'λ = c ÷ ν = 3,00 × 10⁸ ÷ 6,0 × 10⁹ = 0,050 m = 5,0 cm : c’est une micro-onde.' } },
    { id: 'photon', titre: 'Deux façons de décrire la lumière',
      retenirTitre: 'Calculer λ et ν',
      retenir: <>
        <SvgPrefixes/>
        {FLamNu}
        <ul style={liste}>
          <li>Convertir AVANT de calculer : λ en mètres, ν en hertz.</li>
          <li>Exemple : ν = 2,0{NB}GHz = 2,0{NB}×{NB}10⁹{NB}Hz donne λ = 0,15{NB}m.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « nano = milliardième (× 10⁻⁹) ; giga = milliard (× 10⁹) ».</li>
          <li><strong>Idée fausse</strong> : « 5 GHz = 5 × 10⁶ Hz ». <strong>Vrai</strong> : 5 GHz = 5 × 10⁹ Hz.</li>
        </ul></>,
      texte: <>Jusqu’ici, nous avons décrit la lumière du laser comme une <strong>onde</strong> : le modèle ondulatoire, avec λ et ν. Un autre modèle, le <strong>modèle particulaire</strong>, représente la lumière par des <strong>photons</strong>, qui portent chacun une énergie.</>,
      tache: { type: 'qcm', ...QCM.photon } },
    { id: 'eJoule', titre: 'Énergie d’un photon, en joules',
      retenirTitre: 'Deux modèles, une seule lumière',
      retenir: <>
        <SvgModeles/>
        <ul style={liste}>
          <li>L’onde (λ, ν) décrit la propagation ; les photons (énergie E) décrivent les échanges d’énergie.</li>
          <li>Exemple : le même laser vert se décrit par une onde ou par un flux de photons.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « une lumière, deux descriptions qui se complètent ».</li>
          <li><strong>Idée fausse</strong> : « un photon est une petite bille de matière ». <strong>Vrai</strong> : c’est un modèle, un « grain » d’énergie lumineuse.</li>
        </ul></>,
      texte: <>Dans le modèle des photons, un photon de fréquence ν porte l’énergie {FEnLigne}, où h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s est la constante de Planck. On étudie l’énergie d’<strong>un seul</strong> photon du laser, de fréquence ν = 5,64{NB}×{NB}10¹⁴{NB}Hz (étape 7). <strong>Hypothèse</strong> : cette relation vaut pour un rayonnement de <strong>fréquence unique</strong> ; une lumière réelle (lampe, Soleil) mélange beaucoup de fréquences.</>,
      tache: { type: 'num', q: 'Énergie E d’un photon du laser, en joules', unite: 'J', vrai: M.H * 5.64e14, tol: 0.02, cs: 3, affiche: v => M.sci(v), carnet: 'Énergie d’un photon du laser',
        aide: 'Écris la réponse en notation scientifique, par exemple 4,5e-8.',
        calcul: () => ['E = h × ν = 6,63 × 10⁻³⁴ J·s × 5,64 × 10¹⁴ Hz.', 'E ≈ 3,74 × 10⁻¹⁹ J : l’énergie d’un seul photon est minuscule.'],
        pieges: [[8.51e47, 'Vous avez divisé ν par h : l’énergie est le produit h × ν.'], [1.18e-48, 'Vous avez divisé h par ν : l’énergie est le produit h × ν.'], [3.74e-33, 'La puissance de 10 de ν a été oubliée : ν = 5,64 × 10¹⁴ Hz.'], [3.74e-47, 'L’exposant de ν est +14, pas −14 : ν = 5,64 × 10¹⁴ Hz.']],
        indice: 'E = h × ν, avec h = 6,63 × 10⁻³⁴ J·s et ν = 5,64 × 10¹⁴ Hz. Multiplie les nombres, additionne les exposants.',
        expl: 'E = h × ν = 6,63 × 10⁻³⁴ × 5,64 × 10¹⁴ ≈ 3,74 × 10⁻¹⁹ J (un photon unique, de fréquence bien définie).' } },
    { id: 'eEv', titre: 'Énergie d’un photon, en électronvolts',
      texte: <>Le joule est une unité très grande pour un seul photon. On utilise l’<strong>électronvolt</strong> (eV) : 1{NB}eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J. Le photon du laser a une énergie E = 3,74{NB}×{NB}10⁻¹⁹{NB}J (étape précédente). Exprime-la en électronvolts.</>,
      tache: { type: 'num', q: 'Énergie E du photon du laser, en électronvolts', unite: 'eV', vrai: 3.74e-19 / M.EV, tol: 0.02, cs: 3, affiche: v => M.dec(v, 3), carnet: 'Énergie du photon du laser (eV)',
        calcul: () => ['1 eV = 1,60 × 10⁻¹⁹ J, donc E(eV) = frac(E(J)|1,60 × 10⁻¹⁹).', 'E = frac(3,74 × 10⁻¹⁹|1,60 × 10⁻¹⁹) ≈ 2,34 eV.'],
        pieges: [[3.74e-19, 'Vous avez gardé l’énergie en joules : divisez par 1,60 × 10⁻¹⁹ J/eV pour obtenir des eV.'], [5.98e-38, 'Vous avez multiplié au lieu de diviser : un photon vaut quelques eV, pas 10⁻³⁸.'], [0.428, 'Vous avez divisé 1,60 par 3,74 : il faut diviser l’énergie en joules par 1,60 × 10⁻¹⁹.']],
        indice: 'Pour passer des joules aux électronvolts, divise par 1,60 × 10⁻¹⁹ (1 eV = 1,60 × 10⁻¹⁹ J).',
        expl: 'E = 3,74 × 10⁻¹⁹ ÷ 1,60 × 10⁻¹⁹ ≈ 2,34 eV : quelques électronvolts, un ordre de grandeur typique pour un photon visible.' } },
    { id: 'compare', titre: 'Comparer des photons',
      texte: <>On compare trois photons très différents. Le tableau donne leur fréquence et leur longueur d’onde dans le vide.</>,
      tache: { type: 'qcm', ...QCM.compare } },
    { id: 'inverse', titre: 'Remonter à la longueur d’onde',
      retenirTitre: 'L’énergie d’un photon',
      retenir: <>
        <SvgEnergie/>
        {FEnergie}
        <ul style={liste}>
          <li>h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s ; 1{NB}eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J ; E en joules puis ÷ 1,60{NB}×{NB}10⁻¹⁹ pour les eV.</li>
          <li>Exemple : un photon de 1,60{NB}×{NB}10⁻¹⁹{NB}J vaut 1,00{NB}eV.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « ν grande, E grande ; λ grande, E petite ».</li>
          <li><strong>Idée fausse</strong> : « une source plus puissante émet des photons plus énergétiques ». <strong>Vrai</strong> : la puissance change le nombre de photons, pas l’énergie de chacun.</li>
        </ul></>,
      texte: <>Un photon a une énergie E = 3,00{NB}eV. Pour savoir dans quel domaine il se trouve, calcule sa longueur d’onde λ dans le vide, en <strong>nanomètres</strong>, puis regarde dans quel domaine elle se place.</>,
      tache: { type: 'num', q: 'Longueur d’onde λ du photon, en nanomètres', unite: 'nm', vrai: M.lambdaDeEv(3.00) * 1e9, tol: 0.02, cs: 3, affiche: v => M.dec(v, 3), carnet: 'Longueur d’onde du photon de 3,00 eV',
        calcul: () => ['E = 3,00 eV = 3,00 × 1,60 × 10⁻¹⁹ J = 4,80 × 10⁻¹⁹ J.', 'λ = frac(h × c|E) = frac(6,63 × 10⁻³⁴ × 3,00 × 10⁸|4,80 × 10⁻¹⁹) ≈ 4,14 × 10⁻⁷ m = 414 nm : un violet, dans le visible (400 à 780 nm).'],
        pieges: [[4.14e-7, 'Votre résultat est en mètres : la réponse est demandée en nanomètres (1 m = 10⁹ nm).'], [6.63e-17, 'Vous avez utilisé E = 3,00 J : convertissez d’abord les eV en joules (× 1,60 × 10⁻¹⁹).'], [2.41e6, 'Vous avez inversé la relation : λ = h × c ÷ E.']],
        indice: 'Convertis E en joules (× 1,60 × 10⁻¹⁹), puis λ = h × c ÷ E en mètres, puis convertis en nanomètres (× 10⁹).',
        expl: 'λ = h × c ÷ E ≈ 414 nm : entre 400 et 780 nm, c’est de la lumière visible (violet).' } },
  ];
  const derniereEtape = etape >= ETAPES.length - 1;

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'energie') setDefi({ type, ...M.tirerEnergie(Math.random, prec && prec.type === 'energie' ? prec.nm : null), rep: '', verifie: false, ok: false });
    else if (type === 'hors') setDefi({ type, ...M.tirerPhotons(Math.random, prec && prec.type === 'hors' ? prec : null), rep: '', verifie: false, ok: false });
    else setDefi({ type: 'domaine', ...M.tirerDomaine(Math.random, prec && prec.type === 'domaine' ? prec.txt : null), choix: '', verifie: false, ok: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifierDefi = () => {
    if (defi.type === 'domaine') { const ok = defi.choix === defi.dom; setDefi(d => ({ ...d, verifie: true, ok })); noterD(ok); return; }
    const x = lireNombre(defi.rep), ok = Number.isFinite(x) && proche(x, defi.vrai, 0.02);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'energie' ? noterE : noterH)(ok);
  };
  const peutVerifier = defi && (defi.type === 'domaine' ? !!defi.choix : String(defi.rep).trim() !== '');
  const etiquette = (t, corps) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{t}{corps}</label>;
  const saisie = (valeur, onChange, unite, label) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, flexWrap: 'wrap' }}>{label}
      <input value={valeur} placeholder="?" aria-label={label} inputMode="decimal" onChange={x => onChange(x.target.value)} onKeyDown={x => { if (x.key === 'Enter' && peutVerifier) verifierDefi(); }}
        style={{ fontSize: 15, padding: '6px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130, minHeight: 36 }}/>
      <span style={{ fontSize: 14, color: KIT.txt2 }}>{unite}</span>
    </label>);
  const titreDefi = t => <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{t}</div>;
  const retourEnergie = () => {
    const x = lireNombre(defi.rep);
    if (!Number.isFinite(x)) return 'Entre une valeur numérique (virgule ou point).';
    if (proche(x, defi.ej, 0.05)) return 'Tu as donné l’énergie en joules : divise par 1,60 × 10⁻¹⁹ pour l’exprimer en électronvolts.';
    if (proche(x, defi.vrai * 1e-9, 0.05) || proche(x, defi.vrai * 1e9, 0.05)) return 'Vérifie la conversion des nanomètres en mètres (1 nm = 10⁻⁹ m).';
    return 'Reprends : E = h × c ÷ λ, avec λ en mètres, puis convertis en eV.';
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['domaine', 'Quel domaine ?'], ['energie', 'Énergie en eV'], ['hors', 'Au-delà du programme']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'domaine' && <>
        {titreDefi('Défi : dans quel domaine ?')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Une onde électromagnétique dans le vide a pour caractéristique <strong>{defi.txt}</strong>. Dans quel domaine du spectre se trouve-t-elle ?</div>
        <SceneSpectre domaines={false} marqueur={Math.log10(defi.lam)} zoom={false} label="Échelle des longueurs d’onde et des fréquences, sans le nom des domaines ; le repère orange marque l’onde étudiée."/>
        <div style={{ marginTop: 8 }}>{etiquette('Domaine', <select value={defi.choix} onChange={x => setDefi(d => ({ ...d, choix: x.target.value, verifie: false }))} style={sel} aria-label="Domaine"><option value="">Choisis…</option>{M.DOMAINES.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}</select>)}</div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Convertis en mètres (ou en hertz) si besoin, puis compare aux bornes : radio λ &gt; 30 cm ; micro-ondes 1 mm à 30 cm ; infrarouge 780 nm à 1 mm ; visible 400 à 780 nm ; ultraviolet 10 à 400 nm ; rayons X 10 pm à 10 nm ; gamma &lt; 10 pm. Pour une fréquence : λ = c ÷ ν.</IndiceDefi>
      </>}
      {defi.type === 'energie' && <>
        {titreDefi('Défi : énergie d’un photon')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un photon a pour longueur d’onde λ = <strong>{defi.nm}{NB}nm</strong> (dans le vide). Calcule son énergie en <strong>électronvolts</strong>, avec 3 chiffres significatifs. Données : c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹ ; h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s ; 1{NB}eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J.</div>
        <div style={{ marginBottom: 8 }}>{saisie(defi.rep, v => setDefi(d => ({ ...d, rep: v, verifie: false })), 'eV', 'Énergie du photon')}</div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}><FormuleEnLigne><mi>E</mi><mo>=</mo><mfrac><mrow><mi>h</mi><mo>·</mo><mi>c</mi></mrow><mi>λ</mi></mfrac></FormuleEnLigne> avec λ en mètres (1 nm = 10⁻⁹ m) : le résultat est en joules. Divise-le par 1,60 × 10⁻¹⁹ pour obtenir des eV.</IndiceDefi>
      </>}
      {defi.type === 'hors' && <>
        {titreDefi('Défi au-delà du programme : photons par seconde')}
        <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '5px 8px', marginBottom: 8, lineHeight: 1.5 }}><strong>Au-delà du programme de première</strong> : on relie la puissance d’une source au nombre de photons émis chaque seconde (flux de photons).</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un pointeur laser de puissance P = <strong>{M.dec(defi.mw, 2)}{NB}mW</strong> émet une lumière de longueur d’onde <strong>{defi.nm}{NB}nm</strong>. La puissance est l’énergie émise par seconde. Combien de photons le laser émet-il chaque seconde ? Donne le résultat avec 3 chiffres significatifs, en notation scientifique (par exemple 4,5e9).</div>
        <div style={{ marginBottom: 8 }}>{saisie(defi.rep, v => setDefi(d => ({ ...d, rep: v, verifie: false })), 'photons par seconde', 'Nombre de photons par seconde')}</div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Calcule l’énergie E d’un photon en joules (E = h × c ÷ λ, λ en mètres). La puissance P (en watts, 1 mW = 10⁻³ W) est l’énergie émise par seconde : le nombre de photons par seconde vaut P ÷ E.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ph-verif" onClick={verifierDefi} disabled={!peutVerifier} style={{ ...styleBouton(true, '#15803d'), opacity: peutVerifier ? 1 : 0.5 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouvelle question</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
        {defi.type === 'domaine' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : {M.domaine(defi.dom).nom}. <span style={{ fontWeight: 400, color: KIT.txt }}>λ ≈ {M.lambdaTexte(defi.lam, 2)}, ν ≈ {M.nuTexte(M.nuDeLambda(defi.lam), 2)} : {M.domaine(defi.dom).borne}.</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>Compare λ aux bornes (ou calcule λ = c ÷ ν si on te donne la fréquence), en pensant aux conversions d’unités.</span></div>)}
        {defi.type === 'energie' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : E ≈ {M.dec(defi.vrai, 3)} eV. <span style={{ fontWeight: 400, color: KIT.txt }}>E = h × c ÷ λ ≈ {M.sci(defi.ej)} J, soit {M.dec(defi.vrai, 3)} eV (domaine : {M.domaineDeLambda(defi.lam).nom}).</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>{retourEnergie()}</span></div>)}
        {defi.type === 'hors' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : environ {M.sci(defi.vrai)} photons par seconde. <span style={{ fontWeight: 400, color: KIT.txt }}>E = {M.sci(defi.ej)} J par photon ; N = P ÷ E.</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>Vérifie l’énergie d’un photon en joules (λ en mètres), puis la puissance en watts, et divise la puissance par l’énergie.</span></div>)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Propagation dans le vide</strong> : c = 3,00 × 10⁸ m·s⁻¹. Dans l’air, c est la même à 0,03 % près ; dans le verre ou l’eau, la célérité est plus petite et λ change, mais pas ν.</li>
      <li><strong>Bornes des domaines</strong> : ce sont des repères conventionnels. Elles varient d’une source à l’autre (certains manuels regroupent radio et micro-ondes sous « ondes radio » pour λ &gt; 1 mm) et un domaine ne s’arrête pas net. Entre rayons X et rayons gamma, la frontière dépend surtout de l’origine du rayonnement (électrons pour les X, noyau pour les gamma) : les deux domaines se recouvrent en partie. Le visible est pris de 400 à 780 nm ; le programme dit « 400 à 800 nm environ ».</li>
      <li><strong>Le photon est un modèle</strong> : un « grain » d’énergie lumineuse, pas une petite bille de matière. Les modèles d’onde et de photons se complètent.</li>
      <li><strong>Énergie d’un photon unique</strong> : on suppose un rayonnement de fréquence unique (monochromatique). Une lumière réelle (lampe, Soleil) mélange beaucoup de fréquences.</li>
      <li><strong>Constantes arrondies</strong> : c = 3,00 × 10⁸ m·s⁻¹, h = 6,63 × 10⁻³⁴ J·s, 1 eV = 1,60 × 10⁻¹⁹ J. Les résultats sont donnés avec 3 chiffres significatifs.</li>
      <li><strong>Échelle logarithmique</strong> : les graduations sont régulières en puissances de 10. Les couleurs du visible sont une illustration, elles varient d’un écran à l’autre.</li>
      <li><strong>Au-delà du programme</strong> (dernier défi) : le nombre de photons émis par seconde (flux de photons). Les niveaux d’énergie des atomes, l’absorption, l’émission et les spectres de raies ne sont pas traités ici.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const lgLaser = Math.log10(532e-9);
  const sceneGuide = (() => {
    if (!idE) return null;
    if (idE === 'onde') return boite('Une onde qui se propage', <><SceneOnde/>{aide('Schéma simplifié : une onde sinusoïdale, vue à un instant donné.')}</>);
    if (idE === 'echelle') return boite('Un repère sur une échelle logarithmique', <>
      <SceneSpectre domaines={false} nu={false} zoom={false} marqueur={pl} label="Axe des longueurs d’onde en échelle logarithmique, de 1 kilomètre à 1 picomètre ; le repère orange est à placer."/>
      <Repere valeur={pl} onChange={setPl} titre="Position du repère (valeur de λ à lire sur l’axe)" aideTexte={placeOk ? '✓ Le repère est bien sur 10 µm : un seul trait à gauche de 1 µm.' : 'Les traits fins sont tous espacés d’un facteur 10. Déplace le repère avec le curseur ou les flèches du clavier.'}/></>);
    if (idE === 'domLambda') return boite('Le spectre et ses domaines', <>
      <SceneSpectre nu={false} marqueur={Math.log10(2.5e-6)} label="Spectre électromagnétique en échelle logarithmique avec les sept domaines ; le repère orange est sur la longueur d’onde étudiée."/><TableauBornes avecNu={false}/></>);
    if (idE === 'domNu') return boite('Fréquences et longueurs d’onde', <>
      <SceneSpectre marqueur={Math.log10(M.lambdaDeNu(1.0e10))} label="Spectre électromagnétique avec l’axe des fréquences en haut et celui des longueurs d’onde en bas ; le repère orange est sur la fréquence étudiée."/><TableauBornes avecNu/></>);
    if (idE === 'appli') return boite('Quelques applications', <><SceneSpectre marqueur={null} zoom={false} label="Spectre électromagnétique avec les sept domaines."/><TableauApplications/></>);
    if (idE === 'conv') return boite('Un pointeur laser vert', <><SceneSpectre marqueur={lgLaser} label="Spectre électromagnétique ; le repère orange est sur la lumière du pointeur laser vert, au milieu du visible."/></>);
    if (idE === 'nu') return boite('De la longueur d’onde à la fréquence', <><SceneChaine ordre={['lam', 'nu']} vals={{ lam: '5,32 × 10⁻⁷ m', nu: reussie ? '5,64 × 10¹⁴ Hz' : null }} label="Chaîne de calcul : la longueur d’onde est connue, la fréquence est à calculer."/></>);
    if (idE === 'lambdaWifi') return boite('De la fréquence à la longueur d’onde', <><SceneChaine ordre={['nu', 'lam']} vals={{ nu: '6,0 GHz', lam: reussie ? '5,0 cm' : null }} label="Chaîne de calcul : la fréquence du wifi est connue, la longueur d’onde est à calculer."/></>);
    if (idE === 'photon') return boite('Un faisceau de lumière', <><SceneLaser/>{aide('Schéma simplifié, pas à l’échelle.')}</>);
    if (idE === 'eJoule') return boite('De la fréquence à l’énergie', <><SceneChaine ordre={['lam', 'nu', 'ej']} vals={{ lam: '5,32 × 10⁻⁷ m', nu: '5,64 × 10¹⁴ Hz', ej: reussie ? '3,74 × 10⁻¹⁹ J' : null }} label="Chaîne de calcul : de la longueur d’onde à la fréquence, puis à l’énergie d’un photon, à calculer."/></>);
    if (idE === 'eEv') return boite('Des joules aux électronvolts', <><SceneChaine ordre={['lam', 'nu', 'ej', 'eev']} vals={{ lam: '5,32 × 10⁻⁷ m', nu: '5,64 × 10¹⁴ Hz', ej: '3,74 × 10⁻¹⁹ J', eev: reussie ? '2,34 eV' : null }} label="Chaîne de calcul : l’énergie du photon est connue en joules, elle est à convertir en électronvolts."/></>);
    if (idE === 'compare') return boite('Trois photons', <><TableauPhotons/>{aide('Valeurs approchées, dans le vide. Les trois photons n’ont pas la même fréquence.')}</>);
    if (idE === 'inverse') return boite('De l’énergie à la longueur d’onde', <><SceneChaine ordre={['eev', 'ej', 'lam']} vals={{ eev: '3,00 eV', ej: null, lam: reussie ? '414 nm' : null }} label="Chaîne de calcul : l’énergie du photon est connue en électronvolts, la longueur d’onde est à calculer."/></>);
    return null;
  })();

  // ════════════════ EXPLORATION ════════════════
  const lamX = 10 ** ex.lg, nuX = M.nuDeLambda(lamX), ejX = M.energieDeLambda(lamX), eevX = M.jVersEv(ejX), domX = M.domaineDeLambda(lamX);
  const couleurX = M.couleurVisible(lamX * 1e9);
  const procheX = M.APPLICATIONS.find(a => Math.abs(Math.log10(a.lam) - ex.lg) < 0.12);
  const exemples = M.APPLICATIONS;
  const sciE = x => M.sci(x).replace(/\s×\s10⁰$/, '');   // pas de « × 10⁰ »
  const lamMesure = `${M.lambdaTexte(lamX)} = ${sciE(lamX)}${NB}m`, nuMesure = `${M.nuTexte(nuX)} = ${sciE(nuX)}${NB}Hz`;
  const exReglages = (<>
    <Repere valeur={ex.lg} onChange={v => setE({ lg: v })} titre="Longueur d’onde λ (échelle logarithmique)" texteValeur={M.lambdaTexte(lamX)} aideTexte="Déplace le repère : λ, ν, l’énergie du photon et le domaine se mettent à jour."/>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      <button onClick={() => setE({ lg: M.clampLog(ex.lg - 1) })} style={{ ...stylePetitBouton(false, '#334155'), minHeight: 42 }}>λ ÷ 10</button>
      <button onClick={() => setE({ lg: M.clampLog(ex.lg + 1) })} style={{ ...stylePetitBouton(false, '#334155'), minHeight: 42 }}>λ × 10</button>
    </div>
    <div style={{ marginTop: 10 }}>{etiquette('Aller à un exemple', <select value="" onChange={x => { const a = exemples.find(e => e.id === x.target.value); if (a) setE({ lg: Math.log10(a.lam) }); }} style={sel} aria-label="Aller à un exemple"><option value="">Choisis un exemple…</option>{exemples.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}</select>)}</div>
    {aide('Chaque exemple place le repère sur un ordre de grandeur usuel (valeurs approchées).')}
  </>);
  const ligne = (nom, valeur, c) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: `1px dashed ${KIT.bord}`, fontSize: 14, flexWrap: 'wrap' }}>
      <span style={{ color: c || KIT.txt2, fontWeight: 700 }}>{nom}</span><span style={{ color: KIT.txt, fontWeight: 700, textAlign: 'right' }}>{valeur}</span>
    </div>);
  const exMesures = (<div data-mesures="1">
    {ligne('Longueur d’onde λ', lamMesure, COL.lam)}
    {ligne('Fréquence ν', nuMesure, COL.nu)}
    {ligne('Énergie d’un photon (J)', `${M.sci(ejX)}${NB}J`, COL.ener)}
    {ligne('Énergie d’un photon (eV)', M.evTexte(eevX), COL.ener)}
    {ligne('Domaine', `${domX.nom}${couleurX ? ` (${couleurX})` : ''}`)}
    <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Exemples du domaine : {domX.exemple}.{procheX ? ` Proche de : ${procheX.texte}.` : ''}</div>
    {aide('Valeurs dans le vide, avec 3 chiffres significatifs. Les bornes des domaines sont des repères conventionnels.')}
  </div>);
  const exScene = (<>
    <SceneSpectre marqueur={ex.lg} label={`Spectre électromagnétique en échelle logarithmique ; le repère orange est sur λ = ${M.lambdaTexte(lamX)}, domaine : ${domX.nom}.`}/>
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Place le repère sur le wifi, puis sur le laser vert, puis sur la radiographie : comment varient λ, ν et l’énergie d’un photon quand tu vas vers la droite ?</li>
      <li>Avec « λ ÷ 10 », que devient l’énergie d’un photon ? Et la fréquence ?</li>
      <li>Cherche la longueur d’onde pour laquelle l’énergie d’un photon vaut environ 1 eV : dans quel domaine est-elle ?</li>
      <li>Regarde le zoom : quelle fraction de l’échelle occupe la lumière visible ? Qu’en penses-tu ?</li>
      <li>Au-delà du programme : compare l’énergie d’un photon de radio FM à celle d’un photon X : quel est le rapport ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir titre="Les sept domaines du spectre">
      <SvgDomaines/>
      <ul style={liste}>
        <li><strong>Moyen de s’en souvenir</strong> : « infra = en dessous du rouge, ultra = au-delà du violet ».</li>
        <li>Plus ν est grande, plus λ est petite et plus l’énergie E = h·ν d’un photon est grande.</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div className="ph-racine" style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        /* vrai « ν » grec : dans la police du site, il ressemble à un v latin ; seule la lettre ν (U+03BD) est prise dans une police à empattements */
        @font-face { font-family: 'NuGrec'; src: local('Times New Roman'), local('Liberation Serif'), local('Times'), local('Georgia'); unicode-range: U+03BD; }
        .ph-racine { font-family: 'NuGrec', var(--sans), system-ui, sans-serif; }
        .ph-racine button, .ph-racine select, .ph-racine input { font-family: inherit; }
        .ph-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ph-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .ph-hypo-defi { order: 2; } }
        .ph-l1.cote .ph-carte { order: 2; } .ph-l1.cote .ph-main { order: 1; }
        @media (min-width: 901px) { .ph-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
          .ph-ex { grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr); } .ph-ex > .ph-ex-scene { grid-column: 1; grid-row: 1; } .ph-ex > .ph-ex-mesures { grid-column: 1; grid-row: 2; } .ph-ex > .ph-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } }
        @media (prefers-reduced-motion: no-preference) { .ph-in { animation: ph-fondu 0.35s ease-out; } @keyframes ph-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Lumière : domaines spectraux et énergie d’un photon</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {!enGuide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Les ondes électromagnétiques, des ondes radio aux rayons gamma, se classent par <strong>longueur d’onde</strong> λ (ou fréquence ν), avec λ = c ÷ ν. Dans le modèle des <strong>photons</strong>, chaque photon porte l’énergie E = h·ν.</div>}
      {enExplore ? <>
        <div className="ph-ex">
          <div className="ph-ex-scene">{boite('Le spectre électromagnétique', exScene)}</div>
          <div className="ph-ex-reglages">{boite('Choisir une onde', exReglages)}</div>
          <div className="ph-ex-mesures">{boite('Mesures', exMesures)}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`ph-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="ph-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ph-carte ph-hypo-defi">{panneauHypo}</div> : null}
          <div className="ph-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'domaine' ? suiviD : defi.type === 'energie' ? suiviE : suiviH}/></div>}
            {enGuide && <div className="ph-in" key={idE}>{sceneGuide}</div>}
            {enGuide && (derniereEtape || guide.fini) && <div style={{ marginTop: 12 }}>{panneauHypo}</div>}
          </div>
        </div>
      </>}
    </div>
  );
}
