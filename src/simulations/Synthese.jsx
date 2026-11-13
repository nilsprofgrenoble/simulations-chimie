import { declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, IndiceDefi, Formule, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { nbf, tire, Schema, T, puces, ROUGE, VERT, BLEU, ORANGE, NOIR, GRIS } from "./Travail";
import * as M from "./syntheseModele";

export const SIM_ID = 109;
declarerDefis(SIM_ID, [['rendement', 'Calculer le rendement d’une synthèse']]);

// ====================================================
//  SIM 109 — SYNTHÈSE ORGANIQUE : DU PROTOCOLE AU RENDEMENT (1G, chapitre 6 : TP de la chalcone)
//  Préparer le TP en amont : les 4 phases, quantités de matière, réactif limitant, masse théorique,
//  séchage à masse constante, rendement, lavage, recristallisation, contrôle (point de fusion).
// ====================================================
const Chim = ({ f }) => <>{String(f).split(/(\d+)/).map((p, i) => i % 2 ? <sub key={i}>{p}</sub> : p)}</>;
const Ind = ({ b, i }) => <>{b}<sub>{i}</sub></>;
const PHASES = [['S', 'Synthèse', '#2563eb'], ['I', 'Isolement', '#0e7490'], ['P', 'Purification', '#7c3aed'], ['C', 'Contrôle', '#15803d']];
const OPS = [
  ['Broyer anisaldéhyde, 4’-méthylacétophénone et soude dans un mortier', 'S'],
  ['Laver le solide à l’eau glacée pour éliminer la soude', 'I'],
  ['Filtrer sur büchner sous pression réduite', 'I'],
  ['Sécher à l’étuve jusqu’à masse constante', 'I'],
  ['Dissoudre la chalcone dans l’éthanol bouillant (montage à reflux)', 'P'],
  ['Refroidir lentement puis dans la glace : les cristaux se forment', 'P'],
  ['Déposer produit et références sur une plaque CCM, éluer, révéler à l’UV', 'C'],
  ['Mesurer la température de fusion sur le banc Kofler', 'C'],
  ['Enregistrer un spectre IR et le comparer à celui de la chalcone de référence', 'C'],
];
const EX = M.EXEMPLE, PES = EX.pesees, MBR = PES[PES.length - 1] - EX.mBoite;
const B0 = M.bilan({ m1: EX.m1, m2: EX.m2 });
const tel = (v, d) => Number(nbf(v, d).replace(',', '.'));

// ---------- tri des opérations du protocole en 4 phases ----------
function TriProtocole({ aff, setAff, verif, setVerif, fige }) {
  const faux = OPS.filter(([, p], i) => aff[i] && aff[i] !== p).length, tous = OPS.every((_, i) => aff[i]);
  return (
    <div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Pour chaque opération du TP, choisissez sa phase : <strong>S</strong>ynthèse, <strong>I</strong>solement, <strong>P</strong>urification, <strong>C</strong>ontrôle.</div>
      {OPS.map(([txt, p], i) => {
        const ok = verif && aff[i] && aff[i] === p, ko = verif && aff[i] && aff[i] !== p;
        return (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderTop: i ? `1px solid ${KIT.bord}` : 'none' }}>
            <div style={{ flex: '1 1 220px', fontSize: 13.5, color: KIT.txt, lineHeight: 1.4 }}>{i + 1}. {txt}</div>
            <div style={{ display: 'flex', gap: 4 }} role="group" aria-label={`Phase de l’opération ${i + 1}`}>
              {PHASES.map(([k, nom, c]) => <button key={k} disabled={fige} aria-pressed={aff[i] === k} aria-label={nom} title={nom} onClick={() => { setAff(a => ({ ...a, [i]: k })); setVerif(false); }}
                style={{ ...stylePetitBouton(aff[i] === k, c), minWidth: 36 }}>{k}</button>)}
              <span aria-hidden style={{ width: 18, textAlign: 'center', fontWeight: 700, color: ok ? VERT : ROUGE }}>{ok ? '✓' : ko ? '✗' : ''}</span>
            </div>
          </div>);
      })}
      {!fige && <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setVerif(true)} disabled={!tous} style={styleBouton(true, '#15803d')}>✓ Vérifier</button>
        {verif && <span role="status" style={{ fontSize: 13.5, fontWeight: 700, color: faux ? ROUGE : VERT }}>{faux ? `${faux} opération(s) à revoir : on fabrique, on récupère, on nettoie, on vérifie.` : 'Toutes les phases sont justes !'}</span>}
      </div>}
    </div>);
}

