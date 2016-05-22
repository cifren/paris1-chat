import React from 'react';

class ButtonFav extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(){
    let evt = new CustomEvent('fav_button', {detail: {user: this.props.room.penpal, room: this.props.room.room}});
    window.dispatchEvent(evt);
  }
  render() {
    return (
      <a onClick={this.handleClick} href="#" data-toggle="tooltip" data-placement="top" title="Add to favorites"><span className="chat_button glyphicon glyphicon-star-empty icon_fav"></span></a>
    );
  }
}

export default ButtonFav;
