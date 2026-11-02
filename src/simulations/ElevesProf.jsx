import { useState, useEffect, useMemo } from "react";
import { KIT, stylePetitBouton } from "../commun";
import { lireDevoirs } from "../devoirsServeur";
import { suiviClasse } from "../devoirs";
import { agreger, formatDuree, formatDate } from "./Compte";
import { ACCENT, ACCENT_CLAIR } from "../theme";
import { estSimulation, estDefi } from "../suivi";

// Vue « Élèves » du suivi professeur : une carte par élève, dans l'ordre
// temps passé sur le site → devoirs faits → dernière activité ; le détail (exercices, défis, essais…) se déplie.
const JOUR = 86400000;
const VERT = '#15803d', ORANGE = '#b45309', GRIS = '#64748b';

const jours = iso => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / JOUR) : null);
const texteJours = j => (j === null ? 'Jamais venu' : j <= 0 ? 'Aujourd’hui' : j === 1 ? 'Hier' : `Il y a ${j} jours`);
// Actif : venu dans les 7 derniers jours. Peu actif : jusqu'à 3 semaines. Sinon : inactif. (Le texte accompagne toujours la couleur.)
const statut = j => (j === null ? { t: 'Jamais venu', c: GRIS } : j <= 7 ? { t: 'Actif', c: VERT } : j <= 21 ? { t: 'Peu actif', c: ORANGE } : { t: 'Inactif', c: '#b91c1c' });

const TRIS = [['temps', 'Temps passé'], ['devoirs', 'Devoirs faits'], ['activite', 'Dernière activité'], ['id', 'Identifiant']];

