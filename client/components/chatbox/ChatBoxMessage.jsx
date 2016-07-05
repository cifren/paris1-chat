import React from 'react';
import ChatBoxBodySection from './ChatBoxBodySection.jsx';

class ChatBoxMessage extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let searchList, roomList;
    if (this.props.searchState){
      searchList = <ChatBoxBodySection title="Recherche" list={this.props.searchList} noUserMessage="La recherche n'a retouné aucun résultat."/>
    }
    else {
      roomList = <ChatBoxBodySection title="Mes messages" list={this.props.roomList} noUserMessage="Vous n'avez aucun message."/>
    }
    return (
      <div role="tabpanel" className="tab-pane fade" id="message">
        {searchList}
        {roomList}
      </div>
    );
  }
}

export default ChatBoxMessage;
