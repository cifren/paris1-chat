import React from 'react';

class ButtonFav extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e){
    window.dispatchEvent(new CustomEvent('fav_button', {detail: {user: this.props.room.penpal}}));
  }
  render() {
    let favStyle = {"marginRight": "0px"};
    let favClass = (this.props.room.penpal.isFav) ? "chat_button glyphicon glyphicon-star icon_fav" : "chat_button glyphicon glyphicon-star-empty icon_fav";
    let favTitle = (this.props.room.penpal.isFav) ? "Retirer des favoris" : "Ajouter aux favoris";
    return (
      <a style={favStyle} onClick={this.handleClick} href="#" title={favTitle}><span className={favClass}></span></a>
    );
  }
}

export default ButtonFav;
