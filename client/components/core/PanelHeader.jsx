import React from 'react';

class PanelHeader extends React.Component {
  render() {
    return (
      <div className="panel-heading top-bar">{this.props.children}</div>
    );
  }
}

export default PanelHeader;
