// Logo de la Paillasse virtuelle : un ordinateur portable avec un erlenmeyer à l'écran (fichiers public/logo.png et public/logo-icone.png).
// avecTexte : logo complet avec le nom ; sinon, seulement le portable (petits écrans).
export function LogoPaillasse({ taille = 38, avecTexte = true }) {
  const base = import.meta.env.BASE_URL;
  return avecTexte
    ? <img src={`${base}logo.png`} alt="Paillasse virtuelle" height={Math.round(taille * 1.2)} width={Math.round(taille * 1.2 * 700 / 260)} style={{ display: 'block', height: taille * 1.2, width: 'auto' }}/>
    : <img src={`${base}logo-icone.png`} alt="Paillasse virtuelle" height={taille} width={taille} style={{ display: 'block', height: taille, width: taille }}/>;
}
