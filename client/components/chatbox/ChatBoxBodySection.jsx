import React from 'react';
import UserButton from './UserButton.jsx'

class ChatBoxBodySection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      onlineUsers: this.countOnlineUsers(props)
    };
    this.sortByDate = this.sortByDate.bind(this);
    this.sortAlphabetically = this.sortAlphabetically.bind(this);
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

  sortByDate(a, b){
    let dateA = new Date(this.props.list[a].lastMessage.posted);
    let dateB = new Date(this.props.list[b].lastMessage.posted);
    return dateB - dateA;
  }

  sortAlphabetically(a, b){
    if (this.props.list[a].name < this.props.list[b].name){
      return -1;
    }
    else if (this.props.list[a].name > this.props.list[b].name){
      return 1;
    }
    else {
      return 0;
    }
  }

  render() {
    let tabContent = Object.keys(this.props.list);
    let content, title;
    if (this.props.title === "Mes messages"){
      tabContent.sort(this.sortByDate);
      title = <h5 className="title">{this.props.title}</h5>;
    }
    else {
      tabContent.sort(this.sortAlphabetically);
      title = <h5 className="title">{this.props.title} ({this.state.onlineUsers})</h5>;
    }
    let countInvisibleUsers = 0;
    if (tabContent.length > 0){
      content = tabContent.map((key, i) => {
        if (this.props.noDisplayInvisible && this.props.list[key].status === "invisible"){
          countInvisibleUsers += 1;
          return;
        }
        if (this.props.list[key].lastMessage){
          return <UserButton user={this.props.list[key].penpal} lastMessage={this.props.list[key].lastMessage} key={i}/>
        }
        return <UserButton user={this.props.list[key]} key={i}/>;
      });
    }
    else {
      content = <p>{this.props.noUserMessage}</p>
    }
    if (countInvisibleUsers === tabContent.length){
      content = <p>{this.props.noUserMessage}</p>
    }
    return (
      <div className="chat_box_section">
        <div className="chat_box_section_title">
          {title}
          {content}
        </div>
      </div>
    );
  }
}

export default ChatBoxBodySection;
