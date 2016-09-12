import React from 'react';
import ReactDOM from 'react-dom';
import MsgBoxHeader from './MsgBoxHeader.jsx';
import MsgBoxBody from './MsgBoxBody.jsx';
import MsgBoxFooter from './MsgBoxFooter.jsx';
import MsgBoxMinimized from './MsgBoxMinimized.jsx';

class MsgBox extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    let msgBox;
    if (!this.props.room.minimized){
      msgBox =  <div className="panel panel-default">
                  <MsgBoxHeader room={this.props.room}/>
                  <MsgBoxBody user={this.props.user} room={this.props.room}/>
                  <MsgBoxFooter room={this.props.room}/>
                </div>;
    }
    else {
      msgBox =  <MsgBoxMinimized room={this.props.room}/>;
    }
    return (
      <div id="msgBox" className="window msg-window animated slideInRight col-xs-12 col-md-12">
        {msgBox}
      </div>
    );
  }
}

export default MsgBox;
