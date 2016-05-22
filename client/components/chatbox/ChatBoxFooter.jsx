import React from 'react';
import PanelFooter from '../core/PanelFooter.jsx';
import SearchInput from '../core/SearchInput.jsx';

class ChatBoxFooter extends React.Component {
  render() {
    return (
      <PanelFooter>
        <SearchInput />
      </PanelFooter>
    );
  }
}

export default ChatBoxFooter;
