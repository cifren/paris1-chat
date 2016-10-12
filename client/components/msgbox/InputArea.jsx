import React from 'react';

class InputArea extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      'user_typing': false
    };
    this.sendMessage = this.sendMessage.bind(this);
    this.updateUserTyping = this.updateUserTyping.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  sendMessage(e){
    let message = document.getElementById('input-text').value;
    if (e.keyCode && e.keyCode !== 13){
      this.updateUserTyping();
      return;
    }
    else if (e.keyCode && e.keyCode === 13){
      if (message.length === 1){
        document.getElementById('input-text').value = '';
        return;
      }
      message = message.substring(0, message.length - 1);
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
  }

  updateUserTyping(){
    let isUserTyping = (document.getElementById('input-text').value.length !== 0) ? true : false;
    if (this.state.user_typing !== isUserTyping){
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

  uploadFile(e){
    let file = e.target.files[0];
    if (typeof file === "undefined"){
      return;
    }
    if (file.size > 2048000000){
      alert("Impossible d'envoyer le fichier car ce dernier est trop volumineux. (Taille maximale 2048Mo)");
      return;
    }
    window.dispatchEvent(new CustomEvent("upload_file", {
      detail: {
        file: file,
        room: this.props.room.room,
        receiver: this.props.room.penpal
      }
    }));
  }

  render() {
    let styleDisplayNone = {"display": "none"};
    let progressBar;
    if (this.props.room.fileUpload){
      let styleProgressBar = {"width": this.props.room.fileUpload.progress + "%"};
      progressBar = <div className="progress">
                      <div className="progress-bar" role="progressbar" aria-valuenow={String(this.props.room.fileUpload.progress)} aria-valuemin="0" aria-valuemax="100" style={styleProgressBar}>
                      </div>
                    </div>;
    }
    return (
      <div className="input_container">
        <textarea onKeyUp={this.sendMessage} id="input-text" rows="1" placeholder="Taper votre message ici..."></textarea>
        <div className="input_send">
          <a onClick={this.sendMessage} href="#" title="Envoyer"><span className="glyphicon glyphicon-send"></span></a>
        </div>
        <div className="input_file_upload">
          <div>
            <a onClick={function(){document.getElementById("input_file").click();}} href="#" title="Joindre un fichier"><span className="glyphicon glyphicon-paperclip"></span></a>
            <input style={styleDisplayNone} id="input_file" type="file" onChange={this.uploadFile}/>
          </div>
        </div>
        {progressBar}
      </div>
    );
  }
}

export default InputArea;
