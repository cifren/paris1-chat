import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import DropDownStatus from './options/DropDownStatus.jsx';
import DropDownSound from './options/DropDownSound.jsx';
import NotificationBtn from './options/NotificationBtn.jsx';

class ChatBoxOptions extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div role="tabpanel" className={(this.props.currentTab === "options") ? "tab-pane fade active in" : "tab-pane fade"} id="options">
        <h5 className="title">
          Options
        </h5>
        <h5>
          Mon statut : <DropDownStatus status={this.props.user.status}/>
        </h5>
        <h5>
          Notifications HTML5 : <NotificationBtn notificationsHTML5={this.props.preferences.notificationsHTML5}/>
        </h5>
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
