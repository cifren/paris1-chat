import React from 'react';

class SearchInput extends React.Component {
  constructor(props){
    super(props);
    this.handleSearch = this.handleSearch.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
  }
  handleSearch(){
      let evt = new CustomEvent('search_keypress', {detail: {search: document.getElementById('chat-search').value}});
      window.dispatchEvent(evt);
  }
  clearSearch(){
    document.getElementById('chat-search').value = "";
    this.handleSearch();
  }
  render() {
    let button = {float: "right", height: "34px", width: "34px"};
    let icon = (document.getElementById('chat-search') && document.getElementById('chat-search').value.length > 0) ? <a href="#" onClick={this.clearSearch} className="form-control-feedback"><span className="glyphicon glyphicon-remove"></span></a> : <span className="glyphicon glyphicon-search form-control-feedback"></span>
    return (
      <div className="search-container form-group has-feedback has-feedback-left">
        <input placeholder="Rechercher un utilisateur" onKeyUp={this.handleSearch} type="text" id="chat-search" className="form-control"/>
        {icon}
      </div>
    );
  }
}

export default SearchInput;
