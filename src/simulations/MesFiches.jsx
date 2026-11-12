import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cardStyle, KIT, styleBouton, stylePetitBouton } from "../commun";
import { useSession, estEleve } from "../serveur";
import { surSynchro } from "../etatsParcours";
import { listerFiches, surChangementFiches } from "../fiches";
import { chapitresDeSim, NIVEAUX_CHAPITRES } from "../chapitres";
import { Pic } from "../Pictos";

// ═════════════════════════════════════════════════════════════════════════
//  « MES FICHES » (page cachée n° 102, ouverte depuis Mon compte et depuis les cartes) :
//  la collection des cartes « À retenir » débloquées, rangées par chapitre puis par simulation, à relire pour réviser
//  et à imprimer (sélection de cartes → feuille A4 sobre, deux colonnes). Les cartes viennent de src/fiches.js.
// ═════════════════════════════════════════════════════════════════════════
const COULEUR = { '2GT': '#2f8f5b', '1G': '#2563a8', TSTL: '#c2761a', BTS: '#7c4bb0', autre: '#64748b' };
const TITRE_B = "'Outfit', 'Inter', sans-serif";

// Les cartes de la page, relues quand une carte est ajoutée ou qu'une synchronisation apporte celles du compte
function useFiches() {
  const [version, setVersion] = useState(0);
  useEffect(() => { const a = surChangementFiches(() => setVersion(v => v + 1)), b = surSynchro(() => setVersion(v => v + 1)); return () => { a(); b(); }; }, []);
  return useMemo(() => listerFiches(), [version]);   // eslint-disable-line react-hooks/exhaustive-deps
}

const dateFr = t => { try { return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); } catch { return ''; } };

