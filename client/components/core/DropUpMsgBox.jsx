import React from 'react';
import RoomSelector from './RoomSelector.jsx';

class DropUpMsgBox extends React.Component {
  constructor(){
    super();
  }
  render() {
    let hiddenMsgBox;
    if (this.props.rooms){
      hiddenMsgBox = Object.keys(this.props.rooms).map((room) => {
        return <RoomSelector key={room} room={this.props.rooms[room]} />
      });
    }
    return (
      <div className="dropup">
        <button className="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          Other rooms 
          <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropDownStatus">
          {hiddenMsgBox}
        </ul>
      </div>
    );
  }
}

export default DropUpMsgBox;
