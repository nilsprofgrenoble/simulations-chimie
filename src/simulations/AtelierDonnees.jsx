import { useState } from "react";
import { cardStyle, KIT, styleBouton, stylePetitBouton, styleBoite, ORANGE_GUIDE, lireNombre, proche } from "../commun";
import { ENONCES, nouvelEnonce, melange, nb } from "./AtelierDonneesBanque";
import { parDomaine } from "./ordreDomaines";

// ====================================================
//  SIM 34 — S'APP : EXTRAIRE LES DONNÉES D'UN ÉNONCÉ (compétence S'approprier)
// ====================================================
// La formule à utiliser est donnée avec l'énoncé (choisir la formule relève d'un autre atelier). Démarche travaillée :
// 1. que cherche-t-on ?  2. quelles données de l'énoncé sont utiles ?  3. à quel symbole de la formule correspond chaque donnée,
// et dans quelle unité faut-il l'écrire ?  4. que faut-il calculer avant d'appliquer la formule ?  5. que faut-il chercher qui n'est pas dans l'énoncé ?

const TOL = 0.01, TOL_DER = 0.015;

const etiquette = t => (t.sym ? `${t.quoi} (${t.sym})` : t.quoi);
const jeuxQuoi = ex => {
  const m = new Map();
  Object.values(ex.b.tokens).forEach(t => m.set(t.quoi, etiquette(t)));
  return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'));
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
  const style = id => {
    const m = marque ? marque(id) : null, choisi = sel.includes(id);
    let fond = '#e0f2fe', bord = '1.5px dotted #38bdf8';
    if (m === 'bon') { fond = '#bbf7d0'; bord = '1.5px solid #16a34a'; }
    else if (m === 'mauvais') { fond = '#fecaca'; bord = '1.5px solid #dc2626'; }
    else if (m === 'manque') { fond = 'white'; bord = `2px dashed ${ORANGE_GUIDE}`; }
    else if (choisi) { fond = '#fde68a'; bord = `1.5px solid ${ORANGE_GUIDE}`; }
    return { font: 'inherit', color: KIT.txt, padding: '1px 5px', borderRadius: 5, background: fond, border: bord, cursor: 'pointer' };
  };
  return (
    <div style={{ fontSize: 16, lineHeight: 2, color: KIT.txt }}>
      {ex.b.texte.map((m, i) => typeof m === 'string' ? <span key={i}>{m}</span> : (
        <button key={i} data-id={m.t} data-utile={ex.b.utiles.includes(m.t) ? 'true' : 'false'} aria-pressed={sel.includes(m.t)}
          onClick={() => onToggle(m.t)} style={style(m.t)}>{ex.b.tokens[m.t].aff}</button>
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
  const [choix, setChoix] = useState({ id: 'reservoir', q: 0 });
  const [ex, setEx] = useState(() => nouvelEnonce('reservoir', 0));
  const [rep, setRep] = useState(repVide);
  const [chk, setChk] = useState({});             // étapes corrigées
  const [vu, setVu] = useState({});               // corrections demandées
  const [etp, setEtp] = useState(0);              // dernière étape ouverte
  const [indice, setIndice] = useState({});

  const charger = (id, q) => { setEx(nouvelEnonce(id, q)); setRep(repVide()); setChk({}); setVu({}); setEtp(0); setIndice({}); };
  const stages = stagesDe(ex);

  const okEtape = {
    cherche: rep.cherche === ex.b.cherche.bonne,
    sel: selBilan(ex, rep.sel).ok,
    tab: lignes(ex).every(id => rowOk(ex, rep, id)),
    der: (ex.b.derivees || []).every(d => derOk(rep, d)),
    manque: !!ex.b.manque && rep.manque === ex.b.manque.bonne,
  };
  const toggle = id => { setChk(c => ({ ...c, sel: false })); setRep(r => ({ ...r, sel: r.sel.includes(id) ? r.sel.filter(x => x !== id) : [...r.sel, id] })); };
  const sb = selBilan(ex, rep.sel);
  const corriger = k => setChk(c => ({ ...c, [k]: true }));

  const barre = (k, i) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <button onClick={() => corriger(k)} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>
      {!okEtape[k] && <button onClick={() => { corriger(k); setVu(v => ({ ...v, [k]: true })); }}
        style={{ fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' }}>voir la correction</button>}
      {(k === 'sel' || k === 'tab') && !indice[k] && <button onClick={() => setIndice(x => ({ ...x, [k]: true }))} style={stylePetitBouton(false)}>💡 Indice</button>}
      {(okEtape[k] || vu[k]) && chk[k] && i === etp && i < stages.length - 1 && <button onClick={() => setEtp(e => e + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Étape suivante ▶</button>}
    </div>
  );
  const titreEtape = (n, t) => <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>{n}. {t}</div>;

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
        {chk.cherche && <Verdict ok={okEtape.cherche}>{okEtape.cherche ? 'Oui, c’est bien la grandeur cherchée.' : 'Pas tout à fait : relisez la dernière phrase de l’énoncé et regardez l’unité demandée.'}</Verdict>}
        {vu.cherche && <Correction>Réponse : {ex.b.cherche.bonne}</Correction>}
        {barre('cherche', stages.indexOf('cherche'))}
      </div>),
    sel: i => (
      <div key="sel" style={styleBoite}>
        {titreEtape(i + 1, 'Cliquez sur les données utiles pour répondre à la question')}
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Cliquez dans le texte de l’énoncé (en haut) : un deuxième clic annule la sélection. {rep.sel.length} donnée{rep.sel.length > 1 ? 's' : ''} sélectionnée{rep.sel.length > 1 ? 's' : ''}.</div>
        {indice.sel && <Correction>Il y a {ex.b.utiles.length} données utiles. Repérez dans la formule chaque grandeur dont il faut connaître la valeur, puis cherchez-la dans l’énoncé.</Correction>}
        {chk.sel && (
          <div>
            <Verdict ok={sb.ok}>{sb.ok ? 'Toutes les données utiles, et seulement elles.' : `${sb.mauvais.length ? `${sb.mauvais.length} donnée(s) inutile(s) choisie(s). ` : ''}${sb.manques.length ? `${sb.manques.length} donnée(s) utile(s) oubliée(s).` : ''}`}</Verdict>
            {sb.mauvais.map(id => <div key={id} style={{ fontSize: 13.5, color: '#9a3412', marginTop: 4 }}>❌ <b>{ex.b.tokens[id].aff}</b> ({ex.b.tokens[id].quoi}) : {(ex.b.raisons || {})[id] || 'cette donnée n’intervient pas dans le calcul demandé.'}</div>)}
            {vu.sel && sb.manques.map(id => <div key={id} style={{ fontSize: 13.5, color: '#9a3412', marginTop: 4 }}>⚠ À ne pas oublier : <b>{ex.b.tokens[id].aff}</b> ({ex.b.tokens[id].quoi}).</div>)}
            {!vu.sel && sb.manques.length > 0 && <div style={{ fontSize: 13.5, color: '#9a3412', marginTop: 4 }}>⚠ Il manque encore {sb.manques.length} donnée(s) utile(s).</div>}
          </div>)}
        {barre('sel', stages.indexOf('sel'))}
      </div>),
    tab: i => {
      const noms = jeuxQuoi(ex);
      return (
        <div key="tab" style={styleBoite}>
          {titreEtape(i + 1, 'Associez chaque donnée utile à la grandeur de la formule, puis écrivez sa valeur dans l’unité demandée')}
          {indice.tab && <Correction>Pensez aux conversions : cm → m, mL → L, kW → W, heures → secondes, selon l’unité imposée à droite.</Correction>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lignes(ex).map(id => {
              const t = ex.b.tokens[id], r = (rep.tab || {})[id] || {}, ok = rowOk(ex, rep, id);
              return (
                <div key={id} data-ligne={id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b style={{ minWidth: 110, fontSize: 14 }}>{t.aff}</b>
                  <span>→</span>
                  <select aria-label={`Grandeur de ${t.aff}`} value={r.quoi || ''} onChange={x => { const v = x.target.value; setRep(q => ({ ...q, tab: { ...q.tab, [id]: { ...q.tab[id], quoi: v } } })); setChk(c => ({ ...c, tab: false })); }}
                    style={{ fontSize: 14, padding: '4px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, maxWidth: 300 }}>
                    <option value="">— grandeur —</option>
                    {noms.map(([q, lab]) => <option key={q} value={q}>{lab}</option>)}
                  </select>
                  <input aria-label={`Valeur de ${t.aff}`} placeholder="valeur" value={r.val ?? ''} onChange={x => { const v = x.target.value; setRep(q => ({ ...q, tab: { ...q.tab, [id]: { ...q.tab[id], val: v } } })); setChk(c => ({ ...c, tab: false })); }}
                    style={{ width: 90, fontSize: 14, padding: '4px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/>
                  <span style={{ fontSize: 14, color: KIT.txt2 }}>{t.use.u}</span>
                  {chk.tab && <span style={{ fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅' : '❌'}</span>}
                  {chk.tab && !ok && vu.tab && <span style={{ fontSize: 13, color: '#075985' }}>→ {etiquette(t)} = {nb(t.use.val)} {t.use.u}</span>}
                </div>);
            })}
          </div>
          {chk.tab && <Verdict ok={okEtape.tab}>{okEtape.tab ? 'Toutes les lignes sont justes.' : 'Au moins une ligne est à revoir (grandeur ou valeur/unité).'}</Verdict>}
          {barre('tab', stages.indexOf('tab'))}
        </div>);
    },
    der: i => (
      <div key="der" style={styleBoite}>
        {titreEtape(i + 1, 'Calculez les grandeurs intermédiaires dont vous avez besoin')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ex.b.derivees.map(d => {
            const ok = derOk(rep, d);
            return (
              <div key={d.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, minWidth: 220 }}>{d.nom}</span>
                <input aria-label={d.nom} placeholder="?" value={(rep.der || {})[d.id] ?? ''} onChange={x => { const v = x.target.value; setRep(q => ({ ...q, der: { ...q.der, [d.id]: v } })); setChk(c => ({ ...c, der: false })); }}
                  style={{ width: 100, fontSize: 14, padding: '4px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{d.u}</span>
                {chk.der && <span style={{ fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅' : '❌'}</span>}
                {chk.der && !ok && vu.der && <span style={{ fontSize: 13, color: '#075985' }}>→ {d.expr} = {nb(d.val)} {d.u}</span>}
              </div>);
          })}
        </div>
        {chk.der && <Verdict ok={okEtape.der}>{okEtape.der ? 'Les grandeurs intermédiaires sont justes.' : 'Une valeur est à revoir : attention aux unités et aux signes (une température négative !).'}</Verdict>}
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
        {chk.manque && <Verdict ok={okEtape.manque}>{okEtape.manque ? 'Exact.' : 'Pas encore : demandez-vous ce que la formule utilisée exige et que l’énoncé ne fournit pas.'}</Verdict>}
        {vu.manque && <Correction>{ex.b.manque.bonne}. {ex.b.manque.expl}</Correction>}
        {barre('manque', stages.indexOf('manque'))}
      </div>),
  };

  const marqueSel = id => {
    if (!chk.sel) return null;
    const u = ex.b.utiles.includes(id), c = rep.sel.includes(id);
    if (c && u) return 'bon'; if (c && !u) return 'mauvais';
    if (!c && u && vu.sel) return 'manque';
    return null;
  };
  const defCourant = ENONCES.find(e => e.id === ex.id);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>S’APP : extraire les données d’un énoncé</h2>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Compétence <b>S’approprier</b> : comprendre la question, trier les données, associer chaque donnée à la grandeur de la formule, et choisir la bonne unité.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...styleBoite, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 14 }}>Énoncé :{' '}
            <select aria-label="Choix de l’énoncé" value={choix.id} onChange={x => { const id = x.target.value; setChoix({ id, q: 0 }); charger(id, 0); }}
              style={{ fontSize: 14, padding: 4, borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}>
              {parDomaine(ENONCES).map(([d, l]) => <optgroup key={d} label={d}>{l.map(e => <option key={e.id} value={e.id}>{e.titre}</option>)}</optgroup>)}
            </select></label>
          <span style={{ fontSize: 14 }}>Question :</span>
          {defCourant.noms.map((n, q) => <button key={q} onClick={() => { setChoix(c => ({ ...c, q })); charger(choix.id, q); }} style={stylePetitBouton(choix.q === q, '#0ea5e9')}>{n}</button>)}
          <button onClick={() => charger(choix.id, choix.q)} style={stylePetitBouton(false)}>🎲 Nouvelles valeurs</button>
        </div>
        <div style={{ ...styleBoite, background: 'white' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{defCourant.domaine} — {defCourant.titre}</div>
          <Texte ex={ex} sel={rep.sel} onToggle={toggle} marque={marqueSel}/>
          <div data-formule="1" style={{ marginTop: 8, background: '#f1f5f9', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '6px 10px', fontSize: 15, color: KIT.txt }}>
            <b>Formule à utiliser :</b> {ex.b.solution.txt}
          </div>
        </div>
        {stages.filter((_, i) => i <= etp).map(k => blocs[k](stages.indexOf(k)))}
      </div>
    </div>
  );
}
