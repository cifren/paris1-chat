import React from 'react';

class PanelHeaderButtonContainer extends React.Component {
  render() {
    return (
      <div className="button_container col-md-4 col-xs-4">{this.props.children}</div>
    );
  }
}

export default PanelHeaderButtonContainer;
