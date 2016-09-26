import React from 'react';

class DropDownNotification extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    $('#dropDownNotification').tooltip();
  }

  handleClick(e) {
    let selectedNotification = e.target.className;
    window.dispatchEvent(new CustomEvent('change_notification', {detail: selectedNotification}));
  }

  render() {
    let item;
    if (!window.Notification){
      let title = "Votre navigateur ne supporte pas les notifications HTML 5."
      item = <button className="btn btn-default dropdown-toggle dropdownButton" type="button" disabled="disabled" id="dropDownNotification" title={title}>
        Désactivées
      </button>;
    }
    else if (Notification.permission !== "granted"){
      let title = "Votre navigateur bloque les notifications, pour les activer il faut vous rendre dans les paramètres de ce dernier."
      item = <button className="btn btn-default dropdown-toggle dropdownButton" type="button" id="dropDownNotification" title={title}>
        Désactivées
      </button>;
    }
    else {
      let label;
      switch(this.props.notification){
        case "all":
          label = "Toutes";
        break;
        case "connection":
          label = "Connexions";
        break;
        case "message":
          label = "Messages";
        break;
        default:
          label = "Désactivées";
      }
      item = <div className="dropdown">
        <button className="btn btn-default dropdown-toggle dropdownButton" type="button" id="dropDownNotification" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          {label} <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropDownNotification">
          <li><a href="#" onClick={this.handleClick} className="all">Toutes</a></li>
          <li><a href="#" onClick={this.handleClick} className="message">Messages</a></li>
          <li><a href="#" onClick={this.handleClick} className="connection">Connexions</a></li>
          <li><a href="#" onClick={this.handleClick} className="denied">Désactivées</a></li>
        </ul>
      </div>;
    }
    return (item);
  }
}

export default DropDownNotification;
