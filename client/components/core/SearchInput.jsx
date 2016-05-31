import React from 'react';

class SearchInput extends React.Component {
  // handleFocus(){
  //   window.dispatchEvent(new Event('search_focus'));
  // }
  // handleBlur(){
  //   window.dispatchEvent(new Event('search_blur'));
  // }
  handleSearch(){
      let evt = new CustomEvent('search_keypress', {detail: {search: document.getElementById('search').value}});
      window.dispatchEvent(evt);
  }
  render() {
    return (
      <input onKeyUp={this.handleSearch} type="text" id="search" placeholder="Search..."/>
    );
  }
}

export default SearchInput;
