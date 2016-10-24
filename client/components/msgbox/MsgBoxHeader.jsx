import React from 'react';
import UserStatus from '../core/UserStatus.jsx';
import MsgBoxOptions from './MsgBoxOptions.jsx';
import ButtonBack from './ButtonBack.jsx';

class MsgBoxHeader extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    let styleDivUser = {"position": "relative",
                        "display": "block",
                        "padding": "10px 0px 10px 5px"};
    let styleButtonBack = {"float": "left"};
    let styleButtonFav = {"float": "right"};
    let styleTitle = {"overflow": "hidden",
                      "whiteSpace": "nowrap",
                      "textOverflow": "ellipsis",
                      "maxWidth": "163px"};
    return (
      <ul className="nav nav-tabs">
        <li style={styleButtonBack} role="presentation"><ButtonBack room={this.props.room}/></li>
        <li style={styleTitle} role="presentation">
          <div style={styleDivUser}>
            <UserStatus status={this.props.room.penpal.status}/>
            <div className="msgbox-title">
              {this.props.room.penpal.name}
            </div>
          </div>
        </li>
        <MsgBoxOptions room={this.props.room}/>
      </ul>
    );
  }
}

export default MsgBoxHeader;
