import { useState, useEffect, useMemo, useCallback } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";
import { rest } from "../serveur";
import { lireDevoirs } from "../devoirsServeur";
import { ORDRE_DOMAINES } from "./ordreDomaines";
import { catalogue } from "./catalogue";
import { MAX_EXOS, suiviClasse, infoEcheance, finEcheance } from "../devoirs";

// ═══════════════════════════════════════════════════════════════════════════
//  ONGLET « DEVOIRS » du suivi professeur : créer un devoir pour la classe choisie (titre, exercices, date limite),
//  voir qui a fait quoi, supprimer. « Fait » = réussi après la création du devoir (voir ../devoirs.js).
//  Si le serveur n'a pas encore reçu supabase/06-devoirs.sql, l'onglet l'explique et ne casse rien.
// ═══════════════════════════════════════════════════════════════════════════
const ROSE = '#e11d48';
const champ = { padding: '7px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box' };
const COULEURS = { retard: '#b91c1c', urgent: '#c2410c', ok: '#15803d', aucune: '#64748b' };

// Filtres de la liste d'exercices : « tous », un thème du programme, les calculs (REA, sans thème) ou les défis de simulation
const FILTRES_SPECIAUX = [['reussir', '🧮 Calculs (REA, tous thèmes)'], ['defis', '🎯 Défis des simulations']];
const garde = (theme, i) => theme === 'tous' || (theme === 'reussir' ? i.comp === 'REA' : theme === 'defis' ? i.comp === 'DÉFI' : i.domaine === theme);

