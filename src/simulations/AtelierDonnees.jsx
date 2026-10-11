import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche } from "../commun";
import { ENONCES, nouvelEnonce, melange, nb } from "./AtelierDonneesBanque";
import { parDomaine } from "./ordreDomaines";

// ====================================================
//  SIM 34 — ATELIER « EXTRAIRE LES DONNÉES D'UN ÉNONCÉ » (compétence S'approprier)
// ====================================================
// Démarche travaillée : 1. de quelle grandeur parle la question ?  2. quelles données sont utiles ?
// 3. que représente chaque valeur, et dans quelle unité faut-il l'écrire ?  4. que faut-il calculer avant la formule ?
// 5. que faut-il chercher qui n'est pas dans l'énoncé ?

const COMPETENCES = ['Comprendre la question', 'Repérer les données utiles', 'Associer grandeur, valeur et unité', 'Préparer le calcul'];
const TOL = 0.01, TOL_DER = 0.015;

const jeuxQuoi = ex => {
  const set = new Set();
  Object.values(ex.b.tokens).forEach(t => set.add(t.quoi));
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
};
const lignes = ex => ex.b.utiles.filter(id => ex.b.tokens[id]);
const rowOk = (ex, rep, id) => {
  const r = (rep.tab || {})[id] || {}, t = ex.b.tokens[id], x = lireNombre(r.val);
  return r.quoi === t.quoi && isFinite(x) && proche(x, t.use.val, TOL);
};
const derOk = (rep, d) => { const x = lireNombre((rep.der || {})[d.id]); return isFinite(x) && proche(x, d.val, TOL_DER); };
const selBilan = (ex, sel) => {
  const u = new Set(ex.b.utiles), bons = sel.filter(i => u.has(i)), mauvais = sel.filter(i => !u.has(i)), manques = ex.b.utiles.filter(i => !sel.includes(i));
  return { bons, mauvais, manques, ok: !mauvais.length && !manques.length };
};
const stagesDe = ex => ['cherche', 'sel', 'tab', ...(ex.b.derivees && ex.b.derivees.length ? ['der'] : []), ...(ex.b.manque ? ['manque'] : [])];
const repVide = () => ({ cherche: null, sel: [], tab: {}, der: {}, manque: null });
const propositions = (o, graine) => melange([o.bonne, ...o.faux], graine);

// ── Énoncé avec données cliquables ──
function Texte({ ex, sel, onToggle, marque }) {
  const interactif = !!onToggle;
  const style = (id) => {
    const m = marque ? marque(id) : null, choisi = sel && sel.includes(id);
    let fond = interactif ? '#e0f2fe' : 'transparent', bord = interactif ? '1.5px dotted #38bdf8' : '1.5px solid transparent';
    if (m === 'bon') { fond = '#bbf7d0'; bord = '1.5px solid #16a34a'; }
    else if (m === 'mauvais') { fond = '#fecaca'; bord = '1.5px solid #dc2626'; }
    else if (m === 'manque') { fond = 'white'; bord = `2px dashed ${ORANGE_GUIDE}`; }
    else if (m === 'utile') { fond = '#dcfce7'; bord = '1.5px solid #86efac'; }
    else if (choisi) { fond = '#fde68a'; bord = `1.5px solid ${ORANGE_GUIDE}`; }
    return { font: 'inherit', color: KIT.txt, padding: '1px 5px', borderRadius: 5, background: fond, border: bord, cursor: interactif ? 'pointer' : 'default' };
  };
  return (
    <div style={{ fontSize: 16, lineHeight: 2, color: KIT.txt }}>
      {ex.b.texte.map((m, i) => typeof m === 'string' ? <span key={i}>{m}</span> : (
        <button key={i} data-id={m.t} data-utile={ex.b.utiles.includes(m.t) ? 'true' : 'false'} aria-pressed={!!(sel && sel.includes(m.t))}
          disabled={!interactif} onClick={() => onToggle(m.t)} style={style(m.t)}>{ex.b.tokens[m.t].aff}</button>
      ))}
    </div>
  );
}

