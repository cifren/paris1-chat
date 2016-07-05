import React from 'react';

class ButtonBack extends React.Component {
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
      <a onClick={this.handleClick} href="#"><span data-toggle="tooltip" data-placement="top" title="Retour au menu" className="chat_button glyphicon glyphicon-chevron-left"></span></a>
    );
  }
}

export default ButtonBack;
