import { useState, useEffect, useRef } from "react";
import { lireClassementPublic, rest, useSession, estEleve } from "../serveur";
import { LAMES, libelleScore, medaille, estMoi, lignesDe, jourLundi } from "../classement";
import { pseudo } from "../classe";

// ═══════════════════════════════════════════════════════════════════════════
//  « CLASSEMENT » (page n° 104, ouverte à tous, même sans compte) : quatre classements sur des lames qu'on fait glisser
//  (étoiles · cette semaine · défis · régularité). Ne montre que les élèves qui ont choisi d'apparaître : pseudo tiré
//  d'une liste fixe, établissement, classe, score. Les scores sont calculés par le serveur (supabase/13-classement.sql).
//  Si ce script n'a pas été exécuté dans Supabase, la page l'indique simplement.
// ═══════════════════════════════════════════════════════════════════════════
const css = `
  .cl { max-width: 880px; margin: 0 auto; padding: 4px 0 30px; text-align: left; color: #0f172a; font-family: 'Nunito', 'Segoe UI', sans-serif; }
  .cl-intro { margin: 0 0 14px; font-size: 15px; color: #334155; line-height: 1.5; }
  .cl-onglets { position: relative; display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 6px; scrollbar-width: none; }
  .cl-onglets::-webkit-scrollbar { display: none; }
  .cl-onglet { flex: none; display: inline-flex; align-items: center; gap: 6px; border: 2px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 999px; padding: 8px 15px; font: 800 14.5px inherit; font-family: inherit; cursor: pointer; }
  .cl-onglet:hover { border-color: var(--c); }
  .cl-onglet[aria-selected="true"] { background: var(--c); border-color: var(--c); color: #fff; }
  .cl-onglet:focus-visible, .cl-fleche:focus-visible, .cl-lien:focus-visible { outline: 3px solid #0b4f94; outline-offset: 2px; }
  .cl-piste { display: flex; align-items: flex-start; overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; scrollbar-width: none; margin-top: 8px; border-radius: 22px; }
  .cl-piste::-webkit-scrollbar { display: none; }
  .cl-lame { flex: 0 0 100%; box-sizing: border-box; scroll-snap-align: start; scroll-snap-stop: always; border-radius: 22px; border: 1px solid #d5dfeb; background: #fff; overflow: hidden; }
  .cl-tete { padding: 16px 18px; background: var(--f); border-bottom: 1px solid #e2e8f0; }
  .cl-tete h3 { margin: 0; font: 800 21px Outfit, Inter, sans-serif; color: var(--c); display: flex; align-items: center; gap: 8px; }
  .cl-tete p { margin: 5px 0 0; font-size: 14px; color: #334155; line-height: 1.45; }
  .cl-liste { list-style: none; margin: 0; padding: 0; }
  .cl-cols, .cl-ligne { display: grid; grid-template-columns: 48px minmax(0, 1.5fr) minmax(0, 1.3fr) minmax(0, .8fr) minmax(70px, auto); gap: 10px; align-items: center; padding: 10px 18px; }
  .cl-cols { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-top: 8px; padding-bottom: 8px; }
  .cl-ligne { border-bottom: 1px solid #f1f5f9; font-size: 15px; }
  .cl-ligne:last-child { border-bottom: none; }
  .cl-ligne.cl-moi { background: #eff6ff; box-shadow: inset 4px 0 0 #0b4f94; }
  .cl-rang { font: 800 18px Outfit, Inter, sans-serif; color: #475569; text-align: center; }
  .cl-pseudo { font-weight: 800; overflow-wrap: anywhere; }
  .cl-toi { margin-left: 6px; font-size: 11.5px; background: #0b4f94; color: #fff; border-radius: 999px; padding: 2px 8px; vertical-align: 2px; }
  .cl-etab, .cl-classe { color: #334155; overflow-wrap: anywhere; font-size: 14.5px; }
  .cl-score { font-weight: 800; text-align: right; color: var(--c); white-space: nowrap; }
  .cl-sous { display: none; }
  .cl-vide { padding: 26px 18px; text-align: center; color: #475569; font-size: 15px; line-height: 1.5; }
  .cl-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; }
  .cl-fleche { border: 2px solid #cbd5e1; background: #fff; border-radius: 50%; width: 38px; height: 38px; font-size: 18px; font-weight: 800; cursor: pointer; color: #0f172a; }
  .cl-fleche:disabled { opacity: .35; cursor: default; }
  .cl-points { display: flex; gap: 7px; }
  .cl-point { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; border: none; padding: 0; cursor: pointer; }
  .cl-point[aria-current="true"] { background: #0b4f94; transform: scale(1.25); }
  .cl-note { margin: 16px 0 0; font-size: 13.5px; color: #475569; line-height: 1.55; }
  .cl-lien { border: none; background: none; padding: 0; font: inherit; font-weight: 800; color: #0b4f94; text-decoration: underline; cursor: pointer; }
  @media (max-width: 620px) {
    .cl-cols { display: none; }
    .cl-ligne { grid-template-columns: 40px minmax(0, 1fr) auto; grid-template-areas: "rang pseudo score" "rang sous sous"; row-gap: 2px; padding: 11px 14px; }
    .cl-rang { grid-area: rang; }
    .cl-pseudo { grid-area: pseudo; }
    .cl-score { grid-area: score; }
    .cl-etab, .cl-classe { display: none; }
    .cl-sous { display: block; grid-area: sous; font-size: 13.5px; color: #475569; overflow-wrap: anywhere; }
  }
  @media (prefers-reduced-motion: reduce) { .cl-piste { scroll-behavior: auto; } }
`;

