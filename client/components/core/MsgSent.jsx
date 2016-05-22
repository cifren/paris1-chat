import React from 'react';
import Avatar from './Avatar.jsx'

class MsgSent extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    return (
      <div className="row msg_container base_sent">
          <div className="col-md-10 col-xs-10">
              <div className="messages msg_sent">
                  <p>{this.props.msg}</p>
              </div>
          </div>
          <Avatar url={this.props.avatar}/>
      </div>
    );
  }
}

export default MsgSent;
