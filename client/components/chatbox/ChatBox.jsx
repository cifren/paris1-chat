import React from 'react';
import ReactDOM from 'react-dom';
import ChatBoxHeader from './ChatBoxHeader.jsx';
import ChatBoxMinimized from './ChatBoxMinimized.jsx';
import ChatBoxHome from './ChatBoxHome.jsx';
import ChatBoxFooter from './ChatBoxFooter.jsx';
import ChatBoxMessage from './ChatBoxMessage.jsx';
import ChatBoxOptions from './ChatBoxOptions.jsx';
import ChaBoxAbout from './ChatBoxAbout.jsx';

class ChatBox extends React.Component {
  constructor(props){
    super(props);
    this.state = this.props.state;
    this.countNotifications = this.countNotifications.bind(this);
  }
  countNotifications(){
    let count = 0;
    Object.keys(this.props.roomList).map((room) => {
      if (!this.props.roomList[room].lastMessage.viewed && this.props.user.uid !== this.props.roomList[room].lastMessage.owner){
        count+=1;
      }
    });
    return count;
  }
  render() {
    console.log(this.countNotifications());
    let chatBox;
    if (!this.state.minimized){
      chatBox = <div className="col-xs-12 col-md-12">
                  <div className="panel panel-default">
                    <ChatBoxHeader notification={this.countNotifications()} minimized={this.state.minimized} status={this.props.user.status}/>
                    <div className="tab-content">
                      <ChatBoxHome user={this.props.user} directionList={this.props.directionList} favList={this.props.favList}
                      searchState={this.props.searchState} searchList={this.props.searchList}/>
                      <ChatBoxMessage roomList={this.props.roomList}/>
                      <ChatBoxOptions />
                      <ChaBoxAbout />
                    </div>
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
