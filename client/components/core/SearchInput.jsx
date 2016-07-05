import React from 'react';

class SearchInput extends React.Component {

  handleSearch(){
      let evt = new CustomEvent('search_keypress', {detail: {search: document.getElementById('search').value}});
      window.dispatchEvent(evt);
  }
  render() {
    return (
      <div className="search-container form-group has-feedback has-feedback-left">
        <input placeholder="Rechercher un utilisateur" onKeyUp={this.handleSearch} type="text" id="search" className="form-control"/>
        <span className="glyphicon glyphicon-search form-control-feedback"></span>
      </div>
    );
  }
}

export default SearchInput;
