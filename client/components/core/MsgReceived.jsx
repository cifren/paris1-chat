import React from 'react';
import Avatar from './Avatar.jsx'

class MsgReceived extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    let message;
    if (this.props.message.isHTML){
      message = <div className="messages msg_receive" dangerouslySetInnerHTML={this.props.message.text}></div>;
    }
    else {
      message = <div className="messages msg_receive">{this.props.message.text}</div>;
    }
    return (
      <div className="row msg_container base_receive">
        <Avatar url={this.props.avatar}/>
          <div className="col-md-10 col-xs-10">
            {message}
          </div>
      </div>
    );
  }
}

export default MsgReceived;
