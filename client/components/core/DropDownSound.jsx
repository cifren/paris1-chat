import React from 'react';
import UserStatus from './UserStatus.jsx';

class DropDownSound extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e) {
    let selectedOption = e.target.className;
    window.dispatchEvent(new CustomEvent('manage_sound', {detail: selectedOption}));
  }
  render() {
    let activePrefIcone = (this.props.sound) ? <span className="glyphicon glyphicon-volume-up"></span> : <span className="glyphicon glyphicon-volume-off"></span>;
    let activePrefText = (this.props.sound) ? "Activé" : "Désactive";
    return (
      <div className="dropdown">
        <button className="btn btn-default dropdown-toggle dropdownButton" type="button" id="dropDownSound" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          {activePrefIcone} {activePrefText} <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropDownSound">
          <li><a href="#" onClick={this.handleClick} className="sound-enabled"><span className="glyphicon glyphicon-volume-up"></span> Activé</a></li>
          <li><a href="#" onClick={this.handleClick} className="sound-disabled"><span className="glyphicon glyphicon-volume-off"></span> Désactivé</a></li>
        </ul>
      </div>
    );
  }
}

export default DropDownSound;
