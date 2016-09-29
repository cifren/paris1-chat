import React from 'react';
import UserStatus from '../core/UserStatus.jsx';
import Avatar from '../core/Avatar.jsx';

class UserButton extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleFavClick = this.handleFavClick.bind(this);
  }
  handleClick(){
    window.dispatchEvent(new CustomEvent('user_button', {detail: this.props.user}));
  }
  handleFavClick(event){
    event.preventDefault();
    let target = event.target;
    let mousePosX = event.clientX;
    let mousePosY = event.clientY;
    window.dispatchEvent(new CustomEvent('fav_click', {detail: {
      user: this.props.user,
      target: target,
      mousePosX: mousePosX,
      mousePosY: mousePosY}
    }));
  }
  addZeros(num){
    if (String(num).length === 1) return "0" + num;
    return num;
  }
  readableDate(){
    let msgDate = new Date(this.props.lastMessage.posted);
    let months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    if (Date.now() - Date.parse(this.props.lastMessage.posted) < 86400000){
      return msgDate.getHours() + "h" + this.addZeros(msgDate.getMinutes());
    }
    else if (Date.now() - Date.parse(this.props.lastMessage.posted) < 31536000000){
      return msgDate.getDate() + " " + months[msgDate.getMonth()];
    }
    else {
      return msgDate.getDate() + " " + months[msgDate.getMonth()] + " " + msgDate.getFullYear();
    }
    let month = msgDate.getMonth() + 1;
  }
  render() {
    let lastMessage;
    let userUid = this.props.user.user.split("@")[0];
    if (this.props.lastMessage){
      let lastMessageContent = this.props.lastMessage.text;
      if (this.props.lastMessage.isLink){
        lastMessageContent = lastMessageContent.substring(lastMessageContent.indexOf(">") + 1, lastMessageContent.lastIndexOf("<"));
      }
      if (this.props.lastMessage.owner === this.props.user.uid){
        lastMessage = (this.props.lastMessage.viewed) ? <div className="last-message"><em>{this.readableDate()}</em><i>{lastMessageContent}</i></div> : <div className="last-message"><em>{this.readableDate()}</em><b>{this.props.lastMessage.text}</b></div>;
      }
      else {
        lastMessage = <div className="last-message"><em><span className="glyphicon glyphicon-share-alt"></span> {this.readableDate()}</em><i> {lastMessageContent}</i></div>
      }
    }
    return (
      <a onContextMenu={this.handleFavClick} onClick={this.handleClick} href="#">
        <div className="hover-container">
          <div className="button-container">
            <Avatar uid={userUid} modifyTimestamp={this.props.user.modifyTimestamp}/>
            <div className="user-container">
              <div className="user-name">
                {this.props.user.name}
              </div>
              <div className="chatbox_user_status">
                <UserStatus status={this.props.user.status}/>
              </div>
            </div>
          </div>
          {lastMessage}
        </div>
      </a>
    );
  }
}

export default UserButton;
