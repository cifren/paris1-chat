import React from 'react';
import UserStatus from './../core/UserStatus.jsx';

class ChatBoxMinimized extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    $('[data-toggle="tooltip"]').tooltip({html: true});
  }

  handleClick(){
    let evt = new CustomEvent('min_max_box', {detail: {box: "chatbox"}});
    window.dispatchEvent(evt);
  }
  render() {
    let spanStyle = {float: 'right'};
    let badgeTitle = "";
    if (this.props.notification){
      this.props.notification.map((user) => {
        if (badgeTitle !== ""){
          badgeTitle += "<br/>";
        }
        badgeTitle += user;
      });
    }
    console.log(badgeTitle);
    let messageIcon = (this.props.notification.length > 0) ? <span data-toggle="tooltip" title={badgeTitle} style={spanStyle} className="badge">{this.props.notification.length}</span> : <span style={spanStyle} className="glyphicon glyphicon-comment"></span>;
    return (
      <div onClick={this.handleClick} className="chatbox-minimized"><UserStatus status={this.props.status}/>Chat Paris 1{messageIcon}</div>
    );
  }
}

export default ChatBoxMinimized;
