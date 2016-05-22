import React from 'react';
import PanelHeader from '../core/PanelHeader.jsx';
import PanelHeaderTitleContainer from '../core/PanelHeaderTitleContainer.jsx';
import UserStatus from '../core/UserStatus.jsx';
import PanelHeaderTitle from '../core/PanelHeaderTitle.jsx';
import PanelHeaderButtonContainer from '../core/PanelHeaderButtonContainer.jsx';
import ButtonFav from '../core/ButtonFav.jsx';
import ButtonClose from '../core/ButtonClose.jsx';
import ButtonMin from '../core/ButtonMin.jsx';


class MsgBoxHeader extends React.Component {
  constructor(props){
    super(props);
  }
  render() {
    return (
      <PanelHeader>
        <PanelHeaderTitleContainer>
          <UserStatus status={this.props.room.penpal.status}/>
          <PanelHeaderTitle title={this.props.room.penpal.name}/>
        </PanelHeaderTitleContainer>
        <PanelHeaderButtonContainer>
          <ButtonFav room={this.props.room}/>
          <ButtonMin room={this.props.room}/>
          <ButtonClose room={this.props.room}/>
        </PanelHeaderButtonContainer>
      </PanelHeader>
    );
  }
}

export default MsgBoxHeader;
