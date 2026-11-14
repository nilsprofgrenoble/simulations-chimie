import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useId } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { nbf, tire, Schema, T as Tx, puces, ROUGE, VERT, BLEU, ORANGE, GRIS } from "./Travail";
import * as E from "./extractionModele";

const SIM_ID = 112;
declarerDefis(SIM_ID, [['densite', 'Calculer la densité d’un solvant']]);

// ---------- ampoule à décanter (poire, bouchon, robinet, bécher) ----------
const CONTOUR = "M142,40 L142,62 C142,62 70,95 70,160 C70,215 120,238 143,246 L143,284 L157,284 L157,246 C180,238 230,215 230,160 C230,95 158,62 158,62 L158,40 Z";
const C_EAU = '#bfdbfe', C_ORG = '#fefce8', C_I2_EAU = '#c2823a', C_I2_ORG = '#8b5cf6';
const Y_HAUT = 104, Y_INT = 176, Y_BAS = 284;
function Ampoule({ solvant, soluteCle, etat = 'avant', drain = 0, bouchon = true, ouvert = false, titre }) {
  const id = useId().replace(/:/g, ''), bi = E.biphasique(solvant), so = soluteCle ? E.SOLUTES[soluteCle] : null;
  const haut = bi ? E.phaseSuperieure(solvant) : null, bas = bi ? E.phaseInferieure(solvant) : null;
  const lieu = so ? E.oùSoluté(soluteCle, solvant) : null, apres = etat !== 'avant', diiode = so && soluteCle === 'diiode';
  const col = nom => {
    const base = nom === 'eau' ? C_EAU : C_ORG;
    if (!diiode) return base;
    if (!apres) return nom === 'eau' ? C_I2_EAU : base;
    if (!bi) return C_I2_EAU;
    return nom === 'eau' ? (lieu === 'eau' ? C_I2_EAU : C_EAU) : (lieu === 'organique' ? C_I2_ORG : base);
  };
  const top = Y_HAUT + drain * (Y_BAS - Y_INT), inter = Math.min(Y_BAS, Y_INT + drain * (Y_BAS - Y_INT));
  const flux = ouvert && drain < 1.15 && bouchon === false;
  const niveau = 350 - 38 * Math.min(drain, 1) - 10 * Math.max(0, drain - 1) / 0.15;
  const gouttes = [[110, 130, 5], [190, 125, 4], [130, 190, 6], [175, 200, 5], [150, 150, 4], [100, 170, 4], [200, 170, 6], [160, 120, 3]];
  const labY = (a, b) => Math.max(a + 8, Math.min(b - 6, (a + b) / 2 + 4));
  return (
    <svg viewBox="0 0 400 365" style={{ width: '100%', maxWidth: 440, display: 'block', background: '#fff', borderRadius: 8 }} role="img"
      aria-label={`${titre || 'Ampoule à décanter'} sur son support : ${bi ? `deux phases non miscibles, ${E.SOLVANTS[haut].nom} au-dessus et ${E.SOLVANTS[bas].nom} en dessous` : 'une seule phase, les liquides sont miscibles'}${apres && so ? `, ${so.nom} ${lieu === 'organique' ? 'dans la phase organique' : lieu === 'eau' ? 'dans l’eau' : 'dans le mélange'}` : ''}${bouchon ? '' : ', bouchon retiré'}${ouvert ? ', robinet ouvert' : ''}`}>
      <style>{`@keyframes ampSecoue{from{transform:rotate(-11deg) translateX(-5px)}to{transform:rotate(11deg) translateX(5px)}}.amp-secoue{transform-origin:150px 170px;animation:ampSecoue .28s ease-in-out infinite alternate}@media (prefers-reduced-motion: reduce){.amp-secoue{animation:none}}`}</style>
      <clipPath id={`c${id}`}><path d={CONTOUR}/></clipPath>
      {/* support */}
      <line x1="34" y1="20" x2="34" y2="358" stroke="#94a3b8" strokeWidth="5"/><line x1="8" y1="358" x2="96" y2="358" stroke="#94a3b8" strokeWidth="5"/>
      <line x1="34" y1="68" x2="132" y2="68" stroke="#94a3b8" strokeWidth="4"/><ellipse cx="150" cy="68" rx="20" ry="5.5" fill="none" stroke="#94a3b8" strokeWidth="4"/>
      <g className={etat === 'agite' ? 'amp-secoue' : undefined}>
        <g clipPath={`url(#c${id})`}>
          {!bi ? <rect x="60" y={top} width="180" height={Y_BAS - top} fill={col('eau')}/>
            : etat === 'agite' ? <>
              <rect x="60" y={Y_HAUT} width="180" height={Y_BAS - Y_HAUT} fill={col(haut)}/><rect x="60" y={Y_HAUT} width="180" height={Y_BAS - Y_HAUT} fill={col(bas)} opacity="0.55"/>
              {gouttes.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? col(bas) : col(haut)} stroke="#fff" strokeOpacity="0.6"/>)}
              <rect x="60" y={Y_HAUT} width="180" height={Y_BAS - Y_HAUT} fill="#fff" opacity="0.22"/></>
            : <><rect x="60" y={top} width="180" height={Math.max(0, inter - top)} fill={col(haut)}/><rect x="60" y={inter} width="180" height={Math.max(0, Y_BAS - inter)} fill={col(bas)}/>
              <line x1="60" y1={inter} x2="240" y2={inter} stroke="#64748b" strokeDasharray="4 3" opacity={inter < Y_BAS ? 1 : 0}/></>}
        </g>
        <path d={CONTOUR} fill="none" stroke="#475569" strokeWidth="3"/>
        {bouchon ? <path d="M138,40 L162,40 L158,18 L142,18 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2"/>
          : <path d="M250,40 L274,40 L270,18 L254,18 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" transform="rotate(28 262 30)"/>}
        <rect x="140" y="262" width="20" height="14" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="2"/>
        {ouvert ? <line x1="160" y1="269" x2="176" y2="288" stroke="#475569" strokeWidth="6" strokeLinecap="round"/> : <line x1="160" y1="269" x2="188" y2="269" stroke="#475569" strokeWidth="6" strokeLinecap="round"/>}
      </g>
      {flux && <line x1="150" y1="285" x2="150" y2={niveau} stroke={drain <= 1 ? (bas ? col(bas) : C_EAU) : col(haut)} strokeWidth="3.5" strokeDasharray="5 3"/>}
      {/* bécher */}
      <path d="M104,300 L108,352 L192,352 L196,300" fill="none" stroke="#475569" strokeWidth="2.5"/>
      {drain > 0 && <path d={`M${106 + (niveau - 300) * -0.0},${niveau} L${108 - 0},352 L192,352 L${194},${niveau} Z`} fill={bi ? col(bas) : C_EAU} opacity="0.9"/>}
      {drain > 1 && <rect x="109" y={niveau} width="82" height={Math.max(0, 352 - niveau) * 0.25} fill={col(haut)} opacity="0.7"/>}
      <text x="150" y="364" textAnchor="middle" fontSize="11" fill="#64748b">bécher</text>
      {/* étiquettes */}
      {bi && <g fontSize="13"><text x="244" y={labY(top, inter)} fontWeight="700" fill="#0f172a">{E.SOLVANTS[haut].nom}</text><text x="244" y={labY(top, inter) + 14} fontSize="11.5" fill="#64748b">d = {nbf(E.SOLVANTS[haut].d, 2)}</text>
        {inter < Y_BAS - 14 && <><text x="244" y={labY(inter, Y_BAS)} fontWeight="700" fill="#0f172a">{E.SOLVANTS[bas].nom}</text><text x="244" y={labY(inter, Y_BAS) + 14} fontSize="11.5" fill="#64748b">d = {nbf(E.SOLVANTS[bas].d, 2)}</text></>}</g>}
      {!bi && <g fontSize="13"><text x="244" y="170" fontWeight="700" fill="#0f172a">une seule phase</text><text x="244" y="186" fontSize="11.5" fill="#64748b">eau + {E.SOLVANTS[solvant].nom}</text><text x="244" y="200" fontSize="11.5" fill="#64748b">(miscibles)</text></g>}
      <text x="206" y="28" fontSize="11.5" fill="#64748b">bouchon</text><text x="136" y="296" textAnchor="end" fontSize="11.5" fill="#64748b">robinet</text>
      {soluteCle === 'chlorureSodium' && <text x="104" y="230" fontSize="11" fill="#475569">Na⁺ Cl⁻ (incolores)</text>}
    </svg>);
}
// ---------- manipulation : agiter, dégazer, décanter, retirer le bouchon, soutirer ----------
function Manip({ sol, sute }) {
  const init = { bouchon: true, etat: 'avant', pression: false, ouvert: false, drain: 0, msg: 'L’ampoule contient l’eau et le solvant. Commencez : bouchon en place, on agite pour mettre les liquides en contact.', ok: null };
  const [s, setS] = useState(init);
  useEffect(() => { setS(init); }, [sol, sute]);   // eslint-disable-line
  useEffect(() => { if (!s.ouvert) return; const t = setInterval(() => setS(x => ({ ...x, drain: Math.min(1.15, x.drain + 0.012) })), 40); return () => clearInterval(t); }, [s.ouvert]);
  const say = (msg, plus = {}) => setS(x => ({ ...x, msg, ...plus }));
  const bi = E.biphasique(sol), haut = bi && E.phaseSuperieure(sol), bas = bi && E.phaseInferieure(sol), lieu = sute ? E.oùSoluté(sute, sol) : null;
  const agiter = () => !bi ? say('Avec l’éthanol, il n’y a qu’une seule phase : rien à séparer. Choisissez un solvant non miscible.')
    : !s.bouchon ? say('Remettez le bouchon avant d’agiter, sinon le liquide gicle !')
    : s.pression ? say('Surpression ! Dégazez d’abord (robinet vers le haut) avant d’agiter de nouveau.')
    : say('Vous agitez : les deux liquides se divisent en fines gouttes et le soluté passe d’une phase à l’autre. La pression monte dans l’ampoule.', { etat: 'agite', pression: true, ouvert: false });
  const degazer = () => !s.bouchon ? say('Le bouchon est déjà retiré : plus de pression.') : s.etat === 'avant' ? say('Rien à dégazer pour l’instant : agitez d’abord.') : s.pression ? say('Pshhh… vous évacuez les gaz en ouvrant le robinet, ampoule retournée. Fermez-le avant de ré-agiter.', { pression: false }) : say('Il n’y a plus de surpression.');
  const decanter = () => s.etat === 'avant' ? say('Il n’y a rien à décanter : agitez d’abord.') : s.etat === 'decante' ? say('Les phases sont déjà séparées.')
    : say(`On pose l’ampoule sur son support : les phases se séparent, ${lib(bas)} en bas (le plus dense), ${lib(haut)} en haut.${sute ? (lieu === 'organique' ? ` Le ${E.SOLUTES[sute].nom} est maintenant dans la phase organique.` : ` Le ${E.SOLUTES[sute].nom} reste dans l’eau.`) : ''}${s.pression ? ' Pensez à dégazer.' : ''}`, { etat: 'decante' });
  const bouchon = () => s.bouchon ? say('Bouchon retiré : l’air peut maintenant entrer dans l’ampoule.', { bouchon: false, pression: false }) : say('Bouchon remis.', { bouchon: true });
  const robinet = () => {
    if (s.ouvert) {
      const d = s.drain;
      const m = d < 0.93 ? `Trop tôt : il reste de la phase inférieure (${lib(bas)}) dans l’ampoule.` : d <= 1.04 ? `✓ Bien fermé à temps : le bécher contient la phase inférieure (${lib(bas)}), sans mélange. ${bas === 'eau' ? `Le soluté est dans la phase supérieure : on la récupère par le haut de l’ampoule.` : `${sute ? 'La phase violette' : 'La phase organique'} est celle qui contient le soluté.`}` : 'Trop tard : un peu de phase supérieure est passée dans le bécher, qui contient maintenant un mélange.';
      return say(m, { ouvert: false, ok: d >= 0.93 && d <= 1.04 });
    }
    if (!bi) return say('Une seule phase : rien à soutirer.');
    if (s.etat !== 'decante') return say('Laissez d’abord décanter : les phases doivent être séparées avant d’ouvrir le robinet.');
    if (s.bouchon) return say('Rien ne s’écoule : retirez d’abord le bouchon, l’air doit pouvoir entrer dans l’ampoule.');
    if (s.drain >= 1) return say('La phase inférieure est déjà écoulée.');
    say('Le liquide s’écoule dans le bécher. Fermez le robinet quand l’interface arrive juste au niveau du robinet.', { ouvert: true });
  };
  const btn = (txt, f, c = '#334155') => <button onClick={f} style={styleBouton(false, c)}>{txt}</button>;
  return (
    <div>
      <Ampoule solvant={sol} soluteCle={sute} etat={s.etat} drain={s.drain} bouchon={s.bouchon} ouvert={s.ouvert} titre="Ampoule à décanter"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
        {btn('1. Agiter', agiter, ORANGE)}{btn('2. Dégazer', degazer)}{btn('3. Poser et décanter', decanter, BLEU)}{btn(s.bouchon ? '4. Retirer le bouchon' : 'Remettre le bouchon', bouchon)}{btn(s.ouvert ? '6. Fermer le robinet' : '5. Ouvrir le robinet', robinet, s.ouvert ? ROUGE : VERT)}
        <button onClick={() => setS(init)} style={styleBouton(false)}><Pic n="refresh"/>Recommencer</button>
      </div>
      <div role="status" aria-live="polite" style={{ fontSize: 14, color: s.ok === true ? VERT : KIT.txt, fontWeight: s.ok === null ? 400 : 700, lineHeight: 1.5 }}>{s.msg}</div>
    </div>);
}
const SchemaDensite = () => (
  <Schema aria="Deux liquides non miscibles : celui dont la densité est la plus petite flotte au-dessus" h={170}>
    <rect x="30" y="30" width="120" height="50" fill="#fef9c3" stroke={GRIS}/><rect x="30" y="80" width="120" height="50" fill="#bfdbfe" stroke={GRIS}/>
    <Tx x={40} y={60} s={12} w={700}>d &lt; 1 : dessus</Tx><Tx x={40} y={110} s={12} w={700}>eau, d = 1</Tx>
    <rect x="200" y="30" width="120" height="50" fill="#bfdbfe" stroke={GRIS}/><rect x="200" y="80" width="120" height="50" fill="#fef9c3" stroke={GRIS}/>
    <Tx x={210} y={60} s={12} w={700}>eau, d = 1</Tx><Tx x={210} y={110} s={12} w={700}>d &gt; 1 : dessous</Tx>
    <Tx x={6} y={16} s={12.5} w={700}>Le moins dense surnage</Tx><Tx x={6} y={152} s={11.5} c={VERT} w={700}>d = ρ ÷ ρ(eau)</Tx>
  </Schema>);
