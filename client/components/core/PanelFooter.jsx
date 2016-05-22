import React from 'react';

class PanelFooter extends React.Component {
  render() {
    return (
      <div className="panel-footer">{this.props.children}</div>
    );
  }
}

export default PanelFooter;
