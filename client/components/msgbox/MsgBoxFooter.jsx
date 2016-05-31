import React from 'react';
import PanelFooter from '../core/PanelFooter.jsx';
import InputArea from '../core/InputArea.jsx';

class MsgBoxFooter extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    return (
      <PanelFooter>
        <InputArea room={this.props.room}/>
      </PanelFooter>
    );
  }
}

export default MsgBoxFooter;
