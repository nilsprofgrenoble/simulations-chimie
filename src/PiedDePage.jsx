import { LogoPaillasse } from "./Logo";
import { STATS_ACTIVES } from "./stats";
import { ecrireAuAuteur } from "./contact";

// Pied de page : présent en bas de toutes les pages du site.
const lien = { color: '#e2e8f0', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  font: 'inherit', fontSize: 14, textAlign: 'left' };

export function PiedDePage({ naviguer, energyUrl }) {
  const aller = (id) => e => { e.preventDefault(); naviguer(id); };
  return (
    <footer style={{ background: '#0f172a', color: '#cbd5e1', padding: '28px 20px 22px', marginTop: 32, fontFamily: "'Nunito', 'Segoe UI', sans-serif", textAlign: 'left' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '24px 48px', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ background: 'white', display: 'inline-block', borderRadius: 12, padding: '6px 10px' }}><LogoPaillasse taille={34}/></div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '10px 0 0', maxWidth: 360 }}>
            Simulations de chimie et de physique pour la Seconde, la Première spé PC, la Terminale STL et le BTS Métiers de la chimie.
          </p>
        </div>
        <nav aria-label="Liens du pied de page" style={{ flex: '1 1 280px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px 28px', alignContent: 'start' }}>
          <a href="?" onClick={aller(0)} style={lien}>Accueil</a>
          <a href="?sim=47" onClick={aller(47)} style={lien}>À propos</a>
          <button type="button" onClick={() => ecrireAuAuteur('Paillasse virtuelle — message')} style={lien}>Contact</button>
          <a href="?sim=38" onClick={aller(38)} style={lien}>Travail par compétence</a>
          <a href="?sim=39" onClick={aller(39)} style={lien}>Mon compte</a>
          <a href={energyUrl} style={lien}>Energy@School ↗</a>
          <a href="?sim=47" onClick={aller(47)} style={lien}>Données personnelles</a>
          <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr" target="_blank" rel="noopener noreferrer" style={lien}>Licence CC BY-NC-ND 4.0 ↗</a>
        </nav>
      </div>
      <div style={{ maxWidth: 1100, margin: '20px auto 0', paddingTop: 14, borderTop: '1px solid #334155', fontSize: 12.5, lineHeight: 1.6, color: '#94a3b8' }}>
        © {new Date().getFullYear()} Nils Aronssohn · Paillasse virtuelle · libre d'accès, reproduction et modification non autorisées
        {STATS_ACTIVES && <> · statistiques de fréquentation anonymes, sans cookie ni compte</>}
      </div>
    </footer>
  );
}
