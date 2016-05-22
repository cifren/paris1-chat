import React from 'react';
import ReactDOM from 'react-dom';
import MsgBoxHeader from './MsgBoxHeader.jsx';
import MsgBoxBody from './MsgBoxBody.jsx';
import MsgBoxFooter from './MsgBoxFooter.jsx';

class MsgBox extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    return (
      <div className="msg-window">
        <div className="col-xs-12 col-md-12">
          <div className="panel panel-default">
            <MsgBoxHeader room={this.props.room}/>
            <MsgBoxBody user={this.props.user} room={this.props.room}/>
            <MsgBoxFooter />
          </div>
        </div>
      </div>
    );
  }
}

export default MsgBox;
