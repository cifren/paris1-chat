import React from 'react';

class SearchInput extends React.Component {
  handleFocus(){
    window.dispatchEvent(new Event('search_focus'));
  }
  handleBlur(){
    window.dispatchEvent(new Event('search_blur'));
  }
  handleSearch(){
    if (document.getElementById('search').value.length > 2){
      let evt = new CustomEvent('search_keypress', {detail: {search: document.getElementById('search').value}});
      window.dispatchEvent(evt);
    }
  }
  render() {
    return (
      <input onKeyUp={this.handleSearch} onFocus={this.handleFocus} onBlur={this.handleBlur} type="text" id="search" placeholder="Search..."/>
    );
  }
}

export default SearchInput;