// preset (facultatif) : { titre, cles, eleves } pour pré-remplir le formulaire, par exemple depuis « À reprendre »
export function DevoirsProf({ classe, eleves, lignes, preset }) {
  const [devoirs, setDevoirs] = useState(null), [dispo, setDispo] = useState(true), [cible, setCible] = useState(true);
  const [titre, setTitre] = useState(preset?.titre || ''), [echeance, setEcheance] = useState(''), [choix, setChoix] = useState(preset?.cles || []), [recherche, setRecherche] = useState('');
  const [theme, setTheme] = useState(preset ? 'tous' : classe.chapitres?.[0] || 'tous');
  const [certains, setCertains] = useState(!!preset?.eleves?.length), [visés, setVisés] = useState(preset?.eleves || []);
  const [erreur, setErreur] = useState(''), [msg, setMsg] = useState(''), [occupe, setOccupe] = useState(false), [version, setVersion] = useState(0);
  const items = useMemo(() => catalogue(), []);
  const par = useMemo(() => new Map(items.map(i => [i.cle, i])), [items]);

  useEffect(() => {
    let vivant = true;
    lireDevoirs(classe.id).then(r => { if (vivant) { setDevoirs(r.liste); setDispo(r.dispo); setCible(r.cible); if (r.erreur) setErreur(r.erreur); } });
    return () => { vivant = false; };
  }, [classe.id, version]);

  const proteger = useCallback(async f => { setErreur(''); setMsg(''); setOccupe(true); try { await f(); } catch (e) { setErreur(e.message); } setOccupe(false); }, []);
  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return items.filter(i => garde(theme, i) && (!q || i.titre.toLowerCase().includes(q) || i.comp.toLowerCase().includes(q)));
  }, [items, recherche, theme]);
  const bascule = cle => setChoix(c => (c.includes(cle) ? c.filter(x => x !== cle) : c.length < MAX_EXOS ? [...c, cle] : c));
  const basculeEleve = id => setVisés(v => (v.includes(id) ? v.filter(x => x !== id) : [...v, id]));
  const creer = e => {
    e.preventDefault();
    const cibles = certains && cible ? visés : null;
    proteger(async () => {
      await rest('devoirs', { method: 'POST', corps: { classe_id: classe.id, titre: titre.trim(), cles: choix, echeance: echeance || null, ...(cibles ? { eleves: cibles } : {}) } });
      setTitre(''); setEcheance(''); setChoix([]); setRecherche(''); setCertains(false); setVisés([]);
      setMsg(cibles ? `Devoir créé : ${cibles.length} élève${cibles.length > 1 ? 's le voient' : ' le voit'} dès la prochaine visite.` : 'Devoir créé : les élèves de la classe le voient dès leur prochaine visite.'); setVersion(v => v + 1);
    });
  };
  const supprimer = d => {
    if (!window.confirm(`Supprimer le devoir « ${d.titre} » ? Les élèves ne le verront plus (leurs résultats d’exercices ne sont pas touchés).`)) return;
    proteger(async () => { await rest(`devoirs?id=eq.${d.id}`, { method: 'DELETE' }); setMsg('Devoir supprimé.'); setVersion(v => v + 1); });
  };

  if (!dispo) {
    return <div style={{ ...styleBoite, fontSize: 14 }}>📌 <b>Devoirs</b> : disponibles après avoir exécuté <code>supabase/06-devoirs.sql</code> dans Supabase (SQL Editor → Run). Mode d’emploi dans <code>supabase/LISEZ-MOI.md</code>.</div>;
  }
  const maintenant = new Date();
  return (
    <div>
      {erreur && <div role="alert" style={{ color: '#b91c1c', fontWeight: 600, margin: '6px 0' }}>❌ {erreur}</div>}
      {msg && <div role="status" style={{ color: '#15803d', fontWeight: 600, margin: '6px 0' }}>✅ {msg}</div>}

      <form onSubmit={creer} style={{ ...styleBoite, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 800, color: KIT.txt }}>➕ Nouveau devoir pour « {classe.nom} »</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 13, fontWeight: 700, flex: '1 1 240px' }}>Titre<br />
            <input value={titre} maxLength={80} onChange={e => setTitre(e.target.value)} placeholder="Révisions avant l’évaluation" style={{ ...champ, width: '100%' }} aria-label="Titre du devoir" /></label>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Date limite (facultative)<br />
            <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)} style={champ} aria-label="Date limite" /></label>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Exercices et défis ({choix.length} / {MAX_EXOS} choisis)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={theme} onChange={e => setTheme(e.target.value)} aria-label="Thème" style={{ ...champ, flex: '0 1 300px' }}>
            <option value="tous">Tous les thèmes</option>
            {ORDRE_DOMAINES.map(d => <option key={d} value={d}>{classe.chapitres?.includes(d) ? '📘 ' : ''}{d}{classe.chapitres?.includes(d) ? ' (chapitre en cours)' : ''}</option>)}
            {FILTRES_SPECIAUX.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </div>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Chercher (mot du titre, ANA, REA, S'APP, DÉFI…)" style={champ} aria-label="Chercher un exercice" />
        <div style={{ maxHeight: 250, overflowY: 'auto', border: `1px solid ${KIT.bord}`, borderRadius: 8, background: '#fff' }}>
          {filtres.length === 0 && <div style={{ padding: 10, fontSize: 13.5, color: KIT.txt2 }}>Aucun résultat.</div>}
          {filtres.map(i => { const coche = choix.includes(i.cle); return (
            <label key={i.cle} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 9px', fontSize: 13.5, cursor: 'pointer', background: coche ? '#fff1f2' : 'transparent', borderBottom: `1px solid ${KIT.bord}` }}>
              <input type="checkbox" checked={coche} disabled={!coche && choix.length >= MAX_EXOS} onChange={() => bascule(i.cle)} style={{ marginTop: 3, accentColor: '#e11d48' }} />
              <span><b style={{ color: ROSE }}>{i.comp === 'DÉFI' ? 'Défi' : i.comp}</b> · {i.titre}</span>
            </label>); })}
        </div>
        {choix.length > 0 && <div style={{ fontSize: 13, color: KIT.txt2 }}>Choisis : {choix.map(c => par.get(c)?.titre || c).join(' · ')}</div>}
        <div style={{ fontSize: 13, fontWeight: 700 }}>Pour qui ?</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14 }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="radio" name="pour-qui" checked={!certains} onChange={() => setCertains(false)} style={{ accentColor: '#e11d48' }} />Toute la classe ({eleves.length})</label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: cible ? 1 : 0.55 }}><input type="radio" name="pour-qui" checked={certains && cible} disabled={!cible} onChange={() => setCertains(true)} style={{ accentColor: '#e11d48' }} />Certains élèves seulement</label>
        </div>
        {!cible && <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Cibler des élèves : disponible après avoir exécuté <code>supabase/07-chapitre-et-ciblage.sql</code> dans Supabase.</div>}
        {certains && cible && (
          <div role="group" aria-label="Élèves visés" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {eleves.map(e => { const on = visés.includes(e.user_id); return (
              <label key={e.user_id} style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '3px 9px', borderRadius: 999, border: `1px solid ${on ? ROSE : KIT.bord}`, background: on ? '#fff1f2' : '#fff', fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={on} onChange={() => basculeEleve(e.user_id)} style={{ accentColor: '#e11d48' }} />{e.identifiant}
              </label>); })}
          </div>)}
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Un exercice compte comme <b>fait</b> s’il est <b>réussi après la création du devoir</b> (un exercice réussi avant doit donc être refait : pratique pour des révisions).</div>
        <div><button type="submit" style={styleBouton(true, '#16a34a')} disabled={occupe || !titre.trim() || choix.length === 0 || (certains && cible && visés.length === 0)}>Créer le devoir</button></div>
      </form>

      <h3 style={{ margin: '16px 0 8px', color: KIT.txt }}>Devoirs de la classe</h3>
      {devoirs === null && <div style={{ color: KIT.txt2 }}>Chargement…</div>}
      {devoirs && devoirs.length === 0 && <div style={{ ...styleBoite, fontSize: 14 }}>Aucun devoir pour cette classe pour l’instant.</div>}
      {(devoirs || []).map(d => {
        const s = suiviClasse(d, eleves, lignes), fin = finEcheance(d.echeance), info = infoEcheance(d.echeance, maintenant, false);
        return (
          <div key={d.id} style={{ ...styleBoite, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <b style={{ flex: 1, minWidth: 160, color: KIT.txt }}>📌 {d.titre}{Array.isArray(d.eleves) && <span style={{ fontSize: 12.5, fontWeight: 700, color: KIT.txt2 }}> · 👥 ciblé : {d.eleves.length} élève{d.eleves.length > 1 ? 's' : ''}</span>}</b>
              <span style={{ fontSize: 13, fontWeight: 700, color: COULEURS[info.ton] }}>{fin ? `${fin.toLocaleDateString('fr-FR')} · ` : ''}{info.texte}</span>
              <span style={{ fontSize: 13.5 }}><b>{s.termines}</b> / {s.effectif} élève{s.effectif > 1 ? 's' : ''} ont tout fait</span>
              <button onClick={() => supprimer(d)} disabled={occupe} style={{ ...styleBouton(false, '#b91c1c'), fontSize: 12.5 }}>🗑 Supprimer</button>
            </div>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}>Voir qui a fait quoi</summary>
              <div style={{ overflowX: 'auto', marginTop: 6 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead><tr><th style={{ padding: '4px 8px', textAlign: 'left', color: KIT.txt2 }}>Élève</th>
                    {d.cles.map((c, i) => <th key={c} title={par.get(c)?.titre || c} style={{ padding: '4px 8px', color: KIT.txt2 }}>{i + 1}</th>)}
                    <th style={{ padding: '4px 8px', color: KIT.txt2 }}>Total</th></tr></thead>
                  <tbody>{s.parEleve.map(x => (
                    <tr key={x.eleve.user_id} style={{ borderTop: `1px solid ${KIT.bord}` }}>
                      <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>{x.eleve.identifiant}</td>
                      {x.faits.map((f, i) => <td key={i} style={{ padding: '4px 8px', textAlign: 'center' }}>{f ? '✅' : '·'}</td>)}
                      <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, color: x.termine ? '#15803d' : KIT.txt }}>{x.nb}/{x.total}</td>
                    </tr>))}</tbody>
                </table>
              </div>
              <ol style={{ fontSize: 13, color: KIT.txt2, margin: '8px 0 0', paddingLeft: 20 }}>{d.cles.map(c => <li key={c}>{par.get(c)?.titre || c}</li>)}</ol>
            </details>
          </div>);
      })}
    </div>);
}
