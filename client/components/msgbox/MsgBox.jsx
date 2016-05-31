import React from 'react';
import ReactDOM from 'react-dom';
import MsgBoxHeader from './MsgBoxHeader.jsx';
import MsgBoxBody from './MsgBoxBody.jsx';
import MsgBoxFooter from './MsgBoxFooter.jsx';

class MsgBox extends React.Component {
  constructor(props){
    super(props);
    this.state = {minified: this.props.room.minified};
  }
  render() {
    let msgBoxBody, msgBoxFooter;
    if (!this.state.minified){
      msgBoxBody = <MsgBoxBody user={this.props.user} room={this.props.room}/>;
      msgBoxFooter = <MsgBoxFooter room={this.props.room}/>;
    }
    let msgBoxPosition = {
      right: this.props.room.displayOrder * 300 + 'px'
    };
    return (
      <div id={this.props.room.room} style={msgBoxPosition} className="msg-window">
        <div className="col-xs-12 col-md-12">
          <div className="panel panel-default">
            <MsgBoxHeader room={this.props.room}/>
            {msgBoxBody}
            {msgBoxFooter}
          </div>
        </div>
      </div>
    );
  }
}

export default MsgBox;
