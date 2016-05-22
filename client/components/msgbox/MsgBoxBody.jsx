import React from 'react';
import PanelBody from '../core/PanelBody.jsx';
import MsgReceived from '../core/MsgReceived.jsx';
import MsgSent from '../core/MsgSent.jsx';


class MsgBoxBody extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    let messages = Object.keys(this.props.room.messages).map((msg) => {
      if (this.props.room.user.uid != this.props.user.uid){
        return <MsgReceived avatar={this.props.room.user.avatar} message={msg}/>
      }
      else {
        return <MsgSent avatar={this.props.user.avatar} message={msg}/>
      }
    });
    return (
      <PanelBody>
        {messages}
      </PanelBody>
    );
  }
}

export default MsgBoxBody;
