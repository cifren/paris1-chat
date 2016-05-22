import React from 'react';
import UserStatus from '../core/UserStatus.jsx';
import Avatar from '../core/Avatar.jsx';

class UserButton extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(){
    window.dispatchEvent(new CustomEvent('user_button', {detail: this.props.user}));
  }
  render() {
    return (
      <a onClick={this.handleClick} href="#">
        <div className="user_container">
          <Avatar url={this.props.user.avatar}/>
          <div className="user_name">
            <p>{this.props.user.name}</p>
          </div>
          <div className="chatbox_user_status">
            <UserStatus status={this.props.user.status}/>
          </div>
        </div>
      </a>
    );
  }
}

export default UserButton;
