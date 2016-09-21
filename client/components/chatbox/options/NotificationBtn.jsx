import React from 'react';

class NotificationBtn extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    $('#notif-tooltip').tooltip();
  }

  handleClick(e) {
    window.dispatchEvent(new Event('update_notificationsHTML5'));
  }
  render() {
    let permission = (this.props.notificationsHTML5) ? "Activées" : "Désactivées";
    let button = <button className="btn btn-default dropdownButton" type="button" onClick={this.handleClick}>{permission}</button>;

    if (!window.Notification){
      let noSupport = "Votre navigateur ne supporte pas les notifications HTML5.";
      button = <button id="notif-tooltip" title={noSupport} className="btn btn-default dropdownButton" type="button">{permission}</button>;
    }
    else if (Notification.permission === "denied"){
      let browserDenies = "Votre navigateur bloque les notifications pour ce site, pour les réactiver il faut débloquer ce site dans les paramètres du navigateur.";
      button = <button id="notif-tooltip" title={browserDenies} className="btn btn-default dropdownButton" type="button">{permission}</button>;
    }
    return (button);
  }
}

export default NotificationBtn;
