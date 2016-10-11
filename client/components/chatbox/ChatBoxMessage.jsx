import React from 'react';
import ChatBoxBodySection from './ChatBoxBodySection.jsx';

class ChatBoxMessage extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let content;
    if (this.props.user.status === 'offline'){
      content = <div><p>Vous êtes déconnecté du serveur de messagerie instantanée.</p><p>Vous pouvez rafraichir la page pour vous reconnecter.</p></div>;
    }
    else {
      if (this.props.searchState){
        content = <ChatBoxBodySection searchState={true} title="Recherche" list={this.props.searchList} noUserMessage="La recherche n'a retouné aucun résultat."/>
      }
      else {
        content = <ChatBoxBodySection title="Mes messages" list={this.props.roomList} noUserMessage="Vous n'avez aucun message."/>
      }
    }
    return (
      <div role="tabpanel" className={(this.props.currentTab === "message") ? "tab-pane fade active in" : "tab-pane fade"} id="message">
        {content}
      </div>
    );
  }
}

export default ChatBoxMessage;