function Lame({ lame, lignes, moi, lundi }) {
  return (
    <section className="cl-lame" id={`cl-lame-${lame.code}`} role="tabpanel" aria-labelledby={`cl-onglet-${lame.code}`} style={{ '--c': lame.couleur, '--f': lame.fond }}>
      <header className="cl-tete">
        <h3><span aria-hidden="true">{lame.icone}</span>{lame.titre}</h3>
        <p>{lame.sous}{lame.code === 'semaine' && lundi ? ` (depuis lundi ${lundi})` : ''}</p>
      </header>
      {lignes.length === 0
        ? <div className="cl-vide">Personne n’est encore dans ce classement.<br />Sois le premier ou la première !</div>
        : (<>
          <div className="cl-cols" aria-hidden="true"><span>Rang</span><span>Pseudo</span><span>Établissement</span><span>Classe</span><span style={{ textAlign: 'right' }}>Score</span></div>
          <ol className="cl-liste" aria-label={`Classement : ${lame.titre}`}>
            {lignes.map((l, i) => {
              const p = pseudo(l.adj, l.nom), m = estMoi(l, moi), med = medaille(l.rang);
              return (
                <li key={`${l.etab}|${l.classe}|${l.adj}|${l.nom}|${i}`} className={`cl-ligne${m ? ' cl-moi' : ''}`}>
                  <span className="cl-rang" aria-label={`Rang ${l.rang}`}>{med || l.rang}</span>
                  <span className="cl-pseudo"><span aria-hidden="true">{p.icone}</span> {p.texte}{m && <b className="cl-toi">toi</b>}</span>
                  <span className="cl-etab">{l.etab}</span>
                  <span className="cl-classe">{l.classe}</span>
                  <span className="cl-sous">{l.etab} · {l.classe}</span>
                  <span className="cl-score">{libelleScore(lame, l.score)}</span>
                </li>);
            })}
          </ol>
        </>)}
    </section>);
}

