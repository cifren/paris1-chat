import React from 'react';

class PanelHeaderTitleContainer extends React.Component {
  render() {
    return (
      <div className="title_container col-md-8 col-xs-8">{this.props.children}</div>
    );
  }
}

export default PanelHeaderTitleContainer;
