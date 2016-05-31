import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import MsgReceived from '../core/MsgReceived.jsx';
import MsgSent from '../core/MsgSent.jsx';


class MsgBoxBody extends React.Component {
  constructor(props){
    super(props);
    this.isMessageHTML = this.isMessageHTML.bind(this);
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

  render() {
    let messages = this.props.room.messages.map((message) => {
      this.isMessageHTML(message);
      if (message.owner != this.props.user.uid){
        return <MsgReceived key={message._id} avatar={this.props.room.penpal.avatar} message={message}/>
      }
      else {
        return <MsgSent key={message._id} avatar={this.props.user.avatar} message={message}/>
      }
    });
    return (
      <PanelBody>
        {messages}
      </PanelBody>
    );
  }
}

export default MsgBoxBody;