// ---------- fiches des espèces (masses pesées et masses molaires du TP) ----------
function Reactifs({ m1, m2 }) {
  const cartes = [['Anisaldéhyde', 'C8H8O2', M.M_ANIS, `${nbf(m1, 2)} g`, '#2563eb'], ['4’-méthylacétophénone', 'C9H10O', M.M_ACET, `${nbf(m2, 2)} g`, '#0e7490'], ['Chalcone (produit)', 'C17H16O2', M.M_CHAL, 'à calculer', '#c2410c']];
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>L’équation de la synthèse</div>
      <div style={{ fontSize: 15, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}><Chim f="C8H8O2"/> + <Chim f="C9H10O"/> → <Chim f="C17H16O2"/> + H<sub>2</sub>O <span style={{ fontSize: 12.5, color: KIT.txt2 }}>(NaOH : catalyseur)</span></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {cartes.map(([nom, f, Mm, mm, c]) => <div key={nom} style={{ flex: '1 1 130px', border: `2px solid ${c}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, color: c }}>{nom}</div><div><Chim f={f}/></div><div>M = {nbf(Mm, 2)}{NB}g·mol<sup>−1</sup></div><div>masse pesée : <strong>{mm}</strong></div></div>)}
      </div>
    </div>);
}

// ---------- séchage à masse constante ----------
export function Sechage({ pes, mBoite, nom = 'm' }) {
  const W = 600, H = 190, mx = 52, my = 16, lo = Math.min(...pes) - 0.3, hi = Math.max(...pes) + 0.3, n = pes.length;
  const X = i => mx + i * (W - mx - 16) / (n - 1), Y = v => H - 30 - (v - lo) / (hi - lo) * (H - 30 - my);
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Pesées successives de la boîte de Pétri + solide, à l’étuve</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Boîte de Pétri vide : {nbf(mBoite, 2)}{NB}g · balance au centigramme (0,01{NB}g)</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, margin: '4px 0 8px' }}><thead><tr><th style={cel(true)}>pesée</th><th style={cel(true)}>t (min)</th><th style={cel(true)}>masse (g)</th></tr></thead>
        <tbody>{pes.map((v, i) => <tr key={i}><td style={cel()}>{nom}<sub>{i + 1}</sub></td><td style={cel()}>{i * 5}</td><td style={{ ...cel(), fontFamily: 'monospace' }}>{nbf(v, 2)}</td></tr>)}</tbody></table>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fff', borderRadius: 8 }} role="img" aria-label="Masse de la boîte et du solide en fonction du temps : elle diminue puis devient constante">
        <line x1={mx} y1={H - 30} x2={W - 10} y2={H - 30} stroke={GRIS}/><line x1={mx} y1={my} x2={mx} y2={H - 30} stroke={GRIS}/>
        <text x={W - 12} y={H - 36} textAnchor="end" fontSize="13" fill={GRIS}>t (min)</text><text x="6" y="22" fontSize="13" fill={GRIS}>m (g)</text>
        <polyline fill="none" stroke={BLEU} strokeWidth="2.5" points={pes.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}/>
        {pes.map((v, i) => <g key={i}><circle cx={X(i)} cy={Y(v)} r="4.5" fill={BLEU}/><text x={X(i)} y={H - 14} textAnchor="middle" fontSize="12" fill={GRIS}>{i * 5}</text></g>)}
      </svg>
    </div>);
}
const cel = (h) => ({ border: `1px solid ${KIT.bord}`, padding: '2px 8px', textAlign: 'center', background: h ? '#f1f5f9' : 'transparent' });

// ---------- choix du solvant de recristallisation (données du TP) ----------
const SOLVANTS = [['Eau', 'peu soluble', 'peu soluble'], ['Éthanol', 'peu soluble', 'soluble'], ['Acétone', 'assez soluble', 'non précisé (téb 56 °C)']];
const TabSolvants = () => (
  <div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Solubilité de la chalcone (fiche de données du TP)</div>
    <table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}><thead><tr>{['solvant', 'à 20 °C', 'à chaud'].map(h => <th key={h} style={cel(true)}>{h}</th>)}</tr></thead>
      <tbody>{SOLVANTS.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} style={{ ...cel(), textAlign: i ? 'center' : 'left', fontWeight: i ? 400 : 700 }}>{c}</td>)}</tr>)}</tbody></table>
  </div>);

// ---------- schémas des cartes ----------
const Fleche = ({ x1, x2, y }) => <g><line x1={x1} y1={y} x2={x2} y2={y} stroke={GRIS} strokeWidth="2"/><path d={`M${x2},${y} l-7,-4 v8 z`} fill={GRIS}/></g>;
const SchemaPhases = () => (
  <Schema aria="Quatre phases d'une synthèse en chaîne : synthèse, isolement, purification, contrôle" h={150}>
    {PHASES.map(([k, nom, c], i) => <g key={k}><rect x={6 + i * 89} y="38" width="76" height="56" rx="8" fill="#fff" stroke={c} strokeWidth="3"/><T x={44 + i * 89} y={62} a="middle" s={18} c={c} w={800}>{k}</T><T x={44 + i * 89} y={82} a="middle" s={10.5} c={c}>{nom}</T>{i < 3 && <Fleche x1={84 + i * 89} x2={94 + i * 89} y={66}/>}</g>)}
    <T x={6} y={20} s={12.5} w={700}>On fabrique, on récupère, on nettoie, on vérifie</T>
    <T x={6} y={118} s={11.5} c={GRIS}>fabriquer · filtrer/laver/sécher · recristalliser · CCM, Tf, IR</T>
    <T x={6} y={138} s={11.5} c={ROUGE}>la purification est facultative, le contrôle jamais</T>
  </Schema>);
const SchemaRendement = () => (
  <Schema aria="Deux réactifs consommés dans le rapport des coefficients : celui dont la quantité divisée par le coefficient est la plus petite est limitant ; le rendement est la masse obtenue divisée par la masse théorique" h={170}>
    <rect x="30" y="62" width="40" height="60" fill="#2563eb" opacity="0.85"/><rect x="100" y="42" width="40" height="80" fill="#0e7490" opacity="0.85"/>
    <line x1="22" y1="62" x2="150" y2="62" stroke={ROUGE} strokeWidth="2" strokeDasharray="4 3"/>
    <T x={22} y={138} s={11.5} w={700}>A : 2,0</T><T x={96} y={138} s={11.5} w={700}>B : 3,0 mmol</T>
    <T x={160} y={56} s={11.5} c={ROUGE} w={700}>A est limitant</T><T x={160} y={74} s={11.5}>(coefficients 1 et 1)</T><T x={160} y={92} s={11.5}>x max = 2,0 mmol</T>
    <T x={6} y={160} s={12} w={700}>R = m obtenue ÷ m théorique ≤ 100 %</T>
    <T x={6} y={18} s={12.5} w={700}>On compare des quantités de matière,</T><T x={6} y={34} s={12.5} w={700}>pas des masses</T>
  </Schema>);
const SchemaSechage = () => (
  <Schema aria="La masse du produit diminue pendant le séchage puis devient constante : deux pesées successives sont identiques à la précision de la balance" h={150}>
    <line x1="30" y1="120" x2="340" y2="120" stroke={GRIS}/><line x1="30" y1="20" x2="30" y2="120" stroke={GRIS}/>
    <polyline fill="none" stroke={BLEU} strokeWidth="3" points="40,36 90,70 140,92 190,100 240,102 290,102"/>
    {[[40, 36], [90, 70], [140, 92], [190, 100], [240, 102], [290, 102]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill={i > 3 ? VERT : BLEU}/>)}
    <rect x="222" y="88" width="84" height="30" rx="6" fill="none" stroke={VERT} strokeWidth="2.5"/><T x={264} y={82} a="middle" s={11} c={VERT} w={700}>deux pesées égales</T>
    <T x={36} y={140} s={11.5} c={GRIS}>31,40 → 30,95 → 30,82 → 30,81 → 30,81 g</T><T x={6} y={14} s={12.5} w={700}>Sec = la masse ne bouge plus</T>
  </Schema>);
const SchemaRecristal = () => (
  <Schema aria="Courbes de solubilité : la chalcone est peu soluble à froid et très soluble à chaud dans l'éthanol, donc elle cristallise au refroidissement alors que les impuretés restent dissoutes" h={150}>
    <line x1="30" y1="118" x2="340" y2="118" stroke={GRIS}/><line x1="30" y1="18" x2="30" y2="118" stroke={GRIS}/>
    <path d="M40,108 C120,104 190,80 320,26" fill="none" stroke="#c2410c" strokeWidth="3"/><path d="M40,60 C160,56 240,50 320,44" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray="5 3"/>
    <T x={196} y={92} s={11.5} c="#c2410c" w={700}>chalcone</T><T x={46} y={50} s={11.5} c="#7c3aed" w={700}>impuretés</T>
    <T x={34} y={134} s={11} c={GRIS}>froid : la chalcone cristallise</T><T x={206} y={134} s={11} c={GRIS}>chaud : tout est dissous</T><T x={6} y={12} s={12.5} w={700}>Solubilité dans l’éthanol selon la température</T>
  </Schema>);
const SchemaTf = () => (
  <Schema aria="Un produit pur fond brusquement à la température de la littérature ; un produit impur fond plus bas et sur un intervalle plus large" h={150}>
    <line x1="20" y1="96" x2="340" y2="96" stroke={GRIS}/>
    <rect x="234" y="52" width="6" height="44" fill={VERT}/><rect x="170" y="52" width="46" height="44" fill="#fecaca" stroke={ROUGE}/>
    <T x={20} y={114} s={11} c={GRIS}>Tf (°C) →</T><T x={218} y={112} a="middle" s={11} c={ROUGE} w={700}>impur : plus bas, étalé</T><T x={252} y={112} s={11} c={VERT} w={700}>pur : 98 °C</T>
    <line x1="237" y1="48" x2="237" y2="30" stroke={VERT} strokeWidth="2"/><T x={246} y={30} s={11.5} c={VERT}>valeur de la littérature</T><T x={6} y={14} s={12.5} w={700}>Pur : fusion nette ; impur : fusion basse et étalée</T>
    <T x={6} y={138} s={11.5} c={GRIS}>un solide pur a une Tf précise ; les impuretés l’abaissent</T>
  </Schema>);

export function SimulationSynthese({ integre = false, modeExt, setModeExt, suite } = {}) {
  const [modeLoc, setModeLoc] = useState(() => modeOuverture('synthese-guide-v1'));
  const mode = modeExt ?? modeLoc, setMode = setModeExt ?? setModeLoc;
  const [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('synthese-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [aff, setAff] = useState({}), [verifTri, setVerifTri] = useState(false);
  const [xm1, setXm1] = useState(3.40), [xm2, setXm2] = useState(3.35), [xme, setXme] = useState(5.46), [xeau, setXeau] = useState(2.4);
  useEffect(() => { if (mode === 'defi' && !defi) nouveauDefi(); }, [mode]);   // eslint-disable-line
  const enGuide = mode === 'guide', enDefi = mode === 'defi', etape = guide.etape;
  const triOk = OPS.every(([, p], i) => aff[i] === p);

  const ETAPES = [
    { id: 'phases', titre: 'Les 4 phases d’une synthèse', focus: ['tri'],
      retenirTitre: 'À RETENIR : LES 4 PHASES D’UNE SYNTHÈSE',
      retenir: <><SchemaPhases/>{puces(<>Toute synthèse suit <strong>S → I → P → C</strong> : on <strong>fabrique</strong>, on <strong>récupère</strong> (isolement), on <strong>nettoie</strong> (purification), on <strong>vérifie</strong> (contrôle).</>, <>Exemple du TP : broyage = synthèse ; filtration et séchage = isolement ; recristallisation = purification ; CCM, Tf, IR = contrôle.</>, <><strong>Idée fausse</strong> : « recristalliser fabrique plus de produit ». <strong>Vrai</strong> : elle le purifie, et on en perd toujours un peu.</>)}</>,
      texte: <>Le TP de la chalcone se déroule en plusieurs phases. Rangez chacune des 9 opérations dans la bonne phase, puis vérifiez.</>,
      tache: { type: 'action', ok: triOk, label: 'Ranger les opérations pour moi', faire: () => { setAff(Object.fromEntries(OPS.map(([, p], i) => [i, p]))); setVerifTri(true); }, consigne: 'Toutes les opérations ne sont pas encore rangées correctement' } },
    { id: 'catal', titre: 'Le rôle de la soude', focus: ['reactifs'],
      texte: <>On broie l’anisaldéhyde, la 4’-méthylacétophénone et des billes de soude NaOH. L’équation de la synthèse est écrite ci-dessus : la soude n’y apparaît pas.</>,
      tache: { type: 'qcm', q: 'Pourquoi NaOH ne figure-t-il pas dans l’équation de la synthèse ?', options: ['c’est un catalyseur : il accélère la réaction sans être consommé', 'il est en trop petite quantité pour être écrit', 'il est consommé mais il se dissout dans l’eau'], bonne: 0,
        expl: 'Un catalyseur accélère la réaction mais n’apparaît ni dans les réactifs ni dans les produits de l’équation. On le retire ensuite par lavage à l’eau, car il est très soluble dans l’eau.', indice: 'Que dit le TP du rôle de l’ion hydroxyde ?' } },
    { id: 'n1', titre: 'Quantité de matière d’anisaldéhyde', focus: ['reactifs'],
      texte: <>On a pesé {nbf(EX.m1, 2)}{NB}g d’anisaldéhyde, de masse molaire {nbf(M.M_ANIS, 2)}{NB}g·mol<sup>−1</sup> (donnée du TP). Donnez la réponse en mmol.</>,
      tache: { type: 'num', q: 'Quantité de matière d’anisaldéhyde', unite: 'mmol', vrai: B0.n1 * 1000, tol: 0.02, affiche: v => nbf(v, 2), cs: 4,
        calcul: () => [`n = m ÷ M = ${nbf(EX.m1, 2)} ÷ ${nbf(M.M_ANIS, 2)} = ${nbf(B0.n1, 5)} mol = ${nbf(B0.n1 * 1000, 2)} mmol.`], pieges: [[B0.n1, 'Vous avez donné la valeur en mol : multipliez par 1000 pour avoir des mmol.'], [EX.m1 * M.M_ANIS, 'Vous avez multiplié m par M : n = m ÷ M.']],
        expl: `n = m / M = ${nbf(B0.n1 * 1000, 2)} mmol.`, indice: 'n = m ÷ M, avec m en g et M en g·mol⁻¹ (résultat en mol, puis × 1000 pour des mmol).' } },
    { id: 'n2', titre: 'Quantité de matière de 4’-méthylacétophénone', focus: ['reactifs'],
      texte: <>On a pesé {nbf(EX.m2, 2)}{NB}g de 4’-méthylacétophénone, de masse molaire {nbf(M.M_ACET, 2)}{NB}g·mol<sup>−1</sup>.</>,
      tache: { type: 'num', q: 'Quantité de matière de 4’-méthylacétophénone', unite: 'mmol', vrai: B0.n2 * 1000, tol: 0.02, affiche: v => nbf(v, 2), cs: 4,
        calcul: () => [`n = m ÷ M = ${nbf(EX.m2, 2)} ÷ ${nbf(M.M_ACET, 2)} = ${nbf(B0.n2, 5)} mol = ${nbf(B0.n2 * 1000, 2)} mmol.`], pieges: [[B0.n2, 'Vous avez donné la valeur en mol : multipliez par 1000 pour avoir des mmol.']],
        expl: `n = m / M = ${nbf(B0.n2 * 1000, 2)} mmol.`, indice: 'n = m ÷ M, résultat en mmol.' } },
    { id: 'limitant', titre: 'Quel est le réactif limitant ?', focus: ['reactifs'],
      texte: <>Les deux réactifs ont le coefficient stœchiométrique 1. Vous avez trouvé n(anisaldéhyde) = {nbf(B0.n1 * 1000, 2)}{NB}mmol et n(4’-méthylacétophénone) = {nbf(B0.n2 * 1000, 2)}{NB}mmol.</>,
      tache: { type: 'qcm', q: 'Quel réactif est limitant ?', options: ['l’anisaldéhyde, car sa masse pesée est la plus grande', 'la 4’-méthylacétophénone, car sa masse pesée est la plus petite', 'les deux à la fois : les quantités de matière sont égales, le mélange est stœchiométrique'], bonne: 2,
        expl: `On compare des quantités de matière, pas des masses. n/1 vaut ${nbf(B0.n1 * 1000, 2)} mmol pour les deux : ils sont totalement consommés en même temps (à la précision de la pesée).`, indice: 'Comparez n(anisaldéhyde) et n(4’-méthylacétophénone) divisées par leur coefficient (1 et 1).' } },
    { id: 'mth', titre: 'Masse théorique de chalcone', focus: ['reactifs'],
      texte: <>L’avancement maximal est x<sub>max</sub> = {nbf(B0.xmax * 1000, 2)}{NB}mmol : on pourrait former n<sub>th</sub> = {nbf(B0.xmax * 1000, 2)}{NB}mmol de chalcone, de masse molaire {nbf(M.M_CHAL, 2)}{NB}g·mol<sup>−1</sup>.</>,
      tache: { type: 'num', q: 'Masse théorique de chalcone', unite: 'g', vrai: B0.mth, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`m_th = n_th × M = ${nbf(B0.xmax, 5)} × ${nbf(M.M_CHAL, 2)} = ${nbf(B0.mth, 2)} g.`], pieges: [[B0.xmax * 1000 * M.M_CHAL, 'Vous avez gardé n en mmol : convertissez en mol (÷ 1000).']],
        expl: `m_th = n_th × M = ${nbf(B0.mth, 2)} g.`, indice: 'm = n × M avec n en mol (24,97 mmol = 0,02497 mol).' } },
    { id: 'sec', titre: 'Quand le produit est-il sec ?', focus: ['sechage'],
      retenirTitre: 'À RETENIR : SÉCHER À MASSE CONSTANTE',
      retenir: <><SchemaSechage/>{puces(<>On pèse le produit à l’étuve toutes les 5 minutes : <strong>il est sec quand deux pesées successives sont égales</strong> à la précision de la balance.</>, <>Exemple générique : 31,40 → 30,95 → 30,82 → 30,81 → 30,81 g : sec à la 4<sup>e</sup> pesée.</>, <>On calcule la masse du produit en retirant la masse de la boîte vide.</>, <><strong>Idée fausse</strong> : « un rendement de 120 % est une belle réussite ». <strong>Vrai</strong> : c’est impossible, le produit est encore humide ou impur.</>)}</>,
      texte: <>Le produit brut est placé dans une boîte de Pétri à l’étuve (80{NB}°C). Les pesées sont données ci-dessous. Le solide est <strong>sec</strong> quand la masse est constante.</>,
      tache: { type: 'qcm', q: 'À partir de quelle pesée le produit est-il sec ?', options: ['m₃ = 47,95 g', 'm₄ = 47,83 g', 'm₅ = 47,81 g : elle est égale à la suivante'], bonne: 2,
        expl: 'm₅ = m₆ = 47,81 g : la masse ne varie plus à 0,01 g près. m₄ (47,83 g) diffère encore de la pesée suivante de 0,02 g : de l’eau s’évapore encore.', indice: 'Cherchez deux pesées successives identiques à 0,01 g près.' } },
    { id: 'mbrut', titre: 'Masse de produit obtenu', focus: ['sechage'],
      texte: <>La boîte de Pétri vide a une masse de {nbf(EX.mBoite, 2)}{NB}g. À masse constante, boîte + solide pèse {nbf(PES[PES.length - 1], 2)}{NB}g.</>,
      tache: { type: 'num', q: 'Masse de chalcone brute sèche', unite: 'g', vrai: MBR, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`m_exp = ${nbf(PES[PES.length - 1], 2)} − ${nbf(EX.mBoite, 2)} = ${nbf(MBR, 2)} g.`], pieges: [[PES[PES.length - 1], 'Vous n’avez pas retiré la masse de la boîte de Pétri.'], [PES[0] - EX.mBoite, 'Vous avez utilisé la première pesée : le solide était encore humide.']],
        expl: `m_exp = ${nbf(MBR, 2)} g.`, indice: 'masse du produit = masse (boîte + solide sec) − masse de la boîte vide.' } },
    { id: 'rdt', titre: 'Le rendement', focus: ['reactifs', 'sechage'],
      retenirTitre: 'À RETENIR : RENDEMENT ET RÉACTIF LIMITANT',
      retenir: <><SchemaRendement/>{puces(<>Le <strong>réactif limitant</strong> est celui dont n ÷ coefficient est le <strong>plus petit</strong> : il fixe x<sub>max</sub> et la masse théorique.</>, <><strong>R = m<sub>obtenue</sub> ÷ m<sub>théorique</sub></strong>, souvent en %. Exemple : 2,0 g obtenus pour 2,5 g possibles ⇒ R = 80 %.</>, <>On compare des <strong>quantités de matière</strong>, jamais des masses : la plus petite masse n’est pas forcément le limitant.</>)}</>,
      texte: <>Vous avez trouvé m<sub>th</sub> = {nbf(B0.mth, 2)}{NB}g et m<sub>exp</sub> = {nbf(MBR, 2)}{NB}g. Donnez R en pourcentage.</>,
      tache: { type: 'num', q: 'Rendement de la synthèse', unite: '%', vrai: 100 * MBR / tel(B0.mth, 2), tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => [`R = m_exp ÷ m_th = ${nbf(MBR, 2)} ÷ ${nbf(B0.mth, 2)} = ${nbf(MBR / tel(B0.mth, 2), 3)} soit ${nbf(100 * MBR / tel(B0.mth, 2), 0)} %.`], pieges: [[MBR / tel(B0.mth, 2), 'Pensez à exprimer le rendement en pourcentage (× 100).'], [100 * (PES[0] - EX.mBoite) / tel(B0.mth, 2), 'Un rendement supérieur à 100 % est impossible : vous avez utilisé le solide humide.']],
        expl: `R = m_exp / m_th = ${nbf(100 * MBR / tel(B0.mth, 2), 0)} %.`, indice: 'R = m obtenue ÷ m théorique, puis × 100 pour un pourcentage.' } },
    { id: 'lavage', titre: 'Pourquoi laver à l’eau glacée ?', focus: [],
      texte: <>Après le broyage, on lave le solide à l’eau glacée dans un bécher, puis on filtre sur büchner. La soude est très soluble dans l’eau ; la chalcone y est insoluble à froid et un peu soluble à chaud.</>,
      tache: { type: 'qcm', q: 'Quel est le rôle de ce lavage, et pourquoi de l’eau glacée ?', options: ['éliminer la soude, qui se dissout ; à froid on perd moins de chalcone', 'faire fondre la chalcone pour la purifier', 'neutraliser la chalcone avec de l’eau tiède'], bonne: 0,
        expl: 'La soude se dissout dans l’eau et part dans le filtrat. Avec de l’eau tiède ou chaude, une partie de la chalcone se dissoudrait aussi : le rendement baisserait.', indice: 'Quelle espèce veut-on enlever ? Que se passe-t-il pour la solubilité quand l’eau est chaude ?' } },
    { id: 'ph', titre: 'Le pH des eaux de lavage', focus: [],
      texte: <>On teste le pH de l’eau de lavage qui sort de l’entonnoir : on lit pH = 13.</>,
      tache: { type: 'qcm', q: 'Que faut-il faire ?', options: ['relaver à l’eau glacée : il reste de la soude (pH > 10)', 'passer au séchage : un pH basique est normal', 'ajouter de l’acide pour neutraliser'], bonne: 0,
        expl: 'Un pH de 13 montre qu’il reste de la soude dans le produit : on relave jusqu’à pH < 10, comme indiqué dans le protocole. On n’ajoute jamais d’acide dans le produit.', indice: 'Relisez la consigne du protocole : à quelle valeur de pH peut-on arrêter les lavages ?' } },
    { id: 'solvant', titre: 'Choisir le solvant de recristallisation', focus: ['solvants'],
      retenirTitre: 'À RETENIR : RECRISTALLISER',
      retenir: <><SchemaRecristal/>{puces(<>Bon solvant : le produit y est <strong>soluble à chaud</strong> et <strong>peu soluble à froid</strong> ; les impuretés restent dissoutes.</>, <>On ajoute le solvant <strong>mL par mL</strong> jusqu’à dissolution : le <strong>minimum</strong>, sinon une partie du produit reste dissoute et le rendement baisse.</>, <>Le <strong>reflux</strong> permet de chauffer à ébullition sans perdre de solvant : le réfrigérant condense les vapeurs.</>, <><strong>Idée fausse</strong> : « plus de solvant, c’est plus propre ». <strong>Vrai</strong> : c’est surtout plus de pertes.</>)}</>,
      texte: <>On veut purifier la chalcone par recristallisation. Voici sa solubilité dans trois solvants.</>,
      tache: { type: 'qcm', q: 'Quel solvant choisir ?', options: ['l’éthanol : peu soluble à froid, soluble à chaud', 'l’eau : elle ne dissout pas la chalcone, donc rien n’est perdu', 'l’acétone : la chalcone y est déjà assez soluble à froid'], bonne: 0,
        expl: 'Dans l’éthanol, la chalcone se dissout à chaud et cristallise en refroidissant. Dans l’eau, elle ne se dissout même pas à chaud. Dans l’acétone, elle reste dissoute à froid : on récupérerait peu de cristaux.', indice: 'Il faut un solvant qui dissout le produit à chaud mais pas à froid.' } },
    { id: 'reflux', titre: 'Le montage à reflux', focus: [],
      texte: <>La dissolution se fait dans un ballon surmonté d’un réfrigérant, avec l’éthanol à ébullition (78{NB}°C).</>,
      tache: { type: 'qcm', q: 'À quoi sert le réfrigérant ?', options: ['condenser les vapeurs d’éthanol, qui retombent dans le ballon : on chauffe sans perdre de solvant', 'refroidir la chalcone pour la faire cristalliser', 'éliminer l’eau formée par la réaction'], bonne: 0,
        expl: 'Les vapeurs d’éthanol se condensent dans le réfrigérant et retombent dans le ballon : on peut maintenir l’ébullition sans perdre de solvant (inflammable !) et sans rejeter de vapeurs.', indice: 'Que deviennent les vapeurs d’éthanol quand elles arrivent dans le réfrigérant ?' } },
    { id: 'tf', titre: 'Contrôler la pureté', focus: [],
      retenirTitre: 'À RETENIR : TEMPÉRATURE DE FUSION ET PURETÉ',
      retenir: <><SchemaTf/>{puces(<>Un solide <strong>pur</strong> fond à une température <strong>précise</strong>, celle de la littérature (chalcone : 98{NB}°C).</>, <>Des <strong>impuretés</strong> abaissent la Tf et <strong>étalent</strong> la fusion sur plusieurs degrés.</>, <>Exemple : fusion entre 91 et 95 °C pour 98 °C attendus ⇒ produit encore impur.</>, <>La CCM et l’IR servent à <strong>identifier</strong> (est-ce la chalcone ?), la Tf à juger la <strong>pureté</strong>.</>)}</>,
      texte: <>Sur le banc Kofler, le produit recristallisé fond progressivement entre 91 et 95{NB}°C. La littérature indique 98{NB}°C pour la chalcone.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['le produit contient encore des impuretés : Tf abaissée et fusion étalée', 'le produit est pur : 95 °C est proche de 98 °C', 'ce n’est pas de la chalcone'], bonne: 0,
        expl: 'Un produit pur fond nettement à 98 °C. Une fusion étalée et plus basse est le signe d’impuretés (par exemple des traces de solvant ou de réactif). La CCM et l’IR diront s’il s’agit bien de la chalcone.', indice: 'Comparez la température et la largeur de l’intervalle de fusion avec ceux d’un produit pur.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez parcouru tout le TP « sur le papier » : phases, quantités de matière, limitant, rendement, séchage, lavage, recristallisation, contrôle. En exploration, changez les masses pesées et la masse obtenue ; en défi, calculez un rendement à partir de nouvelles pesées.</>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const depuis = id => !enGuide || etape >= IDS.indexOf(id), apres = id => !enGuide || etape > IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {suite && <button onClick={suite.action} style={styleBouton(true, '#7c3aed')}>{suite.label} ▶</button>}
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Paillasse libre</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défi</button>
    </span>);

  // ════════════════ DÉFI ════════════════
  const nouveauDefi = () => {
    const m1 = tire([3.00, 3.40, 3.80, 4.20]), m2 = tire([3.00, 3.35, 3.70, 4.00]), b = M.bilan({ m1, m2 });
    const R = tire([0.62, 0.68, 0.74, 0.81, 0.88]), mexp = Math.round(R * b.mth * 100) / 100;
    const mBoite = Math.round((38 + Math.random() * 8) * 100) / 100, mFinal = Math.round((mBoite + mexp) * 100) / 100, me = Math.round((mFinal - mBoite) * 100) / 100;
    setDefi({ m1, m2, mBoite, mFinal, vrai: 100 * me / b.mth, b, reps: {}, verifie: false });
  };
  const verifier = () => { const x = lireNombre(defi.reps.r), ok = isFinite(x) && proche(x, defi.vrai, 0.05); setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok); };
  const voletDefi = defi && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quel est le rendement de cette synthèse ?</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        On réalise la même synthèse de chalcone avec <strong>{nbf(defi.m1, 2)}{NB}g</strong> d’anisaldéhyde et <strong>{nbf(defi.m2, 2)}{NB}g</strong> de 4’-méthylacétophénone (M = {nbf(M.M_ANIS, 2)} et {nbf(M.M_ACET, 2)}{NB}g·mol<sup>−1</sup> ; M(chalcone) = {nbf(M.M_CHAL, 2)}{NB}g·mol<sup>−1</sup>). Après séchage à masse constante, la boîte de Pétri vide pèse {nbf(defi.mBoite, 2)}{NB}g et la boîte avec le solide {nbf(defi.mFinal, 2)}{NB}g. Donnez le rendement avec 2 chiffres significatifs.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>Rendement</span>
        <input value={defi.reps.r ?? ''} aria-label="Rendement en pourcentage" onKeyDown={e => e.key === 'Enter' && document.getElementById('sy-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { r: e.target.value }, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>%</span>
      </div>
      <IndiceDefi cache={false}>{avecIndices('n = m ÷ M pour chaque réactif ; le réactif limitant est celui dont n est le plus petit (coefficients 1 et 1) ; m_th = n_limitant × M(chalcone) ; m_exp = m(boîte + solide) − m(boîte) ; R = m_exp ÷ m_th × 100. Gardez un chiffre de plus en intermédiaire.')}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="sy-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct : R ≈ ${nbf(defi.vrai, 0)} %. Le réactif limitant est ${defi.b.limitant === 'les deux' ? 'les deux réactifs (mélange stœchiométrique)' : defi.b.limitant === 'anisaldehyde' ? 'l’anisaldéhyde' : 'la 4’-méthylacétophénone'} (m_th ≈ ${nbf(defi.b.mth, 2)} g).` : '✗ Vérifiez : n = m ÷ M pour chaque réactif, puis le plus petit n donne x_max ; m_th = x_max × M(chalcone) ; m_exp = différence des deux pesées ; R = m_exp ÷ m_th × 100.'}
      </div>}
    </div>);

  // ════════════════ EXPLORATION : bilan complet avec curseurs ════════════════
  const bx = M.bilan({ m1: xm1, m2: xm2 }), rx = xme / bx.mth;
  const nomLim = bx.limitant === 'les deux' ? 'les deux (mélange stœchiométrique)' : bx.limitant === 'anisaldehyde' ? 'anisaldéhyde' : '4’-méthylacétophénone';
  const slider = (lab, v, set, min, max, pas, u) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt }}>
      <span style={{ flex: '1 1 170px' }}>{lab}</span><input type="range" min={min} max={max} step={pas} value={v} onChange={e => set(parseFloat(e.target.value))} aria-label={lab} style={{ flex: '2 1 140px', minHeight: 32 }}/><strong style={{ width: 70, textAlign: 'right' }}>{nbf(v, 2)}{NB}{u}</strong></label>);
  const explore = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}><Reactifs m1={xm1} m2={xm2}/></div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
        {slider('Anisaldéhyde pesé', xm1, setXm1, 2, 5, 0.05, 'g')}{slider('4’-méthylacétophénone pesée', xm2, setXm2, 2, 5, 0.05, 'g')}{slider('Chalcone sèche obtenue', xme, setXme, 0, 8, 0.01, 'g')}
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Tableau d’avancement (mmol)</div>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead><tr><th style={cel(true)}>état</th><th style={cel(true)}>anisaldéhyde</th><th style={cel(true)}>acétophénone</th><th style={cel(true)}>chalcone</th></tr></thead>
          <tbody><tr><td style={cel()}>initial</td><td style={cel()}>{nbf(bx.n1 * 1000, 2)}</td><td style={cel()}>{nbf(bx.n2 * 1000, 2)}</td><td style={cel()}>0</td></tr>
            <tr><td style={cel()}>final (x<sub>max</sub> = {nbf(bx.xmax * 1000, 2)})</td><td style={cel()}>{nbf(bx.n1f * 1000, 2)}</td><td style={cel()}>{nbf(bx.n2f * 1000, 2)}</td><td style={cel()}>{nbf(bx.nth * 1000, 2)}</td></tr></tbody></table></div>
        <div style={{ fontSize: 14, color: KIT.txt, marginTop: 8, lineHeight: 1.6 }}>Réactif limitant : <strong>{nomLim}</strong>. Masse théorique : <strong>{nbf(bx.mth, 2)}{NB}g</strong>. Rendement : <strong>{nbf(100 * rx, 0)}{NB}%</strong>
          {rx > 1 && <span style={{ color: ROUGE, fontWeight: 700 }}> — impossible : plus de 100 % veut dire produit humide ou impur.</span>}</div>
      </div>
      <div style={styleBoite}>{slider('Eau dans le solide brut', xeau, setXeau, 0.5, 4, 0.1, 'g')}<div style={{ height: 6 }}/><Sechage pes={M.pesees({ mBoite: EX.mBoite, mSec: 5.46, mEau0: xeau })} mBoite={EX.mBoite}/></div>
      <div style={styleBoite}><TabSolvants/></div>
      <div style={styleBoite}><TriProtocole aff={aff} setAff={setAff} verif={verifTri} setVerif={setVerifTri} fige={false}/></div>
    </div>);

  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Données</strong> : masses molaires et solubilités viennent de la fiche du TP ; les pesées de séchage, la masse obtenue, la température de fusion mesurée et les masses du défi sont des <strong>valeurs d’exemple</strong>, pas vos résultats.</li>
      <li><strong>Rendement</strong> : R = m<sub>obtenue</sub> ÷ m<sub>théorique</sub> suppose le produit <strong>sec</strong> (masse constante) et <strong>pur</strong> ; une masse trop élevée signale un solide humide ou impur.</li>
      <li><strong>Réactif limitant</strong> : les deux réactifs ont le coefficient 1. Deux quantités de matière qui diffèrent de moins de 0,5 % sont considérées égales, car la précision des pesées (0,01 g) ne permet pas de les distinguer.</li>
      <li><strong>Séchage</strong> : « masse constante » signifie deux pesées successives égales à la résolution de la balance (0,01 g) ; la courbe de séchage est un modèle illustratif.</li>
      <li><strong>Soude</strong> : l’ion hydroxyde est un catalyseur d’après le TP ; il n’intervient pas dans le calcul du bilan.</li>
      <li><strong>Température de fusion</strong> : on compare la valeur mesurée à la valeur de la littérature en tenant compte de la précision du banc et de la largeur de fusion ; ce n’est pas un test de pureté absolu.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  const triBox = (enGuide && apres('phases'))
    ? <details style={styleBoite}><summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: KIT.txt }}>✓ Les 4 phases du protocole (revoir)</summary><div style={{ marginTop: 8 }}><TriProtocole aff={aff} setAff={setAff} verif={true} fige/></div></details>
    : <div style={{ ...styleBoite, ...cadre('tri') }}><TriProtocole aff={aff} setAff={setAff} verif={verifTri} setVerif={setVerifTri} fige={false}/></div>;
  const guideScene = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {triBox}
      {depuis('catal') && <div style={{ ...styleBoite, ...cadre('reactifs') }}><Reactifs m1={EX.m1} m2={EX.m2}/></div>}
      {depuis('sec') && <div style={{ ...styleBoite, ...cadre('sechage') }}><Sechage pes={PES} mBoite={EX.mBoite}/></div>}
      {depuis('solvant') && <div style={{ ...styleBoite, ...cadre('solvants') }}><TabSolvants/></div>}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sy-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sy-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .sy-l1.cote .sy-carte { order: 2; } .sy-l1.cote .sy-main { order: 1; } }
        @media (max-width: 900px) { .sy-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      {!integre && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Synthèse organique : du protocole au rendement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>}
      {!integre && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Préparez le TP de la <strong>chalcone</strong> : phases d’une synthèse, quantités de matière, réactif limitant, <strong>rendement</strong>, séchage, recristallisation et contrôle.</div>}
      <div className={`sy-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="sy-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="sy-carte">{panneauHypo}</div> : null}
        <div className="sy-main">
          {enGuide && guideScene}
          {enDefi && defi && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.rendement`} etat={suiviP}/></div>}
          {mode === 'explore' && explore}
        </div>
      </div>
      {(mode === 'explore' || (enGuide && etape >= ETAPES.length - 1)) && panneauHypo}
      {mode === 'explore' && <div style={{ marginTop: 12 }}><ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>n = m ÷ M ; réactif limitant : n ÷ coefficient le plus petit</li><li>m<sub>th</sub> = x<sub>max</sub> × M(produit) ; R = m<sub>obtenue</sub> ÷ m<sub>th</sub> ≤ 100 %</li><li>sec = deux pesées successives égales ; Tf d’un produit pur : nette, égale à la littérature</li></ul></ARetenir></div>}
    </div>
  );
}
