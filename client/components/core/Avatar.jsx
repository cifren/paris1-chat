import React from 'react';

class Avatar extends React.Component {
  render() {
    let photoStyle = {"backgroundImage": "url(" + this.props.url + ")"};
    return (
      <div style={photoStyle} className="avatar"></div>
    );
  }
}

export default Avatar;