export function ElevesProf({ classe, eleves, lignes, exos, defis, etq, proprio, onReinitialiser, onSupprimer }) {
  const [devoirs, setDevoirs] = useState(null), [tri, setTri] = useState('temps'), [ouvert, setOuvert] = useState(null);
  useEffect(() => {
    let vivant = true;
    lireDevoirs(classe.id).then(r => { if (vivant) setDevoirs(r.dispo ? r.liste : []); }).catch(() => { if (vivant) setDevoirs([]); });
    return () => { vivant = false; };
  }, [classe.id]);

  const lignes_ = useMemo(() => {
    const parUser = new Map();
    lignes.forEach(l => { if (!parUser.has(l.user_id)) parUser.set(l.user_id, []); parUser.get(l.user_id).push(l); });
    const suivis = (devoirs || []).map(d => suiviClasse(d, eleves, lignes));
    return eleves.map(e => {
      const toutes = parUser.get(e.user_id) || [];
      const temps = toutes.reduce((t, l) => t + (l.duree_s || 0), 0);              // tout le temps actif : exercices, défis ET simulations
      const der = toutes.reduce((m, l) => (l.maj && l.maj > m ? l.maj : m), '');
      const exosL = [...agreger(toutes.filter(l => !estSimulation(l.cle) && !estDefi(l.cle))).values()];
      const defisL = [...agreger(toutes.filter(l => estDefi(l.cle))).values()];
      const mesDevoirs = suivis.map(s => s.parEleve.find(x => x.eleve.user_id === e.user_id)).filter(Boolean);
      return { e, temps, der: der || null, j: jours(der), exosL, defisL, detail: [...agreger(toutes.filter(l => !estSimulation(l.cle))).values()],
        devFaits: mesDevoirs.filter(x => x.termine).length, devTotal: mesDevoirs.length };
    });
  }, [eleves, lignes, devoirs]);

  const trie = useMemo(() => {
    const t = [...lignes_];
    const cmp = { temps: (a, b) => b.temps - a.temps, devoirs: (a, b) => (b.devTotal ? b.devFaits / b.devTotal : -1) - (a.devTotal ? a.devFaits / a.devTotal : -1) || b.temps - a.temps,
      activite: (a, b) => (b.der || '').localeCompare(a.der || ''), id: (a, b) => a.e.identifiant.localeCompare(b.e.identifiant, 'fr', { numeric: true }) };
    return t.sort(cmp[tri]);
  }, [lignes_, tri]);

  const actifs = lignes_.filter(x => x.j !== null && x.j <= 7).length, tempsTotal = lignes_.reduce((t, x) => t + x.temps, 0);
  const nbDevoirs = (devoirs || []).length, devEleves = lignes_.filter(x => x.devTotal > 0), toutFait = devEleves.filter(x => x.devFaits === x.devTotal).length;
  const bloc = { flex: '1 1 130px', background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 16, padding: '10px 14px' };
  const gros = { fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 800, fontSize: 22, color: '#0c1a2e', lineHeight: 1.15 };
  const etiq = { fontSize: 12.5, color: KIT.txt2, fontWeight: 600 };

  if (!eleves.length) return <div style={{ color: KIT.txt2, padding: 8 }}>Aucun élève dans cette classe.</div>;
  return (
    <div data-vue-eleves>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={bloc}><div style={gros}>{actifs} / {eleves.length}</div><div style={etiq}>élèves venus ces 7 derniers jours</div></div>
        <div style={bloc}><div style={gros}>{formatDuree(tempsTotal)}</div><div style={etiq}>temps passé par la classe</div></div>
        <div style={bloc}><div style={gros}>{nbDevoirs ? `${toutFait} / ${devEleves.length}` : '—'}</div><div style={etiq}>{nbDevoirs ? 'élèves à jour de leurs devoirs' : 'aucun devoir donné'}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 10px', fontSize: 13.5, color: KIT.txt2 }}>
        Trier par :
        {TRIS.map(([k, l]) => <button key={k} onClick={() => setTri(k)} style={stylePetitBouton(tri === k, ACCENT)}>{l}</button>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trie.map(x => {
          const s = statut(x.j), ouv = ouvert === x.e.user_id;
          return (
            <div key={x.e.user_id} data-eleve={x.e.identifiant} style={{ background: ouv ? ACCENT_CLAIR : '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 16, overflow: 'hidden' }}>
              <button onClick={() => setOuvert(ouv ? null : x.e.user_id)} aria-expanded={ouv}
                style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', padding: '10px 14px' }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#0c1a2e' }}>{x.e.identifiant}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: s.c }}>● {s.t}</span>
                  <span aria-hidden style={{ marginLeft: 'auto', color: KIT.txt2, fontSize: 13 }}>{ouv ? '▲' : '▼'}</span>
                </span>
                <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8, marginTop: 6, alignItems: 'start' }}>
                  <span><span style={etiq}>⏱ Temps</span><br /><b style={{ fontSize: 15 }}>{x.temps ? formatDuree(x.temps) : '—'}</b></span>
                  <span><span style={etiq}>📌 Devoirs</span><br /><b style={{ fontSize: 15, color: x.devTotal && x.devFaits === x.devTotal ? VERT : '#0c1a2e' }}>{x.devTotal ? `${x.devFaits} / ${x.devTotal}` : '—'}</b></span>
                  <span><span style={etiq}>🕒 Activité</span><br /><b style={{ fontSize: 15 }}>{texteJours(x.j)}</b></span>
                </span>
              </button>

              {ouv && (
                <div style={{ padding: '2px 14px 12px', borderTop: `1px solid ${KIT.bord}` }}>
                  <div style={{ display: 'flex', gap: '4px 16px', flexWrap: 'wrap', fontSize: 13.5, margin: '8px 0' }}>
                    <span>Dernière activité : <b>{x.der ? formatDate(x.der) : '—'}</b></span>
                    <span>Exercices réussis : <b>{x.exosL.filter(a => a.reussi).length}</b> (sur {exos.length} au catalogue)</span>
                    <span>Exercices travaillés : <b>{x.exosL.length}</b></span>
                    <span>Défis réussis : <b>{x.defisL.filter(a => a.reussi).length}</b> (sur {defis.length})</span>
                    <span>Essais : <b>{x.exosL.reduce((t, a) => t + a.essais, 0)}</b></span>
                    <span>Corrections vues : <b>{x.exosL.reduce((t, a) => t + a.vues, 0)}</b></span>
                  </div>
                  {!x.detail.length ? <i style={{ color: KIT.txt2, fontSize: 13.5 }}>Aucun exercice travaillé.</i> : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}><tbody>{[...x.detail].sort((a, b) => (b.derniere || '').localeCompare(a.derniere || '')).map(a => (
                        <tr key={a.cle}><td style={{ padding: '3px 8px 3px 0' }}>{a.reussi ? '✅' : '⬜'}</td><td style={{ padding: '3px 8px' }}><b>{etq[a.cle]?.comp}</b> {etq[a.cle]?.titre || a.cle}</td>
                          <td style={{ padding: '3px 8px', whiteSpace: 'nowrap' }}>{a.essais} essai{a.essais > 1 ? 's' : ''}</td><td style={{ padding: '3px 8px', whiteSpace: 'nowrap' }}>{formatDuree(a.duree)}</td><td style={{ padding: '3px 8px', whiteSpace: 'nowrap' }}>{formatDate(a.derniere)}</td></tr>))}</tbody></table>
                    </div>)}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <button onClick={() => onReinitialiser(x.e.identifiant)} style={stylePetitBouton(false, '#475569')}>🔑 Nouveau mot de passe</button>
                    {proprio && <button onClick={() => onSupprimer(x.e.identifiant)} style={stylePetitBouton(false, '#b91c1c')}>🗑 Supprimer le compte</button>}
                  </div>
                </div>)}
            </div>);
        })}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 10 }}>Le temps compte tout le temps actif (exercices, défis et simulations), mesuré dans le navigateur de l’élève : c’est une aide au suivi, pas une preuve. « Devoirs » : devoirs entièrement faits sur ceux qui concernent l’élève.</div>
    </div>
  );
}
