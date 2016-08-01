import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import DropDownStatus from '../core/DropDownStatus.jsx'
import DropDownSound from '../core/DropDownSound.jsx'

class ChatBoxOptions extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div role="tabpanel" className="tab-pane fade" id="options">
        <h5 className="title">
          Options
        </h5>
        <h5>
          Mon statut : <DropDownStatus status={this.props.user.status}/>
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
