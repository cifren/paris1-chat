import React from 'react';

class InputArea extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      'user_typing': false
    };
    this.sendMessage = this.sendMessage.bind(this);
    this.updateUserTyping = this.updateUserTyping.bind(this);
  }
  sendMessage(e){
    let message = document.getElementById('input-text').value;
    if (e.keyCode && e.keyCode !== 13){
      this.updateUserTyping();
      return;
    }
    if (e.keyCode){
      message = message.substring(0, message.length - 1);
    }
    if (message.length > 0){
      window.dispatchEvent(new CustomEvent('send_message', {
        detail: {
          room: this.props.room.room,
          text: message,
          receiver: this.props.room.penpal.uid
        }
      }));
      document.getElementById('input-text').value = '';
      this.updateUserTyping();
    }
  }

  updateUserTyping(){
    let isUserTyping = (document.getElementById('input-text').value.length !== 0) ? true : false;
    if (this.state.user_typing !== isUserTyping){
      console.log(isUserTyping);
      window.dispatchEvent(new CustomEvent('user_typing', {
        detail: {
          room: this.props.room.room,
          user_typing: isUserTyping,
          receiver: this.props.room.penpal.uid
        }
      }));
      this.setState({user_typing: isUserTyping});
    }
  }

  uploadFile(){

  }
  render() {

    return (
      <div className="input_container">
        <textarea onKeyUp={this.sendMessage} id="input-text" rows="1" placeholder="Taper votre message ici..."></textarea>
        <div className="input_send">
          <a onClick={this.sendMessage} href="#"><span className="glyphicon glyphicon-send"></span></a>
        </div>
        <div className="input_file_upload">
          <div>
            <a onClick={this.uploadFile} href="#"><span className="glyphicon glyphicon-paperclip"></span></a>
          </div>
        </div>
      </div>
    );
  }
}

export default InputArea;
