import React from 'react';

class InputArea extends React.Component {
  constructor(props){
    super(props);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }
  handleKeyUp(e){
    if (e.keyCode === 13 && e.target.value.length > 0){
      window.dispatchEvent(new CustomEvent('send_message', {
        detail: {
          room: this.props.room.room,
          text: e.target.value,
          receiver: this.props.room.penpal.uid
        }
      }));
      e.target.value = '';
    }
  }
  render() {
    return (
      <div className="input_container">
        <textarea onKeyUp={this.handleKeyUp} className="input_text" rows="2" placeholder="Write your message here..."></textarea>
        <div className="input_file_upload">
          <a href="#"><span className="glyphicon glyphicon-paperclip"></span></a>
        </div>
      </div>
    );
  }
}

export default InputArea;
