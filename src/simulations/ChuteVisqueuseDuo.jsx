import { useState } from "react";
import { cardStyle, KIT, stylePetitBouton } from "../commun";
import { SimulationChuteVisqueuse } from "./ChuteVisqueuse";
import { SimulationEulerChute } from "./EulerChute";

// Simulation 270 : « Chute avec frottement visqueux », deux parties dans une seule entrée du menu.
// Partie 1 : régimes transitoire et permanent, vitesse limite, constante de temps. Partie 2 : poussée d'Archimède, équation différentielle, méthode d'Euler.
// Chaque partie garde son parcours guidé, son exploration et ses défis (états sauvegardés séparément).
export function SimulationChuteVisqueuseDuo() {
  const [partie, setPartie] = useState(1);
  return (
    <div>
      <div style={{ ...cardStyle, textAlign: 'left', marginBottom: 10, padding: '10px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Deux parties, à suivre dans l’ordre :</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setPartie(1)} aria-pressed={partie === 1} style={stylePetitBouton(partie === 1, '#0b4f94')}>1. Vitesse limite et constante de temps</button>
          <button onClick={() => setPartie(2)} aria-pressed={partie === 2} style={stylePetitBouton(partie === 2, '#0b4f94')}>2. Équation différentielle et méthode d’Euler</button>
        </div>
      </div>
      {partie === 1 ? <SimulationChuteVisqueuse key="p1"/> : <SimulationEulerChute key="p2"/>}
    </div>);
}
