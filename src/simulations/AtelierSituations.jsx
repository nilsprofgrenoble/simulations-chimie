import CodeExo from '../CodeExo';
import { useMemo, useState } from "react";
import { KIT, styleBouton, stylePetitBouton, styleBoite, ORANGE_GUIDE, ARetenir, avecIndices } from "../commun";
import { useSuivi } from "../suivi";
import { Pic } from "../Pictos";
import { mel, champOk } from "./AtelierSituationsBanque";
import { Visuel, EnonceLisible } from "./SchemasC1";

// ====================================================
//  « COMPRENDRE UNE SITUATION » : exercices à étapes (QCM et saisies), affichés dans l'atelier S'APP (sim 34)
// ====================================================
// La banque est dans AtelierSituationsBanque.js. Une étape corrigée juste (ou dont la correction a été demandée) ouvre la suivante.

const VERT = '#15803d', ROUGE = '#b91c1c';
const NB = ' ';
const T = s => (typeof s === 'string'
  ? avecIndices(s.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NB}`).replace(/(\d) (?=[A-Za-zµ°%€Ωθ²³]|h\b)/g, `$1${NB}`).replace(/ ([:;?!])/g, `${NB}$1`))
  : s);
const Verdict = ({ ok, children }) => <div style={{ fontSize: 14, marginTop: 8, fontWeight: 700, color: ok ? VERT : ROUGE }}>{ok ? '✅ ' : '❌ '}{children}</div>;
const Expl = ({ ok, children }) => <div style={{ fontSize: 13.5, marginTop: 3, marginLeft: 4, color: ok == null ? KIT.txt : ok ? '#166534' : '#991b1b', lineHeight: 1.5 }}>{children}</div>;
const choix = etat => ({
  ...styleBouton(etat === 'sel', '#0ea5e9'), textAlign: 'left', padding: '6px 10px', fontWeight: 600, lineHeight: 1.45,
  ...(etat === 'bon' ? { background: '#dcfce7', borderColor: VERT, color: '#14532d' } : {}),
  ...(etat === 'faux' ? { background: '#fee2e2', borderColor: ROUGE, color: '#7f1d1d' } : {}),
  ...(etat === 'manque' ? { background: 'white', border: `2px dashed ${ORANGE_GUIDE}`, color: KIT.txt } : {}),
});

export function SituationCarte({ def }) {
  const [graine, setGraine] = useState(0);
  const ex = useMemo(() => {
    const c = def.construire();
    return { ...c, perms: c.etapes.map(e => (e.type === 'saisie' ? null : mel(e.o.map((_, i) => i)))) };
  }, [def, graine]);              // eslint-disable-line react-hooks/exhaustive-deps
  const [rep, setRep] = useState({});       // QCM : indice de l'option choisie ; saisie : { champ: texte }
  const [chk, setChk] = useState({});       // étapes corrigées
  const [vu, setVu] = useState({});         // corrections demandées
  const [etp, setEtp] = useState(0);
  const [indice, setIndice] = useState({});
  const nouveau = () => { try { document.activeElement?.blur?.(); } catch { /* sans effet */ } setGraine(g => g + 1); setRep({}); setChk({}); setVu({}); setEtp(0); setIndice({}); };

  const tous = Object.assign({}, ...Object.values(rep).filter(v => v && typeof v === 'object'));   // toutes les saisies (une étape peut s'appuyer sur la précédente)
  const ok = (e, i) => (e.type === 'saisie'
    ? e.champs.every(c => champOk(c, tous))
    : rep[e.id] != null && e.o[rep[e.id]][1]);
  const reussi = ex.etapes.every((e, i) => chk[e.id] && ok(e, i));
  const suivi = useSuivi(`34:${def.id}`, reussi);
  const corriger = (e, i, vue = false) => { if (vue) suivi.vue(); else suivi.etape(ok(e, i)); setChk(c => ({ ...c, [e.id]: true })); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...styleBoite, background: 'white' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{def.domaine} — {T(def.titre)}<CodeExo cle={`34:${def.id}`}/></div>
        <EnonceLisible it={ex} T={T}/>
        {ex.tableau && (
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}>
              <tbody>
                <tr>{ex.tableau.entetes.map((h, i) => <th key={i} style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px', background: '#f1f5f9', whiteSpace: 'nowrap' }}>{T(h)}</th>)}</tr>
                {ex.tableau.lignes.map((l, j) => <tr key={j}>{l.map((c, i) => <td key={i} style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: i === 0 ? 700 : 400 }}>{T(c)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        )}
        <Visuel schema={ex.schema} revele={reussi || ex.etapes.every(e => chk[e.id] && (ok(e) || vu[e.id]))}/>
        <div style={{ marginTop: 8 }}><button onClick={nouveau} style={stylePetitBouton(false)}>🎲 Nouvelle version</button></div>
      </div>
      {ex.etapes.filter((_, i) => i <= etp).map((e, i) => {
        const bon = ok(e, i), corrigee = chk[e.id], voir = vu[e.id];
        return (
          <div key={e.id} data-etape={e.id} style={styleBoite}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Étape {i + 1} · {T(e.titre)}</div>
            <div style={{ fontSize: 14.5, marginBottom: 6 }}>{T(e.q)}</div>
            {indice[e.id] && <div style={{ fontSize: 13.5, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', marginBottom: 6 }}>{T(e.aide)}</div>}
            {e.type === 'saisie' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {e.champs.map(c => {
                  const bonChamp = champOk(c, tous);
                  return (
                    <div key={c.id} data-champ={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, minWidth: 200 }}>{T(c.lib)}</span>
                      <input aria-label={c.lib} inputMode="decimal" placeholder="?" value={(rep[e.id] || {})[c.id] ?? ''}
                        onChange={x => { const v = x.target.value; setRep(r => ({ ...r, [e.id]: { ...(r[e.id] || {}), [c.id]: v } })); setChk(k => ({ ...k, [e.id]: false })); }}
                        style={{ width: 90, fontSize: 14, padding: '4px 6px', borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}/>
                      <span style={{ fontSize: 14, color: KIT.txt2 }}>{T(c.u)}</span>
                      {corrigee && <span style={{ fontWeight: 700, color: bonChamp ? VERT : ROUGE }}>{bonChamp ? '✅' : '❌'}</span>}
                      {corrigee && !bonChamp && voir && <span style={{ fontSize: 13, color: '#075985' }}>→ {Number(c.vrai).toLocaleString('fr-FR', { maximumFractionDigits: c.u === '' ? 0 : 2 })} {c.u}</span>}
                    </div>);
                })}
                {corrigee && <Verdict ok={bon}>{bon ? 'Toutes les valeurs sont justes.' : 'Au moins une valeur est à revoir (relation utilisée, unité, arrondi).'}</Verdict>}
                {corrigee && (bon || voir) && <Expl>{T(e.expl)}</Expl>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ex.perms[i].map(k => {
                  const sel = rep[e.id] === k;
                  const etat = (corrigee || voir) && sel ? (e.o[k][1] ? 'bon' : 'faux') : voir && e.o[k][1] ? 'manque' : sel ? 'sel' : null;
                  return (
                    <div key={k}>
                      <button data-ok={e.o[k][1] ? 'true' : 'false'} onClick={() => { setRep(r => ({ ...r, [e.id]: k })); setChk(c => ({ ...c, [e.id]: false })); }} style={choix(etat)}>{T(e.o[k][0])}</button>
                      {(corrigee || voir) && (sel || (voir && e.o[k][1])) && <Expl ok={e.o[k][1]}>{T(e.o[k][2])}</Expl>}
                    </div>);
                })}
                {corrigee && <Verdict ok={bon}>{bon ? 'Exact.' : 'Pas encore : relisez l’énoncé ou demandez un indice.'}</Verdict>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
              <button onClick={() => corriger(e, i)} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>
              {!(corrigee && bon) && <button onClick={() => { corriger(e, i, true); setVu(v => ({ ...v, [e.id]: true })); }}
                style={{ fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' }}>voir la correction</button>}
              {!indice[e.id] && <button onClick={() => setIndice(x => ({ ...x, [e.id]: true }))} style={stylePetitBouton(false)}><Pic n="bulb"/>Indice</button>}
              {corrigee && (bon || voir) && i === etp && i < ex.etapes.length - 1 && <button onClick={() => setEtp(x => x + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Étape suivante ▶</button>}
            </div>
          </div>);
      })}
      {reussi && ex.retenir && <ARetenir>{ex.retenir.map((r, k) => <div key={k}>{T(r)}</div>)}</ARetenir>}
    </div>
  );
}
