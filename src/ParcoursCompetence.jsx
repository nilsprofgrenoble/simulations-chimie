// ═══════════════════════════════════════════════════════════════════════════
//  PARCOURS PAR COMPÉTENCE : la porte d'entrée commune des ateliers de remédiation (REA aujourd'hui ; S'APP, ANA, VAL ensuite).
//  Écran 1 : les TYPES d'exercices de la compétence. Écran 2 : (si le type est riche) le niveau, puis le chapitre. Puis la liste des exercices.
//  L'élève ne tombe plus directement sur un exercice. La sélection vit dans l'adresse (?type=…&niv=…&ch=…) : le bouton « Partager » donne au professeur
//  le lien de la sélection à envoyer à une classe.
// ═══════════════════════════════════════════════════════════════════════════
import { KIT, stylePetitBouton } from './commun';
import { NIVEAUX_CHAPITRES } from './chapitres';
import { itemsDuType, niveauxDuType, chapitresDuNiveauType, filtrer, difficultesDuType, enseignementsDuNiveauType, enseignementDe, ENSEIGNEMENTS, nomChapitre } from './parcoursCommun';
import { SEL_VIDE } from './selectionParcours';

const niveauLabel = k => NIVEAUX_CHAPITRES.find(n => n.key === k)?.label || k;

// ── Fil d'Ariane : chaque étape ramène à l'écran correspondant ──
export function FilAriane({ code, couleur, types, chapitres, sel, setSel, dansExercice = false }) {
  const t = types.find(x => x.id === sel.type), ch = chapitres.find(c => c.id === sel.ch);
  const etapes = [{ l: code, v: { ...SEL_VIDE } }];
  if (t) etapes.push({ l: t.nom, v: { type: t.id, niv: '', ens: '', ch: '', ex: '' } });
  const ens = (ENSEIGNEMENTS[sel.niv] || []).find(e => e.key === sel.ens);
  if (t && sel.niv) etapes.push({ l: niveauLabel(sel.niv), v: { type: t.id, niv: sel.niv, ens: '', ch: '', ex: '' } });
  if (t && ens) etapes.push({ l: ens.label, v: { type: t.id, niv: sel.niv, ens: ens.key, ch: '', ex: '' } });
  if (t && ch) etapes.push({ l: nomChapitre(ch), v: { type: t.id, niv: sel.niv, ens: sel.ens, ch: ch.id, ex: '' } });
  const dernier = dansExercice ? etapes.length : etapes.length - 1;   // dans un exercice, toutes les étapes sont cliquables
  return (
    <nav aria-label="Où je suis" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 6px', fontSize: 13.5, margin: '0 0 10px' }}>
      {etapes.map((e, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {i < dernier
            ? <button type="button" onClick={() => setSel(e.v)} style={{ background: 'none', border: 'none', padding: '8px 2px', minHeight: 36, cursor: 'pointer', color: couleur, fontWeight: 800, textDecoration: 'underline', fontFamily: 'inherit', fontSize: 13.5 }}>{e.l}</button>
            : <span aria-current="page" style={{ fontWeight: 800, color: KIT.txt, padding: '8px 2px' }}>{e.l}</span>}
          {i < etapes.length - 1 && <span aria-hidden="true" style={{ color: '#94a3b8' }}>›</span>}
        </span>))}
    </nav>);
}

const carte = (actif, couleur) => ({
  display: 'flex', alignItems: 'center', gap: 12, width: '100%', boxSizing: 'border-box', minHeight: 52, padding: '10px 14px', textAlign: 'left', borderRadius: 8,
  border: `1px solid ${actif ? couleur : KIT.bord}`, boxShadow: actif ? `inset 3px 0 0 ${couleur}` : 'none', background: actif ? '#f3f8f5' : '#fff', color: KIT.txt, fontFamily: 'inherit', cursor: 'pointer',
});
// Survol et focus des lignes (le style en ligne ne les gère pas)
const CSS_LIGNES = '.pc-ligne{transition:background .12s}.pc-ligne:hover{background:#f1f5f9 !important}.pc-ligne:focus-visible{outline:3px solid #0f172a;outline-offset:-3px}';

