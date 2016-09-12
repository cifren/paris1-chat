import React from 'react';
import PanelBody from '../core/PanelBody.jsx';

class ChatBoxAbout extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let styleJustified = {textAlign: "justify"};
    let styleCentered = {textAlign: "center"};
    return (
      <div role="tabpanel" className={(this.props.currentTab === "about") ? "tab-pane fade active in" : "tab-pane fade"} id="about">
        <h5 className="title">
          Tchat Paris 1
        </h5>
        <p>Développeur : Guillaume Fay</p>
        <h5>Utilisation du tchat</h5>
          <ul>
            <li>
              <h5>Onglet accueil</h5>
              <p style={styleJustified}>L'onglet d'accueil contient une section qui regroupe tous les utilisateurs connectés dans votre direction et une section "favoris". Pour ajouter un utilisateur à vos favoris, il suffit d'utiliser le clique droit sur l'icone du correspondant ou de cliquer sur l'étoile lors d'une discussion.</p>
            </li>
            <li>
              <h5>Onglet messages</h5>
              <p style={styleJustified}>Dans cette onglet, vous accédez à l'historique de toutes vos conversations. Elle sont triées par ordre chronologique, de la plus récente à la plus ancienne (dernier message reçu).</p>
            </li>
            <li>
              <h5>Recherche</h5>
              <p style={styleJustified}>La barre de recherche permet de trouver une personne qui travaille dans une autre direction que la votre. Afin de revenir à l'onglet d'accueil, il faut que la barre de recherche soit vide ou commencer une discussion.</p>
            </li>
            <li>
              <h5>Options</h5>
              <p style={styleJustified}>Dans le menu "Options", vous pouvez mettre à jour votre statut (en ligne, occupé et invisible), activer ou désactiver les bruitages à la réception d'un nouveau message et gérer la visibilité de votre photo (Si votre correspondant ne peut pas voir votre photo, vous ne le pourrez pas non plus). En mode invisible, votre correspondant ne sera pas notifié lorsque vous écrivez un message ou lisez un message.</p>
            </li>
            <li>
              <h5>Minimiser et maximiser la fenêtre</h5>
              <p style={styleJustified}>Vous pouvez minimiser le tchat en cliquant sur la barre de navigation ou dans le menu sur le bouton "minimiser". Lorsque le tchat est minimisé, il suffit de cliquer dessus pour l'agrandir.</p>
            </li>
            <li>
              <h5>Déconnection</h5>
              <p style={styleJustified}>Cliquez sur le bouton "Se déconnecter" pour quitter le tchat. Il faudra revenir sur cette page pour le réactiver.</p>
            </li>
          </ul>
        <p style={styleJustified}>Si vous rencontrez un bug, merci de contacter la DSIUN ou d'envoyer un email à <a href="mailto:assistance-dsiun@univ-paris1.fr">assistance-dsiun@univ-paris1.fr</a></p>
        <p style={styleCentered}>2016 Université Paris 1 Panthéon-Sorbonne</p>
      </div>
    );
  }
}

export default ChatBoxAbout;
