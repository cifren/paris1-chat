import React from 'react';

class ButtonClose extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e){
    e.stopPropagation();
    var evt = new CustomEvent('close_room', {detail: {room: this.props.room.room}});
    window.dispatchEvent(evt);
  }
  render() {
    return (
      <a onClick={this.handleClick} href="#"><span data-toggle="tooltip" data-placement="top" title="Close" className="chat_button glyphicon glyphicon-remove icon_close" data-id="chat_window_1"></span></a>
    );
  }
}

export default ButtonClose;
