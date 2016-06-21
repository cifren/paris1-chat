import React from 'react';
import PanelBody from '../core/PanelBody.jsx';

class ChatBoxAbout extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div role="tabpanel" className="tab-pane fade" id="about">
        <h5>Paris 1 Chat</h5>
        <p>Développeur : Guillaume Fay</p>
      </div>
    );
  }
}

export default ChatBoxAbout;
