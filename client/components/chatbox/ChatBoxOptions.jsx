import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import DropDownStatus from '../core/DropDownStatus.jsx'

class ChatBoxOptions extends React.Component {
  constructor(props){
    super(props);
  }

  handleChangeStatus(){

  }

  render() {
    return (
      <div role="tabpanel" className="tab-pane fade" id="options">
        <h5 className="title">
          Options
        </h5>
        <h5>
          Mon statut : <DropDownStatus />
        </h5>
        <h5>
          Son : <DropDownStatus />
        </h5>
        <h5>
          <a href="#" target="_blank">Gérer la visibilité de ma photo.</a>
        </h5>
      </div>
    );
  }
}

export default ChatBoxOptions;
