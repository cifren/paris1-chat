import React from 'react';

class ButtonOption extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e){
    e.stopPropagation();

  }
  render() {
    return (
      <a onClick={this.handleClick} href="#" data-toggle="tooltip" data-placement="top" title="Options"><span className="chat_button glyphicon glyphicon-option-vertical"></span></a>
    );
  }
}

export default ButtonOption;
