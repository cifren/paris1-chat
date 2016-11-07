import React from 'react';
import PanelBody from '../core/PanelBody.jsx';

class ChatBoxAbout extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let styleJustified = {textAlign: "justify"};
    let styleCentered = {textAlign: "center"};
    return (
      <div role="tabpanel" className={(this.props.currentTab === "about") ? "tab-pane fade active in" : "tab-pane fade"} id="about">
        <h5 className="title">
          Tchat Paris 1
        </h5>
        <p>Développeur : Guillaume Fay</p>
        <p>Plus d'informations : <a target="_blank"href="https://github.com/UnivParis1/paris1-chat">Dépôt GitHub</a></p>
        <p style={styleJustified}>Si vous rencontrez un bug, merci de contacter la DSIUN ou d'envoyer un email à <a href="mailto:assistance-dsiun@univ-paris1.fr">assistance-dsiun@univ-paris1.fr</a></p>
        <p style={styleCentered}>2016 Université Paris 1 Panthéon-Sorbonne</p>
      </div>
    );
  }
}

export default ChatBoxAbout;
