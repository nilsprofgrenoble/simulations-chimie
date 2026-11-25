import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./suspensionModele";
import { QCM } from "./suspensionQcm";
import { SvgParticules, SvgZeta, SvgCarteCharge, SvgCarteSel, SvgCarteBilanSusp } from "./SuspensionSchemas";

const SIM_ID = 224, CLE_GUIDE = 'suspension-guide-v1';
declarerDefis(SIM_ID, [['pie', 'Trouver le point isoélectrique d’un solide à partir de deux mesures'], ['diagnostic', 'Diagnostiquer une suspension et choisir la correction']]);

// ====================================================
//  SIM 224 — STABILITÉ D'UNE SUSPENSION : CHARGE DE SURFACE, pH ET SEL (BTS MDC, Formulation › Tensioactifs et émulsions)
//  Capacités visées (jamais affichées à l'élève) : identifier les causes d'instabilité d'un milieu dispersé ; expliquer le choix d'un agent dispersant selon son mode d'action
//  (ici répulsion électrostatique en milieu aqueux). Le mouillage, la répulsion stérique et la granulométrie relèvent de la simulation suivante.
//  Modèle QUALITATIF : suspensionModele.js. Schémas : SuspensionSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ALU = M.solide('alumine');
const ZV = { stable: 'stable', limite: 'à la limite', floculee: 'floculée' };
const fz = z => `${z > 0 ? '+' : z < 0 ? '−' : ''}${Math.abs(Math.round(z))} mV`;
const concTxt = c => (c <= 0 ? 'aucun sel' : `${fr(c, c < 0.01 ? 3 : 2)} mol/L`);
const CONCS = [0, 0.001, 0.01, 0.05, 0.1, 0.3, 0.5];
const PIE_A = 8.0, PIE_B = 9.5, ZA = Math.round(M.zeta0(ALU.pie, PIE_A)), ZB = Math.round(M.zeta0(ALU.pie, PIE_B));

