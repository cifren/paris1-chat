import React from 'react';
import RoomButton from './RoomButton.jsx';

class ChatBoxMessage extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let content;
    let tabRooms = Object.keys(this.props.roomList);
    if (tabRooms.length === 0){
      content = <p>Vous navez aucun message.</p>;
    }
    else {
      tabRooms.sort(function(a,b){
        let dateA = new Date(this.props.roomList[a].lastMessage.posted);
        let dateB = new Date(this.props.roomList[b].lastMessage.posted);
        return dateB-dateA;
      }.bind(this));
      content = tabRooms.map((roomId) => {
        return <RoomButton key={roomId} penpal={this.props.roomList[roomId].penpal} message={this.props.roomList[roomId].lastMessage} />
      });
    }

    return (
      <div role="tabpanel" className="tab-pane fade" id="message">
        <h5>Messages</h5>
        {content}
      </div>
    );
  }
}

export default ChatBoxMessage;
