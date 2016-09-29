import React from 'react';
import Config from './../../config.js';

class Avatar extends React.Component {
  constructor(){
    super();
  }

  render() {
    let avatarUrl;
    if (this.props.penpal){
      avatarUrl = Config.avatar_base_url + "&penpal=" + this.props.penpal;
    }
    else {
      avatarUrl = Config.avatar_base_url + "&uid=" + this.props.uid;
    }
    if (this.props.modifyTimestamp){
      avatarUrl += "&v=" + this.props.modifyTimestamp;
    }
    let photoStyle = {"backgroundImage": "url(" + avatarUrl + ")"};
    return (
      <div style={photoStyle} className="avatar"></div>
    );
  }
}

export default Avatar;
