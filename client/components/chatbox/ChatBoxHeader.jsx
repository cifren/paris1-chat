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
    let dropDown;
    if (!this.props.minimised){
      dropDown = <DropDownStatus />;
    }
    return (
      <PanelHeader>
        <PanelHeaderTitleContainer>
          <UserStatus status={this.props.status}/>
          {dropDown}
          <PanelHeaderTitle title="Chat Paris 1"/>
        </PanelHeaderTitleContainer>
        <PanelHeaderButtonContainer>
          <ButtonMin />
          <ButtonDisconnect />
        </PanelHeaderButtonContainer>
      </PanelHeader>
    );
  }
}

export default ChatBoxHeader;
