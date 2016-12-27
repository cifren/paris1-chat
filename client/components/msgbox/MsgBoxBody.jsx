import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import Message from './Message.jsx';


class MsgBoxBody extends React.Component {
  constructor(props){
    super(props);
  }

  isOwned(message){
    let isOwned = (String(message.owner) === String(this.props.user.uid)) ? true : false;
    return isOwned;
  }
/* TODO - Refac
  getUid(message){
    return this.props.room.penpal.user.split("@")[0];
  }
*/
  render() {
    let msgTab = [];
    let messages = this.props.room.messages.map((message, i) => {
      let isLastMessage = (i === this.props.room.messages.length - 1) ? true : false;
      if (!message.isLink && !isLastMessage){
        let curMessageTime = new Date(message.posted);
        let curMessageOwner = message.owner;
        let nextMessageTime = new Date(this.props.room.messages[i+1].posted);
        let nextMessageOwner = this.props.room.messages[i+1].owner;
        let deltaTime = nextMessageTime - curMessageTime;
        let nextMessageIsLink = this.props.room.messages[i+1].isLink;
        if (deltaTime < 60000 && curMessageOwner === nextMessageOwner && !nextMessageIsLink){
          msgTab.push(message.text);
          return;
        }
      }
      msgTab.push(message.text);
      let tabText = msgTab;
      msgTab = [];

      if (isLastMessage){
        {/*TODO - Refac :  avatar={this.getUid(message)} */}
        return <Message lastMessage={true} penpalTyping={this.props.room.penpalTyping} penpalName={this.props.room.penpal.name} owned={this.isOwned(message)} key={message._id} modifyTimestamp={this.props.room.penpal.modifyTimestamp} message={message} tabText={tabText}/>;
      }
      {/*TODO - Refac : avatar={this.getUid(message)} */}
      return <Message owned={this.isOwned(message)} key={message._id} modifyTimestamp={this.props.room.penpal.modifyTimestamp} message={message} tabText={tabText}/>;
    });
    return (
      <PanelBody>
        {messages}
      </PanelBody>
    );
  }
}

export default MsgBoxBody;
