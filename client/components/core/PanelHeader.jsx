import React from 'react';

class PanelHeader extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(){
    let evt = new CustomEvent('min_max_box', {detail: {box: this.props.box}});
    window.dispatchEvent(evt);
  }
  render() {
    return (
      <div onClick={this.handleClick} className="panel-heading top-bar">{this.props.children}</div>
    );
  }
}

export default PanelHeader;
