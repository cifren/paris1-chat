import React from 'react';

class UserStatus extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    let userStatus;
    switch(this.props.status){
      case 'online':
        userStatus = <div className="status_icone dot_online"></div>;
        break;
      case 'busy':
        userStatus = <div className="status_icone dot_busy"></div>;
        break;
      default:
        userStatus = <div className="status_icone dot_offline"></div>;
    };
    return userStatus;
  }
}

export default UserStatus;
