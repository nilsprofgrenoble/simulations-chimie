import "./Couverture.css";
import { bilan, couverturesDuNiveau, DATE_COUVERTURE } from "./couverture";

// ============================================================
//  COUVERTURE DES PROGRAMMES, sur l'accueil (une carte par niveau).
//  • BarresCouverture : la barre « programme couvert », de 0 à 100 % (une par programme : deux pour la Terminale STL, SPCL et PCM).
//  • ResteACouvrir : la liste repliable de ce qui n'existe pas encore (grisé), avec ce qui manque quand c'est en partie.
//  Les données et la règle de calcul sont dans src/couverture.js. Rien n'est signalé par la couleur seule :
//  trait plein = couvert, hachures = en partie, vide = à venir, et le pourcentage est écrit.
// ============================================================
export function BarresCouverture({ niveau }) {
  const progs = couverturesDuNiveau(niveau);
  if (!progs.length) return null;
  const plusieurs = progs.length > 1;
  return (
    <div className="cv" data-couverture={niveau}>
      {progs.map(p => {
        const b = bilan(p.parties);
        const texte = `${b.ok} partie${b.ok > 1 ? 's' : ''} du programme sur ${b.n} couverte${b.ok > 1 ? 's' : ''}${b.partiel ? `, ${b.partiel} en partie` : ''}`;
        return (
          <div className="cv-prog" key={p.id}>
            <div className="cv-ligne">
              <span className="cv-nom">{plusieurs ? `Programme ${p.label}` : 'Programme couvert'}</span>
              <span className="cv-pct">{b.pourcent} %</span>
            </div>
            <div className="cv-piste" role="img" aria-label={`${plusieurs ? p.label + ' : ' : ''}couverture estimée à ${b.pourcent} %. ${texte}.`}>
              <span className="cv-plein" style={{ width: `${b.fracOk * 100}%` }} />
              <span className="cv-hachure" style={{ width: `${b.fracPartiel * 100}%` }} />
            </div>
            <div className="cv-detail">{texte}</div>
          </div>
        );
      })}
      <p className="cv-note">Estimation au {DATE_COUVERTURE} : chaque partie du programme officiel compte pour 1 si elle est couverte, ½ si elle l’est en partie.</p>
    </div>
  );
}

export function ResteACouvrir({ niveau }) {
  const progs = couverturesDuNiveau(niveau);
  if (!progs.length) return null;
  const plusieurs = progs.length > 1;
  const reste = progs.map(p => ({ p, items: p.parties.filter(x => x.e !== 'ok') })).filter(x => x.items.length);
  const nb = reste.reduce((s, x) => s + x.items.length, 0);
  if (!nb) return null;
  return (
    <details className="cv-reste">
      <summary>Pas encore couvert ({nb})</summary>
      {reste.map(({ p, items }) => {
        let theme = null;
        return (
          <div className="cv-groupe" key={p.id}>
            {plusieurs && <h4 className="cv-prog-titre">{p.label}</h4>}
            <ul className="cv-liste">
              {items.map((x, i) => {
                const entete = x.th !== theme;
                theme = x.th;
                return (
                  <li key={i} className={`cv-item cv-${x.e}`}>
                    {entete && <span className="cv-theme" role="presentation">{x.th}</span>}
                    <span className="cv-intitule">
                      <span className="cv-etat">{x.e === 'partiel' ? 'en partie' : 'à venir'}</span>
                      {x.t}
                      {x.e === 'partiel' && x.reste && <span className="cv-manque">Manque : {x.reste}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </details>
  );
}
