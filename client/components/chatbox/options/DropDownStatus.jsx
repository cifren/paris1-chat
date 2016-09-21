import React from 'react';
import UserStatus from '../../core/UserStatus.jsx';

class DropDownStatus extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(e) {
    let selectedStatus = e.target.className;
    if (selectedStatus.indexOf("online") > -1){
      selectedStatus = "online";
    }
    else if (selectedStatus.indexOf("busy") > -1) {
      selectedStatus = "busy";
    }
    else {
      selectedStatus = "invisible";
    }
    window.dispatchEvent(new CustomEvent('change_status', {detail: selectedStatus}));
  }
  render() {
    let curStatus = "En ligne";
    if (this.props.status === "busy"){
      curStatus = "Occupé";
    }
    else if (this.props.status === "invisible"){
      curStatus = "Invisible";
    }
    return (
      <div className="dropdown">
        <button className="btn btn-default dropdown-toggle dropdownButton" type="button" id="dropDownStatus" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          <UserStatus status={this.props.status}/>{curStatus} <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropDownStatus">
          <li><a href="#" onClick={this.handleClick} className="online"><UserStatus status="online"/>En ligne</a></li>
          <li><a href="#" onClick={this.handleClick} className="busy"><UserStatus status="busy"/>Occupé</a></li>
          <li><a href="#" onClick={this.handleClick} className="offline"><UserStatus status="offline"/>Invisible</a></li>
        </ul>
      </div>
    );
  }
}

export default DropDownStatus;
