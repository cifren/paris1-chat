import React from 'react';

class PanelBody extends React.Component {
  render() {
    return (
      <div className="panel-body msg_container_base">{this.props.children}</div>
    );
  }
}

export default PanelBody;
