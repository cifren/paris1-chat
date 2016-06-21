import React from 'react';
import UserStatus from '../core/UserStatus.jsx';
import Avatar from '../core/Avatar.jsx';

class RoomButton extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(){
    window.dispatchEvent(new CustomEvent('user_button', {detail: this.props.penpal}));
  }
  render() {
    let lastMessage;
    if (this.props.message.owner === this.props.penpal.uid){
      lastMessage = <p>{this.props.message.text}</p>;
    }
    else {
      lastMessage = <p><span className="glyphicon glyphicon-share-alt"></span> {this.props.message.text}</p>
    }
    return (
      <a onClick={this.handleClick} href="#">
        <div className="user_container">
          <Avatar url={this.props.penpal.avatar}/>
          <div className="user_name">
            <p>{this.props.penpal.name}</p>
            {lastMessage}
          </div>
          <div className="chatbox_user_status">
            <UserStatus status={this.props.penpal.status}/>
          </div>
        </div>
      </a>
    );
  }
}

export default RoomButton;
