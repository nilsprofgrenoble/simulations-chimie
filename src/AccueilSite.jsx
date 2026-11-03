import { BoutonMail } from "./contact";
import { A_LA_UNE } from "./aLaUne";
import { ACCENT } from "./theme";
import "./AccueilBlocs.css";
import { Pic, Emo } from "./Pictos";
import { CHAPITRES, NIVEAUX_CHAPITRES } from "./chapitres";

// ============================================================
//  PAGE D'ACCUEIL : texte de présentation, récapitulatif des niveaux et de leurs chapitres,
//  simulation mise en avant, Energy@School, contact et rappel discret du compte.
//  (Les simulations se trouvent dans les menus de l'en-tête.)
// ============================================================
const lien = { all: 'unset', cursor: 'pointer', color: ACCENT, fontWeight: 700, textDecoration: 'underline' };

import { SaisieCode } from "./SaisieCode";
import { InstallerAppli } from "./InstallerAppli";

export function AccueilSite({ onStart, onCode, session, simulations, energyUrl }) {
  const profil = session?.profil;
  const sim = simulations.find(s => s.id === A_LA_UNE.id);
  const niveaux = { '2GT': 'Seconde', '1G': 'Première spé PC', TSTL: 'Terminale STL', BTS: 'BTS Métiers de la chimie' };
  const classes = { '2GT': 'ab-t2gt', '1G': 'ab-t1g', TSTL: 'ab-ttstl', BTS: 'ab-tbts' };
  const sansEmoji = s => s.replace(/^[^\p{L}\d]+/u, '');
  const totalSims = CHAPITRES.reduce((t, c) => t + c.sims.length, 0);
  return (
    <div className="ab">

      {/* Présentation + code d'un exercice */}
      <section className="ab-hero" aria-label="Présentation">
        <div>
          <h1><span className="ab-etiquette">Paillasse virtuelle</span>Manipuler, se tromper, <mark>recommencer.</mark></h1>
          <p className="ab-lead">La paillasse du labo, sans la verrerie. Des simulations de chimie et de physique pour la Seconde, la Première spé PC, la Terminale STL et le BTS Métiers de la chimie : parcours guidés, exploration libre, défis et exercices par compétence.</p>
        </div>
        <div className="ab-code"><SaisieCode onCode={onCode} simulations={simulations} sombre /></div>
      </section>

      {/* Les niveaux et leurs chapitres : chaque chapitre ouvre sa première simulation */}
      <div className="ab-titre-section"><h2 id="titre-niveaux">Les simulations, par niveau</h2><span>{totalSims} simulations · {CHAPITRES.length} chapitres</span></div>
      <div className="ab-bento">
        {NIVEAUX_CHAPITRES.map(n => {
          const chaps = CHAPITRES.filter(c => c.niveau === n.key);
          const nb = chaps.reduce((t, c) => t + c.sims.length, 0);
          return (
            <section key={n.key} className={`ab-niv ${classes[n.key]}`} aria-label={niveaux[n.key]}>
              <span className="ab-abbr" aria-hidden="true">{n.key}</span>
              <h3>{niveaux[n.key]}</h3>
              <p className="ab-nb">{nb} simulations · {chaps.length} chapitres</p>
              <ul className="ab-puces">
                {chaps.map(c => <li key={c.id}><button type="button" onClick={() => onStart(c.sims[0])}>{sansEmoji(c.label)}</button></li>)}
              </ul>
            </section>
          );
        })}

        {/* Simulation mise en avant */}
        {sim && (
          <section className="ab-une" aria-labelledby="titre-une">
            <div className="ab-ico" aria-hidden="true"><Emo e={sim.icon} t={40}/></div>
            <div>
              <span className="ab-pill">{A_LA_UNE.badge}</span><span className="ab-niveau">{A_LA_UNE.niveau || niveaux[sim.niveau]}</span>
              <h3 id="titre-une">{sim.label}</h3>
              <p>{A_LA_UNE.accroche}</p>
            </div>
            <button type="button" className="ab-bouton" onClick={() => onStart(sim.id)}>Essayer →</button>
          </section>
        )}

        <section className="ab-carte" aria-labelledby="titre-energy">
          <div className="ab-pic" style={{ background: '#f5a31a' }} aria-hidden="true"><Pic n="bolt" t={28}/></div>
          <h3 id="titre-energy">Energy@School</h3>
          <p>Production, transport, stockage de l’énergie et hydrogène : les simulations pour préparer la journée à Grenoble INP – Ense³.</p>
          <a href={energyUrl} className="ab-bouton">Découvrir le site ↗</a>
        </section>

        <section className="ab-carte" aria-label="Installer l’application"><InstallerAppli /></section>

        <section className="ab-carte" aria-labelledby="titre-contact">
          <div className="ab-pic" style={{ background: '#dce9f7' }} aria-hidden="true"><Pic n="users" t={28}/></div>
          <h3 id="titre-contact">Un coup de main pour vos classes ?</h3>
          <p>Prise en main du site, simulation à adapter à votre séquence, idée de nouvelle simulation : n’hésitez pas à me contacter via mon adresse mail académique !</p>
          <BoutonMail libelle={<><Pic n="mail"/>Me contacter</>} sujet="Besoin d'un coup de main pour ma classe — Paillasse virtuelle" couleur={ACCENT} plein/>
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
