import React from 'react';

class MsgBoxOptions extends React.Component {
  constructor(props){
    super(props);
    this.favClick = this.favClick.bind(this);
    this.delConvClick = this.delConvClick.bind(this);
  }
  favClick(e){
    window.dispatchEvent(new CustomEvent('fav_button', {detail: {user: this.props.room.penpal}}));
  }
  delConvClick(e){
    window.dispatchEvent(new CustomEvent('del_conversation', {detail: {room: this.props.room.room, penpal: this.props.room.penpal}}));
  }
  render() {
    let styleOptionLi = {"float": "right"};
    let styleOptionA = {"marginRight": "0px"};
    let favTitle = (this.props.room.penpal.isFav) ? "Retirer des favoris" : "Ajouter aux favoris";
    let favLink = (!this.props.room.penpal.listeRouge || this.props.user.affiliationType === "staff") ? <li><a onClick={this.favClick} href="#">{favTitle}</a></li> : null;
    let delConvLink = (this.props.room.messages.length > 0) ? <li><a onClick={this.delConvClick} href="#">Effacer la discussion</a></li> : null;


    return (
      <li style={styleOptionLi} role="presentation" className="dropdown">
        <a style={styleOptionA} href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="glyphicon glyphicon-option-vertical"></span></a>
        <ul className="dropdown-menu dropdown-menu-right">
          {favLink}
          {delConvLink}
        </ul>
      </li>
    );
  }
}

export default MsgBoxOptions;
