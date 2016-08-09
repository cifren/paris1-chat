import React from 'react';
import PanelBody from '../core/PanelBody.jsx';

class ChatBoxAbout extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div role="tabpanel" className={(this.props.currentTab === "about") ? "tab-pane fade active in" : "tab-pane fade"} id="about">
        <h5 className="title">
          Paris 1 Chat
        </h5>
        <p>2016 Université Paris 1 Panthéon-Sorbonne</p>
        <p>Si vous rencontrez un bug, merci de contacter la DSIUN ou d'envoyer un email à <a href="mailto:guillaume.fay@univ-paris1.fr">guillaume.fay@univ-paris1.fr</a></p>
        <p>Développeur : Guillaume Fay</p>
      </div>
    );
  }
}

export default ChatBoxAbout;