// ── Écran 1 : les types d'exercices (un sommaire : une ligne par type, sans décor) ──
function EcranTypes({ couleur, types, items, prog, choisir }) {
  const lignes = types.map(t => ({ t, its: itemsDuType(items, t.id) })).filter(x => x.its.length);
  return (
    <div role="list" style={{ border: `1px solid ${KIT.bord}`, borderRadius: 8, background: '#fff', overflow: 'hidden', maxWidth: 760 }}>
      <style>{CSS_LIGNES}</style>
      {lignes.map(({ t, its }, k) => {
        const faits = its.filter(i => prog[i.cle]).length;
        return (
          <button key={t.id} role="listitem" type="button" data-type={t.id} className="pc-ligne" onClick={() => choisir(t, its)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', boxSizing: 'border-box', padding: '14px 16px', minHeight: 64, textAlign: 'left', border: 'none', borderTop: k ? `1px solid ${KIT.bord}` : 'none', background: '#fff', color: KIT.txt, fontFamily: 'inherit', cursor: 'pointer' }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3, color: couleur }}>{t.nom}</span>
              <span style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.45 }}>{t.but}</span>
            </span>
            <span style={{ flex: 'none', textAlign: 'right', fontSize: 13, color: '#475569', fontWeight: 700, lineHeight: 1.4 }}>
              {its.length} exercice{its.length > 1 ? 's' : ''}{faits > 0 && <><br /><span style={{ fontWeight: 600 }}>{faits} fait{faits > 1 ? 's' : ''}</span></>}
            </span>
            <span aria-hidden="true" style={{ flex: 'none', color: '#64748b', fontSize: 22, lineHeight: 1 }}>›</span>
          </button>);
      })}
    </div>);
}

// ── Liste d'exercices (éventuellement groupée par chapitre) ──
function LigneExo({ it, fait, ouvrir, couleur }) {
  return (
    <button type="button" data-exo={it.id} onClick={() => ouvrir(it)} className="pc-ligne" style={{ ...carte(false, couleur), minHeight: 52, border: `1px solid ${KIT.bord}`, background: fait ? '#f1fbf8' : '#fff' }}>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.35 }}>{it.titre}</span>
        {it.detail && <span style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.4 }}>{it.detail}</span>}
      </span>
      {fait && <span role="img" aria-label="Déjà travaillé" style={{ flex: 'none', color: '#1f9d6b', fontWeight: 800, fontSize: 18 }}>✓</span>}
    </button>);
}
function ListeExos({ liste, prog, ouvrir, couleur, groupes }) {
  if (!liste.length) return <div style={{ fontSize: 14, color: KIT.txt2 }}>Aucun exercice de ce type pour cette sélection.</div>;
  if (!groupes) return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{liste.map(it => <LigneExo key={it.id} it={it} fait={!!prog[it.cle]} ouvrir={ouvrir} couleur={couleur} />)}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groupes.map(g => (
        <section key={g.cle} aria-label={g.titre}>
          <h3 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 800, color: KIT.txt }}>{g.titre}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{g.items.map(it => <LigneExo key={it.id} it={it} fait={!!prog[it.cle]} ouvrir={ouvrir} couleur={couleur} />)}</div>
        </section>))}
    </div>);
}

// Regroupement par chapitre : un exercice figure sous chacun de ses chapitres (dans le niveau et l'enseignement demandés s'il y en a)
function regrouper(liste, chapitres, niv, ens) {
  return chapitres.filter(c => (!niv || c.niveau === niv) && (!ens || enseignementDe(c) === ens)).map(c => ({
    cle: c.id, titre: niv ? nomChapitre(c) : `${niveauLabel(c.niveau)} · ${nomChapitre(c)}`, items: liste.filter(i => i.chapitres.includes(c.id)),
  })).filter(g => g.items.length);
}

