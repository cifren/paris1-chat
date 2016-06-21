import React from 'react';
import DropDownStatus from '../core/DropDownStatus.jsx';
import UserStatus from '../core/UserStatus.jsx';
import PanelHeader from '../core/PanelHeader.jsx';
import PanelHeaderTitleContainer from '../core/PanelHeaderTitleContainer.jsx';
import PanelHeaderTitle from '../core/PanelHeaderTitle.jsx';
import PanelHeaderButtonContainer from '../core/PanelHeaderButtonContainer.jsx';
import ButtonMin from '../core/ButtonMin.jsx';
import ButtonDisconnect from '../core/ButtonDisconnect.jsx';
import ButtonOption from '../core/ButtonOption.jsx';
import OptionModal from '../core/OptionModal.jsx';
import ButtonTabMessage from './ButtonTabMessage.jsx';
import ButtonTabHome from './ButtonTabHome.jsx';


class ChatBoxHeader extends React.Component {
  constructor(props){
    super(props);
    this.handleClickDisconnect = this.handleClickDisconnect.bind(this);
    this.handleClickOptions = this.handleClickOptions.bind(this);
    this.handleClickMinimize = this.handleClickMinimize.bind(this);
    this.handleClickAbout = this.handleClickAbout.bind(this);
  }
  handleClickDisconnect(){
    window.dispatchEvent(new Event("disconnect"));
  }
  handleClickOptions(){

  }
  handleClickAbout(){

  }
  handleClickMinimize(){
    window.dispatchEvent(new CustomEvent("min_max_box", {detail: {box: "chatbox"}}));
  }

  render() {
    console.log(this.props.notification);
    let messageIcon = (this.props.notification > 0) ? <span className="badge">{this.props.notification}</span> : <span className="glyphicon glyphicon-comment"></span>;
    let styleMessageButton = {"marginRight": "120px"};
    let styleOptionButton = {"margin": "0px"};
    return (
        <div>
          <ul className="nav nav-tabs" role="tablist">
            <li role="presentation" className="active">
              <a href="#home" aria-controls="home" role="tab" data-toggle="tab"><span className="glyphicon glyphicon-home"></span></a>
            </li>
            <li role="presentation">
              <a style={styleMessageButton} href="#message" aria-controls="message" role="tab" data-toggle="tab">{messageIcon}</a>
            </li>
            <li role="presentation" className="dropdown">
              <a href="#" style={styleOptionButton} className="dropdown-toggle" data-toggle="dropdown"><span className="glyphicon glyphicon-option-horizontal"></span></a>
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
