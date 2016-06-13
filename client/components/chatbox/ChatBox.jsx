import React from 'react';
import ReactDOM from 'react-dom';
import ChatBoxHeader from './ChatBoxHeader.jsx';
import ChatBoxMinimized from './ChatBoxMinimized.jsx';
import ChatBoxBody from './ChatBoxBody.jsx';
import ChatBoxFooter from './ChatBoxFooter.jsx';

class ChatBox extends React.Component {
  constructor(props){
    super(props);
    this.state = this.props.state;
  }
  render() {
    let chatBox;
    if (!this.state.minimized){
      chatBox = <div className="col-xs-12 col-md-12">
                  <div className="panel panel-default">
                    <ChatBoxHeader minimized={this.state.minimized} status={this.props.user.status}/>
                    <ChatBoxBody user={this.props.user} directionList={this.props.directionList} favList={this.props.favList}
                    searchState={this.props.searchState} searchList={this.props.searchList}/>
                    <ChatBoxFooter />
                  </div>
                </div>;
    }
    else {
      chatBox = <ChatBoxMinimized status={this.props.user.status} />;
    }
    return (
      <div className="chat-window">
        {chatBox}
      </div>
    );
  }
}

export default ChatBox;
