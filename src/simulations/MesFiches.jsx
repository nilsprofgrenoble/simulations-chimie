import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { cardStyle, KIT, styleBouton, stylePetitBouton } from "../commun";
import { useSession, estEleve } from "../serveur";
import { surSynchro } from "../etatsParcours";
import { listerFiches, surChangementFiches, recolterFiches, lireFigure } from "../fiches";
import { toutLire } from "../serveur";
import { tempsParSimulation, estSimulation } from "../suivi";
import { chapitresDeSim, NIVEAUX_CHAPITRES } from "../chapitres";
import { Pic } from "../Pictos";

// ═════════════════════════════════════════════════════════════════════════
//  « MES FICHES » (page cachée n° 103, ouverte depuis Mon compte et depuis les cartes) :
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

// Une fiche de révision = une simulation : bandeau titre, schéma de la simulation, puis les points à retenir dans l'ordre du parcours
function FicheSim({ g, couleur, coche, bascule, naviguer, impression }) {
  const fig = lireFigure(g.sim);
  const corps = (
    <>
      {fig && <img className="fiche-figure" src={fig} alt={`Schéma de la simulation : ${g.nom}`} />}
      <ol className="fiche-points">
        {g.L.map(f => (
          <li key={f.cle}>
            <div className="fiche-point-titre">{f.etape || 'À retenir'}</div>
            <div className="fiche-corps" dangerouslySetInnerHTML={{ __html: f.html }} />
          </li>))}
      </ol>
    </>);
  if (impression) return (
    <section className="fiche-feuille" style={{ '--c': couleur }}>
      <header><span className="fiche-feuille-niv">{g.libNiv}</span> {g.chapLabel}<h2>{g.nom}</h2></header>
      {corps}
    </section>);
  return (
    <article data-fiche={g.sim} className="fiche-ecran" style={{ '--c': couleur, borderColor: coche ? couleur : '#d5dfeb', boxShadow: coche ? `0 0 0 2px ${couleur}44` : undefined }}>
      <label className="fiche-ecran-tete">
        <input type="checkbox" checked={coche} onChange={bascule} aria-label={`Sélectionner la fiche : ${g.nom}`} style={{ accentColor: couleur, width: 18, height: 18 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="fiche-ecran-chap">{g.libNiv} · {g.chapLabel}</span>
          <span className="fiche-ecran-nom">{g.nom}</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 18 }}>❤️</span>
      </label>
      <div className="fiche-ecran-corps">{corps}</div>
      <div style={{ textAlign: 'right', padding: '0 14px 10px' }}>
        <button type="button" onClick={() => naviguer(g.sim)} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Revoir la simulation ▶</button>
      </div>
    </article>);
}

