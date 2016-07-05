import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import Message from './Message.jsx';


class MsgBoxBody extends React.Component {
  constructor(props){
    super(props);
  }

  isMessageHTML(message){
    if (typeof message.isHTML !== "undefined")
      return message;
    message.isHTML = false;
    if (message.text.match(/<a href=https:\/\/filex(-test)\.univ-paris1\.fr\/get\?k=[0-9A-za-z]+.*/)){
      message.text = {__html: this.props.room.messages[message].text};
      message.isHTML = true;
    }

    if (message.text.match(/https?:\/\/.*/gi)){
      message.text = {__html: "<a target='_blank' href='" + message.text + "'>" + message.text + '</a>'};
      message.isHTML = true;
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
    let msgCounter = 0;
    let messages = this.props.room.messages.map((message) => {
      msgCounter += 1;
      this.isMessageHTML(message);
      if (msgCounter === this.props.room.messages.length){
        return <Message lastMessage={true} penpalTyping={this.props.room.penpalTyping} penpalName={this.props.room.penpal.name} owned={this.isOwned(message)} key={message._id} avatar={this.getAvatar(message)} message={message}/>;
      }
      return <Message owned={this.isOwned(message)} key={message._id} avatar={this.getAvatar(message)} message={message}/>;
    });
    return (
      <PanelBody>
        {messages}
      </PanelBody>
    );
  }
}

export default MsgBoxBody;
