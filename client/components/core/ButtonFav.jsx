import React from 'react';

class ButtonFav extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e){
    e.stopPropagation();
    let evt = new CustomEvent('fav_button', {detail: {user: this.props.room.penpal, room: this.props.room.room}});
    window.dispatchEvent(evt);
  }
  render() {
    let favStyle = {"marginRight": "0px"};
    let favClass = (this.props.room.penpal.isFav) ? "chat_button glyphicon glyphicon-star icon_fav" : "chat_button glyphicon glyphicon-star-empty icon_fav";
    return (
      <a style={favStyle} onClick={this.handleClick} href="#" data-toggle="tooltip" data-placement="top" title="Add to favorites"><span className={favClass}></span></a>
    );
  }
}

export default ButtonFav;
