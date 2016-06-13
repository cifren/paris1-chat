import React from 'react';

class ButtonDisconnect extends React.Component {
  constructor(){
    super();
  }
  handleClick(e){
    e.stopPropagation();
    window.dispatchEvent(new Event('connect_button'));
  }
  render() {
    return (
      <a onClick={this.handleClick} href="#"><span className="chat_button glyphicon glyphicon-off"></span></a>
    );
  }
}

export default ButtonDisconnect;