const Verdict = ({ ok, children }) => (
  <div style={{ fontSize: 14, marginTop: 6, fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅ ' : '❌ '}{children}</div>
);
const Correction = ({ children }) => (
  <div style={{ fontSize: 13.5, marginTop: 6, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', color: KIT.txt }}>{children}</div>
);

export function SimulationAtelierDonnees() {
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('atelier-donnees-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [bilan, setBilan] = useEtatPersistant('atelier-donnees-bilan-v1', { defis: 0, cumul: [0, 0, 0, 0] });
  const [choix, setChoix] = useState({ id: 'paroi', q: 0 });
  const [ex, setEx] = useState(() => nouvelEnonce('paroi', 0));
  const [rep, setRep] = useState(repVide);
  const [chk, setChk] = useState({});             // étapes corrigées
  const [vu, setVu] = useState({});               // corrections demandées
  const [etp, setEtp] = useState(0);              // exploration : dernière étape ouverte
  const [indice, setIndice] = useState({});
  const [gSel, setGSel] = useState([]);           // parcours guidé : données choisies
  const exGuide = useState(() => nouvelEnonce('paroi', 0, { e: 20, L: 4, h: 2.5, lam: 0.25, Ti: 20, Te: -2, an: 1985, prix: 0.17, dur: 24 }))[0];
  const [defiFini, setDefiFini] = useState(false);

  const chargerEx = (id, q) => {
    setEx(nouvelEnonce(id, q)); setRep(repVide()); setChk({}); setVu({}); setEtp(0); setIndice({}); setDefiFini(false);
  };
  const changerMode = m => {
    setMode(m);
    if (m === 'defi') { const d = ENONCES[Math.floor(Math.random() * ENONCES.length)]; const q = Math.floor(Math.random() * 2); setChoix({ id: d.id, q }); chargerEx(d.id, q); }
    else if (m === 'explore') chargerEx(choix.id, choix.q);
  };
  const stages = stagesDe(ex);

  // ── Correction de chaque étape ──
  const okEtape = {
    cherche: rep.cherche === ex.b.cherche.bonne,
    sel: selBilan(ex, rep.sel).ok,
    tab: lignes(ex).every(id => rowOk(ex, rep, id)),
    der: (ex.b.derivees || []).every(d => derOk(rep, d)),
    manque: !!ex.b.manque && rep.manque === ex.b.manque.bonne,
  };
  const toggle = id => { if (chk.sel && !defiFini) setChk(c => ({ ...c, sel: false })); setRep(r => ({ ...r, sel: r.sel.includes(id) ? r.sel.filter(x => x !== id) : [...r.sel, id] })); };
  const sb = selBilan(ex, rep.sel);

  // ── Blocs d'étapes (exploration et défi) ──
  const enDefi = mode === 'defi';
  const montrerFeedback = k => !!(chk[k]);
  const corriger = k => setChk(c => ({ ...c, [k]: true }));
  const barre = (k, i) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      {!enDefi && <button onClick={() => corriger(k)} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>}
      {!enDefi && !okEtape[k] && <button onClick={() => { corriger(k); setVu(v => ({ ...v, [k]: true })); }}
        style={{ fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' }}>voir la correction</button>}
      {!enDefi && (k === 'sel' || k === 'tab') && !indice[k] && <button onClick={() => setIndice(x => ({ ...x, [k]: true }))} style={stylePetitBouton(false)}>💡 Indice</button>}
      {!enDefi && (okEtape[k] || vu[k]) && chk[k] && i === etp && i < stages.length - 1 && <button onClick={() => setEtp(e => e + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Étape suivante ▶</button>}
    </div>
  );
  const titreEtape = (n, t) => <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>{n}. {t}</div>;
  const corrAff = k => enDefi ? defiFini : !!vu[k];

  const blocs = {
    cherche: i => (
      <div key="cherche" style={styleBoite}>
        {titreEtape(i + 1, 'Que demande l’énoncé ?')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {propositions(ex.b.cherche, ex.graine).map(o => (
            <button key={o} data-ok={o === ex.b.cherche.bonne ? 'true' : 'false'} onClick={() => { setRep(r => ({ ...r, cherche: o })); setChk(c => ({ ...c, cherche: false })); }}
              style={{ ...styleBouton(rep.cherche === o, '#0ea5e9'), textAlign: 'left', padding: '6px 10px' }}>{o}</button>
          ))}
        </div>
        {montrerFeedback('cherche') && <Verdict ok={okEtape.cherche}>{okEtape.cherche ? 'Oui, c’est bien la grandeur cherchée.' : 'Pas tout à fait : relisez la dernière phrase de l’énoncé et regardez l’unité demandée.'}</Verdict>}
        {corrAff('cherche') && <Correction>Réponse : {ex.b.cherche.bonne}</Correction>}
        {barre('cherche', stages.indexOf('cherche'))}
      </div>),
    sel: i => (
      <div key="sel" style={styleBoite}>
        {titreEtape(i + 1, 'Cliquez sur les données utiles pour répondre à la question')}
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Cliquez dans le texte de l’énoncé (en haut) : un deuxième clic annule la sélection. {rep.sel.length} donnée{rep.sel.length > 1 ? 's' : ''} sélectionnée{rep.sel.length > 1 ? 's' : ''}.</div>
        {indice.sel && <Correction>Il y a {ex.b.utiles.length} données utiles. Pour chaque nombre, demandez-vous : « si je le supprime, puis-je encore répondre ? »</Correction>}
        {(montrerFeedback('sel') || (enDefi && defiFini)) && (
          <div>
            <Verdict ok={sb.ok}>{sb.ok ? 'Toutes les données utiles, et seulement elles.' : `${sb.mauvais.length ? `${sb.mauvais.length} donnée(s) inutile(s) choisie(s). ` : ''}${sb.manques.length ? `${sb.manques.length} donnée(s) utile(s) oubliée(s).` : ''}`}</Verdict>
            {sb.mauvais.map(id => <div key={id} style={{ fontSize: 13.5, color: '#9a3412', marginTop: 4 }}>❌ <b>{ex.b.tokens[id].aff}</b> ({ex.b.tokens[id].quoi}) : {ex.b.raisons[id] || 'cette donnée n’intervient pas dans le calcul demandé.'}</div>)}
            {(vu.sel || (enDefi && defiFini)) && sb.manques.map(id => <div key={id} style={{ fontSize: 13.5, color: '#9a3412', marginTop: 4 }}>⚠ À ne pas oublier : <b>{ex.b.tokens[id].aff}</b> ({ex.b.tokens[id].quoi}).</div>)}
            {!vu.sel && !(enDefi && defiFini) && sb.manques.length > 0 && <div style={{ fontSize: 13.5, color: '#9a3412', marginTop: 4 }}>⚠ Il manque encore {sb.manques.length} donnée(s) utile(s).</div>}
          </div>)}
        {barre('sel', stages.indexOf('sel'))}
      </div>),
    tab: i => {
      const noms = jeuxQuoi(ex);
      return (
        <div key="tab" style={styleBoite}>
          {titreEtape(i + 1, 'Associez à chaque donnée utile sa grandeur, puis écrivez sa valeur dans l’unité demandée')}
          {indice.tab && <Correction>Pensez aux conversions : cm → m, mL → L, kW → W, heures → secondes, selon l’unité imposée à droite.</Correction>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lignes(ex).map(id => {
              const t = ex.b.tokens[id], r = (rep.tab || {})[id] || {};
              const afficher = chk.tab || (enDefi && defiFini);
              const ok = rowOk(ex, rep, id);
              return (
                <div key={id} data-ligne={id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b style={{ minWidth: 110, fontSize: 14 }}>{t.aff}</b>
                  <span>→</span>
                  <select aria-label={`Grandeur de ${t.aff}`} value={r.quoi || ''} onChange={x => { const v = x.target.value; setRep(q => ({ ...q, tab: { ...q.tab, [id]: { ...q.tab[id], quoi: v } } })); setChk(c => ({ ...c, tab: false })); }}
                    style={{ fontSize: 14, padding: '4px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, maxWidth: 260 }}>
                    <option value="">— grandeur —</option>
                    {noms.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input aria-label={`Valeur de ${t.aff}`} placeholder="valeur" value={r.val ?? ''} onChange={x => { const v = x.target.value; setRep(q => ({ ...q, tab: { ...q.tab, [id]: { ...q.tab[id], val: v } } })); setChk(c => ({ ...c, tab: false })); }}
                    style={{ width: 90, fontSize: 14, padding: '4px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/>
                  <span style={{ fontSize: 14, color: KIT.txt2 }}>{t.use.u}</span>
                  {afficher && <span style={{ fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅' : '❌'}</span>}
                  {afficher && !ok && (vu.tab || (enDefi && defiFini)) && <span style={{ fontSize: 13, color: '#075985' }}>→ {t.quoi} = {nb(t.use.val)} {t.use.u}</span>}
                </div>);
            })}
          </div>
          {chk.tab && !enDefi && <Verdict ok={okEtape.tab}>{okEtape.tab ? 'Toutes les lignes sont justes.' : 'Au moins une ligne est à revoir (grandeur ou valeur/unité).'}</Verdict>}
          {barre('tab', stages.indexOf('tab'))}
        </div>);
    },
    der: i => (
      <div key="der" style={styleBoite}>
        {titreEtape(i + 1, 'Calculez les grandeurs intermédiaires dont vous avez besoin')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ex.b.derivees.map(d => {
            const afficher = chk.der || (enDefi && defiFini), ok = derOk(rep, d);
            return (
              <div key={d.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, minWidth: 220 }}>{d.nom}</span>
                <input aria-label={d.nom} placeholder="?" value={(rep.der || {})[d.id] ?? ''} onChange={x => { const v = x.target.value; setRep(q => ({ ...q, der: { ...q.der, [d.id]: v } })); setChk(c => ({ ...c, der: false })); }}
                  style={{ width: 100, fontSize: 14, padding: '4px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{d.u}</span>
                {afficher && <span style={{ fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅' : '❌'}</span>}
                {afficher && !ok && (vu.der || (enDefi && defiFini)) && <span style={{ fontSize: 13, color: '#075985' }}>→ {d.expr} = {nb(d.val)} {d.u}</span>}
              </div>);
          })}
        </div>
        {chk.der && !enDefi && <Verdict ok={okEtape.der}>{okEtape.der ? 'Les grandeurs intermédiaires sont justes.' : 'Une valeur est à revoir : attention aux unités et aux signes (une température négative !).'}</Verdict>}
        {barre('der', stages.indexOf('der'))}
      </div>),
    manque: i => (
      <div key="manque" style={styleBoite}>
        {titreEtape(i + 1, 'Que faut-il encore chercher ou calculer, qui n’est pas dans l’énoncé ?')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {propositions(ex.b.manque, ex.graine + 7).map(o => (
            <button key={o} data-ok={o === ex.b.manque.bonne ? 'true' : 'false'} onClick={() => { setRep(r => ({ ...r, manque: o })); setChk(c => ({ ...c, manque: false })); }}
              style={{ ...styleBouton(rep.manque === o, '#0ea5e9'), textAlign: 'left', padding: '6px 10px' }}>{o}</button>
          ))}
        </div>
        {chk.manque && !enDefi && <Verdict ok={okEtape.manque}>{okEtape.manque ? 'Exact.' : 'Pas encore : demandez-vous ce que la formule utilisée exige et que l’énoncé ne fournit pas.'}</Verdict>}
        {(vu.manque || (enDefi && defiFini)) && <Correction>{ex.b.manque.bonne}. {ex.b.manque.expl}</Correction>}
        {barre('manque', stages.indexOf('manque'))}
      </div>),
  };

  // ── Score du défi ──
  const frac = (a, b) => (b ? a / b : 1);
  const scores = () => {
    const nl = lignes(ex).length, nd = (ex.b.derivees || []).length, nm = ex.b.manque ? 1 : 0;
    return [
      okEtape.cherche ? 1 : 0,
      Math.max(0, frac(sb.bons.length - sb.mauvais.length, ex.b.utiles.length)),
      frac(lignes(ex).filter(id => rowOk(ex, rep, id)).length, nl),
      frac((ex.b.derivees || []).filter(d => derOk(rep, d)).length + (nm && okEtape.manque ? 1 : 0), nd + nm),
    ];
  };
  const verifierDefi = () => {
    if (defiFini) return;
    setDefiFini(true); setChk({ cherche: true, sel: true, tab: true, der: true, manque: true });
    const s = scores();
    setBilan(b => ({ defis: b.defis + 1, cumul: b.cumul.map((v, i) => v + s[i]) }));
  };
  const sc = defiFini ? scores() : null;

  // ── Parcours guidé (mur de brique) ──
  const eg = exGuide, bg = eg.b;
  const gSb = selBilan(eg, gSel);
  const dejaSel = !!(guide.reussies && guide.reussies[2]);
  const gOptions = (txts, bonne) => ({ options: txts, bonne });
  const ETAPES = [
    { id: 'intro', titre: 'Avant de calculer…',
      texte: <>Un énoncé contient souvent <b>plus de nombres qu’il n’en faut</b>, et parfois <b>pas assez</b>. Cet atelier apprend à trier. Exemple (à gauche) : un mur de brique.</>,
      tache: { type: 'qcm', q: 'Quelle est la toute première chose à faire ?', ...gOptions(['Repérer ce que l’on cherche, en lisant la question', 'Appliquer la première formule qui vient à l’esprit', 'Multiplier toutes les données entre elles'], 0), expl: 'On commence par comprendre la question : sans elle, impossible de savoir quelles données servent.' } },
    { id: 'cherche', titre: 'Que cherche-t-on ?', texte: 'Lisez la dernière phrase de l’énoncé.',
      tache: { type: 'qcm', q: 'Que demande l’énoncé ?', ...gOptions([bg.cherche.bonne, ...bg.cherche.faux], 0), expl: 'Oui : la question porte sur la puissance, c’est-à-dire une énergie par seconde (W).' } },
    { id: 'surligner', titre: 'Repérer les données utiles', texte: 'Cliquez, dans l’énoncé, sur chaque donnée dont vous avez besoin pour répondre. Évitez les « pièges » : certaines données ne servent pas.',
      tache: { type: 'action', ok: gSb.ok, consigne: `Données sélectionnées : ${gSel.length}`,
        attente: gSb.ok ? null : (gSb.mauvais.length ? `❌ ${eg.b.tokens[gSb.mauvais[0]].aff} : ${bg.raisons[gSb.mauvais[0]] || 'cette donnée ne sert pas ici.'}` : gSel.length ? `Il en manque encore ${gSb.manques.length}.` : 'Cliquez sur une donnée.') } },
    { id: 'grandeur', titre: 'Que représente chaque valeur ?', texte: 'Un nombre seul ne veut rien dire : il faut savoir de quoi il s’agit.',
      tache: { type: 'qcm', q: 'Que représente la valeur « 20 cm » ?', ...gOptions(['L’épaisseur du mur', 'La longueur du mur', 'La hauteur du mur', 'La température intérieure'], 0), expl: 'C’est l’épaisseur : elle est dans « Son épaisseur est de 20 cm ». À ne pas confondre avec la longueur (4,0 m) ni la hauteur (2,5 m).' } },
    { id: 'conversion', titre: 'Les unités', texte: 'La loi utilisée demande des unités du système international : l’épaisseur doit être en mètres.',
      tache: { type: 'num', q: 'Écrivez l’épaisseur du mur en mètres.', unite: 'm', vrai: 0.2, tol: 0.01, pieges: [[20, 'Il faut convertir les centimètres en mètres (÷ 100).']], affiche: x => nb(x), expl: '20 cm = 0,20 m.' } },
    { id: 'surface', titre: 'Une grandeur à calculer', texte: 'La loi fait intervenir la surface S du mur, qui n’est pas donnée : on la calcule avec les deux dimensions.',
      tache: { type: 'num', q: 'Calculez la surface S du mur.', unite: 'm²', vrai: 10, tol: 0.01, pieges: [[4, 'La surface est le produit de la longueur par la hauteur.'], [6.5, 'On multiplie les deux dimensions, on ne les additionne pas.']], affiche: x => nb(x), expl: 'S = 4,0 × 2,5 = 10 m².' } },
    { id: 'deltaT', titre: 'Écart de température', texte: 'Il intervient comme différence entre l’intérieur et l’extérieur. Attention au signe de la température extérieure.',
      tache: { type: 'num', q: 'Calculez ΔT = T_int − T_ext.', unite: 'K', vrai: 22, tol: 0.01, pieges: [[18, 'T_ext est négative (−2 °C) : 20 − (−2) = 22, pas 20 − 2.']], affiche: x => nb(x), expl: 'ΔT = 20 − (−2) = 22 K (un écart en °C est aussi un écart en kelvins).' } },
    { id: 'inutile', titre: 'Les données inutiles', texte: 'Deux données n’ont pas servi : l’année de construction et le prix du kWh.',
      tache: { type: 'qcm', q: 'Pourquoi le prix de l’électricité ne sert-il pas ici ?', ...gOptions(['Parce qu’on ne calcule pas un coût mais une puissance', 'Parce que le prix est trop faible', 'Parce qu’il est donné en euros'], 0), expl: 'Le prix servirait à calculer un coût, pas une puissance.' } },
    { id: 'final', titre: 'On peut calculer', texte: 'Avec les bonnes données, dans les bonnes unités : P = λ·S·ΔT / e.',
      tache: { type: 'num', q: 'Calculez la puissance perdue.', unite: 'W', vrai: 275, tol: 0.01, pieges: [[27500, 'Vérifiez que l’épaisseur est en mètres.'], [2.75, 'Vérifiez que l’épaisseur est en mètres, pas en centimètres.']], affiche: x => nb(x), expl: 'P = 0,25 × 10 × 22 / 0,20 = 275 W.' } },
    { id: 'autre', titre: 'Même énoncé, autre question', texte: 'Imaginons maintenant : « Quel est le coût de l’énergie perdue pendant 24 heures ? »',
      tache: { type: 'qcm', q: 'Quelles données deviennent utiles en plus ?', ...gOptions(['Le prix par kWh et la durée', 'L’année de construction', 'Aucune : ce sont les mêmes données'], 0), expl: 'Le coût = puissance × durée × prix. Le prix et la durée deviennent utiles ; l’année de construction, jamais.' } },
    { id: 'bravo', titre: 'Bravo !', texte: <>La démarche : <b>1.</b> que cherche-t-on ? <b>2.</b> quelles données sont utiles ? <b>3.</b> que représente chaque valeur, dans quelle unité ? <b>4.</b> que faut-il calculer avant ? <b>5.</b> que faut-il chercher ? Entraînez-vous maintenant en exploration libre.</> },
  ];
  const nExG = n => { const t = bg.tokens; return t[n] ? t[n].aff : ''; };
  void nExG;
  const toggleG = id => setGSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const peutToggleG = guide.etape === 2 && !dejaSel;
  const marqueG = id => ((guide.etape > 2 || dejaSel) && bg.utiles.includes(id) ? 'utile' : null);
  const finParcours = <button onClick={() => changerMode('explore')} style={styleBouton(true, ORANGE_GUIDE)}>S’entraîner ▶</button>;

  // ── Mise en page ──
  const marqueSel = id => {
    if (!(chk.sel || (enDefi && defiFini))) return null;
    const u = ex.b.utiles.includes(id), c = rep.sel.includes(id);
    if (c && u) return 'bon'; if (c && !u) return 'mauvais';
    if (!c && u && (vu.sel || (enDefi && defiFini))) return 'manque';
    return null;
  };
  const defCourant = ENONCES.find(e => e.id === ex.id);
  const bandeauEnonce = (
    <div style={{ ...styleBoite, background: 'white' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{defCourant.domaine} — {defCourant.titre}</div>
      <Texte ex={ex} sel={rep.sel} onToggle={toggle} marque={marqueSel}/>
    </div>);
  const visibles = enDefi ? stages : stages.filter((_, i) => i <= etp);

  const vueExplore = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {mode === 'explore' && (
        <div style={{ ...styleBoite, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 14 }}>Énoncé :{' '}
            <select aria-label="Choix de l’énoncé" value={choix.id} onChange={x => { const id = x.target.value; setChoix({ id, q: 0 }); chargerEx(id, 0); }}
              style={{ fontSize: 14, padding: 4, borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}>
              {parDomaine(ENONCES).map(([d, l]) => <optgroup key={d} label={d}>{l.map(e => <option key={e.id} value={e.id}>{e.titre}</option>)}</optgroup>)}
            </select></label>
          <span style={{ fontSize: 14 }}>Question :</span>
          {defCourant.noms.map((n, q) => <button key={q} onClick={() => { setChoix(c => ({ ...c, q })); chargerEx(choix.id, q); }} style={stylePetitBouton(choix.q === q, '#0ea5e9')}>{n}</button>)}
          <button onClick={() => chargerEx(choix.id, choix.q)} style={stylePetitBouton(false)}>🎲 Nouvelles valeurs</button>
        </div>)}
      {bandeauEnonce}
      {visibles.map(k => blocs[k](stages.indexOf(k)))}
      {enDefi && !defiFini && <div><button onClick={verifierDefi} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button></div>}
      {enDefi && defiFini && sc && (
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Bilan par compétence</div>
          {COMPETENCES.map((c, i) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ width: 260, fontSize: 14 }}>{c}</span>
              <div style={{ width: 140, height: 10, background: '#e2e8f0', borderRadius: 5 }}><div style={{ width: `${sc[i] * 100}%`, height: '100%', borderRadius: 5, background: sc[i] >= 0.99 ? '#16a34a' : sc[i] >= 0.5 ? '#f59e0b' : '#dc2626' }}/></div>
              <span style={{ fontSize: 13 }}>{Math.round(sc[i] * 100)} %</span>
            </div>))}
          <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Défis faits sur cet appareil : {bilan.defis}.</div>
          <button onClick={() => { const d = ENONCES[Math.floor(Math.random() * ENONCES.length)]; const q = Math.floor(Math.random() * 2); setChoix({ id: d.id, q }); chargerEx(d.id, q); }} style={{ ...styleBouton(true, '#0ea5e9'), marginTop: 8 }}>Nouvel énoncé</button>
        </div>)}
    </div>);

  const vueGuide = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...styleBoite, background: 'white' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{ENONCES[0].domaine} — {ENONCES[0].titre}</div>
        <Texte ex={eg} sel={gSel} onToggle={peutToggleG ? toggleG : null} marque={marqueG}/>
      </div>
    </div>);

  const enGuide = mode === 'guide';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .atd-l1 { display: grid; align-items: start; gap: 12px; grid-template-columns: minmax(0, 1fr); }
        .atd-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (max-width: 960px) { .atd-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Atelier : extraire les données d’un énoncé</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10 }}>Compétence travaillée : <b>S’approprier</b> — comprendre la question, trier les données, repérer les grandeurs et leurs unités.</div>
      <div className={`atd-l1${enGuide ? ' cote' : ''}`}>
        {enGuide ? vueGuide : vueExplore}
        {enGuide && <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>}
      </div>
    </div>
  );
}
