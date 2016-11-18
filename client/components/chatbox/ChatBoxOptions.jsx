import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import DropDownStatus from './options/DropDownStatus.jsx';
import DropDownSound from './options/DropDownSound.jsx';
import DropDownNotification from './options/DropDownNotification.jsx';
import DropDownVisibility from './options/DropDownVisibility.jsx'

class ChatBoxOptions extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let optionVisibility = (this.props.user.affiliationType === "staff") ? <h5>Visibilité : <DropDownVisibility directionsLabels={this.props.user.directionsLabels} listeRouge={this.props.user.listeRouge} visibility={this.props.preferences.visibility}/></h5> : null;
    return (
      <div role="tabpanel" className={(this.props.currentTab === "options") ? "tab-pane fade active in" : "tab-pane fade"} id="options">
        <h5 className="title">
          Options
        </h5>
        <h5>
          Mon statut : <DropDownStatus status={this.props.user.status}/>
        </h5>
        <h5>
          Notifications : <DropDownNotification notification={this.props.preferences.notification}/>
        </h5>
        {optionVisibility}
        <h5>
          Son : <DropDownSound sound={this.props.preferences.sound}/>
        </h5>
        <h5>
          <a href="https://ent-test.univ-paris1.fr/compte/stylesheets/accountDataChange.faces" target="_blank">Gérer la visibilité de ma photo.</a>
        </h5>
      </div>
    );
  }
}

export default ChatBoxOptions;