// Corps d'une carte : l'instantané « À retenir » (déjà nettoyé), avec une mise en page commune pour les formules et les schémas
function CorpsFiche({ html, impression }) {
  return <div className={impression ? 'fiche-corps fiche-corps-impr' : 'fiche-corps'} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Fiche({ f, couleur, coche, bascule, naviguer }) {
  return (
    <article data-fiche={f.cle} style={{ position: 'relative', background: '#fff', border: `1px solid ${coche ? couleur : '#d5dfeb'}`, borderLeft: `6px solid ${couleur}`, borderRadius: 14,
      padding: '12px 14px 12px', boxShadow: coche ? `0 0 0 2px ${couleur}33` : '0 1px 3px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input type="checkbox" checked={coche} onChange={bascule} aria-label={`Sélectionner la fiche : ${f.etape || f.nom}`} style={{ marginTop: 3, accentColor: couleur, width: 17, height: 17 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: TITRE_B, fontWeight: 800, fontSize: 15.5, color: KIT.txt, lineHeight: 1.3 }}>{f.etape || 'À retenir'}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: KIT.txt2, marginTop: 1 }}>Vue le {dateFr(f.t0 || f.t)}</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 16 }}>❤️</span>
      </label>
      <CorpsFiche html={f.html} />
      <div style={{ textAlign: 'right' }}>
        <button type="button" onClick={() => naviguer(f.sim)} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Revoir la simulation ▶</button>
      </div>
    </article>);
}

// Feuille imprimée : visible seulement à l'impression (voir App.css), cartes groupées par simulation
function ZoneImpression({ fiches, identifiant }) {
  const groupes = useMemo(() => {
    const m = new Map();
    fiches.forEach(f => { if (!m.has(f.sim)) m.set(f.sim, { nom: f.nom || `Simulation ${f.sim}`, L: [] }); m.get(f.sim).L.push(f); });
    return [...m.values()];
  }, [fiches]);
  return createPortal(
    <div className="fiches-print" aria-hidden="true">
      <header className="fiches-print-entete">
        <div><b>Paillasse virtuelle</b> · Mes fiches « À retenir »</div>
        <div>{identifiant ? `${identifiant} · ` : ''}{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </header>
      {groupes.map(g => (
        <section key={g.nom} className="fiches-print-groupe">
          <h2>{g.nom}</h2>
          <div className="fiches-print-grille">
            {g.L.map(f => (
              <div key={f.cle} className="fiches-print-carte">
                <div className="fiches-print-titre">{f.etape || 'À retenir'} <span>❤</span></div>
                <CorpsFiche html={f.html} impression />
              </div>))}
          </div>
        </section>))}
    </div>, document.body);
}

export function SimulationFiches({ naviguer }) {
  const sess = useSession();
  const fiches = useFiches();
  const [choisies, setChoisies] = useState(() => new Set());
  const [niveau, setNiveau] = useState('tous');
  useSyncExternalStore(() => () => {}, () => 0);   // (réserve : rien à écouter de plus)
  useEffect(() => { document.body.classList.add('impression-fiches'); return () => document.body.classList.remove('impression-fiches'); }, []);

  // chapitre de chaque simulation (le premier qui la contient) ; « autre » sinon
  const enrichies = useMemo(() => fiches.map(f => {
    const c = chapitresDeSim(f.sim)[0];
    return { ...f, chap: c ? c.id : 'autre', chapLabel: c ? c.label : 'Autres simulations', niv: c ? c.niveau : 'autre' };
  }), [fiches]);
  const visibles = enrichies.filter(f => niveau === 'tous' || f.niv === niveau);
  const chapitres = useMemo(() => {
    const m = new Map();
    visibles.forEach(f => {
      if (!m.has(f.chap)) m.set(f.chap, { id: f.chap, label: f.chapLabel, niv: f.niv, sims: new Map() });
      const g = m.get(f.chap);
      if (!g.sims.has(f.sim)) g.sims.set(f.sim, { sim: f.sim, nom: f.nom || `Simulation ${f.sim}`, L: [] });
      g.sims.get(f.sim).L.push(f);
    });
    return [...m.values()].sort((a, b) => NIVEAUX_CHAPITRES.findIndex(n => n.key === a.niv) - NIVEAUX_CHAPITRES.findIndex(n => n.key === b.niv) || a.label.localeCompare(b.label));
  }, [visibles]);

  const bascule = cle => setChoisies(s => { const n = new Set(s); if (n.has(cle)) n.delete(cle); else n.add(cle); return n; });
  const basculeGroupe = L => setChoisies(s => { const n = new Set(s); const tout = L.every(f => n.has(f.cle)); L.forEach(f => (tout ? n.delete(f.cle) : n.add(f.cle))); return n; });
  const selection = enrichies.filter(f => choisies.has(f.cle)).sort((a, b) => a.sim - b.sim || (a.t0 || 0) - (b.t0 || 0));
  const niveauxPresents = ['tous', ...NIVEAUX_CHAPITRES.map(n => n.key).filter(k => enrichies.some(f => f.niv === k)), ...(enrichies.some(f => f.niv === 'autre') ? ['autre'] : [])];
  const libNiv = k => (k === 'tous' ? 'Tous' : k === 'autre' ? 'Autres' : NIVEAUX_CHAPITRES.find(n => n.key === k)?.label || k);

  return (
    <div style={{ ...cardStyle, maxWidth: 1040, margin: '0 auto' }} data-page-fiches>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>
        <button onClick={() => naviguer(39)} style={{ background: 'none', border: 'none', padding: 0, color: '#0b4f94', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Mon compte</button> › Mes fiches
      </div>
      <h2 style={{ margin: '4px 0 2px', color: '#0b4f94', fontFamily: TITRE_B, fontSize: 28 }}><Pic n="clipboard"/>Mes fiches « À retenir »</h2>
      <p style={{ margin: '0 0 12px', color: KIT.txt2, fontSize: 14.5, lineHeight: 1.55 }}>
        Chaque carte « À retenir » rencontrée dans une simulation vient se ranger ici, avec ses formules et ses schémas. Relis-les tranquillement pour réviser,
        et imprime celles que tu choisis.{estEleve(sess) ? ' Elles te suivent d’un appareil à l’autre.' : ' Sans compte, elles restent sur cet appareil.'}
      </p>
      {enrichies.length === 0 ? (
        <div style={{ padding: '22px 18px', borderRadius: 16, background: '#f1f6fb', border: '1px dashed #9fb8d4', textAlign: 'center', color: KIT.txt }}>
          <div style={{ fontSize: 34 }} aria-hidden="true">📇</div>
          <div style={{ fontWeight: 800, fontSize: 17, margin: '4px 0' }}>Ta collection est vide pour l’instant</div>
          <div style={{ fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Ouvre un parcours guidé : chaque fois qu’une carte « À retenir ❤️ » apparaît, elle est rangée ici toute seule.</div>
        </div>) : (
        <>
          <div data-barre-fiches style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(4px)', padding: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: KIT.txt }}>{enrichies.length} fiche{enrichies.length > 1 ? 's' : ''} · {selection.length} sélectionnée{selection.length > 1 ? 's' : ''}</span>
            <span style={{ flex: 1 }} />
            <button style={stylePetitBouton(false)} onClick={() => setChoisies(new Set(visibles.map(f => f.cle)))}>Tout sélectionner</button>
            <button style={stylePetitBouton(false)} onClick={() => setChoisies(new Set())} disabled={!selection.length}>Tout désélectionner</button>
            <button data-imprimer style={{ ...styleBouton(selection.length > 0, '#0b4f94'), opacity: selection.length ? 1 : 0.5 }} disabled={!selection.length} onClick={() => window.print()}>
              <Pic n="clipboard"/>Imprimer la sélection{selection.length ? ` (${selection.length})` : ''}</button>
          </div>
          {niveauxPresents.length > 2 && (
            <div role="group" aria-label="Filtrer par niveau" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {niveauxPresents.map(k => <button key={k} onClick={() => setNiveau(k)} aria-pressed={niveau === k}
                style={{ ...styleBouton(niveau === k, COULEUR[k] || '#334155'), padding: '5px 14px', fontSize: 13.5, borderRadius: 999, boxShadow: 'none' }}>{libNiv(k)}</button>)}
            </div>)}
          {chapitres.map(c => (
            <section key={c.id} data-chapitre-fiches={c.id} style={{ margin: '14px 0 20px' }}>
              <h3 style={{ margin: '0 0 8px', fontFamily: TITRE_B, fontSize: 19, color: KIT.txt, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: COULEUR[c.niv] || COULEUR.autre, color: '#fff', borderRadius: 999, fontSize: 12, padding: '2px 10px', fontWeight: 800 }}>{libNiv(c.niv)}</span>{c.label}
              </h3>
              {[...c.sims.values()].map(g => (
                <div key={g.sim} style={{ margin: '0 0 14px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 6px' }}>
                    <span style={{ fontWeight: 800, color: KIT.txt, fontSize: 15 }}>{g.nom}</span>
                    <button type="button" onClick={() => basculeGroupe(g.L)} style={{ background: 'none', border: 'none', color: '#0b4f94', textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5, padding: 0 }}>
                      {g.L.every(f => choisies.has(f.cle)) ? 'Désélectionner cette simulation' : 'Sélectionner cette simulation'}</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))', gap: 12 }}>
                    {g.L.map(f => <Fiche key={f.cle} f={f} couleur={COULEUR[f.niv] || COULEUR.autre} coche={choisies.has(f.cle)} bascule={() => bascule(f.cle)} naviguer={naviguer} />)}
                  </div>
                </div>))}
            </section>))}
        </>)}
      <ZoneImpression fiches={selection} identifiant={estEleve(sess) ? sess.profil.identifiant : ''} />
    </div>);
}
