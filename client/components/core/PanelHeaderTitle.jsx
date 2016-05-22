import React from 'react';

class PanelHeaderTitle extends React.Component {
  render() {
    return (
      <div className="panel_title">
        <h3 className="panel-title">{this.props.title}</h3>
      </div>
    );
  }
}

export default PanelHeaderTitle;