const SchemaCriteres = () => (
  <Schema aria="Trois critères d'un solvant extracteur : non miscible à l'eau, l'espèce y est plus soluble, il est facile à éliminer" h={150}>
    <Tx x={6} y={18} s={12.5} w={700}>Solvant extracteur : 3 critères</Tx>
    <Tx x={6} y={50} s={12.5} c={VERT} w={700}>1. non miscible avec l’eau (2 phases)</Tx>
    <Tx x={6} y={80} s={12.5} c={BLEU} w={700}>2. l’espèce y est plus soluble que dans l’eau</Tx>
    <Tx x={6} y={110} s={12.5} c={ORANGE} w={700}>3. facile à éliminer (volatil, peu toxique)</Tx>
    <Tx x={6} y={140} s={11} c={GRIS}>« qui se ressemble s’assemble »</Tx>
  </Schema>);
const SchemaGestes = () => (
  <Schema aria="Gestes : agiter en dégazant, laisser décanter, ouvrir le bouchon, soutirer la phase inférieure" h={150}>
    <Tx x={6} y={18} s={12.5} w={700}>Extraction : 4 gestes dans l’ordre</Tx>
    <Tx x={6} y={50} s={12.5}>1. agiter et dégazer (robinet vers le haut)</Tx><Tx x={6} y={78} s={12.5}>2. poser et laisser décanter</Tx>
    <Tx x={6} y={106} s={12.5}>3. retirer le bouchon (sinon ça ne coule pas)</Tx><Tx x={6} y={134} s={12.5} c={ROUGE} w={700}>4. soutirer la phase du BAS par le robinet</Tx>
  </Schema>);

