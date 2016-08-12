import React from 'react';

class ChatBoxHeader extends React.Component {
  constructor(props){
    super(props);
  }
  stopEvtPropagation(e){
    e.stopPropagation();
  }
  handleClickDisconnect(e){
    e.stopPropagation();
    window.dispatchEvent(new Event("close_chat"));
  }
  handleClickMinimize(){
    window.dispatchEvent(new Event("min_max_box"));
  }

  render() {
    let messageIcon = (this.props.notification > 0) ? <span className="badge">{this.props.notification}</span> : <span className="glyphicon glyphicon-comment"></span>;
    let styleOptionLi = {"float": "right"};
    let styleOptionA = {"marginRight": "0px"};
    return (
        <div>
          <ul onClick={this.handleClickMinimize} className="nav nav-tabs chatbox-header" role="tablist">
            <li onClick={this.stopEvtPropagation} role="presentation" className={(this.props.currentTab === "home") ? "active" : null}>
              <a href="#home" aria-controls="home" role="tab" data-toggle="tab" title="Accueil"><span className="glyphicon glyphicon-home"></span></a>
            </li>
            <li onClick={this.stopEvtPropagation} role="presentation" className={(this.props.currentTab === "message") ? "active" : null}>
              <a href="#message" aria-controls="message" role="tab" data-toggle="tab" title="Mes messages">{messageIcon}</a>
            </li>
            <li onClick={this.stopEvtPropagation} style={styleOptionLi} role="presentation" className="dropdown" className={(this.props.currentTab === "about" || this.props.currentTab === "options") ? "active" : null}>
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