// Feuille imprimée : visible seulement à l'impression (voir index.css), une fiche par simulation
function ZoneImpression({ groupes, identifiant }) {
  return createPortal(
    <div className="fiches-print" aria-hidden="true">
      <header className="fiches-print-entete">
        <div><b>Paillasse virtuelle</b> · Mes fiches de révision</div>
        <div>{identifiant ? `${identifiant} · ` : ''}{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </header>
      {groupes.map(g => <FicheSim key={g.sim} g={g} couleur={COULEUR[g.niv] || COULEUR.autre} coche={false} bascule={() => {}} naviguer={() => {}} impression />)}
    </div>, document.body);
}

export function SimulationFiches({ naviguer }) {
  const sess = useSession();
  const fiches = useFiches();
  const [choisies, setChoisies] = useState(() => new Set());   // numéros de simulations
  const [niveau, setNiveau] = useState('tous');
  useEffect(() => { document.body.classList.add('impression-fiches'); return () => document.body.classList.remove('impression-fiches'); }, []);
  const [recolte, setRecolte] = useState(null);   // { i, n } pendant la récolte, 'fini' ensuite
  const eleve = estEleve(sess);
  const lancerRecolte = async () => {
    if (recolte && recolte !== 'fini') return;
    setRecolte({ i: 0, n: 0 });
    try {
      const lignes = await toutLire('activites?select=cle,duree_s&order=debut.desc');
      const ids = tempsParSimulation(lignes.filter(l => estSimulation(l.cle))).map(a => Number(a.id)).filter(Number.isFinite);
      await recolterFiches(ids, (i, n) => setRecolte({ i, n }));
    } catch { /* hors ligne : on garde ce qui est déjà rangé */ }
    try { window.localStorage.setItem('fiches-recolte-v2-' + (sess?.profil?.identifiant || ''), String(Date.now())); } catch { /* pas grave */ }
    setRecolte('fini');
  };
  // Une première fois, à l'ouverture de la page : retrouver les fiches des parcours déjà terminés
  useEffect(() => {
    if (!eleve) return;
    let deja = null; try { deja = window.localStorage.getItem('fiches-recolte-v2-' + sess.profil.identifiant); } catch { /* ignoré */ }
    if (!deja) lancerRecolte();
  }, [eleve]);   // eslint-disable-line react-hooks/exhaustive-deps

  const libNiv = k => (k === 'tous' ? 'Tous' : k === 'autre' ? 'Autres' : NIVEAUX_CHAPITRES.find(n => n.key === k)?.label || k);
  // une fiche par simulation, ses points dans l'ordre des étapes du parcours (date de première vue)
  const groupes = useMemo(() => {
    const m = new Map();
    fiches.forEach(f => {
      if (!m.has(f.sim)) { const c = chapitresDeSim(f.sim)[0]; m.set(f.sim, { sim: f.sim, nom: f.nom || `Simulation ${f.sim}`, chap: c ? c.id : 'autre', chapLabel: c ? c.label : 'Autres simulations', niv: c ? c.niveau : 'autre', libNiv: libNiv(c ? c.niveau : 'autre'), L: [] }); }
      m.get(f.sim).L.push(f);
    });
    m.forEach(g => g.L.sort((a, b) => (a.t0 || 0) - (b.t0 || 0)));
    return [...m.values()];
  }, [fiches]);   // eslint-disable-line react-hooks/exhaustive-deps
  const visibles = groupes.filter(g => niveau === 'tous' || g.niv === niveau);
  const chapitres = useMemo(() => {
    const m = new Map();
    visibles.forEach(g => { if (!m.has(g.chap)) m.set(g.chap, { id: g.chap, label: g.chapLabel, niv: g.niv, L: [] }); m.get(g.chap).L.push(g); });
    return [...m.values()].sort((a, b) => NIVEAUX_CHAPITRES.findIndex(n => n.key === a.niv) - NIVEAUX_CHAPITRES.findIndex(n => n.key === b.niv) || a.label.localeCompare(b.label));
  }, [visibles]);
  const bascule = sim => setChoisies(s => { const n = new Set(s); if (n.has(sim)) n.delete(sim); else n.add(sim); return n; });
  const selection = groupes.filter(g => choisies.has(g.sim));
  const niveauxPresents = ['tous', ...NIVEAUX_CHAPITRES.map(n => n.key).filter(k => groupes.some(g => g.niv === k)), ...(groupes.some(g => g.niv === 'autre') ? ['autre'] : [])];

  return (
    <div style={{ ...cardStyle, maxWidth: 1040, margin: '0 auto' }} data-page-fiches>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>
        <button onClick={() => naviguer(39)} style={{ background: 'none', border: 'none', padding: 0, color: '#0b4f94', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Mon compte</button> › Mes fiches
      </div>
      <h2 style={{ margin: '4px 0 2px', color: '#0b4f94', fontFamily: TITRE_B, fontSize: 28 }}><Pic n="clipboard"/>Mes fiches de révision</h2>
      <p style={{ margin: '0 0 12px', color: KIT.txt2, fontSize: 14.5, lineHeight: 1.55 }}>
        Quand tu as <b>terminé le parcours guidé</b> d’une simulation, sa fiche vient se ranger ici : le schéma de la simulation et les points « À retenir » de chaque étape, avec leurs formules.
        Relis-les pour réviser, et imprime celles que tu choisis.{eleve ? ' Elles te suivent d’un appareil à l’autre.' : ' Sans compte, elles restent sur cet appareil.'}
      </p>
      {eleve && (
        <div data-recolte style={{ margin: '0 0 12px', fontSize: 13.5, color: KIT.txt2, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {recolte && recolte !== 'fini'
            ? <span>🔎 Je retrouve tes fiches dans les simulations déjà faites… {recolte.n ? `(${Math.min(recolte.i + 1, recolte.n)} / ${recolte.n})` : ''}</span>
            : <><span>Il manque la fiche d’une simulation que tu as terminée ?</span>
              <button type="button" onClick={lancerRecolte} style={{ background: 'none', border: 'none', color: '#0b4f94', textDecoration: 'underline', cursor: 'pointer', fontSize: 13.5, padding: 0 }}>Retrouver mes fiches</button></>}
        </div>)}
      {groupes.length === 0 ? (
        <div style={{ padding: '22px 18px', borderRadius: 16, background: '#f1f6fb', border: '1px dashed #9fb8d4', textAlign: 'center', color: KIT.txt }}>
          <div style={{ fontSize: 34 }} aria-hidden="true">📇</div>
          <div style={{ fontWeight: 800, fontSize: 17, margin: '4px 0' }}>Ta collection est vide pour l’instant</div>
          <div style={{ fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Termine un parcours guidé jusqu’au bilan : la fiche de la simulation se range ici toute seule.</div>
        </div>) : (
        <>
          <div data-barre-fiches style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(4px)', padding: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: KIT.txt }}>{groupes.length} fiche{groupes.length > 1 ? 's' : ''} · {selection.length} sélectionnée{selection.length > 1 ? 's' : ''}</span>
            <span style={{ flex: 1 }} />
            <button style={stylePetitBouton(false)} onClick={() => setChoisies(new Set(visibles.map(g => g.sim)))}>Tout sélectionner</button>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 14, alignItems: 'start' }}>
                {c.L.map(g => <FicheSim key={g.sim} g={g} couleur={COULEUR[g.niv] || COULEUR.autre} coche={choisies.has(g.sim)} bascule={() => bascule(g.sim)} naviguer={naviguer} />)}
              </div>
            </section>))}
        </>)}
      <ZoneImpression groupes={selection} identifiant={eleve ? sess.profil.identifiant : ''} />
    </div>);
}
