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
    return (
      <div onClick={this.handleClick} className="chatbox-minimized"><UserStatus status={this.props.status}/>Chat Paris 1<span style={spanStyle} className="glyphicon glyphicon-comment"></span></div>
    );
  }
}

export default ChatBoxMinimized;
