import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import Message from './Message.jsx';


class MsgBoxBody extends React.Component {
  constructor(props){
    super(props);
  }

  isMessageHTML(message){
    if (typeof message.html !== "undefined"){
      return message;
    }

    if (message.text.match(/https?:\/\/.*/gi)){
      message.html = {__html: "<a target='_blank' href='" + message.text + "'>" + message.text + '</a>'};
    }
  }

  isOwned(message){
    let isOwned = (String(message.owner) === String(this.props.user.uid)) ? true : false;
    return isOwned;
  }

  getAvatar(message){
    return (String(message.owner) === String(this.props.user.uid)) ? this.props.user.avatar : this.props.room.penpal.avatar;
  }

  render() {
    let msgTab = [];
    let messages = this.props.room.messages.map((message, i) => {

      this.isMessageHTML(message);
      let isLastMessage = (i === this.props.room.messages.length - 1) ? true : false;
      if (!message.isHTML && !isLastMessage){
        let curMessageTime = new Date(message.posted);
        let curMessageOwner = message.owner;
        let nextMessageTime = new Date(this.props.room.messages[i+1].posted);
        let nextMessageOwner = this.props.room.messages[i+1].owner;
        let deltaTime = nextMessageTime - curMessageTime;
        if (deltaTime < 60000 && curMessageOwner === nextMessageOwner){
          msgTab.push(message.text);
          return;
        }
      }
      msgTab.push(message.text);
      let tabText = msgTab;
      msgTab = [];

      if (isLastMessage){
        return <Message lastMessage={true} penpalTyping={this.props.room.penpalTyping} penpalName={this.props.room.penpal.name} owned={this.isOwned(message)} key={message._id} avatar={this.getAvatar(message)} message={message} tabText={tabText}/>;
      }
      return <Message owned={this.isOwned(message)} key={message._id} avatar={this.getAvatar(message)} message={message} tabText={tabText}/>;
    });
    return (
      <PanelBody>
        {messages}
      </PanelBody>
    );
  }
}

export default MsgBoxBody;
