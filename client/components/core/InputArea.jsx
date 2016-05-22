import React from 'react';

class InputArea extends React.Component {
  render() {
    return (
      <div className="input_container">
        <textarea className="input_text" rows="2" placeholder="Write your message here..."></textarea>
        <div className="input_file_upload">
          <a href="#"><span className="glyphicon glyphicon-paperclip"></span></a>
        </div>
      </div>
    );
  }
}

export default InputArea;
