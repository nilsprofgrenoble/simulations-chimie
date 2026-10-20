/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { styleBouton, KIT } from "./commun";

// ═══════════════════════════════════════════════════════════════════════════
//  CONTACT ANTI-ROBOTS : l'adresse mail n'est écrite en clair NULLE PART dans le site (ni dans le code publié,
//  ni dans le HTML). Elle n'est reconstituée qu'au clic sur le bouton, puis proposée à la messagerie (mailto)
//  et affichée au cas où la messagerie ne s'ouvre pas. Pour changer d'adresse :
//  en console Node :  Buffer.from('nouvelle@adresse.fr'.split('').reverse().join('')).toString('base64')
// ═══════════════════════════════════════════════════════════════════════════
const CONTACT_CODE = 'cmYuZWxib25lcmctY2FAbmhvc3Nub3JhLnNsaW4=';
const adresseContact = () => atob(CONTACT_CODE).split('').reverse().join('');

// Ouvre la messagerie vers l'auteur (même principe : l'adresse n'est reconstituée qu'au clic)
export function ecrireAuAuteur(sujet = '', corps = '') {
  const q = [sujet && `subject=${encodeURIComponent(sujet)}`, corps && `body=${encodeURIComponent(corps)}`].filter(Boolean).join('&');
  window.location.assign(`mailto:${adresseContact()}${q ? '?' + q : ''}`);
}

export function BoutonMail({ libelle = '✉️ Écrire un mail', sujet = '', corps = '', couleur = '#475569', plein = false }) {
  const [adresse, setAdresse] = useState('');
  const ecrire = () => {
    const a = adresseContact();
    setAdresse(a);
    const q = [sujet && `subject=${encodeURIComponent(sujet)}`, corps && `body=${encodeURIComponent(corps)}`].filter(Boolean).join('&');
    window.location.assign(`mailto:${a}${q ? '?' + q : ''}`);
  };
  return (
    <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button type="button" onClick={ecrire} style={styleBouton(plein, couleur)}>{libelle}</button>
      {adresse && <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Votre messagerie ne s’ouvre pas ? Écrivez à <b style={{ color: KIT.txt, userSelect: 'all' }}>{adresse}</b></span>}
    </span>);
}
