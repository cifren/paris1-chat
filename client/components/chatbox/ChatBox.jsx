import React from 'react';
import ReactDOM from 'react-dom';
import ChatBoxHeader from './ChatBoxHeader.jsx';
import ChatBoxMinimized from './ChatBoxMinimized.jsx';
import ChatBoxHome from './ChatBoxHome.jsx';
import ChatBoxMessage from './ChatBoxMessage.jsx';
import ChatBoxOptions from './ChatBoxOptions.jsx';
import ChaBoxAbout from './ChatBoxAbout.jsx';
import SearchInput from './SearchInput.jsx';

class ChatBox extends React.Component {
  constructor(props){
    super(props);
    this.state = this.props.state;
    this.countNotifications = this.countNotifications.bind(this);
  }
  countNotifications(){
    let users = [];
    Object.keys(this.props.roomList).map((room) => {
      if (!this.props.roomList[room].lastMessage.viewed && this.props.user.uid !== this.props.roomList[room].lastMessage.owner){
        users.push(this.props.roomList[room].penpal.name);
      }
    });
    return users;
  }

  render() {
    let chatBox;
    let searchInput;
    if (this.state.currentTab === "home" || this.state.currentTab === "message"){
      searchInput = <SearchInput />;
    }
    if (!this.state.minimized){
      chatBox = <div className="col-xs-12 col-md-12">
                  <div className="panel panel-default">
                    <ChatBoxHeader notification={this.countNotifications().length} minimized={this.state.minimized} status={this.props.user.status}/>
                    <div className="tab-content">
                      <ChatBoxHome user={this.props.user} directionList={this.props.directionList} favList={this.props.favList}
                      searchState={this.props.searchState} searchList={this.props.searchList}/>
                      <ChatBoxMessage searchState={this.props.searchState} searchList={this.props.searchList} roomList={this.props.roomList}/>
                      <ChatBoxOptions user={this.props.user} preferences={this.props.preferences}/>
                      <ChaBoxAbout />
                    </div>
                    {searchInput}
                  </div>
                </div>;
    }
    else {
      chatBox = <ChatBoxMinimized status={this.props.user.status} notification={this.countNotifications()} />;
    }
    return (
      <div className="chat-window">
        {chatBox}
      </div>
    );
  }
}

export default ChatBox;
