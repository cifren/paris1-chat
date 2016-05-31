import React from 'react';
import UserButton from './UserButton.jsx'

class ChatBoxBodySection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      onlineUsers: this.countOnlineUsers(props)
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({onlineUsers: this.countOnlineUsers(nextProps)});
  }

  countOnlineUsers(props){
    let newCount = 0;
    Object.keys(props.list).map((key) => {
      if (props.list[key].status === 'online' || props.list[key].status === 'busy')
        newCount++;
    });
    return newCount;
  }

  render() {
    let content;
    if (Object.keys(this.props.list).length > 0){
      content = Object.keys(this.props.list).map((user, i) => {
        return <UserButton user={this.props.list[user]} key={i}/>
      });
    }
    else {
      content = <p>{this.props.noUserMessage}</p>
    }
    return (
      <div className="chat_box_section">
        <div className="chat_box_section_title">
          <h5>{this.props.title} ({this.state.onlineUsers})</h5>
          {content}
        </div>
      </div>
    );
  }
}

export default ChatBoxBodySection;
