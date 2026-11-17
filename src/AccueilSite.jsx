import { BoutonMail } from "./contact";
import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
const SimulationClassement = lazy(() => import("./simulations/Classement").then(m => ({ default: m.SimulationClassement })));
import { ACCENT } from "./theme";
import "./AccueilBlocs.css";
import { Pic, Emo } from "./Pictos";
import { CHAPITRES as TOUS_CHAPITRES, NIVEAUX_CHAPITRES, SIMS_HORS_MENU } from "./chapitres";
const CHAPITRES = TOUS_CHAPITRES.map(c => ({ ...c, sims: c.sims.filter(id => !SIMS_HORS_MENU.has(id)) })).filter(c => c.sims.length > 0);

// ============================================================
//  PAGE D'ACCUEIL : texte de présentation, récapitulatif des niveaux et de leurs chapitres,
//  simulation mise en avant, Energy@School, contact et rappel discret du compte.
//  (Les simulations se trouvent dans les menus de l'en-tête.)
// ============================================================
const lien = { all: 'unset', cursor: 'pointer', color: ACCENT, fontWeight: 700, textDecoration: 'underline' };

import { SaisieCode } from "./SaisieCode";
import { InstallerAppli } from "./InstallerAppli";

// Niveau mémorisé sur l'appareil : celui déjà consulté sur l'accueil, sinon celui choisi dans « Je m'entraîne »
function niveauMemorise(cles) {
  try {
    for (const k of ['accueil-niveau-v1', 'entrainement-niveau-v1']) {
      const v = JSON.parse(window.localStorage.getItem(k) || 'null');
      if (cles.includes(v)) return v;
    }
  } catch { /* stockage indisponible : on part du premier niveau */ }
  return cles[0];
}

