import React from 'react';
import Avatar from './Avatar.jsx'

class MsgSent extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    let message;
    if (this.props.message.isHTML){
      message = <div className="messages msg_sent" dangerouslySetInnerHTML={this.props.message.text}></div>;
    }
    else {
      message = <div className="messages msg_sent">{this.props.message.text}</div>;
    }
    return (
      <div className="row msg_container base_sent">
          <div className="col-md-10 col-xs-10">
            {message}
          </div>
          <Avatar url={this.props.avatar}/>
      </div>
    );
  }
}

export default MsgSent;