export function SimulationClassement({ naviguer }) {
  const sess = useSession();
  const [donnees, setDonnees] = useState(null), [erreur, setErreur] = useState(false), [charge, setCharge] = useState(true);
  const [idx, setIdx] = useState(0), [moi, setMoi] = useState(null);
  const piste = useRef(null);

  const [essai, setEssai] = useState(0);
  useEffect(() => {
    let vivant = true;
    lireClassementPublic().then(d => { if (vivant) { setDonnees(d); setCharge(false); } }).catch(() => { if (vivant) { setErreur(true); setCharge(false); } });
    return () => { vivant = false; };
  }, [essai]);
  const lire = () => { setCharge(true); setErreur(false); setEssai(n => n + 1); };

  // Un élève connecté retrouve sa propre ligne (mise en valeur) s'il a accepté d'apparaître
  const eleve = estEleve(sess);
  useEffect(() => {
    if (!eleve) return undefined;
    let vivant = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([rest('pseudos?select=adj,nom,classement'), rest('classes?select=nom,etablissement')]);
        if (vivant && p[0]?.classement && c[0]?.etablissement) setMoi({ adj: p[0].adj, nom: p[0].nom, classe: c[0].nom, etab: c[0].etablissement });
      } catch { /* migration absente ou réseau coupé : pas de mise en valeur */ }
    })();
    return () => { vivant = false; };
  }, [eleve]);

  const aller = i => {
    const el = piste.current;
    if (!el) return;
    const k = Math.max(0, Math.min(LAMES.length - 1, i));
    const reduit = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: k * el.clientWidth, behavior: reduit ? 'auto' : 'smooth' });
    setIdx(k);
  };
  const surDefilement = e => {
    const el = e.currentTarget, i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (i !== idx && i >= 0 && i < LAMES.length) setIdx(i);
  };
  // la barre d'onglets suit la lame affichée (quand on fait glisser avec le doigt)
  useEffect(() => {
    const t = document.getElementById(`cl-onglet-${LAMES[idx].code}`), barre = t?.parentElement;
    if (barre) barre.scrollTo({ left: Math.max(0, t.offsetLeft - (barre.clientWidth - t.offsetWidth) / 2), behavior: 'smooth' });
  }, [idx]);
  const clavier = e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); aller(idx + 1); document.getElementById(`cl-onglet-${LAMES[Math.min(LAMES.length - 1, idx + 1)].code}`)?.focus(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); aller(idx - 1); document.getElementById(`cl-onglet-${LAMES[Math.max(0, idx - 1)].code}`)?.focus(); }
  };

  const lundi = jourLundi(donnees);
  return (
    <div className="cl" data-classement>
      <style>{css}</style>
      <p className="cl-intro">Fais glisser les lames pour changer de classement. Seuls les élèves qui l’ont choisi apparaissent, sous un pseudo.</p>

      {erreur && (
        <div className="cl-vide" role="status" style={{ border: '1px solid #d5dfeb', borderRadius: 18, background: '#fff' }}>
          Le classement n’est pas disponible pour le moment.<br />
          <button type="button" className="cl-lien" onClick={lire}>Réessayer</button>
        </div>)}

      {!erreur && (
        <>
          <div className="cl-onglets" role="tablist" aria-label="Choisir un classement" onKeyDown={clavier}>
            {LAMES.map((l, i) => (
              <button key={l.code} id={`cl-onglet-${l.code}`} type="button" role="tab" className="cl-onglet" style={{ '--c': l.couleur }}
                aria-selected={idx === i} aria-controls={`cl-lame-${l.code}`} tabIndex={idx === i ? 0 : -1} onClick={() => aller(i)}>
                <span aria-hidden="true">{l.icone}</span>{l.titre}
              </button>))}
          </div>
          <div className="cl-piste" ref={piste} onScroll={surDefilement} aria-busy={charge}>
            {LAMES.map(l => <Lame key={l.code} lame={l} lignes={lignesDe(donnees, l.code)} moi={moi} lundi={lundi} />)}
          </div>
          <div className="cl-nav">
            <button type="button" className="cl-fleche" onClick={() => aller(idx - 1)} disabled={idx === 0} aria-label="Classement précédent">‹</button>
            <div className="cl-points" aria-hidden="true">{LAMES.map((l, i) => <button key={l.code} type="button" tabIndex={-1} className="cl-point" aria-current={idx === i} onClick={() => aller(i)} />)}</div>
            <button type="button" className="cl-fleche" onClick={() => aller(idx + 1)} disabled={idx === LAMES.length - 1} aria-label="Classement suivant">›</button>
          </div>
        </>)}

      <p className="cl-note">
        {eleve
          ? <>Tu n’apparais que si tu l’as choisi : <button type="button" className="cl-lien" onClick={() => naviguer(39)}>règle ça dans Mon compte</button>.</>
          : <>Tu as un compte élève ? Dans <button type="button" className="cl-lien" onClick={() => naviguer(39)}>Mon compte</button>, tu peux choisir un pseudo et décider d’apparaître ici.</>}
        {' '}Un pseudo est tiré d’une liste (jamais de nom ni d’identifiant). Les scores sont calculés à partir du travail enregistré dans les comptes ; ils servent à s’amuser, pas à noter.
      </p>
    </div>);
}
