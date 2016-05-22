import React from 'react';

class ButtonMin extends React.Component {
  handleClick(){
    window.dispatchEvent(new Event('button_min'));
  }
  render() {
    return (
      <a onClick={this.handleClick} href="#"><span data-toggle="tooltip" data-placement="top" title="Minimize" className="chat_button glyphicon glyphicon-minus icon_minim"></span></a>
    );
  }
}

export default ButtonMin;
