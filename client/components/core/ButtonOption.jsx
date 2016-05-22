import React from 'react';

class ButtonOption extends React.Component {
  render() {
    return (
      <a href="#" data-toggle="modal" data-target="#optionModal" title="Options"><span className="chat_button glyphicon glyphicon-option-vertical icon_fav"></span></a>
    );
  }
}

export default ButtonOption;
