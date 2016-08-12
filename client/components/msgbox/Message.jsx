import React from 'react';
import Avatar from '../core/Avatar.jsx'

class Message extends React.Component {
  constructor(props){
    super(props);
    this.readableDate = this.readableDate.bind(this);
  }
  addZeros(num){
    if (String(num).length === 1) return "0" + num;
    return num;
  }
  readableDate(){
    let msgDate = new Date(this.props.message.posted);
    let months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    if (Date.now() - Date.parse(this.props.message.posted) < 86400000){
      return msgDate.getHours() + "h" + this.addZeros(msgDate.getMinutes());
    }
    else if (Date.now() - Date.parse(this.props.message.posted) < 31536000000){
      return msgDate.getDate() + " " + months[msgDate.getMonth()];
    }
    else {
      return msgDate.getDate() + " " + months[msgDate.getMonth()] + " " + msgDate.getFullYear();
    }
    let month = msgDate.getMonth() + 1;
  }

  render() {
    let message_content, message;
    let messageText = this.props.tabText.map((line, i) => {
      if (i === this.props.tabText.length - 1){
        return <div key={i}>{line}</div>;
      }
      return <div key={i}>{line}<br/></div>;
    });
    if (this.props.message.isLink){
      let htmlObj = {__html: this.props.message.text};
      message_content = <div className="messages" dangerouslySetInnerHTML={htmlObj}></div>;
    }
    else {
      message_content = <div className="messages">{messageText}</div>;
    }
    let stylePenpalMessage = {"textAlign": "right"};
    if (!this.props.owned){
      message =   <div>
                    <div className="avatar-container col-md-2 col-xs-2">
                      <Avatar uid={this.props.avatar}/>
                    </div>
                    <div className="col-md-10 col-xs-10">
                      {message_content}
                    </div>
                  </div>;
    }
    else {
      message =   <div>
                    <div className="col-md-10 col-xs-10" style={stylePenpalMessage}>
                      {message_content}
                    </div>
                    <div className="avatar-container col-md-2 col-xs-2">
                      <Avatar penpal={this.props.avatar}/>
                    </div>
                  </div>;

    }
    let styleLastMessage = {"borderBottom": "0px"};
    let styleViewed = {"float": "right"};
    let styleDate = {"float": "left"};
    let styleDiv = {"padding": "0px"};
    let penpalFeedBack;
    if (this.props.lastMessage){
      if (this.props.penpalTyping){
        let penpalTyping = this.props.penpalName.split(" ")[0] + " écrit un message...";
        penpalFeedBack = <em style={styleViewed}>{penpalTyping}</em>;
      }
      else if (this.props.message.viewed && this.props.owned){
        penpalFeedBack = <em style={styleViewed}>Vu</em>;
      }
    }
    return (
      <div className="row msg_container" style={(this.props.lastMessage) ? styleLastMessage : null}>
        {message}
        <div style={styleDiv} className="col-md-12 col-xs-12">
          <em style={styleDate}>{this.readableDate()}</em>
          {penpalFeedBack}
        </div>
      </div>
    );
  }
}

export default Message;
