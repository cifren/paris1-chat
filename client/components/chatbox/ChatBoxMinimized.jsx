import React from 'react';
import UserStatus from './../core/UserStatus.jsx';

class ChatBoxMinimized extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(){
    let evt = new CustomEvent('min_max_box', {detail: {box: "chatbox"}});
    window.dispatchEvent(evt);
  }
  render() {
    let spanStyle = {float: 'right'};
    let messageIcon = (this.props.notification.length > 0) ? <span style={spanStyle} className="badge">{this.props.notification.length}</span> : <span style={spanStyle} className="glyphicon glyphicon-comment"></span>;
    return (
      <div onClick={this.handleClick} className="chatbox-minimized"><UserStatus status={this.props.status}/>Tchat Paris 1{messageIcon}</div>
    );
  }
}

export default ChatBoxMinimized;
