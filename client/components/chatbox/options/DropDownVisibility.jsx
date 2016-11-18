import React from 'react';

class DropDownVisibility extends React.Component {
  constructor(){
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    $('#dropDownVisibility').tooltip();
  }

  handleClick(e) {
    let selectedVisibility = e.target.className;
    window.dispatchEvent(new CustomEvent('change_visibility', {detail: selectedVisibility}));
  }

  render() {

    let label, title;
    let styleButton = {width: "125px"};

    switch(this.props.visibility){
      case "direction":
        label = "Direction(s)";
        let directionsString = "";
        for (let i in this.props.directionsLabels){
          directionsString += (i == 0) ? this.props.directionsLabels[i] : " ," + this.props.directionsLabels[i];
        }
        title = "Seuls les collègues de votre direction " + "(" + directionsString + ") peuvent vous trouver via la recherche du tchat";
      break;
      case "staff":
        label = "Personnels";
        title = "Seuls les personnels de l'université peuvent vous trouver via la recherche du tchat.";
      break;
      default:
        label = "Tout le monde";
        title = "Tout le monde peut vous trouver via la recherche du tchat.";
    }

    $('#dropDownVisibility').attr('data-original-title', title).tooltip();

    return (
      <div className="dropdown">
        <button style={styleButton} className="btn btn-default dropdown-toggle dropdownButton" type="button" id="dropDownVisibility" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" title={title}>
          {label} <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropDownVisibility">
          <li><a href="#" onClick={this.handleClick} className="direction">Direction(s)</a></li>
          <li><a href="#" onClick={this.handleClick} className="staff">Personnels</a></li>
          <li><a href="#" onClick={this.handleClick} className="everybody">Tout le monde</a></li>
        </ul>
      </div>
      );
  }
}

export default DropDownVisibility;