// Titre d'une étape : bien visible, numéroté (« 1. Ton niveau »), avec une mention discrète « facultatif »
function Etape({ n, titre, facultatif, couleur }) {
  return (
    <h3 style={{ margin: '24px 0 10px', padding: '0 0 5px', fontSize: 17, fontWeight: 800, color: KIT.txt, borderBottom: `3px solid ${couleur}`, display: 'flex', alignItems: 'baseline', gap: 8 }}>
      {n != null && <span style={{ color: couleur }}>{n}.</span>}<span>{titre}</span>
      {facultatif && <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>(facultatif)</span>}
    </h3>);
}

// ── Écran 2 : un type choisi ──
function EcranType({ couleur, type, items, chapitres, prog, sel, setSel, ouvrir }) {
  const parNiveau = type.filtre === 'niveau';
  const liste = filtrer(items, sel);
  const niveaux = parNiveau ? niveauxDuType(items, type.id) : [];
  const enss = parNiveau && sel.niv ? enseignementsDuNiveauType(items, type.id, sel.niv) : [];
  const chs = parNiveau && sel.niv ? chapitresDuNiveauType(items, type.id, sel.niv, sel.ens) : [];
  const groupes = parNiveau ? regrouper(liste, chapitres, sel.niv, sel.ens) : null;
  let k = 0;   // numéro d'étape : les étapes affichées se suivent (l'enseignement n'existe que pour certains niveaux)
  const grosBouton = { minHeight: 48, padding: '0 16px', fontSize: 15, fontWeight: 800 };
  return (
    <div style={{ maxWidth: 760 }}>
      <style>{CSS_LIGNES}</style>
      <p style={{ margin: '0 0 6px', fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>{type.but}</p>
      {parNiveau && <>
        <Etape n={++k} titre="Ton niveau" couleur={couleur} />
        <div role="group" aria-label="Niveau" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {niveaux.map(n => (
            <button key={n.key} type="button" aria-pressed={sel.niv === n.key} onClick={() => setSel({ ...sel, niv: n.key, ens: '', ch: '', ex: '' })}
              style={{ ...stylePetitBouton(sel.niv === n.key, couleur), ...grosBouton }}>{n.label} <span style={{ fontWeight: 600, opacity: .85 }}>· {n.n}</span></button>))}
          <button type="button" aria-pressed={!sel.niv} onClick={() => setSel({ ...sel, niv: '', ens: '', ch: '', ex: '' })}
            style={{ ...stylePetitBouton(!sel.niv, couleur), ...grosBouton, fontSize: 14, borderStyle: 'dashed' }}>Tous les niveaux</button>
        </div>
        {sel.niv && enss.length > 1 && <>
          <Etape n={++k} titre="Ton enseignement" facultatif couleur={couleur} />
          <div role="group" aria-label="Enseignement" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" aria-pressed={!sel.ens} onClick={() => setSel({ ...sel, ens: '', ch: '', ex: '' })} style={{ ...stylePetitBouton(!sel.ens, couleur), ...grosBouton, fontSize: 14 }}>Tous</button>
            {enss.map(e => (
              <button key={e.key} type="button" aria-pressed={sel.ens === e.key} onClick={() => setSel({ ...sel, ens: e.key, ch: '', ex: '' })}
                style={{ ...stylePetitBouton(sel.ens === e.key, couleur), ...grosBouton, fontSize: 14 }}>{e.label} <span style={{ fontWeight: 600, opacity: .85 }}>· {e.n}</span></button>))}
          </div></>}
        {sel.niv && <>
          <Etape n={++k} titre="Ton chapitre" facultatif couleur={couleur} />
          <div role="group" aria-label="Chapitre" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
            <button type="button" aria-pressed={!sel.ch} onClick={() => setSel({ ...sel, ch: '', ex: '' })} style={{ ...carte(!sel.ch, couleur), minHeight: 48, fontWeight: 800, fontSize: 14 }}>
              Tous les chapitres <span style={{ fontWeight: 600, color: KIT.txt2 }}>· {filtrer(items, { type: type.id, niv: sel.niv, ens: sel.ens }).length}</span></button>
            {chs.map(({ chap, n }) => (
              <button key={chap.id} type="button" aria-pressed={sel.ch === chap.id} onClick={() => setSel({ ...sel, ens: enseignementDe(chap) || sel.ens, ch: chap.id, ex: '' })} style={{ ...carte(sel.ch === chap.id, couleur), minHeight: 48, fontSize: 14, fontWeight: 700 }}>
                <span style={{ flex: 1 }}>{nomChapitre(chap)}</span><span style={{ fontWeight: 600, color: KIT.txt2, flex: 'none' }}>{n}</span></button>))}
          </div></>}
        {type.difficulte && <>
          <Etape n={sel.niv ? ++k : null} titre="La difficulté" facultatif couleur={couleur} />
          <div role="group" aria-label="Difficulté" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" aria-pressed={!sel.dif} onClick={() => setSel({ ...sel, dif: '', ex: '' })} style={{ ...stylePetitBouton(!sel.dif, couleur), minHeight: 44, padding: '0 14px', fontSize: 14, fontWeight: 800 }}>Toutes</button>
            {difficultesDuType(items, sel, type).filter(d => d.n > 0).map(d => (
              <button key={d.dif} type="button" aria-pressed={sel.dif === d.dif} onClick={() => setSel({ ...sel, dif: d.dif, ex: '' })} style={{ ...stylePetitBouton(sel.dif === d.dif, couleur), minHeight: 44, padding: '0 14px', fontSize: 14, fontWeight: 800 }}>
                {'★'.repeat(Number(d.dif))} {type.difficulte[d.dif]} <span style={{ fontWeight: 600, opacity: .85 }}>· {d.n}</span></button>))}
          </div></>}
        <Etape n={sel.niv ? ++k : null} titre={sel.niv ? 'Ton exercice' : 'Les exercices'} couleur={couleur} />
        <div style={{ margin: '-4px 0 10px', fontSize: 13.5, color: KIT.txt2 }}>{liste.length} exercice{liste.length > 1 ? 's' : ''}</div>
      </>}
      <ListeExos liste={liste} prog={prog} ouvrir={ouvrir} couleur={couleur} groupes={groupes} />
    </div>);
}

// ── Composant public : tout l'avant-exercice ──
//  sel / setSel : sélection courante ; items : exercices rangés (realiserParcours.construireItems) ; ouvrir(it) : ouvre l'exercice
export function ParcoursCompetence({ code, titre, intro, couleur, types, items, chapitres, prog, sel, setSel, ouvrir }) {
  const type = types.find(t => t.id === sel.type);
  const choisirType = (t, its) => {
    if (its.length === 1 && !t.filtre) ouvrir(its[0], { ...SEL_VIDE, type: t.id });      // un seul exercice : inutile de faire choisir
    else setSel({ ...SEL_VIDE, type: t.id });
  };
  return (
    <div>
      {type && <FilAriane code={code} couleur={couleur} types={types} chapitres={chapitres} sel={sel} setSel={setSel} />}
      <h2 style={{ margin: '0 0 6px', fontSize: 20, color: KIT.txt, fontWeight: 800 }}>{type ? type.nom : titre}</h2>
      {!type && <p style={{ margin: '0 0 12px', fontSize: 14, color: KIT.txt2, lineHeight: 1.55 }}>{intro}</p>}
      {type
        ? <EcranType couleur={couleur} type={type} items={items} chapitres={chapitres} prog={prog} sel={sel} setSel={setSel} ouvrir={it => ouvrir(it, sel)} />
        : <EcranTypes couleur={couleur} types={types} items={items} prog={prog} choisir={choisirType} />}
    </div>);
}
