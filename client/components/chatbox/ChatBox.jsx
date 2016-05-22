import React from 'react';
import ReactDOM from 'react-dom';
import ChatBoxHeader from './ChatBoxHeader.jsx';
import ChatBoxBody from './ChatBoxBody.jsx';
import ChatBoxFooter from './ChatBoxFooter.jsx';

class ChatBox extends React.Component {
  constructor(props){
    super(props);
    this.state = {minimised: false};
  }
  componentDidMount() {
    window.addEventListener('button_min', function(){
      (this.state.minimised) ? this.setState({minimised: false}) : this.setState({minimised: true});
    }.bind(this));
  }
  render() {
    let chatBoxBody, chatBoxFooter;
    if (!this.state.minimised){
      chatBoxBody = <ChatBoxBody user={this.props.user} directionList={this.props.directionList} favList={this.props.favList}
                    searchState={this.props.searchState} searchList={this.props.searchList}/>;
      chatBoxFooter = <ChatBoxFooter />;
    }
    return (
      <div className="chat-window">
        <div className="col-xs-12 col-md-12">
          <div className="panel panel-default">
            <ChatBoxHeader status={this.props.user.status}/>
            {chatBoxBody}
            {chatBoxFooter}
          </div>
        </div>
      </div>
    );
  }
}

export default ChatBox;
