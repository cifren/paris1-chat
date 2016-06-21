import React from 'react';

class ButtonTabHome extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e){
    e.stopPropagation();

  }
  render() {
    return (
      <div className="tab-div">
        <a onClick={this.handleClick} href="#" data-toggle="tooltip" data-placement="top" title="Options"><span className="glyphicon glyphicon-home"></span></a>
      </div>
    );
  }
}

export default ButtonTabHome;