export function SimulationSuspension() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState({ pH: 5, c: 0, disp: false });                                   // scène du parcours (alumine)
  const [ex, setEx] = useState({ solide: 'alumine', pH: 5, c: 0, sel: 'NaCl', disp: false });     // exploration
  const [ouv, setOuv] = useState({});
  const [suiviP, noterP] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('pie');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const zVie = M.zeta({ solide: 'alumine', pH: vie.pH, c: vie.c, sel: 'NaCl', disp: vie.disp });

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'origine', titre: 'D’où vient la charge d’une particule ?', focus: ['scene'],
      texte: <>Une <strong>suspension</strong> est un solide finement divisé dans un liquide (ici de l’alumine dans l’eau). Pour qu’elle ne <strong>floccule</strong> pas (les grains qui se collent en amas), les particules doivent se repousser. Cette répulsion vient de leur <strong>charge de surface</strong>. Un oxyde comme l’alumine est recouvert de groupes <strong>Al–OH</strong>, qui peuvent réagir avec l’eau.</>,
      tache: { type: 'qcm', q: 'Comment une particule d’oxyde acquiert-elle une charge dans l’eau ?', ...QCM.origine,
        expl: 'Les groupes hydroxyle de surface (M–OH) sont amphotères : ils peuvent fixer un H⁺ (charge +) ou en céder un (charge −). La charge dépend donc du pH, pas d’un échauffement ni du seul sel.', indice: 'Pensez aux groupes M–OH de la surface et aux ions H⁺ de la solution.' } },
    { id: 'signe', titre: 'Le pH change le signe de la charge', focus: ['scene', 'curseur'],
      texte: <>Pour l’alumine, le <strong>point isoélectrique</strong> (PIE) est vers un pH de <strong>8,5</strong>. Réglez le pH avec le curseur et observez les signes autour des particules. Placez-vous à <strong>pH 4</strong>, un milieu acide : il y a beaucoup d’ions H⁺.</>,
      tache: { type: 'qcm', q: 'Quel est le signe de la charge de surface de l’alumine à pH 4 ?', ...QCM.signe,
        expl: 'En milieu acide, les groupes Al–OH captent un H⁺ et deviennent Al–OH₂⁺ : la surface est positive. En milieu basique, ils cèdent un H⁺ (Al–O⁻) et la surface est négative.', indice: 'À pH acide, la solution est riche en H⁺ : les groupes de surface les captent.' } },
    { id: 'pie', titre: 'Le point isoélectrique', focus: ['scene', 'courbe'],
      retenirTitre: 'À retenir : la charge selon le pH', retenir: <>
        <SvgCarteCharge/>
        <ul style={puces}>
          <li>Sous le PIE la surface est <strong>positive</strong>, au-dessus elle est <strong>négative</strong> ; au PIE elle est nulle.</li>
          <li>Le <strong>potentiel zêta</strong> ζ (en mV) se mesure : plus |ζ| est grand, plus les particules se repoussent.</li>
        </ul></>,
      texte: <>La courbe donne le <strong>potentiel zêta</strong> ζ, une grandeur mesurable qui traduit la charge des particules. Elle change de signe quand le pH traverse le PIE. Déplacez le curseur de pH : regardez ζ et l’état de la suspension.</>,
      tache: { type: 'qcm', q: 'Qu’appelle-t-on point isoélectrique ?', ...QCM.pie,
        expl: 'Le point isoélectrique est le pH auquel la charge de surface (et ζ) est nulle. La suspension y est la moins stable, puisqu’il n’y a plus de répulsion électrostatique.', indice: 'Isoélectrique : « de même potentiel électrique »… ici nul.' } },
    { id: 'pie-num', titre: 'Trouver le PIE à partir de deux mesures', focus: ['mesures'],
      texte: <>Un laboratoire mesure ζ d’une poudre d’alumine : <strong>+{ZA} mV à pH {fr(PIE_A, 1)}</strong> et <strong>{fz(ZB)} à pH {fr(PIE_B, 1)}</strong>. ζ change de signe entre les deux : le PIE est entre ces deux valeurs. On le trouve par <strong>interpolation linéaire</strong> de ζ entre les deux points.</>,
      tache: { type: 'num', q: 'pH du point isoélectrique', unite: '', vrai: M.pieInterpole(PIE_A, ZA, PIE_B, ZB), tol: 0.03, affiche: v => fr(v, 1), cs: 2,
        calcul: () => [`ζ varie de ${fr(ZA, 0)} à ${fr(ZB, 0)} mV, soit ${fr(ZA - ZB, 0)} mV, quand le pH passe de ${fr(PIE_A, 1)} à ${fr(PIE_B, 1)} (Δ = ${fr(PIE_B - PIE_A, 1)}).`, `ζ s’annule après la fraction ${fr(ZA, 0)} ÷ ${fr(ZA - ZB, 0)} ≈ ${fr(ZA / (ZA - ZB), 2)} de cet intervalle.`, `pH(PIE) = ${fr(PIE_A, 1)} + ${fr(ZA / (ZA - ZB), 2)} × ${fr(PIE_B - PIE_A, 1)} ≈ ${fr(M.pieInterpole(PIE_A, ZA, PIE_B, ZB), 2)}, soit environ 8,5.`],
        pieges: [[(PIE_A + PIE_B) / 2, 'Vous avez pris le milieu des deux pH : les valeurs de ζ ne sont pas opposées, le zéro n’est pas au milieu.'], [PIE_A, 'À pH 8,0, ζ vaut encore +' + ZA + ' mV : il n’est pas nul.']],
        expl: `On cherche le pH où ζ = 0 sur le segment qui relie les deux mesures : pH = ${fr(PIE_A, 1)} + ${fr(ZA / (ZA - ZB), 2)} × ${fr(PIE_B - PIE_A, 1)} ≈ 8,5.`, indice: 'Si ζ passe de a à b (de signes opposés) entre pH₁ et pH₂, le zéro est à pH₁ + a ÷ (a − b) × (pH₂ − pH₁).' } },
    { id: 'ecran', titre: 'Au PIE, la suspension flocule', focus: ['scene', 'curseur'],
      texte: <>Placez le pH sur le PIE de l’alumine (<strong>8,5</strong>) : le potentiel zêta s’annule et les particules s’agglomèrent. Remarquez que la suspension est toujours la même : seul le pH a changé.</>,
      tache: { type: 'qcm', q: 'Pourquoi la suspension flocule-t-elle au PIE ?', ...QCM.ecran,
        expl: 'Sans charge de surface, plus rien ne repousse les particules : les forces d’attraction (van der Waals) l’emportent et elles se collent en amas.', indice: 'Au PIE, ζ = 0 : que reste-t-il comme interaction entre deux particules ?' } },
    { id: 'stable', titre: 'Se placer loin du PIE', focus: ['scene', 'curseur'],
      texte: <>Une suspension est jugée <strong>stable</strong> quand |ζ| dépasse environ <strong>30 mV</strong> (repère usuel). Réglez le pH pour que la suspension d’alumine devienne stable.</>,
      tache: { type: 'action', ok: M.verdict(zVie) === 'stable', consigne: 'Régler le pH pour que |ζ| dépasse 30 mV (suspension stable)' } },
    { id: 'sel', titre: 'Ajouter du sel', focus: ['scene', 'sel'],
      texte: <>Le pH est réglé à <strong>4</strong> : la suspension est stable. Ajoutez maintenant du chlorure de sodium avec le curseur de sel : les ions du sel s’accumulent autour des particules.</>,
      tache: { type: 'action', ok: M.verdict(zVie) === 'floculee', consigne: 'Ajouter assez de sel pour que la suspension flocule (|ζ| < 15 mV)' } },
    { id: 'sel-q', titre: 'Pourquoi le sel fait-il floculer ?', focus: ['scene'],
      retenirTitre: 'À retenir : l’effet du sel', retenir: <>
        <SvgCarteSel/>
        <ul style={puces}>
          <li>Les ions du sel <strong>écrantent</strong> les charges : la couche de contre-ions s’amincit et la répulsion faiblit.</li>
          <li>Plus la <strong>salinité</strong> augmente, plus le risque de floculation est grand : d’où l’eau déminéralisée en formulation.</li>
        </ul></>,
      texte: <>Les particules ont gardé leur charge, et pourtant la suspension a floculé. Les cercles pointillés représentent la couche de contre-ions qui entoure chaque particule : observez-les avant et après l’ajout de sel.</>,
      tache: { type: 'qcm', q: 'Quel est l’effet du sel sur les particules chargées ?', ...QCM.sel,
        expl: 'Le sel apporte des ions qui s’accumulent autour des particules et compensent leur charge à courte distance : on dit qu’ils écrantent la répulsion. Les particules peuvent alors s’approcher et se coller. C’est ce qui crée un delta à l’embouchure d’une rivière.', indice: 'Les ions du sel ne se fixent pas sur la surface : ils s’accumulent à proximité et la masquent.' } },
    { id: 'choc', titre: 'Le choc de pH', focus: ['scene', 'courbe', 'curseur'],
      texte: <>On veut passer une suspension d’alumine de <strong>pH 4</strong> à <strong>pH 11</strong> en versant de la soude. À chaque pH extrême, elle est stable. Mais on verse la soude assez lentement pour que le mélange passe par toutes les valeurs. Déplacez le curseur pour suivre le trajet.</>,
      tache: { type: 'qcm', q: 'Peut-on ignorer le passage par le PIE, puisque les pH de départ et d’arrivée sont stables ?', ...QCM.choc,
        expl: 'Même un passage bref par le PIE peut provoquer une floculation, et un amas formé ne se redisperse pas toujours. C’est pourquoi on évite les chocs de pH et on fait les ajouts d’acide ou de base progressivement, en milieu bien agité, ou on choisit un pH de travail éloigné du PIE.', indice: 'À quel moment du trajet ζ s’annule-t-il ?' } },
    { id: 'disp-action', titre: 'Un dispersant électrostatique', focus: ['scene', 'disp'],
      texte: <>Le formulateur veut garder la suspension à <strong>pH 8,5</strong>, tout près du PIE (par exemple parce que d’autres matières premières l’exigent). Il ajoute un <strong>dispersant</strong> : le polyacrylate de sodium, un polymère <strong>anionique</strong> qui s’adsorbe sur les particules et leur apporte des charges −. Cochez « Ajouter le dispersant ».</>,
      tache: { type: 'action', ok: vie.disp && Math.abs(vie.pH - ALU.pie) <= 0.3 && M.verdict(zVie) === 'stable', consigne: 'Avec le pH entre 8,2 et 8,8, ajouter le dispersant pour rendre la suspension stable' } },
    { id: 'disp', titre: 'Choisir le dispersant', focus: ['scene'],
      texte: <>Les <strong>dispersants</strong> empêchent la floculation en créant des forces de répulsion. Ici, le milieu est <strong>l’eau</strong> et les particules sont des oxydes : la répulsion est <strong>électrostatique</strong>. (Un autre mécanisme, la répulsion stérique, est utilisé quand le milieu est un solvant organique.)</>,
      tache: { type: 'qcm', q: 'Quel dispersant choisir pour une suspension aqueuse d’alumine ?', ...QCM.disp,
        expl: 'Une suspension aqueuse se stabilise en augmentant la charge de surface : un polyélectrolyte comme le polyacrylate de sodium (anionique) convient. Un polymère soluble dans l’huile est adapté aux milieux organiques, le sel affaiblit la répulsion et un acide ramènerait vers le PIE.', indice: 'Dans l’eau, la répulsion à renforcer est électrique : il faut ajouter des charges.' } },
    { id: 'limites', titre: 'Les limites du modèle', focus: [],
      texte: <>Les valeurs de PIE et le seuil de 30 mV viennent de la littérature. Le PIE d’un solide dépend de son origine, de sa pureté, de son état de surface et du sel présent ; pour une poudre industrielle, on le <strong>mesure</strong>. Le modèle de la simulation est qualitatif.</>,
      tache: { type: 'qcm', q: 'Que dire des PIE et du seuil de 30 mV donnés ici ?', ...QCM.limites,
        expl: 'Ce sont des repères d’ordre de grandeur : le PIE varie d’un échantillon à l’autre (de l’ordre d’une unité de pH), et le seuil de 30 mV est une règle pratique, pas une loi.', indice: 'Pensez à la dispersion des valeurs publiées pour une même poudre.' } },
    { id: 'bilan', titre: 'Le bilan : stabiliser une suspension aqueuse', focus: [],
      retenirTitre: 'À retenir : trois leviers', retenir: <>
        <SvgCarteBilanSusp/>
        <ul style={puces}>
          <li>Une suspension est stable si les particules <strong>se repoussent</strong> : |ζ| élevé (au moins 30 mV).</li>
          <li>Causes d’instabilité : <strong>pH au voisinage du PIE</strong>, <strong>sel</strong> en excès, particules trop grosses.</li>
          <li>Moyen de s’en souvenir : <strong>« charge nulle, floculation ; sel, écran ; dispersant, charges en plus »</strong>.</li>
        </ul></>,
      texte: <>Vous savez relier le pH au signe de la charge, repérer le PIE, expliquer le rôle du sel et choisir un dispersant électrostatique pour un milieu aqueux. En exploration, vous pouvez changer de solide, de pH, de sel et de dispersant.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const apres = id => etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(s => {
      const id = IDS[ni];
      if (id === 'signe') return { pH: 7, c: 0, disp: false };
      if (id === 'ecran') return { pH: 6, c: 0, disp: false };
      if (id === 'stable') return { pH: ALU.pie, c: 0, disp: false };
      if (id === 'sel') return { pH: 4, c: 0, disp: false };
      if (id === 'choc') return { pH: 4, c: 0, disp: false };
      if (id === 'disp-action') return { pH: ALU.pie, c: 0, disp: false };
      return s;
    });
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const montreCourbe = enGuide && apres('pie') && idE !== 'pie-num';
  const sceneGuide = enGuide && idE !== 'pie-num' ? (
    <><SvgParticules z={zVie} c={vie.c} disp={vie.disp} solideNom="alumine"/>
      {montreCourbe && <div style={{ marginTop: 8, ...cadre('courbe') }}><SvgZeta solide="alumine" pH={vie.pH} c={vie.c} disp={vie.disp} montrePIE={apres('ecran')}/></div>}</>) : null;
  const MES_GUIDE = {
    'pie-num': [['ζ à pH 8,0', fz(ZA)], ['ζ à pH 9,5', fz(ZB)], ['Solide', 'alumine Al₂O₃']],
  };
  const mesVie = enGuide && apres('pie') && idE !== 'pie-num' ? [['Potentiel zêta ζ', fz(zVie)], ['État de la suspension', ZV[M.verdict(zVie)]]] : [];
  const lignesGuide = enGuide ? (MES_GUIDE[idE] ?? mesVie) : [];
  const curseurGuide = enGuide && apres('signe') && idE !== 'pie-num' ? (
    <div style={{ ...styleBoite }}>
      <div style={cadre('curseur')}>
        <label htmlFor="su-ph" style={libelle}>pH du milieu : {fr(vie.pH, 1)}</label>
        <input id="su-ph" type="range" min="1" max="13" step="0.1" value={vie.pH} onChange={ev => setVie(s => ({ ...s, pH: parseFloat(ev.target.value) }))} aria-label="pH du milieu" style={{ width: '100%', accentColor: '#7c3aed' }}/>
      </div>
      {apres('sel') && <div style={{ marginTop: 10, ...cadre('sel') }}>
        <label htmlFor="su-c" style={libelle}>Chlorure de sodium ajouté : {concTxt(vie.c)}</label>
        <input id="su-c" type="range" min="0" max={CONCS.length - 1} step="1" value={Math.max(0, CONCS.indexOf(vie.c))} onChange={ev => setVie(s => ({ ...s, c: CONCS[parseInt(ev.target.value, 10)] }))} aria-label="Concentration en chlorure de sodium" style={{ width: '100%', accentColor: '#7c3aed' }}/>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>De 0 à 0,5 mol/L (eau de mer ≈ 0,5 mol/L).</div>
      </div>}
      {apres('disp-action') && <div style={{ marginTop: 10, ...cadre('disp') }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: KIT.txt, minHeight: 36 }}>
          <input type="checkbox" checked={vie.disp} onChange={ev => setVie(s => ({ ...s, disp: ev.target.checked }))} style={{ width: 20, height: 20 }}/>Ajouter le dispersant (polyacrylate de sodium)</label>
      </div>}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'pie' ? { kind, ...M.tiragePIE(), rep: '', verifie: false } : { kind, ...M.tirageDiagnostic(), v: '', rem: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'pie') { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.abs(a - defi.vrai) <= Math.max(0.15, 0.02 * defi.vrai); noterP(ok); }
    else { ok = defi.v === defi.cas && defi.rem === defi.cas; noterD(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const champ = (id, lab, val, set, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0', fontSize: 14 }}><label htmlFor={id}>{lab}</label>
      <input id={id} value={val} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('su-verif')?.click()} onChange={ev => set(ev.target.value)} style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/>{unite}</div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['pie', 'Trouver le PIE'], ['diagnostic', 'Diagnostiquer']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'pie' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : point isoélectrique de {defi.solide.nom}</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une poudre de <strong>{defi.solide.nom}</strong> donne ζ = <strong>{fz(defi.za)}</strong> à pH <strong>{fr(defi.pHa)}</strong> et ζ = <strong>{fz(defi.zb)}</strong> à pH <strong>{fr(defi.pHb)}</strong>. Par interpolation linéaire, quel est le pH du point isoélectrique ? (Réponse au dixième de pH près.)</div>
        {champ('su-r', 'pH du PIE :', defi.rep, v => setDefi(d => ({ ...d, rep: v, verifie: false })), '')}
        <IndiceDefi cache={false}>pH(PIE) = pH₁ + ζ₁ ÷ (ζ₁ − ζ₂) × (pH₂ − pH₁), avec ζ₁ et ζ₂ de signes opposés. Tolérance : 0,15 unité de pH.</IndiceDefi>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : diagnostiquer une suspension</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une suspension de <strong>{defi.solide.nom}</strong> (PIE ≈ {fr(defi.solide.pie)}) est préparée à <strong>pH {fr(defi.pH)}</strong>{defi.c > 0.001 ? <>, avec <strong>{defi.sel === 'CaCl2' ? 'du chlorure de calcium' : 'du chlorure de sodium'} à {concTxt(defi.c)}</strong></> : <>, dans de l’eau déminéralisée</>}. On mesure ζ = <strong>{fz(defi.z)}</strong>.</div>
        <SvgParticules z={defi.z} c={defi.c} sel={defi.sel} solideNom={defi.solide.court}/>
        <label htmlFor="su-v" style={{ ...libelle, marginTop: 8 }}>Cause principale de l’état de la suspension</label>
        <select id="su-v" value={defi.v} onChange={ev => setDefi(d => ({ ...d, v: ev.target.value, verifie: false }))} style={{ ...selectStyle, marginBottom: 8 }}>
          <option value="">Choisir…</option>{['ph', 'sel', 'aucune'].map(k => <option key={k} value={k}>{M.CAUSES[k]}</option>)}</select>
        <label htmlFor="su-rem" style={libelle}>Correction à apporter</label>
        <select id="su-rem" value={defi.rem} onChange={ev => setDefi(d => ({ ...d, rem: ev.target.value, verifie: false }))} style={selectStyle}>
          <option value="">Choisir…</option>{['ph', 'sel', 'aucune'].map(k => <option key={k} value={k}>{M.REMEDES[k]}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Comparez le pH au PIE : à moins d’une unité, ζ est faible à cause du pH. Si le pH est loin du PIE mais ζ est faible, cherchez un sel. Si |ζ| dépasse 30 mV, la suspension est stable.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="su-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'pie' && <>pH(PIE) = {fr(defi.pHa)} + {fr(defi.za, 0)} ÷ ({fr(defi.za, 0)} − ({fr(defi.zb, 0)})) × {fr(defi.pHb - defi.pHa)} ≈ {fr(defi.vrai, 2)}.</>}
        {defi.kind === 'diagnostic' && <>{M.CAUSES[defi.cas]} : {M.REMEDES[defi.cas]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const SO = M.solide(ex.solide);
  const zEx = M.zeta({ solide: ex.solide, pH: ex.pH, c: ex.c, sel: ex.sel, disp: ex.disp });
  const majEx = f => setEx(x => ({ ...x, ...f }));
  const IEx = M.forceIonique(ex.c, ex.sel);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="su-sol" style={libelle}>Solide en suspension dans l’eau</label>
      <select id="su-sol" value={ex.solide} onChange={ev => majEx({ solide: ev.target.value })} style={selectStyle}>{M.SOLIDES.map(s => <option key={s.id} value={s.id}>{s.nom} · PIE ≈ {fr(s.pie)}</option>)}</select>
      <label htmlFor="su-exph" style={{ ...libelle, marginTop: 10 }}>pH : {fr(ex.pH, 1)}</label>
      <input id="su-exph" type="range" min="1" max="13" step="0.1" value={ex.pH} onChange={ev => majEx({ pH: parseFloat(ev.target.value) })} aria-label="pH" style={{ width: '100%', accentColor: '#7c3aed' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Le pH règle le signe et la grandeur de la charge de surface.</div>
      <Section titre={`Sel : ${ex.c > 0 ? `${ex.sel === 'CaCl2' ? 'CaCl₂' : 'NaCl'} ${concTxt(ex.c)}` : 'aucun'}`} ouvert={!!ouv.sel} onBascule={() => bascule('sel')}>
        <label htmlFor="su-exsel" style={libelle}>Sel ajouté</label>
        <select id="su-exsel" value={ex.sel} onChange={ev => majEx({ sel: ev.target.value })} style={selectStyle}><option value="NaCl">Chlorure de sodium NaCl (ions Na⁺, Cl⁻)</option><option value="CaCl2">Chlorure de calcium CaCl₂ (ions Ca²⁺, Cl⁻)</option></select>
        <label htmlFor="su-exc" style={{ ...libelle, marginTop: 8 }}>Concentration : {concTxt(ex.c)}</label>
        <input id="su-exc" type="range" min="0" max={CONCS.length - 1} step="1" value={Math.max(0, CONCS.indexOf(ex.c))} onChange={ev => majEx({ c: CONCS[parseInt(ev.target.value, 10)] })} aria-label="Concentration en sel" style={{ width: '100%', accentColor: '#7c3aed' }}/>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Un ion de charge 2+ écrante davantage : à même concentration, CaCl₂ pèse comme 3 fois NaCl dans la force ionique.</div>
      </Section>
      <Section titre={`Dispersant : ${ex.disp ? 'polyacrylate de sodium' : 'aucun'}`} ouvert={!!ouv.disp} onBascule={() => bascule('disp')}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: KIT.txt, minHeight: 36 }}>
          <input type="checkbox" checked={ex.disp} onChange={ev => majEx({ disp: ev.target.checked })} style={{ width: 20, height: 20 }}/>Ajouter le polyacrylate de sodium</label>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Polymère anionique : il ajoute des charges − tant qu’il est ionisé (pH au-dessus de son pKₐ ≈ 4,5).</div>
      </Section>
    </div>);
  const scenes = (
    <div style={styleBoite}>
      {enExplore && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La suspension et son potentiel zêta</div>}
      <SvgParticules z={zEx} c={ex.c} sel={ex.sel} disp={ex.disp} solideNom={SO.court}/>
      <div style={{ height: 8 }}/>
      <SvgZeta solide={ex.solide} pH={ex.pH} c={ex.c} sel={ex.sel} disp={ex.disp}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Potentiel zêta ζ" valeur={fz(zEx)} couleur={COL.violet}/>
      <LigneMesure nom="Signe de la charge de surface" valeur={M.signe(zEx) === '+' ? 'positive' : M.signe(zEx) === '−' ? 'négative' : 'nulle'}/>
      <LigneMesure nom="État de la suspension" valeur={ZV[M.verdict(zEx)]} couleur={M.verdict(zEx) === 'stable' ? COL.vert : M.verdict(zEx) === 'limite' ? COL.orange : COL.rouge}/>
      <LigneMesure nom="Écart au PIE (pH − PIE)" valeur={fr(ex.pH - SO.pie, 1)}/>
      <LigneMesure nom="Épaisseur de la couche de contre-ions (≈ longueur de Debye)" valeur={`${fr(M.longueurDebye(IEx), IEx > 0.01 ? 1 : 0)} nm`}/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Plus il y a de sel, plus la couche est mince (de l’ordre de 100 nm pour une eau très pure, 1 nm pour 0,1 mol/L).</div>
    </div>);
  const sectionTableau = enExplore && (
    <Section titre="Valeurs usuelles : points isoélectriques" ouvert={!!ouv.tab} onBascule={() => bascule('tab')}>
      <ul style={liste}>{M.SOLIDES.map(s => <li key={s.id}>{s.nom} : PIE ≈ {fr(s.pie)} (groupes {s.surf})</li>)}</ul>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Valeurs usuelles de la littérature : elles varient d’environ une unité selon l’échantillon. Le TiO₂ enrobé d’alumine se comporte comme l’alumine.</div>
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>Alumine sans sel : tracez à la main l’intervalle de pH où la suspension est stable. Où est-il, par rapport au PIE ?</li>
      <li>Même pH loin du PIE : ajoutez du NaCl, puis du CaCl₂ à la même concentration. Lequel fait floculer le plus tôt ?</li>
      <li>À pH 8,5 (PIE de l’alumine), ajoutez le dispersant. Que se passe-t-il à pH 3 avec le dispersant ?</li>
      <li>Silice (PIE ≈ 2,5) : à quel pH est-elle stable ? Et à pH 7 : quel est le signe de la charge ?</li>
      <li>Une peinture contient de l’alumine (charges +) et un liant polymère (charges −), tous deux à pH 5 : que peut-il se passer ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>La surface d’un oxyde est positive sous son PIE et négative au-dessus ; ζ = 0 au PIE</li>
        <li>Suspension stable : |ζ| ≳ 30 mV ; floculation quand |ζ| est faible</li>
        <li>Le sel écrante les charges : plus de sel, plus de risque de floculation</li>
        <li>Ne jamais passer par le PIE (choc de pH) ; des particules plus petites sont plus stables</li>
        <li>Dispersant électrostatique en milieu aqueux : polyélectrolyte anionique (polyacrylate)</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle qualitatif</strong> : ζ suit une courbe en tangente hyperbolique autour du PIE (plateau à ± 60 mV), écrantée par le sel. Ce n’est ni le modèle DLVO complet ni une mesure : seules les tendances sont fiables.</li>
      <li><strong>PIE</strong> : valeurs usuelles de la littérature, à ± 1 unité de pH selon l’échantillon, la pureté et la méthode. Pour une poudre réelle, on mesure ζ en fonction du pH (électrophorèse).</li>
      <li><strong>Seuils</strong> : |ζ| ≥ 30 mV pour « stable » et |ζ| &lt; 15 mV pour « floculation » sont des repères pratiques, pas des limites physiques.</li>
      <li><strong>Sel</strong> : l’écrantage dépend de la force ionique (un ion 2+ pèse davantage) ; nous négligeons l’adsorption spécifique d’ions, qui peut déplacer le PIE ou inverser la charge.</li>
      <li><strong>Dispersant</strong> : seul le polyacrylate (électrostatique, milieu aqueux, ionisé au-dessus de pKₐ ≈ 4,5) est traité ; la répulsion stérique et le mouillage sont vus ailleurs. Les chocs de pH et la cinétique (vitesse de floculation, sédimentation) ne sont pas modélisés.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{idE === 'pie-num' ? 'Données' : 'Mesures'}</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .su-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .su-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .su-col { display: flex; flex-direction: column; gap: 12px; }
        .su-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .su-l1.cote .su-carte { order: 2; } .su-l1.cote .su-main { order: 1; }
          .su-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .su-ex > * { grid-column: 1; }
          .su-ex > .su-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .su-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .su-in { animation: su-fondu 0.35s ease-out; } @keyframes su-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .su-l1 *, .su-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Stabilité d’une suspension : charge, pH et sel</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Des particules solides restent dispersées dans l’eau tant qu’elles <strong>se repoussent</strong>. Cette répulsion vient de leur <strong>charge de surface</strong>, qui dépend du <strong>pH</strong> et que le <strong>sel</strong> affaiblit. Un <strong>dispersant</strong> peut la renforcer.</div>
      {enGuide && <div className="su-l1 cote">
        <div className="su-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="su-main">
          <div className="su-col">
            {sceneBloc && <div className="su-in">{sceneBloc}</div>}
            {curseurGuide && <div className="su-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="su-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'pie' ? suiviP : suiviD}/></div>}
      {enExplore && <>
        <div className="su-ex">
          {scenes}
          <div className="su-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        {sectionTableau}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
