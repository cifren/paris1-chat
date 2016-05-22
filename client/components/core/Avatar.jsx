import React from 'react';

class Avatar extends React.Component {
  render() {
    return (
      <div className="col-md-2 col-xs-2 avatar">
        <img src={this.props.url} className=" img-responsive "/>
      </div>
    );
  }
}

export default Avatar;