const lib = k => E.SOLVANTS[k].nom;
export function SimulationExtraction() {
  const [mode, setMode] = useState(() => modeOuverture('ext-guide-v1'));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('ext-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [hypoOuv, setHypoOuv] = useState(false);
  const [sol, setSol] = useState('cyclohexane'), [sute, setSute] = useState('diiode');
  const enGuide = mode === 'guide', enDefi = mode === 'defi', etape = guide.etape;
  const qcm = (q, options, expl, indice) => ({ type: 'qcm', q, options, bonne: 0, expl, indice });
  const ETAPES = [
    { id: 'densite', titre: 'Densité d’un liquide', vue: { s: 'dichloromethane' },
      texte: <>On pèse 15,0{NB}mL de dichlorométhane : la balance indique 19,95{NB}g. La <strong>densité</strong> d’un liquide est d = ρ ÷ ρ<sub>eau</sub>, avec ρ<sub>eau</sub> = 1,00{NB}g·mL⁻¹ et ρ = m ÷ V.</>,
      tache: { type: 'num', q: 'Densité du dichlorométhane', unite: '', vrai: 1.33, tol: 0.03, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['ρ = m ÷ V = 19,95 ÷ 15,0 = 1,33 g·mL⁻¹.', 'd = ρ ÷ ρ(eau) = 1,33 ÷ 1,00 = 1,33 (sans unité).'], pieges: [[0.75, 'Vous avez calculé V ÷ m : la masse volumique est m ÷ V.'], [19.95, 'Vous avez donné la masse : il faut diviser par le volume.']],
        expl: 'ρ = 19,95 g ÷ 15,0 mL = 1,33 g/mL, donc d = 1,33.', indice: 'ρ = m ÷ V (en g/mL), puis d = ρ ÷ 1,00 g/mL.' } },
    { id: 'haut', titre: 'Qui est au-dessus ?', vue: { s: 'cyclohexane' }, retenirTitre: 'À RETENIR : POSITION DES PHASES',
      retenir: <><SchemaDensite/>{puces(<>Deux liquides <strong>non miscibles</strong> donnent <strong>deux phases</strong> ; le plus <strong>dense</strong> est en <strong>bas</strong>.</>, <>On compare à l’eau (d = 1) : d &lt; 1 ⇒ au-dessus de l’eau ; d &gt; 1 ⇒ en dessous.</>, <>Exemple : une huile (d ≈ 0,9) flotte sur l’eau.</>, <><strong>Idée fausse</strong> : « l’eau est toujours en bas ». <strong>Vrai</strong> : tout dépend de la densité de l’autre liquide.</>)}</>,
      texte: <>On verse du cyclohexane (d = 0,78) sur de l’eau (d = 1,00) dans l’ampoule. Les deux liquides ne se mélangent pas.</>,
      tache: qcm('Quelle phase est au-dessus ?', ['le cyclohexane (le moins dense)', 'l’eau (le plus dense)', 'les deux se mélangent'], 'Les deux liquides sont non miscibles : le moins dense (cyclohexane, d = 0,78) surnage sur l’eau.', 'Le liquide le plus dense est en bas.') },
    { id: 'bas', titre: 'Et avec le dichlorométhane ?', vue: { s: 'dichloromethane' },
      texte: <>On refait l’expérience avec le dichlorométhane (d = 1,33), lui aussi non miscible avec l’eau.</>,
      tache: qcm('Quelle phase est au-dessus ?', ['l’eau (d = 1,00, moins dense que 1,33)', 'le dichlorométhane (d = 1,33)', 'il n’y a qu’une phase'], 'L’eau est moins dense que le dichlorométhane : elle est au-dessus, le dichlorométhane est en bas.', 'Comparez 1,00 et 1,33.') },
    { id: 'miscible', titre: 'Un solvant miscible', vue: { s: 'ethanol' },
      texte: <>On verse de l’éthanol (d = 0,79) sur de l’eau : on obtient <strong>une seule phase</strong>, car l’éthanol est miscible avec l’eau.</>,
      tache: qcm('L’éthanol peut-il servir à extraire une espèce dissoute dans l’eau avec une ampoule à décanter ?', ['non : il se mélange à l’eau, il n’y a pas deux phases à séparer', 'oui : il est moins dense que l’eau', 'oui : tous les solvants organiques conviennent'], 'Il faut deux phases : le solvant extracteur doit être non miscible avec l’eau.', 'Combien de phases voit-on dans l’ampoule ?') },
    { id: 'solute', titre: 'Où va le diiode ?', vue: { s: 'cyclohexane', so: 'diiode' },
      texte: <>Une solution aqueuse jaune-brun de diiode est agitée avec du cyclohexane puis laissée au repos. Le diiode est beaucoup plus soluble dans le cyclohexane que dans l’eau : la couleur violette apparaît dans l’une des phases.</>,
      tache: qcm('Où est la phase colorée en violet ?', ['en haut : c’est la phase de cyclohexane qui contient le diiode', 'en bas : c’est la phase aqueuse', 'dans les deux phases de la même façon'], 'Le diiode a été extrait de l’eau par le cyclohexane (plus soluble). Le cyclohexane (d = 0,78) est au-dessus : la phase violette est en haut, l’eau est presque décolorée.', 'Dans quelle phase le diiode est-il le plus soluble ? Laquelle est au-dessus ?') },
    { id: 'criteres', titre: 'Choisir le solvant extracteur', vue: { s: 'cyclohexane', so: 'diiode', ag: true }, retenirTitre: 'À RETENIR : LE SOLVANT EXTRACTEUR',
      retenir: <><SchemaCriteres/>{puces(<>L’<strong>extraction liquide-liquide</strong> transfère une espèce d’une phase vers une autre, grâce à une meilleure solubilité.</>, <>Le solvant doit être <strong>non miscible</strong> avec l’eau et dissoudre <strong>mieux</strong> l’espèce.</>, <>Exemple : un solvant organique non miscible extrait le diiode de l’eau.</>, <>Mnémo : <strong>« qui se ressemble s’assemble »</strong>.</>)}</>,
      texte: <>On veut extraire le diiode d’une solution aqueuse. Dichlorométhane, cyclohexane et éthanol sont disponibles.</>,
      tache: qcm('Lequel de ces solvants ne convient pas ?', ['l’éthanol : il est miscible avec l’eau', 'le cyclohexane : il est moins dense que l’eau', 'le dichlorométhane : il est plus dense que l’eau'], 'La position (haut ou bas) importe peu pour le choix : l’essentiel est la non-miscibilité avec l’eau et la bonne solubilité du diiode. L’éthanol ne donne qu’une phase.', 'Le solvant doit donner deux phases avec l’eau.') },
    { id: 'gestes', titre: 'Les gestes', vue: { s: 'dichloromethane', so: 'diiode', ag: true }, retenirTitre: 'À RETENIR : LES GESTES',
      retenir: <><SchemaGestes/>{puces(<>Agiter, puis <strong>dégazer</strong> (robinet vers le haut) pour éviter la surpression.</>, <>Laisser <strong>décanter</strong> sur un support.</>, <>Enlever le bouchon avant d’ouvrir le robinet.</>, <>On soutire toujours la phase du <strong>bas</strong> ; on récupère la phase du haut par le haut.</>)}</>,
      texte: <>Le diiode est extrait par le dichlorométhane (d = 1,33). Après décantation, vous voulez récupérer la phase organique violette.</>,
      tache: qcm('Où se trouve la phase organique et comment la recueillir ?', ['en bas : on ouvre le robinet (bouchon retiré) et on la soutire', 'en haut : on ouvre le robinet pour la soutirer', 'en bas : on la verse par le haut de l’ampoule'], 'Le dichlorométhane est plus dense que l’eau : il est en bas. On retire le bouchon, on ouvre le robinet et on le soutire.', 'Qui est en bas : phase de d = 1,33 ou d = 1,00 ?') },
    { id: 'deux', titre: 'Une fois ou deux fois ?', vue: { s: 'cyclohexane', so: 'diiode', ag: true },
      texte: <>On dispose de 20{NB}mL de cyclohexane pour extraire le diiode. Option A : une extraction avec 20{NB}mL. Option B : deux extractions successives avec 10{NB}mL chacune.</>,
      tache: qcm('Quelle option extrait le plus de diiode ?', ['l’option B : plusieurs petites extractions sont plus efficaces', 'l’option A : plus de solvant à la fois', 'les deux sont strictement équivalentes'], 'Pour un même volume total, fractionner le solvant extrait davantage. Au programme, on retient qualitativement que plusieurs extractions successives sont plus efficaces.', 'Avec du solvant frais à chaque fois, la phase aqueuse est « vidée » deux fois.') },
    { id: 'bravo', titre: 'Bravo !', vue: { s: 'cyclohexane', so: 'diiode', ag: true }, texte: <>Vous savez prévoir la position des phases (densité), choisir un solvant extracteur et réaliser une extraction. En exploration, testez les combinaisons ; en défi, calculez une densité.</>, tache: null },
  ];
  const cur = ETAPES[Math.min(etape, ETAPES.length - 1)], v = cur.vue || {};
  const finParcours = (<span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
    <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défi</button></span>);
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(); }
  const nouveauDefi = () => {
    const cle = tire(['cyclohexane', 'dichloromethane', 'ether']), d = E.SOLVANTS[cle].d, V = tire([10, 15, 20, 25, 30]);
    const m = Math.round(d * V * 100) / 100;
    setDefi({ cle, V, m, vrai: Number((m / V).toFixed(4)), reps: {}, verifie: false });
  };
  const verifier = () => { const x = lireNombre(defi.reps.r), ok = isFinite(x) && proche(x, defi.vrai, 0.05); setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok); };
  const voletDefi = defi && (<div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : densité d’un solvant</div>
    <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On pèse {nbf(defi.V, 0)}{NB}mL de <strong>{lib(defi.cle)}</strong> : {nbf(defi.m, 2)}{NB}g. Calculez la densité d (ρ<sub>eau</sub> = 1,00{NB}g·mL⁻¹), puis dites si ce solvant sera en haut ou en bas de l’ampoule avec l’eau. Réponse avec 3 chiffres significatifs.</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0', fontSize: 14 }}><span>d =</span>
      <input value={defi.reps.r ?? ''} aria-label="Densité" onKeyDown={e => e.key === 'Enter' && document.getElementById('ext-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { r: e.target.value }, verifie: false }))} style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/></div>
    <IndiceDefi cache={false}>{'ρ = m ÷ V (g/mL) ; d = ρ ÷ ρ(eau) avec ρ(eau) = 1,00 g/mL.'}</IndiceDefi>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button id="ext-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button><button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button></div>
    {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
      {defi.ok ? `✓ Correct : d ≈ ${nbf(defi.vrai, 2)}. Le ${lib(defi.cle)} est ${E.SOLVANTS[defi.cle].d < 1 ? 'au-dessus' : 'en dessous'} de l’eau.` : '✗ Vérifiez : ρ = m ÷ V, puis divisez par 1,00 g/mL.'}</div>}
    <div style={{ marginTop: 8 }}><Ampoule solvant={defi.cle} titre="Ampoule du défi"/></div>
  </div>);
  const [vT, setVT] = useState(30), [nExt, setNExt] = useState(1), [sExt, setSExt] = useState('dichloromethane'), [sousExp, setSousExp] = useState('ampoule');
  const Kx = E.K_DIIODE[sExt], VEAU = 50, pct = n => 100 * E.fractionExtraite(Kx, VEAU, vT, n);
  const exploreCombien = (<div style={styleBoite}>
    <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>On extrait le diiode de {VEAU}{NB}mL d’eau. Vous disposez d’un <strong>volume total</strong> d’extractant : faut-il le verser <strong>en une fois</strong> ou en <strong>plusieurs fois</strong> ?</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }} role="group" aria-label="Solvant extracteur">{['cyclohexane', 'dichloromethane', 'ether'].map(k => <button key={k} onClick={() => setSExt(k)} aria-pressed={sExt === k} style={stylePetitBouton(sExt === k, BLEU)}>{lib(k)}</button>)}</div>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt }}><span style={{ flex: '1 1 160px' }}>Volume total d’extractant</span><input type="range" min="10" max="60" step="5" value={vT} onChange={e => setVT(parseInt(e.target.value))} aria-label="Volume total d’extractant" style={{ flex: '2 1 140px', minHeight: 32 }}/><strong>{vT}{NB}mL</strong></label>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt }}><span style={{ flex: '1 1 160px' }}>Nombre d’extractions</span><div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Nombre d’extractions">{[1, 2, 3, 4].map(n => <button key={n} onClick={() => setNExt(n)} aria-pressed={nExt === n} style={{ ...stylePetitBouton(nExt === n, ROUGE), minWidth: 36 }}>{n}</button>)}</div></label>
    <div role="status" aria-live="polite" style={{ fontSize: 14, color: KIT.txt, marginTop: 8, lineHeight: 1.6 }}>{nExt} extraction{nExt > 1 ? 's' : ''} de {nbf(vT / nExt, 1)}{NB}mL : <strong>{nbf(pct(nExt), 1)}{NB}%</strong> du diiode passe dans le {lib(sExt)} ; il reste {nbf(100 - pct(nExt), 1)}{NB}% dans l’eau.</div>
    <div style={{ marginTop: 8 }}>{[1, 2, 3, 4].map(n => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: KIT.txt, marginBottom: 4 }}><span style={{ width: 90 }}>{n} × {nbf(vT / n, 1)}{NB}mL</span><div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 16 }}><div style={{ width: `${pct(n)}%`, background: n === nExt ? ROUGE : BLEU, height: 16, borderRadius: 4 }}/></div><span style={{ width: 52, textAlign: 'right' }}>{nbf(pct(n), 1)}{NB}%</span></div>)}</div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Constat : pour le même volume total, <strong>fractionner</strong> extrait davantage. Mais chaque extraction demande du temps : on s’arrête quand le gain devient faible.</div>
  </div>);
  const exploreAmpoule = (<div style={styleBoite}>
    <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Faites l’extraction vous-même, geste par geste. Les erreurs de manipulation ont des conséquences visibles.</div>
    <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
      <div style={{ border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 10, background: '#fff' }}><div style={{ fontSize: 13, fontWeight: 700, color: BLEU, marginBottom: 6 }}>① Le SOLVANT extracteur (ajouté à l’eau)</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 0 }} role="group" aria-label="Solvant">{['cyclohexane', 'dichloromethane', 'ether', 'ethanol'].map(k => <button key={k} onClick={() => setSol(k)} aria-pressed={sol === k} style={stylePetitBouton(sol === k, BLEU)}>{lib(k)}</button>)}</div></div>
      <div style={{ border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 10, background: '#fff' }}><div style={{ fontSize: 13, fontWeight: 700, color: ROUGE, marginBottom: 6 }}>② Le SOLUTÉ (l’espèce dissoute dans l’eau, à extraire)</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 0 }} role="group" aria-label="Espèce dissoute dans l’eau">{[['diiode', 'diiode'], ['chlorureSodium', 'chlorure de sodium'], ['', 'aucune']].map(([k, n]) => <button key={n} onClick={() => setSute(k)} aria-pressed={sute === k} style={stylePetitBouton(sute === k, ROUGE)}>{n}</button>)}</div></div></div>
    <Manip sol={sol} sute={sute}/>
  </div>);
  const explore = (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Que voulez-vous explorer ?">{[['ampoule', 'Faire l’extraction'], ['combien', 'Une fois ou plusieurs ?']].map(([k, n]) => <button key={k} onClick={() => setSousExp(k)} aria-pressed={sousExp === k} style={stylePetitBouton(sousExp === k, '#0f766e')}>{n}</button>)}</div>
    {sousExp === 'combien' ? exploreCombien : exploreAmpoule}</div>);
  const hypotheses = indicesProfond(<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
    <li>Valeurs de densité approchées à 20 °C (d relatif à l’eau, ρ<sub>eau</sub> = 1,00 g·mL⁻¹). Les liquides sont supposés purs.</li>
    <li>La répartition d’un soluté est traitée <strong>qualitativement</strong> (plus soluble dans l’une ou l’autre phase) ; le coefficient de partage n’est pas au programme de 1G. Après décantation, une trace du soluté reste dans l’autre phase.</li>
    <li>Le dichlorométhane et l’éther sont donnés comme solvants non miscibles à l’eau ; l’éthanol est miscible en toutes proportions.</li>
    <li><strong>Efficacité (exploration)</strong> : le coefficient de partage K du diiode (de l’ordre de 10 : valeur choisie pour que les écarts soient visibles) et le modèle « n extractions de V/n » sont des <strong>valeurs illustratives</strong> ; le coefficient de partage n’est pas au programme de 1G, seul le constat qualitatif l’est.</li>
    <li>Pesée : le défi accepte 5 % d’écart pour tenir compte de l’arrondi des données.</li></ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`.ex-l1{display:grid;gap:12px;margin-bottom:12px;grid-template-columns:minmax(0,1fr)}.ex-l1.cote{grid-template-columns:minmax(0,2fr) minmax(300px,1fr)}@media(min-width:901px){.ex-l1.cote .ex-carte{order:2}}@media(max-width:900px){.ex-l1.cote{grid-template-columns:minmax(0,1fr)}}`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Ampoule à décanter : extraction liquide-liquide</h2><BoutonsModes mode={mode} setMode={changerMode}/></div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Prévoir la <strong>position des phases</strong> (densité), choisir un <strong>solvant extracteur</strong> et suivre les gestes d’une extraction.</div>
      <div className={`ex-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="ex-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ex-carte">{panneauHypo}</div> : null}
        <div>
          {enGuide && <div style={styleBoite}><Ampoule solvant={v.s || 'cyclohexane'} soluteCle={v.so} etat={v.ag ? 'decante' : 'avant'} titre="Ampoule à décanter"/></div>}
          {enDefi && defi && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.densite`} etat={suiviP}/></div>}
          {mode === 'explore' && explore}
        </div></div>
      {(mode === 'explore' || (enGuide && etape >= ETAPES.length - 1)) && panneauHypo}
    </div>);
}
