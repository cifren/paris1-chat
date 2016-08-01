import React from 'react';

class ChatBoxHeader extends React.Component {
  constructor(props){
    super(props);
  }
  handleClickDisconnect(){
    window.dispatchEvent(new Event("disconnect"));
  }
  handleClickMinimize(){
    window.dispatchEvent(new CustomEvent("min_max_box", {detail: {box: "chatbox"}}));
  }

  render() {
    let messageIcon = (this.props.notification > 0) ? <span className="badge">{this.props.notification}</span> : <span className="glyphicon glyphicon-comment"></span>;
    let styleOptionLi = {"float": "right"};
    let styleOptionA = {"marginRight": "0px"};
    return (
        <div>
          <ul className="nav nav-tabs" role="tablist">
            <li role="presentation" className="active">
              <a href="#home" aria-controls="home" role="tab" data-toggle="tab" title="Accueil"><span className="glyphicon glyphicon-home"></span></a>
            </li>
            <li role="presentation">
              <a href="#message" aria-controls="message" role="tab" data-toggle="tab" title="Mes messages">{messageIcon}</a>
            </li>
            <li style={styleOptionLi} role="presentation" className="dropdown">
              <a style={styleOptionA} href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="glyphicon glyphicon-option-horizontal"></span></a>
              <ul className="dropdown-menu dropdown-menu-right">
                <li><a role="tab" data-toggle="tab" aria-controls="options" href="#options">Options</a></li>
                <li><a onClick={this.handleClickMinimize} href="#">Minimiser</a></li>
                <li><a role="tab" data-toggle="tab" aria-controls="about" href="#about">A propos</a></li>
                <li role="separator" className="divider"></li>
                <li><a href="#" onClick={this.handleClickDisconnect}>Se déconnecter</a></li>
              </ul>
            </li>
          </ul>
        </div>
    );
  }
}

export default ChatBoxHeader;
