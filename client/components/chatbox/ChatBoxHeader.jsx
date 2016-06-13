import React from 'react';
import DropDownStatus from '../core/DropDownStatus.jsx';
import UserStatus from '../core/UserStatus.jsx';
import PanelHeader from '../core/PanelHeader.jsx';
import PanelHeaderTitleContainer from '../core/PanelHeaderTitleContainer.jsx';
import PanelHeaderTitle from '../core/PanelHeaderTitle.jsx';
import PanelHeaderButtonContainer from '../core/PanelHeaderButtonContainer.jsx';
import ButtonMin from '../core/ButtonMin.jsx';
import ButtonDisconnect from '../core/ButtonDisconnect.jsx';
import ButtonOption from '../core/ButtonOption.jsx';
import OptionModal from '../core/OptionModal.jsx';

class ChatBoxHeader extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    return (
      <PanelHeader box="chatbox">
        <PanelHeaderTitleContainer>
          <UserStatus status={this.props.status}/>
          <DropDownStatus />
          <PanelHeaderTitle title="Chat Paris 1"/>
        </PanelHeaderTitleContainer>
        <PanelHeaderButtonContainer>
          <ButtonOption />
        </PanelHeaderButtonContainer>
      </PanelHeader>
    );
  }
}

export default ChatBoxHeader;
