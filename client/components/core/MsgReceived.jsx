import React from 'react';
import Avatar from './Avatar.jsx'

class MsgReceived extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    return (
      <div className="row msg_container base_receive">
        <Avatar url={this.props.avatar}/>
          <div className="col-md-10 col-xs-10">
              <div className="messages msg_receive">
                  <p>{this.props.msg}</p>
              </div>
          </div>
      </div>
    );
  }
}

export default MsgReceived;
