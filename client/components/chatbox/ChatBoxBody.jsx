import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import ChatBoxBodySection from './ChatBoxBodySection.jsx';
import UserButton from './UserButton.jsx';



class ChatBoxBody extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let offlineInfo, directionList, favList, searchList;
    if (this.props.user.status === 'offline'){
      offlineInfo = <div><p>Vous êtes déconnecté du serveur de messagerie instantanée.</p><p>Pour vous connecter cliquez sur le bouton en haut à droite de cette fenêtre.</p></div>;
    }
    else {
      if (this.props.searchState){
        searchList = <ChatBoxBodySection title="Recherche" list={this.props.searchList} noUserMessage="La recherche n'a retouné aucun résultat"/>
      }
      else {
        directionList = <ChatBoxBodySection title={this.props.user.direction[1]} list={this.props.directionList} noUserMessage="Aucun utilisateur n'est connecté"/>
        favList = <ChatBoxBodySection title="Mes favoris" list={this.props.favList} noUserMessage="Vous n'avez aucun favori"/>
      }
    }
    return (
      <PanelBody>
        {offlineInfo}
        {searchList}
        {directionList}
        {favList}
      </PanelBody>
    );
  }
}

export default ChatBoxBody;
