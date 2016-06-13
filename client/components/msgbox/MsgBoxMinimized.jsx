import React from 'react';
import UserStatus from './../core/UserStatus.jsx';

class MsgBoxMinimized extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(){
    let evt = new CustomEvent('min_max_box', {detail: {box: this.props.room.room}});
    window.dispatchEvent(evt);
  }
  render() {
    return (
      <div onClick={this.handleClick} className="msgbox-minimized"><UserStatus status={this.props.room.penpal.status}/>{this.props.room.penpal.name}</div>
    );
  }
}

export default MsgBoxMinimized;