// Les niveaux : grille de blocs sur grand écran ; sur téléphone, une seule « lame » par niveau,
// qu'on fait glisser sur le côté ou qu'on choisit avec les pastilles (la carte suivante dépasse un peu).
function NiveauxParNiveau({ onStart, niveaux, classes, sansEmoji }) {
  const cles = NIVEAUX_CHAPITRES.map(n => n.key);
  const [actif, setActif] = useState(() => niveauMemorise(cles));
  const piste = useRef(null);
  const minuteur = useRef(null);
  const calme = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const defiler = useCallback((cle, doux) => {
    const p = piste.current, carte = p?.querySelector(`[data-niv="${cle}"]`);
    if (!p || !carte || p.scrollWidth <= p.clientWidth + 1) return;   // grille de grand écran : rien à faire glisser
    p.scrollTo({ left: carte.offsetLeft, behavior: doux && !calme() ? 'smooth' : 'auto' });
  }, []);

  // Au premier affichage : se placer sur le niveau mémorisé, sans animation
  const actifInitial = useRef(actif);
  useEffect(() => { defiler(actifInitial.current, false); }, [defiler]);
  useEffect(() => () => clearTimeout(minuteur.current), []);

  // Sur téléphone, la lame prend la hauteur du niveau affiché (les niveaux n'ont pas tous autant de chapitres)
  useEffect(() => {
    const p = piste.current, carte = p?.querySelector(`[data-niv="${actif}"]`);
    if (!p || !carte) return undefined;
    const mesurer = () => p.style.setProperty('--ab-h', `${carte.offsetHeight}px`);
    mesurer();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(mesurer);
    ro.observe(carte);
    return () => ro.disconnect();
  }, [actif]);

  const choisir = cle => {
    setActif(cle);
    try { window.localStorage.setItem('accueil-niveau-v1', JSON.stringify(cle)); } catch { /* sans importance */ }
  };
  // Pendant le balayage, la pastille suit la carte la plus proche
  const surDefilement = () => {
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      const p = piste.current;
      if (!p || p.scrollWidth <= p.clientWidth + 1) return;
      let meilleur = actif, ecart = Infinity;
      p.querySelectorAll('[data-niv]').forEach(c => {
        const e = Math.abs(c.offsetLeft - p.scrollLeft);
        if (e < ecart) { ecart = e; meilleur = c.dataset.niv; }
      });
      if (meilleur !== actif) choisir(meilleur);
    }, 80);
  };
  const toucher = cle => { choisir(cle); defiler(cle, true); };

  return (
    <div className="ab-niveaux">
      <div className="ab-ongl" role="group" aria-label="Choisir un niveau">
        {NIVEAUX_CHAPITRES.map(n => (
          <button key={n.key} type="button" className={`ab-ong ${classes[n.key]}`} aria-current={actif === n.key ? 'true' : undefined} onClick={() => toucher(n.key)}>{n.key === 'BTS' ? 'Post-bac' : n.key}</button>
        ))}
      </div>
      <div className="ab-piste" ref={piste} onScroll={surDefilement}>
        {NIVEAUX_CHAPITRES.map(n => {
          const chaps = CHAPITRES.filter(c => c.niveau === n.key);
          const nb = chaps.reduce((t, c) => t + c.sims.length, 0);
          return (
            <section key={n.key} data-niv={n.key} className={`ab-niv ${classes[n.key]}`} aria-label={niveaux[n.key]}>
              <span className="ab-abbr" aria-hidden="true">{n.key === 'BTS' ? 'Post-bac' : n.key}</span>
              <h3>{n.key === 'BTS' ? 'BTS MDC / IUT' : niveaux[n.key]}</h3>
              {n.key === 'BTS' && <p className="ab-precis">Référentiel du BTS Métiers de la chimie ; utilisable en IUT selon vos programmes locaux.</p>}
              <p className="ab-nb">{nb} simulation{nb > 1 ? 's' : ''} · {chaps.length} chapitre{chaps.length > 1 ? 's' : ''}</p>
              <ul className="ab-puces">
                {chaps.map(c => <li key={c.id}><button type="button" onClick={() => onStart(c.sims[0])}>{sansEmoji(c.label)}</button></li>)}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function AccueilSite({ onStart, onCode, session, simulations, energyUrl }) {
  const profil = session?.profil;
  const niveaux = { '2GT': 'Seconde', '1G': 'Première spé PC', TG: 'Terminale spé PC', TSTL: 'Terminale STL', BTS: 'Post-bac (BTS MDC / IUT)' };
  const classes = { '2GT': 'ab-t2gt', '1G': 'ab-t1g', TG: 'ab-ttg', TSTL: 'ab-ttstl', BTS: 'ab-tbts' };
  const sansEmoji = s => s.replace(/^[^\p{L}\d]+/u, '');
  const totalSims = CHAPITRES.reduce((t, c) => t + c.sims.length, 0);
  return (
    <div className="ab">

      {/* Présentation + code d'un exercice */}
      <section className="ab-hero" aria-label="Présentation">
        <div>
          <h1><span className="ab-etiquette">Paillasse virtuelle</span>Manipuler, se tromper, <mark>recommencer.</mark></h1>
          <p className="ab-lead">La paillasse du labo, sans la verrerie. Des simulations de chimie et de physique pour la Seconde, la Première spé PC, la Terminale spé PC, la Terminale STL et le post-bac (BTS Métiers de la chimie, IUT) : parcours guidés, exploration libre, défis et exercices par compétence.</p>
        </div>
        <div className="ab-code"><SaisieCode onCode={onCode} simulations={simulations} sombre /></div>
      </section>

      {/* Les niveaux et leurs chapitres : chaque chapitre ouvre sa première simulation */}
      <div className="ab-titre-section"><h2 id="titre-niveaux">Les simulations, par niveau</h2><span>{totalSims} simulations · {CHAPITRES.length} chapitres</span></div>
      <NiveauxParNiveau onStart={onStart} niveaux={niveaux} classes={classes} sansEmoji={sansEmoji} />

      <div className="ab-bento">
        {/* Classement public : les 5 premiers de chaque lame */}
        <section className="ab-classement" aria-labelledby="titre-classement">
          <span className="ab-pill">Nouveau</span>
          <h3 id="titre-classement">Le classement de la paillasse</h3>
          <p>Fais glisser pour changer de classement. Pour y apparaître : choisis un pseudo et coche la case dans « Mon compte ».</p>
          <Suspense fallback={null}><SimulationClassement naviguer={onStart} accueil /></Suspense>
        </section>

        <section className="ab-carte" aria-labelledby="titre-energy">
          <div className="ab-pic" style={{ background: '#f5a31a' }} aria-hidden="true"><Pic n="bolt" t={28}/></div>
          <h3 id="titre-energy">Energy@School</h3>
          <p>Production, transport, stockage de l’énergie et hydrogène : les simulations pour préparer la journée à Grenoble INP – Ense³.</p>
          <a href={energyUrl} className="ab-bouton">Découvrir le site ↗</a>
        </section>

        <section className="ab-carte" aria-label="Installer l’application"><InstallerAppli /></section>

        <section className="ab-carte" aria-labelledby="titre-contact">
          <div className="ab-pic" style={{ background: '#dce9f7', color: '#0b4f94', '--ia': '#f5a31a' }} aria-hidden="true"><Pic n="users" t={28}/></div>
          <h3 id="titre-contact">Un coup de main pour vos classes ?</h3>
          <p>Prise en main du site, simulation à adapter à votre séquence, idée de nouvelle simulation : n’hésitez pas à me contacter via mon adresse mail académique !</p>
          <span style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="ab-bouton" onClick={() => onStart(105)}>Pour les enseignants</button>
            <BoutonMail libelle={<><Pic n="mail"/>Me contacter</>} sujet="Besoin d'un coup de main pour ma classe — Paillasse virtuelle" couleur={ACCENT} plein/>
          </span>
        </section>
      </div>

      {/* Compte : discret, facultatif */}
      <p className="ab-compte">
        {profil
          ? <>Bon retour, <b>{profil.identifiant || profil.nom}</b>. <button onClick={() => onStart(profil.role === 'prof' ? 40 : 39)} style={lien}>Mon espace</button></>
          : <>Un compte est facultatif : il sert à garder sa progression d’un appareil à l’autre. <button onClick={() => onStart(39)} style={lien}>Me connecter ou demander un compte</button></>}
      </p>
    </div>
  );
}
