import React from 'react';
import UserStatus from './UserStatus.jsx';

class RoomSelector extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e) {
    window.dispatchEvent(new CustomEvent('change_display_order', {detail: this.props.room.room}));
  }
  render() {
    return <li><a href="#" onClick={this.handleClick}><UserStatus status={this.props.room.penpal.status}/>{this.props.room.penpal.name}</a></li>
  }
}

export default RoomSelector;
