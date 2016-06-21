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
    let style = {display: "inline", float: "right"};
    return (
      <div style={style}>
        <a onClick={this.handleClick} href="#" data-toggle="tooltip" data-placement="top" title="Options"><span className="chat_button glyphicon glyphicon-option-vertical"></span></a>
      </div>
    );
  }
}

export default ButtonOption;
