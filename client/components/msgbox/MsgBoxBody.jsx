import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import Message from './Message.jsx';


class MsgBoxBody extends React.Component {
  constructor(props){
    super(props);
  }

  isMessageHTML(message){
    if (message.text.match(/https?:\/\/.*/gi)){
      message.html = {__html: "<a target='_blank' href='" + message.text + "'>" + message.text + '</a>'};
    }
    else {
      message.html = "";
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
    for (let i in this.props.room.messages){
      if (typeof this.props.room.messages[i].html === "undefined"){
        this.isMessageHTML(this.props.room.messages[i]);
      }
    }
    let msgTab = [];
    let messages = this.props.room.messages.map((message, i) => {
      let isLastMessage = (i === this.props.room.messages.length - 1) ? true : false;
      if (!message.html && !isLastMessage){
        let curMessageTime = new Date(message.posted);
        let curMessageOwner = message.owner;
        let nextMessageTime = new Date(this.props.room.messages[i+1].posted);
        let nextMessageOwner = this.props.room.messages[i+1].owner;
        let deltaTime = nextMessageTime - curMessageTime;
        let nextMessageHTML = this.props.room.messages[i+1].html;
        if (deltaTime < 60000 && curMessageOwner === nextMessageOwner && typeof nextMessageHTML !== "object"){
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
